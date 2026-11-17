#!/usr/bin/env python3
"""Castle Siege with real touches and real drawing: every move is a tap. A tap on a stone pad opens its four towers; a tap on
one builds it; a tap on the tower opens upgrade and sell; CALL brings the next wave early for gold; METEOR, then a tap on the
road, drops fire there. A drag is not a tap. No JavaScript errors.
Run: python3 games/castle/test_touch.py"""
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
    pg.evaluate("localStorage.setItem('cs.taught', '3'); __sim.go(5); __sim.G.lesson = null; __sim.G.gold = 600;"); pg.wait_for_timeout(400)
    cdp = ctx.new_cdp_session(pg)
    def touch(kind, pts): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, x, y in pts]})
    def tap(x, y): touch('touchStart', [(1, x, y)]); touch('touchEnd', []); pg.wait_for_timeout(80)
    # the pad that covers the most road
    pad = pg.evaluate("(() => { const S = __sim; let b = 0, bi = 0; S.PADS.forEach((p, i) => { const c = S.cover(i, 6); if (c > b) { b = c; bi = i; } }); return bi; })()")
    pxy = pg.evaluate(f"(() => {{ const P = __sim.PADS[{pad}], s = __sim.scr(P[0], 0.4, P[1]); return [s.x, s.y]; }})()")
    tap(*pxy); ok(pg.evaluate("__sim.ui.sel") == pad, 'a tap on a pad opens its towers', str(pg.evaluate("__sim.ui.sel")))
    pg.wait_for_timeout(100); btns = pg.evaluate("__sim.menuFor()"); ok(len(btns) == 4 and [b2['kind'] for b2 in btns] == ['archer', 'cat', 'mage', 'frost'], 'four towers to pick from', str(btns))
    a = btns[0]; tap(a['x'], a['y']); ok(pg.evaluate(f"__sim.G.towers[{pad}] && __sim.G.towers[{pad}].kind") == 'archer', 'a tap on Archers builds archers on that pad')
    ok(pg.evaluate("__sim.ui.sel") == -1, 'and the menu closes')
    tap(*pxy); pg.wait_for_timeout(100); btns = pg.evaluate("__sim.menuFor()"); ok([b2['act'] for b2 in btns] == ['up', 'sell'], 'a tap on the tower: upgrade or sell', str(btns))
    tap(btns[0]['x'], btns[0]['y']); ok(pg.evaluate(f"__sim.G.towers[{pad}].lv") == 1, 'upgrade: rank two')
    # a drag is not a tap
    other = pg.evaluate(f"(() => {{ const i = __sim.PADS.findIndex((p, j) => j !== {pad}); const P = __sim.PADS[i], s = __sim.scr(P[0], 0.4, P[1]); return [i, s.x, s.y]; }})()")
    pg.evaluate("__sim.ui.sel = -1"); touch('touchStart', [(1, other[1], other[2])]); touch('touchMove', [(1, other[1] + 80, other[2] + 60)]); touch('touchEnd', []); pg.wait_for_timeout(80)
    ok(pg.evaluate("__sim.ui.sel") == -1, 'a drag across a pad does not open it')
    # call the wave early (field empty, before the first wave)
    g0 = pg.evaluate("__sim.G.gold"); w0 = pg.evaluate("__sim.G.wave"); cb = pg.evaluate("(() => { const c = __sim.callBtn(), y = __sim.ui.callY != null ? __sim.ui.callY : c.y; return [c.x + c.w / 2, y + c.h / 2]; })()")
    tap(*cb); ok(pg.evaluate("__sim.G.wave") == w0 + 1 and pg.evaluate("__sim.G.gold") > g0, 'CALL: the wave comes now, with gold for the hurry', str([w0, pg.evaluate("__sim.G.wave"), g0, pg.evaluate("__sim.G.gold")]))
    # the meteor: tap the button, then the road
    m = pg.evaluate("(() => { const b = __sim.meteorBtn(); return [b.x, b.y]; })()"); tap(*m); ok(pg.evaluate("__sim.ui.aim") is True, 'METEOR: ready to drop')
    road = pg.evaluate("(() => { const p = __sim.roadAt(__sim.PATH_LEN * 0.6), s = __sim.scr(p.x, 0, p.z); return [s.x, s.y]; })()")
    tap(*road); ok(pg.evaluate("__sim.G.meteor") > 0 and pg.evaluate("__sim.ui.aim") is False, 'a tap on the road drops it there', str(pg.evaluate("[__sim.G.meteor, __sim.ui.aim]")))
    pg.wait_for_timeout(1200); pg.screenshot(path='/tmp/cs_touch.png'); ok(not errs, 'no JavaScript errors', str(errs[:3]))
    b.close()
print(f'\n{oks} checks passed, {len(fails)} failed.')
sys.exit(1 if fails else 0)
