#!/usr/bin/env python3
"""Sumo with real thumbs: the left thumb is a floating stick (push up and you press into him); PUSH tapped is a shove, held
and let go a big push (it costs more strength); GRIP held while close takes his belt and lifting it lets go; DODGE is a quick
sidestep that then needs a moment. Lifting every thumb leaves nothing pressed. Then the rules, stepped exactly: before the
signal nobody moves; driving a man who does not push back moves him out (a win); standing still against nothing moves
nobody; pulling a man who leans in brings him down forward; a sidestep from a man lunging in makes him fall or run out;
pressing tires you and resting brings the strength back; turning him with the belt at your edge takes you off it. The
Settings switch Music, Sound effects and Vibration on their own and remember them. No errors.
Run: python3 games/sumo/test_touch.py"""
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
    def tp(pts): return [{'x': x, 'y': y, 'id': i} for i, (x, y) in pts]
    def touch(kind, pts): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': tp(pts)})
    def until(js, ms=15000):
        try: pg.wait_for_function(js, timeout=ms); return True
        except Exception: return False
    E("localStorage.setItem('smo.taught', '3'); __sim.go(4)"); until("__sim.G && __sim.G.phase === 'fight'")
    E("(() => { const G = __sim.G; G.noAI = true; G.op.inp.sx = G.op.inp.sy = 0; G.op.wantGrip = false; G.op.grip = false; })()")      # a still partner: only your thumbs move things
    touch('touchStart', [(1, (100, 650))])
    for f in (0.3, 0.6, 1.0): touch('touchMove', [(1, (100, 650 - 55 * f))]); pg.wait_for_timeout(30)
    pg.wait_for_timeout(150); r = E("[__sim.G.me.inp.sy, __sim.G.me.inp.sx]"); ok(r[0] > 0.9 and abs(r[1]) < 0.2, 'the left stick pushed up presses in toward him', str(r))
    def center(name): q = E(f"__sim.btnRects().{name}"); return (q['x'] + q['w'] / 2, q['y'] + q['h'] / 2)
    E("__sim.G.me.pushCd = 0"); px, py = center('push'); touch('touchStart', [(1, (100, 595)), (2, (px, py))]); touch('touchEnd', [(2, (px, py))]); pg.wait_for_timeout(60)
    r = E("[__sim.G.me.pushCd > 0, __sim.G.me.act]"); ok(r[0] and r[1] == 'push', 'a tap on PUSH is a shove', str(r))
    pg.wait_for_timeout(700); E("(() => { const m = __sim.G.me; m.pushCd = 0; m.stam = 1; m.restT = 0; })()"); touch('touchStart', [(1, (100, 595)), (2, (px, py))]); pg.wait_for_timeout(520)
    E("__sim.G.me.restT = 0"); s0 = E("__sim.G.me.stam"); touch('touchEnd', [(2, (px, py))]); pg.wait_for_timeout(40); r = E("[__sim.G.me.act, +__sim.G.me.stam.toFixed(2)]")
    ok(r[0] == 'bigpush' and r[1] <= s0 - 0.15, 'held and let go it is a big push, and it costs strength', str([s0, r]))
    E("(() => { const G = __sim.G; G.me.x = 0; G.me.z = 0.5; G.op.x = 0; G.op.z = -0.6; G.me.vx = G.me.vz = G.op.vx = G.op.vz = 0; })()"); gx, gy = center('grip')
    touch('touchStart', [(1, (100, 595)), (3, (gx, gy))]); pg.wait_for_timeout(120); ok(E("__sim.G.me.grip") is True, 'holding GRIP close to him takes his belt')
    touch('touchEnd', [(3, (gx, gy))]); pg.wait_for_timeout(60); ok(E("__sim.G.me.grip") is False, 'lifting the thumb from GRIP lets go')
    E("__sim.G.me.dodgeCd = 0"); dx, dy = center('dodge'); touch('touchStart', [(1, (100, 595)), (4, (dx, dy))]); touch('touchEnd', [(4, (dx, dy))]); pg.wait_for_timeout(40)
    r = E("[__sim.G.me.dodgeCd > 0.5, __sim.G.me.dodge >= 0]"); ok(r[0], 'a tap on DODGE sidesteps, and DODGE then needs a moment', str(r))
    touch('touchEnd', [(1, (100, 595))]); pg.wait_for_timeout(80); r = E("[__sim.G.me.inp.sx, __sim.G.me.inp.sy, __sim.G.me.grip, !!__sim.G.me.pushing]"); ok(r == [0, 0, False, False], 'lifting every thumb leaves nothing pressed', str(r))
    # ---------- the rules, stepped exactly ----------
    base = "(N, seed) => { const S = __sim; S.start(N, { seed }); const G = S.G; G.noAI = true; G.op.inp.sx = G.op.inp.sy = 0; return G; }"
    r = E(f"""(() => {{ const G = ({base})(4, 3), S = __sim; S.stick(0, 1); for (let i = 0; i < 30; i++) S.step(1 / 60); return [G.phase, +G.me.z.toFixed(2), +G.op.z.toFixed(2)]; }})()""")
    ok(r[0] == 'ready' and r[1] == 0.85 and r[2] == -0.85, 'before the signal nobody moves', str(r))
    r = E(f"""(() => {{ const G = ({base})(4, 4), S = __sim; G.phase = 'fight'; G.me.z = 0.3; G.op.z = -0.8; G.op.str = 0.8; G.op.plant = 0.8; S.stick(0, 1); S.act('grip', true); let n = 0; while (!G.over && G.phase === 'fight' && n++ < 60 * 20) {{ G.op.inp.sy = 0; S.step(1 / 60); }} return [G.log.length && G.log[0].won, G.log.length && G.log[0].how]; }})()""")
    ok(r == [True, 'out'], 'driving a man who does not push back moves him out: you win', str(r))
    r = E(f"""(() => {{ const G = ({base})(4, 5), S = __sim; G.phase = 'fight'; G.me.z = 0.55; G.op.z = -0.56; for (let i = 0; i < 120; i++) {{ S.step(1 / 60); }} return [+G.me.z.toFixed(2), +G.op.z.toFixed(2)]; }})()""")
    ok(abs(r[0] - 0.55) < 0.05 and abs(r[1] + 0.56) < 0.05, 'standing still against nothing moves nobody', str(r))
    r = E(f"""(() => {{ const G = ({base})(4, 6), S = __sim; G.phase = 'fight'; G.me.z = 0.55; G.op.z = -0.56; G.op.lean = 0.85; S.act('grip', true); S.step(1 / 60); S.stick(0, -1); let n = 0; while (G.phase === 'fight' && n++ < 60 * 4) {{ G.op.inp.sy = 1; S.step(1 / 60); }} return [G.log.length && G.log[0].won, G.log.length && G.log[0].how]; }})()""")
    ok(r == [True, 'forward'], 'pulling a man who lunges in brings him down forward', str(r))
    r = E(f"""(() => {{ const G = ({base})(4, 6), S = __sim; G.phase = 'fight'; G.me.z = 0.55; G.op.z = -0.56; G.op.lean = 0.2; S.act('grip', true); S.step(1 / 60); S.stick(0, -1); for (let n = 0; n < 60 * 2 && G.phase === 'fight'; n++) {{ G.op.inp.sy = 0.2; S.step(1 / 60); }} return [G.phase, G.log.length]; }})()""")
    ok(r == ['fight', 0], 'pulling a man standing upright does not bring him down', str(r))
    r = E(f"""(() => {{ const G = ({base})(4, 7), S = __sim; G.phase = 'fight'; G.me.z = 0.4; G.op.z = -0.75; G.op.lean = 0.8; G.op.vz = 2; G.op.inp.sy = 1; S.act('dodge'); let n = 0; while (G.phase === 'fight' && n++ < 60 * 4) {{ G.op.inp.sy = 1; if (n === 20) {{ G.me.pushCd = 0; S.act('pushDown'); S.act('pushUp'); }} S.step(1 / 60); }} return [G.log.length && G.log[0].won, G.log.length && G.log[0].how, G.log.length && G.log[0].tech.startsWith('Tsukiotoshi')]; }})()""")
    ok(r[0] is True and r[1] == 'forward' and r[2], 'sidestep a man lunging in: he stumbles past, and a shove puts him down', str(r))
    r = E(f"""(() => {{ const G = ({base})(4, 7), S = __sim; G.phase = 'fight'; G.me.z = 0.4; G.op.z = -0.75; G.op.lean = 0.1; S.act('dodge'); return !!(G.op.stumble > 0); }})()""")
    ok(r is False, 'a sidestep from a man standing upright does not make him stumble')
    r = E(f"""(() => {{ const G = ({base})(4, 8), S = __sim; G.phase = 'fight'; G.me.z = 0.55; G.op.z = -0.56; G.op.str = 5; G.op.plant = 5; S.stick(0, 1); for (let i = 0; i < 120; i++) {{ G.op.inp.sy = 0; S.step(1 / 60); }} const tired = G.me.stam; S.stick(0, 0); G.op.inp.sy = 0; G.op.str = 0.3; for (let i = 0; i < 180; i++) {{ G.op.inp.sy = 0; S.step(1 / 60); }} return [+tired.toFixed(2), +G.me.stam.toFixed(2)]; }})()""")
    ok(r[0] < 0.95 and r[1] > r[0] + 0.08, 'pressing tires you; resting brings the strength back', str(r))
    r = E(f"""(() => {{ const G = ({base})(4, 9), S = __sim; G.phase = 'fight'; G.me.x = 0; G.me.z = 1.65; G.op.x = 0; G.op.z = 0.55; const r0 = Math.hypot(G.me.x, G.me.z); S.act('grip', true); S.step(1 / 60); S.stick(1, 0); for (let i = 0; i < 90; i++) {{ G.op.inp.sy = 0; S.step(1 / 60); }} return [+r0.toFixed(2), +Math.hypot(G.me.x, G.me.z).toFixed(2), G.phase]; }})()""")
    ok(r[1] < r[0] - 0.3 and r[2] == 'fight', 'turning him with the belt at your edge takes you off it', str(r))
    # ---------- Settings ----------
    E("__sim.live(); localStorage.setItem('smo.settings', '{}'); location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(600)
    sw = "['tMus', 'tSfx', 'tVib'].map(i => document.getElementById(i).textContent === 'ON')"
    ok(E("!!document.getElementById('setBtn').offsetParent"), 'the Settings button is on the home screen')
    E("document.getElementById('setBtn').click()"); ok(E("!document.getElementById('ovSet').classList.contains('hidden')"), 'it opens the Settings card')
    E("document.getElementById('tMus').click()"); ok(E(sw) == [False, True, True], 'Music switches off on its own', str(E(sw)))
    E("document.getElementById('tVib').click()"); ok(E(sw) == [False, True, False], 'Vibration switches off on its own', str(E(sw)))
    E("document.getElementById('tSfx').click()"); ok(E(sw) == [False, False, False], 'Sound effects switch off on their own', str(E(sw)))
    E("location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(500)
    ok(E(sw) == [False, False, False], 'the settings are remembered'); E("localStorage.setItem('smo.settings', '{}')")
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
