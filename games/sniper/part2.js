
// ===================== RULES: Sharpshooter (game 73, set 13: one of mine, like Sniper 3D, with sleep darts) =====================
// You are on a rooftop above a busy square with a dart rifle. A thief is somewhere in the crowd: the card tells you what he
// wears (shirt, hat, bag). Find him, then put him to sleep with a dart before he gets away. Left thumb: drag to aim. Right
// thumb: hold the FIRE pad to look through the scope and hold your breath (the sight steadies), let go to fire. Darts take
// time to fly, so lead a walking man; the wind carries a dart sideways. A dart in a passer-by fails the job; a miss makes
// the crowd scatter and the thief runs for the exit. Three darts.
// Units: metres and seconds. The camera stands at CAM; aim is (yaw, pitch) in radians from the camera's straight-ahead.
const RULES = [
  'Read the card: the <b>thief</b> wears these. Find him in the crowd.',
  '<b>Left thumb: drag</b> to aim. <b>Right thumb: hold FIRE</b> to look through the scope and steady, <b>let go</b> to fire.',
  'Darts take time to fly: <b>aim ahead</b> of a walking man. Mind the <b>wind</b>.',
  'Never hit a <b>passer-by</b>. A miss scatters the crowd and the thief runs for it.',
  'Three darts. Put him to sleep before he gets away.',
];
const CAM = { x: 0, y: 13, z: 4 }, PITCH0 = -0.6, FOV = 54, ZOOM = 7, DART = 55;
const SHIRTS = [['red', 0xd83a3a], ['blue', 0x3a6ad8], ['green', 0x3aa85a], ['yellow', 0xe8c030], ['white', 0xf0f0f0], ['black', 0x2a2a30], ['purple', 0x8a4ac8], ['orange', 0xe8803a]];
const HATS = ['no hat', 'a cap', 'a top hat', 'a beanie'], BAGS = ['no bag', 'a briefcase', 'a backpack', 'an umbrella'];
const PLACES = [{ name: 'Town Square', sky: 'morning', ground: 0xc8bca8 }, { name: 'Harbour', sky: 'golden', ground: 0xb8b0a0 }, { name: 'Market', sky: 'overcast', ground: 0xa8a090 }, { name: 'Night Plaza', sky: 'dusk', ground: 0x8a8478 }];
const placeOf = N => Math.floor((N - 1) / 5) % 4;
const SCOPES = [{ id: 'black', col: '#111111', stars: 0 }, { id: 'red dot', col: '#ff3a3a', stars: 6 }, { id: 'green', col: '#3aff7a', stars: 15 }, { id: 'gold', col: '#ffd040', stars: 30 }];
const UPGRADES = [
  { id: 'steady', name: 'Steady hands', desc: 'The sight sways 15% less.', max: 3, cost: l => 50 + l * 60 },
  { id: 'lungs', name: 'Long breath', desc: 'Hold your breath a second longer.', max: 2, cost: l => 60 + l * 70 },
  { id: 'dart', name: 'Extra dart', desc: 'Four darts on every job.', max: 1, cost: l => 200 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Rookie'], [40, 'Marksman'], [130, 'Sharpshooter'], [320, 'Eagle eye'], [700, 'Ghost'], [1500, 'Legend']];
function makeCfg(N, help) { const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), boss = N % 10 === 0;
  return { N, f, help: !!help, place: placeOf(N), boss, people: Math.round(x(8, 30, 30)), look: Math.min(3, 1 + Math.floor(x(0, 2.6, 15))), alike: x(0.2, 0.75, 30), walk: x(0.6, 1.5, 25), wind: N >= 4 ? x(0.3, 2.2, 30) : 0,
    time: Math.round(x(40, 26, 30) + (help ? 10 : 0)), size: x(10, 16, 30), sway: x(0.004, 0.009, 30) * (1 - 0.15 * upLv('steady')), breath: 3 + upLv('lungs'), darts: 3 + upLv('dart') + (help ? 1 : 0), guards: boss ? 3 : N >= 15 ? 1 : 0 }; }
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, place: cfg.place, wait: 0, next: null };
  setup(G); if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else G.ev.push({ k: 'start' });
  return G; }
// ---------- the square and the people in it ----------
// the square: x in [-S, S], z in [-2S - 6, -6] (the camera looks down on it from behind and above); the fountain in the middle
function square(G) { const S = G.S; return { x0: -S, x1: S, z0: -2 * S - 6, z1: -6, fx: 0, fz: -S - 6, fr: 2.6 }; }
function person(G, o) { const R = G.rnd, Q = square(G); let x, z; for (let t = 0; t < 30; t++) { x = Q.x0 + 1 + R() * (Q.x1 - Q.x0 - 2); z = Q.z0 + 1 + R() * (Q.z1 - Q.z0 - 2); if (Math.hypot(x - Q.fx, z - Q.fz) > Q.fr + 1) break; }
  const p = Object.assign({ x, z, a: R() * TAU, sp: G.cfg.walk * (0.8 + R() * 0.4), tx: x, tz: z, wait: R() * 2, shirt: (R() * SHIRTS.length) | 0, hat: (R() * HATS.length) | 0, bag: (R() * BAGS.length) | 0, ph: R() * TAU, asleep: 0, still: false, run: 0 }, o || {});
  G.ppl.push(p); return p; }
function setup(G, o = {}) { const c = G.cfg, R = G.rnd; G.S = o.size || c.size; G.ppl = []; G.darts = []; G.left = o.time || c.time; G.dartsLeft = c.darts; G.t = 0; G.yaw = 0; G.pitch = -0.14; G.hold = 0; G.breath = c.breath; G.gasp = 0; G.scoped = 0; G.fired = 0; G.missed = 0; G.flee = false; G.wind = 0;
  if (o.lesson) o.lesson(G, R); else {
    const tgt = person(G, { thief: true }); G.thief = tgt; const look = c.look;
    for (let i = 1; i < c.people; i++) { const p = person(G); // look-alikes: share some of what the card says, never all of it
      if (R() < c.alike) { const keep = (R() * look) | 0; if (keep !== 0 || look === 1) p.shirt = tgt.shirt; if (keep !== 1 && look >= 2) p.hat = tgt.hat; if (keep !== 2 && look >= 3) p.bag = tgt.bag; } if (same(G, p, tgt)) { p.shirt = (tgt.shirt + 1 + ((R() * 6) | 0)) % SHIRTS.length; } }
    for (let i = 0; i < c.guards; i++) { const g = person(G, { guard: true, shirt: 5, hat: 0, bag: 0 }); g.x = tgt.x + (R() - 0.5) * 3; g.z = tgt.z + (R() - 0.5) * 3; }
    G.wind = c.wind ? (R() < 0.5 ? -1 : 1) * c.wind * (0.6 + R() * 0.4) : 0; }
  // the exits: two gaps in the square's back corners; a car waits at each
  const Q = square(G); G.exits = [[Q.x0 + 1, Q.z0 + 1], [Q.x1 - 1, Q.z0 + 1]]; }
// what the card says: shirt always; then hat; then bag
function same(G, p, t) { const L = G.lesson ? 3 : G.cfg.look; return p.shirt === t.shirt && (L < 2 || p.hat === t.hat) && (L < 3 || p.bag === t.bag); }
const card = G => { const t = G.thief, L = G.lesson ? (G.look || 3) : G.cfg.look; return [`${SHIRTS[t.shirt][0]} shirt`, L >= 2 ? HATS[t.hat] : null, L >= 3 ? BAGS[t.bag] : null].filter(Boolean); };
// ---------- your thumbs ----------
function aim(G, dyaw, dpitch) { if (G.over || G.wait > 0) return; G.yaw = clamp(G.yaw + dyaw, -0.75, 0.75); G.pitch = clamp(G.pitch + dpitch, -1.05, 0.05); }
function hold(G) { if (G.over || G.wait > 0 || G.dartsLeft <= 0) return; if (!G.hold) { G.hold = 1e-6; G.ev.push({ k: 'scope' }); } }
function fire(G) { if (G.over || G.wait > 0 || !G.hold) { G.hold = 0; return; } G.hold = 0; if (G.dartsLeft <= 0) return; G.dartsLeft--; G.fired++;
  const s = swayNow(G), yaw = G.yaw + s[0], pitch = G.pitch + s[1], d = dirOf(yaw, pitch);
  G.darts.push({ t: 0, d, yaw, pitch, done: false }); G.ev.push({ k: 'fire', yaw, pitch }); }
const dirOf = (yaw, pitch) => [Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch)];
// the sight sways; holding your breath steadies it, until the breath runs out (then it shakes a while)
function swayNow(G) { const c = G.cfg, t = G.t, A = c.sway * (G.gasp > 0 ? 1.8 : G.hold && G.breath > 0 ? 0.15 : 1) * (G.lesson ? 0.6 : 1);
  return [A * (Math.sin(t * 1.3) + 0.5 * Math.sin(t * 3.1 + 1)), A * 0.8 * (Math.sin(t * 1.7 + 2) + 0.5 * Math.sin(t * 2.3))]; }
// ---------- the clock ----------
function step(G, dt) { if (G.over || !(dt > 0)) return;
  if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0) { G.wait = 0; const f = G.next; G.next = null; if (f) f(); } return; }
  G.t += dt; if (!G.lesson || G.lessonClock) { G.left -= dt; }
  if (G.hold) { G.hold += dt; G.scoped = Math.min(1, G.scoped + dt * 5); G.breath -= dt; if (G.breath <= 0 && G.gasp <= 0) { G.gasp = 2; G.ev.push({ k: 'gasp' }); } } else { G.scoped = Math.max(0, G.scoped - dt * 4); G.breath = Math.min(G.cfg.breath, G.breath + dt * 0.8); }
  if (G.gasp > 0) { G.gasp -= dt; if (G.gasp <= 0) G.breath = Math.max(G.breath, 1); }
  for (const p of G.ppl) walk(G, p, dt);
  for (const d of G.darts) if (!d.done) { d.t += dt; dartStep(G, d); if (G.over || G.wait > 0) return; }
  // the thief gets away: time is up and he is out of an exit
  if (!G.lesson || G.lessonClock) { if (G.left <= 0 && !G.flee) { G.flee = true; G.ev.push({ k: 'leaving' }); } }
  if (G.flee && G.thief && !G.thief.asleep) { const e = G.thief.exitTo; if (e && Math.hypot(G.thief.x - e[0], G.thief.z - e[1]) < 0.6) { G.ev.push({ k: 'escaped' }); if (G.lesson) { lessonMiss(G, 'escaped'); return; } G.wait = 0.8; G.next = () => finish(G, false); return; } }
  if (G.dartsLeft <= 0 && !G.darts.some(d => !d.done) && !(G.thief && G.thief.asleep)) { G.ev.push({ k: 'nodarts' }); if (G.lesson) { lessonMiss(G, 'darts'); return; } G.wait = 0.8; G.next = () => finish(G, false); } }
function walk(G, p, dt) { if (p.asleep) { p.asleep += dt; return; } const Q = square(G); if (p.still) return; p.ph += dt * p.sp * 6;
  let sp = p.sp; if (G.flee) { sp = p.thief ? 3.6 : p.run ? 2.8 : sp; if (p.thief && !p.exitTo) { p.exitTo = G.exits[Math.hypot(p.x - G.exits[0][0], p.z - G.exits[0][1]) < Math.hypot(p.x - G.exits[1][0], p.z - G.exits[1][1]) ? 0 : 1]; } }
  if (p.thief && p.exitTo) { p.tx = p.exitTo[0]; p.tz = p.exitTo[1]; p.wait = 0; }
  else if (p.guard && G.thief) { p.tx = G.thief.x + Math.cos(p.ph * 0.1) * 1.5; p.tz = G.thief.z + Math.sin(p.ph * 0.1) * 1.5; }
  if (p.wait > 0) { p.wait -= dt; return; }
  const dx = p.tx - p.x, dz = p.tz - p.z, d = Math.hypot(dx, dz);
  if (d < 0.3) { if (p.thief && p.exitTo) return; p.wait = G.flee ? 0 : G.rnd() * 2.5; for (let t = 0; t < 10; t++) { p.tx = clamp(p.x + (G.rnd() - 0.5) * 12, Q.x0 + 1, Q.x1 - 1); p.tz = clamp(p.z + (G.rnd() - 0.5) * 12, Q.z0 + 1, Q.z1 - 1); if (Math.hypot(p.tx - Q.fx, p.tz - Q.fz) > Q.fr + 0.8) break; } return; }
  let vx = dx / d * sp, vz = dz / d * sp; const fd = Math.hypot(p.x - Q.fx, p.z - Q.fz); if (fd < Q.fr + 0.6) { vx += (p.x - Q.fx) / fd * sp; vz += (p.z - Q.fz) / fd * sp; }
  p.x += vx * dt; p.z += vz * dt; p.a = Math.atan2(vx, -vz); p.vx = vx; p.vz = vz; }
// where a dart is after t seconds (it flies at DART m/s, drops a little, the wind carries it sideways)
function dartAt(G, d, t) { const s = DART * t; return [CAM.x + d.d[0] * s + G.wind * t * 0.9, CAM.y + d.d[1] * s - 4.9 * t * t * 0.15, CAM.z + d.d[2] * s]; }
// a dart hits the first person whose body it passes through (a person: a column 0.3 m round, from the ground to 1.8 m)
function dartStep(G, d) { const t1 = d.t, t0 = Math.max(0, t1 - 1 / 60), a = dartAt(G, d, t0), b = dartAt(G, d, t1);
  let hit = null, ht = 1e9; for (const p of G.ppl) { if (p.asleep && p !== G.thief) continue; for (let i = 0; i <= 4; i++) { const u = i / 4, x = lerp(a[0], b[0], u), y = lerp(a[1], b[1], u), z = lerp(a[2], b[2], u);
      if (y > 0 && y < 1.85 && Math.hypot(x - p.x, z - p.z) < 0.32) { const tt = t0 + (t1 - t0) * u; if (tt < ht) { ht = tt; hit = p; } break; } } }
  if (hit) { d.done = true; d.hit = hit; const pos = dartAt(G, d, ht); d.at = pos; hit.asleep = 1e-6; G.ev.push({ k: 'hit', thief: !!hit.thief, guard: !!hit.guard, x: pos[0], y: pos[1], z: pos[2] });
    if (hit.thief) { G.ev.push({ k: 'got' }); if (G.lesson) { lessonSee(G, 'got'); return; } G.wait = 1.6; G.next = () => finish(G, true); return; }
    if (!hit.guard) { G.ev.push({ k: 'innocent' }); if (G.lesson) { lessonMiss(G, 'innocent'); return; } G.wait = 1.2; G.next = () => finish(G, false); return; }
    scatter(G); return; }
  if (b[1] <= 0 || t1 > 2.5) { d.done = true; d.at = b; G.missed++; G.ev.push({ k: 'miss', x: b[0], z: b[2] }); scatter(G); } }
// a dart that misses (or drops a guard) frightens the square: everyone hurries, the thief runs for the nearest exit
function scatter(G) { if (G.flee) return; G.flee = true; for (const p of G.ppl) { p.run = 1; p.wait = 0; } G.left = Math.min(G.left, 6); G.ev.push({ k: 'panic' }); }
function finish(G, win) { if (G.over) return true; G.over = win ? 'won' : 'lost'; const c = G.cfg, first = win && G.fired === 1;
  const stars = win ? 1 + (first ? 1 : 0) + (G.left >= c.time * 0.5 ? 1 : 0) : 0;
  G.res = { win, stars, score: win ? Math.round(500 + Math.max(0, G.left) * 20 + (first ? 300 : 0) + G.dartsLeft * 100) : 0, prog: win ? 1 : 0.5, fired: G.fired, left: Math.max(0, Math.round(G.left)), first, card: card(G).join(', '), people: G.ppl.length,
    coins: win ? 4 + Math.ceil(G.N / 3) + stars * 2 : 1 };
  G.ev.push({ k: win ? 'won' : 'lost' }); return true; }
// ---------- for the robots ----------
// where a person looks from the camera: the yaw and pitch that point at them (at chest height)
function aimAt(x, y, z) { const dx = x - CAM.x, dy = y - CAM.y, dz = z - CAM.z, h = Math.hypot(dx, dz); return [Math.atan2(dx, -dz), Math.atan2(dy, h)]; }
// BLIND: thumbs that do not look: drag some way; hold fire; let go
const BLIND = { d: G => aim(G, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.3), h: G => hold(G), f: G => fire(G) };
// a player who looks: reads the card, scans the crowd (longer with more look-alikes), then aims ahead of the thief for the
// dart's flight and against the wind, holds breath when close, lets go when the sight is on him
function honest(G, o, mem) { if (G.over || G.wait > 0 || !G.thief) return; const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random;
  if (mem.g !== G.ppl) { mem.g = G.ppl; mem.find = 0.8 + react * 2 + G.ppl.filter(p => !p.thief && G.thief && p.shirt === G.thief.shirt).length * (0.25 + react * 0.6); mem.err = [(R() - 0.5) * (1 - acc) * 0.012, (R() - 0.5) * (1 - acc) * 0.01]; mem.windErr = (R() - 0.5) * (1 - acc) * 0.8; mem.pick = null; }
  if (mem.find > 0) { mem.find -= 1 / 60; return; }
  // now and then a quick look picks the wrong one (more look-alikes, more often)
  if (!mem.pick) { const alike = G.ppl.filter(p => p !== G.thief && !p.guard && same(G, p, G.thief)); mem.pick = alike.length && R() < (1 - acc) * 0.5 ? alike[0] : G.thief; if (!alike.length) { const near = G.ppl.filter(p => p !== G.thief && !p.guard && p.shirt === G.thief.shirt); if (near.length && R() < (1 - acc) * 0.15 * near.length) mem.pick = near[0]; } }
  const p = mem.pick; if (p.asleep && p !== G.thief) { mem.pick = G.thief; return; }
  // lead: where he will be when the dart gets there; against the wind
  const dist = Math.hypot(p.x - CAM.x, p.z - CAM.z, 0.9 - CAM.y), tf = dist / DART, vx = p.asleep ? 0 : p.vx || 0, vz = p.asleep ? 0 : p.vz || 0, still = p.wait > tf || p.still;
  const fx = still ? p.x : p.x + vx * tf, fz = still ? p.z : p.z + vz * tf; const want = aimAt(fx - G.wind * tf * 0.9 * (1 + mem.windErr), 1.0 + 4.9 * tf * tf * 0.15, fz);
  want[0] += mem.err[0]; want[1] += mem.err[1]; const dy = want[0] - G.yaw, dp = want[1] - G.pitch, sp = 0.035 + acc * 0.02; aim(G, clamp(dy, -sp, sp), clamp(dp, -sp, sp));
  const off = Math.hypot(dy, dp); if (off < 0.05 && !G.hold && G.gasp <= 0) hold(G);
  // someone in the way: wait for a clear shot (a careful player does; a careless one now and then does not)
  const blocked = G.ppl.some(q => { if (q === p || q.asleep) return false; const dq = Math.hypot(q.x - CAM.x, q.z - CAM.z); if (dq > dist) return false; const wq = aimAt(q.x, 0.9, q.z); return Math.abs(wq[0] - want[0]) < 0.6 / dq && Math.abs(wq[1] - want[1]) < 1.2 / dq; }) && R() < 0.5 + acc * 0.5;
  if (G.hold) { const s = swayNow(G), e = Math.hypot(want[0] - G.yaw - s[0], want[1] - G.pitch - s[1]); if (!blocked && ((e < 0.0035 + (1 - acc) * 0.004 && G.hold > 0.25 + react * 0.3) || G.breath < 0.3)) { fire(G); mem.find = 0.6 + react; mem.err = [(R() - 0.5) * (1 - acc) * 0.01, (R() - 0.5) * (1 - acc) * 0.008]; } } }
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.wait = 0; if (G.thief) G.thief.asleep = 1; finish(G, true); }
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'aim', title: 'AIM AND FIRE', how: 'The thief stands still by the fountain. Left thumb: drag to aim. Right thumb: HOLD the FIRE pad (the scope), let go to fire.' }],
  2: [{ id: 'clue', title: 'READ THE CARD', how: 'Only one of these people matches the card. Find him; never hit anyone else.' }],
  3: [{ id: 'lead', title: 'AIM AHEAD', how: 'He is walking, and the wind blows. The dart takes a moment to fly: aim a little ahead of him, and into the wind.' }],
};
const LSET = {
  aim: (G, R) => { G.thief = person(G, { thief: true, x: (R() - 0.5) * 6, z: -G.S - 2 - R() * 3, still: true, shirt: 0, hat: 1, bag: 1 }); },
  clue: (G, R) => { const tz = -G.S - 6; G.thief = person(G, { thief: true, x: (R() - 0.5) * 8, z: tz + (R() - 0.5) * 6, still: true, shirt: 1, hat: 2, bag: 1 });
    for (const o of [{ shirt: 1, hat: 0, bag: 1 }, { shirt: 1, hat: 2, bag: 2 }, { shirt: 3, hat: 2, bag: 1 }, { shirt: 0, hat: 1, bag: 0 }]) person(G, Object.assign({ still: true, x: (R() - 0.5) * 14, z: tz + (R() - 0.5) * 10 }, o)); },
  lead: (G, R) => { G.wind = (R() < 0.5 ? -1 : 1) * 1.4; G.thief = person(G, { thief: true, x: -6, z: -G.S - 6 - 2, shirt: 3, hat: 3, bag: 2, sp: 1.3 }); G.thief.tx = 6; G.thief.tz = G.thief.z; for (let i = 0; i < 4; i++) person(G, { shirt: 4 + (i % 2), hat: 0, bag: 0 }); },
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonDeal(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonDeal(G) { const st = lessonNow(G); G.rnd = rng(G.seed + (G.deals = (G.deals | 0) + 1)); setup(G, { size: 10, lesson: LSET[st.id] }); G.look = 3; G.ev.push({ k: 'square' }); }
function lessonMiss(G, why) { const st = lessonNow(G); G.ev.push({ k: 'lessonmiss', how: why === 'innocent' ? 'That was a passer-by! Check the card: shirt, hat and bag. Again.' : why === 'darts' ? 'Out of darts. Hold FIRE to steady the scope, put the cross on him, let go.' : st.how }); G.wait = 1.4; G.next = () => lessonDeal(G); }
function lessonSee(G, what) { const st = lessonNow(G); if (!st || what !== 'got') return;
  G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.wait = 1.6; G.next = () => { G.rnd = rng(G.seed); setup(G); G.ev.push({ k: 'start' }); G.ev.push({ k: 'square' }); }; }
