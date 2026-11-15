#!/usr/bin/env python3
"""How long a frame of each game takes on a computer slowed down to be more like a cheap phone, side by side.

    python3 tools/speed.py                  every game that is approved or being play-tested
    python3 tools/speed.py bandit zenith    just these
    python3 tools/speed.py --x 6 bandit     slowed down six times instead of four

Each game is opened phone-sized, started the way the feed starts it (window.gameFeedStart('mini')), left to play for two
seconds, then timed for about 240 frames. A game that eases its own picture off on a slow phone (Bandit's `__sim.finest()`) is
held at its finest picture, so what is timed is the full work.

What the numbers mean: this machine has no graphics chip, so every dot is painted by the processor. That is the worst case a
phone can be in, and some cheap phones are in it. A real phone is usually faster, often far faster; but a game that is slow here
is slow on a weak phone. So read the table as a comparison: a new game should not take much longer per frame than the games
Nabeel already plays happily (LESSONS, rule 12). A game that paints with the graphics chip (WebGL) is timed both ways: plain
(what a phone without a usable chip gets) and, marked "chip", with the chip's way pretended by the processor, which is only
good for seeing that it works, not for its speed.
"""
import json, os, sys, threading, http.server, functools
from playwright.sync_api import sync_playwright

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
args = sys.argv[1:]
rate = 4.0
if '--x' in args: i = args.index('--x'); rate = float(args[i + 1]); del args[i:i + 2]
games = [g for g in json.load(open(os.path.join(root, 'games.json')))['games'] if (g['id'] in args if args else g['status'] in ('approved', 'testing'))]
if not games: print('no such game'); sys.exit(1)

MEASURE = r"""() => new Promise(res => { const ts = []; let n = 0; function f(t) { ts.push(t); if (++n < 240 && t - ts[0] < 9000) requestAnimationFrame(f); else {
  const d = []; for (let i = 1; i < ts.length; i++) d.push(ts[i] - ts[i - 1]); d.sort((a, b) => a - b); const avg = d.reduce((a, b) => a + b, 0) / d.length;
  res({ fps: +(1000 / avg).toFixed(0), avg: +avg.toFixed(1), mid: +d[d.length >> 1].toFixed(1), slow: +d[Math.floor(d.length * 0.95)].toFixed(1) }); } } requestAnimationFrame(f); })"""

def time_game(b, port, g, chip):
    ctx = b.new_context(viewport={'width': 412, 'height': 892}, device_scale_factor=2.6, has_touch=True, is_mobile=True)
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    if chip: pg.add_init_script("window.__softGL = true")
    pg.goto(f"http://127.0.0.1:{port}/{g['path']}"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(600)
    ctx.new_cdp_session(pg).send('Emulation.setCPUThrottlingRate', {'rate': rate})
    pg.evaluate("window.__sim && window.__sim.finest && window.__sim.finest()")
    pg.evaluate("window.gameFeedStart('mini')"); pg.wait_for_timeout(2000)
    r = pg.evaluate(MEASURE); r['errors'] = errs[:2]
    r['webgl'] = pg.evaluate("[...document.querySelectorAll('canvas')].some(c => { try { return !!(c.getContext('webgl') || c.getContext('webgl2')); } catch (e) { return false; } })") if chip else False
    ctx.close()
    return r

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=root))
threading.Thread(target=srv.serve_forever, daemon=True).start()
rows = []
with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required', '--mute-audio'])
    for g in games:
        r = time_game(b, srv.server_address[1], g, False); rows.append((g, '', r))
        if 'webgl' in open(os.path.join(root, g['path']), encoding='utf-8').read():
            r2 = time_game(b, srv.server_address[1], g, True)
            if r2['webgl']: rows.append((g, ' (chip)', r2))
    b.close()
print(f'Slowed down x{rate:g}, phone-sized, no graphics chip. Lower is better; compare, do not read as phone speeds.\n')
print(f"{'game':28} {'a second':>9} {'average':>9} {'middle':>8} {'slow end':>9}   (ms a frame)")
for g, tag, r in sorted(rows, key=lambda x: x[2]['avg']):
    print(f"{('#%d %s%s' % (g['number'], g['name'], tag)):28} {r['fps']:>9} {r['avg']:>9} {r['mid']:>8} {r['slow']:>9}   {'on the app' if g.get('in_app') else g['status']}{'  ERRORS ' + str(r['errors']) if r['errors'] else ''}")
