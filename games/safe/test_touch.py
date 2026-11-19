#!/usr/bin/env python3
"""Safecracker with real touches: a thumb dragged round the dial turns it with the thumb (clockwise one way, back the other),
lifting it keeps it still, and a tap on SET tries the number under the pointer. No JavaScript errors.
Run: python3 games/safe/test_touch.py"""
import math, os, sys
from playwright.sync_api import sync_playwright
here = os.path.dirname(os.path.abspath(__file__)); fails = []; oks = 0
def ok(c, what, d=''):
    global oks
    if c: oks += 1; print('  ok  ', what)
    else: fails.append(what); print('  FAIL', what, d)
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True); pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + os.path.join(here, 'index.html')); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(800)
    pg.evaluate("localStorage.setItem('sc.taught', '3'); __sim.go(1);"); pg.wait_for_timeout(500)
    L = pg.evaluate("(() => { const L = __sim.lay(); return { cx: L.cx, cy: L.cy, R: L.R, set: L.set }; })()"); cx, cy, R = L['cx'], L['cy'], L['R']
    def arc(a0, a1, n=12):
        pts = [(cx + math.cos(a0 + (a1 - a0) * i / n) * R * 0.8, cy + math.sin(a0 + (a1 - a0) * i / n) * R * 0.8) for i in range(n + 1)]
        pg.mouse.move(*pts[0]); pg.mouse.down()
        for q in pts[1:]: pg.mouse.move(*q); pg.wait_for_timeout(30)
        pg.mouse.up()
    p0 = pg.evaluate("__sim.G.pos"); arc(-math.pi / 2, 0)      # a quarter turn clockwise
    p1 = pg.evaluate("__sim.G.pos"); M = pg.evaluate("__sim.G.cfg.M")
    ok(abs((p0 - p1) - M / 4) < 1.5, 'a quarter turn of the thumb turns the dial a quarter', f'{p0} -> {p1}, dial of {M}')
    arc(0, -math.pi / 2); p2 = pg.evaluate("__sim.G.pos"); ok(abs(p2 - p0) < 1.5, 'turning back brings it back', f'{p2}')
    pg.wait_for_timeout(300); p3 = pg.evaluate("__sim.G.pos"); ok(p3 == p2, 'lifting the thumb: the dial stays still')
    w0 = pg.evaluate("__sim.G.wrongs + __sim.G.k"); S = L['set']; pg.touchscreen.tap(S['x'] + S['w'] / 2, S['y'] + S['h'] / 2); pg.wait_for_timeout(100)
    ok(pg.evaluate("__sim.G.wrongs + __sim.G.k") == w0 + 1, 'a tap on SET tries the number')
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
