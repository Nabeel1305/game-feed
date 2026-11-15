"""Bots fly Bandit at full speed inside the page (no drawing), to prove the rules: lazy play loses, careful play wins,
early sorties are easy and it gets harder for ever.

    python3 test_sim.py                      default levels and bots
    python3 test_sim.py 1,5,20,60 20 human,smart      levels, fights per cell, bots
    python3 test_sim.py 8,20 20 human help            with the "help after three losses" setting on

Bots:  idle (hands off), spam (no steering, hammers both buttons), circle (one hard turn for ever, hammers both buttons),
       flee (runs straight), noflare (flies well, never flares), flarespam (flies well, flares the instant a missile shows),
       first (a first-timer: slow hands, poor aim), human (0.3 s reactions, sloppy), good (0.2 s), smart (near perfect).
"""
import os, sys, json
from playwright.sync_api import sync_playwright

here = os.path.dirname(os.path.abspath(__file__))
levels = [int(x) for x in (sys.argv[1] if len(sys.argv) > 1 else '1,2,3,5,8,12,20,30,45,60,90').split(',')]
n = int(sys.argv[2]) if len(sys.argv) > 2 else 12
bots = (sys.argv[3] if len(sys.argv) > 3 else 'idle,spam,circle,flee,noflare,flarespam,first,human,good,smart').split(',')
help_on = len(sys.argv) > 4 and sys.argv[4] == 'help'

JS = r"""
([levels, n, bots, help]) => {
  const S = window.__sim, dt = 1 / 60, out = {};
  const PROF = { first: { rt: 0.5, aim: 0.5, tErr: 0.22, gain: 1.4, two: 0, guns: 0.3 }, human: { rt: 0.3, aim: 0.25, tErr: 0.13, gain: 2.0, two: 0.3, guns: 0.7 }, good: { rt: 0.2, aim: 0.12, tErr: 0.08, gain: 2.3, two: 0.8, guns: 1 }, smart: { rt: 0.1, aim: 0.03, tErr: 0.03, gain: 2.6, two: 1, guns: 1 } };
  function pilot(p, opt) {                    // a player with reaction time, wobbly aim and imperfect timing
    const hist = []; let rnd = Math.random, brk = 0, brkDir = 1, seenThreat = 0, flareAt = -1, lockSeen = 0, fireHold = 0, wob = 0, wobT = 0, two = false;
    return (G) => {
      const me = G.me, f = G.foe, c = G.cfg;
      hist.push({ x: f.x, y: f.y, z: f.z }); if (hist.length > Math.round(p.rt / dt) + 1) hist.shift();
      const seen = hist[0], r = S.rel(me, seen);
      wobT -= dt; if (wobT <= 0) { wobT = 0.35 + rnd() * 0.4; wob = (rnd() * 2 - 1) * p.aim; }
      let sx = Math.max(-1, Math.min(1, (r.az + wob * 0.25) * p.gain)), sy = Math.max(-1, Math.min(1, (r.el + wob * 0.12) * p.gain)), fire = false, flare = false;
      // his missile is coming: break, and flare when the ring says so (give or take)
      if (G.threat) {
        if (seenThreat === 0) { flareAt = c.myLo + (c.myHi - c.myLo) * (0.62 + (rnd() * 2 - 1) * 0.1) + (rnd() * 2 - 1) * p.tErr; brkDir = rnd() < 0.5 ? -1 : 1; }
        seenThreat += dt;
        if (seenThreat >= p.rt) { sx = brkDir; sy = 0.15; if (!opt.noflare && G.tti <= flareAt && me.flares > 0 && me.flareT <= 0) flare = true; }
        if (opt.flarespam && me.flares > 0) flare = true;
      } else {
        seenThreat = 0;
        if (f.onT && f.lock > 0.25) { lockSeen += dt; if (lockSeen > p.rt) { if (brk <= 0) { brk = 1.3; brkDir = r.az > 0 ? 1 : -1; } } } else lockSeen = 0;
        if (brk > 0) { brk -= dt; sx = brkDir; sy = 0.2; }
      }
      // shooting
      if (me.lock >= 1 && me.shots > 0 && f.alive) { if (fireHold === 0) two = rnd() < p.two; fireHold += dt; if (fireHold >= p.rt * 0.8) { const inAir = G.shots.some(s => s.from === me && !s.dead); if (!inAir || two) fire = true; } } else fireHold = 0;
      if (!fire && f.alive && me.r && me.r.off < S.PH.GUN_A * 1.6 && me.r.d < S.PH.GUN_R && rnd() < p.guns) fire = true;
      S.set(sx, sy, fire, flare);
    };
  }
  const BOT = {
    idle: () => () => S.set(0, 0, false, false),
    spam: () => { let t = 0; return () => { t += dt; S.set(0, 0, Math.floor(t / 0.12) % 2 === 0, Math.floor(t / 0.2) % 2 === 0); }; },
    circle: () => { let t = 0; return () => { t += dt; S.set(1, 0, Math.floor(t / 0.12) % 2 === 0, Math.floor(t / 0.2) % 2 === 0); }; },
    flee: () => () => S.set(0, 0.05, false, false),
    noflare: () => pilot(PROF.human, { noflare: 1 }),
    flarespam: () => pilot(PROF.human, { flarespam: 1 }),
    first: () => pilot(PROF.first, {}), human: () => pilot(PROF.human, {}), good: () => pilot(PROF.good, {}), smart: () => pilot(PROF.smart, {})
  };
  for (const b of bots) {
    out[b] = {};
    for (const L of levels) {
      let wins = 0, tsum = 0, hits = 0, fuel = 0, stars = 0, ff = 0, tt = 0, mf = 0, ml = 0;
      for (let i = 0; i < n; i++) {
        S.start(L, { seed: i + 1, help }); const G = S.G, act = BOT[b](); let t = 0;
        while (G.phase === 'fight' && t < 600) { act(G); S.step(dt); t += dt; }
        if (G.phase === 'won') { wins++; tsum += G.t; stars += G.res.stars; } else if (G.why === 'fuel') fuel++;
        hits += G.hitsTaken; ff += G.foeFired; tt += G.t; mf += G.fired; ml += G.landed;
      }
      out[b][L] = { w: wins, t: wins ? +(tsum / wins).toFixed(0) : 0, h: +(hits / n).toFixed(1), fuel, st: wins ? +(stars / wins).toFixed(1) : 0, ff: +(ff / tt * 60).toFixed(1), mf: +(mf / tt * 60).toFixed(1), ml: mf ? +(ml / mf).toFixed(2) : 0 };
    }
  }
  return out;
}
"""

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + os.path.join(here, 'index.html')); pg.wait_for_timeout(400)
    res = pg.evaluate(JS, [levels, n, bots, help_on])
    b.close()
print(f"wins out of {n}  (average seconds for a win, missile hits taken per fight; F = lost on fuel)" + ('   HELP ON' if help_on else ''))
print('bot        ' + ''.join(f'L{L:<11}' for L in levels))
for bname in bots:
    row = f'{bname:<11}'
    for L in levels:
        c = res[bname][str(L)]
        row += f"{c['w']:>2} {c['t']:>3}s {c['h']:.1f}{'F' + str(c['fuel']) if c['fuel'] else '  ':<3} " if not os.environ.get('MORE') else f"{c['w']:>2} his/min {c['ff']:>4} mine/min {c['mf']:>4} land {c['ml']:.2f} | "
    print(row)
if errs: print('ERRORS', errs[:3]); sys.exit(1)
