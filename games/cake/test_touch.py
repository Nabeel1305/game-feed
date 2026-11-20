#!/usr/bin/env python3
"""Cake Designer with a real thumb: a tap sets the gliding tier down where it is; a tap on the icing that matches the card
picks it; holding the thumb on the cake and sliding up and down ices it (a thumb held off the cake does nothing); a tap on a
topping's spot puts the topping there. Then the rules, stepped exactly: a swirl piped as its dot passes is PERFECT, half a
gap off is OFF; the wrong icing colour fails the cake however good it is; a cake made well scores 94 or more; Your bakery
picks the stand. No errors.
Run: python3 games/cake/test_touch.py"""
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
    def down(x, y): cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x, 'y': y, 'id': 1}]})
    def mv(x, y): cdp.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': [{'x': x, 'y': y, 'id': 1}]})
    def up(): cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []}); pg.wait_for_timeout(40)
    def tap(x, y): down(x, y); up()
    def until(js, ms=15000):
        try: pg.wait_for_function(js, timeout=ms); return True
        except Exception: return False
    E("localStorage.setItem('cks.taught', '3'); __sim.go(7)"); pg.wait_for_timeout(400)
    x0 = E("__sim.G.st.x"); tap(195, 500); r = E("[__sim.G.tiers.length, __sim.G.tiers[0] && __sim.G.tiers[0].off]")
    ok(r[0] == 1 and abs(r[1] - x0) < 0.25, 'a tap sets the gliding tier down where it is', str([x0, r]))
    until("__sim.G.stage === 'stack' && __sim.G.wait <= 0"); tap(195, 500); ok(until("__sim.G.stage === 'colour'"), 'when every tier is down, on to the icing')
    i = E("__sim.G.swatches.indexOf(__sim.G.ord.icing)"); tap(int((i + 0.5) / 4 * 390), 844 - 165); ok(E("__sim.G.colour === __sim.G.ord.icing") and E("__sim.G.stage") == 'ice', 'a tap on the icing that matches the card picks it', str(E("[__sim.G.colour, __sim.G.ord.icing, __sim.G.stage]")))
    # icing: a thumb held off the cake does nothing; on it and sliding up and down, it covers
    pg.wait_for_timeout(400); down(195, 60); pg.wait_for_timeout(1500); c0 = E("__sim.coverage()"); up()
    ok(c0 < 0.01, 'a thumb held off the cake does nothing', str(c0))
    yb, yt = E("(() => { const G = __sim.G, a = __sim.scr(0, 1.32, G.tiers[0].r), b = __sim.scr(0, 1.32 + G.tiers.length * 0.62, G.tiers[0].r); return [a.y, b.y]; })()")
    down(195, yb - 5)
    for k2 in range(70):
        f = (k2 % 14) / 13; f = f if (k2 // 14) % 2 == 0 else 1 - f; mv(195, yb - 5 - f * (yb - yt - 4)); pg.wait_for_timeout(110)
    c1 = E("__sim.coverage()"); ok(c1 > 0.6, 'holding the thumb on the cake and sliding up and down ices it', str(c1)); up()
    # toppings: let the robot finish the cake up to the toppings, then tap on a spot
    E("(() => { const mem = {}; window.__bot = true; (function loop() { const G = __sim.G; if (window.__bot && G && !G.over && G.stage !== 'top') __sim.honest(G, { react: .2, acc: .97 }, mem); requestAnimationFrame(loop); })(); })()")
    ok(until("__sim.G.stage === 'top' && __sim.G.wait <= 0", 60000), 'the robot ices and pipes; on to the toppings')
    E("window.__bot = false"); pg.wait_for_timeout(300)
    sx, sy, want = E("(() => { const G = __sim.G, V = __sim.V3, T = V.T, top = G.tiers[G.tiers.length - 1], sp = __sim.topSpots(G.st.n)[0], w = V.cake.localToWorld(new T.Vector3(top.off + sp[0], G.tiers.length * 0.62, sp[1])), s = __sim.scr(w.x, w.y, w.z); return [s.x, s.y, sp]; })()")
    tap(sx, sy); got = E("__sim.G.tops[0] ? [__sim.G.tops[0].x, __sim.G.tops[0].z] : null")
    ok(got is not None and abs(got[0] - want[0]) + abs(got[1] - want[1]) < 0.15, 'a tap on a spot puts the topping right there', str([want, got]))
    # ---------- the rules, stepped exactly ----------
    pipe = """(off) => { const S = __sim; S.start(1, { seed: 4 }); const G = S.G; while (G.stage !== 'pipe' && !G.over) { S.honest(G, { react: .1, acc: 1 }, window.__m = window.__m || {}); S.step(1 / 60); } window.__m = null;
      const need = G.st.guides[0] + off; let n = 0; while (n++ < 2000) { const a = ((G.ang % 1) + 1) % 1, d = ((need - a) % 1 + 1) % 1; if (d < 0.004) break; S.step(1 / 240); } S.press({}); return [G.swirls[0].err.toFixed(2), G.ev.filter(e => e.k === 'swirl').map(e => e.q)[0]]; }"""
    ok(E(f"({pipe})(0)")[1] == 'perfect', 'a swirl piped as its dot passes the bag: PERFECT', str(E(f"({pipe})(0)")))
    ok(E(f"({pipe})(0.125)")[1] == 'off', 'half a gap off: OFF', str(E(f"({pipe})(0.125)")))
    make = """(wrong) => { const S = __sim; S.start(7, { seed: 11 }); const G = S.G, mem = {}; let n = 0; while (!G.over && n++ < 60 * 300) { if (G.stage === 'colour' && wrong && G.wait <= 0) { const j = G.swatches.findIndex(q => q !== G.ord.icing); S.press({ u: (j + 0.5) / 4 }); continue; } S.honest(G, { react: .1, acc: 1 }, mem); S.step(1 / 60); } return [G.over, G.res.score, G.res.pass]; }"""
    r = E(f"({make})(false)"); ok(r[0] == 'won' and r[1] >= 94, 'a cake made well (a careful baker) scores 94 or more', str(r))
    r = E(f"({make})(true)"); ok(r[0] == 'lost' and r[1] < r[2], 'the wrong icing colour: not their cake, however good', str(r))
    E("__sim.live(); localStorage.setItem('cks.stars', JSON.stringify({1: 3, 2: 3})); __sim.showAqua()"); pg.wait_for_timeout(200)
    ok(E("document.querySelectorAll('#aqGrid .aq').length") == E("__sim.SKINS.length"), 'Your bakery lists every stand')
    E("document.querySelectorAll('#aqGrid .aq')[1].click()"); ok(E("__sim.mySkin().id") == E("__sim.SKINS[1].id"), 'tapping an open one picks it')
    E("localStorage.setItem('cks.stars', '{}'); __sim.showAqua(); document.querySelectorAll('#aqGrid .aq')[3].click()"); ok(E("__sim.store.get('skin')") == E("__sim.SKINS[1].id"), 'a locked one cannot be picked')
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
