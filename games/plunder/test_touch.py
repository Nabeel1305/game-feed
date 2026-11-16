#!/usr/bin/env python3
"""Plays Plunder with real finger touches in a phone-sized browser, to check the thumbs: the wheel (and that it stays under the
thumb from one part of the sea to the next), FIRE with the second thumb, and in the boarding fight the swipe, the tap, the
pull-down dodge, a block across his blade on its side, and the pistol button (hold, drag the sights on, let go, hold again to
reload); then, on the second expedition, that the guns need the wheel let go.
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
    pg.evaluate("localStorage.setItem('pl.mute', 'true'); localStorage.setItem('pl.taught', '3')"); pg.reload();      # (the lessons are tried in test_lessons.py)
    pg.wait_for_timeout(400)
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
    pg.evaluate("(() => { const m = __sim.G.fight.man; m.next = 99; m.hp0 = m.hp = 1e6; m.oParry = 0; m.oDodge = 0; m.shot = 0; m.heavy = 0; m.feint = 0; m.combo = 0; })()")
    g = pg.evaluate("__sim.geo()"); cx, cy = g['chest']['x'], g['chest']['y']
    def swipe(x0, y0, x1, y1, steps=4, hold=20):
        touch('touchStart', [(0, x0, y0)]); pg.wait_for_timeout(hold)
        for i in range(1, steps + 1): touch('touchMove', [(0, x0 + (x1 - x0) * i / steps, y0 + (y1 - y0) * i / steps)]); pg.wait_for_timeout(12)
        touch('touchEnd', []); pg.wait_for_timeout(30)
    # attack first: swipes on his sword knock his footing, and two or three break his guard; then a swipe lands
    hp0 = pg.evaluate("__sim.G.fight.man.hp"); broke = False
    for _ in range(5):
        pg.evaluate("(() => { const m = __sim.G.fight.man; m.next = 99; m.cnt = false; })()"); swipe(cx - 70, cy - 20, cx + 70, cy + 20); pg.wait_for_timeout(450)
        pg.evaluate("__sim.G.fight.man.cnt = false")
        if pg.evaluate("__sim.G.fight.man.os === 'stagger' && __sim.G.fight.man.broke"): broke = True; break
    ok(broke and pg.evaluate("__sim.G.fight.man.hp") == hp0, 'swipes at a man on guard hit his sword, and break his guard', '')
    swipe(cx - 70, cy - 20, cx + 70, cy + 20); pg.wait_for_timeout(80); ok(pg.evaluate("__sim.G.fight.man.hp") < hp0, 'then a swipe lands')
    # once he is set again, a swipe is turned and he cuts you
    pg.wait_for_function("__sim.G.fight.man.os === 'guard'", timeout=5000); pg.evaluate("(() => { const m = __sim.G.fight.man; m.next = 99; m.set = 9; })()"); pg.wait_for_timeout(500)
    r0 = pg.evaluate("[__sim.G.fight.tide, __sim.G.took.wounds]"); swipe(cx - 70, cy - 20, cx + 70, cy + 20); pg.wait_for_timeout(500)
    r = pg.evaluate("[__sim.G.fight.tide, __sim.G.took.wounds]"); ok(r[0] < r0[0] and r[1] == r0[1] + 1, 'once he is set, a swipe is turned and he cuts you', str([r0, r]))
    pg.evaluate("__sim.G.fight.man.set = 0")
    pg.evaluate("__sim.G.fight.tide = 0.5"); pg.wait_for_timeout(500)
    # wait for his blow, block it with a real swipe across his blade on the side it comes from: the clash is at once, and he is open
    def his_blow():
        pg.wait_for_function("__sim.G.fight.man.os === 'guard'", timeout=5000); pg.evaluate("__sim.G.fight.man.next = 0"); pg.wait_for_function("__sim.G.fight.man.os === 'windup'", timeout=3000)
        while pg.evaluate("__sim.G.fight.man.atk.kind") != 'cut':
            pg.evaluate("(() => { const m = __sim.G.fight.man; m.os = 'guard'; m.next = 0; })()"); pg.wait_for_timeout(60); pg.wait_for_function("__sim.G.fight.man.os === 'windup'", timeout=3000)
        pg.wait_for_timeout(420)
        return pg.evaluate("(() => { const m = __sim.G.fight.man, A = m.atk, C = __sim.you(); return { sx: A.sx, sy: A.sy, ex: A.ex, ey: A.ey, cx: C.x }; })()")
    def across(A, mirror=False):
        u = 0.22; px = A['sx'] + (A['ex'] - A['sx']) * u; py = A['sy'] + (A['ey'] - A['sy']) * u; nx, ny = -(A['ey'] - A['sy']), (A['ex'] - A['sx']); n = (nx * nx + ny * ny) ** 0.5; nx, ny = nx / n * 55, ny / n * 55
        if mirror: px = 2 * A['cx'] - px; nx = -nx
        swipe(px - nx, py - ny, px + nx, py + ny, steps=3, hold=10)
    A = his_blow(); across(A); pg.wait_for_timeout(60)
    r = pg.evaluate("(() => { const F = __sim.G.fight, m = F.man; return [F.chain, m.os === 'stagger' || (m.os === 'recover' && m.open), m.os]; })()"); ok(r[0] >= 1 and r[1], 'a swipe across his blade, on its side, blocks it there and then, and he is open', str(r))
    hp = pg.evaluate("__sim.G.fight.man.hp"); g = pg.evaluate("__sim.geo()"); touch('touchStart', [(0, g['chest']['x'], g['chest']['y'])]); pg.wait_for_timeout(40); touch('touchEnd', []); pg.wait_for_timeout(120)
    hp2 = pg.evaluate("__sim.G.fight.man.hp"); ok(hp2 < hp, 'a tap on an open man is a stab that lands', f'{hp - hp2:.1f}')
    # the same swipe on the wrong side is no block; a pull down low on the screen dodges his blow all the same
    w0 = pg.evaluate("__sim.G.took.wounds"); A = his_blow(); across(A, mirror=True); pg.wait_for_timeout(60)
    r = pg.evaluate("(() => { const m = __sim.G.fight.man; return [m.os, m.atk.tried, m.os === 'recover' && m.open]; })()"); ok(r[0] == 'windup' and r[1] and not r[2], 'the same swipe on the other side of him is no block', str(r))
    pg.wait_for_function("(() => { const m = __sim.G.fight.man; return m.os !== 'windup' || m.atk.wind - m.ot < 0.25; })()", timeout=4000)
    t0 = pg.evaluate("__sim.G.fight.tide"); swipe(195, 600, 200, 760); pg.wait_for_timeout(500)
    r = pg.evaluate("[__sim.G.took.wounds, __sim.G.fight.tide, __sim.G.fight.man.os, !!__sim.G.fight.man.open]"); ok(r[0] == w0 and r[1] < t0, 'pulling down low on the screen dodges it (and gives a little ground)', str([w0, t0, r])); ok(not r[3], 'a dodge saves you; it does not open him', str(r))
    # the pistol: hold the button (the sights come up off him), drag them on to his chest, let go
    pg.wait_for_function("__sim.G.fight.man.os === 'guard'", timeout=4000); pg.evaluate("(() => { const m = __sim.G.fight.man; m.next = 99; })()"); pg.wait_for_timeout(300)
    B = pg.evaluate("(() => { const k = Math.min(innerWidth, innerHeight * 0.62) / 390; return { x: innerWidth - 58 * k, y: innerHeight - 74 * k }; })()")
    touch('touchStart', [(0, B['x'], B['y'])]); pg.wait_for_timeout(200); ok(pg.evaluate("!!__sim.G.fight.aim"), 'holding the pistol button raises the pistol')
    pg.wait_for_timeout(900)
    d = pg.evaluate("(() => { const p = __sim.aimAt(), g = __sim.geo(); return [Math.hypot(p.x - g.chest.x, p.y - g.chest.y), g.chest.r, (g.chest.x - p.x) / 1.3, (g.chest.y - p.y) / 1.3]; })()"); ok(d[0] > d[1], 'the sights come up off him', str(d[:2]))
    for i in range(1, 5): touch('touchMove', [(0, B['x'] + d[2] * i / 4, B['y'] + d[3] * i / 4)]); pg.wait_for_timeout(30)
    pg.wait_for_timeout(150); d2 = pg.evaluate("(() => { const p = __sim.aimAt(), g = __sim.geo(); return [Math.hypot(p.x - g.chest.x, p.y - g.chest.y), g.chest.r]; })()"); ok(d2[0] < d2[1] * 0.7, 'dragging the thumb brings them on to him', str(d2))
    hp = pg.evaluate("__sim.G.fight.man.hp"); touch('touchEnd', []); pg.wait_for_timeout(200); r = pg.evaluate("[__sim.G.fight.loaded, __sim.G.shots, __sim.G.fight.man.hp]"); ok(not r[0] and r[1] == 2 and r[2] < hp, 'letting go fires it, and it hits', str(r))
    touch('touchStart', [(0, B['x'], B['y'])]); pg.wait_for_timeout(300); ok(pg.evaluate("__sim.G.fight.reloading"), 'holding the button again reloads')
    touch('touchEnd', []); pg.wait_for_timeout(100); ok(not pg.evaluate("__sim.G.fight.reloading"), 'letting go stops the reload')
    # the sea, on the second expedition (a navy cutter): the guns need the wheel let go. A ship on the beam with the wheel held over ->
    # FIRE stays dark; lift the thumb -> a moment later it lights; tap it -> she is hit
    pg.evaluate("__sim.go(2, true)"); pg.wait_for_function("__sim.G.phase === 'sight'", timeout=9000); pg.wait_for_timeout(300); pg.tap('#raidBtn'); pg.wait_for_timeout(600)
    ok(pg.evaluate("__sim.G.phase") == 'battle', 'the second expedition is a battle')
    place = """(() => { const s = __sim, G = s.G, me = G.me, t = G.foes.find(f => f.K.navy && f.alive); t.x = me.x + s.rgtX(me) * 80; t.y = me.y + s.rgtY(me) * 80; t.hdg = me.hdg; t.v = 0; t.think = 99; t.eng = false; t.load = [9, 9]; me.load = [0, 0]; G.waste = 0; return t.hull; })()"""
    touch('touchStart', [(0, 90, 700)]); pg.wait_for_timeout(40); touch('touchMove', [(0, 140, 700)]); pg.wait_for_timeout(400); pg.evaluate(place); pg.wait_for_timeout(120)
    r = pg.evaluate("[__sim.G.lit[0] || __sim.G.lit[1], __sim.G.me.rud]"); ok(r[0], 'with a ship on the beam FIRE lights, thumb still on the wheel', str(r))
    h0 = pg.evaluate(place); touch('touchStart', [(0, 140, 700), (1, 320, 760)]); pg.wait_for_timeout(60); touch('touchEnd', [])
    for _ in range(10): pg.evaluate("(() => { const t = __sim.G.foes.find(f => f.K.navy); t.v = 0; t.think = 99; })()"); pg.wait_for_timeout(80)
    h1 = pg.evaluate("__sim.G.foes.find(f => f.K.navy).hull"); ok(h1 < h0, 'the captain fires from the wheel, and the broadside tells', f'{h0:.0f} -> {h1:.0f}')
    # ROW: hold the button above FIRE and she speeds up; the crew tire
    k = pg.evaluate("Math.min(innerWidth, innerHeight * 0.62) / 390"); ox, oy = pg.evaluate("innerWidth") - 70 * k, pg.evaluate("innerHeight") - 196 * k
    v0 = pg.evaluate("__sim.G.me.v"); touch('touchStart', [(2, ox, oy)]); pg.wait_for_timeout(1500)
    r = pg.evaluate("[__sim.G.rowing, __sim.G.me.v, __sim.G.stam]"); touch('touchEnd', []); ok(r[0] and r[1] > v0 + 3 and r[2] < 0.8, 'holding ROW speeds her up and tires the crew', str([v0, r]))
    # ...and FIRE tapped with nothing in front of the guns throws the side away: both batteries are out, for three reloads
    pg.evaluate("(() => { const s = __sim, G = s.G, me = G.me, t = G.foes.find(f => f.K.navy); t.x = me.x + s.fwdX(me) * 400; t.y = me.y + s.fwdY(me) * 400; t.v = 0; t.think = 99; me.load = [0, 0]; G.waste = 0; })()")
    touch('touchStart', [(1, 320, 720)]); pg.wait_for_timeout(60); touch('touchEnd', []); pg.wait_for_timeout(120)
    r = pg.evaluate("[__sim.G.me.load[0] / __sim.G.cfg.myReload, __sim.G.me.load[1] / __sim.G.cfg.myReload]"); ok(min(r) > 2.5, 'FIRE tapped with nothing in the arc throws the side away: both batteries are out for three reloads', str(r))
    ok(not errs, 'no JavaScript errors', str(errs[:3]))
    b.close()
print(f'\n{len(fails)} failed.' if fails else '\nAll thumbs work.')
sys.exit(1 if fails else 0)
