#!/usr/bin/env python3
"""Stunt Kart with real touches: the left thumb slid right steers right, slid left steers left, let go goes straight; a tap
on the right half in the air starts a trick (and is not a steer); a second tap during the trick does nothing; on the ground
a tap on the right half uses the item. Landing mid-trick is a wipeout; landing after it is a boost. No JavaScript errors.
Run: python3 games/stunt/test_touch.py"""
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
    E = pg.evaluate
    E("localStorage.setItem('sk.taught', '3'); __sim.go(1); __sim.ui.snap = true;"); pg.wait_for_timeout(400)
    cdp = ctx.new_cdp_session(pg)
    def touch(kind, x, y): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [] if kind == 'touchEnd' else [{'x': x, 'y': y, 'id': 1}]})
    def drag(x0, y0, x1, y1, hold=300):
        touch('touchStart', x0, y0); pg.wait_for_timeout(30)
        for i in range(1, 7): touch('touchMove', x0 + (x1 - x0) * i / 6, y0 + (y1 - y0) * i / 6); pg.wait_for_timeout(16)
        pg.wait_for_timeout(hold)
    pg.wait_for_timeout(3000)
    drag(90, 650, 120, 650, 150); st = E("__sim.G.steer"); ok(0.3 < st < 0.75, 'left thumb slid a little right: a gentle right turn', str(st))
    touch('touchEnd', 0, 0); pg.wait_for_timeout(80); ok(E("__sim.G.steer") == 0, 'let go: straight')
    drag(120, 650, 50, 650, 150); ok(E("__sim.G.steer") <= -0.95, 'slid well left: a hard left'); touch('touchEnd', 0, 0); pg.wait_for_timeout(80)
    # on the ground: the item
    E("__sim.G.me.item = 'turbo'"); pg.touchscreen.tap(320, 600); pg.wait_for_timeout(120); r = E("[__sim.G.me.item, __sim.G.me.boost > 0, __sim.G.steer]")
    ok(r[0] is None and r[1], 'on the ground a tap on the right half uses the item (a Turbo: boost)', str(r)); ok(r[2] == 0, 'a tap on the right does not steer', str(r))
    # in the air: put the kart in the air by hand, high enough for one trick
    E("(() => { const k = __sim.G.me; k.air = true; k.glide = false; k.y = 2; k.vy = 6; k.airTricks = 0; k.trick = null; k.boost = 0; })()")
    pg.touchscreen.tap(320, 600); pg.wait_for_timeout(40); r = E("[!!__sim.G.me.trick, __sim.G.me.airTricks]"); ok(r[0] and r[1] == 1, 'in the air a tap on the right half starts a trick', str(r))
    pg.touchscreen.tap(320, 600); pg.wait_for_timeout(30); ok(E("__sim.G.me.airTricks") == 1, 'a tap during a trick does nothing')
    pg.wait_for_function("!__sim.G.me.air", timeout=4000); r = E("[__sim.G.me.spin, __sim.G.me.boost, __sim.G.tricks, __sim.G.wipeouts]")
    ok(r[0] == 0 and r[1] > 0.3 and r[2] == 1, 'landing after the trick: clean, a boost', str(r))
    # land in the middle of one: a wipeout
    pg.wait_for_timeout(300); E("(() => { const k = __sim.G.me; k.air = true; k.y = 0.6; k.vy = 0; k.airTricks = 0; k.trick = null; })()"); pg.touchscreen.tap(320, 600)
    pg.wait_for_function("!__sim.G.me.air", timeout=4000); ok(E("__sim.G.wipeouts") == 1 and E("__sim.G.me.spin") > 0, 'landing mid-trick: a wipeout')
    pg.wait_for_timeout(200); ok(not errs, 'no JavaScript errors', str(errs[:3]))
    b.close()
print(f'\n{oks} checks passed, {len(fails)} failed.')
sys.exit(1 if fails else 0)
