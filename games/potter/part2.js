// ===================== RULES: Potter's Wheel (game 20) =====================
// A potter's workshop in 3D. A lump of wet clay spins on the wheel; the order is a pot's outline (dotted, both sides). Your
// fingertip is your hand on the clay: where it touches the clay's side, the clay follows it, in or out, a little at a time.
// Move slowly and the clay follows; move too fast and you lose touch (or, pressed hard and quick, the pot wobbles and can
// collapse). When it matches, tap FIRE: the match must reach the order's mark. Three ruined pots and the day is over.
// The profile: radius r[i] at heights u = i / (NR - 1) from the base (0) to the rim (1), in units of the pot's height.

const RULES = [
  '<b>Match the dotted outline.</b> The order\'s shape is drawn on both sides of the spinning clay.',
  '<b>Touch the side of the clay</b> and move your finger slowly: the clay follows it, in or out, at that height.',
  'Put your finger <b>anywhere at the height you want</b> and slide it: right or left moves that part of the wall out or in. Move <b>slowly</b>: hard, fast sweeps make the pot wobble.',
  'The match grows as you go. <b>Tap FIRE</b> when it reaches the order\'s mark.',
  'Fire too early, or let a pot collapse, and it is ruined. Three ruined pots and the day is over.',
];
const NR = 24, RMIN = 0.07, RMAX = 0.6, LUMP = 0.5;
const SHAPES = ['Cup', 'Bowl', 'Vase', 'Bottle', 'Jar', 'Urn', 'Jug', 'Beaker'];
const WEATHERS = ['morning', 'golden', 'noon', 'rain', 'overcast', 'sunset', 'mist', 'dawn', 'storm', 'dusk'];
function weatherOf(N) { if (N <= 3) return ['morning', 'golden', 'noon'][N - 1]; const R = rng(N * 3301 + 7); R(); return WEATHERS[(R() * WEATHERS.length) | 0]; }

function makeCfg(N, help) {
  const f = curve(N), e = easyOf(N), boss = N % 10 === 0, x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s));
  return { N, f, e, boss, help: !!help, lives: 3,
    pots: N <= 2 ? 1 : Math.round(x(2, 4, 25)) + (boss ? 1 : 0),
    pass: x(0.82, 0.89, 30),                                  // match needed to fire
    ctrl: N <= 4 ? 3 : Math.min(6, Math.round(x(3, 6.4, 25))),     // points shaping the order's outline
    swing: x(0.08, 0.19, 25),                                // how much the outline goes in and out
    follow: 3.2,                                             // how quickly the clay follows the finger (a second)
    reach: x(0.11, 0.08, 30),                                // how far from the clay the finger still touches it
    wobble: x(0.6, 1.4, 30) / (help ? 1.3 : 1),              // how much a hard, quick press makes it wobble
    dry: N < 6 ? 0 : x(70, 27, 30) * (help ? 1.3 : 1) };     // seconds before the clay is too dry to shape (0: never)
}
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null,
    weather: weatherOf(N), r: [], target: [], shape: '', match: 0, wob: 0, finger: null, made: 0, good: 0, ruined: 0, lives: cfg.lives, potT: 0, best: 0, streak: 0, bestStreak: 0, shelf: [], gap: 0 };
  newPot(G);
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G);
  return G;
}
// the order: a smooth outline through a few control radii; never wider than the lump (clay can be thinned and spread, not
// conjured), and never like the lump (so firing it untouched never passes)
function newPot(G, ctrlN) {
  const c = G.cfg, R = G.rnd, n = ctrlN || c.ctrl, pts = [];
  for (let tries = 0; tries < 50; tries++) {
    pts.length = 0; let base = 0.2 + R() * 0.12;
    for (let i = 0; i < n; i++) pts.push(clamp(base + (R() - 0.5) * 2 * c.swing * (i ? 1.6 : 0.6), 0.11, 0.42));
    const t = []; for (let i = 0; i < NR; i++) { const u = i / (NR - 1), q = u * (n - 1), a = Math.min(n - 2, Math.floor(q)), f = q - a, p0 = pts[Math.max(0, a - 1)], p1 = pts[a], p2 = pts[a + 1], p3 = pts[Math.min(n - 1, a + 2)];
      t.push(clamp(0.5 * ((2 * p1) + (-p0 + p2) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f + (-p0 + 3 * p1 - 3 * p2 + p3) * f * f * f), 0.1, 0.44)); }
    G.target = t; if (matchOf(lump(), t) < 0.35) break;
  }
  G.r = lump(); G.wob = 0; G.potT = 0; G.finger = null; G.match = matchOf(G.r, G.target);
  const t = G.target, top = t[NR - 1], mid = t[(NR / 2) | 0], bot = t[0], mx = Math.max(...t);
  G.shape = top > mid + 0.06 ? (top > bot + 0.1 ? 'Bowl' : 'Cup') : top < mid - 0.08 ? (mid > bot + 0.03 ? 'Vase' : 'Bottle') : mx > Math.max(top, bot) + 0.06 ? 'Jar' : pick(R, ['Beaker', 'Jug', 'Urn']);
  G.ev.push({ k: 'pot', shape: G.shape });
}
const lump = () => { const r = []; for (let i = 0; i < NR; i++) { const u = i / (NR - 1); r.push(LUMP * (1 - 0.18 * u * u) * (u > 0.92 ? 1 - (u - 0.92) * 2 : 1)); } return r; };
const matchOf = (r, t) => { let s = 0; for (let i = 0; i < NR; i++) s += Math.abs(r[i] - t[i]); return clamp(1 - s / NR / 0.18, 0, 1); };
// ---------- the thumb ----------
// the fingertip on the clay at height u (0 base .. 1 rim), at distance d from the middle; null: lifted
function touch(G, u, d) { if (G.over || G.gap > 0) { G.finger = null; return; } if (u == null) { G.finger = null; return; } const f = G.finger; G.finger = { u: clamp(u, 0, 1), d: clamp(d, 0, 0.9), pu: f ? f.u : u, pd: f ? f.d : d }; }
function lift(G) { G.finger = null; }
function fire(G) {
  if (G.over || G.gap > 0) return; const c = G.cfg, m = matchOf(G.r, G.target), ok = m >= c.pass; G.finger = null; G.made++;
  if (ok) { G.good++; G.streak++; G.bestStreak = Math.max(G.bestStreak, G.streak); G.best = Math.max(G.best, m); G.shelf.push({ r: G.r.slice(), m, shape: G.shape }); G.ev.push({ k: 'fired', m, perfect: m >= 0.95, n: G.streak, shape: G.shape }); lessonSee(G, 'fired', m); }
  else { G.streak = 0; G.ev.push({ k: 'cracked', m, need: c.pass }); if (G.lesson) { lessonMiss(G, 'early'); G.made--; return; } G.ruined++; G.lives--; if (G.lives <= 0) { finish(G, false, 'ruined'); return; } }
  G.gap = 1.2;
}
// ---------- every frame ----------
function step(G, dt) {
  if (G.over) return; G.t += dt; const c = G.cfg;
  if (G.gap > 0) { G.gap -= dt; if (G.gap <= 0) { if (!G.lesson && G.good >= c.pots) { finish(G, true); return; } newPot(G); } return; }
  G.potT += dt;
  if (c.dry && !G.lesson && G.potT >= c.dry) { G.ev.push({ k: 'dried' }); G.streak = 0; G.made++; G.ruined++; G.lives--; G.finger = null; if (G.lives <= 0) { finish(G, false, 'dried'); return; } G.gap = 1.2; return; }
  const f = G.finger;
  if (f) { const i0 = f.u * (NR - 1), ri = G.r[Math.round(i0)], gapD = Math.abs(f.d - ri);
    const sp = Math.hypot((f.u - f.pu) * 1.0, f.d - f.pd) / Math.max(dt, 1e-3); f.pu = f.u; f.pd = f.d;
    if (gapD < c.reach) { let moved = 0;
      for (let i = 0; i < NR; i++) { const w = Math.exp(-Math.pow((i - i0) / (NR * 0.07), 2)); if (w < 0.02) continue; const dr = (f.d - G.r[i]) * Math.min(1, c.follow * dt) * w; G.r[i] = clamp(G.r[i] + dr, RMIN, RMAX); moved += Math.abs(dr); }
      // a hard, quick press makes it wobble; slow hands calm it
      if (sp > 0.9 && gapD > c.reach * 0.5) G.wob += (sp - 0.9) * c.wobble * dt; G.touching = true; if (moved > 0.002) G.shaped = (G.shaped || 0) + moved;
    } else G.touching = false;
  } else G.touching = false;
  G.wob = Math.max(0, G.wob - dt * 0.35); lessonPoll(G);
  if (G.wob >= 1) { G.ev.push({ k: 'collapse' }); G.wob = 0; G.finger = null; G.streak = 0; if (G.lesson) { lessonMiss(G, 'collapse'); G.r = lump(); return; } G.made++; G.ruined++; G.lives--; if (G.lives <= 0) { finish(G, false, 'collapsed'); return; } G.gap = 1.2; return; }
  const m = matchOf(G.r, G.target); if (Math.floor(m * 10) > Math.floor(G.match * 10) && m > 0.5) G.ev.push({ k: 'better', m }); G.match = m;
}
function finish(G, win, why) {
  G.over = win ? 'won' : 'lost';
  G.res = { win, why, stars: win ? (G.ruined === 0 && G.best >= 0.94 ? 3 : G.ruined === 0 ? 2 : 1) : 0, good: G.good, pots: G.cfg.pots, ruined: G.ruined, best: Math.round(G.best * 100), combo: Math.round(G.best * 100), time: G.t };
  G.ev.push({ k: win ? 'won' : 'lost', why });
}
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'press', title: 'THE CLAY FOLLOWS YOUR FINGER', say: G => potCue(G)[0], do: G => potCue(G)[1], at: G => potCue(G)[2], how: 'Touch the side of the spinning clay and slowly move your finger in towards the middle. Watch it narrow.', need: 1, ok: (w, m) => w === 'shaped' },
      { id: 'fire', title: 'MATCH, THEN FIRE', say: G => potCue(G)[0], do: G => potCue(G)[1], at: G => potCue(G)[2], how: 'Shape it to the dotted outline, bottom to top, slowly. When the match reaches the mark, tap FIRE.', need: 1, ok: w => w === 'fired', ctrl: 2 }],
  2: [{ id: 'curve', title: 'IN AND OUT', say: G => potCue(G)[0], do: G => potCue(G)[1], at: G => potCue(G)[2], how: 'This one curves. Move your finger in where it narrows and out where it swells, slowly, all the way up.', need: 1, ok: w => w === 'fired', ctrl: 3 }],
  3: [{ id: 'two', title: 'TWO ORDERS', say: G => potCue(G)[0], do: G => potCue(G)[1], at: G => potCue(G)[2], how: 'Two pots to make. Slow, steady hands: too fast and the pot wobbles.', need: 2, ok: w => w === 'fired', ctrl: 3 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0, miss: 0 }; G.ev.push({ k: 'lessonnext', first: true }); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonSee(G, what, arg) {
  const D = G.lesson; if (!D) return; const st = D.steps[D.i]; if (!st.ok(what, arg)) return;
  D.n++; if (D.n < st.need) { G.ev.push({ k: 'lessonok', n: D.n, need: st.need }); return; }
  D.i++; D.n = 0; D.miss = 0;
  if (D.i >= D.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); Object.assign(G, { made: 0, good: 0, ruined: 0, lives: G.cfg.lives, streak: 0, bestStreak: 0, best: 0, shelf: [] }); G.gap = 1.2; }
  else G.ev.push({ k: 'lessonnext' });
}
function lessonMiss(G, why) { const D = G.lesson; if (!D) return; D.miss++; G.ev.push({ k: 'lessonmiss', why, how: D.steps[D.i].how }); }
// the first lesson's first step: seeing the clay move is enough
const lessonPoll = G => { const L = lessonNow(G); if (L && L.id === 'press' && (G.shaped || 0) > 0.6) { G.shaped = 0; lessonSee(G, 'shaped'); } };

// ---------- for the robots ----------
// BLIND: a thumb that does not look: a slow stroke in, or out, at some height; a stroke up or down the side; fire.
function stroke(G, u0, u1, d0, d1, secs) { const n = Math.max(2, Math.round(secs * 60)); for (let i = 0; i <= n; i++) { touch(G, lerp(u0, u1, i / n), lerp(d0, d1, i / n)); step(G, 1 / 60); if (G.over || G.gap > 0) break; } lift(G); }
const BLIND = {
  i: G => { const u = Math.random(), r = G.r[Math.round(u * (NR - 1))]; stroke(G, u, u, r, r - 0.15, 0.8); },
  o: G => { const u = Math.random(), r = G.r[Math.round(u * (NR - 1))]; stroke(G, u, u, r, r + 0.12, 0.8); },
  u: G => { const d = G.r[0]; stroke(G, 0, 1, d, d - 0.1 * Math.random(), 1.2); },
  d: G => { const d = G.r[NR - 1]; stroke(G, 1, 0, d, d * (0.6 + Math.random() * 0.5), 1.2); },
  f: G => fire(G),
};
// a potter who looks: sweeps up the side, finger on the order's line (a little off, as a thumb is), slowly; fires at the mark
// THE HAND SHAPES WHERE THE POT IS WRONG (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing happens"). It dragged right
// or up in a box, and MATCH THE LINE, TAP FIRE was two things. Now the hand takes the wall where it is furthest from the dotted line and moves it
// to the line (MOVE IN / MOVE OUT), sweeps slowly up the line when it is nearly there, and TAP FIRE when the match is enough.
function potCue(G) { if (G.over || G.gap > 0) return ['WAIT…', 'wait', false]; const c = G.cfg; if (G.match >= c.pass + 0.01) { const r = fireRect(); return ['TAP FIRE', 'tap', [r.x + r.w / 2, r.y + r.h / 2]]; }
  let bi = 0, bd = 0; for (let i = 0; i < NR; i++) { const d = Math.abs(G.target[i] - G.r[i]); if (d > bd) { bd = d; bi = i; } } const u = bi / (NR - 1);
  if (bd > 0.05) { const a = potScreen(u, G.r[bi]), b = potScreen(u, G.target[bi]); return [G.target[bi] < G.r[bi] ? 'MOVE IN SLOWLY' : 'MOVE OUT SLOWLY', 'drag', [a.x, a.y, b.x, b.y]]; }
  const a = potScreen(0.05, G.target[Math.round(0.05 * (NR - 1))]), b = potScreen(0.95, G.target[Math.round(0.95 * (NR - 1))]); return ['SLIDE UP THE LINE SLOWLY', 'drag', [a.x, a.y, b.x, b.y]]; }
function honest(G, o, mem) {
  const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, c = G.cfg;
  if (G.gap > 0) { mem.sw = null; return; }
  if (G.match >= c.pass + 0.01 + (1 - acc) * 0.03 && (mem.sweeps || 0) >= 1) { if (!mem.fireAt) mem.fireAt = G.t + react; if (G.t >= mem.fireAt) { fire(G); mem.fireAt = null; mem.sweeps = 0; } lift(G); return; }
  mem.fireAt = null;
  if (!mem.sw) { mem.sw = { u: 0, dir: 1, noise: (Math.random() - 0.5) * (1 - acc) * 0.12 }; }
  const s = mem.sw, speed = 0.16 + react * 0.12;
  s.u += s.dir * speed / 60; if (s.u >= 1 || s.u <= 0) { s.dir = -s.dir; s.u = clamp(s.u, 0, 1); mem.sweeps = (mem.sweeps || 0) + 1; s.noise = (Math.random() - 0.5) * (1 - acc) * 0.12; }
  const i = Math.round(s.u * (NR - 1)), want = G.target[i] + s.noise + (Math.random() - 0.5) * (1 - acc) * 0.1, have = G.r[i];
  touch(G, s.u, have + clamp(want - have, -c.reach * 0.7, c.reach * 0.7));
}
function winNow(G) { if (!G || G.over || G.gap > 0) return; G.lesson = null; G.good = G.cfg.pots - 1; G.lives = G.cfg.lives; G.gap = 0; G.r = G.target.slice(); fire(G); }
