#!/usr/bin/env python3
"""On the Run with real touches and real drawing: a swipe left or right changes lane, a swipe up or a quick tap fires nitro;
on foot a swipe left or right changes alley lane, up jumps, down slides; at a corner a sideways swipe is the turn. No JavaScript errors.
Run: python3 games/run/test_touch.py"""
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
    pg.evaluate("localStorage.setItem('or.taught', '3'); __sim.go(4); __sim.G.lesson = null; __sim.G.me.lane = 1; __sim.G.traffic.length = 0; __sim.G.me.imm = 99;"); pg.wait_for_timeout(300)
    cdp = ctx.new_cdp_session(pg)
    def touch(kind, pts): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, x, y in pts]})
    def swipe(x0, y0, x1, y1):
        touch('touchStart', [(1, x0, y0)])
        for j in range(1, 5): touch('touchMove', [(1, x0 + (x1 - x0) * j / 4, y0 + (y1 - y0) * j / 4)])
        touch('touchEnd', []); pg.wait_for_timeout(60)
    swipe(200, 600, 100, 600); ok(pg.evaluate("__sim.G.me.lane") == 0, 'swipe left: one lane left')
    swipe(150, 600, 300, 600); swipe(150, 600, 300, 600); ok(pg.evaluate("__sim.G.me.lane") == 2, 'two swipes right: two lanes right')
    n0 = pg.evaluate("__sim.G.nitro"); touch('touchStart', [(1, 200, 600)]); touch('touchEnd', []); pg.wait_for_timeout(60)
    ok(pg.evaluate("__sim.G.boost") > 0 and pg.evaluate("__sim.G.nitro") == n0 - 1, 'a quick tap: nitro')
    pg.evaluate("__sim.G.boost = 0"); n1 = pg.evaluate("__sim.G.nitro"); swipe(200, 640, 200, 500)
    ok(pg.evaluate("__sim.G.nitro") == n1 - 1, 'a swipe up: nitro too')
    pg.evaluate("__sim.startFoot()"); pg.wait_for_timeout(100)
    swipe(200, 600, 100, 600); ok(pg.evaluate("__sim.G.foot.lane") == 0, 'on foot, swipe left: left side of the alley')
    swipe(200, 600, 200, 480); ok(pg.evaluate("__sim.G.foot.air") > 0, 'on foot, swipe up: jump')
    pg.evaluate("__sim.G.foot.air = 0"); swipe(200, 500, 200, 640); ok(pg.evaluate("__sim.G.foot.low") > 0, 'on foot, swipe down: slide')
    # corners (23 Nov 2026): near one, a sideways swipe is the turn (not a lane change); the right way takes you round, the wrong way or none meets the wall
    d = pg.evaluate("(() => { const F = __sim.G.foot, t = F.turns[0]; F.obs.length = 0; F.s = t.s - 9; F.gap = 30; F.lane = 1; return t.dir; })()")
    swipe(200, 600, 200 + d * 110, 600); r = pg.evaluate("[__sim.G.foot.turns[0].got, __sim.G.foot.lane]"); ok(r == ['ok', 1], 'at a corner, a swipe the way the alley turns is the turn (the lane stays)', str(r))
    pg.wait_for_function("__sim.G.foot.turns[0].past", timeout=5000); h = pg.evaluate("(() => { const F = __sim.G.foot; F.gap = 30; return [F.stumble, Math.abs(__sim.footAt(F.s + 6).h)]; })()"); ok(h[0] == 0 and abs(h[1] - 1.5708) < 0.01, 'and you are round it without a stumble, running the new way', str(h))
    d = pg.evaluate("(() => { const F = __sim.G.foot, t = F.turns[1]; F.obs.length = 0; F.s = t.s - 9; F.gap = 30; return t.dir; })()")
    swipe(200, 600, 200 - d * 110, 600); pg.wait_for_function("__sim.G.foot.turns[1].past", timeout=5000); r = pg.evaluate("[__sim.G.foot.turns[1].got, __sim.G.foot.stumble > 0]"); ok(r == ['wrong', True], 'a swipe the wrong way: into the wall', str(r))
    pg.wait_for_timeout(400); pg.screenshot(path='/tmp/or_touch.png'); ok(not errs, 'no JavaScript errors', str(errs[:3]))
    b.close()
print(f'\n{oks} checks passed, {len(fails)} failed.')
sys.exit(1 if fails else 0)
