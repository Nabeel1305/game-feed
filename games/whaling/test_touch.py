#!/usr/bin/env python3
"""Whaling with real touches on a phone-sized screen: the left thumb steers (slide left or right), the right thumb swipes up
to throw (a swipe to the right throws to the right, a longer one further), and on the line it hauls while held down and lets
the line run when lifted; both thumbs at once. No JavaScript errors.
Run: python3 games/whaling/test_touch.py"""
import os, sys, math
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
    def touch(kind, pts): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, x, y in pts]})
    pg.evaluate("localStorage.setItem('wh.taught', '3'); __sim.go(4); __sim.G.lesson = null;"); pg.wait_for_timeout(300)
    touch('touchStart', [(1, 90, 700)]); touch('touchMove', [(1, 130, 700)]); ok(pg.evaluate('__sim.G.steer') < -0.8, 'left thumb slid right: steer right (the rules turn towards -x, the right of the screen)', str(pg.evaluate('__sim.G.steer')))
    touch('touchEnd', []); ok(pg.evaluate('__sim.G.steer') == 0, 'lifted: straight on')
    def swipe(x0, y0, x1, y1): touch('touchStart', [(2, x0, y0)]); [touch('touchMove', [(2, x0 + (x1 - x0) * j / 6, y0 + (y1 - y0) * j / 6)]) for j in range(1, 7)]; touch('touchEnd', [])
    swipe(300, 720, 360, 560); d = pg.evaluate('__sim.G.darts[0]'); h = pg.evaluate('__sim.G.boat.h'); bx, bz = pg.evaluate('[__sim.G.boat.x, __sim.G.boat.z]')
    a = math.atan2(d['tx'] - bx, d['tz'] - bz) - h if d else 0; ok(d and a < -0.1, 'a swipe up and to the right throws to the right of the screen', str(d))
    pg.evaluate('__sim.adv(1.5)'); n0 = pg.evaluate('__sim.G.harps'); swipe(300, 760, 300, 690); d1 = pg.evaluate('__sim.G.darts[0]'); pg.evaluate('__sim.adv(1.5)'); swipe(300, 760, 300, 520); d2 = pg.evaluate('__sim.G.darts[0]')
    ok(d1 and d2 and d2['dist'] > d1['dist'] + 6, 'a longer swipe throws further', f"{d1 and d1['dist']} {d2 and d2['dist']}")
    pg.evaluate("(() => { const G = __sim.G; G.ph = 'ride'; G.line = 40; G.T = 0.4; G.whale.next = 99; G.whale.warn = 0; G.whale.surge = 0; G.harps = 3; })()")
    touch('touchStart', [(2, 300, 700)]); ok(pg.evaluate('__sim.G.haul') is True, 'on the line: right thumb held down hauls')
    touch('touchStart', [(1, 90, 700), (2, 300, 700)]); touch('touchMove', [(1, 50, 700), (2, 300, 700)]); ok(pg.evaluate('__sim.G.haul') is True and pg.evaluate('__sim.G.steer') > 0.8, 'both thumbs: hauling and steering left together')
    touch('touchEnd', []); ok(pg.evaluate('__sim.G.haul') is False, 'lifted: the line runs')
    pg.wait_for_timeout(300); pg.screenshot(path='/tmp/wh_touch.png'); ok(not errs, 'no JavaScript errors', str(errs[:3]))
    b.close()
print(f'\n{oks} checks passed, {len(fails)} failed.')
sys.exit(1 if fails else 0)
