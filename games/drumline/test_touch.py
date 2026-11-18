#!/usr/bin/env python3
"""Drumline with real touches: a touch on the left half strikes the left drum, the right half the right drum; a touch timed on
a note hits it; a touch with no note near is counted as a stray (it costs the crowd); two thumbs at once strike both drums.
No JavaScript errors.
Run: python3 games/drumline/test_touch.py"""
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
    pg.evaluate("localStorage.setItem('dl.taught', '3'); __sim.go(1);"); pg.wait_for_timeout(300)
    cdp = ctx.new_cdp_session(pg)
    def touch(kind, pts): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, (x, y) in pts]})
    def tap(*xs): touch('touchStart', [(i + 1, (x, 600)) for i, x in enumerate(xs)]); touch('touchEnd', [(i + 1, (x, 600)) for i, x in enumerate(xs)])
    s0 = pg.evaluate("__sim.G.strays"); tap(80); ok(pg.evaluate("__sim.G.strays") == s0 + 1, 'a tap with no note near is a stray')
    # wait until the first note is about to reach its drum, then tap that side
    n = pg.evaluate("(() => { const n = __sim.G.notes[0]; return [n.t, n.lane]; })()")
    pg.wait_for_function(f"__sim.G.t > {n[0]} - 0.02", polling=1)
    x = 80 if n[1] == 0 else 310; tap(x) if n[1] != 2 else tap(80, 310)
    r = pg.evaluate("[__sim.G.notes[0].done || __sim.G.notes[0].hit[0], __sim.G.perfects + __sim.G.goods + __sim.G.oks]"); ok(r[0] and r[1] >= 1, 'a tap on the note\'s side as it arrives hits it', str([n, r]))
    m0 = pg.evaluate("__sim.G.last.slice()"); tap(80, 310); m1 = pg.evaluate("__sim.G.last.slice()"); ok(m1[0] > m0[0] and m1[1] > m0[1], 'two thumbs strike both drums', str([m0, m1]))
    pg.wait_for_timeout(200); pg.screenshot(path='/tmp/dl_touch.png'); ok(not errs, 'no JavaScript errors', str(errs[:3]))
    b.close()
print(f'\n{oks} checks passed, {len(fails)} failed.')
sys.exit(1 if fails else 0)
