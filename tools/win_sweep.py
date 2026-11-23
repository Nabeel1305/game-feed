#!/usr/bin/env python3
"""Win at odd moments (LESSONS, the audit of 22 Nov 2026): every game from 9 on (or the ids given) is started on level 5 and won by
its own cheat (`__sim.winNow()`) in its first instant and a moment later. The result card must come and nothing may throw. This
is what found Splash Course's empty ghost.      python3 tools/win_sweep.py [id ...]      (about 20 minutes for all)"""
import json, os, sys
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
games = [g for g in json.load(open(R + '/games.json'))['games'] if (g['id'] in sys.argv[1:] if len(sys.argv) > 1 else g['number'] > 8)]; nbad = 0
with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    for g in games:
        gid, pre = g['id'], g['storage_prefix']; bad = []
        for wait_ms in (0, 350):
            ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, has_touch=True, is_mobile=True); pg = ctx.new_page(); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)[:160])); pg.add_init_script("window.__softGL = true")
            try:
                url = 'file://' + R + '/games/%s/index.html' % gid; pg.goto(url)
                pg.evaluate("kv => { for (const k in kv) localStorage.setItem(k, JSON.stringify(kv[k])); }", {pre + 'unlocked': 5, pre + 'level': 5, pre + 'mute': True}); pg.goto(url)
                pg.wait_for_function('typeof window.gameFeedStart === "function"', timeout=15000); pg.evaluate("window.gameFeedStart('mini')"); pg.wait_for_timeout(wait_ms)
                has = pg.evaluate("!!(window.__sim && window.__sim.winNow)")
                if not has: bad.append('no winNow'); ctx.close(); break
                pg.evaluate("window.__sim.winNow()"); pg.wait_for_timeout(4500)
                shown = pg.evaluate("(() => { const e = document.querySelector('#ovEnd'); return !!e && !e.classList.contains('hidden'); })()"); over = pg.evaluate("!!(window.__sim.G && window.__sim.G.over)")
                if over and not shown and not errs:      # (23 Nov 2026: Reel's win landed at 4.4 s and its card a second later; a game that has just ended is given time to show its card)
                    pg.wait_for_timeout(3000); shown = pg.evaluate("(() => { const e = document.querySelector('#ovEnd'); return !!e && !e.classList.contains('hidden'); })()")
                if errs: bad.append(f'{wait_ms}ms: {errs[0]}')
                elif over and not shown: bad.append(f'{wait_ms}ms: over but no card')
            except Exception as e: bad.append(f'{wait_ms}ms: EXC {str(e)[:100]}')
            ctx.close()
        print(gid, 'BAD ' + ' | '.join(bad) if bad else 'ok', flush=True); nbad += bool(bad)
    b.close()
sys.exit(1 if nbad else 0)
