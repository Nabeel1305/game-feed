#!/usr/bin/env python3
"""Heaven or Hell with real touches and real drawing: drag the soul's card up (Heaven), down (Hell) or sideways (Purgatory);
a short drag does nothing; a tap on the Book unseals the hidden deeds. No JavaScript errors.
Run: python3 games/heaven/test_touch.py"""
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
    pg.goto('file://' + os.path.join(here, 'index.html')); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(600)
    pg.evaluate("localStorage.setItem('hh.taught', '3'); __sim.go(8); __sim.G.lesson = null;"); pg.wait_for_timeout(300)
    cdp = ctx.new_cdp_session(pg)
    def touch(kind, pts): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, x, y in pts]})
    def drag(x0, y0, x1, y1):
        touch('touchStart', [(1, x0, y0)])
        for j in range(1, 6): touch('touchMove', [(1, x0 + (x1 - x0) * j / 5, y0 + (y1 - y0) * j / 5)])
        touch('touchEnd', []); pg.wait_for_timeout(80)
    def nxt(): pg.wait_for_timeout(800)
    n0 = pg.evaluate("__sim.G.judged"); drag(200, 450, 205, 440); ok(pg.evaluate("__sim.G.judged") == n0, 'a short drag judges nobody')
    drag(200, 450, 200, 300); ok(pg.evaluate("__sim.G.judged") == n0 + 1 and pg.evaluate("__sim.G.last.dir") == 'up', 'drag up: Heaven'); nxt()
    drag(200, 400, 200, 560); ok(pg.evaluate("__sim.G.last.dir") == 'down', 'drag down: Hell'); nxt()
    drag(120, 450, 300, 460); ok(pg.evaluate("__sim.G.last.dir") == 'side', 'drag sideways: Purgatory'); nxt()
    # the Book
    pg.evaluate("(() => { const G = __sim.G; G.soul.deeds.push({ kind: 'animal', text: 'Fed a stray', w: 1, hidden: true }); G.soul.looked = false; G.looks = 2; })()")
    bk = pg.evaluate("(() => { const B = __sim.bookRect(); return [B.x + B.w / 2, B.y + B.h / 2]; })()")
    touch('touchStart', [(1, bk[0], bk[1])]); touch('touchEnd', []); pg.wait_for_timeout(100)
    ok(pg.evaluate("__sim.G.soul.looked") is True, "a tap on the Book: the sealed deeds are read (no limit on looks now)")
    pg.wait_for_timeout(300); pg.screenshot(path='/tmp/hh_touch.png'); ok(not errs, 'no JavaScript errors', str(errs[:3]))
    b.close()
print(f'\n{oks} checks passed, {len(fails)} failed.')
sys.exit(1 if fails else 0)
