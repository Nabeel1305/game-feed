#!/usr/bin/env python3
"""Mow It with real touches: a thumb put down and slid right drives the mower right (and cuts grass); slid up drives it up;
lifting the thumb stops it; DONE appears once enough is cut and a tap on it finishes the lawn; driving onto a flower bed
mows the flowers (counted). No errors.
Run: python3 games/mow/test_touch.py"""
import os, sys, math
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
    E = pg.evaluate
    E("localStorage.setItem('mo.taught', '3'); __sim.go(1); (() => { const G = __sim.G; G.obst = G.obst.filter(b => b.kind === 'bin'); G.dog = null; G.m.x = 2; G.m.y = G.H / 2; G.m.h = 0; })();"); pg.wait_for_timeout(300)
    cdp = ctx.new_cdp_session(pg)
    def touch(kind, x, y): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [] if kind == 'touchEnd' else [{'x': x, 'y': y, 'id': 1}]})
    def slide(dx, dy, hold):
        touch('touchStart', 200, 600); pg.wait_for_timeout(30)
        for i in range(1, 7): touch('touchMove', 200 + dx * i / 6, 600 + dy * i / 6); pg.wait_for_timeout(16)
        pg.wait_for_timeout(hold)
    x0, s0 = E("[__sim.G.m.x, __sim.share()]"); slide(60, 0, 900); x1, h1, s1 = E("[__sim.G.m.x, __sim.G.m.h, __sim.share()]")
    ok(x1 > x0 + 1.5 and abs(math.sin(h1)) < 0.3, 'slid right: the mower drives right', str([x0, x1, h1])); ok(s1 > s0, 'and it cuts grass', str([s0, s1]))
    touch('touchEnd', 0, 0); pg.wait_for_timeout(600); ok(E("__sim.G.m.v") < 0.2, 'thumb lifted: it stops', str(E("__sim.G.m.v")))
    y0 = E("__sim.G.m.y"); slide(0, -60, 900); y1 = E("__sim.G.m.y"); touch('touchEnd', 0, 0); ok(y1 < y0 - 1.0, 'slid up: it drives up', str([y0, y1]))
    # a flower bed right ahead
    E("(() => { const G = __sim.G; G.m.x = 2; G.m.y = G.H / 2; G.m.h = 0; G.m.v = 0; G.obst.push({ kind: 'bed', x: 4.2, y: G.H / 2, w: 1.6, h: 1.4, hue: 300, crushed: false }); })()")
    slide(60, 0, 1200); touch('touchEnd', 0, 0); ok(E("__sim.G.crushed") == 1, 'driving onto a flower bed mows the flowers', str(E("__sim.G.crushed")))
    # enough cut: DONE
    E("(() => { const G = __sim.G; for (let k = 0; k < G.cut.length; k++) if (G.lawn[k] && !G.cut[k] && Math.random() < 0.97) { G.cut[k] = 1; G.done++; } })()"); pg.wait_for_timeout(200)
    r = E("__sim.doneRect()"); pg.touchscreen.tap(r['x'] + r['w'] / 2, r['y'] + r['h'] / 2); pg.wait_for_timeout(1500)
    ok(E("__sim.G.over") == 'won', 'DONE once enough is cut: the lawn is finished', str(E("[__sim.G.over, __sim.share()]")))
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
