// ===================== RULES: Star Miner (game 42) =====================
// A little mining ship in an asteroid field. One floating stick flies it (put a thumb down anywhere and drag: it flies that
// way, faster the further). The mining laser fires by itself at the nearest rock in reach: big rocks crack into smaller ones,
// small ones burst into ore. Fly over ore to scoop it (the magnet pulls it in) until the hold is full, then fly home into the
// green ring under the mothership to unload it (and patch one dent in the hull). Deliver the ore the level asks for before the
// mothership jumps away. Gold rocks give gold, crystal rocks give gems. Meteors streak across (a red line warns where); pirates
// come for your cargo and shoot slow bolts: a hit dents the hull and spills some of what you carry. Fly close to a pirate and
// your laser turns on it. Upgrades stay; ships to collect.
// World: metres on a flat plane; x across (+ right), z toward the camera (+ down the screen). The dock ring is at (0, 6).
const RULES = [
  '<b>Drag anywhere</b> to fly: the ship goes the way you drag, faster the further. Let go to drift.',
  'Your <b>laser</b> fires by itself at the nearest rock in reach. Rocks crack, then burst into <b>ore</b>.',
  '<b>Fly over ore</b> to scoop it. When the hold is full, fly into the <b>green ring</b> at the mothership to unload.',
  'Deliver the ore asked before the <b>mothership jumps</b>. Docking also patches one dent.',
  '<b>Meteors</b> (a red line warns) and <b>pirate bolts</b> dent the hull and spill cargo. Fly close to a pirate to laser it.',
];
const SHIPS = [{ id: 'sparrow', name: 'Sparrow', col: 0xf2f2f2, col2: 0xffb030, stars: 0 }, { id: 'hauler', name: 'Hauler', col: 0xf2c030, col2: 0x3a3a44, stars: 4 },
  { id: 'comet', name: 'Comet', col: 0x3ad0ff, col2: 0xffffff, stars: 10 }, { id: 'raven', name: 'Raven', col: 0x2a2a34, col2: 0xff3a5a, stars: 18 },
  { id: 'nova', name: 'Nova', col: 0xff7ad0, col2: 0x7a3aff, stars: 28 }, { id: 'titan', name: 'Titan', col: 0x9aa4b0, col2: 0x40ff9a, stars: 40 }];
const PLACES = [{ name: 'The Rust Belt', rock: 0x7a6250, neb: 0x3a1a4a }, { name: 'The Ice Ring', rock: 0x8aa4b8, neb: 0x10305a }, { name: 'Crystal Reach', rock: 0x6a5a7a, neb: 0x4a1060 }, { name: 'Pirate Nebula', rock: 0x6a4a44, neb: 0x5a1010 }];
const placeOf = N => Math.floor((N - 1) / 5) % PLACES.length;
const UPGRADES = [
  { id: 'laser', name: 'Hot laser', desc: 'Cracks rocks (and pirates) faster.', max: 3, cost: l => 20 + l * 25 },
  { id: 'hold', name: 'Bigger hold', desc: 'Carry 3 more ore each trip.', max: 3, cost: l => 20 + l * 25 },
  { id: 'magnet', name: 'Magnet', desc: 'Pulls ore in from further away.', max: 2, cost: l => 25 + l * 30 },
  { id: 'hull', name: 'Plating', desc: 'One more dent before the hull gives.', max: 2, cost: l => 35 + l * 35 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Rookie'], [40, 'Prospector'], [130, 'Rock breaker'], [320, 'Star miner'], [700, 'Belt baron'], [1500, 'Legend of the void']];
function myShip() { if (typeof HEADLESS !== 'undefined' && HEADLESS) return SHIPS[0]; const id = store.get('ship', 'sparrow'); return SHIPS.find(s => s.id === id) || SHIPS[0]; }
const DOCK = { x: 0, z: 6 }, DOCK_R = 1.9, FIELD = { x: 22, z0: -32, z1: 11 };
const SIZES = [{ r: 0.5, hp: 0.7 }, { r: 0.85, hp: 1.3 }, { r: 1.35, hp: 2.2 }];      // small, medium, big
function makeCfg(N, help) {
  const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), e = easyOf(N);
  const goal = Math.round(x(18, 64, 30));
  return { N, f, help: !!help, place: placeOf(N), goal,
    time: Math.round((22 + goal * 2.3) * (1 + 0.15 * e) * (help ? 1.2 : 1)),
    rocks: Math.round(x(15, 24, 30)), gold: x(0.08, 0.18, 30), crystal: N >= 3 ? x(0.03, 0.12, 30) : 0,
    meteor: N >= 2 ? x(7.5, 2.8, 30) * (1 + 0.4 * e) * (help ? 1.3 : 1) : 0, metSp: x(7, 12, 30),
    pirates: N >= 4 ? Math.round(x(1, 4, 30)) : 0, pirEvery: x(26, 12, 30) * (1 + 0.3 * e), boltEvery: x(2.6, 1.4, 30) * (help ? 1.25 : 1), boltSp: x(6.5, 9, 30),
    hull: 3 + upLv('hull'), hold: 6 + 3 * upLv('hold'), dps: 1.5 * (1 + 0.3 * upLv('laser')), reach: 5.2, magnet: 1.7 + 0.8 * upLv('magnet'),
    acc: 16, top: 8.5 };
}
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, place: cfg.place, ship: o.ship || myShip(),
    me: null, stick: { x: 0, z: 0 }, rocks: [], ore: [], mets: [], pirates: [], bolts: [], warn: [], delivered: 0, trips: 0, mined: 0, dents: 0, spilled: 0, kills: 0, coins: 0, gems: 0, left: cfg.time, metT: 3, pirT: 0, nid: 1, beam: null };
  reset(G); fillField(G);
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else G.ev.push({ k: 'start' });
  return G;
}
function reset(G) { G.me = { x: 0, z: 4.2, vx: 0, vz: -1, hull: G.cfg.hull, cargo: 0, load: 0, inv: 0, face: -Math.PI / 2 }; }
function addRock(G, x, z, size, kind) { const R = G.rnd, S = SIZES[size]; const r = { id: G.nid++, x, z, vx: (R() - 0.5) * 0.4, vz: (R() - 0.5) * 0.4, size, r: S.r * (0.9 + R() * 0.2), hp: S.hp * (kind === 'crystal' ? 2 : 1), kind, spin: R() * 6, seed: (R() * 1e6) | 0, hit: 0 }; r.max = r.hp; G.rocks.push(r); return r; }
function fillField(G) { const c = G.cfg, R = G.rnd; G.rocks = [];
  for (let i = 0; i < c.rocks; i++) { let x, z, n = 0; do { x = (R() * 2 - 1) * (FIELD.x - 2); z = FIELD.z0 + 2 + R() * (FIELD.z1 - FIELD.z0 - 9); n++; } while (n < 30 && (Math.hypot(x - DOCK.x, z - DOCK.z) < 7 || G.rocks.some(q => Math.hypot(q.x - x, q.z - z) < q.r + 2.2)));
    const q = R(), kind = q < c.crystal ? 'crystal' : q < c.crystal + c.gold ? 'gold' : 'rock'; addRock(G, x, z, R() < 0.55 ? 2 : 1, kind); } }
// ---------- your thumb ----------
function setStick(G, x, z) { const L = Math.hypot(x, z); G.stick = L > 1 ? { x: x / L, z: z / L } : { x, z }; }
// ---------- the field, step by step ----------
function step(G, dt) {
  if (G.over) return; G.t += dt; const c = G.cfg, m = G.me, R = G.rnd;
  if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0 && G.lessonEnd) { G.lessonEnd = false; Object.assign(G, { ore: [], mets: [], pirates: [], bolts: [], warn: [], delivered: 0, trips: 0, mined: 0, dents: 0, spilled: 0, kills: 0, coins: 0, gems: 0, left: c.time, metT: 3, pirT: 0 }); reset(G); fillField(G); G.ev.push({ k: 'start' }); } if (G.wait > 0) return; }
  if (!G.lesson) { G.left -= dt; if (G.left <= 0) { G.left = 0; return finish(G, false, 'time'); } }
  // the ship: thrust toward the stick, a little drag, a top speed; soft walls at the field's edge
  const s = G.stick, sp = c.top; m.vx += s.x * c.acc * dt; m.vz += s.z * c.acc * dt; const dr = Math.hypot(s.x, s.z) > 0.05 ? 1.2 : 2.2; m.vx *= Math.max(0, 1 - dr * dt); m.vz *= Math.max(0, 1 - dr * dt);
  const v = Math.hypot(m.vx, m.vz); if (v > sp) { m.vx *= sp / v; m.vz *= sp / v; } if (v > 0.4) m.face = Math.atan2(m.vz, m.vx);
  m.x += m.vx * dt; m.z += m.vz * dt;
  if (Math.abs(m.x) > FIELD.x) { m.x = Math.sign(m.x) * FIELD.x; m.vx *= -0.4; } if (m.z < FIELD.z0) { m.z = FIELD.z0; m.vz *= -0.4; } if (m.z > FIELD.z1) { m.z = FIELD.z1; m.vz *= -0.4; }
  m.inv = Math.max(0, m.inv - dt);
  // rocks drift and spin; the ship bounces off them
  for (const r of G.rocks) { r.x += r.vx * dt; r.z += r.vz * dt; r.vx *= 1 - 0.3 * dt; r.vz *= 1 - 0.3 * dt; r.spin += dt * 0.3; r.hit = Math.max(0, r.hit - dt * 4);
    const dx = m.x - r.x, dz = m.z - r.z, d = Math.hypot(dx, dz), mn = r.r + 0.45; if (d < mn && d > 1e-6) { const nx = dx / d, nz = dz / d, vn = m.vx * nx + m.vz * nz; m.x = r.x + nx * mn; m.z = r.z + nz * mn; if (vn < 0) { m.vx -= 1.6 * vn * nx; m.vz -= 1.6 * vn * nz; if (vn < -3) G.ev.push({ k: 'bump', x: m.x, z: m.z }); } } }
  // the laser: a pirate in reach first, then the nearest rock
  let tgt = null, td = c.reach; for (const p of G.pirates) { const d = Math.hypot(p.x - m.x, p.z - m.z); if (d < td) { td = d; tgt = p; } }
  if (!tgt) for (const r of G.rocks) { const d = Math.hypot(r.x - m.x, r.z - m.z) - r.r * 0.6; if (d < td) { td = d; tgt = r; } }
  G.beam = tgt ? { x: tgt.x, z: tgt.z, id: tgt.id, pir: !!tgt.pir } : null;
  if (tgt) { tgt.hp -= c.dps * dt; tgt.hit = 1; if (tgt.hp <= 0) { if (tgt.pir) killPirate(G, tgt); else crack(G, tgt); } }
  // ore: drifts, slows, the magnet pulls it in, the ship scoops it if the hold has room
  for (let i = G.ore.length - 1; i >= 0; i--) { const o = G.ore[i]; o.t += dt; o.x += o.vx * dt; o.z += o.vz * dt; o.vx *= 1 - 1.5 * dt; o.vz *= 1 - 1.5 * dt; const dx = m.x - o.x, dz = m.z - o.z, d = Math.hypot(dx, dz), room = m.cargo < c.hold;
    if (room && d < c.magnet && o.t > 0.35) { const pull = 9 * (1 - d / c.magnet) + 2; o.x += dx / d * pull * dt; o.z += dz / d * pull * dt; }
    if (d < 0.6 && o.t > 0.35) { if (room) { G.ore.splice(i, 1); m.cargo++; m.load += o.val; G.mined++; if (o.val >= 5) G.gems++; G.ev.push({ k: 'scoop', x: o.x, z: o.z, val: o.val, n: m.cargo, full: m.cargo >= c.hold }); lessonSee(G, 'scoop'); } else if (!G.fullSaid) { G.fullSaid = true; G.ev.push({ k: 'full' }); } }
    if (o.t > 40) G.ore.splice(i, 1); }
  if (m.cargo < c.hold) G.fullSaid = false;
  // home: the ring under the mothership unloads the hold and patches one dent
  if (Math.hypot(m.x - DOCK.x, m.z - DOCK.z) < DOCK_R) { if (m.cargo > 0) { const val = m.load; G.delivered += val; G.coins += Math.ceil(val / 2); G.trips++; G.ev.push({ k: 'dock', val, n: m.cargo, hull: m.hull < c.hull }); m.cargo = 0; m.load = 0; m.hull = Math.min(c.hull, m.hull + 1); lessonSee(G, 'dock');
      if (!G.lesson && G.delivered >= c.goal) return finish(G, true); } }
  // meteors: a warning line, then a rock streaks across
  if ((c.meteor || (G.lesson && lessonNow(G).id === 'dodge')) && !G.lessonEnd) { G.metT -= dt; if (G.metT <= 0) { G.metT = G.lesson ? 2.4 : c.meteor * (0.7 + R() * 0.6); spawnMeteor(G); } }
  for (let i = G.warn.length - 1; i >= 0; i--) { const w = G.warn[i]; w.t -= dt; if (w.t <= 0) { G.warn.splice(i, 1); G.mets.push({ id: G.nid++, x: w.x, z: w.z, vx: w.vx, vz: w.vz, r: 0.6, t: 0, near: 0 }); G.ev.push({ k: 'meteor', x: w.x, z: w.z }); } }
  for (let i = G.mets.length - 1; i >= 0; i--) { const q = G.mets[i]; q.t += dt; q.x += q.vx * dt; q.z += q.vz * dt; const d = Math.hypot(q.x - m.x, q.z - m.z);
    if (d < q.r + 0.4 && !m.inv) { G.mets.splice(i, 1); dent(G, q.x, q.z, 'meteor'); if (G.over) return; continue; } if (d < 2.4) q.near = 1; else if (q.near === 1 && d > 2.6) { q.near = 2; G.ev.push({ k: 'dodge', x: m.x, z: m.z }); lessonSee(G, 'dodge'); }
    if (q.t > 12 || Math.abs(q.x) > 40 || q.z < -50 || q.z > 30) G.mets.splice(i, 1); }
  // pirates: come in from the dark, keep a distance, shoot slow bolts at where you are going
  if (c.pirates && !G.lesson) { G.pirT -= dt; if (G.pirT <= 0 && G.pirates.length < c.pirates) { G.pirT = c.pirEvery; spawnPirate(G); } }
  for (const p of G.pirates) { const dx = m.x - p.x, dz = m.z - p.z, d = Math.hypot(dx, dz) || 1, want = 7, sgn = d > want ? 1 : -0.6, side = p.side; p.vx += (dx / d * sgn + -dz / d * side * 0.6) * 5 * dt; p.vz += (dz / d * sgn + dx / d * side * 0.6) * 5 * dt; const pv = Math.hypot(p.vx, p.vz); if (pv > 5) { p.vx *= 5 / pv; p.vz *= 5 / pv; } p.x += p.vx * dt; p.z += p.vz * dt; p.hit = Math.max(0, p.hit - dt * 4);
    p.fire -= dt; if (p.fire <= 0 && d < 13) { p.fire = c.boltEvery * (0.8 + R() * 0.4); const tl = d / c.boltSp, ax = m.x + m.vx * tl * 0.6 - p.x, az = m.z + m.vz * tl * 0.6 - p.z, L = Math.hypot(ax, az) || 1; G.bolts.push({ x: p.x, z: p.z, vx: ax / L * c.boltSp, vz: az / L * c.boltSp, t: 0, near: 0 }); G.ev.push({ k: 'shoot', x: p.x, z: p.z }); } }
  for (let i = G.bolts.length - 1; i >= 0; i--) { const b = G.bolts[i]; b.t += dt; b.x += b.vx * dt; b.z += b.vz * dt; const d = Math.hypot(b.x - m.x, b.z - m.z);
    if (d < 0.55 && !m.inv) { G.bolts.splice(i, 1); dent(G, b.x, b.z, 'bolt'); if (G.over) return; continue; } if (d < 1.8) b.near = 1; else if (b.near === 1 && d > 2) { b.near = 2; G.ev.push({ k: 'dodge', x: m.x, z: m.z }); }
    if (b.t > 4) G.bolts.splice(i, 1); }
  if (G.lesson) lessonTick(G, dt);
  else if (G.rocks.filter(r => r.size).length < 4 && G.rnd() < dt * 0.5) refill(G);
}
// more rocks drift in from the far side when the field is nearly mined out
function refill(G) { const R = G.rnd, c = G.cfg, x = (R() * 2 - 1) * (FIELD.x - 3), z = FIELD.z0 + 1 + R() * 6; if (G.rocks.some(q => Math.hypot(q.x - x, q.z - z) < 4)) return; const q = R(); addRock(G, x, z, 2, q < c.crystal ? 'crystal' : q < c.crystal + c.gold ? 'gold' : 'rock'); }
function spawnMeteor(G) { const R = G.rnd, m = G.me, c = G.cfg, sp = G.lesson ? 7 : c.metSp, side = R() < 0.5 ? -1 : 1, aim = { x: m.x + (R() - 0.5) * 3, z: m.z + (R() - 0.5) * 3 }, sx = side * 30, sz = aim.z + (R() - 0.5) * 16, L = Math.hypot(aim.x - sx, aim.z - sz);
  const vx = (aim.x - sx) / L * sp, vz = (aim.z - sz) / L * sp, lead = 1.1; G.warn.push({ x: sx, z: sz, vx, vz, t: lead }); G.ev.push({ k: 'warn', x: aim.x, z: aim.z }); }
function spawnPirate(G) { const R = G.rnd, a = R() * Math.PI, m = G.me; G.pirates.push({ id: G.nid++, pir: true, x: m.x + Math.cos(a) * 18 * (R() < 0.5 ? -1 : 1), z: m.z - 16 - R() * 4, vx: 0, vz: 0, hp: 2.2, max: 2.2, fire: 2.5, side: R() < 0.5 ? -1 : 1, hit: 0 }); G.ev.push({ k: 'pirate' }); }
// a rock gives way: big into two medium, medium into two small, small into ore
function crack(G, r) { const R = G.rnd; G.rocks.splice(G.rocks.indexOf(r), 1); G.ev.push({ k: 'crack', x: r.x, z: r.z, size: r.size, kind: r.kind });
  if (r.size > 0) { for (const s of [-1, 1]) { const a = R() * TAU, q = addRock(G, r.x + Math.cos(a) * r.r * 0.4 * s, r.z + Math.sin(a) * r.r * 0.4 * s, r.size - 1, r.kind); q.vx = Math.cos(a) * s * 1.2; q.vz = Math.sin(a) * s * 1.2; } return; }
  const n = r.kind === 'rock' ? 1 + (R() < 0.5 ? 1 : 0) : 1, val = r.kind === 'crystal' ? 5 : r.kind === 'gold' ? 3 : 1; for (let i = 0; i < n; i++) { const a = R() * TAU, s = 1.5 + R() * 1.5; G.ore.push({ id: G.nid++, x: r.x, z: r.z, vx: Math.cos(a) * s, vz: Math.sin(a) * s, val, t: 0 }); } }
function killPirate(G, p) { const R = G.rnd; G.pirates.splice(G.pirates.indexOf(p), 1); G.kills++; G.coins += 4; G.ev.push({ k: 'boom', x: p.x, z: p.z });
  for (let i = 0; i < 3; i++) { const a = R() * TAU; G.ore.push({ id: G.nid++, x: p.x, z: p.z, vx: Math.cos(a) * 2, vz: Math.sin(a) * 2, val: 3, t: 0 }); } }
// a hit: a dent in the hull, a moment of safety, some cargo spilled back into space
function dent(G, x, z, why) { const m = G.me, R = G.rnd; m.inv = 1.4; G.dents++;
  const spill = Math.ceil(m.cargo * 0.4); if (spill) { const per = m.load / m.cargo; for (let i = 0; i < spill; i++) { const a = R() * TAU; G.ore.push({ id: G.nid++, x: m.x, z: m.z, vx: Math.cos(a) * 3, vz: Math.sin(a) * 3, val: Math.max(1, Math.round(per)), t: -0.6 }); } m.cargo -= spill; m.load = Math.max(0, m.load - Math.round(per * spill)); G.spilled += spill; }
  const dx = m.x - x, dz = m.z - z, d = Math.hypot(dx, dz) || 1; m.vx += dx / d * 5; m.vz += dz / d * 5;
  if (G.lesson) { G.ev.push({ k: 'dent', x: m.x, z: m.z, why, spill }); lessonMiss(G); return; }
  m.hull--; G.ev.push({ k: 'dent', x: m.x, z: m.z, why, spill, hull: m.hull }); if (m.hull <= 0) finish(G, false, 'wreck'); }
function finish(G, win, why) { const c = G.cfg; G.over = win ? 'won' : 'lost';
  const stars = win ? (G.left >= c.time * 0.35 && G.dents <= 1 ? 3 : G.left >= c.time * 0.15 ? 2 : 1) : 0;
  G.res = { win, why, stars, delivered: G.delivered, goal: c.goal, trips: G.trips, mined: G.mined, dents: G.dents, spilled: G.spilled, kills: G.kills, gems: G.gems, left: Math.round(G.left), time: c.time, coins: G.coins + (win ? 4 + Math.ceil(G.N / 3) + stars : 0) };
  G.ev.push({ k: win ? 'won' : 'lost', why }); return true; }
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'scoop', title: 'FLY AND MINE', say: 'DRAG TO FLY', do: 'drag', dir: 'up', at: G => [W / 2, H * 0.7], how: 'Put your thumb down anywhere and drag to fly. Fly near a rock: your laser cracks it. Scoop up 3 ore in a row, quickly.', need: 3 }],
  2: [{ id: 'dock', title: 'HOME', say: 'FLY INTO THE GREEN', do: 'drag', dir: 'up', how: 'You carry ore. Fly into the green ring under the mothership to unload it. Twice.', need: 2 }],
  3: [{ id: 'dodge', title: 'DODGE', say: 'MOVE OUT OF THE RED', do: 'drag', dir: 'lr', at: G => [W / 2, H * 0.7], how: 'A red line warns where a meteor will fly. Get out of its way. Dodge 2 in a row.', need: 2 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonSetup(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonSetup(G) { const st = lessonNow(G), R = G.rnd; G.ore = []; G.mets = []; G.warn = []; G.bolts = []; G.pirates = []; reset(G); G.metT = 2;
  if (st.id === 'scoop') { G.rocks = []; lessonRock(G); }
  if (st.id === 'dock') { G.me.z = -6; G.me.cargo = 3; G.me.load = 3; G.rocks = G.rocks.filter(r => Math.hypot(r.x, r.z - 0) > 6); }
  if (st.id === 'dodge') { G.me.z = -4; G.rocks = G.rocks.filter(r => Math.hypot(r.x - G.me.x, r.z - G.me.z) > 7); } }
// the first lesson: one small rock at a time, six metres off in a new direction
function lessonRock(G) { const R = G.rnd, m = G.me; for (let n = 0; n < 20; n++) { const a = R() * TAU, x = m.x + Math.cos(a) * 6, z = m.z + Math.sin(a) * 6; if (Math.abs(x) < FIELD.x - 2 && z > FIELD.z0 + 2 && z < 2) { addRock(G, x, z, 0, 'rock'); return; } } addRock(G, m.x, m.z - 6, 0, 'rock'); }
function lessonTick(G, dt) { const st = lessonNow(G), L = G.lesson; if (st.id === 'scoop' && L.n) { L.gap = (L.gap || 0) + dt; if (L.gap > 5) { L.n = 0; L.gap = 0; G.ev.push({ k: 'lessonmiss', how: 'Three in a row, quickly: fly from one ore to the next.' }); } } else L.gap = 0; if (st.id === 'scoop' && !G.rocks.length && !G.ore.length) lessonRock(G);
  if (st.id === 'dock' && G.me.cargo === 0 && Math.hypot(G.me.x - DOCK.x, G.me.z - DOCK.z) > DOCK_R + 1) { G.me.cargo = 3; G.me.load = 3; } }
function lessonSee(G, what) { const st = lessonNow(G); if (!st || st.id !== what) return; G.lesson.n++; G.lesson.gap = 0; if (G.lesson.n < st.need) { G.ev.push({ k: 'lessonok', n: G.lesson.n, need: st.need }); if (what === 'dock') { G.me.z = -6; G.me.vz = 0; } return; }
  G.lesson.i++; G.lesson.n = 0; if (G.lesson.i >= G.lesson.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.lessonEnd = true; G.wait = 1.4; } else lessonSetup(G); }
function lessonMiss(G) { const st = lessonNow(G); if (!st) return; G.lesson.n = 0; G.ev.push({ k: 'lessonmiss', how: st.how }); }
// ---------- for the robots ----------
// BLIND: a thumb that does not look: drags some way (or lets go) and holds it
const BLIND = { d: G => { const R = Math.random; if (R() < 0.2) setStick(G, 0, 0); else { const a = R() * TAU, L = R() < 0.4 ? 1 : 0.4 + R() * 0.5; setStick(G, Math.cos(a) * L, Math.sin(a) * L); } } };
// a pilot who looks: goes for ore, then rocks, home when the hold is full (or time is short); dodges what is coming, a beat late
// and now and then not at all (react, acc); fights a pirate only with the hull to spare
function honest(G, o, mem) {
  const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random, c = G.cfg, m = G.me;
  if (G.over || G.wait > 0) { setStick(G, 0, 0); return; }
  mem.t = (mem.t || 0) - 1 / 60; if (mem.t > 0) return; mem.t = 0.12 + react * 0.4;
  const to = (x, z, slow) => { const dx = x - m.x, dz = z - m.z, d = Math.hypot(dx, dz) || 1; let p = slow ? Math.min(1, d / 3) : 1; return { x: dx / d * p, z: dz / d * p, d }; };
  let goal; const st = lessonNow(G), dDock = Math.hypot(m.x - DOCK.x, m.z - DOCK.z), need = c.goal - G.delivered;
  const home = st ? st.id === 'dock' : m.cargo >= c.hold || (m.cargo > 0 && m.load >= need) || (m.cargo > 0 && G.left < dDock / 6 + 6);
  const pir = G.pirates.reduce((a, p) => { const d = Math.hypot(p.x - m.x, p.z - m.z); return d < (a ? a.d : 1e9) ? { p, d } : a; }, null);
  if (home) goal = to(DOCK.x, DOCK.z, false);
  else if (pir && pir.d < 9 && m.hull >= 2) goal = to(pir.p.x, pir.p.z, true);
  else { const room = m.cargo < c.hold, ore = room ? G.ore.filter(q => q.t > 0).reduce((a, q) => { const d = Math.hypot(q.x - m.x, q.z - m.z) - q.val * 0.6; return d < (a ? a.d : 1e9) ? { q, d } : a; }, null) : null;
    if (ore && ore.d < 12) goal = to(ore.q.x, ore.q.z, false);
    else { const rk = G.rocks.reduce((a, r) => { const d = Math.hypot(r.x - m.x, r.z - m.z) - (r.kind !== 'rock' ? 3 : 0); return d < (a ? a.d : 1e9) ? { r, d } : a; }, null);
      if (rk) { const g = to(rk.r.x, rk.r.z, true); if (g.d < rk.r.r + 2.6) { g.x *= -0.2; g.z *= -0.2; } goal = g; } else goal = to(0, -10, true); } }
  // steer round rocks in the way
  for (const r of G.rocks) { const dx = r.x - m.x, dz = r.z - m.z, d = Math.hypot(dx, dz); if (d > 4 || d < 0.01) continue; const ahead = (dx * goal.x + dz * goal.z) / d; if (ahead > 0.6 && d < r.r + 1.6) { const sgn = dx * goal.z - dz * goal.x > 0 ? 1 : -1; goal.x += -goal.z * sgn * 0.8; goal.z += goal.x * sgn * 0.8; } }
  // dodge: anything that will pass close in the next second and a half, if seen in time
  if (R() < acc) { let th = null, tc = 1e9; for (const q of G.mets.concat(G.bolts)) { const rx = q.x - m.x, rz = q.z - m.z, vx = q.vx - m.vx, vz = q.vz - m.vz, vv = vx * vx + vz * vz; if (vv < 1e-6) continue; const tt = -(rx * vx + rz * vz) / vv; if (tt < 0 || tt > 1.5) continue; const cx = rx + vx * tt, cz = rz + vz * tt; if (Math.hypot(cx, cz) < 1.6 && tt < tc) { tc = tt; th = { q, cx, cz }; } }
    for (const w of G.warn) { const L = Math.hypot(w.vx, w.vz), ux = w.vx / L, uz = w.vz / L, rx = m.x - w.x, rz = m.z - w.z, along = rx * ux + rz * uz, cx = -(rx - ux * along), cz = -(rz - uz * along); if (Math.hypot(cx, cz) < 1.8 && along > 0) { th = { q: w, cx, cz }; tc = 0; break; } }
    if (th) { const L = Math.hypot(th.cx, th.cz) || 1; let ax = -th.cx / L, az = -th.cz / L; if (L < 0.05) { ax = -th.q.vz; az = th.q.vx; const l2 = Math.hypot(ax, az) || 1; ax /= l2; az /= l2; } goal = { x: ax, z: az }; } }
  setStick(G, goal.x, goal.z);
}
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.delivered = G.cfg.goal; finish(G, true); }
