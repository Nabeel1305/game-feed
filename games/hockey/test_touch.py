#!/usr/bin/env python3
"""Ice Hockey with real touches, held sideways: in an upright window (the phone app, which never turns) the game is drawn a
quarter turn round and touches are turned with it; in a sideways window it is drawn as it is. In both: a thumb on the left
drags the stick (toward the picture's right skates right), PASS passes, a tap of SHOOT shoots, a held SHOOT winds up and fires
harder when let go, BURST bursts; without the puck PASS switches and SHOOT pokes. At a faceoff a tap before the drop loses it,
a tap just after wins it. Then the rules: a shot into an empty net is a goal; a shot straight at the goalie is saved; a slap
shot is harder than a wrist shot; a pass along a blocked lane goes off the boards; a poke from close in front can steal it; a
goal after passes counts the assist and the move. The Settings switch Music, Sound effects and Vibration on their own and
remember them. No errors.
Run: python3 games/hockey/test_touch.py"""
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
        def tapAt(gx, gy, i=4): x, y = toScreen(gx, gy); touch('touchStart', [(i, x, y)]); touch('touchEnd', [(i, x, y)]); pg.wait_for_timeout(50)
        E("localStorage.setItem('hok.taught', '3'); __sim.go(4)"); pg.wait_for_timeout(200); E("__sim.G.face = null; __sim.G.pause = 0; (() => { const G = __sim.G, m = G.P[3]; m.x = -4; m.z = 0; G.puck.own = null; })()")
        E("(() => { const G = __sim.G; G.puck.own = null; const m = G.P[3]; G.puck.x = m.x; G.puck.z = m.z; })()"); E("(() => { const G = __sim.G, m = G.P[3]; G.ctrl = 3; G.puck.own = m; G.puck.last = m; })()")
        Wl, Hl = max(vw, vh), min(vw, vh)
        sx, sy = toScreen(Wl * 0.18, Hl * 0.6); ex, ey = toScreen(Wl * 0.18 + 90, Hl * 0.6)
        touch('touchStart', [(1, sx, sy)]); touch('touchMove', [(1, (sx + ex) / 2, (sy + ey) / 2)]); pg.wait_for_timeout(40); touch('touchMove', [(1, ex, ey)]); pg.wait_for_timeout(40); st = E("[__sim.G.stick.x, __sim.G.stick.z]")
        ok(st[0] > 0.8 and abs(st[1]) < 0.2, f'{tag}: dragging the stick to the right skates right', str(st))
        touch('touchEnd', [(1, ex, ey)]); ok(E("__sim.G.stick.x") == 0, f'{tag}: letting go stops')
        L = E("__sim.layout()")
        tapAt(L['pass']['x'], L['pass']['y']); k3 = E("[__sim.G.puck.kind, !!__sim.G.puck.own]"); ok(k3[0] == 'pass' and not k3[1], f'{tag}: PASS passes', str(k3))
        E("(() => { const G = __sim.G, m = G.P[G.ctrl]; m.cd = 0; G.puck.own = m; G.puck.last = m; G.puck.kind = null; })()"); tapAt(L['shoot']['x'], L['shoot']['y'])
        r = E("[__sim.G.puck.kind, __sim.G.puck.shot && __sim.G.puck.shot.power]"); ok(r[0] == 'shot' and r[1] == 0, f'{tag}: a tap of SHOOT is a quick shot', str(r))
        E("(() => { const G = __sim.G, m = G.P[G.ctrl]; m.cd = 0; G.puck.own = m; G.puck.last = m; G.puck.kind = null; G.puck.shot = null; })()")
        x, y = toScreen(L['shoot']['x'], L['shoot']['y']); touch('touchStart', [(5, x, y)]); pg.wait_for_timeout(120); ok(E("__sim.G.P[__sim.G.ctrl].wind > 0"), f'{tag}: holding SHOOT winds up')
        pg.wait_for_timeout(450); touch('touchEnd', [(5, x, y)]); r = E("__sim.G.puck.shot && __sim.G.puck.shot.power"); ok(r and r > 0.3, f'{tag}: letting go fires a slap shot', str(r))
        s0 = E("__sim.G.P[__sim.G.ctrl].st"); tapAt(L['burst']['x'], L['burst']['y']); ok(E("__sim.G.P[__sim.G.ctrl].burst > 0"), f'{tag}: BURST bursts', str(s0))
        E("(() => { const G = __sim.G, o = G.P[6]; G.puck.shot = null; G.puck.kind = null; o.x = 0; o.z = 0; o.down = 0; G.puck.own = o; G.puck.last = o; const m = G.P[G.ctrl]; m.x = -0.9; m.z = 0; m.down = 0; m.pk = 0; })()")
        c0 = E("__sim.G.ctrl"); tapAt(L['shoot']['x'], L['shoot']['y']); ok(E("__sim.G.P[__sim.G.ctrl].pk > 0"), f'{tag}: without the puck SHOOT pokes')
        tapAt(L['pass']['x'], L['pass']['y']); ok(E("__sim.G.ctrl") != c0, f'{tag}: without the puck PASS switches')
        # the faceoff, by touch
        E("__sim.faceoff(); __sim.G.face.drop = 0.6"); tapAt(L['pass']['x'], L['pass']['y']); pg.wait_for_function("__sim.G.face == null", timeout=3000); r = E("[__sim.G.puck.last && __sim.G.puck.last.t, __sim.G.puck.to && __sim.G.puck.to.t]"); ok(r == [1, 1], f'{tag}: a tap before the drop loses the faceoff', str(r))
        E("__sim.faceoff(); __sim.G.face.drop = 0.3"); pg.wait_for_function("__sim.G.face && __sim.G.face.t >= __sim.G.face.drop", timeout=3000); tapAt(L['shoot']['x'], L['shoot']['y']); pg.wait_for_timeout(100)
        ok(E("__sim.G.face == null && __sim.G.puck.last && __sim.G.puck.last.t === 0"), f'{tag}: a tap just after the drop wins it')
        ok(not errs, f'{tag}: no JavaScript errors', str(errs[:3])); ctx.close()
    # ---------- the rules (fast, headless) ----------
    ctx = b.new_context(viewport={'width': 844, 'height': 390}); pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + os.path.join(here, 'index.html')); pg.wait_for_function('typeof window.gameFeedStart === "function"'); E = pg.evaluate
    setup = """(o) => { const S = __sim; S.start(6, { seed: o.seed || 5 }); const G = S.G; G.face = null; G.pause = 0; for (const q of G.P) { q.x = q.t ? -6 : -15; q.z = q.t ? (q.i % 2 ? 9 : -9) : q.i * 2 - 3; q.vx = q.vz = 0; } const m = G.P[3]; m.x = o.x || 10; m.z = o.z || 0; m.face = 0; G.ctrl = 3; G.puck.own = m; G.puck.last = m; m.gotAt = -5;
      const gk = G.P[4]; gk.x = o.empty ? 30 : 16; gk.z = o.gz || 0; return G; }"""
    def run(o, js):
        return E(f"(opt => {{ const G = ({setup})(opt); {js} }})({o})")
    r = run('{ empty: true }', "__sim.stick(1, 0.1); __sim.shootDown(); __sim.shootUp(); for (let i = 0; i < 120 && G.score[0] === 0; i++) __sim.step(1 / 60); return G.score;")
    ok(r[0] == 1, 'a shot into an empty net is a goal', str(r))
    saved = 0
    for s in range(20):
        saved += run(f'{{ seed: {s + 1}, x: 4 }}', "__sim.stick(0, 0); __sim.shootDown(); __sim.shootUp(); for (let i = 0; i < 120 && G.score[0] === 0; i++) __sim.step(1 / 60); return G.score[0] === 0 ? 1 : 0;")
    ok(saved >= 18, 'a shot from far, straight at the goalie, is almost always saved', str(saved))
    r = run('{}', "__sim.shootDown(); __sim.shootUp(); const a = Math.hypot(G.puck.vx, G.puck.vz); const m = G.P[3]; m.cd = 0; G.puck.own = m; G.puck.last = m; G.puck.shot = null; m.wind = 0.001; for (let i = 0; i < 40; i++) __sim.step(1 / 60); __sim.shootUp(); return [a, Math.hypot(G.puck.vx, G.puck.vz)];")
    ok(r[1] > r[0] * 1.25, 'a slap shot is harder than a wrist shot', str(r))
    r = run('{ x: -5, z: 6 }', "const q = G.P[2]; q.x = 5; q.z = 6; const f = G.P[5]; f.x = 0; f.z = 6; f.down = 0; G.P[6].x = 0; G.P[6].z = 4.5; __sim.pass(); return [G.puck.kind, G.puck.boards];")
    ok(r == ['pass', True], 'a pass along a blocked lane goes off the boards', str(r))
    st = 0
    for s in range(20):
        st += run(f'{{ seed: {s + 1} }}', "const o = G.P[5]; o.x = 0; o.z = 0; o.down = 0; G.puck.own = o; G.puck.last = o; const m = G.P[3]; m.x = -0.8; m.z = 0; m.pk = 0; m.down = 0; G.ctrl = 3; __sim.shootDown(); return G.puck.own === o ? 0 : 1;")
    ok(st >= 6, 'a poke from close in front can steal it', str(st))
    r = run('{ empty: true }', "const a = G.P[2], m = G.P[3]; a.x = 6; a.z = 2; G.puck.own = a; G.puck.last = a; G.ctrl = 2; __sim.stick(1, -0.4); __sim.pass(); for (let i = 0; i < 120 && G.puck.own !== m; i++) __sim.step(1 / 60); m.gotAt = -5; m.face = Math.atan2(-m.z, 16.5 - m.x); __sim.stick(16.5 - m.x, 0.5 - m.z); __sim.shootDown(); __sim.shootUp(); for (let i = 0; i < 120 && G.score[0] === 0; i++) __sim.step(1 / 60); return [G.score[0], G.stats.assists];")
    ok(r == [1, 1], 'a goal after a pass counts the assist', str(r))
    ok(not errs, 'rules: no JavaScript errors', str(errs[:3])); ctx.close()
    # ---------- Settings ----------
    ctx = b.new_context(viewport={'width': 844, 'height': 390}); pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); E = pg.evaluate
    pg.goto('file://' + os.path.join(here, 'index.html')); pg.wait_for_function('typeof window.gameFeedStart === "function"'); E("localStorage.setItem('hok.settings', '{}'); location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(600)
    sw = "['tMus', 'tSfx', 'tVib'].map(i => document.getElementById(i).textContent === 'ON')"
    ok(E("!!document.getElementById('setBtn').offsetParent"), 'the Settings button is on the home screen')
    E("document.getElementById('setBtn').click()"); ok(E("!document.getElementById('ovSet').classList.contains('hidden')"), 'it opens the Settings card')
    E("document.getElementById('tMus').click()"); ok(E(sw) == [False, True, True], 'Music switches off on its own', str(E(sw)))
    E("document.getElementById('tVib').click()"); ok(E(sw) == [False, True, False], 'Vibration switches off on its own', str(E(sw)))
    E("document.getElementById('tSfx').click()"); ok(E(sw) == [False, False, False], 'Sound effects switch off on their own', str(E(sw)))
    E("location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(500)
    ok(E(sw) == [False, False, False], 'the settings are remembered'); E("localStorage.setItem('hok.settings', '{}')")
    ok(not errs, 'settings: no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
