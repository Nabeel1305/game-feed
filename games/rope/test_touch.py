#!/usr/bin/env python3
"""High Wire with real touches: a thumb down and slid sideways swings the pole (lean), pushed up walks (you move along the
wire), pulled down crouches; lifting it stands you still with the pole level. No JavaScript errors.
Run: python3 games/rope/test_touch.py"""
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
    pg.evaluate("localStorage.setItem('hw.taught', '3'); __sim.go(1);"); pg.wait_for_timeout(500)
    # (27 Nov 2026: the stick has one fixed place, its middle at (195, 714) on this phone)
    pg.mouse.move(195, 714); pg.mouse.down(); pg.mouse.move(240, 714, steps=3); pg.wait_for_timeout(100)
    ok(pg.evaluate("__sim.G.in.u") > 0.5 and pg.evaluate("__sim.G.in.down"), 'sliding right swings the pole', str(pg.evaluate("__sim.G.in.u")))
    s0 = pg.evaluate("__sim.G.me.s"); pg.mouse.move(195, 670, steps=3); pg.wait_for_timeout(600)
    ok(pg.evaluate("__sim.G.in.walk") and (pg.evaluate("__sim.G.me.s") > s0 or pg.evaluate("__sim.G.falls") > 0), 'pushing up walks', str(pg.evaluate("[__sim.G.in.walk, __sim.G.me.s]")))
    pg.mouse.move(195, 760, steps=3); pg.wait_for_timeout(100); ok(pg.evaluate("__sim.G.in.crouch"), 'pulling down crouches')
    pg.mouse.up(); pg.wait_for_timeout(100); ok(not pg.evaluate("__sim.G.in.down") and pg.evaluate("__sim.G.in.u") == 0, 'lifting the thumb: stand, pole level')
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
