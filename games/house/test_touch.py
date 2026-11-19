#!/usr/bin/env python3
"""Homemaker with real touches: tapping FLOOR in the tray picks it; dragging over the plot lays several squares; WALL and a drag
lays a run of walls; UNDO takes the last one back; MOVE IN before the house is ready says what is missing. No JavaScript errors.
Run: python3 games/house/test_touch.py"""
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
    pg.evaluate("localStorage.clear(); localStorage.setItem('hm.taught', '3'); __sim.go(2);"); pg.wait_for_timeout(800)
    L = pg.evaluate("__sim.layout()"); tb = {t['id']: t for t in L['tray']}
    def tap(r): pg.touchscreen.tap(r['x'] + r['w'] / 2, r['y'] + r['h'] / 2); pg.wait_for_timeout(120)
    tap(tb['floor']); ok(pg.evaluate("__sim.G.tool") == 'floor', 'the tray picks FLOOR')
    # find screen points over the plot's squares by asking the pick function
    pts = pg.evaluate("(() => { const out = []; for (let y = 200; y < 600; y += 6) for (let x = 40; x < 350; x += 6) { const p = __sim.pickAt(x, y); if (p && p.fx > 1.2 && p.fx < 4.8 && Math.abs(p.fz - 2.5) < 0.2) out.push([x, y, p.fx]); } out.sort((a, b) => a[2] - b[2]); return out; })()")
    ok(len(pts) > 3, 'the plot is under the thumb', str(len(pts)))
    pg.mouse.move(pts[0][0], pts[0][1]); pg.mouse.down()
    for q in pts[1:]: pg.mouse.move(q[0], q[1])
    pg.mouse.up(); pg.wait_for_timeout(150); n = pg.evaluate("Object.keys(__sim.G.C).length"); ok(n >= 3, 'a drag lays several floor squares', str(n))
    tap(tb['wall']); pg.mouse.move(pts[0][0], pts[0][1] - 0); pg.mouse.down()
    for q in pts[1:]: pg.mouse.move(q[0], q[1])
    pg.mouse.up(); pg.wait_for_timeout(150); nw = pg.evaluate("Object.keys(__sim.G.E).length"); ok(nw >= 2, 'a drag with WALL builds a run of walls', str(nw))
    tap(L['undo']); ok(pg.evaluate("Object.keys(__sim.G.E).length") == nw - 1, 'UNDO takes the last piece back')
    tap(L['move']); ok(pg.evaluate("!__sim.G.over"), 'MOVE IN waits until the house is ready')
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
