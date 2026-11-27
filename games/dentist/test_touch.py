#!/usr/bin/env python3
"""Dentist with real touches (a phone held upright): a tap while the patient talks begins; a tap on the tray picks a tool;
pressing on the teeth with no tool picked does nothing but say so; the tool works just above the fingertip; calm brush strokes
over a dirty tooth clean it; fast scrubbing does not, hurts, and costs comfort; ⇅ turns to the other row; ✓ with work left says
what is left (and costs a star); the 🔍 mirror finds a cavity; the drill on healthy tooth is a mistake; the drill on found decay
removes it; ➕ zooms; 💬 calms them; the wire key tightens when let go in the green. Then the rules: comfort at zero is a break,
three breaks and they leave; the clinic's clock running out ends the day; ✓ with everything done sends them out smiling and
wins. The Settings switch Music, Sound effects, Vibration and the drill sound, and remember them. No errors.
Run: python3 games/dentist/test_touch.py"""
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
    def tap(x, y): touch('touchStart', [(5, (x, y))]); touch('touchEnd', [(5, (x, y))]); pg.wait_for_timeout(80)
    def until(js, ms=15000):
        try: pg.wait_for_function(js, timeout=ms); return True
        except Exception: return False
    def L(): return E("__sim.layout()")
    def btn(name): b2 = L()[name]; return (b2['x'], b2['y'])
    def tool(tid): t = next(q for q in L()['tray'] if q['id'] == tid); tap(t['x'], t['y'])
    def fpt(mx, my): return E(f"(() => {{ const p = m2s(__sim.G, {mx}, {my}); return [p.x, p.y + LIFT * k]; }})()")      # where a finger goes so the tool works at (mx, my)
    def stroke(pts, ms=900):
        touch('touchStart', [(1, pts[0])]); n = len(pts) - 1
        for i in range(1, n + 1): touch('touchMove', [(1, pts[i])]); pg.wait_for_timeout(max(8, ms // n))
        touch('touchEnd', [(1, pts[-1])]); pg.wait_for_timeout(80)
    def fresh(N, relax=False):
        E(f"localStorage.setItem('dnt.taught', '99'); __sim.practice({str(relax).lower()}); __sim.go({N})"); pg.wait_for_timeout(300)
    # ---------- the talk, the tray ----------
    fresh(4); ok(E("__sim.G.phase") == 'talk', 'a patient comes in and talks first')
    tap(200, 500); ok(until("__sim.G.phase === 'work'", 3000), 'a tap while they talk begins the work')
    E("__sim.G.clock = 1e6")
    m = E("(() => { const t = archOf(__sim.G).teeth[4]; return [t.x, t.y]; })()"); f = fpt(*m)
    tap(*f); ok(E("__sim.G.hand.down") is False and E("__sim.G.tool") is None, 'pressing on the teeth with no tool picked does nothing')
    tool('brush'); ok(E("__sim.G.tool") == 'brush', 'a tap on the tray picks a tool')
    # ---------- brushing ----------
    SETUP = """((L) => { const A = archOf(__sim.G), t = A.teeth[3]; for (const T of A.teeth) for (const c of T.cells) { c.food = 0; c.plaque = 0; c.tartar = 0; c.stain = 0; } for (const c of t.cells) c[L] = 1; return [t.x, t.y, t.r]; })"""
    tx, ty, tr = E(SETUP, 'plaque'); pts = []
    for row in range(5):
        yy = ty - tr * 0.8 + row * tr * 0.4
        for s in range(9): pts.append(fpt(tx - tr + (s if row % 2 == 0 else 8 - s) * tr / 4, yy))
    touch('touchStart', [(1, pts[0])]); pg.wait_for_timeout(30); f0 = pts[0]
    ok(abs(E("__sim.G.hand.y") - E(f"s2m(__sim.G, {f0[0]}, {f0[1]} - LIFT * k).y")) < 1e-6 and E(f"s2m(__sim.G, {f0[0]}, {f0[1]}).y") > E("__sim.G.hand.y"), 'the tool works just above the fingertip')
    for i in range(1, len(pts)): touch('touchMove', [(1, pts[i])]); pg.wait_for_timeout(45)
    for i in range(len(pts) - 2, -1, -1): touch('touchMove', [(1, pts[i])]); pg.wait_for_timeout(45)
    touch('touchEnd', [(1, pts[0])]); pg.wait_for_timeout(100)
    left0 = E("(() => { const t = archOf(__sim.G).teeth[3]; return t.cells.filter(c => c.plaque > 0.08).length / t.cells.length; })()")
    ok(left0 < 0.35, 'calm brush strokes over a dirty tooth clean it', str(left0))
    tx, ty, tr = E(SETUP, 'plaque'); c0 = E("pat(__sim.G).comfort = 1"); r0 = E("__sim.G.stats.roughs")
    pts = [fpt(tx + (0.25 if i % 2 else -0.25), ty) for i in range(16)]; stroke(pts, 380)
    ok(E("__sim.G.stats.roughs") > r0 and E("pat(__sim.G).comfort") < 1, 'fast scrubbing is rough and costs comfort', str([E("__sim.G.stats.roughs"), E("pat(__sim.G).comfort")]))
    ok(E("(() => { const t = archOf(__sim.G).teeth[3]; return t.cells.filter(c => c.plaque > 0.5).length / t.cells.length; })()") > 0.6, 'and cleans next to nothing')
    # ---------- the buttons ----------
    a0 = E("__sim.G.arch"); tap(*btn('flip')); ok(E("__sim.G.arch") == 1 - a0, '⇅ turns to the other row')
    tap(*btn('flip')); mk = E("__sim.G.mistakes"); tap(*btn('done')); ok(E("__sim.G.mistakes") == mk + 1 and E("__sim.G.phase") == 'work', '✓ with work left says what is left (and costs a star)')
    tap(*btn('zoom')); ok(E("__sim.ui.zoom") > 1, '➕ zooms in'); tap(*btn('zoom')); ok(E("__sim.ui.zoom") == 1, 'and back out')
    E("pat(__sim.G).comfort = 0.3; __sim.G.reCd = 0"); tap(*btn('re')); ok(E("pat(__sim.G).comfort") > 0.45, '💬 calms them', E("pat(__sim.G).comfort"))
    # ---------- find it, drill it ----------
    E("""(() => { const G = __sim.G, P = pat(G); for (const A of P.arches) for (const t of A.teeth) { t.cav = null; t.found = false; for (const c of t.cells) { c.decay = 0; c.hole = 0; c.dust = 0; } } const t = archOf(G).teeth[6]; t.cav = 'surface'; for (const c of t.cells) if (Math.hypot(c.x - t.x, c.y - t.y) < t.r * 0.45) c.decay = 1; P.probs = [{ k: 'cavity', a: G.arch, t: 6 }]; })()""")
    t6 = E("(() => { const t = archOf(__sim.G).teeth[6]; return [t.x, t.y, t.r]; })()")
    tool('mirror'); stroke([fpt(t6[0] - 0.15, t6[1]), fpt(t6[0] - 0.05, t6[1]), fpt(t6[0], t6[1]), fpt(t6[0] + 0.01, t6[1])], 700)
    ok(E("archOf(__sim.G).teeth[6].found") is True, 'the 🔍 mirror finds a cavity')
    tool('drill'); mk = E("__sim.G.mistakes"); hp = fpt(t6[0] + t6[2] * 0.82, t6[1]); touch('touchStart', [(1, hp)]); pg.wait_for_timeout(500); touch('touchEnd', [(1, hp)]); pg.wait_for_timeout(100)
    ok(E("__sim.G.mistakes") > mk, 'the drill on healthy tooth is a mistake')
    cp = fpt(t6[0], t6[1]); touch('touchStart', [(1, cp)])
    for i in range(30):
        a = i * 0.7; touch('touchMove', [(1, fpt(t6[0] + 0.03 * __import__('math').cos(a), t6[1] + 0.03 * __import__('math').sin(a)))]); pg.wait_for_timeout(60)
    touch('touchEnd', [(1, cp)]); pg.wait_for_timeout(100)
    ok(E("archOf(__sim.G).teeth[6].cells.filter(c => c.decay > 0.05).length") < E("archOf(__sim.G).teeth[6].cells.filter(c => c.hole > 0.3).length"), 'the drill on found decay removes it', str(E("archOf(__sim.G).teeth[6].cells.map(c => +c.decay.toFixed(1))")))
    # ---------- the wire key ----------
    fresh(8); tap(200, 500); until("__sim.G.phase === 'work'", 3000); E("__sim.G.clock = 1e6")
    a = E("pat(__sim.G).probs[0].a"); E(f"(() => {{ const G = __sim.G; G.arch = {a}; const B = archOf(G).braces; B.fixed = B.loose.slice(); B.g0 = 0.5; }})()")
    tool('wire'); wp = fpt(0, -0.3); touch('touchStart', [(1, wp)]); ok(until("__sim.G.gauge && gaugeP(__sim.G) > 0.55", 4000), '(the wire gauge fills while you hold)'); touch('touchEnd', [(1, wp)]); pg.wait_for_timeout(100)
    ok(E("archOf(__sim.G).braces.wire") == 1, 'the wire key tightens when let go in the green')
    # ---------- the rules ----------
    E("__sim.start(3, { seed: 7 }); (() => { const G = __sim.G; G.phase = 'work'; })()")
    E("(() => { const G = __sim.G, P = pat(G); P.comfort = 0.01; G.tool = 'drill'; down(G, archOf(G).teeth[2].x, archOf(G).teeth[2].y); for (let i = 0; i < 30; i++) __sim.step(1 / 60); })()")
    ok(E("pat(__sim.G).strikes") == 1 and E("__sim.G.phase") == 'break', 'comfort at zero is a break')
    E("(() => { const G = __sim.G, P = pat(G); P.strikes = 2; G.phase = 'work'; P.comfort = -0.05; for (let i = 0; i < 5; i++) __sim.step(1 / 60); })()")
    ok(E("__sim.G.over") == 'lost' and E("__sim.G.res.why") == 'left', 'three breaks and they leave', str([E("__sim.G.over"), E("__sim.G.res && __sim.G.res.why")]))
    E("__sim.start(3, { seed: 8 }); (() => { const G = __sim.G; G.phase = 'work'; G.clock = 0.05; for (let i = 0; i < 10; i++) __sim.step(1 / 60); })()")
    ok(E("__sim.G.over") == 'lost' and E("__sim.G.res.why") == 'clock', 'the clinic\'s clock running out ends the day')
    E("""__sim.start(2, { seed: 9 }); (() => { const G = __sim.G; G.phase = 'work'; for (const A of pat(G).arches) for (const t of A.teeth) for (const c of t.cells) { c.food = c.plaque = c.tartar = c.stain = 0; } finishPatient(G); for (let i = 0; i < 60 * 4; i++) __sim.step(1 / 60); })()""")
    ok(E("__sim.G.over") == 'won', '✓ with everything done sends them out smiling (and wins)', E("__sim.G.over"))
    # ---------- settings ----------
    E("__sim.live(); localStorage.setItem('dnt.settings', '{}'); location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(600)
    sw = "['tMus', 'tSfx', 'tVib'].map(i => document.getElementById(i).textContent === 'ON')"
    E("document.getElementById('setBtn').click()"); ok(E("!document.getElementById('ovSet').classList.contains('hidden')"), 'the Settings button opens the Settings card')
    E("document.getElementById('tMus').click()"); ok(E(sw) == [False, True, True], 'Music switches off on its own', str(E(sw)))
    E("document.getElementById('tVib').click()"); ok(E(sw) == [False, True, False], 'Vibration switches off on its own', str(E(sw)))
    E("document.getElementById('tSfx').click()"); ok(E(sw) == [False, False, False], 'Sound effects switch off on their own', str(E(sw)))
    E("document.getElementById('tDrill').click()"); ok(E("document.getElementById('tDrill').textContent") == 'QUIETER', 'the drill sound turns down on its own', E("document.getElementById('tDrill').textContent"))
    E("location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(500)
    E("document.getElementById('setBtn').click()"); ok(E(sw) == [False, False, False] and E("document.getElementById('tDrill').textContent") == 'QUIETER', 'the settings are remembered', str([E(sw), E("document.getElementById('tDrill').textContent")])); E("localStorage.setItem('dnt.settings', '{}')")
    ok(not errs, 'no JavaScript errors', str(errs[:3])); ctx.close(); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
