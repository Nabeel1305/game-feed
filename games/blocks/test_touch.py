#!/usr/bin/env python3
"""Block Party with real touches: a finger put on a piece in the tray and dragged to the grid puts it down where its shadow
showed (the piece rides above the finger); a drop where it does not fit sends it back to the tray, free; a drop that fills a
row clears it and scores. The bomb (once bought) clears a 3x3 square where the grid is tapped. No errors.
Run: python3 games/blocks/test_touch.py"""
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
    pg.evaluate("localStorage.setItem('bp.taught', '3'); __sim.go(1);"); pg.wait_for_timeout(600)
    def drag(ti, r, c, steps=8):
        a = pg.evaluate(f"(() => {{ const L = __sim.lay(); return [L.slot({ti}), (L.ty + L.py) / 2]; }})()")
        e = pg.evaluate(f"(() => {{ const L = __sim.lay(), p = __sim.G.tray[{ti}], w = 1 + Math.max(...p.cells.map(q => q[1])), h = 1 + Math.max(...p.cells.map(q => q[0])); return [L.bx + {c} * L.cs + w * L.cs / 2, L.by + {r} * L.cs + L.cs * 2.1 + h * L.cs / 2]; }})()")
        pg.mouse.move(*a); pg.mouse.down(); pg.mouse.move((a[0] + e[0]) / 2, (a[1] + e[1]) / 2, steps=steps); pg.mouse.move(*e, steps=steps); pg.mouse.up(); pg.wait_for_timeout(250)
    # 1: a piece dragged to an empty spot lands there
    spot = pg.evaluate("(() => { const G = __sim.G; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (__sim.fits(G.tray[0], r, c)) return [r, c]; })()")
    want = pg.evaluate("__sim.G.tray[0].cells"); n0 = pg.evaluate("__sim.G.placed"); drag(0, *spot)
    ok(pg.evaluate("__sim.G.placed") == n0 + 1 and pg.evaluate("!__sim.G.tray[0]"), 'a piece dragged onto the grid lands where its shadow was', str(pg.evaluate("[__sim.G.placed, !!__sim.G.tray[0]]")))
    cells = pg.evaluate(f"(() => {{ const G = __sim.G; return G.b.map((x, i) => x ? i : -1).filter(i => i >= 0); }})()")
    ok(all((spot[0] + q[0]) * 8 + spot[1] + q[1] in cells for q in want), 'the piece is where the finger put it', str([spot, want, cells[:6]]))
    # 2: a drop on top of other blocks goes back to the tray, free
    ti = pg.evaluate("__sim.G.tray.findIndex(Boolean)"); n1 = pg.evaluate("__sim.G.placed"); sc = pg.evaluate("__sim.G.score")
    drag(ti, spot[0], spot[1]); pg.wait_for_timeout(300)
    ok(pg.evaluate("__sim.G.placed") == n1 and pg.evaluate(f"!!__sim.G.tray[{ti}]") and pg.evaluate("__sim.G.score") == sc, 'a drop where it does not fit goes back to the tray and costs nothing', str(pg.evaluate("[__sim.G.placed, __sim.G.score]")))
    # 3: filling a row clears it
    pg.evaluate("(() => { const G = __sim.G; G.b.fill(null); G.gem.fill(false); for (let c = 0; c < 7; c++) G.b[7 * 8 + c] = { col: 2 }; G.tray[0] = { cells: [[0, 0]], col: 4, id: 1 }; })()")
    sc = pg.evaluate("__sim.G.score"); drag(0, 7, 7)
    ok(pg.evaluate("__sim.G.lines") >= 1 and pg.evaluate("__sim.G.b.filter(Boolean).length") == 0 and pg.evaluate("__sim.G.score") > sc + 10, 'a drop that fills a row clears it and scores', str(pg.evaluate("[__sim.G.lines, __sim.G.score]")))
    # 4: the bomb, once bought: tap it, then a cell
    pg.evaluate("localStorage.setItem('bp.ups', JSON.stringify({ bomb: 1 })); localStorage.setItem('bp.taught', '3'); __sim.go(4);"); pg.wait_for_timeout(500)
    pg.evaluate("(() => { const G = __sim.G; for (let i = 0; i < 64; i++) G.b[i] = (i % 3) ? { col: 1 } : null; G.gem.fill(false); })()")
    bt = pg.evaluate("(() => { const L = __sim.lay(); const b = __sim.G; return null; })()")
    pw = pg.evaluate("(() => { const L = __sim.lay(); return [L.slot(1), L.py + 4 * L.s + 15 * L.s]; })()")
    pg.touchscreen.tap(*pw); pg.wait_for_timeout(150); armed = pg.evaluate("__sim.G.arm")
    c = pg.evaluate("(() => { const L = __sim.lay(); return [L.cx(4), L.cy(4)]; })()"); before = pg.evaluate("__sim.G.b.filter(Boolean).length")
    pg.touchscreen.tap(*c); pg.wait_for_timeout(300)
    ok(armed and pg.evaluate("__sim.G.bombs") == 0 and pg.evaluate("__sim.G.b.filter(Boolean).length") < before, 'the bomb: tap it, tap the grid, the square around clears', str([armed, pg.evaluate("__sim.G.bombs"), before, pg.evaluate("__sim.G.b.filter(Boolean).length")]))
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
