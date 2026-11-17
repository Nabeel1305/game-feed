#!/usr/bin/env python3
"""Hunter with real touches and real drawing: the left thumb held creeps and lifted freezes; the right thumb pulled back shows the
mark and let go throws; with a lion growling, a sideways swipe turns toward it and a tap braces. Two thumbs at once. No JavaScript
errors. Run: python3 games/hunter/test_touch.py"""
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
    pg.evaluate("localStorage.setItem('hu.taught', '3'); __sim.go(4); __sim.G.lesson = null; __sim.G.cfg.lion = 0; __sim.G.a.next = 99;"); pg.wait_for_timeout(300)
    cdp = ctx.new_cdp_session(pg)
    def touch(kind, pts): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, x, y in pts]})
    touch('touchStart', [(1, 90, 650)]); pg.wait_for_timeout(300); c1 = pg.evaluate("__sim.G.me.creep")
    # second thumb while the first holds: pull back on the right
    touch('touchMove', [(1, 90, 650), (2, 300, 560)]); touch('touchStart', [(1, 90, 650), (2, 300, 560)])
    for j in range(1, 5): touch('touchMove', [(1, 90, 650), (2, 300, 560 + 40 * j)])
    aim = pg.evaluate("!!__sim.ui.aim"); touch('touchEnd', []); sp = pg.evaluate("__sim.G.spears.length")
    ok(c1, 'left thumb held: creeping'); ok(aim, 'right thumb pulled back while the left creeps: the mark shows'); ok(sp == 1, 'both let go: the spear is thrown', str(sp))
    ok(not pg.evaluate("__sim.G.me.creep"), 'left thumb lifted: frozen')
    pg.evaluate("(() => { const G = __sim.G; G.spears.forEach(s => s.done = true); G.over = null; G.lion = { side: 1, st: 'stalk', t: 0, leapAt: 99 }; G.me.face = 0; })()")
    touch('touchStart', [(1, 150, 600)]); 
    for j in range(1, 5): touch('touchMove', [(1, 150 + 30 * j, 600)])
    touch('touchEnd', []); ok(pg.evaluate("__sim.G.me.face") == 1, 'a swipe right turns toward the growl')
    pg.evaluate("__sim.G.lion.st = 'leap'; __sim.G.lion.t = 0;"); touch('touchStart', [(1, 200, 600)]); touch('touchEnd', [])
    ok(pg.evaluate("__sim.G.lionsKilled") == 1, 'a tap as it leaps braces the spear: lion held off')
    pg.wait_for_timeout(500); pg.screenshot(path='/tmp/hu_touch.png'); ok(not errs, 'no JavaScript errors', str(errs[:3]))
    b.close()
print(f'\n{oks} checks passed, {len(fails)} failed.')
sys.exit(1 if fails else 0)
