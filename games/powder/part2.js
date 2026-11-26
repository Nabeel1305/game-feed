
// ===================== RULES: Powder (game 36) =====================
// Snowboard down a mountain to the finish before the clock. One thumb: hold and slide it left or right to lean and carve (no
// thumb: you go straight and tuck, the fastest); a quick tap jumps (an ollie, over a rock). Off a kicker you fly: hold a side
// to spin, let go to stop, and land with the board facing down the hill (or fully backwards) for a trick and a burst of speed;
// land crooked and you fall. Pass between the flags of each gate (miss one: +2 seconds). Trees and rocks knock you down. Your
// best run on each level rides beside you as a ghost.
// World: s metres down the course, x metres across it (+ is right as you look down the hill); the piste curves.
const RULES = [
  '<b>Hold and slide</b> your thumb left or right to carve. <b>Let go</b> to go straight and tuck: the fastest.',
  '<b>Tap</b> to jump: over rocks, and higher off the kickers.',
  'In the air, <b>hold a side to spin</b>, let go to stop. Land facing down the hill (or right round backwards) for a trick and speed. Land crooked and you fall.',
  'Ride <b>between the flags</b> of every gate: a missed gate costs 3 seconds. Trees and rocks knock you down.',
  'Beat the clock to the finish. Your <b>best run</b> rides beside you as a ghost: beat it.',
];
const PLACES = [{ name: 'Pine Bowl', sky: 'morning' }, { name: 'Sunset Ridge', sky: 'golden' }, { name: 'Cloud Couloir', sky: 'mist' }, { name: 'Storm Peak', sky: 'overcast' }, { name: 'Night Run', sky: 'dusk' }];
const placeOf = N => Math.floor((N - 1) / 4) % PLACES.length;
const UPGRADES = [
  { id: 'base', name: 'Fast base', desc: 'Your board runs faster.', max: 3, cost: l => 20 + l * 25 },
  { id: 'edges', name: 'Sharp edges', desc: 'You carve tighter, and grip on ice.', max: 3, cost: l => 20 + l * 25 },
  { id: 'pop', name: 'Pop', desc: 'Higher jumps: more time to spin.', max: 2, cost: l => 25 + l * 30 },
  { id: 'knees', name: 'Soft knees', desc: 'Landings a little crooked still count.', max: 2, cost: l => 25 + l * 30 },
  { id: 'wax', name: 'Wax', desc: 'Back up to speed sooner after a fall.', max: 2, cost: l => 20 + l * 25 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Grom'], [40, 'Shredder'], [130, 'Ripper'], [320, 'Pro'], [700, 'Legend'], [1500, 'Mountain King']];
const SLOPE = 0.3, GRAV = 9.8;
function makeCfg(N, help) {
  const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), e = easyOf(N);
  return { N, f, help: !!help, place: placeOf(N), sky: PLACES[placeOf(N)].sky,
    len: Math.round(420 + Math.min(480, N * 16)),           // the run's length
    hw: x(15, 8.5, 30),                                     // half the piste's width
    trees: x(0.15, 0.7, 30), rocks: N >= 2 ? x(0.25, 1.1, 30) : 0, gateGap: x(52, 40, 30), gateW: x(7.5, 5.2, 30), gateSwing: x(0.55, 0.65, 30),
    kick: N >= 3 ? x(160, 95, 30) : 0, ice: N >= 6 ? x(0, 0.25, 30) : 0, wind: x(1, 2.6, 30),
    pace: x(11.4, 11.9, 30) * (help ? 0.93 : 1) * (1 + 0.04 * e),      // the clock: the run's length over this speed, plus time for the gates
    top: 1 + 0.035 * upLv('base'), grip: 1 + 0.12 * upLv('edges'), pop: 1 + 0.12 * upLv('pop'), land: 0.55 + 0.1 * upLv('knees'), wax: 1 + 0.25 * upLv('wax') };
}
// the piste: its middle wanders, slowly and then more as you go higher
function centre(G, s) { const c = G.course; return c.a1 * Math.sin(s / c.l1 + c.p1) + c.a2 * Math.sin(s / c.l2 + c.p2); }
function makeCourse(G) {
  G.cv = (G.cv || 0) + 1; const R = G.rnd, c = G.cfg, C = G.course = { a1: 6 + R() * 10, l1: 60 + R() * 40, p1: R() * 6, a2: 2 + R() * 4, l2: 23 + R() * 10, p2: R() * 6, obs: [], gates: [], kicks: [], ice: [], flakes: [] };
  // gates: alternate sides of the piste's middle, a flag at each end
  let side = R() < 0.5 ? -1 : 1;
  for (let s = 45; s < c.len - 25; s += c.gateGap * (0.85 + R() * 0.3)) { const gx = centre(G, s) + side * c.hw * c.gateSwing * (0.6 + R() * 0.4); C.gates.push({ s, x: gx, w: c.gateW, done: 0 }); side = -side; }
  // kickers: a ramp in the middle of the piste, with nothing straight after it
  if (c.kick) for (let s = 90 + R() * 40; s < c.len - 60; s += c.kick * (0.8 + R() * 0.4)) { if (C.gates.some(g => Math.abs(g.s - s) < 16)) continue; C.kicks.push({ s, x: centre(G, s) + (R() - 0.5) * c.hw * 0.6, w: 3.2, l: 5 }); }
  const clear = (s, x, r) => !C.gates.some(g => Math.abs(g.s - s) < 7 && Math.abs(g.x - x) < g.w / 2 + r + 1.5) && !C.kicks.some(k => s > k.s - 10 && s < k.s + 28 && Math.abs(k.x - x) < 5 + r);
  // trees: thick at the sides of the piste, in clumps on it; rocks on it (jump them or ride round)
  for (let s = 20; s < c.len + 40; s += 2.2) { for (const sd of [-1, 1]) if (R() < 0.75) { const x = centre(G, s) + sd * (c.hw + 1 + R() * 14); C.obs.push({ s: s + R() * 2, x, r: 0.6, k: 'tree', h: 5 + R() * 4 }); } }
  for (let s = 40; s < c.len - 10; s += 10) { if (R() < c.trees * 0.45) { const x = centre(G, s) + (R() - 0.5) * 1.6 * c.hw; for (let j = 0; j < 1 + (R() * 3 | 0); j++) { const ox = x + (R() - 0.5) * 3, os = s + (R() - 0.5) * 3; if (clear(os, ox, 0.6)) C.obs.push({ s: os, x: ox, r: 0.6, k: 'tree', h: 4 + R() * 4 }); } }
    if (R() < c.rocks * 0.45) { const x = centre(G, s + 5) + (R() - 0.5) * 1.7 * c.hw, os = s + 5; if (clear(os, x, 0.9)) C.obs.push({ s: os, x, r: 0.8 + R() * 0.4, k: 'rock', h: 0.7 }); } }
  C.obs.sort((a, b) => a.s - b.s);
  if (c.ice) for (let s = 80; s < c.len - 20; s += 60) if (R() < c.ice) C.ice.push({ s, l: 12 + R() * 14, x: centre(G, s + 8) + (R() - 0.5) * c.hw, w: 5 + R() * 5 });
  // snowflakes to collect: a line through the gates (follow the good line, pick them up)
  for (let i = 0; i + 1 < C.gates.length; i++) { const a = C.gates[i], b = C.gates[i + 1]; for (let u = 0.3; u < 0.8; u += 0.2) { const s = a.s + (b.s - a.s) * u, x = a.x + (b.x - a.x) * (u * u * (3 - 2 * u)); if (!C.obs.some(o => Math.abs(o.s - s) < 2 && Math.abs(o.x - x) < o.r + 1)) C.flakes.push({ s, x, got: 0 }); } }
}
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, place: cfg.place, sky: cfg.sky,
    me: null, lean: 0, held: false, pen: 0, crashes: 0, missed: 0, gatesOk: 0, tricks: 0, trickPts: 0, bestTrick: 0, flakes: 0, coins: 0, track: [], ghost: o.ghost || null, splits: [] };
  makeCourse(G); reset(G, 0);
  G.par = Math.round(cfg.len / cfg.pace + 1);
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else G.ev.push({ k: 'start' });
  return G;
}
function reset(G, s) { G.me = { s, x: centre(G, s), y: 0, vy: 0, a: 0, v: 3, rot: 0, air: false, crashT: 0, airT: 0, ice: false, edge: 0, spinDir: 0 }; }
// ---------- your thumb ----------
function setLean(G, l) { G.lean = clamp(l, -1, 1); G.held = l !== 0; }
function jump(G) { const m = G.me; if (G.over || m.air || m.crashT > 0 || (G.wait > 0)) return false; m.air = true; m.vy = 4.3 * G.cfg.pop; m.airT = 0; m.rot = 0; m.kick = false; G.ev.push({ k: 'ollie' }); return true; }
// ---------- the mountain, step by step ----------
function step(G, dt) {
  if (G.over) return; G.t += dt; const c = G.cfg, m = G.me, C = G.course;
  if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0 && G.lessonEnd) { G.lessonEnd = false; G.t = 0; G.pen = 0; G.crashes = 0; G.missed = 0; G.gatesOk = 0; G.coins = 0; G.flakes = 0; G.track = []; for (const g of C.gates) g.done = 0; for (const f of C.flakes) f.got = 0; reset(G, 0); G.ev.push({ k: 'start' }); } return; }
  const s0 = m.s, x0 = m.x;
  if (m.crashT > 0) { m.crashT -= dt; m.v += (2 - m.v) * Math.min(1, dt * 6); m.s += m.v * dt; m.x += (centre(G, m.s) - m.x) * 0 ; if (m.crashT <= 0) { m.a = 0; G.ev.push({ k: 'up' }); } }
  else if (!m.air) {
    const ice = C.ice.some(z => m.s > z.s && m.s < z.s + z.l && Math.abs(m.x - z.x) < z.w / 2); if (ice && !m.ice) G.ev.push({ k: 'ice' }); m.ice = ice;
    const grip = (2.4 * c.grip / (1 + 0.06 * m.v)) * (ice ? 0.35 : 1), at = G.lean * 1.15;
    const da = clamp(at - m.a, -grip * dt, grip * dt); m.a += da; m.edge = Math.abs(da) / dt / 2.4;
    const off = Math.abs(m.x - centre(G, m.s)) > c.hw;      // deep powder off the piste: slow
    let acc = GRAV * SLOPE * Math.cos(m.a) * (G.held ? 1 : 1.08) - 0.0118 / c.top * m.v * m.v - Math.abs(G.lean) * 0.55 * m.v * 0.25 - (off ? 0.45 * m.v : 0);
    if (m.v < 9) acc += (m.v < 6 ? 1.2 : 0.4) * (c.wax - 1) * 4;
    m.v = Math.max(0.5, m.v + acc * dt); m.s += m.v * Math.cos(m.a) * dt; m.x += m.v * Math.sin(m.a) * dt;
    // a kicker throws you up
    for (const k of C.kicks) if (s0 < k.s + k.l && m.s >= k.s + k.l && Math.abs(m.x - k.x) < k.w / 2) { m.air = true; m.kick = true; m.vy = (0.4 * m.v + 2.2) * c.pop; m.airT = 0; m.rot = 0; G.ev.push({ k: 'launch' }); lessonSee(G, 'launch'); }
  } else {      // in the air: the thumb spins you
    m.airT += dt; m.vy -= GRAV * dt; m.y += m.vy * dt; m.s += m.v * Math.cos(m.a) * dt; m.x += m.v * Math.sin(m.a) * dt;
    const sp = G.lean * 7.5; m.rot += sp * dt; if (sp) m.spinDir = Math.sign(sp);
    if (m.y <= 0) { m.y = 0; m.air = false; land(G); }
  }
  // what you hit: trees always (unless high over them? no: they are tall), rocks unless you are over them
  if (m.crashT <= 0) for (const o of C.obs) { if (o.s < m.s - 2) continue; if (o.s > m.s + 2) break; const d = Math.hypot(o.s - m.s, o.x - m.x); if (d < o.r + 0.35 && m.y < o.h) { crash(G, o.k); break; } }
  // gates: crossing a gate's line between its flags, or not
  for (const g of C.gates) if (!g.done && s0 < g.s && m.s >= g.s) { const xg = x0 + (m.x - x0) * (g.s - s0) / Math.max(1e-6, m.s - s0); if (Math.abs(xg - g.x) < g.w / 2) { g.done = 1; G.gatesOk++; G.coins += 1; G.ev.push({ k: 'gate', x: g.x, s: g.s, n: G.gatesOk }); lessonSee(G, 'gate'); } else { g.done = -1; G.missed++; G.pen += 3; G.ev.push({ k: 'gatemiss', x: g.x, s: g.s }); lessonMissGate(G); }
    G.splits.push({ s: g.s, t: G.t + G.pen }); }
  for (const f of C.flakes) if (!f.got && Math.abs(f.s - m.s) < 1.2 && Math.abs(f.x - m.x) < 1.1 && m.y < 2.5) { f.got = 1; G.flakes++; G.coins += 1; G.ev.push({ k: 'flake', n: G.flakes }); }
  // your track, for the ghost of this run (a point every 2 m)
  if (!G.lesson && (!G.track.length || m.s - G.track[G.track.length - 1][0] >= 2)) G.track.push([+m.s.toFixed(1), +m.x.toFixed(2), +G.t.toFixed(2), +m.y.toFixed(1)]);
  if (G.lesson) lessonTick(G, dt);
  else if (m.s >= c.len) return finish(G);
}
function land(G) {
  const m = G.me, c = G.cfg, half = Math.round(m.rot / Math.PI), off = Math.abs(m.rot - half * Math.PI);
  if (off > c.land) { crash(G, 'land'); return; }
  const spins = Math.abs(half);
  if (spins > 0) { const pts = spins * 180; G.tricks++; G.trickPts += pts; G.bestTrick = Math.max(G.bestTrick, pts); m.v = Math.min(m.v + 1.3 * spins, 21 * c.top); G.coins += spins * 2; G.ev.push({ k: 'trick', pts, spins, clean: off < 0.2 }); lessonSee(G, 'trick'); }
  else if (m.airT > 0.9) { m.v += 0.6; G.ev.push({ k: 'bigair' }); }
  else G.ev.push({ k: 'land' });
  if (spins % 2 === 1) m.switch = !m.switch;
  m.rot = 0;
}
function crash(G, why) { const m = G.me; m.crashT = 1.25; m.v = Math.min(m.v, 3); m.air = false; m.y = 0; m.vy = 0; m.rot = 0; G.crashes++; G.ev.push({ k: 'crash', why }); if (G.lesson) lessonCrash(G, why); }
function finish(G) {
  const time = +(G.t + G.pen).toFixed(2), win = time <= G.par, stars = win ? (time <= G.par * 0.88 ? 3 : time <= G.par * 0.95 ? 2 : 1) : 0;
  G.over = win ? 'won' : 'lost';
  G.res = { win, time, par: G.par, stars, crashes: G.crashes, missed: G.missed, tricks: G.tricks, trickPts: G.trickPts, bestTrick: G.bestTrick, flakes: G.flakes, gates: G.gatesOk, nGates: G.course.gates.length, coins: G.coins + (win ? 4 + Math.ceil(G.N / 3) : 0), track: G.track };
  G.ev.push({ k: win ? 'won' : 'lost' }); return true;
}
// ---------- LESSONS ----------
const AIMCARD = {"pic": "🏂", "win": "BEAT THE TIME DOWN THE MOUNTAIN", "lose": "TOO SLOW", "how": "SLIDE TO CARVE, TAP TO JUMP"};      // the aim card: specs/aims.json (tools/aims.py)
const LESSONS = {
  1: [{ id: 'gate', title: 'CARVE', say: G => powderCue(G)[0], do: G => powderCue(G)[1], at: G => powderCue(G)[2], how: 'Hold your thumb and slide it left or right to carve. Ride between the flags of three gates in a row.', need: 3 }],
  2: [{ id: 'rock', title: 'JUMP', say: G => powderCue(G)[0], do: G => powderCue(G)[1], at: G => powderCue(G)[2], how: 'Tap to jump. Hop over two rocks in a row.', need: 2 }],
  3: [{ id: 'trick', title: 'SPIN', say: G => powderCue(G)[0], do: G => powderCue(G)[1], at: G => powderCue(G)[2], how: 'Ride over the kicker. In the air hold a side to spin, let go when the board faces down the hill again. Land two spins.', need: 2 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonSetup(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonSetup(G) { const st = lessonNow(G), C = G.course; reset(G, G.me ? Math.max(0, G.me.s - 10) : 0); const s0 = G.me.s;
  C.obs = C.obs.filter(o => Math.abs(o.x - centre(G, o.s)) > G.cfg.hw); C.gates = []; C.kicks = []; C.ice = []; C.flakes = [];
  if (st.id === 'gate') { let sd = 1; for (let s = s0 + 30; s < s0 + 2000; s += 34) { C.gates.push({ s, x: centre(G, s) + sd * 4, w: 7, done: 0 }); sd = -sd; } }
  if (st.id === 'rock') for (let s = s0 + 35; s < s0 + 2000; s += 26) C.obs.push({ s, x: centre(G, s), r: 1.1, k: 'rock', h: 0.7, lesson: 1 });
  if (st.id === 'trick') for (let s = s0 + 40; s < s0 + 2000; s += 70) C.kicks.push({ s, x: centre(G, s), w: 6, l: 5 });
  C.obs.sort((a, b) => a.s - b.s); G.lesson.lastS = s0; G.cv++; }
function lessonTick(G) { const st = lessonNow(G), m = G.me; if (!st) return;
  if (st.id === 'rock') { const passed = G.course.obs.filter(o => o.lesson && o.s < m.s - 1 && !o.seen); for (const o of passed) { o.seen = 1; if (m.crashT <= 0) lessonSee(G, 'rock'); } } }
function lessonSee(G, what) { const st = lessonNow(G); if (!st || st.id !== what) return; G.lesson.n++;
  if (G.lesson.n < st.need) { G.ev.push({ k: 'lessonok', n: G.lesson.n, need: st.need }); return; }
  G.lesson.i++; G.lesson.n = 0; if (G.lesson.i >= G.lesson.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.lessonEnd = true; G.wait = 1.4; makeCourse(G); } }
function lessonMissGate(G) { const st = lessonNow(G); if (st && st.id === 'gate') { G.lesson.n = 0; G.ev.push({ k: 'lessonmiss', how: st.how }); } }
function lessonCrash(G, why) { const st = lessonNow(G); if (!st) return; if (st.id === 'rock' || (st.id === 'trick' && why === 'land')) { G.lesson.n = 0; G.ev.push({ k: 'lessonmiss', how: st.how }); } }
// ---------- for the robots ----------
// BLIND: a thumb that does not look: slides some way (or lets go), or taps
const BLIND = { l: G => { const R = Math.random; setLean(G, R() < 0.3 ? 0 : (R() * 2 - 1)); }, t: G => { setLean(G, 0); jump(G); } };
// a rider who looks: aims through the next gate, steers round trees, hops rocks, spins off kickers and stops in time to land
// THE TUTORIAL SHOWS THE ONE MOVE FOR NOW (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing happens"). It slid left and
// right for ever. Now from the robot's riding (dryPlanAll): HOLD, SLIDE LEFT / RIGHT to carve (how far), TAP TO JUMP! as a rock comes (a thumb's
// time early), in the air HOLD RIGHT TO SPIN and LET GO! as the board faces down the hill.
const PWC = { t: -1e9, v: null };
function powderCue(G) { const m = G.me, C = G.course; if (G.over || G.wait > 0 || m.crashT > 0) return ['WAIT…', 'wait', false];
  if (m.air) { if (!m.kick || !(G.lesson && G.lesson.steps[G.lesson.i].id === 'trick')) return ['WAIT… LAND IT', 'wait', false]; const tl = (m.vy + Math.sqrt(m.vy * m.vy + 2 * GRAV * Math.max(0, m.y))) / GRAV, goal = Math.max(1, Math.floor((tl - 0.3) * 7.5 / Math.PI)) * Math.PI;
    return Math.abs(m.rot) < goal - 0.5 ? ['SLIDE RIGHT, HOLD: SPIN', 'drag', [W / 2, H * 0.62, W / 2 + 60 * k, H * 0.62]] : ['LET GO!', 'release', [W / 2 + 60 * k, H * 0.62]]; }      /* (a spin is a slide held to one side: a thumb that does not move does not lean) */
  for (const ob of C.obs) { if (ob.s < m.s + 1) continue; const ds = ob.s - m.s; if (ds > Math.max(6, m.v * 1.6)) break; const px = m.x + Math.tan(m.a) * ds; if (ob.k === 'rock' && Math.abs(px - ob.x) <= ob.r + 1.1 && ds / Math.max(1, m.v) < 0.62 && ds / Math.max(1, m.v) > 0.3) return ['TAP TO JUMP!', 'tap', [W / 2, H * 0.62]]; }
  const now = performance.now(); if (now - PWC.t < 150) return PWC.v; PWC.t = now; const all = dryPlanAll(G, null, { next: -1 }), l = all.filter(q => q[0] === 'setLean').pop(); let v = ['RIDE…', 'wait', false];
  if (l && Math.abs(l[1]) > 0.2) { const x0 = W / 2, y0 = H * 0.7; v = [l[1] > 0 ? 'HOLD, SLIDE RIGHT' : 'HOLD, SLIDE LEFT', 'drag', [x0, y0, x0 + l[1] * 60 * k, y0]]; } PWC.v = v; return v; }
function honest(G, o, mem) {
  const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random, m = G.me, c = G.cfg, C = G.course;
  if (G.over || G.wait > 0) { ACT.setLean(G, 0); return; }
  if (m.air) {      // spin: as many half turns as the air allows; let go in time
    if (mem.spins == null) { const tl = (m.vy + Math.sqrt(m.vy * m.vy + 2 * GRAV * m.y)) / GRAV, can = Math.floor((tl - 0.12 - react * 0.3) * 7.5 / Math.PI); mem.spins = m.kick ? Math.max(0, Math.min(4, can)) : 0; mem.dir = R() < 0.5 ? -1 : 1; mem.slip = R() > acc; }
    const goal = mem.spins * Math.PI + (mem.slip ? 0.5 + 0.4 * R() : 0); ACT.setLean(G, Math.abs(m.rot) < goal - 0.06 ? mem.dir : 0); return; }
  mem.spins = null;
  if (m.crashT > 0) { ACT.setLean(G, 0); return; }
  if (G.t < (mem.next || 0)) return; mem.next = G.t + 0.04 + react * 0.2;
  // the line: through the next gate (aim a little inside its flags), else down the middle; a kicker if one is near
  const g = C.gates.find(q => !q.done && q.s > m.s + 0.5), k = C.kicks.find(q => q.s > m.s + 4 && q.s < m.s + 45);
  let ts, tx; if (g && g.s - m.s < 60) { const gi = C.gates.indexOf(g), g2 = C.gates[gi + 1], inside = g.x + clamp(m.x - g.x, -g.w * 0.3, g.w * 0.3);
    const willPass = Math.abs(m.x + Math.tan(m.a) * (g.s - m.s) - g.x) < g.w * 0.35; if (g2 && willPass && g.s - m.s < 6 + m.v * 0.5) { ts = g2.s; tx = g2.x; } else { ts = g.s; tx = g2 ? g.x + clamp(g2.x - g.x, -g.w * 0.3, g.w * 0.3) : inside; } } else { ts = m.s + 25; tx = centre(G, ts); }
  if (k && (!g || k.s < g.s)) { ts = k.s; tx = k.x; }
  // something in the way? jump a rock when it is close; ride round a tree
  const look = Math.max(6, m.v * 1.6);
  for (const ob of C.obs) { if (ob.s < m.s + 1) continue; if (ob.s > m.s + look) break; const ds = ob.s - m.s, px = m.x + Math.tan(m.a) * ds; if (Math.abs(px - ob.x) > ob.r + 1.1) continue;
    if (ob.k === 'rock' && ds / Math.max(1, m.v) < 0.5) { if (ds / Math.max(1, m.v) > 0.22 && R() < acc) ACT.jump(G); }
    else if (ob.k === 'tree' || ds > m.v * 0.6) { const free = sd => !C.obs.some(q => q !== ob && Math.abs(q.s - ob.s) < 4 && Math.abs(q.x - (ob.x + sd * (ob.r + 2.4))) < q.r + 1.3); let sd = px >= ob.x ? 1 : -1; if (!free(sd) && free(-sd)) sd = -sd; else if (!free(sd)) { sd *= 2; } tx = ob.x + sd * (ob.r + 2.4); ts = ob.s; } break; }
  const ds = Math.max(4, ts - m.s), want = Math.atan2(tx - m.x, ds);
  ACT.setLean(G, clamp(want / 1.15 + (want - m.a) * 0.9, -1, 1) * (R() > acc ? 0.4 : 1));
}
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.t = 0; G.pen = 0; G.me.s = G.cfg.len; finish(G); }

// what the robot would do now, without doing it (tools/dry_plan.py): the tutorial shows this move
const ACT_REAL = { setLean, jump }; let ACT = ACT_REAL;
function dryPlan(G, o, mem) { let got = null; const rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { if (!got && !(a.length > 2 && a.slice(1).every(v => v === 0 || v === false))) got = [n, ...a.slice(1)]; return true; };      /* (a stick at rest, all its numbers 0, is not a move; a first bed, number 0, is) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return got; }
function dryPlanAll(G, o, mem) { const all = [], rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { all.push([n, ...a.slice(1)]); return true; };      /* every call, in order (for a robot that steers and drifts at once) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return all; }
