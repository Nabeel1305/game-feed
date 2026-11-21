#!/usr/bin/env python3
"""Timber with real touches: a drag across the picture turns the felling line (right turns it right); a drag that starts on a
button does not; SAW before a notch does nothing; holding NOTCH cuts the notch for as long as the thumb stays; once notched the
line is fixed; holding SAW cuts the back cut and letting go stops it; the left button becomes WEDGE and a tap drives one in.
Then the rules: a clean notch and a hinge in the green put it in the strip; a hinge left thick makes it sit until wedged; a
hinge cut through lets the lean take it; a tree leaning back, cut through, falls backwards; a hazard or the hiker under it is
a hit; a miss costs a chance and the same tree comes back; every tree in the strip wins. Pause stops the saw. The Settings
switch Music, Sound effects and Vibration on their own and remember them. No errors.
Run: python3 games/timber/test_touch.py"""
import os, sys, math
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
    def tap(x, y, i=5): touch('touchStart', [(i, (x, y))]); touch('touchEnd', [(i, (x, y))]); pg.wait_for_timeout(60)
    def mid(r): return (r['x'] + r['w'] / 2, r['y'] + r['h'] / 2)
    def until(js, ms=15000):
        try: pg.wait_for_function(js, timeout=ms); return True
        except Exception: return False
    E("localStorage.setItem('tim.taught', '3'); __sim.go(4)"); until("__sim.G && __sim.G.tree && __sim.G.wait <= 0")
    E("(() => { const S = __sim.G.tree.spec; S.hiker = null; S.wind = 0; })()")
    a0 = E("__sim.G.tree.aim"); touch('touchStart', [(1, (100, 300))])
    for x in (130, 160, 190, 220): touch('touchMove', [(1, (x, 300))]); pg.wait_for_timeout(30)
    touch('touchEnd', [(1, (220, 300))]); a1 = E("__sim.G.tree.aim"); ok(a1 - a0 > 0.3, 'a drag to the right turns the felling line right', str([a0, a1]))
    L = E("__sim.layout()"); n, s = mid(L['notch']), mid(L['saw'])
    touch('touchStart', [(1, n)]); touch('touchMove', [(1, (n[0] + 120, n[1]))]); a2 = E("__sim.G.tree.aim"); pg.wait_for_timeout(100); touch('touchEnd', [(1, (n[0] + 120, n[1]))]); E("__sim.G.tree.nd = 0; __sim.G.tree.phase = 'aim'")
    ok(abs(E("__sim.G.tree.aim") - a1) < 1e-6, 'a drag that starts on a button does not aim')
    tap(*s); ok(E("__sim.G.tree.bc") == 0 and not E("__sim.G.tree.sawing"), 'SAW before a notch does nothing')
    touch('touchStart', [(2, n)]); pg.wait_for_timeout(150); ok(E("__sim.G.tree.notching") is True, 'holding NOTCH cuts the notch')
    until("__sim.G.tree.nd >= 0.28", 6000); touch('touchEnd', [(2, n)]); pg.wait_for_timeout(60); nd = E("__sim.G.tree.nd")
    ok(not E("__sim.G.tree.notching") and 0.25 < nd < 0.36, 'letting go stops it where it is', str(nd)); pg.wait_for_timeout(300); ok(E("__sim.G.tree.nd") == nd, 'and it stays there')
    a3 = E("__sim.G.tree.aim"); touch('touchStart', [(1, (100, 300))]); touch('touchMove', [(1, (250, 300))]); touch('touchEnd', [(1, (250, 300))]); ok(E("__sim.G.tree.aim") == a3, 'once notched, the line is fixed')
    E("(() => { const T = __sim.G.tree; T.spec.lm = 0; })()")
    touch('touchStart', [(3, s)]); pg.wait_for_timeout(150); ok(E("__sim.G.tree.sawing") is True, 'holding SAW cuts the back cut')
    until("hingeOf(__sim.G.tree) <= 0.16", 9000); touch('touchEnd', [(3, s)]); pg.wait_for_timeout(60); h = E("hingeOf(__sim.G.tree)")
    ok(not E("__sim.G.tree.sawing") and E("__sim.G.tree.phase") == 'cut', 'letting go stops the saw, with the hinge left', str([h, E("__sim.G.tree.phase")]))
    L = E("__sim.layout()"); w0 = E("__sim.G.tree.wedges"); tap(*mid(L['notch'])); ok(E("__sim.G.tree.wedges") > w0, 'the left button is now WEDGE: a tap drives one in')
    for i in range(6): tap(*mid(L['notch'])); pg.wait_for_timeout(80)
    ok(until("['fall', 'down'].includes(__sim.G.tree.phase) || __sim.G.wait > 0", 4000), 'enough wedges tip it over')
    # ---------- the rules (fast, headless) ----------
    run = """(o) => { const S = __sim; S.start(o.N || 4, { seed: o.seed || 7 }); const G = S.G, T = G.tree, sp = T.spec; sp.hiker = o.hiker ? sp.hiker : null; sp.wind = 0; if (!o.keepHaz) sp.haz.length = 0;
      if (o.lean != null) { sp.lm = o.lean; sp.la = sp.t + (o.la || 0); } if (o.hikerAt) { sp.hiker = { cx: Math.cos(sp.t) * sp.h * 0.7, cz: Math.sin(sp.t) * sp.h * 0.7, dir: sp.t + Math.PI / 2, len: 0.01, speed: 0.001, phase: 0 }; }
      if (o.haz) sp.haz.push({ kind: 'cabin', x: Math.cos(sp.t) * sp.h * 0.8, z: Math.sin(sp.t) * sp.h * 0.8, r: 2.2, rot: 0 });
      S.aim(sp.t + (o.off || 0)); S.notchOn(); for (let i = 0; i < 2000 && T.nd < (o.nd != null ? o.nd : 0.29); i++) S.step(1 / 60); S.release(); S.sawOn();
      const want = o.hinge != null ? o.hinge : 0.1; for (let i = 0; i < 4000 && T.phase === 'cut' && hingeOf(T) > want; i++) S.step(1 / 60); if (o.hold) for (let i = 0; i < 40; i++) S.step(1 / 60); S.release();
      let n = 0; for (; n < 600 && T.phase === 'cut' && !o.noWedge; n++) { if (n % 20 === 0) S.wedge(); S.step(1 / 60); }
      for (let i = 0; i < 1200 && T.phase !== 'down'; i++) S.step(1 / 60); return T.res ? { grade: T.res.grade, hit: T.res.hit, lat: +T.res.lat.toFixed(2), back: !!T.back, phase: T.phase, why: T.res.why } : { phase: T.phase }; }"""
    r = E(f"({run})({{}})"); ok(r.get('grade') in ('perfect', 'good'), 'a clean notch and a hinge in the green put it in the strip', str(r))
    r = E(f"({run})({{ hinge: 0.3, noWedge: true }})"); ok(r.get('phase') == 'cut', 'a thick hinge: it sits there until wedged', str(r))
    rs = [E(f"({run})({{ lean: 0.12, la: 1.4, hinge: 0, hold: true, seed: {s} }})") for s in range(6)] ; good = [E(f"({run})({{ lean: 0.12, la: 1.4, seed: {s} }})") for s in range(6)]
    ok(sum(abs(q['lat']) for q in rs) > 1.6 * sum(abs(q['lat']) for q in good), 'a hinge cut through (saw held on as it goes) lets the lean take it further off', str([[q['lat'] for q in rs], [q['lat'] for q in good]]))
    r = E(f"({run})({{ lean: 0.05, la: Math.PI, hinge: 0, noWedge: true }})"); ok(r.get('back') is True and r.get('grade') in ('miss', 'hit'), 'a tree leaning back, cut through, falls backwards', str(r))
    r = E(f"({run})({{ haz: true }})"); ok(r.get('grade') == 'hit' and r.get('hit') == 'the cabin', 'a cabin under it is a hit', str(r))
    r = E(f"({run})({{ hikerAt: true, hiker: true }})"); ok(r.get('grade') == 'hit' and r.get('hit') == 'the hiker', 'the hiker under it is a hit', str(r))
    r = E(f"({run})({{ off: 1.2 }})"); ok(r.get('grade') == 'miss' and r.get('why'), 'off the strip is a miss, and it says why', str(r))
    r = E("""(() => { const S = __sim; S.start(4, { seed: 3 }); const G = S.G, sp = G.tree.spec; G.tree.res = null; S.aim(sp.t + 1.4); S.notchOn(); for (let i = 0; i < 200; i++) S.step(1 / 60); S.release(); S.sawOn(); for (let i = 0; i < 2000 && G.tree.phase !== 'down'; i++) S.step(1 / 60); S.release();
      for (let i = 0; i < 2000 && G.tree.phase !== 'down'; i++) { if (i % 20 === 0) S.wedge(); S.step(1 / 60); } for (let i = 0; i < 400 && G.wait > 0; i++) S.step(1 / 60); return [G.failed, G.tree.spec === sp, G.tree.phase, G.done]; })()""")
    ok(r[0] == 1 and r[1] is True and r[2] == 'aim', 'a miss costs a chance and the same tree comes back', str(r))
    r = E("(() => { const S = __sim; S.start(4, { seed: 3 }); const G = S.G; G.done = G.cfg.trees - 1; G.tree.spec.haz.length = 0; G.tree.spec.hiker = null; G.tree.spec.wind = 0; G.tree.spec.lm = 0; S.aim(G.tree.spec.t); S.notchOn(); for (let i = 0; i < 400 && G.tree.nd < 0.29; i++) S.step(1 / 60); S.release(); S.sawOn(); for (let i = 0; i < 4000 && hingeOf(G.tree) > 0.1 && G.tree.phase === 'cut'; i++) S.step(1 / 60); S.release(); for (let i = 0; i < 3000 && !G.over; i++) { if (i % 20 === 0) S.wedge(); S.step(1 / 60); } return G.over; })()")
    ok(r == 'won', 'every tree in the strip wins the level', str(r))
    E("localStorage.setItem('tim.taught', '3'); __sim.go(4)"); until("__sim.G && __sim.G.tree && __sim.G.wait <= 0"); L = E("__sim.layout()")
    touch('touchStart', [(2, mid(L['notch']))]); pg.wait_for_timeout(150); E("document.getElementById('pauseBtn').click()"); ok(E("__sim.G.tree.notching") is False, 'pausing stops the saw'); touch('touchEnd', [(2, mid(L['notch']))])
    # ---------- Settings ----------
    E("__sim.live(); localStorage.setItem('tim.settings', '{}'); location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(600)
    sw = "['tMus', 'tSfx', 'tVib'].map(i => document.getElementById(i).textContent === 'ON')"
    ok(E("!!document.getElementById('setBtn').offsetParent"), 'the Settings button is on the home screen')
    E("document.getElementById('setBtn').click()"); ok(E("!document.getElementById('ovSet').classList.contains('hidden')"), 'it opens the Settings card')
    E("document.getElementById('tMus').click()"); ok(E(sw) == [False, True, True], 'Music switches off on its own', str(E(sw)))
    E("document.getElementById('tVib').click()"); ok(E(sw) == [False, True, False], 'Vibration switches off on its own', str(E(sw)))
    E("document.getElementById('tSfx').click()"); ok(E(sw) == [False, False, False], 'Sound effects switch off on their own', str(E(sw)))
    E("location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(500)
    ok(E(sw) == [False, False, False], 'the settings are remembered'); E("localStorage.setItem('tim.settings', '{}')")
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
