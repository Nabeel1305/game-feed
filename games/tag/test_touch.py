#!/usr/bin/env python3
"""Tag with real touches and real drawing: the thumb lands anywhere and drags, and you run that way (screen right is your
right, screen up is up the yard); let go and you stop; two quick taps dash. No JavaScript errors.
Run: python3 games/tag/test_touch.py"""
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
    pg.evaluate("localStorage.setItem('tg.taught', '3'); __sim.go(4); __sim.G.lesson = null; __sim.G.me.x = 0; __sim.G.me.z = 10;"); pg.wait_for_timeout(300)
    cdp = ctx.new_cdp_session(pg)
    def touch(kind, pts): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, x, y in pts]})
    me = lambda: pg.evaluate("[__sim.G.me.x, __sim.G.me.z]")
    # drag right: you run right (and the screen shows you moving right)
    x0 = pg.evaluate("(() => { const s = __sim.scr(__sim.G.me.x, 0, __sim.G.me.z); return s.x; })()")
    a = me(); touch('touchStart', [(1, 200, 600)]); touch('touchMove', [(1, 230, 600)]); touch('touchMove', [(1, 260, 600)]); pg.wait_for_timeout(500)
    bb = me(); ok(bb[0] > a[0] + 1 and abs(bb[1] - a[1]) < 1.2, 'drag right: you run right', str([a, bb]))
    x1 = pg.evaluate("(() => { const s = __sim.scr(__sim.G.me.x, 0, __sim.G.me.z); return s.x; })()"); ok(x1 > x0, 'and on the screen you move right', str([x0, x1]))
    touch('touchMove', [(1, 200, 540)]); pg.wait_for_timeout(500); c = me(); ok(c[1] < bb[1] - 1, 'drag up: you run up the yard', str([bb, c]))
    touch('touchEnd', []); pg.wait_for_timeout(400); d = me(); pg.wait_for_timeout(300); e = me(); ok(abs(e[0] - d[0]) + abs(e[1] - d[1]) < 0.3, 'let go: you stop', str([d, e]))
    # the DASH button
    pg.evaluate("__sim.G.me.cd = 0; __sim.G.me.dash = 0"); D = pg.evaluate("__sim.dashBtn()"); touch('touchStart', [(1, 150, 600)]); touch('touchMove', [(1, 190, 600)]); touch('touchStart', [(1, 190, 600), (2, D['x'], D['y'])]); pg.wait_for_timeout(40)
    ok(pg.evaluate("__sim.G.me.dash") > 0, 'the DASH button dashes while the other thumb runs', str(pg.evaluate("[__sim.G.me.dash, __sim.G.me.cd]"))); touch('touchEnd', []); pg.wait_for_timeout(700)
    # two quick taps: dash
    pg.evaluate("__sim.G.me.cd = 0"); touch('touchStart', [(1, 200, 600)]); touch('touchMove', [(1, 240, 600)]); touch('touchEnd', []); pg.wait_for_timeout(60); touch('touchStart', [(1, 200, 600)])
    ok(pg.evaluate("__sim.G.me.dash") > 0, 'two quick taps: DASH', str(pg.evaluate("[__sim.G.me.dash, __sim.G.me.cd]")))
    touch('touchEnd', []); pg.wait_for_timeout(700)
    pg.evaluate("__sim.G.me.cd = 0"); touch('touchStart', [(1, 200, 600)]); touch('touchEnd', []); pg.wait_for_timeout(500); touch('touchStart', [(1, 200, 600)]); touch('touchEnd', [])
    ok(pg.evaluate("__sim.G.me.dash") <= 0, 'two slow taps: no dash')
    pg.wait_for_timeout(400); pg.screenshot(path='/tmp/tg_touch.png'); ok(not errs, 'no JavaScript errors', str(errs[:3]))
    b.close()
print(f'\n{oks} checks passed, {len(fails)} failed.')
sys.exit(1 if fails else 0)
