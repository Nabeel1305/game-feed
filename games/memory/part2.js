// ===================== THE RULES: Memory Lane (his idea 23, 20 Nov 2026) =====================
// Five short rounds make a level. Each round: you are told WHAT to remember (the things, their places, their order), you look
// at a little scene for a few seconds, it is covered, and then the question: which were there (tap them), put them back
// (drag each to its place), the order they lit up in (tap them in turn), what is missing, or what changed. Then the scene and
// your answer side by side, the differences ringed. Accuracy is what counts: 80% over the five rounds passes the level.
// Later: more things, longer sequences, look-alikes (the same thing on another colour, near twins), a shorter look: one of
// these at a time. Every tenth level has all five kinds. Relaxed: a longer look (home screen). Timed: a bonus for quick answers.
// The scene is laid out on a grid of slots in a 0..1 square; part3 draws it and turns touches into the actions below.
const RULES = [
  'Read <b>what to remember</b> (the things, their places or their order), then <b>look</b>. Tap GOT IT when you are ready.',
  '<b>WHICH WERE THERE?</b> Tap the things you saw. <b>PUT THEM BACK</b>: drag each to its place (or tap it, then the place).',
  '<b>IN ORDER</b>: tap them in the order they lit up. <b>WHAT\'S MISSING?</b> and <b>WHAT CHANGED?</b>: tap the one.',
  'After each answer, the scene and your answer side by side: what you missed is ringed.',
  'Five rounds a level: get <b>80%</b> right to pass, every one right for three stars. Take your time: only Timed mode counts speed.',
];
// things, in families of look-alikes (same family = similar); each has a name for the little stories
const FAM = [
  [['🍎', 'red apple'], ['🍏', 'green apple'], ['🍐', 'pear'], ['🍑', 'peach'], ['🍊', 'orange'], ['🍋', 'lemon']],
  [['☕', 'coffee'], ['🍵', 'tea'], ['🥛', 'glass of milk'], ['🧃', 'juice box'], ['🥤', 'fizzy drink'], ['🍶', 'jug']],
  [['🐱', 'cat'], ['🐶', 'puppy'], ['🐭', 'mouse'], ['🐹', 'hamster'], ['🐰', 'rabbit'], ['🦊', 'fox']],
  [['✏️', 'pencil'], ['🖊️', 'pen'], ['🖍️', 'crayon'], ['🖌️', 'brush'], ['📏', 'ruler'], ['📎', 'paper clip']],
  [['📕', 'red book'], ['📗', 'green book'], ['📘', 'blue book'], ['📙', 'orange book'], ['📓', 'notebook'], ['📒', 'ledger']],
  [['🌵', 'cactus'], ['🌱', 'seedling'], ['🌿', 'herb'], ['🪴', 'pot plant'], ['🌷', 'tulip'], ['🌻', 'sunflower']],
  [['⚽', 'football'], ['🏀', 'basketball'], ['⚾', 'baseball'], ['🎾', 'tennis ball'], ['🏐', 'volleyball'], ['🎱', 'pool ball']],
  [['🧸', 'teddy'], ['🪀', 'yo-yo'], ['🪁', 'kite'], ['🎈', 'balloon'], ['🎲', 'die'], ['🧩', 'puzzle piece']],
  [['🍪', 'biscuit'], ['🍩', 'doughnut'], ['🧁', 'cupcake'], ['🍰', 'cake'], ['🥐', 'croissant'], ['🥨', 'pretzel']],
  [['🔑', 'key'], ['🕶️', 'sunglasses'], ['⌚', 'watch'], ['📱', 'phone'], ['💡', 'bulb'], ['🔦', 'torch']],
  [['🎩', 'top hat'], ['🧢', 'cap'], ['👒', 'sun hat'], ['🎓', 'grad cap'], ['⛑️', 'helmet'], ['👑', 'crown']],
  [['🐟', 'fish'], ['🐠', 'tropical fish'], ['🐡', 'puffer'], ['🦀', 'crab'], ['🐙', 'octopus'], ['🐚', 'shell']],
];
const PLATES = ['#f2e8d8', '#ff8a7a', '#7ab8ff', '#8fe0a0', '#ffd36a', '#c8a0ff'];
const PLATE_NAMES = ['', 'red', 'blue', 'green', 'yellow', 'purple'];
const THEMES = [
  { id: 'desk', name: "Mia's desk", fams: [3, 4, 1, 9, 5, 2] }, { id: 'tray', name: "Grandma's tea tray", fams: [8, 1, 0, 5, 2] },
  { id: 'windows', name: 'Windows on Cherry Street', fams: [2, 5, 7, 10, 11] }, { id: 'shelf', name: 'The toy shop shelf', fams: [7, 6, 2, 10, 4] },
  { id: 'picnic', name: 'A picnic in the park', fams: [0, 8, 1, 6, 2] }, { id: 'pool', name: 'The rock pool', fams: [11, 5, 6, 9] },
];
const TYPES = ['which', 'place', 'order', 'missing', 'changed'];
const TYPE_NAME = { which: 'WHICH WERE THERE?', place: 'PUT THEM BACK', order: 'IN ORDER', missing: "WHAT'S MISSING?", changed: 'WHAT CHANGED?' };
const TYPE_ASK = { which: 'REMEMBER THE THINGS', place: 'REMEMBER THEIR PLACES', order: 'REMEMBER THE ORDER', missing: 'REMEMBER EVERYTHING', changed: 'REMEMBER EVERYTHING' };
const itemName = it => (it.c ? PLATE_NAMES[it.c] + ' plate: ' : '') + FAM[it.f][it.v][1];
const same = (a, b) => a && b && a.f === b.f && a.v === b.v && a.c === b.c;
// ---------- the level: one difficulty at a time (things, look-alikes, the look), in turn every three levels ----------
function makeCfg(N, help, o = {}) { const f = curve(N), boss = N % 10 === 0, st = k => Math.floor((N + k) / 3);
  const n = Math.min(10, 3 + Math.floor(Math.max(0, st(0) - 1) * 0.4)), sim = clamp((st(1) - 2) / 18, 0, 1), short = clamp((st(2) - 3) / 24, 0, 1);
  const types = N <= 5 ? [TYPES[N - 1]] : boss ? TYPES.slice() : TYPES;
  return { N, f, boss, help: !!help, n, sim, short, types, seqN: Math.min(10, n + (N >= 6 ? 1 : 0)),
    view: (o.view || 1) * (help ? 1.35 : 1) * (1 + 0.4 * easyOf(N)) * (1 - 0.3 * short), pass: help ? 0.7 : 0.8, rounds: 5, timed: !!o.timed }; }
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help, o), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, ri: -1, scores: [], log: [], round: null, mini: !!o.mini };
  G.plan = []; for (let i = 0; i < cfg.rounds; i++) G.plan.push(cfg.boss ? TYPES[i] : cfg.types[(G.rnd() * cfg.types.length) | 0]);
  if (cfg.types.length > 1 && !cfg.boss) { const seen = new Set(G.plan); if (seen.size < 3) G.plan[4] = TYPES.find(t => !seen.has(t)) || G.plan[4]; }
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else nextRound(G);
  return G; }
// the grid of places for S slots in the 0..1 scene square
function slotsFor(S) { const cols = S <= 4 ? 2 : S <= 9 ? 3 : 4, rows = Math.ceil(S / cols), out = [];
  for (let i = 0; i < S; i++) { const r = Math.floor(i / cols), c = i % cols, inRow = Math.min(cols, S - r * cols); out.push({ x: (c + 0.5 + (cols - inRow) / 2) / cols, y: (r + 0.5) / rows }); } return { pts: out, cols, rows }; }
function pickItems(G, n, sim, theme) { const R = G.rnd, out = [], fams = theme.fams.slice();
  // look-alikes: at low sim every thing from a different family; at high sim several from one family and plates of colour
  const famOf = () => (R() < sim && out.length ? out[(R() * out.length) | 0].f : fams[(R() * fams.length) | 0]);
  let tries = 0; while (out.length < n && tries++ < 400) { const f = famOf(), v = (R() * FAM[f].length) | 0, c = sim > 0.35 && R() < sim * 0.6 ? 1 + ((R() * 5) | 0) : 0, it = { f, v, c };
    if (out.some(q => same(q, it)) || (sim < 0.2 && out.some(q => q.f === f) && tries < 300)) continue; out.push(it); }
  return out; }
function lookAlike(G, it, avoid, sim) { const R = G.rnd; for (let k = 0; k < 60; k++) { let q;
    if (R() < 0.35 + 0.6 * sim) q = R() < 0.5 && sim > 0.3 ? { f: it.f, v: it.v, c: (it.c + 1 + ((R() * 5) | 0)) % 6 } : { f: it.f, v: (R() * FAM[it.f].length) | 0, c: it.c };
    else { const f = (R() * FAM.length) | 0; q = { f, v: (R() * FAM[f].length) | 0, c: sim > 0.35 && R() < 0.4 ? 1 + ((R() * 5) | 0) : 0 }; }
    if (!avoid.some(a => same(a, q))) return q; } return { f: 0, v: 0, c: 5 }; }
function nextRound(G) { G.ri++; if (G.ri >= G.cfg.rounds) return finishLevel(G);
  const L = lessonNow(G), type = L ? L.type : G.plan[G.ri], c = G.cfg, R = G.rnd, theme = THEMES[(G.N * 7 + G.ri * 3 + (G.seed % 5)) % THEMES.length];
  const n = L ? 3 : type === 'order' ? c.seqN : type === 'which' || type === 'place' ? c.n : Math.min(10, c.n + 1), sim = L ? 0 : c.sim;
  const S = type === 'place' ? n + 1 + Math.floor(c.f / 12) : type === 'order' ? n : n + (c.f > 20 ? 1 : 0), grid = slotsFor(Math.min(12, Math.max(S, n)));
  const items = pickItems(G, n, sim, theme), slots = grid.pts.map((p, i) => ({ i, x: p.x, y: p.y, it: null }));
  const free = slots.map(s => s.i); for (let i = free.length - 1; i > 0; i--) { const j = (R() * (i + 1)) | 0; [free[i], free[j]] = [free[j], free[i]]; }
  items.forEach((it, k) => { slots[free[k]].it = it; it.slot = free[k]; });
  const r = G.round = { type, theme, items, slots, grid, n, phase: 'brief', t: 0, view: (type === 'order' ? 0.9 * n + 0.6 : 2.0 + 0.6 * n) * (L ? 1.4 : c.view), ans: null, score: 0, done: false, lit: -1, picks: [], placed: {}, sel: null, story: story(items, theme) };
  // the question's material, made now (so the answer can be checked fairly)
  if (type === 'which') { const opts = items.map(it => ({ it, yes: true })); const all = items.slice(); for (let k = 0; k < (L ? 5 : n); k++) { const q = lookAlike(G, items[k % n], all, sim); all.push(q); opts.push({ it: q, yes: false }); } shuffle(opts, R); r.opts = opts; }
  if (type === 'missing') { const gone = items[(R() * n) | 0], opts = [{ it: gone, yes: true }], all = items.slice(); const k = sim > 0.5 ? 5 : 3; for (let q = 0; q < k; q++) { const d = q === 0 && n > 1 ? items.find(x => x !== gone && !opts.some(o => same(o.it, x))) : lookAlike(G, gone, all, sim); all.push(d); opts.push({ it: d, yes: false }); } shuffle(opts, R); r.opts = opts; r.gone = gone; }
  if (type === 'changed') { const kind = sim > 0.25 && R() < 0.3 ? 'swap' : 'replace', a = items[(R() * n) | 0]; r.kind = kind; r.after = slots.map(s => s.it); if (kind === 'swap') { const b = items.find(x => x !== a && !same(x, a)) || items[(items.indexOf(a) + 1) % n]; r.after[a.slot] = b; r.after[b.slot] = a; r.changed = [a.slot, b.slot]; } else { const q = lookAlike(G, a, items, sim); r.after[a.slot] = q; r.changed = [a.slot]; r.newIt = q; } }
  if (type === 'order') { r.seq = items.slice(); shuffle(r.seq, R); }
  G.ev.push({ k: 'round', type, i: G.ri }); }
function story(items, theme) { const nm = items.slice(0, 3).map(itemName); return `${theme.name}: ${nm.length > 1 ? nm.slice(0, -1).join(', ') + ' and ' + nm[nm.length - 1] : nm[0]}${items.length > 3 ? ', and more' : ''}.`; }
function shuffle(a, R) { for (let i = a.length - 1; i > 0; i--) { const j = (R() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }
// ---------- the clock: brief → look → (covered) → answer → see the difference ----------
function step(G, dt) { if (G.over || !(dt > 0)) return; G.t += dt; const r = G.round; if (!r) return; r.t += dt;
  if (r.phase === 'brief' && r.t > (G.lesson ? 2.2 : 1.6)) go(G, 'show');
  else if (r.phase === 'show') { if (r.type === 'order') { const k = Math.floor(r.t / 0.9); if (k !== r.lit && k < r.n) { r.lit = k; G.ev.push({ k: 'note', i: r.items.indexOf(r.seq[k]), n: k }); } if (r.t > r.view) go(G, 'ask'); } else if (r.t > r.view) go(G, 'ask'); }
  else if (r.phase === 'cover' && r.t > 0.45) go(G, 'ask2');
  else if (r.phase === 'review' && r.t > (G.lesson ? 4.5 : G.mini ? 2.4 : 4.0)) cont(G); }      // the difference stays up to be studied; a tap goes on sooner
function go(G, ph) { const r = G.round; if (ph === 'ask') { r.phase = 'cover'; r.t = 0; G.ev.push({ k: 'cover' }); return; } if (ph === 'ask2') { r.phase = 'ask'; r.t = 0; r.lit = -1; G.ev.push({ k: 'ask', type: r.type }); return; } r.phase = ph; r.t = 0; G.ev.push({ k: ph }); }
// ---------- the player's actions (part3 turns touches into these) ----------
// cont: skip the brief, GOT IT (end the look early), or go on after the review
function cont(G) { const r = G.round; if (!r || G.over) return false;
  if (r.phase === 'brief') { go(G, 'show'); return true; }
  if (r.phase === 'show' && r.type !== 'order' && r.t > 0.6) { go(G, 'ask'); return true; }
  if (r.phase === 'review' && r.t > 0.5) { if (G.lesson) lessonAfter(G); else nextRound(G); return true; }
  return false; }
// choose an option (which / missing)
function choose(G, k) { const r = G.round; if (!r || r.phase !== 'ask' || !r.opts || !r.opts[k]) return false; const o = r.opts[k];
  if (r.type === 'missing') { r.ans = k; G.ev.push({ k: 'pick', ok: o.yes }); return answer(G, o.yes ? 1 : 0); }
  if (o.on) { o.on = false; G.ev.push({ k: 'unpick' }); return true; }
  o.on = true; G.ev.push({ k: 'pick', i: k }); if (r.opts.filter(q => q.on).length >= r.n) return answer(G, r.opts.filter(q => q.on && q.yes).length / r.n);
  return true; }
// tap a place in the scene (order / changed)
function tapSlot(G, s) { const r = G.round; if (!r || r.phase !== 'ask' || s == null || !r.slots[s]) return false;
  if (r.type === 'changed') { r.ans = s; const ok = r.changed.includes(s); return answer(G, ok ? 1 : 0); }
  if (r.type === 'order') { const it = r.slots[s].it; if (!it || r.picks.includes(s)) return false; const want = r.seq[r.picks.length], ok = same(it, want); r.picks.push(s); G.ev.push({ k: 'note', i: r.items.indexOf(it), ok, n: r.picks.length - 1 });
    if (!ok) { r.wrongAt = r.picks.length - 1; return answer(G, (r.picks.length - 1) / r.n); } if (r.picks.length >= r.n) return answer(G, 1); return true; }
  if (r.type === 'place') { if (r.sel == null) return false; return place(G, r.sel, s); }
  return false; }
// place: the k-th thing goes to slot s (a drag, or a tap on the thing and a tap on the place)
function grab(G, k) { const r = G.round; if (!r || r.phase !== 'ask' || r.type !== 'place' || !r.items[k] || r.placed[k] != null) return false; r.sel = k; G.ev.push({ k: 'grab' }); return true; }
function place(G, k, s) { const r = G.round; if (!r || r.phase !== 'ask' || r.type !== 'place' || !r.items[k] || !r.slots[s]) return false;
  for (const q in r.placed) if (r.placed[q] === s) delete r.placed[q];      // one thing per place: the one there goes back
  r.placed[k] = s; r.sel = null; G.ev.push({ k: 'drop' });
  if (Object.keys(r.placed).length >= r.n) return answer(G, r.items.filter((it, q) => r.placed[q] === it.slot).length / r.n);
  return true; }
function answer(G, score) { const r = G.round; if (r.done) return false; r.done = true; r.score = score; r.ansT = r.t; r.phase = 'review'; r.t = 0;
  const bonus = G.cfg.timed ? Math.round(50 * clamp(1 - r.ansT / (4 + r.n * 1.5), 0, 1) * score) : 0; r.bonus = bonus;
  if (!G.lesson) { G.scores.push(score); G.log.push({ type: r.type, n: r.n, score, bonus }); }
  G.ev.push({ k: 'answer', score, type: r.type, bonus }); if (G.lesson) lessonSee(G, score >= 0.999); return true; }
function finishLevel(G) { const acc = G.scores.reduce((a, b) => a + b, 0) / Math.max(1, G.scores.length); finish(G, acc >= G.cfg.pass - 1e-9, acc); }
function finish(G, win, acc = 0) { if (G.over) return; G.over = win ? 'won' : 'lost'; const pts = Math.round(G.log.reduce((a, q) => a + q.score * 100 + q.bonus, 0));
  const types = {}; for (const q of G.log) if (q.score >= 0.999) types[q.type] = Math.max(types[q.type] || 0, q.n);      // the longest fully right, per kind (personal bests)
  G.res = { win, acc, stars: win ? (acc >= 0.999 ? 3 : acc >= 0.9 ? 2 : 1) : 0, points: pts, log: G.log, types, need: G.cfg.pass };
  G.ev.push({ k: win ? 'won' : 'lost' }); }
// ---------- LESSONS: one way of answering at a time ----------
const AIMCARD = {"pic": "🧠", "win": "REMEMBER WHAT YOU SAW", "lose": "TOO MANY WRONG", "how": "LOOK CLOSELY, THEN ANSWER"};      // the aim card: specs/aims.json (tools/aims.py)
const LESSONS = {
  1: [{ id: 'which', type: 'which', title: 'WHICH WERE THERE?', say: G => memCue(G)[0], do: G => memCue(G)[1], at: G => memCue(G)[2], how: 'Look at the three things. When they are covered, tap the three you saw (twice in a row).', need: 2 }],
  2: [{ id: 'place', type: 'place', title: 'PUT THEM BACK', say: G => memCue(G)[0], do: G => memCue(G)[1], at: G => memCue(G)[2], how: 'Remember where each thing sits. Then drag each one back to its place (or tap it, then tap the place).', need: 2 }],
  3: [{ id: 'order', type: 'order', title: 'IN ORDER', say: G => memCue(G)[0], do: G => memCue(G)[1], at: G => memCue(G)[2], how: 'Watch them light up one by one (each has its own note). Then tap them in the same order.', need: 2 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); G.ri = -1; nextRound(G); G.ri = -1; }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonSee(G, ok) { const D = G.lesson; if (!D) return; if (!ok) { D.n = 0; G.ev.push({ k: 'lessonmiss', how: D.steps[D.i].how }); return; }      /* two right in a row */ D.n++; G.ev.push({ k: 'lessonok', n: D.n, need: D.steps[D.i].need }); }
function lessonAfter(G) { const D = G.lesson; if (D.n >= D.steps[D.i].need) { D.i++; D.n = 0; if (D.i >= D.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.ri = -1; nextRound(G); return; } G.ev.push({ k: 'lessonnext' }); } G.ri = -1; nextRound(G); G.ri = -1; }
// ---------- for the robots ----------
// BLIND: a thumb that does not look: a random answer, the first answer, go on.
function anyAnswer(G, first) { const r = G.round; if (!r) return; const R = first ? () => 0 : Math.random;
  if (r.phase !== 'ask') { cont(G); return; }
  if (r.opts) { const free = r.opts.map((o, k) => k).filter(k => !r.opts[k].on); choose(G, free[(R() * free.length) | 0]); return; }
  if (r.type === 'place') { const k = r.items.findIndex((it, q) => r.placed[q] == null); if (k >= 0) place(G, k, (R() * r.slots.length) | 0); return; }
  if (r.type === 'order') { const s = r.slots.filter(q => q.it && !r.picks.includes(q.i)); if (s.length) tapSlot(G, s[(R() * s.length) | 0].i); return; }
  tapSlot(G, r.slots[(R() * r.slots.length) | 0].i); }
const BLIND = { a: G => anyAnswer(G, false), f: G => anyAnswer(G, true), c: G => cont(G) };
// HONEST: a person who looks, with a memory that fills up: each thing is remembered with a chance that falls as there are more
// of them, more look-alikes and less time to look; what is not remembered is guessed. react: seconds a tap takes; acc: a tap lands.
function memChance(G, o) { const r = G.round, acc = o.acc == null ? 0.85 : o.acc, cap = 2.6 + 6.2 * acc, view = r.view, need = r.type === 'order' ? 0.9 * r.n : 0.5 * r.n + 1.5;
  const load = r.n * (1 + 0.4 * G.cfg.sim * (G.lesson ? 0 : 1)) * (1 + 0.45 * Math.max(0, (need - view) / need)) * (r.type === 'place' ? 1.15 : r.type === 'order' ? 1.2 : 1);
  return clamp(Math.pow(Math.min(1, cap / load), 1.1), 0.08, 1); }
// THE TUTORIAL SHOWS ONE MOVE AT A TIME, WITH THE HAND ON IT (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing
// happens"). It said LOOK… TAP THE 3 with a hand in a box. Now: LOOK… while they show, then the hand on each right one in turn (a lesson shows
// the answer: it teaches the game, the levels test the memory), DRAG IT BACK HERE from the tray to its place, TAP NEXT on the button.
function memCue(G) { const r = G.round; if (!r || G.over) return ['WAIT…', 'wait', false]; if (r.phase === 'show' && r.type !== 'order') return ['LOOK…', 'wait', false]; if (r.phase === 'show') return ['WATCH…', 'wait', false];
  const L = lay(G), mid = q => q ? [q.x + q.w / 2, q.y + q.h / 2] : false, P = dryPlan(G, null, { r, cd: -1, know: r.items.map(() => true), notice: true, seqOk: 99 }); if (!P) return ['WAIT…', 'wait', false];
  if (P[0] === 'cont') return [r.phase === 'brief' ? 'TAP GO' : 'TAP NEXT', 'tap', mid(L.btn)];
  if (P[0] === 'choose') return ['TAP ONE YOU SAW', 'tap', mid(L.opts[P[1]])];
  if (P[0] === 'tapSlot') { const j = r.slots.findIndex(q => q.i === P[1]), q = L.slots[j]; return [r.type === 'order' ? 'TAP THIS ONE NEXT' : 'TAP THE ONE THAT CHANGED', 'tap', q ? [q.x, q.y] : false]; }
  if (P[0] === 'place') { const t = L.tray[P[1]], j = r.slots.findIndex(q => q.i === P[2]), q = L.slots[j]; return ['DRAG IT BACK HERE', 'drag', t && q ? [t.x + t.w / 2, t.y + t.h / 2, q.x, q.y] : false]; }
  return ['WAIT…', 'wait', false]; }
function honest(G, o, mem) { const r = G.round; if (!r || G.over) return; const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.85 : o.acc;
  if (mem.r !== r) { mem.r = r; mem.cd = react; const p = memChance(G, o); mem.know = r.items.map(() => Math.random() < p); mem.notice = Math.random() < Math.pow(p, 0.8); mem.seqOk = r.type === 'order' ? (() => { let k = 0; while (k < r.n && Math.random() < Math.pow(p, 0.5 + 0.12 * k)) k++; return k; })() : 0; }
  mem.cd -= 1 / 60; if (mem.cd > 0) return; mem.cd = react * (0.7 + 0.6 * Math.random());
  if (r.phase === 'brief') { ACT.cont(G); return; } if (r.phase === 'show') { if (r.type !== 'order' && r.t > r.view * 0.85) ACT.cont(G); return; }
  if (r.phase === 'review') { ACT.cont(G); return; } if (r.phase !== 'ask') return;
  const slip = Math.random() > acc + (1 - acc) * 0.75;      // a thumb that misses now and then (most are caught before they count)
  if (r.type === 'which') { const want = r.opts.map((q, k) => k).filter(k => !r.opts[k].on && r.opts[k].yes && mem.know[r.items.findIndex(it => same(it, r.opts[k].it))]); const left = r.opts.map((q, k) => k).filter(k => !r.opts[k].on);
    const k = !slip && want.length ? want[0] : left[(Math.random() * left.length) | 0]; ACT.choose(G, k); return; }
  if (r.type === 'missing') { const yes = r.opts.findIndex(q => q.yes); const k = !slip && mem.know[r.items.indexOf(r.gone)] ? yes : (Math.random() * r.opts.length) | 0; ACT.choose(G, k); return; }
  if (r.type === 'changed') { ACT.tapSlot(G, !slip && mem.notice ? r.changed[0] : r.slots[(Math.random() * r.slots.length) | 0].i); return; }
  if (r.type === 'order') { const k = r.picks.length, want = r.seq[k], s = r.slots.find(q => same(q.it, want)).i, others = r.slots.filter(q => q.it && !r.picks.includes(q.i)).map(q => q.i); ACT.tapSlot(G, !slip && k < mem.seqOk ? s : others[(Math.random() * others.length) | 0]); return; }
  if (r.type === 'place') { const k = r.items.findIndex((it, q) => r.placed[q] == null); if (k < 0) return; const free = r.slots.map(q => q.i).filter(s => !Object.values(r.placed).includes(s)); ACT.place(G, k, !slip && mem.know[k] ? r.items[k].slot : free[(Math.random() * free.length) | 0]); } }
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.scores = [1, 1, 1, 1]; G.log = [1, 2, 3, 4].map(() => ({ type: 'which', n: 3, score: 1, bonus: 0 })); G.ri = 4; G.scores.push(1); G.log.push({ type: 'which', n: 3, score: 1, bonus: 0 }); finishLevel(G); }

// what the robot would do now, without doing it (tools/dry_plan.py): the tutorial shows this move
const ACT_REAL = { cont, choose, tapSlot, place }; let ACT = ACT_REAL;
function dryPlan(G, o, mem) { let got = null; const rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { if (!got && !(a.length > 2 && a.slice(1).every(v => v === 0 || v === false))) got = [n, ...a.slice(1)]; return true; };      /* (a stick at rest, all its numbers 0, is not a move; a first bed, number 0, is) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return got; }
function dryPlanAll(G, o, mem) { const all = [], rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { all.push([n, ...a.slice(1)]); return true; };      /* every call, in order (for a robot that steers and drifts at once) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return all; }
