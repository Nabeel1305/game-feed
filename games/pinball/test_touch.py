#!/usr/bin/env python3
"""Pinball with real touches: a touch on the left half raises the left flipper (and only that one) while it is held; the right
half the right one; both thumbs at once raise both; lifting a thumb drops its flipper; the first touch launches a waiting ball.
No JavaScript errors.
Run: python3 games/pinball/test_touch.py"""
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
    pg.evaluate("localStorage.setItem('pb.taught', '3'); __sim.go(2);"); pg.wait_for_timeout(400)
    cdp = ctx.new_cdp_session(pg)
    def touch(kind, pts): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, (x, y) in pts]})
    fl = lambda: pg.evaluate("__sim.G.fl.map(f => f.up)")
    touch('touchStart', [(1, (80, 700))]); pg.wait_for_timeout(80); f = fl(); lane = pg.evaluate("__sim.G.balls[0].vy")
    ok(f == [True, False], 'a touch on the left raises only the left flipper', str(f)); ok(lane > 5, 'the first touch launches the ball', lane)
    touch('touchStart', [(1, (80, 700)), (2, (310, 700))]); pg.wait_for_timeout(80); ok(fl() == [True, True], 'both thumbs: both flippers', str(fl()))
    touch('touchEnd', [(1, (80, 700))]); pg.wait_for_timeout(80); ok(fl() == [False, True], 'lifting the left thumb drops the left flipper only', str(fl()))
    touch('touchEnd', []); pg.wait_for_timeout(80); ok(fl() == [False, False], 'lifting both: both down', str(fl()))
    pg.wait_for_timeout(300); pg.screenshot(path='/tmp/pb_touch.png'); ok(not errs, 'no JavaScript errors', str(errs[:3]))
    b.close()
print(f'\n{oks} checks passed, {len(fails)} failed.')
sys.exit(1 if fails else 0)
