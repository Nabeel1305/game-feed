// ===================== RULES: Reel (game 9) =====================
// A lake, a float, a rod. Cast to where fish are rising, wait, strike when the float is pulled right under (not on a nibble),
// then fight the fish home: hold to reel, let go when it runs, pull the rod against it to steer it out of the weeds.
// World units are metres: x is to the right, z is straight out over the water from the end of the jetty (the player is at 0, 0).
// No drawing here, so the robots can play thousands of trips fast.

const RULES = [
  '<b>Cast to the rings.</b> Pull your thumb down and let go: the float flies the other way. Fish are where the water rings.',
  '<b>Wait for it.</b> Little dips are fish nibbling. Strike only when the float is <b>pulled right under</b>: <b>tap</b>.',
  '<b>Too soon scares them off.</b> Strike at a nibble and the fish bolts; keep doing it and the whole lake goes quiet.',
  '<b>Hold to reel.</b> Keep the line tight or the hook falls out.',
  '<b>Let go when it runs.</b> When the fish thrashes and pulls, lift your thumb, or the line snaps. Hold again when it calms.',
  '<b>Steer it.</b> While you hold, drag your thumb the other way to where it swims, or it reaches the weeds and the line breaks.',
  'Land the fish asked for before the light goes. Three lines: a snap or a snag costs one.',
];
// the fish of the lake: weight range (kg), how hard it pulls, how often it runs, where it is found
const SPECIES = [
  { id: 'perch', name: 'Perch', kg: [0.2, 0.9], pow: 0.45, agg: 1.1, from: 1, look: { back: 0x3b4a22, side: 0x9aa64a, belly: 0xf2e9c8, bars: 1, fins: 0xd9572b, len: 0.28, deep: 0.3 } },
  { id: 'trout', name: 'Rainbow Trout', kg: [0.5, 3.2], pow: 0.62, agg: 1.3, from: 1, look: { back: 0x3e5540, side: 0xb8b9a6, belly: 0xf3efe6, spots: 1, band: 0xd26b7c, fins: 0x8a8a70, len: 0.45, deep: 0.24 } },
  { id: 'bass', name: 'Largemouth Bass', kg: [0.6, 4.5], pow: 0.7, agg: 1.0, from: 3, look: { back: 0x35452a, side: 0x7d8a52, belly: 0xe9e4c4, blotch: 1, fins: 0x6b6b45, len: 0.45, deep: 0.3 } },
  { id: 'carp', name: 'Common Carp', kg: [1.5, 14], pow: 0.82, agg: 0.75, from: 5, look: { back: 0x4a3c1c, side: 0xb8902e, belly: 0xe8d9a0, scales: 1, fins: 0x8a5a2a, len: 0.6, deep: 0.33 } },
  { id: 'pike', name: 'Northern Pike', kg: [1.5, 12], pow: 0.9, agg: 1.45, from: 8, look: { back: 0x2f3e22, side: 0x6f7d3c, belly: 0xece6c6, dots: 1, fins: 0x9a6a3a, len: 0.8, deep: 0.17 } },
  { id: 'catfish', name: 'Channel Catfish', kg: [2, 18], pow: 0.95, agg: 0.9, from: 12, look: { back: 0x3a3a3e, side: 0x7b7c80, belly: 0xe6e3dc, specks: 1, fins: 0x4a4a4e, len: 0.7, deep: 0.2, whiskers: 1 } },
];
const GOLDEN = { id: 'golden', name: 'Golden Carp', kg: [3, 16], pow: 0.85, agg: 0.8, gold: true, look: { back: 0xb5761a, side: 0xf0b83a, belly: 0xfbe8a8, scales: 1, fins: 0xe88a2a, len: 0.6, deep: 0.33 } };
const GIANTS = [{ id: 'giantpike', name: 'Old Jaws, the giant Pike', kg: [14, 24], pow: 1.15, agg: 1.5, giant: true, look: SPECIES[4].look },
                { id: 'giantcat', name: 'The Mud King, a giant Catfish', kg: [20, 40], pow: 1.2, agg: 1.0, giant: true, look: SPECIES[5].look },
                { id: 'giantcarp', name: 'Big Bertha, a giant Carp', kg: [16, 30], pow: 1.1, agg: 0.85, giant: true, look: SPECIES[3].look }];
const WEATHERS = ['dawn', 'morning', 'golden', 'overcast', 'rain', 'mist', 'sunset', 'noon', 'storm', 'dusk', 'night'];
function weatherOf(N, seed) { if (N <= 2) return ['morning', 'golden'][N - 1]; const R = rng(N * 7919 + 3); R(); return WEATHERS[(R() * WEATHERS.length) | 0]; }

function makeCfg(N, help) {
  const f = curve(N), e = easyOf(N), boss = N % 10 === 0, x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), hp = help ? 1 : 0;
  const goal = boss ? 1 : N <= 3 ? 2 : N <= 9 ? 3 : N <= 24 ? 4 : 5;
  return { N, f, e, boss, help: !!help, goal, rigs: 3,
    time: Math.round((boss ? 150 : 55 + 38 * goal) * (1 + 0.35 * e) * (help ? 1.25 : 1)),      // seconds of light
    spots: boss ? 1 : N < 5 ? 3 : 2 + (N % 3 === 0 ? 1 : 0),
    spotR: x(4.4, 2.3, 20) + 0.8 * e,                     // how close to the rings the float must land (m)
    bite: [x(1.2, 2.6, 25), x(2.8, 6.5, 25)],              // seconds from the float settling to the bite (plus more when far from the middle)
    nib: N === 1 ? 0 : Math.min(4, Math.round(x(0.6, 4.4, 22))),       // most nibbles before a bite
    nibDeep: x(0.3, 0.72, 25),                             // how far a nibble pulls the float down (1 = right under)
    win: (x(1.1, 0.42, 22) + 0.25 * e) * (help ? 1.3 : 1),  // the moment to strike (s)
    castErr: x(0.25, 1.1, 30),                             // how far a cast wanders (m, at 20 m)
    wind: x(0.1, 1.2, 25),
    tell: (x(0.62, 0.3, 25) + 0.12 * e) * (1 + 0.25 * hp),  // how long a fish thrashes before it runs (s)
    snapK: x(2.0, 5.2, 25) * (1 - 0.3 * e),                // how fast an overloaded line breaks
    slack: x(2.6, 1.3, 25) + 0.6 * e,                      // seconds of slack line before the hook falls out
    snag: 7.6,                                             // how far to either side the weeds are (m): the reeds and the lily pads
    tire: x(0.12, 0.065, 25) * (1 + 0.4 * e) * (help ? 1.2 : 1),
    surgeAmp: x(0.55, 0.95, 25), surgeEvery: x(5.5, 3.0, 25), swim: x(0.9, 1.9, 25),
    powUp: Math.min(0.35, f * 0.006), spool: 46 };
}
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null,
    weather: weatherOf(N, seed), time: cfg.time, rigs: cfg.rigs, caught: [], lost: 0, noise: 0, spots: [], respawn: [],
    ph: 'idle', ph_t: 0, fl: { x: 0, z: 3, y: 0, dip: 0, sx: 0, sz: 3 }, bait: true, B: null, F: null, land: null, wind: 0, bigKg: 0,
    in: { hold: false, side: 0 }, bad: 0 };
  G.wind = (G.rnd() * 2 - 1) * cfg.wind;
  for (let i = 0; i < cfg.spots; i++) addSpot(G);
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G);
  return G;
}
function pickFish(G, giant) {
  const R = G.rnd, c = G.cfg;
  if (giant) { const s = GIANTS[(G.N / 10 - 1) % GIANTS.length | 0]; return mkFish(G, s, 1); }
  if (R() < 0.02 && G.N >= 2) return mkFish(G, GOLDEN, 1);      // P17: about one fish in fifty is a golden carp
  const pool = SPECIES.filter(s => s.from <= G.N); const s = pool[(R() * pool.length) | 0];
  return mkFish(G, s, 0);
}
function mkFish(G, s, special) {
  const R = G.rnd, u = Math.pow(R(), 1.8), kg = +(s.kg[0] + (s.kg[1] - s.kg[0]) * u).toFixed(2);
  const size = u;      // 0 = small of its kind, 1 = a monster
  return { sp: s, kg, size, pow: Math.min(1.35, s.pow * (0.8 + 0.4 * size) + G.cfg.powUp * (special ? 0.5 : 1)), agg: s.agg };
}
function addSpot(G, giant) {
  const R = G.rnd; let x, z, n = 0;
  do { z = 11 + R() * 19; x = (R() * 2 - 1) * Math.min(5, z * 0.3); n++; } while (n < 20 && (G.spots.some(s => Math.hypot(s.x - x, s.z - z) < 7) || Math.hypot(x - G.fl.x, z - G.fl.z) < 4));
  const boss = G.cfg.boss && !G.caught.length;
  const s = { id: (G.sid = (G.sid || 0) + 1), x, z, r: G.cfg.spotR * (boss ? 1.2 : 1), life: 26 + R() * 22, rise: 0.4 + R() * 1.2, fish: pickFish(G, boss), age: 0 };
  G.spots.push(s); G.ev.push({ k: 'spot', s }); return s;
}
function dropSpot(G, s, why, later = 3.5) { G.spots = G.spots.filter(q => q !== s); G.respawn.push(later + G.rnd() * 2); if (why) G.ev.push({ k: why, x: s.x, z: s.z }); if (G.B && G.B.s === s) G.B = null; }

// ---------- every frame ----------
function step(G, dt) {
  if (G.over) return; G.t += dt; G.ph_t += dt; const c = G.cfg;
  if (!G.lesson && G.ph !== 'land') { G.time -= dt; if (G.time <= 0) { G.time = 0; finish(G, false, 'dark'); return; } }
  G.noise = Math.max(0, G.noise - dt / 18);
  for (let i = G.respawn.length - 1; i >= 0; i--) { G.respawn[i] -= dt; if (G.respawn[i] <= 0) { G.respawn.splice(i, 1); if (G.spots.length < c.spots) addSpot(G); } }
  for (const s of G.spots.slice()) {
    s.age += dt; s.rise -= dt;
    if (s.rise <= 0) { s.rise = (G.noise > 1.5 ? 4 : 1.2) + G.rnd() * 2.6; G.ev.push({ k: 'rise', x: s.x + (G.rnd() - 0.5) * s.r * 0.8, z: s.z + (G.rnd() - 0.5) * s.r * 0.8, big: s.fish.size > 0.6 || s.fish.sp.giant }); }
    if (s.age > s.life && !(G.B && G.B.s === s) && !(G.F && G.F.s === s) && !c.boss) dropSpot(G, s, 'moved', 0.5);
  }
  const fl = G.fl;
  if (G.ph === 'fly') {
    const u = Math.min(1, G.ph_t / fl.dur); fl.x = lerp(fl.sx, fl.tx, u); fl.z = lerp(fl.sz, fl.tz, u); fl.y = Math.sin(u * Math.PI) * fl.arc;
    if (u >= 1) landFloat(G);
  } else if (G.ph === 'wait' || G.ph === 'bite') waitStep(G, dt);
  else if (G.ph === 'fight') fightStep(G, dt);
  else if (G.ph === 'reelin') { const u = Math.min(1, G.ph_t / 0.9); fl.x = lerp(fl.sx, 0, u); fl.z = lerp(fl.sz, 3, u); fl.y = 0; if (u >= 1) G.ph = 'idle'; }
  else if (G.ph === 'land') { if (G.ph_t > 2.4) { G.ph = 'idle'; G.ph_t = 0; fl.x = 0; fl.z = 3; if (!G.lesson && G.caught.length >= c.goal) finish(G, true); } }
}
// ---------- casting ----------
// The player's cast: aim at x, z (where the thumb's pull points). It wanders a little with distance and wind.
function cast(G, x, z) {
  if (G.over || G.ph === 'fight' || G.ph === 'land' || G.ph === 'fly') return false;
  if (G.ph === 'bite') { G.ev.push({ k: 'missed', x: G.fl.x, z: G.fl.z }); if (G.B) dropSpot(G, G.B.s, null, 2); }
  if (G.B && !G.B.bit) G.B.s.cold = Math.max(G.B.s.cold || 0, 0);
  G.B = null; G.bait = true;
  z = clamp(z, 6, 34); x = clamp(x, -16, 16); const c = G.cfg, d = Math.hypot(x, z), R = G.rnd;
  const g = () => (R() + R() + R() - 1.5) / 1.5, err = c.castErr * d / 20;
  const fl = G.fl; fl.sx = 0.35; fl.sz = 1.2; fl.tx = clamp(x + g() * err + G.wind * d / 20, -18, 18); fl.tz = clamp(z + g() * err, 5, 36); fl.dur = 0.55 + d * 0.022; fl.arc = 2 + d * 0.3;
  G.ph = 'fly'; G.ph_t = 0; G.ev.push({ k: 'cast', d }); return true;
}
function spotAt(G, x, z) { let best = null, bd = 1e9; for (const s of G.spots) { const d = Math.hypot(s.x - x, s.z - z); if (d < s.r && d < bd) { bd = d; best = s; } } return best && { s: best, d: bd }; }
function landFloat(G) {
  const fl = G.fl, c = G.cfg; fl.y = 0; G.ph = 'wait'; G.ph_t = 0; G.ev.push({ k: 'splash', x: fl.x, z: fl.z });
  const hit = spotAt(G, fl.x, fl.z);
  if (hit) {
    const L = lessonNow(G), R = G.rnd, near = hit.d / hit.s.r;
    let delay = (c.bite[0] + (c.bite[1] - c.bite[0]) * R()) * (0.65 + 0.7 * near) * (1 + 0.6 * G.noise);
    let nib = L && L.nib != null ? L.nib : Math.round(R() * c.nib);
    if (L && L.nib != null) delay = Math.max(delay, 1.6 + nib * 1.1);
    const dips = []; for (let i = 0; i < nib; i++) dips.push({ at: delay * (0.2 + 0.7 * (i + R() * 0.8) / nib), len: 0.18 + R() * 0.16, deep: c.nibDeep * (0.6 + 0.4 * R()) });
    G.B = { s: hit.s, delay, dips, bit: false, t: 0 }; G.ev.push({ k: 'inspot', x: fl.x, z: fl.z }); lessonSee(G, 'inspot');
  } else { G.ev.push({ k: 'nospot', x: fl.x, z: fl.z }); lessonMiss(G, 'nospot'); }
}
function waitStep(G, dt) {
  const fl = G.fl, B = G.B; fl.dip = 0;
  if (!B || !G.bait) return;
  B.t += dt;
  for (const d of B.dips) if (B.t >= d.at && B.t < d.at + d.len) { fl.dip = d.deep * Math.sin((B.t - d.at) / d.len * Math.PI); if (!d.said) { d.said = 1; G.ev.push({ k: 'nibble', x: fl.x, z: fl.z }); } }
  if (G.ph === 'wait' && B.t >= B.delay) { G.ph = 'bite'; G.ph_t = 0; B.bit = true; G.ev.push({ k: 'bite', x: fl.x, z: fl.z, kg: B.s.fish.kg }); }
  if (G.ph === 'bite') { fl.dip = 1; if (G.ph_t > G.cfg.win) { G.ph = 'wait'; G.bait = false; G.ev.push({ k: 'stolen', x: fl.x, z: fl.z }); dropSpot(G, B.s, null, 2.5); G.B = null; fault(G, 'late'); } }
}
// ---------- the strike: a flick of the thumb upward ----------
function strike(G) {
  if (G.over) return;
  if (G.ph === 'bite') { hook(G); return; }
  if (G.ph !== 'wait') return;
  const fl = G.fl; G.ev.push({ k: 'jerk' });
  if (G.B && G.bait) { const s = G.B.s; dropSpot(G, s, 'spooked', 4); G.noise += 1; fault(G, 'soon'); }
  else { G.noise += 0.35; fault(G, G.bait ? 'nothing' : 'bare'); }
  // anything close by hears it too: the more he does it, the quieter the lake (rule 1: a habit is ruinous, a slip is cheap)
  for (const s of G.spots.slice()) if (Math.hypot(s.x - fl.x, s.z - fl.z) < 6 + 2 * G.noise) dropSpot(G, s, 'spooked', 4 + 2 * G.noise);
  fl.sx = fl.x; fl.sz = fl.z; G.ph = 'reelin'; G.ph_t = 0; G.B = null;
}
function hook(G) {
  const fl = G.fl, s = G.B.s, fish = s.fish, L = lessonNow(G), R = G.rnd;
  G.ev.push({ k: 'hooked', x: fl.x, z: fl.z, kg: fish.kg }); lessonSee(G, 'hooked');
  const soft = L && L.soft;
  G.F = { s, fish, D: Math.hypot(fl.x, fl.z), X: fl.x, dir: R() < 0.5 ? -1 : 1, Sf: soft ? 0.25 : 1, T: 0.4, strain: 0, slack: 0, surge: 0, tell: 0,
    nextSurge: soft ? 1e9 : 1.4 + R() * 2.2, turnT: 2 + R() * 3, good: 0, t: 0, soft, calm: L && L.calm, ran: 0 };
  dropSpot(G, s, null, 3); G.B = null; G.ph = 'fight'; G.ph_t = 0;
}
// ---------- the fight ----------
// tension T (1 = the line's limit) comes from how hard the fish pulls and whether he is reeling. Over the limit the line strains and
// snaps; too slack for too long and the hook falls out. Rod against the fish's way tires it and turns it; with it, it runs for the weeds.
function fightStep(G, dt) {
  const F = G.F, c = G.cfg, fish = F.fish, R = G.rnd, inp = G.in, L = lessonNow(G); F.t += dt;
  // runs: a thrash first (the tell), then the run; never on a beat he can set (its own random clock, LESSONS rule 1)
  if (F.surge <= 0 && F.tell <= 0) { F.nextSurge -= dt * fish.agg * (F.D < 5 && F.Sf > 0.5 ? 4 : 1); if (F.nextSurge <= 0) { F.tell = c.tell; G.ev.push({ k: 'thrash', x: F.X, z: F.D }); } }
  if (F.tell > 0) { F.tell -= dt; if (F.tell <= 0) { F.surge = 0.8 + R() * 1.1; F.amp = c.surgeAmp * (0.75 + 0.5 * R()) * (0.45 + 0.55 * F.Sf) * (0.7 + 0.6 * fish.pow); F.held = 0; G.ev.push({ k: 'run' }); } }
  if (F.surge > 0) { F.surge -= dt; if (inp.hold) F.held += dt; if (F.surge <= 0) { F.nextSurge = c.surgeEvery * (0.6 + 0.8 * R()); G.ev.push({ k: 'runover', ok: F.strain < 0.9 }); if (F.held < 0.35) lessonSee(G, 'survived'); } }
  const P = fish.pow * (0.32 + 0.45 * F.Sf) + (F.surge > 0 ? F.amp : 0);
  const side = inp.hold ? inp.side : inp.side * 0.6, opp = -side * F.dir;      // opp > 0: the rod pulls against the way it is going
  const reel = inp.hold ? 0.52 : 0;
  let target = 0.58 * P + reel + (opp > 0.3 ? 0.06 : 0);
  if (F.surge > 0 && inp.hold) target = Math.max(target, 1.14 + 0.25 * F.amp);      // reeling against a run is always too much, on every level
  F.T += (target - F.T) * Math.min(1, dt * 9);
  // the line: in when reeling against a pull it can beat, out when the fish pulls harder than the drag
  const v = (P - (inp.hold ? 0.95 : 0.25)) * 3.2; F.D = Math.max(0, F.D + v * dt);
  if (inp.hold && v < 0) F.reeled = (F.reeled || 0) - v * dt;
  // steering: the fish heads for the weeds on one side; rod against it slows it, then turns it
  if (!F.calm) {
    F.turnT -= dt; const sw = c.swim * (0.6 + 0.6 * fish.pow) * (opp > 0.3 ? -0.55 : opp < -0.3 ? 1.35 : 1);
    F.X += F.dir * sw * dt * (F.surge > 0 ? 1.4 : 1);
    if (opp > 0.3) { F.good += dt; if (F.good > 1.1) { F.dir = -F.dir; F.good = 0; F.turnT = 2 + R() * 3; G.ev.push({ k: 'turned' }); lessonSee(G, 'turned'); } } else F.good = Math.max(0, F.good - dt * 0.5);
    if (F.turnT <= 0) { F.turnT = 2.5 + R() * 3.5; const toward = Math.sign(F.X || (R() - 0.5)); if (R() < 0.7 && toward !== F.dir) { F.dir = toward; G.ev.push({ k: 'turn' }); } }
  }
  // tiring: a fish fighting a tight line tires; more so against the rod and when it runs
  F.Sf = Math.max(0.05, F.Sf - dt * c.tire * (F.T > 0.45 ? 1 : 0.25) * (opp > 0.3 ? 1.9 : 1) * (F.surge > 0 ? 1.6 : 1) / (0.6 + 0.6 * fish.pow));
  // the limits
  if (F.T > 1) F.strain += (F.T - 0.95) * c.snapK * 3 * dt; else F.strain = Math.max(0, F.strain - dt * 0.4);
  if (F.T < 0.3) F.slack += dt; else F.slack = Math.max(0, F.slack - dt * 2);
  if (F.strain >= 1) return fightEnd(G, 'snap');
  if (F.slack > c.slack && !(L && L.soft)) return fightEnd(G, 'off');
  if (Math.abs(F.X) > c.snag) return fightEnd(G, 'snag');
  if (F.D > c.spool) return fightEnd(G, 'spool');
  if (F.D < 1.8) return caught(G);
}
function fightEnd(G, why) {
  const F = G.F, L = lessonNow(G);
  if (G.lesson && why !== 'off') {      // learning: nothing is lost; the fish is put back where it was, a little calmer
    if (why === 'snap') { F.strain = 0; F.surge = 0; F.tell = 0; F.nextSurge = 2.5; }
    if (why === 'snag') { F.X = Math.sign(F.X) * G.cfg.snag * 0.55; F.dir = -Math.sign(F.X); }
    if (why === 'spool') F.D = 30;
    G.ev.push({ k: 'saved', why }); lessonMiss(G, why); return;
  }
  G.ev.push({ k: 'gone', why, x: F.X, z: F.D }); G.F = null; G.ph = 'reelin'; G.ph_t = 0; G.fl.sx = F.X * 0.5; G.fl.sz = Math.max(3, F.D * 0.5);
  if (why !== 'off') { G.rigs--; G.lost++; }
  fault(G, why);
  if (G.rigs <= 0) finish(G, false, 'rigs');
}
function caught(G) {
  const F = G.F, fish = F.fish; G.F = null; G.ph = 'land'; G.ph_t = 0; G.land = fish;
  G.caught.push({ id: fish.sp.id, name: fish.sp.name, kg: fish.kg }); G.bigKg = Math.max(G.bigKg, fish.kg);
  G.ev.push({ k: 'caught', fish, n: G.caught.length }); lessonSee(G, 'caught');
}
function fault(G, why) { G.bad++; G.ev.push({ k: 'fault', why }); if (G.lesson) lessonMiss(G, why); }
function finish(G, win, why) {
  const c = G.cfg; G.over = win ? 'won' : 'lost';
  const stars = win ? (G.lost === 0 && G.time > c.time * 0.3 ? 3 : G.lost <= 1 ? 2 : 1) : 0;
  G.res = { win, why, stars, caught: G.caught.length, goal: c.goal, lost: G.lost, time: G.t, big: G.caught.reduce((a, b) => b.kg > a.kg ? b : a, { kg: 0 }), combo: 0 };
  G.ev.push({ k: win ? 'won' : 'lost', why });
}

// ---------- LESSONS: the first three trips teach every move, two or three times each, before the clock runs ----------
const LESSONS = {
  1: [{ id: 'cast', title: 'CAST TO THE RINGS', how: 'Pull your thumb down, then let go: the float flies the other way. Land it inside the rings, where fish are rising.', need: 2, ok: w => w === 'inspot', soft: 1 },
      { id: 'strike', title: 'STRIKE WHEN IT GOES UNDER', how: 'Wait. A little dip is a nibble: leave it. When the float is pulled right under, TAP.', need: 2, ok: w => w === 'hooked', nib: 1, soft: 1, calm: 1 },
      { id: 'reel', title: 'HOLD TO REEL IT IN', how: 'Hold your thumb on the screen to wind the fish in. Lift it and the line goes slack.', need: 2, ok: w => w === 'caught', soft: 1, calm: 1 }],
  2: [{ id: 'run', title: 'LET GO WHEN IT RUNS', how: 'When the fish thrashes and the line screams, lift your thumb, or it snaps. Hold again when it calms down.', need: 3, ok: w => w === 'survived', calm: 1 },
      { id: 'steer', title: 'STEER IT FROM THE WEEDS', how: 'Watch which way the line moves. While you hold, drag your thumb the other way to pull it back out.', need: 2, ok: w => w === 'turned' }],
  3: [{ id: 'all', title: 'PUT IT TOGETHER', how: 'Cast to the rings, strike when it goes under, hold to reel, let go when it runs, steer it from the weeds.', need: 2, ok: w => w === 'caught' }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0, miss: 0 }; G.ev.push({ k: 'lessonnext', first: true }); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonSee(G, what) {
  const D = G.lesson; if (!D) return; const st = D.steps[D.i]; if (!st.ok(what)) return;
  D.n++; if (D.n < st.need) { G.ev.push({ k: 'lessonok', n: D.n, need: st.need }); return; }
  D.i++; D.n = 0; D.miss = 0;
  if (D.i >= D.steps.length) { G.lesson = null; G.caught.length = 0; G.ev.push({ k: 'lessondone', N: G.N }); }
  else G.ev.push({ k: 'lessonnext' });
}
function lessonMiss(G, why) { const D = G.lesson; if (!D) return; D.miss++; G.ev.push({ k: 'lessonmiss', why, how: D.steps[D.i].how }); }

// ---------- for the robots (bots.js, test_play.py) ----------
// BLIND: each letter one thing a thumb can do without looking: cast anywhere, cast at the rings (it knows where, not when),
// strike, hold, let go, swap the rod to the other side.
const BLIND = {
  C: G => cast(G, (Math.random() * 2 - 1) * 14, 8 + Math.random() * 24),
  A: G => { const s = G.spots[G.spots.length - 1]; if (s) cast(G, s.x, s.z); },
  K: G => strike(G),
  H: G => { G.in.hold = true; },
  U: G => { G.in.hold = false; },
  S: G => { G.in.side = G.in.side > 0 ? -1 : 1; },
};
// HONEST: a person who looks. react = seconds to see and act; acc = how often a move is right when meant.
function honest(G, o, mem) {
  const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, t = G.t;
  const later = (key, cond) => { if (!cond) { mem[key] = null; return false; } if (mem[key] == null) mem[key] = t; return t - mem[key] >= react; };
  if (G.ph === 'idle' || (G.ph === 'wait' && (!G.B || !G.bait) && G.ph_t > 1.2 + react)) {      // cast to the rings (a thumb's aim)
    if (!later('cast', G.spots.length)) return;
    const s = G.spots.reduce((a, b) => (Math.hypot(b.x, b.z) < Math.hypot(a.x, a.z) ? b : a)), e = (1 - acc) * 9 + 0.6;
    cast(G, s.x + (Math.random() * 2 - 1) * e, s.z + (Math.random() * 2 - 1) * e); mem.cast = null; return;
  }
  if (G.ph === 'bite') { if (later('strike', true)) { strike(G); mem.strike = null; } return; }
  mem.strike = null;
  if (G.ph === 'wait' && G.fl.dip > 0.2 && Math.random() < (1 - acc) * 0.02) strike(G);      // now and then jumps at a nibble
  if (G.ph !== 'fight') { G.in.hold = false; return; }
  const F = G.F;
  // let go when it thrashes or runs; hold again a moment after it stops; keep it tight otherwise
  const danger = F.tell > 0 || F.surge > 0;
  if (later('danger', danger)) { mem.calm = null; G.in.hold = Math.random() > acc * 1.02; }
  else if (!danger) { if (later('calm2', true)) G.in.hold = F.T < 0.92 || F.slack > 0.3; }
  if (danger) mem.calm2 = null;
  // steer against the way the line is moving (read a moment late)
  const dir = F.dir; if (mem.seenDir !== dir) { mem.seenDir = dir; mem.dirT = t; }
  if (t - mem.dirT >= react) G.in.side = Math.random() < acc ? -dir : (mem.wrong = mem.wrong || (Math.random() < 0.5 ? 1 : -1));
}
// The shortest way to a real win, for tools/test_controls.py: one fish short, and that fish nearly landed.
function winNow(G) {
  if (!G || G.over || G.ph === 'land' || G.ph === 'fight') return; G.lesson = null;
  while (G.caught.length < G.cfg.goal - 1) G.caught.push({ id: 'perch', name: 'Perch', kg: 0.5 });
  if (!G.spots.length) addSpot(G);
  const s = G.spots[0]; G.ph = 'bite'; G.ph_t = 0; G.bait = true; G.B = { s, delay: 0, dips: [], bit: true, t: 0 }; G.fl.x = s.x; G.fl.z = s.z;
  strike(G); G.F.D = 1.85; G.F.Sf = 0.1; G.F.nextSurge = 1e9; G.in.hold = true;
}
