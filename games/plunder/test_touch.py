#!/usr/bin/env python3
"""Plays Plunder with real finger touches in a phone-sized browser, to check the thumbs: the wheel (and that it stays under the
thumb from one part of the sea to the next), FIRE with the second thumb, and in the boarding fight the swipe, the tap, the
pull-down dodge, a block across his blade, and the pistol button (hold, let go, hold again to reload).
Run: python3 games/plunder/test_touch.py"""
import os, sys
from playwright.sync_api import sync_playwright
here = os.path.dirname(os.path.abspath(__file__)); fails = []
def ok(c, w, d=''):
    print(('ok  ' if c else 'FAIL'), w, d)
    if not c: fails.append(w)
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=1, has_touch=True, is_mobile=True); pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + os.path.join(here, 'index.html')); pg.wait_for_timeout(400)
    pg.evaluate("localStorage.setItem('pl.mute', 'true')"); pg.reload(); pg.wait_for_timeout(400)
    cdp = ctx.new_cdp_session(pg)
    def touch(kind, pts): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': i} for (i, x, y) in pts]})
    pg.evaluate("window.gameFeedStart('mini')"); pg.wait_for_timeout(300)
    # the wheel: left thumb down and slide right
    touch('touchStart', [(0, 90, 700)]); pg.wait_for_timeout(60); touch('touchMove', [(0, 150, 700)]); pg.wait_for_timeout(500)
    r = pg.evaluate("[__sim.G.in.rud, __sim.G.me.rud, __sim.G.in.held]"); ok(r[0] > 0.9 and r[1] > 0.5 and r[2], 'sliding the left thumb right turns the wheel to starboard', str(r))
    touch('touchMove', [(0, 40, 700)]); pg.wait_for_timeout(400); r = pg.evaluate("[__sim.G.in.rud, __sim.G.me.rud]"); ok(r[0] < -0.8 and r[1] < 0, 'and left to port', str(r))
    touch('touchEnd', []); pg.wait_for_timeout(300); r = pg.evaluate("[__sim.G.in.rud, __sim.G.in.held]"); ok(r[0] == 0 and not r[1], 'lifting the thumb puts the wheel amidships', str(r))
    pg.wait_for_function("__sim.G.phase === 'sight'", timeout=8000); pg.wait_for_timeout(300)
    ok(pg.evaluate("!document.getElementById('ovSight').classList.contains('hidden')"), "the lookout's card comes up")
    pg.tap('#raidBtn'); pg.wait_for_timeout(300); ph = pg.evaluate("__sim.G.phase"); ok(ph in ('battle', 'chase'), 'RAID starts the raid', ph)
    # FIRE: right thumb, while the left one is steering (two thumbs at once)
    touch('touchStart', [(0, 90, 700)]); pg.wait_for_timeout(50); touch('touchStart', [(0, 90, 700), (1, 320, 720)]); pg.wait_for_timeout(250)
    r = pg.evaluate("[__sim.G.me.load[0] > 0 || __sim.G.me.load[1] > 0, __sim.G.in.held]"); ok(r[0] and r[1], 'the right thumb fires a broadside while the left one steers', str(r))
    touch('touchEnd', []); pg.wait_for_timeout(100)
    # boarding: swipe, tap, pull down, pistol
    pg.evaluate("__sim.board()"); pg.wait_for_function("__sim.G.fight.phase === 'fight' && __sim.G.fight.man.os === 'guard'", timeout=8000)
    pg.evaluate("(() => { const m = __sim.G.fight.man; m.next = 99; m.hp0 = m.hp = 1e6; m.oParry = 0; m.oDodge = 0; })()")
    g = pg.evaluate("__sim.geo()"); cx, cy = g['chest']['x'], g['chest']['y']
    def swipe(x0, y0, x1, y1, steps=4, hold=20):
        touch('touchStart', [(0, x0, y0)]); pg.wait_for_timeout(hold)
        for i in range(1, steps + 1): touch('touchMove', [(0, x0 + (x1 - x0) * i / steps, y0 + (y1 - y0) * i / steps)]); pg.wait_for_timeout(12)
        touch('touchEnd', []); pg.wait_for_timeout(30)
    hp = pg.evaluate("__sim.G.fight.man.hp"); swipe(cx - 70, cy - 20, cx + 70, cy + 20); pg.wait_for_timeout(150); hp2 = pg.evaluate("__sim.G.fight.man.hp"); ok(hp2 < hp, 'a swipe across him is a slice that lands', f'{hp - hp2:.1f}')
    pg.wait_for_timeout(500); touch('touchStart', [(0, cx, cy)]); pg.wait_for_timeout(40); touch('touchEnd', []); pg.wait_for_timeout(150); hp3 = pg.evaluate("__sim.G.fight.man.hp"); ok(hp3 < hp2, 'a tap on him is a stab that lands', f'{hp2 - hp3:.1f}')
    pg.wait_for_timeout(500); t0 = pg.evaluate("__sim.G.fight.tide"); swipe(195, 600, 200, 760); pg.wait_for_timeout(80); r = pg.evaluate("[!!__sim.G.fight.dodge, __sim.G.fight.tide]"); ok(r[0] and r[1] < t0, 'pulling down low on the screen is a dodge (and gives a little ground)', str(r))
    # a block: start one of his cuts and swipe across its path
    pg.wait_for_timeout(900); pg.evaluate("(() => { const m = __sim.G.fight.man; m.next = 0; })()"); pg.wait_for_function("__sim.G.fight.man.os === 'windup'", timeout=3000)
    A = pg.evaluate("(() => { const m = __sim.G.fight.man, A = m.atk; return { kind: A.kind, sx: A.sx, sy: A.sy, ex: A.ex, ey: A.ey, px: A.px, py: A.py, wind: A.wind, ot: m.ot }; })()")
    if A['kind'] == 'cut':
        u = 0.22; px = A['sx'] + (A['ex'] - A['sx']) * u; py = A['sy'] + (A['ey'] - A['sy']) * u; nx, ny = -(A['ey'] - A['sy']), (A['ex'] - A['sx']); n = (nx * nx + ny * ny) ** 0.5; nx, ny = nx / n * 55, ny / n * 55
        pg.wait_for_timeout(int(max(0, (A['wind'] - A['ot'] - 0.35)) * 1000)); swipe(px - nx, py - ny, px + nx, py + ny, steps=3, hold=10)
    else:
        pg.wait_for_timeout(int(max(0, (A['wind'] - A['ot'] - 0.35)) * 1000)); swipe(A.get('px', 195) - 50, A.get('py', 420) - 30, A.get('px', 195) + 50, A.get('py', 420) + 30, steps=3, hold=10)
    pg.wait_for_timeout(700); r = pg.evaluate("[__sim.G.fight.chain, __sim.G.took.wounds]"); ok(r[0] >= 1 and r[1] == 0, f"a swipe across his blade blocks a {A['kind']}", str(r))
    # the pistol: hold the button, let go
    pg.evaluate("(() => { const m = __sim.G.fight.man; m.next = 99; })()"); pg.wait_for_timeout(700)
    B = pg.evaluate("(() => { const k = Math.min(innerWidth, innerHeight * 0.62) / 390; return { x: innerWidth - 58 * k, y: innerHeight - 74 * k }; })()")
    touch('touchStart', [(0, B['x'], B['y'])]); pg.wait_for_timeout(200); ok(pg.evaluate("!!__sim.G.fight.aim"), 'holding the pistol button raises the pistol')
    pg.wait_for_timeout(1100); touch('touchEnd', []); pg.wait_for_timeout(200); r = pg.evaluate("[__sim.G.fight.loaded, __sim.G.shots]"); ok(not r[0] and r[1] == 2, 'letting go fires it', str(r))
    touch('touchStart', [(0, B['x'], B['y'])]); pg.wait_for_timeout(300); ok(pg.evaluate("__sim.G.fight.reloading"), 'holding the button again reloads')
    touch('touchEnd', []); pg.wait_for_timeout(100); ok(not pg.evaluate("__sim.G.fight.reloading"), 'letting go stops the reload')
    ok(not errs, 'no JavaScript errors', str(errs[:3]))
    b.close()
print(f'\n{len(fails)} failed.' if fails else '\nAll thumbs work.')
sys.exit(1 if fails else 0)
