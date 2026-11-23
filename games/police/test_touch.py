#!/usr/bin/env python3
"""Police Chase with real touches and real drawing: the left thumb's stick steers, the right thumb's GAS and BRAKE pedals work (BRAKE reverses from a standstill), a wall stops the car; on foot
swipes change lane, jump and slide and a quick tap tackles; in the arrest a swipe the other way holds him. No JavaScript errors.
Run: python3 games/police/test_touch.py"""
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
    pg.evaluate("localStorage.setItem('pol.taught', '3'); __sim.go(4); __sim.G.lesson = null;"); pg.wait_for_timeout(300)
    cdp = ctx.new_cdp_session(pg)
    def touch(kind, pts): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, x, y in pts]})
    st = lambda: pg.evaluate("[+__sim.G.in.sx.toFixed(2), __sim.G.in.gas, __sim.G.in.brake]"); Pd = pg.evaluate("__sim.pedals()"); mid = lambda b: (b['x'] + b['w'] / 2, b['y'] + b['h'] / 2); gx, gy = mid(Pd['gas']); bx, by = mid(Pd['brake'])
    touch('touchStart', [(1, 90, 700)]); touch('touchMove', [(1, 50, 700)]); pg.wait_for_timeout(40); ok(st()[0] < -0.7 and not st()[1] and not st()[2], 'left thumb: the stick slid left steers left', str(st()))
    touch('touchMove', [(1, 135, 690)]); pg.wait_for_timeout(40); ok(st()[0] > 0.7, 'slid right: steers right', str(st()))
    touch('touchStart', [(1, 135, 690), (2, gx, gy)]); pg.wait_for_timeout(40); ok(st()[1] is True and st()[0] > 0.7, 'right thumb on GAS while the left still steers', str(st()))
    pg.evaluate("__sim.G.traffic.length = 0"); touch('touchMove', [(1, 90, 700), (2, gx, gy)]); pg.wait_for_timeout(40); v0 = pg.evaluate("__sim.G.me.v"); pg.wait_for_timeout(600); ok(pg.evaluate("__sim.G.me.v") > v0 + 1, 'GAS held: the car speeds up', str([v0, pg.evaluate("__sim.G.me.v")]))
    h0 = pg.evaluate("__sim.G.me.h"); touch('touchMove', [(1, 135, 690), (2, gx, gy)]); pg.wait_for_timeout(250); ok(pg.evaluate("__sim.G.me.h") > h0 + 0.05, 'and turns right as the stick goes right', str([h0, pg.evaluate("__sim.G.me.h")]))
    touch('touchMove', [(1, 135, 690), (2, bx, by)]); pg.wait_for_timeout(40); ok(st()[2] is True and st()[1] is False, 'the thumb slid across to BRAKE: braking, no gas', str(st()))
    touch('touchEnd', []); pg.wait_for_timeout(40); ok(st() == [0, False, False], 'both thumbs lifted: stick centred, pedals up', str(st()))
    pg.evaluate("(() => { const G = __sim.G; G.me.v = 0; G.traffic.length = 0; })()"); touch('touchStart', [(2, bx, by)]); pg.wait_for_timeout(900); ok(pg.evaluate("__sim.G.me.v") < -1, 'BRAKE held at a standstill: the car reverses', str(pg.evaluate("__sim.G.me.v"))); touch('touchEnd', [])
    r = pg.evaluate("(() => { const G = __sim.G, m = G.me; m.x = 3.4; m.s = 20; m.h = Math.PI / 2; m.v = 12; G.traffic.length = 0; __sim.adv(1.2); return [__sim.onRoad(m.x, m.s, 1), Math.round(m.x), +m.v.toFixed(1)]; })()"); ok(r[0] is True and r[1] < 12, 'driven at a wall, the car is stopped by it and stays on the street', str(r))
    pg.evaluate("__sim.startFoot(8)")
    def swipe(x0, y0, x1, y1):
        touch('touchStart', [(1, x0, y0)])
        for j in range(1, 5): touch('touchMove', [(1, x0 + (x1 - x0) * j / 4, y0 + (y1 - y0) * j / 4)])
        touch('touchEnd', [])
    swipe(200, 600, 100, 600); ok(pg.evaluate("__sim.G.foot.lane") == 0, 'swipe left: left lane')
    swipe(200, 600, 200, 480); ok(pg.evaluate("__sim.G.foot.air") > 0, 'swipe up: jump')
    pg.evaluate("__sim.G.foot.air = 0"); swipe(200, 500, 200, 640); ok(pg.evaluate("__sim.G.foot.low") > 0, 'swipe down: slide')
    pg.evaluate("__sim.G.foot.gap = 1.5; __sim.G.foot.dive = 0"); touch('touchStart', [(1, 200, 600)]); touch('touchEnd', [])
    ok(pg.evaluate("__sim.G.ph") == 'cuff', 'a quick tap right behind him: tackled, the arrest begins')
    pg.evaluate("__sim.G.cuff.heave = { dir: 'l', t: 0.05, done: false, go: true }"); swipe(200, 600, 310, 600)
    ok(pg.evaluate("__sim.G.cuff.held") == 1, 'he twists left, a swipe right holds him')
    pg.wait_for_timeout(400); pg.screenshot(path='/tmp/pc_touch.png'); ok(not errs, 'no JavaScript errors', str(errs[:3]))
    b.close()
print(f'\n{oks} checks passed, {len(fails)} failed.')
sys.exit(1 if fails else 0)
