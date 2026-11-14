"""Fast-forward bot tests for Hippodrome: whole races, many at a time.
python3 test_sim.py [levels] [n] [bots] [help]     e.g.  python3 test_sim.py 1,3,6,12,25,50 10 smart,human,spam
Each cell shows: races that got through / races run, the average finishing place, and (when lots put the bot on both rows) the same split by starting row.
"fight:" shows, per race, blows taken, rams dodged, rivals broken, and how often the bot's own chariot was destroyed.
Add a 4th argument (any word except "quick") to run with help on. Add the word "quick" to use the feed's instant start
(two quick notes and GO) instead of the full count: results must match the full count, e.g. python3 test_sim.py 20,45,60 80 human,good,expert quick Bots: smart, racer, expert, good, human, learner, beginner (fair players, best to worst; they steer away when warned);
humanNoRein, nobrake, outside, outsideRein, midNoRein, steerOnly, spam, spamleft, wall, idle (lazy ways to play: all must lose after the learning levels);
brute, bruteSmart, hunter, bruteNoRein (players who ram: must not do better than the same driver who just races); humanNoDodge (ignores every warning)."""
from playwright.sync_api import sync_playwright
import sys, os
BOTS = r"""
(cfg) => {
  const S = window.__sim, out = {};
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  // a driver that steers and reins in by rule (borrowing the rivals' steering), and whips on the beat with a human-sized timing error
  const driver = o => (R, me, b, dt) => {
    const T = R.T;
    if (!b.set) { b.set = 1; Object.assign(me, { cs: o.cs, cl: o.out ? T.dMax - o.out : T.dMin + o.lane, sl: o.out ? T.dMax - o.out : T.dMin + o.lane + 2.5, pm: o.pm || 0 }); b.startAt = o.start + Math.abs(gauss()) * (o.startJit || 0); }
    if (R.phase !== 'race') return;
    if (me.st === 'grid') { if (R.t >= b.startAt) S.whip(); return; }
    if (me.st !== 'run') return;
    const i = S.info(me.p);
    if (o.laneJit && i.k !== b.wasK) { b.wasK = i.k; if (!i.k) me.cl = T.dMin + o.lane + Math.abs(gauss()) * o.laneJit; }
    let chase = false; me.tin = 1;            // (a player aims at the post from the way in; the rivals turn in a lane off it)
    if (o.racer) {                            // racecraft: hold the inside all the way round, and sprint when there is someone just ahead to catch
      me.hug = 1; me.sl = me.cl + 0.4;
      for (const c of R.cars) { if (c === me || c.st !== 'run') continue; let dp = c.p - me.p; dp -= Math.round(dp / T.L) * T.L; if (dp > 0 && dp < 30) chase = true; }
    }
    let hold = false;
    if (o.hunt) {                             // going after the favourite: draw level on its outside, then swing in again and again
      const f = R.cars[0]; if (f.st === 'run') { let dp = f.p - me.p; dp -= Math.round(dp / T.L) * T.L; if (Math.abs(dp) < 22) { me.sl = clamp(f.d + 4.2, T.dMin + 1, T.dMax - 1); if (dp > 1.2) chase = true; else if (dp < -1.2 && !i.k && i.dist > 40) hold = true; } }
    }
    S.drive(me, dt);
    if (hold) me.b = Math.max(me.b, 0.4);
    if (o.noBrake) me.b = 0;
    if (me.warn) {                            // a rival is winding up: a player who notices steers away after a moment
      if (b.wn !== me.warn) { b.wn = me.warn; b.see = Math.random() < (o.see == null ? 1 : o.see); b.drt = (o.drt == null ? 0.3 : o.drt) + Math.abs(gauss()) * (o.drtJit || 0); }
      if (b.see && me.warn.t >= b.drt && Math.abs(me.d - me.warn.by.d) < 7.6) { me.u = me.warn.sg; me.b = 0; }      // ...just far enough to be out of reach
    } else if (o.ram && !i.k && i.dist > 30 && me.ramT > 1) {       // a player who likes a fight: swing into whoever is level (or only the favourite)
      for (const c of R.cars) { if (c === me || c.st !== 'run' || (o.ram === 'fav' && c !== R.cars[0])) continue; let dp = c.p - me.p; dp -= Math.round(dp / T.L) * T.L; const gd = Math.abs(c.d - me.d);
        if (Math.abs(dp) < 2.6 && gd > 2.75 && gd < 6.5) { me.u = c.d > me.d ? 1 : -1; me.b = 0; break; } }
    }
    if (o.slop) { b.u = (b.u || 0) + (me.u * o.slop - (b.u || 0)) * Math.min(1, dt * 3.5); me.u = b.u; }      // slow, soft hands on the reins
    // one decision per beat, made half a beat early; the tap lands with a timing error
    const near = me.ph < 0.5 ? me.beatN : me.beatN + 1;
    if (near !== b.beat) {
      b.beat = near; b.off = gauss() * o.sig;
      const last = me.p > R.laps * T.L - 170, braking = me.b > 0 || (!i.k && i.dist < 16) || (i.k && i.a < 2.2);
      b.want = !braking && !hold && me.blown <= 0 && me.urge < (last || chase ? 0.97 : o.pace) && me.wind > (last ? 0.07 : chase ? 0.22 : o.reserve) && Math.random() > (o.skip || 0);
      b.done = false;
    }
    if (b.want && !b.done && S.beatErr() >= b.off) { b.done = true; S.whip(); }
  };
  const BOTS = {
    smart: driver({ cs: 0.965, lane: 0.75, sig: 0.012, pace: 0.88, reserve: 0.14, start: 0.03, drt: 0.15 }),
    human: driver({ cs: 0.88, lane: 1.9, laneJit: 1.2, sig: 0.055, pace: 0.85, reserve: 0.18, start: 0.1, startJit: 0.12, pm: 0.12, skip: 0.1, drt: 0.45, drtJit: 0.15, see: 0.85 }),
    humanNoDodge: driver({ cs: 0.88, lane: 1.9, laneJit: 1.2, sig: 0.055, pace: 0.85, reserve: 0.18, start: 0.1, startJit: 0.12, pm: 0.12, skip: 0.1, see: 0 }),                                   // drives like the human bot but ignores every warning
    brute: driver({ cs: 0.88, lane: 1.9, laneJit: 1.2, sig: 0.055, pace: 0.85, reserve: 0.18, start: 0.1, startJit: 0.12, pm: 0.12, skip: 0.1, drt: 0.45, drtJit: 0.15, see: 0.85, ram: 'any' }),   // the human bot, but it rams whoever is level
    bruteSmart: driver({ cs: 0.965, lane: 0.75, sig: 0.012, pace: 0.88, reserve: 0.14, start: 0.03, drt: 0.15, ram: 'any' }),                                                                     // near-perfect hands, rams whoever is level
    humanHunter: driver({ cs: 0.88, lane: 1.9, laneJit: 1.2, sig: 0.055, pace: 0.85, reserve: 0.18, start: 0.1, startJit: 0.12, pm: 0.12, skip: 0.1, drt: 0.45, drtJit: 0.15, see: 0.85, ram: 'fav', hunt: true }),   // the human bot, setting out to break the favourite
    hunter: driver({ cs: 0.965, lane: 0.75, sig: 0.012, pace: 0.88, reserve: 0.14, start: 0.03, drt: 0.15, ram: 'fav', hunt: true }),                                                             // near-perfect hands, sets out to break the favourite
    bruteNoRein: driver({ cs: 0.88, lane: 1.9, laneJit: 1.2, sig: 0.055, pace: 0.85, reserve: 0.18, start: 0.1, startJit: 0.12, skip: 0.1, noBrake: true, see: 0.85, drt: 0.45, ram: 'any' }),     // never reins in, rams whoever is level
    good: driver({ cs: 0.92, lane: 1.4, laneJit: 0.8, sig: 0.04, pace: 0.86, reserve: 0.16, start: 0.07, startJit: 0.08, pm: 0.06, skip: 0.05, drt: 0.35, drtJit: 0.1, see: 0.95 }),       // a practised player
    expert: driver({ cs: 0.95, lane: 1.0, laneJit: 0.4, sig: 0.025, pace: 0.88, reserve: 0.14, start: 0.04, startJit: 0.04, pm: 0.02, skip: 0.02, drt: 0.25, drtJit: 0.05 }),   // a very good player, still human
    racer: driver({ cs: 0.965, lane: 0.75, sig: 0.012, pace: 0.88, reserve: 0.14, start: 0.03, racer: true, drt: 0.15 }),          // near-perfect hands plus racecraft
    nobrake: driver({ cs: 0.965, lane: 0.75, sig: 0.012, pace: 0.88, reserve: 0.14, start: 0.03, noBrake: true }),
    beginner: driver({ cs: 0.8, lane: 5, laneJit: 2.5, sig: 0.25, pace: 0.9, reserve: 0.3, start: 0.6, startJit: 0.5, skip: 0.45, noBrake: true, slop: 0.75, see: 0 }),   // first-timer: soft slow steering, never reins in, whips at random
    learner: driver({ cs: 0.85, lane: 3.5, laneJit: 2, sig: 0.11, pace: 0.85, reserve: 0.25, start: 0.3, startJit: 0.3, skip: 0.25, pm: 0.3, slop: 0.9, drt: 0.7, drtJit: 0.2, see: 0.5 }),         // a few races in: reins in (often late), rough timing
    humanNoRein: driver({ cs: 0.88, lane: 1.9, laneJit: 1.2, sig: 0.055, pace: 0.85, reserve: 0.18, start: 0.1, startJit: 0.12, skip: 0.1, noBrake: true, drt: 0.45, drtJit: 0.15, see: 0.85 }),   // a decent player who never reins in
    outside: driver({ cs: 0.965, out: 1.6, sig: 0.012, pace: 0.88, reserve: 0.14, start: 0.03, noBrake: true }),      // the long way round, flat out: never reins in, stays just off the outer wall
    outsideRein: driver({ cs: 0.965, out: 1.6, sig: 0.012, pace: 0.88, reserve: 0.14, start: 0.03 }),                // the long way round, reining in only as much as that line needs
    midNoRein: driver({ cs: 0.965, lane: 9, sig: 0.012, pace: 0.88, reserve: 0.14, start: 0.03, noBrake: true }),     // the middle of the track, flat out
    idle: () => {},
    spam: (R, me, b) => { if (R.phase !== 'race') return; me.u = 0; me.b = 0; if (R.t > (b.n || 0)) { S.whip(); b.n = R.t + 0.16; } },                       // hammer the whip
    spamleft: (R, me, b) => { if (R.phase !== 'race') return; me.u = -1; me.b = 0; if (R.t > (b.n || 0)) { S.whip(); b.n = R.t + 0.16; } },                // hammer the whip, hug the inside
    wall: (R, me, b) => { if (R.phase !== 'race') return; me.u = 1; me.b = 0; if (me.st === 'grid') { S.whip(); return; } if (Math.abs(S.beatErr()) < 0.012 && me.lb !== me.beatN && me.urge < 0.9 && me.wind > 0.15) { me.lb = me.beatN; S.whip(); } },   // ride the outer wall, whip well
    steerOnly: driver({ cs: 0.9, lane: 2, sig: 9, pace: -1, reserve: 9, start: 9 })                                                                       // drives well, never whips
  };
  for (const name of cfg.bots) {
    out[name] = {};
    for (const L of cfg.levels) {
      let ok = 0, sum = 0, wr = 0, tt = 0, dead = 0, kills = 0, hits = 0, dod = 0, rams = 0; const rows = { 1: [0, 0], 2: [0, 0] };
      for (let n = 0; n < cfg.n; n++) {
        S.start(L, { help: cfg.help, quick: cfg.quick });
        const R = S.R, me = R.me, b = {}; let steps = 0; const row = me.p < -10 ? 2 : 1;
        while (R.phase !== 'finish' && steps < 60 * 400) { BOTS[name](R, me, b, 1 / 60); S.step(1 / 60); steps++; }
        const place = R.phase === 'finish' ? R.res.place : R.n;
        if (R.phase === 'finish' && R.res.ok) { ok++; rows[row][0]++; } rows[row][1]++; sum += place; wr += me.wrecks; tt += steps / 60;
        if (me.st === 'out') dead++; kills += me.kills; hits += me.hits; dod += me.dodges; rams += me.rams;
      }
      out[name]['L' + L] = `${ok}/${cfg.n} avg ${(sum / cfg.n).toFixed(1)} (${(tt / cfg.n).toFixed(0)}s${wr ? ', ' + (wr / cfg.n).toFixed(1) + ' wrecks' : ''})` +
        (hits || dod || kills || dead || rams ? `  fight: rams ${(rams / cfg.n).toFixed(1)}, hit ${(hits / cfg.n).toFixed(1)}, dodged ${(dod / cfg.n).toFixed(1)}, broke ${(kills / cfg.n).toFixed(1)} rivals, destroyed ${dead}/${cfg.n}` : '') +
        (rows[2][1] ? `   front row ${rows[1][0]}/${rows[1][1]}, second row ${rows[2][0]}/${rows[2][1]}` : '');
    }
  }
  return out;
}
"""
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844})
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + os.path.join(os.path.dirname(os.path.abspath(__file__)), 'index.html')); pg.wait_for_timeout(500)
    levels = [int(x) for x in (sys.argv[1] if len(sys.argv) > 1 else '1,2,3,5,6,8,12,20,30,45,60,80').split(',')]
    n = int(sys.argv[2]) if len(sys.argv) > 2 else 10
    bots = (sys.argv[3] if len(sys.argv) > 3 else 'smart,human,steerOnly,nobrake,idle,spam,spamleft,wall').split(',')
    # a 4th argument turns help on; the word "quick" anywhere after the bots tests the feed's instant start (no count)
    extra = sys.argv[4:]
    res = pg.evaluate(BOTS, {'levels': levels, 'n': n, 'bots': bots, 'help': any(a != 'quick' for a in extra), 'quick': 'quick' in extra})
    for name, rows in res.items():
        print(name)
        for L, r in rows.items(): print('   ', L.ljust(4), r)
    print('errors', errs); b.close()
