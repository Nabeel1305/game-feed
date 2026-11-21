// ===================== THE RULES: Gridiron (his idea 15, 20 Nov 2026) =====================
// Five-a-side arcade American football, seen from behind the attacking team. Before each play: pick a play card (its routes are
// drawn on the field). Then SNAP. As quarterback the stick moves you; a floating button over each receiver throws to him (its
// colour is how open he is); on run plays HANDOFF gives it to the running back. Whoever has the ball, you control: SPRINT and
// DODGE (a juke: dodges a tackle if well timed). Four downs to gain ten yards; reach the end zone for a touchdown (7). On
// defence: SWITCH to the defender nearest the ball, TACKLE when you are close. Units are yards: x across, z down the field
// (the attacking team always heads for z = 100).
const RULES = [
  'Before each play, <b>pick a play</b>: its routes are drawn on the field. Then <b>SNAP</b>.',
  'Passing: tap the <b>button over a receiver</b> to throw. <b>Green</b> = open, <b>red</b> = covered. Short is safe; deep is a risk.',
  'Running plays: <b>HANDOFF</b>. With the ball: the stick runs, <b>SPRINT</b> to go faster, <b>DODGE</b> just before a tackle.',
  '<b>Four downs to gain ten yards</b> (the yellow line). Reach the end zone: <b>touchdown</b>, 7 points.',
  'Defending: <b>SWITCH</b> to the player nearest the ball, <b>TACKLE</b> when you are close.',
];
const HW = 18, YD = 1;
const TEAMS = ['Harbor Hammers', 'Prairie Dogs', 'Iron Rams', 'Storm Riders', 'Copper Kings', 'Night Hawks', 'Bay Sharks', 'River Bulls', 'Thunder', 'Glacier Bears'];
const KITS = [[0xd8302a, 0xffffff], [0x2a9a4a, 0xffffff], [0xf0b020, 0x1a1a1a], [0x7a3ad0, 0xffffff], [0x1a1a1e, 0xf0a020], [0xe86a20, 0x1a1a1a], [0x2ab0c0, 0x1a1a1a]];
const SKINS = [{ id: 'blue', name: 'Royal blue', col: 0x2a5ad8, stars: 0 }, { id: 'green', name: 'Forest', col: 0x2a8a4a, stars: 6 }, { id: 'navy', name: 'Navy', col: 0x1a2a6a, stars: 14 }, { id: 'maroon', name: 'Maroon', col: 0x8a1a2a, stars: 24 }, { id: 'black', name: 'Blackout', col: 0x1a1a1e, stars: 36 }, { id: 'gold', name: 'Gold', col: 0xd8a820, stars: 50 }];
const UPGRADES = [{ id: 'cleats', name: 'Fast cleats', max: 2, cost: l => [60, 140][l], desc: 'Run a little quicker.' }, { id: 'arm', name: 'Strong arm', max: 2, cost: l => [70, 160][l], desc: 'Passes get there sooner.' }, { id: 'gloves', name: 'Sticky gloves', max: 1, cost: () => 110, desc: 'Fewer drops when covered.' }];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Rookie'], [60, 'Starter'], [200, 'Captain'], [500, 'Pro Bowler'], [1100, 'MVP'], [2500, 'Hall of Famer']];
const PLACES = [{ name: 'Practice field' }, { name: 'High school stadium' }, { name: 'College bowl' }, { name: 'Pro stadium' }];
const placeOf = N => Math.min(3, Math.floor((N - 1) / 5));
const STYLES = { even: 'a balanced defence', blitz: 'they blitz: quick throws beat it', deep: 'they drop deep: short passes and runs work', wall: 'a wall against the run: pass on them' };
function styleOf(N) { return N <= 4 ? 'even' : ['blitz', 'deep', 'even', 'wall'][(N - 5) % 4]; }
// the plays: who does what (routes as points relative to the ball at the snap, in yards)
const PLAYS = {
  dive:   { name: 'Dive', kind: 'run', lv: 1, desc: 'Hand off up the middle. Safe, a few yards.', rb: [[0, 2], [0.5, 12]], wr: [[[-9, 3], [-9, 9]], [[9, 3], [9, 9]]] },
  sweep:  { name: 'Sweep', kind: 'run', lv: 1, desc: 'Hand off round the edge. Big gain or a loss.', rb: [[-1, -2.5], [-11, 1], [-12, 14]], wr: [[[-9, 2], [-7, 6]], [[9, 3], [9, 12]]] },
  slant:  { name: 'Slants', kind: 'pass', lv: 2, desc: 'Quick short throws. Beats the blitz.', rb: [[3, 1], [5, 3]], wr: [[[-10, 3], [-4, 8]], [[10, 3], [4, 8]]] },
  deep:   { name: 'Go deep', kind: 'pass', lv: 4, desc: 'Both receivers sprint long. Risky, huge.', rb: [[-4, 0], [-8, 3]], wr: [[[-10, 3], [-10, 32]], [[10, 3], [10, 30]]] },
  curl:   { name: 'Curls', kind: 'pass', lv: 6, desc: 'Run, stop and turn at 10 yards. Beats deep zones.', rb: [[4, 1], [9, 4]], wr: [[[-9, 3], [-9, 12], [-8, 10]], [[9, 3], [9, 12], [8, 10]]] },
};
function makeCfg(N, help, o = {}) { const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), style = styleOf(N);
  const mode = o.quick ? 'drive' : 'match';      // the challenges (a first down, a catch, a tackle) are the three lessons; every level is a match
  return { N, f, help: !!help, style, mode, uSpd: 7.0 * (1 + 0.05 * upLv('cleats')), dSpd: x(6.4, 7.0, 25) * (help ? 0.9 : 1), oSpd: x(6.9, 7.4, 25), dTackle: x(0.62, 0.74, 25) * (help ? 0.8 : 1), cover: x(0.7, 0.95, 25) * (style === 'deep' ? 1.15 : 1) * (help ? 0.85 : 1),
    blitz: style === 'blitz' ? 2 : 1, wall: style === 'wall' ? 1.35 : 1, oQB: x(0.85, 1.0, 25), arm: 1 + 0.1 * upLv('arm'), plays: Object.keys(PLAYS).filter(k2 => PLAYS[k2].lv <= Math.max(N, o.quick ? 6 : 1)) }; }
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help, o), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0, R = rng(seed + 7);
  const G = { N, cfg, seed, rnd: R, t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, mini: !!o.mini, foe: TEAMS[(N - 1) % TEAMS.length], kit: KITS[(N - 1) % KITS.length], place: placeOf(N),
    P: [], ctrl: 0, stick: { x: 0, z: 0 }, ball: { own: null, x: 0, z: 0, y: 1, kind: 'held', T: 0, t: 0 }, phase: 'pick', play: null, los: 30, down: 1, togo: 10, fdl: 40, att: 0, score: [0, 0], drives: [], drive: 0, pause: 0,
    stats: { yds: 0, pass: 0, att: 0, rush: 0, td: 0, tk: 0, ints: 0, firsts: 0, long: 0 }, lastPlay: null, msg: null, gained: [0, 0], firsts: 0 };
  for (let t = 0; t < 2; t++) for (let i = 0; i < 5; i++) G.P.push({ t, i, id: t * 5 + i, x: 0, z: 0, vx: 0, vz: 0, face: Math.PI / 2, role: '', st: 1, sprint: false, dodge: 0, dodgeCd: 0, block: null, held: 0, route: null, ri: 0, mark: null });
  G.plan = cfg.mode === 'match' ? [0, 1] : cfg.mode === 'stop' ? [1] : [0];
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else startDrive(G);
  return G; }
const team = (G, t) => G.P.filter(p => p.t === t), me = G => G.P[G.ctrl], offT = G => G.att, defT = G => 1 - G.att, dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
// a drive: who attacks, from where
function startDrive(G) { const c = G.cfg, who = G.plan[G.drive]; G.att = who; G.los = c.mode === 'redzone' ? 90 : c.mode === 'first' ? 30 : c.mode === 'stop' ? 68 : G.drive >= 2 ? 50 : 32; G.down = 1; G.togo = Math.min(10, 100 - G.los); G.fdl = G.los + G.togo; G.playsRun = 0; G.driveStart = G.los;
  G.ev.push({ k: 'drive', t: who, n: G.drive }); toPick(G); }
function toPick(G) { G.phase = 'pick'; G.play = null; G.ball.kind = 'held'; G.ball.own = null; G.pickT = 0; lineUp(G, null); if (G.att === 1) { G.play = G.lesson ? 'dive' : aiPickPlay(G); G.pickT = 1.2; } }
// line up in formation: offense C, QB, RB, WR, WR; defence two linemen, a linebacker, two corners
function lineUp(G, play) { const L = G.los, c = G.cfg; const off = team(G, G.att), def = team(G, 1 - G.att);
  const op = [['C', 0, -0.5], ['QB', 0, -1.6], ['RB', 0, -5], ['WR', -10, -0.6], ['WR', 10, -0.6]], dp = [['DL', -1.5, 1.2], ['DL', 1.5, 1.2], ['LB', 0, 5], ['CB', -10, 6], ['CB', 10, 6]];
  off.forEach((p, i) => { const [r, x, z] = op[i]; Object.assign(p, { role: r, x, z: L + z, vx: 0, vz: 0, face: Math.PI / 2, route: null, ri: 0, held: 0, block: null, dodge: 0, sprint: false }); });
  def.forEach((p, i) => { const [r, x, z] = dp[i]; Object.assign(p, { role: r, x, z: L + z * (r === 'CB' && c.style === 'deep' ? 1.6 : 1), vx: 0, vz: 0, face: -Math.PI / 2, held: 0, block: null, mark: null, dodge: 0 }); });
  const b = G.ball; b.own = off[0]; b.kind = 'held'; b.x = 0; b.z = L; b.y = 0.3;
  G.ctrl = G.att === 0 ? off[1].id : def[2].id; }
function pickPlay(G, key) { if (G.phase !== 'pick' || G.att !== 0 || !G.cfg.plays.includes(key) || G.over) return false; G.play = key; G.ev.push({ k: 'pick', play: key }); lessonSee(G, 'pick'); return true; }
function snap(G) { if (G.phase !== 'pick' || !G.play || G.over || G.pause > 0) return false; const play = PLAYS[G.play], off = team(G, G.att), def = team(G, 1 - G.att), L = G.los, R = G.rnd;
  const qb = off[1], rb = off[2]; G.phase = 'live'; G.liveT = 0; G.ball.own = qb; G.ball.kind = 'held'; G.handed = false; G.thrown = false;
  rb.route = play.rb.map(([x, z]) => [x, L + z - 0]); rb.ri = 0; off[3].route = play.wr[0].map(([x, z]) => [x, L + z]); off[4].route = play.wr[1].map(([x, z]) => [x, L + z]); off[3].ri = off[4].ri = 0;
  // defence: linemen rush (a linebacker joins a blitz), corners cover the receivers, the linebacker watches the back
  def[0].mark = 'rush'; def[1].mark = 'rush'; def[2].mark = G.cfg.blitz > 1 && R() < 0.7 ? 'rush' : 'spy'; def[3].mark = off[3].id; def[4].mark = off[4].id;
  off[0].block = def[0].id; rb.blockFirst = play.kind === 'pass' && G.play !== 'slant';
  const prot = play.kind === 'pass' ? 1.8 + R() * 0.9 : 1.3 + R() * 0.6; def[0].held = prot * (G.cfg.wall > 1 && play.kind === 'run' ? 0.5 : 1); def[1].held = prot * (0.85 + R() * 0.3) * (G.cfg.wall > 1 && play.kind === 'run' ? 0.5 : 1); def[0].immune = def[1].immune = prot + 1.2;
  G.ev.push({ k: 'snap' }); G.lastPlay = G.play; G.playsRun++; if (G.att === 0) G.ctrl = qb.id; lessonSee(G, 'snap'); return true; }
// ---------- passing ----------
function openness(G, q) { let m = 99; for (const o of team(G, 1 - q.t)) m = Math.min(m, dist(o, q)); return m; }
const eligible = G => team(G, G.att).filter(p => p.role === 'WR' || p.role === 'RB');
function throwTo(G, id) { const b = G.ball, qb = b.own; if (G.phase !== 'live' || !qb || qb.role !== 'QB' || G.thrown || qb.z > G.los + 0.5 || PLAYS[G.play].kind !== 'pass') return false; const q = G.P[id]; if (!q || q.t !== G.att || (q.role !== 'WR' && q.role !== 'RB')) return false;
  const d = dist(qb, q), T = (0.35 + d / 24) / G.cfg.arm, lead = Math.min(T, 1.5); let tx = q.x + q.vx * lead, tz = q.z + q.vz * lead; tx = clamp(tx, -HW, HW);
  // pressure: a rusher on you throws you off
  let pr = 99; for (const o of team(G, 1 - G.att)) pr = Math.min(pr, dist(o, qb)); const skill = G.att === 1 ? G.cfg.oQB : 1, err = (pr < 1.6 ? 2.2 : 0.4) / skill * (0.5 + d / 40);
  tx += (G.rnd() - 0.5) * err; tz += (G.rnd() - 0.5) * err;
  b.own = null; b.kind = 'air'; b.sx = qb.x; b.sz = qb.z; b.tx = tx; b.tz = tz; b.t = 0; b.T = T; b.to = q; b.from = qb; G.thrown = true; G.ev.push({ k: 'throw', t: G.att, deep: d > 18 });
  if (G.att === 0) G.stats.att++; G.openThrow = openness(G, q) >= 2.2; lessonSee(G, 'throw'); return true; }
function handoff(G) { const b = G.ball, qb = b.own; if (G.phase !== 'live' || !qb || qb.role !== 'QB' || G.handed || G.thrown || PLAYS[G.play].kind !== 'run') return false; const rb = team(G, G.att)[2]; if (dist(qb, rb) > 5) return false;
  b.own = rb; G.handed = true; if (G.att === 0) G.ctrl = rb.id; G.ev.push({ k: 'handoff', t: G.att }); lessonSee(G, 'handoff'); return true; }
function catchOrNot(G) { const b = G.ball, q = b.to, R = G.rnd; const dq = Math.hypot(q.x - b.tx, q.z - b.tz);
  let best = null, bd = 99; for (const o of team(G, 1 - G.att)) { const d = Math.hypot(o.x - b.tx, o.z - b.tz); if (d < bd) { bd = d; best = o; } }
  if (best && bd < 1.3 && bd < dq + 0.4 && R() < (0.22 - bd * 0.12) * (G.att === 0 ? G.cfg.cover : 0.8)) { give(G, best); G.ev.push({ k: 'int', t: best.t }); if (G.att === 1) G.stats.ints++; return endPlay(G, 'int'); }
  if (dq > 1.7 || q.held > 0) { G.ev.push({ k: 'incomplete', why: 'wide' }); return endPlay(G, 'inc'); }
  const pCatch = clamp(0.95 - (bd < 1.6 ? (1.6 - bd) * 0.45 * (G.att === 0 ? G.cfg.cover : 0.85) / (1 + 0.3 * (G.att === 0 ? upLv('gloves') : 0)) : 0), 0.15, 0.96);
  if (R() < pCatch) { give(G, q); G.ev.push({ k: 'catch', t: q.t, open: bd }); if (G.att === 0) G.stats.pass++; lessonSee(G, 'catch'); } else { G.ev.push({ k: 'incomplete', why: bd < 1.6 ? 'broken' : 'drop' }); endPlay(G, 'inc'); } }
function give(G, p) { const b = G.ball; b.own = p; b.kind = 'held'; if (p.t === 0) G.ctrl = p.id; }
// ---------- controls ----------
function setStick(G, x, z) { const L = Math.hypot(x, z); G.stick = L > 1 ? { x: x / L, z: z / L } : { x, z }; }
function sprintOn(G, on) { const p = me(G); p.sprint = !!on && p.st > 0.08; }
function dodge(G) { const p = me(G); if (G.phase !== 'live' || p.dodgeCd > 0 || G.ball.own !== p) return false; p.dodge = 0.35; p.dodgeCd = 1.1; G.ev.push({ k: 'dodge' }); return true; }
function switchNear(G) { if (G.att === 0 || G.phase !== 'live') return false; const b = G.ball, tgt = b.own || { x: b.tx, z: b.tz }; let best = null, bd = 1e9; for (const p of team(G, 0)) { const d = Math.hypot(p.x - tgt.x, p.z - tgt.z); if (d < bd) { bd = d; best = p; } } if (!best || best.id === G.ctrl) return false; G.ctrl = best.id; G.ev.push({ k: 'switch' }); return true; }
function tackleBtn(G) { const p = me(G), c = G.ball.own; if (G.phase !== 'live' || G.att === 0 || p.dodgeCd > 0) return false; p.dodgeCd = 0.8; G.ev.push({ k: 'dive' }); if (!c || c.t === p.t) return true; const d = dist(p, c); if (d > 1.9) { p.held = 0.9; lessonSee(G, 'whiff'); return true; }      // a dive at nothing leaves you on the ground
  const pr = (d < 1.0 ? 0.85 : 0.6) * (c.dodge > 0 ? 0.25 : 1); if (G.rnd() < pr) tackled(G, c, p); else { p.held = 0.9; G.ev.push({ k: 'missed', t: p.t }); lessonSee(G, 'whiff'); } return true; }
// ---------- the clock ----------
const speedOf = (G, p) => { const c = G.cfg, base = p.t === 0 ? (G.att === 0 ? c.uSpd : c.dSpd * 0.98) : (G.att === 1 ? c.oSpd : c.dSpd); return base * (G.ball.own === p ? 0.95 : 1) * (p.sprint && p.st > 0.02 ? 1.15 : 1) * (p.held > 0 ? 0.15 : 1) * (p.role === 'C' || p.role === 'DL' ? 0.8 : 1) * (G.lesson && p.t === 1 ? G.lesson.dSlow || 1 : 1); };
function moveTo(G, p, tx, tz, dt, sp) { const dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz), s = sp != null ? sp : speedOf(G, p); let vx = 0, vz = 0; if (d > 0.1) { vx = dx / d * Math.min(s, d * 5); vz = dz / d * Math.min(s, d * 5); } body(G, p, vx, vz, dt); }
function body(G, p, vx, vz, dt) { const a = 1 - Math.exp(-dt * 8); p.vx += (vx - p.vx) * a; p.vz += (vz - p.vz) * a; p.x += p.vx * dt; p.z += p.vz * dt; if (Math.hypot(p.vx, p.vz) > 0.4) p.face = Math.atan2(p.vz, p.vx); }
function step(G, dt) { if (G.over || !(dt > 0)) return; G.t += dt; const c = G.cfg, b = G.ball;
  if (G.lesson) { lessonTick(G, dt); if (G.over) return; }
  if (G.pause > 0) { G.pause -= dt; if (G.pause <= 0 && G.after) { const f = G.after; G.after = null; f(); } return; }
  if (G.phase === 'pick') { if (G.att === 1) { G.pickT -= dt; if (G.pickT <= 0) snap(G); } return; }
  if (G.phase !== 'live') return;
  G.liveT += dt;
  for (const p of G.P) { p.immune = Math.max(0, (p.immune || 0) - dt); p.blocking = false; p.dodge = Math.max(0, p.dodge - dt); p.dodgeCd = Math.max(0, p.dodgeCd - dt); p.held = Math.max(0, p.held - dt); if (p.sprint) p.st = Math.max(0, p.st - dt * 0.25); else p.st = Math.min(1, p.st + dt * 0.15); if (p.st <= 0.02) p.sprint = false; }
  const y = me(G); if (y.role === 'QB' && G.ball.own === y && !G.thrown && PLAYS[G.play].kind === 'pass' && G.liveT < 0.9 && !G.stick.x && !G.stick.z) moveTo(G, y, y.x, G.los - 5, dt, 5.5); else body(G, y, G.stick.x * speedOf(G, y), G.stick.z * speedOf(G, y), dt);
  for (const p of G.P) if (p !== y) brain(G, p, dt);
  // bodies don't pass through each other; blockers hold the men they meet
  for (let i = 0; i < G.P.length; i++) for (let j = i + 1; j < G.P.length; j++) { const a = G.P[i], q = G.P[j], dx = a.x - q.x, dz = a.z - q.z, d = Math.hypot(dx, dz); if (d < 0.8 && d > 0.001) { const push = (0.8 - d) * 0.5; a.x += dx / d * push; a.z += dz / d * push; q.x -= dx / d * push; q.z -= dz / d * push;
      if (a.t !== q.t) { const blk = a.t === G.att ? a : q, def = blk === a ? q : a; if (b.own && b.own !== blk && b.own.role !== 'QB' && blk.blocking && def.held <= 0 && !(def.immune > 0) && G.rnd() < dt * 4 * (c.wall > 1 && def.t !== G.att ? 0.5 : 1)) { def.held = 0.4 + G.rnd() * 0.5; def.immune = 1.6; G.ev.push({ k: 'block', x: def.x, z: def.z }); } } } }      // only a man blocking for the carrier holds a defender, and not the same one over and over
  // the quarterback is not shoved up the field by the pile (he can still run if you steer him)
  { const qb = b.own; if (qb && qb.role === 'QB' && !G.thrown && !G.handed && !(qb === y && G.stick.z > 0.3)) qb.z = Math.min(qb.z, G.los - 0.6); }
  // the ball
  if (b.kind === 'held' && b.own) { b.x = b.own.x; b.z = b.own.z; b.y = 1.1; const o = b.own;
    if (o.t === G.att && o.z >= 100) return touchdown(G, o);
    if (Math.abs(o.x) > HW) { G.ev.push({ k: 'outside' }); return endPlay(G, 'out'); }
    if (o.t !== G.att) { if (o.z <= 0 || G.liveT > 30) return endPlay(G, 'int'); }
    // tacklers: any defender close enough has a go (a dodge at the right moment beats it)
    if (o.t === G.att && !(G.lesson && G.lesson.noTackle)) for (const d of team(G, 1 - G.att)) { if (G.att === 1 && (d === y || (G.lesson && G.lesson.id === 'tackle'))) continue; if (d.held > 0 || dist(d, o) > 1.15) continue; d.tryT = (d.tryT || 0) - dt; if (d.tryT > 0) continue; d.tryT = 0.3;
      const pr = c.dTackle * (d.t === 0 ? 0.9 : 1) * (o.dodge > 0 ? 0.15 : 1) * (o.sprint ? 0.9 : 1) * (o.role === 'QB' ? 1.4 : 1); if (G.rnd() < pr) { tackled(G, o, d); return; } else if (o.dodge > 0) G.ev.push({ k: 'juked', t: o.t }); } }
  else if (b.kind === 'air') { b.t += dt; const u = Math.min(1, b.t / b.T); b.x = b.sx + (b.tx - b.sx) * u; b.z = b.sz + (b.tz - b.sz) * u; b.y = 1.8 + Math.sin(u * Math.PI) * Math.min(9, 1 + b.T * 4); if (u >= 1) catchOrNot(G); }
  if (G.liveT > 25) endPlay(G, 'stop'); }
function tackled(G, o, d) { G.ev.push({ k: 'tackle', t: d.t, x: o.x, z: o.z, sack: o.role === 'QB' && !G.thrown }); if (d.t === 0 && G.att === 1) G.stats.tk++; lessonSee(G, d === me(G) && G.att === 1 ? 'tackle' : 'tackled'); endPlay(G, 'tackle'); }
function touchdown(G, o) { G.score[G.att] += 7; G.gained[G.att] += 100 - G.los; G.ev.push({ k: 'td', t: G.att }); if (G.att === 0) { G.stats.td++; const g = 100 - G.los; G.stats.long = Math.max(G.stats.long, g); G.stats.yds += g; } lessonSee(G, 'td'); G.phase = 'done'; G.pause = 2.2; G.after = () => nextDrive(G, 'td'); }
function endPlay(G, why) { if (G.phase !== 'live') return; G.phase = 'done'; const b = G.ball, o = b.own, c = G.cfg;
  if (why === 'int') { G.ev.push({ k: 'turnover', why: 'int' }); G.pause = 2; G.after = () => nextDrive(G, 'int'); return; }
  const spot = (why === 'inc') ? G.los : clamp(o ? o.z : G.los, 1, 99), gain = spot - G.los; if (G.att === 0 && why !== 'inc') { G.stats.yds += gain; G.stats.long = Math.max(G.stats.long, gain); if (PLAYS[G.lastPlay].kind === 'run' && G.handed) G.stats.rush += Math.max(0, gain); }
  G.los = spot; G.gained[G.att] += gain; G.ev.push({ k: 'result', gain: Math.round(gain), why });
  if (G.los >= G.fdl) { G.down = 1; G.togo = Math.min(10, 100 - G.los); G.fdl = G.los + G.togo; G.ev.push({ k: 'first', t: G.att }); if (G.att === 0) G.stats.firsts++; lessonSee(G, 'first');
    if (c.mode === 'first' && G.att === 0 && !G.lesson && ++G.firsts >= 2) { G.pause = 1.8; G.after = () => finish(G, true); return; } }      // the challenge: two first downs in a row
  else { G.down++; G.togo = Math.max(1, G.fdl - G.los); if (G.down > 4) { G.ev.push({ k: 'turnover', why: 'downs' }); G.pause = 2; G.after = () => nextDrive(G, 'downs'); return; } }
  G.pause = 1.6; G.after = () => toPick(G); }
function nextDrive(G, why) { const c = G.cfg; if (G.lesson) return lessonReset(G);
  if (c.mode === 'first') return finish(G, why === 'td'); if (c.mode === 'redzone') return finish(G, why === 'td'); if (c.mode === 'stop') return finish(G, why !== 'td'); if (c.mode === 'drive') return finish(G, why === 'td');
  G.drive++; if (G.drive >= G.plan.length) { if (G.score[0] === G.score[1] && G.plan.length < 6) { G.plan.push(0, 1); G.ev.push({ k: 'ot' }); } else return finish(G, G.score[0] !== G.score[1] ? G.score[0] > G.score[1] : G.gained[0] > G.gained[1] + 10); } startDrive(G); }      // one overtime pair from the 40; still level: a loss (try again)
// ---------- everyone else ----------
function brain(G, p, dt) { const c = G.cfg, b = G.ball, o = b.own, off = p.t === G.att, R = G.rnd, L = G.los;
  if (p.held > 0) return body(G, p, 0, 0, dt);
  if (off) { if (o === p) { // an AI carrier: run for daylight
      if (p.role === 'QB' && G.att === 1) return aiQB(G, p, dt);
      if (p.role === 'QB' && G.att === 0) return body(G, p, 0, 0, dt);
      let ax = 0, az = 1; for (const d of team(G, 1 - p.t)) { const dx = p.x - d.x, dz = p.z - d.z, dd = Math.hypot(dx, dz); if (dd < 6 && dz < 2) { ax += dx / dd * (6 - dd) * 0.25; } } return moveTo(G, p, p.x + ax * 3, p.z + 6, dt); }
    if (o && o.t === p.t && o !== p && p.role !== 'QB' && (G.handed || G.thrown && b.kind === 'held')) { // block for the carrier
      let best = null, bd = 99; for (const d of team(G, 1 - p.t)) { const dd = dist(d, o); if (dd < bd && d.z > o.z - 2) { bd = dd; best = d; } } p.blocking = true; if (best) return moveTo(G, p, (best.x + o.x) / 2, (best.z + o.z) / 2 + 0.5, dt); return moveTo(G, p, o.x, o.z + 5, dt); }
    if (p.role === 'C') { const t2 = G.P[p.block]; if (G.liveT > 2.6) return body(G, p, 0, 0, dt); return moveTo(G, p, t2 ? clamp(t2.x, -2, 2) : 0, L - 0.3, dt, speedOf(G, p) * 0.6); }
    if (p.route && b.kind !== 'held' || (p.route && o && o.role === 'QB')) { if (p.role === 'RB' && p.blockFirst && G.liveT < 1.4) return moveTo(G, p, p.x * 0.8, L - 2, dt); const r = p.route[Math.min(p.ri, p.route.length - 1)]; if (dist(p, { x: r[0], z: r[1] }) < 0.8 && p.ri < p.route.length - 1) p.ri++;
      if (p.ri >= p.route.length - 1 && dist(p, { x: r[0], z: r[1] }) < 0.8) { if (b.kind === 'air' && b.to === p) return moveTo(G, p, b.tx, b.tz, dt); return body(G, p, 0, 0, dt); }
      if (b.kind === 'air' && b.to === p) return moveTo(G, p, b.tx, b.tz, dt); return moveTo(G, p, r[0], r[1], dt); }
    if (p.role === 'RB' && o && o.role === 'QB' && PLAYS[G.play] && PLAYS[G.play].kind === 'run' && !G.handed) { const r = p.route[0]; return moveTo(G, p, r[0], r[1], dt, speedOf(G, p) * 0.5); }
    return body(G, p, 0, 0, dt); }
  // defence (a quarterback who runs past the line is everyone's man)
  const tgt = o && o.t === G.att ? o : null;
  if (b.kind === 'air') { const q = b.to, dd = Math.hypot(p.x - b.tx, p.z - b.tz); if (p.mark === q.id || dd < 6) return moveTo(G, p, b.tx, b.tz, dt); }
  if (tgt && (tgt.role !== 'QB' || p.mark === 'rush' || G.handed || tgt.z > G.los - 0.2)) { const dd = dist(p, tgt), lead = Math.min(1.2, dd / 7), past = tgt.z > G.los + 6 ? 1.1 : 1; return moveTo(G, p, tgt.x + tgt.vx * lead, tgt.z + tgt.vz * lead, dt, speedOf(G, p) * past); }      // pursuit: angles, and a burst once he is through
  if (p.mark === 'rush') { const qb = team(G, G.att)[1], cn = team(G, G.att)[0]; let tx = qb.x, tz = qb.z; if (cn !== qb && Math.abs(cn.x - p.x) < 1.1 && cn.z < p.z && cn.z > qb.z) tx = cn.x + (p.x >= cn.x ? 1.6 : -1.6); return moveTo(G, p, tx, tz, dt, speedOf(G, p) * (p.role === 'LB' ? 1 : 0.85)); }      // round the blocker, not through him
  if (p.mark === 'spy') { const rb = team(G, G.att)[2]; return moveTo(G, p, rb.x * 0.7, Math.max(L + 3, rb.z + 3), dt); }
  const m = G.P[p.mark]; if (m) { const cushion = 1.8 / (p.t === G.att ? 1 : (p.t === 1 ? c.cover : 0.95)) + (c.style === 'deep' && p.t === 1 ? 2 : 0); return moveTo(G, p, m.x + m.vx * 0.3, m.z + cushion + m.vz * 0.3, dt, speedOf(G, p) * (p.t === 1 ? Math.min(1.05, 0.85 + c.cover * 0.15) : 0.95)); }
  body(G, p, 0, 0, dt); }
// the other team's quarterback: drop back, look for an open man, throw (or scramble when pressed)
function aiQB(G, p, dt) { const c = G.cfg, R = G.rnd, play = PLAYS[G.play];
  if (play.kind === 'run') { if (G.liveT > 0.5) { const rb = team(G, G.att)[2]; if (dist(p, rb) < 3.5) return handoff(G); } return moveTo(G, p, 0, G.los - 3, dt, 3); }
  moveTo(G, p, 0, G.los - 4, dt, 3); if (G.liveT < 1.0) return; let best = null, bo = 0; for (const q of eligible(G)) { const o2 = openness(G, q); if (o2 > bo) { bo = o2; best = q; } }
  let pr = 99; for (const o of team(G, 1 - G.att)) pr = Math.min(pr, dist(o, p)); if (best && (bo > 2.6 || G.liveT > 2.8 || pr < 2.0) && R() < dt * 6) throwTo(G, best.id); }
function aiPickPlay(G) { const R = G.rnd, ks = G.cfg.plays.length ? Object.keys(PLAYS).filter(k2 => PLAYS[k2].lv <= Math.max(G.N, 2)) : ['dive']; if (G.togo <= 3 && R() < 0.6) return 'dive'; return ks[(R() * ks.length) | 0]; }
function finish(G, win) { if (G.over) return; G.over = win ? 'won' : 'lost'; const S = G.stats, c = G.cfg, stars = win ? (c.mode === 'match' ? (G.score[0] - G.score[1] >= 14 ? 3 : G.score[1] === 0 ? 3 : G.score[0] - G.score[1] >= 7 ? 2 : 1) : (G.playsRun <= 2 ? 3 : G.playsRun <= 4 ? 2 : 1)) : 0;
  G.res = { win, stars, mode: c.mode, score: G.score.slice(), stats: Object.assign({}, S), coins: Math.round(Math.max(0, S.yds) / 5) + S.td * 4 + S.tk + S.ints * 3 + (win ? 8 + Math.ceil(G.N / 2) + stars * 3 : 0), foe: G.foe };
  G.ev.push({ k: win ? 'won' : 'lost' }); }
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'run', title: 'RUN IT', how: 'Pick DIVE, tap SNAP, then HANDOFF. Run with the stick: get past the yellow line (ten yards). DODGE just before a tackle.', need: 1 }],
  2: [{ id: 'pass', title: 'THROW IT', how: 'Pick SLANTS and SNAP. Wait for a receiver to turn GREEN (open), then tap his button. Three catches in a row.', need: 3 }],
  3: [{ id: 'tackle', title: 'STOP THEM', how: 'You defend now. SWITCH to the player nearest the ball, run at the carrier, tap TACKLE when you are close.', need: 1 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0, wait: 0, id: LESSONS[G.N][0].id, dSlow: 0.55 }; G.ev.push({ k: 'lessonnext', first: true }); lessonReset(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonReset(G) { const D = G.lesson; if (!D || D.done) return; G.cfg = Object.assign({}, G.cfg, { plays: D.id === 'run' ? ['dive'] : D.id === 'pass' ? ['slant'] : G.cfg.plays }); G.att = D.id === 'tackle' ? 1 : 0; G.los = 30; G.down = 1; G.togo = 10; G.fdl = 40; G.plan = [G.att]; G.drive = 0; toPick(G); if (G.att === 1) G.play = 'dive'; }
function lessonTick(G, dt) { const D = G.lesson; if (D.wait > 0) { D.wait -= dt; if (D.wait <= 0 && D.done) { G.lesson = null; G.cfg = makeCfg(G.N, G.cfg.help); G.score = [0, 0]; G.stats = { yds: 0, pass: 0, att: 0, rush: 0, td: 0, tk: 0, ints: 0, firsts: 0, long: 0 }; G.drive = 0; G.plan = G.cfg.mode === 'match' ? [0, 1] : G.cfg.mode === 'stop' ? [1] : [0]; startDrive(G); G.ev.push({ k: 'start' }); } } }
function lessonSee(G, what) { const st0 = lessonNow(G); if (!st0 || G.lesson.done) return; const D = G.lesson;
  if ((st0.id === 'tackle' && what === 'whiff') || (st0.id === 'pass' && what === 'throw' && !G.openThrow)) { if (D.n) G.ev.push({ k: 'lessonmiss', how: st0.id === 'tackle' ? 'Too far: get right up to him, then TACKLE.' : 'He was covered (red). Throw to a GREEN one.' }); D.n = 0; return; }
  if (st0.id === 'pass' && what === 'catch' && !G.openThrow) return;
  const ok = (st0.id === 'run' && (what === 'first' || what === 'td')) || (st0.id === 'pass' && what === 'catch') || (st0.id === 'tackle' && what === 'tackle'); if (!ok) return;
  D.n++; G.ev.push({ k: 'lessonok', n: D.n, need: st0.need }); if (D.n >= st0.need) { D.done = true; D.wait = 1.8; G.ev.push({ k: 'lessondone', N: G.N }); } }
// ---------- for the robots ----------
const BLIND = { m: G => { const R = Math.random; if (R() < 0.2) setStick(G, 0, 0); else { const a = R() * TAU; setStick(G, Math.cos(a), Math.sin(a)); } },
  k: G => { const ks = G.cfg.plays; pickPlay(G, ks[(Math.random() * ks.length) | 0]); snap(G); },
  r: G => { const el = eligible(G); const q = el[(Math.random() * el.length) | 0]; if (q) throwTo(G, q.id); handoff(G); },
  d: G => { dodge(G); tackleBtn(G); }, s: G => { sprintOn(G, !me(G).sprint); switchNear(G); } };
function honest(G, o, mem) { if (G.over) return; const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random, b = G.ball, p = me(G);
  mem.cd = (mem.cd || 0) - 1 / 60; const go = (x, z) => { const dx = x - p.x, dz = z - p.z, d = Math.hypot(dx, dz); setStick(G, d > 0.3 ? dx / d : 0, d > 0.3 ? dz / d : 0); };
  if (G.phase === 'pick') { if (G.att === 1 || mem.cd > 0) return; mem.cd = react * 2; const ks = G.cfg.plays, st = G.cfg.style; let k2 = ks[(R() * ks.length) | 0];
    if (R() < acc) k2 = G.togo <= 3 ? 'dive' : st === 'blitz' && ks.includes('slant') ? 'slant' : st === 'deep' ? (ks.includes('curl') ? 'curl' : ks.includes('slant') ? 'slant' : 'dive') : st === 'wall' && ks.includes('slant') ? 'slant' : ks[(R() * ks.length) | 0];
    pickPlay(G, k2); snap(G); return; }
  if (G.phase !== 'live') { setStick(G, 0, 0); return; }
  if (G.att === 0) { if (b.own === p && p.role === 'QB') { setStick(G, 0, 0); if (mem.cd > 0) return; mem.cd = react * 0.5; if (PLAYS[G.play].kind === 'run') { if (G.liveT > 0.4) handoff(G); return; }
      let best = null, bo = 0; for (const q of eligible(G)) { const o2 = openness(G, q) + (q.z - G.los) * 0.05; if (o2 > bo) { bo = o2; best = q; } } if (best && G.liveT > 0.9 && (bo > 2.6 - (1 - acc) || G.liveT > 2.4)) throwTo(G, best.id); return; }
    if (b.own === p) { let ax = 0; for (const d of team(G, 1)) { const dx = p.x - d.x, dz = d.z - p.z, dd = Math.hypot(dx, dz); if (dd < 5 && dz > -1) ax += Math.sign(dx || 1) * (5 - dd); if (dd < 1.4 && p.dodgeCd <= 0 && R() < acc * 0.6) dodge(G); }
      go(clamp(p.x + ax * 2, -HW + 1, HW - 1), p.z + 5); if (p.st > 0.5 && !p.sprint && R() < 0.05) sprintOn(G, true); return; }
    setStick(G, 0, 0); return; }
  // defending: the defender nearest the ball, at the carrier (or where the pass is going)
  const t2 = b.own && b.own.t === 1 ? b.own : null, aim = t2 || (b.kind === 'air' ? { x: b.tx, z: b.tz } : null); if (!aim) { setStick(G, 0, 0); return; }
  if (mem.cd <= 0 && dist(p, aim) > 4 && R() < acc) { mem.cd = react; switchNear(G); } go(aim.x, aim.z - (t2 ? 0 : 0.5));
  if (t2 && dist(p, t2) < 1.1 && mem.cd <= 0) { mem.cd = react; tackleBtn(G); } }
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.score[0] = G.score[1] + 7; finish(G, true); }
