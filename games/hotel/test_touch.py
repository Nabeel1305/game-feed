#!/usr/bin/env python3
"""Grand Hotel with real touches (the controls of 25 Nov 2026: you send the attendant yourself): a tap on the kitchen lines it up as
a stop and he walks there and takes a plate; a tap on the room that rang serves it and a tip comes in; a tap on a stop in the bar
cancels it; a fourth stop does not fit; a knock on the wrong door costs rating; no JavaScript errors.
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
    # a quiet hotel, one room ringing for food
    pg.evaluate("(() => { const G = __sim.G; G.sched = []; G.clock = 90; G.reqs = []; G.route = []; G.me.carry = []; G.me.x = 0.98; G.me.f = 0; G.cfg.sp0 = G.cfg.sp; G.cfg.sp = 0.02; G.rooms.forEach(r => { r.state = 'occ'; }); const r = G.rooms[1]; G.reqs.push({ id: 900, k: 'food', room: r.id, f: r.f, x: r.x, pat: 99, max: 99, t: 0 }); })()")
    def at(f, x): return pg.evaluate(f"(() => {{ const L = __sim.lay(); return [L.sx({x}), L.fy({f}) - L.fh * 0.4]; }})()")
    def tap(f, x): px, py = at(f, x); pg.touchscreen.tap(px, py); pg.wait_for_timeout(200)
    room = pg.evaluate("(() => { const r = __sim.G.rooms[1]; return [r.f, r.x]; })()"); other = pg.evaluate("(() => { const r = __sim.G.rooms[2]; return [r.f, r.x]; })()")
    tap(0, 0.55); ok(pg.evaluate("__sim.G.route.length === 1 && __sim.G.route[0].place === 'kitchen'"), 'a tap on the kitchen lines it up as a stop', str(pg.evaluate("__sim.G.route")))
    tap(*room); tap(*other); ok(pg.evaluate("__sim.G.route.length") == 3, 'three stops line up')
    tap(0, 0.8); ok(pg.evaluate("__sim.G.route.length") == 3, 'a fourth stop does not fit')
    c = pg.evaluate("__sim.lay().chips[2]"); pg.touchscreen.tap(c['x'] + c['w'] / 2, c['y'] + c['h'] / 2); pg.wait_for_timeout(200)
    ok(pg.evaluate("__sim.G.route.length") == 2, 'a tap on a stop in the bar cancels it')
    pg.evaluate("__sim.G.cfg.sp = __sim.G.cfg.sp0")
    tips0 = pg.evaluate("__sim.G.tips"); pg.wait_for_timeout(9000)
    ok(pg.evaluate("__sim.G.tips") > tips0 and pg.evaluate("__sim.G.wrongs") == 0, 'he fetches the plate, takes it up and a tip comes in', str(pg.evaluate("[__sim.G.tips, __sim.G.route, __sim.G.me.carry]")))
    r0 = pg.evaluate("__sim.G.rating"); tap(*other); pg.wait_for_timeout(4000)
    ok(pg.evaluate("__sim.G.rating") < r0 and pg.evaluate("__sim.G.wrongs") == 1, 'a knock on a door that asked for nothing costs rating', str(pg.evaluate("[__sim.G.rating, __sim.G.wrongs]")))
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
