// ===================== RULES: Haggle (game 46, his idea) =====================
// You run a pawn shop. One by one, people come in with something to sell and a price in mind. Look it over (the maker, the
// state it is in, what they say about it), check it if you doubt it (the loupe for signatures and hallmarks, the UV lamp for
// fakes; each look tries their patience), then haggle: drag the dial to your offer and OFFER. Too low and they are insulted
// (their patience drops, and they may walk out); high enough and they counter or take it; pay more than it is worth and you
// lose. At closing time everything you bought sells for what it is really worth: the day's profit against the target. Every
// sale teaches the Price Book what things fetch, so you slowly learn the value of everything, as a pawnbroker does.
// THE DAY'S MONEY (26 Nov 2026, his words: "don't you think it would be better if every level you had a limited amount of money and you had to make
// purchases and make as much profit as you could out of that amount of money... And the higher you go, the kind of harder it gets and the more you learn").
// Until now the till was bottomless: every bargain was a yes, so the only question was "is this under its worth?". Now each day opens with a float
// (G.cash) that will not buy everything worth buying: a share (cfg.purse: about 70% on day 1, falling towards 40%) of what the day's good things would
// cost at the sellers' lowest. So every yes is a no to something later: the money has to go where the margin is biggest, and every pound haggled off
// buys something else. The target is a share (cfg.keen: 28% rising to 42%) of the best that could be made with THAT money on THAT day's customers
// (G.best: everything good bought at the seller's lowest, which nobody does; the robot dealers make 35 to 75% of it, by how well they read the seller), so skill decides it, not the
// luck of who walks in. An offer of more than you have is a bluff: they walk out (the dial marks where your money ends, and OFFER turns red beyond it). Offering exactly all you have: they take it if
// it is at least their lowest (rather than lose the sale), and if it is not, they leave without ill feeling (not a walk-out). The first build stopped the
// dial AT his money, and "slam the dial to the end" became a winning move without looking (133 blind wins in 5,696: an offer of everything he had landed
// between their lowest and their price on the dearest thing of the day). When nothing left to come could be afforded, the shop closes early.
const RULES = [
  'Someone brings in an item and names a price. Look at <b>what it is, who made it, the state it is in</b>.',
  'In doubt? <b>🔍 Loupe</b> checks signatures and hallmarks, <b>🔦 UV</b> spots fakes. Each look tries their patience.',
  '<b>Drag the dial</b> to your offer and tap <b>OFFER</b>. Too low insults them; they may walk. They counter twice and come down each time; a fair third offer, or their own price, makes the deal.',
  'Pay less than it is worth: at <b>closing</b> it sells for its real value. Make the day\'s profit target.',
  'You open with <b>only so much money</b>, and it will not buy everything. Spend it where the profit is biggest; every pound you haggle off buys something else.',
  'If <b>two</b> customers walk out on you, the shop shuts for the day.',
  'Every sale fills your <b>Price Book</b>: you learn what things are worth.',
];
// the kinds of thing people bring, what a good one fetches, and three makers (cheap, middling, fine) for each
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
  // 25 Nov 2026 (his review: "expand the list of products"): twelve more kinds of thing, some from the first day
  { id: 'record', name: 'Vinyl record', base: 90, makers: ['Reissue', 'First pressing', 'Rare pressing'], ed: true, n: 1 },
  { id: 'teddy', name: 'Teddy bear', base: 110, makers: ['Fairground', 'Hand-sewn', 'Antique mohair'], lux: true, n: 1 },
  { id: 'skateboard', name: 'Skateboard', base: 140, makers: ['Toy shop', 'Street deck', 'Pro model'], n: 2 },
  { id: 'necklace', name: 'Necklace', base: 440, makers: ['Costume', 'Silver', 'Diamond'], lux: true, n: 2 },
  { id: 'typewriter', name: 'Typewriter', base: 200, makers: ['Plastic portable', 'Regent', 'Empress 1920s'], n: 3 },
  { id: 'trumpet', name: 'Trumpet', base: 300, makers: ['School band', 'Bandmaster', 'Silver-plated'], n: 4 },
  { id: 'laptop', name: 'Laptop', base: 350, makers: ['Chromo', 'Vertex', 'Titan Pro'], n: 4 },
  { id: 'pen', name: 'Fountain pen', base: 160, makers: ['Steel nib', 'Gold nib', 'Limited edition'], lux: true, n: 5 },
  { id: 'lamp', name: 'Table lamp', base: 280, makers: ['Flat-pack', 'Brass', 'Stained glass'], lux: true, n: 6 },
  { id: 'clock', name: 'Mantel clock', base: 520, makers: ['Quartz', 'Brass movement', 'French gilt'], lux: true, n: 6 },
  { id: 'telescope', name: 'Telescope', base: 330, makers: ['Toy', 'Brass', "Naval officer's"], n: 8 },
  { id: 'medal', name: 'Medal', base: 400, makers: ['Sports day', 'Long service', 'Gallantry'], lux: true, n: 8 },
];
// 25 Nov 2026 (his review: "make it more intense: if they lose like 2 offers, they lose the round"): the second customer who walks out
// on you closes the shop for the day, whatever you have made.
const WALKS = 2;
const TIER = [0.35, 1, 2.6], COND = [{ t: 'mint, still boxed', m: 1.3 }, { t: 'in good shape', m: 1 }, { t: 'worn and scratched', m: 0.6 }, { t: 'broken', m: 0.25 }];
const SELLERS = [
  { id: 'desperate', name: 'needs the money today', walk: [0.35, 0.5], ask: [1.0, 1.2], pat: 5, face: 0 },
  { id: 'casual', name: 'clearing out the loft', walk: [0.45, 0.62], ask: [1.05, 1.4], pat: 5, face: 1 },
  { id: 'savvy', name: 'knows what it is worth', walk: [0.68, 0.82], ask: [1.1, 1.5], pat: 4, face: 2 },
  { id: 'shady', name: 'in a hurry, no questions', walk: [0.3, 0.5], ask: [1.0, 1.6], pat: 4, face: 3 },
];
// 25 Nov 2026 (his words: "way more combinations... something novel each time"): each kind of seller had one line to say why they were selling. Ten each
// now (the kind of seller it is has not changed: the line is how you tell). And forty-eight people at the counter, not twelve.
const WHY = {
  desperate: ['needs the money today', 'has rent due tomorrow', 'has a garage bill to pay', 'has a vet bill to pay', 'was laid off on Friday', 'has a wedding to pay for', 'owes a friend by tonight', 'needs the fare home', 'has a boiler to replace', 'has bailiffs due Monday'],
  casual: ['clearing out the loft', 'is moving abroad', 'never used it', 'found it in a shed', 'has a baby on the way', 'won it in a raffle', 'is having a clear-out', 'says it gathers dust', 'inherited two of them', 'has given up the hobby'],
  savvy: ['knows what it is worth', 'has looked it up online', 'had it valued last week', 'is a dealer on a day off', 'turned down two offers', 'has all the paperwork', 'collects these', 'follows the auctions', 'had a better offer', 'has sold three like it'],
  shady: ['in a hurry, no questions', 'keeps eyeing the door', 'will not say where from', 'says it fell off a lorry', 'wants cash, no receipt', 'wears gloves in June', 'left the price tag on', 'gave two different names', 'left the engine running', 'is selling it for a mate'],
};
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
  return { N, f, help: !!help, place: placeOf(N), people: Math.round(x(7, 9, 25)), target: 0, purse: x(0.85, 0.42, 22) * (help ? 1.12 : 1), keen: x(0.25, 0.44, 25) * (help ? 0.8 : 1), vs: x(1, 3.2, 30),
    fakes: N >= 3 ? x(0.12, 0.3, 30) : 0, claims: N >= 2 ? x(0.25, 0.5, 30) : 0, hot: N >= 4, types: TYPES.filter(t => t.n <= N), sell: 1 + 0.1 * upLv('window'), pat: upLv('charm') + (N <= 4 ? 1 : 0) }; }      // (two walk-outs now end the day: on the first four levels everyone has one more patience)
// one customer and the thing they bring
function makeVisit(G, opts = {}) { const R = G.rnd, c = G.cfg, T = opts.type ? TYPES.find(t => t.id === opts.type) : dealIf('thing', TYPES, t => c.types.includes(t), R);
  const dk = G.deck && G.deck[G.n % G.deck.length] || {}, tier = opts.tier != null ? opts.tier : dk.tier != null ? dk.tier : 1, cond = opts.cond != null ? opts.cond : dk.cond != null ? dk.cond : 1;
  const sl = SELLERS[opts.seller != null ? opts.seller : dk.seller != null ? dk.seller : (R() * SELLERS.length) | 0], fake = opts.fake != null ? opts.fake : !!(T.lux && tier === 2 && R() < c.fakes * (sl.id === 'shady' ? 2.4 : 0.7));
  const claim = opts.claim != null ? opts.claim : (R() < c.claims ? (T.sig ? 'signed' : T.ed ? 'a first edition' : 'one of a kind') : null), claimTrue = claim ? (opts.claimTrue != null ? opts.claimTrue : R() < 0.5) : false;
  const vs = c.vs; let V = T.base * vs * TIER[tier] * COND[cond].m * (claimTrue ? 1.7 : 1); if (G.hot === T.id) V *= 1.35; if (fake) V = Math.max(10, T.base * vs * 0.06); V = Math.round(V / 5) * 5;
  // what the seller believes and will take
  const believed = fake || (claim && !claimTrue) ? T.base * vs * TIER[tier] * COND[cond].m * (claim ? 1.7 : 1) : V, wl = sl.walk[0] + R() * (sl.walk[1] - sl.walk[0]);
  const walk = Math.round(believed * wl / 5) * 5, ask = Math.round(Math.max(walk * 1.3, believed * (sl.ask[0] + R() * (sl.ask[1] - sl.ask[0]))) / 5) * 5;
  return { id: G.nid++, T, tier, maker: T.makers[tier], cond, sl, fake, claim, claimTrue, V, walk, ask, cur: ask, pat: sl.pat + c.pat, maxPat: sl.pat + c.pat, offers: 0, seen: {}, mood: 0, why: (typeof HEADLESS !== 'undefined' && HEADLESS) ? sl.name : WHY[sl.id][deal('why.' + sl.id, WHY[sl.id].length, R)],      /* (the robots' games take no dice for it: they stay as they were measured) */ name: dealOf('who', ['Dave', 'Mrs Patel', 'Gary', 'Joyce', 'Kemi', 'Old Tom', 'Chantelle', 'Ivan', 'Bea', 'Mo', 'Lucy', 'Mr Grant', 'Abdul', 'Mrs Okoro', 'Shaz', 'Big Phil', 'Nana Rose', 'Tariq', 'Miss Chen', 'Dotun', 'Wendy', 'Uncle Sola', 'Fliss', 'Mr Novak', 'Jaz', 'Mrs Bimpe', 'Rhys', 'Doreen', 'Segun', 'Mrs Rao', 'Callum', 'Mrs Ferry', 'Tobi', 'Marge', 'Kwesi', 'Lady Ann', 'Stan', 'Yetunde', 'Mr Singh', 'Pat', 'Emeka', 'Nan Pearl', 'Vince', 'Miss Mary', 'Lekan', 'Mrs Bailey', 'Dr Hart', 'Young Ade'], R), lastOffer: 0 }; }
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, cash: Infinity, cash0: Infinity, best: 0, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, place: cfg.place, nid: 1, bought: [], passed: 0, walked: 0, visit: null, n: 0, wait: 0, hot: null };
  if (cfg.hot) { const h = cfg.types[(G.rnd() * cfg.types.length) | 0]; G.hot = h.id; }
  planDay(G);
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else { G.visit = G.queue[0]; G.ev.push({ k: 'start' }); G.ev.push({ k: 'enter' }); }
  return G; }
// the whole day is dealt in the morning; the target is a share of what today's things are really worth (so a day of junk asks
// less, and a lucky day of treasures asks more: skill decides it, not the mix)
function planDay(G) { G.deck = dealDay(G); G.queue = []; for (let i = 0; i < G.cfg.people; i++) { G.n = i; G.queue.push(makeVisit(G)); } G.n = 0;
  // the float, and the best that could be made of it: the good things (real, and to be had for less than they fetch), dearest margin first, bought at
  // the sellers' lowest until the money will not stretch to the next
  const c = G.cfg, good = G.queue.filter(v => !v.fake && v.walk < v.V * c.sell), cost = good.reduce((a, v) => a + v.walk, 0), cheapest = good.reduce((a, v) => Math.min(a, v.walk), 1e9);
  G.cash0 = G.cash = Math.max(good.length ? cheapest : 50, Math.round(cost * c.purse / 10) * 10);
  let left = G.cash, best = 0; for (const v of good.slice().sort((a, b) => (b.V * c.sell - b.walk) / b.walk - (a.V * c.sell - a.walk) / a.walk)) if (v.walk <= left) { left -= v.walk; best += v.V * c.sell - v.walk; }
  G.best = Math.round(best); c.target = Math.max(20, Math.round(Math.max(best * c.keen, Math.min(best * 0.35, G.cash0 * 0.14 * (c.help ? 0.8 : 1))) / 10) * 10); }      /* (a day of thin margins, where the best is small beside the money, still asks for a seventh of the money or a third of its best, whichever is less: one lucky buy does not make such a day) */
// a day's customers are dealt, not drawn: fine, middling and cheap things, their states and the sellers in fixed shares, shuffled
function dealDay(G) { const R = G.rnd, n = G.cfg.people, share = (arr, w) => { const out = []; w.forEach((f, i) => { for (let q = 0; q < Math.round(f * n); q++) out.push(arr[i]); }); while (out.length < n) out.push(arr[1]); const sh = out.slice(0, n); for (let i = sh.length - 1; i > 0; i--) { const j = (R() * (i + 1)) | 0, t = sh[i]; sh[i] = sh[j]; sh[j] = t; } return sh; };      /* a true shuffle (26 Nov 2026). It was .sort(() => R() - 0.5): the browser sorts differently once it has warmed up (the same seed gave a different day from its 151st start), so the measured games were not repeatable */
  const tiers = share([0, 1, 2], [0.28, 0.44, 0.28]), conds = share([0, 1, 2, 3], [0.14, 0.43, 0.29, 0.14]), sellers = share([0, 1, 2, 3], [0.25, 0.25, 0.25, 0.25]);
  return tiers.map((t, i) => ({ tier: t, cond: conds[i], seller: sellers[i] })); }
function step(G, dt) { if (G.over) return; G.t += dt; if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0) { G.wait = 0; const f = G.next; G.next = null; if (f) f(); } } }
// ---------- what you can do ----------
// look closer: the loupe (signatures, hallmarks: is the claim true?) or the UV lamp (is it fake?). It tries their patience.
function inspect(G, tool) { const v = G.visit; if (!v || G.over || G.wait > 0 || v.seen[tool]) return false; v.seen[tool] = true; v.pat -= 1;
  const find = tool === 'uv' ? (v.fake ? 'fake' : 'real') : (v.claim ? (v.claimTrue ? 'true' : 'false') : (v.fake ? 'odd' : 'nothing'));
  G.ev.push({ k: 'inspect', tool, find }); if (v.pat <= 0) return walkOut(G, 'You kept poking at it. They have had enough.'); return true; }
// make an offer (in pounds)
function offer(G, amt) { const v = G.visit; if (!v || G.over || G.wait > 0) return false; amt = Math.max(0, Math.round(amt / 5) * 5);
  if (isFinite(G.cash) && amt > G.cash) { v.mood = -2; G.ev.push({ k: 'nomoney', amt, cash: G.cash }); return walkOut(G, `You offered £${amt}. You have £${G.cash}. They left.`); }      /* an offer of more than he has is a bluff, and they walk out on it (the dial marks where his money ends and OFFER turns red beyond it). Measured over 6,000 random games and 17,088 blind ones: nothing happening = 6 and 12 wins in a thousand; patience lost = 1.2 to 1.7; walking out = 0.7 and 0.5 */
  const allIn = isFinite(G.cash) && amt === G.cash; v.offers++;
  if (amt >= v.cur) return buy(G, amt);
  if (allIn) { if (amt >= v.walk) { G.ev.push({ k: 'allin', amt }); return buy(G, amt); }      /* everything he has: they take it rather than lose the sale, if it is at least their lowest */
    G.passed++; G.ev.push({ k: 'short', amt }); lessonSee(G, 'pass', v); return nextVisit(G); }      /* and if it is not, they go elsewhere, with no ill feeling: not a walk-out */
  if (amt < v.walk * 0.62 || amt < v.lastOffer) { v.pat -= 2; v.mood = -2; G.ev.push({ k: 'insult', amt }); if (v.pat <= 0) return walkOut(G, 'Insulted, they walk out.'); return true; }
  v.lastOffer = amt;
  if (amt >= v.walk && v.offers >= 3) return buy(G, amt);      // A DEAL BELOW THEIR PRICE TAKES THREE OFFERS (26 Nov 2026): they counter the first two, whatever they are, and take the third if it is at least their lowest (or he meets their price at any time). It was the second offer, by a chance; with money that runs out, taps made without looking then won 1.5 days in a thousand (the old game: 0.5), because the money ran out before the bad buys could eat the one lucky one
  // a counter: they come down part of the way, never below what they will take
  v.cur = Math.max(v.walk, Math.round((v.cur - (v.cur - amt) * (0.25 + G.rnd() * 0.2)) / 5) * 5); if (amt < v.walk) v.pat -= 1; v.mood = amt >= v.walk ? 1 : -1;
  if (v.pat <= 0) return walkOut(G, 'They shake their head and leave.'); G.ev.push({ k: 'counter', amt, cur: v.cur }); return true; }
function buy(G, P) { const v = G.visit; G.bought.push({ name: v.T.name, maker: v.maker, type: v.T.id, cond: v.cond, P, V: v.V, fake: v.fake, claim: v.claim, claimTrue: v.claimTrue, id: v.id }); if (isFinite(G.cash)) G.cash -= P;
  G.ev.push({ k: 'deal', P }); lessonSee(G, 'deal', v, P); return nextVisit(G); }
function pass(G) { const v = G.visit; if (!v || G.over || G.wait > 0) return false; G.passed++; G.ev.push({ k: 'pass' }); lessonSee(G, 'pass', v); return nextVisit(G); }
function walkOut(G, why) { G.walked++; G.ev.push({ k: 'walk', why, n: G.walked }); lessonSee(G, 'walk', G.visit); if (!G.lesson && G.walked >= WALKS) { G.visit = null; G.wait = 1.6; G.next = () => closing(G, 'walked'); return true; } return nextVisit(G); }
function nextVisit(G) { G.n++; const v = G.visit; G.visit = null; G.wait = 1.3;
  G.next = () => { if (G.lesson) { lessonVisit(G); return; } if (G.n >= G.cfg.people) return closing(G);
    if (isFinite(G.cash) && !G.queue.slice(G.n).some(q => !q.fake && q.walk < q.V * G.cfg.sell && q.walk <= G.cash)) { G.ev.push({ k: 'spent' }); G.wait = 1.5; G.next = () => closing(G); return; }      /* nothing still to come could be afforded: the shop closes early, and the day is counted */
    G.visit = G.queue[G.n]; G.ev.push({ k: 'enter' }); }; return true; }
// closing time: everything bought sells for what it is worth
function closing(G, why) { const c = G.cfg, sales = G.bought.map(b => ({ ...b, sold: Math.round(b.V * c.sell) })), profit = sales.reduce((a, b) => a + b.sold - b.P, 0), win = !why && profit >= c.target;
  G.over = win ? 'won' : 'lost'; const best = Math.max(G.best || 0, c.target * 1.3), stars = win ? (profit >= c.target + (best - c.target) * 0.6 ? 3 : profit >= c.target + (best - c.target) * 0.3 ? 2 : 1) : 0;      /* stars: how near the best that money could have made */
  G.res = { win, stars, why: why || (win ? '' : 'profit'), profit, target: c.target, cash0: isFinite(G.cash0) ? G.cash0 : 0, left: isFinite(G.cash) ? G.cash : 0, best: Math.round(G.best || 0), sales, passed: G.passed, walked: G.walked, coins: win ? 4 + Math.ceil(G.N / 3) + stars * 2 : 1 };
  G.ev.push({ k: 'closing', profit }); G.ev.push({ k: win ? 'won' : 'lost' }); return true; }
// ---------- LESSONS ----------
const AIMCARD = {"pic": "💰", "win": "MAKE THE DAY'S PROFIT", "lose": "SPEND YOUR MONEY BADLY", "how": "CHECK IT, OFFER LOW, BUY CHEAP"};      // the aim card: specs/aims.json (tools/aims.py)
const LESSONS = {
  1: [{ id: 'buy', title: 'BUY LOW', say: 'SLIDE, TAP OFFER', do: 'drag', dir: 'lr', how: 'Drag the dial to an offer below what it is worth and tap OFFER. They counter; meet somewhere sensible. Two good buys in a row.', need: 2 }],
  2: [{ id: 'haggle', title: 'HAGGLE', say: 'START LOW', do: 'drag', dir: 'lr', how: 'Open low but not insulting, then come up a little each time. Buy two for under 70% of their worth, in a row.', need: 2 }],
  3: [{ id: 'fake', title: 'SPOT THE FAKE', say: 'SHINE THE 🔦', do: 'tap', how: 'Shine the 🔦 UV lamp on fine things. Pass on fakes, buy the real ones cheaply. Three right calls in a row.', need: 3 }],
};
function lessonStart(G) { G.cash = G.cash0 = Infinity;      /* a lesson is about the bargaining: the till is open */ G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonVisit(G); }
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
const HAGGLE = { desperate: [0.36, 0.42, 0.48, 0.54, 0.6, 0.68], shady: [0.32, 0.4, 0.48, 0.55, 0.62, 0.7], casual: [0.46, 0.52, 0.58, 0.64, 0.7, 0.78], savvy: [0.66, 0.72, 0.78, 0.82, 0.85, 0.85] };
function honest(G, o, mem) { const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, v = G.visit;
  if (G.over || G.wait > 0 || !v) { mem.t0 = null; mem.vid = null; return; }
  if (mem.vid !== v.id) { mem.vid = v.id; const g = () => { let s = 0; for (let i = 0; i < 6; i++) s += Math.random(); return (s - 3) / 0.707; }; mem.err = 1 + g() * (0.04 + (1 - acc) * 0.5); mem.t0 = G.t + 0.8 + react * 2; mem.step = 0; mem.i = 0; }
  if (G.t < mem.t0) return; mem.t0 = G.t + 0.6 + react * 1.5;
  const lux = v.T.lux && v.tier === 2; if (lux && !v.seen.uv && G.cfg.fakes) { inspect(G, 'uv'); return; } if (v.claim && !v.seen.loupe) { inspect(G, 'loupe'); return; }
  if (v.seen.uv && v.fake) { pass(G); return; }
  let est = v.T.base * G.cfg.vs * TIER[v.tier] * COND[v.cond].m * (v.claim && v.claimTrue && v.seen.loupe ? 1.7 : 1) * (G.hot === v.T.id ? 1.35 : 1) * mem.err;
  if (lux && !v.seen.uv) est *= 0.6;      // could be fake: bid as if it might be
  // his money: he never offers more than he has, and when it is going faster than the day he is choosier (it must go on the best bargains); near
  // closing he spends what is left on anything with a profit in it
  const cash = isFinite(G.cash) ? G.cash : 1e9, dayLeft = 1 - G.n / G.cfg.people, moneyLeft = isFinite(G.cash) ? G.cash / G.cash0 : 1, top = G.n >= G.cfg.people - 2 ? 0.88 : moneyLeft < dayLeft * 0.8 ? 0.68 : moneyLeft < dayLeft * 1.1 ? 0.76 : 0.85;
  if (v.offers >= 1 && v.cur <= cash && v.cur <= est * 0.6) { offer(G, v.cur); return; }
  if (v.offers >= 1 && (v.pat <= 2 || (G.walked >= 1 && v.pat <= 3))) { if (v.cur <= cash && v.cur <= est * Math.min(top, 0.85)) offer(G, v.cur); else pass(G); return; }      // their patience is nearly gone (and a second walk-out shuts the shop): he pays their price if it still leaves a profit, or lets them go politely
  // how he bargains: the better he is (acc), the more he goes by what kind of seller this is (someone who needs the money today takes far less than
  // someone who knows what it is worth): his own ladder of offers for each, instead of one ladder from half its worth for everybody
  const k2 = clamp((acc - 0.6) / 0.37, 0, 1), st = Math.min(5, mem.i == null ? (mem.i = 0) : mem.i), plain = [0.5, 0.6, 0.68, 0.75, 0.8, 0.85][Math.min(5, st + (v.sl.id === 'savvy' ? 3 : v.sl.id === 'casual' ? 1 : 0))], wise = HAGGLE[v.sl.id][st]; mem.i++; mem.step = mem.i;
  let want = est * Math.min(top, plain * (1 - k2) + wise * k2); if (!v.offers) want = Math.min(want, Math.floor(v.cur * 0.8 / 5) * 5);      // nobody pays the first price asked: one offer under it costs nothing (a first offer is always countered)
  if (want >= cash) { if (cash >= est * 0.2 && cash <= est * top) offer(G, cash); else pass(G); return; }      /* all he has, when the thing is worth clearly more: it costs nothing to try (it was only tried from 45% of its worth, and the robot walked past a £1,340 thing with £580 in hand) */      // all he has, if that is still a bargain
  if (want >= v.cur) { offer(G, v.cur); return; }
  if (mem.step > 6 || want <= v.lastOffer) { pass(G); return; } offer(G, Math.max(want, v.lastOffer + 5)); }
function winNow(G) { if (!G || G.over || G.wait > 0) return; G.lesson = null; G.bought = [{ name: 'x', maker: 'x', type: 'watch', cond: 1, P: 0, V: G.cfg.target * 2, fake: false }]; closing(G); }
