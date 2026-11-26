// ===================== RULES: Ghost Lantern (game 43) =====================
// A haunted house at night, room after room, and a lantern. One floating stick: drag a little and you turn on the spot (the
// lantern turns with you); drag further and you walk. Ghosts are seen only in the lantern's beam (a faint shimmer when one is
// near, frost at the edge of the screen when one is close behind). Hold a ghost in the beam and it is stunned and pulled in:
// keep it lit until the lantern has it; let it slip out and it recovers. A ghost that reaches you scares you (a heart). Some
// ghosts hide in the furniture until you come into their room. The lantern burns oil all the time; jars of oil stand about
// the house. Catch every ghost on the floor before the oil runs out.
// Kinds: wisps (slow, weak), shy ones (only move in the dark: they creep up behind), quick ones (zigzag), big ones (pull
// hard, take long), and now and then a golden ghost that runs away (coins).
// World: metres; x across (+ right), z toward the camera (+ down the screen). Rooms are 7 m squares.
const RULES = [
  '<b>Drag a little</b> to turn your lantern on the spot. <b>Drag further</b> to walk.',
  'Ghosts show only in the <b>beam</b>. <b>Hold one in the light</b>, standing still, until the lantern pulls it in.',
  'Let it slip out and it recovers. A ghost that <b>reaches you</b> scares you: you lose a heart.',
  '<b>Frost</b> at the edge of the screen: a ghost is close, that way. Turn to it!',
  'The lantern burns <b>oil</b>: pick up jars. Catch every ghost on the floor before it runs out.',
];
const KINDS = {
  wisp: { name: 'Wisp', sp: 1.3, cap: 1.0, pull: 0.6, col: 0xd8f0ff, n: 1 },
  shy: { name: 'Shy ghost', sp: 1.5, cap: 1.2, pull: 0.5, col: 0xffd8f0, shy: true, n: 3 },
  quick: { name: 'Quick ghost', sp: 2.1, cap: 1.1, pull: 1.0, col: 0xc8ffd8, zig: true, n: 5 },
  big: { name: 'Big ghost', sp: 0.85, cap: 2.0, pull: 1.4, col: 0xe0d0ff, big: true, n: 8 },
  gold: { name: 'Golden ghost', sp: 2.4, cap: 0.9, pull: 1.2, col: 0xffd040, flee: true, n: 4 },
};
const KORDER = ['wisp', 'shy', 'quick', 'big', 'gold'];
const PLACES = [{ name: 'The old manor', wall: 0x3a2a3a, floor: 0x3a2a20 }, { name: 'The doll house', wall: 0x4a2a34, floor: 0x40302a }, { name: 'The flooded cellar', wall: 0x203038, floor: 0x1a2a2a }, { name: 'The clock tower', wall: 0x3a3424, floor: 0x2a2418 }];
const placeOf = N => Math.floor((N - 1) / 5) % PLACES.length;
const UPGRADES = [
  { id: 'bright', name: 'Brighter flame', desc: 'The beam reaches further.', max: 2, cost: l => 25 + l * 30 },
  { id: 'wide', name: 'Wider glass', desc: 'A wider beam.', max: 2, cost: l => 25 + l * 30 },
  { id: 'flask', name: 'Oil flask', desc: 'Start each floor with more oil.', max: 2, cost: l => 20 + l * 25 },
  { id: 'charm', name: 'Lucky charm', desc: 'One more heart.', max: 1, cost: l => 45 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Scaredy cat'], [40, 'Lamp lighter'], [130, 'Ghost catcher'], [320, 'Night warden'], [700, 'Spirit keeper'], [1500, 'Master of the manor']];
const RS = 7, WT = 0.25, DOOR = 1.9, PR = 0.32;
function makeCfg(N, help) {
  const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), e = easyOf(N);
  const rw = N <= 1 ? 2 : Math.min(3, 2 + Math.floor(N / 8)), rh = N <= 1 ? 1 : Math.min(3, 1 + Math.floor((N + 2) / 5));
  return { N, f, help: !!help, place: placeOf(N), rw, rh,
    ghosts: Math.min(rw * rh * 3, Math.round(x(4, 14, 30))), kinds: KORDER.filter(k => KINDS[k].n <= N && k !== 'gold'),
    gold: N >= 4 ? 0.5 : 0, speed: x(0.9, 1.35, 30) * (1 - 0.15 * e) * (help ? 0.85 : 1), capT: x(1.6, 2.1, 30) * (help ? 0.85 : 1),
    range: 6.4 + 0.8 * upLv('bright'), cone: 0.4 + 0.06 * upLv('wide'),
    oil: 34 + 16 * rw * rh + 30 * upLv('flask'), drain: 0.85 * (help ? 0.8 : 1), jars: Math.max(1, Math.round(rw * rh * 0.8)),
    hearts: 3 + upLv('charm'), hidden: x(0.3, 0.7, 30) };
}
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, place: cfg.place,
    me: null, stick: { x: 0, z: 0 }, ghosts: [], jars: [], walls: [], furn: [], rooms: [], caught: 0, total: 0, scares: 0, coins: 0, oil: cfg.oil, book: {}, nid: 1, gold: null, goldT: 20 };
  build(G); if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else { populate(G); G.ev.push({ k: 'start' }); }
  return G;
}
// ---------- the house: a grid of rooms, doorways between them (every room reachable), furniture, jars ----------
const roomRect = (G, i, j) => { const x0 = (i - G.cfg.rw / 2) * RS; return { x0, x1: x0 + RS, z0: -(j + 1) * RS, z1: -j * RS, cx: x0 + RS / 2, cz: -(j + 0.5) * RS }; };
function build(G) { const c = G.cfg, R = G.rnd, rw = c.rw, rh = c.rh; G.walls = []; G.furn = []; G.rooms = []; G.doors = [];
  for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) G.rooms.push({ i, j, awake: i === 0 && j === 0, seen: i === 0 && j === 0 });
  // a spanning tree of doorways (a random walk), plus a few more so there are loops
  const key = (i, j) => j * rw + i, link = new Set(), vis = new Set([0]), stack = [[0, 0]];
  while (stack.length) { const [i, j] = stack[stack.length - 1], nb = [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]].filter(([a, b]) => a >= 0 && b >= 0 && a < rw && b < rh && !vis.has(key(a, b)));
    if (!nb.length) { stack.pop(); continue; } const [a, b] = nb[(R() * nb.length) | 0]; vis.add(key(a, b)); link.add([key(i, j), key(a, b)].sort((p, q) => p - q).join(',')); stack.push([a, b]); }
  for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) { if (i + 1 < rw && R() < 0.35) link.add(key(i, j) + ',' + key(i + 1, j)); if (j + 1 < rh && R() < 0.35) link.add(key(i, j) + ',' + key(i, j + 1)); }
  G.links = link;
  const wall = (x0, z0, x1, z1) => G.walls.push({ x0: Math.min(x0, x1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), z1: Math.max(z0, z1) });
  const X0 = -rw / 2 * RS, X1 = rw / 2 * RS, Z0 = -rh * RS, Z1 = 0;
  wall(X0 - WT, Z0 - WT, X1 + WT, Z0); wall(X0 - WT, Z1, X1 + WT, Z1 + WT); wall(X0 - WT, Z0, X0, Z1); wall(X1, Z0, X1 + WT, Z1);
  for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) { const r = roomRect(G, i, j);
    if (i + 1 < rw) { const open = link.has(key(i, j) + ',' + key(i + 1, j)); if (open) { wall(r.x1 - WT / 2, r.z0, r.x1 + WT / 2, r.cz - DOOR / 2); wall(r.x1 - WT / 2, r.cz + DOOR / 2, r.x1 + WT / 2, r.z1); G.doors.push({ a: key(i, j), b: key(i + 1, j), x: r.x1, z: r.cz }); } else wall(r.x1 - WT / 2, r.z0, r.x1 + WT / 2, r.z1); }
    if (j + 1 < rh) { const open = link.has(key(i, j) + ',' + key(i, j + 1)); if (open) { wall(r.x0, r.z0 - WT / 2, r.cx - DOOR / 2, r.z0 + WT / 2); wall(r.cx + DOOR / 2, r.z0 - WT / 2, r.x1, r.z0 + WT / 2); G.doors.push({ a: key(i, j), b: key(i, j + 1), x: r.cx, z: r.z0 }); } else wall(r.x0, r.z0 - WT / 2, r.x1, r.z0 + WT / 2); } }
  // furniture: a few pieces in each room, away from the doorways and the middle
  const FK = ['wardrobe', 'table', 'chest', 'clock', 'sofa', 'piano'];
  for (const rm of G.rooms) { const r = roomRect(G, rm.i, rm.j), n = 1 + ((R() * 3) | 0); for (let q = 0; q < n; q++) { for (let tries = 0; tries < 12; tries++) { const kind = FK[(R() * FK.length) | 0], w = kind === 'table' || kind === 'sofa' || kind === 'piano' ? 1.6 : 0.9, d = kind === 'table' ? 1.0 : 0.7;
        const side = (R() * 4) | 0, along = 0.25 + R() * 0.5, x = side < 2 ? r.x0 + 0.5 + w / 2 + along * (RS - 1 - w) : side === 2 ? r.x0 + 0.4 + d / 2 : r.x1 - 0.4 - d / 2, z = side === 0 ? r.z0 + 0.4 + d / 2 : side === 1 ? r.z1 - 0.4 - d / 2 : r.z0 + 0.5 + w / 2 + along * (RS - 1 - w);
        const fw = side < 2 ? w : d, fd = side < 2 ? d : w; const f = { kind, x, z, w: fw, d: fd, room: G.rooms.indexOf(rm), shake: 0 };
        if (G.doors.some(dr => Math.abs(dr.x - x) < fw / 2 + 1.4 && Math.abs(dr.z - z) < fd / 2 + 1.4) || G.furn.some(o => Math.abs(o.x - x) < (o.w + fw) / 2 + 0.6 && Math.abs(o.z - z) < (o.d + fd) / 2 + 0.6)) continue;
        if (rm.i === 0 && rm.j === 0 && Math.hypot(x - r.cx, z - (r.z1 - 1.5)) < 2) continue; G.furn.push(f); break; } } }
  const r0 = roomRect(G, 0, 0); G.me = { x: r0.cx, z: r0.z1 - 1.4, face: -Math.PI / 2, v: 0, hearts: c.hearts, scared: 0 };
  // oil jars, one in some rooms (not the first)
  const rs = G.rooms.slice(1).sort(() => R() - 0.5); for (let q = 0; q < Math.min(c.jars, rs.length); q++) { const rm = rs[q], r = roomRect(G, rm.i, rm.j); G.jars.push({ x: r.cx + (R() - 0.5) * 3, z: r.cz + (R() - 0.5) * 3, room: G.rooms.indexOf(rm) }); }
  if (G.rooms.length === 1 || !c.jars) { }
}
const roomAt = (G, x, z) => { const c = G.cfg, i = Math.floor(x / RS + c.rw / 2), j = Math.floor(-z / RS); return i >= 0 && j >= 0 && i < c.rw && j < c.rh ? j * c.rw + i : -1; };
// the ghosts: some in the first room's far side, most in the other rooms (half of them hidden in furniture there)
function populate(G) { const c = G.cfg, R = G.rnd; G.ghosts = []; G.total = c.ghosts;
  for (let q = 0; q < c.ghosts; q++) { const kind = c.kinds[(q * 7 + ((R() * c.kinds.length) | 0)) % c.kinds.length], ri = G.rooms.length > 1 ? 1 + ((R() * (G.rooms.length - 1)) | 0) : 0, rm = G.rooms[q === 0 ? 0 : ri], r = roomRect(G, rm.i, rm.j);
    const fur = G.furn.filter(f => f.room === G.rooms.indexOf(rm)), hide = rm !== G.rooms[0] && fur.length && R() < c.hidden, f = hide ? fur[(R() * fur.length) | 0] : null;
    addGhost(G, kind, f ? f.x : r.cx + (R() - 0.5) * 4, f ? f.z : (rm === G.rooms[0] ? r.z0 + 1.6 : r.cz + (R() - 0.5) * 4), f); } }
function addGhost(G, kind, x, z, f) { const K = KINDS[kind], g = { id: G.nid++, kind, x, z, vx: 0, vz: 0, cap: 0, lit: 0, hid: f || null, flee: 0, ph: G.rnd() * 6, room: roomAt(G, x, z), wake: f ? 0 : 1 }; g.home = g.room; G.ghosts.push(g); return g; }
// ---------- your thumb ----------
function setStick(G, x, z) { const L = Math.hypot(x, z); G.stick = L > 1 ? { x: x / L, z: z / L } : { x, z }; }
// ---------- the beam: inside the cone, in reach, and no wall in the way ----------
function segHitsBox(ax, az, bx, bz, w) { let t0 = 0, t1 = 1; const dx = bx - ax, dz = bz - az;
  for (const [p, q] of [[-dx, ax - w.x0], [dx, w.x1 - ax], [-dz, az - w.z0], [dz, w.z1 - az]]) { if (Math.abs(p) < 1e-9) { if (q < 0) return false; } else { const r = q / p; if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; } } } return true; }
function seesClear(G, x, z) { const m = G.me, d = Math.hypot(x - m.x, z - m.z), u = Math.max(0, (d - 0.35) / d), ex = m.x + (x - m.x) * u, ez = m.z + (z - m.z) * u; for (const w of G.walls) if (segHitsBox(m.x, m.z, ex, ez, w)) return false; return true; }      // a ghost half through a wall still shows
function inBeam(G, x, z) { const m = G.me, c = G.cfg, dx = x - m.x, dz = z - m.z, d = Math.hypot(dx, dz), rng = c.range * (G.oil > 0 ? 1 : 0.3); if (d > rng || d < 0.05) return d < 0.6;
  let da = Math.atan2(dz, dx) - m.face; da = Math.atan2(Math.sin(da), Math.cos(da)); return Math.abs(da) < c.cone + Math.min(0.5, 0.3 / d) && seesClear(G, x, z); }
// ---------- the house, step by step ----------
function step(G, dt) {
  if (G.over) return; G.t += dt; const c = G.cfg, m = G.me, R = G.rnd;
  if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0 && G.lessonEnd) { G.lessonEnd = false; Object.assign(G, { ghosts: [], jars: [], caught: 0, scares: 0, coins: 0, oil: c.oil, book: {}, gold: null, goldT: 20 }); build(G); populate(G); G.ev.push({ k: 'start' }); } if (G.wait > 0) return; }
  // walking and turning: a little drag turns on the spot; further walks
  const s = G.stick, L = Math.hypot(s.x, s.z);
  if (L > 0.12) { const want = Math.atan2(s.z, s.x); let da = want - m.face; da = Math.atan2(Math.sin(da), Math.cos(da)); m.face += clamp(da, -7 * dt, 7 * dt); }
  const sp = L > 0.4 ? 3.3 * Math.min(1, (L - 0.4) / 0.5 + 0.35) : 0; m.v = sp; if (sp) { const d = Math.atan2(s.z, s.x); m.x += Math.cos(d) * sp * dt; m.z += Math.sin(d) * sp * dt; }
  for (const w of G.walls.concat(G.furn.map(f => ({ x0: f.x - f.w / 2, x1: f.x + f.w / 2, z0: f.z - f.d / 2, z1: f.z + f.d / 2 })))) { const nx = clamp(m.x, w.x0, w.x1), nz = clamp(m.z, w.z0, w.z1), dx = m.x - nx, dz = m.z - nz, d = Math.hypot(dx, dz); if (d < PR) { if (d > 1e-6) { m.x = nx + dx / d * PR; m.z = nz + dz / d * PR; } else { m.z = w.z1 + PR; } } }
  m.scared = Math.max(0, m.scared - dt);
  // oil
  if (!G.lesson) { G.oil -= c.drain * dt; if (G.oil <= 0) { G.oil = 0; if (!G.dark) { G.dark = true; G.ev.push({ k: 'dark' }); } G.darkT = (G.darkT || 0) + dt; if (G.darkT > 6) return finish(G, false, 'oil'); } else { G.dark = false; G.darkT = 0; } }
  for (let i = G.jars.length - 1; i >= 0; i--) { const j = G.jars[i]; if (Math.hypot(j.x - m.x, j.z - m.z) < 0.7) { G.jars.splice(i, 1); G.oil = Math.min(c.oil + 20, G.oil + 40); G.ev.push({ k: 'oil', x: j.x, z: j.z }); } }
  // rooms wake when you walk in: the furniture rattles, then its ghosts come out
  const ri = roomAt(G, m.x, m.z); if (ri >= 0 && !G.rooms[ri].awake) { G.rooms[ri].awake = true; G.rooms[ri].seen = true; G.ev.push({ k: 'wake', room: ri }); for (const g of G.ghosts) if (g.hid && g.hid.room === ri) { g.hid.shake = 1.2; g.wakeT = 1.1 + R() * 0.8; } }
  // a golden ghost now and then: it runs from you
  if (c.gold && !G.lesson) { G.goldT -= dt; if (G.goldT <= 0 && !G.gold) { G.goldT = 30 + R() * 20; const r = roomAt(G, m.x, m.z), rm = G.rooms[(r + 1 + ((R() * (G.rooms.length - 1)) | 0)) % G.rooms.length], rr = roomRect(G, rm.i, rm.j); G.gold = addGhost(G, 'gold', rr.cx, rr.cz); G.gold.life = 14; G.ev.push({ k: 'goldghost' }); } }
  // the ghosts
  for (let i = G.ghosts.length - 1; i >= 0; i--) { const g = G.ghosts[i], K = KINDS[g.kind];
    if (g.hid) { if (g.wakeT != null) { g.wakeT -= dt; if (g.wakeT <= 0) { g.hid = null; g.ev = 1; G.ev.push({ k: 'popout', x: g.x, z: g.z }); } } continue; }
    if (g.life != null) { g.life -= dt; if (g.life <= 0) { G.ghosts.splice(i, 1); if (G.gold === g) G.gold = null; G.ev.push({ k: 'goldgone' }); continue; } }
    const dx = m.x - g.x, dz = m.z - g.z, d = Math.hypot(dx, dz) || 1, lit = inBeam(G, g.x, g.z); g.lit = lit ? Math.min(1, g.lit + dt * 6) : Math.max(0, g.lit - dt * 3); g.ph += dt;
    if (lit) { g.cap += dt / (K.cap * c.capT) * (m.v > 0 ? 0.35 : 1);      // walking sways the lantern: stand still to pull them in if (!g.litSaid) { g.litSaid = true; G.ev.push({ k: 'lit', x: g.x, z: g.z, kind: g.kind }); }
      // stunned: it struggles away from you, sideways, harder for big ones
      const away = K.flee ? 1.6 : 0.45 * K.pull, side = Math.sin(g.ph * 3) * K.pull * 1.2; g.vx = (-dx / d * away + -dz / d * side) * 1.2; g.vz = (-dz / d * away + dx / d * side) * 1.2;
      if (g.cap >= 1) { G.ghosts.splice(i, 1); if (G.gold === g) G.gold = null; G.caught += g.kind === 'gold' ? 0 : 1; G.coins += g.kind === 'gold' ? 6 : 1; G.book[g.kind] = (G.book[g.kind] | 0) + 1; G.ev.push({ k: 'catch', x: g.x, z: g.z, kind: g.kind, n: G.caught }); lessonSee(G, 'catch', g); if (!G.lesson && G.caught >= G.total) return finish(G, true); continue; } }
    else { g.cap = Math.max(0, g.cap - dt * 0.9); g.litSaid = false;
      const myRoom = roomAt(G, m.x, m.z), stir = G.t > 25 && !G.lesson, awake = stir || (G.rooms[g.home] ? G.rooms[g.home].awake : true), hunt = awake && (g.room === myRoom ? d < 8 : d < (stir ? 6 : 3.5)), spd = K.sp * c.speed;      // after a while the whole house stirs
      if (K.flee) { g.vx = -dx / d * spd * 0.6 + Math.sin(g.ph) * 0.8; g.vz = -dz / d * spd * 0.6 + Math.cos(g.ph * 1.3) * 0.8; }
      else if (hunt && g.flee <= 0) { const zig = K.zig ? Math.sin(g.ph * 4) * 1.4 : Math.sin(g.ph * 1.3) * 0.35; let ux = dx / d, uz = dz / d;
        // ghosts are not fools: in front of you they slide round to your side and back before coming in
        let fa = Math.atan2(-dz, -dx) - m.face; fa = Math.atan2(Math.sin(fa), Math.cos(fa)); if (Math.abs(fa) < c.cone + 0.7 && d > 1.3) { const sg = fa >= 0 ? 1 : -1; ux = -dz / d * -sg * 0.95 + ux * 0.25; uz = dx / d * -sg * 0.95 + uz * 0.25; }
        g.vx = (ux + -uz * zig) * spd; g.vz = (uz + ux * zig) * spd; }
      else { const hr = G.rooms[g.home], rr = hr ? roomRect(G, hr.i, hr.j) : { cx: g.x, cz: g.z }, bx = rr.cx - g.x, bz = rr.cz - g.z, out = Math.hypot(bx, bz) > 2.4 ? 0.6 : 0; g.vx = Math.sin(g.ph * 0.7 + g.id) * 0.45 + bx * out * 0.3; g.vz = Math.cos(g.ph * 0.6 + g.id) * 0.45 + bz * out * 0.3; } }
    // a shy ghost freezes while you look its way, even outside the beam's reach
    if (K.shy && !lit) { let da = Math.atan2(g.z - m.z, g.x - m.x) - m.face; da = Math.atan2(Math.sin(da), Math.cos(da)); if (Math.abs(da) < 0.9) { g.vx *= 0.1; g.vz *= 0.1; } }
    if (g.flee > 0) { g.flee -= dt; g.vx = -dx / d * 1.5; g.vz = -dz / d * 1.5; }
    for (const o of G.ghosts) { if (o === g || o.hid) continue; const ox = g.x - o.x, oz = g.z - o.z, od = Math.hypot(ox, oz); if (od < 1.3 && od > 1e-4) { g.vx += ox / od * (1.3 - od) * 2.5; g.vz += oz / od * (1.3 - od) * 2.5; } }      // ghosts keep apart
    g.x += g.vx * dt; g.z += g.vz * dt; const hx = c.rw / 2 * RS - 0.6; g.x = clamp(g.x, -hx, hx); g.z = clamp(g.z, -c.rh * RS + 0.6, -0.6); g.room = roomAt(G, g.x, g.z);
    // it reaches you: a scare
    if (d < 0.65 && g.flee <= 0 && !lit && m.scared <= 0 && !K.flee) { m.scared = 1.6; g.flee = 2.6; g.cap = 0; G.scares++; G.ev.push({ k: 'scare', x: g.x, z: g.z, kind: g.kind });
      if (G.lesson) { lessonMiss(G); return; } m.hearts--; if (m.hearts <= 0) return finish(G, false, 'scared'); } }
  if (G.lesson) lessonTick(G, dt);
}
function finish(G, win, why) { const c = G.cfg; G.over = win ? 'won' : 'lost';
  const stars = win ? (G.scares === 0 && G.oil > 20 ? 3 : G.scares <= 1 ? 2 : 1) : 0;
  G.res = { win, why, stars, caught: G.caught, total: G.total, scares: G.scares, oil: Math.round(G.oil), book: G.book, time: Math.round(G.t), coins: G.coins + (win ? 4 + Math.ceil(G.N / 3) + stars : 0) };
  G.ev.push({ k: win ? 'won' : 'lost', why }); return true; }
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'light', title: 'LIGHT IT', say: G => lanternCue(G)[0], do: G => lanternCue(G)[1], at: G => lanternCue(G)[2], how: 'Drag a little to turn your lantern without walking. Hold the ghost in the beam until the lantern pulls it in. Catch 2.', need: 2 }],
  2: [{ id: 'behind', title: 'FROST', say: G => lanternCue(G)[0], do: G => lanternCue(G)[1], at: G => lanternCue(G)[2], how: 'Frost at the edge of the screen: a ghost is close, that way. Turn to it and catch it. Twice.', need: 2 }],
  3: [{ id: 'shy', title: 'SHY GHOSTS', say: G => lanternCue(G)[0], do: G => lanternCue(G)[1], at: G => lanternCue(G)[2], how: 'Shy ghosts move only when you look away. Turn to it, then walk closer and hold it in the light. Catch 2.', need: 2 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonSetup(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonSetup(G) { G.ghosts = []; G.oil = G.cfg.oil; for (const r of G.rooms) r.awake = true; G.lesson.spawnT = 0.8; }
function lessonTick(G, dt) { const st = lessonNow(G), m = G.me, R = G.rnd; if (G.ghosts.length) return; G.lesson.spawnT -= dt; if (G.lesson.spawnT > 0) return; G.lesson.spawnT = 1.2;
  const kind = st.id === 'shy' ? 'shy' : 'wisp', a = st.id === 'behind' ? m.face + Math.PI + (R() - 0.5) * 1.2 : st.id === 'light' ? m.face + (R() < 0.5 ? -1 : 1) * (0.9 + R() * 0.8) : m.face + (R() - 0.5) * 2, d = st.id === 'shy' ? 5 : 3.6;
  let x = m.x + Math.cos(a) * d, z = m.z + Math.sin(a) * d; const r0 = roomRect(G, 0, 0); x = clamp(x, r0.x0 + 0.8, r0.x1 - 0.8 + (G.cfg.rw > 1 ? RS : 0)); z = clamp(z, r0.z0 + 0.8, r0.z1 - 0.8); const g = addGhost(G, kind, x, z); if (st.id === 'light') g.slow = 1; }
function lessonSee(G, what) { const st = lessonNow(G); if (!st || what !== 'catch') return; G.lesson.n++; if (G.lesson.n < st.need) { G.ev.push({ k: 'lessonok', n: G.lesson.n, need: st.need }); return; }
  G.lesson.i++; G.lesson.n = 0; if (G.lesson.i >= G.lesson.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.lessonEnd = true; G.wait = 1.4; } else lessonSetup(G); }
function lessonMiss(G) { const st = lessonNow(G); if (!st) return; G.lesson.n = 0; G.ev.push({ k: 'lessonmiss', how: st.how }); }
// ---------- for the robots ----------
// BLIND: a thumb that does not look: drags some way (a little or a lot), or lets go
const BLIND = { d: G => { const R = Math.random; if (R() < 0.2) setStick(G, 0, 0); else { const a = R() * TAU, L = R() < 0.5 ? 0.3 : 0.5 + R() * 0.5; setStick(G, Math.cos(a) * L, Math.sin(a) * L); } } };
// the way through the house: rooms by their doorways (breadth first)
function roomHops(G, from) { const h = { [from]: 0 }, q = [from]; while (q.length) { const a = q.shift(); for (const d of G.doors) { const b = d.a === a ? d.b : d.b === a ? d.a : -1; if (b >= 0 && h[b] == null) { h[b] = h[a] + 1; q.push(b); } } } return h; }
function pathTo(G, from, to) { if (from === to || from < 0 || to < 0) return null; const prev = { [from]: -1 }, q = [from]; while (q.length) { const a = q.shift(); if (a === to) break; for (const d of G.doors) { const b = d.a === a ? d.b : d.b === a ? d.a : -1; if (b >= 0 && prev[b] == null) { prev[b] = { a, d }; q.push(b); } } }
  if (prev[to] == null) return null; let cur = to, step = null; while (prev[cur] !== -1) { step = prev[cur]; if (step.a === from) return step.d; cur = step.a; } return step && step.d; }
// a person who looks: sees ghosts in the beam, the shimmer of one near, the frost of one close; turns to the most pressing
// one and holds it; walks to the next room (or a jar when the oil is low) when there is nothing to catch here
// THE TUTORIAL SAYS WHICH WAY (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing happens"). The hand slid left and
// right for ever. Now the robot is asked (dryPlan setStick): the hand slides the way it would (a little to turn, further to walk); HOLD IT IN
// THE LIGHT when the ghost is in the beam.
const LTC = { t: -1e9, v: null };
function lanternCue(G) { if (G.over || G.wait > 0) return ['WAIT…', 'wait', false]; const now = performance.now(); if (now - LTC.t < 200) return LTC.v; LTC.t = now; const P = dryPlan(G, null, { t: -1 }); let v;
  if (P && P[0] === 'setStick' && (P[1] || P[2])) { const R = 70 * k, x0 = W / 2, y0 = H * 0.66, m = Math.hypot(P[1], P[2]); v = [m < 0.45 ? 'SLIDE A LITTLE TO TURN' : 'SLIDE TO WALK', 'drag', [x0, y0, x0 + P[1] * R, y0 + P[2] * R]]; }
  else v = ['HOLD IT IN THE LIGHT…', 'wait', false]; LTC.v = v; return v; }
function honest(G, o, mem) {
  const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random, m = G.me, c = G.cfg;
  if (G.over || G.wait > 0) { ACT.setStick(G, 0, 0); return; }
  mem.t = (mem.t || 0) - 1 / 60; if (mem.t > 0) return; mem.t = 0.1 + react * 0.35;
  const known = G.ghosts.filter(g => !g.hid && (g.lit > 0.3 || Math.hypot(g.x - m.x, g.z - m.z) < 5.5 + (g.lit ? 2 : 0)) && (g.room === roomAt(G, m.x, m.z) || Math.hypot(g.x - m.x, g.z - m.z) < 3.5));
  // the most pressing ghost: the nearest, the one being caught kept on
  let tg = null, tv = 1e9; for (const g of known) { const d = Math.hypot(g.x - m.x, g.z - m.z), v = d - g.cap * 3 - (g.kind === 'gold' ? 2 : 0) - (mem.tid === g.id ? 1 : 0); if (v < tv) { tv = v; tg = g; } }
  if (tg && R() < acc + 0.05) { mem.tid = tg.id; const dx = tg.x - m.x, dz = tg.z - m.z, d = Math.hypot(dx, dz), lead = (KINDS[tg.kind].zig ? 0.25 : 0.1); const ax = dx + tg.vx * lead, az = dz + tg.vz * lead, L = Math.hypot(ax, az) || 1, a = Math.atan2(az, ax);
    let da = a - m.face; da = Math.atan2(Math.sin(da), Math.cos(da)); const far = d > 3.6 || (KINDS[tg.kind].shy && d > 2.8 && Math.abs(da) < 0.3) || (tg.kind === 'gold' && d > 2.5) || (Math.abs(da) < 0.3 && tg.lit < 0.3 && d > 1.2);
    const mag = far && Math.abs(da) < 0.35 ? 0.85 : 0.3; ACT.setStick(G, ax / L * mag, az / L * mag); return; }
  mem.tid = null;
  // nothing to catch here: a jar if the oil is low, else the nearest room with ghosts left (or not yet seen)
  const here = roomAt(G, m.x, m.z); let goal = null;
  if (G.oil < 35 && G.jars.length) { const j = G.jars.reduce((a, b) => Math.hypot(a.x - m.x, a.z - m.z) < Math.hypot(b.x - m.x, b.z - m.z) ? a : b); goal = { x: j.x, z: j.z, room: j.room }; }
  if (!goal) { const left = G.ghosts.filter(g => g.kind !== 'gold'), hops = roomHops(G, here); let gr = mem.gid != null ? left.find(g => g.id === mem.gid) : null;
    if (!gr) { let bv = 1e9; for (const g of left) { const rm = g.hid ? g.hid.room : g.room, v = (hops[rm] == null ? 99 : hops[rm]) * 10 + Math.hypot(g.x - m.x, g.z - m.z) * 0.1; if (v < bv) { bv = v; gr = g; } } }
    if (gr) { mem.gid = gr.id; goal = { x: gr.hid ? gr.hid.x : gr.x, z: gr.hid ? gr.hid.z : gr.z, room: gr.hid ? gr.hid.room : gr.room }; } }
  if (!goal) { ACT.setStick(G, 0, 0); return; }
  let wx = goal.x, wz = goal.z; if (goal.room !== here) { const d = pathTo(G, here, goal.room); if (d) { const horiz = Math.abs(d.x - Math.round(d.x / RS) * RS) < 0.01 && G.rooms[d.a].j === G.rooms[d.b].j; wx = d.x; wz = d.z; const dd = Math.hypot(d.x - m.x, d.z - m.z); if (dd < 0.9) { const to = G.rooms[d.a] && roomAt(G, m.x, m.z) === d.a ? d.b : d.a, rr = roomRect(G, G.rooms[to].i, G.rooms[to].j); wx = rr.cx; wz = rr.cz; } } }
  else if (Math.hypot(goal.x - m.x, goal.z - m.z) < 2.2) { const a = Math.atan2(goal.z - m.z, goal.x - m.x); ACT.setStick(G, Math.cos(a) * 0.3, Math.sin(a) * 0.3); return; }
  const dx = wx - m.x, dz = wz - m.z, L = Math.hypot(dx, dz) || 1; ACT.setStick(G, dx / L, dz / L);
}
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.caught = G.total; finish(G, true); }

// what the robot would do now, without doing it (tools/dry_plan.py): the tutorial shows this move
const ACT_REAL = { setStick }; let ACT = ACT_REAL;
function dryPlan(G, o, mem) { let got = null; const rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { if (!got && !(a.length > 2 && a.slice(1).every(v => v === 0 || v === false))) got = [n, ...a.slice(1)]; return true; };      /* (a stick at rest, all its numbers 0, is not a move; a first bed, number 0, is) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return got; }
function dryPlanAll(G, o, mem) { const all = [], rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { all.push([n, ...a.slice(1)]); return true; };      /* every call, in order (for a robot that steers and drifts at once) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return all; }
