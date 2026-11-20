#!/usr/bin/env python3
"""Kart Kingdom with real touches: the left thumb slid right steers right, slid left steers left, let go goes straight; held
far over at speed it drifts, and straightening up gives a boost. On the ground a tap on the right half uses the item (and
does not steer); three shells are fired one tap at a time. In the air a tap starts a trick; a tap during it does nothing;
landing after it is a boost, landing in the middle a wipeout. Before the start, the right side held on the second light is a
rocket start; held from the first light, a stall. No JavaScript errors.
Run: python3 games/kingdom/test_touch.py"""
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
    E = pg.evaluate
    cdp = ctx.new_cdp_session(pg)
    def touch(kind, pts): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': pts})
    def drag(x0, y0, x1, y1, hold=300):
        touch('touchStart', [{'x': x0, 'y': y0, 'id': 1}]); pg.wait_for_timeout(30)
        for i in range(1, 7): touch('touchMove', [{'x': x0 + (x1 - x0) * i / 6, 'y': y0 + (y1 - y0) * i / 6, 'id': 1}]); pg.wait_for_timeout(16)
        pg.wait_for_timeout(hold)
    # the rocket start: hold the right side from the second light
    E("localStorage.setItem('kk.taught', '3'); __sim.go(1); __sim.ui.snap = true;")
    pg.wait_for_function("__sim.G.count < 1.9 && __sim.G.count > 1.2", timeout=6000); touch('touchStart', [{'x': 320, 'y': 600, 'id': 2}])
    pg.wait_for_function("__sim.G.count <= 0", timeout=6000); pg.wait_for_timeout(50); r = E("[__sim.G.rocket, __sim.G.me.boost > 0, __sim.G.me.spin]"); touch('touchEnd', [])
    ok(r[0] == 1 and r[1] and r[2] == 0, 'right side held from the second light: a rocket start (a boost)', str(r))
    E("__sim.go(1); __sim.ui.snap = true;"); pg.wait_for_timeout(150); touch('touchStart', [{'x': 320, 'y': 600, 'id': 3}])
    pg.wait_for_function("__sim.G.count <= 0", timeout=6000); pg.wait_for_timeout(50); r = E("[__sim.G.rocket, __sim.G.me.spin > 0]"); touch('touchEnd', [])
    ok(not r[0] and r[1], 'right side held from the first light: a stall', str(r))
    pg.wait_for_timeout(2500)
    # steering
    drag(90, 650, 120, 650, 150); st = E("__sim.G.steer"); ok(0.3 < st < 0.75, 'left thumb slid a little right: a gentle right turn', str(st))
    touch('touchEnd', []); pg.wait_for_timeout(80); ok(E("__sim.G.steer") == 0, 'let go: straight')
    drag(120, 650, 50, 650, 150); ok(E("__sim.G.steer") <= -0.95, 'slid well left: a hard left'); touch('touchEnd', []); pg.wait_for_timeout(80)
    # a drift: held hard at speed, then straightened
    E("(() => { const G = __sim.G, k = G.me, S = G.T.S, n = S.length; let i = k.i; for (let q = 0; q < n; q++) { const j = (k.i + q) % n; let ok = true; for (let w = -10; w < 60; w++) { const s = S[(j + w + n) % n]; if (Math.abs(s.curve) > 0.08 || Math.abs(s.slope) > 0.04 || s.gap) { ok = false; break; } } if (ok && !G.T.ramps.some(r => Math.abs(((j - r.i0 + n + n / 2) % n) - n / 2) < 40)) { i = j; break; } } const p = S[i]; k.x = p.x - Math.sin(p.h) * 4; k.z = p.z + Math.cos(p.h) * 4; k.i = k.last = i; k.h = p.h; k.y = p.y; k.vy = 0; k.v = 26; k.air = false; G.hz.length = 0; })()"); drag(120, 650, 40, 650, 0)
    try: pg.wait_for_function("__sim.G.me.tier >= 1", timeout=2500)
    except Exception: pass
    r = E("[__sim.G.me.drift, __sim.G.me.tier]")
    ok(r[0] == -1 and r[1] >= 1, 'a hard turn held at speed: a drift with sparks', str(r)); touch('touchEnd', []); pg.wait_for_timeout(60); r = E("[__sim.G.me.drift, __sim.G.me.boost > 0]"); ok(r[0] == 0 and r[1], 'let go of the drift: a boost', str(r))
    # on the ground: the item
    E("(() => { const k = __sim.G.me; k.item = 'pepper'; k.boost = 0; })()"); pg.touchscreen.tap(320, 600); pg.wait_for_timeout(120); r = E("[__sim.G.me.item, __sim.G.me.boost > 0, __sim.G.steer]")
    ok(r[0] is None and r[1], 'on the ground a tap on the right half uses the item (a pepper: boost)', str(r)); ok(r[2] == 0, 'a tap on the right does not steer', str(r))
    E("(() => { const k = __sim.G.me; k.item = 'triple'; })()"); pg.touchscreen.tap(320, 600); pg.wait_for_timeout(100); r1 = E("__sim.G.me.orbit"); pg.touchscreen.tap(320, 600); pg.wait_for_timeout(100); r2 = E("[__sim.G.me.orbit, __sim.G.shots.length]")
    ok(r1 == 3 and r2[0] == 2 and r2[1] >= 1, 'three shells: the first tap sets them spinning, the next fires one', str([r1, r2]))
    # in the air: put the kart in the air by hand, high enough for one trick
    pg.wait_for_timeout(400); E("(() => { const k = __sim.G.me; k.air = true; k.glide = false; k.y += 2; k.vy = 6; k.airTricks = 0; k.trick = null; k.boost = 0; k.orbit = 0; k.item = null; })()")
    pg.touchscreen.tap(320, 600); pg.wait_for_timeout(40); r = E("[!!__sim.G.me.trick, __sim.G.me.airTricks]"); ok(r[0] and r[1] == 1, 'in the air a tap on the right half starts a trick', str(r))
    pg.touchscreen.tap(320, 600); pg.wait_for_timeout(30); ok(E("__sim.G.me.airTricks") == 1, 'a tap during a trick does nothing')
    pg.wait_for_function("!__sim.G.me.air", timeout=5000); r = E("[__sim.G.me.spin, __sim.G.me.boost, __sim.G.tricks, __sim.G.wipeouts]")
    ok(r[0] == 0 and r[1] > 0.3 and r[2] == 1, 'landing after the trick: clean, a boost', str(r))
    pg.wait_for_timeout(300); E("(() => { const k = __sim.G.me; k.air = true; k.y += 0.6; k.vy = 0; k.airTricks = 0; k.trick = null; })()"); pg.touchscreen.tap(320, 600)
    pg.wait_for_function("!__sim.G.me.air", timeout=5000); ok(E("__sim.G.wipeouts") == 1 and E("__sim.G.me.spin") > 0, 'landing mid-trick: a wipeout')
    pg.wait_for_timeout(200); ok(not errs, 'no JavaScript errors', str(errs[:3]))
    b.close()
print(f'\n{oks} checks passed, {len(fails)} failed.')
sys.exit(1 if fails else 0)
