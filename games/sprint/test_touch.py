#!/usr/bin/env python3
"""Sprint with real thumbs: a touch on the left half is the left foot, on the right half the right foot; two thumbs at once
jump a hurdle; a touch on SET is a false start and a second puts you out; while paused touches do nothing. Then the rules,
stepped exactly: on the beat is PERFECT and drives you on; far too soon trips you; the same side twice trips you; late lets
you slow; the green mark jumps a hurdle cleanly and no jump hits it; a dip at the line takes a few hundredths off; your best
run is saved as a ghost and runs with you next time; Your kit picks the colour you run in. No errors.
Run: python3 games/sprint/test_touch.py"""
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
    def touch(*pts):
        cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x, 'y': y, 'id': i + 1} for i, (x, y) in enumerate(pts)]})
        cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []}); pg.wait_for_timeout(30)
    def until(cond, ms=8000):
        try: pg.wait_for_function(cond, timeout=ms); return True
        except Exception: return False
    E("localStorage.setItem('spr.taught', '3'); __sim.go(6)")
    ok(until("__sim.G.phase === 'set'"), 'the race goes to SET by itself')
    touch((80, 700)); ok(E("__sim.G.fs") == 1 and E("__sim.G.phase") == 'marks', 'a touch on SET is a false start: everyone back to the blocks', str(E("[__sim.G.fs, __sim.G.phase]")))
    until("__sim.G.phase === 'set'"); touch((300, 700)); pg.wait_for_timeout(50)
    ok(E("__sim.G.over") == 'lost' and E("__sim.G.res.dq"), 'a second false start: disqualified', str(E("[__sim.G.over, __sim.G.res && __sim.G.res.dq]")))
    E("__sim.go(6)"); ok(until("__sim.G.phase === 'run' && __sim.G.t - __sim.G.gunT > 0.15"), 'the gun goes')
    touch((80, 700)); ok(E("__sim.G.you.started") and E("__sim.G.you.last.side") == 'L' and E("__sim.G.you.side") == 'R', 'a touch on the left half is the left foot: off the blocks, the right foot next', str(E("[__sim.G.you.started, __sim.G.you.last && __sim.G.you.last.side, __sim.G.you.side]")))
    pg.wait_for_timeout(150); touch((80, 700)); ok(E("__sim.G.you.stumbles") == 1, 'the left again: the wrong foot, a trip', str(E("__sim.G.you.stumbles")))
    pg.wait_for_timeout(600); touch((310, 700)); ok(E("__sim.G.you.last.side") == 'R' and E("__sim.G.you.stumbles") == 1, 'a touch on the right half is the right foot', str(E("[__sim.G.you.last.side, __sim.G.you.stumbles]")))
    E("document.getElementById('pauseBtn').click()"); pg.wait_for_timeout(150); n = E("__sim.G.you.strides"); touch((80, 700)); touch((310, 700))
    ok(E("__sim.G.you.strides") == n and E("__sim.G.you.stumbles") == 1, 'touches while paused do nothing')
    E("document.getElementById('pResume').click()")
    # two thumbs at once: a jump (the hurdles)
    E("__sim.go(8)"); until("__sim.G.phase === 'run' && __sim.G.t - __sim.G.gunT > 0.2"); touch((80, 700)); pg.wait_for_timeout(200)
    touch((80, 700), (310, 700)); pg.wait_for_timeout(20); ok(E("__sim.G.you.air") > 0 or E("__sim.G.you.hi") > 0, 'two thumbs at once: a jump', str(E("[__sim.G.you.air, __sim.G.you.stumbles]")))
    # ---------- the rules, stepped exactly ----------
    run = """(N, fn) => { const S = __sim; S.start(N, { seed: 5 }); const G = S.G; while (G.phase !== 'run') S.step(1 / 120); for (let i = 0; i < 30; i++) S.step(1 / 120); S.tap('L'); return fn(G, S); }"""
    r = E(f"({run})(6, (G, S) => {{ const out = []; for (let n = 0; n < 12; n++) {{ while (G.t < G.you.due) S.step(1 / 240); const v = G.you.v; S.tap(G.you.side); const e = G.ev.filter(x => x.k === 'stride').pop(); out.push([e && e.q, +(G.you.v - v).toFixed(2)]); G.ev.length = 0; }} return [out, G.you.flow, +G.you.v.toFixed(2)]; }})")
    ok(all(q == 'perfect' and dv > 0 for q, dv in r[0][:6]) and r[1] >= 10 and r[2] > 9, 'on the beat: PERFECT every time, faster each stride, FLOW builds', str(r))
    r = E(f"({run})(6, (G, S) => {{ for (let n = 0; n < 6; n++) {{ while (G.t < G.you.due) S.step(1 / 240); S.tap(G.you.side); }} while (G.t < G.you.due - 0.145) S.step(1 / 240); const v = G.you.v; S.tap(G.you.side); return [G.you.stumbles, +(G.you.v / v).toFixed(2), G.you.flow]; }})")
    ok(r[0] == 1 and r[1] < 0.7 and r[2] == 0, 'far too soon: a trip, speed lost, FLOW gone', str(r))
    r = E(f"({run})(6, (G, S) => {{ for (let n = 0; n < 6; n++) {{ while (G.t < G.you.due) S.step(1 / 240); S.tap(G.you.side); }} while (G.t < G.you.due) S.step(1 / 240); S.tap(G.you.side === 'L' ? 'R' : 'L'); return G.you.stumbles; }})")
    ok(r == 1, 'the same side twice: a trip', str(r))
    r = E(f"({run})(6, (G, S) => {{ for (let n = 0; n < 6; n++) {{ while (G.t < G.you.due) S.step(1 / 240); S.tap(G.you.side); }} const v = G.you.v; while (G.t < G.you.due + 0.3) S.step(1 / 240); const v2 = G.you.v; G.ev.length = 0; S.tap(G.you.side); return [+(v2 / v).toFixed(2), G.ev.find(x => x.k === 'stride').q]; }})")
    ok(r[0] < 0.92 and r[1] == 'late', 'late: you slow while you wait, and the push is weak', str(r))
    jump = """(G, S, at) => { let clear = 0, clip = 0; while (G.you.hi < 3 && !G.over) { const h = G.H[G.you.hi], L = G.you.v * 0.48; if (G.you.air <= 0 && G.you.s >= h - L * at && h - G.you.s < 9 && at > 0) { S.tap('L'); S.tap('R'); } else if (G.you.air <= 0 && G.you.stag <= 0 && G.t >= G.you.due) S.tap(G.you.side || 'L'); for (const e of S.stepEv(1 / 240)) { if (e.k === 'clear') clear++; if (e.k === 'clip') clip++; } } return [clear, clip]; }"""
    r = E(f"({run})(8, (G, S) => ({jump})(G, S, 0.5))"); ok(r == [3, 0], 'jumping as the hurdle reaches the green mark clears it', str(r))
    r = E(f"({run})(8, (G, S) => ({jump})(G, S, 0))"); ok(r[1] == 3, 'no jump: the hurdle is hit', str(r))
    dip = """(G, S, d) => { let dipped = false; while (G.you.fin == null) { if (d && !dipped && G.D - G.you.s < d) { dipped = true; S.tap('L'); S.tap('R'); } else if (G.you.air <= 0 && G.you.dip <= 0 && G.you.stag <= 0 && G.t >= G.you.due) S.tap(G.you.side || 'L'); S.step(1 / 240); } return +(G.you.fin - G.gunT).toFixed(3); }"""
    t0 = E(f"({run})(6, (G, S) => ({dip})(G, S, 0))"); t1 = E(f"({run})(6, (G, S) => ({dip})(G, S, 1.8))")
    ok(0.02 < t0 - t1 < 0.08, 'a dip at the line takes a few hundredths off', str([t0, t1]))
    # the ghost of your best
    E("localStorage.removeItem('spr.ghost'); localStorage.removeItem('spr.pb'); __sim.go(6)"); until("__sim.G.phase === 'run'")
    E("(() => { const G = __sim.G; G.trace = Array.from({ length: 80 }, (_, i) => i * 0.8); __sim.winNow(); })()"); pg.wait_for_timeout(400)
    ok(E("!!(__sim.store.get('ghost', {})['60'] && __sim.store.get('pb', {})['60'] != null)"), 'a best time is saved with its ghost', str(E("__sim.store.get('pb', {})")))
    E("__sim.go(6)"); pg.wait_for_timeout(400); ok(E("!!__sim.ui.ghost"), 'the next 60 m: your ghost runs with you')
    # your kit
    E("localStorage.setItem('spr.stars', JSON.stringify({1: 3, 2: 3})); __sim.showAqua()"); pg.wait_for_timeout(200)
    ok(E("document.querySelectorAll('#aqGrid .aq').length") == E("__sim.SKINS.length"), 'Your kit lists every colour')
    E("document.querySelectorAll('#aqGrid .aq')[1].click()"); ok(E("__sim.mySkin().id") == E("__sim.SKINS[1].id"), 'tapping an open one picks it, and you run in it')
    E("localStorage.setItem('spr.stars', '{}'); __sim.showAqua(); document.querySelectorAll('#aqGrid .aq')[3].click()"); ok(E("__sim.store.get('skin')") == E("__sim.SKINS[1].id"), 'a locked one cannot be picked')
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
