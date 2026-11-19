#!/usr/bin/env python3
"""Sinkhole with a real thumb: a slide moves the hole the way the thumb goes (right is right, up the screen is away), lifting
stops it; while paused a slide does nothing; a small thing at the hole falls in and the hole grows with enough; a thing too
big stays on the rim (the hole cannot go under it); a red barrel blows up and stalls the hole; a bigger hole swallows yours
and you come back; a power-up works; the hole you pick in Your holes is the one you play with. No errors.
Run: python3 games/sinkhole/test_touch.py"""
import os, sys
from playwright.sync_api import sync_playwright
here = os.path.dirname(os.path.abspath(__file__)); fails = []; oks = 0
def ok(c, what, d=''):
    global oks
    if c: oks += 1; print('  ok  ', what)
    else: fails.append(what); print('  FAIL', what, d)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + os.path.join(here, 'index.html')); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(800)
    E = pg.evaluate
    def hold(dx, dy, ms=600, x0=195, y0=600):
        pg.mouse.move(x0, y0); pg.mouse.down()
        for i in range(1, 7): pg.mouse.move(x0 + dx * i / 6, y0 + dy * i / 6); pg.wait_for_timeout(16)
        pg.wait_for_timeout(ms); return
    def up(): pg.mouse.up(); pg.wait_for_timeout(100)
    # a clear town: nothing in the way, no rivals
    clear = "(() => { const G = __sim.G; G.objs.forEach(o => o.alive = false); G.holes.length = 1; G.pwT = 999; })()"
    E("localStorage.setItem('sn.taught', '3'); __sim.go(1)"); pg.wait_for_timeout(300); E(clear)
    x0, z0 = E("[__sim.G.you.x, __sim.G.you.z]"); hold(80, 0); x1, z1 = E("[__sim.G.you.x, __sim.G.you.z]")
    ok(x1 - x0 > 1 and abs(z1 - z0) < 0.6, 'sliding right moves the hole right', str([x0, z0, x1, z1]))
    up(); pg.wait_for_timeout(300); a = E("[__sim.G.you.x, __sim.G.you.z]"); pg.wait_for_timeout(400); b2 = E("[__sim.G.you.x, __sim.G.you.z]")
    ok(abs(a[0] - b2[0]) + abs(a[1] - b2[1]) < 0.05, 'lifting the thumb stops it', str([a, b2]))
    hold(0, -80); z2 = E("__sim.G.you.z"); up(); ok(z2 < b2[1] - 1, 'sliding up the screen moves it away (up the town)', str([b2[1], z2]))
    E("document.getElementById('pauseBtn').click()"); pg.wait_for_timeout(200); a = E("__sim.G.you.x"); hold(80, 0, 400); up(); ok(abs(E("__sim.G.you.x") - a) < 0.01, 'a slide while paused does nothing')
    E("__sim.go(1)"); pg.wait_for_timeout(200); E(clear)
    # a cone at the hole falls in; enough of them and it grows
    E("(() => { const G = __sim.G, h = G.you; window.__put = (kind, x, z) => { const o = { id: G.objs.length, kind, x, z, rad: ({ cone: .14, bin: .2, barrel: .24, house: 2.3 })[kind], h: 1, m: ({ cone: 1, bin: 2, barrel: 0, house: 120 })[kind], alive: true, a: 0, var: 0 }; G.objs.push(o); return o; }; })()")
    E("__put('cone', __sim.G.you.x, __sim.G.you.z)"); E("__sim.adv(0.1)"); ok(E("__sim.G.ate") == 1, 'a small thing at the hole falls in', str(E("__sim.G.ate")))
    E("for (let i = 0; i < 6; i++) __put('bin', __sim.G.you.x, __sim.G.you.z); __sim.adv(0.1)"); ok(E("__sim.G.you.s") >= 1, 'swallowing enough makes the hole grow', str(E("__sim.G.you.s")))
    # a house is too big: the hole cannot slide under it
    E("(() => { const h = __sim.G.you; __put('house', h.x + 4, h.z); })()"); hold(90, 0, 1500); up(); hx = E("__sim.G.you.x - __sim.G.objs[__sim.G.objs.length - 1].x")
    ok(hx < -1.5 and E("__sim.G.objs[__sim.G.objs.length - 1].alive"), 'a thing too big stays on the rim; the hole stops short of its middle', str(hx))
    # a red barrel: boom, smaller and stalled
    E("__sim.go(1)"); pg.wait_for_timeout(200); E(clear); E("(() => { const G = __sim.G, h = G.you; h.s = 3; h.m = 40; })()")
    E("(() => { const G = __sim.G, h = G.you; window.__put = (kind, x, z) => { const o = { id: G.objs.length, kind, x, z, rad: .24, h: 1, m: 0, alive: true, a: 0, var: 0 }; G.objs.push(o); return o; }; __put('barrel', h.x, h.z); })()")
    E("__sim.adv(0.1)"); ok(E("__sim.G.booms") == 1 and E("__sim.G.you.stun") > 0 and E("__sim.G.you.m") < 40, 'a red barrel blows up: the hole loses growth and stalls', str(E("[__sim.G.booms, __sim.G.you.stun, __sim.G.you.m]")))
    # a bigger hole swallows yours: you are gone a moment, then back, smaller
    E("__sim.go(5)"); pg.wait_for_timeout(200); E("(() => { const G = __sim.G, h = G.you, r = G.holes[1]; h.s = 3; h.m = 40; r.s = 6; r.m = 300; r.x = h.x; r.z = h.z; r.ax = r.az = 0; })()")
    E("__sim.adv(0.05)"); ok(E("__sim.G.you.gone") > 0, 'a bigger hole swallows yours', str(E("__sim.G.you.gone")))
    E("__sim.adv(2.2)"); ok(E("__sim.G.you.gone") == 0 and E("__sim.G.you.s") == 1, 'you come back two sizes smaller', str(E("[__sim.G.you.gone, __sim.G.you.s]")))
    # a power-up: magnet
    E("__sim.go(1)"); pg.wait_for_timeout(200); E(clear); E("(() => { const G = __sim.G, h = G.you; G.objs.push({ id: G.objs.length, kind: 'pw', sub: 'magnet', x: h.x, z: h.z, rad: .3, h: .6, m: 0, alive: true, a: 0, var: 0 }); })()")
    E("__sim.adv(0.1)"); ok(E("__sim.G.you.magnet") > 0, 'a magnet power-up works')
    # your holes
    E("localStorage.setItem('sn.stars', JSON.stringify({1: 3, 2: 3})); __sim.showAqua()"); pg.wait_for_timeout(200)
    ok(E("document.querySelectorAll('#aqGrid .aq').length") == E("__sim.SKINS.length"), 'Your holes lists every hole')
    E("document.querySelectorAll('#aqGrid .aq')[1].click()"); ok(E("__sim.mySkin().id") == E("__sim.SKINS[1].id"), 'tapping an open one picks it, and it is the one you play with')
    E("localStorage.setItem('sn.stars', '{}'); __sim.showAqua(); document.querySelectorAll('#aqGrid .aq')[3].click()"); ok(E("__sim.store.get('skin')") == E("__sim.SKINS[1].id"), 'a locked one cannot be picked')
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
