#!/usr/bin/env python3
"""Short Order with real touches on a phone-sized screen: drag a patty from the tray onto a pan, tap the pan to flip it,
drag a tomato to the board and sweep back and forth to chop it, drag food onto the plate, drag the plate up to the pass.
No JavaScript errors.
Run: python3 games/cook/test_touch.py"""
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
    pg.evaluate("localStorage.setItem('sh.taught', '3'); __sim.go(4); __sim.G.lesson = null; __sim.G.tickets.length = 0; __sim.G.next = 999;"); pg.wait_for_timeout(300)
    cdp = ctx.new_cdp_session(pg)
    def touch(kind, pts): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, x, y in pts]})
    def at(js): return pg.evaluate("(() => { const s = __sim.spots(), q = " + js + ", p = __sim.scr(q.x, q.z, q.y); return [p.x, p.y]; })()")
    def drag(a, c, steps=8):
        touch('touchStart', [(1, a[0], a[1])])
        for j in range(1, steps + 1): touch('touchMove', [(1, a[0] + (c[0] - a[0]) * j / steps, a[1] + (c[1] - a[1]) * j / steps)])
        touch('touchEnd', [])
    def tap(a): touch('touchStart', [(1, a[0], a[1])]); touch('touchEnd', [])
    tray = lambda f: at("s.tray.find(t => t.food === '%s')" % f)
    pan0, board, plate = at("s.pans[0]"), at("s.board"), at("s.plate")
    drag(tray('patty'), pan0); ok(pg.evaluate("__sim.G.pans[0] && __sim.G.pans[0].food") == 'patty', 'drag a patty from the tray onto a pan')
    pg.evaluate("__sim.G.pans[0].sides[0] = 0.9"); d0 = pg.evaluate("__sim.G.pans[0].down")
    tap(pan0); ok(pg.evaluate("__sim.G.pans[0].down") != d0, 'a tap on the pan flips it')
    drag(tray('tomato'), board); ok(pg.evaluate("__sim.G.board && __sim.G.board.food") == 'tomato', 'drag a tomato onto the board')
    x, y = board; touch('touchStart', [(1, x, y)])
    for j in range(8): touch('touchMove', [(1, x + (40 if j % 2 == 0 else -40), y)])
    touch('touchEnd', [])
    ch = pg.evaluate("__sim.G.board.chops"); ok(ch >= 3, 'sweeping back and forth across the board chops it', str(ch))
    pg.evaluate("__sim.G.board.chops = 99"); drag(board, plate); ok(pg.evaluate("__sim.G.plate.map(p => p.food).join()") == 'tomato', 'drag the chopped tomato onto the plate')
    pg.evaluate("__sim.G.pans[0].sides = [0.95, 0.95]"); drag(pan0, plate); ok('patty' in pg.evaluate("__sim.G.plate.map(p => p.food).join()"), 'drag the cooked patty off the pan onto the plate')
    pg.evaluate("__sim.G.plate.length = 0; __sim.G.tickets.length = 0;"); pg.evaluate("(() => { const G = __sim.G; G.next = 0; __sim.step(0.05); G.next = 999; const tk = G.tickets[0]; G.plate = tk.dish.items.map(f => ({ food: f, q: 'perfect' })); })()")
    served = pg.evaluate("__sim.G.served"); pas = at("({ x: 0, z: -0.72, y: 1.12 })")
    drag(plate, (plate[0], max(40, pas[1] - 10)), 10); ok(pg.evaluate("__sim.G.served") == served + 1, 'drag the plate up to the pass: served', str([served, pg.evaluate("__sim.G.served")]))
    pg.wait_for_timeout(400); pg.screenshot(path='/tmp/ck_touch.png'); ok(not errs, 'no JavaScript errors', str(errs[:3]))
    b.close()
print(f'\n{oks} checks passed, {len(fails)} failed.')
sys.exit(1 if fails else 0)
