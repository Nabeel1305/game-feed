#!/usr/bin/env python3
"""Kart Kingdom's buttons with real touches (version 2, KartRider-style): ◀ held steers left, ▶ right, let go goes straight, a
thumb slid from ◀ to ▶ turns the other way. DRIFT held with an arrow at speed slides with sparks, let go gives a boost; in the
air DRIFT is a trick (from the middle of the road, so no rail hit gets in the way; a second tap during it does nothing; landing after it is a boost, in the middle a wipeout). ITEM tapped
throws a banana far ahead (in a high arc), swiped down throws it behind; three shells fire one tap at a time. NITRO with a full
bar boosts. DRIFT held from the second light is a rocket start; from the first, a stall. No JavaScript errors.
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
    def send(kind, pts): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': pts})
    B = None
    def at(name): return [B[name]['x'], B[name]['y']]
    E("localStorage.setItem('kk.taught', '3'); __sim.go(1); __sim.ui.snap = true;"); B = E("__sim.btnLayout()")
    # the rocket start: DRIFT held from the second light
    pg.wait_for_function("__sim.G.count < 1.9 && __sim.G.count > 1.2", timeout=6000); x, y = at('D'); send('touchStart', [{'x': x, 'y': y, 'id': 2}])
    pg.wait_for_function("__sim.G.count <= 0", timeout=6000); pg.wait_for_timeout(50); r = E("[__sim.G.rocket, __sim.G.me.boost > 0, __sim.G.me.spin]"); send('touchEnd', [])
    ok(r[0] == 1 and r[1] and r[2] == 0, 'DRIFT held from the second light: a rocket start (a boost)', str(r))
    E("__sim.go(1); __sim.ui.snap = true;"); pg.wait_for_timeout(150); send('touchStart', [{'x': x, 'y': y, 'id': 3}])
    pg.wait_for_function("__sim.G.count <= 0", timeout=6000); pg.wait_for_timeout(50); r = E("[__sim.G.rocket, __sim.G.me.spin > 0]"); send('touchEnd', [])
    ok(not r[0] and r[1], 'DRIFT held from the first light: a stall', str(r))
    pg.wait_for_timeout(2200)
    # steering with the arrows
    lx, ly = at('L'); rx, ry = at('R')
    send('touchStart', [{'x': lx, 'y': ly, 'id': 1}]); pg.wait_for_timeout(350); st = E("__sim.G.steer"); ok(st <= -0.9, '◀ held: a hard left', str(st))
    for i in range(1, 7): send('touchMove', [{'x': lx + (rx - lx) * i / 6, 'y': ly, 'id': 1}]); pg.wait_for_timeout(16)
    pg.wait_for_timeout(350); st = E("__sim.G.steer"); ok(st >= 0.9, 'the thumb slid onto ▶: a hard right', str(st))
    send('touchEnd', []); pg.wait_for_timeout(250); st = E("__sim.G.steer"); ok(abs(st) < 0.05, 'let go: straight', str(st))
    # a drift: ▶ and DRIFT held at speed on a straight, then DRIFT let go
    E("(() => { const G = __sim.G, k = G.me, S = G.T.S, n = S.length; let i = k.i; for (let q = 0; q < n; q++) { const j = (k.i + q) % n; let ok = true; for (let w = -10; w < 60; w++) { const s = S[(j + w + n) % n]; if (Math.abs(s.curve) > 0.08 || Math.abs(s.slope) > 0.04 || s.gap) { ok = false; break; } } if (ok && !G.T.ramps.some(r => Math.abs(((j - r.i0 + n + n / 2) % n) - n / 2) < 40)) { i = j; break; } } const p = S[i]; k.x = p.x + Math.sin(p.h) * 4; k.z = p.z - Math.cos(p.h) * 4; k.i = k.last = i; k.h = p.h; k.y = p.y; k.vy = 0; k.v = 26; k.air = false; G.hz.length = 0; })()")
    send('touchStart', [{'x': rx, 'y': ry, 'id': 1}]); pg.wait_for_timeout(200); send('touchStart', [{'x': rx, 'y': ry, 'id': 1}, {'x': x, 'y': y, 'id': 2}])
    try: pg.wait_for_function("__sim.G.me.tier >= 1", timeout=2500)
    except Exception: pass
    r = E("[__sim.G.me.drift, __sim.G.me.tier]"); ok(r[0] == 1 and r[1] >= 1, '▶ and DRIFT held at speed: a drift with sparks', str(r))
    send('touchEnd', []); pg.wait_for_timeout(80); r = E("[__sim.G.me.drift, __sim.G.me.boost > 0, __sim.G.me.nitro > 0]"); ok(r[0] == 0 and r[1], 'DRIFT let go: a boost', str(r)); ok(r[2], 'the drift put something in NITRO', str(r))
    pg.wait_for_timeout(200)
    # the item: a banana thrown far ahead, or behind
    ix, iy = at('I')
    E("(() => { const k = __sim.G.me; k.item = 'peel'; k.roul = 0; })()"); pg.touchscreen.tap(ix, iy); pg.wait_for_timeout(60)
    r = E("(() => { const G = __sim.G, k = G.me, o = G.lobs[0], S = G.T.S, n = S.length; if (!o) return null; let best = 0, bd = 1e18; for (let i = 0; i < n; i++) { const d = (S[i].x - o.tx) ** 2 + (S[i].z - o.tz) ** 2; if (d < bd) { bd = d; best = i; } } return [Math.round(((best - k.i + n) % n) * G.T.ds), G.me.item]; })()")
    ok(r is not None and 30 < r[0] < 60 and r[1] is None, 'ITEM tapped: the banana flies far AHEAD along the road (lands 30-60 m on)', str(r))
    pg.wait_for_timeout(1600); r = E("__sim.G.peels.length"); ok(r >= 1, 'it lands on the road as a peel', str(r))
    E("(() => { const k = __sim.G.me; k.item = 'peel'; k.roul = 0; __sim.G.lobs.length = 0; })()")
    send('touchStart', [{'x': ix, 'y': iy, 'id': 4}]); pg.wait_for_timeout(30)
    for i in range(1, 6): send('touchMove', [{'x': ix, 'y': iy + 12 * i, 'id': 4}]); pg.wait_for_timeout(16)
    send('touchEnd', []); pg.wait_for_timeout(40)
    r = E("(() => { const G = __sim.G, k = G.me, o = G.lobs[0]; if (!o) return null; return Math.round((o.tx - k.x) * Math.cos(k.h) + (o.tz - k.z) * Math.sin(k.h)); })()")
    ok(r is not None and r < 0, 'ITEM swiped down: the banana goes BEHIND', str(r))
    pg.wait_for_timeout(1200)
    E("(() => { const k = __sim.G.me; k.item = 'triple'; __sim.G.shots.length = 0; })()"); pg.touchscreen.tap(ix, iy); pg.wait_for_timeout(100); r1 = E("__sim.G.me.orbit"); pg.touchscreen.tap(ix, iy); pg.wait_for_timeout(100); r2 = E("[__sim.G.me.orbit, __sim.G.shots.length]")
    ok(r1 == 3 and r2[0] == 2 and r2[1] >= 1, 'three shells: the first tap sets them spinning, the next fires one', str([r1, r2]))
    # NITRO
    nx, ny = at('N'); E("(() => { const k = __sim.G.me; k.nitro = 0.4; k.nitroT = 0; })()"); pg.touchscreen.tap(nx, ny); pg.wait_for_timeout(60); ok(E("__sim.G.me.nitroT") == 0, 'NITRO not full: nothing happens')
    E("(() => { const k = __sim.G.me; k.nitro = 1.2; })()"); pg.touchscreen.tap(nx, ny); pg.wait_for_timeout(60); r = E("[__sim.G.me.nitroT > 0, __sim.G.me.nitro]"); ok(r[0] and r[1] < 1, 'NITRO full: tapped, a big boost', str(r))
    # in the air: DRIFT is a trick
    pg.wait_for_timeout(300); E("(() => { const k = __sim.G.me, p = __sim.G.T.S[k.i]; k.x = p.x; k.z = p.z; k.h = p.h; k.slip = 0; k.air = true; k.glide = false; k.y += 2; k.vy = 6; k.airTricks = 0; k.trick = null; k.boost = 0; k.orbit = 0; k.item = null; })()")
    pg.touchscreen.tap(x, y); pg.wait_for_timeout(40); r = E("[!!__sim.G.me.trick, __sim.G.me.airTricks]"); ok(r[0] and r[1] == 1, 'in the air DRIFT starts a trick', str(r))
    pg.touchscreen.tap(x, y); pg.wait_for_timeout(30); ok(E("__sim.G.me.airTricks") == 1, 'a tap during a trick does nothing')
    pg.wait_for_function("!__sim.G.me.air", timeout=5000); r = E("[__sim.G.me.spin, __sim.G.me.boost, __sim.G.tricks, __sim.G.wipeouts]")
    ok(r[0] == 0 and r[1] > 0.3 and r[2] == 1, 'landing after the trick: clean, a boost', str(r))
    pg.wait_for_timeout(300); E("(() => { const k = __sim.G.me, p = __sim.G.T.S[k.i]; k.x = p.x; k.z = p.z; k.h = p.h; k.slip = 0; k.v = 8; k.air = true; k.y = p.y + 0.6; k.vy = 0; k.airTricks = 0; k.trick = null; })()"); pg.touchscreen.tap(x, y)
    pg.wait_for_function("!__sim.G.me.air", timeout=5000); ok(E("__sim.G.wipeouts") == 1 and E("__sim.G.me.spin") > 0, "landing mid-trick: a wipeout")
    pg.wait_for_timeout(200); ok(not errs, 'no JavaScript errors', str(errs[:3]))
    b.close()
print(f'\n{oks} checks passed, {len(fails)} failed.')
sys.exit(1 if fails else 0)
