#!/usr/bin/env python3
"""Oarsmen with real touches: a tap on the left half pulls the left oar, a tap on the right half pulls the right oar,
both together moves the boat on. No JavaScript errors. Run: python3 games/row/test_touch.py"""
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
    pg.evaluate("localStorage.setItem('rw.taught', '3'); __sim.go(1);"); pg.wait_for_timeout(1200)
    s0 = pg.evaluate("__sim.G.strokes"); pg.touchscreen.tap(80, 700); pg.wait_for_timeout(80)
    ok(pg.evaluate("__sim.G.strokes") == s0 + 1 and pg.evaluate("__sim.G.me.oars[0].t") < 0.3 and pg.evaluate("__sim.G.me.oars[1].t") > 0.3, 'a tap on the left pulls the left oar only', str(pg.evaluate("[__sim.G.strokes, __sim.G.me.oars[0].t, __sim.G.me.oars[1].t]")))
    pg.wait_for_timeout(300); pg.touchscreen.tap(310, 700); pg.wait_for_timeout(80)
    ok(pg.evaluate("__sim.G.strokes") == s0 + 2 and pg.evaluate("__sim.G.me.oars[1].t") < 0.3, 'a tap on the right pulls the right oar', str(pg.evaluate("[__sim.G.strokes, __sim.G.me.oars[1].t]")))
    z0 = pg.evaluate("__sim.G.me.z")
    for i in range(6):
        pg.wait_for_timeout(900); pg.touchscreen.tap(80, 700); pg.touchscreen.tap(310, 700)
    pg.wait_for_timeout(300)
    ok(pg.evaluate("__sim.G.me.z") > z0 + 5, 'pulling both together moves the boat on', str(pg.evaluate("__sim.G.me.z") - z0))
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
