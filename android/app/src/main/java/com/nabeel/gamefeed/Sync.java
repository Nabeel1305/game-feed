package com.nabeel.gamefeed;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Keeps a folder on the phone equal to the feed app that GitHub publishes, so new games arrive without a new APK.
 *
 * The published folder has a manifest.txt: one line per file, "sha256 size path". This compares it with what the
 * phone has and fetches only what is new or changed. Every file is checked against its fingerprint before it is put
 * in place. The games, pictures and fonts go in first and the list of games (games.js) goes in last, so the list
 * never names a game that is not on the phone yet. If the internet drops half way, what already arrived is kept
 * and the rest is fetched next time; the feed keeps working from what it had.
 *
 * One file is never fetched: the feed page itself (index.html). It is always the copy inside the APK. New games
 * arrive by themselves; a change to the app itself only ever arrives when a new APK is installed (Nabeel's rule).
 *
 * Not every game is kept on the phone (his design, 15 Nov 2026):
 *   - the core games, the ones inside the APK, are always there and always kept up to date;
 *   - every other game is fetched when its card comes up (fetchGame), so it needs the internet, and is cleared
 *     away the next time the app starts (prune);
 *   - unless he saved it from the Games list (setKept): a saved game stays, and is kept up to date like a core one.
 * The list of games, the small list pictures and the fonts are always fetched: they are tiny, and the feed needs
 * them to show what exists.
 *
 * Plain Java on purpose (nothing from Android), so tools/test_sync.py can test it on any computer.
 */
final class Sync {
    /** The files that came inside the APK: used instead of a download when they are the very same file. */
    interface Bundled { InputStream open(String path) throws IOException; }

    static final class Entry {
        final String hash; final long size;
        Entry(String hash, long size) { this.hash = hash; this.size = size; }
    }

    static final class Manifest {
        int build = 0;
        String rev = "";
        final LinkedHashMap<String, Entry> files = new LinkedHashMap<>();

        private static final Pattern HEAD = Pattern.compile("build (\\d{1,9})(?: rev ([0-9a-f]{6,64}))?");
        private static final Pattern LINE = Pattern.compile("([0-9a-f]{64}) (\\d{1,10}) ([A-Za-z0-9_][A-Za-z0-9._/-]{0,199})");

        /** Throws if anything looks wrong: a half-loaded page or an error page must never be taken for a manifest. */
        static Manifest parse(String text) throws IOException {
            Manifest m = new Manifest();
            for (String raw : text.split("\n")) {
                String line = raw.trim();
                if (line.isEmpty()) continue;
                if (line.startsWith("#")) {
                    Matcher h = HEAD.matcher(line);
                    if (h.find()) { m.build = Integer.parseInt(h.group(1)); if (h.group(2) != null) m.rev = h.group(2); }
                    continue;
                }
                Matcher x = LINE.matcher(line);
                if (!x.matches()) throw new IOException("not a manifest");
                String path = x.group(3);
                long size = Long.parseLong(x.group(2));
                if (path.contains("..") || path.contains("//") || path.endsWith("/") || path.equals("manifest.txt") || size > MAX_FILE)
                    throw new IOException("bad entry in manifest");
                m.files.put(path, new Entry(x.group(1), size));
            }
            if (!m.files.containsKey("index.html") || !m.files.containsKey("games.js")) throw new IOException("manifest is incomplete");
            return m;
        }

        String text() {
            StringBuilder b = new StringBuilder("# Game Feed app. build " + build + (rev.isEmpty() ? "" : " rev " + rev) + "\n");
            for (Map.Entry<String, Entry> e : files.entrySet())
                b.append(e.getValue().hash).append(' ').append(e.getValue().size).append(' ').append(e.getKey()).append('\n');
            return b.toString();
        }
    }

    static final class Result {
        boolean ok;          // the phone's copy now equals what is published (or was already)
        boolean changed;     // something in the phone's copy changed in this run
        int build;           // build number of the phone's copy after this run
        String rev = "";     // name of that exact set of games and files (games.js carries the same word)
        int fetched;         // files downloaded
        int fromApp;         // files taken from inside the APK instead
        int removed;         // files deleted because the published app no longer has them
        String error = "";

        String json() {
            return "{\"ok\":" + ok + ",\"changed\":" + changed + ",\"build\":" + build + ",\"rev\":\"" + rev + "\",\"fetched\":" + fetched
                    + ",\"fromApp\":" + fromApp + ",\"removed\":" + removed + ",\"error\":\"" + error.replaceAll("[^A-Za-z0-9 .,:_/()-]", " ") + "\"}";
        }
    }

    static final long MAX_FILE = 64L * 1024 * 1024;
    /** The feed page: only ever taken from inside the APK, never downloaded. */
    static final String SHELL = "index.html";
    private static final String PART = ".part";
    private static final String LOCAL = "manifest.txt";

    private static final String KEPT = "kept.txt";
    private static final Pattern GAME_FILE = Pattern.compile("(?:games/([a-z0-9][a-z0-9-]{0,63})/.+|(?:posters|previews)/([a-z0-9][a-z0-9-]{0,63})\\.[a-z0-9]{2,5})");
    private static final Pattern GAME_ID = Pattern.compile("[a-z0-9][a-z0-9-]{0,63}");

    /** The game a file belongs to (its page, its card picture, its clip), or null for a file every phone keeps. */
    static String gameOf(String path) {
        Matcher m = GAME_FILE.matcher(path);
        if (!m.matches()) return null;
        return m.group(1) != null ? m.group(1) : m.group(2);
    }

    static boolean validId(String id) { return id != null && GAME_ID.matcher(id).matches(); }

    /** The games a manifest carries. For the manifest inside the APK these are the core games. */
    static Set<String> gamesIn(Manifest m) {
        Set<String> ids = new LinkedHashSet<>();
        if (m != null) for (String p : m.files.keySet()) { String g = gameOf(p); if (g != null) ids.add(g); }
        return ids;
    }

    /** The games he has saved from the Games list. */
    static Set<String> kept(File dir) {
        Set<String> ids = new LinkedHashSet<>();
        try {
            File f = new File(dir, KEPT);
            if (!f.isFile()) return ids;
            for (String line : new String(readAll(new FileInputStream(f), 1 << 20), StandardCharsets.UTF_8).split("\n")) {
                String id = line.trim();
                if (validId(id)) ids.add(id);
            }
        } catch (Exception ignored) { }
        return ids;
    }

    /** Saves a game (it stays on the phone) or lets it go again (it is cleared the next time the app starts). */
    static boolean setKept(File dir, String id, boolean on) {
        if (!validId(id)) return false;
        try {
            Set<String> ids = kept(dir);
            if (on ? !ids.add(id) : !ids.remove(id)) return true;
            if (!dir.isDirectory() && !dir.mkdirs()) return false;
            StringBuilder b = new StringBuilder();
            for (String k : ids) b.append(k).append('\n');
            write(new File(dir, KEPT), new File(dir, KEPT + PART), b.toString());
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /** The games that are on the phone right now, ready to play with no internet. */
    static Set<String> onPhone(File dir) {
        Set<String> ids = new LinkedHashSet<>();
        Manifest local = readLocal(dir);
        for (String p : local.files.keySet()) {
            String g = gameOf(p);
            if (g != null && p.equals("games/" + g + "/index.html") && new File(dir, p).isFile()) ids.add(g);
        }
        return ids;
    }

    /** What the phone's copy holds, by its own record. An unreadable or missing record means "nothing yet". */
    static Manifest readLocal(File dir) {
        try {
            File f = new File(dir, LOCAL);
            if (!f.isFile()) return new Manifest();
            return parseLoose(new String(readAll(new FileInputStream(f), 4 << 20), StandardCharsets.UTF_8));
        } catch (Exception e) {
            return new Manifest();
        }
    }

    /** Like Manifest.parse but a record of a half-finished copy (no index.html yet) is fine. */
    private static Manifest parseLoose(String text) throws IOException {
        Manifest m = new Manifest();
        for (String raw : text.split("\n")) {
            String line = raw.trim();
            if (line.isEmpty()) continue;
            if (line.startsWith("#")) {
                Matcher h = Manifest.HEAD.matcher(line);
                if (h.find()) { m.build = Integer.parseInt(h.group(1)); if (h.group(2) != null) m.rev = h.group(2); }
                continue;
            }
            Matcher x = Manifest.LINE.matcher(line);
            if (x.matches() && !x.group(3).contains("..")) m.files.put(x.group(3), new Entry(x.group(1), Long.parseLong(x.group(2))));
        }
        return m;
    }

    /** Reads a manifest from a stream (the one inside the APK). Null if it is missing or unreadable. */
    static Manifest read(InputStream in) {
        try {
            return Manifest.parse(new String(readAll(in, 4 << 20), StandardCharsets.UTF_8));
        } catch (Exception e) {
            return null;
        }
    }

    /** True when the phone's copy can run the feed on its own. */
    static boolean usable(File dir, Manifest local) {
        return local.files.containsKey("index.html") && local.files.containsKey("games.js")
                && new File(dir, "index.html").isFile() && new File(dir, "games.js").isFile();
    }

    /** The last published list this run of the app has read, so that fetching one game does not have to read it again. */
    private static Manifest lastRemote = null;
    private static long lastRemoteAt = 0;
    private static final long REMOTE_GOOD_FOR_MS = 15 * 60 * 1000L;

    private static Manifest readRemote(String base) throws IOException {
        String text = new String(get(base + "manifest.txt?t=" + System.currentTimeMillis(), 8 << 20), StandardCharsets.UTF_8);
        Manifest remote = Manifest.parse(text);
        lastRemote = remote;
        lastRemoteAt = System.currentTimeMillis();
        return remote;
    }

    /** Puts one file in place: from inside the APK when that is the very same file, otherwise downloaded. Checked either way. */
    private static void place(String base, File dir, File part, String p, Entry want, Bundled bundled, Manifest inApp, boolean mustBeOwn, Result r) throws IOException {
        boolean got = false;
        Entry b = inApp == null ? null : inApp.files.get(p);
        if (bundled != null && b != null && b.hash.equals(want.hash)) {
            try {
                InputStream in = bundled.open(p);
                try { got = want.hash.equals(save(in, part, want.size)); } finally { in.close(); }
            } catch (IOException e) { got = false; }
            if (got) r.fromApp++;
        }
        if (!got && mustBeOwn) throw new IOException("cannot copy " + p + " out of the app");
        if (!got) {
            if (!want.hash.equals(download(base + p + "?v=" + want.hash.substring(0, 16), part, want.size))) throw new IOException("wrong contents for " + p);
            r.fetched++;
        }
        File dest = new File(dir, p);
        File parent = dest.getParentFile();
        if (parent != null && !parent.isDirectory() && !parent.mkdirs()) throw new IOException("cannot make folder for " + p);
        if (!part.renameTo(dest)) {
            if (dest.exists() && !dest.delete()) throw new IOException("cannot replace " + p);
            if (!part.renameTo(dest)) throw new IOException("cannot place " + p);
        }
    }

    private static boolean same(File dir, String p, Entry want, Manifest local) {
        Entry have = local.files.get(p);
        File f = new File(dir, p);
        return have != null && have.hash.equals(want.hash) && f.isFile() && f.length() == want.size;
    }

    private static String why(Exception e) {
        String msg = e.getMessage();
        return e.getClass().getSimpleName() + (msg == null ? "" : ": " + msg);
    }

    /**
     * Makes the phone's copy at least what came inside the APK, with no internet needed: after an install, or an
     * update of the app, the folder is brought up to the APK before the feed is shown, so the feed always runs from
     * the folder and never has to move there later.
     *   - A folder older than the APK (or not whole) takes everything the APK has.
     *   - A folder as new as the APK, or newer, keeps its games as they are (they may be newer than the APK's);
     *     only a file that went missing is put back.
     *   - The feed page is the APK's own in every case: the moment a new app is installed, its page is the one
     *     shown, even if the phone had already fetched the games published with it.
     */
    static Result seed(File dir, Bundled bundled, Manifest inApp) {
        Result r = new Result();
        Manifest local = readLocal(dir);
        r.build = local.build;
        r.rev = local.rev;
        if (bundled == null || inApp == null) { r.error = "nothing inside the app to copy"; return r; }
        boolean whole = usable(dir, local);
        boolean older = !whole || local.build < inApp.build;
        boolean newer = whole && local.build > inApp.build;         // it has already taken games published after this APK was made
        Manifest now = new Manifest();
        now.build = local.build;
        now.rev = local.rev;
        now.files.putAll(local.files);
        boolean touched = false;
        File part = new File(dir, PART);
        try {
            if (!dir.isDirectory() && !dir.mkdirs()) throw new IOException("cannot make the folder");
            for (Map.Entry<String, Entry> e : inApp.files.entrySet()) {
                String p = e.getKey();
                if (same(dir, p, e.getValue(), local)) continue;
                if (!older && !p.equals(SHELL)) {
                    // its own file is kept if it is there; a file it does not list is filled in, unless the folder is
                    // newer than the APK (then the game was taken off the app since, and must not come back)
                    if (local.files.containsKey(p) ? new File(dir, p).isFile() : newer) continue;
                }
                place("", dir, part, p, e.getValue(), bundled, inApp, true, r);
                now.files.put(p, e.getValue());
                touched = true;
            }
            if (older) { now.build = inApp.build; now.rev = inApp.rev; }
            if (touched || older) write(new File(dir, LOCAL), part, now.text());
            r.changed = touched;
            r.build = now.build;
            r.rev = now.rev;
            r.ok = true;
        } catch (Exception e) {
            r.ok = false;
            r.changed = touched;
            r.error = why(e);
            if (touched) { try { write(new File(dir, LOCAL), part, now.text()); } catch (Exception ignored) { } }
        } finally {
            part.delete();
        }
        return r;
    }

    /**
     * Clears away the games that were only fetched to be played: every game on the phone that is neither a core game
     * nor saved. Done when the app starts, before the feed is shown, so nothing in use is ever taken away.
     * Returns how many games were cleared.
     */
    static int prune(File dir, Set<String> core, Set<String> kept) {
        int cleared = 0;
        try {
            Manifest local = readLocal(dir);
            Set<String> gone = new LinkedHashSet<>();
            for (String p : new ArrayList<>(local.files.keySet())) {
                String g = gameOf(p);
                if (g == null || core.contains(g) || kept.contains(g)) continue;
                new File(dir, p).delete();
                local.files.remove(p);
                gone.add(g);
            }
            for (String g : gone) new File(dir, "games/" + g).delete();          // the empty folder
            cleared = gone.size();
            if (cleared > 0) write(new File(dir, LOCAL), new File(dir, PART), local.text());
        } catch (Exception ignored) { }
        return cleared;
    }

    /**
     * Fetches one game (its page, its card picture and its clip) so it can be played now. Its page goes in last:
     * a game counts as on the phone once its page is there, and by then its card is too.
     */
    static Result fetchGame(String base, File dir, String id, Bundled bundled, Manifest inApp) {
        Result r = new Result();
        Manifest local = readLocal(dir);
        r.build = local.build;
        r.rev = local.rev;
        if (!validId(id)) { r.error = "not a game"; return r; }
        boolean touched = false;
        File part = new File(dir, PART);
        Manifest now = new Manifest();
        now.build = local.build;
        now.rev = local.rev;
        now.files.putAll(local.files);
        try {
            if (!dir.isDirectory() && !dir.mkdirs()) throw new IOException("cannot make the folder");
            boolean fresh = lastRemote == null || System.currentTimeMillis() - lastRemoteAt > REMOTE_GOOD_FOR_MS;
            Manifest remote = fresh ? readRemote(base) : lastRemote;
            for (int attempt = 0; ; attempt++) {
                List<String> need = new ArrayList<>();
                String page = "games/" + id + "/index.html";
                for (Map.Entry<String, Entry> e : remote.files.entrySet()) {
                    String p = e.getKey();
                    boolean font = p.startsWith("fonts/");                        // a newer game may use a font this phone has not fetched yet
                    if (!font && !id.equals(gameOf(p))) continue;
                    if (p.equals(page) || same(dir, p, e.getValue(), local)) continue;
                    need.add(p);
                }
                try {
                    if (!remote.files.containsKey(page)) throw new IOException("no such game");
                    if (!same(dir, page, remote.files.get(page), local)) need.add(page);
                    for (String p : need) {
                        if (now.files.containsKey(p) && same(dir, p, remote.files.get(p), now)) continue;
                        place(base, dir, part, p, remote.files.get(p), bundled, inApp, false, r);
                        now.files.put(p, remote.files.get(p));
                        touched = true;
                    }
                    break;
                } catch (IOException e) {
                    // the list we remembered may be out of date (the game was changed since): read it again, once
                    if (fresh || attempt > 0) throw e;
                    remote = readRemote(base);
                    fresh = true;
                }
            }
            if (touched) write(new File(dir, LOCAL), part, now.text());
            r.changed = touched;
            r.ok = true;
        } catch (Exception e) {
            r.ok = false;
            r.changed = touched;
            r.error = why(e);
            if (touched) { try { write(new File(dir, LOCAL), part, now.text()); } catch (Exception ignored) { } }
        } finally {
            part.delete();
        }
        return r;
    }

    /**
     * @param base    where the app is published, ending in "/"
     * @param dir     the phone's copy
     * @param bundled the files inside the APK (may be null)
     * @param inApp   the manifest inside the APK (may be null)
     */
    static Result run(String base, File dir, Bundled bundled, Manifest inApp) {
        Result r = new Result();
        Manifest local = readLocal(dir);
        r.build = local.build;
        r.rev = local.rev;
        Manifest now = new Manifest();          // what the folder really holds, kept true as each file lands
        now.build = local.build;
        now.rev = local.rev;
        now.files.putAll(local.files);
        boolean touched = false;
        File part = new File(dir, PART);
        try {
            if (!dir.isDirectory() && !dir.mkdirs()) throw new IOException("cannot make the folder");
            Manifest remote = readRemote(base);
            // an out-of-date answer from the server, or a published app older than the one inside the APK: keep what we have
            if (remote.build < local.build || (inApp != null && remote.build < inApp.build)) { r.ok = true; return r; }

            // What this phone keeps: everything that is not a game's own file (the list, the list pictures, the fonts),
            // the core games (the ones inside the APK) and the games he has saved. The feed page is the APK's own.
            // Any other game is fetched only when its card comes up (fetchGame).
            // (If what is inside the APK is not known, there is no telling which games are core: then every game is kept.)
            Set<String> core = inApp == null ? null : gamesIn(inApp), saved = kept(dir);
            boolean ownShell = bundled != null && inApp != null && inApp.files.containsKey(SHELL);
            LinkedHashMap<String, Entry> wanted = new LinkedHashMap<>();
            for (Map.Entry<String, Entry> e : remote.files.entrySet()) {
                String g = gameOf(e.getKey());
                if (g == null || core == null || core.contains(g) || saved.contains(g)) wanted.put(e.getKey(), e.getValue());
            }
            if (ownShell) wanted.put(SHELL, inApp.files.get(SHELL));

            List<String> need = new ArrayList<>();
            List<String> last = new ArrayList<>();
            for (Map.Entry<String, Entry> e : wanted.entrySet()) {
                String p = e.getKey();
                if (same(dir, p, e.getValue(), local)) continue;
                if (p.equals("games.js") || p.equals(SHELL)) last.add(p); else need.add(p);
            }
            need.addAll(last);

            for (String p : need) {
                place(base, dir, part, p, wanted.get(p), bundled, inApp, ownShell && p.equals(SHELL), r);
                now.files.put(p, wanted.get(p));
                touched = true;
            }

            // a file the published app no longer has at all (a game taken off the app) goes; a game that is only here
            // to be played stays until the app next starts
            for (String p : new ArrayList<>(now.files.keySet())) {
                if (remote.files.containsKey(p)) continue;
                new File(dir, p).delete();
                now.files.remove(p);
                r.removed++;
                touched = true;
            }

            now.build = remote.build;
            now.rev = remote.rev;
            if (touched || local.build != remote.build || !local.rev.equals(remote.rev)) write(new File(dir, LOCAL), part, now.text());
            r.changed = touched;
            r.build = remote.build;
            r.rev = remote.rev;
            r.ok = true;
        } catch (Exception e) {
            r.ok = false;
            r.changed = touched;
            r.error = why(e);
            if (touched) {                       // keep a true record of what did arrive, so next time only the rest is fetched
                try { write(new File(dir, LOCAL), part, now.text()); } catch (Exception ignored) { }
            }
        } finally {
            part.delete();
        }
        return r;
    }

    private static void write(File dest, File part, String text) throws IOException {
        OutputStream out = new FileOutputStream(part);
        try { out.write(text.getBytes(StandardCharsets.UTF_8)); } finally { out.close(); }
        if (!part.renameTo(dest)) {
            if (dest.exists() && !dest.delete()) throw new IOException("cannot replace the record");
            if (!part.renameTo(dest)) throw new IOException("cannot write the record");
        }
    }

    private static HttpURLConnection open(String url) throws IOException {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setConnectTimeout(10000);
        c.setReadTimeout(20000);
        c.setInstanceFollowRedirects(true);
        c.setUseCaches(false);
        if (c.getResponseCode() != 200) {
            int code = c.getResponseCode();
            c.disconnect();
            throw new IOException("the server answered " + code);
        }
        return c;
    }

    private static byte[] get(String url, int max) throws IOException {
        HttpURLConnection c = open(url);
        try { return readAll(c.getInputStream(), max); } finally { c.disconnect(); }
    }

    private static String download(String url, File to, long size) throws IOException {
        HttpURLConnection c = open(url);
        try { return save(c.getInputStream(), to, size); } finally { c.disconnect(); }
    }

    private static byte[] readAll(InputStream in, int max) throws IOException {
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[16384];
            int n;
            while ((n = in.read(buf)) > 0) {
                out.write(buf, 0, n);
                if (out.size() > max) throw new IOException("too big");
            }
            return out.toByteArray();
        } finally {
            in.close();
        }
    }

    /** Writes the stream to a file and returns its sha256. Stops if more arrives than the manifest promised. */
    private static String save(InputStream in, File to, long size) throws IOException {
        MessageDigest md;
        try { md = MessageDigest.getInstance("SHA-256"); } catch (Exception e) { throw new IOException("no sha256"); }
        long total = 0;
        OutputStream out = new FileOutputStream(to);
        try {
            byte[] buf = new byte[16384];
            int n;
            while ((n = in.read(buf)) > 0) {
                total += n;
                if (total > size) throw new IOException("more data than expected");
                md.update(buf, 0, n);
                out.write(buf, 0, n);
            }
        } finally {
            out.close();
        }
        if (total != size) throw new IOException("less data than expected");
        StringBuilder hex = new StringBuilder();
        for (byte b : md.digest()) hex.append(Character.forDigit((b >> 4) & 15, 16)).append(Character.forDigit(b & 15, 16));
        return hex.toString();
    }
}
