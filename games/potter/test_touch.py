#!/usr/bin/env python3
"""Potter's Wheel with real touches on a phone-sized screen: a finger on the side of the clay, moved slowly inwards, narrows it
there; moved slowly outwards, widens it; a finger far from the clay does nothing; FIRE below fires the pot (cracked if the
match is short, fired if it reaches the mark). No JavaScript errors.
Run: python3 games/potter/test_touch.py"""
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
    pg.add_init_script('window.__softGL = true'); pg.goto('file://' + os.path.join(here, 'index.html')); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(800)
    cdp = ctx.new_cdp_session(pg)
    def touch(kind, pts): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, x, y in pts]})
    pg.evaluate("localStorage.setItem('pw.taught', '3'); __sim.go(4); __sim.G.cfg.pots = 9; __sim.G.lives = 9"); pg.wait_for_timeout(2700)
    r = lambda i: pg.evaluate(f'__sim.G.r[{i}]')
    def slide(u, d0, d1, secs=1.5):
        a = pg.evaluate(f'__sim.potScreen({u}, {d0})'); z = pg.evaluate(f'__sim.potScreen({u}, {d1})'); n = 30
        touch('touchStart', [(1, a['x'], a['y'])])
        for j in range(1, n + 1): touch('touchMove', [(1, a['x'] + (z['x'] - a['x']) * j / n, a['y'])]); pg.evaluate(f'__sim.adv({secs / n})')
        touch('touchEnd', [])
    r0 = r(12); slide(0.5, r0, r0 - 0.15); r1 = r(12); ok(r1 < r0 - 0.08, 'a finger moved slowly in on the clay narrows it there', f'{r0:.2f} -> {r1:.2f}')
    ok(r(2) > r1 + 0.05, '...and only there, not at the base', f'{r(2):.2f}')
    r0 = r(12); slide(0.5, r0, r0 + 0.12); ok(r(12) > r0 + 0.05, 'moved slowly out, it widens', f'{r0:.2f} -> {r(12):.2f}')
    r0 = r(6); slide(0.25, r0 + 0.5, r0 + 0.6); ok(abs(r(6) - r0) < 0.01, 'a finger far from the clay does nothing', f'{r0:.2f} -> {r(6):.2f}')
    fr = pg.evaluate('__sim.fireRect()'); m0 = pg.evaluate('__sim.G.ruined')
    touch('touchStart', [(1, fr['x'] + fr['w'] / 2, fr['y'] + fr['h'] / 2)]); touch('touchEnd', []); pg.wait_for_timeout(200)
    ok(pg.evaluate('__sim.G.ruined') == m0 + 1, 'FIRE with the match short of the mark: the pot cracks')
    pg.evaluate('__sim.adv(1.5); (() => { const G = __sim.G; G.r = G.target.slice(); })()'); g0 = pg.evaluate('__sim.G.good')
    touch('touchStart', [(1, fr['x'] + fr['w'] / 2, fr['y'] + fr['h'] / 2)]); touch('touchEnd', []); pg.wait_for_timeout(200)
    ok(pg.evaluate('__sim.G.good') == g0 + 1, 'FIRE at the mark: the pot is fired')
    pg.wait_for_timeout(300); pg.screenshot(path='/tmp/pw_touch.png'); ok(not errs, 'no JavaScript errors', str(errs[:3]))
    b.close()
print(f'\n{oks} checks passed, {len(fails)} failed.')
sys.exit(1 if fails else 0)
