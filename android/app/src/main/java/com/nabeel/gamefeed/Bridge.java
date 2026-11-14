package com.nabeel.gamefeed;

import android.app.Activity;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import android.webkit.JavascriptInterface;
import org.json.JSONArray;

/** Exposed to the feed and to every game as window.GameNative */
public class Bridge {
    private final Activity act;

    Bridge(Activity a) { act = a; }

    /** pattern is what a page would give navigator.vibrate: "30" or "[20,40,20]" (buzz, gap, buzz...). */
    @JavascriptInterface
    public void vibrate(String pattern) {
        try {
            Vibrator v;
            if (Build.VERSION.SDK_INT >= 31) v = ((VibratorManager) act.getSystemService(Activity.VIBRATOR_MANAGER_SERVICE)).getDefaultVibrator();
            else v = (Vibrator) act.getSystemService(Activity.VIBRATOR_SERVICE);
            if (v == null || !v.hasVibrator()) return;
            String p = pattern.trim();
            if (p.startsWith("[")) {
                JSONArray a = new JSONArray(p);
                if (a.length() == 0) return;
                long[] t = new long[a.length() + 1];
                t[0] = 0;
                for (int k = 0; k < a.length(); k++) t[k + 1] = Math.max(0, a.getLong(k));
                v.vibrate(VibrationEffect.createWaveform(t, -1));
            } else {
                long ms = (long) Double.parseDouble(p);
                if (ms <= 0) { v.cancel(); return; }
                v.vibrate(VibrationEffect.createOneShot(ms, ms < 30 ? 90 : VibrationEffect.DEFAULT_AMPLITUDE));
            }
        } catch (Exception ignored) {}
    }

    /** "Done for now" on the break card: put the app away (it stays where he left it). */
    @JavascriptInterface
    public void close() { act.runOnUiThread(() -> act.moveTaskToBack(true)); }
}
