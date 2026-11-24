// ===================== THE RULES: Hoops 3v3 (his idea 14, 20 Nov 2026) =====================
// Three-a-side on a compact court, played sideways. You attack the basket on the right. With the ball: the stick moves you,
// PASS (tap: the best teammate, highlighted; drag from it towards one: that one), SHOOT (hold: the meter fills; let go in the
// green; close to the basket it is a layup, or a dunk with space and speed), SPRINT (hold). Without it: SWITCH to the defender
// nearest the ball, STEAL (close to the ball: a swipe; under a shot: a contest or a block; tap it again too soon and you are off
// balance), SPRINT. Your teammates move into space and cut to the basket. A 12-second shot clock. Two and three pointers.
const RULES = [
  'The <b>stick</b> (left thumb) moves you: push it all the way to sprint. You attack the <b>basket on the right</b>. Your teammates move to get free.',
  '<b>PASS</b>: tap for the best teammate (highlighted), or drag from PASS towards the one you want.',
  '<b>SHOOT</b>: hold, and let go when the meter is in the <b>green</b>. Open shots go in more. Near the basket: a layup, or a dunk.',
  'Defending: <b>SWITCH</b> to the player nearest the ball; <b>STEAL</b> when you are close (tap it twice too fast and you lose your balance). Under a shot: a contest.',
  'Stay <b>between your player and the basket</b>. A 12-second shot clock. Beyond the arc: three points.',
];
const HL = 11, HW = 7, HX = 9.6, R3 = 5.8, SHOTCLOCK = 12;
const TEAMS = ['Rim Rockets', 'Alley Cats', 'Night Owls', 'Sky Hawks', 'Dock Dogs', 'Iron Bulls', 'Sun Devils', 'Street Kings', 'Fast Breakers', 'Lake Lions', 'Blue Comets', 'Desert Foxes'];
const KITS = [[0xd8302a, 0xffffff], [0x2a9a4a, 0xffffff], [0xf0b020, 0x1a1a1a], [0x7a3ad0, 0xffffff], [0x1a1a1e, 0xf0a020], [0xe86a20, 0x1a1a1a], [0x2ab0c0, 0x1a1a1a], [0xe8e8e8, 0xd8302a]];
const SKINS = [{ id: 'blue', name: 'Royal blue', col: 0x2a6ad8, stars: 0 }, { id: 'navy', name: 'Navy', col: 0x1a2a6a, stars: 6 }, { id: 'teal', name: 'Teal', col: 0x1aa8a0, stars: 14 }, { id: 'pink', name: 'Hot pink', col: 0xe8408a, stars: 24 }, { id: 'black', name: 'Blackout', col: 0x1a1a1e, stars: 36 }, { id: 'gold', name: 'Gold', col: 0xd8a820, stars: 50 }];
const UPGRADES = [{ id: 'shoes', name: 'Quick shoes', max: 2, cost: l => [60, 140][l], desc: 'A little quicker up and down.' }, { id: 'touch', name: 'Soft touch', max: 2, cost: l => [70, 160][l], desc: 'The green on the meter is wider.' }, { id: 'lungs', name: 'Big lungs', max: 1, cost: () => 110, desc: 'Sprint for longer.' }];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Playground'], [60, 'School team'], [200, 'Club'], [500, 'Pro'], [1100, 'All-star'], [2500, 'Legend of the court']];
const PLACES = [{ name: 'Park court' }, { name: 'School gym' }, { name: 'City arena' }, { name: 'Grand arena' }];
const placeOf = N => Math.min(3, Math.floor((N - 1) / 6));
const STYLES = { even: 'a steady team', lock: 'strong defence: they stay close', pass: 'quick passing', range: 'deadly from long range' };
function styleOf(N) { if (N <= 3) return 'even'; return ['lock', 'even', 'pass', 'range'][(N - 4) % 4]; }
function makeCfg(N, help, o = {}) { const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), style = o.style || styleOf(N);
  return { N, f, help: !!help, style, len: Math.round(x(140, 170, 20)), uSpd: 4.9 * (1 + 0.05 * upLv('shoes')), oSpd: x(4.3, 5.0, 25), oSkill: x(1.1, 1.45, 25) * (help ? 0.8 : 1) * (style === 'range' ? 1.05 : 1),
    oThree: style === 'range' ? 1.35 : 1, oPassy: style === 'pass' ? 1.8 : 1, oD: x(0.6, 1.15, 25) * (style === 'lock' ? 1.25 : 1) * (help ? 0.8 : 1), oSteal: x(0.05, 0.16, 25) * (style === 'lock' ? 1.4 : 1) * (help ? 0.7 : 1),
    green: 0.16 * (1 + 0.15 * upLv('touch')) * (help ? 1.3 : 1), mate: x(0.75, 0.95, 25), oHandle: x(1, 1.6, 25) * (style === 'pass' ? 1.2 : 1) }; }
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help, o), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0, R = rng(seed + 11);
  const G = { N, cfg, seed, rnd: R, t: 0, clock: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, mini: !!o.mini, foe: o.foe || TEAMS[(N - 1) % TEAMS.length], kit: KITS[(N - 1) % KITS.length], place: placeOf(N),
    P: [], ctrl: 0, stick: { x: 0, z: 0 }, ball: null, score: [0, 0], sc: SHOTCLOCK, pause: 0, golden: false, stats: { pts: 0, ast: 0, reb: 0, stl: 0, blk: 0, passes: 0, threes: 0, dunks: 0, to: 0 }, lastPass: null, aim: null, tour: o.tour || null };
  for (let t = 0; t < 2; t++) for (let i = 0; i < 3; i++) G.P.push({ t, i, id: t * 3 + i, x: 0, z: 0, vx: 0, vz: 0, face: t ? Math.PI : 0, st: 1, sprint: false, cd: 0, off: 0, lastSteal: -9, meter: 0, holding: false, think: R() * 0.5, cut: 0, spot: i });
  G.ball = { own: null, x: 0, z: 0, y: 1, kind: 'held', from: null, to: null, t: 0, T: 0, sx: 0, sz: 0, tx: 0, tz: 0, shot: null, vx: 0, vz: 0 };
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else { tipOff(G, 0); G.ev.push({ k: 'start' }); }
  return G; }
const team = (G, t) => G.P.filter(p => p.t === t), me = G => G.P[G.ctrl], hoopX = t => t === 0 ? HX : -HX, dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const dHoop = (p, t) => Math.hypot(hoopX(t) - p.x, p.z), haveBall = G => G.ball.own && G.ball.own.t === 0;
// a new possession: team t takes it from its own baseline (after a score, or at the start)
function tipOff(G, t) { const s = t ? -1 : 1, b = G.ball; G.possT = null; G.P.forEach(p => { const own = p.t === t, d = own ? [[-7.5, 0], [-4, -4.2], [-4, 4.2]][p.i] : [[-3, 0], [-6, -3.5], [-6, 3.5]][p.i]; p.x = d[0] * s; p.z = d[1]; p.vx = p.vz = 0; p.meter = 0; p.holding = false; p.off = 0; });
  const h = G.P.find(p => p.t === t && p.i === 0); give(G, h, true); G.sc = SHOTCLOCK; G.pause = 0.8; if (t === 0) G.ctrl = h.id; else G.ctrl = nearestTo(G, 0, h).id; }
function nearestTo(G, t, q) { let best = null, bd = 1e9; for (const p of team(G, t)) { const d = dist(p, q); if (d < bd) { bd = d; best = p; } } return best; }
function give(G, p, quiet, keepClock) { const b = G.ball; b.own = p; b.kind = 'held'; b.shot = null; b.x = p.x; b.z = p.z; b.y = 1; p.cd = 0.25; if (G.possT !== p.t) { G.possT = p.t; G.sc = SHOTCLOCK; if (!quiet) G.ev.push({ k: 'change', t: p.t }); } else if (!keepClock) G.sc = SHOTCLOCK; if (p.t === 0) G.ctrl = p.id; }      // a catch keeps the shot clock; a rebound or a new possession resets it
function setStick(G, x, z) { const L = Math.hypot(x, z); G.stick = L > 1 ? { x: x / L, z: z / L } : { x, z }; }
// ---------- passing ----------
function openness(G, q) { let m = 99; for (const o of team(G, 1 - q.t)) m = Math.min(m, dist(o, q)); return m; }
function laneRisk(G, a, bx, bz, t) { let r = 0; const dx = bx - a.x, dz = bz - a.z, L2 = dx * dx + dz * dz || 1; for (const o of team(G, 1 - t)) { const u = clamp(((o.x - a.x) * dx + (o.z - a.z) * dz) / L2, 0.1, 0.95), d = Math.hypot(a.x + dx * u - o.x, a.z + dz * u - o.z); if (d < 0.9) r = Math.max(r, 1 - d / 0.9); } return r; }
function bestTarget(G, p, dir) { const mates = team(G, p.t).filter(q => q !== p); let best = null, bs = -1e9; for (const q of mates) { const dx = q.x - p.x, dz = q.z - p.z, d = Math.hypot(dx, dz) || 1;
    let s = Math.min(4, openness(G, q)) - laneRisk(G, p, q.x, q.z, p.t) * 3 + (dHoop(p, p.t) - dHoop(q, q.t)) * 0.15; if (dir && (dir.x || dir.z)) s = (dx * dir.x + dz * dir.z) / d * 6 + s * 0.2; if (s > bs) { bs = s; best = q; } } return best; }
function pass(G, p, dir) { const b = G.ball; if (b.own !== p || p.cd > 0 || G.pause > 0) return false; const q = bestTarget(G, p, dir); if (!q) return false; const d = dist(p, q);
  b.own = null; b.kind = 'pass'; b.from = p; b.to = q; b.sx = p.x; b.sz = p.z; b.t = 0; b.T = Math.max(0.25, d / 11); G.lastPass = { from: p, t: G.t }; G.ev.push({ k: 'pass', t: p.t }); p.meter = 0; p.holding = false;
  // the defenders in the lane may get a hand to it
  const R = G.rnd; for (const o of team(G, 1 - p.t)) { const dx = q.x - p.x, dz = q.z - p.z, L2 = dx * dx + dz * dz || 1, u = clamp(((o.x - p.x) * dx + (o.z - p.z) * dz) / L2, 0.15, 0.9), dd = Math.hypot(p.x + dx * u - o.x, p.z + dz * u - o.z);
    if (dd < 0.75 && R() < (0.55 - dd * 0.5) * (o.t ? G.cfg.oD : 0.9) * (G.lesson ? 0 : 1)) { b.cut = { by: o, u }; break; } }
  if (p.t === 0) G.stats.passes++; lessonSee(G, 'pass'); return true; }
// ---------- shooting ----------
function contest(G, p) { const hx = hoopX(p.t); let best = 1; for (const o of team(G, 1 - p.t)) { const d = dist(o, p); if (d > 3) continue; const between = ((o.x - p.x) * (hx - p.x) + (o.z - p.z) * (0 - p.z)) > 0; let c = d > 2.4 ? 1 : d > 1.5 ? 0.78 : d > 0.95 ? 0.55 : 0.36; if (!between) c = Math.sqrt(c); if (o.t === 1) c = 1 - (1 - c) * G.cfg.oD; best = Math.min(best, c); } return best; }
function greenZone(G, p) { const d = dHoop(p, p.t), w = G.cfg.green * (d > R3 ? 0.85 : 1) * (0.7 + 0.3 * contest(G, p)); const c0 = p.gc || 0.74; return [c0 - w / 2, c0 + w / 2]; }
function shootDown(G) { if (G.over || G.pause > 0) return false; const p = me(G), b = G.ball;
  if (b.own === p) { if (p.cd > 0) return false; const d = dHoop(p, 0); if (d < 1.9) return layup(G, p); p.holding = true; p.meter = 0; p.mRate = 1 / (0.7 + G.rnd() * 0.45); p.gc = 0.6 + G.rnd() * 0.26; G.ev.push({ k: 'gather' }); return true; }      // every shot's meter runs at its own pace, its green a little higher or lower: you watch it, you don't count
  return stealPress(G, p); }
function shootUp(G) { const p = me(G); if (!p.holding) return false; p.holding = false; if (G.ball.own !== p) return false; if (p.meter < 0.3) { G.ev.push({ k: 'fake' }); return true; }      // let go at once: a pump fake, no shot
  const [g0, g1] = greenZone(G, p), m = p.meter, tm = m >= g0 && m <= g1 ? (Math.abs(m - (g0 + g1) / 2) < (g1 - g0) * 0.2 ? 1.25 : 1.05) : Math.abs(m - (m < g0 ? g0 : g1)) < 0.08 ? 0.6 : 0.1;
  G.ev.push({ k: 'release', grade: tm >= 1.2 ? 'perfect' : tm >= 1 ? 'good' : tm >= 0.6 ? 'close' : m < g0 ? 'early' : 'late' }); lessonSee(G, tm >= 1 ? 'green' : 'miss'); return shoot(G, p, tm); }
function layup(G, p) { const d = dHoop(p, p.t), sp = Math.hypot(p.vx, p.vz), o = openness(G, p), dunk = d < 2.2 && o > 1.5 && sp > 3.8, c = contest(G, p);
  const put = p.oreb != null && G.t - p.oreb < 2.5 ? 0.5 : 1;      // a putback in traffic is no gimme
  return shoot(G, p, 1, dunk ? 'dunk' : 'layup', (dunk ? 0.96 * Math.sqrt(c) : 0.9 * Math.pow(c, 0.7)) * put); }
function shoot(G, p, tm, kind, pFix) { const b = G.ball, R = G.rnd, d = dHoop(p, p.t), three = d > R3, c = contest(G, p);
  let base = d < 1.9 ? 0.9 : d < 4 ? 0.62 : d < R3 ? 0.52 : Math.max(0.1, 0.42 - (d - R3 - 0.5) * 0.07); if (three && p.t === 1) base *= G.cfg.oThree;
  const skill = p.t ? G.cfg.oSkill : 1, prob = pFix != null ? pFix : clamp(base * c * tm * skill, 0.02, 0.96);
  b.own = null; b.kind = 'shot'; b.from = p; b.sx = p.x; b.sz = p.z; b.t = 0; b.T = kind ? 0.55 : 0.8 + d * 0.05; b.shot = { pts: three ? 3 : 2, made: R() < prob, prob, kind: kind || (three ? 'three' : 'jumper'), blocked: false, t: p.t, ast: G.lastPass && G.lastPass.from.t === p.t && G.t - G.lastPass.t < 4 && G.lastPass.from !== p ? G.lastPass.from : null };
  p.cd = 0.5; G.sc = 99; G.ev.push({ k: 'shot', t: p.t, kind: b.shot.kind, prob }); lessonSee(G, 'shot'); return true; }
// ---------- defending ----------
function stealPress(G, p) { if (p.off > 0) { G.ev.push({ k: 'offbal' }); return false; } const b = G.ball, R = G.rnd;
  if (G.t - p.lastSteal < 1.0) { p.off = 0.9; p.lastSteal = G.t; G.ev.push({ k: 'offbal', t: p.t }); lessonSee(G, 'offbal'); return false; } p.lastSteal = G.t;
  // under a shot: a contest, or a block if you are right there
  if (b.kind === 'shot' && b.t < 0.3 && b.from.t !== p.t && dist(p, b.from) < 1.4) { if (R() < 0.45 * (1.4 - dist(p, b.from))) { b.shot.blocked = true; b.shot.made = false; G.ev.push({ k: 'block', t: p.t }); if (p.t === 0) G.stats.blk++; lessonSee(G, 'steal'); } else { b.shot.made = b.shot.made && R() < 0.75; G.ev.push({ k: 'contest', t: p.t }); } return true; }
  const h = b.own; if (!h || h.t === p.t) { G.ev.push({ k: 'swipe', t: p.t }); return true; } const d = dist(p, h); if (d > 1.5) { G.ev.push({ k: 'swipe', t: p.t }); return true; }
  const hx = hoopX(h.t), between = ((p.x - h.x) * (hx - h.x) + (p.z - h.z) * (0 - h.z)) > 0, ch = (between ? 0.2 : 0.08) * clamp(1.5 - d, 0, 1) * (h.sprint ? 1.3 : 1) * (G.lesson ? 3 : 1) / (h.t === 1 ? G.cfg.oHandle : 1);
  if (R() < ch) { give(G, p); G.ev.push({ k: 'steal', t: p.t }); if (p.t === 0) G.stats.stl++; else G.stats.to++; lessonSee(G, 'steal'); } else G.ev.push({ k: 'swipe', t: p.t }); return true; }
function switchNear(G) { if (haveBall(G)) return false; const b = G.ball, tgt = b.own || b; let best = null, bd = 1e9; for (const p of team(G, 0)) { const d = Math.hypot(p.x - tgt.x, p.z - tgt.z); if (d < bd) { bd = d; best = p; } } if (!best || best.id === G.ctrl) return false; G.ctrl = best.id; G.ev.push({ k: 'switch' }); return true; }
function btnPass(G, dir) { if (G.over || G.pause > 0) return false; if (haveBall(G) && G.ball.own === me(G)) return pass(G, me(G), dir); return switchNear(G); }
function sprintOn(G, on) { const p = me(G); p.sprint = !!on && p.st > 0.08; }
// ---------- movement ----------
function move(G, p, tx, tz, sp, dt) { const dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz); let vx = 0, vz = 0; if (d > 0.08) { vx = dx / d * Math.min(sp, d * 4); vz = dz / d * Math.min(sp, d * 4); } stepBody(G, p, vx, vz, dt); }
function stepBody(G, p, vx, vz, dt) { const a = 1 - Math.exp(-dt * 9); p.vx += (vx - p.vx) * a; p.vz += (vz - p.vz) * a; p.x = clamp(p.x + p.vx * dt, -HL + 0.4, HL - 0.4); p.z = clamp(p.z + p.vz * dt, -HW + 0.4, HW - 0.4);
  if (Math.hypot(p.vx, p.vz) > 0.4) p.face = Math.atan2(p.vz, p.vx);
  for (const q of G.P) if (q !== p) { const dx = p.x - q.x, dz = p.z - q.z, d = Math.hypot(dx, dz); if (d < 0.7 && d > 0.001) { p.x += dx / d * (0.7 - d) * 0.5; p.z += dz / d * (0.7 - d) * 0.5; } } }
const speedOf = (G, p) => (p.t ? G.cfg.oSpd : G.cfg.uSpd) * (G.ball.own === p ? 0.88 : 1) * (p.sprint && p.st > 0.02 ? 1.3 : 1) * (p.off > 0 ? 0.35 : 1) * (G.lesson && p.t ? 0.5 : 1);
// ---------- the clock ----------
function step(G, dt) { if (G.over || !(dt > 0)) return; G.t += dt; const c = G.cfg, b = G.ball;
  if (G.lesson) { lessonTick(G, dt); if (G.over) return; }
  if (G.pause > 0) { G.pause -= dt; return; }
  if (!G.lesson) { G.clock += dt; if (b.kind === 'held') { G.sc -= dt; if (G.sc <= 0) { const t = b.own.t; G.ev.push({ k: 'shotclock', t }); if (t === 0) G.stats.to++; return tipOff(G, 1 - t); } }
    if (G.clock >= c.len && !G.golden && b.kind !== 'shot') { if (G.score[0] !== G.score[1]) return finish(G, G.score[0] > G.score[1]); G.golden = true; G.ev.push({ k: 'overtime' }); } }
  for (const p of G.P) { p.cd = Math.max(0, p.cd - dt); p.off = Math.max(0, p.off - dt); if (p.sprint) p.st = Math.max(0, p.st - dt * 0.22 / (1 + 0.5 * upLv('lungs'))); else p.st = Math.min(1, p.st + dt * 0.12); if (p.st <= 0.02) p.sprint = false;
    if (p.holding) { p.meter += dt * (p.mRate || 1.1); if (p.meter >= 1.2) { p.holding = false; G.ev.push({ k: 'fake', late: true }); } } }      // held too long: you come down without shooting
  // you
  const y = me(G); if (!G.lesson || G.lesson.youMove) stepBody(G, y, G.stick.x * speedOf(G, y), G.stick.z * speedOf(G, y), dt);
  for (const p of G.P) if (p !== y) brain(G, p, dt);
  // the ball
  if (b.kind === 'held' && b.own) { b.x = b.own.x + Math.cos(b.own.face) * 0.35; b.z = b.own.z + Math.sin(b.own.face) * 0.35; b.y = 0.5 + Math.abs(Math.sin(G.t * 9)) * 0.5; }
  else if (b.kind === 'pass') { b.t += dt; const u = Math.min(1, b.t / b.T), q = b.to; b.x = b.sx + (q.x - b.sx) * u; b.z = b.sz + (q.z - b.sz) * u; b.y = 1.2 + Math.sin(u * Math.PI) * 0.4;
    if (b.cut && u >= b.cut.u) { const o = b.cut.by; b.cut = null; give(G, o); G.ev.push({ k: 'intercept', t: o.t }); if (o.t === 0) G.stats.stl++; else G.stats.to++; }
    else if (u >= 1) { give(G, q, true, true); G.ev.push({ k: 'catch', t: q.t }); } }
  else if (b.kind === 'shot') { b.t += dt; const u = Math.min(1, b.t / b.T), hx = hoopX(b.shot.t); b.x = b.sx + (hx - b.sx) * u; b.z = b.sz + (0 - b.sz) * u; b.y = 2 + (3.05 - 2) * u + Math.sin(u * Math.PI) * (b.shot.kind === 'dunk' ? 0.3 : 2.2);
    if (b.shot.blocked && b.t > 0.15) { b.kind = 'loose'; b.shotT = b.shot.t; b.vx = (b.sx - hx) * 0.25 + (G.rnd() - 0.5) * 2; b.vz = (G.rnd() - 0.5) * 4; b.y = 1; G.ev.push({ k: 'loose' }); }
    else if (u >= 1) scoreOrMiss(G); }
  else if (b.kind === 'loose') { b.x += b.vx * dt; b.z += b.vz * dt; b.vx *= Math.exp(-dt * 1.4); b.vz *= Math.exp(-dt * 1.4); b.y = 0.2 + Math.abs(Math.sin(G.t * 7)) * Math.min(1, Math.hypot(b.vx, b.vz) * 0.4);
    if (Math.abs(b.x) > HL - 0.3) { b.x = Math.sign(b.x) * (HL - 0.3); b.vx *= -0.5; } if (Math.abs(b.z) > HW - 0.3) { b.z = Math.sign(b.z) * (HW - 0.3); b.vz *= -0.5; }
    let best = null, bd = 9; for (const p of G.P) { const d = Math.hypot(p.x - b.x, p.z - b.z) / (p.t === b.shotT ? 0.6 : 1); if (d < bd && d < 0.8 && p.off <= 0) { bd = d; best = p; } } if (best) { give(G, best); if (best.t === b.shotT) { best.cd = 0.8; best.oreb = G.t; } G.ev.push({ k: 'rebound', t: best.t }); if (best.t === 0) G.stats.reb++; } }
  if (G.golden && (G.score[0] !== G.score[1])) finish(G, G.score[0] > G.score[1]); }
function scoreOrMiss(G) { const b = G.ball, s = b.shot, hx = hoopX(s.t);
  if (s.made) { G.score[s.t] += s.pts; G.ev.push({ k: 'score', t: s.t, pts: s.pts, kind: s.kind }); if (s.t === 0) { G.stats.pts += s.pts; if (s.pts === 3) G.stats.threes++; if (s.kind === 'dunk') G.stats.dunks++; if (s.ast) G.stats.ast++; } lessonSee(G, 'score');
    if (G.lesson) { G.pause = 0.6; lessonReset(G); return; } if (G.golden) return finish(G, s.t === 0); return tipOff(G, 1 - s.t); }
  b.kind = 'loose'; b.shotT = s.t; b.x = hx - Math.sign(hx) * 0.6; b.z = 0; const a = (G.rnd() - 0.5) * 2.6; b.vx = -Math.sign(hx) * Math.cos(a) * 3.2; b.vz = Math.sin(a) * 3.2; G.sc = SHOTCLOCK; G.ev.push({ k: 'miss', t: s.t }); lessonSee(G, 'missshot'); }
// ---------- everyone else ----------
const SPOTS = [[-4.8, -4.0], [-4.8, 4.0], [-6.6, 0], [-1.4, -5.6], [-1.4, 5.6], [-1.2, 2.2], [-1.2, -2.2], [-6.2, -3.0], [-6.2, 3.0], [-3.6, 0]];      // relative to the attacking hoop: wings, top, corners, the dunker spot
function brain(G, p, dt) { const c = G.cfg, b = G.ball, R = G.rnd, s = p.t ? -1 : 1, hx = hoopX(p.t), att = b.own ? b.own.t === p.t : (b.kind === 'shot' || b.kind === 'pass') ? b.from.t === p.t : false, sp = speedOf(G, p);
  if (G.lesson && !G.lesson.aiMove && p.t === 1) return stepBody(G, p, 0, 0, dt);
  p.think -= dt;
  if (b.kind === 'loose') { const nearest = team(G, p.t).sort((a, q) => Math.hypot(a.x - b.x, a.z - b.z) - Math.hypot(q.x - b.x, q.z - b.z))[0]; if (nearest === p) return move(G, p, b.x, b.z, sp * 1.05, dt); }
  if (b.own === p) { // the ball handler (the other team's, or a teammate of yours for a moment after a catch)
    if (p.t === 0) return stepBody(G, p, 0, 0, dt);
    if (p.think > 0 || p.cd > 0) return move(G, p, p.tx != null ? p.tx : p.x, p.tz != null ? p.tz : p.z, sp, dt); p.think = 0.35 + R() * 0.35;
    const d = dHoop(p, 1), o = openness(G, p), lane = laneRisk(G, p, hx, 0, 1), cnt = contest(G, p);
    if (d < 1.9) return layup(G, p);
    if (G.sc < 2.5 || (o > 1.4 && d < R3 + 1.2 && R() < (d > R3 ? 0.45 * c.oThree : 0.7)) || (cnt > 0.6 && d < 5 && R() < 0.5)) return shoot(G, p, (0.75 + R() * 0.5) * (0.85 + c.oSkill * 0.2));
    const q = bestTarget(G, p); if (q && openness(G, q) > o + 0.6 && laneRisk(G, p, q.x, q.z, 1) < 0.35 && R() < (openness(G, q) > 2.5 ? 0.75 : 0.35) * c.oPassy) return pass(G, p);      // a man left open gets the ball
    if (lane < 0.45 && R() < 0.7) { p.tx = hx + 1.0; p.tz = p.z * 0.6; } else { const sp2 = SPOTS[(R() * 3) | 0]; p.tx = hx + sp2[0] * s; p.tz = sp2[1] * (R() < 0.5 ? 1 : -1); }
    return move(G, p, p.tx, p.tz, sp, dt); }
  if (att) { // OFF THE BALL (22 Nov 2026, his note: "the players' positioning is horrible... they don't position themselves in a place that
    // you can give them a pass"): twice a second each team-mate picks the best place to be: free of his marker, with a clear line
    // from the man with the ball, a good pass away, out of the lane he drives down, and away from the other team-mate. A man held
    // tight for a second cuts to the basket and comes out the other side.
    const handler = b.own || b.to || b.from, mate = team(G, p.t).find(q => q !== p && q !== handler); p.tight = openness(G, p) < 1.25 ? (p.tight || 0) + dt : 0;
    if (p.cut > 0) { p.cut -= dt; return move(G, p, hx - s * 1.2, p.z * 0.35, sp, dt); }
    if (p.think <= 0 || !p.spotXY) { p.think = p.t && G.N < 8 ? 1.2 + R() * 1.4 : 0.4 + R() * 0.3; /* (the other team is this quick to find space only from level 8) */
      if (p.tight > 1.1 && dHoop(p, p.t) > 3 && R() < 0.6 * c.mate) { p.cut = 0.85; p.tight = 0; p.spot = -1; }
      let best = 0, bs = -1e9; const hd = handler ? Math.hypot(hx - handler.x, handler.z) || 1 : 1;
      for (let i = 0; i < SPOTS.length; i++) { const x = hx + SPOTS[i][0] * s, z = SPOTS[i][1]; let o = 99; for (const q of team(G, 1 - p.t)) o = Math.min(o, Math.hypot(q.x - x, q.z - z));
        let sc = Math.min(3.5, o) + R() * 0.3;
        if (handler && handler !== p) { const dh = Math.hypot(handler.x - x, handler.z - z); sc -= Math.abs(dh - 5) * 0.25; if (dh < 3) sc -= 3; sc -= laneRisk(G, handler, x, z, p.t) * 2.5;
          const ux = (hx - handler.x) / hd, uz = -handler.z / hd, px = x - handler.x, pz = z - handler.z, along = px * ux + pz * uz, off = Math.abs(px * uz - pz * ux); if (along > 0 && along < hd && off < 1.7) sc -= 2.5; }
        if (mate && mate.spotXY) { const dm = Math.hypot(mate.spotXY[0] - x, mate.spotXY[1] - z); if (dm < 4) sc -= (4 - dm) * 1.2; }
        sc -= Math.hypot(p.x - x, p.z - z) * 0.12; if (p.spot === i) sc += 0.5;
        if (sc > bs) { bs = sc; best = i; } }
      p.spot = best; p.spotXY = [hx + SPOTS[best][0] * s, SPOTS[best][1]]; }
    return move(G, p, p.spotXY[0], p.spotXY[1], Math.hypot(p.spotXY[0] - p.x, p.spotXY[1] - p.z) > 1.5 ? sp : sp * 0.8, dt); }
  // defending: between my player and the basket; help on a drive; a reach now and then
  const myHoop = hoopX(1 - p.t), mark = team(G, 1 - p.t)[p.i], h = b.own, tgt = mark, gap = p.t ? 1.15 / c.oD : 1.25, dx = myHoop - tgt.x, dz = -tgt.z, dd = Math.hypot(dx, dz) || 1;
  let gx = tgt.x + dx / dd * Math.min(gap, dd * 0.5), gz = tgt.z + dz / dd * Math.min(gap, dd * 0.5);
  if (h && h.t !== p.t && h !== tgt && Math.hypot(h.x - myHoop, h.z) < 3.2 && Math.hypot(p.x - h.x, p.z - h.z) < 4) { gx = (gx + h.x + (myHoop - h.x) * 0.3) / 2; gz = (gz + h.z) / 2; }
  move(G, p, gx, gz, sp * (p.t ? 1 : c.mate), dt);
  if (p.t === 1 && h && h.t === 0 && dist(p, h) < 1.3 && p.off <= 0 && R() < c.oSteal * dt * 2) stealPress(G, p);
  if (b.kind === 'shot' && b.t < 0.25 && b.from.t !== p.t && dist(p, b.from) < 1.3 && !b.contested) { b.contested = true; if (R() < (p.t ? 0.5 * c.oD : 0.3)) stealPress(G, p); } }
function finish(G, win) { if (G.over) return; G.over = win ? 'won' : 'lost'; const gd = G.score[0] - G.score[1], stars = win ? (gd >= 8 ? 3 : gd >= 4 ? 2 : 1) : 0;
  G.res = { win, stars, score: G.score.slice(), foe: G.foe, stats: Object.assign({}, G.stats), coins: Math.round(G.stats.pts / 2) + G.stats.ast * 2 + G.stats.stl * 2 + G.stats.blk * 2 + (win ? 8 + Math.ceil(G.N / 2) + stars * 3 : 0), tour: G.tour };
  G.ev.push({ k: win ? 'won' : 'lost' }); }
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'shoot', title: 'SHOOT IN THE GREEN', say: 'HOLD, LET GO IN GREEN', do: 'hold', how: 'HOLD SHOOT. The meter fills: let go when it is in the GREEN. Three good releases.', need: 3 }],
  2: [{ id: 'pass', title: 'GIVE AND GO', say: 'PASS, RUN, SHOOT', do: 'tap', how: 'Tap PASS (or drag from it towards a teammate), then RUN TO THE BASKET with the stick. The ball comes back to you: tap SHOOT for the layup.', need: 2 }],
  3: [{ id: 'steal', title: 'TAKE IT OFF THEM', say: 'GET CLOSE, TAP STEAL', do: 'tap', how: 'Move close to the player with the ball and tap STEAL. Stay between them and the basket. Tap it twice too fast and you lose your balance.', need: 2 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0, wait: 0, youMove: true, aiMove: false }; G.ev.push({ k: 'lessonnext', first: true }); lessonReset(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonReset(G) { const st0 = lessonNow(G), D = G.lesson; if (!st0) return; const y = G.P[0];
  G.P.forEach(p => { p.vx = p.vz = 0; p.off = 0; p.holding = false; });
  if (st0.id === 'shoot') { y.x = HX - 4.5; y.z = 0.5; G.P[1].x = HX - 3; G.P[1].z = -4; G.P[2].x = HX - 3; G.P[2].z = 4; G.P.slice(3).forEach((p, i) => { p.x = HX - 8 - i; p.z = -3 + i * 3; }); give(G, y, true); D.aiMove = false; }
  else if (st0.id === 'pass') { y.x = HX - 6; y.z = 0; G.P[1].x = HX - 4; G.P[1].z = -4; G.P[2].x = HX - 4; G.P[2].z = 4; G.P.slice(3).forEach((p, i) => { p.x = HX - 1.5; p.z = -3 + i * 3; }); give(G, y, true); D.aiMove = false; }
  else { const h = G.P[3]; h.x = -HX + 6; h.z = 0; y.x = -HX + 4.2; y.z = 0.3; G.P[4].x = -HX + 7; G.P[4].z = -4; G.P[5].x = -HX + 7; G.P[5].z = 4; G.P[1].x = -HX + 3; G.P[1].z = -4; G.P[2].x = -HX + 3; G.P[2].z = 4; give(G, h, true); G.ctrl = 0; D.aiMove = true; } }
function lessonTick(G, dt) { const D = G.lesson, st0 = lessonNow(G), b = G.ball; if (D.wait > 0) { D.wait -= dt; if (D.wait <= 0 && D.done) { G.lesson = null; tipOff(G, 0); G.clock = 0; G.score = [0, 0]; G.stats = { pts: 0, ast: 0, reb: 0, stl: 0, blk: 0, passes: 0, threes: 0, dunks: 0, to: 0 }; G.ev.push({ k: 'start' }); } return; }
  G.sc = SHOTCLOCK;
  if (st0.id === 'pass' && b.kind === 'held' && b.own && b.own.t === 0 && b.own !== G.P[0] && !D.back) { D.back = 1.3; }      // your teammate gives it back once you have had a moment to run
  if (D.back > 0) { D.back -= dt; if (D.back <= 0) { D.back = 0; const h = b.own; if (h && h !== G.P[0] && h.t === 0) { h.cd = 0; pass(G, h, { x: G.P[0].x - h.x, z: G.P[0].z - h.z }); G.lesson.n = G.lesson.n; } } }
  if (st0.id === 'steal' && b.own && b.own.t === 1) { const h = b.own; h.think = 1; move(G, h, -HX + 6 + Math.sin(G.t * 0.8) * 1.6, Math.sin(G.t * 0.55) * 2.5, 1.6, dt); }
  if (st0.id === 'steal' && b.own && b.own.t === 0) { G.pause = 0.6; lessonReset(G); }
  if (b.kind === 'loose' && st0.id !== 'steal') { G.pause = 0.4; lessonReset(G); } }
function lessonSee(G, what) { const st0 = lessonNow(G); if (!st0 || G.lesson.done) return; const D = G.lesson;
  if (what === 'offbal' && st0.id === 'steal') { G.ev.push({ k: 'lessonmiss', how: 'Too fast! Wait a moment between steals.' }); return; }
  if (what === 'miss' && st0.id === 'shoot') { G.ev.push({ k: 'lessonmiss', how: 'Let go when the meter is in the green.' }); D.n = 0; return; }
  if (st0.id === 'pass' && what === 'pass' && G.ball.from === G.P[0]) { D.passed = true; return; }
  const ok = (st0.id === 'shoot' && what === 'green') || (st0.id === 'pass' && what === 'score' && D.passed && G.ball.shot && G.ball.shot.from !== null && ['layup', 'dunk'].includes(G.ball.shot.kind)) || (st0.id === 'steal' && what === 'steal'); if (st0.id === 'pass' && what === 'score') D.passed = false; if (!ok) return;
  D.n++; G.ev.push({ k: 'lessonok', n: D.n, need: st0.need }); if (D.n >= st0.need) { D.done = true; D.wait = 1.6; G.ev.push({ k: 'lessondone', N: G.N }); } }
// ---------- for the robots ----------
// BLIND: a thumb that does not look: pushes the stick somewhere (or lets go), taps PASS, presses or lets go of SHOOT, sprints
const BLIND = { m: G => { const R = Math.random; if (R() < 0.2) setStick(G, 0, 0); else { const a = R() * TAU; setStick(G, Math.cos(a), Math.sin(a)); } }, p: G => btnPass(G), s: G => shootDown(G), u: G => shootUp(G), b: G => sprintOn(G, !me(G).sprint) };
// HONEST: a player who looks. react: seconds to act; acc: timing and choices
function honest(G, o, mem) { if (G.over) return; const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random, b = G.ball, p = me(G), hx = HX;
  if (p.holding) { if (mem.let == null) { const [g0, g1] = greenZone(G, p); mem.let = (g0 + g1) / 2 + (R() - 0.5) * (g1 - g0) * 2.4 * (1.12 - acc); } if (p.meter >= mem.let) { shootUp(G); mem.let = null; } return; }
  mem.cd = (mem.cd || 0) - 1 / 60; const go = (x, z) => { const dx = x - p.x, dz = z - p.z, d = Math.hypot(dx, dz); setStick(G, d > 0.3 ? dx / d : 0, d > 0.3 ? dz / d : 0); };
  const L = lessonNow(G);
  if (b.own === p) { const d = dHoop(p, 0), o = openness(G, p), lane = laneRisk(G, p, hx, 0, 0);
    if (mem.cd > 0) return; mem.cd = react * (0.7 + R() * 0.6);
    if (L && L.id === 'pass') { if (!G.lesson.passed) btnPass(G); else if (d < 1.8) shootDown(G); else go(hx - 0.9, 0); return; }
    if (L && L.id === 'shoot') { setStick(G, 0, 0); shootDown(G); mem.let = null; return; }
    if (d < 1.9) { shootDown(G); return; }
    if ((o > 2.2 && d < R3 - 0.3) || (o > 2.8 && d < R3 + 0.6) || G.sc < 2.5 + react * 3 || (contest(G, p) > 0.85 && d < 4.2)) { setStick(G, 0, 0); shootDown(G); mem.let = null; return; }
    const q = bestTarget(G, p); if (q && openness(G, q) > o + 0.8 && laneRisk(G, p, q.x, q.z, 0) < 0.3 && R() < 0.5 * acc) { btnPass(G); return; }
    if (lane < 0.35) go(hx - 0.8, p.z * 0.5); else go(hx - 4.8, p.z > 0 ? -3.5 : 3.5); return; }
  if (L && L.id === 'pass' && b.kind !== 'loose') { go(hx - 0.9, 0); return; }
  if (b.own && b.own.t === 0) { setStick(G, 0, 0); return; }
  if (b.kind === 'loose') { go(b.x, b.z); return; }
  if (b.kind === 'pass' || (b.kind === 'shot' && b.shot.t === 0)) { setStick(G, 0, 0); return; }
  // defending
  if (mem.cd > 0) return; mem.cd = react * 0.4; const h = b.own || (b.kind === 'shot' ? b.from : b.to);
  if (h && h.t === 1 && dist(p, h) > 2.8 && R() < acc) { const nb = team(G, 0).sort((a, q) => dist(a, h) - dist(q, h))[0]; if (nb !== p) { btnPass(G); return; } }
  if (!h) return; const myHoop = -HX, dx = myHoop - h.x, dz = -h.z, dd = Math.hypot(dx, dz) || 1; go(h.x + dx / dd * 1.0, h.z + dz / dd * 1.0);
  if (b.kind === 'shot' && b.t < 0.2 && dist(p, b.from) < 1.3 && R() < acc) { shootDown(G); return; }
  if (b.own === h && dist(p, h) < 1.25 && G.t - p.lastSteal > 1.1 + (1 - acc) && R() < 0.25 * acc) shootDown(G); }
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.score[0] = G.score[1] + 2; finish(G, true); }
