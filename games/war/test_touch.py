#!/usr/bin/env python3
"""Battle Lines with real touches: a formation card changes the formation; tapping two of your units swaps them; BATTLE starts
it; tapping one of your units selects it and tapping an enemy unit sends it to attack; tapping a unit then the ground sends it
there. No JavaScript errors.
Run: python3 games/war/test_touch.py"""
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
    pg.evaluate("localStorage.setItem('bl.taught', '3'); __sim.go(4);"); pg.wait_for_timeout(1500)
    def btn(id): return pg.evaluate(f"__sim.ui.btn.find(b => b.id === '{id}')")
    def at(uid, y=2): return pg.evaluate(f"(() => {{ const u = __sim.G.units.find(q => q.id === {uid}); const s = __sim.scr(u.x, {y}, u.z); return [s.x, s.y]; }})()")
    c = btn('form:wall'); pg.touchscreen.tap(c['x'] + c['w'] / 2, c['y'] + c['h'] / 2); pg.wait_for_timeout(200); ok(pg.evaluate("__sim.G.form") == 'wall', 'a formation card changes the formation')
    mine = pg.evaluate("__sim.G.units.filter(u => u.side === 0).map(u => [u.id, u.x, u.z])"); a, b2 = mine[0], mine[1]
    pg.touchscreen.tap(*at(a[0])); pg.wait_for_timeout(150); pg.touchscreen.tap(*at(b2[0])); pg.wait_for_timeout(200)
    na = pg.evaluate(f"(() => {{ const u = __sim.G.units.find(q => q.id === {a[0]}); return [u.x, u.z]; }})()"); ok(abs(na[0] - b2[1]) < 0.5 and abs(na[1] - b2[2]) < 0.5, 'tapping two of your units swaps them', str([a, b2, na]))
    c = btn('battle'); pg.touchscreen.tap(c['x'] + c['w'] / 2, c['y'] + c['h'] / 2); pg.wait_for_timeout(300); ok(pg.evaluate("__sim.G.phase") == 'battle', 'BATTLE starts the battle')
    pg.wait_for_timeout(500); u0 = pg.evaluate("__sim.G.units.find(u => u.side === 0 && !u.gone).id"); e0 = pg.evaluate("__sim.G.units.find(u => u.side === 1 && !u.gone).id")
    pg.touchscreen.tap(*at(u0)); pg.wait_for_timeout(150); ok(pg.evaluate("__sim.G.sel") == u0, 'tapping your unit selects it')
    pg.touchscreen.tap(*at(e0)); pg.wait_for_timeout(200); ok(pg.evaluate(f"__sim.G.units.find(u => u.id === {u0}).tgt") == e0, 'then tapping an enemy unit sends it to attack')
    u1 = pg.evaluate("__sim.G.units.filter(u => u.side === 0 && !u.gone)[1].id"); pg.touchscreen.tap(*at(u1)); pg.wait_for_timeout(150); g = pg.evaluate("(() => { const s = __sim.scr(-20, 0, 2); return [s.x, s.y]; })()"); pg.touchscreen.tap(*g); pg.wait_for_timeout(200)
    ok(pg.evaluate(f"!!__sim.G.units.find(u => u.id === {u1}).order"), 'a unit then the ground: it marches there')
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
