// ===================== RULES: Pottery Wheel =====================
// A customer's order hangs on the wall: its outline (a bowl, a cup, a vase, a jug...) and a glaze colour. Centre the clay
// (hold and press, keeping the pressure in the green), pull the walls up (drag up along the wall, not too fast or it tears),
// shape the profile to the order's outline (touch at a height and move in or out), then Done: glaze it and fire it. The
// closer the match, the more it is worth. Walls pulled too thin or leaning too far out slump.
// Units: centimetres. The pot is a profile: radius r[i] at height i * DZ, a wall thickness t, a height h.

const RULES = [
  '<b>Centre</b> the clay: hold on it and press (drag down a little). Keep the pressure in the green until it stops wobbling.',
  '<b>Pull</b> up the walls: drag upwards along the wall. Each pull makes it taller and thinner. Too fast and it tears.',
  '<b>Shape:</b> touch the pot at a height and move in or out. Match the order\'s outline (the dotted line).',
  'Too thin, or leaning out too far, and it <b>slumps</b>. The wall gauge warns you first.',
  'Tap <b>Done</b>, choose the glaze the customer asked for, and fire it. The closer the match, the better.',
];
const SKINS = [{ id: 'terracotta', name: 'Terracotta clay', col: 0xb8603a, stars: 0 }, { id: 'stone', name: 'Stoneware', col: 0x9a8a78, stars: 6 }, { id: 'porcelain', name: 'Porcelain', col: 0xe8e2d8, stars: 14 },
  { id: 'black', name: 'Black clay', col: 0x3a3430, stars: 24 }, { id: 'red', name: 'Red earth', col: 0x8a3a2a, stars: 36 }, { id: 'speckle', name: 'Speckled', col: 0xc8b490, stars: 50 }];
const UPGRADES = [{ id: 'wheel', name: 'Smoother wheel', max: 2, cost: l => [60, 140][l], desc: 'Centring settles faster.' }, { id: 'sponge', name: 'Fine sponge', max: 2, cost: l => [70, 150][l], desc: 'Pulls tear less easily.' },
  { id: 'kiln', name: 'Bigger kiln', max: 1, cost: () => 120, desc: 'Rare glaze effects come out more often.' }];
const upLv = id => { if (typeof HEADLESS !== 'undefined' && HEADLESS) return 0; return ((store.get('ups', {}) || {})[id]) | 0; };
const RANKS = [[0, 'Beginner'], [60, 'Apprentice'], [200, 'Potter'], [500, 'Master potter'], [1100, 'Studio owner'], [2500, 'Living treasure']];
const PLACES = [{ name: 'Garden studio', sky: 'morning' }, { name: 'Village workshop', sky: 'golden' }, { name: 'Riverside kiln', sky: 'noon' }, { name: 'Mountain studio', sky: 'overcast' }];
const placeOf = N => Math.floor((N - 1) / 5) % 4;
const DZ = 0.5, NS = 60;      // half-centimetre slices, up to 30 cm tall
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
const GLAZES = [{ id: 'celadon', name: 'Celadon green', col: 0x8ab8a0 }, { id: 'cobalt', name: 'Cobalt blue', col: 0x2a4a9a }, { id: 'honey', name: 'Honey amber', col: 0xc8862a },
  { id: 'white', name: 'Milk white', col: 0xf0ece2 }, { id: 'rust', name: 'Rust red', col: 0x9a3a22 }, { id: 'ink', name: 'Ink black', col: 0x1e1c22 },
  // 25 Nov 2026 (his words: "way more combinations... something novel each time"): ten more glazes (six are on the bench for any one pot), sixteen more
  // shapes and thirty-two more customers; from level 5 the shape is dealt from the deck, so no shape comes twice until the others have
  { id: 'teal', name: 'Sea teal', col: 0x2a8a88 }, { id: 'oat', name: 'Oatmeal', col: 0xd8c8a0 }, { id: 'plum', name: 'Plum', col: 0x5a2a4a }, { id: 'sky', name: 'Sky blue', col: 0x8ab8e0 }, { id: 'moss', name: 'Moss green', col: 0x5a6a2a },
  { id: 'shell', name: 'Shell pink', col: 0xe8b8b0 }, { id: 'mustard', name: 'Mustard', col: 0xd0a020 }, { id: 'slate', name: 'Slate grey', col: 0x5a6470 }, { id: 'copper', name: 'Copper', col: 0xb8623a }, { id: 'lilac', name: 'Lilac', col: 0xb8a0d8 }];
// the orders: each a profile function of u (0 at the foot, 1 at the rim) giving the outside radius, and a height
const SHAPES = [
  { id: 'bowl', name: 'a bowl', h: 8, f: u => 4 + 6 * Math.sin(u * Math.PI / 2) },
  { id: 'cup', name: 'a cup', h: 10, f: u => 3.6 + 0.8 * u + 0.6 * Math.max(0, u - 0.8) * 5 },
  { id: 'vase', name: 'a vase', h: 18, f: u => 3 + 3.8 * Math.sin(u * Math.PI * 0.9) - 1.6 * Math.max(0, u - 0.75) * 4 },
  { id: 'jug', name: 'a jug', h: 16, f: u => 4 + 2.6 * Math.sin(u * Math.PI * 0.75) - 2.2 * Math.max(0, u - 0.7) * 3.3 + 1.2 * Math.max(0, u - 0.9) * 10 },
  { id: 'bottle', name: 'a bottle', h: 22, f: u => u < 0.55 ? 4.5 + 2 * Math.sin(u / 0.55 * Math.PI / 2) : 6.5 - 4.6 * Math.sin(Math.min(1, (u - 0.55) / 0.3) * Math.PI / 2) },
  { id: 'plate', name: 'a wide dish', h: 5, f: u => 4.5 + 6 * Math.pow(u, 0.6) },
  { id: 'tall', name: 'a tall vase', h: 26, f: u => 3.4 + 1.6 * Math.sin(u * Math.PI * 1.6) * (1 - u * 0.4) + 0.8 * u },
  { id: 'moon', name: 'a moon jar', h: 20, f: u => 3 + 6 * Math.sin(Math.min(1, u * 1.05) * Math.PI) * 0.95 + (u > 0.9 ? 1.6 * (u - 0.9) * 10 : 0) },
  { id: 'mug', name: 'a mug', h: 11, f: u => 4.2 + 0.3 * Math.sin(u * Math.PI) },
  { id: 'teabowl', name: 'a tea bowl', h: 7, f: u => 3 + 3.2 * Math.pow(u, 0.5) },
  { id: 'pitcher', name: 'a pitcher', h: 20, f: u => 3.6 + 2.4 * Math.sin(u * Math.PI * 0.8) + (u > 0.85 ? 1.4 * (u - 0.85) * 6.6 : 0) },
  { id: 'planter', name: 'a plant pot', h: 12, f: u => 3.4 + 2.8 * u + 0.8 * Math.max(0, u - 0.85) * 6.6 },
  { id: 'ginger', name: 'a ginger jar', h: 17, f: u => u < 0.85 ? 3.2 + 4.4 * Math.pow(Math.sin(u / 0.85 * Math.PI), 0.8) : 3.2 },
  { id: 'tumbler', name: 'a tumbler', h: 12, f: u => 3.2 + 1.3 * u },
  { id: 'pasta', name: 'a pasta bowl', h: 6, f: u => 4 + 5.2 * Math.pow(u, 0.62) },
  { id: 'urn', name: 'an urn', h: 22, f: u => 2.8 + 4.4 * Math.sin(Math.pow(u, 0.88) * Math.PI) * (1 - 0.15 * u) + (u > 0.88 ? 2.2 * (u - 0.88) * 8.3 : 0) },
  { id: 'carafe', name: 'a carafe', h: 21, f: u => u < 0.5 ? 3.6 + 2.6 * Math.sin(u / 0.5 * Math.PI / 2) : 6.2 - 3.6 * Math.sin(Math.min(1, (u - 0.5) / 0.25) * Math.PI / 2) + (u > 0.85 ? 1.6 * (u - 0.85) * 6.6 : 0) },
  { id: 'beaker', name: 'a beaker', h: 13, f: u => 3.4 + 0.45 * Math.sin(u * Math.PI * 2) + 0.9 * u },
  { id: 'saucer', name: 'a saucer', h: 4, f: u => 4 + 5 * u },
  { id: 'amphora', name: 'an amphora', h: 25, f: u => 3 + 4.2 * Math.sin(Math.pow(u, 1.25) * Math.PI) + 0.4 * u },
  { id: 'bud', name: 'a bud vase', h: 13, f: u => u < 0.6 ? 2.6 + 2.8 * Math.sin(u / 0.6 * Math.PI) : 2.6 },
  { id: 'pail', name: 'a pail', h: 14, f: u => 3.8 + 2.2 * u },
  { id: 'honeypot', name: 'a honey pot', h: 11, f: u => 3.7 + 2.8 * Math.sin(u * Math.PI * 0.85) },
  { id: 'fruit', name: 'a fruit bowl', h: 9, f: u => 3.2 + 6.4 * Math.sin(u * Math.PI / 2) * (0.85 + 0.15 * u) },
];
function makeCfg(N, help, o = {}) {
  const f = curve(N), e = easyOf(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s));
  return { N, f, e, help: !!help, place: placeOf(N), shape: N <= 2 ? 0 : N <= 4 ? 1 : (N * 5 + 1) % SHAPES.length, goal: x(72, 91, 16) - (help ? 6 : 0), tear: x(75, 45, 20) * (1 + 0.15 * upLv('sponge')), clay: 1.0, slumpK: x(1, 1.25, 20), lives: 3 };
}
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help, o), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, mini: !!o.mini };
  order(G, rng(seed + 9)); fresh(G);
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G);
  return G;
}
// the order: a shape (stretched a little each time) and a glaze; a straight cylinder must never pass for it
const FROM = ['Mrs Okafor', 'the café on the corner', 'a flower shop', 'Mr Lindqvist', 'the tea house', 'a young couple', 'the old inn', 'a gallery', 'the village school', 'a bride-to-be', 'the noodle bar', 'Dr Adeyemi', 'a beekeeper', 'the harbour hotel', 'two students', 'the bakery', 'Grandpa Joe', 'a market gardener', 'the museum shop', 'Ms Tanaka', 'a new neighbour', 'the allotment club', 'a painter', 'the ferry café', 'Auntie Bisi', 'a chef', 'the bookshop', 'a wedding planner', 'the farm shop', 'Mr Haddad', 'a candle maker', 'the yoga studio', 'the old lighthouse', 'a herbalist', 'the cider press', 'Madame Duval', 'a collector', 'the garden centre', 'a film crew', 'the choir'];
function order(G, R) { const c = G.cfg, live = !(typeof HEADLESS !== 'undefined' && HEADLESS) && !G.lesson && G.N > 4, S = live ? dealOf('shape', SHAPES, R) : SHAPES[c.shape];      /* the first four levels teach the bowl and the cup; after that the shape comes from the deck */ const sw = 0.85 + R() * 0.3, sh = 0.9 + R() * 0.2;
  G.ord = { shape: S, name: S.name, h: S.h * sh, f: u => S.f(u) * sw, glaze: deal('glaze', GLAZES.length, R), from: dealOf('from', FROM, R) };
  { const six = [G.ord.glaze]; while (six.length < 6) { const j = (R() * GLAZES.length) | 0; if (!six.includes(j)) six.push(j); } for (let i = 5; i > 0; i--) { const j = (R() * (i + 1)) | 0, t = six[i]; six[i] = six[j]; six[j] = t; } G.ord.bench = six; }      /* six glazes on the bench: the one asked for and five others */
  G.target = []; for (let i = 0; i < NS; i++) { const z = i * DZ; G.target.push(z <= G.ord.h ? G.ord.f(z / G.ord.h) : 0); } }
function fresh(G) { G.phase = 'center'; G.wob = 1; G.press = 0; G.holding = false; G.okT = 0; G.r = []; for (let i = 0; i < NS; i++) G.r.push(0);
  G.h = 6; G.t0 = 2.6; G.wall = 2.6; G.base = 1.2; for (let i = 0; i < NS; i++) G.r[i] = i * DZ <= G.h ? 6.5 - Math.pow(i * DZ / G.h, 2) * 2.5 : 0;   // a squat lump
  G.vol = volume(G); G.pull = null; G.shapeAt = null; G.slumps = G.slumps || 0; G.warn = 0; G.glaze = null; G.pulls = 0; G.tears = 0; }
function volume(G) { let v = 0; for (let i = 0; i * DZ <= G.h; i++) v += 2 * Math.PI * Math.max(0.5, G.r[i]) * G.wall * DZ; return v; }
// ---------- the player's actions ----------
function hold(G, p) { if (G.over || G.phase !== 'center') return false; G.holding = p != null; G.press = p == null ? 0 : clamp(p, 0, 1); return true; }
// a pull: from the foot to the rim at a speed (cm of height a second); each one thins the wall and raises the pot
function pullStart(G) { if (G.over || G.phase !== 'pull') return false; G.pull = { z: 0, fast: 0 }; G.ev.push({ k: 'pullstart' }); return true; }
function pullMove(G, z, speed) { const P = G.pull; if (!P || G.over) return false; P.z = Math.max(P.z, clamp(z, 0, G.h)); P.fast = Math.max(P.fast, speed); return true; }
function pullEnd(G) { const P = G.pull; G.pull = null; if (!P || G.over || G.phase !== 'pull') return false; const c = G.cfg;
  if (P.z < G.h * 0.6) { G.ev.push({ k: 'pullshort' }); return false; }
  if (P.fast > c.tear) { G.tears++; G.ev.push({ k: 'tear' }); lessonSee(G, 'tear'); return slump(G, 'tear'); }
  const vol = G.vol; G.wall = Math.max(0.25, G.wall * 0.86); G.pulls++;
  // the same clay, thinner and taller: the walls straighten up towards a cylinder as they rise
  const rAvg = G.r.slice(0, Math.floor(G.h / DZ) + 1).reduce((a, b) => a + b, 0) / (Math.floor(G.h / DZ) + 1), nh = clamp(vol / (2 * Math.PI * Math.max(2, rAvg * 0.85) * G.wall), G.h, (NS - 1) * DZ);
  const old = G.r.slice(), oh = G.h; G.h = nh; for (let i = 0; i < NS; i++) { const z = i * DZ; if (z > G.h) { G.r[i] = 0; continue; } const oz = z / G.h * oh, j = Math.min(NS - 1, Math.floor(oz / DZ)); G.r[i] = lerp(old[j], rAvg * 0.9, 0.35); }
  G.ev.push({ k: 'pulled', h: G.h, wall: G.wall }); lessonSee(G, 'pull'); return checkSlump(G); }
// shaping: a touch at height z pulls the profile there towards radius r (a soft bump, a few centimetres wide)
function shapeTo(G, z, r, dt = 1 / 60) { if (G.over || G.phase !== 'shape') return false; const iz = z / DZ, rr = clamp(r, 0.8, 12.5);
  for (let i = 0; i < NS; i++) { if (i * DZ > G.h) break; const d = Math.abs(i - iz) * DZ, w = Math.exp(-(d * d) / 2.2); if (w < 0.02) continue; G.r[i] += (rr - G.r[i]) * Math.min(1, dt * 4 * w); }
  G.shaping = (G.shaping || 0) + dt; if (G.shaping > 0.25) { G.shaping = 0; checkSlump(G); } return true; }
// trimming: the cutting wire takes the rim off at a height (the clay above is lost)
function trim(G, z) { if (G.over || (G.phase !== 'shape' && G.phase !== 'pull') || G.pulls === 0) return false; const zz = clamp(z, 2, G.h - 0.3); if (zz >= G.h - 0.3) return false; G.h = zz; for (let i = 0; i < NS; i++) if (i * DZ > G.h) G.r[i] = 0; G.vol = volume(G); G.ev.push({ k: 'trim', h: G.h }); lessonSee(G, 'trim'); return true; }
function setPhase(G, ph) { if (G.over) return false; if (ph === 'shape' && G.phase === 'pull' && G.pulls === 0) return false; if (ph === 'pull' && G.phase === 'shape') { G.phase = 'pull'; return true; }
  if (ph === 'shape' && G.phase === 'pull') { G.phase = 'shape'; G.ev.push({ k: 'phase', ph }); lessonSee(G, 'toshape'); return true; } return false; }
function done(G) { if (G.over || (G.phase !== 'shape' && G.phase !== 'pull') || G.pulls === 0) return false; G.phase = 'glaze'; G.ev.push({ k: 'phase', ph: 'glaze' }); G.matchNow = match(G); lessonSee(G, 'done'); return true; }
function glaze(G, gi) { if (G.over || G.phase !== 'glaze' || !GLAZES[gi]) return false; G.glaze = gi; G.phase = 'kiln'; G.kilnT = 2.4; G.ev.push({ k: 'kiln', gi }); return true; }
// how close to the order: the profile (radius at every height) and the height
function match(G) { const H = Math.max(G.h, G.ord.h), n = Math.floor(H / DZ) + 1; let err = 0, sum = 0;
  for (let i = 0; i < n; i++) { const z = i * DZ, a = z <= G.h ? G.r[i] : 0, b = z <= G.ord.h ? G.target[i] : 0; err += Math.abs(a - b); sum += Math.max(a, b, 1); }
  const he = Math.abs(G.h - G.ord.h) / G.ord.h; return Math.round(clamp(100 * (1 - err / sum * 1.6 - he * 0.9), 0, 100)); }
// the walls: too thin for their height, or leaning out further than they can hold, and the pot slumps
function stability(G) { const n = Math.floor(G.h / DZ); let lean = 0; for (let i = 2; i <= n; i++) lean = Math.max(lean, (G.r[i] - G.r[i - 2]) / (2 * DZ));
  const need = (0.22 + 0.016 * G.h + 0.45 * Math.max(0, lean - 0.6)) * G.cfg.slumpK; return G.wall / need; }
function checkSlump(G) { const s = stability(G); if (s < 1) return slump(G, 'thin'); if (s < 1.15) { if (!G.warn) G.ev.push({ k: 'warn' }); G.warn = 1; } else G.warn = 0; return true; }
function slump(G, why) { G.slumps++; G.ev.push({ k: 'slump', why }); if (G.lesson) { fresh(G); G.phase = G.lesson.id === 'center' ? 'center' : 'pull'; if (G.phase === 'pull') { G.wob = 0; } return false; }
  if (G.slumps >= G.cfg.lives) { finish(G, false, 'slumps'); return false; } fresh(G); return false; }
function step(G, dt) { if (G.over || !(dt > 0)) return; G.t += dt; if (G.lesson) lessonTick(G, dt); const c = G.cfg;
  if (G.blindT != null) { G.blindT -= dt; if (G.blindT <= 0) { G.blindT = null; hold(G, null); } }
  if (G.phase === 'center') { const good = G.holding && G.press >= 0.42 && G.press <= 0.78, hard = G.holding && G.press > 0.78;
    G.wob = clamp(G.wob + dt * (good ? -0.38 * (1 + 0.25 * upLv('wheel')) : hard ? 0.25 : G.holding ? -0.05 : 0.06), 0, 1.2);
    if (hard && G.wob > 1.15) { G.ev.push({ k: 'squash' }); G.wob = 1; }
    if (G.wob < 0.08) { G.okT += dt; if (G.okT > 0.8) { G.phase = 'pull'; G.holding = false; G.ev.push({ k: 'centred' }); lessonSee(G, 'centred'); } } else G.okT = 0; }
  if (G.phase === 'kiln') { G.kilnT -= dt; if (G.kilnT <= 0) fired(G); } }
function fired(G) { const m = G.matchNow, gOk = G.glaze === G.ord.glaze, sur = G.rnd() < 0.08 + 0.06 * upLv('kiln') ? pick(G.rnd, ['crackle', 'speckle', 'drip', 'gold flecks']) : null;
  G.ev.push({ k: 'fired', m, gOk, sur }); if (G.lesson) { lessonSee(G, 'fired'); return; } finish(G, m >= G.cfg.goal, m >= G.cfg.goal ? null : 'match', { m, gOk, sur }); }
function finish(G, win, why, o = {}) { if (G.over) return; G.over = win ? 'won' : 'lost'; const m = o.m || 0;
  const stars = win ? (m >= 93 && o.gOk && G.slumps === 0 ? 3 : m >= G.cfg.goal + 8 || (o.gOk && G.slumps === 0) ? 2 : 1) : 0;
  G.res = { win, why, stars, coins: win ? 10 + Math.round(m / 5) + (o.gOk ? 8 : 0) + (o.sur ? 10 : 0) + stars * 4 : 3, match: m, goal: Math.round(G.cfg.goal), gOk: !!o.gOk, sur: o.sur, slumps: G.slumps, order: G.ord.name, from: G.ord.from, glazeWant: GLAZES[G.ord.glaze].name };
  G.ev.push({ k: win ? 'won' : 'lost', why }); }

// ---------- LESSONS: centre, pull, shape ----------
const LESSONS = {
  1: [{ id: 'center', title: 'CENTRE THE CLAY', say: 'HOLD, PRESS DOWN', do: 'drag', dir: 'down', how: 'Hold your thumb on the clay and drag down a little to press. Keep the pressure needle in the green until the wobble stops. Twice.', need: 2 }],
  2: [{ id: 'pull', title: 'PULL THE WALLS UP', say: 'DRAG UP SLOWLY', do: 'drag', dir: 'up', how: 'Drag upwards along the wall, from the bottom to the top, steadily (the trail turns red if too fast). Make three good pulls.', need: 3 }],
  3: [{ id: 'shape', title: 'SHAPE TO THE ORDER', say: 'MOVE IN AND OUT', do: 'drag', dir: 'lr', how: 'Tap SHAPE, then touch the pot and move in or out to follow the dotted outline. Tap DONE when it matches (70% or more), glaze, and fire it.', need: 1 }],
};
function lessonStart(G) { const st = LESSONS[G.N][0]; G.lesson = { steps: LESSONS[G.N], i: 0, n: 0, id: st.id }; G.ev.push({ k: 'lessonnext', first: true });
  if (st.id !== 'center') { G.phase = 'pull'; G.wob = 0; } if (st.id === 'shape') { for (let k2 = 0; k2 < 3; k2++) { G.phase = 'pull'; pullStart(G); pullMove(G, G.h, 10); pullEnd(G); } G.phase = 'pull'; } }
function lessonSee(G, what) { const D = G.lesson; if (!D || D.done) return; const id = D.id;
  const good = id === 'center' && what === 'centred' || id === 'pull' && what === 'pull' || id === 'shape' && what === 'fired' && G.matchNow >= 70;
  if (good) { D.n++; G.ev.push({ k: 'lessonok', n: D.n, need: D.steps[0].need }); if (D.n >= D.steps[0].need) { D.done = true; D.wait = 1.6; } else if (id === 'center') { fresh(G); } }
  else if (id === 'pull' && what === 'tear' && D.n) { D.n = 0; G.ev.push({ k: 'lessonmiss', how: 'Slower: a steady drag from the bottom to the top.' }); }
  else if (id === 'shape' && what === 'fired') { G.ev.push({ k: 'lessonmiss', how: 'Not close enough yet: follow the dotted line more closely, then DONE again.' }); G.phase = 'shape'; } }
function lessonTick(G, dt) { const D = G.lesson; if (D.id === 'pull' && !D.done && G.h > 24) { const n = D.n; fresh(G); G.phase = 'pull'; G.wob = 0; D.n = n; }
  if (!D.done) return; D.wait -= dt; if (D.wait > 0) return; G.lesson = null; G.slumps = 0; fresh(G); G.ev.push({ k: 'lessondone', N: G.N }); }

// ---------- for the robots: blind moves and an honest potter ----------
const BLIND = {
  h: G => { hold(G, Math.random()); G.blindT = 0.2 + Math.random() * 2; },                         // hold with any pressure
  r: G => hold(G, null),                                                                              // let go
  u: G => { if (pullStart(G)) { pullMove(G, G.h * (0.3 + Math.random() * 0.9), 10 + Math.random() * 150); pullEnd(G); } },   // a pull, any speed and length
  s: G => { setPhase(G, 'shape'); shapeTo(G, Math.random() * G.h, 1 + Math.random() * 14, 0.3); },  // shape anywhere
  t: G => trim(G, Math.random() * G.h),                                                              // trim anywhere
  p: G => setPhase(G, 'pull'),                                                                        // back to pulling
  d: G => done(G),                                                                                    // done
  g: G => glaze(G, G.ord && G.ord.bench ? G.ord.bench[(Math.random() * 6) | 0] : (Math.random() * GLAZES.length) | 0),                                             // any glaze
};
// HONEST: a potter who looks: presses in the green (with a wobbly thumb), pulls steadily until the pot is the order's height,
// then shapes slice by slice towards the dotted line (as accurately as acc), checks the match and the wall gauge, glazes
// the colour asked for. react: seconds behind; acc: how steady.
function honest(G, o, mem) {
  if (G.over) return; const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random;
  if (G.phase === 'center') { mem.trimmed = 0; mem.passes = 0; mem.si = 0; mem.bias = null; if (G.t < (mem.nh || 0)) return; mem.nh = G.t + 0.15 + react * 0.3; hold(G, 0.6 + (R() - 0.5) * (1 - acc) * 0.9); return; }
  if (G.t < (mem.next || 0)) return; mem.next = G.t + 0.25 + react * 0.8;
  if (G.phase === 'pull' && G.lesson && G.lesson.id === 'pull') { pullStart(G); pullMove(G, G.h, G.cfg.tear * (0.5 + (1 - acc) * R() * 0.9)); pullEnd(G); return; }
  if (G.phase === 'pull') { const tgtH = G.ord.h * 1.03, s = stability(G); if (G.h < tgtH - 0.6 && s > 1.45 && G.pulls < 8) { pullStart(G); pullMove(G, G.h, G.cfg.tear * (0.5 + (1 - acc) * (R() * 0.9))); pullEnd(G); return; } setPhase(G, 'shape'); mem.si = 0; return; }
  if (G.phase === 'shape') { if (mem.bias == null) mem.bias = (R() - 0.5) * (1 - acc) * 4; const n = Math.floor(G.h / DZ); mem.si = mem.si || 0; mem.passes = mem.passes || 0;
    for (let k2 = 0; k2 < 6; k2++) { const i = mem.si % (n + 1), z = i * DZ, want = G.target[i] || G.r[i]; shapeTo(G, z + (R() - 0.5) * (1 - acc) * 3, want + (R() - 0.5) * (1 - acc) * 6 + mem.bias, 0.12); mem.si += 2; if (mem.si > n) { mem.si = 0; mem.passes++; } }
    if (G.h > G.ord.h + 0.4 && !mem.trimmed) { mem.trimmed = 1; trim(G, G.ord.h + (R() - 0.5) * (1 - acc) * 2); return; }
    const m = match(G); if (m >= Math.min(97, G.cfg.goal + 6 * acc) || mem.passes > 5) done(G); return; }
  if (G.phase === 'glaze') { glaze(G, R() < acc ? G.ord.glaze : G.ord.bench[(R() * 6) | 0]); return; }
}
function winNow(G) { if (!G || G.over || G.lesson) return; finish(G, true, null, { m: 90, gOk: true }); }
