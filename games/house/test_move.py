#!/usr/bin/env python3
"""His review of Homemaker (26 Nov 2026): move a wall with the arrow cross, turn it, keep it or put it back; turn the camera by dragging off the plot;
with MOVE a tap picks a wall and a drag only turns the camera (nothing is built by a drag). Real touches for the last two."""
import os
from playwright.sync_api import sync_playwright
here = os.path.dirname(os.path.abspath(__file__)); fails = []; oks = 0
def ok(c, what, d=''):
    global oks
    if c: oks += 1
    else: fails.append(what); print('  FAIL', what, d)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844}, has_touch=True); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + os.path.join(here, 'index.html')); pg.wait_for_function('typeof window.gameFeedStart === "function"')
    r = pg.evaluate("""() => { const S = __sim; S.start(4, { seed: 5 }); const G = S.G; G.lesson = null; S.setTool('wall'); for (let i = 0; i < 3; i++) S.tapAt(1.5 + i, 2.02);
      const before = Object.keys(G.E).sort().join(' '); S.setTool('move'); S.tapAt(2.5, 2.02); const n = G.sel ? G.sel.keys.length : 0;
      const m1 = S.moveSel(0, 1); const after1 = Object.keys(G.E).sort().join(' '); const t = S.rotateSel(); const o = G.sel.keys.every(k => k[0] === 'v');
      S.cancelSel(); const back = Object.keys(G.E).sort().join(' '); S.tapAt(2.5, 2.02); S.moveSel(0, 1); S.confirmSel(); const kept = Object.keys(G.E).sort().join(' ');
      return { before, n, m1, after1, t, o, back, kept, sel: !!G.sel }; }""")
    print(r)
    ok(r['n'] == 3, 'a tap with MOVE picks the whole straight wall', r['n'])
    ok(r['m1'] and r['after1'] == 'h:1:3 h:2:3 h:3:3', 'an arrow moves it one square', r['after1'])
    ok(r['t'] and r['o'], 'the turn button turns it a quarter', r)
    ok(r['back'] == r['before'], 'X puts it back as it was', r['back'])
    ok(r['kept'] == 'h:1:3 h:2:3 h:3:3' and not r['sel'], 'KEEP keeps it and lets go', r['kept'])
    # real touches: a drag off the plot turns the camera; with MOVE a drag on the plot turns the camera and builds nothing
    pg.evaluate("__sim.go(4)"); pg.wait_for_timeout(2500)
    pg.evaluate("(() => { const G = __sim.G; if (G.lesson) { G.lesson = null; } })()")
    def drag(x0, y0, x1, y1):
        pg.mouse.move(x0, y0); pg.mouse.down()
        for i in range(1, 11): pg.mouse.move(x0 + (x1 - x0) * i / 10, y0 + (y1 - y0) * i / 10); pg.wait_for_timeout(16)
        pg.mouse.up(); pg.wait_for_timeout(200)
    a0 = pg.evaluate("__sim.viewA"); drag(30, 140, 330, 140); a1 = pg.evaluate("__sim.viewA")
    ok(abs(a1 - a0) > 0.3, 'a drag off the plot turns the camera', (a0, a1))
    pg.evaluate("__sim.setTool('move')"); n0 = pg.evaluate("Object.keys(__sim.G.E).length + Object.keys(__sim.G.C).length")
    drag(150, 420, 260, 470); n1 = pg.evaluate("Object.keys(__sim.G.E).length + Object.keys(__sim.G.C).length"); a2 = pg.evaluate("__sim.viewA")
    ok(n1 == n0 and abs(a2 - a1) > 0.1, 'with MOVE a drag on the plot turns the camera and builds nothing', (n0, n1, a1, a2))
    ok(not errs, 'no errors', errs[:2]); b.close()
print(f'{oks} passed, {len(fails)} failed'); raise SystemExit(1 if fails else 0)
