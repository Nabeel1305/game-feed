package com.nabeel.gamefeed;

import java.io.File;
import java.io.FileInputStream;

/**
 * Runs the phone app's updater (Sync.java) on any computer, for tools/test_sync.py.
 * Usage: SyncCli <published address ending in /> <folder to keep up to date> [folder that plays the part of the APK]
 *        SyncCli seed <folder> <apk folder>                    bring the folder up to the APK, with no internet
 *        SyncCli prune <folder> <apk folder>                   clear games that were only fetched to be played
 *        SyncCli fetch <address> <folder> <game id> [apk]      fetch one game so it can be played
 *        SyncCli keep|forget <folder> <game id>                save a game, or let it go
 *        SyncCli onphone <folder> [apk]                        what is on the phone
 * Prints the result as one line of JSON.
 */
public final class SyncCli {
    private static String list(java.util.Collection<String> ids) {
        StringBuilder b = new StringBuilder("[");
        for (String id : ids) b.append(b.length() > 1 ? "," : "").append('"').append(id).append('"');
        return b.append(']').toString();
    }

    private static String tail(File dir) {
        Sync.Manifest local = Sync.readLocal(dir);
        return ",\"usable\":" + Sync.usable(dir, local) + ",\"localBuild\":" + local.build + ",\"here\":" + list(Sync.onPhone(dir)) + ",\"saved\":" + list(Sync.kept(dir)) + "}";
    }

    public static void main(String[] a) throws Exception {
        String cmd = a[0];
        if (cmd.equals("seed") || cmd.equals("prune") || cmd.equals("onphone")) {
            final File dir = new File(a[1]), apk = a.length > 2 ? new File(a[2]) : null;
            Sync.Manifest inApp = apk == null ? null : Sync.read(new FileInputStream(new File(apk, "manifest.txt")));
            if (cmd.equals("seed")) {
                Sync.Result r = Sync.seed(dir, path -> new FileInputStream(new File(apk, path)), inApp);
                System.out.println("{\"result\":" + r.json() + tail(dir));
            } else if (cmd.equals("prune")) {
                int n = Sync.prune(dir, Sync.gamesIn(inApp), Sync.kept(dir));
                System.out.println("{\"cleared\":" + n + tail(dir));
            } else System.out.println("{\"core\":" + list(Sync.gamesIn(inApp)) + tail(dir));
            return;
        }
        if (cmd.equals("keep") || cmd.equals("forget")) {
            boolean ok = Sync.setKept(new File(a[1]), a[2], cmd.equals("keep"));
            System.out.println("{\"ok\":" + ok + tail(new File(a[1])));
            return;
        }
        if (cmd.equals("fetch")) {
            final File dir = new File(a[2]), apk = a.length > 4 ? new File(a[4]) : null;
            Sync.Manifest inApp = apk == null ? null : Sync.read(new FileInputStream(new File(apk, "manifest.txt")));
            Sync.Result r = Sync.fetchGame(a[1], dir, a[3], apk == null ? null : path -> new FileInputStream(new File(apk, path)), inApp);
            System.out.println("{\"result\":" + r.json() + tail(dir));
            return;
        }
        final File apk = a.length > 2 ? new File(a[2]) : null;
        Sync.Manifest inApp = null;
        Sync.Bundled bundled = null;
        if (apk != null) {
            inApp = Sync.read(new FileInputStream(new File(apk, "manifest.txt")));
            bundled = path -> new FileInputStream(new File(apk, path));
        }
        Sync.Result r = Sync.run(a[0], new File(a[1]), bundled, inApp);
        System.out.println("{\"result\":" + r.json() + tail(new File(a[1])));
    }
}
