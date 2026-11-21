#!/usr/bin/env python3
"""Balloon Drift with real touches (a phone held upright): holding anywhere fires the burner and letting go stops it; the
balloon rises (a little late) and stops climbing when you stop; a quick flick down vents; 🎯 drops a marker (not on the ground),
and the marker lands where the ring said. Then the rules: the wind at each height carries the balloon its own way; a marker is
worth more the closer it lands; a hard landing is a bump, three bumps end the flight; the wires end it; out of fuel the burner
stops; landing once the X are done ends the flight and points enough win, too few lose. The Settings switch Music, Sound
effects and Vibration on their own and remember them. No errors.
Run: python3 games/balloon/test_touch.py"""
import os, sys
from playwright.sync_api import sync_playwright
here = os.path.dirname(os.path.abspath(__file__)); fails = []; oks = 0
def ok(c, what, d=''):
    global oks
    if c: oks += 1; print('  ok  ', what)
    else: fails.append(what); print('  FAIL', what, d)
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']); ctx = b.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True); pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + os.path.join(here, 'index.html')); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(800)
    E = pg.evaluate; E("Object.assign(window, __sim.x())"); cdp = ctx.new_cdp_session(pg)
    def touch(kind, pts): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, (x, y) in pts]})
    def tap(x, y): touch('touchStart', [(5, (x, y))]); touch('touchEnd', [(5, (x, y))]); pg.wait_for_timeout(80)
    def until(js, ms=20000):
        try: pg.wait_for_function(js, timeout=ms); return True
        except Exception: return False
    AGL = "(__sim.G.b.y - groundAt(__sim.G, __sim.G.b.x, __sim.G.b.z))"
    E("localStorage.setItem('bln.taught', '3'); __sim.go(3)"); pg.wait_for_timeout(400); E("__sim.G.limit = 1e9")
    ok(E("__sim.G.b.landed") is True, 'the flight starts on the ground')
    D = E("__sim.layout().drop"); tap(D['x'], D['y']); ok(E("__sim.G.markers.length") == 0, 'on the ground 🎯 drops nothing')
    touch('touchStart', [(1, (180, 500))]); pg.wait_for_timeout(150); ok(E("__sim.G.b.burn") is True, 'holding anywhere fires the burner')
    ok(until(f"{AGL} > 12", 25000), 'the balloon rises', E(AGL))
    touch('touchEnd', [(1, (180, 500))]); pg.wait_for_timeout(100); ok(E("__sim.G.b.burn") is False, 'letting go stops the burner')
    ok(until("__sim.G.b.vy < 0.3", 20000), 'and it stops climbing (a little late)', E("__sim.G.b.vy"))
    touch('touchStart', [(1, (180, 400))]); pg.wait_for_timeout(40); touch('touchMove', [(1, (180, 450))]); touch('touchMove', [(1, (180, 520))]); pg.wait_for_timeout(40); touch('touchEnd', [(1, (180, 520))]); pg.wait_for_timeout(60)
    ok(E("__sim.G.b.vent") > 0 and E("__sim.G.b.burn") is False, 'a quick flick down vents', str([E("__sim.G.b.vent"), E("__sim.G.b.burn")]))
    E("(() => { const G = __sim.G, b = G.b; b.y = groundAt(G, b.x, b.z) + 60; b.heat = neutral(60); b.vy = 0; b.landed = false; b.air = true; })()")
    pr = E("predictDrop(__sim.G)"); tap(D['x'], D['y']); ok(E("__sim.G.markers.length") == 1, '🎯 drops a marker in the air')
    ok(until("!__sim.G.markers[0].falling", 15000), '(it falls)'); m = E("__sim.G.markers[0]"); d = ((m['x'] - pr['x']) ** 2 + (m['z'] - pr['z']) ** 2) ** 0.5
    ok(d < 6, 'the marker lands where the ring said', str(d))
    # ---------- the rules ----------
    W = E("""(() => { __sim.start(6, { seed: 21 }); const G = __sim.G, out = []; for (const L of G.winds) { const b = G.b; b.x = 0; b.z = 0; b.y = groundAt(G, 0, 0) + L.y; b.heat = neutral(L.y); b.vy = 0; b.vx = b.vz = 0; b.landed = false; b.air = true; G.limit = 1e9; for (let i = 0; i < 60 * 12; i++) { b.heat = neutral(b.y - groundAt(G, b.x, b.z)); __sim.step(1 / 60); } out.push([Math.atan2(b.z, b.x), Math.atan2(Math.sin(L.dir), Math.cos(L.dir))]); } return out; })()""")
    ok(all(abs(((a - c + 3.1416) % 6.2832) - 3.1416) < 0.35 for a, c in W) and len(W) >= 3, 'the wind at each height carries the balloon its own way', str(W))
    P = E("""(() => { const out = []; for (const dd of [2, 30, 70, 130]) { __sim.start(4, { seed: 5 }); const G = __sim.G, t = G.F.T[0], b = G.b; b.landed = false; b.air = true; b.y = groundAt(G, t.x, t.z) + 0.5; b.x = t.x; b.z = t.z; G.markers.push({ x: t.x + dd, y: groundAt(G, t.x + dd, t.z) + 0.02, z: t.z, vx: 0, vz: 0, vy: -5, falling: true, ti: 0 }); b.y += 50; b.heat = 1; for (let i = 0; i < 5; i++) __sim.step(1 / 60); out.push(G.markers[0].pts); } return out; })()""")
    ok(P[0] > P[1] > P[2] > P[3] == 0 and P[0] > 950, 'a marker is worth more the closer it lands', str(P))
    E("__sim.start(4, { seed: 6 }); (() => { const G = __sim.G, b = G.b; b.landed = false; b.air = true; b.y = groundAt(G, b.x, b.z) + 1; b.vy = -4; b.heat = 0.2; for (let i = 0; i < 40 && !G.bumps; i++) __sim.step(1 / 60); })()")
    ok(E("__sim.G.bumps") == 1 and not E("__sim.G.over"), 'a hard landing is a bump')
    E("(() => { const G = __sim.G, b = G.b; for (let k2 = 0; k2 < 2; k2++) { b.landed = false; b.air = true; b.y = groundAt(G, b.x, b.z) + 1; b.vy = -4; b.heat = 0.2; const n0 = G.bumps; for (let i = 0; i < 40 && G.bumps === n0 && !G.over; i++) __sim.step(1 / 60); } })()")
    ok(E("__sim.G.over") == 'lost' and E("__sim.G.res.why") == 'bumps', 'three bumps end the flight', str([E("__sim.G.over"), E("__sim.G.res && __sim.G.res.why")]))
    r = E("""(() => { let s = 1; do { __sim.start(8, { seed: s++ }); } while (!__sim.G.F.lines.length && s < 60); const G = __sim.G, L = G.F.lines[0]; if (!L) return 'none'; const b = G.b, x = (L.x0 + L.x1) / 2, z = (L.z0 + L.z1) / 2; b.x = x; b.z = z; b.y = groundAt(G, x, z) + 10; b.landed = false; b.air = true; b.heat = neutral(10); G.limit = 1e9; __sim.step(1 / 60); return G.over + ':' + (G.res && G.res.why); })()""")
    ok(r == 'lost:wires', 'the wires end the flight', r)
    E("__sim.start(3, { seed: 8 }); (() => { const G = __sim.G; G.fuel = 0.01; __sim.x().burn(G, true); for (let i = 0; i < 10; i++) __sim.step(1 / 60); })()")
    ok(E("__sim.G.b.burn") is False, 'out of fuel the burner stops')
    W2 = E("""(() => { const out = []; for (const pts of [1000, 0]) { __sim.start(3, { seed: 9 }); const G = __sim.G, b = G.b; G.ti = G.F.T.length; G.score = pts * G.F.T.length; b.landed = false; b.air = true; b.x = G.F.field.x + (pts ? 0 : 320); b.z = G.F.field.z; b.y = groundAt(G, b.x, b.z) + 0.5; b.vy = -0.5; b.heat = neutral(0) - 0.004; for (let i = 0; i < 60 * 3; i++) __sim.step(1 / 60); out.push(G.over + ':' + G.phase); } return out; })()""")
    ok(W2[0].startswith('won'), 'landing once the X are done ends the flight, and points enough win', str(W2))
    ok(W2[1].startswith('lost'), 'and too few lose', str(W2))
    # ---------- settings ----------
    E("__sim.live(); localStorage.setItem('bln.settings', '{}'); location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(600)
    sw = "['tMus', 'tSfx', 'tVib'].map(i => document.getElementById(i).textContent === 'ON')"
    E("document.getElementById('setBtn').click()"); ok(E("!document.getElementById('ovSet').classList.contains('hidden')"), 'the Settings button opens the Settings card')
    E("document.getElementById('tMus').click()"); ok(E(sw) == [False, True, True], 'Music switches off on its own', str(E(sw)))
    E("document.getElementById('tVib').click()"); ok(E(sw) == [False, True, False], 'Vibration switches off on its own', str(E(sw)))
    E("document.getElementById('tSfx').click()"); ok(E(sw) == [False, False, False], 'Sound effects switch off on their own', str(E(sw)))
    E("location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(500)
    ok(E(sw) == [False, False, False], 'the settings are remembered'); E("localStorage.setItem('bln.settings', '{}')")
    ok(not errs, 'no JavaScript errors', str(errs[:3])); ctx.close(); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
