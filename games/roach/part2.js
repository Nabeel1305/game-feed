
// ===================== THE RULES: Roach Run (his idea 12, 20 Nov 2026) =====================
// You are a cockroach in a crack in the kitchen wall. Each round: look out, run for the food, bring enough home before the
// lights come on. Your left thumb is a floating stick; the right thumb has SPRINT (a short stamina bar that refills when you
// walk, stand or hide), and buttons that appear when they mean something: HIDE near a hiding place, DROP while you carry a
// big piece. Food is picked up by touching it; crumbs are light, big pieces are worth three but slow you down.
// The people: while you are out in the open they start to notice you (faster in the light, near them, when you sprint); under
// furniture they cannot see you. When they have seen you: a SLIPPER (its shadow grows where you were heading, a swish rises,
// then it lands), later the SPRAY (the can comes down and aims, then a cloud that lingers and blocks the way).
// World: centimetres; x across the room, z away from the wall your crack is in (the crack is at z = 0, the middle).
const RULES = [
  '<b>Left thumb</b>: a floating stick. Push the way you want to run.',
  'Touch food to pick it up. Bring enough back to <b>your crack</b> (the glowing gap) before the lights come on.',
  '<b>Crumbs</b> are light. <b>Big pieces</b> are worth three but slow you: <b>DROP</b> one to escape.',
  'Push the stick <b>all the way to SPRINT</b>: it uses the stamina ring, which refills when you walk, stop or hide.',
  'Out in the open (and in the <b>light</b>) people notice you. <b>Under furniture</b> they cannot see you; <b>HIDE</b> appears near a hiding place.',
  'A <b>shadow</b> on the floor: a slipper is coming where you were heading. Turn away! The <b>spray can</b> comes down before it sprays: get round the cloud.',
];
const ROOMS = [{ id: 'kitchen', name: 'The Kitchen' }, { id: 'bath', name: 'The Bathroom' }, { id: 'bed', name: 'The Bedroom' }, { id: 'dining', name: 'The Dining Room' }];
const roomOf = N => N <= 4 ? 0 : Math.floor((N - 5) / 5) % 4 === 3 ? 0 : 1 + Math.floor((N - 5) / 5) % 3;
const PLACES = ROOMS;
const placeOf = roomOf;
const SKINS = [{ id: 'brown', name: 'Kitchen Brown', col: 0x6a3a1a, stars: 0 }, { id: 'amber', name: 'Amber', col: 0xb8661a, stars: 5 }, { id: 'midnight', name: 'Midnight', col: 0x1c1a24, stars: 12 },
  { id: 'copper', name: 'Copper', col: 0xb05a30, stars: 20 }, { id: 'green', name: 'Beetle Green', col: 0x1f6a3a, stars: 30 }, { id: 'ruby', name: 'Ruby', col: 0x8a1a2a, stars: 42 },
  { id: 'pearl', name: 'Pearl', col: 0xd8d0c0, stars: 56 }, { id: 'gold', name: 'Golden', col: 0xd6a630, stars: 75 }];
const UPGRADES = [
  { id: 'legs', name: 'Quick legs', max: 3, cost: l => [30, 70, 140][l], desc: 'A little faster, walking and sprinting.' },
  { id: 'lungs', name: 'Big lungs', max: 3, cost: l => [25, 60, 120][l], desc: 'A longer stamina bar.' },
  { id: 'back', name: 'Strong back', max: 3, cost: l => [35, 80, 150][l], desc: 'Carry more, and big pieces slow you less.' },
  { id: 'shell', name: 'Tough shell', max: 2, cost: l => [60, 140][l], desc: 'Spray takes longer to get to you.' },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Nymph'], [60, 'Scuttler'], [200, 'Crumb raider'], [500, 'Night runner'], [1100, 'Kitchen legend'], [2500, 'Untouchable']];
const RW = 360, RD = 260, CX = RW / 2, HOME = { x: CX, z: 0 };
function makeCfg(N, help) { const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), boss = N % 5 === 0;
  return { need: N === 1 ? 3 : N === 2 ? 4 : Math.min(12, 3 + Math.floor(f / 3) + (boss ? 2 : 0)), bigs: N >= 3, slipper: N >= 2, spray: N >= 4, light: N >= 5, walker: N >= 6, people: N >= 9 && boss ? 2 : 1,
    notice: x(0.16, 0.5, 20) * (help ? 0.7 : 1), cd: x(5.0, 2.2, 22), warn: x(1.25, 0.9, 25) * (help ? 1.15 : 1), lead: x(0.7, 1.0, 20), sprayShare: N >= 4 ? x(0.3, 0.5, 30) : 0,
    far: x(130, 300, 15), time: 0, boss, help: !!help,
    walk: 34 * (1 + 0.06 * upLv('legs')), run: 64 * (1 + 0.06 * upLv('legs')), stam: 1 + 0.25 * upLv('lungs'), cap: 3 + upLv('back'), bigSlow: 0.2 - 0.04 * upLv('back'), cough: 1 + 0.35 * upLv('shell') }; }
function nightOf(c, N) { const f = curve(N); return Math.round((22 + c.need * 8) * (1.35 - 0.45 * (1 - Math.exp(-f / 20)))) + (c.help ? 20 : 0); }
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, wait: 0, next: null, mini: !!o.mini };
  setup(G); if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else G.ev.push({ k: 'start' });
  return G; }
// ---------- the room: furniture (solid parts, the covered floor under it), hiding places, light, food ----------
function furnish(G, room) { const R = G.rnd, S = [], C = [], H = [], items = [];
  const rect = (x0, z0, x1, z1) => S.push({ t: 'r', x0, z0, x1, z1 }), circ = (x, z, r) => S.push({ t: 'c', x, z, r }), cover = (x0, z0, x1, z1) => C.push({ x0, z0, x1, z1 }), hide = (x, z, name) => H.push({ x, z, r: 12, name });
  const legs = (x, z, w, d, r, kind, h) => { for (const [a, b] of [[0, 0], [w, 0], [0, d], [w, d]]) circ(x + a, z + b, r); cover(x, z, x + w, z + d); items.push({ kind, x, z, w, d, h }); };
  // along the far wall: cupboards (a gap under them) or the room's big piece
  if (room === 'kitchen') { rect(0, RD - 50, 250, RD); cover(0, RD - 60, 250, RD - 50); items.push({ kind: 'counter', x: 0, z: RD - 60, w: 250, d: 60, h: 90 });
    rect(RW - 75, RD - 70, RW, RD); items.push({ kind: 'fridge', x: RW - 75, z: RD - 70, w: 75, d: 70, h: 180 }); hide(RW - 40, RD - 76, 'under the fridge');
    const tx = 110 + R() * 60, tz = 95 + R() * 20; legs(tx, tz, 120, 75, 3, 'table', 75); legs(tx - 50, tz + 18, 40, 40, 2, 'chair', 45); legs(tx + 130, tz + 18, 40, 40, 2, 'chair', 45);
    circ(40, 150, 16); items.push({ kind: 'bin', x: 40, z: 150, r: 16, h: 45 }); hide(40, 128, 'behind the bin'); items.push({ kind: 'shoe', x: 300, z: 60 }); hide(300, 60, 'in a shoe'); }
  if (room === 'bath') { rect(0, RD - 75, 170, RD); cover(0, RD - 82, 170, RD - 75); items.push({ kind: 'tub', x: 0, z: RD - 82, w: 170, d: 82, h: 55 }); hide(85, RD - 88, 'under the bath');
    circ(270, RD - 40, 22); items.push({ kind: 'toilet', x: 270, z: RD - 40, r: 22, h: 40 }); circ(RW - 40, 120, 10); items.push({ kind: 'sink', x: RW - 40, z: 120, r: 10, h: 85 });
    items.push({ kind: 'mat', x: 70, z: 110, w: 70, d: 45 }); cover(70, 110, 140, 155); hide(105, 132, 'under the mat'); items.push({ kind: 'box', x: 250, z: 70 }); hide(250, 70, 'in a tissue box'); circ(230, 140, 9); items.push({ kind: 'basket', x: 230, z: 140, r: 9, h: 30 }); }
  if (room === 'bed') { rect(130, RD - 190, 290, RD - 186); rect(130, RD - 6, 290, RD); cover(130, RD - 186, 290, RD - 6); items.push({ kind: 'bed', x: 130, z: RD - 190, w: 160, d: 190, h: 50 }); for (const [a, b] of [[130, RD - 186], [286, RD - 186]]) circ(a + 2, b, 4);
    rect(0, RD - 60, 90, RD); cover(0, RD - 66, 90, RD - 60); items.push({ kind: 'wardrobe', x: 0, z: RD - 66, w: 90, d: 66, h: 200 }); hide(45, RD - 72, 'under the wardrobe');
    legs(RW - 55, RD - 50, 40, 40, 2.5, 'nightstand', 55); items.push({ kind: 'rug', x: 40, z: 40, w: 90, d: 60 }); items.push({ kind: 'shoe', x: 80, z: 150 }); hide(80, 150, 'in a slipper'); items.push({ kind: 'box', x: RW - 50, z: 70 }); hide(RW - 50, 70, 'in a box'); }
  if (room === 'dining') { const tx = 90 + R() * 40, tz = 100 + R() * 20; legs(tx, tz, 180, 90, 4, 'table', 75); for (const [a, b] of [[20, -45], [120, -45], [20, 95], [120, 95]]) legs(tx + a, tz + b, 40, 40, 2, 'chair', 45);
    rect(40, RD - 45, 260, RD); cover(40, RD - 52, 260, RD - 45); items.push({ kind: 'sideboard', x: 40, z: RD - 52, w: 220, d: 52, h: 85 }); hide(150, RD - 58, 'under the sideboard');
    circ(RW - 30, RD - 30, 18); items.push({ kind: 'plant', x: RW - 30, z: RD - 30, r: 18, h: 60 }); hide(RW - 30, RD - 54, 'behind the plant'); items.push({ kind: 'shoe', x: 40, z: 50 }); hide(40, 50, 'in a shoe'); }
  return { S, C, H, items }; }
const inRect = (r, x, z, m = 0) => x > r.x0 - m && x < r.x1 + m && z > r.z0 - m && z < r.z1 + m;
function blocked(G, x, z, m = 1.6) { if (x < m || x > RW - m || z > RD - m) return true; if (z < m && !(Math.abs(x - CX) < 6)) return true; if (z < -8) return true;
  for (const s of G.solids) if (s.t === 'c' ? Math.hypot(x - s.x, z - s.z) < s.r + m : inRect(s, x, z, m)) return true;
  for (const p of G.people) if (Math.hypot(x - p.x, z - p.z) < 16 + m) return true;
  for (const s of G.slips) if (s.land && Math.hypot(x - s.x, z - s.z) < 9 + m) return true;
  return false; }
const covered = (G, x, z) => G.covers.some(c => inRect(c, x, z));
const lit = (G, x, z) => G.lights.some(L => Math.hypot(x - L.x, z - L.z) < L.r);
const atHome = (x, z) => z < 5 && Math.abs(x - CX) < 9;
function freeSpot(G, near, far, o = {}) { const R = G.rnd; for (let n = 0; n < 400; n++) { const x = 12 + R() * (RW - 24), z = 14 + R() * (RD - 28), d = Math.hypot(x - CX, z);
    if (d < near || d > far || blocked(G, x, z, 5)) continue; if (o.cover != null && covered(G, x, z) !== o.cover) continue; if (o.lit != null && lit(G, x, z) !== o.lit) continue; return { x, z }; } return null; }
function setup(G, o = {}) { const c = G.cfg, R = G.rnd; G.t = 0; G.yard = o.yard || null;
  const room = o.room || ROOMS[roomOf(G.N)].id, F = furnish(G, room); G.room = room; G.solids = F.S; G.covers = F.C; G.hides = F.H; G.items = F.items;
  G.people = []; G.slips = []; G.sprays = []; G.puffs = []; G.lights = []; G.food = []; G.fid = 0;
  if (c.light && !o.noLight) { for (let n = 0; n < 2 + (G.N >= 15 ? 1 : 0); n++) { const L = { x: 60 + R() * (RW - 120), z: 40 + R() * (RD - 110), r: 38 + R() * 20 }; if (!covered(G, L.x, L.z)) G.lights.push(L); } }
  const nP = o.people != null ? o.people : c.slipper ? c.people : 0;
  for (let n = 0; n < nP; n++) { const p = freeSpot(G, 120, 400) || { x: 60, z: 200 }; G.people.push({ x: p.x, z: p.z, notice: 0, cd: 2 + n * 2, walk: c.walker && !o.still, tx: p.x, tz: p.z, face: 0, step: 0 }); }
  // food: crumbs on the safer way (near cover), the big ones out in the open (and the light)
  const want = o.food || c.need * 1.7 + 2, nearF = o.foodNear || 40; let v = 0;
  if (c.bigs && !o.food) for (let n = 0; n < 1 + Math.floor(c.need / 5); n++) { const p = freeSpot(G, c.far * 0.6, c.far + 40, { cover: false, lit: G.lights.length ? true : null }) || freeSpot(G, c.far * 0.5, c.far + 60); if (p) { G.food.push({ id: ++G.fid, x: p.x, z: p.z, v: 3, big: true, wait: 0 }); v += 3; } }
  while (v < want) { const nearCover = R() < 0.6, p = freeSpot(G, Math.max(nearF, c.far * 0.35), c.far, { cover: nearCover ? true : null }) || freeSpot(G, nearF, c.far + 60); if (!p) break; G.food.push({ id: ++G.fid, x: p.x, z: p.z, v: 1, big: false, wait: 0 }); v += 1; }
  G.me = { x: CX, z: -5, vx: 0, vz: 0, sx: 0, sz: 0, run: false, stam: c.stam, tired: false, hidden: null, load: [], cough: 0, out: false };
  G.stash = 0; G.trips = 0; G.attacks = 0; G.dodges = 0; G.dropped = 0; G.night = o.time || nightOf(c, G.N); G.clock = G.night; G.seenT = 0; }
// ---------- your thumbs ----------
function stick(G, x, z) { if (!G.me) return; const L = Math.hypot(x, z); G.me.sx = L > 1 ? x / L : x; G.me.sz = L > 1 ? z / L : z; }
function sprint(G, on) { if (G.me) G.me.run = on; }
const hideNear = G => { const m = G.me; return G.hides.find(h => Math.hypot(m.x - h.x, m.z - h.z) < h.r + 6); };
function hideBtn(G) { const m = G.me; if (G.over || G.wait > 0) return false; if (m.hidden) { m.hidden = null; G.ev.push({ k: 'unhide' }); return true; } const h = hideNear(G); if (!h) return false; m.hidden = h; m.x = h.x; m.z = h.z; m.vx = m.vz = 0; G.ev.push({ k: 'hide', name: h.name }); if (G.lesson) lessonSee(G, 'hide'); return true; }
function dropBtn(G) { const m = G.me, i = m.load.findIndex(q => q.big); if (i < 0 || G.over) return false; const q = m.load.splice(i, 1)[0]; G.food.push({ id: ++G.fid, x: m.x, z: m.z, v: q.v, big: true, wait: 1.2 }); G.dropped++; G.ev.push({ k: 'drop' }); return true; }
const loadOf = m => m.load.reduce((a, q) => a + q.v, 0);
const speedK = (G, m) => Math.max(0.55, 1 - 0.05 * m.load.filter(q => !q.big).length - G.cfg.bigSlow * m.load.filter(q => q.big).length);
// ---------- the clock ----------
function step(G, dt) { if (G.over || !(dt > 0)) return;
  if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0) { G.wait = 0; if (G.next) { const f = G.next; G.next = null; f(); } } return; }
  G.t += dt; const m = G.me, c = G.cfg;
  // the clock: the lights come on at dawn
  if (!G.lesson) { G.clock -= dt; if (G.clock <= 0) { G.ev.push({ k: 'dawn' }); finish(G, false, { why: 'dawn' }); return; } }
  // moving: the stick, sprint and stamina, carrying
  const hid = !!m.hidden; if (hid && Math.hypot(m.sx, m.sz) > 0.7) { m.hidden = null; G.ev.push({ k: 'unhide' }); }
  const mag = Math.hypot(m.sx, m.sz), going = !m.hidden && mag > 0.15, running = going && m.run && !m.tired && m.stam > 0;
  if (running) { m.stam -= dt * 0.55; if (m.stam <= 0) { m.stam = 0; m.tired = true; G.ev.push({ k: 'tired' }); } }
  else { m.stam = Math.min(c.stam, m.stam + dt * (m.hidden ? 0.9 : going ? 0.16 : 0.32)); if (m.tired && m.stam > 0.3 * c.stam) m.tired = false; }
  const sp = (running ? c.run : c.walk) * speedK(G, m) * Math.min(1, mag), tx = going ? m.sx * sp : 0, tz = going ? m.sz * sp : 0;
  m.vx += (tx - m.vx) * Math.min(1, dt * 14); m.vz += (tz - m.vz) * Math.min(1, dt * 14); m.running = running;
  if (!m.hidden) { const nx = m.x + m.vx * dt, nz = m.z + m.vz * dt; if (!blocked(G, nx, nz)) { m.x = nx; m.z = nz; } else if (!blocked(G, nx, m.z)) { m.x = nx; m.vz *= 0.5; } else if (!blocked(G, m.x, nz)) { m.z = nz; m.vx *= 0.5; } else { m.vx *= 0.3; m.vz *= 0.3; } }
  if (!m.out && m.z > 6) { m.out = true; G.ev.push({ k: 'out' }); }
  // food: touch it to take it
  if (!m.hidden) for (let i = G.food.length - 1; i >= 0; i--) { const f = G.food[i]; if (f.wait > 0) { f.wait -= dt; continue; } if (Math.hypot(f.x - m.x, f.z - m.z) < (f.big ? 5 : 3.4) && loadOf(m) + f.v <= c.cap) { G.food.splice(i, 1); m.load.push({ v: f.v, big: f.big }); G.ev.push({ k: 'take', big: f.big, n: m.load.length }); if (G.lesson) lessonSee(G, 'take'); } }
  // home: what you carry goes on the stash
  if (atHome(m.x, m.z) && m.load.length) { const v = loadOf(m); G.stash += v; G.trips++; G.ev.push({ k: 'home', v, stash: G.stash, n: m.load.length }); m.load = [];
    if (G.lesson) { lessonSee(G, 'home'); if (G.over || G.wait > 0) return; } else if (G.stash >= c.need) { finish(G, true); return; } }
  if (m.z < 2 && m.out && !m.load.length && G.stash < c.need) { /* back in the crack, empty: safe */ }
  // the people: they notice you in the open; then a slipper or the spray
  const open = !m.hidden && m.z > 4 && !covered(G, m.x, m.z), inLight = open && lit(G, m.x, m.z);
  for (const p of G.people) { p.cd -= dt;
    if (p.walk) { const d = Math.hypot(p.tx - p.x, p.tz - p.z); if (d < 4) { const q = freeSpot(G, 80, 400); if (q) { p.tx = q.x; p.tz = q.z; } } else { const s = Math.min(d, 22 * dt), nx = p.x + (p.tx - p.x) / d * s, nz = p.z + (p.tz - p.z) / d * s; p.x = nx; p.z = nz; p.step += dt; } }
    const dist = Math.hypot(m.x - p.x, m.z - p.z), near = clamp(1.6 - dist / 160, 0.5, 1.6), mov = Math.hypot(m.vx, m.vz) > 4 ? 1 : 0.35;
    if (open && !G.lesson) p.notice = Math.min(1, p.notice + dt * c.notice * near * mov * (inLight ? 2.2 : 1) * (m.running ? 1.3 : 1)); else if (!G.lesson) p.notice = Math.max(0, p.notice - dt * (m.hidden ? 0.6 : 0.3));
    p.face = Math.atan2(m.x - p.x, m.z - p.z);
    const busy = G.slips.some(s => !s.land) || G.sprays.some(s => s.t < s.raise);
    if (!busy && p.cd <= 0 && (p.notice >= 1 || (G.lesson && G.lesson.force && open && m.out)) && G.people.length) { attack(G, p); p.notice = 0.25; p.cd = G.lesson ? 2.4 : c.cd; } }
  // slippers: the shadow grows; then it lands
  for (const s of G.slips) { s.t += dt;
    if (!s.land && s.t >= s.T) { s.land = true; s.lt = 0; const d = Math.hypot(m.x - s.x, m.z - s.z), safe = m.hidden || covered(G, m.x, m.z); G.ev.push({ k: 'slap', x: s.x, z: s.z, d });
      if (d < s.r + 1.5 && !safe) { caught(G, 'slipper'); return; } if (d < s.r + 30) { G.dodges++; G.ev.push({ k: 'dodge', d }); if (G.lesson) { lessonSee(G, 'dodge'); if (G.over || G.wait > 0) return; } } }
    if (s.land) s.lt += dt; }
  G.slips = G.slips.filter(s => !s.land || s.lt < 1.6);
  // spray: the can aims (a warning), then puffs along its line that linger, then fade
  for (const s of G.sprays) { s.t += dt; if (s.t >= s.raise && s.t < s.raise + 0.7) { const n = Math.floor((s.t - s.raise) / 0.7 * 11); while (s.n < n) { const k2 = s.n++, d = 26 + k2 * 11; G.puffs.push({ x: s.ox + s.dx * d + (G.rnd() - 0.5) * 6, z: s.oz + s.dz * d + (G.rnd() - 0.5) * 6, r: 5, R: 11 + k2 * 0.9, t: 0, life: 3.2 }); if (k2 === 0) G.ev.push({ k: 'hiss' }); } } }
  if (G.sprays.some(s => s.t > s.raise + 0.7 && !s.done)) for (const s of G.sprays) if (s.t > s.raise + 0.7 && !s.done) { s.done = true; s.endT = G.t; }
  G.sprays = G.sprays.filter(s => s.t < s.raise + 5);
  let inCloud = false; for (const p of G.puffs) { p.t += dt; p.r = Math.min(p.R, p.r + dt * 14); const a = p.t < p.life ? 1 : Math.max(0, 1 - (p.t - p.life)); p.a = a; if (a > 0.35 && Math.hypot(m.x - p.x, m.z - p.z) < p.r) inCloud = true; }
  G.puffs = G.puffs.filter(p => p.t < p.life + 1);
  if (inCloud && !m.hidden) { m.cough += dt * 1.5 / c.cough; if (!G.coughT || G.t - G.coughT > 0.5) { G.coughT = G.t; G.ev.push({ k: 'cough' }); } if (m.cough >= 1) { caught(G, 'spray'); return; } } else m.cough = Math.max(0, m.cough - dt * 0.7);
  if (G.lesson) lessonTick(G); }
function attack(G, p) { const m = G.me, c = G.cfg; G.attacks++;
  const spray = c.spray && (G.lesson ? G.lesson.steps[0].id === 'hide' : G.rnd() < c.sprayShare);
  if (spray) { const dx = m.x - p.x, dz = m.z - p.z, L = Math.hypot(dx, dz) || 1; G.sprays.push({ ox: p.x, oz: p.z, dx: dx / L, dz: dz / L, tx: m.x, tz: m.z, t: 0, raise: c.warn + 0.25, n: 0 }); G.ev.push({ k: 'can' }); return; }
  // a slipper where you were heading
  let x = m.x + m.vx * c.warn * c.lead, z = m.z + m.vz * c.warn * c.lead; x = clamp(x, 8, RW - 8); z = clamp(z, 8, RD - 8);
  G.slips.push({ x, z, r: 8, t: 0, T: c.warn, land: false }); G.ev.push({ k: 'shadow', x, z }); }
function caught(G, why) { G.ev.push({ k: 'caught', why }); if (G.lesson) { lessonMiss(G, why); return; } finish(G, false, { why }); }
function finish(G, win, o = {}) { if (G.over) return true; G.over = win ? 'won' : 'lost'; const c = G.cfg, left = Math.max(0, G.clock), frac = left / G.night;
  const stars = win ? 1 + (frac >= 0.3 ? 1 : 0) + (G.stash >= c.need + 3 ? 1 : 0) : 0;
  G.res = { win, stars, why: o.why || null, stash: G.stash, need: c.need, trips: G.trips, left: Math.round(left), dodges: G.dodges, attacks: G.attacks, room: ROOMS[roomOf(G.N)].name,
    coins: Math.max(1, G.stash * 2 + (win ? Math.ceil(G.N / 2) + stars * 3 + G.dodges : 0)) };
  G.ev.push({ k: win ? 'won' : 'lost' }); return true; }
// ---------- the robot: a roach who looks (a path round the furniture, out of the light, away from shadows and clouds) ----------
const CELL = 5, GX = Math.ceil(RW / CELL), GZ = Math.ceil(RD / CELL);
function navGrid(G) { if (G.nav && G.navFor === G.solids) return G.nav; const b = new Uint8Array(GX * GZ), cost = new Float32Array(GX * GZ);
  for (let i = 0; i < GX; i++) for (let j = 0; j < GZ; j++) { const x = (i + 0.5) * CELL, z = (j + 0.5) * CELL, n = i + j * GX; b[n] = G.solids.some(s => s.t === 'c' ? Math.hypot(x - s.x, z - s.z) < s.r + 3.5 : inRect(s, x, z, 3.5)) || x < 3 || x > RW - 3 || z > RD - 3 ? 1 : 0; cost[n] = covered(G, x, z) ? 1 : lit(G, x, z) ? 2.6 : 1.5; }
  G.nav = { b, cost }; G.navFor = G.solids; return G.nav; }
function path(G, x0, z0, x1, z1, avoid) { const N = navGrid(G), ci = x => clamp(Math.floor(x / CELL), 0, GX - 1), cj = z => clamp(Math.floor(z / CELL), 0, GZ - 1), s = ci(x0) + cj(Math.max(1, z0)) * GX, g = ci(x1) + cj(Math.max(1, z1)) * GX;
  const bad = n => { if (N.b[n]) return true; if (!avoid) return false; const x = (n % GX + 0.5) * CELL, z = (Math.floor(n / GX) + 0.5) * CELL; return avoid(x, z); };
  const D = new Float32Array(GX * GZ).fill(1e9), P = new Int32Array(GX * GZ).fill(-1), H = [], gi = g % GX, gj = Math.floor(g / GX); D[s] = 0; let iter = 0;
  const push = (f, n) => { H.push([f, n]); let k2 = H.length - 1; while (k2 > 0) { const p = (k2 - 1) >> 1; if (H[p][0] <= H[k2][0]) break; [H[p], H[k2]] = [H[k2], H[p]]; k2 = p; } };
  const pop = () => { const top = H[0], last = H.pop(); if (H.length) { H[0] = last; let k2 = 0; for (;;) { const a = 2 * k2 + 1, b = a + 1; let m2 = k2; if (a < H.length && H[a][0] < H[m2][0]) m2 = a; if (b < H.length && H[b][0] < H[m2][0]) m2 = b; if (m2 === k2) break; [H[m2], H[k2]] = [H[k2], H[m2]]; k2 = m2; } } return top; };
  push(0, s); const badC = new Int8Array(GX * GZ);
  while (H.length && iter++ < 6000) { const [f0, n] = pop(); if (n === g) break; const i = n % GX, j = Math.floor(n / GX); if (f0 > D[n] + Math.hypot(i - gi, j - gj) + 1e-3) continue;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= GX || b >= GZ) continue; const m2 = a + b * GX; if (m2 !== g) { if (!badC[m2]) badC[m2] = bad(m2) ? 1 : 2; if (badC[m2] === 1) continue; } const nd = D[n] + Math.hypot(di, dj) * N.cost[m2]; if (nd < D[m2]) { D[m2] = nd; P[m2] = n; push(nd + Math.hypot(a - gi, b - gj), m2); } } }
  if (P[g] < 0 && g !== s) return null; const out = []; let n = g; while (n >= 0 && n !== s) { out.unshift({ x: (n % GX + 0.5) * CELL, z: (Math.floor(n / GX) + 0.5) * CELL }); n = P[n]; } return out; }
function honest(G, o, mem) { if (G.over || G.wait > 0 || !G.me) return; const m = G.me, c = G.cfg, acc = o.acc == null ? 0.85 : o.acc, react = o.react == null ? 0.3 : o.react;
  mem.cd = (mem.cd || 0) - 1 / 60; if (mem.cd > 0) return; mem.cd = react * 0.3 * (0.5 + Math.random());
  const need = c.need - G.stash, load = loadOf(m);
  // threats: a slipper about to land where I will be; a cloud (or a can aiming) on my way
  for (const s of G.slips) { if (s.land) continue; const left = s.T - s.t, px = m.x + m.vx * left, pz = m.z + m.vz * left; if (Math.hypot(px - s.x, pz - s.z) < s.r + 7 || Math.hypot(m.x - s.x, m.z - s.z) < s.r + 4) {
      if (mem.seen !== s) { mem.seen = s; mem.see = Math.random() < 0.8 + 0.2 * acc; mem.rt = react * 1.2 * (0.7 + 0.6 * Math.random()); } if (s.t < mem.rt) continue; if (mem.seenOnce !== s) { mem.seenOnce = s; mem.big = m.load.some(q => q.big) && left < 0.6 && Math.random() < acc; } if (!mem.see) continue; if (mem.big) { dropBtn(G); mem.big = false; }
      let ax = m.x - s.x, az = m.z - s.z; if (Math.hypot(ax, az) < 2) { ax = -m.vz; az = m.vx; } const L = Math.hypot(ax, az) || 1; let dx = ax / L, dz = az / L;
      if (blocked(G, m.x + dx * 10, m.z + dz * 10, 2)) { const alt = [[-dz, dx], [dz, -dx], [-dx, -dz]].find(([a, b]) => !blocked(G, m.x + a * 10, m.z + b * 10, 2)); if (alt) [dx, dz] = alt; }
      stick(G, dx, dz); sprint(G, m.stam > 0.15); mem.path = null; return; } }
  const danger = (x, z) => G.puffs.some(p => p.a > 0.2 && Math.hypot(x - p.x, z - p.z) < p.R + 4) || G.sprays.some(s => s.t < s.raise + 0.7 && lineD(s, x, z) < 20) || G.slips.some(s => !s.land && Math.hypot(x - s.x, z - s.z) < s.r + 5);
  if (danger(m.x, m.z) && Math.random() < 0.85 + 0.15 * acc) { // out of the way: the nearest safe step
    let best = null; for (let a = 0; a < 16; a++) { const dx = Math.cos(a / 16 * TAU), dz = Math.sin(a / 16 * TAU); if (blocked(G, m.x + dx * 8, m.z + dz * 8, 2)) continue; let d = 0; while (d < 60 && danger(m.x + dx * d, m.z + dz * d)) d += 4; if (d < 60 && (!best || d < best.d)) best = { d, dx, dz }; }
    if (best) { stick(G, best.dx, best.dz); sprint(G, m.stam > 0.15); mem.path = null; return; } }
  // being watched: hide if a hiding place is close
  const watch = Math.max(0, ...G.people.map(p => p.notice)), hn = hideNear(G);
  if (m.hidden) { if (watch < 0.15 && !G.sprays.length && !G.puffs.some(p => p.a > 0.2)) { hideBtn(G); } else { stick(G, 0, 0); return; } }
  if (hn && watch > 0.7 && Math.random() < acc) { hideBtn(G); stick(G, 0, 0); return; }
  // where to: home when carrying enough; otherwise food (near and on the safe side first)
  let goal = null; if (load >= need || load >= c.cap - 0 || (load && !G.food.some(f => f.wait <= 0 && loadOf(m) + f.v <= c.cap))) goal = { x: CX, z: 1, home: true };
  else { let bf = 1e9; for (const f of G.food) { if (f.wait > 0 || load + f.v > c.cap) continue; const d = Math.hypot(f.x - m.x, f.z - m.z) + Math.hypot(f.x - CX, f.z) * 0.5 + (f.big ? (need >= 3 ? -40 : 30) : 0) + (lit(G, f.x, f.z) ? 25 : 0); if (d < bf) { bf = d; goal = f; } } }
  if (!goal) { stick(G, 0, 0); return; }
  if (!mem.path || mem.goal !== goal || G.t - (mem.pt || 0) > 0.5) { mem.goal = goal; mem.pt = G.t; mem.path = path(G, m.x, m.z, goal.x, goal.z, (x, z) => danger(x, z)) || path(G, m.x, m.z, goal.x, goal.z); mem.pi = 0; }
  const P = mem.path; if (!P || !P.length) { stick(G, goal.x - m.x, goal.z - m.z); return; }
  while (mem.pi < P.length - 1 && Math.hypot(P[mem.pi].x - m.x, P[mem.pi].z - m.z) < 6) mem.pi++;
  const w = P[Math.min(P.length - 1, mem.pi + 1)], dx = w.x - m.x, dz = (goal.home && mem.pi >= P.length - 2 ? goal.z - 6 : w.z) - m.z, L = Math.hypot(dx, dz) || 1;
  const wob = (1 - acc) * 0.5 * (Math.random() - 0.5); stick(G, dx / L + wob, dz / L - wob);
  sprint(G, m.stam > 0.6 * c.stam && (watch > 0.4 || goal.home && load >= need)); }
function lineD(s, x, z) { const ex = s.ox + s.dx * 150, ez = s.oz + s.dz * 150, vx = ex - s.ox, vz = ez - s.oz, t = clamp(((x - s.ox) * vx + (z - s.oz) * vz) / (vx * vx + vz * vz), 0, 1); return Math.hypot(x - s.ox - vx * t, z - s.oz - vz * t); }
// blind moves (no looking): push the stick a random way (or let go), sprint on or off, the HIDE button
const BLIND = { m: G => { if (Math.random() < 0.2) stick(G, 0, 0); else { const a = Math.random() * TAU; stick(G, Math.cos(a), Math.sin(a)); } }, s: G => sprint(G, !G.me.run), h: G => hideBtn(G) };
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.wait = 0; G.stash = G.cfg.need; finish(G, true); }
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'eat', title: 'RUN, GRAB, GET HOME', say: 'PUSH TO RUN', do: 'drag', dir: 'up', how: 'Left thumb: push the stick to run. Touch the crumbs to pick them up, then bring them back to your crack (the glowing gap). 3 crumbs.', need: 3 }],
  2: [{ id: 'slip', title: 'DODGE THE SLIPPER', say: 'RUN AWAY FROM THE SHADOW', do: 'drag', dir: 'lr', how: 'A shadow on the floor: a slipper is coming, aimed where you are heading. Turn away, or push the stick all the way to SPRINT. Dodge 3.', need: 3, force: true }],
  3: [{ id: 'hide', title: 'HIDE FROM THE SPRAY', say: 'HIDE!', do: 'tap', how: 'The can comes down and aims: get out of its line, under furniture, or into a hiding place with HIDE. Live through 2 sprays.', need: 2, force: true }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0, force: !!LESSONS[G.N][0].force }; G.ev.push({ k: 'lessonnext', first: true }); lessonDeal(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonDeal(G) { const st = lessonNow(G), n = G.lesson.n; G.rnd = rng(G.seed + (G.deals = (G.deals | 0) + 1));
  if (st.id === 'eat') { setup(G, { yard: 'eat', room: 'kitchen', people: 0, food: 3, foodNear: 30, noLight: true }); G.food.forEach((f, i) => { f.x = CX - 30 + i * 30; f.z = 45 + (i % 2) * 15; f.big = false; f.v = 1; }); G.lesson.n = G.stash; }
  if (st.id === 'slip') { setup(G, { yard: 'slip', room: 'kitchen', people: 1, food: 4, noLight: true, still: true }); G.people[0].cd = 1.2; G.lesson.n = n; G.cfg = Object.assign({}, G.cfg, { slipper: true }); }
  if (st.id === 'hide') { setup(G, { yard: 'hide', room: 'kitchen', people: 1, food: 4, noLight: true, still: true }); G.people[0].cd = 1.5; G.cfg = Object.assign({}, G.cfg, { spray: true, warn: 1.25 }); G.lesson.n = n; }
  G.ev.push({ k: 'yard' }); }
function lessonMiss(G, why) { const msg = { slipper: 'SPLAT! Watch the shadow: it lands where you were going. Turn away from it.', spray: 'Coughing! Keep out of the cloud: go round it, under furniture, or HIDE.' }[why] || lessonNow(G).how;
  G.ev.push({ k: 'lessonmiss', how: msg }); G.wait = 1.4; G.next = () => lessonDeal(G); }
function lessonTick(G) { const L = lessonNow(G); if (!L) return;
  if (L.id === 'hide') for (const s of G.sprays) if (s.done && !s.counted && G.t - s.endT > 2.5) { s.counted = true; G.lesson.n++; G.ev.push({ k: 'lessonok', n: G.lesson.n, need: L.need }); if (G.lesson.n >= L.need) lessonEnd(G); return; } }
function lessonSee(G, what) { const L = lessonNow(G); if (!L || G.wait > 0) return;
  if (L.id === 'eat' && what === 'home') { G.lesson.n = G.stash; G.ev.push({ k: 'lessonok', n: Math.min(G.stash, L.need), need: L.need }); }
  if (L.id === 'slip' && what === 'dodge') { G.lesson.n++; G.ev.push({ k: 'lessonok', n: G.lesson.n, need: L.need }); }
  if (G.lesson.n >= L.need) lessonEnd(G); }
function lessonEnd(G) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.wait = 1.4; G.next = () => { G.rnd = rng(G.seed); G.cfg = makeCfg(G.N, G.cfg.help); setup(G); G.ev.push({ k: 'start' }); G.ev.push({ k: 'yard' }); }; }
