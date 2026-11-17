// ===================== RULES: Wild Water (game 10) =====================
// A kayak down a whitewater river. Two thumbs are the two blades of the paddle: a stroke on the left drives you on and swings the
// bow to the right; on the right, to the left. Pull up on a side to back-paddle (brake, and swing toward that side). The current
// carries you whatever you do; you choose where. Rocks, a fallen tree on the outside of the bends, ledges you must go over straight,
// and slalom gates for stars. River frame: s = metres downstream along the middle, d = metres to the right of the middle,
// heading h = radians off straight downstream (+ = toward the right bank). No drawing here, so the robots can paddle fast.

const RULES = [
  '<b>Your thumbs are the paddle.</b> Swipe down on the left side for a left stroke, on the right side for a right stroke.',
  '<b>A stroke on the left turns you right</b>, and on the right turns you left. Both, one after the other, drive you straight on.',
  '<b>Swipe up to back-paddle:</b> it slows you and turns you toward that side.',
  '<b>The river carries you.</b> Find the gap between the rocks, the smooth tongue over each ledge, and go over ledges straight or you roll.',
  '<b>Stay out of the trees</b> that lie on the outside of the bends: the current pushes you that way.',
  'Reach the end with your boat in one piece: three hard knocks or rolls and it is over. Go between the gates for stars.',
];
const WEATHERS = ['morning', 'noon', 'golden', 'overcast', 'rain', 'mist', 'sunset', 'storm', 'dawn'];
function weatherOf(N) { if (N <= 2) return ['morning', 'golden'][N - 1]; const R = rng(N * 4099 + 11); R(); return WEATHERS[(R() * WEATHERS.length) | 0]; }

function makeCfg(N, help) {
  const f = curve(N), e = easyOf(N), boss = N % 10 === 0, x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s));
  return { N, f, e, boss, help: !!help,
    len: Math.round(x(430, 950, 30) + (boss ? 250 : 0)),          // metres of river
    w: x(19, 13, 45) + 3 * e,                                    // river width in the rapids
    u: x(2.5, 3.8, 60) * (1 - 0.12 * e) * (help ? 0.88 : 1),                      // the current in the rapids (m/s)
    gap: x(5.2, 3.5, 60) + 3.6 * e + (help ? 0.5 : 0),           // the gap between the rocks (m)
    rowGap: x(19, 14, 60) + 6 * e,                                // metres between rows of rocks
    jump: x(1.2, 3.0, 40),                                          // how far the gap moves from one row to the next (beyond 2.4 m)
    drops: N < 3 ? 0 : Math.min(5, Math.round(x(1, 5, 30))),     // ledges
    tongue: x(4.6, 3.0, 40) + e,                                  // the smooth way over a ledge (m)
    straight: (x(32, 20, 40) + 8 * e) * Math.PI / 180,            // how far off straight you can go over a ledge
    bends: x(0.4, 1, 20), strainer: N >= 2,
    hit: x(1.9, 1.3, 25) + 0.6 * e,                               // a knock harder than this (m/s) costs a life
    buffet: x(0.25, 0.7, 45),                                     // how much the white water throws the bow about
    gates: boss ? 0 : 3 + Math.min(3, Math.floor(f / 8)), lives: 3 };
}
// ---------- the river, made from the level's seed: sections of pool, rapid, bend and ledge ----------
function makeRiver(G) {
  const teach = G.teach && LESSONS[G.N] && G.taught < G.N && !G.lessonsDone;      // a lesson's river: longer, wider gaps
  const c = G.cfg, R = G.rnd, L = c.len + 60 + (teach ? 700 : 0), n = Math.ceil(L) + 1;
  const RV = { n, w: new Float32Array(n), u: new Float32Array(n), k: new Float32Array(n), foam: new Float32Array(n), y: new Float32Array(n), rocks: [], drops: [], gates: [], trees: [], len: c.len };
  let s = 0, y = 0; const secs = [];
  const add = (type, len) => { secs.push({ type, a: s, b: s + len }); s += len; };
  add('pool', 40);
  const kinds = ['rapid', 'rapid', 'bend', 'pool']; let dropsLeft = c.drops, gatesLeft = c.gates, i = 0;
  while (s < L - 90) {
    let t = kinds[(R() * kinds.length) | 0]; if (i === 0) t = 'rapid';
    if (dropsLeft > 0 && i > 0 && R() < 0.4) { t = 'drop'; dropsLeft--; }
    add(t, t === 'pool' ? 35 + R() * 25 : t === 'drop' ? 30 : 60 + R() * 50); i++;
  }
  add('pool', 60);
  for (const sc of secs) for (let j = Math.floor(sc.a); j < Math.min(n, sc.b); j++) {
    const u = (j - sc.a) / (sc.b - sc.a), ease = Math.sin(u * Math.PI);
    RV.w[j] = sc.type === 'pool' ? c.w + 6 : sc.type === 'bend' ? c.w + 1 : c.w;
    RV.u[j] = sc.type === 'pool' ? c.u * 0.55 : sc.type === 'drop' ? c.u * 1.1 : c.u;
    RV.foam[j] = sc.type === 'pool' ? 0.05 : sc.type === 'rapid' ? 0.7 : sc.type === 'drop' ? 0.9 : 0.4;
    RV.k[j] = sc.type === 'bend' ? (sc.dir = sc.dir || (R() < 0.5 ? -1 : 1)) * ease * 0.0085 * c.bends : (sc.wig = sc.wig || (R() - 0.5)) * 0.004 * Math.sin(u * 6.3);
  }
  // smooth the joins
  for (const A of [RV.w, RV.u, RV.foam, RV.k]) for (let pass = 0; pass < 3; pass++) for (let j = 1; j < n - 1; j++) A[j] = (A[j - 1] + 2 * A[j] + A[j + 1]) / 4;
  // rocks: rows across the rapids, each with one gap (the line); the gap wanders, so no straight line goes through
  let gapD = 0;
  for (const sc of secs) {
    if (sc.type === 'rapid' || sc.type === 'bend') {
      for (let rs = sc.a + 8; rs < sc.b - 5; rs += c.rowGap * (0.85 + 0.3 * R())) {
        const w = RV.w[rs | 0], half = w / 2 - 0.5, g = c.gap * (0.9 + 0.2 * R()) + (teach ? 2.5 : 0);
        const jmin = Math.max(2.2, g * 0.5 + 0.6); let nd = gapD + (R() < 0.5 ? -1 : 1) * (jmin + R() * Math.min(half - g / 2, c.jump)); nd = clamp(nd, -half + g / 2 + 0.3, half - g / 2 - 0.3);      // never a straight line through two rows
        if (Math.abs(nd - gapD) < jmin * 0.9) nd = clamp(gapD + (nd >= gapD ? -jmin : jmin), -half + g / 2 + 0.3, half - g / 2 - 0.3);
        gapD = nd;
        for (let d = -half; d <= half; ) { const r = 0.55 + R() * 0.9; const dd = d + r;
          if (Math.abs(dd - gapD) > g / 2 + r) RV.rocks.push({ s: rs + (R() - 0.5) * 2.5, d: dd, r, h: 0.3 + R() * 0.9, sub: R() < 0.2 });
          d += r * 2 + R() * 0.45; }      // tight: the boat only gets through the gap
        RV.rocks.push({ gap: true, s: rs, d: gapD, w: g });
      }
      if (sc.type === 'bend' && c.strainer) { const mid = (sc.a + sc.b) / 2, side = sc.dir || 1; RV.trees.push({ s: mid - 6, len: 14, side, reach: RV.w[mid | 0] * 0.42 }); }
    }
    if (sc.type === 'drop') {
      const at = sc.a + 15, w = RV.w[at | 0], half = w / 2 - 0.6; let td = clamp(gapD + (R() - 0.5) * 6, -half + c.tongue / 2, half - c.tongue / 2); gapD = td;
      RV.drops.push({ s: at, d: td, w: c.tongue, h: 1.2 + R() * 0.8 });
      for (let d = -half; d <= half; d += 0.9 + R() * 0.4) if (Math.abs(d - td) > c.tongue / 2 + 0.5) RV.rocks.push({ s: at - 0.4 + R() * 0.8, d, r: 0.45 + R() * 0.4, h: 0.2 + R() * 0.3, ledge: true });
    }
    if (sc.type === 'pool' && gatesLeft > 0 && sc.a > 20 && sc.b < c.len) { const at = (sc.a + sc.b) / 2, w = RV.w[at | 0]; RV.gates.push({ s: at, d: (R() - 0.5) * (w - 6), w: 2.6, got: false, missed: false }); gatesLeft--; }
  }
  // the water drops at each ledge (for the picture)
  for (let j = 0; j < n; j++) { for (const dp of RV.drops) if (j >= dp.s && j - 1 < dp.s) y -= dp.h; RV.y[j] = y - j * 0.012; }
  RV.secs = secs; return RV;
}
const rv = (A, s) => { const i = clamp(s, 0, A.length - 1.001), j = i | 0, f = i - j; return A[j] * (1 - f) + A[Math.min(A.length - 1, j + 1)] * f; };

function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null,
    weather: weatherOf(N), b: { s: 4, d: 0, h: 0, v: 1, w: 0, roll: 0, rollT: 0, stroke: 0, side: 0, back: 0, hitT: 0 }, lives: cfg.lives, lost: 0, gates: 0, rolls: 0, knocks: 0,
    queue: [], river: null, near: 0, best: 0 };
  G.river = makeRiver(G);
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G);
  return G;
}
// ---------- the strokes: two thumbs, two blades ----------
const STROKE = 0.42;      // seconds a stroke takes; a stroke asked for during one waits for it (one queued)
function paddle(G, side, back, power = 1) {
  if (G.over) return; const b = G.b;
  if (b.roll > 0) return;
  if (b.stroke > 0) { if (G.queue.length < 1) G.queue.push([side, back, power]); return; }
  b.stroke = STROKE; b.side = side; b.back = back ? 1 : 0; const p = clamp(power, 0.4, 1.2);
  if (!back) { b.v = Math.min(b.v + 0.9 * p, 3.6); b.w += -side * 0.64 * p; }       // left (-1) stroke: bow swings right (+)
  else { b.v = Math.max(b.v - 1.1 * p, -1.2); b.w += side * 0.55 * p; }             // back on the left: bow swings left
  // the same side again and again over-turns, and spins you more each time (a habit costs more than a slip)
  b.same = b.last === side * (back ? 2 : 1) ? (b.same || 0) + 1 : 0; b.last = side * (back ? 2 : 1); if (b.same >= 2) b.w += -side * (back ? -1 : 1) * 0.25 * (b.same - 1);
  G.ev.push({ k: 'stroke', side, back }); lessonSee(G, back ? 'back' : 'stroke' + side);
}
// ---------- every frame ----------
function step(G, dt) {
  if (G.over) return; G.t += dt; const c = G.cfg, RV = G.river, b = G.b, L = lessonNow(G);
  b.stroke = Math.max(0, b.stroke - dt); if (b.stroke === 0 && G.queue.length) { const q = G.queue.shift(); paddle(G, q[0], q[1], q[2]); }
  b.hitT = Math.max(0, b.hitT - dt);
  if (b.roll > 0) { b.roll -= dt; b.v *= Math.exp(-dt * 2); if (b.roll <= 0) { b.h = 0; b.w = 0; G.ev.push({ k: 'rollup' }); } }
  const u = rv(RV.u, b.s) * (L && L.slow ? 0.55 : 1), w = rv(RV.w, b.s), k = rv(RV.k, b.s), foam = rv(RV.foam, b.s);
  // the white water throws the bow about (its own random clock), more where it is whitest
  b.buf = (b.buf || 0) - dt; if (b.buf <= 0) { b.buf = 0.3 + G.rnd() * 0.5; b.w += (G.rnd() - 0.5) * c.buffet * foam * 2.2 * (L ? 0.4 : 1); }
  // the current turns a boat side-on toward downstream slowly, and pushes it to the outside of a bend
  b.w *= Math.exp(-dt * 2.0); b.h += b.w * dt; b.h = clamp(b.h, -1.5, 1.5);
  b.v *= Math.exp(-dt * 0.55);
  const lat = -k * u * 50 * (1 - Math.min(1, Math.abs(b.d) / (w / 2)) * 0.3);       // to the outside of the bend
  // an angled hull is also pushed across by the current (a ferry glide): steering is mostly pointing the boat
  b.s += (u + b.v * Math.cos(b.h)) * dt; b.d += (b.v * Math.sin(b.h) + u * Math.sin(b.h) * 0.55 + lat) * dt;
  // the banks: a scrape slows you and turns you away
  if (Math.abs(b.d) > w / 2 - 0.5) { const sd = Math.sign(b.d); b.d = sd * (w / 2 - 0.5); b.h -= sd * 0.25 * dt * 10; b.v *= 0.9; if (!b.scr) { b.scr = 1; G.ev.push({ k: 'scrape' }); } } else b.scr = 0;
  // rocks
  for (const r of RV.rocks) { if (r.gap || Math.abs(r.s - b.s) > 3) continue; const dx = b.d - r.d, ds = b.s - r.s, dd = Math.hypot(dx, ds * 0.8), lim = r.r + 0.45;
    if (dd < lim) { const nx = dx / (dd || 1), ns = ds / (dd || 1), rel = u + b.v; b.d = r.d + nx * lim; b.s = r.s + ns * lim / 0.8 + 0.01; const hard = Math.abs(ns) > 0.55 ? 99 : Math.abs(ns) * rel * 0.8 + Math.abs(b.v * Math.sin(b.h));      // into a rock's face is always a smash
      b.v = -0.3; b.w += (nx >= 0 ? 1 : -1) * 0.9; if (b.hitT <= 0) { b.hitT = 1.3; const big = knock(G, hard, r); if (big) { b.s = r.s + r.r + 0.7; b.h *= 0.4; } } } }      // a smash knocks you round the rock
  // trees fallen in from the bank on the outside of bends: the current pushes you in; touching them is a knock
  for (const T of RV.trees) if (b.s > T.s && b.s < T.s + T.len && T.side * b.d > w / 2 - T.reach) { if (b.hitT <= 0) { b.hitT = 1; knock(G, 99, T, 'tree'); b.d = T.side * (w / 2 - T.reach - 0.6); b.w -= T.side * 1.2; } }
  // ledges: over the tongue and straight, or you roll
  for (const dp of RV.drops) if (!dp.done && b.s >= dp.s) { dp.done = true; const inT = Math.abs(b.d - dp.d) < dp.w / 2 + 0.3, str = Math.abs(b.h) < c.straight;
    G.ev.push({ k: 'drop', h: dp.h, ok: inT && str });
    if (!str) roll(G); else if (!inT) knock(G, 99, dp, 'ledge'); else { lessonSee(G, 'drop'); G.ev.push({ k: 'clean' }); } }
  // gates: go between the poles
  for (const gt of RV.gates) if (!gt.got && !gt.missed && b.s >= gt.s) { if (Math.abs(b.d - gt.d) < gt.w / 2) { gt.got = true; G.gates++; G.ev.push({ k: 'gate', n: G.gates }); lessonSee(G, 'gate'); } else { gt.missed = true; G.ev.push({ k: 'gatemiss' }); lessonMiss(G, 'gatemiss'); } }
  // rocks passed cleanly, for the lessons and for words of praise
  for (const r of RV.rocks) if (r.gap && !r.done && b.s > r.s) { r.done = true; if (b.hitT < 0.3) { G.ev.push({ k: 'line' }); lessonSee(G, 'line'); } }
  if (G.lesson && b.s > RV.len - 70) { b.s = 30; b.d = 0; b.h = 0; RV.gates.forEach(g => { if (g.s > 40) { g.got = false; g.missed = false; } }); RV.drops.forEach(d => d.done = false); lessonRiver(G); G.ev.push({ k: 'river' }); return; }      // a lesson is not over until it is learnt: back to the top
  if (b.s >= RV.len) finish(G, true);
}
function knock(G, hard, r, what) {
  const c = G.cfg, L = lessonNow(G), big = hard > c.hit || what;
  G.ev.push({ k: 'knock', big, what: what || 'rock', hard });
  // a glancing knock dents the boat: three dents are as bad as one smash (a slip is cheap, a habit is ruinous)
  if (!big) { if (L) return false; G.dent = (G.dent || 0) + 1; G.ev.push({ k: 'dent', n: G.dent }); if (G.dent < 2) return false; G.dent = 0; }
  G.knocks++; if (L) { lessonMiss(G, what || 'rock'); return true; }
  G.lives--; G.lost++; if (G.lives <= 0) finish(G, false, what || 'rock');
  return true;
}
function roll(G) {
  const b = G.b, L = lessonNow(G); b.roll = 1.6; b.rollT = 1.6; G.rolls++; G.ev.push({ k: 'roll' });
  if (L) { lessonMiss(G, 'roll'); return; }
  G.lives--; G.lost++; if (G.lives <= 0) finish(G, false, 'roll');
}
function finish(G, win, why) {
  const c = G.cfg; G.over = win ? 'won' : 'lost';
  const stars = win ? (G.lost === 0 && G.gates >= Math.ceil(c.gates * 0.67) ? 3 : G.lost <= 1 ? 2 : 1) : 0;
  G.res = { win, why, stars, lost: G.lost, gates: G.gates, ofGates: c.gates, dist: Math.round(G.b.s), len: c.len, time: G.t, combo: 0 };
  G.ev.push({ k: win ? 'won' : 'lost', why });
}
// ---------- LESSONS: the first three runs teach every stroke, slowly, two or three times each ----------
const LESSONS = {
  1: [{ id: 'left', title: 'A STROKE ON THE LEFT', how: 'Swipe down on the left half of the screen. The bow swings to the right.', need: 3, ok: w => w === 'stroke-1', slow: 1 },
      { id: 'right', title: 'A STROKE ON THE RIGHT', how: 'Swipe down on the right half. The bow swings to the left.', need: 3, ok: w => w === 'stroke1', slow: 1 },
      { id: 'line', title: 'FIND THE GAP', how: 'Steer for the gap in each row of rocks. Left stroke to go right, right stroke to go left.', need: 3, ok: w => w === 'line', slow: 1 }],
  2: [{ id: 'back', title: 'BACK-PADDLE', how: 'Swipe UP on a side to brake. It turns you toward that side.', need: 2, ok: w => w === 'back', slow: 1 },
      { id: 'gate', title: 'THROUGH THE GATES', how: 'Go between the two poles of a gate. Line up early: the river carries you.', need: 2, ok: w => w === 'gate' }],
  3: [{ id: 'drop', title: 'OVER THE LEDGE, STRAIGHT', how: 'Go over a ledge through the smooth tongue, pointing straight down the river, or you roll.', need: 2, ok: w => w === 'drop', slow: 1 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0, miss: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonRiver(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
// a lesson needs the right water: gates in the pools for the gate lesson, ledges for the ledge lesson; the river is long enough
function lessonRiver(G) {
  const st = lessonNow(G), RV = G.river, s0 = G.b.s + 25, c = G.cfg; if (!st) return;
  if (st.id === 'gate') { for (let i = 0; i < 10; i++) RV.gates.push({ s: s0 + i * 32, d: (G.rnd() - 0.5) * 6, w: 3.2, got: false, missed: false }); RV.rocks = RV.rocks.filter(r => r.s < s0 - 5 || r.s > s0 + 330); }
  if (st.id === 'drop') { RV.rocks = RV.rocks.filter(r => r.s < s0 - 5 || r.s > s0 + 420); RV.drops = RV.drops.filter(d => d.s < s0 - 5);
    for (let i = 0; i < 10; i++) { const at = s0 + i * 40, td = (G.rnd() - 0.5) * 5; RV.drops.push({ s: at, d: td, w: 4.5, h: 1.2 }); for (let d = -RV.w[at | 0] / 2 + 0.6; d < RV.w[at | 0] / 2 - 0.6; d += 1) if (Math.abs(d - td) > 2.8) RV.rocks.push({ s: at, d, r: 0.5, h: 0.25, ledge: true }); }
    for (let j = 0; j < RV.n; j++) { let y = 0; for (const dp of RV.drops) if (j >= dp.s) y -= dp.h; RV.y[j] = y - j * 0.012; } G.ev.push({ k: 'river' }); }
  RV.len = Math.max(RV.len, G.b.s + 440); G.lessonLen = true;
}
function lessonSee(G, what) {
  const D = G.lesson; if (!D) return; const st = D.steps[D.i]; if (!st.ok(what)) return;
  D.n++; if (D.n < st.need) { G.ev.push({ k: 'lessonok', n: D.n, need: st.need }); return; }
  D.i++; D.n = 0; D.miss = 0;
  if (D.i >= D.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); restartRun(G); }
  else { G.ev.push({ k: 'lessonnext' }); lessonRiver(G); }
}
function lessonMiss(G, why) { const D = G.lesson; if (!D) return; D.miss++; G.ev.push({ k: 'lessonmiss', why, how: D.steps[D.i].how }); }
function restartRun(G) {      // the lessons done, the real run starts from the top
  G.lessonsDone = true; G.rnd = rng(G.seed + 1); G.river = makeRiver(G); Object.assign(G.b, { s: 4, d: 0, h: 0, v: 1, w: 0, roll: 0, stroke: 0, hitT: 0 }); G.lives = G.cfg.lives; G.lost = 0; G.gates = 0; G.queue.length = 0; G.ev.push({ k: 'river' });
}

// ---------- for the robots (bots.js, test_play.py) ----------
// BLIND: a thumb that strokes without looking: left, right, back on the left, back on the right.
const BLIND = {
  L: G => paddle(G, -1, false), R: G => paddle(G, 1, false), l: G => paddle(G, -1, true), r: G => paddle(G, 1, true),
};
// where to steer: the next gap, tongue or gate ahead, else the middle
function lineAhead(G, look = 26) {
  const RV = G.river, b = G.b; let best = null;
  for (const r of RV.rocks) if (r.gap && r.s > b.s + 1 && r.s < b.s + look && (!best || r.s < best.s)) best = { s: r.s, d: r.d };
  for (const dp of RV.drops) if (!dp.done && dp.s > b.s + 1 && dp.s < b.s + look && (!best || dp.s < best.s)) best = { s: dp.s, d: dp.d, drop: true };
  for (const gt of RV.gates) if (!gt.got && !gt.missed && gt.s > b.s + 1 && gt.s < b.s + look && (!best || gt.s < best.s)) best = { s: gt.s, d: gt.d };
  for (const T of RV.trees) if (b.s > T.s - 20 && b.s < T.s + T.len) { const safe = -T.side * 1.5; if (!best) best = { s: b.s + 15, d: safe }; }
  return best || { s: b.s + 20, d: 0 };
}
function lineAhead2(G, t) { let best = null; for (const r of G.river.rocks) if (r.gap && r.s > t.s + 1 && (!best || r.s < best.s)) best = r; return best; }
// HONEST: a person who looks: steers for the next gap, straightens up before a ledge; react = seconds late, acc = how often right.
function honest(G, o, mem) {
  const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, b = G.b, c = G.cfg;
  if (b.stroke > 0.05 || G.queue.length || b.roll > 0) return;
  mem.next = mem.next == null ? 0 : mem.next; if (G.t < mem.next) return;
  const u = rv(G.river.u, b.s), tgt = lineAhead(G), nx = lineAhead2(G, tgt), fwd = Math.max(1.5, u + b.v * Math.cos(b.h));
  let td = tgt.d; if (nx && tgt.s - b.s < 6) td += (nx.d - td) * 0.35;
  for (const T of G.river.trees) if (tgt.s > T.s - 4 && tgt.s < T.s + T.len + 4) { const lim = rv(G.river.w, tgt.s) / 2 - T.reach - 1.2; if (T.side * td > lim) td = T.side * lim; }      // keep off the fallen tree
  // the heading that gets him there in time (he reads it `react` late), and what his boat is already doing
  const tReach = Math.max(0.5, (tgt.s - b.s) / fwd - react), vNeed = (td - b.d) / tReach, push = Math.max(0.8, b.v) + 0.55 * u;
  const want = tgt.drop && tgt.s - b.s < 5 ? 0 : clamp(Math.asin(clamp(vNeed / push, -0.95, 0.95)), -0.8, 0.8);
  const err = want - (b.h + b.w / 2.0), tol = 0.09;
  let side = 0, back = false;
  if (err > tol) side = -1; else if (err < -tol) side = 1; else if (b.v < 2.2) side = (mem.alt = -(mem.alt || 1));
  if (!side) { mem.next = G.t + 0.12; return; }
  if (Math.abs(err) > 0.6 && b.v > 2.4) { back = true; side = -side; }
  if (Math.random() > acc) side = -side;
  paddle(G, side, back, back ? 1 : clamp(Math.abs(err) / 0.32, 0.45, 1));      // a light stroke for a small correction
  mem.next = G.t + react * 0.5 + Math.random() * 0.12;
}
// The shortest real win, for tools/test_controls.py: to just before the end, nothing ahead.
function winNow(G) { if (!G || G.over) return; G.lesson = null; const RV = G.river; RV.len = G.cfg.len; G.b.s = RV.len - 0.05; G.b.d = 0; G.b.h = 0; RV.rocks = RV.rocks.filter(r => r.s < G.b.s - 3); RV.trees = []; RV.drops.forEach(d => d.done = true); }
