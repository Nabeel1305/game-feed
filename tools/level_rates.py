#!/usr/bin/env python3
"""How often people who look win the first levels (his words, 26 Nov 2026: "after the tutorial, the first level should be the only one that is
given, but after that it should actually engage the players"). For each game: the game's own ordinary and sloppy players (from its test_play.py
TARGETS), fast-forward with its own robots (bots.js), on levels 1, 2, 3, 5 and 10. Writes out/level_rates/<id>.json and prints one line a game.

Run: python3 tools/level_rates.py [ids] [--n 20]"""
import ast, json, os, re, sys
from playwright.sync_api import sync_playwright
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
args = [a for a in sys.argv[1:] if not a.startswith('--')]; n = int(sys.argv[sys.argv.index('--n') + 1]) if '--n' in sys.argv else 20
if '--n' in sys.argv: args = [a for a in args if a != str(n)]
FIRST8 = {'bottle-cap-flick', 'knockout', 'high-noon', 'sword-fight', 'zenith', 'hippodrome', 'bandit', 'plunder'}
ids = args or sorted(d for d in os.listdir(os.path.join(root, 'games')) if os.path.exists(os.path.join(root, 'games', d, 'bots.js')) and d not in FIRST8)
def profile(gid, name, dflt):
    try: t = open(os.path.join(root, 'games', gid, 'test_play.py')).read(); m = re.search(name + r"\s*=\s*dict\(([^)]*)\)", t)
    except Exception: return dflt
    if not m: return dflt
    return {k: float(v) for k, v in re.findall(r"(\w+)\s*=\s*([0-9.]+)", m.group(1))}
os.makedirs(os.path.join(root, 'out', 'level_rates'), exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch()
    for gid in ids:
        pg = b.new_page(viewport={'width': 390, 'height': 844}); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        try:
            pg.goto('file://' + os.path.join(root, 'games', gid, 'index.html')); pg.wait_for_function('typeof window.gameFeedStart === "function"', timeout=30000)
            pg.add_script_tag(path=os.path.join(root, 'games', gid, 'bots.js'))
            out = {}
            for name, dflt, L in (('ordinary', {'react': 0.35, 'acc': 0.85}, [1, 2, 3, 5, 10]), ('sloppy', {'react': 0.5, 'acc': 0.7}, [1, 2, 3])):
                o = profile(gid, name, dflt)
                out[name] = pg.evaluate("([o, L, n]) => { const r = {}; for (const N of L) { let w = 0; for (let s = 0; s < n; s++) w += __B.runHonest(N, 900 + s * 17 + N, o).won ? 1 : 0; r[N] = w / n; } return r; }", [o, L, n])
            out['errors'] = errs[:3]
        except Exception as e: out = {'crash': str(e)[:200]}
        json.dump(out, open(os.path.join(root, 'out', 'level_rates', gid + '.json'), 'w'))
        if 'crash' in out: print(gid, 'crash', out['crash'][:80], flush=True)
        else: print(f"{gid:16} ordinary {' '.join(f'{k}:{v:.2f}' for k, v in out['ordinary'].items())} | sloppy {' '.join(f'{k}:{v:.2f}' for k, v in out['sloppy'].items())}", flush=True)
        pg.close()
    b.close()
