#!/usr/bin/env python3
"""Knife Spin with real touches: a tap anywhere throws a knife that sticks in the target; a tap while a knife is in the air
does nothing; a knife thrown onto a knife already there clangs off and ends the round; sticking the last knife bursts the
target and the next drops in. No errors.
Run: python3 games/knife/test_touch.py"""
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
    E = pg.evaluate
    E("localStorage.setItem('kn.taught', '3'); __sim.go(1);"); pg.wait_for_timeout(500)
    E("(() => { const L = __sim.G.log; L.items.length = 0; L.apples.length = 0; })()")
    pg.touchscreen.tap(200, 700); pg.wait_for_timeout(20); ok(E("!!__sim.G.fly"), 'a tap throws a knife')
    pg.touchscreen.tap(200, 700); pg.wait_for_timeout(150); ok(E("__sim.G.thrown") == 1, 'a tap while a knife is flying does nothing', str(E("__sim.G.thrown")))
    ok(E("__sim.G.log.stuck") == 1 and E("__sim.G.log.items.length") == 1, 'the knife sticks in the target')
    # a knife right where the next one will land: clang
    E("(() => { const G = __sim.G, L = G.log; L.moves.forEach(m => m.v = 0); L.w = 0; const a = ((Math.PI / 2 - L.rot) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI); L.items.push({ a, kind: 'knife' }); })()")
    pg.touchscreen.tap(200, 700); pg.wait_for_timeout(400); ok(E("__sim.G.over") == 'lost' or E("__sim.G.wait > 0 || __sim.G.over === 'lost'"), 'a knife on a knife clangs off and ends the round', str(E("[__sim.G.over, __sim.G.wait]")))
    # the last knife bursts the target and the next one comes
    E("__sim.go(1)"); pg.wait_for_timeout(300); E("(() => { const L = __sim.G.log; L.items.length = 0; L.stuck = L.need - 1; })()")
    pg.touchscreen.tap(200, 700); pg.wait_for_timeout(1300); ok(E("__sim.G.li") == 1 and E("__sim.G.log.stuck") == 0, 'the last knife bursts the target; the next drops in', str(E("[__sim.G.li, __sim.G.log.stuck]")))
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
