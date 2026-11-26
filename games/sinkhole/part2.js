
// ===================== RULES: Sinkhole (game 70, set 13: one of mine, like Hole.io) =====================
// You are a hole in the road of a little town. Put your thumb down anywhere and slide: the hole glides that way. Anything
// smaller than the hole falls in; the more you swallow, the bigger the hole grows, until cars, buses, houses and towers go
// down. Swallow enough of the town (the meter at the top) before the clock runs out. Red barrels explode in the hole: you
// lose growth and stall. Other holes (from level 4) race you for the town: a bigger hole swallows a smaller one.
// People run from a hole big enough to eat them; cars and buses drive the roads. Power-ups: magnet, speed, +time.
// Units: metres; the town lies on x (0..TW) and z (0..TD); the ground is y = 0.
const RULES = [
  '<b>Slide your thumb</b> anywhere: the hole glides that way. Lift to stop.',
  'Anything <b>smaller than the hole</b> falls in. Swallow more to <b>grow</b>, then eat cars, buses, houses...',
  'Fill the <b>town meter</b> before the clock runs out.',
  'Never swallow a <b>red barrel</b>: it blows up and you shrink.',
  'Other holes race you: a <b>bigger hole eats a smaller one</b>. Grab ⚡ speed, 🧲 magnet and ⏱ time.',
];
// the hole's sizes (radius, m) and the mass eaten to reach each
const HR = [0.42, 0.6, 0.85, 1.2, 1.65, 2.25, 3.0, 3.9, 5.0, 6.4], CUM = [0, 6, 16, 34, 66, 120, 210, 360, 620, 1000];
const fits = (h, o) => o.rad <= HR[h.s] * 0.93;
const bad = (h, o) => o.kind === 'tanker' || (o.kind === 'barrel' && h.s < 7);      // what blows up in this hole
// every kind of thing in town: radius (its footprint), height, mass (what it is worth to the meter and to growing)
const KINDS = {
  cone: { rad: 0.14, h: 0.5, m: 1 }, hydrant: { rad: 0.15, h: 0.6, m: 1 }, bin: { rad: 0.2, h: 0.8, m: 2 }, lamp: { rad: 0.18, h: 3, m: 3 }, person: { rad: 0.2, h: 1.7, m: 3 },
  barrel: { rad: 0.24, h: 0.8, m: 0 }, mailbox: { rad: 0.2, h: 1.1, m: 2 }, crate: { rad: 0.3, h: 0.6, m: 2 }, bike: { rad: 0.42, h: 1, m: 4 }, bush: { rad: 0.4, h: 0.8, m: 4 }, bench: { rad: 0.45, h: 0.8, m: 5 }, tree: { rad: 0.65, h: 3.2, m: 10 }, car: { rad: 0.95, h: 1.3, m: 20 },
  kiosk: { rad: 1.1, h: 2.4, m: 25 }, van: { rad: 1.25, h: 2, m: 30 }, bus: { rad: 1.7, h: 3, m: 60 }, house: { rad: 2.3, h: 4.5, m: 120 }, shop: { rad: 2.9, h: 5, m: 200 },
  block: { rad: 3.6, h: 11, m: 350 }, tower: { rad: 4.2, h: 20, m: 600 }, landmark: { rad: 5.6, h: 26, m: 1200 }, pw: { rad: 0.3, h: 0.6, m: 0 }, tanker: { rad: 1.6, h: 2.8, m: 0 },
};
const P = 12, ROAD = 4;      // the street grid: a road 4 m wide every 12 m, an 8 by 8 m block between
const PLACES = [{ name: 'Seaside Town', sky: 'morning', ground: 0x8fc46a }, { name: 'Downtown', sky: 'overcast', ground: 0x9ccc72 }, { name: 'Old Town', sky: 'golden', ground: 0xa9c06a }, { name: 'Neon City', sky: 'dusk', ground: 0x7aa86a }];
const placeOf = N => Math.floor((N - 1) / 5) % 4;
const HOLES = [{ id: 'you', name: 'YOU', col: 0x30e0ff }, { id: 'gulp', name: 'GULP', col: 0xff5a8a }, { id: 'chomp', name: 'CHOMP', col: 0xffc030 }, { id: 'pit', name: 'PIT', col: 0x9a6aff }];
const SKINS = [{ id: 'cyan', col: 0x30e0ff, stars: 0 }, { id: 'lime', col: 0x9aff3a, stars: 6 }, { id: 'fire', col: 0xff7a20, stars: 15 }, { id: 'gold', col: 0xffd040, stars: 30 }];
const UPGRADES = [
  { id: 'big', name: 'Head start', desc: 'Start every town one size bigger.', max: 2, cost: l => 80 + l * 120 },
  { id: 'fast', name: 'Quick hole', desc: 'The hole glides 8% faster.', max: 3, cost: l => 50 + l * 60 },
  { id: 'time', name: 'More time', desc: '+6 seconds on every town.', max: 3, cost: l => 50 + l * 60 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Pothole'], [40, 'Sinkhole'], [130, 'Crater'], [320, 'Chasm'], [700, 'Abyss'], [1500, 'Black hole']];
const G_N8 = N => N >= 8;
function makeCfg(N, help) { const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), boss = N % 10 === 0;
  return { N, f, help: !!help, place: placeOf(N), boss, nc: Math.round(x(3, 6, 30)), time: Math.round(x(75, 95, 30) + 6 * upLv('time') + (help ? 15 : 0)), goal: x(0.5, 0.62, 30) - 0.03 * (N >= 4 ? (N >= 35 ? 3 : N >= 15 ? 2 : 1) : 0),
    barrels: x(0.5, 0.8, 30), cars: x(0.45, 1.1, 30), buses: N >= 3 ? x(0, 0.35, 30) : 0, rivals: N >= 4 ? (N >= 35 ? 3 : N >= 15 ? 2 : 1) : 0, tankers: G_N8(N) ? x(0, 0.12, 30) : 0, rivalSp: x(0.78, 0.92, 35), rivalSmart: x(0.45, 0.75, 35),
    flee: N >= 2, start: Math.min(2, upLv('big') + (help ? 1 : 0)), speed: 1 + 0.08 * upLv('fast'), tall: x(0, 0.7, 25) }; }
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, place: cfg.place, wait: 0, next: null };
  setup(G); if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else G.ev.push({ k: 'start' });
  return G; }
// ---------- the town ----------
function put(G, kind, x, z, o = {}) { const K = KINDS[kind], ob = { id: G.objs.length, kind, x, z, rad: K.rad * (o.sc || 1), h: K.h * (o.sc || 1) * (o.hs || 1), m: Math.round(K.m * (o.sc || 1) * (o.sc || 1)), alive: true, a: o.a != null ? o.a : G.rnd() * TAU, gold: !!o.gold, col: o.col | 0, sub: o.sub || null, var: (G.rnd() * 4) | 0 };
  if (kind === 'car' || kind === 'bus' || kind === 'van' || kind === 'tanker') { ob.dir = o.dir | 0; ob.sp = (kind === 'bus' || kind === 'tanker' ? 2.6 : 3.4) + G.rnd() * 1.4; ob.a = [0, Math.PI / 2, Math.PI, -Math.PI / 2][ob.dir]; ob.drive = !!o.drive; }
  if (kind === 'person') { ob.tx = x; ob.tz = z; ob.sp = 1 + G.rnd() * 0.4; ob.walk = 0; }
  G.objs.push(ob); return ob; }
function free(G, x, z, r) { if (x < r || z < r || x > G.TW - r || z > G.TD - r) return false; for (const o of G.objs) { if (!o.alive) continue; const d = Math.hypot(o.x - x, o.z - z); if (d < o.rad + r + 0.12) return false; } for (const h of G.holes || []) if (Math.hypot(h.x - x, h.z - z) < HR[h.s] + r + 1.5) return false; return true; }
function tryPut(G, kind, x0, z0, w, d, n = 20, o = {}) { const r = KINDS[kind].rad * (o.sc || 1); for (let i = 0; i < n; i++) { const x = x0 + G.rnd() * w, z = z0 + G.rnd() * d; if (free(G, x, z, r)) return put(G, kind, x, z, o); } return null; }
const onRoad = (G, x, z) => (x % P) < ROAD || (z % P) < ROAD;
function town(G) { const c = G.cfg, R = G.rnd, n = c.nc; G.TW = n * P + ROAD; G.TD = (n + 1) * P + ROAD; G.objs = []; G.blocks = [];
  const cx = Math.floor(n / 2), cz = Math.floor((n + 1) / 2);
  for (let i = 0; i < n; i++) for (let j = 0; j <= n; j++) { const x0 = i * P + ROAD, z0 = j * P + ROAD, mid = [x0 + 4, z0 + 4];
    let type = R() < 0.42 ? 'park' : 'built'; if (i === cx && j === cz) type = c.boss ? 'landmark' : 'plaza'; G.blocks.push({ i, j, type, x0, z0 });
    if (type === 'landmark') { put(G, 'landmark', mid[0], mid[1], { a: 0 }); continue; }
    if (type === 'plaza') { put(G, 'kiosk', mid[0], mid[1], { a: 0 }); for (let k = 0; k < 4; k++) tryPut(G, 'bench', x0 + 0.6, z0 + 0.6, 6.8, 6.8, 20); for (let k = 0; k < 3; k++) tryPut(G, 'person', x0, z0, 8, 8); for (let k = 0; k < 2; k++) tryPut(G, 'bin', x0, z0, 8, 8); continue; }
    if (type === 'park') { for (let k = 0; k < 3 + ((R() * 3) | 0); k++) tryPut(G, 'tree', x0 + 0.7, z0 + 0.7, 6.6, 6.6, 20); for (let k = 0; k < 2; k++) tryPut(G, 'bench', x0 + 0.5, z0 + 0.5, 7, 7); for (let k = 0; k < 3; k++) tryPut(G, 'bush', x0 + 0.4, z0 + 0.4, 7.2, 7.2);
      for (let k = 0; k < 2 + ((R() * 2) | 0); k++) tryPut(G, 'person', x0, z0, 8, 8); tryPut(G, 'bin', x0, z0, 8, 8); continue; }
    // built: a tall block or a tower further in, houses and shops nearer the edge
    const dc = Math.hypot(i - cx, j - cz) / Math.max(1, n * 0.6), big = R() < c.tall * (1 - dc * 0.6);
    if (big && R() < 0.4 && c.tall > 0.3) put(G, 'tower', mid[0], mid[1], { a: 0, col: (R() * 4) | 0 });
    else if (big) put(G, 'block', mid[0], mid[1], { a: 0, col: (R() * 4) | 0 });
    else if (R() < 0.5) { put(G, 'shop', mid[0], mid[1], { a: (R() * 4 | 0) * Math.PI / 2, col: (R() * 4) | 0 }); tryPut(G, 'bin', x0, z0, 8, 8); }
    else { put(G, 'house', x0 + 2.3, z0 + 2.3, { a: (R() * 4 | 0) * Math.PI / 2, col: (R() * 4) | 0 }); put(G, 'house', x0 + 5.7, z0 + 5.7, { a: (R() * 4 | 0) * Math.PI / 2, col: (R() * 4) | 0 }); tryPut(G, 'bush', x0, z0, 8, 8); tryPut(G, 'tree', x0, z0, 8, 8); }
  }
  // the pavements: lamps, bins, hydrants, cones, and the red barrels
  for (let i = 0; i <= n; i++) for (let j = 0; j <= n + 1; j++) { const x = i * P, z = j * P;
    if (i < n) { if (R() < 0.7) tryPut(G, 'lamp', x + ROAD + 1, z + ROAD - 0.6, 6, 0.3, 4); if (R() < 0.4) tryPut(G, 'hydrant', x + ROAD + 1, z + ROAD - 0.6, 6, 0.3, 4); }
    if (j <= n && R() < 0.5) tryPut(G, 'bin', x + ROAD - 0.6, z + ROAD + 1, 0.3, 6, 4);
    for (let k = 0; k < 2; k++) { const kd = ['mailbox', 'crate', 'bike', 'hydrant', 'bin'][(R() * 5) | 0]; if (i < n) tryPut(G, kd, x + ROAD + 0.5, z + ROAD - 0.7, 7, 0.4, 4); if (j <= n) tryPut(G, kd, x + ROAD - 0.7, z + ROAD + 0.5, 0.4, 7, 4); }
    if (R() < 0.35) { const cx2 = x + ROAD / 2 + (R() - 0.5) * 2, cz2 = z + ROAD / 2 + (R() < 0.5 ? 4 : -4); for (let k = 0; k < 3; k++) tryPut(G, 'cone', cx2 + k * 0.6, cz2, 0.2, 0.3, 4); } }
  // a few golden things (coins), all in the open
  for (let k = 0; k < 3; k++) { const o = G.objs[(R() * G.objs.length) | 0]; if (o && o.rad < 1 && o.kind !== 'barrel') o.gold = true; }
  // cars and buses on the roads (they drive)
  const roads = n * (n + 1); for (let k = 0; k < Math.round(roads * c.cars / 3); k++) car(G, 'car'); for (let k = 0; k < Math.round(roads * c.buses / 3); k++) car(G, 'bus'); if (G.N >= 6) for (let k = 0; k < Math.round(roads * c.cars / 8); k++) car(G, 'van'); if (G.N >= 8) for (let k = 0; k < Math.round(roads * c.tankers); k++) car(G, 'tanker');
  // red barrels, in among everything
  const nb = Math.round(n * (n + 1) * c.barrels); for (let k = 0; k < nb; k++) tryPut(G, 'barrel', 1, 1, G.TW - 2, G.TD - 2, 30);
  G.total = G.objs.reduce((s, o) => s + o.m, 0); }
function car(G, kind) { const R = G.rnd, n = G.cfg.nc; for (let t = 0; t < 20; t++) { const v = R() < 0.5, dir = v ? (R() < 0.5 ? 1 : 3) : (R() < 0.5 ? 0 : 2);
    const x = v ? ((R() * (n + 1)) | 0) * P + ROAD / 2 : 2 + R() * (G.TW - 4), z = v ? 2 + R() * (G.TD - 4) : ((R() * (n + 2)) | 0) * P + ROAD / 2;
    if (free(G, x, z, KINDS[kind].rad + 0.6)) return put(G, kind, x, z, { dir, drive: true }); } }
function hole(G, i, x, z, s) { const h = { i, id: HOLES[i].id, x, z, s, m: CUM[s], vx: 0, vz: 0, ax: 0, az: 0, mag: 0, stun: 0, gone: 0, eaten: 0, boost: 0, magnet: 0, mem: {}, combo: 0, lastEat: -9 }; return h; }
function setup(G, o = {}) { const c = G.cfg; G.t = 0; G.left = c.time; G.ate = 0; G.score = 0; G.combo = 0; G.bestCombo = 0; G.booms = 0; G.coins = 0; G.biggest = null; G.rivalsEaten = 0; G.pwT = 6; G.timeLow = false;
  G.holes = []; if (o.yard) yard(G, o.yard); else { town(G); const n = c.nc;
    G.holes.push(hole(G, 0, Math.floor(n / 2) * P + ROAD / 2, (n + 1) * P + ROAD / 2, c.start));
    const corners = [[ROAD / 2, ROAD / 2], [G.TW - ROAD / 2, ROAD / 2], [ROAD / 2, G.TD / 2]]; for (let r = 0; r < c.rivals; r++) G.holes.push(hole(G, r + 1, corners[r][0], corners[r][1], 0));
    // nothing sits in a hole at the start
    for (const h of G.holes) for (const ob of G.objs) if (ob.alive && Math.hypot(ob.x - h.x, ob.z - h.z) < HR[h.s] + ob.rad) ob.alive = false;
    G.total = G.objs.filter(q => q.alive).reduce((s, q) => s + q.m, 0); }
  G.you = G.holes[0]; G.mark = G.objs.find(q => q.kind === 'landmark') || null; }
// ---------- your thumb: a floating stick (ax, az: the way to go, |a| <= 1 how fast) ----------
function stick(G, ax, az) { const h = G.you; if (!h) return; const m = Math.hypot(ax, az); if (m > 1) { ax /= m; az /= m; } h.ax = ax; h.az = az; }
function lift(G) { stick(G, 0, 0); }
const vmax = (G, h) => (3.4 + HR[h.s] * 0.75) * (h.i === 0 ? G.cfg.speed : G.cfg.rivalSp) * (h.boost > 0 ? 1.45 : 1);
// ---------- the clock ----------
function step(G, dt) { if (G.over || !(dt > 0)) return;
  if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0) { G.wait = 0; const f = G.next; G.next = null; if (f) f(); } return; }
  G.t += dt; if (!G.lesson) { G.left -= dt; if (G.left <= 10 && !G.timeLow) { G.timeLow = true; G.ev.push({ k: 'timelow' }); } }
  for (let r = 1; r < G.holes.length; r++) brain(G, G.holes[r], dt);
  for (const h of G.holes) moveHole(G, h, dt);
  for (const ob of G.objs) if (ob.alive) moveThing(G, ob, dt);
  for (const h of G.holes) if (!h.gone) swallowAt(G, h);
  holesMeet(G);
  if (!G.lesson) { G.pwT -= dt; if (G.pwT <= 0) { G.pwT = 9 + G.rnd() * 5; const types = ['magnet', 'speed', 'time']; tryPut(G, 'pw', 2, 2, G.TW - 4, G.TD - 4, 20, { sub: types[(G.rnd() * 3) | 0] }); } }
  if (G.combo > 0 && G.t - G.you.lastEat > 0.7) G.combo = 0;
  if (G.lesson) return;
  if (G.ate >= G.total * G.cfg.goal && (!G.mark || !G.mark.alive)) { G.ev.push({ k: 'goal' }); G.wait = 1.2; G.next = () => finish(G, true); return; }
  if (G.left <= 0) { G.left = 0; const win = G.holes.length > 1 && rankOf0(G) === 1 && (!G.mark || !G.mark.alive); G.ev.push({ k: 'timeup', win }); G.wait = 0.8; G.next = () => finish(G, win); } }
const rankOf0 = G => 1 + G.holes.slice(1).filter(h => (h.ate || 0) > G.ate).length;
function moveHole(G, h, dt) { if (h.gone > 0) { h.gone -= dt; if (h.gone <= 0) { h.gone = 0; G.ev.push({ k: 'back', i: h.i }); } return; }
  h.boost = Math.max(0, h.boost - dt); h.magnet = Math.max(0, h.magnet - dt);
  if (h.stun > 0) { h.stun -= dt; h.vx *= 0.8; h.vz *= 0.8; } else { const v = vmax(G, h), k2 = Math.min(1, dt * 12); h.vx += (h.ax * v - h.vx) * k2; h.vz += (h.az * v - h.vz) * k2; }
  h.x += h.vx * dt; h.z += h.vz * dt; const r = HR[h.s] * 0.5; h.x = clamp(h.x, r, G.TW - r); h.z = clamp(h.z, r, G.TD - r);
  // things too big for the hole sit on its rim: the middle of the hole cannot go under them (it slides round)
  for (const ob of G.objs) { if (!ob.alive || fits(h, ob) || ob.kind === 'pw') continue; const dx = h.x - ob.x, dz = h.z - ob.z, d = Math.hypot(dx, dz), core = ob.rad * 0.82;
    if (d < core && d > 1e-6) { h.x = ob.x + dx / d * core; h.z = ob.z + dz / d * core; const vn = (h.vx * dx + h.vz * dz) / d; if (vn < 0) { h.vx -= vn * dx / d; h.vz -= vn * dz / d; } h.bump = (h.bump || 0) + dt; } } }
function moveThing(G, ob, dt) { const R = G.rnd;
  if (ob.drive) { const v = [[1, 0], [0, 1], [-1, 0], [0, -1]][ob.dir]; let sp = ob.sp;
    // a car slows behind another and stops short of a hole that would swallow it? no: drivers never see the holes
    const nx = ob.x + v[0] * sp * dt, nz = ob.z + v[1] * sp * dt;
    // at a crossing (the middle of a cross road) it may turn; at the edge of town it must
    const along = v[0] ? ob.x : ob.z, nAlong = v[0] ? nx : nz, c0 = Math.floor((Math.min(along, nAlong) - ROAD / 2) / P), cline = (c0 + 1) * P + ROAD / 2;
    if ((along - cline) * (nAlong - cline) < 0 || (nAlong === cline && along !== cline)) { const lim = v[0] ? G.TW : G.TD, atEdge = cline + P > lim || cline - P < 0;
      const opts = [ob.dir]; if (R() < 0.45 || atEdge) { opts.length = 0; const l = (ob.dir + 1) % 4, r = (ob.dir + 3) % 4; for (const d of [l, r]) { const w = [[1, 0], [0, 1], [-1, 0], [0, -1]][d], px = v[0] ? cline : ob.x, pz = v[0] ? ob.z : cline; if (px + w[0] * P < G.TW && px + w[0] * P > 0 && pz + w[1] * P < G.TD && pz + w[1] * P > 0) opts.push(d); } if (!atEdge || !opts.length) opts.push(ob.dir); }
      const d2 = opts[(R() * opts.length) | 0]; if (d2 !== ob.dir) { if (v[0]) ob.x = cline; else ob.z = cline; ob.dir = d2; ob.a = [0, Math.PI / 2, Math.PI, -Math.PI / 2][d2]; const w = [[1, 0], [0, 1], [-1, 0], [0, -1]][d2]; ob.x += w[0] * sp * dt; ob.z += w[1] * sp * dt; return; } }
    ob.x = nx; ob.z = nz; if (ob.x < 0.5 || ob.x > G.TW - 0.5 || ob.z < 0.5 || ob.z > G.TD - 0.5) { ob.dir = (ob.dir + 2) % 4; ob.a = [0, Math.PI / 2, Math.PI, -Math.PI / 2][ob.dir]; ob.x = clamp(ob.x, 0.5, G.TW - 0.5); ob.z = clamp(ob.z, 0.5, G.TD - 0.5); } return; }
  if (ob.kind === 'person') { let fx = 0, fz = 0, run = false;
    if (G.cfg.flee) for (const h of G.holes) { if (h.gone || !fits(h, ob)) continue; const dx = ob.x - h.x, dz = ob.z - h.z, d = Math.hypot(dx, dz); if (d < HR[h.s] + 3.2 && d > 1e-3) { fx += dx / d; fz += dz / d; run = true; } }
    let vx, vz; if (run) { const m = Math.hypot(fx, fz) || 1; vx = fx / m * 2.3; vz = fz / m * 2.3; ob.scared = 0.6; }
    else { ob.scared = Math.max(0, (ob.scared || 0) - dt); const dx = ob.tx - ob.x, dz = ob.tz - ob.z, d = Math.hypot(dx, dz); if (d < 0.3) { ob.tx = clamp(ob.x + (R() - 0.5) * 8, 1, G.TW - 1); ob.tz = clamp(ob.z + (R() - 0.5) * 8, 1, G.TD - 1); return; } vx = dx / d * ob.sp; vz = dz / d * ob.sp; }
    ob.x = clamp(ob.x + vx * dt, 0.5, G.TW - 0.5); ob.z = clamp(ob.z + vz * dt, 0.5, G.TD - 0.5); ob.a = Math.atan2(vz, vx); ob.walk += dt * (run ? 12 : 6); } }
// ---------- swallowing ----------
function swallowAt(G, h) { const r = HR[h.s], mag = h.magnet > 0;
  for (const ob of G.objs) { if (!ob.alive) continue; const dx = ob.x - h.x, dz = ob.z - h.z; if (Math.abs(dx) > r + 3 || Math.abs(dz) > r + 3) continue; const d = Math.hypot(dx, dz);
    if (mag && fits(h, ob) && !bad(h, ob) && d < r + 2.5 && d > 0.01) { ob.x -= dx / d * 4 / 60; ob.z -= dz / d * 4 / 60; }
    if (!fits(h, ob) || d > r - ob.rad * 0.35) continue;
    eat(G, h, ob); } }
function eat(G, h, ob) { ob.alive = false; ob.fall = { i: h.i, t: 0 }; const you = h.i === 0;
  if (bad(h, ob)) { boom(G, h); return; }
  if (ob.kind === 'barrel') { if (h.i === 0) G.ev.push({ k: 'fizz' }); return; }
  if (ob.kind === 'pw') { if (ob.sub === 'magnet') h.magnet = 6; else if (ob.sub === 'speed') h.boost = 5; else if (ob.sub === 'time' && you) G.left += 8; if (you) G.ev.push({ k: 'pow', sub: ob.sub }); return; }
  h.m += ob.m; h.eaten++; h.ate = (h.ate || 0) + ob.m; if (you) { G.ate += ob.m; G.combo = G.t - h.lastEat < 0.7 ? G.combo + 1 : 1; G.bestCombo = Math.max(G.bestCombo, G.combo); const pts = Math.round(ob.m * (1 + 0.1 * Math.min(20, G.combo)) * 10); G.score += pts;
    if (ob.gold) G.coins += 3; if (!G.biggest || ob.m > G.biggest.m) G.biggest = ob;
    G.ev.push({ k: 'eat', kind: ob.kind, m: ob.m, combo: G.combo, pts, gold: ob.gold, id: ob.id }); if (G.lesson) lessonSee(G, 'eat', ob); }
  h.lastEat = G.t; grow(G, h); }
function grow(G, h) { while (h.s < (h.i ? HR.length - 2 : HR.length - 1) && h.m >= CUM[h.s + 1]) { h.s++; G.ev.push({ k: 'grow', i: h.i, s: h.s }); if (h.i === 0 && G.lesson) lessonSee(G, 'grow'); } }
// a red barrel in the hole: boom. The hole shrinks a size (or loses its growth this size) and stalls for a moment
function boom(G, h) { h.stun = 1.0; const lose = Math.max(4, ((CUM[h.s + 1] || CUM[h.s] * 1.5) - CUM[h.s]) * 0.3);
  h.m = Math.max(0, h.m - lose); const was = h.s; while (h.s > 0 && h.m < CUM[h.s]) h.s--; if (h.i === 0) { G.booms++; G.combo = 0; }
  G.ev.push({ k: 'boom', i: h.i, shrink: h.s < was }); if (h.i === 0 && G.lesson) lessonMiss(G, 'boom'); }
// two holes meet: the bigger (by a size at least) swallows the smaller, which comes back a little later, smaller
function holesMeet(G) { for (const a of G.holes) for (const b of G.holes) { if (a === b || a.gone || b.gone || a.s < b.s + 1) continue; if (b.safe > G.t) continue; const d = Math.hypot(a.x - b.x, a.z - b.z); if (d > HR[a.s] - HR[b.s] * 0.4) continue;
    a.m += Math.round(b.m * 0.3); grow(G, a); G.ev.push({ k: 'holeeat', by: a.i, of: b.i }); if (a.i === 0) { G.rivalsEaten++; G.score += 500; if (G.lesson) lessonSee(G, 'rival'); }
    b.gone = b.i === 0 ? 2 : 3; b.safe = G.t + b.gone + 2.5; b.s = Math.max(0, b.s - 2); b.m = CUM[b.s]; b.vx = b.vz = 0; b.combo = 0; if (b.i === 0) G.combo = 0;
    const sp = spawnAt(G, b); b.x = sp[0]; b.z = sp[1]; } }
function spawnAt(G, h) { let best = null, bd = -1; for (let t = 0; t < 12; t++) { const x = 2 + G.rnd() * (G.TW - 4), z = 2 + G.rnd() * (G.TD - 4); let md = 1e9; for (const o of G.holes) if (o !== h && !o.gone) md = Math.min(md, Math.hypot(o.x - x, o.z - z)); if (md > bd) { bd = md; best = [x, z]; } } return best; }
function finish(G, win) { if (G.over) return true; G.over = win ? 'won' : 'lost'; const c = G.cfg, prog = Math.min(1, G.ate / (G.total * c.goal));
  const stars = win ? 1 + (G.left >= 15 ? 1 : 0) + (G.booms === 0 ? 1 : 0) : 0;
  G.res = { win, stars, score: G.score + (win ? Math.round(G.left) * 50 : 0), prog, pct: Math.round(100 * G.ate / G.total), rank: rankOf0(G), field: G.holes.length, goal: Math.round(100 * c.goal), size: G.you.s + 1, combo: G.bestCombo, booms: G.booms, biggest: G.biggest ? G.biggest.kind : null, rivals: G.rivalsEaten, left: Math.round(G.left),
    coins: G.coins + Math.round(prog * 4) + (win ? 4 + Math.ceil(G.N / 3) + stars * 2 : 1) };
  G.ev.push({ k: win ? 'won' : 'lost' }); return true; }
// ---------- the other holes, and the robot: a player who looks ----------
// picks the best thing to swallow (worth over distance), steers round red barrels and big things, runs from a bigger hole
// and chases a smaller one that is close
function aim(G, h, o, mem, dt) { const r = HR[h.s], R = Math.random; mem.t = (mem.t || 0) - dt;
  if (mem.t <= 0 || !mem.tg || !mem.tg.alive || (mem.tg.kind === 'hole' && (mem.tg.h.gone || mem.tg.h.s >= h.s))) { mem.t = o.react + 0.05 + R() * 0.15; let best = null, bv = 0;
    for (const ob of G.objs) { if (!ob.alive || !fits(h, ob) || ob.kind === 'barrel' || ob.kind === 'tanker' || (mem.skip && mem.skip[ob.id] > G.t)) continue; const d = Math.hypot(ob.x - h.x, ob.z - h.z); let v = (ob.m || 2) * (ob.kind === 'pw' ? 6 : 1) / Math.pow(d + 2, 1.6);
      if (ob.kind === 'person' && G.cfg.flee) v *= 0.6; if (v > bv) { bv = v; best = ob; } }
    for (const q of G.holes) if (q !== h && !q.gone && q.s < h.s && !(q.safe > G.t) && !(mem.skip && mem.skip[-1 - q.i] > G.t)) { const d = Math.hypot(q.x - h.x, q.z - h.z); const v = 40 / Math.pow(d + 2, 1.6); if (d < 9 && v > bv) { bv = v; best = { kind: 'hole', h: q, get x() { return q.x; }, get z() { return q.z; }, alive: true, id: -1 - q.i }; } }
    if (best !== mem.tg) { mem.since = G.t; mem.d0 = best ? Math.hypot(best.x - h.x, best.z - h.z) : 0; } mem.tg = best; mem.err = (R() - 0.5) * (1 - o.acc) * 1.2; }
  // stuck on one target too long: let it go for a while
  if (mem.tg && G.t - mem.since > (mem.tg.id < 0 ? 3.5 : 5)) { mem.skip = mem.skip || {}; mem.skip[mem.tg.id] = G.t + 8; mem.tg = null; mem.t = 0; }
  if (mem.px == null || G.t - mem.pt > 1.5) { if (mem.px != null && Math.hypot(h.x - mem.px, h.z - mem.pz) < 0.8 && mem.tg) { mem.skip = mem.skip || {}; mem.skip[mem.tg.id] = G.t + 6; mem.tg = null; mem.t = 0; mem.kick = G.t + 0.8; mem.ka = Math.random() * TAU; } mem.px = h.x; mem.pz = h.z; mem.pt = G.t; }
  if (mem.kick > G.t) return [Math.cos(mem.ka), Math.sin(mem.ka)];
  let dx = 0, dz = 0; if (mem.tg) { dx = mem.tg.x - h.x; dz = mem.tg.z - h.z; const d = Math.hypot(dx, dz) || 1; dx /= d; dz /= d; const sl = Math.min(1, d / 1.2 + 0.25); dx *= sl; dz *= sl; }
  else { dx = (G.TW / 2 - h.x) / G.TW; dz = (G.TD / 2 - h.z) / G.TD; }
  // keep clear of barrels (more the closer), and slide round things too big to eat
  for (const ob of G.objs) { if (!ob.alive) continue; const ex = h.x - ob.x, ez = h.z - ob.z; if (Math.abs(ex) > r + 6 || Math.abs(ez) > r + 6) continue; const d = Math.hypot(ex, ez) || 0.01;
    if (bad(h, ob) && fits(h, ob)) { const lim = r + ob.rad + (0.9 + (ob.drive ? 1.5 : 0)) * o.acc + 0.3; if (d < lim) { const f = (lim - d) / lim * 3 * o.acc; dx += ex / d * f; dz += ez / d * f; } }
    else if (!fits(h, ob) && ob.kind !== 'pw') { const lim = ob.rad * 0.82 + 0.6; if (d < lim + 0.4) { const f = 0.9; dx += (ex / d) * f * 0.4 - (ez / d) * f * Math.sign(ex * dz - ez * dx || 1); dz += (ez / d) * f * 0.4 + (ex / d) * f * Math.sign(ex * dz - ez * dx || 1); } } }
  for (const q of G.holes) { if (q === h || q.gone || q.s <= h.s) continue; const ex = h.x - q.x, ez = h.z - q.z, d = Math.hypot(ex, ez) || 0.01, lim = HR[q.s] + 5; if (d < lim) { const f = (lim - d) / lim * 3; dx += ex / d * f; dz += ez / d * f; } }
  const m = Math.hypot(dx, dz); if (m > 1) { dx /= m; dz /= m; } const c = Math.cos(mem.err || 0), s = Math.sin(mem.err || 0); return [dx * c - dz * s, dx * s + dz * c]; }
function brain(G, h, dt) { if (h.gone) return; const a = aim(G, h, { react: 0.5 - G.cfg.rivalSmart * 0.3, acc: G.cfg.rivalSmart }, h.mem, dt); h.ax = a[0]; h.az = a[1]; }
// BLIND: a thumb that does not look: slides some way and holds it, or lifts
const BLIND = { s: G => { const a = Math.random() * TAU; stick(G, Math.cos(a), Math.sin(a)); }, r: G => lift(G) };
// THE TUTORIAL SAYS WHICH WAY TO GLIDE (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing happens"). The hand slid left
// and right in a box. Now the robot is asked (dryPlan stick): SLIDE THIS WAY, the way it would glide the hole (to the next thing it can swallow,
// round a red barrel, after GULP).
const SKC = { t: -1e9, v: null };
function sinkCue(G) { if (G.over || G.wait > 0 || !G.you) return ['WAIT…', 'wait', false]; const now = performance.now(); if (now - SKC.t < 150) return SKC.v; SKC.t = now; const P = dryPlan(G, null, { t: -1, next: -1 }), d = ui.drag, x0 = d ? d.x0 : W / 2, y0 = d ? d.y0 : H * 0.7, R = 56 * k; let v = ['STAY STILL', 'wait', false];
  if (P && P[0] === 'stick' && Math.hypot(P[1], P[2]) > 0.05) { const m = Math.hypot(P[1], P[2]); v = ['SLIDE THIS WAY', 'drag', [x0, y0, x0 + P[1] / m * R * 0.8, y0 + P[2] / m * R * 0.8]]; }
  SKC.v = v; return v; }
function honest(G, o, mem) { if (G.over || G.wait > 0 || !G.you) return; const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc;
  const a = aim(G, G.you, { react, acc }, mem, 1 / 60); ACT.stick(G, a[0], a[1]); }
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.wait = 0; G.ate = G.total; if (G.mark) G.mark.alive = false; finish(G, true); }
// ---------- LESSONS: little yards ----------
const AIMCARD = {"pic": "🕳️", "win": "FILL THE TOWN METER", "lose": "THE CLOCK RUNS OUT", "how": "SLIDE: SWALLOW SMALL THINGS"};      // the aim card: specs/aims.json (tools/aims.py)
const LESSONS = {
  1: [{ id: 'swallow', title: 'SLIDE AND SWALLOW', say: G => sinkCue(G)[0], do: G => sinkCue(G)[1], at: G => sinkCue(G)[2], how: 'Slide your thumb to glide the hole. Swallow 12 cones and bins. Never a RED barrel: it blows up.', need: 12 }],
  2: [{ id: 'grow', title: 'GROW, THEN EAT THE CAR', say: G => sinkCue(G)[0], do: G => sinkCue(G)[1], at: G => sinkCue(G)[2], how: 'Swallow the little things to grow. When the hole is bigger than the car, swallow the car! Mind the red barrels.', need: 1 }],
  3: [{ id: 'rival', title: 'BIGGER EATS SMALLER', say: G => sinkCue(G)[0], do: G => sinkCue(G)[1], at: G => sinkCue(G)[2], how: 'You are bigger than GULP. Catch it and swallow it! (A bigger hole could do that to you.) Mind the barrels.', need: 1 }],
};
function yard(G, id) { const R = G.rnd; G.TW = 20; G.TD = 26; G.objs = []; G.blocks = [];
  G.holes.push(hole(G, 0, 10, 22, id === 'rival' ? 3 : 0));
  if (id === 'swallow') { for (let k = 0; k < 16; k++) tryPut(G, R() < 0.5 ? 'cone' : 'bin', 1, 1, 18, 17, 30); for (let k = 0; k < 9; k++) tryPut(G, 'barrel', 1, 1, 18, 17, 30); }
  if (id === 'grow') { put(G, 'car', 10, 4, { dir: 0 }); for (let k = 0; k < 26; k++) tryPut(G, ['cone', 'bin', 'hydrant', 'bush', 'bench', 'person'][(R() * 6) | 0], 1, 1, 18, 19, 30); for (let k = 0; k < 10; k++) tryPut(G, 'barrel', 1, 1, 18, 19, 30); }
  if (id === 'rival') { G.holes.push(hole(G, 1, 10, 4, 1)); for (let k = 0; k < 14; k++) tryPut(G, ['cone', 'bin', 'bush'][(R() * 3) | 0], 1, 1, 18, 18, 30); for (let k = 0; k < 8; k++) tryPut(G, 'barrel', 1, 1, 18, 18, 30); }
  G.total = G.objs.reduce((s, o) => s + o.m, 0); }
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonDeal(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonDeal(G) { const st = lessonNow(G); G.rnd = rng(G.seed + (G.deals = (G.deals | 0) + 1)); G.lesson.n = 0; setup(G, { yard: st.id }); G.ev.push({ k: 'yard' }); }
function lessonMiss(G, why) { const st = lessonNow(G); G.ev.push({ k: 'lessonmiss', how: why === 'boom' ? 'BOOM! That was a red barrel. Steer round them. Again!' : st.how }); G.wait = 1.2; G.next = () => lessonDeal(G); }
function lessonSee(G, what, ob) { const st = lessonNow(G); if (!st || G.wait > 0) return;
  if (st.id === 'swallow' && what === 'eat') { G.lesson.n++; G.ev.push({ k: 'lessonok', n: G.lesson.n, need: st.need }); }
  if (st.id === 'grow' && what === 'eat' && ob && ob.kind === 'car') G.lesson.n = 1;
  if (st.id === 'rival' && what === 'rival') G.lesson.n = 1;
  if (G.lesson.n < st.need) return;
  G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.wait = 1.4; G.next = () => { G.rnd = rng(G.seed); setup(G); G.ev.push({ k: 'start' }); G.ev.push({ k: 'yard' }); }; }

// what the robot would do now, without doing it (tools/dry_plan.py): the tutorial shows this move
const ACT_REAL = { stick }; let ACT = ACT_REAL;
function dryPlan(G, o, mem) { let got = null; const rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { if (!got && !(a.length > 2 && a.slice(1).every(v => v === 0 || v === false))) got = [n, ...a.slice(1)]; return true; };      /* (a stick at rest, all its numbers 0, is not a move; a first bed, number 0, is) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return got; }
function dryPlanAll(G, o, mem) { const all = [], rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { all.push([n, ...a.slice(1)]); return true; };      /* every call, in order (for a robot that steers and drifts at once) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return all; }
