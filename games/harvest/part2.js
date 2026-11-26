// ===================== RULES: Harvest Valley (game 28) =====================
// A farm by the day, in 3D. Each level is one day: the market cart wants orders filled before sunset (carrots, tomatoes,
// pumpkins, eggs, later corn and sunflowers). Everything is a tap on the thing itself:
//   - an empty bed: plant the seed picked in the seed bar at the bottom;
//   - a crop with a DROP over it: water it (a thirsty crop that is not watered wilts, then dies);
//   - a ripe crop (it sparkles): harvest it into the basket;
//   - the hen house when the eggs are laid: collect them; the cart: sell what the orders want;
//   - a crow on a crop: shoo it before it eats it.
// Taps on the wrong thing cost: water a crop that is not thirsty and it rots; pull one that is not ripe and it is lost; poke
// the hens before they have laid and they sulk. Rain waters everything; the hot sun dries crops faster.
// Coins buy farm upgrades that stay (sprinklers, more beds, fertiliser, a scarecrow, a second hen house, a bigger cart).
const RULES = [
  '<b>Pick a seed</b> at the bottom, then <b>tap an empty bed</b> to plant it.',
  'A <b>💧 drop</b> over a crop means it is thirsty: tap it to water. Do not water a crop that is not thirsty: it rots.',
  'When a crop <b>sparkles</b> it is ripe: tap to harvest. Pull it early and it is lost.',
  'Tap the <b>hen house</b> when the eggs are laid. Tap a <b>crow</b> to shoo it.',
  'Tap the <b>cart</b> to sell: fill every order before the sun sets.',
];
const CROPS = {
  carrot: { name: 'Carrot', icon: '🥕', grow: 12, drinks: 2, price: 2 },
  tomato: { name: 'Tomato', icon: '🍅', grow: 18, drinks: 2, price: 4 },
  pumpkin: { name: 'Pumpkin', icon: '🎃', grow: 28, drinks: 3, price: 8 },
  corn: { name: 'Corn', icon: '🌽', grow: 22, drinks: 3, price: 6, from: 8 },
  sunflower: { name: 'Sunflower', icon: '🌻', grow: 16, drinks: 1, price: 5, from: 14 },
};
const EGG = { icon: '🥚', price: 3 };
const UPGRADES = [
  { id: 'beds', name: 'More beds', desc: 'Another row of beds to plant.', max: 2, cost: l => 30 + l * 40 },
  { id: 'sprinkler', name: 'Sprinklers', desc: 'One row waters itself (more with each).', max: 3, cost: l => 25 + l * 25 },
  { id: 'fert', name: 'Fertiliser', desc: 'Crops grow faster.', max: 3, cost: l => 15 + l * 15 },
  { id: 'scare', name: 'Scarecrow', desc: 'Fewer crows come.', max: 2, cost: l => 20 + l * 25 },
  { id: 'hens', name: 'More hens', desc: 'Eggs come sooner.', max: 3, cost: l => 15 + l * 15 },
  { id: 'cart', name: 'Painted cart', desc: 'More coins for every sale.', max: 3, cost: l => 15 + l * 15 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Farmhand'], [60, 'Grower'], [200, 'Farmer'], [500, 'Rancher'], [1100, 'Landowner'], [2400, 'Harvest king']];
const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
const seasonOf = N => SEASONS[Math.floor((N - 1) / 5) % 4];
const WEATHERS = { spring: ['morning', 'rain', 'noon', 'mist'], summer: ['noon', 'golden', 'noon', 'storm'], autumn: ['golden', 'overcast', 'rain', 'sunset'], winter: ['overcast', 'mist', 'morning', 'dawn'] };
function weatherOf(N) { if (N <= 3) return ['morning', 'noon', 'golden'][N - 1]; const R = rng(N * 2207 + 9); R(); const w = WEATHERS[seasonOf(N)]; return w[(R() * w.length) | 0]; }
const seedsOf = N => Object.keys(CROPS).filter(k => N >= (CROPS[k].from || 1) && (k !== 'pumpkin' || N >= 2) && (k !== 'tomato' || N >= 2));

function makeCfg(N, help) {
  const f = curve(N), e = easyOf(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), w = weatherOf(N);
  return { N, f, e, help: !!help, weather: w, rain: w === 'rain' || w === 'storm', hot: w === 'noon' && seasonOf(N) === 'summer',
    cols: 4, rows: 3 + upLv('beds'), day: x(100, 78, 30) * (help ? 1.2 : 1), grow: (1 - 0.1 * upLv('fert')) * x(1, 1.15, 40),
    thirstT: x(9, 5.5, 30) * (w === 'noon' && seasonOf(N) === 'summer' ? 0.75 : 1), wiltT: x(9, 6, 30), sprinkle: upLv('sprinkler'),
    eggT: x(14, 18, 30) * (1 - 0.15 * upLv('hens')), crows: N < 4 ? 0 : x(0.04, 0.12, 30) * (1 - 0.3 * upLv('scare')), crowEat: x(5, 3, 30),
    load: x(1, 2.8, 30), price: 1 + 0.15 * upLv('cart') };
}
// the day's orders: what the cart wants (enough to need most of the day, never more than the farm can do)
function makeOrders(G) {
  const c = G.cfg, R = G.rnd, L = lessonNow(G); if (L) return L.orders.map(o => ({ ...o, got: 0 }));
  const seeds = seedsOf(G.N), out = [], n = Math.min(4, 1 + Math.round(c.load)); let budget = (c.day - 12) * c.cols * 3 * 0.04 * (0.55 + c.load * 0.2);
  const kinds = seeds.slice(); if (G.N >= 3) kinds.push('egg'); kinds.sort(() => R() - 0.5);
  for (let i = 0; i < n && i < kinds.length; i++) { const kd = kinds[i], cost = kd === 'egg' ? 1.4 : CROPS[kd].grow / 9, want = Math.max(1, Math.round(budget / (n - i) / cost * (0.8 + R() * 0.4))); out.push({ kd, want: kd === 'egg' ? Math.min(want, 4) : want, got: 0 }); budget -= want * cost; }
  return out;
}
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null,
    weather: cfg.weather, season: seasonOf(N), sun: 0, beds: [], seed: 'carrot', basket: {}, eggs: 0, eggT: cfg.eggT * 0.6, sulk: 0, crows: [], coins: 0, combo: 0, best: 0, lost: 0, sold: 0, orders: [] };
  for (let r = 0; r < cfg.rows; r++) for (let cI = 0; cI < cfg.cols; cI++) G.beds.push({ r, c: cI, crop: null });
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else G.orders = makeOrders(G);
  return G;
}
// a bed's crop: grows while watered; asks for a drink at set points; wilts if it waits too long, then dies
function plant(G, b, kd) { const C = CROPS[kd]; b.crop = { kd, g: 0, grow: C.grow * G.cfg.grow, drinks: C.drinks, drank: 0, thirsty: 0, wilt: 0, ripe: false, rot: 0 }; G.ev.push({ k: 'plant', bed: G.beds.indexOf(b), kd }); lessonSee(G, 'plant'); }
const needDrink = cr => !cr.ripe && cr.drank < cr.drinks && cr.g >= cr.grow * (cr.drank + 0.5) / (cr.drinks + 0.5) - 0.01;
// ---------- the thumb: a tap on a bed does what that bed needs, and the wrong thing costs ----------
function tapBed(G, i) {
  const b = G.beds[i]; if (G.over || !b) return 'none';
  const crow = G.crows.find(q => q.bed === i && !q.gone); if (crow) { crow.gone = true; G.ev.push({ k: 'shoo', bed: i }); lessonSee(G, 'shoo'); return 'shoo'; }
  const cr = b.crop;
  if (!cr) { if (!seedsOf(G.N).includes(G.seed) && !lessonNow(G)) G.seed = 'carrot'; plant(G, b, G.seed); return 'plant'; }
  if (cr.dead || cr.rot) { b.crop = null; G.ev.push({ k: 'clear', bed: i }); return 'clear'; }
  if (cr.ripe) { b.crop = null; G.basket[cr.kd] = (G.basket[cr.kd] || 0) + 1; G.combo++; G.best = Math.max(G.best, G.combo); G.ev.push({ k: 'harvest', bed: i, kd: cr.kd, n: G.combo }); lessonSee(G, 'harvest'); return 'harvest'; }
  if (cr.thirsty > 0) { cr.thirsty = 0; cr.wilt = 0; cr.drank++; G.ev.push({ k: 'water', bed: i }); lessonSee(G, 'water'); return 'water'; }
  // not thirsty, not ripe: too much water rots it (a second tap on a soaked crop pulls it up)
  cr.rot = 1; G.lost++; G.combo = 0; G.ev.push({ k: 'rot', bed: i, kd: cr.kd }); lessonMiss(G, 'rot'); return 'rot';
}
function pickSeed(G, kd) { if (G.over || !CROPS[kd]) return; if (!lessonNow(G) && !seedsOf(G.N).includes(kd)) return; G.seed = kd; G.ev.push({ k: 'seed', kd }); }
function tapCoop(G) { if (G.over) return; if (G.eggs > 0) { G.basket.egg = (G.basket.egg || 0) + G.eggs; G.ev.push({ k: 'eggs', n: G.eggs }); G.eggs = 0; lessonSee(G, 'eggs'); return 'eggs'; } G.sulk = 6; G.eggT = Math.max(G.eggT, G.cfg.eggT * 0.6); G.ev.push({ k: 'sulk' }); lessonMiss(G, 'sulk'); return 'sulk'; }
function tapCart(G) {
  if (G.over) return; let sold = 0, coins = 0;
  for (const o of G.orders) { const have = G.basket[o.kd] || 0, n = Math.min(have, o.want - o.got); if (n > 0) { o.got += n; G.basket[o.kd] -= n; sold += n; coins += n * (o.kd === 'egg' ? EGG.price : CROPS[o.kd].price); } }
  if (!sold) { G.ev.push({ k: 'nosale' }); return 'none'; }
  coins = Math.round(coins * G.cfg.price); G.coins += coins; G.sold += sold; G.ev.push({ k: 'sell', n: sold, coins }); lessonSee(G, 'sell');
  if (G.orders.every(o => o.got >= o.want)) { if (G.lesson) lessonSee(G, 'done'); else finish(G, true); }
  return 'sell';
}
// ---------- every frame ----------
function step(G, dt) {
  if (G.over) return; G.t += dt; const c = G.cfg, R = G.rnd, L = lessonNow(G);
  if (!L) { G.sun += dt; if (G.sun >= c.day) { finish(G, false, 'dusk'); return; } }
  const rain = c.rain && Math.sin(G.t * 0.21 + G.seed) > -0.2;
  G.raining = rain;
  for (let i = 0; i < G.beds.length; i++) { const b = G.beds[i], cr = b.crop; if (!cr || cr.dead || cr.rot || cr.ripe) continue;
    if (cr.thirsty > 0) { cr.thirsty += dt; if (rain || b.r < c.sprinkle) { cr.thirsty = 0; cr.drank++; G.ev.push({ k: 'sprinkle', bed: i }); continue; }
      if (cr.thirsty > c.thirstT) { cr.wilt += dt; if (cr.wilt > c.wiltT) { cr.dead = true; G.lost++; G.combo = 0; G.ev.push({ k: 'dead', bed: i, kd: cr.kd }); lessonMiss(G, 'dead'); } } continue; }
    cr.g += dt; if (needDrink(cr)) { cr.thirsty = 0.001; G.ev.push({ k: 'thirst', bed: i }); }
    if (cr.g >= cr.grow && cr.drank >= cr.drinks) { cr.ripe = true; G.ev.push({ k: 'ripe', bed: i, kd: cr.kd }); } }
  // the hens
  if (G.N >= 3 || (L && L.eggs)) { if (G.sulk > 0) G.sulk -= dt; else if (G.eggs < 3) { G.eggT -= dt; if (G.eggT <= 0) { G.eggs++; G.eggT = c.eggT; G.ev.push({ k: 'laid', n: G.eggs }); } } }
  // crows: land on a growing crop; if not shooed, they eat it
  if (c.crows > 0 && !L && R() < c.crows * dt) { const can = G.beds.map((b, i) => i).filter(i => G.beds[i].crop && !G.beds[i].crop.dead && !G.beds[i].crop.rot && !G.crows.some(q => q.bed === i && !q.gone)); if (can.length) { const bed = can[(R() * can.length) | 0]; G.crows.push({ bed, t: 0 }); G.ev.push({ k: 'crow', bed }); } }
  if (L && L.crows && G.crows.filter(q => !q.gone).length < 1 && R() < dt * 0.5) { const can = G.beds.map((b, i) => i).filter(i => G.beds[i].crop); if (can.length) G.crows.push({ bed: can[(R() * can.length) | 0], t: 0 }); }
  for (const q of G.crows) { if (q.gone) { q.t += dt; continue; } q.t += dt; if (q.t > c.crowEat * (L ? 3 : 1)) { q.gone = true; q.ate = true; const b = G.beds[q.bed]; if (b.crop) { b.crop = null; G.lost++; G.combo = 0; G.ev.push({ k: 'eaten', bed: q.bed }); lessonMiss(G, 'eaten'); } } }
  G.crows = G.crows.filter(q => !q.gone || q.t < 1);
}
function finish(G, win, why) {
  const c = G.cfg; G.over = win ? 'won' : 'lost';
  const left = 1 - G.sun / c.day, stars = win ? (G.lost === 0 && left > 0.15 ? 3 : G.lost <= 1 ? 2 : 1) : 0;
  G.res = { win, why, stars, coins: G.coins + (win ? stars * 4 + Math.ceil(G.N / 2) : 0), sold: G.sold, lost: G.lost, best: G.best, combo: G.best, left, time: G.t };
  G.ev.push({ k: win ? 'won' : 'lost', why });
}
// ---------- LESSONS ----------
const AIMCARD = {"pic": "🥕", "win": "FILL THE ORDERS BY SUNSET", "lose": "THE SUN SETS FIRST", "how": "PLANT, WATER, PICK"};      // the aim card: specs/aims.json (tools/aims.py)
const LESSONS = {
  1: [{ id: 'grow', title: 'SOW, WATER, HARVEST', say: G => harvCue(G)[0], do: G => harvCue(G)[1], at: G => harvCue(G)[2], how: 'Tap an empty bed to plant a carrot. When a 💧 drop shows, tap it to water. When it sparkles, tap to pick it. Then tap the CART to sell three carrots.', need: 1, ok: w => w === 'done', orders: [{ kd: 'carrot', want: 3 }] }],
  2: [{ id: 'careful', title: 'ONLY WHEN THEY ASK', say: G => harvCue(G)[0], do: G => harvCue(G)[1], at: G => harvCue(G)[2], how: 'Water only crops with a 💧 drop: water a crop that is not thirsty and it rots. Pick a TOMATO in the seed bar too. Sell two carrots and two tomatoes.', need: 1, ok: w => w === 'done', orders: [{ kd: 'carrot', want: 2 }, { kd: 'tomato', want: 2 }] }],
  3: [{ id: 'hens', title: 'EGGS AND CROWS', say: G => harvCue(G)[0], do: G => harvCue(G)[1], at: G => harvCue(G)[2], how: 'Tap the hen house when eggs are laid (not before: the hens sulk). Tap a crow to shoo it off your crops. Sell three eggs and two carrots.', need: 1, ok: w => w === 'done', orders: [{ kd: 'egg', want: 3 }, { kd: 'carrot', want: 2 }], eggs: true, crows: true }],
};
// THE TUTORIAL SHOWS ONE TAP AT A TIME, WITH THE HAND ON IT (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing
// happens"). It said TAP: PLANT, 💧, PICK (three moves) with a hand in a box. Now the robot is asked (dryPlan) and the hand is on the bed, the
// seed, the hen house or the cart, with the word for what the tap does there: PLANT / WATER / PICK / SHOO THE CROW / TAP THE TOMATO SEEDS / EGGS / SELL.
function harvCue(G) { if (G.over) return ['WAIT…', 'wait', false]; const P = dryPlan(G, null, { t: -1, cd: -1, next: -1 }); if (!P) return ['WAIT… IT IS GROWING', 'wait', false];
  const at = (x, y, z) => { const v = scr(x, y, z); return [v.x, v.y]; };
  if (P[0] === 'pickSeed') { const sb = seedBar(G).find(q => q.kd === P[1]); return ['TAP THE ' + String(P[1]).toUpperCase() + ' SEEDS', 'tap', sb ? [sb.x + sb.w / 2, sb.y + sb.h / 2] : false]; }
  if (P[0] === 'tapCoop') return ['TAP THE EGGS', 'tap', at(COOP[0], 1.3, COOP[1])]; if (P[0] === 'tapCart') return ['TAP THE CART: SELL', 'tap', at(CART[0], 1.4, CART[1])];
  if (P[0] === 'tapBed') { const b = G.beds[P[1]], [bx, bz] = bedPos(b), crow = G.crows.find(q => q.bed === P[1] && !q.gone);
    const cr = b.crop, w = crow ? 'SHOO THE CROW' : !cr ? 'TAP TO PLANT' : cr.dead || cr.rot ? 'TAP TO CLEAR IT' : cr.ripe ? 'TAP TO PICK' : cr.thirsty > 0 ? 'TAP TO WATER 💧' : 'TAP HERE'; return [w, 'tap', at(bx, 0.6, bz)]; }
  return ['WAIT…', 'wait', false]; }
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0, miss: 0 }; G.orders = makeOrders(G); G.eggT = 4; G.ev.push({ k: 'lessonnext', first: true }); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonSee(G, what) {
  const D = G.lesson; if (!D) return; const st = D.steps[D.i]; if (!st.ok(what)) return;
  D.i++; D.n = 0; D.miss = 0;
  if (D.i >= D.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); Object.assign(G, { sun: 0, basket: {}, eggs: 0, coins: 0, lost: 0, combo: 0, best: 0, sold: 0 }); G.crows = []; G.beds.forEach(b => b.crop = null); G.orders = makeOrders(G); }
  else { G.ev.push({ k: 'lessonnext' }); G.orders = makeOrders(G); }
}
function lessonMiss(G, why) { const D = G.lesson; if (!D) return; D.miss++;
  if (why === 'rot' || why === 'dead' || why === 'eaten') { G.beds.forEach(b => b.crop = null); G.basket = {}; G.crows = []; G.orders = makeOrders(G); G.ev.push({ k: 'lessonmiss', why, how: 'Start again: ' + ({ rot: 'too much water rots a crop. Water only crops showing a 💧 drop.', dead: 'a thirsty crop left too long dies. Watch for the 💧 drops.', eaten: 'tap crows to shoo them.' })[why] }); return; } const how = { rot: 'That crop was not thirsty: too much water rots it. Water only crops showing a 💧 drop. Tap the rotten one to clear the bed.', dead: 'A thirsty crop waited too long and died. Watch for the 💧 drops.', sulk: 'No eggs yet: wait until the hen house shows eggs.', eaten: 'A crow ate a crop: tap crows to shoo them.' }[why]; if (D.miss === 1 || D.miss % 3 === 0) G.ev.push({ k: 'lessonmiss', why, how: how || D.steps[D.i].how }); }

// ---------- for the robots ----------
// BLIND: a thumb tapping without looking: a bed (any), the hen house, the cart, a seed in the bar
const BLIND = { b: G => tapBed(G, (Math.random() * G.beds.length) | 0), h: G => tapCoop(G), c: G => tapCart(G), s: G => { const s2 = seedsOf(G.N); pickSeed(G, s2[(Math.random() * s2.length) | 0]); } };
// a farmer who looks: shoos crows, waters what asks, picks what is ripe, plants what the orders still need (the slow crops
// first while the day is young), collects eggs when laid, sells when the basket holds something the cart wants
function honest(G, o, mem) {
  const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, c = G.cfg;
  if (G.t < (mem.next || 0)) return; mem.next = G.t + 0.35 + react * 1.2;
  const slip = () => Math.random() > acc + (1 - acc) * 0.8;
  if (slip()) { mem.next += 0.6 + react; if (Math.random() < 0.15) ACT.tapBed(G, (Math.random() * G.beds.length) | 0); return; }
  const crow = G.crows.find(q => !q.gone); if (crow) return ACT.tapBed(G, crow.bed);
  const idx = G.beds.map((b, i) => i);
  const thirsty = idx.find(i => G.beds[i].crop && G.beds[i].crop.thirsty > 0 && !G.beds[i].crop.dead && !G.beds[i].crop.rot); if (thirsty != null) return ACT.tapBed(G, thirsty);
  const ripe = idx.find(i => G.beds[i].crop && G.beds[i].crop.ripe); if (ripe != null) return ACT.tapBed(G, ripe);
  const bad = idx.find(i => G.beds[i].crop && (G.beds[i].crop.dead || G.beds[i].crop.rot)); if (bad != null) return ACT.tapBed(G, bad);
  if (G.eggs > 0 && G.orders.some(q => q.kd === 'egg' && q.got + (G.basket.egg || 0) < q.want)) return ACT.tapCoop(G);
  if (G.orders.some(q => (G.basket[q.kd] || 0) > 0 && q.got < q.want)) return ACT.tapCart(G);
  // what to plant: what the orders still need, beyond what is in the basket and in the ground
  const inGround = kd => G.beds.filter(b => b.crop && b.crop.kd === kd && !b.crop.dead && !b.crop.rot).length;
  const need = G.orders.filter(q => q.kd !== 'egg').map(q => ({ kd: q.kd, n: q.want - q.got - (G.basket[q.kd] || 0) - inGround(q.kd) })).filter(q => q.n > 0).sort((a, b) => CROPS[b.kd].grow - CROPS[a.kd].grow);
  const empty = idx.find(i => !G.beds[i].crop); if (need.length && empty != null) { if (G.seed !== need[0].kd) { ACT.pickSeed(G, need[0].kd); return; } return ACT.tapBed(G, empty); }
}
function winNow(G) { if (!G || G.over) return; G.lesson = null; for (const o of G.orders) G.basket[o.kd] = o.want; tapCart(G); }

// what the robot would do now, without doing it (tools/dry_plan.py): the tutorial shows this move
const ACT_REAL = { tapBed, pickSeed, tapCoop, tapCart }; let ACT = ACT_REAL;
function dryPlan(G, o, mem) { let got = null; const rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { if (!got && !(a.length > 2 && a.slice(1).every(v => v === 0 || v === false))) got = [n, ...a.slice(1)]; return true; };      /* (a stick at rest, all its numbers 0, is not a move; a first bed, number 0, is) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return got; }
