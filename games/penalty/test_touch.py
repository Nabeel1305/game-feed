#!/usr/bin/env python3
"""Penalty Kings with real touches and real drawing: your kick: a tap below the goal does nothing, a tap on the goal's top
right aims there, the next tap anywhere strikes; their kick: a tap on the left of the screen dives to the left of the screen
(the camera looks out from behind your goal), the middle stays, the right dives right; a tap before the kicker plants is
an early dive. No JavaScript errors.
Run: python3 games/penalty/test_touch.py"""
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
    pg.evaluate("localStorage.setItem('pk.taught', '3'); __sim.go(4); __sim.ui.snap = true;"); pg.wait_for_timeout(500)
    cdp = ctx.new_cdp_session(pg)
    def tap(x, y): cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x, 'y': y, 'id': 1}]}); cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []}); pg.wait_for_timeout(60)
    tap(195, 800); ok(pg.evaluate("__sim.G.ph") == 'aim', 'a tap far below the goal does not aim', pg.evaluate("__sim.G.ph"))
    c = pg.evaluate("(() => { const s = __sim.scr(2.9, 1.9, 0); return [s.x, s.y]; })()"); tap(c[0], c[1])
    a = pg.evaluate("[__sim.G.ph, __sim.G.S.aim && __sim.G.S.aim.x, __sim.G.S.aim && __sim.G.S.aim.y]"); ok(a[0] == 'meter' and abs(a[1] - 2.9) < 0.3 and abs(a[2] - 1.9) < 0.3, 'a tap on the top right of the goal aims there', str(a))
    tap(100, 600); ok(pg.evaluate("__sim.G.ph") == 'kickS', 'the next tap anywhere strikes', pg.evaluate("__sim.G.ph"))
    pg.evaluate("(() => { const G = __sim.G; while (G.side !== 'K' && !G.over) __sim.adv(0.1); while (G.ph !== 'kickK') __sim.adv(1 / 60); })()")
    tap(50, 500); d = pg.evaluate("[__sim.G.K.dive, __sim.G.K.early]"); ok(d[0] == 1 and d[1] is False, 'after the plant, a tap on the left dives to the left (world +x)', str(d))
    pg.wait_for_timeout(350); kx = pg.evaluate("(() => { const p = __sim.V3.myKeeper.position; return __sim.scr(p.x, 1, p.z).x; })()"); ok(kx < 160, 'and the keeper is seen diving to the left of the screen', str(kx))
    pg.evaluate("(() => { const G = __sim.G; while (G.ph === 'kickK' || G.ph === 'resK') __sim.adv(0.05); while (G.side !== 'K' && !G.over) __sim.adv(0.1); })()")
    pg.evaluate("(() => { const G = __sim.G; while (G.ph !== 'run') __sim.adv(1 / 60); })()")
    tap(195, 500); d = pg.evaluate("[__sim.G.K.dive, __sim.G.K.early]"); ok(d[0] == 0 and d[1] is True, 'a tap in the middle before the plant: staying, early', str(d))
    pg.evaluate("(() => { const G = __sim.G; while (G.ph === 'run' || G.ph === 'kickK' || G.ph === 'resK') __sim.adv(0.05); while (G.side !== 'K' && !G.over) __sim.adv(0.1); while (G.ph !== 'kickK') __sim.adv(1 / 60); })()")
    tap(350, 500); ok(pg.evaluate("__sim.G.K.dive") == -1, 'a tap on the right dives right (world -x)', pg.evaluate("__sim.G.K.dive"))
    pg.wait_for_timeout(400); pg.screenshot(path='/tmp/pk_touch.png'); ok(not errs, 'no JavaScript errors', str(errs[:3]))
    b.close()
print(f'\n{oks} checks passed, {len(fails)} failed.')
sys.exit(1 if fails else 0)
