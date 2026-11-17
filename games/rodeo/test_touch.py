#!/usr/bin/env python3
"""Rodeo with real touches and real drawing: a thumb on the left half leans left (the rider tips to the left of the screen), on
the right half leans right, both thumbs grip; letting go stops leaning. No JavaScript errors.
Run: python3 games/rodeo/test_touch.py"""
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
    pg.evaluate("localStorage.setItem('ro.taught', '3'); __sim.go(4); __sim.adv(0.6);"); pg.wait_for_timeout(200)
    cdp = ctx.new_cdp_session(pg)
    def touch(kind, pts): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, x, y in pts]})
    touch('touchStart', [(1, 80, 600)]); h = pg.evaluate("[__sim.G.held.l, __sim.G.held.r]"); ok(h == [True, False], 'a thumb on the left half holds LEFT', str(h))
    pg.evaluate("(() => { const G = __sim.G; G.mv = null; G.nextAt = 99; G.th = 0; G.w = 0; G.wobV = 0; G.wobT = 99; for (let i = 0; i < 12; i++) __sim.step(1 / 60); })()")
    ok(pg.evaluate("__sim.G.th") < -0.02, 'and the rider leans left', str(pg.evaluate("__sim.G.th")))
    touch('touchStart', [(1, 80, 600), (2, 310, 600)]); h = pg.evaluate("[__sim.G.held.l, __sim.G.held.r, __sim.G.gripping]"); pg.evaluate("__sim.step(1 / 60)"); ok(pg.evaluate("__sim.G.gripping") is True and h[0] and h[1], 'both thumbs grip', str(h))
    touch('touchEnd', [(2, 310, 600)]); h = pg.evaluate("[__sim.G.held.l, __sim.G.held.r]"); ok(h == [True, False], 'lifting the right thumb leaves the left one leaning', str(h))
    touch('touchEnd', []); h = pg.evaluate("[__sim.G.held.l, __sim.G.held.r]"); ok(h == [False, False], 'letting go stops leaning', str(h))
    touch('touchStart', [(3, 330, 500)]); pg.evaluate("(() => { const G = __sim.G; G.th = 0; G.w = 0; for (let i = 0; i < 12; i++) __sim.step(1 / 60); })()"); ok(pg.evaluate("__sim.G.th") > 0.02, 'a thumb on the right half leans right', str(pg.evaluate("__sim.G.th")))
    touch('touchEnd', []); pg.wait_for_timeout(300)
    x = pg.evaluate("(() => { const V = __sim.V3; return V && V.rider ? [__sim.scr(V.rider.position.x, V.rider.position.y + 1, V.rider.position.z).x] : null; })()"); ok(x is not None, 'the rider is drawn', str(x))
    pg.screenshot(path='/tmp/ro_touch.png'); ok(not errs, 'no JavaScript errors', str(errs[:3]))
    b.close()
print(f'\n{oks} checks passed, {len(fails)} failed.')
sys.exit(1 if fails else 0)
