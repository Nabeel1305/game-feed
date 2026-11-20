#!/usr/bin/env python3
"""Sharpshooter with real thumbs: a drag moves the sight the way the thumb goes (right is right, up is up); holding the FIRE
pad raises the scope (and narrows the view) and letting go fires one dart; a drag while holding FIRE still aims (two
thumbs at once); a dart aimed on the thief puts him to sleep and wins; a dart in a passer-by fails the job; a miss makes
the crowd run; holding breath too long runs out of breath; while paused nothing aims; the scope you pick is yours.
Run: python3 games/sniper/test_touch.py"""
import os, sys
from playwright.sync_api import sync_playwright
here = os.path.dirname(os.path.abspath(__file__)); fails = []; oks = 0
def ok(c, what, d=''):
    global oks
    if c: oks += 1; print('  ok  ', what)
    else: fails.append(what); print('  FAIL', what, d)
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 390, 'height': 844}, has_touch=True); pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + os.path.join(here, 'index.html')); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(800)
    E = pg.evaluate
    def drag(dx, dy, x0=120, y0=500):
        pg.mouse.move(x0, y0); pg.mouse.down()
        for i in range(1, 9): pg.mouse.move(x0 + dx * i / 8, y0 + dy * i / 8); pg.wait_for_timeout(16)
        pg.mouse.up(); pg.wait_for_timeout(100)
    # two pointers at once: the page's own pointer events (a touch on the pad and a touch that drags)
    def ptr(kind, id, x, y): E(f"document.getElementById('cv').dispatchEvent(new PointerEvent('{kind}', {{ pointerId: {id}, clientX: {x}, clientY: {y}, bubbles: true, pointerType: 'touch' }}))")
    E("localStorage.setItem('sx.taught', '3'); __sim.go(1)"); pg.wait_for_timeout(300)
    y0, p0 = E("[__sim.G.yaw, __sim.G.pitch]"); drag(100, 0); y1, p1 = E("[__sim.G.yaw, __sim.G.pitch]"); ok(y1 > y0 + 0.05 and abs(p1 - p0) < 0.01, 'dragging right moves the sight right', str([y0, y1]))
    drag(0, 100); p2 = E("__sim.G.pitch"); ok(p2 < p1 - 0.05, 'dragging down moves the sight down', str([p1, p2]))
    P = E("[__sim.padAt().x, __sim.padAt().y]"); d0 = E("__sim.G.dartsLeft")
    ptr('pointerdown', 7, P[0], P[1]); pg.wait_for_timeout(500); ok(E("__sim.G.hold > 0 && __sim.G.scoped > 0.9"), 'holding FIRE raises the scope', str(E("[__sim.G.hold, __sim.G.scoped]")))
    f0 = E("__sim.W3.cam.fov"); ok(f0 < 20, 'the view narrows through the scope', str(f0))
    ya = E("__sim.G.yaw"); ptr('pointerdown', 8, 120, 500); ptr('pointermove', 8, 160, 500); ptr('pointerup', 8, 160, 500); ok(E("__sim.G.yaw") > ya, 'the other thumb still aims while FIRE is held (two thumbs)', str([ya, E("__sim.G.yaw")]))
    ptr('pointerup', 7, P[0], P[1]); pg.wait_for_timeout(50); ok(E("__sim.G.dartsLeft") == d0 - 1 and E("__sim.G.fired") == 1, 'letting go fires one dart')
    # on the thief: asleep, won
    E("__sim.go(1)"); pg.wait_for_timeout(200); E("(() => { const G = __sim.G; G.ppl.forEach(p => { if (!p.thief) { p.x = 30; p.still = true; } }); G.thief.still = true; const t = G.thief, a = __sim.aimAt(t.x, 1.1, t.z); G.yaw = a[0]; G.pitch = a[1]; G.wind = 0; })()")
    ptr('pointerdown', 9, P[0], P[1]); pg.wait_for_timeout(400); E("(() => { const G = __sim.G, t = G.thief, a = __sim.aimAt(t.x, 1.1, t.z); G.yaw = a[0]; G.pitch = a[1]; G.breath = 99; G.t = 0; G.cfg.sway = 0; })()"); ptr('pointerup', 9, P[0], P[1])
    pg.wait_for_timeout(2500); ok(E("__sim.G.over") == 'won', 'a dart on the thief puts him to sleep: the job is done', str(E("__sim.G.over")))
    # a passer-by: failed
    E("__sim.go(1)"); pg.wait_for_timeout(200); E("(() => { const G = __sim.G; G.cfg.sway = 0; G.wind = 0; G.ppl.forEach(p => { p.still = true; }); G.thief.x = 30; const q = G.ppl.find(p => !p.thief); const a = __sim.aimAt(q.x, 1.1, q.z); G.yaw = a[0]; G.pitch = a[1]; })()")
    E("__sim.hold(); __sim.fire()"); pg.wait_for_timeout(2000); ok(E("__sim.G.over") == 'lost', 'a dart in a passer-by fails the job', str(E("__sim.G.over")))
    # a miss: the crowd runs
    E("__sim.go(1)"); pg.wait_for_timeout(200); E("(() => { const G = __sim.G; G.cfg.sway = 0; G.wind = 0; G.yaw = 0.7; G.pitch = -0.9; })()"); E("__sim.hold(); __sim.fire()"); pg.wait_for_timeout(1200)
    ok(E("__sim.G.flee") and E("__sim.G.missed") == 1 and E("__sim.G.left") <= 6, 'a miss makes the crowd scatter and the thief run', str(E("[__sim.G.flee, __sim.G.missed]")))
    # breath
    E("__sim.go(1)"); pg.wait_for_timeout(200); ptr('pointerdown', 10, P[0], P[1]); pg.wait_for_timeout(int(E("__sim.G.cfg.breath") * 1000) + 600); ok(E("__sim.G.gasp") > 0, 'holding too long runs out of breath (the sight shakes)'); ptr('pointercancel', 10, P[0], P[1])
    # paused
    E("__sim.go(1)"); pg.wait_for_timeout(200); E("document.getElementById('pauseBtn').click()"); pg.wait_for_timeout(200); a = E("__sim.G.yaw"); drag(100, 0); ok(abs(E("__sim.G.yaw") - a) < 1e-9, 'while paused, a drag does nothing')
    # scopes
    E("localStorage.setItem('sx.stars', JSON.stringify({1: 3, 2: 3})); __sim.showAqua()"); pg.wait_for_timeout(200)
    ok(E("document.querySelectorAll('#aqGrid .aq').length") == E("__sim.SCOPES.length"), 'Your scopes lists every scope')
    E("document.querySelectorAll('#aqGrid .aq')[1].click()"); ok(E("__sim.myScope().id") == E("__sim.SCOPES[1].id"), 'tapping an open one picks it, and it is the one you play with')
    E("localStorage.setItem('sx.stars', '{}'); __sim.showAqua(); document.querySelectorAll('#aqGrid .aq')[3].click()"); ok(E("__sim.store.get('scope')") == E("__sim.SCOPES[1].id"), 'a locked one cannot be picked')
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
