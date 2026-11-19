#!/usr/bin/env python3
"""Spellshop with real touches: tap a jar (it is picked), BREW; hold to pour and let go (an amount); drag round the cauldron
(stirred, the right way round); tap a rune and trace its dots; tap SEAL (the customer is served). No JavaScript errors.
Run: python3 games/spell/test_touch.py"""
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
    pg.goto('file://' + os.path.join(here, 'index.html')); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(600)
    pg.evaluate("localStorage.setItem('sp.taught', '3'); __sim.go(3);"); pg.wait_for_timeout(400)
    L = pg.evaluate("__sim.lay()"); need = pg.evaluate("__sim.G.cur.need[0]"); J = [j for j in L['jars'] if j['id'] == need][0]
    pg.touchscreen.tap(J['x'] + J['w'] / 2, J['y'] + J['h'] / 2); pg.wait_for_timeout(150); ok(pg.evaluate("__sim.G.pick.length") == 1, 'tapping a jar picks it')
    a = L['act']; pg.touchscreen.tap(a['x'] + a['w'] / 2, a['y'] + a['h'] / 2); pg.wait_for_timeout(200); ok(pg.evaluate("__sim.G.phase") == 'pour', 'BREW goes on to pouring')
    pg.mouse.move(195, 700); pg.mouse.down(); pg.wait_for_timeout(900); pg.mouse.up(); pg.wait_for_timeout(200)
    ok(pg.evaluate("__sim.G.phase") == 'stir' and pg.evaluate("__sim.G.amount") > 0.4, 'hold to pour, let go: an amount', str(pg.evaluate("[__sim.G.phase, __sim.G.amount]")))
    C = L['C']; pg.mouse.move(C['x'] + C['r'] * 0.8, C['y']); pg.mouse.down()
    for i in range(1, 60): t = i / 59 * math.pi * 4.6; pg.mouse.move(C['x'] + math.cos(t) * C['r'] * 0.8, C['y'] + math.sin(t) * C['r'] * 0.25); pg.wait_for_timeout(16)
    pg.mouse.up(); pg.wait_for_timeout(150); ok(pg.evaluate("__sim.G.phase") == 'rune' and pg.evaluate("__sim.G.stirDir") == 1, 'dragging clockwise round the cauldron stirs it IN', str(pg.evaluate("[__sim.G.phase, __sim.G.stirDir]")))
    L = pg.evaluate("__sim.lay()"); R = L['runes'][0]; pg.touchscreen.tap(R['x'] + R['w'] / 2, R['y'] + R['h'] / 2); pg.wait_for_timeout(150)
    pts = pg.evaluate(f"RUNES ? 0 : 0") if False else pg.evaluate("(() => { const L = __sim.lay(), C = L.C; return [[0, 0.35], [-0.42, -0.1], [-0.2, -0.38], [0, -0.15], [0.2, -0.38], [0.42, -0.1], [0, 0.35]].map(([x, y]) => [C.x + x * C.r * 1.6, C.y - C.r * 0.8 + y * C.r * 1.6]); })()")
    pg.mouse.move(*pts[0]); pg.mouse.down()
    for i in range(len(pts) - 1):
        for k in range(1, 9): pg.mouse.move(pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k / 8, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k / 8); pg.wait_for_timeout(10)
    pg.mouse.up(); pg.wait_for_timeout(150); ok(pg.evaluate("__sim.G.phase") == 'seal' and pg.evaluate("__sim.G.runeId") == 'heart', 'tap a rune and trace its dots', str(pg.evaluate("[__sim.G.phase, __sim.G.runeId]")))
    a = L['act']; pg.touchscreen.tap(a['x'] + a['w'] / 2, a['y'] + a['h'] / 2); pg.wait_for_timeout(200); ok(pg.evaluate("__sim.G.done.length") == 1, 'SEAL serves the customer')
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
