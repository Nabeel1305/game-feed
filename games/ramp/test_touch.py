#!/usr/bin/env python3
"""Ramp Riders with real touches: holding the left half leans back, the right half leans forward, both thumbs brake; letting
go lets go; in the air a held thumb turns the bike. No JavaScript errors.
Run: python3 games/ramp/test_touch.py"""
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
    pg.evaluate("localStorage.setItem('rr.taught', '3'); __sim.go(3);"); pg.wait_for_timeout(500)
    cdp = ctx.new_cdp_session(pg)
    def touch(kind, pts): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, (x, y) in enumerate(pts)]})
    touch('touchStart', [(80, 700)]); pg.wait_for_timeout(120); ok(pg.evaluate("__sim.G.hold.l && !__sim.G.hold.r"), 'holding the left half leans back')
    touch('touchEnd', []); pg.wait_for_timeout(120); ok(pg.evaluate("!__sim.G.hold.l"), 'letting go lets go')
    touch('touchStart', [(320, 700)]); pg.wait_for_timeout(120); ok(pg.evaluate("__sim.G.hold.r && !__sim.G.hold.l"), 'holding the right half leans forward'); touch('touchEnd', [])
    touch('touchStart', [(80, 700), (320, 700)]); pg.wait_for_timeout(120); ok(pg.evaluate("__sim.G.hold.l && __sim.G.hold.r"), 'two thumbs: both held (a brake)'); touch('touchEnd', []); pg.wait_for_timeout(100)
    # in the air a held thumb turns the bike
    pg.evaluate("(() => { const G = __sim.G; G.b.air = true; G.b.y += 30; G.b.vy = 0; G.b.w = 0; G.b.a = 0; })()")
    touch('touchStart', [(80, 700)]); pg.wait_for_timeout(250); a = pg.evaluate("__sim.G.b.a"); touch('touchEnd', [])
    ok(a > 0.3, 'in the air, holding left turns the nose up', str(a))
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
