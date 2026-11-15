#!/usr/bin/env python3
"""Checks the newest GameFeed.apk from outside, before Nabeel is given the link.

Run it in a session once GitHub has finished building (about six minutes after a push). It only reads: nothing
in the APK is run. It needs gh (signed in), git, java, javac and the internet.

    python3 tools/check_release.py          the newest release
    python3 tools/check_release.py 22       ... and it must be build 22

What it looks at:
  1. The APK itself: its list (manifest.txt) names exactly the files inside and every fingerprint is right; only
     the core games' own files are inside, but the list of games names every game on the app; the feed page is
     the one in this repo; the updater and its address (app-v2) are compiled in and the old address is not; the
     version; and the signing certificate is still the one every earlier build had (so it installs over the old
     app and keeps his progress).
  2. What GitHub published for phones: the app-v2 branch is the same build and the same set of games as the APK,
     and the frozen app branch is still build 18.
  3. The real updater (android/.../Sync.java, compiled here) against the real published address: a new phone with
     no internet gets the feed and the core games out of the APK; looking for new games then fetches nothing; and
     one game is fetched on its own into an empty phone, byte for byte what is published.
"""
import hashlib, json, os, struct, subprocess, sys, tempfile, zipfile

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = 'Nabeel1305/game-feed'
PUBLISHED = 'https://raw.githubusercontent.com/Nabeel1305/game-feed/app-v2/'
CERT = '93198214623cef3067d7c9cff9d92bd5a863c83307af5ea89836e93adc779d96'      # android/signing/release.p12
sys.path.insert(0, os.path.join(root, 'tools'))
import build_feed

fails, oks = [], 0


def ok(cond, what, detail=''):
    global oks
    if cond: oks += 1; print('  ok  ', what)
    else: fails.append(what); print('  FAIL', what, detail)
    return cond


def run(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, **kw)


def certs(apk):
    """SHA-256 of each signing certificate in the APK's signing block (v2 or v3)."""
    d = open(apk, 'rb').read()
    eocd = d.rfind(b'PK\x05\x06')
    cd = struct.unpack('<I', d[eocd + 16:eocd + 20])[0]
    if d[cd - 16:cd] != b'APK Sig Block 42': return []
    size = struct.unpack('<Q', d[cd - 24:cd - 16])[0]
    block = d[cd - size - 8:cd - 24]

    def seq(b):
        items, q = [], 0
        while q + 4 <= len(b):
            m = struct.unpack('<I', b[q:q + 4])[0]
            items.append(b[q + 4:q + 4 + m]); q += 4 + m
        return items
    out, p = [], 8
    while p + 12 <= len(block):
        n = struct.unpack('<Q', block[p:p + 8])[0]
        bid = struct.unpack('<I', block[p + 8:p + 12])[0]
        val = block[p + 12:p + 8 + n]
        p += 8 + n
        if bid not in (0x7109871a, 0xf05368c0): continue
        for signer in seq(val[4:4 + struct.unpack('<I', val[:4])[0]]):
            signed = seq(signer)[0]
            m = struct.unpack('<I', signed[:4])[0]                     # the digests come first, the certificates second
            m2 = struct.unpack('<I', signed[4 + m:8 + m])[0]
            out += [hashlib.sha256(c).hexdigest() for c in seq(signed[8 + m:8 + m + m2])]
    return out


def main():
    want = int(sys.argv[1]) if len(sys.argv) > 1 else None
    work = tempfile.mkdtemp(prefix='gf-release-')
    r = run(['gh', 'api', f'repos/{REPO}/releases/latest'])
    if r.returncode: print('Cannot read the newest release:', r.stderr[-300:]); sys.exit(1)
    rel = json.loads(r.stdout)
    asset = next((a for a in rel['assets'] if a['name'] == 'GameFeed.apk'), None)
    if not asset: print('The newest release has no GameFeed.apk (is the KEYSTORE_PASSWORD secret set?)'); sys.exit(1)
    apk = os.path.join(work, 'GameFeed.apk')
    with open(apk, 'wb') as f:
        r = subprocess.run(['gh', 'api', '-H', 'Accept: application/octet-stream', f"repos/{REPO}/releases/assets/{asset['id']}"], stdout=f, stderr=subprocess.PIPE)
    if r.returncode or os.path.getsize(apk) != asset['size']: print('Could not fetch GameFeed.apk'); sys.exit(1)
    print(f"{rel['name']} ({rel['tag_name']}), GameFeed.apk {asset['size'] // 1024} KB, published {rel['published_at']}")

    print('The APK:')
    z = zipfile.ZipFile(apk)
    inside = {n[len('assets/'):]: z.read(n) for n in z.namelist() if n.startswith('assets/') and not n.endswith('/')}
    man = inside.get('manifest.txt', b'').decode('utf-8')
    head = man.split('\n')[0]
    build = int(head.split('build ')[1].split()[0]) if 'build ' in head else -1
    rev = head.split(' rev ')[1].strip() if ' rev ' in head else ''
    ok(build > 0 and rev and (want is None or build == want) and rel['tag_name'] == f'build-{build}', f'it is build {build} ({head.strip()})', f'wanted {want}, release {rel["tag_name"]}')
    listed = {}
    for line in man.split('\n')[1:]:
        if line.strip():
            h, size, path = line.split(' ', 2); listed[path] = (h, int(size))
    wrong = [p for p, (h, size) in listed.items() if p not in inside or hashlib.sha256(inside[p]).hexdigest() != h or len(inside[p]) != size]
    extra = sorted(set(inside) - set(listed) - {'manifest.txt'})
    ok(listed and not wrong and not extra, f'its list names exactly the {len(listed)} files inside, each with the right fingerprint', str(wrong[:3] + extra[:3]))
    reg = json.load(open(os.path.join(root, 'games.json'), encoding='utf-8'))
    on_app = sorted(g['id'] for g in reg['games'] if build_feed.in_app(g))
    core = sorted(g['id'] for g in reg['games'] if build_feed.in_app(g) and g.get('core') is True)
    games_inside = sorted({build_feed.game_of(p) for p in listed if build_feed.game_of(p)})
    ok(games_inside == core, f'only the core games are inside ({len(core)})', str(games_inside))
    js = inside.get('games.js', b'').decode('utf-8')
    ok(all(f'"id": "{g}"' in js or f'"id":"{g}"' in js for g in on_app) and rev in js, f'its list of games names every game on the app ({len(on_app)}) and carries the same name for the set ({rev})')
    ok(all(f'pics/{g}.webp' in listed for g in on_app), 'the small list picture of every game is inside')
    ok(inside.get('index.html') == open(os.path.join(root, 'feed', 'index.html'), 'rb').read(), 'the feed page inside is the one in this repo')
    dex = b''.join(z.read(n) for n in z.namelist() if n.endswith('.dex'))
    need = (b'game-feed/app-v2/', b'kept.txt', b'fetchGame', b'saveGame', b'forgetGame', b'onPhone', b'gameFeedGame', b'gameFeedUpdate')
    ok(all(w in dex for w in need) and b'game-feed/app/' not in dex, 'the updater, its address (app-v2) and the save feature are compiled in; the old address is not',
       str([w.decode() for w in need if w not in dex]))
    am = z.read('AndroidManifest.xml')
    ver = f'1.0.{build}'
    ok(ver.encode('utf-16-le') in am or ver.encode() in am, f'its version is {ver}')
    found = certs(apk)
    ok(found and all(c == CERT for c in found), 'it is signed with the same key as every build before it (it installs over the old app and keeps his progress)', str(found))

    print('What GitHub published for phones:')
    r = run(['git', '-C', root, 'fetch', '-q', 'origin', '+app-v2:refs/remotes/origin/app-v2', '+app:refs/remotes/origin/app'])
    pub = run(['git', '-C', root, 'show', 'origin/app-v2:manifest.txt']).stdout
    ok(pub.split('\n')[0].strip() == head.strip(), f'the app-v2 branch is the same build and the same set of games ({pub.split(chr(10))[0].strip()})')
    pub_files = {l.split(' ', 2)[2]: l.split(' ', 2)[0] for l in pub.split('\n')[1:] if l.strip()}
    ok(all(pub_files.get(p) == h for p, (h, _) in listed.items()), 'every file inside the APK is the published one')
    ok(sorted({build_feed.game_of(p) for p in pub_files if build_feed.game_of(p)}) == on_app, f'every game on the app is published ({len(on_app)})')
    old = run(['git', '-C', root, 'log', '-1', '--format=%s', 'origin/app']).stdout.strip()
    ok('build 18' in old, f'the frozen app branch is untouched ({old})')

    print('The real updater against the real address:')
    classes = os.path.join(work, 'classes')
    r = run(['javac', '-nowarn', '-d', classes, os.path.join(root, 'android/app/src/main/java/com/nabeel/gamefeed/Sync.java'), os.path.join(root, 'tools/sync_cli/SyncCli.java')])
    if r.returncode: print('The updater does not compile:\n' + r.stderr); sys.exit(1)
    apkdir = os.path.join(work, 'apk')
    for p, data in inside.items():
        os.makedirs(os.path.dirname(os.path.join(apkdir, p)), exist_ok=True)
        open(os.path.join(apkdir, p), 'wb').write(data)

    def cli(*args):
        p = run(['java', '-cp', classes, 'com.nabeel.gamefeed.SyncCli'] + list(args), timeout=180)
        try: out = json.loads(p.stdout.strip().split('\n')[-1])
        except Exception: raise RuntimeError('the updater said: ' + p.stdout[-300:] + p.stderr[-600:])
        if 'result' in out: out.update(out.pop('result'))
        return out
    new = os.path.join(work, 'new-phone')
    r = cli('seed', new, apkdir)
    ok(r['ok'] and r['fromApp'] == len(listed) and r['fetched'] == 0 and r['usable'] and r['localBuild'] == build and sorted(r['here']) == core,
       f'a new phone with no internet gets the feed and the {len(core)} core games out of the app', str(r))
    r = cli(PUBLISHED, new, apkdir)
    ok(r['ok'] and r['fetched'] == 0 and r['removed'] == 0 and r['localBuild'] == build and sorted(r['here']) == core, 'looking for new games then reaches GitHub and has nothing to fetch', str(r))
    others = [g for g in on_app if g not in core]
    gid = (others or core)[0]
    lone = os.path.join(work, 'fetch-phone')
    r = cli('fetch', PUBLISHED, lone, gid)
    page = os.path.join(lone, 'games', gid, 'index.html')
    same = os.path.isfile(page) and hashlib.sha256(open(page, 'rb').read()).hexdigest() == pub_files.get(f'games/{gid}/index.html')
    ok(r['ok'] and gid in r['here'] and same, f'one game ({gid}) is fetched on its own from GitHub, byte for byte what is published', str(r))
    r = cli('keep', lone, gid)
    ok(r['ok'] and r['saved'] == [gid], 'and it can be saved')

    if fails:
        print(f'\nRELEASE PROBLEMS ({len(fails)}):')
        for f in fails: print(' -', f)
        sys.exit(1)
    print(f'\nBuild {build} is fit to hand over: {oks} checks. Link: https://github.com/{REPO}/releases/latest/download/GameFeed.apk')


if __name__ == '__main__':
    main()
