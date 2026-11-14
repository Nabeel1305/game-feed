package com.nabeel.gamefeed;

import android.app.Activity;
import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebSettings;
import android.webkit.WebView;

/** The whole app is one web view showing the feed (assets/index.html); each game runs in a frame inside it. */
public class MainActivity extends Activity {
    private WebView web;

    @Override
    protected void onCreate(Bundle saved) {
        super.onCreate(saved);
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
        if (saved != null) web.restoreState(saved);
        else web.loadUrl("file:///android_asset/index.html");
    }

    @Override
    protected void onSaveInstanceState(Bundle out) { super.onSaveInstanceState(out); web.saveState(out); }

    /** Back first closes the games list or pauses the running game; only then does it leave the app. */
    @Override
    public void onBackPressed() {
        web.evaluateJavascript("(window.gameFeedBack && window.gameFeedBack()) ? 1 : 0", v -> {
            if (!"1".equals(v)) moveTaskToBack(true);
        });
    }

    @Override
    protected void onPause() {
        web.evaluateJavascript("window.gameFeedHide && window.gameFeedHide()", null);   // freeze the game and its sound
        web.onPause();
        super.onPause();
    }

    @Override
    protected void onResume() { super.onResume(); web.onResume(); }
}
