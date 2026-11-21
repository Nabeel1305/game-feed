#!/usr/bin/env python3
"""Metro Map with real touches: a drag from station to station, let go on a station, draws a line and a train starts on it; a
drag let go off a station builds nothing; a drag from a line's end extends it; a drag from the middle of a stretch onto a
station routes the line through it; a tap on a line adds a spare train (none when none are spare); a tap on a station shows how
it is doing and adds nothing; a tap on an end tab shortens the line; crossing the river needs a bridge; the weekly choice is a
tap on a card; the speed button doubles the clock. Then the rules: passengers ride to their shape, change lines on their own,
an overcrowded station closes the metro (after a warning), running out of weeks loses, carrying enough wins. Pause stops the
clock. The Settings switch Music, Sound effects and Vibration on their own and remember them. No errors.
Run: python3 games/metro/test_touch.py"""
import os, sys
from playwright.sync_api import sync_playwright
here = os.path.dirname(os.path.abspath(__file__)); fails = []; oks = 0
def ok(c, what, d=''):
    global oks
    if c: oks += 1; print('  ok  ', what)
    else: fails.append(what); print('  FAIL', what, d)
SETUP = """(([pts, river]) => { const G = __sim.G; G.S = []; G.L = []; G.trains = []; G.sid = 0; G.lesson = null; G.choice = null; G.nextSt = 1e9; G.cfg.rush = false; G.cfg.close = false; G.rush = null; G.closure = null; G.weekT = 0; G.week = 0;
  G.free = { lines: 3, trains: 2, bridges: 0 }; G.river = river ? { pts: [[-0.5, 7], [10.5, 7]], w: 0.5 } : null;
  pts.forEach(([x, y, t], i) => G.S.push({ id: ++G.sid, x, y, type: t, q: [], over: 0, born: -10, closed: 0, cap: 6, rate: 0, served: 0 })); netChanged(G); G.cfg.rate = 0; })"""
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True); pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + os.path.join(here, 'index.html')); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(800)
    E = pg.evaluate; E("Object.assign(window, __sim.x())"); cdp = ctx.new_cdp_session(pg)
    def touch(kind, pts): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, (x, y) in pts]})
    def px(x, y): return E("([x, y]) => toPx(__sim.layout(), x, y)", [x, y])
    def tap(x, y): touch('touchStart', [(5, (x, y))]); touch('touchEnd', [(5, (x, y))]); pg.wait_for_timeout(80)
    def wtap(x, y): tap(*px(x, y))
    def drag(path, steps=8):      # path in world units
        P = [px(*q) for q in path]; touch('touchStart', [(1, P[0])])
        for a, c in zip(P, P[1:]):
            for i in range(1, steps + 1): touch('touchMove', [(1, (a[0] + (c[0] - a[0]) * i / steps, a[1] + (c[1] - a[1]) * i / steps))]); pg.wait_for_timeout(8)
        touch('touchEnd', [(1, P[-1])]); pg.wait_for_timeout(80)
    def mid(r): return (r['x'] + r['w'] / 2, r['y'] + r['h'] / 2)
    lines = lambda: E("__sim.G.L.map(l => l.st.slice())")
    E("localStorage.setItem('met.taught', '3'); __sim.go(4)"); pg.wait_for_timeout(300)
    E(SETUP, [[[2, 3, 'circle'], [5, 3, 'square'], [8, 3, 'tri'], [8, 6, 'circle'], [3.5, 5, 'tri'], [5, 10, 'square']], False])
    # ---------- building ----------
    drag([(2, 3), (5, 3), (8, 3)]); L0 = lines()
    ok(L0 == [[1, 2, 3]], 'a drag from station to station, let go on a station, draws a line through all three', str(L0))
    ok(E("__sim.G.trains.length") == 1 and E("__sim.G.free.trains") == 1, 'and a train starts on it')
    drag([(2, 3), (3, 7)]); ok(lines() == L0 and len(lines()) == 1, 'a drag let go off a station builds nothing', str(lines()))
    drag([(8, 3), (8, 6)]); ok(lines() == [[1, 2, 3, 4]], "a drag from the line's end extends it", str(lines()))
    drag([(3.5, 3), (3.5, 5)]); ok(lines() == [[1, 5, 2, 3, 4]], 'a drag from the middle of a stretch onto a station routes the line through it', str(lines()))
    t0 = E("__sim.G.trains.length"); wtap(6.5, 3); ok(E("__sim.G.trains.length") == t0 + 1 and E("__sim.G.free.trains") == 0, 'a tap on the line adds the spare train')
    wtap(6.5, 3); ok(E("__sim.G.trains.length") == t0 + 1, 'with no train spare, a tap adds nothing')
    wtap(5, 3); ok(E("__sim.G.inspect && __sim.G.inspect.id") == 2 and E("__sim.G.trains.length") == t0 + 1, 'a tap on a station shows how it is doing, and adds no train')
    ok(len(E("inspect(__sim.G, 6).reasons")) and 'No line' in E("inspect(__sim.G, 6).reasons[0]"), 'a station left out says why it struggles', str(E("inspect(__sim.G, 6).reasons")))
    tab = E("(() => { const G = __sim.G, l = G.L[0], a = st(G, l.st[l.st.length - 1]), b = st(G, l.st[l.st.length - 2]), d = Math.hypot(a.x - b.x, a.y - b.y); return [a.x + (a.x - b.x) / d * 0.75, a.y + (a.y - b.y) / d * 0.75]; })()")
    wtap(*tab); ok(lines() == [[1, 5, 2, 3]], "a tap on the end tab shortens the line", str(lines()))
    # ---------- the river ----------
    E("localStorage.setItem('met.taught', '3'); __sim.go(4)"); pg.wait_for_timeout(200)
    E(SETUP, [[[3, 4, 'circle'], [3, 10, 'square'], [7, 4, 'tri'], [7, 10, 'circle']], True])
    drag([(3, 4), (3, 10)]); ok(lines() == [], 'with no bridge, a line cannot cross the river', str(lines()))
    E("__sim.G.free.bridges = 1"); drag([(3, 4), (3, 10)]); ok(lines() == [[1, 2]] and E("bridgesLeft(__sim.G)") == 0, 'with a bridge it can, and the bridge is used')
    drag([(7, 4), (7, 10)]); ok(len(lines()) == 1, 'and the next crossing needs another')
    # ---------- the weekly choice, speed, pause ----------
    E("__sim.G.choice = { opts: ['line', 'train'] }"); fl = E("__sim.G.free.lines"); Lc = E("__sim.layout()")
    tap(*mid(Lc['ch'][0])); ok(E("__sim.G.choice") is None and E("__sim.G.free.lines") == fl + 1, 'the weekly choice is a tap on a card (a new line)')
    S = E("__sim.layout().speed"); tap(*mid(S)); ok(E("__sim.G.speed") == 2, 'the speed button doubles the clock'); tap(*mid(S)); ok(E("__sim.G.speed") == 1, 'and a second tap puts it back')
    E("document.getElementById('pauseBtn').click()"); t1 = E("__sim.G.t"); pg.wait_for_timeout(400); ok(E("__sim.G.t") == t1, 'pause stops the clock'); E("document.getElementById('pResume').click()")
    # ---------- the rules ----------
    E("__sim.start(4, { seed: 5 })"); E(SETUP, [[[2, 3, 'circle'], [5, 3, 'square'], [5, 7, 'tri']], False])
    E("(() => { const G = __sim.G; newLine(G, 1, 2); newLine(G, 2, 3); G.S[0].q.push({ dest: 'square', t0: G.t }); G.S[0].q.push({ dest: 'tri', t0: G.t }); })()")
    E("__sim.adv(30)"); ok(E("__sim.G.delivered") == 2, 'passengers ride to their shape, and change lines on their own', str(E("__sim.G.delivered")))
    ok(E("__sim.G.waitN") == 2 and E("__sim.G.waitSum / __sim.G.waitN") > 0, 'their waiting time is counted')
    E("__sim.start(4, { seed: 5 })"); E(SETUP, [[[2, 3, 'circle'], [5, 3, 'square']], False])
    E("(() => { const G = __sim.G; for (let i = 0; i < 12; i++) G.S[0].q.push({ dest: 'square', t0: 0 }); })()")
    ev = E("(() => { const out = []; for (let i = 0; i < 60 * 60 && !__sim.G.over; i++) out.push(...__sim.stepEv(1 / 60).map(e => e.k)); return out; })()")
    ok(E("__sim.G.over") == 'lost' and E("__sim.G.res.why.type") == 'circle', 'an overcrowded station closes the metro, and the end card says which', str(E("__sim.G.res")))
    ok('crowd' in ev and ev.index('crowd') < ev.index('lost'), 'with a warning first')
    t_lost = E("__sim.G.t"); ok(t_lost > 20, 'and only after the crowd has built for a while', str(t_lost))
    E("__sim.start(4, { seed: 5 })"); E(SETUP, [[[2, 3, 'circle'], [5, 3, 'square']], False])
    E("(() => { const G = __sim.G; G.cfg.weeks = 1; for (let i = 0; i < 60 * 50 && !G.over; i++) { __sim.step(1 / 60); } })()")
    ok(E("__sim.G.over") == 'lost' and E("__sim.G.res.time") is True, 'running out of weeks loses', str(E("__sim.G.res")))
    E("__sim.start(4, { seed: 5 })"); E(SETUP, [[[2, 3, 'circle'], [5, 3, 'square']], False])
    E("(() => { const G = __sim.G; newLine(G, 1, 2); G.cfg.target = 3; for (let i = 0; i < 3; i++) G.S[0].q.push({ dest: 'square', t0: 0 }); for (let i = 0; i < 60 * 20 && !G.over; i++) __sim.step(1 / 60); })()")
    ok(E("__sim.G.over") == 'won' and E("__sim.G.res.stars") >= 1, 'carrying enough wins', str(E("__sim.G.res")))
    # ---------- Settings ----------
    E("__sim.live(); localStorage.setItem('met.settings', '{}'); location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(600)
    sw = "['tMus', 'tSfx', 'tVib'].map(i => document.getElementById(i).textContent === 'ON')"
    ok(E("!!document.getElementById('setBtn').offsetParent"), 'the Settings button is on the home screen')
    E("document.getElementById('setBtn').click()"); ok(E("!document.getElementById('ovSet').classList.contains('hidden')"), 'it opens the Settings card')
    E("document.getElementById('tMus').click()"); ok(E(sw) == [False, True, True], 'Music switches off on its own', str(E(sw)))
    E("document.getElementById('tVib').click()"); ok(E(sw) == [False, True, False], 'Vibration switches off on its own', str(E(sw)))
    E("document.getElementById('tSfx').click()"); ok(E(sw) == [False, False, False], 'Sound effects switch off on their own', str(E(sw)))
    E("location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(500)
    ok(E(sw) == [False, False, False], 'the settings are remembered'); E("localStorage.setItem('met.settings', '{}')")
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
