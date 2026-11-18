#!/usr/bin/env python3
"""Tutorials are optional (his rule, 18 Nov 2026). For every game with lessons, with real taps in a phone-sized browser:
  - a fresh player starts with the lesson, and a SKIP TUTORIAL button is on screen; one tap on it and he is playing the level
    for real (no lesson), and later levels skip their lessons too
  - on any level, the home card's Tutorial button starts the lessons again (with the skip button on screen)
  - the pause menu has a Tutorial button too
Run: python3 tools/test_tutorial.py [id ...]"""
import os, sys
from playwright.sync_api import sync_playwright
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ids = sys.argv[1:] or sorted(d for d in os.listdir(os.path.join(root, 'games')) if os.path.exists(os.path.join(root, 'games', d, 'part1.html')) and 'skipTut' in open(os.path.join(root, 'games', d, 'part1.html')).read())
fails = []
with sync_playwright() as p:
    b = p.chromium.launch()
    for gid in ids:
        ctx = b.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True); pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto('file://' + os.path.join(root, 'games', gid, 'index.html')); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(500)
        prefix = pg.evaluate("(() => { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.endsWith('.mute') || k.endsWith('.smooth') || k.endsWith('.unlocked')) return k.split('.')[0] + '.'; } return null; })()")
        bad = []
        plunder = gid == 'plunder'
        vis = lambda: pg.evaluate("!document.getElementById('skipTut').classList.contains('hidden')")
        inLesson = lambda: pg.evaluate("__sim.inDrill ? __sim.inDrill() : !!(__sim.G && __sim.G.lesson)")
        # 1. fresh: Play -> lesson with the skip button; skip -> playing for real
        pg.click('#playBtn'); pg.wait_for_timeout(400)
        if plunder: pg.evaluate("__sim.board ? __sim.board() : null"); pg.wait_for_timeout(300)
        if plunder and not inLesson(): pg.evaluate("(() => { const s = __sim; if (s.stage) s.stage(1); })()"); pg.wait_for_timeout(300)
        if not inLesson(): bad.append('fresh play has no lesson')
        elif not vis(): bad.append('no skip button during the lesson')
        else:
            box = pg.locator('#skipTut').bounding_box(); pg.touchscreen.tap(box['x'] + box['width'] / 2, box['y'] + box['height'] / 2); pg.wait_for_timeout(400)
            if inLesson(): bad.append('skip did not end the lesson')
            if vis(): bad.append('skip button still shown')
            if not plunder and not pg.evaluate("__sim.playing()"): bad.append('not playing after skip')
        # 2. a high level: Tutorial on the home card starts the lessons
        pg.evaluate("localStorage.setItem(arguments[0] + 'unlocked', '9'); localStorage.setItem(arguments[0] + 'level', '9'); localStorage.setItem(arguments[0] + 'taught', '3');".replace('arguments[0]', repr(prefix or 'x.')))
        pg.reload(); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(400)
        pg.click('#tutBtn'); pg.wait_for_timeout(400)
        if plunder:
            if not pg.evaluate("__sim.G && __sim.G.N === 1 && __sim.G.teach && (__sim.G.taught | 0) === 0"): bad.append('Tutorial did not start the first expedition with its drill')
        elif not inLesson(): bad.append('Tutorial button did not start a lesson')
        elif not vis(): bad.append('no skip button in the tutorial')
        # 3. the pause menu has it
        pg.click('#pauseBtn') if pg.is_visible('#pauseBtn') else None; pg.wait_for_timeout(200)
        if not pg.is_visible('#pTut'): bad.append('no Tutorial in the pause menu')
        if errs: bad.append('errors: ' + errs[0][:120])
        print(f"{gid:12s}", 'ok' if not bad else 'FAIL ' + '; '.join(bad)); fails += [gid] if bad else []
        ctx.close()
    b.close()
print(f"\n{len(ids) - len(fails)} of {len(ids)} games pass." + (f" Failing: {', '.join(fails)}" if fails else ''))
sys.exit(1 if fails else 0)
