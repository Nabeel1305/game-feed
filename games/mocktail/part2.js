// ===================== THE RULES: Mocktail Bar (his idea 24, 20 Nov 2026) =====================
// You stand behind the counter. A customer sits down and orders: a named drink (its card shows the recipe on early levels) or
// a feeling ("something sour, refreshing and not too sweet"; you may ASK one question). Choose a glass, add ice, tap a bottle
// and hold to pour (release to stop; the marks on the glass show parts), muddle, shake, stir, add a garnish, SERVE. They taste
// it: every ingredient has the same effect on sweet, sour, bitter and fizz every time, so the verdict can be explained: "Too
// sweet", "Not enough lime", "You forgot the mint". A disliked drink fails that order only: make it again. A shift is a few
// orders; too many disliked drinks and the shift is over. Free mix (home screen): no customers, save your own creations.
const RULES = [
  'Read the order. <b>Choose a glass</b>, add <b>ice</b> if it wants it.',
  '<b>HOLD a bottle to pour it</b>: let go to stop. The marks beside the glass are parts (the card says how many).',
  '<b>MUDDLE</b> fresh fruit and herbs (tap it three times), <b>SHAKE</b> in the shaker (hold the button), <b>STIR</b> (hold the button).',
  'Tap a <b>garnish</b>, then <b>SERVE</b>. They say what they think, and why.',
  'Some ask for a feeling ("sour and fizzy"): any drink that fits is right. <b>ASK</b> one question if you are not sure.',
  'A drink they dislike fails that order: make it again. Too many and the shift is over.',
];
// ingredients: what each part does to the taste (sweet, sour, bitter, fruity), and its colour
const ING = {
  orange: { name: 'Orange juice', cat: 'juice', col: '#ffa020', t: [1.2, 0.6, 0, 1], lv: 1 }, cranberry: { name: 'Cranberry', cat: 'juice', col: '#c81a3a', t: [0.8, 1.0, 0.3, 1], lv: 1 },
  apple: { name: 'Apple juice', cat: 'juice', col: '#f0d060', t: [1.3, 0.4, 0, 1], lv: 1 }, lime: { name: 'Lime juice', cat: 'juice', col: '#b8e060', t: [0.2, 2.6, 0.2, 0.6], lv: 2 },
  lemon: { name: 'Lemon juice', cat: 'juice', col: '#f8f080', t: [0.3, 2.4, 0.1, 0.6], lv: 3 }, pineapple: { name: 'Pineapple', cat: 'juice', col: '#f8e050', t: [1.6, 0.8, 0, 1.2], lv: 5 },
  grapefruit: { name: 'Grapefruit', cat: 'juice', col: '#ff9a8a', t: [0.5, 1.4, 1.2, 0.8], lv: 6 },
  sugar: { name: 'Sugar syrup', cat: 'syrup', col: '#f4f0e8', t: [4, 0, 0, 0], lv: 2 }, grenadine: { name: 'Grenadine', cat: 'syrup', col: '#d0102a', t: [3.5, 0.3, 0, 1], lv: 1, heavy: true },
  honey: { name: 'Honey syrup', cat: 'syrup', col: '#e0a020', t: [3.2, 0, 0.2, 0.4], lv: 5, heavy: true }, vanilla: { name: 'Vanilla syrup', cat: 'syrup', col: '#f0e0c0', t: [3.4, 0, 0, 0.6], lv: 9 },
  soda: { name: 'Soda water', cat: 'fizz', col: '#e8f8ff', t: [0, 0, 0, 0], fizz: 1, lv: 1 }, tonic: { name: 'Tonic', cat: 'fizz', col: '#e0f4ff', t: [0.8, 0.2, 1.6, 0], fizz: 1, lv: 6 },
  ginger: { name: 'Ginger beer', cat: 'fizz', col: '#e8d098', t: [1.6, 0.2, 0.6, 0.6], fizz: 1, lv: 4 },
};
const FRESH = { mint: { name: 'Mint', col: '#3aa050', fresh: 1, lv: 4 }, berries: { name: 'Berries', col: '#6a1a5a', t: [0.6, 0.4, 0, 1.4], lv: 5 }, basil: { name: 'Basil', col: '#2a8a3a', fresh: 1, lv: 9 } };
const GARN = { lime: { name: 'Lime wheel', col: '#a0d040', lv: 3 }, orange: { name: 'Orange slice', col: '#ffa020', lv: 3 }, cherry: { name: 'Cherry', col: '#c8102a', lv: 3 }, mint: { name: 'Mint sprig', col: '#3aa050', lv: 4 }, umbrella: { name: 'Umbrella', col: '#ff7aa8', lv: 6 } };
const GLASSES = { highball: { name: 'Highball', cap: 9, lv: 1 }, rocks: { name: 'Rocks', cap: 6, lv: 2 }, coupe: { name: 'Coupe', cap: 5, lv: 5 }, hurricane: { name: 'Hurricane', cap: 10, lv: 8 } };
// named drinks (all original): parts of each ingredient, the glass, ice, what to do, the garnish; each has its tolerance
const DRINKS = [
  { id: 'spritz', name: 'Orange Spritz', lv: 1, ing: { orange: 3, soda: 3 }, glass: 'highball', ice: 'cubes', how: 'build', garn: 'orange' },
  { id: 'breeze', name: 'Cranberry Breeze', lv: 1, ing: { cranberry: 2, apple: 2 }, glass: 'rocks', ice: 'cubes', how: 'build', garn: 'cherry' },
  { id: 'sunset', name: 'Sunset Layer', lv: 2, ing: { orange: 4, grenadine: 1 }, glass: 'highball', ice: 'cubes', how: 'layer', garn: 'cherry' },
  { id: 'limeade', name: 'Fizzy Limeade', lv: 2, ing: { lime: 2, sugar: 1, soda: 4 }, glass: 'highball', ice: 'cubes', how: 'stir', garn: 'lime' },
  { id: 'nojito', name: 'Nojito', lv: 4, ing: { lime: 2, sugar: 1, soda: 4 }, fresh: ['mint'], glass: 'highball', ice: 'crushed', how: 'muddle', garn: 'mint' },
  { id: 'gingerfizz', name: 'Ginger Fizz', lv: 4, ing: { ginger: 4, lime: 1 }, fresh: ['mint'], glass: 'highball', ice: 'cubes', how: 'muddle', garn: 'lime' },
  { id: 'pinesour', name: 'Pineapple Sour', lv: 5, ing: { pineapple: 3, lemon: 2, sugar: 1 }, glass: 'coupe', ice: 'none', how: 'shake', garn: 'cherry' },
  { id: 'berryshake', name: 'Berry Shake-Up', lv: 5, ing: { apple: 2, honey: 1 }, fresh: ['berries'], glass: 'coupe', ice: 'none', how: 'shake', garn: 'cherry' },
  { id: 'tonictwist', name: 'Tonic Twist', lv: 6, ing: { tonic: 4, grapefruit: 2 }, glass: 'highball', ice: 'cubes', how: 'stir', garn: 'lime' },
  { id: 'tropic', name: 'Tropic Storm', lv: 8, ing: { pineapple: 3, orange: 2, grenadine: 1 }, glass: 'hurricane', ice: 'crushed', how: 'layer', garn: 'umbrella' },
  { id: 'garden', name: 'Garden Party', lv: 9, ing: { apple: 3, lemon: 1, vanilla: 1, soda: 2 }, fresh: ['basil'], glass: 'highball', ice: 'cubes', how: 'muddle', garn: 'mint' },
];
// feelings a customer can ask for: each a test of the drink's taste (per part, averaged) and its build
const WANTS = {
  sweet: { say: 'sweet', test: q => q.sw >= 1.3, no: 'Not sweet enough.', ask: 'I like it sweet.' },
  notsweet: { say: 'not too sweet', test: q => q.sw <= 1.3, no: 'Too sweet for me.', ask: 'Not too sweet, please.' },
  sour: { say: 'sour', test: q => q.so >= 0.9, no: 'Not sour enough.', ask: 'Sour! Lime or lemon.' },
  fizzy: { say: 'fizzy', test: q => q.fizz >= 0.3, no: 'It isn\'t fizzy.', ask: 'Lots of bubbles.' },
  still: { say: 'not fizzy', test: q => q.fizz < 0.1, no: 'I didn\'t want bubbles.', ask: 'No bubbles, thanks.' },
  bitter: { say: 'a bit bitter', test: q => q.bi >= 0.5, no: 'I wanted something bitter.', ask: 'Bitter, like tonic or grapefruit.' },
  fruity: { say: 'fruity', test: q => q.fr >= 0.75, no: 'Not fruity enough.', ask: 'Fruit juice, lots of it.' },
  fresh: { say: 'refreshing', test: q => q.ice && (q.fresh || q.so >= 0.8 || q.fizz >= 0.3), no: 'It isn\'t refreshing: ice and mint, or something sharp.', ask: 'Cold, with mint or citrus.' },
  long: { say: 'a long drink', test: q => q.parts >= 6, no: 'That\'s too small: a long drink, please.', ask: 'A big glass, please.' },
};
const PEOPLE = ['Ada', 'Bo', 'Chidi', 'Dara', 'Emi', 'Femi', 'Gus', 'Hana', 'Ife', 'Jun', 'Kemi', 'Lars', 'Mira', 'Nia', 'Oto', 'Pia', 'Remi', 'Sade', 'Tomi', 'Uche'];
const SKINS = [{ id: 'classic', name: 'Classic bar', col: 0x8a4a2a, stars: 0 }, { id: 'neon', name: 'Neon lounge', col: 0x6a2a9a, stars: 6 }, { id: 'beach', name: 'Beach shack', col: 0xd8b070, stars: 14 }, { id: 'marble', name: 'Marble', col: 0xe8e4e0, stars: 24 }, { id: 'jungle', name: 'Jungle', col: 0x2a6a3a, stars: 36 }, { id: 'gold', name: 'Golden hour', col: 0xd6a630, stars: 50 }];
const UPGRADES = [{ id: 'jigger', name: 'Measuring jigger', max: 1, cost: () => 60, desc: 'Marks every half part on the glass.' }, { id: 'tips', name: 'Tip jar', max: 2, cost: l => [40, 100][l], desc: 'Happy customers tip more.' }, { id: 'lights', name: 'Fairy lights', max: 1, cost: () => 50, desc: 'Lights along the bar (looks only).' }];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Glass washer'], [60, 'Barback'], [200, 'Mixer'], [500, 'Mixologist'], [1100, 'Head bartender'], [2500, 'Legend of the bar']];
const PLACES = [{ name: 'The corner café' }, { name: 'Rooftop terrace' }, { name: 'Beach bar' }, { name: 'Grand hotel lounge' }];
const placeOf = N => Math.min(3, Math.floor((N - 1) / 6));
const POUR = 1.6;      // parts a second while POUR is held
function makeCfg(N, help, o = {}) { const f = curve(N);
  return { N, f, help: !!help, orders: o.practice ? 999 : N <= 3 ? 2 : Math.min(6, 3 + Math.floor(f / 8)), fails: N <= 3 ? 3 : 2, card: N <= 6 ? 'full' : N <= 14 ? 'names' : 'book',
    feel: N >= 7 ? Math.min(0.5, 0.25 + f / 80) : 0, wants: N >= 12 ? 3 : 2, tol: (0.65 - 0.25 * Math.min(1, f / 40)) * (help ? 1.3 : 1), glassMatters: N >= 3, garnMatters: N >= 3, practice: !!o.practice }; }
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help, o), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, mini: !!o.mini, served: 0, failed: 0, tips: 0, log: [], wait: 0, next: null };
  if (G.teach && LESSONS[N] && G.taught < N && !cfg.practice) lessonStart(G); else { nextOrder(G); G.ev.push({ k: 'start' }); }
  return G; }
const avail = (G, lv) => lv <= Math.max(G.N, G.cfg.practice ? 99 : 0);
function nextOrder(G, retry) { const c = G.cfg, R = G.rnd; G.drink = newDrink();
  if (c.practice) { G.order = { free: true, who: 'You' }; G.ev.push({ k: 'order' }); return; }
  if (retry && G.order) { G.order.tries++; G.ev.push({ k: 'order', retry: true }); return; }
  const L = lessonNow(G), pool = DRINKS.filter(d => avail(G, d.lv) && (!L || d.lv <= 1)), newest = pool.filter(d => d.lv === Math.max(...pool.map(q => q.lv)));
  let o; if (!L && R() < c.feel) { let want; for (let tries = 0; tries < 30; tries++) { want = pickWants(G, R); if (solve(G, want, R)) break; } o = { feel: want, hint: null }; }
  if (!o) { const d = R() < 0.5 && G.served < 2 ? newest[(R() * newest.length) | 0] : pool[(R() * pool.length) | 0]; o = { drink: d }; }
  o.who = PEOPLE[(G.N * 7 + G.served * 3 + (G.seed % 11)) % PEOPLE.length]; o.tries = 0; o.asked = false; o.t0 = G.t; G.order = o; G.ev.push({ k: 'order' }); }
// a drink that fits a feeling: tries small mixes of the bottles open on this level (used to make sure every request can be
// met, and by the honest robot); returns a plan like a named drink, or null
function solve(G, feel, R = Math.random) { const ids = Object.keys(ING).filter(id => avail(G, ING[id].lv)), out = [], want = feel.includes('fresh');
  for (let a = 0; a < ids.length; a++) for (let b = a; b < ids.length; b++) for (let c = b; c < ids.length; c++) { const set = [...new Set([ids[a], ids[b], ids[c]])];
    for (let t = 0; t < 12; t++) { const ing = {}; set.forEach(id => ing[id] = 1 + ((R() * 4) | 0)); const n = Object.values(ing).reduce((x, y) => x + y, 0); if (n > 8 || n < 3) continue;
      const D = newDrink(); D.glass = 'highball'; D.ice = 'cubes'; D.fresh = want && avail(G, 4) ? ['mint'] : []; D.muddled = 3; for (const id in ing) D.parts.push({ id, n: ing[id] }); const q = tasteOf(D);
      if (feel.every(k2 => WANTS[k2].test(q)) && q.sw <= 2.0 && q.so <= 1.8 && feel.every(k2 => margin(k2, q))) { out.push({ name: 'your own', ing, glass: 'highball', ice: 'cubes', how: D.fresh.length ? 'muddle' : 'build', fresh: D.fresh, garn: null }); break; } } }
  return out.length ? out[(R() * out.length) | 0] : null; }
function margin(k2, q) { return { sweet: q.sw >= 1.5, notsweet: q.sw <= 1.1, sour: q.so >= 1.1, fizzy: q.fizz >= 0.38, still: q.fizz === 0, bitter: q.bi >= 0.65, fruity: q.fr >= 0.85, fresh: true, long: q.parts >= 6.5 }[k2]; }      // with room for a thumb's error
function pickWants(G, R) { const c = G.cfg, keys = Object.keys(WANTS).filter(k2 => k2 !== 'bitter' || avail(G, 6)), want = []; while (want.length < c.wants) { const k2 = keys[(R() * keys.length) | 0]; if (want.includes(k2) || (k2 === 'fizzy' && want.includes('still')) || (k2 === 'still' && want.includes('fizzy')) || (k2 === 'sweet' && want.includes('notsweet')) || (k2 === 'notsweet' && want.includes('sweet'))) continue; want.push(k2); } return want; }
function newDrink() { return { glass: null, vessel: 'glass', parts: [], shaker: [], ice: 'none', fresh: [], muddled: 0, shakes: 0, stirred: 0, garn: null, pouring: null, sel: null, layered: false, mixedAfter: false }; }
// ---------- your hands ----------
function pickGlass(G, k2) { const D = G.drink; if (!D || !GLASSES[k2] || G.wait > 0) return false; if (D.glass && D.parts.length) return false; D.glass = k2; G.ev.push({ k: 'glass' }); lessonSee(G, 'glass'); return true; }
function select(G, id) { const D = G.drink; if (!D || G.wait > 0) return false; if (!ING[id] && !FRESH[id]) return false; if (FRESH[id]) { const into = D.vessel === 'shaker' ? D.shaker : D.parts; if (!D.glass && D.vessel === 'glass') { G.ev.push({ k: 'needglass' }); return false; } if (!D.fresh.includes(id)) { D.fresh.push(id); G.ev.push({ k: 'fresh', id }); } return true; } D.sel = id; G.ev.push({ k: 'select', id }); return true; }
function pourStart(G) { const D = G.drink; if (!D || !D.sel || G.wait > 0) return false; if (D.vessel === 'glass' && !D.glass) { G.ev.push({ k: 'needglass' }); return false; } D.pouring = D.sel; G.ev.push({ k: 'pour', id: D.sel }); return true; }
function pourStop(G) { const D = G.drink; if (!D || !D.pouring) return false; D.pouring = null; G.ev.push({ k: 'pourstop' }); lessonSee(G, 'pour'); return true; }
function addIce(G, kind) { const D = G.drink; if (!D || !D.glass || G.wait > 0) { if (D && !D.glass) G.ev.push({ k: 'needglass' }); return false; } D.ice = D.ice === kind ? 'none' : kind; G.ev.push({ k: 'ice', kind: D.ice }); lessonSee(G, 'ice'); return true; }
function muddle(G) { const D = G.drink; if (!D || !D.fresh.length || G.wait > 0) return false; D.muddled++; G.ev.push({ k: 'muddle', n: D.muddled }); return true; }
function useShaker(G) { const D = G.drink; if (!D || G.wait > 0) return false; if (D.vessel === 'shaker') { return strain(G); } D.vessel = 'shaker'; G.ev.push({ k: 'shaker' }); return true; }
function shake(G) { const D = G.drink; if (!D || D.vessel !== 'shaker' || !D.shaker.length || G.wait > 0) return false; D.shakes++; G.ev.push({ k: 'shake', n: D.shakes }); return true; }
function strain(G) { const D = G.drink; if (!D || D.vessel !== 'shaker') return false; if (!D.glass) { G.ev.push({ k: 'needglass' }); return false; } for (const p of D.shaker) addPart(D.parts, p.id, p.n); D.shaker = []; D.vessel = 'glass'; D.shook = D.shakes >= 6; if (D.shook) D.mixedAfter = true; G.ev.push({ k: 'strain' }); return true; }
function stir(G, turns) { const D = G.drink; if (!D || !D.parts.length || D.vessel !== 'glass' || G.wait > 0) return false; D.stirred += turns; if (D.stirred >= 2.5) { if (!D.stirDone) { D.stirDone = true; G.ev.push({ k: 'stirred' }); } D.mixedAfter = true; } return true; }
function garnish(G, id) { const D = G.drink; if (!D || !D.glass || !GARN[id] || G.wait > 0) return false; D.garn = id; G.ev.push({ k: 'garnish', id }); lessonSee(G, 'garnish'); return true; }
function emptyGlass(G) { if (!G.drink || G.wait > 0) return false; const g = G.drink.glass; G.drink = newDrink(); G.drink.glass = g; G.ev.push({ k: 'empty' }); return true; }
function ask(G) { const o = G.order; if (!o || !o.feel || o.asked || G.wait > 0) return false; o.asked = true; const k2 = o.feel[(G.rnd() * o.feel.length) | 0]; o.answer = WANTS[k2].ask; G.ev.push({ k: 'asked', txt: o.answer }); return true; }
function addPart(arr, id, n) { const p = arr.find(q => q.id === id); if (p) p.n += n; else arr.push({ id, n }); }
// ---------- the clock: pouring runs while held ----------
function step(G, dt) { if (G.over || !(dt > 0)) return; if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0) { G.wait = 0; if (G.next) { const f = G.next; G.next = null; f(); } } return; }
  G.t += dt; const D = G.drink; if (D && D.pouring) { const into = D.vessel === 'shaker' ? D.shaker : D.parts, tot = into.reduce((a, b) => a + b.n, 0), cap = D.vessel === 'shaker' ? 8 : GLASSES[D.glass].cap - (D.ice !== 'none' ? 1 : 0);
    if (tot >= cap) { D.pouring = null; G.ev.push({ k: 'full' }); return; } addPart(into, D.pouring, Math.min(POUR * dt, cap - tot)); D.lastPour = D.pouring; if (D.vessel === 'glass') { D.mixedAfter = false; D.layerCand = ING[D.pouring].heavy && D.parts.length > 1 && D.parts[D.parts.length - 1].id === D.pouring; } } }
// ---------- tasting: the drink's taste per part, then the customer's verdict and the reasons ----------
function tasteOf(D) { const P = D.parts, n = P.reduce((a, b) => a + b.n, 0) || 1, q = { sw: 0, so: 0, bi: 0, fr: 0, fizz: 0, parts: n, ice: D.ice !== 'none', fresh: D.fresh.some(f => FRESH[f].fresh) };
  for (const p of P) { const t = ING[p.id].t; q.sw += t[0] * p.n / n; q.so += t[1] * p.n / n; q.bi += t[2] * p.n / n; q.fr += t[3] * p.n / n; if (ING[p.id].fizz) q.fizz += p.n / n; }
  for (const f of D.fresh) if (FRESH[f].t) { const t = FRESH[f].t; q.sw += t[0] * 0.3; q.so += t[1] * 0.3; q.fr += t[3] * 0.4; }
  if (D.shook) q.fizz *= 0.3;      // shaking flattens bubbles
  return q; }
function judge(G) { const D = G.drink, o = G.order, c = G.cfg, why = [], minor = []; const amt = id => (D.parts.find(p => p.id === id) || { n: 0 }).n, nm = id => (ING[id] || FRESH[id] || {}).name.toLowerCase();
  if (!D.glass || !D.parts.length) return { like: false, why: ['That\'s an empty glass!'] };
  if (D.vessel === 'shaker') return { like: false, why: ['It\'s still in the shaker: tap the shaker to pour it out.'] };
  if (o.drink) { const R = o.drink, tol = Math.max(c.tol, 0.18 * Math.max(...Object.values(R.ing)));
    for (const id in R.ing) { const want = R.ing[id], got = amt(id); if (got < 0.25) why.push(`You forgot the ${nm(id)}.`); else if (got < want - tol) why.push(`Not enough ${nm(id)} (${want} parts).`); else if (got > want + tol) why.push(`Too much ${nm(id)} (${want} parts).`); }
    for (const p of D.parts) if (!(p.id in R.ing) && p.n > 0.5) why.push(`Why is there ${nm(p.id)} in it?`);
    for (const f of R.fresh || []) { if (!D.fresh.includes(f)) why.push(`You forgot the ${nm(f)}.`); else if (D.muddled < 3) why.push(`The ${nm(f)} needed muddling (crushing).`); }
    if (R.how === 'shake' && !D.shook) why.push('It needed shaking: tap SHAKER, pour into it, hold to shake.');
    if (R.how === 'stir' && !D.stirDone) why.push('It needed a stir: hold STIR.');
    if (R.how === 'layer' && (D.lastPour !== Object.keys(R.ing).find(id => ING[id].heavy) || D.mixedAfter)) why.push(`No layers! Pour the ${nm(Object.keys(R.ing).find(id => ING[id].heavy))} last, and don't stir.`);
    if (R.ice !== D.ice) (R.ice === 'none' ? why : why).push(R.ice === 'none' ? 'No ice in this one.' : R.ice === 'crushed' && D.ice === 'cubes' ? 'It wants crushed ice.' : R.ice === 'cubes' && D.ice === 'crushed' ? 'Ice cubes, not crushed.' : 'Where\'s the ice?');
    if (c.glassMatters && D.glass !== R.glass) minor.push(`It comes in a ${GLASSES[R.glass].name.toLowerCase()} glass.`);
    if (c.garnMatters && D.garn !== R.garn) minor.push(D.garn ? `The garnish is a ${GARN[R.garn].name.toLowerCase()}.` : `No ${GARN[R.garn].name.toLowerCase()}?`); }
  else if (o.feel) { const q = tasteOf(D); for (const k2 of o.feel) if (!WANTS[k2].test(q)) why.push(WANTS[k2].no); if (q.sw > 2.2) why.push('Far too sweet!'); if (q.so > 2.0) why.push('So sour my face hurts!'); if (q.parts < 3) why.push('That\'s barely a sip.'); }
  return { like: !why.length, why: why.slice(0, 3), minor: minor.slice(0, 2) }; }
function serve(G) { const o = G.order; if (!o || G.wait > 0 || G.over) return false; const D = G.drink; if (!D.glass) { G.ev.push({ k: 'needglass' }); return false; }
  if (o.free) { G.ev.push({ k: 'free', q: tasteOf(D) }); G.saved = { parts: D.parts.map(p => ({ id: p.id, n: +p.n.toFixed(1) })), fresh: D.fresh.slice(), glass: D.glass, ice: D.ice, garn: D.garn }; G.drink = newDrink(); return true; }
  if (D.pouring) pourStop(G); const v = judge(G), quick = G.t - o.t0 < 40;
  G.log.push({ who: o.who, name: o.drink ? o.drink.name : 'a ' + o.feel.map(k2 => WANTS[k2].say).join(', ') + ' drink', like: v.like, why: v.why, minor: v.minor });
  G.ev.push({ k: 'verdict', like: v.like, why: v.why, minor: v.minor });
  if (G.lesson) { if (v.like) lessonSee(G, 'serve'); else { G.ev.push({ k: 'lessonmiss', how: v.why[0] }); G.wait = 2.2; G.next = () => nextOrder(G, true); } return true; }
  if (v.like) { G.served++; const tip = Math.round((2 + (v.minor.length ? 0 : 2) + (quick ? 1 : 0)) * (1 + 0.25 * upLv('tips'))); G.tips += tip; G.ev.push({ k: 'tip', n: tip }); G.wait = 2.4; G.next = () => { if (G.served >= G.cfg.orders) finish(G, true); else nextOrder(G); }; }
  else { G.failed++; if (G.failed > G.cfg.fails) { G.wait = 2.6; G.next = () => finish(G, false, { why: 'fails' }); } else { G.wait = 2.6; G.next = () => nextOrder(G, true); } }
  return true; }
function finish(G, win, o = {}) { if (G.over) return; G.over = win ? 'won' : 'lost'; const perfect = G.log.filter(q => q.like && !q.minor.length).length, stars = win ? (G.failed === 0 ? (perfect === G.served ? 3 : 2) : G.failed === 1 ? 2 : 1) : 0;
  G.res = { win, stars, why: o.why || null, served: G.served, failed: G.failed, tips: G.tips, log: G.log, coins: win ? G.tips + Math.ceil(G.N / 2) + stars * 3 : Math.max(1, G.tips >> 1) }; G.ev.push({ k: win ? 'won' : 'lost' }); }
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'pour', title: 'POUR TO THE MARKS', say: 'TAP A GLASS, HOLD A BOTTLE', do: 'hold', how: 'Tap a GLASS. Then HOLD a bottle: it pours while you hold. Let go at the STOP line. Then the next bottle. Tap SERVE.', need: 1 }],
  2: [{ id: 'ice', title: 'GLASS AND ICE', say: 'GLASS, ICE, POUR', do: 'tap', how: 'Each drink has its glass and its ice. Tap the right glass, tap ICE, then pour, garnish if asked, and SERVE.', need: 1 }],
  3: [{ id: 'garnish', title: 'THE FINISHING TOUCH', say: 'TAP THE GARNISH', do: 'tap', how: 'The finishing touch: tap the garnish (in GLASS · GARNISH). The card shows which.', need: 1 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); nextOrder(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonSee(G, what) { const D = G.lesson; if (!D || what !== 'serve') return; G.lesson = null; G.ev.push({ k: 'lessonok', n: 1, need: 1 }); G.ev.push({ k: 'lessondone', N: G.N }); G.wait = 2.2; G.next = () => { G.rnd = rng(G.seed); G.served = 0; G.failed = 0; G.log = []; nextOrder(G); G.ev.push({ k: 'start' }); }; }
// ---------- for the robots ----------
const ALLI = Object.keys(ING), ALLF = Object.keys(FRESH), ALLG = Object.keys(GARN), ALLGL = Object.keys(GLASSES);
const BLIND = {
  g: G => { pickGlass(G, ALLGL[(Math.random() * ALLGL.length) | 0]); if (Math.random() < 0.5) addIce(G, Math.random() < 0.5 ? 'cubes' : 'crushed'); },
  b: G => { select(G, Math.random() < 0.8 ? ALLI[(Math.random() * ALLI.length) | 0] : ALLF[(Math.random() * ALLF.length) | 0]); pourStart(G); },      // tap a bottle and hold POUR
  u: G => pourStop(G),
  x: G => { const r = Math.random(); if (r < 0.25) muddle(G); else if (r < 0.5) useShaker(G); else if (r < 0.75) { shake(G); shake(G); } else stir(G, 1.5); garnish(G, ALLG[(Math.random() * ALLG.length) | 0]); },
  s: G => serve(G),
};
// HONEST: a bartender who reads the card (or knows the recipe with acc, or picks a drink that fits a feeling), pours to the
// marks with a thumb's error, and does each step in order. react: seconds a step takes.
function planFor(G, o, acc) { if (o.drink) return o.drink; const own = solve(G, o.feel); if (own) return own; const fits = DRINKS.filter(d => avail(G, d.lv)).filter(d => { const D = newDrink(); D.glass = d.glass; D.ice = d.ice; D.fresh = (d.fresh || []).slice(); D.muddled = 3; for (const id in d.ing) D.parts.push({ id, n: d.ing[id] }); D.shook = d.how === 'shake'; return o.feel.every(k2 => WANTS[k2].test(tasteOf(D))) && tasteOf(D).sw <= 2.2 && tasteOf(D).so <= 2.0; });
  return fits.length ? fits[(Math.random() * fits.length) | 0] : null; }
function honest(G, o, mem) { if (G.over || G.wait > 0 || !G.order || G.order.free) return; const acc = o.acc == null ? 0.85 : o.acc, react = o.react == null ? 0.3 : o.react, D = G.drink;
  if (mem.order !== G.order || mem.tries !== G.order.tries) { mem.order = G.order; mem.tries = G.order.tries; mem.plan = planFor(G, G.order, acc); mem.i = 0; mem.cd = react; if (!mem.plan) { if (!G.order.asked) ask(G); mem.plan = planFor(G, G.order, acc) || DRINKS[0]; }
    mem.knows = G.cfg.card === 'full' || G.order.tries > 0 || Math.random() < 0.55 + 0.45 * acc; }
  if (D.pouring) { const R = mem.plan, want = R.ing[D.pouring] || 0, into = D.vessel === 'shaker' ? D.shaker : D.parts, got = (into.find(p => p.id === D.pouring) || { n: 0 }).n; if (got >= mem.stopAt) pourStop(G); return; }
  mem.cd -= 1 / 60; if (mem.cd > 0) return; mem.cd = react * (0.6 + 0.8 * Math.random());
  const R = mem.plan, err = () => (Math.random() - 0.5) * 2 * (1 - acc) * 1.4 + (mem.knows ? 0 : (Math.random() < 0.5 ? -1 : 1) * 1.2);
  if (!D.glass) { pickGlass(G, Math.random() < acc ? R.glass : ALLGL[(Math.random() * ALLGL.length) | 0]); return; }
  if (D.ice !== R.ice && R.ice !== 'none') { addIce(G, R.ice); return; }
  if (D.ice !== 'none' && R.ice === 'none') { addIce(G, D.ice); return; }
  const shaking = R.how === 'shake', layer = R.how === 'layer', heavy = Object.keys(R.ing).find(id => ING[id].heavy), order = Object.keys(R.ing).sort((a, b) => layer ? (a === heavy) - (b === heavy) : 0);
  for (const f of R.fresh || []) if (!D.fresh.includes(f)) { if (shaking && D.vessel !== 'shaker') { useShaker(G); return; } select(G, f); return; }
  if ((R.fresh || []).length && D.muddled < 4) { muddle(G); return; }
  if (shaking && D.vessel !== 'shaker' && !D.shook) { useShaker(G); return; }
  for (const id of order) { const into = shaking && !D.shook ? D.shaker : D.parts; if (!into.find(p => p.id === id) && !(shaking && D.shook)) { select(G, id); mem.stopAt = R.ing[id] + err(); pourStart(G); return; } }
  if (shaking && !D.shook) { if (D.shakes < 6) { shake(G); return; } strain(G); return; }
  if (R.how === 'stir' && !D.stirDone) { stir(G, 3); return; }
  if (!D.garn && R.garn) { garnish(G, Math.random() < acc ? R.garn : ALLG[(Math.random() * ALLG.length) | 0]); return; }
  serve(G); }
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.served = G.cfg.orders; finish(G, true); }
