// ===================== RULES: Horde (game 29) =====================
// Night falls on a clearing and the monsters come from every side. You move with one thumb (a floating stick); your hero
// attacks by himself with every weapon he carries. Fallen monsters drop crystals: walk over them to gain experience. At each
// level-up the night stops and you pick one of three: a new weapon (sword, magic bolt, orbiting blades, holy aura, lightning,
// throwing axes) or a better one, or a blessing (might, haste, swiftness, a bigger heart, a magnet, armour). Survive until the
// bell, then the BOSS comes: kill it and the night is won. Gold from the night buys upgrades that stay; rank by gold earned.
// Monsters: bats (fast, weak), zombies, skeletons, archers (they stop and draw their bows: a red line shows where the arrow
// will fly), ghosts (through walls of others), brutes (huge). Bosses: the Bone King, the Swamp Hag, the Iron Golem by turn.
// World: metres; x across the screen, z down it (the camera looks up the screen, towards -z). Screen right is world +x.

const RULES = [
  '<b>Drag anywhere</b> to move: your thumb is the stick. Your hero <b>attacks by himself</b>.',
  'Walk over the <b>crystals</b> the monsters drop. Fill the bar to level up and <b>pick one of three</b> powers.',
  '<b>Archers</b> draw their bows first: a red line shows where the arrow will fly. Step out of it.',
  'Keep moving: standing still in a crowd is how heroes fall.',
  'Light the <b>three beacons</b> (stand by each until it burns), then <b>kill the boss</b>. Gold buys upgrades that stay.',
];
const HALF = 34;
const WEAPONS = {
  sword: { name: 'Sword', icon: '🗡️', desc: ['A wide swing in front of you.', 'Bigger swing, more damage.', 'Swings faster.', 'Swings behind you too.', 'A huge, deadly sweep.'] },
  bolt: { name: 'Magic bolt', icon: '✨', desc: ['Fires at the nearest monster.', 'More damage.', 'Two bolts.', 'Faster, and bolts pierce.', 'Three bolts, more damage.'] },
  orbit: { name: 'Blades', icon: '🌀', desc: ['A blade circles you.', 'Two blades.', 'Three blades, more damage.', 'Four blades, wider.', 'Five blades, faster.'] },
  aura: { name: 'Holy aura', icon: '🔆', desc: ['Burns monsters close to you.', 'Wider.', 'Hotter.', 'Wider and hotter.', 'Slows what it burns.'] },
  bolt2: { name: 'Lightning', icon: '⚡', desc: ['Strikes a monster every few seconds.', 'Strikes two.', 'More damage.', 'Strikes three, faster.', 'Strikes five.'] },
  axe: { name: 'Axes', icon: '🪓', desc: ['Throws an axe high over the crowd.', 'More damage.', 'Two axes.', 'Bigger axes.', 'Three axes.'] },
};
const PASSIVES = {
  might: { name: 'Might', icon: '💪', desc: 'Everything hits 15% harder.' }, haste: { name: 'Haste', icon: '⏱️', desc: 'Weapons strike 8% sooner.' },
  swift: { name: 'Swiftness', icon: '👟', desc: 'You move 8% faster.' }, heart: { name: 'Big heart', icon: '❤️', desc: '+25 health, healed now.' },
  magnet: { name: 'Magnet', icon: '🧲', desc: 'Crystals come to you from further.' }, armour: { name: 'Armour', icon: '🛡️', desc: 'Take 10% less damage.' },
};
const FOES = {
  bat: { name: 'Bat', hp: 7, v: 4.4, dmg: 3, xp: 1, r: 0.35 }, zombie: { name: 'Zombie', hp: 18, v: 2.3, dmg: 5, xp: 1, r: 0.45 },
  skel: { name: 'Skeleton', hp: 30, v: 3.0, dmg: 6, xp: 2, r: 0.45 }, archer: { name: 'Archer', hp: 22, v: 2.8, dmg: 6, xp: 2, r: 0.45, ranged: true },
  ghost: { name: 'Ghost', hp: 26, v: 3.6, dmg: 6, xp: 2, r: 0.45, phase: true }, brute: { name: 'Brute', hp: 140, v: 2.4, dmg: 9, xp: 7, r: 0.9 },
  boss: { name: 'BOSS', hp: 420, v: 2.6, dmg: 12, xp: 0, r: 1.6, boss: true },
};
const WEIGHT = { zombie: 3, bat: 2, skel: 2, archer: 0.9, ghost: 0.8, brute: 0.2 };
const BOSSES = ['The Bone King', 'The Swamp Hag', 'The Iron Golem'];
const UPGRADES = [
  { id: 'might', name: 'Might', desc: 'All your weapons hit harder.', max: 5, cost: l => 15 + l * 15 },
  { id: 'vital', name: 'Vitality', desc: 'Start with more health.', max: 5, cost: l => 12 + l * 12 },
  { id: 'speed', name: 'Swift boots', desc: 'Move faster.', max: 3, cost: l => 20 + l * 20 },
  { id: 'greed', name: 'Greed', desc: 'Monsters drop more gold.', max: 3, cost: l => 20 + l * 25 },
  { id: 'reach', name: 'Long reach', desc: 'Pick up crystals from further.', max: 3, cost: l => 15 + l * 15 },
  { id: 'revive', name: 'Phoenix feather', desc: 'Rise once with half your health.', max: 1, cost: () => 120 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Squire'], [80, 'Watchman'], [250, 'Monster hunter'], [600, 'Slayer'], [1400, 'Champion'], [3000, 'Legend of the night']];
const PLACES = [{ name: 'The graveyard', ground: 0x3a4a32 }, { name: 'The dead forest', ground: 0x2e3a26 }, { name: 'The swamp', ground: 0x34402a }, { name: 'The bone desert', ground: 0x8a7a5a }];
const placeOf = N => Math.floor((N - 1) / 5) % 4;
const WEATHERS = ['dusk', 'night', 'storm', 'mist', 'dusk', 'night'];
function weatherOf(N) { if (N <= 3) return ['dusk', 'dusk', 'night'][N - 1]; const R = rng(N * 6151 + 3); R(); return WEATHERS[(R() * WEATHERS.length) | 0]; }
function kindsOf(N) { const k = ['zombie', 'bat']; if (N >= 2) k.push('skel'); if (N >= 3) k.push('archer'); if (N >= 5) k.push('ghost'); if (N >= 4) k.push('brute'); return k; }

function makeCfg(N, help) {
  const f = curve(N), e = easyOf(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s));
  return { N, f, e, help: !!help,
    hp: 160 + 20 * upLv('vital'), speed: 5.0 * (1 + 0.06 * upLv('speed')), might: 1 + 0.1 * upLv('might'), reach: 1.6 * (1 + 0.3 * upLv('reach')), gold: 0.05 * (1 + 0.4 * upLv('greed')), revive: upLv('revive'),
    time: Math.round(x(60, 120, 40)), light: x(3, 4.5, 40), rate: x(0.7, 1.25, 100) * (help ? 0.8 : 1), hpX: x(1, 1.6, 100) * (help ? 0.85 : 1), vX: x(1, 1.18, 30), grow: x(0.9, 1.6, 30),
    elite: x(0.0, 0.05, 60), bossHp: x(1, 3.5, 50) * (help ? 0.85 : 1), cap: Math.round(x(35, 75, 100)), aim: x(1.0, 0.7, 30) };
}
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null,
    weather: weatherOf(N), place: placeOf(N), clock: 0, boss: null, bossDown: false,
    me: { x: 0, z: 0, vx: 0, vz: 0, h: Math.PI, hp: cfg.hp, max: cfg.hp, inv: 0, lv: 1, xp: 0, need: 6, revive: cfg.revive, face: Math.PI },
    beacons: [], weapons: { sword: 1 }, pass: {}, cds: {}, foes: [], shots: [], gems: [], coins: 0, gold: 0, kills: 0, spawnB: 0, id: 0, choice: null, in: { x: 0, z: 0 }, fx: [], dmgTaken: 0 };
  placeBeacons(G); if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G);
  return G;
}
// three beacons round the clearing: light them all (stand by each for a few seconds) and the boss comes
function placeBeacons(G) { const R = G.rnd, n = 3; G.beacons = []; const a0 = R() * TAU; for (let i = 0; i < n; i++) { const a = a0 + i * TAU / n + (R() - 0.5) * 0.8, r = 10 + R() * 7; G.beacons.push({ x: clamp(Math.sin(a) * r, -HALF + 4, HALF - 4), z: clamp(Math.cos(a) * r, -HALF + 4, HALF - 4), p: 0, lit: false }); } }
// ---------- the thumb ----------
function stick(G, x, z) { const m = Math.hypot(x, z); G.in.x = m > 1 ? x / m : x; G.in.z = m > 1 ? z / m : z; }
function choose(G, i) { const C = G.choice; if (!C || G.over) return false; const o = C.opts[i]; if (!o) return false; G.choice = null;
  if (o.w) G.weapons[o.w] = (G.weapons[o.w] || 0) + 1; else { G.pass[o.p] = (G.pass[o.p] || 0) + 1; if (o.p === 'heart') { G.me.max += 25; G.me.hp = Math.min(G.me.max, G.me.hp + 40); } }
  G.ev.push({ k: 'pick', o }); lessonSee(G, 'pick'); return true; }
function offer(G) {
  const R = G.rnd, opts = [], W = Object.keys(G.weapons), P = Object.keys(G.pass);
  for (const w in WEAPONS) { const l = G.weapons[w] || 0; if (l >= 5) continue; if (!l && W.length >= 4) continue; opts.push({ w, lv: l + 1, weight: l ? 3 : 2 }); }
  for (const p in PASSIVES) { const l = G.pass[p] || 0; if (l >= 5) continue; if (!l && P.length >= 4) continue; opts.push({ p, lv: l + 1, weight: 1.4 }); }
  const out = []; while (out.length < 3 && opts.length) { let tot = opts.reduce((a, o) => a + o.weight, 0), u = R() * tot, i = 0; while (u > opts[i].weight) { u -= opts[i].weight; i++; } out.push(opts.splice(i, 1)[0]); }
  if (!out.length) { G.me.hp = Math.min(G.me.max, G.me.hp + 30); return; }
  G.choice = { opts: out }; G.ev.push({ k: 'levelup', lv: G.me.lv });
}
// ---------- monsters ----------
function spawn(G, kind, elite) {
  const c = G.cfg, R = G.rnd, me = G.me, F = FOES[kind]; let x, z, n = 0; do { const a = R() * TAU, r = 15 + R() * 4; x = me.x + Math.sin(a) * r; z = me.z + Math.cos(a) * r; n++; } while ((Math.abs(x) > HALF - 1 || Math.abs(z) > HALF - 1) && n < 20);
  x = clamp(x, -HALF + 1, HALF - 1); z = clamp(z, -HALF + 1, HALF - 1);
  const hp = F.boss ? F.hp * c.bossHp : F.hp * c.hpX * (1 + G.clock / 200) * (elite ? 4 : 1);
  const f = { id: ++G.id, k: kind, x, z, hp, max: hp, v: F.v * c.vX * (elite ? 0.9 : 1), r: F.r * (elite ? 1.3 : 1), elite: !!elite, hit: 0, draw: 0, aim: 0, cd: 1 + R() * 2, slow: 0, wob: R() * 6 };
  G.foes.push(f); return f;
}
function hurtFoe(G, f, d, kx, kz) {
  if (f.dead || d <= 0) return; d *= G.cfg.might * (1 + 0.15 * (G.pass.might || 0)); f.hp -= d; f.hit = 0.12; if (kx != null && !FOES[f.k].boss) { f.x += kx * (f.elite ? 0.1 : 0.35); f.z += kz * (f.elite ? 0.1 : 0.35); }
  G.fx.push({ k: 'num', x: f.x, z: f.z, v: Math.round(d), t: 0 }); if (G.fx.length > 60) G.fx.shift();
  if (f.hp <= 0) { f.dead = true; G.kills++; const F = FOES[f.k];
    if (F.boss) { G.bossDown = true; G.ev.push({ k: 'bossdown', x: f.x, z: f.z }); G.gold += 25; return; }
    { const a = G.rnd() * TAU, r = 1.6 + G.rnd() * 1.8; G.gems.push({ x: clamp(f.x + Math.sin(a) * r, -HALF + 1, HALF - 1), z: clamp(f.z + Math.cos(a) * r, -HALF + 1, HALF - 1), v: F.xp * 3 * (f.elite ? 5 : 1), t: 0 }); }      // crystals spill away from where it fell: go and get them if (G.rnd() < G.cfg.gold * (f.elite ? 6 : 1)) G.gems.push({ x: f.x + 0.3, z: f.z, gold: 1 });
    G.ev.push({ k: 'kill', foe: f.k, x: f.x, z: f.z, elite: f.elite }); lessonSee(G, 'kill'); }
}
function hurtMe(G, d, why) {
  const me = G.me; if (me.inv > 0 || G.over) return; d *= 1 - 0.1 * (G.pass.armour || 0); me.hp -= d; me.inv = 0.75; G.dmgTaken += d; (G.dmgBy = G.dmgBy || {})[why] = Math.round((G.dmgBy[why] || 0) + d); G.ev.push({ k: 'hurt', d, why });
  if (me.hp <= 0) { if (G.lesson) { me.hp = me.max; lessonMiss(G, 'fell'); return; } if (me.revive > 0) { me.revive--; me.hp = me.max / 2; me.inv = 2.5; G.ev.push({ k: 'revive' }); for (const f of G.foes) if (Math.hypot(f.x - me.x, f.z - me.z) < 6 && !FOES[f.k].boss) { f.x += (f.x - me.x) * 1.5; f.z += (f.z - me.z) * 1.5; } return; } finish(G, false, 'fell'); }
}
// ---------- every frame ----------
const GRID = new Map();
function step(G, dt) {
  if (G.over || G.choice) return; G.t += dt; const c = G.cfg, me = G.me, R = G.rnd, L = lessonNow(G);
  // you
  me.inv = Math.max(0, me.inv - dt); const sp = c.speed * (1 + 0.08 * (G.pass.swift || 0)), tx = G.in.x * sp, tz = G.in.z * sp;
  me.vx += (tx - me.vx) * Math.min(1, dt * 14); me.vz += (tz - me.vz) * Math.min(1, dt * 14); me.x = clamp(me.x + me.vx * dt, -HALF + 0.6, HALF - 0.6); me.z = clamp(me.z + me.vz * dt, -HALF + 0.6, HALF - 0.6);
  if (Math.hypot(me.vx, me.vz) > 0.5) me.face = Math.atan2(me.vx, me.vz); me.hp = Math.min(me.max, me.hp + 0.25 * dt);
  me.still = Math.hypot(me.vx, me.vz) < 1.5 ? (me.still || 0) + dt : Math.max(0, (me.still || 0) - dt * 2);
  if (me.still > 2.5 && !L) { me.still = 1.2; G.ev.push({ k: 'gather' }); G.gathers = (G.gathers || 0) + 1; for (let i = 0; i < Math.min(5, 3 + Math.floor(G.N / 15)); i++) { const a = R() * TAU, f = spawn(G, kindsOf(G.N)[(R() * 2) | 0]); f.x = clamp(me.x + Math.sin(a) * 6, -HALF + 1, HALF - 1); f.z = clamp(me.z + Math.cos(a) * 6, -HALF + 1, HALF - 1); } }      // standing still: the horde gathers round you
  // the night's clock, the bell, the boss
  if (!L) { G.clock += dt;
    let lighting = false; for (const b of G.beacons) { if (b.lit) continue; const d = Math.hypot(me.x - b.x, me.z - b.z); if (d < 2.6) { lighting = true; b.p += dt / c.light; if (b.p >= 1) { b.lit = true; G.ev.push({ k: 'lit', n: G.beacons.filter(q => q.lit).length, of: G.beacons.length }); (G.litT = G.litT || []).push(Math.round(G.clock)); for (let i = 0; i < Math.min(7, 4 + Math.floor(G.N / 12)); i++) { const ks = kindsOf(G.N), f = spawn(G, ks[(R() * ks.length) | 0]), a = R() * TAU; f.x = clamp(b.x + Math.sin(a) * 9, -HALF + 1, HALF - 1); f.z = clamp(b.z + Math.cos(a) * 9, -HALF + 1, HALF - 1); } } } else b.p = Math.max(0, b.p - dt * 0.15); }
    G.lighting = lighting; if (lighting) me.still = 0;
    if (G.beacons.every(b => b.lit) && !G.boss && !G.bossDown) { G.boss = spawn(G, 'boss'); G.boss.name = BOSSES[(G.N - 1) % 3]; G.ev.push({ k: 'boss', name: G.boss.name }); } }
  // spawning: a budget that grows through the night; never more than the cap at once
  if (L) _lessonBoss(G);
  const want = L ? L.rate : c.rate * (1 + c.grow * G.clock / c.time) * (G.boss ? 0.3 : 1);
  G.spawnB += want * dt; const kinds = L ? L.kinds : kindsOf(G.N);
  while (G.spawnB >= 1) { G.spawnB -= 1; if (G.foes.length >= (L ? 18 : c.cap)) break; const wsum = kinds.reduce((a, q) => a + WEIGHT[q], 0); let u = R() * wsum, k = kinds[0]; for (const q of kinds) { u -= WEIGHT[q]; if (u <= 0) { k = q; break; } }
    if (k === 'bat' && R() < 0.7) { for (let i = 0; i < 3; i++) spawn(G, 'bat'); continue; } spawn(G, k, !L && R() < c.elite); }
  // monsters: walk at you (bats flutter, archers stop at range and draw), push apart (a grid of 2 m cells)
  GRID.clear(); for (const f of G.foes) { const key = ((f.x + 50) >> 1) * 100 + ((f.z + 50) >> 1); let a = GRID.get(key); if (!a) GRID.set(key, a = []); a.push(f); }
  for (const f of G.foes) { if (f.dead) continue; const F = FOES[f.k]; f.hit = Math.max(0, f.hit - dt); f.slow = Math.max(0, f.slow - dt);
    let dx = me.x - f.x, dz = me.z - f.z; const d = Math.hypot(dx, dz) || 1; dx /= d; dz /= d; let v = f.v * (f.slow > 0 ? 0.6 : 1);
    if (F.ranged) { f.cd -= dt; if (f.draw > 0) { f.draw -= dt; v = 0; if (f.draw <= 0) { const a = f.aim; G.shots.push({ x: f.x, z: f.z, vx: Math.sin(a) * 10, vz: Math.cos(a) * 10, t: 0, dmg: F.dmg * (f.elite ? 1.5 : 1) * (1 + G.clock / 300) }); G.ev.push({ k: 'arrow' }); } }
      else if (d < 9 && f.cd <= 0) { f.draw = 0.9 * c.aim; f.cd = 3 + R() * 1.5; f.aim = Math.atan2(me.x + me.vx * 0.3 - f.x, me.z + me.vz * 0.3 - f.z); G.ev.push({ k: 'draw' }); }
      else if (d < 6) v = -v * 0.6; }
    if (f.k === 'bat') { const w = Math.sin(G.t * 4 + f.wob) * 0.8; const ox = dx, oz = dz; dx = ox * Math.cos(w) - oz * Math.sin(w); dz = ox * Math.sin(w) + oz * Math.cos(w); }
    if (F.boss) { f.cd -= dt; if (f.slam > 0) { f.slam -= dt; v = 0; if (f.slam <= 0) { G.ev.push({ k: 'slam', x: f.sx, z: f.sz }); if (Math.hypot(me.x - f.sx, me.z - f.sz) < 4) hurtMe(G, 22 * (1 + Math.min(1.5, G.N / 40)), 'slam'); } }
      else if (f.cd <= 0) { f.cd = 4.5 - Math.min(2, G.N * 0.05); if (R() < 0.55) { f.slam = 1.3 * c.aim; f.sx = me.x; f.sz = me.z; G.ev.push({ k: 'raise', x: f.sx, z: f.sz }); } else { for (let i = -2; i <= 2; i++) { const a = Math.atan2(dx, dz) + i * 0.32; G.shots.push({ x: f.x, z: f.z, vx: Math.sin(a) * 7, vz: Math.cos(a) * 7, t: 0, dmg: 14 * (1 + G.N / 25), boss: true }); } G.ev.push({ k: 'volley' }); } } }
    f.x += dx * v * dt; f.z += dz * v * dt;
    if (!F.phase) { const key = ((f.x + 50) >> 1) * 100 + ((f.z + 50) >> 1); for (const o of [0, 1, -1, 100, -100]) { const a = GRID.get(key + o); if (!a) continue; for (const q of a) { if (q === f || q.dead || FOES[q.k].phase) continue; const ex = f.x - q.x, ez = f.z - q.z, m = f.r + q.r, dd = ex * ex + ez * ez; if (dd < m * m && dd > 1e-6) { const s = (m - Math.sqrt(dd)) * 0.5 / Math.sqrt(dd); f.x += ex * s; f.z += ez * s; } } } }
    f.x = clamp(f.x, -HALF + 0.5, HALF - 0.5); f.z = clamp(f.z, -HALF + 0.5, HALF - 0.5);
    if (Math.hypot(me.x - f.x, me.z - f.z) < f.r + 0.45) { const inv = me.inv; hurtMe(G, F.dmg * (f.elite ? 1.5 : 1) * (1 + (F.boss ? 0 : G.clock / 300)), f.k); if (F.boss && inv <= 0) { const ex = me.x - f.x, ez = me.z - f.z, d = Math.hypot(ex, ez) || 1; me.x = clamp(me.x + ex / d * 2.5, -HALF + 0.6, HALF - 0.6); me.z = clamp(me.z + ez / d * 2.5, -HALF + 0.6, HALF - 0.6); me.inv = 0.9; } } }
  // arrows and boss bolts
  for (const s of G.shots) { s.t += dt; s.x += s.vx * dt; s.z += s.vz * dt; if (!s.done && Math.hypot(s.x - me.x, s.z - me.z) < 0.6) { s.done = true; hurtMe(G, s.dmg, 'arrow'); } }
  G.shots = G.shots.filter(s => !s.done && s.t < 2.5);
  if (G.over) return;
  // your weapons
  weapons(G, dt);
  // crystals and gold: within reach they fly to you
  const reach = c.reach * (1 + 0.5 * (G.pass.magnet || 0));
  for (const g of G.gems) { g.t = (g.t || 0) + dt; if (g.t > 18 && !g.fly && !g.gold) { g.got = true; continue; } const d = Math.hypot(g.x - me.x, g.z - me.z); if (d < reach || g.fly) { g.fly = true; g.x += (me.x - g.x) * Math.min(1, dt * 10); g.z += (me.z - g.z) * Math.min(1, dt * 10); }
    if (d < 0.5) { g.got = true; if (g.gold) { G.gold++; G.ev.push({ k: 'gold' }); } else { me.xp += g.v; G.ev.push({ k: 'gem' }); } } }
  G.gems = G.gems.filter(g => !g.got); if (G.gems.length > 400) G.gems.splice(0, G.gems.length - 400);
  G.foes = G.foes.filter(f => !f.dead);
  if (me.xp >= me.need) { me.xp -= me.need; me.lv++; me.need = Math.round(5 + me.lv * 3 + me.lv * me.lv * 0.25); offer(G); }
  if (G.bossDown && !G.over) { if (L) lessonSee(G, 'boss'); else finish(G, true); }
}
function weapons(G, dt) {
  const me = G.me, W = G.weapons, haste = 1 - 0.08 * (G.pass.haste || 0), cd = G.cds; const near = (r, n = 1) => G.foes.filter(f => !f.dead && Math.hypot(f.x - me.x, f.z - me.z) < r).sort((a, b) => Math.hypot(a.x - me.x, a.z - me.z) * (FOES[a.k].boss ? 0.3 : 1) - Math.hypot(b.x - me.x, b.z - me.z) * (FOES[b.k].boss ? 0.3 : 1)).slice(0, n);      // the boss first, when in reach
  for (const k in cd) cd[k] -= dt;
  if (W.sword) { const l = W.sword; if ((cd.sword || 0) <= 0) { cd.sword = (l >= 3 ? 0.75 : 1.0) * haste; const R2 = 2.3 + l * 0.25, n1 = near(R2 + 1, 1)[0], face = n1 ? Math.atan2(n1.x - me.x, n1.z - me.z) : me.face, arcs = l >= 4 ? [face, face + Math.PI] : [face];
      for (const a of arcs) { G.fx.push({ k: 'slash', x: me.x, z: me.z, a, r: R2, t: 0 }); for (const f of G.foes) { if (f.dead) continue; const dx = f.x - me.x, dz = f.z - me.z, d = Math.hypot(dx, dz); if (d > R2 + f.r) continue; let da = Math.atan2(dx, dz) - a; da = Math.atan2(Math.sin(da), Math.cos(da)); if (Math.abs(da) < 1.1 || d < 1) hurtFoe(G, f, 12 + l * 7, dx / (d || 1), dz / (d || 1)); } }
      G.ev.push({ k: 'swing' }); } }
  if (W.bolt) { const l = W.bolt; if ((cd.bolt || 0) <= 0) { cd.bolt = (l >= 4 ? 0.8 : 1.1) * haste; const n = l >= 5 ? 3 : l >= 3 ? 2 : 1; near(11, n).forEach(f => G.fx.push({ k: 'bolt', x: me.x, z: me.z, tx: f.x, tz: f.z, t: 0, id: f.id, dmg: 10 + l * 5 + (l >= 5 ? 8 : 0), pierce: l >= 4 })); if (n) G.ev.push({ k: 'zap' }); } }
  if (W.orbit) { const l = W.orbit, n = l, r = 2.2 + (l >= 4 ? 0.6 : 0), spin = l >= 5 ? 4.5 : 3.2; G.orbA = (G.orbA || 0) + dt * spin; for (let i = 0; i < n; i++) { const a = G.orbA + i * TAU / n, bx = me.x + Math.sin(a) * r, bz = me.z + Math.cos(a) * r; for (const f of G.foes) { if (f.dead || (f.ohit || 0) > G.t) continue; if (Math.hypot(f.x - bx, f.z - bz) < f.r + 0.5) { f.ohit = G.t + 0.45; hurtFoe(G, f, 8 + l * 4, (f.x - me.x) / r, (f.z - me.z) / r); } } } }
  if (W.aura) { const l = W.aura, r = 1.8 + (l >= 2 ? 0.4 : 0) + (l >= 4 ? 0.4 : 0), dps = 9 + (l >= 3 ? 7 : 0) + (l >= 4 ? 5 : 0); if ((cd.aura || 0) <= 0) { cd.aura = 0.3; for (const f of G.foes) if (!f.dead && Math.hypot(f.x - me.x, f.z - me.z) < r + f.r) { hurtFoe(G, f, dps * 0.3); if (l >= 5) f.slow = 0.5; } } }
  if (W.bolt2) { const l = W.bolt2; if ((cd.bolt2 || 0) <= 0) { cd.bolt2 = (l >= 4 ? 1.6 : 2.2) * haste; const n = [1, 2, 2, 3, 5][l - 1], pool = near(10, 30); for (let i = 0; i < n && pool.length; i++) { const f = pool.splice((G.rnd() * pool.length) | 0, 1)[0]; G.fx.push({ k: 'strike', x: f.x, z: f.z, t: 0 }); hurtFoe(G, f, 22 + (l >= 3 ? 14 : 0) + l * 4); } G.ev.push({ k: 'thunder' }); } }
  if (W.axe) { const l = W.axe; if ((cd.axe || 0) <= 0) { cd.axe = 1.6 * haste; const n = l >= 5 ? 3 : l >= 3 ? 2 : 1; for (let i = 0; i < n; i++) { const a = me.face + (i - (n - 1) / 2) * 0.5 + (G.rnd() - 0.5) * 0.3; G.fx.push({ k: 'axe', x: me.x, z: me.z, vx: Math.sin(a) * 7, vz: Math.cos(a) * 7, t: 0, dmg: 20 + l * 7, big: l >= 4, hits: {} }); } G.ev.push({ k: 'throw' }); } }
  // things in flight: bolts home in; axes fly in an arc and cut what they pass over
  for (const p of G.fx) { if (p.k === 'bolt') { p.t += dt; const f = G.foes.find(q => q.id === p.id); if (f && !f.dead) { p.tx = f.x; p.tz = f.z; } const dx = p.tx - p.x, dz = p.tz - p.z, d = Math.hypot(dx, dz); const s = Math.min(1, 16 * dt / (d || 1)); p.x += dx * s; p.z += dz * s; if (d < 0.4 && !p.done) { p.done = true; if (f && !f.dead) hurtFoe(G, f, p.dmg, dx / (d || 1), dz / (d || 1)); } }
    else if (p.k === 'axe') { p.t += dt; p.x += p.vx * dt; p.z += p.vz * dt; for (const f of G.foes) { if (f.dead || p.hits[f.id]) continue; if (Math.hypot(f.x - p.x, f.z - p.z) < f.r + (p.big ? 0.9 : 0.6)) { p.hits[f.id] = 1; hurtFoe(G, f, p.dmg, p.vx / 7, p.vz / 7); } } if (p.t > 1.2) p.done = true; }
    else { p.t += dt; if (p.t > (p.k === 'num' ? 0.6 : 0.3)) p.done = true; } }
  G.fx = G.fx.filter(p => !p.done);
}
function finish(G, win, why) {
  G.over = win ? 'won' : 'lost'; const c = G.cfg;
  const stars = win ? (G.dmgTaken < G.me.max * 0.5 ? 3 : G.dmgTaken < G.me.max * 1.2 ? 2 : 1) : 0;
  G.res = { win, why, stars, kills: G.kills, lv: G.me.lv, gold: G.gold + (win ? stars * 4 + Math.ceil(G.N / 2) : Math.floor(G.clock / 20)), time: G.clock, combo: G.kills };
  G.ev.push({ k: win ? 'won' : 'lost', why });
}
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'move', title: 'MOVE, AND LET HIM FIGHT', say: 'DRAG TO MOVE', do: 'drag', dir: 'lr', at: G => [W / 2, H * 0.7], how: 'Drag anywhere to move. Your sword swings by itself. Walk over the blue crystals the monsters drop. Fill the bar.', need: 1, ok: w => w === 'pick', kinds: ['zombie', 'bat'], rate: 0.8 }],
  2: [{ id: 'pick', title: 'PICK YOUR POWER', say: 'PICK ONE', do: 'tap', how: 'Each level-up, pick one of three: a new weapon, a better one, or a blessing. Level up twice.', need: 2, ok: w => w === 'pick', kinds: ['zombie', 'skel', 'bat'], rate: 1 }],
  3: [{ id: 'arrows', title: 'ARCHERS AND THE BOSS', say: 'STEP OUT OF THE RED', do: 'drag', dir: 'lr', at: G => [W / 2, H * 0.7], how: 'Archers draw first: a red line shows where the arrow will fly. Step out of it. Then beat the boss.', need: 1, ok: w => w === 'boss', kinds: ['archer', 'zombie'], rate: 0.8, boss: 12 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0, miss: 0 }; G.ev.push({ k: 'lessonnext', first: true }); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonSee(G, what) {
  const D = G.lesson; if (!D) return; const st = D.steps[D.i]; if (!st.ok(what)) return;
  D.n++; if (D.n < st.need) { G.ev.push({ k: 'lessonok', n: D.n, need: st.need }); return; }
  D.i++; D.n = 0; D.miss = 0;
  if (D.i >= D.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); const me = G.me; Object.assign(me, { x: 0, z: 0, hp: G.cfg.hp, max: G.cfg.hp, lv: 1, xp: 0, need: 6 }); Object.assign(G, { weapons: { sword: 1 }, pass: {}, cds: {}, foes: [], shots: [], gems: [], fx: [], clock: 0, boss: null, bossDown: false, kills: 0, gold: 0, dmgTaken: 0, choice: null }); }
  else G.ev.push({ k: 'lessonnext' });
}
function lessonMiss(G, why) { const D = G.lesson; if (!D) return; D.miss++; G.ev.push({ k: 'lessonmiss', why, how: 'You fell: keep moving, away from the crowd, and pick up crystals at its edge.' }); for (const f of G.foes) if (Math.hypot(f.x - G.me.x, f.z - G.me.z) < 8) f.dead = true; }
// the lesson's boss: in lesson 3 it comes after a little while
const _lessonBoss = G => { const L = lessonNow(G); if (L && L.boss && !G.boss && G.t > L.boss) { G.boss = spawn(G, 'boss'); G.boss.hp = G.boss.max = 350; G.boss.name = BOSSES[0]; G.ev.push({ k: 'boss', name: G.boss.name }); } };

// ---------- for the robots ----------
// BLIND: the stick held one of four ways, let go, a power picked without reading
const BLIND = { n: G => stick(G, 0, -1), s: G => stick(G, 0, 1), e: G => stick(G, 1, 0), w: G => stick(G, -1, 0), o: G => stick(G, 0, 0), c: G => choose(G, (Math.random() * 3) | 0) };
// a hero who looks: keeps out of the crowd and out of arrows' lines, goes for crystals at the crowd's edge, circles the boss
// out of its slam, and picks powers in a sensible order (weapons first, then might and haste)
function honest(G, o, mem) {
  const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, me = G.me, c = G.cfg;
  if (G.choice) {
    const order = ['bolt', 'orbit', 'bolt2', 'aura', 'axe', 'sword', 'might', 'haste', 'heart', 'armour', 'swift', 'magnet'], sc = op => { const key = op.w || op.p; return order.indexOf(key) + (op.w && G.weapons[op.w] ? -3 : 0); };
    const opts = G.choice.opts.map((q, i) => [sc(q), i]).sort((a, b) => a[0] - b[0]); const i = Math.random() > acc ? (Math.random() * opts.length) | 0 : opts[0][1]; choose(G, i); return; }
  if (G.t < (mem.next || 0)) return; mem.next = G.t + 0.06 + react * 0.35;
  if (mem.slip > G.t) return; if (Math.random() > acc + (1 - acc) * 0.85) { mem.slip = G.t + 0.2 + react * 0.5; const a = Math.random() * TAU; stick(G, Math.sin(a), Math.cos(a)); return; }
  let bx = 0, bz = 0, bs = -1e9;
  for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, ux = Math.sin(a), uz = Math.cos(a), px = me.x + ux * c.speed * 0.6, pz = me.z + uz * c.speed * 0.6; let sc = 0;
    for (const f of G.foes) { const d0 = Math.hypot(f.x - px, f.z - pz), d = Math.max(0.05, d0 - Math.min(d0 * 0.8, f.v * 0.5)) - f.r; if (FOES[f.k].boss) { if (d < 1.5) sc -= 15 / Math.max(0.3, d); if (!(f.slam > 0)) sc -= Math.abs(d - 2.4) * 0.6; continue; } if (d < 6) sc -= (f.elite ? 6 : 2) / Math.max(0.3, d) ** 1.5; }
    for (const s of G.shots) { const ex = px - s.x, ez = pz - s.z, along = (ex * s.vx + ez * s.vz) / 10, side = Math.abs(ex * s.vz - ez * s.vx) / 10; if (along > -0.5 && side < 1.2) sc -= 20; }
    for (const f of G.foes) if (f.draw > 0) { const ex = px - f.x, ez = pz - f.z, along = ex * Math.sin(f.aim) + ez * Math.cos(f.aim), side = Math.abs(ex * Math.cos(f.aim) - ez * Math.sin(f.aim)); if (along > 0 && side < 1.3) sc -= 25; }
    for (const f of G.foes) if (f.slam > 0) { const d = Math.hypot(px - f.sx, pz - f.sz); if (d < 5) sc -= 20 + (5 - d) * 15; }
    let gn = 0; for (const g of G.gems) { const d = Math.hypot(g.x - px, g.z - pz); if (d < 7) gn += (g.gold ? 1 : g.v) / (1 + d); } sc += gn * (me.hp > me.max * 0.5 ? 3 : 1.5);
    const w = HALF - Math.max(Math.abs(px), Math.abs(pz)); if (w < 6) sc -= (6 - w) * 2;
    const bc = !G.boss && G.beacons.filter(q => !q.lit).sort((a, b) => Math.hypot(a.x - me.x, a.z - me.z) - Math.hypot(b.x - me.x, b.z - me.z))[0]; if (bc && me.hp > me.max * 0.25 && me.lv >= Math.min(4, 1 + G.beacons.filter(q => q.lit).length)) { const d = Math.hypot(px - bc.x, pz - bc.z); sc -= d * 1.4; if (d < 2.2) sc += 6; }
    if (sc > bs) { bs = sc; bx = ux; bz = uz; } }
  stick(G, bx, bz);
}
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.choice = null; G.bossDown = true; finish(G, true); }
