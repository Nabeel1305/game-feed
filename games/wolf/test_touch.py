#!/usr/bin/env python3
"""Wolf Pack with real touches on a phone-sized screen: the thumb slid left or right steers, pushed up bursts, a quick flick
strikes; the FLANK buttons send a packmate up a side; lifted, it runs straight on. No JavaScript errors.
Run: python3 games/wolf/test_touch.py"""
import os, sys, time
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
    pg.evaluate("localStorage.setItem('wp.taught', '3'); __sim.go(4); __sim.G.lesson = null;"); pg.wait_for_timeout(300)
    I = lambda: pg.evaluate('[__sim.G.in.steer, __sim.G.in.burst]')
    touch('touchStart', [(1, 195, 600)]); time.sleep(0.05); touch('touchMove', [(1, 215, 600)]); time.sleep(0.1); touch('touchMove', [(1, 240, 600)]); pg.wait_for_timeout(60); ok(I()[0] < -0.8 and not I()[1], 'slid right: steer right (towards the right of the screen)', str(I()))
    time.sleep(0.15); touch('touchMove', [(1, 240, 560)]); time.sleep(0.15); touch('touchMove', [(1, 240, 540)]); pg.wait_for_timeout(60); ok(I()[1] is True, 'pushed up: a burst', str(I()))
    touch('touchEnd', []); pg.wait_for_timeout(60); ok(I() == [0, False], 'lifted: straight on, no burst', str(I()))
    fr = pg.evaluate('__sim.flankRects()'); cd0 = pg.evaluate('__sim.G.flankCD'); touch('touchStart', [(1, fr['R']['x'] + 20, fr['R']['y'] + 20)]); touch('touchEnd', [])
    ok(pg.evaluate('__sim.G.flankCD') > cd0 and pg.evaluate('__sim.G.pack.some(q => q.task > 0 && q.side === 1)'), 'FLANK on the right: a packmate goes up her right')
    pg.evaluate("(() => { const G = __sim.G, p = G.prey, w = G.wolf; w.x = p.x + Math.cos(p.h) * 2.4; w.z = p.z - Math.sin(p.h) * 2.4; w.h = p.h; w.stun = 0; })()")
    bb = pg.evaluate('__sim.biteBtn()'); c0 = pg.evaluate('__sim.G.caught'); touch('touchStart', [(1, 150, 600)]); touch('touchStart', [(1, 150, 600), (2, bb['x'], bb['y'])]); touch('touchEnd', []); pg.wait_for_timeout(80)
    ok(pg.evaluate('__sim.G.caught') == c0 + 1, 'the BITE button, beside her, with the other thumb steering: the strike brings her down', pg.evaluate('JSON.stringify([__sim.G.caught, __sim.G.ph])'))
    pg.evaluate("__sim.go(1)"); pg.wait_for_timeout(400); pg.evaluate("(() => { const G = __sim.G; G.lesson = null; G.ph = 'chase'; G.caught = 0; })()")
    pg.evaluate("(() => { const G = __sim.G, p = G.prey, w = G.wolf; w.x = p.x + Math.cos(p.h) * 2.4; w.z = p.z - Math.sin(p.h) * 2.4; w.h = p.h; w.stun = 0; })()")
    touch('touchStart', [(1, 195, 600)]); time.sleep(0.03); touch('touchMove', [(1, 260, 560)]); time.sleep(0.02); touch('touchMove', [(1, 330, 520)]); touch('touchEnd', []); pg.wait_for_timeout(80)
    ok(pg.evaluate('__sim.G.caught') == 1, 'a quick flick alongside her: the strike brings her down', pg.evaluate('JSON.stringify([__sim.G.caught, __sim.G.ph])'))
    pg.wait_for_timeout(300); pg.screenshot(path='/tmp/wp_touch.png'); ok(not errs, 'no JavaScript errors', str(errs[:3]))
    b.close()
print(f'\n{oks} checks passed, {len(fails)} failed.')
sys.exit(1 if fails else 0)
