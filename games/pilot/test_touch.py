#!/usr/bin/env python3
"""Pilot with real touches and real drawing: four buttons that never move (UP, DOWN, LEFT, RIGHT; no joystick; left and
right it banks); the left thumb slides the throttle; both at once. A flight starts on the runway; a drag on the open screen only looks around. No JavaScript errors. Run: python3 games/pilot/test_touch.py"""
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
    pg.evaluate("localStorage.setItem('av.taught', '3'); __sim.go(4); __sim.G.lesson = null;"); pg.wait_for_timeout(300)
    cdp = ctx.new_cdp_session(pg)
    def touch(kind, pts): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, x, y in pts]})
    E = pg.evaluate; P = E("__sim.pad()"); up = (P['x'], P['y'] - P['d']); dn = (P['x'], P['y'] + P['d']); lf = (P['x'] - P['d'], P['y']); rt = (P['x'] + P['d'], P['y'])
    # his words, 23 Nov 2026, 13:47: four buttons in one place; "if you press this one, it goes up... this one, it goes down... left... right"; no joystick
    t0 = E("__sim.G.thr"); touch('touchStart', [(1, 40, 600)])
    for j in range(1, 5): touch('touchMove', [(1, 40, 600 - 30 * j)])
    ok(E("__sim.G.thr") > t0 + 0.2, 'left thumb slid up the POWER lever: more power', str(t0)); touch('touchEnd', [])
    # his note (23 Nov 2026): "Start on a recognisable runway, ready for takeoff... Allow a complete flight from taking off". On the runway, at the ROTATE speed, holding UP lifts her off
    ok(E("__sim.G.ph") == 'takeoff' and abs(E("__sim.G.ac.y")) < 0.01, 'the flight starts on the runway, ready for take-off', E("__sim.G.ph"))
    E("__sim.G.thr = 1; __sim.G.ac.v = 63"); pg.wait_for_timeout(1200); touch('touchStart', [(2, up[0], up[1])]); pg.wait_for_timeout(2500); r = E("[__sim.G.ph, __sim.G.ac.y, __sim.G.st.y]")
    ok(r[0] == 'air' and r[1] > 1 and r[2] > 0.3, 'at the ROTATE speed, holding UP lifts her off the runway', str(r))
    th0 = E("__sim.G.ac.th"); pg.wait_for_timeout(1000); ok(E("__sim.G.ac.th") > th0 - 0.01 and E("__sim.G.ac.y") > r[1], 'holding UP keeps her climbing', str(th0)); touch('touchEnd', []); ok(E("[__sim.G.st.x, __sim.G.st.y]") == [0, 0], 'let go: nothing pressed')
    E("__sim.approach(6000, 0)"); pg.wait_for_timeout(300); y0 = E("__sim.G.ac.y"); touch('touchStart', [(2, dn[0], dn[1])]); pg.wait_for_timeout(3000); r = E("[__sim.G.ac.y, __sim.G.ac.vy, __sim.G.st.y]")
    ok(r[2] < -0.3 and r[1] < -6 and r[0] < y0 - 15, 'pressing DOWN: the plane goes down (his review: "I literally cannot descend")', f'{y0} {r}'); pg.screenshot(path='/tmp/pl_down.png'); touch('touchEnd', [])
    touch('touchStart', [(2, lf[0], lf[1])]); pg.wait_for_timeout(700); r = E("[__sim.G.st.x, __sim.G.ac.phi]"); ok(r[0] < -0.3 and r[1] < -0.05, 'pressing LEFT banks left', str(r))
    touch('touchMove', [(2, rt[0], rt[1])]); pg.wait_for_timeout(1200); r = E("[__sim.G.st.x, __sim.G.ac.phi]"); ok(r[0] > 0.3 and r[1] > 0.05, 'the thumb slid across to RIGHT: banks right', str(r)); touch('touchEnd', [])
    # his note: "Drag your thumb across the screen to move the camera naturally—right to look right... vertically to look up or down. Allow looking around without accidentally changing the plane's flight controls"
    touch('touchStart', [(2, 200, 400)]); [touch('touchMove', [(2, 200 + 15 * j, 400)]) for j in range(1, 9)]; r = E("[__sim.G.st.x, __sim.G.st.y, __sim.V3.look2.yaw, __sim.G.ac.phi]")
    ok(r[0] == 0 and r[1] == 0 and r[2] > 0.5, 'a drag to the right on the open screen turns the view to the right, and touches no control', str(r)); pg.wait_for_timeout(400); pg.screenshot(path='/tmp/pl_look.png')
    [touch('touchMove', [(2, 320, 400 - 12 * j)]) for j in range(1, 8)]; r = E("[__sim.V3.look2.pitch, __sim.G.st.y]"); ok(r[0] > 0.3 and r[1] == 0, 'a drag upwards looks up, and does not lift the nose', str(r)); touch('touchEnd', [])
    pg.wait_for_timeout(3500); r = E("[__sim.V3.look2.yaw, __sim.V3.look2.pitch]"); ok(abs(r[0]) < 0.2 and abs(r[1]) < 0.15, 'let go: the view swings back behind the plane', str(r))

    touch('touchStart', [(1, 40, 600), (2, up[0], up[1])]); touch('touchMove', [(1, 40, 560), (2, up[0], up[1])]); r = E("[__sim.G.st.y, __sim.G.thr]"); ok(r[0] > 0.3, 'both thumbs at once: power and UP', str(r)); touch('touchEnd', [])
    # flight 1: the autopilot helps with the height, and DOWN still takes the plane down
    E("localStorage.removeItem('av.taught'); __sim.go(1)"); pg.wait_for_timeout(700); ok(E("!!(__sim.G.lesson && __sim.G.ph === 'takeoff')"), 'flight 1 starts with the take-off lesson, on the runway', '')
    E("__sim.G.lesson.i = 1; __sim.approach(2500, 0)"); pg.wait_for_timeout(300); ok(E("!!__sim.LESSONS[1][1].autoPitch"), 'its landing lesson has the autopilot helping', '')
    ya = E("__sim.G.ac.y"); pg.wait_for_timeout(2500); yb = E("__sim.G.ac.y"); touch('touchStart', [(2, dn[0], dn[1])]); pg.wait_for_timeout(2500); yc = E("__sim.G.ac.y"); touch('touchEnd', [])
    ok((yb - yc) > (ya - yb) + 6, 'on flight 1 DOWN still takes it down faster than the autopilot alone', f'{ya} {yb} {yc}'); pg.screenshot(path='/tmp/pl_auto.png')
    pg.wait_for_timeout(400); pg.screenshot(path='/tmp/pl_touch.png'); ok(not errs, 'no JavaScript errors', str(errs[:3]))
    b.close()
print(f'\n{oks} checks passed, {len(fails)} failed.')
sys.exit(1 if fails else 0)
