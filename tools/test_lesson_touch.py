#!/usr/bin/env python3
"""The tutorial does what it shows (his words, 26 Nov 2026: "it tells me to swipe. I swipe up and then nothing happens, and then I just skip
the tutorials... make sure the tutorial is correct for each game and is actually working for each game").

For every lesson step of every game, in a phone-sized browser with real touches, this does EXACTLY what the coach is drawing at that moment:
the gesture it shows (tap, hold, release, swipe, drag, wait), in the direction it shows, at the place the hand points to (or, where the coach
draws the gesture in a little box with no place, in the middle of the play area). It reads what is shown from the coach itself (a copy of
the page with one line added to coachPanel that writes what it draws to window.__coach; the game is not changed).

For each step it reports: done by doing what is shown (and in how many tries), or TRY AGAIN shown (the move is understood but was not good
enough: a timing step can fairly need tries), or NOTHING (the shown move did nothing at all: his complaint). When a step is not done by touch
in time, the game's own honest robot finishes it so the later steps can be tried too.

Run: python3 tools/test_lesson_touch.py [id ...]   (writes out/lesson_touch/<id>.json; --quiet prints one line a game)"""
import json, os, re, sys, time
from playwright.sync_api import sync_playwright
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
args = [a for a in sys.argv[1:] if not a.startswith('--')]; quiet = '--quiet' in sys.argv
CORE = {'bottle-cap-flick', 'knockout', 'high-noon', 'sword-fight', 'zenith', 'hippodrome', 'bandit', 'plunder'}
ids = args or sorted(d for d in os.listdir(os.path.join(root, 'games')) if d not in CORE and os.path.exists(os.path.join(root, 'games', d, 'part1.html')))
OUT = os.path.join(root, 'out', 'lesson_touch'); TMP = '/tmp/lesson_touch'; os.makedirs(OUT, exist_ok=True); os.makedirs(TMP, exist_ok=True)
HOOK = "const dd = fv(st.do); if (at) coachCue"
REC = "const dd = fv(st.do); try { window.__coach = { i: D.i, n: D.n, len: D.steps.length, need, id: st.id, say: words, do: dd, dir: fv(st.dir), at: at || null, W, H, miss: COACH.miss, t: now, rot: typeof ROT !== 'undefined' ? ROT : (window.LAND && LAND.on() ? 1 : 0), iw: document.documentElement.clientWidth, ih: document.documentElement.clientHeight }; } catch (e) {} if (at) coachCue"
STEP_S, BOT_S = int(os.environ.get("STEP_S", 30)), 30

def patched(gid):
    s = open(os.path.join(root, 'games', gid, 'index.html')).read()
    if HOOK not in s: return None
    d = os.path.join(TMP, gid); os.makedirs(d, exist_ok=True); p = os.path.join(d, 'index.html'); open(p, 'w').write(s.replace(HOOK, REC, 1)); return p

def run(b, gid):
    path = patched(gid)
    if not path: return {'id': gid, 'skip': 'no coach'}
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True); ctx.add_init_script('window.__softGL = true')
    pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:160]))
    pg.goto('file://' + path); pg.wait_for_function('typeof window.gameFeedStart === "function"', timeout=30000); pg.wait_for_timeout(400)
    cdp = ctx.new_cdp_session(pg)
    rot = [0, 390, 844]
    def touch(kind, x=0, y=0):      # the coach's places are in the game's own picture: a game turned sideways is turned back to the screen's
        if rot[0] == 1: x, y = rot[1] - y, x
        elif rot[0] == -1: x, y = y, rot[2] - x
        cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [] if kind == 'touchEnd' else [{'x': x, 'y': y, 'id': 1}]})
    def touch2(kind, pts):      # two thumbs at once (TAP BOTH SIDES, HOLD BOTH)
        tp = []
        for i, (x, y) in enumerate(pts):
            if rot[0] == 1: x, y = rot[1] - y, x
            elif rot[0] == -1: x, y = y, rot[2] - x
            tp.append({'x': x, 'y': y, 'id': i + 1})
        cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [] if kind == 'touchEnd' else tp})
    def coach():
        c = pg.evaluate("(() => { const c = window.__coach; if (!c) return null; return Object.assign({}, c, { age: performance.now() - c.t }); })()")
        if c: rot[:] = [c.get('rot') or 0, c.get('iw') or 390, c.get('ih') or 844]
        return c
    def lesson(): return pg.evaluate("(() => { const G = __sim.G; return G && G.lesson ? { i: G.lesson.i, n: G.lesson.n } : null; })()")
    levels = sorted(int(k) for k in pg.evaluate("Object.keys(__sim.LESSONS || {})"))
    prefix = pg.evaluate("(() => { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/\\.(mute|smooth|unlocked|level)$/.test(k)) return k.split('.')[0] + '.'; } return null; })()")
    steps = []; flip = [0]; last = [None]
    def gesture(c):
        W, H = c['W'], c['H']; d, dr, at = c['do'], c['dir'] or 'up', c['at']; prev = last[0]; last[0] = d
        if d == 'release' and prev == 'hold': last[0] = 'hold'
        if d in (None, 'none', 'wait'):      # a step that shows no move (or WAIT): hands off until the coach shows a move (up to 2.5 s)
            for _ in range(50):
                pg.wait_for_timeout(50); c2 = coach()
                if not c2 or c2['do'] not in (None, 'none', 'wait') or c2['i'] != c['i']: break
            return
        if at and isinstance(at, list) and len(at) >= 2 and at[0] is not None: x, y = at[0], at[1]
        else: x, y = W / 2, H * 0.6
        both = 'BOTH' in str(c.get('say') or '').upper() and d in ('tap', 'hold')
        if both: pts = [(W * 0.25, H * 0.7), (W * 0.75, H * 0.7)]
        if d == 'tap' and both: touch2('touchStart', pts); pg.wait_for_timeout(70); touch2('touchEnd', pts); return
        if d == 'tap': touch('touchStart', x, y); pg.wait_for_timeout(70); touch('touchEnd'); return
        if d == 'hold':      # hold on until something changes (up to 4 s), as a person does
            n0 = lesson(); (touch2('touchStart', pts) if both else touch('touchStart', x, y))
            for _ in range(40):      # until the lesson moves on or the coach shows another move (up to 8 s)
                pg.wait_for_timeout(200); L = lesson(); c2 = coach()
                if not L or not n0 or L != n0 or (c2 and (c2['do'] != 'hold' or c2['i'] != c['i'])): break
            touch('touchEnd'); return
        if d == 'release':
            if last[0] == 'hold': pg.wait_for_timeout(500); last[0] = 'release'; return      # he was holding: letting go was the move
            touch('touchStart', x, y); pg.wait_for_timeout(900); touch('touchEnd'); return
        if d in ('swipe', 'drag'):
            if at and len(at) >= 4: x2, y2 = at[2], at[3]
            else:
                if dr == 'lr': dr = 'right' if flip[0] % 2 == 0 else 'left'
                if dr == 'ud': dr = 'up' if flip[0] % 2 == 0 else 'down'
                flip[0] += 1; v = {'up': (0, -1), 'down': (0, 1), 'left': (-1, 0), 'right': (1, 0)}.get(dr, (0, -1)); L = 140 * W / 390; x2, y2 = x + v[0] * L, y + v[1] * L
            n, ms = (6, 20) if d == 'swipe' else (16, 35)
            touch('touchStart', x, y)
            for i in range(1, n + 1): pg.wait_for_timeout(ms); touch('touchMove', x + (x2 - x) * i / n, y + (y2 - y) * i / n)
            key = (c['say'], str([round(v / 8) for v in at]) if isinstance(at, list) else '')      # a thumb on a stick stays down while the cue says the same
            for _ in range(15):
                pg.wait_for_timeout(100); c2 = coach()
                if not c2 or (c2['say'], str([round(v / 8) for v in c2['at']]) if isinstance(c2['at'], list) else '') != key or c2['do'] != d: break
            touch('touchEnd'); return
        if d == 'tilt': pg.wait_for_timeout(1000); return
        touch('touchStart', x, y); pg.wait_for_timeout(70); touch('touchEnd')
    for N in levels:
        if prefix: pg.evaluate(f"localStorage.setItem('{prefix}taught', '{N - 1}')")
        pg.evaluate("window.__coach = null"); pg.evaluate(f"__sim.go({N})")
        try: pg.wait_for_function("window.__coach && __sim.G && __sim.G.lesson", timeout=8000)
        except Exception: steps.append({'level': N, 'error': 'the lesson did not start'}); continue
        guard = 0
        while guard < 12:
            guard += 1; L = lesson()
            if not L: break
            pg.wait_for_timeout(250); c = coach()
            if not c or c['age'] > 1500: pg.wait_for_timeout(600); c = coach()
            if not c: break
            rec = {'level': N, 'step': c['i'] + 1, 'of': c['len'], 'say': c['say'], 'do': c['do'], 'dir': c['dir'], 'placed': bool(c['at']), 'tries': 0, 'ok': 0, 'tryagain': 0, 'moved': 0, 'nothing': 0, 'says': []}
            i0, t0 = c['i'], time.time(); done = False
            while time.time() - t0 < STEP_S:
                c = coach(); L = lesson()
                if not L or (c and c['i'] != i0): done = True; break
                if c['say'] not in rec['says']: rec['says'].append(c['say'])
                n0, m0, s0 = L['n'], c['miss'], (c['say'], c['do'], str([round(v / 8) for v in c['at']]) if isinstance(c['at'], list) else ''); gesture(c); rec['tries'] += (0 if c['do'] in (None, 'none', 'wait') else 1); pg.wait_for_timeout(650 if c['do'] not in (None, 'none', 'wait') else 30)
                L2 = lesson(); c2 = coach()
                if not L2 or (c2 and c2['i'] != i0): rec['ok'] += 1; done = True; break
                if L2['n'] > n0: rec['ok'] += 1
                elif c2 and c2['miss'] != m0: rec['tryagain'] += 1
                elif c2 and (c2['say'], c2['do'], str([round(v / 8) for v in c2['at']]) if isinstance(c2['at'], list) else '') != s0: rec['moved'] = rec.get('moved', 0) + 1      # the coach moved on to the next move of the step: the move did something
                else: rec['nothing'] += 1
            rec['by'] = 'touch' if done else None
            if not done:      # let the honest robot finish this step, so the next ones are tried
                pg.evaluate("(() => { const mem = {}; window.__botT = setInterval(() => { try { const G = __sim.G; if (G && !G.over) __sim.honest(G, { react: 0.3, acc: 0.95 }, mem); } catch (e) {} }, 50); })()")
                t1 = time.time()
                while time.time() - t1 < BOT_S:
                    pg.wait_for_timeout(300); L = lesson(); c = coach()
                    if not L or (c and c['i'] != i0): rec['by'] = 'robot'; break
                pg.evaluate("clearInterval(window.__botT)")
                if not rec['by']: rec['by'] = 'stuck'; steps.append(rec); break
            steps.append(rec)
            if not lesson(): break
    ctx.close()
    bad = [s for s in steps if s.get('error') or s.get('by') != 'touch' or s.get('nothing', 0) > s.get('ok', 0) + s.get('tryagain', 0) + s.get('moved', 0)]
    return {'id': gid, 'steps': steps, 'bad': len(bad), 'errors': errs[:3]}

with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader'])
    for gid in ids:
        t = time.time()
        try: r = run(b, gid)
        except Exception as e: r = {'id': gid, 'crash': str(e)[:300]}
        r['secs'] = round(time.time() - t); json.dump(r, open(os.path.join(OUT, gid + '.json'), 'w'), indent=1)
        if quiet: print(gid, 'crash' if r.get('crash') else r.get('skip') or f"{r['bad']} bad of {len(r['steps'])}", r['secs'], 's', flush=True)
        else:
            print(f"== {gid} ({r['secs']} s)", r.get('crash') or r.get('skip') or '', flush=True)
            for s in r.get('steps', []):
                print('  ', s.get('error') or f"L{s['level']} {s['step']}/{s['of']} {s['say']!r:26} {s['do']}/{s['dir'] or ''}{' @' if s['placed'] else ''}: by {s['by']}, tries {s['tries']} ok {s['ok']} again {s['tryagain']} nothing {s['nothing']}")
            if r.get('errors'): print('   errors:', r['errors'])
    b.close()
