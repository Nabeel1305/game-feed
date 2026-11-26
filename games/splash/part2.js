// ===================== RULES: Splash Course =====================
// A padded obstacle course above sparkling pools. Five obstacles: giant bouncing balls, the sweeper, the punch wall, the
// treadmill and the spinning cross; reach the finish platform inside the qualifying time. A fall is a splash: back to the
// start of that obstacle within two seconds, a second on the clock. Medals for time; your best run races you as a ghost.
// Coordinates (metres): x across (+ is to the right as you run), z along the course (+ forward), y up; the water at 0.
const RULES = [
  '<b>Left thumb: move.</b> A floating stick: push the way you want to go.',
  '<b>JUMP: hold, then let go.</b> The longer you hold, the higher and farther (the ring on the water shows where you will land). Push nowhere to jump straight up.',
  '<b>DUCK</b> (the smaller button) under high bars.',
  'Land near the middle of a ball: near its edge you slide. Fall in and you are back at the start of that obstacle in two seconds.',
  'Beat the qualifying time. Gold, silver and bronze medals for your time; your best run races you as a ghost.',
];
const SKINS = [{ id: 'red', name: 'Red flash', col: 0xe8402a, col2: 0x2a3a8a, stars: 0 }, { id: 'lime', name: 'Lime fizz', col: 0x8ad82a, col2: 0x2a2a2a, stars: 5 }, { id: 'pink', name: 'Bubblegum', col: 0xff6ab0, col2: 0xffffff, stars: 12 },
  { id: 'teal', name: 'Lagoon', col: 0x1ab8b0, col2: 0xffd23a, stars: 22 }, { id: 'gold', name: 'Champion gold', col: 0xf0b820, col2: 0x8a2ad8, stars: 34 }, { id: 'stripe', name: 'Lifeguard', col: 0xff3a3a, col2: 0xffffff, stars: 50 }];
const UPGRADES = [{ id: 'grip', name: 'Grippy socks', max: 2, cost: l => [50, 130][l], desc: 'You slide less near the edge of a ball.' }, { id: 'spring', name: 'Spring soles', max: 2, cost: l => [70, 160][l], desc: 'Your jumps go a little farther.' },
  { id: 'lungs', name: 'Big lungs', max: 1, cost: () => 120, desc: 'Back from a splash faster.' }];
const upLv = id => { if (typeof HEADLESS !== 'undefined' && HEADLESS) return 0; return ((store.get('ups', {}) || {})[id]) | 0; };
const RANKS = [[0, 'Splasher'], [60, 'Paddler'], [200, 'Bouncer'], [500, 'Course pro'], [1100, 'Splash star'], [2500, 'Legend of the pools']];
const PLACES = [{ name: 'Sunny Lagoon', sky: 'noon' }, { name: 'Palm Bay', sky: 'morning' }, { name: 'Sunset Pools', sky: 'golden' }, { name: 'Storm Cove', sky: 'overcast' }];
const placeOf = N => Math.floor((N - 1) / 5) % PLACES.length;
const KINDS = ['balls', 'sweep', 'wall', 'belt', 'cross'];
const KNAME = { balls: 'Big Bounce Balls', sweep: 'The Sweeper', wall: 'Punch Wall', belt: 'The Treadmill', cross: 'Spinning Cross' };
const TOP = 2.0, GRAV = 16, RUN = 4.2, CH = 0.5, PR = 0.3, HSTAND = 1.7, HDUCK = 0.95;
function makeCfg(N, help, o = {}) {
  const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), R = rng(N * 7919 + 13);
  let kinds; if (N <= 5) kinds = [KINDS[N - 1]]; else if (N % 5 === 0) kinds = KINDS.slice(); else { const n = Math.min(4, 2 + Math.floor((N - 6) / 6)), pool = KINDS.slice(); kinds = []; while (kinds.length < n) kinds.push(pool.splice((R() * pool.length) | 0, 1)[0]); }
  const hz = help ? 0.85 : 1;
  return { N, f, help: !!help, place: placeOf(N), kinds, seed: N * 7919 + 13, hz,
    ballGap: x(1.3, 2.3, 14), ballR: x(1.65, 1.3, 18), ballDy: x(0, 0.35, 14), slideAt: x(0.6, 0.45, 8), ballAmp: N >= 8 ? x(0, 0.8, 20) : 0,
    sweepPeriod: (N >= 12 ? Math.max(3.6, x(5.0, 2.8, 16)) : x(5.0, 2.8, 16)) / hz, sweepNeed: Math.round(x(3, 6, 15)), sweepFast: N >= 10, sweepHigh: N >= 12,
    gloves: Math.round(x(5, 8, 14)), glovePeriod: x(2.4, 1.8, 16) / hz, gloveOut: x(0.75, 0.6, 16), glovePat: N >= 9,
    beltLen: x(16, 24, 14), beltV: x(1.9, 2.6, 16) * hz, beltGap: x(6, 4.2, 14), beltBurst: N >= 10,
    crossW: x(0.5, 0.95, 16) * hz, crossGap: x(1.2, 2.0, 14), crossBar: N >= 10,
    qualK: x(1.9, 1.15, 12) * (help ? 1.25 : 1), assist: N <= 12 };
}
// ---------- the course: platforms between obstacles; every hazard follows a fixed, learnable pattern for its level ----------
function buildCourse(cfg) { const R = rng(cfg.seed), obs = [], plats = []; let z = 0;
  plats.push({ i: 0, z0: -7, z1: 0 });
  cfg.kinds.forEach((kind, i) => { const o = { kind, i, z0: z };
    if (kind === 'balls') { o.balls = []; let cz = z + cfg.ballGap * (0.85 + R() * 0.25) + cfg.ballR; for (let b = 0; b < 4; b++) { const r = cfg.ballR * (0.92 + R() * 0.16);
        o.balls.push({ cz, cx0: (b % 2 ? 1 : -1) * (1.0 + R() * 0.2) * (1 - 0.5 * cfg.ballAmp), r, top: TOP + 0.4 + (R() - 0.5) * 2 * cfg.ballDy, amp: cfg.ballAmp * (b % 2 ? 1 : 0.6), w: 0.9 + R() * 0.5, ph: R() * TAU, sq: 0 });
        cz += r + cfg.ballGap * (0.9 + R() * 0.2) + cfg.ballR; }
      o.z1 = cz - cfg.ballR + 0.2; }
    else if (kind === 'sweep') { o.pz = z + 3.6; o.pr = 1.25; o.pivot = { x: -2.2, z: o.pz }; o.len = 3.4; o.w0 = TAU / cfg.sweepPeriod; o.need = cfg.sweepNeed; o.high = cfg.sweepHigh; o.fast = cfg.sweepFast;
      o.th = Math.PI * (0.6 + R() * 0.6); o.w = o.w0; o.k = 1; o.next = 1; o.n = 0; o.done = false; o.z1 = o.pz + 3.6; }
    else if (kind === 'wall') { o.gloves = []; const n = cfg.gloves, per = cfg.glovePeriod, wdw = (cfg.gloveOut + 0.6) / per, dl = wdw * (cfg.glovePat ? 0.6 : 0.85), R0 = R();
      // the gloves' timing is set so that walking straight through at full speed is always caught by one of them (a fixed
      // rhythm you learn by watching; you get through by stopping in the gaps)
      for (let g = 0; g < n; g++) o.gloves.push({ z: z + 1.6 + g * 2.9, per, ph: (((R0 + g * (dl - 2.9 / 3.0 / per)) % 1) + 1) % 1, out: cfg.gloveOut });
      o.z1 = z + 1.6 + (n - 1) * 2.9 + 1.6; }
    else if (kind === 'belt') { o.b0 = z + 1.5; o.z1 = o.b0 + cfg.beltLen; o.v0 = cfg.beltV; o.v = o.v0; o.burst = cfg.beltBurst; o.items = []; let s = 4;
      while (s < cfg.beltLen - 1) { const r = R(), type = r < 0.38 ? 'barrier' : r < 0.72 ? 'hurdle' : 'bar'; o.items.push({ type, s, side: R() < 0.5 ? -1 : 1, hit: 0 }); s += cfg.beltGap * (0.9 + R() * 0.3); }
      o.loop = Math.max(cfg.beltLen + 2, s + 1); o.sh = 0; }
    else { o.cz = z + cfg.crossGap + 4.4; o.L = 4.4; o.w = cfg.crossW * (i % 2 ? -1 : 1); o.th = R() * TAU; o.bar = cfg.crossBar; o.bth = R() * TAU; o.z1 = o.cz + 4.4 + cfg.crossGap; }
    obs.push(o); z = o.z1; plats.push({ i: i + 1, z0: z, z1: z + (i === cfg.kinds.length - 1 ? 8 : 5), fin: i === cfg.kinds.length - 1 }); z = plats[plats.length - 1].z1; });
  return { obs, plats, finZ: plats[plats.length - 1].z0 + 1.5 }; }
const parOf = (cfg, o) => o.kind === 'balls' ? 4.9 + cfg.ballAmp * 1.5 : o.kind === 'sweep' ? o.need * TAU / o.w0 + 1.5 : o.kind === 'wall' ? (0.6 + o.gloves.length * o.gloves[0].per * 0.42) * Math.min(2.2, 1.35 + 0.025 * (cfg.N - 3)) : o.kind === 'belt' ? (1.2 + (o.z1 - o.b0) / (RUN - o.v0 - 0.6)) * 1.2 : (2.5 + Math.PI / 2 / Math.abs(o.w) * 0.9) * 1.1 + (o.bar ? 2.5 : 0);
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help, o), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0, C = buildCourse(cfg);
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, mini: !!o.mini, free: !!o.free, C };
  G.par = C.obs.reduce((a, q) => a + parOf(cfg, q), 0) + (6 + C.obs.length * 4.4) / RUN; G.qual = Math.round(G.par * cfg.qualK);
  G.clock = 0; G.falls = 0; G.clean = 0; G.cp = 0; G.trace = []; G.trT = 0; G.blind = {};
  G.stick = { x: 0, z: 0 }; G.jumpHeld = false; G.charge = 0; G.charging = false; G.duckHeld = false;
  G.p = spawnP(G, 0); G.mark = null;
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G);
  return G;
}
function spawnP(G, cp) { const pl = G.C.plats[cp]; return { x: 0, y: TOP, z: pl.z1 - 1.4, vx: 0, vy: 0, vz: 0, on: { kind: 'plat', pl }, state: 'ground', stun: 0, fallT: 0, duck: false, face: 0, knocked: false, tumble: 0 }; }
// ---------- the player's actions ----------
function setStick(G, x, z) { const m = Math.hypot(x, z); G.stick = m > 1 ? { x: x / m, z: z / m } : { x, z }; }
function jumpOn(G, on) { if (G.over) return; const P = G.p;
  if (on && !G.jumpHeld) { G.jumpHeld = true; if (P.state === 'ground' && !P.stun) { G.charging = true; G.charge = 0; } }
  else if (!on && G.jumpHeld) { G.jumpHeld = false; if (G.charging) { G.charging = false; doJump(G, Math.min(1, G.charge / CH)); } } }
function duckOn(G, on) { G.duckHeld = !!on; }
// ---------- where things are at a moment (shared by the rules, the robots and the picture) ----------
const ballX = (b, t) => b.cx0 + b.amp * Math.sin(b.w * t + b.ph);
const ballH = (b, d) => b.top - (b.r - Math.sqrt(Math.max(0, b.r * b.r - d * d)));
function glove(gl, t) { const u = ((t / gl.per + gl.ph) % 1 + 1) % 1, warn = 0.5 / gl.per, out = gl.out / gl.per;   // 0..1 through its cycle: rest, warning, out
  const st = u < 1 - warn - out ? 'rest' : u < 1 - out ? 'warn' : 'out', e = st === 'out' ? Math.min(1, (u - (1 - out)) * gl.per / 0.12) : st === 'warn' ? -Math.min(1, (u - (1 - warn - out)) * gl.per / 0.3) * 0.3 : 0;
  return { st, e }; }
function beltItemZ(o, it) { return o.b0 + (((it.s - o.sh) % o.loop) + o.loop) % o.loop; }
function crossHas(o, x, z, th) { const dx = x, dz = z - o.cz, c = Math.cos(-th), s = Math.sin(-th), u = dx * c - dz * s, v = dx * s + dz * c;
  return (Math.abs(u) <= o.L && Math.abs(v) <= 0.55) || (Math.abs(v) <= o.L && Math.abs(u) <= 0.55) || u * u + v * v < 0.8 * 0.8; }
// the support under a point: the highest surface at or a little above the feet (h <= y + up)
function support(G, x, z, y, up) { const t = G.t; let best = null, bh = -1e9;
  const take = (h, s) => { if (h <= y + up && h > bh) { bh = h; best = s; } };
  for (const pl of G.C.plats) if (z >= pl.z0 && z <= pl.z1 && Math.abs(x) <= 2.2) { const o = G.C.obs[pl.i - 1]; if (!(o && o.kind === 'sweep' && !o.open)) take(TOP, { kind: 'plat', pl }); }   // the gate after the sweeper opens when it is done
  for (const o of G.C.obs) { if (z < o.z0 - 3 || z > o.z1 + 3) continue;
    if (o.kind === 'balls') o.balls.forEach((b, bi) => { const d = Math.hypot(x - ballX(b, t), z - b.cz); if (d < b.r * 0.88) take(ballH(b, d) - b.sq * 0.25, { kind: 'ball', o, b, bi, d }); });
    else if (o.kind === 'sweep') { if (Math.hypot(x, z - o.pz) < o.pr) take(TOP, { kind: 'ped', o }); }
    else if (o.kind === 'wall') { if (z >= o.z0 && z <= o.z1 && x >= -0.45 && x <= 0.45) take(TOP, { kind: 'ledge', o }); }
    else if (o.kind === 'belt') { if (z >= o.b0 && z <= o.z1 && Math.abs(x) <= 2.1) take(TOP, { kind: 'belt', o }); }
    else if (crossHas(o, x, z, o.th)) take(TOP, { kind: 'cross', o }); }
  return best ? { h: bh, s: best } : null; }
function carryV(G, s, x, z) { if (!s) return { x: 0, z: 0 }; const t = G.t;
  if (s.kind === 'ball') { const b = s.b; return { x: b.amp * b.w * Math.cos(b.w * t + b.ph), z: 0 }; }
  if (s.kind === 'belt') return { x: 0, z: -s.o.v };
  if (s.kind === 'cross') { const o = s.o; return { x: -o.w * (z - o.cz), z: o.w * x }; }
  return { x: 0, z: 0 }; }
// ---------- the jump ----------
const jumpVy = pw => 6.2 + 2.0 * pw, jumpHs = pw => (2.4 + 3.4 * pw) * (1 + 0.05 * upLv('spring'));
function doJump(G, pw) { const P = G.p; if (P.state !== 'ground' || P.stun) return; const cv = carryV(G, P.on, P.x, P.z), m = Math.hypot(G.stick.x, G.stick.z), hs = jumpHs(pw);
  let vx = P.vx, vz = P.vz; if (m > 0.15) { const sp = Math.max(hs * m, (vx * G.stick.x + vz * G.stick.z) / m); vx = G.stick.x / m * sp; vz = G.stick.z / m * sp; }
  P.vx = vx + cv.x; P.vz = vz + cv.z; P.vy = jumpVy(pw); P.state = 'air'; P.duck = false; P.from = P.on; P.on = null; G.ev.push({ k: 'jump', pw }); }
// where a jump of power pw towards (dx, dz) from here would come down onto height h (for the ring and the robots)
function landAt(G, pw, dx, dz, h, from) { const P = G.p, cv = carryV(G, from || P.on, P.x, P.z), m = Math.hypot(dx, dz), vy = jumpVy(pw), hs = jumpHs(pw);
  const ux = m > 0.15 ? dx / m : 0, uz = m > 0.15 ? dz / m : 0, sp = m > 0.15 ? hs * Math.min(1, m) : 0, dy = h - P.y, disc = vy * vy - 2 * GRAV * dy; if (disc < 0) return null; const T = (vy + Math.sqrt(disc)) / GRAV;
  return { x: P.x + (ux * sp + cv.x) * T, z: P.z + (uz * sp + cv.z) * T, T }; }
// ---------- every frame ----------
function step(G, dt) { if (G.over || !(dt > 0)) return; G.t += dt; if (G.lesson) lessonTick(G, dt); const P = G.p, cfg = G.cfg;
  if (!G.lesson || true) G.clock += dt;
  // blind robots let go of what they held
  if (G.blind.jr != null) { G.blind.jr -= dt; if (G.blind.jr <= 0) { G.blind.jr = null; jumpOn(G, false); } }
  if (G.blind.dr != null) { G.blind.dr -= dt; if (G.blind.dr <= 0) { G.blind.dr = null; duckOn(G, false); } }
  moveHazards(G, dt);
  if (G.charging) { G.charge += dt; if (P.state !== 'ground') G.charging = false; }
  if (P.state === 'fall') { P.fallT -= dt; P.tumble += dt; P.vy -= GRAV * 0.3 * dt; if (P.y > -0.4) { P.x += P.vx * dt * 0.5; P.z += P.vz * dt * 0.5; P.y += P.vy * dt; } if (P.fallT <= 0) respawn(G); return; }
  if (P.stun > 0) P.stun -= dt;
  const ctl = P.stun > 0 ? 0 : 1;
  if (P.state === 'ground') { const s = P.on, onBall = s.kind === 'ball', ledge = s.kind === 'ledge';
    P.duck = G.duckHeld && ctl > 0; let sp = P.duck ? 2.4 : onBall ? 1.8 : ledge ? 3.0 : RUN, acc = onBall ? 6 : 28;
    let tx = G.stick.x * sp * ctl, tz = G.stick.z * sp * ctl; if (ledge) tx *= 0.35;
    if (G.charging) { tx *= 0.12; tz *= 0.12; }      // crouched to spring: you hardly move while you hold JUMP
    if (onBall && Math.hypot(tx, tz) < 0.05) acc = 2;      // on a ball with no push you slide; a push holds you
    P.vx += clamp(tx - P.vx, -acc * dt, acc * dt); P.vz += clamp(tz - P.vz, -acc * dt, acc * dt);
    if (onBall) { const b = s.b, bx = ballX(b, G.t), dx = P.x - bx, dz = P.z - b.cz, d = Math.hypot(dx, dz) || 1e-6, u = d / b.r;
      const s0 = G.cfg.slideAt; if (u > s0) { const a = 7 * (u - s0) / 0.4 * (1 - 0.15 * upLv('grip')); P.vx += dx / d * a * dt; P.vz += dz / d * a * dt; }
      b.sq = Math.max(0, b.sq - dt * 3); }
    const cv = carryV(G, s, P.x, P.z); P.x += (P.vx + cv.x) * dt; P.z += (P.vz + cv.z) * dt;
    if (s.kind === 'ledge') P.x = Math.max(P.x, -0.4);
    if (s.kind === 'plat' && s.pl.fin) P.z = Math.min(P.z, s.pl.z1 - 0.4);      // the finish platform has a padded wall at its end
    const sup = support(G, P.x, P.z, P.y, 0.4);
    if (!sup || sup.h < P.y - 0.5) { const c2 = carryV(G, s, P.x, P.z); P.vx += c2.x; P.vz += c2.z; P.vy = 0; P.state = 'air'; P.from = s; P.on = null; if (s.kind === 'ball') { P.slid = true; G.ev.push({ k: 'slide' }); } }
    else { P.y = sup.h; if (sup.s.kind !== s.kind || sup.s.o !== s.o || sup.s.b !== s.b || sup.s.pl !== s.pl) { P.on = sup.s; onNew(G, sup.s); } else P.on = sup.s; } }
  else { const y0 = P.y; P.vy -= GRAV * dt;       // 23 Nov 2026: no steering in the air (it was a push of 3 m/s a second from nothing): the jump is aimed when you leave the ground
    P.x += P.vx * dt; P.z += P.vz * dt; P.y += P.vy * dt;
    if (P.vy <= 0) { const sup = support(G, P.x, P.z, y0, 0.05); if (sup && P.y <= sup.h) land(G, sup); }
    if (P.state === 'air' && P.y < TOP - 1.4) splash(G); }
  if (P.state === 'ground' || P.state === 'air') hazards(G, dt);
  if (G.over) return;
  while (G.trace.length * 0.1 <= G.clock && G.trace.length < 6000) G.trace.push([+P.x.toFixed(2), +P.y.toFixed(2), +P.z.toFixed(2)]);   // your run, for the ghost
  if (P.state === 'ground' && P.on.kind === 'plat' && P.on.pl.fin && P.z >= G.C.finZ) { if (G.lesson) { lessonSee(G, 'finish'); } else return finish(G, true, 'finish'); }
  if (!G.lesson && !G.free && G.clock > G.qual) finish(G, false, 'time'); }
function land(G, sup) { const P = G.p, s = sup.s, cv = carryV(G, s, P.x, P.z); P.y = sup.h; P.vy = 0; P.state = 'ground'; P.on = s; P.knocked = false; P.slid = false;
  P.vx -= cv.x; P.vz -= cv.z; if (s.kind === 'ball') { P.vx *= 0.2; P.vz *= 0.2; s.b.sq = 1; const clean = s.d < s.b.r * G.cfg.slideAt; if (clean) G.clean++; G.ev.push({ k: 'land', on: 'ball', bi: s.bi, clean, edge: !clean }); }
  else { const k = s.kind === 'cross' || s.kind === 'ped' ? 0.3 : 0.7; P.vx *= k; P.vz *= k; G.ev.push({ k: 'land', on: s.kind }); }
  if (G.jumpHeld && !G.charging) { G.charging = true; G.charge = 0; }
  onNew(G, s); }
function onNew(G, s) { if (s.kind === 'plat' && s.pl.i > G.cp && s.pl.i < G.C.plats.length) { const o = G.C.obs[s.pl.i - 1]; if (!(o && o.kind === 'sweep' && !o.open)) { G.cp = s.pl.i; G.ev.push({ k: 'cp', i: G.cp, fin: !!s.pl.fin }); lessonSee(G, 'cp'); } }
  if (s.kind === 'ball') lessonSee(G, 'ball', s); }
function splash(G) { const P = G.p; if (P.state === 'fall') return; P.state = 'fall'; P.fallT = 1.6 * (1 - 0.25 * upLv('lungs')); P.tumble = 0; P.vy = -1; G.falls++; G.clock += 1; G.charging = false;
  G.ev.push({ k: 'splash', x: P.x, z: P.z, why: P.why || (P.slid ? 'slid' : 'missed') }); lessonSee(G, 'splash'); P.why = null; }
function respawn(G) { const st = G.p; G.p = spawnP(G, G.cp); G.p.face = st.face; const o = G.C.obs[G.cp]; if (o && o.kind === 'sweep') { o.n = 0; } G.ev.push({ k: 'respawn' }); }
function knock(G, vx, vy, vz, why) { const P = G.p; if (P.state === 'fall' || P.knocked) return; const cv = carryV(G, P.on, P.x, P.z); P.vx = vx + cv.x; P.vy = vy; P.vz = vz + cv.z; P.state = 'air'; P.on = null; P.knocked = true; P.why = why; G.charging = false; G.ev.push({ k: 'hit', why }); }
// the hazards move on their own clocks (fixed patterns)
function moveHazards(G, dt) { for (const o of G.C.obs) {
  if (o.kind === 'sweep') { const before = o.th; if (o.done && !o.open) { const goal = Math.ceil((o.th - Math.PI / 2) / TAU) * TAU + Math.PI / 2; o.th = Math.min(goal, o.th + Math.max(o.w, 2.5) * dt); if (o.th >= goal - 1e-9) { o.open = true; o.w = 0; G.ev.push({ k: 'gate' }); } continue; } if (o.open) continue; o.th += o.w * dt;
    // a speed change happens as the arm passes the far side (opposite the pedestal); it is shown the whole way round (red arm)
    if (o.fast && Math.floor((before - Math.PI) / TAU) !== Math.floor((o.th - Math.PI) / TAU)) { o.k = o.next; o.next = o.k === 1 ? (G.rnd() < 0.5 ? 1.35 : 1) : 1; o.w = o.done ? o.w : o.w0 * o.k; }
    // a pass: the arm went by the pedestal while you were on it
    if (Math.floor(before / TAU) !== Math.floor(o.th / TAU) && !o.done) { const P = G.p; if (P.on && P.on.kind === 'ped' && P.on.o === o || P.state === 'air' && P.from && P.from.kind === 'ped' && P.from.o === o) { o.n++; G.ev.push({ k: 'pass', n: o.n, need: o.need }); lessonSee(G, 'pass');
        if (o.n >= o.need) { o.done = true; G.ev.push({ k: 'sweepdone' }); } } } }
  else if (o.kind === 'belt') { let v = o.v0; if (o.burst) { const u = (G.t % 9) / 9; v = u > 0.78 ? o.v0 * 1.4 : o.v0; o.warn = u > 0.62 && u <= 0.78; } o.v = v; o.sh += v * dt; for (const it of o.items) it.hit = Math.max(0, it.hit - dt); }
  else if (o.kind === 'cross') { o.th += o.w * dt; o.bth -= o.w * 1.3 * dt; } } }
// collisions with the moving hazards; each has a visible cause
function hazards(G, dt) { const P = G.p, t = G.t, hgt = P.duck ? HDUCK : HSTAND;
  for (const o of G.C.obs) { if (P.z < o.z0 - 2 || P.z > o.z1 + 2) continue;
    if (o.kind === 'sweep') { const arms = [{ th: o.th, y0: 0.05, y1: 0.45 }]; if (o.high) arms.push({ th: o.th + Math.PI, y0: 1.05, y1: 1.45 });
      for (const a of arms) { const dx = P.x - o.pivot.x, dz = P.z - o.pivot.z, r = Math.hypot(dx, dz); if (r > o.len + PR || r < 0.3) continue; const ang = Math.atan2(dz, dx), da = Math.atan2(Math.sin(ang - a.th), Math.cos(ang - a.th));
        if (Math.abs(da) * r < 0.2 + PR && P.y < TOP + a.y1 && P.y + hgt > TOP + a.y0) { const tx = -Math.sin(a.th), tz = Math.cos(a.th), sp = Math.max(4, Math.abs(o.w) * r * 1.6); knock(G, tx * sp, 4.5, tz * sp, a.y0 > 1 ? 'high' : 'arm'); return; } } }
    else if (o.kind === 'wall') { if (P.x > 0.9) continue; for (const gl of o.gloves) { const s = glove(gl, t); if (s.st === 'out' && s.e > 0.5 && Math.abs(P.z - gl.z) < 0.6 + PR && P.y < TOP + 1.6) { knock(G, 6.5, 3.5, (P.z - gl.z) * 2, 'punch'); return; } } }
    else if (o.kind === 'belt') { if (!(P.on && P.on.kind === 'belt') && P.state !== 'air') continue;
      for (const it of o.items) { const iz = beltItemZ(o, it); if (Math.abs(P.z - iz) > 0.3 + PR) continue;
        if (it.type === 'barrier') { const xa = it.side < 0 ? -2.1 : -0.6, xb = it.side < 0 ? 0.6 : 2.1; if (P.x + PR > xa && P.x - PR < xb && P.y < TOP + 1.4) { const pz = P.z < iz ? iz - 0.3 - PR : iz + 0.3 + PR, px = it.side < 0 ? xb + PR : xa - PR; if (Math.abs(px - P.x) < Math.abs(pz - P.z) * 0.6) P.x = px; else { P.z = pz; if (P.vz > 0) P.vz = 0; } if (!it.hit) { it.hit = 0.6; G.ev.push({ k: 'bump' }); } } }
        else if (it.type === 'hurdle') { if (P.y < TOP + 0.45 && P.stun <= 0) { P.stun = 0.8; P.z = iz - 1.1; P.vx = P.vz = 0; it.hit = 0.6; G.ev.push({ k: 'trip', why: 'hurdle' }); } }
        else if (P.y + hgt > TOP + 1.0 && P.y < TOP + 1.3 && P.stun <= 0) { P.stun = 0.8; P.z = iz - 1.1; P.vx = P.vz = 0; it.hit = 0.6; G.ev.push({ k: 'trip', why: 'bar' }); } } }
    else if (o.kind === 'cross' && o.bar) { const dx = P.x, dz = P.z - o.cz, r = Math.hypot(dx, dz); if (r < 0.9 || r > o.L + PR) continue; const ang = Math.atan2(dz, dx), da = Math.atan2(Math.sin(ang - o.bth), Math.cos(ang - o.bth));
      if (Math.abs(da) * r < 0.2 + PR && P.y < TOP + 0.45) { const tx = Math.sin(o.bth), tz = -Math.cos(o.bth); knock(G, tx * 5, 4.5, tz * 5, 'bar'); return; } } } }
function finish(G, win, why) { if (G.over) return; G.over = win ? 'won' : 'lost'; const t = G.clock;
  const medal = win ? (t <= G.par ? 3 : t <= G.par * 1.25 ? 2 : 1) : 0;
  G.res = { win, why, stars: medal, time: t, par: G.par, qual: G.qual, falls: G.falls, clean: G.clean, coins: win ? 10 + medal * 6 + (G.falls === 0 ? 10 : 0) + Math.min(10, G.clean * 2) : 2, trace: win ? G.trace : null, where: G.cp };
  G.ev.push({ k: win ? 'won' : 'lost', why }); }
function winNow(G) { if (!G || G.over || G.lesson) return; finish(G, true, 'finish'); }
// ---------- lessons (levels 1-3): one obstacle each, no clock; then the timed run ----------
const LESSONS = {
  1: [{ id: 'balls', title: 'HOLD, THEN LET GO', say: G => splashCue(G)[0], do: G => splashCue(G)[1], at: G => splashCue(G)[2], how: 'Left thumb: push towards the next ball. Hold JUMP and let go: the longer you hold, the farther (the ring shows where you will land). Cross all four balls.', need: 5 }],
  2: [{ id: 'sweep', title: 'JUMP THE SWEEPER', say: G => splashCue(G)[0], do: G => splashCue(G)[1], at: G => splashCue(G)[2], how: 'Jump onto the round platform. Tap JUMP just before the arm reaches you (no direction: straight up). Keep it up until the gate opens, then jump across.', need: 3 }],
  3: [{ id: 'wall', title: 'STOP AND GO', say: G => splashCue(G)[0], do: G => splashCue(G)[1], at: G => splashCue(G)[2], how: 'Walk along the ledge and wait in the gaps. A glove flashes red and pulls back before it punches: go just after it.', need: 0 }],
};
function lessonStart(G) { const st = LESSONS[G.N][0]; G.lesson = { steps: LESSONS[G.N], i: 0, n: 0, id: st.id, need: st.id === 'wall' ? G.C.obs[0].gloves.length : st.id === 'sweep' ? G.C.obs[0].need : st.need }; G.ev.push({ k: 'lessonnext', first: true }); }
function lessonSee(G, what, s) { const D = G.lesson; if (!D || D.done) return; const id = D.id; let good = false;
  if (what === 'splash') { if (D.n) { D.n = 0; G.ev.push({ k: 'lessonmiss', how: id === 'balls' ? 'Splash! Watch the ring: let go when it sits on the middle of the next ball.' : id === 'sweep' ? 'Splash! Tap JUMP just before the arm arrives: the count starts again.' : 'Punched! Wait in a gap until the next glove has punched and pulled back.' }); } return; }
  if (id === 'balls' && what === 'ball' && s.bi === D.n) good = true;
  if (id === 'balls' && what === 'cp' && D.n >= 4) good = true;
  if (id === 'sweep' && what === 'pass') good = true;
  if (id === 'wall' && what === 'glove') good = true;
  if (what === 'cp' && id !== 'balls' && (D.n >= D.need || id === 'sweep' && G.C.obs[0].done)) { D.done = true; D.wait = 1.6; G.ev.push({ k: 'lessonok', n: D.n, need: D.need }); return; }
  if (good) { D.n++; G.ev.push({ k: 'lessonok', n: D.n, need: D.need }); if (id === 'balls' && D.n >= D.need) { D.done = true; D.wait = 1.6; } } }
function lessonTick(G, dt) { const D = G.lesson;
  if (!D.done && D.id === 'wall') { const o = G.C.obs[0], P = G.p; while (D.n < o.gloves.length && P.state === 'ground' && P.z > o.gloves[D.n].z + 0.6 + PR) lessonSee(G, 'glove'); }
  if (!D.done) return; D.wait -= dt; if (D.wait > 0) return; G.lesson = null; G.clock = 0; G.falls = 0; G.clean = 0; G.cp = 0; G.trace = []; G.p = spawnP(G, 0); for (const o of G.C.obs) if (o.kind === 'sweep') { o.n = 0; o.done = false; o.open = false; o.w = o.w0; } G.ev.push({ k: 'lessondone', N: G.N }); }

// ---------- for the robots: blind moves and an honest runner ----------
const BLIND = {
  f: G => setStick(G, 0, 1),                                                         // push forward
  s: G => { const a = Math.random() * TAU; setStick(G, Math.cos(a), Math.sin(a)); },  // push anywhere
  o: G => setStick(G, 0, 0),                                                         // let go of the stick
  j: G => { jumpOn(G, true); G.blind.jr = 0.03; },                                   // tap JUMP
  h: G => { jumpOn(G, true); G.blind.jr = 0.1 + Math.random() * 0.5; },              // hold JUMP a while
  d: G => { duckOn(G, true); G.blind.dr = 0.2 + Math.random() * 0.8; },              // hold DUCK a while
};
// HONEST: a runner who looks: knows where each jump will land (as well as acc allows), waits for the gaps, times the
// sweeper and the hurdles (later or earlier by react), and goes round the barriers.
function aimPlan(G, tx, tz, th, err) {   // choose a direction and a power so the jump lands at (tx, tz) on height th; hold it that long
  const P = G.p, cv = carryV(G, P.on, P.x, P.z); let T = 0.85, pw = 0.5, ux = 0, uz = 1;
  for (let it = 0; it < 3; it++) { const ax = tx - cv.x * T - P.x, az = tz - cv.z * T - P.z, D = Math.hypot(ax, az) || 1e-6; ux = ax / D; uz = az / D; let lo = 0, hi = 1;
    for (let i = 0; i < 18; i++) { const m = (lo + hi) / 2, L = landAt(G, m, ux, uz, th); const d = L ? Math.hypot(L.x - cv.x * L.T - P.x, L.z - cv.z * L.T - P.z) : 0; if (d < D) lo = m; else hi = m; }
    pw = (lo + hi) / 2; const L = landAt(G, pw, ux, uz, th); if (L) T = L.T; }
  return { ux, uz, pw: clamp(pw + err, 0, 1) }; }
function aimJump(G, mem, tx, tz, th, err) { const A = aimPlan(G, tx, tz, th, err); setStick(G, A.ux, A.uz); jumpOn(G, true); mem.hold = A.pw * CH; mem.jx = A.ux; mem.jz = A.uz; }
// THE TUTORIAL SHOWS THE ONE MOVE TO MAKE NOW (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing happens"). It said HOLD
// JUMP, LET GO with the hand on JUMP all along (which way? how long?), and WAIT… GO! with a hand sliding right. Now the robot is asked
// (dryPlanAll; aimPlan says how long it would hold): PUSH THIS WAY on the stick, HOLD JUMP, LET GO! at the right length, TAP JUMP! as the arm
// comes, WALK ON / WAIT… in the gaps, HOLD DUCK.
const SPX = { t: -1e9, v: null, hold: null };
function splashCue(G) { if (G.over) return ['WAIT…', 'wait', false]; const now = performance.now(); if (now - SPX.t < 80) return SPX.v; SPX.t = now; const P = G.p, L = layout(G), J = [L.jump.x, L.jump.y], f = ui.phi || 0, R = 56 * k, s2 = ui.stick, x0 = s2 ? s2.x0 : W * 0.24, y0 = s2 ? s2.y0 : H * 0.72;
  const toScr = (wx, wz) => { const sx = wx * Math.cos(f) - wz * Math.sin(f), sy = wx * Math.sin(f) + wz * Math.cos(f); return [x0, y0, x0 + sx * R * 0.8, y0 - sy * R * 0.8]; }; let v;
  if (G.jumpHeld) { v = SPX.hold != null && G.charge >= SPX.hold - 0.02 ? ['LET GO!', 'release', J] : ['KEEP HOLDING', 'hold', J]; SPX.v = v; return v; }
  const m = {}, all = dryPlanAll(G, null, m), last = n => all.filter(q => q[0] === n).pop(), aj = last('aimJump'), jo = last('jumpOn'), st = last('setStick'), dk = last('duckOn');
  if (aj) { const A = aimPlan(G, aj[2], aj[3], aj[4], 0), ok = Math.hypot(G.stick.x - A.ux, G.stick.z - A.uz) < 0.45; SPX.hold = A.pw * CH; v = ok ? ['HOLD JUMP', 'hold', J] : ['PUSH THIS WAY', 'drag', toScr(A.ux, A.uz)]; }
  else if (jo && jo[1]) { SPX.hold = m.hold != null ? m.hold : 0; v = SPX.hold < 0.05 ? ['TAP JUMP!', 'tap', J] : ['HOLD JUMP', 'hold', J]; }
  else if (dk && dk[1]) v = ['HOLD DUCK', 'hold', [L.duck.x, L.duck.y]];
  else if (st && Math.hypot(st[1], st[2]) > 0.2) v = [G.lesson && G.lesson.id === 'wall' ? 'GO NOW!' : 'WALK THIS WAY', 'drag', toScr(st[1], st[2])];
  else v = G.duckHeld ? ['LET GO', 'release', [L.duck.x, L.duck.y]] : s2 ? ['LET GO: WAIT…', 'release', [s2.x, s2.y]] : ['WAIT…', 'wait', false];
  SPX.v = v; return v; }
function honest(G, o, mem) { if (G.over) return; const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random, P = G.p, t = G.t;
  if (P.state === 'fall' || P.stun > 0) { if (G.jumpHeld) ACT.jumpOn(G, false); ACT.duckOn(G, false); ACT.setStick(G, 0, 0); mem.wait = null; return; }
  if (G.jumpHeld) { ACT.setStick(G, mem.jx || 0, mem.jz || 0); if (G.charge >= mem.hold - 1e-9 || !G.charging) ACT.jumpOn(G, false); return; }
  if (P.state === 'air') { ACT.setStick(G, 0, 0); return; }
  if (mem.wait != null && t < mem.wait) { ACT.setStick(G, 0, 0); return; }
  const s = P.on, err = () => (R() - 0.5) * (1 - acc) * 1.25, late = () => (R() - 0.5) * react * 0.6, C = G.C;
  const go = (x, z, sp = 1) => { const dx = x - P.x, dz = z - P.z, d = Math.hypot(dx, dz), m = Math.min(sp, d * 1.6); ACT.setStick(G, d > 0.05 ? dx / d * m : 0, d > 0.05 ? dz / d * m : 0); return d; };
  const nextPlat = i => C.plats[i];
  if (s.kind === 'plat') { const pl = s.pl, ob = C.obs[pl.i]; ACT.duckOn(G, false);
    if (!ob) { go(0, P.z + 3); return; }
    const edge = pl.z1 - 0.45; if (P.z < edge - 0.15 && ob.kind !== 'wall') { go(0, edge); return; }
    if (ob.kind === 'wall') { go(0, pl.z1 + 1); return; }
    ACT.setStick(G, 0, 0); if (Math.hypot(P.vx, P.vz) > 0.6) return;
    if (ob.kind === 'balls') { const b = ob.balls[0], L0 = landAt(G, 0.5, 0, b.cz - P.z, b.top); const tt = (L0 ? L0.T : 0.9) + 0.25; ACT.aimJump(G, mem, ballX(b, t + tt), b.cz, b.top, err()); return; }
    if (ob.kind === 'sweep') { const dx = -ob.pivot.x, ang = Math.atan2(ob.pz - ob.pivot.z, dx), da = (((ang - ob.th) % TAU) + TAU) % TAU, tA = da / Math.max(0.01, ob.w); const per = TAU / Math.max(0.01, ob.w); if (!ob.open && (tA < 1.25 || tA > per - 0.25)) return; if (!ob.open && ob.high) { const db = (((ang - ob.th - Math.PI) % TAU) + TAU) % TAU / Math.max(0.01, ob.w); if (db < 1.25 || db > per - 0.25) return; } ACT.aimJump(G, mem, 0, ob.pz, TOP, err()); return; }
    if (ob.kind === 'belt') { const lz = ob.b0 + 1.4; if (ob.items.some(it => { for (let k = 0; k <= 10; k++) { const tt = 0.25 + 0.95 * k / 10, iz = beltItemZ(ob, it) - ob.v * tt, pz = P.z + (lz - P.z) * k / 10; if (iz < ob.z1 && Math.abs(iz - pz) < 1.0) return true; } const iz = beltItemZ(ob, it) - ob.v * 1.2; return it.type === 'barrier' && iz > lz && iz < lz + 2.4 && iz < ob.z1; })) return; ACT.aimJump(G, mem, 0, ob.b0 + 1.4, TOP, err() * 0.5); return; }
    if (ob.kind === 'cross') { const D = ob.cz - ob.L + 1.0 - P.z; let pw = 0, lo = 0, hi = 1; for (let i = 0; i < 16; i++) { const m = (lo + hi) / 2, L = landAt(G, m, 0, 1, TOP); if (L && L.z - P.z < D) lo = m; else hi = m; } pw = (lo + hi) / 2;
      const L = landAt(G, pw, 0, 1, TOP); if (!L) return; const T = pw * CH + L.T; let ok = true; for (const fz of [-0.3, 0, 0.3]) if (!crossHas(ob, 0, L.z + fz, ob.th + ob.w * T)) ok = false;
      if (ob.bar) { const r = Math.abs(L.z - ob.cz), ang = -Math.PI / 2; for (let k = 0; k <= 10; k++) { const tt = T - 0.3 + k * 0.15, bt = ob.bth - ob.w * 1.3 * tt; if (Math.abs(Math.atan2(Math.sin(ang - bt), Math.cos(ang - bt))) * r < 0.7) ok = false; } }
      if (ok && R() < 0.5 + acc * 0.5) { ACT.setStick(G, 0, 1); ACT.jumpOn(G, true); mem.hold = clamp(pw + err(), 0, 1) * CH; mem.jx = 0; mem.jz = 1; } return; }
    return; }
  if (s.kind === 'ball') { const ob = s.o, bi = s.bi, b = s.b, bx = ballX(b, t), d = Math.hypot(P.x - bx, P.z - b.cz);
    if (d > 0.25) { go(bx, b.cz); return; } ACT.setStick(G, 0, 0);
    if (bi < 3) { const nb = ob.balls[bi + 1], L0 = landAt(G, 0.6, 0, nb.cz - P.z, nb.top), tt = (L0 ? L0.T : 0.9) + 0.3; ACT.aimJump(G, mem, ballX(nb, t + tt), nb.cz, nb.top, err()); }
    else ACT.aimJump(G, mem, 0, ob.z1 + 1.4, TOP, err());
    return; }
  if (s.kind === 'ped') { const ob = s.o; if (ob.open) { ACT.aimJump(G, mem, 0, ob.z1 + 1.3, TOP, err() * 0.5); return; }
    if (Math.hypot(P.x, P.z - ob.pz) > 0.2) { go(0, ob.pz, 0.6); } else ACT.setStick(G, 0, 0);
    const ang = Math.atan2(P.z - ob.pivot.z, P.x - ob.pivot.x), w = Math.max(0.01, ob.w), tA = ((((ang - ob.th) % TAU) + TAU) % TAU) / w;
    if (mem.jt == null || mem.jfor !== Math.floor(ob.th / TAU)) { mem.jfor = Math.floor(ob.th / TAU); mem.jt = 0.36 + late(); }
    if (tA < mem.jt && tA > 0.05) { ACT.setStick(G, 0, 0); ACT.jumpOn(G, true); mem.hold = 0; mem.jx = 0; mem.jz = 0; mem.jt = -1; return; }
    if (ob.high) { const tB = ((((ang - ob.th - Math.PI) % TAU) + TAU) % TAU) / w; ACT.duckOn(G, tB < 0.45 + react * 0.2 || tB > TAU / w - 0.2); } return; }
  if (s.kind === 'ledge') { const ob = s.o; ACT.duckOn(G, false); const ahead = ob.gloves.find(g => g.z + 0.6 + PR > P.z - 0.02);
    if (!ahead) { go(0, ob.z1 + 1.5); return; }
    const z0 = ahead.z - 0.6 - PR, z1 = ahead.z + 0.6 + PR, near = z0 - P.z;
    if (P.z > z0 - 0.08) { ACT.setStick(G, -P.x, 1); return; }                       // committed: keep going through
    if (near > 0.45) { go(0, z0 - 0.2); return; }
    // in the gap: go only if the glove ahead stays in while we pass it
    const pass = (z1 + 0.1 - P.z) / 3.0, start = t + Math.max(0, react * 0.25 + late() * 0.5); let safe = true;
    for (let k = 0; k <= 12; k++) { const tt = start + (pass + 0.15) * k / 12; if (glove(ahead, tt).st === 'out') safe = false; }
    if (safe && (mem.gw == null || t >= mem.gw)) { mem.gw = null; go(0, z1 + 0.4); } else { if (!safe) mem.gw = null; ACT.setStick(G, -P.x, 0); }
    return; }
  if (s.kind === 'belt') { const ob = s.o; let sx = Math.abs(P.x) > 1.5 ? -Math.sign(P.x) * 0.5 : 0, sz = 1, duck = false;
    for (const it of ob.items) { const iz = beltItemZ(ob, it), dz = iz - P.z; if (dz < -0.8 || dz > 3.4) continue;
      if (it.type === 'barrier' && dz < 3.0) { const want = it.side < 0 ? 1.35 : -1.35; sx = clamp((want - P.x) * 2, -1, 1); if (Math.abs(want - P.x) > 0.5 && dz < 0.9) sz = 0.2; }
      else if (it.type === 'hurdle' && dz > 0) { if (mem.hj !== it) { mem.hj = it; mem.hd = 1.63 + late() * 4.2; } if (dz < mem.hd && dz > 0.7) { ACT.setStick(G, sx, 1); ACT.jumpOn(G, true); mem.hold = 0; mem.jx = sx; mem.jz = 1; return; } }
      else if (it.type === 'bar' && dz < 0.8 + react * 0.4 && dz > -0.72) duck = true; }
    ACT.duckOn(G, duck); ACT.setStick(G, sx, sz); return; }
  if (s.kind === 'cross') { const ob = s.o, dx = P.x, dz = P.z - ob.cz, r = Math.hypot(dx, dz), w = ob.w;
    // the opposing bar: jump it in place
    if (ob.bar && r > 0.85) { const ang = Math.atan2(dz, dx), da = Math.atan2(Math.sin(ob.bth - ang), Math.cos(ob.bth - ang)), rel = -w * 1.3 - w, tA = rel !== 0 ? -da / rel : 99;
      if (tA > 0.05 && tA < 0.34 + late()) { ACT.setStick(G, 0, 0); ACT.jumpOn(G, true); mem.hold = 0; mem.jx = 0; mem.jz = 0; return; } }
    const goal = Math.PI / 2, Tw = (ob.L - 1.2) / RUN;
    if (mem.arm == null) { if (r > 0.45) { go(0, ob.cz); return; } ACT.setStick(G, 0, 0);
      for (let k = 0; k < 4; k++) { const a = ob.th + k * Math.PI / 2 + w * (Tw + 0.15); if (Math.abs(Math.atan2(Math.sin(a - goal), Math.cos(a - goal))) < 0.18) { if (ob.bar) { const a0 = ob.th + k * Math.PI / 2; let clash = false; for (let q = 0; q <= 12; q++) { const tt = (Tw + 0.35) * q / 12, d2 = Math.atan2(Math.sin(ob.bth - ob.w * 1.3 * tt - a0 - w * tt), Math.cos(ob.bth - ob.w * 1.3 * tt - a0 - w * tt)); if (Math.abs(d2) < 0.22) clash = true; } if (clash) continue; } mem.arm = k; break; } } return; }
    const a = ob.th + mem.arm * Math.PI / 2, ux = Math.cos(a), uz = Math.sin(a);
    if (r < ob.L - 1.0) { ACT.setStick(G, ux, uz); return; }
    const off = Math.atan2(Math.sin(a - goal), Math.cos(a - goal)); if (Math.abs(off) > 0.4) { mem.arm = null; go(0, ob.cz); return; }
    mem.arm = null; ACT.aimJump(G, mem, 0, ob.z1 + 1.4, TOP, err() * 0.5); return; } }

// what the robot would do now, without doing it (tools/dry_plan.py): the tutorial shows this move
const ACT_REAL = { setStick, jumpOn, duckOn, aimJump }; let ACT = ACT_REAL;
function dryPlan(G, o, mem) { let got = null; const rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { if (!got && !(a.length > 2 && a.slice(1).every(v => v === 0 || v === false))) got = [n, ...a.slice(1)]; return true; };      /* (a stick at rest, all its numbers 0, is not a move; a first bed, number 0, is) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return got; }
function dryPlanAll(G, o, mem) { const all = [], rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { all.push([n, ...a.slice(1)]); return true; };      /* every call, in order (for a robot that steers and drifts at once) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return all; }
