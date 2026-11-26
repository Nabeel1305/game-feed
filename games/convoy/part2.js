// ===================== RULES: Convoy Escort =====================
// You command the escort. The merchant ships steam on in formation towards the harbour; submarines lie ahead and to the sides,
// hidden under the sea. Your sonar ping finds them (a rough area first; ping again and it tightens); a contact's ring grows
// as it gets old. A submarine closes on a merchant and fires torpedoes, unless an escort is close: then it goes deep and
// runs. Drop depth charges over it (shallow, medium or deep: the reports tell you which), shell it with the deck gun when it
// surfaces, and get the convoy home. Units: metres, seconds; x east, z north.

const RULES = [
  '<b>Steer</b> with the left thumb (the ship is heavy: the dashed line shows where you are going). Tap <b>SPEED</b> to change between stop, cruise and full.',
  '<b>PING</b> the sonar: a submarine in range shows as a ring where it may be. Ping again and the ring tightens. An old ring grows: it has moved.',
  '<b>DEPTH CHARGES</b> drop behind you: run over the ring and drop. Tap <b>DEPTH</b> for shallow, medium or deep: one that just fired is shallow, one that has just dived is deep.',
  'A submarine will not fire with an escort close by: stay near the ship it is after. Surfaced, it can be shelled with the <b>GUN</b>.',
  'When there is damage, a fire or survivors close by, a <b>CREW</b> button appears: tap it to send a team. Get enough of the convoy to the harbour.',
];
const SKINS = [{ id: 'grey', name: 'Navy grey', col: 0x7a8288, stars: 0 }, { id: 'dazzle', name: 'Dazzle', col: 0x4a6a8a, stars: 6 }, { id: 'dark', name: 'Night blue', col: 0x2a3440, stars: 14 },
  { id: 'arctic', name: 'Arctic white', col: 0xd8dde2, stars: 24 }, { id: 'sea', name: 'Sea green', col: 0x4a6a5a, stars: 36 }, { id: 'gold', name: 'Admiral', col: 0x9a8a5a, stars: 50 }];
const UPGRADES = [{ id: 'sonar', name: 'Better sonar', max: 2, cost: l => [70, 160][l], desc: 'Longer range, and the ring tightens faster.' }, { id: 'racks', name: 'Extra racks', max: 2, cost: l => [60, 140][l], desc: 'Two more depth-charge patterns.' },
  { id: 'crew', name: 'Trained crew', max: 1, cost: () => 120, desc: 'Jobs are done a third faster.' }];
const upLv = id => { if (typeof HEADLESS !== 'undefined' && HEADLESS) return 0; return ((store.get('ups', {}) || {})[id]) | 0; };
const RANKS = [[0, 'Ensign'], [60, 'Lieutenant'], [200, 'Lt. Commander'], [500, 'Commander'], [1100, 'Captain'], [2500, 'Commodore']];
const PLACES = [{ name: 'North Atlantic, morning', sky: 'morning' }, { name: 'Grey seas', sky: 'overcast' }, { name: 'Squalls', sky: 'rain' }, { name: 'Night run', sky: 'night' }, { name: 'Storm', sky: 'storm' }];
const MISSIONS = { escort: 'Escort the convoy to the harbour', night: 'Night escort: periscopes cannot be seen', rescue: 'A ship is down: rescue the survivors, then escort the rest', cripple: 'Guard a damaged ship limping home' };
const DEPTHS = [{ id: 'shallow', name: 'SHALLOW', m: 20 }, { id: 'medium', name: 'MEDIUM', m: 50 }, { id: 'deep', name: 'DEEP', m: 100 }];
const THR = [-3, 0, 7, 12];       // reverse, stop, cruise, full (metres a second)
function makeCfg(N, help, o = {}) {
  const f = curve(N), e = easyOf(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s));
  const mission = N <= 3 ? 'escort' : N % 7 === 0 ? 'cripple' : N % 5 === 0 ? 'rescue' : N % 4 === 0 ? 'night' : 'escort';
  const place = mission === 'night' ? 3 : N <= 3 ? 0 : N >= 16 && N % 3 === 0 ? 4 : N % 3 === 1 ? 1 : N % 3 === 2 ? 2 : 0;
  return { N, f, e, help: !!help, mission, place, night: mission === 'night', merchants: mission === 'cripple' ? 1 : Math.min(6, 2 + Math.floor(f / 4)), subs: N <= 2 || mission === 'cripple' ? 1 : Math.min(2, 1 + Math.floor(f / 7)),
    route: x(1400, 1900, 20), sonar: (1100 + 150 * upLv('sonar')) * (place === 4 ? 0.75 : place === 2 ? 0.85 : 1), charges: 10 + 2 * upLv('racks') + (help ? 4 : 0), need: mission === 'cripple' ? 1 : null,
    subSpeed: x(3.5, 4.8, 20), keep: N <= 3 ? 0.7 : 0.5, aggro: x(0.6, 1.0, 15), crewK: 1 + 0.33 * upLv('crew'), allies: N >= 20 ? 2 : N >= 8 ? 1 : 0 };
}
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help, o), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, mini: !!o.mini, fast: 1 };
  setup(G, rng(seed + 9));
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G);
  return G;
}
function setup(G, R) { const c = G.cfg; c.route = Math.max(c.route, 1000 + c.subs * 450);
  G.dir = R() * TAU; const dx = Math.cos(G.dir), dz = Math.sin(G.dir);
  G.port = { x: dx * c.route, z: dz * c.route };
  // the convoy: columns of merchants steaming along the route (the damaged ship goes slow)
  G.M = []; const n = c.merchants; for (let i = 0; i < n; i++) { const col = i % 2 ? 1 : -1, row = Math.floor(i / 2); const sx = -dz * col * 160 * (n > 1 ? 1 : 0) - dx * row * 220, sz = dx * col * 160 * (n > 1 ? 1 : 0) - dz * row * 220;
    G.M.push({ i, x: sx, z: sz, ox: sx, oz: sz, hp: c.mission === 'cripple' ? 2 : N_HP(c.N), sunk: false, fire: 0 }); }
  G.cv = { x: 0, z: 0, v: c.mission === 'cripple' ? 5 : 7 };
  // your ship: ahead of the convoy
  G.me = { x: dx * 350, z: dz * 350, h: G.dir, v: THR[2], thr: 2, rud: 0, hp: 100, flood: 0, fire: 0, sonarOk: true, gunOk: true, engOk: true, charges: c.charges, reload: 0, pingCd: 0, gunCd: 0, depth: 1 };
  G.allies = []; for (let i = 0; i < c.allies; i++) G.allies.push({ i, x: -dz * 500 * (i ? -1 : 1), z: dx * 500 * (i ? -1 : 1), h: G.dir, ph: i * Math.PI });
  G.stick = 0; G.subs = []; G.torps = []; G.contacts = []; G.blasts = []; G.surv = []; G.reports = []; G.crew = [{ job: null, t: 0 }, { job: null, t: 0 }]; G.kills = 0; G.lost = 0; G.rescued = 0; G.score = 0; G.alarm = 0;
  // the submarines: waiting ahead and to the sides of the route, at staggered distances
  for (let i = 0; i < c.subs; i++) { const along = 950 + i * 450, side = (R() < 0.5 ? -1 : 1) * (800 + R() * 500);
    G.subs.push({ i, x: dx * along - dz * side, z: dz * along + dx * side, h: G.dir + Math.PI, v: 0, depth: 50, band: 1, state: 'wait', hp: 2, surf: false, torps: 12, cd: 10 + R() * 10, tgt: null, deepT: 0, known: 0, peri: 0, gone: false, wake: 0 }); }
  if (c.mission === 'rescue') { for (let i = 0; i < 6; i++) G.surv.push({ x: dx * 700 + (R() - 0.5) * 60, z: dz * 700 + (R() - 0.5) * 60, t: 0 }); G.wreck = { x: dx * 700, z: dz * 700 }; }
}
const live = G => G.M.filter(m => !m.sunk);
const N_HP = N => N <= 6 ? 1 : 2;      // from level 7 a merchant takes two hits (more ships, more submarines)
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
function report(G, txt, pri = 1) { G.reports.push({ txt, t: G.t, pri }); if (G.reports.length > 6) G.reports.shift(); G.ev.push({ k: 'report', txt, pri }); }
// ---------- the player's actions ----------
function setStick(G, x) { G.stick = clamp(x, -1, 1); }
function throttle(G, n) { if (G.over) return false; G.me.thr = clamp(n, 0, 3); G.ev.push({ k: 'thr', n: G.me.thr }); return true; }
function setDepth(G, n) { G.me.depth = clamp(n, 0, 2); G.ev.push({ k: 'depth', n }); return true; }
function fastOn(G, on) { if (on && danger(G)) { G.ev.push({ k: 'nofast' }); return false; } G.fast = on ? 6 : 1; G.ev.push({ k: 'fast', on: !!on }); return true; }
const danger = G => G.torps.length > 0 || G.subs.some(s => !s.gone && (s.state === 'attack' || s.surf) && Math.min(...live(G).map(m => dist(m, s)), dist(G.me, s)) < 1500) || G.contacts.some(c => G.t - c.t < 20);
function ping(G) { const me = G.me; if (G.over || me.pingCd > 0 || !me.sonarOk) return false; me.pingCd = 3.5; G.ev.push({ k: 'ping' }); let hit = 0;
  for (const s of G.subs) { if (s.gone || s.surf) continue; const d = dist(me, s); if (d > G.cfg.sonar) continue; let rel = Math.atan2(s.z - me.z, s.x - me.x) - me.h; while (rel > Math.PI) rel -= TAU; while (rel < -Math.PI) rel += TAU; if (Math.abs(rel) > 2.6) continue;   // not right astern (the baffles)
    hit++; const old = G.contacts.find(c => c.sub === s.i && G.t - c.t < 30), err0 = 60 + d * 0.12, err = old ? Math.max(18, Math.min(err0, old.err * (0.55 - 0.08 * upLv('sonar')) + 8)) : err0, R = G.rnd, a = R() * TAU, off = R() * err * 0.6;
    const c = { sub: s.i, x: s.x + Math.cos(a) * off, z: s.z + Math.sin(a) * off, err, t: G.t, d, sure: err < 45 }; G.contacts = G.contacts.filter(q => q.sub !== s.i); G.contacts.push(c); s.known = G.t;
    G.ev.push({ k: 'contact', sure: c.sure, d }); lessonSee(G, c.sure ? 'sure' : 'contact'); }
  if (!hit) G.ev.push({ k: 'noecho' }); return true; }
function dropCharges(G) { const me = G.me; if (G.over || me.charges <= 0 || me.reload > 0) return false; me.charges--; me.reload = 4; const bx = me.x - Math.cos(me.h) * 30, bz = me.z - Math.sin(me.h) * 30;
  G.blasts.push({ x: bx, z: bz, t: 2.2, depth: me.depth, done: false }); G.ev.push({ k: 'drop', depth: me.depth }); return true; }
function gun(G) { const me = G.me; if (G.over || me.gunCd > 0 || !me.gunOk) return false; const tgt = G.subs.filter(s => s.surf && !s.gone).sort((a, b) => dist(me, a) - dist(me, b))[0];
  if (!tgt || dist(me, tgt) > 1600) { G.ev.push({ k: 'notarget' }); return false; } me.gunCd = 1.6; const d = dist(me, tgt), p = clamp(1.1 - d / 1700, 0.25, 0.9); G.ev.push({ k: 'gun', x: tgt.x, z: tgt.z });
  if (G.rnd() < p) { tgt.hp -= 0.7; G.ev.push({ k: 'gunhit', x: tgt.x, z: tgt.z }); if (tgt.hp <= 0) sinkSub(G, tgt); else lessonSee(G, 'gunhit'); } else G.ev.push({ k: 'gunmiss', x: tgt.x + (G.rnd() - 0.5) * 60, z: tgt.z + (G.rnd() - 0.5) * 60 }); return true; }
const JOBS = { repair: 'repair damage', fire: 'fight fire', rescue: 'rescue survivors' };
function crewJob(G, job) { if (G.over) return false; const free = G.crew.find(c => !c.job); if (!free) { G.ev.push({ k: 'crewbusy' }); return false; }
  if (job === 'repair' && G.me.sonarOk && G.me.gunOk && G.me.engOk && G.me.flood <= 0) return false; if (job === 'fire' && G.me.fire <= 0) return false; if (job === 'rescue' && !G.surv.some(s => dist(s, G.me) < 220)) { G.ev.push({ k: 'toofar' }); return false; }
  free.job = job; free.t = (job === 'rescue' ? 6 : 9) / G.cfg.crewK; G.ev.push({ k: 'crew', job }); return true; }
// ---------- every frame ----------
function step(G, dt0) {
  if (G.over || !(dt0 > 0)) return; if (G.fast > 1 && danger(G)) { G.fast = 1; G.ev.push({ k: 'fast', on: false, why: 'danger' }); }
  const sub = G.fast > 1 ? 6 : 1; for (let i = 0; i < sub; i++) step1(G, dt0); }
function step1(G, dt) { G.t += dt; if (G.lesson) lessonTick(G, dt); if (G.over) return; const c = G.cfg, me = G.me, R = G.rnd;
  // your ship: a heavy turn, speed by the throttle (less when flooded or the engine is hit)
  const vmax = THR[me.thr] * (me.engOk ? 1 : 0.55) * (1 - me.flood * 0.5); me.v += (vmax - me.v) * Math.min(1, dt * 0.25);
  me.rud += (G.stick - me.rud) * Math.min(1, dt * 1.2); me.h += me.rud * 0.13 * clamp(Math.abs(me.v) / 6, 0.25, 1.2) * Math.sign(me.v || 1) * dt;
  me.x += Math.cos(me.h) * me.v * dt; me.z += Math.sin(me.h) * me.v * dt;
  me.pingCd = Math.max(0, me.pingCd - dt); me.gunCd = Math.max(0, me.gunCd - dt); me.reload = Math.max(0, me.reload - dt);
  if (me.fire > 0) { me.hp -= dt * 1.2 * me.fire; if (R() < dt * 0.05) G.ev.push({ k: 'firespread' }); } if (me.flood > 0) me.hp -= dt * 0.4 * me.flood;
  // the crew at work
  for (const cr of G.crew) if (cr.job) { cr.t -= dt; if (cr.job === 'rescue' && !G.surv.some(s => dist(s, me) < 260)) { cr.job = null; G.ev.push({ k: 'crewstop' }); continue; }
    if (cr.t <= 0) { const j = cr.job; cr.job = null; if (j === 'repair') { if (!me.engOk) me.engOk = true; else if (!me.sonarOk) me.sonarOk = true; else if (!me.gunOk) me.gunOk = true; else me.flood = Math.max(0, me.flood - 0.5); }
      if (j === 'fire') me.fire = Math.max(0, me.fire - 1); if (j === 'rescue') { const near = G.surv.filter(s => dist(s, me) < 260); const k2 = Math.min(near.length, 3); for (let q = 0; q < k2; q++) G.surv.splice(G.surv.indexOf(near[q]), 1); G.rescued += k2; lessonSee(G, 'rescue'); }
      G.ev.push({ k: 'jobdone', job: j }); } }
  // the convoy steams on (the lesson's ships wait)
  if (!G.lesson || G.lesson.id === 'intercept') { G.cv.x += Math.cos(G.dir) * G.cv.v * dt; G.cv.z += Math.sin(G.dir) * G.cv.v * dt; }
  for (const m of G.M) { if (m.sunk) continue; m.x = G.cv.x + m.ox; m.z = G.cv.z + m.oz; if (m.fire > 0) { m.fire -= dt; } }
  // the other escorts (from level 8): they patrol the far side of the convoy from you, slowly circling it
  G.allies.forEach((a, i) => { const toMe = Math.atan2(me.z - G.cv.z, me.x - G.cv.x), want = toMe + Math.PI + (i ? 1 : -1) * (G.allies.length > 1 ? 0.9 : 0) + Math.sin(G.t * 0.03 + a.ph) * 0.8, tx = G.cv.x + Math.cos(want) * 520, tz = G.cv.z + Math.sin(want) * 520;
    const d = Math.hypot(tx - a.x, tz - a.z), sp = Math.min(11, d * 0.2 + 7); if (d > 1) { a.h = Math.atan2(tz - a.z, tx - a.x); a.x += Math.cos(a.h) * sp * dt; a.z += Math.sin(a.h) * sp * dt; } });
  // the submarines
  for (const s of G.subs) if (!s.gone) subStep(G, s, dt);
  // torpedoes
  for (const tp of G.torps) { tp.x += Math.cos(tp.h) * 22 * dt; tp.z += Math.sin(tp.h) * 22 * dt; tp.run += 22 * dt;
    for (const m of live(G)) if (Math.hypot(m.x - tp.x, m.z - tp.z) < 22) { tp.dead = true; hitMerchant(G, m); break; }
    if (!tp.dead && Math.hypot(me.x - tp.x, me.z - tp.z) < 12) { tp.dead = true; if (G.t > (me.hitT || -9) + 4) { me.hitT = G.t; hitMe(G); } }
    if (tp.run > 1800) tp.dead = true; }
  G.torps = G.torps.filter(t => !t.dead);
  // depth charges: they sink, then go off; a sub close enough at the right depth is hit
  for (const b of G.blasts) { b.t -= dt; if (b.t <= 0 && !b.done) { b.done = true; G.ev.push({ k: 'boom', x: b.x, z: b.z, depth: b.depth });
    for (const s of G.subs) { if (s.gone || s.surf) continue; const d = Math.hypot(s.x - b.x, s.z - b.z), db = Math.abs(s.band - b.depth); if (d < 48 && db === 0) { s.hp -= 1; damagedSub(G, s); } else if (d < 70 && db <= 1) { s.shaken = 6; report(G, 'Sonar: close one! He felt that.', 1); lessonSee(G, 'close'); } } } }
  G.blasts = G.blasts.filter(b => b.t > -3);
  // survivors drift; they cannot wait for ever
  for (const s of G.surv) s.t += dt; const before = G.surv.length; G.surv = G.surv.filter(s => s.t < 240); if (G.surv.length < before) report(G, 'Lookout: we have lost sight of survivors in the water.', 2);
  // contacts get old: their ring grows with what a sub could have travelled
  for (const ct of G.contacts) ct.r = ct.err + (G.t - ct.t) * c.subSpeed;
  G.contacts = G.contacts.filter(ct => G.t - ct.t < 90 && !G.subs[ct.sub].gone);
  // the end: the convoy reaches the harbour, or too many are lost, or your ship goes down
  if (me.hp <= 0) return finish(G, false, 'sunk');
  const need = c.need || Math.ceil(c.merchants * c.keep - 0.001); if (live(G).length < need && !G.lesson) return finish(G, false, 'convoy');
  if (!G.lesson && Math.hypot(G.cv.x - G.port.x, G.cv.z - G.port.z) < 60) return finish(G, true);
}
function subStep(G, s, dt) { const c = G.cfg, me = G.me, R = G.rnd, ms = live(G); if (!ms.length && !G.lesson) return; if (s.state === 'lesson') return;
  s.cd -= dt; s.deepT = Math.max(0, s.deepT - dt); s.shaken = Math.max(0, (s.shaken || 0) - dt);
  const dMe = dist(me, s);
  if (s.surf) { s.v = 3; s.h += dt * 0.1; s.x += Math.cos(s.h) * s.v * dt; s.z += Math.sin(s.h) * s.v * dt; s.surfT -= dt; if (s.surfT <= 0 && s.hp > 0) { s.surf = false; s.band = 2; s.depth = 100; s.deepT = 40; s.state = 'evade'; report(G, 'Lookout: he has dived again!', 1); } return; }
  // a target: the nearest living merchant
  const pool = ms.filter(m => m !== s.lastT || ms.length === 1), tgt = pool.length ? pool.reduce((a, b) => dist(a, s) < dist(b, s) ? a : b) : null;
  if (s.state === 'wait') { if (tgt && dist(tgt, s) < 2600) { s.state = 'approach'; } return; }
  if (s.state === 'evade' || s.deepT > 0) { s.band = 2; s.depth = 100; const away = Math.atan2(s.z - me.z, s.x - me.x); s.h = away + Math.sin(G.t * 0.3 + s.i) * 0.6; s.v = c.subSpeed * 0.8; if (s.deepT <= 0) { s.state = 'approach'; s.band = 1; s.depth = 50; } }
  else if (tgt) { const dT = dist(tgt, s), lead = { x: tgt.x + Math.cos(G.dir) * G.cv.v * 40, z: tgt.z + Math.sin(G.dir) * G.cv.v * 40 };
    // an escort close by: it will not risk it, goes deep and runs
    const dAl = G.allies.reduce((m, a) => Math.min(m, dist(a, s)), 9e9); if ((dMe < 520 && me.v > 2) || dAl < 420) { s.state = 'evade'; s.deepT = 25 + R() * 15; report(G, s.known && G.t - s.known < 30 ? 'Sonar: contact going deep!' : 'Sonar: something moving fast, going deep.', 1); G.ev.push({ k: 'scared' }); lessonSee(G, 'scared'); return; }
    s.band = 1; s.depth = 50; s.state = 'approach'; s.h = Math.atan2(lead.z - s.z, lead.x - s.x); s.v = dT > 900 ? c.subSpeed : 1.5;
    if (dT < 950) { s.band = 0; s.depth = 18; if (!c.night && R() < dt * 0.25 && dMe < 2500) { s.peri = 3; report(G, `Lookout: periscope, bearing ${bearing(me, s)}!`, 2); G.ev.push({ k: 'periscope', x: s.x, z: s.z }); } }
    s.appT = (s.appT || 0) + dt;
    if (dT < 2000 && me.sonarOk && dMe < 1900 && (s.heardT == null || G.t - s.heardT > 14)) { s.heardT = G.t; report(G, `Hydrophones: propeller noise, bearing ${bearing(me, s)}.`, 1); const a2 = Math.atan2(s.z - me.z, s.x - me.x) + (R() - 0.5) * 0.15, dd = dMe * (0.85 + R() * 0.3), ct = G.contacts.find(q => q.sub === s.i);
      if (!ct || G.t - ct.t > 12) { G.contacts = G.contacts.filter(q => q.sub !== s.i); G.contacts.push({ sub: s.i, x: me.x + Math.cos(a2) * dd, z: me.z + Math.sin(a2) * dd, err: 260, t: G.t, d: dMe, sure: false, heard: true }); } G.ev.push({ k: 'heard' }); }
    if (dT < (s.salvo % 2 === 1 ? 1150 : 850) && s.cd <= 0 && s.torps > 0 && (s.appT > 30 || s.salvo % 2 === 1) && !G.lessonNoFire) { // fire a spread at where the target will be
      let tt = dT / 22, px = tgt.x, pz = tgt.z; for (let it = 0; it < 4; it++) { px = tgt.x + Math.cos(G.dir) * G.cv.v * tt; pz = tgt.z + Math.sin(G.dir) * G.cv.v * tt; tt = Math.hypot(px - s.x, pz - s.z) / 22; } const a = Math.atan2(pz - s.z, px - s.x);
      s.lastT = tgt; for (const o of [-0.02, 0, 0.02]) G.torps.push({ x: s.x, z: s.z, h: a + o + (R() - 0.5) * 0.02 * (1.5 - c.aggro), run: 0 }); s.torps -= 3; s.salvo = (s.salvo || 0) + 1; if (s.salvo % 2 === 1) { s.cd = 12; } else { s.cd = 28 / c.aggro; s.state = 'evade'; s.deepT = 30; s.appT = 0; }
      report(G, `Sonar: torpedoes in the water, bearing ${bearing(me, s)}!`, 3); G.ev.push({ k: 'torpedo', x: s.x, z: s.z }); G.alarm = 4; } }
  s.peri = Math.max(0, s.peri - dt); s.x += Math.cos(s.h) * s.v * dt; s.z += Math.sin(s.h) * s.v * dt;
  if (s.torps <= 0 && s.state !== 'evade') { s.gone = true; report(G, 'Sonar: a contact has turned for home.', 1); } }
const bearing = (a, b) => String(Math.round((((90 - Math.atan2(b.z - a.z, b.x - a.x) * 180 / Math.PI) % 360) + 360) % 360)).padStart(3, '0');
function damagedSub(G, s) { G.ev.push({ k: 'subhit', x: s.x, z: s.z }); lessonSee(G, 'hit'); if (G.lesson && G.lesson.id === 'charge') { s.hp = 9; return; }
  if (s.hp <= 0) return sinkSub(G, s); s.surf = true; s.surfT = 30; s.band = 0; s.depth = 0; s.state = 'surface'; report(G, 'Lookout: SUBMARINE SURFACING! Guns!', 3); }
function sinkSub(G, s) { s.gone = true; s.sunk = true; G.kills++; G.contacts = G.contacts.filter(c => c.sub !== s.i); G.ev.push({ k: 'subsunk', x: s.x, z: s.z }); report(G, 'Lookout: oil and wreckage. He is finished!', 3); lessonSee(G, 'sunk'); }
function hitMerchant(G, m) { m.hp--; m.fire = 20; G.ev.push({ k: 'mhit', x: m.x, z: m.z }); report(G, `Merchant ${m.i + 1} is hit!`, 3);
  if (m.hp <= 0) { m.sunk = true; G.lost++; for (let i = 0; i < 4; i++) G.surv.push({ x: m.x + (G.rnd() - 0.5) * 50, z: m.z + (G.rnd() - 0.5) * 50, t: 0 }); G.ev.push({ k: 'msunk', x: m.x, z: m.z }); report(G, `Merchant ${m.i + 1} is going down. Survivors in the water!`, 3); } }
function hitMe(G) { const me = G.me; me.hp -= 30; me.flood = Math.min(1, me.flood + 0.5); me.fire = Math.min(2, me.fire + 1); const R = G.rnd(), part = R < 0.34 ? 'engOk' : R < 0.67 ? 'sonarOk' : 'gunOk'; me[part] = false;
  G.ev.push({ k: 'mehit', part }); report(G, `We are hit! ${part === 'engOk' ? 'Engine room damaged: speed down.' : part === 'sonarOk' ? 'Sonar is out.' : 'The gun is out of action.'} Fire and flooding!`, 3); }
function finish(G, win, why) { if (G.over) return; G.over = win ? 'won' : 'lost'; const c = G.cfg, alive = live(G).length, me = G.me;
  const conv = Math.round(1000 * alive / c.merchants), ship = Math.round(300 * clamp(me.hp / 100, 0, 1)), kills = G.kills * 250, resc = G.rescued * 40;
  G.score = win ? conv + ship + kills + resc : 0; const stars = win ? (alive === c.merchants && me.hp > 60 ? 3 : alive === c.merchants || G.kills > 0 ? 2 : 1) : 0;
  G.res = { win, why, stars, coins: win ? 12 + Math.round(G.score / 80) + stars * 4 : 3 + G.kills * 3, score: G.score, alive, of: c.merchants, kills: G.kills, rescued: G.rescued, hp: Math.max(0, Math.round(me.hp)), mission: c.mission };
  G.ev.push({ k: win ? 'won' : 'lost', why }); }

// ---------- LESSONS: steer and ping, depth charges, guard the convoy ----------
const AIMCARD = {"pic": "🚢", "win": "GET THE SHIPS HOME", "lose": "SUBMARINES SINK TOO MANY", "how": "PING, FIND THE SUB, DROP A CHARGE"};      // the aim card: specs/aims.json (tools/aims.py)
const LESSONS = {
  1: [{ id: 'find', title: 'FIND THE SUBMARINE', say: G => convoyCue(G)[0], do: G => convoyCue(G)[1], at: G => convoyCue(G)[2], how: 'Steer towards the marker and PING. A ring shows where he may be; ping again and it tightens to a sure contact (red). Then steer right over the red ring. Twice.', need: 2 }],
  2: [{ id: 'charge', title: 'DEPTH CHARGES', say: G => convoyCue(G)[0], do: G => convoyCue(G)[1], at: G => convoyCue(G)[2], how: 'Ping to find him, steer over the ring, set the depth the report gives (he is at MEDIUM), and DROP. Hit him twice.', need: 2 }],
  3: [{ id: 'intercept', title: 'GUARD THE CONVOY', say: G => convoyCue(G)[0], do: G => convoyCue(G)[1], at: G => convoyCue(G)[2], how: 'A submarine is closing on the merchant. Get close to it (ping to see where) before it can fire: it will go deep and run. Scare it off twice.', need: 2 }],
};
// THE TUTORIAL SHOWS ONE THING AT A TIME, WITH THE HAND ON IT (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing
// happens"). It said STEER TO IT, PING with the hand in a box. Now: TAP FULL SPEED, TAP PING (on the button), SLIDE RIGHT / LEFT to turn
// towards the marker or the red ring (a drag on the left of the screen), TAP DEPTH until it matches, TAP DROP when right over him; WAIT…
function convoyCue(G) { const me = G.me, L = layout(G), D = G.lesson, c = (q, r) => [q.x, q.y], R = q => [q.x + q.w / 2, q.y + q.h / 2];
  if (G.over || !D) return ['WAIT…', 'wait', false];
  const sure = G.contacts.find(q => q.sure && G.t - q.t < 40), ct = sure || G.contacts.filter(q => G.t - q.t < 40).sort((a, b) => a.r - b.r)[0];
  let tgt = D.id === 'find' ? (sure || G.marker) : ct || (D.id === 'charge' ? G.lessonSub : null) || G.marker;
  if (me.thr < 2 && tgt) return ['TAP FULL SPEED', 'tap', R(L.speed)];
  if (me.pingCd <= 0 && (!ct || ct.r > 70)) return ['TAP PING', 'tap', c(L.ping)];
  if (D.id === 'charge' && ct) { const dd = dist(me, ct), sub = G.subs[ct.sub]; if (dd < 60 + ct.r * 0.3 && ct.r < 70 && me.reload <= 0 && me.charges > 0) { if (sub && me.depth !== sub.band) return ['TAP DEPTH: ' + ['SHALLOW', 'MEDIUM', 'DEEP'][sub.band], 'tap', R(L.depthBtn)]; return ['TAP DROP!', 'tap', c(L.drop)]; } }
  if (tgt) { let d = Math.atan2(tgt.z - me.z, tgt.x - me.x) - me.h; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU;
    if (Math.abs(d) > 0.25) { const x0 = W * 0.3, y0 = H * 0.68, r = d > 0 ? 1 : -1; return [r > 0 ? 'SLIDE RIGHT TO TURN' : 'SLIDE LEFT TO TURN', 'drag', [x0, y0, x0 + r * 70 * k, y0]]; } }
  return ['WAIT… STEAMING ON', 'wait', false]; }
function lessonStart(G) { const st = LESSONS[G.N][0]; G.lesson = { steps: LESSONS[G.N], i: 0, n: 0, id: st.id }; G.ev.push({ k: 'lessonnext', first: true }); lessonSetup(G); }
function lessonSetup(G) { const D = G.lesson, me = G.me, R = G.rnd; G.torps = []; G.subs.forEach(s => s.gone = true); G.contacts = []; G.lessonNoFire = true;
  const a = me.h + (R() - 0.5) * 1.2, d = D.id === 'find' ? 600 : D.id === 'charge' ? 450 : 0, x = me.x + Math.cos(a) * d, z = me.z + Math.sin(a) * d;
  if (D.id === 'intercept') { const m = live(G)[0], side = R() < 0.5 ? -1 : 1, sx = m.x - Math.sin(G.dir) * side * 950, sz = m.z + Math.cos(G.dir) * side * 950; G.subs.push({ i: G.subs.length, x: sx, z: sz, h: 0, v: 0, depth: 50, band: 1, state: 'approach', hp: 9, surf: false, torps: 99, cd: 999, deepT: 0, known: 0, peri: 0, gone: false }); G.lessonSub = G.subs[G.subs.length - 1]; return; }
  G.subs.push({ i: G.subs.length, x, z, h: R() * TAU, v: 0, depth: 50, band: 1, state: 'lesson', hp: D.id === 'charge' ? 9 : 9, surf: false, torps: 0, cd: 999, deepT: 0, known: 0, peri: 0, gone: false }); G.lessonSub = G.subs[G.subs.length - 1]; G.marker = { x, z }; }
function lessonSee(G, what) { const D = G.lesson; if (!D || D.done) return; const id = D.id;
  const good = id === 'find' && what === 'over' || id === 'charge' && what === 'hit' || id === 'intercept' && what === 'scared';
  if (good) { D.n++; G.ev.push({ k: 'lessonok', n: D.n, need: D.steps[0].need }); if (D.n >= D.steps[0].need) { D.done = true; D.wait = 1.6; } else if (id !== 'charge') lessonSetup(G); else { const s = G.lessonSub; s.surf = false; s.band = 1; s.depth = 50; s.state = 'lesson'; } } }
function lessonTick(G, dt) { const D = G.lesson; const s = G.lessonSub; if (D.id === 'find' && !D.done) { const c = G.contacts.find(q => q.sure && G.t - q.t < 25); if (c && dist(G.me, c) < 90) lessonSee(G, 'over'); } if (s && s.state === 'lesson') { s.band = 1; s.depth = 50; s.v = 0.6; s.h += dt * 0.05; s.surf = false; }
  if (!D.done) return; D.wait -= dt; if (D.wait > 0) return; G.lesson = null; G.lessonNoFire = false; G.marker = null; setup(G, rng(G.seed + 9)); G.ev.push({ k: 'lessondone', N: G.N }); }

// ---------- for the robots: blind moves and an honest captain ----------
const BLIND = {
  s: G => setStick(G, Math.random() * 2 - 1),                                   // the wheel anywhere
  c: G => setStick(G, 0),                                                         // wheel to the middle
  t: G => throttle(G, (Math.random() * 4) | 0),                                  // any throttle
  p: G => ping(G),                                                                // ping
  d: G => { setDepth(G, (Math.random() * 3) | 0); dropCharges(G); },             // depth charges, any depth
  g: G => gun(G),                                                                 // the gun
  w: G => crewJob(G, ['repair', 'fire', 'rescue'][(Math.random() * 3) | 0]),    // a crew job
  f: G => fastOn(G, Math.random() < 0.5),                                         // fast forward on or off
};
// HONEST: a captain who looks: keeps station ahead of the convoy, pings every few seconds, runs at a contact's ring (leading
// it a little), drops charges over a sure contact at the depth the reports give, shells a surfaced submarine, sends the crew
// to fires and damage first and survivors when close, and fast-forwards when it is quiet. react: seconds behind; acc: how
// often the depth and the drop are right.
function honest(G, o, mem) {
  if (G.over) return; const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, me = G.me, R = Math.random;
  if (G.t < (mem.next || 0)) return; mem.next = G.t + 0.15 + react * 0.5;
  const steerTo = (x, z, spd = 3) => { let d = Math.atan2(z - me.z, x - me.x) - me.h; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; setStick(G, clamp(d * 2.5, -1, 1) + (1 - acc) * (R() - 0.5) * 0.4); if (me.thr !== spd) throttle(G, spd); };
  if (me.fire > 0 && G.crew.some(c => !c.job) && !G.crew.some(c => c.job === 'fire')) crewJob(G, 'fire');
  else if ((!me.engOk || !me.sonarOk || !me.gunOk || me.flood > 0.3) && G.crew.some(c => !c.job) && !G.crew.some(c => c.job === 'repair')) crewJob(G, 'repair');
  else if (G.surv.some(s => dist(s, me) < 200) && G.crew.some(c => !c.job)) crewJob(G, 'rescue');
  if (G.me.pingCd <= 0 && (!mem.lp || G.t - mem.lp > 3.5 + react * 4)) { mem.lp = G.t; ping(G); }
  const surf = G.subs.find(s => s.surf && !s.gone && dist(s, me) < 1500); if (surf) { gun(G); steerTo(surf.x, surf.z, 2); return; }
  const D = G.lesson; if (D && D.id === 'find') { const c = G.contacts.find(q => q.sure); if (c) { steerTo(c.x, c.z, dist(me, c) > 250 ? 3 : 2); return; } if (G.marker) { steerTo(G.marker.x, G.marker.z, dist(me, G.marker) > 500 ? 3 : 2); return; } }
  // the most urgent contact: a fresh one near the convoy
  const ms = live(G), ct = G.contacts.filter(c => G.t - c.t < 40).sort((a, b) => (a.r + Math.min(...ms.map(m => dist(m, a)).concat([9e9])) * 0.3) - (b.r + Math.min(...ms.map(m => dist(m, b)).concat([9e9])) * 0.3))[0];
  if (ct) { const s = G.subs[ct.sub], dd = dist(me, ct); steerTo(ct.x, ct.z, 3);
    if (dd < 60 + ct.r * 0.3 && ct.r < 70 && me.reload <= 0 && me.charges > 0) { const want = R() < acc ? (s.band) : (R() * 3) | 0; if (me.depth !== want) setDepth(G, want); dropCharges(G); }
    if (G.fast > 1) fastOn(G, false); return; }
  if (D && D.id === 'charge' && G.lessonSub) { steerTo(G.lessonSub.x + (R() - 0.5) * 200, G.lessonSub.z + (R() - 0.5) * 200, 2); return; }
  // otherwise: keep station ahead of the convoy, weaving, towards the side the danger came from
  const cx = G.cv.x + Math.cos(G.dir) * 420 + Math.cos(G.dir + Math.PI / 2) * Math.sin(G.t * 0.05) * 350, cz = G.cv.z + Math.sin(G.dir) * 420 + Math.sin(G.dir + Math.PI / 2) * Math.sin(G.t * 0.05) * 350;
  steerTo(cx, cz, dist(me, { x: cx, z: cz }) > 250 ? 3 : 2);
  if (!danger(G) && G.fast === 1 && !G.lesson && R() < 0.5) fastOn(G, true);
}
function winNow(G) { if (!G || G.over || G.lesson) return; finish(G, true); }
