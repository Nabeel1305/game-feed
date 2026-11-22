// ===================== THE RULES: Tennis (his idea 17, 20 Nov 2026) =====================
// Singles, seen from behind your baseline. Left thumb: the stick moves you. Right thumb: SWIPE to swing as the ball comes:
// the direction aims it; the touch layer turns the swipe's LENGTH into the shot (a drop, a drive, a lob) and passes it here as len and speed (fast = a drive; slow and long = a lob; slow and
// short = a drop shot; a swipe DOWN = a slice). Timing matters: hit it level with you, a little in front. At the net you
// volley it before it bounces. Serve: the stick picks your spot on the baseline, a tap tosses, a swipe at the top serves.
// Points are tennis points: in, out, net, two bounces. Short matches are first to seven points (win by two); the long format
// is games (15, 30, 40) to three. Move them around: a shot into the open court is hard to reach; one at them comes back.
// World: metres. x across (left -, right +), z along the court (you +, them -), y up. The net at z = 0.
const RULES = [
  '<b>Left thumb</b>: move. <b>Right thumb: SWIPE</b> to swing as the ball reaches you.',
  'Swipe <b>direction</b> aims. <b>Length</b> picks the shot, and its name shows as you swipe: short = <b>drop</b>, longer = <b>drive</b> (deeper the longer), longest = <b>lob</b>. Swipe <b>down</b>: a <b>slice</b>.',
  '<b>Timing</b>: swing when the ball is level with you. Early pulls it, late pushes it.',
  '<b>Serve</b>: tap to toss, swipe at the top (the ring turns green).',
  'Move them: a shot into the <b>open court</b> wins points; one straight at them comes back.',
  'First to <b>7 points</b> (win by two). Or the long match: games to three.',
];
const HZ = 11.885, HX = 4.115, SZ = 6.4, NETH = 0.914, BR = 0.035, GRAV = 9.8;
const STYLES = { base: { name: 'Baseliner', how: 'stays back and rallies' }, net: { name: 'Net rusher', how: 'comes to the net' }, push: { name: 'Pusher', how: 'lobs and slices, never misses' }, big: { name: 'Big hitter', how: 'hits hard, misses more' } };
const NAMES = ['Ada', 'Bruno', 'Chika', 'Dmitri', 'Elena', 'Femi', 'Greta', 'Hiro', 'Ines', 'Jonas', 'Kofi', 'Lena', 'Mateo', 'Nadia', 'Omar', 'Priya', 'Quinn', 'Rosa', 'Sven', 'Tariq'];
const COURTS = [{ name: 'Practice court', col: 0x3a8a4a, line: 0xffffff, sky: 'morning' }, { name: 'Club clay', col: 0xc86a3a, line: 0xf4f0e8, sky: 'golden' }, { name: 'Grass lawn', col: 0x5aa040, line: 0xffffff, sky: 'noon' }, { name: 'City hard court', col: 0x2a5aa8, line: 0xffffff, sky: 'sunset' }, { name: 'Night stadium', col: 0x2a6aa0, line: 0xffffff, sky: 'night' }];
const courtOf = N => COURTS[Math.min(COURTS.length - 1, Math.floor((N - 1) / 4))];
const SKINS = [{ id: 'classic', name: 'Classic', col: 0xd83a3a, stars: 0 }, { id: 'lime', name: 'Lime', col: 0x9ad040, stars: 6 }, { id: 'blue', name: 'Ocean', col: 0x2a7ad8, stars: 14 }, { id: 'black', name: 'Carbon', col: 0x2a2a30, stars: 24 }, { id: 'pink', name: 'Flamingo', col: 0xf07ab0, stars: 36 }, { id: 'gold', name: 'Gold', col: 0xd6a630, stars: 50 }];
const UPGRADES = [{ id: 'shoes', name: 'Court shoes', max: 2, cost: l => [60, 140][l], desc: 'A little quicker to the ball.' }, { id: 'strings', name: 'Fresh strings', max: 2, cost: l => [70, 160][l], desc: 'More control on every shot.' }, { id: 'grip', name: 'Tacky grip', max: 1, cost: () => 90, desc: 'A wider timing window.' }];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Ball kid'], [60, 'Club player'], [200, 'County champ'], [500, 'Tour player'], [1100, 'Seeded'], [2500, 'Legend of the court']];
function styleOf(N) { if (N <= 4) return 'base'; return ['base', 'net', 'push', 'big'][(N - 1) % 4]; }
function makeCfg(N, help, o = {}) { const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), st = styleOf(N), e = Math.max(0, 1 - (N - 1) / 10);
  return { N, f, help: !!help, style: st, long: !!o.long, practice: !!o.practice, assist: e * 0.7 * (help ? 1.3 : 1), window: 1 + e * 0.5 + 0.15 * upLv('grip') + (help ? 0.2 : 0),
    oSpd: x(3.0, 5.3, 30) * (help ? 0.93 : 1), oReact: x(0.45, 0.22, 30), oAcc: x(0.45, 0.86, 30), oPace: x(0.85, 1.0, 30) * (st === 'big' ? 1.12 : st === 'push' ? 0.85 : 1), oErr: (st === 'big' ? 0.06 : st === 'push' ? 0.015 : 0.03) * (1 - Math.min(0.5, f / 80)),
    oServe: x(0.55, 0.85, 30), uSpd: 6.0 + 0.3 * upLv('shoes') + (help ? 0.3 : 0), uCtl: 0.8 + 0.06 * upLv('strings'), slow: 1 - e * 0.25 }; }
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help, o), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0, R = rng(seed + 7);
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, mini: !!o.mini,
    foe: NAMES[(N * 7 + 3) % NAMES.length], pts: [0, 0], games: [0, 0], gp: [0, 0], served: 0, server: 0, phase: 'serve', wait: 0, next: null, stick: { x: 0, z: 0 },
    me: { x: 0, z: HZ + 0.5, vx: 0, vz: 0, swing: 0, face: 0 }, op: { x: 0, z: -HZ - 0.5, vx: 0, vz: 0, swing: 0, plan: null, think: 0, mode: 'base' },
    ball: { x: 0, y: 1, z: 0, vx: 0, vy: 0, vz: 0, live: false, by: -1, bounces: 0, spin: 0, serve: false, fault: 0, kind: '' }, toss: null, rally: 0, stats: { rally: 0, best: 0, winners: 0, errors: 0, aces: 0, volleys: 0, lobs: 0, slices: 0, oppErr: 0 } };
  if (G.teach && LESSONS[N] && G.taught < N && !cfg.practice) lessonStart(G); else { if (cfg.practice) practiceSetup(G); else startPoint(G); G.ev.push({ k: 'start' }); }
  return G; }
// ---------- the ball ----------
const gravOf = b => GRAV * (b.spin > 0 ? 1 + 0.5 * b.spin : 1 - 0.3 * Math.min(1, -b.spin));
// where a ball from p with velocity v lands, simulated (the same steps as the real ball)
function simBall(b0, untilBounce = 1, maxT = 4) { const b = Object.assign({}, b0), out = []; let t = 0, n = 0; const dt = 1 / 120;
  while (t < maxT) { b.vy -= gravOf(b) * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt; t += dt;
    if (b.y < BR) { b.y = BR; n++; out.push({ x: b.x, z: b.z, t }); if (n >= untilBounce) return { bounces: out, b, t }; bounceV(b); } }
  return { bounces: out, b, t }; }
function bounceV(b) { b.vy = -b.vy * (b.spin > 0 ? 0.72 : b.spin < 0 ? 0.55 : 0.68); const h = b.spin > 0 ? 0.88 : b.spin < 0 ? 0.68 : 0.8; b.vx *= h; b.vz *= h; }
// launch a ball from (x, y, z) to land at (tx, tz) with flight time T (it clears the net if the arc is high enough)
function launch(b, x, y, z, tx, tz, T, spin) { b.id = (b.id || 0) + 1; b.x = x; b.y = y; b.z = z; b.spin = spin; const g = gravOf(b); b.vx = (tx - x) / T; b.vz = (tz - z) / T; b.vy = (BR - y + 0.5 * g * T * T) / T; b.live = true; b.bounces = 0; }
// where along its flight the ball crosses a z plane, and how high
function heightAtNet(b) { if (Math.sign(b.z) === Math.sign(b.vz) || !b.vz) return 9; const t = -b.z / b.vz; return b.y + b.vy * t - 0.5 * gravOf(b) * t * t; }
// ---------- a point ----------
function startPoint(G) { const total = G.pts[0] + G.pts[1] + (G.cfg.long ? G.games[0] + G.games[1] : 0), b = G.ball;
  if (G.cfg.long) G.server = (G.games[0] + G.games[1]) % 2; else G.server = Math.floor((total + 1) / 2) % 2;      // first-to-seven: like a tiebreak (one, then two each)
  const side = ((G.cfg.long ? G.gp[0] + G.gp[1] : total) % 2) ? -1 : 1;      // deuce side, then the ad side
  G.side = side; G.rally = 0; b.live = false; b.by = -1; b.fault = 0; b.serve = false; G.toss = null; G.phase = 'serve';
  G.me.x = G.server === 0 ? side * 0.8 : side * 2.2; G.me.z = HZ + (G.server === 0 ? 0.3 : 0.8); G.me.vx = G.me.vz = 0;
  G.op.x = G.server === 1 ? -side * 0.8 : -side * 2.2; G.op.z = -HZ - (G.server === 1 ? 0.3 : 0.8); G.op.vx = G.op.vz = 0; G.op.plan = null; G.op.mode = G.cfg.style === 'net' ? 'base' : 'base';
  G.serveT = G.server === 1 ? 1.1 + G.rnd() * 0.5 : 0; G.ev.push({ k: 'point', server: G.server }); }
function pointTo(G, w, why) { if (G.phase === 'dead') return; G.phase = 'dead'; G.ball.live = false; const S = G.stats; S.best = Math.max(S.best, G.rally); S.rally += G.rally;
  if (why === 'winner' && w === 0) S.winners++; if (why === 'error' && w === 1) S.errors++; if (why === 'error' && w === 0) S.oppErr++; if (why === 'ace' && w === 0) S.aces++;
  G.ev.push({ k: 'pointover', w, why, rally: G.rally }); if (G.lesson) { lessonPoint(G, w, why); return; } if (G.cfg.practice) { G.wait = 1.0; G.next = () => practiceFeed(G); return; }
  G.wait = 1.6; G.next = () => { if (G.cfg.long) { G.gp[w]++; const a = G.gp[w], o = G.gp[1 - w]; if (a >= 4 && a - o >= 2) { G.games[w]++; G.gp = [0, 0]; G.ev.push({ k: 'game', w }); if (G.games[w] >= 3) return finish(G, w === 0); } }
    else { G.pts[w]++; const a = G.pts[w], o = G.pts[1 - w]; if ((a >= 7 && a - o >= 2) || a >= 10) return finish(G, w === 0); }
    startPoint(G); }; }
// ---------- the controls ----------
function setStick(G, x, z) { const L = Math.hypot(x, z); G.stick = L > 1 ? { x: x / L, z: z / L } : { x, z }; }
function toss(G) { if (G.over || G.phase !== 'serve' || G.server !== 0 || G.toss || G.wait > 0) return false; G.toss = { t: 0 }; const b = G.ball; b.x = G.me.x + 0.3; b.z = G.me.z - 0.2; b.y = 1.2; b.vx = b.vz = 0; b.vy = 4.7 + G.rnd() * 1.0; b.spin = 0; b.live = false; G.ev.push({ k: 'toss' }); return true; }      // no two tosses quite the same: watch the ring
// a swing: sw = { ax, ay } the swipe (screen units, up = -y), len 0..1.4 of a full swipe, speed (full swipes a second)
function swing(G, sw) { if (G.over || G.wait > 0) return false; const m = G.me; if (m.swing > 0 || m.cool > 0) return false;
  if (G.phase === 'serve' && G.server === 0) { if (!G.toss) return toss(G); return serveHit(G, sw); }
  m.swing = 0.22; m.sw = sw; G.ev.push({ k: 'swing', who: 0 }); if (tryHit(G, m, 0)) { m.sw = null; return true; } return true; }
// reach: can this player hit the ball now? (and how well timed)
function reachOf(G, p, who) { const b = G.ball; if (!b.live || b.by === who) return null; const sgn = who === 0 ? 1 : -1, dz = (b.z - p.z) * sgn, dx = b.x - p.x, w = who === 0 ? G.cfg.window : 1;
  if (b.z * sgn < 0) return null; if (b.y < 0.12 || b.y > 2.7) return null; if (Math.abs(dx) > 1.45 * Math.min(1.25, w) || dz < -1.5 * w || dz > 0.9 * w) return null;
  const volley = b.bounces === 0; if (volley && Math.abs(p.z) > 9) return null;      // a volley is from the front of the court, not the baseline
  return { dx, dz, volley, q: clamp(1 - Math.abs(dz + 0.35) / (1.1 * w), 0, 1) }; }
function tryHit(G, p, who) { const r = reachOf(G, p, who); if (!r) return false; return strike(G, p, who, r, who === 0 ? p.sw : p.plan.sw); }
// the shot itself: where it is meant to go, and how much it wanders
function strike(G, p, who, r, sw) { const b = G.ball, c = G.cfg, sgn = who === 0 ? -1 : 1;      // sgn: the side it goes to (-z for you)
  let up = -sw.ay, side = sw.ax; const L = Math.hypot(up, side) || 1, slice = up < -0.2, ang = Math.atan2(side, Math.abs(up)), len = clamp(sw.len, 0.05, 1.4), spd = sw.speed;
  let kind = slice ? 'slice' : spd < 2.2 && len > 0.45 ? 'lob' : spd < 2.2 ? 'drop' : 'drive'; if (r.volley) kind = kind === 'lob' ? 'lob' : 'volley';
  const depth = kind === 'drop' ? 1.5 + len * 3 : kind === 'volley' ? 3 + len * 6 : 3.5 + len * 8.2, tx0 = clamp(Math.tan(ang) * 7.5, -6.5, 6.5), tz0 = sgn * depth;
  const ctl = who === 0 ? c.uCtl : c.oAcc, timing = r.q, stretch = Math.min(1, Math.abs(r.dx) / 1.45), pace = kind === 'drive' ? clamp(spd / 4, 0.5, 1.4) : 0.6;
  const err = who === 0 ? 0.25 + (1 - ctl) * 1.6 + (1 - timing) * 1.6 + stretch * 0.6 + (pace > 1.1 ? (pace - 1.1) * 2.5 : 0) : 0.15 + (1 - ctl) * 0.5 + (1 - timing) * 0.4 + stretch * 0.4;      // theirs: steady early, wild only by style
  const late = r.dz + 0.35, pull = clamp(late, -1.2, 1.2) * (1 - timing) * 2.2 * (p.x > b.x ? 1 : -1);      // early or late sends it across or wide
  const tx = tx0 + gauss(G.rnd) * err * 0.55 + pull, tz = tz0 + sgn * gauss(G.rnd) * err * 0.7, dist = Math.hypot(tx - b.x, tz - b.z);
  let T = kind === 'lob' ? 1.6 + len * 0.4 : kind === 'drop' ? 1.0 : kind === 'slice' ? dist / (11 + 5 * pace) : kind === 'volley' ? dist / (11 + 5 * pace) : dist / (12.5 + 10 * pace);
  if (who === 1) T /= c.oPace; if (who === 1 && G.lesson) T *= 1.25; T /= c.slow;
  const spin = kind === 'drive' ? 0.6 * pace : kind === 'slice' ? -0.8 : kind === 'lob' ? 0.3 : 0;
  const y0 = clamp(b.y, 0.4, 2.4); launch(b, b.x, y0, b.z, tx, tz, T, spin);
  // a mishit (timing poor, ball at the edge of reach) can find the net: aim the arc lower
  const clear = heightAtNet(b); if (clear < NETH + 0.15 && kind !== 'lob') { const lift = (NETH + 0.25 - clear) * (timing > 0.35 ? 1 : 0.2); b.vy += lift / Math.max(0.3, Math.abs(b.z / (b.vz || 1))); }
  b.by = who; b.kind = kind; b.serve = false; b.bounces = 0; G.rally++; p.swing = Math.max(p.swing, 0.2);
  if (who === 0) { if (kind === 'lob') G.stats.lobs++; if (kind === 'slice') G.stats.slices++; if (r.volley) G.stats.volleys++; lessonSee(G, 'hit', { kind, tx, tz, q: timing }); }
  G.ev.push({ k: 'hit', who, kind, q: timing, pace }); return true; }
function gauss(R) { return Math.sqrt(-2 * Math.log(1 - R() * 0.9999)) * Math.cos(TAU * R()); }
// the serve: from behind the baseline into the diagonal box
function serveHit(G, sw) { const t = G.toss, b = G.ball, q = clamp(1 - Math.abs(b.vy) / 3.2, 0, 1), m = G.me; if (b.y < 1.6) { return false; }
  const side = G.side, up = -sw.ay, ang = Math.atan2(sw.ax, Math.max(0.2, up)), flat = sw.speed > 3, len = clamp(sw.len, 0.2, 1.3);
  const v0 = -side * 2 + Math.tan(ang) * 4, tx0 = side > 0 ? clamp(v0, -4.4, 0.3) : clamp(v0, -0.3, 4.4), tz0 = -(SZ - 1.2 + (len - 0.7) * 2.2), err = 0.3 + (1 - q) * 2.0 + (flat ? 0.4 : 0) + (1 - G.cfg.uCtl) * 1.2;
  const tx = clamp(tx0, -4.6, 4.6) + gauss(G.rnd) * err * 0.45, tz = tz0 + gauss(G.rnd) * err * 0.5;
  launch(b, b.x, b.y, b.z, tx, tz, (flat ? 0.75 : 1.0) / G.cfg.slow, flat ? 0.2 : 0.5); b.by = 0; b.serve = true; b.kind = 'serve'; G.toss = null; G.phase = 'rally'; m.swing = 0.22; G.ev.push({ k: 'serve', who: 0, q, flat }); lessonSee(G, 'serve', { q }); return true; }
function oppServe(G) { const b = G.ball, c = G.cfg, op = G.op, side = G.side, R = G.rnd, flat = R() < 0.25 + c.oServe * 0.4;
  const tx = side * (R() < 0.5 ? 0.7 : 1.2 + 2.2 * c.oServe) + gauss(R) * 0.3, tz = SZ - 0.8 - R() * 1.2 + gauss(R) * 0.35 * (1.2 - c.oServe);
  b.x = op.x + 0.3; b.z = op.z + 0.2; b.y = 2.6; launch(b, b.x, b.y, b.z, tx, tz, (flat ? 0.75 : 1.0) / (0.8 + 0.25 * c.oServe) / c.slow * (G.lesson ? 1.3 : 1), 0.4); b.by = 1; b.serve = true; b.kind = 'serve'; G.phase = 'rally'; op.swing = 0.22; G.ev.push({ k: 'serve', who: 1 }); }
// ---------- the clock ----------
function step(G, dt) { if (G.over || !(dt > 0)) return; if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0) { G.wait = 0; if (G.next) { const f = G.next; G.next = null; f(); } } return; }
  G.t += dt; const b = G.ball, c = G.cfg, m = G.me, op = G.op;
  if (m.cool > 0) m.cool -= dt; if (m.swing > 0) { m.swing -= dt; if (G.phase === 'rally' && m.sw && m.swing > 0.05 && b.by !== 0) { if (tryHit(G, m, 0)) m.sw = null; } if (m.swing <= 0 && m.sw) { m.sw = null; m.cool = 0.5; G.ev.push({ k: 'whiff' }); } }      // a swing at nothing: a moment to recover      // a swing a moment early still meets a ball that arrives
  if (op.swing > 0) op.swing -= dt;
  // you: the stick, plus a small helping step toward the ball early on
  let tx = m.x + G.stick.x * 3, tz = m.z + G.stick.z * 3, sp = c.uSpd * Math.min(1, Math.hypot(G.stick.x, G.stick.z) * 1.2);
  if (c.assist > 0 && G.phase === 'rally' && b.live && b.by === 1) { const pc = contactFor(G, 0); if (pc) { const ax = pc.x - (m.x + 0.5), az = pc.z - m.z, k2 = c.assist * (Math.hypot(G.stick.x, G.stick.z) < 0.15 ? 1 : 0.4); tx += ax * k2; tz += az * k2 * 0.6; sp = Math.max(sp, c.uSpd * k2 * Math.min(1, Math.hypot(ax, az))); } }
  if (G.phase === 'serve' && G.server === 0) { tz = m.z; tx = clamp(tx, G.side > 0 ? 0.2 : -HX, G.side > 0 ? HX : -0.2); if (G.toss) sp = 0; }
  moveP(m, tx, tz, sp, dt, 0);
  // them
  if (G.phase === 'serve' && G.server === 0 && !G.lesson && !c.practice) { G.clockS = (G.clockS || 0) + dt; if (G.clockS > 10) { G.clockS = 0; G.toss = null; G.ball.by = 0; G.ball.serve = true; G.ev.push({ k: 'serveclock' }); return fault(G); } } else G.clockS = 0;      // the serve clock: ten seconds, or it is a fault
  if (G.phase === 'serve' && G.server === 1) { G.serveT -= dt; if (G.serveT <= 0) oppServe(G); }
  else if (G.phase === 'rally') oppBrain(G, dt); else moveP(op, op.x, op.z, 0, dt, 1);
  // the toss
  if (G.toss) { G.toss.t += dt; b.vy -= GRAV * dt; b.y += b.vy * dt; if (b.y < 0.9 && b.vy < 0) { G.toss = null; b.y = 1; G.ev.push({ k: 'droptoss' }); } }
  // the ball in play
  if (b.live) { const n = 3, h = dt / n; for (let i = 0; i < n && b.live; i++) ballStep(G, h); }
  if (G.lesson) lessonTick(G, dt); }
function moveP(p, tx, tz, sp, dt, who) { const dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz), want = d > 0.08 ? Math.min(sp, d * 4) : 0, wx = d > 0.001 ? dx / d * want : 0, wz = d > 0.001 ? dz / d * want : 0, k2 = 1 - Math.exp(-dt * 10);
  p.vx += (wx - p.vx) * k2; p.vz += (wz - p.vz) * k2; p.x = clamp(p.x + p.vx * dt, -HX - 3, HX + 3); p.z += p.vz * dt; if (who === 0) p.z = clamp(p.z, 1.2, HZ + 4); else p.z = clamp(p.z, -HZ - 4, -1.2); }
function ballStep(G, dt) { const b = G.ball, pz = b.z; b.vy -= gravOf(b) * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
  if (Math.sign(pz) !== Math.sign(b.z) && pz !== 0 && Math.abs(b.x) < HX + 0.9) { if (b.y < NETH + BR) { b.vz *= -0.15; b.vx *= 0.3; b.z = Math.sign(pz) * 0.1; G.ev.push({ k: 'net' }); return b.serve ? fault(G) : pointTo(G, 1 - b.by, 'error'); } }
  if (b.y < BR) { b.y = BR; b.bounces++; const side = b.z > 0 ? 0 : 1; G.ev.push({ k: 'bounce', x: b.x, z: b.z, side });
    if (b.bounces === 1) { if (side === b.by) { return pointTo(G, 1 - b.by, 'error'); }
      const inX = Math.abs(b.x) <= HX + BR, inZ = Math.abs(b.z) <= HZ + BR, inBox = b.serve ? (Math.abs(b.z) <= SZ + BR && (b.by === 0 ? G.side * b.x <= 0.05 + BR && Math.abs(b.x) <= HX : -G.side * b.x <= 0.05 + BR && Math.abs(b.x) <= HX)) : true;
      if (!inX || !inZ || !inBox) { G.ev.push({ k: 'out', x: b.x, z: b.z }); if (b.serve) return fault(G); return pointTo(G, 1 - b.by, 'error'); } }
    if (b.bounces === 2) return pointTo(G, b.by, b.serve ? 'ace' : 'winner');
    bounceV(b); } }
// a fault: serve again; two in a row lose the point
function fault(G) { const b = G.ball, who = b.by; b.fault++; b.live = false; G.ev.push({ k: 'fault', n: b.fault, who }); if (b.fault >= 2) { G.phase = 'rally'; b.serve = false; return pointTo(G, 1 - who, 'double'); }
  G.toss = null; G.phase = 'between'; G.wait = 0.7; G.next = () => { G.phase = 'serve'; G.serveT = 0.6; if (who === 0) { G.me.x = G.side * 0.8; G.me.z = HZ + 0.3; } }; }
// where a player can best meet the coming ball (after its bounce, or as a volley near the net)
function contactFor(G, who) { const b = G.ball; if (!b.live || b.by === who) return null; const sgn = who === 0 ? 1 : -1, s = Object.assign({}, b); let t = 0, bounced = s.bounces;
  const p = who === 0 ? G.me : G.op, volleyOk = Math.abs(p.z) < 7.5;
  for (let i = 0; i < 480; i++) { s.vy -= gravOf(s) * (1 / 120); s.x += s.vx / 120; s.y += s.vy / 120; s.z += s.vz / 120; t += 1 / 120;
    if (s.y < BR) { s.y = BR; bounced++; if (bounced >= 2) return null; bounceV(s); }
    if (s.z * sgn > 0 && ((bounced >= 1 && s.y > 0.5 && s.y < 1.6 && Math.abs(s.z) < HZ + 3) || (volleyOk && bounced === 0 && Math.abs(s.z) < Math.abs(p.z) + 0.5 && s.y > 0.4 && s.y < 2))) return { x: s.x, z: s.z, y: s.y, t, volley: bounced === 0 }; }
  return null; }
// ---------- them ----------
function oppBrain(G, dt) { const op = G.op, b = G.ball, c = G.cfg, R = G.rnd, m = G.me;
  if (G.lesson || c.practice) { moveP(op, op.x, op.z, 0, dt, 1); return; }      // a lesson or the ball machine: nobody plays it back
  if (b.live && b.by === 0) { const key = b.id; if (op.planFor !== key) { op.planFor = key; op.think = c.oReact * (0.8 + R() * 0.4); op.plan = null; }
    op.think -= dt; if (!op.plan && op.think <= 0) { const pc = contactFor(G, 1); op.plan = pc ? { x: pc.x - 0.45, z: pc.z - 0.3, sw: null } : null; }
    if (op.plan) { moveP(op, op.plan.x, op.plan.z, c.oSpd * (G.lesson ? 0.6 : 1), dt, 1); const r = reachOf(G, op, 1); if (r && r.q > 0.55 - (1 - c.oAcc) * 0.3 && op.swing <= 0) { op.plan.sw = oppShot(G, r); op.swing = 0.2; G.ev.push({ k: 'swing', who: 1 }); strike(G, op, 1, r, op.plan.sw); op.plan = null; if (R() < c.oErr * (1 + Math.abs(r.dx))) { G.ball.vy *= R() < 0.5 ? 0.4 : 1.4; } } }
    else moveP(op, op.x, op.z, c.oSpd, dt, 1); return; }
  // between shots: recover (a net rusher closes in after a deep ball)
  const home = c.style === 'net' && op.mode === 'net' ? -4.5 : c.style === 'net' && G.rally > 1 && R() < dt * 0.6 ? (op.mode = 'net', -4.5) : -HZ - 0.6, hx = clamp(-m.x * 0.25, -1.6, 1.6);
  moveP(op, hx, op.mode === 'net' ? -4.5 : home, c.oSpd * 0.8, dt, 1); }
// their shot: pull you to the open side; lob you if you are at the net (a pusher lobs and slices anyway)
function oppShot(G, r) { const c = G.cfg, m = G.me, R = G.rnd, st = c.style, open = m.x > 0.5 ? -1 : m.x < -0.5 ? 1 : (R() < 0.5 ? -1 : 1), acc = c.oAcc * (G.lesson ? 0.5 : 1);
  const wide = open * (1.4 + acc * 2.2) * (G.lesson ? 0.3 : 1), up = 0.9 + R() * 0.3; let speed = 3 + c.oPace * 2, len = 0.65 + R() * 0.35;
  if (m.z < 6 && (st === 'push' || R() < acc * 0.8)) { speed = 1.6; len = 0.95; }      // you at the net: over your head
  else if (st === 'push' && R() < 0.4) return { ax: wide / 7.5, ay: 0.8, len: 0.7, speed: 3 };      // a slice
  if (r.volley) len = 0.6;
  return { ax: Math.tan(Math.atan2(wide, 7.5)) * up, ay: -up, len, speed }; }
function finish(G, win, o = {}) { if (G.over) return; G.over = win ? 'won' : 'lost'; const S = G.stats, a = G.cfg.long ? G.games[0] : G.pts[0], b = G.cfg.long ? G.games[1] : G.pts[1], stars = win ? (b === 0 || (G.cfg.long ? b <= 0 : a - b >= 5) ? 3 : a - b >= 3 || S.best >= 10 ? 2 : 1) : 0;
  G.res = { win, stars, a, b, stats: S, coins: (win ? 8 + Math.ceil(G.N / 2) : 2) + S.winners + S.aces * 2 + Math.floor(S.best / 5) * 2 + stars * 2 }; G.ev.push({ k: win ? 'won' : 'lost' }); }
// ---------- PRACTICE: a ball machine feeds the shot you want to work on ----------
const DRILLS = [{ id: 'fore', name: 'Forehands' }, { id: 'back', name: 'Backhands' }, { id: 'run', name: 'On the run' }, { id: 'lob', name: 'Lobs over the net man' }, { id: 'volley', name: 'Volleys' }, { id: 'serve', name: 'Serves' }];
function practiceSetup(G) { G.drill = G.drill || 0; G.pts = [0, 0]; practiceFeed(G); }
function practiceFeed(G) { const d = DRILLS[G.drill].id, b = G.ball, m = G.me, op = G.op, R = G.rnd; G.rally = 0; G.toss = null;
  if (d === 'serve') { G.server = 0; G.side = R() < 0.5 ? 1 : -1; G.phase = 'serve'; m.x = G.side * 0.8; m.z = HZ + 0.3; b.live = false; b.fault = 0; return; }
  G.phase = 'rally'; op.x = 0; op.z = d === 'lob' ? -4 : -HZ - 0.5; if (d === 'volley') { m.z = 4.5; } else if (m.z < 8) m.z = HZ;
  const tx = d === 'fore' ? 1.2 + R() * 1.6 : d === 'back' ? -1.2 - R() * 1.6 : d === 'run' ? (R() < 0.5 ? -1 : 1) * (2.6 + R() * 1.2) : (R() - 0.5) * 3, tz = d === 'volley' ? 3.5 : 8 + R() * 2.5;
  b.x = (R() - 0.5) * 2; b.z = -HZ + 1; b.y = 1.0; launch(b, b.x, b.y, b.z, tx, tz, d === 'volley' ? 0.9 : 1.3 / G.cfg.slow, 0.3); b.by = 1; b.serve = false; b.kind = 'feed'; G.ev.push({ k: 'feed' }); }
function setDrill(G, i) { if (!G.cfg.practice) return; G.drill = (i + DRILLS.length) % DRILLS.length; G.wait = 0.3; G.next = () => practiceFeed(G); G.ball.live = false; G.ev.push({ k: 'drill', name: DRILLS[G.drill].name }); }
// ---------- LESSONS (and later, short practice challenges for new shots) ----------
const LESSONS = {
  1: [{ id: 'rally', title: 'RALLY', how: 'Move under the ball with your LEFT thumb. As it reaches you, SWIPE UP with your right thumb. Hit 4 back over the net.', need: 4 }],
  2: [{ id: 'serve', title: 'SERVE', how: 'TAP to toss the ball. SWIPE UP when the ring turns green, at the top. Land 4 good serves in the box (swipe while the ring is green).', need: 4 }],
  3: [{ id: 'open', title: 'THE OPEN COURT', how: 'Swipe a little LEFT or RIGHT to aim. Hit 2 balls into the glowing corner, away from them.', need: 2 }],
  5: [{ id: 'lob', title: 'NEW SHOT: THE LOB', how: 'They come to the net. A very LONG swipe up (until it says LOB) lifts it over their head. 2 lobs that land in.', need: 2 }],
  7: [{ id: 'slice', title: 'NEW SHOT: THE SLICE', how: 'SWIPE DOWN (toward you) to slice: low and skidding. 2 slices that land in.', need: 2 }],
  9: [{ id: 'volley', title: 'NEW SHOT: THE VOLLEY', how: 'At the net, swipe before the ball bounces. 3 volleys that land in.', need: 3 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonFeed(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonFeed(G) { const st = lessonNow(G), b = G.ball, m = G.me, op = G.op, R = G.rnd; if (!st) return; G.rally = 0; G.toss = null; b.fault = 0; G.lessonHit = null;
  if (st.id === 'serve') { G.server = 0; G.side = 1; G.phase = 'serve'; m.x = 0.8; m.z = HZ + 0.3; b.live = false; op.x = -2.4; op.z = -HZ; return; }
  G.phase = 'rally'; op.z = st.id === 'lob' ? -4 : -HZ - 0.5; op.x = st.id === 'open' ? (R() < 0.5 ? -2.2 : 2.2) : 0; G.lessonOpen = -Math.sign(op.x); if (st.id === 'volley') m.z = 4.5; else m.z = HZ; m.x = 0;
  b.x = 0; b.z = -HZ + 1; b.y = 1.0; launch(b, 0, 1, b.z, (R() - 0.5) * 2.5 + (st.id === 'rally' ? 0.8 : 0), st.id === 'volley' ? 3.2 : 8.5 + R(), st.id === 'volley' ? 1.0 : 1.5, 0.2); b.by = 1; b.serve = false; b.kind = 'feed'; }
function lessonSee(G, what, d) { const st = lessonNow(G); if (!st) return; if (what === 'serve' && st.id === 'serve') G.lessonHit = d && d.q >= 0.8 ? { kind: 'serve' } : null; if (what === 'hit') G.lessonHit = d; }
// a lesson ball is judged where it lands (no point is played out)
function lessonTick(G) { const st = lessonNow(G), b = G.ball; if (!st || G.wait > 0 || G.phase === 'dead') return; }
function lessonPoint(G, w, why) { const st = lessonNow(G), h = G.lessonHit, b = G.ball; let good = false;
  if (h && w === 0 && (why === 'winner' || why === 'ace')) { if (st.id === 'rally' || st.id === 'serve') good = true; else if (st.id === 'open') good = Math.sign(h.tx) === G.lessonOpen && Math.abs(h.tx) > 1.2; else if (st.id === 'lob') good = h.kind === 'lob'; else if (st.id === 'slice') good = h.kind === 'slice'; else if (st.id === 'volley') good = h.kind === 'volley'; }
  G.wait = 1.0; G.next = () => lessonFeed(G);
  if (good) { G.lesson.n++; if (G.lesson.n >= st.need) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.wait = 1.6; G.next = () => { G.rnd = rng(G.seed); G.pts = [0, 0]; G.stats = { rally: 0, best: 0, winners: 0, errors: 0, aces: 0, volleys: 0, lobs: 0, slices: 0, oppErr: 0 }; startPoint(G); G.ev.push({ k: 'start' }); }; return; } G.ev.push({ k: 'lessonok', n: G.lesson.n, need: st.need }); }
  else G.ev.push({ k: 'lessonmiss', how: h ? (st.id === 'open' ? 'Into the GLOWING corner: swipe a little that way.' : st.id === 'lob' ? 'A lob is a very LONG swipe up: keep going until it says LOB.' : st.id === 'slice' ? 'A slice is a swipe DOWN.' : st.id === 'volley' ? 'Swipe BEFORE it bounces.' : st.how) : st.how }); }
// in a lesson the ball after your shot is not played back: it counts when it lands in (two bounces = in)
// ---------- for the robots ----------
const BLIND = {
  m: G => { const R = Math.random; if (R() < 0.2) setStick(G, 0, 0); else { const a = R() * TAU; setStick(G, Math.cos(a), Math.sin(a)); } },
  s: G => { const R = Math.random, a = (R() - 0.5) * 2.4; swing(G, { ax: Math.sin(a), ay: -Math.cos(a), len: R() * 1.3, speed: 1 + R() * 5 }); },
  d: G => { const R = Math.random; swing(G, { ax: (R() - 0.5), ay: 0.8, len: R(), speed: 1 + R() * 4 }); },
  t: G => toss(G),
};
// HONEST: runs to where the ball can be met, swings at the right moment (react, acc), aims at the open court
function honest(G, o, mem) { const acc = o.acc == null ? 0.85 : o.acc, react = o.react == null ? 0.3 : o.react, R = Math.random, b = G.ball, m = G.me, op = G.op;
  if (G.over || G.wait > 0) { setStick(G, 0, 0); return; }
  if (G.phase === 'serve' && G.server === 0) { setStick(G, 0, 0); if (!G.toss) { mem.cd = (mem.cd || 0) - 1 / 60; if (mem.cd <= 0) { toss(G); mem.cd = 0.5; mem.err0 = (R() - 0.5) * (1 - acc) * 2.5; } return; }
    if (G.ball.vy < 0.25 + (mem.err0 || 0)) { const side = G.side, st = lessonNow(G); swing(G, { ax: side * (st ? -0.18 : -0.18 - R() * 0.2), ay: -1, len: 0.65 + (R() - 0.5) * 0.2, speed: R() < 0.4 * acc ? 3.5 : 2.6 }); } return; }
  if (G.phase !== 'rally') { setStick(G, 0, 0); return; }
  if (b.live && b.by === 1) { if (mem.ball !== b.id) { mem.ball = b.id; mem.seen = G.t + react; mem.pc = null; }
    if (G.t >= mem.seen && !mem.pc) { mem.pc = contactFor(G, 0); if (mem.pc) { mem.pc.x += (R() - 0.5) * (1 - acc) * 1.2; mem.err = (R() - 0.5) * (1 - acc) * 0.5; } }
    if (mem.pc) { const tx = mem.pc.x + 0.45, tz = mem.pc.z + 0.25, dx = tx - m.x, dz = tz - m.z, d = Math.hypot(dx, dz); setStick(G, d > 0.15 ? dx / Math.max(d, 0.6) : 0, d > 0.15 ? dz / Math.max(d, 0.6) : 0);
      const r = reachOf(G, m, 0); if (r && r.dz + 0.35 > -0.25 + mem.err && m.swing <= 0) { const st = lessonNow(G), open = st && st.id === 'open' ? G.lessonOpen : op.x > 0.4 ? -1 : op.x < -0.4 ? 1 : (R() < 0.5 ? -1 : 1), aim = open * 0.36 * (R() < acc ? 1 : -0.5);
        let sw = { ax: aim, ay: -1, len: 0.6 + R() * 0.3, speed: 3.6 };
        if (st && st.id === 'lob' || (op.z > -6 && R() < 0.6)) sw = { ax: aim * 0.5, ay: -1, len: 0.95, speed: 1.6 }; else if (st && st.id === 'slice') sw = { ax: aim, ay: 0.9, len: 0.7, speed: 3 };
        swing(G, sw); } }
    else setStick(G, 0, 0); return; }
  // after your shot: back to the middle of the baseline
  const hz = HZ + 0.3, dx = -m.x, dz = hz - m.z, d = Math.hypot(dx, dz); setStick(G, d > 0.4 ? dx / Math.max(d, 1) : 0, d > 0.4 ? dz / Math.max(d, 1) : 0); }
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.pts[0] = 7; finish(G, true); }
