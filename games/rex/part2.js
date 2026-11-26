// ===================== RULES: Rex (game 51, his idea) =====================
// You are a Tyrannosaurus in a wide green valley: ferns, pines, a watering hole, a cave in the cliffs, the nesting ground of a
// rival. Your left thumb walks you (one floating stick: push the way you want to go on the screen, far to charge); the right
// thumb has BITE and ROAR. Every level gives you a near goal: eat certain prey, or beat a rival. Prey notice you sooner when
// you charge (your footsteps shake the ground) and later when you creep. Each kind lives its own way:
//  - runners: small and quick, dart off in zigzags; one bite.
//  - duckbills: herds at the water; they bolt together; two bites.
//  - spikebacks (armoured): never run; they turn their club tail to you and swing it (the tail lifts first): bite the head.
//  - hornfaces: charge you (they paw and lower their heads first): step aside, then bite the side while they are stuck.
//  - rival rexes: circle you; they rear and roar before they lunge: step out of the line, then bite while they recover.
// ROAR freezes small prey near you for a moment and makes a rival flinch; it needs time to come back. Your hunger falls all
// the time; eating fills it. Empty, you weaken. Health gone: the valley has a new king.
// World: metres; x across, z ahead; heading h, forward is (sin h, cos h).
const RULES = [
  '<b>Left thumb</b>: push the way you want to go, far to <b>charge</b>. Creep up: prey hear a charge from far off.',
  '<b>BITE</b> when they are in front of your jaws. <b>ROAR</b> freezes small prey near you, and makes a rival flinch.',
  '<b>Watch for the warning</b>: a tail that lifts, a head that lowers, a rival that rears. Step out of the way, then bite.',
  'Spikebacks: bite the <b>head</b>. Hornfaces and rivals: bite them while they <b>recover</b> from their charge.',
  'Do the level\'s <b>goal</b>. Keep your <b>hunger</b> up: eat, or weaken.',
];
const KINDS = {
  runner: { name: 'Runner', hp: 1, sp: 10, food: 18, alert: 17, n: 1, flee: true, zig: true, size: 0.45 },
  duck: { name: 'Duckbill', hp: 2, sp: 8.4, food: 32, alert: 24, n: 2, flee: true, herd: true, size: 0.9 },
  spike: { name: 'Spikeback', hp: 3, sp: 2.2, food: 48, alert: 14, n: 4, armour: true, size: 1 },
  horns: { name: 'Hornface', hp: 3, sp: 5, food: 58, alert: 20, n: 6, charger: true, size: 1.1 },
  rival: { name: 'Rival rex', hp: 6, sp: 7, food: 0, alert: 40, n: 3, rival: true, size: 1 },
};
const WEATHERS = ['morning', 'golden', 'noon', 'mist', 'overcast', 'rain', 'dusk', 'storm', 'sunset', 'dawn'];
function weatherOf(N) { if (N <= 3) return ['morning', 'golden', 'noon'][N - 1]; const R = rng(N * 7919 + 3); R(); return WEATHERS[(R() * WEATHERS.length) | 0]; }
const PLACES = [{ name: 'Fern Valley' }, { name: 'Red Canyon' }, { name: 'Misty Lowlands' }, { name: 'Volcano Rim' }];
const placeOf = N => Math.min(3, Math.floor((N - 1) / 6));
const SPOTS = { water: { x: 40, z: 60, r: 16, name: 'the watering hole' }, cave: { x: -70, z: 95, r: 8, name: 'the cave' }, nest: { x: 15, z: 140, r: 14, name: 'the nesting ground' }, ferns: { x: -40, z: 20, r: 18, name: 'the fern brakes' } };
const BOUND = 150;
const UPGRADES = [
  { id: 'jaws', name: 'Bone-crusher jaws', desc: 'Bites hit 25% harder.', max: 2, cost: l => 35 + l * 45 },
  { id: 'legs', name: 'Long stride', desc: 'Your charge lasts longer.', max: 2, cost: l => 30 + l * 40 },
  { id: 'hide', name: 'Thick hide', desc: 'You take less damage.', max: 2, cost: l => 35 + l * 45 },
  { id: 'lungs', name: 'Thunder lungs', desc: 'Roar comes back sooner and reaches further.', max: 2, cost: l => 30 + l * 40 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Hatchling'], [40, 'Juvenile'], [130, 'Hunter'], [320, 'Alpha'], [700, 'Tyrant'], [1500, 'King of the Valley']];
function hgt(x, z) { const d = Math.hypot(x - SPOTS.water.x, z - SPOTS.water.z); let h = Math.sin(x * 0.03) * 2 + Math.cos(z * 0.025) * 2.5 + Math.sin((x + z) * 0.012) * 3; if (d < 26) h -= (1 - d / 26) * (1 - d / 26) * 6; const e = Math.max(Math.abs(x), Math.abs(z - 60)); if (e > 120) h += (e - 120) * 0.5; return h; }
// the levels' goals: eat some of a kind (where to find them), or beat a rival; later several at once
function goalsOf(N) { const boss = N % 10 === 0;
  if (N === 1) return [{ k: 'runner', n: 2 }]; if (N === 2) return [{ k: 'duck', n: 1 }]; if (N === 3) return [{ k: 'rival', n: 1 }];
  const R = rng(N * 104729 + 17), kinds = ['runner', 'duck'].concat(N >= 4 ? ['spike'] : [], N >= 6 ? ['horns'] : []), out = [];
  const a = kinds[(R() * kinds.length) | 0]; out.push({ k: a, n: a === 'runner' ? 2 + (R() * 2 | 0) : a === 'duck' ? 1 + (N >= 8 ? 1 : 0) : 1 });
  if (N >= 5 && !boss) { const b = kinds.filter(q => q !== a)[(R() * (kinds.length - 1)) | 0]; out.push({ k: b, n: 1 }); }
  if (boss || (N >= 7 && R() < 0.4)) out.push({ k: 'rival', n: 1, big: boss });
  return out; }
function makeCfg(N, help) { const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), e = easyOf(N);
  return { N, f, help: !!help, place: placeOf(N), weather: weatherOf(N), goals: goalsOf(N), hungerT: x(140, 122, 30) * (help ? 1.25 : 1), alertK: x(0.85, 1.3, 30), preySp: x(0.92, 1.15, 30), tell: x(1.15, 0.7, 30) * (help ? 1.25 : 1),
    rivalHp: x(5, 7, 30), rivalDmg: x(18, 25, 30) * (1 - 0.15 * upLv('hide')), dmgK: 1 - 0.15 * upLv('hide'), bite: 1 + 0.25 * upLv('jaws'), stam: 4.2 * (1 + 0.25 * upLv('legs')), wind: x(2.6, 4.4, 30), puffT: x(2.6, 1.5, 30) * (help ? 1.25 : 1), puffK: x(0.5, 0.68, 30), roarCD: 10 / (1 + 0.25 * upLv('lungs')), roarR: 20 * (1 + 0.15 * upLv('lungs')), extra: Math.round(x(4, 9, 30)) }; }
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, place: cfg.place, weather: cfg.weather, wait: 0, nid: 1,
    me: { x: 0, z: -20, h: 0, v: 0, hp: 100, hunger: 100, stam: cfg.stam, bite: 0, bcd: 0, roarCD: 0, hit: 0, eatT: 0, eatId: 0 }, in: { sx: 0, sy: 0, ref: 0, run: false }, dinos: [], got: {}, eaten: 0, bites: 0, hits: 0, wins: 0 };
  spawnAll(G); if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else G.ev.push({ k: 'start' });
  return G; }
function mk(G, k, x, z, o = {}) { const K = KINDS[k], d = Object.assign({ id: G.nid++, k, x, z, h: G.rnd() * TAU, v: 0, hp: K.hp * (k === 'rival' ? G.cfg.rivalHp / 6 : 1), max: 0, state: 'idle', t: 0, alerted: false, zig: 0, tell: 0, tired: 0, lunge: 0, freeze: 0, wind: null, puff: 0, dead: false, eat: 0, hx: x, hz: z }, o); if (k === 'rival' && o.big) d.hp *= 1.4; d.max = d.hp; G.dinos.push(d); return d; }
// the valley's animals: the goal's prey where they live, and others about
function spawnAll(G) { const R = G.rnd, c = G.cfg, near = (s, r) => { const a = R() * TAU, q = Math.sqrt(R()) * r; return [s.x + Math.cos(a) * q, s.z + Math.sin(a) * q]; };
  const home = { runner: SPOTS.ferns, duck: SPOTS.water, spike: { x: 70, z: 110, r: 20 }, horns: { x: -60, z: 140, r: 22 }, rival: SPOTS.nest };
  const add = (k, n, o) => { for (let i = 0; i < n; i++) { const s = home[k], [x, z] = k === 'duck' ? near(s, s.r * 0.9 + 6) : near(s, s.r); mk(G, k, x, z, o); } };
  for (const g of c.goals) { if (g.k === 'duck') add('duck', Math.max(4, g.n + 3)); else if (g.k === 'rival') add('rival', 1, { big: g.big }); else add(g.k, g.n + 1); }
  // others about the valley (not the rival)
  const kinds = ['runner', 'duck'].concat(G.N >= 4 ? ['spike'] : [], G.N >= 6 ? ['horns'] : []); for (let i = 0; i < c.extra; i++) { const k = kinds[(R() * kinds.length) | 0]; let [x, z] = near({ x: 0, z: 60 }, 110); if (Math.hypot(x, z + 20) < 35) { x += 40 * Math.sign(x || 1); z += 30; } mk(G, k, x, z); }
  // a few runners in the cave (a place to find)
  for (let i = 0; i < 2; i++) { const [x, z] = near(SPOTS.cave, 5); mk(G, 'runner', x, z, { cave: true }); } }
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const angTo = (a, b) => Math.atan2(b.x - a.x, b.z - a.z);
const wrapA = a => Math.atan2(Math.sin(a), Math.cos(a));
const goalLeft = G => G.cfg.goals.map(g => ({ k: g.k, left: g.n - (G.got[g.k] || 0) })).filter(g => g.left > 0);
// ---------- what you do ----------
// 23 Nov 2026 (his words: "the movements are not accurate at all. The joystick is not working, I go left it goes somewhere else"): the stick
// says where to go as seen on the screen, not how to turn. ref is the heading that up on the stick means (the view's heading when the thumb
// came down); the rex turns towards the stick's way (a heavy beast: a moment to turn round) and walks when he faces it.
function stick(G, sx, sy, ref) { G.in.sx = clamp(sx, -1, 1); G.in.sy = clamp(sy, -1, 1); if (ref != null) G.in.ref = ref; }
function go(G, h, p) { const m = G.me; stick(G, Math.sin(h - m.h) * p, Math.cos(h - m.h) * p, m.h); }      // the robots: walk on heading h, push p
function bite(G) { const m = G.me; if (G.over || G.wait > 0 || m.bcd > 0 || m.hp <= 0 || m.eatT > 0) return false; m.bite = 0.35; m.bcd = 0.75; m.lunge = m.v > 8; G.bites++;      /* a bite at a run is a lunge: he does not slow down to snap */ G.ev.push({ k: 'snap' });
  // what is in front of the jaws
  let best = null, bd = 9; for (const d of G.dinos) { if (d.dead) continue; const r = 4.8 + KINDS[d.k].size * 1.6, dd = dist(m, d), da = Math.abs(wrapA(angTo(m, d) - m.h)); if (dd < r && da < 0.85 && dd < bd) { best = d; bd = dd; } }
  if (!best) { lessonSee(G, 'miss'); return true; }
  const d = best, K = KINDS[d.k]; let dmg = G.cfg.bite, why = null;
  if (K.armour) { const face = Math.abs(wrapA(angTo(d, m) - d.h)); if (face > 1.1) { dmg = 0; why = 'armour'; } }      // only the head is soft
  if (K.charger && d.state !== 'stuck' && d.state !== 'idle' && d.state !== 'graze') { dmg *= 0.5; why = 'horns'; }
  if (K.rival) { if (d.tired > 0) dmg *= 2; else { dmg *= 0.5; hurtMe(G, G.cfg.rivalDmg * 0.35, 'counter'); why = 'counter'; } }
  if (d.freeze > 0 || (K.flee && d.state !== 'flee')) dmg *= 1.2;
  if (dmg <= 0) { G.ev.push({ k: 'deflect', why, x: d.x, z: d.z }); lessonSee(G, 'deflect', d); return true; }
  const wasTired = d.tired > 0; d.hp -= dmg; G.hits++; d.alerted = true; lessonSee(G, 'hit', d, wasTired); if (K.flee) d.state = 'flee'; G.ev.push({ k: 'bitehit', x: d.x, z: d.z, kind: d.k, why, big: dmg >= 1.5 });
  if (d.hp <= 0.001) kill(G, d); return true; }
function roar(G) { const m = G.me, c = G.cfg; if (G.over || G.wait > 0 || m.roarCD > 0) return false; m.roarCD = c.roarCD; G.ev.push({ k: 'roar' });
  for (const d of G.dinos) { if (d.dead || dist(m, d) > c.roarR) continue; const K = KINDS[d.k]; if (K.flee) { d.freeze = d.k === 'runner' ? 1.8 : 1.3; d.alerted = true; } if (K.rival && d.state === 'tell') { d.state = 'circle'; d.tell = 0; d.tired = 0.9; G.ev.push({ k: 'flinch', x: d.x, z: d.z }); } }
  lessonSee(G, 'roar'); return true; }
// 25 Nov 2026, his words: "animate the t rex eating". A kill is a meal: he stands over it for EAT seconds, head down, tearing at it (the view
// draws that from me.eatT and comes round to show it). The food counts at the kill, as before; a level won on a kill ends when the meal does.
// Struck while eating, he leaves it and fights.
const EAT = 2.3;
function kill(G, d) { d.dead = true; d.eat = 1.2; G.got[d.k] = (G.got[d.k] || 0) + 1; const K = KINDS[d.k], m = G.me;
  if (K.rival) { G.wins++; G.ev.push({ k: 'beaten', x: d.x, z: d.z }); } else { G.eaten++; m.hunger = Math.min(100, m.hunger + K.food); m.hp = Math.min(100, m.hp + K.food * 0.3); m.eatT = EAT; m.eatId = d.id; m.bite = 0; d.eat = EAT + 0.2; G.ev.push({ k: 'eat', x: d.x, z: d.z, kind: d.k }); }
  lessonSee(G, 'kill', d); if (!G.lesson && !goalLeft(G).length) { if (m.eatT > 0) G.fin = true; else finish(G, true); } }
function eatStep(G, dt) { const m = G.me; if (!(m.eatT > 0)) return; m.eatT = Math.max(0, m.eatT - dt); const d = G.dinos.find(q => q.id === m.eatId);
  if (d) m.h += clamp(wrapA(angTo(m, d) - m.h), -3 * dt, 3 * dt); m.v += (0 - m.v) * Math.min(1, dt * 8); if (m.eatT <= 0 && G.fin) finish(G, true); }
function hurtMe(G, dmg, why) { const m = G.me; if (G.fin) return; if (m.eatT > 0) { m.eatT = 0; for (const d of G.dinos) if (d.id === m.eatId) d.eat = Math.min(d.eat, 0.5); } m.hp -= dmg * G.cfg.dmgK; m.hit = 0.4; G.ev.push({ k: 'hurt', why, dmg }); lessonSee(G, 'hurt'); if (m.hp <= 0 && !G.lesson) finish(G, false); if (m.hp <= 0 && G.lesson) m.hp = 100; }
function finish(G, win) { if (G.over) return; const c = G.cfg, m = G.me; G.over = win ? 'won' : 'lost'; const t = Math.round(G.t);
  const stars = win ? 1 + (m.hp >= 60 ? 1 : 0) + (G.hits / Math.max(1, G.bites) >= 0.6 && t < 120 ? 1 : 0) : 0;
  G.res = { win, stars, time: t, eaten: G.eaten, wins: G.wins, hp: Math.round(Math.max(0, m.hp)), acc: Math.round(100 * G.hits / Math.max(1, G.bites)), goals: c.goals.map(g => ({ k: g.k, n: g.n, got: Math.min(g.n, G.got[g.k] || 0) })), coins: win ? 5 + Math.ceil(G.N / 3) + stars * 2 : 1 };
  G.ev.push({ k: win ? 'won' : 'lost' }); }
// ---------- the valley, step by step ----------
function step(G, dt) { if (G.over || !(dt > 0)) return; G.t += dt; for (const d of G.dinos) if (d.dead && d.eat > 0) d.eat = Math.max(0, d.eat - dt); eatStep(G, dt); if (G.over) return; if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0) { G.wait = 0; const f = G.next; G.next = null; if (f) f(); } return; }
  const c = G.cfg, m = G.me, I = G.in;
  // you
  m.bcd = Math.max(0, m.bcd - dt); m.bite = Math.max(0, m.bite - dt); m.roarCD = Math.max(0, m.roarCD - dt); m.hit = Math.max(0, m.hit - dt);
  const push = m.eatT > 0 ? 0 : Math.min(1, Math.hypot(I.sx, I.sy)); let face = 0, run = false;
  if (push > 0.12) { const dh = wrapA((I.ref || 0) + Math.atan2(I.sx, I.sy) - m.h); face = Math.max(0, Math.cos(dh)); if (m.stam <= 0.05) m.gasp = true; else if (m.stam >= 1.2) m.gasp = false; run = push > 0.85 && face > 0.75 && !m.gasp; const rate = run ? 2.3 : m.v < 3 ? 3.6 : 2.8; m.h += clamp(dh, -rate * dt, rate * dt); }      // a gentle push (under 0.3) only turns him to look
  const want = m.bite > 0 ? (m.lunge ? 13 : 7) : run ? 11.5 : 5.5 * clamp((push - 0.3) / 0.55, 0, 1) * face; m.v += (want - m.v) * Math.min(1, dt * (want > m.v ? 4.2 : 5));
  m.stam = run ? Math.max(0, m.stam - dt) : Math.min(c.stam, m.stam + dt * 0.7); m.run = run;
  m.x = clamp(m.x + Math.sin(m.h) * m.v * dt, -BOUND, BOUND); m.z = clamp(m.z + Math.cos(m.h) * m.v * dt, -BOUND + 40, BOUND + 60);
  if (!G.lesson) { m.hunger -= dt * 100 / c.hungerT; if (m.hunger <= 0) { m.hunger = 0; m.hp -= dt * 4; if (m.hp <= 0) return finish(G, false); } }
  // how loud you are: a charge carries, a creep does not
  const noise = run ? 1.45 : m.v > 3 ? 1 : 0.55;
  for (const d of G.dinos) { if (d.dead) continue; think(G, d, dt, noise); }
  if (G.lesson) lessonTick(G, dt); }
function think(G, d, dt, noise) { const K = KINDS[d.k], c = G.cfg, m = G.me, dd = dist(d, m), R = G.rnd; d.t += dt; d.freeze = Math.max(0, d.freeze - dt); d.tired = Math.max(0, d.tired - dt);
  const moveTo = (h, sp) => { d.h += clamp(wrapA(h - d.h), -dt * 3.5, dt * 3.5); d.v += (sp - d.v) * Math.min(1, dt * 3); d.x += Math.sin(d.h) * d.v * dt; d.z += Math.cos(d.h) * d.v * dt; d.x = clamp(d.x, -BOUND, BOUND); d.z = clamp(d.z, -BOUND + 40, BOUND + 60); };
  if (d.freeze > 0) { d.v = 0; return; }
  const hears = dd < K.alert * c.alertK * noise * (d.cave ? 0.7 : 1);
  if (K.flee) {
    if (hears || (d.state === 'flee' && dd < 48)) { if (d.state !== 'flee') { d.state = 'flee'; G.ev.push({ k: 'bolt', kind: d.k, x: d.x, z: d.z }); if (K.herd) for (const o of G.dinos) if (!o.dead && o.k === d.k && dist(o, d) < 20) o.state = 'flee'; } }
    else if (d.state === 'flee' && dd >= 48) { d.state = 'graze'; d.wind = null; d.puff = 0; }
    if (d.state === 'flee') {
      // prey cannot sprint for ever: after a burst it is winded and slows (a chase that keeps on it ends in a catch), then gets its wind back
      if (d.puff > 0) { d.puff -= dt; if (d.puff <= 0) d.wind = c.wind * (0.8 + R() * 0.4); } else { d.wind = (d.wind == null ? c.wind : d.wind) - dt; if (d.wind <= 0) { d.puff = c.puffT; G.ev.push({ k: 'winded', kind: d.k, x: d.x, z: d.z }); } }
      let h = angTo(m, d); if (K.zig && !(d.puff > 0)) { d.zig -= dt; if (d.zig <= 0) { d.zig = 0.6 + R() * 0.7; d.zs = (R() < 0.5 ? -1 : 1) * (0.5 + R() * 0.5); } h += d.zs || 0; }
      // steer back from the edge of the valley
      if (Math.abs(d.x) > BOUND - 15 || d.z > BOUND + 45 || d.z < -BOUND + 55) h = angTo(d, { x: 0, z: 60 }) + (R() - 0.5);
      moveTo(h, K.sp * c.preySp * (d.puff > 0 ? c.puffK : 1)); return; }
    // grazing: a slow wander about home
    if (dist(d, { x: d.hx, z: d.hz }) > 12) moveTo(angTo(d, { x: d.hx, z: d.hz }), 1.2); else { if (R() < dt * 0.4) d.wh = R() * TAU; moveTo(d.wh || d.h, R() < 0.5 ? 0.6 : 0); } return; }
  if (K.armour) { // a spikeback turns its tail to you and swings it
    if (dd < 22) { const away = angTo(m, d); if (d.state === 'guard' && !(d.recover > 0) && dd > 7) { d.h += clamp(wrapA(away - d.h), -dt * 0.8, dt * 0.8); } d.v = 0; d.recover = Math.max(0, (d.recover || 0) - dt);
      const behind = Math.abs(wrapA(angTo(d, m) - (d.h + Math.PI))) < 0.9;
      if (d.state === 'tell') { d.tell -= dt; if (d.tell <= 0) { d.state = 'swing'; d.swing = 0.35; if (dd < 6.5 && behind) hurtMe(G, 22 * (G.N >= 10 ? 1.2 : 1), 'tail'); G.ev.push({ k: 'swing', x: d.x, z: d.z }); } }
      else if (d.state === 'swing') { d.swing -= dt; if (d.swing <= 0) { d.state = 'guard'; d.cool = 1.2 + R(); d.recover = 2.2; G.ev.push({ k: 'stuck', x: d.x, z: d.z, spike: true }); } }      /* after a swing it is slow to turn: run round to its head */
      else { d.state = 'guard'; d.cool = (d.cool || 1) - dt; if (dd < 7.5 && behind && d.cool <= 0) { d.state = 'tell'; d.tell = c.tell; G.ev.push({ k: 'tell', kind: d.k, x: d.x, z: d.z }); } } }
    else { d.state = 'graze'; if (R() < dt * 0.3) d.wh = R() * TAU; moveTo(d.wh || d.h, 0.4); } return; }
  if (K.charger) { // a hornface warns, then charges in a straight line; after it, it is stuck a moment
    if (d.state === 'tell') { d.tell -= dt; d.v = 0; if (d.tell > c.tell * 0.45) d.h += clamp(wrapA(angTo(d, m) - d.h), -dt * 2, dt * 2); if (d.tell <= 0) { d.state = 'charge'; d.run = 0; d.ch = d.h; G.ev.push({ k: 'charge', x: d.x, z: d.z }); } return; }
    if (d.state === 'charge') { d.run += dt; d.h = d.ch; d.v = 15; d.x += Math.sin(d.h) * d.v * dt; d.z += Math.cos(d.h) * d.v * dt; if (dist(d, m) < 2.6 && !d.hitMe) { d.hitMe = true; hurtMe(G, 24, 'horns'); }
      const ahead = Math.sin(d.h) * (m.x - d.x) + Math.cos(d.h) * (m.z - d.z); if (d.run > 1.3 || (ahead < -4 && d.run > 0.4)) { if (d.hitMe) { d.state = 'circle'; d.cool = 2; d.hitMe = false; return; } d.state = 'stuck'; d.stuck = 2.3 * (G.N >= 12 ? 0.85 : 1); d.v = 0; G.ev.push({ k: 'stuck', x: d.x, z: d.z }); } return; }
    if (d.state === 'stuck') { d.stuck -= dt; if (d.stuck <= 0) { d.state = 'circle'; d.cool = 1.5; } return; }
    if (hears || d.state === 'circle') { d.state = 'circle'; d.cool = (d.cool || 0) - dt; moveTo(angTo(d, m) + 0.9, 2.2); if (dd < 24 && d.cool <= 0) { d.state = 'tell'; d.tell = c.tell * 1.1; G.ev.push({ k: 'tell', kind: d.k, x: d.x, z: d.z }); } if (dd > 50) d.state = 'graze'; return; }
    if (R() < dt * 0.3) d.wh = R() * TAU; moveTo(d.wh || d.h, 0.5); return; }
  if (K.rival) { // a rival rex circles, rears and roars, then lunges; after a lunge it is open
    if (d.state === 'tell') { d.tell -= dt; d.v = 0; if (d.tell > c.tell * 0.4) d.h += clamp(wrapA(angTo(d, m) - d.h), -dt * 2.4, dt * 2.4); if (d.tell <= 0) { d.state = 'lunge'; d.run = 0; d.ch = d.h; G.ev.push({ k: 'lunge', x: d.x, z: d.z }); } return; }
    if (d.state === 'lunge') { d.run += dt; d.h = d.ch; d.x += Math.sin(d.h) * 14 * dt; d.z += Math.cos(d.h) * 14 * dt; if (dist(d, m) < 3.4 && !d.hitMe) { d.hitMe = true; hurtMe(G, c.rivalDmg * (d.big ? 1.25 : 1), 'rival'); } if (d.run > 0.6) { d.state = 'circle'; d.tired = d.hitMe ? 0 : 1.9 * (d.big ? 0.8 : 1); d.hitMe = false; d.cool = 1.8 + R() * 1.5; } return; }      /* only a lunge that missed leaves it open */
    if (hears || d.state === 'circle' || dist(m, SPOTS.nest) < 40) { d.state = 'circle'; d.cool = (d.cool || 2) - dt;
      if (d.tired > 0) { d.v *= 0.9; return; }
      const want = dd > 13 ? angTo(d, m) : angTo(d, m) + 1.3; moveTo(want, dd > 13 ? 6 : 3.5); if (dd < 15 && d.cool <= 0) { d.state = 'tell'; d.tell = c.tell * (d.big ? 0.85 : 1); G.ev.push({ k: 'tell', kind: d.k, x: d.x, z: d.z }); } return; }
    if (R() < dt * 0.3) d.wh = R() * TAU; moveTo(dist(d, SPOTS.nest) > 10 ? angTo(d, SPOTS.nest) : d.wh || d.h, 1); } }
// ---------- LESSONS ----------
const AIMCARD = {"pic": "🦖", "win": "EAT THE PREY ASKED FOR", "lose": "GET HURT OR STARVE", "how": "WALK UP, BITE, ROAR"};      // the aim card: specs/aims.json (tools/aims.py)
const LESSONS = {
  1: [{ id: 'creep', title: 'CREEP AND BITE', say: G => rexCue(G)[0], do: G => rexCue(G)[1], at: G => rexCue(G)[2], how: 'A runner is grazing ahead. Walk to it (don\'t charge: it hears you), and BITE when it is in front of your jaws. Twice.', need: 2 }],
  2: [{ id: 'roar', title: 'ROAR', say: G => rexCue(G)[0], do: G => rexCue(G)[1], at: G => rexCue(G)[2], how: 'A runner darts off as you come. ROAR when you are close to freeze it, then BITE. Twice.', need: 2 }],
  3: [{ id: 'dodge', title: 'STEP ASIDE', say: G => rexCue(G)[0], do: G => rexCue(G)[1], at: G => rexCue(G)[2], how: 'The rival rears up before it lunges. Step out of its line, then BITE it while it recovers. Land three bites.', need: 3 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonSetup(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonSetup(G) { const st = lessonNow(G), m = G.me; G.dinos = []; m.x = 0; m.z = 0; m.h = 0; m.hp = 100; m.roarCD = 0; m.eatT = 0;
  if (st.id === 'creep') mk(G, 'runner', (G.rnd() - 0.5) * 10, 22);
  if (st.id === 'roar') { const d = mk(G, 'runner', (G.rnd() - 0.5) * 6, 13); d.state = 'flee'; d.alerted = true; d.lesson = true; }
  if (st.id === 'dodge') { const d = mk(G, 'rival', 0, 16); d.hp = 99; d.state = 'circle'; d.cool = 1.5; } }
function lessonTick(G) { const st = lessonNow(G); if (!st) return; const live = G.dinos.filter(d => !d.dead);
  if (st.id === 'roar') for (const d of live) if (dist(d, G.me) > 45) { G.lesson.n = 0; G.ev.push({ k: 'lessonmiss', how: st.how }); lessonSetup(G); return; }
  if (!live.length && !G.lessonWait) { G.lessonWait = true; G.wait = Math.max(1, (G.me.eatT || 0) + 0.25); G.next = () => { G.lessonWait = false; if (lessonNow(G)) lessonSetup(G); }; } }
function lessonSee(G, what, d, extra) { const st = lessonNow(G); if (!st) return; let ok = null;
  if (st.id === 'creep' && what === 'kill') ok = true;
  if (st.id === 'roar' && what === 'kill') ok = d.freeze > 0 || G.me.roarCD > 0;
  if (st.id === 'dodge') { if (what === 'hurt') { G.lesson.n = 0; G.ev.push({ k: 'lessonmiss', how: 'Step out of its line when it rears up, then bite.' }); return; } if (what === 'hit') { ok = !!extra; if (!ok) { G.ev.push({ k: 'lessonmiss', how: 'Bite it AFTER it lunges, while it recovers.' }); return; } } }
  if (ok == null) return;
  if (!ok) { G.lesson.n = 0; G.ev.push({ k: 'lessonmiss', how: st.how }); return; }
  G.lesson.n++; if (G.lesson.n < st.need) { G.ev.push({ k: 'lessonok', n: G.lesson.n, need: st.need }); return; }
  G.lesson.i++; G.lesson.n = 0; if (G.lesson.i >= G.lesson.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.wait = Math.max(1.6, (G.me.eatT || 0) + 0.25); G.next = () => { G.dinos = []; G.got = {}; G.eaten = G.wins = G.bites = G.hits = 0; Object.assign(G.me, { x: 0, z: -20, h: 0, hp: 100, hunger: 100, eatT: 0 }); spawnAll(G); G.ev.push({ k: 'start' }); }; } else lessonSetup(G); }
// ---------- for the robots ----------
// BLIND: a thumb that does not look: pushes the stick some way for a while, bites, or roars
const BLIND = { s: G => { const a = Math.random() * TAU, r = Math.random(); stick(G, Math.sin(a) * r, Math.cos(a) * r); }, b: G => bite(G), r: G => roar(G) };
// a rex that looks: picks the nearest thing the goal needs (or the nearest food when hungry), creeps up, charges the last
// stretch, roars at bolting small prey when close, bites when it is in front; steps out of a rival's or a hornface's line when
// it warns, bites it while it recovers; comes round to a spikeback's head
// THE TUTORIAL SHOWS ONE MOVE AT A TIME (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing happens"). It said WALK UP,
// TAP BITE (two things) with the hand on BITE all along. Now the robot is asked (dryPlan): WALK THIS WAY on the stick (the way it would go: up to
// the prey, aside from a rival), TAP ROAR, TAP BITE when it would bite.
const RXC = { t: -1e9, v: null };
function rexCue(G) { if (G.over || G.wait > 0) return ['WAIT…', 'wait', false]; const now = performance.now(); if (now - RXC.t < 200) return RXC.v; RXC.t = now; const P = dryPlan(G, null, { t: -1, next: -1 }), B = btnRects(), mid = b => [b.x + b.w / 2, b.y + b.h / 2]; let v = ['WAIT…', 'wait', false];
  if (P && P[0] === 'bite') v = ['TAP BITE!', 'tap', mid(B.bite)]; else if (P && P[0] === 'roar') v = ['TAP ROAR!', 'tap', mid(B.roar)];
  else if (P && P[0] === 'go') { const m = G.me, x = Math.sin(P[1] - m.h) * P[2], z = Math.cos(P[1] - m.h) * P[2], sb = stickBase(), r = sb.r * 0.8; v = [G.lesson && G.lesson.steps[G.lesson.i].id === 'dodge' && Math.abs(x) > 0.6 ? 'STEP ASIDE' : 'WALK THIS WAY', 'drag', [sb.x, sb.y, sb.x - x * r, sb.y - z * r]]; }
  RXC.v = v; return v; }
function honest(G, o, mem) { const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, m = G.me, R = Math.random;
  if (G.over || G.wait > 0) return; mem.t = (mem.t || 0) - 1 / 60; if (mem.t > 0) return; mem.t = 0.08 + react * 0.3;
  const live = G.dinos.filter(d => !d.dead), need = G.lesson ? live.map(d => d.k) : goalLeft(G).map(g => g.k), hungry = m.hunger < 35;
  // danger first: a warning aimed at me
  const threat = live.find(d => (d.state === 'tell' && (KINDS[d.k].rival || KINDS[d.k].charger) && dist(d, m) < 26) || ((d.state === 'lunge' || d.state === 'charge') && dist(d, m) < 30) || (KINDS[d.k].armour && (d.state === 'tell' || d.state === 'swing') && dist(d, m) < 9));
  if (threat && KINDS[threat.k].armour && R() < 0.4 + acc * 0.6) { const away = angTo(threat, m), turn = wrapA(away - m.h); ACT.go(G, away, 1); return; }
  if (threat && R() < 0.4 + acc * 0.6) { const away = angTo(threat, m), side = wrapA(m.h - away) > 0 ? 1 : -1; const h = away + side * Math.PI / 2; ACT.go(G, h, 1); return; }
  const cands = live.filter(d => need.includes(d.k) || (hungry && KINDS[d.k].food && d.k !== 'horns'));
  let t = null, bd = 1e9; for (const d of cands) { const dd = dist(d, m) + (d.cave ? 30 : 0); if (dd < bd) { bd = dd; t = d; } } if (!t) { ACT.go(G, m.h + 0.6, 0.75); return; }
  const K = KINDS[t.k], dd = dist(t, m); let aim = { x: t.x, z: t.z };
  if (K.armour) { const atHead = Math.abs(wrapA(angTo(t, m) - t.h)) < 1.0; if (t.recover > 0 || atHead) aim = { x: t.x + Math.sin(t.h) * 4.5, z: t.z + Math.cos(t.h) * 4.5 }; else if (dd > 14) aim = { x: t.x, z: t.z }; else aim = { x: t.x - Math.sin(t.h) * 6, z: t.z - Math.cos(t.h) * 6 }; }      /* tempt the swing from behind, then run round to the head while it recovers */
  if ((K.rival || K.charger) && !(t.tired > 0 || t.state === 'stuck') && dd < 7) aim = { x: t.x + Math.sin(angTo(t, m)) * 8, z: t.z + Math.cos(angTo(t, m)) * 8 };      // keep a distance until it commits
  const ha = dist(aim, m) < 3 ? angTo(m, t) : angTo(m, aim), turn = wrapA(ha - m.h), da = Math.abs(wrapA(angTo(m, t) - m.h)), reach = 4.8 + K.size * 1.6;
  const open = K.rival ? t.tired > 0 : K.charger ? t.state === 'stuck' : K.armour ? Math.abs(wrapA(angTo(t, m) - t.h)) < 1.0 : true;
  if (dd < reach - 0.3 && da < 0.8 && open && m.bcd <= 0 && R() < 0.5 + acc * 0.5) { ACT.bite(G); }
  if (K.flee && t.state === 'flee' && dd < G.cfg.roarR * 0.7 && m.roarCD <= 0 && R() < acc) ACT.roar(G);
  const fleeing = K.flee && t.state === 'flee', creep = K.flee && !fleeing && dd < K.alert * G.cfg.alertK * 1.6, sprint = (fleeing && dd < 30) || ((K.rival || K.charger) && open && dd > 4) || (K.armour && t.recover > 0);
  const err = (R() - 0.5) * (1 - acc) * 0.8; ACT.go(G, m.h + turn + err, dist(aim, m) < 2 || Math.abs(turn) > 1.4 ? 0.25 : sprint ? 1 : creep ? 0.55 : dd < 6 ? 0.58 : 1); }
function winNow(G) { if (!G || G.over || G.wait > 0) return; G.lesson = null; for (const g of G.cfg.goals) G.got[g.k] = g.n; finish(G, true); }

// what the robot would do now, without doing it (tools/dry_plan.py): the tutorial shows this move
const ACT_REAL = { go, bite, roar }; let ACT = ACT_REAL;
function dryPlan(G, o, mem) { let got = null; const rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { if (!got && !(a.length > 2 && a.slice(1).every(v => v === 0 || v === false))) got = [n, ...a.slice(1)]; return true; };      /* (a stick at rest, all its numbers 0, is not a move; a first bed, number 0, is) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return got; }
function dryPlanAll(G, o, mem) { const all = [], rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { all.push([n, ...a.slice(1)]); return true; };      /* every call, in order (for a robot that steers and drifts at once) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return all; }
