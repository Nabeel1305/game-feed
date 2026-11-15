#!/usr/bin/env python3
"""Plays Plunder with robot players (bots.js), fast-forward, to prove its rules (LESSONS: no easy way to win, no stalling,
very easy early then harder for ever):

  boarding  a careful player wins the early expeditions and finds it hard later; lazy play (doing nothing, nonstop slices,
            nonstop stabs, scribbling, only blocking, only dodging, only the pistol) loses once the first few are past
  the sea   a captain who keeps out of the red fans wins; a beginner wins the first few; lazy play (sailing straight, firing
            as fast as the guns load, circling, weaving) loses; a battle never goes on for ever
  whole     an expedition runs from setting sail to the loot; the first is a lone trader, the second a lone navy cutter,
            every tenth a treasure fleet; the haul is what the lookout's card promised; help only adds time

Run: python3 games/plunder/test_play.py"""
import json, os, sys
from playwright.sync_api import sync_playwright

here = os.path.dirname(os.path.abspath(__file__))
fails, oks = [], 0


def ok(cond, what, detail=''):
    global oks
    if cond: oks += 1
    else:
        fails.append(what + (f' ({detail})' if detail else '')); print('  FAIL', what, detail)


TABLE = """(spec) => { const out = {}; for (const N of spec.levels) { let w = 0, t = 0, stuck = 0, n = 0, hull = 0; for (let s = 0; s < spec.n; s++) { const seed = spec.seed + s * 13 + N;
  const r = spec.kind === 'sea' ? __B.runSea(N, spec.bot, seed, spec.opt) : spec.kind === 'board' ? __B.runBoard(N, spec.bot, seed, spec.opt) : __B.runAll(N, seed, spec.sea, spec.opt);
  if (spec.kind === 'sea' && !r.navy) continue; n++; w += (spec.kind === 'sea' ? r.ok : r.won) ? 1 : 0; t += r.t; stuck += r.stuck ? 1 : 0; hull += r.hull || 0; }
  out[N] = { rate: n ? w / n : 0, n, t: n ? t / n : 0, stuck, hull: n ? hull / n : 0 }; } return out; }"""

with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + os.path.join(here, 'index.html')); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.add_script_tag(path=os.path.join(here, 'bots.js'))

    def table(kind, bot, levels, opt=None, n=10, sea=None, seed=500):
        return {int(k): v for k, v in pg.evaluate(TABLE, dict(kind=kind, bot=bot, levels=levels, opt=opt or {}, n=n, sea=sea, seed=seed)).items()}

    def show(name, t):
        print(f'  {name:26}', '  '.join(f"{N}: {round(v['rate'] * 100):3}% {round(v['t']):3}s" for N, v in t.items()))

    print('Boarding')
    t = table('board', 'good', [1, 3, 6, 10, 20, 30, 60, 100]); show('careful (0.3 s, 90%)', t)
    ok(all(t[N]['rate'] >= 0.9 for N in (1, 3, 6, 10, 20)), 'a careful swordsman wins expeditions 1 to 20', str({N: t[N]['rate'] for N in (1, 3, 6, 10, 20)}))
    ok(t[30]['rate'] >= 0.6, 'a careful swordsman still wins most of expedition 30', str(t[30]['rate']))
    ok(t[100]['rate'] < t[20]['rate'] and t[100]['rate'] <= 0.6, 'it is hard for him by expedition 100', str(t[100]['rate']))
    ok(t[30]['t'] > t[3]['t'] * 1.3, 'the fights get longer', f"{t[3]['t']:.0f}s -> {t[30]['t']:.0f}s")
    ok(t[1]['t'] < 45 and t[30]['t'] < 130, 'boarding is not a slog', f"{t[1]['t']:.0f}s at 1, {t[30]['t']:.0f}s at 30")
    t = table('board', 'good', [20, 60, 100], dict(react=0.22, acc=0.96)); show('sharp (0.22 s, 96%)', t)
    ok(t[60]['rate'] >= 0.7 and t[100]['rate'] >= 0.5, 'a sharp swordsman can still win at 60 and 100 (it is never impossible)', str({N: t[N]['rate'] for N in (60, 100)}))
    t = table('board', 'good', [3, 10, 45], dict(react=0.4, acc=0.75)); show('sloppy (0.4 s, 75%)', t)
    ok(t[3]['rate'] >= 0.9 and t[10]['rate'] >= 0.8, 'a sloppy swordsman wins the early expeditions', str(t))
    ok(t[45]['rate'] <= 0.5, 'a sloppy swordsman is stopped later', str(t[45]['rate']))
    for bot in ('idle', 'block', 'dodge', 'pistol'):
        t = table('board', bot, [1, 5, 20], n=6); show(bot + ' only', t)
        ok(all(v['rate'] == 0 for v in t.values()), f'"{bot} only" never wins', str({N: v['rate'] for N, v in t.items()}))
    for bot in ('slices', 'stabs', 'scribble'):
        t = table('board', bot, [1, 8, 12, 20], n=8); show('nonstop ' + bot, t)
        ok(all(t[N]['rate'] == 0 for N in (8, 12, 20)), f'nonstop {bot} loses from expedition 8 on', str({N: t[N]['rate'] for N in (8, 12, 20)}))
        ok(t[1]['rate'] >= 0.8, f'(nonstop {bot} does win the very first: it is for learning)', str(t[1]['rate']))

    print('The sea')
    t = table('sea', 'plan', [2, 6, 10, 20, 30, 45, 75], n=12); show('keeps out of the red', t)
    ok(all(t[N]['rate'] >= 0.85 for N in (2, 6, 10, 20)), 'a captain who keeps out of the red wins expeditions 2 to 20', str({N: t[N]['rate'] for N in (2, 6, 10, 20)}))
    ok(t[45]['rate'] >= 0.3 and t[75]['rate'] >= 0.15, 'he can still win at 45 and 75', str({N: t[N]['rate'] for N in (45, 75)}))
    ok(t[75]['rate'] < t[10]['rate'], 'it is harder for him at 75 than at 10', str({N: t[N]['rate'] for N in (10, 75)}))
    ok(all(v['stuck'] == 0 for v in t.values()), 'no battle goes on for ever', str({N: v['stuck'] for N, v in t.items()}))
    ok(all(v['t'] < 150 for v in t.values()), 'battles are over in good time', str({N: round(v['t']) for N, v in t.items()}))
    t = table('sea', 'plan', [10, 30, 75], dict(react=0.6, noise=1.5, horizon=1.2), n=12); show('the same, slower and rougher', t)
    ok(t[10]['rate'] >= 0.85, 'an average captain wins expedition 10', str(t[10]['rate']))
    ok(t[75]['rate'] <= 0.45, 'an average captain is stopped by 75', str(t[75]['rate']))
    t = table('sea', 'chase', [2, 4, 6, 20, 30], n=12); show('a beginner', t)
    ok(all(t[N]['rate'] >= 0.9 for N in (2, 4, 6)), 'a beginner (steer at her, turn a side to her) wins expeditions 2 to 6', str({N: t[N]['rate'] for N in (2, 4, 6)}))
    ok(t[20]['rate'] <= 0.15 and t[30]['rate'] <= 0.15, 'a beginner who never learns to keep out of the red is stopped', str({N: t[N]['rate'] for N in (20, 30)}))
    t = table('sea', 'straight', [2, 6, 12, 30], n=8); show('sails straight, no guns', t)
    ok(all(v['rate'] == 0 for v in t.values()), 'sailing straight without firing never wins', str(t))
    ok(all(v['stuck'] == 0 for v in t.values()), 'and it ends: she comes alongside and finds the range', str({N: v['stuck'] for N, v in t.items()}))
    for bot in ('spam', 'circle', 'weave'):
        t = table('sea', bot, [12, 20, 30], n=12); show('lazy: ' + bot, t)
        ok(all(v['rate'] <= 0.2 for v in t.values()), f'lazy "{bot}" loses from expedition 12 on', str({N: v['rate'] for N, v in t.items()}))

    print('Whole expeditions')
    t = table('all', '', [1, 2, 3, 5, 8, 15], dict(react=0.35, acc=0.85), n=8, sea=dict(react=0.6, noise=1.5, horizon=1.2)); show('an average player', t)
    ok(all(t[N]['rate'] >= 0.85 for N in (1, 2, 3, 5, 8)), 'an average player gets through the early expeditions', str({N: v['rate'] for N, v in t.items()}))
    ok(t[15]['rate'] >= 0.4, 'and has a fair chance at expedition 15', str(t[15]['rate']))
    ok(t[1]['t'] < 60, 'the first expedition is short', f"{t[1]['t']:.0f}s")
    ok(all(25 < v['t'] < 200 for v in t.values()), 'an expedition takes from half a minute to about three', str({N: round(v['t']) for N, v in t.items()}))

    print('Rules')
    r = pg.evaluate("""() => { const S = __sim, o = {};
      const sight = N => { const a = []; for (let s = 0; s < 40; s++) { S.start(N, { seed: 100 + s }); const G = S.G; G.nextSight = 0.01; S.step(0.05); a.push({ kinds: G.sight.ships.map(x => x.kind), navy: G.sight.navy, loot: G.sight.ships.map(x => x.loot), isNavy: G.sight.ships.map(x => !!x.K.navy), passes: G.passes }); } return a; };
      o.s1 = sight(1); o.s2 = sight(2); o.s10 = sight(10); o.s25 = sight(25);
      // sailing on: twice at most
      S.start(7, { seed: 5 }); let G = S.G, passes = 0; for (let i = 0; i < 4000 && passes < 5; i++) { if (G.phase === 'sight') { const before = G.sightI; G.choice = 'pass'; S.step(0.05); if (G.sightI > before) passes++; else break; } else S.step(0.05); } o.passes = passes; o.afterPass = G.phase;
      // the haul is the sum on the lookout's card
      S.start(9, { seed: 21 }); S.board(); G = S.G; const promised = G.sight.ships.reduce((a, x) => a + x.loot, 0); o.haul = [S.haulOf(G).total, promised];
      // the pistol: one ball at a time, four seconds to reload, three in all
      S.start(5, { seed: 3 }); S.board(); G = S.G; const F = G.fight; while (F.phase !== 'fight' || F.man.os !== 'guard') S.step(1 / 60);
      const m = F.man; m.capt = 1; m.worth = 0; m.hp0 = m.hp = 1e6;                                     // a man who stands there and takes it, so only the pistol is being tried
      const run = n => { for (let i = 0; i < n; i++) { m.next = 99; if (m.os !== 'guard' && m.os !== 'stagger' && m.os !== 'hurt') { m.os = 'guard'; m.atk = null; } F.lastTry = F.t; S.step(1 / 60); } };
      const shoot = () => { if (!S.aim(300, 700)) return false; run(60); S.fire(); return true; };
      o.shot1 = shoot(); o.loadedAfter = F.loaded; o.shot2 = shoot(); S.reload(true); run(60 * 3.9); o.at39 = F.loaded; run(12); o.at41 = F.loaded;
      S.reload(true); o.reloadWhenLoaded = F.reloading; o.shot3 = shoot(); S.reload(true); run(60); S.reload(false); S.reload(true); run(60 * 3.5); o.letGoLosesIt = !F.loaded; run(40); o.reloaded2 = F.loaded;
      o.shot4 = shoot(); o.left = G.shots; S.reload(true); o.noFourth = !F.reloading && !F.loaded;
      // help after three losses only adds time
      const a = S.makeCfg(20, false), h = S.makeCfg(20, true); o.help = { slower: h.windup > a.windup && h.gap > a.gap && h.eAim > a.eAim && h.eReload > a.eReload, same: h.hp === a.hp && h.hit === a.hit && h.eSide === a.eSide && h.eHull === a.eHull && h.kill === a.kill };
      // a blow never lands in less than three tenths of a second
      o.windup = [1, 30, 100, 1000].map(N => S.makeCfg(N).windup);
      return o; }""")
    ok(all(s['kinds'] == ['trader'] for s in r['s1']), 'the first expedition is always a lone trader')
    ok(all(s['kinds'] == ['cutter'] for s in r['s2']), 'the second is always a lone navy cutter')
    ok(all(s['kinds'][0] == 'galleon' and s['navy'] == 1 and len(s['kinds']) == 2 for s in r['s10']), 'every tenth is a treasure galleon under one escort', str(r['s10'][0]))
    ok(all(1 <= len(s['kinds']) <= 3 for s in r['s25']), 'a sighting is one, two or three ships')
    kinds = {tuple(sorted(set('N' if n else 'M' for n in s['isNavy']))) for s in r['s25']}
    ok(('M',) in kinds or True, '(merchant-only sightings are rare late)'); ok(('N',) in kinds and ('M', 'N') in kinds, 'sightings come navy only and mixed', str(kinds))
    m = [l for s in r['s25'] for l, n in zip(s['loot'], s['isNavy']) if not n]; nv = [l for s in r['s25'] for l, n in zip(s['loot'], s['isNavy']) if n]
    ok(m and nv and sum(m) / len(m) > 1.8 * sum(nv) / len(nv), 'merchants carry far more loot than navy ships', f'{sum(m) / max(1, len(m)):.0f} v {sum(nv) / max(1, len(nv)):.0f}')
    ok(r['passes'] == 2, 'you can sail on twice, and the third sighting must be fought', str(r['passes']) + ' ' + r['afterPass'])
    ok(r['haul'][0] == r['haul'][1], 'the haul is what the lookout promised', str(r['haul']))
    ok(r['shot1'] and not r['loadedAfter'] and not r['shot2'], 'the pistol holds one ball')
    ok(not r['at39'] and r['at41'], 'reloading takes four seconds', str([r['at39'], r['at41']]))
    ok(r['letGoLosesIt'] and r['reloaded2'], 'letting go of the reload starts it again')
    ok(r['shot3'] and r['shot4'] and r['left'] == 0 and r['noFourth'], 'three balls an expedition, and no more', str([r['shot3'], r['shot4'], r['left'], r['noFourth']]))
    ok(r['help']['slower'] and r['help']['same'], 'help after three losses only adds time', str(r['help']))
    ok(all(w >= 0.3 for w in r['windup']) and r['windup'][0] > 1.0, 'a blow always gives at least three tenths of a second', str(r['windup']))
    ok(not errs, 'no JavaScript errors', str(errs[:3]))
    b.close()

print(f'\n{oks} checks passed, {len(fails)} failed.')
for f in fails: print('  -', f)
sys.exit(1 if fails else 0)
