#!/usr/bin/env python3
"""Tests the part of the phone app that fetches new games (android/.../Sync.java), on this computer.

Sync.java is plain Java, so it can be compiled and run here with no phone and no Android tools. This builds
the feed app twice (as it is now, and with a seventh game added, one game changed and one retired), serves it
from a little web server standing in for GitHub, and runs the real updater against it:
a first copy, nothing new, a new game, a dropped connection, wrong or cut-off files, an out-of-date or
nonsense answer, a published app older than the installed one, and a tampered list. Then it opens the feed
from the fetched folder in a phone-sized browser and checks the new game is there, first, marked New.
Run: python3 tools/test_sync.py      (needs java and javac, and playwright for the last part)"""
import copy, functools, hashlib, http.server, json, os, shutil, subprocess, sys, tempfile, threading, urllib.parse

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(root, 'tools'))
import build_feed

fails, oks = [], 0


def ok(cond, what, detail=''):
    global oks
    if cond: oks += 1
    else:
        fails.append(what + (f' ({detail})' if detail else ''))
        print('  FAIL', what, detail)
    return cond


class Remote(http.server.BaseHTTPRequestHandler):
    """Stands in for GitHub. S['dir'] is what is published; S['fault'](path, nth request) may break an answer."""
    S = {'dir': '', 'log': [], 'fault': None}
    def log_message(self, *a): pass
    def do_GET(self):
        S = self.S
        path = urllib.parse.urlsplit(self.path).path.lstrip('/')
        S['log'].append(path)
        mode = S['fault'](path, len(S['log'])) if S['fault'] else None
        full = os.path.join(S['dir'], path)
        if mode == 'error' or not os.path.isfile(full):
            self.send_error(500 if mode == 'error' else 404); return
        data = open(full, 'rb').read()
        if mode == 'garbage': data = b'<!DOCTYPE html><html><body><h1>Something went wrong</h1></body></html>'
        elif mode == 'flip': data = bytes([data[0] ^ 1]) + data[1:]
        elif mode == 'long': data += b'extra'
        elif mode == 'half': data = data[:len(data) // 2]
        self.send_response(200)
        self.send_header('Content-Type', 'text/plain; charset=utf-8')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        if mode == 'cut':                                   # the line drops half way through the file
            self.wfile.write(data[:len(data) // 2]); self.wfile.flush(); self.connection.close(); return
        self.wfile.write(data)


def sha(path):
    return hashlib.sha256(open(path, 'rb').read()).hexdigest()


def tree(d):
    out = {}
    for dp, _, fs in os.walk(d):
        for f in fs:
            rel = os.path.relpath(os.path.join(dp, f), d).replace(os.sep, '/')
            if rel != 'manifest.txt': out[rel] = sha(os.path.join(dp, f))
    return out


def retouch(d, rel, extra):
    """Changes one published file and corrects its line in the manifest."""
    full = os.path.join(d, rel)
    open(full, 'ab').write(extra)
    lines = open(os.path.join(d, 'manifest.txt'), encoding='utf-8').read().split('\n')
    lines = [f'{sha(full)} {os.path.getsize(full)} {rel}' if l.endswith(' ' + rel) else l for l in lines]
    open(os.path.join(d, 'manifest.txt'), 'w', encoding='utf-8').write('\n'.join(lines))


def main():
    work = tempfile.mkdtemp(prefix='gf-sync-')
    classes = os.path.join(work, 'classes')
    src = [os.path.join(root, 'android/app/src/main/java/com/nabeel/gamefeed/Sync.java'), os.path.join(root, 'tools/sync_cli/SyncCli.java')]
    r = subprocess.run(['javac', '-nowarn', '-d', classes] + src, capture_output=True, text=True)
    if r.returncode:
        print('The updater does not compile:\n' + r.stderr); sys.exit(1)

    # two published versions: A = the feed as it is, B = one game added, one changed, one retired
    reg = json.load(open(os.path.join(root, 'games.json'), encoding='utf-8'))
    A, B = os.path.join(work, 'A'), os.path.join(work, 'B')
    build_feed.build(A, copy.deepcopy(reg), 5)
    regB = copy.deepcopy(reg)
    inside = [g for g in regB['games'] if g['status'] in build_feed.IN_FEED]
    donor, retired, changed = inside[1], inside[0], inside[-1]
    seventh = copy.deepcopy(donor)
    seventh.update(number=regB['next_number'], id='test-seventh', name='Seventh Game', status='testing', storage_prefix='t7.')
    regB['games'].append(seventh)
    retired['status'] = 'retired'
    build_feed.build(B, regB, 6)
    changed_page = f"games/{changed['id']}/index.html"
    retouch(B, changed_page, b'\n<!-- a later version -->\n')
    new_page, gone_page = 'games/test-seventh/index.html', f"games/{retired['id']}/index.html"
    nA, nB = len(tree(A)), len(tree(B))

    Remote.S.update(dir=A, log=[], fault=None)
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Remote)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    base = f'http://127.0.0.1:{srv.server_address[1]}/'

    def sync(phone, apk=None, publish=None, fault=None, address=None):
        Remote.S.update(log=[], fault=fault)
        if publish: Remote.S['dir'] = publish
        cmd = ['java', '-cp', classes, 'com.nabeel.gamefeed.SyncCli', address or base, phone] + ([apk] if apk else [])
        p = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        try: out = json.loads(p.stdout.strip().split('\n')[-1])
        except Exception: raise RuntimeError('the updater said: ' + p.stdout[-300:] + p.stderr[-600:])
        out.update(out.pop('result'))
        out['asked'] = list(Remote.S['log'])
        return out

    def phone(name, start=None):
        d = os.path.join(work, name)
        if start: shutil.copytree(start, d)
        return d

    print('The updater:')
    # 1. a phone with nothing gets the whole feed
    p1 = phone('p1')
    r = sync(p1, publish=A)
    ok(r['ok'] and r['changed'] and r['fetched'] == nA and r['usable'] and r['localBuild'] == 5, 'a first copy fetches everything', str({k: r[k] for k in ('ok', 'fetched', 'error')}))
    ok(tree(p1) == tree(A), 'and the copy is exactly what is published')
    ok(r['asked'][0] == 'manifest.txt' and r['asked'][-2:] == ['games.js', 'index.html'], 'the list of games and the feed page arrive last', str(r['asked'][-3:]))
    # 2. nothing new: one small question, nothing fetched
    r = sync(p1)
    ok(r['ok'] and not r['changed'] and r['fetched'] == 0 and r['asked'] == ['manifest.txt'], 'nothing new means nothing fetched', str(r['asked']))
    # 3. a fresh install copies from inside the APK instead of downloading
    p3 = phone('p3')
    r = sync(p3, apk=A)
    ok(r['ok'] and r['fetched'] == 0 and r['fromApp'] == nA and r['asked'] == ['manifest.txt'] and tree(p3) == tree(A), 'files that are already inside the APK are not downloaded', str({k: r[k] for k in ('fetched', 'fromApp')}))
    # 4. a new game, a changed game and a retired game
    r = sync(p1, publish=B)
    want = sorted([new_page, changed_page, 'games.js'])
    ok(r['ok'] and r['changed'] and sorted(r['asked'][1:]) == want and r['asked'][-1] == 'games.js' and r['removed'] == 1 and r['localBuild'] == 6,
       'an update fetches only what is new or changed', str(r['asked']) + f" removed {r['removed']}")
    ok(tree(p1) == tree(B) and not os.path.exists(os.path.join(p1, gone_page)), 'and the phone then holds exactly the new version; the retired game is gone')
    # 5. the internet drops part way: keep what arrived, keep the old list, finish next time
    p5 = phone('p5', A)
    shutil.copy(os.path.join(A, 'manifest.txt'), os.path.join(p5, 'manifest.txt'))
    r = sync(p5, fault=lambda path, n: 'error' if n == 3 else None)
    landed = [x for x in (new_page, changed_page) if os.path.exists(os.path.join(p5, x)) and sha(os.path.join(p5, x)) == sha(os.path.join(B, x))]
    ok(not r['ok'] and r['changed'] and len(landed) == 1 and '500' in r['error'], 'a dropped connection is reported, and what arrived is kept', str(r['error']) + str(landed))
    ok(sha(os.path.join(p5, 'games.js')) == sha(os.path.join(A, 'games.js')) and os.path.exists(os.path.join(p5, gone_page)) and r['usable'] and r['localBuild'] == 5,
       'the feed on the phone still shows the old list and still works')
    ok(not os.path.exists(os.path.join(p5, '.part')), 'no half-written file is left behind')
    r = sync(p5)
    ok(r['ok'] and r['fetched'] == 2 and tree(p5) == tree(B), 'the next try fetches only the rest', str(r['asked']))
    # 6-8. wrong, too long, too short and cut-off files are never put in place
    for mode, word in (('flip', 'the wrong contents'), ('long', 'too much data'), ('half', 'too little data'), ('cut', 'a cut-off transfer')):
        pd = phone('p-' + mode, A)
        shutil.copy(os.path.join(A, 'manifest.txt'), os.path.join(pd, 'manifest.txt'))
        r = sync(pd, fault=lambda path, n, mode=mode: mode if path == changed_page else None)
        ok(not r['ok'] and sha(os.path.join(pd, changed_page)) == sha(os.path.join(A, changed_page)) and sha(os.path.join(pd, 'games.js')) == sha(os.path.join(A, 'games.js')) and not os.path.exists(os.path.join(pd, '.part')),
           f'a file with {word} is refused and the old one stays', r['error'])
    # 9. an out-of-date answer (GitHub can serve a stale copy for a few minutes) changes nothing
    r = sync(p1, publish=A)
    ok(r['ok'] and not r['changed'] and r['fetched'] == 0 and tree(p1) == tree(B) and r['localBuild'] == 6, 'an out-of-date answer is ignored')
    # 10. an error page instead of the list, a missing list, and no server at all
    before = tree(p1)
    r = sync(p1, publish=B, fault=lambda path, n: 'garbage' if path == 'manifest.txt' else None)
    ok(not r['ok'] and not r['changed'] and tree(p1) == before, 'an error page in place of the list is not believed', r['error'])
    r = sync(p1, fault=lambda path, n: 'error')
    ok(not r['ok'] and not r['changed'] and tree(p1) == before, 'a server error changes nothing', r['error'])
    r = sync(p1, address='http://127.0.0.1:9/')
    ok(not r['ok'] and not r['changed'] and tree(p1) == before, 'no internet changes nothing', r['error'])
    # 11. the published app is older than the one inside the APK: keep the APK's
    p11 = phone('p11')
    r = sync(p11, apk=B, publish=A)
    ok(r['ok'] and not r['changed'] and r['fetched'] == 0 and not r['usable'], 'a published app older than the installed one is not taken')
    # 12. a tampered list cannot write outside the folder or smuggle in odd names
    evil = phone('evil', B)
    for bad in ('../escape.txt', '/etc/passwd', 'games/../../escape.txt', '.hidden', 'manifest.txt', 'a b.txt'):
        text = open(os.path.join(B, 'manifest.txt'), encoding='utf-8').read() + f"{'0' * 64} 5 {bad}\n"
        open(os.path.join(evil, 'manifest.txt'), 'w', encoding='utf-8').write(text)
        pe = phone('pe-' + str(abs(hash(bad))))
        r = sync(pe, publish=evil)
        ok(not r['ok'] and not os.path.exists(os.path.join(work, 'escape.txt')) and not os.path.exists(pe + '/../escape.txt') and tree(pe) == {} if os.path.isdir(pe) else not r['ok'],
           f'a list naming "{bad}" is refused whole', r['error'])
    # 13. a file that went missing on the phone comes back
    os.remove(os.path.join(p1, new_page))
    r = sync(p1, publish=B)
    ok(r['ok'] and r['fetched'] == 1 and tree(p1) == tree(B), 'a file that went missing on the phone is fetched again')
    srv.shutdown()

    # 14. the whole journey, seen in the feed: open the fetched copy, a new game is published, the phone fetches it, the feed shows it first
    print('The whole journey:')
    try:
        from playwright.sync_api import sync_playwright
    except Exception:
        print('  (playwright is not installed: skipped)'); finish(work); return
    Remote.S.update(dir=A, log=[], fault=None)
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Remote)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    base2 = f'http://127.0.0.1:{srv.server_address[1]}/'
    pj = phone('journey')
    r = sync(pj, apk=A, publish=A, address=base2)
    with sync_playwright() as p:
        b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required', '--mute-audio'])
        ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, has_touch=True, is_mobile=True)
        # stands in for the phone app: reload() loads the feed again, as MainActivity does
        ctx.add_init_script("if (window === top) window.GameNative = { vibrate() {}, close() {}, version() { return '1.0.6'; }, ready(rev) { window.__ready = rev; }, reload(at) { sessionStorage.setItem('reloads', 1 + +(sessionStorage.getItem('reloads') || 0)); location.hash = at ? '#' + at : ''; location.reload(); } }; else window.GameNative = { vibrate() {} };")
        pg = ctx.new_page()
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto('file://' + os.path.join(pj, 'index.html'))
        pg.wait_for_function('window.__feed && window.__feed.cur()')
        n0 = pg.evaluate('window.__feed.games.length')
        ok(n0 == len(inside) and pg.evaluate('window.__ready') == pg.evaluate('window.__feed.build.rev') and pg.evaluate('window.__feed.fresh.length') == 0,
           'the feed opens from the fetched folder and tells the app it is running; nothing is marked New on a first run')
        # a game is running when the update lands: it must not be interrupted
        pg.wait_for_function('window.__feed.state().ready'); pg.wait_for_timeout(600)
        pg.evaluate('window.__feed.tap()'); pg.wait_for_timeout(800)
        r = sync(pj, apk=A, publish=B, address=base2)
        ok(r['ok'] and r['changed'], 'the phone fetches the new game while he plays')
        pg.evaluate(f"window.gameFeedUpdate({json.dumps({k: r[k] for k in ('ok', 'changed', 'build', 'rev', 'fetched')})})")
        pg.wait_for_timeout(500)
        st = pg.evaluate('window.__feed.state()')
        ok(st['state'] == 'playing' and pg.evaluate('window.__feed.pending') == r['rev'] and not pg.evaluate("sessionStorage.getItem('reloads')"), 'a running game is never interrupted by an update', str(st))
        # he swipes on: once the game he left has been put away, the feed takes the update at that quiet moment
        for _ in range(4):
            if pg.evaluate("sessionStorage.getItem('reloads')"): break
            pg.evaluate('window.__feed.go(1)'); pg.wait_for_timeout(1000)
        pg.wait_for_function('window.__feed && window.__feed.cur() && window.__feed.games.some(g => g.id === "test-seventh")', timeout=8000)
        st = pg.evaluate('window.__feed.state()')
        ids = pg.evaluate('window.__feed.games.map(g => g.id)')
        ok('test-seventh' in ids and retired['id'] not in ids, 'after the update the feed lists the new game and not the retired one', str(ids))
        on_card = pg.evaluate('location.hash.slice(1)')          # the card that was on screen when the feed took the update
        gone = on_card == retired['id']                         # ...which may have been the very game this update retires
        ok(st['pos'] == 0 and st['state'] == 'cover' and st['id'] == ('test-seventh' if gone else on_card),
           'the card he was looking at stays in front of him (or the new game, if his card was the retired game)', f"was on {on_card}, now {st['id']}")
        pg.wait_for_timeout(700)
        ok(pg.locator('#toast.on').count() == 1 and 'seventh game' in pg.locator('#toast').inner_text().lower(), 'a note says a new game arrived', pg.locator('#toast').inner_text())
        pg.wait_for_timeout(300)
        if not gone:
            pg.evaluate('window.__feed.go(1)'); pg.wait_for_timeout(900)
        st = pg.evaluate('window.__feed.state()')
        ok(st['id'] == 'test-seventh', 'and the new game is the very next card', str(st))
        ok(pg.locator('.slide .cover .new').count() >= 1 and pg.evaluate("window.__feed.cur().el.querySelector('.new') !== null"), 'marked New',
           str(pg.evaluate("({reloads: sessionStorage.getItem('reloads'), fresh: window.__feed.fresh, known: localStorage.getItem('gf.known'), hash: location.hash, hist: window.__feed.hist.map(e => e.id || e.type), pos: window.__feed.pos})")) + f' on_card={on_card} gone={gone}')
        os.makedirs(os.path.join(root, 'out', 'feed'), exist_ok=True)
        pg.screenshot(path=os.path.join(root, 'out', 'feed', 'new-game.png'))
        pg.wait_for_function('window.__feed.state().ready'); pg.wait_for_timeout(600)
        pg.evaluate('window.__feed.tap()'); pg.wait_for_timeout(1200)
        st = pg.evaluate('window.__feed.state()')
        ok(st['state'] == 'playing' and st['started'] is True, 'and it plays', str(st))
        pg.evaluate('window.__feed.halt(); window.__feed.openLib()'); pg.wait_for_timeout(400)
        foot = pg.locator('#list .foot').inner_text()
        ok('UP TO DATE' in foot.upper() or 'FEED' in foot.upper(), 'the games list shows which version is on the phone', foot)
        pg.screenshot(path=os.path.join(root, 'out', 'feed', 'games-list-new.png'))
        pg.reload(); pg.wait_for_function('window.__feed && window.__feed.cur()')
        ok(pg.evaluate('window.__feed.fresh.length') == 0, 'once seen, it is no longer New')
        ok(not errs, 'no errors on the way', '; '.join(errs[:3]))
        b.close()
    srv.shutdown()
    finish(work)


def finish(work):
    shutil.rmtree(work, ignore_errors=True)
    if fails:
        print(f'\nUPDATER PROBLEMS ({len(fails)}):')
        [print(' -', f) for f in fails]
        sys.exit(1)
    print(f'\nUpdater passed: {oks} checks.')


if __name__ == '__main__':
    main()
