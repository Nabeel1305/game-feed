#!/usr/bin/env python3
"""Eleven with real touches, held sideways: in an upright window (the phone app, which never turns) the game is drawn a quarter
turn round and touches are turned with it; in a sideways window it is drawn as it is. In both: a thumb on the left drags the
stick (dragging toward the picture's right runs to the right), PASS passes, SHOOT shoots, and without the ball the same
buttons switch and tackle. No JavaScript errors.
Run: python3 games/eleven/test_touch.py"""
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
        pg.add_init_script('window.__softGL = true'); pg.goto('file://' + os.path.join(here, 'index.html')); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(800)
        pg.evaluate("localStorage.setItem('el.taught', '3'); __sim.go(4); __sim.adv(0.1);"); pg.wait_for_timeout(300)
        cdp = ctx.new_cdp_session(pg)
        def toScreen(x, y):      # the game's own (sideways) point -> the window's point
            if vh > vw: return (vw - y, x)
            return (x, y)
        def touch(kind, pts): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, x, y in pts]})
        Wl, Hl = max(vw, vh), min(vw, vh)
        sx, sy = toScreen(Wl * 0.18, Hl * 0.6); ex, ey = toScreen(Wl * 0.18 + 90, Hl * 0.6)
        touch('touchStart', [(1, sx, sy)]); touch('touchMove', [(1, (sx + ex) / 2, (sy + ey) / 2)]); pg.wait_for_timeout(50); touch('touchMove', [(1, ex, ey)]); pg.wait_for_timeout(50); st = pg.evaluate("[__sim.G.stick.x, __sim.G.stick.z]")
        ok(st[0] > 0.8 and abs(st[1]) < 0.2, f'{tag}: dragging the stick to the right runs right', str(st))
        touch('touchEnd', []); ok(pg.evaluate("__sim.G.stick.x") == 0, f'{tag}: letting go stops', str(pg.evaluate("__sim.G.stick.x")))
        bt = pg.evaluate("__sim.buttons().map(q => [q.k, q.x, q.y])"); B = {k2: (x, y) for k2, x, y in bt}
        own = pg.evaluate("!!(__sim.G.ball.own && __sim.G.ball.own.t === 0 && __sim.G.ball.own.i === __sim.G.ctrl)")
        ok(own, f'{tag}: you start with the ball')
        x, y = toScreen(*B['pass']); touch('touchStart', [(2, x, y)]); touch('touchEnd', [])
        k3 = pg.evaluate("[__sim.G.ball.kind, !!__sim.G.ball.own]"); ok(k3[0] == 'pass' and not k3[1], f'{tag}: PASS passes', str(k3))
        pg.evaluate("(() => { const G = __sim.G, o = G.P[15]; G.ball.own = null; G.ball.kind = null; G.ball.to = null; o.x = 0; o.z = 0; o.down = 0; G.ball.own = o; G.ball.last = o; const m = G.P[G.ctrl]; m.x = -0.8; m.z = 0; m.down = 0; m.tk = 0; })()")
        x, y = toScreen(*B['shoot']); touch('touchStart', [(3, x, y)]); touch('touchEnd', [])
        ok(pg.evaluate("__sim.G.P[__sim.G.ctrl].tk > 0"), f'{tag}: without the ball SHOOT is a tackle')
        pg.evaluate("(() => { const G = __sim.G, o = G.P[16]; o.x = 20; o.z = 0; o.down = 0; G.ball.own = o; G.ball.last = o; G.ball.kind = null; G.ball.to = null; G.P[G.ctrl].x = -40; })()"); before = pg.evaluate("__sim.G.ctrl")
        x, y = toScreen(*B['pass']); touch('touchStart', [(4, x, y)]); touch('touchEnd', [])
        ok(pg.evaluate("__sim.G.ctrl") != before, f'{tag}: without the ball PASS switches to the man nearest it')
        pg.wait_for_timeout(300); pg.screenshot(path=f'/tmp/el_touch_{vw}.png'); ok(not errs, f'{tag}: no JavaScript errors', str(errs[:3]))
        ctx.close()
    b.close()
print(f'\n{oks} checks passed, {len(fails)} failed.')
sys.exit(1 if fails else 0)
