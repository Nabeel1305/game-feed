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
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Keeps a folder on the phone equal to the feed app that GitHub publishes, so new games arrive without a new APK.
 *
 * The published folder has a manifest.txt: one line per file, "sha256 size path". This compares it with what the
 * phone has and fetches only what is new or changed. Every file is checked against its fingerprint before it is put
 * in place. The games, pictures and fonts go in first; the list of games (games.js) and the feed page (index.html)
 * go in last, so the list never names a game that is not on the phone yet. If the internet drops half way, what
 * already arrived is kept and the rest is fetched next time; the feed keeps working from what it had.
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
    private static final String PART = ".part";
    private static final String LOCAL = "manifest.txt";

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
            String text = new String(get(base + "manifest.txt?t=" + System.currentTimeMillis(), 4 << 20), StandardCharsets.UTF_8);
            Manifest remote = Manifest.parse(text);
            // an out-of-date answer from the server, or a published app older than the one inside the APK: keep what we have
            if (remote.build < local.build || (inApp != null && remote.build < inApp.build)) { r.ok = true; return r; }

            List<String> need = new ArrayList<>();
            List<String> last = new ArrayList<>();
            for (Map.Entry<String, Entry> e : remote.files.entrySet()) {
                String p = e.getKey();
                Entry want = e.getValue(), have = local.files.get(p);
                File f = new File(dir, p);
                if (have != null && have.hash.equals(want.hash) && f.isFile() && f.length() == want.size) continue;
                if (p.equals("games.js") || p.equals("index.html")) last.add(p); else need.add(p);
            }
            need.addAll(last);

            for (String p : need) {
                Entry want = remote.files.get(p);
                boolean got = false;
                Entry b = inApp == null ? null : inApp.files.get(p);
                if (bundled != null && b != null && b.hash.equals(want.hash)) {
                    try {
                        InputStream in = bundled.open(p);
                        try { got = want.hash.equals(save(in, part, want.size)); } finally { in.close(); }
                    } catch (IOException e) { got = false; }
                    if (got) r.fromApp++;
                }
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
                now.files.put(p, want);
                touched = true;
            }

            for (String p : new ArrayList<>(now.files.keySet())) {
                if (remote.files.containsKey(p)) continue;
                new File(dir, p).delete();
                now.files.remove(p);
                r.removed++;
                touched = true;
            }

            if (touched || local.build != remote.build || !local.rev.equals(remote.rev)) write(new File(dir, LOCAL), part, text);
            r.changed = touched;
            r.build = remote.build;
            r.rev = remote.rev;
            r.ok = true;
        } catch (Exception e) {
            r.ok = false;
            r.changed = touched;
            String msg = e.getMessage();
            r.error = e.getClass().getSimpleName() + (msg == null ? "" : ": " + msg);
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
