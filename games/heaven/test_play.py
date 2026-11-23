#!/usr/bin/env python3
"""Proves this game's rules with robot players (bots.js), fast-forward: the starter kit's standard test (kit/README.md).

  1. SPAMMING CANNOT WIN (LESSONS rule 1), on any level, the first included. Every string of up to four of the game's blind
     moves (BLIND in part2), with waits, on beats from frantic to slow; then moves drawn at random. Next to none may win.
  2. People who look win: an ordinary player most of the early levels, a sloppy one the first few, a sharp one far on.
     It gets harder for ever, and is never impossible.
  3. The lessons of the first three levels: an ordinary and a clumsy player both get through them; nothing is lost during one.
  4. Every sound renders without an error or clipping. No JavaScript errors.
Tune the targets below (TARGETS) only with a reason, written next to the number.

Run: python3 games/<id>/test_play.py"""
import itertools, os, sys, time
from playwright.sync_api import sync_playwright

here = os.path.dirname(os.path.abspath(__file__))
TARGETS = dict(
    ordinary=dict(react=0.35, acc=0.85), sloppy=dict(react=0.5, acc=0.7), sharp=dict(react=0.2, acc=0.97),
    ordinary_early=0.8,       # an ordinary player wins at least this share of levels 1-3
    sloppy_first=0.6,         # a sloppy player wins at least this share of level 1
    sharp_far=0.3,            # a sharp player still wins this share of level 40
    blind_rate=0.001,         # blind strings: at most one fight in a thousand overall
    blind_one=0.1,            # ...and no single string on one beat more than one in ten
)
fails, oks = [], 0
def ok(c, what, d=''):
    global oks
    if c: oks += 1
    else: fails.append(what); print('  FAIL', what, d)
def canon(p): return min(p[i:] + p[:i] for i in range(len(p)))

with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + os.path.join(here, 'index.html')); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.add_script_tag(path=os.path.join(here, 'bots.js'))
    rate = lambda name, levels, n=10, extra=None: {int(k2): v for k2, v in pg.evaluate("([o, L, n]) => { const r = {}; for (const N of L) { let w = 0; for (let s = 0; s < n; s++) w += __B.runHonest(N, 500 + s * 13 + N, o).won ? 1 : 0; r[N] = w / n; } return r; }", [dict(TARGETS[name], **(extra or {})), levels, n]).items()}
    # 23 Nov 2026, his note: "this isn't a game you can win... no winning here just move on to the next level": there is no right gate,
    # so the old tests (people who look win, blind tapping does not) no longer apply. Instead: every gatekeeper, careful or not, finishes
    # the day and goes on; nothing is ever marked wrong; the day ends by itself when the queue is empty.
    print('Every day ends and the next comes, whoever keeps the gate')
    for name in ('ordinary', 'sloppy', 'sharp'):
        r = rate(name, [1, 2, 3, 10, 40], 4); print(f'  {name:9s}', r); ok(all(v == 1 for v in r.values()), f'a {name} gatekeeper always finishes the day', str(r))
    r = pg.evaluate("() => { let w = 0, n = 0; for (const m of [0.1, 0.25, 0.5, 1]) for (const N of [1, 2, 3, 10]) for (let s = 0; s < 6; s++) { n++; w += __B.blindRandom(N, 4000 + s * 7 + N, m).won ? 1 : 0; } return [w, n]; }")
    print(f'  someone swiping at random: {r[0]} of {r[1]} days finished'); ok(r[0] == r[1], 'even swiping at random, the day ends and the next comes', str(r))
    r = pg.evaluate("() => { const S = __sim; S.start(5, { seed: 11 }); const G = S.G; for (let i = 0; i < 60 * 300 && !G.over; i++) { if (i % 40 === 0) S.BLIND[['u', 'd', 's', 'b'][(i / 40) % 4]](G); S.step(1 / 60); } return [G.over, G.wrong, G.sent, Math.round(G.t)]; }")
    print('  ', r); ok(r[0] == 'won' and r[1] == 0, 'nothing is ever marked wrong, and no clock runs out: the day ends when the queue is empty', str(r))
    print('Lessons')
    for N in (1, 2, 3):
        if not pg.evaluate(f'!!__sim.LESSONS[{N}]'): continue
        for name in ('ordinary', 'sloppy'):
            rs = pg.evaluate("([N, o]) => { const out = []; for (let s = 0; s < 5; s++) out.push(__B.runHonest(N, 200 + s, Object.assign({ teach: true }, o))); return out; }", [N, TARGETS[name]])
            took = [round(x['lessons'], 1) if x['lessons'] is not None else None for x in rs]; print(f'  level {N}, {name}: lessons took {took} s')
            ok(all(t is not None and t < 180 for t in took), f'a {name} player gets through the lessons of level {N}', str(took))
    r = pg.evaluate("() => { const S = __sim; S.start(1, { seed: 3, teach: true }); const G = S.G; for (let i = 0; i < 60 * 90; i++) { if (i % 9 === 0) S.BLIND[Object.keys(S.BLIND)[i % Object.keys(S.BLIND).length]](G); S.step(1 / 60); } return [G.over, !!G.lesson]; }")
    ok(r[0] != 'lost', 'nothing is lost while a lesson is on (90 s of tapping: any send counts here, so it may finish the day)', str(r))
    print('Sound')
    snd = pg.evaluate('__sim.soundCheck()'); bad = {k: v for k, v in snd.items() if isinstance(v, str) or v > 1.0 or v == 0}
    print('  ', snd); ok(not bad, 'every sound plays, without clipping', str(bad))
    ok(not errs, 'no JavaScript errors', str(errs[:3]))
    b.close()
print(f'\n{oks} checks passed, {len(fails)} failed.')
for f in fails: print('  -', f)
sys.exit(1 if fails else 0)
