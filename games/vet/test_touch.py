#!/usr/bin/env python3
"""Country Vet with real touches on a phone-sized screen, the real 3D picture underneath: the tray picks a tool; a slow stroke
calms her and a fast flick startles her; tweezers on the thorn and a slow pull take it out, a fast one hurts; rasp strokes trim
the hoof; spray held on the cut, then circles of bandage; brush strokes head to tail; the needle held in; drops tapped in.
No JavaScript errors.
Run: python3 games/vet/test_touch.py"""
import os, sys, math, time
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
    cdp = ctx.new_cdp_session(pg)
    def touch(kind, pts): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, x, y in pts]})
    def path(pts, dt=0.016):
        touch('touchStart', [(1, *pts[0])])
        for q in pts[1:]: time.sleep(dt); touch('touchMove', [(1, *q)])
        touch('touchEnd', [])
    def tap(x, y): touch('touchStart', [(1, x, y)]); touch('touchEnd', [])
    def patient(kind, stress=0.1):
        pg.evaluate(f"(() => {{ const G = __sim.G; G.lesson = null; G.pt = null; G.seen = 0; G.cfg.patients = 99; __sim.newPatient('{kind}'); G.pt.phase = 'treat'; G.pt.stress = {stress}; G.pt.twitchAt = 1e9; G.pt.shakeAt = 1e9; }})()")
        pg.wait_for_timeout(2600)      # the camera settles on her
    def tool(name):
        r = pg.evaluate("(() => { const r = __sim.trayRect(); return [r.x, r.y, r.w, r.h]; })()"); tools = ['hand', 'tweezers', 'rasp', 'spray', 'bandage', 'syringe', 'brush', 'drops']
        i = tools.index(name); tap(r[0] + r[2] / 8 * (i + 0.5), r[1] + r[3] / 2)
    def focus():      # the camera moves in on the part once a tool is on it; let it settle there
        pg.evaluate("__sim.G.focus = __sim.G.pt.probs.find(q => !q.done).spot"); pg.wait_for_timeout(2700)
    def spot(): return pg.evaluate("(() => { const q = __sim.G.pt.probs.find(q => !q.done), s = __sim.spotScreen(q.spot); return [s.x, s.y]; })()")
    st = lambda: pg.evaluate('__sim.G.pt.stress')
    pg.evaluate("localStorage.setItem('vt.taught', '3'); __sim.go(5)"); pg.wait_for_timeout(500)
    patient('thorn', 0.5); tool('hand'); hd, tl = pg.evaluate("__sim.headTail().map(p => [p.x, p.y])"); y = (hd[1] + tl[1]) / 2 - 30
    s0 = st(); path([(tl[0] + (hd[0] - tl[0]) * j / 30, y) for j in range(31)], 0.03); ok(st() < s0, 'a slow stroke along her back calms her', f'{s0} -> {st()}')
    s0 = st(); path([(tl[0] + (hd[0] - tl[0]) * j / 4, y) for j in range(5)], 0.008); ok(st() > s0, 'a fast flick startles her', f'{s0} -> {st()}')
    pg.evaluate('__sim.G.pt.stress = 0.1'); tool('tweezers'); ok(pg.evaluate('__sim.G.tool') == 'tweezers', 'a tap on the tray picks the tweezers')
    x, y = spot(); path([(x, y + j * 8) for j in range(0, 22)], 0.07)
    ok(pg.evaluate('__sim.G.pt.probs[0].done'), 'tweezers on the thorn, pulled away slowly: the thorn is out', pg.evaluate('JSON.stringify(__sim.G.pt.probs[0])'))
    patient('thorn'); tool('tweezers'); x, y = spot(); s0 = st(); path([(x, y + j * 30) for j in range(0, 8)], 0.008)
    ok(not pg.evaluate('__sim.G.pt.probs[0].done') and st() > s0, 'pulled fast: it hurts, the thorn stays in', f'{s0} -> {st()}')
    patient('hoof'); tool('rasp'); x, y = spot(); pts = []
    for j in range(14): pts += [(x - 30, y), (x + 30, y)]
    path(pts, 0.03); ok(pg.evaluate('__sim.G.pt.probs[0].done'), 'strokes of the rasp trim the hoof', pg.evaluate('JSON.stringify(__sim.G.pt.probs[0])'))
    patient('cut'); tool('spray'); x, y = spot(); touch('touchStart', [(1, x, y)]); pg.evaluate('__sim.adv(1.3)'); touch('touchEnd', [])
    ok(pg.evaluate('__sim.G.pt.probs[0].step') == 1, 'the spray held on the cut cleans it')
    tool('bandage'); x, y = spot(); pts = [(x + 40 * math.cos(a / 16 * math.tau), y + 40 * math.sin(a / 16 * math.tau)) for a in range(0, 16 * 4 + 1)]
    path(pts, 0.06); ok(pg.evaluate('__sim.G.pt.probs[0].done'), 'slow circles of bandage round the leg wrap it', pg.evaluate('JSON.stringify(__sim.G.pt.probs[0])'))
    patient('mud'); tool('brush'); focus(); t0 = pg.evaluate('__sim.G.treated'); x, y = spot(); hd, tl = pg.evaluate("__sim.headTail().map(p => [p.x, p.y])"); ux = 1 if tl[0] > hd[0] else -1
    for j in range(7): path([(x - ux * 40 + ux * i * 10, y) for i in range(9)], 0.03); pg.wait_for_timeout(150)
    ok(pg.evaluate('__sim.G.treated') > t0, 'brush strokes head to tail clean the mud off')
    patient('mud'); tool('brush'); x, y = spot(); s0 = st(); path([(x + ux * 40 - ux * i * 10, y) for i in range(9)], 0.03); ok(st() > s0, 'brushing against the hair upsets her', f'{s0} -> {st()}')
    patient('shot'); tool('syringe'); x, y = spot(); touch('touchStart', [(1, x, y)]); pg.evaluate('__sim.adv(__sim.G.cfg.shot + 0.3)'); touch('touchEnd', [])
    ok(pg.evaluate('__sim.G.pt.probs[0].done'), 'the needle held in: the injection is given', pg.evaluate('JSON.stringify([__sim.G.pt.animal, __sim.G.pt.probs[0], __sim.G.pt.stress, __sim.G.tool])') + str((x, y)))
    patient('ear'); tool('drops'); focus(); t0 = pg.evaluate('__sim.G.treated'); x, y = spot()
    for j in range(3): tap(x, y); pg.wait_for_timeout(250)
    ok(pg.evaluate('__sim.G.treated') > t0, 'three drops tapped into the ear')
    pg.wait_for_timeout(300); pg.screenshot(path='/tmp/vt_touch.png'); ok(not errs, 'no JavaScript errors', str(errs[:3]))
    b.close()
print(f'\n{oks} checks passed, {len(fails)} failed.')
sys.exit(1 if fails else 0)
