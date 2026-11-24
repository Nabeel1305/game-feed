
// ===================== RULES: Stunt Kart (game 66, set 12: his idea, "like Super Mario Kart... one that you can do cool things") =====================
// Kart racing against five rivals, built round the cool things: RAMPS. The kart drives itself; the LEFT thumb steers (put
// it down anywhere on the left half and slide). Off a ramp you fly: TAP the right side in the air for a trick (a flip, a
// spin, a barrel roll), as many as you can fit in, but each trick takes a moment, and landing in the middle of one is a
// wipeout. Land clean and you get a boost, bigger for each trick, and a PERFECT for landing just as the last one ends.
// Gold ramps launch a GLIDER: a long, slow flight over the gap with coins in the air. Tricks fill your STAR meter; when it
// is full you go STAR: faster, and any kart you touch spins out. On the ground the right thumb uses your item (? boxes):
// Turbo, Oil slick, Zap orb, Bubble. Boost pads (arrows) give a burst; coins on the track (up to 10) add top speed, and
// you drop some when you are hit. Finish in the place the race asks for.
// World: metres on a flat plane; x across, z (screen-down) the other way; y up; a heading h points along (cos h, sin h).
const RULES = [
  'The kart drives itself. <b>Left thumb</b>: put it down and slide to <b>steer</b>.',
  'Off a <b>ramp</b>, <b>tap the right side</b> for tricks. Land <b>between</b> tricks for a boost; land mid-trick and you wipe out!',
  'Tricks fill your <b>★ STAR</b>: when it is full you go faster and knock rivals flying.',
  'On the ground the right side uses your <b>item</b> from a ? box. Arrows are <b>boost pads</b>; coins add top speed.',
  'Gold ramps launch a <b>glider</b>: steer through the coins in the air. Finish in the place the race asks for.',
];
const KARTS = [{ id: 'rocket', name: 'Rocket', col: 0xff3a4a, col2: 0xffffff, stars: 0 }, { id: 'lime', name: 'Lime Zip', col: 0x7ae03a, col2: 0x1a2a10, stars: 4 },
  { id: 'wave', name: 'Wave', col: 0x2a8aff, col2: 0xffd040, stars: 10 }, { id: 'bee', name: 'Bumblebee', col: 0xffd020, col2: 0x1a1a1a, stars: 18 },
  { id: 'ghost', name: 'Phantom', col: 0xe8e8f0, col2: 0x8a3aff, stars: 28 }, { id: 'gold', name: 'Golden Ace', col: 0xe8b830, col2: 0x7a1020, stars: 40 }];
const RIVALS = [{ name: 'Blaze', col: 0xff8a20 }, { name: 'Mint', col: 0x30e0b0 }, { name: 'Violet', col: 0xa050ff }, { name: 'Sunny', col: 0xffe040 }, { name: 'Coal', col: 0x404050 }, { name: 'Rio', col: 0x3a8aff }, { name: 'Pip', col: 0xff6ac8 }, { name: 'Dusty', col: 0xb08a5a }];
// tracks: long straights for the ramps, wide bends you can take flat out with a good line
const TRACKS = [
  { name: 'Sunny Stunts', sky: 'noon', grass: 0x5a9a3a, pts: [[0, 0], [90, 0], [140, 20], [158, 70], [138, 120], [88, 140], [10, 140], [-45, 122], [-66, 72], [-48, 22]] },
  { name: 'Canyon Leap', sky: 'golden', grass: 0xc08a50, pts: [[0, 0], [100, 0], [150, 30], [152, 92], [108, 122], [46, 112], [6, 146], [-60, 136], [-84, 84], [-62, 30]] },
  { name: 'Neon Jumps', sky: 'night', grass: 0x2a2a3a, pts: [[0, 0], [110, 0], [152, 40], [132, 92], [70, 104], [46, 146], [-20, 166], [-84, 136], [-96, 62], [-56, 14]] },
  { name: 'Snow Flyer', sky: 'overcast', grass: 0xe8eef4, pts: [[0, 0], [80, -12], [140, 10], [160, 62], [118, 102], [136, 154], [84, 194], [0, 184], [-52, 142], [-46, 84], [-74, 40], [-44, 4]] },
];
const ITEMS = { turbo: { name: 'Turbo', icon: '🚀' }, slick: { name: 'Oil slick', icon: '🛢' }, zap: { name: 'Zap orb', icon: '⚡' }, shield: { name: 'Bubble', icon: '🫧' } };
const TRICKS = ['FLIP', 'SPIN', 'BARREL ROLL', 'TABLE TOP', 'CORKSCREW'];
const UPGRADES = [
  { id: 'engine', name: 'Engine', desc: 'A little more top speed.', max: 3, cost: l => 25 + l * 30 },
  { id: 'springs', name: 'Big springs', desc: 'More air off every ramp: room for another trick.', max: 2, cost: l => 30 + l * 35 },
  { id: 'star', name: 'Star charger', desc: 'Tricks fill the STAR faster.', max: 2, cost: l => 30 + l * 30 },
  { id: 'magnet', name: 'Coin magnet', desc: 'Pull in coins from further away.', max: 1, cost: l => 45 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Rookie'], [40, 'Jumper'], [130, 'Flipper'], [320, 'Stunt pro'], [700, 'Daredevil'], [1500, 'Sky king']];
function myKart() { if (typeof HEADLESS !== 'undefined' && HEADLESS) return KARTS[0]; const id = store.get('kart', 'rocket'); return KARTS.find(q => q.id === id) || KARTS[0]; }
const PLACES = TRACKS.map(t => ({ name: t.name })), placeOf = N => (N - 1) % TRACKS.length;
const TW = 12, VMAX = 27, GRIP = 30, GRAV = 18, TRICK = 0.38, VY = 9.4, VYBIG = 7.6;
// the track: a smooth closed curve through the points, cut into even steps (1.5 m) with where each step is and which way
function trackOf(i) { const T = TRACKS[i]; if (T.S) return T; const P = T.pts, n = P.length, raw = [];
  for (let j = 0; j < n; j++) { const p0 = P[(j - 1 + n) % n], p1 = P[j], p2 = P[(j + 1) % n], p3 = P[(j + 2) % n]; for (let q = 0; q < 30; q++) { const t = q / 30, t2 = t * t, t3 = t2 * t;
      raw.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3), 0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]); } }
  let L = 0; const cum = [0]; for (let j = 1; j <= raw.length; j++) { const a = raw[j - 1], b = raw[j % raw.length]; L += Math.hypot(b[0] - a[0], b[1] - a[1]); cum.push(L); }
  const step = 1.5, m = Math.floor(L / step), S = []; let k2 = 0; for (let q = 0; q < m; q++) { const d = q * L / m; while (cum[k2 + 1] < d) k2++; const a = raw[k2], b = raw[(k2 + 1) % raw.length], u = (d - cum[k2]) / Math.max(1e-6, cum[k2 + 1] - cum[k2]); S.push({ x: a[0] + (b[0] - a[0]) * u, z: a[1] + (b[1] - a[1]) * u }); }
  for (let q = 0; q < S.length; q++) { const a = S[(q - 1 + S.length) % S.length], b = S[(q + 1) % S.length]; S[q].h = Math.atan2(b.z - a.z, b.x - a.x); }
  for (let q = 0; q < S.length; q++) { let dh = S[(q + 6) % S.length].h - S[q].h; dh = Math.atan2(Math.sin(dh), Math.cos(dh)); S[q].curve = dh; }
  T.S = S; T.L = L; T.ds = L / m; features(T); return T; }
// ramps where the track runs straight long enough to land (the straightest long run gets the gold glider ramp), boost pads
// and coin lines elsewhere. Each place is scored by the sharpest bend over the flight that follows it.
function features(T) { const S = T.S, n = S.length, worst = (i, len) => { let m = 0; for (let q = 0; q < len; q++) m = Math.max(m, Math.abs(S[(i + q) % n].curve)); return m; };
  T.ramps = []; T.pads = []; T.coins = []; const used = [], gap = (a, b) => Math.abs(((a - b + n + n / 2) % n) - n / 2), free = (i, w) => used.every(u => gap(i, u) > w);
  const big = []; for (let i = 14; i < n - 70; i += 2) big.push({ i, w: worst(i, 62) }); big.sort((a, b) => a.w - b.w); if (big.length && big[0].w < 0.16) { const i0 = big[0].i; T.ramps.push({ i0, i1: (i0 + 4) % n, h: 2.6, big: true }); used.push(i0);
    for (let j = 0; j < 7; j++) { const d = (8 + j * 6) * T.ds, t = d / VMAX, g = GRAV * 0.32, y = 2.6 + VYBIG * t - g * t * t / 2; T.coins.push({ i: (i0 + 4 + 8 + j * 6) % n, lat: Math.sin(j * 0.5) * 2.4, y: Math.max(1.2, y + 0.6), air: true }); } }      /* along the glider's own arc */
  const small = []; for (let i = 14; i < n - 30; i += 2) small.push({ i, w: worst(i, 28) }); small.sort((a, b) => a.w - b.w);
  for (const c of small) { if (T.ramps.length >= 3) break; if (c.w > 0.2) break; if (free(c.i, n / 5)) { T.ramps.push({ i0: c.i, i1: (c.i + 4) % n, h: 1.5, big: false }); used.push(c.i); } }
  T.ramps.sort((a, b) => a.i0 - b.i0);
  for (const c of small) { if (T.pads.length >= 2) break; if (free(c.i, 34)) { T.pads.push({ i: c.i, lat: (T.pads.length % 2 ? -1 : 1) * 2.6 }); used.push(c.i); } }
  // coins strung through the bends (on the inside: a good line takes them)
  for (let i = 0; i < n; i++) if (Math.abs(S[i].curve) > 0.12 && free(i, 18) && T.coins.length < 36) { for (let j = 0; j < 4; j++) T.coins.push({ i: (i + j * 3) % n, lat: -Math.sign(S[i].curve) * 2.8, y: 0.7 }); used.push(i); } }
// where a point is on the track: the nearest step (searched near the last one), how far along, how far across
function locate(T, x, z, hint) { const S = T.S, n = S.length; let bi = hint == null ? 0 : hint, bd = 1e18, best = 0; const span = hint == null ? n : 40;
  if (hint != null) for (let q = -span; q <= span; q++) { const i = ((bi + q) % n + n) % n, d = (S[i].x - x) ** 2 + (S[i].z - z) ** 2; if (d < bd) { bd = d; best = i; } }
  else for (let i = 0; i < n; i++) { const d = (S[i].x - x) ** 2 + (S[i].z - z) ** 2; if (d < bd) { bd = d; best = i; } }
  const p = S[best], lat = -(x - p.x) * Math.sin(p.h) + (z - p.z) * Math.cos(p.h); return { i: best, lat }; }
function makeCfg(N, help) {
  const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), e = easyOf(N);
  return { N, f, help: !!help, track: placeOf(N), place: N <= 2 ? 3 : N <= 6 ? 2 : 1, laps: N <= 2 ? 2 : 3, boss: N % 10 === 0,
    skill: x(0.8, 1.0, 35) * (1 - 0.03 * e) * (help ? 0.96 : 1) * (N % 10 === 0 ? 1.03 : 1), aiTricks: x(0.6, 3.2, 30), aiItems: x(0.4, 1, 30), aiCrash: x(0.25, 0.06, 30),
    vmax: VMAX * (1 + 0.025 * upLv('engine')), air: 1 + 0.12 * upLv('springs'), starRate: 1 + 0.25 * upLv('star'), magnet: 1.4 + 0.9 * upLv('magnet') }; }
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0, T = trackOf(cfg.track);
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, place: cfg.track, T, kart: o.kart || myKart(),
    karts: [], boxes: [], slicks: [], orbs: [], coinsT: [], steer: 0, count: 2.6, tricks: 0, perfects: 0, wipeouts: 0, hits: 0, zaps: 0, coins: 0, stars: 0, style: 0, star: 0, best: 99, items: 0, bigAir: 0 };
  grid(G); placeBoxes(G); placeCoins(G);
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else G.ev.push({ k: 'start' });
  return G;
}
function grid(G) { const T = G.T, S = T.S, n = S.length; G.karts = [];
  const slot = (q, col) => { const i = (n - 4 - q * 4) % n, p = S[(i + n) % n]; return { x: p.x - Math.sin(p.h) * col, z: p.z + Math.cos(p.h) * col, h: p.h, i: (i + n) % n }; };
  const R = G.rnd, pool = RIVALS.slice(); for (let i = pool.length - 1; i > 0; i--) { const j = (R() * (i + 1)) | 0; [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const order = G.lesson ? [] : [0, 1, 2, 3, 4]; order.forEach((r, q) => { const s = slot(Math.floor(q / 2), q % 2 ? 2.4 : -2.4); G.karts.push(newKart(G, s, pool[r], false, q)); });
  const s = slot(G.lesson ? 0 : 3, 0); G.me = newKart(G, s, { name: 'You', col: G.kart.col }, true, 9); G.karts.push(G.me);
  for (const k of G.karts) { k.lap = 0; k.prog = -((n - k.i) % n) * T.ds; k.last = k.i; } }
function newKart(G, s, who, me, q) { const R = G.rnd; return { me, who, x: s.x, z: s.z, y: 0, vy: 0, air: false, glide: false, ramp: null, trick: null, airTricks: 0, h: s.h, v: 0, i: s.i, last: s.i, lap: 0, prog: 0, steer: 0, boost: 0, spin: 0, shield: 0, star: 0, coin: 0, item: null, itemT: 0,
  line: (R() - 0.5) * 4, skill: me ? 1 : 1 + (q - 2) * 0.012 + (R() - 0.5) * 0.02, done: false, place: 0, fin: 0, lane: R() * 6, plan: 0 }; }
function placeBoxes(G) { const S = G.T.S, n = S.length; G.boxes = []; for (const f of [0.3, 0.72]) { let i = Math.floor(f * n); for (let tries = 0; tries < 40 && G.T.ramps.some(r => Math.abs(((i - r.i0 + n + n / 2) % n) - n / 2) < 30); tries++) i = (i + 5) % n; const p = S[i]; for (const c of [-3.6, -1.2, 1.2, 3.6]) G.boxes.push({ x: p.x - Math.sin(p.h) * c, z: p.z + Math.cos(p.h) * c, t: 0 }); } }
function placeCoins(G) { const S = G.T.S; G.coinsT = G.T.coins.map(c => { const p = S[c.i]; return { x: p.x - Math.sin(p.h) * c.lat, z: p.z + Math.cos(p.h) * c.lat, y: c.y, air: !!c.air, t: 0 }; }); }
// ---------- your thumbs ----------
function setSteer(G, s) { G.steer = clamp(s, -1, 1); }
// the right thumb: in the air a trick, on the ground the item
function tapRight(G) { const k = G.me; if (G.over || k.done || G.count > 0 || G.wait > 0) return false; if (k.air) return startTrick(G, k); if (!k.item && G.lesson && lessonNow(G).id !== 'item') lessonMiss(G, 'ground'); return useItem(G); }
function startTrick(G, k) { if (!k.air || k.spin > 0) return false; if (k.trick) { k.mash = (k.mash || 0) + 1; return false; }      /* a tap during a trick does nothing (no queue: mashing is not a plan) */
  k.trick = { t: 0, kind: k.me ? (G.tricks + k.airTricks) % TRICKS.length : (G.rnd() * 3) | 0 }; k.airTricks++; if (k.me) G.ev.push({ k: 'trick', n: k.airTricks, kind: k.trick.kind }); return true; }
function useItem(G, k = G.me) { if (G.over || !k.item || k.done || G.count > 0 || k.air) return false; const it = k.item; k.item = null; G.items += k.me ? 1 : 0; const S = G.T.S;
  if (it === 'turbo') k.boost = Math.max(k.boost, 1.3);
  if (it === 'shield') k.shield = 7;
  if (it === 'slick') G.slicks.push({ x: k.x - Math.cos(k.h) * 2.2, z: k.z - Math.sin(k.h) * 2.2, t: 22, by: k });
  if (it === 'zap') { const ahead = G.karts.filter(o => o !== k && !o.done && race(o) > race(k)).sort((a, b) => race(a) - race(b))[0]; G.orbs.push({ x: k.x, z: k.z, i: k.i, tgt: ahead || null, by: k, t: 0, h: k.h }); }
  G.ev.push({ k: 'use', it, me: k.me, x: k.x, z: k.z }); if (k.me) lessonSee(G, 'item'); return true; }
const race = k => k.lap * 1e5 + k.prog;
// time until a flying kart lands (the HUD shows it; the robots use it)
const landIn = (k, g) => { const a = g; return (k.vy + Math.sqrt(Math.max(0, k.vy * k.vy + 2 * a * k.y))) / a; };
const gravOf = k => k.glide ? GRAV * 0.32 : GRAV;
// ---------- the race, step by step ----------
function step(G, dt) {
  if (G.over || !(dt > 0)) return; G.t += dt; const c = G.cfg, T = G.T, S = T.S, n = S.length, R = G.rnd;
  if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0 && G.lessonEnd) { G.lessonEnd = false; Object.assign(G, { slicks: [], orbs: [], count: 2.6, tricks: 0, perfects: 0, wipeouts: 0, hits: 0, zaps: 0, coins: 0, items: 0, style: 0, star: 0, bigAir: 0 }); grid(G); placeBoxes(G); placeCoins(G); G.ev.push({ k: 'start' }); } if (G.wait > 0) return; }
  if (G.count > 0) { const was = Math.ceil(G.count); G.count -= dt; if (Math.ceil(G.count) !== was) G.ev.push({ k: 'light', n: Math.max(0, Math.ceil(G.count)) }); if (G.count <= 0) G.ev.push({ k: 'go' }); else return; }
  for (const k of G.karts) { if (!k.me && !k.done) ai(G, k, dt); drive(G, k, dt); }
  // karts bump each other (on the ground); a STAR kart knocks the other flying
  for (let a = 0; a < G.karts.length; a++) for (let b = a + 1; b < G.karts.length; b++) { const p = G.karts[a], q = G.karts[b]; if (Math.abs(p.y - q.y) > 1.2) continue; const dx = q.x - p.x, dz = q.z - p.z, d = Math.hypot(dx, dz);
    if (d < 1.9 && d > 1e-4) { if (p.star > 0 && q.star <= 0) { hit(G, q, 'star', p); } else if (q.star > 0 && p.star <= 0) { hit(G, p, 'star', q); }
      const ux = dx / d, uz = dz / d, o = (1.9 - d) / 2; p.x -= ux * o; p.z -= uz * o; q.x += ux * o; q.z += uz * o; if ((p.me || q.me) && !G.bumpT) { G.bumpT = 0.4; G.ev.push({ k: 'bump' }); } } }
  G.bumpT = Math.max(0, (G.bumpT || 0) - dt);
  for (const b of G.boxes) { if (b.t > 0) { b.t -= dt; continue; } for (const k of G.karts) if (!k.air && Math.hypot(k.x - b.x, k.z - b.z) < 1.6) { b.t = 3; if (!k.item) { k.item = pickItem(G, k); k.itemT = 0.8 + R() * 2.5; if (k.me) G.ev.push({ k: 'item', it: k.item }); } break; } }
  for (const cn of G.coinsT) { if (cn.t > 0) { cn.t -= dt; continue; } for (const k of G.karts) { const rr = k.me ? c.magnet : 1.4; if (Math.hypot(k.x - cn.x, k.z - cn.z) < rr && Math.abs((k.y + 0.6) - cn.y) < (cn.air ? 1.8 : 1.4)) { cn.t = cn.air ? 999 : 9; if (k.coin < 10) k.coin++; if (cn.air && k.air) k.airCoins = (k.airCoins || 0) + 1; if (k.me) { G.coins++; G.ev.push({ k: 'coin', n: k.coin, air: cn.air }); } break; } } }
  for (let i = G.slicks.length - 1; i >= 0; i--) { const s = G.slicks[i]; s.t -= dt; if (s.t <= 0) { G.slicks.splice(i, 1); continue; } for (const k of G.karts) if (!k.air && Math.hypot(k.x - s.x, k.z - s.z) < 1.5 && !(s.by === k && s.t > 20)) { G.slicks.splice(i, 1); hit(G, k, 'slick', s.by); break; } }
  for (let i = G.orbs.length - 1; i >= 0; i--) { const o = G.orbs[i]; o.t += dt; const tg = o.tgt && !o.tgt.done ? o.tgt : null; let tx, tz; if (tg && o.t > 0.15) { tx = tg.x; tz = tg.z; } else { o.i = (o.i + 2) % n; tx = S[o.i].x; tz = S[o.i].z; }
    const dx = tx - o.x, dz = tz - o.z, d = Math.hypot(dx, dz) || 1, sp = 42 * dt; if (tg && d < sp + 1.2) { G.orbs.splice(i, 1); hit(G, tg, 'zap', o.by); continue; } o.x += dx / d * Math.min(sp, d); o.z += dz / d * Math.min(sp, d); o.i = locate(T, o.x, o.z, o.i).i; if (o.t > 6) G.orbs.splice(i, 1); }
  const order = G.karts.slice().sort((a, b) => (b.done ? 1e9 - b.fin : race(b)) - (a.done ? 1e9 - a.fin : race(a))); order.forEach((k, q) => k.place = q + 1);
  if (!G.lesson && !G.over) { G.best = Math.min(G.best, G.me.place); if (G.me.done) finish(G); }
}
function pickItem(G, k) { const R = G.rnd(), back = (k.place || 3) / G.karts.length; if (G.lesson && lessonNow(G).id === 'item') return R < 0.5 ? 'turbo' : 'zap'; if (R < 0.2 + back * 0.25) return 'turbo'; if (R < 0.45 + back * 0.3) return 'zap'; if (R < 0.8) return 'slick'; return 'shield'; }
function hit(G, k, why, by) { if (k.star > 0) return; if (k.shield > 0) { k.shield = 0; G.ev.push({ k: 'pop', me: k.me, x: k.x, z: k.z }); return; } if (k.spin > 0) return;
  k.spin = 1.1; k.boost = 0; const lost = Math.min(3, k.coin); k.coin -= lost; G.ev.push({ k: 'spin', me: k.me, why, x: k.x, z: k.z, lost }); if (k.me) { G.hits++; lessonMiss(G, why); } if (by && by.me && !k.me) { G.zaps++; G.ev.push({ k: 'gotem', x: k.x, z: k.z, why }); } }
// one kart: speed, steering, ramps and the air, tricks and landings, boost pads, barriers, laps
const KW = 0.9;      // half a kart's width (its wheels): where its side meets the rail
function drive(G, k, dt) { const c = G.cfg, T = G.T, S = T.S, n = S.length;
  const st = k.me ? G.steer : k.steer, go = !k.done || !k.me;
  k.boost = Math.max(0, k.boost - dt); k.shield = Math.max(0, k.shield - dt); k.spin = Math.max(0, k.spin - dt); if (k.star > 0) { k.star -= dt; if (k.star <= 0 && k.me) G.ev.push({ k: 'starend' }); }
  const loc = locate(T, k.x, k.z, k.i), off = !k.air && Math.abs(loc.lat) > TW / 2;
  const top = (k.me ? c.vmax : VMAX * c.skill * k.skill * (k.rubber || 1)) * (1 + 0.012 * k.coin) * (k.boost > 0 ? 1.32 : 1) * (k.star > 0 ? 1.28 : 1) * (off && k.boost <= 0 && k.star <= 0 ? 0.5 : 1) * (k.spin > 0 ? 0.25 : 1) * (go ? 1 : 0.6);
  if (!k.air) k.v += (top - k.v) * Math.min(1, dt * (k.v < top ? 0.9 : 2.5));
  // steering: a grip limit (wide at full speed); in the air a kart cannot turn (nothing to push on), only a glider steers (23 Nov 2026)
  const sp = Math.min(1, k.v / 12), want = st * 1.75 * sp * (k.air ? (k.glide ? 0.9 : 0) : 1), lim = GRIP / Math.max(6, k.v); let yaw = clamp(want, -lim, lim); if (!k.air && Math.abs(want) > lim) k.v -= (Math.abs(want) - lim) * k.v * 0.5 * dt;
  if (k.air && !k.glide && !(k.rocket > 0)) yaw = 0;      // off the ground a kart keeps the line it took off on
  k.h += yaw * dt * (k.spin ? 0 : 1) + (k.spin ? dt * 11 : 0);
  k.x += Math.cos(k.h) * k.v * dt; k.z += Math.sin(k.h) * k.v * dt;
  // the air
  if (k.air) { k.vy -= gravOf(k) * dt; k.y += k.vy * dt; if (k.trick) { k.trick.t += dt; if (k.trick.t >= TRICK) { k.trick = null; k.lastTrickEnd = G.t; if (k.me) G.ev.push({ k: 'trickdone', n: k.airTricks }); } }
    if (k.y <= 0) land(G, k); }
  // the barriers
  // the rail (his review of Kart Kingdom, 24 Nov 2026, the same fault here: "I shouldn't be phasing against the rail I should clearly hit it"):
  // the kart's SIDE stops at the rail (KW, half its width; it used to be its middle, so half the kart went into the rail). Brushing it
  // scrapes (sparks, a little speed); running into it is a hit: the kart bounces off, loses speed and rocks, and a flying kart drops.
  const l2 = locate(T, k.x, k.z, k.i), p = S[l2.i], lim2 = TW / 2 + 3.4 - KW; if (Math.abs(l2.lat) > lim2) { const s = Math.sign(l2.lat), back = Math.abs(l2.lat) - lim2; k.x += Math.sin(p.h) * s * back; k.z -= Math.cos(p.h) * s * back;
    let rel = k.h - p.h; rel = Math.atan2(Math.sin(rel), Math.cos(rel)); const air = k.air, into = k.v * Math.abs(Math.sin(rel)), hard = into > 4.5 || (air && into > 2.5);
    if (hard) { k.v *= air ? 0.5 : 0.6; k.h = p.h - rel * 0.45; k.slip = 0; k.wob = 1; if (air) k.vy = Math.min(k.vy, 0) * 0.5 - 1.5; if (k.drift) { k.drift = 0; k.charge = 0; k.tier = 0; } }
    else { k.v *= 1 - Math.min(0.08, dt * 2.5); k.h -= rel * Math.min(1, dt * 8); }
    if (k.me && (hard ? !G.wallT : !G.scrapeT)) { if (hard) G.wallT = 0.45; else G.scrapeT = 0.09;
      G.ev.push({ k: hard ? 'wall' : 'scrape', x: k.x - Math.sin(p.h) * s * KW * 1.05, z: k.z + Math.cos(p.h) * s * KW * 1.05, y: k.y || 0, h: p.h, s, air, fly: air && (k.y - (p.y || 0)) > 1.2 }); } }
  k.wob = Math.max(0, (k.wob || 0) - dt * 1.4); if (k.me) G.scrapeT = Math.max(0, (G.scrapeT || 0) - dt);
  if (k.me) G.wallT = Math.max(0, (G.wallT || 0) - dt);
  // progress, ramps, pads
  const di = l2.i - k.last; let dd = di; if (di < -n / 2) dd = di + n; if (di > n / 2) dd = di - n;
  if (!k.air && dd > 0) { for (const r of T.ramps) { const rel = ((l2.i - r.i0) % n + n) % n; if (rel <= 5 && Math.abs(l2.lat) < TW / 2 + 0.3) { if (rel < 4) { k.y = r.h * rel / 4; k.ramp = r; } else if (k.ramp === r) launch(G, k, r); } }
    if (k.ramp && !k.air && (((l2.i - k.ramp.i0) % n + n) % n) > 5) { k.ramp = null; k.y = 0; }
    for (const pd of T.pads) { const rel = ((l2.i - pd.i) % n + n) % n; if (rel <= Math.max(1, dd) && Math.abs(l2.lat - pd.lat) < 1.9 && k.padI !== pd.i) { k.padI = pd.i; k.boost = Math.max(k.boost, 0.9); if (k.me) { G.ev.push({ k: 'pad' }); addStyle(G, 0.04); } } } }
  k.prog += dd * T.ds; k.last = l2.i; k.i = l2.i; k.lat = l2.lat;
  if (k.prog >= T.L) { k.prog -= T.L; k.lap++; k.padI = null; if (k.me) { G.ev.push({ k: 'lap', lap: k.lap }); placeCoinsAir(G); } if (k.lap >= c.laps && !G.lesson && !k.done) { k.done = true; k.fin = G.t; if (k.me) G.ev.push({ k: 'finish' }); } }
  if (k.prog < -T.L / 2) { k.prog += T.L; k.lap--; } }
function placeCoinsAir(G) { for (const cn of G.coinsT) if (cn.air) cn.t = 0; }
function launch(G, k, r) { const c = G.cfg; k.air = true; k.glide = r.big; k.ramp = null; k.airTricks = 0; k.trick = null; k.lastTrickEnd = -9; k.mash = 0; k.airCoins = 0; k.y = r.h; k.vy = (r.big ? VYBIG : VY) * (k.me ? c.air : 1) * (0.95 + k.v / VMAX * 0.1); k.plan = k.me ? 0 : aiPlan(G, k, r); if (k.me) { G.ev.push({ k: 'launch', big: r.big, t: landIn(k, gravOf(k)) }); if (r.big) G.bigAir++; } }
function land(G, k) { k.y = 0; const was = k.vy; k.vy = 0; k.air = false; const glide = k.glide; k.glide = false;
  if (k.trick) { k.trick = null; k.spin = 1.25; k.boost = 0; const lost = Math.min(3, k.coin); k.coin -= lost; if (k.me) { G.wipeouts++; G.ev.push({ k: 'wipeout', lost }); lessonMiss(G, 'wipeout'); } k.airTricks = 0; return; }
  const n = k.airTricks; k.airTricks = 0; if (k.me && glide) lessonSee(G, 'glide', k.airCoins | 0); if (!n) { if (k.me) { G.ev.push({ k: 'land', n: 0 }); lessonSee(G, 'land', 0); } return; }
  const perfect = G.t - (k.lastTrickEnd == null ? -9 : k.lastTrickEnd) < 0.16; k.boost = Math.max(k.boost, 0.35 + 0.32 * n + (perfect ? 0.35 : 0)); k.v = Math.max(k.v, VMAX * 0.95);
  if (k.me) { G.tricks += n; if (perfect) G.perfects++; G.ev.push({ k: 'land', n, perfect, glide }); addStyle(G, (0.1 * n + (perfect ? 0.08 : 0)) * G.cfg.starRate); lessonSee(G, 'land', n, perfect); } }
function addStyle(G, a) { if (G.me.star > 0) return; G.style = Math.min(1, G.style + a); if (G.style >= 1) { G.style = 0; G.me.star = 4.5; G.stars++; G.ev.push({ k: 'star' }); } }
// the rivals: a line, a speed, items with sense, a few tricks of their own (the better ones risk more), a gentle rubber band
function aiPlan(G, k, r) { const R = G.rnd, c = G.cfg, max = Math.floor(landIn({ vy: (r.big ? VYBIG : VY), y: r.h }, r.big ? GRAV * 0.32 : GRAV) / TRICK); return Math.min(max, Math.floor(c.aiTricks * (0.6 + R() * 0.6) * (r.big ? 2 : 1))); }
function ai(G, k, dt) { const T = G.T, S = T.S, n = S.length, look = Math.round(9 + k.v * 0.35), p = S[(k.i + look) % n], cv = Math.abs(S[(k.i + look) % n].curve);
  k.lane += dt * 0.25; const want = clamp(k.line + Math.sin(k.lane) * 1.2 - Math.sign(S[(k.i + look) % n].curve) * Math.min(2.5, cv * 6), -TW / 2 + 1, TW / 2 - 1), tx = p.x - Math.sin(p.h) * want, tz = p.z + Math.cos(p.h) * want;
  let dh = Math.atan2(tz - k.z, tx - k.x) - k.h; dh = Math.atan2(Math.sin(dh), Math.cos(dh)); k.steer = clamp(dh * 2.4, -1, 1);
  const lead = race(k) - race(G.me); k.rubber = clamp(1 - lead / 2500, 0.95, 1.05);
  if (k.air && !k.trick && k.plan > k.airTricks) { const tl = landIn(k, gravOf(k)); if (tl > TRICK + 0.05 || G.rnd() < G.cfg.aiCrash * dt * 4) startTrick(G, k); }
  if (k.item) { k.itemT -= dt; if (k.itemT <= 0 && G.rnd() < G.cfg.aiItems) { const ahead = G.karts.some(o => o !== k && race(o) > race(k) && race(o) - race(k) < 60); if (k.item !== 'zap' || ahead) useItem(G, k); else k.itemT = 0.5; } else if (k.itemT <= 0) k.itemT = 1; } }
function finish(G) { const c = G.cfg, me = G.me, place = me.place, win = place <= c.place; G.over = win ? 'won' : 'lost';
  const stars = win ? 1 + (place === 1 ? 1 : 0) + (G.tricks >= 6 + Math.min(6, G.N / 4) && G.wipeouts === 0 ? 1 : 0) : 0;
  G.res = { win, stars, place, need: c.place, laps: c.laps, time: +G.t.toFixed(1), tricks: G.tricks, perfects: G.perfects, wipeouts: G.wipeouts, starN: G.stars, hits: G.hits, zaps: G.zaps, coins: Math.round(G.coins / 3) + (win ? 4 + Math.ceil(G.N / 3) + stars * 2 : 1), track: TRACKS[c.track].name, style: G.tricks * 100 + G.perfects * 50 };
  G.ev.push({ k: win ? 'won' : 'lost', place }); return true; }
// ---------- LESSONS: a track to yourself ----------
const LESSONS = {
  1: [{ id: 'trick', title: 'JUMP AND TRICK', say: 'IN THE AIR: TAP', do: 'tap', at: G => [W * 0.73, H * 0.72], how: 'Off every ramp, TAP the right side once in the air for a trick, and land after it has finished. Two jumps in a row. Tap only in the air!', need: 2 }],
  2: [{ id: 'two', title: 'TWO IN ONE JUMP', say: 'TAP, TAP AGAIN', do: 'tap', at: G => [W * 0.73, H * 0.72], how: 'Fit TWO tricks into one jump: tap as you leave the ramp, tap again the moment the first one ends, and land clean. Twice.', need: 2 }],
  3: [{ id: 'glide', title: 'THE GLIDER', say: 'STEER TO THE COINS', do: 'drag', dir: 'lr', how: 'The GOLD ramp launches a glider. Steer through the coins in the air: catch 5 in one flight.', need: 1 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); grid(G); G.count = 0; }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonSee(G, what, n, perfect) { const st = lessonNow(G); if (!st) return; let ok = false;
  if (st.id === 'trick' && what === 'land') { if (n >= 1) ok = true; else { if (G.lesson.n) { G.lesson.n = 0; G.ev.push({ k: 'lessonmiss', how: 'No trick on that jump. ' + st.how }); } return; } }
  if (st.id === 'two' && what === 'land') { if (n >= 2) ok = true; else { G.lesson.n = 0; G.ev.push({ k: 'lessonmiss', how: n ? 'Only one trick. Tap again the moment the first one ends, then land.' : 'No tricks on that jump. ' + st.how }); return; } }
  if (st.id === 'glide' && what === 'glide') { if (n >= 5) ok = true; else { G.ev.push({ k: 'lessonmiss', how: `${n} coins. Steer through them as you fly: catch 5.` }); return; } }
  if (!ok) return; G.lesson.n++; if (G.lesson.n < st.need) { G.ev.push({ k: 'lessonok', n: G.lesson.n, need: st.need }); return; }
  G.lesson.i++; G.lesson.n = 0; if (G.lesson.i >= G.lesson.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.lessonEnd = true; G.wait = 1.4; } }
// a wipeout during a lesson starts the count again (tapping without looking crashes, so it never gets through)
function lessonMiss(G, why) { const st = lessonNow(G); if (!st) return;
  if (why === 'wipeout') { G.lesson.n = 0; G.ev.push({ k: 'lessonmiss', how: 'Wiped out! Land only when the trick has finished. ' + st.how }); }
  if (why === 'ground') { G.lesson.n = 0; if (G.t - (G.lgT || -9) > 2) G.ev.push({ k: 'lessonmiss', how: 'Tap only when you are in the AIR. ' + st.how }); G.lgT = G.t; } }
// ---------- for the robots ----------
// BLIND: thumbs that do not look: steer some way and hold it (or let go), or tap the right side
const BLIND = { s: G => { const R = Math.random; setSteer(G, R() < 0.25 ? 0 : (R() * 2 - 1) * (R() < 0.5 ? 1 : 0.6)); }, t: G => { tapRight(G); } };
// a driver who looks: follows a line, takes the pads and the coins when near, does as many tricks as a jump allows (a beat
// late, now and then one too many), uses items with sense
function honest(G, o, mem) {
  const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random, k = G.me, T = G.T, S = T.S, n = S.length;
  if (G.over || G.wait > 0 || G.count > 0) { setSteer(G, 0); return; }
  // tricks: start one when there is time for it to finish, with a human margin
  if (k.air) { if (!k.trick) { mem.wait = (mem.wait || 0) + 1 / 60; const tl = landIn(k, gravOf(k)), margin = 0.04 + react * 0.15 + (1 - acc) * 0.2;
      if (mem.wait > 0.04 + react * 0.2 && tl > TRICK + margin) { startTrick(G, k); mem.wait = 0; } else if (mem.wait > 0.04 + react * 0.2 && tl > TRICK - 0.05 && R() < (1 - acc) * 0.05) { startTrick(G, k); mem.wait = 0; } } }
  else mem.wait = 0;
  mem.t = (mem.t || 0) - 1 / 60; if (mem.t > 0) return; mem.t = 0.05 + react * 0.15;
  const look = Math.round(8 + k.v * 0.3), p = S[(k.i + look) % n]; let bend = 0; for (let q = 4; q < 26; q += 2) bend += S[(k.i + q) % n].curve; bend /= 11;
  // aim: through a ramp or pad ahead, else the inside of the bend
  let want = clamp(-Math.sign(bend) * Math.min(2.5, Math.abs(bend) * 5), -3, 3);
  if (k.glide) { let bc = null, bd = 1e9; for (const cn of G.coinsT) { if (!cn.air || cn.t > 0) continue; const ax = cn.x - k.x, az = cn.z - k.z, fw = ax * Math.cos(k.h) + az * Math.sin(k.h); if (fw > 2 && fw < bd) { bd = fw; bc = cn; } } if (bc) { const lc = locate(T, bc.x, bc.z, k.i); want = lc.lat; } } for (const pd of T.pads) { const rel = ((pd.i - k.i) % n + n) % n; if (rel > 0 && rel < 30) want = pd.lat; } for (const r of T.ramps) { const rel = ((r.i0 - k.i) % n + n) % n; if (rel > 0 && rel < 30) want = 0; }
  const tx = p.x - Math.sin(p.h) * want, tz = p.z + Math.cos(p.h) * want; let dh = Math.atan2(tz - k.z, tx - k.x) - k.h; dh = Math.atan2(Math.sin(dh), Math.cos(dh)); let s = clamp(dh * 2.6, -1, 1);
  if (R() > acc) s += (R() - 0.5) * 0.8; setSteer(G, s);
  if (k.item && !k.air) { mem.it = (mem.it || 0) + 0.1; const ahead = G.karts.some(q => q !== k && race(q) > race(k) && race(q) - race(k) < 70), behind = G.karts.some(q => q !== k && race(k) - race(q) > 0 && race(k) - race(q) < 20);
    if (k.item === 'turbo' && Math.abs(bend) < 0.2 || k.item === 'shield' || k.item === 'zap' && (ahead || G.lesson) || k.item === 'slick' && (behind || mem.it > 4 || G.lesson)) { if (useItem(G)) mem.it = 0; } }
}
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.count = 0; G.me.place = 1; G.me.done = true; finish(G); }
