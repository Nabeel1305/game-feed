#!/usr/bin/env python3
"""Helix Drop with a real thumb: sliding left or right turns the tower (and the tower follows the thumb's way); a slide during
the pause does nothing; with the gap turned under the ball it drops through; three in a row sets it on fire and the next
platform smashes, red or not; red ends the round; the ball you pick in Your balls is the one you play with. No errors.
Run: python3 games/helix/test_touch.py"""
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
    def slide(x0, x1, y=500):
        pg.mouse.move(x0, y); pg.mouse.down()
        for i in range(1, 9): pg.mouse.move(x0 + (x1 - x0) * i / 8, y); pg.wait_for_timeout(16)
        pg.mouse.up()
    E("localStorage.setItem('hx.taught', '3'); __sim.go(1); __sim.G.plats.forEach(pl => pl.p = pl.p.map(() => 'solid'))"); pg.wait_for_timeout(300)
    t0 = E("__sim.G.theta"); slide(150, 300); t1 = E("__sim.G.theta")
    ok(abs(t1 - t0) > 0.5, 'a slide turns the tower', str([t0, t1]))
    slide(300, 150); t2 = E("__sim.G.theta"); ok(t2 > t1 + 0.5, 'a slide the other way turns it back', str([t1, t2]))
    ok((t1 - t0) < 0, 'sliding right turns the front of the tower to the right (the tower follows the thumb)', str(t1 - t0))
    E("document.getElementById('pauseBtn').click()")
    pg.wait_for_timeout(200); t3 = E("__sim.G.theta"); slide(100, 300); ok(abs(E("__sim.G.theta") - t3) < 1e-6, 'a slide while paused does nothing')
    E("__sim.go(1)"); pg.wait_for_timeout(200)
    # the gap of the first platform turned under the ball: it drops through
    E("""(() => { const G = __sim.G, pl = G.plats[0]; const k = pl.p.indexOf('gap'); G.theta = -(pl.a + (k + 0.5) * 6.283185307 / 12); })()""")
    E("__sim.adv(1.2)"); ok(E("__sim.G.passed") >= 1, 'with the gap under the ball, it drops through', str(E("__sim.G.passed")))
    # fire: three in a row, then the next platform (even all red) smashes
    E("__sim.go(1)"); pg.wait_for_timeout(200)
    E("""(() => { const G = __sim.G; for (let i = 0; i < 3; i++) G.plats[i].p = G.plats[i].p.map(() => 'gap'); G.plats[3].p = G.plats[3].p.map(() => 'red'); })()""")
    E("__sim.adv(2.6)"); ok(E("__sim.G.smashed") >= 1 and not E("__sim.G.over"), 'three drops in a row catch fire; the next platform smashes, red or not', str(E("[__sim.G.smashed, __sim.G.over, __sim.G.passed]")))
    # red ends it
    E("__sim.go(1)"); pg.wait_for_timeout(200); E("(() => { const G = __sim.G; G.plats[0].p = G.plats[0].p.map(() => 'red'); G.shields = 0; })()")
    E("__sim.adv(3)"); ok(E("__sim.G.over") == 'lost', 'landing on red ends the round', str(E("__sim.G.over")))
    pg.wait_for_timeout(1200); ok(E("!document.getElementById('ovEnd').classList.contains('hidden')"), 'the end card shows')
    # your balls: pick one you have, it is the one you play with; a locked one does nothing
    E("localStorage.setItem('hx.stars', JSON.stringify({1: 3, 2: 3, 3: 3, 4: 3, 5: 3})); __sim.showAqua()"); pg.wait_for_timeout(200)
    n = E("document.querySelectorAll('#aqGrid .aq').length"); ok(n == E("__sim.BALLS.length"), 'Your balls lists every ball', str(n))
    E("document.querySelectorAll('#aqGrid .aq')[1].click()"); ok(E("localStorage.getItem('hx.ball')") == '"%s"' % E("__sim.BALLS[1].id") or E("__sim.store.get('ball')") == E("__sim.BALLS[1].id"), 'tapping an open ball picks it', str(E("__sim.store.get('ball')")))
    ok(E("__sim.myBall().id") == E("__sim.BALLS[1].id"), 'the picked ball is the one you play with')
    E("localStorage.setItem('hx.stars', '{}'); __sim.showAqua(); document.querySelectorAll('#aqGrid .aq')[%d].click()" % (E("__sim.BALLS.length") - 1)); ok(E("__sim.store.get('ball')") == E("__sim.BALLS[1].id"), 'a locked ball cannot be picked')
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
