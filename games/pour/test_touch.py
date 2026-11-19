#!/usr/bin/env python3
"""Pour with real touches: a tap on a glass picks it up, a tap on another pours into it (a move used); a pour that cannot
happen wobbles back and is free the first time; UNDO takes the pour back. No JavaScript errors.
Run: python3 games/pour/test_touch.py"""
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
    pg.evaluate("localStorage.setItem('po.taught', '3'); __sim.go(2);"); pg.wait_for_timeout(400)
    at = lambda i: pg.evaluate(f"(() => {{ const L = __sim.lay(), p = L.pos({i}); return [p.x + L.tw / 2, p.y + L.th * 0.6]; }})()")
    n = pg.evaluate("__sim.G.T.length"); empty = n - 1
    pg.touchscreen.tap(*at(0)); pg.wait_for_timeout(80); ok(pg.evaluate("__sim.G.sel") == 0, 'a tap on a glass picks it up')
    m0 = pg.evaluate("__sim.G.moves"); pg.touchscreen.tap(*at(empty)); pg.wait_for_timeout(900)
    ok(pg.evaluate("__sim.G.moves") == m0 - 1 and pg.evaluate(f"__sim.G.T[{empty}].length") > 0, 'a tap on another pours into it', str(pg.evaluate("[__sim.G.moves, __sim.G.T]")))
    bad = pg.evaluate("(() => { const G = __sim.G; for (let a = 0; a < G.T.length; a++) for (let b = 0; b < G.T.length; b++) { if (a === b || !G.T[a].length || !G.T[b].length) continue; if (G.T[b].length < 4 && G.T[a][G.T[a].length - 1] !== G.T[b][G.T[b].length - 1]) return [a, b]; } return null; })()")
    m1 = pg.evaluate("__sim.G.moves"); pg.touchscreen.tap(*at(bad[0])); pg.wait_for_timeout(60); pg.touchscreen.tap(*at(bad[1])); pg.wait_for_timeout(300)
    ok(pg.evaluate("__sim.G.moves") == m1 and pg.evaluate("__sim.G.fumble") == 1, 'a pour that cannot happen wobbles back, free the first time', str(pg.evaluate("[__sim.G.moves, __sim.G.fumble]")))
    u = pg.evaluate("(() => { const L = __sim.lay(); return [L.undo.x + L.undo.w / 2, L.undo.y + L.undo.h / 2]; })()"); pg.touchscreen.tap(*u); pg.wait_for_timeout(200)
    ok(pg.evaluate(f"__sim.G.T[{empty}].length") == 0, 'UNDO takes the pour back', str(pg.evaluate("__sim.G.T")))
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
