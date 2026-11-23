#!/usr/bin/env python3
"""Taxi Driver with real thumbs (second version, 23 Nov 2026: you drive): the left thumb's stick steers, the right thumb's GAS
and BRAKE pedals work (BRAKE held at a standstill reverses, after a moment), the kerb holds the taxi on the street; braking to
a stop in the ring by the kerb picks the passenger up. Then the rules, stepped exactly: into a junction on red is a ticket;
driving into a car is a crash (also one coming the other way), and three end the shift; a fast corner skids; a nervous passenger gets out after too many bumps; an early
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
    def touch(kind, pts): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, x, y in pts]})
    def until(js, ms=15000):
        try: pg.wait_for_function(js, timeout=ms); return True
        except Exception: return False
    E("localStorage.setItem('txi.taught', '3'); __sim.go(4)"); until("__sim.G && __sim.G.wait <= 0"); pg.wait_for_timeout(300)
    # a clear straight road in the middle of town, no cars, no lights
    CLEAR = "(() => { const G = __sim.G; G.cars.length = 0; G.spawned = new Set(['x']); G.spawnKey = 'x'; for (const row of G.light) for (const L of row) L.on = false; G.works = new Set(); })()"
    E(CLEAR); E("__sim.place(3, 3, 0, 12, __sim.LANES[1], 6)")
    st = lambda: E("[+__sim.G.in.sx.toFixed(2), __sim.G.in.gas, __sim.G.in.brake]"); Pd = E("__sim.pedals()"); mid = lambda b2: (b2['x'] + b2['w'] / 2, b2['y'] + b2['h'] / 2); gx, gy = mid(Pd['gas']); bx, by = mid(Pd['brake'])
    ok(Pd['gas']['x'] + Pd['gas']['w'] <= 390 and Pd['gas']['y'] + Pd['gas']['h'] <= 844 and Pd['brake']['x'] > 150, 'GAS and BRAKE are on the screen, under the right thumb', str(Pd))
    touch('touchStart', [(1, 90, 700)]); touch('touchMove', [(1, 50, 700)]); pg.wait_for_timeout(40); ok(st()[0] < -0.7 and not st()[1] and not st()[2], 'left thumb: the stick slid left steers left', str(st()))
    touch('touchMove', [(1, 135, 690)]); pg.wait_for_timeout(40); ok(st()[0] > 0.7, 'slid right: steers right', str(st()))
    touch('touchMove', [(1, 90, 700)]); touch('touchStart', [(1, 90, 700), (2, gx, gy)]); pg.wait_for_timeout(40); ok(st()[1] is True, 'right thumb on GAS while the left thumb stays on the stick', str(st()))
    E("__sim.place(3, 3, 0, 12, __sim.LANES[1], 4)"); touch('touchMove', [(1, 91, 700), (2, gx + 2, gy)]); v0 = E("__sim.G.taxi.v"); pg.wait_for_timeout(600); ok(E("__sim.G.taxi.v") > v0 + 1, 'GAS held: the taxi speeds up', str([v0, E("__sim.G.taxi.v")]))
    h0 = E("__sim.G.taxi.th"); touch('touchMove', [(1, 135, 690), (2, gx, gy)]); pg.wait_for_timeout(250); ok(E("__sim.G.taxi.th") > h0 + 0.05, 'and turns right as the stick goes right', str([h0, E("__sim.G.taxi.th")]))
    touch('touchMove', [(1, 90, 700), (2, bx, by)]); pg.wait_for_timeout(40); ok(st()[2] is True and st()[1] is False, 'the thumb slid across to BRAKE: braking, no gas', str(st()))
    touch('touchEnd', []); pg.wait_for_timeout(40); ok(st() == [0, False, False], 'both thumbs lifted: stick centred, pedals up', str(st()))
    E(CLEAR); E("__sim.place(3, 3, 0, 20, __sim.LANES[1], 0)"); touch('touchStart', [(2, bx, by)]); pg.wait_for_timeout(250); r0 = E("__sim.G.taxi.v"); pg.wait_for_timeout(1100); r1 = E("__sim.G.taxi.v"); touch('touchEnd', [])
    ok(r0 > -0.2 and r1 < -0.8, 'BRAKE held at a standstill: nothing for a moment, then the taxi reverses', str([r0, r1]))
    # where it is: the road, how far along, how far right of the middle, all from where you have driven
    r = E("(() => { __sim.place(3, 3, 1, 20, 2.0, 0); const t = __sim.G.taxi; return [t.i, t.j, t.h, Math.round(t.s), +t.lx.toFixed(1), t.lane]; })()"); ok(r == [3, 3, 1, 20, 2.0, 0], 'the taxi knows the road it is on, how far along and which lane', str(r))
    r = E("(() => { __sim.place(3, 3, 2, 30, 5.4, 0); const t = __sim.G.taxi; return [t.i, t.j, t.h, Math.round(t.s), +t.lx.toFixed(1), t.lane]; })()"); ok(r == [3, 3, 2, 30, 5.4, 1], 'and the same heading south, in the kerb lane', str(r))
    # the kerb: driven at it, the taxi is held on the street; a hard hit is a crash
    E(CLEAR); r = E("(() => { __sim.place(3, 3, 0, 26, 5.4, 4); const G = __sim.G, t = G.taxi; t.th = Math.PI / 2; const c0 = t.crashes; __sim.adv(1.5); return [__sim.onRoad(t.x, t.y, 0.9), t.crashes - c0]; })()"); ok(r[0] is True and r[1] == 0, 'steered gently into the kerb, the taxi is held on the street (no crash)', str(r))
    E(CLEAR); r = E("(() => { __sim.place(3, 3, 0, 26, 2.0, 13); const G = __sim.G, t = G.taxi; t.th = Math.PI / 2; const c0 = t.crashes; __sim.adv(1.0); return [__sim.onRoad(t.x, t.y, 0.9), t.crashes - c0]; })()"); ok(r[0] is True and r[1] == 1, 'driven hard at it: a crash', str(r))
    # a turn you steer yourself is counted against the GPS
    r = E("""(() => { const S = __sim; S.start(6, { seed: 5 }); const G = S.G; G.cars.length = 0; G.spawned = new Set(['x']); G.spawnKey = 'x'; for (const row of G.light) for (const L of row) L.on = false; G.works = new Set(); G.goal = { kind: 'drop', e: { i: 4, j: 4, h: 1 }, s: 30, type: 'plain' }; G.fare = { type: 'plain', t0: 0, bumps: 0, sight: false, tipOk: true, left: 90, allow: 90, pay: 8, blocks: 2 };
      S.place(4, 3, 0, 30, 2.0, 6); const t = G.taxi, want = S.gps().turn, mem = {}; let turn = null; for (let n = 0; n < 60 * 20 && !turn; n++) { S.honest(G, { react: 0.1, acc: 1 }, mem); for (const e of S.stepEv(1 / 60)) if (e.k === 'turn') turn = e; } return [want, turn && turn.q, turn && turn.right, G.turnsOk, t.h]; })()""")
    ok(r[0] == 'R' and r[1] == 'R' and r[2] is True and r[3] == 1 and r[4] == 1, 'steered round the corner the GPS asked for: counted as the right turn', str(r))
    # pick up: pull over to the kerb and brake to a stop in the ring
    E("__sim.live(); __sim.go(4)"); until("__sim.G && __sim.G.wait <= 0"); pg.wait_for_timeout(300); E(CLEAR)
    E("(() => { const G = __sim.G, g = G.goal; __sim.place(g.e.i, g.e.j, g.e.h, g.s - 5, __sim.LANES[1], 6); })()")
    touch('touchStart', [(2, bx, by)]); ok(until("!!__sim.G.fare", 4000), 'BRAKE to a stop in the ring by the kerb picks the passenger up'); touch('touchEnd', [])
    E("(() => { const G = __sim.G, g = G.goal; __sim.place(g.e.i, g.e.j, g.e.h, g.s - 1, __sim.LANES[0] - 1.5, 0); })()"); pg.wait_for_timeout(300); ok(E("!!__sim.G.fare && __sim.G.done") == 0, 'stopped beside the ring but out in the road: not a drop-off')
    # ---------- the rules, stepped exactly ----------
    base = """(N, seed, fn) => { const S = __sim; S.start(N, { seed }); const G = S.G; G.cars.length = 0; G.spawned = new Set(['x']); G.spawnKey = 'x'; G.works = new Set(); for (const row of G.light) for (const L of row) L.on = false; S.place(3, 3, 0, 20, S.LANES[1], 0); fn(G, S); return G; }"""
    r = E(f"(() => {{ const G = ({base})(6, 7, (G, S) => {{ G.light[3][4].on = true; G.light[3][4].off = 0; S.place(3, 3, 0, S.BL - 10, S.LANES[1], 10); G.t = 10; }}); const c0 = G.coins; G.in.gas = true; for (let i = 0; i < 40; i++) __sim.step(1 / 60); return [G.taxi.reds, G.coins - c0]; }})()")
    ok(r[0] == 1 and r[1] <= -5, 'into a junction on red: a ticket (-5)', str(r))
    r = E(f"(() => {{ const G = ({base})(6, 7, (G, S) => {{ G.light[3][4].on = true; G.light[3][4].off = 0; S.place(3, 3, 0, S.BL - 10, S.LANES[1], 10); G.t = 2; }}); G.in.gas = true; for (let i = 0; i < 40; i++) __sim.step(1 / 60); return G.taxi.reds; }})()")
    ok(r == 0, 'on green: no ticket', str(r))
    r = E(f"""(() => {{ const G = ({base})(6, 8, (G, S) => {{ }}); const S = __sim, out = [];
      for (let n = 0; n < 3; n++) {{ S.place(3, 3, 0, 10, S.LANES[1], 12); G.cars.length = 0; G.cars.push({{ id: 99, i: 3, j: 3, h: 0, s: 20, lane: 1, lx: S.LANES[1], v: 0, vt: 0, kind: 0 }}); G.spawnKey = 'x';
        for (let i = 0; i < 60 && !G.over; i++) {{ G.in.gas = true; S.step(1 / 60); }} out.push(G.taxi.crashes); }} return [out, G.over, G.res && G.res.why]; }})()""")
    ok(r[0] == [1, 2, 3] and r[1] == 'lost' and r[2] == 'crashes', 'driving into the car in front is a crash; three end the shift', str(r))
    r = E(f"""(() => {{ const G = ({base})(6, 8, (G, S) => {{ }}); const S = __sim; S.place(3, 3, 0, 24, S.LANES[1], 0); G.cars.push({{ id: 98, i: 3, j: 3, h: 0, s: 6, lane: 1, lx: S.LANES[1], v: 8, vt: 8, kind: 0 }}); G.spawnKey = 'x'; for (let i = 0; i < 240; i++) S.step(1 / 60); return [G.taxi.crashes, +G.cars[0].v.toFixed(1), Math.round(G.taxi.s - G.cars[0].s)]; }})()""")
    ok(r[0] == 0 and r[1] < 0.5 and r[2] >= 5, 'a car coming up behind a stopped taxi stops for it: no crash', str(r))
    r = E(f"""(() => {{ const G = ({base})(6, 8, (G, S) => {{ }}); const S = __sim; S.place(3, 3, 0, 10, -S.LANES[0], 10); G.cars.push({{ id: 97, i: 3, j: 4, h: 2, s: 22, lane: 0, lx: S.LANES[0], v: 6, vt: 6, kind: 0 }}); G.spawnKey = 'x'; for (let i = 0; i < 90 && !G.taxi.crashes; i++) {{ G.in.gas = true; S.step(1 / 60); }} return G.taxi.crashes; }})()""")
    ok(r == 1, 'over the yellow line, into a car coming the other way: a crash', str(r))
    r = E(f"(() => {{ const G = ({base})(6, 9, (G, S) => {{ S.place(3, 3, 0, 30, S.LANES[0], 13); }}); G.in.sx = 1; G.in.gas = true; let n = 0; for (let i = 0; i < 50 && !G.taxi.skids; i++) {{ __sim.step(1 / 60); n++; }} return [G.taxi.skids, +G.taxi.v.toFixed(1)]; }})()")
    ok(r[0] == 1 and r[1] < 11, 'a corner taken too fast skids (and scrubs speed off)', str(r))
    r = E(f"(() => {{ const G = ({base})(6, 9, (G, S) => {{ S.place(3, 3, 0, 30, S.LANES[0], 7); }}); G.in.sx = 1; for (let i = 0; i < 40; i++) __sim.step(1 / 60); return G.taxi.skids; }})()")
    ok(r == 0, 'the same corner at a gentle speed: no skid', str(r))
    r = E(f"""(() => {{ const G = ({base})(6, 10, (G, S) => {{ }}); G.fare = {{ type: 'calm', t0: 0, bumps: 0, sight: false, tipOk: true, left: 50, allow: 60, pay: 8, blocks: 2 }}; G.goal = {{ kind: 'drop', e: {{ i: 0, j: 7, h: 1 }}, s: 30, type: 'calm' }};
      const S = __sim; for (let n = 0; n < 4 && !G.over; n++) {{ S.place(3, 3, 0, 10, S.LANES[1], 9); G.cars.length = 0; G.cars.push({{ id: 99, i: 3, j: 3, h: 0, s: 20, lane: 1, lx: S.LANES[1], v: 0, vt: 0, kind: 0 }}); G.spawnKey = 'x'; for (let i = 0; i < 80 && !G.over; i++) {{ G.in.gas = true; S.step(1 / 60); }} }}
      return [G.over, G.res && G.res.why, G.taxi.crashes]; }})()""")
    ok(r[0] == 'lost' and r[1] == 'scared', 'a nervous passenger gets out after too many bumps', str(r))
    drop = """(left) => { const S = __sim; S.start(6, { seed: 12 }); const G = S.G; G.cars.length = 0; G.spawned = new Set(['x']); G.spawnKey = 'x'; G.works = new Set(); G.fare = { type: 'plain', t0: 0, bumps: 0, sight: false, tipOk: true, left, allow: 40, pay: 8, blocks: 2 };
      G.goal = { kind: 'drop', e: { i: 3, j: 3, h: 0 }, s: 30, type: 'plain' }; S.place(3, 3, 0, 29, S.LANES[1], 0.5); const ev = S.stepEv(1 / 60).find(e => e.k === 'out'); return ev ? [ev.pay, ev.tip, ev.late] : null; }"""
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
