#!/usr/bin/env python3
"""Checks every game in games.json:
  - registry is consistent (unique numbers/ids/storage prefixes, files exist, next_number correct)
  - every game page loads in a phone-sized headless browser with no JavaScript errors
  - saves a screenshot of each to out/<id>.png
  - the feed app builds (tools/build_feed.py), every game in it has its card picture and its fonts, and the feed opens
Run: pip install playwright && python -m playwright install chromium && python3 tools/check.py
The feed has its own deeper test: python3 tools/test_feed.py"""
import json, os, sys, threading, http.server, functools
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
reg = json.load(open(os.path.join(root, 'games.json')))
games = reg['games']
problems = []
nums = [g['number'] for g in games]
if sorted(nums) != list(range(1, len(nums) + 1)): problems.append(f'game numbers must be 1..N with no gaps: {sorted(nums)}')
if reg['next_number'] != len(nums) + 1: problems.append(f"next_number should be {len(nums) + 1}")
for key in ('id', 'path'):
    vals = [g[key] for g in games]
    if len(vals) != len(set(vals)): problems.append(f'duplicate {key}')
prefixes = [g['storage_prefix'] for g in games if g.get('storage_prefix')]
if len(prefixes) != len(set(prefixes)): problems.append('two games share a storage_prefix (their saves would collide)')
if 'gf.' in prefixes: problems.append("storage_prefix 'gf.' belongs to the feed itself; give the game another")
for g in games:
    if not os.path.exists(os.path.join(root, g['path'])): problems.append(f"{g['id']}: missing {g['path']}")

# the feed app: built from the registry; a game without a card picture or with fonts the app does not carry is a problem
listing = []
if not problems:
    sys.path.insert(0, os.path.join(root, 'tools'))
    import build_feed
    listing, notes, feed_problems = build_feed.build(os.path.join(root, 'out', 'app'))
    problems += feed_problems + notes

if not problems:
    from playwright.sync_api import sync_playwright
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    handler = functools.partial(Quiet, directory=root)
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    port = srv.server_address[1]
    os.makedirs(os.path.join(root, 'out'), exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch()
        for g in games:
            pg = b.new_page(viewport={'width': 390, 'height': 844})
            errs = []
            pg.on('pageerror', lambda e, errs=errs: errs.append(str(e)))
            pg.goto(f"http://127.0.0.1:{port}/{g['path']}")
            pg.wait_for_timeout(1500)
            pg.screenshot(path=os.path.join(root, 'out', g['id'] + '.png'))
            if errs: problems.append(f"{g['id']}: JavaScript errors: {errs[:3]}")
            else: print(f"ok  #{g['number']} {g['name']}")
            pg.close()
        # the feed opens and lists every game
        handler2 = functools.partial(Quiet, directory=os.path.join(root, 'out', 'app'))
        srv2 = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler2)
        threading.Thread(target=srv2.serve_forever, daemon=True).start()
        pg = b.new_page(viewport={'width': 390, 'height': 844})
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(f"http://127.0.0.1:{srv2.server_address[1]}/index.html")
        pg.wait_for_timeout(1500)
        shown = pg.evaluate('window.__feed ? window.__feed.games.length : -1')
        pg.screenshot(path=os.path.join(root, 'out', 'feed.png'))
        if errs: problems.append(f"feed: JavaScript errors: {errs[:3]}")
        elif shown != len(listing): problems.append(f"feed: shows {shown} games, expected {len(listing)}")
        else: print(f"ok  feed app with {shown} games")
        pg.close()
        srv2.shutdown()
        b.close()
    srv.shutdown()
if problems:
    print('PROBLEMS:'); [print(' -', x) for x in problems]; sys.exit(1)
print(f'All {len(games)} games passed.')
