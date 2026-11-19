#!/usr/bin/env python3
"""Sugar Swap with real touches: a finger put on a sweet and slid towards a neighbour swaps them (a line pops, a move is used);
tapping one sweet and then the one beside it does the same; a swipe that makes no line swaps back for free. No errors.
Run: python3 games/sweets/test_touch.py"""
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
    pg.goto('file://' + os.path.join(here, 'index.html')); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(800)
    pg.evaluate("localStorage.setItem('ss.taught', '3'); __sim.go(1);"); pg.wait_for_timeout(1500)
    def xy(i): return pg.evaluate(f"(() => {{ const L = __sim.lay(); return [L.cx({i} % 8), L.cy(Math.floor({i} / 8))]; }})()")
    m = pg.evaluate("__sim.moves()[0]"); a, c = xy(m[0]), xy(m[1]); m0 = pg.evaluate("__sim.G.moves")
    pg.mouse.move(*a); pg.mouse.down(); pg.mouse.move((a[0] + c[0]) / 2, (a[1] + c[1]) / 2, steps=4); pg.mouse.move(*c, steps=3); pg.mouse.up(); pg.wait_for_timeout(300); pg.wait_for_function("__sim.G.phase === 'idle'", timeout=15000)
    ok(pg.evaluate("__sim.G.moves") == m0 - 1, 'a swipe that makes a line uses a move', str([m0, pg.evaluate("__sim.G.moves")]))
    pg.wait_for_function("__sim.G.phase === 'idle'", timeout=15000); m = pg.evaluate("__sim.moves()[0]"); a, c = xy(m[0]), xy(m[1]); m1 = pg.evaluate("__sim.G.moves")
    pg.touchscreen.tap(*a); pg.wait_for_timeout(120); pg.touchscreen.tap(*c); pg.wait_for_timeout(300); pg.wait_for_function("__sim.G.phase === 'idle'", timeout=15000)
    ok(pg.evaluate("__sim.G.moves") == m1 - 1, 'tap one sweet, then its neighbour: they swap', str([m1, pg.evaluate("__sim.G.moves")]))
    # a swipe that makes nothing: find a pair that is not a move
    bad = pg.evaluate("(() => { const ms = __sim.moves().map(x => x.join()); for (let i = 0; i < 71; i++) { if (i % 8 === 7) continue; const G = __sim.G; if (!G.b[i].k || !G.b[i + 1].k || G.b[i].k.sp || G.b[i + 1].k.sp) continue; if (!ms.includes(i + ',' + (i + 1))) return [i, i + 1]; } return null; })()")
    m2 = pg.evaluate("__sim.G.moves"); a, c = xy(bad[0]), xy(bad[1]); pg.mouse.move(*a); pg.mouse.down(); pg.mouse.move(*c, steps=5); pg.mouse.up(); pg.wait_for_timeout(600)
    ok(pg.evaluate("__sim.G.moves") == m2 and pg.evaluate("__sim.G.fumble") == 1, 'a swipe that makes no line swaps back and costs nothing the first time', str([m2, pg.evaluate("[__sim.G.moves, __sim.G.fumble]")]))
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
