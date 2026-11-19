#!/usr/bin/env python3
"""Black Keys with real touches: a tap on START starts the song; taps on black tiles play them; a finger held on a long tile
holds it and lifting lets go; a tap on white ends it. No JavaScript errors. Run: python3 games/keys/test_touch.py"""
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
    pg.evaluate("localStorage.setItem('bk.taught', '3'); __sim.go(2);"); pg.wait_for_timeout(400)
    def spot(k, j=0):      # where row k's tile j is on screen right now
        return pg.evaluate(f"(() => {{ const G = __sim.G, r = G.rows[{k}], L = __sim.lay(); return [(r.lanes[{j}] + 0.5) * L.lw, innerHeight - (r.i + 0.5 - G.pos) * L.rh]; }})()")
    pg.touchscreen.tap(*spot(0)); pg.wait_for_timeout(60)
    ok(pg.evaluate("__sim.G.go"), 'a tap on START starts the song')
    for k in (1, 2, 3):
        pg.touchscreen.tap(*spot(k)); pg.wait_for_timeout(40)
    ok(pg.evaluate("__sim.G.tiles") == 3 and not pg.evaluate("__sim.G.miss"), 'taps on the black tiles play them', str(pg.evaluate("[__sim.G.tiles, __sim.G.miss]")))
    # a long tile: make row 4 one, then hold it
    pg.evaluate("(() => { const r = __sim.G.rows[4]; r.kind = 'long'; })()")
    x, y = spot(4); pg.mouse.move(x, y); pg.mouse.down(); pg.wait_for_timeout(120)
    ok(pg.evaluate("__sim.G.rows[4].held"), 'a finger on a long tile holds it')
    pg.mouse.up(); pg.wait_for_timeout(60); ok(not pg.evaluate("__sim.G.rows[4].held"), 'lifting the finger lets it go (and is no failure)', str(pg.evaluate("__sim.G.miss")))
    # a tap on white
    r = pg.evaluate("(() => { const G = __sim.G; for (let k = 1; k < 30; k++) { const r = G.rows[k]; if (r.i - G.pos < 0.3 || r.i - G.pos > 3.3) continue; const w = [0,1,2,3].find(l => !r.lanes.includes(l)); return [k, w]; } })()")
    wx, wy = spot(r[0]); L = pg.evaluate("__sim.lay().lw"); pg.touchscreen.tap((r[1] + 0.5) * L, wy); pg.wait_for_timeout(80)
    ok(pg.evaluate("!!__sim.G.miss && !__sim.G.miss.missed"), 'a tap on white ends it', str(pg.evaluate("__sim.G.miss")))
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
