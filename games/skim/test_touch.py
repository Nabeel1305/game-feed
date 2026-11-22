#!/usr/bin/env python3
"""Skimming Stones with real touches, held upright: put a thumb down and drag back down the screen to wind up (further is
harder; a little to one side aims the other way, like a catapult), let go to throw; a drag too short throws nothing; a tap on
one of the three stones at the bottom picks it; while the stone flies, a tap anywhere is the tap for its next kiss. Then the
rules: a tap right on the kiss is PERFECT and keeps most of the speed, no tap slows it a lot, a tap well early is a miss, extra
taps wobble it; a slow stone sinks; skipping through a floating ring counts it; a low pass over the jetty stops the stone
there; a lily pad and a duck stop a stone; the wind pushes a flat stone more than a heavy one; the goal met wins when the stone
comes to rest, running out of stones loses, "Just skim" has no limit. The Settings switch Music, Sound effects, Vibration,
camera shake and birdsong on their own and remember them. No errors.
Run: python3 games/skim/test_touch.py"""
import os, sys
from playwright.sync_api import sync_playwright
here = os.path.dirname(os.path.abspath(__file__)); fails = []; oks = 0
def ok(c, what, d=''):
    global oks
    if c: oks += 1; print('  ok  ', what)
    else: fails.append(what); print('  FAIL', what, d)
with sync_playwright() as p:
    b = p.chromium.launch()
    vw, vh = 390, 844
    ctx = b.new_context(viewport={'width': vw, 'height': vh}, has_touch=True, is_mobile=True); pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + os.path.join(here, 'index.html')); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(800)
    E = pg.evaluate; cdp = ctx.new_cdp_session(pg)
    def touch(kind, pts): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, x, y in pts]})
    def drag(x0, y0, x1, y1, end=True):
        touch('touchStart', [(1, x0, y0)]); n = 6
        for i in range(1, n + 1): touch('touchMove', [(1, x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n)])
        pg.wait_for_timeout(60); a = E("__sim.G.aim && [__sim.G.aim.ang, __sim.G.aim.pow]")
        if end: touch('touchEnd', [(1, x1, y1)]); pg.wait_for_timeout(40)
        return a
    def fresh(N=6): E(f"localStorage.setItem('skm.taught', '3'); __sim.go({N}); __sim.G.left = 99"); pg.wait_for_timeout(250)
    fresh()
    a = drag(195, 420, 195, 420 + 0.2 * vh); r = E("[__sim.G.phase, __sim.G.throws]")
    ok(a and 0.55 < a[1] < 0.8 and abs(a[0]) < 0.05, 'dragging straight back winds up the throw (about two thirds)', str(a))
    ok(r == ['fly', 1], 'letting go throws the stone', str(r))
    fresh(); a = drag(195, 420, 195 - 0.2 * vw, 420 + 0.25 * vh); pg.wait_for_timeout(500); x = E("__sim.G.s && __sim.G.s.x")
    ok(a and a[0] > 0.2 and x is not None and x > 0.5, 'dragging back and to the left aims to the right, like a catapult', str([a, x]))
    fresh(); drag(195, 420, 195, 430); r = E("[__sim.G.phase, __sim.G.throws, __sim.G.aim]")
    ok(r == ['aim', 0, None], 'a drag too short throws nothing', str(r))
    fresh(); L = E("__sim.layout()"); pk = L['picks'][2]; touch('touchStart', [(2, pk['x'], pk['y'])]); touch('touchEnd', [(2, pk['x'], pk['y'])]); pg.wait_for_timeout(60)
    ok(E("__sim.G.stone") == 2, 'a tap on the heavy stone picks it', str(E("__sim.G.stone")))
    ok(E("__sim.G.phase") == 'aim', 'picking a stone does not throw it')
    drag(195, 420, 195, 420 + 0.25 * vh); E("(() => { const G = __sim.G; while (G.s && G.s.tdT > 0.25) __sim.step(1 / 120); })()")
    touch('touchStart', [(3, 300, 300)]); touch('touchEnd', [(3, 300, 300)]); pg.wait_for_timeout(30)
    ok(E("__sim.G.s && __sim.G.s.tapT != null"), 'a tap anywhere while it flies is the tap for its next kiss', str(E("__sim.G.s && __sim.G.s.tapT")))
    ok(not errs, 'no JavaScript errors with touches', str(errs[:3]))
    # ---------- the rules ----------
    S = "const G = __sim.G, X = __sim.x(); const run = (s, f) => { const ev = []; for (let i = 0; i < s * 240 && !G.over; i++) { if (f) f(i); ev.push(...__sim.stepEv(1 / 240)); } return ev; }; const toKiss = () => { while (G.phase === 'fly' && G.s.tdT > 0.008) __sim.step(1 / 240); }; const kiss = () => { const e = []; for (let i = 0; i < 600 && !e.some(q => q.k === 'kiss' || q.k === 'sink'); i++) e.push(...__sim.stepEv(1 / 240)); return e.find(q => q.k === 'kiss' || q.k === 'sink'); };"
    T = lambda N=1, extra='': "__sim.start(" + str(N) + ", { seed: 3 }); " + S + extra
    r = E("(() => { " + T() + " X.setAim(G, 0, 0.7); X.release(G); toKiss(); const v0 = Math.hypot(G.s.vx, G.s.vz); X.tap(G); const e = kiss(); const v1 = Math.hypot(G.s.vx, G.s.vz); return [e.q, +(v1 / v0).toFixed(2)]; })()")
    ok(r[0] == 'perfect' and r[1] > 0.9, 'a tap right on the kiss is PERFECT and keeps most of the speed', str(r))
    r = E("(() => { " + T() + " X.setAim(G, 0, 0.7); X.release(G); toKiss(); const v0 = Math.hypot(G.s.vx, G.s.vz); const e = kiss(); const v1 = Math.hypot(G.s.vx, G.s.vz); return [e.q, +(v1 / v0).toFixed(2)]; })()")
    ok(r[0] == 'miss' and r[1] < 0.6, 'no tap: the stone loses a lot of speed', str(r))
    r = E("(() => { " + T() + " X.setAim(G, 0, 0.7); X.release(G); while (G.s.tdT > 0.45) __sim.step(1 / 240); X.tap(G); const e = kiss(); return [e.q, e.early]; })()")
    ok(r == ['miss', True], 'a tap well early is a miss (and it says so)', str(r))
    r = E("(() => { " + T() + " X.setAim(G, 0, 0.7); X.release(G); toKiss(); X.tap(G); X.tap(G); X.tap(G); const v0 = Math.hypot(G.s.vx, G.s.vz); const e = kiss(); return [e.q, +(Math.hypot(G.s.vx, G.s.vz) / v0).toFixed(2)]; })()")
    ok(r[0] == 'perfect' and r[1] < 0.75, 'extra taps make it wobble and slow down', str(r))
    r = E("(() => { " + T() + " X.setAim(G, 0, 0.3); X.release(G); const ev = run(8); const s = ev.find(e => e.k === 'sink'); return [!!s, G.phase]; })()")
    ok(r[0] and r[1] in ('rest', 'aim'), 'a stone that is too slow sinks', str(r))
    r = E("(() => { " + T(4) + " const R = G.L.rings[0]; R.x = 0; R.z = 8; G.L.rings.forEach((q, i) => { if (i) q.done = true; }); X.setAim(G, 0, 0.35); X.release(G); const ev = run(5, () => { if (G.phase === 'fly' && G.s.tdT < 0.008 && G.s.tapT == null) X.tap(G); }); return [R.done, ev.some(e => e.k === 'ring')]; })()")
    ok(r == [True, True], 'skipping through a floating ring counts it', str(r))
    r = E("(() => { " + T(5) + " G.L.jetty = { x: 0, z: 11, w: 6, d: 8 }; X.setAim(G, 0, 0.5); X.release(G); const ev = run(3); return [ev.some(e => e.k === 'jetty'), G.log.length && G.log[0].why]; })()")
    ok(r == [True, 'jetty'], 'a low pass over the jetty stops the stone there', str(r))
    r = E("(() => { " + T(6) + " G.L.pads = [{ x: 0, z: 0, r: 60 }]; X.setAim(G, 0, 0.6); X.release(G); const ev = run(3); return ev.some(e => e.k === 'pad'); })()")
    ok(r is True, 'a lily pad stops a stone', str(r))
    r = E("(() => { " + T(8) + " G.L.pads = []; G.L.ducks = [{ x0: 0, z: 6.6, amp: 0, w: 0, ph: 0, r: 0.6 }]; X.setAim(G, 0, 0.2); X.release(G); const ev = run(3); return ev.some(e => e.k === 'duck'); })()")
    ok(r is True, 'a duck stops a stone', str(r))
    r = E("(() => { const out = []; for (const st of [0, 2]) { " + T(20) + " G.L.pads = []; G.L.ducks = []; G.cfg.wind = 3; X.chooseStone(G, st); X.setAim(G, 0, 0.8); X.release(G); for (let i = 0; i < 240; i++) __sim.step(1 / 240); out.push(G.s.x); } return out; })()")
    ok(r[0] > r[1] > 0, 'the wind pushes a flat stone more than a heavy one', str(r))
    r = E("(() => { " + T(1) + " G.cfg.skips = 3; X.setAim(G, 0, 0.8); X.release(G); const ev = run(14, () => { if (G.phase === 'fly' && G.s.tdT < 0.008 && G.s.tapT == null) X.tap(G); }); return [G.goalHit, G.over, G.res && G.res.stars]; })()")
    ok(r == [True, 'won', 3], 'the goal met: it wins when the stone comes to rest (three stones to spare, three stars)', str(r))
    r = E("(() => { " + T(1) + " G.left = 1; X.setAim(G, 0, 0.2); X.release(G); run(6); return [G.over, G.res && G.res.why]; })()")
    ok(r == ['lost', 'stones'], 'out of stones loses', str(r))
    r = E("(() => { __sim.start(1, { seed: 3, free: true }); " + S + " for (let n = 0; n < 8; n++) { X.setAim(G, 0, 0.2); X.release(G); run(4); } return [G.over, G.throws]; })()")
    ok(r == [None, 8], '"Just skim" has no limit', str(r))
    r = E("(() => { __sim.start(1, { seed: 3 }); const G = __sim.G; __sim.winNow(); return [G.over, G.res.why]; })()")
    ok(r == ['won', 'goal'], 'the shortest real win works', str(r))
    # ---------- settings ----------
    E("__sim.live(); localStorage.setItem('skm.settings', '{}'); localStorage.removeItem('skm.shake'); localStorage.removeItem('skm.slow'); location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(600)
    sw = "['tMus', 'tSfx', 'tVib', 'tShake', 'tSlow'].map(i => document.getElementById(i).textContent === 'ON')"
    E("document.getElementById('setBtn').click()"); ok(E("!document.getElementById('ovSet').classList.contains('hidden')"), 'the Settings button opens the Settings card')
    ok(E(sw) == [True] * 5, 'everything starts on', str(E(sw)))
    E("document.getElementById('tMus').click()"); ok(E(sw) == [False, True, True, True, True], 'Music switches off on its own', str(E(sw)))
    E("document.getElementById('tVib').click()"); ok(E(sw) == [False, True, False, True, True], 'Vibration switches off on its own', str(E(sw)))
    E("document.getElementById('tShake').click()"); ok(E(sw) == [False, True, False, False, True], 'camera shake switches off on its own', str(E(sw)))
    E("document.getElementById('tSlow').click()"); ok(E(sw) == [False, True, False, False, False], 'birdsong switches off on its own', str(E(sw)))
    E("document.getElementById('tSfx').click()"); ok(E(sw) == [False] * 5, 'Sound effects switch off on their own', str(E(sw)))
    E("location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(500)
    ok(E(sw) == [False] * 5, 'the settings are remembered'); E("localStorage.setItem('skm.settings', '{}'); localStorage.removeItem('skm.shake'); localStorage.removeItem('skm.slow')")
    ok(not errs, 'no JavaScript errors', str(errs[:3])); ctx.close(); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
