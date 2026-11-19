
// ===================== RULES: Origami (game 59, mine for set 10: the calm one) =====================
// A square of paper on a table. Each step of a model is one fold. Put your thumb on the paper and drag: the paper folds along
// the line halfway between where your thumb went down and where it is now, so the corner you hold follows your thumb (real
// paper: you bring a corner to a point and crease). The faint outline shows the shape the paper should make; early on the
// corner to hold glows and a dot shows where it goes. Let go: close to the outline and the fold is made (snapped neat, and
// graded: PERFECT, NEAT, or a bit rough); too far off and the paper springs back, crumpled a little. Three crumples and it tears.
// The last fold made, the animal comes to life and goes on your shelf. Later: no dot, then no glow (only the outline), less
// room for error, longer models.
const RULES = [
  '<b>Drag a corner</b> of the paper: it folds and follows your thumb.',
  'Make it match the <b>faint outline</b>, then let go. Early on a <b>glow</b> shows the corner and a <b>dot</b> where it goes.',
  'Land close for a <b>PERFECT</b> fold. Too far off and the paper <b>crumples</b>; three crumples and it tears.',
  'Finish the model and it comes to life on your <b>shelf</b>. Stars for neat folding.',
];
const R2 = Math.SQRT2;
const DIAMOND = [[0, R2], [R2, 0], [0, -R2], [-R2, 0]], SQUARE = [[-1, 1], [1, 1], [1, -1], [-1, -1]];
// each model: a start shape and its folds, each fold "bring point P to point Q" (P a corner of the paper as it is then)
// each fold is written as its crease (two points on it) and the corner that goes over (P); the place it lands (Q) is worked out
const T0 = [0, R2], RT = [R2, 0], B0 = [0, -R2], LT = [-R2, 0];
const MODELS0 = [
  { id: 'fox', name: 'FOX', col: '#e8742a', start: DIAMOND, folds: [[[-2, 0], [2, 0], T0], [B0, [0.85, 0], RT], [B0, [-0.85, 0], LT]], eyes: [[-0.22, -0.35], [0.22, -0.35]], nose: [0, -1.25] },
  { id: 'dog', name: 'PUPPY', col: '#b07a4a', start: DIAMOND, folds: [[[-2, 0], [2, 0], T0], [[0.5, 0.2], [0.72, -0.8], RT], [[-0.5, 0.2], [-0.72, -0.8], LT], [[-1, -0.95], [1, -0.95], B0]], eyes: [[-0.25, -0.3], [0.25, -0.3]], nose: [0, -0.8] },
  { id: 'cat', name: 'CAT', col: '#5a6a8a', start: DIAMOND, folds: [[[-2, 0], [2, 0], T0], [B0, [1.05, 0], RT], [B0, [-1.05, 0], LT], [[-1, -0.9], [1, -0.9], B0]], eyes: [[-0.25, -0.3], [0.25, -0.3]], nose: [0, -0.72], whisk: true },
  { id: 'whale', name: 'WHALE', col: '#3a7ab8', start: DIAMOND, folds: [[[-2, 0.6], [2, 0.6], T0], [[-2, -0.6], [2, -0.6], B0], [[-0.85, -1], [-0.85, 1], LT], [[0.2, -0.6], [1.0, 0.6], RT]], eyes: [[-0.55, 0.1]], spout: [-0.45, 0.95] },
  { id: 'fish', name: 'FISH', col: '#e8b83a', start: DIAMOND, folds: [[[-2, 0.55], [2, 0.55], T0], [[-2, -0.55], [2, -0.55], B0], [[-0.4, -0.55], [-1.0, 0.55], LT]], eyes: [[0.7, 0.12]], bubble: [1.35, 0.6] },
  { id: 'bird', name: 'BIRD', col: '#d84a5a', start: DIAMOND, folds: [[[-2, 0], [2, 0], T0], [B0, [-0.4, 0], LT], [[0.9, -1], [0.9, 1], RT]], eyes: [[-0.2, 0.12]] },
];
const reflectPt = (A, B, P) => { const t = [B[0] - A[0], B[1] - A[1]], L = Math.hypot(t[0], t[1]); t[0] /= L; t[1] /= L; const v = [P[0] - A[0], P[1] - A[1]], d = v[0] * t[0] + v[1] * t[1], f = [A[0] + t[0] * d, A[1] + t[1] * d]; return [2 * f[0] - P[0], 2 * f[1] - P[1]]; };
const MODELS = MODELS0.map(m => Object.assign({}, m, { folds: m.folds.map(([A, B, P]) => [P, reflectPt(A, B, P)]) }));
const PLACES = [{ name: 'The Tea House', table: '#7a5034' }, { name: 'The Garden', table: '#5a6a3a' }, { name: 'The Temple', table: '#6a2a2a' }, { name: 'The Studio', table: '#4a4a52' }];
const placeOf = N => Math.floor((N - 1) / 6) % 4;
const UPGRADES = [
  { id: 'bone', name: 'Bone folder', desc: 'A little more room for error.', max: 2, cost: l => 35 + l * 45 },
  { id: 'spare', name: 'Strong paper', desc: 'One more crumple before it tears.', max: 1, cost: l => 70 },
  { id: 'guide', name: 'A teacher', desc: 'The dot stays on for longer.', max: 1, cost: l => 60 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Beginner'], [40, 'Apprentice'], [130, 'Paper folder'], [320, 'Craftsman'], [700, 'Master'], [1500, 'Sensei']];
// a level: one model or two in a row; hints fade (dot, then glow), room for error shrinks
function makeCfg(N, help) { const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), e = easyOf(N);
  const order = [0, 1, 3, 2, 4, 5], m1 = order[(N - 1) % 6], m2 = N >= 13 ? order[(N + 2) % 6] : null;
  return { N, f, help: !!help, place: placeOf(N), models: m2 == null ? [m1] : [m1, m2], tol: x(0.42, 0.07, 22) * (1 + 0.12 * upLv('bone')) * (help ? 1.25 : 1) + 0.08 * e,
    dot: N <= 4 + 3 * upLv('guide') || help, glow: N <= 9 || help, crumples: (N <= 3 ? 4 : 3) + upLv('spare') + (help ? 1 : 0) }; }
// ---------- paper geometry: faces are convex polygons, each with which side is up and its height in the stack ----------
const dot2 = (a, b) => a[0] * b[0] + a[1] * b[1];
function lineOf(P, Q) { const n = [Q[0] - P[0], Q[1] - P[1]], L = Math.hypot(n[0], n[1]) || 1; n[0] /= L; n[1] /= L; return { p: [(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2], n }; }      /* the crease: halfway from P to Q, square to PQ; P's side moves */
const sideOf = (ln, x) => dot2([x[0] - ln.p[0], x[1] - ln.p[1]], ln.n);
function clipFace(pts, ln, keep) { const out = []; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length], da = sideOf(ln, a) * keep, db = sideOf(ln, b) * keep;      /* keep = 1: the side that stays (Q's side); -1: the flap that moves (P's) */
    if (da >= 0) out.push(a); if ((da >= 0) !== (db >= 0)) { const t = da / (da - db); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); } } return out.length >= 3 ? out : null; }
const reflect = (ln, x) => { const d = sideOf(ln, x); return [x[0] - 2 * d * ln.n[0], x[1] - 2 * d * ln.n[1]]; };
function foldFaces(faces, ln, u = 1) {      /* u: 1 is fully folded; between 0 and 1 the flap is part way over (seen from above: squashed toward the crease) */
  const out = [], top = Math.max(0, ...faces.map(f => f.z)); const c = Math.cos(Math.PI * u);
  for (const f of faces) { const k = clipFace(f.pts, ln, 1); if (k) out.push({ pts: k, up: f.up, z: f.z });
    const m = clipFace(f.pts, ln, -1); if (m) out.push({ pts: m.map(x => { const d = sideOf(ln, x), dd = d * c; return [x[0] - (d - dd) * ln.n[0], x[1] - (d - dd) * ln.n[1]]; }), up: u > 0.5 ? 1 - f.up : f.up, z: u > 0.5 ? top + 1 + (top - f.z) : f.z + 0.001, moving: true }); }
  return out.sort((a, b) => a.z - b.z); }
function corners(faces) { const all = []; for (const f of faces) for (const p of f.pts) all.push(p); return all; }
// the target: where the next fold's corner is and where it goes, worked out from the model on the paper as it is now
function stepNow(G) { const m = MODELS[G.mi], fd = m.folds[G.si]; return fd ? { P: fd[0], Q: fd[1], ln: lineOf(fd[0], fd[1]) } : null; }
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, place: cfg.place, wait: 0, next: null, grades: [], made: [] };
  G.queue = cfg.models.slice(); G.crum = 0; startModel(G, G.queue.shift());
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else G.ev.push({ k: 'start' });
  return G; }
function startModel(G, mi) { G.mi = mi; G.si = 0; G.faces = [{ pts: MODELS[mi].start.map(p => p.slice()), up: 1, z: 0 }];      /* white side up: folds show the colour */ G.drag = null; G.ev.push({ k: 'model', name: MODELS[mi].name }); }
// ---------- what you do: put the thumb down, drag, let go (all in paper units: the square is 2 across) ----------
function grab(G, x, y) { if (G.over || G.wait > 0) return false; G.drag = { a: [x, y], b: [x, y] }; return true; }
function pull(G, x, y) { if (!G.drag) return false; G.drag.b = [x, y]; return true; }
function release(G) { const d = G.drag; G.drag = null; if (!d || G.over || G.wait > 0) return false; const st = stepNow(G); if (!st) return false;
  if (Math.hypot(d.b[0] - d.a[0], d.b[1] - d.a[1]) < 0.12) return false;      /* a tap, not a fold */
  if (G.lesson && Math.hypot(d.a[0] - st.P[0], d.a[1] - st.P[1]) > 0.4) { G.ev.push({ k: 'takecorner' }); return false; }      /* while learning: start on the glowing corner */
  const ln = lineOf(d.a, d.b), tl = st.ln;
  // how far is your crease from the right one, over the stretch of paper it crosses; and is the right side moving
  const pts = corners(G.faces).filter(p => Math.abs(sideOf(tl, p)) < 1e9); let err = 0; const ends = creaseEnds(G, tl);
  for (const e of ends) err = Math.max(err, Math.abs(sideOf(ln, e)));
  const same = dot2(ln.n, tl.n) > 0.3;      /* the flap you lifted is the one that should go over */
  if (!same || err > G.cfg.tol) { G.crum++; G.ev.push({ k: 'crumple', n: G.crum, of: G.cfg.crumples, err, wrong: !same }); fault(G); return false; }
  const g = err < G.cfg.tol * 0.3 ? 2 : err < G.cfg.tol * 0.65 ? 1 : 0; G.grades.push(g);
  const before = G.faces; G.faces = foldFaces(G.faces, tl, 1); G.si++; G.ev.push({ k: 'fold', g, ln: tl, from: before }); lessonSee(G, 'fold', g);
  if (G.si >= MODELS[G.mi].folds.length) { G.made.push(G.mi); G.ev.push({ k: 'alive', mi: G.mi }); lessonSee(G, 'model'); if (G.lesson) return true;
    G.wait = 1.8; G.next = () => { if (G.queue.length) startModel(G, G.queue.shift()); else finish(G, true); }; }
  return true; }
function creaseEnds(G, ln) { let lo = 1e9, hi = -1e9; const t = [-ln.n[1], ln.n[0]];
  for (const f of G.faces) for (let i = 0; i < f.pts.length; i++) { const a = f.pts[i], b = f.pts[(i + 1) % f.pts.length], da = sideOf(ln, a), db = sideOf(ln, b);
    if ((da >= 0) !== (db >= 0) || da === 0) { const u = da === db ? 0 : da / (da - db), x = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u], s = dot2([x[0] - ln.p[0], x[1] - ln.p[1]], t); lo = Math.min(lo, s); hi = Math.max(hi, s); } }
  if (lo > hi) return [ln.p]; return [[ln.p[0] + t[0] * lo, ln.p[1] + t[1] * lo], [ln.p[0] + t[0] * hi, ln.p[1] + t[1] * hi]]; }
function fault(G) { if (G.lesson) { if (G.crum >= G.cfg.crumples) G.crum = G.cfg.crumples - 1; return; }
  if (G.crum >= G.cfg.crumples) { G.ev.push({ k: 'tear' }); G.wait = 1.2; G.next = () => finish(G, false); } }
function finish(G, win) { if (G.over) return true; G.over = win ? 'won' : 'lost'; const n = G.grades.length, neat = n ? G.grades.reduce((a, b) => a + b, 0) / (2 * n) : 0;
  const stars = win ? 1 + (neat >= 0.5 ? 1 : 0) + (neat >= 0.8 && G.crum === 0 ? 1 : 0) : 0;
  G.res = { win, stars, neat: Math.round(neat * 100), made: G.made.slice(), crum: G.crum, perfect: G.grades.filter(g => g === 2).length, folds: n, coins: win ? 4 + Math.ceil(G.N / 3) + stars * 2 : 1 + G.made.length };
  G.ev.push({ k: win ? 'won' : 'lost' }); return true; }
function step(G, dt) { if (G.over || !(dt > 0)) return; G.t += dt; if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0) { G.wait = 0; const f = G.next; G.next = null; if (f) f(); } } }
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'fold', title: 'YOUR FIRST FOX', how: 'Put your thumb on the glowing corner and drag it onto the dot: the paper follows your thumb. Let go on the dot. Three folds make a fox.', need: 1 }],
  2: [{ id: 'ghost', title: 'MATCH THE OUTLINE', how: 'Drag the glowing corner until the paper fits the dashed outline, then let go. Make a whole puppy.', need: 1 }],
  3: [{ id: 'neat', title: 'NEAT AND PERFECT', how: 'Land a fold right on the outline for a PERFECT. Make two perfect folds.', need: 2 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonDeal(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonDeal(G) { G.lesson.n = 0; G.crum = 0; G.grades = []; startModel(G, lessonNow(G).id === 'ghost' ? 1 : 0); }
function lessonSee(G, what, g) { const st = lessonNow(G); if (!st) return; let ok = false;
  if (st.id === 'fold' && what === 'model') ok = true;
  if (st.id === 'ghost' && what === 'model') ok = true;
  if (st.id === 'neat' && what === 'fold' && g === 2) { G.lesson.n++; if (G.lesson.n >= st.need) ok = true; }
  if (st.id === 'neat' && what === 'model' && !ok) { G.wait = 1.2; G.next = () => lessonDeal(G); G.ev.push({ k: 'lessonmiss', how: st.how }); return; }
  if (!ok) return;
  G.lesson.i++; if (G.lesson.i >= G.lesson.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.wait = 1.6; G.next = () => { G.grades = []; G.made = []; G.crum = 0; G.queue = G.cfg.models.slice(); startModel(G, G.queue.shift()); G.ev.push({ k: 'start' }); }; } else { G.wait = 1.2; G.next = () => lessonDeal(G); } }
// ---------- for the robots ----------
// BLIND: a thumb that does not look: a drag from somewhere on the paper to somewhere else
const rp = () => [(Math.random() * 2 - 1) * 1.3, (Math.random() * 2 - 1) * 1.3];
const BLIND = { d: G => { const a = rp(), b = rp(); grab(G, a[0], a[1]); pull(G, b[0], b[1]); release(G); }, s: G => { const a = rp(), b = [a[0] + (Math.random() - 0.5) * 1.2, a[1] + (Math.random() - 0.5) * 1.2]; grab(G, a[0], a[1]); pull(G, b[0], b[1]); release(G); }, t: G => { const a = rp(); grab(G, a[0], a[1]); release(G); } };
// a player who looks: takes a moment, puts the thumb on the corner (a little off) and lets go near the right place; how near
// depends on how steady they are, and on whether a dot shows the place (without one, they judge it from the outline)
function honest(G, o, mem) { const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random, c = G.cfg;
  if (G.over || G.wait > 0) { mem.t = 0; return; } mem.t = (mem.t || 0) + 1 / 60; if (mem.t < 0.6 + react * 2.5) return; mem.t = 0;
  const st = stepNow(G); if (!st) return; const gs = () => { let s = 0; for (let i = 0; i < 4; i++) s += R(); return (s - 2) / 1.15; };
  const sd = (1 - acc) * 0.22 + 0.02 + (c.dot ? 0 : 0.04) + (c.glow ? 0 : 0.02), a = [st.P[0] + gs() * 0.05, st.P[1] + gs() * 0.05], b = [st.Q[0] + gs() * sd, st.Q[1] + gs() * sd];
  grab(G, a[0], a[1]); pull(G, b[0], b[1]); release(G); }
function winNow(G) { if (!G || G.over || G.wait > 0) return; G.lesson = null; G.made.push(G.mi); G.grades.push(2); finish(G, true); }
