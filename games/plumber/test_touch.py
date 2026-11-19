#!/usr/bin/env python3
"""Plumber with real touches: a tap on a call drives there; a tap on a part walks over and looks; the close button closes the
look; a tap on the right fix starts it; holding and letting go in the green does a hold fix; taps on the beat plunge; the
knob drags into the green; a new part dragged into the gap fits; Give up job gives it up. No errors.
Run: python3 games/plumber/test_touch.py"""
import os, sys, time
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
    E = pg.evaluate
    def job(steps, at):      # the first call becomes this job
        E(f"(() => {{ const c = __sim.G.calls[0]; c.steps = {steps}; c.at = '{at}'; c.dist = 0.5; c.ttl = 999; c.job = Object.assign({{}}, c.job, {{ flood: false, id: 'drip' }}); c.cause = {{ cause: 'test', steps: [] }}; }})()")
    def center(r): return [r['x'] + r['w'] / 2, r['y'] + r['h'] / 2]
    def go_part(pid):
        xy = E(f"(() => {{ const L = __sim.lay(), p = __sim.spot('{pid}'); return [L.X(p[0]), L.Y(p[1])]; }})()"); pg.touchscreen.tap(*xy)
        pg.wait_for_function(f"__sim.G.job && __sim.G.job.look && __sim.G.job.look.id === '{pid}' && __sim.G.job.look.seen", timeout=6000)
    def act(pid, name):
        k = E(f"__sim.FIX['{pid}'].acts.indexOf('{name}')"); n = E(f"__sim.FIX['{pid}'].acts.length"); r = E(f"__sim.actRect({k}, {n}, __sim.lay())"); pg.touchscreen.tap(*center(r)); pg.wait_for_timeout(120)
    def arrive():
        r = E("__sim.callRect(0, __sim.lay())"); pg.touchscreen.tap(*center(r)); pg.wait_for_timeout(100)
        ok(E("__sim.G.phase") == 'drive', 'a tap on a call drives there', E("__sim.G.phase")); pg.wait_for_function("__sim.G.phase === 'job'", timeout=8000)
    E("localStorage.setItem('pu.taught', '3'); __sim.go(5);"); pg.wait_for_timeout(500)
    # 1: a hold fix (the dripping tap)
    job("[['ksink', 'New washer']]", 'ksink'); arrive()
    go_part('ksink'); ok(True, 'a tap on a part walks there and looks')
    cr = E("__sim.closeRect(__sim.lay())"); pg.touchscreen.tap(*center(cr)); pg.wait_for_timeout(100); ok(E("!__sim.G.job.look"), 'the close button closes the look')
    go_part('ksink'); act('ksink', 'New washer'); ok(E("!!__sim.G.job.fix && __sim.G.job.fix.kind === 'hold'"), 'the right fix starts it')
    L = E("(() => { const L = __sim.lay(); return [W / 2, L.sy + L.sheetH * 0.6]; })()") if False else E("(() => { const L = __sim.lay(); return [innerWidth / 2, L.sy + L.sheetH * 0.6]; })()")
    pg.mouse.move(*L); pg.mouse.down(); t0 = time.time()
    while time.time() - t0 < 5:
        m, a, bb = E("[__sim.G.job.fix.m, __sim.G.job.fix.a, __sim.G.job.fix.b]")
        if m >= (a + bb) / 2: break
        pg.wait_for_timeout(8)
    pg.mouse.up(); pg.wait_for_timeout(200)
    ok(E("__sim.G.phase") in ('paid', 'board') and E("__sim.G.cash") > 0, 'hold and let go in the green fixes it and pays', str(E("[__sim.G.phase, __sim.G.cash]")))
    pg.wait_for_function("__sim.G.phase === 'board' && __sim.G.calls.length > 0", timeout=8000)
    # 2: plunge on the beat
    job("[['wc', 'Plunge']]", 'wc'); arrive(); go_part('wc'); act('wc', 'Plunge'); need = E("__sim.G.job.fix.need")
    for i in range(need + 4):
        if E("!__sim.G.job || !__sim.G.job.fix"): break
        pg.wait_for_function("__sim.G.job.fix && (1 - __sim.G.job.fix.p) * __sim.G.job.fix.T < 0.05", timeout=3000); pg.touchscreen.tap(*L); pg.wait_for_timeout(120)
    ok(E("!__sim.G.job || !__sim.G.job.fix"), 'taps on the beat plunge it clear', str(E("__sim.G.job && __sim.G.job.fix && __sim.G.job.fix.hits")))
    pg.wait_for_function("__sim.G.phase === 'board' && __sim.G.calls.length > 0", timeout=8000)
    # 3: drag the knob into the green
    job("[['wc', 'Set the float']]", 'wc'); arrive(); go_part('wc'); act('wc', 'Set the float')
    r = E("__sim.sliderRect(__sim.lay())"); v0, tg = E("[__sim.G.job.fix.v, __sim.G.job.fix.tgt]")
    pg.mouse.move(r['x'] + r['w'] * v0, r['y'] + r['h'] / 2); pg.mouse.down(); pg.mouse.move(r['x'] + r['w'] * tg, r['y'] + r['h'] / 2, steps=10); pg.mouse.up(); pg.wait_for_timeout(200)
    ok(E("!__sim.G.job || !__sim.G.job.fix"), 'the knob dragged into the green sets it')
    pg.wait_for_function("__sim.G.phase === 'board' && __sim.G.calls.length > 0", timeout=8000)
    # 4: fit a new part into the gap
    job("[['otap', 'New section']]", 'otap'); arrive(); go_part('otap'); act('otap', 'New section')
    a, t = E("[__sim.fitStart(__sim.lay()), __sim.fitTarget(__sim.lay())]"); pg.mouse.move(*a); pg.mouse.down(); pg.mouse.move(*t, steps=10); pg.mouse.up(); pg.wait_for_timeout(200)
    ok(E("!__sim.G.job || !__sim.G.job.fix"), 'a new part dragged into the gap fits')
    pg.wait_for_function("__sim.G.phase === 'board' && __sim.G.calls.length > 0", timeout=8000)
    # 5: a wrong fix costs patience; give up job
    job("[['ksink', 'New washer']]", 'ksink'); arrive(); go_part('ksink'); m0 = E("__sim.G.job.mood"); act('ksink', 'Plunge')
    ok(E("__sim.G.job.mood") < m0 - 0.05 and not E("__sim.G.job.fix"), 'a wrong fix costs patience and fixes nothing')
    pg.wait_for_timeout(1500); cr = E("__sim.closeRect(__sim.lay())"); pg.touchscreen.tap(*center(cr)); pg.wait_for_timeout(100)
    lr = E("__sim.leaveRect(__sim.lay())"); lost0 = E("__sim.G.lost"); pg.touchscreen.tap(*center(lr)); pg.wait_for_timeout(200)
    ok(E("__sim.G.lost") == lost0 + 1, 'Give up job gives it up', str(E("[__sim.G.lost, __sim.G.phase]")))
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
