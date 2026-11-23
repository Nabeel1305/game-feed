
// ===================== RULES: Sugar Swap (game 60, set 11: "really simple, really engaging", like Candy Crush) =====================
// A board of sweets. Swipe a sweet into its neighbour to swap them; if that makes a line of three or more of one colour, they
// pop, the sweets above fall into the gaps and new ones drop in from the top (which can set off more lines: a cascade). A swap
// that makes no line swaps back and costs nothing. Each level has a goal and a number of moves.
// Specials: a line of FOUR makes a STRIPED sweet (pop it and it clears its whole row or column); an L or T of five makes a
// WRAPPED sweet (it blows up everything round it); a line of FIVE makes a COLOUR BOMB (swap it with a sweet and every sweet of
// that colour goes). Swapping two specials together makes a bigger effect (stripe + stripe: a cross; stripe + wrap: three
// rows and three columns; wrap + wrap: a huge blast; bomb + stripe: every sweet of that colour turns striped and fires; bomb +
// bomb: the whole board).
// Goals: a score; clear the JELLY (pop the sweets that sit on it); bring the CHERRIES down and out of the bottom; COLLECT
// sweets of a colour; break the FROSTING (blocks broken by pops beside them). Caged sweets cannot be moved until a pop frees
// them. Goal done: every move left becomes a striped sweet and fires (the SUGAR RUSH).
const RULES = [
  '<b>Swipe</b> a sweet into its neighbour to swap. Make a line of <b>three</b> of a colour and they pop.',
  'Line up <b>four</b>: a <b>striped</b> sweet (clears a row or column). An <b>L or T</b>: a <b>wrapped</b> sweet (a blast). <b>Five</b> in a row: a <b>colour bomb</b>.',
  'Swap two specials together for a <b>bigger</b> effect.',
  'Each level has a <b>goal</b> and a number of <b>moves</b>: clear the jelly, bring the cherries down, collect sweets, break the frosting.',
  'Goal done with moves left: they turn into striped sweets for a <b>Sugar Rush</b>. Stars for moves to spare.',
];
const COLS6 = ['#ff4a5a', '#ff9a2a', '#ffd23a', '#4ac85a', '#3a9aff', '#a85ae8'];
const PLACES = [{ name: 'Lollipop Lane', sky: ['#ffb8d8', '#ffe8f4'] }, { name: 'Toffee Town', sky: ['#ffc898', '#fff0d8'] }, { name: 'Mint Meadow', sky: ['#a8e8d0', '#e8fff6'] }, { name: 'Candy Castle', sky: ['#c8b0ff', '#f0e8ff'] }];
const placeOf = N => Math.floor((N - 1) / 8) % 4;
const UPGRADES = [
  { id: 'extra', name: 'Extra moves', desc: 'Two more moves on every level.', max: 2, cost: l => 40 + l * 50 },
  { id: 'start', name: 'Striped start', desc: 'Begin each level with a striped sweet.', max: 1, cost: l => 70 },
  { id: 'hint', name: 'Quick hints', desc: 'Hints show sooner.', max: 1, cost: l => 30 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Sweet tooth'], [40, 'Candy fan'], [130, 'Sugar spinner'], [320, 'Confectioner'], [700, 'Candy master'], [1500, 'Sugar royalty']];
const C = 8, R = 9;
// ---------- the levels: a goal, a shape, blockers, moves (seeded by the level, the same every time) ----------
const GOALS = ['jelly', 'collect', 'cherry', 'frost', 'jelly', 'score', 'collect', 'cherry', 'frost', 'jelly'];
const SHAPES = [
  () => true,
  (r, c) => !((r === 0 || r === R - 1) && (c === 0 || c === C - 1)),      // cut corners
  (r, c) => !(r < 2 && (c < 2 || c > C - 3)),      // a notch top left and right
  (r, c) => !(r >= 3 && r <= 5 && (c === 0 || c === C - 1)),      // a waist
  (r, c) => !((r === 4) && (c === 3 || c === 4)),      // a hole in the middle
];
function makeCfg(N, help) { const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), e = easyOf(N);
  const goal = N === 1 || N === 2 ? 'collect' : N === 3 ? 'jelly' : GOALS[(N - 4) % GOALS.length], cols = N <= 5 ? 5 : 6;
  return { N, f, help: !!help, place: placeOf(N), goal, cols, shape: N <= 3 ? 0 : (N * 7) % SHAPES.length, hard: x(0, 1, 30),
    moves: 0, extra: 2 * upLv('extra') + (help ? 4 : 0), stripeStart: upLv('start') > 0 }; }
// build the board of a level: returns the layout (shape, jelly, frost, cages, cherries) and the goal numbers
function layout(G) { const c = G.cfg, Rn = rng(G.N * 7919 + 17), N = G.N, h = c.hard, sh = SHAPES[c.shape];
  const L = { hole: [], jelly: [], frost: [], lock: [], target: 0, moves: 0, collect: null, cherries: 0 };
  for (let r = 0; r < R; r++) for (let q = 0; q < C; q++) { const i = r * C + q; L.hole[i] = !sh(r, q); L.jelly[i] = 0; L.frost[i] = 0; L.lock[i] = false; }
  const cells = () => { const a = []; for (let i = 0; i < R * C; i++) if (!L.hole[i]) a.push(i); return a; };
  if (c.goal === 'score') { L.target = Math.round(N <= 2 ? 4200 + 600 * N : 9000 + 9000 * h); L.moves = N <= 2 ? 16 : Math.round(20 - 3 * h); }
  if (c.goal === 'jelly') { const two = N >= 12 && Rn() < 0.6, pat = N === 3 ? 0 : Math.floor(Rn() * 4);
    for (const i of cells()) { const r = Math.floor(i / C), q = i % C; let on = false;
      if (pat === 0) on = r >= 3 && r <= 5 && q >= 2 && q <= 5; if (pat === 1) on = r >= R - 3; if (pat === 2) on = q <= 1 || q >= C - 2; if (pat === 3) on = (r + q) % 2 === 0 && r >= 2;
      if (N === 3) on = r >= 6 && q >= 1 && q <= 6; if (on) L.jelly[i] = two && (r + q) % 3 === 0 ? 2 : 1; }
    const n = L.jelly.reduce((a, b) => a + b, 0); L.moves = Math.round(N === 3 ? 22 : 12 + n * (0.84 - 0.24 * h)); }
  if (c.goal === 'collect') { const k = N >= 14 ? 2 : 1, cs = []; while (cs.length < k) { const v = (Rn() * c.cols) | 0; if (!cs.includes(v)) cs.push(v); }
    L.collect = cs.map(v => ({ col: v, n: N <= 2 ? 22 + 3 * N : Math.round((k === 2 ? 16 : 22) + 18 * h), got: 0 })); const tot = L.collect.reduce((a, b) => a + b.n, 0); L.moves = N <= 2 ? 16 : Math.round(tot * (0.62 - 0.17 * h) / k + 6); }
  if (c.goal === 'cherry') { L.cherries = Math.round(2 + 2 * h); L.moves = Math.round(L.cherries * (12 - 3 * h) + 10); }
  if (c.goal === 'frost') { const two = N >= 10; for (const i of cells()) { const r = Math.floor(i / C), q = i % C;
      if ((r >= R - 3 && (q + r) % 2 === 0) || (Rn() < 0.12 * h && r > 2)) L.frost[i] = two && Rn() < 0.4 ? 2 : 1; }
    const n = L.frost.reduce((a, b) => a + b, 0); L.moves = Math.round(14 + n * (1.1 - 0.3 * h)); }
  // cages from level 9 on, a few
  if (N >= 9) { const k = Math.round(2 + 6 * h); for (let j = 0; j < k; j++) { const i = cells()[(Rn() * cells().length) | 0]; if (!L.frost[i] && Math.floor(i / C) > 1) L.lock[i] = true; } }
  L.moves += c.extra; return L; }
let UID = 1;
const newCandy = (col, sp = null) => ({ id: UID++, col, sp });
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, place: cfg.place, wait: 0, next: null };
  setup(G); if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else G.ev.push({ k: 'start' });
  return G; }
function setup(G, L0) { G_ = G; const L = L0 || layout(G); G.L = L; G.b = []; for (let i = 0; i < R * C; i++) G.b.push({ hole: L.hole[i], jelly: L.jelly[i], frost: L.frost[i], lock: L.lock[i], k: null });
  G.moves = L.moves; G.movesMax = L.moves; G.score = 0; G.target = L.target; G.collect = L.collect ? L.collect.map(x => Object.assign({}, x)) : null; G.cherT = L.cherries; G.cherOut = 0; G.cherOn = 0;
  G.jelly0 = jellyLeft(G); G.frost0 = frostLeft(G); G.phase = 'idle'; G.pt = 0; G.casc = 0; G.fumble = 0; G.fumT = 0; G.done = false; G.rush = false; G.swapAt = null; G.idle = 0; G.made = { h: 0, w: 0, b: 0 }; G.bigCasc = 0; G.movesAtGoal = null;
  for (let i = 0; i < R * C; i++) if (!G.b[i].hole && !G.b[i].frost) G.b[i].k = newCandy(randCol(G, i));
  if (G.cherT) { const tops = []; for (let q = 1; q < C - 1; q++) { const t = topCell(q), i = t >= 0 ? t + 2 * C : -1; if (i >= 0 && !G.b[i].hole && !G.b[i].frost && !G.b[i].lock) tops.push(i); } for (let j = 0; j < Math.min(2, G.cherT) && tops.length; j++) { const i = tops.splice((G.rnd() * tops.length) | 0, 1)[0]; G.b[i].k = newCandy(-1, 'cherry'); G.cherOn++; } }
  if (G.cfg.stripeStart && !G.lesson) { const cand = G.b.map((c, i) => i).filter(i => G.b[i].k && G.b[i].k.col >= 0 && !G.b[i].lock); const i = cand[(G.rnd() * cand.length) | 0]; G.b[i].k.sp = G.rnd() < 0.5 ? 'h' : 'v'; }
  if (!findMoves(G).length) shuffle(G); }
const idx = (r, c) => r * C + c, rowOf = i => Math.floor(i / C), colOf = i => i % C;
const inB = (r, c) => r >= 0 && r < R && c >= 0 && c < C;
let G_ = null;      // the game being worked on (so the small helpers need not be passed it)
function topCell(q) { for (let r = 0; r < R; r++) if (!G_.b[idx(r, q)].hole) return idx(r, q); return -1; }
// a colour that does not make a line where it lands (for the start and for refills nothing special is needed)
function randCol(G, i) { G_ = G; const r = rowOf(i), q = colOf(i), cl = j => { const k = G.b[j] && G.b[j].k; return k ? k.col : -9; }; let v, n = 0;
  do { v = (G.rnd() * G.cfg.cols) | 0; n++; } while (n < 20 && ((q >= 2 && cl(i - 1) === v && cl(i - 2) === v) || (r >= 2 && cl(i - C) === v && cl(i - 2 * C) === v))); return v; }
const jellyLeft = G => G.b.reduce((a, c) => a + c.jelly, 0), frostLeft = G => G.b.reduce((a, c) => a + c.frost, 0);
const movable = (G, i) => { const c = G.b[i]; return c && !c.hole && !c.frost && !c.lock && c.k; };
const colAt = (G, i) => { const k = G.b[i].k; return k && k.sp !== 'b' && k.sp !== 'cherry' ? k.col : -9; };
// ---------- lines ----------
function findGroups(G) { const runs = [];
  for (let r = 0; r < R; r++) { let s = 0; for (let q = 1; q <= C; q++) { const a = colAt(G, idx(r, s)), b = q < C ? colAt(G, idx(r, q)) : -10; if (b !== a || a < 0) { if (a >= 0 && q - s >= 3) { const cs = []; for (let k = s; k < q; k++) cs.push(idx(r, k)); runs.push({ d: 'h', cells: cs }); } s = q; } } }
  for (let q = 0; q < C; q++) { let s = 0; for (let r = 1; r <= R; r++) { const a = colAt(G, idx(s, q)), b = r < R ? colAt(G, idx(r, q)) : -10; if (b !== a || a < 0) { if (a >= 0 && r - s >= 3) { const cs = []; for (let k = s; k < r; k++) cs.push(idx(k, q)); runs.push({ d: 'v', cells: cs }); } s = r; } } }
  // join runs that share a sweet (an L or a T)
  const groups = []; for (const run of runs) { let g = groups.find(x => run.cells.some(i => x.cells.has(i))); if (!g) { g = { cells: new Set(), runs: [] }; groups.push(g); } run.cells.forEach(i => g.cells.add(i)); g.runs.push(run); }
  for (let a = 0; a < groups.length; a++) for (let b = a + 1; b < groups.length; b++) if ([...groups[b].cells].some(i => groups[a].cells.has(i))) { groups[b].cells.forEach(i => groups[a].cells.add(i)); groups[a].runs.push(...groups[b].runs); groups.splice(b, 1); b = a; }
  return groups; }
function hasLineAt(G, i) { const v = colAt(G, i); if (v < 0) return false; const r = rowOf(i), q = colOf(i); let h = 1, k = q - 1; while (k >= 0 && colAt(G, idx(r, k)) === v) { h++; k--; } k = q + 1; while (k < C && colAt(G, idx(r, k)) === v) { h++; k++; }
  let w = 1; k = r - 1; while (k >= 0 && colAt(G, idx(k, q)) === v) { w++; k--; } k = r + 1; while (k < R && colAt(G, idx(k, q)) === v) { w++; k++; } return h >= 3 || w >= 3; }
// every swap that does something (for hints, the shuffle, and the robots)
function findMoves(G) { const out = []; for (let i = 0; i < R * C; i++) { if (!movable(G, i)) continue; for (const j of [colOf(i) < C - 1 ? i + 1 : -1, rowOf(i) < R - 1 ? i + C : -1]) { if (j < 0 || !movable(G, j)) continue;
      const a = G.b[i].k, b = G.b[j].k; if (a.sp === 'cherry' && b.sp === 'cherry') continue;
      if (a.sp === 'b' || b.sp === 'b' || (isFx(a) && isFx(b))) { out.push([i, j]); continue; }
      G.b[i].k = b; G.b[j].k = a; const ok = hasLineAt(G, i) || hasLineAt(G, j); G.b[i].k = a; G.b[j].k = b; if (ok) out.push([i, j]); } } return out; }
const isFx = k => k && (k.sp === 'h' || k.sp === 'v' || k.sp === 'w');
function shuffle(G) { const ids = []; for (let i = 0; i < R * C; i++) if (movable(G, i) && G.b[i].k.col >= 0 && !G.b[i].k.sp) ids.push(i);
  for (let n = 0; n < 60; n++) { const cols = ids.map(i => G.b[i].k.col); for (let a = cols.length - 1; a > 0; a--) { const b = (G.rnd() * (a + 1)) | 0; [cols[a], cols[b]] = [cols[b], cols[a]]; } ids.forEach((i, j) => G.b[i].k.col = cols[j]);
    if (!findGroups(G).length && findMoves(G).length) break; if (n > 40) ids.forEach(i => G.b[i].k.col = randCol(G, i)); }
  G.ev.push({ k: 'shuffle' }); }
// ---------- what you do ----------
function swap(G, i, j) { if (G.over || G.wait > 0 || G.phase !== 'idle' || G.done) return false; G_ = G;
  if (i < 0 || j < 0 || i >= R * C || j >= R * C) return false; const dr = Math.abs(rowOf(i) - rowOf(j)), dc = Math.abs(colOf(i) - colOf(j)); if (dr + dc !== 1) return false;
  if (!movable(G, i) || !movable(G, j)) { G.ev.push({ k: 'stuck', i: movable(G, i) ? j : i }); return false; }
  const a = G.b[i].k, b = G.b[j].k; G.b[i].k = b; G.b[j].k = a; G.swapAt = [i, j]; G.phase = 'swap'; G.pt = 0.15; G.idle = 0; G.ev.push({ k: 'swap', i, j }); return true; }
// ---------- the engine: swap, pop, fall, again ----------
function step(G, dt) { if (G.over || !(dt > 0)) return; G.t += dt; G_ = G; if (G.done) dt *= G.fast ? 4 : 1.6;      /* the Sugar Rush runs quick, quicker still if he taps */
  if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0) { G.wait = 0; const f = G.next; G.next = null; if (f) f(); } return; }
  G.fumT += dt; if (G.fumble > 0 && G.fumT > 20) { G.fumble--; G.fumT = 0; }      /* recent misses fade, one per twenty quiet seconds */
  if (G.phase === 'idle') { G.idle += dt; if (G.moves <= 0 && !G.done && !G.lesson && !G.over) { G.wait = 0.6; G.next = () => finish(G, false); } return; }
  G.pt -= dt; if (G.pt > 0) return;
  if (G.phase === 'swap') { const [i, j] = G.swapAt, a = G.b[j].k, b = G.b[i].k;      /* a was at i, now at j */
    if (combo(G, i, j, a, b)) { useMove(G); return; }
    if (findGroups(G).length) { useMove(G); G.casc = 0; resolve(G); return; }
    G.b[i].k = a; G.b[j].k = b; G.phase = 'back'; G.pt = 0.15; G.swapAt = null;
    // a swap that makes no line: the first is free; another soon after costs a move (a slip is cheap, a habit is not)
    // a slip is cheap, a habit is not: the first miss is free, the next soon after costs a move, the one after two, and so on
    // (fading by one every twenty quiet seconds). While learning, a second quick miss starts the lesson board again instead.
    const cost = G.fumble; G.fumble = cost + 1; G.fumT = 0;
    if (G.lesson) { G.ev.push({ k: 'nope', i, j, cost: 0 }); if (cost > 0) { G.fumble = 0; lessonMiss(G); } return; }
    for (let n = 0; n < cost && G.moves > 0; n++) useMove(G); G.ev.push({ k: 'nope', i, j, cost }); return; }
  if (G.phase === 'back') { G.phase = 'idle'; return; }
  if (G.phase === 'pop') { fall(G); return; }
  if (G.phase === 'fall') { G.swapAt = null; if (exitCherries(G)) return; if (findGroups(G).length) { G.casc++; resolve(G); return; } settle(G); return; }
  if (G.phase === 'rush') { rushStep(G); return; } }
function useMove(G) { if (!G.lesson && !G.done) G.moves--; G.ev.push({ k: 'move', left: G.moves }); }
// pop the lines on the board (and everything their specials set off)
function resolve(G) { const groups = findGroups(G), clear = new Set(), born = []; G.casc = G.casc || 0;
  for (const g of groups) { const cells = [...g.cells], long = Math.max(...g.runs.map(r => r.cells.length)), cross = g.runs.some(r => r.d === 'h') && g.runs.some(r => r.d === 'v');
    let sp = null; if (long >= 5) sp = 'b'; else if (cross && cells.length >= 5) sp = 'w'; else if (long === 4) sp = g.runs.find(r => r.cells.length === 4).d === 'h' ? 'v' : 'h';
    let at = null; if (sp) { const sw = G.swapAt ? G.swapAt.filter(i => g.cells.has(i)) : []; at = sw.length ? sw[sw.length - 1] : cells[(cells.length / 2) | 0]; if (cross && !sw.length) { const ru = g.runs; for (const i of ru[0].cells) if (ru.slice(1).some(r => r.cells.includes(i))) at = i; } }
    const col = colAt(G, cells[0]);
    for (const i of cells) if (i !== at) clear.add(i);
    if (sp) born.push({ at, sp, col: sp === 'b' ? -1 : col, was: G.b[at].k });
    // frosting beside a line cracks
    for (const i of cells) for (const n of nbrs(i)) if (G.b[n].frost) hitFrost(G, n); }
  blow(G, clear, born.map(s => s.at));
  for (const s of born) { if (G.b[s.at].k == null || clear.has(s.at)) G.b[s.at].k = newCandy(s.col, s.sp); else { G.b[s.at].k.sp = s.sp; G.b[s.at].k.col = s.col; } if (G.b[s.at].lock) { G.b[s.at].lock = false; } G.made[s.sp === 'h' || s.sp === 'v' ? 'h' : s.sp]++; G.ev.push({ k: 'made', i: s.at, sp: s.sp }); lessonSee(G, 'made', s.sp); }
  G.phase = 'pop'; G.pt = 0.24; }
const nbrs = i => { const r = rowOf(i), q = colOf(i), o = []; if (q > 0) o.push(i - 1); if (q < C - 1) o.push(i + 1); if (r > 0) o.push(i - C); if (r < R - 1) o.push(i + C); return o.filter(j => !G_.b[j].hole); };
function hitFrost(G, i) { const c = G.b[i]; if (!c.frost || c.hitAt === G.t) return; c.hitAt = G.t; c.frost--; G.score += 100; G.ev.push({ k: 'frost', i, left: c.frost }); if (!c.frost) lessonSee(G, 'frost'); }
// clear a set of cells; specials in it go off and add more (a striped clears its row or column, a wrapped its surroundings,
// a bomb hit by a blast a whole colour). Cherries are never popped. Cages are unlocked instead of popping their sweet.
function blow(G, set, keep = []) { const todo = [...set], seen = new Set(), pops = [], mult = 1 + G.casc;
  while (todo.length) { const i = todo.shift(); if (seen.has(i) || keep.includes(i)) continue; seen.add(i); const c = G.b[i]; if (!c || c.hole) continue;
    if (c.frost) { hitFrost(G, i); continue; }
    const k = c.k; if (!k) continue; if (k.sp === 'cherry') continue;
    if (c.lock) { c.lock = false; G.ev.push({ k: 'unlock', i }); G.score += 60; continue; }
    if (k.sp === 'h' || k.sp === 'v') { const r = rowOf(i), q = colOf(i); for (let n = 0; n < (k.sp === 'h' ? C : R); n++) todo.push(k.sp === 'h' ? idx(r, n) : idx(n, q)); G.ev.push({ k: 'beam', i, d: k.sp }); lessonSee(G, 'beam'); }
    if (k.sp === 'w') { const r = rowOf(i), q = colOf(i); for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) if (Math.abs(a) + Math.abs(b) <= 2 && inB(r + a, q + b)) todo.push(idx(r + a, q + b)); G.ev.push({ k: 'blast', i, big: false }); }
    if (k.sp === 'b') { const v = mostCol(G); const tg = []; for (let n = 0; n < R * C; n++) if (colAt(G, n) === v) { todo.push(n); tg.push(n); } G.ev.push({ k: 'zap', i, to: tg }); }
    c.k = null; pops.push({ i, col: k.col, sp: k.sp, id: k.id });
    if (c.jelly) { c.jelly--; G.score += 100; G.ev.push({ k: 'jelly', i, left: c.jelly }); }
    if (G.collect) for (const x of G.collect) if (x.col === k.col && x.got < x.n) { x.got++; G.ev.push({ k: 'got', i, col: k.col }); }
    G.score += 60 * mult + (k.sp ? 120 : 0); }
  if (pops.length) G.ev.push({ k: 'pop', cells: pops, casc: G.casc });
  return pops.length; }
function mostCol(G) { const n = Array(6).fill(0); for (let i = 0; i < R * C; i++) { const v = colAt(G, i); if (v >= 0) n[v]++; } return n.indexOf(Math.max(...n)); }
// two specials (or a bomb) swapped together
function combo(G, i, j, a, b) { const A = a.sp, B = b.sp, fx = s => s === 'h' || s === 'v' || s === 'w';
  if (A !== 'b' && B !== 'b' && !(fx(A) && fx(B))) return false;
  G.casc = 0; const set = new Set(), r = rowOf(j), q = colOf(j);
  if (A === 'b' && B === 'b') { for (let n = 0; n < R * C; n++) set.add(n); G.ev.push({ k: 'mega' }); }
  else if (A === 'b' || B === 'b') { const bomb = A === 'b' ? j : i, other = A === 'b' ? b : a, v = other.col; const tg = [];
    if (fx(other.sp)) { for (let n = 0; n < R * C; n++) if (colAt(G, n) === v && G.b[n].k) { G.b[n].k.sp = other.sp === 'w' ? 'w' : (G.rnd() < 0.5 ? 'h' : 'v'); set.add(n); tg.push(n); } }
    else if (other.sp === 'cherry') { set.add(bomb); }
    else for (let n = 0; n < R * C; n++) if (colAt(G, n) === v) { set.add(n); tg.push(n); }
    G.b[bomb].k.sp = null; G.b[bomb].k.col = -2; set.add(bomb); G.ev.push({ k: 'zap', i: bomb, to: tg, big: fx(other.sp) }); }
  else { G.b[i].k.sp = null; G.b[j].k.sp = null;      /* their effects are replaced by the combined one */
    const sw = A === 'w' && B === 'w', sx = (A === 'w') !== (B === 'w');
    if (sw) { for (let x = -2; x <= 2; x++) for (let y = -2; y <= 2; y++) if (inB(r + x, q + y)) set.add(idx(r + x, q + y)); G.ev.push({ k: 'blast', i: j, big: true }); }
    else if (sx) { for (let d = -1; d <= 1; d++) { for (let n = 0; n < C; n++) if (inB(r + d, n)) set.add(idx(r + d, n)); for (let n = 0; n < R; n++) if (inB(n, q + d)) set.add(idx(n, q + d)); } G.ev.push({ k: 'beam', i: j, d: 'h', wide: true }); G.ev.push({ k: 'beam', i: j, d: 'v', wide: true }); }
    else { for (let n = 0; n < C; n++) set.add(idx(r, n)); for (let n = 0; n < R; n++) set.add(idx(n, q)); G.ev.push({ k: 'beam', i: j, d: 'h' }); G.ev.push({ k: 'beam', i: j, d: 'v' }); }
    set.add(i); set.add(j); }
  G.ev.push({ k: 'combo', a: A, b: B }); lessonSee(G, 'combo');
  blow(G, set); G.phase = 'pop'; G.pt = 0.3; return true; }
// gravity: sweets fall straight down; where a blocker (frosting, a cage, a hole) stops them, a sweet slides in from the side
function fall(G) { let maxD = 0; const moved = new Map(); const fed = i => { let r = rowOf(i) - 1, q = colOf(i); while (r >= 0) { const c = G.b[idx(r, q)]; if (c.frost || c.lock) return false; if (c.hole) { for (let u = r - 1; u >= 0; u--) if (!G.b[idx(u, q)].hole) return false; return true; } r--; } return true; };      /* can something drop into cell i from the top of its column? */
  for (let pass = 0; pass < 200; pass++) { let any = false;
    for (let r = R - 2; r >= 0; r--) for (let q = 0; q < C; q++) { const i = idx(r, q); if (!movable(G, i)) continue; const j = i + C;
      if (r + 1 < R && !G.b[j].hole && !G.b[j].frost && !G.b[j].k) { G.b[j].k = G.b[i].k; G.b[i].k = null; moved.set(G.b[j].k.id, (moved.get(G.b[j].k.id) || 0) + 1); any = true; } }
    if (any) continue;
    // fill the tops of the columns
    for (let q = 0; q < C; q++) { const t = topCell(q); if (t >= 0 && !G.b[t].k && !G.b[t].frost) { G.b[t].k = newCandy(G.cherT && G.cherOn + G.cherOut < G.cherT && G.cherOn < 2 && G.rnd() < 0.15 && q > 0 && q < C - 1 ? -1 : (G.rnd() * G.cfg.cols) | 0); if (G.b[t].k.col === -1) { G.b[t].k.sp = 'cherry'; G.cherOn++; } G.b[t].k.fresh = true; moved.set(G.b[t].k.id, 1.5); any = true; } }
    if (any) continue;
    // a sweet slides in diagonally to an empty cell nothing can fall into from above
    for (let r = R - 2; r >= 0 && !any; r--) for (let q = 0; q < C && !any; q++) { const i = idx(r, q); const k = G.b[i].k; if (!k || G.b[i].lock || G.b[i].frost) continue;
      for (const dq of [-1, 1]) { const n = q + dq; if (n < 0 || n >= C) continue; const j = idx(r + 1, n), c = G.b[j]; if (c.hole || c.frost || c.k) continue; if (fed(j)) continue; c.k = k; G.b[i].k = null; moved.set(k.id, (moved.get(k.id) || 0) + 1.4); any = true; break; } }
    if (any) continue;
    // a cell nothing can reach (blocked above on every side): a fresh sweet drops into it
    for (let i = 0; i < R * C; i++) { const c = G.b[i]; if (!c.hole && !c.frost && !c.k) { c.k = newCandy((G.rnd() * G.cfg.cols) | 0); c.k.fresh = true; moved.set(c.k.id, 1); any = true; } }
    if (!any) break; }
  for (const v of moved.values()) maxD = Math.max(maxD, v);
  G.phase = 'fall'; G.pt = maxD ? Math.sqrt(2 * Math.min(maxD, 10) / 46) + 0.1 : 0.02; }
function exitCherries(G) { let n = 0; for (let q = 0; q < C; q++) { let r = R - 1; while (r >= 0 && G.b[idx(r, q)].hole) r--; if (r < 0) continue; const k = G.b[idx(r, q)].k; if (k && k.sp === 'cherry') { G.b[idx(r, q)].k = null; G.cherOn--; G.cherOut++; G.score += 1000; G.ev.push({ k: 'cherry', i: idx(r, q), n: G.cherOut }); lessonSee(G, 'cherry'); n++; } }
  if (n) { fall(G); return true; } return false; }
// the board has settled: is the goal met, are the moves gone, is there anything left to swap?
function goalMet(G) { const g = G.cfg.goal; if (G.lesson) return false;
  if (g === 'score') return G.score >= G.target; if (g === 'jelly') return jellyLeft(G) === 0; if (g === 'frost') return frostLeft(G) === 0;
  if (g === 'collect') return G.collect.every(x => x.got >= x.n); if (g === 'cherry') return G.cherOut >= G.cherT; return false; }
function settle(G) { G.casc = 0;
  if (G.lesson) { lessonSee(G, 'settle'); if (G.wait > 0) return; }
  if (!G.done && goalMet(G)) { G.done = true; G.movesAtGoal = G.moves; G.ev.push({ k: 'goal' }); G.phase = 'rush'; G.pt = 0.9; return; }
  if (G.done) { G.phase = 'rush'; G.pt = 0.12; return; }
  if (G.moves <= 0 && !G.lesson) { G.phase = 'idle'; G.wait = 0.6; G.next = () => finish(G, false); return; }
  if (!findMoves(G).length) shuffle(G);
  G.phase = 'idle'; G.idle = 0; }
// the Sugar Rush: each move left turns a sweet striped and fires it; then every special still on the board goes off
function rushStep(G) { if (!G.rush) { G.rush = true; G.ev.push({ k: 'rush' }); }
  if (G.moves > 0) { const cand = []; for (let i = 0; i < R * C; i++) if (G.b[i].k && G.b[i].k.col >= 0 && !G.b[i].k.sp && !G.b[i].lock) cand.push(i); G.moves--;
    if (cand.length) { const i = cand[(G.rnd() * cand.length) | 0]; G.b[i].k.sp = G.rnd() < 0.5 ? 'h' : 'v'; G.ev.push({ k: 'rushfire', i }); G.casc = 0; blow(G, new Set([i])); G.phase = 'pop'; G.pt = 0.18; return; } }
  const sp = []; for (let i = 0; i < R * C; i++) { const k = G.b[i].k; if (k && (isFx(k) || k.sp === 'b')) sp.push(i); }
  if (sp.length) { blow(G, new Set([sp[0]])); G.phase = 'pop'; G.pt = 0.2; return; }
  G.phase = 'idle'; G.wait = 0.5; G.next = () => finish(G, true); }
function finish(G, win) { if (G.over) return true; G.over = win ? 'won' : 'lost'; const left = G.movesAtGoal || 0, mx = G.movesMax;
  const stars = win ? 1 + (left >= mx * 0.12 ? 1 : 0) + (left >= mx * 0.25 ? 1 : 0) : 0;
  G.res = { win, stars, score: G.score, left, goal: G.cfg.goal, prog: progress(G), made: Object.assign({}, G.made), coins: win ? 4 + Math.ceil(G.N / 3) + stars * 2 : 1 + Math.floor(progress(G) * 3) };
  G.ev.push({ k: win ? 'won' : 'lost' }); return true; }
// how far along the goal is, 0 to 1 (for the bar, the end card and "so close")
function progress(G) { const g = G.cfg.goal; if (g === 'score') return Math.min(1, G.score / G.target); if (g === 'jelly') return G.jelly0 ? 1 - jellyLeft(G) / G.jelly0 : 1; if (g === 'frost') return G.frost0 ? 1 - frostLeft(G) / G.frost0 : 1;
  if (g === 'collect') { if (!G.collect || !G.collect.length) return 0; const a = G.collect.reduce((s, x) => s + Math.min(x.got, x.n), 0), b = G.collect.reduce((s, x) => s + x.n, 0); return a / b; } if (g === 'cherry') return G.cherOut / G.cherT; return 0; }
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'match', title: 'MAKE A LINE', how: 'Swipe a sweet into its neighbour to swap them. Three of a colour in a line pop! Pop three lines.', need: 3 }],
  2: [{ id: 'four', title: 'FOUR IN A ROW', how: 'Line up FOUR of a colour to make a STRIPED sweet. Then put it in a line: it clears a whole row or column!', need: 1 }],
  3: [{ id: 'jelly', title: 'THE JELLY', how: 'Pop the sweets sitting on the pink jelly. Clear all the jelly.', need: 1 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonDeal(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonDeal(G) { const st = lessonNow(G), L = layout(G); L.moves = 99; if (st.id !== 'jelly') L.jelly = L.jelly.map(() => 0); L.frost = L.frost.map(() => 0); L.lock = L.lock.map(() => false); L.cherries = 0; L.collect = null;
  if (st.id === 'jelly') L.jelly = L.jelly.map((v, i) => rowOf(i) >= 5 && rowOf(i) <= 6 && colOf(i) >= 2 && colOf(i) <= 5 ? 1 : 0);
  setup(G, L); G.lesson.n = 0; G.lesson.used = false;
  if (st.id === 'four') { const r = 6, row = [3, 0, 0, 2, 0, 4, 1, 2], fix = new Map(); row.forEach((v, q) => fix.set(idx(r, q), v));      /* swipe the red above the gap down: four reds in a row */
    [[r - 1, 3, 0], [r - 1, 2, 4], [r - 1, 4, 1], [r - 2, 3, 3], [r + 1, 3, 1], [r + 2, 3, 3], [r + 1, 2, 4], [r + 1, 4, 3]].forEach(([a, b, v]) => fix.set(idx(a, b), v));
    for (const [i, v] of fix) G.b[i].k.col = v;
    for (let n = 0; n < 60; n++) { const gs = findGroups(G); if (!gs.length) break; for (const g of gs) { const i = [...g.cells].find(x => !fix.has(x)); if (i != null) G.b[i].k.col = (G.b[i].k.col + 1 + (n % 4)) % 5; } } } }
function lessonMiss(G) { const st = lessonNow(G); G.ev.push({ k: 'lessonmiss', how: 'Only swipe where it makes a line of three. Look for two the same with a gap.' }); G.wait = 1.4; G.next = () => lessonDeal(G); }
function lessonSee(G, what, sp) { const st = lessonNow(G); if (!st) return;
  if (st.id === 'match' && what === 'settle') { G.lesson.n++; G.ev.push({ k: 'lessonok', n: G.lesson.n, need: st.need }); if (G.lesson.n >= st.need) done(); return; }
  if (st.id === 'four' && what === 'made' && (sp === 'h' || sp === 'v')) { G.lesson.made = true; G.ev.push({ k: 'lessonok', n: 0, need: 1, txt: 'Now match it!' }); return; }
  if (st.id === 'four' && what === 'beam') { G.lesson.fired = true; return; }
  if (st.id === 'four' && what === 'settle' && G.lesson.fired) { done(); return; }
  if (st.id === 'jelly' && what === 'settle' && jellyLeft(G) === 0) { done(); return; }
  function done() { G.lesson.i++; if (G.lesson.i >= G.lesson.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.wait = 1.6; G.next = () => { G.rnd = rng(G.seed); setup(G); G.ev.push({ k: 'start' }); }; } else { G.wait = 1.2; G.next = () => lessonDeal(G); } } }
// ---------- for the robots ----------
// BLIND: a thumb that does not look: a swipe somewhere on the board, in some direction
const BLIND = { s: G => { const i = (Math.random() * R * C) | 0, d = [1, -1, C, -C][(Math.random() * 4) | 0]; const j = i + d; if (j >= 0 && j < R * C && (Math.abs(d) === C || rowOf(j) === rowOf(i))) swap(G, i, j); } };
// a player who looks: weighs every swap it can see by what it pops right now (bigger lines, specials, combos, and what the
// goal wants: jelly under it, the colour to collect, frosting beside it, a cherry above it), and is sometimes careless
function moveValue(G, i, j) { const a = G.b[i].k, b = G.b[j].k; let v = 0;
  if (a.sp === 'b' || b.sp === 'b') return 30 + (a.sp && b.sp ? 40 : 0); if (isFx(a) && isFx(b)) return 40 + (a.sp === 'w' || b.sp === 'w' ? 10 : 0);
  G.b[i].k = b; G.b[j].k = a; const gs = findGroups(G); G.b[i].k = a; G.b[j].k = b; const goal = G.cfg.goal;
  for (const g of gs) { const cells = [...g.cells]; v += cells.length; const long = Math.max(...g.runs.map(r => r.cells.length)); if (long >= 5) v += 14; else if (g.runs.length > 1) v += 9; else if (long === 4) v += 6;
    for (const n of cells) { const c = G.b[n]; if (c.k && isFx(c.k)) v += 6; if (goal === 'jelly' && c.jelly) v += 4 * c.jelly; if (goal === 'collect' && G.collect && G.collect.some(x => x.col === colAt(G, n === i ? j : n === j ? i : n) && x.got < x.n)) v += 2.5;
      if (goal === 'frost') for (const m of nbrs(n)) if (G.b[m].frost) v += 3; if (goal === 'cherry') { let r = rowOf(n) - 1; while (r >= 0) { const k = G.b[idx(r, colOf(n))].k; if (k && k.sp === 'cherry') { v += 7; break; } r--; } } }
    v += (rowOf(cells[0]) / R) * 1.5; }      /* lower is better: more falls, more cascades */
  return v; }
function honest(G, o, mem) { const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, Rr = Math.random;
  if (G.over || G.wait > 0 || G.phase !== 'idle' || G.done) { mem.t = 0; return; } mem.t = (mem.t || 0) + 1 / 60; if (mem.t < 0.5 + react * 2) return; mem.t = 0;
  const ms = findMoves(G); if (!ms.length) return; let best = ms[0], bv = -1;
  if (Rr() > acc) best = ms[(Rr() * ms.length) | 0]; else for (const [i, j] of ms) { const v = moveValue(G, i, j) + Rr() * (1 - acc) * 6; if (v > bv) { bv = v; best = [i, j]; } }
  swap(G, best[0], best[1]); }
function winNow(G) { if (!G || G.over || G.wait > 0) return; G.lesson = null; if (!G.collect) G.collect = [];      /* (a lesson board has no collect list: the test's shortcut must not leave the level half set up) */ G.movesAtGoal = G.moves; finish(G, true); }
