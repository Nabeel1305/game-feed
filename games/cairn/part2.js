
// ===================== RULES: Cairn (game 37, the calm one of set 6) =====================
// Stack river stones on a boulder by a misty lake. The next stone sways gently above the stack; tap and it drops straight down
// where it is. A stone stays if the weight of everything above each stone sits over the part it rests on; if not, the stack tips
// from there and those stones roll into the lake. Two stones wait in your basket: tap one to take it next (a wide slab steadies
// a leaning stack; a round stone is lovely but tippy). Drop a stone just right ("perfect") three times in a row and you find a
// stone on the shore. Reach the height the level asks for before the basket is empty. No clock; take all the time you want.
// Later: a breeze that leans on tall stacks (you see it coming in the reeds and the mist), a sway that is quicker and wider.
// World: x metres across (+ right), y metres up; the boulder's top is y = 0, from x = -BASE to +BASE.
const RULES = [
  'The next stone <b>sways</b> above your stack. <b>Tap</b> to drop it straight down.',
  'A stack stands if every stone\'s weight above sits over what it rests on. Too far out and it <b>tips</b> into the lake.',
  'Two stones wait in your basket: <b>tap one</b> to use it next. Wide slabs steady a stack; round stones are tippy.',
  'Drop three <b>perfect</b> stones in a row and you find a new stone on the shore.',
  'Stack the height the level asks for. Later, a <b>breeze</b> leans on tall stacks: you see it coming in the reeds. No clock.',
];
const KINDS = {
  slab: { name: 'Slab', w: 1.5, h: 0.32, top: 0.62, bot: 0.66, col: 0x8a8478 },
  flat: { name: 'Flat stone', w: 1.1, h: 0.3, top: 0.5, bot: 0.52, col: 0x7a8088 },
  round: { name: 'Round stone', w: 0.95, h: 0.5, top: 0.28, bot: 0.28, col: 0x9a8a72 },
  pebble: { name: 'Pebble', w: 0.6, h: 0.28, top: 0.3, bot: 0.3, col: 0x6a7a7a },
  long: { name: 'Long stone', w: 1.9, h: 0.26, top: 0.5, bot: 0.4, col: 0x5a6270 },
  white: { name: 'Quartz', w: 0.9, h: 0.36, top: 0.34, bot: 0.36, col: 0xe8e4dc, rare: true },
};
const PLACES = [{ name: 'The misty lake', sky: 'mist' }, { name: 'The river bend', sky: 'morning' }, { name: 'The sea stacks', sky: 'golden' }, { name: 'The mountain tarn', sky: 'overcast' }, { name: 'The moonlit lake', sky: 'night' }];
const placeOf = N => Math.floor((N - 1) / 4) % PLACES.length;
const UPGRADES = [
  { id: 'eye', name: 'Steady eye', desc: 'A faint line shows where the stone will land.', max: 1, cost: l => 30 },
  { id: 'calm', name: 'Calm hands', desc: 'The stone sways more slowly.', max: 3, cost: l => 20 + l * 25 },
  { id: 'basket', name: 'Bigger basket', desc: 'One more stone each level.', max: 2, cost: l => 30 + l * 35 },
  { id: 'feel', name: 'Feel', desc: 'A wobbling stack shows which stone is weakest.', max: 1, cost: l => 25 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Pebble'], [40, 'Stacker'], [130, 'Balancer'], [320, 'Stone whisperer'], [700, 'Cairn keeper'], [1500, 'Mountain of calm']];
const BASE = 0.6;
function makeCfg(N, help) { help = help || N === 1;      /* 26 Nov 2026, his words: "the first level should be the only one that is given": level 1 always has the help a loss gives */
  const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), e = easyOf(N);
  return { N, f, help: !!help, place: placeOf(N), sky: PLACES[placeOf(N)].sky,
    goal: Math.round(x(6, 11, 30)),                                          // stones high
    spare: Math.round(x(3.4, 2.6, 25)) + upLv('basket') + (help ? 1 : 0),        // stones in the basket beyond the goal
    swing: x(0.48, 0.75, 30) * (1 + 0.15 * e) * (help ? 0.85 : 1), amp: x(1.2, 1.4, 30),     // how fast and how far the stone sways
    calm: 1 - 0.1 * upLv('calm'), round: x(0.08, 0.3, 30), pebble: x(0.05, 0.22, 30), long: x(0.1, 0.18, 30),
    wind: N >= 5 ? x(0, 0.035, 30) : 0, perfect: 0.07, edge: 0.06 };
}
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, place: cfg.place, sky: cfg.sky,
    stack: [], basket: [], left: cfg.goal + cfg.spare, sel: 0, hang: null, falling: [], perfects: 0, inRow: 0, found: 0, fell: 0, best: 0, wind: 0, gust: null, nextGust: 6, coins: 0, tilt: 0 };
  fillBasket(G); nextHang(G);
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else G.ev.push({ k: 'start' });
  return G;
}
function pickKind(G) { const R = G.rnd(), c = G.cfg; if (R < 0.03) return 'white'; if (R < 0.03 + c.round) return 'round'; if (R < 0.03 + c.round + c.pebble) return 'pebble'; if (R < 0.03 + c.round + c.pebble + c.long) return 'long'; return G.rnd() < 0.45 ? 'slab' : 'flat'; }
function newStone(G, kind) { const K = KINDS[kind], j = 0.9 + G.rnd() * 0.2; return { kind, w: K.w * j, h: K.h * (0.9 + G.rnd() * 0.2), top: K.top * j * 0.7, bot: K.bot * j * 0.7, x: 0, y: 0, rot: G.rnd() * 6, seed: (G.rnd() * 1e6) | 0 }; }
function fillBasket(G) { while (G.basket.length < 2 && G.left - (G.hang ? 1 : 0) - G.basket.length > 0) G.basket.push(newStone(G, pickKind(G))); }
function nextHang(G) { if (G.hang || !G.basket.length) return; const s = G.basket.splice(clamp(G.sel, 0, G.basket.length - 1), 1)[0]; G.sel = 0; G.hang = { st: s, ph: G.rnd() * TAU, t: 0, sp: 0.85 + G.rnd() * 0.3 }; fillBasket(G); }
const topY = G => G.stack.reduce((a, s) => a + s.h, 0);
function hangX(G) { const h = G.hang, c = G.cfg, cx = 0; return cx + Math.sin(h.ph) * c.amp; }
function stackTopX(G) { const s = G.stack; return s.length ? s[s.length - 1].x : 0; }
// ---------- what you do ----------
function pickStone(G, i) { if (G.over || !G.hang || i < 0 || i >= G.basket.length) return false; const was = G.hang.st; G.hang.st = G.basket[i]; G.basket[i] = was; G.ev.push({ k: 'pick' }); return true; }
function drop(G) { if (G.over || !G.hang || G.falling.some(f => f.drop) || G.settle > 0) return false; const h = G.hang, st = h.st; st.x = hangX(G); G.hang = null; G.left--; G.falling.push({ st, y: topY(G) + 1.4, vy: 0, drop: true }); G.ev.push({ k: 'drop' }); return true; }
// ---------- balance ----------
// the support a stone rests on: where its bottom touches the top of the one below (or the boulder)
function support(G, i) { const s = G.stack[i], b = i ? G.stack[i - 1] : null, lo = Math.max(s.x - s.bot, b ? b.x - b.top : -BASE), hi = Math.min(s.x + s.bot, b ? b.x + b.top : BASE); return [lo, hi]; }
// the least margin in the stack (metres inside the support, negative = it tips) and where; the breeze pushes on what is above
function balance(G, wind = 0) { const S = G.stack; let worst = 1e9, at = -1, mass = 0, mx = 0, hAbove = 0;
  for (let i = S.length - 1; i >= 0; i--) { const s = S[i], m = s.w * s.h; mass += m; mx += m * s.x; hAbove += s.h; const cx = mx / mass + wind * hAbove * hAbove * 0.5, [lo, hi] = support(G, i);
    const mg = hi < lo ? -1 : Math.min(cx - lo, hi - cx); if (mg < worst) { worst = mg; at = i; } }
  return { m: worst, at }; }
function land(G, f) {
  const st = f.st, S = G.stack, b = S[S.length - 1], lo = b ? b.x - b.top : -BASE, hi = b ? b.x + b.top : BASE;
  if (st.x + st.bot < lo || st.x - st.bot > hi) { G.ev.push({ k: 'slip', x: st.x, y: topY(G) }); G.fell++; G.inRow = 0; lessonMiss(G); after(G); return; }
  st.y = topY(G); S.push(st); const bal = balance(G);
  if (bal.m < 0) { topple(G, bal.at, 'tip'); after(G); return; }
  if (bal.m < G.cfg.edge) { G.teeter = { at: bal.at, t: 0.9 }; G.ev.push({ k: 'teeter', at: bal.at }); G.inRow = 0; G.settle = 1; return; }      // right on the edge: it rocks, and goes
  const off = Math.abs(st.x - perfectX(G, S.length - 1)), perfect = off < G.cfg.perfect * (G.lesson ? 3.5 : 1);      /* (the lesson's JUST RIGHT was 1.6 times the level's: three in a row was hard to learn from; 26 Nov 2026) */
  G.best = Math.max(G.best, S.length);
  if (perfect) { G.perfects++; G.inRow++; G.coins += 1; G.ev.push({ k: 'perfect', n: G.inRow, x: st.x, y: st.y + st.h }); if (G.inRow % 3 === 0) { G.left++; G.found++; G.ev.push({ k: 'found' }); } }
  else { G.inRow = 0; G.ev.push({ k: 'place', x: st.x, y: st.y + st.h, m: bal.m }); }
  lessonSee(G, 'place', perfect, off, st.kind, bal.m);
  if (bal.m < 0.08) G.ev.push({ k: 'wobble', at: bal.at });
  G.settle = 0.5; after(G);
}
// the spot to drop a stone for the best balance of the whole stack (what a careful eye aims for)
function perfectX(G, i) { const S = G.stack, s = S[i], keep = s.x; let best = keep, bm = -1e9; const b = S[i - 1], c0 = b ? b.x : 0, span = (b ? b.top : BASE) + s.bot;
  for (let k = -24; k <= 24; k++) { s.x = c0 + k / 24 * span; const m = balanceUpTo(G, i) - Math.abs(s.x - c0) * 0.02; if (m > bm + 1e-9) { bm = m; best = s.x; } } s.x = keep; return best; }
function balanceUpTo(G, n) { const S = G.stack; let worst = 1e9, mass = 0, mx = 0; for (let i = n; i >= 0; i--) { const s = S[i], m = s.w * s.h; mass += m; mx += m * s.x; const cx = mx / mass, [lo, hi] = support(G, i); worst = Math.min(worst, hi < lo ? -1 : Math.min(cx - lo, hi - cx)); } return worst; }
function topple(G, at, why) { const gone = G.stack.splice(at); G.fell += gone.length; G.inRow = 0; G.ev.push({ k: 'topple', n: gone.length, at, why, stones: gone }); lessonMiss(G); }
function after(G) {
  if (G.lesson) { if (!G.hang) nextHang(G); return; }
  if (G.stack.length >= G.cfg.goal) { G.standT = 1.6; return; }      // it must stand a moment
  if (!G.hang) nextHang(G);
  if (!G.hang && !G.falling.length) finish(G, false);
}
// ---------- the lake, step by step ----------
function step(G, dt) {
  if (G.over) return; G.t += dt; const c = G.cfg;
  if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0 && G.lessonEnd) { G.lessonEnd = false; Object.assign(G, { stack: [], basket: [], left: c.goal + c.spare, sel: 0, hang: null, falling: [], perfects: 0, inRow: 0, found: 0, fell: 0, best: 0, coins: 0 }); fillBasket(G); nextHang(G); G.ev.push({ k: 'start' }); } return; }
  if (G.settle > 0) G.settle -= dt;
  if (G.teeter) { G.teeter.t -= dt; if (G.teeter.t <= 0) { const at = G.teeter.at; G.teeter = null; topple(G, at, 'tip'); after(G); if (G.over) return; } }
  if (G.hang) { G.hang.t += dt; G.hang.ph += dt * c.swing * c.calm * (G.hang.sp || 1) * (1 + 0.04 * G.stack.length) * Math.PI; }
  for (let i = G.falling.length - 1; i >= 0; i--) { const f = G.falling[i]; f.vy -= 14 * dt; f.y += f.vy * dt; if (f.y <= topY(G)) { G.falling.splice(i, 1); land(G, f); if (G.over) return; } }
  // the breeze: you see it coming (the reeds bend, the mist moves), then it leans on the stack for a few seconds
  if (c.wind && !G.lesson) { G.nextGust -= dt; if (!G.gust && G.nextGust <= 0) { G.gust = { t: 0, dir: G.rnd() < 0.5 ? -1 : 1, pow: c.wind * (0.6 + G.rnd() * 0.6) }; G.ev.push({ k: 'gustcoming', dir: G.gust.dir }); }
    if (G.gust) { const g = G.gust; g.t += dt; const u = g.t < 1.6 ? 0 : g.t < 2.4 ? (g.t - 1.6) / 0.8 : g.t < 4.4 ? 1 : g.t < 5.4 ? 1 - (g.t - 4.4) : 0; G.wind = g.dir * g.pow * u; if (g.t > 5.4) { G.gust = null; G.wind = 0; G.nextGust = 7 + G.rnd() * 6; }
      if (G.wind && G.stack.length) { const b = balance(G, G.wind); if (b.m < 0) { topple(G, b.at, 'wind'); G.standT = 0; after(G); } } } }
  if (G.standT > 0) { G.standT -= dt; if (G.stack.length < c.goal) G.standT = 0; else if (G.standT <= 0) return finish(G, true); }
  if (G.lesson) lessonTick(G, dt);
}
function finish(G, win) {
  G.over = win ? 'won' : 'lost'; const left = G.left, stars = win ? (left >= G.cfg.spare - 0 && G.fell === 0 ? 3 : G.fell <= 2 ? 2 : 1) : 0;
  G.res = { win, stars, height: G.stack.length, goal: G.cfg.goal, best: G.best, perfects: G.perfects, fell: G.fell, found: G.found, left, coins: G.coins + (win ? 4 + Math.ceil(G.N / 3) : 0), shape: G.stack.map(s => [s.kind, +s.x.toFixed(3), +s.w.toFixed(2), +s.h.toFixed(2), s.seed]) };
  G.ev.push({ k: win ? 'won' : 'lost' }); return true;
}
// ---------- LESSONS ----------
const AIMCARD = {"pic": "🪨", "win": "STACK STONES THIS HIGH", "lose": "IT FALLS, OR NO STONES LEFT", "how": "DROP EACH STONE SO IT BALANCES"};      // the aim card: specs/aims.json (tools/aims.py)
const LESSONS = {
  1: [{ id: 'place', title: 'DROP', say: G => cairnCue(G)[0], do: G => cairnCue(G)[1], at: G => cairnCue(G)[2], how: 'Tap when the stone is right over the middle of the stack. Four in a row, each near the middle.', need: 4 }],
  2: [{ id: 'perfect', title: 'JUST RIGHT', say: G => cairnCue(G)[0], do: G => cairnCue(G)[1], at: G => cairnCue(G)[2], how: 'Wait for the stone to come right over the middle, then tap. Three perfect drops in a row.', need: 3 }],
  3: [{ id: 'pick', title: 'CHOOSE', say: G => cairnCue(G)[0], do: G => cairnCue(G)[1], at: G => cairnCue(G)[2], how: 'Your stack leans. Tap the wide slab in your basket to take it, and drop it to steady the stack. Twice.', need: 2 }],
};
// THE TUTORIAL SAYS WHEN (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing happens"). It showed a tap all the time,
// so a tap at a wrong moment was the tutorial's fault, not his. Now: WAIT… while the stone swings, TAP NOW! for the moment it will be over the
// spot (a fifth of a second ahead, the time a thumb takes), and in the choosing lesson the hand is on the stone in the basket to take.
const CCUE = { key: null, pick: -1, x: 0 };
function cairnCue(G) { if (G.over || G.wait > 0 || !G.hang || G.falling.length || G.settle > 0) return ['WAIT…', 'wait', false];
  const c = G.cfg, S = G.stack, h = G.hang; if (CCUE.key !== h.st || CCUE.n !== S.length) { const opts = [h.st, ...G.basket]; let bi = 0, bm = -1e9, bx = 0;
    opts.forEach((st, i) => { const y0 = st.y, x0 = st.x; st.y = topY(G); S.push(st); const px = perfectX(G, S.length - 1); st.x = px; const m = balanceUpTo(G, S.length - 1) - (i ? 0.02 : 0); S.pop(); st.y = y0; st.x = x0; if (m > bm) { bm = m; bi = i; bx = px; } });
    CCUE.key = h.st; CCUE.n = S.length; CCUE.pick = bi - 1; CCUE.x = bx; }
  if (CCUE.pick >= 0 && ui.basket && ui.basket[CCUE.pick]) { const r = ui.basket[CCUE.pick]; return ['TAP THE WIDE STONE', 'tap', [r.x + r.w / 2, r.y + r.h / 2]]; }
  const sp = c.swing * c.calm * (h.sp || 1) * (1 + 0.04 * S.length) * Math.PI, xs = Math.sin(h.ph + sp * 0.24) * c.amp;      // where it will be when a thumb that sees TAP NOW! lands (about a quarter of a second)
  const id = lessonNow(G) ? lessonNow(G).id : '', band = (id === 'place' ? 0.32 : c.perfect * 3.5) * 0.5, now = G.t * 1000;
  if (Math.abs(xs - CCUE.x) < band) CCUE.lit = now;      // the TAP NOW! stays up a third of a second, so it can be seen: tap as it appears
  return now - (CCUE.lit || -1e9) < 250 ? ['TAP NOW!', 'tap', [W / 2, H * 0.62]] : ['WAIT…', 'wait', false]; }
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonSetup(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonSetup(G) { const st = lessonNow(G); G.stack = []; G.falling = []; G.hang = null; G.basket = [];
  if (st.id === 'pick') { const a = newStone(G, 'flat'); a.x = 0; a.y = 0; const b = newStone(G, 'flat'); b.x = 0.32; b.y = a.h; G.stack.push(a, b); G.basket = [newStone(G, 'round'), newStone(G, 'slab')]; G.hang = { st: newStone(G, 'round'), ph: 0, t: 0 }; G.left = 99; return; }
  G.left = 99; G.basket = [newStone(G, 'flat'), newStone(G, 'slab')]; G.hang = { st: newStone(G, 'slab'), ph: 0, t: 0 }; }
function lessonTick(G) { if (!G.hang && !G.falling.length) { if (!G.basket.length) G.basket = [newStone(G, 'flat'), newStone(G, 'slab')]; nextHang(G); } }
function lessonSee(G, what, perfect, off, kind, mg) { const st = lessonNow(G); if (!st) return; let ok = false;
  if (st.id === 'place' && what === 'place') { if (off > 0.32) { G.lesson.n = 0; G.ev.push({ k: 'lessonmiss', how: st.how }); return; } ok = true; } if (st.id === 'perfect' && what === 'place') { if (!perfect) { G.lesson.n = 0; G.ev.push({ k: 'lessonmiss', how: st.how }); return; } ok = true; }
  if (st.id === 'pick' && what === 'place') { if (mg < 0.09 && !perfect) { lessonMiss(G); return; } ok = true; }
  if (!ok) return; G.lesson.n++; if (G.lesson.n < st.need) { G.ev.push({ k: 'lessonok', n: G.lesson.n, need: st.need }); return; }
  G.lesson.i++; G.lesson.n = 0; if (G.lesson.i >= G.lesson.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.lessonEnd = true; G.wait = 1.4; } else lessonSetup(G); }
function lessonMiss(G) { const st = lessonNow(G); if (!st) return; G.lesson.n = 0; G.ev.push({ k: 'lessonmiss', how: st.how }); if (st.id === 'pick') lessonSetup(G); }
// ---------- for the robots ----------
// BLIND: a thumb that does not look: taps to drop whenever, or taps a stone in the basket
const BLIND = { d: G => { drop(G); }, p: G => { pickStone(G, (Math.random() * 2) | 0); } };
// a careful stacker: picks the stone that keeps the stack steadiest, then taps as the swaying stone passes the best spot (a
// person's tap lands a little early or late: react and acc set by how much)
function honest(G, o, mem) {
  const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random, c = G.cfg;
  if (G.over || G.wait > 0 || !G.hang || G.falling.length || G.settle > 0) { mem.plan = null; return; }
  if (!mem.plan) {      // choose a stone: try each, keep the one with the widest safe spot
    const S = G.stack, opts = [G.hang.st, ...G.basket]; let bi = 0, bm = -1e9, bx = 0;
    opts.forEach((st, i) => { st.y = topY(G); S.push(st); const px = perfectX(G, S.length - 1); st.x = px; const m = balanceUpTo(G, S.length - 1) - (i ? 0.02 : 0); S.pop(); if (m > bm) { bm = m; bi = i; bx = px; } });
    if (bi > 0) { pickStone(G, bi - 1); mem.plan = null; mem.wait = G.t + 0.3 + react; return; }
    mem.plan = { x: bx, err: (R() < acc ? 0.35 : 1.3) * (R() * 2 - 1) * react * 0.5 }; }
  if (G.t < (mem.wait || 0)) return;
  // tap when the stone will be over the spot, a little early or late
  const h = G.hang, sp = c.swing * c.calm * (h.sp || 1) * (1 + 0.04 * G.stack.length) * Math.PI, x = hangX(G), x2 = Math.sin(h.ph + sp / 60) * c.amp, v = (x2 - x) * 60;
  const lead = mem.plan.err, xl = x + v * lead; if ((xl - mem.plan.x) * (x2 + v * lead - mem.plan.x) <= 0 || Math.abs(xl - mem.plan.x) < 0.01) { drop(G); mem.plan = null; mem.wait = G.t + 0.4; }
}
function winNow(G) { if (!G || G.over) return; G.lesson = null; while (G.stack.length < G.cfg.goal) { const s = newStone(G, 'slab'); s.x = 0; s.y = topY(G); G.stack.push(s); } finish(G, true); }
