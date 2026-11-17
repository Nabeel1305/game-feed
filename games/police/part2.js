// ===================== RULES: Police Chase (game 14) =====================
// Three parts, one chase:
//   DRIVE: down a one-way avenue at night, lights and siren. Hold the left side of the screen to steer left, the right side to
//          steer right, both to brake. Weave through the traffic and ram the getaway car's BACK CORNER from the side (a PIT):
//          it spins. Enough spins and he crashes and runs. Hit traffic and you lose a life; fall too far behind and he is gone.
//   FOOT:  after him down an alley, running by yourself. Swipe left or right to change lane round crates and bins, up to jump a
//          fence, down to slide under a pipe. Close in and tap to tackle him: too far and you dive at air.
//   CUFF:  he fights to break free. When his shoulders twist one way, swipe the other way to hold him. Hold him enough times
//          and the cuffs are on.
// World: metres; x across (right +), s along the street (ahead +).

const RULES = [
  '<b>Drive:</b> hold the left side to steer left, the right side to steer right, both to brake.',
  '<b>Ram his back corner</b> from the side to spin him (a PIT). Straight into his bumper does nothing. Miss the traffic.',
  '<b>On foot:</b> swipe left or right round crates, up over fences, down under pipes. You run by yourself.',
  '<b>Tap to tackle</b> when you are right behind him. Too far and you dive at air.',
  '<b>Cuff him:</b> when he twists one way, swipe the other way to hold him down.',
  'Three lives: a crash or letting him break free costs one. Fall too far behind and he gets away.',
];
const WEATHERS = ['night', 'rain', 'dusk', 'storm', 'night', 'overcast', 'mist', 'night', 'golden'];
function weatherOf(N) { if (N <= 2) return ['night', 'rain'][N - 1]; const R = rng(N * 7001 + 1); R(); return WEATHERS[(R() * WEATHERS.length) | 0]; }
const LANES = [-5.25, -1.75, 1.75, 5.25], HALF = 7, ALLEY = [-1.3, 0, 1.3];

function makeCfg(N, help) {
  const f = curve(N), e = easyOf(N), boss = N % 10 === 0, x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s));
  return { N, f, e, boss, help: !!help, lives: 3,
    vmax: x(28, 34, 35), crookV: x(0.86, 0.91, 35),                 // your top speed (m/s); his, as a share of it
    pits: N <= 2 ? 1 : Math.min(4, 1 + Math.round(x(0, 3, 25))) + (boss ? 1 : 0),
    traffic: x(0.01, 0.022, 35) * (1 - 0.4 * e),                   // cars per metre of avenue
    cross: N >= 4 ? x(0.2, 0.5, 30) : 0,                            // chance a car crosses at a junction
    escape: x(170, 150, 35) + 30 * e,                                // he is gone if this far ahead (m)
    footLen: x(230, 380, 30), footGap: 12, run: 8.2, crookRun: x(6.5, 7.4, 30),
    obst: x(0.05, 0.11, 30) * (1 - 0.3 * e),                        // obstacles per metre of alley
    tackle: (x(2.8, 2.0, 25) + 0.5 * e) * (help ? 1.2 : 1),          // how close you must be to tackle (m)
    holds: Math.min(5, 2 + Math.round(x(1, 3, 25))), tell: (x(0.6, 0.3, 25) + 0.15 * e) * (help ? 1.2 : 1), hold: x(0.7, 0.45, 25) + 0.15 * e };
}
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null,
    weather: weatherOf(N), ph: 'drive', ph_t: 0, lives: cfg.lives, crashes: 0, pitN: 0, stumbles: 0,
    in: { left: false, right: false }, me: { x: LANES[1], s: 0, v: 18, vx: 0, imm: 0 }, crook: { x: LANES[2], s: 40, v: 18, lane: 2, spin: 0, nextLane: 2 },
    traffic: [], junctions: [], gone: 0, foot: null, cuff: null, passed: 0 };
  for (let s = 140; s < 6000; s += 140 + G.rnd() * 80) G.junctions.push({ s, car: G.rnd() < cfg.cross ? { t: null, dir: G.rnd() < 0.5 ? -1 : 1 } : null });
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G);
  return G;
}
// ---------- the thumbs ----------
function hold(G, side, on) { if (side < 0) G.in.left = on; else G.in.right = on; }
function swipe(G, dir) {      // 'l' 'r' 'u' 'd'
  if (G.over) return;
  if (G.ph === 'foot') { const F = G.foot; if (dir === 'l') F.lane = Math.max(0, F.lane - 1); else if (dir === 'r') F.lane = Math.min(2, F.lane + 1); else if (dir === 'u' && F.air <= 0 && F.low <= 0) { F.air = 0.75; G.ev.push({ k: 'jump' }); } else if (dir === 'd' && F.air <= 0 && F.low <= 0) { F.low = 0.8; G.ev.push({ k: 'slide' }); } G.ev.push({ k: 'dodge', dir }); return; }
  if (G.ph === 'cuff') { const C = G.cuff; if (!C.heave || C.heave.done) { C.calm = (C.calm || 0) + 1; if (C.calm >= 2) breakFree(G, 'flail'); return; }
    const need = { l: 'r', r: 'l', u: 'd', d: 'u' }[C.heave.dir]; if (dir === need) { C.heave.done = true; C.held++; G.ev.push({ k: 'held', n: C.held }); lessonSee(G, 'held'); C.calm = 0; if (C.held >= G.cfg.holds) cuffed(G); } else breakFree(G, 'wrong'); }
}
function tap(G) {
  if (G.over || G.ph !== 'foot') return; const F = G.foot; if (F.dive > 0) return; const L = lessonNow(G); if (L && L.id !== 'tackle') return;
  if (F.gap <= G.cfg.tackle * (lessonNow(G) ? 1.3 : 1)) { G.ev.push({ k: 'tackle' }); if (L) lessonSee(G, 'tackle'); else startCuff(G); }
  else { F.dive = 0.9; F.gap += 3; G.ev.push({ k: 'dive' }); lessonMiss(G, 'dive'); }
}
// ---------- every frame ----------
function step(G, dt) {
  if (G.over) return; G.t += dt; G.ph_t += dt;
  if (G.ph === 'drive') driveStep(G, dt); else if (G.ph === 'crash') { if (G.ph_t > 1.6) startFoot(G); } else if (G.ph === 'foot') footStep(G, dt); else if (G.ph === 'cuff') cuffStep(G, dt);
}
function driveStep(G, dt) {
  const c = G.cfg, me = G.me, ck = G.crook, R = G.rnd, L = lessonNow(G), brake = G.in.left && G.in.right, steer = brake ? 0 : (G.in.right ? 1 : 0) - (G.in.left ? 1 : 0);
  const vmax = c.vmax * (L ? 0.85 : 1), stuck = L && G.lesson.miss >= 4;      // a lesson that keeps going wrong gets gentler
  me.v += (brake ? -16 : me.v < vmax ? 6 : -3) * dt; me.v = clamp(me.v, 6, vmax);
  me.vx += (steer * 7.5 - me.vx) * Math.min(1, dt * 6); me.x += me.vx * dt; me.s += me.v * dt; me.imm = Math.max(0, me.imm - dt);
  if (Math.abs(me.x) > HALF - 1) { me.x = Math.sign(me.x) * (HALF - 1); me.vx = 0; if (me.imm <= 0) { me.v *= 0.85; G.ev.push({ k: 'kerb' }); me.imm = 0.4; } }
  // the getaway car: fast, weaving round traffic and now and then on a whim (its own clock); after a PIT it spins and slows
  ck.v += ((ck.spin > 0 ? vmax * 0.35 : vmax * (L ? (L.id === 'steer' ? 0.95 : ck.s - me.s > 25 || stuck ? 0.55 : 0.8) : c.crookV)) - ck.v) * Math.min(1, dt * 2); ck.spin = Math.max(0, ck.spin - dt);
  ck.nextT = (ck.nextT || 2) - dt; const ahead = G.traffic.find(t => Math.abs(t.x - LANES[ck.lane]) < 1 && t.s > ck.s && t.s - ck.s < 35);
  if ((ahead || ck.nextT <= 0) && !(L && L.id === 'pit')) { const opts = [ck.lane - 1, ck.lane + 1].filter(l => l >= 0 && l < 4 && !G.traffic.some(t => Math.abs(t.x - LANES[l]) < 1 && Math.abs(t.s - ck.s) < 20)); if (opts.length) ck.lane = opts[(R() * opts.length) | 0]; ck.nextT = 2 + R() * 3; }
  ck.x += clamp(LANES[ck.lane] - ck.x, -4 * dt, 4 * dt) + (ck.spin > 0 ? Math.sin(G.t * 20) * 0.05 : 0); ck.s += ck.v * dt;
  // traffic: slower cars in the lanes ahead; some cross at junctions
  while (G.traffic.length < 60) { const last = G.traffic.length ? Math.max(...G.traffic.map(t => t.s0)) : me.s + 60; const s = last + 1 / (c.traffic * (L && L.id === 'steer' ? (stuck ? 1.2 : 2.2) : L && L.id === 'pit' ? (stuck ? 0.05 : 0.3) : 1)) * (0.5 + R()); G.traffic.push({ x: LANES[(R() * 4) | 0], s, s0: s, v: L && L.id === 'steer' ? 7 + R() * 3 : 11 + R() * 7, col: (R() * 6) | 0, hit: 0 }); }
  for (const t of G.traffic) { const behind = t.s < me.s && t.s > me.s - 12 && Math.abs(t.x - me.x) < 2.4; t.s += (behind ? Math.min(t.v, me.v - 2) : t.v) * dt; if (t.hit > 0) { t.hit -= dt; t.x += t.hx * dt; } }      // drivers behind you slow down for you
  for (const t of G.traffic) if (!t.passed && t.s < me.s - 3) { t.passed = true; if (!t.hit) { G.passed++; lessonSee(G, 'pass'); } }
  G.traffic = G.traffic.filter(t => t.s > me.s - 30);
  for (const j of G.junctions) if (j.car && j.s > me.s && j.s - me.s < 70 && j.car.t == null) { j.car.t = 0; G.ev.push({ k: 'horn' }); }
  for (const j of G.junctions) if (j.car && j.car.t != null && j.car.t < 4) { j.car.t += dt; const cx = j.car.dir * (-12 + j.car.t * 8); j.car.x = cx; if (Math.abs(me.s - j.s) < 3 && Math.abs(me.x - cx) < 2.2 && me.imm <= 0) crash(G, 'cross'); }
  for (const t of G.traffic) if (Math.abs(t.x - me.x) < 1.9 && t.s - me.s < 4.4 && t.s - me.s > -1.5 && me.imm <= 0) { t.hit = 0.6; t.hx = Math.sign(t.x - me.x || 1) * 4; crash(G, 'car'); }
  // the PIT: your front into his back corner, from the side
  const dx = ck.x - me.x, ds = ck.s - me.s;
  if (Math.abs(dx) < 2.1 && ds > -1 && ds < 4.7 && me.imm <= 0 && ck.spin <= 0) {
    const easy = L && L.id === 'pit';      // the lesson's PIT is forgiving
    if (easy ? ds > 0 && Math.abs(dx) > 0.3 : ds > 1.4 && Math.abs(dx) > 0.75 && Math.sign(me.vx) === Math.sign(dx) && Math.abs(me.vx) > 1.6) { ck.spin = 1.6; G.pitN++; me.imm = 0.6; G.ev.push({ k: 'pit', n: G.pitN }); lessonSee(G, 'pit'); if (!G.lesson && G.pitN >= c.pits) { G.ph = 'crash'; G.ph_t = 0; G.ev.push({ k: 'crookcrash' }); } }
    else { me.v = Math.min(me.v, ck.v * 0.8); me.imm = 0.5; me.x -= Math.sign(dx || 1) * 0.6; G.ev.push({ k: 'bump' }); lessonMiss(G, 'bump'); } }
  if (ds > c.escape) { G.gone += dt; if (G.gone > 4) { if (L) { ck.s = me.s + 40; G.gone = 0; lessonMiss(G, 'far'); } else finish(G, false, 'escaped'); } } else G.gone = 0;
  if (ds < -25) { ck.s = me.s + 30; }      // passed him: he ducks back in ahead (never a free win)
}
function crash(G, what) {
  const me = G.me; me.v *= 0.3; me.imm = 1.2; G.crashes++; G.ev.push({ k: 'crash', what });
  if (lessonNow(G)) { lessonMiss(G, 'crash'); return; } G.lives--; if (G.lives <= 0) finish(G, false, 'wrecked');
}
// ---------- on foot ----------
function startFoot(G, gap) {
  const c = G.cfg, R = G.rnd, obs = [], len = c.footLen * (lessonNow(G) ? 2 : 1);
  for (let s = 18; s < len + 400; s += 1 / c.obst * (0.6 + 0.8 * R())) { const r = R(), type = r < 0.5 ? 'crate' : r < 0.78 ? 'fence' : 'pipe'; obs.push({ s, lane: type === 'crate' ? (R() * 3) | 0 : -1, type, two: type === 'crate' && R() < 0.4 ? ((R() * 3) | 0) : -1 }); }
  G.ph = 'foot'; G.ph_t = 0; G.foot = { s: 0, lane: 1, x: 0, gap: gap || c.footGap, air: 0, low: 0, dive: 0, stumble: 0, obs, len, crookLane: 1, crookX: 0 }; G.ev.push({ k: 'foot' });
}
function footStep(G, dt) {
  const c = G.cfg, F = G.foot, R = G.rnd, L = lessonNow(G);
  F.air = Math.max(0, F.air - dt); F.low = Math.max(0, F.low - dt); F.dive = Math.max(0, F.dive - dt); F.stumble = Math.max(0, F.stumble - dt);
  const v = F.stumble > 0 || F.dive > 0 ? 3 : c.run * (L ? 0.85 : 1), cv = c.crookRun * (L ? 0.8 : 1);
  F.s += v * dt; F.gap += (cv - v) * dt; if (L && L.id === 'dodge') F.gap = Math.max(F.gap, 8); F.x += clamp(ALLEY[F.lane] - F.x, -7 * dt, 7 * dt);
  // he weaves too, and keeps to free lanes
  F.crookT = (F.crookT || 1) - dt; if (F.crookT <= 0) { F.crookT = 0.8 + R() * 1.4; F.crookLane = (R() * 3) | 0; } F.crookX += clamp(ALLEY[F.crookLane] - F.crookX, -5 * dt, 5 * dt);
  for (const o of F.obs) if (!o.done && o.s <= F.s) { o.done = true;
    const lane = Math.round((F.x + 1.3) / 1.3), blocked = o.type === 'crate' ? (lane === o.lane || lane === o.two) : o.type === 'fence' ? F.air <= 0.08 : F.low <= 0.05;
    if (blocked) { F.stumble = 0.8; G.stumbles++; G.ev.push({ k: 'stumble', type: o.type }); lessonMiss(G, o.type); } else { G.ev.push({ k: 'cleared', type: o.type }); lessonSee(G, 'cleared'); } }
  if (F.gap < 0.6) { F.gap = 3.5; G.ev.push({ k: 'shove' }); }      // right on him without a tackle: he shoves you off
  if (F.gap > 34) { if (L) { F.gap = 12; lessonMiss(G, 'far'); } else finish(G, false, 'away'); }
  if (F.s > F.len && !L) { if (F.gap > 6) finish(G, false, 'away'); else { F.gap = Math.min(F.gap, 2); } }
}
// ---------- the cuffs ----------
function startCuff(G) { G.ph = 'cuff'; G.ph_t = 0; G.cuff = { held: 0, heave: null, next: 1.0, calm: 0 }; G.ev.push({ k: 'cuffstart' }); }
function cuffStep(G, dt) {
  const c = G.cfg, C = G.cuff, R = G.rnd;
  if (!C.heave || C.heave.done) { C.next -= dt; if (C.next <= 0) { const dirs = G.N <= 5 ? ['l', 'r'] : ['l', 'r', 'u', 'd']; C.heave = { dir: dirs[(R() * dirs.length) | 0], t: -c.tell * (lessonNow(G) ? 1.4 : 1), done: false }; C.next = 0.7 + R() * 0.9; G.ev.push({ k: 'twist', dir: C.heave.dir }); } }
  else { C.heave.t += dt; if (C.heave.t >= 0 && !C.heave.go) { C.heave.go = true; G.ev.push({ k: 'heave', dir: C.heave.dir }); } if (C.heave.t > c.hold * (lessonNow(G) ? 1.6 : 1)) breakFree(G, 'late'); }
}
function breakFree(G, why) {
  G.ev.push({ k: 'free', why }); if (lessonNow(G)) { lessonMiss(G, why); G.cuff.heave = null; G.cuff.next = 1.2; return; }
  G.lives--; if (G.lives <= 0) { finish(G, false, 'free'); return; } startFoot(G, 7);
}
function cuffed(G) { G.ev.push({ k: 'cuffed' }); if (!G.lesson) finish(G, true); }
function finish(G, win, why) {
  const c = G.cfg; G.over = win ? 'won' : 'lost';
  G.res = { win, why, stars: win ? (G.lives === c.lives ? 3 : G.lives === c.lives - 1 ? 2 : 1) : 0, crashes: G.crashes, pits: G.pitN, stumbles: G.stumbles, time: G.t, combo: G.passed };
  G.ev.push({ k: win ? 'won' : 'lost', why });
}
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'steer', ph: 'drive', title: 'STEER THROUGH THE TRAFFIC', how: 'Hold the LEFT side of the screen to steer left, the RIGHT side to steer right. Pass the cars without touching them.', need: 3, ok: w => w === 'pass' },
      { id: 'pit', ph: 'drive', title: 'RAM HIS BACK CORNER', how: 'Come up beside his back wheel, then steer INTO it. Straight into his bumper does nothing.', need: 1, ok: w => w === 'pit' }],
  2: [{ id: 'dodge', ph: 'foot', title: 'DODGE, JUMP, SLIDE', how: 'Swipe left or right round crates, UP over fences, DOWN under pipes.', need: 4, ok: w => w === 'cleared' },
      { id: 'tackle', ph: 'foot', title: 'TACKLE HIM', how: 'Wait until you are right behind him, then tap.', need: 1, ok: w => w === 'tackle' }],
  3: [{ id: 'hold', ph: 'cuff', title: 'HOLD HIM DOWN', how: 'When he twists one way, swipe the OTHER way to hold him.', need: 3, ok: w => w === 'held' }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0, miss: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonPhase(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonPhase(G) { const st = lessonNow(G); if (!st) return; if (st.ph === 'foot' && G.ph !== 'foot') startFoot(G, st.id === 'tackle' ? 7 : 12); if (st.id === 'tackle') G.foot.gap = 7; if (st.ph === 'cuff') startCuff(G); }
function lessonSee(G, what) {
  const D = G.lesson; if (!D) return; const st = D.steps[D.i]; if (!st.ok(what)) return;
  D.n++; if (D.n < st.need) { G.ev.push({ k: 'lessonok', n: D.n, need: st.need }); return; }
  D.i++; D.n = 0; D.miss = 0;
  if (D.i >= D.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); Object.assign(G, { ph: 'drive', ph_t: 0, lives: G.cfg.lives, crashes: 0, pitN: 0, foot: null, cuff: null }); G.crook.s = G.me.s + 40; G.crook.spin = 0; G.ev.push({ k: 'drive' }); }
  else { G.ev.push({ k: 'lessonnext' }); lessonPhase(G); }
}
function lessonMiss(G, why) { const D = G.lesson; if (!D) return; D.miss++; G.ev.push({ k: 'lessonmiss', why, how: D.steps[D.i].how }); }

// ---------- for the robots ----------
// BLIND: hold left, hold right, let go, hold both (brake), swipe left/right/up/down, tap.
const BLIND = { L: G => { G.in.left = true; G.in.right = false; }, R: G => { G.in.right = true; G.in.left = false; }, N: G => { G.in.left = G.in.right = false; }, B: G => { G.in.left = G.in.right = true; },
  l: G => swipe(G, 'l'), r: G => swipe(G, 'r'), u: G => swipe(G, 'u'), d: G => swipe(G, 'd'), t: G => tap(G) };
function honest(G, o, mem) {
  const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, t = G.t;
  const later = (key, cond) => { if (!cond) { mem[key] = null; return false; } if (mem[key] == null) mem[key] = t; return t - mem[key] >= react; };
  if (G.ph === 'drive') { const me = G.me, ck = G.crook, ds = ck.s - me.s;
    // where to be: beside his back corner when close, else behind him; never in a lane with a car just ahead
    let tx = ds < 14 ? ck.x + (mem.side || (mem.side = me.x < ck.x ? -1 : 1)) * 1.6 : ck.x; if (ds < 4.3 && ds > 1.5 && Math.abs(me.x - ck.x) < 2.4) tx = ck.x + (mem.side || 1) * 0.5;      // in for the PIT: into his corner, not his bumper
    const blockedAt = l => { let m = 1e9; for (const c2 of G.traffic) if (c2.s > me.s - 5 && Math.abs(c2.x - l) < 2.2) m = Math.min(m, c2.s - me.s); return m; };
    const look = 12 + (me.v - 12) * (react + 1.0), pathBlocked = x0 => blockedAt(x0) < look;
    if (pathBlocked(tx) || pathBlocked(me.x)) { const best = LANES.slice().sort((a, b) => (blockedAt(b) - Math.abs(b - me.x) * 4) - (blockedAt(a) - Math.abs(a - me.x) * 4))[0]; tx = best; if (blockedAt(me.x) < 8 + me.v * react && Math.abs(best - me.x) > 2) mem.brake = true; }
    if (!later('drv', true)) return; mem.drv = null;
    const want = Math.random() < acc ? tx : tx + (Math.random() - 0.5) * 6, dx = want - me.x;
    G.in.left = dx < -0.35; G.in.right = dx > 0.35; if (mem.brake || (ds < 0 && ds > -6)) { G.in.left = G.in.right = true; mem.brake = false; }
    for (const j of G.junctions) if (j.car && j.car.t != null && j.car.t < 4 && j.s - me.s > 0 && j.s - me.s < me.v * 1.6) { const ta = (j.s - me.s) / me.v, cx = j.car.dir * (-12 + (j.car.t + ta) * 8); if (Math.abs(cx - me.x) < 3.2) G.in.left = G.in.right = true; }      // a car crossing ahead: brake
    if (Math.abs(me.x - ck.x) > 3) mem.side = null; return; }
  if (G.ph === 'foot') { const F = G.foot, next = F.obs.find(q => !q.done && q.s > F.s), look = 7.6 * (react + 0.25);
    if (next && next.s - F.s < look + 2 && next.s - F.s > look - 1.5 && mem.obs !== next) { mem.obs = next; const right = Math.random() < acc;
      if (next.type === 'fence') swipe(G, right ? 'u' : 'd'); else if (next.type === 'pipe') swipe(G, right ? 'd' : 'u');
      else { const lane = Math.round((F.x + 1.3) / 1.3); if (lane === next.lane || lane === next.two) { const free = [0, 1, 2].filter(l => l !== next.lane && l !== next.two).sort((a, b) => Math.abs(a - lane) - Math.abs(b - lane))[0]; const d = right ? free : lane; if (d < lane) swipe(G, 'l'); else if (d > lane) swipe(G, 'r'); if (Math.abs(d - lane) > 1) swipe(G, d < lane ? 'l' : 'r'); } } }
    if (later('tk', F.gap < G.cfg.tackle * 0.9)) { tap(G); mem.tk = null; } return; }
  if (G.ph === 'cuff') { const C = G.cuff; if (C.heave && !C.heave.done && later('cf', true)) { const need = { l: 'r', r: 'l', u: 'd', d: 'u' }[C.heave.dir]; swipe(G, Math.random() < acc ? need : C.heave.dir); mem.cf = null; } if (!C.heave || C.heave.done) mem.cf = null; }
}
function winNow(G) { if (!G || G.over) return; G.lesson = null; if (G.ph !== 'cuff') startCuff(G); const C = G.cuff; C.held = G.cfg.holds - 1; C.heave = { dir: 'l', t: 0.01, done: false, go: true }; swipe(G, 'r'); }
