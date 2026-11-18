#!/usr/bin/env python3
"""Star Miner with real touches: a thumb put down anywhere and dragged flies the ship that way on screen (up the screen is
up, right is right); a short drag swims, a long one dashes (the blue bar goes down); letting go eases off; a drag that starts
on the top bar still steers. No JavaScript errors.
Run: python3 games/miner/test_touch.py"""
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
    pg.evaluate("localStorage.setItem('sm.taught', '3'); __sim.go(1); __sim.ui.snap = true;"); pg.wait_for_timeout(400)
    cdp = ctx.new_cdp_session(pg)
    def touch(kind, x, y): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [] if kind == 'touchEnd' else [{'x': x, 'y': y, 'id': 1}]})
    def drag(x0, y0, x1, y1, hold=600):
        touch('touchStart', x0, y0); pg.wait_for_timeout(30)
        for i in range(1, 7): touch('touchMove', x0 + (x1 - x0) * i / 6, y0 + (y1 - y0) * i / 6); pg.wait_for_timeout(16)
        pg.wait_for_timeout(hold)
    def heading(): return pg.evaluate("(() => { const m = __sim.G.me, a = __sim.scr(m.x, 0, m.z), b = __sim.scr(m.x + Math.cos(m.face), 0, m.z + Math.sin(m.face)); return [b.x - a.x, b.y - a.y]; })()")
    drag(200, 600, 200, 540); h = heading(); st = pg.evaluate("[__sim.G.stick.x, __sim.G.stick.z]")
    ok(h[1] < 0 and abs(h[0]) < abs(h[1]), 'a drag up the screen: the ship flies up the screen', str(h)); ok(st[1] < -0.5, 'the stick points up', str(st))
    touch('touchEnd', 0, 0); pg.wait_for_timeout(100); ok(pg.evaluate("Math.hypot(__sim.G.stick.x, __sim.G.stick.z)") == 0, 'letting go lets the stick go')
    v0 = pg.evaluate("Math.hypot(__sim.G.me.vx, __sim.G.me.vz)"); pg.wait_for_timeout(900); v1 = pg.evaluate("Math.hypot(__sim.G.me.vx, __sim.G.me.vz)"); ok(v1 < v0, 'let go, it drifts and slows', str([v0, v1]))
    drag(100, 500, 220, 500, 700); h = heading(); ok(h[0] > 0 and abs(h[1]) < h[0], 'a drag to the right: it flies to the right of the screen', str(h))
    s1 = pg.evaluate("Math.hypot(__sim.G.stick.x, __sim.G.stick.z)"); touch('touchEnd', 0, 0); pg.wait_for_timeout(60)
    drag(200, 500, 225, 500, 300); s2 = pg.evaluate("Math.hypot(__sim.G.stick.x, __sim.G.stick.z)"); ok(s2 < s1 * 0.6, 'a short drag flies slower than a long one', str([s1, s2])); touch('touchEnd', 0, 0); pg.wait_for_timeout(60)
    drag(200, 70, 200, 200, 500); h = heading(); ok(h[1] > 0, 'a drag that starts on the top bar still steers (down the screen)', str(h)); touch('touchEnd', 0, 0)
    pg.wait_for_timeout(200); pg.screenshot(path='/tmp/sm_touch.png'); ok(not errs, 'no JavaScript errors', str(errs[:3]))
    b.close()
print(f'\n{oks} checks passed, {len(fails)} failed.')
sys.exit(1 if fails else 0)
