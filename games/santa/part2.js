// ===================== RULES: Santa's Round =====================
// A neighbourhood on Christmas Eve. Fly the sleigh to each house on the list (any order), land on its roof marker, slip down
// the chimney, and inside: tiptoe (a full push runs, and running is loud), leave the right presents under the tree (the
// family's wish list says who wants what), fill every stocking, then back up the chimney. Noise wakes people: bumping
// furniture, creaky boards, a curious cat. If someone wakes, that house starts again; earlier houses stay delivered.
// Deliver every house before dawn. Flight: x, z on the ground (metres), y up. Inside a house: a grid of 1 m cells.
const RULES = [
  '<b>Fly:</b> hold <b>FORWARD</b> (right thumb) to fly ahead; let go and the sleigh slows to a hover. The stick (left thumb): left and right turn, <b>up climbs, down dives</b>. Fly down onto a house\'s glowing marker to land on its roof. Stars in the sky: a burst of speed.',
  '<b>Inside:</b> push gently to tiptoe; a full push runs, and running is noisy. Bumping furniture and creaky boards are noisy too.',
  '<b>Presents:</b> read the wish list (top left). Tap a present in your sack to hold it, then ACT by the tree to put it down. ACT by the tree with empty hands picks the last one back up.',
  'ACT by each stocking to fill it. ACT by the fireplace to go back up when the house is done.',
  'Too much noise wakes someone: that house starts again. A cat? ACT near it to toss it a toy. Deliver every house before dawn.',
];
const SKINS = [{ id: 'red', name: 'Classic red', col: 0xc8202a, col2: 0xf0e6d0, stars: 0 }, { id: 'green', name: 'Holly green', col: 0x1a7a3a, col2: 0xe8c040, stars: 5 }, { id: 'blue', name: 'Frost blue', col: 0x2a6ac8, col2: 0xffffff, stars: 12 },
  { id: 'gold', name: 'Gold sleigh', col: 0xd8a830, col2: 0x8a1a1a, stars: 22 }, { id: 'candy', name: 'Candy cane', col: 0xe82a4a, col2: 0xffffff, stars: 34 }, { id: 'aurora', name: 'Aurora', col: 0x3ad8a8, col2: 0xa83ad8, stars: 50 }];
const UPGRADES = [{ id: 'boots', name: 'Soft boots', max: 2, cost: l => [60, 140][l], desc: 'Footsteps make less noise.' }, { id: 'reindeer', name: 'Swift reindeer', max: 2, cost: l => [70, 160][l], desc: 'The sleigh flies a little faster.' },
  { id: 'bell', name: 'Muffled bells', max: 1, cost: () => 110, desc: 'Landings are quieter (a little more time).' }];
const upLv = id => { if (typeof HEADLESS !== 'undefined' && HEADLESS) return 0; return ((store.get('ups', {}) || {})[id]) | 0; };
const RANKS = [[0, 'Helper elf'], [60, 'Toy maker'], [200, 'Sleigh driver'], [500, 'Chimney expert'], [1100, 'Head elf'], [2500, 'Father Christmas']];
const PLACES = [{ name: 'Snowfield Village', sky: 'night' }, { name: 'Pinewood Lane', sky: 'night' }, { name: 'Old Town', sky: 'night' }, { name: 'Harbour Heights', sky: 'night' }];
const placeOf = N => Math.floor((N - 1) / 5) % PLACES.length;
const GIFTS = [{ id: 'teddy', icon: '🧸', name: 'teddy bear' }, { id: 'train', icon: '🚂', name: 'train set' }, { id: 'doll', icon: '🪆', name: 'doll' }, { id: 'ball', icon: '⚽', name: 'football' }, { id: 'book', icon: '📚', name: 'books' },
  { id: 'kite', icon: '🪁', name: 'kite' }, { id: 'drum', icon: '🥁', name: 'drum' }, { id: 'puzzle', icon: '🧩', name: 'puzzle' }, { id: 'guitar', icon: '🎸', name: 'guitar' }, { id: 'paint', icon: '🎨', name: 'paint set' },
  { id: 'robot', icon: '🤖', name: 'robot' }, { id: 'skates', icon: '⛸️', name: 'skates' }];
const NAMES = ['Mia', 'Leo', 'Ava', 'Sam', 'Zoe', 'Ben', 'Ivy', 'Max', 'Ruby', 'Finn', 'Nora', 'Theo', 'Lily', 'Jack', 'Ella', 'Oscar', 'Rosa', 'Kai', 'Isla', 'Noah'];
const FAMS = ['Frost', 'Holly', 'Snow', 'Berry', 'Pine', 'Gale', 'Brook', 'Wren', 'Ashby', 'Clay', 'Dale', 'Fern'];
const CRUISE = 14, FLY = 10, SLOW = 3.6;
function makeCfg(N, help, o = {}) {
  const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s));
  return { N, f, help: !!help, place: placeOf(N), houses: Math.min(6, 1 + Math.floor((N + 1) / 3)), members: [2, 4], decoys: Math.round(x(1, 4, 12)),
    creaky: N >= 3 ? x(2, 9, 16) : 0, cat: N >= 4, furniture: Math.round(x(3, 9, 16)), marker: x(2.6, 1.3, 16), narrow: N >= 6, slippery: N >= 8, spread: x(28, 60, 18),
    night: x(1.9, 0.92, 16) * (help ? 1.25 : 1), quiet: help ? 0.75 : 1, free: !!o.free };
}
// ---------- the neighbourhood: houses on a gentle grid of streets, each with its family, its room and its quirks ----------
function makeVillage(cfg) { const R = rng(cfg.N * 613 + 29), hs = [], spots = [];
  for (let i = -3; i <= 3; i++) for (let j = 1; j <= 6; j++) spots.push({ x: i * 16 + (R() - 0.5) * 4, z: j * 15 + (R() - 0.5) * 4 });
  spots.sort((a, b) => (a.x * a.x + a.z * a.z) - (b.x * b.x + b.z * b.z));
  const pickable = spots.filter(s => Math.hypot(s.x, s.z) < cfg.spread + 20); for (let i = pickable.length - 1; i > 0; i--) { const j = (R() * (i + 1)) | 0; [pickable[i], pickable[j]] = [pickable[j], pickable[i]]; }
  for (let h = 0; h < cfg.houses; h++) { const s = pickable[h], apt = cfg.N >= 10 && R() < 0.3, nm = cfg.members[0] + ((R() * (cfg.members[1] - cfg.members[0] + 1)) | 0) - (cfg.N <= 2 ? 1 : 0);
    const used = new Set(), mem = []; for (let m = 0; m < nm; m++) { let n; do { n = NAMES[(R() * NAMES.length) | 0]; } while (used.has(n)); used.add(n); let g; do { g = GIFTS[(R() * GIFTS.length) | 0].id; } while (mem.some(q => q.wish === g)); mem.push({ name: n, wish: g }); }
    const H = { i: h, x: s.x, z: s.z, w: 8, d: 7, h: apt ? 13 : 5 + R() * 2, fam: FAMS[(h * 5 + cfg.N) % FAMS.length], mem, apt, narrow: cfg.narrow && R() < 0.4, slippery: cfg.slippery && R() < 0.4 };
    H.mx = H.x + (R() - 0.5) * 2; H.mz = H.z + (R() - 0.5) * 1.5; H.top = H.h + 2.6;
    H.room = makeRoom(cfg, R, H); hs.push(H); }
  return hs; }
// a room seen from above: walls round the edge, the fireplace (and the way in) in the middle of the top wall, the tree, the
// stockings on the mantel, furniture, someone asleep, creaky boards, maybe a cat
function makeRoom(cfg, R, H) { const W = 11, D = 8, g = [], free = (x, z) => x > 0 && z > 0 && x < W - 1 && z < D - 1 && g[z][x] === 0;
  for (let z = 0; z < D; z++) { g.push([]); for (let x = 0; x < W; x++) g[z].push(x === 0 || z === 0 || x === W - 1 || z === D - 1 ? 1 : 0); }
  const fire = { x: 5, z: 1 }, tree = { x: R() < 0.5 ? 2 : 8, z: 5 + ((R() * 2) | 0) };
  g[tree.z][tree.x] = 2; const stock = []; H.mem.forEach((m, i) => stock.push({ x: 5 + (i - (H.mem.length - 1) / 2) * 1.0, z: 1, name: m.name, full: false }));
  const furn = []; let tries = 0; while (furn.length < cfg.furniture && tries++ < 200) { const x = 1 + ((R() * (W - 2)) | 0), z = 2 + ((R() * (D - 3)) | 0);
    if (!free(x, z) || Math.abs(x - fire.x) <= 1 && z <= 2 || Math.abs(x - tree.x) <= 1 && Math.abs(z - tree.z) <= 1) continue; g[z][x] = 3; if (!roomOK(g, W, D, fire, tree)) { g[z][x] = 0; continue; } furn.push({ x, z, kind: ['sofa', 'table', 'chair', 'lamp', 'box'][(R() * 5) | 0] }); }
  // the sleeper: in an armchair by a wall
  let sl = null; for (let t = 0; t < 60 && !sl; t++) { const x = 1 + ((R() * (W - 2)) | 0), z = D - 2; if (free(x, z) && Math.abs(x - tree.x) > 1) { g[z][x] = 4; if (roomOK(g, W, D, fire, tree)) sl = { x, z }; else g[z][x] = 0; } }
  const creak = []; tries = 0; while (creak.length < Math.round(cfg.creaky) && tries++ < 200) { const x = 1 + ((R() * (W - 2)) | 0), z = 2 + ((R() * (D - 3)) | 0); if (g[z][x] !== 0 || creak.some(c => c.x === x && c.z === z) || Math.abs(x - fire.x) + Math.abs(z - fire.z) < 2) continue; creak.push({ x, z }); if (!roomOK(g, W, D, fire, tree, creak)) creak.pop(); }
  const cat = cfg.cat && R() < 0.75 ? { x: 1.5 + R() * (W - 3), z: 3 + R() * 3, tx: 0, tz: 0, calm: 0, meow: 0, t: 0 } : null;
  return { W, D, g, fire, tree, stock, furn, sl, creak, cat }; }
// every place you must reach (the tree, each stocking, the fireplace) can be reached without crossing furniture or creaky boards
function roomOK(g, W, D, fire, tree, creak = []) { const seen = new Set([fire.x + ',' + (fire.z + 1)]), q = [[fire.x, fire.z + 1]], bad = new Set(creak.map(c => c.x + ',' + c.z));
  while (q.length) { const [x, z] = q.shift(); for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, nz = z + dz, k = nx + ',' + nz; if (seen.has(k) || g[nz][nx] !== 0 || bad.has(k)) continue; seen.add(k); q.push([nx, nz]); } }
  return [[tree.x + 1, tree.z], [tree.x - 1, tree.z], [tree.x, tree.z - 1], [tree.x, tree.z + 1]].some(([x, z]) => seen.has(x + ',' + z)); }
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help, o), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, mini: !!o.mini, free: !!o.free, blind: {} };
  G.V = makeVillage(cfg); G.done = []; G.wakes = 0; G.stick = { x: 0, y: 0 }; G.go = false; G.act = false; G.stars = makeStars(G); G.starN = 0;
  G.s = { x: 0, z: -20, y: CRUISE, yaw: 0, v: 0, vy: 0, boost: 0, state: 'fly', t: 0 }; G.phase = 'fly'; G.in = null;
  let d = 0, px = 0, pz = -20; const left = G.V.slice(); while (left.length) { left.sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz)); const h = left.shift(); d += Math.hypot(h.x - px, h.z - pz); px = h.x; pz = h.z; }
  G.par = d / FLY * 1.15 + G.V.reduce((a, h) => a + 5.2 + h.mem.length * 1.3 + (h.room.cat ? 1.5 : 0) + (h.narrow ? 1 : 0) + (h.slippery ? 1 : 0), 0); G.dawn = Math.round(G.par * cfg.night); G.clock = 0;
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G);
  return G;
}
// ---------- the player's actions ----------
function setStick(G, x, y) { const m = Math.hypot(x, y); G.stick = m > 1 ? { x: x / m, y: y / m } : { x, y }; }
function goOn(G, on) { G.go = !!on; }      // the FORWARD button, held or let go
// stars hang in the sky on the way from each house to the next, some high, some low: fly through one for a burst of speed (and a coin at the end)
function makeStars(G) { const R = rng(G.seed * 7 + 99), out = []; let px = 0, pz = -20; const left = G.V.slice();
  while (left.length) { left.sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz)); const h = left.shift(), n = Math.hypot(h.x - px, h.z - pz) > 30 ? 2 : 1;
    for (let i = 1; i <= n; i++) { const u = i / (n + 1), sx = (R() - 0.5) * 10, sz = (R() - 0.5) * 10; out.push({ x: px + (h.mx - px) * u + sx, z: pz + (h.mz - pz) * u + sz, y: (out.length % 2 ? 7 : 16) + R() * 4, got: false }); } px = h.mx; pz = h.mz; }
  return out; }
function act(G) { if (G.over) return; if (G.phase === 'in') actInside(G); else if (G.phase === 'roof' && G.roof && G.roof.narrow) { G.roof.squeeze = (G.roof.squeeze || 0) + 1; } }
function holdGift(G, id) { if (G.phase !== 'in') return; G.in.hold = id; G.ev.push({ k: 'hold', id }); }
// ---------- every frame ----------
function step(G, dt) { if (G.over || !(dt > 0)) return; G.t += dt; if (G.lesson) lessonTick(G, dt); if (!G.lesson && !G.free) G.clock += dt;
  if (G.blind.lr != null) { G.blind.lr -= dt; if (G.blind.lr <= 0) { G.blind.lr = null; goOn(G, false); } }
  if (G.phase === 'fly') flyStep(G, dt); else if (G.phase === 'roof') roofStep(G, dt); else if (G.phase === 'in') inStep(G, dt); else if (G.phase === 'up') { G.upT -= dt; if (G.upT <= 0) { G.phase = 'fly'; G.s.y = G.s.y + 2.5; G.s.v = 0; G.s.vy = 3; G.s.bump = 0.8; } }
  if (!G.over && !G.lesson && !G.free && G.clock > G.dawn) finish(G, false, 'dawn'); }
const overNext = G => { const s = G.s; return G.V.some(h => !G.done.includes(h.i) && Math.hypot(h.mx - s.x, h.mz - s.z) < G.cfg.marker * 1.3); };
// 25 Nov 2026, later (his words: "Inverted joystick and put Christmas music... also create up and down and forward this one should be good make the
// reindeers majestic"). REAL FLYING. Before, the stick was the way to go and its strength the speed, the height looked after itself, and a LAND
// button brought the sleigh down. Now: the right thumb holds FORWARD (let go: the sleigh slows to a hover); the stick steers (left and right turn
// it, UP climbs, DOWN dives: up is up); and you land by flying down onto the roof's glowing marker. A house in the way is a house in the way:
// fly into its wall and the sleigh bumps back, so climb over. Stars in the sky give a burst of speed.
const CLIMB = 8.5, TURN = 1.9, CEIL = 26;
function flyStep(G, dt) { const s = G.s, sx = G.stick.x, sy = G.stick.y, sp = FLY * (1 + 0.06 * upLv('reindeer')) * (s.boost > 0 ? 1.35 : 1); s.boost = Math.max(0, (s.boost || 0) - dt); s.bump = Math.max(0, (s.bump || 0) - dt);
  if (Math.abs(sx) > 0.12) s.yaw += clamp(sx * 1.15, -1, 1) * TURN * dt;
  { const tv = G.go ? sp : 0; s.v += (tv - s.v) * Math.min(1, dt * (tv < s.v ? 2.6 : 2.2)); }
  const px = s.x, pz = s.z; s.x = clamp(s.x + Math.sin(s.yaw) * s.v * dt, -90, 90); s.z = clamp(s.z + Math.cos(s.yaw) * s.v * dt, -40, 120);
  { const tvy = Math.abs(sy) > 0.15 ? clamp(sy * 1.15, -1, 1) * CLIMB : 0; s.vy = (s.vy || 0) + (tvy - (s.vy || 0)) * Math.min(1, dt * 7); }
  let H = houseUnder(G, s.x, s.z);
  // into the side of a house, below its roof: bumped back (climb over it)
  if (H && s.y < H.top - 0.25 && !houseUnder(G, px, pz)) { s.x = px; s.z = pz; s.v *= 0.15; s.vy = Math.max(s.vy, 4); H = null; if (!(s.bump > 0)) { s.bump = 0.5; G.ev.push({ k: 'bonk' }); } }
  const floor = H ? H.top : 2.5; s.y = clamp(s.y + s.vy * dt, floor, CEIL);
  for (const st of G.stars) if (!st.got && !G.lesson && Math.hypot(st.x - s.x, st.z - s.z, st.y - s.y) < 3.4) { st.got = true; G.starN++; s.boost = 2.6; G.ev.push({ k: 'star', n: G.starN }); }
  // down onto a roof: on the marker it is a landing (and down the chimney), off it the sleigh bounces up again
  if (H && s.y <= H.top + 0.05 && s.vy <= 0 && !(s.bump > 0)) { const d = Math.hypot(s.x - H.mx, s.z - H.mz);
    if (G.done.includes(H.i)) { s.y = H.top + 2; s.vy = 3; s.bump = 0.6; G.ev.push({ k: 'bounce', why: 'done' }); return; }
    if (d <= G.cfg.marker) { G.phase = 'roof'; G.roof = { H, t: 0, narrow: H.narrow, slip: H.slippery ? 0 : null, squeeze: 0, hold: 0 }; s.v = 0; s.vy = 0; s.x = H.mx; s.z = H.mz; G.ev.push({ k: 'land', i: H.i, slippery: !!H.slippery, narrow: !!H.narrow }); lessonSee(G, 'land'); }
    else { s.y = H.top + 2.2; s.vy = 4; s.v = Math.min(s.v, SLOW); s.bump = 0.6; G.ev.push({ k: 'bounce', why: 'marker', d }); } } }
function houseUnder(G, x, z) { return G.V.find(h => Math.abs(x - h.x) < h.w / 2 && Math.abs(z - h.z) < h.d / 2) || null; }
function roofStep(G, dt) { const r = G.roof; r.t += dt;
  // an icy roof: the sleigh slides unless you push up the roof for a moment
  if (r.slip != null && r.slip < 0.8) { if (G.stick.y > 0.5) r.slip += dt; else if (r.t > 2.2) { G.phase = 'fly'; G.s.y = r.H.top + 2; G.s.v = SLOW; G.ev.push({ k: 'slid' }); return; } return; }
  // a narrow chimney: tap ACT to wriggle down
  if (r.narrow) { if (r.squeeze >= 3) { r.narrow = false; G.ev.push({ k: 'squeeze' }); } else return; }
  if (r.t > 0.5) enterHouse(G, r.H); }
function enterHouse(G, H) { const R = H.room; G.phase = 'in'; R.stock.forEach(s => s.full = false); if (R.cat) { R.cat.calm = 0; R.cat.meow = 0; }
  G.in = { H, x: R.fire.x, z: R.fire.z + 1, face: Math.PI, noise: 0, placed: [], hold: null, bumpT: 0, onCreak: null, stir: 0, sack: sackFor(G, H) }; G.ev.push({ k: 'enter', i: H.i }); }
function sackFor(G, H) { const R = rng(G.cfg.N * 91 + H.i * 7), ids = H.mem.map(m => m.wish); const pool = GIFTS.map(g => g.id).filter(id => !ids.includes(id)); for (let i = pool.length - 1; i > 0; i--) { const j = (R() * (i + 1)) | 0; [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const all = ids.concat(pool.slice(0, G.cfg.decoys)); for (let i = all.length - 1; i > 0; i--) { const j = (R() * (i + 1)) | 0; [all[i], all[j]] = [all[j], all[i]]; } return all; }
const cellAt = (R, x, z) => { const cx = Math.floor(x + 0.5), cz = Math.floor(z + 0.5); return cz < 0 || cx < 0 || cz >= R.D || cx >= R.W ? 1 : R.g[cz][cx]; };
function inStep(G, dt) { const I = G.in, R = I.H.room, m = Math.hypot(G.stick.x, G.stick.y), run = m > 0.7, sp = m < 0.15 ? 0 : run ? 3.2 : 1.7 * Math.min(1, m / 0.5 + 0.2), qk = G.cfg.quiet * (1 - 0.15 * upLv('boots')) * (G.free ? 0 : 1);
  I.bumpT -= dt;
  // 25 Nov 2026 ("Inverted joystick"): measured with the camera, the stick pushed RIGHT walked Santa to the LEFT of the screen (the room is drawn
  // with x turned over, and the flying had been measured but never the walking). The stick's right is the screen's right now.
  if (sp > 0) { const dx = -G.stick.x / m * sp * dt, dz = -G.stick.y / m * sp * dt; I.face = Math.atan2(dx, dz);
    const tryMove = (nx, nz) => { const c = [[0.3, 0.3], [-0.3, 0.3], [0.3, -0.3], [-0.3, -0.3]].some(([ox, oz]) => cellAt(R, nx + ox, nz + oz) !== 0); return !c; };
    let moved = false; if (tryMove(I.x + dx, I.z + dz)) { I.x += dx; I.z += dz; moved = true; } else if (tryMove(I.x + dx, I.z)) { I.x += dx; moved = true; } else if (tryMove(I.x, I.z + dz)) { I.z += dz; moved = true; }
    if (!moved || moved && !tryMove(I.x + dx * 2, I.z + dz * 2) && run) { if (I.bumpT <= 0) { I.bumpT = 0.6; const n = (run ? 0.32 : 0.12) * qk; I.noise += n; if (n > 0) G.ev.push({ k: 'bump', n }); } }
    if (run) I.noise += 0.6 * dt * qk; }
  // creaky boards
  const cx = Math.floor(I.x + 0.5), cz = Math.floor(I.z + 0.5), on = R.creak.find(c => c.x === cx && c.z === cz);
  if (on && I.onCreak !== on) { I.noise += 0.45 * qk; G.ev.push({ k: 'creak' }); } I.onCreak = on || null;
  // the cat: wanders; comes to look at you, and meows unless it has a toy to chase
  const C = R.cat; if (C) { C.t -= dt; if (C.calm > 0) C.calm -= dt; if (C.t <= 0) { C.t = 2 + G.rnd() * 2; C.tx = 1.5 + G.rnd() * (R.W - 3); C.tz = 2.5 + G.rnd() * (R.D - 4); }
    const near = Math.hypot(I.x - C.x, I.z - C.z) < 1.6; if (near && C.calm <= 0) { C.meow -= dt; if (C.meow <= 0) { C.meow = 1.4; I.noise += 0.3 * qk; G.ev.push({ k: 'meow' }); } } else C.meow = Math.min(C.meow, 0.3);
    const tx = C.calm > 0 ? C.tx : near || Math.hypot(I.x - C.x, I.z - C.z) < 3.5 ? I.x : C.tx, tz = C.calm > 0 ? C.tz : near || Math.hypot(I.x - C.x, I.z - C.z) < 3.5 ? I.z : C.tz, d = Math.hypot(tx - C.x, tz - C.z), cs = C.calm > 0 ? 2.6 : 0.9;
    if (d > 0.6) { const nx = C.x + (tx - C.x) / d * cs * dt, nz = C.z + (tz - C.z) / d * cs * dt; if (cellAt(R, nx, nz) === 0 || cellAt(R, nx, nz) === 2) { C.x = nx; C.z = nz; } else C.t = 0; } }
  I.noise = Math.max(0, I.noise - 0.2 * dt); I.stir = I.noise > 0.6 ? 1 : 0;
  if (I.noise >= 1) { G.wakes++; G.ev.push({ k: 'wake', i: I.H.i }); lessonSee(G, 'wake'); G.phase = 'up'; G.upT = 1.6; G.s.y = I.H.top + 1; G.s.x = I.H.mx; G.s.z = I.H.mz - 4; G.s.yaw = 0; G.in = null; } }
function near(I, x, z, r) { return Math.hypot(I.x - x, I.z - z) <= r; }
function actInside(G) { const I = G.in, R = I.H.room;
  if (R.cat && near(I, R.cat.x, R.cat.z, 1.8) && R.cat.calm <= 0) { R.cat.calm = 12; R.cat.tx = R.fire.x > 5 ? 1.5 : R.W - 2.5; R.cat.tz = R.D - 2.5; R.cat.t = 12; G.ev.push({ k: 'toy' }); return; }
  if (Math.abs(I.x - R.tree.x) <= 1.6 && Math.abs(I.z - R.tree.z) <= 1.6) {
    if (I.hold) { I.placed.push(I.hold); G.ev.push({ k: 'place', id: I.hold, ok: wantsLeft(I).includes(I.hold) || I.H.mem.some(m => m.wish === I.hold) && countOf(I.placed, I.hold) <= countOf(I.H.mem.map(m => m.wish), I.hold) }); I.hold = null; lessonSee(G, 'place'); }
    else if (I.placed.length) { const id = I.placed.pop(); I.hold = id; G.ev.push({ k: 'pick', id }); }
    return; }
  const st = R.stock.find(s => !s.full && Math.abs(I.x - s.x) <= 1.5 && Math.abs(I.z - (s.z + 1)) <= 1.5); if (st) { st.full = true; G.ev.push({ k: 'stocking', name: st.name }); return; }
  if (Math.abs(I.x - R.fire.x) <= 1.5 && Math.abs(I.z - (R.fire.z + 1)) <= 1.5) { const miss = houseLeft(I);
    if (miss.length) { G.ev.push({ k: 'notyet', what: miss }); return; }
    G.done.push(I.H.i); G.ev.push({ k: 'delivered', i: I.H.i, n: G.done.length }); lessonSee(G, 'delivered'); G.phase = 'up'; G.upT = 1.2; G.s.y = I.H.top + 1.2; G.s.x = I.H.mx; G.s.z = I.H.mz; G.in = null;
    if (G.done.length >= G.V.length && !G.lesson) finish(G, true, 'all'); } }
const countOf = (a, id) => a.filter(q => q === id).length;
function wantsLeft(I) { const want = I.H.mem.map(m => m.wish), left = want.slice(); for (const p of I.placed) { const k = left.indexOf(p); if (k >= 0) left.splice(k, 1); } return left; }
function houseLeft(I) { const out = [], left = wantsLeft(I), wrong = I.placed.length - (I.H.mem.length - left.length); if (left.length) out.push(`${left.length} present${left.length > 1 ? 's' : ''} still to leave`); if (wrong > 0) out.push(`${wrong} wrong present${wrong > 1 ? 's' : ''} under the tree (ACT there to pick one up)`);
  const ns = I.H.room.stock.filter(s => !s.full).length; if (ns) out.push(`${ns} stocking${ns > 1 ? 's' : ''} to fill`); if (I.hold) out.push('a present still in your hands'); return out; }
function finish(G, win, why) { if (G.over) return; G.over = win ? 'won' : 'lost'; const left = Math.max(0, G.dawn - G.clock);
  const stars = win ? (G.wakes === 0 && left > G.dawn * 0.25 ? 3 : G.wakes <= 1 ? 2 : 1) : 0;
  G.res = { win, why, stars, done: G.done.length, of: G.V.length, wakes: G.wakes, left, coins: win ? 10 + stars * 6 + G.V.length * 3 : 2 + G.done.length };
  G.ev.push({ k: win ? 'won' : 'lost', why }); }
function winNow(G) { if (!G || G.over || G.lesson) return; G.done = G.V.map(h => h.i); finish(G, true, 'all'); }
// ---------- lessons (levels 1-3) ----------
const AIMCARD = {"pic": "🎅", "win": "LEAVE THE RIGHT PRESENTS", "lose": "WAKE THEM, OR TIME RUNS OUT", "how": "LAND, SNEAK IN, GIVE GIFTS"};      // the aim card: specs/aims.json (tools/aims.py)
const LESSONS = {
  1: [{ id: 'land', title: 'LAND ON THE ROOF', say: G => santaCue(G)[0], do: G => santaCue(G)[1], at: G => santaCue(G)[2], how: 'Hold FORWARD and steer with the stick towards the glowing house. Over its marker, let go of FORWARD and push the stick down: the sleigh comes down onto the roof. Land once.', need: 1 }],
  2: [{ id: 'gifts', title: 'THE RIGHT PRESENTS', say: G => santaCue(G)[0], do: G => santaCue(G)[1], at: G => santaCue(G)[2], how: 'Inside, read the wish list. Tap a present in your sack, walk to the tree and press ACT. Fill each stocking (ACT by it), then ACT at the fireplace. Deliver one house.', need: 1 }],
  3: [{ id: 'sneak', title: 'TIPTOE', say: G => santaCue(G)[0], do: G => santaCue(G)[1], at: G => santaCue(G)[2], how: 'Push gently to tiptoe. Go round furniture and the dark creaky boards; watch the noise meter. Deliver one house without waking anyone.', need: 1 }],
};
function lessonStart(G) { const st = LESSONS[G.N][0]; G.lesson = { steps: LESSONS[G.N], i: 0, n: 0, id: st.id, need: st.need }; G.ev.push({ k: 'lessonnext', first: true }); }
function lessonSee(G, what) { const D = G.lesson; if (!D || D.done) return; let good = false;
  if (D.id === 'land' && what === 'land') good = true;
  if ((D.id === 'gifts' || D.id === 'sneak') && what === 'delivered') good = true;
  if (what === 'wake') G.ev.push({ k: 'lessonmiss', how: 'Someone woke up! That house starts again: tiptoe (push gently) and keep away from creaky boards.' });
  if (good) { D.n++; G.ev.push({ k: 'lessonok', n: D.n, need: D.need }); if (D.n >= D.need) { D.done = true; D.wait = 1.6; } } }
function lessonTick(G, dt) { const D = G.lesson; if (!D.done) return; D.wait -= dt; if (D.wait > 0) return; G.lesson = null; G.done = []; G.wakes = 0; G.clock = 0; G.phase = 'fly'; G.in = null; G.go = false; G.s = { x: 0, z: -20, y: CRUISE, yaw: 0, v: 0, vy: 0, boost: 0, state: 'fly', t: 0 }; G.ev.push({ k: 'lessondone', N: G.N }); }

// ---------- for the robots: blind moves and an honest Santa ----------
const BLIND = {
  f: G => { goOn(G, true); G.blind.lr = 0.4 + Math.random() * 2.6; },                         // hold FORWARD a while
  a: G => { const a = Math.random() * TAU; setStick(G, Math.cos(a), Math.sin(a)); },           // push the stick anywhere
  t: G => { const a = Math.random() * TAU; setStick(G, Math.cos(a) * 0.45, Math.sin(a) * 0.45); },   // a gentle push anywhere
  o: G => setStick(G, 0, 0),                                                                 // let go of the stick
  l: G => setStick(G, (Math.random() - 0.5) * 0.5, -1),                                       // push the stick down (dive)
  c: G => act(G),                                                                            // ACT
  p: G => { if (G.in) holdGift(G, G.in.sack[(Math.random() * G.in.sack.length) | 0]); },     // tap a present in the sack
};
// HONEST: a Santa who looks: flies to the nearest house left (above the roofs), stops over its marker (a little off, by acc) and comes down, wriggles down
// narrow chimneys, inside walks the quiet way round (furniture, creaky boards and the cat), reads the wish list (sometimes
// picks a wrong present and puts it right), fills the stockings and goes back up.
// THE TUTORIAL SHOWS THE ONE MOVE TO MAKE NOW (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing happens"). Inside, it said
// TAP A PRESENT, ACT (which present? where?) and PUSH GENTLY with a hand pushing up in a box. Now the robot is asked (dryPlanAll): TAP THIS
// PRESENT (the hand on it in the sack), TAP ACT, HOLD FORWARD, STEER / WALK / TIPTOE THIS WAY on the stick, STICK DOWN: LAND, LET GO OF FORWARD.
const SNC = { t: -1e9, v: null };
function santaCue(G) { if (G.over || G.wait > 0) return ['WAIT…', 'wait', false]; const now = performance.now(); if (now - SNC.t < 150) return SNC.v; SNC.t = now; const all = dryPlanAll(G, null, { t: -1, next: -1 }), last = n => all.filter(q => q[0] === n).pop(), L = layout(G);
  const hg = last('holdGift'), ac = last('act'), go = last('goOn'), st = last('setStick'), sx = st ? st[1] : 0, sy = st ? st[2] : 0, S2 = L.stick, r = S2.r * 0.8, inside = G.phase === 'in', sneak = G.lesson && G.lesson.id === 'sneak'; let v = ['WAIT…', 'wait', false];
  const gift = hg && ui.sackR.find(q => q.id === hg[1]);
  if (gift) v = ['TAP THIS PRESENT', 'tap', [gift.x, gift.y]];
  else if (ac) v = ['TAP ACT', 'tap', [L.btn.x, L.btn.y]];
  else if (go && go[1] && !G.go) v = ['HOLD FORWARD', 'hold', [L.btn.x, L.btn.y]];
  else if (Math.hypot(sx, sy) > 0.25) v = [!inside && sy < -0.5 && !G.go ? 'STICK DOWN: LAND' : inside ? (sneak ? 'TIPTOE THIS WAY' : 'WALK THIS WAY') : 'STEER THIS WAY', 'drag', [S2.x, S2.y, S2.x + sx * r, S2.y - sy * r]];
  else if (go && !go[1] && G.go) v = ['LET GO OF FORWARD', 'release', [L.btn.x, L.btn.y]];
  else if (G.go) v = ['KEEP HOLDING', 'hold', [L.btn.x, L.btn.y]];
  SNC.v = v; return v; }
function honest(G, o, mem) { if (G.over) return; const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random;
  if (G.phase === 'fly') { const s = G.s; if (mem.tgt == null || G.done.includes(mem.tgt)) { const left = G.V.filter(h => !G.done.includes(h.i)); left.sort((a, b) => Math.hypot(a.x - s.x, a.z - s.z) - Math.hypot(b.x - s.x, b.z - s.z)); mem.tgt = left.length ? left[0].i : null; mem.off = { x: (R() - 0.5) * (1 - acc) * 9, z: (R() - 0.5) * (1 - acc) * 9 }; }
    if (mem.tgt == null) { ACT.setStick(G, 0, 0); return; } const H = G.V[mem.tgt], tx = H.mx + mem.off.x, tz = H.mz + mem.off.z, dx = tx - s.x, dz = tz - s.z, d = Math.hypot(dx, dz);
    // turn to it, hold FORWARD until it is time to slow, keep above the roofs on the way, and over the marker come down
    const want = Math.atan2(dx, dz), rel = Math.atan2(Math.sin(want - s.yaw), Math.cos(want - s.yaw)), overR = Math.max(0.7, G.cfg.marker * 0.5), over = d < overR, near = d < 9, wantY = over ? H.top - 1 : near ? H.top + 3.2 : 13;
    ACT.goOn(G, !over && Math.abs(rel) < 1.1 && d > Math.max(overR * 0.9, s.v * 0.44 + react * 1.2));      /* (from a stop he creeps on until he is over it: there is no gap between 'still coming' and 'over it') */
    ACT.setStick(G, clamp(rel * 1.7, -1, 1) * (d < 1 ? 0.3 : 1), over && s.v < 2.6 ? -1 : over ? 0 : clamp((wantY - s.y) * 0.5, -1, 1));
    if (d < 0.6 || (s.bump > 0 && d < 4)) mem.off = { x: 0, z: 0 };      /* bounced off the roof beside the marker: he looks again and aims at the marker itself */
    return; }
  if (G.phase === 'roof') { ACT.goOn(G, false); ACT.setStick(G, 0, 1); if (G.roof.narrow) ACT.act(G); return; }
  if (G.phase !== 'in') { ACT.goOn(G, false); ACT.setStick(G, 0, 0); return; }
  ACT.goOn(G, false); const I = G.in, Rm = I.H.room;
  // what next: a present in hand to the tree; else pick the next wanted present; else a stocking; else the fireplace
  if (mem.house !== I.H.i || mem.inT > G.t || mem.entered !== G.in) { mem.house = I.H.i; mem.entered = G.in; mem.path = null; mem.goal = null; mem.rush = R() < (1 - acc) * 0.9; mem.careless = R() < (1 - acc) * 1.2; } mem.inT = G.t;
  const left = wantsLeft(I), wrong = I.placed.length - (I.H.mem.length - left.length);
  let goal, todo;
  if (Rm.cat && Rm.cat.calm <= 0 && Math.hypot(I.x - Rm.cat.x, I.z - Rm.cat.z) < 1.7) { ACT.act(G); return; }
  if (I.hold && !left.includes(I.hold) && wrong === 0 && mem.erredHeld !== I.hold) { mem.erredHeld = I.hold; goal = treeSpot(Rm, I); todo = 'tree'; }      // (an honest mistake: it goes under the tree, then gets noticed)
  else if (I.hold && !left.includes(I.hold)) { ACT.holdGift(G, left.length ? left[0] : null); return; }      // a wrong present in hand: swap it for the right one
  else if (I.hold) { goal = treeSpot(Rm, I); todo = 'tree'; }
  else if (wrong > 0) { goal = treeSpot(Rm, I); todo = 'pick'; }
  else if (left.length) { const pickWrong = R() < (1 - acc) * 0.25 && !mem.erred; const id = pickWrong ? I.sack.find(q => !I.H.mem.some(m => m.wish === q)) : left[0]; if (pickWrong) mem.erred = true; ACT.holdGift(G, id); return; }
  else { const st = Rm.stock.find(s => !s.full); if (st) { goal = spotNear(Rm, I, st.x, st.z + 1, 1.5); todo = 'stock'; } else { goal = spotNear(Rm, I, Rm.fire.x, Rm.fire.z + 1, 1.5); todo = 'fire'; } }
  const atGoal = Math.hypot(I.x - goal.x, I.z - goal.z) < 0.35;
  if (atGoal) { ACT.setStick(G, 0, 0); if (mem.actT == null) mem.actT = G.t + 0.1 + R() * react * 0.5; if (G.t >= mem.actT) { mem.actT = null; ACT.act(G); } return; }
  mem.actT = null;
  if (!mem.path || mem.goalKey !== goal.x + ',' + goal.z || !mem.path.length) { mem.goalKey = goal.x + ',' + goal.z; mem.path = findPath(Rm, I, goal, mem.careless); }
  if (!mem.path || !mem.path.length) { ACT.setStick(G, 0, 0); return; }
  const wp = mem.path[0], dx = wp.x - I.x, dz = wp.z - I.z, d = Math.hypot(dx, dz); if (d < 0.18) { mem.path.shift(); return; }
  const sp = mem.rush ? 1 : 0.5; ACT.setStick(G, -dx / d * sp, -dz / d * sp); }      /* (the stick's right is the screen's right: the rules' x runs the other way indoors) */
function treeSpot(R, I) { return spotNear(R, I, R.tree.x, R.tree.z, 1.6); }
// the nearest quiet cell you can walk to (no furniture, no creaky board) from which ACT reaches (tx, tz)
function spotNear(R, I, tx, tz, r) { const sx = Math.round(I.x), sz = Math.round(I.z), key = (x, z) => x + ',' + z, seen = new Set([key(sx, sz)]), q = [[sx, sz]], bad = new Set(R.creak.map(c => key(c.x, c.z)));
  while (q.length) { const [x, z] = q.shift(); if (Math.abs(x - tx) <= r - 0.38 && Math.abs(z - tz) <= r - 0.38) return { x, z };
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, nz = z + dz, k = key(nx, nz); if (seen.has(k) || !(R.g[nz] && R.g[nz][nx] === 0) || bad.has(k)) continue; seen.add(k); q.push([nx, nz]); } }
  return { x: Math.round(tx), z: Math.round(tz) + 1 }; }
function findPath(R, I, goal, careless) { const sx = Math.round(I.x), sz = Math.round(I.z), key = (x, z) => x + ',' + z, prev = new Map([[key(sx, sz), null]]), q = [[sx, sz]], bad = new Set(careless ? [] : R.creak.map(c => key(c.x, c.z)));
  const ok = (x, z) => R.g[z] && R.g[z][x] === 0 && !bad.has(key(x, z));
  while (q.length) { const [x, z] = q.shift(); if (x === goal.x && z === goal.z) break; for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, nz = z + dz, k = key(nx, nz); if (prev.has(k) || !ok(nx, nz) && !(nx === goal.x && nz === goal.z)) continue; prev.set(k, [x, z]); q.push([nx, nz]); } }
  if (!prev.has(key(goal.x, goal.z))) return null; const out = []; let c = [goal.x, goal.z]; while (c) { out.unshift({ x: c[0], z: c[1] }); c = prev.get(key(c[0], c[1])); } if (out.length > 1 && Math.hypot(out[0].x - I.x, out[0].z - I.z) < 0.6) out.shift(); return out; }

// what the robot would do now, without doing it (tools/dry_plan.py): the tutorial shows this move
const ACT_REAL = { setStick, goOn, act, holdGift }; let ACT = ACT_REAL;
function dryPlan(G, o, mem) { let got = null; const rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { if (!got && !(a.length > 2 && a.slice(1).every(v => v === 0 || v === false))) got = [n, ...a.slice(1)]; return true; };      /* (a stick at rest, all its numbers 0, is not a move; a first bed, number 0, is) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return got; }
function dryPlanAll(G, o, mem) { const all = [], rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { all.push([n, ...a.slice(1)]); return true; };      /* every call, in order (for a robot that steers and drifts at once) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return all; }
