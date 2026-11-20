#!/usr/bin/env python3
"""Sheepdog with a real thumb: held on the field, the dog runs to the spot under the thumb; let go and she lies down; a
quick tap is a bark and does not move her. Then the rules, stepped exactly: sheep walk away from the dog; rushing at them
makes them panic; the ram ignores pressure but not a bark; a sheep through the gate is penned and stays; sheep do not walk
into the river; a fox carries off a sheep left alone, and running at it sees it off; at sunset with too few in the round is
lost, and enough in wins. The Settings switch Music, Sound effects and Vibration on their own and remember them. No errors.
Run: python3 games/sheepdog/test_touch.py"""
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
    E("localStorage.setItem('shd.taught', '3'); __sim.go(4)"); until("__sim.G && __sim.G.wait <= 0"); pg.wait_for_timeout(600)
    g = E("__sim.groundAt(300, 500)"); d0 = E("[__sim.G.dog.x, __sim.G.dog.z]"); T('touchStart', 300, 500); pg.wait_for_timeout(900)
    d1 = E("[__sim.G.dog.x, __sim.G.dog.z, __sim.G.dog.tx, __sim.G.dog.tz]")
    import math
    ok(d1[2] is not None and math.hypot(d1[0] - g['x'], d1[1] - g['z']) < math.hypot(d0[0] - g['x'], d0[1] - g['z']) - 2, 'held on the field, the dog runs toward the spot under the thumb', str([g, d0, d1]))
    T('touchEnd'); pg.wait_for_timeout(100); ok(E("__sim.G.dog.down && __sim.G.dog.tx == null"), 'let go: she lies down')
    pg.wait_for_timeout(800); b0 = E("__sim.G.barks"); p0 = E("[__sim.G.dog.x, __sim.G.dog.z]"); T('touchStart', 200, 400); pg.wait_for_timeout(60); T('touchEnd'); pg.wait_for_timeout(300)
    p1 = E("[__sim.G.dog.x, __sim.G.dog.z]"); ok(E("__sim.G.barks") == b0 + 1 and math.hypot(p1[0] - p0[0], p1[1] - p0[1]) < 0.6, 'a quick tap barks and does not move her', str([b0, p0, p1]))
    # ---------- the rules, stepped exactly ----------
    base = """(o) => { const S = __sim; S.start(o.N || 6, { seed: o.seed || 3 }); const G = S.G; G.foxN = 0; G.trees.length = 0; G.river = null; return G; }"""
    r = E(f"""(() => {{ const G = ({base})({{}}), S = __sim, s = G.sheep[0]; G.sheep.length = 1; s.kind = 'ewe'; s.x = 0; s.z = 0; s.vx = s.vz = 0; G.dog.x = 0; G.dog.z = -4; S.dogTo(0, -4); for (let i = 0; i < 90; i++) S.step(1 / 60); return [+s.x.toFixed(2), +s.z.toFixed(2), +s.panic.toFixed(2)]; }})()""")
    ok(r[1] > 1.0 and r[2] < 0.3, 'a sheep walks away from the dog (calmly)', str(r))
    r = E(f"""(() => {{ const G = ({base})({{}}), S = __sim; const sh = G.sheep.slice(0, 6); G.sheep.length = 0; G.sheep.push(...sh); sh.forEach((s, i) => {{ s.kind = 'ewe'; s.mum = null; s.x = (i % 3) - 1; s.z = Math.floor(i / 3) - 0.5; s.vx = s.vz = 0; s.panic = 0; }}); G.dog.x = 0; G.dog.z = -14; S.dogTo(0, 6); for (let i = 0; i < 80; i++) S.step(1 / 60); return Math.max(...sh.map(s => s.panic)); }})()""")
    ok(r > 0.3, 'rushing at the flock makes them panic', str(r))
    r = E(f"""(() => {{ const G = ({base})({{ N: 6, seed: 4 }}), S = __sim, ram = G.sheep.find(s => s.kind === 'ram'); if (!ram) return 'no ram'; G.sheep.length = 0; G.sheep.push(ram); ram.x = 0; ram.z = 0; ram.vx = ram.vz = 0; G.dog.x = 0; G.dog.z = -4; S.dogTo(0, -4); for (let i = 0; i < 60; i++) S.step(1 / 60); const a = +ram.z.toFixed(2); S.bark(); for (let i = 0; i < 40; i++) S.step(1 / 60); return [a, +ram.z.toFixed(2)]; }})()""")
    ok(isinstance(r, list) and abs(r[0]) < 0.3 and r[1] > 1.0, 'the ram ignores the dog at a distance, but moves for a bark', str(r))
    r = E(f"""(() => {{ const G = ({base})({{}}), S = __sim, s = G.sheep[0], P = G.pen; G.sheep.length = 1; s.mum = null; s.kind = 'ewe'; s.x = P.gx; s.z = P.gz - 1.5; s.vx = s.vz = 0; G.dog.x = P.gx; G.dog.z = P.gz - 5; S.dogTo(P.gx, P.gz - 3.5); let n = 0; while (!s.penned && n++ < 600) S.step(1 / 60); const a = s.penned; S.dogTo(P.x, P.z); for (let i = 0; i < 300; i++) S.step(1 / 60); return [a, s.penned, S.inPen(s.x, s.z)]; }})()""")
    ok(r == [True, True, True], 'driven through the gate a sheep is penned, and stays in', str(r))
    r = E(f"""(() => {{ const S = __sim; S.start(4, {{ seed: 9 }}); const G = S.G; if (!G.river) return 'no river'; G.foxN = 0; const s = G.sheep[0], rv = G.river; G.sheep.length = 1; s.mum = null; s.kind = 'ewe'; s.x = rv.bx + 12; s.z = rv.z0 - 1.2; G.dog.x = s.x; G.dog.z = s.z - 4; S.dogTo(s.x, s.z - 3); for (let i = 0; i < 300; i++) S.step(1 / 60); return [+(s.z).toFixed(2), rv.z0]; }})()""")
    ok(isinstance(r, list) and r[0] < r[1], 'a sheep is not driven into the river', str(r))
    r = E(f"""(() => {{ const G = ({base})({{}}), S = __sim; const s = G.sheep[0]; G.sheep.length = 1; s.mum = null; s.x = 20; s.z = 0; G.dog.x = -25; G.dog.z = -25; S.dogTo(null); G.foxes.push({{ x: 26, z: 0, state: 'creep', target: s, t: 0 }}); for (let i = 0; i < 300; i++) S.step(1 / 60); return [s.lost, G.lost]; }})()""")
    ok(r == [True, 1], 'a fox carries off a sheep left alone', str(r))
    r = E(f"""(() => {{ const G = ({base})({{}}), S = __sim; const s = G.sheep[0]; G.sheep.length = 1; s.mum = null; s.x = 20; s.z = 0; G.dog.x = 14; G.dog.z = 0; G.foxes.push({{ x: 26, z: 0, state: 'creep', target: s, t: 0 }}); S.dogTo(27, 0); for (let i = 0; i < 90; i++) S.step(1 / 60); return [G.foxes[0].state, s.lost]; }})()""")
    ok(r[0] in ('flee', 'gone') and r[1] is False, 'running at the fox sees it off', str(r))
    r = E("(() => { const S = __sim; S.start(4, { seed: 5 }); const G = S.G; G.clock = 0.05; for (let i = 0; i < 10; i++) S.step(1 / 60); return [G.over, G.res && G.res.why]; })()")
    ok(r == ['lost', 'dark'], 'sunset with too few in: the round is lost', str(r))
    r = E("(() => { const S = __sim; S.start(4, { seed: 5 }); const G = S.G; G.penned = G.cfg.need; G.clock = 0.05; for (let i = 0; i < 10; i++) S.step(1 / 60); return G.over; })()")
    ok(r == 'won', 'sunset with enough in: a win', str(r))
    # ---------- Settings ----------
    E("__sim.live(); localStorage.setItem('shd.settings', '{}'); location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(600)
    sw = "['tMus', 'tSfx', 'tVib'].map(i => document.getElementById(i).textContent === 'ON')"
    ok(E("!!document.getElementById('setBtn').offsetParent"), 'the Settings button is on the home screen')
    E("document.getElementById('setBtn').click()"); ok(E("!document.getElementById('ovSet').classList.contains('hidden')"), 'it opens the Settings card')
    E("document.getElementById('tMus').click()"); ok(E(sw) == [False, True, True], 'Music switches off on its own', str(E(sw)))
    E("document.getElementById('tVib').click()"); ok(E(sw) == [False, True, False], 'Vibration switches off on its own', str(E(sw)))
    E("document.getElementById('tSfx').click()"); ok(E(sw) == [False, False, False], 'Sound effects switch off on their own', str(E(sw)))
    E("location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(500)
    ok(E(sw) == [False, False, False], 'the settings are remembered'); E("localStorage.setItem('shd.settings', '{}')")
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
