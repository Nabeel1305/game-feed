#!/usr/bin/env python3
"""On a small phone (360 x 640) can every button on every card be reached? For each game from 9 on (or the ids given): the home
card, the pause menu, the levels card, the settings card and the result card are opened in turn, and any button that is cut off
by the edge of the screen and cannot be scrolled to is reported.      python3 tools/small_screen.py [id ...]"""
import json, os, sys
from playwright.sync_api import sync_playwright
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
games = [g for g in json.load(open(R + '/games.json'))['games'] if (g['id'] in sys.argv[1:] if len(sys.argv) > 1 else g['number'] > 8)]
CUT = """() => { const W = innerWidth, H = innerHeight, out = []; const scrolls = el => { for (let p = el.parentElement; p; p = p.parentElement) { const s = getComputedStyle(p); if (/(auto|scroll)/.test(s.overflowY) && p.scrollHeight > p.clientHeight + 2) return true; } return false; };
  for (const el of document.querySelectorAll('button, .btn, input, select, textarea, a[href]')) { if (!el.offsetParent && getComputedStyle(el).position !== 'fixed') continue; const s = getComputedStyle(el); if (s.visibility === 'hidden' || s.display === 'none' || +s.opacity === 0) continue; const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
    const offX = r.left < -2 || r.right > W + 2, offY = r.top < -2 || r.bottom > H + 2; if (offX || (offY && !scrolls(el))) out.push((el.id || el.textContent.trim().slice(0, 14) || el.tagName) + ' ' + [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)].join(',')); }
  if (document.documentElement.scrollWidth > W + 2) out.push('page is wider than the screen: ' + document.documentElement.scrollWidth); return out; }"""
nbad = 0
with sync_playwright() as p:
    b = p.chromium.launch(args=['--mute-audio'])
    for g in games:
        gid = g['id']; html = open(f'{R}/games/{gid}/index.html').read(); side = 'ROTW' in html; bad = []
        ctx = b.new_context(viewport={'width': 640, 'height': 360} if side and False else {'width': 360, 'height': 640}, device_scale_factor=2, has_touch=True, is_mobile=True); pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:120]))
        def look(where):
            r = pg.evaluate(CUT)
            if r: bad.append(where + ': ' + '; '.join(r[:3]))
        try:
            pg.goto(f'file://{R}/games/{gid}/index.html'); pg.wait_for_function('typeof window.gameFeedStart === "function"', timeout=15000); pg.wait_for_timeout(400); look('home')
            if pg.query_selector('#setBtn') and pg.is_visible('#setBtn'):
                pg.click('#setBtn'); pg.wait_for_timeout(250); look('settings')
                for sel in ('#setClose', '#setDone', '#ovSet .btn'):
                    if pg.query_selector(sel) and pg.is_visible(sel): pg.click(sel); break
                pg.wait_for_timeout(150)
            pg.evaluate("window.gameFeedStart('mini')"); pg.wait_for_timeout(700)
            if pg.query_selector('#pauseBtn') and pg.is_visible('#pauseBtn'):
                pg.click('#pauseBtn'); pg.wait_for_timeout(300); look('pause')
                if pg.query_selector('#pLevels') and pg.is_visible('#pLevels'): pg.click('#pLevels'); pg.wait_for_timeout(300); look('levels')
            pg.evaluate("window.gameFeedStart('mini')"); pg.wait_for_timeout(500)
            if pg.evaluate("!!(window.__sim && window.__sim.winNow)"):
                pg.evaluate("window.__sim.winNow()"); 
                for _ in range(30):
                    if pg.evaluate("(() => { const e = document.querySelector('#ovEnd'); return !!e && !e.classList.contains('hidden'); })()"): break
                    pg.wait_for_timeout(200)
                pg.wait_for_timeout(300); look('result')
        except Exception as e: bad.append('EXC ' + str(e)[:100])
        if errs: bad.append('error ' + errs[0])
        print(gid, 'BAD ' + ' | '.join(bad) if bad else 'ok', flush=True); nbad += bool(bad); ctx.close()
    b.close()
sys.exit(1 if nbad else 0)
