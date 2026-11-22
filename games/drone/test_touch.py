#!/usr/bin/env python3
"""Drone Pilot with real touches on a phone-sized screen: two thumbs at once, like a real controller. Left thumb up climbs,
left thumb sideways turns; right thumb up flies forwards, sideways slides; both at once work together; lifted, the sticks
spring back. No JavaScript errors.
Run: python3 games/drone/test_touch.py"""
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
    def touch(kind, pts): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, x, y in pts]})
    pg.evaluate("localStorage.setItem('dr.taught', '3'); __sim.go(4); __sim.G.lesson = null;"); pg.wait_for_timeout(300)
    I = lambda: pg.evaluate('[__sim.G.in.thr, __sim.G.in.yaw, __sim.G.in.pitch, __sim.G.in.roll].map(v => Math.round(v * 100) / 100)')
    touch('touchStart', [(1, 200, 600)]); pg.wait_for_timeout(60); v = I(); ok(v[2] > 0.8 and v[0] == 0 and v[1] == 0, 'a thumb held down anywhere: the drone flies forwards', str(v))
    touch('touchMove', [(1, 200, 540)]); pg.wait_for_timeout(60); ok(I()[0] > 0.8, 'sliding it up: climb', str(I()))
    touch('touchMove', [(1, 250, 600)]); pg.wait_for_timeout(60); v = I(); ok(v[1] < -0.8 and abs(v[0]) < 0.1 and v[2] > 0.3, 'sliding it right: turn right, still flying forwards', str(v))
    touch('touchEnd', []); pg.wait_for_timeout(60); ok(I()[:4] == [0, 0, 0, 0], 'thumb lifted: level and braking', str(I()))
    z0 = pg.evaluate('__sim.G.d.z'); touch('touchStart', [(2, 300, 700)]); pg.wait_for_timeout(40); pg.evaluate('__sim.adv(1.5)'); touch('touchEnd', [])
    ok(pg.evaluate('__sim.G.d.z') > z0 + 4, 'thumb held, the drone flies forwards', str(pg.evaluate('__sim.G.d.z') - z0))
    # and on the screen: after a right turn, a point that was straight ahead is on the left of the screen
    pg.evaluate("(() => { const G = __sim.G; G.d.yaw = 0; G.d.vx = G.d.vz = 0; window.__p = { x: G.d.x, y: G.d.y, z: G.d.z + 12 }; })()"); pg.wait_for_timeout(2700)
    a0 = pg.evaluate('__sim.wScreen(__p.x, __p.y, __p.z).x')
    touch('touchStart', [(1, 90, 700)]); touch('touchMove', [(1, 140, 700)]); pg.evaluate('__sim.adv(0.4)'); touch('touchEnd', []); pg.wait_for_timeout(2700)
    a1 = pg.evaluate('__sim.wScreen(__p.x, __p.y, __p.z).x'); ok(a1 < a0 - 20, 'after a right turn, what was straight ahead is now to the left on the screen', f'{a0:.0f} -> {a1:.0f}')
    pg.wait_for_timeout(300); pg.screenshot(path='/tmp/dr_touch.png'); ok(not errs, 'no JavaScript errors', str(errs[:3]))
    b.close()
print(f'\n{oks} checks passed, {len(fails)} failed.')
sys.exit(1 if fails else 0)
