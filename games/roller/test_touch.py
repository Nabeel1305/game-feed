#!/usr/bin/env python3
"""Paint It with a real thumb: dragging over the thing paints it under the thumb; a tap on a pot changes the colour and on
ROLLER / BRUSH changes the tool (and does not paint); painting off the edges counts as a spill. Then the rules, stepped
exactly: paint on the tape is no spill, paint on the glass is; DONE only shows once it is mostly covered, and it peels the
tape and judges it; a careful painter scores 97 or more; paint everywhere fails; Your colours picks a set. No errors.
Run: python3 games/roller/test_touch.py"""
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
    E = pg.evaluate; cdp = ctx.new_cdp_session(pg)
    def down(x, y): cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x, 'y': y, 'id': 1}]})
    def mv(x, y): cdp.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': [{'x': x, 'y': y, 'id': 1}]})
    def up(): cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []}); pg.wait_for_timeout(40)
    E("localStorage.setItem('pti.taught', '3'); __sim.go(1)"); pg.wait_for_timeout(500)
    # drag down the middle of the third plank (cells x 21-28) from y 60 to y 10
    a, bb = E("[__sim.cellScr(24.5, 60), __sim.cellScr(24.5, 10)]"); down(a['x'], a['y'])
    for i in range(1, 21): mv(a['x'], a['y'] + (bb['y'] - a['y']) * i / 20); pg.wait_for_timeout(30)
    up(); r = E("(() => { const G = __sim.G; let n = 0, m = 0; for (let y = 12; y < 58; y++) { const j = y * 60 + 24; if (G.grid[j] > 0) { m++; if (G.paint[j] === G.colour) n++; } } return [n, m, G.spill]; })()")
    ok(r[0] == r[1] and r[1] > 30 and r[2] == 0, 'dragging over a plank paints it under the thumb (and no spill)', str(r))
    pots = E("__sim.uiLayout().filter(b => b.pot != null).map(b => [b.x, b.y])"); c0 = E("__sim.G.colour")
    if len(pots) > 1:
        down(*pots[1]); up(); ok(E("__sim.G.colour") != c0 and E("__sim.G.colour") == E("__sim.G.colours[1]"), 'a tap on a pot changes the colour')
    br = E("__sim.uiLayout().find(b => b.tool === 'brush')"); n0 = E("__sim.G.right"); down(br['x'], br['y']); up()
    ok(E("__sim.G.tool") == 'brush' and E("__sim.G.right") == n0, 'a tap on BRUSH picks the brush, and paints nothing', str(E("[__sim.G.tool, __sim.G.right, " + str(n0) + "]")))
    a = E("__sim.cellScr(59, 80)"); down(a['x'] + 20, a['y'] - 30); mv(a['x'] + 40, a['y'] - 60); up(); ok(E("__sim.G.spill") > 0, 'painting off the edges is a spill', str(E("__sim.G.spill")))
    # ---------- the rules, stepped exactly ----------
    r = E("""(() => { const S = __sim; S.start(2, { seed: 3 }); const G = S.G; let tape = -1, glass = -1; for (let j = 0; j < G.grid.length; j++) { if (tape < 0 && G.grid[j] === -1) tape = j; if (glass < 0 && G.grid[j] === -2) glass = j; }
      S.press({ tool: 'brush' }); const x = tape % 60, y = (tape / 60) | 0; S.press({ x: x - 0.6, y: y - 0.6 }); S.lift(); const a = G.spill; const gx = glass % 60, gy = (glass / 60) | 0; S.press({ x: gx + 3, y: gy + 3 }); S.lift(); return [a, G.spill]; })()""")
    ok(r[0] == 0 and r[1] > 0, 'paint on the tape is no spill; paint on the glass is', str(r))
    r = E("""(() => { const S = __sim; S.start(1, { seed: 3 }); const G = S.G, n = () => S.uiLayout().some(b => b.done); const before = n(); const mem = {}; let i = 0; while (S.cover() < 0.9 && i++ < 20000) { S.honest(G, { react: .1, acc: 1 }, mem); S.step(1 / 60); } return [before, n(), +S.cover().toFixed(2)]; })()""")
    ok(r[0] is False and r[1] is True, 'DONE only shows once it is mostly covered', str(r))
    r = E("""(() => { const S = __sim; S.start(7, { seed: 5 }); const G = S.G, mem = {}; let i = 0, peel = 0; while (!G.over && i++ < 60 * 200) { S.honest(G, { react: .1, acc: 1 }, mem); for (const e of S.stepEv(1 / 60)) if (e.k === 'peel') peel++; } return [G.over, G.res.score, peel]; })()""")
    ok(r[0] == 'won' and r[1] >= 97 and r[2] == 1, 'a careful painter: DONE peels the tape, and it scores 97 or more', str(r))
    r = E("""(() => { const S = __sim; S.start(7, { seed: 5 }); const G = S.G; for (let y = -10; y < 95; y += 4) for (let x = -10; x < 70; x += 4) { S.press({ x, y }); S.lift(); } S.press({ done: true }); G.t = 149.9; for (let i = 0; i < 200; i++) S.step(1 / 60); return [G.over, G.res && G.res.score, G.res && G.res.pass]; })()""")
    ok(r[0] == 'lost', 'paint everywhere fails', str(r))
    E("__sim.live(); localStorage.setItem('pti.stars', JSON.stringify({1: 3, 2: 3})); __sim.showAqua()"); pg.wait_for_timeout(200)
    ok(E("document.querySelectorAll('#aqGrid .aq').length") == E("__sim.SKINS.length"), 'Your colours lists every set')
    E("document.querySelectorAll('#aqGrid .aq')[1].click()"); ok(E("__sim.mySkin().id") == E("__sim.SKINS[1].id"), 'tapping an open one picks it')
    E("localStorage.setItem('pti.stars', '{}'); __sim.showAqua(); document.querySelectorAll('#aqGrid .aq')[3].click()"); ok(E("__sim.store.get('skin')") == E("__sim.SKINS[1].id"), 'a locked one cannot be picked')
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
