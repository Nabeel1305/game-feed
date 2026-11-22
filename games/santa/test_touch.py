#!/usr/bin/env python3
"""Santa's Round with real touches, held upright and sideways: the left thumb's floating stick steers the sleigh (right turns
right, up flies on) and walks inside (a gentle push tiptoes, a full push runs and makes noise); holding LAND slows the sleigh
down onto a roof; inside, a tap on a present in the sack holds it and ACT puts it under the tree. Then the rules: landing on
the marker goes down the chimney, landing off it bounces you back up; the wrong present can be picked back up; the house is
not done until the presents and stockings are right; running, bumping furniture and creaky boards make noise, and enough
noise wakes someone (that house starts again, earlier houses stay delivered); a toy calms the cat; a narrow chimney needs
wriggling; delivering every house wins, dawn loses, the relaxed round has no dawn. The Settings switch Music, Sound effects,
Vibration, camera shake and the northern lights on their own and remember them. No errors.
Run: python3 games/santa/test_touch.py"""
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
        E("localStorage.setItem('snt.taught', '3'); __sim.go(5)"); pg.wait_for_timeout(300); E("__sim.G.dawn = 1e9")
        Wd, Ht = E("[innerWidth > innerHeight ? innerWidth : innerHeight, innerWidth > innerHeight ? innerHeight : innerWidth]")
        L = E("__sim.layout()"); B = L['btn']; sx, sy = Wd * 0.2, Ht * 0.6
        def hold(dx, dy, ms):
            touch('touchStart', [at(1, sx, sy)]); touch('touchMove', [at(1, sx + dx * 0.5, sy + dy * 0.5)]); touch('touchMove', [at(1, sx + dx, sy + dy)]); pg.wait_for_timeout(ms); r = E("[__sim.G.stick.x, __sim.G.stick.y]"); touch('touchEnd', [at(1, sx + dx, sy + dy)]); pg.wait_for_timeout(40); return r
        E("(() => { const s = __sim.G.s; s.x = 0; s.z = -30; s.yaw = 0; s.y = 14; })()"); y0 = E("__sim.G.s.yaw")
        hold(60, 0, 500); y1 = E("__sim.G.s.yaw"); ok(y1 > y0 + 0.4, f'{tag}: pushing the stick right turns the sleigh right', str([y0, y1]))
        E("(() => { const s = __sim.G.s; s.x = 0; s.z = -30; s.yaw = 0; })()"); hold(0, -60, 400); z1 = E("__sim.G.s.z"); ok(z1 > -30 + 2, f'{tag}: pushing up flies on', str(z1))
        touch('touchStart', [at(2, B['x'], B['y'])]); pg.wait_for_timeout(500); r = E("[__sim.G.landHeld, __sim.G.s.v, __sim.G.s.y]"); touch('touchEnd', [at(2, B['x'], B['y'])]); pg.wait_for_timeout(60)
        ok(r[0] is True and r[1] < 7 and r[2] < 14, f'{tag}: holding LAND slows the sleigh and brings it down', str(r))
        ok(E("__sim.G.landHeld") is False, f'{tag}: letting go of LAND climbs again')
        # inside: tiptoe and run, hold a present, ACT at the tree
        E("(() => { const G = __sim.G; G.done = []; G.phase = 'roof'; G.roof = { H: G.V[0], t: 1, narrow: false, slip: null, squeeze: 0 }; __sim.step(1 / 60); })()"); pg.wait_for_timeout(200)
        ok(E("__sim.G.phase") == 'in', f'{tag}: down the chimney into the house')
        E("(() => { const I = __sim.G.in; I.noise = 0; })()"); s = hold(0, 20, 300); n1 = E("__sim.G.in.noise"); ok(abs(s[1]) < 0.7 and n1 < 0.05, f'{tag}: a gentle push tiptoes quietly', str([s, n1]))
        E("(() => { const G = __sim.G, I = G.in; I.noise = 0; I.x = 5; I.z = 2; })()"); s = hold(0, 60, 500); n2 = E("__sim.G.in.noise"); ok(n2 > 0.1, f'{tag}: a full push runs, and running is noisy', str([s, n2]))
        E("(() => { const I = __sim.G.in; I.noise = 0; })()"); pg.wait_for_timeout(50)
        sk = E("__sim.ui.sackR.map(q => [q.id, q.x, q.y])"); want = E("__sim.G.in.H.mem[0].wish"); tgt = [q for q in sk if q[0] == want][0]
        touch('touchStart', [at(3, tgt[1], tgt[2])]); touch('touchEnd', [at(3, tgt[1], tgt[2])]); pg.wait_for_timeout(60)
        ok(E("__sim.G.in.hold") == want, f'{tag}: a tap on a present in the sack holds it', E("__sim.G.in.hold"))
        E("(() => { const I = __sim.G.in, R = I.H.room; I.x = R.tree.x + (R.g[R.tree.z][R.tree.x + 1] === 0 ? 1 : -1); I.z = R.tree.z; I.noise = 0; })()")
        touch('touchStart', [at(2, B['x'], B['y'])]); touch('touchEnd', [at(2, B['x'], B['y'])]); pg.wait_for_timeout(60)
        ok(E("__sim.G.in.placed.length") == 1 and E("__sim.G.in.hold") is None, f'{tag}: ACT by the tree puts it down', str(E("__sim.G.in.placed")))
        ok(not errs, f'{tag}: no JavaScript errors', str(errs[:3])); ctx.close()
    # ---------- the rules ----------
    ctx = b.new_context(viewport={'width': 844, 'height': 390}); pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + os.path.join(here, 'index.html')); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(500); E = pg.evaluate
    S = "const G = __sim.G, X = __sim.x(); G.dawn = 1e9; const run = (s, f) => { const ev = []; for (let i = 0; i < s * 60; i++) { if (f) f(i); ev.push(...__sim.stepEv(1 / 60)); } return ev; };"
    r = E("(() => { __sim.start(5, { seed: 3 }); " + S + " const H = G.V[0], s = G.s; s.x = H.mx; s.z = H.mz - 0.5; s.yaw = 0; s.y = H.top + 1; X.landOn(G, true); const ev = run(1.5, () => X.setStick(G, 0, 0.0)); return [ev.some(e => e.k === 'land'), G.phase]; })()")
    ok(r[0] and r[1] in ('roof', 'in'), 'landing on the marker goes down the chimney', str(r))
    r = E("(() => { __sim.start(5, { seed: 3 }); " + S + " const H = G.V[0], s = G.s; s.x = H.x + 3.5; s.z = H.z + 3; s.yaw = Math.PI; s.y = H.top + 0.5; s.v = 3; X.landOn(G, true); const ev = run(0.3); return [ev.some(e => e.k === 'bounce'), G.phase]; })()")
    ok(r[0] and r[1] == 'fly', 'landing off the marker bounces you back up', str(r))
    IN = "__sim.start(5, { seed: 3 }); " + S + " G.phase = 'roof'; G.roof = { H: G.V[0], t: 1, narrow: false, slip: null, squeeze: 0 }; __sim.step(1 / 60); const I = G.in, R = I.H.room; const toTree = () => { const ok = [[1, 0], [-1, 0], [0, -1], [0, 1]].find(([dx, dz]) => R.g[R.tree.z + dz][R.tree.x + dx] === 0); I.x = R.tree.x + ok[0]; I.z = R.tree.z + ok[1]; };"
    r = E("(() => { " + IN + " toTree(); const bad = I.sack.find(q => !I.H.mem.some(m => m.wish === q)); X.holdGift(G, bad); X.act(G); const placedBad = I.placed.slice(); X.act(G); return [placedBad, I.placed.length, I.hold === bad]; })()")
    ok(len(r[0]) == 1 and r[1] == 0 and r[2], 'a wrong present can be picked back up', str(r))
    r = E("(() => { " + IN + " I.x = R.fire.x; I.z = R.fire.z + 1; const ev = __sim.stepEv(1 / 60); X.act(G); const e1 = __sim.stepEv(1 / 60).concat(G.ev); return [G.phase, G.done.length]; })()")
    ok(r == ['in', 0], 'the house is not done until the presents and stockings are right', str(r))
    r = E("(() => { " + IN + " toTree(); for (const m of I.H.mem) { X.holdGift(G, m.wish); X.act(G); } for (const st of R.stock) { I.x = st.x; I.z = st.z + 1; X.act(G); } I.x = R.fire.x; I.z = R.fire.z + 1; X.act(G); return [G.done.length, G.phase]; })()")
    ok(r[0] == 1 and r[1] == 'up', 'right presents and full stockings: back up the chimney, delivered', str(r))
    r = E("(() => { " + IN + " I.noise = 0; const cr = R.creak[0] || { x: 3, z: 3 }; if (!R.creak.length) R.creak.push(cr); I.x = cr.x - 1; I.z = cr.z; I.onCreak = null; X.setStick(G, 0.5, 0); const ev = run(0.8); return [ev.some(e => e.k === 'creak'), I.noise > 0.3]; })()")
    ok(r == [True, True], 'a creaky board makes noise', str(r))
    r = E("(() => { " + IN + " G.done = [99]; I.noise = 0.95; X.setStick(G, 0, 1); const ev = run(1); return [ev.some(e => e.k === 'wake'), G.phase === 'up' || G.phase === 'fly', G.done.includes(99)]; })()")
    ok(r == [True, True, True], 'enough noise wakes someone: that house starts again, earlier houses stay delivered', str(r))
    r = E("(() => { " + IN + " if (!R.cat) R.cat = { x: 5, z: 4, tx: 5, tz: 4, calm: 0, meow: 0, t: 5 }; R.cat.x = I.x + 0.8; R.cat.z = I.z; R.cat.calm = 0; X.act(G); return R.cat.calm > 5; })()")
    ok(r is True, 'ACT near the cat tosses it a toy (it calms down)', str(r))
    r = E("(() => { __sim.start(5, { seed: 3 }); " + S + " G.phase = 'roof'; G.roof = { H: G.V[0], t: 1, narrow: true, slip: null, squeeze: 0 }; run(1); const a = G.phase; X.act(G); X.act(G); X.act(G); run(0.2); return [a, G.phase]; })()")
    ok(r == ['roof', 'in'], 'a narrow chimney needs wriggling (three ACTs)', str(r))
    r = E("(() => { __sim.start(5, { seed: 3 }); const G = __sim.G; G.dawn = 2; for (let i = 0; i < 60 * 3 && !G.over; i++) __sim.step(1 / 60); return [G.over, G.res && G.res.why]; })()")
    ok(r == ['lost', 'dawn'], 'dawn breaking loses the round', str(r))
    r = E("(() => { __sim.start(5, { seed: 3, free: true }); const G = __sim.G; G.dawn = 2; for (let i = 0; i < 60 * 4 && !G.over; i++) __sim.step(1 / 60); return G.over; })()")
    ok(r is None, 'the relaxed round has no dawn', str(r))
    r = E("(() => { __sim.start(1, { seed: 3 }); const G = __sim.G; __sim.winNow(); return [G.over, G.res.why]; })()")
    ok(r == ['won', 'all'], 'delivering every house wins', str(r))
    # ---------- settings ----------
    E("__sim.live(); localStorage.setItem('snt.settings', '{}'); localStorage.removeItem('snt.shake'); localStorage.removeItem('snt.slow'); location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(600)
    sw = "['tMus', 'tSfx', 'tVib', 'tShake', 'tSlow'].map(i => document.getElementById(i).textContent === 'ON')"
    E("document.getElementById('setBtn').click()"); ok(E("!document.getElementById('ovSet').classList.contains('hidden')"), 'the Settings button opens the Settings card')
    ok(E(sw) == [True] * 5, 'everything starts on', str(E(sw)))
    E("document.getElementById('tMus').click()"); ok(E(sw) == [False, True, True, True, True], 'Music switches off on its own', str(E(sw)))
    E("document.getElementById('tVib').click()"); ok(E(sw) == [False, True, False, True, True], 'Vibration switches off on its own', str(E(sw)))
    E("document.getElementById('tShake').click()"); ok(E(sw) == [False, True, False, False, True], 'camera shake switches off on its own', str(E(sw)))
    E("document.getElementById('tSlow').click()"); ok(E(sw) == [False, True, False, False, False], 'the northern lights switch off on their own', str(E(sw)))
    E("document.getElementById('tSfx').click()"); ok(E(sw) == [False] * 5, 'Sound effects switch off on their own', str(E(sw)))
    E("location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(500)
    ok(E(sw) == [False] * 5, 'the settings are remembered'); E("localStorage.setItem('snt.settings', '{}'); localStorage.removeItem('snt.shake'); localStorage.removeItem('snt.slow')")
    ok(not errs, 'no JavaScript errors', str(errs[:3])); ctx.close(); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
