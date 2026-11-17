#!/usr/bin/env python3
"""Lighthouse with real touches on a phone-sized screen: a touch on the sea sends the light there; sliding the thumb moves it
(at the lamp's own pace); held near the side of the screen, the view turns that way and the light keeps going; the light held
on a boat makes it see you; slid slowly, the boat follows. No JavaScript errors.
Run: python3 games/lighthouse/test_touch.py"""
import os, sys, math, time
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
    cdp = ctx.new_cdp_session(pg)
    def touch(kind, pts): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, x, y in pts]})
    pg.evaluate("localStorage.setItem('lh.taught', '3'); __sim.go(4); __sim.G.lesson = null; __sim.G.next = 999; __sim.G.cfg.boats = 99; __sim.G.cfg.maxAt = 1; __sim.G.boats.length = 0;"); pg.wait_for_timeout(2700)
    T = lambda: pg.evaluate('[__sim.G.T.x, __sim.G.T.y]'); S = lambda: pg.evaluate('[__sim.G.S.x, __sim.G.S.y]')
    want = pg.evaluate('__sim.seaAt(195, 500)')
    touch('touchStart', [(1, 195, 500)]); t = T(); ok(abs(t[0] - want['x']) < 12 and abs(t[1] - want['y']) < 12, 'a touch on the sea aims the light at that spot', f'{t} vs {want}')
    for j in range(1, 11): touch('touchMove', [(1, 195 + j * 8, 500)]); time.sleep(0.03)
    t2 = T(); ok(t2[0] > t[0] + 5, 'sliding the thumb right moves the light right', f'{t} -> {t2}')
    a0 = pg.evaluate('__sim.V3.cam.a'); touch('touchMove', [(1, 385, 480)]); pg.wait_for_timeout(3000); a1 = pg.evaluate('__sim.V3.cam.a')
    ok(a1 > a0 + 0.1, 'held near the right edge, the view turns right with the beam', f'{a0:.2f} -> {a1:.2f}')
    touch('touchEnd', [])
    # a boat: the light on it until it sees you, then a slow slide and it follows
    pg.evaluate("(() => { const G = __sim.G; G.boats.length = 0; const b = __sim.newBoat(); b.x = 0; b.y = 120; b.h = Math.PI; b.v = 0; G.cfg.drift = 0; G.S = { x: 0, y: 160 }; G.T = { x: 0, y: 160 }; __sim.V3.cam.a = 0; })()"); pg.wait_for_timeout(2700)
    pt = pg.evaluate('__sim.seaScreen(0, 120)'); touch('touchStart', [(1, pt['x'], pt['y'])]); pg.wait_for_timeout(300); pg.evaluate('__sim.adv(2.5)')
    ok(pg.evaluate("__sim.G.boats[0].mode") == 'follow', 'the light held on a boat: she sees you and follows', pg.evaluate("__sim.G.boats[0].mode"))
    y0 = pg.evaluate('__sim.G.boats[0].y')
    for j in range(1, 13): touch('touchMove', [(1, pt['x'], pt['y'] + j * 6)]); pg.evaluate('__sim.adv(0.5)')
    touch('touchEnd', [])
    y1 = pg.evaluate('__sim.G.boats[0].y'); ok(y1 < y0 - 8 and pg.evaluate("__sim.G.boats[0].mode") == 'follow', 'slid slowly towards the shore, she follows the light in', f'{y0:.0f} -> {y1:.0f}, {pg.evaluate("__sim.G.boats[0].mode")}')
    pg.wait_for_timeout(300); pg.screenshot(path='/tmp/lh_touch.png'); ok(not errs, 'no JavaScript errors', str(errs[:3]))
    b.close()
print(f'\n{oks} checks passed, {len(fails)} failed.')
sys.exit(1 if fails else 0)
