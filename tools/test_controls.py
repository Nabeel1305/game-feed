#!/usr/bin/env python3
"""Tests the basic controls every game must have, the way a thumb would use them, in a phone-sized browser.

For each game that is on the app, and each one he is still play-testing (so it is ready the day he says
"put it on the app"):
  - a tap puts him on the level he was on (the saved level), not level 1
  - the pause button opens the same menu everywhere: Resume, Restart, Levels (and a way out)
  - while paused nothing moves; Resume carries on; Restart starts the same level afresh
  - Levels shows lower levels open and higher ones locked; Back returns to the pause menu;
    picking a lower level starts it at once
  - a win moves the saved level on at once, so leaving before pressing "Next" still brings him back to the next level
Any JavaScript error fails the test.
Run: python3 tools/test_controls.py            (add an id to test only that game)"""
import json, os, re, sys, threading, http.server, functools, time

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(root, 'tools'))
import build_feed

OUT = os.path.join(root, 'out', 'app')
W, H = 390, 844
fails, oks = [], 0


def ok(cond, what, detail=''):
    global oks
    if cond: oks += 1
    else:
        fails.append(what + (f' ({detail})' if detail else ''))
        print('  FAIL', what, detail)
    return cond


# How to read and steer each game. "tick" is a number that only moves while the game is running;
# "win" is JavaScript that makes the very next thing that happens a real win (the game's own code does the rest).
# Games made from the starter kit (kit/) all read and win the same way: __sim.winNow() is the shortest real win.
KIT = dict(tick='window.__sim.G.t', obj='window.__sim.G', back='#ovLevels [data-back]', nxt='#eMain', end='#ovEnd', home='#ovHome',
           win="(() => { const s = window.__sim; if (s.G && !s.G.over) { s.G.lesson = null; s.winNow(); } })()", won="window.__sim.G && window.__sim.G.over === 'won'")
LADDER = {
    'knockout': dict(
        tick='window.__sim.G.t', obj='window.__sim.G', back='#lvBack', nxt='#eNext', end='#ovEnd', home='#ovStart',
        win="(() => { const s = window.__sim; if (!s.G || s.G.over) return; s.G.ohp = 0.5; s.punch('L', 'head'); })()",
        won="window.__sim.G && window.__sim.G.over === 'won'"),
    'high-noon': dict(
        tick='window.__sim.G.t', obj='window.__sim.G', back='#ovLevels [data-back]', nxt='#eMain', end='#ovEnd', home='#ovHome',
        win="""(() => { const s = window.__sim, G = s.G; if (!G || G.over) return;
                 G.pW = Math.max(G.pW, s.O.firstTo - 1);
                 if (G.phase === 'ready' && !G.hold) s.hold();
                 else if (G.phase === 'draw') { const g = s.geo(); s.shoot(g.head.x, g.head.y); } })()""",
        won="window.__sim.G && window.__sim.G.over === 'won'"),
    'sword-fight': dict(
        tick='window.__sim.G.t', obj='window.__sim.G', back='#ovLevels [data-back]', nxt='#eMain', end='#ovEnd', home='#ovHome',
        win="""(() => { const s = window.__sim, G = s.G; if (!G || G.over || G.phase !== 'fight') return;
                 G.pW = Math.max(G.pW, s.K.firstTo - 1); G.ohp = 0.01; const g = s.geo(); s.poke(g.x, g.y); })()""",
        won="window.__sim.G && window.__sim.G.over === 'won'"),
    'zenith': dict(
        tick='window.__sim.G.t', obj='window.__sim.G', back='#ovLevels [data-back]', nxt='#eMain', end='#ovEnd', home='#ovHome',
        win="""(() => { const G = window.__sim.G; if (!G || G.over || G.phase !== 'play' || G.M.result) return;
                 G.idx = G.plan.length - 1; G.M.result = 'win'; })()""",
        won="window.__sim.G && window.__sim.G.over === 'won'"),
    'hippodrome': dict(
        tick='window.__sim.R.t', obj='window.__sim.R', back='#ovLevels [data-back]', nxt='#eMain', end='#ovEnd', home='#ovHome',
        win="""(() => { const R = window.__sim.R; if (!R || R.phase !== 'race') return; R.me.p = Math.max(R.me.p, R.laps * R.T.L - 3); })()""",
        won="window.__sim.R && (window.__sim.R.phase === 'finish' || window.__sim.R.phase === 'done') && window.__sim.R.res && window.__sim.R.res.place === 1"),
    'bandit': dict(
        tick='window.__sim.G.t', obj='window.__sim.G', back='#ovLevels [data-back]', nxt='#eMain', end='#ovEnd', home='#ovHome',
        win="""(() => { const s = window.__sim, G = s.G; if (!G || G.phase !== 'fight' || !G.foe.alive) return;
                 G.idx = G.cfg.bandits - 1; G.foe.hp = 0.4; s.place(250); G.in.fire = true; })()""",
        won="window.__sim.G && (window.__sim.G.phase === 'won' || window.__sim.G.phase === 'done') && window.__sim.G.res && window.__sim.G.res.win"),
    'plunder': dict(
        tick='window.__sim.G.t', obj='window.__sim.G', back='#ovLevels [data-back]', nxt='#eMain', end='#ovEnd', home='#ovHome',
        win="""(() => { const s = window.__sim, G = s.G; if (!G || G.over) return;
                 if (G.phase !== 'board' || G.fight.stage < 2) { s.cabin(); return; }      // straight to the captain
                 // (he is put off balance first: a man on guard turns every blow aside)
                 const F = G.fight, m = F.man; if (F.phase !== 'fight' || !m || m.z < 0.9 || m.os === 'yield') return;
                 m.hp = 0.01; m.os = 'stagger'; m.ot = 0; m.stag = 2; const g = s.geo(); s.poke(g.chest.x, g.chest.y); })()""",
        won="window.__sim.G && window.__sim.G.over === 'won'"),
}


def shown(pg, sel):
    return pg.evaluate("s => { const e = document.querySelector(s); return !!e && e.getClientRects().length > 0; }", sel)


def wait(pg, js, ms=5000):
    t = time.time()
    while time.time() - t < ms / 1000:
        try:
            if pg.evaluate(js): return True
        except Exception:
            pass
        pg.wait_for_timeout(50)
    return False


def lvl(pg):                       # the number on the pause menu's "Level n" line
    m = re.search(r'(\d+)', pg.inner_text('#pLvl'))
    return int(m.group(1)) if m else None


def saved(pg, prefix, key='level'):
    return pg.evaluate("k => { const v = localStorage.getItem(k); return v == null ? null : JSON.parse(v); }", prefix + key)


def open_game(browser, base, g, errs, seed):
    ctx = browser.new_context(viewport={'width': W, 'height': H}, device_scale_factor=2, has_touch=True, is_mobile=True)
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errs.append(g['id'] + ': ' + str(e)))
    # A game that paints with the phone's graphics chip (WebGL) falls back to plain drawing on a machine without one, as this
    # test machine is. Here it is told to use the chip's way all the same, so the way phones run it is the way that is tested.
    # (tools/check.py loads every game without this, so the plain way is tested too.)
    pg.add_init_script("window.__softGL = true")
    # a game on the app is tested as the app carries it (plug and all); one he is still play-testing, straight from the project
    url = f"{base[0]}/games/{g['id']}/index.html" if build_feed.in_app(g) else f"{base[1]}/{g['path']}"
    pg.goto(url)
    pg.evaluate("kv => { for (const k in kv) localStorage.setItem(k, JSON.stringify(kv[k])); }", seed)
    pg.goto(url)
    pg.wait_for_function('typeof window.gameFeedStart === "function"')
    return ctx, pg


def ladder(browser, base, g, errs):
    gid, c, live, pre = g['id'], LADDER.get(g['id'], KIT), g['feed']['live'], g['storage_prefix']
    T = lambda s: f'{gid}: {s}'
    ctx, pg = open_game(browser, base, g, errs, {pre + 'unlocked': 5, pre + 'level': 5, pre + 'mute': True})

    # a tap puts him on his own level
    pg.evaluate("window.gameFeedStart('mini')")
    ok(wait(pg, live, 2500), T('the instant start is live within moments'))
    pg.click('#pauseBtn')
    ok(shown(pg, '#ovPause'), T('the pause button opens the pause menu'))
    ok(all(shown(pg, s) for s in ('#pResume', '#pRestart', '#pLevels', '#pQuit')), T('the menu has Resume, Restart, Levels and a way out'))
    ok(lvl(pg) == 5, T('a tap starts the level he was on (5)'), f'menu says {lvl(pg)}')
    a = pg.evaluate(c['tick']); pg.wait_for_timeout(350); b = pg.evaluate(c['tick'])
    ok(a == b, T('nothing moves while paused'), f'{a} -> {b}')

    # resume
    pg.click('#pResume')
    ok(not shown(pg, '#ovPause'), T('Resume closes the menu'))
    t0 = time.time(); pg.wait_for_timeout(350)      # a busy runner can take longer than 350 ms to draw the next frame of a heavy 3D game (GitHub, 22 Nov 2026: Sandworm, once in 3540 checks): give it up to 4 s, a game that never carries on still fails
    while pg.evaluate(c['tick']) == b and time.time() - t0 < 4: pg.wait_for_timeout(150)
    ok(pg.evaluate(c['tick']) != b, T('Resume carries the game on'))

    # restart this match
    pg.evaluate(f"{c['obj']}.__mark = 1")
    pg.click('#pauseBtn'); pg.click('#pRestart')
    ok(not shown(pg, '#ovPause'), T('Restart closes the menu'))
    ok(wait(pg, f"{c['obj']} && !{c['obj']}.__mark", 1500), T('Restart starts a fresh match'))
    ok(wait(pg, live, 9000), T('the restarted match goes live'))
    pg.click('#pauseBtn')
    ok(lvl(pg) == 5, T('Restart keeps the same level'), f'menu says {lvl(pg)}')

    # levels: lower open, higher locked, Back returns to the pause menu
    pg.evaluate(f"{c['obj']}.__mark = 2")
    pg.click('#pLevels')
    ok(shown(pg, '#ovLevels') and not shown(pg, '#ovPause'), T('Levels opens the level list'))
    st = pg.evaluate("""() => { const q = n => document.querySelector('#lvGrid [data-l="' + n + '"]');
        return { low: !!q(3) && !q(3).disabled, cur: !!q(5) && !q(5).disabled, high: !!q(6) && q(6).disabled, mark: !!q(5) && q(5).classList.contains('cur') }; }""")
    ok(st['low'] and st['cur'], T('lower levels and his own level are open'), str(st))
    ok(st['high'], T('higher levels are locked'), str(st))
    ok(st['mark'], T('the list marks the level he is on'), str(st))
    pg.click('#lvGrid [data-l="6"]', force=True)
    ok(shown(pg, '#ovLevels') and saved(pg, pre) == 5, T('a locked level cannot be picked'))
    pg.click(c['back'])
    ok(shown(pg, '#ovPause') and not shown(pg, '#ovLevels'), T('Back from the list returns to the pause menu'))
    ok(pg.evaluate(f"{c['obj']}.__mark") == 2, T('the paused match is still there after looking at the list'))
    pg.click('#pLevels'); pg.click('#lvGrid [data-l="3"]')
    ok(not shown(pg, '#ovLevels') and not shown(pg, '#ovPause') and not shown(pg, c['home']), T('picking a lower level starts it at once'))
    ok(wait(pg, f"{c['obj']} && !{c['obj']}.__mark", 1500) and wait(pg, live, 9000), T('the picked level goes live'))
    ok(saved(pg, pre) == 3, T('the picked level is saved'), str(saved(pg, pre)))
    pg.click('#pauseBtn')
    ok(lvl(pg) == 3, T('he is playing the level he picked (3)'), f'menu says {lvl(pg)}')
    pg.click('#pResume')

    # a win moves the saved level on at once
    t = time.time()
    while time.time() - t < 25 and not pg.evaluate(c['won']):
        pg.evaluate(c['win']); pg.wait_for_timeout(200)
    ok(pg.evaluate(c['won']), T('the match can be won'))
    ok(wait(pg, f"JSON.parse(localStorage.getItem('{pre}level')) === 4", 3000), T('a win moves the saved level on at once'), str(saved(pg, pre)))
    ok(saved(pg, pre, 'unlocked') == 5, T('winning a lower level does not lock or unlock anything else'), str(saved(pg, pre, 'unlocked')))

    # leaving before pressing "Next" still brings him back to the next level
    pg.goto(pg.url)
    pg.wait_for_function('typeof window.gameFeedStart === "function"')
    pg.evaluate("window.gameFeedStart('mini')")
    ok(wait(pg, live, 2500), T('after coming back, a tap is live at once'))
    pg.click('#pauseBtn')
    ok(lvl(pg) == 4, T('he comes back to the next level (4)'), f'menu says {lvl(pg)}')

    # the way out goes home, and home shows the saved level
    pg.click('#pQuit')
    ok(shown(pg, c['home']) and not shown(pg, '#ovPause'), T('the way out goes to the home screen'))
    ctx.close()

    # the frontier: winning his highest level opens the next one and saves it
    ctx, pg = open_game(browser, base, g, errs, {pre + 'unlocked': 5, pre + 'level': 5, pre + 'mute': True})
    pg.evaluate("window.gameFeedStart('mini')")
    wait(pg, live, 2500)
    t = time.time()
    while time.time() - t < 25 and not pg.evaluate(c['won']):
        pg.evaluate(c['win']); pg.wait_for_timeout(200)
    ok(wait(pg, f"JSON.parse(localStorage.getItem('{pre}level')) === 6 && JSON.parse(localStorage.getItem('{pre}unlocked')) === 6", 9000),      # (a slow runner draws a heavy 3D game at a frame or two a second)
       T('winning his highest level opens and saves the next'), f"level {saved(pg, pre)}, unlocked {saved(pg, pre, 'unlocked')}")
    ok(wait(pg, f"(() => {{ const e = document.querySelector('{c['end']}'); return !!e && e.getClientRects().length > 0; }})()", 9000), T('the result screen appears'))
    pg.wait_for_timeout(300)
    pg.click(c['nxt'])
    ok(wait(pg, live, 9000), T('"Next" starts the next level'))
    pg.click('#pauseBtn')
    ok(lvl(pg) == 6, T('"Next" plays level 6'), f'menu says {lvl(pg)}')
    ctx.close()


def bottle_cap(browser, base, g, errs):
    gid, live, pre = g['id'], g['feed']['live'], g['storage_prefix']
    T = lambda s: f'{gid}: {s}'
    S = lambda pg: pg.evaluate('window.__sim.state')
    ctx, pg = open_game(browser, base, g, errs, {})
    pg.evaluate("window.gameFeedStart('mini')")
    ok(wait(pg, live, 2500), T('the instant start is live within moments'))
    ok(S(pg)['level'] == 'beginner' and S(pg)['mode'] == 'cpu', T('a first tap starts on the first level'), str(S(pg)))
    pg.click('#menuBtn')
    ok(shown(pg, '#pause') and S(pg)['paused'], T('the pause button opens the pause menu'))
    ok(all(shown(pg, s) for s in ('#pResume', '#pRestart', '#pLevels', '#pQuit')), T('the menu has Resume, Restart, Levels and a way out'))
    ok('Beginner' in pg.inner_text('#pLvl'), T('the menu names his level'), pg.inner_text('#pLvl'))
    pg.click('#pLevels')
    st = pg.evaluate("""() => { const q = k => document.querySelector('#lvList [data-pick="' + k + '"]');
        return { first: !q('beginner').disabled, second: q('amateur').disabled, top: q('legendary').disabled }; }""")
    ok(shown(pg, '#levels') and st['first'] and st['second'] and st['top'], T('only the first level is open to begin with'), str(st))
    pg.click('#lvBack')
    ok(shown(pg, '#pause') and not shown(pg, '#levels'), T('Back from the list returns to the pause menu'))
    pg.click('#pResume')
    ok(not shown(pg, '#pause') and not S(pg)['paused'], T('Resume closes the menu'))

    # a win opens the next level and saves it at once
    pg.evaluate("window.__sim.sweep('R')")
    ok(wait(pg, f"JSON.parse(localStorage.getItem('{pre}level')) === 'amateur'", 2000), T('a win moves the saved level on at once'), str(saved(pg, pre)))
    ok(wait(pg, "(() => { const e = document.querySelector('#over'); return e.getClientRects().length > 0; })()", 3000), T('the result card appears'))
    ok(shown(pg, '#nextLvBtn') and 'Amateur' in pg.inner_text('#nextLvBtn'), T('the result card offers the next level'))
    ok('now open' in pg.inner_text('#winSub'), T('the result card says the next level is open'), pg.inner_text('#winSub'))

    # leaving before pressing anything still brings him back to the next level
    pg.goto(pg.url)
    pg.wait_for_function('typeof window.gameFeedStart === "function"')
    pg.evaluate("window.gameFeedStart('mini')")
    ok(wait(pg, live, 2500) and S(pg)['level'] == 'amateur', T('he comes back to the next level'), str(S(pg)))

    # restart, and a lower level from the pause menu
    pg.click('#menuBtn'); pg.click('#pRestart')
    ok(not shown(pg, '#pause') and S(pg)['phase'] == 'setup' and S(pg)['level'] == 'amateur' and S(pg)['caps'] == 22, T('Restart starts the same level afresh'), str(S(pg)))
    pg.click('#menuBtn'); pg.click('#pLevels')
    st = pg.evaluate("""() => { const q = k => document.querySelector('#lvList [data-pick="' + k + '"]');
        return { first: !q('beginner').disabled, second: !q('amateur').disabled, third: q('professional').disabled }; }""")
    ok(st['first'] and st['second'] and st['third'], T('lower levels are open, higher ones locked'), str(st))
    pg.click('#lvList [data-pick="professional"]', force=True)
    ok(shown(pg, '#levels') and S(pg)['level'] == 'amateur', T('a locked level cannot be picked'))
    pg.click('#lvList [data-pick="beginner"]')
    ok(not shown(pg, '#levels') and S(pg)['level'] == 'beginner' and S(pg)['phase'] == 'setup' and saved(pg, pre) == 'beginner', T('picking a lower level starts it at once'), str(S(pg)))

    # the menus show the same thing: locked chips on the setup screen
    pg.click('#menuBtn'); pg.click('#pQuit')
    ok(shown(pg, '#home') and not shown(pg, '#pause'), T('the way out goes to the home screen'))
    pg.click('#playBtn')
    st = pg.evaluate("""() => { const q = k => document.querySelector('[data-lv="' + k + '"]');
        return { on: q('beginner').classList.contains('on'), second: !q('amateur').disabled, third: q('professional').disabled, top: q('legendary').disabled }; }""")
    ok(st['on'] and st['second'] and st['third'] and st['top'], T('the setup screen shows his level and locks the ones he has not reached'), str(st))
    ctx.close()


def main():
    from playwright.sync_api import sync_playwright
    listing, notes, problems = build_feed.build(OUT)
    if problems:
        print('build problems:', problems); sys.exit(1)
    games = [g for g in json.load(open(os.path.join(root, 'games.json')))['games'] if g['status'] in build_feed.IN_FEED or g['id'] in sys.argv[1:]]      # (a game still being built is tested when named)
    for g in games:
        if 'live' not in (g.get('feed') or {}): print(f"{g['id']}: needs feed.live in games.json (JavaScript that is true once he is in live play)"); sys.exit(1)
    only = sys.argv[1] if len(sys.argv) > 1 else None
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    base, servers = [], []
    for folder in (OUT, root):                  # the built app, and the project itself (for games not on the app yet)
        srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=folder))
        srv.handle_error = lambda *a: None      # a page dropping a request it no longer needs is not news
        threading.Thread(target=srv.serve_forever, daemon=True).start()
        base.append(f'http://127.0.0.1:{srv.server_address[1]}'); servers.append(srv)
    errs = []
    with sync_playwright() as p:
        browser = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
        for g in games:
            if only and g['id'] != only: continue
            t0 = time.time()
            try:
                if g['id'] in LADDER or os.path.exists(os.path.join(root, 'games', g['id'], 'part5.js')) and 'winNow' in open(os.path.join(root, 'games', g['id'], 'part5.js')).read(): ladder(browser, base, g, errs)
                elif g['id'] == 'bottle-cap-flick': bottle_cap(browser, base, g, errs)
                else: ok(False, f"{g['id']}: tools/test_controls.py does not know how to test this game's controls yet")
            except Exception as e:      # one game's test falling over must not hide the games after it, or its own page errors (22 Nov 2026: Splash Course)
                ok(False, f"{g['id']}: its test could not go on", str(e).split('\n')[0][:160] + ' | page errors: ' + ('; '.join(x for x in errs if x.startswith(g['id'] + ':'))[:300] or 'none'))
                for c in list(browser.contexts): c.close()
            print(f"  {g['id']}: done in {time.time() - t0:.0f}s")
        browser.close()
    for srv in servers: srv.shutdown()
    ok(not errs, 'no JavaScript errors', '; '.join(errs[:4]))
    if fails:
        print(f'\nControls FAILED: {len(fails)} of {oks + len(fails)} checks'); [print('  -', f) for f in fails]; sys.exit(1)
    print(f'Controls passed: {oks} checks.')


if __name__ == '__main__':
    main()
