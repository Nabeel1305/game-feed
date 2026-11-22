#!/usr/bin/env python3
"""Convoy Escort with real touches, held upright and sideways: dragging the wheel right turns the ship right; the throttle
buttons set the speed; PING pings (and waits to ping again); the depth buttons set the depth; DROP drops a pattern; GUN fires
only at a surfaced submarine; the crew buttons send a team; fast-forward speeds up the quiet and refuses in danger; MAP shows
the tactical map. Then the rules: a ping finds a submarine ahead in range (not right astern), and pinging again tightens the
ring to a sure contact; charges at the right depth over a submarine hit it (the wrong depth does not); a submarine will not
fire with the escort close; torpedoes sink a merchant and leave survivors, whom the crew can rescue close by; the convoy in
harbour wins; too many ships lost loses. The Settings switch Music, Sound effects, Vibration and camera shake on their own
and remember them. No errors.
Run: python3 games/convoy/test_touch.py"""
import os, sys
from playwright.sync_api import sync_playwright
here = os.path.dirname(os.path.abspath(__file__)); fails = []; oks = 0
def ok(c, what, d=''):
    global oks
    if c: oks += 1; print('  ok  ', what)
    else: fails.append(what); print('  FAIL', what, d)
with sync_playwright() as p:
    b = p.chromium.launch()
    for vw, vh in ((390, 844), (844, 390)):
        tag = 'upright window' if vh > vw else 'sideways window'
        ctx = b.new_context(viewport={'width': vw, 'height': vh}, has_touch=True, is_mobile=True); pg = ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto('file://' + os.path.join(here, 'index.html')); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(800)
        E = pg.evaluate; cdp = ctx.new_cdp_session(pg)
        def toScreen(x, y): return (vw - y, x) if vh > vw else (x, y)
        def touch(kind, pts): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, x, y in pts]})
        def at(i, gx, gy): x, y = toScreen(gx, gy); return (i, x, y)
        def tapG(gx, gy): touch('touchStart', [at(6, gx, gy)]); touch('touchEnd', [at(6, gx, gy)]); pg.wait_for_timeout(90)
        def mid(bx): return (bx['x'] + bx['w'] / 2, bx['y'] + bx['h'] / 2) if 'w' in bx else (bx['x'], bx['y'])
        E("localStorage.setItem('cvy.taught', '3'); __sim.go(1)"); pg.wait_for_timeout(300)
        E("(() => { const G = __sim.G; G.subs.forEach(s => s.gone = true); })()")
        Wd, Ht = E("[innerWidth > innerHeight ? innerWidth : innerHeight, innerWidth > innerHeight ? innerHeight : innerWidth]"); sx, sy = Wd * 0.35, Ht * 0.6
        h0 = E("__sim.G.me.h"); touch('touchStart', [at(1, sx, sy)]); touch('touchMove', [at(1, sx + 30, sy)]); touch('touchMove', [at(1, sx + 60, sy)]); pg.wait_for_timeout(2500)
        ok(E("__sim.G.stick") > 0.8 and E("__sim.G.me.h") - h0 > 0.1, f'{tag}: dragging the wheel right turns the ship right', str([h0, E("__sim.G.me.h")])); touch('touchEnd', [at(1, sx + 60, sy)]); pg.wait_for_timeout(100)
        ok(E("__sim.G.stick") == 0, f'{tag}: letting go centres the wheel')
        L = E("__sim.layout()")
        E("__sim.G.me.thr = 2"); tapG(*mid(L['speed'])); ok(E("__sim.G.me.thr") == 3, f'{tag}: a tap on SPEED goes from CRUISE to FULL', str(E("__sim.G.me.thr"))); tapG(*mid(L['speed'])); ok(E("__sim.G.me.thr") == 1, f'{tag}: another tap goes to STOP'); tapG(*mid(L['speed'])); ok(E("__sim.G.me.thr") == 2, f'{tag}: and another back to CRUISE')
        tapG(*mid(L['ping'])); ok(E("__sim.G.me.pingCd") > 0, f'{tag}: PING pings'); cd = E("__sim.G.me.pingCd"); tapG(*mid(L['ping'])); ok(E("__sim.G.me.pingCd") <= cd, f'{tag}: and has to wait to ping again')
        d0 = E("__sim.G.me.depth"); tapG(*mid(L['depthBtn'])); ok(E("__sim.G.me.depth") == (d0 + 1) % 3, f'{tag}: a tap on DEPTH moves to the next depth'); tapG(*mid(L['depthBtn'])); tapG(*mid(L['depthBtn'])); ok(E("__sim.G.me.depth") == d0, f'{tag}: three taps come back round')
        c0 = E("__sim.G.me.charges"); tapG(*mid(L['drop'])); ok(E("__sim.G.me.charges") == c0 - 1 and E("__sim.G.blasts.length") == 1, f'{tag}: DROP drops a pattern')
        ok(L['gun'] is None, f'{tag}: no GUN button while no submarine is on the surface'); ok(L['crewBtn'] is None, f'{tag}: no CREW button while there is nothing for them to do')
        E("(() => { const G = __sim.G; G.me.fire = 1; })()"); cb = E("__sim.layout().crewBtn"); ok(cb and cb['job'] == 'fire', f'{tag}: a fire brings up the CREW button'); tapG(*mid(cb)); ok(E("__sim.G.crew.some(c => c.job === 'fire')"), f'{tag}: a tap on it sends a team to the fire')
        tapG(*mid(L['fast'])); ok(E("__sim.G.fast") > 1, f'{tag}: fast-forward speeds up the quiet', str(E("__sim.G.fast")))
        E("(() => { const G = __sim.G; G.torps.push({ x: G.me.x + 900, z: G.me.z, h: 0, run: 0 }); })()"); pg.wait_for_timeout(200); ok(E("__sim.G.fast") == 1, f'{tag}: and drops back to normal in danger')
        tapG(*mid(L['fast'])); ok(E("__sim.G.fast") == 1, f'{tag}: and refuses while there is danger')
        tapG(*mid(L['map'])); ok(E("__sim.ui.map") is True, f'{tag}: MAP shows the tactical map'); tapG(*mid(L['map'])); ok(E("__sim.ui.map") is False, f'{tag}: and hides it')
        ok(not errs, f'{tag}: no JavaScript errors', str(errs[:3])); ctx.close()
    # ---------- the rules ----------
    ctx = b.new_context(viewport={'width': 844, 'height': 390}); pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + os.path.join(here, 'index.html')); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(500); E = pg.evaluate
    PUT = "__sim.start(5, { seed: 4 }); const G = __sim.G, X = __sim.x(), me = G.me, s = G.subs[0]; G.subs.slice(1).forEach(q => q.gone = true); G.lessonNoFire = true; me.thr = 1; me.v = 0;"
    r = E("(() => { " + PUT + " s.state = 'approach'; s.x = me.x + Math.cos(me.h) * 700; s.z = me.z + Math.sin(me.h) * 700; s.v = 0; const out = []; for (let i = 0; i < 5; i++) { me.pingCd = 0; X.ping(G); const c = G.contacts.find(q => q.sub === s.i); out.push(c ? Math.round(c.err) : null); } return out; })()")
    ok(r[0] is not None and r[-1] < r[0] and r[-1] < 45, 'a ping finds a submarine ahead in range, and pinging again tightens it to a sure contact', str(r))
    r = E("(() => { " + PUT + " s.state = 'approach'; s.x = me.x - Math.cos(me.h) * 500; s.z = me.z - Math.sin(me.h) * 500; me.pingCd = 0; X.ping(G); return G.contacts.length; })()")
    ok(r == 0, 'but not one right astern (the baffles)', str(r))
    r = E("""(() => { const out = []; for (const dep of [1, 2]) { """ + PUT + """ s.state = 'lesson'; s.band = 1; s.x = me.x - Math.cos(me.h) * 30; s.z = me.z - Math.sin(me.h) * 30; X.setDepth(G, dep); X.dropCharges(G); for (let i = 0; i < 200; i++) __sim.step(1 / 60); out.push(s.hp); } return out; })()""")
    ok(r[0] < 2 and r[1] == 2, 'charges at the right depth over a submarine hit it; the wrong depth does not', str(r))
    r = E("""(() => { """ + PUT + """ G.lessonNoFire = false; const m = X.live(G)[0]; s.state = 'approach'; s.appT = 99; s.cd = 0; s.x = m.x + 600; s.z = m.z + 400; me.x = s.x + 200; me.z = s.z; me.thr = 2; me.v = 7; let fired = false; for (let i = 0; i < 60 * 3; i++) { const ev = __sim.stepEv(1 / 60); if (ev.some(e => e.k === 'torpedo')) fired = true; } return [fired, s.state]; })()""")
    ok(r[0] is False and r[1] == 'evade', 'a submarine will not fire with the escort close: it goes deep', str(r))
    r = E("""(() => { __sim.start(1, { seed: 4 }); const G = __sim.G, X = __sim.x(), me = G.me; const m = G.M[0]; G.torps.push({ x: m.x - 60, z: m.z, h: 0, run: 0 }); for (let i = 0; i < 60 * 5; i++) __sim.step(1 / 60); return [m.sunk, G.surv.length, G.over]; })()""")
    ok(r[0] is True and r[1] > 0, 'a torpedo sinks a merchant and leaves survivors in the water', str(r))
    r = E("""(() => { __sim.start(8, { seed: 4 }); const G = __sim.G, X = __sim.x(), me = G.me; G.subs.forEach(q => q.gone = true); G.surv.push({ x: me.x + 80, z: me.z, t: 0 }, { x: me.x + 90, z: me.z + 10, t: 0 }); me.thr = 1; me.v = 0; X.crewJob(G, 'rescue'); for (let i = 0; i < 60 * 12; i++) __sim.step(1 / 60); return [G.rescued, G.surv.length]; })()""")
    ok(r[0] >= 2 and r[1] == 0, 'the crew rescues survivors close by', str(r))
    r = E("""(() => { __sim.start(4, { seed: 4 }); const G = __sim.G; G.subs.forEach(q => q.gone = true); G.cv.x = G.port.x - Math.cos(G.dir) * 30; G.cv.z = G.port.z - Math.sin(G.dir) * 30; for (let i = 0; i < 60 * 8 && !G.over; i++) __sim.step(1 / 60); return [G.over, G.res && G.res.alive]; })()""")
    ok(r[0] == 'won', 'the convoy in harbour wins', str(r))
    r = E("""(() => { __sim.start(4, { seed: 4 }); const G = __sim.G; G.subs.forEach(q => q.gone = true); G.M.slice(0, 2).forEach(m => { m.sunk = true; }); __sim.step(1 / 60); return [G.over, G.res && G.res.why]; })()""")
    ok(r == ['lost', 'convoy'], 'too many ships lost loses', str(r))
    # settings
    E("__sim.live(); localStorage.setItem('cvy.settings', '{}'); location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(600)
    sw = "['tMus', 'tSfx', 'tVib', 'tShake'].map(i => document.getElementById(i).textContent === 'ON')"
    E("document.getElementById('setBtn').click()"); ok(E("!document.getElementById('ovSet').classList.contains('hidden')"), 'the Settings button opens the Settings card')
    E("document.getElementById('tMus').click()"); ok(E(sw) == [False, True, True, True], 'Music switches off on its own', str(E(sw)))
    E("document.getElementById('tVib').click()"); ok(E(sw) == [False, True, False, True], 'Vibration switches off on its own', str(E(sw)))
    E("document.getElementById('tSfx').click()"); ok(E(sw) == [False, False, False, True], 'Sound effects switch off on their own', str(E(sw)))
    E("document.getElementById('tShake').click()"); ok(E(sw) == [False, False, False, False], 'camera shake switches off on its own', str(E(sw)))
    E("location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(500)
    E("document.getElementById('setBtn').click()"); ok(E(sw) == [False, False, False, False], 'the settings are remembered'); E("localStorage.setItem('cvy.settings', '{}'); localStorage.removeItem('cvy.shake')")
    ok(not errs, 'no JavaScript errors', str(errs[:3])); ctx.close(); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
