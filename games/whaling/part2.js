// ===================== RULES: Whaling (game 22) =====================
// The old way, from a small whaleboat on a grey sea, in 3D. Three parts to every whale:
// 1. THE CHASE: the crew rows; your left thumb steers the bow. The whale shows by its spout, rolls along the top for a while,
//    then dives and comes up somewhere else. Get close.
// 2. THE THROW: with the right thumb, swipe up towards her back while she is up: the direction is your aim, the length how far
//    the harpoon flies (it takes a moment in the air: lead her). Three harpoons; miss them all and she is gone.
// 3. THE RIDE: she runs, towing the boat. Right thumb held: haul the line in (that tires her). Lift: let it run out. Her
//    surges come with a warning (her flukes rise, white water ahead): let go, or the line snaps. Keep the bow towards her with
//    the left thumb, or the boat heels over. Run out of line and she is gone. Tire her out and she is yours.
// Lives: three whales lost (gone, line snapped, boat over). World: metres, x across, z ahead.

const RULES = [
  '<b>The chase:</b> the crew rows. Your left thumb steers. Row to the spout; she dives and comes up again.',
  '<b>The throw:</b> swipe up with your right thumb towards her back while she is up. Direction is aim, length is distance. Lead her.',
  '<b>The ride:</b> hold your right thumb to haul the line in: that tires her. Lift it to let the line run.',
  '<b>When her flukes rise and the water whitens, let go!</b> Haul through a run and the line snaps.',
  'Keep the bow pointing at her (left thumb) or the boat heels over. Three whales lost and the voyage is over.',
];
const WEATHERS = ['overcast', 'storm', 'rain', 'mist', 'golden', 'sunset', 'morning', 'storm', 'overcast', 'dawn'];
function weatherOf(N) { if (N <= 3) return ['morning', 'overcast', 'golden'][N - 1]; const R = rng(N * 2711 + 3); R(); return WEATHERS[(R() * WEATHERS.length) | 0]; }

function makeCfg(N, help) {
  const f = curve(N), e = easyOf(N), boss = N % 10 === 0, x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), slow = help ? 1.2 : 1;
  return { N, f, e, boss, help: !!help, lives: 3,
    whales: N <= 3 ? 1 : Math.round(x(1, 2.4, 25)) + (boss ? 1 : 0),
    row: 5.2, turn: 0.9,                                              // boat speed m/s, turn rad/s
    up: x(9, 5, 30) * slow, down: x(5, 8, 30), wSpeed: x(2.2, 3.6, 30), shy: N < 5 ? 0 : x(0, 0.6, 30),    // surfacing
    range: 30, fly: 0.75, harpoons: 3, body: x(5.5, 4, 30) * slow,     // the throw: max distance, time in the air, how wide a target
    stamina: x(16, 26, 30), haulV: 7, runV: 9, lineMax: 220,          // the ride
    calmP: 0.72, surgeP: x(1.5, 2.5, 30), surgeT: [x(1.4, 2.8, 30), x(2.2, 4.0, 30)], every: [x(5, 2.2, 30), x(8, 3.8, 30)], warn: x(0.9, 0.5, 30) * slow,
    snapT: 0.35, heel: x(0.5, 1.0, 30) / slow, swerve: x(0.15, 0.6, 30) };
}
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null,
    weather: weatherOf(N), ph: 'chase', boat: { x: 0, z: 0, h: 0, heel: 0 }, whale: null, harps: 0, darts: [], line: 0, T: 0, over1: 0, haul: false, steer: 0,
    caught: 0, lost: 0, lives: cfg.lives, made: 0, gap: 0, streak: 0, bestStreak: 0, fast: 1e9 };
  newWhale(G);
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G);
  return G;
}
function newWhale(G) {
  const c = G.cfg, R = G.rnd, b = G.boat, a = b.h + (R() - 0.5) * 1.2, d = 70 + R() * 40;
  G.whale = { x: b.x + Math.sin(a) * d, z: b.z + Math.cos(a) * d, h: R() * TAU, up: true, t: 0, dur: c.up * (0.8 + R() * 0.4), spout: 1.2, stam: c.stamina, P: c.calmP, surge: 0, warn: 0, next: 4, fast: false, t0: G.t };
  G.ph = 'chase'; G.harps = c.harpoons; G.darts = []; G.line = 0; G.T = 0; G.over1 = 0; G.haul = false; G.boat.heel = 0;
  G.ev.push({ k: 'whale' });
}
// ---------- the thumbs ----------
function steer(G, v) { G.steer = clamp(v, -1, 1); }
// throw: aim is the angle off the bow (radians), dist in metres
function throwHarpoon(G, aim, dist) {
  const c = G.cfg, b = G.boat; if (G.over || G.ph !== 'chase' || G.harps <= 0 || G.darts.length) return;
  dist = clamp(dist, 6, c.range); const a = b.h + clamp(aim, -0.9, 0.9);
  G.harps--; G.darts.push({ x: b.x, z: b.z, tx: b.x + Math.sin(a) * dist, tz: b.z + Math.cos(a) * dist, t: 0, dist }); G.ev.push({ k: 'throw', left: G.harps });
}
function haul(G, on) { G.haul = !!on; }
// ---------- every frame ----------
function step(G, dt) {
  if (G.over) return; G.t += dt; const c = G.cfg, b = G.boat, w = G.whale, R = G.rnd, L = lessonNow(G);
  if (G.gap > 0) { G.gap -= dt; if (G.gap <= 0) { if (!G.lesson && G.caught >= c.whales) { finish(G, true); return; } newWhale(G); } return; }
  b.h += G.steer * c.turn * dt;
  if (G.ph === 'chase') {
    b.x += Math.sin(b.h) * c.row * dt; b.z += Math.cos(b.h) * c.row * dt;
    // the whale: up for a while, then down, and up again somewhere ahead (shyer whales turn away from the boat)
    w.t += dt; if (w.spout > 0) w.spout -= dt;
    const away = Math.atan2(w.x - b.x, w.z - b.z), dB = Math.hypot(w.x - b.x, w.z - b.z);
    if (dB < 35 && c.shy) { let dh = away - w.h; while (dh > Math.PI) dh -= TAU; while (dh < -Math.PI) dh += TAU; w.h += clamp(dh, -0.3, 0.3) * c.shy * dt; }
    w.x += Math.sin(w.h) * c.wSpeed * (w.up ? 0.6 : 1.4) * dt; w.z += Math.cos(w.h) * c.wSpeed * (w.up ? 0.6 : 1.4) * dt;
    if (w.t >= w.dur) { w.up = !w.up; w.t = 0; w.dur = w.up ? c.up * (0.8 + R() * 0.4) : c.down * (0.8 + R() * 0.4); if (w.up) { w.spout = 1.2; w.h += (R() - 0.5) * 1.2; G.ev.push({ k: 'blow' }); } else G.ev.push({ k: 'dive' }); }
    if (dB > 260) { w.x = b.x + Math.sin(b.h) * 120; w.z = b.z + Math.cos(b.h) * 120; }
    // the harpoon in the air
    for (const d of G.darts.slice()) { d.t += dt / c.fly; if (d.t >= 1) { G.darts.splice(G.darts.indexOf(d), 1);
        const dx = d.tx - w.x, dz = d.tz - w.z, along = dx * Math.sin(w.h) + dz * Math.cos(w.h), side = dx * Math.cos(w.h) - dz * Math.sin(w.h), inBody = Math.abs(along) < c.body * 1.6 && Math.abs(side) < c.body * 0.45;
        if (w.up && inBody) { G.ph = 'ride'; G.line = Math.hypot(w.x - b.x, w.z - b.z) + 2; G.T = 0.3; w.next = 3 + R() * 2; w.h = Math.atan2(w.x - b.x, w.z - b.z); G.ev.push({ k: 'hit' }); lessonSee(G, 'hit'); }
        else { G.ev.push({ k: 'miss', x: d.tx, z: d.tz, under: !w.up && inBody }); if (G.harps <= 0) { escape(G, 'harpoons'); return; } } } }
    return;
  }
  // THE RIDE: she pulls; the line runs out or comes in; she surges with a warning; the boat follows on the line
  w.t += dt; w.next -= dt;
  if (w.surge > 0) { w.surge -= dt; if (w.surge <= 0) { w.P = c.calmP; w.next = c.every[0] + R() * (c.every[1] - c.every[0]); } }
  else if (w.warn > 0) { w.warn -= dt; if (w.warn <= 0) { w.surge = c.surgeT[0] + R() * (c.surgeT[1] - c.surgeT[0]); w.P = c.surgeP * (0.9 + R() * 0.2) * (L && L.id === 'haul' ? 0.75 : 1); G.ev.push({ k: 'surge' }); } }
  else if (w.next <= 0 && !(L && L.noSurge)) { w.warn = c.warn; G.ev.push({ k: 'warn' }); }
  if (R() < c.swerve * dt) { w.h += (R() < 0.5 ? -1 : 1) * (0.6 + R() * 0.8); G.ev.push({ k: 'swerve' }); }
  const wv = 3 + w.P * 4; w.x += Math.sin(w.h) * wv * dt; w.z += Math.cos(w.h) * wv * dt;
  const P = w.P * (0.8 + 0.2 * Math.max(0, w.stam / c.stamina)), want = P * (G.haul ? 1 : 0.35);
  G.T += (want - G.T) * Math.min(1, dt * 4);
  G.line = clamp(G.line + (G.haul ? -c.haulV * (1.25 - P) : c.runV * P) * dt, 12, c.lineMax + 1);
  // the boat is pulled along the line
  const dx = w.x - b.x, dz = w.z - b.z, dist = Math.hypot(dx, dz) || 1; if (dist > G.line) { const pull = dist - G.line; b.x += dx / dist * pull; b.z += dz / dist * pull; }
  // the bow must point at her, or the boat heels over
  let err = Math.atan2(dx, dz) - b.h; while (err > Math.PI) err -= TAU; while (err < -Math.PI) err += TAU;
  b.heel += ((Math.abs(err) > 0.5 ? (Math.abs(err) - 0.5) * G.T * c.heel * 2.2 : 0) - b.heel * 0.6) * dt; b.heel = Math.max(0, b.heel); b.err = err;
  if (b.heel >= 1) { G.ev.push({ k: 'capsize' }); if (L) { b.heel = 0.3; lessonMiss(G, 'heel'); } else { escape(G, 'capsize'); return; } }
  // tiring her: a line hauled tight between 0.4 and 0.95
  if (G.T > 0.4 && G.T < 1) w.stam -= G.T * dt;
  if (G.T >= 1) { G.over1 += dt; if (G.over1 >= c.snapT) { G.ev.push({ k: 'snap' }); if (L) { G.T = 0.4; G.over1 = 0; lessonMiss(G, 'snap'); } else { escape(G, 'snap'); return; } } } else G.over1 = Math.max(0, G.over1 - dt);
  if (G.line > c.lineMax) { G.ev.push({ k: 'runout' }); if (L) { G.line = c.lineMax * 0.6; lessonMiss(G, 'runout'); } else { escape(G, 'runout'); return; } }
  if (w.stam <= 0) { G.caught++; G.made++; G.streak++; G.bestStreak = Math.max(G.bestStreak, G.streak); G.fast = Math.min(G.fast, G.t - w.t0); G.ev.push({ k: 'caught', n: G.streak, secs: G.t - w.t0 }); lessonSee(G, 'caught'); G.ph = 'done'; G.gap = 2.5; }
}
function escape(G, why) {
  G.ev.push({ k: 'gone', why }); G.streak = 0; G.ph = 'done';
  if (G.lesson) { lessonMiss(G, why); G.gap = 1.5; return; }
  G.lost++; G.made++; G.lives--; if (G.lives <= 0) { finish(G, false, why); return; } G.gap = 2.2;
}
function finish(G, win, why) {
  G.over = win ? 'won' : 'lost';
  G.res = { win, why, stars: win ? (G.lost === 0 ? 3 : G.lost === 1 ? 2 : 1) : 0, caught: G.caught, whales: G.cfg.whales, lost: G.lost, combo: G.fast < 1e9 ? Math.round(G.fast) : 0, time: G.t };
  G.ev.push({ k: win ? 'won' : 'lost', why });
}
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'throw', title: 'ROW, THEN THROW', how: 'Steer towards her spout with your left thumb. When she is up and close, swipe up with your right thumb towards her back.', need: 1, ok: w => w === 'hit' },
      { id: 'haul', title: 'HAUL WHEN SHE IS CALM', how: 'Hold your right thumb down to haul the line in: that tires her. When her flukes rise and the water whitens, LIFT your thumb until she calms.', need: 1, ok: w => w === 'caught' }],
  2: [{ id: 'bow', title: 'BOW TOWARDS HER', how: 'She swerves. Keep the bow pointing at her with your left thumb, or the boat heels over. Throw, then ride her out.', need: 1, ok: w => w === 'caught' }],
  3: [{ id: 'lead', title: 'LEAD HER', how: 'This one is quicker. The harpoon takes a moment to fly: throw a little ahead of where she is going.', need: 1, ok: w => w === 'caught' }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0, miss: 0 }; G.ev.push({ k: 'lessonnext', first: true }); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonSee(G, what) {
  const D = G.lesson; if (!D) return; const st = D.steps[D.i]; if (!st.ok(what)) return;
  D.n++; if (D.n < st.need) { G.ev.push({ k: 'lessonok', n: D.n, need: st.need }); return; }
  D.i++; D.n = 0; D.miss = 0;
  if (D.i >= D.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); Object.assign(G, { caught: 0, lost: 0, made: 0, lives: G.cfg.lives, streak: 0, bestStreak: 0, fast: 1e9 }); if (G.ph !== 'ride') G.gap = Math.max(G.gap, 1.5); }
  else G.ev.push({ k: 'lessonnext' });
}
function lessonMiss(G, why) { const D = G.lesson; if (!D) return; D.miss++; G.ev.push({ k: 'lessonmiss', why, how: D.steps[D.i].how }); }

// ---------- for the robots ----------
// BLIND: steer hard left, right or straight; a swipe up the middle, or off to a side, short or long; hold to haul; let go.
const BLIND = {
  l: G => steer(G, -1), r: G => steer(G, 1), s: G => steer(G, 0),
  t: G => throwHarpoon(G, (Math.random() - 0.5) * 1.2, 8 + Math.random() * 22), m: G => throwHarpoon(G, 0, 18),
  h: G => haul(G, true), g: G => haul(G, false),
};
// a whaler who looks: steers for where she will be, throws when she is up and in range (leading her), hauls when calm, lets go
// at the warning (after reacting), keeps the bow on her
function honest(G, o, mem) {
  const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, c = G.cfg, b = G.boat, w = G.whale; if (!w || G.ph === 'done') { haul(G, false); return; }
  const bear = Math.atan2(w.x - b.x, w.z - b.z); let err = bear - b.h; while (err > Math.PI) err -= TAU; while (err < -Math.PI) err += TAU;
  if (G.ph === 'chase') {
    const ahead = w.up ? 0 : 12, tx = w.x + Math.sin(w.h) * ahead, tz = w.z + Math.cos(w.h) * ahead; let e2 = Math.atan2(tx - b.x, tz - b.z) - b.h; while (e2 > Math.PI) e2 -= TAU; while (e2 < -Math.PI) e2 += TAU;
    steer(G, clamp(e2 * 2, -1, 1));
    const dist = Math.hypot(w.x - b.x, w.z - b.z); mem.seenUp = w.up ? (mem.seenUp || G.t) : 0;
    if (w.up && G.t - mem.seenUp > react && dist < c.range - 2 && w.t < w.dur - c.fly - 0.2 && !G.darts.length && G.t > (mem.thr || 0)) {
      const lead = c.fly * c.wSpeed * 0.6, px = w.x + Math.sin(w.h) * lead, pz = w.z + Math.cos(w.h) * lead, n = (1 - acc) * 1.4;
      let aim = Math.atan2(px - b.x, pz - b.z) - b.h; while (aim > Math.PI) aim -= TAU; while (aim < -Math.PI) aim += TAU;
      throwHarpoon(G, aim + (Math.random() - 0.5) * 0.25 * n, Math.hypot(px - b.x, pz - b.z) * (1 + (Math.random() - 0.5) * 0.35 * n)); mem.thr = G.t + 1.2;
    }
    return;
  }
  // the ride
  steer(G, clamp(err * 2.5 + (Math.random() - 0.5) * (1 - acc), -1, 1));
  if (w.warn > 0 || w.surge > 0) { mem.warnAt = mem.warnAt || G.t; if (G.t - mem.warnAt >= react * (0.7 + Math.random() * 0.6)) haul(G, false); }
  else { mem.warnAt = 0; haul(G, Math.random() < acc + 0.08 ? G.T < 0.9 : !G.haul); }
}
function winNow(G) { if (!G || G.over || G.gap > 0) return; G.lesson = null; G.caught = G.cfg.whales - 1; G.lives = G.cfg.lives; G.gap = 0; if (G.ph !== 'ride') { G.ph = 'ride'; G.line = 40; G.T = 0.5; } G.whale.stam = 0.01; G.whale.warn = 0; G.whale.surge = 0; G.whale.next = 99; haul(G, true); }
