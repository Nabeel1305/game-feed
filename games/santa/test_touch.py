#!/usr/bin/env python3
"""Santa's Round with real touches, held upright and sideways: the left thumb's stick (in its own fixed place) steers the sleigh (right turns
right, up climbs, down dives; the right thumb holds FORWARD) and walks inside (a gentle push tiptoes, a full push runs and makes noise); holding LAND slows the sleigh
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
        L = E("__sim.layout()"); B = L['btn']; ST = L['stick']; sx, sy = ST['x'], ST['y']      # the stick has its own fixed place now
        def hold(dx, dy, ms):
            touch('touchStart', [at(1, sx, sy)]); touch('touchMove', [at(1, sx + dx * 0.5, sy + dy * 0.5)]); touch('touchMove', [at(1, sx + dx, sy + dy)]); pg.wait_for_timeout(ms); r = E("[__sim.G.stick.x, __sim.G.stick.y]"); touch('touchEnd', [at(1, sx + dx, sy + dy)]); pg.wait_for_timeout(40); return r
        # 25 Nov 2026 ("Inverted joystick ... also create up and down and forward"). Every direction is MEASURED WITH THE CAMERA: where the sleigh's nose
        # swings on the screen, and whether the sleigh goes up or down it; inside, where Santa goes on the screen. (The old test asked the rules' own
        # numbers, and the walking inside was mirrored all along.)
        NOSE = "(() => { const s = __sim.G.s, c = __sim.W3.cam; c.updateMatrixWorld(); const a = new THREE.Vector3(-s.x, s.y, s.z).project(c), n = new THREE.Vector3(-(s.x + Math.sin(s.yaw) * 6), s.y, s.z + Math.cos(s.yaw) * 6).project(c); return [n.x - a.x, s.y, s.v, s.yaw]; })()"
        RESET = "(() => { const s = __sim.G.s; s.x = 0; s.z = -30; s.yaw = 0; s.y = 14; s.v = 0; s.vy = 0; __sim.ui.cam = null; })()"
        E(RESET); pg.wait_for_timeout(300); a0 = E(NOSE); hold(50, 0, 450); a1 = E(NOSE); ok(a1[0] - a0[0] > 0.05, f'{tag}: the stick pushed right: the sleigh\'s nose swings to the RIGHT of the screen (camera)', str([a0, a1]))
        E(RESET); pg.wait_for_timeout(300); a0 = E(NOSE); hold(-50, 0, 450); a1 = E(NOSE); ok(a1[0] - a0[0] < -0.05, f'{tag}: pushed left: the nose swings LEFT', str([a0, a1]))
        E(RESET); pg.wait_for_timeout(300); hold(0, -50, 600); a1 = E(NOSE); ok(a1[1] > 14 + 1.5 and abs(a1[3]) < 0.05, f'{tag}: pushed UP: the sleigh CLIMBS (up is up), and does not turn', str(a1))
        E(RESET); pg.wait_for_timeout(300); hold(0, 50, 600); a1 = E(NOSE); ok(a1[1] < 14 - 1.5 and abs(a1[3]) < 0.05, f'{tag}: pushed DOWN: the sleigh DIVES', str(a1))
        E(RESET); pg.wait_for_timeout(200); touch('touchStart', [at(2, B['x'], B['y'])]); pg.wait_for_timeout(700); r = E("[__sim.G.go, __sim.G.s.v, __sim.G.s.z, __sim.G.s.y]"); touch('touchEnd', [at(2, B['x'], B['y'])]); pg.wait_for_timeout(60)
        ok(r[0] is True and r[1] > 4 and r[2] > -30 + 1 and abs(r[3] - 14) < 0.5, f'{tag}: holding FORWARD flies the sleigh ahead, level', str(r))
        pg.wait_for_timeout(1500); r2 = E("[__sim.G.go, __sim.G.s.v]"); ok(r2[0] is False and r2[1] < 1.2, f'{tag}: letting go of FORWARD slows it to a hover', str(r2))
        touch('touchStart', [at(3, Wd * 0.5, Ht * 0.45)]); pg.wait_for_timeout(120); r3 = E("[__sim.G.stick.x, __sim.G.stick.y, __sim.G.go]"); touch('touchEnd', [at(3, Wd * 0.5, Ht * 0.45)]); ok(r3 == [0, 0, False], f'{tag}: a touch away from the stick and the button does nothing', str(r3))
        KN = "(([x, y]) => { __sim.frame(); const c = document.getElementById('cv'), q = c.width / (innerWidth > innerHeight ? innerWidth : innerHeight), d = c.getContext('2d').getImageData(Math.round(x * q), Math.round(y * q), 1, 1).data; return d[3] > 150 && d[0] > 200 && d[1] > 200 ? 1 : 0; })"
        touch('touchStart', [at(1, sx, sy)]); touch('touchMove', [at(1, sx + 40, sy)]); pg.wait_for_timeout(120); kn = [E(KN, [sx + 40, sy]), E(KN, [sx - 40, sy])]; touch('touchEnd', [at(1, sx + 40, sy)]); pg.wait_for_timeout(40)
        ok(kn == [1, 0], f'{tag}: the knob is drawn under the thumb, not across from it', str(kn))
        # inside: tiptoe and run, hold a present, ACT at the tree
        E("(() => { const G = __sim.G; G.done = []; G.phase = 'roof'; G.roof = { H: G.V[0], t: 1, narrow: false, slip: null, squeeze: 0 }; __sim.step(1 / 60); })()"); pg.wait_for_timeout(200)
        ok(E("__sim.G.phase") == 'in', f'{tag}: down the chimney into the house')
        OPEN = "(() => { const I = __sim.G.in, R = I.H.room, bad = new Set((R.creak || []).map(c => c.x + ',' + c.z)), free = (x, z) => z >= 0 && x >= 0 && z < R.D && x < R.W && R.g[z][x] === 0 && !bad.has(x + ',' + z); let best = null; for (let z = 1; z < R.D - 1; z++) for (let x = 1; x < R.W - 1; x++) { let n = 0; for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [0, 0], [1, 1], [-1, -1], [1, -1], [-1, 1]]) if (free(x + dx, z + dz)) n++; if (!best || n > best[2]) best = [x, z, n]; } I.x = best[0]; I.z = best[1]; I.noise = 0; return best; })()"
        INS = "(() => { const V = __sim.V3, m = V.room.me, c = __sim.W3.cam; c.updateMatrixWorld(); const a = m.position.clone(); m.parent.localToWorld(a); a.project(c); return [a.x, a.y]; })()"
        for nm, ddx, ddy in (('right', 55, 0), ('left', -55, 0), ('up', 0, -55), ('down', 0, 55)):
            E(OPEN); pg.wait_for_timeout(500); p0 = E(INS); hold(ddx * 0.5, ddy * 0.5, 450); p1 = E(INS); mx, my = p1[0] - p0[0], p1[1] - p0[1]      # (from the most open spot in the room, at a tiptoe: nothing to bump)
            ok((mx * ddx - my * ddy) > 0 and abs(mx * ddx - my * ddy) / 55 > 0.02, f'{tag}: inside, the stick pushed {nm}: Santa goes {nm} ON THE SCREEN (camera)', str([round(mx, 3), round(my, 3)]))
        E(OPEN); s = hold(0, 20, 300); n1 = E("__sim.G.in.noise"); ok(abs(s[1]) < 0.7 and n1 < 0.05, f'{tag}: a gentle push tiptoes quietly', str([s, n1]))
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
    r = E("(() => { __sim.start(5, { seed: 3 }); " + S + " const H = G.V[0], s = G.s; s.x = H.mx; s.z = H.mz - 0.5; s.yaw = 0; s.y = H.top + 1; const ev = run(1.5, () => X.setStick(G, 0, -1)); return [ev.some(e => e.k === 'land'), G.phase]; })()")
    ok(r[0] and r[1] in ('roof', 'in'), 'flying down onto the marker is a landing, and down the chimney', str(r))
    r = E("(() => { __sim.start(5, { seed: 3 }); " + S + " const H = G.V[0], s = G.s; s.x = H.x + 3.5; s.z = H.z + 3; s.yaw = Math.PI; s.y = H.top + 0.5; s.v = 0; const ev = run(0.5, () => X.setStick(G, 0, -1)); return [ev.some(e => e.k === 'bounce'), G.phase]; })()")
    ok(r[0] and r[1] == 'fly', 'coming down on a roof off its marker bounces you back up', str(r))
    r = E("(() => { __sim.start(5, { seed: 3 }); " + S + " const H = G.V[0], s = G.s; s.x = H.x; s.z = H.z - H.d / 2 - 6; s.yaw = 0; s.y = Math.max(2.6, H.top - 2); X.goOn(G, true); const ev = run(1.7); const h2 = X.houseUnder(G, s.x, s.z); return [ev.some(e => e.k === 'bonk'), !!h2 && s.y < h2.top - 0.3, G.phase, +s.v.toFixed(1)]; })()")
    ok(r[0] and not r[1] and r[2] == 'fly', 'flying into the side of a house below its roof: a bump, never through its walls (it is slowed and lifted over the roof)', str(r))
    r = E("(() => { __sim.start(5, { seed: 3 }); " + S + " const st = G.stars[0], s = G.s; s.x = st.x; s.z = st.z - 4; s.y = st.y; s.yaw = 0; X.goOn(G, true); const ev = run(1.2); return [ev.some(e => e.k === 'star'), G.starN, s.boost > 0]; })()")
    ok(r[0] and r[1] == 1 and r[2], 'flying through a star: a burst of speed', str(r))
    IN = "__sim.start(5, { seed: 3 }); " + S + " G.phase = 'roof'; G.roof = { H: G.V[0], t: 1, narrow: false, slip: null, squeeze: 0 }; __sim.step(1 / 60); const I = G.in, R = I.H.room; const toTree = () => { const ok = [[1, 0], [-1, 0], [0, -1], [0, 1]].find(([dx, dz]) => R.g[R.tree.z + dz][R.tree.x + dx] === 0); I.x = R.tree.x + ok[0]; I.z = R.tree.z + ok[1]; };"
    r = E("(() => { " + IN + " toTree(); const bad = I.sack.find(q => !I.H.mem.some(m => m.wish === q)); X.holdGift(G, bad); X.act(G); const placedBad = I.placed.slice(); X.act(G); return [placedBad, I.placed.length, I.hold === bad]; })()")
    ok(len(r[0]) == 1 and r[1] == 0 and r[2], 'a wrong present can be picked back up', str(r))
    r = E("(() => { " + IN + " I.x = R.fire.x; I.z = R.fire.z + 1; const ev = __sim.stepEv(1 / 60); X.act(G); const e1 = __sim.stepEv(1 / 60).concat(G.ev); return [G.phase, G.done.length]; })()")
    ok(r == ['in', 0], 'the house is not done until the presents and stockings are right', str(r))
    r = E("(() => { " + IN + " toTree(); for (const m of I.H.mem) { X.holdGift(G, m.wish); X.act(G); } for (const st of R.stock) { I.x = st.x; I.z = st.z + 1; X.act(G); } I.x = R.fire.x; I.z = R.fire.z + 1; X.act(G); return [G.done.length, G.phase]; })()")
    ok(r[0] == 1 and r[1] == 'up', 'right presents and full stockings: back up the chimney, delivered', str(r))
    r = E("(() => { " + IN + " I.noise = 0; const cr = R.creak[0] || { x: 3, z: 3 }; if (!R.creak.length) R.creak.push(cr); I.x = cr.x - 1; I.z = cr.z; I.onCreak = null; X.setStick(G, -0.5, 0);      /* (the stick's right is the screen's right: inside, the rules' x runs the other way) */ const ev = run(0.8); return [ev.some(e => e.k === 'creak'), I.noise > 0.3]; })()")
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
