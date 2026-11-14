#!/usr/bin/env python3
"""Makes each game's feed card: a still picture (feed/posters/<id>.webp) and a short silent
looping clip of real play (feed/previews/<id>.webm). PLAYBOOK P27: a 2-3 s silent preview, tap to play.

    python3 tools/previews.py            every game in the feed
    python3 tools/previews.py zenith     just that one (do this when a game is added or its look changes)

How: opens the game in a phone-sized browser, presses its Play button(s) (feed.start in games.json),
then films a few seconds while playing the moves in games/<id>/preview.json if the game has one:
    { "wait": 1.2,            seconds after Play before the clip starts (used when there is no "anchor")
      "anchor": "js",         or: JavaScript that turns true at the moment worth filming (checked many times a second)
      "from": -0.5,           where the clip starts, in seconds from that moment (may be negative)
      "secs": 3.0,            length of the clip
      "poster": 1.5,          which moment of the clip becomes the still
      "seed": 7,              optional: gives the game the same "random" numbers every time, so a clip can be planned
      "level": "js",          optional JavaScript run instead of pressing Play (for example window.__sim.go(12))
      "js": "...",            optional JavaScript run right after the game starts
      "pre":   [ ... ],       touches timed from pressing Play
      "moves": [ {"t": 0.3, "tap": [0.5, 0.6]},                                    touches timed from that moment
                 {"t": 0.8, "drag": [[0.3, 0.7], [0.6, 0.4]], "ms": 300, "finger": 0},
                 {"t": 1.0, "hold": [0.8, 0.85], "ms": 900, "finger": 1},
                 {"t": 1.2, "press": [0.5, 0.9]}, {"t": 1.5, "slide": [[0.5, 0.9], [0.5, 0.4]], "ms": 200}, {"t": 1.8, "lift": true},
                 {"t": 2.0, "to": [0.5, 0.4], "ms": 200}        glide a finger that is down to a spot ("to_js": JavaScript giving [x, y] in pixels)
                 {"t": 2.0, "follow": "js", "ms": 2500},        keep a finger on whatever the JavaScript points at ([x, y] in pixels; 'lift' = let go now)
                 {"t": 0.0, "js": "..."} ] }                    run JavaScript in the game at that moment (to set the scene up)

Every clip keeps to the same rules, so the cards look like one set (LESSONS, "The feed app"):
  the most exciting moment of the game, in the middle of play; no menu, intro banner or toast in shot;
  the big moment lands about half-way through; 3 to 3.6 seconds; over before any result screen appears.
Positions are fractions of the screen (0-1). With no preview.json the game is simply filmed after Play.

Planning a clip:  python3 tools/previews.py knockout --trace "JavaScript that returns a short text"
plays the game's preview.json without filming and prints that text every time it changes, against the clip's
clock ("pre" = before the clip starts). Use it to see when the game says what, whether the big moment lands
where it should, and when a result screen would cut in. For example, for Knockout:
    --trace "(() => { const G = window.__sim.G; return G ? [G.phase, G.os, G.ohp.toFixed(0), G.msgs.map(m => m.text).join('|')].join(' ') : ''; })()"
Needs: playwright with chromium, ffmpeg, Pillow. A sheet of frames is saved to out/previews/ for a look."""
import base64, io, json, os, subprocess, sys, tempfile, threading, http.server, functools, shutil, time

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, Hh, DSF = 390, 788, 2          # the card area of a 390x844 phone with the feed's bar taken off
FPS, VID_W, POSTER_W = 24, 540, 720


def serve():
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=root))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


class Touch:
    """Real touches through the browser's own input pipe, so a game sees exactly what a thumb would send."""
    def __init__(self, cdp):
        self.cdp, self.down = cdp, {}
    def _send(self, kind):
        pts = [{'x': x, 'y': y, 'id': f, 'radiusX': 12, 'radiusY': 12, 'force': 1} for f, (x, y) in self.down.items()]
        self.cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': pts})
    def press(self, f, x, y):
        self.down[f] = (x, y); self._send('touchStart')
    def move(self, f, x, y):
        if f in self.down: self.down[f] = (x, y); self._send('touchMove')
    def lift(self, f):
        if f in self.down:
            del self.down[f]
            self._send('touchEnd' if not self.down else 'touchMove')
            if self.down: pass


def plan(moves):
    """Turns the moves into a time-ordered list of (t, kind, finger, x, y)."""
    ev = []
    for m in moves or []:
        f, t = m.get('finger', 0), m['t']
        if 'tap' in m or 'hold' in m:
            x, y = m.get('tap') or m.get('hold'); ms = m.get('ms', 60 if 'tap' in m else 600)
            ev += [(t, 'press', f, x, y), (t + ms / 1000, 'lift', f, x, y)]
        elif 'press' in m:
            ev.append((t, 'press', f, m['press'][0], m['press'][1]))
        elif 'lift' in m:
            ev.append((t, 'lift', f, 0, 0))
        elif 'js' in m:                             # run some JavaScript in the game at that moment (to set a scene up)
            ev.append((t, 'js', f, m['js'], 0))
        elif 'to' in m or 'to_js' in m or 'follow' in m:   # worked out at the moment it happens (see act)
            ev.append((t, 'live', f, m, 0))
        elif 'drag' in m or 'slide' in m:           # drag = press, move, lift; slide = move a finger that is already down
            pts, ms = m.get('drag') or m.get('slide'), m.get('ms', 300)
            if 'drag' in m: ev.append((t, 'press', f, pts[0][0], pts[0][1]))
            steps = max(2, int(ms / 16))
            for k in range(1, steps + 1):
                u = k / steps * (len(pts) - 1)
                i = min(int(u), len(pts) - 2); v = u - i
                ev.append((t + ms / 1000 * k / steps, 'move', f, pts[i][0] + (pts[i + 1][0] - pts[i][0]) * v, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * v))
            if 'drag' in m: ev.append((t + ms / 1000 + 0.02, 'lift', f, 0, 0))
    return sorted(ev, key=lambda e: e[0])


def film(browser, port, g, probe=None):
    from PIL import Image
    feed = g.get('feed') or {}
    cfg = {}
    pj = os.path.join(root, os.path.dirname(g['path']), 'preview.json')
    if os.path.exists(pj):
        cfg = json.load(open(pj, encoding='utf-8'))
    wait, secs, lead = cfg.get('wait', 1.4), cfg.get('secs', 3.0), cfg.get('from', 0)
    ctx = browser.new_context(viewport={'width': W, 'height': Hh}, device_scale_factor=DSF, has_touch=True, is_mobile=True)
    pg = ctx.new_page()
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    if 'seed' in cfg:       # the same "random" numbers every time, so the clip can be planned
        pg.add_init_script("(() => { let a = %d >>> 0; Math.random = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })()" % cfg['seed'])
    pg.goto(f"http://127.0.0.1:{port}/{g['path']}")
    pg.wait_for_timeout(1200)
    try: pg.evaluate('document.fonts.ready')
    except Exception: pass
    cdp = ctx.new_cdp_session(pg)
    touch = Touch(cdp)
    frames = []
    def on_frame(p):
        frames.append((time.monotonic(), p['data']))
        try: cdp.send('Page.screencastFrameAck', {'sessionId': p['sessionId']})
        except Exception: pass
    cdp.on('Page.screencastFrame', on_frame)
    if cfg.get('level'):
        pg.evaluate(cfg['level'])
    else:
        for sel in feed.get('start') or ['#playBtn']:
            try: pg.click(sel, timeout=3000)
            except Exception: errs.append(f'could not press {sel}')
            pg.wait_for_timeout(120)
    if cfg.get('js'):
        pg.evaluate(cfg['js'])
    cdp.send('Page.startScreencast', {'format': 'jpeg', 'quality': 90, 'everyNthFrame': 2})
    t_start = time.monotonic()
    pre, ev = plan(cfg.get('pre')), plan(cfg.get('moves'))
    anchor, t0, last_poll = cfg.get('anchor'), None, 0
    if not anchor: t0 = t_start + wait
    live = []
    last_probe, last_txt = 0, None
    def act(e):
        _, kind, f, x, y = e
        if kind == 'lift': touch.lift(f)
        elif kind == 'js': pg.evaluate(x)
        elif kind == 'live':
            m, now = x, time.monotonic()
            if 'follow' in m: live.append({'f': f, 'js': m['follow'], 'end': now + m.get('ms', 1000) / 1000, 'last': 0})
            else:
                tx, ty = (m['to'][0] * W, m['to'][1] * Hh) if 'to' in m else pg.evaluate(m['to_js'])
                if f not in touch.down: touch.press(f, tx, ty)
                live.append({'f': f, 'from': touch.down[f], 'to': (tx, ty), 't1': now, 'dur': max(0.001, m.get('ms', 250) / 1000)})
        else: getattr(touch, kind)(f, x * W, y * Hh)
    def step_live(now):
        for a in live[:]:
            f = a['f']
            if 'js' in a:                               # keep a finger on a moving thing: the JavaScript gives [x, y] in pixels
                if now - a['last'] > 0.022:
                    a['last'] = now
                    xy = pg.evaluate(a['js'])
                    if xy == 'lift': touch.lift(f); live.remove(a); continue        # the JavaScript says: let go now
                    if xy: (touch.move if f in touch.down else touch.press)(f, xy[0], xy[1])
                if now >= a['end']: touch.lift(f); live.remove(a)
            else:                                       # glide a finger to a spot
                u = min(1, (now - a['t1']) / a['dur'])
                touch.move(f, a['from'][0] + (a['to'][0] - a['from'][0]) * u, a['from'][1] + (a['to'][1] - a['from'][1]) * u)
                if u >= 1: live.remove(a)
    while True:
        now = time.monotonic()
        while pre and now - t_start >= pre[0][0]: act(pre.pop(0))
        step_live(now)
        if t0 is None:
            if now - last_poll > 0.04:
                last_poll = now
                if pg.evaluate(anchor): t0 = time.monotonic()
            if now - t_start > cfg.get('timeout', 45): raise RuntimeError(f"{g['id']}: the moment to film never came ({anchor})")
            keep = now + min(lead, 0) - 1.0                 # only keep what could still end up in the clip
            while frames and frames[0][0] < keep: frames.pop(0)
        else:
            while ev and now - t0 >= ev[0][0]: act(ev.pop(0))
            if now - t0 >= lead + secs + (0.6 if probe else 0): break
        if probe and now - last_probe > 0.03:           # --trace: say what the game is doing, against the clip's clock
            last_probe = now
            try: txt = pg.evaluate(probe)
            except Exception as e: txt = 'trace error: ' + str(e)[:90]
            if txt != last_txt:
                last_txt = txt
                print(('clip %+.2f' % (now - t0 - lead)) if t0 else ('pre  %5.2f' % (now - t_start)), '', txt)
        pg.wait_for_timeout(5)
    cdp.send('Page.stopScreencast')
    pg.wait_for_timeout(60)
    ctx.close()
    if probe:
        print(f"{g['id']}: traced only, nothing filmed" + (f"  !! {errs[:2]}" if errs else ''))
        return not errs
    c0 = t0 + lead
    frames = [(t - c0, d) for t, d in frames if t >= c0 - 0.05]
    if len(frames) < 8:
        raise RuntimeError(f"{g['id']}: only {len(frames)} frames were filmed")
    # even out to a steady frame rate
    tmp = tempfile.mkdtemp(prefix='gf-prev-')
    try:
        n, k = int(secs * FPS), 0
        for i in range(n):
            t = i / FPS
            while k + 1 < len(frames) and frames[k + 1][0] <= t: k += 1
            open(os.path.join(tmp, f'{i:04d}.jpg'), 'wb').write(base64.b64decode(frames[k][1]))
        os.makedirs(os.path.join(root, 'feed', 'previews'), exist_ok=True)
        os.makedirs(os.path.join(root, 'feed', 'posters'), exist_ok=True)
        os.makedirs(os.path.join(root, 'out', 'previews'), exist_ok=True)
        vid = os.path.join(root, 'feed', 'previews', g['id'] + '.webm')
        r = subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', os.path.join(tmp, '%04d.jpg'),
                            '-vf', f'scale={VID_W}:-2:flags=lanczos', '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', str(cfg.get('crf', 36)),
                            '-g', str(FPS * 4), '-row-mt', '1', '-deadline', 'good', '-cpu-used', '1', '-pix_fmt', 'yuv420p', '-an', vid],
                           capture_output=True, text=True)
        if r.returncode:
            raise RuntimeError('ffmpeg: ' + r.stderr[-400:])
        pi = min(n - 1, max(0, int(cfg.get('poster', secs * 0.5) * FPS)))
        im = Image.open(os.path.join(tmp, f'{pi:04d}.jpg')).convert('RGB')
        im = im.resize((POSTER_W, round(im.height * POSTER_W / im.width)), Image.LANCZOS)
        poster = os.path.join(root, 'feed', 'posters', g['id'] + '.webp')
        im.save(poster, 'WEBP', quality=80, method=6)
        # a sheet of twelve frames to look over
        N = 12
        cells = [Image.open(os.path.join(tmp, f'{int(j * (n - 1) / (N - 1)):04d}.jpg')).convert('RGB').resize((156, 315)) for j in range(N)]
        sheet = Image.new('RGB', (160 * N - 4, 315), (30, 30, 30))
        for j, c in enumerate(cells): sheet.paste(c, (j * 160, 0))
        sheet.save(os.path.join(root, 'out', 'previews', g['id'] + '.jpg'), quality=80)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    print(f"{g['id']}: clip {os.path.getsize(vid) // 1024} KB, still {os.path.getsize(poster) // 1024} KB, {len(frames) / secs:.0f} frames a second filmed"
          + (f"  !! {errs[:2]}" if errs else ''))
    return not errs


def main():
    from playwright.sync_api import sync_playwright
    reg = json.load(open(os.path.join(root, 'games.json'), encoding='utf-8'))
    args, probe = sys.argv[1:], None
    if '--trace' in args:                       # plan a clip: play it without filming and print what the game is doing
        i = args.index('--trace')
        if i + 1 >= len(args): print('--trace needs the JavaScript to print'); sys.exit(1)
        probe = args[i + 1]; del args[i:i + 2]
    want = [a for a in args if not a.startswith('-')]
    games = [g for g in reg['games'] if (g['id'] in want if want else g['status'] in ('approved', 'testing'))]
    if not games:
        print('no such game'); sys.exit(1)
    srv = serve()
    ok = True
    with sync_playwright() as p:
        b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required', '--mute-audio'])
        for g in games:
            try: ok = film(b, srv.server_address[1], g, probe) and ok
            except Exception as e:
                print('!!', e); ok = False
        b.close()
    srv.shutdown()
    sys.exit(0 if ok else 1)


if __name__ == '__main__':
    main()
