#!/usr/bin/env python3
"""Rex with real touches: the left thumb lands and slides up (a stride: the stick reads forward and the rex moves), far up
(a charge); the BITE and ROAR buttons work; letting go stops. No JavaScript errors.
Run: python3 games/rex/test_touch.py"""
import os, math, sys
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
    pg.evaluate("localStorage.setItem('rx.taught', '3'); __sim.go(2);"); pg.wait_for_timeout(600)
    z0 = pg.evaluate("__sim.G.me.z")
    S = pg.evaluate("(() => { const s = __sim.stickBase(); return [s.x, s.y, s.r]; })()")      # the stick never moves (23 Nov 2026): bottom left
    sx0, sy0, sr = S
    pg.mouse.move(sx0, sy0); pg.mouse.down(); pg.mouse.move(sx0, sy0 - sr * 0.6, steps=4); pg.wait_for_timeout(800)
    ok(0.3 < pg.evaluate("__sim.G.in.sy") < 0.9 and not pg.evaluate("__sim.G.me.run"), 'a short push up strides', str(pg.evaluate("[__sim.G.in.sy, __sim.G.me.run]")))
    pg.mouse.move(sx0, sy0 - sr * 1.2, steps=4); pg.wait_for_timeout(500); ok(pg.evaluate("__sim.G.me.run"), 'pushed far: a charge')
    pg.mouse.up(); pg.wait_for_timeout(200); ok(pg.evaluate("__sim.G.in.sy") == 0, 'letting go stops the stick'); ok(pg.evaluate("Math.hypot(__sim.G.me.x, __sim.G.me.z - (%f))" % z0) > 2, 'the rex moved')
    # his words (23 Nov 2026): "I go left it goes somewhere else"; (25 Nov 2026): "Joystick still doesnt work if i go left it goes right". The test
    # of the 23rd worked the directions out on paper (world angles) and passed while the game was mirrored. This one asks the CAMERA: which way is
    # the screen's right, which way is into the screen; push each way and measure how far he went along each. The view must not turn while he does.
    pg.wait_for_timeout(1500)
    AX = "(() => { const c = __sim.W3.cam; c.updateMatrixWorld(); const r = new THREE.Vector3(1, 0, 0).applyQuaternion(c.quaternion), f = new THREE.Vector3(0, 0, -1).applyQuaternion(c.quaternion); const fl = Math.hypot(f.x, f.z) || 1; return [r.x, r.z, f.x / fl, f.z / fl, __sim.G.me.x, __sim.G.me.z, __sim.ui.camYaw]; })()"
    for name, dx, dy in [('left', -1, 0), ('right', 1, 0), ('down', 0, 1), ('up', 0, -1), ('up-left', -0.7, -0.7)]:
        e0 = pg.evaluate(AX)
        pg.mouse.move(sx0, sy0); pg.mouse.down(); pg.mouse.move(sx0 + dx * sr * 0.8, sy0 + dy * sr * 0.8, steps=4); pg.wait_for_timeout(1800)
        # 25 Nov 2026 ("the joystick is still inverted"): he went the right way, but the KNOB was drawn from the rules' own number and slid the other way
        # across. Look at the picture: the white knob is under the thumb, and not at the place mirrored across the stick.
        tx, ty = sx0 + dx * sr * 0.8, sy0 + dy * sr * 0.8; KN = "(([x, y]) => { __sim.frame(); const c = document.getElementById('cv'), d = c.getContext('2d').getImageData(Math.round(x * c.width / innerWidth), Math.round(y * c.height / innerHeight), 1, 1).data; return d[3] > 150 && d[0] > 200 ? 1 : 0; })"
        under, across = pg.evaluate(KN, [tx, ty]), pg.evaluate(KN, [2 * sx0 - tx, 2 * sy0 - ty])
        ok(under == 1 and across == 0, f'the stick pushed {name}: the knob is drawn under the thumb, not across from it', str([under, across]))
        e1 = pg.evaluate(AX); pg.mouse.up(); pg.wait_for_timeout(900)
        mx, mz = e1[4] - e0[4], e1[5] - e0[5]; right = mx * e0[0] + mz * e0[1]; into = mx * e0[2] + mz * e0[3]; n = math.hypot(dx, dy); wr, wi = dx / n, -dy / n; d = math.hypot(right, into) or 1
        ok(d > 1.5 and (right / d) * wr + (into / d) * wi > 0.9 and abs(e1[6] - e0[6]) < 0.01, f'the stick pushed {name}: he walks {name} ON THE SCREEN (measured with the camera); the view holds still', str([round(right, 1), round(into, 1), round(math.degrees(e1[6] - e0[6]), 1)]))
    # "make the joystick in one place, not everywhere I tap": a touch in the middle of the screen does not walk him; dragging it turns the view
    p0 = pg.evaluate("[__sim.G.me.x, __sim.G.me.z]"); e0 = pg.evaluate(AX)
    pg.mouse.move(200, 380); pg.mouse.down(); pg.mouse.move(320, 380, steps=6); pg.wait_for_timeout(600); moved = pg.evaluate("Math.hypot(__sim.G.me.x - %f, __sim.G.me.z - %f)" % tuple(p0)); pg.mouse.up(); pg.wait_for_timeout(200)
    ok(moved < 0.3 and pg.evaluate("__sim.G.in.sx") == 0, 'a touch away from the stick does not walk him', str(moved))
    e1 = pg.evaluate(AX); lean = e1[2] * e0[0] + e1[3] * e0[1]      # the new way he looks, measured along the OLD screen-right: plus = the view turned right
    ok(lean > 0.5, 'dragging the screen right turns the view to the right (measured with the camera)', str(round(lean, 2)))
    B = pg.evaluate("__sim.btnRects()"); n0 = pg.evaluate("__sim.G.bites")
    pg.touchscreen.tap(B['bite']['x'] + B['bite']['w'] / 2, B['bite']['y'] + B['bite']['h'] / 2); pg.wait_for_timeout(150); ok(pg.evaluate("__sim.G.bites") == n0 + 1, 'BITE bites')
    pg.touchscreen.tap(B['roar']['x'] + B['roar']['w'] / 2, B['roar']['y'] + B['roar']['h'] / 2); pg.wait_for_timeout(150); ok(pg.evaluate("__sim.G.me.roarCD") > 0, 'ROAR roars')
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
