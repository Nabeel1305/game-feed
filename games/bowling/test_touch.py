#!/usr/bin/env python3
"""Strike Alley with real touches: a thumb put down lines the ball up under it (right of the lane for a thumb on the right);
a short pull does not roll; a pull straight down and let go rolls it straight, harder the further the pull; a pull tilted to
the right sends it left of straight (a slingshot), tilted left sends it right. No JavaScript errors.
Run: python3 games/bowling/test_touch.py"""
import os, sys
from playwright.sync_api import sync_playwright
here = os.path.dirname(os.path.abspath(__file__)); fails = []; oks = 0
def ok(c, what, d=''):
    global oks
    if c: oks += 1; print('  ok  ', what)
    else: fails.append(what); print('  FAIL', what, d)
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True); pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.add_init_script('window.__softGL = true'); pg.goto('file://' + os.path.join(here, 'index.html')); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(800)
    cdp = ctx.new_cdp_session(pg)
    def touch(kind, x, y): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [] if kind == 'touchEnd' else [{'x': x, 'y': y, 'id': 1}]})
    def fresh():
        pg.evaluate("localStorage.setItem('sa.taught', '3'); __sim.go(1); __sim.ui.snap = true;"); pg.wait_for_timeout(1400)
        pg.wait_for_function("__sim.G && __sim.G.phase === 'aim' && __sim.G.wait <= 0", timeout=8000)
    def pull(x0, y0, dx, dy, steps=8):
        touch('touchStart', x0, y0); pg.wait_for_timeout(30)
        for i in range(1, steps + 1): touch('touchMove', x0 + dx * i / steps, y0 + dy * i / steps); pg.wait_for_timeout(16)
        a = pg.evaluate("[__sim.G.aim.x, __sim.G.aim.a, __sim.G.aim.p]"); touch('touchEnd', 0, 0); pg.wait_for_timeout(120); return a
    fresh()
    touch('touchStart', 250, 560); pg.wait_for_timeout(60); ax = pg.evaluate("__sim.G.aim.x"); ok(ax > 0.08, 'a thumb right of the middle lines the ball up right of the middle', ax)
    touch('touchMove', 140, 560); pg.wait_for_timeout(60); ax2 = pg.evaluate("__sim.G.aim.x"); ok(ax2 < -0.05, 'sliding it left moves the ball left', ax2)
    sx = pg.evaluate("(() => __sim.scr(__sim.G.aim.x, 0.1, 0.25).x)()"); ok(abs(sx - 140) < 45, 'the ball sits under the thumb', sx)
    touch('touchEnd', 0, 0); pg.wait_for_timeout(150); ok(pg.evaluate("__sim.G.phase") == 'aim', 'a touch with no pull does not roll')
    a = pull(195, 560, 0, 25); ok(pg.evaluate("__sim.G.phase") == 'aim', 'a tiny pull does not roll', str(a))
    a = pull(195, 560, 0, 150); ok(abs(a[1]) < 0.01 and a[2] > 0.6, 'a long straight pull: straight and strong', str(a)); ok(pg.evaluate("__sim.G.phase") == 'roll', 'letting go rolls it')
    fresh(); a = pull(195, 560, 0, 60); ok(0.2 <= a[2] < 0.45, 'a short pull: a soft roll', str(a))
    fresh(); a = pull(195, 560, 60, 140); ok(a[1] < -0.02, 'pull tilted right: the ball goes left of straight', str(a))
    fresh(); a = pull(195, 560, -60, 140); ok(a[1] > 0.02, 'pull tilted left: the ball goes right of straight', str(a))
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
