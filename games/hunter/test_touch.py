#!/usr/bin/env python3
"""Hunter with real touches and real drawing (controls rebuilt 22 Nov 2026): the left thumb is a stick: a gentle push creeps, a
full push runs (and the animal hears it), letting go freezes; the right thumb drags the crosshair while the left creeps; a tap
on THROW throws where the crosshair is; with a lion growling, a tap on its side faces it (a tap on the other side corrects a
wrong turn) and a tap as it leaps braces. No swipes. No JavaScript errors. Run: python3 games/hunter/test_touch.py"""
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
    pg.evaluate("localStorage.setItem('hu.taught', '3'); __sim.go(4); __sim.G.lesson = null; __sim.G.cfg.lion = 0; __sim.G.a.next = 99;"); pg.wait_for_timeout(300)
    cdp = ctx.new_cdp_session(pg)
    def touch(kind, pts): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, x, y in pts]})
    E = pg.evaluate
    touch('touchStart', [(1, 90, 650)]); touch('touchMove', [(1, 90, 630)]); pg.wait_for_timeout(250); c1 = E("[__sim.G.me.creep, __sim.G.me.run]"); z0 = E("__sim.G.me.z")
    ok(c1 == [True, False], 'a gentle push up on the left stick creeps', str(c1)); pg.wait_for_timeout(300); ok(E("Math.hypot(__sim.G.me.x, __sim.G.me.z)") > 0.2, 'and you move towards the animal')
    touch('touchMove', [(1, 90, 580)]); pg.wait_for_timeout(200); ok(E("[__sim.G.me.creep, __sim.G.me.run]") == [True, True], 'a full push runs'); al = E("__sim.G.a.alert"); pg.wait_for_timeout(500); ok(E("__sim.G.a.alert") > al, 'the animal hears running')
    touch('touchMove', [(1, 90, 630)]); E("__sim.G.a.alert = 0")
    # the right thumb drags the crosshair while the left creeps
    c0 = E("__sim.ui.ch"); touch('touchStart', [(1, 90, 630), (2, 300, 420)])
    for j in range(1, 5): touch('touchMove', [(1, 90, 630), (2, 300 + 10 * j, 420 + 6 * j)])
    ch = E("__sim.ui.ch"); ok(ch and ch['x'] > 25 and ch['y'] > 12, 'the right thumb drags the crosshair (while the left creeps)', str(ch)); ok(E("__sim.G.spears.length") == 0, 'dragging does not throw')
    touch('touchEnd', [(1, 90, 630)]); pg.wait_for_timeout(60); ok(E("__sim.G.spears.length") == 0, 'lifting the aiming thumb does not throw either')
    touch('touchEnd', []); pg.wait_for_timeout(60); ok(not E("__sim.G.me.creep"), 'stick let go: frozen')
    E("(() => { const G = __sim.G, a = G.a, d = Math.hypot(a.x - G.me.x, a.z - G.me.z); G.me.x = a.x - (a.x - G.me.x) / d * 10; G.me.z = a.z - (a.z - G.me.z) / d * 10; __sim.ui.snap = true; __sim.ui.ch = { x: 0, y: 0 }; })()"); pg.wait_for_timeout(250); L = E("__sim.layout()"); F = L['fire']; touch('touchStart', [(3, F['x'], F['y'])]); touch('touchEnd', []); pg.wait_for_timeout(60)
    sp = E("__sim.G.spears.length"); ok(sp == 1, 'a tap on THROW throws the spear', str(sp)); s = E("(() => { const s = __sim.G.spears[0], a = __sim.G.a; return Math.hypot(s.tx - a.x, s.tz - a.z); })()"); ok(s < 3, 'at the animal, where the crosshair was', str(s))
    E("(() => { const G = __sim.G; G.spears.forEach(s => s.done = true); G.over = null; G.lives = 3; G.a.st = 'graze'; G.a.next = 99; G.lion = { side: 1, st: 'stalk', t: 0, leapAt: 99 }; G.me.face = 0; })()")
    touch('touchStart', [(1, 90, 600)]); touch('touchEnd', []); ok(E("__sim.G.me.face") == -1, 'a tap on the left faces left (the wrong way here)')
    touch('touchStart', [(1, 300, 600)]); touch('touchEnd', []); ok(E("__sim.G.me.face") == 1, 'a tap on the right corrects it: facing the growl')
    E("__sim.G.lion.st = 'leap'; __sim.G.lion.t = 0;"); touch('touchStart', [(1, 200, 600)]); touch('touchEnd', [])
    ok(E("__sim.G.lionsKilled") == 1, 'a tap as it leaps braces the spear: lion held off')
    pg.wait_for_timeout(500); pg.screenshot(path='/tmp/hu_touch.png'); ok(not errs, 'no JavaScript errors', str(errs[:3]))
    b.close()
print(f'\n{oks} checks passed, {len(fails)} failed.')
sys.exit(1 if fails else 0)
