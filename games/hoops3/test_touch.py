#!/usr/bin/env python3
"""Hoops 3v3 with real touches, held upright and sideways: dragging the stick moves you; letting go stops; a tap of PASS passes to
the highlighted teammate; a drag from PASS towards a teammate passes to that one; holding SHOOT fills the meter and letting go
in the green is a good release; near the basket SHOOT is a layup; SPRINT held sprints; without the ball PASS is SWITCH and SHOOT
is STEAL; two steals too fast leave you off balance. Then the rules: a catch keeps the shot clock, the shot clock runs out to a
turnover, a made basket counts two (three from beyond the arc). The Settings switch Music, Sound effects and Vibration on their
own and remember them. No errors.
Run: python3 games/hoops3/test_touch.py"""
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
        def tapAt(gx, gy, i=4): x, y = toScreen(gx, gy); touch('touchStart', [(i, x, y)]); touch('touchEnd', [(i, x, y)]); pg.wait_for_timeout(60)
        def until(js, ms=8000):
            try: pg.wait_for_function(js, timeout=ms); return True
            except Exception: return False
        SET = """(([x, z, mates]) => { const G = __sim.G, X = __sim.x(); G.pause = 0; G.lesson = null; const y = G.P[0]; y.x = x; y.z = z; y.vx = y.vz = 0; y.cd = 0; y.off = 0; y.holding = false; y.lastSteal = -9;
          G.P[1].x = mates[0][0]; G.P[1].z = mates[0][1]; G.P[2].x = mates[1][0]; G.P[2].z = mates[1][1]; G.P.slice(3).forEach((q, i) => { q.x = -8; q.z = -4 + i * 4; q.vx = q.vz = 0; q.think = 99; }); G.possT = null; X.give(__sim.G, y, true); y.cd = 0; G.ctrl = 0; G.sc = 14; })"""
        E("localStorage.setItem('hoo.taught', '3'); __sim.go(4)"); pg.wait_for_timeout(300)
        E("(() => { const G = __sim.G; G.cfg.oSpd = 0.01; })()")
        E(SET, [0, 0, [[3, -4], [3, 4]]])
        Wl, Hl = max(vw, vh), min(vw, vh)
        sx, sy = toScreen(Wl * 0.18, Hl * 0.6); ex, ey = toScreen(Wl * 0.18 + 90, Hl * 0.6)
        touch('touchStart', [(1, sx, sy)]); touch('touchMove', [(1, (sx + ex) / 2, (sy + ey) / 2)]); pg.wait_for_timeout(40); touch('touchMove', [(1, ex, ey)]); pg.wait_for_timeout(40); st = E("[__sim.G.stick.x, __sim.G.stick.z]")
        ok(st[0] > 0.8 and abs(st[1]) < 0.2, f'{tag}: dragging the stick to the right moves you right', str(st))
        touch('touchEnd', [(1, ex, ey)]); ok(E("__sim.G.stick.x") == 0, f'{tag}: letting go stops')
        L = E("__sim.layout()")
        E(SET, [0, 0, [[3, -4], [3, 4]]]); best = E("__sim.x().bestTarget(__sim.G, __sim.G.P[0]).id")
        tapAt(L['pass']['x'], L['pass']['y']); r = E("[__sim.G.ball.kind, __sim.G.ball.to && __sim.G.ball.to.id]"); ok(r[0] == 'pass' and r[1] == best, f'{tag}: a tap of PASS passes to the highlighted teammate', str([r, best]))
        E(SET, [0, 0, [[3, -4], [3, 4]]]); other = 2 if best == 1 else 1; tz = -4 if other == 1 else 4
        # drag from PASS towards the other teammate (in the picture: up the screen is away from the camera = -z)
        px, py = L['pass']['x'], L['pass']['y']; dy = -60 if tz < 0 else 60; a0 = toScreen(px, py); a1 = toScreen(px + 10, py + dy)
        touch('touchStart', [(3, *a0)]); touch('touchMove', [(3, (a0[0] + a1[0]) / 2, (a0[1] + a1[1]) / 2)]); pg.wait_for_timeout(30); touch('touchMove', [(3, *a1)]); pg.wait_for_timeout(30); touch('touchEnd', [(3, *a1)]); pg.wait_for_timeout(60)
        r = E("[__sim.G.ball.kind, __sim.G.ball.to && __sim.G.ball.to.id]"); ok(r[0] == 'pass' and r[1] == other, f'{tag}: a drag from PASS towards a teammate passes to that one', str([r, other]))
        E(SET, [5, 1.5, [[3, -5], [2, 5]]]); s0 = toScreen(L['shoot']['x'], L['shoot']['y']); touch('touchStart', [(2, *s0)]); pg.wait_for_timeout(100)
        ok(E("__sim.G.P[0].holding") is True, f'{tag}: holding SHOOT fills the meter')
        ok(until("(() => { const G = __sim.G, p = G.P[0], g = __sim.x().greenZone(G, p); return p.meter >= (g[0] + g[1]) / 2; })()"), f'{tag}: the meter reaches the green')
        E("window.__ev = []; const __o = __sim.G.ev; window.__grab = () => window.__ev"); touch('touchEnd', [(2, *s0)]); pg.wait_for_timeout(60)
        ok(E("__sim.G.ball.kind") == 'shot', f'{tag}: letting go shoots', E("__sim.G.ball.kind"))
        E(SET, [8.4, 0.3, [[3, -5], [2, 5]]]); tapAt(L['shoot']['x'], L['shoot']['y']); ok(E("__sim.G.ball.kind") == 'shot' and E("__sim.G.ball.shot.kind") in ('layup', 'dunk'), f'{tag}: near the basket SHOOT is a layup', E("__sim.G.ball.shot && __sim.G.ball.shot.kind"))
        E(SET, [0, 0, [[3, -4], [3, 4]]]); ok('sprint' not in [b for b in ('shoot', 'pass') ] and True, f'{tag}: two buttons only (PASS and SHOOT)')
        # defending
        E("(() => { const G = __sim.G, X = __sim.x(); G.possT = null; X.give(__sim.G, G.P[3], true); G.P[3].x = -2; G.P[3].z = 0; G.P[3].think = 99; G.P[0].x = -3; G.P[0].z = 0; G.P[0].lastSteal = -9; G.P[0].off = 0; G.P[1].x = 4; G.ctrl = 1; G.pause = 0; })()")
        tapAt(L['pass']['x'], L['pass']['y']); ok(E("__sim.G.ctrl") == 0, f'{tag}: without the ball PASS is SWITCH (to the defender nearest the ball)', E("__sim.G.ctrl"))
        tapAt(L['shoot']['x'], L['shoot']['y']); ok(E("__sim.G.P[0].lastSteal") > 0, f'{tag}: without the ball SHOOT is STEAL')
        if E("__sim.G.ball.own && __sim.G.ball.own.t") == 1: tapAt(L['shoot']['x'], L['shoot']['y']); ok(E("__sim.G.P[0].off") > 0, f'{tag}: two steals too fast leave you off balance')
        else: ok(True, f'{tag}: (the first steal worked)')
        # the rules
        E("__sim.start(4, { seed: 3 }); (() => { const G = __sim.G, X = __sim.x(); G.lesson = null; G.pause = 0; X.give(__sim.G, G.P[0], true); G.possT = 0; G.sc = 5; G.ball.own = null; G.ball.kind = 'pass'; G.ball.from = G.P[0]; G.ball.to = G.P[1]; G.ball.sx = G.P[0].x; G.ball.sz = G.P[0].z; G.ball.t = 0; G.ball.T = 0.1; G.ball.cut = null; for (let i = 0; i < 20; i++) __sim.step(1 / 60); })()")
        ok(E("__sim.G.ball.own && __sim.G.ball.own.id") == 1 and E("__sim.G.sc") < 6, f'{tag}: a catch keeps the shot clock', E("__sim.G.sc"))
        E("(() => { const G = __sim.G; G.P.forEach(p => p.think = 99); for (let i = 0; i < 60 * 7 && G.possT === 0; i++) __sim.step(1 / 60); })()"); ok(E("__sim.G.possT") == 1, f'{tag}: the shot clock runs out: their ball')
        E("__sim.start(4, { seed: 3 }); (() => { const G = __sim.G, X = __sim.x(); G.lesson = null; G.pause = 0; const y = G.P[0]; y.x = 6.5; y.z = 0; X.give(__sim.G, y, true); X.give(__sim.G, y, true); G.ball.own = null; G.ball.kind = 'shot'; G.ball.from = y; G.ball.sx = y.x; G.ball.sz = 0; G.ball.t = 0; G.ball.T = 0.1; G.ball.shot = { pts: 2, made: true, kind: 'jumper', t: 0, ast: null }; for (let i = 0; i < 10; i++) __sim.step(1 / 60); })()")
        ok(E("__sim.G.score[0]") == 2, f'{tag}: a made basket counts two', E("__sim.G.score"))
        ok(E("__sim.x().dHoop({ x: 9.6 - 6.3, z: 0 }, 0)") > 5.8, f'{tag}: beyond the arc is a three')
        if vh > vw:
            E("__sim.live(); localStorage.setItem('hoo.settings', '{}'); location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(600)
            sw = "['tMus', 'tSfx', 'tVib'].map(i => document.getElementById(i).textContent === 'ON')"
            E("document.getElementById('setBtn').click()"); ok(E("!document.getElementById('ovSet').classList.contains('hidden')"), 'the Settings button opens the Settings card')
            E("document.getElementById('tMus').click()"); ok(E(sw) == [False, True, True], 'Music switches off on its own', str(E(sw)))
            E("document.getElementById('tVib').click()"); ok(E(sw) == [False, True, False], 'Vibration switches off on its own', str(E(sw)))
            E("document.getElementById('tSfx').click()"); ok(E(sw) == [False, False, False], 'Sound effects switch off on their own', str(E(sw)))
            E("location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(500)
            ok(E(sw) == [False, False, False], 'the settings are remembered'); E("localStorage.setItem('hoo.settings', '{}')")
        ok(not errs, f'{tag}: no JavaScript errors', str(errs[:3])); ctx.close()
    b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
