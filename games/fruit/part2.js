// ===================== RULES: Fruit Fight (game 54, his idea) =====================
// Monsters come across the meadow towards you, and all you have is a slingshot and a crate of fruit. Pull back with your thumb
// (anywhere on the screen: pull further down to send it higher and further, sideways to aim the other way), see the arc, and
// let go. Pick the fruit with a tap: ORANGES fire quickly but hit lightly; a WATERMELON is heavy, slow to
// reload, and bursts over everything near where it lands; a BANANA makes a monster slip and fall (and its peel stays on the
// grass to trip the next one). Each monster has its way and its weakness:
//  - blobs: plodding, nothing special.            - scuttlers: quick and small: oranges.
//  - shield-trolls: a board in front; lob a fruit down on them, or burst a watermelon near them.
//  - hoppers: jump in big bounds; a banana under them, or a hit mid-air.
//  - big ones: slow, tough; a glowing eye on top takes triple damage.
// A monster that reaches you takes a heart. Three hearts. Clear every wave. A shot that hits two or more at once is a combo.
const RULES = [
  '<b>Pull back</b> with your thumb and <b>let go</b>. Pull further down to shoot further, sideways to aim. The arc shows where it lands.',
  '<b>Tap a fruit</b> to load it. 🍊 Oranges: quick, light. 🍉 Watermelon: slow to reload, bursts over a crowd. 🍌 Banana: they slip and fall.',
  'Shield-trolls: <b>lob</b> it over the board, or burst a melon by them. Hoppers: a banana where they land. Big ones: hit the glowing <b>eye</b>.',
  'A monster that reaches you takes a <b>heart</b>. Clear every wave.',
  'Hit two or more at once for a <b>combo</b>.',
];
const FRUITS = { orange: { name: 'Orange', icon: '🍊', sp: 34, dmg: 1, reload: 0.55, r: 0.18 }, melon: { name: 'Watermelon', icon: '🍉', sp: 26, dmg: 2.2, reload: 2.2, r: 0.32, splash: 2.6 }, banana: { name: 'Banana', icon: '🍌', sp: 30, dmg: 0.6, reload: 1.1, r: 0.2, slip: true } };
const MON = {
  blob: { name: 'Blob', hp: 2, sp: 2.2, r: 0.8, h: 1.4, n: 1 },
  scut: { name: 'Scuttler', hp: 1, sp: 4.6, r: 0.5, h: 0.8, n: 2 },
  shield: { name: 'Shield-troll', hp: 3, sp: 1.9, r: 0.9, h: 1.9, n: 3, shield: true },
  hop: { name: 'Hopper', hp: 2, sp: 3.2, r: 0.7, h: 1.2, n: 5, hop: true },
  big: { name: 'Big one', hp: 9, sp: 1.3, r: 1.6, h: 3.4, n: 4, eye: true },
};
const WEATHERS = ['morning', 'golden', 'noon', 'sunset', 'overcast', 'mist', 'dusk', 'rain', 'dawn', 'storm'];
function weatherOf(N) { if (N <= 3) return ['morning', 'golden', 'noon'][N - 1]; const R = rng(N * 2203 + 5); R(); return WEATHERS[(R() * WEATHERS.length) | 0]; }
const PLACES = [{ name: 'Orchard Hill' }, { name: 'Pumpkin Patch' }, { name: 'Swamp Edge' }, { name: 'Castle Garden' }];
const placeOf = N => Math.floor((N - 1) / 5) % 4;
const UPGRADES = [
  { id: 'band', name: 'Strong band', desc: 'Every fruit flies 8% faster.', max: 2, cost: l => 30 + l * 40 },
  { id: 'crate', name: 'Bigger crate', desc: 'Watermelons and bananas reload faster.', max: 2, cost: l => 35 + l * 45 },
  { id: 'fence', name: 'Picket fence', desc: 'One extra heart.', max: 1, cost: l => 80 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Fruit picker'], [40, 'Grocer'], [130, 'Sharpshooter'], [320, 'Melon master'], [700, 'Orchard guard'], [1500, 'Fruit legend']];
function makeCfg(N, help) { const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), e = easyOf(N), boss = N % 10 === 0;
  return { N, f, help: !!help, place: placeOf(N), weather: weatherOf(N), boss, waves: N <= 2 ? 2 : Math.round(x(2, 5, 25)), per: Math.round(x(5, 13, 30)), sp: x(0.95, 1.6, 30) * (1 - 0.1 * e) * (help ? 0.85 : 1), gap: x(2.4, 0.8, 30) * (help ? 1.25 : 1),
    kinds: Object.keys(MON).filter(k => MON[k].n <= N), hearts: 3 + upLv('fence'), band: 1 + 0.08 * upLv('band'), reloadK: 1 - 0.18 * upLv('crate'), far: 46, fruits: N >= 3 ? ['orange', 'melon', 'banana'] : N >= 2 ? ['orange', 'melon'] : ['orange'] }; }
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, place: cfg.place, weather: cfg.weather, wait: 0, nid: 1,
    mons: [], shots: [], peels: [], splats: [], fruit: 'orange', cd: { orange: 0, melon: 0, banana: 0 }, hearts: cfg.hearts, wave: 0, queue: [], kills: 0, shotsN: 0, hitsN: 0, combos: 0, best: 0 };
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else { nextWave(G); G.ev.push({ k: 'start' }); }
  return G; }
// a wave is dealt: the level's kinds in fixed shares, spread over time and across the meadow
function nextWave(G) { const c = G.cfg, R = G.rnd; G.wave++; const n = c.per + (G.wave - 1), kinds = c.kinds, list = [];
  for (let i = 0; i < n; i++) list.push(kinds[i % kinds.length]); if (kinds.includes('big') && G.wave < c.waves) list.splice(list.lastIndexOf('big'), 1, 'blob'); if (c.boss && G.wave === c.waves) list.push('big', 'big');
  list.sort(() => R() - 0.5); let t = G.t + 2; G.queue = list.map(k => { t += c.gap * (0.6 + R() * 0.8) * (k === 'big' ? 1.5 : 1); return { k, at: t, x: (R() - 0.5) * 16 }; }); G.ev.push({ k: 'wave', n: G.wave, of: c.waves }); }
function spawn(G, k, x, z) { const M = MON[k]; const m = { id: G.nid++, k, x, z: z || G.cfg.far + G.rnd() * 6, y: 0, hp: M.hp * (k === 'big' && G.cfg.boss ? 1.3 : 1), max: 0, sp: M.sp * G.cfg.sp * (0.9 + G.rnd() * 0.2), slip: 0, hopT: 0, vy: 0, wob: G.rnd() * TAU, dead: false, deadT: 0 }; m.max = m.hp; G.mons.push(m); return m; }
// ---------- what you do ----------
function setFruit(G, f) { if (!G.cfg.fruits.includes(f) || G.over) return false; G.fruit = f; G.ev.push({ k: 'load', f }); return true; }
// fire: yaw (left/right, radians), pitch (up), power 0..1
function shoot(G, yaw, pitch, power) { if (G.over || G.wait > 0) return false; const f = G.fruit, F = FRUITS[f]; if (G.cd[f] > 0 || power < 0.12) { G.ev.push({ k: 'notready' }); return false; }
  const v = F.sp * G.cfg.band * (0.35 + 0.65 * power); G.cd[f] = F.reload * (f === 'orange' ? 1 : G.cfg.reloadK);
  G.shots.push({ f, x: 0, y: 1.5, z: 0.5, vx: Math.sin(yaw) * Math.cos(pitch) * v, vy: Math.sin(pitch) * v, vz: Math.cos(yaw) * Math.cos(pitch) * v, t: 0, hit: [] }); G.shotsN++; G.ev.push({ k: 'fire', f }); return true; }
// where a shot goes (for the arc and for the robots)
function arc(G, yaw, pitch, power, f) { const F = FRUITS[f || G.fruit], v = F.sp * G.cfg.band * (0.35 + 0.65 * power), pts = []; let x = 0, y = 1.5, z = 0.5, vx = Math.sin(yaw) * Math.cos(pitch) * v, vy = Math.sin(pitch) * v, vz = Math.cos(yaw) * Math.cos(pitch) * v;
  for (let i = 0; i < 160; i++) { const dt = 1 / 30; vy -= 12 * dt; x += vx * dt; y += vy * dt; z += vz * dt; pts.push([x, y, z, vy]); if (y <= 0) break; } return pts; }
function hurt(G, m, dmg, why) { if (m.dead) return false; m.hp -= dmg; G.ev.push({ k: 'hit', id: m.id, x: m.x, y: MON[m.k].h * 0.6, z: m.z, why, dmg });
  if (m.hp <= 0.001) { m.dead = true; m.deadT = 0.8; G.kills++; G.ev.push({ k: 'pop', kind: m.k, x: m.x, z: m.z }); lessonSee(G, 'kill', m); return true; } return false; }
function step(G, dt) { if (G.over || !(dt > 0)) return; G.t += dt; if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0) { G.wait = 0; const f = G.next; G.next = null; if (f) f(); } return; }
  const c = G.cfg; for (const k in G.cd) G.cd[k] = Math.max(0, G.cd[k] - dt);
  while (G.queue.length && G.queue[0].at <= G.t) { const q = G.queue.shift(); spawn(G, q.k, q.x); }
  // the monsters come on
  for (const m of G.mons) { if (m.dead) { m.deadT -= dt; continue; } const M = MON[m.k]; m.wob += dt * 4;
    if (m.slip > 0) { m.slip -= dt; m.z += dt * 1.2; continue; }
    for (const p of G.peels) if (!p.used && Math.hypot(p.x - m.x, p.z - m.z) < M.r + 0.5 && !(M.hop && m.y > 0.3)) { p.used = true; m.slip = 1.6; G.ev.push({ k: 'slip', x: m.x, z: m.z }); lessonSee(G, 'slip', m); }
    if (M.hop) { m.hopT -= dt; if (m.y <= 0 && m.hopT <= 0) { m.vy = 6.5; m.hopT = 1.6; } m.vy -= 14 * dt; m.y = Math.max(0, m.y + m.vy * dt); m.z -= (m.y > 0 ? m.sp * 2.2 : 0) * dt; }
    else m.z -= m.sp * dt;
    m.x += Math.sin(m.wob * 0.4) * dt * 0.3; m.x = clamp(m.x, -9, 9);
    if (m.z <= 1.2) { m.dead = true; m.deadT = 0.3; G.hearts--; G.ev.push({ k: 'reached', kind: m.k }); lessonSee(G, 'reached'); if (G.hearts <= 0 && !G.lesson) return finish(G, false); } }
  G.mons = G.mons.filter(m => !m.dead || m.deadT > 0); G.peels = G.peels.filter(p => !p.used && (p.t = (p.t || 0) + dt) < 10);
  // the fruit flies
  for (const s of G.shots) { const F = FRUITS[s.f]; s.t += dt; const n = 3; for (let i = 0; i < n && !s.done; i++) { const h = dt / n; s.vy -= 12 * h; s.x += s.vx * h; s.y += s.vy * h; s.z += s.vz * h;
      for (const m of G.mons) { if (m.dead || s.hit.includes(m.id)) continue; const M = MON[m.k], dy = s.y - (m.y + M.h * 0.55), d = Math.hypot(s.x - m.x, s.z - m.z, dy * 0.8); if (d > M.r + F.r) continue;
        s.hit.push(m.id); let dmg = F.dmg, why = null;
        if (M.shield && s.vy > -7 && !F.splash) { dmg = 0; why = 'shield'; }      // the board stops a flat shot; a lob comes down over it
        if (M.eye && s.y > m.y + M.h * 0.78 && Math.abs(s.x - m.x) < 0.6) { dmg *= 3; why = 'eye'; }
        if (M.hop && m.y > 0.3) { dmg *= 1.5; why = why || 'air'; }
        if (F.slip && dmg > 0) { m.slip = 1.8; G.ev.push({ k: 'slip', x: m.x, z: m.z }); lessonSee(G, 'slip', m); }
        if (dmg === 0) G.ev.push({ k: 'block', x: m.x, z: m.z }); else hurt(G, m, dmg, why);
        if (F.splash) { burst(G, s); break; } s.done = true; break; }
      if (!s.done && s.y <= 0) { s.done = true; if (F.splash) burst(G, s); else if (F.slip) G.peels.push({ x: s.x, z: s.z }); G.ev.push({ k: 'land', f: s.f, x: s.x, z: s.z }); } }
    if (s.done && !s.counted) { s.counted = true; const n2 = s.hit.length + (s.burstN || 0); if (n2 > 0) G.hitsN++; if (n2 >= 2) { G.combos++; G.best = Math.max(G.best, n2); G.ev.push({ k: 'combo', n: n2 }); lessonSee(G, 'combo', n2); } } }
  G.shots = G.shots.filter(s => !s.done && s.z < 80 && s.t < 6);
  if (!G.lesson && !G.queue.length && !G.mons.some(m => !m.dead)) { if (G.wave >= c.waves) return finish(G, true); G.wait = 1.5; G.next = () => nextWave(G); }
  if (G.lesson) lessonTick(G); }
function burst(G, s) { s.done = true; const F = FRUITS[s.f]; G.splats.push({ x: s.x, z: s.z, t: 0 }); G.ev.push({ k: 'splash', x: s.x, z: s.z }); let n = 0;
  for (const m of G.mons) { if (m.dead || s.hit.includes(m.id)) continue; if (Math.hypot(m.x - s.x, m.z - s.z) < F.splash + MON[m.k].r) { hurt(G, m, F.dmg * 0.6, 'splash'); n++; } } s.burstN = n; }
function finish(G, win) { if (G.over) return; G.over = win ? 'won' : 'lost'; const c = G.cfg, acc = G.hitsN / Math.max(1, G.shotsN);
  const stars = win ? 1 + (G.hearts >= c.hearts ? 1 : 0) + (acc >= 0.5 || G.combos >= 3 ? 1 : 0) : 0;
  G.res = { win, stars, kills: G.kills, hearts: G.hearts, acc: Math.round(acc * 100), combos: G.combos, best: G.best, wave: G.wave, waves: c.waves, coins: win ? 4 + Math.ceil(G.N / 3) + stars * 2 + G.combos : 1 };
  G.ev.push({ k: win ? 'won' : 'lost' }); }
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'aim', title: 'PULL AND LET GO', say: 'PULL BACK, LET GO', do: 'drag', dir: 'down', how: 'Pull back with your thumb: the dotted arc shows where it goes. Let go when it ends on the blob. Splat three blobs.', need: 3 }],
  2: [{ id: 'melon', title: 'THE WATERMELON', say: 'TAP 🍉, THEN FIRE', do: 'tap', how: 'Tap 🍉, then burst it in the middle of the crowd. Hit two or more with one melon.', need: 1 }],
  3: [{ id: 'lob', title: 'OVER THE SHIELD', say: 'PULL FURTHER DOWN', do: 'drag', dir: 'down', how: 'The troll\'s board stops a flat shot. Pull further DOWN to lob a fruit high, so it comes down on him. Twice.', need: 2 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonSetup(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonSetup(G) { const st = lessonNow(G); G.mons = []; G.shots = []; G.peels = []; G.queue = []; G.hearts = 3;
  if (st.id === 'aim') { const m = spawn(G, 'blob', (G.rnd() - 0.5) * 8, 22); m.sp = 0.6; }
  if (st.id === 'melon') { G.fruit = 'melon'; for (let i = 0; i < 4; i++) { const m = spawn(G, 'blob', -1.5 + i, 20 + (i % 2)); m.sp = 0.5; } }
  if (st.id === 'lob') { const m = spawn(G, 'shield', (G.rnd() - 0.5) * 6, 20); m.sp = 0.5; m.hp = 99; } }
function lessonTick(G) { const st = lessonNow(G); if (!st) return; if (!G.mons.some(m => !m.dead) && !G.lw) { G.lw = true; G.wait = 0.8; G.next = () => { G.lw = false; if (lessonNow(G)) lessonSetup(G); }; } }
function lessonSee(G, what, d) { const st = lessonNow(G); if (!st) return; let ok = null;
  if (st.id === 'aim' && what === 'kill') ok = true;
  if (st.id === 'melon' && what === 'combo') ok = true;
  if (st.id === 'lob' && what === 'hit') ok = true;
  if (what === 'reached') { G.lesson.n = 0; G.ev.push({ k: 'lessonmiss', how: st.how }); lessonSetup(G); return; }
  if (ok == null) return;
  G.lesson.n++; if (G.lesson.n < st.need) { G.ev.push({ k: 'lessonok', n: G.lesson.n, need: st.need }); if (st.id === 'lob') { const m = G.mons.find(q => !q.dead); if (m) m.x = (G.rnd() - 0.5) * 6; } return; }
  G.lesson.i++; G.lesson.n = 0; if (G.lesson.i >= G.lesson.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.wait = 1.6; G.next = () => { G.mons = []; G.shots = []; G.peels = []; G.hearts = G.cfg.hearts; G.wave = 0; G.kills = G.shotsN = G.hitsN = G.combos = 0; G.fruit = 'orange'; nextWave(G); G.ev.push({ k: 'start' }); }; } else lessonSetup(G); }
// in the lob lesson a hit that the board stops does not count: only a hit that gets through
const _hurt = hurt; hurt = function (G, m, dmg, why) { const r = _hurt(G, m, dmg, why); if (dmg > 0) lessonSee(G, 'hit', m); return r; };
// ---------- for the robots ----------
// BLIND: a thumb that does not look: pulls some way and lets go (anywhere from a dribble to full), or taps a fruit
const BLIND = { s: G => shoot(G, (Math.random() - 0.5) * 1.0, Math.random() * 0.9 - 0.1, Math.random()), f: G => setFruit(G, G.cfg.fruits[(Math.random() * G.cfg.fruits.length) | 0]) };
// aim at a point: the pitch that lands a shot there at this power (the low arc, or the high one for a lob)
function aimAt(G, f, x, y, z, high) { const F = FRUITS[f], v = F.sp * G.cfg.band, d = Math.hypot(x, z - 0.5), h = y - 1.5, g = 12, k2 = v ** 4 - g * (g * d * d + 2 * h * v * v);
  if (k2 < 0) return null; const p = Math.atan((v * v + (high ? 1 : -1) * Math.sqrt(k2)) / (g * d)); return { yaw: Math.atan2(x, z - 0.5), pitch: p, power: 1, tof: d / (v * Math.cos(p)) }; }
// a defender who looks: takes the nearest threat, picks the right fruit for it, leads it, and lets fly (with a little error)
function honest(G, o, mem) { const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random;
  if (G.over || G.wait > 0) return; mem.t = (mem.t || 0) - 1 / 60; if (mem.t > 0) return; mem.t = 0.12 + react * 0.5;
  const live = G.mons.filter(m => !m.dead); if (!live.length) return; live.sort((a, b) => (a.z / a.sp) - (b.z / b.sp)); const m = live[0], M = MON[m.k], fr = G.cfg.fruits;
  const near = live.filter(q => q !== m && Math.hypot(q.x - m.x, q.z - m.z) < 3).length;
  let want = 'orange'; if (fr.includes('melon') && (M.shield || near >= 1 || m.k === 'big') && G.cd.melon <= 0) want = 'melon'; else if (fr.includes('banana') && M.hop && G.cd.banana <= 0) want = 'banana';
  if (G.fruit !== want) { setFruit(G, want); return; } if (G.cd[G.fruit] > 0) { if (G.fruit !== 'orange' && G.cd[G.fruit] > 0.5) setFruit(G, 'orange'); return; }
  const lob = M.shield && G.fruit !== 'melon', ty = M.eye ? m.y + M.h * 0.85 : m.y + M.h * 0.5; let a = aimAt(G, G.fruit, m.x, ty, m.z, lob); if (!a) return;
  const lead = m.slip > 0 ? 0 : M.hop ? m.sp * 0.8 : m.sp; a = aimAt(G, G.fruit, m.x, ty, m.z - lead * a.tof, lob) || a;
  const e = 1 - acc; shoot(G, a.yaw + (R() - 0.5) * e * 0.7, a.pitch + (R() - 0.5) * e * 0.5, 1); }
function winNow(G) { if (!G || G.over || G.wait > 0) return; G.lesson = null; finish(G, true); }
