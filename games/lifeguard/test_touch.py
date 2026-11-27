#!/usr/bin/env python3
"""Beach Watch with real touches: a tap on someone drifting in a rip whistles them back; a tap on someone in trouble sends you
running and swimming out; a second tap while you are out does not send you again; once you have them, a tap on the beach is
where you bring them in, and they are safe; a tap on the gap in the waves plants a red flag (and swimmers keep out of that rip);
a tap on open water does nothing but cost a moment; a tap on someone who is fine sends you out for nothing and you must go back
up the tower first. Then the rules: trouble left too long is a miss; two misses close the beach; the shift ends in a win.
Pause stops the clock. The Settings switch Music, Sound effects and Vibration on their own and remember them. No errors.
Run: python3 games/lifeguard/test_touch.py"""
import os, sys
from playwright.sync_api import sync_playwright
here = os.path.dirname(os.path.abspath(__file__)); fails = []; oks = 0
def ok(c, what, d=''):
    global oks
    if c: oks += 1; print('  ok  ', what)
    else: fails.append(what); print('  FAIL', what, d)
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']); ctx = b.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True); pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + os.path.join(here, 'index.html')); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(800)
    E = pg.evaluate; E("Object.assign(window, __sim.x())"); cdp = ctx.new_cdp_session(pg)
    def touch(kind, pts): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, (x, y) in pts]})
    def tap(x, y): touch('touchStart', [(5, (x, y))]); touch('touchEnd', [(5, (x, y))]); pg.wait_for_timeout(120)
    def until(js, ms=30000):
        try: pg.wait_for_function(js, timeout=ms); return True
        except Exception: return False
    def scr(x, y, z): return E(f"(() => {{ const p = scrOf({x}, {y}, {z}); return [p.x, p.y]; }})()")
    def setup(N, people):      # a quiet beach with exactly these people: [x, z, state]
        E(f"localStorage.setItem('lg.taught', '3'); __sim.go({N})"); pg.wait_for_timeout(300)
        E("""(people) => { const G = __sim.G; G.sw = []; G.tired = []; G.next = 1e9; G.cfg.wind = false; G.lives = G.cfg.lives; people.forEach(([x, z, st]) => { const s = addSwimmer(G, true, { kid: false, x, z }); s.tx = x; s.tz = z; s.stay = 1e9; s.st = st; if (st === 'trouble') { s.tr = 0; s.T = 1e9; } if (st === 'risk') s.rt = 0; }); G.rips.forEach(r => { r.v = 0.0001; }); window.__ids = G.sw.map(s => s.id); __sim.ui.snap = true; }""", people)
        pg.wait_for_timeout(400)
    sw = lambda i, f: E(f"__sim.G.sw.find(s => s.id === window.__ids[{i}]).{f}")
    # ---------- whistle, go, bring in ----------
    setup(4, [[-4, 6, 'ok'], [3.5, 5, 'ok'], [0, 8, 'ok']])
    r0 = E("__sim.G.rips[0]"); E(f"(() => {{ const s = __sim.G.sw.find(q => q.id === window.__ids[2]); s.x = {r0['x']}; s.tx = s.x; s.z = 8; s.st = 'risk'; s.rt = 0; s.cause = 'rip'; }})()"); pg.wait_for_timeout(200)
    tap(*scr(sw(2, 'x'), 0.2, sw(2, 'z'))); ok(sw(2, 'st') == 'ok' and E("__sim.G.whistles") == 1, 'a tap on someone drifting in a rip whistles them back', E("[__sim.G.sw[2].st, __sim.G.whistles]"))
    ok(E("__sim.G.lg.st") == 'tower', 'and you stay up the tower')
    E(f"(() => {{ const s = __sim.G.sw.find(q => q.id === window.__ids[0]); s.st = 'trouble'; s.tr = 0; s.T = 1e9; }})()"); pg.wait_for_timeout(200)
    tap(*scr(sw(0, 'x'), 0.2, sw(0, 'z'))); ok(E("__sim.G.lg.st") == 'go', 'a tap on someone in trouble sends you out', E("__sim.G.lg.st"))
    tap(*scr(sw(1, 'x'), 0.2, sw(1, 'z'))); ok(E("__sim.G.lg.target") == E("window.__ids[0]"), 'while you are out, another tap does not send you again')
    ok(until("__sim.G.lg.st === 'tow'"), 'you reach them and take hold')
    pg.wait_for_timeout(300); bx = E("__sim.G.lg.x"); land = scr(bx + 1.5, 0.3, -1.5); tap(*land); ok(E("__sim.G.lg.land") is not None and abs(E("__sim.G.lg.land.x") - (bx + 1.5)) < 1.2, 'a tap on the beach is where you bring them in', E("[__sim.G.lg.land, " + str(bx + 1.5) + "]"))
    ok(until("__sim.G.saved === 1"), 'and they are safe')
    ok(until("__sim.G.lg.st === 'tower'"), 'you go back up the tower')
    # ---------- a flag ----------
    r = E("__sim.G.rips[1]"); tap(*scr(r['x'], 0.05, 13)); ok(E("__sim.G.rips[1].flag") is True and E("__sim.G.flags") == 1, 'a tap on the gap in the waves plants a red flag', E("[__sim.G.rips[1].flag, __sim.G.flags]"))
    ok(E("(() => { const G = __sim.G, r = G.rips[1]; let bad = 0; for (let i = 0; i < 40; i++) { const s = G.sw.find(q => q.id === window.__ids[1]); pickSpot(G, s); if (ripAt(G, s.tx, s.tz) === r) bad++; } return bad; })()") == 0, 'swimmers keep out of a flagged rip')
    # ---------- open water; a false alarm ----------
    E("__sim.G.fog = 0"); f0 = E("__sim.G.lg.st"); tap(*scr(-1.2 if abs(E('__sim.G.rips[0].x') + 1.2) > 2.5 else 1.8, 0.05, 21)); ok(E("__sim.G.fog") > 0 and E("__sim.G.lg.st") == f0, 'a tap on open water does nothing but cost a moment')
    pg.wait_for_timeout(800); fa = E("__sim.G.falses"); tap(*scr(sw(1, 'x'), 0.2, sw(1, 'z'))); ok(E("__sim.G.lg.st") == 'go', 'a tap on someone who is fine sends you out anyway')
    ok(until(f"__sim.G.falses === {fa + 1}"), 'for nothing: a false alarm')
    E("(() => { const s = __sim.G.sw.find(q => q.id === window.__ids[2]); s.st = 'trouble'; s.tr = 0; s.T = 1e9; })()"); pg.wait_for_timeout(200)
    tap(*scr(sw(2, 'x'), 0.2, sw(2, 'z'))); ok(E("__sim.G.lg.st") == 'back', 'and you cannot go again until you are back up the tower', E("__sim.G.lg.st"))
    # ---------- the rules ----------
    E("__sim.start(4, { seed: 5 }); (() => { const G = __sim.G; G.sw = []; G.tired = []; G.next = 1e9; G.cfg.wind = false; const s = addSwimmer(G, true, { x: 3, z: 6 }); s.st = 'trouble'; s.tr = 0; s.T = 5; s.stay = 1e9; for (let i = 0; i < 60 * 7; i++) __sim.step(1 / 60); })()")
    ok(E("__sim.G.missed") == 1 and E("__sim.G.lives") == E("__sim.G.cfg.lives") - 1 and E("__sim.G.over") is None, 'trouble left too long is a miss (the jet ski gets them)')
    E("__sim.G.lives = 1")      # (27 Nov 2026: three misses from level 2; here the last one is left)
    E("(() => { const G = __sim.G; const s = addSwimmer(G, true, { x: -3, z: 6 }); s.st = 'trouble'; s.tr = 0; s.T = 3; s.stay = 1e9; for (let i = 0; i < 60 * 5; i++) __sim.step(1 / 60); })()")
    ok(E("__sim.G.over") == 'lost', 'the last miss closes the beach')
    E("__sim.start(4, { seed: 5 }); (() => { const G = __sim.G; G.sw = []; G.tired = []; G.next = 1e9; G.cfg.wind = false; G.cfg.shift = 5; for (let i = 0; i < 60 * 7; i++) __sim.step(1 / 60); })()")
    ok(E("__sim.G.over") == 'won', 'the shift ends in a win')
    E("localStorage.setItem('lg.taught', '3'); __sim.go(3)"); pg.wait_for_timeout(400)
    E("document.getElementById('pauseBtn').click()"); t1 = E("__sim.G.t"); pg.wait_for_timeout(400); ok(E("__sim.G.t") == t1, 'pause stops the clock'); E("document.getElementById('pResume').click()")
    # ---------- Settings ----------
    E("__sim.live(); localStorage.setItem('lg.settings', '{}'); location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(600)
    swc = "['tMus', 'tSfx', 'tVib'].map(i => document.getElementById(i).textContent === 'ON')"
    ok(E("!!document.getElementById('setBtn').offsetParent"), 'the Settings button is on the home screen')
    E("document.getElementById('setBtn').click()"); ok(E("!document.getElementById('ovSet').classList.contains('hidden')"), 'it opens the Settings card')
    E("document.getElementById('tMus').click()"); ok(E(swc) == [False, True, True], 'Music switches off on its own', str(E(swc)))
    E("document.getElementById('tVib').click()"); ok(E(swc) == [False, True, False], 'Vibration switches off on its own', str(E(swc)))
    E("document.getElementById('tSfx').click()"); ok(E(swc) == [False, False, False], 'Sound effects switch off on their own', str(E(swc)))
    E("location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(500)
    ok(E(swc) == [False, False, False], 'the settings are remembered'); E("localStorage.setItem('lg.settings', '{}')")
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
