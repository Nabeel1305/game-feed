#!/usr/bin/env python3
"""Reel with real touches and real drawing (the robots do not draw, LESSONS rule 1): a pull down and let go casts where the ring
on the water was; a flick up strikes on the bite; in a fight, a thumb held down reels, dragged sideways swings the rod, lifted
lets go; a flick at a nibble scares the fish; the fish in the hand is drawn. No JavaScript errors.
Run: python3 games/reel/test_touch.py"""
import os, sys
from playwright.sync_api import sync_playwright
here = os.path.dirname(os.path.abspath(__file__)); fails = []; oks = 0
def ok(c, what, d=''):
    global oks
    if c: oks += 1; print('  ok  ', what)
    else: fails.append(what); print('  FAIL', what, d)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.add_init_script('window.__softGL = true'); pg.goto('file://' + os.path.join(here, 'index.html')); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(800)
    pg.evaluate("localStorage.setItem('rl.taught', '3'); __sim.go(4); __sim.G.lesson = null;"); pg.wait_for_timeout(300)
    m = pg.mouse
    # cast: thumb down at 60%, pull down 200 px and a little left, let go
    m.move(200, 500); m.down(); m.move(200, 560, steps=4); m.move(180, 700, steps=6)
    aim = pg.evaluate("__sim.ui.aim && [__sim.ui.aim.x, __sim.ui.aim.z]"); ok(aim is not None, 'pulling down shows where the cast will land', str(aim))
    m.up(); pg.wait_for_timeout(100)
    st = pg.evaluate("[__sim.G.ph, __sim.G.fl.tx, __sim.G.fl.tz]"); ok(st[0] == 'fly', 'letting go casts the float', str(st))
    ok(aim and st[1] > aim[0] - 3 and abs(st[2] - aim[1]) < 4, 'it flies to where the ring was (pulled left, it goes right)', f'{aim} {st}')
    pg.evaluate("__sim.adv(3)")
    # a flick at a nibble (nothing has bitten): it scares the fish and costs
    pg.evaluate("(() => { const G = __sim.G, s = G.spots[0]; G.ph = 'wait'; G.bait = true; G.fl.x = s.x; G.fl.z = s.z; G.B = { s, delay: 50, dips: [], bit: false, t: 0 }; })()")
    n0 = pg.evaluate("__sim.G.spots.length"); m.move(200, 600); m.down(); m.move(200, 520, steps=3); m.move(200, 420, steps=3); m.up(); pg.wait_for_timeout(60)
    r = pg.evaluate("[__sim.G.ph, __sim.G.noise, __sim.G.spots.length]"); ok(r[1] >= 0.9 and r[0] == 'reelin', 'striking too soon scares the fish off and makes the lake quieter', str(r))
    # the bite, then a TAP: fish on (22 Nov 2026)
    pg.evaluate("__sim.adv(1.5); (() => { const G = __sim.G, s = G.spots[0] || null; if (!s) return; G.ph = 'bite'; G.ph_t = 0; G.bait = true; G.fl.x = s.x; G.fl.z = s.z; G.B = { s, delay: 0, dips: [], bit: true, t: 0 }; })()")
    m.move(200, 600); m.down(); m.up(); pg.wait_for_timeout(60); ok(pg.evaluate("__sim.G.ph") == 'fight', 'a tap on the bite hooks the fish', pg.evaluate("__sim.G.ph"))
    pg.evaluate("__sim.go ? 0 : 0"); pg.evaluate("(() => { const G = __sim.G; G.ph = 'idle'; G.F = null; G.in.hold = false; })()")
    # the bite, then a flick up: fish on
    pg.evaluate("__sim.adv(1.5); (() => { const G = __sim.G, s = G.spots[0] || null; if (!s) return; G.ph = 'bite'; G.ph_t = 0; G.bait = true; G.fl.x = s.x; G.fl.z = s.z; G.B = { s, delay: 0, dips: [], bit: true, t: 0 }; })()")
    m.move(200, 600); m.down(); m.move(200, 520, steps=3); m.move(200, 430, steps=3); m.up(); pg.wait_for_timeout(60)
    ok(pg.evaluate("__sim.G.ph") == 'fight', 'a flick up on the bite hooks the fish')
    # reel: hold, drag right, let go
    pg.evaluate("__sim.G.F.nextSurge = 1e9")
    m.move(150, 600); m.down(); pg.wait_for_timeout(80); h1 = pg.evaluate("__sim.G.in.hold"); m.move(260, 600, steps=6); pg.wait_for_timeout(80)
    side = pg.evaluate("__sim.G.in.side"); m.up(); pg.wait_for_timeout(60); h2 = pg.evaluate("__sim.G.in.hold")
    ok(h1 and not h2, 'a thumb held down reels, lifted lets go', f'{h1} {h2}'); ok(side > 0.5, 'dragging right swings the rod right', str(side))
    pg.wait_for_timeout(400); pg.screenshot(path='/tmp/reel_fight.png')
    # landed: the fish in the hand is drawn without error
    pg.evaluate("(() => { const G = __sim.G; G.F.D = 1.9; G.F.Sf = 0.1; G.in.hold = true; })()"); pg.wait_for_timeout(700)
    ok(pg.evaluate("__sim.G.ph") == 'land', 'reeled to the jetty: landed', pg.evaluate("__sim.G.ph"))
    pg.wait_for_timeout(500); pg.screenshot(path='/tmp/reel_land.png')
    ok(pg.evaluate("!!(__sim.V3.held && __sim.V3.held.m)"), 'the fish is held up to the camera')
    ok(not errs, 'no JavaScript errors', str(errs[:3]))
    b.close()
print(f'\n{oks} checks passed, {len(fails)} failed.')
sys.exit(1 if fails else 0)
