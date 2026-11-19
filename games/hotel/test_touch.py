#!/usr/bin/env python3
"""Grand Hotel with real touches: tapping a bubble takes the job (it shows in the job bar); the attendant goes and does it and a
tip comes in; tapping a job in the bar lets it go; a fourth job does not fit; no JavaScript errors.
Run: python3 games/hotel/test_touch.py"""
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
    pg.evaluate("localStorage.setItem('ht.taught', '3'); __sim.go(3);"); pg.wait_for_timeout(300)
    # make three requests now
    pg.evaluate("(() => { const G = __sim.G; G.sched.slice(0, 4).forEach(s => s.at = 0); })()"); pg.wait_for_timeout(500)
    def bub(i): return pg.evaluate(f"(() => {{ const G = __sim.G, L = __sim.lay(), q = G.reqs.filter(r => !r.gone)[{i}]; const p = __sim.bubXY(q, L); return [p.x, p.y, q.id]; }})()")
    x, y, id0 = bub(0); pg.touchscreen.tap(x, y); pg.wait_for_timeout(200)
    ok(pg.evaluate(f"__sim.G.queue.includes({id0})"), 'tapping a bubble takes the job')
    x, y, id1 = bub(1); pg.touchscreen.tap(x, y); pg.wait_for_timeout(200)
    c = pg.evaluate("__sim.lay().chips[1]"); pg.touchscreen.tap(c['x'] + c['w'] / 2, c['y'] + c['h'] / 2); pg.wait_for_timeout(200)
    ok(not pg.evaluate(f"__sim.G.queue.includes({id1})"), 'tapping a job in the bar lets it go')
    tips0 = pg.evaluate("__sim.G.tips"); pg.wait_for_timeout(9000)
    ok(pg.evaluate("__sim.G.tips") > tips0, 'the attendant does the job and a tip comes in', str(pg.evaluate("[__sim.G.tips, __sim.G.queue]")))
    n = pg.evaluate("(() => { const G = __sim.G; G.queue = []; for (let i = 0; i < 4; i++) G.reqs.push({ id: 900 + i, k: 'food', room: 0, f: 1, x: 0.3, pat: 99, max: 99, t: 0 }); [900, 901, 902, 903].forEach(id => __sim.take(id)); return G.queue.length; })()")
    ok(n == 3, 'you hold three jobs at most', str(n))
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
