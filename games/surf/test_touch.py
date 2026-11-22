#!/usr/bin/env python3
"""Surf with real touches, held upright and sideways: the left thumb's floating stick steers (up the screen is up the face,
right is along the wave); holding PADDLE (the right button) paddles; a swipe up while the wave lifts you stands you up; a
swipe in the air spins. Then the rules: standing too early does nothing, missing the lift lets the wave pass; down the face
gains speed and up spends it; the curl catches a rider who is too slow; a hard turn down at the lip is a snap, a turn back
towards the curl and out again a cutback; the same move again scores less; an air with a full spin and the nose down lands,
half a spin wipes out; crouched in a barrel scores, standing up in it wipes out; riding to the end of the wave adds a bonus;
the session is won on the target and lost after three waves without it; free surf goes on. The Settings switch Music, Sound
effects, Vibration, camera shake and slow-motion airs on their own and remember them. No errors.
Run: python3 games/surf/test_touch.py"""
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
        E("localStorage.setItem('srf.taught', '3'); __sim.go(1)"); pg.wait_for_timeout(300)
        Wd, Ht = E("[innerWidth > innerHeight ? innerWidth : innerHeight, innerWidth > innerHeight ? innerHeight : innerWidth]")
        L = E("__sim.layout()"); C = L['cr']; sx, sy = Wd * 0.2, Ht * 0.6
        # paddle, then stand with a swipe up as the wave lifts
        E("(() => { const G = __sim.G; G.pt = G.tL - 1.0; })()")
        touch('touchStart', [at(2, C['x'], C['y'])]); pg.wait_for_timeout(150); ok(E("__sim.G.crouch") is True, f'{tag}: holding PADDLE paddles')
        pg.wait_for_timeout(900); touch('touchEnd', [at(2, C['x'], C['y'])])
        E("(() => { const G = __sim.G; G.pt = G.tL; G.paddle = 1; })()")
        sw = (Wd * 0.75, Ht * 0.45)
        touch('touchStart', [at(3, sw[0], sw[1])]); touch('touchMove', [at(3, sw[0], sw[1] - 30)]); touch('touchMove', [at(3, sw[0], sw[1] - 70)]); touch('touchEnd', [at(3, sw[0], sw[1] - 70)]); pg.wait_for_timeout(100)
        ok(E("__sim.G.phase") == 'ride', f'{tag}: a swipe up as the wave lifts you stands you up', E("__sim.G.phase"))
        # steering: up the screen is up the face, right is along the wave
        def push(dx, dy):
            touch('touchStart', [at(1, sx, sy)]); touch('touchMove', [at(1, sx + dx * 0.5, sy + dy * 0.5)]); touch('touchMove', [at(1, sx + dx, sy + dy)]); pg.wait_for_timeout(60)
            s = E("[__sim.G.stick.x, __sim.G.stick.y]"); touch('touchEnd', [at(1, sx + dx, sy + dy)]); pg.wait_for_timeout(40); return s
        s = push(0, -60); ok(s[1] > 0.8 and abs(s[0]) < 0.2, f'{tag}: pushing up the screen steers up the face', str(s))
        s = push(60, 0); ok(s[0] > 0.8 and abs(s[1]) < 0.2, f'{tag}: pushing right steers along the wave', str(s))
        s = push(0, 60); ok(s[1] < -0.8, f'{tag}: pushing down steers down the face', str(s))
        # a swipe in the air spins
        E("(() => { const G = __sim.G, P = G.p; G.phase = 'ride'; P.air = true; P.h = 3; P.vy = 8; P.spinTo = null; P.rot = 0; G.xb = P.x - 30; })()")
        touch('touchStart', [at(3, sw[0], sw[1])]); touch('touchMove', [at(3, sw[0] + 40, sw[1])]); touch('touchMove', [at(3, sw[0] + 80, sw[1])]); touch('touchEnd', [at(3, sw[0] + 80, sw[1])]); pg.wait_for_timeout(50)
        ok(E("__sim.G.p.spinTo != null || __sim.G.p.spins > 0"), f'{tag}: a swipe in the air spins')
        ok(not errs, f'{tag}: no JavaScript errors', str(errs[:3])); ctx.close()
    # ---------- the rules ----------
    ctx = b.new_context(viewport={'width': 844, 'height': 390}); pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + os.path.join(here, 'index.html')); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(500); E = pg.evaluate
    RIDE = "__sim.start(5, { seed: 3 }); const G = __sim.G, X = __sim.x(), P = G.p; G.phase = 'ride'; P.x = 30; P.s = 0.5; P.v = 9; P.th = 0; G.xb = 10; const run = (s, f) => { const ev = []; for (let i = 0; i < s * 60; i++) { if (f) f(i); ev.push(...__sim.stepEv(1 / 60)); } return ev; };"
    r = E("(() => { __sim.start(1, { seed: 3 }); const G = __sim.G, X = __sim.x(); G.pt = G.tL - 2; G.paddle = 1; X.swipe(G, 0, -1); const a = G.phase; for (let i = 0; i < 60 * 3.5 && G.phase === 'wait'; i++) __sim.step(1 / 60); return [a, G.phase, G.ride]; })()")
    ok(r[0] == 'wait' and r[1] == 'wait', 'standing up too early does nothing, and without a swipe the wave passes', str(r))
    r = E("(() => { " + RIDE + " P.v = 6; P.s = 0.8; P.th = -1.2; X.setStick(G, 0.3, -1); run(0.3); const v1 = P.v; " + "P.s = 0.2; P.v = 6; P.th = 1.2; X.setStick(G, 0.3, 1); run(0.3); return [v1, P.v]; })()")
    ok(r[0] > 6 and r[1] < 6, 'down the face gains speed, up the face spends it', str(r))
    r = E("(() => { " + RIDE + " P.v = 2; X.setStick(G, 1, 0.6); const ev = run(4); const w = ev.find(e => e.k === 'wipe'); return w ? w.why : null; })()")
    ok(r is not None and ('slow' in r or 'caught' in r), 'the curl catches a rider who is too slow', str(r))
    r = E("(() => { " + RIDE + " P.s = 0.97; P.th = 0.8; P.v = 9; G.t = 5; P.lipT = 5; X.setStick(G, 0.25, -1); const ev = run(0.8); return ev.filter(e => e.k === 'move').map(e => e.id); })()")
    ok('snap' in r, 'a hard turn down at the lip is a snap', str(r))
    r = E("(() => { " + RIDE + " G.xb = 0; P.x = 30; P.th = -0.2; P.s = 0.15; P.v = 7.5; X.setStick(G, -1, 0.1); run(0.9); X.setStick(G, 1, -0.3); const ev = run(1.2); return ev.filter(e => e.k === 'move').map(e => e.id); })()")
    ok('cutback' in r, 'turning back towards the curl and out again is a cutback', str(r))
    r = E("(() => { " + RIDE + " const pts = []; for (let i = 0; i < 3; i++) { P.s = 0.97; P.th = 0.8; P.v = 9; P.lipT = G.t; X.setStick(G, 1, 0.8); run(0.05); X.setStick(G, 0.25, -1); const ev = run(0.8); const m = ev.find(e => e.k === 'move' && e.id === 'snap'); pts.push(m ? m.pts / (1 + 0.2 * m.combo) : null); G.comboT = 0; G.combo = 0; } return pts; })()")
    ok(r[0] and r[1] and r[2] and r[0] > r[1] > r[2], 'the same move again scores less', str(r))
    AIR = RIDE + " G.xb = -30; P.s = 1; P.th = 1.1; P.v = 11; run(0.05);"
    r = E("(() => { " + AIR + " const up = P.air; X.swipe(G, 1, 0); run(0.45); X.swipe(G, 1, 0); const ev = run(1.6, () => X.setStick(G, 0.6, P.vy < 1.5 ? -1 : 0.2)); return [up, ev.filter(e => e.k === 'move').map(e => e.label).join(), ev.some(e => e.k === 'wipe')]; })()")
    ok(r[0] is True and 'AIR 360' in r[1] and not r[2], 'flying off the lip, a full spin and the nose down: a clean AIR 360', str(r))
    r = E("(() => { " + AIR + " X.swipe(G, 1, 0); const ev = run(1.6, () => X.setStick(G, 0.6, -1)); const w = ev.find(e => e.k === 'wipe'); return w ? w.why : null; })()")
    ok(r is not None and 'sideways' in r, 'half a spin lands sideways: a wipeout', str(r))
    r = E("(() => { __sim.start(5, { seed: 3 }); const G = __sim.G, X = __sim.x(), P = G.p; G.phase = 'ride'; const sec = G.w.secs.find(s => s.type === 'barrel') || { x0: 60, x1: 90 }; G.w.secs = [{ x0: -1e9, x1: sec.x0, type: 'normal', k: 1 }, { x0: sec.x0, x1: 1e9, type: 'barrel', k: 1.08 }]; G.xb = sec.x0 + 10; P.x = G.xb + 4; P.s = 0.4; P.v = 9; P.th = 0; X.crouchOn(G, true); const s0 = G.score; let wipe = null; for (let i = 0; i < 60 * 1.5; i++) { X.setStick(G, 1, (0.4 - P.s) * 3); const ev = __sim.stepEv(1 / 60); if (ev.some(e => e.k === 'wipe')) wipe = ev.find(e => e.k === 'wipe').why; } const s1 = G.score; X.crouchOn(G, false); for (let i = 0; i < 30 && !wipe; i++) { const ev = __sim.stepEv(1 / 60); if (ev.some(e => e.k === 'wipe')) wipe = ev.find(e => e.k === 'wipe').why; } return [s1 - s0, wipe]; })()")
    ok(r[0] > 30 and r[1] and 'crouch' in r[1], 'crouched in a barrel scores; standing up in it wipes you out', str(r))
    r = E("(() => { " + RIDE + " G.xb = G.w.L - 30; P.x = G.w.L - 3; const ev = run(1); const d = ev.find(e => e.k === 'done'); return d ? d.bonus : null; })()")
    ok(r is not None and r >= 100, 'riding to the end of the wave adds a bonus', str(r))
    r = E("(() => { __sim.start(1, { seed: 3 }); const G = __sim.G; G.score = G.cfg.target + 5; G.phase = 'out'; G.outT = 0.01; for (let i = 0; i < 5; i++) __sim.step(1 / 60); return [G.over, G.res && G.res.why]; })()")
    ok(r == ['won', 'target'], 'reaching the target after a wave wins the session', str(r))
    r = E("(() => { __sim.start(1, { seed: 3 }); const G = __sim.G; G.ride = 3; G.score = 10; G.phase = 'out'; G.outT = 0.01; for (let i = 0; i < 5; i++) __sim.step(1 / 60); return [G.over, G.res && G.res.why]; })()")
    ok(r == ['lost', 'short'], 'three waves without the target loses it', str(r))
    r = E("(() => { __sim.start(1, { seed: 3, free: true }); const G = __sim.G; G.ride = 3; G.score = 10; G.phase = 'out'; G.outT = 0.01; for (let i = 0; i < 5; i++) __sim.step(1 / 60); return [G.over, G.ride]; })()")
    ok(r[0] is None and r[1] == 4, 'free surf goes on to another wave', str(r))
    # ---------- settings ----------
    E("__sim.live(); localStorage.setItem('srf.settings', '{}'); localStorage.removeItem('srf.shake'); localStorage.removeItem('srf.slow'); location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(600)
    sw = "['tMus', 'tSfx', 'tVib', 'tShake', 'tSlow'].map(i => document.getElementById(i).textContent === 'ON')"
    E("document.getElementById('setBtn').click()"); ok(E("!document.getElementById('ovSet').classList.contains('hidden')"), 'the Settings button opens the Settings card')
    ok(E(sw) == [True] * 5, 'everything starts on', str(E(sw)))
    E("document.getElementById('tMus').click()"); ok(E(sw) == [False, True, True, True, True], 'Music switches off on its own', str(E(sw)))
    E("document.getElementById('tVib').click()"); ok(E(sw) == [False, True, False, True, True], 'Vibration switches off on its own', str(E(sw)))
    E("document.getElementById('tShake').click()"); ok(E(sw) == [False, True, False, False, True], 'camera shake switches off on its own', str(E(sw)))
    E("document.getElementById('tSlow').click()"); ok(E(sw) == [False, True, False, False, False], 'slow-motion airs switch off on their own', str(E(sw)))
    E("document.getElementById('tSfx').click()"); ok(E(sw) == [False] * 5, 'Sound effects switch off on their own', str(E(sw)))
    E("location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(500)
    ok(E(sw) == [False] * 5, 'the settings are remembered'); E("localStorage.setItem('srf.settings', '{}'); localStorage.removeItem('srf.shake'); localStorage.removeItem('srf.slow')")
    ok(not errs, 'no JavaScript errors', str(errs[:3])); ctx.close(); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
