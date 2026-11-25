// ===================== RULES: Dentist =====================
// A day at the clinic: patients come in one by one with a complaint. Look in their mouth (one arch at a time, the other a flip
// away), find what is wrong (some of it only the mirror or the X-ray shows), fix it with the right tool in the right order,
// keep them comfortable, check it all and send them out smiling. Mouth units: the arch spans about x -0.7..0.7, y -0.9..0.5
// (the front teeth at the top). Each tooth is a little grid of cells, each cell a few layers (food, plaque, tartar, stain,
// decay, hole, dust, filling, excess, cure).

const RULES = [
  '<b>Pick a tool from the tray, then drag it over the teeth.</b> Calm, steady strokes work; scrubbing fast does nothing and hurts.',
  '<b>Clean in order:</b> 🪥 brush off food and plaque, 🪝 scrape the yellow tartar at the gum, ✨ polish the stains.',
  '<b>Find what hurts:</b> 🔍 the mirror shows a cavity up close; later the X-ray shows what hides between teeth.',
  '<b>Fix it:</b> drill only the dark decay, 💧 rinse, fill, smooth the extra, then hold the blue light to set it.',
  '<b>Keep them comfortable</b> (their face and the bar). Pause, or 💬 reassure. Three breaks and they leave.',
  '<b>Tap ✓ when you are done.</b> If something is left, it shows you what. ⇅ turns to the other row of teeth.',
];
const SKINS = [{ id: 'mint', name: 'Mint', top: 0x6ad0b8, stars: 0 }, { id: 'sky', name: 'Sky', top: 0x6aaee8, stars: 6 }, { id: 'peach', name: 'Peach', top: 0xf2a07a, stars: 14 },
  { id: 'lilac', name: 'Lilac', top: 0xb08ae0, stars: 24 }, { id: 'lemon', name: 'Lemon', top: 0xf2d86a, stars: 36 }, { id: 'navy', name: 'Navy', top: 0x2a3a6a, stars: 50 }];
const UPGRADES = [{ id: 'brush', name: 'Electric brush', max: 2, cost: l => [50, 130][l], desc: 'Cleans a wider patch.' },
  { id: 'music', name: 'Calm music', max: 2, cost: l => [60, 150][l], desc: 'Patients relax faster between tools.' },
  { id: 'drill', name: 'Quiet drill', max: 1, cost: () => 120, desc: 'The drill bothers them less.' }];
const upLv = id => { if (typeof HEADLESS !== 'undefined' && HEADLESS) return 0; return ((store.get('ups', {}) || {})[id]) | 0; };
const RANKS = [[0, 'Student'], [60, 'Assistant'], [200, 'Dentist'], [500, 'Senior dentist'], [1100, 'Clinic owner'], [2500, 'Smile legend']];
const TOOLS = {
  mirror: { icon: '🔍', name: 'Mirror', r: 0.16, lv: 4 }, xray: { icon: '☢️', name: 'X-ray', r: 0.3, lv: 6 },
  brush: { icon: '🪥', name: 'Brush', r: 0.085, lv: 1 }, scaler: { icon: '🪝', name: 'Scaler', r: 0.04, lv: 2 }, polish: { icon: '✨', name: 'Polisher', r: 0.07, lv: 3 },
  drill: { icon: '🔩', name: 'Drill', r: 0.032, lv: 4 }, water: { icon: '💧', name: 'Water', r: 0.15, lv: 4 }, fill: { icon: '⚪', name: 'Filling', r: 0.05, lv: 4 },
  shaper: { icon: '🥄', name: 'Shaper', r: 0.06, lv: 4 }, light: { icon: '💡', name: 'Blue light', r: 0.13, lv: 4 },
  crown: { icon: '👑', name: 'Crown', r: 0.1, lv: 7 }, glue: { icon: '🧴', name: 'Bracket glue', r: 0.06, lv: 8 }, wire: { icon: '🔧', name: 'Wire key', r: 0.2, lv: 8 },
  gel: { icon: '🧊', name: 'Numbing gel', r: 0.08, lv: 10 }, forceps: { icon: '🗜️', name: 'Forceps', r: 0.08, lv: 10 },
};
const TOOL_ORDER = ['mirror', 'xray', 'brush', 'scaler', 'polish', 'drill', 'water', 'fill', 'shaper', 'light', 'crown', 'glue', 'wire', 'gel', 'forceps'];
// A DECK THAT REMEMBERS (25 Nov 2026, his words: "way more combinations... something novel each time. Someone can play this game for years, and they only
// see something similar to something else only, like once in a blue moon"). deal(name, n) gives the next of n things in a shuffled order that is KEPT ON THE
// PHONE: nothing comes round again until everything else in its list has, today or next month. dealIf() is the same for a list where only some fit just now
// (the rest go back under the deck). In the robots' fast games (HEADLESS) it is plain luck from the game's own dice, so a seed still gives the same game.
const DECKS = {};
function deal(name, n, R) { if (n <= 1) return 0; if (typeof HEADLESS !== 'undefined' && HEADLESS) return (R() * n) | 0;
  let q = DECKS[name]; if (!q) { try { q = store.get('deck.' + name, null); } catch (e) { q = null; } q = DECKS[name] = Array.isArray(q) ? q.filter(i => i >= 0 && i < n) : []; }
  if (!q.length) { for (let i = 0; i < n; i++) q.push(i); for (let i = n - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0, t = q[i]; q[i] = q[j]; q[j] = t; } if (DECKS['<' + name] === q[n - 1] && n > 2) { const t = q[0]; q[0] = q[n - 1]; q[n - 1] = t; } }
  const i = q.pop(); DECKS['<' + name] = i; try { store.set('deck.' + name, q); } catch (e) {} return i; }
const dealOf = (name, list, R) => list[deal(name, list.length, R)];
function dealIf(name, list, ok, R) { if (typeof HEADLESS !== 'undefined' && HEADLESS) { const L = list.filter(ok); return L[(R() * L.length) | 0]; }
  const back = []; let got = -1; for (let k = 0; k < list.length * 2 && got < 0; k++) { const i = deal(name, list.length, R); if (ok(list[i], i)) got = i; else back.push(i); }
  if (back.length) { const q = DECKS[name]; for (const i of back) if (i !== got && !q.includes(i)) q.unshift(i); try { store.set('deck.' + name, q); } catch (e) {} }
  return got < 0 ? list.filter(ok)[0] : list[got]; }
const NAMES = ['Mila', 'Otis', 'June', 'Ravi', 'Noor', 'Theo', 'Ada', 'Kofi', 'Lena', 'Ivo', 'Sana', 'Bo', 'Pia', 'Emre', 'Rosa', 'Yuki', 'Dev', 'Ines', 'Abel', 'Bisi', 'Cleo', 'Dara', 'Eli', 'Femi', 'Gus', 'Hana', 'Idris', 'Jade', 'Kemi', 'Luca', 'Maya', 'Nico', 'Ola', 'Pru', 'Quinn', 'Remi', 'Seun', 'Tess', 'Uma', 'Vik', 'Wren', 'Xavi', 'Yemi', 'Zoe', 'Amara', 'Bram', 'Chidi', 'Dina', 'Enzo', 'Fola', 'Greta', 'Hugo', 'Isla', 'Jomo', 'Kira', 'Leo', 'Musa', 'Nell', 'Omar', 'Petra', 'Rafa', 'Sade', 'Tomi', 'Vera', 'Wale', 'Zara'];
const KINDS = { calm: { name: 'calm', drain: 1, re: 1 }, nervous: { name: 'nervous', drain: 1.5, re: 1.8 }, tough: { name: 'tough', drain: 0.7, re: 0.8 }, kid: { name: 'a kid', drain: 1.25, re: 1.5 },
  // 25 Nov 2026 (his words: "way more combinations... something novel each time"): seven more kinds of patient in the chair, each of whom takes the work and a kind word differently
  brave: { name: 'brave', drain: 0.8, re: 1 }, sleepy: { name: 'half asleep', drain: 0.85, re: 0.6 }, chatty: { name: 'chatty', drain: 1.1, re: 1.3 }, ticklish: { name: 'ticklish', drain: 1.35, re: 1.2 }, first: { name: 'first visit', drain: 1.4, re: 2 }, grumpy: { name: 'grumpy', drain: 1.15, re: 0.7 }, giggly: { name: 'giggly', drain: 1.2, re: 1.4 } };
const N_TEETH = 10, GR = 6;

function makeCfg(N, help, o = {}) {
  const f = curve(N), e = easyOf(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), relax = !!o.relax;
  return { N, f, e, help: !!help, relax,
    patients: relax ? 1 : N < 15 ? 1 : 2,
    tools: TOOL_ORDER.filter(t => TOOLS[t].lv <= Math.max(N, 1) && (!relax || ['brush', 'scaler', 'polish'].includes(t))),
    time: relax ? 1e9 : x(2.2, 0.72, 22) * (help ? 1.35 : 1),         // the clinic's clock: this many times the time a calm dentist needs
    drain: x(0.8, 1.25, 25) * (help ? 0.75 : 1),                      // how quickly they get uncomfortable
    strikes: 3 };
}
// ---------- the mouth ----------
function makeArch(R) {
  const T = []; for (let i = 0; i < N_TEETH; i++) { const a = Math.PI * (1.08 + 0.84 * i / (N_TEETH - 1)), mid = Math.abs(i - 4.5), r = mid > 3.4 ? 0.112 : mid > 2.4 ? 0.098 : mid > 1.4 ? 0.088 : 0.078;
    const x = Math.cos(a) * 0.6, y = Math.sin(a) * 0.82 + 0.25, nx = Math.cos(a) * 0.6, ny = Math.sin(a) * 0.82 / 0.82, L = Math.hypot(nx, ny);
    const t = { i, x, y, r, out: [nx / L, ny / L], molar: mid > 2.4, cells: [], found: false, gone: false };
    for (let gy = 0; gy < GR; gy++) for (let gx = 0; gx < GR; gx++) { const cx = x - r + (gx + 0.5) * 2 * r / GR, cy = y - r + (gy + 0.5) * 2 * r / GR, d = Math.hypot(cx - x, cy - y); if (d > r * (t.molar ? 1.02 : 0.96)) continue;
      const edge = d > r * 0.58 && ((cx - x) * t.out[0] + (cy - y) * t.out[1]) / d > 0.25;
      t.cells.push({ x: cx, y: cy, edge, food: 0, plaque: 0, tartar: 0, stain: 0, decay: 0, hole: 0, dust: 0, fill: 0, extra: 0, cure: 0, chip: 0, jag: 0 }); }
    T.push(t); }
  return { teeth: T, braces: null };
}
// a patient: their problems come from the level (each new kind of work is introduced on its own first)
function makePatient(G, R, n) {
  const N = G.N, c = G.cfg, kinds = N < 9 ? ['calm', 'calm', 'tough', 'kid', 'brave', 'sleepy'] : ['calm', 'nervous', 'tough', 'kid', 'nervous', 'chatty', 'ticklish', 'first', 'grumpy', 'giggly', 'brave', 'sleepy'];
  const P = { name: dealOf('name', NAMES, R), kind: c.relax ? 'calm' : dealOf('kind' + (N < 9 ? 'a' : 'b'), kinds, R), skin: (R() * 5) | 0, hair: (R() * 6) | 0, arches: [makeArch(R), makeArch(R)], comfort: 1, strikes: 0, probs: [], complaint: '' };
  const A = P.arches, some = (a, k2, pickT) => { const ts = A[a].teeth.filter(t => !t.used); const out = []; for (let i = 0; i < k2 && ts.length; i++) { const t = ts.splice((R() * ts.length) | 0, 1)[0]; if (pickT && !pickT(t)) { i--; continue; } out.push(t); } return out; };
  const dirt = (a, layer, nT, frac, edgeOnly) => { for (const t of some(a, nT)) for (const cl of t.cells) if ((!edgeOnly || cl.edge) && R() < frac) cl[layer] = 0.7 + R() * 0.3; };
  const arches = c.relax ? [0, 1] : N <= 1 ? [0] : [0, 1];
  // what this level brings (the newest thing alone first, then mixed in)
  const lvl = c.relax ? 3 : N;
  const lite = !c.relax && N >= 4 ? 0.5 : 1;      // when there is a repair to do, the clean is a lighter one
  for (const a of arches) {
    dirt(a, 'food', Math.max(1, Math.round((lvl <= 1 ? 4 : 2 + ((R() * 3) | 0)) * lite)), 0.45);
    dirt(a, 'plaque', Math.max(1, Math.round((lvl <= 1 ? 3 : 2 + ((R() * 3) | 0)) * lite)), 0.6);
    if (lvl >= 2) dirt(a, 'tartar', Math.max(1, Math.round((lvl === 2 ? 4 : 1 + ((R() * 3) | 0)) * lite)), 0.9, true);
    if (lvl >= 3 && R() < (lite < 1 ? 0.6 : 1)) dirt(a, 'stain', Math.max(1, Math.round((lvl === 3 ? 4 : 1 + ((R() * 2) | 0)) * lite)), 0.7);
  }
  const probs = []; if (!c.relax) {
    const want = N === 4 || N === 6 ? ['cavity'] : N === 5 ? ['chip'] : N === 7 ? ['crown'] : N === 8 ? ['braces'] : N === 10 ? ['extract'] : N > 10 ? pick(R, N > 24 ? [['cavity', 'chip'], ['crown', 'cavity'], ['braces', 'cavity'], ['extract', 'cavity'], ['cavity', 'cavity'], ['chip', 'crown'], ['extract', 'chip']] : [['cavity'], ['cavity', 'chip'], ['crown'], ['braces', 'cavity'], ['extract'], ['cavity', 'cavity'], ['chip', 'crown']]) : N === 9 ? ['cavity'] : [];
    for (const w of want) {
      const a = arches[(R() * arches.length) | 0], t = some(a, 1, t => !t.used)[0]; if (!t) continue; t.used = true;
      if (w === 'cavity') { const deep = N >= 6 && R() < (N === 6 ? 1 : 0.45); const cx = t.x + (R() - 0.5) * t.r * 0.6, cy = t.y + (R() - 0.5) * t.r * 0.6; for (const cl of t.cells) if (Math.hypot(cl.x - cx, cl.y - cy) < t.r * (t.molar ? 0.42 : 0.36)) cl.decay = 1; t.cav = deep ? 'deep' : 'surface'; probs.push({ k: 'cavity', a, t: t.i }); }
      if (w === 'chip') { const ang = R() * TAU, ex = t.x + Math.cos(ang) * t.r, ey = t.y + Math.sin(ang) * t.r; for (const cl of t.cells) if (Math.hypot(cl.x - ex, cl.y - ey) < t.r * 0.7) cl.chip = 1; probs.push({ k: 'chip', a, t: t.i }); }
      if (w === 'crown') { for (const cl of t.cells) if (R() < 0.45) cl.jag = 1; t.broken = true; t.crown = 0; probs.push({ k: 'crown', a, t: t.i }); }
      if (w === 'braces') { const ar = A[a]; ar.braces = { loose: [], wire: 0, g0: 0.5 + R() * 0.3 }; const ts = ar.teeth.filter(q => !q.molar || Math.abs(q.i - 4.5) < 4); ar.braces.on = ts.map(q => q.i); for (let k2 = 0; k2 < 1 + (N > 12 ? 1 : 0); k2++) ar.braces.loose.push(ts[(R() * ts.length) | 0].i); ar.braces.fixed = []; probs.push({ k: 'braces', a }); }
      if (w === 'extract') { t.abscess = true; t.loose = 0; probs.push({ k: 'extract', a, t: t.i }); }
    } }
  P.probs = probs;
  const C = { cavity: ['It hurts when I drink something cold.', 'One tooth aches when I bite.', 'Something twinges on the left side.'], chip: ['I bit a nut and a bit of tooth came off!', 'I chipped a tooth on my fork.'],
    crown: ['A tooth cracked right across. It looks awful.', 'My old tooth broke. Can you save it?'], braces: ['My braces feel loose and they poke me.', 'Time for my braces check: something is loose.'],
    extract: ['A tooth is throbbing day and night.', 'My jaw aches; I think a tooth is bad.'] };
  P.complaint = probs.length ? pick(R, C[probs[0].k]) : pick(R, ['Just a check-up and a clean, please.', 'My teeth feel fuzzy. A clean?', 'Big date tonight: make my smile shine!', 'Mum says I have to come. Is it going to hurt?']);
  P.before = snap(P);
  return P;
}
const snap = P => P.arches.map(A => A.teeth.map(t => ({ g: t.cells.map(cl => +(cl.food > 0.1 || cl.plaque > 0.1) + 2 * (cl.tartar > 0.1) + 4 * (cl.stain > 0.1) + 8 * (cl.decay > 0) + 16 * (cl.chip > 0 || cl.jag > 0)) })));
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help, o), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0, R = rng(seed + 3);
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, mini: !!o.mini,
    pts: [], pi: 0, arch: 0, tool: null, hand: { down: false, x: 0, y: 0, px: 0, py: 0, sp: 0, t: 0, hold: 0 }, mistakes: 0, breaks: 0, warned: {}, phase: 'talk', phT: 0, clock: 0, budget: 0, done: 0, reCd: 0, drillT: 0, xr: 0, gauge: null, rock: null, stats: { cleaned: 0, fixed: 0, roughs: 0 } };
  for (let i = 0; i < cfg.patients; i++) G.pts.push(makePatient(G, R, i));
  G.budget = G.pts.reduce((s, P) => s + needTime(P), 0) * cfg.time; G.clock = G.budget;
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G);
  G.ev.push({ k: 'patient', i: 0 }); G.phT = o.mini ? 0.2 : 2.2;
  return G;
}
const pat = G => G.pts[G.pi], archOf = G => pat(G).arches[G.arch];
function needTime(P) { let s = 8; for (const A of P.arches) for (const t of A.teeth) { let n = 0; for (const cl of t.cells) if (cl.food > 0.1 || cl.plaque > 0.1 || cl.tartar > 0.1 || cl.stain > 0.1) n++; if (n) s += 2.4 + n * 0.08; } for (const p of P.probs) s += { cavity: 13, chip: 9, crown: 10, braces: 9, extract: 12 }[p.k]; return s; }
// ---------- what is left to do (the checklist, and the ✓ check) ----------
const CLEAN = 0.08;
const tClean = (t, layer) => { if (t.gone) return true; let n = 0, bad = 0; for (const cl of t.cells) { n++; if (cl[layer] > CLEAN) bad++; } return bad <= n * 0.08; };
function toothLeft(t, A) { const out = []; if (t.gone) return out;
  for (const L of ['food', 'plaque', 'tartar', 'stain']) if (!tClean(t, L)) out.push(L);
  if (t.cells.some(cl => cl.decay > 0.05)) out.push('decay'); else if (t.cells.some(cl => cl.hole > 0.2 && cl.fill < 0.85)) out.push(t.cells.some(cl => cl.dust > 0.15) ? 'rinse' : 'fill');
  if (t.cells.some(cl => cl.chip > 0 && cl.fill < 0.85)) out.push('chip');
  if (t.cells.some(cl => cl.extra > 0.15)) out.push('smooth'); else if (t.cells.some(cl => (cl.fill > 0.5) && cl.cure < 0.95)) out.push('cure');
  if (t.broken) { if (t.cells.some(cl => cl.jag > 0.1)) out.push('prep'); else if (t.crown < 1) out.push('crown'); else if (t.crown < 2) out.push('cement'); }
  if (t.abscess) out.push('extract');
  return out; }
function left(P) { const out = []; P.arches.forEach((A, a) => { A.teeth.forEach(t => { for (const w of toothLeft(t, A)) out.push({ a, t: t.i, w }); }); if (A.braces) { const B = A.braces; if (B.loose.some(i => !B.fixed.includes(i))) out.push({ a, w: 'bracket' }); else if (!B.wire) out.push({ a, w: 'wire' }); } }); return out; }
// the checklist he sees: visible problems, and "?" for what hurts until it is found
function checklist(G) { const P = pat(G), L = left(P), rows = [];
  const cnt = w => L.filter(q => q.w === w).length, hid = q => { const t = P.arches[q.a].teeth[q.t]; return (q.w === 'decay' && !t.found) || (q.w === 'extract' && !t.found); };
  for (const [w, icon, txt] of [['food', '🪥', 'food'], ['plaque', '🪥', 'plaque'], ['tartar', '🪝', 'tartar'], ['stain', '✨', 'stains']]) { const n = cnt(w); if (n || P.before.some(A => A.some(t => t.g.some(v => v & ({ food: 1, plaque: 1, tartar: 2, stain: 4 }[w]))))) rows.push({ icon, txt: `${txt}: ${n ? n + (n === 1 ? ' tooth' : ' teeth') : 'done'}`, done: !n }); }
  for (const p of P.probs) { const t = p.t != null ? P.arches[p.a].teeth[p.t] : null, mine = L.filter(q => q.a === p.a && (q.t === p.t || (p.k === 'braces' && q.t == null)));
    const found = !t || t.found || p.k === 'chip' || p.k === 'crown';
    if (!found) { rows.push({ icon: '❓', txt: 'what hurts? find it', done: false }); continue; }
    const step = mine.filter(q => q.w !== 'food' && q.w !== 'plaque' && q.w !== 'tartar' && q.w !== 'stain')[0];
    rows.push({ icon: { cavity: '🦷', chip: '🦷', crown: '👑', braces: '🔧', extract: '🗜️' }[p.k], txt: `${{ cavity: 'cavity', chip: 'chipped tooth', crown: 'broken tooth', braces: 'braces', extract: 'bad tooth' }[p.k]}${G.arch !== p.a ? ' (other row)' : ''}: ${step ? NEXT[step.w] : 'fixed'}`, done: !step }); }
  return rows; }
const NEXT = { decay: 'drill the decay', rinse: 'rinse it', fill: 'fill it', chip: 'fill the gap', smooth: 'smooth the extra', cure: 'blue light', prep: 'smooth the edge', crown: 'fit the crown', cement: 'blue light', extract: 'numb, then forceps', bracket: 'glue the loose bracket', wire: 'tighten the wire' };
// ---------- the player's actions ----------
function pickTool(G, id) { if (G.over || !G.cfg.tools.includes(id) || G.phase !== 'work') return false; if (G.tool !== id) { G.tool = id; G.ev.push({ k: 'tool', id }); G.gauge = null; G.rock = null; } return true; }
function down(G, x, y) { if (G.over || G.phase !== 'work' || !G.tool) return false; const h = G.hand; h.down = true; h.x = h.px = h.x0 = x; h.y = h.py = h.y0 = y; h.t = 0; h.sp = 0; h.dist = 0; h.rough = 0; h.xdone = false; h.wr = 0;
  if (G.tool === 'wire') { const B = archOf(G).braces; if (B && B.loose.every(i => B.fixed.includes(i)) && !B.wire) { G.gauge = { t: 0, g0: B.g0, gw: 0.14 }; G.ev.push({ k: 'gauge' }); } else warn(G, B ? (B.wire ? 'done' : 'brackets') : 'nobraces'); }
  if (G.tool === 'crown') G.crownAt = { x, y };
  return true; }
function moveTo(G, x, y) { const h = G.hand; if (!h.down) return; h.x = x; h.y = y; if (G.tool === 'crown') G.crownAt = { x, y }; }
function up(G) { const h = G.hand; if (!h.down) return; h.down = false;
  if (G.tool === 'wire' && G.gauge) { const g = G.gauge, p = gaugeP(G); G.gauge = null; const B = archOf(G).braces;
    if (p >= g.g0 && p <= g.g0 + g.gw) { B.wire = 1; G.ev.push({ k: 'fixed', what: 'wire' }); lessonSee(G, 'wire'); }
    else if (p > g.g0 + g.gw) { hurt(G, 0.25, 'tight'); G.ev.push({ k: 'wire', why: 'tight' }); } else G.ev.push({ k: 'wire', why: 'loose' }); }
  if (G.tool === 'crown' && G.crownAt) { const A = archOf(G), t = A.teeth.find(q => q.broken && q.crown === 0 && Math.hypot(q.x - G.crownAt.x, q.y - G.crownAt.y) < q.r * 0.9);
    if (t) { if (t.cells.some(cl => cl.jag > 0.1)) warn(G, 'prep'); else { t.crown = 1; G.ev.push({ k: 'crownon', t: t.i }); } } G.crownAt = null; }
  if (G.tool === 'forceps' && G.rock && G.rock.t) { const t = G.rock.t; if (t.loose >= 1 && h.y0 - h.y > 0.18) { t.gone = true; t.abscess = false; G.ev.push({ k: 'pulled', t: t.i }); G.stats.fixed++; } } G.rock = null; }
function flip(G) { if (G.over || G.phase !== 'work') return false; if (G.hand.down) up(G); G.arch = 1 - G.arch; G.ev.push({ k: 'flip', a: G.arch }); return true; }
function reassure(G) { if (G.over || G.phase !== 'work' || G.reCd > 0) return false; const P = pat(G), K = KINDS[P.kind]; G.reCd = 6; const add = (P.comfort < 0.5 ? 0.3 : 0.1) * K.re; P.comfort = Math.min(1, P.comfort + add); G.ev.push({ k: 'reassure', add }); return true; }
function finishPatient(G) { if (G.over || G.phase !== 'work') return false; if (G.hand.down) up(G); const P = pat(G), L = left(P);
  if (L.length) { if (!G.lesson) G.mistakes++; G.ev.push({ k: 'notyet', left: L.slice(0, 6), n: L.length }); const other = L.find(q => q.a !== G.arch); if (!L.some(q => q.a === G.arch) && other) G.ev.push({ k: 'otherrow' }); return false; }
  G.phase = 'smile'; G.phT = G.mini && G.pi === G.pts.length - 1 ? 1.6 : 2.6; G.ev.push({ k: 'smile', i: G.pi }); G.done++; return true; }
function warn(G, why) { G.ev.push({ k: 'warn', why }); }
function hurt(G, v, why) { const P = pat(G); P.comfort -= v * (G.lesson ? 0 : 1); if (why) G.ev.push({ k: 'ouch', why }); }
const gaugeP = G => G.gauge ? Math.min(1.25, G.gauge.t / 2.2) : 0;
// ---------- every frame ----------
function step(G, dt) {
  if (G.over || !(dt > 0)) return; G.t += dt; if (G.lesson) lessonTick(G, dt);
  if (G.blind) blindStep(G, dt);
  if (G.phase === 'talk') { G.phT -= dt; if (G.phT <= 0) { G.phase = 'work'; G.ev.push({ k: 'work' }); } return; }
  if (G.phase === 'break') { G.phT -= dt; if (G.phT <= 0) { G.phase = 'work'; G.ev.push({ k: 'back' }); } return; }
  if (G.phase === 'smile') { G.phT -= dt; if (G.phT <= 0) { if (G.lesson) return; if (G.pi + 1 >= G.pts.length) return finish(G, true); G.pi++; G.arch = 0; G.tool = null; G.phase = 'talk'; G.phT = 2.2; G.ev.push({ k: 'patient', i: G.pi }); } return; }
  const c = G.cfg, P = pat(G), K = KINDS[P.kind], h = G.hand;
  if (!c.relax && !G.lesson) { G.clock -= dt; if (G.clock <= 0) return finish(G, false, 'clock'); }
  G.reCd = Math.max(0, G.reCd - dt); G.xr = Math.max(0, G.xr - dt);
  // the hand: how fast it is moving (calm strokes work; scrubbing does nothing and hurts)
  if (h.down) { const d = Math.hypot(h.x - h.px, h.y - h.py); h.sp += (d / dt - h.sp) * Math.min(1, dt * 12); h.dist += d; h.px = h.x; h.py = h.y; h.t += dt; useTool(G, dt); } else { h.sp = 0; G.drillT = Math.max(0, G.drillT - dt * 2); }
  const resting = !h.down || ['mirror', 'xray'].includes(G.tool);
  if (resting) P.comfort = Math.min(1, P.comfort + dt * (0.06 + 0.03 * upLv('music')));
  if (P.comfort <= 0) { P.strikes++; G.breaks++; G.ev.push({ k: 'break', n: P.strikes }); if (h.down) up(G); if (P.strikes >= c.strikes) return finish(G, false, 'left'); P.comfort = 0.65; G.phase = 'break'; G.phT = 3; }
}
function cellsNear(G, x, y, r) { const out = []; for (const t of archOf(G).teeth) { if (t.gone || Math.hypot(t.x - x, t.y - y) > t.r + r) continue; for (const cl of t.cells) if (Math.hypot(cl.x - x, cl.y - y) < r) out.push([t, cl]); } return out; }
function toothAt(G, x, y) { let best = null, bd = 1e9; for (const t of archOf(G).teeth) { if (t.gone) continue; const d = Math.hypot(t.x - x, t.y - y); if (d < t.r * 1.25 && d < bd) { bd = d; best = t; } } return best; }
function useTool(G, dt) {
  const h = G.hand, P = pat(G), K = KINDS[P.kind], c = G.cfg, T = TOOLS[G.tool], sp = h.sp, dr = c.drain * K.drain;
  const win = (lo, hi, rough) => sp > rough ? -1 : sp < lo ? sp / lo * 0.35 : sp <= hi ? 1 : 0.4;
  const roughNow = rough => { if (sp > rough && h.t > 0.12) { h.rough += dt; if (h.rough > 0.25) { h.rough = -0.6; G.stats.roughs++; hurt(G, 0.06 * dr, 'rough'); if (G.lesson) lessonReset(G, 'rough'); } } };
  const near = cellsNear(G, h.x, h.y, T.r * (G.tool === 'brush' ? 1 + 0.2 * upLv('brush') : 1)), any = near.length > 0;
  switch (G.tool) {
    case 'brush': { roughNow(3.2); const f = win(0.25, 2.6, 3.2); if (f > 0) for (const [t, cl] of near) { cl.food = Math.max(0, cl.food - 3.2 * f * dt); cl.plaque = Math.max(0, cl.plaque - 1.8 * f * dt); }
      cleanCheck(G, near, ['food', 'plaque']);
      if (any && f > 0 && near.every(([t, cl]) => cl.food < 0.05 && cl.plaque < 0.05) && near.some(([t, cl]) => cl.tartar > 0.2 || cl.stain > 0.2)) hint1(G, 'brushwrong'); break; }
    case 'scaler': { roughNow(2.4); const f = win(0.12, 1.7, 2.4); let on = false; if (f > 0) for (const [t, cl] of near) if (cl.tartar > 0.01) { on = true; cl.tartar = Math.max(0, cl.tartar - 2.6 * f * dt); }
      if (on) { hurt(G, 0.012 * dr * dt); cleanCheck(G, near, ['tartar']); } else if (any && h.t > 0.5) hint1(G, 'scalerwrong'); break; }
    case 'polish': { const f = sp < 1.8 ? 1 : 0.3; let blocked = false; for (const [t, cl] of near) { if (cl.plaque > 0.15 || cl.tartar > 0.15) { blocked = true; continue; } cl.stain = Math.max(0, cl.stain - 1.6 * f * dt); }
      cleanCheck(G, near, ['stain']); if (blocked) hint1(G, 'polishfirst'); if (h.t > 5) hurt(G, 0.03 * dr * dt); break; }
    case 'mirror': for (const t of archOf(G).teeth) if (!t.gone && Math.hypot(t.x - h.x, t.y - h.y) < t.r + T.r * 0.5 && h.t > 0.25) { if (t.cav === 'surface' && !t.found) { t.found = true; G.ev.push({ k: 'found', t: t.i, what: 'cavity' }); lessonSee(G, 'found'); }
        else if ((t.cav === 'deep' || t.abscess) && !t.found && !t.mHint) { t.mHint = true; G.ev.push({ k: 'deephint', t: t.i }); } } break;
    case 'xray': if (h.t > 1.0 && !h.xdone) { h.xdone = true; G.xr = 3.5; for (const t of archOf(G).teeth) if ((t.cav || t.abscess) && !t.found) { t.found = true; G.ev.push({ k: 'found', t: t.i, what: t.abscess ? 'abscess' : 'cavity', xray: true }); } G.ev.push({ k: 'xray' }); } break;
    case 'drill': { const t = toothAt(G, h.x, h.y); if (!t) break; G.drillT += dt; hurt(G, (0.03 + Math.max(0, G.drillT - 2.5) * 0.12) * dr * dt * (1 - 0.35 * upLv('drill')));
      if (!t.found && t.cells.some(cl => cl.decay > 0)) { hint1(G, 'lookfirst'); break; }
      if (t.broken) { for (const [t2, cl] of near) if (t2 === t && cl.jag > 0) hint1(G, 'jagshaper'); }
      if (sp > 1.4) { hint1(G, 'drillslow'); break; }
      const pc = t.cells.reduce((a, cl) => Math.hypot(cl.x - h.x, cl.y - h.y) < Math.hypot(a.x - h.x, a.y - h.y) ? cl : a, t.cells[0]);
      if (pc.decay <= 0 && pc.hole < 0.5 && Math.hypot(pc.x - h.x, pc.y - h.y) < T.r) { G.enamelT = (G.enamelT || 0) + dt; if (G.enamelT > 0.18) { G.enamelT = -0.5; if (!G.lesson) G.mistakes++; hurt(G, 0.1 * dr, 'enamel'); G.ev.push({ k: 'enamel', t: t.i }); } break; }
      for (const [t2, cl] of near) if (t2 === t && cl.decay > 0) { cl.decay = Math.max(0, cl.decay - 2.2 * dt); cl.hole = Math.min(1, cl.hole + 2.2 * dt); cl.dust = Math.min(1, cl.dust + 2 * dt); }
      if (t.cav && !t.cells.some(cl => cl.decay > 0.05) && !t.drilled) { t.drilled = true; for (const cl of t.cells) cl.decay = 0; G.ev.push({ k: 'drilled', t: t.i }); } break; }
    case 'water': for (const [t, cl] of near) { if (cl.dust > 0) cl.dust = Math.max(0, cl.dust - 3 * dt); cl.food = Math.max(0, cl.food - 0.6 * dt); } break;
    case 'fill': { const t = toothAt(G, h.x, h.y); if (!t) break; for (const [t2, cl] of near) { if (t2 !== t) continue; if ((cl.hole > 0.2 || cl.chip > 0) && cl.decay <= 0.05) { if (cl.dust > 0.15) { hint1(G, 'rinsefirst'); continue; } cl.fill = Math.min(1, cl.fill + 2.6 * dt); if (cl.fill >= 1 && sp < 0.3) cl.extra = Math.min(1, cl.extra + 0.5 * dt); }
        else if (t.cells.some(q => q.hole > 0.2 || q.chip > 0)) cl.extra = Math.min(1, cl.extra + 1.1 * dt); else hint1(G, 'nohole'); } break; }
    case 'shaper': { const f = win(0.1, 1.6, 2.6); roughNow(2.6); if (f > 0) for (const [t, cl] of near) { cl.extra = Math.max(0, cl.extra - 1.6 * f * dt); cl.jag = Math.max(0, cl.jag - 1.4 * f * dt); } break; }
    case 'light': { const t = toothAt(G, h.x, h.y); if (!t) break; if (t.crown === 1) { t.cureT = (t.cureT || 0) + dt; if (t.cureT > 1.6) { t.crown = 2; G.ev.push({ k: 'fixed', what: 'crown', t: t.i }); G.stats.fixed++; } break; }
      let any2 = false; for (const cl of t.cells) if (cl.fill > 0.5) { any2 = true; if (cl.fill < 0.85) { hint1(G, 'fillfirst'); break; } cl.cure = Math.min(1, cl.cure + 0.75 * dt); }
      if (any2 && t.cells.every(cl => cl.fill <= 0.5 || cl.cure >= 0.95) && !t.cured) { t.cured = true; G.ev.push({ k: 'fixed', what: t.cav ? 'filling' : 'chip', t: t.i }); G.stats.fixed++; lessonSee(G, 'cured'); } if (!any2) hint1(G, 'nothingtocure'); break; }
    case 'crown': break;      // placed on release (up)
    case 'glue': { const A = archOf(G), B = A.braces; if (!B) { hint1(G, 'nobraces'); break; } const t = toothAt(G, h.x, h.y); if (t && B.loose.includes(t.i) && !B.fixed.includes(t.i)) { t.glueT = (t.glueT || 0) + dt; if (t.glueT > 1) { B.fixed.push(t.i); G.ev.push({ k: 'fixed', what: 'bracket', t: t.i }); } } break; }
    case 'wire': if (G.gauge) { G.gauge.t += dt; if (gaugeP(G) > G.gauge.g0 + G.gauge.gw) hurt(G, 0.15 * dr * dt); } break;
    case 'gel': { const t = toothAt(G, h.x, h.y); if (t && h.t > 0.4 && !t.numbAt) { t.numbAt = G.t; G.ev.push({ k: 'gel', t: t.i }); } break; }
    case 'forceps': { const t = toothAt(G, h.x, h.y); if (!t) break; if (!t.abscess) { hint1(G, 'healthy'); if (h.t > 0.6 && !h.wr) { h.wr = 1; if (!G.lesson) G.mistakes++; hurt(G, 0.12 * dr, 'healthy'); } break; }
      if (!t.found) { hint1(G, 'lookfirst'); break; }
      const numb = t.numbAt != null ? Math.min(1, (G.t - t.numbAt) / 3) : 0; if (numb < 1) hurt(G, 0.55 * (1 - numb) * dr * dt, numb < 0.1 ? 'numb' : null);
      if (!G.rock) G.rock = { t, dir: 0, lastX: h.x, seg: 0, segT: 0 }; const R = G.rock; const dx = h.x - R.lastX; R.lastX = h.x; R.segT += dt; const d = Math.sign(dx);
      if (sp > 3.2) { roughNow(3.2); break; }
      if (d && d !== R.dir && Math.abs(dx) > 1e-4) { if (R.dir && R.seg > 0.04 && R.segT > 0.12) { t.loose = Math.min(1, t.loose + 0.14); G.ev.push({ k: 'rock', v: t.loose }); } R.dir = d; R.seg = 0; R.segT = 0; } R.seg += Math.abs(dx); break; }
  }
}
// a tooth that is 92% clean of a layer is clean: the last specks go with a ding (no hunting for the last speck)
function cleanCheck(G, near, layers) { const seen = new Set(); for (const [t] of near) { if (seen.has(t)) continue; seen.add(t); t.cl = t.cl || {};
    for (const L of layers) { if (t.cl[L] || !t.cells.some(c => c[L] > 0) ) continue; if (tClean(t, L)) { t.cl[L] = 1; for (const c of t.cells) c[L] = 0; G.ev.push({ k: 'clean', t: t.i, what: L }); G.stats.cleaned++; } } } }
function hint1(G, why) { if (G.warned[why] && G.t - G.warned[why] < 4) return; G.warned[why] = G.t; G.ev.push({ k: 'warn', why }); }
function finish(G, win, why) {
  if (G.over) return; G.over = win ? 'won' : 'lost'; const stars = win ? (G.mistakes === 0 && G.breaks === 0 ? 3 : G.mistakes + G.breaks <= 2 ? 2 : 1) : 0;
  const coins = win ? 10 + G.pts.length * 8 + stars * 4 + Math.round(Math.max(0, G.clock) / Math.max(1, G.budget) * 10) : G.done * 3;
  G.res = { win, why, stars, coins, time: G.t, patients: G.pts.length, done: G.done, mistakes: G.mistakes, breaks: G.breaks, roughs: G.stats.roughs, fixed: G.stats.fixed };
  G.ev.push({ k: win ? 'won' : 'lost', why });
}

// ---------- LESSONS: brush (three teeth clean, gently), scrape (three teeth of tartar), polish (three stained teeth) ----------
const LESSONS = {
  1: [{ id: 'brush', title: 'BRUSH', say: 'TAP 🪥, RUB SLOWLY', do: 'drag', dir: 'lr', tool: 'brush', how: 'Take the 🪥 brush. Drag it calmly over the dirty teeth until they shine. Three teeth. Scrubbing fast starts the count again.', need: 3 }],
  2: [{ id: 'scaler', title: 'SCRAPE', say: 'TAP 🪝, SCRAPE THE YELLOW', do: 'drag', dir: 'lr', tool: 'scaler', how: 'The yellow crust at the gum is tartar. Take the 🪝 scaler and drag it slowly along the crust. Three teeth.', need: 3 }],
  3: [{ id: 'polish', title: 'POLISH', say: 'HOLD ✨ ON THE BROWN', do: 'hold', tool: 'polish', how: 'Brown stains: hold the ✨ polisher on them and move it slowly. Three teeth.', need: 3 }],
};
function lessonStart(G) { const st = LESSONS[G.N][0]; G.lesson = { steps: LESSONS[G.N], i: 0, n: 0, id: st.id, seen: [] }; G.ev.push({ k: 'lessonnext', first: true });
  const P = G.pts[0], A = P.arches[0], R = rng(G.seed + 77), L = st.id === 'brush' ? 'plaque' : st.id === 'scaler' ? 'tartar' : 'stain';
  for (const B of P.arches) for (const t of B.teeth) for (const cl of t.cells) { cl.food = cl.plaque = cl.tartar = cl.stain = 0; cl.decay = 0; cl.chip = 0; cl.jag = 0; }
  P.probs = []; A.teeth.forEach(t => { t.cav = null; t.abscess = false; t.broken = false; });
  const ts = A.teeth.filter((t, i) => i % 2 === 0); for (const t of ts.slice(0, 5)) for (const cl of t.cells) if (L !== 'tartar' || cl.edge) cl[L] = 0.8 + R() * 0.2;
  if (st.id === 'brush') for (const t of ts.slice(0, 5)) for (const cl of t.cells) if (R() < 0.4) cl.food = 0.9;
  P.before = snap(P); P.kind = 'calm'; P.complaint = 'Just a check-up, please.'; }
function lessonSee(G, what) { }
function lessonTick(G, dt) { const D = G.lesson; if (!D) return; if (D.done) { D.wait -= dt; if (D.wait <= 0) { G.lesson = null; const R = rng(G.seed + 3); G.pts = []; for (let i = 0; i < G.cfg.patients; i++) G.pts.push(makePatient(G, R, i)); G.budget = G.pts.reduce((s, P) => s + needTime(P), 0) * G.cfg.time; G.clock = G.budget; G.pi = 0; G.arch = 0; G.tool = null; G.phase = 'talk'; G.phT = 1.2; G.mistakes = 0; G.breaks = 0; G.ev.push({ k: 'lessondone', N: G.N }); G.ev.push({ k: 'patient', i: 0 }); } return; }
  // count teeth made clean of this lesson's layer (each one once)
  const st = D.steps[D.i], L = st.id === 'brush' ? 'plaque' : st.id === 'scaler' ? 'tartar' : 'stain', A = pat(G).arches[0];
  for (const t of A.teeth) { if (D.seen.includes(t.i)) continue; const had = t.cells.some(cl => cl['was' + L]); if (!had) { if (t.cells.some(cl => cl[L] > 0.3)) for (const cl of t.cells) cl['was' + L] = 1; continue; }
    if (tClean(t, L) && (L !== 'plaque' || tClean(t, 'food'))) { D.seen.push(t.i); D.n++; G.ev.push({ k: 'lessonok', n: D.n, need: st.need, t: t.i }); if (D.n >= st.need) { D.done = true; D.wait = 1.4; } } } }
function lessonReset(G, why) { const D = G.lesson; if (!D || D.done || !D.n) return; D.n = 0; const st = D.steps[D.i], L = st.id === 'brush' ? 'plaque' : st.id === 'scaler' ? 'tartar' : 'stain', R = Math.random;
  for (const i of D.seen) { const t = pat(G).arches[0].teeth[i]; t.cl = {}; for (const cl of t.cells) if (L !== 'tartar' || cl.edge) cl[L] = 0.8 + R() * 0.2; } D.seen = []; G.ev.push({ k: 'lessonmiss', how: 'Too fast! Calm, steady strokes. ' + st.how }); }

// ---------- for the robots: blind moves and an honest dentist ----------
// blind: a gesture lasts a while, so it is stepped by blindStep
function blindStep(G, dt) { const b = G.blind; b.t += dt; const u = Math.min(1, b.t / b.T); if (b.kind === 'drag' || b.kind === 'scrub') { const s = b.kind === 'scrub' ? Math.sin(u * TAU * 4) : u; moveTo(G, b.x0 + (b.x1 - b.x0) * s, b.y0 + (b.y1 - b.y0) * s); } if (u >= 1) { up(G); G.blind = null; } }
const rp = () => ({ x: -0.75 + Math.random() * 1.5, y: -0.75 + Math.random() * 1.2 });
const startBlind = (G, kind, T) => { if (G.blind) { up(G); G.blind = null; } const a = rp(), b2 = kind === 'scrub' ? { x: a.x + (Math.random() - 0.5) * 0.5, y: a.y + (Math.random() - 0.5) * 0.3 } : kind === 'hold' ? a : rp(); if (!down(G, a.x, a.y)) return; G.blind = { kind, t: 0, T, x0: a.x, y0: a.y, x1: b2.x, y1: b2.y }; };
const BLIND = {
  t: G => { const ts = G.cfg.tools; pickTool(G, ts[(Math.random() * ts.length) | 0]); },
  d: G => startBlind(G, 'drag', 0.3 + Math.random() * 1.2),
  s: G => startBlind(G, 'scrub', 0.6 + Math.random() * 1.2),
  h: G => startBlind(G, 'hold', 0.4 + Math.random() * 2.2),
  f: G => flip(G),
  r: G => reassure(G),
  k: G => finishPatient(G),
};
// HONEST: a dentist who looks: does the next job on the list with the right tool, at a calm pace; pauses and reassures when
// the patient is struggling. react: seconds to see and start; acc: how steady the hand is.
function honest(G, o, mem) {
  if (G.over) return; const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random, h = G.hand;
  if (G.phase !== 'work') { mem.job = null; return; }
  const P = pat(G), K = KINDS[P.kind];
  if (mem.wait > G.t) return;
  if (P.comfort < 0.3 && G.reCd <= 0) { reassure(G); }
  if (P.comfort < 0.25 && !(G.tool === 'wire' && G.gauge)) { if (h.down) up(G); mem.wait = G.t + 1.5; mem.job = null; return; }      // stop and let them breathe
  if (G.tool === 'drill' && G.drillT > 2.2 && h.down) { up(G); mem.job = null; mem.wait = G.t + 0.8 + react; return; }
  // the current job: a path the hand follows
  if (mem.job && (mem.job.pts.length || mem.job.hold > 0)) { const J = mem.job, tg = J.pts[0] || { x: h.x, y: h.y }, dx = tg.x - h.x, dy = tg.y - h.y, d = Math.hypot(dx, dy), v = J.v * (1.15 - react) * (0.85 + R() * 0.3) / 60;
    if (J.hold > 0) { J.hold -= 1 / 60; if (J.hold <= 0 && !J.pts.length) { up(G); mem.job = null; mem.wait = G.t + react * 0.8 + 0.15; return; } if (G.tool === 'wire' && G.gauge && gaugeP(G) >= mem.rel) { up(G); mem.job = null; } return; }
    if (d < v) { moveTo(G, tg.x, tg.y); J.pts.shift(); if (tg.hold) J.hold = tg.hold; } else moveTo(G, h.x + dx / d * v + (1 - acc) * (R() - 0.5) * 0.01, h.y + dy / d * v + (1 - acc) * (R() - 0.5) * 0.01);
    if (!J.pts.length && !(J.hold > 0)) { up(G); mem.job = null; mem.wait = G.t + react * 0.8 + 0.15; } return; }
  // pick the next job
  const L = left(P), mine = L.filter(q => q.a === G.arch), hidden = P.arches[G.arch].teeth.filter(t => (t.cav || t.abscess) && !t.found);
  const A = archOf(G), sweep = (t, layer, rr, v) => { const cl = t.cells.filter(c => layer == null || c[layer] > CLEAN), pts = []; cl.sort((a, b) => a.y - b.y || a.x - b.x); for (const c of cl) pts.push({ x: c.x, y: c.y }); return { pts, v }; };
  const go = (tool, job) => { pickTool(G, tool); if (!job.pts.length) return; const p0 = job.pts[0]; down(G, p0.x, p0.y); mem.job = job; mem.wait = 0; };
  if (G.lesson) { const st = G.lesson.steps[0]; const lay = st.id === 'brush' ? 'plaque' : st.id === 'scaler' ? 'tartar' : 'stain'; const t = A.teeth.find(q => q.cells.some(c => c[lay] > CLEAN || (lay === 'plaque' && c.food > CLEAN))); if (t) go(st.tool, sweep(t, null, 0, st.id === 'polish' ? 0.6 : 1.0)); return; }
  const need = w => mine.find(q => q.w === w);
  // look first when something hurts and nothing has been found
  if (hidden.length && G.cfg.tools.includes('mirror') && !mem.looked?.[G.pi + ':' + G.arch]) { mem.looked = mem.looked || {}; mem.looked[G.pi + ':' + G.arch] = 1; const pts = A.teeth.filter(t => !t.gone).map(t => ({ x: t.x, y: t.y, hold: 0.35 })); go('mirror', { pts, v: 1.4 }); return; }
  if (hidden.length && G.cfg.tools.includes('xray')) { go('xray', { pts: [{ x: 0, y: -0.2, hold: 1.3 }, { x: 0, y: -0.21 }], v: 1 }); return; }
  let q;
  if ((q = need('food') || need('plaque'))) { const t = A.teeth[q.t]; go('brush', sweep(t, null, 0, 1.0)); return; }
  if ((q = need('tartar'))) { const t = A.teeth[q.t]; go('scaler', sweep(t, 'tartar', 0, 0.7)); return; }
  if ((q = need('stain'))) { const t = A.teeth[q.t]; go('polish', sweep(t, 'stain', 0, 0.6)); return; }
  if (hidden.length && G.cfg.tools.includes('mirror')) { mem.looked[G.pi + ':' + G.arch] = 0; }
  if ((q = mine.find(q2 => q2.w === 'decay' && A.teeth[q2.t].found))) { const t = A.teeth[q.t]; go('drill', { pts: t.cells.filter(c => c.decay > 0.05).map(c => ({ x: c.x + (1 - acc) * (R() - 0.5) * 0.03, y: c.y, hold: 0.3 })), v: 0.5 }); return; }
  if ((q = need('rinse'))) { const t = A.teeth[q.t]; go('water', { pts: [{ x: t.x, y: t.y, hold: 0.6 }, { x: t.x + 0.01, y: t.y }], v: 1 }); return; }
  if ((q = need('fill') || need('chip'))) { const t = A.teeth[q.t]; go('fill', { pts: t.cells.filter(c => (c.hole > 0.2 || c.chip > 0) && c.fill < 0.9).map(c => ({ x: c.x, y: c.y, hold: 0.4 })), v: 0.5 }); return; }
  if ((q = need('smooth') || need('prep'))) { const t = A.teeth[q.t]; const pts = []; for (const c of t.cells.filter(c => c.extra > 0.1 || c.jag > 0.05)) pts.push({ x: c.x - 0.03, y: c.y }, { x: c.x + 0.03, y: c.y }, { x: c.x - 0.03, y: c.y + 0.01 }); go('shaper', { pts, v: 0.6 }); return; }
  if ((q = need('cure') || need('cement'))) { const t = A.teeth[q.t]; go('light', { pts: [{ x: t.x, y: t.y, hold: 2.0 }, { x: t.x + 0.005, y: t.y }], v: 1 }); return; }
  if ((q = need('crown'))) { const t = A.teeth[q.t]; pickTool(G, 'crown'); down(G, 0, 0.3); mem.job = { pts: [{ x: t.x + (1 - acc) * (R() - 0.5) * 0.1, y: t.y }], v: 1.2 }; return; }
  if ((q = need('bracket'))) { const B = A.braces, i = B.loose.find(j => !B.fixed.includes(j)), t = A.teeth[i]; go('glue', { pts: [{ x: t.x, y: t.y, hold: 1.2 }, { x: t.x + 0.005, y: t.y }], v: 1 }); return; }
  if ((q = need('wire'))) { const B = A.braces; mem.rel = B.g0 + 0.14 * (0.5 + (R() - 0.5) * (1.3 - acc)); go('wire', { pts: [{ x: 0, y: -0.3, hold: 9 }], v: 1 }); return; }
  if ((q = need('extract'))) { const t = A.teeth[q.t]; if (t.numbAt == null) { go('gel', { pts: [{ x: t.x, y: t.y, hold: 0.6 }, { x: t.x + 0.005, y: t.y }], v: 1 }); return; }
    if (G.t - t.numbAt < 3.1) { mem.wait = t.numbAt + 3.15; return; }
    const pts = []; for (let i = 0; i < 9; i++) pts.push({ x: t.x + (i % 2 ? 0.04 : -0.04), y: t.y, hold: 0.06 }); pts.push({ x: t.x, y: t.y - 0.3 }); go('forceps', { pts, v: 0.9 }); return; }
  if (L.length) { if (G.arch !== L[0].a || !mine.length) { flip(G); mem.wait = G.t + 0.4 + react; return; } }
  finishPatient(G); mem.wait = G.t + 0.5 + react;
}
function winNow(G) { if (!G || G.over || G.lesson) return; G.pi = G.pts.length - 1; G.phase = 'smile'; G.phT = 0.01; G.done = G.pts.length; step(G, 0.02); }
