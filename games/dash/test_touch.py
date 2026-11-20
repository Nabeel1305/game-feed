#!/usr/bin/env python3
"""Beat Dash with a real thumb: a tap jumps; holding keeps jumping each time the cube lands; a ring jumps it again only on a
fresh tap while passing through; a spike costs a life and puts the cube back at the last flag; out of lives the run is lost;
reaching the end wins; while paused a tap does nothing; the cube you pick is the one you play with. No errors.
Run: python3 games/dash/test_touch.py"""
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
    pg.goto('file://' + os.path.join(here, 'index.html')); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(800)
    E = pg.evaluate
    clear = "(() => { const G = __sim.G; G.spikes.length = 0; G.blocks.length = 0; G.pads.length = 0; G.orbs.length = 0; G.portals.length = 0; G.floor = [[-20, 1e6]]; G.len = 1e6; G.flags = []; })()"
    E("localStorage.setItem('bx.taught', '3'); __sim.go(1)"); pg.wait_for_timeout(300); E(clear)
    j0 = E("__sim.G.jumps"); pg.mouse.click(195, 500); pg.wait_for_timeout(150); ok(E("__sim.G.jumps") == j0 + 1 and E("__sim.G.y") > 0.3, 'a tap jumps', str(E("[__sim.G.jumps, __sim.G.y]")))
    pg.wait_for_timeout(600); j1 = E("__sim.G.jumps"); pg.mouse.move(195, 500); pg.mouse.down(); pg.wait_for_timeout(1500); pg.mouse.up(); j2 = E("__sim.G.jumps")
    ok(j2 - j1 >= 3, 'holding keeps jumping each time it lands', str(j2 - j1))
    # a ring: only a fresh tap while inside it
    pg.wait_for_timeout(700); E("(() => { const G = __sim.G; G.floor = [[-20, G.x + 2], [G.x + 9, 1e6]]; G.orbs.push({ x: G.x + 4.6, y: 2.0 }); })()")
    # jump at the edge, then tap as the cube passes the ring
    pg.wait_for_timeout(60); E("__sim.press(); __sim.release()"); r = 0
    for _ in range(40):
        pg.wait_for_timeout(16)
        if E("(() => { const G = __sim.G, o = G.orbs[0]; return Math.hypot(G.x + 0.5 - o.x, G.y + 0.5 - o.y) < 0.8; })()"): pg.mouse.click(195, 500); r = 1; break
    pg.wait_for_timeout(300); ok(r and E("__sim.G.orbUsed.size") == 1, 'a fresh tap in a ring jumps again in the air', str(E("__sim.G.orbUsed.size")))
    # a spike: a life lost, back at the flag
    E("__sim.go(1)"); pg.wait_for_timeout(300); E(clear); E("(() => { const G = __sim.G; G.flags = [G.x + 3]; G.spikes.push({ x: G.x + 9, y: 0, up: true }); })()")
    l0 = E("__sim.G.lives"); pg.wait_for_timeout(2000); ok(E("__sim.G.lives") == l0 - 1 and E("__sim.G.deaths") == 1, 'a spike costs a life', str(E("[__sim.G.lives, __sim.G.deaths]")))
    ok(abs(E("__sim.G.x") - E("__sim.G.flagX")) < 6 and E("__sim.G.flagX") > 0, 'and the cube is back at the last flag', str(E("[__sim.G.x, __sim.G.flagX]")))
    E("(() => { const G = __sim.G; G.lives = 1; G.spikes.length = 0; G.spikes.push({ x: G.x + 4, y: 0, up: true }); })()"); pg.wait_for_timeout(2500); ok(E("__sim.G.over") == 'lost', 'out of lives, the run is lost', str(E("__sim.G.over")))
    # the end
    E("__sim.go(1)"); pg.wait_for_timeout(300); E(clear); E("(() => { const G = __sim.G; G.len = G.x + 6; })()"); pg.wait_for_timeout(2500); ok(E("__sim.G.over") == 'won', 'reaching the end wins', str(E("__sim.G.over")))
    # paused
    E("__sim.go(1)"); pg.wait_for_timeout(300); E(clear); E("document.getElementById('pauseBtn').click()"); pg.wait_for_timeout(200); j0 = E("__sim.G.jumps"); pg.mouse.click(195, 500); pg.wait_for_timeout(200); ok(E("__sim.G.jumps") == j0, 'while paused, a tap does nothing')
    # cubes
    E("localStorage.setItem('bx.stars', JSON.stringify({1: 3, 2: 3})); __sim.showAqua()"); pg.wait_for_timeout(200)
    ok(E("document.querySelectorAll('#aqGrid .aq').length") == E("__sim.CUBES.length"), 'Your cubes lists every cube')
    E("document.querySelectorAll('#aqGrid .aq')[1].click()"); ok(E("__sim.myCube().id") == E("__sim.CUBES[1].id"), 'tapping an open one picks it, and it is the one you play with')
    E("localStorage.setItem('bx.stars', '{}'); __sim.showAqua(); document.querySelectorAll('#aqGrid .aq')[3].click()"); ok(E("__sim.store.get('cube')") == E("__sim.CUBES[1].id"), 'a locked one cannot be picked')
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
