#!/usr/bin/env python3
"""Vine with real touches and real drawing: lifting the thumb lets go; moving it sideways in the air leans; putting it down near the
next vine catches it; down far from any vine closes the hand on air (and the hand needs a moment). No JavaScript errors.
Run: python3 games/vine/test_touch.py"""
import os, sys
from playwright.sync_api import sync_playwright
here = os.path.dirname(os.path.abspath(__file__)); fails = []; oks = 0
def ok(c, what, d=''):
    global oks
    if c: oks += 1; print('  ok  ', what)
    else: fails.append(what); print('  FAIL', what, d)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.add_init_script('window.__softGL = true'); pg.goto('file://' + os.path.join(here, 'index.html')); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(800)
    pg.evaluate("localStorage.setItem('vn.taught', '3'); __sim.go(4); __sim.G.lesson = null;"); pg.wait_for_timeout(300)
    m = pg.mouse
    m.move(200, 600); m.down(); pg.wait_for_timeout(100); ok(pg.evaluate("__sim.G.held"), 'thumb down: still holding the vine')
    m.up(); ok(not pg.evaluate("__sim.G.held"), 'thumb up: let go')
    m.move(200, 600); m.down(); r = pg.evaluate("[__sim.G.held, __sim.G.grabT > 0]"); ok(r == [False, True], 'thumb down far from the next vine: the hand closes on air and needs a moment', str(r))
    m.move(300, 600, steps=4); ok(pg.evaluate("__sim.G.lean") > 0.8, 'thumb moved right in the air: lean right'); m.up()
    pg.evaluate("(() => { const G = __sim.G, v = G.vines[G.on + 1]; G.held = false; G.grabT = 0; G.p.x = v.x; G.p.y = v.y - v.L * 0.8 - 1; G.p.z = v.z + 0.2; G.p.vx = 0; G.p.vy = 0; G.p.vz = -3; })()")
    on0 = pg.evaluate("__sim.G.on"); m.down(); r = pg.evaluate("[__sim.G.held, __sim.G.on]"); m.up()
    ok(r[0] and r[1] == on0 + 1, 'thumb down by the next vine: caught it', str(r))
    pg.wait_for_timeout(500); pg.screenshot(path='/tmp/vn_touch.png'); ok(not errs, 'no JavaScript errors', str(errs[:3]))
    b.close()
print(f'\n{oks} checks passed, {len(fails)} failed.')
sys.exit(1 if fails else 0)
