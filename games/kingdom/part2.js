
// ===================== RULES: Kart Kingdom (game 76, his idea: "like Super Mario racing... turtles, flying, boosts... numerous
// race courses... like 10 games") =====================
// Eight karts, three laps, sixteen courses in four cups (then the cups again, faster: 50cc, 100cc, 150cc, MIRROR, 200cc...).
// The kart drives itself. Buttons (version 2, his feedback): ◀ ▶ under the left thumb; DRIFT (hold in a bend: sparks blue,
// orange, purple; let go for a boost; in the air a tap is a TRICK), ITEM (tap: thrown far ahead; swipe down: behind) and NITRO
// (fills from drifts, tricks and slipstreams) under the right. Hold DRIFT as the second light comes on for a ROCKET START (too
// early and you stall). Gold ramps open a GLIDER over a chasm; fly through the rings. Courses in the sky have low rails; only
// the chasm under the glider can be fallen into (the rescue bee brings you back).
// Each course has its own dangers: crabs, sheep, boulders, snowballs, traffic, cannonballs, gumdrops, ghosts, twisters, lava,
// meteors; mud and ice.
// World: metres; x across, z the other way, y up; a heading h points along (cos h, sin h).
const RULES = [
  'The kart drives itself. Hold <b>◀ ▶</b> (bottom left) to <b>steer</b>.',
  'In a bend, steer and <b>hold DRIFT</b>: sparks go blue, orange, purple. <b>Let go</b> for a <b>boost</b>.',
  'Drifts, tricks and slipstreams fill <b>NITRO</b>: tap it when it glows for a big boost.',
  'Drive through <b>? boxes</b>. <b>Tap ITEM</b> to throw it far <b>ahead</b>; <b>swipe it down</b> to throw it <b>behind</b>.',
  'Off a ramp or a hill, <b>tap DRIFT in the air</b> for a <b>trick</b>: land after it for a boost (mid-trick is a wipeout!).',
  '<b>Hold DRIFT</b> as the 2nd light comes on for a <b>rocket start</b>. Gold ramps open your <b>glider</b>: fly through the rings.',
  'Finish in the place the race asks for. Four races make a <b>cup</b>: collect the trophies!',
];
// the drivers (all ours): a head, a body colour, a little of their own in the kart
const DRIVERS = [
  { id: 'tobi', name: 'Tobi', kind: 'turtle', col: 0x4ac25a, col2: 0xffd84a, spd: 0, acc: 1, hnd: 1, stars: 0 },
  { id: 'rexy', name: 'Rexy', kind: 'dino', col: 0xff8a2a, col2: 0x5ad06a, spd: 1, acc: 0, hnd: 0, stars: 0 },
  { id: 'pengu', name: 'Pengu', kind: 'penguin', col: 0x2a3a6a, col2: 0xffffff, spd: 0, acc: 1, hnd: 1, stars: 0 },
  { id: 'mochi', name: 'Mochi', kind: 'cat', col: 0xff8ac8, col2: 0xffffff, spd: 0, acc: 2, hnd: 0, stars: 3 },
  { id: 'bruno', name: 'Bruno', kind: 'bear', col: 0x8a5a3a, col2: 0xffd0a0, spd: 2, acc: -1, hnd: 0, stars: 6 },
  { id: 'hopper', name: 'Hopper', kind: 'bunny', col: 0xb89aff, col2: 0xffffff, spd: 0, acc: 1, hnd: 2, stars: 10 },
  { id: 'kiki', name: 'Kiki', kind: 'fox', col: 0xff6a2a, col2: 0xfff0e0, spd: 1, acc: 1, hnd: 0, stars: 15 },
  { id: 'bolt', name: 'Bolt', kind: 'robot', col: 0xa8b8c8, col2: 0x3ae0ff, spd: 2, acc: 0, hnd: -1, stars: 22 },
  { id: 'zuko', name: 'Zuko', kind: 'dragon', col: 0x8a4ae8, col2: 0xffc040, spd: 2, acc: 0, hnd: 1, stars: 32 },
  { id: 'nova', name: 'Nova', kind: 'alien', col: 0x3ae8b0, col2: 0xff5ac8, spd: 1, acc: 2, hnd: 1, stars: 45 },
];
const KARTS = [
  { id: 'classic', name: 'Classic', body: 0, stars: 0, spd: 0, hnd: 0 }, { id: 'bubble', name: 'Bubble Buggy', body: 1, stars: 4, spd: -1, hnd: 2 },
  { id: 'wing', name: 'Sport Wing', body: 2, stars: 12, spd: 1, hnd: 1 }, { id: 'monster', name: 'Monster', body: 3, stars: 20, spd: 1, hnd: -1 },
  { id: 'jet', name: 'Jet Sled', body: 4, stars: 30, spd: 2, hnd: 0 }, { id: 'royal', name: 'Royal Gold', body: 5, stars: 50, spd: 2, hnd: 2 },
];
const CUPS = [{ name: 'Sprout Cup', icon: '🌱' }, { name: 'Blossom Cup', icon: '🌸' }, { name: 'Thunder Cup', icon: '⚡' }, { name: 'Star Cup', icon: '⭐' }];
const CLASSES = ['50cc', '100cc', '150cc', 'MIRROR', '200cc'];
// the sixteen courses: how they look, what is on them. edge 'void' = no walls (fall off and the bee fetches you); gap = a chasm
// under the glider jump; haz = the course's own dangers [kind, how many at the start .. how many later]
const TRACKS = [
  { name: 'Meadow Circuit', sky: 'noon', theme: 'meadow', seed: 11, R: 92, hills: 3, haz: [['sheep', 1, 3]] },
  { name: 'Coconut Beach', sky: 'morning', theme: 'beach', seed: 23, R: 100, hills: 1.5, haz: [['crab', 2, 5]], water: true },
  { name: 'Windmill Valley', sky: 'golden', theme: 'valley', seed: 37, R: 105, hills: 7, haz: [['sheep', 2, 4], ['mud', 1, 3]] },
  { name: 'Canyon Leap', sky: 'golden', theme: 'canyon', seed: 41, R: 110, hills: 5, gap: 'canyon', haz: [['boulder', 1, 4]] },
  { name: 'Blossom Way', sky: 'morning', theme: 'blossom', seed: 53, R: 98, hills: 4, haz: [['gumdrop', 0, 0], ['mud', 1, 2]], water: true },
  { name: 'Frost Peak', sky: 'overcast', theme: 'frost', seed: 67, R: 112, hills: 8, haz: [['snowball', 1, 4], ['ice', 1, 3]], snow: true },
  { name: 'Jungle Ruins', sky: 'mist', theme: 'jungle', seed: 71, R: 104, hills: 5, gap: 'river', haz: [['mud', 2, 4], ['boulder', 0, 2]] },
  { name: 'Neon City', sky: 'golden', theme: 'neon', seed: 83, R: 116, hills: 2, haz: [['car', 2, 5]] },
  { name: 'Pirate Cove', sky: 'golden', theme: 'pirate', seed: 97, R: 108, hills: 3, gap: 'sea', haz: [['cannon', 2, 5], ['crab', 1, 2]], water: true },
  { name: 'Candy Canyon', sky: 'noon', theme: 'candy', seed: 101, R: 100, hills: 6, haz: [['gumdrop', 2, 5]] },
  { name: 'Haunted Manor', sky: 'sunset', theme: 'haunt', seed: 113, R: 102, hills: 3, haz: [['ghost', 2, 5]], fog: true },
  { name: 'Desert Dunes', sky: 'noon', theme: 'desert', seed: 127, R: 118, hills: 6, haz: [['twister', 1, 3], ['boulder', 1, 2]] },
  { name: 'Lava Castle', sky: 'golden', theme: 'lava', seed: 131, R: 106, hills: 4, gap: 'lava', edge: 'void', haz: [['lava', 2, 5]] },
  { name: 'Sky Garden', sky: 'morning', theme: 'sky', seed: 149, R: 104, hills: 9, gap: 'cloud', edge: 'void', haz: [['gumdrop', 0, 2]] },
  { name: 'Moon Base', sky: 'night', theme: 'moon', seed: 157, R: 112, hills: 6, grav: 0.55, haz: [['meteor', 2, 5]] },
  { name: 'Star Ribbon', sky: 'night', theme: 'star', seed: 163, R: 120, hills: 10, gap: 'space', edge: 'void', haz: [['meteor', 0, 3]] },
];
const ITEMS = {
  shell: { name: 'Turtle Shell', icon: '🐢' }, homing: { name: 'Seeker Shell', icon: '🎯' }, triple: { name: '3 Shells', icon: '🐢³' },
  peel: { name: 'Banana Peel', icon: '🍌' }, pepper: { name: 'Turbo Pepper', icon: '🌶' }, pepper3: { name: '3 Peppers', icon: '🌶³' },
  star: { name: 'Rainbow Star', icon: '⭐' }, freeze: { name: 'Snow Flurry', icon: '❄' }, comet: { name: 'Comet', icon: '☄' },
  rocket: { name: 'Rocket Ride', icon: '🚀' }, bubble: { name: 'Bubble', icon: '🫧' },
};
const TRICKS = ['FLIP', 'SPIN', 'BARREL ROLL', 'TABLE TOP', 'CORKSCREW'];
const UPGRADES = [
  { id: 'engine', name: 'Engine', desc: 'A little more top speed.', max: 3, cost: l => 40 + l * 45 },
  { id: 'grip', name: 'Grippy tyres', desc: 'Corners without sliding wide; less slowed by grass.', max: 2, cost: l => 45 + l * 50 },
  { id: 'turbo', name: 'Turbo charger', desc: 'Drift sparks change colour sooner.', max: 2, cost: l => 50 + l * 50 },
  { id: 'magnet', name: 'Coin magnet', desc: 'Pull in coins from further away.', max: 1, cost: l => 60 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Rookie'], [50, 'Racer'], [160, 'Drifter'], [400, 'Pro'], [900, 'Champion'], [2000, 'Kart King']];
const hl = () => typeof HEADLESS !== 'undefined' && HEADLESS;
function myDriver() { if (hl()) return DRIVERS[0]; const id = store.get('driver', 'tobi'); return DRIVERS.find(q => q.id === id) || DRIVERS[0]; }
function myKart() { if (hl()) return KARTS[0]; const id = store.get('kart', 'classic'); return KARTS.find(q => q.id === id) || KARTS[0]; }
const PLACES = TRACKS.map(t => ({ name: t.name })), placeOf = N => (N - 1) % TRACKS.length;
const classOf = N => Math.min(CLASSES.length - 1, Math.floor((N - 1) / 16)), cupOf = N => Math.floor(((N - 1) % 16) / 4);
const TW = 14, VMAX = 28, GRIP = 32, GRAV = 20, TRICK = 0.38, VY = 8.6, VYBIG = 7.6, VOID = -60, NK = 8;
// ---------- the courses: built from a closed shape with hills, cut into even 1.5 m steps ----------
function trackOf(i, mirror) { const key = i + (mirror ? 100 : 0); trackOf.c = trackOf.c || {}; if (trackOf.c[key]) return trackOf.c[key];
  const info = TRACKS[i], R0 = rng(info.seed), base = info.R * 0.82, pts = [], M = 22, hs = [];
  const A = [0, 0, 0.12 + R0() * 0.12, 0.08 + R0() * 0.12, 0.05 + R0() * 0.08, 0.02 + R0() * 0.06, R0() * 0.04], P = A.map(() => R0() * TAU), sx = 1 + R0() * 0.35, sz = 1 + R0() * 0.2;
  const hp = [R0() * TAU, R0() * TAU, R0() * TAU];
  for (let j = 0; j < M; j++) { const a = j / M * TAU; let r = 1; for (let q = 2; q < A.length; q++) r += A[q] * Math.cos(q * a + P[q]); r = Math.max(0.55, r) * base;
    const y = info.hills * (0.55 * Math.sin(2 * a + hp[0]) + 0.35 * Math.sin(3 * a + hp[1]) + 0.2 * Math.sin(5 * a + hp[2])) + info.hills * 1.2;
    pts.push([Math.cos(a) * r * sx * (mirror ? -1 : 1), Math.sin(a) * r * sz, y]); }
  const T = { info, i, mirror: !!mirror }; build(T, pts, 1);
  // too tight a bend for a kart: grow the whole course until the tightest bend is a fair one
  // ...and far enough from itself everywhere (two stretches of road side by side need room for both, walls and all)
  for (let pass = 0, sc = 1; pass < 6; pass++) { let minR = 1e9, minD = 1e9; const S = T.S, n = S.length; for (const s2 of S) minR = Math.min(minR, T.ds / Math.max(1e-4, Math.abs(s2.dh)));
    for (let a = 0; a < n; a += 3) for (let b = a + 40; b < n; b += 3) { if (n - (b - a) < 40) continue; const d = Math.hypot(S[a].x - S[b].x, S[a].z - S[b].z); if (d < minD) minD = d; }
    const need = Math.max(14 / minR, 32 / minD); if (need <= 1.001) break; sc *= Math.min(1.5, need * 1.02); build(T, pts, sc); }
  features(T); trackOf.c[key] = T; return T; }
function build(T, P0, sc) { const P = P0.map(p => [p[0] * sc, p[1] * sc, p[2]]), n = P.length, raw = [];
  for (let j = 0; j < n; j++) { const p0 = P[(j - 1 + n) % n], p1 = P[j], p2 = P[(j + 1) % n], p3 = P[(j + 2) % n]; for (let q = 0; q < 30; q++) { const t = q / 30, t2 = t * t, t3 = t2 * t, cr = d => 0.5 * (2 * p1[d] + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t3); raw.push([cr(0), cr(1), cr(2)]); } }
  let L = 0; const cum = [0]; for (let j = 1; j <= raw.length; j++) { const a = raw[j - 1], b = raw[j % raw.length]; L += Math.hypot(b[0] - a[0], b[1] - a[1]); cum.push(L); }
  const m = Math.floor(L / 1.5), S = []; let k2 = 0; for (let q = 0; q < m; q++) { const d = q * L / m; while (cum[k2 + 1] < d) k2++; const a = raw[k2], b = raw[(k2 + 1) % raw.length], u = (d - cum[k2]) / Math.max(1e-6, cum[k2 + 1] - cum[k2]); S.push({ x: a[0] + (b[0] - a[0]) * u, z: a[1] + (b[1] - a[1]) * u, y: a[2] + (b[2] - a[2]) * u }); }
  const N = S.length; T.S = S; T.L = L; T.ds = L / m;
  for (let q = 0; q < N; q++) { const a = S[(q - 1 + N) % N], b = S[(q + 1) % N]; S[q].h = Math.atan2(b.z - a.z, b.x - a.x); S[q].slope = (b.y - a.y) / (2 * T.ds); }
  for (let q = 0; q < N; q++) { let dh = S[(q + 1) % N].h - S[q].h; S[q].dh = Math.atan2(Math.sin(dh), Math.cos(dh)); }
  for (let q = 0; q < N; q++) { let dh = S[(q + 6) % N].h - S[q].h; dh = Math.atan2(Math.sin(dh), Math.cos(dh)); S[q].curve = dh; S[q].bank = clamp(-dh * 1.1, -0.22, 0.22); } }
const gapW = (a, b, n) => Math.abs(((a - b + n + n / 2) % n) - n / 2);
// what is on a course: the gold glider ramp on its straightest long run (a chasm beyond it on some), trick ramps, boost pads,
// coins through the bends, rows of ? boxes, rings in the glider's air, and the course's dangers
function features(T) { const S = T.S, n = S.length, worst = (i, len) => { let m = 0; for (let q = 0; q < len; q++) m = Math.max(m, Math.abs(S[(i + q) % n].curve)); return m; };
  T.ramps = []; T.pads = []; T.coins = []; T.rows = []; T.rings = []; T.spots = []; const used = [], free = (i, w) => used.every(u => gapW(i, u, n) > w);
  // the glider: flat enough for the run-up, the flight and the landing (60 steps), not near the start line
  const big = []; for (let i = 30; i < n - 80; i += 2) { let dy = 0; for (let q = 0; q < 60; q++) dy = Math.max(dy, Math.abs(S[(i + q) % n].slope)); big.push({ i, w: worst(i, 60) + dy * 0.5 }); } big.sort((a, b) => a.w - b.w);
  const i0 = big[0].i; T.ramps.push({ i0, i1: (i0 + 4) % n, h: 2.6, big: true }); used.push(i0, (i0 + 30) % n);
  // level the ground round the glider so the arc, the rings and the landing all line up
  const yb = S[i0].y; for (let q = -6; q < 62; q++) { const s = S[(i0 + q + n) % n], u = q < 0 ? (q + 6) / 6 : q > 54 ? (62 - q) / 8 : 1; s.y = lerp(s.y, yb, clamp(u, 0, 1)); }
  for (let q = 0; q < n; q++) { const a = S[(q - 1 + n) % n], b = S[(q + 1) % n]; S[q].slope = (b.y - a.y) / (2 * T.ds); }
  if (T.info.gap) for (let q = 12; q < 34; q++) S[(i0 + 4 + q) % n].gap = true;
  for (let j = 0; j < 3; j++) { const d = (16 + j * 12) * T.ds, t = d / VMAX, g = GRAV * 0.32 * (T.info.grav || 1), y = 2.6 + VYBIG * t - g * t * t / 2; T.rings.push({ i: (i0 + 4 + 16 + j * 12) % n, lat: [0, -2.6, 2.4][j], y: Math.max(1.6, y + 0.5) }); }
  for (let j = 0; j < 6; j++) { const d = (10 + j * 6) * T.ds, t = d / VMAX, g = GRAV * 0.32 * (T.info.grav || 1), y = 2.6 + VYBIG * t - g * t * t / 2; T.coins.push({ i: (i0 + 4 + 10 + j * 6) % n, lat: Math.sin(j * 0.9) * 3, y: Math.max(1.2, y + 0.6), air: true }); }
  // trick ramps on other straight runs
  const small = []; for (let i = 20; i < n - 30; i += 2) small.push({ i, w: worst(i, 26) + Math.abs(S[i].slope) }); small.sort((a, b) => a.w - b.w);
  for (const c of small) { if (T.ramps.length >= 3) break; if (c.w > 0.22) break; if (free(c.i, n / 6)) { T.ramps.push({ i0: c.i, i1: (c.i + 4) % n, h: 1.5, big: false }); used.push(c.i); } }
  T.ramps.sort((a, b) => a.i0 - b.i0);
  for (const c of small) { if (T.pads.length >= 3) break; if (free(c.i, 30)) { T.pads.push({ i: c.i, lat: [2.8, -2.8, 0][T.pads.length] }); used.push(c.i); } }
  // rows of ? boxes, spread round the lap
  for (const f of [0.18, 0.5, 0.8]) { let i = Math.floor(f * n); for (let t = 0; t < 60 && !free(i, 22); t++) i = (i + 3) % n; T.rows.push(i); used.push(i); }
  // coins on the inside of the bends (a good line takes them)
  for (let i = 0; i < n; i++) if (Math.abs(S[i].curve) > 0.12 && free(i, 16) && T.coins.length < 40) { for (let j = 0; j < 4; j++) T.coins.push({ i: (i + j * 3) % n, lat: -Math.sign(S[i].curve) * 3.4, y: 0.7 }); used.push(i); }
  // places for dangers: away from the start, the ramps, the chasm and the boxes
  for (let i = 40; i < n - 10; i += 3) if (free(i, 14)) T.spots.push(i); }
// where a point is on the course: the nearest step (searched near the last one), how far across, how far along it
function locate(T, x, z, hint) { const S = T.S, n = S.length; let bd = 1e18, best = 0;
  if (hint != null) { let bq = 0; for (let q = -12; q <= 12; q++) { let i = hint + q; if (i < 0) i += n; else if (i >= n) i -= n; const p = S[i], dx = p.x - x, dz = p.z - z, d = dx * dx + dz * dz; if (d < bd) { bd = d; best = i; bq = q; } } if (bq === 12 || bq === -12) return locate(T, x, z, null); }
  else for (let i = 0; i < n; i++) { const dx = S[i].x - x, dz = S[i].z - z, d = dx * dx + dz * dz; if (d < bd) { bd = d; best = i; } }
  const p = S[best], c = Math.cos(p.h), s = Math.sin(p.h); return { i: best, lat: -(x - p.x) * s + (z - p.z) * c, along: (x - p.x) * c + (z - p.z) * s }; }
const roadY = (T, l) => T.S[l.i].y + T.S[l.i].slope * clamp(l.along, -0.8, 0.8);
function rampAt(T, l) { const n = T.S.length; for (const r of T.ramps) { const rel = ((l.i - r.i0) % n + n) % n + l.along / T.ds; if (rel >= 0 && rel < 4 && Math.abs(l.lat) < TW / 2 + 0.3) return { r, h: r.h * rel / 4, rel }; } return null; }
// the ground under a point: the road (with a ramp on it), the grass beside it, or nothing (a chasm, the edge of a course with no walls)
function groundAt(T, l) { const s = T.S[l.i], a = Math.abs(l.lat); if (s.gap && a < TW / 2 + 6) return VOID; if (T.info.edge === 'void' && a > TW / 2 + 1.0) return VOID; const y = roadY(T, l); const rp = rampAt(T, l); return y + (rp ? rp.h : 0) - (a > TW / 2 ? 0.04 : 0); }
function makeCfg(N, help) {
  const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), e = easyOf(N), cl = classOf(N), boss = N % 10 === 0;
  return { N, f, help: !!help, track: placeOf(N), cup: cupOf(N), cls: cl, mirror: cl === 3, boss, laps: N <= 2 ? 2 : 3,
    place: N <= 4 ? 4 : N <= 12 ? 3 : 2,
    skill: x(0.8, 1.07, 34) * (1 - 0.04 * e) * (help ? 0.96 : 1) * (boss ? 1.015 : 1), speedK: 1 + [0, 0.05, 0.1, 0.1, 0.16][cl],
    aiItems: x(0.35, 1, 30), aiTricks: x(0.5, 3, 30), aiDodge: x(0.5, 0.95, 30), aiDrift: x(0.3, 1, 30),
    hz: x(0, 1, 18), grav: TRACKS[placeOf(N)].grav || 1,
    vmax: VMAX * (1 + 0.025 * upLv('engine')), grip: 1 + 0.12 * upLv('grip'), spark: 1 + 0.2 * upLv('turbo'), nitroK: 1 + 0.15 * upLv('turbo'), magnet: 1.5 + 1.0 * upLv('magnet') }; }
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0, T = trackOf(cfg.track, cfg.mirror);
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, place: cfg.track, T,
    driver: o.driver || myDriver(), kart: o.kart || myKart(), karts: [], boxes: [], coinsT: [], shots: [], peels: [], lobs: [], hz: [], booms: [], steer: 0, steerT: 0, hold: false, count: 3.2, nitros: 0,
    tricks: 0, perfects: 0, wipeouts: 0, hits: 0, zaps: 0, coins: 0, boosts: 0, bigBoosts: 0, falls: 0, items: 0, rocket: 0, drafts: 0, rings: 0, best: 99 };
  grid(G); placeBoxes(G); placeCoins(G); placeHazards(G);
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else G.ev.push({ k: 'start' });
  return G; }
// the starting grid: two by two behind the line, you at the back of the field on the first levels, further up later
function grid(G) { const T = G.T, S = T.S, n = S.length; G.karts = []; const mine = G.driver.id;
  const slot = q => { const i = ((n - 5 - Math.floor(q / 2) * 5) % n + n) % n, p = S[i], col = q % 2 ? 2.8 : -2.8; return { x: p.x - Math.sin(p.h) * col, z: p.z + Math.cos(p.h) * col, h: p.h, i }; };
  const R = G.rnd, pool = DRIVERS.filter(d => d.id !== mine).slice(0, NK - 1); for (let i = pool.length - 1; i > 0; i--) { const j = (R() * (i + 1)) | 0; [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const mySlot = G.lesson ? 0 : clamp(7 - Math.floor(G.N / 6), 3, 7);
  if (G.lesson) { const s = slot(0); G.me = newKart(G, s, G.driver, true, 9); G.karts.push(G.me); }
  else { let q2 = 0; for (let q = 0; q < NK; q++) { const s = slot(q); if (q === mySlot) { G.me = newKart(G, s, G.driver, true, 9); G.karts.push(G.me); } else G.karts.push(newKart(G, s, pool[q2++], false, q)); } }
  for (const k of G.karts) { k.lap = 0; k.prog = -((n - k.i) % n) * T.ds; k.last = k.i; const l = locate(T, k.x, k.z, k.i); k.y = roadY(T, l); } }
function newKart(G, s, who, me, q) { const R = G.rnd; return { me, who, x: s.x, z: s.z, y: 0, vy: 0, air: false, glide: false, ramp: null, trick: null, airTricks: 0, h: s.h, v: 0, i: s.i, last: s.i, lap: 0, prog: 0,
  steer: 0, drift: 0, hardT: 0, charge: 0, tier: 0, slip: 0, nitro: 0, nitroT: 0, hopT: 0, wantDrift: 0, boost: 0, spin: 0, shield: 0, star: 0, rocket: 0, coin: 0, item: null, roul: 0, orbit: 0, peppers: 0, itemT: 0, fall: 0, draftT: 0, mud: 0, ice: 0,
  line: (R() - 0.5) * 5, skill: me ? 1 : 1 + (q - 3.5) * 0.008 + (R() - 0.5) * 0.02, done: false, place: 0, fin: 0, lane: R() * 6, plan: 0, dodge: 0 }; }
function placeBoxes(G) { const S = G.T.S; G.boxes = []; for (const i of G.T.rows) { const p = S[i]; for (const c of [-4.5, -1.5, 1.5, 4.5]) G.boxes.push({ x: p.x - Math.sin(p.h) * c, z: p.z + Math.cos(p.h) * c, y: p.y + 1, t: 0 }); } }
function placeCoins(G) { const S = G.T.S; G.coinsT = G.T.coins.map(c => { const p = S[c.i]; return { x: p.x - Math.sin(p.h) * c.lat, z: p.z + Math.cos(p.h) * c.lat, y: p.y + c.y, air: !!c.air, t: 0 }; });
  G.ringsT = G.T.rings.map(r => { const p = S[r.i]; return { x: p.x - Math.sin(p.h) * r.lat, z: p.z + Math.cos(p.h) * r.lat, y: p.y + r.y, h: p.h, t: 0 }; }); }
// the course's dangers: how many grows with the level
function placeHazards(G) { const T = G.T, R = G.rnd, c = G.cfg; G.hz = []; if (G.lesson) return; const spots = T.spots.slice(); for (let i = spots.length - 1; i > 0; i--) { const j = (R() * (i + 1)) | 0; [spots[i], spots[j]] = [spots[j], spots[i]]; }
  let si = 0; for (const [kind, a, b] of T.info.haz) { const cnt = Math.round(a + (b - a) * c.hz); for (let q = 0; q < cnt && si < spots.length; q++) { const i = spots[si++]; G.hz.push(newHaz(G, kind, i, R)); } } }
function newHaz(G, kind, i, R) { const base = { kind, i, ph: R() * TAU, x: 0, z: 0, y: 0, r: 1, act: true, warn: 0 };
  const D = { sheep: { r: 1.0, per: 7, span: TW / 2 + 2 }, crab: { r: 0.8, per: 4.5, span: TW / 2 + 1 }, boulder: { r: 1.7, per: 6, span: TW / 2 + 4 }, snowball: { r: 1.4, per: 5, span: TW / 2 + 4 }, ghost: { r: 1.1, per: 5.5, span: TW / 2 }, twister: { r: 2.0, per: 9, span: TW / 2 - 1 },
    gumdrop: { r: 1.3, per: 1.6 }, cannon: { r: 2.4, per: 5.5 }, lava: { r: 2.3, per: 4.8 }, meteor: { r: 2.4, per: 6.5 }, mud: { r: 2.8 }, ice: { r: 3.4 }, car: { r: 1.5 } }[kind] || {};
  Object.assign(base, D, { lat: (R() - 0.5) * (TW - 4) }); if (kind === 'car') { base.lat = [-3.5, 0, 3.5][(R() * 3) | 0]; base.sp = 11 + R() * 4; base.pos = i * G.T.ds; }
  if (kind === 'mud' || kind === 'ice') base.lat = (R() - 0.5) * (TW - 6); return base; }
function hazStep(G, dt) { const T = G.T, S = T.S, n = S.length, t = G.t;
  for (const h of G.hz) { let lat = h.lat, i = h.i; h.act = true; h.warn = 0; h.y = 0;
    if (h.span) { lat = h.span * Math.sin(t * TAU / h.per + h.ph); if (h.kind === 'twister') lat = h.span * Math.sin(t * TAU / h.per + h.ph) * Math.cos(t * 0.7 + h.ph); }
    if (h.kind === 'gumdrop') { h.y = Math.abs(Math.sin(t * Math.PI / h.per + h.ph)) * 3.2; h.act = h.y < 1.3; }
    if (h.kind === 'cannon' || h.kind === 'lava' || h.kind === 'meteor') { const u = ((t + h.ph * h.per / TAU) % h.per) / h.per; h.act = u > 0.72 && u < 0.84; h.warn = u > 0.42 && u <= 0.72 ? (u - 0.42) / 0.3 : 0; h.blast = u > 0.72 ? (u - 0.72) / 0.28 : 0; if (u > 0.72 && !h.fired) { h.fired = true; G.booms.push({ x: h.x, z: h.z, y: S[h.i].y, kind: h.kind, t: 0 }); } if (u < 0.5) h.fired = false; }
    if (h.kind === 'car') { h.pos = (h.pos + h.sp * dt) % T.L; i = Math.floor(h.pos / T.ds) % n; h.i = i; }
    const p = S[i]; h.x = p.x - Math.sin(p.h) * lat; h.z = p.z + Math.cos(p.h) * lat; h.gy = p.y; h.h = p.h; h.latNow = lat; }
  for (let q = G.booms.length - 1; q >= 0; q--) { G.booms[q].t += dt; if (G.booms[q].t > 1.2) G.booms.splice(q, 1); } }
// ---------- your thumbs: buttons, like the best phone kart racers (his words, 20 Nov 2026: "I don't like the controls...
// give at least two buttons... one for boost") ----------
// LEFT thumb: two big arrow buttons, ◀ and ▶ (hold to turn; the turn comes on fast but smoothly). RIGHT thumb: DRIFT (hold
// it in a bend with an arrow: the kart hops and slides, sparks build; let go for a boost; in the air it does a trick), ITEM
// (tap: thrown far AHEAD; swipe it down: thrown BEHIND) and NITRO (fills from drifts, tricks and slipstreams; tap to fire).
function setSteer(G, s) { G.steerT = clamp(s, -1, 1); }      // where the steering is heading (the buttons, or a robot)
function setBtn(G, b, on) { if (b === 'L') G.bL = !!on; if (b === 'R') G.bR = !!on; G.steerT = (G.bR ? 1 : 0) - (G.bL ? 1 : 0); }
// the right-hand buttons held down before the start: the engine revs (a rocket start on the second light)
function setHold(G, on) { if (on && G.count > 0 && !G.hold) G.holdAt = G.count; G.hold = !!on; }
function driftDown(G) { const k = G.me; G.driftBtn = true; if (G.count > 0) { setHold(G, true); return false; } if (G.over || k.done || G.wait > 0 || k.fall > 0) return false;
  if (k.air) return startTrick(G, k);
  if (k.spin > 0 || k.rocket > 0) return false; k.hopT = 0.16; G.ev.push({ k: 'hop' });
  if (Math.abs(G.steer) > 0.25 && k.v > 11) { startDrift(G, k, Math.sign(G.steer)); } else { k.wantDrift = 0.3; if (G.lesson) lessonMiss(G, 'ground'); } return true; }
function driftUp(G) { G.driftBtn = false; if (G.count > 0) { setHold(G, false); return; } const k = G.me; k.wantDrift = 0; if (k.drift) endDrift(G, k); }
function startDrift(G, k, dir) { k.drift = dir; k.charge = 0; k.tier = 0; k.wantDrift = 0; if (k.me) G.ev.push({ k: 'drift' }); }
function endDrift(G, k) { if (k.tier && !k.spin) { k.boost = Math.max(k.boost, [0, 0.6, 1.1, 1.7][k.tier]); addNitro(G, k, [0, 0.12, 0.25, 0.4][k.tier]); if (k.me) { G.boosts++; if (k.tier >= 2) G.bigBoosts++; G.ev.push({ k: 'boost', tier: k.tier }); lessonSee(G, 'boost', k.tier); } } k.drift = 0; k.charge = 0; k.tier = 0; }
function addNitro(G, k, a) { const was = Math.floor(k.nitro || 0); k.nitro = Math.min(2, (k.nitro || 0) + a * (k.me ? G.cfg.nitroK : 1)); if (k.me && Math.floor(k.nitro) > was) G.ev.push({ k: 'nitroready', n: Math.floor(k.nitro) }); }
function useNitro(G, k = G.me) { if (G.over || k.done || G.count > 0 || k.fall > 0 || (k.nitro || 0) < 1) return false; k.nitro -= 1; k.nitroT = 1.7; k.boost = Math.max(k.boost, 1.7); if (k.me) { G.nitros = (G.nitros | 0) + 1; G.ev.push({ k: 'nitro' }); lessonSee(G, 'nitro'); } return true; }
function itemTap(G, back) { const k = G.me; if (G.count > 0) { setHold(G, true); return false; } if (G.over || k.done || G.wait > 0 || k.fall > 0) return false;
  if (k.air && !k.item && !k.orbit && !k.peppers) return startTrick(G, k);
  return useItem(G, k, back ? -1 : 1); }
// the old one-button way (kept for the robots' blind thumbs and the tests): in the air a trick, on the ground the item
function tapRight(G) { const k = G.me; if (G.over || k.done || G.wait > 0 || k.fall > 0 || G.count > 0) return false; if (k.air) return startTrick(G, k); return useItem(G); }
function startTrick(G, k) { if (!k.air || k.spin > 0 || k.fall > 0 || k.rocket > 0) return false; if (k.trick) return false;      /* a tap during a trick does nothing (no queue) */
  k.trick = { t: 0, kind: k.me ? (G.tricks + k.airTricks) % TRICKS.length : (G.rnd() * 3) | 0 }; k.airTricks++; if (k.me) G.ev.push({ k: 'trick', n: k.airTricks, kind: k.trick.kind }); return true; }
const race = k => k.lap * 1e5 + k.prog;
// dir +1: thrown ahead (the default), -1: behind
function useItem(G, k = G.me, dir = 1) { if (G.over || k.done || G.count > 0 || k.fall > 0) return false;
  if (k.peppers > 0) { k.peppers--; k.boost = Math.max(k.boost, 1.3); G.ev.push({ k: 'use', it: 'pepper', me: k.me, x: k.x, z: k.z }); return true; }
  if (k.orbit > 0) { k.orbit--; fire(G, k, 'shell', dir); G.ev.push({ k: 'use', it: 'shell', me: k.me, x: k.x, z: k.z, back: dir < 0 }); if (k.me) lessonSee(G, 'use', 'shell'); return true; }
  if (!k.item || k.roul > 0) return false; const it = k.item; k.item = null; if (k.me) G.items++;
  if (it === 'pepper') k.boost = Math.max(k.boost, 1.4);
  if (it === 'pepper3') { k.peppers = 2; k.boost = Math.max(k.boost, 1.3); }
  if (it === 'triple') { k.orbit = 3; }
  if (it === 'shell' || it === 'homing') fire(G, k, it, it === 'homing' ? 1 : dir);
  if (it === 'comet') { const lead = G.karts.find(o => o.place === 1 && o !== k && !o.done); if (lead) G.shots.push({ kind: 'comet', x: k.x, z: k.z, y: k.y + 3, i: k.i, h: k.h, tgt: lead, by: k, t: 0 }); }
  if (it === 'peel') lob(G, k, dir);
  if (it === 'star') k.star = 6;
  if (it === 'rocket') k.rocket = 3.6;
  if (it === 'bubble') k.shield = 9;
  if (it === 'freeze') { for (const o of G.karts) if (o !== k && race(o) > race(k) && !o.done) hit(G, o, 'freeze', k, 0.8); G.ev.push({ k: 'freeze', me: k.me }); }
  if (dir < 0) k.lookBack = 0.8; G.ev.push({ k: 'use', it, me: k.me, x: k.x, z: k.z, back: dir < 0 }); if (k.me) lessonSee(G, 'use', it); return true; }
function fire(G, k, kind, dir = 1) { const ahead = kind === 'homing' ? G.karts.filter(o => o !== k && !o.done && race(o) > race(k)).sort((a, b) => race(a) - race(b))[0] : null, h = dir < 0 ? k.h + Math.PI : k.h;
  G.shots.push({ kind, x: k.x + Math.cos(h) * 2.4, z: k.z + Math.sin(h) * 2.4, y: k.y, i: k.i, h, tgt: ahead || null, by: k, t: 0, me: k.me }); }
// a banana peel goes like a slingshot: high and far ahead along the road (about 40 m, you see it fly and land), or a short toss
// behind. It lands where it lands, a hazard for anyone (its thrower is safe from it for a few seconds)
function lob(G, k, dir) { const T = G.T, S = T.S, n = S.length, far = dir > 0 ? 27 : 7, ahead = (k.i + dir * Math.round((dir > 0 ? 40 : 6) / T.ds) + n) % n, p = S[ahead], lat = clamp(k.lat || 0, -TW / 2 + 1.5, TW / 2 - 1.5);
  const tx = p.x - Math.sin(p.h) * lat, tz = p.z + Math.cos(p.h) * lat, d = Math.hypot(tx - k.x, tz - k.z), tf = d / far + (dir > 0 ? 0 : 0.25);
  G.lobs.push({ x: k.x, z: k.z, y: k.y + 1.2, vx: (tx - k.x) / tf, vz: (tz - k.z) / tf, vy: (p.y + 0.1 - k.y - 1.2) / tf + 0.5 * GRAV * tf, by: k, t: 0, tf, tx, tz, ty: p.y }); }
// the item box's roulette: what you get depends on where you are (the leader gets defence, the back gets catch-up)
const ODDS = { //        lead   middle  back
  shell: [30, 16, 4], homing: [0, 16, 14], triple: [10, 10, 6], peel: [30, 10, 2], pepper: [16, 16, 12], pepper3: [0, 10, 18],
  star: [0, 4, 14], freeze: [0, 4, 10], comet: [0, 1, 4], rocket: [0, 0, 12], bubble: [14, 8, 2] };
function pickItem(G, k) { const R = G.rnd, n = G.karts.length, u = clamp(((k.place || n) - 1) / (n - 1), 0, 1);
  if (G.lesson) return lessonNow(G).id === 'item' ? 'triple' : 'pepper';
  let tot = 0; const w = {}; for (const id in ODDS) { const o = ODDS[id], v = u < 0.5 ? lerp(o[0], o[1], u * 2) : lerp(o[1], o[2], (u - 0.5) * 2); w[id] = id === 'comet' && G.shots.some(s => s.kind === 'comet') ? 0 : v; tot += w[id]; }
  let r = R() * tot; for (const id in w) { r -= w[id]; if (r <= 0) return id; } return 'pepper'; }
// something hits a kart: a star or a rocket shrugs it off, a bubble pops, three orbiting shells take it; else a spin
function hit(G, k, why, by, len = 1.1) { if (k.star > 0 || k.rocket > 0 || k.fall > 0) return false; if (k.shield > 0) { k.shield = 0; G.ev.push({ k: 'pop', me: k.me, x: k.x, z: k.z }); return false; }
  if (k.orbit > 0 && (why === 'shell' || why === 'homing')) { k.orbit--; G.ev.push({ k: 'block', me: k.me }); return false; } if (k.spin > 0) return false;
  k.spin = len; k.drift = 0; k.charge = 0; k.tier = 0; k.boost = 0; k.trick = null; const lost = Math.min(why === 'freeze' ? 1 : 3, k.coin); k.coin -= lost;
  G.ev.push({ k: 'spin', me: k.me, why, x: k.x, z: k.z, y: k.y, lost }); if (k.me) { G.hits++; lessonMiss(G, why); } if (by && by.me && !k.me) { G.zaps++; G.ev.push({ k: 'gotem', x: k.x, z: k.z, y: k.y, why, who: k.who.name }); if (G.lesson) lessonSee(G, 'hitR', why); } return true; }
// ---------- the race, step by step ----------
function step(G, dt) {
  if (G.over || !(dt > 0)) return; G.t += dt; const c = G.cfg, T = G.T, S = T.S, n = S.length, R = G.rnd;
  if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0 && G.lessonEnd) { G.lessonEnd = false; Object.assign(G, { shots: [], peels: [], lobs: [], nitros: 0, count: 3.2, tricks: 0, perfects: 0, wipeouts: 0, hits: 0, zaps: 0, coins: 0, boosts: 0, bigBoosts: 0, falls: 0, items: 0, rings: 0, rocket: 0, drafts: 0 }); grid(G); placeBoxes(G); placeCoins(G); placeHazards(G); G.ev.push({ k: 'start' }); } if (G.wait > 0) return; }
  hazStep(G, dt);
  // the shell lesson: a slow kart that falls behind you comes round again ahead (there is always one to aim at)
  if (G.lesson && lessonNow(G).id === 'item') for (const d of G.karts) if (d.dummy && race(d) < race(G.me) - 12 && d.spin <= 0) { const S = G.T.S, n = S.length, j = (G.me.i + 55) % n, p = S[j], lat = [-3, 3, 0, -1.5, 1.5][(G.rnd() * 5) | 0]; d.x = p.x - Math.sin(p.h) * lat; d.z = p.z + Math.cos(p.h) * lat; d.h = p.h; d.i = d.last = j; d.y = p.y; d.vy = 0; d.air = false; d.line = lat; d.prog = G.me.prog + 55 * G.T.ds; d.lap = G.me.lap; d.v = 12; }
  if (G.count > 0) { const was = Math.ceil(G.count); G.count -= dt; if (Math.ceil(G.count) !== was && G.count > 0) G.ev.push({ k: 'light', n: Math.ceil(G.count) }); if (G.count <= 0) go(G); else return; }
  { const tg = G.steerT || 0, back = Math.abs(tg) < Math.abs(G.steer) || tg * G.steer < 0, r = (back ? 9 : 6.5) * dt; G.steer = clamp(G.steer + clamp(tg - G.steer, -r, r), -1, 1); }
  for (const k of G.karts) { if (!k.me && !k.done) ai(G, k, dt); drive(G, k, dt); }
  for (let q = G.lobs.length - 1; q >= 0; q--) { const o = G.lobs[q]; o.t += dt; o.x += o.vx * dt; o.z += o.vz * dt; o.vy -= GRAV * dt; o.y += o.vy * dt;
    if (o.t >= o.tf || (o.vy < 0 && o.y <= o.ty)) { G.lobs.splice(q, 1); const l = locate(T, o.x, o.z, null), gy = groundAt(T, l); if (gy > VOID + 1) { G.peels.push({ x: o.x, z: o.z, y: gy, by: o.by, t: 0 }); G.ev.push({ k: 'peelland', x: o.x, z: o.z, y: gy, me: o.by.me }); } } }
  // karts bump each other; a STAR or a ROCKET knocks the other flying
  for (let a = 0; a < G.karts.length; a++) for (let b = a + 1; b < G.karts.length; b++) { const p = G.karts[a], q = G.karts[b]; if (p.fall > 0 || q.fall > 0 || Math.abs(p.y - q.y) > 1.3) continue; const dx = q.x - p.x, dz = q.z - p.z, d2 = dx * dx + dz * dz; if (d2 >= 4) continue; const d = Math.sqrt(d2);
    if (d < 2.0 && d > 1e-4) { const pa = p.star > 0 || p.rocket > 0, qa = q.star > 0 || q.rocket > 0; if (pa && !qa) hit(G, q, 'star', p); else if (qa && !pa) hit(G, p, 'star', q);
      const ux = dx / d, uz = dz / d, o = (2.0 - d) / 2; p.x -= ux * o; p.z -= uz * o; q.x += ux * o; q.z += uz * o; if ((p.me || q.me) && !G.bumpT) { G.bumpT = 0.4; G.ev.push({ k: 'bump' }); } } }
  G.bumpT = Math.max(0, (G.bumpT || 0) - dt);
  for (const b of G.boxes) { if (b.t > 0) { b.t -= dt; continue; } for (const k of G.karts) if (Math.abs(k.x - b.x) < 1.8 && k.fall <= 0 && (k.x - b.x) ** 2 + (k.z - b.z) ** 2 < 3.24 && Math.abs(k.y + 0.6 - b.y) < 1.8) { b.t = 2.5; if (!k.dummy && !k.item && !k.roul && !k.orbit && !k.peppers) { k.roul = k.me ? 1.1 : 0.6; k.itemT = 0.8 + R() * 2.5; if (k.me) G.ev.push({ k: 'box' }); } if (k.me) G.ev.push({ k: 'boxhit', x: b.x, z: b.z, y: b.y }); break; } }
  for (const k of G.karts) if (k.roul > 0) { k.roul -= dt; if (k.roul <= 0) { k.roul = 0; k.item = pickItem(G, k); if (k.me) G.ev.push({ k: 'item', it: k.item }); } }
  for (const cn of G.coinsT) { if (cn.t > 0) { cn.t -= dt; continue; } for (const k of G.karts) { const rr = k.me ? c.magnet : 1.5, dx = k.x - cn.x; if (dx > rr || dx < -rr) continue; const dz = k.z - cn.z; if (dx * dx + dz * dz < rr * rr && Math.abs((k.y + 0.6) - cn.y) < (cn.air ? 1.9 : 1.5)) { cn.t = cn.air ? 999 : 9; if (k.coin < 10) k.coin++; if (k.me) { G.coins++; G.ev.push({ k: 'coin', n: k.coin, air: cn.air }); } break; } } }
  for (const rg of G.ringsT) { if (!rg.by) rg.by = []; for (const k of G.karts) if (k.air && k.glide && (k.x - rg.x) ** 2 + (k.z - rg.z) ** 2 < 6.76 && Math.abs(k.y + 0.6 - rg.y) < 2.4 && rg.by.indexOf(k) < 0) { rg.by.push(k); k.ringN = (k.ringN || 0) + 1; if (k.me) { G.rings++; G.ev.push({ k: 'ring', n: k.ringN }); } } }
  // peels: a spin for whoever drives over one (not its owner in its first moment)
  for (let i = G.peels.length - 1; i >= 0; i--) { const s = G.peels[i]; s.t += dt; if (s.t > 40) { G.peels.splice(i, 1); continue; } for (const k of G.karts) if (!k.air && k.fall <= 0 && (k.x - s.x) ** 2 + (k.z - s.z) ** 2 < 2.25 && !(s.by === k && s.t < 3)) { G.peels.splice(i, 1); hit(G, k, 'peel', s.by); break; } }
  shotsStep(G, dt);
  // the dangers of the course
  for (const h of G.hz) { if (!h.act) continue; const rr = (h.r + 0.9) ** 2; for (const k of G.karts) { if (k.fall > 0 || k.air && h.kind !== 'gumdrop' && h.kind !== 'car') continue; if ((k.x - h.x) ** 2 + (k.z - h.z) ** 2 > rr) continue;
      if (h.kind === 'mud') { k.mud = 0.2; continue; } if (h.kind === 'ice') { k.ice = 0.25; continue; } if (k.y - (h.gy || 0) > 1.6 && h.kind !== 'gumdrop') continue;
      if (hit(G, k, h.kind, null, h.kind === 'boulder' || h.kind === 'cannon' || h.kind === 'meteor' || h.kind === 'lava' ? 1.4 : 1.1) && k.me) G.ev.push({ k: 'haz', kind: h.kind }); } }
  G.ordT = (G.ordT || 0) - dt; if (G.ordT <= 0) { G.ordT = 0.1; const order = G.karts.slice().sort((a, b) => (b.done ? 1e9 - b.fin : race(b)) - (a.done ? 1e9 - a.fin : race(a))); order.forEach((k, q) => k.place = q + 1); }
  if (!G.lesson && !G.over) { G.best = Math.min(G.best, G.me.place); if (G.me.done) finish(G);
    // the places you needed are all taken: the race is over for you (no long drive round on your own)
    else if (G.doneN >= c.place) { G.me.place = Math.max(G.me.place, c.place + 1); G.full = true; finish(G); } }
}
// the lights go out: a rocket start for whoever held at the right moment (the second light), a stall for too early
function go(G) { G.ev.push({ k: 'go' }); const me = G.me;
  if (G.hold && G.holdAt != null) { if (G.holdAt <= 2.05 && G.holdAt > 0.9) { me.boost = 1.3; me.v = VMAX * 0.6; G.rocket = 1; G.ev.push({ k: 'rocket' }); } else if (G.holdAt > 2.05) { me.spin = 0.9; G.ev.push({ k: 'stall' }); } }
  for (const k of G.karts) if (!k.me && G.rnd() < 0.25 + G.cfg.skill * 0.3) { k.boost = 0.9; k.v = VMAX * 0.5; } }
function shotsStep(G, dt) { const T = G.T, S = T.S, n = S.length;
  for (let q = G.shots.length - 1; q >= 0; q--) { const o = G.shots[q]; o.t += dt; let dead = false;
    if (o.kind === 'comet') { const tg = o.tgt; if (!tg || tg.done) { G.shots.splice(q, 1); continue; } o.i = (o.i + 3) % n; const fol = o.t < 1.2 ? S[o.i] : tg, dx = fol.x - o.x, dz = fol.z - o.z, d = Math.hypot(dx, dz) || 1, sp = 62 * dt;
      o.x += dx / d * Math.min(sp, d); o.z += dz / d * Math.min(sp, d); o.y = lerp(o.y, (tg.y || 0) + (o.t < 1.2 ? 6 : 1), dt * 3); o.i = locate(T, o.x, o.z, o.i).i;
      if (Math.hypot(tg.x - o.x, tg.z - o.z) < 2.5 && o.t > 0.5) { G.shots.splice(q, 1); G.booms.push({ x: tg.x, z: tg.z, y: tg.y, kind: 'comet', t: 0 }); for (const k of G.karts) if (Math.hypot(k.x - tg.x, k.z - tg.z) < 4) hit(G, k, 'comet', o.by, 1.6); } if (o.t > 12) G.shots.splice(q, 1); continue; }
    const sp = (o.kind === 'homing' ? 44 : 48) * dt, tg = o.tgt && !o.tgt.done && o.tgt.fall <= 0 ? o.tgt : null;
    if (o.kind === 'homing' && tg) { let tx, tz; if (Math.hypot(tg.x - o.x, tg.z - o.z) < 22 && o.t > 0.25) { tx = tg.x; tz = tg.z; } else { const p = S[(o.i + 4) % n]; tx = p.x; tz = p.z; } const want = Math.atan2(tz - o.z, tx - o.x); let dh = want - o.h; dh = Math.atan2(Math.sin(dh), Math.cos(dh)); o.h += clamp(dh, -7 * dt, 7 * dt); }
    o.x += Math.cos(o.h) * sp; o.z += Math.sin(o.h) * sp; const l = locate(T, o.x, o.z, o.i); o.i = l.i; const gy = groundAt(T, l);
    if (gy <= VOID + 1) dead = true; else o.y = gy;
    // the walls: a shell bounces back off them (a few times)
    const lim = T.info.edge === 'void' ? TW / 2 + 0.8 : TW / 2 + 3.0; if (!dead && Math.abs(l.lat) > lim && !S[l.i].gap) { const p = S[l.i]; o.h = 2 * p.h - o.h; const s2 = Math.sign(l.lat), back = Math.abs(l.lat) - lim + 0.2; o.x += Math.sin(p.h) * s2 * back; o.z -= Math.cos(p.h) * s2 * back; o.b = (o.b || 0) + 1; if (o.b > 4) dead = true; }
    if (!dead) for (const k of G.karts) { if (k.fall > 0 || (k === o.by && o.t < 0.35)) continue; if (Math.hypot(k.x - o.x, k.z - o.z) < 1.7 && Math.abs(k.y - o.y) < 1.6) { hit(G, k, o.kind, o.by); dead = true; break; } }
    if (!dead) for (let j = G.peels.length - 1; j >= 0; j--) if (Math.hypot(G.peels[j].x - o.x, G.peels[j].z - o.z) < 1.4) { G.peels.splice(j, 1); dead = true; G.ev.push({ k: 'clash', x: o.x, z: o.z, y: o.y }); break; }
    if (!dead) for (let j = 0; j < G.shots.length; j++) { const p2 = G.shots[j]; if (p2 !== o && p2.kind !== 'comet' && Math.hypot(p2.x - o.x, p2.z - o.z) < 1.2) { G.shots.splice(Math.max(j, q), 1); G.shots.splice(Math.min(j, q), 1); q--; dead = 'both'; G.ev.push({ k: 'clash', x: o.x, z: o.z, y: o.y }); break; } }
    if (dead === 'both') continue; if (dead || o.t > 6) G.shots.splice(q, 1); } }
// one kart: speed, steering, the drift and its sparks, hills, ramps and the air, tricks and landings, grass, walls and edges, laps
const KW = 0.9;      // half a kart's width (its wheels): where its side meets a rail
function drive(G, k, dt) { const c = G.cfg, T = G.T, S = T.S, n = S.length, me = k.me;
  const st = me ? G.steer : k.steer, go2 = !k.done || !me, grip = me ? c.grip : 1;
  k.boost = Math.max(0, k.boost - dt); k.shield = Math.max(0, k.shield - dt); k.spin = Math.max(0, k.spin - dt); k.mud = Math.max(0, k.mud - dt); k.ice = Math.max(0, k.ice - dt);
  if (k.star > 0) { k.star -= dt; if (k.star <= 0 && me) G.ev.push({ k: 'starend' }); } if (k.rocket > 0) { k.rocket -= dt; if (k.rocket <= 0 && me) G.ev.push({ k: 'rocketend' }); }
  // fallen off: the rescue bee brings you back onto the road a moment later
  if (k.fall > 0) { k.fall -= dt; k.vy -= GRAV * dt; k.y += k.vy * dt; k.v *= 1 - 0.15 * dt; k.x += Math.cos(k.h + k.slip) * k.v * dt; k.z += Math.sin(k.h + k.slip) * k.v * dt; if (k.fall <= 0) rescue(G, k); return; }      // 23 Nov 2026: a kart that goes over keeps flying on and falls faster and faster (it used to stop dead in the air and sink at a steady speed); the view goes dark before the bee brings it back
  const loc = locate(T, k.x, k.z, k.i), off = !k.air && Math.abs(loc.lat) > TW / 2;
  const stat = me ? (G.driver.spd + G.kart.spd) * 0.006 : 0;
  const top = (me ? c.vmax * (1 + stat) : VMAX * c.skill * k.skill * (k.rubber || 1)) * c.speedK * (1 + 0.012 * k.coin) * (k.boost > 0 ? 1.34 : 1) * (k.star > 0 ? 1.25 : 1) * (k.rocket > 0 ? 1.5 : 1) * (k.nitroT > 0 ? 1.1 : 1)
    * (off && k.boost <= 0 && k.star <= 0 && k.rocket <= 0 ? (me ? 0.5 + 0.08 * upLv('grip') : 0.55) : 1) * (k.mud > 0 && k.boost <= 0 && k.star <= 0 ? 0.55 : 1) * (k.spin > 0 ? 0.25 : 1) * (go2 ? 1 : 0.6);
  const accel = me ? 0.9 + G.driver.acc * 0.08 : 0.9; if (!k.air) k.v += (top - k.v) * Math.min(1, dt * (k.v < top ? accel : 2.5));
  // the drift (the DRIFT button held in a bend): sparks build, faster when you steer into it; let go for a boost; it fills NITRO
  k.hopT = Math.max(0, (k.hopT || 0) - dt); k.nitroT = Math.max(0, (k.nitroT || 0) - dt);
  if (me && k.rocket <= 0) { if (k.wantDrift > 0) { k.wantDrift -= dt; if (G.driftBtn && Math.abs(st) > 0.25 && k.v > 11 && !k.air && !k.spin) startDrift(G, k, Math.sign(st)); }
    if (k.drift) { const u = st * k.drift; k.charge += dt * c.spark * (u > 0.2 ? 1 : u > -0.2 ? 0.6 : 0.3); addNitro(G, k, dt * 0.05 * (k.tier + 1)); const tier = k.charge > 2.1 ? 3 : k.charge > 1.25 ? 2 : k.charge > 0.55 ? 1 : 0; if (tier !== k.tier) { k.tier = tier; if (tier) G.ev.push({ k: 'spark', tier }); }
      if (!G.driftBtn || k.v < 9 || k.spin) endDrift(G, k); } }
  // steering: without a drift a hard turn at speed runs wide and scrubs speed; a drift turns hard and keeps it; ice slides
  const sp = Math.min(1, k.v / 12), hnd = me ? 1 + (G.driver.hnd + G.kart.hnd) * 0.03 : 1; let yaw;
  if (k.rocket > 0) { const p = S[(k.i + 10) % n]; let dh = Math.atan2(p.z - k.z, p.x - k.x) - k.h; dh = Math.atan2(Math.sin(dh), Math.cos(dh)); yaw = clamp(dh * 4, -2.5, 2.5); }
  else if (k.drift) { const u = clamp(st * k.drift, -1, 1); yaw = k.drift * (0.78 + 0.6 * u) * sp * hnd; }
  else { const want = st * 1.75 * sp * hnd * (k.air ? (k.glide ? 0.8 : 0) : 1), lim = GRIP * grip * (k.ice > 0 ? 0.45 : 1) / Math.max(6, k.v); yaw = clamp(want, -lim, lim); if (!k.air && Math.abs(want) > lim) k.v -= (Math.abs(want) - lim) * k.v * 0.9 * dt; }
  if (k.air && !k.glide && !(k.rocket > 0)) yaw = 0;      // off the ground a kart keeps the line it took off on
  k.h += yaw * dt * (k.spin ? 0 : 1) + (k.spin ? dt * 11 : 0);
  const slip = k.drift ? -k.drift * 0.32 : k.ice > 0 ? -st * 0.25 : 0; k.slip += (slip - k.slip) * Math.min(1, dt * (k.ice > 0 ? 2 : 6)); const mh = k.h + k.slip;
  k.x += Math.cos(mh) * k.v * dt; k.z += Math.sin(mh) * k.v * dt;
  // the walls (not on a course with no walls, nor over the chasm). His review (24 Nov 2026): "I shouldn't be phasing against the rail I
  // should clearly hit it... a realistic graphic for what happens when I hit the side of the race course while flying". The kart's SIDE
  // stops at the rail (KW, half its width; it used to be its middle, so half the kart went into the rail), and a catch fence above the
  // rail (part3) stops a flying kart where it can be seen. Brushing the rail scrapes (sparks, a little speed); running into it is a hit:
  // the kart bounces off, loses half its speed, rocks, and a flying kart drops.
  let l2 = locate(T, k.x, k.z, k.i); const p = S[l2.i], lim2 = (T.info.edge === 'void' ? TW / 2 + 1.0 : TW / 2 + 3.4) - KW;
  if (!p.gap && Math.abs(l2.lat) > lim2) { const s = Math.sign(l2.lat), back = Math.abs(l2.lat) - lim2; k.x += Math.sin(p.h) * s * back; k.z -= Math.cos(p.h) * s * back;
    let rel = mh - p.h; rel = Math.atan2(Math.sin(rel), Math.cos(rel)); const into = k.v * Math.abs(Math.sin(rel)), hard = into > 4.5 || (k.air && into > 2.5);
    if (hard) { k.v *= k.air ? 0.5 : 0.6; k.h = p.h - rel * 0.45; k.slip = 0; k.wob = 1; if (k.air) k.vy = Math.min(k.vy, 0) * 0.5 - 1.5; if (k.drift) { k.tier = 0; k.charge = 0; endDrift(G, k); } }
    else { k.v *= 1 - Math.min(0.08, dt * 2.5); k.h -= rel * Math.min(1, dt * 8); }
    if (me && (hard ? !G.wallT : !G.scrapeT)) { if (hard) G.wallT = 0.45; else G.scrapeT = 0.09;
      G.ev.push({ k: hard ? 'wall' : 'scrape', x: k.x - Math.sin(p.h) * s * KW * 1.05, z: k.z + Math.cos(p.h) * s * KW * 1.05, y: k.y || 0, h: p.h, s, air: !!k.air, into, fly: k.air && (k.y - p.y) > 1.2 }); }
    l2 = locate(T, k.x, k.z, l2.i); }
  k.wob = Math.max(0, (k.wob || 0) - dt * 1.4); if (me) G.scrapeT = Math.max(0, (G.scrapeT || 0) - dt);
  if (me) G.wallT = Math.max(0, (G.wallT || 0) - dt);
  // up and down: the ground under the kart (hills, ramps, the chasm, the edge), gravity, and leaving the ground over a crest
  const gr = GRAV * c.grav * (k.glide ? 0.32 : 1), gy = groundAt(T, l2), rp = rampAt(T, l2); if (gy > VOID + 1) k.gyLast = gy;
  if (k.air) { k.vy -= gr * dt; k.y += k.vy * dt; if (k.trick) { k.trick.t += dt; if (k.trick.t >= TRICK) { k.trick = null; k.lastTrickEnd = G.t; if (me) G.ev.push({ k: 'trickdone', n: k.airTricks }); } }
    if (gy > VOID + 1 && k.y <= gy) land(G, k, gy); else if (k.y < roadY(T, l2) - 3.5) { k.fall = 1.3; k.air = false; k.glide = false; k.trick = null; k.drift = 0; if (me) { G.falls++; G.ev.push({ k: 'fall' }); lessonMiss(G, 'fall'); } } }
  else if (gy <= VOID + 1) { k.air = true; k.airTricks = 0; k.trick = null; k.vy = Math.min(0, k.vy); }
  else { const want = (gy - k.y) / Math.max(1e-3, dt);
    if (k.ramp && !rp) launch(G, k, k.ramp);
    else if (want < k.vy - gr * dt * 2.2 && k.v > 12 && !rp) { k.air = true; k.airTricks = 0; k.trick = null; k.lastTrickEnd = -9; k.ringN = 0; k.y += k.vy * dt; k.plan = me ? 0 : Math.floor(c.aiTricks * (0.4 + G.rnd() * 0.6)); if (me) G.ev.push({ k: 'hop' }); }
    else { k.vy = clamp(want, -30, 30); k.y = gy; } k.ramp = rp ? rp.r : null; }
  // boost pads; slipstream behind another kart
  const di = l2.i - k.last; let dd = di; if (di < -n / 2) dd = di + n; if (di > n / 2) dd = di - n;
  if (!k.air && dd > 0) for (const pd of T.pads) { const rel = ((l2.i - pd.i) % n + n) % n; if (rel <= Math.max(1, dd) && Math.abs(l2.lat - pd.lat) < 2.0 && k.padI !== pd.i) { k.padI = pd.i; k.boost = Math.max(k.boost, 0.9); if (me) G.ev.push({ k: 'pad' }); } }
  if (!k.air && k.v > 16) { let drafting = false; const ch = Math.cos(k.h), sh = Math.sin(k.h); for (const o of G.karts) { if (o === k || o.air || o.fall > 0) continue; const ax = o.x - k.x, az = o.z - k.z; if (ax * ax + az * az > 200) continue; const fw = ax * ch + az * sh, sd = -ax * sh + az * ch; if (fw > 3 && fw < 14 && Math.abs(sd) < 1.6) { drafting = true; break; } }
    k.draftT = drafting ? k.draftT + dt : Math.max(0, k.draftT - dt * 2); if (k.draftT > 1.3) { k.draftT = 0; k.boost = Math.max(k.boost, 0.8); addNitro(G, k, 0.18); if (me) { G.drafts++; G.ev.push({ k: 'draft' }); } } } else k.draftT = 0;
  k.prog += dd * T.ds; k.last = l2.i; k.i = l2.i; k.lat = l2.lat; k.off = off;
  if (k.prog >= T.L) { k.prog -= T.L; k.lap++; k.padI = null; if (me) { G.ev.push({ k: 'lap', lap: k.lap }); placeCoinsAir(G); } if (k.lap >= c.laps && !G.lesson && !k.done) { k.done = true; k.fin = G.t; if (me) G.ev.push({ k: 'finish' }); else G.doneN = (G.doneN | 0) + 1; } }
  if (k.prog < -T.L / 2) { k.prog += T.L; k.lap--; } }
function placeCoinsAir(G) { for (const cn of G.coinsT) if (cn.air) cn.t = 0; for (const r of G.ringsT) r.by = []; }
// back on the road after a fall: just past the chasm (or where you went over), in the middle, slowly, with a coin or two less
function rescue(G, k) { const T = G.T, S = T.S, n = S.length; let i = k.i; for (let q = 0; q < 60 && S[i].gap; q++) i = (i + 1) % n; i = (i + 2) % n; const p = S[i];
  const di = i - k.last; let dd = di; if (di < -n / 2) dd = di + n; if (di > n / 2) dd = di - n; k.prog += dd * T.ds; k.last = i; k.i = i;
  k.x = p.x; k.z = p.z; k.h = p.h; k.y = p.y + 1.2; k.vy = 0; k.air = true; k.glide = false; k.v = 6; k.spin = 0; k.boost = 0; k.slip = 0; k.lat = 0; k.coin = Math.max(0, k.coin - 2); k.resT = G.t; if (k.me) G.ev.push({ k: "rescue" }); }
const landIn = (k, g) => (k.vy + Math.sqrt(Math.max(0, k.vy * k.vy + 2 * g * Math.max(0, k.y - (k.gyLast || 0))))) / g;
// when a flying kart will touch down, from the real ground ahead of it (hills, the far side of a chasm): for the HUD and the robots
function landPred(G, k) { const T = G.T, g = GRAV * G.cfg.grav * (k.glide ? 0.32 : 1), c = Math.cos(k.h + (k.slip || 0)), s = Math.sin(k.h + (k.slip || 0)), dt = 1 / 30; let x = k.x, z = k.z, y = k.y, vy = k.vy, i = k.i;
  for (let t = dt; t < 4; t += dt) { x += c * k.v * dt; z += s * k.v * dt; vy -= g * dt; y += vy * dt; const l = locate(T, x, z, i); i = l.i; const gy = groundAt(T, l); if (gy > VOID + 1 && y <= gy) return t; } return 4; }
function launch(G, k, r) { const c = G.cfg; k.air = true; k.glide = r.big; k.ramp = null; k.airTricks = 0; k.trick = null; k.lastTrickEnd = -9; k.airCoins = 0; k.ringN = 0;
  k.vy = (r.big ? VYBIG : VY) * (0.95 + k.v / VMAX * 0.1); k.plan = k.me ? 0 : Math.floor(c.aiTricks * (0.6 + G.rnd() * 0.6) * (r.big ? 2 : 1)); if (k.me) G.ev.push({ k: 'launch', big: r.big }); }
function land(G, k, gy) { k.y = gy; k.vy = 0; k.air = false; const glide = k.glide; k.glide = false;
  if (k.trick) { k.trick = null; k.spin = 1.25; k.boost = 0; const lost = Math.min(3, k.coin); k.coin -= lost; if (k.me) { G.wipeouts++; G.ev.push({ k: 'wipeout', lost }); lessonMiss(G, 'wipeout'); } k.airTricks = 0; return; }
  const n = k.airTricks; k.airTricks = 0; const rings = k.ringN | 0; k.ringN = 0; if (rings) { k.boost = Math.max(k.boost, 0.6 + rings * 0.35); }
  if (!n) { if (k.me) { G.ev.push({ k: 'land', n: 0, glide, rings }); lessonSee(G, 'land', 0); } return; }
  const perfect = G.t - (k.lastTrickEnd == null ? -9 : k.lastTrickEnd) < 0.16; k.boost = Math.max(k.boost, 0.35 + 0.32 * n + (perfect ? 0.35 : 0) + rings * 0.35); k.v = Math.max(k.v, VMAX * 0.92);
  addNitro(G, k, 0.16 * n + (perfect ? 0.12 : 0) + rings * 0.1);
  if (k.me) { G.tricks += n; if (perfect) G.perfects++; G.ev.push({ k: 'land', n, perfect, glide, rings }); lessonSee(G, 'land', n, perfect); } }
// ---------- the rivals: a line through the bends, a little drifting of their own, tricks off ramps, items with sense, they
// steer round the dangers they see coming (the better ones more often), a gentle rubber band ----------
function aiPlan(G, k, r) { const R = G.rnd, c = G.cfg, max = Math.floor(landIn({ vy: (r.big ? VYBIG : VY), y: r.h, gyLast: 0 }, GRAV * c.grav * (r.big ? 0.32 : 1)) / TRICK); return Math.min(max, Math.floor(c.aiTricks * (0.6 + R() * 0.6) * (r.big ? 2 : 1))); }
function ai(G, k, dt) { const T = G.T, S = T.S, n = S.length, c = G.cfg, R = G.rnd; if (k.spin > 0 || k.fall > 0) { k.steer = 0; return; }
  const look = Math.round(9 + k.v * 0.35), p = S[(k.i + look) % n], cv = S[(k.i + look) % n].curve;
  k.lane += dt * 0.25; let want = k.line + Math.sin(k.lane) * 1.4 - Math.sign(cv) * Math.min(3, Math.abs(cv) * 7);
  // dangers ahead: steer to the other side of them (if it sees them in time)
  k.dodge -= dt; if (k.dodge <= 0) { k.dodge = 0.3; k.avoid = null; for (const h of G.hz) { const rel = ((h.i - k.i) % n + n) % n; if (rel > 2 && rel < 26 && R() < c.aiDodge) { const hl2 = h.latNow != null ? h.latNow : h.lat; if (Math.abs(hl2 - want) < h.r + 2.2) k.avoid = hl2 > 0 ? hl2 - h.r - 2.6 : hl2 + h.r + 2.6; } } }
  if (k.avoid != null) want = k.avoid; for (const r of T.ramps) { const rel = ((r.i0 - k.i) % n + n) % n; if (rel > 0 && rel < 24) want = clamp(want, -3, 3); }
  want = clamp(want, -TW / 2 + 1.2, TW / 2 - 1.2); const tx = p.x - Math.sin(p.h) * want, tz = p.z + Math.cos(p.h) * want;
  let dh = Math.atan2(tz - k.z, tx - k.x) - k.h; dh = Math.atan2(Math.sin(dh), Math.cos(dh)); k.steer = clamp(dh * 2.4, -1, 1);
  // corners: a rival "drifts" a long bend and gets a little boost out of it now and then
  if (Math.abs(cv) > 0.16 && !k.air) { k.dT = (k.dT || 0) + dt; k.drifting = true; } else { if (k.dT > 1.0 && R() < c.aiDrift) { k.boost = Math.max(k.boost, 0.6); addNitro(G, k, 0.25); } k.dT = 0; k.drifting = false; }
  const lead = race(k) - race(G.me); k.rubber = clamp(1 - lead / 2600, 0.94, 1.035);
  if ((k.nitro || 0) >= 1 && !k.air && Math.abs(cv) < 0.1 && R() < c.aiItems * dt * 0.8) useNitro(G, k);
  if (k.air && !k.trick && k.plan > k.airTricks && G.t - (k.lastTrickEnd || 0) > 0.02) { const tl = landPred(G, k); if (tl > TRICK + 0.08) startTrick(G, k); else k.plan = 0; }
  // items: shells and seekers with someone ahead; peels with someone behind; boosts on a straight; defence when it is hit
  const it = k.item || (k.orbit ? 'triple' : k.peppers ? 'pepper' : null); if (it) { k.itemT -= dt; if (k.itemT <= 0) { k.itemT = 0.6; if (R() < c.aiItems) { const ahead = G.karts.find(o => o !== k && race(o) > race(k) && race(o) - race(k) < 40 && Math.abs((o.lat || 0) - (k.lat || 0)) < 2.5), behind = G.karts.some(o => o !== k && race(k) - race(o) > 0 && race(k) - race(o) < 22);
      const back = !ahead && behind && (it === 'shell' || it === 'triple' || it === 'peel'), ok = it === 'shell' || it === 'triple' ? !!ahead || behind : it === 'homing' ? G.karts.some(o => o !== k && race(o) > race(k)) : it === 'peel' ? !!ahead || behind || R() < 0.1 : it === 'pepper' || it === 'pepper3' ? Math.abs(cv) < 0.15 : true; if (ok) useItem(G, k, back ? -1 : 1); } } } }
function finish(G) { const c = G.cfg, me = G.me, place = me.place, win = place <= c.place; G.over = win ? 'won' : 'lost';
  const stars = win ? 1 + (place === 1 ? 1 : 0) + (G.bigBoosts + G.tricks >= 5 && G.falls === 0 && G.wipeouts === 0 ? 1 : 0) : 0;
  const order = G.karts.slice().sort((a, b) => a.place - b.place).map(k => k.me ? 'YOU' : k.who.name);
  G.res = { win, stars, place, need: c.place, laps: c.laps, time: +G.t.toFixed(1), tricks: G.tricks, perfects: G.perfects, wipeouts: G.wipeouts, boosts: G.boosts, big: G.bigBoosts, hits: G.hits, zaps: G.zaps, falls: G.falls, rings: G.rings, drafts: G.drafts,
    coins: Math.round(G.coins / 3) + (win ? 5 + Math.ceil(G.N / 3) + stars * 2 : 1), track: TRACKS[c.track].name, order, cup: c.cup, cls: c.cls };
  G.ev.push({ k: win ? 'won' : 'lost', place }); return true; }
// ---------- LESSONS: the course to yourself (and a few slow karts to aim at) ----------
const LESSONS = {
  1: [{ id: 'boost', title: 'STEER AND DRIFT', say: 'HOLD ◀ ▶, HOLD DRIFT', do: 'hold', how: 'Hold ◀ or ▶ to steer. In a bend, steer AND hold DRIFT: you slide and the sparks go blue, orange, purple. Let go of DRIFT for a BOOST. Twice.', need: 2 },
      { id: 'nitro', title: 'NITRO!', say: 'TAP NITRO!', do: 'tap', how: 'Drifts, tricks and slipstreams fill your NITRO. It is full now: tap NITRO (above DRIFT) for a big boost!', need: 1 }],
  2: [{ id: 'trick', title: 'JUMP AND TRICK', say: 'IN THE AIR: TAP DRIFT', do: 'tap', how: 'Off a ramp, tap DRIFT once in the air for a trick, and land after it has finished. Twice. Only in the air!', need: 2 }],
  3: [{ id: 'item', title: 'TURTLE SHELLS', say: 'GET BEHIND, TAP ITEM', do: 'tap', how: 'Drive through the ? boxes: three shells. Line up BEHIND a kart, then tap ITEM to fire ahead (swipe it down to fire behind). Hit two karts.', need: 2 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); grid(G); G.count = 0; G.hz = [];
  if (lessonNow(G).id === 'item') { const S = G.T.S, n = S.length; for (let q = 0; q < 3; q++) { const i = (G.me.i + 30 + q * 26) % n, p = S[i], lat = [-3, 3, 0][q]; const d = newKart(G, { x: p.x - Math.sin(p.h) * lat, z: p.z + Math.cos(p.h) * lat, h: p.h, i }, DRIVERS[1 + q], false, 0); d.dummy = true; d.line = lat; d.skill = 0.55; d.lap = 0; d.prog = G.me.prog + (30 + q * 26) * G.T.ds; d.last = i; d.y = p.y; G.karts.push(d); } } }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonSee(G, what, n, perfect) { const st = lessonNow(G); if (!st) return; let ok = false;
  if (st.id === 'boost' && what === 'boost') ok = true;
  if (st.id === 'nitro' && what === 'nitro') ok = true;
  if (st.id === 'trick' && what === 'land') { if (n >= 1) ok = true; else { if (G.lesson.n && !G.me.glideLand) { G.lesson.n = 0; G.ev.push({ k: 'lessonmiss', how: 'No trick on that jump. ' + st.how }); } return; } }
  if (st.id === 'item' && what === 'hitR') ok = true;
  if (st.id === 'item' && what === 'use') { G.lesson.fired = (G.lesson.fired || 0) + 1; if (G.lesson.fired > 6) { G.lesson.fired = 0; G.lesson.n = 0; G.ev.push({ k: 'lessonmiss', how: 'Too many misses. Line up right behind a kart before you fire.' }); } return; }
  if (!ok) return; G.lesson.n++; G.lesson.fired = 0; if (G.lesson.n < st.need) { G.ev.push({ k: 'lessonok', n: G.lesson.n, need: st.need }); return; }
  G.lesson.i++; G.lesson.n = 0; if (G.lesson.i >= G.lesson.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.lessonEnd = true; G.wait = 1.4; return; }
  G.ev.push({ k: 'lessonnext' }); if (lessonNow(G).id === 'nitro') G.me.nitro = Math.max(G.me.nitro || 0, 1); }
// a wipeout, a fall or a hop on the ground in the trick lesson starts the count again (so blind tapping never gets through)
function lessonMiss(G, why) { const st = lessonNow(G); if (!st) return;
  if (why === 'wipeout') { G.lesson.n = 0; G.ev.push({ k: 'lessonmiss', how: 'Wiped out! Land only when the trick has finished. ' + st.how }); }
  if (why === 'fall') { G.lesson.n = 0; G.ev.push({ k: 'lessonmiss', how: 'You fell off! ' + st.how }); }
  if (why === 'ground' && st.id === 'trick') { G.lesson.n = 0; if (G.t - (G.lgT || -9) > 2) G.ev.push({ k: 'lessonmiss', how: 'Tap DRIFT only when you are in the AIR. ' + st.how }); G.lgT = G.t; } }
// ---------- for the robots ----------
// BLIND: thumbs that do not look: hold ◀, ▶ or neither; press or let go of DRIFT; tap ITEM (ahead or behind) or NITRO
const BLIND = { s: G => { const r = Math.random(); setBtn(G, 'L', r < 0.37); setBtn(G, 'R', r > 0.63); },
  d: G => { if (G.driftBtn) driftUp(G); else driftDown(G); },
  t: G => { const r = Math.random(); if (r < 0.4) itemTap(G, false); else if (r < 0.6) itemTap(G, true); else useNitro(G); } };
// a driver who looks: a line through the bends, drifts the long ones with the DRIFT button (holds it to orange, more if the bend
// lasts), tricks as many as a jump allows, steers through the glider rings and round the dangers, throws items the right way
// (ahead at a kart in its lane, a peel back at one close behind), fires NITRO on straights, tries a rocket start; a person's
// hands: a beat late, now and then a wobble
function honest(G, o, mem) {
  const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random, k = G.me, T = G.T, S = T.S, n = S.length;
  if (G.over || G.wait > 0) { setSteer(G, 0); return; }
  if (G.count > 0) { setSteer(G, 0); if (mem.rs == null) mem.rs = 1.95 - R() * 0.9 * (1 - acc) - react * 0.4 + (R() < (1 - acc) * 0.6 ? 0.6 : 0); if (G.count < mem.rs && !G.hold) setHold(G, true); return; }
  if (G.hold) { setHold(G, false); G.driftBtn = false; } mem.rs = null;
  if (k.air) { if (!k.trick) { mem.wait = (mem.wait || 0) + 1 / 60; const tl = landPred(G, k), margin = 0.04 + react * 0.15 + (1 - acc) * 0.2;
      if (mem.wait > 0.04 + react * 0.2 && tl > TRICK + margin) { startTrick(G, k); mem.wait = 0; } else if (mem.wait > 0.04 + react * 0.2 && tl > TRICK - 0.05 && R() < (1 - acc) * 0.04) { startTrick(G, k); mem.wait = 0; } } } else mem.wait = 0;
  mem.t = (mem.t || 0) - 1 / 60; if (mem.t > 0) return; mem.t = 0.05 + react * 0.15;
  const look = Math.round(8 + k.v * 0.3), p = S[(k.i + look) % n]; let bend = 0; for (let q = 4; q < 26; q += 2) bend += S[(k.i + q) % n].curve; bend /= 11;
  let want = clamp(-Math.sign(bend) * Math.min(2.5, Math.abs(bend) * 5), -3, 3);
  for (const pd of T.pads) { const rel = ((pd.i - k.i) % n + n) % n; if (rel > 0 && rel < 26) want = pd.lat; }
  for (const r of T.ramps) { const rel = ((r.i0 - k.i) % n + n) % n; if (rel > 0 && rel < 30) want = 0; }
  if (k.glide) { let bc = null, bd = 1e9; for (const rg of G.ringsT) { if (rg.by && rg.by.indexOf(k) >= 0) continue; const ax = rg.x - k.x, az = rg.z - k.z, fw = ax * Math.cos(k.h) + az * Math.sin(k.h); if (fw > 2 && fw < bd) { bd = fw; bc = rg; } } if (bc) want = locate(T, bc.x, bc.z, k.i).lat; else want = 0; }
  let avoid = false; for (const h of G.hz) { const rel = ((h.i - k.i) % n + n) % n; if (rel > 1 && rel < 24 && (h.act || h.warn > 0 || h.span)) { const hlat = h.latNow != null ? h.latNow : h.lat; if (Math.abs(hlat - want) < h.r + 2.4) { want = hlat > 0 ? hlat - h.r - 2.8 : hlat + h.r + 2.8; avoid = true; } } }
  for (const pl of G.peels) { const l = locate(T, pl.x, pl.z, k.i), rel = ((l.i - k.i) % n + n) % n; if (rel > 1 && rel < 22 && Math.abs(l.lat - want) < 2.4) { want = l.lat > 0 ? l.lat - 3 : l.lat + 3; avoid = true; } }
  const held = k.item || (k.orbit ? 'triple' : null); let lined = false, tgD = 1e9;
  if ((held === 'shell' || held === 'triple' || held === 'peel') && !avoid && !k.glide) { let tg = null; for (const q of G.karts) { if (q === k || q.fall > 0) continue; const ax = q.x - k.x, az = q.z - k.z, fw = ax * Math.cos(k.h) + az * Math.sin(k.h); if (fw > 4 && fw < 50 && fw < tgD) { tgD = fw; tg = q; } }
    if (tg) { want = tg.lat || 0; lined = Math.abs((tg.lat || 0) - (k.lat || 0)) < 1.1 && tgD < (held === 'peel' ? 48 : 34) && tgD > (held === 'peel' ? 22 : 4) && Math.abs(bend) < 0.12; } }
  mem.lined = lined;
  const edge = T.info.edge === 'void' ? TW / 2 - 1.5 : TW / 2 - 0.8; want = clamp(want, -edge, edge);
  const tx = p.x - Math.sin(p.h) * want, tz = p.z + Math.cos(p.h) * want;
  let dh = Math.atan2(tz - k.z, tx - k.x) - (k.h + (k.slip || 0)); dh = Math.atan2(Math.sin(dh), Math.cos(dh)); let s = clamp(dh * 2.6, -1, 1);
  // the drift: press DRIFT as a long bend starts (steering into it), hold, and let go as it ends
  const long = Math.abs(bend) > 0.13;
  if (!k.drift && !G.driftBtn && long && k.v > 16 && Math.sign(dh) === Math.sign(bend) && !avoid && !k.air) { s = Math.sign(bend); setSteer(G, s); G.steer = s; driftDown(G); }
  else if (G.driftBtn && !k.drift && !(k.wantDrift > 0)) driftUp(G);
  if (k.drift) { const end = Math.abs(bend) < 0.1 || (k.tier >= 2 && Math.abs(bend) < 0.16) || Math.sign(bend) !== k.drift || Math.abs(k.lat || 0) > TW / 2 - (T.info.edge === 'void' ? 2.2 : 0.5) || avoid;
    const need = dh * 2.6 * k.drift / Math.max(0.3, Math.min(1, k.v / 12)), u = (need - 0.78) / 0.6; s = k.drift * clamp(u, -1, 1); if (end) driftUp(G); }
  if (R() > acc) s += (R() - 0.5) * 0.8;
  setSteer(G, s);
  if ((k.nitro || 0) >= 1 && !k.air && Math.abs(bend) < 0.12 && !k.drift && R() < 0.3 + acc * 0.5) useNitro(G);
  const it = k.item || (k.orbit ? 'triple' : k.peppers ? 'pepper' : null);
  if (it && !k.air && !k.drift) { mem.it = (mem.it || 0) + 0.1; const behind = G.karts.some(q => q !== k && race(k) - race(q) > 0 && race(k) - race(q) < 20 && Math.abs((q.lat || 0) - (k.lat || 0)) < 2.5);
    let dir = 1, go3 = true; if (it === 'pepper' || it === 'pepper3') go3 = Math.abs(bend) < 0.2; else if (it === 'shell' || it === 'triple') { go3 = mem.lined || (behind && R() < 0.5) || (mem.it > 12 && !G.lesson); if (!mem.lined && behind) dir = -1; }
    else if (it === 'peel') { go3 = mem.lined || behind || mem.it > 6; if (!mem.lined) dir = -1; }
    if (go3 && useItem(G, k, dir)) mem.it = 0; }
}
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.count = 0; G.me.place = 1; G.me.done = true; finish(G); }
