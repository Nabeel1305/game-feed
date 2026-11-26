
// ===================== RULES: Deep Bite (game 35, his idea) =====================
// You are a young shark. Hold a thumb anywhere and drag: the shark swims that way; drag further to dash (it tires you: the
// blue bar). Swim into fish smaller than you to eat them (they glow green); fish bigger than you glow red, and the hunters among
// them come for you: a red mark at the edge of the screen and a growl warn you first. Eating fills the bar at the top: full,
// and you grow, and what chased you a minute ago becomes lunch. Hunger runs down all the time, so you cannot hide. A golden fish
// is worth three and often swims near a hunter: worth the risk? Every kind you eat goes into your aquarium. Grow to the size
// the level asks for to win it. Coins buy upgrades that stay.
// World: metres on the sea's plane: x across, z down the screen; the shark swims in a round bay of radius 70.
const RULES = [
  '<b>Drag</b> anywhere: the shark swims that way. <b>Drag further</b> to dash (it tires you).',
  'Eat fish <b>smaller</b> than you (they glow green). Fill the bar and you <b>grow</b>.',
  'Fish <b>bigger</b> than you glow red. Hunters come for you: a red mark at the edge warns you first. Dash away!',
  'You get hungry all the time. A <b>golden fish</b> is worth three, but it likes to swim near hunters.',
  'Grow to the size the level asks for, then catch <b>the big one</b> (the gold crown). Every kind you eat goes in your <b>aquarium</b>.',
];
const SIZES = [0.9, 1.3, 1.8, 2.5, 3.4, 4.6, 6.0, 7.8, 10];      // the shark's length at each size
const SPECIES = {
  sardine: { name: 'Sardine', size: 0.35, spd: 3.8, kind: 'school', col: 0xb8c8d8, col2: 0x5a7a9a, val: 1 },
  clown: { name: 'Clownfish', size: 0.42, spd: 2.2, kind: 'wander', col: 0xff7a2a, col2: 0xffffff, val: 1 },
  tang: { name: 'Blue tang', size: 0.5, spd: 2.8, kind: 'wander', col: 0x2a6aff, col2: 0xffd83a, val: 1 },
  jelly: { name: 'Jellyfish', size: 0.6, spd: 0.6, kind: 'jelly', col: 0xf0a0ff, col2: 0xffffff, val: 0 },
  mackerel: { name: 'Mackerel', size: 0.7, spd: 5.2, kind: 'dart', col: 0x6a9aa8, col2: 0x2a3a4a, val: 2 },
  puffer: { name: 'Pufferfish', size: 0.75, spd: 1.6, kind: 'puffer', col: 0xe8d070, col2: 0x8a6a2a, val: 2 },
  gold: { name: 'Golden fish', size: 0.6, spd: 4.0, kind: 'dart', col: 0xffd030, col2: 0xffffff, val: 3, gold: true },
  barracuda: { name: 'Barracuda', size: 1.6, spd: 4.6, kind: 'hunter', col: 0x9aa8b0, col2: 0x3a4a5a, val: 3 },
  turtle: { name: 'Sea turtle', size: 1.5, spd: 1.4, kind: 'wander', col: 0x6a8a3a, col2: 0x9a8a5a, val: 3 },
  tuna: { name: 'Tuna', size: 2.0, spd: 5.6, kind: 'dart', col: 0x2a3a6a, col2: 0xc8d0e0, val: 4 },
  grouper: { name: 'Grouper', size: 2.6, spd: 2.0, kind: 'wander', col: 0x8a6a4a, col2: 0x5a3a2a, val: 5 },
  moray: { name: 'Moray eel', size: 2.9, spd: 4.4, kind: 'hunter', col: 0x5a7a2a, col2: 0xd8d070, val: 6 },
  swordfish: { name: 'Swordfish', size: 3.6, spd: 6.4, kind: 'dart', col: 0x3a5a8a, col2: 0xe0e8f0, val: 7 },
  tiger: { name: 'Tiger shark', size: 4.4, spd: 5.0, kind: 'hunter', col: 0x6a7a8a, col2: 0x3a4a5a, val: 9 },
  orca: { name: 'Orca', size: 6.5, spd: 5.6, kind: 'hunter', col: 0x111418, col2: 0xffffff, val: 14 },
  squid: { name: 'Giant squid', size: 8.5, spd: 4.8, kind: 'hunter', col: 0xc84a3a, col2: 0xffa080, val: 18 },
};
const ORDER = Object.keys(SPECIES);
const PLACES = [{ name: 'The reef', fog: 0x0e6a8a, sea: 0x1a8ab0, sand: 0xe8d8a8 }, { name: 'The kelp forest', fog: 0x0e5a4a, sea: 0x1a7a6a, sand: 0xa8a070 }, { name: 'The open ocean', fog: 0x0a3a6a, sea: 0x1a5a9a, sand: 0x8a9aa8 }, { name: 'The deep', fog: 0x061226, sea: 0x0a2040, sand: 0x3a4050 }];
const placeOf = N => Math.floor((N - 1) / 5) % 4;
const UPGRADES = [
  { id: 'fins', name: 'Bigger fins', desc: 'You swim and dash faster.', max: 3, cost: l => 20 + l * 25 },
  { id: 'jaws', name: 'Wide jaws', desc: 'You bite from a little further.', max: 2, cost: l => 25 + l * 30 },
  { id: 'gills', name: 'Strong gills', desc: 'Dashing tires you less.', max: 3, cost: l => 20 + l * 25 },
  { id: 'belly', name: 'Big belly', desc: 'You get hungry more slowly.', max: 2, cost: l => 25 + l * 30 },
  { id: 'sense', name: 'Shark sense', desc: 'Hunters show up on the edge of the screen sooner.', max: 2, cost: l => 20 + l * 25 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Pup'], [40, 'Reef shark'], [130, 'Hunter'], [320, 'Great white'], [700, 'Apex'], [1500, 'Legend of the deep']];
// 25 Nov 2026, later (his words: "Not engaging enough perhaps make the field of play bigger. Make it more challenging and engaging"). The sea was one
// small round bay (28 m) with the same fish swimming in round him wherever he was: nowhere to go, nothing to find, no reason to move. Looked up (not
// played): the shark games people stay with give a big map of different places to learn, things hidden in it to find, and feeding you have to go
// after (trueachievements.com's Hungry Shark Evolution walkthrough: sunken treasure all over the map, enemies in the tunnels between the open areas;
// bluestacks.com's Hungry Shark World guides: "map out your routes", prey "at the same approximate locations", schools eaten whole).
// So THE SEA HAS PLACES now, five times the size, always in the same spots so he learns it:
//   THE CORAL (the middle, where he starts): small fish, safe.          THE KELP BEDS: schools, thick: a frenzy waiting.
//   THE WRECK: a treasure chest, and from level 2 a hunter that guards it.    THE JELLY GARDEN: jellyfish everywhere, golden fish among them, a chest.
//   THE DROP: the biggest fish he can eat (worth most), a chest, a hunter.
// Fish are thick at a place and thin in the open water between; and a place is FISHED OUT after a good meal (it fills again in a while), so he
// has to move on, across open water, hungry. All three chests found: a feeding frenzy. A round map in the corner shows the places.
const R_BAY = 64, LOCAL = 18, OPEN = 14;      // OPEN was 4: the way between two places was a hungry desert (the robot starved on it; so would he, who had already said the shark gets hungry too quickly). The open sea feeds a shark that keeps moving; the places are half as rich again, and have what the open sea has not (schools, gold, chests, the big fish of the drop)
const SPOT = { reef: { name: 'THE CORAL', icon: '🐠', col: '#ff9a6a' }, kelp: { name: 'THE KELP BEDS', icon: '🌿', col: '#7ad06a' }, wreck: { name: 'THE WRECK', icon: '⚓', col: '#d8b070' }, jelly: { name: 'THE JELLY GARDEN', icon: '✨', col: '#d090ff' }, deep: { name: 'THE DROP', icon: '🌀', col: '#6aa8ff' } };
const SPOTS0 = [{ k: 'reef', x: 0, z: 0, r: 13 }, { k: 'kelp', x: 34, z: -30, r: 13 }, { k: 'wreck', x: 38, z: 28, r: 12, cx: 3.2, cz: -1.5 }, { k: 'jelly', x: -40, z: -22, r: 13, cx: 0, cz: 0 }, { k: 'deep', x: -30, z: 38, r: 13, cx: 0, cz: 0 }];
const makeSpots = c => SPOTS0.map(q => ({ k: q.k, x: q.x, z: q.z, r: q.r, found: q.k === 'reef', stock: q.k === 'reef' ? Math.round(c.stock * 0.75) : c.stock, out: 0, chest: q.cx != null ? { x: q.x + q.cx, z: q.z + q.cz, got: false } : null }));
const bayOf = G => G.lesson ? 28 : R_BAY;      // the lessons keep to the small water round the coral (a fish that runs must not have the whole sea to run in)
const spotAt = (G, x, z) => { for (const q of G.spots) if (Math.hypot(x - q.x, z - q.z) < q.r + 3) return q; return null; };

function makeCfg(N, help) {
  const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), e = easyOf(N);
  return { N, f, help: !!help, place: placeOf(N),
    goal: Math.min(6, 3 + Math.floor(N / 8)),      // the size to reach: 3 at level 1 ... up to the biggest
    hunters: x(0, 3.6, 30), huntSpd: x(0.72, 0.86, 30), notice: x(1.1, 0.6, 30), hunger: x(0.024, 0.03, 30) * (1 - 0.2 * upLv('belly')) * (help ? 0.8 : 1),      /* 25 Nov 2026, his words: "The shark gets hungry too quickly": full to empty took 17 s (a fish every 2 s just to stand still); now about 40 s */
    stock: Math.round(x(24, 30, 30)), restock: x(26, 20, 30), prey: x(80, 70, 40), flee: x(1.0, 1.25, 30), dodge: x(4.5, 5.2, 30), jelly: N >= 3 ? x(2, 5, 30) : 0, jellyNear: x(7, 9, 30), sting: x(0.17, 0.2, 30), biteCost: x(0.34, 0.46, 30), gold: 2,
    spd: 1 + 0.08 * upLv('fins') + (help ? 0.05 : 0), dashCost: 0.16 * (1 - 0.15 * upLv('gills')), reach: 1 + 0.15 * upLv('jaws'), sense: 1 + 0.25 * upLv('sense') + e * 0.3 };
}
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null,
    place: cfg.place, me: { x: 0, z: 0, vx: 0, vz: 2, face: Math.PI / 2, tier: 0, fill: 0, hunger: 0.85, dash: 1, mouth: 0, stung: 0, dashing: false, inv: 0 }, fish: [], stick: { x: 0, z: 0 },
    eaten: {}, eatenN: 0, coins: 0, near: 0, starve: 0, hunted: 0, escapes: 0, best: 0, combo: 0, comboT: 0, frenzy: 0, frenzies: 0, bitten: 0, chests: 0, spots: makeSpots(cfg) };
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else { G.ev.push({ k: 'start' }); populate(G); }
  return G;
}
// 25 Nov 2026, his words: "when the shark eats make it physically bigger". He grew only when the bar filled (a step every 8 to 30 fish). Now every
// bite makes him a little longer: his length runs smoothly from this size to the next as the bar fills, and what he can eat grows with it.
const needOf = G => 12 + 5 * G.me.tier, sizeOf = G => { const t = G.me.tier, a = SIZES[t], b = SIZES[Math.min(SIZES.length - 1, t + 1)]; return a + (b - a) * Math.min(1, G.me.fill / needOf(G)); };
// A FEEDING FRENZY (25 Nov 2026, "this game is not engaging"): fish eaten one soon after another make a chain (CHAIN_T seconds to the next; a jellyfish's sting breaks it, and ends a frenzy); CHAIN_N in
// a chain and the frenzy starts: FRENZY seconds in which he is faster, dashing costs nothing, the fish cannot dart aside, every fish counts double
// and the hunters keep clear. So a school is worth going after whole, and a hunter's patch is worth a raid.
const CHAIN_T = 2.5, CHAIN_N = 6, FRENZY = 6;
// how much sea the screen shows across (it was 5 + 2.6 x his length: he was a tenth of the screen and the fish were specks; now he is about a fifth of it at every size)
const viewOf = G => 1.0 + 3.6 * sizeOf(G);
// the next kind he is not yet big enough to eat: a near goal always on the screen
function nextPrey(G) { const s = sizeOf(G); let best = null; for (const k of ORDER) { const sp = SPECIES[k]; if (!(sp.val > 0) || sp.gold) continue; if (sp.size * 1.1 >= s * 0.85 && (!best || sp.size < SPECIES[best].size)) best = k; } return best; }
// which kinds swim here: those near your size, a few smaller, hunters a size or two above
function pool(G) { const s = sizeOf(G), N = G.N; return ORDER.filter(k => { const sp = SPECIES[k]; if (sp.kind === 'jelly') return false; if (sp.gold) return false; if (sp.kind === 'hunter') return sp.size > s * 0.6 && sp.size < s * 3.2 && N >= 2; return sp.size > s * 0.15 && sp.size < s * 2.2; }); }
function spawn(G, kind, near) {
  const R = G.rnd, sp = SPECIES[kind], m = G.me; let x, z, tries = 0;
  const vw = viewOf(G); do { const a = R() * TAU, r = near ? (near === 3 ? vw * (0.4 + R() * 0.75) : near === 2 ? vw * (1.25 + R() * 0.5) : Math.max(12, vw * 1.4) + R() * 10) : 5 + R() * (bayOf(G) - 7); x = (near ? m.x : 0) + Math.cos(a) * r; z = (near ? m.z : 0) + Math.sin(a) * r; } while ((Math.hypot(x, z) > bayOf(G) - 4 || Math.hypot(x - m.x, z - m.z) < (sp.kind === 'hunter' ? Math.max(12, vw * 1.3) : kind === 'jelly' ? Math.min(12, vw * (near === 3 ? 0.45 : 1.2)) : Math.min(4, vw * 0.9))) && tries++ < 30);
  const f = { kind, sp, x, z, h: R() * TAU, v: sp.spd * 0.5, wob: R() * 10, state: 'calm', t: 0, puff: 0, size: sp.size * (0.9 + R() * 0.2), id: G.fishId = (G.fishId || 0) + 1 };
  G.fish.push(f); return f;
}
function populate(G) {
  const c = G.cfg, R = G.rnd, pl = pool(G).filter(k => SPECIES[k].kind !== 'hunter');
  G.fish.length = 0; for (let i = 0; i < c.prey; i++) { const k = pl[(R() * pl.length) | 0]; if (SPECIES[k].kind === 'school') { const f = spawn(G, k); for (let j = 0; j < 5; j++) { const g = spawn(G, k); g.x = f.x + (R() - 0.5) * 3; g.z = f.z + (R() - 0.5) * 3; g.leader = f; } } else spawn(G, k); }
  { const s = sizeOf(G), near = pl.filter(k => SPECIES[k].size * 1.1 < s * 0.85); if (near.length) for (let i = 0; i < 8; i++) spawn(G, near[(R() * near.length) | 0], 3); for (let i = 0; i < Math.round(c.jellyNear) - 1; i++) { const j = spawn(G, 'jelly', 3); j.size = 0.42 + 0.3 * s; } }      /* something to chase from the first second */
  for (let i = 0; i < huntersNow(G); i++) spawnHunter(G); for (let i = 0; i < Math.round(c.jelly); i++) spawn(G, 'jelly'); for (let i = 0; i < c.gold; i++) spawnGold(G);
}
const huntersNow = G => Math.round(G.cfg.hunters * Math.min(1, (G.me.tier + 1) / 3));      // fewer hunters while you are small
function spawnHunter(G) { const s = sizeOf(G), list = ORDER.filter(k => SPECIES[k].kind === 'hunter' && SPECIES[k].size > s * 1.05); if (!list.length) return null; const f = spawn(G, list[0], true);
  // a hunter keeps a place: the wreck first, then the drop, then the open water between (it comes back to its place when a chase is over)
  // the first hunter of a level hunts HIM, wherever he is (with every hunter at a post the way between the places was safe, and the deep levels easier than in the small sea: measured, 25 Nov); the second and third keep guard at the wreck and the drop; the fourth hunts him too
  { const others = G.fish.filter(h => h !== f && h.sp.kind === 'hunter'), posts = G.spots.filter(q => q.k === 'wreck' || q.k === 'deep'), taken = others.filter(h => h.post).map(h => h.post), free = others.length > taken.length ? posts.find(q => !taken.includes(q)) : null; if (free) { f.post = free; const a = G.rnd() * TAU; f.x = free.x + Math.cos(a) * free.r * 0.6; f.z = free.z + Math.sin(a) * free.r * 0.6; if (Math.hypot(f.x - G.me.x, f.z - G.me.z) < 12) { f.rest = 4; } } }
  return f; }
function spawnGold(G) { const f = spawn(G, 'gold'), jg = G.spots.find(q => q.k === 'jelly'), a = G.rnd() * TAU, r = G.rnd() * jg.r * 0.7; f.x = jg.x + Math.cos(a) * r; f.z = jg.z + Math.sin(a) * r; f.post = jg; return f; }      // the golden fish live in the jelly garden: worth five, if you can thread the jellyfish      // the golden fish keeps company with a hunter
// THE BIG ONE (25 Nov 2026): growing to the size the level asks for does not end it. A big fish swims in, the biggest he can now eat, marked in gold;
// it keeps out of his way and darts aside like the rest. Catch it and the level is won. (A level has an end you play for; and a thumb that does not
// look, however lucky with its feeding, does not run down a fish that runs.)
function spawnPrize(G) { const m = G.me, s = SIZES[m.tier];      /* his size at this tier with nothing more eaten: a jellyfish's sting on the way (it costs a little of what he has grown) must never make the big one too big to eat when he gets there */ let k = null; for (const q of ORDER) { const sp = SPECIES[q]; if (!(sp.val > 0) || sp.gold || sp.kind === 'school' || sp.kind === 'puffer') continue; if (sp.size * 1.08 < s * 0.85 && (!k || sp.size > SPECIES[k].size)) k = q; } if (!k) k = 'tang';
  const f = spawn(G, k, 2); f.prize = true; f.size = Math.min(SPECIES[k].size * 1.08, s * 0.84); f.sp = Object.assign({}, f.sp, { spd: (3.2 + 1.6 * Math.sqrt(s)) * G.cfg.spd * 0.62, kind: 'dart', val: Math.max(3, f.sp.val) }); f.leader = null;
  // 25 Nov 2026 (his words: "make the field of play bigger. Make it more challenging and engaging"): a bigger sea nobody has to cross is scenery. The big one
  // no longer swims in beside him: it waits at ANOTHER place (the nearest one a fair swim away, never the jelly garden), its crown on the map and a gold
  // marker at the edge of the screen. The end of every level is a crossing, with the food bar running down.
  // From level 6 it waits where a hunter keeps guard (the wreck, the drop), if one does: the crossing ends in a theft under a hunter's nose.
  if (!G.lesson) { let to = null, bd = 1e9, far = null, fd2 = 0; const guarded = G.N >= 6 ? G.fish.filter(h => h.sp.kind === 'hunter' && h.post).map(h => h.post) : []; for (const q of G.spots) { if (q.k === 'jelly') continue; const d = Math.hypot(q.x - m.x, q.z - m.z), dd = d - (guarded.includes(q) ? 60 : 0); if (d >= 28 && dd < bd) { bd = dd; to = q; } if (d > fd2) { fd2 = d; far = q; } } to = to || far; const a = G.rnd() * TAU; f.x = to.x + Math.cos(a) * 3; f.z = to.z + Math.sin(a) * 3; f.home = to; f.met = false; }
  return f; }
const edible = (G, f) => f.sp.val > 0 && f.size < sizeOf(G) * 0.85 && !(f.kind === 'puffer' && f.puff > 0.5);
const danger = (G, f) => f.sp.kind === 'hunter' && f.size > sizeOf(G) * 1.05;
// ---------- your thumb ----------
function setStick(G, x, z) { const L = Math.hypot(x, z); G.stick = L > 1 ? { x: x / L, z: z / L } : { x, z }; }
// ---------- the sea, step by step ----------
function step(G, dt) {
  if (G.over) return; G.t += dt; const c = G.cfg, m = G.me, R = G.rnd, s = sizeOf(G);
  if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0 && G.lessonEnd) { G.lessonEnd = false; Object.assign(m, { x: 0, z: 0, vx: 0, vz: 2, tier: 0, fill: 0, hunger: 0.85, dash: 1 }); G.eaten = {}; G.eatenN = 0; G.coins = 0; populate(G); G.ev.push({ k: 'start' }); } return; }
  // the shark: cruise or dash, turning with weight
  if (G.comboT > 0) { G.comboT -= dt; if (G.comboT <= 0) G.combo = 0; } const fz = G.frenzy > 0; if (fz) { G.frenzy -= dt; if (G.frenzy <= 0) { G.frenzy = 0; G.ev.push({ k: 'frenzyend' }); } } if (m.inv > 0) m.inv -= dt;
  const st = G.stick, L = Math.hypot(st.x, st.z), dashing = L > 0.92 && m.dash > 0.05 && m.stung <= 0, base = (3.2 + 1.6 * Math.sqrt(s)) * c.spd * (fz ? 1.22 : 1), starving = m.hunger <= 0;
  let vd = L < 0.12 ? base * 0.35 : base * (dashing ? 1.75 : Math.min(1, L * 1.15)) * (starving ? 0.6 : 1) * (m.stung > 0 ? 0.4 : 1);
  let v = Math.hypot(m.vx, m.vz), h = v > 0.1 ? Math.atan2(m.vz, m.vx) : m.face; const hd = L > 0.12 ? Math.atan2(st.z, st.x) : h, da = Math.atan2(Math.sin(hd - h), Math.cos(hd - h));
  const turn = 5.5 / (1 + 0.15 * v); h += clamp(da, -turn * dt, turn * dt); v += clamp(vd - v, -8 * dt, (dashing ? 14 : 7) * dt);
  m.vx = Math.cos(h) * v; m.vz = Math.sin(h) * v; m.x += m.vx * dt; m.z += m.vz * dt; m.face = h; m.turn = clamp(da, -1, 1); m.dashing = dashing;
  const rr = Math.hypot(m.x, m.z), bay = bayOf(G); if (rr > bay) { m.x *= bay / rr; m.z *= bay / rr; }
  m.dash = clamp(m.dash + (dashing ? (fz ? 0 : -c.dashCost) : 0.09) * dt, 0, 1); if (m.stung > 0) m.stung -= dt; if (m.mouth > 0) m.mouth -= dt;
  if (!G.lesson || G.lesson.hungry) { m.hunger = clamp(m.hunger - c.hunger * (dashing ? 1.25 : 1) * dt, 0, 1); }
  if (starving) { G.starve += dt; if (G.starve > 8) return finish(G, false, 'starved'); } else G.starve = 0;
  // the fish
  const mx = m.x + Math.cos(h) * s * 0.5, mz = m.z + Math.sin(h) * s * 0.5, reach = (0.26 + 0.27 * s) * c.reach;      /* the bite: what is right at his jaws (it was a metre-wide scoop: with fish all round him he fed without aiming) */
  let hunted = 0; const vwS = viewOf(G);
  for (let i = G.fish.length - 1; i >= 0; i--) { const f = G.fish[i], sp = f.sp, dx = m.x - f.x, dz = m.z - f.z, d = Math.hypot(dx, dz); f.t += dt; f.wob += dt;
    let th = f.h, sv = sp.spd * 0.45;
    if (sp.kind === 'hunter' && danger(G, f)) {
      const sense = 8 + f.size * 1.5 + s * 1.5;      // a little shark is hard to spot
      if (f.rest > 0) f.rest -= dt;
      if (fz && f.state !== 'calm') { f.state = 'calm'; f.t = 0; f.h = Math.atan2(-dz, -dx); f.rest = 3; }      /* in a frenzy the hunters keep clear */
      if (f.state === 'calm' && d < sense && !(f.rest > 0) && !G.lessonNoHunt && !fz) { f.state = 'notice'; f.t = 0; G.ev.push({ k: 'notice', id: f.id }); }
      if (f.state === 'notice') { th = Math.atan2(dz, dx); sv = 0.6; if (f.t > c.notice) { f.state = 'hunt'; f.t = 0; G.ev.push({ k: 'hunt' }); } }
      else if (f.state === 'hunt') { const lead = Math.min(0.6, d / 12); th = Math.atan2(m.z + m.vz * lead - f.z, m.x + m.vx * lead - f.x); sv = base * 1.75 * c.huntSpd * clamp(0.8 + 0.2 * (f.size / s - 1), 0.8, 1);      // one only a little bigger than you is a little slower hunted++;
        if (f.t > 4.5 || d > sense * 2.2) { f.state = 'calm'; f.t = 0; f.h += Math.PI; f.rest = 6; G.escapes++; G.ev.push({ k: 'escaped' }); lessonSee(G, 'escape'); }
        const bx = f.x + Math.cos(f.h) * f.size * 0.5, bz = f.z + Math.sin(f.h) * f.size * 0.5; if (Math.hypot(bx - m.x, bz - m.z) < 0.35 + f.size * 0.18 + s * 0.15) { if (G.lesson) { G.ev.push({ k: 'caught', lesson: true }); lessonMiss(G); return; }
          // 25 Nov 2026: a hunter's bite was the end at once. Now it takes a bite OUT of him (a big piece of the food bar, a knock, a moment when nothing
          // can touch him) and swims off to come round again; it is the end only when the bar is empty
          if (!(m.inv > 0)) { m.hunger -= c.biteCost; G.bitten++; m.inv = 1.8; m.stung = 0.35; m.vx += Math.cos(f.h) * 7; m.vz += Math.sin(f.h) * 7; f.state = 'calm'; f.t = 0; f.h += Math.PI; f.rest = 3.5; G.combo = 0; G.comboT = 0;
            if (m.hunger <= 0) { m.hunger = 0; G.ev.push({ k: 'caught' }); return finish(G, false, 'eaten', f.kind); } G.ev.push({ k: 'bitten', by: f.kind }); } } }
      else { th = f.h + Math.sin(f.wob * 0.7) * 0.6 * dt * 10; if (f.post && Math.hypot(f.x - f.post.x, f.z - f.post.z) > f.post.r * 0.8) { th = Math.atan2(f.post.z - f.z, f.post.x - f.x); sv = sp.spd * 0.7; } }
    } else if (sp.kind === 'jelly') { th = f.h + Math.sin(f.wob * 0.3) * 0.3; sv = sp.spd; if (!G.lesson && d < vwS * 1.0) { th = Math.atan2(dz, dx) + Math.sin(f.wob * 0.7 + f.id) * 0.5; sv = 0.55 + 0.32 * Math.sqrt(s); }      /* a jellyfish near him drifts his way, slowly: a shark that stays where it is gets stung; one that swims leaves them behind */ if (d < f.size * 0.55 + s * 0.3 && m.stung <= 0 && !(m.inv > 0)) { if (fz) { G.frenzy = 0; G.ev.push({ k: 'frenzyend' }); }      /* even in a frenzy: and it ends the frenzy */ m.stung = 0.8; m.inv = 1.3; m.hunger = Math.max(0, m.hunger - c.sting); m.fill = Math.max(0, m.fill - needOf(G) * 0.25); G.combo = 0; G.comboT = 0; G.stings = (G.stings || 0) + 1; G.ev.push({ k: 'sting' });      /* a sting costs food and a little of what he has grown: every bite makes him bigger, every sting a little smaller */ lessonSee(G, 'sting'); } }
    else {      // prey: wander, school, dart; flee a shark that is bigger
      if (sp.kind === 'school' && f.leader && G.fish.includes(f.leader)) { th = Math.atan2(f.leader.z + Math.sin(f.id) * 1.2 - f.z, f.leader.x + Math.cos(f.id) * 1.2 - f.x); sv = f.leader.v * 1.1 + Math.max(0, Math.hypot(f.leader.x - f.x, f.leader.z - f.z) - 2); }
      else th = f.h + Math.sin(f.wob * 0.9 + f.id) * 0.9 * dt * 6;
      if (f.home && G.fish.includes(f.home)) { const hx = f.home.x - f.x, hz = f.home.z - f.z; if (Math.hypot(hx, hz) > 6) th = Math.atan2(hz, hx); }
      if (f.post && !f.fleeing && !(f.dodge > 0) && Math.hypot(f.x - f.post.x, f.z - f.post.z) > f.post.r * 0.75) th = Math.atan2(f.post.z - f.z, f.post.x - f.x);
      if (sp.kind === 'school' && d < Math.min(6 + s * 1.5, vwS * 1.0)) { const ld = f.leader && G.fish.includes(f.leader) ? f.leader : f; if (!ld.fleeing && R() < 3 * dt) { ld.fleeing = true; } }      // a school feels you coming and turns as one
      if (sp.kind === 'puffer') f.puff = clamp(f.puff + (d < 4 + s ? 2 : -1) * dt, 0, 1);
      if (edible(G, f) && d < Math.min(5 + s * 1.5, vwS * 0.85) && (sp.gold || R() < c.flee * 2 * dt + (f.fleeing ? 1 : 0))) { f.fleeing = true; }      /* 25 Nov 2026: they ran from 6 m, before they were even on the screen; now they run when you can see them go */      // a golden fish always runs: you have to want it
      // a fish you swim straight at darts aside at the last moment: steer after it (a straight line misses)
      if (edible(G, f) && !f.dodge && !fz && d < Math.min(2.4 + s * 1.2, vwS * 0.5) && d > 0.3) { const dot = -(dx * Math.cos(h) + dz * Math.sin(h)) / d; if ((dot > 0.75 || sp.kind === 'school') && R() < (G.lesson ? c.dodge * (sp.kind === 'school' ? 1.6 : 1) : 30) * dt) {      /* outside the lesson every fish you swim straight at darts aside, once: turn after it and it is yours (it cannot dart again for a moment). In a frenzy none of them can. */ f.dodge = 0.45; f.dh = Math.atan2(-dz, -dx) + (R() < 0.5 ? 1.3 : -1.3); G.ev.push({ k: 'dodge' }); } }
      if (f.dodge > 0) { f.dodge -= dt; th = f.dh; sv = sp.spd * 1.6; if (f.dodge <= 0) f.dodge = -1.2; } else if (f.dodge < 0) f.dodge = Math.min(0, f.dodge + dt);
      if (f.fleeing && !(f.dodge > 0)) { const side = Math.sin(Math.atan2(-dz, -dx) - h) >= 0 ? 1 : -1; th = Math.atan2(-dz, -dx) + side * 0.95 + Math.sin(f.wob * 3) * 0.3; sv = sp.spd * (sp.kind === 'dart' ? 1 : 0.8);      /* they run OUT of his path, to the side they are already on (straight away from a faster shark is straight into his mouth): he has to steer after them */ if (d > Math.min(12 + s * 2, vwS * 2)) f.fleeing = false; }
      if (f.prize && f.home && !f.met) { if (d < vwS * 1.2) { f.met = true; G.ev.push({ k: 'met' }); } else { f.fleeing = false; const hx = f.home.x - f.x, hz = f.home.z - f.z; if (Math.hypot(hx, hz) > 5) th = Math.atan2(hz, hx); sv = sp.spd * 0.35; } }      /* until he has come to it, it idles at its place */
      else if (f.prize && !f.fleeing && !(f.dodge > 0) && d > vwS * 1.3) { th = Math.atan2(dz, dx); sv = sp.spd * 0.6; }      /* once met, the big one never goes far: it comes back to where he can see it */
    }
    if (f.leave != null) { if (d > vwS * 2.1) { G.fish.splice(i, 1); continue; } th = f.leave; sv = sp.spd * 1.25; }      /* its place is fished out: it makes off, and is gone once out of sight */
    // stay in the bay
    const fr = Math.hypot(f.x, f.z); if (fr > bayOf(G) - 3) th = Math.atan2(-f.z, -f.x);
    const df = Math.atan2(Math.sin(th - f.h), Math.cos(th - f.h)); const tr = f.dodge > 0 ? 12 : 4; f.h += clamp(df, -tr * dt, tr * dt); f.v += clamp(sv - f.v, -(f.dodge > 0 ? 14 : 6) * dt, (f.dodge > 0 ? 14 : 6) * dt); f.x += Math.cos(f.h) * f.v * dt; f.z += Math.sin(f.h) * f.v * dt;
    // the bite
    if (edible(G, f) && Math.hypot(f.x - mx, f.z - mz) < reach + f.size * 0.4) { eat(G, f); G.fish.splice(i, 1); if (G.over) return; continue; }
    if (f.kind === 'puffer' && f.puff > 0.5 && Math.hypot(f.x - mx, f.z - mz) < reach + f.size * 0.6 && m.stung <= 0) { m.stung = 0.6; G.ev.push({ k: 'spike' }); }
  }
  G.hunted = hunted;
  // the sea fills up again out of sight
  if (!G.lesson) { const isPrey = f => f.sp.kind !== 'hunter' && f.sp.kind !== 'jelly' && !f.sp.gold, prey = G.fish.filter(isPrey).length; if (prey < c.prey * 0.8 && R() < dt * 4) { const pl = pool(G).filter(k => SPECIES[k].kind !== 'hunter'); spawn(G, pl[(R() * pl.length) | 0], true); }
    // 25 Nov 2026 ("not engaging": most of the time there was nothing on the screen to eat): there is always something to chase round him. Fewer than
    // LOCAL fish he can eat within two screens: one more swims in from just off the screen; the sea's far side gives one up so the count holds
    { const vw = viewOf(G), here = spotAt(G, m.x, m.z), fed = here && !(here.out > 0), want = fed ? (here.k === 'kelp' ? LOCAL + 8 : here.k === 'jelly' ? 8 : LOCAL) : OPEN, jw = Math.round(c.jellyNear * (here && here.k === 'jelly' ? 2.1 : fed ? 0.8 : 0.45));      /* a fished-out place is as thin of jellyfish as the open sea: nothing to eat AND a ring of stings round him was a trap, not a challenge (the robot starved in it, 25 Nov) */ let nearN = 0, far = -1, fd = 0; for (let i = 0; i < G.fish.length; i++) { const f = G.fish[i]; if (!isPrey(f)) continue; const d = Math.hypot(f.x - m.x, f.z - m.z); if (d < vw * 1.9 && edible(G, f)) nearN++; else if (d > fd && d > vw * 3 && !f.prize) { fd = d; far = i; } }
      // 25 Nov 2026: with fish all round him, a thumb that did not look fed and won. Jellyfish drift among the fish now (their size keeps pace with
      // his): each one touched stings (a piece of the food bar, a slow second, the chain broken). Looking, you weave round them; not looking, you starve.
      { let jn = 0, jfar = -1, jd = 0; for (let i = 0; i < G.fish.length; i++) { const f = G.fish[i]; if (f.sp.kind !== 'jelly') continue; const d = Math.hypot(f.x - m.x, f.z - m.z); if (d < vw * 1.9) jn++; else if (d > jd && d > vw * 3) { jd = d; jfar = i; } }
        if (jn < jw && R() < dt * 3) { if (jfar >= 0) G.fish.splice(jfar, 1); const j = spawn(G, 'jelly', 2); j.size = 0.42 + 0.3 * s; } }
      if (nearN < want && R() < dt * 5) { let pl = pool(G).filter(k => SPECIES[k].kind !== 'hunter' && SPECIES[k].size * 1.1 < s * 0.85);
        if (fed && here.k === 'kelp') { const sc = pl.filter(k => SPECIES[k].kind === 'school'); if (sc.length) pl = sc; }      /* the forest: schools */
        if (fed && here.k === 'deep' && pl.length > 2) pl = pl.slice().sort((a, b) => SPECIES[b].size - SPECIES[a].size).slice(0, 2);      /* the drop: the biggest he can eat */
        if (pl.length) { if (prey >= c.prey && far >= 0) G.fish.splice(far, 1); const k = pl[(R() * pl.length) | 0], f = spawn(G, k, 2); if (SPECIES[k].kind === 'school') for (let j = 0; j < 4; j++) { const g = spawn(G, k, 2); g.x = f.x + (R() - 0.5) * 2.5; g.z = f.z + (R() - 0.5) * 2.5; g.leader = f; } } } }
    const hn = G.fish.filter(f => danger(G, f)).length; if (hn < huntersNow(G) && R() < dt * 0.3) spawnHunter(G);
    if (!G.fish.some(f => f.sp.gold) && R() < dt * 0.05) spawnGold(G); }
  if (!G.lesson) for (const q of G.spots) { const d = Math.hypot(m.x - q.x, m.z - q.z);
    if (!q.found && d < q.r) { q.found = true; G.coins += 2; G.ev.push({ k: 'found', spot: q.k }); }
    if (q.out > 0) { q.out -= dt; if (q.out <= 0) { q.out = 0; q.stock = c.stock; G.ev.push({ k: 'restock', spot: q.k }); } }
    const ch = q.chest; if (ch && !ch.got && Math.hypot(m.x - ch.x, m.z - ch.z) < 1.1 + s * 0.45) { ch.got = true; G.chests++; G.coins += 5 + m.tier * 2; m.hunger = clamp(m.hunger + 0.35, 0, 1); m.fill += needOf(G) * 0.12; G.ev.push({ k: 'chest', spot: q.k, x: ch.x, z: ch.z, n: G.chests });
      if (G.chests >= G.spots.filter(o => o.chest).length) { G.frenzy = FRENZY * 1.5; G.frenzies++; G.combo = 0; G.comboT = 0; G.ev.push({ k: 'treasure' }); G.ev.push({ k: 'frenzy' }); } grow(G); if (G.over) return; } }
  if (G.lesson) lessonTick(G, dt);
}
function grow(G) { const m = G.me;
  while (m.fill >= needOf(G) && m.tier < SIZES.length - 1) { m.fill -= needOf(G); m.tier++; G.best = Math.max(G.best, m.tier); G.ev.push({ k: 'grow', tier: m.tier }); if (!G.lesson && m.tier + 1 >= G.cfg.goal && !G.ready) { G.ready = true; const pz = spawnPrize(G); G.ev.push({ k: 'ready', spot: pz.home ? pz.home.k : null }); } } }
function eat(G, f) {
  const m = G.me, v = f.sp.val, fz = G.frenzy > 0; m.mouth = 0.25; m.fill += v * (fz ? 2 : 1); m.hunger = clamp(m.hunger + v * 0.12, 0, 1); G.coins += f.sp.gold ? 5 : Math.ceil(v / 2);
  if (!G.lesson && !fz) { G.combo = (G.comboT > 0 ? G.combo : 0) + 1; G.comboT = CHAIN_T; if (G.combo >= CHAIN_N) { G.combo = 0; G.comboT = 0; G.frenzy = FRENZY; G.frenzies++; G.ev.push({ k: 'frenzy' }); } }
  for (const q of G.fish) if (q !== f && q.kind === f.kind && Math.hypot(q.x - f.x, q.z - f.z) < 5) { q.dodge = 0.6; q.dh = Math.atan2(q.z - m.z, q.x - m.x) + (G.rnd() - 0.5) * 1.2; q.fleeing = true; }      // the rest of the school scatters
  const isNew = !G.eaten[f.kind]; G.eaten[f.kind] = (G.eaten[f.kind] || 0) + 1; G.eatenN++;
  G.ev.push({ k: 'eat', kind: f.kind, val: v, gold: !!f.sp.gold, x: f.x, z: f.z, isNew, wasHunter: f.sp.kind === 'hunter', chain: G.combo, frenzy: fz }); lessonSee(G, f.sp.gold ? 'gold' : 'eat');
  // the place he is feeding at runs low: fished out, the rest of its fish make off, and it fills again in a while. Time to move on.
  if (!G.lesson && !f.prize) { const here = spotAt(G, m.x, m.z); if (here && !(here.out > 0) && --here.stock <= 0) { here.out = G.cfg.restock; G.ev.push({ k: 'fishedout', spot: here.k });
      for (const q of G.fish) if (q !== f && q.sp.kind !== 'hunter' && q.sp.kind !== 'jelly' && !q.sp.gold && !q.prize && Math.hypot(q.x - here.x, q.z - here.z) < here.r + 8) { q.leave = Math.atan2(q.z - here.z, q.x - here.x) + (G.rnd() - 0.5); q.fleeing = false; } } }
  grow(G);
  if (f.prize) { G.ev.push({ k: 'prize' }); return finish(G, true); }
}
function finish(G, win, why, by) {
  const m = G.me; G.over = win ? 'won' : 'lost'; const stars = win ? (G.t < 70 + G.N * 4 && m.hunger > 0.5 ? 3 : G.t < 110 + G.N * 6 ? 2 : 1) : 0;
  G.res = { win, why, by, stars, tier: m.tier, goal: G.cfg.goal, fill: m.fill, need: needOf(G), eaten: G.eaten, eatenN: G.eatenN, coins: G.coins + (win ? 4 + Math.ceil(G.N / 3) : 0), time: G.t };
  G.ev.push({ k: win ? 'won' : 'lost', why }); return true;
}
// ---------- LESSONS ----------
const AIMCARD = {"pic": "🦈", "win": "EAT FISH, GROW BIG", "lose": "STARVE OR GET EATEN", "how": "DRAG TO SWIM INTO SMALL FISH"};      // the aim card: specs/aims.json (tools/aims.py)
const LESSONS = {
  1: [{ id: 'eat', title: 'EAT', say: G => sharkCue(G)[0], do: G => sharkCue(G)[1], at: G => sharkCue(G)[2], how: 'Drag your thumb: the shark swims that way. Swim into the small fish (they glow green). Eat five.', need: 5 }],
  2: [{ id: 'escape', title: 'GET AWAY', say: G => sharkCue(G)[0], do: G => sharkCue(G)[1], at: G => sharkCue(G)[2], how: 'A hunter is coming (the red mark). Drag all the way to the edge to dash away until it gives up.', need: 1 }],
  3: [{ id: 'gold', title: 'THE GOLDEN FISH', say: G => sharkCue(G)[0], do: G => sharkCue(G)[1], at: G => sharkCue(G)[2], how: 'A golden fish is worth three, but it stays near a hunter. Dart in, grab it, dash away.', need: 1 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonSetup(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonSetup(G) { const st = lessonNow(G), m = G.me; G.fish.length = 0; Object.assign(m, { x: 0, z: 0, vx: 0, vz: 1, hunger: 1, dash: 1, stung: 0 });
  if (st.id === 'eat') for (let i = 0; i < 14; i++) { const f = spawn(G, i % 2 ? 'clown' : 'tang'); const a = G.rnd() * TAU, r = 2.5 + G.rnd() * 6; f.x = Math.cos(a) * r; f.z = Math.sin(a) * r; f.v = 0.5; }
  if (st.id === 'escape') { const f = spawn(G, 'barracuda'); f.x = 9; f.z = -6; f.state = 'notice'; f.t = 0; for (let i = 0; i < 8; i++) spawn(G, 'clown'); }
  if (st.id === 'gold') { const h = spawn(G, 'barracuda'); h.x = 12; h.z = -12; const g = spawn(G, 'gold'); g.x = 16; g.z = -9; g.home = h; g.sp = Object.assign({}, g.sp, { spd: 2.6 }); for (let i = 0; i < 8; i++) spawn(G, 'clown'); } }
function lessonTick(G, dt) { const L = G.lesson, st = lessonNow(G); if (!st || st.id !== 'eat' || !L.n) return; L.gap = (L.gap || 0) + dt; if (L.gap > 5) { L.n = 0; L.gap = 0; G.ev.push({ k: 'lessonmiss', how: 'Keep going: five in a row, each soon after the last. Steer after a fish as it darts.' }); } }
function lessonSee(G, what) { const st = lessonNow(G); if (!st) return; if ((st.id === 'eat' && what === 'eat') || (st.id === 'escape' && what === 'escape') || (st.id === 'gold' && what === 'gold')) { G.lesson.n++; G.lesson.gap = 0;
    if (G.lesson.n < st.need) { G.ev.push({ k: 'lessonok', n: G.lesson.n, need: st.need }); return; }
    G.lesson.i++; G.lesson.n = 0; if (G.lesson.i >= G.lesson.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.lessonEnd = true; G.wait = 1.4; } } }
function lessonMiss(G) { const st = lessonNow(G); G.lesson.n = 0; G.ev.push({ k: 'lessonmiss', how: st.how }); lessonSetup(G); }
// ---------- for the robots ----------
// BLIND: a thumb that does not look: drags some way, near or far (a dash), or lets go
const BLIND = { d: G => { const R = Math.random; if (R() < 0.2) setStick(G, 0, 0); else { const a = R() * TAU, L = R() < 0.4 ? 1 : 0.4 + R() * 0.5; setStick(G, Math.cos(a) * L, Math.sin(a) * L); } } };
// a player who looks: runs from a hunter that has noticed him (dashing, away from it), otherwise goes for the best fish he can
// eat (worth over distance, minus the danger near it), and grabs a golden fish if the hunter beside it is not looking
// THE TUTORIAL SAYS WHICH WAY TO SWIM (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing happens"). The hand slid left and
// right (or right) in a box, whatever was on the screen. Now the robot is asked (dryPlan setStick): SWIM THIS WAY (to the green fish, the gold one),
// DRAG ALL THE WAY: DASH! away from a hunter.
const SHC = { t: -1e9, v: null };
function sharkCue(G) { if (G.over || G.wait > 0) return ['WAIT…', 'wait', false]; const now = performance.now(); if (now - SHC.t < 150) return SHC.v; SHC.t = now; const P = dryPlan(G, null, { t: -1, next: -1 }), s2 = ui.stick, x0 = s2 ? s2.x0 : W / 2, y0 = s2 ? s2.y0 : H * 0.7, R = 70 * k; let v = ['STAY STILL', 'wait', false];
  if (P && P[0] === 'setStick') { const m = Math.hypot(P[1], P[2]) || 1, f = Math.min(1, m); v = [f > 0.9 && G.lesson && G.lesson.steps[G.lesson.i].id !== 'eat' ? 'ALL THE WAY: DASH!' : 'SWIM THIS WAY', 'drag', [x0, y0, x0 + P[1] / m * R * Math.max(0.6, f), y0 + P[2] / m * R * Math.max(0.6, f)]]; }
  SHC.v = v; return v; }
function honest(G, o, mem) {
  const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random, m = G.me, s = sizeOf(G);
  if (G.over || G.wait > 0) { ACT.setStick(G, 0, 0); return; }
  if (G.t < (mem.next || 0)) return; mem.next = G.t + 0.05 + react * 0.35;
  let fx = 0, fz = 0, threat = 0;
  for (const f of G.fish) { if (!danger(G, f) && !(f.sp.kind === 'jelly')) continue; const dx = m.x - f.x, dz = m.z - f.z, d = Math.hypot(dx, dz) || 1, w = f.sp.kind === 'jelly' ? (d < 1.4 + f.size + s * 0.7 ? 3.2 / d : 0) : f.state !== 'calm' ? 14 / d : d < 10 ? 4 / d : 0; fx += dx / d * w; fz += dz / d * w; if (f.sp.kind !== 'jelly' && f.state !== 'calm' && d < 18) threat = Math.max(threat, 1); }
  if (R() > acc && threat) { fx *= 0.3; fz *= 0.3; }      // a moment of panic: a thumb is not perfect
  const rr = Math.hypot(m.x, m.z); if (rr > bayOf(G) - 12) { fx -= m.x / rr * 0.8; fz -= m.z / rr * 0.8; }
  if (threat) { ACT.setStick(G, fx * 3, fz * 3); const L = Math.hypot(G.stick.x, G.stick.z); if (L > 0.01) ACT.setStick(G, G.stick.x / L, G.stick.z / L); mem.mode = 'flee'; return; }
  // little to eat here: he reads the map and swims to the nearest place that still has fish (the jelly garden last)
  if (!G.lesson) { const here = spotAt(G, m.x, m.z), fed = here && !(here.out > 0), pzf = G.ready ? G.fish.find(f => f.prize) : null; let nearN = 0, to = null; const vw = viewOf(G); for (const f of G.fish) if (edible(G, f) && f.leave == null && !f.prize && Math.hypot(f.x - m.x, f.z - m.z) < vw * 1.9) nearN++;
    if (m.hunger < 0.35) mem.feed = true; else if (m.hunger > 0.62) mem.feed = false;
    // the big one is across the sea: he swims to its crown on the map, taking what is on the way, and stops to feed properly only when the bar is low
    if (pzf) { if (!mem.feed && Math.hypot(pzf.x - m.x, pzf.z - m.z) > 11) to = { x: pzf.x, z: pzf.z, k: 'prize' }; }
    else { if (fed) mem.to = null; if (!fed && nearN < 5) {      /* little to eat where he is: he reads the map and swims to the nearest place with fish (nobody goes to the jelly garden to FEED) */ to = mem.to && !(mem.to.out > 0) ? mem.to : null; let bd = 1e9; if (!to) for (const q of G.spots) { if (q.out > 0 || q === here || q.k === 'jelly') continue; const d = Math.hypot(q.x - m.x, q.z - m.z); if (d < bd) { bd = d; to = q; } } mem.to = to; } }
    {
      if (to) { const dx = to.x - m.x, dz = to.z - m.z, d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d; let snack = null, sd = 6.5; for (const f of G.fish) { if (!edible(G, f) || f.leave != null || f.kind === 'puffer' || f.fleeing) continue; const ax = f.x - m.x, az = f.z - m.z, ad = Math.hypot(ax, az); if (ad < sd && (ax * ux + az * uz) > ad * 0.2) { sd = ad; snack = f; } }      /* a fish close by and on the way: taken in passing, as anyone would */
        const back = fx * ux + fz * uz; if (back < 0) { fx -= back * ux * 0.85; fz -= back * uz * 0.85; }      /* round a jellyfish, not back from it */
        const gx = snack ? (snack.x - m.x) / (sd || 1) : ux, gz = snack ? (snack.z - m.z) / (sd || 1) : uz; let sx = gx * 0.85 + fx * 0.6, sz = gz * 0.85 + fz * 0.6; const L2 = Math.hypot(sx, sz) || 1, hurry = m.hunger < 0.4 && m.dash > 0.3; sx = sx / L2 * (hurry ? 1 : 0.88); sz = sz / L2 * (hurry ? 1 : 0.88); ACT.setStick(G, sx, sz); mem.mode = 'go ' + to.k + (snack ? ' +' + snack.kind : ''); return; } } }
  let best = null, bs = -1e9; const ban = mem.ban || (mem.ban = {}), hp0 = G.lesson ? null : spotAt(G, m.x, m.z), hereP = hp0 && !(hp0.out > 0) ? hp0 : null;      // a fish he has chased for three seconds and not caught (a puffer that keeps puffing, a mackerel too quick for him) he gives up on for a while, as a person does
  if (!G.lesson && mem.tgt != null && G.t - mem.since > 3) { ban[mem.tgt] = G.t + 7; mem.tgt = null; }      /* not in a lesson: there the one fish it is about is the whole point */
  for (const f of G.fish) { if (!edible(G, f)) continue; if (f.prize) { if (G.ready && (!mem.feed || Math.hypot(f.x - m.x, f.z - m.z) < 11)) { best = f; bs = 1e9; break; } continue; } if (ban[f.id] > G.t) continue; const d = Math.hypot(f.x - m.x, f.z - m.z); let risk = 0; for (const h of G.fish) if (danger(G, h)) { const dh = Math.hypot(h.x - f.x, h.z - f.z); if (dh < 10) risk += (10 - dh) * (h.state === 'calm' ? 0.3 : 1.5); }
    for (const j of G.fish) if (j.sp.kind === 'jelly') { const dj = Math.hypot(j.x - f.x, j.z - f.z); if (dj < 1 + j.size + s * 0.5) risk += 4; else { const ax = f.x - m.x, az = f.z - m.z, al = Math.hypot(ax, az) || 1, t = clamp(((j.x - m.x) * ax + (j.z - m.z) * az) / (al * al), 0, 1), pd = Math.hypot(m.x + ax * t - j.x, m.z + az * t - j.z); if (pd < 0.5 + j.size * 0.6 + s * 0.35) risk += 3; } }      /* a jellyfish beside it or on the way to it: not that one */
    const sc = f.sp.val * 3 / (d + 4) - risk * 0.15 - (f.sp.kind === 'dart' && d > 8 ? 0.2 : 0) - (f.kind === 'puffer' && m.dash < 0.4 ? 0.5 : 0) - (hereP && Math.hypot(f.x - hereP.x, f.z - hereP.z) > hereP.r + 1 ? 0.35 : 0); if (sc > bs) { bs = sc; best = f; } }
  if (!best) { ACT.setStick(G, -m.x / (rr || 1) * 0.6 + fx, -m.z / (rr || 1) * 0.6 + fz); return; }
  if (best.id !== mem.tgt) { mem.tgt = best.id; mem.since = G.t; }
  const d = Math.hypot(best.x - m.x, best.z - m.z), lead = Math.min(0.5, d / 10), tx = best.x + Math.cos(best.h) * best.v * lead - m.x, tz = best.z + Math.sin(best.h) * best.v * lead - m.z, L = Math.hypot(tx, tz) || 1;
  const dash = (best.fleeing && d < 8 && m.dash > 0.35) || (best.kind === 'puffer' && d < 7 && m.dash > 0.2) || (best.sp.gold && d < 10 && m.dash > 0.3);
  ACT.setStick(G, tx / L * (dash ? 1 : 0.8) + fx * 0.6, tz / L * (dash ? 1 : 0.8) + fz * 0.6); mem.mode = 'hunt ' + best.kind + '@' + d.toFixed(1) + (best.fleeing ? ' fleeing' : '') + ' v' + best.v.toFixed(1);
}
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.me.tier = G.cfg.goal - 1; G.ready = true; finish(G, true); }

// what the robot would do now, without doing it (tools/dry_plan.py): the tutorial shows this move
const ACT_REAL = { setStick }; let ACT = ACT_REAL;
function dryPlan(G, o, mem) { let got = null; const rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { if (!got && !(a.length > 2 && a.slice(1).every(v => v === 0 || v === false))) got = [n, ...a.slice(1)]; return true; };      /* (a stick at rest, all its numbers 0, is not a move; a first bed, number 0, is) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return got; }
function dryPlanAll(G, o, mem) { const all = [], rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { all.push([n, ...a.slice(1)]); return true; };      /* every call, in order (for a robot that steers and drifts at once) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return all; }
