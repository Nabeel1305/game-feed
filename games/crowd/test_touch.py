#!/usr/bin/env python3
"""Crowd Run with a real thumb: a slide to the right moves the crowd right (and left, left), as far as the thumb goes; while
paused a slide does nothing; the gate on the side the crowd is on is the one it takes; a red crowd fights one for one;
grey runners join when touched; a saw knocks runners off; on a bridge, runners off the planks fall; beating the giant
climbs the stairs and wins; the colour you pick is the one you play with. No errors.
Run: python3 games/crowd/test_touch.py"""
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
    def slide(dx, x0=195, y=600):
        pg.mouse.move(x0, y); pg.mouse.down()
        for i in range(1, 9): pg.mouse.move(x0 + dx * i / 8, y); pg.wait_for_timeout(16)
        pg.mouse.up(); pg.wait_for_timeout(250)
    # an empty track (nothing on it but what each check puts there)
    empty = "(() => { const G = __sim.G; G.items.length = 0; G.boss.z = 1e6; })()"
    E("localStorage.setItem('cr.taught', '3'); __sim.go(1)"); pg.wait_for_timeout(300); E(empty)
    x0 = E("__sim.G.cx"); slide(120); x1 = E("__sim.G.cx"); ok(x1 > x0 + 1, 'a slide right moves the crowd right', str([x0, x1]))
    slide(-240); x2 = E("__sim.G.cx"); ok(x2 < x1 - 2, 'a slide left moves it left, as far as the thumb went', str([x1, x2]))
    E("document.getElementById('pauseBtn').click()"); pg.wait_for_timeout(200); a = E("__sim.G.wantX"); slide(150); ok(abs(E("__sim.G.wantX") - a) < 1e-6, 'a slide while paused does nothing')
    E("document.getElementById('pResume').click()"); pg.wait_for_timeout(200)
    # gates: the side the crowd is on
    E("__sim.go(1)"); pg.wait_for_timeout(200); E(empty)
    E("(() => { const G = __sim.G; G.n = 10; G.mem.length = 0; G.items.push({ type: 'gate', z: G.d + 3, ops: [{ op: '+', v: 5 }, { op: 'x', v: 3 }] }); })()")
    slide(200); pg.wait_for_timeout(900); ok(E("__sim.G.n") == 30, 'the crowd on the right takes the right-hand gate (x3)', str(E("__sim.G.n")))
    E("(() => { const G = __sim.G; G.items.push({ type: 'gate', z: G.d + 4, ops: [{ op: '+', v: 5 }, { op: '-', v: 20 }] }); })()")
    slide(-300); pg.wait_for_timeout(900); ok(E("__sim.G.n") == 35, 'the crowd on the left takes the left-hand gate (+5)', str(E("__sim.G.n")))
    # a red crowd: one for one
    E("(() => { const G = __sim.G; G.items.push({ type: 'enemy', z: G.d + 4, n: 12 }); })()"); pg.wait_for_timeout(2500); ok(E("__sim.G.n") == 23 and not E("__sim.G.over"), 'a red crowd of 12 costs 12', str(E("__sim.G.n")))
    # grey runners join
    E("(() => { const G = __sim.G; G.items.push({ type: 'recruit', z: G.d + 5, x: G.cx, n: 7 }); })()"); pg.wait_for_timeout(1500); ok(E("__sim.G.n") == 30, 'grey runners join when touched', str(E("__sim.G.n")))
    # a saw knocks runners off
    E("(() => { const G = __sim.G; G.items.push({ type: 'saw', z: G.d + 5, x0: G.cx + 0.8, amp: 0.01, w: 1, ph: 0, r: 0.75 }); })()"); pg.wait_for_timeout(1500); ok(E("__sim.G.n") < 30 and E("__sim.G.lost") > 0, 'a saw knocks runners off', str(E("[__sim.G.n, __sim.G.lost]")))
    # a bridge: those off the planks fall
    E("__sim.go(1)"); pg.wait_for_timeout(200); E(empty);
    E("(() => { const G = __sim.G; G.items.push({ type: 'bridge', z: G.d + 6, z1: G.d + 14, x: G.cx + 2.6, hw: 0.8 }); })()"); n0 = E("__sim.G.n"); pg.wait_for_timeout(2000); ok(E("__sim.G.fall") > 0, 'on a bridge, runners off the planks fall', str(E("[__sim.G.fall, __sim.G.n, n0]".replace('n0', str(n0)))))
    # the giant: more than him wins, then the stairs
    E("__sim.go(1)"); pg.wait_for_timeout(200); E("(() => { const G = __sim.G; G.items.length = 0; G.n = 60; G.mem.length = 0; G.hp = G.boss.hp = G.boss.left = 20; G.boss.z = G.d + 6; })()")
    pg.wait_for_timeout(6000); ok(E("__sim.G.over") == 'won' and E("__sim.G.stair") >= 1, 'beating the giant climbs the stairs and wins', str(E("[__sim.G.over, __sim.G.stair]")))
    # colours
    E("localStorage.setItem('cr.stars', JSON.stringify({1: 3, 2: 3})); __sim.showAqua()"); pg.wait_for_timeout(200)
    ok(E("document.querySelectorAll('#aqGrid .aq').length") == E("__sim.COLORS.length"), 'Your colours lists every colour')
    E("document.querySelectorAll('#aqGrid .aq')[1].click()"); ok(E("__sim.myCol().id") == E("__sim.COLORS[1].id"), 'tapping an open one picks it, and it is the one you play with')
    E("localStorage.setItem('cr.stars', '{}'); __sim.showAqua(); document.querySelectorAll('#aqGrid .aq')[3].click()"); ok(E("__sim.store.get('col')") == E("__sim.COLORS[1].id"), 'a locked one cannot be picked')
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
