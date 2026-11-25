// ===================== RULES: Short Order (game 16) =====================
// A diner kitchen, seen from where the cook stands. Orders come in on tickets. Drag food from the trays: things to cook into a
// pan, things to chop onto the board, bread and buns straight onto the plate. In a pan, the side underneath browns: tap the pan
// to flip it when that side is golden (not pale, not black). Swipe across the board to chop. When a cooked thing is golden on
// both sides (an egg on one), drag it to the plate. Drag the plate to the pass to serve: it must be the order on the oldest
// ticket, all of it, nothing else. Burnt food goes in the bin. Customers who wait too long walk out.

const RULES = [
  '<b>Drag food from the trays:</b> meat, fish, eggs and batter into a pan; vegetables onto the board; bread and buns onto the plate.',
  '<b>In the pan, the side underneath browns.</b> Tap the pan to flip it when it is golden. Pale is raw; black is burnt.',
  '<b>Tap the board</b> (or swipe on it) to chop what is on it.',
  'A dish is <b>built from the bottom up</b>, in the order on its ticket (1, 2, 3...). Built in that order: an extra tip. <b>Tap the plate</b> to take the top thing off.',
  '<b>Golden both sides</b> (an egg: just its underside)? Drag it to the plate. Chopped? Drag it to the plate.',
  '<b>Drag the plate to the pass</b> to serve the oldest ticket: everything on it, nothing else.',
  'Burnt or wrong food: drag it to the bin. Three customers walk out and the shift is over.',
];
const WEATHERS = ['golden', 'rain', 'morning', 'night', 'overcast', 'sunset', 'storm', 'noon', 'dusk', 'mist'];
function weatherOf(N) { if (N <= 2) return ['morning', 'golden'][N - 1]; const R = rng(N * 2203 + 9); R(); return WEATHERS[(R() * WEATHERS.length) | 0]; }
// the food: where it goes and how fast it cooks (seconds for one side to be golden)
const FOOD = {
  patty: { name: 'Patty', to: 'pan', cook: 6, sides: 2 }, steak: { name: 'Steak', to: 'pan', cook: 7, sides: 2 }, salmon: { name: 'Salmon', to: 'pan', cook: 6.5, sides: 2 },
  egg: { name: 'Egg', to: 'pan', cook: 5, sides: 1 }, pancake: { name: 'Pancake', to: 'pan', cook: 4.5, sides: 2 },
  lettuce: { name: 'Lettuce', to: 'board', chops: 3 }, tomato: { name: 'Tomato', to: 'board', chops: 3 }, onion: { name: 'Onion', to: 'board', chops: 4 },      // (25 Nov 2026: one chop fewer each; a tap chops)
  bun: { name: 'Bun', to: 'plate' }, toast: { name: 'Toast', to: 'plate' },
};
const DISHES = [
  { id: 'pancakes', name: 'Pancakes', items: ['pancake'], from: 1 },
  { id: 'eggtoast', name: 'Egg on toast', items: ['toast', 'egg'], from: 1 },
  { id: 'burger', name: 'Burger', items: ['bun', 'patty', 'lettuce', 'tomato'], from: 2 },
  { id: 'salmon', name: 'Salmon salad', items: ['salmon', 'lettuce', 'tomato'], from: 4 },
  { id: 'steak', name: 'Steak & onions', items: ['steak', 'onion'], from: 6 },
  { id: 'stack', name: 'Pancake stack', items: ['pancake', 'pancake'], from: 8 },
  // 23 Nov 2026, his note: "make the orders more creative and complex as time goes on": more dishes, bigger ones later, and later shifts lean to them
  { id: 'garden', name: 'Garden toast', items: ['toast', 'tomato', 'lettuce'], from: 3 },
  { id: 'onionburger', name: 'Onion burger', items: ['bun', 'patty', 'onion'], from: 5 },
  { id: 'lox', name: 'Salmon & eggs', items: ['toast', 'salmon', 'egg'], from: 9 },
  { id: 'breakfast', name: 'Big breakfast', items: ['toast', 'egg', 'pancake', 'tomato'], from: 11 },
  { id: 'surfturf', name: 'Surf & turf', items: ['steak', 'salmon', 'onion'], from: 13 },
  { id: 'double', name: 'Double deluxe', items: ['bun', 'patty', 'patty', 'lettuce', 'tomato', 'onion'], from: 16 },
  { id: 'tower', name: 'Pancake tower', items: ['pancake', 'pancake', 'pancake'], from: 18 },
  { id: 'feast', name: 'The works', items: ['steak', 'egg', 'toast', 'tomato', 'onion'], from: 22 },
];
const TRAY = ['patty', 'steak', 'salmon', 'egg', 'pancake', 'lettuce', 'tomato', 'onion', 'bun', 'toast'];
const GOLD = [0.78, 1.12], BURNT = 1.3;

function makeCfg(N, help) {
  const f = curve(N), e = easyOf(N), boss = N % 10 === 0, x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s));
  return { N, f, e, boss, help: !!help, lives: 3,
    orders: N <= 2 ? 3 : Math.round(x(4, 14, 35)) + (boss ? 3 : 0),
    gap: x(16, 3.5, 35) + 6 * e,                                  // seconds between new tickets
    patience: (x(70, 20, 35) + 25 * e) * (help ? 1.25 : 1),      // seconds a customer waits
    heat: x(1, 1.9, 35) * (1 - 0.15 * e),                      // how fast pans cook
    gold: [GOLD[0] - 0.06 * e + Math.min(0.06, f * 0.002), GOLD[1] + 0.06 * e - Math.min(0.08, f * 0.0025)], pans: N >= 3 ? 3 : 2, maxOpen: N <= 2 ? 1 : N <= 6 ? 2 : N < 15 ? 3 : 4 };
}
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null,
    weather: weatherOf(N), pans: [], board: null, plate: [], tickets: [], made: 0, lost: 0, served: 0, perfect: 0, tips: 0, next: 1.5, lives: cfg.lives, wasted: 0, streak: 0, bestStreak: 0 };
  for (let i = 0; i < cfg.pans; i++) G.pans.push(null);
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G);
  return G;
}
function newTicket(G) { const c = G.cfg, R = G.rnd, L = lessonNow(G), pool = DISHES.filter(d => d.from <= Math.max(G.N, 1)), wts = pool.map(q => 1 + Math.max(0, q.items.length - 1) * Math.min(1.5, G.N / 15) + (q.from > G.N - 4 ? 1 : 0)), tw = wts.reduce((a2, b2) => a2 + b2, 0); let r2 = R() * tw, pick = pool[0]; for (let i = 0; i < pool.length; i++) { r2 -= wts[i]; if (r2 <= 0) { pick = pool[i]; break; } }      /* bigger dishes, and the newest, come more often later */
  const d = L && L.dish ? DISHES.find(q => q.id === L.dish) : pick;
  G.tickets.push({ dish: d, wait: 0, max: c.patience * (L ? 3 : 1), id: ++G.made }); G.ev.push({ k: 'ticket', name: d.name }); }
// ---------- the moves ----------
// take a food from the trays to where it goes ('pan' i, 'board', 'plate')
function take(G, food, dest, i) {
  if (G.over) return false; const F = FOOD[food]; if (!F) return false;
  if (dest === 'pan') { if (F.to !== 'pan') return refuse(G, 'notpan'); if (i == null) i = G.pans.findIndex(p => !p); if (i < 0 || G.pans[i]) return refuse(G, 'panfull'); G.pans[i] = { food, sides: [0, 0], down: 0, t: 0 }; G.ev.push({ k: 'sizzle', i }); return true; }
  if (dest === 'board') { if (F.to !== 'board') return refuse(G, 'notboard'); if (G.board) return refuse(G, 'boardfull'); G.board = { food, chops: 0 }; G.ev.push({ k: 'onboard' }); return true; }
  if (dest === 'plate') { if (F.to !== 'plate') return refuse(G, 'notplate'); G.plate.push({ food, q: 1 }); G.ev.push({ k: 'plated', food }); return true; }
  return false;
}
function refuse(G, why) { G.ev.push({ k: 'refuse', why }); return false; }
function flip(G, i) { const p = G.pans[i]; if (G.over || !p) return; if (FOOD[p.food].sides === 1) { G.ev.push({ k: 'noflip' }); return; } p.down = 1 - p.down; G.ev.push({ k: 'flip', i, side: p.sides[1 - p.down] }); lessonSee(G, 'flip', p.sides[1 - p.down]); }
function chop(G) { const b = G.board; if (G.over || !b || b.chops >= FOOD[b.food].chops) return; b.chops++; G.ev.push({ k: 'chop', n: b.chops, done: b.chops >= FOOD[b.food].chops }); if (b.chops >= FOOD[b.food].chops) lessonSee(G, 'chopped'); }
const cookedOk = (G, p) => { const g = G.cfg.gold, F = FOOD[p.food]; return F.sides === 1 ? p.sides[0] >= g[0] && p.sides[0] <= g[1] : p.sides.every(s => s >= g[0] && s <= g[1]); };
function panToPlate(G, i) { const p = G.pans[i]; if (G.over || !p) return false; const F = FOOD[p.food], g = G.cfg.gold, burnt = p.sides.some(s => s > BURNT), raw = F.sides === 1 ? p.sides[0] < g[0] : p.sides.some(s => s < g[0]);
  const q = burnt ? 'burnt' : raw ? 'raw' : cookedOk(G, p) ? (p.sides.every((s, j) => F.sides === 1 && j === 1 || (s >= 0.85 && s <= 1.02)) ? 'perfect' : 'good') : 'over';
  G.plate.push({ food: p.food, q }); G.pans[i] = null; G.ev.push({ k: 'plated', food: p.food, q }); return true; }
function boardToPlate(G) { const b = G.board; if (G.over || !b) return false; if (b.chops < FOOD[b.food].chops) return refuse(G, 'notchopped'); G.plate.push({ food: b.food, q: 'good' }); G.board = null; G.ev.push({ k: 'plated', food: b.food, q: 'good' }); return true; }
// 25 Nov 2026 (his review: "with complex things that require multiple ingredients, you need to make a way that i can structure it, like what
// comes first the bun or the patty"): the ticket numbers the layers from the bottom up, the plate stacks them in the order you put them
// on, a dish built in the ticket's order earns one tip more (out of order is still served), and a tap on the plate takes the top one off.
function unplate(G) { if (G.over || !G.plate.length) return false; const p = G.plate.pop(); G.ev.push({ k: 'unplate', food: p.food }); return true; }
function trash(G, what, i) { if (G.over) return; if (what === 'pan' && G.pans[i]) { G.pans[i] = null; G.wasted++; } else if (what === 'board' && G.board) { G.board = null; G.wasted++; } else if (what === 'plate' && G.plate.length) { G.plate = []; G.wasted++; } else return; G.ev.push({ k: 'bin' }); }
// serve: the plate must be exactly the oldest ticket's dish, cooked right
function serve(G) {
  if (G.over || !G.plate.length) return; const tk = G.tickets[0]; if (!tk) { refuse(G, 'noorder'); return; }
  const want = tk.dish.items.slice().sort().join(), have = G.plate.map(p => p.food).sort().join(), bad = G.plate.find(p => p.q === 'burnt' || p.q === 'raw' || p.q === 'over');
  // a plate sent back is a mark against you, like a walkout
  if (want !== have || bad) { G.ev.push({ k: 'sendback', why: want !== have ? 'wrong' : bad.q }); G.plate = []; tk.wait += 10; G.streak = 0; if (G.lesson) { lessonMiss(G, want !== have ? 'wrong' : bad.q); return; } G.lives--; if (G.lives <= 0) finish(G, false, 'sentback'); return; }
  const perfect = G.plate.every(p => p.q !== 'over') && G.plate.filter(p => FOOD[p.food].to === 'pan').every(p => p.q === 'perfect'), fast = tk.wait < tk.max * 0.5;
  const neat = new Set(tk.dish.items).size > 1 && G.plate.map(p => p.food).join() === tk.dish.items.join();
  G.tickets.shift(); G.plate = []; G.served++; if (perfect) G.perfect++; G.streak++; G.bestStreak = Math.max(G.bestStreak, G.streak); G.tips += (perfect ? 3 : 1) + (fast ? 2 : 0) + (neat ? 1 : 0);
  G.ev.push({ k: 'served', name: tk.dish.name, perfect, fast, neat, n: G.served }); lessonSee(G, 'served');
  if (!G.lesson && G.served + G.lost >= G.cfg.orders) finish(G, true);
}
// ---------- every frame ----------
function step(G, dt) {
  if (G.over) return; G.t += dt; const c = G.cfg, L = lessonNow(G);
  // the pans cook the side that is down; the up side cools a touch
  for (let i = 0; i < G.pans.length; i++) { const p = G.pans[i]; if (!p) continue; const F = FOOD[p.food], before = p.sides[p.down]; p.sides[p.down] += dt * c.heat / F.cook * (L ? 0.7 : 1); p.t += dt;
    if (before < c.gold[0] && p.sides[p.down] >= c.gold[0]) G.ev.push({ k: 'golden', i }); if (before < BURNT && p.sides[p.down] >= BURNT) { G.ev.push({ k: 'burnt', i }); lessonMiss(G, 'burnt'); } }
  // new tickets
  const want = L ? (L.dish || L.two ? 1 : 0) : 1;
  if (want) { G.next -= dt; const open = G.tickets.length, total = G.served + open + G.lost; if (G.next <= 0 && open < c.maxOpen && (L || total < c.orders)) { newTicket(G); G.next = c.gap * (0.7 + 0.6 * G.rnd()); } }
  // patience
  for (const tk of G.tickets.slice()) { tk.wait += dt; if (tk.wait >= tk.max) { G.tickets.splice(G.tickets.indexOf(tk), 1); G.lost++; G.streak = 0; G.ev.push({ k: 'walkout', name: tk.dish.name }); if (L) { lessonMiss(G, 'slow'); } else { G.lives--; if (G.lives <= 0) { finish(G, false, 'walkouts'); return; } } } }
  if (!G.lesson && G.served + G.lost >= c.orders && !G.tickets.length && !G.over) finish(G, G.lives > 0);
}
function finish(G, win, why) {
  const c = G.cfg; G.over = win ? 'won' : 'lost';
  G.res = { win, why, stars: win ? (G.lost === 0 && G.perfect >= Math.ceil(G.served * 0.6) ? 3 : G.lost === 0 ? 2 : 1) : 0, served: G.served, orders: c.orders, perfect: G.perfect, tips: G.tips, lost: G.lost, combo: G.bestStreak, time: G.t };
  G.ev.push({ k: win ? 'won' : 'lost', why });
}
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'flip', title: 'GOLDEN, THEN FLIP', say: 'DRAG IT TO A PAN, TAP TO FLIP', do: 'drag', dir: 'up', how: 'Drag a pancake into a pan. When the underside turns golden, tap the pan to flip it. Do it twice.', need: 2, ok: (w, s) => w === 'flip' && s >= GOLD[0] - 0.06 && s <= GOLD[1] + 0.06 },
      { id: 'serve', title: 'PLATE IT AND SERVE', say: 'DRAG TO THE PLATE, THEN UP', do: 'drag', dir: 'up', how: 'Golden both sides? Drag it to the plate, then drag the plate up to the pass.', need: 1, ok: w => w === 'served', dish: 'pancakes' }],
  2: [{ id: 'chop', title: 'CHOP', say: 'TAP TO CHOP', do: 'tap', how: 'Drag a tomato onto the board and swipe across it until it is chopped.', need: 2, ok: w => w === 'chopped' },
      { id: 'burger', title: 'A WHOLE BURGER', say: 'MAKE THE BURGER', do: 'none', how: 'Patty in the pan (flip when golden), chop lettuce and tomato, a bun on the plate, everything on, then serve.', need: 1, ok: w => w === 'served', dish: 'burger' }],
  3: [{ id: 'two', title: 'TWO AT ONCE', say: 'TWO AT ONCE', do: 'none', how: 'While one thing cooks, chop or start the next. Serve two orders.', need: 2, ok: w => w === 'served', dish: null, two: true }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0, miss: 0 }; G.ev.push({ k: 'lessonnext', first: true }); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonSee(G, what, arg) {
  const D = G.lesson; if (!D) return; const st = D.steps[D.i]; if (!st.ok(what, arg)) return;
  D.n++; if (D.n < st.need) { G.ev.push({ k: 'lessonok', n: D.n, need: st.need }); if (st.two && !G.tickets.length) newTicket(G); return; }
  D.i++; D.n = 0; D.miss = 0;
  if (D.i >= D.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); Object.assign(G, { tickets: [], served: 0, lost: 0, perfect: 0, tips: 0, lives: G.cfg.lives, next: 2, plate: [], board: null, streak: 0 }); G.pans = G.pans.map(() => null); }
  else { G.ev.push({ k: 'lessonnext' }); }
}
function lessonMiss(G, why) { const D = G.lesson; if (!D) return; D.miss++; G.ev.push({ k: 'lessonmiss', why, how: D.steps[D.i].how }); }

// ---------- for the robots ----------
// BLIND: tap a pan, swipe the board, drag a random tray item somewhere, pan or board to plate, serve, bin.
const BLIND = {
  f: G => flip(G, (Math.random() * G.pans.length) | 0), c: G => chop(G),
  t: G => { const fd = TRAY[(Math.random() * TRAY.length) | 0]; take(G, fd, FOOD[fd].to); },
  p: G => panToPlate(G, (Math.random() * G.pans.length) | 0), b: G => boardToPlate(G), s: G => serve(G), x: G => trash(G, 'plate'),
};
// HONEST: a cook who reads the oldest ticket and works it, flipping and plating by eye (late by react, sometimes wrong by acc)
function honest(G, o, mem) {
  const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc;
  // a flip is only a tap: he can do it between drags
  mem.tap = mem.tap || 0; if (G.t >= mem.tap) for (let i = 0; i < G.pans.length; i++) { const p = G.pans[i]; if (p && FOOD[p.food].sides === 2 && p.sides[1 - p.down] < G.cfg.gold[0] && p.sides[p.down] + 0.12 * G.cfg.heat * react / 5 >= G.cfg.gold[0] + 0.1 - (1 - acc) * (Math.random() - 0.5)) { flip(G, i); mem.tap = G.t + react; return; }
    // and he watches the ring: the drag to the plate starts as it turns golden
    if (p && cookedOk(G, p) && (FOOD[p.food].sides === 1 || p.sides[1 - p.down] >= G.cfg.gold[0]) && p.sides[p.down] >= G.cfg.gold[0] + 0.04 && G.tickets[0] && G.tickets[0].dish.items.includes(p.food) && G.plate.filter(q => q.food === p.food).length < G.tickets[0].dish.items.filter(q => q === p.food).length) { panToPlate(G, i); mem.tap = G.t + react; mem.next = Math.max(mem.next || 0, G.t + 0.4); return; } }
  mem.next = mem.next || 0; if (G.t < mem.next) return; mem.next = G.t + 0.55 + react * 1.2;      // a drag across the counter takes a thumb most of a second
  const g = G.cfg.gold, L = lessonNow(G), early = (s) => s + 0.12 * G.cfg.heat * react / 5;
  // pans first: flip at golden, plate when done, bin when burnt
  for (let i = 0; i < G.pans.length; i++) { const p = G.pans[i]; if (!p) continue; const F = FOOD[p.food], d = p.sides[p.down];
    if (p.sides.some(s => s > BURNT)) { trash(G, 'pan', i); return; }
    if (F.sides === 2 && p.sides[1 - p.down] < g[0] && early(d) >= (g[0] + 0.12) - (1 - acc) * (Math.random() - 0.5)) { flip(G, i); return; }
    if (cookedOk(G, p) && early(d) >= g[0] + 0.08 && (F.sides === 1 || p.sides[1 - p.down] >= g[0])) { const tk = G.tickets[0]; if (tk && tk.dish.items.includes(p.food)) { panToPlate(G, i); return; } } }
  if (L && L.id === 'flip' && !G.pans.some(Boolean)) { take(G, 'pancake', 'pan'); return; }
  if (L && L.id === 'chop') { if (!G.board) { take(G, 'tomato', 'board'); return; } if (G.board.chops < FOOD[G.board.food].chops) { chop(G); return; } trash(G, 'board'); return; }
  const tk = G.tickets[0]; if (!tk) return;
  const need = tk.dish.items.slice(); for (const p of G.plate) { const k2 = need.indexOf(p.food); if (k2 >= 0) need.splice(k2, 1); else { trash(G, 'plate'); return; } }
  if (!need.length) { serve(G); return; }
  if (G.board) { if (G.board.chops < FOOD[G.board.food].chops) { chop(G); return; } if (need.includes(G.board.food)) { boardToPlate(G); return; } trash(G, 'board'); return; }
  for (const fd of need) { const F = FOOD[fd], inPan = G.pans.filter(p => p && p.food === fd).length, wanted = need.filter(q => q === fd).length;
    if (F.to === 'pan' && inPan < wanted && G.pans.some(p => !p)) { take(G, Math.random() < acc * 1.05 ? fd : TRAY[(Math.random() * TRAY.length) | 0], 'pan'); return; }
    if (F.to === 'board') { take(G, fd, 'board'); return; }
    if (F.to === 'plate') { take(G, fd, 'plate'); return; } }
}
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.served = G.cfg.orders - 1; G.lost = 0; G.tickets.length = 0; if (!G.tickets.length) newTicket(G); const tk = G.tickets[0]; G.plate = tk.dish.items.map(f => ({ food: f, q: 'perfect' })); serve(G); }
