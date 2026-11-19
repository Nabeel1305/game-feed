#!/usr/bin/env python3
"""Paint Drop with real touches: a finger put down and slid moves the blob in hand along the top; lifting it drops the blob
there (it falls into the jar); a quick tap drops at the tap. No JavaScript errors. Run: python3 games/paint/test_touch.py"""
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
    pg.goto('file://' + os.path.join(here, 'index.html')); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(800)
    pg.evaluate("localStorage.setItem('pd.taught', '3'); __sim.go(1);"); pg.wait_for_timeout(400)
    sx = lambda x: pg.evaluate(f"(() => {{ const L = __sim.lay(); return L.sx({x}); }})()")
    y = 500
    pg.mouse.move(sx(2), y); pg.mouse.down(); pg.wait_for_timeout(60); a1 = pg.evaluate("__sim.G.aim")
    pg.mouse.move(sx(7), y, steps=6); pg.wait_for_timeout(60); a2 = pg.evaluate("__sim.G.aim")
    ok(abs(a1 - 2) < 0.3 and abs(a2 - 7) < 0.3, 'a finger down and slid moves the blob along the top', str([a1, a2]))
    n0 = pg.evaluate("__sim.G.b.length"); pg.mouse.up(); pg.wait_for_timeout(1500)
    bl = pg.evaluate("__sim.G.b.map(b => [+(b.x.toFixed(2)), +(b.y.toFixed(2))])")
    ok(len(bl) == n0 + 1 and abs(bl[-1][0] - 7) < 0.6 and bl[-1][1] < 2, 'lifting drops it there, and it falls to the bottom', str(bl))
    pg.touchscreen.tap(sx(4), y); pg.wait_for_timeout(1200)
    bl = pg.evaluate("__sim.G.b.map(b => +(b.x.toFixed(2)))")
    ok(len(bl) >= n0 + 1 and any(abs(x - 4) < 0.8 for x in bl), 'a quick tap drops at the tap', str(bl))
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
