#!/usr/bin/env python3
"""Tennis with real touches: a thumb on the left drags the stick (to the right moves you right); on the right a tap tosses the
serve and a swipe at the top of the toss serves; in a rally a swipe as the ball arrives hits it back over the net; a swipe to
the right sends it right of one to the left; a longer swipe goes deeper; the longest swipe is a lob, a short one a drop shot (length picks the shot, not speed); a swipe down is a slice;
a swing at nothing costs a moment. Then the rules: a ball that lands out loses the point; the net loses it; two bounces win
it; two faults lose it; first to seven wins only by two; the long format counts 15, 30, 40, deuce and advantage. In practice
the drill bar changes the drill. The Settings switch Music, Sound effects and Vibration on their own and remember them.
Run: python3 games/tennis/test_touch.py"""
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
    E = pg.evaluate; E("Object.assign(window, __sim.x())"); cdp = ctx.new_cdp_session(pg)
    def touch(kind, pts): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, (x, y) in pts]})
    def swipe(x0, y0, x1, y1, ms=90, i=7):
        touch('touchStart', [(i, (x0, y0))]); n = 5
        for s in range(1, n + 1): touch('touchMove', [(i, (x0 + (x1 - x0) * s / n, y0 + (y1 - y0) * s / n))]); pg.wait_for_timeout(ms // n)
        touch('touchEnd', [(i, (x1, y1))]); pg.wait_for_timeout(30)
    def until(js, ms=8000):
        try: pg.wait_for_function(js, timeout=ms); return True
        except Exception: return False
    E("localStorage.setItem('ten.taught', '9'); __sim.go(4)"); until("__sim.G && __sim.G.phase === 'serve'")
    touch('touchStart', [(1, (80, 700))]); touch('touchMove', [(1, (120, 700))]); touch('touchMove', [(1, (150, 700))]); pg.wait_for_timeout(50); st = E("[__sim.G.stick.x, __sim.G.stick.z]")
    ok(st[0] > 0.8 and abs(st[1]) < 0.2, 'dragging the stick to the right moves you right', str(st)); touch('touchEnd', [(1, (150, 700))]); ok(E("__sim.G.stick.x") == 0, 'letting go stops')
    # serve by touch
    E("(() => { const G = __sim.G; G.server = 0; G.phase = 'serve'; G.toss = null; G.wait = 0; G.side = 1; G.me.x = 0.8; G.me.z = HZ + 0.3; })()")
    touch('touchStart', [(2, (300, 600))]); touch('touchEnd', [(2, (300, 600))]); pg.wait_for_timeout(30); ok(E("!!__sim.G.toss"), 'a tap on the right tosses the ball')
    ok(until("__sim.G.toss && Math.abs(__sim.G.ball.vy) < 0.4", 2000), 'the toss rises to its top')
    swipe(300, 650, 285, 470, 80); r = E("[__sim.G.ball.serve, __sim.G.ball.live, __sim.G.ball.by]"); ok(r == [True, True, 0], 'a swipe at the top serves', str(r))
    # a rally ball by touch: put a ball on its way to you, swipe as it arrives
    feed = """(tx) => { const G = __sim.G; G.wait = 0; G.next = null; G.phase = 'rally'; G.toss = null; const b = G.ball, m = G.me; m.x = 0; m.z = HZ; m.vx = m.vz = 0; m.swing = 0; m.cool = 0; m.sw = null;
      G.op.x = 0; G.op.z = -HZ; b.x = 0; b.y = 1; b.z = -HZ + 1; const sx = 0.5; const T = 1.3, tz = 9.5; const g = 9.8 * 1.15; b.spin = 0.3; b.vx = (sx + 0.5 - 0) / T; b.vz = (tz + HZ - 1) / T; b.vy = (0.035 - 1 + 0.5 * g * T * T) / T; b.live = true; b.bounces = 0; b.by = 1; b.serve = false; b.id = (b.id || 0) + 1; }"""
    def rallyHit(dx, dy, ms):
        E(f"({feed})()"); u1 = until(f"__sim.G.ball.z > {6.8 - ms / 1000 * 24}", 4000); s0 = E("[__sim.G.me.swing, __sim.G.me.cool, __sim.G.phase, __sim.G.wait]"); swipe(300, 700, 300 + dx, 700 + dy, ms); s1 = E("[__sim.G.me.swing, __sim.G.me.cool, __sim.G.ball.z]"); until('__sim.G.ball.by === 0', 700)
        if os.environ.get('DBG'): print('   dbg', u1, s0, s1)
        return E("[__sim.G.ball.by, __sim.G.ball.kind, __sim.G.ball.vx, __sim.G.ball.vz, __sim.G.ball.vy]")
    r = rallyHit(0, -170, 60); ok(r[0] == 0 and r[3] < 0, 'a swipe up as the ball arrives hits it back over the net', str(r))
    rr = rallyHit(70, -160, 60); rl = rallyHit(-70, -160, 60); ok(rr[2] > rl[2] + 1, 'a swipe to the right sends it right of one to the left', str([rr[2], rl[2]]))
    sh = rallyHit(0, -70, 30); lo = rallyHit(0, -220, 50); ok(sh[0] == 0 and lo[0] == 0 and abs(lo[3]) > abs(sh[3]) * 0.9, 'a longer swipe goes deeper', str([sh[3], lo[3]]))
    r = rallyHit(0, -250, 60); ok(r[1] == 'lob' and r[4] > 6, 'the longest swipe is a lob (high), however fast it is made', str(r))
    r = rallyHit(0, -250, 320); ok(r[1] == 'lob', 'and however slowly', str(r))
    r = rallyHit(0, -170, 320); ok(r[1] == 'drive', 'a middling swipe made slowly is still a drive: speed no longer picks the shot', str(r))
    r = rallyHit(0, -60, 40); ok(r[1] == 'drop', 'a short swipe is a drop shot', str(r))
    r = rallyHit(0, 170, 70); ok(r[1] == 'slice', 'a swipe down is a slice', str(r))
    E("(() => { const G = __sim.G; G.wait = 0; G.next = null; G.phase = 'rally'; G.ball.live = false; G.me.swing = 0; G.me.cool = 0; })()"); swipe(300, 700, 300, 520, 60); pg.wait_for_timeout(350)
    ok(E("__sim.G.me.cool > 0"), 'a swing at nothing costs a moment')
    # ---------- the rules (headless) ----------
    run = """(js) => { const S = __sim; S.start(6, { seed: 4 }); const G = S.G; G.wait = 0; G.next = null; G.phase = 'rally'; const b = G.ball; b.live = true; b.serve = false; b.bounces = 0; b.id = 99; return new Function('G', 'S', 'b', js)(G, S, b); }"""
    def R(js): return E(f"({run})({js!r})")
    r = R("b.by = 0; b.x = 0; b.y = 2; b.z = -2; b.vx = 0; b.vz = -25; b.vy = 1; b.spin = 0; for (let i = 0; i < 200 && G.phase === 'rally'; i++) S.step(1 / 60); for (let i = 0; i < 200 && G.wait > 0; i++) S.step(1 / 60); return G.pts;")
    ok(r == [0, 1], 'a ball that lands out loses the point', str(r))
    r = R("b.by = 0; b.x = 0; b.y = 0.5; b.z = 3; b.vx = 0; b.vz = -15; b.vy = 0; b.spin = 0; for (let i = 0; i < 200 && G.phase === 'rally'; i++) S.step(1 / 60); for (let i = 0; i < 200 && G.wait > 0; i++) S.step(1 / 60); return G.pts;")
    ok(r == [0, 1], 'the net loses the point', str(r))
    r = R("b.by = 0; b.x = 3.8; b.y = 2; b.z = -2; b.vx = 0; b.vz = -9; b.vy = 1; b.spin = 0; G.op.x = -4; G.op.z = -12; G.cfg.oSpd = 0.1; for (let i = 0; i < 400 && G.phase === 'rally'; i++) S.step(1 / 60); for (let i = 0; i < 200 && G.wait > 0; i++) S.step(1 / 60); return G.pts;")
    ok(r == [1, 0], 'two bounces on their side win it', str(r))
    r = R("G.phase = 'serve'; G.server = 0; G.side = 1; b.live = false; let n = 0; for (let k = 0; k < 2; k++) { G.phase = 'serve'; G.wait = 0; S.toss(); for (let i = 0; i < 40 && Math.abs(b.vy) > 0.3; i++) S.step(1 / 60); S.swing({ ax: 0.95, ay: -0.3, len: 0.7, speed: 3 }); for (let i = 0; i < 200 && b.live; i++) S.step(1 / 60); for (let i = 0; i < 100 && G.wait > 0; i++) S.step(1 / 60); } return [G.pts, b.fault];")
    ok(r[0] == [0, 1], 'two faults lose the point', str(r))
    r = E("(() => { const S = __sim; S.start(6, { seed: 4 }); const G = S.G; G.pts = [6, 6]; pointTo(G, 0, 'winner'); for (let i = 0; i < 200 && G.wait > 0; i++) S.step(1 / 60); const a = G.over; pointTo(G, 0, 'winner'); for (let i = 0; i < 200 && G.wait > 0; i++) S.step(1 / 60); return [a, G.over, G.pts]; })()")
    ok(r[0] is None and r[1] == 'won', 'first to seven wins only by two', str(r))
    r = E("(() => { const S = __sim; S.start(6, { seed: 4, long: true }); const G = S.G; const seq = [0, 0, 0, 1, 1, 1, 0, 1, 0, 0]; const out = []; for (const w of seq) { G.phase = 'rally'; pointTo(G, w, 'winner'); for (let i = 0; i < 200 && G.wait > 0; i++) S.step(1 / 60); out.push(scoreText(G)[0] + '|' + scoreText(G)[1]); } return out; })()")
    ok(r[2] == '0  40|0  0' and r[5] == '0  40|0  40' and r[6] == '0  AD|0  40' and r[7] == '0  40|0  40' and r[9] == '1  0|0  0', 'the long format counts 15, 30, 40, deuce and advantage', str(r))
    E("__sim.practice(true); __sim.go(4)"); until("__sim.G && __sim.G.cfg.practice"); pg.wait_for_timeout(300); d0 = E("__sim.G.drill"); bar = E("__sim.ui.drillBar")
    touch('touchStart', [(3, (bar['x'] + bar['w'] - 10, bar['y'] + bar['h'] / 2))]); touch('touchEnd', [(3, (bar['x'] + bar['w'] - 10, bar['y'] + bar['h'] / 2))]); pg.wait_for_timeout(50)
    ok(E("__sim.G.drill") == d0 + 1, 'in practice the drill bar changes the drill'); E("__sim.practice(false)")
    # ---------- Settings ----------
    E("__sim.live(); localStorage.setItem('ten.settings', '{}'); location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(600)
    sw = "['tMus', 'tSfx', 'tVib'].map(i => document.getElementById(i).textContent === 'ON')"
    ok(E("!!document.getElementById('setBtn').offsetParent"), 'the Settings button is on the home screen')
    E("document.getElementById('setBtn').click()"); ok(E("!document.getElementById('ovSet').classList.contains('hidden')"), 'it opens the Settings card')
    E("document.getElementById('tMus').click()"); ok(E(sw) == [False, True, True], 'Music switches off on its own', str(E(sw)))
    E("document.getElementById('tVib').click()"); ok(E(sw) == [False, True, False], 'Vibration switches off on its own', str(E(sw)))
    E("document.getElementById('tSfx').click()"); ok(E(sw) == [False, False, False], 'Sound effects switch off on their own', str(E(sw)))
    E("location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(500)
    ok(E(sw) == [False, False, False], 'the settings are remembered'); E("localStorage.setItem('ten.settings', '{}')")
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
