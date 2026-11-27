#!/usr/bin/env python3
"""Bus Driver with real thumbs: holding the right half is GO and the bus pulls away; holding the left half is BRAKE and it
slows; both pedals ease in (a short press is gentle); letting go coasts; while paused touches do nothing. Then the rules,
stepped exactly: stopping with the door on the mark opens the doors and everyone gets on; leaving before the time counts as
early; driving past a stop ends the shift; a red light counts, two end it; running into the car in front or through people on
a zebra ends it; hard braking spills the tea; your bus colour is the one you picked. No errors.
Run: python3 games/bus/test_touch.py"""
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
    def down(*pts): cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x, 'y': y, 'id': i + 1} for i, (x, y) in enumerate(pts)]})
    def up(): cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []}); pg.wait_for_timeout(30)
    E("localStorage.setItem('bsd.taught', '3'); __sim.go(6)"); pg.wait_for_timeout(300); E("(() => { const G = __sim.G; G.cars.forEach(c => c.gone = true); G.blocks.length = 0; G.onc.length = 0; })()")
    down((320, 700)); pg.wait_for_timeout(150); g1 = E("__sim.G.bus.go"); pg.wait_for_timeout(1200); v1 = E("__sim.G.bus.v")
    ok(E("__sim.G.bus.goH") and 0 < g1 < 0.6 and v1 > 1, 'holding GO: it eases in and the bus pulls away', str([g1, v1]))
    up(); pg.wait_for_timeout(300); ok(not E("__sim.G.bus.goH") and E("__sim.G.bus.go") < 0.2, 'letting go: off the pedal, the bus coasts', str(E("[__sim.G.bus.goH, __sim.G.bus.go]")))
    va = E("__sim.G.bus.v"); down((218, 770)); pg.wait_for_timeout(700); vb = E("__sim.G.bus.v"); ok(E("__sim.G.bus.brH") and vb < va - 0.8, 'holding BRAKE slows', str([va, vb])); up()
    # (27 Nov 2026) steering, reverse, the van in your lane
    stick = E("(() => { const q = __sim.stickPos(); return [q.x, q.y]; })()")
    down((320, 700)); pg.wait_for_timeout(900); up(); down((stick[0] + 40, stick[1])); pg.wait_for_timeout(600); x1 = E("__sim.G.bus.x"); up(); pg.wait_for_timeout(100)
    ok(x1 > 0.2 and E("__sim.G.bus.steer") == 0, 'the stick right of its middle steers right while moving; letting go centres it', str(x1))
    down((218, 770)); pg.wait_for_timeout(2500); up(); g0 = E("[__sim.G.bus.gear, +__sim.G.bus.v.toFixed(2)]")
    E("(() => { const G = __sim.G; G.bus.v = 0; })()")
    gp = E("(() => { const q = __sim.gearPos(); return [q.x, q.y]; })()")
    down((gp[0], gp[1])); up(); ok(E("__sim.G.bus.gear") == 'R', 'the gear button puts it in reverse', str(E("__sim.G.bus.gear")))
    s0 = E("__sim.G.bus.s"); down((320, 760)); pg.wait_for_timeout(900); up(); ok(E("__sim.G.bus.s") < s0 - 0.3 and E("__sim.G.bus.v") <= 0, 'in reverse, GO backs the bus up', str([s0, E("__sim.G.bus.s")]))
    E("(() => { const G = __sim.G; G.bus.v = 0; })()"); down((gp[0], gp[1])); up(); ok(E("__sim.G.bus.gear") == 'D', 'and again: drive forward')
    r = E("(() => { const S = __sim, G = S.G; G.blocks.length = 0; G.onc.length = 0; G.bus.x = 0; G.bus.v = 0; G.blocks.push({ s: G.bus.s + 8, len: 6.5, kind: 0 }); S.pedal('go', true); let bumped = 0; for (let i = 0; i < 300 && !G.over; i++) { for (const e of S.stepEv(1 / 60)) if (e.k === 'bump') bumped++; if (G.bus.v > 2.2) S.pedal('go', false); } S.pedal('go', false); return [bumped > 0, G.over, +G.bus.v.toFixed(2)]; })()")
    ok(r[0] and r[1] is None and r[2] == 0, 'rolling slowly into a parked van stops you dead (no crash)', str(r))
    E("document.getElementById('pauseBtn').click()"); pg.wait_for_timeout(150); down((320, 700)); pg.wait_for_timeout(200); ok(not E("__sim.G.bus.goH"), 'touches while paused do nothing'); up(); E("document.getElementById('pResume').click()")
    # ---------- the rules, stepped exactly ----------
    drive = """(N, fn) => { const S = __sim; S.start(N, { seed: 9 }); const G = S.G; G.far = () => G.stops.forEach(st => st.s += 3000); G.cars.length = 0; G.lights.length = 0; G.zebras.length = 0; G.zones.length = 0; G.blocks.length = 0; G.onc.length = 0; return fn(G, S); }"""
    stopAt = """(G, S, at) => { const st = G.stops.find(x => !x.served); while (G.bus.s < st.s - 30 && !G.over) { S.pedal('go', true); S.step(1 / 60); } S.pedal('go', false);
      for (let i = 0; i < 6000 && !G.over && G.bus.doors <= 0; i++) { const d = st.s + at - G.bus.s, need = G.bus.v * G.bus.v / (2 * Math.max(0.2, d)); S.pedal('br', need > 1.2 || d < 0.3); if (G.bus.v < 0.5 && d > 0.4) { S.pedal('br', false); S.pedal('go', G.bus.v < 0.4); } else S.pedal('go', false); S.step(1 / 60); if (G.bus.s > st.s + 8) break; } return st; }"""
    r = E(f"({drive})(6, (G, S) => {{ const st = ({stopAt})(G, S, 0); for (let i = 0; i < 600; i++) S.step(1 / 60); return [G.bus.doors > 0, G.pax, st.n, +(st.s - G.bus.s).toFixed(2)]; }})")
    ok(r[0] and r[1] == r[2] and abs(r[3]) < 1.6, 'stopping with the door on the mark: the doors open and everyone gets on', str(r))
    r = E(f"({drive})(6, (G, S) => {{ const st = ({stopAt})(G, S, 0); S.pedal('br', false); for (let i = 0; i < 400; i++) S.step(1 / 60); st.due = Math.round(G.t + 20); const early = st.due - G.t; S.pedal('go', true); S.step(1 / 60); return [+early.toFixed(1), G.early, st.served]; }})")
    ok(r[0] > 0 and r[1] == 1 and r[2], 'leaving before the stop\'s time counts as an early departure', str(r))
    r = E(f"({drive})(6, (G, S) => {{ const st = G.stops[0]; while (!G.over && G.bus.s < st.s + 30) {{ S.pedal('go', true); S.step(1 / 60); }} return [G.over, G.res && G.res.why]; }})")
    ok(r == ['lost', 'missed'], 'driving past a stop ends the shift', str(r))
    r = E(f"({drive})(6, (G, S) => {{ G.lights.push({{ s: 25, off: 0, g: 0.01, a: 0.01, r: 100 }}, {{ s: 40, off: 0, g: 0.01, a: 0.01, r: 100 }}); let n = 0; while (!G.over && G.bus.s < 45) {{ S.pedal('go', true); for (const e of S.stepEv(1 / 60)) if (e.k === 'red') n++; }} return [n, G.over, G.res && G.res.why]; }})")
    ok(r == [2, 'lost', 'reds'], 'a red light counts; the second ends the shift', str(r))
    r = E(f"({drive})(6, (G, S) => {{ G.cars.push({{ s: 30, v: 0, vt: 0, gone: false, kind: 0 }}); while (!G.over && G.bus.s < 40) {{ S.pedal('go', true); S.step(1 / 60); }} return [G.over, G.res && G.res.why]; }})")
    ok(r == ['lost', 'car'], 'running into the car in front ends the shift', str(r))
    r = E(f"({drive})(6, (G, S) => {{ G.zebras.push({{ s: 45, p: 1, ped: null, done: false }}); G.bus.v = 10; while (!G.over && G.bus.s < 55) {{ S.pedal('go', true); S.step(1 / 60); }} return [G.over, G.res && G.res.why]; }})")
    ok(r == ['lost', 'ped'], 'driving through people on a zebra ends the shift', str(r))
    r = E(f"({drive})(6, (G, S) => {{ G.far(); while (G.bus.v < 10) {{ S.pedal('go', true); S.step(1 / 60); }} S.pedal('go', false); const t0 = G.tea; S.pedal('br', true); while (G.bus.v > 0.1) S.step(1 / 60); return [+t0.toFixed(1), +G.tea.toFixed(1)]; }})")
    ok(r[1] < r[0] - 3, 'stamping on the brake spills the tea', str(r))
    r = E(f"({drive})(6, (G, S) => {{ G.far(); while (G.bus.v < 10) {{ S.pedal('go', true); S.step(1 / 60); }} S.pedal('go', false); const t0 = G.tea; let i = 0; while (G.bus.v > 0.3) {{ S.pedal('br', (i++ % 20) < 7); S.step(1 / 60); }} return [+t0.toFixed(1), +G.tea.toFixed(1)]; }})")
    ok(r[1] >= r[0] - 0.5, 'braking gently (short presses) keeps the tea in its cup', str(r))
    E("__sim.live(); localStorage.setItem('bsd.stars', JSON.stringify({1: 3, 2: 3})); __sim.showAqua()"); pg.wait_for_timeout(200)
    ok(E("document.querySelectorAll('#aqGrid .aq').length") == E("__sim.SKINS.length"), 'Your buses lists every livery')
    E("document.querySelectorAll('#aqGrid .aq')[1].click()"); ok(E("__sim.mySkin().id") == E("__sim.SKINS[1].id"), 'tapping an open one picks it, and you drive it')
    E("localStorage.setItem('bsd.stars', '{}'); __sim.showAqua(); document.querySelectorAll('#aqGrid .aq')[3].click()"); ok(E("__sim.store.get('skin')") == E("__sim.SKINS[1].id"), 'a locked one cannot be picked')
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
