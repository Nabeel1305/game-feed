#!/usr/bin/env python3
"""Police Chase with real touches and real drawing: the left thumb's stick steers, the right thumb's GAS and BRAKE pedals work (BRAKE reverses from a standstill), a wall stops the car; on foot
swipes change lane, jump and slide; at a corner a swipe is the turn; the ARREST button starts the arrest; in the struggle taps anywhere pull the bar. No JavaScript errors.
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
    # corners: near one, a sideways swipe is the turn (not a lane change); the right way takes you round, the wrong way or none meets the wall
    d = pg.evaluate("(() => { const F = __sim.G.foot, t = F.turns[0]; F.obs.length = 0; F.s = t.s - 9; F.gap = 12; F.lane = 1; return t.dir; })()")
    swipe(200, 600, 200 + d * 110, 600); r = pg.evaluate("[__sim.G.foot.turns[0].got, __sim.G.foot.lane]"); ok(r == ['ok', 1], 'at a corner, a swipe the way the alley turns is the turn (the lane stays)', str(r))
    pg.wait_for_function("__sim.G.foot.turns[0].past", timeout=5000); h = pg.evaluate("(() => { const F = __sim.G.foot; F.gap = 12; return [F.stumble, Math.abs(__sim.footAt(F.s + 6).h)]; })()"); ok(h[0] == 0 and abs(h[1] - 1.5708) < 0.01, 'and you are round it without a stumble, running the new way', str(h))
    d = pg.evaluate("(() => { const F = __sim.G.foot, t = F.turns[1]; F.obs.length = 0; F.s = t.s - 9; F.gap = 12; return t.dir; })()")
    swipe(200, 600, 200 - d * 110, 600); pg.wait_for_function("__sim.G.foot.turns[1].past", timeout=5000); r = pg.evaluate("[__sim.G.foot.turns[1].got, __sim.G.foot.stumble > 0]"); ok(r == ['wrong', True], 'a swipe the wrong way: into the wall', str(r))
    pg.evaluate("(() => { const F = __sim.G.foot, t = F.turns[2]; F.s = t.s - 4; F.gap = 12; F.stumble = 0; })()"); pg.wait_for_function("__sim.G.foot.turns[2].past", timeout=5000); ok(pg.evaluate("__sim.G.foot.stumble > 0"), 'no swipe at all: you miss the turn and meet the wall')
    # the ARREST button: a tap elsewhere does nothing while he is out of reach; the button itself, pressed too early, is a dive; lit, it starts the arrest
    ab = pg.evaluate("(() => { const b = __sim.arrestBtn(); return [b.x + b.w / 2, b.y + b.h / 2, b.y + b.h]; })()"); ok(ab[2] <= 844 - 8, 'the ARREST button is on the screen', str(ab))
    pg.evaluate("(() => { const F = __sim.G.foot; F.gap = 9; F.dive = 0; F.stumble = 0; })()"); touch('touchStart', [(1, 200, 400)]); touch('touchEnd', []); r = pg.evaluate("[__sim.G.ph, __sim.G.foot.dive]"); ok(r == ['foot', 0], 'a tap on the alley, too far from him: nothing happens (no dive by accident)', str(r))
    touch('touchStart', [(1, ab[0], ab[1])]); touch('touchEnd', []); ok(pg.evaluate("__sim.G.foot.dive") > 0, 'ARREST pressed too far away: a dive at air')
    pg.evaluate("(() => { const F = __sim.G.foot; F.gap = 1.5; F.dive = 0; })()"); touch('touchStart', [(1, ab[0], ab[1])]); touch('touchEnd', [])
    ok(pg.evaluate("__sim.G.ph") == 'cuff', 'ARREST pressed right behind him: the arrest begins')
    # the struggle: every tap, anywhere, pulls the bar; left alone it drains and he breaks free
    pg.wait_for_timeout(350); m0 = pg.evaluate("__sim.G.cuff.m")
    for i in range(4): touch('touchStart', [(1, 120 + i * 40, 300 + i * 60)]); touch('touchEnd', [])
    m1 = pg.evaluate("__sim.G.cuff.m"); ok(m1 > m0 + 0.15, 'four taps anywhere on the screen pull the bar towards CUFFED', str([m0, m1]))
    touch('touchStart', [(1, 100, 500), (2, 300, 500)]); touch('touchEnd', []); ok(pg.evaluate("__sim.G.cuff.taps") == 6, 'two thumbs at once count as two taps', str(pg.evaluate("__sim.G.cuff.taps")))
    lives = pg.evaluate("__sim.G.lives"); pg.evaluate("__sim.G.cuff.m = 0.05"); pg.wait_for_function("__sim.G.ph === 'foot'", timeout=6000); ok(pg.evaluate("__sim.G.lives") == lives - 1, 'left alone, the bar empties: he breaks free, a life is lost and the chase is on again')
    pg.evaluate("(() => { const F = __sim.G.foot; F.gap = 1.5; })()"); touch('touchStart', [(1, 200, 400)]); touch('touchEnd', []); ok(pg.evaluate("__sim.G.ph") == 'cuff', 'with the button lit, a quick tap anywhere arrests too')
    pg.wait_for_timeout(500); pg.evaluate("__sim.G.cuff.m = 0.97"); touch('touchStart', [(1, ab[0], ab[1])]); touch('touchEnd', []); pg.wait_for_timeout(60); r = pg.evaluate("[__sim.G.over, __sim.G.ph, __sim.G.ph_t, __sim.G.cuff && __sim.G.cuff.m, !!__sim.G.lesson]"); ok(r[0] == 'won', 'the bar full: cuffed, the case is won', str(r))
    pg.wait_for_timeout(400); pg.screenshot(path='/tmp/pc_touch.png'); ok(not errs, 'no JavaScript errors', str(errs[:3]))
    b.close()
print(f'\n{oks} checks passed, {len(fails)} failed.')
sys.exit(1 if fails else 0)
