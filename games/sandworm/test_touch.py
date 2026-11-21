#!/usr/bin/env python3
"""Sandworm Rider with real touches, held upright and sideways: dragging the stick right turns the worm right on the screen
(and left, left), and it turns late (heavy); letting go eases the turn off; holding SURGE speeds it up and letting go slows it
back; holding BRACE braces; the right thumb slides from SURGE to BRACE without lifting. Then the rules: a turn too sharp for
the speed drains balance; a rock knocks it and bracing takes most of the knock; empty balance is a fall, back at the last
waystone; three falls end the ride; a fast climb over a dune crest breaches; passing between a pair of waystones counts it and
the last one wins; sunset ends the ride; free roam goes on for ever. The Settings switch Music, Sound effects and Vibration
on their own and remember them. No errors.
Run: python3 games/sandworm/test_touch.py"""
import os, sys
from playwright.sync_api import sync_playwright
here = os.path.dirname(os.path.abspath(__file__)); fails = []; oks = 0
def ok(c, what, d=''):
    global oks
    if c: oks += 1; print('  ok  ', what)
    else: fails.append(what); print('  FAIL', what, d)
with sync_playwright() as p:
    b = p.chromium.launch()
    for vw, vh in ((390, 844), (844, 390)):
        tag = 'upright window' if vh > vw else 'sideways window'
        ctx = b.new_context(viewport={'width': vw, 'height': vh}, has_touch=True, is_mobile=True); pg = ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto('file://' + os.path.join(here, 'index.html')); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(800)
        E = pg.evaluate; cdp = ctx.new_cdp_session(pg)
        def toScreen(x, y): return (vw - y, x) if vh > vw else (x, y)
        def touch(kind, pts): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, x, y in pts]})
        def at(i, gx, gy): x, y = toScreen(gx, gy); return (i, x, y)
        def until(js, ms=8000):
            try: pg.wait_for_function(js, timeout=ms); return True
            except Exception: return False
        E("localStorage.setItem('swr.taught', '3'); __sim.go(1)"); pg.wait_for_timeout(300)
        E("(() => { const G = __sim.G; G.sunset = 1e9; G.route.rocks.length = 0; G.route.cracks.length = 0; })()")
        Wd, Ht = E("[innerWidth > innerHeight ? innerWidth : innerHeight, innerWidth > innerHeight ? innerHeight : innerWidth]")
        sx, sy = Wd * 0.2, Ht * 0.6
        # turning right on the screen: the heading turns towards the camera's right, late
        def turn(dx):
            E("(() => { const G = __sim.G; G.w.om = 0; G.w.h = __sim.ui.yaw; window.__h0 = G.w.h; })()")
            touch('touchStart', [at(1, sx, sy)]); touch('touchMove', [at(1, sx + dx * 0.5, sy)]); touch('touchMove', [at(1, sx + dx, sy)]); pg.wait_for_timeout(60)
            early = E("__sim.G.w.om"); pg.wait_for_timeout(900); late = E("__sim.G.w.om"); dh = E("__sim.G.w.h - window.__h0")
            touch('touchEnd', [at(1, sx + dx, sy)]); return early, late, dh
        e1, l1, d1 = turn(60)
        ok(l1 > 0.2 and d1 > 0.1, f'{tag}: dragging right turns the worm right', str([e1, l1, d1]))
        ok(abs(e1) < abs(l1) * 0.6, f'{tag}: and it answers late (a heavy head)', str([e1, l1]))
        ok(until("Math.abs(__sim.G.w.om) < 0.05", 4000), f'{tag}: letting go eases the turn off')
        e2, l2, d2 = turn(-60); ok(l2 < -0.2 and d2 < -0.1, f'{tag}: dragging left turns it left', str([l2, d2]))
        pg.wait_for_timeout(1500)
        L = E("__sim.layout()"); S, B = L['surge'], L['brace']
        v0 = E("__sim.G.w.v"); touch('touchStart', [at(2, S['x'], S['y'])]); pg.wait_for_timeout(100); ok(E("__sim.G.surge") is True, f'{tag}: holding SURGE surges')
        pg.wait_for_timeout(1800); v1 = E("__sim.G.w.v"); ok(v1 > v0 + 3, f'{tag}: and the worm speeds up', str([v0, v1]))
        touch('touchMove', [at(2, (S['x'] + B['x']) / 2 - 10, B['y'])]); touch('touchMove', [at(2, B['x'], B['y'])]); pg.wait_for_timeout(80)
        ok(E("__sim.G.brace") is True and E("__sim.G.surge") is False, f'{tag}: the thumb slides from SURGE onto BRACE without lifting')
        touch('touchEnd', [at(2, B['x'], B['y'])]); pg.wait_for_timeout(80); ok(E("__sim.G.brace") is False, f'{tag}: letting go of BRACE stops bracing')
        pg.wait_for_timeout(2500); ok(E("__sim.G.w.v") < v1 - 2, f'{tag}: let go and it slows back to cruising', str(E("__sim.G.w.v")))
        ok(not errs, f'{tag}: no JavaScript errors', str(errs[:3])); ctx.close()
    # ---------- the rules ----------
    ctx = b.new_context(viewport={'width': 844, 'height': 390}); pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + os.path.join(here, 'index.html')); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(500); E = pg.evaluate
    FR = "__sim.start(4, { seed: 31 }); const G = __sim.G, X = __sim.x(); G.sunset = 1e9; G.route.rocks.length = 0; G.route.cracks.length = 0; G.route.legs.forEach(l => { l.narrow = false; l.storm = false; }); G.cfg = Object.assign({}, G.cfg, { dunes: 0 });"
    r = E("(() => { " + FR + " G.w.v = 34; G.surge = true; X.setStick(G, -1, 0); let t = 0; for (let i = 0; i < 60 * 4; i++) { __sim.step(1 / 60); } const b1 = G.bal; return [b1, G.falls]; })()")
    ok(r[0] < 0.75 or r[1] > 0, 'a turn too sharp for the speed drains balance', str(r))
    r = E("(() => { " + FR + " G.w.v = 12; X.setStick(G, -0.25, 0); for (let i = 0; i < 60 * 4; i++) __sim.step(1 / 60); return G.bal; })()")
    ok(r > 0.97, 'a gentle turn at cruising speed does not', str(r))
    K = E("""(() => { const out = []; for (const br of [false, true]) { """ + FR + """ const w = G.w; G.route.rocks.push({ x: w.x + Math.cos(w.h) * 6, z: w.z + Math.sin(w.h) * 6, r: 4 }); X.braceOn(G, br); const b0 = G.bal; for (let i = 0; i < 20; i++) __sim.step(1 / 60); out.push(b0 - G.bal); } return out; })()""")
    ok(K[0] > 0.3 and K[1] < K[0] * 0.4, 'a rock knocks your balance, and bracing takes most of the knock', str(K))
    r = E("""(() => { """ + FR + """ for (let i = 0; i < 60 * 30 && G.wp < 2; i++) { __sim.honest(G, { react: 0.2, acc: 1 }, window.__m = window.__m || {}); __sim.step(1 / 60); } const cp = Object.assign({}, G.cp); G.w.x += 40; G.bal = 0.001; G.surge = false; X.setStick(G, -1, 0); G.w.v = 30; let n = 0; while (G.phase !== 'fall' && n++ < 200) __sim.step(1 / 60); const fell = G.phase === 'fall'; for (let i = 0; i < 200 && G.phase === 'fall'; i++) __sim.step(1 / 60); return [fell, G.phase, Math.round(Math.hypot(G.w.x - cp.x, G.w.z - cp.z)), G.falls, G.wp]; })()""")
    ok(r[0] and r[1] == 'ride' and r[2] < 3 and r[3] == 1, 'empty balance is a fall, back at the last waystone', str(r))
    r = E("""(() => { """ + FR + """ for (let f = 0; f < 3; f++) { G.bal = 0.001; X.setStick(G, -1, 0); G.w.v = 34; let n = 0; while (G.phase !== 'fall' && !G.over && n++ < 300) __sim.step(1 / 60); for (let i = 0; i < 120 && !G.over; i++) __sim.step(1 / 60); } return [G.over, G.res && G.res.why, G.falls]; })()""")
    ok(r[0] == 'lost' and r[1] == 'falls', 'three falls end the ride', str(r))
    r = E("""(() => { __sim.start(3, { seed: 7 }); const G = __sim.G, X = __sim.x(); G.sunset = 1e9; let br = 0, air = 0; G.surge = true; for (let i = 0; i < 60 * 40 && !br; i++) { __sim.honest(G, { react: 0.2, acc: 1 }, window.__m2 = window.__m2 || {}); G.surge = true; const ev = __sim.stepEv(1 / 60); if (ev.some(e => e.k === 'breach')) br = G.w.v; } let up = 0; for (let i = 0; i < 30; i++) { __sim.step(1 / 60); up = Math.max(up, G.w.y - X.sandH(G, G.w.x, G.w.z)); } return [br, up]; })()""")
    ok(r[0] > 20 and r[1] > 1, 'a fast climb over a dune crest breaches: the worm flies out of the sand', str(r))
    r = E("""(() => { __sim.start(3, { seed: 7 }); const G = __sim.G, X = __sim.x(); G.sunset = 1e9; G.blindT = null; for (let i = 0; i < 60 * 40 && !G.ev.length; i++) { X.setStick(G, 0, 0); __sim.step(1 / 60); } let way = 0; const n = G.route.pts.length - 1, m = {}; for (let i = 0; i < 60 * 200 && !G.over; i++) { __sim.honest(G, { react: 0.2, acc: 1 }, m); const ev = __sim.stepEv(1 / 60); way += ev.filter(e => e.k === 'way').length; } return [way, n, G.over]; })()""")
    ok(r[0] == r[1] and r[2] == 'won', 'every pair of waystones counts, and the last one wins', str(r))
    r = E("""(() => { __sim.start(3, { seed: 7 }); const G = __sim.G, X = __sim.x(); X.setStick(G, 0, 0); const P = G.route.pts[1]; G.w.x = P.x + 0; G.w.z = P.z + (X.gateR(G) + 25); let way = 0; for (let i = 0; i < 4; i++) { const ev = __sim.stepEv(1 / 60); way += ev.filter(e => e.k === 'way').length; } return [way, G.wp]; })()""")
    ok(r[0] == 0 and r[1] == 1, 'riding past outside the stones does not count', str(r))
    r = E("""(() => { __sim.start(3, { seed: 7 }); const G = __sim.G; G.sunset = 2; for (let i = 0; i < 60 * 3 && !G.over; i++) __sim.step(1 / 60); return [G.over, G.res && G.res.why]; })()""")
    ok(r[0] == 'lost' and r[1] == 'sunset', 'sunset ends the ride', str(r))
    r = E("""(() => { __sim.start(3, { seed: 7, free: true }); const G = __sim.G, m = {}; const n0 = G.route.pts.length; for (let i = 0; i < 60 * 150 && !G.over; i++) { __sim.honest(G, { react: 0.2, acc: 1 }, m); __sim.step(1 / 60); } return [G.over, G.route.pts.length > n0, G.wp > n0 - 1]; })()""")
    ok(r[0] is None and r[1] and r[2], 'free roam goes on for ever (the route grows)', str(r))
    # ---------- settings ----------
    E("__sim.live(); localStorage.setItem('swr.settings', '{}'); location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(600)
    sw = "['tMus', 'tSfx', 'tVib'].map(i => document.getElementById(i).textContent === 'ON')"
    E("document.getElementById('setBtn').click()"); ok(E("!document.getElementById('ovSet').classList.contains('hidden')"), 'the Settings button opens the Settings card')
    E("document.getElementById('tMus').click()"); ok(E(sw) == [False, True, True], 'Music switches off on its own', str(E(sw)))
    E("document.getElementById('tVib').click()"); ok(E(sw) == [False, True, False], 'Vibration switches off on its own', str(E(sw)))
    E("document.getElementById('tSfx').click()"); ok(E(sw) == [False, False, False], 'Sound effects switch off on their own', str(E(sw)))
    E("location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(500)
    ok(E(sw) == [False, False, False], 'the settings are remembered'); E("localStorage.setItem('swr.settings', '{}')")
    ok(not errs, 'no JavaScript errors', str(errs[:3])); ctx.close(); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
