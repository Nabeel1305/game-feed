
// ===================== THE RULES: Cake Designer =====================
// A customer orders a cake (on a card: the tiers, the icing colour, the swirls, the toppings). You make it in stages, each
// with a control made for it: STACK (a tier glides over the stand: tap to set it down, centred), COLOUR (tap the icing that
// matches the order), ICE (the cake spins; hold your thumb on it and the knife spreads icing where your thumb is: slide up
// and down to cover it all), PIPE (the cake turns under the piping bag: tap as each guide dot passes to pipe a swirl), TOP
// (tap on top of the cake to place each berry or candle, evenly). The customer scores it; a good cake pays, a great one tips.
const RULES = [
  '<b>STACK:</b> a tier glides over the stand. Tap to set it down, right in the middle.',
  '<b>COLOUR:</b> tap the icing that matches the order card.',
  '<b>ICE:</b> the cake spins. Hold your thumb on it: the knife spreads icing where your thumb is. Slide up and down to cover every bit.',
  '<b>PIPE:</b> the cake turns under the piping bag. Tap as each guide dot passes under it to pipe a swirl.',
  '<b>TOP:</b> tap on top of the cake to place berries or candles, evenly spaced, as many as ordered. The customer scores it: make their dream cake.',
];
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
const ICINGS = [{ id: 'pink', name: 'Pink', col: 0xf6a6c8 }, { id: 'white', name: 'Vanilla', col: 0xfbf4ea }, { id: 'choc', name: 'Chocolate', col: 0x6a3a22 }, { id: 'mint', name: 'Mint', col: 0xa8e6c8 },
  { id: 'lemon', name: 'Lemon', col: 0xfbe27a }, { id: 'blue', name: 'Sky', col: 0xa8d0f6 }, { id: 'lilac', name: 'Lilac', col: 0xcdb2ef }, { id: 'red', name: 'Red velvet', col: 0xd8455a },
  // 25 Nov 2026 (his words: "way more combinations... something novel each time"): ten more icings, four more sponges, four more toppings, forty more
  // occasions and forty more customers; an order is dealt from the deck, so no icing, topping or occasion comes twice until the rest have
  { id: 'peach', name: 'Peach', col: 0xfbc49a }, { id: 'caramel', name: 'Caramel', col: 0xc98a3a }, { id: 'pistachio', name: 'Pistachio', col: 0xb9d27a }, { id: 'raspberry', name: 'Raspberry', col: 0xc2185b },
  { id: 'orange', name: 'Orange', col: 0xf89a2a }, { id: 'teal', name: 'Teal', col: 0x3aa9a0 }, { id: 'blackberry', name: 'Blackberry', col: 0x4a2a5a }, { id: 'coral', name: 'Coral', col: 0xf47a6a },
  { id: 'blueberry', name: 'Blueberry', col: 0x3a4a9a }, { id: 'coffee', name: 'Coffee', col: 0xa67c52 }];
const TOPS = [{ id: 'berry', name: 'strawberries', one: 'strawberry' }, { id: 'candle', name: 'candles', one: 'candle' }, { id: 'cherry', name: 'cherries', one: 'cherry' }, { id: 'macaron', name: 'macarons', one: 'macaron' }, { id: 'blueberry', name: 'blueberries', one: 'blueberry' }, { id: 'flower', name: 'sugar flowers', one: 'sugar flower' }, { id: 'star', name: 'gold stars', one: 'gold star' }, { id: 'curl', name: 'chocolate curls', one: 'chocolate curl' }];
const SPONGES = [0xf3d79a, 0x7a4a2a, 0xf2b8b8, 0xa8323a, 0xf6e27a, 0xc98a4a, 0x9a6a44];      // vanilla, chocolate, strawberry; red velvet, lemon, carrot, coffee
const PEOPLE = ['Ada', 'Bayo', 'Chloe', 'Dami', 'Ella', 'Femi', 'Grace', 'Hassan', 'Ife', 'Jade', 'Kemi', 'Leo', 'Musa', 'Nora', 'Ola', 'Priya', 'Rosa', 'Sade', 'Tunde', 'Zara', 'Abel', 'Bisi', 'Cyrus', 'Dalia', 'Emeka', 'Farah', 'Gus', 'Hauwa', 'Ivo', 'Joy', 'Kofi', 'Lena', 'Milo', 'Ngozi', 'Otis', 'Pia', 'Quinn', 'Remi', 'Seyi', 'Tess', 'Uche', 'Vera', 'Wale', 'Xena', 'Yemi', 'Zeb', 'Amaka', 'Bruno', 'Cleo', 'Dayo', 'Esme', 'Felix', 'Gigi', 'Hugo', 'Ines', 'Jomo'];
const OCCASIONS = ['birthday', 'wedding', 'graduation', 'anniversary', 'baby shower', 'party', 'promotion', 'tea party', 'engagement', 'retirement', 'housewarming', 'christening', 'school play', 'naming day', 'homecoming', 'picnic', 'bake sale', 'street party', 'sleepover', 'book club', 'garden party', 'surprise', 'farewell', 'reunion', 'new job', 'new baby', 'big win', 'exam results', 'sweet sixteen', '18th birthday', '21st birthday', '40th birthday', '70th birthday', 'golden wedding', 'silver wedding', 'first birthday', 'welcome home', 'thank-you', 'get-well', 'harvest supper', 'village fete', 'school fair', 'team party', 'opening night', 'New Year', 'feast day', 'parade', 'driving test'];
const PLACES = [{ name: 'Corner Bakery', sky: 'morning' }, { name: 'Market Stall', sky: 'noon' }, { name: 'Tea Room', sky: 'golden' }, { name: 'Wedding Hall', sky: 'sunset' }, { name: 'Night Bakery', sky: 'night' }, { name: 'Royal Kitchen', sky: 'noon' }];
const placeOf = N => Math.floor((N - 1) / 5) % PLACES.length;
const SKINS = [{ id: 'stand', name: 'Cake stand', col: 0xf2f2f2, stars: 0 }, { id: 'gold', name: 'Gold stand', col: 0xe0b040, stars: 6 }, { id: 'mint', name: 'Mint stand', col: 0x9ee0c0, stars: 14 },
  { id: 'rose', name: 'Rose stand', col: 0xf2a0b8, stars: 24 }, { id: 'marble', name: 'Marble stand', col: 0xd8d8e0, stars: 36 }, { id: 'navy', name: 'Navy stand', col: 0x2a3a6a, stars: 50 }, { id: 'copper', name: 'Copper stand', col: 0xc8784a, stars: 66 }, { id: 'crystal', name: 'Crystal stand', col: 0xc8f0ff, stars: 85 }];
const UPGRADES = [
  { id: 'turn', name: 'Slow turntable', max: 3, cost: l => [25, 60, 120][l], desc: 'The cake turns slower: easier icing and piping.' },
  { id: 'knife', name: 'Wide knife', max: 3, cost: l => [30, 70, 140][l], desc: 'Icing covers more with each turn.' },
  { id: 'guide', name: 'Steady hands', max: 3, cost: l => [35, 80, 150][l], desc: 'Tiers glide slower.' },
  { id: 'shop', name: 'Shop sign', max: 4, cost: l => [40, 90, 170, 280][l], desc: 'More customers tip.' },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Kitchen helper'], [60, 'Baker'], [200, 'Cake artist'], [500, 'Head baker'], [1100, 'Master baker'], [2500, 'Royal baker']];
const HB = 24, AB = 48;      // the icing map: height bands x slices round
function makeCfg(N, help) { const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), boss = N % 5 === 0;
  return { tiers: N <= 2 ? 1 : N <= 6 ? 2 : boss || f > 20 ? 3 : 2, swirls: N === 1 ? 4 : Math.min(12, 4 + Math.floor(f / 4) * 2), tops: N >= 2 ? Math.min(8, 3 + Math.floor(f / 8)) : 0, drip: N >= 7 && (N % 2 === 1 || boss),
    pass: Math.round(x(66, 95, 22)) - (help ? 8 : 0), slide: x(0.45, 1.3, 25) * (1 - 0.12 * upLv('guide')), spin: 0.42 * (1 - 0.1 * upLv('turn')), knife: 1 + 0.15 * upLv('knife'), boss, help: !!help }; }
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, wait: 0, next: null };
  setup(G); if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else G.ev.push({ k: 'start' });
  return G; }
function order(G) { const c = G.cfg, R = G.rnd, n = ICINGS.length; return { who: dealOf('who', PEOPLE, R), why: dealOf('why', OCCASIONS, R), tiers: c.tiers, icing: deal('icing', n, R), sponge: deal('sponge', SPONGES.length, R),
  swirls: c.swirls, top: c.tops ? deal('top', TOPS.length, R) : -1, tops: c.tops, drip: c.drip ? (R() * n) | 0 : -1 }; }
function setup(G, o = {}) { const c = G.cfg; G.t = 0; G.yard = o.yard || null; G.ord = o.ord || order(G);
  const ord = G.ord; G.tiers = []; G.colour = null; G.swatches = null; G.ice = null; G.swirls = []; G.tops = []; G.ang = 0; G.stage = null; G.thumb = null; G.marks = {};
  if (G.yard === 'ice') { for (let i = 0; i < ord.tiers; i++) G.tiers.push({ off: 0, r: tierR(i) }); G.colour = ord.icing; goStage(G, 'ice'); }
  else if (G.yard === 'pipe') { for (let i = 0; i < ord.tiers; i++) G.tiers.push({ off: 0, r: tierR(i) }); G.colour = ord.icing; G.ice = iceMap(G, 1); goStage(G, 'pipe'); }
  else if (G.yard === 'top') { for (let i = 0; i < ord.tiers; i++) G.tiers.push({ off: 0, r: tierR(i) }); G.colour = ord.icing; G.ice = iceMap(G, 1); goStage(G, 'top'); }
  else goStage(G, 'stack'); }
const tierR = i => [1.0, 0.76, 0.54][i] || 0.5, TIER_H = 0.62;
const cakeH = G => G.tiers.length * TIER_H;
function iceMap(G, full) { const n = G.tiers.length; return { cov: Array.from({ length: n }, () => new Float32Array(HB * AB).fill(full ? 1 : 0)), top: Array.from({ length: n }, () => full ? 1 : 0), s: full ? n * HB * AB : 0 }; }
function goStage(G, s) { G.stage = s; G.st = { t: 0 }; const R = G.rnd, c = G.cfg, ord = G.ord;
  if (s === 'stack') { G.st.x = -1.6; G.st.dir = 1; }
  if (s === 'colour') { const pick = [ord.icing]; while (pick.length < 4) { const j = (R() * ICINGS.length) | 0; if (!pick.includes(j)) pick.push(j); } G.swatches = pick.sort(() => R() - 0.5); }
  if (s === 'ice') { G.ice = iceMap(G, 0); }
  if (s === 'pipe') { G.st.n = ord.swirls; G.st.guides = Array.from({ length: ord.swirls }, (_, i) => i / ord.swirls); G.ang = 0; }
  if (s === 'top') { G.st.n = ord.tops; }
  G.ev.push({ k: 'stage', s }); }
// ---------- your thumb (a press, a move, a lift); where = { u: 0..1 across, h: height on the cake 0..1 or null, top: [x, z] on the top or null } ----------
function press(G, w) { if (G.over || G.wait > 0) return; const s = G.stage; G.thumb = Object.assign({}, w);
  if (s === 'stack') { dropTier(G); return; }
  if (s === 'colour') { const i = clamp(Math.floor(w.u * 4), 0, 3); G.colour = G.swatches[i]; G.ev.push({ k: 'colour', ok: G.colour === G.ord.icing }); goStage(G, 'ice'); return; }
  if (s === 'pipe') { pipe(G); return; }
  if (s === 'top') { if (w.top) place(G, w.top); return; } }
function move(G, w) { if (G.thumb) Object.assign(G.thumb, w); }
function lift(G) { G.thumb = null; if (G.stage === 'ice' && G.ice && coverage(G) >= 0.86 && !G.st.done) iced(G); }
function iced(G) { G.st.done = true; G.ev.push({ k: 'iced', cov: coverage(G) }); if (G.lesson) { lessonSee(G, 'iced'); return; } G.wait = 0.6; G.next = () => afterIce(G); }
function dropTier(G) { const i = G.tiers.length, off = G.st.x; G.tiers.push({ off, r: tierR(i) }); const neat = Math.abs(off); G.ev.push({ k: 'drop', i, off, neat: neat < 0.06 ? 'perfect' : neat < 0.18 ? 'good' : 'off' });
  if (G.lesson) { lessonSee(G, 'drop', neat); if (G.wait > 0) return; }
  if (G.tiers.length >= G.ord.tiers) { G.wait = 0.5; G.next = () => goStage(G, 'colour'); } else { G.st.x = -1.6; G.st.dir = 1; } }
function coverage(G) { if (!G.ice) return 0; const n = G.ice.cov.length; let t = 0; for (const q of G.ice.top) t += q; return (G.ice.s + t * HB) / (n * (HB * AB + HB)); }
function afterIce(G) { if (G.ord.drip >= 0 && !G.dripDone) { G.dripDone = true; G.ev.push({ k: 'drip' }); } goStage(G, 'pipe'); }
function pipe(G) { const a = ((G.ang % 1) + 1) % 1; let best = null, bd = 1; for (const g of G.st.guides) { const d = Math.min(Math.abs(a - g), 1 - Math.abs(a - g)); if (d < bd) { bd = d; best = g; } }
  const tol = 0.5 / G.st.n; G.swirls.push({ a, err: bd * G.st.n }); G.ev.push({ k: 'swirl', q: bd * G.st.n < 0.12 ? 'perfect' : bd * G.st.n < 0.3 ? 'good' : 'off', n: G.swirls.length });
  if (G.lesson) { lessonSee(G, 'swirl', bd * G.st.n); if (G.wait > 0) return; }
  if (G.swirls.length >= G.st.n) { G.wait = 0.6; G.next = () => { if (G.ord.tops > 0) goStage(G, 'top'); else judge(G); }; } }
function place(G, p) { const top = G.tiers.length - 1, r = tierR(top) * 0.95, d = Math.hypot(p[0], p[1]); if (d > r) { G.ev.push({ k: 'miss' }); return; }
  G.tops.push({ x: p[0], z: p[1] }); G.ev.push({ k: 'top', n: G.tops.length }); if (G.lesson) { lessonSee(G, 'top'); if (G.wait > 0) return; }
  if (G.tops.length >= G.st.n) { G.wait = 0.6; G.next = () => judge(G); } }
// the ideal places for n toppings: a ring (and one in the middle from 6 on)
function topSpots(G, n) { const r = tierR(G.tiers.length - 1), out = [], mid = n >= 6 ? 1 : 0, ring = n - mid; for (let i = 0; i < ring; i++) { const a = i / ring * TAU; out.push([Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62]); } if (mid) out.push([0, 0]); return out; }
// ---------- the clock: the tier glides, the cake turns, the knife spreads ----------
function step(G, dt) { if (G.over || !(dt > 0)) return;
  if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0) { G.wait = 0; if (G.next) { const f = G.next; G.next = null; f(); } } return; }
  G.t += dt; const c = G.cfg, s = G.stage; G.st.t += dt;
  if (s === 'stack') { G.st.x += G.st.dir * c.slide * dt * (1 + 0.3 * G.tiers.length); if (G.st.x > 1.6) { G.st.x = 1.6; G.st.dir = -1; } if (G.st.x < -1.6) { G.st.x = -1.6; G.st.dir = 1; } }
  if (s === 'ice' || s === 'pipe') G.ang += c.spin * dt * (s === 'pipe' ? 0.75 : 1);
  if (s === 'ice' && G.thumb && G.thumb.h != null && G.thumb.h >= -0.05 && G.thumb.h <= 1.08) spread(G, clamp(G.thumb.h, 0, 1), dt);
  if (s === 'ice' && !G.st.done && coverage(G) >= 0.985) iced(G);
  // a customer waits only so long (never a fail: the cake is finished as it is)
  if (!G.lesson && !G.wait) { const lim = { stack: 12, colour: 15, ice: 45, pipe: 12 + 3 * (G.st.n || 0), top: 25 }[s];
    if (lim && G.st.t > lim) { G.ev.push({ k: 'hurry' }); if (s === 'stack') dropTier(G); else if (s === 'colour') press(G, { u: 0.1 }); else if (s === 'ice') iced(G); else if (s === 'pipe') { G.st.n = G.swirls.length; G.wait = 0.4; G.next = () => { if (G.ord.tops > 0) goStage(G, 'top'); else judge(G); }; } else if (s === 'top') { G.st.n = G.tops.length; judge(G); } } } }
function spread(G, h, dt) { // h: 0 (the foot of the cake) .. 1 (the top); the knife covers a band of the side as the cake turns
  const H = cakeH(G), y = h * H, ti = clamp(Math.floor(y / TIER_H), 0, G.tiers.length - 1), yb = (y - ti * TIER_H) / TIER_H, band = 0.2 * G.cfg.knife, a0 = ((G.ang % 1) + 1) % 1;
  const cov = G.ice.cov[ti], aw = 0.06; let fresh = 0; const b0 = Math.max(0, Math.ceil((yb - band) * HB - 0.5)), b1 = Math.min(HB - 1, Math.floor((yb + band) * HB - 0.5)), k0 = Math.ceil((a0 - aw) * AB - 0.5), k1 = Math.floor((a0 + aw) * AB - 0.5);
  for (let b = b0; b <= b1; b++) for (let kk = k0; kk <= k1; kk++) { const k2 = ((kk % AB) + AB) % AB, j = b * AB + k2, was = cov[j]; if (was < 1) fresh++; cov[j] = Math.min(1.5, was + dt * 9); G.ice.s += Math.min(1, cov[j]) - Math.min(1, was); }
  if (yb > 0.8 || h > 0.97) G.ice.top[ti] = Math.min(1, G.ice.top[ti] + dt * 0.9);
  if (ti < G.tiers.length - 1 && yb > 0.85) G.ice.top[ti] = 1;      // a lower tier's ledge is covered by the tier above
  G.spreading = fresh > 0; }
// ---------- the verdict ----------
function judge(G) { const o = G.ord, parts = [];
  const stack = G.tiers.reduce((s, t) => s + clamp(1 - Math.abs(t.off) / 0.35, 0, 1), 0) / Math.max(1, G.tiers.length); parts.push(['Stacking', stack, 20]);
  parts.push(['Colour', G.colour === o.icing ? 1 : 0.25, 15]);
  const cov = coverage(G); parts.push(['Icing', clamp((cov - 0.75) / 0.23, 0, 1), 20]);
  if (o.swirls) { const q = G.swirls.reduce((s, w) => s + clamp(1 - w.err * 2.5, 0, 1), 0); parts.push(['Swirls', q / o.swirls, 20]); }
  if (o.tops) { const spots = topSpots(G, o.tops), used = new Set(); let err = 0; for (const p of G.tops) { let bi = -1, bd = 9; spots.forEach((s, i) => { if (used.has(i)) return; const d = Math.hypot(s[0] - p.x, s[1] - p.z); if (d < bd) { bd = d; bi = i; } }); used.add(bi); err += bd; }
    const r = tierR(G.tiers.length - 1); parts.push(['Toppings', clamp(1 - err / Math.max(1, G.tops.length) / (r * 0.45), 0, 1) * G.tops.length / o.tops, 20]); }
  const tot = parts.reduce((s, p) => s + p[2], 0); let score = Math.round(parts.reduce((s, p) => s + p[1] * p[2], 0) / tot * 100); if (G.colour !== o.icing) score = Math.min(score, G.cfg.pass - 12);      // the wrong colour: it is not their cake
  G.score = score; G.parts = parts.map(p => [p[0], Math.round(p[1] * 100)]); G.ev.push({ k: 'judge', score });
  if (G.lesson) return; finish(G, score >= G.cfg.pass); }
function finish(G, win) { if (G.over) return true; G.over = win ? 'won' : 'lost'; const c = G.cfg, s = G.score || 0;
  const stars = win ? 1 + (s >= c.pass + 10 ? 1 : 0) + (s >= 94 ? 1 : 0) : 0, tip = win && s >= 85 ? 3 + upLv('shop') * 2 : 0;
  G.res = { win, stars, score: s, pass: c.pass, parts: G.parts || [], who: G.ord.who, why: G.ord.why, tip, coins: Math.max(1, Math.round(s / 10) + (win ? 4 + Math.ceil(G.N / 3) + stars * 2 + tip : 0)) };
  G.ev.push({ k: win ? 'won' : 'lost' }); return true; }
// ---------- the robot: a baker who looks ----------
const gauss = () => { let u = 0; for (let i = 0; i < 4; i++) u += Math.random(); return (u - 2) * 1.732; };
function honest(G, o, mem) { if (G.over || G.wait > 0) return; const acc = o.acc == null ? 0.85 : o.acc, react = o.react == null ? 0.3 : o.react, s = G.stage, c = G.cfg;
  if (mem.st !== s + G.tiers.length + ':' + G.swirls.length + ':' + G.tops.length) { mem.st = s + G.tiers.length + ':' + G.swirls.length + ':' + G.tops.length; mem.at = G.t + react * (0.6 + Math.random()); mem.err = gauss() * (1 - acc); mem.sweep = 0; }
  if (G.t < mem.at) return;
  if (s === 'stack') { const tx = mem.err * 0.22, sd = Math.sign(G.st.x - tx); if (mem.sd != null && sd !== mem.sd) { mem.sd = null; press(G, { u: 0.5 }); return; } mem.sd = sd; return; }
  if (s === 'colour') { const right = G.swatches.indexOf(G.ord.icing), i = Math.random() < 0.75 + 0.25 * acc ? right : (Math.random() * 4) | 0; press(G, { u: (i + 0.5) / 4 }); return; }
  if (s === 'ice') { mem.sweep += 1 / 60; const h = 0.5 + 0.52 * Math.sin(mem.sweep * (1.4 + acc)); if (!G.thumb) press(G, { h: clamp(h, 0, 1) }); else move(G, { h: clamp(h, 0, 1) }); if (coverage(G) >= 0.9 + 0.08 * acc || mem.sweep > 40) lift(G); return; }
  if (s === 'pipe') { if (mem.pe == null) mem.pe = gauss() * (1 - acc) * 0.5 / G.st.n; const a = ((G.ang % 1) + 1) % 1, need = G.st.guides[G.swirls.length % G.st.n] + mem.pe, d = ((need - a) % 1 + 1) % 1; if (d < c.spin * 0.75 / 60 * 1.01 && mem.pa !== (G.deals | 0) + ':' + G.swirls.length) { mem.pa = (G.deals | 0) + ':' + G.swirls.length; mem.pe = null; press(G, {}); } return; }
  if (s === 'top') { const spots = topSpots(G, G.st.n), p = spots[G.tops.length], r = tierR(G.tiers.length - 1) * 0.25 * (1 - acc) * 2; press(G, { top: [p[0] + gauss() * r, p[1] + gauss() * r] }); return; } }
// blind moves (no looking): a tap somewhere, a thumb put down somewhere, a lift
const blindAt = () => ({ u: Math.random(), h: Math.random() * 3 - 1, top: [Math.random() * 4 - 2, Math.random() * 4 - 2] });      // a thumb anywhere on the screen: the cake is about a third of it
const BLIND = { t: G => { press(G, blindAt()); if (G.stage === 'ice') lift(G); }, h: G => press(G, blindAt()), u: G => lift(G) };
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.wait = 0; G.score = 100; G.parts = []; finish(G, true); }
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'ice', title: 'HOLD TO ICE', say: 'HOLD AND SLIDE', do: 'drag', dir: 'ud', how: 'The cake spins. Hold your thumb on it: the knife spreads icing where your thumb is. Slide up and down until it is all covered.', need: 1 }],
  2: [{ id: 'pipe', title: 'TAP TO PIPE', say: 'TAP ON THE DOT', do: 'tap', how: 'The cake turns under the piping bag. Tap as each guide dot passes under the bag. Pipe 4 swirls right on their dots.', need: 4 }],
  3: [{ id: 'top', title: 'TAP TO TOP', say: 'TAP ON THE RING', do: 'tap', how: 'Tap on top of the cake to place each strawberry on its faint ring spot. Place 4 evenly.', need: 4 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonDeal(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonDeal(G) { const st = lessonNow(G); G.rnd = rng(G.seed + (G.deals = (G.deals | 0) + 1)); G.lesson.n = 0; G.lessonIce = false; const ord = order(G); ord.tiers = 1; ord.swirls = 4; ord.tops = 4; ord.top = 0; ord.drip = -1; setup(G, { yard: st.id, ord }); G.ev.push({ k: 'yard' }); }
function lessonMiss(G, how) { G.ev.push({ k: 'lessonmiss', how }); G.wait = 1.4; G.next = () => lessonDeal(G); }
function lessonSee(G, what, v) { const L = lessonNow(G); if (!L || G.wait > 0) return;
  if (L.id === 'ice' && what === 'iced') G.lesson.n = 1;
  if (L.id === 'pipe' && what === 'swirl') { if (v < 0.3) { G.lesson.n++; G.ev.push({ k: 'lessonok', n: G.lesson.n, need: L.need }); } else { lessonMiss(G, 'Off its dot! Tap just as the dot passes under the bag. Again.'); return; } }
  if (L.id === 'top' && what === 'top') { const p = G.tops[G.tops.length - 1], spots = topSpots(G, 4), d = Math.min(...spots.map(s => Math.hypot(s[0] - p.x, s[1] - p.z))); if (d < 0.22) { G.lesson.n++; G.ev.push({ k: 'lessonok', n: G.lesson.n, need: L.need }); } else { lessonMiss(G, 'Not quite on its spot. Tap right on the faint rings. Again.'); return; } }
  if (G.lesson.n < L.need) return;
  G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.wait = 1.4; G.next = () => { G.rnd = rng(G.seed); setup(G); G.ev.push({ k: 'start' }); G.ev.push({ k: 'yard' }); }; }
