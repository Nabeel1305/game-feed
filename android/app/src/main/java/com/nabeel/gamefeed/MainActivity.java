package com.nabeel.gamefeed;

import android.app.Activity;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * The whole app is one web view showing the feed; each game runs in a frame inside it.
 *
 * The games exist twice on the phone: the copy that came inside the APK (assets), and a folder that Sync keeps
 * equal to what GitHub publishes, so new games arrive without installing anything. The app shows the folder when
 * it is complete and not older than the built-in copy, and the built-in copy otherwise. The feed page itself is
 * always the APK's own (Sync puts a copy of it in the folder): the app only changes when a new APK is installed.
 *
 * New games never reload the page: the feed is told, and adds them to what it is showing. The page is only ever
 * loaded when the app starts, or once, at a quiet moment, to move from the built-in copy to the folder (it opens
 * on the card he was looking at).
 */
public class MainActivity extends Activity {
    /** Where GitHub publishes the newest games: the "app-v2" branch of the project (see .github/workflows/check.yml). */
    private static final String PUBLISHED = "https://raw.githubusercontent.com/Nabeel1305/game-feed/app-v2/";
    private static final long CHECK_EVERY_MS = 10 * 60 * 1000L;
    private static final long START_WITHIN_MS = 12000L;

    private WebView web;
    private File folder;                        // the fetched copy
    private Sync.Manifest inApp;                // what came inside the APK
    private final Handler ui = new Handler(Looper.getMainLooper());
    private final AtomicBoolean checking = new AtomicBoolean(false);
    private long lastCheck = 0;
    private boolean folderFailed = false;       // the fetched copy did not start: use the built-in one until the app is opened again
    private volatile boolean feedUp = false;    // the page on screen has said it is running
    private int loads = 0;
    private String shown = "";                  // the address of the page on screen
    private String lastResult = null;           // what the last check found, as JSON for the page
    private int engineDeaths = 0;
    /** While the app stays open, look for new games every so often too. */
    private final Runnable again = new Runnable() {
        @Override public void run() { checkForGames(); ui.postDelayed(this, CHECK_EVERY_MS); }
    };

    @Override
    protected void onCreate(Bundle saved) {
        super.onCreate(saved);
        folder = new File(getNoBackupFilesDir(), "app");
        final Thread.UncaughtExceptionHandler before = Thread.getDefaultUncaughtExceptionHandler();
        Thread.setDefaultUncaughtExceptionHandler((thread, error) -> {
            try { noteProblem("the app stopped: " + error + where(error)); } catch (Throwable ignored) { }
            if (before != null) before.uncaughtException(thread, error);
        });
        try { inApp = Sync.read(getAssets().open("manifest.txt")); } catch (Exception e) { inApp = null; }
        web = makeWeb();
        setContentView(web);
        loadFeed();
    }

    private WebView makeWeb() {
        WebView w = new WebView(this);
        w.setBackgroundColor(Color.parseColor("#0B0C10"));
        WebSettings s = w.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setTextZoom(100);
        w.setOverScrollMode(View.OVER_SCROLL_NEVER);
        w.setVerticalScrollBarEnabled(false);
        w.setHorizontalScrollBarEnabled(false);
        // a thumb held on the screen is part of some games: no long-press buzz, no text selection
        w.setHapticFeedbackEnabled(false);
        w.setOnLongClickListener(v -> true);
        w.addJavascriptInterface(new Bridge(this), "GameNative");
        w.setWebViewClient(new WebViewClient() {
            /** The phone can shut the web engine (usually for memory). Without this the whole app would close. */
            @Override
            public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                noteProblem("the web engine " + (detail != null && detail.didCrash() ? "crashed" : "was shut by the phone (most likely low memory)"));
                if (view != web) return true;
                engineDeaths++;
                ViewGroup parent = (ViewGroup) web.getParent();
                if (parent != null) parent.removeView(web);
                web.destroy();
                if (engineDeaths > 3) { finish(); return true; }       // it keeps dying: close, do not spin
                web = makeWeb();
                setContentView(web);
                shown = "";
                loadFeed();
                return true;
            }
        });
        return w;
    }

    void loadFeed() { loadFeed(""); }

    /**
     * Shows the newest copy of the games that is on the phone, opening on the card with this id if there is one.
     * Always a real load. The same address with only "#card" changed would be a jump inside the page already on
     * screen, not a load (that was the fault in builds 15 to 18, which then gave up on a feed that was running):
     * so a page that is already on screen is reloaded as it is, and "#card" is only added when the page is a different one.
     */
    void loadFeed(String at) {
        Sync.Manifest local = Sync.readLocal(folder);
        final boolean fromFolder = !folderFailed && Sync.usable(folder, local) && (inApp == null || local.build >= inApp.build);
        final String url = fromFolder ? Uri.fromFile(new File(folder, "index.html")).toString() : "file:///android_asset/index.html";
        final String card = at == null ? "" : at.replaceAll("[^A-Za-z0-9_-]", "");
        feedUp = false;
        final int mine = ++loads;
        if (url.equals(shown)) web.reload(); else web.loadUrl(card.isEmpty() ? url : url + "#" + card);
        shown = url;
        if (fromFolder) ui.postDelayed(() -> {
            // The fetched copy has not said it is running. Before giving up on it, ask the page itself: a feed that is
            // on screen must never be thrown away under him (an early build did exactly that and it looked like a crash).
            if (mine != loads || feedUp) return;
            web.evaluateJavascript("!!(window.__feed && window.__feed.cur && window.__feed.cur())", alive -> {
                if (mine != loads || feedUp) return;
                if ("true".equals(alive)) { feedUp = true; tellPage(); }
                else { folderFailed = true; noteProblem("the fetched copy of the feed did not start; used the built-in one"); loadFeed(); }
            });
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

    /** Looks for new games in the background. The page is told what was found and adds the new games itself. */
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

    /* ---- a note of the last thing that went wrong, shown at the bottom of the games list so he can read it out ---- */

    private File problemFile() { return new File(getFilesDir(), "last-problem.txt"); }

    void noteProblem(String what) {
        try {
            String when = new SimpleDateFormat("d MMM HH:mm", Locale.US).format(new Date());
            String text = when + " " + what.replaceAll("[^A-Za-z0-9 .,:;_/()$-]", " ");
            if (text.length() > 300) text = text.substring(0, 300);
            FileOutputStream out = new FileOutputStream(problemFile());
            try { out.write(text.getBytes(StandardCharsets.UTF_8)); } finally { out.close(); }
        } catch (Throwable ignored) { }
    }

    String lastProblem() {
        try {
            File f = problemFile();
            if (!f.isFile() || f.length() > 4096) return "";
            byte[] buf = new byte[(int) f.length()];
            FileInputStream in = new FileInputStream(f);
            try { int n = in.read(buf); return n <= 0 ? "" : new String(buf, 0, n, StandardCharsets.UTF_8); } finally { in.close(); }
        } catch (Throwable e) {
            return "";
        }
    }

    private static String where(Throwable e) {
        StackTraceElement[] st = e.getStackTrace();
        for (StackTraceElement s : st) if (s.getClassName().startsWith("com.nabeel.")) return " at " + s.getClassName().replace("com.nabeel.gamefeed.", "") + "." + s.getMethodName() + ":" + s.getLineNumber();
        return st.length > 0 ? " at " + st[0].getClassName() + "." + st[0].getMethodName() + ":" + st[0].getLineNumber() : "";
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
