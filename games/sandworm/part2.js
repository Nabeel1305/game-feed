// ===================== RULES: Sandworm Rider =====================
// You ride on the head of a giant worm that swims through the dunes. The left thumb steers (the worm turns in wide, heavy
// curves); hold SURGE to speed up; hold BRACE through sharp turns, impacts and landings. Cresting a dune fast, the worm breaches:
// it leaps out of the sand and comes down hard (brace!). Turn too sharply, hit a rock or a canyon wall, or land unbraced and
// your balance goes; empty, and you fall: back to the last waystone. Reach the end of the route before sunset.
// Units: metres, seconds; x east, z north, y up.

const RULES = [
  '<b>Steer with the left thumb</b>: the worm is heavy; it swings round in wide curves. Start the turn early.',
  '<b>Hold SURGE</b> to speed up; let go to ease off. Fast over a dune crest, the worm breaches: it leaps out of the sand.',
  '<b>Hold BRACE</b> for sharp turns, landings after a breach, rocks and cracked sand. Bracing steadies you but turns slower.',
  '<b>Your balance</b> (the ring by your rider): sharp turns and knocks shake it; ease off or brace and it comes back. Empty: you fall, back to the last waystone.',
  'Pass every pair of waystones to the end. Shortcuts are quicker and rougher. Three falls, or sunset, and the ride is over.',
];
const SKINS = [{ id: 'sand', name: 'Sand worm', col: 0xc8a070, stars: 0 }, { id: 'ash', name: 'Ash worm', col: 0x6a6460, stars: 6 }, { id: 'rust', name: 'Rust worm', col: 0xa84a2a, stars: 14 },
  { id: 'pearl', name: 'Pearl worm', col: 0xe8e0d0, stars: 24 }, { id: 'night', name: 'Night worm', col: 0x2a2a3a, stars: 36 }, { id: 'gold', name: 'Golden worm', col: 0xd8a830, stars: 50 }];
const UPGRADES = [{ id: 'saddle', name: 'Better saddle', max: 2, cost: l => [60, 140][l], desc: 'Your balance comes back faster.' }, { id: 'hooks', name: 'Rider hooks', max: 2, cost: l => [70, 160][l], desc: 'Knocks shake you less.' },
  { id: 'reins', name: 'Long reins', max: 1, cost: () => 110, desc: 'The worm answers your turns a little sooner.' }];
const upLv = id => { if (typeof HEADLESS !== 'undefined' && HEADLESS) return 0; return ((store.get('ups', {}) || {})[id]) | 0; };
const RANKS = [[0, 'Sand walker'], [60, 'Rider'], [200, 'Dune rider'], [500, 'Worm caller'], [1100, 'Storm rider'], [2500, 'Desert legend']];
const PLACES = [{ name: 'Open dunes', sky: 'morning' }, { name: 'Red canyons', sky: 'noon' }, { name: 'Buried city', sky: 'golden' }, { name: 'Storm sea', sky: 'overcast' }, { name: 'The deep desert', sky: 'sunset' }];
const placeOf = N => N <= 3 ? 0 : N <= 7 ? 1 : N <= 12 ? 2 : N <= 18 ? 3 : 4;
const WORMS = [{ name: 'young worm', turn: 1.0, vmax: 28, cruise: 14, len: 14 }, { name: 'great worm', turn: 0.8, vmax: 33, cruise: 16, len: 20 }, { name: 'elder worm', turn: 0.68, vmax: 37, cruise: 18, len: 26 }];

function makeCfg(N, help, o = {}) {
  const f = curve(N), e = easyOf(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s));
  const free = !!o.free;
  return { N, f, e, help: !!help, free, place: placeOf(N), worm: N <= 6 ? 0 : N <= 14 ? 1 : 2,
    legs: free ? 3 : Math.min(9, 3 + Math.floor(f / 3)), width: x(70, 30, 18) * (help ? 1.2 : 1),
    rocks: N >= 2 ? x(4, 14, 20) : 0, dunes: N >= 3 ? x(1, 1.8, 15) : 0.55, narrow: N >= 4, cracks: N >= 5 ? x(1, 4, 20) : 0, storm: N >= 6, shortcut: N >= 3,
    steady: (help ? 1.25 : 1) * (1 + 0.15 * upLv('saddle')), knock: (help ? 0.8 : 1) * (1 - 0.12 * upLv('hooks')),
    sunset: x(2.4, 1.45, 20) * (help ? 1.3 : 1), lives: 3 };
}
// ---------- the desert: dunes, the route (waystones), rocks, cracked sand, storms ----------
function sandH(G, x, z) { const D = G.cfg.dunes, a = G.duneA; const u = x * Math.cos(a) + z * Math.sin(a), v = -x * Math.sin(a) + z * Math.cos(a);
  return D * (9 * Math.sin(u * 0.022 + Math.sin(v * 0.006) * 2) + 4 * Math.sin(u * 0.05 + v * 0.013) + 2.2 * Math.sin(v * 0.031 + u * 0.01)) + 1.2 * Math.sin(x * 0.11) * Math.sin(z * 0.09); }
function makeRoute(G, R) {
  const c = G.cfg, pts = [{ x: 0, z: 0 }]; let a = R() * TAU, p = { x: 0, z: 0 };
  for (let i = 0; i < c.legs; i++) { if (i) a += (R() < 0.5 ? -1 : 1) * (0.45 + R() * (c.narrow ? 0.8 : 0.6)); const L = 240 + R() * 160; p = { x: p.x + Math.cos(a) * L, z: p.z + Math.sin(a) * L }; pts.push(p); }
  // the line between waystones bends (a few points along each leg), so it is a route, not a straight line
  const line = []; for (let i = 0; i < pts.length - 1; i++) { const A = pts[i], B = pts[i + 1], dx = B.x - A.x, dz = B.z - A.z, L = Math.hypot(dx, dz), nx = -dz / L, nz = dx / L, bend = (R() - 0.5) * L * 0.35, n = 8;
    for (let j = 0; j < n; j++) { const u = j / n, s = Math.sin(u * Math.PI) * bend; line.push({ x: A.x + dx * u + nx * s, z: A.z + dz * u + nz * s, leg: i }); } }
  line.push({ x: pts[pts.length - 1].x, z: pts[pts.length - 1].z, leg: pts.length - 2 });
  const legs = []; for (let i = 0; i < pts.length - 1; i++) legs.push({ narrow: c.narrow && R() < 0.45, storm: c.storm && R() < 0.3 && i > 0 });
  // shortcuts: a straighter, narrower way across a bend (rough: rocks and cracked sand)
  const cuts = []; if (c.shortcut) for (let i = 0; i < pts.length - 1; i++) { if (R() > 0.55 || legs[i].narrow) continue; const A = line[i * 8 + 1], B = line[i * 8 + 7]; cuts.push({ a: A, b: B, leg: i }); }
  // each part of the route: open (wide) or a canyon (narrow); a storm on some legs
  // rocks: near the line, never blocking the whole way (each leaves a side open); more on shortcuts
  const rocks = []; const nR = Math.round(c.rocks * (pts.length - 1) / 3);
  for (let i = 0; i < nR * 2 && rocks.length < nR; i++) { const s = line[2 + ((R() * (line.length - 4)) | 0)], n2 = line[Math.min(line.length - 1, line.indexOf(s) + 1)], dx = n2.x - s.x, dz = n2.z - s.z, L = Math.hypot(dx, dz) || 1, off = (R() - 0.5) * c.width * 0.6;
    if (legs[s.leg].narrow) continue;   // canyons have their walls; rocks only out in the open, always with a way past
    rocks.push({ x: s.x - dz / L * off, z: s.z + dx / L * off, r: 4 + R() * 5 }); }
  for (const cu of cuts) for (let j = 0; j < 3; j++) { const u = 0.25 + j * 0.25, x = cu.a.x + (cu.b.x - cu.a.x) * u, z = cu.a.z + (cu.b.z - cu.a.z) * u, dx = cu.b.x - cu.a.x, dz = cu.b.z - cu.a.z, L = Math.hypot(dx, dz) || 1, off = (R() < 0.5 ? -1 : 1) * 7; rocks.push({ x: x - dz / L * off, z: z + dx / L * off, r: 4 + R() * 3 }); }
  const G0 = { route: { line, cuts: [], legs }, cfg: c };
  for (let i = rocks.length - 1; i >= 0; i--) { const r = rocks[i], rd = routeDist(G0, r.x, r.z), hw = halfW(G0, rd.leg);
    if (hw + rd.d - r.r < 16 || pts.some(p => Math.hypot(p.x - r.x, p.z - r.z) < r.r + 14)) rocks.splice(i, 1); }
  const cracks = []; const nC = Math.round(c.cracks * (pts.length - 1) / 3); for (let i = 0; i < nC; i++) { const s = line[2 + ((R() * (line.length - 4)) | 0)]; cracks.push({ x: s.x, z: s.z, r: 16 + R() * 10, done: false }); }
  for (const cu of cuts) if (c.cracks) { const x = (cu.a.x + cu.b.x) / 2, z = (cu.a.z + cu.b.z) / 2; cracks.push({ x, z, r: 14, done: false }); }
  return { pts, line, cuts, legs, rocks, cracks };
}
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help, o), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0, R = rng(seed + 9);
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, mini: !!o.mini, duneA: R() * TAU };
  G.route = makeRoute(G, R); G.W = WORMS[cfg.worm];
  const p0 = G.route.line[0], p1 = G.route.line[1]; G.w = { x: p0.x, z: p0.z, y: sandH(G, p0.x, p0.z) - 1.5, vy: 0, h: Math.atan2(p1.z - p0.z, p1.x - p0.x) + (R() < 0.5 ? -1 : 1) * 0.3, om: 0, v: G.W.cruise, air: false, airT: 0 };
  G.trail = []; G.stick = { x: 0, z: 0 }; G.surge = false; G.brace = false; G.bal = 1; G.lean = 0; G.wp = 1; G.cp = null; G.falls = 0; G.phase = 'ride'; G.fallT = 0; G.breaches = 0; G.smooth = 0; G.knocks = 0; G.gust = 0; G.cut = 0;
  G.par = parTime(G); G.sunset = G.par * cfg.sunset; saveCp(G);
  G.minBal = 1; G.chal = cfg.free || N < 2 ? null : makeChal(G);
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G);
  return G;
}
// each level's optional challenge (coins for it): breach N times, take a shortcut, no falls, or never under half your balance
function makeChal(G) { const N = G.N, ids = ['breach', 'cut', 'nofall', 'steady']; let id = ids[N % 4]; if (id === 'cut' && !G.route.cuts.length) id = 'breach';
  return { id, n: id === 'breach' ? 3 + Math.floor(N / 4) : 0 }; }
function chalText(c) { return !c ? '' : c.id === 'breach' ? `Breach ${c.n} times` : c.id === 'cut' ? 'Ride a shortcut (the flags)' : c.id === 'nofall' ? 'No falls' : 'Never under half your balance'; }
function chalDone(G) { const c = G.chal; if (!c) return false; return c.id === 'breach' ? G.breaches >= c.n : c.id === 'cut' ? G.cut > 4 : c.id === 'nofall' ? G.falls === 0 : G.minBal >= 0.5; }
function parTime(G) { let d = 0; const L = G.route.line; for (let i = 1; i < L.length; i++) d += Math.hypot(L[i].x - L[i - 1].x, L[i].z - L[i - 1].z); return d / (G.W.cruise * 1.35) + 4; }
function saveCp(G) { const w = G.w; G.cp = { x: w.x, z: w.z, h: w.h, wp: G.wp }; }
// where the route is: distance from a point to the route (main line and shortcuts), and which leg
function routeDist(G, x, z) { const L = G.route.line; let best = 1e9, leg = 0, p = L[0], tg = { x: 1, z: 0 };
  for (let i = 0; i < L.length - 1; i++) { const d = segD(x, z, L[i], L[i + 1]); if (d < best) { best = d; leg = L[i].leg; const A = L[i], B = L[i + 1], dx = B.x - A.x, dz = B.z - A.z, u = clamp(((x - A.x) * dx + (z - A.z) * dz) / (dx * dx + dz * dz || 1), 0, 1); p = { x: A.x + dx * u, z: A.z + dz * u }; tg = { x: dx, z: dz }; } }
  let cutD = 1e9; for (const c of G.route.cuts) cutD = Math.min(cutD, segD(x, z, c.a, c.b));
  return { d: best, leg, cutD, p, tg }; }
function segD(x, z, A, B) { const dx = B.x - A.x, dz = B.z - A.z, u = clamp(((x - A.x) * dx + (z - A.z) * dz) / (dx * dx + dz * dz || 1), 0, 1); return Math.hypot(x - (A.x + dx * u), z - (A.z + dz * u)); }
const gateR = G => 10 + G.cfg.width * 0.125;   // between the two stones of a waystone pair
const halfW = (G, leg) => G.cfg.width / 2 * (G.route.legs[leg] && G.route.legs[leg].narrow ? 0.6 : 1);
// ---------- the player's actions ----------
function setStick(G, x, z) { const L = Math.hypot(x, z); G.stick = L > 1 ? { x: x / L, z: z / L } : { x, z }; }
function surgeOn(G, on) { if (G.over) return false; G.surge = !!on; return true; }
function braceOn(G, on) { if (G.over) return false; const was = G.brace; G.brace = !!on; if (on && !was) G.ev.push({ k: 'brace' }); return true; }
// ---------- every frame ----------
function step(G, dt) {
  if (G.over || !(dt > 0)) return; G.t += dt; if (G.lesson) lessonTick(G, dt); const c = G.cfg, w = G.w, Wm = G.W;
  if (G.blindT != null) { G.blindT -= dt; if (G.blindT <= 0) { G.blindT = null; surgeOn(G, false); braceOn(G, false); } }
  if (G.phase === 'fall') { G.fallT -= dt;
    // 23 Nov 2026: the worm does not stop dead when you fall (it used to hang frozen, even in the air): it runs on without you and comes down
    w.om *= Math.exp(-dt * 2); w.h += w.om * dt; w.v += (Wm.cruise - w.v) * dt * 0.5; w.x += Math.cos(w.h) * w.v * dt; w.z += Math.sin(w.h) * w.v * dt;
    { const s = sandH(G, w.x, w.z), sw = s - 1.5; if (w.air) { w.vy -= 22 * dt; w.y += w.vy * dt; if (w.y <= sw) { w.y = sw; w.air = false; w.vy = 0; } } else w.y = sw; G.lastS = s; }
    G.trail.unshift({ x: w.x, z: w.z, y: w.y }); if (G.trail.length > 420) G.trail.pop();
    if (G.fallT <= 0) { if (G.falls >= c.lives && !c.free && !G.lesson) return finish(G, false, 'falls'); w.x = G.cp.x; w.z = G.cp.z; w.h = G.cp.h; G.wp = G.cp.wp; w.v = Wm.cruise; w.om = 0; w.y = sandH(G, w.x, w.z) - 1.5; w.vy = 0; w.air = false; G.bal = 1; G.trail = []; G.phase = 'ride'; G.ev.push({ k: 'back' }); } return; }
  if (G.phase === 'end') { G.endT -= dt; if (G.endT <= 0) finish(G, true); return; }
  if (!c.free && !G.lesson && G.t > G.sunset) return finish(G, false, 'sunset');
  // steering: the stick asks for a turn; the worm's heavy head turns towards it, slower when fast and slower again when bracing
  const turnMax = Wm.turn * (1.15 - 0.45 * clamp((w.v - 10) / 25, 0, 1)) * (G.brace ? 0.6 : 1), want = -G.stick.x * turnMax;
  const R = G.rnd; let storm = 0; const rd = routeDist(G, w.x, w.z); const leg = G.route.legs[rd.leg]; if (leg && leg.storm) { storm = 1; G.gust += (R() - 0.5) * dt * 3; G.gust *= Math.exp(-dt * 0.8); } else G.gust *= Math.exp(-dt * 2);
  w.om += (want + G.gust * 0.5 - w.om) * Math.min(1, dt * (1.6 + 0.4 * upLv('reins')));
  w.h += w.om * dt;
  // speed: surge towards top speed, else back to cruising; downhill faster, uphill slower
  const ahead = sandH(G, w.x + Math.cos(w.h) * 4, w.z + Math.sin(w.h) * 4), here = sandH(G, w.x, w.z), slope = (ahead - here) / 4;
  const vT = G.surge ? Wm.vmax : Wm.cruise; w.v += (vT - w.v) * dt * (G.surge ? 0.55 : 0.35) - slope * 9 * dt * (w.air ? 0 : 1) - (G.brace ? 2.5 * dt : 0); w.v = clamp(w.v, 6, Wm.vmax * 1.15);
  w.x += Math.cos(w.h) * w.v * dt; w.z += Math.sin(w.h) * w.v * dt;
  // up and down: swimming just under the sand; over a crest at speed the head flies out (a breach), then comes down
  const s = sandH(G, w.x, w.z), sw = s - 1.5;
  if (!w.air) { const vyS = G.lastS == null ? 0 : (s - G.lastS) / dt; G.lastS = s;      // over a crest, climbing fast (speed, and straight up the face): the head flies out
    if (w.vy > 4 && (vyS - w.vy) / dt < -5 && w.v > 20) { w.air = true; w.airT = 0; w.vy = w.vy * 1.2 + 2; G.breaches++; G.ev.push({ k: 'breach', v: w.v }); lessonSee(G, 'breach'); } else { w.vy = Math.abs(vyS) < 40 ? vyS : 0; w.y = sw; } }
  else { w.airT += dt; w.vy -= 22 * dt; w.y += w.vy * dt; if (w.y <= sw) { const hit = Math.max(0, -w.vy - 4); w.y = sw; w.air = false; G.lastS = s; G.ev.push({ k: 'land', hit }); if (hit > 0) knock(G, hit * 0.07, 'land'); } }
  // balance: the sideways pull of the turn, knocks; it comes back while you ride smoothly, faster when bracing
  const lat = w.v * w.om, lim = 13 * (G.brace ? 1.5 : 1); G.lean += (clamp(lat / 18, -1, 1) - G.lean) * Math.min(1, dt * 4);
  if (Math.abs(lat) > lim) G.bal -= (Math.abs(lat) - lim) * 0.012 * dt * 60 / 60 * 3.2; else G.bal = Math.min(1, G.bal + dt * 0.12 * c.steady * (G.brace ? 1.8 : 1));
  if (storm && !G.brace) G.bal -= dt * 0.02;
  if (Math.abs(lat) > lim * 0.85) G.ev.push({ k: 'strain' }); else G.smooth += dt;
  // the trail of the worm's body follows its head
  G.trail.unshift({ x: w.x, z: w.z, y: w.y }); if (G.trail.length > 420) G.trail.pop();
  // walls and rocks
  const legNow = G.route.legs[rd.leg], hw = halfW(G, rd.leg), off = Math.min(rd.d - hw, rd.cutD - 7);
  if (off > 0 && !G.lesson && rd.cutD > 7 && legNow && legNow.narrow) { const np = rd.p, nx = np.x - w.x, nz = np.z - w.z, nl = Math.hypot(nx, nz) || 1, ux = nx / nl, uz = nz / nl;   // the edge: dune walls, canyon rock
    const hx = Math.cos(w.h), hz = Math.sin(w.h), into = -(hx * ux + hz * uz);   // how square you hit it (1: head on)
    w.x += ux * (off + 1); w.z += uz * (off + 1);
    if (into > 0) { const rx = hx + 2 * into * ux, rz = hz + 2 * into * uz; w.h = Math.atan2(rz, rx); w.om *= -0.3; }   // bounce off it
    if (G.t > (G.wallT || -9) + 0.6) { G.wallT = G.t; w.v *= 1 - 0.5 * Math.max(0.2, into); knock(G, (0.22 + 0.6 * Math.max(0, into) * w.v / 20) / (G.brace ? 0.5 : 1), 'wall'); G.ev.push({ k: 'wall' }); } }
  for (const r of G.route.rocks) if (Math.hypot(r.x - w.x, r.z - w.z) < r.r + 2.5 && !w.air) { const a = Math.atan2(w.z - r.z, w.x - r.x); w.x = r.x + Math.cos(a) * (r.r + 3); w.z = r.z + Math.sin(a) * (r.r + 3);
    let t1 = a + Math.PI / 2, d1 = t1 - w.h; while (d1 > Math.PI) d1 -= TAU; while (d1 < -Math.PI) d1 += TAU; if (Math.abs(d1) > Math.PI / 2) d1 += d1 > 0 ? -Math.PI : Math.PI; if (Math.cos(a - w.h) < 0.3) w.h += d1;   // slide round it
    if (G.t > (r.hitT || -9) + 1.2) { r.hitT = G.t; w.v *= 0.6; knock(G, 0.35 + w.v * 0.008, 'rock'); G.ev.push({ k: 'rock', x: r.x, z: r.z }); } }
  for (const cr of G.route.cracks) if (!cr.done && Math.hypot(cr.x - w.x, cr.z - w.z) < cr.r) { cr.done = true; G.ev.push({ k: 'collapse', x: cr.x, z: cr.z }); knock(G, 0.38, 'collapse'); }
  if (rd.cutD < 8) G.cut += dt;
  // warnings you can see coming: a storm on the next leg, cracked sand ahead
  if (!!storm !== !!G.inStorm) { G.inStorm = !!storm; G.ev.push({ k: G.inStorm ? 'storm' : 'stormout' }); }
  { const nl = G.route.legs[G.wp], P0 = G.route.pts[G.wp]; if (nl && nl.storm && !nl.warned && P0 && Math.hypot(P0.x - w.x, P0.z - w.z) < 180) { nl.warned = true; G.ev.push({ k: 'stormahead' }); } }
  for (const cr of G.route.cracks) if (!cr.done && !cr.warned && Math.hypot(cr.x - w.x, cr.z - w.z) < cr.r + 70) { cr.warned = true; G.ev.push({ k: 'crackahead' }); }
  // never stuck: pressed against a rock or wall and barely moving for a second and a half, the worm dives under and comes up past it
  if (!G.stuck || G.t - G.stuck.t > 2) G.stuck = { t: G.t, x: w.x, z: w.z }; const moved = Math.hypot(w.x - G.stuck.x, w.z - G.stuck.z);
  if (G.t - G.stuck.t > 1.6 && moved < 10) { G.stuck = null; w.x += Math.cos(w.h) * 26; w.z += Math.sin(w.h) * 26; w.om = 0; w.v = G.W.cruise; G.lastS = null; G.ev.push({ k: 'dive' }); }
  if (!G.lesson) G.minBal = Math.min(G.minBal, G.bal);
  if (G.bal <= 0 && G.phase === 'ride') return fall(G);
  if (G.bal < 0.3) G.ev.push({ k: 'wobble' });
  // waystones: pass between each pair; the last one is the end
  const P = G.route.pts[G.wp]; if (P && Math.hypot(P.x - w.x, P.z - w.z) < gateR(G)) { G.ev.push({ k: 'way', i: G.wp, n: G.route.pts.length - 1 }); saveCp(G); lessonSee(G, 'way'); G.wp++; if (G.wp >= G.route.pts.length && !c.free && !G.lesson) { G.phase = 'end'; G.endT = 1.2; G.ev.push({ k: 'arrive' }); } else if (G.wp >= G.route.pts.length && (c.free || G.lesson)) { extend(G); } }
}
function knock(G, v, why) { if (G.phase !== 'ride') return; const k2 = v * G.cfg.knock * (G.brace ? 0.25 : 1); G.bal -= G.lesson ? Math.min(k2, 0.2) : k2; G.knocks++; G.ev.push({ k: 'knock', why, v: k2, braced: G.brace }); lessonSee(G, 'knock', G.brace); }
function fall(G) { const w = G.w; G.fallAt = { x: w.x, y: w.y, z: w.z, h: w.h, v: w.v, vy: w.air ? w.vy : 0 }; G.phase = 'fall'; G.fallT = 1.6; G.ev.push({ k: 'fall' }); if (!G.lesson) G.falls++; G.surge = false; }
function extend(G) { const R = G.rnd, L = G.route, last = L.pts[L.pts.length - 1], prev = L.pts[L.pts.length - 2]; let a = Math.atan2(last.z - prev.z, last.x - prev.x);
  for (let i = 0; i < 3; i++) { a += (R() - 0.5) * 1.0; const p0 = L.pts[L.pts.length - 1], len = 260, p = { x: p0.x + Math.cos(a) * len, z: p0.z + Math.sin(a) * len }; L.pts.push(p); L.legs.push({ narrow: false, storm: false }); for (let j = 1; j <= 8; j++) L.line.push({ x: p0.x + (p.x - p0.x) * j / 8, z: p0.z + (p.z - p0.z) * j / 8, leg: L.pts.length - 2 }); } }
function finish(G, win, why) { if (G.over) return; G.over = win ? 'won' : 'lost'; const T = G.t, par = G.par;
  const stars = win ? (G.falls === 0 && T <= par * 1.25 ? 3 : G.falls <= 1 && T <= par * 1.7 ? 2 : 1) : 0;
  const cd = win && chalDone(G), coins = win ? 10 + G.route.pts.length * 3 + stars * 4 + Math.min(20, G.breaches) + (G.cut > 4 ? 6 : 0) + (cd ? 15 : 0) : G.wp * 2;
  G.res = { win, why, stars, coins, time: T, par, falls: G.falls, breaches: G.breaches, ways: G.wp - 1, of: G.route.pts.length - 1, cut: G.cut > 4, knocks: G.knocks, chal: G.chal ? { txt: chalText(G.chal), done: cd } : null };
  G.ev.push({ k: win ? 'won' : 'lost', why }); }

// ---------- LESSONS: steer through waystones, surge into a breach, brace for the knocks ----------
const LESSONS = {
  1: [{ id: 'steer', title: 'STEER', say: G => wormCue(G)[0], do: G => wormCue(G)[1], at: G => wormCue(G)[2], how: 'Left thumb: drag to turn. The worm is heavy: start the turn early, ease it back to go straight. Pass between three pairs of waystones.', need: 3 }],
  2: [{ id: 'breach', title: 'SURGE AND BREACH', say: G => wormCue(G)[0], do: G => wormCue(G)[1], at: G => wormCue(G)[2], how: 'Hold SURGE (right) to speed up. Fast over a dune crest and the worm leaps out of the sand. Breach twice.', need: 2 }],
  3: [{ id: 'brace', title: 'BRACE', say: G => wormCue(G)[0], do: G => wormCue(G)[1], at: G => wormCue(G)[2], how: 'Hold BRACE before you land from a breach, hit cracked sand or turn hard: braced, you hardly wobble. Three braced knocks or landings.', need: 3 }],
};
function lessonStart(G) { const st = LESSONS[G.N][0]; G.lesson = { steps: LESSONS[G.N], i: 0, n: 0, id: st.id }; G.ev.push({ k: 'lessonnext', first: true }); if (st.id !== 'steer') { G.cfg = Object.assign({}, G.cfg, { dunes: 1.6 }); } if (st.id === 'brace') { for (let i = 0; i < 6; i++) { const s = G.route.line[4 + i * 5]; if (s) G.route.cracks.push({ x: s.x, z: s.z, r: 16, done: false }); } } }
function lessonSee(G, what, braced) { const D = G.lesson; if (!D || D.done) return; const id = D.id;
  if (id === 'steer' && what === 'way' || id === 'breach' && what === 'breach' || id === 'brace' && what === 'knock' && braced) { D.n++; G.ev.push({ k: 'lessonok', n: D.n, need: D.steps[0].need }); if (D.n >= D.steps[0].need) { D.done = true; D.wait = 1.4; } }
  else if (id === 'brace' && what === 'knock' && !braced && D.n) { D.n = 0; G.ev.push({ k: 'lessonmiss', how: D.steps[0].how }); } }
function lessonTick(G, dt) { const D = G.lesson; if (!D.done) return; D.wait -= dt; if (D.wait > 0) return;
  G.lesson = null; const R = rng(G.seed + 9); G.cfg = makeCfg(G.N, G.cfg.help); G.duneA = R() * TAU; G.route = makeRoute(G, R); const p0 = G.route.line[0], p1 = G.route.line[1]; Object.assign(G.w, { x: p0.x, z: p0.z, y: sandH(G, p0.x, p0.z) - 1.5, vy: 0, h: Math.atan2(p1.z - p0.z, p1.x - p0.x), om: 0, v: G.W.cruise, air: false }); G.trail = []; G.wp = 1; G.bal = 1; G.minBal = 1; G.falls = 0; G.breaches = 0; G.cut = 0; G.t0 = G.t; G.par = parTime(G); G.sunset = G.t + G.par * G.cfg.sunset; G.lastS = null; saveCp(G); G.ev.push({ k: 'lessondone', N: G.N }); }

// ---------- for the robots: blind moves and an honest rider ----------
const BLIND = {
  m: G => { const a = Math.random() * TAU; setStick(G, Math.cos(a), Math.sin(a)); },     // the stick anywhere
  c: G => setStick(G, 0, 0),                                                              // let go of the stick
  s: G => { surgeOn(G, true); G.blindT = 0.4 + Math.random() * 3; },                     // hold surge a while
  b: G => { braceOn(G, true); G.blindT = 0.3 + Math.random() * 2; },                     // hold brace a while
  h: G => { const a = Math.random() < 0.5 ? -1 : 1; setStick(G, a, 0); surgeOn(G, true); G.blindT = 1.5; },   // hard over, flat out
};
// HONEST: a rider who looks: aims at a point ahead on the route (past rocks), eases into turns, surges on straights, braces for
// landings, cracks, rocks it cannot miss and hard turns. react: seconds behind; acc: how steady the thumb is.
// THE TUTORIAL SAYS WHICH WAY AND WHEN (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing happens"). It said DRAG TO TURN
// with a hand sliding both ways in a box; HOLD SURGE stayed up when surging was wrong. Now the robot is asked (dryPlanAll): TURN LEFT / TURN
// RIGHT (the way it would steer), HOLD SURGE, HOLD BRACE when it would, LET GO, GO STRAIGHT.
const WMC = { t: -1e9, v: null };
function wormCue(G) { if (G.over || G.wait > 0) return ['WAIT…', 'wait', false]; const now = performance.now(); if (now - WMC.t < 120) return WMC.v; WMC.t = now; const all = dryPlanAll(G, null, { t: -1, next: -1 }), last = n => all.filter(q => q[0] === n).pop(), L = layout(G);
  const st = last('setStick'), su = last('surgeOn'), br = last('braceOn'), sx = st ? st[1] : 0, x0 = W * 0.22, y0 = H * 0.7; let v;
  if (br && br[1]) v = ['HOLD BRACE', 'hold', [L.brace.x, L.brace.y]];
  else if (Math.abs(sx) > 0.2) v = [sx < 0 ? 'TURN RIGHT' : 'TURN LEFT', 'drag', [x0, y0, x0 - sx * 56 * k, y0]];
  else if (su && su[1]) v = ['HOLD SURGE', 'hold', [L.surge.x, L.surge.y]];
  else if (G.surge || G.brace) v = ['LET GO', 'release', G.brace ? [L.brace.x, L.brace.y] : [L.surge.x, L.surge.y]];
  else v = ['GO STRAIGHT', 'wait', false];
  WMC.v = v; return v; }
function honest(G, o, mem) {
  if (G.over) return; const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, w = G.w, R = Math.random;
  if (G.phase !== 'ride') { ACT.setStick(G, 0, 0); ACT.surgeOn(G, false); ACT.braceOn(G, false); return; }
  if (G.t < (mem.next || 0)) return; mem.next = G.t + 0.06 + react * 0.25;
  const L = G.route.line; let iBest = 0, dB = 1e9; for (let i = 0; i < L.length; i++) { const d = Math.hypot(L[i].x - w.x, L[i].z - w.z); if (d < dB && L[i].leg >= G.wp - 1) { dB = d; iBest = i; } }
  const look = 45 + w.v * 1.2; let tgt = L[Math.min(L.length - 1, iBest + 1)]; for (let i = iBest; i < L.length; i++) { tgt = L[i]; if (Math.hypot(L[i].x - w.x, L[i].z - w.z) > look) break; }
  let tx = tgt.x, tz = tgt.z; const P = G.route.pts[G.wp];
  if (P) { const dP = Math.hypot(P.x - w.x, P.z - w.z), fw = (P.x - w.x) * Math.cos(w.h) + (P.z - w.z) * Math.sin(w.h); if (dP < look * 1.3 || fw < 0) { tx = P.x; tz = P.z; } }   // aim between the stones; gone past? turn back for them
  const seeR = (50 + w.v * 1.5) * (1.25 - react); let dh = Math.atan2(tz - w.z, tx - w.x);
  for (const r of G.route.rocks) { const rx = r.x - w.x, rz = r.z - w.z, fwd = rx * Math.cos(dh) + rz * Math.sin(dh), lat = -rx * Math.sin(dh) + rz * Math.cos(dh);
    if (fwd > 0 && fwd < seeR && Math.abs(lat) < r.r + 8) { const rr = routeDist(G, r.x, r.z), px = rr.p.x - r.x, pz = rr.p.z - r.z, toLine = -px * Math.sin(dh) + pz * Math.cos(dh); const side = rr.d > 3 ? Math.sign(toLine) || 1 : (lat > 0 ? -1 : 1); dh += side * Math.atan2(r.r + 10 - Math.abs(lat), Math.max(8, fwd)); } }
  tx = w.x + Math.cos(dh) * 50; tz = w.z + Math.sin(dh) * 50;
  let da = Math.atan2(tz - w.z, tx - w.x) - w.h; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU;
  const turnMax = G.W.turn * (1.15 - 0.45 * clamp((w.v - 10) / 25, 0, 1)) * (G.brace ? 0.6 : 1), omT = clamp(da * 1.4, -turnMax, turnMax);
  ACT.setStick(G, clamp(-(omT / turnMax) * 1.0 + (1 - acc) * (R() - 0.5) * 0.6, -1, 1), 0);
  const sharp = Math.abs(da) > 0.5, nearCrack = G.route.cracks.some(cr => !cr.done && Math.hypot(cr.x - w.x, cr.z - w.z) < cr.r + w.v * 0.6), nearRock = G.route.rocks.some(r => Math.hypot(r.x - w.x, r.z - w.z) < r.r + 6 + w.v * 0.3);
  const lim = 13; const lat = Math.abs(w.v * w.om);
  if (R() > acc * 0.35 + 0.65 && !mem.miss) { mem.miss = G.t + 0.8; } if (mem.miss && G.t > mem.miss) mem.miss = 0;
  ACT.braceOn(G, !mem.miss && (w.air || nearCrack || nearRock || lat > lim * 0.8 || G.bal < 0.45 || (G.lesson && G.lesson.id === 'brace' && w.air)));
  ACT.surgeOn(G, !sharp && G.bal > 0.55 && !nearRock && Math.abs(w.om) < 0.3 || (G.lesson && G.lesson.id === 'breach' && !sharp));
}
function winNow(G) { if (!G || G.over || G.lesson) return; G.phase = 'end'; G.endT = 0.01; step(G, 0.02); }

// what the robot would do now, without doing it (tools/dry_plan.py): the tutorial shows this move
const ACT_REAL = { setStick, surgeOn, braceOn }; let ACT = ACT_REAL;
function dryPlan(G, o, mem) { let got = null; const rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { if (!got && !(a.length > 2 && a.slice(1).every(v => v === 0 || v === false))) got = [n, ...a.slice(1)]; return true; };      /* (a stick at rest, all its numbers 0, is not a move; a first bed, number 0, is) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return got; }
function dryPlanAll(G, o, mem) { const all = [], rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { all.push([n, ...a.slice(1)]); return true; };      /* every call, in order (for a robot that steers and drifts at once) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return all; }
