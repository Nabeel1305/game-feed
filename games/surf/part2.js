// ===================== RULES: Surf =====================
// A session of three waves. Catch each one (hold PADDLE as it comes, stand when it lifts you), then ride its face: the wave
// peels along the shore and the breaking part (the curl) chases you. Down the face you gain speed, up the face you spend it.
// Turns, snaps off the lip, cutbacks, airs and barrel rides score; the same move again scores less. Beat the session target.
// The face: x along the shore (metres, + the way the wave peels), s from 0 at the base to 1 at the lip; heading th (0 along
// the wave, + up the face); speed v (m/s).
const RULES = [
  '<b>Catch it:</b> hold PADDLE as the wave comes; when it lifts you (the ring turns green), swipe up to stand.',
  '<b>Left thumb: steer.</b> Push the way you want to ride: up the face to climb, down to drop. Down gains speed, up spends it.',
  '<b>Stay ahead of the curl</b>, the breaking part chasing you. Pump up and down for speed.',
  '<b>Tricks:</b> turn hard at the lip (a snap), turn back towards the curl and out again (a cutback), fly off the lip and swipe to spin, then point down to land. Hold CROUCH inside a barrel.',
  'The same move again scores less: mix them up. Beat the target over three waves.',
];
const SKINS = [{ id: 'sun', name: 'Sunburst', col: 0xffb020, col2: 0xff5a3a, stars: 0 }, { id: 'reef', name: 'Reef', col: 0x2ad8c0, col2: 0x1a5aa8, stars: 5 }, { id: 'kelp', name: 'Kelp', col: 0x5aa82a, col2: 0xf0e8c0, stars: 12 },
  { id: 'coral', name: 'Coral', col: 0xff6a8a, col2: 0xffffff, stars: 22 }, { id: 'night', name: 'Night swell', col: 0x2a2a6a, col2: 0x8ad8ff, stars: 34 }, { id: 'gold', name: 'Golden hour', col: 0xf0c040, col2: 0x8a3a1a, stars: 50 }];
const UPGRADES = [{ id: 'fins', name: 'Thruster fins', max: 2, cost: l => [60, 140][l], desc: 'Sharper turns wobble you less.' }, { id: 'rail', name: 'Soft rails', max: 2, cost: l => [70, 160][l], desc: 'Climbing costs a little less speed.' },
  { id: 'wax', name: 'Fresh wax', max: 1, cost: () => 110, desc: 'Steadier landings.' }];
const upLv = id => { if (typeof HEADLESS !== 'undefined' && HEADLESS) return 0; return ((store.get('ups', {}) || {})[id]) | 0; };
const RANKS = [[0, 'Grom'], [60, 'Wave catcher'], [200, 'Local'], [500, 'Ripper'], [1100, 'Charger'], [2500, 'Legend of the line-up']];
const PLACES = [{ name: 'Lagoon Point', sky: 'morning' }, { name: 'Palm Reef', sky: 'noon' }, { name: 'Sunset Bay', sky: 'golden' }, { name: 'Storm Cove', sky: 'overcast' }];
const placeOf = N => Math.floor((N - 1) / 4) % PLACES.length;
const MOVES = { carve: { name: 'CARVE', pts: 60 }, snap: { name: 'SNAP', pts: 160 }, cutback: { name: 'CUTBACK', pts: 240 }, air: { name: 'AIR', pts: 320 }, barrel: { name: 'BARREL', pts: 320 } };
const GF = 4.0, DRAG = 0.35, VMAX = 16;
function makeCfg(N, help, o = {}) {
  const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s));
  return { N, f, help: !!help, place: placeOf(N), H: x(1.6, 4.2, 18), Lw: x(130, 230, 16), vp: x(6.2, 9.0, 16), fast: N >= 4, barrels: N >= 3, rides: 3,
    target: Math.round((820 + 2750 * (1 - Math.exp(-(N - 1) / 20))) * (help ? 0.75 : 1) / 10) * 10, win: x(0.6, 0.32, 12), early: 0.55, assist: N <= 6, free: !!o.free };
}
// ---------- one wave: its peel, its sections (learnable: the same for a level and a wave number) ----------
function makeWave(cfg, n) { const R = rng(cfg.N * 977 + n * 131 + 7), w = { n, secs: [], H: cfg.H * (0.9 + R() * 0.2), L: cfg.Lw * (0.9 + R() * 0.2) }; let x = 25;
  while (x < w.L) { const len = 22 + R() * 26, r = R(), type = cfg.barrels && r < 0.3 && x > 30 ? 'barrel' : cfg.fast && r < 0.55 ? 'fast' : 'normal';
    w.secs.push({ x0: x, x1: Math.min(w.L, x + len), type, k: type === 'fast' ? 1.32 : type === 'barrel' ? 1.08 : 1 }); x += len; }
  return w; }
const secAt = (w, x) => w.secs.find(s => x >= s.x0 && x < s.x1) || { type: 'normal', k: 1, x0: -1e9, x1: 0 };
const TUBE = 12;      // how long the hollow tube is ahead of the curl in a barrel section (metres)
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help, o), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, mini: !!o.mini, free: !!o.free, blind: {} };
  G.ride = 0; G.score = 0; G.rides = []; G.stick = { x: 0, y: 0 }; G.crouch = false; G.paddle = 0; G.recent = []; G.combo = 0; G.comboT = 0;
  startWave(G);
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G);
  return G;
}
function startWave(G) { G.ride++; G.w = makeWave(G.cfg, G.ride); G.phase = 'wait'; G.tL = 3.2; G.pt = 0; G.paddle = 0; G.rideScore = 0; G.moves = []; G.why = null;
  G.p = { x: 0, s: 0.35, th: 0, v: 0, bal: 0, air: false, h: 0, vy: 0, rot: 0, spins: 0, wob: 0, tube: 0, lipT: -9, turnAcc: 0, turnT: 0, back: false, backT: 0 };
  G.xb = -14; G.ev.push({ k: 'wave', n: G.ride }); }
// ---------- the player's actions ----------
function setStick(G, x, y) { const m = Math.hypot(x, y); G.stick = m > 1 ? { x: x / m, y: y / m } : { x, y }; }
function crouchOn(G, on) { G.crouch = !!on; }
function standUp(G) { if (G.over || G.phase !== 'wait') return; const d = G.pt - G.tL, cfg = G.cfg;
  if (d < -cfg.early) { G.ev.push({ k: 'early' }); G.tries = (G.tries || 0) + 1; return; }      // too early: nothing happens yet (forgiving)
  if (d > cfg.win || G.paddle < 0.55) return;
  G.phase = 'ride'; const P = G.p; P.v = 7 + G.paddle * 1.5; P.th = -0.5; P.s = 0.7; P.x = G.xb + 9; G.ev.push({ k: 'stand' }); lessonSee(G, 'stand'); }
function swipe(G, dx, dy) { if (G.over) return; if (G.phase === 'wait') { if (dy < -0.3) standUp(G); return; } const P = G.p; if (G.phase === 'ride' && P.air && P.spinTo == null) { P.spinTo = P.rot + Math.PI * (dx >= 0 ? 1 : -1); G.ev.push({ k: 'spin' }); } }
// ---------- every frame ----------
function step(G, dt) { if (G.over || !(dt > 0)) return; G.t += dt; if (G.lesson) lessonTick(G, dt); const cfg = G.cfg;
  if (G.blind.cr != null) { G.blind.cr -= dt; if (G.blind.cr <= 0) { G.blind.cr = null; crouchOn(G, false); } }
  if (G.phase === 'wait') { G.pt += dt; G.paddle = clamp(G.paddle + (G.crouch ? 1.1 : -0.6) * dt, 0, 1);
    if (G.pt > G.tL + cfg.win) { G.ev.push({ k: 'missed', why: G.paddle < 0.55 ? 'paddle' : 'late' }); G.pt = 0; G.tL = 3.0; G.paddle = 0; }
    return; }
  if (G.phase === 'out') { G.outT -= dt; if (G.outT <= 0) nextWave(G); return; }
  const P = G.p, w = G.w, sec = secAt(w, G.xb + 3);
  // the curl peels along the wave; fast sections race; the end of the wave closes it
  if (G.xb < w.L - 16) G.xb += cfg.vp * sec.k * dt;      // the wave peters out at its end: the curl stops
  G.comboT -= dt; if (G.comboT <= 0) G.combo = 0;
  const Lf = 1.4 * w.H;
  if (P.air) { P.vy -= 9.8 * dt; P.h += P.vy * dt; P.x += P.v * Math.cos(P.th) * dt; const want = Math.atan2(G.stick.y, Math.max(0.2, G.stick.x)); if (Math.hypot(G.stick.x, G.stick.y) > 0.3) P.th += clamp(want - P.th, -3 * dt, 3 * dt);
    if (P.spinTo != null) { const d = P.spinTo - P.rot, st = Math.sign(d) * Math.min(Math.abs(d), 10 * dt); P.rot += st; if (Math.abs(P.spinTo - P.rot) < 1e-3) { P.rot = P.spinTo; P.spinTo = null; P.spins++; } }
    if (P.h <= 0) { P.air = false; P.h = 0; P.s = 0.97; P.landT = G.t; const r = ((P.rot % TAU) + TAU) % TAU, off = Math.min(r, TAU - r), down = P.th < -0.1;
      if (off < 0.6 + 0.15 * upLv('wax') && down && P.spinTo == null) { const half = Math.round(P.spins); move(G, 'air', 1 + 0.75 * Math.floor(half / 2), half >= 2 ? `AIR ${half * 180}` : 'AIR'); P.rot = 0; P.spins = 0; vibeEv(G, 'land'); }
      else return wipe(G, off >= 0.6 ? 'landed sideways: finish the spin' : 'landed nose up: point down to land'); }
    else if (P.x < G.xb - 1) return wipe(G, 'caught by the break'); }
  else { // steering: the board turns towards the stick (slower crouched; slower at high speed)
    const m = Math.hypot(G.stick.x, G.stick.y), prev = P.th; let w2 = 0;
    if (m > 0.25) { const want = Math.atan2(G.stick.y, G.stick.x); let d = Math.atan2(Math.sin(want - P.th), Math.cos(want - P.th)); if (Math.abs(d) > 1.8 && Math.cos(want) * Math.cos(P.th) < 0) { if (Math.cos(P.th) >= 0 && d < 0) d += TAU; else if (Math.cos(P.th) < 0 && d > 0) d -= TAU; }      // a big turn goes round through up the face (a cutback), not into the flats
      const rate = (G.crouch ? 1.7 : 2.7) * (1.15 - P.v / VMAX * 0.35); w2 = clamp(d, -rate * dt, rate * dt); P.th += w2; }
    P.th = Math.atan2(Math.sin(P.th), Math.cos(P.th));
    const steep = 0.55 + 0.7 * P.s, near = clamp(1 - (P.x - G.xb) / 18, 0, 1), push = (2.5 + 2.8 * near) * cfg.vp / 6.2 * (P.s < 0.85 ? 1 : 0.4) * (P.x > w.L - 15 ? 0.7 : 1);      // the wave drives you, most in its pocket near the curl
    P.v += (-GF * steep * Math.sin(P.th) * (Math.sin(P.th) > 0 ? 1 - 0.08 * upLv('rail') : 1) - (G.crouch ? (P.inTube ? 0.3 : 0.55) : DRAG) * P.v - 0.9 * Math.abs(w2 / dt) * P.v * 0.03 + push) * dt;
    if (P.s <= 0.02 && Math.sin(P.th) <= 0.05) P.v -= P.v * 0.9 * dt;      // flat water at the bottom bogs you down
    P.v = clamp(P.v, 0, VMAX);
    P.x += P.v * Math.cos(P.th) * dt; P.s += P.v * Math.sin(P.th) * dt / Lf;
    if (P.s < 0) { P.s = 0; if (P.th < 0) P.th *= 0.9; }
    // balance: hard turns at speed and the whitewater wobble you; crouching steadies
    const jerk = Math.abs(w2 / dt) * P.v; P.bal = clamp(P.bal + (Math.max(0, jerk - 22) * 0.012 * (G.crouch ? 0.45 : 1) * (1 - 0.15 * upLv('fins')) + (P.x - G.xb < 2 ? 0.25 : 0) - 0.45) * dt, 0, 1.2);
    if (P.bal >= 1) return wipe(G, 'lost balance: turn less sharply, or crouch');
    // the lip: fly off it with speed going up; otherwise ride the top
    if (P.s >= 1) { if (Math.sin(P.th) > 0.8 && P.v > 8.5) { P.air = true; P.vy = P.v * Math.sin(P.th) * 0.7; P.h = 0.01; P.rot = 0; P.spins = 0; P.spinTo = null; P.s = 1; G.ev.push({ k: 'launch' }); }
      else P.s = 1; }
    if (P.s > 0.86) P.lipT = G.t;
    // moves: a snap (a hard turn down at the lip), a carve (a long linked turn), a cutback (back towards the curl and out again)
    if (P.turnAcc === 0 && Math.abs(w2) >= 0.3 * dt) { P.turnS0 = P.s; P.turnDone = false; } P.turnAcc += w2; P.turnT += dt;
    if (!P.turnDone && P.v > 5.5) { if (P.turnAcc < -1.0 && P.turnS0 > 0.8) { P.turnDone = true; move(G, 'snap', 1, 'SNAP'); } else if (Math.abs(P.turnAcc) > 1.25 && !P.back && !(P.turnAcc < 0 && P.turnS0 > 0.8)) { P.turnDone = true; move(G, 'carve', 1, 'CARVE'); } }
    if (Math.abs(w2) < 0.3 * dt || Math.sign(w2) !== Math.sign(P.turnAcc)) { P.turnAcc = 0; P.turnT = 0; }
    if (Math.cos(P.th) < -0.35) { if (!P.back) { P.back = true; P.backT = G.t; } } else if (P.back && Math.cos(P.th) > 0.5) { P.back = false; if (G.t - P.backT > 0.3 && G.t - P.backT < 3 && P.v > 1.5) move(G, 'cutback', 1, 'CUTBACK'); }
    // the barrel: inside the tube you must crouch; ride out of it for the bonus
    const cs = secAt(w, G.xb + 1), tl = cs.type === 'barrel' ? Math.min(TUBE, G.xb - cs.x0) : 0, tube = tl > 0 && secAt(w, P.x).type === 'barrel' && P.x - G.xb < tl && P.x > G.xb - 0.5 && P.s > 0.12;      // the tube grows out of the curl as it enters a barrel section
    if (tube && G.t - (P.landT || -9) > 0.4) { if (P.s > 0.68) return wipe(G, 'the lip landed on you: stay low in the barrel'); if (!G.crouch) return wipe(G, 'hit by the lip: crouch in the barrel'); P.tube += dt; G.rideScore += 45 * dt; G.score += 45 * dt; if (!P.inTube) { P.inTube = true; G.ev.push({ k: 'tubein' }); } }
    else if (P.inTube) { P.inTube = false; if (P.tube > 0.6) move(G, 'barrel', 1 + Math.min(1.5, P.tube / 2), `BARREL ${P.tube.toFixed(1)}s`); P.tube = 0; G.ev.push({ k: 'tubeout' }); }
    if (P.x < G.xb - 0.5) return wipe(G, P.v < 4 ? 'too slow: pump down the face for speed' : 'caught by the break: stay ahead of the curl'); }
  if (P.x >= w.L) { // ride complete: kick out over the back
    const bonus = 100 + Math.round(G.rideScore * 0.2); G.score += bonus; G.rides.push({ pts: Math.round(G.rideScore + bonus), ok: true, moves: G.moves.length }); G.ev.push({ k: 'done', bonus }); lessonSee(G, 'done'); G.phase = 'out'; G.outT = 1.6; } }
function vibeEv(G, k) { G.ev.push({ k: 'landair' }); }
function move(G, id, mult, label) { const rep = G.recent.filter(q => q === id).length, k = Math.pow(0.5, rep), pts = Math.round(MOVES[id].pts * mult * k * (1 + 0.2 * G.combo));
  G.recent.push(id); if (G.recent.length > 8) G.recent.shift(); G.combo = Math.min(3, G.combo + 1); G.comboT = 2.6;
  G.score += pts; G.rideScore += pts; G.moves.push(id); G.ev.push({ k: 'move', id, label, pts, rep, combo: G.combo }); lessonSee(G, 'move', id); }
function wipe(G, why) { if (G.phase !== 'ride') return; const keep = Math.round(G.rideScore * 0.25); G.score -= G.rideScore - keep; G.rides.push({ pts: keep, ok: false, why }); G.ev.push({ k: 'wipe', why, lost: G.rideScore - keep }); lessonSee(G, 'wipe');
  G.phase = 'out'; G.outT = 1.8; G.why = why; }
function nextWave(G) { if (G.lesson) { startWave(G); G.ride = Math.min(G.ride, 1); return; }
  if (!G.free && G.score >= G.cfg.target && G.ride >= 1) return finish(G, true, 'target');
  if (!G.free && G.ride >= G.cfg.rides) return finish(G, false, 'short');
  startWave(G); }
function finish(G, win, why) { if (G.over) return; G.over = win ? 'won' : 'lost'; const sc = Math.round(G.score), tg = G.cfg.target;
  const stars = win ? (sc >= tg * 1.6 ? 3 : sc >= tg * 1.25 ? 2 : 1) : 0;
  G.res = { win, why, stars, score: sc, target: tg, rides: G.rides.slice(), coins: win ? 10 + stars * 6 + Math.min(20, Math.round(sc / 150)) : 3 };
  G.ev.push({ k: win ? 'won' : 'lost', why }); }
function winNow(G) { if (!G || G.over || G.lesson) return; G.score = Math.max(G.score, G.cfg.target); finish(G, true, 'target'); }
// ---------- lessons (levels 1-3) ----------
const LESSONS = {
  1: [{ id: 'ride', title: 'CATCH AND RIDE', how: 'Hold PADDLE as the wave comes; when the ring turns green, swipe up to stand. Then steer along the wave, up and down the face, and stay ahead of the white water to the end. Ride one wave all the way.', need: 1 }],
  2: [{ id: 'snap', title: 'SNAP OFF THE LIP', how: 'Climb to the top of the wave, then turn hard back down as you reach the lip: a snap. Three snaps.', need: 3 }],
  3: [{ id: 'barrel', title: 'GET BARRELLED', how: 'Where the wave throws over (the dark hollow), drop low on the face and hold CROUCH: ride through the tube and out the other end.', need: 1 }],
};
function lessonStart(G) { const st = LESSONS[G.N][0]; G.lesson = { steps: LESSONS[G.N], i: 0, n: 0, id: st.id, need: st.need }; G.ev.push({ k: 'lessonnext', first: true }); }
function lessonSee(G, what, id) { const D = G.lesson; if (!D || D.done) return; let good = false;
  if (D.id === 'ride' && what === 'done') good = true;
  if (D.id === 'snap' && what === 'move' && id === 'snap') good = true;
  if (D.id === 'barrel' && what === 'move' && id === 'barrel') good = true;
  if (what === 'wipe') { if (D.n && D.id === 'snap') { D.n = 0; G.ev.push({ k: 'lessonmiss', how: 'Wiped out: the count starts again. ' + G.why }); } else G.ev.push({ k: 'lessonmiss', how: G.why || 'Again!' }); return; }
  if (good) { D.n++; G.ev.push({ k: 'lessonok', n: D.n, need: D.need }); if (D.n >= D.need) { D.done = true; D.wait = 2.0; } } }
function lessonTick(G, dt) { const D = G.lesson; if (!D.done) return; D.wait -= dt; if (D.wait > 0) return; G.lesson = null; G.ride = 0; G.score = 0; G.rides = []; G.recent = []; G.combo = 0; startWave(G); G.ev.push({ k: 'lessondone', N: G.N }); }

// ---------- for the robots: blind moves and an honest surfer ----------
const BLIND = {
  u: G => setStick(G, Math.random(), 1),                                                   // push up the face
  d: G => setStick(G, Math.random(), -1),                                                  // push down the face
  r: G => setStick(G, 1, (Math.random() - 0.5) * 0.6),                                     // push along the wave
  a: G => { const a = Math.random() * TAU; setStick(G, Math.cos(a), Math.sin(a)); },       // push anywhere
  c: G => { crouchOn(G, true); G.blind.cr = 0.3 + Math.random() * 1.5; },                  // hold CROUCH / PADDLE a while
  w: G => swipe(G, Math.random() - 0.5, -1),                                               // swipe (up)
};
// HONEST: a surfer who looks: paddles as the wave comes and stands when it lifts (later or earlier by react); pumps up and
// down the face to stay ahead of the curl; snaps at the lip; flies and spins when fast; crouches through barrels.
function honest(G, o, mem) { if (G.over) return; const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random, P = G.p, cfg = G.cfg;
  if (G.phase === 'wait') { setStick(G, 0, 0); if (mem.ride !== G.ride || mem.pt > G.pt) { mem.ride = G.ride; mem.st = G.tL + (R() - 0.3) * react * 0.8; } mem.pt = G.pt;
    crouchOn(G, G.pt > G.tL - 1.2); if (G.pt >= mem.st) { swipe(G, 0, -1); mem.st = 1e9; } return; }
  if (G.phase !== 'ride') { crouchOn(G, false); setStick(G, 0, 0); mem.mode = null; return; }
  if (P.air) { crouchOn(G, false); if (mem.spin == null) { mem.spin = acc > 0.9 && cfg.N >= 5 ? 2 : 0; mem.bad = R() < (1 - acc) * 1.5; } if (P.spins + (P.spinTo != null ? 1 : 0) < mem.spin && P.vy > -2) swipe(G, 1, 0);
    setStick(G, 0.6, P.vy < 1.5 && !mem.bad ? -1 : 0.2); return; }
  mem.spin = null; const gap = P.x - G.xb, w = G.w, ahead = secAt(w, G.xb + 2), tubeSoon = ahead.type === 'barrel' || secAt(w, G.xb + 8).type === 'barrel';
  // a barrel: low in the face, crouched, riding just ahead of the curl
  const inBarrel = cfg.barrels && (secAt(w, P.x).type === 'barrel' || secAt(w, P.x + 6).type === 'barrel') && (secAt(w, G.xb + 1).type === 'barrel' || secAt(w, G.xb + 16).type === 'barrel');
  if (inBarrel) { crouchOn(G, true); const ty = clamp((0.38 - P.s) * 3, -0.6, 0.6), tx = gap > 9 ? 0.45 : gap < 3 ? 1 : 0.85; setStick(G, tx, ty); return; }
  crouchOn(G, false);
  // a fast section: race it in the pocket with small, flat pumps (no tricks)
  if (secAt(w, G.xb + 4).type === 'fast' || secAt(w, G.xb + 10).type === 'fast' && gap < 8) { mem.mode = 'down'; mem.fp = mem.fp == null ? -1 : mem.fp; if (P.s < 0.25) mem.fp = 1; if (P.s > 0.55) mem.fp = -1; setStick(G, 1, 0.35 * mem.fp); return; }
  // pumping: down to the base for speed, back up to the lip; at the lip a snap (or an air when fast)
  if (mem.mode == null) mem.mode = 'down';
  const late = (R() - 0.5) * react * 0.25;
  
  if (mem.mode === 'back') { if (!mem.turned && (Math.cos(P.th) < -0.45 || G.t - mem.backT > 1.0)) mem.turned = G.t; setStick(G, mem.turned ? 1 : -1, mem.turned ? -0.45 : 0.25); if (mem.turned && Math.cos(P.th) > 0.6 || gap < 5 || G.t - mem.backT > 2.2) { mem.turned = null; mem.mode = 'down'; } return; }
  if (mem.mode === 'down') { setStick(G, 0.7, -0.75); if (P.s < 0.14 + late || gap < 4 && P.s < 0.3) { mem.mode = 'up'; mem.tryAir = R() < (acc > 0.9 ? 0.6 : 0.3); } return; }
  if (mem.mode === 'up') { const goAir = mem.tryAir && cfg.N >= 5 && P.v > 10 && acc > 0.8 && gap > 8 && secAt(w, G.xb + 4).type !== 'fast' && secAt(w, P.x + 10).type !== 'barrel'; const fastNow = secAt(w, G.xb + 4).type === 'fast'; setStick(G, goAir ? 0.35 : 0.7, goAir ? 1 : 0.7); if (P.s > (fastNow && !goAir ? 0.6 : 0.88) + late * 0.2) { mem.mode = 'snap'; } return; }
  if (mem.mode === 'snap') { setStick(G, 0.25, -1); if (P.th < -0.6) { mem.mode = 'down'; if (gap > 13 && P.v > 7.5 && secAt(w, G.xb + 4).type !== 'fast' && R() < 0.5 + acc * 0.3) { mem.mode = 'back'; mem.backT = G.t; mem.turned = null; } } return; } }
