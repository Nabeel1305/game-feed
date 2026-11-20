#!/usr/bin/env python3
"""Hoop Shot with a real thumb: put it down and pull back: the power grows with the pull and the path shows; sideways aims
the other way (a slingshot); letting go shoots; a pull pushed back to nothing is no shot. Then the rules, stepped exactly:
the right pull scores and nothing-but-net is a swish; too much power is "too strong", too little "too weak"; aimed off to
one side it says which; a bank-shot round only counts baskets off the board; out of balls short of the target loses.
Practice has unlimited balls. The Settings switch Music, Sound effects and Vibration on their own and remember them.
Run: python3 games/hoopshot/test_touch.py"""
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
    def T(kind, x=None, y=None): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [] if x is None else [{'x': x, 'y': y, 'id': 1}]})
    def until(js, ms=15000):
        try: pg.wait_for_function(js, timeout=ms); return True
        except Exception: return False
    E("localStorage.setItem('hsh.taught', '3'); __sim.go(4)"); until("__sim.G && __sim.G.wait <= 0 && __sim.G.state === 'aim'"); pg.wait_for_timeout(300)
    T('touchStart', 195, 450); T('touchMove', 195, 450 + 844 * 0.4 * 0.2); pg.wait_for_timeout(40); a1 = E("__sim.G.aim && __sim.G.aim.p"); T('touchMove', 195, 450 + 844 * 0.4 * 0.5); pg.wait_for_timeout(40); a2 = E("__sim.G.aim && __sim.G.aim.p")
    ok(a1 and a2 and abs(a1 - 0.2) < 0.02 and abs(a2 - 0.5) < 0.02, 'pulling back further sets more power', str([a1, a2]))
    T('touchMove', 150, 450 + 844 * 0.4 * 0.5); pg.wait_for_timeout(40); ok(E("__sim.G.aim.yaw") > 0.1, 'pulling to the left aims to the right (a slingshot)', str(E("__sim.G.aim.yaw")))
    T('touchMove', 195, 452); pg.wait_for_timeout(30); u0 = E("__sim.G.used"); T('touchEnd'); pg.wait_for_timeout(60); ok(E("__sim.G.used") == u0 and E("__sim.G.state") == 'aim', 'a pull pushed back to nothing is no shot')
    I = E("__sim.ideal()"); T('touchStart', 195, 400); T('touchMove', 195 - I['yaw'] * 390 * 0.42, 400 + I['p'] * 844 * 0.4); pg.wait_for_timeout(40); T('touchEnd'); pg.wait_for_timeout(60)
    ok(E("__sim.G.state") == 'fly', 'letting go shoots'); ok(until("__sim.G.shots.length >= 1", 8000) and E("__sim.G.shots[0].ok"), 'the right pull scores', str(E("__sim.G.shots")))
    # ---------- the rules, stepped exactly ----------
    shot = """(N, dp, dy, opt) => { const S = __sim; S.start(N, Object.assign({ seed: 5 }, opt || {})); const G = S.G; const I = S.ideal(); S.shoot(I.p + dp, I.yaw + dy); let n = 0; while (G.state === 'fly' && n++ < 600) S.step(1 / 60); return G.shots[0]; }"""
    r = E(f"({shot})(2, 0, 0)"); ok(r['ok'], 'the ideal pull drops in', str(r))
    r = E(f"({shot})(2, 0.6, 0)"); ok(not r['ok'] and r['why'] == 'long', 'much more power: TOO STRONG', str(r))
    r = E(f"({shot})(2, -0.3, 0)"); ok(not r['ok'] and r['why'] == 'short', 'much less power: TOO WEAK', str(r))
    r1 = E(f"({shot})(2, 0, 0.5)"); r2 = E(f"({shot})(2, 0, -0.5)"); ok(not r1['ok'] and not r2['ok'] and {r1['why'], r2['why']} == {'left', 'right'}, 'aimed off to either side: it says which side', str([r1, r2]))
    r = E("""(() => { const S = __sim; S.start(5, { seed: 6 }); const G = S.G; if (G.cfg.ch !== 'bank') return 'not bank'; let swish = null; for (let p = 0.2; p < 0.9 && !swish; p += 0.004) { const b = S.simulate(p, 0); if (b.scored && !b.board) swish = p; } if (swish == null) return 'no clean shot found'; S.shoot(swish, 0); let n = 0; while (G.state === 'fly' && n++ < 600) S.step(1 / 60); return G.shots[0]; })()""")
    ok(isinstance(r, dict) and not r['ok'] and r['why'] == 'nobank', 'in a bank-shot round a clean basket does not count', str(r))
    r = E("(() => { const S = __sim; S.start(4, { seed: 7 }); const G = S.G; let n = 0; while (!G.over && n++ < 60 * 200) { if (G.state === 'aim' && G.wait <= 0) S.shoot(0.06, 0); S.step(1 / 60); } return [G.over, G.res && G.res.why, G.used, G.balls]; })()")
    ok(r[0] == 'lost' and r[1] == 'balls', 'out of balls short of the target: the round is lost', str(r))
    r = E("(() => { const S = __sim; S.start(4, { seed: 8, practice: true }); const G = S.G; let n = 0; while (!G.over && n++ < 60 * 120) { if (G.state === 'aim' && G.wait <= 0) S.shoot(0.06, 0); S.step(1 / 60); } return [G.over, G.used]; })()")
    ok(r[0] is None and r[1] > 20, 'practice: unlimited balls, never over', str(r))
    ok(E("!!document.getElementById('practiceBtn')"), 'there is a Practice button on the home screen')
    # ---------- Settings ----------
    E("__sim.live(); localStorage.setItem('hsh.settings', '{}'); location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(600)
    sw = "['tMus', 'tSfx', 'tVib'].map(i => document.getElementById(i).textContent === 'ON')"
    ok(E("!!document.getElementById('setBtn').offsetParent"), 'the Settings button is on the home screen')
    E("document.getElementById('setBtn').click()"); ok(E("!document.getElementById('ovSet').classList.contains('hidden')"), 'it opens the Settings card')
    E("document.getElementById('tMus').click()"); ok(E(sw) == [False, True, True], 'Music switches off on its own', str(E(sw)))
    E("document.getElementById('tVib').click()"); ok(E(sw) == [False, True, False], 'Vibration switches off on its own', str(E(sw)))
    E("document.getElementById('tSfx').click()"); ok(E(sw) == [False, False, False], 'Sound effects switch off on their own', str(E(sw)))
    E("location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(500)
    ok(E(sw) == [False, False, False], 'the settings are remembered'); E("localStorage.setItem('hsh.settings', '{}')")
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
