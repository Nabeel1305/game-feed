#!/usr/bin/env python3
"""Bonsai with real touches: a tap on a pink bud grows a branch (and costs a sap); a tap on a grown branch's leaves prunes it;
a tap on empty sky does nothing; a tap on a caterpillar flicks it off; the Next season button turns the season.
No JavaScript errors.
Run: python3 games/bonsai/test_touch.py"""
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
    pg.evaluate("localStorage.setItem('bo.taught', '3'); __sim.go(1);"); pg.wait_for_timeout(1500)
    def tap(x, y): pg.touchscreen.tap(x, y); pg.wait_for_timeout(250)
    def at(js): return pg.evaluate("(() => { const q = " + js + "; const s = __sim.scr(q[0], q[1], 0.03); return [s.x, s.y]; })()")
    s0 = pg.evaluate("[__sim.G.sap, __sim.G.nodes.length, __sim.G.buds.length]")
    bx = at("(() => { const b = __sim.G.buds[0]; return [b.x + Math.cos(b.ang) * 0.08, b.y + Math.sin(b.ang) * 0.08]; })()")
    tap(*bx); pg.wait_for_timeout(900); s1 = pg.evaluate("[__sim.G.sap, __sim.G.nodes.length, __sim.G.buds.length]")
    ok(s1[1] == s0[1] + 1 and s1[0] == s0[0] - 1, 'a tap on a bud grows a branch and costs a sap', str([s0, s1]))
    n = pg.evaluate("__sim.G.nodes.length"); tap(30, 300); ok(pg.evaluate("__sim.G.nodes.length") == n, 'a tap on empty sky does nothing')
    nx = at("(() => { const n = __sim.G.nodes[__sim.G.nodes.length - 1]; return [n.x, n.y]; })()"); tap(*nx)
    ok(pg.evaluate("__sim.G.nodes.length") == n - 1 and pg.evaluate("__sim.G.pruned") == 1, 'a tap on the new leaves prunes them', str(pg.evaluate("[__sim.G.nodes.length, __sim.G.pruned]")))
    pg.evaluate("(() => { const G = __sim.G, b = G.buds[0]; })()")
    # a caterpillar
    pg.evaluate("(() => { const G = __sim.G; for (const b of G.buds.slice()) { if (G.nodes.length > 4) break; } })()")
    bx = at("(() => { const b = __sim.G.buds[0]; return [b.x + Math.cos(b.ang) * 0.08, b.y + Math.sin(b.ang) * 0.08]; })()"); tap(*bx); pg.wait_for_timeout(900)
    pg.evaluate("(() => { const G = __sim.G, n = G.nodes[G.nodes.length - 1]; G.pests.push({ id: 999, n: n.id, x: n.x + 0.1, y: n.y, t: 0, eat: 30 }); })()")
    cx = at("(() => { const p = __sim.G.pests[0]; return [p.x, p.y]; })()"); tap(*cx)
    ok(pg.evaluate("__sim.G.pests.length") == 0 and pg.evaluate("__sim.G.flicked") == 1, 'a tap on a caterpillar flicks it off')
    s = pg.evaluate("__sim.G.season"); nb = pg.evaluate("__sim.ui.nextBtn"); tap(nb['x'] + nb['w'] / 2, nb['y'] + nb['h'] / 2); pg.wait_for_timeout(300)
    ok(pg.evaluate("__sim.G.season") == s + 1, 'the Next season button turns the season', str([s, pg.evaluate("__sim.G.season")]))
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
