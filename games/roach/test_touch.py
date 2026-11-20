#!/usr/bin/env python3
"""Roach Run with real thumbs: the left thumb is a floating stick (push up and the roach runs into the room); holding SPRINT
runs faster and empties the stamina bar; HIDE shows only near a hiding place and hides you there (tap again to come out);
DROP shows while you carry a big piece and drops it. Then the rules, stepped exactly: touching food takes it, and a big
piece slows you; bringing it home adds it to the stash, and enough wins; a slipper lands where you were heading, and on you
it is a SPLAT, but not under furniture; staying in the spray cloud catches you, hiding does not; people notice you in the
open (faster in the light), not under cover; at dawn the round is lost. The Settings switch Music, Sound effects and
Vibration on their own and remember them. No errors.
Run: python3 games/roach/test_touch.py"""
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
    E("localStorage.setItem('rch.taught', '3'); __sim.go(6)"); until("__sim.G && __sim.G.wait <= 0"); pg.wait_for_timeout(300)
    E("(() => { const G = __sim.G; G.people.length = 0; })()")
    z0 = E("__sim.G.me.z"); touch('touchStart', [(1, (100, 600))])
    for f in (0.3, 0.6, 1.0): touch('touchMove', [(1, (100, 600 - 60 * f))]); pg.wait_for_timeout(30)
    pg.wait_for_timeout(500); z1 = E("__sim.G.me.z"); ok(z1 > z0 + 8, 'push the left stick up: the roach runs into the room', str([z0, z1]))
    rb = E("__sim.btnRects().run"); s0 = E("__sim.G.me.stam"); touch('touchStart', [(1, (100, 540)), (2, (rb['x'] + rb['w'] / 2, rb['y'] + rb['h'] / 2))]); pg.wait_for_timeout(500)
    r = E("[__sim.G.me.running, __sim.G.me.stam]"); ok(r[0] is True and r[1] < s0, 'holding SPRINT (right thumb) runs and uses stamina', str([s0, r]))
    touch('touchEnd', []); pg.wait_for_timeout(100); ok(E("__sim.G.me.run") is False and E("Math.abs(__sim.G.me.sx) + Math.abs(__sim.G.me.sz)") == 0, 'lifting both thumbs stops the roach and the sprint')
    # HIDE: not shown out in the middle; shown at a hiding place; hides; tap again comes out
    E("(() => { const m = __sim.G.me; m.x = 200; m.z = 60; })()"); pg.wait_for_timeout(50)
    far = E("(() => { const G = __sim.G, m = G.me; return G.hides.every(h => Math.hypot(m.x - h.x, m.z - h.z) > h.r + 6); })()")
    if far: ok(E("__sim.btnRects().hide") is None, 'no HIDE button away from a hiding place')
    E("(() => { const G = __sim.G, h = G.hides[0]; G.me.x = h.x + 3; G.me.z = h.z; })()"); hb = E("__sim.btnRects().hide"); ok(hb is not None, 'near a hiding place the HIDE button shows')
    if hb: touch('touchStart', [(3, (hb['x'] + hb['w'] / 2, hb['y'] + hb['h'] / 2))]); touch('touchEnd', []); pg.wait_for_timeout(60); ok(E("!!__sim.G.me.hidden"), 'tapping HIDE hides you there')
    hb = E("__sim.btnRects().hide")
    if hb: touch('touchStart', [(3, (hb['x'] + hb['w'] / 2, hb['y'] + hb['h'] / 2))]); touch('touchEnd', []); pg.wait_for_timeout(60); ok(not E("!!__sim.G.me.hidden"), 'tapping it again brings you out')
    E("(() => { const G = __sim.G; G.me.load.push({ v: 3, big: true }); })()"); db = E("__sim.btnRects().drop"); ok(db is not None, 'carrying a big piece: the DROP button shows')
    if db: n0 = E("__sim.G.food.length"); touch('touchStart', [(3, (db['x'] + db['w'] / 2, db['y'] + db['h'] / 2))]); touch('touchEnd', []); pg.wait_for_timeout(60); ok(E("__sim.G.food.length") == n0 + 1 and not E("__sim.G.me.load.some(q => q.big)"), 'tapping DROP puts it down')
    # ---------- the rules, stepped exactly ----------
    base = "(N, seed) => { const S = __sim; S.start(N, { seed }); const G = S.G; G.people.length = 0; G.slips.length = 0; G.sprays.length = 0; G.puffs.length = 0; return G; }"
    r = E(f"""(() => {{ const G = ({base})(6, 3), S = __sim, m = G.me; G.cfg.cap = 6; m.x = 200; m.z = 60; G.food = [{{ id: 1, x: 202, z: 60, v: 1, big: false, wait: 0 }}, {{ id: 2, x: 200, z: 70, v: 3, big: true, wait: 0 }}]; S.step(1 / 60); const a = m.load.length;
      S.stick(0, 1); for (let i = 0; i < 40; i++) S.step(1 / 60); const b = m.load.length, k1 = Math.hypot(m.vx, m.vz); return [a, b, +k1.toFixed(1), G.cfg.walk]; }})()""")
    ok(r[0] == 1 and r[1] == 2 and r[2] < r[3] * 0.8, 'touching food takes it; a big piece slows you', str(r))
    r = E(f"""(() => {{ const G = ({base})(6, 4), S = __sim, m = G.me; G.cfg.need = 3; m.load = [{{ v: 3, big: true }}]; m.x = S.CX; m.z = 8; m.out = true; S.stick(0, -1); let n = 0; while (!G.over && n++ < 200) S.step(1 / 60); return [G.stash, G.over]; }})()""")
    ok(r == [3, 'won'], 'carried home it goes on the stash; enough wins the round', str(r))
    r = E(f"""(() => {{ const G = ({base})(6, 5), S = __sim, m = G.me; m.x = 200; m.z = 60; m.out = true; S.stick(1, 0); for (let i = 0; i < 30; i++) S.step(1 / 60); G.people.push({{ x: 300, z: 200, notice: 1, cd: 0, walk: false, tx: 300, tz: 200, face: 0, step: 0 }}); S.step(1 / 60); const s = G.slips[0]; return s ? [+(s.x - m.x).toFixed(0), +(s.z - m.z).toFixed(0)] : null; }})()""")
    ok(r is not None and r[0] > 15 and abs(r[1]) < 6, 'a slipper is aimed where you are heading (ahead of you)', str(r))
    slap = """(cover) => { const S = __sim; S.start(6, { seed: 6 }); const G = S.G; G.people.length = 0; const m = G.me; let x = 200, z = 60; if (cover) { const c = G.covers[0]; x = (c.x0 + c.x1) / 2; z = (c.z0 + c.z1) / 2; } m.x = x; m.z = z; m.out = true; G.slips.push({ x, z, r: 8, t: 0, T: 0.3, land: false }); let n = 0; while (!G.over && n++ < 40) S.step(1 / 60); return [G.over, G.res && G.res.why]; }"""
    ok(E(f"({slap})(false)") == ['lost', 'slipper'], 'standing still under a slipper: SPLAT'); ok(E(f"({slap})(true)") == [None, None], 'under furniture the slipper cannot reach you', str(E(f"({slap})(true)")))
    cloud = """(hide) => { const S = __sim; S.start(6, { seed: 7 }); const G = S.G; G.people.length = 0; const m = G.me; const h = G.hides[0]; m.x = h.x; m.z = h.z; m.out = true; if (hide) S.hide(); G.puffs.push({ x: m.x, z: m.z, r: 14, R: 14, t: 0, life: 6, a: 1 }); let n = 0; while (!G.over && n++ < 180) S.step(1 / 60); return [G.over, G.res && G.res.why]; }"""
    ok(E(f"({cloud})(false)") == ['lost', 'spray'], 'staying in the spray cloud catches you'); ok(E(f"({cloud})(true)") == [None, None], 'hidden, the spray cannot get you', str(E(f"({cloud})(true)")))
    r = E("""(() => { const out = []; for (const where of ['open', 'light', 'cover']) { const S = __sim; S.start(8, { seed: 8 }); const G = S.G, m = G.me; G.people = [{ x: 300, z: 220, notice: 0, cd: 99, walk: false, tx: 300, tz: 220, face: 0, step: 0 }];
        let x = 150, z = 120; if (where === 'light') { G.lights = [{ x, z, r: 40 }]; } else G.lights = []; if (where === 'cover') { const c = G.covers[0]; x = (c.x0 + c.x1) / 2; z = (c.z0 + c.z1) / 2; } m.x = x; m.z = z; m.out = true; m.vx = 20; for (let i = 0; i < 60; i++) { m.vx = 20; S.step(1 / 60); m.x = x; m.z = z; } out.push(+G.people[0].notice.toFixed(3)); } return out; })()""")
    ok(r[1] > r[0] > 0 and r[2] == 0, 'they notice you in the open, faster in the light, not under cover', str(r))
    r = E("(() => { const S = __sim; S.start(6, { seed: 9 }); const G = S.G; G.people.length = 0; G.clock = 0.05; for (let i = 0; i < 10; i++) S.step(1 / 60); return [G.over, G.res && G.res.why]; })()")
    ok(r == ['lost', 'dawn'], 'at dawn the round is lost', str(r))
    # ---------- Settings ----------
    E("__sim.live(); localStorage.setItem('rch.settings', '{}'); location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(600)
    sw = "['tMus', 'tSfx', 'tVib'].map(i => document.getElementById(i).textContent === 'ON')"
    ok(E("!!document.getElementById('setBtn').offsetParent"), 'the Settings button is on the home screen')
    E("document.getElementById('setBtn').click()"); ok(E("!document.getElementById('ovSet').classList.contains('hidden')"), 'it opens the Settings card')
    E("document.getElementById('tMus').click()"); ok(E(sw) == [False, True, True], 'Music switches off on its own', str(E(sw)))
    E("document.getElementById('tVib').click()"); ok(E(sw) == [False, True, False], 'Vibration switches off on its own', str(E(sw)))
    E("document.getElementById('tSfx').click()"); ok(E(sw) == [False, False, False], 'Sound effects switch off on their own', str(E(sw)))
    E("location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(500)
    ok(E(sw) == [False, False, False], 'the settings are remembered'); E("localStorage.setItem('rch.settings', '{}')")
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
