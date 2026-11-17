#!/usr/bin/env python3
"""Mini Golf with real touches and real drawing: pull back anywhere and let go, and the ball goes the other way (pull down:
it goes up the course; pull left: it goes right), harder the further you pull; a tiny pull does nothing; no second shot while
the ball rolls. No JavaScript errors.
Run: python3 games/golf/test_touch.py"""
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
    pg.evaluate("localStorage.setItem('mg.taught', '3'); __sim.go(4); __sim.G.lesson = null;"); pg.wait_for_timeout(400)
    cdp = ctx.new_cdp_session(pg)
    def touch(kind, pts): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, x, y in pts]})
    def pull(dx, dy):
        touch('touchStart', [(1, 200, 450)])
        for j in range(1, 5): touch('touchMove', [(1, 200 + dx * j / 4, 450 + dy * j / 4)])
        touch('touchEnd', []); pg.wait_for_timeout(60)
    pull(3, 4); ok(not pg.evaluate("__sim.G.moving"), 'a tiny pull does nothing')
    pull(0, 80); v = pg.evaluate("[__sim.G.ball.vx, __sim.G.ball.vz, __sim.G.total]"); ok(v[1] < -0.5 and abs(v[0]) < abs(v[1]) * 0.2 and v[2] == 1, 'pull straight down: the ball goes up the course', str(v))
    pull(0, 80); ok(pg.evaluate("__sim.G.total") == 1, 'no second shot while the ball rolls')
    pg.evaluate("(() => { const b = __sim.G.ball; b.vx = b.vz = 0; __sim.G.moving = false; })()")
    pull(-60, 0); v2 = pg.evaluate("[__sim.G.ball.vx, __sim.G.ball.vz]"); ok(v2[0] > 0.5, 'pull left: the ball goes right', str(v2))
    pg.evaluate("(() => { const b = __sim.G.ball; b.vx = b.vz = 0; __sim.G.moving = false; })()")
    pull(0, 40); s1 = pg.evaluate("Math.hypot(__sim.G.ball.vx, __sim.G.ball.vz)"); pg.evaluate("(() => { const b = __sim.G.ball; b.vx = b.vz = 0; __sim.G.moving = false; })()"); pull(0, 140); s2 = pg.evaluate("Math.hypot(__sim.G.ball.vx, __sim.G.ball.vz)")
    ok(s2 > s1 * 1.8, 'a longer pull hits harder', str([s1, s2]))
    pg.wait_for_timeout(400); pg.screenshot(path='/tmp/mg_touch.png'); ok(not errs, 'no JavaScript errors', str(errs[:3]))
    b.close()
print(f'\n{oks} checks passed, {len(fails)} failed.')
sys.exit(1 if fails else 0)
