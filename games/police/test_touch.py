#!/usr/bin/env python3
"""Police Chase with real touches and real drawing: holding the left side steers left, the right side right, both brakes; on foot
swipes change lane, jump and slide and a quick tap tackles; in the arrest a swipe the other way holds him. No JavaScript errors.
Run: python3 games/police/test_touch.py"""
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
    pg.evaluate("localStorage.setItem('pc.taught', '3'); __sim.go(4); __sim.G.lesson = null;"); pg.wait_for_timeout(300)
    cdp = ctx.new_cdp_session(pg)
    def touch(kind, pts): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, x, y in pts]})
    st = lambda: pg.evaluate("[__sim.G.in.left, __sim.G.in.right]")
    touch('touchStart', [(1, 60, 600)]); ok(st() == [True, False], 'left side held: steer left', str(st()))
    touch('touchStart', [(1, 60, 600), (2, 330, 600)]); ok(st() == [True, True], 'both sides held: brake', str(st()))
    touch('touchEnd', []); ok(st() == [False, False], 'let go: straight on', str(st()))
    pg.evaluate("__sim.startFoot(8)")
    def swipe(x0, y0, x1, y1):
        touch('touchStart', [(1, x0, y0)])
        for j in range(1, 5): touch('touchMove', [(1, x0 + (x1 - x0) * j / 4, y0 + (y1 - y0) * j / 4)])
        touch('touchEnd', [])
    swipe(200, 600, 100, 600); ok(pg.evaluate("__sim.G.foot.lane") == 0, 'swipe left: left lane')
    swipe(200, 600, 200, 480); ok(pg.evaluate("__sim.G.foot.air") > 0, 'swipe up: jump')
    pg.evaluate("__sim.G.foot.air = 0"); swipe(200, 500, 200, 640); ok(pg.evaluate("__sim.G.foot.low") > 0, 'swipe down: slide')
    pg.evaluate("__sim.G.foot.gap = 1.5; __sim.G.foot.dive = 0"); touch('touchStart', [(1, 200, 600)]); touch('touchEnd', [])
    ok(pg.evaluate("__sim.G.ph") == 'cuff', 'a quick tap right behind him: tackled, the arrest begins')
    pg.evaluate("__sim.G.cuff.heave = { dir: 'l', t: 0.05, done: false, go: true }"); swipe(200, 600, 310, 600)
    ok(pg.evaluate("__sim.G.cuff.held") == 1, 'he twists left, a swipe right holds him')
    pg.wait_for_timeout(400); pg.screenshot(path='/tmp/pc_touch.png'); ok(not errs, 'no JavaScript errors', str(errs[:3]))
    b.close()
print(f'\n{oks} checks passed, {len(fails)} failed.')
sys.exit(1 if fails else 0)
