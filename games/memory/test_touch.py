#!/usr/bin/env python3
"""Memory Lane with real touches: a tap on the covered card looks at once; GOT IT ends the look; in WHICH WERE THERE a tap
chooses a thing (a second tap takes it back) and choosing as many as there were answers; in PUT THEM BACK a thing dragged
from the tray to a place stays there; in IN ORDER taps light the things in turn; NEXT goes on after the review. Then the rules:
the right things score all, wrong ones nothing; a missing or changed thing is one tap; 80% over five rounds passes, less does
not; the longer look really is longer; quick answers earn a bonus only in Timed mode. The Settings switch Music, Sound effects
and Vibration on their own and remember them. No errors.
Run: python3 games/memory/test_touch.py"""
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
    pg.goto('file://' + os.path.join(here, 'index.html')); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(800)
    E = pg.evaluate; cdp = ctx.new_cdp_session(pg)
    def touch(kind, pts): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, (x, y) in pts]})
    def tap(x, y): touch('touchStart', [(1, (x, y))]); touch('touchEnd', [(1, (x, y))]); pg.wait_for_timeout(60)
    def until(js, ms=15000):
        try: pg.wait_for_function(js, timeout=ms); return True
        except Exception: return False
    # a level with a WHICH round first: force the plan
    E("localStorage.setItem('mem.taught', '3'); __sim.go(12)"); E("(() => { const G = __sim.G; G.plan = ['which', 'place', 'order', 'missing', 'changed']; G.ri = -1; __sim.nextRound(); })()")
    ok(E("__sim.G.round.phase") == 'brief', 'each round starts by saying what to remember')
    c = E("__sim.lay().card"); tap(c['x'] + c['s'] / 2, c['y'] + c['s'] / 2); ok(E("__sim.G.round.phase") == 'show', 'a tap on the covered card looks at once')
    pg.wait_for_timeout(700); bt = E("__sim.lay().btn"); tap(bt['x'] + bt['w'] / 2, bt['y'] + bt['h'] / 2); ok(until("__sim.G.round.phase === 'ask'", 3000), 'GOT IT ends the look')
    o = E("__sim.lay().opts"); n = E("__sim.G.round.n"); tap(o[0]['x'] + 20, o[0]['y'] + 20); ok(E("__sim.G.round.opts[0].on") is True, 'a tap chooses a thing')
    tap(o[0]['x'] + 20, o[0]['y'] + 20); ok(E("__sim.G.round.opts[0].on") is False, 'a second tap takes it back')
    yes = E("__sim.G.round.opts.map((q, i) => q.yes ? i : -1).filter(i => i >= 0)")
    for i in yes: tap(o[i]['x'] + 20, o[i]['y'] + 20)
    ok(E("[__sim.G.round.phase, __sim.G.round.score]") == ['review', 1], 'choosing as many as there were answers, and the right ones score all', str(E("[__sim.G.round.phase, __sim.G.round.score]")))
    pg.wait_for_timeout(600); bt = E("__sim.lay().btn"); tap(bt['x'] + bt['w'] / 2, bt['y'] + bt['h'] / 2); ok(E("[__sim.G.ri, __sim.G.round.type]") == [1, 'place'], 'NEXT goes on to the next round', str(E("[__sim.G.ri, __sim.G.round.type]")))
    E("(() => { const r = __sim.G.round; r.phase = 'ask'; r.t = 0; })()"); pg.wait_for_timeout(50)
    L = E("__sim.lay()"); want = E("__sim.G.round.items[0].slot"); t0 = L['tray'][0]; s0 = L['slots'][want]
    touch('touchStart', [(1, (t0['x'] + t0['w'] / 2, t0['y'] + t0['h'] / 2))])
    for f in (0.3, 0.6, 1.0): touch('touchMove', [(1, (t0['x'] + t0['w'] / 2 + (s0['x'] - t0['x'] - t0['w'] / 2) * f, t0['y'] + t0['h'] / 2 + (s0['y'] - t0['y'] - t0['h'] / 2) * f))]); pg.wait_for_timeout(30)
    touch('touchEnd', [(1, (s0['x'], s0['y']))]); pg.wait_for_timeout(60); ok(E("__sim.G.round.placed[0]") == want, 'a thing dragged from the tray to its place stays there', str(E("__sim.G.round.placed")))
    E("(() => { const G = __sim.G, r = G.round; r.items.forEach((it, k) => { if (k) __sim.place(k, it.slot); }); })()"); ok(E("[__sim.G.round.phase, __sim.G.round.score]") == ['review', 1], 'all back in their places scores all')
    E("__sim.G.round.t = 1; __sim.cont(); (() => { const r = __sim.G.round; r.phase = 'ask'; r.t = 0; })()"); ok(E("__sim.G.round.type") == 'order', 'then IN ORDER')
    L = E("__sim.lay()"); seq = E("__sim.G.round.seq.map(it => it.slot)")
    for s in seq[:2]: tap(L['slots'][s]['x'], L['slots'][s]['y'])
    ok(E("__sim.G.round.picks") == seq[:2], 'taps light the things in turn', str([E("__sim.G.round.picks"), seq[:2]]))
    wrong = [s for s in seq[2:] if s != seq[2]]
    if wrong: tap(L['slots'][wrong[0]]['x'], L['slots'][wrong[0]]['y']); r = E("[__sim.G.round.phase, +__sim.G.round.score.toFixed(2), __sim.G.round.n]"); ok(r[0] == 'review' and abs(r[1] - 2 / r[2]) < 0.01, 'a wrong one ends it: the ones before it count', str(r))
    # ---------- the rules ----------
    base = "(N, o) => { const S = __sim; S.start(N, Object.assign({ seed: 5 }, o || {})); return S.G; }"
    r = E(f"""(() => {{ const G = ({base})(14), out = []; for (const t of ['missing', 'changed']) {{ G.plan[G.ri] = t; G.ri--; __sim.nextRound(); const r = G.round; r.phase = 'ask'; if (t === 'missing') __sim.choose(r.opts.findIndex(q => q.yes)); else __sim.tapSlot(r.changed[0]); out.push(r.score); r.t = 1; __sim.cont(); }} return out; }})()""")
    ok(r == [1, 1], 'what is missing, or what changed, is one tap on it', str(r))
    r = E(f"""(() => {{ const res = []; for (const want of [0.8, 0.6]) {{ const G = ({base})(14); G.scores = [1, 1, 1, want === 0.8 ? 1 : 0, 0]; G.log = G.scores.map(s => ({{ type: 'which', n: 3, score: s, bonus: 0 }})); __sim.finishLevel(); res.push(G.over); }} return res; }})()""")
    ok(r == ['won', 'lost'], '80% over five rounds passes; less does not', str(r))
    r = E(f"""(() => {{ const a = ({base})(14).round.view, b = ({base})(14, {{ view: 2 }}).round.view; return +(b / a).toFixed(2); }})()""")
    ok(r == 2, 'the longest look really is twice as long', str(r))
    r = E(f"""(() => {{ const out = []; for (const timed of [false, true]) {{ const G = ({base})(14, {{ timed }}); G.plan[0] = 'missing'; G.ri = -1; __sim.nextRound(); const r = G.round; r.phase = 'ask'; r.t = 0.5; __sim.choose(r.opts.findIndex(q => q.yes)); out.push(r.bonus); }} return out; }})()""")
    ok(r[0] == 0 and r[1] > 0, 'quick answers earn a bonus only in Timed mode', str(r))
    # ---------- Settings ----------
    E("__sim.live(); localStorage.setItem('mem.settings', '{}'); location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(600)
    sw = "['tMus', 'tSfx', 'tVib'].map(i => document.getElementById(i).textContent === 'ON')"
    ok(E("!!document.getElementById('setBtn').offsetParent"), 'the Settings button is on the home screen')
    E("document.getElementById('setBtn').click()"); ok(E("!document.getElementById('ovSet').classList.contains('hidden')"), 'it opens the Settings card')
    E("document.getElementById('tMus').click()"); ok(E(sw) == [False, True, True], 'Music switches off on its own', str(E(sw)))
    E("document.getElementById('tVib').click()"); ok(E(sw) == [False, True, False], 'Vibration switches off on its own', str(E(sw)))
    E("document.getElementById('tSfx').click()"); ok(E(sw) == [False, False, False], 'Sound effects switch off on their own', str(E(sw)))
    E("location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(500)
    ok(E(sw) == [False, False, False], 'the settings are remembered'); E("localStorage.setItem('mem.settings', '{}')")
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
