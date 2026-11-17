#!/usr/bin/env python3
"""Harvest Valley with real touches and real drawing: a tap on a seed picks it; a tap on an empty bed plants it; a tap on a
thirsty crop waters it; a tap on a ripe one picks it; a tap on a crop that is not thirsty rots it; the hen house gives eggs
when laid; the cart sells. A drag is not a tap. No JavaScript errors.
Run: python3 games/harvest/test_touch.py"""
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
    pg.evaluate("localStorage.setItem('hv.taught', '3'); __sim.go(5); __sim.G.lesson = null;"); pg.wait_for_timeout(400)
    cdp = ctx.new_cdp_session(pg)
    def touch(kind, pts): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, x, y in pts]})
    def tap(x, y): touch('touchStart', [(1, x, y)]); touch('touchEnd', []); pg.wait_for_timeout(80)
    bed = lambda i: pg.evaluate(f"(() => {{ const [x, z] = __sim.bedPos(__sim.G.beds[{i}]); const s = __sim.scr(x, 0.6, z); return [s.x, s.y]; }})()")
    sd = pg.evaluate("__sim.seedBar().find(s => s.kd === 'tomato')"); tap(sd['x'] + sd['w'] / 2, sd['y'] + sd['h'] / 2); ok(pg.evaluate("__sim.G.seed") == 'tomato', 'a tap on the tomato seed picks it')
    tap(*bed(5)); ok(pg.evaluate("__sim.G.beds[5].crop && __sim.G.beds[5].crop.kd") == 'tomato', 'a tap on an empty bed plants a tomato')
    pg.evaluate("(() => { const c = __sim.G.beds[5].crop; c.g = c.grow * 0.3; c.thirsty = 0.5; })()"); tap(*bed(5)); ok(pg.evaluate("__sim.G.beds[5].crop.thirsty") == 0 and pg.evaluate("__sim.G.beds[5].crop.drank") == 1, 'a tap on a thirsty crop waters it')
    pg.evaluate("(() => { const c = __sim.G.beds[5].crop; c.ripe = true; })()"); n0 = pg.evaluate("__sim.G.basket.tomato || 0"); tap(*bed(5)); ok(pg.evaluate("__sim.G.basket.tomato") == n0 + 1 and not pg.evaluate("__sim.G.beds[5].crop"), 'a tap on a ripe crop picks it into the basket')
    tap(*bed(6)); pg.evaluate("__sim.G.beds[6].crop.g = 1"); tap(*bed(6)); ok(pg.evaluate("__sim.G.beds[6].crop.rot") == 1, 'a tap on a crop that is not thirsty rots it')
    # a drag is not a tap
    b7 = bed(7); touch('touchStart', [(1, b7[0], b7[1])]); touch('touchMove', [(1, b7[0] + 70, b7[1] + 50)]); touch('touchEnd', []); pg.wait_for_timeout(80); ok(not pg.evaluate("__sim.G.beds[7].crop"), 'a drag across a bed plants nothing')
    co = pg.evaluate("(() => { const s = __sim.scr(__sim.COOP[0], 1.3, __sim.COOP[1]); return [s.x, s.y]; })()"); pg.evaluate("__sim.G.eggs = 2"); tap(*co); ok(pg.evaluate("__sim.G.basket.egg") == 2, 'a tap on the hen house collects the eggs')
    pg.evaluate("(() => { const G = __sim.G; G.orders = [{ kd: 'tomato', want: 3, got: 0 }, { kd: 'egg', want: 5, got: 0 }]; })()")
    ca = pg.evaluate("(() => { const s = __sim.scr(__sim.CART[0], 1.4, __sim.CART[1]); return [s.x, s.y]; })()"); tap(*ca); ok(pg.evaluate("__sim.G.orders[0].got") >= 1 and pg.evaluate("__sim.G.orders[1].got") == 2, 'a tap on the cart sells what the orders want', str(pg.evaluate("__sim.G.orders")))
    pg.wait_for_timeout(400); pg.screenshot(path='/tmp/hv_touch.png'); ok(not errs, 'no JavaScript errors', str(errs[:3]))
    b.close()
print(f'\n{oks} checks passed, {len(fails)} failed.')
sys.exit(1 if fails else 0)
