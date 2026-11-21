#!/usr/bin/env python3
"""Bin Round with real touches: a tap on a bin's sign sends you to fetch it, a tap on empty road does nothing; HOLD COLLECT
lifts it and letting go in the green empties it and it goes back neatly; letting go too soon brings it down full; holding on
too long bangs it and spills a few bits (more to pick up) and it comes down to try again; a press made before the bin is at
the lorry does not lift it; PICK OUT takes the bag off the recycling; a finished house shows NEXT HOUSE, and the lorry moves
on (Sam sweeps up anything left); AUTO is remembered; Stop here ends the shift and the round carries on from the next house.
Nothing can be lost: ten minutes of doing nothing ends nothing. Pause stops the clock. The Settings switch Music, Sound effects
and Vibration on their own and remember them. No errors.
Run: python3 games/binround/test_touch.py"""
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
    def tap(x, y): touch('touchStart', [(5, (x, y))]); touch('touchEnd', [(5, (x, y))]); pg.wait_for_timeout(120)
    def mid(r): return (r['x'] + r['w'] / 2, r['y'] + r['h'] / 2)
    def until(js, ms=20000):
        try: pg.wait_for_function(js, timeout=ms); return True
        except Exception: return False
    def arrive(N, kinds):      # start level N and fast-forward to the first house, then put these items at its gate
        E(f"localStorage.setItem('bin.taught', '3'); localStorage.removeItem('bin.resume'); __sim.go({N})")
        E("(() => { const G = __sim.G; let n = 0; while (G.lorry.state !== 'stopped' && n++ < 6000) __sim.step(1 / 60); while (G.wk.st === 'hop' && n++ < 9000) __sim.step(1 / 60); })()")
        E("""(kinds) => { const G = __sim.G, S = G.stops[G.si]; G.items = kinds.map((kind, j) => ({ id: ++G.iid, kind, hx: S.side * 5.2, hz: S.z - 2.2 + (j - (kinds.length - 1) / 2) * 1.6, x: S.side * 5.2, z: S.z - 2.2 + (j - (kinds.length - 1) / 2) * 1.6, st: 'wait', p: 0, wrong: false, note: false, tidy: true, rot: 0 })); __sim.ui.snap = true; }""", kinds)
        pg.wait_for_timeout(500)
    def sign(i): return E(f"(() => {{ const q = __sim.G.items[{i}], p = itemScreen(q); return [p.x, p.y - 26 * k]; }})()")
    def hold_until(js, ms=8000):
        C = E("__sim.layout().collect"); touch('touchStart', [(2, (C['x'], C['y']))]); r = until(js, ms); return C, r
    def let_go(C): touch('touchEnd', [(2, (C['x'], C['y']))]); pg.wait_for_timeout(120)
    top = "(() => { const G = __sim.G, it = carried(G); if (!it) return 1e9; const K = __sim.x().KINDS[it.kind]; return 1 + G.cfg.win * K.win / K.lift; })()"
    # ---------- fetching ----------
    arrive(4, ['bin', 'bin', 'bin', 'recycle'])
    tap(30, 140); ok(E("__sim.G.wk.st") == 'idle', 'a tap on empty road does nothing', E("__sim.G.wk.st"))
    tap(*sign(0)); ok(E("__sim.G.wk.st") == 'walk' and E("__sim.G.wk.item") == E("__sim.G.items[0].id"), "a tap on a bin's sign sends you to fetch it", E("[__sim.G.wk.st, __sim.G.wk.item]"))
    tap(*sign(1)); ok(E("__sim.G.queue") == E("__sim.G.items[1].id"), 'a second tap while you are busy queues the next one')
    # ---------- a press too early does not lift ----------
    C = E("__sim.layout().collect"); touch('touchStart', [(2, (C['x'], C['y']))]); ok(until("__sim.G.wk.st === 'ready'"), 'the bin is brought to the lorry')
    pg.wait_for_timeout(500); ok(E("__sim.G.wk.st") == 'ready', 'a press made before it was at the lorry does not lift it', E("__sim.G.wk.st")); let_go(C)
    # ---------- the green ----------
    C, r = hold_until(f"(() => {{ const it = carried(__sim.G); return it && it.p >= 1.05; }})()"); ok(r and E("__sim.G.wk.st") == 'lift', 'holding COLLECT lifts and empties it')
    let_go(C); ok(E("__sim.G.wk.st") == 'return' and E("__sim.G.items[0].st") == 'return', 'letting go in the green: emptied, and it goes back', E("[__sim.G.wk.st, __sim.G.items[0].st]"))
    ok(until("__sim.G.items[0].st === 'done'"), 'it is put back at its gate') ; ok(abs(E("__sim.G.items[0].x - __sim.G.items[0].hx")) < 0.01, 'exactly where it was')
    ok(E("__sim.G.log.bin") == 1 and E("__sim.G.log.tidy") == 1, 'it counts, as a tidy one')
    # ---------- too soon, too long ----------
    ok(until("__sim.G.wk.st === 'ready'"), 'the queued bin is fetched by itself')
    C, r = hold_until("(() => { const it = carried(__sim.G); return it && it.p >= 0.3; })()"); let_go(C)
    ok(E("__sim.G.wk.st") == 'lower' and E("__sim.G.log.bin") == 1, 'letting go too soon brings it down full', E("__sim.G.wk.st"))
    ok(until("__sim.G.wk.st === 'ready'"), 'and then you can try again')
    n0 = E("__sim.G.items.length"); C, r = hold_until("__sim.G.wk.st === 'lower'", 9000); let_go(C)
    ok(r and E("__sim.G.items.length") == n0 + 1 and E("__sim.G.items[__sim.G.items.length - 1].kind") == 'litter', 'holding on too long bangs it and spills a few bits', str(r))
    ok(E("__sim.G.log.bin") == 1, 'and it is not emptied')
    ok(until("__sim.G.wk.st === 'ready'"), 'it comes back down to try again')
    C, r = hold_until(f"(() => {{ const it = carried(__sim.G); return it && it.p >= 1.05; }})()"); let_go(C); ok(E("__sim.G.log.bin") == 2, 'the second try empties it')
    # ---------- PICK OUT ----------
    E("__sim.G.items[3].wrong = true"); until("__sim.G.wk.st === 'idle'"); tap(*sign(3)); ok(until("__sim.G.wk.st === 'ready'"), 'the recycling is brought over')
    P = E("__sim.layout().pick"); tap(*mid(P)); ok(E("__sim.G.items[3].wrong") is False and E("__sim.G.log.sorted") == 1, 'PICK OUT takes the bag off the recycling')
    ok(E("__sim.G.items.some(q => q.kind === 'bag' && q.st === 'wait')"), 'and leaves it to collect')
    # ---------- the house done ----------
    E("(() => { const G = __sim.G; for (const q of G.items) if (q.kind !== 'litter') { q.st = 'done'; q.x = q.hx; q.z = q.hz; } G.wk.st = 'idle'; G.wk.item = null; })()")
    ok(until("__sim.G.nextOk === true"), 'when everything is done (bits aside), NEXT HOUSE appears')
    si = E("__sim.G.si"); tap(*mid(E("__sim.layout().next"))); ok(until(f"__sim.G.si === {si + 1} && __sim.G.lorry.state === 'drive'"), 'NEXT HOUSE: the lorry moves on')
    ok(E("__sim.G.log.sam") >= 1, 'Sam swept up the bits left behind', E("__sim.G.log.sam"))
    # ---------- AUTO, Stop here and carrying on ----------
    arrive(4, ['bag'])
    tap(*mid(E("__sim.layout().auto"))); ok(E("__sim.G.auto") is True and E("localStorage.getItem('bin.auto')") == 'true', 'AUTO switches on and is remembered')
    tap(*mid(E("__sim.layout().auto"))); ok(E("__sim.G.auto") is False, 'and off again')
    E("(() => { const G = __sim.G; G.items.forEach(q => q.st = 'done'); })()"); until("__sim.G.nextOk === true")
    tap(*mid(E("__sim.layout().next"))); until("__sim.G.lorry.state === 'stopped' && __sim.G.si === 1", 30000); until("__sim.G.wk.st === 'idle'", 5000)
    E("(() => { const G = __sim.G; G.items.forEach(q => q.st = 'done'); })()"); until("__sim.G.nextOk === true")
    tap(*mid(E("__sim.layout().stop"))); ok(E("__sim.G.over") == 'lost' and E("__sim.G.res.rest") is True, 'Stop here ends the shift (not a failure)')
    ok(E("JSON.parse(localStorage.getItem('bin.resume')).from") == 1, 'and the round is kept', E("localStorage.getItem('bin.resume')"))
    pg.wait_for_timeout(900); E("document.getElementById('eMain').click()"); pg.wait_for_timeout(300)
    ok(E("__sim.G.si") == 1, 'CARRY ON starts from where you stopped', E("__sim.G.si"))
    # ---------- nothing is ever lost; pause ----------
    E("__sim.start(5, { seed: 3 }); for (let i = 0; i < 60 * 600; i++) __sim.step(1 / 60);"); ok(E("__sim.G.over") is None, 'ten minutes of doing nothing ends nothing')
    E("localStorage.setItem('bin.taught', '3'); __sim.go(3)"); pg.wait_for_timeout(400)
    E("document.getElementById('pauseBtn').click()"); t1 = E("__sim.G.t"); pg.wait_for_timeout(400); ok(E("__sim.G.t") == t1, 'pause stops the clock'); E("document.getElementById('pResume').click()")
    # ---------- Settings ----------
    E("__sim.live(); localStorage.setItem('bin.settings', '{}'); location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(600)
    sw = "['tMus', 'tSfx', 'tVib'].map(i => document.getElementById(i).textContent === 'ON')"
    ok(E("!!document.getElementById('setBtn').offsetParent"), 'the Settings button is on the home screen')
    E("document.getElementById('setBtn').click()"); ok(E("!document.getElementById('ovSet').classList.contains('hidden')"), 'it opens the Settings card')
    E("document.getElementById('tMus').click()"); ok(E(sw) == [False, True, True], 'Music switches off on its own', str(E(sw)))
    E("document.getElementById('tVib').click()"); ok(E(sw) == [False, True, False], 'Vibration switches off on its own', str(E(sw)))
    E("document.getElementById('tSfx').click()"); ok(E(sw) == [False, False, False], 'Sound effects switch off on their own', str(E(sw)))
    E("location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(500)
    ok(E(sw) == [False, False, False], 'the settings are remembered'); E("localStorage.setItem('bin.settings', '{}')")
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
