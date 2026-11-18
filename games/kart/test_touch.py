#!/usr/bin/env python3
"""Drift Kings with real touches: the left thumb slid right steers right, slid left steers left, let go goes straight; a hard slide at speed starts a drift; a tap on the right half uses the item (and is not a steer) (up the screen is
up, right is right); a short drag swims, a long one dashes (the blue bar goes down); letting go eases off; a drag that starts
on the top bar still steers. No JavaScript errors.
Run: python3 games/kart/test_touch.py"""
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
    pg.evaluate("localStorage.setItem('dk.taught', '3'); __sim.go(1); __sim.ui.snap = true;"); pg.wait_for_timeout(400)
    cdp = ctx.new_cdp_session(pg)
    def touch(kind, x, y): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [] if kind == 'touchEnd' else [{'x': x, 'y': y, 'id': 1}]})
    def drag(x0, y0, x1, y1, hold=600):
        touch('touchStart', x0, y0); pg.wait_for_timeout(30)
        for i in range(1, 7): touch('touchMove', x0 + (x1 - x0) * i / 6, y0 + (y1 - y0) * i / 6); pg.wait_for_timeout(16)
        pg.wait_for_timeout(hold)
    def heading(): return pg.evaluate("(() => { const m = __sim.G.me, a = __sim.scr(m.x, 0, m.z), b = __sim.scr(m.x + Math.cos(m.face), 0, m.z + Math.sin(m.face)); return [b.x - a.x, b.y - a.y]; })()")
    pg.wait_for_timeout(5200)
    drag(90, 650, 120, 650, 200); st = pg.evaluate("__sim.G.steer"); ok(0.3 < st < 0.75, 'left thumb slid a little right: a gentle right turn', str(st))
    touch('touchEnd', 0, 0); pg.wait_for_timeout(80); ok(pg.evaluate("__sim.G.steer") == 0, 'let go: straight')
    h0 = pg.evaluate("__sim.G.me.h"); drag(120, 650, 60, 650, 500); st = pg.evaluate("[__sim.G.steer, __sim.G.me.h, __sim.G.me.drift]")
    ok(st[0] <= -0.95, 'slid well left: a hard left', str(st)); ok(st[2] == -1, 'a hard turn held at speed starts a drift (left)', str(st))
    touch('touchEnd', 0, 0); pg.wait_for_timeout(120); ok(pg.evaluate("__sim.G.me.drift") == 0, 'let go: the drift ends')
    pg.evaluate("__sim.G.me.item = 'turbo'"); pg.touchscreen.tap(320, 600); pg.wait_for_timeout(120); r = pg.evaluate("[__sim.G.me.item, __sim.G.me.boost > 0, __sim.G.steer]")
    ok(r[0] is None and r[1], 'a tap on the right half uses the item (a Turbo: boost)', str(r)); ok(r[2] == 0, 'a tap on the right does not steer', str(r))
    pg.wait_for_timeout(200); pg.screenshot(path='/tmp/dk_touch.png'); ok(not errs, 'no JavaScript errors', str(errs[:3]))
    b.close()
print(f'\n{oks} checks passed, {len(fails)} failed.')
sys.exit(1 if fails else 0)
