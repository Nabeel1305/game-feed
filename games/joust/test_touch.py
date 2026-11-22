#!/usr/bin/env python3
"""Joust with real touches, held upright and sideways: the left thumb leans (drag right leans right, letting go sits up
straight); the right thumb drags the lance's aim (right moves the tip right on the screen, up moves it up) and the aim stays
where it is left; holding BRACE braces and letting go stops; both thumbs at once work. Then the rules: a braced hit in the
centre of their shield breaks the lance (2 points); the same hit unbraced skids off for no point; far off is a miss; bracing too early tires the
arm and the tip sways more; their lance knocks your seat, less when braced; leaning after their aim is set moves their hit off
your shield; an empty seat unhorses (you lose, or they do and you win); training ends after three broken lances; a bout of
three passes is won on points. The Settings switch Music, Sound effects, Vibration, camera shake and slow motion on their own
and remember them. No errors.
Run: python3 games/joust/test_touch.py"""
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
        E("localStorage.setItem('jst.taught', '3'); __sim.go(5)"); pg.wait_for_timeout(300)
        E("(() => { const G = __sim.G; G.pt = -1e9; })()")      # a very long charge, so nothing ends while we touch
        Wd, Ht = E("[innerWidth > innerHeight ? innerWidth : innerHeight, innerWidth > innerHeight ? innerHeight : innerWidth]")
        # the aim: drag right and up on the right half
        a0 = E("[__sim.G.aim.x, __sim.G.aim.y]"); ax, ay = Wd * 0.62, Ht * 0.5
        touch('touchStart', [at(1, ax, ay)]); touch('touchMove', [at(1, ax + 20, ay)]); touch('touchMove', [at(1, ax + 40, ay - 30)]); pg.wait_for_timeout(80)
        a1 = E("[__sim.G.aim.x, __sim.G.aim.y]"); touch('touchEnd', [at(1, ax + 40, ay - 30)]); pg.wait_for_timeout(200); a2 = E("[__sim.G.aim.x, __sim.G.aim.y]")
        ok(a1[0] > a0[0] + 0.05 and a1[1] > a0[1] - 0.001 + 0.05 or (a1[0] > a0[0] + 0.05 and a1[1] >= 0.6 - 1e-6), f'{tag}: dragging right and up moves the aim right and up', str([a0, a1]))
        ok(abs(a2[0] - a1[0]) < 1e-6 and abs(a2[1] - a1[1]) < 1e-6, f'{tag}: the aim stays where you leave it', str([a1, a2]))
        touch('touchStart', [at(1, ax, ay)]); touch('touchMove', [at(1, ax - 20, ay + 20)]); touch('touchMove', [at(1, ax - 40, ay + 60)]); pg.wait_for_timeout(80)
        a3 = E("[__sim.G.aim.x, __sim.G.aim.y]"); touch('touchEnd', [at(1, ax - 40, ay + 60)])
        ok(a3[0] < a2[0] - 0.05 and a3[1] < a2[1] - 0.05, f'{tag}: dragging left and down moves it left and down', str([a2, a3]))
        # the tip on the screen goes the way the thumb went
        s = E("(() => { const X = __sim.x(), G = __sim.G, pt0 = G.pt; G.pt = 3.6; __sim.frame(); const rz = 9 * (X.PASS_T - 3.6); G.aim = { x: 0, y: 0 }; G.body = 0; G.lean = 0; const p0 = X.scrOf(X.tipWorld(G, rz)); G.aim = { x: 0.3, y: 0.3 }; const p1 = X.scrOf(X.tipWorld(G, rz)); G.pt = pt0; return [p0.x, p0.y, p1.x, p1.y]; })()")
        ok(s[2] > s[0] + 3 and s[3] < s[1] - 3, f'{tag}: a higher, more right aim puts the tip higher and further right on the screen', str(s))
        # the lean (left thumb)
        lx, ly = Wd * 0.18, Ht * 0.6
        touch('touchStart', [at(2, lx, ly)]); touch('touchMove', [at(2, lx + 25, ly)]); touch('touchMove', [at(2, lx + 50, ly)]); pg.wait_for_timeout(80)
        l1 = E("__sim.G.lean"); ok(l1 > 0.5, f'{tag}: dragging the left thumb right leans right', str(l1))
        touch('touchMove', [at(2, lx - 50, ly)]); pg.wait_for_timeout(60); ok(E("__sim.G.lean") < -0.5, f'{tag}: and left leans left')
        # both thumbs: hold the lean, press BRACE with the other
        L = E("__sim.layout()"); B = L['brace']
        touch('touchMove', [at(2, lx + 50, ly)]); touch('touchStart', [at(2, lx + 50, ly), at(3, B['x'], B['y'])]); pg.wait_for_timeout(80)
        ok(E("__sim.G.brace") is True and E("__sim.G.lean") > 0.5, f'{tag}: holding BRACE braces, while the other thumb still leans', str([E("__sim.G.brace"), E("__sim.G.lean")]))
        touch('touchEnd', [at(3, B['x'], B['y'])]); pg.wait_for_timeout(60); ok(E("__sim.G.brace") is False, f'{tag}: letting go of BRACE stops bracing')
        touch('touchEnd', [at(2, lx + 50, ly)]); pg.wait_for_timeout(60); ok(abs(E("__sim.G.lean")) < 1e-6, f'{tag}: letting go of the lean sits up straight')
        ok(not errs, f'{tag}: no JavaScript errors', str(errs[:3])); ctx.close()
    # ---------- the rules ----------
    ctx = b.new_context(viewport={'width': 844, 'height': 390}); pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + os.path.join(here, 'index.html')); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(500); E = pg.evaluate
    # one pass: aim so the tip is at (ox, oy) from the shield's centre at the crash, brace `br` seconds before (or not), their lance set by `rv`
    PASS = """((N, ox, oy, br, rv, lean) => { __sim.start(N, { seed: 5 }); const G = __sim.G, X = __sim.x(); Object.assign(G.rv, rv || { err: { x: 1, y: 1 }, braced: false, shift: 0, tellAt: 99 });
      G.cfg = Object.assign({}, G.cfg, { assist: 0 }); let ev = null;
      for (let i = 0; i < 60 * 6 && !ev; i++) { const s = X.sway(G, X.PASS_T), sh = X.rivalShield(G, X.PASS_T); X.setAim(G, sh.x - s.x + ox, sh.y - s.y + oy); if (lean != null && G.pt > X.PASS_T - 0.5) X.setLean(G, lean); if (br != null && G.pt >= X.PASS_T - br && !G.brace) X.braceOn(G, true); ev = __sim.stepEv(1 / 60).find(e => e.k === 'clash') || null; }
      return ev && { q: ev.q, tq: ev.tq, mine: ev.mine, theirs: ev.theirs, broke: ev.broke, braceOk: ev.braceOk, early: ev.braceEarly, bal: G.bal.slice(), tired: G.tired }; })"""
    r = E(PASS + "(5, 0, 0, 0.3)"); ok(r and r['q'] == 'clean' and r['broke'] and r['mine'] == 2, 'a braced hit in the centre of their shield breaks the lance: 2 points', str(r))
    r = E(PASS + "(5, 0, 0, null)"); ok(r and r['q'] == 'clean' and not r['broke'] and r['mine'] == 0, 'the same hit unbraced skids off: no point', str(r))
    r = E(PASS + "(5, 0, 0, 1.5)"); ok(r and r['q'] in ('clean', 'shield') and not r['broke'] and r['mine'] == 1, 'braced too early it is only 1 point (no lance break)', str(r))
    r = E(PASS + "(5, 0.17, 0, 0.3)"); ok(r and r['q'] == 'shield' and r['mine'] == 1, 'off the centre but on the shield is 1 point', str(r))
    r = E(PASS + "(5, 0.5, 0, 0.3)"); ok(r and r['q'] == 'miss' and r['mine'] == 0, 'far off the shield is a miss', str(r))
    r = E(PASS + "(5, 0, 0, 2.0)"); ok(r and r['early'] and r['tired'] > 0.3, 'bracing far too early tires the arm', str(r))
    r = E("(() => { __sim.start(5, { seed: 5 }); const G = __sim.G, X = __sim.x(); const a = []; for (const t of [0, 1]) { G.tired = t; let m = 0; for (let i = 0; i < 100; i++) { const s = X.sway(G, i * 0.03); m = Math.max(m, Math.hypot(s.x, s.y)); } a.push(m); } return a; })()")
    ok(r[1] > r[0] * 1.8, 'and a tired arm makes the tip sway much more', str(r))
    hard = "{ err: { x: 0, y: 0 }, braced: true, shift: 0, tellAt: 99 }"
    r1 = E(PASS + f"(5, 0.5, 0, null, {hard})"); r2 = E(PASS + f"(5, 0.5, 0, 0.3, {hard})")
    ok(r1['tq'] == 'clean' and r1['theirs'] == 2 and r2['bal'][0] < r1['bal'][0] * 0.6, 'their braced hit knocks your seat, much less when you are braced', str([r1['bal'], r2['bal']]))
    r = E(PASS + f"(5, 0.5, 0, 0.3, {hard}, 1)"); ok(r['tq'] in ('glance', 'miss', 'shield') and r['theirs'] <= 1, 'leaning late moves their hit off the centre of your shield', str(r))
    r = E("""(() => { __sim.start(5, { seed: 5 }); const G = __sim.G, X = __sim.x(); G.bal[0] = 0.95; Object.assign(G.rv, { err: { x: 0, y: 0 }, braced: true }); for (let i = 0; i < 60 * 6 && !G.over; i++) { X.setAim(G, 0.7, -0.6); __sim.step(1 / 60); } return [G.over, G.res && G.res.why]; })()""")
    ok(r == ['lost', 'unseated'], 'an empty seat unhorses you: the bout is lost', str(r))
    r = E("""(() => { __sim.start(5, { seed: 5 }); const G = __sim.G, X = __sim.x(); G.bal[1] = 0.97; Object.assign(G.rv, { err: { x: 1, y: 1 }, braced: false }); const s = X.sway(G, X.PASS_T), sh = X.rivalShield(G, X.PASS_T); G.cfg = Object.assign({}, G.cfg, { assist: 0 }); for (let i = 0; i < 60 * 6 && !G.over; i++) { X.setAim(G, sh.x - s.x, sh.y - s.y); if (G.pt > X.PASS_T - 0.3 && !G.brace) X.braceOn(G, true); __sim.step(1 / 60); } return [G.over, G.res && G.res.why]; })()""")
    ok(r == ['won', 'unseat'], 'unhorse them and you win outright', str(r))
    r = E("""(() => { __sim.start(1, { seed: 5 }); const G = __sim.G, X = __sim.x(); G.cfg = Object.assign({}, G.cfg, { assist: 0 }); for (let i = 0; i < 60 * 60 && !G.over; i++) { const s = X.sway(G, X.PASS_T), sh = X.rivalShield(G, X.PASS_T); X.setAim(G, sh.x - s.x, sh.y - s.y); if (G.phase === 'charge' && G.pt > X.PASS_T - 0.3 && !G.brace) X.braceOn(G, true); __sim.step(1 / 60); } return [G.over, G.res && G.res.why, G.pass]; })()""")
    ok(r[0] == 'won' and r[1] == 'trained' and r[2] == 3, 'training ends when three lances are broken', str(r))
    r = E("""(() => { __sim.start(5, { seed: 5 }); const G = __sim.G, X = __sim.x(); G.cfg = Object.assign({}, G.cfg, { assist: 0 }); let n = 0; for (let i = 0; i < 60 * 60 && !G.over; i++) { if (G.phase === 'charge' && G.pt < 0.02) { Object.assign(G.rv, { err: { x: 1, y: 1 } }); } const s = X.sway(G, X.PASS_T), sh = X.rivalShield(G, X.PASS_T); X.setAim(G, sh.x - s.x + 0.17, sh.y - s.y); if (G.phase === 'charge' && G.pt > X.PASS_T - 0.3 && !G.brace) X.braceOn(G, true); __sim.step(1 / 60); } return [G.over, G.res && G.res.why, G.pass, G.pts]; })()""")
    ok(r[0] == 'won' and r[1] == 'points' and r[2] == 3, 'a bout of three passes is won on points', str(r))
    # ---------- settings ----------
    E("__sim.live(); localStorage.setItem('jst.settings', '{}'); localStorage.removeItem('jst.shake'); localStorage.removeItem('jst.slow'); location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(600)
    sw = "['tMus', 'tSfx', 'tVib', 'tShake', 'tSlow'].map(i => document.getElementById(i).textContent === 'ON')"
    E("document.getElementById('setBtn').click()"); ok(E("!document.getElementById('ovSet').classList.contains('hidden')"), 'the Settings button opens the Settings card')
    ok(E(sw) == [True] * 5, 'everything starts on', str(E(sw)))
    E("document.getElementById('tMus').click()"); ok(E(sw) == [False, True, True, True, True], 'Music switches off on its own', str(E(sw)))
    E("document.getElementById('tVib').click()"); ok(E(sw) == [False, True, False, True, True], 'Vibration switches off on its own', str(E(sw)))
    E("document.getElementById('tShake').click()"); ok(E(sw) == [False, True, False, False, True], 'camera shake switches off on its own', str(E(sw)))
    E("document.getElementById('tSlow').click()"); ok(E(sw) == [False, True, False, False, False], 'slow motion switches off on its own', str(E(sw)))
    E("document.getElementById('tSfx').click()"); ok(E(sw) == [False] * 5, 'Sound effects switch off on their own', str(E(sw)))
    E("location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(500)
    ok(E(sw) == [False] * 5, 'the settings are remembered'); E("localStorage.setItem('jst.settings', '{}'); localStorage.removeItem('jst.shake'); localStorage.removeItem('jst.slow')")
    ok(not errs, 'no JavaScript errors', str(errs[:3])); ctx.close(); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
