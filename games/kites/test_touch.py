#!/usr/bin/env python3
"""Kite Fighter with a real thumb: holding anywhere pulls (the kite darts the way its nose points); letting go gives slack
(it stops darting and turns on the spot); while paused a touch does nothing. Then the rules, stepped exactly: lines that
cross saw at each other and the one pulling while its kite moves cuts the other; a kite parked at the end of its line
cannot cut; a kite that goes into the roofs is lost; slack turns the nose round. Your kites picks a kite. No errors.
Run: python3 games/kites/test_touch.py"""
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
    def down(x, y): cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x, 'y': y, 'id': 1}]})
    def up(): cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []}); pg.wait_for_timeout(40)
    E("localStorage.setItem('kft.taught', '3'); __sim.go(6)"); pg.wait_for_timeout(300)
    E("(() => { const G = __sim.G, y = G.you; y.th = Math.PI / 2; y.y = 40; y.x = 0; G.rivals.forEach(r => { r.alive = false; r.y = -50; }); })()")
    down(200, 500); y0, th0 = E("[__sim.G.you.y, __sim.G.you.th]"); pg.wait_for_timeout(900); y1, th1, pull = E("[__sim.G.you.y, __sim.G.you.th, __sim.G.you.pull]")
    ok(pull and y1 > y0 + 3 and abs(th1 - th0) < 0.05, 'holding pulls: the kite darts the way its nose points (up), its nose held', str([y0, y1, th0, th1]))
    up(); pg.wait_for_timeout(500); th2, pull2 = E("[__sim.G.you.th, __sim.G.you.pull]"); ok(not pull2 and abs(th2 - th1) > 0.5, 'letting go gives slack: the kite turns on the spot', str([th1, th2]))
    E("document.getElementById('pauseBtn').click()"); pg.wait_for_timeout(150); down(200, 500); pg.wait_for_timeout(200); ok(not E("__sim.G.you.pull"), 'a touch while paused does nothing'); up(); E("document.getElementById('pResume').click()")
    # ---------- the rules, stepped exactly ----------
    duel = """(youPull, park) => { const S = __sim; S.start(6, { seed: 3 }); const G = S.G, y = G.you, r = G.rivals[0]; G.rivals.length = 1; G.wind = 0; G.cfg.gust = false;
      y.x = -20; y.y = 68; y.th = 0; r.ax = 60; r.x = 0; r.y = 70; r.still = true; let cut = 0, lost = 0;
      for (let i = 0; i < 60 * 4 && !G.over; i++) { if (park) { y.x = -20; y.y = 68; y.vx = y.vy = 0; } S.hold(youPull); for (const e of S.stepEv(1 / 60)) { if (e.k === 'cut') cut++; } } return [cut, G.over]; }"""
    r = E(f"({duel})(true, false)"); ok(r[0] == 1, 'darting across their line while pulling cuts it', str(r))
    r = E(f"({duel})(false, false)"); ok(r[0] == 0, 'drifting across it on slack does not', str(r))
    r = E("""(() => { const S = __sim; S.start(6, { seed: 3 }); const G = S.G, y = G.you, r = G.rivals[0]; G.rivals.length = 1; G.wind = 0; y.x = 0; y.y = 40; r.ax = 60; r.x = 10; r.y = 80; r.still = true; let cut = 0; const L = Math.hypot(y.x, y.y);
      for (let i = 0; i < 60 * 6; i++) { y.th = Math.atan2(y.y - 2, y.x); S.hold(true); for (const e of S.stepEv(1 / 60)) if (e.k === 'cut') cut++; if (G.crosses[0]) { y.x = G.crosses[0] ? y.x : y.x; } } return [cut, +y.y.toFixed(1), +(y.spd || 0).toFixed(2)]; })()""")
    ok(r[0] == 0 and r[2] < 3, 'a kite parked at the end of its line (or the top of the sky) cannot cut', str(r))
    r = E("""(() => { const S = __sim; S.start(6, { seed: 3 }); const G = S.G, y = G.you; G.rivals.length = 0; y.y = 20; y.th = -Math.PI / 2; for (let i = 0; i < 120 && !G.over; i++) { S.hold(true); S.step(1 / 60); } return [G.over, G.res && G.res.why]; })()""")
    ok(r == ['lost', 'crash'], 'a kite pulled down into the roofs is lost', str(r))
    E("__sim.live(); localStorage.setItem('kft.stars', JSON.stringify({1: 3, 2: 3})); __sim.showAqua()"); pg.wait_for_timeout(200)
    ok(E("document.querySelectorAll('#aqGrid .aq').length") == E("__sim.SKINS.length"), 'Your kites lists every kite')
    E("document.querySelectorAll('#aqGrid .aq')[1].click()"); ok(E("__sim.mySkin().id") == E("__sim.SKINS[1].id"), 'tapping an open one picks it')
    E("localStorage.setItem('kft.stars', '{}'); __sim.showAqua(); document.querySelectorAll('#aqGrid .aq')[3].click()"); ok(E("__sim.store.get('skin')") == E("__sim.SKINS[1].id"), 'a locked one cannot be picked')
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
