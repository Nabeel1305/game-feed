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
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * The whole app is one web view showing the feed; each game runs in a frame inside it.
 *
 * The feed runs from a folder on the phone. When the app starts, the folder is first brought up to what came inside
 * the APK (Sync.seed: the feed page and the core games, no internet needed), so the feed never has to move there
 * later; the copy inside the APK itself is only shown if the folder cannot be made. Sync then keeps the folder's
 * list of games, the core games and the games he has saved equal to what GitHub publishes. Every other game is
 * fetched when its card comes up (it needs the internet) and cleared away the next time the app starts, unless
 * he saves it from the Games list. The feed page itself is always the APK's own: the app only changes when a new
 * APK is installed.
 *
 * New games never reload the page: the feed is told, and adds them to what it is showing.
 */
public class MainActivity extends Activity {
    /** Where GitHub publishes the newest games: the "app-v2" branch of the project (see .github/workflows/check.yml). */
    private static final String PUBLISHED = "https://raw.githubusercontent.com/Nabeel1305/game-feed/app-v2/";
    private static final long CHECK_EVERY_MS = 10 * 60 * 1000L;
    private static final long CHECK_NO_SOONER_MS = 20 * 1000L;     // when the feed itself asks for a check
    private static final long CHECK_ON_RETURN_MS = 60 * 1000L;     // coming back to the app looks for new games, if the last look was over a minute ago
    private static final long START_WITHIN_MS = 12000L;
    private static final long SET_UP_WITHIN_MS = 4000L;

    private WebView web;
    private File folder;                        // the fetched copy
    private Sync.Manifest inApp;                // what came inside the APK
    private final Sync.Bundled bundled = path -> getAssets().open(path);
    private final Handler ui = new Handler(Looper.getMainLooper());
    /**
     * Everything that touches the folder happens on this one thread, one thing after another, for as long as the app
     * is in memory: even if the phone closes this screen and makes it again, two things never write the folder at once.
     */
    private static final ExecutorService WORK = Executors.newSingleThreadExecutor(r -> {
        Thread t = new Thread(r, "feed-folder");
        t.setDaemon(true);
        return t;
    });
    private volatile boolean gone = false;      // this screen has been closed: nothing more is said to its page
    private final AtomicBoolean checking = new AtomicBoolean(false);
    private long lastCheck = 0;
    private boolean folderFailed = false;       // the fetched copy did not start: use the built-in one until the app is opened again
    private volatile boolean feedUp = false;    // the page on screen has said it is running
    private volatile int loads = 0;             // how many times the feed has been loaded (only changed on the main thread)
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
        // First the folder: bring it up to this APK (only after an install or an update is there anything to copy),
        // and clear away games that were only fetched to be played last time. Then show the feed. If that takes too
        // long or goes wrong, the feed is shown anyway, from whatever copy works.
        try {
            WORK.execute(() -> {
                try {
                    if (inApp != null && !gone) {
                        Sync.Result r = Sync.seed(folder, bundled, inApp);
                        if (!r.ok) noteProblem("could not set up the games folder: " + r.error);
                        Set<String> core = Sync.gamesIn(inApp);
                        // (an app with no core games inside cannot be right: clear nothing. And nothing is cleared once
                        // the feed is on screen: it may already be showing those games.)
                        if (!core.isEmpty() && loads == 0) Sync.prune(folder, core, Sync.kept(folder));
                    }
                } catch (Throwable t) {
                    noteProblem("could not set up the games folder: " + t);
                } finally {
                    ui.post(() -> { if (!gone && loads == 0) loadFeed(); });
                }
            });
        } catch (Throwable t) {
            noteProblem("could not set up the games folder: " + t);
        }
        ui.postDelayed(() -> { if (!gone && loads == 0) loadFeed(); }, SET_UP_WITHIN_MS);
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
        if (!fromFolder && url.equals(shown)) return;      // already showing the copy inside the APK and there is nothing better: leave it be
        feedUp = false;
        final int mine = ++loads;
        if (url.equals(shown)) web.reload(); else web.loadUrl(card.isEmpty() ? url : url + "#" + card);
        shown = url;
        if (fromFolder) ui.postDelayed(() -> {
            // The fetched copy has not said it is running. Before giving up on it, ask the page itself: a feed that is
            // on screen must never be thrown away under him (an early build did exactly that and it looked like a crash).
            if (gone || mine != loads || feedUp) return;
            web.evaluateJavascript("!!(window.__feed && window.__feed.cur && window.__feed.cur())", alive -> {
                if (gone || mine != loads || feedUp) return;
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
        if (web != null && !gone && feedUp && lastResult != null)
            web.evaluateJavascript("window.gameFeedUpdate && window.gameFeedUpdate(" + lastResult + ")", null);
    }

    /** Looks for new games in the background. The page is told what was found and adds the new games itself. */
    private void checkForGames() {
        if (!checking.compareAndSet(false, true)) return;
        lastCheck = SystemClock.elapsedRealtime();
        try {
            WORK.execute(() -> {
                if (gone) { checking.set(false); return; }
                String json;
                try {
                    json = Sync.run(PUBLISHED, folder, bundled, inApp).json();
                } catch (Throwable t) {
                    json = "{\"ok\":false,\"changed\":false,\"error\":\"stopped\"}";
                } finally {
                    checking.set(false);
                }
                final String found = json;
                ui.post(() -> { lastResult = found; tellPage(); });
            });
        } catch (Throwable t) {
            checking.set(false);
        }
    }

    /**
     * The feed asks for a check (he tapped "Check for new games", or the feed thinks the internet may be back).
     * Not more often than every 20 seconds: sooner than that, the feed is simply told the last answer again.
     */
    void checkNow() {
        ui.post(() -> {
            if (lastCheck == 0 || SystemClock.elapsedRealtime() - lastCheck > CHECK_NO_SOONER_MS) checkForGames();
            else if (!checking.get()) tellPage();
        });
    }

    /* ---- which games are on the phone: the core games (inside the APK), the ones he saved, and the ones fetched to play ---- */

    private static String list(Set<String> ids) {
        StringBuilder b = new StringBuilder("[");
        for (String id : ids) if (Sync.validId(id)) b.append(b.length() > 1 ? "," : "").append('"').append(id).append('"');
        return b.append(']').toString();
    }

    /** For the page: {"core":[...],"saved":[...],"here":[...]} (ids of games). */
    String onPhone() {
        try {
            Set<String> here = Sync.onPhone(folder), saved = Sync.kept(folder);
            saved.retainAll(here);
            return "{\"core\":" + list(Sync.gamesIn(inApp)) + ",\"saved\":" + list(saved) + ",\"here\":" + list(here) + "}";
        } catch (Throwable t) {
            return "{}";
        }
    }

    private void tellGame(String id, String why, boolean ok, String error) {
        final boolean here = Sync.onPhone(folder).contains(id), saved = here && Sync.kept(folder).contains(id);
        final String json = "{\"id\":\"" + id + "\",\"why\":\"" + why + "\",\"ok\":" + ok + ",\"here\":" + here + ",\"saved\":" + saved
                + ",\"error\":\"" + (error == null ? "" : error.replaceAll("[^A-Za-z0-9 .,:_/()-]", " ")) + "\"}";
        ui.post(() -> { if (web != null && !gone) web.evaluateJavascript("window.gameFeedGame && window.gameFeedGame(" + json + ")", null); });
    }

    /** Fetches a game so it can be played now; with keep, it is also saved: it stays on the phone and works with no internet. */
    void wantGame(final String id, final boolean keep) {
        if (!Sync.validId(id)) return;
        final String why = keep ? "save" : "play";
        try {
            WORK.execute(() -> {
                if (gone) return;
                try {
                    Sync.Result r = Sync.fetchGame(PUBLISHED, folder, id, bundled, inApp);
                    boolean here = r.ok || Sync.onPhone(folder).contains(id);      // no internet, but it is already here: saving still works
                    if (keep && here && !Sync.setKept(folder, id, true)) { tellGame(id, why, false, "could not save"); return; }
                    tellGame(id, why, keep ? here : r.ok || here, r.error);
                } catch (Throwable t) {
                    tellGame(id, why, false, String.valueOf(t));
                }
            });
        } catch (Throwable t) {
            tellGame(id, why, false, "busy");
        }
    }

    /** Stops keeping a saved game. It stays for now, and is cleared away the next time the app starts. */
    void forgetGame(final String id) {
        if (!Sync.validId(id)) return;
        try {
            WORK.execute(() -> tellGame(id, "forget", Sync.setKept(folder, id, false), ""));
        } catch (Throwable t) {
            tellGame(id, "forget", false, "busy");
        }
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
        if (lastCheck == 0 || SystemClock.elapsedRealtime() - lastCheck > CHECK_ON_RETURN_MS) checkForGames();
        ui.removeCallbacks(again);
        ui.postDelayed(again, CHECK_EVERY_MS);
    }

    @Override
    protected void onDestroy() {
        gone = true;
        ui.removeCallbacksAndMessages(null);
        super.onDestroy();
    }
}
