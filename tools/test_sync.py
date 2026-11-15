#!/usr/bin/env python3
"""Tests the part of the phone app that fetches new games (android/.../Sync.java), on this computer.

Sync.java is plain Java, so it can be compiled and run here with no phone and no Android tools. This builds
the feed app twice (the core games, and then with a made-up game added, one game changed and one retired), serves it
from a little web server standing in for GitHub, and runs the real updater against it:
a first copy, nothing new, a new game, a dropped connection, wrong or cut-off files, an out-of-date or
nonsense answer, a published app older than the installed one, and a tampered list.
Then the way games are kept (his design): the core games come from inside the app with no internet and stay;
any other game is fetched only when asked for, and cleared when the app next starts; a saved game stays and is
kept up to date; fetching with no internet or a bad file changes nothing.
Then it opens the feed from the phone's folder in a phone-sized browser, with the real updater doing the app's
part: a new game is added while he plays, comes up next marked New, is fetched when its card comes up, plays,
is saved from the Games list, survives a restart, and is not offered when there is no internet.
Last, the same for the games really on the app that are not core games (Bandit was the first): each is fetched by the
real updater exactly as published, plays from the phone's own files inside the feed, freezes, and can be saved.
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

    # two published versions: A = the core games, B = one game added, one changed, one retired
    # (The scenarios below are about one made-up game joining the core games, so they start from the core games alone. The games
    #  really on the app that are not core games, Bandit being the first, have their own part further down, built from the real list.)
    reg = json.load(open(os.path.join(root, 'games.json'), encoding='utf-8'))
    real_extra = [g for g in reg['games'] if build_feed.in_app(g) and g.get('core') is not True]
    regA = copy.deepcopy(reg)
    for g in regA['games']:
        if build_feed.in_app(g) and g.get('core') is not True: g['in_app'] = False
    A, B = os.path.join(work, 'A'), os.path.join(work, 'B')
    build_feed.build(A, copy.deepcopy(regA), 5)
    regB = copy.deepcopy(regA)
    inside = [g for g in regB['games'] if build_feed.in_app(g)]
    donor, retired, changed = inside[1], inside[0], inside[-1]
    seventh = copy.deepcopy(donor)                  # a new game on the app: not a core game, so played over the internet unless saved
    seventh.update(number=regB['next_number'], id='test-seventh', name='Seventh Game', status='testing', storage_prefix='t7.')
    del seventh['core']
    regB['games'].append(seventh)
    waiting = copy.deepcopy(donor)                  # a game he is still play-testing: finished, tested, but he has not said "put it on the app"
    waiting.update(number=regB['next_number'] + 1, id='test-waiting', name='Waiting Game', status='testing', storage_prefix='tw.')
    del waiting['in_app'], waiting['core']
    regB['games'].append(waiting)
    retired['status'] = 'retired'
    cards = {'test-seventh': donor['id']}
    build_feed.build(B, regB, 6, cards_from=cards)
    changed_page = f"games/{changed['id']}/index.html"
    retouch(B, changed_page, b'\n<!-- a later version -->\n')
    new_page, gone_page = 'games/test-seventh/index.html', f"games/{retired['id']}/index.html"
    new_files = sorted(k for k in tree(B) if build_feed.game_of(k) == 'test-seventh')       # its page, card picture and clip
    nA, nB = len(tree(A)), len(tree(B))
    listB = open(os.path.join(B, 'games.js'), encoding='utf-8').read() + open(os.path.join(B, 'manifest.txt'), encoding='utf-8').read()
    ok('test-seventh' in listB and 'test-waiting' not in listB and not os.path.exists(os.path.join(B, 'games', 'test-waiting')),
       'a game he has not asked to be put on the app is not published, whatever its status')

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

    def cli(*args):
        p = subprocess.run(['java', '-cp', classes, 'com.nabeel.gamefeed.SyncCli'] + list(args), capture_output=True, text=True, timeout=120)
        try: out = json.loads(p.stdout.strip().split('\n')[-1])
        except Exception: raise RuntimeError('the updater said: ' + p.stdout[-300:] + p.stderr[-600:])
        if 'result' in out: out.update(out.pop('result'))
        return out

    def fetch(phone, gid, apk=None, fault=None, address=None):
        Remote.S.update(log=[], fault=fault)
        out = cli('fetch', address or base, phone, gid, *([apk] if apk else []))
        out['asked'] = list(Remote.S['log'])
        return out

    print('The updater:')
    # (Scenarios 1 to 13 name no APK, or one that holds every game: then every game is kept, as before.)
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
    want = sorted(new_files + ['pics/test-seventh.webp', changed_page, 'games.js'])
    gone_files = [k for k in tree(A) if k not in tree(B)]              # the retired game's page, card picture, clip and list picture
    ok(r['ok'] and r['changed'] and sorted(r['asked'][1:]) == want and r['asked'][-1] == 'games.js' and r['removed'] == len(gone_files) == 4 and r['localBuild'] == 6,
       'an update fetches only what is new or changed', str(r['asked']) + f" removed {r['removed']}")
    ok(tree(p1) == tree(B) and not os.path.exists(os.path.join(p1, gone_page)), 'and the phone then holds exactly the new version; the retired game is gone')
    # 5. the internet drops part way: keep what arrived, keep the old list, finish next time
    p5 = phone('p5', A)
    shutil.copy(os.path.join(A, 'manifest.txt'), os.path.join(p5, 'manifest.txt'))
    r = sync(p5, fault=lambda path, n: 'error' if n == 3 else None)
    landed = [x for x in want if x != 'games.js' and os.path.exists(os.path.join(p5, x)) and sha(os.path.join(p5, x)) == sha(os.path.join(B, x))]
    ok(not r['ok'] and r['changed'] and len(landed) == 1 and '500' in r['error'], 'a dropped connection is reported, and what arrived is kept', str(r['error']) + str(landed))
    ok(sha(os.path.join(p5, 'games.js')) == sha(os.path.join(A, 'games.js')) and os.path.exists(os.path.join(p5, gone_page)) and r['usable'] and r['localBuild'] == 5,
       'the feed on the phone still shows the old list and still works')
    ok(not os.path.exists(os.path.join(p5, '.part')), 'no half-written file is left behind')
    r = sync(p5)
    ok(r['ok'] and r['fetched'] == len(want) - 1 and tree(p5) == tree(B), 'the next try fetches only the rest', str(r['asked']))
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
    # 12b. the feed page itself only ever comes from inside the APK: a change to the app is installed, never fetched
    apk1 = phone('apk1', A); retouch(apk1, 'index.html', b'\n<!-- the app as installed -->\n')
    ps = phone('pshell')
    r = sync(ps, apk=apk1, publish=B)
    theirs = {k: v for k, v in tree(B).items() if k not in new_files}; mine = tree(ps)      # (the new game is not a core game: it is not fetched)
    ok(r['ok'] and 'index.html' not in r['asked'] and mine['index.html'] == sha(os.path.join(apk1, 'index.html')) and mine['index.html'] != theirs['index.html']
       and all(mine[k] == v for k, v in theirs.items() if k != 'index.html') and set(mine) == set(theirs),
       'the feed page on the phone is the installed app\'s own; the rest is what is published', str(r['asked'][-3:]))
    r = sync(ps, apk=apk1)
    ok(r['ok'] and not r['changed'] and r['asked'] == ['manifest.txt'], 'and it is not touched again on the next check', str(r['asked']))
    apk2 = phone('apk2', A); retouch(apk2, 'index.html', b'\n<!-- a newer app, installed later -->\n')
    # the newer app carries a build number at least as high as what is published
    listing = open(os.path.join(apk2, 'manifest.txt'), encoding='utf-8').read().replace('build 5', 'build 6')
    open(os.path.join(apk2, 'manifest.txt'), 'w', encoding='utf-8').write(listing)
    r = sync(ps, apk=apk2)
    ok(r['ok'] and r['changed'] and r['fetched'] == 0 and tree(ps)['index.html'] == sha(os.path.join(apk2, 'index.html')), 'installing a newer app brings its own feed page', str({k: r[k] for k in ('fetched', 'fromApp', 'asked')}))
    # 13. a file that went missing on the phone comes back
    os.remove(os.path.join(p1, new_page))
    r = sync(p1, publish=B)
    ok(r['ok'] and r['fetched'] == 1 and tree(p1) == tree(B), 'a file that went missing on the phone is fetched again')

    # ---- which games a phone keeps (his design): the core games always, any other only when asked for, a saved one for good ----
    print('Core games, games played over the internet, and saved games:')
    core_ids = sorted(g['id'] for g in inside)
    left = sorted(set(core_ids) - {retired['id']})                 # the core games still on the app in the second version
    without_new = {k: v for k, v in tree(B).items() if k not in new_files}
    # 16. a new install with no internet at all: the core games come out of the app itself
    pc = phone('core')
    r = cli('seed', pc, A)
    ok(r['ok'] and r['changed'] and r['fetched'] == 0 and r['fromApp'] == nA and r['usable'] and r['localBuild'] == 5 and tree(pc) == tree(A) and sorted(r['here']) == core_ids,
       'a new install needs no internet: the feed and the core games are copied out of the app', str({k: r[k] for k in ('ok', 'fromApp', 'error', 'here')}))
    r = cli('seed', pc, A)
    ok(r['ok'] and not r['changed'] and r['fromApp'] == 0, 'and setting up again copies nothing')
    r = sync(pc, apk=A, address='http://127.0.0.1:9/')
    ok(not r['ok'] and r['usable'] and tree(pc) == tree(A), 'with no internet the phone keeps working from the core games')
    # 17. a new game is published: the phone takes the new list and the game's small list picture, not the game
    r = sync(pc, apk=A, publish=B)
    got = sorted(r['asked'][1:])
    ok(r['ok'] and r['changed'] and not any(f in got for f in new_files) and 'games.js' in got and 'pics/test-seventh.webp' in got and changed_page in got and r['asked'][-1] == 'games.js',
       'a new game is listed, but the game itself is not fetched; a changed core game is', str(got))
    ok(tree(pc) == without_new and sorted(r['here']) == left and r['saved'] == [], 'the phone then holds the core games and nothing else', str(r['here']))
    # 18. its card comes up: the game is fetched to be played, its page last
    r = fetch(pc, 'test-seventh', apk=A)
    ok(r['ok'] and sorted(r['asked'][1:]) == new_files and r['asked'][-1] == new_page and r['asked'][0] == 'manifest.txt' and 'test-seventh' in r['here'] and r['saved'] == [],
       'a game is fetched when asked for: its card picture and clip, then its page', str(r['asked']))
    ok(tree(pc) == tree(B), 'and it is the published game, checked file by file')
    r = fetch(pc, 'test-seventh', apk=A)
    ok(r['ok'] and r['asked'] == ['manifest.txt'] and r['fetched'] == 0, 'asking again fetches nothing')
    r = sync(pc, apk=A)
    ok(r['ok'] and not r['changed'] and tree(pc) == tree(B), 'looking for new games leaves a game that is being played alone')
    # 19. the next time the app starts, a game that was only played is cleared; the core games never are
    r = cli('prune', pc, A)
    ok(r['cleared'] == 1 and tree(pc) == without_new and sorted(r['here']) == left and not os.path.exists(os.path.join(pc, 'games', 'test-seventh')),
       'when the app next starts, a game that was only played is cleared away; the core games stay', str(r))
    r = cli('prune', pc, A)
    ok(r['cleared'] == 0 and tree(pc) == without_new, 'and clearing again changes nothing')
    # 20. saved: it stays through a restart, works with no internet, and is kept up to date
    fetch(pc, 'test-seventh', apk=A); r = cli('keep', pc, 'test-seventh')
    ok(r['ok'] and r['saved'] == ['test-seventh'] and 'test-seventh' in r['here'], 'a game can be saved')
    r = cli('prune', pc, A)
    ok(r['cleared'] == 0 and 'test-seventh' in r['here'] and all(os.path.exists(os.path.join(pc, f)) for f in new_files), 'a saved game is still there after the app starts again')
    r = fetch(pc, 'test-seventh', apk=A, address='http://127.0.0.1:9/')
    ok(not r['ok'] and 'test-seventh' in r['here'], 'with no internet a saved game is still on the phone', r['error'])
    B2 = phone('B2', B); retouch(B2, new_page, b'\n<!-- the saved game, improved -->\n')
    text = open(os.path.join(B2, 'manifest.txt'), encoding='utf-8').read().replace('build 6', 'build 7')
    open(os.path.join(B2, 'manifest.txt'), 'w', encoding='utf-8').write(text)
    r = sync(pc, apk=A, publish=B2)
    ok(r['ok'] and r['asked'][1:] == [new_page] and sha(os.path.join(pc, new_page)) == sha(os.path.join(B2, new_page)), 'a saved game is kept up to date like a core game', str(r['asked']))
    # 21. no longer saved: it goes the next time the app starts
    r = cli('forget', pc, 'test-seventh')
    ok(r['ok'] and r['saved'] == [] and 'test-seventh' in r['here'], 'a saved game can be let go; it stays until the app is closed')
    r = cli('prune', pc, A)
    ok(r['cleared'] == 1 and 'test-seventh' not in r['here'], 'and is cleared when the app next starts')
    # 22. fetching a game with no internet, a broken file, or a name that is not a game changes nothing
    before = tree(pc)
    r = fetch(pc, 'test-seventh', apk=A, address='http://127.0.0.1:9/')
    ok(not r['ok'] and tree(pc) == before and 'test-seventh' not in r['here'], 'no internet: the game is not fetched and nothing changes', r['error'])
    for mode, word in (('flip', 'the wrong contents'), ('half', 'too little data'), ('cut', 'a cut-off transfer')):
        r = fetch(pc, 'test-seventh', apk=A, fault=lambda path, n, mode=mode: mode if path == new_page else None)
        ok(not r['ok'] and 'test-seventh' not in r['here'] and not os.path.exists(os.path.join(pc, new_page)) and not os.path.exists(os.path.join(pc, '.part')),
           f'a game whose page arrives with {word} does not count as fetched', r['error'])
    for bad in ('no-such-game', '../escape', 'Games', ''):
        r = fetch(pc, bad, apk=A)
        ok(not r['ok'] and not os.path.exists(os.path.join(work, 'escape')), f'asking for "{bad}" fetches nothing', r['error'])
    r = fetch(pc, 'test-seventh', apk=A)
    ok(r['ok'] and 'test-seventh' in r['here'], 'and after all that, a good try still works')
    cli('prune', pc, A)
    # 23. the app is updated (a newer APK, with its own feed page): the folder is brought up to it with no internet; a saved game stays
    fetch(pc, 'test-seventh', apk=A); cli('keep', pc, 'test-seventh')
    apk3 = os.path.join(work, 'apk3')
    build_feed.build(apk3, regB, 9, core_only=True, cards_from=cards)
    retouch(apk3, 'index.html', b'\n<!-- the app, updated -->\n')
    ok(not any(build_feed.game_of(k) == 'test-seventh' for k in tree(apk3)) and 'test-seventh' in open(os.path.join(apk3, 'games.js'), encoding='utf-8').read()
       and open(os.path.join(apk3, 'manifest.txt')).readline() .split(' rev ')[1] == open(os.path.join(B, 'manifest.txt')).readline().split(' rev ')[1],
       'the app carries only the core games, the whole list, and the same name for that list as the published one')
    r = cli('seed', pc, apk3)
    ok(r['ok'] and r['changed'] and r['fetched'] == 0 and r['localBuild'] == 9 and sha(os.path.join(pc, 'index.html')) == sha(os.path.join(apk3, 'index.html'))
       and 'test-seventh' in r['here'] and r['saved'] == ['test-seventh'],
       'updating the app brings its own feed page with no internet, and a saved game is still there', str({k: r[k] for k in ('ok', 'fromApp', 'localBuild', 'here')}))
    r = cli('prune', pc, apk3)
    ok(r['cleared'] == 0 and 'test-seventh' in r['here'], 'and still there after the first start of the updated app')
    # 24. a folder that is newer than the app is left alone; a file that went missing is put back
    pn = phone('newer'); cli('seed', pn, A); sync(pn, apk=A, publish=B)
    before = tree(pn)
    r = cli('seed', pn, A)
    ok(r['ok'] and not r['changed'] and tree(pn) == before and r['localBuild'] == 6, 'a folder newer than the app is not put back to the app\'s older games')
    pm = phone('missing'); cli('seed', pm, A); os.remove(os.path.join(pm, f"games/{core_ids[0]}/index.html"))
    r = cli('seed', pm, A)
    ok(r['ok'] and r['fromApp'] == 1 and tree(pm) == tree(A), 'a core game that went missing on the phone is put back from the app')
    # 25. the feed page is the installed app's own from the first moment, whatever the folder already holds
    #     (a) the phone had already fetched the games published with the new app before he installed it (the usual case)
    psame = phone('same'); cli('seed', psame, A); sync(psame, apk=A, publish=B)
    apk6 = os.path.join(work, 'apk6')
    build_feed.build(apk6, regB, 6, core_only=True, cards_from=cards)
    retouch(apk6, 'index.html', b'\n<!-- the new app -->\n')
    before = tree(psame)
    r = cli('seed', psame, apk6)
    after = tree(psame)
    ok(r['ok'] and r['changed'] and r['fromApp'] == 1 and r['localBuild'] == 6 and after['index.html'] == sha(os.path.join(apk6, 'index.html')) != before['index.html']
       and {k: v for k, v in after.items() if k != 'index.html'} == {k: v for k, v in before.items() if k != 'index.html'},
       'a new app shows its own feed page at once, even when the phone already had the games published with it; nothing else is touched', str({k: r[k] for k in ('ok', 'fromApp', 'localBuild', 'error')}))
    r = cli('seed', psame, apk6)
    ok(r['ok'] and not r['changed'] and r['fromApp'] == 0, 'and the next start copies nothing')
    #     (b) the folder is already newer than the app being installed: its page still comes in; the newer games stay; a retired game does not come back
    before = tree(pn)
    r = cli('seed', pn, apk1)
    after = tree(pn)
    ok(r['ok'] and r['changed'] and r['fromApp'] == 1 and r['localBuild'] == 6 and after['index.html'] == sha(os.path.join(apk1, 'index.html')) != before['index.html']
       and {k: v for k, v in after.items() if k != 'index.html'} == {k: v for k, v in before.items() if k != 'index.html'} and not os.path.exists(os.path.join(pn, gone_page)),
       'the same when the folder is newer than the app: only the feed page changes, and a game taken off the app does not come back', str({k: r[k] for k in ('ok', 'fromApp', 'localBuild', 'error')}))
    r = sync(pn, apk=apk1)
    ok(r['ok'] and not r['changed'] and r['asked'] == ['manifest.txt'], 'and looking for new games after that changes nothing', str(r['asked']))
    #     (c) a core file missing from a newer folder is put back from the app, and brought up to date at the next look
    os.remove(os.path.join(pn, changed_page))
    r = cli('seed', pn, apk1)
    ok(r['ok'] and r['fromApp'] == 1 and sha(os.path.join(pn, changed_page)) == sha(os.path.join(apk1, changed_page)), 'a core game missing from a newer folder is put back from the app')
    r = sync(pn, apk=apk1)
    ok(r['ok'] and r['asked'][1:] == [changed_page] and sha(os.path.join(pn, changed_page)) == sha(os.path.join(B, changed_page)), 'and the next look brings it up to date', str(r['asked']))

    # ---- the app as it really is today: the games on it that are not core games (Bandit was the first) ----
    R, apkR, pr = os.path.join(work, 'R'), os.path.join(work, 'apkR'), phone('real')
    extra_ids = [g['id'] for g in real_extra]
    real_core = sorted(g['id'] for g in reg['games'] if build_feed.in_app(g) and g.get('core') is True)
    if real_extra:
        print('The games on the app today that are not core games (' + ', '.join(extra_ids) + '):')
        build_feed.build(R, copy.deepcopy(reg), 7)
        build_feed.build(apkR, copy.deepcopy(reg), 7, core_only=True)
        files_of = {x: sorted(k for k in tree(R) if build_feed.game_of(k) == x) for x in extra_ids}       # each one's page, card picture and clip
        kept = {k: v for k, v in tree(R).items() if build_feed.game_of(k) not in extra_ids}              # what a phone keeps without being asked
        listR = open(os.path.join(apkR, 'games.js'), encoding='utf-8').read()
        ok(not any(build_feed.game_of(k) in extra_ids for k in tree(apkR)) and all(f'"id":"{x}"' in listR.replace('": "', '":"') for x in extra_ids)
           and open(os.path.join(apkR, 'manifest.txt')).readline().split(' rev ')[1] == open(os.path.join(R, 'manifest.txt')).readline().split(' rev ')[1],
           'the app itself carries the core games only, lists every game, and calls that list by the same name as the published one')
        ok(all(len(files_of[x]) == 3 and f'games/{x}/index.html' in files_of[x] for x in extra_ids) and all(os.path.exists(os.path.join(R, 'pics', x + '.webp')) for x in extra_ids),
           'each has its page, its card picture, its clip and its small list picture published', str(files_of))
        r = cli('seed', pr, apkR)
        ok(r['ok'] and sorted(r['here']) == real_core and tree(pr) == tree(apkR), 'a new install: the core games come out of the app with no internet', str(r['here']))
        r = sync(pr, apk=apkR, publish=R)
        ok(r['ok'] and tree(pr) == kept and sorted(r['here']) == real_core and r['saved'] == [] and not any(f in r['asked'] for x in extra_ids for f in files_of[x]),
           'looking for new games brings the list and the small list pictures, not those games themselves', str(r['asked']))
        for x in extra_ids:
            r = fetch(pr, x, apk=apkR)
            ok(r['ok'] and sorted(r['asked'][1:]) == files_of[x] and r['asked'][-1] == f'games/{x}/index.html' and x in r['here']
               and all(sha(os.path.join(pr, f)) == sha(os.path.join(R, f)) for f in files_of[x]),
               f'{x} is fetched when its card comes up: card picture and clip, then its page, each exactly as published', str(r['asked']))
        ok(tree(pr) == tree(R), 'and the phone then holds exactly what is published')
        r = cli('prune', pr, apkR)
        ok(r['cleared'] == len(extra_ids) and tree(pr) == kept and sorted(r['here']) == real_core, 'when the app next starts they are cleared away again; the core games stay', str(r))
        fetch(pr, extra_ids[0], apk=apkR); r = cli('keep', pr, extra_ids[0]); r2 = cli('prune', pr, apkR)
        ok(r['ok'] and r2['cleared'] == 0 and extra_ids[0] in r2['here'] and r2['saved'] == [extra_ids[0]], f'{extra_ids[0]}, saved, stays on the phone through a restart')
        r = fetch(pr, extra_ids[0], apk=apkR, address='http://127.0.0.1:9/')
        ok(extra_ids[0] in r['here'], 'and is there with no internet')
        cli('forget', pr, extra_ids[0]); r = cli('prune', pr, apkR)
        ok(r['cleared'] == 1 and extra_ids[0] not in r['here'] and r['saved'] == [] and not any(os.path.exists(os.path.join(pr, f)) for f in files_of[extra_ids[0]]),
           'let go, it is cleared at the next start', str(r))
    srv.shutdown()

    # 14. the whole journey, seen in the feed: a new game is published while he plays; the phone fetches it; the feed adds it
    #     to what it is showing without reloading or disturbing anything; it is the next card, marked New.
    print('The whole journey:')
    try:
        from playwright.sync_api import sync_playwright
    except Exception:
        print('  (playwright is not installed: skipped)'); finish(work); return
    Remote.S.update(dir=A, log=[], fault=None)
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Remote)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    base2 = f'http://127.0.0.1:{srv.server_address[1]}/'
    # The phone app's side of the conversation. Fetching, saving and letting go are not done here: the page's requests
    # are collected in window.__asked, and the test then does what the app would do with the real updater (see app_does).
    NATIVE = """if (window === top) {
      window.__asked = [];
      window.GameNative = { vibrate() {}, close() {}, version() { return '1.0.21'; }, lastProblem() { return ''; }, ready(rev) { window.__ready = rev; },
        reload(at) { sessionStorage.setItem('reloads', 1 + +(sessionStorage.getItem('reloads') || 0)); sessionStorage.setItem('reloadAt', at); sessionStorage.setItem('reloadCard', (window.__feed && window.__feed.state().id) || ''); location.reload(); },
        onPhone() { return window.__phone || sessionStorage.getItem('phone') || '{}'; },
        fetchGame(id) { window.__asked.push(['play', id]); }, saveGame(id) { window.__asked.push(['save', id]); }, forgetGame(id) { window.__asked.push(['forget', id]); },
        check() { window.__checks = (window.__checks || 0) + 1; } };
    } else window.GameNative = { vibrate() {} };"""
    OLD_NATIVE = "if (window === top) window.GameNative = { vibrate() {}, close() {}, version() { return '1.0.6'; }, lastProblem() { return ''; }, ready(rev) { window.__ready = rev; }, reload(at) { sessionStorage.setItem('reloads', 1 + +(sessionStorage.getItem('reloads') || 0)); sessionStorage.setItem('reloadAt', at); sessionStorage.setItem('reloadCard', (window.__feed && window.__feed.state().id) || ''); location.reload(); } }; else window.GameNative = { vibrate() {} };"
    pj = phone('journey')
    cli('seed', pj, A)                                  # the app starts: the folder is made from the app itself...
    cli('prune', pj, A)
    r = sync(pj, apk=A, publish=A, address=base2)       # ...and then it looks for new games
    net = {'on': True}

    def phone_now(folder=pj, apk=A):
        st = cli('onphone', folder, apk)
        return json.dumps({'core': st['core'], 'saved': [x for x in st['saved'] if x in st['here']], 'here': st['here']})

    def app_does(pg, folder=pj, apk=A):
        """What the phone app does with the page's requests (MainActivity.wantGame / forgetGame), using the real updater."""
        done = []
        for why, gid in pg.evaluate('window.__asked.splice(0)'):
            if why == 'forget':
                good = cli('forget', folder, gid)['ok']
            else:
                res = fetch(folder, gid, apk=apk, address=base2 if net['on'] else 'http://127.0.0.1:9/')
                here = res['ok'] or gid in res['here']
                good = here
                if why == 'save' and here: good = cli('keep', folder, gid)['ok']
            now = json.loads(phone_now(folder, apk))
            answer = {'id': gid, 'why': why, 'ok': good, 'here': gid in now['here'], 'saved': gid in now['saved'], 'error': ''}
            pg.evaluate(f"window.__phone = {json.dumps(json.dumps(now))}; sessionStorage.setItem('phone', window.__phone); window.gameFeedGame({json.dumps(answer)})")
            done.append((why, gid, good))
        return done

    def open_app(b, errs, folder=pj, apk=A, more=''):
        ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, has_touch=True, is_mobile=True)
        ctx.add_init_script(NATIVE)
        ctx.add_init_script(f"if (window === top) window.__phone = {json.dumps(phone_now(folder, apk))};")
        if more: ctx.add_init_script(more)
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto('file://' + os.path.join(folder, 'index.html'))
        pg.wait_for_function('window.__feed && window.__feed.cur()')
        return ctx, pg

    with sync_playwright() as p:
        b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required', '--mute-audio'])
        errs = []
        ctx, pg = open_app(b, errs)
        F = lambda js: pg.evaluate('window.__feed.' + js)
        ok(F('games.length') == len(inside) and pg.evaluate('window.__ready') == F('build.rev') and F('fresh.length') == 0 and not F('builtIn') and F('canFetch'),
           'the feed opens from the folder on the phone and tells the app it is running; nothing is marked New on a first run')
        ok(all(F(f"isHere('{g['id']}')") for g in inside) and pg.evaluate('window.__asked.length') == 0, 'every core game is on the phone; nothing has to be fetched')
        born = pg.evaluate('performance.timeOrigin')
        pg.wait_for_function('window.__feed.state().ready'); pg.wait_for_timeout(600)
        F('tap()'); pg.wait_for_timeout(800)
        playing = F('state().id')

        # a new game is put on the app while he plays (and, as if the game that is taken off at the same time were one he had just been through)
        pg.evaluate("id => window.__feed.recent.push(id, id, id)", retired['id'])
        r = sync(pj, apk=A, publish=B, address=base2)
        ok(r['ok'] and r['changed'] and 'test-seventh' not in r['here'], 'the phone takes the new list while he plays, not the new game itself')
        pg.evaluate(f"window.__phone = {json.dumps(phone_now())}; window.gameFeedUpdate({json.dumps({k: r[k] for k in ('ok', 'changed', 'build', 'rev', 'fetched')})})")
        pg.wait_for_timeout(700)
        st = F('state()')
        ids = F('games.map(g => g.id)')
        ok(st['state'] == 'playing' and st['id'] == playing and pg.evaluate('performance.timeOrigin') == born and not pg.evaluate("sessionStorage.getItem('reloads')"),
           'the game he is playing carries on: nothing is reloaded', str(st))
        ok('test-seventh' in ids and (retired['id'] not in ids) and F('build.rev') == r['rev'], 'the feed now has the new game in its list, and no longer offers the retired one', str(ids))
        ok(pg.locator('#toast.on').count() == 0, 'no note is put over a game in play')
        ok(retired['id'] not in F('recent'), 'a game taken off the app is dropped from what the feed remembers of his last games')
        ok(not F("isHere('test-seventh')") and pg.evaluate('JSON.stringify(window.__asked)') == '[["play","test-seventh"]]',
           'the new game is not on the phone: the feed asks the app to fetch it, ready for when its card comes up', pg.evaluate('JSON.stringify(window.__asked)'))
        t0 = F('pos')
        F('go(1)'); pg.wait_for_timeout(900)
        st = F('state()')
        ok(st['id'] == 'test-seventh' and st['pos'] == t0 + 1 and st['state'] == 'cover', 'the new game is the very next card', str(st))
        ok(pg.evaluate("window.__feed.cur().el.querySelector('.new') !== null"), 'marked New')
        ok(pg.locator('#toast.on').count() == 1 and 'seventh game' in pg.locator('#toast').inner_text().lower(), 'and the note about it comes now that no game is running', pg.locator('#toast').inner_text())
        look = pg.evaluate("(() => { const s = window.__feed.cur(); return { fetching: s.el.classList.contains('fetching'), soft: !!s.poster && s.poster.classList.contains('soft'), tap: s.tapEl.textContent, chip: (s.el.querySelector('.chip.net') || {}).textContent }; })()")
        ok(look['fetching'] and look['soft'] and look['tap'] == 'Getting the game' and look['chip'] == 'Online', 'while it is being fetched its card waits, with a soft picture', str(look))
        os.makedirs(os.path.join(root, 'out', 'feed'), exist_ok=True)
        pg.screenshot(path=os.path.join(root, 'out', 'feed', 'new-game-fetching.png'))
        F('tap()'); pg.wait_for_timeout(200)                 # he taps before it has arrived: it starts by itself once it is here
        ok(F('state().state') == 'cover', 'a tap before the game has arrived does not break anything')
        done = app_does(pg)
        ok(done == [('play', 'test-seventh', True)] and F("isHere('test-seventh')"), 'the app fetches the game with the real updater', str(done))
        t = 0
        while t < 40 and not (F('state().state') == 'playing' and F('state().started') is True): pg.wait_for_timeout(100); t += 1
        st = F('state()')
        ok(st['state'] == 'playing' and st['started'] is True, 'and it starts by itself, because he had tapped', str(st))
        look = pg.evaluate("(() => { const s = window.__feed.cur(); return { fetching: s.el.classList.contains('fetching'), soft: !!s.poster && s.poster.classList.contains('soft'), src: s.poster ? s.poster.getAttribute('src') : '' }; })()")
        ok(not look['fetching'] and not look['soft'] and 'posters/test-seventh' in (look['src'] or ''), 'its card now shows its own picture', str(look))
        pg.screenshot(path=os.path.join(root, 'out', 'feed', 'new-game.png'))
        F('go(-1)'); pg.wait_for_timeout(900)
        st = F('state()')
        ok(st['id'] == playing and st['state'] == 'paused', 'the game he was in before is still there, paused where he left it', str(st))

        # the Games list: core games are marked as on the phone; any other game can be saved
        F('openLib()'); pg.wait_for_timeout(400)
        foot = pg.locator('#list .foot').inner_text()
        ok('UP TO DATE' in foot.upper() and r['rev'].upper() in foot.upper() and f"{len(left) + 1} ON THIS PHONE" in foot.upper(), 'the games list says it is up to date, which games version is on the phone, and how many games are on it', foot)
        rows = pg.evaluate("Array.from(document.querySelectorAll('#list .row')).map(r => [r.dataset.id, (r.querySelector('.save') || {}).className || '', (r.querySelector('.save') || {}).textContent || ''])")
        byrow = {x[0]: x for x in rows}
        ok(all('core' in byrow[g][1] and 'ON PHONE' in byrow[g][2].upper() for g in left) and byrow['test-seventh'][1] == 'save' and byrow['test-seventh'][2].upper() == 'SAVE',
           'in the Games list the core games say "On phone" and the new game has a Save button', str(rows))
        pg.screenshot(path=os.path.join(root, 'out', 'feed', 'games-list-new.png'))
        # the list stays tidy with the Save column in it, on a narrow phone too: no name cut short, small print in whole pieces, one-line labels
        for wide in (360, 390):
            pg.set_viewport_size({'width': wide, 'height': 844}); pg.wait_for_timeout(150)
            tidy = pg.evaluate("""(() => {
              const names = Array.from(document.querySelectorAll('#list .rn')), bits = Array.from(document.querySelectorAll('#list .rm .ml > span')), tags = Array.from(document.querySelectorAll('#list .row .save'));
              return { cut: names.filter(n => n.scrollHeight > n.clientHeight + 1 || n.scrollWidth > n.clientWidth + 1).length,
                       broken: bits.filter(b => b.getBoundingClientRect().height > 22).length,
                       tall: tags.filter(t => { const r = document.createRange(); r.selectNodeContents(t); return Array.from(r.getClientRects()).filter(x => x.width > 30 && x.height < 20).length > 1; }).length,
                       spill: Array.from(document.querySelectorAll('#list .row')).filter(r => r.scrollWidth > r.clientWidth + 1).length };
            })()""")
            ok(not any(tidy.values()), f'the Games list is tidy on a phone {wide} wide', str(tidy))
        pg.click('#list .row[data-id="test-seventh"] .save'); pg.wait_for_timeout(200)
        ok('busy' in pg.evaluate("document.querySelector('#list .row[data-id=\"test-seventh\"] .save').className") and pg.evaluate('JSON.stringify(window.__asked)') == '[["save","test-seventh"]]'
           and pg.evaluate("document.querySelector('#lib').classList.contains('open')"), 'tapping Save asks the app to keep the game, and the list stays open')
        done = app_does(pg); pg.wait_for_timeout(300)
        cls = pg.evaluate("document.querySelector('#list .row[data-id=\"test-seventh\"] .save').className")
        ok(done == [('save', 'test-seventh', True)] and 'on' in cls.split() and F("isSaved('test-seventh')") and 'SAVED: SEVENTH GAME' in pg.locator('#toast').inner_text().upper(),
           'the game is saved: the list says so and a note confirms it', cls + ' / ' + pg.locator('#toast').inner_text())
        pg.screenshot(path=os.path.join(root, 'out', 'feed', 'games-list-saved.png'))
        seen_note = pg.evaluate("(() => { const t = document.querySelector('#toast'), l = document.querySelector('#lib'); return t.classList.contains('on') && +getComputedStyle(t).zIndex > +getComputedStyle(l).zIndex; })()")
        ok(seen_note, 'and the note can be seen over the Games list')
        # "Check for new games" at the bottom of the list
        ok(pg.locator('#list .recheck').count() == 1 and 'CHECK FOR NEW GAMES' in pg.locator('#list .recheck').inner_text().upper(), 'the Games list has a "Check for new games" button')
        pg.click('#list .recheck'); pg.wait_for_timeout(150)
        ok(pg.evaluate('window.__checks') == 1 and pg.locator('#list .recheck').is_disabled() and 'CHECKING' in pg.locator('#list .recheck').inner_text().upper(), 'tapping it asks the app to look now, and says so')
        r = sync(pj, apk=A, address=base2)
        pg.evaluate(f"window.gameFeedUpdate({json.dumps({k: r[k] for k in ('ok', 'changed', 'build', 'rev', 'fetched')})})"); pg.wait_for_timeout(250)
        ok(not pg.locator('#list .recheck').is_disabled() and 'NO NEW GAMES' in pg.locator('#toast').inner_text().upper() and pg.evaluate("document.querySelector('#lib').classList.contains('open')"),
           'with nothing new it says "No new games" and the list stays as it was', pg.locator('#toast').inner_text())
        ok(not errs, 'no errors on the way', '; '.join(errs[:3]))
        ctx.close()

        # he closes the app and opens it again, with no internet: the saved game is there and plays
        cli('prune', pj, A)
        net['on'] = False
        ctx, pg = open_app(b, errs)
        F = lambda js: pg.evaluate('window.__feed.' + js)
        pg.evaluate("window.gameFeedUpdate({ok: false, changed: false, build: 0, rev: '', error: 'no internet'})")
        ok(F("isHere('test-seventh')") and F("isSaved('test-seventh')") and F('offline') and F('fresh.length') == 0, 'after closing and opening with no internet, the saved game is on the phone (and no longer New)')
        F("jump('test-seventh')"); pg.wait_for_timeout(900)
        pg.wait_for_function('window.__feed.state().ready'); pg.wait_for_timeout(500)
        F('tap()'); pg.wait_for_timeout(1000)
        st = F('state()')
        ok(st['id'] == 'test-seventh' and st['state'] == 'playing' and pg.evaluate('window.__asked.length') == 0, 'and it plays with no internet, without asking for anything', str(st))
        # let it go again
        F('openLib()'); pg.wait_for_timeout(300)
        pg.click('#list .row[data-id="test-seventh"] .save'); pg.wait_for_timeout(150)
        done = app_does(pg); pg.wait_for_timeout(200)
        cls = pg.evaluate("document.querySelector('#list .row[data-id=\"test-seventh\"] .save').className")
        ok(done == [('forget', 'test-seventh', True)] and cls == 'save' and not F("isSaved('test-seventh')") and F("isHere('test-seventh')"), 'tapping Saved lets the game go; it stays until the app is closed', cls)
        ok(not errs, 'no errors there', '; '.join(errs[:3]))
        ctx.close()

        # closed and opened once more, still with no internet: the game is gone from the phone, and the feed only offers what is on it
        r = cli('prune', pj, A)
        ctx, pg = open_app(b, errs)
        F = lambda js: pg.evaluate('window.__feed.' + js)
        pg.evaluate("window.gameFeedUpdate({ok: false, changed: false, build: 0, rev: '', error: 'no internet'})")
        ok(r['cleared'] == 1 and not F("isHere('test-seventh')") and F('offline'), 'a game that is no longer saved is cleared when the app starts again')
        ok(F("isHere(window.__feed.state().id)"), 'the app always opens on a game that is on the phone')
        app_does(pg); pg.wait_for_timeout(200)             # (anything it asked for before it knew there was no internet fails)
        seen = [F('state().id')]
        for _ in range(len(left) * 2 + 2):
            F('go(1)'); pg.wait_for_timeout(450); seen.append(F('state().id'))
        ok('test-seventh' not in seen and set(seen) == set(left) and pg.evaluate('window.__asked.length') == 0, 'with no internet, swiping only brings up games that are on the phone', str(seen))
        # he picks it from the list anyway: its card says it needs the internet, and nothing else happens
        F("jump('test-seventh')"); pg.wait_for_timeout(900)
        done = app_does(pg); pg.wait_for_timeout(200)
        look = pg.evaluate("(() => { const s = window.__feed.cur(); return { id: s.g.id, nonet: s.el.classList.contains('nonet'), text: s.oops.textContent, shown: getComputedStyle(s.oops).display }; })()")
        ok(done == [('play', 'test-seventh', False)] and look['id'] == 'test-seventh' and look['nonet'] and 'needs the internet' in look['text'] and look['shown'] != 'none',
           'picked from the list with no internet, its card says it needs the internet', str(look))
        pg.screenshot(path=os.path.join(root, 'out', 'feed', 'needs-internet.png'))
        F('openLib()'); pg.wait_for_timeout(300)
        pg.click('#list .row[data-id="test-seventh"] .save'); pg.wait_for_timeout(150)
        done = app_does(pg); pg.wait_for_timeout(200)
        ok(done == [('save', 'test-seventh', False)] and 'COULD NOT SAVE' in pg.locator('#toast').inner_text().upper() and not F("isSaved('test-seventh')"),
           'saving with no internet says so and saves nothing', pg.locator('#toast').inner_text())
        F('closeLib()'); pg.wait_for_timeout(300)
        # the internet comes back: the card that was waiting fetches the game by itself
        net['on'] = True
        r = sync(pj, apk=A, address=base2)
        pg.evaluate(f"window.gameFeedUpdate({json.dumps({k: r[k] for k in ('ok', 'changed', 'build', 'rev', 'fetched')})})"); pg.wait_for_timeout(200)
        ok(not F('offline') and pg.evaluate('JSON.stringify(window.__asked)') == '[["play","test-seventh"]]', 'when the internet is back, the waiting card asks for its game again by itself')
        done = app_does(pg); pg.wait_for_timeout(300)
        look = pg.evaluate("(() => { const s = window.__feed.cur(); return { id: s.g.id, nonet: s.el.classList.contains('nonet'), fetching: s.el.classList.contains('fetching') }; })()")
        ok(done == [('play', 'test-seventh', True)] and not look['nonet'] and not look['fetching'] and F("isHere('test-seventh')"), 'and then it is an ordinary card', str(look))
        pg.wait_for_function('window.__feed.state().ready'); pg.wait_for_timeout(400)
        F('tap()'); pg.wait_for_timeout(1000)
        ok(F('state().state') == 'playing', 'that plays')
        ok(not errs, 'no errors at the end of the journey', '; '.join(errs[:3]))
        ctx.close()

        # 15. straight after an install the feed runs from the copy inside the APK; it moves to the fetched folder once, at a quiet moment
        inapk = os.path.join(work, 'android_asset')
        shutil.copytree(A, inapk)
        ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, has_touch=True, is_mobile=True)
        ctx.add_init_script(NATIVE)
        pg = ctx.new_page()
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto('file://' + os.path.join(inapk, 'index.html'))
        pg.wait_for_function('window.__feed && window.__feed.cur()')
        ok(pg.evaluate('window.__feed.builtIn'), 'the feed knows when it is running from the copy inside the APK')
        pg.wait_for_function('window.__feed.state().ready'); pg.wait_for_timeout(600)
        pg.evaluate('window.__feed.tap()'); pg.wait_for_timeout(700)
        pg.evaluate("window.gameFeedUpdate({ok: true, changed: true, build: 6, rev: 'ffffffffffff', fetched: 3})"); pg.wait_for_timeout(400)
        ok(pg.evaluate('window.__feed.state().state') == 'playing' and not pg.evaluate("sessionStorage.getItem('reloads')") and pg.evaluate('window.__feed.pending') == 'ffffffffffff',
           'there too, a game in play is never interrupted')
        for _ in range(4):
            if pg.evaluate("sessionStorage.getItem('reloads')"): break
            pg.evaluate('window.__feed && window.__feed.go(1)'); pg.wait_for_timeout(1000)
        pg.wait_for_function('window.__feed && window.__feed.cur()')
        ok(pg.evaluate("sessionStorage.getItem('reloads')") == '1', 'once no game is in hand it asks the app, once, to load the fetched copy')
        at, card = pg.evaluate("[sessionStorage.getItem('reloadAt'), sessionStorage.getItem('reloadCard')]")
        ok(bool(at) and at == card, 'and names the card he is looking at, so the fetched copy opens on it', f'{at} vs {card}')
        ok(not errs, 'no errors there either', '; '.join(errs[:3]))
        ctx.close()

        # 26. the games really on the app that are not core games, in the feed, from the folder on the phone: picked, fetched by the
        #     real updater, played from the phone's own files, frozen, and offered a Save button
        if real_extra:
            print('In the feed, from the phone: ' + ', '.join(extra_ids))
            Remote.S.update(dir=R, log=[], fault=None); net['on'] = True
            sync(pr, apk=apkR, address=base2)
            errs = []
            # (a game that paints with the graphics chip is told to do so here, as a phone would: this machine has none. See LESSONS, "How to test")
            ctx, pg = open_app(b, errs, pr, apkR, more='window.__softGL = true;')
            F = lambda js: pg.evaluate('window.__feed.' + js)
            ok(F('games.length') == len(real_core) + len(extra_ids) and all(F(f"isHere('{c}')") for c in real_core) and not any(F(f"isHere('{x}')") for x in extra_ids) and F('canFetch'),
               'the feed lists every game; the core games are on the phone and the others are not')
            for g in real_extra:
                x = g['id']
                F(f"jump('{x}')"); pg.wait_for_timeout(900)
                done = app_does(pg, pr, apkR)
                ok(done == [('play', x, True)] and F(f"isHere('{x}')"), f'{x}: picked from the Games list, the app fetches it with the real updater', str(done))
                pg.wait_for_function('window.__feed.state().ready'); pg.wait_for_timeout(500)
                F('tap()')
                fr = pg.evaluate_handle('window.__feed.cur().frame').as_element().content_frame()
                t = 0
                while t < 80 and not (F('state().started') is True and fr.evaluate(g['feed']['live'])): pg.wait_for_timeout(100); t += 1      # (generous: a slow shared machine must not hold a game back)
                st = F('state()')
                ok(st['id'] == x and st['state'] == 'playing' and st['started'] is True and bool(fr.evaluate(g['feed']['live'])), f'{x}: it plays from the phone\'s own files, straight into the action', str(st))
                pg.wait_for_timeout(1500)
                ok(bool(fr.evaluate(g['feed']['live'])) and fr.evaluate('!!window.GameFeed'), f'{x}: and is still playing a moment later, with the feed\'s plug in its page')
                F('halt()'); pg.wait_for_timeout(200)
                c0 = fr.evaluate('performance.now()'); pg.wait_for_timeout(400)
                ok(fr.evaluate('performance.now()') == c0 and F('state().state') == 'paused', f'{x}: it freezes when the feed pauses it')
                pg.screenshot(path=os.path.join(root, 'out', 'feed', f'on-phone-{x}.png'))
            F('openLib()'); pg.wait_for_timeout(400)
            rows = pg.evaluate("Array.from(document.querySelectorAll('#list .row')).map(r => [r.dataset.id, (r.querySelector('.save') || {}).className || '', (r.querySelector('.save') || {}).textContent || ''])")
            byrow = {r0[0]: r0 for r0 in rows}
            ok(all('core' in byrow[c][1] and 'ON PHONE' in byrow[c][2].upper() for c in real_core) and all(byrow[x][1] == 'save' and byrow[x][2].upper() == 'SAVE' for x in extra_ids),
               'in the Games list the core games say "On phone" and each of the others has a Save button', str(rows))
            for wide in (360, 390):
                pg.set_viewport_size({'width': wide, 'height': 844}); pg.wait_for_timeout(150)
                tidy = pg.evaluate("""(() => {
                  const names = Array.from(document.querySelectorAll('#list .rn')), bits = Array.from(document.querySelectorAll('#list .rm .ml > span')), tags = Array.from(document.querySelectorAll('#list .row .save'));
                  return { cut: names.filter(n => n.scrollHeight > n.clientHeight + 1 || n.scrollWidth > n.clientWidth + 1).length,
                           broken: bits.filter(b => b.getBoundingClientRect().height > 22).length,
                           tall: tags.filter(t => { const r = document.createRange(); r.selectNodeContents(t); return Array.from(r.getClientRects()).filter(x => x.width > 30 && x.height < 20).length > 1; }).length,
                           spill: Array.from(document.querySelectorAll('#list .row')).filter(r => r.scrollWidth > r.clientWidth + 1).length };
                })()""")
                ok(not any(tidy.values()), f'the Games list, with the real games in it, is tidy on a phone {wide} wide', str(tidy))
            pg.screenshot(path=os.path.join(root, 'out', 'feed', 'games-list-real.png'))
            pg.click(f'#list .row[data-id="{extra_ids[0]}"] .save'); pg.wait_for_timeout(200)
            done = app_does(pg, pr, apkR); pg.wait_for_timeout(300)
            ok(done == [('save', extra_ids[0], True)] and F(f"isSaved('{extra_ids[0]}')"), f'{extra_ids[0]}: Save keeps it on the phone', str(done))
            ok(not errs, 'no errors with the real games', '; '.join(errs[:3]))
            ctx.close()
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
