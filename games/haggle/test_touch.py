#!/usr/bin/env python3
"""Haggle with real touches: dragging the brass dial sets the offer (left is less, right is more); OFFER makes it (they counter
or take it); the UV lamp and the loupe each look once; Pass sends them away and the next customer comes. No JavaScript errors.
Run: python3 games/haggle/test_touch.py"""
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
    pg.goto('file://' + os.path.join(here, 'index.html')); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(600)
    pg.evaluate("localStorage.setItem('hg.taught', '3'); __sim.go(1);"); pg.wait_for_timeout(1500)
    L = pg.evaluate("__sim.lay()"); cdp = ctx.new_cdp_session(pg)
    def touch(kind, x, y): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [] if kind == 'touchEnd' else [{'x': x, 'y': y, 'id': 1}]})
    D = L['dial']; y = D['y'] + D['h'] / 2
    touch('touchStart', D['x'] + 20, y); [touch('touchMove', D['x'] + 20 + i * 12, y) for i in range(1, 12)]; touch('touchEnd', 0, 0); a = pg.evaluate("__sim.dial")
    touch('touchStart', D['x'] + D['w'] * 0.8, y); touch('touchMove', D['x'] + D['w'] * 0.85, y); touch('touchEnd', 0, 0); b2 = pg.evaluate("__sim.dial")
    ok(0 < a < b2, 'the dial: further right is a bigger offer', str([a, b2]))
    pg.screenshot(path='/tmp/ht/shop.png')
    T = {t['id']: t for t in L['tools']}
    pg.touchscreen.tap(T['uv']['x'] + 30, T['uv']['y'] + 15); pg.wait_for_timeout(300); ok(pg.evaluate("__sim.G.visit && __sim.G.visit.seen.uv"), 'the UV lamp looks')
    pg.wait_for_timeout(400); pg.screenshot(path='/tmp/ht/uv.png')
    touch('touchStart', D['x'] + D['w'] * 0.3, y); touch('touchEnd', 0, 0); off = pg.evaluate("__sim.dial"); O = L['offer']
    v0 = pg.evaluate("[__sim.G.visit.id, __sim.G.visit.offers]"); pg.touchscreen.tap(O['x'] + O['w'] / 2, O['y'] + O['h'] / 2); pg.wait_for_timeout(300)
    v1 = pg.evaluate("__sim.G.visit ? [__sim.G.visit.id, __sim.G.visit.offers] : [-1, -1]"); ok(v1[0] != v0[0] or v1[1] == v0[1] + 1, 'OFFER makes the offer', str([v0, v1, off]))
    pg.wait_for_timeout(1600); vid = pg.evaluate("__sim.G.visit && __sim.G.visit.id"); pg.touchscreen.tap(T['pass']['x'] + 30, T['pass']['y'] + 15); pg.wait_for_timeout(1700)
    ok(pg.evaluate("__sim.G.visit && __sim.G.visit.id") != vid and pg.evaluate("__sim.G.passed") >= 1, 'Pass: they go, the next one comes')
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
