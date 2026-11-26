
// ===================== THE RULES: Sheepdog (my idea for set 15) =====================
// You are the dog. Hold your thumb on the field and she runs there; let go and she lies down. A quick tap is a BARK. Sheep
// are not commanded, they are pushed: they move away from the dog, keep together, and panic and scatter if she comes in too
// fast. Gather the strays, drive the flock to the pen and through its gate before the sun goes down.
// Later: lambs that follow their mothers, a black ram who only moves for a bark, a river to cross by the bridge, walls and
// trees, and at dusk a fox that creeps up on any sheep left on its own (run at it to see it off).
// World: metres; x across, z up the field (away from the camera); the pen is up the field.
const RULES = [
  '<b>Hold</b> your thumb on the field: the dog runs there. <b>Let go</b>: she lies down.',
  'Sheep move <b>away from the dog</b> and keep together. Come in <b>slowly</b>: rush them and they scatter.',
  'Bring <b>strays</b> back by going round the far side of them. Then walk behind the flock to <b>drive</b> it to the gate.',
  '<b>Tap</b> quickly to <b>BARK</b>: everything near jumps away. The black <b>ram</b> only moves for a bark.',
  'Lambs follow their mothers. The river is crossed by the <b>bridge</b>. At dusk a <b>fox</b> creeps up on a sheep alone: run at it.',
  'Pen enough sheep before the sun goes down.',
];
const FIELDS = [{ name: 'Home Meadow', sky: 'morning' }, { name: 'River Farm', sky: 'noon' }, { name: 'High Moor', sky: 'overcast' }, { name: 'Valley at Dusk', sky: 'golden' }, { name: 'Misty Hills', sky: 'mist' }, { name: 'Rainy Downs', sky: 'rain' }];
const placeOf = N => Math.floor((N - 1) / 5) % FIELDS.length;
const PLACES = FIELDS;
const SKINS = [{ id: 'bess', name: 'Bess (black and white)', col: 0x1a1a1a, stars: 0 }, { id: 'red', name: 'Rusty (red and white)', col: 0x8a3a1a, stars: 5 }, { id: 'merle', name: 'Blue (merle)', col: 0x5a6a7a, stars: 12 },
  { id: 'tri', name: 'Tess (tricolour)', col: 0x3a2a1a, stars: 20 }, { id: 'gold', name: 'Goldie', col: 0xc8902a, stars: 30 }, { id: 'snow', name: 'Snow', col: 0xe8e8e0, stars: 42 },
  { id: 'choc', name: 'Cocoa', col: 0x5a3220, stars: 56 }, { id: 'star', name: 'Champion', col: 0x2a2a6a, stars: 75 }];
const UPGRADES = [
  { id: 'legs', name: 'Long legs', max: 3, cost: l => [30, 70, 140][l], desc: 'She runs a little faster.' },
  { id: 'bark', name: 'Big bark', max: 3, cost: l => [25, 60, 120][l], desc: 'Her bark reaches further.' },
  { id: 'calm', name: 'Calm eye', max: 3, cost: l => [35, 80, 150][l], desc: 'Sheep panic less when she comes in fast.' },
  { id: 'nose', name: 'Good nose', max: 2, cost: l => [50, 120][l], desc: 'She sees the fox sooner (and so do you).' },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Pup'], [60, 'Farm dog'], [200, 'Good dog'], [500, 'Trial dog'], [1100, 'Champion'], [2500, 'Supreme champion']];
const FR = 34, hyp = (a, b) => Math.sqrt(a * a + b * b);      // the field: x and z from -FR to FR
function makeCfg(N, help) { const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), boss = N % 5 === 0;
  const n = Math.min(18, Math.round(x(5, 16, 18)) + (boss ? 2 : 0));
  return { n, need: N <= 2 ? n : n - Math.floor(n / 9), lambs: N >= 3 ? Math.floor(x(1, 5, 20)) : 0, ram: N >= 6 && N % 2 === 0 || N === 3 ? 1 : 0, river: N >= 4 && (N % 3 !== 2 || N > 12), trees: N >= 2 ? Math.round(x(2, 9, 20)) : 0,
    fox: N >= 5 ? (N >= 14 ? 2 : 1) : 0, foxAt: x(0.6, 0.35, 20), spread: x(7, 22, 15), far: x(22, 46, 18), panic: x(1.0, 1.3, 30) * (1 - 0.12 * upLv('calm')), time: 0, boss, help: !!help,
    run: 11 * (1 + 0.05 * upLv('legs')), barkR: 7 + 1.2 * upLv('bark'), nose: upLv('nose') }; }
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, wait: 0, next: null, mini: !!o.mini };
  setup(G); if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else G.ev.push({ k: 'start' });
  return G; }
// ---------- the field: the pen (with its gate), trees, walls, a river and its bridge ----------
function setup(G, o = {}) { const c = G.cfg, R = G.rnd; G.t = 0; G.yard = o.yard || null;
  const pen = { x: (R() - 0.5) * 30, z: FR - 7, w: 10, d: 8 }; pen.gx = pen.x; pen.gz = pen.z - pen.d / 2; pen.gw = 3.2; G.pen = Object.assign(pen, o.pen || {});
  G.trees = []; G.rocks = []; G.river = null;
  if (o.river != null ? o.river : c.river) { const z0 = (R() - 0.5) * 12 + 2, bx = (R() - 0.5) * 30; G.river = { z0: z0 - 2.2, z1: z0 + 2.2, bx, bw: 4 }; }
  for (let i = 0; i < (o.trees != null ? o.trees : c.trees); i++) { for (let tries = 0; tries < 30; tries++) { const x = (R() - 0.5) * 2 * (FR - 4), z = (R() - 0.5) * 2 * (FR - 6), r = 1.2 + R() * 1.6; if (hyp(x - pen.x, z - pen.z) < 12 || Math.abs(z - (FR - 30)) < 0 || (G.river && z > G.river.z0 - 4 && z < G.river.z1 + 4) || hyp(x, z + FR * 0.4) < 6) continue; G.trees.push({ x, z, r }); break; } }
  // the sheep, spread in groups down the field; lambs with their mothers; the ram
  G.sheep = []; G.sid = 0; const n = o.n || c.n, spread = o.spread || c.spread, cz = o.cz != null ? o.cz : -FR * 0.15 - c.far * 0.25;
  const groups = Math.max(1, Math.round(spread / 7)); for (let i = 0; i < n; i++) { const g = i % groups, gx = (g / Math.max(1, groups - 1) - 0.5) * spread * 1.6 + (R() - 0.5) * 3, gz = cz + (R() - 0.5) * spread * 0.6 + (g % 2 ? 3 : -3);
    let x = clamp(gx + (R() - 0.5) * 4, -FR + 3, FR - 3), z = clamp(gz + (R() - 0.5) * 4, -FR + 3, FR - 12); if (G.river && inRiver(G, x, z, 1.5)) z = G.river.z0 - 3;
    G.sheep.push({ id: ++G.sid, x, z, vx: 0, vz: 0, h: R() * TAU, kind: 'ewe', penned: false, lost: false, calm: R(), panic: 0, mum: null }); }
  for (let i = 0; i < (o.lambs != null ? o.lambs : c.lambs) && i < G.sheep.length; i++) { const m = G.sheep[i * 2 % G.sheep.length]; G.sheep.push({ id: ++G.sid, x: m.x + 1, z: m.z, vx: 0, vz: 0, h: 0, kind: 'lamb', penned: false, lost: false, calm: R(), panic: 0, mum: m }); }
  if (o.ram != null ? o.ram : c.ram) { const s = G.sheep[(R() * G.sheep.length) | 0]; G.sheep.push({ id: ++G.sid, x: s.x + 2, z: s.z - 1, vx: 0, vz: 0, h: 0, kind: 'ram', penned: false, lost: false, calm: 1, panic: 0, mum: null }); }
  G.dog = { x: 0, z: -FR + 4, vx: 0, vz: 0, tx: null, tz: null, down: true, bark: 0, barkCd: 0 };
  G.foxes = []; G.allInT = null; G.foxN = o.fox != null ? o.fox : c.fox; G.penned = 0; G.lost = 0; G.barks = 0; G.scatter = 0; G.chased = 0;
  G.day = o.time || Math.round((24 + G.sheep.length * 3.6 + c.far * 0.9 + (G.river ? 12 : 0) + (c.ram ? 8 : 0)) * (c.help ? 1.25 : 1) * (1.25 - 0.25 * (1 - Math.exp(-curve(G.N) / 25)))); G.clock = G.day; }
const inRiver = (G, x, z, m = 0) => G.river && z > G.river.z0 - m && z < G.river.z1 + m && Math.abs(x - G.river.bx) > G.river.bw / 2 - 0.3;
const inPen = (G, x, z) => { const p = G.pen; return Math.abs(x - p.x) < p.w / 2 - 0.4 && z > p.z - p.d / 2 + 0.6 && z < p.z + p.d / 2 - 0.4; };
// walls: the pen's fence (with the gate gap) and the field's edge; trees; the river (except the bridge)
function solid(G, x, z, r = 0.5, who = 'sheep') { if (Math.abs(x) > FR - r || Math.abs(z) > FR - r) return true;
  for (const t of G.trees) if (hyp(x - t.x, z - t.z) < t.r + r) return true;
  if (who !== 'dog' && inRiver(G, x, z, 0)) return true;
  const p = G.pen, lx = x - p.x, lz = z - p.z, hw = p.w / 2, hd = p.d / 2;
  if (Math.abs(lx) < hw + r && Math.abs(lz) < hd + r) { const inside = Math.abs(lx) < hw - r && Math.abs(lz) < hd - r; if (!inside) { if (lz < -hd + r && Math.abs(lx) < p.gw / 2 - r * 0.2) return false; return who === 'dog' ? !inPen(G, x, z) && !(lz < 0 && Math.abs(lx) < p.gw / 2) : true; } }
  return false; }
// ---------- your thumb ----------
function dogTo(G, x, z) { const d = G.dog; if (G.over) return; if (x == null) { d.tx = d.tz = null; d.down = true; return; } d.tx = clamp(x, -FR + 1, FR - 1); d.tz = clamp(z, -FR + 1, FR - 1); d.down = false; }
function bark(G) { const d = G.dog, c = G.cfg; if (G.over || G.wait > 0 || d.barkCd > 0) return false; d.bark = 0.4; d.barkCd = 0.7; G.barks++; G.ev.push({ k: 'bark' });
  for (const s of G.sheep) { if (s.penned || s.lost) continue; const dx = s.x - d.x, dz = s.z - d.z, L = hyp(dx, dz); if (L < c.barkR) { const f = (1 - L / c.barkR) * 9 + 3; s.vx += dx / (L || 1) * f; s.vz += dz / (L || 1) * f; s.panic = Math.min(1, s.panic + (s.kind === 'ram' ? 0.4 : 0.6)); s.barked = 1.2; } }
  for (const fx of G.foxes) if (hyp(fx.x - d.x, fx.z - d.z) < c.barkR * 1.4 && fx.state !== 'gone') { fx.state = 'flee'; G.ev.push({ k: 'foxoff' }); G.chased++; }
  return true; }
// ---------- the clock ----------
function step(G, dt) { if (G.over || !(dt > 0)) return;
  if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0) { G.wait = 0; if (G.next) { const f = G.next; G.next = null; f(); } } return; }
  G.t += dt; const c = G.cfg, d = G.dog;
  if (!G.lesson) { G.clock -= dt; if (G.clock <= 0) { G.ev.push({ k: 'dusk' }); finish(G, G.penned >= c.need, { why: 'dark' }); return; } }
  // the dog: runs to your thumb (faster the further it is); lies down when you let go
  d.bark = Math.max(0, d.bark - dt); d.barkCd = Math.max(0, d.barkCd - dt);
  let tvx = 0, tvz = 0; if (d.tx != null) { const dx = d.tx - d.x, dz = d.tz - d.z, L = hyp(dx, dz); if (L > 0.3) { const sp = Math.min(c.run, 1.2 + L * 1.4); tvx = dx / L * sp; tvz = dz / L * sp; } }
  d.vx += (tvx - d.vx) * Math.min(1, dt * 7); d.vz += (tvz - d.vz) * Math.min(1, dt * 7); const nx = d.x + d.vx * dt, nz = d.z + d.vz * dt;
  if (!solid(G, nx, nz, 0.45, 'dog')) { d.x = nx; d.z = nz; }
  else { const t = G.trees.find(q => hyp(nx - q.x, nz - q.z) < q.r + 0.6); let moved = false;      // round a tree: slide along it the way she was going
    if (t) { let ax = -(d.z - t.z), az = d.x - t.x; const L = hyp(ax, az) || 1; ax /= L; az /= L; if (ax * d.vx + az * d.vz < 0) { ax = -ax; az = -az; } const sp = hyp(d.vx, d.vz), mx = d.x + ax * sp * dt, mz = d.z + az * sp * dt; if (!solid(G, mx, mz, 0.45, 'dog')) { d.x = mx; d.z = mz; moved = true; } }
    if (!moved) { if (!solid(G, nx, d.z, 0.45, 'dog')) d.x = nx; else if (!solid(G, d.x, nz, 0.45, 'dog')) d.z = nz; else { d.vx *= 0.3; d.vz *= 0.3; } } }
  const dsp = hyp(d.vx, d.vz); d.sp = dsp;
  // the flock: away from the dog; together; apart enough; along with the rest; a nibble of grass when calm
  const live = G.sheep.filter(s => !s.lost);
  for (const s of live) { let fx = 0, fz = 0;
    if (s.penned) { if (G.rnd() < dt * 0.5) { s.wx = (G.rnd() - 0.5) * 1.2; s.wz = (G.rnd() - 0.5) * 1.2; } fx += (s.wx || 0) - s.vx; fz += (s.wz || 0) - s.vz; }
    else {
      const dx = s.x - d.x, dz = s.z - d.z, L = hyp(dx, dz) || 0.01, R0 = 9 + dsp * 0.35, press = L < R0 ? (1 - L / R0) : 0, scare = s.kind === 'ram' ? (L < 2.6 || s.barked > 0 ? 0.6 : 0) : 1;
      if (press > 0 && scare > 0) { const k2 = (5 + dsp * 0.5 * c.panic) * press * scare * (d.down ? 0.55 : 1); fx += dx / L * k2; fz += dz / L * k2; if (dsp > 6.5 && L < 6 && s.kind !== 'ram') { s.panic = Math.min(1, s.panic + dt * (dsp - 6) * 0.35 * c.panic); } }
      if (s.barked > 0) s.barked -= dt;
      // the others
      let cx = 0, cz = 0, n = 0, ax = 0, az = 0, sx = 0, sz = 0; for (let q = 0; q < live.length; q++) { const o = live[q]; if (o === s || o.penned) continue; const ox = o.x - s.x, oz = o.z - s.z, D = ox * ox + oz * oz; if (D < 64) { cx += o.x; cz += o.z; ax += o.vx; az += o.vz; n++; if (D < 1.2) { const q = Math.sqrt(D) || 0.1; sx -= ox / q * (1.1 - q); sz -= oz / q * (1.1 - q); } } }
      if (n) { const coh = s.panic > 0.5 ? 0.15 : 0.6, al = 0.35; fx += ((cx / n - s.x) * coh + (ax / n - s.vx) * al); fz += ((cz / n - s.z) * coh + (az / n - s.vz) * al); } fx += sx * 6; fz += sz * 6;
      if (s.mum && !s.mum.lost) { const mx = s.mum.x - s.x, mz = s.mum.z - s.z, ml = hyp(mx, mz); if (ml > 1.6) { fx += mx / ml * Math.min(4, ml); fz += mz / ml * Math.min(4, ml); } }
      if (s.panic > 0.4) { fx += Math.cos(s.h) * 3 * s.panic; fz += Math.sin(s.h) * 3 * s.panic; if (G.rnd() < dt * 2) s.h += (G.rnd() - 0.5) * 2; }      // a panicked sheep bolts its own way
      fx -= s.vx * 1.1; fz -= s.vz * 1.1; s.panic = Math.max(0, s.panic - dt * 0.25);
      // the river bank and the trees push back
      if (G.river && Math.abs(s.x - G.river.bx) > G.river.bw / 2 - 0.6 && ((s.z < G.river.z0 && s.z > G.river.z0 - 2.5 && fz > 0) || (s.z > G.river.z1 && s.z < G.river.z1 + 2.5 && fz < 0))) { fx += Math.sign(G.river.bx - s.x) * Math.min(3, Math.abs(fz) + 1); }      // pushed at the bank, they follow it to the bridge
    }
    s.vx += fx * dt * 2.2; s.vz += fz * dt * 2.2; const maxv = s.penned ? 1.2 : s.panic > 0.5 ? 6.5 : s.kind === 'lamb' ? 3.4 : 4.2, v = hyp(s.vx, s.vz); if (v > maxv) { s.vx *= maxv / v; s.vz *= maxv / v; }
    const nx2 = s.x + s.vx * dt, nz2 = s.z + s.vz * dt;
    if (s.penned) { if (inPen(G, nx2, nz2)) { s.x = nx2; s.z = nz2; } else { s.vx *= -0.5; s.vz *= -0.5; } }
    else if (inRiver(G, s.x, s.z, 0)) { s.z = s.z - G.river.z0 < G.river.z1 - s.z ? G.river.z0 - 0.05 : G.river.z1 + 0.05; }      // never left standing in the water
    else if (!solid(G, nx2, nz2, 0.45)) { s.x = nx2; s.z = nz2; }
    else { const t = G.trees.find(q => hyp(nx2 - q.x, nz2 - q.z) < q.r + 0.6); let moved = false;      // round a tree, the way it was going
      if (t) { let ax = -(s.z - t.z), az = s.x - t.x; const L = hyp(ax, az) || 1; ax /= L; az /= L; if (ax * s.vx + az * s.vz < 0) { ax = -ax; az = -az; } const mx = s.x + ax * v * dt, mz = s.z + az * v * dt; if (!solid(G, mx, mz, 0.45)) { s.x = mx; s.z = mz; s.vx = ax * v; s.vz = az * v; moved = true; } }
      if (!moved) { if (!solid(G, nx2, s.z, 0.45)) { s.x = nx2; s.vz *= 0.5; } else if (!solid(G, s.x, nz2, 0.45)) { s.z = nz2; s.vx *= 0.5; } else { s.vx *= -0.3; s.vz *= -0.3; } } }
    if (v > 0.3) s.h = Math.atan2(s.vz, s.vx);
    if (!s.penned && inPen(G, s.x, s.z)) { s.penned = true; G.penned++; G.ev.push({ k: 'penned', n: G.penned, kind: s.kind }); if (G.lesson) { lessonSee(G, 'pen'); if (G.over || G.wait > 0) return; } else if (G.penned >= c.need && G.sheep.every(q => q.penned || q.lost)) { finish(G, true); return; } } }
  if (!G.lesson && G.penned >= c.need && G.allInT == null) G.allInT = G.t;
  if (G.allInT != null && G.t - G.allInT > 4 && !G.lesson) { finish(G, true); return; }      // enough are in: four seconds' grace for the rest, then home
  // scattering: a panicked flock is noted (and costs a star)
  const pan = live.filter(s => !s.penned && s.panic > 0.6).length; if (pan >= 3 && (!G.scT || G.t - G.scT > 3)) { G.scT = G.t; G.scatter++; G.ev.push({ k: 'scatter' }); }
  // the fox: comes at dusk, creeps up on a sheep alone, carries it off; runs from the dog
  if (G.foxN && G.clock < G.day * c.foxAt && G.foxes.length < G.foxN && (!G.foxT || G.t - G.foxT > 9)) { G.foxT = G.t; const side = G.rnd() < 0.5 ? -1 : 1; G.foxes.push({ x: side * (FR - 1), z: (G.rnd() - 0.5) * FR, state: 'creep', target: null, t: 0 }); G.ev.push({ k: 'fox' }); }
  for (const fx of G.foxes) { fx.t += dt; const dd = hyp(fx.x - d.x, fx.z - d.z);
    if (fx.state === 'gone') continue;
    if (fx.state !== 'flee' && dd < 5 && dsp > 3) { fx.state = 'flee'; G.chased++; G.ev.push({ k: 'foxoff' }); }
    if (fx.state === 'flee') { const ax = fx.x - d.x, az = fx.z - d.z, L = hyp(ax, az) || 1; fx.x += ax / L * 9 * dt; fx.z += az / L * 9 * dt; if (Math.abs(fx.x) > FR + 2 || Math.abs(fx.z) > FR + 2) { fx.state = 'gone'; } continue; }
    // the loneliest sheep
    if (!fx.target || fx.target.penned || fx.target.lost || G.rnd() < dt * 0.2) { let best = null, bs = -1; for (const s of live) { if (s.penned) continue; let near = 99; for (const o of live) if (o !== s && !o.penned) near = Math.min(near, hyp(o.x - s.x, o.z - s.z)); const sc = near * 2 + hyp(s.x - d.x, s.z - d.z) * 0.5 - hyp(s.x - fx.x, s.z - fx.z) * 0.3; if (sc > bs) { bs = sc; best = s; } } fx.target = best; }
    const T = fx.target; if (!T) continue; const tx = T.x - fx.x, tz = T.z - fx.z, L = hyp(tx, tz) || 1, sp = L > 8 ? 4.5 : 2.6; fx.x += tx / L * sp * dt; fx.z += tz / L * sp * dt;
    if (L < 0.9) { let near = 99; for (const o of live) if (o !== T && !o.penned) near = Math.min(near, hyp(o.x - T.x, o.z - T.z)); if (near > 2.5 || G.lesson) { T.lost = true; G.lost++; fx.state = 'flee'; G.ev.push({ k: 'taken' }); if (live.length - G.lost < c.need && !G.lesson) { finish(G, false, { why: 'fox' }); return; } } else { fx.target = null; } } }
  if (G.lesson) lessonTick(G); }
function finish(G, win, o = {}) { if (G.over) return true; G.over = win ? 'won' : 'lost'; const c = G.cfg, left = Math.max(0, G.clock), frac = left / G.day;
  const all = G.penned >= G.sheep.length - G.lost && G.lost === 0, stars = win ? 1 + (frac >= 0.3 ? 1 : 0) + (all && G.scatter <= 1 ? 1 : 0) : 0;
  G.res = { win, stars, why: o.why || null, penned: G.penned, need: c.need, total: G.sheep.length, lost: G.lost, left: Math.round(left), scatter: G.scatter, chased: G.chased, barks: G.barks, field: FIELDS[placeOf(G.N)].name,
    coins: Math.max(1, G.penned + (win ? Math.ceil(G.N / 2) + stars * 3 + G.chased * 2 : 0)) };
  G.ev.push({ k: win ? 'won' : 'lost' }); return true; }
// ---------- the robot: a dog who herds the way real ones do (gather the furthest stray, then drive from behind) ----------
// THE TUTORIAL POINTS WHERE TO SEND THE DOG (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing happens"). It said HOLD
// BEHIND THEM with the hand always in the middle of the screen, behind nothing. Now the robot is asked (dryPlanAll): HOLD HERE with the hand on
// the very spot of grass it would send the dog to (behind the flock, round the far side of a stray), TAP TO BARK when it would bark.
const DGC = { t: -1e9, v: null };
function dogCue(G) { if (G.over || G.wait > 0) return ['WAIT…', 'wait', false]; const now = performance.now(); if (now - DGC.t < 200) return DGC.v; DGC.t = now; const all = dryPlanAll(G, null, { t: -1, next: -1 }), to = all.filter(q => q[0] === 'dogTo' && q[1] != null).pop(); let v = ['WAIT…', 'wait', false];
  if (all.some(q => q[0] === 'bark')) v = ['TAP TO BARK', 'tap', false];
  else if (to) { const p3 = scr(to[1], 0, to[2]); v = [G.lesson && G.lesson.steps[G.lesson.i].id === 'gather' ? 'GO ROUND HERE' : 'HOLD HERE', 'hold', [clamp(p3.x, 30, W - 30), clamp(p3.y, 90, H - 60)]]; }
  DGC.v = v; return v; }
function honest(G, o, mem) { if (G.over || G.wait > 0 || !G.dog) return; const d = G.dog, acc = o.acc == null ? 0.85 : o.acc, react = o.react == null ? 0.3 : o.react;
  mem.cd = (mem.cd || 0) - 1 / 60; if (mem.cd > 0) return; mem.cd = react * 0.25 * (0.5 + Math.random());
  const live = G.sheep.filter(s => !s.lost && !s.penned); if (!live.length) { ACT.dogTo(G, null); return; }
  // a fox: see it off
  const fox = G.foxes.find(f => f.state === 'creep' && (f.t > 1.2 * (1.5 - acc) || hyp(f.x - d.x, f.z - d.z) < 15)); if (fox && Math.random() < 0.9 + 0.1 * acc) { ACT.dogTo(G, fox.x, fox.z); if (hyp(fox.x - d.x, fox.z - d.z) < 6) ACT.bark(G); return; }
  const P = G.pen, gx = P.gx, gz = P.gz - 1.5, river = G.river;
  // where the flock should go next: the bridge if the river is between, else the gate (then in)
  let cx = 0, cz = 0; for (const s of live) { cx += s.x; cz += s.z; } cx /= live.length; cz /= live.length;
  let tx = gx, tz = gz; if (river && cz < river.z0) { tx = river.bx; tz = river.z1 + 2; } else if (hyp(cx - gx, cz - gz) < 3.5) { tx = P.x; tz = P.z + 2; }
  // the ram stuck at the back: bark at it
  const ram = live.find(s => s.kind === 'ram'); if (ram && hyp(ram.x - d.x, ram.z - d.z) < 4 && hyp(ram.vx, ram.vz) < 0.3 && Math.random() < acc) ACT.bark(G);
  // gather the furthest, else drive from behind (Strombom's rule)
  const fN = 2.2 * Math.sqrt(live.length) + 1.5; let far = null, fd = 0; for (const s of live) { const dd = hyp(s.x - cx, s.z - cz); if (dd > fd) { fd = dd; far = s; } }
  let px, pz, slow = false; const ux = tx - cx, uz = tz - cz, uL = hyp(ux, uz) || 1;
  if (fd > fN) { const ax = far.x - cx, az = far.z - cz, aL = hyp(ax, az) || 1; px = far.x + ax / aL * 2.6; pz = far.z + az / aL * 2.6; }
  else { const back = Math.max(3, fN * 0.5 + 1.8); px = cx - ux / uL * back; pz = cz - uz / uL * back; slow = true; }
  // go round, not through: if the flock is between, swing wide
  const vx = px - d.x, vz = pz - d.z, vL = hyp(vx, vz) || 1, t2 = clamp(((cx - d.x) * vx + (cz - d.z) * vz) / (vL * vL), 0, 1), cpx = d.x + vx * t2, cpz = d.z + vz * t2;
  if (hyp(cpx - cx, cpz - cz) < fN * 0.8 && vL > 4) { // round the flock, not through it: step along a circle toward the place
    const R2 = Math.max(hyp(d.x - cx, d.z - cz), fN + 3), ad = Math.atan2(d.z - cz, d.x - cx), ap = Math.atan2(pz - cz, px - cx); let da = ap - ad; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU;
    if (Math.abs(da) > 0.35) { const a2 = ad + clamp(da, -0.9, 0.9); px = cx + Math.cos(a2) * R2; pz = cz + Math.sin(a2) * R2; slow = false; } }
  // its thumb is a little off; it keeps the dog near (a slow walk) when driving
  const err = (1 - acc) * 2.5; px += (Math.random() - 0.5) * err; pz += (Math.random() - 0.5) * err;
  const L2 = hyp(px - d.x, pz - d.z); if (slow && L2 > 2.2) { const k3 = 2.2 / L2; px = d.x + (px - d.x) * k3; pz = d.z + (pz - d.z) * k3; }
  ACT.dogTo(G, px, pz); }
// blind moves: the thumb down somewhere on the field (or let go), a tap (bark)
const BLIND = { d: G => { if (Math.random() < 0.25) dogTo(G, null); else dogTo(G, (Math.random() - 0.5) * 2 * FR, (Math.random() - 0.5) * 2 * FR); }, b: G => bark(G) };      // (two moves: the blind test plays every string of them, and this game's flock is slow to simulate)
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.wait = 0; G.penned = G.cfg.need; finish(G, true); }
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'push', title: 'HOLD TO RUN, PUSH THEM IN', say: G => dogCue(G)[0], do: G => dogCue(G)[1], at: G => dogCue(G)[2], how: 'Hold your thumb on the field: your dog runs there. Sheep walk away from her. Get behind them (away from the pen) and walk them in. 3 sheep.', need: 3 }],
  2: [{ id: 'gather', title: 'GATHER THE STRAYS', say: G => dogCue(G)[0], do: G => dogCue(G)[1], at: G => dogCue(G)[2], how: 'They are scattered. Go round the FAR side of a stray to bring it back to the others; then drive them all in. Come in slowly: rushing scatters them. 5 sheep.', need: 5 }],
  3: [{ id: 'bark', title: 'TAP TO BARK', say: G => dogCue(G)[0], do: G => dogCue(G)[1], at: G => dogCue(G)[2], how: 'The black ram ignores you. Get close and TAP quickly: a bark. Bark him into the pen.', need: 1 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonDeal(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonDeal(G) { const st = lessonNow(G); G.rnd = rng(G.seed + (G.deals = (G.deals | 0) + 1));
  if (st.id === 'push') setup(G, { yard: 'push', n: 3, spread: 3, cz: FR - 24, trees: 0, river: false, lambs: 0, ram: 0, fox: 0, time: 999, pen: { x: 0, gx: 0 } });
  if (st.id === 'gather') setup(G, { yard: 'gather', n: 5, spread: 10, cz: FR - 28, trees: 0, river: false, lambs: 0, ram: 0, fox: 0, time: 999, pen: { x: 0, gx: 0 } });
  if (st.id === 'bark') { setup(G, { yard: 'bark', n: 1, spread: 2, cz: FR - 20, trees: 0, river: false, lambs: 0, ram: 1, fox: 0, time: 999, pen: { x: 0, gx: 0 } }); G.sheep[0].penned = true; G.sheep[0].x = G.pen.x; G.sheep[0].z = G.pen.z; G.penned = 0; }
  G.dog.z = G.pen.z - 24; G.lesson.n = 0; G.ev.push({ k: 'yard' }); }
function lessonTick(G) { }
function lessonSee(G, what) { const L = lessonNow(G); if (!L) return;
  if (what === 'pen') { const n = L.id === 'bark' ? (G.sheep.find(s => s.kind === 'ram') || {}).penned ? 1 : 0 : G.penned; G.lesson.n = n; G.ev.push({ k: 'lessonok', n, need: L.need }); }
  if (G.lesson.n >= L.need) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.wait = 1.4; G.next = () => { G.rnd = rng(G.seed); setup(G); G.ev.push({ k: 'start' }); G.ev.push({ k: 'yard' }); }; } }

// what the robot would do now, without doing it (tools/dry_plan.py): the tutorial shows this move
const ACT_REAL = { dogTo, bark }; let ACT = ACT_REAL;
function dryPlan(G, o, mem) { let got = null; const rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { if (!got && !(a.length > 2 && a.slice(1).every(v => v === 0 || v === false))) got = [n, ...a.slice(1)]; return true; };      /* (a stick at rest, all its numbers 0, is not a move; a first bed, number 0, is) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return got; }
function dryPlanAll(G, o, mem) { const all = [], rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { all.push([n, ...a.slice(1)]); return true; };      /* every call, in order (for a robot that steers and drifts at once) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return all; }
