#!/usr/bin/env python3
"""Taxi Driver with a real thumb: a thumb held down brakes and lifting it lets the taxi drive on; a swipe changes lane;
in the turn zone a swipe sets the turn and the taxi takes it at the junction (swipe up: straight on); stopping in the
ring in the kerb lane picks the passenger up. Then the rules, stepped exactly: a red light is a ticket; the car in front
is a crash, and three end the shift; a fast corner skids; a nervous passenger gets out after too many bumps; an early
drop-off tips, a late one pays half; when the meter is long gone they walk. The ⚙ Settings switch Music, Sound effects
and Vibration on their own and remember them. No errors.
Run: python3 games/taxi/test_touch.py"""
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
    def mv(x, y): cdp.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': [{'x': x, 'y': y, 'id': 1}]})
    def up(): cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []}); pg.wait_for_timeout(40)
    def swipe(dx, dy):
        down(195, 520)
        for f in (0.3, 0.6, 1.0): mv(195 + dx * f, 520 + dy * f); pg.wait_for_timeout(16)
        up()
    def until(js, ms=15000):
        try: pg.wait_for_function(js, timeout=ms); return True
        except Exception: return False
    E("localStorage.setItem('txi.taught', '3'); __sim.go(4)"); until("__sim.G && __sim.G.wait <= 0"); pg.wait_for_timeout(300)
    # keep it out of the turn zone while testing lanes and the brake
    E("(() => { const t = __sim.G.taxi; t.s = 6; t.v = 8; })()")
    down(195, 520); pg.wait_for_timeout(250); r = E("[__sim.G.taxi.brH, __sim.G.taxi.v]"); ok(r[0] is True and r[1] < 7, 'a thumb held down brakes', str(r))
    up(); pg.wait_for_timeout(200); ok(E("__sim.G.taxi.brH") is False, 'lifting it lets the taxi drive on')
    E("(() => { const t = __sim.G.taxi; t.s = 6; t.lane = 1; t.lx = __sim.LANES[1]; })()"); swipe(-120, 0); ok(E("__sim.G.taxi.lane") == 0, 'a swipe left moves to the inner lane')
    E("__sim.G.taxi.s = 6"); swipe(120, 0); ok(E("__sim.G.taxi.lane") == 1, 'a swipe right moves back to the kerb lane')
    # the turn zone: set a turn there and watch it taken at the junction
    q = E("""(() => { const G = __sim.G, t = G.taxi; for (const d of ['R', 'L']) { const h2 = d === 'R' ? (t.h + 1) % 4 : (t.h + 3) % 4, [a, b] = __sim.ahead(t.i, t.j, t.h), [c, e] = __sim.ahead(a, b, h2); if (c >= 0 && e >= 0 && c < 8 && e < 8 && !G.works.has([Math.min(a, c), Math.min(b, e), h2 % 2].join(','))) return d; } return 'R'; })()""")
    E("(() => { const t = __sim.G.taxi; t.s = __sim.BL - 15; t.v = 7; })()"); ok(E("__sim.inZone()") is True, 'the last stretch before a junction is the turn zone')
    swipe(120 if q == 'R' else -120, 0); ok(E("__sim.G.taxi.turn") == q and E("__sim.G.taxi.lane") == 1, f'a swipe in the zone sets the turn ({q}) instead of changing lane', str(E("[__sim.G.taxi.turn, __sim.G.taxi.lane]")))
    h0 = E("__sim.G.taxi.h"); until("__sim.G.taxi.s < 10 && __sim.G.taxi.h !== " + str(h0), 8000)
    ok(E("__sim.G.taxi.h") == ((h0 + 1) % 4 if q == 'R' else (h0 + 3) % 4), 'the taxi takes that turn at the junction')
    E("(() => { const t = __sim.G.taxi; t.s = __sim.BL - 15; t.v = 7; t.turn = 'R'; })()"); swipe(0, -120); ok(E("__sim.G.taxi.turn") == 'S', 'a swipe up in the zone means straight on')
    # pick up: put the taxi just short of the person, in the kerb lane, and hold
    E("(() => { const G = __sim.G, g = G.goal, t = G.taxi; t.i = g.e.i; t.j = g.e.j; t.h = g.e.h; t.s = g.s - 6; t.v = 6; t.lane = 1; t.lx = __sim.LANES[1]; t.turn = null; G.cars.length = 0; })()")
    down(195, 520); ok(until("!!__sim.G.fare", 4000), 'holding to stop in the ring in the kerb lane picks the passenger up'); up()
    # ---------- the rules, stepped exactly ----------
    base = """(N, seed, fn) => { const S = __sim; S.start(N, { seed }); const G = S.G; G.taxi.v = 0; G.cars.length = 0; G.spawned = new Set(['x']); fn(G, S); return G; }"""
    r = E(f"(() => {{ const G = ({base})(6, 7, (G, S) => {{ const t = G.taxi, [a, b] = S.ahead(t.i, t.j, t.h); G.light[a][b].on = true; G.light[a][b].off = 0; t.h = 0; t.s = S.BL - 2; t.v = 10; G.t = 10 - (t.h % 2 ? 7 : 0); }}); const c0 = G.coins; for (let i = 0; i < 30; i++) __sim.step(1 / 60); return [G.taxi.reds, G.coins - c0]; }})()")
    ok(r[0] == 1 and r[1] <= -5, 'through a red light: a ticket (-5)', str(r))
    r = E(f"""(() => {{ const G = ({base})(6, 8, (G, S) => {{ }}); const S = __sim, out = [];
      for (let n = 0; n < 3; n++) {{ const t = G.taxi; t.s = 10; t.v = 12; t.lane = 1; t.lx = S.LANES[1]; G.cars.length = 0; G.cars.push({{ id: 99, i: t.i, j: t.j, h: t.h, s: 16, lane: 1, lx: S.LANES[1], v: 0, vt: 0, kind: 0 }}); G.spawned = new Set([[t.i, t.j, t.h].join(',')]);
        for (let i = 0; i < 60 && !G.over; i++) S.step(1 / 60); out.push(G.taxi.crashes); }} return [out, G.over, G.res && G.res.why]; }})()""")
    ok(r[0] == [1, 2, 3] and r[1] == 'lost' and r[2] == 'crashes', 'the car in front is a crash; three end the shift', str(r))
    r = E(f"(() => {{ const G = ({base})(6, 9, (G, S) => {{ const t = G.taxi; t.i = 3; t.j = 3; t.h = 0; t.s = S.BL - 3; t.v = 13; t.turn = 'R'; G.light[3][4].on = false; }}); for (let i = 0; i < 30; i++) __sim.step(1 / 60); return [G.taxi.skids, G.taxi.h, +G.taxi.v.toFixed(1)]; }})()")
    ok(r[0] == 1 and r[1] == 1 and r[2] < 6, 'a corner taken too fast skids (and slows you right down)', str(r))
    r = E(f"""(() => {{ const G = ({base})(6, 10, (G, S) => {{ }}); G.fare = {{ type: 'calm', t0: 0, bumps: 0, sight: false, tipOk: true, left: 50, allow: 60, pay: 8, blocks: 2 }}; G.goal = {{ kind: 'drop', e: {{ i: 0, j: 7, h: 1 }}, s: 30, type: 'calm' }};
      const S = __sim; for (let n = 0; n < 4 && !G.over; n++) {{ const t = G.taxi; t.s = 10; t.v = 12; t.lane = 1; t.lx = S.LANES[1]; G.cars.length = 0; G.cars.push({{ id: 99, i: t.i, j: t.h === 9 ? 0 : t.j, h: t.h, s: 16, lane: 1, lx: S.LANES[1], v: 0, vt: 0, kind: 0 }}); G.cars[0].i = t.i; G.cars[0].j = t.j; G.spawned = new Set([[t.i, t.j, t.h].join(',')]); for (let i = 0; i < 60 && !G.over; i++) S.step(1 / 60); }}
      return [G.over, G.res && G.res.why, G.taxi.crashes]; }})()""")
    ok(r[0] == 'lost' and r[1] == 'scared', 'a nervous passenger gets out after too many bumps', str(r))
    drop = """(left) => { const S = __sim; S.start(6, { seed: 12 }); const G = S.G; G.cars.length = 0; G.spawned = new Set(['x']); const t = G.taxi; G.fare = { type: 'plain', t0: 0, bumps: 0, sight: false, tipOk: true, left, allow: 40, pay: 8, blocks: 2 };
      G.goal = { kind: 'drop', e: { i: t.i, j: t.j, h: t.h }, s: 30, type: 'plain' }; t.s = 29; t.v = 0.5; t.lane = 1; t.lx = S.LANES[1]; const ev = S.stepEv(1 / 60).find(e => e.k === 'out'); return ev ? [ev.pay, ev.tip, ev.late] : null; }"""
    r1 = E(f"({drop})(20)"); r2 = E(f"({drop})(-5)")
    ok(r1 and r1[1] > 0 and not r1[2], 'dropped off early: the fare and a tip', str(r1)); ok(r2 and r2[0] == 4 and r2[1] == 0 and r2[2], 'dropped off late: half the fare, no tip', str(r2))
    r = E("(() => { const S = __sim; S.start(6, { seed: 13 }); const G = S.G; G.fare = { type: 'plain', t0: 0, bumps: 0, sight: false, tipOk: true, left: -14.9, allow: 40, pay: 8, blocks: 2 }; G.goal = { kind: 'drop', e: { i: 0, j: 7, h: 1 }, s: 30, type: 'plain' }; for (let i = 0; i < 20; i++) S.step(1 / 60); return [G.over, G.res && G.res.why]; })()")
    ok(r == ['lost', 'walked'], 'when the meter is long gone, they walk', str(r))
    # ---------- ⚙ Settings ----------
    E("__sim.live(); localStorage.setItem('txi.settings', '{}'); location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(600)
    sw = "['tMus', 'tSfx', 'tVib'].map(i => document.getElementById(i).textContent === 'ON')"
    ok(E("!!document.getElementById('setBtn').offsetParent"), 'the ⚙ Settings button is on the home screen')
    E("document.getElementById('setBtn').click()"); ok(E("!document.getElementById('ovSet').classList.contains('hidden')"), 'it opens the Settings card')
    E("document.getElementById('tMus').click()"); ok(E(sw) == [False, True, True], 'Music switches off on its own', str(E(sw)))
    E("document.getElementById('tVib').click()"); ok(E(sw) == [False, True, False], 'Vibration switches off on its own', str(E(sw)))
    E("document.getElementById('tSfx').click()"); ok(E(sw) == [False, False, False], 'Sound effects switch off on their own', str(E(sw)))
    E("location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(500)
    ok(E(sw) == [False, False, False], 'the settings are remembered'); E("localStorage.setItem('txi.settings', '{}')")
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
