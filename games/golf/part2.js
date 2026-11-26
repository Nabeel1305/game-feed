// ===================== RULES: Mini Golf (game 30) =====================
// A round of three holes on a mini golf course in a garden. Pull back from anywhere on the screen and let go: the ball goes the
// other way, harder the further you pull (a dotted line shows the way). Felt fairways with wooden rails; bumpers that kick,
// sand that drags, slopes that bend the roll, windmills whose blades swat the ball, ponds (back to where you hit from, and a
// stroke), sliding walls. Finish the round within the stroke limit; under par for three stars. Coins on the course and for
// good scores buy upgrades that stay (a longer aiming line, a mulligan, a bigger cup...).
// World: metres on the course plane; x across the screen, z down it (the camera looks up the course, towards -z).
const RULES = [
  '<b>Pull back</b> anywhere on the screen and <b>let go</b>: the ball goes the other way. Pull further for more power.',
  'Bumpers kick, sand slows, slopes bend the roll, windmill blades swat the ball. A pond costs a stroke.',
  'Three holes a round. Stay inside the <b>stroke limit</b>; beat <b>par</b> for three stars.',
  'Roll through the coins on the course: they buy upgrades that stay.',
];
const TEMPLATES = {
  straight: { poly: [[-1.5, 6], [1.5, 6], [1.5, -6], [-1.5, -6]], tee: [0, 5], cup: [0, -5], slots: [[0, 2.2], [0.3, -0.8], [-0.3, -3.2]], par: 2 },
  lright: { poly: [[-1.5, 6], [1.5, 6], [1.5, -3], [6, -3], [6, -6], [-1.5, -6]], tee: [0, 5], cup: [5, -4.5], slots: [[0, 2], [0, -1.8], [3, -4.6]], par: 3 },
  lleft: { poly: [[1.5, 6], [-1.5, 6], [-1.5, -3], [-6, -3], [-6, -6], [1.5, -6]], tee: [0, 5], cup: [-5, -4.5], slots: [[0, 2], [0, -1.8], [-3, -4.6]], par: 3 },
  zig: { poly: [[-1.5, 7], [1.5, 7], [1.5, 2], [5, 2], [5, -7], [2, -7], [2, -1], [-1.5, -1]], tee: [0, 6], cup: [3.5, -6], slots: [[0, 3.5], [3.2, 0.4], [3.5, -3.5]], par: 3 },
  box: { poly: [[-4, 5], [4, 5], [4, -5], [-4, -5]], tee: [0, 4], cup: [0, -4], walls: [[[-1, -1], [1, -1]], [[1, -1], [1, 1]], [[1, 1], [-1, 1]], [[-1, 1], [-1, -1]]], slots: [[-2.6, 0], [2.6, 0], [0, -2.6]], par: 2 },
  uturn: { poly: [[-4, 6], [4, 6], [4, -6], [-4, -6]], tee: [-2, 5], cup: [2, 5], walls: [[[0, 6], [0, -2.5]]], slots: [[-2, 0], [0, -4.3], [2, 0.5]], par: 3 },
  bend: { poly: [[-1.3, 8], [1.3, 8], [1.3, 0], [3.2, -2], [3.2, -8], [0.6, -8], [0.6, -2.5], [-1.3, -0.6]], tee: [0, 7], cup: [1.9, -7], slots: [[0, 4.2], [1.3, -1.4], [1.9, -4.6]], par: 3 },
  cross: { poly: [[-1.4, 6], [1.4, 6], [1.4, 1.4], [5, 1.4], [5, -1.4], [1.4, -1.4], [1.4, -6], [-1.4, -6], [-1.4, -1.4], [-5, -1.4], [-5, 1.4], [-1.4, 1.4]], tee: [0, 5], cup: [-4, 0], slots: [[0, 2.6], [0, 0], [-2.6, 0]], par: 3 },
};
const OBST = ['bumper', 'sand', 'slope', 'windmill', 'water', 'mover'];
const obstFrom = { bumper: 1, sand: 2, slope: 3, windmill: 4, water: 5, mover: 7 };
const UPGRADES = [
  { id: 'aim', name: 'Long sight', desc: 'A longer aiming line (it bends off the first rail at the top rank).', max: 3, cost: l => 15 + l * 20 },
  { id: 'mull', name: 'Mulligan', desc: 'Take back one shot each round.', max: 2, cost: l => 30 + l * 40 },
  { id: 'cup', name: 'Lucky cup', desc: 'The cup is a little wider.', max: 3, cost: l => 20 + l * 20 },
  { id: 'wedge', name: 'Sand wedge', desc: 'Sand drags less.', max: 2, cost: l => 15 + l * 20 },
  { id: 'wings', name: 'Water wings', desc: 'The first pond each round is free.', max: 1, cost: () => 40 },
  { id: 'magnet', name: 'Coin magnet', desc: 'Coins come to the ball from further.', max: 2, cost: l => 15 + l * 15 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Beginner'], [40, 'Putter'], [130, 'Club player'], [320, 'Ace'], [700, 'Champion'], [1500, 'Hole-in-one legend']];
const THEMES = [{ name: 'The garden', felt: 0x3fb24c, rail: 0x9a6a3a }, { name: 'The beach', felt: 0x34b8a4, rail: 0xe8d8b0 }, { name: 'The castle', felt: 0x8a44b0, rail: 0x8a8a8a }, { name: 'Candy land', felt: 0xe86aa0, rail: 0xf4f0e0 }];
const themeOf = N => Math.floor((N - 1) / 5) % 4;
const WEATHERS = ['morning', 'noon', 'golden', 'sunset', 'overcast', 'noon', 'golden', 'dusk'];
function weatherOf(N) { if (N <= 3) return ['morning', 'noon', 'golden'][N - 1]; const R = rng(N * 7741 + 5); R(); return WEATHERS[(R() * WEATHERS.length) | 0]; }

function makeCfg(N, help) {
  const f = curve(N), e = easyOf(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s));
  return { N, f, e, help: !!help, holes: 3, slack: Math.floor(x(3.4, 0.6, 25)) + (help ? 2 : 0), obst: Math.min(3, Math.round(x(0.6, 3.2, 20))), wind: x(1.2, 2.4, 30), mover: x(0.8, 1.6, 30),
    cupR: 0.18 * (1 + 0.08 * upLv('cup')), aim: [1.6, 2.4, 3.2, 3.2][upLv('aim')], bounce: upLv('aim') >= 3, mull: upLv('mull'), sandF: [4, 3, 2][upLv('wedge')], wings: upLv('wings'), magnet: 0.35 + 0.25 * upLv('magnet') };
}
function makeHole(G, i) {
  const c = G.cfg, R = G.rnd, keys = Object.keys(TEMPLATES).filter(k => G.N > 2 || ['straight', 'lright', 'lleft', 'box'].includes(k)), key = G.N === 1 && i === 0 ? 'straight' : keys[(R() * keys.length) | 0], T = TEMPLATES[key], fl = R() < 0.5 ? -1 : 1;
  const P = p => [p[0] * fl, p[1]], hole = { key, poly: T.poly.map(P), tee: P(T.tee), cup: P(T.cup), walls: [], obst: [], coins: [], par: T.par };
  hole.poly.forEach((p, j) => hole.walls.push([p, hole.poly[(j + 1) % hole.poly.length]])); (T.walls || []).forEach(w => hole.walls.push([P(w[0]), P(w[1])]));
  const avail = OBST.filter(o => G.N >= obstFrom[o]), slots = T.slots.map(P).sort(() => R() - 0.5), n = Math.min(slots.length, c.obst + (R() < 0.3 ? 1 : 0) - (G.N <= 2 && i === 0 ? 1 : 0));
  for (let k2 = 0; k2 < n; k2++) { const kind = avail[(R() * avail.length) | 0], [x, z] = slots[k2], o = { kind, x, z };
    if (kind === 'bumper') o.r = 0.4;
    if (kind === 'sand') o.r = 1.0;
    if (kind === 'water') { const s = R() < 0.5 ? -1 : 1; o.x += s * 0.6; o.r = 0.75; }
    if (kind === 'slope') { const a = R() * TAU; o.w = 2.6; o.h = 2.0; o.gx = Math.sin(a) * 1.1; o.gz = Math.cos(a) * 1.1; }
    if (kind === 'windmill') { o.len = 1.25; o.spin = c.wind * (R() < 0.5 ? -1 : 1); o.a0 = R() * TAU; o.blades = 2 + (G.N >= 12 && R() < 0.5 ? 1 : 0); }
    if (kind === 'mover') { o.len = 1.3; o.amp = 1.1; o.sp = c.mover; o.ph = R() * TAU; o.horiz = true; }
    hole.obst.push(o); if (o.kind === 'windmill' || o.kind === 'water') hole.par += G.N >= 8 ? 1 : 0; }
  hole.par = Math.min(hole.par, 4);
  // two coins on the way, off the straightest line
  for (let k2 = 0; k2 < 2; k2++) { for (let tries = 0; tries < 40; tries++) { const u = 0.25 + R() * 0.5, x = hole.tee[0] + (hole.cup[0] - hole.tee[0]) * u + (R() - 0.5) * 2.4, z = hole.tee[1] + (hole.cup[1] - hole.tee[1]) * u + (R() - 0.5) * 2.4; if (inPoly(hole.poly, x, z) && !hole.obst.some(o => Math.hypot(o.x - x, o.z - z) < 1.3)) { hole.coins.push({ x, z }); break; } } }
  hole.dist = distField(hole); return hole;
}
function inPoly(poly, x, z) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, zi] = poly[i], [xj, zj] = poly[j]; if (((zi > z) !== (zj > z)) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; }
// how far each spot is from the cup round the walls (a grid of 0.3 m): the robots use it to judge a shot
function distField(h) {
  const xs = h.poly.map(p => p[0]), zs = h.poly.map(p => p[1]), x0 = Math.min(...xs), z0 = Math.min(...zs), S = 0.3, nx = Math.ceil((Math.max(...xs) - x0) / S) + 1, nz = Math.ceil((Math.max(...zs) - z0) / S) + 1, D = new Float32Array(nx * nz).fill(1e9);
  const ok = (i, j) => { const x = x0 + i * S, z = z0 + j * S; if (!inPoly(h.poly, x, z)) return false; for (const w of h.walls.slice(h.poly.length)) if (segDist(x, z, w[0], w[1]) < 0.2) return false; for (const o of h.obst) if ((o.kind === 'water' || o.kind === 'bumper') && Math.hypot(o.x - x, o.z - z) < o.r + 0.1) return false; return true; };
  const ci = Math.round((h.cup[0] - x0) / S), cj = Math.round((h.cup[1] - z0) / S), q = [[ci, cj]]; D[cj * nx + ci] = 0;
  for (let qi = 0; qi < q.length; qi++) { const [i, j] = q[qi], d = D[j * nx + i]; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= nx || b >= nz) continue; const k2 = b * nx + a; if (D[k2] < 1e8) continue; if (!ok(a, b)) { D[k2] = 2e9; continue; } D[k2] = d + (di && dj ? 1.2 : 1) * S; q.push([a, b]); } }      // breadth first: each cell once
  return { x0, z0, S, nx, nz, D, at(x, z) { const i = Math.round((x - x0) / S), j = Math.round((z - z0) / S); if (i < 0 || j < 0 || i >= nx || j >= nz) return 99; const v = D[j * nx + i]; return v > 1e8 ? 50 : v; } };
}
function segDist(x, z, a, b) { const ax = b[0] - a[0], az = b[1] - a[1], L2 = ax * ax + az * az || 1, u = clamp(((x - a[0]) * ax + (z - a[1]) * az) / L2, 0, 1); return Math.hypot(x - a[0] - ax * u, z - a[1] - az * u); }
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null,
    weather: weatherOf(N), theme: themeOf(N), holes: [], hi: 0, strokes: [], total: 0, par: 0, ball: null, moving: false, gap: 0, coins: 0, mull: cfg.mull, wings: cfg.wings, lastPos: null, lastStrokeT: 0 };
  for (let i = 0; i < cfg.holes; i++) G.holes.push(makeHole(G, i)); G.par = G.holes.reduce((a, h) => a + h.par, 0); G.limit = G.par + cfg.slack;
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else startHole(G, 0);
  return G;
}
function startHole(G, i) { G.hi = i; const h = G.holes[i]; G.ball = { x: h.tee[0], z: h.tee[1], vx: 0, vz: 0, in: false, still: 0 }; G.moving = false; G.strokes[i] = 0; h.coins.forEach(q => q.got = false); G.ev.push({ k: 'hole', i }); }
const hole = G => G.holes[G.hi];
// where a moving thing is at time t
function windBlades(o, t) { const out = []; for (let i = 0; i < o.blades; i++) { const a = o.a0 + o.spin * t + i * TAU / o.blades; out.push([[o.x, o.z], [o.x + Math.sin(a) * o.len, o.z + Math.cos(a) * o.len]]); } return out; }
function moverSeg(o, t) { const s = Math.sin(o.ph + o.sp * t) * o.amp; return [[o.x + s - o.len / 2, o.z], [o.x + s + o.len / 2, o.z]]; }
// ---------- the thumb ----------
function shoot(G, ang, pow) {
  if (G.over || G.moving || G.gap > 0 || !G.ball || G.ball.in) return false; pow = clamp(pow, 0.02, 1); const v = 1 + pow * 12;
  const b = G.ball; G.lastPos = { x: b.x, z: b.z }; b.vx = Math.sin(ang) * v; b.vz = Math.cos(ang) * v; G.moving = true; G.rollT = 0; b.still = 0; G.strokes[G.hi]++; G.total++; G.mullUsable = false; G.ev.push({ k: 'shot', pow }); lessonSee(G, 'shot'); return true;
}
function mulligan(G) { if (G.over || G.moving || !G.mullUsable || G.mull <= 0 || !G.lastPos) return false; G.mull--; G.mullUsable = false; Object.assign(G.ball, { x: G.lastPos.x, z: G.lastPos.z, vx: 0, vz: 0 }); G.strokes[G.hi]--; G.total--; G.ev.push({ k: 'mull' }); return true; }
// ---------- the ball: one step of rolling ----------
function roll(b, h, c, t, dt, ev) {
  let fr = 1.5; for (const o of h.obst) { if (o.kind === 'sand' && Math.hypot(b.x - o.x, b.z - o.z) < o.r) fr *= c.sandF; if (o.kind === 'slope' && Math.abs(b.x - o.x) < o.w / 2 && Math.abs(b.z - o.z) < o.h / 2) { b.vx += o.gx * dt; b.vz += o.gz * dt; } }
  const sp = Math.hypot(b.vx, b.vz); if (sp > 0) { const dv = Math.min(sp, (fr + 0.25 * sp) * dt); b.vx -= b.vx / sp * dv; b.vz -= b.vz / sp * dv; }
  b.x += b.vx * dt; b.z += b.vz * dt; const R = 0.12;
  const bounceSeg = (a, bb, e, vx0 = 0, vz0 = 0) => { const ax = bb[0] - a[0], az = bb[1] - a[1], L2 = ax * ax + az * az || 1, u = clamp(((b.x - a[0]) * ax + (b.z - a[1]) * az) / L2, 0, 1), px = a[0] + ax * u, pz = a[1] + az * u, dx = b.x - px, dz = b.z - pz, d = Math.hypot(dx, dz);
    if (d >= R || d < 1e-6) return false; const nx = dx / d, nz = dz / d; b.x = px + nx * R; b.z = pz + nz * R; const rvx = b.vx - vx0, rvz = b.vz - vz0, vn = rvx * nx + rvz * nz; if (vn < 0) { b.vx -= (1 + e) * vn * nx; b.vz -= (1 + e) * vn * nz; if (ev && -vn > 1) ev.push({ k: 'rail', v: -vn }); } return true; };
  for (const w of h.walls) bounceSeg(w[0], w[1], 0.72);
  for (const o of h.obst) {
    if (o.kind === 'bumper') { const dx = b.x - o.x, dz = b.z - o.z, d = Math.hypot(dx, dz); if (d < o.r + R) { const nx = dx / d, nz = dz / d; b.x = o.x + nx * (o.r + R); b.z = o.z + nz * (o.r + R); const vn = b.vx * nx + b.vz * nz; if (vn < 0) { b.vx -= 2.15 * vn * nx; b.vz -= 2.15 * vn * nz; if (ev) ev.push({ k: 'bump', i: h.obst.indexOf(o) }); } } }
    if (o.kind === 'windmill') for (const s of windBlades(o, t)) { const tx = -(s[1][1] - o.z) * o.spin, tz = (s[1][0] - o.x) * o.spin; if (bounceSeg(s[0], s[1], 0.6, tx * 0.5, tz * 0.5) && ev) ev.push({ k: 'swat' }); }
    if (o.kind === 'mover') { const s = moverSeg(o, t), vx = Math.cos(o.ph + o.sp * t) * o.amp * o.sp; if (bounceSeg(s[0], s[1], 0.6, vx, 0) && ev) ev.push({ k: 'rail', v: 2 }); }
  }
  // the cup: in if slow enough over it; a fast ball lips out (bent a little)
  const cdx = b.x - h.cup[0], cdz = b.z - h.cup[1], cd = Math.hypot(cdx, cdz), sp2 = Math.hypot(b.vx, b.vz);
  const cupR = c.cupR * (c.lessonCup || 1); if (cd < cupR) { if (sp2 < 2.2 * (c.lessonCup || 1)) { b.in = true; b.vx = b.vz = 0; return 'in'; } b.vx -= cdx * 6 * dt; b.vz -= cdz * 6 * dt; if (ev && !b.lip) { b.lip = true; ev.push({ k: 'lip' }); } } else b.lip = false;
  if (c.lessonCup && cd < 0.45 && sp2 < 1.0) { b.vx -= cdx * 9 * dt; b.vz -= cdz * 9 * dt; }      // in a lesson the cup draws a slow ball the last little way
  for (const o of h.obst) if (o.kind === 'water' && Math.hypot(b.x - o.x, b.z - o.z) < o.r) return 'water';
  if (!inPoly(h.poly, b.x, b.z)) { b.x = clamp(b.x, -20, 20); return 'out'; }
  if (Math.hypot(b.vx, b.vz) < 0.06) { b.still += dt; if (b.still > 0.12) { b.vx = b.vz = 0; return 'stop'; } } else b.still = 0;
  return null;
}
function step(G, dt) {
  if (G.over) return; G.t += dt; const c = G.cfg, h = hole(G), b = G.ball;
  if (G.gap > 0) { G.gap -= dt; if (G.gap <= 0) { G.gap = 0; if (G.hi + 1 < G.holes.length) startHole(G, G.hi + 1); else if (G.lesson) lessonSee(G, 'round'); else finish(G, G.total <= G.limit); } return; }
  if (!G.moving) return;
  G.rollT = (G.rollT || 0) + dt; if (G.rollT > 15) { b.vx = b.vz = 0; }      // nothing rolls for ever (a ball pinned by a sliding wall)
  for (let s = 0; s < 3; s++) { const r = roll(b, h, c, G.t, dt / 3, G.ev);
    for (const q of h.coins) if (!q.got && Math.hypot(q.x - b.x, q.z - b.z) < c.magnet) { q.got = true; G.coins++; G.ev.push({ k: 'coin' }); }
    if (r === 'in') { G.moving = false; const n = G.strokes[G.hi], d = n - h.par, wasL = !!G.lesson; G.ev.push({ k: 'sink', n, d, lesson: wasL }); lessonSee(G, 'sink'); if (wasL) return; G.gap = 1.6; return; }
    if (r === 'water' || r === 'out') { G.moving = false; Object.assign(b, { x: G.lastPos.x, z: G.lastPos.z, vx: 0, vz: 0 }); if (r === 'water' && G.wings > 0) { G.wings--; G.ev.push({ k: 'wings' }); } else { G.strokes[G.hi]++; G.total++; G.ev.push({ k: 'splash' }); } lessonMiss(G, 'water'); checkLimit(G); return; }
    if (r === 'stop') { G.moving = false; G.mullUsable = G.mull > 0; G.ev.push({ k: 'stop' }); checkLimit(G); return; } }
}
// past the limit for this hole (par + 4): pick up; past the round's limit: the round is over
function checkLimit(G) { if (G.lesson) { if (G.strokes[G.hi] >= 2) { G.ev.push({ k: 'lessonmiss', why: 'strokes', how: 'Two strokes and no cup: back to the tee. Pull back gently for a short putt, further for a long one.' }); G.lesson.n = 0; startHole(G, G.hi); } return; } const h = hole(G); if (G.strokes[G.hi] >= h.par + 4) { G.ev.push({ k: 'pickup' }); G.ball.in = true; G.gap = 1.4; }
  const left = G.holes.slice(G.hi + 1).reduce((a, q) => a + 1, 0); if (G.total + (G.ball.in ? 0 : 1) + left > G.limit) finish(G, false, 'limit'); }
function finish(G, win, why) {
  G.over = win ? 'won' : 'lost'; const d = G.total - G.par, stars = win ? (d < 0 ? 3 : d === 0 ? 2 : 1) : 0;
  G.res = { win, why, stars, total: G.total, par: G.par, limit: G.limit, coins: G.coins + (win ? stars * 3 + Math.ceil(G.N / 3) : 0), combo: G.strokes.filter((n, i) => n <= G.holes[i].par).length, time: G.t };
  G.ev.push({ k: win ? 'won' : 'lost', why });
}
// ---------- LESSONS ----------
const AIMCARD = {"pic": "⛳", "win": "SINK EVERY HOLE IN FEW SHOTS", "lose": "USE UP THE SHOTS", "how": "PULL BACK, LET GO"};      // the aim card: specs/aims.json (tools/aims.py)
const LESSONS = {
  1: [{ id: 'putt', title: 'PULL BACK, LET GO', say: G => golfCue(G)[0], do: G => golfCue(G)[1], at: G => golfCue(G)[2], how: 'Put your thumb down anywhere and pull back, away from where you want the ball to go. Let go. Sink it in two strokes or fewer, twice in a row.', need: 2, ok: w => w === 'sink' }],
  2: [{ id: 'bank', title: 'OFF THE RAILS', say: G => golfCue(G)[0], do: G => golfCue(G)[1], at: G => golfCue(G)[2], how: 'The ball bounces off the wooden rails. Play it off a rail round the corner: sink it in two or fewer, twice in a row.', need: 2, ok: w => w === 'sink' }],
  3: [{ id: 'mill', title: 'THE WINDMILL', say: G => golfCue(G)[0], do: G => golfCue(G)[1], at: G => golfCue(G)[2], how: 'Time your shot between the turning blades. Sand slows the ball. Sink it in two or fewer, twice in a row.', need: 2, ok: w => w === 'sink' }],
};
// THE TUTORIAL'S HAND PULLS BACK THE PUTT THAT SINKS (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing happens").
// It pulled straight down in a box (straight down from anywhere is a putt straight up the screen, at whatever strength). Now the robot finds
// the putt (dryPlan) and the hand pulls back exactly that: the way (opposite to where the ball goes) and how far (how hard).
const GFC = { key: '', v: null };
function golfCue(G) { if (G.moving || G.gap > 0 || G.over || !G.ball || G.ball.in) return ['WAIT…', 'wait', false]; const key = G.ball.x.toFixed(2) + ',' + G.ball.z.toFixed(2) + ',' + CAM.rot.toFixed(2) + (G.N === 3 ? ',' + Math.round(G.t * 2) : '');
  if (GFC.key === key) return GFC.v; GFC.key = key; const P = dryPlan(G, null, { at: -1 }); if (!P) return GFC.v = ['WAIT…', 'wait', false];
  const th = P[1] - CAM.rot, len = Math.max(16 * k, P[2] * 150 * k), x0 = W / 2, y0 = H * 0.55; return GFC.v = [G.N === 3 ? 'PULL BACK, LET GO (MIND THE BLADES)' : 'PULL BACK, LET GO', 'drag', [x0, y0, x0 - len * Math.sin(th), y0 - len * Math.cos(th)]]; }
function lessonStart(G) { G.cfg.lessonCup = 1.12; const L = { 1: ['straight', []], 2: ['lright', ['bumper']], 3: ['straight', ['windmill', 'sand']] }[G.N]; G.lesson = { steps: LESSONS[G.N], i: 0, n: 0, miss: 0 };
  const T = TEMPLATES[L[0]], h = { key: L[0], poly: T.poly, tee: T.tee, cup: T.cup, walls: [], obst: [], coins: [], par: T.par }; h.poly.forEach((p, j) => h.walls.push([p, h.poly[(j + 1) % h.poly.length]]));
  L[1].forEach((kd, i) => { const [x, z] = T.slots[kd === 'windmill' ? 1 : kd === 'sand' ? 2 : 0]; const o = { kind: kd, x, z }; if (kd === 'bumper') o.r = 0.4; if (kd === 'sand') o.r = 1; if (kd === 'windmill') Object.assign(o, { len: 1.25, spin: 1.2, a0: 0, blades: 2 }); h.obst.push(o); });
  h.dist = distField(h); G.lessonHole = h; G.holes.unshift(h); startHole(G, 0); G.ev.push({ k: 'lessonnext', first: true }); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonSee(G, what) {
  const D = G.lesson; if (!D) return; const st = D.steps[D.i]; if (!st.ok(what)) return;
  D.n++; if (D.n < st.need) { G.ev.push({ k: 'lessonok', n: D.n, need: st.need }); startHole(G, G.hi); return; }
  D.i++; D.n = 0; if (D.i >= D.steps.length) { G.lesson = null; G.cfg.lessonCup = 1; G.ev.push({ k: 'lessondone', N: G.N }); G.holes.shift(); G.strokes = []; G.total = 0; G.coins = 0; G.gap = 0; startHole(G, 0); }
}
function lessonMiss(G, why) { const D = G.lesson; if (!D) return; D.miss++; G.ev.push({ k: 'lessonmiss', why, how: D.steps[D.i].how }); }

// ---------- for the robots ----------
// BLIND: a pull back in any direction, any length (and the mulligan button, which stays in one place)
const BLIND = { s: G => shoot(G, Math.random() * TAU, Math.random()), m: G => mulligan(G) };
// try a shot without playing it: where does the ball stop, or does it drop?
function trial(G, ang, pow) {
  const h = hole(G), c = G.cfg, b = { x: G.ball.x, z: G.ball.z, vx: 0, vz: 0, still: 0 }, v = 1 + clamp(pow, 0.02, 1) * 12; b.vx = Math.sin(ang) * v; b.vz = Math.cos(ang) * v;
  let t = G.t; for (let i = 0; i < 900; i++) { t += 1 / 60; const r = roll(b, h, c, t, 1 / 60, null); if (r === 'in') return -10; if (r === 'water' || r === 'out') return 8 + h.dist.at(G.ball.x, G.ball.z); if (r === 'stop') break; }
  return h.dist.at(b.x, b.z);
}
// a golfer who looks: tries shots in his head (every 10 degrees, five strengths), then finer round the best; hands shake a little
function honest(G, o, mem) {
  const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc;
  if (G.moving || G.gap > 0 || G.over || !G.ball || G.ball.in) { mem.at = null; return; } if (mem.at == null) mem.at = G.t + 0.6 + react * 3; if (G.t < mem.at) return; mem.at = null;
  let best = null; for (let a = 0; a < 36; a++) for (const p of [0.12, 0.25, 0.4, 0.6, 0.85]) { const ang = a / 36 * TAU, s = trial(G, ang, p) + p * 0.3; if (!best || s < best.s) best = { s, ang, p }; }
  for (let da = -4; da <= 4; da++) for (const dp of [-0.06, -0.03, 0, 0.03, 0.06]) { const ang = best.ang + da * 0.025, p = clamp(best.p + dp, 0.02, 1), s = trial(G, ang, p) + p * 0.3; if (s < best.s) best = { s, ang, p }; }
  const u = 1 - acc; ACT.shoot(G, best.ang + (Math.random() - 0.5) * u * 0.7, best.p * (1 + (Math.random() - 0.5) * u * 1.0));      // a thumb is not a robot: a few degrees out, a little too hard or soft
}
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.total = Math.min(G.total, G.par); finish(G, true); }

// what the robot would do now, without doing it (tools/dry_plan.py): the tutorial shows this move
const ACT_REAL = { shoot }; let ACT = ACT_REAL;
function dryPlan(G, o, mem) { let got = null; const rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { if (!got && !(a.length > 2 && a.slice(1).every(v => v === 0 || v === false))) got = [n, ...a.slice(1)]; return true; };      /* (a stick at rest, all its numbers 0, is not a move; a first bed, number 0, is) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return got; }
