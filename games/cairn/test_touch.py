#!/usr/bin/env python3
"""Cairn with real touches: a tap anywhere drops the swaying stone where it is (it lands under where it hung); a tap on a
stone in the basket takes it next and does not drop anything; a second tap while a stone is still falling does nothing.
No JavaScript errors.
Run: python3 games/cairn/test_touch.py"""
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
    pg.evaluate("localStorage.setItem('cn.taught', '3'); __sim.go(1);"); pg.wait_for_timeout(600)
    cdp = ctx.new_cdp_session(pg)
    def tap(x, y): cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x, 'y': y, 'id': 1}]}); cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []}); pg.wait_for_timeout(30)
    r = pg.evaluate("__sim.ui.basket.map(q => [q.x + q.w / 2, q.y + q.h / 2])"); before = pg.evaluate("[__sim.G.hang.st.kind, __sim.G.basket.map(q => q.kind).join(',')]")
    tap(r[1][0], r[1][1]); after = pg.evaluate("[__sim.G.hang.st.kind, __sim.G.basket.map(q => q.kind).join(','), __sim.G.falling.length, __sim.G.left]")
    ok(after[0] == before[1].split(',')[1] and after[2] == 0, 'a tap on the second basket stone takes it next, and drops nothing', str([before, after]))
    hx = pg.evaluate("__sim.G.hang && (() => { const G = __sim.G; return null; })()")
    pg.wait_for_function('(() => { const G = __sim.G; return G.hang && Math.abs(Math.sin(G.hang.ph)) * G.cfg.amp < 0.12; })()', polling=5); tap(200, 400); f = pg.evaluate("[__sim.G.falling.length, __sim.G.falling[0] && __sim.G.falling[0].st.x, __sim.G.left]"); ok(f[0] == 1 and f[2] == after[3] - 1, 'a tap anywhere else drops the stone', str(f))
    tap(200, 400); ok(pg.evaluate("__sim.G.falling.length") <= 1, 'a second tap while it falls does nothing more')
    pg.wait_for_timeout(1200); s = pg.evaluate("[__sim.G.stack.length, __sim.G.stack[0] && __sim.G.stack[0].x]"); ok(s[0] == 1 and abs(s[1] - f[1]) < 1e-6, 'it lands straight under where it hung', str([f, s]))
    pg.wait_for_timeout(300); pg.screenshot(path='/tmp/cn_touch.png'); ok(not errs, 'no JavaScript errors', str(errs[:3]))
    b.close()
print(f'\n{oks} checks passed, {len(fails)} failed.')
sys.exit(1 if fails else 0)
