#!/usr/bin/env python3
"""Fruit Fight with real touches: tapping a fruit button loads it; pulling back and letting go fires a fruit (aimed the
opposite way to the pull); a tiny pull does not fire. No JavaScript errors.
Run: python3 games/fruit/test_touch.py"""
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
    pg.evaluate("localStorage.setItem('ff.taught', '3'); __sim.go(3);"); pg.wait_for_timeout(500)
    B = {b['f']: b for b in pg.evaluate("__sim.fruitBtns()")}
    pg.touchscreen.tap(B['melon']['x'] + 20, B['melon']['y'] + 20); pg.wait_for_timeout(150); ok(pg.evaluate("__sim.G.fruit") == 'melon', 'tapping the melon loads it')
    pg.touchscreen.tap(B['orange']['x'] + 20, B['orange']['y'] + 20); pg.wait_for_timeout(150)
    n0 = pg.evaluate("__sim.G.shotsN"); pg.mouse.move(200, 450); pg.mouse.down(); pg.mouse.move(150, 560, steps=5); pg.mouse.up(); pg.wait_for_timeout(100)
    ok(pg.evaluate("__sim.G.shotsN") == n0 + 1, 'pull back and let go: it fires')
    ok(pg.evaluate("__sim.G.shots.length ? __sim.G.shots[__sim.G.shots.length - 1].vx > 0 : true"), 'pulled left, it flies right')
    pg.wait_for_timeout(700); n1 = pg.evaluate("__sim.G.shotsN"); pg.mouse.move(200, 450); pg.mouse.down(); pg.mouse.move(203, 455); pg.mouse.up(); pg.wait_for_timeout(100)
    ok(pg.evaluate("__sim.G.shotsN") == n1, 'a tiny pull does not fire')
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
