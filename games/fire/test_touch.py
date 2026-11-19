#!/usr/bin/env python3
"""Fire Crew with real touches: holding a thumb sprays (the water aimed just above the thumb, on the window there), sliding
moves the aim, lifting stops; a tap on a person whose window is clear sends the ladder. No JavaScript errors.
Run: python3 games/fire/test_touch.py"""
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
    pg.evaluate("localStorage.setItem('fc.taught', '3'); __sim.go(1); for (const w of __sim.G.w) w.p = null;"); pg.wait_for_timeout(600)
    # the screen point 60 px (x k) below window (1, 1), so the water lands on it
    pt = pg.evaluate("(() => { const s = __sim.wScreen(__sim.wx(1), __sim.wy(1), 0); return [s.x, s.y + 60 * Math.min(innerWidth, innerHeight * 0.62) / 390]; })()")
    pg.mouse.move(*pt); pg.mouse.down(); pg.wait_for_timeout(250)
    a = pg.evaluate("[__sim.G.on, __sim.G.aim.x, __sim.G.aim.y]")
    ok(a[0] and abs(a[1] - 1) < 0.35 and abs(a[2] - 1) < 0.35, 'holding sprays, aimed at the window just above the thumb', str(a))
    pt2 = pg.evaluate("(() => { const s = __sim.wScreen(__sim.wx(2), __sim.wy(1), 0); return [s.x, s.y + 60 * Math.min(innerWidth, innerHeight * 0.62) / 390]; })()")
    pg.mouse.move(*pt2, steps=4); pg.wait_for_timeout(150); ok(abs(pg.evaluate("__sim.G.aim.x") - 2) < 0.35, 'sliding moves the aim')
    pg.mouse.up(); pg.wait_for_timeout(100); ok(not pg.evaluate("__sim.G.on"), 'lifting stops the water')
    pg.evaluate("(() => { const w = __sim.G.w.find(q => q.c === 2 && q.r === 2); w.f = 0; w.p = { s: 0, st: 'in', id: 0 }; })()")
    pp = pg.evaluate("(() => { const s = __sim.wScreen(__sim.wx(2), __sim.wy(2), 0); return [s.x, s.y]; })()")
    pg.touchscreen.tap(*pp); pg.wait_for_timeout(100)
    ok(pg.evaluate("!!__sim.G.lad && !__sim.G.on"), 'a tap on a person sends the ladder (and does not spray)')
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
