#!/usr/bin/env python3
"""Pilot with real touches and real drawing: the right thumb is the column (pulled down the screen it raises the nose; left and
right it banks); the left thumb slides the throttle; both at once. No JavaScript errors. Run: python3 games/pilot/test_touch.py"""
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
    pg.evaluate("localStorage.setItem('av.taught', '3'); __sim.go(4); __sim.G.lesson = null;"); pg.wait_for_timeout(300)
    cdp = ctx.new_cdp_session(pg)
    def touch(kind, pts): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, x, y in pts]})
    t0 = pg.evaluate("__sim.G.thr")
    touch('touchStart', [(1, 60, 600), (2, 280, 500)])
    for j in range(1, 5): touch('touchMove', [(1, 60, 600 - 30 * j), (2, 280 + 12 * j, 500 + 15 * j)])
    r = pg.evaluate("[__sim.G.thr, __sim.G.st.x, __sim.G.st.y]")
    ok(r[0] > t0 + 0.2, 'left thumb slid up: more power', f'{t0} {r[0]}'); ok(r[1] > 0.6, 'right thumb moved right: bank right', str(r)); ok(r[2] > 0.8, 'right thumb pulled down: nose up', str(r))
    th0 = pg.evaluate("__sim.G.ac.th"); pg.wait_for_timeout(1500); th1 = pg.evaluate("__sim.G.ac.th"); ok(th1 > th0, 'holding it back really raises the nose', f'{th0} {th1}')
    touch('touchEnd', []); r = pg.evaluate("[__sim.G.st.x, __sim.G.st.y]"); ok(r == [0, 0], 'let go: the column centres', str(r))
    pg.wait_for_timeout(400); pg.screenshot(path='/tmp/pl_touch.png'); ok(not errs, 'no JavaScript errors', str(errs[:3]))
    b.close()
print(f'\n{oks} checks passed, {len(fails)} failed.')
sys.exit(1 if fails else 0)
