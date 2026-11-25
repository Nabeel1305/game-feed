#!/usr/bin/env python3
"""Drift Kings with real touches: the left thumb slid right steers right, slid left steers left, let go goes straight; a hard slide at speed starts a drift; a tap on the right half uses the item (and is not a steer) (up the screen is
up, right is right); a short drag swims, a long one dashes (the blue bar goes down); letting go eases off; a drag that starts
on the top bar still steers. No JavaScript errors.
Run: python3 games/kart/test_touch.py"""
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
    pg.evaluate("localStorage.setItem('dk.taught', '3'); __sim.go(1); __sim.ui.snap = true;"); pg.wait_for_timeout(400)
    cdp = ctx.new_cdp_session(pg)
    def touch(kind, x, y): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [] if kind == 'touchEnd' else [{'x': x, 'y': y, 'id': 1}]})
    def drag(x0, y0, x1, y1, hold=600):
        touch('touchStart', x0, y0); pg.wait_for_timeout(30)
        for i in range(1, 7): touch('touchMove', x0 + (x1 - x0) * i / 6, y0 + (y1 - y0) * i / 6); pg.wait_for_timeout(16)
        pg.wait_for_timeout(hold)
    def heading(): return pg.evaluate("(() => { const m = __sim.G.me, a = __sim.scr(m.x, 0, m.z), b = __sim.scr(m.x + Math.cos(m.face), 0, m.z + Math.sin(m.face)); return [b.x - a.x, b.y - a.y]; })()")
    pg.wait_for_timeout(5200)
    drag(90, 650, 120, 650, 200); st = pg.evaluate("__sim.G.steer"); ok(0.3 < st < 0.75, 'left thumb slid a little right: a gentle right turn', str(st))
    touch('touchEnd', 0, 0); pg.wait_for_timeout(80); ok(pg.evaluate("__sim.G.steer") == 0, 'let go: straight')
    h0 = pg.evaluate("__sim.G.me.h"); drag(120, 650, 60, 650, 500); st = pg.evaluate("[__sim.G.steer, __sim.G.me.h, __sim.G.me.drift]")
    ok(st[0] <= -0.95, 'slid well left: a hard left', str(st)); ok(st[2] == 0, 'a hard turn alone does not start a drift (25 Nov 2026: DRIFT is a button to hold)', str(st))
    # his words (25 Nov 2026): "holding one part then using the joystick": the right thumb holds DRIFT (a mouse here, beside the touch that steers)
    touch('touchEnd', 0, 0); pg.wait_for_timeout(80); STRAIGHT = "(() => { const G = __sim.G, S = G.T.S, n = S.length; let best = 0, bc = 1e9; for (let i = 0; i < n; i += 5) { let c = 0; for (let j = 0; j < 60; j++) c += Math.abs(S[(i + j) % n].curve); if (c < bc) { bc = c; best = i; } } const p = S[best], m = G.me; m.x = p.x + Math.sin(p.h) * 3; m.z = p.z - Math.cos(p.h) * 3; m.h = p.h + 0.5; m.i = best; m.last = best; m.v = 22; m.spin = 0; m.slip = 0; m.drift = 0; m.charge = 0; __sim.ui.snap = true; })()"
    pg.evaluate(STRAIGHT)      # (the hard turn above scrubbed his speed off and ran him wide: put him on the longest straight, at speed, a little to the left and pointing a little right, so a slide to the left and then to the right stays on the road)
    B = pg.evaluate("__sim.btnRects()"); pg.mouse.move(B['drift']['x'], B['drift']['y']); pg.mouse.down(); drag(120, 650, 60, 650, 250); d = pg.evaluate("[__sim.G.driftHeld, __sim.G.me.drift, __sim.G.steer, __sim.G.me.v, __sim.G.me.spin, __sim.G.count]")
    ok(d[0] and d[1] == -1, 'DRIFT held while steering left: the kart drifts left', str(d))
    # 25 Nov 2026, later (his words): "allow manoeuvring throughout a drift, including switching from drifting left to drifting right without being
    # locked into the initial direction... Build turbo while drifting... with a clearly visible meter"
    pg.wait_for_timeout(120); pg.evaluate("__sim.G.me.v = 22; __sim.G.me.spin = 0"); c0 = pg.evaluate("__sim.G.me.charge"); h0 = pg.evaluate("__sim.G.me.h")
    for i in range(1, 9): touch('touchMove', 60 + 120 * i / 8, 650); pg.wait_for_timeout(16)
    pg.wait_for_timeout(200); sw = pg.evaluate("[__sim.G.me.drift, __sim.G.me.charge, __sim.G.steer, __sim.G.me.h]")
    ok(sw[0] == 1 and sw[2] > 0.9, 'still holding DRIFT, the thumb slid across to the right: the slide changes side (it used to stay locked to the left)', str(sw))
    ok(sw[1] >= c0 and sw[1] > 0, 'and the turbo that was built is kept, and goes on building', str([c0, sw[1]]))
    pg.evaluate("__sim.G.me.v = 22"); pg.wait_for_timeout(200); h1 = pg.evaluate("__sim.G.me.h"); ok((h1 - sw[3]) * sw[2] > 0.05, 'in the drift the kart turns the way the stick is pushed', str([sw[3], h1]))
    bar = pg.evaluate("(() => { __sim.frame(); const c = document.getElementById('cv'), g = c.getContext('2d'), k2 = c.width / innerWidth, y = Math.round((innerHeight * 0.8 + 8) * k2); let lit = 0; for (let x = Math.round(innerWidth * 0.3 * k2); x < innerWidth * 0.7 * k2; x += 4) { const d = g.getImageData(x, y, 1, 1).data; if (d[3] > 200 && d[0] + d[1] + d[2] > 330) lit++; } return lit; })()")
    ok(bar >= 3, 'the turbo meter is drawn in the middle of the screen and is filling', str(bar))
    pg.wait_for_timeout(250); tier = pg.evaluate("__sim.G.me.tier"); pg.mouse.up(); pg.wait_for_timeout(120); r = pg.evaluate("[__sim.G.me.drift, __sim.G.me.boost > 0, __sim.G.driftHeld]")
    ok(r[0] == 0 and not r[2] and (r[1] or not tier), 'DRIFT let go: the drift ends, with a boost if the sparks had come', str([r, tier]))
    touch('touchEnd', 0, 0); pg.wait_for_timeout(120)
    pg.evaluate("__sim.G.me.item = 'turbo'; __sim.G.me.boost = 0"); pg.touchscreen.tap(B['item']['x'], B['item']['y']); pg.wait_for_timeout(120); r = pg.evaluate("[__sim.G.me.item, __sim.G.me.boost > 0, __sim.G.steer]")
    ok(r[0] is None and r[1], 'a tap on the item button uses the item (a Turbo: boost)', str(r)); ok(r[2] == 0, 'a tap on the right does not steer', str(r))
    pg.wait_for_timeout(200); pg.screenshot(path='/tmp/dk_touch.png'); ok(not errs, 'no JavaScript errors', str(errs[:3]))
    b.close()
print(f'\n{oks} checks passed, {len(fails)} failed.')
sys.exit(1 if fails else 0)
