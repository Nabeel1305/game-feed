
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
  'Grow to the size the level asks for. Every kind you eat goes in your <b>aquarium</b>.',
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
const R_BAY = 28;

function makeCfg(N, help) {
  const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), e = easyOf(N);
  return { N, f, help: !!help, place: placeOf(N),
    goal: Math.min(6, 3 + Math.floor(N / 8)),      // the size to reach: 3 at level 1 ... up to the biggest
    hunters: x(0, 3.6, 30), huntSpd: x(0.72, 0.86, 30), notice: x(1.1, 0.6, 30), hunger: x(0.057, 0.046, 30) * (1 - 0.2 * upLv('belly')) * (help ? 0.8 : 1),
    prey: x(80, 70, 40), flee: x(1.0, 1.25, 30), dodge: x(4.5, 5.2, 30), jelly: N >= 3 ? x(2, 5, 30) : 0, gold: 2,
    spd: 1 + 0.08 * upLv('fins') + (help ? 0.05 : 0), dashCost: 0.16 * (1 - 0.15 * upLv('gills')), reach: 1 + 0.15 * upLv('jaws'), sense: 1 + 0.25 * upLv('sense') + e * 0.3 };
}
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null,
    place: cfg.place, me: { x: 0, z: 0, vx: 0, vz: 2, face: Math.PI / 2, tier: 0, fill: 0, hunger: 0.5, dash: 1, mouth: 0, stung: 0, dashing: false }, fish: [], stick: { x: 0, z: 0 },
    eaten: {}, eatenN: 0, coins: 0, near: 0, starve: 0, hunted: 0, escapes: 0, best: 0 };
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else { G.ev.push({ k: 'start' }); populate(G); }
  return G;
}
const sizeOf = G => SIZES[G.me.tier], needOf = G => 8 + 4 * G.me.tier;
// which kinds swim here: those near your size, a few smaller, hunters a size or two above
function pool(G) { const s = sizeOf(G), N = G.N; return ORDER.filter(k => { const sp = SPECIES[k]; if (sp.kind === 'jelly') return false; if (sp.gold) return false; if (sp.kind === 'hunter') return sp.size > s * 0.6 && sp.size < s * 3.2 && N >= 2; return sp.size > s * 0.15 && sp.size < s * 2.2; }); }
function spawn(G, kind, near) {
  const R = G.rnd, sp = SPECIES[kind], m = G.me; let x, z, tries = 0;
  do { const a = R() * TAU, r = near ? 12 + R() * 10 : 5 + R() * (R_BAY - 7); x = (near ? m.x : 0) + Math.cos(a) * r; z = (near ? m.z : 0) + Math.sin(a) * r; } while ((Math.hypot(x, z) > R_BAY - 4 || Math.hypot(x - m.x, z - m.z) < (kind === 'jelly' || sp.kind === 'hunter' ? 12 : 4)) && tries++ < 30);
  const f = { kind, sp, x, z, h: R() * TAU, v: sp.spd * 0.5, wob: R() * 10, state: 'calm', t: 0, puff: 0, size: sp.size * (0.9 + R() * 0.2), id: G.fishId = (G.fishId || 0) + 1 };
  G.fish.push(f); return f;
}
function populate(G) {
  const c = G.cfg, R = G.rnd, pl = pool(G).filter(k => SPECIES[k].kind !== 'hunter');
  G.fish.length = 0; for (let i = 0; i < c.prey; i++) { const k = pl[(R() * pl.length) | 0]; if (SPECIES[k].kind === 'school') { const f = spawn(G, k); for (let j = 0; j < 5; j++) { const g = spawn(G, k); g.x = f.x + (R() - 0.5) * 3; g.z = f.z + (R() - 0.5) * 3; g.leader = f; } } else spawn(G, k); }
  for (let i = 0; i < huntersNow(G); i++) spawnHunter(G); for (let i = 0; i < Math.round(c.jelly); i++) spawn(G, 'jelly'); for (let i = 0; i < c.gold; i++) spawnGold(G);
}
const huntersNow = G => Math.round(G.cfg.hunters * Math.min(1, (G.me.tier + 1) / 3));      // fewer hunters while you are small
function spawnHunter(G) { const s = sizeOf(G), list = ORDER.filter(k => SPECIES[k].kind === 'hunter' && SPECIES[k].size > s * 1.05); if (!list.length) return null; return spawn(G, list[0], true); }
function spawnGold(G) { const f = spawn(G, 'gold'), h = G.fish.find(q => q.sp.kind === 'hunter'); if (h && G.rnd() < 0.7) { f.x = h.x + 4; f.z = h.z + 3; f.home = h; } return f; }      // the golden fish keeps company with a hunter
const edible = (G, f) => f.sp.val > 0 && f.size < sizeOf(G) * 0.85 && !(f.kind === 'puffer' && f.puff > 0.5);
const danger = (G, f) => f.sp.kind === 'hunter' && f.size > sizeOf(G) * 1.05;
// ---------- your thumb ----------
function setStick(G, x, z) { const L = Math.hypot(x, z); G.stick = L > 1 ? { x: x / L, z: z / L } : { x, z }; }
// ---------- the sea, step by step ----------
function step(G, dt) {
  if (G.over) return; G.t += dt; const c = G.cfg, m = G.me, R = G.rnd, s = sizeOf(G);
  if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0 && G.lessonEnd) { G.lessonEnd = false; Object.assign(m, { x: 0, z: 0, vx: 0, vz: 2, tier: 0, fill: 0, hunger: 0.5, dash: 1 }); G.eaten = {}; G.eatenN = 0; G.coins = 0; populate(G); G.ev.push({ k: 'start' }); } return; }
  // the shark: cruise or dash, turning with weight
  const st = G.stick, L = Math.hypot(st.x, st.z), dashing = L > 0.92 && m.dash > 0.05 && m.stung <= 0, base = (3.2 + 1.6 * Math.sqrt(s)) * c.spd, starving = m.hunger <= 0;
  let vd = L < 0.12 ? base * 0.35 : base * (dashing ? 1.75 : Math.min(1, L * 1.15)) * (starving ? 0.6 : 1) * (m.stung > 0 ? 0.4 : 1);
  let v = Math.hypot(m.vx, m.vz), h = v > 0.1 ? Math.atan2(m.vz, m.vx) : m.face; const hd = L > 0.12 ? Math.atan2(st.z, st.x) : h, da = Math.atan2(Math.sin(hd - h), Math.cos(hd - h));
  const turn = 5.5 / (1 + 0.15 * v); h += clamp(da, -turn * dt, turn * dt); v += clamp(vd - v, -8 * dt, (dashing ? 14 : 7) * dt);
  m.vx = Math.cos(h) * v; m.vz = Math.sin(h) * v; m.x += m.vx * dt; m.z += m.vz * dt; m.face = h; m.turn = clamp(da, -1, 1); m.dashing = dashing;
  const rr = Math.hypot(m.x, m.z); if (rr > R_BAY) { m.x *= R_BAY / rr; m.z *= R_BAY / rr; }
  m.dash = clamp(m.dash + (dashing ? -c.dashCost : 0.09) * dt, 0, 1); if (m.stung > 0) m.stung -= dt; if (m.mouth > 0) m.mouth -= dt;
  if (!G.lesson || G.lesson.hungry) { m.hunger = clamp(m.hunger - c.hunger * (dashing ? 1.25 : 1) * dt, 0, 1); }
  if (starving) { G.starve += dt; if (G.starve > 6) return finish(G, false, 'starved'); } else G.starve = 0;
  // the fish
  const mx = m.x + Math.cos(h) * s * 0.5, mz = m.z + Math.sin(h) * s * 0.5, reach = (0.5 + 0.34 * s) * c.reach;
  let hunted = 0;
  for (let i = G.fish.length - 1; i >= 0; i--) { const f = G.fish[i], sp = f.sp, dx = m.x - f.x, dz = m.z - f.z, d = Math.hypot(dx, dz); f.t += dt; f.wob += dt;
    let th = f.h, sv = sp.spd * 0.45;
    if (sp.kind === 'hunter' && danger(G, f)) {
      const sense = 8 + f.size * 1.5 + s * 1.5;      // a little shark is hard to spot
      if (f.rest > 0) f.rest -= dt;
      if (f.state === 'calm' && d < sense && !(f.rest > 0) && !G.lessonNoHunt) { f.state = 'notice'; f.t = 0; G.ev.push({ k: 'notice', id: f.id }); }
      if (f.state === 'notice') { th = Math.atan2(dz, dx); sv = 0.6; if (f.t > c.notice) { f.state = 'hunt'; f.t = 0; G.ev.push({ k: 'hunt' }); } }
      else if (f.state === 'hunt') { const lead = Math.min(0.6, d / 12); th = Math.atan2(m.z + m.vz * lead - f.z, m.x + m.vx * lead - f.x); sv = base * 1.75 * c.huntSpd * clamp(0.8 + 0.2 * (f.size / s - 1), 0.8, 1);      // one only a little bigger than you is a little slower hunted++;
        if (f.t > 4.5 || d > sense * 2.2) { f.state = 'calm'; f.t = 0; f.h += Math.PI; f.rest = 6; G.escapes++; G.ev.push({ k: 'escaped' }); lessonSee(G, 'escape'); }
        const bx = f.x + Math.cos(f.h) * f.size * 0.5, bz = f.z + Math.sin(f.h) * f.size * 0.5; if (Math.hypot(bx - m.x, bz - m.z) < 0.35 + f.size * 0.18 + s * 0.15) { if (G.lesson) { G.ev.push({ k: 'caught', lesson: true }); lessonMiss(G); return; } G.ev.push({ k: 'caught' }); return finish(G, false, 'eaten', f.kind); } }
      else { if (f.home) {} th = f.h + Math.sin(f.wob * 0.7) * 0.6 * dt * 10; }
    } else if (sp.kind === 'jelly') { th = f.h + Math.sin(f.wob * 0.3) * 0.3; sv = sp.spd; if (d < 0.4 + s * 0.35 && m.stung <= 0) { m.stung = 0.8; m.hunger = Math.max(0, m.hunger - 0.08); G.ev.push({ k: 'sting' }); lessonSee(G, 'sting'); } }
    else {      // prey: wander, school, dart; flee a shark that is bigger
      if (sp.kind === 'school' && f.leader && G.fish.includes(f.leader)) { th = Math.atan2(f.leader.z + Math.sin(f.id) * 1.2 - f.z, f.leader.x + Math.cos(f.id) * 1.2 - f.x); sv = f.leader.v * 1.1 + Math.max(0, Math.hypot(f.leader.x - f.x, f.leader.z - f.z) - 2); }
      else th = f.h + Math.sin(f.wob * 0.9 + f.id) * 0.9 * dt * 6;
      if (f.home && G.fish.includes(f.home)) { const hx = f.home.x - f.x, hz = f.home.z - f.z; if (Math.hypot(hx, hz) > 6) th = Math.atan2(hz, hx); }
      if (sp.kind === 'school' && d < 6 + s * 1.5) { const ld = f.leader && G.fish.includes(f.leader) ? f.leader : f; if (!ld.fleeing && R() < 3 * dt) { ld.fleeing = true; } }      // a school feels you coming and turns as one
      if (sp.kind === 'puffer') f.puff = clamp(f.puff + (d < 4 + s ? 2 : -1) * dt, 0, 1);
      if (edible(G, f) && d < 5 + s * 1.5 && (sp.gold || R() < c.flee * 2 * dt + (f.fleeing ? 1 : 0))) { f.fleeing = true; }      // a golden fish always runs: you have to want it
      // a fish you swim straight at darts aside at the last moment: steer after it (a straight line misses)
      if (edible(G, f) && !f.dodge && d < 2.4 + s * 1.2 && d > 0.3) { const dot = -(dx * Math.cos(h) + dz * Math.sin(h)) / d; if ((dot > 0.75 || sp.kind === 'school') && R() < c.dodge * (sp.kind === 'school' ? 1.6 : 1) * dt) { f.dodge = 0.45; f.dh = Math.atan2(-dz, -dx) + (R() < 0.5 ? 1.3 : -1.3); G.ev.push({ k: 'dodge' }); } }
      if (f.dodge > 0) { f.dodge -= dt; th = f.dh; sv = sp.spd * 1.6; if (f.dodge <= 0) f.dodge = -1.2; } else if (f.dodge < 0) f.dodge = Math.min(0, f.dodge + dt);
      if (f.fleeing && !(f.dodge > 0)) { th = Math.atan2(-dz, -dx) + Math.sin(f.wob * 3) * 0.5; sv = sp.spd * (sp.kind === 'dart' ? 1 : 0.8); if (d > 12 + s * 2) f.fleeing = false; }
      if (sp.gold) sv *= 1.0;
    }
    // stay in the bay
    const fr = Math.hypot(f.x, f.z); if (fr > R_BAY - 3) th = Math.atan2(-f.z, -f.x);
    const df = Math.atan2(Math.sin(th - f.h), Math.cos(th - f.h)); const tr = f.dodge > 0 ? 12 : 4; f.h += clamp(df, -tr * dt, tr * dt); f.v += clamp(sv - f.v, -(f.dodge > 0 ? 14 : 6) * dt, (f.dodge > 0 ? 14 : 6) * dt); f.x += Math.cos(f.h) * f.v * dt; f.z += Math.sin(f.h) * f.v * dt;
    // the bite
    if (edible(G, f) && Math.hypot(f.x - mx, f.z - mz) < reach + f.size * 0.4) { eat(G, f); G.fish.splice(i, 1); if (G.over) return; continue; }
    if (f.kind === 'puffer' && f.puff > 0.5 && Math.hypot(f.x - mx, f.z - mz) < reach + f.size * 0.6 && m.stung <= 0) { m.stung = 0.6; G.ev.push({ k: 'spike' }); }
  }
  G.hunted = hunted;
  // the sea fills up again out of sight
  if (!G.lesson) { const prey = G.fish.filter(f => f.sp.kind !== 'hunter' && f.sp.kind !== 'jelly' && !f.sp.gold).length; if (prey < c.prey * 0.8 && R() < dt * 4) { const pl = pool(G).filter(k => SPECIES[k].kind !== 'hunter'); spawn(G, pl[(R() * pl.length) | 0], true); }
    const hn = G.fish.filter(f => danger(G, f)).length; if (hn < huntersNow(G) && R() < dt * 0.3) spawnHunter(G);
    if (!G.fish.some(f => f.sp.gold) && R() < dt * 0.05) spawnGold(G); }
  if (G.lesson) lessonTick(G, dt);
}
function eat(G, f) {
  const m = G.me, v = f.sp.val; m.mouth = 0.25; m.fill += v; m.hunger = clamp(m.hunger + v * 0.12, 0, 1); G.coins += f.sp.gold ? 5 : Math.ceil(v / 2);
  for (const q of G.fish) if (q !== f && q.kind === f.kind && Math.hypot(q.x - f.x, q.z - f.z) < 5) { q.dodge = 0.6; q.dh = Math.atan2(q.z - m.z, q.x - m.x) + (G.rnd() - 0.5) * 1.2; q.fleeing = true; }      // the rest of the school scatters
  const isNew = !G.eaten[f.kind]; G.eaten[f.kind] = (G.eaten[f.kind] || 0) + 1; G.eatenN++;
  G.ev.push({ k: 'eat', kind: f.kind, val: v, gold: !!f.sp.gold, x: f.x, z: f.z, isNew, wasHunter: f.sp.kind === 'hunter' }); lessonSee(G, f.sp.gold ? 'gold' : 'eat');
  while (m.fill >= needOf(G) && m.tier < SIZES.length - 1) { m.fill -= needOf(G); m.tier++; G.best = Math.max(G.best, m.tier); G.ev.push({ k: 'grow', tier: m.tier }); if (!G.lesson && m.tier + 1 >= G.cfg.goal) return finish(G, true); }
}
function finish(G, win, why, by) {
  const m = G.me; G.over = win ? 'won' : 'lost'; const stars = win ? (G.t < 70 + G.N * 4 && m.hunger > 0.5 ? 3 : G.t < 110 + G.N * 6 ? 2 : 1) : 0;
  G.res = { win, why, by, stars, tier: m.tier, goal: G.cfg.goal, fill: m.fill, need: needOf(G), eaten: G.eaten, eatenN: G.eatenN, coins: G.coins + (win ? 4 + Math.ceil(G.N / 3) : 0), time: G.t };
  G.ev.push({ k: win ? 'won' : 'lost', why }); return true;
}
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'eat', title: 'EAT', how: 'Drag your thumb: the shark swims that way. Swim into the small fish (they glow green). Eat five.', need: 5 }],
  2: [{ id: 'escape', title: 'GET AWAY', how: 'A hunter is coming (the red mark). Drag all the way to the edge to dash away until it gives up.', need: 1 }],
  3: [{ id: 'gold', title: 'THE GOLDEN FISH', how: 'A golden fish is worth three, but it stays near a hunter. Dart in, grab it, dash away.', need: 1 }],
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
function honest(G, o, mem) {
  const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random, m = G.me, s = sizeOf(G);
  if (G.over || G.wait > 0) { setStick(G, 0, 0); return; }
  if (G.t < (mem.next || 0)) return; mem.next = G.t + 0.05 + react * 0.35;
  let fx = 0, fz = 0, threat = 0;
  for (const f of G.fish) { if (!danger(G, f) && !(f.sp.kind === 'jelly')) continue; const dx = m.x - f.x, dz = m.z - f.z, d = Math.hypot(dx, dz) || 1, w = f.sp.kind === 'jelly' ? (d < 4 ? 1 / d : 0) : f.state !== 'calm' ? 14 / d : d < 10 ? 4 / d : 0; fx += dx / d * w; fz += dz / d * w; if (f.sp.kind !== 'jelly' && f.state !== 'calm' && d < 18) threat = Math.max(threat, 1); }
  if (R() > acc && threat) { fx *= 0.3; fz *= 0.3; }      // a moment of panic: a thumb is not perfect
  const rr = Math.hypot(m.x, m.z); if (rr > R_BAY - 12) { fx -= m.x / rr * 0.8; fz -= m.z / rr * 0.8; }
  if (threat) { setStick(G, fx * 3, fz * 3); const L = Math.hypot(G.stick.x, G.stick.z); if (L > 0.01) setStick(G, G.stick.x / L, G.stick.z / L); return; }
  let best = null, bs = -1e9;
  for (const f of G.fish) { if (!edible(G, f)) continue; const d = Math.hypot(f.x - m.x, f.z - m.z); let risk = 0; for (const h of G.fish) if (danger(G, h)) { const dh = Math.hypot(h.x - f.x, h.z - f.z); if (dh < 10) risk += (10 - dh) * (h.state === 'calm' ? 0.3 : 1.5); }
    const sc = f.sp.val * 3 / (d + 4) - risk * 0.15 - (f.sp.kind === 'dart' && d > 8 ? 0.2 : 0) - (f.kind === 'puffer' && m.dash < 0.4 ? 0.5 : 0); if (sc > bs) { bs = sc; best = f; } }
  if (!best) { setStick(G, -m.x / (rr || 1) * 0.6 + fx, -m.z / (rr || 1) * 0.6 + fz); return; }
  const d = Math.hypot(best.x - m.x, best.z - m.z), lead = Math.min(0.5, d / 10), tx = best.x + Math.cos(best.h) * best.v * lead - m.x, tz = best.z + Math.sin(best.h) * best.v * lead - m.z, L = Math.hypot(tx, tz) || 1;
  const dash = (best.fleeing && d < 8 && m.dash > 0.35) || (best.kind === 'puffer' && d < 7 && m.dash > 0.2) || (best.sp.gold && d < 10 && m.dash > 0.3);
  setStick(G, tx / L * (dash ? 1 : 0.8) + fx * 0.6, tz / L * (dash ? 1 : 0.8) + fz * 0.6);
}
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.me.tier = G.cfg.goal - 1; finish(G, true); }
