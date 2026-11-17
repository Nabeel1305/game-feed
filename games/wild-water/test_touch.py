#!/usr/bin/env python3
"""Wild Water with real touches and real drawing: a swipe down on the left half is a left stroke (the bow swings right), on the
right half a right stroke; a swipe up back-paddles; a quick tap is a light stroke; two thumbs at once both count; a stroke asked
for during a stroke waits its turn. No JavaScript errors. Run: python3 games/wild-water/test_touch.py"""
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
    pg.evaluate("localStorage.setItem('ww.taught', '3'); __sim.go(4); __sim.G.lesson = null;"); pg.wait_for_timeout(300)
    cdp = ctx.new_cdp_session(pg)
    def touch(kind, pts): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, x, y in pts]})
    def swipe(x, y0, y1, n=4):
        touch('touchStart', [(1, x, y0)])
        for j in range(1, n + 1): touch('touchMove', [(1, x, y0 + (y1 - y0) * j / n)])
        touch('touchEnd', [])
    def state(): return pg.evaluate("(() => { const b = __sim.G.b; return { side: b.side, back: b.back, stroke: b.stroke, w: b.w, v: b.v, q: __sim.G.queue.length }; })()")
    pg.evaluate("__sim.G.b.w = 0; __sim.G.b.stroke = 0;"); swipe(90, 500, 620); s = state()
    ok(s['side'] == -1 and s['back'] == 0 and s['w'] > 0.2, 'a swipe down on the left is a left stroke, and the bow swings right', str(s))
    pg.evaluate("__sim.G.b.w = 0; __sim.G.b.stroke = 0;"); swipe(300, 500, 620); s = state()
    ok(s['side'] == 1 and s['back'] == 0 and s['w'] < -0.2, 'on the right: a right stroke, the bow swings left', str(s))
    pg.evaluate("__sim.G.b.w = 0; __sim.G.b.stroke = 0; __sim.G.b.v = 2;"); swipe(90, 620, 500); s = state()
    ok(s['side'] == -1 and s['back'] == 1 and s['v'] < 2 and s['w'] < 0, 'a swipe up on the left back-paddles: slower, bow swings left', str(s))
    pg.evaluate("__sim.G.b.w = 0; __sim.G.b.stroke = 0;"); touch('touchStart', [(1, 300, 600)]); touch('touchEnd', []); s = state()
    ok(s['side'] == 1 and s['stroke'] > 0, 'a quick tap is a light stroke', str(s))
    # two thumbs at once: both strokes happen (the second waits for the first)
    pg.evaluate("__sim.G.b.w = 0; __sim.G.b.stroke = 0; __sim.G.queue.length = 0;")
    touch('touchStart', [(1, 90, 500), (2, 300, 500)])
    for j in range(1, 5): touch('touchMove', [(1, 90, 500 + 30 * j), (2, 300, 500 + 30 * j)])
    touch('touchEnd', []); s = state()
    ok(s['stroke'] > 0 and s['q'] == 1, 'two thumbs at once: one stroke now, the other waits its turn', str(s))
    pg.wait_for_timeout(1200); pg.screenshot(path='/tmp/ww_touch.png')
    ok(not errs, 'no JavaScript errors', str(errs[:3]))
    b.close()
print(f'\n{oks} checks passed, {len(fails)} failed.')
sys.exit(1 if fails else 0)
