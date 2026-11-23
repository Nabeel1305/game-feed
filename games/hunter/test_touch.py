#!/usr/bin/env python3
"""Hunter with real touches and real drawing (controls rebuilt 22 Nov 2026): the left thumb is a stick: a gentle push creeps, a
full push runs (and the animal hears it), letting go freezes; the right thumb drags the crosshair while the left creeps; a tap
on THROW throws where the crosshair is; with a lion growling, a tap on its side faces it (a tap on the other side corrects a
wrong turn) and a tap as it leaps braces; a deer runs when you creep too close; a boar charges, the stick pushed sideways at the
last moment dodges it, and standing still gets you run down. No swipes. No JavaScript errors. Run: python3 games/hunter/test_touch.py"""
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
    pg.evaluate("localStorage.setItem('hu.taught', '3'); __sim.go(4); __sim.G.lesson = null; __sim.G.cfg.lion = 0; __sim.G.a.next = 99;"); pg.wait_for_timeout(300)
    cdp = ctx.new_cdp_session(pg)
    def touch(kind, pts): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, x, y in pts]})
    E = pg.evaluate
    touch('touchStart', [(1, 90, 650)]); touch('touchMove', [(1, 90, 630)]); pg.wait_for_timeout(250); c1 = E("[__sim.G.me.creep, __sim.G.me.run]"); z0 = E("__sim.G.me.z")
    ok(c1 == [True, False], 'a gentle push up on the left stick creeps', str(c1)); pg.wait_for_timeout(300); ok(E("Math.hypot(__sim.G.me.x, __sim.G.me.z)") > 0.2, 'and you move towards the animal')
    touch('touchMove', [(1, 90, 580)]); pg.wait_for_timeout(200); ok(E("[__sim.G.me.creep, __sim.G.me.run]") == [True, True], 'a full push runs'); al = E("__sim.G.a.alert"); pg.wait_for_timeout(500); ok(E("__sim.G.a.alert") > al, 'the animal hears running')
    touch('touchMove', [(1, 90, 630)]); E("__sim.G.a.alert = 0")
    # the right thumb drags the crosshair while the left creeps
    c0 = E("__sim.ui.ch"); touch('touchStart', [(1, 90, 630), (2, 300, 420)])
    for j in range(1, 5): touch('touchMove', [(1, 90, 630), (2, 300 + 10 * j, 420 + 6 * j)])
    ch = E("__sim.ui.ch"); ok(ch and ch['x'] > 25 and ch['y'] > 12, 'the right thumb drags the crosshair (while the left creeps)', str(ch)); ok(E("__sim.G.spears.length") == 0, 'dragging does not throw')
    touch('touchEnd', [(1, 90, 630)]); pg.wait_for_timeout(60); ok(E("__sim.G.spears.length") == 0, 'lifting the aiming thumb does not throw either')
    touch('touchEnd', []); pg.wait_for_timeout(60); ok(not E("__sim.G.me.creep"), 'stick let go: frozen')
    E("(() => { const G = __sim.G, a = G.a, d = Math.hypot(a.x - G.me.x, a.z - G.me.z); G.me.x = a.x - (a.x - G.me.x) / d * 10; G.me.z = a.z - (a.z - G.me.z) / d * 10; __sim.ui.snap = true; __sim.ui.ch = { x: 0, y: 0 }; })()"); pg.wait_for_timeout(250); L = E("__sim.layout()"); F = L['fire']; touch('touchStart', [(3, F['x'], F['y'])]); touch('touchEnd', []); pg.wait_for_timeout(60)
    sp = E("__sim.G.spears.length"); ok(sp == 1, 'a tap on THROW throws the spear', str(sp)); s = E("(() => { const s = __sim.G.spears[0], a = __sim.G.a; return Math.hypot(s.tx - a.x, s.tz - a.z); })()"); ok(s < 3, 'at the animal, where the crosshair was', str(s))
    E("(() => { const G = __sim.G; G.spears.forEach(s => s.done = true); G.over = null; G.lives = 3; G.a.st = 'graze'; G.a.next = 99; G.lion = { side: 1, st: 'stalk', t: 0, leapAt: 99 }; G.me.face = 0; })()")
    touch('touchStart', [(1, 90, 600)]); touch('touchEnd', []); ok(E("__sim.G.me.face") == -1, 'a tap on the left faces left (the wrong way here)')
    touch('touchStart', [(1, 300, 600)]); touch('touchEnd', []); ok(E("__sim.G.me.face") == 1, 'a tap on the right corrects it: facing the growl')
    E("__sim.G.lion.st = 'leap'; __sim.G.lion.t = 0;"); touch('touchStart', [(1, 200, 600)]); touch('touchEnd', [])
    ok(E("__sim.G.lionsKilled") == 1, 'a tap as it leaps braces the spear: lion held off')
    # his review, 23 Nov 2026: "the animal just waits for me to kill it it should run away or even attack if I run or come too close"
    def place(d, kind=None): E("(() => { const G = __sim.G, a = G.a; G.lion = null; G.spears.forEach(s => s.done = true); G.over = null; G.lives = 3; a.st = 'graze'; a.t = 0; a.next = 99; a.alert = 0; a.winded = 0; a.locked = false; a.hp = 1; G.me.x = 0; G.me.z = 0; a.x = 0; a.z = %s; a.face = 1.57; %s __sim.ui.snap = true; })()" % (d, ("a.kind = Object.assign({}, a.kind, %s);" % kind) if kind else ''))
    place(6, "{ id: 'deer', temper: 0, shy: 7.5 }"); pg.wait_for_timeout(120); touch('touchStart', [(1, 90, 650)]); touch('touchMove', [(1, 90, 630)]); pg.wait_for_timeout(1500); touch('touchEnd', [])
    r = E("[__sim.G.a.st, __sim.G.escapes]"); ok(r[0] == 'flee' or r[1] >= 1, 'creeping inside the distance a deer allows: it runs away', str(r))
    place(13, "{ id: 'boar', temper: 1, shy: 6.5, body: 0.8, speed: 8 }"); E("__sim.G.cfg.threat = 0.8; __sim.throwAt(__sim.G.a.x + 3, __sim.G.a.z)"); pg.wait_for_timeout(900)
    r = E("__sim.G.a.st"); ok(r in ('threat', 'charge'), 'a spear that misses a boar: it turns on you', str(r)); n0 = E("__sim.G.spears.length"); L2 = E("__sim.layout().fire")
    touch('touchStart', [(2, L2['x'], L2['y'])]); touch('touchEnd', []); ok(E("__sim.G.spears.length") == n0, 'no throwing at a charge: THROW does nothing', '')
    for i in range(80):
        pg.wait_for_timeout(30)
        if E("__sim.G.a.locked && __sim.G.a.st === 'charge'"): break
    pg.screenshot(path='/tmp/hu_dive.png'); touch('touchStart', [(1, 90, 650)]); touch('touchMove', [(1, 30, 650)]); pg.wait_for_timeout(1200); r = E("[__sim.G.a.st, __sim.G.lives, __sim.G.maulings]")
    ok(r[0] in ('pass', 'graze') and r[1] == 3 and r[2] == 0, 'the stick pushed hard to one side after DIVE ASIDE shows: it runs past, no harm done', str(r)); touch('touchEnd', [])
    pg.wait_for_timeout(1500); r = E("[__sim.G.a.st, __sim.G.a.winded > 0, Math.hypot(__sim.G.a.x - __sim.G.me.x, __sim.G.a.z - __sim.G.me.z)]"); ok(r[0] == 'graze' and r[1] and r[2] < 9, 'and it stands winded close by', str(r)); pg.screenshot(path='/tmp/hu_winded.png')
    place(13, "{ id: 'boar', temper: 1, shy: 6.5, body: 0.8, speed: 8 }"); E("__sim.G.cfg.threat = 0.6; __sim.throwAt(__sim.G.a.x + 3, __sim.G.a.z)"); pg.wait_for_timeout(3600)
    r = E("[__sim.G.lives, __sim.G.maulings]"); ok(r == [2, 1], 'standing still in front of a charge: it runs you down, one chance gone', str(r))
    pg.wait_for_timeout(500); pg.screenshot(path='/tmp/hu_touch.png'); ok(not errs, 'no JavaScript errors', str(errs[:3]))
    b.close()
print(f'\n{oks} checks passed, {len(fails)} failed.')
sys.exit(1 if fails else 0)
