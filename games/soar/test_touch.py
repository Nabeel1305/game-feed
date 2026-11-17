#!/usr/bin/env python3
"""Soar with real touches and real drawing: a thumb down anywhere is the middle of a little stick; moved right it turns right,
up it climbs, down it dives; let go and it levels out. No JavaScript errors. Run: python3 games/soar/test_touch.py"""
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
    pg.evaluate("localStorage.setItem('so.taught', '3'); __sim.go(4); __sim.G.lesson = null;"); pg.wait_for_timeout(300)
    m = pg.mouse; st = lambda: pg.evaluate("[__sim.G.stick.x, __sim.G.stick.y]")
    m.move(120, 600); m.down(); m.move(200, 600, steps=4); s = st(); ok(s[0] > 0.8 and abs(s[1]) < 0.1, 'thumb moved right: turn right', str(s))
    m.move(120, 520, steps=4); s = st(); ok(s[1] > 0.8 and abs(s[0]) < 0.1, 'thumb moved up: climb', str(s))
    m.move(120, 680, steps=4); s = st(); ok(s[1] < -0.8, 'thumb moved down: dive', str(s))
    m.up(); s = st(); ok(s == [0, 0], 'let go: level out', str(s))
    y0 = pg.evaluate("__sim.G.f.yaw"); m.move(300, 300); m.down(); m.move(380, 300, steps=4); pg.wait_for_timeout(1500); y1 = pg.evaluate("__sim.G.f.yaw"); m.up()
    ok(y1 > y0, 'holding right really turns the flier right', f'{y0} {y1}')
    pg.screenshot(path='/tmp/so_touch.png'); ok(not errs, 'no JavaScript errors', str(errs[:3]))
    b.close()
print(f'\n{oks} checks passed, {len(fails)} failed.')
sys.exit(1 if fails else 0)
