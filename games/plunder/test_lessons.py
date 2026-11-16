#!/usr/bin/env python3
"""The lessons of the first three boardings (his rule, 16 Nov 2026: teach every move in the first three expeditions, and do not
let a player go on until he can counter each one two or three times).

Checks: the lessons come on expeditions 1, 2 and 3 and not after; a mistake in a lesson costs nothing; nobody loses while a lesson
is on; a real swipe across the gold line passes the first lesson; an ordinary and a clumsy robot both get through every lesson;
passed lessons are remembered, so a retry goes straight to the fight. Saves a picture of the lesson panel to /tmp/lesson.png.

Run: python3 games/plunder/test_lessons.py"""
import os, sys
from playwright.sync_api import sync_playwright

here = os.path.dirname(os.path.abspath(__file__)); fails, oks = [], 0
def ok(c, what, d=''):
    global oks
    if c: oks += 1
    else: fails.append(what); print('  FAIL', what, d)

with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, has_touch=True, is_mobile=True); pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + os.path.join(here, 'index.html')); pg.wait_for_timeout(400); pg.evaluate("localStorage.clear(); localStorage.setItem('pl.mute', 'true')"); pg.reload(); pg.wait_for_timeout(500)
    pg.add_script_tag(path=os.path.join(here, 'bots.js'))
    r = pg.evaluate("""() => { const S = __sim, o = {};
      for (const N of [1, 2, 3, 4, 7]) { S.start(N, { seed: 5, teach: true }); S.board(); o[N] = !!S.G.fight.drill; }
      S.start(1, { seed: 5, teach: true, taught: 1 }); S.board(); o.passed = !!S.G.fight.drill;
      // nobody loses while a lesson is on: two minutes of doing nothing, then two minutes of blind swiping
      S.start(1, { seed: 3, teach: true }); S.board(); let G = S.G; for (let i = 0; i < 60 * 120; i++) S.step(1 / 60);
      o.idle = [G.over, +G.fight.tide.toFixed(2), G.took.wounds];
      S.start(2, { seed: 3, teach: true }); S.board(); G = S.G; for (let i = 0; i < 60 * 120; i++) { if (i % 15 === 0) { const g = S.geo(); S.stroke(g.chest.x - 70, g.chest.y, g.chest.x + 70, g.chest.y + 10); } S.step(1 / 60); }
      o.blind = [G.over, +G.fight.tide.toFixed(2)];
      return o; }""")
    ok(r['1'] and r['2'] and r['3'] and not r['4'] and not r['7'], 'the lessons come in the first three boardings, and not after', str(r))
    ok(not r['passed'], 'a lesson already passed is not given again')
    ok(r['idle'][0] is None and r['idle'][1] == 0.5 and r['idle'][2] == 0, 'standing still in a lesson, nothing is lost', str(r['idle']))
    ok(r['blind'][0] is None and r['blind'][1] == 0.5, 'swiping blindly in a lesson, nothing is lost (and nothing is passed)', str(r['blind']))
    for N in (1, 2, 3):
        for name, o in (('an ordinary player', {}), ('a clumsy player', {'react': 0.5, 'acc': 0.65, 'timing': 'any'})):
            rs = pg.evaluate("([N, o]) => { const out = []; for (let s = 0; s < 6; s++) out.push(__B.runLessons(N, 200 + s, o)); return out; }", [N, o])
            done = sum(1 for x in rs if x['left'] == -1); longest = max(sum(x['took']) for x in rs)
            print(f'  expedition {N}, {name}: through every lesson {done}/6, longest {longest:.0f} s, then took the ship {sum(1 for x in rs if x["won"])}/6')
            ok(done == 6, f'{name} gets through every lesson of expedition {N}', str(rs))
            ok(longest < (200 if N == 1 else 150), f'the lessons of expedition {N} do not drag on for {name}', f'{longest:.0f} s')
    # the real thing, with a real thumb: the game as he starts it (lessons on), the first lesson passed with swipes
    pg.close(); pg = ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))      # (a fresh page: the robots above ran the game headless)
    pg.goto('file://' + os.path.join(here, 'index.html')); pg.wait_for_timeout(400); pg.evaluate("localStorage.clear(); localStorage.setItem('pl.mute', 'true')"); pg.reload(); pg.wait_for_timeout(500)
    cdp = ctx.new_cdp_session(pg)
    def touch(kind, pts): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': i} for (i, x, y) in pts]})
    pg.evaluate("window.gameFeedStart('mini')"); pg.wait_for_timeout(300); pg.evaluate("__sim.board()")
    pg.wait_for_function("__sim.G.fight.phase === 'fight' && __sim.G.fight.drill && __sim.G.fight.man.os === 'guard'", timeout=8000); pg.wait_for_timeout(300)
    pg.screenshot(path='/tmp/lesson.png')
    t0 = pg.evaluate("__sim.G.fight.tide"); passed = 0
    for _ in range(6):
        pg.evaluate("__sim.G.fight.man.next = 0"); pg.wait_for_function("__sim.G.fight.man.os === 'windup'", timeout=5000); pg.wait_for_timeout(600)
        A = pg.evaluate("(() => { const A = __sim.G.fight.man.atk; return { sx: A.sx, sy: A.sy, ex: A.ex, ey: A.ey }; })()")
        u = 0.22; px = A['sx'] + (A['ex'] - A['sx']) * u; py = A['sy'] + (A['ey'] - A['sy']) * u; nx, ny = -(A['ey'] - A['sy']), (A['ex'] - A['sx']); n = (nx * nx + ny * ny) ** 0.5; nx, ny = nx / n * 55, ny / n * 55
        touch('touchStart', [(0, px - nx, py - ny)]); pg.wait_for_timeout(10)
        for i in range(1, 4): touch('touchMove', [(0, px - nx + 2 * nx * i / 3, py - ny + 2 * ny * i / 3)]); pg.wait_for_timeout(12)
        touch('touchEnd', []); pg.wait_for_timeout(1500)
        if pg.evaluate("!__sim.G.fight.drill || __sim.G.fight.drill.i >= 2"): break
    r = pg.evaluate("[__sim.G.fight.drill && __sim.G.fight.drill.i, __sim.G.fight.tide]")
    ok(r[0] == 2, 'real swipes across the gold line pass the two "block his swing" lessons', str(r))
    ok(abs(r[1] - t0) < 1e-6, 'and the tide does not move during lessons', str([t0, r[1]]))
    ok(not errs, 'no JavaScript errors', str(errs[:3]))
    b.close()
print(f'\n{oks} checks passed, {len(fails)} failed.'); sys.exit(1 if fails else 0)
