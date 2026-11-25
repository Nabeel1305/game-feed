#!/usr/bin/env python3
"""Ramp Riders with real touches: four buttons, each doing one thing (BACK FLIP and FRONT FLIP spin the bike in the air and do
nothing on the ground; LEAN BACK and LEAN FWD tip it, and both together brake); a touch off the buttons does nothing. No JavaScript errors.
Run: python3 games/ramp/test_touch.py"""
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
    pg.goto('file://' + os.path.join(here, 'index.html')); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(600)
    pg.evaluate("localStorage.setItem('rr.taught', '3'); __sim.go(3);"); pg.wait_for_timeout(500)
    cdp = ctx.new_cdp_session(pg)
    def touch(kind, pts): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, (x, y) in enumerate(pts)]})
    # 25 Nov 2026 (his words: "the controls flipping and just leaning back is confusing make it so you actually have to click the button to leaning
    # back so the buttons for flipping will be clear"): four buttons, each drawn where it is pressed, each doing one thing
    P = pg.evaluate("__sim.padRects()"); C = lambda id: (P[id]['x'] + P[id]['w'] / 2, P[id]['y'] + P[id]['h'] / 2); H = "JSON.stringify(__sim.G.hold)"
    import json
    def held(pts): touch('touchStart', pts); pg.wait_for_timeout(120); h = json.loads(pg.evaluate(H)); touch('touchEnd', []); pg.wait_for_timeout(80); return sorted(k for k, v in h.items() if v)
    ok(held([C('bl')]) == ['bl'], 'LEAN BACK pressed: leaning back, and nothing else')
    ok(held([C('br')]) == ['br'], 'LEAN FWD pressed: leaning forward, and nothing else')
    ok(held([C('l')]) == ['l'], 'BACK FLIP pressed: the back flip button, and nothing else')
    ok(held([C('r')]) == ['r'], 'FRONT FLIP pressed: the front flip button, and nothing else')
    ok(held([C('bl'), C('br')]) == ['bl', 'br'] and pg.evaluate("(() => { __sim.G.hold.bl = __sim.G.hold.br = true; const r = __sim.leanNow(); __sim.G.hold.bl = __sim.G.hold.br = false; return r; })()") == 'brake', 'both LEAN buttons: a brake')
    ok(held([(195, 400)]) == [] and held([(80, 300)]) == [], 'a touch anywhere else does nothing (it used to lean: the whole half of the screen was the button)')
    ok(pg.evaluate(H) == '{"l":false,"r":false,"bl":false,"br":false}', 'letting go lets go')
    # the picture: each button's own name is drawn on it
    # on the ground a FLIP button does not lean him or slow him; LEAN BACK does
    def ground(pad, ms=500):
        pg.evaluate("(() => { const G = __sim.G; G.wait = 0; G.b.air = false; G.b.x = 6; G.b.vx = 8; G.b.vy = 0; })()"); touch('touchStart', [C(pad)] if pad else []) if pad else None; pg.wait_for_timeout(ms); r = pg.evaluate("[__sim.leanNow(), __sim.G.b.air]"); touch('touchEnd', []) if pad else None; pg.wait_for_timeout(60); return r
    r = ground('l'); ok(r[0] == 0, 'on the ground BACK FLIP does not lean him back (flipping and leaning are two buttons now)', str(r))
    r = ground('bl'); ok(r[0] == 1, 'on the ground LEAN BACK leans him back', str(r))
    # in the air: FLIP spins fast, LEAN tips gently
    def air(pad, ms=300):
        pg.evaluate("(() => { const G = __sim.G; G.wait = 0; G.b.air = true; G.b.y = 60; G.b.vy = 6; G.b.vx = 6; G.b.w = 0; G.b.a = 0; G.b.spin = 0; })()"); touch('touchStart', [C(pad)]); pg.wait_for_timeout(ms); a = pg.evaluate("[__sim.G.b.a, __sim.G.b.w]"); touch('touchEnd', []); pg.wait_for_timeout(60); return a
    fb, ff, lb, lf = air('l'), air('r'), air('bl'), air('br')
    ok(fb[1] > 4.5 and ff[1] < -4.5, 'in the air BACK FLIP spins the nose up and over, FRONT FLIP the other way', str([fb, ff]))
    ok(0.3 < lb[1] < 3.6 and -3.6 < lf[1] < -0.3, 'in the air LEAN BACK and LEAN FWD tip it gently (about half as fast as a flip)', str([lb, lf]))
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
