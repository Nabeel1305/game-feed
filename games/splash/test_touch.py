#!/usr/bin/env python3
"""Splash Course with real touches, held upright and sideways: the left thumb's floating stick moves the runner (up the screen
is forward, right is right), and in the punch wall's side view right on the screen is forward; JUMP jumps when let go, and a
longer hold jumps farther; DUCK ducks while held; both thumbs at once work. Then the rules: a landing near a ball's middle is
clean and stays, near its edge it slides off; a splash puts you back at the start of that obstacle within two seconds, with a
second on the clock; the sweeper's arm knocks a standing runner in and a jump at the right moment clears it; its gate opens
after the sweeps; walking straight along the punch wall always gets punched; the treadmill carries you back, a hurdle trips
you and ducking passes a bar; the spinning cross carries you round; the finish line wins; the qualifying time running out
loses; relaxed practice has no clock. The Settings switch Music, Sound effects, Vibration, camera shake and the ghost on
their own and remember them. No errors.
Run: python3 games/splash/test_touch.py"""
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
        E("localStorage.setItem('spl.taught', '3'); __sim.go(1)"); pg.wait_for_timeout(300)
        E("(() => { const G = __sim.G; G.qual = 1e9; })()")
        Wd, Ht = E("[innerWidth > innerHeight ? innerWidth : innerHeight, innerWidth > innerHeight ? innerHeight : innerWidth]")
        sx, sy = Wd * 0.2, Ht * 0.6
        def push(dx, dy, ms=400, i=1):
            E("(() => { const P = __sim.G.p; P.x = 0; P.z = -3.5; P.vx = P.vz = 0; window.__p0 = [P.x, P.z]; })()")
            touch('touchStart', [at(i, sx, sy)]); touch('touchMove', [at(i, sx + dx * 0.5, sy + dy * 0.5)]); touch('touchMove', [at(i, sx + dx, sy + dy)]); pg.wait_for_timeout(ms)
            d = E("[__sim.G.p.x - __p0[0], __sim.G.p.z - __p0[1]]"); touch('touchEnd', [at(i, sx + dx, sy + dy)]); pg.wait_for_timeout(150); return d
        E("__sim.ui.phi = 0")
        d = push(0, -60); ok(d[1] > 0.6 and abs(d[0]) < 0.3, f'{tag}: pushing the stick up the screen runs forward', str(d))
        d = push(60, 0, 250); ok(d[0] > 0.4 and abs(d[1]) < 0.3, f'{tag}: pushing it right runs right', str(d))
        d = push(-60, 0, 250); ok(d[0] < -0.4, f'{tag}: and left runs left', str(d))
        E("(() => { __sim.go(3); const G = __sim.G; G.qual = 1e9; })()"); pg.wait_for_timeout(700)
        d = push(60, 0, 250); ok(d[1] > 0.4 and abs(d[0]) < 0.3, f'{tag}: in the side view (before the punch wall), right on the screen is forward', str([d, E("__sim.ui.phi")]))
        E("(() => { __sim.go(1); __sim.G.qual = 1e9; })()"); pg.wait_for_timeout(500)
        # JUMP: let go to jump; a longer hold jumps farther
        L = E("__sim.layout()"); J, D = L['jump'], L['duck']
        def jump(hold):
            E("(() => { const P = __sim.G.p; P.x = 0; P.z = -6.5; P.vx = P.vz = 0; })()"); __ = None
            touch('touchStart', [at(1, sx, sy)]); touch('touchMove', [at(1, sx, sy - 60)]); pg.wait_for_timeout(30)
            E("(() => { const P = __sim.G.p; P.x = 0; P.z = -6.5; P.vx = P.vz = 0; window.__j = null; })()")
            touch('touchStart', [at(1, sx, sy - 60), at(2, J['x'], J['y'])]); pg.wait_for_timeout(hold)
            st = E("[__sim.G.charging, __sim.G.p.state]"); touch('touchEnd', [at(2, J['x'], J['y'])]); pg.wait_for_timeout(40)
            up = E("[__sim.G.p.state, __sim.G.p.vy, Math.hypot(__sim.G.p.vx, __sim.G.p.vz)]"); touch('touchEnd', [at(1, sx, sy - 60)]); pg.wait_for_timeout(1300); return st, up
        st, up1 = jump(60); ok(st[0] is True and st[1] == 'ground', f'{tag}: holding JUMP crouches (nothing happens yet)', str(st))
        ok(up1[0] == 'air' and up1[1] > 4, f'{tag}: letting go jumps', str(up1))
        st, up2 = jump(450); ok(up2[1] > up1[1] + 0.8 and up2[2] > up1[2] + 1.0, f'{tag}: a longer hold jumps higher and farther', str([up1, up2]))
        E("(() => { __sim.go(1); __sim.G.qual = 1e9; })()"); pg.wait_for_timeout(300)
        touch('touchStart', [at(3, D['x'], D['y'])]); pg.wait_for_timeout(100); ok(E("__sim.G.p.duck") is True, f'{tag}: holding DUCK ducks')
        touch('touchEnd', [at(3, D['x'], D['y'])]); pg.wait_for_timeout(80); ok(E("__sim.G.p.duck") is False, f'{tag}: letting go stands up')
        ok(not errs, f'{tag}: no JavaScript errors', str(errs[:3])); ctx.close()
    # ---------- the rules ----------
    ctx = b.new_context(viewport={'width': 844, 'height': 390}); pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + os.path.join(here, 'index.html')); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(500); E = pg.evaluate
    S = "const G = __sim.G, X = __sim.x(), P = G.p; G.qual = 1e9; const run = (s, f) => { for (let i = 0; i < s * 60; i++) { if (f) f(i); __sim.step(1 / 60); } };"
    # drop the runner onto the first ball at an offset from its middle
    r = E("""(() => { const out = []; for (const off of [0.2, 1.2]) { __sim.start(1, { seed: 3 }); """ + S + """ const b = G.C.obs[0].balls[0]; P.state = 'air'; P.on = null; P.x = X.ballX(b, G.t) + off; P.z = b.cz; P.y = b.top + 0.6; P.vx = P.vz = P.vy = 0; let land = null; for (let i = 0; i < 120; i++) { const ev = __sim.stepEv(1 / 60); const l = ev.find(e => e.k === 'land'); if (l && !land) land = l; } out.push([land && land.clean, G.p.state, G.falls]); } return out; })()""")
    ok(r[0][0] is True and r[0][1] == 'ground' and r[0][2] == 0, 'a landing near the middle of a ball is clean and you stay on', str(r[0]))
    ok(r[1][0] is False and r[1][2] == 1, 'a landing near its edge slides you off into the water', str(r[1]))
    r = E("""(() => { __sim.start(4, { seed: 3 }); """ + S + """ G.cp = 0; const o = G.C.obs[0]; P.state = 'air'; P.on = null; P.x = 0; P.z = o.b0 - 0.6; P.y = 1.5; P.vy = -1; const c0 = G.clock; let t = 0, back = null; for (let i = 0; i < 240 && back == null; i++) { const ev = __sim.stepEv(1 / 60); t += 1 / 60; if (ev.some(e => e.k === 'respawn')) back = t; } return [back, G.p.z, G.C.plats[0].z1, G.clock - c0 - t, G.falls]; })()""")
    ok(r[0] is not None and r[0] <= 2.0 and abs(r[1] - (r[2] - 1.4)) < 0.01 and abs(r[3] - 1) < 0.02 and r[4] == 1, 'a splash: back at the start of that obstacle within two seconds, one second on the clock', str(r))
    # the sweeper
    SW = "__sim.start(2, { seed: 3 }); " + S + " const o = G.C.obs[0]; P.on = { kind: 'ped', o }; P.state = 'ground'; P.x = 0; P.z = o.pz; P.y = X.TOP; o.th = -0.8; const ang = 0;"
    r = E("(() => { " + SW + " let hit = false; for (let i = 0; i < 120 && !hit; i++) { const ev = __sim.stepEv(1 / 60); if (ev.some(e => e.k === 'hit')) hit = true; } return hit; })()")
    ok(r is True, "the sweeper's arm knocks a runner who stands still into the water", str(r))
    r = E("(() => { " + SW + " let hit = false, pass = 0; for (let i = 0; i < 180; i++) { const tA = ((((0 - o.th) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) / o.w; if (tA < 0.36 && tA > 0.3 && P.state === 'ground') { X.jumpOn(G, true); __sim.step(1 / 60); X.jumpOn(G, false); } const ev = __sim.stepEv(1 / 60); if (ev.some(e => e.k === 'hit')) hit = true; pass += ev.filter(e => e.k === 'pass').length; } return [hit, pass]; })()")
    ok(r[0] is False and r[1] == 1, 'a jump just before the arm arrives clears it and counts the sweep', str(r))
    r = E("(() => { " + SW + " o.n = o.need - 1; const before = X.support(G, 0, o.z1 + 1, X.TOP, 0.1); let open = false; for (let i = 0; i < 60 * 8 && !open; i++) { const tA = ((((0 - o.th) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) / Math.max(0.01, o.w); if (!o.done && tA < 0.36 && tA > 0.3 && P.state === 'ground') { X.jumpOn(G, true); __sim.step(1 / 60); X.jumpOn(G, false); } const ev = __sim.stepEv(1 / 60); if (ev.some(e => e.k === 'gate')) open = true; } const after = X.support(G, 0, o.z1 + 1, X.TOP, 0.1); return [!!before, open, !!after]; })()")
    ok(r == [False, True, True], "the gate past the sweeper is shut until the last sweep, then it opens", str(r))
    # the punch wall: walking straight through always gets punched
    r = E("""(() => { let punched = 0; const n = 24; for (let k = 0; k < n; k++) { __sim.start(3, { seed: 3 }); """ + S + """ run(k * 0.11); const o = G.C.obs[0]; P.x = 0; P.z = o.z0 - 0.3; let hit = false; for (let i = 0; i < 60 * 8 && !hit && G.cp === 0; i++) { X.setStick(G, 0, 1); const ev = __sim.stepEv(1 / 60); if (ev.some(e => e.k === 'hit')) hit = true; } if (hit) punched++; } return [punched, n]; })()""")
    ok(r[0] == r[1], 'walking straight along the punch wall (whenever you set off) always gets punched', str(r))
    # the treadmill
    BT = "__sim.start(4, { seed: 3 }); " + S + " const o = G.C.obs[0]; o.items.length = 0; P.on = { kind: 'belt', o }; P.state = 'ground'; P.x = 0; P.z = o.b0 + 6; P.y = X.TOP;"
    r = E("(() => { " + BT + " const z0 = P.z; run(1); return [z0 - P.z, o.v]; })()")
    ok(abs(r[0] - r[1]) < 0.15, 'standing still on the treadmill carries you back', str(r))
    r = E("(() => { " + BT + " o.items.push({ type: 'hurdle', s: 8.2 + o.sh, side: 1, hit: 0 }); let trip = false; run(2.5, () => X.setStick(G, 0, 1)); return G.p.stun > 0 || true; })()")
    r = E("(() => { " + BT + " o.items.push({ type: 'hurdle', s: 8.6 - o.b0 + o.b0 - o.b0 + (P.z - o.b0) + 2.5 + o.sh, side: 1, hit: 0 }); let trip = 0; for (let i = 0; i < 150; i++) { X.setStick(G, 0, 1); trip += __sim.stepEv(1 / 60).filter(e => e.k === 'trip').length; } return trip; })()")
    ok(r >= 1, 'running into a hurdle without jumping trips you', str(r))
    r = E("(() => { " + BT + " o.items.push({ type: 'bar', s: (P.z - o.b0) + 2.5 + o.sh, side: 1, hit: 0 }); let trip = 0, passed = false; for (let i = 0; i < 200; i++) { X.setStick(G, 0, 1); X.duckOn(G, true); trip += __sim.stepEv(1 / 60).filter(e => e.k === 'trip').length; } return trip; })()")
    ok(r == 0, 'ducking passes under a high bar', str(r))
    r = E("(() => { " + BT + " o.items.push({ type: 'bar', s: (P.z - o.b0) + 2.5 + o.sh, side: 1, hit: 0 }); let trip = 0; for (let i = 0; i < 200; i++) { X.setStick(G, 0, 1); trip += __sim.stepEv(1 / 60).filter(e => e.k === 'trip').length; } return trip; })()")
    ok(r >= 1, 'and running into it standing up knocks you down', str(r))
    # the spinning cross carries you round
    r = E("(() => { __sim.start(5, { seed: 3 }); " + S + " const o = G.C.obs[0]; o.th = Math.PI / 2; P.on = { kind: 'cross', o }; P.state = 'ground'; P.x = 0; P.z = o.cz + 3; P.y = X.TOP; const a0 = Math.atan2(P.z - o.cz, P.x); run(1); const a1 = Math.atan2(P.z - o.cz, P.x); return [a1 - a0, o.w, Math.hypot(P.x, P.z - o.cz), G.p.state]; })()")
    ok(abs(r[0] - r[1]) < 0.05 and abs(r[2] - 3) < 0.1 and r[3] == 'ground', 'the spinning cross carries you round with it', str(r))
    # the finish, the clock, practice
    r = E("(() => { __sim.start(1, { seed: 3 }); " + S + " G.qual = 30; const pl = G.C.plats[G.C.plats.length - 1]; G.cp = 1; P.on = { kind: 'plat', pl }; P.z = G.C.finZ - 0.5; run(1, () => X.setStick(G, 0, 1)); return [G.over, G.res && G.res.why, G.res && G.res.stars]; })()")
    ok(r[0] == 'won' and r[1] == 'finish' and r[2] >= 1, 'crossing the finish line wins (a medal for the time)', str(r))
    r = E("(() => { __sim.start(1, { seed: 3 }); const G = __sim.G; G.qual = 3; for (let i = 0; i < 60 * 4 && !G.over; i++) __sim.step(1 / 60); return [G.over, G.res && G.res.why]; })()")
    ok(r == ['lost', 'time'], 'the qualifying time running out loses', str(r))
    r = E("(() => { __sim.start(1, { seed: 3, free: true }); const G = __sim.G; G.qual = 3; for (let i = 0; i < 60 * 6 && !G.over; i++) __sim.step(1 / 60); return G.over; })()")
    ok(r is None, 'relaxed practice has no clock to beat', str(r))
    # ---------- settings ----------
    E("__sim.live(); localStorage.setItem('spl.settings', '{}'); localStorage.removeItem('spl.shake'); localStorage.removeItem('spl.ghost'); location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(600)
    sw = "['tMus', 'tSfx', 'tVib', 'tShake', 'tSlow'].map(i => document.getElementById(i).textContent === 'ON')"
    E("document.getElementById('setBtn').click()"); ok(E("!document.getElementById('ovSet').classList.contains('hidden')"), 'the Settings button opens the Settings card')
    ok(E(sw) == [True] * 5, 'everything starts on', str(E(sw)))
    E("document.getElementById('tMus').click()"); ok(E(sw) == [False, True, True, True, True], 'Music switches off on its own', str(E(sw)))
    E("document.getElementById('tVib').click()"); ok(E(sw) == [False, True, False, True, True], 'Vibration switches off on its own', str(E(sw)))
    E("document.getElementById('tShake').click()"); ok(E(sw) == [False, True, False, False, True], 'camera shake switches off on its own', str(E(sw)))
    E("document.getElementById('tSlow').click()"); ok(E(sw) == [False, True, False, False, False], 'the ghost switches off on its own', str(E(sw)))
    E("document.getElementById('tSfx').click()"); ok(E(sw) == [False] * 5, 'Sound effects switch off on their own', str(E(sw)))
    E("location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(500)
    ok(E(sw) == [False] * 5, 'the settings are remembered'); E("localStorage.setItem('spl.settings', '{}'); localStorage.removeItem('spl.shake'); localStorage.removeItem('spl.ghost')")
    ok(not errs, 'no JavaScript errors', str(errs[:3])); ctx.close(); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
