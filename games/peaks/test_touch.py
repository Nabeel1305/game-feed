#!/usr/bin/env python3
"""Tri-Peaks with real touches: tapping a card that fits plays it (onto the pile); tapping one that does not fit does
nothing; tapping the stock draws a card. No JavaScript errors.
Run: python3 games/peaks/test_touch.py"""
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
    pg.goto('file://' + os.path.join(here, 'index.html')); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(600)
    pg.evaluate("localStorage.setItem('tp.taught', '3'); __sim.go(3);"); pg.wait_for_timeout(400)
    L = pg.evaluate("__sim.lay()"); S = L['stock']
    for _ in range(40):
        if pg.evaluate("__sim.moves().length"): break
        pg.touchscreen.tap(S['x'] + S['w'] / 2, S['y'] + S['h'] / 2); pg.wait_for_timeout(60)
    i = pg.evaluate("__sim.moves()[0]"); pos = pg.evaluate(f"(() => {{ const t = __sim.G.tab[{i}], p = __sim.lay().pos(t.r, t.i); return [p.x, p.y]; }})()"); n0 = pg.evaluate("__sim.G.cleared")
    pg.touchscreen.tap(*pos); pg.wait_for_timeout(150); ok(pg.evaluate("__sim.G.cleared") == n0 + 1, 'tapping a card that fits plays it')
    bad = pg.evaluate("(() => { const G = __sim.G, m = __sim.moves(); return G.tab.findIndex((t, k) => !t.gone && (t.r === 3) && !m.includes(k)); })()")
    if bad >= 0:
        pos = pg.evaluate(f"(() => {{ const t = __sim.G.tab[{bad}], p = __sim.lay().pos(t.r, t.i); return [p.x, p.y]; }})()"); n1 = pg.evaluate("__sim.G.cleared"); pg.touchscreen.tap(*pos); pg.wait_for_timeout(150); ok(pg.evaluate("__sim.G.cleared") == n1, 'a card that does not fit stays')
    s0 = pg.evaluate("__sim.G.stock.length"); pg.touchscreen.tap(S['x'] + S['w'] / 2, S['y'] + S['h'] / 2); pg.wait_for_timeout(150); ok(pg.evaluate("__sim.G.stock.length") < s0 or pg.evaluate("__sim.G.gift"), 'tapping the stock draws')
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
