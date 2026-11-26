// ===================== RULES: Drift Kings (game 44) =====================
// Kart racing against five rivals. The kart drives itself forward; your LEFT thumb steers (put it down anywhere on the left
// half and slide: the further, the harder). Hold a hard turn at speed and the kart starts to DRIFT: it slides round the
// corner and sparks build under it, blue, then orange, then purple; straighten up (or let go) and you get a boost, longer
// for each colour. Drive through a ? box for an item and TAP the right half to use it: a Turbo can, an Oil slick dropped
// behind you, a Zap orb that flies to the kart just ahead, a Bubble shield. Grass slows you; barriers bump you. Finish in the
// place the race asks for (first: since 24 Nov 2026, his words "If you don't win first place, you shouldn't be able to progress"). Four tracks make a cup; karts to collect; upgrades stay.
// World: metres on a flat plane; x across, z (screen-down) the other way; a heading h points along (cos h, sin h).
const RULES = [
  'The kart drives itself. <b>Left thumb</b>: put it down and slide to <b>steer</b>, further for a harder turn.',
  '<b>Hold DRIFT</b> (right thumb) and steer to <b>drift</b>. Sparks go blue, orange, purple: let go for a <b>boost</b>.',
  'Drive through a <b>?</b> box for an item. <b>Tap the item button</b> to use it.',
  'Items: <b>Turbo</b>, <b>Oil slick</b> (drops behind), <b>Zap orb</b> (hits the kart ahead), <b>Bubble</b> (blocks one hit).',
  'Grass slows you, barriers bump you. Finish in the place the race asks for.',
];
const KARTS = [{ id: 'rocket', name: 'Rocket', col: 0xff3a4a, col2: 0xffffff, stars: 0 }, { id: 'lime', name: 'Lime Zip', col: 0x7ae03a, col2: 0x1a2a10, stars: 4 },
  { id: 'wave', name: 'Wave', col: 0x2a8aff, col2: 0xffd040, stars: 10 }, { id: 'bee', name: 'Bumblebee', col: 0xffd020, col2: 0x1a1a1a, stars: 18 },
  { id: 'ghost', name: 'Phantom', col: 0xe8e8f0, col2: 0x8a3aff, stars: 28 }, { id: 'gold', name: 'Golden King', col: 0xe8b830, col2: 0x7a1020, stars: 40 }];
const RIVALS = [{ name: 'Blaze', col: 0xff8a20 }, { name: 'Mint', col: 0x30e0b0 }, { name: 'Violet', col: 0xa050ff }, { name: 'Sunny', col: 0xffe040 }, { name: 'Coal', col: 0x404050 }];
const TRACKS = [
  { name: 'Sunny Loop', sky: 'noon', grass: 0x5a9a3a, pts: [[0, 0], [60, 0], [110, 20], [130, 70], [110, 120], [60, 135], [20, 120], [-10, 140], [-50, 130], [-70, 90], [-60, 40], [-35, 10]] },
  { name: 'Canyon Run', sky: 'golden', grass: 0xc08a50, pts: [[0, 0], [50, -10], [90, 10], [100, 55], [70, 85], [90, 120], [60, 160], [10, 150], [-20, 115], [-10, 75], [-50, 50], [-45, 10]] },
  { name: 'Neon City', sky: 'night', grass: 0x2a2a3a, pts: [[0, 0], [70, 0], [92, 18], [92, 70], [72, 90], [32, 90], [12, 110], [12, 150], [-12, 172], [-58, 158], [-64, 62], [-42, 18]] },
  { name: 'Snow Peak', sky: 'overcast', grass: 0xe8eef4, pts: [[0, 0], [60, -5], [95, 25], [72, 56], [22, 56], [2, 80], [30, 110], [90, 110], [110, 150], [60, 175], [-20, 160], [-42, 110], [-36, 40]] },
];
const ITEMS = { turbo: { name: 'Turbo', icon: '🚀' }, slick: { name: 'Oil slick', icon: '🛢' }, zap: { name: 'Zap orb', icon: '⚡' }, shield: { name: 'Bubble', icon: '🫧' } };
const UPGRADES = [
  { id: 'engine', name: 'Engine', desc: 'A little more top speed.', max: 3, cost: l => 25 + l * 30 },
  { id: 'tyres', name: 'Grippy tyres', desc: 'Grass slows you less.', max: 2, cost: l => 20 + l * 25 },
  { id: 'spark', name: 'Hot sparks', desc: 'Drift sparks build faster.', max: 2, cost: l => 25 + l * 30 },
  { id: 'start', name: 'Rocket start', desc: 'A boost when the lights go green.', max: 1, cost: l => 40 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Learner'], [40, 'Racer'], [130, 'Drifter'], [320, 'Pro'], [700, 'Champion'], [1500, 'Drift King']];
function myKart() { if (typeof HEADLESS !== 'undefined' && HEADLESS) return KARTS[0]; const id = store.get('kart', 'rocket'); return KARTS.find(q => q.id === id) || KARTS[0]; }
const PLACES = TRACKS.map(t => ({ name: t.name })), placeOf = N => (N - 1) % TRACKS.length;
const TW = 11, VMAX = 27, GRIP = 14;
// the track: a smooth closed curve through the points, cut into even steps (1.5 m) with where each step is and which way
function trackOf(i) { const T = TRACKS[i]; if (T.S) return T; const P = T.pts, n = P.length, raw = [];
  for (let j = 0; j < n; j++) { const p0 = P[(j - 1 + n) % n], p1 = P[j], p2 = P[(j + 1) % n], p3 = P[(j + 2) % n]; for (let q = 0; q < 30; q++) { const t = q / 30, t2 = t * t, t3 = t2 * t;
      raw.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3), 0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]); } }
  let L = 0; const cum = [0]; for (let j = 1; j <= raw.length; j++) { const a = raw[j - 1], b = raw[j % raw.length]; L += Math.hypot(b[0] - a[0], b[1] - a[1]); cum.push(L); }
  const step = 1.5, m = Math.floor(L / step), S = []; let k2 = 0; for (let q = 0; q < m; q++) { const d = q * L / m; while (cum[k2 + 1] < d) k2++; const a = raw[k2], b = raw[(k2 + 1) % raw.length], u = (d - cum[k2]) / Math.max(1e-6, cum[k2 + 1] - cum[k2]); S.push({ x: a[0] + (b[0] - a[0]) * u, z: a[1] + (b[1] - a[1]) * u }); }
  for (let q = 0; q < S.length; q++) { const a = S[(q - 1 + S.length) % S.length], b = S[(q + 1) % S.length]; S[q].h = Math.atan2(b.z - a.z, b.x - a.x); }
  for (let q = 0; q < S.length; q++) { let dh = S[(q + 6) % S.length].h - S[q].h; dh = Math.atan2(Math.sin(dh), Math.cos(dh)); S[q].curve = dh; }
  T.S = S; T.L = L; T.ds = L / m; return T; }
// where a point is on the track: the nearest step (searched near the last one), how far along, how far across
function locate(T, x, z, hint) { const S = T.S, n = S.length; let bi = hint == null ? 0 : hint, bd = 1e18; const span = hint == null ? n : 40;
  for (let q = -span; q <= span; q++) { const i = ((bi + q) % n + n) % n, d = (S[i].x - x) ** 2 + (S[i].z - z) ** 2; if (d < bd) { bd = d; var best = i; } if (hint == null && q >= 0) break; }
  if (hint == null) { bd = 1e18; for (let i = 0; i < n; i++) { const d = (S[i].x - x) ** 2 + (S[i].z - z) ** 2; if (d < bd) { bd = d; best = i; } } }
  const p = S[best], lat = -(x - p.x) * Math.sin(p.h) + (z - p.z) * Math.cos(p.h); return { i: best, lat }; }
function makeCfg(N, help) {
  const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), e = easyOf(N);
  return { N, f, help: !!help, track: placeOf(N), place: 1 /* his words (24 Nov 2026): "If you don't win first place, you shouldn't be able to progress to the next level" */, laps: N <= 2 ? 2 : 3,
    skill: x(0.84, 1.27, 30) * (1 - 0.03 * e) * (help ? 0.96 : 1), aiItems: x(0.5, 1, 30), corner: x(0.45, 0.22, 30),
    vmax: VMAX * (1 + 0.025 * upLv('engine')), grass: 0.45 + 0.12 * upLv('tyres'), spark: 1 + 0.25 * upLv('spark') };
}
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0, T = trackOf(cfg.track);
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, place: cfg.track, T, kart: o.kart || myKart(),
    karts: [], boxes: [], slicks: [], orbs: [], steer: 0, count: 2.6, boosts: 0, bigBoosts: 0, hits: 0, zaps: 0, coins: 0, best: 99, items: 0 };
  grid(G); placeBoxes(G);
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else G.ev.push({ k: 'start' });
  return G;
}
// the grid: you start at the back of the middle, rivals ahead of you in two rows
function grid(G) { const T = G.T, S = T.S, n = S.length; G.karts = [];
  const slot = (q, col) => { const i = (n - 4 - q * 4) % n, p = S[(i + n) % n]; return { x: p.x - Math.sin(p.h) * col, z: p.z + Math.cos(p.h) * col, h: p.h, i: (i + n) % n }; };
  const order = G.lesson ? [] : [0, 1, 2, 3, 4]; order.forEach((r, q) => { const s = slot(Math.floor(q / 2), q % 2 ? 2.4 : -2.4); G.karts.push(newKart(G, s, RIVALS[r], false, q)); });
  const s = slot(G.lesson ? 0 : 3, 0); G.me = newKart(G, s, { name: 'You', col: G.kart.col }, true, 9); G.karts.push(G.me);
  for (const k of G.karts) { k.lap = 0; k.prog = -((n - k.i) % n) * T.ds; k.last = k.i; } }
function newKart(G, s, who, me, q) { const R = G.rnd; return { me, who, x: s.x, z: s.z, h: s.h, v: 0, i: s.i, last: s.i, lap: 0, prog: 0, steer: 0, drift: 0, driftT: 0, hardT: 0, charge: 0, boost: 0, spin: 0, shield: 0, item: null, itemT: 0, line: (R() - 0.5) * 4, skill: me ? 1 : 1 + (q - 2) * 0.012 + (R() - 0.5) * 0.02, done: false, place: 0, fin: 0, lane: R() * 6 }; }
function placeBoxes(G) { const S = G.T.S, n = S.length; G.boxes = []; for (const f of [0.18, 0.5, 0.8]) { const i = Math.floor(f * n), p = S[i]; for (const c of [-3.6, -1.2, 1.2, 3.6]) G.boxes.push({ x: p.x - Math.sin(p.h) * c, z: p.z + Math.cos(p.h) * c, t: 0 }); } }
// ---------- your thumbs ----------
function setSteer(G, s) { G.steer = clamp(s, -1, 1); }
function setDrift(G, on) { G.driftHeld = !!on; }      // the DRIFT button, held or let go
function useItem(G, k = G.me) { if (G.over || !k.item || k.done || G.count > 0) return false; const it = k.item; k.item = null; G.items += k.me ? 1 : 0; const S = G.T.S;
  if (it === 'turbo') { k.boost = Math.max(k.boost, 1.3); }
  if (it === 'shield') k.shield = 7;
  if (it === 'slick') { const b = S[(k.i - 3 + S.length) % S.length]; G.slicks.push({ x: k.x - Math.cos(k.h) * 2.2, z: k.z - Math.sin(k.h) * 2.2, t: 22, by: k }); }
  if (it === 'zap') { const ahead = G.karts.filter(o => o !== k && !o.done && race(o) > race(k)).sort((a, b) => race(a) - race(b))[0]; G.orbs.push({ x: k.x, z: k.z, i: k.i, tgt: ahead || null, by: k, t: 0, h: k.h }); }
  G.ev.push({ k: 'use', it, me: k.me, x: k.x, z: k.z }); if (k.me) lessonSee(G, 'item'); return true; }
const race = k => k.lap * 1e5 + k.prog;
// ---------- the race, step by step ----------
function step(G, dt) {
  if (G.over) return; G.t += dt; const c = G.cfg, T = G.T, S = T.S, n = S.length, R = G.rnd;
  if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0 && G.lessonEnd) { G.lessonEnd = false; Object.assign(G, { slicks: [], orbs: [], count: 2.6, boosts: 0, bigBoosts: 0, hits: 0, zaps: 0, coins: 0, items: 0 }); grid(G); placeBoxes(G); G.ev.push({ k: 'start' }); } if (G.wait > 0) return; }
  if (G.count > 0) { const was = Math.ceil(G.count); G.count -= dt; if (Math.ceil(G.count) !== was) G.ev.push({ k: 'light', n: Math.max(0, Math.ceil(G.count)) }); if (G.count <= 0) { G.ev.push({ k: 'go' }); if (upLv('start')) G.me.boost = 1; } else return; }
  for (const k of G.karts) { if (!k.me && !k.done) ai(G, k, dt); drive(G, k, dt); }
  // karts bump each other
  for (let a = 0; a < G.karts.length; a++) for (let b = a + 1; b < G.karts.length; b++) { const p = G.karts[a], q = G.karts[b], dx = q.x - p.x, dz = q.z - p.z, d = Math.hypot(dx, dz); if (d < 1.9 && d > 1e-4) { const ux = dx / d, uz = dz / d, o = (1.9 - d) / 2; p.x -= ux * o; p.z -= uz * o; q.x += ux * o; q.z += uz * o; if ((p.me || q.me) && !G.bumpT) { G.bumpT = 0.4; G.ev.push({ k: 'bump' }); } } }
  G.bumpT = Math.max(0, (G.bumpT || 0) - dt);
  // item boxes, slicks, orbs
  for (const b of G.boxes) { if (b.t > 0) { b.t -= dt; continue; } for (const k of G.karts) if (Math.hypot(k.x - b.x, k.z - b.z) < 1.6) { b.t = 3; if (!k.item) { k.item = pickItem(G, k); k.itemT = 0.8 + R() * 2.5; if (k.me) G.ev.push({ k: 'item', it: k.item }); } break; } }
  for (let i = G.slicks.length - 1; i >= 0; i--) { const s = G.slicks[i]; s.t -= dt; if (s.t <= 0) { G.slicks.splice(i, 1); continue; } for (const k of G.karts) if (Math.hypot(k.x - s.x, k.z - s.z) < 1.5 && !(s.by === k && s.t > 20)) { G.slicks.splice(i, 1); hit(G, k, 'slick', s.by); break; } }
  for (let i = G.orbs.length - 1; i >= 0; i--) { const o = G.orbs[i]; o.t += dt; const tg = o.tgt && !o.tgt.done ? o.tgt : null; let tx, tz; if (tg && o.t > 0.15) { tx = tg.x; tz = tg.z; } else { o.i = (o.i + 2) % n; tx = S[o.i].x; tz = S[o.i].z; }
    const dx = tx - o.x, dz = tz - o.z, d = Math.hypot(dx, dz) || 1, sp = 42 * dt; if (tg && d < sp + 1.2) { G.orbs.splice(i, 1); hit(G, tg, 'zap', o.by); continue; } o.x += dx / d * Math.min(sp, d); o.z += dz / d * Math.min(sp, d); o.i = locate(T, o.x, o.z, o.i).i; if (o.t > 6) G.orbs.splice(i, 1); }
  // places
  const order = G.karts.slice().sort((a, b) => (b.done ? 1e9 - b.fin : race(b)) - (a.done ? 1e9 - a.fin : race(a))); order.forEach((k, q) => k.place = q + 1);
  if (!G.lesson && !G.over) { G.best = Math.min(G.best, G.me.place); if (G.me.done) finish(G); }
  if (G.lesson) lessonTick(G, dt);
}
function pickItem(G, k) { const R = G.rnd(), back = (k.place || 3) / G.karts.length; if (G.lesson && lessonNow(G).id === 'item') return R < 0.5 ? 'turbo' : 'zap'; if (R < 0.2 + back * 0.25) return 'turbo'; if (R < 0.45 + back * 0.3) return 'zap'; if (R < 0.8) return 'slick'; return 'shield'; }
function hit(G, k, why, by) { if (k.shield > 0) { k.shield = 0; G.ev.push({ k: 'pop', me: k.me, x: k.x, z: k.z }); return; } if (k.spin > 0) return;
  k.spin = 1.1; k.drift = 0; k.charge = 0; k.boost = 0; G.ev.push({ k: 'spin', me: k.me, why, x: k.x, z: k.z }); if (k.me) { G.hits++; lessonMiss(G); } if (by && by.me && !k.me) { G.zaps++; G.coins++; G.ev.push({ k: 'gotem', x: k.x, z: k.z, why }); } }
// one kart: speed, steering, the drift and its sparks, grass and barriers, laps
const TURBO = 2.1;      // the turbo meter is full after this much sliding (at the level's spark rate)
const KW = 0.9;      // half a kart's width (its wheels): where its side meets the rail
function drive(G, k, dt) { const c = G.cfg, T = G.T, S = T.S, n = S.length;
  const st = k.me ? G.steer : k.steer, go = !k.done || !k.me;
  k.boost = Math.max(0, k.boost - dt); k.shield = Math.max(0, k.shield - dt); k.spin = Math.max(0, k.spin - dt);
  const loc = locate(T, k.x, k.z, k.i), off = Math.abs(loc.lat) > TW / 2, top = (k.me ? c.vmax : VMAX * c.skill * k.skill * (k.rubber || 1)) * (k.boost > 0 ? 1.35 : 1) * (off && k.boost <= 0 ? (k.me ? c.grass : 0.5) : 1) * (k.spin > 0 ? 0.25 : 1) * (go ? 1 : 0.6);
  k.v += (top - k.v) * Math.min(1, dt * (k.v < top ? 0.9 : 2.5));
  // THE DRIFT (25 Nov 2026, his words: "Make is like the mechanics of how to drift easier like holding one part then using the joystick"). It used to start
  // by itself when a hard turn had been held for a moment, and ended when you straightened up: you never knew when you were in one. Now it is a button, the
  // way racing games do it: HOLD DRIFT with the right thumb and steer with the left. The kart slides the way you are steering when you press; while you hold,
  // the stick only makes the slide tighter (towards the bend) or wider (away), it never flips it; sparks build blue, orange, purple; LET GO for the boost.
  // 25 Nov 2026, later (his words): "Steering during drifts: allow manoeuvring throughout a drift, including switching from drifting left to
  // drifting right without being locked into the initial direction. Drift earns turbo: build turbo while drifting. Longer successful drifts should
  // earn more turbo, with a clearly visible meter." So: while DRIFT is held the kart turns as the stick says, all the way from hard left to hard
  // right; crossing to the other side swings the tail across and the slide carries on (the turbo is kept). The turbo METER (k.charge, full at
  // TURBO) fills all the time he slides, faster the harder he steers; letting go spends it: the fuller the meter, the longer the boost.
  // (Looked up, not played: KartRider fills a boost gauge by drifting and links drifts to keep filling it; Crash Team Racing shows a turbo
  // meter that fills through a power slide.)
  if (k.me) { const held = !!G.driftHeld && !k.spin && go;
    if (!k.drift && held && k.v > 12 && Math.abs(st) > 0.2) { k.drift = Math.sign(st); k.charge = 0; k.tier = 0; G.ev.push({ k: 'drift' }); lessonSee(G, 'drift'); }
    if (k.drift) { if (st * k.drift < -0.25) { k.drift = -k.drift; G.ev.push({ k: 'swap', dir: k.drift }); }      /* steered across: the slide changes side, nothing is lost */
      k.charge = Math.min(TURBO, k.charge + dt * c.spark * (Math.abs(st) > 0.3 ? 1 : 0.6)); const tier = k.charge >= TURBO ? 3 : k.charge > 1.25 ? 2 : k.charge > 0.55 ? 1 : 0; if (tier !== k.tier) { k.tier = tier; if (tier) G.ev.push({ k: 'spark', tier }); }
      if (!held || k.v < 9 || k.spin) { if (k.tier && !k.spin) { k.boost = Math.max(k.boost, 0.2 + 1.4 * k.charge / TURBO); k.boost0 = k.boost; G.boosts++; if (k.tier >= 2) { G.bigBoosts++; G.coins++; } G.ev.push({ k: 'boost', tier: k.tier }); lessonSee(G, 'boost', k.tier); } else if (!k.spin) lessonSee(G, 'early'); k.drift = 0; k.charge = 0; k.tier = 0; } } }
  // grip: without a drift a hard turn at speed runs wide and scrubs speed off; a drift turns hard and keeps it
  const sp = Math.min(1, k.v / 12); let yaw; if (k.drift) { yaw = (st * 1.25 + k.drift * 0.15) * sp; } else {      /* in a drift the stick turns him, either way; the slide itself pulls a little */ const want = st * 1.75 * sp, lim = GRIP / Math.max(6, k.v); yaw = clamp(want, -lim, lim); if (Math.abs(want) > lim) k.v -= (Math.abs(want) - lim) * k.v * 0.9 * dt; }
  k.h += yaw * dt * (k.spin ? 0 : 1) + (k.spin ? dt * 11 : 0);
  const slip = k.drift ? -(k.drift * 0.14 + st * 0.2) : 0; k.slip = (k.slip || 0) + (slip - (k.slip || 0)) * Math.min(1, dt * 5);      /* the tail swings out as far as he steers, and across when he changes side */ const mh = k.h + k.slip;
  k.x += Math.cos(mh) * k.v * dt; k.z += Math.sin(mh) * k.v * dt;
  // the barriers, just off the grass
  // the rail (his review of Kart Kingdom, 24 Nov 2026, the same fault here: "I shouldn't be phasing against the rail I should clearly hit it"):
  // the kart's SIDE stops at the rail (KW, half its width; it used to be its middle, so half the kart went into the rail). Brushing it
  // scrapes (sparks, a little speed); running into it is a hit: the kart bounces off, loses speed and rocks.
  const l2 = locate(T, k.x, k.z, k.i), p = S[l2.i], lim = TW / 2 + 3.4 - KW; if (Math.abs(l2.lat) > lim) { const s = Math.sign(l2.lat), back = Math.abs(l2.lat) - lim; k.x += Math.sin(p.h) * s * back; k.z -= Math.cos(p.h) * s * back;
    let rel = mh - p.h; rel = Math.atan2(Math.sin(rel), Math.cos(rel)); const air = false, into = k.v * Math.abs(Math.sin(rel)), hard = into > 4.5 || (air && into > 2.5);
    if (hard) { k.v *= air ? 0.5 : 0.6; k.h = p.h - rel * 0.45; k.slip = 0; k.wob = 1; if (air) k.vy = Math.min(k.vy, 0) * 0.5 - 1.5; if (k.drift) { k.drift = 0; k.charge = 0; k.tier = 0; } }
    else { k.v *= 1 - Math.min(0.08, dt * 2.5); k.h -= rel * Math.min(1, dt * 8); }
    if (k.me && (hard ? !G.wallT : !G.scrapeT)) { if (hard) G.wallT = 0.45; else G.scrapeT = 0.09;
      G.ev.push({ k: hard ? 'wall' : 'scrape', x: k.x - Math.sin(p.h) * s * KW * 1.05, z: k.z + Math.cos(p.h) * s * KW * 1.05, y: k.y || 0, h: p.h, s, air, fly: air && (k.y - (p.y || 0)) > 1.2 }); } }
  k.wob = Math.max(0, (k.wob || 0) - dt * 1.4); if (k.me) G.scrapeT = Math.max(0, (G.scrapeT || 0) - dt);
  if (k.me) G.wallT = Math.max(0, (G.wallT || 0) - dt);
  // progress and laps (a step back over the line does not count)
  const di = l2.i - k.last; let dd = di; if (di < -n / 2) dd = di + n; if (di > n / 2) dd = di - n; k.prog += dd * T.ds; k.last = l2.i; k.i = l2.i; k.lat = l2.lat; k.off = Math.abs(l2.lat) > TW / 2;
  if (k.prog >= T.L) { k.prog -= T.L; k.lap++; if (k.me) G.ev.push({ k: 'lap', lap: k.lap }); if (k.lap >= c.laps && !G.lesson && !k.done) { k.done = true; k.fin = G.t; if (k.me) G.ev.push({ k: 'finish' }); } }
  if (k.prog < -T.L / 2) { k.prog += T.L; k.lap--; } }
// the rivals: a line through the corners, a speed for each, a mind of their own with items, a little rubber band
function ai(G, k, dt) { const T = G.T, S = T.S, n = S.length, look = Math.round(9 + k.v * 0.35), p = S[(k.i + look) % n], cv = Math.abs(S[(k.i + look) % n].curve);
  k.lane += dt * 0.25; const want = clamp(k.line + Math.sin(k.lane) * 1.2 - Math.sign(S[(k.i + look) % n].curve) * Math.min(2.5, cv * 6), -TW / 2 + 1, TW / 2 - 1), tx = p.x - Math.sin(p.h) * want, tz = p.z + Math.cos(p.h) * want;
  let dh = Math.atan2(tz - k.z, tx - k.x) - k.h; dh = Math.atan2(Math.sin(dh), Math.cos(dh)); k.steer = clamp(dh * 2.4, -1, 1);
  const lead = race(k) - race(G.me); k.rubber = clamp(1 - lead / 2500, 0.95, 1.05) * (1 - Math.min(0.18, cv * G.cfg.corner));
  if (k.item) { k.itemT -= dt; if (k.itemT <= 0 && G.rnd() < G.cfg.aiItems) { const ahead = G.karts.some(o => o !== k && race(o) > race(k) && race(o) - race(k) < 60); if (k.item !== 'zap' || ahead) useItem(G, k); else k.itemT = 0.5; } else if (k.itemT <= 0) k.itemT = 1; } }
function finish(G) { const c = G.cfg, me = G.me, place = me.place, win = place <= c.place; G.over = win ? 'won' : 'lost';
  const stars = win ? (place === 1 ? 3 : place <= Math.max(1, c.place - 1) ? 2 : 1) : 0;
  G.res = { win, stars, place, need: c.place, laps: c.laps, time: +G.t.toFixed(1), boosts: G.boosts, bigBoosts: G.bigBoosts, hits: G.hits, zaps: G.zaps, coins: G.coins + (win ? 4 + Math.ceil(G.N / 3) + stars * 2 : 1), track: TRACKS[c.track].name };
  G.ev.push({ k: win ? 'won' : 'lost', place }); return true; }
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'steer', title: 'STEER', say: G => kartCue(G)[0], do: G => kartCue(G)[1], at: G => kartCue(G)[2], how: 'Left thumb: slide to steer round the bends.', need: 1 },
    { id: 'boost', title: 'DRIFT', say: G => kartCue(G)[0], do: G => kartCue(G)[1], at: G => kartCue(G)[2], how: 'In a bend HOLD the DRIFT button and steer: the kart slides and sparks. When the sparks come, let go: a boost. Twice.', need: 2 }],
  2: [{ id: 'item', title: 'ITEMS', say: G => kartCue(G)[0], do: G => kartCue(G)[1], at: G => kartCue(G)[2], how: 'Drive through a ? box, then tap the item button to use what you got. Use 2 items.', need: 2 }],
  3: [{ id: 'big', title: 'BIG BOOST', say: G => kartCue(G)[0], do: G => kartCue(G)[1], at: G => kartCue(G)[2], how: 'Hold DRIFT longer: wait for ORANGE sparks before you let go. Twice.', need: 2 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); grid(G); G.count = 0; }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonTick(G, dt) { const st = lessonNow(G), k = G.me, L = G.lesson; if (st && st.id === 'steer') { if (L.p0 == null || k.off || (k.wob || 0) > 0.5 || k.spin > 0) { if (L.p0 != null && k.prog - L.p0 > 25) G.ev.push({ k: 'lessonmiss', how: 'Keep it on the road: slide your left thumb to steer round the bend.' }); L.p0 = k.prog; } if (k.prog - L.p0 > 110) lessonSee(G, 'steered'); } }      /* 110 m of road without touching the grass or a rail */
function lessonSee(G, what, tier) { const st = lessonNow(G); if (!st) return; let ok = false;
  if (st.id === 'steer' && what === 'steered') ok = true; if (st.id === 'boost' && what === 'boost') ok = true; if (st.id === 'item' && what === 'item') ok = true;
  if (st.id === 'boost' && what === 'early') { G.lesson.n = 0; G.ev.push({ k: 'lessonmiss', how: 'Hold DRIFT until the sparks come, then let go.' }); return; }
  if (st.id === 'big' && what === 'boost') { if (tier < 2) { G.lesson.n = 0; G.ev.push({ k: 'lessonmiss', how: 'That was a blue boost. Hold DRIFT until the sparks turn ORANGE.' }); return; } ok = true; }
  if (!ok) return; G.lesson.n++; if (G.lesson.n < st.need) { G.ev.push({ k: 'lessonok', n: G.lesson.n, need: st.need }); return; }
  G.lesson.i++; G.lesson.n = 0; if (G.lesson.i >= G.lesson.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.lessonEnd = true; G.wait = 1.4; } }
function lessonMiss(G) {}
// ---------- for the robots ----------
// BLIND: thumbs that do not look: steer some way and hold it (or let go), or tap for the item
const BLIND = { s: G => { const R = Math.random; setSteer(G, R() < 0.25 ? 0 : (R() * 2 - 1) * (R() < 0.5 ? 1 : 0.6)); if (R() < 0.35) setDrift(G, !G.driftHeld); }, t: G => { useItem(G); } };      /* the thumbs that do not look also press and let go of DRIFT (in the same move as the steering, so the test's list of blind strings stays the size it was) */
// a driver who looks: follows a line through the corners, drifts the long bends (holds it to orange, more if it lasts),
// uses items sensibly; a person's hands: a beat late (react) and now and then a wobble (acc)
// THE TUTORIAL SHOWS THE ONE THING TO DO NOW (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing happens"). It slid
// left and right in a box for ever, and HOLD DRIFT + STEER was two things. Now the robot's driving (dryPlanAll: its steering and its drift):
// SLIDE LEFT / RIGHT on the left (how far), HOLD DRIFT on the right when a long bend comes, LET GO! when the robot would (orange in lesson 3),
// TAP TO USE IT on the item button when there is an item.
const KTC = { t: -1e9, v: null };
function kartCue(G) { const me = G.me; if (G.over || G.wait > 0 || G.count > 0) return ['WAIT…', 'wait', false]; const B = btnRects(), id = G.lesson && G.lesson.steps[G.lesson.i] ? G.lesson.steps[G.lesson.i].id : '';
  if (id === 'item' && me.item) return ['TAP TO USE IT', 'tap', [B.item.x, B.item.y]];
  const now = performance.now(); if (now - KTC.t < 150) return KTC.v; KTC.t = now; const all = dryPlanAll(G, null, { t: -1 }), st = all.filter(q => q[0] === 'setSteer').pop(), dr = all.filter(q => q[0] === 'setDrift').pop(); let v;
  if (id !== 'steer' && dr && dr[1] && !G.driftHeld) v = ['HOLD DRIFT', 'hold', [B.drift.x, B.drift.y]];
  else if (G.driftHeld && dr && !dr[1]) v = [me.tier >= 2 ? 'ORANGE! LET GO!' : 'LET GO!', 'release', [B.drift.x, B.drift.y]];
  else if (G.driftHeld) v = [id === 'big' ? 'HOLD… TILL ORANGE' : 'KEEP HOLDING', 'hold', [B.drift.x, B.drift.y]];
  else if (st && Math.abs(st[1]) > 0.25) { const R = 60 * k, x0 = W * 0.25, y0 = H * 0.72; v = [st[1] > 0 ? 'SLIDE RIGHT' : 'SLIDE LEFT', 'drag', [x0, y0, x0 + st[1] * R, y0]]; }
  else v = ['STRAIGHT ON…', 'wait', false];
  KTC.v = v; return v; }
function honest(G, o, mem) {
  const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random, k = G.me, T = G.T, S = T.S, n = S.length;
  if (G.over || G.wait > 0 || G.count > 0) { ACT.setSteer(G, 0); ACT.setDrift(G, false); return; }
  mem.t = (mem.t || 0) - 1 / 60; if (mem.t > 0) return; mem.t = 0.05 + react * 0.15;
  const look = Math.round(8 + k.v * 0.3), p = S[(k.i + look) % n]; let bend = 0; for (let q = 4; q < 26; q += 2) bend += S[(k.i + q) % n].curve; bend /= 11;
  const want = clamp(-Math.sign(bend) * Math.min(2.5, Math.abs(bend) * 5), -3, 3), tx = p.x - Math.sin(p.h) * want, tz = p.z + Math.cos(p.h) * want;
  let dh = Math.atan2(tz - k.z, tx - k.x) - (k.h + (k.slip || 0)); dh = Math.atan2(Math.sin(dh), Math.cos(dh)); let s = clamp(dh * 2.6, -1, 1);
  // a long bend coming: drift it (hold hard), let go when it straightens (or the sparks are orange and it is ending)
  const long = Math.abs(bend) > 0.2;
  if (!k.drift) ACT.setDrift(G, long && k.v > 16 && Math.sign(dh) === Math.sign(bend)); if (!k.drift && G.driftHeld) s = Math.sign(bend) * Math.max(0.4, Math.abs(s));
  if (k.drift) { const end = Math.abs(bend) < 0.1 || (k.tier >= 2 && Math.abs(bend) < 0.16) || Math.sign(bend) !== k.drift || Math.abs(k.lat || 0) > TW / 2 - 0.5; const need = dh * 2.6 * k.drift / Math.max(0.3, Math.min(1, k.v / 12)); s = k.drift * clamp((need - 0.15) / 1.25, -0.2, 1); if (end) ACT.setDrift(G, false); }
  if (R() > acc) s += (R() - 0.5) * 0.8;
  ACT.setSteer(G, s);
  if (k.item) { mem.it = (mem.it || 0) + 0.1; const ahead = G.karts.some(q => q !== k && race(q) > race(k) && race(q) - race(k) < 70), behind = G.karts.some(q => q !== k && race(k) - race(q) > 0 && race(k) - race(q) < 20);
    if (k.item === 'turbo' && Math.abs(bend) < 0.2 || k.item === 'shield' || k.item === 'zap' && (ahead || G.lesson) || k.item === 'slick' && (behind || mem.it > 4 || G.lesson)) { if (ACT.useItem(G)) mem.it = 0; } }
}
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.me.place = 1; G.me.done = true; finish(G); }

// what the robot would do now, without doing it (tools/dry_plan.py): the tutorial shows this move
const ACT_REAL = { setSteer, setDrift, useItem }; let ACT = ACT_REAL;
function dryPlan(G, o, mem) { let got = null; const rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { if (!got && !(a.length > 2 && a.slice(1).every(v => v === 0 || v === false))) got = [n, ...a.slice(1)]; return true; };      /* (a stick at rest, all its numbers 0, is not a move; a first bed, number 0, is) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return got; }
function dryPlanAll(G, o, mem) { const all = [], rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { all.push([n, ...a.slice(1)]); return true; };      /* every call, in order (for a robot that steers and drifts at once) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return all; }
