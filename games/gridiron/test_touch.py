#!/usr/bin/env python3
"""Gridiron with real touches, held upright and sideways: a tap on a play card picks it and a tap on SNAP starts the play;
dragging the stick moves you (up the screen is down the field); letting go stops; on a pass play a tap on a receiver's button
throws to that receiver; on a run play HANDOFF gives the ball to the back, and then the button is DODGE; SPRINT held sprints.
On defence: SWITCH takes the player nearest the ball, TACKLE close to the carrier brings him down, a dive at nothing leaves
you on the ground. Then the rules: a gain past the yellow line is a first down, a short gain is the next down, a throw that
falls is the same spot, four downs without the line is their ball, a touchdown is seven. The Settings switch Music, Sound
effects and Vibration on their own and remember them. No errors.
Run: python3 games/gridiron/test_touch.py"""
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
        def tapAt(gx, gy, i=4): x, y = toScreen(gx, gy); touch('touchStart', [(i, x, y)]); touch('touchEnd', [(i, x, y)]); pg.wait_for_timeout(60)
        def until(js, ms=8000):
            try: pg.wait_for_function(js, timeout=ms); return True
            except Exception: return False
        def tapBox(bx): tapAt(bx['x'] + bx['w'] / 2, bx['y'] + bx['h'] / 2)
        # a fresh drive of ours at level 6 (every play open), the clock held still between steps
        FRESH = """(() => { __sim.go(6); const G = __sim.G, X = __sim.x(); G.lesson = null; G.cfg.plays = ['dive', 'sweep', 'slant', 'deep', 'curl']; G.plan = [0, 1]; G.drive = 0; X.startDrive(G); G.pause = 0; G.after = null; })()"""
        E("localStorage.setItem('grd.taught', '3')"); E(FRESH); pg.wait_for_timeout(200); E("__sim.G.pause = 0")
        ok(E("__sim.G.phase") == 'pick' and E("__sim.G.att") == 0, f'{tag}: a drive starts with the play cards', E("[__sim.G.phase, __sim.G.att]"))
        L = E("__sim.layout()"); card = next(c for c in L['cards'] if c['key'] == 'slant')
        tapBox(card); ok(E("__sim.G.play") == 'slant', f'{tag}: a tap on a play card picks it', E("__sim.G.play"))
        tapBox(L['snap']); ok(E("__sim.G.phase") == 'live', f'{tag}: a tap on SNAP starts the play', E("__sim.G.phase"))
        E("(() => { const G = __sim.G; G.P.filter(q => q.t === 1).forEach(q => { q.x = 15; q.z = G.los + 30; q.held = 99; }); })()")      # the defence out of the way while the buttons are tried
        pg.wait_for_timeout(500)
        rb = E("__sim.x().recvButtons(__sim.G)"); ok(len(rb) >= 2, f'{tag}: on a pass play each receiver has a button', str(len(rb)))
        if rb:
            tgt = rb[0]; tapAt(tgt['x'], tgt['y']); r = E("[__sim.G.ball.kind, __sim.G.ball.to && __sim.G.ball.to.id]")
            ok(r[0] == 'air' and r[1] == tgt['id'], f'{tag}: a tap on a receiver\'s button throws to him', str([r, tgt['id']]))
        # a run play: HANDOFF, then DODGE
        E(FRESH); E("(() => { const G = __sim.G; G.pause = 0; __sim.x().pickPlay(G, 'dive'); __sim.x().snap(G); G.P.filter(q => q.t === 1).forEach(q => { q.x = 15; q.z = G.los + 30; q.held = 99; }); })()")
        ok(E("__sim.x().btnLabels(__sim.G).a") == 'HANDOFF', f'{tag}: on a run play the big button is HANDOFF', E("__sim.x().btnLabels(__sim.G).a"))
        L = E("__sim.layout()"); tapAt(L['a']['x'], L['a']['y'])
        ok(E("__sim.G.handed && __sim.G.ball.own.role") == 'RB' and E("__sim.x().me(__sim.G).role") == 'RB', f'{tag}: HANDOFF gives the ball to the back, and you are him', E("[__sim.G.handed, __sim.G.ball.own && __sim.G.ball.own.role]"))
        ok(E("__sim.x().btnLabels(__sim.G).a") == 'DODGE', f'{tag}: with the ball the big button is DODGE')
        pg.wait_for_timeout(1200); tapAt(L['a']['x'], L['a']['y']); ok(E("__sim.x().me(__sim.G).dodge") > 0, f'{tag}: DODGE dodges')
        # the stick
        Wl, Hl = max(vw, vh), min(vw, vh)
        sx, sy = Wl * 0.22, Hl * 0.55
        a0 = toScreen(sx, sy); a1 = toScreen(sx, sy - 90)
        touch('touchStart', [(1, *a0)]); touch('touchMove', [(1, (a0[0] + a1[0]) / 2, (a0[1] + a1[1]) / 2)]); pg.wait_for_timeout(40); touch('touchMove', [(1, *a1)]); pg.wait_for_timeout(40)
        st = E("[__sim.G.stick.x, __sim.G.stick.z]"); ok(st[1] > 0.8 and abs(st[0]) < 0.2, f'{tag}: dragging the stick up the screen runs down the field', str(st))
        z0 = E("__sim.x().me(__sim.G).z"); pg.wait_for_timeout(400); ok(E("__sim.x().me(__sim.G).z") > z0 + 0.5, f'{tag}: and you go')
        touch('touchEnd', [(1, *a1)]); ok(E("__sim.G.stick.x") == 0 and E("__sim.G.stick.z") == 0, f'{tag}: letting go stops')
        a1 = toScreen(sx + 90, sy); touch('touchStart', [(1, *a0)]); touch('touchMove', [(1, *a1)]); pg.wait_for_timeout(40)
        st = E("[__sim.G.stick.x, __sim.G.stick.z]"); ok(st[0] < -0.8, f'{tag}: dragging right goes to the right of the picture', str(st)); touch('touchEnd', [(1, *a1)])
        sp = toScreen(L['c']['x'], L['c']['y']); touch('touchStart', [(5, *sp)]); pg.wait_for_timeout(60); ok(E("__sim.x().me(__sim.G).sprint") is True, f'{tag}: holding SPRINT sprints'); touch('touchEnd', [(5, *sp)]); pg.wait_for_timeout(60); ok(E("__sim.x().me(__sim.G).sprint") is False, f'{tag}: and letting go stops it')
        # defence
        E(FRESH); E("(() => { const G = __sim.G; G.att = 1; G.plan = [1]; G.drive = 0; __sim.x().startDrive(G); G.pause = 0; G.play = 'dive'; G.pickT = 0; __sim.x().snap(G); G.P.forEach(q => q.think = 99); })()")
        ok(E("__sim.x().btnLabels(__sim.G).a") == 'TACKLE' and E("__sim.x().btnLabels(__sim.G).b") == 'SWITCH', f'{tag}: on defence the buttons are TACKLE and SWITCH')
        E("(() => { const G = __sim.G, c = G.ball.own, ys = G.P.filter(q => q.t === 0); ys.forEach((q, i) => { q.x = -14 + i; q.z = c.z + 20; q.held = 0; q.dodgeCd = 0; }); ys[3].x = c.x + 1.5; ys[3].z = c.z + 1; G.ctrl = ys[0].id; })()")
        L = E("__sim.layout()"); tapAt(L['b']['x'], L['b']['y']); ok(E("__sim.G.ctrl") == E("__sim.G.P.filter(q => q.t === 0)[3].id"), f'{tag}: SWITCH takes the player nearest the ball', E("__sim.G.ctrl"))
        E("(() => { const G = __sim.G, c = G.ball.own, y = __sim.x().me(G); y.x = c.x + 9; y.z = c.z; y.dodgeCd = 0; y.held = 0; })()")
        tapAt(L['a']['x'], L['a']['y']); ok(E("__sim.x().me(__sim.G).held") > 0.5 and E("__sim.G.phase") == 'live', f'{tag}: a dive at nothing leaves you on the ground')
        tackled = False
        for i in range(8):
            E("(() => { const G = __sim.G; if (G.phase !== 'live') { G.phase = 'live'; } const c = G.ball.own, y = __sim.x().me(G); y.x = c.x + 0.6; y.z = c.z; y.dodgeCd = 0; y.held = 0; c.dodge = 0; })()")
            tapAt(L['a']['x'], L['a']['y'])
            if E("__sim.G.phase") == 'done': tackled = True; break
        ok(tackled, f'{tag}: TACKLE close to the carrier brings him down')
        # the replay after a touchdown
        E(FRESH); E("(() => { const G = __sim.G, X = __sim.x(); G.los = 86; G.fdl = 96; X.toPick(G); G.pause = 0; X.pickPlay(G, 'dive'); X.snap(G); X.handoff(G); G.P.forEach(q => { if (q !== G.ball.own) { q.held = 99; q.x = q.t ? 16 : -16; } }); __sim.stick(0, 1); })()")
        ok(until("__sim.G.score[0] === 7", 12000), f'{tag}: (a long run to the end zone)')
        E("__sim.stick(0, 0)"); pg.wait_for_timeout(200)
        ok(E("!!__sim.ui.rpOffer"), f'{tag}: after a touchdown a REPLAY button shows')
        R2 = E("__sim.layout().rp"); pz = E("__sim.G.pause"); tapAt(R2['x'] + R2['w'] / 2, R2['y'] + R2['h'] / 2)
        ok(E("!!__sim.rp()"), f'{tag}: a tap on it plays the run again'); pg.wait_for_timeout(400)
        ok(abs(E("__sim.G.pause") - pz) < 0.05, f'{tag}: the game waits while the replay runs')
        tapAt(Wl * 0.5, Hl * 0.5); ok(not E("!!__sim.rp()"), f'{tag}: a tap ends the replay')
        # the rules
        RULE = """((gain) => { __sim.start(6, { seed: 5 }); const G = __sim.G, X = __sim.x(); G.lesson = null; G.plan = [0, 1]; G.drive = 0; X.startDrive(G); G.pause = 0; X.pickPlay(G, 'dive'); X.snap(G); G.P.forEach(q => { q.think = 99; q.held = 99; }); X.handoff(G); const rb = G.ball.own; rb.z = G.los + gain; G.P.filter(q => q.t === 1)[0].held = 0; return [G.los, G.down, G.fdl]; })"""
        # end the play the way the game does it: a tackle by the nearest defender
        TK = "(() => { const G = __sim.G, o = G.ball.own; __sim.tackle(o); __sim.step(1 / 60); G.pause = 0; if (G.after) { const f = G.after; G.after = null; f(); } return [G.los, G.down, G.fdl, G.att, G.phase]; })()"
        s = E(RULE, 12); r = E(TK); ok(r[1] == 1 and abs(r[0] - (s[0] + 12)) < 0.6 and abs(r[2] - min(100, r[0] + 10)) < 0.01, f'{tag}: a gain past the yellow line is a first down', str([s, r]))
        s = E(RULE, 4); r = E(TK); ok(r[1] == 2 and abs(r[2] - s[2]) < 0.01, f'{tag}: a short gain is the next down, same yellow line', str([s, r]))
        E("(() => { const G = __sim.G; G.down = 4; G.togo = 6; G.fdl = G.los + 6; })()")
        E("(() => { const G = __sim.G, X = __sim.x(); X.pickPlay(G, 'dive'); X.snap(G); G.P.forEach(q => { q.think = 99; q.held = 99; }); X.handoff(G); G.ball.own.z = G.los + 2; })()")
        r = E(TK); E("(() => { const G = __sim.G; G.pause = 0; if (G.after) { const f = G.after; G.after = null; f(); } })()")
        ok(E("__sim.G.att") == 1, f'{tag}: four downs without the yellow line: their ball', str(r))
        s = E("""(() => { __sim.start(6, { seed: 5 }); const G = __sim.G, X = __sim.x(); G.lesson = null; G.plan = [0, 1]; G.drive = 0; X.startDrive(G); G.pause = 0; X.pickPlay(G, 'slant'); X.snap(G); G.P.forEach(q => { q.think = 99; q.held = 99; }); const los = G.los; X.throwTo(G, G.P.filter(q => q.t === 0)[3].id); G.ball.tx = 17; G.ball.tz = los + 30; G.P.filter(q => q.t === 0)[3].x = -17;
            for (let i = 0; i < 200 && G.phase === 'live'; i++) __sim.step(1 / 60); G.pause = 0; if (G.after) { const f = G.after; G.after = null; f(); } return [los, G.los, G.down]; })()""")
        ok(s[0] == s[1] and s[2] == 2, f'{tag}: a throw that falls: same spot, next down', str(s))
        s = E("""(() => { __sim.start(6, { seed: 5 }); const G = __sim.G, X = __sim.x(); G.lesson = null; G.plan = [0, 1]; G.drive = 0; X.startDrive(G); G.pause = 0; X.pickPlay(G, 'dive'); X.snap(G); G.P.forEach(q => { q.think = 99; q.held = 99; }); X.handoff(G); G.ball.own.z = 99.5; G.ball.own.vz = 8;
            for (let i = 0; i < 30 && G.phase === 'live'; i++) __sim.step(1 / 60); return G.score; })()""")
        ok(s == [7, 0], f'{tag}: a touchdown is seven', str(s))
        if vh > vw:
            E("__sim.live(); localStorage.setItem('grd.settings', '{}'); location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(600)
            sw = "['tMus', 'tSfx', 'tVib'].map(i => document.getElementById(i).textContent === 'ON')"
            E("document.getElementById('setBtn').click()"); ok(E("!document.getElementById('ovSet').classList.contains('hidden')"), 'the Settings button opens the Settings card')
            E("document.getElementById('tMus').click()"); ok(E(sw) == [False, True, True], 'Music switches off on its own', str(E(sw)))
            E("document.getElementById('tVib').click()"); ok(E(sw) == [False, True, False], 'Vibration switches off on its own', str(E(sw)))
            E("document.getElementById('tSfx').click()"); ok(E(sw) == [False, False, False], 'Sound effects switch off on their own', str(E(sw)))
            E("location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(500)
            ok(E(sw) == [False, False, False], 'the settings are remembered'); E("localStorage.setItem('grd.settings', '{}')")
        ok(not errs, f'{tag}: no JavaScript errors', str(errs[:3])); ctx.close()
    b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
