// ===================== RULES: Police Chase (game 14) =====================
// Three parts, one chase:
//   DRIVE: (second version, 23 Nov 2026, his review: specs/police-v2-2026-11-23.md) through a CITY OF STREETS AND CORNERS. Left thumb: a
//          stick that steers. Right thumb: GAS and BRAKE (held at a standstill, BRAKE reverses). He turns at junctions; brake for the
//          corner or you will not make it. Ram his SIDE or BACK CORNER (a PIT): he spins. Enough spins and he crashes and runs.
//          A wall scrape costs speed; a hard hit on a wall or a car costs a life; fall too far behind and he is gone.
//   FOOT:  (third version, 23 Nov 2026, his second review: specs/police-v3-2026-11-23.md) after him through alleys WITH CORNERS,
//          running by yourself. Swipe left or right to change lane round crates and bins, up to jump a fence, down to slide under a
//          pipe. At a corner, swipe the way he turned (the genre's own control, Temple Run's): miss it and you hit the wall. Close in
//          and press ARREST (a button that lights when you are near enough): too far and you dive at air.
//   CUFF:  he fights to break free: a tug of war. Every tap pulls the bar towards CUFFED; he drags it back, and harder when he
//          surges. Tap faster than he fights. Let the bar empty and he is up and running again.
// World: metres; x east, s north. A heading h is clockwise from north: forward is (sin h, cos h). Streets run along every
// multiple of P in x and in s, RW either side of the line; everything else is a block of buildings.

const RULES = [
  '<b>Chase the car under the RED ARROW.</b> Left thumb: the stick steers. Right thumb: <b>GAS</b> and <b>BRAKE</b> (hold BRAKE when stopped to reverse).',
  '<b>Brake for corners.</b> Ram his <b>side or back corner</b> to spin him (a PIT). Straight into his bumper does nothing. Miss the traffic.',
  '<b>On foot:</b> swipe left or right round crates, up over fences, down under pipes. <b>At a corner, swipe the way he turned.</b>',
  '<b>Press ARREST</b> when you are right behind him (the button lights up). Too far and you dive at air.',
  '<b>Cuff him: tap fast.</b> Tap faster than he fights and the bar fills to CUFFED. Let it empty and he runs.',
  'Three lives: a crash or letting him break free costs one. Fall too far behind and he gets away.',
];
const WEATHERS = ['night', 'rain', 'dusk', 'storm', 'night', 'overcast', 'mist', 'night', 'golden'];
function weatherOf(N) { if (N <= 2) return ['night', 'rain'][N - 1]; const R = rng(N * 7001 + 1); R(); return WEATHERS[(R() * WEATHERS.length) | 0]; }
const ALLEY = [-1.3, 0, 1.3], P = 84, RW = 8, LANE = 3.4, DIRS = [[0, 1], [1, 0], [0, -1], [-1, 0]];      // streets every P metres, RW either side; N E S W
const wrapPi = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; }, nearLine = v => Math.round(v / P) * P;
const onRoad = (x, s, m = 0) => Math.abs(x - nearLine(x)) <= RW - m || Math.abs(s - nearLine(s)) <= RW - m;

function makeCfg(N, help) {
  const f = curve(N), e = easyOf(N), boss = N % 10 === 0, x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s));
  return { N, f, e, boss, help: !!help, lives: 3,
    vmax: x(28, 34, 35), crookV: x(0.72, 0.84, 35) * (1 - 0.1 * e),                 // your top speed (m/s); his, as a share of it
    pits: N <= 2 ? 1 : Math.min(4, 1 + Math.round(x(0, 3, 25))) + (boss ? 1 : 0),
    traffic: x(0.01, 0.022, 35) * (1 - 0.4 * e),                   // cars per metre of avenue
    cross: N >= 4 ? x(0.2, 0.5, 30) : 0,                            // chance a car crosses at a junction
    escape: x(230, 200, 35) + 30 * e,                                // he is gone if this far ahead (m)
    footLen: x(230, 380, 30), footGap: 12, run: 8.2, crookRun: x(6.5, 7.4, 30),
    obst: x(0.05, 0.11, 30) * (1 - 0.3 * e),                        // obstacles per metre of alley
    tackle: (x(2.8, 2.0, 25) + 0.5 * e) * (help ? 1.2 : 1),          // how close you must be to tackle (m)
    turnGap: Math.round(x(9, 6, 30)), tee: N >= 6 ? x(0.15, 0.5, 30) : 0,      // corridor between corners (6 m modules); how often a corner is a T (follow him: the other way is a dead end)
    pull: 0.055, resist: x(0.11, 0.2, 30) * (1 - 0.25 * e) * (help ? 0.85 : 1), surgeX: 1.7, surgeGap: x(2.6, 1.6, 30) };      // the struggle: what a tap gains; what he drags back a second; how much harder in a surge; how often he surges
}
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null,
    weather: weatherOf(N), ph: 'drive', ph_t: 0, lives: cfg.lives, crashes: 0, pitN: 0, stumbles: 0,
    in: { sx: 0, gas: false, brake: false }, me: { x: LANE, s: 12, h: 0, v: 12, w: 0, imm: 0 }, crook: { x: LANE, s: 52, h: 0, v: 14, spin: 0, dir: 0, ni: 0, nj: 1, next: null, off: LANE },
    traffic: [], trail: [], turns: [], gone: 0, foot: null, cuff: null, passed: 0 };
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G);
  return G;
}
// ---------- the thumbs ----------
function drive(G, sx, gas, brake) { const I = G.in; I.sx = clamp(sx, -1, 1); I.gas = !!gas; I.brake = !!brake; }      // the stick (left -1 .. right +1) and the two pedals
function swipe(G, dir) {      // 'l' 'r' 'u' 'd'
  if (G.over) return;
  if (G.ph !== 'foot') return; const F = G.foot;
  if (dir === 'l' || dir === 'r') { const nt = F.turns.find(q => !q.past);      // near a corner a sideways swipe is the turn (the first one counts); anywhere else it changes lane
    if (nt && nt.s - F.s <= FOOT_WIN) { if (nt.got === null) { const ok = (dir === 'r' ? 1 : -1) === nt.dir; nt.got = ok ? 'ok' : 'wrong'; G.ev.push({ k: ok ? 'turnset' : 'turnwrong', dir }); } return; }
    F.lane = clamp(F.lane + (dir === 'l' ? -1 : 1), 0, 2); }
  else if (dir === 'u' && F.air <= 0 && F.low <= 0) { F.air = 0.75; G.ev.push({ k: 'jump' }); } else if (dir === 'd' && F.air <= 0 && F.low <= 0) { F.low = 0.8; G.ev.push({ k: 'slide' }); }
  G.ev.push({ k: 'dodge', dir });
}
function tap(G) {      // on foot: the ARREST button. In the struggle: every tap, anywhere
  if (G.over) return;
  if (G.ph === 'cuff') { const C = G.cuff; C.m += G.cfg.pull * (lessonNow(G) ? 1.3 : 1); C.taps++; G.ev.push({ k: 'pull', m: C.m }); if (C.m >= 1) { C.m = 1; cuffed(G); } return; }
  if (G.ph !== 'foot') return; const F = G.foot; if (F.dive > 0) return; const L = lessonNow(G); if (L && L.id !== 'tackle') return;
  if (F.gap <= G.cfg.tackle * (L ? 1.3 : 1)) { G.ev.push({ k: 'tackle' }); if (L) lessonSee(G, 'tackle'); else startCuff(G); }
  else { F.dive = 0.9; F.gap += 3; G.ev.push({ k: 'dive' }); lessonMiss(G, 'dive'); }
}
// ---------- every frame ----------
function step(G, dt) {
  if (G.over) return; G.t += dt; G.ph_t += dt;
  if (G.ph === 'drive') driveStep(G, dt); else if (G.ph === 'crash') { if (G.ph_t > 1.6) startFoot(G); } else if (G.ph === 'foot') footStep(G, dt); else if (G.ph === 'cuff') cuffStep(G, dt);
}
function driveStep(G, dt) {
  const c = G.cfg, me = G.me, ck = G.crook, I = G.in, R = G.rnd, L = lessonNow(G), vmax = c.vmax * (L ? 0.8 : 1), stuck = L && G.lesson.miss >= 4;
  // ---- your car: gas, brake (then reverse), a stick that turns it less the faster it goes
  me.imm = Math.max(0, me.imm - dt);
  if (I.brake) me.v = me.v > 0.3 ? Math.max(0, me.v - 24 * dt) : Math.max(-8, me.v - 9 * dt);
  else if (I.gas) me.v = me.v < vmax ? Math.min(vmax, me.v + (me.v < 0 ? 22 : 1.5 + 9 * (1 - 0.55 * me.v / vmax)) * dt) : Math.max(vmax, me.v - 6 * dt);
  else me.v -= Math.sign(me.v) * Math.min(Math.abs(me.v), 3.2 * dt);
  const sp = Math.abs(me.v), grip = Math.min(1, sp / 6) / (1 + Math.max(0, sp - 15) * 0.045); me.w = I.sx * 2.3 * grip * (me.v < 0 ? -1 : 1); me.h = wrapPi(me.h + me.w * dt);
  let nx = me.x + Math.sin(me.h) * me.v * dt, ns = me.s + Math.cos(me.h) * me.v * dt;
  if (!onRoad(nx, ns, 1.1)) {      // a wall: slide along it, lose speed by how squarely you met it, and be turned a little to run with the street
    const okx = onRoad(nx, me.s, 1.1), oks = onRoad(me.x, ns, 1.1), into = okx ? Math.abs(Math.cos(me.h)) : oks ? Math.abs(Math.sin(me.h)) : 1;
    if (okx) ns = me.s; else if (oks) nx = me.x; else { nx = me.x; ns = me.s; }
    if (me.imm <= 0) { if (sp * into > 21 && !L) crash(G, 'wall'); else if (sp > 4) { G.ev.push({ k: 'kerb' }); me.imm = 0.35; } }
    me.v -= me.v * Math.min(1, into * 5 * dt); const along = okx ? (Math.sin(me.h) >= 0 ? Math.PI / 2 : -Math.PI / 2) : (Math.cos(me.h) >= 0 ? 0 : Math.PI); me.h = wrapPi(me.h + wrapPi(along - me.h) * Math.min(1, dt * 2.5 * into)); }
  me.x = nx; me.s = ns;
  // ---- the getaway car: keeps to the right-hand lane, picks a way at every junction (never back the way he came), slows for the corner
  const D = DIRS[ck.dir], nxC = ck.ni * P, nsC = ck.nj * P, toNode = (nxC - ck.x) * D[0] + (nsC - ck.s) * D[1];
  if (ck.next == null && toNode < 46) { const pick = [ck.dir, (ck.dir + 1) % 4, (ck.dir + 3) % 4], away = pick.filter(d => { const ax = nxC + DIRS[d][0] * P, as = nsC + DIRS[d][1] * P; return Math.hypot(ax - me.x, as - me.s) > Math.hypot(nxC - me.x, nsC - me.s) - 20; });
    const from = away.length ? away : pick; ck.next = L && L.id === 'pit' ? ck.dir : from[(R() * from.length) | 0]; if (R() < 0.35 && from.includes(ck.dir)) ck.next = ck.dir; }
  if (toNode < (ck.next !== ck.dir ? 7.5 : 0)) { if (ck.next !== ck.dir) { G.turns.push({ x: nxC, s: nsC }); if (G.turns.length > 6) G.turns.shift(); G.ev.push({ k: 'turn' }); } ck.dir = ck.next == null ? ck.dir : ck.next; ck.next = null; ck.ni += DIRS[ck.dir][0]; ck.nj += DIRS[ck.dir][1]; }
  { const d = DIRS[ck.dir], rx = d[1], rs = -d[0];      // his right-hand side
    let blocked = false; for (const t of G.traffic) { const fz = (t.x - ck.x) * d[0] + (t.s - ck.s) * d[1], fx = (t.x - ck.x) * rx + (t.s - ck.s) * rs; if (t.dir === ck.dir && fz > 0 && fz < 26 && Math.abs(fx) < 2.4) blocked = true; }
    ck.off += ((blocked ? -0.4 : LANE) - ck.off) * Math.min(1, dt * 2.5);      // round a slower car by the middle of the street
    const ax = (d[0] ? ck.x : nearLine(ck.x)) + rx * ck.off + d[0] * 13, as = (d[1] ? ck.s : nearLine(ck.s)) + rs * ck.off + d[1] * 13, err = wrapPi(Math.atan2(ax - ck.x, as - ck.s) - ck.h);
    const turning = ck.next != null && ck.next !== ck.dir && toNode < 34 || Math.abs(err) > 0.5, dist = Math.hypot(ck.x - me.x, ck.s - me.s);
    const top = ck.spin > 0 ? vmax * 0.3 : L ? (dist > 50 || stuck ? 5 : L.id === 'pit' ? vmax * 0.5 : vmax * 0.62) : vmax * c.crookV * (dist > 170 ? 0.62 : dist > 115 ? 0.8 : 1), want = turning ? Math.min(top, 12.5) : top;      /* far ahead, he eases off: he thinks he has lost you */
    ck.v += clamp(want - ck.v, -16 * dt, 7 * dt); ck.spin = Math.max(0, ck.spin - dt);
    if (ck.spin <= 0) ck.h = wrapPi(ck.h + clamp(err * 4, -2.4, 2.4) * dt); ck.x += Math.sin(ck.h) * ck.v * dt; ck.s += Math.cos(ck.h) * ck.v * dt;
    if (!onRoad(ck.x, ck.s, 1)) { ck.x += (nearLine(ck.x) - ck.x) * 0.05; ck.s += (nearLine(ck.s) - ck.s) * 0.05; }
    const tl = G.trail, last = tl[tl.length - 1]; if (!last || Math.hypot(ck.x - last[0], ck.s - last[1]) > 4) { tl.push([ck.x, ck.s]); if (tl.length > 160) tl.shift(); } }
  // ---- traffic: cars keeping to their lane along the streets near you
  const want = L ? (L.id === 'pit' ? 0 : 5) : Math.round(c.traffic * 900);
  for (let tries = 0; G.traffic.length < want && tries < 4; tries++) { const dir = (R() * 4) | 0, d = DIRS[dir], line = nearLine((d[0] ? me.s : me.x) + (R() - 0.5) * 5 * P), pos = (d[0] ? me.x : me.s) + (R() - 0.5) * 6 * P;
    const x = d[0] ? pos : line + d[1] * LANE, s2 = d[0] ? line - d[0] * LANE : pos; if (Math.hypot(x - me.x, s2 - me.s) < 70 || Math.hypot(x - ck.x, s2 - ck.s) < 30) continue; G.traffic.push({ x, s: s2, dir, v: 8 + R() * 6, col: (R() * 6) | 0, hit: 0 }); }
  for (const t of G.traffic) { const d = DIRS[t.dir]; t.x += d[0] * t.v * dt; t.s += d[1] * t.v * dt; if (t.hit > 0) { t.hit -= dt; t.x += t.hx * dt; t.s += t.hs * dt; }
    const dx = t.x - me.x, ds = t.s - me.s; if (dx * dx + ds * ds < 7.3 && me.imm <= 0) { const k2 = Math.hypot(dx, ds) || 1; t.hit = 0.6; t.hx = dx / k2 * 5; t.hs = ds / k2 * 5; if (sp > 6) crash(G, 'car'); else { me.v *= 0.5; me.imm = 0.5; G.ev.push({ k: 'kerb' }); } } }
  G.traffic = G.traffic.filter(t => Math.hypot(t.x - me.x, t.s - me.s) < 3.6 * P);
  // ---- the PIT: into his side or his back corner. Square into his bumper does nothing.
  const dx = me.x - ck.x, ds = me.s - ck.s, dist = Math.hypot(dx, ds);
  if (dist < 2.9 && me.imm <= 0 && ck.spin <= 0) { const lx = dx * Math.cos(ck.h) - ds * Math.sin(ck.h), easy = L && L.id === 'pit';
    if (easy ? sp > 3 : Math.abs(lx) > 0.75 && sp > 8) { ck.spin = 1.8; G.pitN++; me.imm = 0.7; me.v *= 0.8; G.ev.push({ k: 'pit', n: G.pitN }); lessonSee(G, 'pit'); if (!G.lesson && G.pitN >= c.pits) { G.ph = 'crash'; G.ph_t = 0; G.ev.push({ k: 'crookcrash' }); } }
    else { me.v = Math.min(me.v, ck.v * 0.8); me.imm = 0.5; me.x += dx / (dist || 1) * 0.6; me.s += ds / (dist || 1) * 0.6; G.ev.push({ k: 'bump' }); lessonMiss(G, 'bump'); } }
  if (me.hRef == null) me.hRef = me.h; if (Math.abs(wrapPi(me.h - me.hRef)) > 1.25 && sp > 4) { me.hRef = me.h; if (dist < 90) lessonSee(G, 'corner'); }      // you came round a corner with him still in reach (the lesson counts these; it cannot stall on a turn you missed)
  if (dist > c.escape) { G.gone += dt; if (G.gone > 4) { if (L) { G.gone = 0; lessonMiss(G, 'far'); } else finish(G, false, 'escaped'); } } else G.gone = 0;
}
function crash(G, what) {
  const me = G.me; me.v *= what === 'wall' ? -0.25 : 0.3; me.imm = 1.2; G.crashes++; G.ev.push({ k: 'crash', what });
  if (lessonNow(G)) { lessonMiss(G, 'crash'); return; } G.lives--; if (G.lives <= 0) finish(G, false, 'wrecked');
}
// ---------- on foot ----------
// The alleys have corners. F.turns: { s (how far along the run), dir (-1 left, +1 right), tee (both ways look open: follow him),
// px, py (the corner's place: x east, y north), h0 (the heading into it), got (null | 'ok' | 'wrong'), past }. The run only ever
// heads north, east or west, so it never crosses itself. Corridors are whole 6 m modules between 5.2 m corner squares (the view
// builds its walls from them).
const FOOT_R = 2.2, FOOT_WIN = 13, FOOT_BACK = 12;      // the arc you round a corner on; how far before a corner a swipe is the turn; alley behind the start
function footPath(R, len, o) {
  const turns = []; let s = o.first, h = 0, px = 0, py = 0, prev = 0;
  while (s < len + 420) { const hq = Math.round(h / (Math.PI / 2)), dir = hq === 0 ? (R() < 0.5 ? -1 : 1) : -hq;
    px += Math.sin(h) * (s - prev); py += Math.cos(h) * (s - prev); turns.push({ s, dir, tee: R() < o.tee, px, py, h0: h, got: null, past: false });
    h += dir * Math.PI / 2; prev = s; s += 5.2 + 6 * (o.gapMin + ((R() * o.gapVar) | 0)); }
  return turns;
}
function footAt(F, s) {      // where the run is, s metres along: { x, y, h }; each corner is rounded on a short arc
  const T = F.turns; let i = 0; while (i < T.length && T[i].s + FOOT_R <= s) i++; const t = T[i];
  if (t && s > t.s - FOOT_R) { const th = (s - (t.s - FOOT_R)) / (2 * FOOT_R) * Math.PI / 2, fx = Math.sin(t.h0), fy = Math.cos(t.h0), rx = fy * t.dir, ry = -fx * t.dir, ox = t.px - fx * FOOT_R + rx * FOOT_R, oy = t.py - fy * FOOT_R + ry * FOOT_R;
    return { x: ox + (-rx * Math.cos(th) + fx * Math.sin(th)) * FOOT_R, y: oy + (-ry * Math.cos(th) + fy * Math.sin(th)) * FOOT_R, h: t.h0 + t.dir * th }; }
  const p = T[i - 1], h = p ? p.h0 + p.dir * Math.PI / 2 : 0, d = s - (p ? p.s : 0); return { x: (p ? p.px : 0) + Math.sin(h) * d, y: (p ? p.py : 0) + Math.cos(h) * d, h };
}
function startFoot(G, gap) {
  const c = G.cfg, R = G.rnd, obs = [], L = lessonNow(G), id = L && L.ph === 'foot' ? L.id : null, len = c.footLen * (L ? 2 : 1);
  // a lesson teaches one thing at a time: corners with nothing in the way, then dodging down a straight alley, then the arrest
  const turns = id === 'dodge' || id === 'tackle' ? [] : footPath(R, len, id === 'corner' ? { first: 32.6, gapMin: 6, gapVar: 2, tee: 0 } : { first: 44.6 + 6 * ((R() * 3) | 0), gapMin: c.turnGap, gapVar: 5, tee: c.tee });
  if (id !== 'corner' && id !== 'tackle') for (let s = 18; s < len + 400; s += 1 / c.obst * (0.6 + 0.8 * R())) { const r = R(), type = r < 0.5 ? 'crate' : r < 0.78 ? 'fence' : 'pipe', o = { s, lane: type === 'crate' ? (R() * 3) | 0 : -1, type, two: type === 'crate' && R() < 0.4 ? ((R() * 3) | 0) : -1 };
    if (!turns.some(t => s > t.s - 17 && s < t.s + 9)) obs.push(o); }      // nothing to dodge in a corner
  G.ph = 'foot'; G.ph_t = 0; G.foot = { s: 0, lane: 1, x: 0, gap: gap || c.footGap, air: 0, low: 0, dive: 0, stumble: 0, obs, turns, len, crookLane: 1, crookX: 0 }; G.ev.push({ k: 'foot' });
}
function footStep(G, dt) {
  const c = G.cfg, F = G.foot, R = G.rnd, L = lessonNow(G);
  F.air = Math.max(0, F.air - dt); F.low = Math.max(0, F.low - dt); F.dive = Math.max(0, F.dive - dt); F.stumble = Math.max(0, F.stumble - dt);
  const v = F.stumble > 0 || F.dive > 0 ? 3 : c.run * (L ? 0.85 : 1), cv = c.crookRun * (L ? 0.8 : 1);
  F.s += v * dt; F.gap += (cv - v) * dt; if (L && L.id !== 'tackle') F.gap = Math.max(F.gap, 8); F.x += clamp(ALLEY[F.lane] - F.x, -7 * dt, 7 * dt);
  // he weaves too, and keeps to free lanes
  F.crookT = (F.crookT || 1) - dt; if (F.crookT <= 0) { F.crookT = 0.8 + R() * 1.4; F.crookLane = (R() * 3) | 0; } F.crookX += clamp(ALLEY[F.crookLane] - F.crookX, -5 * dt, 5 * dt);
  for (const o of F.obs) if (!o.done && o.s <= F.s) { o.done = true;
    const lane = Math.round((F.x + 1.3) / 1.3), blocked = o.type === 'crate' ? (lane === o.lane || lane === o.two) : o.type === 'fence' ? F.air <= 0.08 : F.low <= 0.05;
    if (blocked) { F.stumble = 0.8; G.stumbles++; G.ev.push({ k: 'stumble', type: o.type }); lessonMiss(G, o.type); } else { G.ev.push({ k: 'cleared', type: o.type }); lessonSee(G, 'cleared'); } }
  // the corner: swiped the way he went, you are round it; swiped the wrong way or not at all, you meet the wall first
  for (const t of F.turns) { if (!t.seen && F.s + F.gap >= t.s) { t.seen = true; G.ev.push({ k: 'crookturn', dir: t.dir }); } if (t.past) continue; if (F.s < t.s - 1.2) break; t.past = true;
    if (t.got === 'ok') { G.ev.push({ k: 'cornered', dir: t.dir }); lessonSee(G, 'corner'); }
    else { F.stumble = t.tee && t.got === 'wrong' ? 1.3 : 0.9; G.stumbles++; G.ev.push({ k: 'wall', why: t.got === 'wrong' ? (t.tee ? 'deadend' : 'wrong') : 'late', dir: t.dir }); lessonMiss(G, 'corner'); } }
  if (F.gap < 0.6) { F.gap = 3.5; G.ev.push({ k: 'shove' }); }      // right on him without the arrest: he shoves you off
  if (F.gap > 34) { if (L) { F.gap = 12; lessonMiss(G, 'far'); } else finish(G, false, 'away'); }
  if (L && F.s > F.len + 300) { startFoot(G, 12); return; }      // a very long lesson: a fresh alley
  if (F.s > F.len && !L) { if (F.gap > 6) finish(G, false, 'away'); else { F.gap = Math.min(F.gap, 2); } }
}
// ---------- the cuffs: a tug of war ----------
function startCuff(G) { G.ph = 'cuff'; G.ph_t = 0; G.cuff = { m: 0.35, surge: 0, next: 1.2 + G.rnd() * 0.8, taps: 0 }; G.ev.push({ k: 'cuffstart' }); }
function cuffStep(G, dt) {
  const c = G.cfg, C = G.cuff, L = lessonNow(G); if (G.ph_t < 0.6) return;      // a breath to find the button
  C.surge = Math.max(0, C.surge - dt); C.next -= dt; if (C.next <= 0) { C.surge = 0.8; C.next = c.surgeGap * (0.7 + 0.6 * G.rnd()); G.ev.push({ k: 'surge' }); }
  C.m -= c.resist * (C.surge > 0 ? c.surgeX : 1) * (L ? 0.55 : 1) * dt; if (C.m <= 0) breakFree(G, 'slow');
}
function breakFree(G, why) {
  G.ev.push({ k: 'free', why }); if (lessonNow(G)) { lessonMiss(G, why); G.cuff.m = 0.35; G.cuff.surge = 0; G.cuff.next = 1.5; return; }
  G.lives--; if (G.lives <= 0) { finish(G, false, 'free'); return; } startFoot(G, 7);
}
function cuffed(G) { G.ev.push({ k: 'cuffed' }); if (G.lesson) lessonSee(G, 'cuffed'); else finish(G, true); }
function finish(G, win, why) {
  const c = G.cfg; G.over = win ? 'won' : 'lost';
  G.res = { win, why, stars: win ? (G.lives === c.lives ? 3 : G.lives === c.lives - 1 ? 2 : 1) : 0, crashes: G.crashes, pits: G.pitN, stumbles: G.stumbles, time: G.t, combo: G.passed };
  G.ev.push({ k: win ? 'won' : 'lost', why });
}
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'steer', ph: 'drive', title: 'FOLLOW THE RED ARROW', how: 'Left thumb: the stick steers. Right thumb: hold GAS. BRAKE before a corner. Follow him round 2 corners.', need: 2, ok: w => w === 'corner' },
      { id: 'pit', ph: 'drive', title: 'RAM HIS BACK CORNER', how: 'Catch him up and drive into his SIDE or back corner. Straight into his bumper does nothing.', need: 1, ok: w => w === 'pit' }],
  2: [{ id: 'corner', ph: 'foot', title: 'FOLLOW HIM ROUND THE CORNER', how: 'When the alley turns, swipe LEFT or RIGHT: the way he went.', need: 2, ok: w => w === 'corner' },
      { id: 'dodge', ph: 'foot', title: 'DODGE, JUMP, SLIDE', how: 'Swipe left or right round crates, UP over fences, DOWN under pipes.', need: 4, ok: w => w === 'cleared' },
      { id: 'tackle', ph: 'foot', title: 'ARREST HIM', how: 'Run until you are right behind him. The ARREST button lights up: press it.', need: 1, ok: w => w === 'tackle' }],
  3: [{ id: 'hold', ph: 'cuff', title: 'TAP FASTER THAN HE FIGHTS', how: 'Tap anywhere, fast: every tap pulls the bar towards CUFFED. When he fights back, tap faster.', need: 1, ok: w => w === 'cuffed' }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0, miss: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonPhase(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonPhase(G) { const st = lessonNow(G); if (!st) return; if (st.id === "pit") G.traffic.length = 0; if (st.ph === 'foot') startFoot(G, st.id === 'tackle' ? 7 : 12); if (st.ph === 'cuff') startCuff(G); }
function lessonSee(G, what) {
  const D = G.lesson; if (!D) return; const st = D.steps[D.i]; if (!st.ok(what)) return;
  D.n++; if (D.n < st.need) { G.ev.push({ k: 'lessonok', n: D.n, need: st.need }); return; }
  D.i++; D.n = 0; D.miss = 0;
  if (D.i >= D.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); Object.assign(G, { ph: 'drive', ph_t: 0, lives: G.cfg.lives, crashes: 0, pitN: 0, foot: null, cuff: null }); G.crook.spin = 0; G.turns.length = 0; G.ev.push({ k: 'drive' }); }
  else { G.ev.push({ k: 'lessonnext' }); lessonPhase(G); }
}
function lessonMiss(G, why) { const D = G.lesson; if (!D) return; D.miss++; G.ev.push({ k: 'lessonmiss', why, how: D.steps[D.i].how }); }

// ---------- for the robots ----------
// BLIND: the stick left, right, centred; GAS (brake off), BRAKE (gas off); on foot: swipes and the ARREST button; in the struggle: taps.
const BLIND = { L: G => { G.in.sx = -1; }, R: G => { G.in.sx = 1; }, N: G => { G.in.sx = 0; }, G: G => { G.in.gas = true; G.in.brake = false; }, B: G => { G.in.brake = true; G.in.gas = false; },
  l: G => swipe(G, 'l'), r: G => swipe(G, 'r'), u: G => swipe(G, 'u'), d: G => swipe(G, 'd'), t: G => tap(G) };
function honest(G, o, mem) {
  const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, t = G.t;
  const later = (key, cond) => { if (!cond) { mem[key] = null; return false; } if (mem[key] == null) mem[key] = t; return t - mem[key] >= react; };
  if (G.ph === 'drive') { const me = G.me, ck = G.crook, I = G.in, tl = G.trail, sp = Math.abs(me.v), dist = Math.hypot(ck.x - me.x, ck.s - me.s);
    // someone who looks: follows the way he went (round the corners he took), brakes for a corner and for a car ahead, then goes for his side
    let bi = 0, bd = 1e9; for (let i = 0; i < tl.length; i++) { const d2 = Math.hypot(tl[i][0] - me.x, tl[i][1] - me.s); if (d2 <= bd) { bd = d2; bi = i; } }
    const ahead = Math.round((7 + sp * 0.5) / 4), far = Math.round((14 + sp * 1.1) / 4), p1 = tl[Math.min(tl.length - 1, bi + ahead)] || [ck.x, ck.s], p2 = tl[Math.min(tl.length - 1, bi + far)] || p1;
    let tx = p1[0], ts = p1[1]; const fx = Math.sin(ck.h), fs = Math.cos(ck.h), rx = fs, rs = -fx;
    if (dist < 20 && bi + ahead >= tl.length - 2) { const side = mem.side || (mem.side = ((me.x - ck.x) * rx + (me.s - ck.s) * rs) < 0 ? -1 : 1), lz = (me.x - ck.x) * fx + (me.s - ck.s) * fs; const o2 = lz > -5 ? 0.3 : 2.2; tx = ck.x + rx * side * o2 + fx * 1.5; ts = ck.s + rs * side * o2 + fs * 1.5; } else mem.side = null;
    let err = wrapPi(Math.atan2(tx - me.x, ts - me.s) - me.h); const bend = Math.abs(wrapPi(Math.atan2(p2[0] - me.x, p2[1] - me.s) - me.h));
    let brake = (Math.abs(err) > 0.5 && sp > 11) || (bend > 0.55 && sp > 15) || (bend > 0.9 && sp > 12), dodge = 0;
    for (const t2 of G.traffic) { const lz = (t2.x - me.x) * Math.sin(me.h) + (t2.s - me.s) * Math.cos(me.h), lx = (t2.x - me.x) * Math.cos(me.h) - (t2.s - me.s) * Math.sin(me.h); if (lz > 0 && lz < 9 + sp * (0.7 + react) && Math.abs(lx) < 2.6) { dodge = lx > 0 ? -0.9 : 0.9; if (lz < 6 + sp * react * 1.5 && sp > 9) brake = true; } }
    // slow hands, not blind ones: the stick follows what he wants with a lag (his reaction time), the brake comes on a reaction late, and now and then he misjudges
    if (t > (mem.offT || 0)) { mem.offT = t + 0.7; mem.off = Math.random() > acc ? (Math.random() - 0.5) * 0.7 : 0; } err += mem.off || 0;
    if (sp < 1.5 && !onRoad(me.x + Math.sin(me.h) * 4, me.s + Math.cos(me.h) * 4, 1.1)) mem.back = t + 0.9;      // nose against a wall: back out
    if (mem.back && t < mem.back) { drive(G, -clamp(err * 2, -1, 1), false, true); return; }
    mem.sx = (mem.sx || 0) + (clamp(err * 2.4 + dodge, -1, 1) - (mem.sx || 0)) * Math.min(1, (1 / 60) / (0.08 + react * 0.5)); const br = later('br', brake) && sp > 6;
    drive(G, mem.sx, !br, br); return; }
  if (G.ph === 'foot') { const F = G.foot, next = F.obs.find(q => !q.done && q.s > F.s), look = 7.6 * (react + 0.25), nt = F.turns.find(q => !q.past);
    if (nt && nt.got === null && later('tn', nt.s - F.s <= FOOT_WIN - 1)) { const d = Math.random() < acc + (1 - acc) * 0.5 ? nt.dir : -nt.dir; swipe(G, d > 0 ? 'r' : 'l'); mem.tn = null; }      // sees the way he went, a reaction late; now and then goes wrong
    if (next && next.s - F.s < look + 2 && next.s - F.s > look - 1.5 && mem.obs !== next) { mem.obs = next; const right = Math.random() < acc;
      if (next.type === 'fence') swipe(G, right ? 'u' : 'd'); else if (next.type === 'pipe') swipe(G, right ? 'd' : 'u');
      else { const lane = Math.round((F.x + 1.3) / 1.3); if (lane === next.lane || lane === next.two) { const free = [0, 1, 2].filter(l => l !== next.lane && l !== next.two).sort((a, b) => Math.abs(a - lane) - Math.abs(b - lane))[0]; const d = right ? free : lane; if (d < lane) swipe(G, 'l'); else if (d > lane) swipe(G, 'r'); if (Math.abs(d - lane) > 1) swipe(G, d < lane ? 'l' : 'r'); } } }
    if (later('tk', F.gap < G.cfg.tackle * 0.9)) { tap(G); mem.tk = null; } return; }
  if (G.ph === 'cuff') { if (t >= (mem.cfT || 0)) { mem.cfT = t + 0.1 + react * 0.2; if (Math.random() < 0.5 + acc * 0.5) tap(G); } }      // taps as fast as his hands go: about 7 a second sharp, 5 clumsy
}
function winNow(G) { if (!G || G.over) return; G.lesson = null; if (G.ph !== 'cuff') startCuff(G); G.ph_t = 1; G.cuff.m = 1; cuffed(G); }
