#!/usr/bin/env python3
"""Hiring with real touches on a phone-sized screen: the CV is picked up and dragged onto the job it fits (placed right),
onto a job it does not fit (a complaint, and the card says what was missing), and down into the bin. No JavaScript errors.
Run: python3 games/hiring/test_touch.py"""
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
    pg.goto('file://' + os.path.join(here, 'index.html')); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(500)
    cdp = ctx.new_cdp_session(pg)
    def touch(kind, pts): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, x, y in pts]})
    def drag(to):
        L = pg.evaluate('__sim.layout()'); P = L['paper']; x0, y0 = P['x'] + P['w'] / 2, P['y'] + P['h'] / 2
        t = L['bin'] if to < 0 else L['cards'][to]; x1, y1 = t['x'] + t['w'] / 2, t['y'] + t['h'] / 2
        touch('touchStart', [(1, x0, y0)])
        for j in range(1, 13): touch('touchMove', [(1, x0 + (x1 - x0) * j / 12, y0 + (y1 - y0) * j / 12)]); time.sleep(0.016)
        touch('touchEnd', []); pg.wait_for_timeout(700)
    def cvfor(kind):      # a fresh CV of the kind wanted: fits job 0, or none
        pg.evaluate(f"(() => {{ const G = __sim.G; G.cv = null; G.gap = 0; let cv; for (let i = 0; i < 40; i++) {{ cv = null; __sim.step(0.01); if ({'G.cv.fit.length === 0' if kind == 'none' else 'G.cv.fit[0] === 0'}) break; G.cv = null; G.gap = 0; }} }})()")
    pg.evaluate("localStorage.setItem('hr.taught', '3'); __sim.go(5); __sim.G.cfg.cvs = 99; __sim.G.lives = 9"); pg.wait_for_timeout(600)
    cvfor('job'); r0 = pg.evaluate('__sim.G.right'); drag(0); ok(pg.evaluate('__sim.G.right') == r0 + 1, 'the CV dragged onto the job it fits: placed right')
    cvfor('job'); w0 = pg.evaluate('__sim.G.wrong'); drag(1); ok(pg.evaluate('__sim.G.wrong') == w0 + 1 and pg.evaluate('!!__sim.ui.bad && !!__sim.ui.bad.why'), 'dragged onto a job it does not fit: a complaint, and why', pg.evaluate('JSON.stringify(__sim.ui.bad)'))
    cvfor('none'); r0 = pg.evaluate('__sim.G.right'); drag(-1); ok(pg.evaluate('__sim.G.right') == r0 + 1, 'a CV that fits none, dragged into the bin: right')
    cvfor('job'); d0 = pg.evaluate('__sim.G.done'); touch('touchStart', [(1, 195, 600)]); touch('touchMove', [(1, 200, 640)]); touch('touchEnd', []); pg.wait_for_timeout(300)
    ok(pg.evaluate('__sim.G.done') == d0, 'let go on the desk: the CV just goes back')
    pg.screenshot(path='/tmp/hr_touch.png'); ok(not errs, 'no JavaScript errors', str(errs[:3]))
    b.close()
print(f'\n{oks} checks passed, {len(fails)} failed.')
sys.exit(1 if fails else 0)
