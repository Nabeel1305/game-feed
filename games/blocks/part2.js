
// ===================== RULES: Block Party (game 64, set 11: a block puzzle, like Block Blast) =====================
// An 8 by 8 grid and a tray of three pieces. Drag a piece onto the grid; when all three are down, three more come. A full
// row or column clears (several at once score much more). Clearing again within your next few placements builds a COMBO
// that multiplies the score. It ends when none of the pieces in the tray fits anywhere. Each level has a goal: a score, or
// GEMS to collect (a gem in a cell is collected when its row or column clears). Later: junk blocks already on the board,
// bigger and awkward pieces, more gems.
const RULES = [
  '<b>Drag</b> a piece from the tray onto the grid. Three placed, three more come.',
  'Fill a whole <b>row or column</b> and it clears. Several at once score far more.',
  'Clear again within your next placements for a <b>COMBO</b>.',
  'Collect <b>gems</b> 💎 by clearing the row or column they sit in.',
  'It is over when no piece in the tray fits. Keep room for the big ones!',
];
const GRID = 8;
const SHAPES = {      // cells as [row, col]
  o1: [[0, 0]], i2: [[0, 0], [0, 1]], i3: [[0, 0], [0, 1], [0, 2]], i4: [[0, 0], [0, 1], [0, 2], [0, 3]], i5: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]],
  o2: [[0, 0], [0, 1], [1, 0], [1, 1]], o3: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]], r23: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]],
  l3: [[0, 0], [1, 0], [1, 1]], l4: [[0, 0], [1, 0], [2, 0], [2, 1]], l5: [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]], t4: [[0, 0], [0, 1], [0, 2], [1, 1]], s4: [[0, 1], [0, 2], [1, 0], [1, 1]] };
const rot = cells => { const r = cells.map(([a, b]) => [b, -a]), mr = Math.min(...r.map(c => c[0])), mc = Math.min(...r.map(c => c[1])); return r.map(([a, b]) => [a - mr, b - mc]); };
const KINDS = []; for (const [k, s] of Object.entries(SHAPES)) { let c = s; const seen = new Set(); for (let i = 0; i < 4; i++) { const key = JSON.stringify(c.slice().sort()); if (!seen.has(key)) { seen.add(key); KINDS.push({ k, cells: c }); } c = rot(c); } }
const BCOL = ['#ff5a6a', '#ff9a3a', '#ffd23a', '#5ad86a', '#3ac8d8', '#4a8aff', '#a85aff', '#ff6ac8'];
const PLACES = [{ name: 'The Toy Box', bg: ['#2a3a6a', '#1a2448'] }, { name: 'The Arcade', bg: ['#3a1a5a', '#1a0e30'] }, { name: 'The Beach', bg: ['#1a6a8a', '#0e3a50'] }, { name: 'The Garden', bg: ['#2a5a3a', '#14301e'] }];
const placeOf = N => Math.floor((N - 1) / 6) % 4;
const UPGRADES = [
  { id: 'reroll', name: 'Reroll', desc: 'Once a level: swap the tray for three new pieces.', max: 1, cost: l => 60 },
  { id: 'bomb', name: 'Bomb', desc: 'Once a level: clear a 3 by 3 square.', max: 1, cost: l => 90 },
  { id: 'small', name: 'Kind pieces', desc: 'A few more small pieces.', max: 2, cost: l => 40 + l * 50 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Beginner'], [40, 'Stacker'], [130, 'Builder'], [320, 'Architect'], [700, 'Master builder'], [1500, 'Legend']];
function makeCfg(N, help) { const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), e = easyOf(N);
  const goal = N <= 2 ? 'score' : N === 3 ? 'gems' : (N % 3 === 0 ? 'score' : 'gems');      /* gems only once the gem lesson (level 3) has shown them */
  return { N, f, help: !!help, place: placeOf(N), goal, gems: Math.round(x(4, 10, 30)), target: Math.round(x(700, 2000, 60) / 50) * 50, junk: N >= 4 ? Math.round(x(4, 12, 30)) : 0,
    big: x(0.06, 0.2, 30) * (help ? 0.7 : 1), small: 0.15 * upLv('small') + 0.15 * e + (help ? 0.15 : 0), reroll: upLv('reroll'), bomb: upLv('bomb') }; }
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, place: cfg.place, wait: 0, next: null };
  setup(G); if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else G.ev.push({ k: 'start' });
  return G; }
const idx = (r, c) => r * GRID + c;
function setup(G, o = {}) { const c = G.cfg, R = G.rnd; G.b = Array(GRID * GRID).fill(null); G.gem = Array(GRID * GRID).fill(false); G.score = 0; G.streak = 0; G.since = 0; G.placed = 0; G.lines = 0; G.gemsGot = 0; G.best = 0; G.rerolls = c.reroll; G.bombs = c.bomb; G.arm = false;
  if (!o.empty) { for (let j = 0; j < c.junk; j++) { const i = (R() * GRID * GRID) | 0; G.b[i] = { col: 8 }; }      /* junk: grey blocks already there */
    if (c.goal === 'gems') { G.gemN = c.gems; let put = 0, n = 0; const usedR = new Set(), usedC = new Set(); while (put < Math.min(c.gems, 10) && n++ < 400) { const i = (R() * GRID * GRID) | 0; if (G.gem[i]) continue; if (n < 300 && (usedR.has((i / GRID) | 0) || usedC.has(i % GRID))) continue; usedR.add((i / GRID) | 0); usedC.add(i % GRID);      /* no two gems share a row or column: each one is its own clear */ G.gem[i] = true; if (!G.b[i]) G.b[i] = { col: 9 }; put++; } G.gemPending = c.gems - put; } }
  G.tray = o.tray || deal(G); if (!o.empty) fullCheck(G, true); }
// three new pieces; when the board is tight, at least one of them fits (if any piece could)
function deal(G) { const c = G.cfg, R = G.rnd, pick = () => { let pool = KINDS; const u = R(); if (u < c.small) pool = KINDS.filter(k => k.cells.length <= 3); else if (u > 1 - c.big) pool = KINDS.filter(k => k.cells.length >= 6); else pool = KINDS.filter(k => k.cells.length >= 2 && k.cells.length <= 5); const k = pool[(R() * pool.length) | 0]; return { cells: k.cells, k: k.k, col: (R() * 8) | 0, id: Math.random() }; };
  let t; for (let n = 0; n < 12; n++) { t = [pick(), pick(), pick()]; if (t.some(p => anyFit(G, p))) break; } G.ev.push({ k: 'deal' }); return t; }
const fits = (G, p, r, c) => p.cells.every(([a, b]) => { const rr = r + a, cc = c + b; return rr >= 0 && rr < GRID && cc >= 0 && cc < GRID && !G.b[idx(rr, cc)]; });
function anyFit(G, p) { for (let r = 0; r < GRID; r++) for (let c = 0; c < GRID; c++) if (fits(G, p, r, c)) return true; return false; }
// ---------- what you do ----------
function place(G, ti, r, c) { if (G.over || G.wait > 0) return false; const p = G.tray[ti]; if (!p) return false;
  if (!fits(G, p, r, c)) { G.ev.push({ k: 'nofit', ti });
    // in a lesson a wrong drop comes back once; a second one soon after starts the lesson over (blind dragging can't pass it)
    // a second wrong drop soon after the first costs points, then more (a person who looks hardly ever does it twice; a thumb
    // dragging blind does it all the time, so blind luck never adds up to a score)
    if (!G.lesson) { const quick = G.t - (G.fumT == null ? -9 : G.fumT) < 3; G.fumT = G.t; G.fumble = quick ? (G.fumble | 0) + 1 : 0; if (G.fumble) { const cost = Math.min(G.score, 25 * G.fumble); G.score -= cost; G.ev.push({ k: 'fumble', cost }); } }
    if (G.lesson) { G.lmiss = G.t - (G.lmissT == null ? -9 : G.lmissT) < 3 ? (G.lmiss | 0) + 1 : 1; G.lmissT = G.t; if (G.lmiss >= 2) { G.lmiss = 0; G.ev.push({ k: 'lessonmiss', how: lessonNow(G).how }); G.wait = 1.2; G.next = () => lessonDeal(G); } }
    return false; }
  for (const [a, b] of p.cells) G.b[idx(r + a, c + b)] = { col: p.col, born: G.t };
  G.tray[ti] = null; G.placed++; G.score += p.cells.length; G.ev.push({ k: 'place', ti, r, c, cells: p.cells, col: p.col });
  const cleared = clearLines(G); if (cleared) { G.streak++; G.since = 0; } else { G.since++; if (G.since >= 3 && G.streak) { G.ev.push({ k: 'streakend', n: G.streak }); G.streak = 0; } }
  lessonSee(G, cleared ? 'clear' : 'noclear', cleared);
  if (G.tray.every(t => !t)) G.tray = deal(G);
  if (!goalCheck(G)) fullCheck(G); return true; }
function clearLines(G) { const rows = [], cols = []; for (let r = 0; r < GRID; r++) { let f = true; for (let c = 0; c < GRID; c++) if (!G.b[idx(r, c)]) { f = false; break; } if (f) rows.push(r); }
  for (let c = 0; c < GRID; c++) { let f = true; for (let r = 0; r < GRID; r++) if (!G.b[idx(r, c)]) { f = false; break; } if (f) cols.push(c); }
  const n = rows.length + cols.length; if (!n) return 0; const set = new Set(); rows.forEach(r => { for (let c = 0; c < GRID; c++) set.add(idx(r, c)); }); cols.forEach(c => { for (let r = 0; r < GRID; r++) set.add(idx(r, c)); });
  const cells = [], gems = []; for (const i of set) { cells.push({ i, col: G.b[i].col }); if (G.gem[i]) { G.gem[i] = false; G.gemsGot++; gems.push(i); } G.b[i] = null; }
  const mult = 1 + G.streak, pts = 10 * n * (n + 1) / 2 * 2 * mult; G.score += pts; G.lines += n; G.best = Math.max(G.best, n);
  G.ev.push({ k: 'clear', rows, cols, cells, n, pts, streak: G.streak + 1, gems });
  // more gems appear as some are taken, until the level's number is reached
  for (let k = 0; k < gems.length && G.gemPending > 0; k++) { const free = []; for (let i = 0; i < GRID * GRID; i++) if (!G.b[i] && !G.gem[i]) free.push(i); if (!free.length) break; const i = free[(G.rnd() * free.length) | 0]; G.gem[i] = true; G.b[i] = { col: 9 }; G.gemPending--; G.ev.push({ k: 'gemnew', i }); }
  return n; }
function goalCheck(G) { if (G.lesson || G.over || G.wait > 0) return false; const c = G.cfg; const met = c.goal === 'score' ? G.score >= c.target : G.gemsGot >= c.gems;
  if (met) { G.ev.push({ k: 'goal' }); G.wait = 1.3; G.next = () => finish(G, true); return true; } return false; }
function fullCheck(G, first) { if (G.over || G.wait > 0) return; const live = G.tray.filter(Boolean); if (live.some(p => anyFit(G, p))) return;
  if (G.lesson) { G.ev.push({ k: 'lessonmiss', how: lessonNow(G).how }); G.wait = 1.2; G.next = () => lessonDeal(G); return; }
  if (G.rerolls > 0 || G.bombs > 0) { G.ev.push({ k: 'stuck' }); return; }
  G.ev.push({ k: 'full' }); G.wait = 1.2; G.next = () => finish(G, false); }
function reroll(G) { if (G.rerolls <= 0 || G.over || G.wait > 0) return false; G.rerolls--; G.tray = deal(G); G.ev.push({ k: 'reroll' }); fullCheck(G); return true; }
function bomb(G, r, c) { if (G.bombs <= 0 || G.over || G.wait > 0) return false; G.bombs--; const cells = []; for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const rr = r + a, cc = c + b; if (rr < 0 || cc < 0 || rr >= GRID || cc >= GRID) continue; const i = idx(rr, cc); if (G.b[i]) { if (G.gem[i]) { G.gem[i] = false; G.gemsGot++; } cells.push({ i, col: G.b[i].col }); G.b[i] = null; } }
  G.ev.push({ k: 'bomb', r, c, cells }); if (!goalCheck(G)) fullCheck(G); return true; }
function step(G, dt) { if (G.over || !(dt > 0)) return; G.t += dt; if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0) { G.wait = 0; const f = G.next; G.next = null; if (f) f(); } } }
function finish(G, win) { if (G.over) return true; G.over = win ? 'won' : 'lost'; const c = G.cfg, ratio = c.goal === 'score' ? G.score / c.target : G.gemsGot / c.gems;
  const stars = win ? 1 + (G.placed <= (c.goal === 'score' ? c.target / 18 : c.gems * 4.2) ? 1 : 0) + (G.best >= 2 ? 1 : 0) : 0;
  G.res = { win, stars, score: G.score, gems: G.gemsGot, goal: c.goal, need: c.goal === 'score' ? c.target : c.gems, prog: Math.min(1, ratio), lines: G.lines, best: G.best, placed: G.placed, coins: win ? 4 + Math.ceil(G.N / 3) + stars * 2 : 1 + Math.floor(Math.min(1, ratio) * 4) };
  G.ev.push({ k: win ? 'won' : 'lost' }); return true; }
// ---------- LESSONS: rigged boards; every placement must clear a line, or the lesson starts again ----------
const LESSONS = {
  1: [{ id: 'line', title: 'FILL A LINE', say: G => blockCue(G) ? blockCue(G).say : 'NO ROOM: TAP 🔄', do: 'drag', at: G => blockCue(G) ? blockCue(G).at : false, how: 'Drag a piece from the tray into the gap: a full row or column clears! Clear three times in a row.', need: 3 }],
  2: [{ id: 'two', title: 'TWO AT ONCE', say: G => blockCue(G) ? blockCue(G).say : 'NO ROOM: TAP 🔄', do: 'drag', at: G => blockCue(G) ? blockCue(G).at : false, how: 'Place the piece where it fills a row AND a column: both clear, for far more points. Do it twice.', need: 2 }],
  3: [{ id: 'gem', title: 'GEMS', say: G => blockCue(G) ? blockCue(G).say : 'NO ROOM: TAP 🔄', do: 'drag', at: G => blockCue(G) ? blockCue(G).at : false, how: 'Clear the rows and columns with gems 💎 in them to collect the gems. Collect three.', need: 3 }],
};
// THE TUTORIAL'S HAND DRAGS THE RIGHT PIECE TO THE RIGHT SPOT (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing
// happens"). It drew a drag upward in a little box; a drag up from the tray seldom clears anything. Now the hand starts on the piece that
// clears (two lines for TWO AT ONCE, a gem for GEMS) and ends where the finger must let go (the piece rides above the finger: liftOf).
const BCUE = { key: '', v: null };
function blockCue(G) { const key = G.b.join('') + '|' + G.tray.map(p => p ? p.cells.join(';') : '-').join('/') + '|' + (G.lesson ? G.lesson.i : 'x'); if (BCUE.key === key) return BCUE.v;
  const id = G.lesson && lessonNow(G) ? lessonNow(G).id : 'line'; let best = null, bv = -1e9;
  for (let ti = 0; ti < 3; ti++) { const p = G.tray[ti]; if (!p) continue; for (let r = 0; r < GRID; r++) for (let c = 0; c < GRID; c++) { if (!fits(G, p, r, c)) continue; const T = tryPlace(G, p, r, c), v = (id === 'two' ? (T.n >= 2 ? 100 : T.n * 10) : id === 'gem' ? T.gems * 100 + T.n * 10 : T.n * 100) + boardScore(T.B) * 0.01; if (v > bv) { bv = v; best = { ti, r, c, p, T }; } } }
  let v = null; if (best) { const L = lay(), w = 1 + Math.max(...best.p.cells.map(q => q[1])), h = 1 + Math.max(...best.p.cells.map(q => q[0]));
    v = { say: best.T.n ? (id === 'gem' && best.T.gems ? 'DRAG IT HERE: 💎' : 'DRAG IT HERE') : 'DRAG ONE ON', at: [L.slot(best.ti), (L.ty + L.py) / 2, L.bx + best.c * L.cs + w * L.cs / 2, L.by + best.r * L.cs + liftOf(L) + h * L.cs / 2] }; }
  BCUE.key = key; BCUE.v = v; return v; }
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonDeal(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
// a board with one row (and for "two" a row and a column) nearly full, the tray holding the piece that finishes it and two others
function lessonDeal(G, keepN) { const st = lessonNow(G), R = G.rnd; if (!keepN) G.lesson.n = 0; setup(G, { empty: true, tray: [] });
  const r = 2 + ((R() * 4) | 0), c0 = (R() * 5) | 0, len = st.id === 'line' ? 2 + ((R() * 2) | 0) : 1;
  for (let c = 0; c < GRID; c++) if (c < c0 || c >= c0 + len) G.b[idx(r, c)] = { col: (c % 7) }; let key = { cells: Array.from({ length: len }, (_, k) => [0, k]), col: 5, id: Math.random() };
  if (st.id === 'two') { const cc = c0; for (let rr = 0; rr < GRID; rr++) if (rr !== r) G.b[idx(rr, cc)] = { col: (rr % 7) }; }
  if (st.id === 'gem') { const cs = []; for (let c = 0; c < GRID; c++) if (G.b[idx(r, c)]) cs.push(c); G.gem[idx(r, cs[(R() * cs.length) | 0])] = true; }      /* one gem a board: three boards in a row */
  const filler = () => ({ cells: KINDS[(R() * KINDS.length) | 0].cells, col: (R() * 8) | 0, id: Math.random() }); G.tray = [filler(), filler(), filler()]; G.tray[(R() * 3) | 0] = key; }
function lessonSee(G, what, n) { const st = lessonNow(G); if (!st) return; const D = G.lesson;
  if (what === 'noclear') { G.ev.push({ k: 'lessonmiss', how: st.how }); G.wait = 1.2; G.next = () => lessonDeal(G); return; }
  let ok = st.id === 'line' || (st.id === 'two' && n >= 2) || (st.id === 'gem' && G.gemsGot > 0);
  if (!ok) { G.ev.push({ k: 'lessonmiss', how: st.how }); G.wait = 1.2; G.next = () => lessonDeal(G); return; }
  D.n += 1; G.ev.push({ k: 'lessonok', n: Math.min(D.n, st.need), need: st.need });
  if (D.n >= st.need) { D.i++; G.wait = 1.4; if (D.i >= D.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.next = () => { G.rnd = rng(G.seed); setup(G); G.ev.push({ k: 'start' }); }; } else G.next = () => lessonDeal(G); }
  else { G.wait = 0.8; G.next = () => lessonDeal(G, true); } }
// ---------- for the robots ----------
// BLIND: a thumb that does not look: drags a piece from the tray to somewhere on the grid
const BLIND = { d: G => { const ti = (Math.random() * 3) | 0; place(G, ti, (Math.random() * GRID) | 0, (Math.random() * GRID) | 0); } };
// a player who looks: tries every piece in every place, judging the board after (lines cleared, gems taken, room left for
// the big pieces, no lonely holes); a careless one sometimes just puts a piece somewhere it fits
const PROBES = ['i5', 'o3', 'l5', 'i4', 'r23', 'o2'].flatMap(k => KINDS.filter(q => q.k === k)).map(q => q.cells);
function boardScore(B) { let v = 0; const at = (r, c) => r < 0 || c < 0 || r >= GRID || c >= GRID || B[idx(r, c)];
  // room for every awkward shape: some place for each is what matters (log), not many places for one
  for (const cells of PROBES) { let n = 0; for (let r = 0; r < GRID; r++) for (let c = 0; c < GRID; c++) { let ok = true; for (const [a, b] of cells) { const rr = r + a, cc = c + b; if (rr >= GRID || cc >= GRID || B[idx(rr, cc)]) { ok = false; break; } } if (ok) n++; } v += Math.log1p(n) * 2.2; }
  for (let r = 0; r < GRID; r++) for (let c = 0; c < GRID; c++) if (!B[idx(r, c)]) { const n = (at(r - 1, c) ? 1 : 0) + (at(r + 1, c) ? 1 : 0) + (at(r, c - 1) ? 1 : 0) + (at(r, c + 1) ? 1 : 0); if (n >= 3) v -= 2.5; if (n === 4) v -= 3; }
  let filled = 0; for (let i = 0; i < GRID * GRID; i++) if (B[i]) filled++; v -= filled * 0.12;
  return v; }
function tryPlace(G, p, r, c) { const B = G.b.slice(), Gm = G.gem.slice(); for (const [a, b] of p.cells) B[idx(r + a, c + b)] = 1; let n = 0, gems = 0; const full = [];
  for (let rr = 0; rr < GRID; rr++) { let f = true; for (let cc = 0; cc < GRID; cc++) if (!B[idx(rr, cc)]) { f = false; break; } if (f) { n++; for (let cc = 0; cc < GRID; cc++) full.push(idx(rr, cc)); } }
  for (let cc = 0; cc < GRID; cc++) { let f = true; for (let rr = 0; rr < GRID; rr++) if (!B[idx(rr, cc)]) { f = false; break; } if (f) { n++; for (let rr = 0; rr < GRID; rr++) full.push(idx(rr, cc)); } }
  for (const i of full) { if (Gm[i]) { gems++; Gm[i] = false; } B[i] = null; } return { B, n, gems }; }
// a player who looks a little ahead: for its best few first placements, where would the rest of the tray then go?
function bestFor(B, Gm, p, gemGoal) { let bv = -1e9, best = null; const G2 = { b: B, gem: Gm };
  for (let r = 0; r < GRID; r++) for (let c = 0; c < GRID; c++) { if (!fits(G2, p, r, c)) continue; const T = tryPlace(G2, p, r, c), v = T.n * 14 + T.n * T.n * 4 + (gemGoal ? T.gems * 30 : 0) + boardScore(T.B); if (v > bv) { bv = v; best = { r, c, T, v }; } }
  return best; }
function honest(G, o, mem) { const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random;
  if (G.over || G.wait > 0) { mem.t = 0; return; } mem.t = (mem.t || 0) + 1 / 60; if (mem.t < 0.5 + react * 2.2) return; mem.t = 0;
  const gemGoal = G.cfg.goal === 'gems' || (G.lesson && lessonNow(G).id === 'gem'), cands = [];
  for (let ti = 0; ti < 3; ti++) { const p = G.tray[ti]; if (!p) continue; for (let r = 0; r < GRID; r++) for (let c = 0; c < GRID; c++) { if (!fits(G, p, r, c)) continue; const T = tryPlace(G, p, r, c);
    cands.push({ ti, r, c, T, v: T.n * 14 + T.n * T.n * 4 + (gemGoal ? T.gems * 30 : 0) + boardScore(T.B) + (G.streak && T.n ? 6 : 0) + R() * (1 - acc) * 25 }); } }
  if (!cands.length) { if (G.rerolls > 0) reroll(G); return; }
  cands.sort((a, b) => b.v - a.v); let best = cands[0], bv = -1e9;
  if (R() < acc) for (const cd of cands.slice(0, 8)) { let v = cd.v, B = cd.T.B; const Gm = G.gem.slice(); for (let k = 0; k < 3; k++) { if (k === cd.ti || !G.tray[k]) continue; const b2 = bestFor(B, Gm, G.tray[k], gemGoal); if (!b2) { v -= 60; break; } v += b2.T.n * 10; B = b2.T.B; } v += boardScore(B) * 0.6; if (v > bv) { bv = v; best = cd; } }
  let { ti, r, c } = best; if (R() > acc + (1 - acc) * 0.5) r += R() < 0.5 ? 1 : -1;      /* a slip of the finger: one off (if it does not fit, it comes back) */
  place(G, ti, r, c); }
function winNow(G) { if (!G || G.over || G.wait > 0) return; G.lesson = null; G.gemsGot = G.cfg.gems; G.score = Math.max(G.score, G.cfg.target); finish(G, true); }
