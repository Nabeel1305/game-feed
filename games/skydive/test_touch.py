#!/usr/bin/env python3
"""Skydive with real touches, held upright and sideways: in freefall, dragging forward flies you forward and dragging right
turns you right; holding TUCK falls faster and letting go slows again; a tap on CHUTE opens the canopy and the fall slows
hard; under the canopy dragging right turns right, pulling back brakes, holding FLARE slows the sink. Then the rules: the
wind carries the canopy; the ring on the ground is where you land; too low, the safety opens it and it costs points; a gold
ring counts when you fall through it; landing soft inside the circle wins, outside loses, hard loses (from level 4), in the
sea loses, off the roof loses, and a course needs every ring; scenic jumps go on. The Settings switch Music, Sound effects,
Vibration, the landing guide and camera shake on their own and remember them. No errors.
Run: python3 games/skydive/test_touch.py"""
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
        E("localStorage.setItem('sky.taught', '3'); __sim.go(4)"); pg.wait_for_timeout(300)
        E("(() => { const G = __sim.G; G.p.y += 3000; })()")
        Wd, Ht = E("[innerWidth > innerHeight ? innerWidth : innerHeight, innerWidth > innerHeight ? innerHeight : innerWidth]"); S0 = E("__sim.layout()")["s"]; sx, sy = S0["x"], S0["y"]      # (27 Nov 2026: the stick has one place; drags start in its middle)
        def drag(dx, dy, ms):
            touch('touchStart', [at(1, sx, sy)]); touch('touchMove', [at(1, sx + dx * 0.5, sy + dy * 0.5)]); touch('touchMove', [at(1, sx + dx, sy + dy)]); pg.wait_for_timeout(ms); r = E("[__sim.G.p.yaw, __sim.G.p.vx, __sim.G.p.vz, __sim.G.stick.x, __sim.G.stick.y]"); touch('touchEnd', [at(1, sx + dx, sy + dy)]); return r
        y0 = E("__sim.G.p.yaw"); r = drag(60, 0, 900); ok(r[0] - y0 > 0.4, f'{tag}: in freefall, dragging right turns you right', str([y0, r[0]]))
        r = drag(0, -60, 1800); fw = r[1] * __import__('math').cos(r[0]) + r[2] * __import__('math').sin(r[0])
        ok(fw > 10, f'{tag}: dragging forward flies you forward', str(fw))
        L = E("__sim.layout()"); A, B = L['a'], L['b']
        v0 = E("-__sim.G.p.vy"); touch('touchStart', [at(2, B['x'], B['y'])]); pg.wait_for_timeout(2500); v1 = E("-__sim.G.p.vy"); ok(E("__sim.G.tuck") is True and v1 > v0 + 8, f'{tag}: holding TUCK falls faster', str([v0, v1]))
        touch('touchEnd', [at(2, B['x'], B['y'])]); pg.wait_for_timeout(2500); v2 = E("-__sim.G.p.vy"); ok(E("__sim.G.tuck") is False and v2 - v1 < (v1 - v0) * 0.5, f'{tag}: letting go spreads you out: the fall stops speeding up (or slows, once you are fast)', str([v0, v1, v2]))      # 23 Nov 2026: real air drag, not a snap to a set speed
        touch('touchStart', [at(3, A['x'], A['y'])]); touch('touchEnd', [at(3, A['x'], A['y'])]); pg.wait_for_timeout(100); ok(E("__sim.G.p.phase") in ('opening', 'canopy'), f'{tag}: a tap on CHUTE opens the canopy')
        pg.wait_for_timeout(2200); ok(E("__sim.G.p.phase") == 'canopy' and E("-__sim.G.p.vy") < 12, f'{tag}: and the fall slows hard', str(E("[__sim.G.p.phase, -__sim.G.p.vy]")))
        y0 = E("__sim.G.p.yaw"); r = drag(60, 0, 900); ok(r[0] - y0 > 0.3, f'{tag}: under the canopy, dragging right turns right', str([y0, r[0]]))
        pg.wait_for_timeout(800); s0 = E("Math.hypot(__sim.G.p.vx - __sim.x().windAt(__sim.G, 500).x, __sim.G.p.vz - __sim.x().windAt(__sim.G, 500).z)")
        r = drag(0, 60, 1500); s1 = E("Math.hypot(__sim.G.p.vx - __sim.x().windAt(__sim.G, 500).x, __sim.G.p.vz - __sim.x().windAt(__sim.G, 500).z)")
        ok(r[4] < -0.5, f'{tag}: pulling back is the brakes', str(r));
        E("(() => { const G = __sim.G; G.stick = { x: 0, y: -1 }; })()"); pg.wait_for_timeout(1200); sb = E("Math.hypot(__sim.G.p.vx - __sim.x().windAt(__sim.G, 500).x, __sim.G.p.vz - __sim.x().windAt(__sim.G, 500).z)"); E("__sim.G.stick = { x: 0, y: 0 }")
        ok(sb < s0 - 3, f'{tag}: and they slow you down', str([s0, sb]))
        pg.wait_for_timeout(1500); v0 = E("-__sim.G.p.vy"); touch('touchStart', [at(4, A['x'], A['y'])]); pg.wait_for_timeout(900); v1 = E("-__sim.G.p.vy"); ok(E("__sim.G.flareOn") is True and v1 < v0 - 4, f'{tag}: holding FLARE slows the sink', str([v0, v1]))
        touch('touchEnd', [at(4, A['x'], A['y'])]); pg.wait_for_timeout(80); ok(E("__sim.G.flareOn") is False, f'{tag}: letting go stops the flare')
        ok(not errs, f'{tag}: no JavaScript errors', str(errs[:3])); ctx.close()
    # ---------- the rules ----------
    ctx = b.new_context(viewport={'width': 844, 'height': 390}); pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + os.path.join(here, 'index.html')); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(500); E = pg.evaluate
    CAN = "const G = __sim.G, X = __sim.x(), p = G.p; p.phase = 'canopy'; p.openAt = 300; p.vy = -9; p.vx = 0; p.vz = 0;"
    r = E("(() => { __sim.start(8, { seed: 3 }); " + CAN + " p.y = X.surfAt(G, p.x, p.z) + 300; const w = X.windAt(G, 200); p.yaw = Math.atan2(w.z, w.x) + Math.PI / 2; const x0 = p.x, z0 = p.z; X.setStick(G, 0, 0); for (let i = 0; i < 60 * 8; i++) { p.yaw += 0; __sim.step(1 / 60); } const dx = p.x - x0 - Math.cos(p.yaw) * 14 * 8, dz = p.z - z0 - Math.sin(p.yaw) * 14 * 8; return [dx * w.x + dz * w.z > 0, Math.hypot(w.x, w.z)]; })()")
    ok(r[0], 'the wind carries the canopy', str(r))
    r = E("(() => { __sim.start(6, { seed: 4 }); " + CAN + " p.y = X.surfAt(G, p.x, p.z) + 200; { const w = X.windAt(G, 200); p.vx = Math.cos(p.yaw) * 14 + w.x; p.vz = Math.sin(p.yaw) * 14 + w.z; } const P = X.predictLand(G, p.yaw, 0); G.cfg.hardOk = true; for (let i = 0; i < 60 * 60 && p.phase !== 'landed'; i++) __sim.step(1 / 60); return Math.hypot(p.x - P.x, p.z - P.z); })()")
    ok(r < 8, 'the ring on the ground is where you land', str(r))
    r = E("(() => { __sim.start(6, { seed: 5 }); const G = __sim.G, X = __sim.x(), p = G.p; let n = 0; while (p.phase === 'free' && n++ < 60 * 60) __sim.step(1 / 60); return [p.aad, Math.round(p.openAt)]; })()")
    ok(r[0] is True and r[1] <= 140, 'too low, the safety opens the canopy (and it costs points)', str(r))
    r = E("(() => { __sim.start(6, { seed: 6 }); const G = __sim.G, p = G.p; const rg = G.rings[0]; if (!rg) return 'no ring'; p.x = rg.x + 2; p.z = rg.z; p.y = rg.y + 3; p.vx = p.vz = 0; p.vy = -44; for (let i = 0; i < 20; i++) __sim.step(1 / 60); return [rg.done, G.ringPts]; })()")
    ok(r == [True, 150], 'a gold ring counts when you fall through it', str(r))
    LAND = """((N, seed, dx, vs, extra) => { __sim.start(N, { seed }); const G = __sim.G, X = __sim.x(), p = G.p; extra(G); p.phase = 'canopy'; p.openAt = 300; p.x = G.T.x + dx; p.z = G.T.z; p.y = X.surfAt(G, p.x, p.z) + 0.05; p.vx = 0; p.vz = 0; p.vy = -vs; __sim.step(1 / 60); for (let i = 0; i < 120 && !G.over; i++) __sim.step(1 / 60); return [G.over, G.res && G.res.why, G.landed && G.landed.q]; })"""
    r = E(LAND + "(5, 7, 3, 1.5, G => {})"); ok(r[0] == 'won' and r[2] == 'soft', 'a soft landing inside the circle wins', str(r))
    r = E(LAND + "(5, 7, 200, 1.5, G => {})"); ok(r[0] == 'lost' and r[1] == 'missed', 'outside the circle loses', str(r))
    r = E(LAND + "(5, 7, 3, 9, G => {})"); ok(r[0] == 'lost' and r[1] == 'hard', 'a hard landing loses (from level 4)', str(r))
    r = E("(() => { let s = 1; for (; s < 40; s++) { __sim.start(5, { seed: s }); const G = __sim.G, X = __sim.x(); if (G.cfg.isl && X.surfAt(G, G.T.x + 900, G.T.z) <= 0.01) break; } return s; })()")
    r = E(LAND + f"(5, {r}, 900, 1.5, G => {{}})"); ok(r[0] == 'lost' and r[1] == 'water', 'coming down in the sea loses', str(r))
    r = E(LAND + "(13, 3, 3, 1.5, G => {})"); ok(r[0] == 'won', 'on the roof (city levels) a soft landing on the X wins', str(r) + str(E("!!__sim.G.roof")))
    r = E(LAND + "(13, 3, 20 + 0.75 * 26 + 10, 1.5, G => { G.cfg = Object.assign({}, G.cfg, { zone: 200 }); })"); ok(r[0] == 'lost' and r[1] == 'street', 'off the roof (in the street) loses', str(r))
    r = E(LAND + "(8, 3, 3, 1.5, G => {})"); ok(r[0] == 'lost' and r[1] == 'course', 'a ring course needs every ring', str(r))
    r = E("(() => { __sim.start(3, { seed: 7, free: true }); const G = __sim.G, m = {}; let n = 0; for (let i = 0; i < 60 * 200 && !G.over; i++) { __sim.honest(G, { react: 0.2, acc: 1 }, m); const ev = __sim.stepEv(1 / 60); if (ev.some(e => e.k === 'again')) { n++; for (const k2 in m) delete m[k2]; } } return [G.over, n]; })()")
    ok(r[0] is None and r[1] >= 2, 'scenic jumps go on, one after another', str(r))
    # ---------- settings ----------
    E("__sim.live(); localStorage.setItem('sky.settings', '{}'); location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(600)
    sw = "['tMus', 'tSfx', 'tVib', 'tGuide', 'tShake'].map(i => document.getElementById(i).textContent === 'ON')"
    E("document.getElementById('setBtn').click()"); ok(E("!document.getElementById('ovSet').classList.contains('hidden')"), 'the Settings button opens the Settings card')
    E("document.getElementById('tMus').click()"); ok(E(sw) == [False, True, True, True, True], 'Music switches off on its own', str(E(sw)))
    E("document.getElementById('tVib').click()"); ok(E(sw) == [False, True, False, True, True], 'Vibration switches off on its own', str(E(sw)))
    E("document.getElementById('tSfx').click()"); ok(E(sw) == [False, False, False, True, True], 'Sound effects switch off on their own', str(E(sw)))
    E("document.getElementById('tGuide').click()"); E("document.getElementById('tShake').click()"); ok(E(sw) == [False, False, False, False, False], 'the landing guide and camera shake switch off on their own', str(E(sw)))
    E("location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(500)
    E("document.getElementById('setBtn').click()"); ok(E(sw) == [False, False, False, False, False], 'the settings are remembered'); E("localStorage.setItem('sky.settings', '{}'); localStorage.removeItem('sky.guide'); localStorage.removeItem('sky.shake')")
    ok(not errs, 'no JavaScript errors', str(errs[:3])); ctx.close(); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
