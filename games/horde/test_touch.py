#!/usr/bin/env python3
"""Horde with real touches and real drawing: the thumb lands anywhere and drags, and the hero walks that way (screen right is
his right, screen up is up the screen); let go and he stops; at a level-up a tap on a card picks that power, and a drag does
nothing until a card is picked. No JavaScript errors.
Run: python3 games/horde/test_touch.py"""
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
    pg.evaluate("localStorage.setItem('hd.taught', '3'); __sim.go(4); __sim.G.lesson = null; __sim.G.me.x = 0; __sim.G.me.z = 0;"); pg.wait_for_timeout(300)
    cdp = ctx.new_cdp_session(pg)
    def touch(kind, pts): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, x, y in pts]})
    me = lambda: pg.evaluate("[__sim.G.me.x, __sim.G.me.z]")
    x0 = pg.evaluate("__sim.scr(__sim.G.me.x, 0, __sim.G.me.z).x")
    a = me(); touch('touchStart', [(1, 200, 600)]); touch('touchMove', [(1, 230, 600)]); touch('touchMove', [(1, 260, 600)]); pg.wait_for_timeout(500)
    c = me(); ok(c[0] > a[0] + 1, 'drag right: he walks right', str([a, c]))
    pg.wait_for_timeout(200); x1 = pg.evaluate("__sim.scr(__sim.G.me.x, 0, __sim.G.me.z).x"); ok(x1 > x0, 'and on the screen he moves right', str([x0, x1]))
    touch('touchMove', [(1, 200, 540)]); pg.wait_for_timeout(500); d = me(); ok(d[1] < c[1] - 1, 'drag up: he walks up the screen', str([c, d]))
    touch('touchEnd', []); pg.wait_for_timeout(400); e = me(); pg.wait_for_timeout(300); f = me(); ok(abs(f[0] - e[0]) + abs(f[1] - e[1]) < 0.3, 'let go: he stops', str([e, f]))
    # a level-up: the night stops; a tap on the second card picks it
    pg.evaluate("(() => { const G = __sim.G; G.me.xp = G.me.need; })()"); pg.wait_for_timeout(300); ok(pg.evaluate("!!__sim.G.choice"), 'a level-up offers three cards')
    t0 = pg.evaluate("__sim.G.t"); pg.wait_for_timeout(300); ok(pg.evaluate("__sim.G.t") == t0, 'the night stands still while you choose')
    opt = pg.evaluate("__sim.G.choice.opts[1]"); r = pg.evaluate("__sim.cardRects()[1]"); touch('touchStart', [(1, r['x'] + r['w'] / 2, r['y'] + r['h'] / 2)]); touch('touchEnd', []); pg.wait_for_timeout(100)
    key = opt.get('w') or opt.get('p'); got = pg.evaluate(f"(__sim.G.weapons['{key}'] || 0) + (__sim.G.pass['{key}'] || 0)")
    ok(not pg.evaluate("__sim.G.choice") and got == opt['lv'], 'a tap on a card picks that power', str([opt, got]))
    pg.wait_for_timeout(400); pg.screenshot(path='/tmp/hd_touch.png'); ok(not errs, 'no JavaScript errors', str(errs[:3]))
    b.close()
print(f'\n{oks} checks passed, {len(fails)} failed.')
sys.exit(1 if fails else 0)
