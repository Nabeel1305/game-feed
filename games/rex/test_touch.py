#!/usr/bin/env python3
"""Rex with real touches: the left thumb lands and slides up (a stride: the stick reads forward and the rex moves), far up
(a charge); the BITE and ROAR buttons work; letting go stops. No JavaScript errors.
Run: python3 games/rex/test_touch.py"""
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
    pg.evaluate("localStorage.setItem('rx.taught', '3'); __sim.go(2);"); pg.wait_for_timeout(600)
    z0 = pg.evaluate("__sim.G.me.z")
    pg.mouse.move(100, 650); pg.mouse.down(); pg.mouse.move(100, 620, steps=4); pg.wait_for_timeout(800)
    ok(0.3 < pg.evaluate("__sim.G.in.sy") < 0.9 and not pg.evaluate("__sim.G.me.run"), 'a short push up strides', str(pg.evaluate("[__sim.G.in.sy, __sim.G.me.run]")))
    pg.mouse.move(100, 560, steps=4); pg.wait_for_timeout(500); ok(pg.evaluate("__sim.G.me.run"), 'pushed far: a charge')
    pg.mouse.up(); pg.wait_for_timeout(200); ok(pg.evaluate("__sim.G.in.sy") == 0, 'letting go stops the stick'); ok(pg.evaluate("Math.hypot(__sim.G.me.x, __sim.G.me.z - (%f))" % z0) > 2, 'the rex moved')
    B = pg.evaluate("__sim.btnRects()"); n0 = pg.evaluate("__sim.G.bites")
    pg.touchscreen.tap(B['bite']['x'] + B['bite']['w'] / 2, B['bite']['y'] + B['bite']['h'] / 2); pg.wait_for_timeout(150); ok(pg.evaluate("__sim.G.bites") == n0 + 1, 'BITE bites')
    pg.touchscreen.tap(B['roar']['x'] + B['roar']['w'] / 2, B['roar']['y'] + B['roar']['h'] / 2); pg.wait_for_timeout(150); ok(pg.evaluate("__sim.G.me.roarCD") > 0, 'ROAR roars')
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
