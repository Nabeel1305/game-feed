#!/usr/bin/env python3
"""Deep Bite with real touches: a thumb put down anywhere and dragged steers the shark that way on screen (up the screen is
up, right is right); a short drag swims, a long one dashes (the blue bar goes down); letting go eases off; a drag that starts
on the top bar still steers. No JavaScript errors.
Run: python3 games/shark/test_touch.py"""
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
    pg.add_init_script('window.__softGL = true'); pg.goto('file://' + os.path.join(here, 'index.html')); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(800)
    pg.evaluate("localStorage.setItem('db.taught', '3'); __sim.go(1); __sim.ui.snap = true;"); pg.wait_for_timeout(400)
    cdp = ctx.new_cdp_session(pg)
    def touch(kind, x, y): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [] if kind == 'touchEnd' else [{'x': x, 'y': y, 'id': 1}]})
    def drag(x0, y0, x1, y1, hold=600):
        touch('touchStart', x0, y0); pg.wait_for_timeout(30)
        for i in range(1, 7): touch('touchMove', x0 + (x1 - x0) * i / 6, y0 + (y1 - y0) * i / 6); pg.wait_for_timeout(16)
        pg.wait_for_timeout(hold)
    def heading(): return pg.evaluate("(() => { const m = __sim.G.me, a = __sim.scr(m.x, 0, m.z), b = __sim.scr(m.x + Math.cos(m.face), 0, m.z + Math.sin(m.face)); return [b.x - a.x, b.y - a.y]; })()")
    drag(200, 600, 200, 560); h = heading(); st = pg.evaluate("[__sim.G.stick.x, __sim.G.stick.z, __sim.G.me.dashing]")
    ok(h[1] < 0 and abs(h[0]) < abs(h[1]), 'a short drag up the screen: the shark swims up the screen', str(h)); ok(not st[2], 'a short drag does not dash', str(st))
    touch('touchEnd', 0, 0); pg.wait_for_timeout(100); ok(pg.evaluate("Math.hypot(__sim.G.stick.x, __sim.G.stick.z)") == 0, 'letting go lets the stick go')
    d0 = pg.evaluate("__sim.G.me.dash"); drag(100, 500, 220, 500, 900); h = heading(); st = pg.evaluate("[__sim.G.me.dashing, __sim.G.me.dash]")
    ok(h[0] > 0 and abs(h[1]) < h[0], 'a drag to the right: it swims to the right of the screen', str(h)); ok(st[0] and st[1] < d0, 'a long drag dashes, and the blue bar goes down', str(st))
    touch('touchEnd', 0, 0); pg.wait_for_timeout(60)
    drag(200, 70, 200, 200, 500); h = heading(); ok(h[1] > 0, 'a drag that starts on the top bar still steers (down the screen)', str(h)); touch('touchEnd', 0, 0)
    # 25 Nov 2026, the bigger sea: five places; a fished-out place empties; THE BIG ONE waits at another place and is won by swimming to it
    r = pg.evaluate("""(() => { const S = __sim; S.start(8, { seed: 5, taught: 9 }); const G = S.G, m = G.me, out = { places: G.spots.length, chests: G.spots.filter(q => q.chest).length };
      S.stick(0, 0); const st0 = G.spots[0].stock; let n = 0; while (!(G.spots[0].out > 0) && n++ < 6000) { m.hunger = 1; const f = G.fish.find(q => S.edible(G, q) && !q.prize); if (f) { f.x = m.x; f.z = m.z; } m.tier = 0; m.fill = 0; S.step(1 / 60); } out.fishedOut = G.spots[0].out > 0; out.stock0 = st0; out.leaving = G.fish.filter(f => f.leave != null).length;
      n = 0; while (!G.ready && n++ < 3000) { m.hunger = 1; m.fill = Math.max(m.fill, S.needOf(G) - 0.5); const f = G.fish.find(q => S.edible(G, q) && !q.prize && q.leave == null); if (f) { f.x = m.x; f.z = m.z; } S.step(1 / 60); }
      const pz = G.fish.find(f => f.prize); out.ready = !!G.ready; out.far = pz ? Math.hypot(pz.x - m.x, pz.z - m.z) : -1; out.home = pz && pz.home ? pz.home.k : null; out.met0 = pz ? pz.met : null;
      for (let i = 0; i < 120; i++) { S.stick(0, 0); m.hunger = 1; S.step(1 / 60); } out.stays = pz ? Math.hypot(pz.x - pz.home.x, pz.z - pz.home.z) : -1;
      n = 0; let met = null; while (!G.over && n++ < 60 * 60) { const dx = pz.x - m.x, dz = pz.z - m.z, d = Math.hypot(dx, dz) || 1; S.stick(dx / d * 0.9, dz / d * 0.9); m.hunger = Math.max(m.hunger, 0.6); for (const j of G.fish) if (j.sp.kind === 'jelly' || j.sp.kind === 'hunter') { j.x = 500; j.z = 500; } if (pz.met && met == null) met = G.t; if (pz.met) { const q = S.sizeOf(G) * 0.5; pz.x = m.x + Math.cos(m.face) * q; pz.z = m.z + Math.sin(m.face) * q; } S.step(1 / 60); }
      out.met = met != null; out.over = G.over; return out; })()""")
    ok(r['places'] == 5 and r['chests'] == 3, 'the sea has five places, three with a chest', str(r)); ok(r['fishedOut'] and r['leaving'] > 0, 'a place eaten out is fished out, and its fish make off', str(r))
    ok(r['ready'] and r['far'] >= 25 and r['home'] and r['home'] != 'jelly' and r['met0'] is False, 'big enough: THE BIG ONE waits at another place, a fair swim away (never the jelly garden)', str(r))
    ok(r['stays'] < 9, 'it stays at its place until he comes', str(r)); ok(r['met'] and r['over'] == 'won', 'he swims to it, meets it, eats it: the level is won', str(r))
    pg.wait_for_timeout(200); pg.screenshot(path='/tmp/db_touch.png'); ok(not errs, 'no JavaScript errors', str(errs[:3]))
    b.close()
print(f'\n{oks} checks passed, {len(fails)} failed.')
sys.exit(1 if fails else 0)
