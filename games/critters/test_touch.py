#!/usr/bin/env python3
"""Critter Clash with real touches and real drawing: a tap on empty grass does nothing; ATTACK starts the ring and the next tap
anywhere is the timing tap; GUARD raises the shield; a tap on a bench critter sends it in; buttons do nothing while a move plays.
No JavaScript errors.
Run: python3 games/critters/test_touch.py"""
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
    pg.evaluate("localStorage.setItem('cc.taught', '3'); __sim.go(5);"); pg.wait_for_timeout(400)
    cdp = ctx.new_cdp_session(pg)
    def tap(x, y): cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x, 'y': y, 'id': 1}]}); cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []}); pg.wait_for_timeout(60)
    def btn(kind, i=None): return pg.evaluate("([k, i]) => { const b = __sim.buttons().find(q => q.k === k && (i == null || q.i === i)); return b ? [b.x + b.w / 2, b.y + b.h / 2] : null; }", [kind, i])
    def settle(): pg.evaluate("(() => { const G = __sim.G; let n = 0; while (G.ph !== 'choose' && !G.over && n++ < 2000) __sim.adv(1 / 60); })()")
    tap(195, 330); ok(pg.evaluate("__sim.G.ph") == 'choose', 'a tap on the grass does nothing')
    a = btn('attack'); tap(*a); ok(pg.evaluate("__sim.G.ph") == 'ring', 'ATTACK starts the ring', pg.evaluate("__sim.G.ph"))
    g = btn('guard'); tap(*g); ok(pg.evaluate("__sim.G.act.tap != null && !__sim.G.guard"), 'the next tap (even on GUARD) is the timing tap, not a guard', pg.evaluate("[__sim.G.act.tap, __sim.G.guard]"))
    tap(*g); ok(pg.evaluate("__sim.G.act.k") == 'attack', 'buttons do nothing while the move plays')
    settle(); g = btn('guard'); tap(*g); ok(pg.evaluate("__sim.G.guard") is True, 'GUARD raises the shield', pg.evaluate("[__sim.G.ph, __sim.G.guard]"))
    settle(); i = pg.evaluate("__sim.G.me.findIndex((m, j) => m.alive && j !== __sim.G.ai)"); bb = btn('bench', i); tap(*bb); ok(pg.evaluate("__sim.G.ai") == i, 'a tap on a bench critter sends it in', str([i, pg.evaluate("__sim.G.ai")]))
    pg.wait_for_timeout(400); pg.screenshot(path='/tmp/cc_touch.png'); ok(not errs, 'no JavaScript errors', str(errs[:3]))
    b.close()
print(f'\n{oks} checks passed, {len(fails)} failed.')
sys.exit(1 if fails else 0)
