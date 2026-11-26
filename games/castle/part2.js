// ===================== RULES: Castle Siege (game 25) =====================
// Tower defence on a green valley in 3D. The enemy marches down the road from the forest to your castle gate, wave after
// wave. Tap a stone pad by the road to build: ARCHERS (quick, hit fliers, useless against plate armour), CATAPULT (slow, a
// splash that breaks crowds and armour, cannot hit fliers), MAGE (magic bolts: through armour, hit fliers and ghosts) or FROST
// (slows everything near it). Tap a tower to upgrade it (three ranks) or sell it. Tap the METEOR to drop fire on the road.
// Call the next wave early for gold. Gold comes from every enemy that falls. The gate takes the blows of those who reach it.
// Kinds: goblins (quick), soldiers, knights (armour: arrows bounce), bats (fly: only archers and mages), ogres (huge; cannot
// be slowed), shamans (heal those near them), ghosts (only magic touches them), battering rams (armour, smash the gate), and a
// boss every tenth level (a dragon in the air or a giant). The crowns you win buy ROYAL UPGRADES that stay with you.
// World: metres; the road is a polyline from the forest (d = 0) to the gate (d = PATH_LEN).

const RULES = [
  '<b>Tap a stone pad</b> beside the road to build a tower: Archers, Catapult, Mage or Frost.',
  '<b>Archers</b> hit fliers but bounce off plate armour. <b>Catapults</b> smash crowds and armour but cannot hit fliers.',
  '<b>Mages</b> hit everything, ghosts too. <b>Frost</b> slows all near it (not ogres).',
  '<b>Tap a tower</b> to upgrade it or sell it. <b>Tap METEOR</b>, then the road, to drop fire.',
  'See what the next wave brings, top left. Call it early for gold. Hold the gate.',
];
// the roads: every siege the enemy comes by one of eight roads across the valley (four, and each mirrored); the first three
// levels use the first. The stone pads stand on a grid over the whole valley: those by this siege's road are worth building on,
// the rest are not (LESSONS rule 1: a thumb that builds anywhere, without looking, wastes its gold).
const ROADS = [
  [[-1, -26], [6, -21], [7, -14], [0, -10], [-7, -7], [-7, 0], [-1, 3], [6, 5], [7, 11], [1, 15], [0, 21]],
  [[-8, -26], [-8, -17], [-1, -13], [8, -11], [8, -3], [0, 1], [-8, 4], [-8, 12], [-2, 15], [0, 21]],
  [[3, -26], [-4, -20], [-9, -14], [-5, -8], [4, -8], [9, -3], [5, 3], [-3, 4], [-6, 10], [0, 14], [0, 21]],
  [[9, -26], [8, -18], [0, -17], [-8, -13], [-9, -5], [-3, -2], [3, -4], [9, 0], [8, 8], [2, 10], [-4, 13], [-2, 18], [0, 21]],
];
const GRID = []; [-22, -16.5, -11, -5.5, 0, 5.5, 11, 16.5].forEach((z, r) => (r % 2 ? [-6.7, 0, 6.7] : [-10, -3.3, 3.3, 10]).forEach(x => GRID.push([x, z])));
let ROAD = ROADS[0], ROAD_ID = -1, PADS = [], segs = [], PATH_LEN = 0;
function roadOf(N) { if (N <= 3) return 0; const R = rng(N * 7717 + 5); R(); return (R() * 8) | 0; }
function setRoad(id) {
  if (id === ROAD_ID) return; ROAD_ID = id; ROAD = ROADS[id % 4].map(([x, z]) => [id >= 4 ? -x : x, z]);
  segs = []; PATH_LEN = 0; for (let i = 1; i < ROAD.length; i++) { const a = ROAD[i - 1], b = ROAD[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]); segs.push({ a, b, l, d0: PATH_LEN }); PATH_LEN += l; }
  PADS = GRID.filter(([x, z]) => roadDist(x, z) >= 2.5 && !(z > 14 && Math.abs(x) < 2));
}
function roadDist(x, z) { let b = 1e9; for (const s of segs) { const ax = s.b[0] - s.a[0], az = s.b[1] - s.a[1], u = clamp(((x - s.a[0]) * ax + (z - s.a[1]) * az) / (s.l * s.l), 0, 1); b = Math.min(b, Math.hypot(x - s.a[0] - ax * u, z - s.a[1] - az * u)); } return b; }
function roadAt(d) { d = clamp(d, 0, PATH_LEN); for (const s of segs) if (d <= s.d0 + s.l) { const u = (d - s.d0) / s.l; return { x: s.a[0] + (s.b[0] - s.a[0]) * u, z: s.a[1] + (s.b[1] - s.a[1]) * u, h: Math.atan2(s.b[0] - s.a[0], s.b[1] - s.a[1]) }; } const L = ROAD[ROAD.length - 1]; return { x: L[0], z: L[1], h: 0 }; }
setRoad(0);
const TOWERS = {
  archer: { name: 'Archers', cost: [70, 60, 95], range: [6, 6.6, 7.2], rate: [0.75, 0.6, 0.45], dmg: [10, 16, 26], air: true, kind: 'arrow' },
  cat: { name: 'Catapult', cost: [110, 95, 140], range: [7, 7.6, 8.2], rate: [2.6, 2.3, 2.0], dmg: [34, 56, 90], splash: [2.0, 2.4, 2.8], air: false, kind: 'stone' },
  mage: { name: 'Mage', cost: [105, 95, 135], range: [5.8, 6.4, 7], rate: [1.25, 1.05, 0.85], dmg: [20, 32, 52], air: true, kind: 'magic' },
  frost: { name: 'Frost', cost: [80, 70, 100], range: [5, 5.6, 6.2], slow: [0.3, 0.4, 0.5], dps: [3, 6, 10], air: false, kind: 'frost' },
};
const KINDS = ['archer', 'cat', 'mage', 'frost'], SPEED = 1.3;      // every foe's pace, m/s, times this
const FOES = {
  goblin: { name: 'Goblins', hp: 34, v: 2.5, gold: 5, gate: 1 },
  soldier: { name: 'Soldiers', hp: 70, v: 1.7, gold: 8, gate: 1 },
  knight: { name: 'Knights', hp: 130, v: 1.35, gold: 14, gate: 1, armour: { arrow: 0.15 } },
  bat: { name: 'Bats', hp: 40, v: 2.4, gold: 7, gate: 1, air: true },
  ogre: { name: 'Ogres', hp: 380, v: 0.95, gold: 32, gate: 3, noslow: true },
  shaman: { name: 'Shamans', hp: 90, v: 1.45, gold: 18, gate: 1, heal: true },
  ghost: { name: 'Ghosts', hp: 100, v: 1.9, gold: 16, gate: 1, ghost: true },
  ram: { name: 'Battering ram', hp: 520, v: 0.85, gold: 40, gate: 4, armour: { arrow: 0.3, magic: 0.8 } },
  dragon: { name: 'DRAGON', hp: 1300, v: 1.1, gold: 250, gate: 8, air: true, boss: true },
  giant: { name: 'GIANT', hp: 1600, v: 0.75, gold: 250, gate: 8, noslow: true, boss: true, armour: { arrow: 0.4 } },
};
const UPGRADES = [
  { id: 'treasury', name: 'Royal treasury', desc: 'Start each siege with more gold.', max: 5, cost: l => 8 + l * 8 },
  { id: 'arrows', name: 'Steel arrowheads', desc: 'Archers hit harder.', max: 4, cost: l => 10 + l * 10 },
  { id: 'stones', name: 'Heavier stones', desc: 'Catapults hit harder.', max: 4, cost: l => 10 + l * 10 },
  { id: 'arcane', name: 'Arcane focus', desc: 'Mages hit harder.', max: 4, cost: l => 12 + l * 10 },
  { id: 'meteor', name: 'Fire priests', desc: 'The meteor comes back sooner.', max: 3, cost: l => 10 + l * 12 },
  { id: 'walls', name: 'Stone walls', desc: 'The gate holds more blows.', max: 3, cost: l => 12 + l * 12 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Squire'], [40, 'Knight'], [140, 'Baron'], [350, 'Earl'], [800, 'Duke'], [1600, 'King']];
const WEATHERS = ['morning', 'golden', 'noon', 'overcast', 'rain', 'sunset', 'mist', 'storm', 'dusk', 'dawn'];
function weatherOf(N) { if (N <= 3) return ['morning', 'noon', 'golden'][N - 1]; const R = rng(N * 4409 + 13); R(); return WEATHERS[(R() * WEATHERS.length) | 0]; }

function makeCfg(N, help) { help = help || N === 1;      /* 26 Nov 2026, his words: "the first level should be the only one that is given": level 1 always has the help a loss gives */
  const f = curve(N), e = easyOf(N), boss = N % 10 === 0, x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s));
  // 23 Nov 2026, his note: "AMAZING GAME!!!! but just a little too hard on the earlier levels ramp it slowly": the first 15 levels are gentler
  // (weaker foes, a lighter army, more gold, longer between waves) and the full strength comes in step by step
  const ez = N <= 3 ? 0 : 1 - Math.min(1, (N - 4) / 18);      // the first three are the lessons (already gentle); from level 4 the climb is slowed and reaches full strength by level 22
  return { N, f, e, boss, help: !!help, ez,
    waves: N <= 2 ? 3 : Math.min(7, Math.round(x(4, 7, 40))), gold: Math.round(190 + x(0, 500, 25)) + 40 * upLv('treasury') + (help ? 60 : 0), gate: 12 + 3 * upLv('walls'),
    hpX: x(0.75, 1.4, 90) * (help ? 0.85 : 1) * (1 - 0.22 * ez), budget: x(135, 175, 80) * (1 - 0.15 * ez), grow: x(0.2, 0.28, 30) * (1 - 0.25 * ez), gap: x(11, 8, 30) + 3 * ez,
    meteorCD: 30 * (1 - 0.15 * upLv('meteor')), meteorDmg: 160 + N * 6, dmgUp: { arrow: 1 + 0.12 * upLv('arrows'), stone: 1 + 0.12 * upLv('stones'), magic: 1 + 0.12 * upLv('arcane'), frost: 1 } };
}
// which kinds can come on this level, and the waves themselves: a budget of strength spent on a few kinds per wave
function kindsOf(N) { const k = ['goblin', 'soldier']; if (N >= 2) k.push('bat'); if (N >= 3) k.push('knight'); if (N >= 5) k.push('ogre'); if (N >= 7) k.push('shaman'); if (N >= 12) k.push('ghost'); if (N >= 9) k.push('ram'); return k; }
function makeWaves(G) {      // each wave spends a budget of strength on a few kinds; the first waves are light, big foes come later
  const c = G.cfg, R = G.rnd, L = lessonNow(G), out = [], all = L ? L.kinds : kindsOf(G.N);
  const n = L ? L.waves : c.waves;
  for (let w = 0; w < n; w++) { let budget = c.budget * (1 + c.grow * w) * (L ? 0.55 : 1) * (!L && c.boss && w === n - 1 ? 0.4 : 1);
    const pool = L ? all : all.filter(k => w >= ({ goblin: 0, soldier: 0, bat: 1, knight: 1, shaman: 2, ghost: 2, ogre: 2, ram: 3 })[k]);
    const picks = []; const nk = Math.min(pool.length, (w ? 2 : 1) + ((R() * 2) | 0));
    for (let i = 0; i < nk; i++) picks.push(pool[(R() * pool.length) | 0]); if (picks.every(k => FOES[k].air)) picks.push(pool.find(k => !FOES[k].air)); const list = []; let airB = 0;
    while (budget > 0) { let k = picks[(R() * picks.length) | 0]; if (FOES[k].air && airB > c.budget * (1 + c.grow * w) * 0.45) k = picks.find(q => !FOES[q].air); const cost = FOES[k].hp / 6 * (FOES[k].air ? 1.4 : 1); if (FOES[k].air) airB += cost; list.push(k); budget -= cost; }
    if (!L && c.boss && w === n - 1) list.push(G.N % 20 === 0 ? 'giant' : 'dragon');
    out.push(list.sort(() => R() - 0.5)); }
  return out;
}
function newGame(N, o = {}) {
  setRoad(roadOf(N)); const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, road: ROAD_ID, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null,
    weather: weatherOf(N), gold: cfg.gold, gate: cfg.gate, towers: PADS.map(() => null), foes: [], shots: [], waves: [], wave: 0, queue: [], spawnT: 0, next: 15, meteor: 0, booms: [], kills: 0, leaked: 0, spent: 0, earlyGold: 0, id: 0 };
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else G.waves = makeWaves(G);
  return G;
}
// ---------- the thumb ----------
// each new tower costs more than the last (the builders are busy): a few good towers, upgraded, beat many anywhere
const priceOf = (G, kind) => Math.round(TOWERS[kind].cost[0] * (1 + 0.15 * G.towers.filter(Boolean).length) / 5) * 5;
function build(G, pad, kind) {
  const T = TOWERS[kind]; if (G.over || pad < 0 || pad >= PADS.length || !T || G.towers[pad]) return false; const cost = priceOf(G, kind);
  if (G.gold < cost) { G.ev.push({ k: 'poor', need: cost - G.gold }); return false; }
  G.gold -= cost; G.spent += cost; G.towers[pad] = { kind, lv: 0, cd: 0.3, paid: cost, aim: 0 }; G.ev.push({ k: 'build', pad, kind }); lessonSee(G, 'build', kind); return true;
}
function upgrade(G, pad) {
  const t = G.towers[pad]; if (G.over || !t || t.lv >= 2) return false; const cost = TOWERS[t.kind].cost[t.lv + 1];
  if (G.gold < cost) { G.ev.push({ k: 'poor', need: cost - G.gold }); return false; }
  G.gold -= cost; G.spent += cost; t.lv++; t.paid += cost; G.ev.push({ k: 'upgrade', pad, lv: t.lv }); lessonSee(G, 'upgrade'); return true;
}
function sell(G, pad) { const t = G.towers[pad]; if (G.over || !t) return; const back = Math.round(t.paid * 0.6); G.gold += back; G.towers[pad] = null; G.ev.push({ k: 'sell', pad, back }); }
function callWave(G) { if (G.over || G.queue.length || G.foes.length || G.wave >= G.waves.length || G.next <= 0) return; const bonus = Math.round(G.next * 1.5); G.gold += bonus; G.earlyGold += bonus; G.next = 0; G.ev.push({ k: 'early', bonus }); }
function meteor(G, d) { if (G.over || G.meteor > 0) return false; d = clamp(d, 0, PATH_LEN); G.meteor = G.cfg.meteorCD; G.booms.push({ d, t: 0.8 }); G.ev.push({ k: 'meteor', d }); return true; }
// ---------- every frame ----------
function dmgTo(f, kind, amt, c) { const F = FOES[f.k]; if (F.ghost && kind !== 'magic') return 0; const arm = F.armour && F.armour[kind] != null ? F.armour[kind] : 1; return amt * arm * c.dmgUp[kind]; }
function hurt(G, f, amt) { if (f.dead || amt <= 0) return; f.hp -= amt; f.flash = 0.12; if (f.hp <= 0) { f.dead = true; const F = FOES[f.k], gold = Math.round(F.gold * (0.5 + 0.5 * G.cfg.hpX)); G.gold += gold; G.kills++; G.ev.push({ k: 'kill', foe: f.k, x: f.x, z: f.z, gold, boss: !!F.boss }); lessonSee(G, 'kill'); } }
function step(G, dt) {
  if (G.over) return; G.t += dt; const c = G.cfg, R = G.rnd;
  G.meteor = Math.max(0, G.meteor - dt);
  // waves: a pause, then the next wave marches in, one foe at a time
  if (!G.queue.length && G.wave < G.waves.length) { G.next -= dt * (G.foes.length ? 1 : 1.6); if (G.next <= 0) { G.queue = G.waves[G.wave].slice(); G.wave++; G.spawnT = 0; G.next = c.gap; G.ev.push({ k: 'wave', n: G.wave, of: G.waves.length }); } }
  if (G.queue.length) { G.spawnT -= dt; if (G.spawnT <= 0) { const k = G.queue.shift(), F = FOES[k], hp = F.hp * c.hpX * (1 + 0.05 * G.wave); G.foes.push({ id: ++G.id, k, hp, max: hp, d: 0, v: F.v, slow: 0, x: ROAD[0][0], z: ROAD[0][1], flash: 0, lane: (R() - 0.5) * 1.2 }); G.spawnT = F.boss ? 3 : k === 'ogre' || k === 'ram' ? 1.6 : 0.5 + R() * 0.4; } }
  // foes march (slowed in the frost); shamans heal those near them; at the gate, they strike it and are gone
  for (const f of G.foes) { if (f.dead) continue; const F = FOES[f.k]; f.flash = Math.max(0, f.flash - dt);
    const sl = F.noslow ? 0 : f.slow; f.d += F.v * SPEED * (1 - sl) * dt; f.slow = Math.max(0, f.slow - dt * 2); const p = roadAt(f.d); f.x = p.x + Math.cos(p.h) * f.lane; f.z = p.z - Math.sin(p.h) * f.lane; f.h = p.h;
    if (F.heal) { f.healT = (f.healT || 0) - dt; if (f.healT <= 0) { f.healT = 2; for (const g of G.foes) if (!g.dead && g !== f && Math.abs(g.d - f.d) < 4) g.hp = Math.min(g.max, g.hp + g.max * 0.12); G.ev.push({ k: 'heal', x: f.x, z: f.z }); } }
    if (f.d >= PATH_LEN) { f.dead = true; f.leak = true; G.gate -= F.gate; G.leaked++; G.ev.push({ k: 'leak', foe: f.k, dmg: F.gate }); lessonMiss(G, 'leak'); if (G.gate <= 0 && !G.lesson) { G.gate = 0; finish(G, false, 'gate'); return; } if (G.lesson && G.gate <= 0) G.gate = c.gate; } }
  // towers: each picks the foe furthest along in its range that it can hurt
  for (let i = 0; i < PADS.length; i++) { const t = G.towers[i]; if (!t) continue; const T = TOWERS[t.kind], P = PADS[i], r = T.range[t.lv];
    if (t.kind === 'frost') { for (const f of G.foes) if (!f.dead && !FOES[f.k].air && Math.hypot(f.x - P[0], f.z - P[1]) < r) { f.slow = Math.max(f.slow, T.slow[t.lv]); hurt(G, f, dmgTo(f, 'frost', T.dps[t.lv] * dt, c)); } continue; }
    t.cd -= dt; if (t.cd > 0) continue;
    let best = null; for (const f of G.foes) { if (f.dead) continue; const F = FOES[f.k]; if (F.air && !T.air) continue; if (F.ghost && t.kind !== 'magic') continue; if (Math.hypot(f.x - P[0], f.z - P[1]) > r) continue; if (!best || f.d > best.d) best = f; }
    if (!best) continue; t.cd = T.rate[t.lv]; t.aim = Math.atan2(best.x - P[0], best.z - P[1]);
    const fly = t.kind === 'cat' ? 0.9 : t.kind === 'arrow' ? 0.25 : 0.3; G.shots.push({ kind: t.kind, from: i, to: best.id, x: best.x, z: best.z, t: 0, fly, dmg: T.dmg[t.lv], splash: T.splash ? T.splash[t.lv] : 0, lv: t.lv, air: !!FOES[best.k].air }); G.ev.push({ k: 'shot', kind: t.kind }); }
  // shots land
  for (const s of G.shots) { s.t += dt; const f = G.foes.find(q => q.id === s.to); if (f && !f.dead) { s.x = f.x; s.z = f.z; } if (s.t < s.fly) continue; s.done = true;
    if (s.kind === 'cat') { G.ev.push({ k: 'thud', x: s.x, z: s.z }); for (const g of G.foes) if (!g.dead && !FOES[g.k].air && Math.hypot(g.x - s.x, g.z - s.z) < s.splash) hurt(G, g, dmgTo(g, 'stone', s.dmg, c)); }
    else if (f && !f.dead) hurt(G, f, dmgTo(f, s.kind === 'archer' ? 'arrow' : 'magic', s.dmg, c)); }
  G.shots = G.shots.filter(s => !s.done);
  // the meteor
  for (const b of G.booms) { b.t -= dt; if (b.t <= 0 && !b.done) { b.done = true; const p = roadAt(b.d); G.ev.push({ k: 'boom', x: p.x, z: p.z }); for (const f of G.foes) if (!f.dead && Math.hypot(f.x - p.x, f.z - p.z) < 3.2) hurt(G, f, c.meteorDmg * (FOES[f.k].boss ? 0.5 : 1)); } }
  G.booms = G.booms.filter(b => !b.done || b.t > -1.5);
  G.foes = G.foes.filter(f => !f.dead);
  // all waves through, every foe gone: the siege is lifted
  if (!G.lesson && G.wave >= G.waves.length && !G.queue.length && !G.foes.length && !G.over) finish(G, true);
  if (G.lesson && G.wave >= G.waves.length && !G.queue.length && !G.foes.length) lessonSee(G, 'held');
}
function finish(G, win, why) {
  const c = G.cfg; G.over = win ? 'won' : 'lost';
  const stars = win ? (G.gate >= c.gate * 0.9 ? 3 : G.gate >= c.gate * 0.5 ? 2 : 1) : 0;
  G.res = { win, why, stars, gate: G.gate, gateMax: c.gate, kills: G.kills, crowns: win ? stars * 3 + Math.ceil(G.N / 2) : Math.ceil(G.wave / 2), combo: G.gate, time: G.t };
  G.ev.push({ k: win ? 'won' : 'lost', why });
}
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'build', title: 'BUILD ARCHERS', say: G => castleCue(G)[0], do: G => castleCue(G)[1], at: G => castleCue(G)[2], how: 'Tap a stone pad beside the road, then tap the ARCHERS. Build two towers and hold off the goblins.', need: 1, ok: w => w === 'held', kinds: ['goblin'], waves: 2 }],
  2: [{ id: 'mix', title: 'THE RIGHT TOWER', say: G => castleCue(G)[0], do: G => castleCue(G)[1], at: G => castleCue(G)[2], how: 'Bats fly: catapults and frost cannot touch them. Knights wear plate: arrows bounce off. Build a MAGE and a CATAPULT.', need: 1, ok: w => w === 'held', kinds: ['bat', 'knight', 'soldier'], waves: 2 }],
  3: [{ id: 'up', title: 'UPGRADE AND FIRE', say: G => castleCue(G)[0], do: G => castleCue(G)[1], at: G => castleCue(G)[2], how: 'Tap a tower you built to UPGRADE it. Tap METEOR, then the road, to drop fire on a crowd. Hold two waves.', need: 1, ok: w => w === 'held', kinds: ['soldier', 'goblin', 'knight'], waves: 2 }],
};
// THE TUTORIAL SHOWS ONE TAP AT A TIME, WITH THE HAND ON IT (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing happens").
// It said TAP A PAD, THEN ARCHERS with the hand in a box. Now the robot is asked what it would do (dryPlan, tools/dry_plan.py) and the hand
// does it: TAP THIS PAD, then the tower in the menu that opens (TAP ARCHERS, TAP MAGE...), TAP YOUR TOWER then UPGRADE, TAP METEOR then the
// crowd; WAIT… while the towers fight.
const CNAME = { archer: 'ARCHERS', mage: 'MAGE', cat: 'CATAPULT', frost: 'FROST' };
function castleCue(G) { const padAt = i => { const s2 = scr(PADS[i][0], 0.4, PADS[i][1]); return [s2.x, s2.y]; }, btn = q => { const b = (ui.btns || []).find(q); return b ? [b.x, b.y] : null; };
  const P = ui.aim && ui.aimD != null ? ['meteor', ui.aimD] : dryPlan(G);
  if (P && P[0] === 'build') { const [, pad, kind] = P; if (ui.sel === pad) { const b = btn(q => q.act === 'build' && q.kind === kind); if (b) return ['TAP ' + CNAME[kind], 'tap', b]; } return ['TAP THIS PAD', 'tap', padAt(pad)]; }
  if (P && P[0] === 'upgrade') { const i = P[1]; if (ui.sel === i) { const b = btn(q => q.act === 'up'); if (b) return ['TAP UPGRADE', 'tap', b]; } return ['TAP YOUR TOWER', 'tap', padAt(i)]; }
  if (P && P[0] === 'meteor') { if (!ui.aim) { ui.aimD = P[1]; const m = meteorBtn(); return ['TAP METEOR ☄️', 'tap', [m.x, m.y]]; } const p = roadAt(P[1]), s2 = scr(p.x, 0, p.z); return ['TAP THE CROWD', 'tap', [s2.x, s2.y]]; }
  ui.aimD = null; return [G.foes.length ? 'WAIT… YOUR TOWERS FIGHT' : 'WAIT… THEY ARE COMING', 'wait', false]; }
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0, miss: 0 }; G.waves = makeWaves(G); G.wave = 0; G.next = 14; G.ev.push({ k: 'lessonnext', first: true }); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonSee(G, what, arg) {
  const D = G.lesson; if (!D) return; const st = D.steps[D.i]; if (!st.ok(what, arg)) return;
  if (what === 'held' && D.leaks > 1) { D.leaks = 0; G.waves = makeWaves(G); G.wave = 0; G.next = 8; G.gate = G.cfg.gate; G.ev.push({ k: 'lessonmiss', why: 'leak', how: 'Too many got through. Build beside the road where it bends, and hold them all.' }); return; }
  D.n++; if (D.n < st.need) { G.ev.push({ k: 'lessonok', n: D.n, need: st.need }); return; }
  D.i++; D.n = 0; D.miss = 0; D.leaks = 0;
  if (D.i >= D.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); Object.assign(G, { gold: Math.max(G.gold, G.cfg.gold), gate: G.cfg.gate, wave: 0, next: 10, kills: 0, leaked: 0 }); G.waves = makeWaves(G); }
  else { G.ev.push({ k: 'lessonnext' }); G.waves = makeWaves(G); G.wave = 0; G.next = 10; }
}
function lessonMiss(G, why) { const D = G.lesson; if (!D) return; D.miss++; if (why === 'leak') D.leaks = (D.leaks || 0) + 1; if (D.miss === 1 || D.miss % 4 === 0) G.ev.push({ k: 'lessonmiss', why, how: D.steps[D.i].how }); }

// ---------- for the robots ----------
// BLIND: a thumb tapping the screen without looking. A tap lands somewhere: on a pad (a pad's ring is about 1% of the
// screen) it opens that pad's menu; with a menu open, a tap on one of its buttons (each about 1% of the screen) builds that
// tower, upgrades or SELLS; anywhere else it closes the menu. The METEOR and CALL buttons stay in one place, so a thumb can
// learn them: m (meteor, then a tap that may land on the road) and n (call the wave).
const TAP_PAD = Math.PI * 36 * 36 / (390 * 844), TAP_BTN = Math.PI * 32 * 32 / (390 * 844);
function blindTap(G) {
  const R = Math.random; if (G.bsel == null) G.bsel = -1;
  if (G.bsel >= 0) { const t = G.towers[G.bsel], n = t ? (t.lv < 2 ? 2 : 1) : 4, u = R();
    if (u < n * TAP_BTN) { const i = (u / TAP_BTN) | 0, pad = G.bsel; G.bsel = -1; if (!t) build(G, pad, KINDS[i]); else if (t.lv < 2 && i === 0) upgrade(G, pad); else sell(G, pad); return; } }
  G.bsel = R() < PADS.length * TAP_PAD ? (R() * PADS.length) | 0 : -1;
}
const BLIND = { t: G => blindTap(G), m: G => { if (G.meteor <= 0 && Math.random() < 0.5) meteor(G, Math.random() * PATH_LEN); }, n: G => callWave(G) };
// how much road a pad covers with a given range (sample the road every metre)
function cover(pad, r, w) { let n = 0; for (let d = 0; d < PATH_LEN; d += 1) { const p = roadAt(d); if (Math.hypot(p.x - PADS[pad][0], p.z - PADS[pad][1]) < r) n += w ? 1 + d / PATH_LEN : 1; } return Math.round(n); }
const COVER = {}; function coverOf(pad, kind, lv = 0) { const key = ROAD_ID + ':' + pad + kind + lv; if (COVER[key] == null) COVER[key] = cover(pad, TOWERS[kind].range[lv]); return COVER[key]; }
// a commander who looks: reads what is coming (fliers? plate? ghosts? crowds?), builds the tower that answers it on the pad
// that covers most road, upgrades the busiest towers, and drops the meteor on the thickest crowd
function honest(G, o, mem) {
  const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, c = G.cfg;
  if (G.t < (mem.next || 0)) return; mem.next = G.t + 0.4 + react * 2;
  const upcoming = (G.queue.length ? G.queue : G.waves[G.wave] || []).concat(G.foes.map(f => f.k));
  const has = k => upcoming.some(q => q === k), count = k => G.towers.filter(t => t && t.kind === k).length;
  // what to build next: what answers the coming foes; otherwise damage first (archers and catapults), frost once there is damage
  const nT = G.towers.filter(Boolean).length; let want = ['archer', 'cat', 'archer', 'mage', 'cat', 'archer', 'mage', 'frost'][nT % 8];
  if ((has('bat') || has('dragon')) && count('archer') + count('mage') < 2 + (nT > 5 ? 1 : 0)) want = count('archer') <= count('mage') ? 'archer' : 'mage';
  else if (has('ghost') && count('mage') < 1 + (nT > 5 ? 1 : 0)) want = 'mage';
  else if ((has('knight') || has('ram') || has('giant') || has('ogre')) && count('cat') + count('mage') < 2 + (nT > 6 ? 1 : 0)) want = count('cat') <= count('mage') ? 'cat' : 'mage';
  else if ((has('ogre') || has('giant')) === false && nT >= 4 && count('frost') < 1 && G.N > 6) want = 'frost';
  if (Math.random() > acc) want = KINDS[(Math.random() * 4) | 0];
  if (G.gold < priceOf(G, want) && !(has('ghost') && want === 'mage') && G.gold >= priceOf(G, 'archer') && G.towers.filter(Boolean).length < 2) want = 'archer';
  const free = PADS.map((p, i) => i).filter(i => !G.towers[i] && coverOf(i, 'cat') >= 5), padFor = k => free.sort((a, b) => coverOf(b, k) - coverOf(a, k))[Math.random() < acc ? 0 : Math.min(free.length - 1, 1 + ((Math.random() * 3) | 0))];
  const built = G.towers.map((t, i) => t ? i : -1).filter(i => i >= 0 && G.towers[i].lv < 2).sort((a, b) => coverOf(b, G.towers[b].kind) - coverOf(a, G.towers[a].kind));
  const air = has('bat') || has('dragon'), upOk = i => !air || ['archer', 'mage'].includes(G.towers[i].kind) || Math.random() > acc;
  const upPick = built.filter(upOk).find(i => G.gold >= TOWERS[G.towers[i].kind].cost[G.towers[i].lv + 1]);
  if (free.length && G.towers.filter(Boolean).length < Math.min(6, 3 + G.N / 12) && G.gold >= priceOf(G, want)) ACT.build(G, padFor(want), want);
  else if (upPick != null) ACT.upgrade(G, upPick);
  else if (free.length && G.gold >= priceOf(G, want) + 30) ACT.build(G, padFor(want), want);
  else if (free.length && G.gold >= priceOf(G, 'archer') + 40 && !built.length) ACT.build(G, padFor('archer'), 'archer');
  // the meteor, on the thickest crowd close to the gate
  if (G.meteor <= 0 && G.foes.length) { let best = null, bn = 0; for (const f of G.foes) { const n = G.foes.filter(g => Math.hypot(g.x - f.x, g.z - f.z) < 3).length + f.d / PATH_LEN * 2; if (n > bn) { bn = n; best = f; } } if (best && bn >= 3) ACT.meteor(G, best.d + FOES[best.k].v * SPEED * 0.8); }
}
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.wave = G.waves.length; G.queue.length = 0; G.foes.length = 0; }

// what the robot would do now, without doing it (tools/dry_plan.py): the tutorial shows this move
const ACT_REAL = { build, upgrade, meteor }; let ACT = ACT_REAL;
function dryPlan(G, o, mem) { let got = null; const rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { if (!got && !(a.length > 2 && a.slice(1).every(v => v === 0 || v === false))) got = [n, ...a.slice(1)]; return true; };      /* (a stick at rest, all its numbers 0, is not a move; a first bed, number 0, is) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return got; }
