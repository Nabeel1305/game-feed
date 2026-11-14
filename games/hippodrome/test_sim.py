"""Fast-forward bot tests for Hippodrome: whole races, many at a time.
python3 test_sim.py [levels] [n] [bots] [help]     e.g.  python3 test_sim.py 1,3,6,12,25,50 10 smart,human,spam
Each cell shows: races that got through / races run, the average finishing place, and (when lots put the bot on both rows) the same split by starting row.
Add a 4th argument (any word) to run with help on. Bots: smart, racer, expert, good, human, learner, beginner (fair players, best to worst);
humanNoRein, nobrake, outside, outsideRein, midNoRein, steerOnly, spam, spamleft, wall, idle (lazy ways to play: all must lose after the learning levels)."""
from playwright.sync_api import sync_playwright
import sys, os
BOTS = r"""
(cfg) => {
  const S = window.__sim, out = {};
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
    S.drive(me, dt);
    if (o.noBrake) me.b = 0;
    if (o.slop) { b.u = (b.u || 0) + (me.u * o.slop - (b.u || 0)) * Math.min(1, dt * 3.5); me.u = b.u; }      // slow, soft hands on the reins
    // one decision per beat, made half a beat early; the tap lands with a timing error
    const near = me.ph < 0.5 ? me.beatN : me.beatN + 1;
    if (near !== b.beat) {
      b.beat = near; b.off = gauss() * o.sig;
      const last = me.p > R.laps * T.L - 170, braking = me.b > 0 || (!i.k && i.dist < 16) || (i.k && i.a < 2.2);
      b.want = !braking && me.blown <= 0 && me.urge < (last || chase ? 0.97 : o.pace) && me.wind > (last ? 0.07 : chase ? 0.22 : o.reserve) && Math.random() > (o.skip || 0);
      b.done = false;
    }
    if (b.want && !b.done && S.beatErr() >= b.off) { b.done = true; S.whip(); }
  };
  const BOTS = {
    smart: driver({ cs: 0.965, lane: 0.75, sig: 0.012, pace: 0.88, reserve: 0.14, start: 0.03 }),
    human: driver({ cs: 0.88, lane: 1.9, laneJit: 1.2, sig: 0.055, pace: 0.85, reserve: 0.18, start: 0.1, startJit: 0.12, pm: 0.12, skip: 0.1 }),
    good: driver({ cs: 0.92, lane: 1.4, laneJit: 0.8, sig: 0.04, pace: 0.86, reserve: 0.16, start: 0.07, startJit: 0.08, pm: 0.06, skip: 0.05 }),       // a practised player
    expert: driver({ cs: 0.95, lane: 1.0, laneJit: 0.4, sig: 0.025, pace: 0.88, reserve: 0.14, start: 0.04, startJit: 0.04, pm: 0.02, skip: 0.02 }),   // a very good player, still human
    racer: driver({ cs: 0.965, lane: 0.75, sig: 0.012, pace: 0.88, reserve: 0.14, start: 0.03, racer: true }),          // near-perfect hands plus racecraft
    nobrake: driver({ cs: 0.965, lane: 0.75, sig: 0.012, pace: 0.88, reserve: 0.14, start: 0.03, noBrake: true }),
    beginner: driver({ cs: 0.8, lane: 5, laneJit: 2.5, sig: 0.25, pace: 0.9, reserve: 0.3, start: 0.6, startJit: 0.5, skip: 0.45, noBrake: true, slop: 0.75 }),   // first-timer: soft slow steering, never reins in, whips at random
    learner: driver({ cs: 0.85, lane: 3.5, laneJit: 2, sig: 0.11, pace: 0.85, reserve: 0.25, start: 0.3, startJit: 0.3, skip: 0.25, pm: 0.3, slop: 0.9 }),         // a few races in: reins in (often late), rough timing
    humanNoRein: driver({ cs: 0.88, lane: 1.9, laneJit: 1.2, sig: 0.055, pace: 0.85, reserve: 0.18, start: 0.1, startJit: 0.12, skip: 0.1, noBrake: true }),   // a decent player who never reins in
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
      let ok = 0, sum = 0, wr = 0, tt = 0; const rows = { 1: [0, 0], 2: [0, 0] };
      for (let n = 0; n < cfg.n; n++) {
        S.start(L, { help: cfg.help });
        const R = S.R, me = R.me, b = {}; let steps = 0; const row = me.p < -10 ? 2 : 1;
        while (R.phase !== 'finish' && steps < 60 * 400) { BOTS[name](R, me, b, 1 / 60); S.step(1 / 60); steps++; }
        const place = R.phase === 'finish' ? R.res.place : R.n;
        if (place <= R.need) { ok++; rows[row][0]++; } rows[row][1]++; sum += place; wr += me.wrecks; tt += R.phase === 'finish' ? R.res.time : 400;
      }
      out[name]['L' + L] = `${ok}/${cfg.n} avg ${(sum / cfg.n).toFixed(1)} (${(tt / cfg.n).toFixed(0)}s${wr ? ', ' + (wr / cfg.n).toFixed(1) + ' wrecks' : ''})` + (rows[2][1] ? `   front row ${rows[1][0]}/${rows[1][1]}, second row ${rows[2][0]}/${rows[2][1]}` : '');
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
    res = pg.evaluate(BOTS, {'levels': levels, 'n': n, 'bots': bots, 'help': len(sys.argv) > 4})
    for name, rows in res.items():
        print(name)
        for L, r in rows.items(): print('   ', L.ljust(4), r)
    print('errors', errs); b.close()
