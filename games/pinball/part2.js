
// ===================== RULES: Pinball (game 38) =====================
// A real table, seen from the player's end. Hold the left side of the screen for the left flipper, the right side for the right
// one. A tap launches the ball. The table always shows one MISSION (up the ramp, clear the drop targets, light A-B-C, round the
// orbit, the bumpers...). Finish the missions the level asks for before your three balls are gone. Every mission done lights
// the table up a step (the multiplier grows), and after three, MULTIBALL. Points stay as your best score.
// Table: x across (-5..5), y up the table (0 at the bottom, 18 at the top); one unit is about 3 cm of a real table.
const RULES = [
  '<b>Hold the left side</b> of the screen for the left flipper, <b>the right side</b> for the right one. A tap launches the ball.',
  'Where the ball meets the flipper decides where it goes: <b>early</b> sends it across, <b>late</b> sends it up its own side.',
  'Do the <b>mission</b> on the screen: up the ramp, clear the drop targets, light A-B-C, round the orbit...',
  'Each mission done lights the table up (×2, ×3...). Three and it is <b>MULTIBALL</b>.',
  'Finish the missions the level asks for before your three balls drain. Hold a flipper up to catch the ball and take aim.',
];
const BR = 0.27, GRAV = 13, FL = 1.75;
// the table's fixed walls: [x1, y1, x2, y2]
function walls(post = 0) { const W = [];
  const arc = (cx, cy, r, a0, a1, n) => { let px = cx + r * Math.cos(a0), py = cy + r * Math.sin(a0); for (let i = 1; i <= n; i++) { const a = a0 + (a1 - a0) * i / n, x = cx + r * Math.cos(a), y = cy + r * Math.sin(a); W.push([px, py, x, y]); px = x; py = y; } };
  W.push([-5, 0, -5, 14]); arc(0, 14, 5, Math.PI, 0, 18); W.push([5, 14, 5, 0]);                 // the outer wall and the top arch
  W.push([4.25, 0, 4.25, 12.6]); /* the lane's gate is in ballStep */                                                                    // the shooter lane's inner wall
  W.push([-4.4, 3.9, -2.2, 2.78]); W.push([3.65, 3.9, 2.2, 2.78]);                               // the inlane guides down to the flippers
  W.push([-4.4, 3.9, -4.4, 5.3 + post]); W.push([3.65, 3.9, 3.65, 5.3 + post]);                     // the outlane posts: outside them (a narrow lane) the ball is lost
  W.push([-5, 6.6, -4.4, 5.7 + post]); W.push([4.25, 6.6, 3.65, 5.7 + post]);                       // rubbers that turn a ball off the side wall away from the outlane
  W.push([-3.6, 6.0, -3.6, 4.6], [-3.6, 4.6, -2.45, 3.85]); W.push([3.0, 6.0, 3.0, 4.6], [3.0, 4.6, 1.85, 3.85]);      // slingshot backs and bottoms
  W.push([-4.2, 9.2, -4.2, 6.8]); W.push([-5, 10.6, -4.2, 9.2]);                                    // the drop-target bank's backing, and a slope above it that turns a ball off the left wall into the table
  W.push([-3.6, 9.8, -3.6, 12.4]); W.push([-1.5, 9.8, -1.5, 11.6]);                              // the ramp's mouth (two walls; the ramp rises between)
  W.push([2.75, 11.7, 2.75, 12.9]);                                                                    // the right orbit's wall
  for (const x of [-1.1, 0.1, 1.3]) W.push([x, 15.2, x, 16.4]);                                     // the posts between the A, B, C lanes
  return W; }
const SLINGS = [{ a: [-3.6, 6.0], b: [-2.45, 3.85], side: -1 }, { a: [3.0, 6.0], b: [1.85, 3.85], side: 1 }];      // the kicking faces
const BUMPERS = [{ x: 0.6, y: 14.6, r: 0.55 }, { x: 2.0, y: 14.1, r: 0.55 }, { x: 1.2, y: 12.9, r: 0.55 }];
const DROPS = [{ x: -4.05, y: 8.7 }, { x: -4.05, y: 8.0 }, { x: -4.05, y: 7.3 }];
const LANES = [{ x: -1.7, name: 'A' }, { x: -0.5, name: 'B' }, { x: 0.7, name: 'C' }];
const MISSIONS = {
  ramp: { name: 'UP THE RAMP', need: 3, how: 'Shoot the ramp on the left, straight off a flipper' }, drops: { name: 'CLEAR THE TARGETS', need: 6, how: 'Clear the three drop targets twice, straight off a flipper' },
  lanes: { name: 'LIGHT A-B-C', need: 3, how: 'Roll through the three lanes at the top' }, orbit: { name: 'ROUND THE ORBIT', need: 2, how: 'Shoot up the right side, straight off a flipper' },
  bumpers: { name: 'POP THE BUMPERS', need: 12, how: 'Send the ball into the bumpers' }, combo: { name: 'RAMP THEN ORBIT', need: 1, how: 'The ramp, then the orbit within 10 s' },
};
const UPGRADES = [
  { id: 'save', name: 'Ball saver', desc: 'A ball lost early comes back (longer).', max: 2, cost: l => 20 + l * 30 },
  { id: 'posts', name: 'Outlane posts', desc: 'Taller posts: fewer balls slip down the sides.', max: 2, cost: l => 25 + l * 30 },
  { id: 'power', name: 'Strong flippers', desc: 'Shots go further up the table.', max: 2, cost: l => 20 + l * 25 },
  { id: 'extra', name: 'Extra ball', desc: 'Start with a fourth ball.', max: 1, cost: l => 80 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Rookie'], [40, 'Flipper'], [130, 'Wizard'], [320, 'Table king'], [700, 'Legend'], [1500, 'Hall of fame']];
const THEMES = [{ name: 'Neon Nights', a: 0xff3ab0, b: 0x3ad8ff }, { name: 'Space Station', a: 0x8a5aff, b: 0x5affc8 }, { name: 'Haunted Pier', a: 0x5aff6a, b: 0xff8a2a }, { name: 'Deep Jungle', a: 0xffd03a, b: 0x3aff8a }];
const themeOf = N => Math.floor((N - 1) / 5) % THEMES.length;
function makeCfg(N, help) {
  const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), e = easyOf(N);
  return { N, f, help: !!help, theme: themeOf(N),
    goal: Math.min(4, 2 + Math.floor((N - 1) / 8)), balls: (N <= 1 ? 5 : 4) + upLv('extra') + (help ? 1 : 0),
    grav: x(12, 13.5, 30), save: (help ? 16 : 10) + 4 * upLv('save') + e * 4, post: 0.5 + 0.35 * upLv('posts'), kick: x(1, 1.12, 30), power: 1 + 0.06 * upLv('power'),
    rampMin: x(6, 7.5, 30), drain: x(0, 0.5, 30) };
}
function missionsFor(G) { const R = G.rnd, pool = ['ramp', 'drops', 'orbit', 'ramp', 'drops', 'orbit']; if (G.N >= 6) pool.push('combo'); const out = []; while (out.length < G.cfg.goal + 3) { const m = pool[(R() * pool.length) | 0]; if (out[out.length - 1] !== m) out.push(m); } if (G.N === 1) out[0] = 'drops'; return out; }
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, theme: cfg.theme,
    walls: walls(0.8 * upLv('posts')), balls: [], left: cfg.balls, score: 0, mult: 1, done: 0, mis: null, misN: 0, list: null, drops: [1, 1, 1], lanes: [0, 0, 0], bumps: 0, rampT: -99,
    fl: [{ side: -1, a: -0.52, w: 0, up: false }, { side: 1, a: -0.52, w: 0, up: false }], saveT: 0, inPlay: 0, multi: false, coins: 0, ramps: 0, orbits: 0, best: 0, hits: {} };
  G.list = missionsFor(G); nextMission(G);
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else G.ev.push({ k: 'start' });
  serve(G); return G;
}
function nextMission(G) { const k = G.list[G.misN++ % G.list.length]; G.mis = { k, n: 0, need: MISSIONS[k].need, t: 0 }; if (k === 'drops') G.drops = [1, 1, 1]; if (k === 'lanes') G.lanes = [0, 0, 0]; G.ev.push({ k: 'mission', m: k }); }
function serve(G, again) { G.balls.push({ x: 4.62, y: 0.9, vx: 0, vy: 0, lane: true, id: (G.bid = (G.bid || 0) + 1) }); G.saveT = again ? 0 : G.cfg.save; G.inPlay = 0; }      // a saved ball gets no second saver
// ---------- your thumbs ----------
function flip(G, side, up) { const f = G.fl[side < 0 ? 0 : 1]; if (up && f.hot > 0) { if (!f.up) return; } if (f.up !== up) { f.up = up; if (up) { f.heat = (f.heat || 0) + 1; if (f.heat > 3 && !G.sim) { f.hot = 1.6; f.up = false; f.heat = 0; G.ev.push({ k: 'overheat', side }); return; } f.weak = G.t - (f.lastUp == null ? -9 : f.lastUp) < 0.3; f.lastUp = G.t; G.ev.push({ k: 'flip', side, weak: f.weak }); } } }      // a flipper pressed again too soon has not recharged: a weak flip
function launch(G) { const b = G.balls.find(q => q.lane && q.y < 1.5 && Math.abs(q.vy) < 0.1); if (!b || G.over) return false; b.vy = 24 + G.rnd() * 3; G.ev.push({ k: 'launch' }); return true; }
// ---------- the table, step by step ----------
function flTip(G, f) { const px = f.side * 2.05, py = 2.45, a = f.side < 0 ? f.a : Math.PI - f.a; return [px, py, px + FL * Math.cos(a), py + FL * Math.sin(a)]; }
function step(G, dt) {
  if (G.over) return; G.t += dt; const c = G.cfg;
  if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0 && G.lessonEnd) { G.lessonEnd = false; Object.assign(G, { balls: [], left: c.balls, score: 0, mult: 1, done: 0, misN: 0, drops: [1, 1, 1], lanes: [0, 0, 0], bumps: 0, multi: false, coins: 0, ramps: 0, orbits: 0 }); G.list = missionsFor(G); nextMission(G); serve(G); G.ev.push({ k: 'start' }); } if (G.wait > 0) return; }
  // flippers swing up fast, fall back slower
  for (const f of G.fl) { if (f.heat) f.heat = Math.max(0, f.heat - 1.2 * dt); if (f.hot > 0) { f.hot -= dt; f.up = false; }
    const tgt = f.up ? 0.5 : -0.52, sp = f.up ? (f.weak ? 5 : 26) : 16, old = f.a; f.a += clamp(tgt - f.a, -sp * dt, sp * dt); f.w = (f.a - old) / Math.max(dt, 1e-6); }
  if (G.saveT > 0 && G.inPlay > 0.5) G.saveT -= dt;
  const n = 8, h = dt / n;
  for (let s = 0; s < n; s++) for (const b of G.balls) ballStep(G, b, h);
  // drains
  for (let i = G.balls.length - 1; i >= 0; i--) { const b = G.balls[i]; if (b.y < 0.4 && !b.lane) { G.balls.splice(i, 1); drained(G, b); if (G.over) return; } }
  for (const b of G.balls) { if (!b.lane && Math.hypot(b.vx, b.vy) < 0.3) { b.still = (b.still || 0) + dt; const up = G.fl.some(f => f.up); if (b.still > (up ? 5 : 2)) { if (up) { G.fl.forEach(f => f.up = false); G.ev.push({ k: 'tired' }); } else { b.vx = (G.rnd() - 0.5) * 4; b.vy = 3; } b.still = 0; } } else b.still = 0;      // a ball held still on a flipper for 5 s is let go
    if (!b.lane) G.inPlay += dt / G.balls.length; if (b.lane && b.y < 1.0 && Math.abs(b.vy) < 0.05 && (b.wait = (b.wait || 0) + dt) > 2.5 && !G.lesson) launch(G); }
  if (G.rampRide) for (const r of G.rampRide) r.t += dt;
  if (G.blindUp && G.t > G.blindUp[0]) { flip(G, G.blindUp[1], false); G.blindUp = null; }
  if (G.lesson) lessonTick(G, dt);
}
function drained(G, b) {
  if (G.balls.length) { G.ev.push({ k: 'drainmulti' }); if (G.balls.length === 1) G.multi = false; return; }
  if (G.saveT > 0 || G.lesson) { G.ev.push({ k: 'saved' }); if (G.lesson && lessonNow(G)) { G.lesson.n = 0; G.ev.push({ k: 'lessonmiss', how: lessonNow(G).how }); } serve(G, !G.lesson); return; }
  G.left--; G.ev.push({ k: 'drain', left: G.left }); G.mult = Math.max(1, G.mult - 1);
  if (G.left <= 0) return finish(G, false); serve(G);
}
function ballStep(G, b, h) {
  const c = G.cfg; b.vy -= c.grav * h; b.x += b.vx * h; b.y += b.vy * h; b.vx *= 1 - 0.05 * h; b.vy *= 1 - 0.05 * h;
  const sp = Math.hypot(b.vx, b.vy); if (sp > 34) { b.vx *= 34 / sp; b.vy *= 34 / sp; }
  if (b.lane) { if (b.x < 4.25 + BR) b.x = 4.25 + BR; if (b.y < 0.9 && b.vy < 0) { b.y = 0.9; b.vy = 0; } if (b.y > 14.2) { b.lane = false; G.ev.push({ k: 'shot' }); } }
  // walls (and the outlane posts, a little taller with the upgrade)
  for (const w of G.walls) segHit(b, w[0], w[1], w[2], w[3], 0.45, 0);
  if (!b.lane && 0.75 * (b.y - 12.7) - (b.x - 4.25) > 0) segHit(b, 5, 13.7, 4.25, 12.7, 0.4, 0);      // the one-way gate at the top of the shooter lane: a ball in play cannot fall back down it
  // slingshots kick
  for (const sl of SLINGS) if (segHit(b, sl.a[0], sl.a[1], sl.b[0], sl.b[1], 0.6, 7 * c.kick)) { b.dirty = true; score(G, 10, 'sling'); G.ev.push({ k: 'sling', side: sl.side }); }
  for (const sl of SLINGS) { const c3 = [sl.a, sl.b, [sl.a[0], 4.6]], sg = (p, q, r) => (p[0] - r[0]) * (q[1] - r[1]) - (q[0] - r[0]) * (p[1] - r[1]), P = [b.x, b.y], d1 = sg(P, c3[0], c3[1]), d2 = sg(P, c3[1], c3[2]), d3 = sg(P, c3[2], c3[0]);
    if (!((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))) { const fx = sl.b[0] - sl.a[0], fy = sl.b[1] - sl.a[1], L = Math.hypot(fx, fy); let nx = -fy / L, ny = fx / L; if (nx * sl.side > 0) { nx = -nx; ny = -ny; } const u = clamp(((b.x - sl.a[0]) * fx + (b.y - sl.a[1]) * fy) / (L * L), 0, 1); b.x = sl.a[0] + fx * u + nx * (BR + 0.02); b.y = sl.a[1] + fy * u + ny * (BR + 0.02); b.vx = nx * 6; b.vy = ny * 6; } }      // never inside a slingshot
  // bumpers pop
  for (const bp of BUMPERS) { const dx = b.x - bp.x, dy = b.y - bp.y, d = Math.hypot(dx, dy), m = bp.r + BR; if (d < m && d > 1e-6) { const nx = dx / d, ny = dy / d; b.x = bp.x + nx * m; b.y = bp.y + ny * m; const vn = b.vx * nx + b.vy * ny; b.vx -= (1 + 0.6) * vn * nx; b.vy -= (1 + 0.6) * vn * ny; b.vx += nx * 9 * c.kick; b.vy += ny * 9 * c.kick;
      G.bumps++; b.dirty = true; score(G, 100, 'bumper'); G.ev.push({ k: 'bumper', i: BUMPERS.indexOf(bp) }); prog(G, 'bumpers'); } }
  // drop targets
  DROPS.forEach((d, i) => { if (!G.drops[i]) return; if (Math.abs(b.y - d.y) < 0.33 + BR * 0.6 && b.x - BR < d.x + 0.12 && b.x > d.x - 0.2 && b.vx < 0) { b.vx = Math.abs(b.vx) * 0.6 + 1; G.drops[i] = 0; score(G, 250, 'drop'); G.ev.push({ k: 'drop', i }); lessonSee(G, 'drop'); if (G.mis && G.mis.k === 'drops') prog(G, 'drops', b); if (!G.drops.some(q => q)) { G.ev.push({ k: 'dropsall' }); score(G, 1000, 'bank'); G.drops = [1, 1, 1]; } } });
  // the top lanes A B C
  LANES.forEach((l, i) => { if (b.y > 15.3 && b.y < 16.3 && Math.abs(b.x - l.x) < 0.45 && b.vy > 0 && !b['ln' + i]) { b['ln' + i] = 1; if (!G.lanes[i]) { G.lanes[i] = 1; score(G, 200, 'lane'); G.ev.push({ k: 'lane', i }); if (G.mis && G.mis.k === 'lanes') prog(G, 'lanes'); if (G.lanes.every(q => q)) { G.lanes = [0, 0, 0]; } } } if (b.y < 14.5) b['ln' + i] = 0; });
  // the ramp: in at its mouth going fast enough, the ball rides up and round and comes back to the right flipper
  if (b.x > -3.6 && b.x < -1.5 && b.y > 11.6 && b.y < 12.4 && b.vy > 0) { if (b.vy > c.rampMin) { b.x = 2.6; b.y = 5.2; b.vx = -1.6; b.vy = -2; G.ramps++; G.rampT = G.t; score(G, 500, 'ramp'); G.ev.push({ k: 'ramp' }); lessonSee(G, 'ramp'); prog(G, 'ramp', b); if (G.orbitT > G.t - 10) prog(G, 'combo', b); G.rampRide = [{ t: 0 }]; } else if (!b.rampMiss) { b.rampMiss = 1; G.ev.push({ k: 'rampmiss' }); } }
  if (b.y < 11) b.rampMiss = 0;
  // the orbit: up the right side past the top
  if (b.x > 2.75 && b.x < 4.25 && b.y > 12.9 && b.y < 13.5 && b.vy > 5 && !b.orb) { b.orb = 1; G.orbits++; G.orbitT = G.t; score(G, 400, 'orbit'); G.ev.push({ k: 'orbit' }); prog(G, 'orbit', b); if (G.rampT > G.t - 10) prog(G, 'combo', b); }
  if (b.y < 10) b.orb = 0;
  // flippers
  for (const f of G.fl) { const [x1, y1, x2, y2] = flTip(G, f); flipHit(G, b, f, x1, y1, x2, y2); }
  // the outlanes: below the posts, out at the side, the ball is lost (the post upgrade narrows them)
  if (!b.lane && b.y < 3.9 && (b.x < -4.4 || b.x > 3.65)) { if (!b.out) { b.out = 1; G.ev.push({ k: 'outlane' }); } if (b.y < 3.0) b.y = -1; }
}
// a ball against a straight wall (restitution e; kick: an extra push straight off the wall)
function segHit(b, x1, y1, x2, y2, e, kick) { const dx = x2 - x1, dy = y2 - y1, L2 = dx * dx + dy * dy, u = clamp(((b.x - x1) * dx + (b.y - y1) * dy) / L2, 0, 1), px = x1 + dx * u, py = y1 + dy * u, ex = b.x - px, ey = b.y - py, d = Math.hypot(ex, ey);
  if (d >= BR || d < 1e-9) return false; const nx = ex / d, ny = ey / d; b.x = px + nx * BR; b.y = py + ny * BR; const vn = b.vx * nx + b.vy * ny; if (vn >= 0) return false;
  b.vx -= (1 + e) * vn * nx; b.vy -= (1 + e) * vn * ny; if (kick && -vn > 1.5) { b.vx += nx * kick; b.vy += ny * kick; return true; } return false; }
// a ball against a flipper, which may be swinging: the flipper's own speed where it meets the ball is passed on
function flipHit(G, b, f, x1, y1, x2, y2) { const dx = x2 - x1, dy = y2 - y1, L2 = dx * dx + dy * dy, u = clamp(((b.x - x1) * dx + (b.y - y1) * dy) / L2, 0, 1), px = x1 + dx * u, py = y1 + dy * u, rr = 0.2 - 0.09 * u, ex = b.x - px, ey = b.y - py, d = Math.hypot(ex, ey), m = BR + rr;
  if (d >= m || d < 1e-9) return; const nx = ex / d, ny = ey / d; b.x = px + nx * m; b.y = py + ny * m;
  const w = (f.side < 0 ? f.w : -f.w) * G.cfg.power, rx = px - f.side * 2.05, ry = py - 2.45, svx = -w * ry, svy = w * rx;      // the surface's speed at the touch
  const rvx = b.vx - svx, rvy = b.vy - svy, vn = rvx * nx + rvy * ny; if (vn >= 0) return; const e = Math.abs(f.w) > 2 ? 0.35 : 0.2;
  b.vx = rvx - (1 + e) * vn * nx + svx; b.vy = rvy - (1 + e) * vn * ny + svy;
  if (Math.abs(f.w) > 7 && f.up) {      // a real flip: where the ball meets the flipper sets where it goes (near the pivot: up your own side; near the tip: across)
    const deg = f.side < 0 ? 118 - 73 * u : 62 + 73 * u, a = deg * Math.PI / 180, v = 22 * G.cfg.power; b.vx = Math.cos(a) * v; b.vy = Math.sin(a) * v;
    G.ev.push({ k: 'hit', side: f.side, u }); b.hitT = G.t; b.dirty = false; } }
function score(G, p, why) { G.score += p * G.mult; G.best = Math.max(G.best, G.score); }
function prog(G, k, b) { const m = G.mis; if (!m || m.k !== k) return; if (b && !(b.hitT > G.t - 1.6 && !b.dirty)) { G.ev.push({ k: 'notclean', m: k }); return; } m.n++; m.t = 0; G.ev.push({ k: 'prog', m: k, n: m.n, need: m.need }); if (m.n >= m.need) { G.done++; G.mult = Math.min(6, G.mult + 1); G.coins += 3; score(G, 2500, 'mission'); G.ev.push({ k: 'missiondone', m: k, done: G.done });
    if (G.done >= G.cfg.goal && !G.lesson) return finish(G, true);
    if (G.done === 2) { G.left++; G.ev.push({ k: 'extraball' }); }
    G.saveT = Math.max(G.saveT, 6); G.inPlay = 1;      // a mission done relights the ball saver for a moment
    if (G.done % 3 === 0 && !G.multi) { G.multi = true; G.multiSeen = true; serve(G); G.ev.push({ k: 'multiball' }); launch(G); }
    nextMission(G); } }
function finish(G, win) { G.over = win ? 'won' : 'lost'; const stars = win ? (G.left >= G.cfg.balls ? 3 : G.left >= G.cfg.balls - 1 ? 2 : 1) : 0;
  G.res = { win, stars, score: G.score, done: G.done, goal: G.cfg.goal, left: G.left, ramps: G.ramps, orbits: G.orbits, coins: G.coins + Math.floor(G.score / 2000) + (win ? 4 + Math.ceil(G.N / 3) : 0), mis: G.mis && G.mis.k, misN: G.mis && G.mis.n, misNeed: G.mis && G.mis.need };
  G.ev.push({ k: win ? 'won' : 'lost' }); return true; }
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'keep', title: 'FLIP', how: 'Hold the left side of the screen for the left flipper, the right side for the right. Hit the ball up the table 6 times without losing it.', need: 6 }],
  2: [{ id: 'drop', title: 'AIM', how: 'Flip late to send the ball up its own side, early to send it across. Knock down three drop targets (on the left).', need: 3 }],
  3: [{ id: 'ramp', title: 'THE RAMP', how: 'Catch the ball on the right flipper (hold it up), let it roll, flip: up the ramp on the left. Once.', need: 1 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0, t: 0 }; G.ev.push({ k: 'lessonnext', first: true }); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonTick(G, dt) { const st = lessonNow(G); if (!st || st.id !== 'keep') return; for (const b of G.balls) { if (b.hitT > G.t - 0.05 && !b.counted && !b.lane) { b.counted = true; b.upT = G.t; } if (b.counted && b.y > 8 && b.upT) { b.upT = 0; lessonSee(G, 'keep'); } if (b.y < 5 && b.vy < 0) b.counted = false; } }
function lessonSee(G, what) { const st = lessonNow(G); if (!st || st.id !== what) return; G.lesson.n++; if (G.lesson.n < st.need) { G.ev.push({ k: 'lessonok', n: G.lesson.n, need: st.need }); return; } lessonNext(G); }
function lessonNext(G) { G.lesson.i++; G.lesson.n = 0; G.lesson.t = 0; if (G.lesson.i >= G.lesson.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.lessonEnd = true; G.wait = 1.4; } }
// ---------- for the robots ----------
// BLIND: thumbs that do not look: a quick flip of either side (or both), holding one up, letting go
const BLIND = { l: G => { flip(G, -1, true); G.blindUp = [G.t + 0.12, -1]; launch(G); }, r: G => { flip(G, 1, true); G.blindUp = [G.t + 0.12, 1]; launch(G); }, h: G => { const s = Math.random() < 0.5 ? -1 : 1; flip(G, s, !G.fl[s < 0 ? 0 : 1].up); } };
// a player who looks: watches the ball come down to a flipper and flips when that sends it at the mission's target (it can see
// where a flip now would send the ball: a short look ahead, as a player's feel does), otherwise flips at the last moment to save it
function cloneG(G) { return { cfg: G.cfg, walls: G.walls, fl: G.fl.map(f => Object.assign({}, f)), balls: [], drops: G.drops.slice(), lanes: G.lanes.slice(), t: G.t, rnd: G.rnd, ev: [], mis: G.mis ? Object.assign({}, G.mis) : null, rampT: G.rampT, orbitT: G.orbitT, score: 0, mult: 1, best: 0, bumps: 0, ramps: 0, orbits: 0, done: 0, list: G.list, misN: G.misN, sim: true, coins: 0 }; }
// try a flip after d frames: where does the ball go in the next second and a half?
function tryFlip(G, b, side, d, secs) { const S = cloneG(G), q = Object.assign({}, b); S.balls = [q]; for (const f of S.fl) f.up = false; const hits = {}; let top = q.y, low = false;
  for (let i = 0; i < secs * 60; i++) { const fl = S.fl[side < 0 ? 0 : 1]; fl.up = side !== 0 && i >= d && i < d + 12; for (const f of S.fl) { const tg = f.up ? 0.5 : -0.52, sp = f.up ? 26 : 16, old = f.a; f.a += clamp(tg - f.a, -sp / 60, sp / 60); f.w = (f.a - old) * 60; }
    for (let s = 0; s < 8; s++) ballStepSim(S, q, 1 / 480); for (const e of S.ev) if (!(q.dirty && (e.k === 'ramp' || e.k === 'orbit' || e.k === 'drop'))) hits[e.k] = 1; S.ev.length = 0; top = Math.max(top, q.y); if (q.y < 1.0 || (q.x < -4.4 || q.x > 3.65) && q.y < 3.9) { low = true; break; } }
  return { hits, low, top }; }
function ballStepSim(S, b, h) { S.mis = S.mis ? Object.assign({}, S.mis, { need: 1e9 }) : null; ballStep(S, b, h); }
// a player who looks: as the ball comes down to a flipper, picks the moment to flip that sends it at the mission's target (a
// player's feel for the table: here, trying the moments in a quick look ahead), or failing that the highest safe shot; then
// flips at that moment, a little early or late as a thumb is
function lookHold(G, b, side, secs) { const S = cloneG(G), q = Object.assign({}, b); S.balls = [q]; for (const f of S.fl) f.up = f.side === side;
  for (let t = 0; t < secs; t += 1 / 60) { for (const f of S.fl) { const tg = f.up ? 0.5 : -0.52, sp = 26, old = f.a; f.a += clamp(tg - f.a, -sp / 60, sp / 60); f.w = (f.a - old) * 60; } for (let s = 0; s < 8; s++) ballStepSim(S, q, 1 / 480); S.ev.length = 0; if (q.y < 1.3) return false; }
  return Math.hypot(q.vx, q.vy) < 1.2 && q.y < 4.2; }
function bestShot(G, b, side, want, maxD) { let best = null, bs = -1e9;
  for (let d = 0; d <= maxD; d++) { const r = tryFlip(G, b, side, d, 2.2); if (r.low && !r.hits[want]) continue; const sc = (r.hits[want] ? 100 : 0) + (r.hits.ramp || r.hits.orbit || r.hits.drop ? 8 : 0) + (r.top > 13 ? r.top : r.top * 0.3) - d * 0.01; if (sc > bs) { bs = sc; best = d; } }
  return best; }
// a player who looks: catches the ball on a raised flipper when it can, lets it roll and shoots at the moment that sends it at
// the mission's target (a player's feel: here, trying the moments in a quick look ahead); otherwise hits it at the best moment
// as it comes down; a thumb is a little early or late
function honest(G, o, mem) {
  const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random;
  if (G.over || G.wait > 0) { flip(G, -1, false); flip(G, 1, false); return; }
  for (const b of G.balls) if (b.lane && b.y < 1 && Math.abs(b.vy) < 0.05) { launch(G); return; }
  if (mem.plan) { const p = mem.plan; if (G.t >= p.at && !p.done) { flip(G, p.side, true); p.done = true; p.off = G.t + 0.2; } if (p.done && G.t >= p.off) { flip(G, p.side, false); mem.plan = null; mem.cool = G.t + 0.3; } return; }
  if (G.t < (mem.cool || 0)) return;
  const ls = lessonNow(G), want = ls && ls.id !== 'keep' ? ls.id : { ramp: 'ramp', drops: 'drop', lanes: 'lane', orbit: 'orbit', bumpers: 'bumper', combo: G.t - G.rampT < 10 ? 'orbit' : 'ramp' }[G.mis ? G.mis.k : 'ramp'] || 'ramp';
  const err = () => (R() < acc ? 0.4 : 1.6) * (R() * 2 - 1) * react * 6;
  // cradled: let it roll, shoot
  if (mem.hold != null) { const side = mem.hold, f = G.fl[side < 0 ? 0 : 1], b = G.balls.find(q => !q.lane && Math.abs(q.x - side * 1.6) < 1.6 && q.y < 4.2);
    if (!b || !f.up) { mem.hold = null; return; } if (Math.hypot(b.vx, b.vy) > 1.2) return; if ((mem.settle = (mem.settle || 0) + 1) < 12 + react * 20) return; mem.settle = 0;
    const d = bestShot(G, b, side, want, 45); flip(G, side, false); mem.hold = null; mem.plan = { side, at: G.t + Math.max(0.02, ((d == null ? 10 : d) + err()) / 60) }; return; }
  const b = G.balls.filter(q => !q.lane && q.vy < 2 && q.y < 6.5 && q.y > 1.2 && Math.abs(q.x) < 4).sort((p, q) => p.y - q.y)[0]; if (!b) return;
  const side = b.x < 0 ? -1 : 1, wait = tryFlip(G, b, 0, 0, 1.2); if (!wait.low) return;
  if (G.balls.length === 1 && R() < acc && lookHold(G, b, side, 1.0)) { flip(G, side, true); mem.hold = side; mem.settle = 0; return; }      // catch it
  const d = bestShot(G, b, side, want, 36); mem.plan = { side, at: G.t + Math.max(0, ((d == null ? 6 : d) + err())) / 60 };
}
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.done = G.cfg.goal; finish(G, true); }
