// ===================== RULES: Haggle (game 46, his idea) =====================
// You run a pawn shop. One by one, people come in with something to sell and a price in mind. Look it over (the maker, the
// state it is in, what they say about it), check it if you doubt it (the loupe for signatures and hallmarks, the UV lamp for
// fakes; each look tries their patience), then haggle: drag the dial to your offer and OFFER. Too low and they are insulted
// (their patience drops, and they may walk out); high enough and they counter or take it; pay more than it is worth and you
// lose. At closing time everything you bought sells for what it is really worth: the day's profit against the target. Every
// sale teaches the Price Book what things fetch, so you slowly learn the value of everything, as a pawnbroker does.
const RULES = [
  'Someone brings in an item and names a price. Look at <b>what it is, who made it, the state it is in</b>.',
  'In doubt? <b>🔍 Loupe</b> checks signatures and hallmarks, <b>🔦 UV</b> spots fakes. Each look tries their patience.',
  '<b>Drag the dial</b> to your offer and tap <b>OFFER</b>. Too low insults them; they may walk. They will counter.',
  'Pay less than it is worth: at <b>closing</b> it sells for its real value. Make the day\'s profit target.',
  'Every sale fills your <b>Price Book</b>: you learn what things are worth.',
];
// the kinds of thing people bring, what a good one fetches, and three makers (cheap, middling, fine) for each
const TYPES = [
  { id: 'watch', name: 'Wristwatch', base: 320, makers: ['Tikka', 'Marlowe', 'Kronos'], lux: true, n: 1 },
  { id: 'guitar', name: 'Electric guitar', base: 420, makers: ['Strum', 'Halcyon', 'Gibbard'], n: 1 },
  { id: 'ring', name: 'Ring', base: 480, makers: ['Plated', 'Silver', '18ct gold'], lux: true, n: 1 },
  { id: 'camera', name: 'Camera', base: 260, makers: ['Snappy', 'Orion', 'Leitzmann'], n: 1 },
  { id: 'comic', name: 'Comic book', base: 120, makers: ['Reprint', 'Original', 'Rare issue'], ed: true, n: 2 },
  { id: 'sneakers', name: 'Trainers', base: 180, makers: ['Strider', 'Airflow', 'Limited drop'], lux: true, n: 2 },
  { id: 'vase', name: 'Vase', base: 220, makers: ['Modern', 'Victorian', 'Ming-style'], lux: true, n: 3 },
  { id: 'coin', name: 'Old coin', base: 150, makers: ['Copper', 'Silver', 'Gold'], lux: true, n: 3 },
  { id: 'console', name: 'Games console', base: 230, makers: ['Retrobox', 'PlayZone', 'Prototype'], n: 4 },
  { id: 'painting', name: 'Painting', base: 600, makers: ['Print', 'Amateur oil', 'Old master'], lux: true, sig: true, n: 5 },
  { id: 'violin', name: 'Violin', base: 700, makers: ['Student', 'Workshop', 'Cremona-style'], lux: true, n: 7 },
  { id: 'handbag', name: 'Handbag', base: 380, makers: ['High street', 'Bellini', 'Maison Vey'], lux: true, n: 9 },
];
const TIER = [0.35, 1, 2.6], COND = [{ t: 'mint, still boxed', m: 1.3 }, { t: 'in good shape', m: 1 }, { t: 'worn and scratched', m: 0.6 }, { t: 'broken', m: 0.25 }];
const SELLERS = [
  { id: 'desperate', name: 'needs the money today', walk: [0.35, 0.5], ask: [1.0, 1.2], pat: 5, face: 0 },
  { id: 'casual', name: 'clearing out the loft', walk: [0.45, 0.62], ask: [1.05, 1.4], pat: 5, face: 1 },
  { id: 'savvy', name: 'knows what it is worth', walk: [0.68, 0.82], ask: [1.1, 1.5], pat: 4, face: 2 },
  { id: 'shady', name: 'in a hurry, no questions', walk: [0.3, 0.5], ask: [1.0, 1.6], pat: 4, face: 3 },
];
const PLACES = [{ name: 'Market Street' }, { name: 'The High Street' }, { name: 'Antiques Row' }, { name: 'Bond Street' }];
const placeOf = N => Math.min(3, Math.floor((N - 1) / 6));
const UPGRADES = [
  { id: 'book', name: 'Price guide', desc: 'The Price Book shows its ranges while you haggle.', max: 1, cost: l => 40 },
  { id: 'charm', name: 'Kettle on', desc: 'A cup of tea: everyone has one more patience.', max: 1, cost: l => 45 },
  { id: 'window', name: 'Shop window', desc: 'Things sell for 10% more.', max: 2, cost: l => 35 + l * 40 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Junk dealer'], [40, 'Pawnbroker'], [130, 'Antiques dealer'], [320, 'Auction house'], [700, 'Collector'], [1500, 'Tycoon']];
function makeCfg(N, help) { const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s));
  return { N, f, help: !!help, place: placeOf(N), people: Math.round(x(7, 9, 25)), target: 0, share: x(0.13, 0.25, 30), vs: x(1, 3.2, 30),
    fakes: N >= 3 ? x(0.12, 0.3, 30) : 0, claims: N >= 2 ? x(0.25, 0.5, 30) : 0, hot: N >= 4, types: TYPES.filter(t => t.n <= N), sell: 1 + 0.1 * upLv('window'), pat: upLv('charm') }; }
// one customer and the thing they bring
function makeVisit(G, opts = {}) { const R = G.rnd, c = G.cfg, T = opts.type ? TYPES.find(t => t.id === opts.type) : c.types[(R() * c.types.length) | 0];
  const dk = G.deck && G.deck[G.n % G.deck.length] || {}, tier = opts.tier != null ? opts.tier : dk.tier != null ? dk.tier : 1, cond = opts.cond != null ? opts.cond : dk.cond != null ? dk.cond : 1;
  const sl = SELLERS[opts.seller != null ? opts.seller : dk.seller != null ? dk.seller : (R() * SELLERS.length) | 0], fake = opts.fake != null ? opts.fake : !!(T.lux && tier === 2 && R() < c.fakes * (sl.id === 'shady' ? 2.4 : 0.7));
  const claim = opts.claim != null ? opts.claim : (R() < c.claims ? (T.sig ? 'signed' : T.ed ? 'a first edition' : 'one of a kind') : null), claimTrue = claim ? (opts.claimTrue != null ? opts.claimTrue : R() < 0.5) : false;
  const vs = c.vs; let V = T.base * vs * TIER[tier] * COND[cond].m * (claimTrue ? 1.7 : 1); if (G.hot === T.id) V *= 1.35; if (fake) V = Math.max(10, T.base * vs * 0.06); V = Math.round(V / 5) * 5;
  // what the seller believes and will take
  const believed = fake || (claim && !claimTrue) ? T.base * vs * TIER[tier] * COND[cond].m * (claim ? 1.7 : 1) : V, wl = sl.walk[0] + R() * (sl.walk[1] - sl.walk[0]);
  const walk = Math.round(believed * wl / 5) * 5, ask = Math.round(Math.max(walk * 1.3, believed * (sl.ask[0] + R() * (sl.ask[1] - sl.ask[0]))) / 5) * 5;
  return { id: G.nid++, T, tier, maker: T.makers[tier], cond, sl, fake, claim, claimTrue, V, walk, ask, cur: ask, pat: sl.pat + c.pat, maxPat: sl.pat + c.pat, offers: 0, seen: {}, mood: 0, name: pick(R, ['Dave', 'Mrs Patel', 'Gary', 'Joyce', 'Kemi', 'Old Tom', 'Chantelle', 'Ivan', 'Bea', 'Mo', 'Lucy', 'Mr Grant']), lastOffer: 0 }; }
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, place: cfg.place, nid: 1, bought: [], passed: 0, walked: 0, visit: null, n: 0, wait: 0, hot: null };
  if (cfg.hot) { const h = cfg.types[(G.rnd() * cfg.types.length) | 0]; G.hot = h.id; }
  planDay(G);
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else { G.visit = G.queue[0]; G.ev.push({ k: 'start' }); G.ev.push({ k: 'enter' }); }
  return G; }
// the whole day is dealt in the morning; the target is a share of what today's things are really worth (so a day of junk asks
// less, and a lucky day of treasures asks more: skill decides it, not the mix)
function planDay(G) { G.deck = dealDay(G); G.queue = []; for (let i = 0; i < G.cfg.people; i++) { G.n = i; G.queue.push(makeVisit(G)); } G.n = 0;
  const pot = G.queue.reduce((a, v) => a + (v.fake ? 0 : v.V), 0); G.cfg.target = Math.max(100, Math.round(pot * G.cfg.share * (G.cfg.help ? 0.8 : 1) / 10) * 10); }
// a day's customers are dealt, not drawn: fine, middling and cheap things, their states and the sellers in fixed shares, shuffled
function dealDay(G) { const R = G.rnd, n = G.cfg.people, share = (arr, w) => { const out = []; w.forEach((f, i) => { for (let q = 0; q < Math.round(f * n); q++) out.push(arr[i]); }); while (out.length < n) out.push(arr[1]); return out.slice(0, n).sort(() => R() - 0.5); };
  const tiers = share([0, 1, 2], [0.28, 0.44, 0.28]), conds = share([0, 1, 2, 3], [0.14, 0.43, 0.29, 0.14]), sellers = share([0, 1, 2, 3], [0.25, 0.25, 0.25, 0.25]);
  return tiers.map((t, i) => ({ tier: t, cond: conds[i], seller: sellers[i] })); }
function step(G, dt) { if (G.over) return; G.t += dt; if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0) { G.wait = 0; const f = G.next; G.next = null; if (f) f(); } } }
// ---------- what you can do ----------
// look closer: the loupe (signatures, hallmarks: is the claim true?) or the UV lamp (is it fake?). It tries their patience.
function inspect(G, tool) { const v = G.visit; if (!v || G.over || G.wait > 0 || v.seen[tool]) return false; v.seen[tool] = true; v.pat -= 1;
  const find = tool === 'uv' ? (v.fake ? 'fake' : 'real') : (v.claim ? (v.claimTrue ? 'true' : 'false') : (v.fake ? 'odd' : 'nothing'));
  G.ev.push({ k: 'inspect', tool, find }); if (v.pat <= 0) return walkOut(G, 'You kept poking at it. They have had enough.'); return true; }
// make an offer (in pounds)
function offer(G, amt) { const v = G.visit; if (!v || G.over || G.wait > 0) return false; amt = Math.max(0, Math.round(amt / 5) * 5); v.offers++;
  if (amt >= v.cur) return buy(G, amt);
  if (amt < v.walk * 0.62 || amt < v.lastOffer) { v.pat -= 2; v.mood = -2; G.ev.push({ k: 'insult', amt }); if (v.pat <= 0) return walkOut(G, 'Insulted, they walk out.'); return true; }
  v.lastOffer = amt;
  if (amt >= v.walk) { const take = (amt - v.walk) / Math.max(1, v.cur - v.walk); if (take > 0.6 || v.offers >= 3 || G.rnd() < take * 0.5) return buy(G, amt); }      // a first offer is countered, as a rule
  // a counter: they come down part of the way, never below what they will take
  v.cur = Math.max(v.walk, Math.round((v.cur - (v.cur - amt) * (0.25 + G.rnd() * 0.2)) / 5) * 5); if (amt < v.walk) v.pat -= 1; v.mood = amt >= v.walk ? 1 : -1;
  if (v.pat <= 0) return walkOut(G, 'They shake their head and leave.'); G.ev.push({ k: 'counter', amt, cur: v.cur }); return true; }
function buy(G, P) { const v = G.visit; G.bought.push({ name: v.T.name, maker: v.maker, type: v.T.id, cond: v.cond, P, V: v.V, fake: v.fake, claim: v.claim, claimTrue: v.claimTrue, id: v.id });
  G.ev.push({ k: 'deal', P }); lessonSee(G, 'deal', v, P); return nextVisit(G); }
function pass(G) { const v = G.visit; if (!v || G.over || G.wait > 0) return false; G.passed++; G.ev.push({ k: 'pass' }); lessonSee(G, 'pass', v); return nextVisit(G); }
function walkOut(G, why) { G.walked++; G.ev.push({ k: 'walk', why }); lessonSee(G, 'walk', G.visit); return nextVisit(G); }
function nextVisit(G) { G.n++; const v = G.visit; G.visit = null; G.wait = 1.3;
  G.next = () => { if (G.lesson) { lessonVisit(G); return; } if (G.n >= G.cfg.people) return closing(G); G.visit = G.queue[G.n]; G.ev.push({ k: 'enter' }); }; return true; }
// closing time: everything bought sells for what it is worth
function closing(G) { const c = G.cfg, sales = G.bought.map(b => ({ ...b, sold: Math.round(b.V * c.sell) })), profit = sales.reduce((a, b) => a + b.sold - b.P, 0), win = profit >= c.target;
  G.over = win ? 'won' : 'lost'; const stars = win ? (profit >= c.target * 1.6 ? 3 : profit >= c.target * 1.25 ? 2 : 1) : 0;
  G.res = { win, stars, profit, target: c.target, sales, passed: G.passed, walked: G.walked, coins: win ? 4 + Math.ceil(G.N / 3) + stars * 2 : 1 };
  G.ev.push({ k: 'closing', profit }); G.ev.push({ k: win ? 'won' : 'lost' }); return true; }
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'buy', title: 'BUY LOW', how: 'Drag the dial to an offer below what it is worth and tap OFFER. They counter; meet somewhere sensible. Two good buys in a row.', need: 2 }],
  2: [{ id: 'haggle', title: 'HAGGLE', how: 'Open low but not insulting, then come up a little each time. Buy two for under 70% of their worth, in a row.', need: 2 }],
  3: [{ id: 'fake', title: 'SPOT THE FAKE', how: 'Shine the 🔦 UV lamp on fine things. Pass on fakes, buy the real ones cheaply. Three right calls in a row.', need: 3 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonVisit(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonVisit(G) { const st = lessonNow(G), R = G.rnd; G.visit = st.id === 'fake' ? makeVisit(G, { type: R() < 0.5 ? 'watch' : 'handbag', tier: 2, cond: 1, fake: R() < 0.5, seller: 3, claim: null }) : makeVisit(G, { tier: 1, cond: 1, seller: st.id === 'buy' ? 1 : 0, claim: null, fake: false }); G.ev.push({ k: 'enter' }); }
function lessonSee(G, what, v, P) { const st = lessonNow(G); if (!st) return; let ok = null;
  if (st.id === 'buy') ok = what === 'deal' ? P < v.V * 0.92 : false;
  if (st.id === 'haggle') ok = what === 'deal' ? P <= v.V * 0.7 : false;
  if (st.id === 'fake') ok = what === 'deal' ? (!v.fake && P < v.V) : what === 'pass' ? v.fake : false;
  if (!ok) { G.lesson.n = 0; G.ev.push({ k: 'lessonmiss', how: what === 'walk' ? 'They walked out: open less low, and come up step by step.' : what === 'deal' && v.fake ? 'That was a fake: the UV lamp would have shown it.' : what === 'deal' ? `It is worth about £${v.V}: you paid £${P}. Pay less.` : st.how }); G.wait = 3.2; return; }
  G.lesson.n++; if (G.lesson.n < st.need) { G.ev.push({ k: 'lessonok', n: G.lesson.n, need: st.need }); return; }
  G.lesson.i++; G.lesson.n = 0; if (G.lesson.i >= G.lesson.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.lessonEnd = true; G.next = () => { G.lessonEnd = false; G.bought = []; G.passed = 0; G.walked = 0; planDay(G); G.visit = G.queue[0]; G.ev.push({ k: 'start' }); G.ev.push({ k: 'enter' }); }; } }
// ---------- for the robots ----------
// BLIND: a thumb that does not look: offers wherever the dial happens to be (anywhere from nothing to twice the asking price),
// passes, or shines a lamp
const BLIND = { o: G => { const v = G.visit; if (v) offer(G, Math.random() * v.cur * 2); }, p: G => { pass(G); }, i: G => { inspect(G, Math.random() < 0.5 ? 'uv' : 'loupe'); } };
// a dealer who looks: knows roughly what things fetch (acc: how well), checks fine things and claims, opens at about half,
// comes up step by step, never past about 85% of the worth; passes a fake
function honest(G, o, mem) { const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, v = G.visit;
  if (G.over || G.wait > 0 || !v) { mem.t0 = null; mem.vid = null; return; }
  if (mem.vid !== v.id) { mem.vid = v.id; const g = () => { let s = 0; for (let i = 0; i < 6; i++) s += Math.random(); return (s - 3) / 0.707; }; mem.err = 1 + g() * (0.04 + (1 - acc) * 0.5); mem.t0 = G.t + 0.8 + react * 2; mem.step = v.sl.id === 'savvy' ? 3 : v.sl.id === 'casual' ? 1 : 0; }
  if (G.t < mem.t0) return; mem.t0 = G.t + 0.6 + react * 1.5;
  const lux = v.T.lux && v.tier === 2; if (lux && !v.seen.uv && G.cfg.fakes) { inspect(G, 'uv'); return; } if (v.claim && !v.seen.loupe) { inspect(G, 'loupe'); return; }
  if (v.seen.uv && v.fake) { pass(G); return; }
  let est = v.T.base * G.cfg.vs * TIER[v.tier] * COND[v.cond].m * (v.claim && v.claimTrue && v.seen.loupe ? 1.7 : 1) * (G.hot === v.T.id ? 1.35 : 1) * mem.err;
  if (lux && !v.seen.uv) est *= 0.6;      // could be fake: bid as if it might be
  if (v.cur <= est * 0.6) { offer(G, v.cur); return; }
  const want = est * [0.5, 0.6, 0.68, 0.75, 0.8, 0.85][Math.min(5, mem.step++)]; if (want >= v.cur) { offer(G, v.cur); return; }
  if (mem.step > 6 || (want < v.lastOffer)) { pass(G); return; } offer(G, Math.max(want, v.lastOffer + 5)); }
function winNow(G) { if (!G || G.over || G.wait > 0) return; G.lesson = null; G.bought = [{ name: 'x', maker: 'x', type: 'watch', cond: 1, P: 0, V: G.cfg.target * 2, fake: false }]; closing(G); }
