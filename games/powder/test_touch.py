#!/usr/bin/env python3
"""Powder with real touches: a thumb held and slid right carves right (the rider moves to the right of the screen), slid left
carves left; letting go goes straight; a quick tap jumps; a held slide does not jump; in the air a held side spins and letting go
stops the spin. No JavaScript errors.
Run: python3 games/powder/test_touch.py"""
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
    pg.evaluate("localStorage.setItem('sb.taught', '3'); __sim.go(1); __sim.ui.snap = true; __sim.G.course.obs = []; __sim.G.course.kicks = [];"); pg.wait_for_timeout(1500)
    cdp = ctx.new_cdp_session(pg)
    def touch(kind, x, y): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [] if kind == 'touchEnd' else [{'x': x, 'y': y, 'id': 1}]})
    def slide(x0, y0, dx, hold):
        touch('touchStart', x0, y0); pg.wait_for_timeout(20)
        for i in range(1, 6): touch('touchMove', x0 + dx * i / 5, y0); pg.wait_for_timeout(16)
        pg.wait_for_timeout(hold)
    def sx(): return pg.evaluate("(() => { const m = __sim.G.me; return __sim.scr(m.x, 0, -m.s).x; })()")
    x0 = pg.evaluate("__sim.G.me.x"); slide(200, 600, 70, 700); x1 = pg.evaluate("[__sim.G.me.x, __sim.G.me.a, __sim.G.me.air]")
    ok(x1[0] > x0 + 0.5 and x1[1] > 0.2, 'held and slid right: carves right (world +x)', str([x0, x1])); ok(not x1[2], 'a held slide does not jump')
    touch('touchEnd', 0, 0); pg.wait_for_timeout(1300); ok(abs(pg.evaluate("__sim.G.me.a")) < 0.15, 'letting go: straight down', pg.evaluate("__sim.G.me.a"))
    xa = pg.evaluate("__sim.G.me.x"); slide(200, 600, -70, 700); ok(pg.evaluate("__sim.G.me.x") < xa - 0.5, 'slid left: carves left')
    touch('touchEnd', 0, 0); pg.wait_for_timeout(300)
    touch('touchStart', 150, 600); pg.wait_for_timeout(60); touch('touchEnd', 0, 0); pg.wait_for_timeout(40); ok(pg.evaluate("__sim.G.me.air"), 'a quick tap jumps')
    pg.wait_for_timeout(900)
    pg.evaluate("(() => { const m = __sim.G.me; m.air = true; m.vy = 9; m.y = 0.5; m.rot = 0; m.airT = 0.2; })()")
    slide(200, 600, 60, 250); r1 = pg.evaluate("__sim.G.me.rot"); touch('touchEnd', 0, 0); pg.wait_for_timeout(150); r2 = pg.evaluate("__sim.G.me.rot")
    ok(r1 > 0.5, 'in the air a held side spins', r1); ok(abs(r2 - r1) < 0.4 or not pg.evaluate("__sim.G.me.air"), 'letting go stops the spin', str([r1, r2]))
    pg.wait_for_timeout(300); pg.screenshot(path='/tmp/pw_touch.png'); ok(not errs, 'no JavaScript errors', str(errs[:3]))
    b.close()
print(f'\n{oks} checks passed, {len(fails)} failed.')
sys.exit(1 if fails else 0)
