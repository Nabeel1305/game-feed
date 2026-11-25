#!/usr/bin/env python3
"""Pottery Wheel with real touches (a phone held upright): holding on the clay and dragging down a little presses it, and
keeping the pressure in the green centres it; a steady drag up the wall pulls the pot taller and thinner, a fast one tears it
(and it slumps); SHAPE then a touch on the pot moves the wall towards the finger; TRIM then a touch at a height cuts the rim
there; DONE goes to the glaze, and a swatch fires it. Then the rules: the closer to the order's outline, the higher the
match; walls too thin or leaning too far slump; three slumps end the order; a match below the goal loses, above it wins.
The Settings switch Music, Sound effects and Vibration on their own and remember them. No errors.
Run: python3 games/pottery/test_touch.py"""
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
    pg.goto('file://' + os.path.join(here, 'index.html')); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(800)
    E = pg.evaluate; cdp = ctx.new_cdp_session(pg)
    def touch(kind, pts): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, x, y in pts]})
    def tap(x, y): touch('touchStart', [(5, x, y)]); touch('touchEnd', [(5, x, y)]); pg.wait_for_timeout(100)
    def scr(r, z): return E(f"__sim.x().toScreen({r}, {z})")
    def btn(m): L = E("__sim.layout()"); bb = next(q for q in L['modes'] if q['m'] == m); return (bb['x'] + bb['w'] / 2, bb['y'] + bb['h'] / 2)
    E("localStorage.setItem('pot.taught', '3'); __sim.go(3)"); pg.wait_for_timeout(500)
    c = scr(0, 3); touch('touchStart', [(1, c[0], c[1])]); touch('touchMove', [(1, c[0], c[1] + 20)]); touch('touchMove', [(1, c[0], c[1] + 42)]); pg.wait_for_timeout(200)
    ok(E("__sim.G.holding") and 0.42 <= E("__sim.G.press") <= 0.78, 'holding on the clay and dragging down a little presses it (in the green)', str(E("__sim.G.press")))
    ok(pg.wait_for_function("__sim.G.phase === 'pull'", timeout=12000) is not None, 'keeping it there centres the clay'); touch('touchEnd', [(1, c[0], c[1] + 42)]); pg.wait_for_timeout(100)
    h0, w0 = E("[__sim.G.h, __sim.G.wall]")
    def pull(ms):
        a, top = scr(5, 0.5), scr(5, E("__sim.G.h"))
        touch('touchStart', [(2, a[0], a[1])]); n = 12 if ms > 200 else 2
        for i in range(1, n + 1): touch('touchMove', [(2, a[0], a[1] + (top[1] - a[1]) * i / n)]); pg.wait_for_timeout(ms // n)
        touch('touchEnd', [(2, top[0], top[1])]); pg.wait_for_timeout(120)
    pull(1500); h1, w1 = E("[__sim.G.h, __sim.G.wall]")
    ok(h1 > h0 and w1 < w0 and E("__sim.G.pulls") == 1, 'a steady drag up the wall pulls the pot taller and thinner', str([h0, h1, w0, w1]))
    s0 = E("__sim.G.slumps"); pull(60); ok(E("__sim.G.slumps") == s0 + 1 and E("__sim.G.phase") == 'center', 'a fast one tears it, and it slumps (fresh clay)', str(E("[__sim.G.slumps, __sim.G.phase, __sim.G.tears]")))
    E("(() => { const G = __sim.G, X = __sim.x(); G.wob = 0; G.phase = 'pull'; for (let i = 0; i < 2; i++) { X.pullStart(G); X.pullMove(G, G.h, 10); X.pullEnd(G); } })()")
    tap(*btn('shape')); ok(E("__sim.G.phase") == 'shape', 'SHAPE switches to shaping')
    z = round(E("__sim.G.h") * 0.6, 1); i = int(z / 0.5); r0 = E(f"__sim.G.r[{i}]"); p0 = scr(r0, z); p1 = scr(r0 + 2.5, z)
    touch('touchStart', [(3, p0[0], p0[1])]); touch('touchMove', [(3, (p0[0] + p1[0]) / 2, p0[1])]); touch('touchMove', [(3, p1[0], p1[1])]); pg.wait_for_timeout(900); touch('touchEnd', [(3, p1[0], p1[1])]); pg.wait_for_timeout(100)
    ok(E(f"__sim.G.r[{i}]") > r0 + 1.2, 'a touch on the pot moved out pushes the wall out there', str([r0, E(f"__sim.G.r[{i}]")]))
    hb = E("__sim.G.h"); tap(*btn('trim')); zt = hb - 2; q = scr(4, zt); tap(q[0], q[1]); ok(abs(E("__sim.G.h") - zt) < 0.6, 'TRIM then a touch at a height cuts the rim there', str([hb, E("__sim.G.h"), zt]))
    tap(*btn('done')); ok(E("__sim.G.phase") == 'glaze', 'DONE goes to the glaze')
    L = E("__sim.layout()"); want = E("__sim.G.ord.glaze"); bench = [b['i'] for b in L['glaze']]; ok(len(bench) == 6 and len(set(bench)) == 6 and want in bench and all(b['x'] > 20 and b['x'] < 370 for b in L['glaze']), 'six glazes are on the bench (of sixteen), the one asked for among them, all on the screen', str(bench)); g = [b for b in L['glaze'] if b['i'] == want][0]; tap(g['x'], g['y']); ok(E("__sim.G.phase") == 'kiln' and E("__sim.G.glaze") == E("__sim.G.ord.glaze"), 'a swatch glazes it and it goes in the kiln')
    ok(pg.wait_for_function("__sim.G.over", timeout=8000) is not None, 'and it comes out fired (the order is over)')
    # ---------- the rules ----------
    r = E("""(() => { const out = []; for (const noise of [0, 1.5, 4]) { __sim.start(6, { seed: 3 }); const G = __sim.G, X = __sim.x(); G.phase = 'pull'; G.pulls = 1; G.h = G.ord.h; for (let i = 0; i < G.r.length; i++) G.r[i] = i * X.DZ <= G.h ? G.target[i] + noise * Math.sin(i) : 0; out.push(X.match(G)); } return out; })()""")
    ok(r[0] > r[1] > r[2] and r[0] >= 95, 'the closer to the outline, the higher the match', str(r))
    r = E("""(() => { __sim.start(6, { seed: 3 }); const G = __sim.G, X = __sim.x(); G.phase = 'shape'; G.pulls = 1; G.h = 20; G.wall = 0.4; for (let i = 0; i < G.r.length; i++) G.r[i] = i * X.DZ <= G.h ? 3 + i * 0.25 : 0; const s0 = G.slumps; X.shapeTo(G, 10, 12, 0.3); X.shapeTo(G, 10, 12, 0.3); return [G.slumps - s0, G.phase]; })()""")
    ok(r[0] == 1 and r[1] == 'center', 'walls too thin, leaning out too far: it slumps', str(r))
    r = E("""(() => { __sim.start(6, { seed: 3 }); const G = __sim.G, X = __sim.x(); for (let k = 0; k < 3; k++) { G.phase = 'pull'; G.wob = 0; X.pullStart(G); X.pullMove(G, G.h, 999); X.pullEnd(G); } return [G.over, G.res && G.res.why]; })()""")
    ok(r == ['lost', 'slumps'], 'three slumps end the order', str(r))
    r = E("""(() => { const out = []; for (const good of [true, false]) { __sim.start(6, { seed: 3 }); const G = __sim.G, X = __sim.x(); G.phase = 'shape'; G.pulls = 1; G.h = G.ord.h; for (let i = 0; i < G.r.length; i++) G.r[i] = i * X.DZ <= G.h ? (good ? G.target[i] : 5) : 0; X.done(G); X.glaze(G, G.ord.glaze); for (let i = 0; i < 60 * 3; i++) __sim.step(1 / 60); out.push(G.over); } return out; })()""")
    ok(r == ['won', 'lost'], 'a match above the goal wins; a plain cylinder does not', str(r))
    # settings
    E("__sim.live(); localStorage.setItem('pot.settings', '{}'); location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(600)
    sw = "['tMus', 'tSfx', 'tVib'].map(i => document.getElementById(i).textContent === 'ON')"
    E("document.getElementById('setBtn').click()"); ok(E("!document.getElementById('ovSet').classList.contains('hidden')"), 'the Settings button opens the Settings card')
    E("document.getElementById('tMus').click()"); ok(E(sw) == [False, True, True], 'Music switches off on its own', str(E(sw)))
    E("document.getElementById('tVib').click()"); ok(E(sw) == [False, True, False], 'Vibration switches off on its own', str(E(sw)))
    E("document.getElementById('tSfx').click()"); ok(E(sw) == [False, False, False], 'Sound effects switch off on their own', str(E(sw)))
    E("location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(500)
    ok(E(sw) == [False, False, False], 'the settings are remembered'); E("localStorage.setItem('pot.settings', '{}')")
    ok(not errs, 'no JavaScript errors', str(errs[:3])); ctx.close(); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
