#!/usr/bin/env python3
"""Plays Plunder with robot players (bots.js), fast-forward, to prove its rules (LESSONS: no easy way to win, no stalling,
very easy early then harder for ever). Above all: SPAMMING CANNOT WIN, on any expedition, the first included.

A handful of lazy robots proves little (the first lot here all lost, and "swipe down the middle three times a second" still
won the first expeditions). So the proof is a search, with players who are not looking at all:

  boarding  every string of up to four moves (taps, slices, block strokes on either side, strokes that block and cut at once,
            dodges, waits) on twelve beats from frantic to slow: about 300,000 fights, none won. Then long sparse rhythms,
            moves drawn at random, and "pistol first, then a rhythm". The rhythms that get furthest are played hundreds of
            times more. And the old lazy robots: nothing, only blocking, only dodging, only the pistol, mashing.
            Players who look: block his blow on the side it comes from, then strike. They win the early expeditions even
            when sloppy, find it hard later, and a sharp one can still win at 100.
  the sea   every two-part plan for the wheel with six beats for FIRE, and 900 random plans of two to four parts with ten
            beats: about 20,000 battles, almost none won, and none goes on for ever. And the lazy captains: straight, hard
            over, flung about, a slow circle or a steady wiggle with FIRE mashed, or pressed whenever a ship is in the arc,
            or only when it lights. A beginner (steer at her, turn a side to her, let the wheel go, fire when it lights)
            wins the first few; a captain who looks ahead wins far further.
  whole     an expedition runs from setting sail to the loot; the first is a lone trader, the second a lone navy cutter,
            every tenth a treasure fleet; the haul is what the lookout's card promised; help only adds time

Run: python3 games/plunder/test_play.py      (about twelve minutes)"""
import itertools, json, os, random, sys, time
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
DEEP = "([pat, P, N, n]) => { let w = 0, parts = [0, 0, 0, 0]; for (let s = 0; s < n; s++) { const r = __B.blindBeat(N, 7000 + s * 17 + N, pat, P); if (r.won) w++; parts[r.parts]++; } return { w, parts }; }"


def canon(p): return min(p[i:] + p[:i] for i in range(len(p)))


def strings(alpha, lengths, keep=lambda q: True):      # every string of moves, once (a rhythm is the same wherever you start it)
    out = set()
    for L in lengths:
        for t in itertools.product(alpha, repeat=L):
            q = ''.join(t)
            if set(q) <= set('.D') or not keep(q): continue
            if any(L % d == 0 and q == q[:d] * (L // d) for d in range(1, L)): continue
            out.add(canon(q))
    return sorted(out, key=lambda q: (len(q), q))


with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + os.path.join(here, 'index.html')); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.add_script_tag(path=os.path.join(here, 'bots.js'))

    def table(kind, bot, levels, opt=None, n=10, sea=None, seed=500):
        return {int(k): v for k, v in pg.evaluate(TABLE, dict(kind=kind, bot=bot, levels=levels, opt=opt or {}, n=n, sea=sea, seed=seed)).items()}

    def show(name, t):
        print(f'  {name:26}', '  '.join(f"{N}: {round(v['rate'] * 100):3}% {round(v['t']):3}s" for N, v in t.items()), flush=True)

    def beats(pats, Ps, levels, n, seed=900):
        rows = []
        for i in range(0, len(pats), 10): rows += pg.evaluate('(spec) => __B.blindBeats(spec)', dict(pats=pats[i:i + 10], Ps=Ps, levels=levels, n=n, seed=seed))
        return rows

    # ------------------------------------------------------------------ boarding: players who look
    print('Boarding: players who look')
    t = table('board', 'good', [1, 3, 6, 10, 20, 30, 60, 100]); show('careful (0.3 s, 90%)', t)
    ok(all(t[N]['rate'] >= 0.9 for N in (1, 3, 6, 10, 20)), 'a careful swordsman wins expeditions 1 to 20', str({N: t[N]['rate'] for N in (1, 3, 6, 10, 20)}))
    ok(t[30]['rate'] >= 0.6, 'a careful swordsman still wins most of expedition 30', str(t[30]['rate']))
    ok(t[100]['rate'] < t[20]['rate'] and t[100]['rate'] <= 0.6, 'it is hard for him by expedition 100', str(t[100]['rate']))
    ok(t[30]['t'] > t[3]['t'] * 1.3, 'the fights get longer', f"{t[3]['t']:.0f}s -> {t[30]['t']:.0f}s")
    ok(t[1]['t'] < 50 and t[30]['t'] < 130, 'boarding is not a slog', f"{t[1]['t']:.0f}s at 1, {t[30]['t']:.0f}s at 30")
    t = table('board', 'good', [20, 60, 100], dict(react=0.22, acc=0.96, greed=0.05)); show('sharp (0.22 s, 96%)', t)
    ok(t[60]['rate'] >= 0.7 and t[100]['rate'] >= 0.5, 'a sharp swordsman can still win at 60 and 100 (it is never impossible)', str({N: t[N]['rate'] for N in (60, 100)}))
    t = table('board', 'good', [1, 3, 10, 30], dict(react=0.35, acc=0.85, timing='any')); show('ordinary (blocks any time)', t)
    ok(all(t[N]['rate'] >= 0.9 for N in (1, 3, 10)), 'an ordinary player, who blocks without waiting for the last moment, wins the early expeditions', str({N: v['rate'] for N, v in t.items()}))
    t = table('board', 'good', [1, 2, 3, 30], dict(react=0.45, acc=0.7, timing='any', greed=0.3), n=20); show('sloppy (0.45 s, 70%)', t)
    ok(t[1]['rate'] >= 0.7 and t[2]['rate'] >= 0.4 and t[3]['rate'] >= 0.7, 'even a sloppy player wins the first expeditions, so long as he blocks and then strikes', str({N: v['rate'] for N, v in t.items()}))
    ok(t[30]['rate'] <= 0.2, 'a sloppy player is stopped later', str(t[30]['rate']))
    t = table('board', 'good', [1, 3, 7, 10], dict(react=0.55, acc=0.6, timing='any', greed=0.4, burst=2), n=20); show('very sloppy, attacks first', t)
    ok(all(t[N]['rate'] >= 0.6 for N in (1, 3, 7)), 'a very sloppy player who attacks first and blocks six in ten still wins most of the early expeditions', str({N: v['rate'] for N, v in t.items()}))

    # ------------------------------------------------------------------ boarding: players who do not look
    print('Boarding: players who do not look')
    for bot in ('idle', 'block', 'dodge', 'pistol'):
        t = table('board', bot, [1, 5, 20], n=6); show(bot + ' only', t)
        ok(all(v['rate'] == 0 for v in t.values()), f'"{bot} only" never wins', str({N: v['rate'] for N, v in t.items()}))
    for bot, what in (('slices', 'nonstop slices'), ('stabs', 'nonstop stabs'), ('scribble', 'scribbling'), ('slow', 'a steady beat of blows, never a block'), ('slowscribble', 'slow random swipes')):
        t = table('board', bot, [1, 2, 3, 6, 20], n=12); show(what, t)
        ok(all(v['rate'] == 0 for v in t.values()), f'SPAM: {what} never wins, not even the first expedition', str({N: v['rate'] for N, v in t.items()}))
    t0 = time.time(); pats = strings('TSLR/\\D.UB', (1, 2, 3, 4)); Ps = [0.12, 0.2, 0.26, 0.33, 0.4, 0.5, 0.6, 0.7, 0.85, 1.0, 1.25, 1.6]
    rows = beats(pats, Ps, [1, 2, 3], 3); fights = len(rows) * 9; won = sum(sum(r['w'].values()) for r in rows)
    print(f'  every rhythm of up to four moves: {len(pats)} strings x {len(Ps)} beats x expeditions 1 2 3 x 3 = {fights} fights, won {won}   ({time.time() - t0:.0f} s)', flush=True)
    ok(won <= fights * 0.0001, 'SPAM: no blind rhythm of up to four moves wins (fewer than one fight in ten thousand)', f'{won} of {fights}: ' + str([(r['pat'], r['P'], r['w']) for r in rows if sum(r['w'].values())][:8]))
    ok(max(sum(r['w'].values()) for r in rows) <= 1, 'and none wins twice in its nine fights', str(max(rows, key=lambda r: sum(r['w'].values()))))
    rows.sort(key=lambda r: -r['parts']); worst = 0
    for r in rows[:12]:
        d = pg.evaluate(DEEP, [r['pat'], r['P'], 1, 300]); worst = max(worst, d['w'])
        print(f"    furthest: {r['pat']:5} every {r['P']:.2f} s   300 more on expedition 1: won {d['w']}, parts of the ship taken {d['parts']}", flush=True)
        ok(d['w'] <= 18, f"the rhythm that got furthest ({r['pat']} every {r['P']} s) wins at most six fights in a hundred on the first expedition (a blind coin-flip block now and then)", str(d))
    long_ = strings('TR./D', (5, 6), lambda q: q.count('.') >= len(q) - 3); rows = beats(long_, [0.2, 0.3, 0.4, 0.5, 0.6, 0.75], [1], 4, 1200); won = sum(sum(r['w'].values()) for r in rows)
    print(f'  long, sparse rhythms: {len(long_)} strings x 6 beats x 4 on expedition 1 = {len(rows) * 4} fights, won {won}', flush=True)
    ok(won <= len(rows) * 4 * 0.002, 'SPAM: long, sparse rhythms win almost never (under one fight in five hundred)', f'{won}: ' + str([(r['pat'], r['P']) for r in rows if sum(r['w'].values())][:6]))
    tot = wonr = 0
    for bag in ('TS', 'TSLR', 'LRT', 'LR/\\', 'TSLRD', 'LRTD', '/\\', 'LRUBTS/\\D'):
        for mean in (0.15, 0.3, 0.5, 0.8, 1.2):
            r = pg.evaluate("([bag, mean]) => { let w = 0, n = 0; for (const N of [1, 2, 3]) for (let s = 0; s < 80; s++) { n++; w += __B.blindRandom(N, 4000 + s * 7 + N, bag, mean).won ? 1 : 0; } return [w, n]; }", [bag, mean]); wonr += r[0]; tot += r[1]
    print(f'  no beat at all (moves drawn at random, at random gaps): {tot} fights, won {wonr}', flush=True)
    ok(wonr <= tot * 0.0005, 'SPAM: moves thrown at random almost never win', f'{wonr} of {tot}')
    tot = wong = 0
    for pat, P in (('.RT', 0.5), ('.R/', 0.6), ('T', 0.3), ('..R/', 0.6)):
        for hold in (0.5, 1.2, 2.0):
            r = pg.evaluate("([pat, P, hold]) => { let w = 0, n = 0; for (const N of [1, 2, 3, 6]) for (let s = 0; s < 100; s++) { n++; w += __B.blindGun(N, 5000 + s * 7 + N, pat, P, hold).won ? 1 : 0; } return [w, n]; }", [pat, P, hold]); wong += r[0]; tot += r[1]
    print(f'  the pistol first (raise, hold, fire, reload, three times), then a rhythm: {tot} fights, won {wong}', flush=True)
    ok(wong <= tot * 0.003, 'SPAM: the pistol fired without aiming, then a rhythm, does not win', f'{wong} of {tot}')

    # ------------------------------------------------------------------ the sea: captains who look
    print('The sea: captains who look')
    t = table('sea', 'chase', [2, 3, 4, 6, 20, 30], n=30); show('a beginner', t)
    ok(all(t[N]['rate'] >= 0.9 for N in (2, 3, 4)), 'a beginner (steer at her, turn a side to her, let the wheel go, fire when it lights) wins expeditions 2 to 4', str({N: t[N]['rate'] for N in (2, 3, 4)}))
    ok(t[20]['rate'] <= 0.15 and t[30]['rate'] <= 0.15, 'a beginner who never learns to keep out of the red is stopped', str({N: t[N]['rate'] for N in (20, 30)}))
    t = table('sea', 'plan', [2, 3, 4, 6, 10, 20, 45, 75], dict(react=0.6, noise=1.5, horizon=1.2), n=30); show('looks a second ahead', t)
    ok(all(t[N]['rate'] >= 0.85 for N in (2, 3, 4, 6)), 'a captain who looks ahead and keeps out of the red wins expeditions 2 to 6', str({N: t[N]['rate'] for N in (2, 3, 4, 6)}))
    ok(t[10]['rate'] >= 0.6, 'and most of expedition 10', str(t[10]['rate']))
    ok(t[20]['rate'] >= 0.15 and t[45]['rate'] + t[75]['rate'] >= 0.1, 'he can still win at 20, 45 and 75', str({N: t[N]['rate'] for N in (20, 45, 75)}))
    ok(t[75]['rate'] < t[10]['rate'] and t[75]['rate'] <= 0.45, 'it is far harder for him at 75 than at 10', str({N: t[N]['rate'] for N in (10, 75)}))
    ok(all(v['stuck'] == 0 for v in t.values()), 'no battle goes on for ever', str({N: v['stuck'] for N, v in t.items()}))
    ok(all(v['t'] < 150 for v in t.values()), 'battles are over in good time', str({N: round(v['t']) for N, v in t.items()}))
    t = table('sea', 'plan', [2, 4, 10], n=30); show('looks two seconds ahead', t)
    ok(t[2]['rate'] >= 0.9 and t[4]['rate'] >= 0.85 and t[10]['rate'] >= 0.3, 'so does one who looks further ahead', str({N: v['rate'] for N, v in t.items()}))

    # ------------------------------------------------------------------ the sea: captains who do not look
    print('The sea: captains who do not look')
    for bot, what in (('straight', 'sailing straight, no guns'), ('spam', 'sailing straight, FIRE as fast as it will go'), ('circle', 'the wheel hard over, FIRE as fast as it will go'),
                      ('weave', 'the wheel flung side to side, FIRE as fast as it will go'), ('gentlespam', 'a gentle wiggle, FIRE as fast as it will go'), ('arcweave', 'a gentle wiggle, FIRE whenever a ship is in the gold arc'),
                      ('litstraight', 'sailing straight, FIRE whenever it lights'), ('litcircle', 'the wheel hard over, FIRE whenever it lights'), ('gentle', 'a slow circle, FIRE whenever it lights'), ('gentleweave', 'a gentle wiggle, FIRE whenever it lights')):
        t = table('sea', bot, [2, 3, 6, 12, 30], n=12); show(what[:26], t)
        ok(all(v['rate'] == 0 for v in t.values()), f'SPAM: {what}, never wins, not even the first battle', str({N: v['rate'] for N, v in t.items()}))
        ok(all(v['stuck'] == 0 for v in t.values()), f'and it ends ({bot})', str({N: v['stuck'] for N, v in t.items()}))
    t0 = time.time(); ruds = [-1, -0.5, -0.3, 0, 0.3, 0.5, 1]; durs = [0.6, 1.2, 2.5, 5]; plans, seen = [], set()
    for k in (1, 2):
        for segs in itertools.product([(r, d) for r in ruds for d in durs], repeat=k):
            if (k == 1 and segs[0][1] != durs[0]) or (k > 1 and all(s[0] == segs[0][0] for s in segs)): continue
            mir = tuple((-r, d) for r, d in segs); key = min(min(segs[i:] + segs[:i] for i in range(k)), min(mir[i:] + mir[:i] for i in range(k)))
            if key in seen: continue
            seen.add(key); plans += [[list(map(list, key)), Q] for Q in (0, 0.07, 0.6, 1.5, 3.7, 6)]
    random.seed(7)
    for _ in range(900):
        segs = [[random.choice([-1, -0.6, -0.35, -0.2, 0, 0.2, 0.35, 0.6, 1]), random.choice([0.4, 0.8, 1.5, 2.5, 4, 6])] for _ in range(random.choice([2, 3, 3, 4]))]
        if len(set(s[0] for s in segs)) > 1: plans.append([segs, random.choice([0.07, 0.3, 0.6, 1.0, 1.5, 2.5, 3.7, 5, 8, 12])])
    rows = []
    for i in range(0, len(plans), 40): rows += pg.evaluate('(spec) => __B.blindSeas(spec)', dict(plans=plans[i:i + 40], levels=[2, 3, 4, 6], n=3, seed=500))
    tot = sum(r['n'] for r in rows); won = sum(r['w'] for r in rows); stuck = sum(r['stuck'] for r in rows)
    print(f'  every plan for the wheel and beat for FIRE: {len(plans)} plans, {tot} battles on expeditions 2 3 4 6, won {won}, never ended {stuck}   ({time.time() - t0:.0f} s)', flush=True)
    ok(won <= tot * 0.0006, 'SPAM: a wheel on a fixed plan with FIRE on a fixed beat does not win (fewer than one battle in fifteen hundred)', f'{won} of {tot}: ' + str([(r['segs'], r['Q']) for r in rows if r['w']][:6]))
    ok(stuck == 0, 'and every one of those battles ends', str(stuck))
    for r in sorted(rows, key=lambda r: -r['w'])[:6]:
        d = pg.evaluate("([segs, Q]) => { let w = 0, k = 0; for (const N of [2, 3]) for (let s = 0; s < 100; s++) { const r = __B.blindSea(N, 9000 + s * 13 + N, segs, Q); if (!r.navy) continue; k++; w += r.ok ? 1 : 0; } return [w, k]; }", [r['segs'], r['Q']])
        print(f"    closest: wheel {r['segs']} FIRE every {r['Q']}   more battles on expeditions 2 and 3: won {d[0]} of {d[1]}", flush=True)
        ok(d[0] <= d[1] * 0.04, 'the blind captain that came closest wins fewer than four battles in a hundred', f"{r['segs']} {r['Q']}: {d}")
    t = table('sea', 'sweep2', [2, 3, 6, 12], n=12); show('hard over, let go, repeat', t)      # (told, not judged: a set routine for the wheel, but watching the FIRE light)
    print('    (not judged: "hard one way, let go, hard the other, let go", pressing FIRE only when it lights. It is watching one thing, and it fades after the first two navy fights.)')

    # ------------------------------------------------------------------ whole expeditions
    print('Whole expeditions')
    t = table('all', '', [1, 2, 3, 5, 8], dict(react=0.35, acc=0.85, timing='any'), n=10, sea=dict(react=0.6, noise=1.5, horizon=1.2)); show('an average player', t)
    ok(all(t[N]['rate'] >= 0.8 for N in (1, 2, 3, 5)), 'an average player gets through the early expeditions', str({N: v['rate'] for N, v in t.items()}))
    ok(t[8]['rate'] >= 0.4, 'and has a fair chance at expedition 8', str(t[8]['rate']))
    ok(t[1]['t'] < 80, 'the first expedition is short', f"{t[1]['t']:.0f}s")
    ok(all(25 < v['t'] < 220 for v in t.values()), 'an expedition takes from half a minute to about three', str({N: round(v['t']) for N, v in t.items()}))

    # ------------------------------------------------------------------ the rules, one at a time
    print('Rules')
    r = pg.evaluate("""() => { const S = __sim, o = {};
      const sight = N => { const a = []; for (let s = 0; s < 40; s++) { S.start(N, { seed: 100 + s }); const G = S.G; G.nextSight = 0.01; S.step(0.05); a.push({ kinds: G.sight.ships.map(x => x.kind), navy: G.sight.navy, loot: G.sight.ships.map(x => x.loot), isNavy: G.sight.ships.map(x => S.KINDS[x.kind].navy) }); } return a; };
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
      // ...and it never comes up pointing at him: raised and fired without a touch of the thumb, it hits nothing
      let hitsBlind = 0, hitsAimed = 0; for (let s = 0; s < 40; s++) { S.start(1, { seed: 300 + s }); S.board(); const G = S.G, F = G.fight; while (F.phase !== 'fight' || F.man.os !== 'guard') S.step(1 / 60); const m = F.man; m.next = 99; const hp = m.hp;
        S.aim(332, 770); for (let i = 0; i < 72; i++) { m.next = 99; S.step(1 / 60); } if (s % 2) { const p = S.aimAt(), g = S.geo(); S.aimMove(332 + (g.chest.x - p.x) / 1.3, 770 + (g.chest.y - p.y) / 1.3); S.step(1 / 60); } S.fire(); S.step(1 / 60); if (m.hp < hp) { if (s % 2) hitsAimed++; else hitsBlind++; } }
      o.gun = [hitsBlind, hitsAimed];
      // the fight's one rule. A man on guard turns your blow aside and cuts you for it, harder each time...
      const fight = (N, seed) => { S.start(N, { seed }); S.board(); const G = S.G, F = G.fight; while (F.phase !== 'fight' || F.man.os !== 'guard') S.step(1 / 60); F.man.next = 99; return [G, F, F.man]; };
      const wait = (m, st) => { let n = 0; while (!st.includes(m.os) && n++ < 600) S.step(1 / 60); };
      // ...you can attack first: blows on his sword knock his footing, two or three break his guard, and then your blows land
      { const [G, F, m] = fight(3, 9), g = S.geo(), hp0 = m.hp; let knocks = 0;
        while (!(m.os === 'stagger' && m.broke) && knocks < 8) { wait(m, ['guard']); m.next = 99; S.poke(g.chest.x, g.chest.y); m.cnt = false; knocks++; for (let k = 0; k < 24; k++) { m.next = 99; S.step(1 / 60); } }
        const unhurt = m.hp === hp0; S.stroke(g.chest.x - 60, g.chest.y, g.chest.x + 60, g.chest.y + 10); o.broke = { knocks, unhurt, lands: m.hp < hp0 };
        // ...and once he is set again, a blow at his guard is turned and he cuts you for it, harder each time
        const costs = []; for (let i = 0; i < 4; i++) { wait(m, ['guard']); m.next = 99; m.set = 9; for (let k = 0; k < 30; k++) { m.next = 99; S.step(1 / 60); } const t0 = F.tide; S.poke(g.chest.x, g.chest.y); for (let k = 0; k < 40; k++) { m.next = 99; S.step(1 / 60); } costs.push(+(t0 - F.tide).toFixed(4)); if (G.over) break; }
        o.turned = { costs, lost: G.over === 'lost' || F.tide <= 0.001 }; }
      // ...and for a moment after you block his blow he is open, and your blow lands
      const blockIt = (m, how) => { const A = m.atk, C = S.you(), f = S.fu(); if (A.kind !== 'cut') { S.stroke(A.px - 50, A.py - 30, A.px + 50, A.py + 30); return; }
        const u = how === 'centre' ? 0.5 : 0.22, px = A.sx + (A.ex - A.sx) * u, py = A.sy + (A.ey - A.sy) * u, nx = -(A.ey - A.sy), ny = A.ex - A.sx, n = Math.hypot(nx, ny), q = 55 * f / n;
        if (how === 'wrong') S.stroke(2 * C.x - px - nx * q, py - ny * q, 2 * C.x - px + nx * q, py + ny * q);      // the mirror image: out on the other side
        else if (how === 'across') S.stroke(C.x - 150 * f, C.y - 60 * f, C.x + 150 * f, C.y - 60 * f);               // clean across the screen
        else S.stroke(px - nx * q, py - ny * q, px + nx * q, py + ny * q); };
      const attack = (N, seed) => { const [G, F, m] = fight(N, seed); m.next = 0; wait(m, ['windup']); while (m.atk.kind !== 'cut') { m.os = 'guard'; m.next = 0; S.step(1 / 60); wait(m, ['windup']); } for (let i = 0; i < 24; i++) S.step(1 / 60); return [G, F, m]; };
      { const [G, F, m] = attack(1, 12); const hp0 = m.hp, t0 = F.tide; blockIt(m, 'right'); S.step(1 / 60); const open = m.os === 'stagger' || (m.os === 'recover' && m.open), g = S.geo(); S.stroke(g.chest.x - 60, g.chest.y, g.chest.x + 60, g.chest.y + 10); o.block = { open, lands: m.hp < hp0, tide: F.tide > t0 }; }
      // a block must meet his blade on the side it comes from: through the middle of him, on the wrong side, or clean across, it is no block
      o.side = {}; for (const how of ['centre', 'wrong', 'across']) { let blocked = 0; for (let s = 0; s < 12; s++) { const [G, F, m] = attack(1, 40 + s); const w0 = G.took.wounds; blockIt(m, how); wait(m, ['guard', 'recover', 'stagger']); if (m.os === 'stagger' || (m.os === 'recover' && m.open)) blocked++; } o.side[how] = blocked; }
      // one block for each blow: a miss, and a second stroke (a good one) does not save you
      { const [G, F, m] = attack(1, 15); const w0 = G.took.wounds; blockIt(m, 'wrong'); for (let i = 0; i < 20; i++) S.step(1 / 60); blockIt(m, 'right'); wait(m, ['guard', 'recover', 'stagger']); o.once = { hit: G.took.wounds > w0, open: m.os === 'stagger' || !!m.open }; }
      // ...but a dodge does (and a dodge only saves you: it does not open him)
      { const [G, F, m] = attack(1, 15); const w0 = G.took.wounds; blockIt(m, 'wrong'); while (m.os === 'windup' && m.atk.wind - m.ot > 0.15) S.step(1 / 60); S.dodge(); wait(m, ['guard', 'recover', 'stagger']); o.dodge = { hit: G.took.wounds > w0, open: m.os === 'stagger' || !!m.open }; }
      // no one stroke blocks both sides: try 3000 strokes against 60 cuts of the first expedition
      { const [G, F, m] = fight(1, 5); const cuts = []; for (let i = 0; i < 60; i++) cuts.push(Object.assign({ kind: 'cut' }, S.makeAtk('cut'))); let rs = 12345; const R = () => { rs = (Math.imul(rs, 1103515245) + 12345) & 0x7fffffff; return rs / 0x7fffffff; }; let best = 0, any = 0;
        for (let i = 0; i < 3000; i++) { const ax = R() * 390, ay = 200 + R() * 400, bx = R() * 390, by = 200 + R() * 400; if (Math.hypot(bx - ax, by - ay) < 40) continue; let k = 0; for (const A of cuts) if (S.judge(A, ax, ay, bx, by)) k++; best = Math.max(best, k / cuts.length); if (k) any++; }
        const left = cuts.filter(A => Math.cos(A.ang) < 0).length / cuts.length; o.oneStroke = { best, left, any }; }
      // the sea's one rule. A broadside with the wheel let go tells; while she is still turning it goes wild; fired at nothing it is wasted; and every wasted one is slower to reload than the last, on both sides
      const shot = (rud, settle) => { S.start(6, { seed: 31 }); const G = S.G; G.nextSight = 0.01; S.step(0.05); G.choice = 'raid'; S.step(0.05); const t = G.foes.find(x => x.K.navy), me = G.me; for (const x of G.foes) if (x !== t) x.gone = true;
        const place = () => { t.x = me.x + S.rgtX(me) * 80; t.y = me.y + S.rgtY(me) * 80; t.hdg = me.hdg; t.v = 0; t.think = 99; t.eng = false; }; G.in.held = true; G.in.rud = rud; for (let i = 0; i < settle; i++) { place(); S.step(1 / 60); } place(); S.step(1 / 60);
        const lit = G.lit[0] || G.lit[1], h = t.hull; G.in.fire = true; place(); S.step(1 / 60); G.in.fire = false; const ld = [me.load[0], me.load[1]]; G.in.rud = 0; for (let i = 0; i < 90; i++) { t.v = 0; S.step(1 / 60); } return { lit, hurt: h - t.hull, load: ld, reload: G.cfg.myReload }; };
      o.steady = shot(0, 40); o.turning = shot(0.5, 40); o.hardOver = shot(1, 40);
      S.start(6, { seed: 31 }); G = S.G; G.nextSight = 0.01; S.step(0.05); G.choice = 'raid'; S.step(0.05); for (const x of G.foes) { x.x = G.me.x; x.y = G.me.y + 900; x.v = 0; x.think = 99; } o.wasted = [];
      for (let i = 0; i < 3; i++) { G.me.load = [0, 0]; G.in.fire = true; S.step(1 / 60); G.in.fire = false; S.step(1 / 60); o.wasted.push([+(G.me.load[0] / G.cfg.myReload).toFixed(2), +(G.me.load[1] / G.cfg.myReload).toFixed(2)]); }
      // help after three losses only adds time
      const a = S.makeCfg(20, false), h = S.makeCfg(20, true); o.help = { slower: h.windup > a.windup && h.gap > a.gap && h.eAim > a.eAim && h.eReload > a.eReload, same: h.hp === a.hp && h.hit === a.hit && h.eSide === a.eSide && h.eHull === a.eHull && h.myBall === a.myBall && h.turn === a.turn };
      // a blow never lands in less than three tenths of a second
      o.windup = [1, 30, 100, 1000].map(N => S.makeCfg(N).windup);
      return o; }""")
    ok(all(s['kinds'] == ['trader'] for s in r['s1']), 'the first expedition is always a lone trader')
    ok(all(s['kinds'] == ['cutter'] for s in r['s2']), 'the second is always a lone navy cutter')
    ok(all(s['kinds'][0] == 'galleon' and s['navy'] == 1 and len(s['kinds']) == 2 for s in r['s10']), 'every tenth is a treasure galleon under one escort', str(r['s10'][0]))
    ok(all(1 <= len(s['kinds']) <= 3 for s in r['s25']), 'a sighting is one, two or three ships')
    kinds = {tuple(sorted(set('N' if n else 'M' for n in s['isNavy']))) for s in r['s25']}
    ok(('N',) in kinds and ('M', 'N') in kinds, 'sightings come navy only and mixed', str(kinds))
    m = [l for s in r['s25'] for l, n in zip(s['loot'], s['isNavy']) if not n]; nv = [l for s in r['s25'] for l, n in zip(s['loot'], s['isNavy']) if n]
    ok(m and nv and sum(m) / len(m) > 1.8 * sum(nv) / len(nv), 'merchants carry far more loot than navy ships', f'{sum(m) / max(1, len(m)):.0f} v {sum(nv) / max(1, len(nv)):.0f}')
    ok(r['passes'] == 2, 'you can sail on twice, and the third sighting must be fought', str(r['passes']) + ' ' + r['afterPass'])
    ok(r['haul'][0] == r['haul'][1], 'the haul is what the lookout promised', str(r['haul']))
    ok(r['shot1'] and not r['loadedAfter'] and not r['shot2'], 'the pistol holds one ball')
    ok(not r['at39'] and r['at41'], 'reloading takes four seconds', str([r['at39'], r['at41']]))
    ok(r['letGoLosesIt'] and r['reloaded2'], 'letting go of the reload starts it again')
    ok(r['shot3'] and r['shot4'] and r['left'] == 0 and r['noFourth'], 'three balls an expedition, and no more', str([r['shot3'], r['shot4'], r['left'], r['noFourth']]))
    ok(r['gun'][0] <= 2 and r['gun'][1] >= 16, 'the pistol never comes up pointing at him: fired without a touch it hits next to nothing (of 20); with the sights dragged on, it hits', str(r['gun']))
    ok(2 <= r['broke']['knocks'] <= 3 and r['broke']['unhurt'] and r['broke']['lands'], 'you can attack first: two or three blows on his sword break his guard, and then your blow lands', str(r['broke']))
    c = r['turned']['costs']
    ok(len(c) >= 3 and all(x > 0 for x in c), 'once he is set again, a blow at his guard is turned and he cuts you for it', str(r['turned']))
    ok(c[1] > c[0] * 1.3 and c[2] > c[1] * 1.3, 'and it costs more each time you do it again', str(c))
    ok(r['block']['open'] and r['block']['lands'] and r['block']['tide'], 'block his blow and he is open: then your blow lands', str(r['block']))
    ok(r['side']['centre'] == 0 and r['side']['wrong'] == 0 and r['side']['across'] == 0, 'a block must meet his blade on the side it comes from: through the middle, on the wrong side, or clean across the screen, it is no block', str(r['side']))
    ok(r['once']['hit'] and not r['once']['open'], 'one block for each blow: after a miss, a second stroke does not save you', str(r['once']))
    ok(not r['dodge']['hit'] and not r['dodge']['open'], 'a dodge does save you, and it only saves you: it does not open him', str(r['dodge']))
    ok(r['oneStroke']['best'] <= max(r['oneStroke']['left'], 1 - r['oneStroke']['left']) + 0.001 and r['oneStroke']['any'] > 50, 'no one stroke blocks both sides (3,000 strokes tried against 60 cuts): the best blocks one side, and no more', str(r['oneStroke']))
    ok(r['steady']['lit'] and r['steady']['hurt'] > 0 and max(r['steady']['load']) <= r['steady']['reload'] * 1.05, 'at sea: with the wheel let go, FIRE lights and the broadside tells', str(r['steady']))
    ok(not r['turning']['lit'] and not r['hardOver']['lit'] and max(r['hardOver']['load']) == 0 and r['hardOver']['hurt'] > 0, 'while she is still turning FIRE does not light; pressed all the same the guns hold, and fire (and hit) once the wheel is let go', str([r['turning'], r['hardOver']]))
    w = r['wasted']
    ok(w[0][0] >= 2.9 and w[0][1] >= 2.9 and w[1][0] > w[0][0] * 1.4 and w[2][0] > w[1][0] * 1.2, 'a broadside fired at nothing is wasted: both batteries are slow to reload, and slower each time', str(w))
    ok(r['help']['slower'] and r['help']['same'], 'help after three losses only adds time', str(r['help']))
    ok(all(x >= 0.3 for x in r['windup']) and r['windup'][0] > 1.0, 'a blow always gives at least three tenths of a second', str(r['windup']))
    ok(not errs, 'no JavaScript errors', str(errs[:3]))
    b.close()

print(f'\n{oks} checks passed, {len(fails)} failed.')
for f in fails: print('  -', f)
sys.exit(1 if fails else 0)
