// ===================== RULES: Drone Pilot (game 21) =====================
// Fly a racing drone through a course of hoops in a park in 3D, seen from just behind it. Two sticks, as on a real drone's
// controller: the left thumb climbs and sinks (up, down) and turns (left, right); the right thumb flies forwards and back (up,
// down) and slides sideways (left, right). The drone carries its speed (it drifts), the wind pushes it, and each hoop gives
// back a few seconds. Thread the hoops in order; touch a rim, a tree, a wall or the ground hard and it crashes (back to the
// last hoop). Out of time, or three crashes, and the run is over.
// World: metres; x across, y up, z forwards from the start (the course runs towards +z).

const RULES = [
  '<b>One thumb.</b> Hold it down anywhere and the drone flies forwards. Slide left or right to turn, up to climb, down to sink.',
  '<b>Lift your thumb</b> and the drone levels out and brakes to a hover.',
  '<b>Fly through the glowing hoop</b>, then the next. Each hoop gives back a few seconds.',
  'The drone drifts and the wind pushes it: ease off early. Touch a rim, a tree or a wall and it crashes.',
  'Three crashes, or the clock at zero, and the run is over.',
];
function groundH(x, z) { return Math.sin(x * 0.03) * 1.2 + Math.cos(z * 0.025 + 1) * 1.4 + Math.sin((x + z) * 0.011) * 2 - 1.2; }
const WEATHERS = ['morning', 'golden', 'noon', 'overcast', 'sunset', 'rain', 'mist', 'dusk', 'storm', 'dawn'];
function weatherOf(N) { if (N <= 3) return ['morning', 'noon', 'golden'][N - 1]; const R = rng(N * 1907 + 5); R(); return WEATHERS[(R() * WEATHERS.length) | 0]; }

function makeCfg(N, help) {
  const f = curve(N), e = easyOf(N), boss = N % 10 === 0, x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s));
  return { N, f, e, boss, help: !!help, lives: 3,
    hoops: N <= 2 ? 5 : Math.round(x(5, 15, 40)) + (boss ? 2 : 0),      // 23 Nov 2026, his note: "As long as it gets more challenging as the levels go up": far levels push on further (smaller hoops, stronger gusts, more moving hoops, more trees, less time)
    gapZ: x(20, 26, 30), side: x(8, 26, 35), rise: N <= 1 ? 0 : x(1.5, 9, 35),     // how far apart, how far across, how far up and down
    radius: x(2.4, 1.1, 40) * (help ? 1.12 : 1),
    wind: N < 4 ? 0 : x(0, 3.8, 40), gust: N < 4 ? 0 : x(0, 3.2, 40),
    moving: N >= 12 ? x(0, 0.7, 40) : 0,                                     // share of hoops that slide to and fro
    trees: Math.round(x(10, 55, 40)),
    start: x(26, 14, 40) * (help ? 1.3 : 1), bonus: x(7.5, 4.0, 40) * (help ? 1.2 : 1),
    vmax: 11, climb: 5, yawR: 1.9, drag: 1.5 };
}
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0, R = rng(seed);
  const G = { N, cfg, seed, rnd: R, t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null,
    weather: weatherOf(N), hoops: [], trees: [], walls: [], next: 0, lives: cfg.lives, crashes: 0, clock: cfg.start, in: { thr: 0, yaw: 0, pitch: 0, roll: 0 },
    d: { x: 0, y: 2.5 + Math.max(0, groundH(0, 0)), z: 0, vx: 0, vy: 0, vz: 0, yaw: 0, tilt: 0, bank: 0 }, respawn: 0, windA: R() * TAU, streak: 0, bestStreak: 0, clean: 0, best: 0 };
  makeCourse(G);
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G);
  return G;
}
function makeCourse(G, only) {
  const c = G.cfg, R = G.rnd, L = lessonNow(G), n = L ? L.hoops : c.hoops; G.hoops = []; let x = 0, y = 3, z = 0, dir = 0;
  for (let i = 0; i < n; i++) {
    z += c.gapZ * (0.8 + R() * 0.4) * (L ? 0.8 : 1);
    const sideW = L && L.id === 'climb' ? c.side * 0.3 : c.side; x = L && L.flat ? (i % 2 ? -1 : 1) * (6 + R() * 4) : clamp(x + (R() < 0.5 ? -1 : 1) * sideW * (0.5 + R() * 0.5), -40, 40);
    y = clamp((L && L.flat) ? 3 : y + (R() - 0.5) * 2 * (L && L.id === 'climb' ? 5 : c.rise), 2.5, 16);
    const prev = G.hoops[i - 1] || { x: 0, y: 3, z: 0 }, yaw = Math.atan2(x - prev.x, z - prev.z) * 0.7;
    G.hoops.push({ x, y: y + Math.max(0, groundH(x, z)), z, yaw, r: c.radius * (L ? 1.15 : 1), x0: x, mv: !L && R() < c.moving ? 2 + R() * 3 : 0, ph: R() * TAU, done: false });
  }
  // trees and a few walls, kept off the line of flight
  G.trees = []; G.walls = [];
  const near = (px, pz, d) => G.hoops.some((h, i) => { const p = G.hoops[i - 1] || { x: 0, z: 0 }; const dx = h.x - p.x, dz = h.z - p.z, L2 = dx * dx + dz * dz || 1, t = clamp(((px - p.x) * dx + (pz - p.z) * dz) / L2, 0, 1); return Math.hypot(px - p.x - dx * t, pz - p.z - dz * t) < d; });
  const zEnd = (G.hoops[G.hoops.length - 1] || { z: 100 }).z + 20;
  for (let i = 0, tries = 0; i < c.trees && tries < 400; tries++) { const tx = (R() - 0.5) * 120, tz = R() * zEnd; if (near(tx, tz, 7) || Math.hypot(tx, tz) < 8) continue; G.trees.push({ x: tx, z: tz, h: 7 + R() * 8, r: 0.6 + R() * 0.4, crown: 2 + R() * 1.4 }); i++; }
  if (!L) for (let i = 0, tries = 0; i < Math.round(c.f / 8) && tries < 100; tries++) { const wx = (R() - 0.5) * 80, wz = 20 + R() * zEnd, w = 6 + R() * 10, h = 4 + R() * 8; if (near(wx, wz, 6 + w / 2)) continue; G.walls.push({ x: wx, z: wz, w, d: 4 + R() * 6, h }); i++; }
}
// ---------- the thumbs ----------
// coord (22 Nov 2026, one-thumb flying): the drone flies where it points; sideways drift from turns and wind is trimmed out for you,
// because one thumb has no way to slide sideways. The robots fly all four axes without it.
function sticks(G, thr, yaw, pitch, roll, coord) { const I = G.in; I.thr = clamp(thr, -1, 1); I.yaw = clamp(yaw, -1, 1); I.pitch = clamp(pitch, -1, 1); I.roll = clamp(roll, -1, 1); I.coord = !!coord; }
// ---------- every frame ----------
function hoopPos(G, h) { return { x: h.x0 + (h.mv ? Math.sin(G.t * 0.8 + h.ph) * h.mv : 0), y: h.y, z: h.z }; }
function step(G, dt) {
  if (G.over) return; G.t += dt; const c = G.cfg, d = G.d, I = G.in, L = lessonNow(G);
  for (const h of G.hoops) h.x = hoopPos(G, h).x;
  if (G.down > 0) { G.down -= dt; d.vx *= 1 - 1.5 * dt; d.vz *= 1 - 1.5 * dt; d.vy -= 9.8 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.z += d.vz * dt; const gy = groundH(d.x, d.z) + 0.15; if (d.y < gy) { d.y = gy; d.vy = Math.abs(d.vy) * 0.2; d.vx *= 0.5; d.vz *= 0.5; } d.tilt += d.spin * dt; d.bank += d.spin * 0.7 * dt;      // 23 Nov 2026: a crash is seen: the drone bounces off, tumbles and falls (it used to jump at once to the restart spot)
    if (G.down <= 0) { Object.assign(d, G.backTo); G.respawn = 0.6; G.ev.push({ k: 'back' }); } return; }
  if (G.respawn > 0) { G.respawn -= dt; return; }
  if (!L) { G.clock -= dt; if (G.clock <= 0) { G.clock = 0; finish(G, false, 'time'); return; } }
  // the sticks: angle mode (the drone holds level when you let go), with momentum
  d.yaw += I.yaw * c.yawR * dt;
  const fwd = I.pitch * c.vmax, side = I.roll * c.vmax * 0.75, s = Math.sin(d.yaw), co = Math.cos(d.yaw);
  const tvx = s * fwd + co * side, tvz = co * fwd - s * side, k1 = Math.min(1, c.drag * dt);
  const gust = c.gust * Math.sin(G.t * 0.7 + G.windA) * Math.sin(G.t * 0.23), wx = Math.sin(G.windA) * (c.wind + gust), wz = Math.cos(G.windA) * (c.wind + gust) * 0.4;
  d.vx += (tvx - d.vx) * k1 + wx * dt * 0.6; d.vz += (tvz - d.vz) * k1 + wz * dt * 0.6; d.vy += (I.thr * c.climb - d.vy) * Math.min(1, dt * 3);
  if (I.coord) { const vs = d.vx * co - d.vz * s, kk = Math.min(1, dt * 4); d.vx -= co * vs * kk; d.vz += s * vs * kk; }
  d.tilt += (I.pitch * 0.35 - d.tilt) * Math.min(1, dt * 6); d.bank += (-I.roll * 0.35 - I.yaw * 0.12 - d.bank) * Math.min(1, dt * 6);
  const px = d.x, py = d.y, pz = d.z; d.x += d.vx * dt; d.y += d.vy * dt; d.z += d.vz * dt;
  // the ground, trees, walls
  const gy = groundH(d.x, d.z) + 0.35; if (d.y < gy) { if (d.vy < -3.5) { crash(G, 'ground'); return; } d.y = gy; d.vy = Math.max(0, d.vy); }
  if (d.y > 30) { d.y = 30; d.vy = Math.min(0, d.vy); }
  for (const t of G.trees) { const dd = Math.hypot(d.x - t.x, d.z - t.z); if (dd > 6) continue; const ty = d.y - groundH(t.x, t.z); if ((ty < t.h * 0.45 && dd < t.r + 0.3) || (ty >= t.h * 0.3 && ty < t.h + 0.5 && dd < t.crown * (1 - (ty - t.h * 0.3) / (t.h * 0.75)) + 0.2)) { crash(G, 'tree'); return; } }
  for (const w of G.walls) if (Math.abs(d.x - w.x) < w.w / 2 + 0.3 && Math.abs(d.z - w.z) < w.d / 2 + 0.3 && d.y < groundH(w.x, w.z) + w.h + 0.2) { crash(G, 'wall'); return; }
  // the next hoop: through its middle, or into its rim
  const h = G.hoops[G.next]; if (h) {
    const nx = Math.sin(h.yaw), nz = Math.cos(h.yaw), s0 = (px - h.x) * nx + (pz - h.z) * nz, s1 = (d.x - h.x) * nx + (d.z - h.z) * nz;
    if (s0 < 0 && s1 >= 0) { const t = s0 / (s0 - s1), ix = px + (d.x - px) * t, iy = py + (d.y - py) * t, iz = pz + (d.z - pz) * t, off = Math.hypot(ix - h.x, iy - h.y, iz - h.z);
      if (off < h.r - 0.25) { h.done = true; G.next++; G.streak++; G.bestStreak = Math.max(G.bestStreak, G.streak); if (off < h.r * 0.35) G.clean++; G.clock += c.bonus; G.ev.push({ k: 'hoop', n: G.next, of: G.hoops.length, clean: off < h.r * 0.35, streak: G.streak }); lessonSee(G, 'hoop');
        if (G.next >= G.hoops.length) { if (G.lesson) { lessonSee(G, 'course'); } else { finish(G, true); return; } } }
      else if (off < h.r + 0.45) { crash(G, 'rim'); return; } }
    // the hoop's rim, side-on
    const along = (d.x - h.x) * nx + (d.z - h.z) * nz; if (Math.abs(along) < 0.35) { const off = Math.hypot(d.x - h.x - nx * along, d.y - h.y, d.z - h.z - nz * along); if (Math.abs(off - h.r) < 0.32) { crash(G, 'rim'); return; } }
  }
}
function crash(G, why) {
  const d = G.d; G.streak = 0; G.ev.push({ k: 'crash', why, x: d.x, y: d.y, z: d.z });
  if (G.lesson) lessonMiss(G, why); else { G.crashes++; G.lives--; if (G.lives <= 0) { finish(G, false, 'crashes'); return; } }
  // back to just before the hoop it was heading for, facing it
  const h = G.hoops[G.next], p = G.hoops[G.next - 1] || { x: 0, y: 3, z: 0 }; const tx = h ? h.x : 0, tz = h ? h.z : 10;
  const bx = p.x + (tx - p.x) * 0.25, bz = p.z + (tz - p.z) * 0.25; G.backTo = { x: bx, z: bz, y: h ? h.y : 3, vx: 0, vy: 0, vz: 0, yaw: Math.atan2(tx - bx, tz - bz), tilt: 0, bank: 0 };
  d.vx *= -0.35; d.vz *= -0.35; d.vy = Math.min(d.vy, 0) * 0.5; d.spin = (G.rnd() < 0.5 ? -1 : 1) * (5 + G.rnd() * 4); G.down = 1.1;      // it bounces back off what it hit and falls; the view goes dark, then it is put back
}
function finish(G, win, why) {
  G.over = win ? 'won' : 'lost';
  const t = Math.round(G.clock * 10) / 10; G.res = { win, why, stars: win ? (G.crashes === 0 && G.clean >= G.hoops.length * 0.5 ? 3 : G.crashes === 0 ? 2 : 1) : 0, hoops: G.next, of: G.hoops.length, crashes: G.crashes, left: t, combo: win ? Math.round(G.clock) : 0, time: G.t };
  G.ev.push({ k: win ? 'won' : 'lost', why });
}
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'fly', title: 'FORWARDS AND TURN', say: G => droneCue(G)[0], do: G => droneCue(G)[1], at: G => droneCue(G)[2], how: 'Hold your thumb down: the drone flies forwards. Slide it left or right to turn. Fly through the glowing hoops, three of them.', need: 3, ok: w => w === 'hoop', hoops: 3, flat: true }],
  2: [{ id: 'climb', title: 'UP AND DOWN', say: G => droneCue(G)[0], do: G => droneCue(G)[1], at: G => droneCue(G)[2], how: 'These hoops are high and low. Slide your thumb up to climb, down to sink. Three hoops.', need: 3, ok: w => w === 'hoop', hoops: 3 }],
  3: [{ id: 'slide', title: 'LIFT TO BRAKE', say: G => droneCue(G)[0], do: G => droneCue(G)[1], at: G => droneCue(G)[2], how: 'Lift your thumb and the drone brakes to a hover. It drifts: lift early before a tight hoop, line up, then hold again. Four hoops.', need: 4, ok: w => w === 'hoop', hoops: 4 }],
};
// THE TUTORIAL SHOWS WHICH WAY TO SLIDE, NOW (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing happens"). The hand
// slid left and right in a box for ever. Now the robot is asked how it would steer (dryPlan) and the hand holds and slides that way: HOLD TO
// FLY when straight on, SLIDE RIGHT / LEFT to turn, SLIDE UP / DOWN to climb or sink, LET GO TO STOP when the hoop is sharply to the side.
function droneCue(G) { const h = G.hoops[G.next]; if (G.over || !h || G.respawn > 0 || G.down > 0) return ['WAIT…', 'wait', false];
  const P = dryPlan(G); if (!P) return ['HOLD TO FLY', 'hold', [W / 2, H * 0.68]]; const [, climb, yaw, pitch] = P, r = 54 * k;
  if (pitch < 0.2 && G.lesson && G.lesson.steps[G.lesson.i].id === 'slide') return ['LET GO TO STOP', 'release', [W / 2, H * 0.68]];
  const dx = -yaw * r * 0.8, dy = -climb * r * 0.8; if (Math.abs(dx) < 0.15 * r && Math.abs(dy) < 0.15 * r) return [ui.sticks.L ? 'KEEP HOLDING' : 'HOLD TO FLY', 'hold', [W / 2, H * 0.68]];
  const word = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'SLIDE RIGHT' : 'SLIDE LEFT') : (dy < 0 ? 'SLIDE UP' : 'SLIDE DOWN'); return [word, 'drag', [W / 2, H * 0.68, W / 2 + dx, H * 0.68 + dy]]; }
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0, miss: 0 }; makeCourse(G); G.ev.push({ k: 'lessonnext', first: true }); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonSee(G, what) {
  const D = G.lesson; if (!D) return; const st = D.steps[D.i]; if (!st.ok(what)) return;
  D.n++; if (D.n < st.need) { G.ev.push({ k: 'lessonok', n: D.n, need: st.need }); return; }
  D.i++; D.n = 0; D.miss = 0;
  if (D.i >= D.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); resetRun(G); }
  else { G.ev.push({ k: 'lessonnext' }); resetRun(G); }
}
function resetRun(G) { Object.assign(G, { down: 0, next: 0, lives: G.cfg.lives, crashes: 0, clock: G.cfg.start, streak: 0, bestStreak: 0, clean: 0 }); Object.assign(G.d, { x: 0, y: 2.5 + Math.max(0, groundH(0, 0)), z: 0, vx: 0, vy: 0, vz: 0, yaw: 0, tilt: 0, bank: 0 }); makeCourse(G); G.respawn = 0.8; G.ev.push({ k: 'course' }); }
function lessonMiss(G, why) { const D = G.lesson; if (!D) return; D.miss++; G.ev.push({ k: 'lessonmiss', why, how: D.steps[D.i].how }); }

// ---------- for the robots ----------
// BLIND: sticks pushed without looking: each a held position (a corner, a middle, let go)
const BLIND = {
  f: G => sticks(G, 0, 0, 1, 0), c: G => sticks(G, 1, 0, 0.6, 0), s: G => sticks(G, -1, 0, 0.6, 0), l: G => sticks(G, 0, -1, 0.7, 0), r: G => sticks(G, 0, 1, 0.7, 0),
  a: G => sticks(G, 0, 0, 0.7, -1), b: G => sticks(G, 0, 0, 0.7, 1), z: G => sticks(G, 0, 0, 0, 0),
};
// a pilot who looks: aims for a point just in front of the next hoop, then through its middle; eases off before it
function honest(G, o, mem) {
  const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, c = G.cfg, d = G.d, h = G.hoops[G.next];
  if (!h || G.respawn > 0 || G.down > 0) { ACT.sticks(G, 0, 0, 0, 0); return; }
  if (G.t < (mem.next || 0)) return; mem.next = G.t + 0.05 + react * 0.25;
  const nx = Math.sin(h.yaw), nz = Math.cos(h.yaw), along = (d.x - h.x) * nx + (d.z - h.z) * nz, lead = clamp(-along * 0.45, 0, 9);
  const n = (1 - acc), j = () => (Math.random() - 0.5) * 2 * n;
  const ax = h.x - nx * lead + j() * 1.5, az = h.z - nz * lead, ay = h.y + j() * 1.2;
  const want = Math.atan2(ax - d.x, az - d.z); let err = want - d.yaw; while (err > Math.PI) err -= TAU; while (err < -Math.PI) err += TAU;
  const dist = Math.hypot(ax - d.x, az - d.z), s = Math.sin(d.yaw), co = Math.cos(d.yaw), vf = d.vx * s + d.vz * co, vs = d.vx * co - d.vz * s;
  const lat = (ax - d.x) * co - (az - d.z) * s, wantV = clamp(dist * 0.9, 3, c.vmax * (0.55 + acc * 0.4));
  const pitch = Math.abs(err) > 0.8 ? 0.1 : clamp((wantV - vf) * 0.35 + 0.5, -1, 1);
  ACT.sticks(G, clamp((ay - d.y) * 0.9 - d.vy * 0.25, -1, 1), clamp(err * 2.2, -1, 1), pitch, clamp(lat * 0.35 - vs * 0.25, -1, 1));
}
function winNow(G) { if (!G || G.over) return; G.down = 0; G.lesson = null; G.next = G.hoops.length - 1; G.lives = G.cfg.lives; G.clock = Math.max(G.clock, 10); const h = G.hoops[G.next]; Object.assign(G.d, { x: h.x - Math.sin(h.yaw) * 1.2, y: h.y, z: h.z - Math.cos(h.yaw) * 1.2, vx: Math.sin(h.yaw) * 6, vy: 0, vz: Math.cos(h.yaw) * 6, yaw: h.yaw }); G.respawn = 0; sticks(G, 0, 0, 0.6, 0); }

// what the robot would do now, without doing it (tools/dry_plan.py): the tutorial shows this move
const ACT_REAL = { sticks }; let ACT = ACT_REAL;
function dryPlan(G, o, mem) { let got = null; const rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { if (!got && !(a.length > 2 && a.slice(1).every(v => v === 0 || v === false))) got = [n, ...a.slice(1)]; return true; };      /* (a stick at rest, all its numbers 0, is not a move; a first bed, number 0, is) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return got; }
