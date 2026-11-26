
// ===================== THE RULES: Kite Fighter =====================
// You fly a fighter kite from a rooftop. One thumb: HOLD to pull the line (the kite darts the way its nose points), LET GO
// to give slack (the kite turns on the spot, nose spinning round, and drifts with the wind). So: let go until the nose points
// where you want, then hold. Cross a rival's line with yours and the lines saw at each other: the one pulling harder cuts
// the other (BO KATA!). Cut the kites the round asks for before the sun goes; keep your kite out of the roofs.
const RULES = [
  '<b>HOLD</b> to pull: your kite darts the way its nose points (the arrow).',
  '<b>LET GO</b> to give slack: the kite turns on the spot. Let go until it points where you want, then hold.',
  '<b>Cross a rival\'s line</b> with yours and the lines saw at each other. <b>Pull while they cross</b> and you cut them: BO KATA!',
  'If they pull harder, they cut yours. Keep your kite up: the roofs and the ground end it.',
  'Cut the kites the round asks for. Cut two quickly for a DOUBLE. Cut kites float down: touch one with your line to keep it.',
];
const SKY = { x0: -70, x1: 70, y0: 9, y1: 95 }, LMAX = 110, KITE_Z = 55;
const PLACES = [{ name: 'Old City Rooftops', sky: 'golden' }, { name: 'Beach Festival', sky: 'noon' }, { name: 'Hilltop Town', sky: 'morning' }, { name: 'Night Festival', sky: 'night' }, { name: 'Monsoon Sky', sky: 'overcast' }, { name: 'Sunset Final', sky: 'sunset' }];
const placeOf = N => Math.floor((N - 1) / 5) % PLACES.length;
const RIVALS = [{ name: 'RAJA', col: 0xe8463c }, { name: 'MEENA', col: 0x2f9a4a }, { name: 'KOFI', col: 0x2a6ad8 }, { name: 'BIA', col: 0xf2b81a }, { name: 'TARIQ', col: 0x8a4fd0 }, { name: 'LUCAS', col: 0xf07a2a }, { name: 'AMARA', col: 0x22b8c8 }, { name: 'ZAIN', col: 0xe85aa0 }];
const SKINS = [{ id: 'sun', name: 'Sunburst', col: 0xffb020, stars: 0 }, { id: 'moon', name: 'Moon', col: 0xd8e4ff, stars: 5 }, { id: 'tiger', name: 'Tiger', col: 0xff7a1a, stars: 12 }, { id: 'peacock', name: 'Peacock', col: 0x1aa0a8, stars: 20 },
  { id: 'rose', name: 'Rose', col: 0xff5a8a, stars: 30 }, { id: 'night', name: 'Night', col: 0x2a2a6a, stars: 42 }, { id: 'dragon', name: 'Dragon', col: 0xd82020, stars: 56 }, { id: 'gold', name: 'Golden', col: 0xffd84a, stars: 75 }];
const UPGRADES = [
  { id: 'manja', name: 'Sharp manja', max: 4, cost: l => [30, 70, 140, 250][l], desc: 'Your line cuts faster.' },
  { id: 'dor', name: 'Strong line', max: 3, cost: l => [30, 70, 140][l], desc: 'Your line is harder to cut.' },
  { id: 'light', name: 'Light kite', max: 3, cost: l => [35, 80, 150][l], desc: 'Turns quicker on slack.' },
  { id: 'spool', name: 'Big spool', max: 3, cost: l => [25, 60, 120][l], desc: 'Darts faster.' },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Rooftop kid'], [60, 'Kite flyer'], [200, 'Line cutter'], [500, 'Sky fighter'], [1100, 'Kite master'], [2500, 'King of the sky']];
function makeCfg(N, help) { const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), boss = N % 5 === 0;
  return { rivals: Math.min(4, 1 + Math.floor(f / 6) + (boss ? 1 : 0)), need: Math.min(5, 3 + Math.floor(f / 16)), time: 40 + 15 * Math.min(5, 3 + Math.floor(f / 16)) + Math.round(35 * easyOf(N)) + (boss ? 15 : 0) + (help ? 25 : 0),
    aggro: x(0.25, 0.65, 22) * (1 - 0.5 * easyOf(N)) * (help ? 0.7 : 1), rsaw: x(0.62, 0.8, 25) * (1 - 0.3 * easyOf(N)) * (boss ? 1.08 : 1), rskill: x(0.4, 0.85, 25), wind: x(1.0, 4.5, 30), gust: N >= 6, boss, help: !!help,
    saw: 1 + 0.18 * upLv('manja'), tough: 1.25 + 0.15 * upLv('dor'), spin: 2.3 * (1 + 0.12 * upLv('light')), vmax: 15 * (1 + 0.06 * upLv('spool')) }; }
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, wait: 0, next: null };
  setup(G); if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else G.ev.push({ k: 'start' });
  return G; }
function kite(o) { return Object.assign({ x: 0, y: 40, vx: 0, vy: 0, th: Math.PI / 2, pull: false, alive: true, fall: 0, spinDir: 1, cutBy: null }, o); }
function setup(G, o = {}) { const c = G.cfg, R = G.rnd; G.t = 0; G.yard = o.yard || null; G.left = c.time; G.cuts = 0; G.catches = 0; G.combo = 0; G.lastCut = -9; G.coins = 0; G.crosses = {}; G.rings = []; G.loot = [];
  G.you = kite({ ax: 0, ay: 2, az: 0, x: 0, y: 34, th: Math.PI / 2, you: true });
  G.rivals = []; const n = G.yard === 'steer' ? 0 : G.yard ? 1 : c.rivals;
  for (let i = 0; i < n; i++) { const side = i % 2 ? 1 : -1, ax = side * (40 + 20 * R() + 12 * Math.floor(i / 2)), az = 10 + R() * 30; const r = RIVALS[(G.seed + i * 3) % RIVALS.length];
    G.rivals.push(kite({ i, name: r.name, col: r.col, ax, ay: 8 + R() * 10, az, x: side * (25 + R() * 25), y: 45 + R() * 35, th: R() * TAU, spinDir: R() < 0.5 ? 1 : -1, mode: 'roam', mt: 1 + R() * 2, tgt: [0, 50], still: G.yard === 'cut' })); }
  if (G.yard === 'steer') { for (let i = 0; i < 4; i++) G.rings.push({ x: [-30, 25, -10, 35][i], y: [55, 70, 40, 50][i], r: 7, got: false }); }
  G.wind = c.wind * (R() < 0.5 ? 1 : -1) * (G.yard ? 0.4 : 1); G.gustT = 6 + R() * 6; G.gust = 0; }
const lineSeg = q => [q.ax * 0.5, q.ay + 30 * 0, q.x, q.y];      // the line in the kite's plane: from (a little in front of) the flyer to the kite
// ---------- your thumb ----------
function hold(G, on) { if (G.over || !G.you) return; if (G.you.pull !== on) { G.you.pull = on; G.ev.push({ k: on ? 'pull' : 'slack' }); } }
// ---------- the clock ----------
function fly(G, q, dt, pull, isYou) { const c = G.cfg; if (!q.alive) { q.fall += dt; q.vy -= 4 * dt; q.vx += (G.wind * 0.6 - q.vx) * dt * 0.5; q.x += q.vx * dt; q.y += q.vy * dt; q.th += q.spinDir * 5 * dt; return; }
  const spin = isYou ? c.spin : 2.3 * (0.8 + 0.4 * c.rskill), vmax = isYou ? c.vmax : 13 * (0.85 + 0.3 * c.rskill);
  q.p = pull ? Math.min(1, (q.p || 0) + dt / 0.25) : 0;      // the line takes a moment to tighten: a flick of the thumb is only a tug
  const stall = clamp((q.y - 82) / 12, 0, 1);      // up at the top of the sky the wind gives out: no power, a kite cannot sit up there
  if (pull) { const tx = Math.cos(q.th) * vmax * q.p * (1 - stall), ty = Math.sin(q.th) * vmax * q.p * (1 - stall) - 5; q.vx += (tx - q.vx) * Math.min(1, dt * 3.2 * q.p); q.vy += (ty - q.vy) * Math.min(1, dt * 3.2 * q.p); }
  else { q.th += q.spinDir * spin * dt; const wx = (G.wind + G.gust) * 0.9, wy = -1.6; q.vx += (wx - q.vx) * Math.min(1, dt * 1.6); q.vy += (wy - q.vy) * Math.min(1, dt * 1.6); }
  const x0 = q.x, y0 = q.y; q.x += q.vx * dt; q.y += q.vy * dt;
  // the line holds it: never further than the line is long, never past the edges of the sky
  const dx = q.x - q.ax * 0.5, dy = q.y - q.ay, d = Math.hypot(dx, dy); if (d > LMAX) { q.x = q.ax * 0.5 + dx / d * LMAX; q.y = q.ay + dy / d * LMAX; }
  if (q.x < SKY.x0) { q.x = SKY.x0; q.vx = Math.abs(q.vx) * 0.3; } if (q.x > SKY.x1) { q.x = SKY.x1; q.vx = -Math.abs(q.vx) * 0.3; } if (q.y > SKY.y1) { q.y = SKY.y1; q.vy = Math.min(0, q.vy); q.vx *= 0.85; }
  q.dx = (q.x - x0) / dt; q.dy = (q.y - y0) / dt; q.spd = Math.hypot(q.dx, q.dy); }      // the speed it really moved at (held by its line or the sky's edge, it is not moving)
function segX(a, b) { const [x1, y1, x2, y2] = a, [x3, y3, x4, y4] = b, d = (x2 - x1) * (y4 - y3) - (y2 - y1) * (x4 - x3); if (Math.abs(d) < 1e-6) return null; const t = ((x3 - x1) * (y4 - y3) - (y3 - y1) * (x4 - x3)) / d, u = ((x3 - x1) * (y2 - y1) - (y3 - y1) * (x2 - x1)) / d; return t > 0.04 && t < 0.98 && u > 0.04 && u < 0.98 ? [x1 + t * (x2 - x1), y1 + t * (y2 - y1), t, u] : null; }
function step(G, dt) { if (G.over || !(dt > 0)) return;
  if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0) { G.wait = 0; if (G.next) { const f = G.next; G.next = null; f(); } } return; }
  G.t += dt; const c = G.cfg, y = G.you; if (!G.lesson && !G.yard) G.left -= dt;
  G.gustT -= dt; if (c.gust && G.gustT <= 0) { G.gust = (G.rnd() - 0.5) * c.wind * 2.4; G.gustT = 3 + G.rnd() * 5; G.ev.push({ k: 'gust' }); } else if (!c.gust) G.gust = 0;
  fly(G, y, dt, y.pull, true); for (const r of G.rivals) { if (r.alive && !r.still) brain(G, r, dt); if (!r.still || !r.alive) fly(G, r, dt, r.alive && !r.still && r.pull, false); }
  // the roofs: below the line of the roofs the kite is lost
  if (y.y < SKY.y0) { G.ev.push({ k: 'crash' }); if (G.lesson) { lessonMiss(G, 'Too low! Keep the nose up: let go to turn it before you pull.'); return; } finish(G, false, { why: 'crash' }); return; }
  for (const r of G.rivals) if (r.alive && r.y < SKY.y0) { r.alive = false; r.vx = 0; r.vy = -2; G.ev.push({ k: 'rcrash', i: r.i }); }
  // crossings: lines that cross saw at each other; the one pulling harder cuts the other
  const ys = lineSeg(y);
  for (const r of G.rivals) { if (!r.alive) continue; const X = segX(ys, lineSeg(r)), key = r.i;
    if (!X) { if (G.crosses[key]) { delete G.crosses[key]; G.ev.push({ k: 'uncross', i: r.i }); } continue; }
    if (X[3] < 0.4) { if (G.crosses[key]) { delete G.crosses[key]; G.ev.push({ k: 'uncross', i: r.i }); } continue; }      // low on their line, near the flyer: the lines just slide past
    const cr = G.crosses[key] || (G.crosses[key] = { you: 0, them: 0, x: X[0], y: X[1], t: 0 }); if (!cr.t) G.ev.push({ k: 'cross', i: r.i }); cr.x = X[0]; cr.y = X[1]; cr.t += dt;
    // crossed lines saw at each other: a line cuts while it is pulled hard and its kite is moving
    const ps = Math.min(1, (y.spd || 0) / c.vmax), rs = Math.min(1, (r.spd || 0) / 13); cr.ps = ps;
    const sawOf = (p, sp, k) => p ? 1.7 * clamp((sp - 0.3) / 0.6, 0, 1) * k * k : 0;      // a parked kite cannot cut at all      // a parked kite saws next to nothing: it must be darting
    const hi0 = clamp((y.y - r.y) / 12, -1, 1), hi = hi0 > 0 ? hi0 * clamp(-(y.dy || 0) / 6, 0, 1) : -(-hi0) * clamp(-(r.dy || 0) / 6, 0, 1);      // the edge goes to the kite that is above AND diving down across the line      // only the kite on top cuts well: it brings its line down across the other 
    const up = q => (q.dy || 0) > 1.5 ? 0.55 : 1;      // a line pushed UP into another bites less than one brought down across it
    cr.you += dt * c.saw * sawOf(y.pull, ps, y.p || 0) * up(y) * (1 + 0.45 * hi) / (r.still ? 0.7 : 1); cr.them += dt * c.rsaw * sawOf(r.pull, rs, r.p || 0) * up(r) * (1 - 0.45 * hi) / c.tough * (r.still ? 0 : 1);
    if (cr.you >= 1) { cut(G, r, X); delete G.crosses[key]; } else if (cr.them >= 1) { G.ev.push({ k: 'cutyou', i: r.i, x: X[0], y: X[1] }); y.alive = false; if (G.lesson) { lessonMiss(G, 'They cut you! When the lines cross, HOLD: pull harder than they do.'); return; } finish(G, false, { why: 'cut', by: r.name }); return; } }
  // rings (the lesson) and loot: falling kites caught on your line
  for (const g of G.rings) if (!g.got && Math.hypot(g.x - y.x, g.y - y.y) < g.r) { g.got = true; G.ev.push({ k: 'ring', n: G.rings.filter(q => q.got).length }); if (G.lesson) lessonSee(G, 'ring'); }
  for (const r of G.rivals) if (!r.alive && !r.caught && r.fall > 0.3 && r.y > SKY.y0 && !r.lost) { const s = ys, d = distSeg(r.x, r.y, s); if (d < 2.2) { r.caught = true; G.catches++; G.coins += 4; G.ev.push({ k: 'catch', i: r.i }); } if (r.y < SKY.y0 + 1) r.lost = true; }
  if (G.lesson && G.rivals.length && !G.rivals.some(r => r.alive) && G.wait <= 0) { lessonDeal(G); return; }      // the lesson's kite went into the roofs by itself: a new one
  if (!G.lesson && !G.yard) { if (G.cuts >= c.need) { finish(G, true); return; } if (G.left <= 0) { finish(G, false, { why: 'time' }); return; } if (!G.rivals.some(r => r.alive) && G.cuts < c.need) respawn(G); } }
function normal(s) { const dx = s[2] - s[0], dy = s[3] - s[1], L = Math.hypot(dx, dy) || 1; return dy / L * (dx > 0 ? -1 : 1) > 0 || true ? [-dy / L, dx / L] : [dy / L, -dx / L]; }
function along(s) { const dx = s[2] - s[0], dy = s[3] - s[1], L = Math.hypot(dx, dy) || 1; return dy >= 0 ? [dx / L, dy / L] : [-dx / L, -dy / L]; }      // along a line, upwards
function sweepDir(s) { const n = normal(s); return n[1] >= 0 ? n : [-n[0], -n[1]]; }      // across a line, upwards
function distSeg(px, py, s) { const [x1, y1, x2, y2] = s, dx = x2 - x1, dy = y2 - y1, t = clamp(((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy || 1), 0, 1); return Math.hypot(px - x1 - t * dx, py - y1 - t * dy); }
function respawn(G) { const R = G.rnd; for (const r of G.rivals) { if (r.alive || r.fall < 3) continue; Object.assign(r, kite({ i: r.i, name: r.name, col: r.col, ax: r.ax, ay: r.ay, az: r.az, x: r.ax * 0.5 + Math.sign(r.ax) * 4, y: 24 + R() * 6, th: Math.PI / 2, spinDir: r.spinDir, mode: 'roam', mt: 2.5, tgt: [r.ax * 0.6, 55] })); G.ev.push({ k: 'newkite', i: r.i }); return; } }
function cut(G, r, X) { r.alive = false; r.vx = r.vx * 0.3; r.vy = 1; r.cutAt = G.t; G.cuts++; const dbl = G.t - G.lastCut < 6; G.combo = dbl ? G.combo + 1 : 1; G.lastCut = G.t; G.coins += 5 + (G.combo - 1) * 4;
  G.ev.push({ k: 'cut', i: r.i, x: X[0], y: X[1], combo: G.combo, name: r.name }); if (G.lesson) lessonSee(G, 'cut'); }
function finish(G, win, o = {}) { if (G.over) return true; G.over = win ? 'won' : 'lost'; const c = G.cfg;
  const stars = win ? 1 + (G.left >= c.time * 0.4 ? 1 : 0) + (G.catches >= 1 || G.combo >= 2 ? 1 : 0) : 0;
  G.res = { win, stars, why: o.why || null, by: o.by || null, cuts: G.cuts, need: c.need, catches: G.catches, left: Math.round(G.left), combo: G.combo, coins: Math.max(1, G.coins + G.cuts * 2 + (win ? 4 + Math.ceil(G.N / 2) + stars * 2 : 0)) };
  G.ev.push({ k: win ? 'won' : 'lost' }); return true; }
// ---------- the rivals' minds: roam, then hunt your line (more often and better on later levels) ----------
function steerTo(q, tx, ty, tol, dt) { const want = Math.atan2(ty - q.y, tx - q.x), d = Math.atan2(Math.sin(want - q.th), Math.cos(want - q.th)); return Math.abs(d) < tol; }
function brain(G, r, dt) { const c = G.cfg, y = G.you; r.mt -= dt;
  if (r.mt <= 0) { r.mt = 1.5 + G.rnd() * 2.5; const hunt = G.rnd() < c.aggro && y.alive; r.mode = hunt ? 'hunt' : 'roam'; r.tgt = [SKY.x0 + 20 + G.rnd() * (SKY.x1 - SKY.x0 - 40), 40 + G.rnd() * 45]; }
  let tx = r.tgt[0], ty = r.tgt[1];
  if (r.mode === 'hunt') { const f = 0.45 + 0.3 * Math.sin(G.t * 0.7 + r.i), px = y.x * f, py = y.ay + (y.y - y.ay) * f; tx = px + (r.x < px ? 8 : -8); ty = py - 6; }
  const cr = G.crosses[r.i]; if (cr) { if (G.rnd() < dt * 6) r.pull = G.rnd() < 0.45 + 0.5 * c.rskill && (r.y > SKY.y0 + 8 || Math.sin(r.th) > -0.2); return; }
  if (r.y < SKY.y0 + 12 && Math.sin(r.th) < 0.3) { r.pull = false; return; }      // nose up before pulling, near the roofs
  r.pull = steerTo(r, tx, ty, 0.35 + 0.5 * (1 - c.rskill), dt) && Math.hypot(tx - r.x, ty - r.y) > 4; }
// ---------- the robot: a flyer who looks ----------
const gauss = () => { let u = 0; for (let i = 0; i < 4; i++) u += Math.random(); return (u - 2) * 1.732; };
// THE TUTORIAL SAYS HOLD OR LET GO, NOW (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing happens"). It said LET GO TO
// TURN, HOLD TO GO (both at once) with a hand holding. Now the robot is asked (dryPlan: it holds or lets go): HOLD TO GO when the nose points
// where to go, LET GO TO TURN when it does not, KEEP HOLDING while the lines cross.
const KIC = { t: -1e9, v: null, m: {} };
function kiteCue(G) { if (G.over || G.wait > 0 || !G.you) return ['WAIT…', 'wait', false]; const now = performance.now(); if (now - KIC.t < 120) return KIC.v; KIC.t = now; KIC.m.cd = -1;
  const P = dryPlan(G, null, KIC.m), on = P && P[0] === 'hold' ? !!P[1] : !!G.you.pull, crossed = Object.keys(G.crosses).length > 0;
  KIC.v = on ? [crossed ? 'KEEP HOLDING!' : 'HOLD TO GO', 'hold', [W / 2, H * 0.66]] : ['LET GO TO TURN', 'release', [W / 2, H * 0.66]]; return KIC.v; }
function honest(G, o, mem) { if (G.over || G.wait > 0 || !G.you) return; const y = G.you, acc = o.acc == null ? 0.85 : o.acc, react = o.react == null ? 0.3 : o.react;
  mem.cd = (mem.cd || 0) - 1 / 60; if (mem.cd > 0) return; mem.cd = 0.03 + react * 0.12 * Math.random();
  const tol = 0.22 + (1 - acc) * 0.7, crossed = Object.keys(G.crosses).length > 0;
  if (y.y < SKY.y0 + 9 + (1 - acc) * 6 && Math.sin(y.th) < 0.35) { ACT.hold(G, false); return; }      // low: turn the nose up first
  if (crossed) { if (Math.random() < 0.15 + 0.85 * acc) ACT.hold(G, Math.sin(y.th) > -0.5 || y.y > SKY.y0 + 14); return; }      // crossed from above: pull, unless it would dive into the roofs
  let tx, ty; const g = G.rings.find(q => !q.got);
  if (g) { tx = g.x; ty = g.y; }
  else { const live = G.rivals.filter(r => r.alive); if (!live.length) { tx = 0; ty = 60; } else { const r = live.reduce((a, b) => Math.hypot(a.x - y.x, a.y - y.y) < Math.hypot(b.x - y.x, b.y - y.y) ? a : b);
      // aim to sweep across its line, from above its middle
      const fx = r.ax * 0.5 + (r.x - r.ax * 0.5) * 0.7, fy = r.ay + (r.y - r.ay) * 0.7; if (mem.side == null || mem.r !== r) { mem.r = r; mem.side = Math.sign(y.x - fx) || 1; mem.ph = 0; }
      if (y.y < r.y + 4 && mem.ph === 0) { tx = y.x + (fx > y.x ? -6 : 6); ty = Math.min(SKY.y1 - 4, r.y + 14); } else { mem.ph = 1; tx = fx - mem.side * 16; ty = fy - 2; if (Math.hypot(tx - y.x, ty - y.y) < 8) { mem.side = -mem.side; mem.ph = 0; } } } }
  tx += gauss() * (1 - acc) * 10; ty += gauss() * (1 - acc) * 10; ty = Math.max(ty, SKY.y0 + 14);
  ACT.hold(G, steerTo(y, tx, ty, tol) && Math.hypot(tx - y.x, ty - y.y) > 3); }
// blind moves: thumb down (pull), thumb up (slack), a quick tap
const BLIND = { h: G => hold(G, true), r: G => hold(G, false), t: G => { hold(G, true); hold(G, false); } };
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.wait = 0; G.cuts = G.cfg.need; finish(G, true); }
// ---------- LESSONS ----------
const AIMCARD = {"pic": "🪁", "win": "CUT THEIR KITE STRINGS", "lose": "THEY CUT YOURS, OR YOU CRASH", "how": "HOLD TO PULL, LET GO TO TURN"};      // the aim card: specs/aims.json (tools/aims.py)
const LESSONS = {
  1: [{ id: 'steer', title: 'LET GO TO TURN, HOLD TO GO', say: G => kiteCue(G)[0], do: G => kiteCue(G)[1], at: G => kiteCue(G)[2], how: 'Let go and the kite turns on the spot. When its nose (the arrow) points at a ring, HOLD to dart through it. Fly through all 4 rings.', need: 4 }],
  2: [{ id: 'cut', title: 'CROSS AND CUT', say: G => kiteCue(G)[0], do: G => kiteCue(G)[1], at: G => kiteCue(G)[2], how: 'Fly so your line crosses the practice kite\'s line, then HOLD while they cross: you saw through it. Cut it!', need: 1 }],
  3: [{ id: 'fight', title: 'PULL HARDER', say: G => kiteCue(G)[0], do: G => kiteCue(G)[1], at: G => kiteCue(G)[2], how: 'This one fights back. When the lines cross, keep HOLDING (nose up): whoever pulls harder cuts the other.', need: 1 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonDeal(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonDeal(G) { const st = lessonNow(G); G.rnd = rng(G.seed + (G.deals = (G.deals | 0) + 1)); G.lesson.n = 0; setup(G, { yard: st.id });
  if (st.id === 'cut') { const r = G.rivals[0]; r.x = 20; r.y = 55; r.ax = 60; r.th = Math.PI / 2; }
  if (st.id === 'fight') { const r = G.rivals[0]; r.mode = 'hunt'; G.cfg = Object.assign({}, G.cfg, { aggro: 0.6, rsaw: 0.45, rskill: 0.4 }); }
  G.ev.push({ k: 'yard' }); }
function lessonMiss(G, how) { G.ev.push({ k: 'lessonmiss', how }); G.wait = 1.5; G.next = () => lessonDeal(G); }
function lessonSee(G, what) { const L = lessonNow(G); if (!L || G.wait > 0) return; if ((L.id === 'steer' && what === 'ring') || (L.id !== 'steer' && what === 'cut')) { G.lesson.n++; G.ev.push({ k: 'lessonok', n: G.lesson.n, need: L.need }); }
  if (G.lesson.n < L.need) return;
  G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.wait = 1.4; G.next = () => { G.cfg = makeCfg(G.N); G.rnd = rng(G.seed); setup(G); G.ev.push({ k: 'start' }); G.ev.push({ k: 'yard' }); }; }

// what the robot would do now, without doing it (tools/dry_plan.py): the tutorial shows this move
const ACT_REAL = { hold }; let ACT = ACT_REAL;
function dryPlan(G, o, mem) { let got = null; const rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { if (!got && !(a.length > 2 && a.slice(1).every(v => v === 0 || v === false))) got = [n, ...a.slice(1)]; return true; };      /* (a stick at rest, all its numbers 0, is not a move; a first bed, number 0, is) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return got; }
function dryPlanAll(G, o, mem) { const all = [], rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { all.push([n, ...a.slice(1)]); return true; };      /* every call, in order (for a robot that steers and drifts at once) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return all; }
