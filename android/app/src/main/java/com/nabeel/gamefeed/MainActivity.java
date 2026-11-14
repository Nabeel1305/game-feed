package com.nabeel.gamefeed;

import android.app.Activity;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.view.View;
import android.webkit.WebSettings;
import android.webkit.WebView;
import java.io.File;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * The whole app is one web view showing the feed; each game runs in a frame inside it.
 *
 * The feed and the games exist twice on the phone: the copy that came inside the APK (assets), and a folder that
 * Sync keeps equal to what GitHub publishes, so new games arrive without installing anything. The app shows the
 * folder when it is complete and not older than the built-in copy, and the built-in copy otherwise.
 */
public class MainActivity extends Activity {
    /** Where GitHub publishes the newest feed and games: the "app" branch of the project (see .github/workflows/check.yml). */
    private static final String PUBLISHED = "https://raw.githubusercontent.com/Nabeel1305/game-feed/app/";
    private static final long CHECK_EVERY_MS = 10 * 60 * 1000L;
    private static final long START_WITHIN_MS = 12000L;

    private WebView web;
    private File folder;                        // the fetched copy
    private Sync.Manifest inApp;                // what came inside the APK
    private final Handler ui = new Handler(Looper.getMainLooper());
    private final AtomicBoolean checking = new AtomicBoolean(false);
    private long lastCheck = 0;
    private boolean fromFolder = false;         // the page on screen came from the fetched copy
    private boolean folderFailed = false;       // the fetched copy did not start: use the built-in one until the app is opened again
    private volatile boolean feedUp = false;    // the page on screen has said it is running
    private int loads = 0;
    private String lastResult = null;           // what the last check found, as JSON for the page
    /** While the app stays open, look for new games every so often too. */
    private final Runnable again = new Runnable() {
        @Override public void run() { checkForGames(); ui.postDelayed(this, CHECK_EVERY_MS); }
    };

    @Override
    protected void onCreate(Bundle saved) {
        super.onCreate(saved);
        folder = new File(getNoBackupFilesDir(), "app");
        try { inApp = Sync.read(getAssets().open("manifest.txt")); } catch (Exception e) { inApp = null; }
        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#0B0C10"));
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setTextZoom(100);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.setVerticalScrollBarEnabled(false);
        web.setHorizontalScrollBarEnabled(false);
        // a thumb held on the screen is part of some games: no long-press buzz, no text selection
        web.setHapticFeedbackEnabled(false);
        web.setOnLongClickListener(v -> true);
        web.addJavascriptInterface(new Bridge(this), "GameNative");
        setContentView(web);
        loadFeed("");
    }

    /**
     * Shows the newest copy of the feed that is on the phone.
     * @param at the id of the game whose card should come up first ("" for the feed's own choice)
     */
    void loadFeed(String at) {
        Sync.Manifest local = Sync.readLocal(folder);
        fromFolder = !folderFailed && Sync.usable(folder, local) && (inApp == null || local.build >= inApp.build);
        feedUp = false;
        final int mine = ++loads;
        final String card = at != null && at.matches("[A-Za-z0-9-]{1,64}") ? "#" + at : "";
        if (mine > 1) web.clearCache(false);
        web.loadUrl((fromFolder ? Uri.fromFile(new File(folder, "index.html")).toString() : "file:///android_asset/index.html") + card);
        if (fromFolder) ui.postDelayed(() -> {
            if (mine == loads && !feedUp) { folderFailed = true; loadFeed(""); }    // the fetched copy never started: fall back
        }, START_WITHIN_MS);
    }

    /** Called (from the page) once the feed is running. */
    void feedIsUp() {
        feedUp = true;
        ui.post(this::tellPage);
    }

    private void tellPage() {
        if (web != null && feedUp && lastResult != null)
            web.evaluateJavascript("window.gameFeedUpdate && window.gameFeedUpdate(" + lastResult + ")", null);
    }

    /** Looks for new games in the background. The page is told what was found and decides when to show it. */
    private void checkForGames() {
        if (!checking.compareAndSet(false, true)) return;
        lastCheck = SystemClock.elapsedRealtime();
        new Thread(() -> {
            String json;
            try {
                json = Sync.run(PUBLISHED, folder, path -> getAssets().open(path), inApp).json();
            } catch (Throwable t) {
                json = "{\"ok\":false,\"changed\":false,\"error\":\"stopped\"}";
            } finally {
                checking.set(false);
            }
            final String found = json;
            ui.post(() -> { lastResult = found; tellPage(); });
        }, "feed-update").start();
    }

    /** Back first closes the games list or pauses the running game; only then does it leave the app. */
    @Override
    public void onBackPressed() {
        web.evaluateJavascript("(window.gameFeedBack && window.gameFeedBack()) ? 1 : 0", v -> {
            if (!"1".equals(v)) moveTaskToBack(true);
        });
    }

    @Override
    protected void onPause() {
        ui.removeCallbacks(again);
        web.evaluateJavascript("window.gameFeedHide && window.gameFeedHide()", null);   // freeze the game and its sound
        web.onPause();
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
        if (lastCheck == 0 || SystemClock.elapsedRealtime() - lastCheck > CHECK_EVERY_MS) checkForGames();
        ui.removeCallbacks(again);
        ui.postDelayed(again, CHECK_EVERY_MS);
    }

    @Override
    protected void onDestroy() {
        ui.removeCallbacksAndMessages(null);
        super.onDestroy();
    }
}
