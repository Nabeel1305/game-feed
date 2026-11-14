package com.nabeel.gamefeed;

import java.io.File;
import java.io.FileInputStream;

/**
 * Runs the phone app's updater (Sync.java) on any computer, for tools/test_sync.py.
 * Usage: SyncCli <published address ending in /> <folder to keep up to date> [folder that plays the part of the APK]
 * Prints the result as one line of JSON.
 */
public final class SyncCli {
    public static void main(String[] a) throws Exception {
        final File apk = a.length > 2 ? new File(a[2]) : null;
        Sync.Manifest inApp = null;
        Sync.Bundled bundled = null;
        if (apk != null) {
            inApp = Sync.read(new FileInputStream(new File(apk, "manifest.txt")));
            bundled = path -> new FileInputStream(new File(apk, path));
        }
        Sync.Result r = Sync.run(a[0], new File(a[1]), bundled, inApp);
        Sync.Manifest local = Sync.readLocal(new File(a[1]));
        System.out.println("{\"result\":" + r.json() + ",\"usable\":" + Sync.usable(new File(a[1]), local) + ",\"localBuild\":" + local.build + "}");
    }
}
