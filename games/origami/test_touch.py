#!/usr/bin/env python3
"""Origami with real touches: a thumb put on the glowing corner and dragged onto the dot makes the fold (the paper folding
after the thumb while it is down); a drag that ends far off crumples the paper and makes no fold. No JavaScript errors.
Run: python3 games/origami/test_touch.py"""
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
    pg.evaluate("localStorage.setItem('og.taught', '3'); __sim.go(1);"); pg.wait_for_timeout(400)
    def pts():
        return pg.evaluate("(() => { const L = __sim.lay(), st = __sim.stepNow(); return [L.toS(st.P), L.toS(st.Q)]; })()")
    P, Q = pts(); pg.mouse.move(*P); pg.mouse.down(); pg.mouse.move((P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2, steps=5)
    ok(pg.evaluate("!!__sim.G.drag"), 'the thumb down on the corner lifts the paper')
    pg.mouse.move(*Q, steps=5); pg.mouse.up(); pg.wait_for_timeout(150)
    ok(pg.evaluate("__sim.G.si") == 1, 'dragging the corner onto the dot makes the fold', str(pg.evaluate("[__sim.G.si, __sim.G.crum]")))
    P, Q = pts(); pg.mouse.move(*P); pg.mouse.down(); pg.mouse.move(P[0] + 120, P[1] - 200, steps=6); pg.mouse.up(); pg.wait_for_timeout(150)
    ok(pg.evaluate("__sim.G.si") == 1 and pg.evaluate("__sim.G.crum") == 1, 'a drag far off: no fold, one crumple', str(pg.evaluate("[__sim.G.si, __sim.G.crum]")))
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
