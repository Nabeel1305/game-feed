#!/usr/bin/env python3
"""Spy with real thumbs: the left thumb is a floating stick (pushed up the spy walks up the screen; pushed far she runs);
CROUCH lights and makes her crouch (and a second tap stands her up); the ACTION button does what it says: OPEN DOOR, HIDE and
COME OUT, PHOTOGRAPH; the camera button changes the view's height. Then the rules, stepped exactly: running makes a noise
that a guard hears and comes to; a guard who sees you grows suspicious, then runs at you and catches you; crouching behind a
desk hides you from him; hidden in a cupboard he cannot see you; the photograph needs the file held in the frame; back at the
van with it wins. The Settings switch Music, Sound effects and Vibration on their own and remember them. No errors.
Run: python3 games/spy/test_touch.py"""
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
    def touch(kind, pts): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, (x, y) in pts]})
    def tap(x, y, i=5): touch('touchStart', [(i, (x, y))]); touch('touchEnd', [(i, (x, y))]); pg.wait_for_timeout(60)
    def until(js, ms=15000):
        try: pg.wait_for_function(js, timeout=ms); return True
        except Exception: return False
    E("localStorage.setItem('spy.taught', '3'); __sim.go(6)"); until("__sim.G && __sim.G.wait <= 0"); pg.wait_for_timeout(300)
    E("(() => { const G = __sim.G; G.guards.length = 0; G.cams.length = 0; G.bonus.forEach(b => b.got = true); if (G.key) G.key.got = true; G.me.coins = 0; window.__doc = [G.doc.x, G.doc.z]; G.doc.x = G.doc.z = -50; G.doc.cands = [{ x: -50, z: -50 }]; })()")
    z0 = E("__sim.G.me.z"); touch('touchStart', [(1, (100, 600))])
    for f in (0.3, 0.6, 0.8): touch('touchMove', [(1, (100, 600 - 50 * f))]); pg.wait_for_timeout(30)
    pg.wait_for_timeout(500); r = E("[__sim.G.me.z, __sim.G.me.run]"); ok(r[0] < z0 - 0.3 and not r[1], 'the stick pushed up walks the spy up the screen', str([z0, r]))
    touch('touchMove', [(1, (100, 540))]); pg.wait_for_timeout(200); ok(E("__sim.G.me.run") is True, 'pushed far, she runs')
    touch('touchEnd', [(1, (100, 540))]); pg.wait_for_timeout(80); ok(E("Math.abs(__sim.G.me.sx) + Math.abs(__sim.G.me.sz)") == 0, 'lifting the thumb stops her')
    def center(n): q = E(f"__sim.btnRects().{n}"); return (q['x'] + q['w'] / 2, q['y'] + q['h'] / 2)
    tap(*center('crouch')); ok(E("__sim.G.me.crouch") is True, 'CROUCH makes her crouch'); tap(*center('crouch')); ok(E("__sim.G.me.crouch") is False, 'and a second tap stands her up')
    z = E("__sim.ui.zoom"); tap(*center('zoom')); ok(E("__sim.ui.zoom") == (z + 1) % 3, 'the camera button changes the view')
    # a door: stand by a closed one, facing it
    r = E("""(() => { const G = __sim.G, m = G.me; for (let z = 1; z < G.H - 3; z++) for (let x = 1; x < G.W - 1; x++) if (G.grid[z][x] === 2 || G.grid[z][x] === 3) { G.grid[z][x] = 2; const sides = [[0, 1], [0, -1], [1, 0], [-1, 0]]; for (const [a, b2] of sides) { const px = x + a + 0.5, pz = z + b2 + 0.5; if (G.grid[pz | 0] && G.grid[pz | 0][px | 0] === 0 && !G.furn.some(f => f.x === (px | 0) && f.z === (pz | 0))) { m.x = px; m.z = pz; m.face = Math.atan2(-a, -b2); return [x, z, __sim.actionHere() && __sim.actionHere().label]; } } } return null; })()""")
    ok(r and r[2] == 'OPEN DOOR', 'by a closed door the ACTION button says OPEN DOOR', str(r))
    if r: tap(*center('act')); ok(E(f"__sim.G.grid[{r[1]}][{r[0]}]") == 3, 'and a tap opens it')
    r = E("""(() => { const G = __sim.G, m = G.me, c = G.furn.find(f => f.kind === 'closet'); G.bonus.length = 0; if (G.key) G.key.got = true; m.coins = 0; if (!c) return null; for (const [a, b2] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) { const px = c.x + a + 0.5, pz = c.z + b2 + 0.5; if (G.grid[pz | 0][px | 0] === 0 && !G.furn.some(f => f.x === (px | 0) && f.z === (pz | 0))) { m.x = px; m.z = pz; m.face = Math.atan2(-a, -b2); const A = __sim.actionHere(); return A && A.label; } } return null; })()""")
    if r: ok(r == 'HIDE', 'by a cupboard: HIDE', str(r)); tap(*center('act')); ok(E("!!__sim.G.me.hidden") and E("__sim.actionHere().label") == 'COME OUT', 'a tap hides her; the button now says COME OUT'); tap(*center('act')); ok(E("!__sim.G.me.hidden"), 'and a tap brings her out')
    r = E("(() => { const G = __sim.G, m = G.me; m.hidden = null; G.doc.x = window.__doc[0]; G.doc.z = window.__doc[1]; G.doc.found = true; m.x = G.doc.x; m.z = G.doc.z + 1.1; return __sim.actionHere().label; })()"); ok(r == 'PHOTOGRAPH', 'by the file: PHOTOGRAPH', str(r))
    tap(*center('act')); ok(E("__sim.G.me.cam") is True, 'a tap raises the camera')
    # ---------- the rules ----------
    base = "(N) => { const S = __sim; S.start(N, { seed: 11 }); const G = S.G; G.cams.length = 0; G.guards.length = 1; const g = G.guards[0]; g.pts = [{ x: g.x, z: g.z }]; g.pi = 0; return G; }"
    place = """(G, gx, gz, face, mx, mz) => { const room = G.rooms.find(q => q.corr) || G.rooms[0]; const g = G.guards[0]; g.x = room.x0 + gx; g.z = (room.z0 + room.z1) / 2 + 0.5; g.face = face; g.pts = [{ x: g.x, z: g.z }]; g.wait = 99; G.me.x = room.x0 + mx; G.me.z = g.z + mz; G.me.hidden = null; return g; }"""
    r = E(f"""(() => {{ const G = ({base})(6), S = __sim, g = ({place})(G, 1.5, 0, Math.PI / 2, 5.0, 0); g.face = -Math.PI / 2; G.furn = G.furn.filter(f => f.kind !== 'plant'); S.stick(1, 0); for (let i = 0; i < 30; i++) S.step(1 / 60); S.stick(0, 0); for (let i = 0; i < 6; i++) S.step(1 / 60); return [G.noises.length > 0, g.st]; }})()""")
    ok(r[0] and r[1] == 'investigate', 'running makes a noise; a guard hears it and comes to look', str(r))
    r = E(f"""(() => {{ const G = ({base})(6), S = __sim, g = ({place})(G, 1.5, 0, Math.PI / 2, 4.5, 0); let first = null, n = 0; while (!G.over && n++ < 60 * 10) {{ S.step(1 / 60); if (!first && g.st === 'look') first = 'look'; }} return [first, G.over, G.res && G.res.why]; }})()""")
    ok(r == ['look', 'lost', 'caught'], 'a guard who sees you looks first, then runs at you and catches you', str(r))
    r = E(f"""(() => {{ const G = ({base})(6), S = __sim, room = G.rooms.find(q => q.corr) || G.rooms[0], g = ({place})(G, 1.5, 0, Math.PI / 2, 5.5, 0); G.furn.push({{ kind: 'desk', x: Math.floor(G.me.x) - 1, z: Math.floor(G.me.z) }}); const out = []; for (const cr of [false, true]) {{ G.me.crouch = cr; g.sus = 0; g.st = 'patrol'; for (let i = 0; i < 60; i++) S.step(1 / 60); out.push(+g.sus.toFixed(2)); }} return out; }})()""")
    ok(r[0] > 0.2 and r[1] == 0, 'standing, he sees you over a desk; crouching behind it, he does not', str(r))
    r = E(f"""(() => {{ const G = ({base})(6), S = __sim, g = ({place})(G, 1.5, 0, Math.PI / 2, 4.5, 0); G.me.hidden = {{ x: 0, z: 0 }}; for (let i = 0; i < 120; i++) S.step(1 / 60); return [+g.sus.toFixed(2), G.over]; }})()""")
    ok(r == [0, None], 'hidden in a cupboard he cannot see you', str(r))
    r = E(f"""(() => {{ const G = ({base})(6), S = __sim; G.guards.length = 0; G.doc.found = true; const m = G.me; m.x = G.doc.x; m.z = G.doc.z + 1.1; S.action(); const P = m.photo; let k2 = 0; for (let i = 0; i < 60 * 3; i++) {{ S.stick(-P.fx * 4, P.fz * 4); S.step(1 / 60); if (!m.photo) break; }} const ok1 = G.doc.shot; m.x = G.van.x; m.z = G.van.z; S.stick(0, 0); S.step(1 / 60); return [ok1, G.over]; }})()""")
    ok(r == [True, 'won'], 'the file held in the frame makes a clear photo; back at the van, the mission is won', str(r))
    r = E(f"""(() => {{ const G = ({base})(6), S = __sim; G.guards.length = 0; G.doc.found = true; const m = G.me; m.x = G.doc.x; m.z = G.doc.z + 1.1; S.action(); m.photo.fx = 0.5; for (let i = 0; i < 60 * 2; i++) {{ S.stick(1, 0); S.step(1 / 60); }} return [G.doc.shot, +m.photo.q.toFixed(2)]; }})()""")
    ok(r[0] is False and r[1] == 0, 'with the file out of the frame there is no photo', str(r))
    # ---------- Settings ----------
    E("__sim.live(); localStorage.setItem('spy.settings', '{}'); location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(600)
    sw = "['tMus', 'tSfx', 'tVib'].map(i => document.getElementById(i).textContent === 'ON')"
    ok(E("!!document.getElementById('setBtn').offsetParent"), 'the Settings button is on the home screen')
    E("document.getElementById('setBtn').click()"); ok(E("!document.getElementById('ovSet').classList.contains('hidden')"), 'it opens the Settings card')
    E("document.getElementById('tMus').click()"); ok(E(sw) == [False, True, True], 'Music switches off on its own', str(E(sw)))
    E("document.getElementById('tVib').click()"); ok(E(sw) == [False, True, False], 'Vibration switches off on its own', str(E(sw)))
    E("document.getElementById('tSfx').click()"); ok(E(sw) == [False, False, False], 'Sound effects switch off on their own', str(E(sw)))
    E("location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(500)
    ok(E(sw) == [False, False, False], 'the settings are remembered'); E("localStorage.setItem('spy.settings', '{}')")
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
