#!/usr/bin/env python3
"""Surf (rebuilt 27 Nov 2026) with real touches, upright and sideways: the pad (bottom left, one place) climbs with up and drops with down,
and dropping gains speed; letting go rides straight along; TRICK near the top with speed flies off the lip and lands back. The rules: riding
straight along without pumping, the white water catches you; up and down in rhythm stays ahead to the flag; climbing hard over the top wipes
you out. The Settings switch Music, Sound effects, Vibration, camera shake and slow motion on their own and remember them. No errors.
Run: python3 games/surf/test_touch.py"""
import os, sys
from playwright.sync_api import sync_playwright
here = os.path.dirname(os.path.abspath(__file__)); fails = []; oks = 0
def ok(c, what, d=''):
    global oks
    if c: oks += 1; print('  ok  ', what)
    else: fails.append(what); print('  FAIL', what, d)
with sync_playwright() as p:
    b = p.chromium.launch()
    for vw, vh in ((390, 844), (844, 390)):
        tag = 'upright window' if vh > vw else 'sideways window'
        ctx = b.new_context(viewport={'width': vw, 'height': vh}, has_touch=True, is_mobile=True); pg = ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto('file://' + os.path.join(here, 'index.html')); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(800)
        E = pg.evaluate; cdp = ctx.new_cdp_session(pg)
        def toScreen(x, y): return (vw - y, x) if vh > vw else (x, y)
        def touch(kind, pts): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, x, y in pts]})
        def at(i, gx, gy): x, y = toScreen(gx, gy); return (i, x, y)
        E("localStorage.setItem('srf.taught', '3'); __sim.go(3)"); pg.wait_for_timeout(300); E("(() => { const G = __sim.G; G.xb = -1e6; })()")      # (the white water held far back while we touch)
        Wd, Ht = E("[innerWidth > innerHeight ? innerWidth : innerHeight, innerWidth > innerHeight ? innerHeight : innerWidth]")
        L = E("__sim.layout()"); P0, TR = L['pad'], L['tr']
        s0 = E("__sim.G.p.s"); touch('touchStart', [at(1, P0['x'], P0['y'] - P0['r'] * 0.6)]); pg.wait_for_timeout(500); s1 = E("__sim.G.p.s")
        ok(E("__sim.G.stick.y") > 0.9 and s1 > s0 + 0.05, f'{tag}: up on the pad climbs the wave', str([s0, s1]))
        touch('touchMove', [at(1, P0['x'], P0['y'] + P0['r'] * 0.6)]); pg.wait_for_timeout(300); v0 = E("__sim.G.p.v"); pg.wait_for_timeout(300); s2, v1 = E("[__sim.G.p.s, __sim.G.p.v]")
        ok(E("__sim.G.stick.y") < -0.9 and s2 < s1 and v1 > v0, f'{tag}: down on the pad drops, and dropping gains speed', str([s2, v0, v1]))
        touch('touchEnd', [at(1, P0['x'], P0['y'])]); pg.wait_for_timeout(60); ok(E("__sim.G.stick.y") == 0, f'{tag}: letting go: straight along the wave')
        touch('touchStart', [at(2, Wd * 0.3, Ht * 0.3)]); pg.wait_for_timeout(60); ok(E("__sim.G.stick.y") != 0, f'{tag}: a thumb anywhere on the left works the pad from its place', str(E("__sim.G.stick.y"))); touch('touchEnd', [at(2, Wd * 0.3, Ht * 0.3)])
        E("(() => { const G = __sim.G; G.p.s = 0.4; G.p.v = 10; G.p.vs = 0; })()"); touch('touchStart', [at(3, TR['x'], TR['y'])]); touch('touchEnd', [at(3, TR['x'], TR['y'])]); pg.wait_for_timeout(60)
        ok(not E("__sim.G.p.air"), f'{tag}: TRICK low on the face does nothing')
        E("(() => { const G = __sim.G; G.p.s = 0.9; G.p.v = 11; G.p.vs = 0.2; })()"); touch('touchStart', [at(3, TR['x'], TR['y'])]); touch('touchEnd', [at(3, TR['x'], TR['y'])]); pg.wait_for_timeout(60)
        ok(E("__sim.G.p.air"), f'{tag}: TRICK near the top with speed flies you off the lip')
        ok(not errs, f'{tag}: no JavaScript errors', str(errs[:3])); ctx.close()
    # ---------- the rules ----------
    ctx = b.new_context(viewport={'width': 844, 'height': 390}); pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + os.path.join(here, 'index.html')); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(500); E = pg.evaluate
    r = E("(() => { __sim.start(5, { seed: 3 }); const G = __sim.G, X = __sim.x(); X.setStick(G, 0, 0); for (let i = 0; i < 60 * 30 && !G.over; i++) __sim.step(1 / 60); return [G.over, G.res && G.res.why]; })()")
    ok(r[0] == 'lost' and r[1] in ('slow', 'caught'), 'riding straight along without pumping: the white water catches you', str(r))
    r = E("(() => { __sim.start(5, { seed: 3 }); const G = __sim.G, m = {}; for (let i = 0; i < 60 * 120 && !G.over; i++) { __sim.honest(G, { react: 0.2, acc: 0.95 }, m); __sim.step(1 / 60); } return [G.over, G.res && G.res.why, G.links > 3]; })()")
    ok(r == ['won', 'end', True], 'up and down in rhythm (linked turns) stays ahead to the flag', str(r))
    r = E("(() => { __sim.start(5, { seed: 3 }); const G = __sim.G, X = __sim.x(); G.p.v = 10; G.p.s = 0.7; X.setStick(G, 0, 1); for (let i = 0; i < 120 && G.phase === 'ride'; i++) __sim.step(1 / 60); return [G.phase, G.why]; })()")
    ok(r == ['out', 'over'], 'climbing hard right over the top: over the falls', str(r))
    r = E("(() => { __sim.start(5, { seed: 3 }); const G = __sim.G, X = __sim.x(); G.p.s = 0.9; G.p.v = 11; G.xb = -1e6; const sc = G.score; X.trick(G); for (let i = 0; i < 240 && G.p.air; i++) __sim.step(1 / 60); return [G.p.air, G.score > sc || G.tricks > 0 || G.p.v < 10]; })()")
    ok(r[0] is False and r[1], 'a trick lands back on the face (points for a clean spin)', str(r))
    ok(not errs, 'no JavaScript errors in the rules', str(errs[:3])); ctx.close()
    ctx = b.new_context(viewport={'width': 844, 'height': 390}); pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + os.path.join(here, 'index.html')); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(500); E = pg.evaluate
    # ---------- settings ----------
    E("__sim.live(); localStorage.setItem('srf.settings', '{}'); localStorage.removeItem('srf.shake'); localStorage.removeItem('srf.slow'); location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(600)
    sw = "['tMus', 'tSfx', 'tVib', 'tShake', 'tSlow'].map(i => document.getElementById(i).textContent === 'ON')"
    E("document.getElementById('setBtn').click()"); ok(E("!document.getElementById('ovSet').classList.contains('hidden')"), 'the Settings button opens the Settings card')
    ok(E(sw) == [True] * 5, 'everything starts on', str(E(sw)))
    E("document.getElementById('tMus').click()"); ok(E(sw) == [False, True, True, True, True], 'Music switches off on its own', str(E(sw)))
    E("document.getElementById('tVib').click()"); ok(E(sw) == [False, True, False, True, True], 'Vibration switches off on its own', str(E(sw)))
    E("document.getElementById('tShake').click()"); ok(E(sw) == [False, True, False, False, True], 'camera shake switches off on its own', str(E(sw)))
    E("document.getElementById('tSlow').click()"); ok(E(sw) == [False, True, False, False, False], 'slow-motion airs switch off on their own', str(E(sw)))
    E("document.getElementById('tSfx').click()"); ok(E(sw) == [False] * 5, 'Sound effects switch off on their own', str(E(sw)))
    E("location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(500)
    ok(E(sw) == [False] * 5, 'the settings are remembered'); E("localStorage.setItem('srf.settings', '{}'); localStorage.removeItem('srf.shake'); localStorage.removeItem('srf.slow')")
    ok(not errs, 'no JavaScript errors', str(errs[:3])); ctx.close(); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
