
// ===================== RULES: Pour (game 63, set 11: a colour sort, like Water Sort) =====================
// Glasses of coloured layers. Tap a glass to pick it up, then tap another to pour into it: the colour on top pours (all of
// that colour that is on top, as much as fits) onto the same colour or into an empty glass. Sort every colour into a glass
// of its own. Each level has a number of moves (more than the puzzle needs, so there is room to think, not to wander), an
// undo or two, and later HIDDEN layers (only the top colour shows until you uncover what is below) and less spare room.
// A pour that cannot happen wobbles back: the first is free, another soon after costs a move, then two (a slip is cheap).
const RULES = [
  'Tap a glass to pick it up, then tap another to <b>pour</b>. The top colour pours onto the <b>same colour</b> or into an <b>empty</b> glass.',
  'Sort every colour into a glass of its own. A full glass of one colour is <b>done</b>.',
  'Watch your <b>moves</b>. <b>Undo</b> takes back a pour (a few per level).',
  'Later: <b>hidden</b> layers (?) show their colour only when uncovered.',
  'A pour that cannot happen is free once; another soon after costs a move.',
];
const LIQ = ['#ff4a5a', '#ff9a2a', '#ffd83a', '#9ae83a', '#2ab85a', '#2ac8c8', '#4aa8ff', '#3a5aff', '#9a5aff', '#ff6ac8', '#9a6a4a', '#a8a8b8'];
const SYM = ['●', '▲', '■', '◆', '★', '♥', '✚', '▼', '◐', '✿', '☗', '◯'];      // a mark on each colour, for anyone who mixes colours up
const PLACES = [{ name: 'The Lab', bg: ['#e8f4ff', '#c8dcf0'] }, { name: 'The Café', bg: ['#fff0e0', '#f0d4b8'] }, { name: 'The Garden', bg: ['#eaffe8', '#c8e8c8'] }, { name: 'The Night Bar', bg: ['#3a2a5a', '#1a1430'] }];
const placeOf = N => Math.floor((N - 1) / 8) % 4;
const UPGRADES = [
  { id: 'undo', name: 'More undos', desc: 'One more undo on every level.', max: 2, cost: l => 35 + l * 45 },
  { id: 'spare', name: 'A spare glass', desc: 'Once a level: add a small empty glass.', max: 1, cost: l => 90 },
  { id: 'moves', name: 'More moves', desc: 'Three more moves on every level.', max: 2, cost: l => 40 + l * 50 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Beginner'], [40, 'Mixer'], [130, 'Pourer'], [320, 'Sorter'], [700, 'Chemist'], [1500, 'Alchemist']];
const CAP = 4;
function makeCfg(N, help) { const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), e = easyOf(N);
  const K = N === 1 ? 3 : N <= 3 ? 4 : Math.min(10, 5 + Math.floor(f / 9)), empty = 2;
  return { N, f, help: !!help, place: placeOf(N), K, empty, hidden: N >= 6 ? x(0.2, 0.6, 40) : 0, slack: x(1.7, 1.2, 30) + 0.3 * e + (help ? 0.3 : 0),
    undos: (N <= 5 ? 3 : 2) + upLv('undo') + (help ? 1 : 0), extra: 3 * upLv('moves'), spare: upLv('spare') }; }
// ---------- puzzles: random glasses, kept only if the solver can sort them (and it says how many moves that took) ----------
const key = T => T.map(t => t.join('')).sort().join('|');
const topRun = t => { if (!t.length) return 0; const c = t[t.length - 1]; let n = 0; for (let i = t.length - 1; i >= 0 && t[i] === c; i--) n++; return n; };
const done1 = t => !t.length || (t.length === CAP && t.every(c => c === t[0]));
const solved = T => T.every(done1);
function canPour(T, a, b, cap = CAP) { const A = T[a], B = T[b]; if (a === b || !A.length || B.length >= cap) return 0; const c = A[A.length - 1]; if (B.length && B[B.length - 1] !== c) return 0; if (done1(A) && A.length === CAP) return 0; return Math.min(topRun(A), cap - B.length); }
// a small priority queue (lowest first) for the solver
function Heap() { const a = []; return { get size() { return a.length; }, push(x, v) { a.push([v, x]); let i = a.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (a[p][0] <= a[i][0]) break; [a[p], a[i]] = [a[i], a[p]]; i = p; } },
  pop() { const top = a[0], last = a.pop(); if (a.length) { a[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < a.length && a[l][0] < a[m][0]) m = l; if (r < a.length && a[r][0] < a[m][0]) m = r; if (m === i) break; [a[m], a[i]] = [a[i], a[m]]; i = m; } } return top[1]; } }; }
const hOf = T => T.reduce((s, t) => { let k = 0; for (let i = 1; i < t.length; i++) if (t[i] !== t[i - 1]) k++; return s + k + (t.length && !done1(t) ? 1 : 0); }, 0);
// best-first search on the colours it can see (unknown hidden layers are their own colours, so they never match)
function solve(T0, limit = 20000, caps) { const cp = T => T.map(t => t.slice());
  const open = Heap(), seen = new Set([key(T0)]); open.push({ T: cp(T0), g: 0, path: [] }, 2 * hOf(T0)); let n = 0;
  while (open.size && n++ < limit) { const cur = open.pop(); if (solved(cur.T)) return cur.path;
    for (let a = 0; a < cur.T.length; a++) for (let b = 0; b < cur.T.length; b++) { const m = canPour(cur.T, a, b, caps ? caps[b] : CAP); if (!m) continue; if (!cur.T[b].length && topRun(cur.T[a]) === cur.T[a].length) continue;      /* moving a whole one-colour glass into an empty one is pointless */
      const T = cp(cur.T); for (let i = 0; i < m; i++) T[b].push(T[a].pop()); const k = key(T); if (seen.has(k)) continue; seen.add(k); open.push({ T, g: cur.g + 1, path: cur.path.concat([[a, b]]) }, cur.g + 1 + 2 * hOf(T)); } }
  return null; }
function makePuzzle(K, empty, R) { for (let tries = 0; tries < 60; tries++) { const cols = []; for (let c = 0; c < K; c++) for (let i = 0; i < CAP; i++) cols.push(c); for (let i = cols.length - 1; i > 0; i--) { const j = (R() * (i + 1)) | 0; [cols[i], cols[j]] = [cols[j], cols[i]]; }
    const T = []; for (let c = 0; c < K; c++) T.push(cols.slice(c * CAP, c * CAP + CAP)); for (let e = 0; e < empty; e++) T.push([]);
    if (T.some(t => t.length && done1(t))) continue; if (T.some(t => t.length && topRun(t) >= 3)) continue;
    const p = solve(T, 6000 + K * 3000); if (p) return { T, par: p.length }; }
  return null; }
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, place: cfg.place, wait: 0, next: null };
  setup(G); if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else G.ev.push({ k: 'start' });
  return G; }
function setup(G, P) { const c = G.cfg; if (!P) P = makePuzzle(c.K, c.empty, rng(G.N * 7919 + 3 + (G.seed % 7)));
  G.T = P.T.map(t => t.slice()); G.caps = G.T.map(() => CAP); G.par = P.par; G.moves = P.moves != null ? P.moves : Math.ceil(P.par * c.slack + 2) + c.extra; G.movesMax = G.moves;
  // hidden layers: everything below the top colour of a glass, at random, by the level's share
  G.hide = G.T.map(t => t.map((_, i) => i < t.length - topRun(t) && G.rnd() < c.hidden));
  G.sel = -1; G.hist = []; G.undos = P.undos != null ? P.undos : c.undos; G.spare = c.spare; G.fumble = 0; G.fumT = 0; G.phase = 'idle'; G.pt = 0; G.pours = 0; G.done = G.T.map(done1).map((d, i) => d && G.T[i].length > 0); }
// ---------- what you do ----------
function tapGlass(G, i) { if (G.over || G.wait > 0 || G.phase !== 'idle' || i < 0 || i >= G.T.length) return false;
  if (G.sel < 0) { if (!G.T[i].length || G.done[i]) { G.ev.push({ k: 'nothing', i }); return false; } G.sel = i; G.ev.push({ k: 'pick', i }); return true; }
  if (G.sel === i) { G.sel = -1; G.ev.push({ k: 'put', i }); return true; }
  const a = G.sel, m = canPour(G.T, a, i, G.caps[i]); G.sel = -1;
  if (!m) { const cost = G.lesson ? 0 : G.fumble; G.fumble++; G.fumT = 0; G.ev.push({ k: 'nope', a, b: i, cost }); if (G.lesson) { if (G.fumble > 1) lessonMiss(G); } else for (let k = 0; k < cost && G.moves > 0; k++) G.moves--; checkEnd(G); return false; }
  G.hist.push({ T: G.T.map(t => t.slice()), hide: G.hide.map(h => h.slice()) }); const c = G.T[a][G.T[a].length - 1];
  for (let k = 0; k < m; k++) { G.T[i].push(G.T[a].pop()); G.hide[i].push(false); G.hide[a].pop(); }
  // uncover: the new top of the glass poured from shows its colour
  const A = G.T[a]; let rev = false; for (let k = A.length - 1; k >= 0 && k >= A.length - topRun(A); k--) if (G.hide[a][k]) { G.hide[a][k] = false; rev = true; }
  if (!G.lesson) G.moves--; G.pours++; G.phase = 'pour'; G.pt = 0.42 + m * 0.06; G.ev.push({ k: 'pour', a, b: i, n: m, c, rev });
  if (done1(G.T[i]) && G.T[i].length === CAP && !G.done[i]) { G.done[i] = true; G.ev.push({ k: 'full', i, c, n: G.done.filter(Boolean).length }); lessonSee(G, 'full'); }
  lessonSee(G, 'pour'); return true; }
function undo(G) { if (G.over || G.wait > 0 || G.phase !== 'idle' || !G.hist.length || G.undos <= 0) return false; const h = G.hist.pop(); G.T = h.T; G.hide = h.hide; G.undos--; G.sel = -1; G.done = G.T.map((t, i) => done1(t) && t.length > 0); G.ev.push({ k: 'undo' }); return true; }
function addSpare(G) { if (G.spare <= 0 || G.over || G.phase !== 'idle') return false; G.spare--; G.T.push([]); G.caps.push(2); G.hide.push([]); G.done.push(false); G.ev.push({ k: 'spare' }); return true; }
function checkEnd(G) { if (G.over || G.wait > 0) return; if (G.lesson) return;
  if (solved(G.T)) { G.ev.push({ k: 'sorted' }); G.wait = 1.4; G.next = () => finish(G, true); return; }
  if (G.moves <= 0) { G.wait = 0.8; G.next = () => finish(G, false, 'moves'); return; }
  // no pour left anywhere: undo if you can, otherwise it is over (never a game that just sits there)
  let any = false; for (let a = 0; a < G.T.length && !any; a++) for (let b = 0; b < G.T.length; b++) if (canPour(G.T, a, b, G.caps[b])) { any = true; break; }
  if (!any) { if (G.undos > 0 || G.spare > 0) G.ev.push({ k: 'stuck' }); else { G.ev.push({ k: 'stuck', end: true }); G.wait = 1.0; G.next = () => finish(G, false, 'stuck'); } } }
function step(G, dt) { if (G.over || !(dt > 0)) return; G.t += dt; G.fumT += dt; if (G.fumble > 0 && G.fumT > 20) { G.fumble--; G.fumT = 0; }
  if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0) { G.wait = 0; const f = G.next; G.next = null; if (f) f(); } return; }
  if (G.phase === 'pour') { G.pt -= dt; if (G.pt <= 0) { G.phase = 'idle'; checkEnd(G); } } }
function finish(G, win, why) { if (G.over) return true; G.over = win ? 'won' : 'lost'; const left = G.moves, mx = G.movesMax, done = G.done.filter(Boolean).length;
  const stars = win ? 1 + (G.pours <= Math.ceil(G.par * 1.25) ? 1 : 0) + (G.pours <= G.par ? 1 : 0) : 0;
  G.res = { win, why, stars, pours: G.pours, par: G.par, left, done, of: G.cfg.K, coins: win ? 4 + Math.ceil(G.N / 3) + stars * 2 : 1 + done };
  G.ev.push({ k: win ? 'won' : 'lost' }); return true; }
// ---------- LESSONS: small rigged glasses; in a lesson a second wrong pour starts it again, and so does wandering ----------
const LESSONS = {
  1: [{ id: 'pour', title: 'POUR', say: 'TAP ONE, TAP ANOTHER', do: 'tap', how: 'Tap a glass, then another: the top colour pours onto the same colour, or into an empty glass. Fill two glasses with one colour each.', need: 2 }],
  2: [{ id: 'plan', title: 'MAKE ROOM', say: 'USE THE EMPTY ONE', do: 'tap', how: 'Use the empty glass to make room, then sort all three colours. Every move counts!', need: 1 }],
  3: [{ id: 'undo', title: 'UNDO', say: 'TAP UNDO', do: 'tap', how: 'Stuck? Tap UNDO to take back a pour. Sort the colours: there is a trap, so think first.', need: 1 }],
};
const LRIG = { pour: { T: [[0, 1, 0, 1], [1, 0, 1, 0], [], []], par: 6 }, plan: { T: [[0, 1, 2, 0], [1, 2, 0, 1], [2, 0, 1, 2], [], []], par: 0 }, undo: { T: [[0, 1, 2, 3], [3, 2, 1, 0], [2, 0, 3, 1], [1, 3, 0, 2], [], []], par: 0 } };
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonDeal(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonDeal(G) { const st = lessonNow(G), r = LRIG[st.id], par = r.par || solve(r.T, 30000).length; const c = G.cfg, keep = c.hidden; c.hidden = 0;
  setup(G, { T: r.T, par, moves: 99, undos: st.id === 'undo' ? 5 : 0 }); c.hidden = keep; G.lesson.n = 0; G.lesson.left = par + 3; }
function lessonMiss(G) { G.ev.push({ k: 'lessonmiss', how: lessonNow(G).how }); G.wait = 1.2; G.next = () => lessonDeal(G); }
function lessonSee(G, what) { const st = lessonNow(G); if (!st) return; const D = G.lesson;
  if (what === 'pour') { D.left--; if (solved(G.T) || (st.id === 'pour' && G.done.filter(Boolean).length >= 2)) return done(); if (D.left <= 0) { lessonMiss(G); } return; }
  if (what === 'full') G.ev.push({ k: 'lessonok', n: G.done.filter(Boolean).length, need: st.id === 'pour' ? 2 : G.cfg.K });
  function done() { D.i++; if (D.i >= D.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.wait = 1.6; G.next = () => { setup(G); G.ev.push({ k: 'start' }); }; } else { G.wait = 1.2; G.next = () => lessonDeal(G); } } }
// ---------- for the robots ----------
// BLIND: a thumb that does not look: taps a glass somewhere; taps undo
const BLIND = { t: G => tapGlass(G, (Math.random() * G.T.length) | 0), u: G => undo(G) };
// a player who looks and thinks: plans with what it can see (hidden layers are unknowns), takes the first pour of its plan;
// a careless one now and then pours something that looked good on its own
function seenT(G) { let u = 100; return G.T.map((t, i) => t.map((c, k) => G.hide[i][k] ? u++ : c)); }
function honest(G, o, mem) { const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random;
  if (G.over || G.wait > 0 || G.phase !== 'idle') { mem.t = 0; return; } mem.t = (mem.t || 0) + 1 / 60; if (mem.t < 0.4 + react * 2) return; mem.t = 0;
  if (G.sel >= 0) { tapGlass(G, mem.to); return; }
  const S = seenT(G); let mv = null;
  if (R() < acc) { const p = solveSeen(S, G.caps, 1500 + acc * 2500); if (p && p.length) mv = p[0]; }
  if (!mv) { const ms = []; for (let a = 0; a < S.length; a++) for (let b = 0; b < S.length; b++) { const m = canPour(S, a, b, G.caps[b]); if (m && !(S[b].length === 0 && topRun(S[a]) === S[a].length)) ms.push([a, b, (S[b].length ? 3 : 1) + m]); }
    if (!ms.length) { if (G.undos > 0) undo(G); return; } ms.sort((x, y) => y[2] - x[2]); mv = R() < 0.6 ? ms[0] : ms[(R() * ms.length) | 0]; }
  mem.to = mv[1]; tapGlass(G, mv[0]); }
// planning when some layers are unknown: aim for the state where every glass is one colour as far as it can see
function solveSeen(S, caps, limit) { if (!S.some(t => t.some(c => c >= 100))) return solve(S, limit, caps); const cp = T => T.map(t => t.slice());
  const open = Heap(), seen = new Set([key(S)]); open.push({ T: cp(S), g: 0, path: [] }, 2 * hOf(S)); let best = null, bh = hOf(S), n = 0;
  while (open.size && n++ < limit) { const cur = open.pop(), hv = hOf(cur.T); if (cur.path.length && (hv < bh || (hv === bh && best && cur.path.length < best.length))) { bh = hv; best = cur.path; }
    for (let a = 0; a < cur.T.length; a++) for (let b = 0; b < cur.T.length; b++) { const m = canPour(cur.T, a, b, caps[b]); if (!m) continue; if (!cur.T[b].length && topRun(cur.T[a]) === cur.T[a].length) continue; const T = cp(cur.T); for (let i = 0; i < m; i++) T[b].push(T[a].pop()); const k = key(T); if (seen.has(k)) continue; seen.add(k); open.push({ T, g: cur.g + 1, path: cur.path.concat([[a, b]]) }, cur.g + 1 + 2 * hOf(T)); } }
  return best; }
function winNow(G) { if (!G || G.over || G.wait > 0) return; G.lesson = null; finish(G, true); }
