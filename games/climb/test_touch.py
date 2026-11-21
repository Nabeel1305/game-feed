#!/usr/bin/env python3
"""Rock Climb with real touches (a phone held upright): pressing on a hand and dragging it lights up the holds it can reach;
letting go near one grabs it; letting go on bare rock is a miss (it tires you, more each time) and the hand goes back; a short
tap on a hand does nothing; dragging the bare rock looks around, and the view comes back by itself; 👁 runs up the route and
a tap stops it (the clock waits meanwhile). A far orange hold: drag onto it and hold to load up a jump; let go in the green and
you catch it; let go too soon and you fall onto the rope. Then the rules: small holds and no feet drain the grip, two hands on a
ledge with good feet fill it; an empty grip is a warning first, then a fall; the rope catches you at your last bolt; three falls
end the climb; a hand on the top ledge wins; a sloper above your shoulders cannot be held; a side-pull only from the side it
faces. The Settings switch Music, Sound effects and Vibration on their own and remember them. No errors.
Run: python3 games/climb/test_touch.py"""
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
    def until(js, ms=20000):
        try: pg.wait_for_function(js, timeout=ms); return True
        except Exception: return False
    def hand(l): return E(f"(() => {{ const q = __sim.ui.lp['{l}'], p = scrOf(__sim.G, q.x, q.y); return [p.x, p.y]; }})()")
    def hold(i): return E(f"(() => {{ const h = __sim.G.route.holds[{i}], p = scrOf(__sim.G, h.x, h.y); return [p.x, p.y]; }})()")
    def drag(a, b2, up=True, wait=0):
        touch('touchStart', [(1, a)]); pg.wait_for_timeout(60)
        for s in range(1, 9): touch('touchMove', [(1, (a[0] + (b2[0] - a[0]) * s / 8, a[1] + (b2[1] - a[1]) * s / 8))]); pg.wait_for_timeout(25)
        if wait: pg.wait_for_timeout(wait)
        if up: touch('touchEnd', [(1, b2)]); pg.wait_for_timeout(120)
    def fresh(N):
        E(f"localStorage.setItem('rcl.taught', '3'); localStorage.setItem('rcl.feet', '\"auto\"'); __sim.go({N})"); pg.wait_for_timeout(900)
        E("__sim.ui.banner = null")
    # ---------- reach and grab ----------
    fresh(2)
    t = E("(() => { const G = __sim.G, ts = targets(G, 'rh').filter(t => !t.dyno).map(t => G.route.holds[t.i]).sort((a, b) => b.y - a.y); return ts[0].i; })()")
    a = hand('rh'); h = hold(t)
    drag(a, h, up=False); ok(E("__sim.ui.drag && __sim.ui.drag.ts.length") > 0, 'pressing on a hand and dragging it lights up the holds it can reach', E("__sim.ui.drag && __sim.ui.drag.ts.length"))
    touch('touchEnd', [(1, h)]); pg.wait_for_timeout(150); ok(E("__sim.G.S.rh") == t, 'letting go near a lit hold grabs it', str([E("__sim.G.S.rh"), t]))
    s0 = E("__sim.G.S.lh"); st0 = E("__sim.G.st"); a = hand('lh')
    drag(a, (a[0] - 150, a[1] + 40)); ok(E("__sim.G.S.lh") == s0 and E("__sim.G.misses") == 1, 'letting go on bare rock is a miss, and the hand goes back', str([E("__sim.G.S.lh"), s0, E("__sim.G.misses")]))
    ok(E("__sim.G.st") < st0 - 0.02, 'a miss tires you')
    st1 = E("__sim.G.st"); a = hand('lh'); drag(a, (a[0] - 150, a[1] + 40)); ok(st0 - st1 < st1 - E("__sim.G.st"), 'a second miss tires you more', str([st0, st1, E("__sim.G.st")]))
    a = hand('lh'); n0 = E("__sim.G.moves"); touch('touchStart', [(1, a)]); touch('touchEnd', [(1, a)]); pg.wait_for_timeout(100); ok(E("__sim.G.moves") == n0 and E("__sim.G.S.lh") == s0, 'a short tap on a hand does nothing')
    # ---------- looking about, the route ----------
    drag((60, 700), (200, 520), up=False); ok(E("!!__sim.ui.look && Math.abs(__sim.ui.look.y) > 0.5"), 'dragging the bare rock looks around', str(E("__sim.ui.look"))); touch('touchEnd', [(1, (200, 520))])
    ok(until("!__sim.ui.look", 8000), 'and the view comes back by itself')
    L = E("__sim.layout().eye"); t0 = E("__sim.G.t"); touch('touchStart', [(2, (L['x'], L['y']))]); touch('touchEnd', [(2, (L['x'], L['y']))]); pg.wait_for_timeout(600)
    ok(E("!!__sim.G.look"), '👁 runs up the route'); ok(abs(E("__sim.G.t") - t0) < 0.05, 'the clock waits while you look')
    touch('touchStart', [(2, (200, 400))]); touch('touchEnd', [(2, (200, 400))]); pg.wait_for_timeout(150); ok(not E("!!__sim.G.look"), 'a tap stops it')
    # ---------- the jump ----------
    SETD = """(() => { const G = __sim.G, hs = G.route.holds; for (const d of hs.filter(h => h.dyno)) { const a = hs.filter(h => h.line === 1 && HT[h.ty].hand != null && h.y < d.y).sort((p, q) => q.y - p.y)[0];
        const T = chooseFeet(G, Object.assign({}, G.S, { lh: a.i, rh: a.i })); if (!T) continue; G.S = T; G.body = solve(G, T); if (targets(G, 'rh').some(t => t.dyno && t.i === d.i)) { G.st = 1; G.phase = 'climb'; G.falls = 0; G.dyno = null; __sim.ui.lp = null; __sim.ui.snap = true; return d.i; } } return null; })()"""
    E("localStorage.setItem('rcl.taught', '3'); __sim.start(14, { seed: 101, feet: 'auto' }); __sim.live(); __sim.ui.banner = null; hint = null"); pg.wait_for_timeout(300); di = E(SETD)
    if di is None: ok(False, 'a jump set up (level 14 has a far hold within jumping reach)')
    else:
        pg.wait_for_timeout(500); a = hand('rh'); h = hold(di); drag(a, h, up=False); pg.wait_for_timeout(200)
        ok(E("!!__sim.G.dyno"), 'dragging onto a far orange hold and holding loads up a jump')
        E("__sim.G.dyno.t = 0; __sim.G.dyno.g0 = 0.5; __sim.G.dyno.gw = 0.4"); ok(until("__sim.G.dyno && dynoP(__sim.G) > 0.68", 4000), '(the bar fills)')
        touch('touchEnd', [(1, h)]); pg.wait_for_timeout(150); ok(E("__sim.G.S.rh") == di and E("__sim.G.dynos") == 1, 'letting go in the green catches it', str([E("__sim.G.S.rh"), di]))
        E(SETD); pg.wait_for_timeout(400); a = hand('rh'); h = hold(di); drag(a, h, up=False); pg.wait_for_timeout(100); E("__sim.G.dyno && (__sim.G.dyno.g0 = 0.8)")
        touch('touchEnd', [(1, h)]); pg.wait_for_timeout(150); ok(E("__sim.G.phase") == 'fall' and E("__sim.G.falls") == 1, 'letting go too soon: a fall onto the rope', str([E("__sim.G.phase"), E("__sim.G.falls")]))
    # ---------- the rules ----------
    E("__sim.start(4, { seed: 11 })")
    E("(() => { const G = __sim.G, hs = G.route.holds, e = hs.filter(h => h.ty === 'edge' && h.y > 3); G.S.lh = e[0].i; G.S.rh = e[0].i; G.S.lf = -1; G.S.rf = -1; G.body = solve(G, G.S); G.st = 1; })()")
    E("(() => { for (let i = 0; i < 60; i++) __sim.step(1 / 60); })()"); ok(E("__sim.G.st") < 0.97, 'hanging from small holds with no feet drains the grip', E("__sim.G.st"))
    E("(() => { const G = __sim.G, hs = G.route.holds, ld = hs.find(h => h.ty === 'ledge'), gr = hs.filter(h => h.ty === 'jug' || h.ty === 'chip').filter(h => h.y < ld.y - 0.8 && h.y > ld.y - 1.9 && Math.abs(h.x - ld.x) < 0.7); G.S = chooseFeet(G, { lh: ld.i, rh: ld.i, lf: -1, rf: -1 }); G.body = solve(G, G.S); G.st = 0.3; })()")
    fs = E("footSup(__sim.G, __sim.G.S)") if E("typeof footSup") == 'function' else None
    E("(() => { for (let i = 0; i < 120; i++) __sim.step(1 / 60); })()"); ok(E("__sim.G.st") > 0.4, 'two hands on a ledge with good feet fill the grip', str([E("__sim.G.st"), E("__sim.G.body.strain")]))
    E("(() => { const G = __sim.G, hs = G.route.holds, e = hs.filter(h => h.ty === 'edge' && h.y > 3); G.S = { lh: e[0].i, rh: e[0].i, lf: -1, rf: -1 }; G.body = solve(G, G.S); G.st = 0.01; })()")
    E("(() => { for (let i = 0; i < 10; i++) __sim.step(1 / 60); })()"); ok(E("__sim.G.phase") == 'slip', 'an empty grip is a warning first (slipping)')
    E("(() => { for (let i = 0; i < 100; i++) __sim.step(1 / 60); })()"); ok(E("__sim.G.phase") == 'fall' and E("__sim.G.falls") == 1, 'then a fall')
    E("(() => { for (let i = 0; i < 130; i++) __sim.step(1 / 60); })()"); ok(E("__sim.G.phase") == 'climb' and E("__sim.G.S.lh == __sim.G.cp.lh") and E("__sim.G.st") > 0.95, 'the rope catches you at your last bolt, with your grip back')
    E("(() => { const G = __sim.G, e = G.route.holds.filter(h => h.ty === 'edge' && h.y > 3); G.S = { lh: e[0].i, rh: e[0].i, lf: -1, rf: -1 }; G.body = solve(G, G.S); G.falls = 2; G.phase = 'climb'; G.st = 0; for (let i = 0; i < 60 * 4; i++) __sim.step(1 / 60); })()"); ok(E("__sim.G.over") == 'lost', 'three falls end the climb', E("__sim.G.over"))
    E("__sim.start(3, { seed: 12 })")
    r = E("""(() => { const G = __sim.G, hs = G.route.holds, top = hs.filter(h => h.ty === 'top'); for (const t of top) for (const a of hs) { if (HT[a.ty].hand == null || a.y < G.route.H - 1.0 || a.y >= G.route.H || Math.abs(a.x - t.x) > 0.8) continue;
        G.S = Object.assign({}, G.S, { lh: a.i, rh: a.i }); const T = tryStance(G, 'rh', a.i); if (!T) continue; G.S = T; G.body = solve(G, T); const ok2 = grab(G, 'rh', t.i); if (ok2) { for (let i = 0; i < 120; i++) __sim.step(1 / 60); return G.over; } } return 'none'; })()""")
    ok(r == 'won', 'a hand on the top ledge wins', r)
    E("__sim.start(4, { seed: 13 })")
    r = E("""(() => { const G = __sim.G, hs = G.route.holds; const sl = { i: hs.length, x: G.body.x + 0.2, y: G.body.y + SHY + 0.75, ty: 'sloper', line: 2 }; hs.push(sl); const sd = { i: hs.length, x: G.body.x + 0.85, y: G.body.y + SHY + 0.1, ty: 'side', line: 2, d: 1 }; hs.push(sd);
        const sd2 = { i: hs.length, x: G.body.x + 0.85, y: G.body.y + SHY + 0.1, ty: 'side', line: 2, d: -1 }; hs.push(sd2); return [!!tryStance(G, 'rh', sl.i), !!tryStance(G, 'rh', sd.i), !!tryStance(G, 'rh', sd2.i)]; })()""")
    ok(r[0] is False, 'a sloper above your shoulders cannot be held', str(r))
    ok(r[1] is False and r[2] is True, 'a side-pull only from the side it faces', str(r))
    # ---------- settings ----------
    E("__sim.live(); localStorage.setItem('rcl.settings', '{}'); location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(600)
    sw = "['tMus', 'tSfx', 'tVib'].map(i => document.getElementById(i).textContent === 'ON')"
    E("document.getElementById('setBtn').click()"); ok(E("!document.getElementById('ovSet').classList.contains('hidden')"), 'the Settings button opens the Settings card')
    E("document.getElementById('tMus').click()"); ok(E(sw) == [False, True, True], 'Music switches off on its own', str(E(sw)))
    E("document.getElementById('tVib').click()"); ok(E(sw) == [False, True, False], 'Vibration switches off on its own', str(E(sw)))
    E("document.getElementById('tSfx').click()"); ok(E(sw) == [False, False, False], 'Sound effects switch off on their own', str(E(sw)))
    E("location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(500)
    ok(E(sw) == [False, False, False], 'the settings are remembered'); E("localStorage.setItem('rcl.settings', '{}')")
    ok(not errs, 'no JavaScript errors', str(errs[:3])); ctx.close(); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
