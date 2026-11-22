
// ===================== RULES: Eleven (game 34) =====================
// A full eleven-a-side football match, played sideways. You are the team in gold, always attacking to the right. On the ball
// you control whoever has it: the stick (your left thumb, anywhere on the left half) runs and dribbles; PASS plays it along the
// ground to the team-mate the stick points at; SHOOT shoots at goal (the stick up or down picks the corner); LOB lifts it over
// the defenders to a runner, or chips the keeper when you are close and he has come out. Without the ball you control the
// team-mate nearest it: SWITCH (the pass button) jumps to the nearest one, TACKLE stands in, SLIDE goes to ground (longer reach,
// but miss and you are on the floor). The match is two minutes; level at the end, golden goal; still level, play it again.
// Beat a team and the next one is better: quicker, sharper, harder to get past. Coins buy training that stays.
// World: metres. x along the pitch (our goal at -52.5, theirs at +52.5), z across it (the far touchline -34, near +34).
const RULES = [
  '<b>Turn your phone sideways.</b> You are gold, attacking to the right.',
  '<b>Left thumb:</b> run with the ball (or without it). Push it <b>all the way to sprint</b>: it tires him (the bar under him), and at a sprint the ball runs ahead of him, so a defender can nick it. The white ring shows who a pass would go to; your team-mates move to get free. <b>PASS</b> to the team-mate you point at, <b>SHOOT</b> at goal (point up or down for the corner), <b>LOB</b> over the top, or chip a keeper who has come out.',
  '<b>Defending:</b> SWITCH to the player nearest the ball, TACKLE, or SLIDE (longer, but miss it and you are down).',
  'Two minutes a match. Win to meet the next team: every team is better than the last. Level at the end: golden goal.',
  'Coins for goals and wins buy training that stays: pace, finishing, passing, a better keeper.',
];
const HL = 52.5, HW = 34, GW2 = 3.66, GH = 2.44, MATCH = 120;
const FORM = [[-50, 0], [-35, -21], [-38, -7], [-38, 7], [-35, 21], [-17, -23], [-20, -7], [-20, 7], [-17, 23], [-4, -7], [-3, 8]];
const ROLE = ['gk', 'df', 'df', 'df', 'df', 'md', 'md', 'md', 'md', 'fw', 'fw'];
const PFX = ['Riverside', 'Hillcrest', 'Northgate', 'Oakfield', 'Seaport', 'Redbrook', 'Stonebridge', 'Westmoor', 'Kingsway', 'Ashford', 'Lakeview', 'Ironside', 'Silverton', 'Eastwick', 'Blackrock', 'Highfield'];
const SFX = ['Rovers', 'United', 'Athletic', 'City', 'Wanderers', 'Albion', 'Rangers', 'FC', 'Town', 'Celtic'];
const KITS = [[0xd8302a, 0xffffff], [0x2a6ad8, 0xffffff], [0x2a9a4a, 0xffffff], [0xe8e8e8, 0x1a1a3a], [0x7a3ad0, 0xffe060], [0x1a1a1e, 0xd8b040], [0xf08a20, 0x1a1a1a], [0x8a1a2a, 0x8ad0ff], [0x1ab0b0, 0x1a1a1a], [0xff6aa0, 0x1a1a1a]];
const UPGRADES = [
  { id: 'pace', name: 'Sprint training', desc: 'Your whole team runs faster.', max: 3, cost: l => 25 + l * 30 },
  { id: 'finish', name: 'Finishing', desc: 'Your shots are more accurate.', max: 3, cost: l => 25 + l * 30 },
  { id: 'vision', name: 'Vision', desc: 'Passes are quicker and harder to cut out.', max: 3, cost: l => 20 + l * 25 },
  { id: 'keeper', name: 'New keeper', desc: 'Your keeper saves more.', max: 3, cost: l => 25 + l * 30 },
  { id: 'steel', name: 'Hard tackling', desc: 'Your tackles win the ball more often.', max: 2, cost: l => 25 + l * 30 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Sunday league'], [50, 'Academy'], [150, 'Pro'], [350, 'International'], [750, 'Captain'], [1500, 'Golden boot'], [3000, 'Legend']];
const DIVS = ['Sunday League', 'Division Three', 'Division Two', 'Division One', 'Premier League', 'Champions'], divOf = N => DIVS[Math.min(DIVS.length - 1, Math.floor((N - 1) / 5))];
const teamName = N => PFX[(N * 7 + 3) % PFX.length] + ' ' + SFX[(N * 3 + 1) % SFX.length];
const WEATHERS = ['golden', 'night', 'overcast', 'sunset', 'night', 'rain', 'golden', 'dusk'];
function weatherOf(N) { if (N <= 3) return ['golden', 'sunset', 'night'][N - 1]; const R = rng(N * 7741 + 5); R(); return WEATHERS[(R() * WEATHERS.length) | 0]; }

function makeCfg(N, help) {
  const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), e = easyOf(N), e2 = clamp((10 - N) / 9, 0, 1);      // e2: an easing that fades over the first ten levels (the other stops dead after the third)
  return { N, f, help: !!help, boss: N % 10 === 0,
    // them: the better the team, the quicker, sharper and braver
    oSpd: x(6.4, 8.6, 25) * (help ? 0.95 : 1) * (1 - e2 * 0.07),      /* 22 Nov 2026: the first levels are easier to score in (an ordinary player drew 0-0 one match in three; a clumsy one won one in three) */ oSkill: x(0.25, 0.9, 25), oThink: x(0.65, 0.2, 25), oPass: x(0.65, 0.97, 25), oShot: x(0.4, 0.9, 30), oKeep: x(0.46, 0.93, 34) * (1 - e2 * 0.1), oPress: x(1.0, 1.7, 25),
    oRange: x(18, 26, 30), oTackle: x(1.0, 3.0, 25) * (1 - e2 * 0.35),
    // us
    uSpd: 7.4 + 0.25 * upLv('pace') + (help ? 0.3 : 0) + e * 0.3, uShot: 0.55 + 0.08 * upLv('finish') + (help ? 0.06 : 0) + e2 * 0.16,      /* an aimed shot is surer in the first levels: it helps the player who looks, not the one who taps blind */ uPass: 0.8 + 0.05 * upLv('vision'), uKeep: 0.45 + 0.1 * upLv('keeper') + e * 0.1 + (help ? 0.08 : 0), uTackle: 0.62 + 0.08 * upLv('steel'), uAiTackle: 0.22,
    len: MATCH };
}
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, clock: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null,
    weather: weatherOf(N), foe: teamName(N), kit: KITS[N % KITS.length], score: [0, 0], P: [], ball: null, ctrl: 9, stick: { x: 0, z: 0 }, sprint: false, pause: 0, golden: false, shots: [0, 0], scorers: [], restartK: null, think: 0 };
  for (let t = 0; t < 2; t++) for (let i = 0; i < 11; i++) G.P.push({ t, i, role: ROLE[i], x: 0, z: 0, vx: 0, vz: 0, face: t ? Math.PI : 0, down: 0, cd: 0, dec: 0, plan: null, tk: 0 });
  G.T = [G.P.slice(0, 11), G.P.slice(11)]; G.rank = [[], []];
  G.ball = { x: 0, z: 0, y: 0, vx: 0, vz: 0, vy: 0, own: null, last: null, kind: null, to: null, from: null, air: 0, shot: null };
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else kickoff(G, 0, true);
  return G;
}
const team = (G, t) => G.T[t], me = G => G.P[G.ctrl], goalX = t => t === 0 ? HL : -HL;
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
// formation spots for team t, mirrored for them (they attack to the left)
function home(G, p) { const s = p.t ? -1 : 1, f = FORM[p.i], b = G.ball, att = b.own ? b.own.t === p.t : b.last ? b.last.t === p.t : false;
  if (p.role === 'gk') return [s * -50 + s * clamp((b.x * s + HL) * 0.03, 0, 3), clamp(b.z * 0.12, -3, 3)];
  const push = att ? 10 : -4, bx = b.x * s;
  let x = f[0] + clamp(bx * 0.5 + push, -20, p.role === 'fw' ? 40 : p.role === 'md' ? 32 : 22), z = f[1] * (att ? 1.05 : 0.85) + b.z * (p.role === 'df' ? 0.2 : 0.3);
  return [clamp(s * x, -HL + 2, HL - 2), clamp(z, -HW + 2, HW - 2)]; }
function kickoff(G, t, first) {      // team t kicks off from the centre spot
  const b = G.ball; Object.assign(b, { x: 0, z: 0, y: 0, vx: 0, vz: 0, vy: 0, own: null, last: null, kind: null, to: null, shot: null, air: 0 });
  for (const p of G.P) { const s = p.t ? -1 : 1, f = FORM[p.i]; p.x = s * Math.min(-1.5, f[0] * 0.9 - 4); p.z = f[1]; p.vx = p.vz = 0; p.down = 0; p.cd = 0; p.face = p.t ? Math.PI : 0; }
  const k = G.P[t * 11 + 9]; k.x = t ? 0.6 : -0.6; k.z = 0; give(G, k); G.pause = first ? 0 : 1.2; if (t === 0) G.ctrl = k.i; G.ev.push({ k: 'kickoff', t });
}
function give(G, p) { const b = G.ball; p.gotAt = G.t; b.own = p; b.last = p; b.kind = null; b.to = null; b.shot = null; b.y = 0; b.vx = b.vz = b.vy = 0; p.cd = 0; if (p.t === 0 && G.ctrl !== p.i) { G.ctrl = p.i; G.ev.push({ k: 'switch', auto: true }); } }
// ---------- the controls ----------
function setSprint(G, on) { G.sprint = !!on; }
function setStick(G, x, z) { const L = Math.hypot(x, z); G.stick = L > 1 ? { x: x / L, z: z / L } : { x, z }; }
const haveBall = G => G.ball.own && G.ball.own.t === 0;
function btnPass(G) { if (G.over || G.pause > 0) return false; if (haveBall(G) && G.ball.own === me(G)) return pass(G, me(G), G.stick, false); return switchNear(G); }
function btnShoot(G) { if (G.over || G.pause > 0) return false; if (haveBall(G) && G.ball.own === me(G)) return shoot(G, me(G), G.stick.z); return tackle(G, me(G), false); }
function btnLob(G) { if (G.over || G.pause > 0) return false; if (haveBall(G) && G.ball.own === me(G)) return lob(G, me(G), G.stick); return tackle(G, me(G), true); }
function switchNear(G) { const b = G.ball; let best = null, bd = 1e9; for (const p of team(G, 0)) { if (p.role === 'gk' || p.i === G.ctrl) continue; const d = dist(p, b); if (d < bd) { bd = d; best = p; } } if (!best) return false; G.ctrl = best.i; G.ev.push({ k: 'switch' }); lessonSee(G, 'switch'); return true; }
// ---------- the ball: passes, lobs, shots ----------
function bestTarget(G, p, dir, lofted) {
  const s = p.t ? -1 : 1, dl = Math.hypot(dir.x, dir.z), mates = team(G, p.t).filter(q => q !== p && q.role !== 'gk'); let best = null, bs = -1e9;
  for (const q of mates) { const dx = q.x - p.x, dz = q.z - p.z, d = Math.hypot(dx, dz); if (d < 4 || d > (lofted ? 50 : 38)) continue;
    let sc = -Math.abs(d - (lofted ? 26 : 14)) * 0.08 + dx * s * 0.04 - openness(G, q) * 0.0;
    if (dl > 0.3) { const cos = (dx * dir.x + dz * dir.z) / (d * dl); sc += cos * 3; if (cos < 0.3) sc -= 4; } else sc += dx * s * 0.05;
    sc += Math.min(6, openness(G, q)) * 0.35 - lineRisk(G, p, q) * (lofted ? 0.3 : 1.2);
    if (sc > bs) { bs = sc; best = q; } }
  return best;
}
function openness(G, q) { let m = 99; for (const o of team(G, 1 - q.t)) m = Math.min(m, dist(o, q)); return m; }
function lineRisk(G, p, q) { let r = 0; const dx = q.x - p.x, dz = q.z - p.z, L2 = dx * dx + dz * dz || 1; for (const o of team(G, 1 - p.t)) { const u = clamp(((o.x - p.x) * dx + (o.z - p.z) * dz) / L2, 0, 1), d = Math.hypot(p.x + dx * u - o.x, p.z + dz * u - o.z); if (d < 3) r += (3 - d); } return r; }
function release(G, p) { p.kick = 0.32; const b = G.ball; b.x = clamp(p.x + Math.cos(p.face) * 0.5, -HL + 0.3, HL - 0.3); b.z = p.z + Math.sin(p.face) * 0.5; b.own = null; b.last = p; b.from = p; p.cd = 0.35; b.air = 0; }
function pass(G, p, dir, ai) {
  const q = bestTarget(G, p, dir, false); if (!q) return false; const c = G.cfg, acc = p.t ? c.oPass : c.uPass, b = G.ball;
  const d = dist(p, q), sp = clamp(8 + d * 0.75, 10, 24) * (p.t ? 1 : 1 + 0.04 * upLv('vision')), tt = d / sp, tx = q.x + q.vx * tt * 0.8, tz = q.z + q.vz * tt * 0.8, err = (1 - acc) * 0.25 * (G.rnd() - 0.5) * 2;
  const a = Math.atan2(tz - p.z, tx - p.x) + err; release(G, p); b.vx = Math.cos(a) * sp; b.vz = Math.sin(a) * sp; b.vy = 0; b.y = 0.1; b.kind = 'pass'; b.to = q; G.ev.push({ k: 'pass', t: p.t });
  if (p.t === 0) { G.ctrl = q.i; lessonSee(G, 'pass'); } return true;
}
function lob(G, p, dir) {
  const s = p.t ? -1 : 1, gx = goalX(p.t), keeper = G.P[(1 - p.t) * 11], dg = Math.hypot(gx - p.x, p.z), b = G.ball;
  if (dg > 12 && dg < 26 && Math.abs(keeper.x - gx) > 6 && Math.abs(keeper.x - p.x) > 4) return shoot(G, p, dir.z, true);      // a chip over a keeper who has come out
  const q = bestTarget(G, p, dir, true); if (!q) return false;
  const lead = 4, tx = clamp(q.x + s * lead, -HL + 3, HL - 3), tz = clamp(q.z, -HW + 3, HW - 3), d = Math.hypot(tx - p.x, tz - p.z), T = clamp(d / 18, 0.9, 2.0), err = (1 - (p.t ? G.cfg.oPass : G.cfg.uPass)) * 3 * (G.rnd() - 0.5);
  release(G, p); b.vx = (tx - p.x) / T; b.vz = (tz + err - p.z) / T; b.vy = 9.81 * T / 2; b.y = 0.2; b.kind = 'lob'; b.to = q; G.ev.push({ k: 'lob', t: p.t }); if (p.t === 0) { G.ctrl = q.i; lessonSee(G, 'lob'); } return true;
}
function shoot(G, p, aimZ, chip) {
  const c = G.cfg, gx = goalX(p.t), b = G.ball, keeper = G.P[(1 - p.t) * 11], dg = Math.hypot(gx - p.x, p.z);
  // the corner: where the stick points, else the side away from the keeper
  let tz = Math.abs(aimZ) > 0.3 ? Math.sign(aimZ) * (GW2 - 0.6) : clamp(keeper.z * 0.7, -1.5, 1.5);      // no aim: it goes where the keeper is
  const skill = p.t ? c.oShot : c.uShot, press = Math.max(0, 3 - nearestFoe(G, p)) / 3, sdev = (0.04 + dg * 0.0055) * (1.4 - skill) * (1 + press * 0.8) * (G.t - (p.gotAt || 0) < 0.8 ? 2.2 : 1);      // a shot snatched the moment it arrives flies wild: take a touch
  const a = Math.atan2(tz - p.z, gx - p.x) + gauss(G.rnd) * sdev; release(G, p);
  if (chip) { const T = clamp(dg / 16, 0.8, 1.6), dx = (gx - p.x) * 1.04; b.vx = dx / T; b.vz = Math.tan(a) * dx / T; b.vy = (2.0 + 4.9 * T * T) / T; b.y = 0.2; b.kind = 'chip'; }
  else { const sp = 25 + skill * 5; b.vx = Math.cos(a) * sp; b.vz = Math.sin(a) * sp; b.vy = 1.5 + G.rnd() * 3 + dg * 0.04; b.y = 0.2; b.kind = 'shot'; }
  b.shot = { t: p.t, from: p, saveRoll: G.rnd(), dg }; G.shots[p.t]++; G.ev.push({ k: 'shoot', t: p.t, chip: !!chip }); lessonSee(G, 'shoot'); return true;
}
function gauss(R) { return Math.sqrt(-2 * Math.log(1 - R() * 0.9999)) * Math.cos(TAU * R()); }
function nearestFoe(G, p) { let m = 99; for (const o of team(G, 1 - p.t)) if (o.down <= 0) m = Math.min(m, dist(o, p)); return m; }
// tackles: standing (short reach) or a slide (long reach; miss and you are down for a second)
function tackle(G, p, slide) {
  const b = G.ball; if (p.down > 0 || p.tk > 0) return false; p.tk = slide ? 1.0 : 0.45; const o = b.own; G.ev.push({ k: slide ? 'slide' : 'tackle', t: p.t });
  if (slide) { const L = Math.hypot(p.vx, p.vz) || 1; p.vx = p.vx / L * 9; p.vz = p.vz / L * 9; }
  if (!o || o.t === p.t) { if (slide) p.down = 0.9; return false; }
  const d = Math.min(dist(p, o), Math.hypot(p.x - b.x, p.z - b.z) + 0.3), reach = slide ? 3.0 : 1.7, skill = p.t ? G.cfg.oSkill : G.cfg.uTackle, dodge = o.t ? G.cfg.oSkill : 0.5;
  if (d < reach && G.rnd() < clamp(0.45 + skill * 0.5 - dodge * 0.35 + (slide ? 0.1 : 0) - (d / reach) * 0.25, 0.05, 0.95)) { o.down = slide ? 0.7 : 0.35; give(G, p); G.ev.push({ k: 'won', t: p.t }); lessonSee(G, 'tackle'); return true; }
  if (slide) p.down = 1.0; else p.down = 0.25; return false;
}
// ---------- how a footballer moves: weight, turning, sprinting, getting tired ----------
// Speed builds up (a burst, then slower to the top), a hard stop takes a stride or two, and the faster he runs the wider he
// turns: a sharp change of direction makes him slow down and plant first. Sprinting drains stamina; a tired man is slower
// at the top and gets his breath back jogging, faster walking. With the ball at a sprint he pushes it ahead.
function move(G, p, tx, tz, sp, sprint, jog, top, dt) {
  const dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz), withBall = G.ball.own === p;
  if (p.st == null) p.st = 1;
  sprint = sprint && p.st > 0.04 && p.down <= 0;
  let vd = d < 0.35 || p.down > 0 ? 0 : sprint ? top * (0.62 + 0.38 * p.st) * (withBall ? 0.9 : 1) : Math.min(sp, jog) * (withBall ? 0.92 : 1);
  if (d < 2.5 && !sprint) vd = Math.min(vd, d * 2.2);      // ease in to the spot
  let v = Math.hypot(p.vx, p.vz), h = v > 0.2 ? Math.atan2(p.vz, p.vx) : p.face; const hd = d > 0.01 ? Math.atan2(dz, dx) : h, da = Math.atan2(Math.sin(hd - h), Math.cos(hd - h));
  if (Math.abs(da) > 1.7 && v > 2.2) vd = Math.min(vd, 1.2);      // a sharp turn: plant first
  const turn = (v < 1.2 ? 14 : 8.5 / (1 + 0.32 * v)) * (withBall ? 0.85 : 1);
  if (vd > 0.05 || v > 0.2) h += clamp(da, -turn * dt, turn * dt);
  if (p.down > 0) v = Math.max(0, v - 10 * dt);
  else if (vd > v) v = Math.min(vd, v + (v < jog * 0.7 ? 7.5 : v < jog ? 4.5 : 2.6) * dt);      // a burst off the mark, then slower to the top
  else v = Math.max(vd, v - 9 * dt);
  p.vx = Math.cos(h) * v; p.vz = Math.sin(h) * v; p.x = clamp(p.x + p.vx * dt, -HL - 3, HL + 3); p.z = clamp(p.z + p.vz * dt, -HW - 2, HW + 2);
  if (v > 0.3) p.face = h; p.spr = sprint && v > jog * 0.95; p.turnRate = clamp(da, -turn, turn);
  p.st = clamp(p.st + (p.spr ? -0.085 : v > jog * 0.6 ? 0.025 : 0.06) * dt, 0, 1);
  if (withBall) p.touch = (p.touch || 0) + v * dt / (p.spr ? 2.6 : 1.5);
}
// ---------- the match, step by step ----------
function step(G, dt) {
  if (G.over) return; G.t += dt; const c = G.cfg, b = G.ball;
  if (G.lessonWait) { G.lessonWait -= dt; if (G.lessonWait <= 0) { G.lessonWait = 0; if (G.lessonEnd) { G.lessonEnd = false; G.score = [0, 0]; G.clock = 0; G.shots = [0, 0]; kickoff(G, 0, true); } else lessonSetup(G); } return; }
  if (G.pause > 0) { G.pause -= dt; return; }
  if (!G.lesson) { G.clock += dt; if (G.clock >= c.len && !G.golden) { if (G.score[0] !== G.score[1]) return finish(G, G.score[0] > G.score[1]); G.golden = true; G.ev.push({ k: 'golden' }); } if (G.golden && G.clock >= c.len + 60) return finish(G, false, 'draw'); }
  for (const p of G.P) { if (p.down > 0) p.down -= dt; if (p.cd > 0) p.cd -= dt; if (p.tk > 0) p.tk -= dt; if (p.kick > 0) p.kick -= dt; }
  // movement: you, then everybody else
  G.think -= dt; const thinkNow = G.think <= 0; if (thinkNow) { G.think = 0.1; const o = b.own || b; for (let t = 0; t < 2; t++) { const L = G.rank[t]; L.length = 0; for (const q of G.T[t]) if (q.role !== 'gk' && !(q.t === 0 && q.i === G.ctrl)) L.push(q); L.sort((a, q) => ((a.x - o.x) ** 2 + (a.z - o.z) ** 2) - ((q.x - o.x) ** 2 + (q.z - o.z) ** 2)); } }
  for (const p of G.P) { let tx, tz, sp, sprint = false; const top = p.t ? c.oSpd : c.uSpd, jog = top * 0.66;
    if (p.t === 0 && p.i === G.ctrl) { const s2 = G.stick, L = Math.hypot(s2.x, s2.z); tx = p.x + s2.x * 5; tz = p.z + s2.z * 5;
      if (L < 0.1) { if (!b.own && b.to === p) { [tx, tz, sp] = brain(G, p); sprint = G.sprint; } else sp = 0; } else { sprint = G.sprint; sp = sprint ? top : jog * Math.min(1, L * 1.25); } }      // thumb off: he runs on to a ball meant for him
    else { if (thinkNow || !p.plan) p.plan = brain(G, p); [tx, tz, sp] = p.plan; sprint = sp > top * 0.84; if (!sprint) sp = Math.min(sp, jog); }
    move(G, p, tx, tz, sp, sprint, jog, top, dt); }
  // bodies do not pass through each other: two men closer than a shoulder's width are eased apart
  for (let i = 0; i < 22; i++) { const p = G.P[i]; for (let j = i + 1; j < 22; j++) { const q = G.P[j], dx = q.x - p.x, dz = q.z - p.z, d2 = dx * dx + dz * dz; if (d2 < 0.49 && d2 > 1e-6) { const d = Math.sqrt(d2), push = (0.7 - d) * 0.5 / d; p.x -= dx * push; p.z -= dz * push; q.x += dx * push; q.z += dz * push; } } }
  // the AI on the ball decides; their defenders try to win it
  if (b.own && !(b.own.t === 0 && b.own.i === G.ctrl)) { const p = b.own; p.dec -= dt; if (p.dec <= 0) { p.dec = (p.t ? c.oThink : 0.35) * (0.7 + G.rnd() * 0.6); decide(G, p); } }
  if (b.own) { const o = b.own; for (const p of team(G, 1 - o.t)) { if (p.down > 0 || p.role === 'gk') continue; const d = dist(p, o); if (d < 1.3) { const rate = p.t ? (G.lesson ? 0 : c.oTackle) : (p.i === G.ctrl ? 0 : c.uAiTackle); if (rate && G.rnd() < rate * dt) tackle(G, p, false); } } }
  // the ball
  if (b.own) { const o = b.own, ph = (o.touch || 0) % 1, lead = o.spr ? 0.8 + 1.7 * Math.sin(ph * Math.PI) : 0.6 + 0.25 * Math.sin(ph * Math.PI);      // touches: at a sprint the ball runs a couple of metres ahead
    b.x = clamp(o.x + Math.cos(o.face) * lead, -HL + 0.3, HL - 0.3); b.z = o.z + Math.sin(o.face) * lead; b.y = 0; b.vx = o.vx; b.vz = o.vz; b.vy = 0; b.lead = lead;
    if (lead > 1.4) for (const q of team(G, 1 - o.t)) { if (q.down > 0 || q.role === 'gk' || (q.t === 0 && q.i === G.ctrl)) continue; if (Math.hypot(q.x - b.x, q.z - b.z) < 0.9 && G.rnd() < (q.t ? 3 + G.cfg.oSkill * 4 : 2) * dt) { give(G, q); G.ev.push({ k: 'won', t: q.t }); break; } } }
  else { b.air += dt; b.x += b.vx * dt; b.z += b.vz * dt; b.y += b.vy * dt;
    if (b.y > 0) b.vy -= 9.81 * dt; if (b.y <= 0) { b.y = 0; if (b.vy < -2) { b.vy = -b.vy * 0.45; } else b.vy = 0; }
    if (b.y < 0.05) { const f = Math.exp(-0.6 * dt); b.vx *= f; b.vz *= f; const sp = Math.hypot(b.vx, b.vz); if (sp < 0.6) { const k3 = Math.max(0, sp - 2.5 * dt) / (sp || 1); b.vx *= k3; b.vz *= k3; } }
    if (b.shot) keeperWatch(G);
    if (!b.own) pickup(G); }
  // goals and the lines
  if (!b.own) { const gx = b.x > 0 ? HL : -HL;
    if (Math.abs(b.x) > HL) { if (Math.abs(b.z) < GW2 && b.y < GH) { if (b.kind === 'pass' || b.kind === 'lob') { const gk = G.P[(b.x > 0 ? 1 : 0) * 11]; gk.x = Math.sign(b.x) * (HL - 1); gk.z = clamp(b.z, -2, 2); gk.face = b.x > 0 ? Math.PI : 0; give(G, gk); gk.dec = 0.8; G.ev.push({ k: 'save', t: gk.t, hold: true }); return; } goal(G, b.x > 0 ? 0 : 1); return; } outOfPlay(G, 'end'); return; }      // a pass that runs to the goal is the keeper's
    if (Math.abs(b.z) > HW) { outOfPlay(G, 'side'); return; } }
  else if (Math.abs(b.own.x) > HL + 0.5) b.own.x = Math.sign(b.own.x) * HL;
  if (G.lesson) lessonTick(G, dt);
}
// someone takes control of a loose ball
function pickup(G) {
  const b = G.ball; if (b.y > 2.0) return; let best = null, bd = 1e9;
  for (const p of G.P) { if (p.cd > 0 || p.down > 0 || p.role === 'gk' && b.shot) continue; const d = Math.hypot(p.x - b.x, p.z - b.z), reach = b.to === p ? 1.6 : 1.0; if (d > reach || d >= bd || (b.y > 1.2 && b.to !== p)) continue;
    const sp = Math.hypot(b.vx, b.vz), meant = b.to === p, foe = b.last && b.last.t !== p.t;
    let ch = meant ? 0.97 : sp < 4 ? 0.9 : foe ? clamp((p.t ? 0.25 + G.cfg.oSkill * 0.4 : 0.3) * (1 - sp / 30) * (b.kind === 'lob' ? 0.5 : 1), 0.02, 0.6) : 0.6;
    if (G.rnd() < ch * (b.kind === 'shot' ? 0.4 : 1)) { bd = d; best = p; } }
  if (best) { const intercept = b.last && b.last.t !== best.t && (b.kind === 'pass' || b.kind === 'lob'); if (best.t === 0 && b.kind === 'lob' && !intercept) lessonSee(G, 'lobbed'); give(G, best); if (intercept) G.ev.push({ k: 'intercept', t: best.t }); }
}
// the keeper and a shot: he moves across; if he gets there in time, he saves (catches or palms it wide)
function keeperWatch(G) {
  const b = G.ball, s = b.shot, kp = G.P[(1 - s.t) * 11], gx = goalX(s.t); if (s.done) return;
  if (b.y < 2 && Math.hypot(kp.x - b.x, kp.z - b.z) < 0.7) { s.saveRoll = 0; s.dg = 99; }      // straight at him
  const toLine = (gx - b.x) / (b.vx || 1e-6); if (toLine < 0 || toLine > 0.25) { if (s.saveRoll === 0) { kp.face = gx > 0 ? Math.PI : 0; give(G, kp); kp.dec = 0.8; G.ev.push({ k: 'save', t: kp.t, hold: true }); } return; } s.done = true;
  const zAt = b.z + b.vz * toLine, yAt = Math.max(0, b.y + b.vy * toLine - 4.9 * toLine * toLine), onTarget = Math.abs(zAt) < GW2 && yAt < GH && yAt > -0.5;
  if (!onTarget) return;
  const skill = (s.t === 0 ? G.cfg.oKeep : G.cfg.uKeep) * (G.lesson ? 0.2 : 1), reach = 1.2 + skill * 1.6 - (b.kind === 'chip' ? clamp(Math.abs(kp.x - gx) - 3, 0, 4) : 0), gap = Math.abs(zAt - kp.z) - (yAt > 1.6 ? 0.3 : 0), sp = Math.hypot(b.vx, b.vz);
  if (s.dg > 30) { kp.x = gx - Math.sign(gx) * 0.6; kp.z = zAt; kp.face = gx > 0 ? Math.PI : 0; G.ev.push({ k: 'save', t: kp.t, hold: true }); give(G, kp); kp.dec = 0.8; return; }      // from that far, an easy catch
  const far = clamp((s.dg - 12) * 0.045, 0, 0.7), p = gap < reach + far * 2 ? clamp(0.55 + skill * 0.45 - gap / (reach + far * 2) * 0.45 - (sp - 24) * 0.015 + far, 0.1, 0.98) : 0.03;      // a shot from far gives him time
  if (s.saveRoll < p) { const hold = sp < 22 || s.saveRoll < p * 0.5; kp.x = gx - Math.sign(gx) * 0.6; kp.z = zAt; G.ev.push({ k: 'save', t: kp.t, hold });
    if (hold) { kp.face = gx > 0 ? Math.PI : 0; give(G, kp); kp.dec = 0.8; } else { b.x = gx - Math.sign(gx) * 0.8; b.z = zAt; b.vx = -Math.sign(gx) * 6; b.vz = Math.sign(zAt || 1) * 8; b.vy = 3; b.shot = null; b.last = kp; b.kind = null; } }
}
function goal(G, t) {
  G.score[t]++; G.scorers.push({ t, min: Math.min(90, Math.round(G.clock / G.cfg.len * 90)) }); G.ev.push({ k: 'goal', t }); if (t === 0) lessonSee(G, 'goal');
  if (G.golden && !G.lesson) return finish(G, t === 0);
  if (G.lesson) { G.lessonWait = 1.6; return; }
  kickoff(G, 1 - t, false); G.pause = 2.0;
}
function outOfPlay(G, kind) {
  const b = G.ball, last = b.last ? b.last.t : 0, to = 1 - last; G.ev.push({ k: 'out', kind });
  if (G.lesson) { G.lessonWait = 0.8; return; }
  let x = clamp(b.x, -HL + 1, HL - 1), z = clamp(b.z, -HW + 0.5, HW - 0.5);
  if (kind === 'end') { const defEnd = (b.x > 0 ? 1 : 0); if (to === defEnd) { const gk = G.P[to * 11]; gk.x = (to ? 1 : -1) * (HL - 6); gk.z = 0; give(G, gk); G.pause = 0.8; return; } x = Math.sign(b.x) * (HL - 0.5); z = Math.sign(b.z || 1) * (HW - 0.5); }
  let best = null, bd = 1e9; for (const p of team(G, to)) { if (p.role === 'gk') continue; const d = Math.hypot(p.x - x, p.z - z); if (d < bd) { bd = d; best = p; } }
  best.x = x; best.z = z; best.vx = best.vz = 0; give(G, best); best.dec = 0.5; G.pause = 0.8;
}
// ---------- the brains (everyone but you) ----------
// returns [target x, target z, speed]
function brain(G, p) {
  const c = G.cfg, b = G.ball, s = p.t ? -1 : 1, spd = (p.t ? c.oSpd : c.uSpd) * (G.lesson && p.t ? 0.45 : 1), own = b.own, att = own ? own.t === p.t : b.last ? b.last.t === p.t : false;
  if (own === p) { const gx = goalX(p.t), pl = p.carry || [gx, clamp(p.z * 0.6, -12, 12)]; return [pl[0], pl[1], nearestFoe(G, p) > 7 && p.t && c.oPress > 1.15 ? spd : spd * 0.7]; }
  if (p.role === 'gk') { const gx = -goalX(p.t), danger = own && own.t !== p.t && Math.hypot(own.x - gx, own.z) < 16; if (danger && Math.hypot(own.x - gx, own.z) < 11) return [gx * 0.97 + (own.x - gx) * 0.35, own.z * 0.5, spd * 0.9];
    return [gx - Math.sign(gx) * 1.2, clamp(b.z * 0.18, -2.5, 2.5), spd * 0.6]; }
  // a ball in flight meant for me: go and meet it
  if (!own && b.to === p) { const T = b.y > 0.3 || b.vy > 0 ? (b.vy + Math.sqrt(b.vy * b.vy + 19.6 * b.y)) / 9.81 : 0.3; return [b.x + b.vx * T, b.z + b.vz * T, spd]; }      // run to where it will come down
  // a loose ball: the nearest of each team goes for it
  if (!own) { const near = G.rank[p.t][0];
    if (near === p && (b.kind !== 'pass' || b.last.t !== p.t)) return [b.x + b.vx * 0.3, b.z + b.vz * 0.3, Math.hypot(b.x - p.x, b.z - p.z) > 4 ? spd : spd * 0.8]; }
  const h = home(G, p);
  if (att && own && !(G.lesson && p.t) && (p.t === 0 || c.N >= 8)) { const q = support(G, p, own, h); /* (the other team learns it from level 8) */ return [q[0], q[1], q[2] ? spd : spd * 0.8]; }
  if (att) return [h[0], h[1], spd * 0.75];
  // defending: the nearest closes the ball down (them: as hard as their level presses), the next covers, the rest hold the shape
  if (own) { const rank = G.rank[p.t].indexOf(p);
    if (rank === 0) return [own.x + own.vx * 0.2 + (p.t ? 0 : -3), own.z + own.vz * 0.2, p.t ? (dist(p, own) > 6 && c.oPress > 1.1 ? spd : spd * 0.7) : spd * 0.6];      // your team-mates only shadow: winning it is your job
    if (rank === 1 && p.t === 1 && c.oPress > 1.2) return [own.x + own.vx * 0.3 + s * -3, own.z, spd * 0.85];
    if (rank === 1) { const gx = -goalX(p.t); return [own.x + (gx - own.x) * 0.25, own.z * 0.75, spd * 0.8]; } }
  return [h[0], h[1], spd * 0.7];
}
// GETTING OPEN (his note, 22 Nov 2026: "the players' positioning is horrible... they don't position themselves in a place that
// you can give them a pass"). A team-mate without the ball does not stand on his formation spot: every third of a second he
// looks at a handful of places (round his spot, round the man on the ball, and in behind for a forward) and goes to the best:
// clear of markers, with nobody standing in the line of the pass, a sensible pass away (closer when the man on the ball is
// being pressed), ahead of the ball if he is a forward or midfielder, onside, not on top of another team-mate, and not so far
// from his spot that the team loses its shape. Returns [x, z, run?].
function support(G, p, own, h) { if (p.sup && p.sup.own === own && G.t - p.sup.t < 0.33) return p.sup.r;
  const s = p.t ? -1 : 1, foes = team(G, 1 - p.t), mates = team(G, p.t), pressed = nearestFoe(G, own) < 4.5, rk = G.rank[p.t].indexOf(p), near = rk >= 0 && rk <= 3;
  let line = 0; for (const o of foes) if (o.role !== 'gk') line = Math.max(line, o.x * s); line = Math.max(line, own.x * s) - 0.6;      // the last defender (or the ball): no further forward than this
  const cand = [[h[0], h[1]]]; for (let i = 0; i < 6; i++) { const a = i * 1.047 + p.i; cand.push([h[0] + Math.cos(a) * 7, h[1] + Math.sin(a) * 6]); }
  if (near) for (const a of [0.7, -0.7, 1.6, -1.6, 2.5, -2.5]) { const r2 = pressed ? 9 : 13; cand.push([own.x + s * Math.cos(a) * r2, own.z + Math.sin(a) * r2]); }
  if (p.role !== 'df') for (const dz of [-9, 0, 9]) cand.push([s * Math.min(line, own.x * s + (p.role === 'fw' ? 24 : 15)), clamp(p.z + dz, -HW + 3, HW - 3)]);
  if (p.sup) cand.push([p.sup.r[0], p.sup.r[1]]);
  let best = cand[0], bs = -1e9;
  for (const c of cand) { const cx = clamp(c[0], -HL + 3, HL - 3), cz = clamp(c[1], -HW + 3, HW - 3), q = { x: cx, z: cz }; if (cx * s > line + 0.6) continue;
    let open = 99; for (const o of foes) open = Math.min(open, Math.hypot(o.x - cx, o.z - cz));
    const d = Math.hypot(cx - own.x, cz - own.z), fwd = (cx - own.x) * s;
    let sc = Math.min(open, 9) * 1.0 - lineRisk(G, own, q) * 2.2 - Math.hypot(cx - h[0], cz - h[1]) * (near ? 0.07 : 0.14);
    sc += clamp(fwd, -10, 25) * (p.role === 'fw' ? 0.11 : p.role === 'md' ? 0.06 : 0);
    sc -= Math.abs(d - (pressed && near ? 10 : 16)) * (pressed && near ? 0.22 : 0.06); if (d < 5) sc -= 4; if (d > 36) sc -= 3;
    for (const m of mates) if (m !== p && m.role !== 'gk') { const mx = m.sup && m !== own ? m.sup.r[0] : m.x, mz = m.sup && m !== own ? m.sup.r[1] : m.z, dm = Math.hypot(mx - cx, mz - cz); if (dm < 9) sc -= (9 - dm) * 0.5; }
    if (p.sup) sc -= Math.hypot(cx - p.sup.r[0], cz - p.sup.r[1]) * 0.05;
    if (sc > bs) { bs = sc; best = [cx, cz]; } }
  const r0 = [best[0], best[1], Math.hypot(best[0] - p.x, best[1] - p.z) > 7]; p.sup = { t: G.t + (p.i % 5) * 0.02, own, r: r0 }; return r0; }
// the AI on the ball (them, and your team-mates for the moment before you take over)
function decide(G, p) {
  const c = G.cfg, gx = goalX(p.t), dg = Math.hypot(gx - p.x, p.z), nf = nearestFoe(G, p), R = G.rnd, s = p.t ? -1 : 1;
  if (G.lesson && p.t === 1) { p.carry = [p.x + s * 6, p.z * 0.8]; return; }      // in a lesson they only stroll forward
  if (p.role === 'gk') { const q = bestTarget(G, p, { x: s, z: 0 }, false); if (q) pass(G, p, { x: q.x - p.x, z: q.z - p.z }, true); return; }
  const range = p.t ? c.oRange : 22;
  if (dg < range && Math.abs(p.z) < 18 && (nf > 1.4 || dg < 14 || R() < 0.4)) { shoot(G, p, (R() - 0.5) * 2, false); return; }
  if (dg < range + 12 && nf > 1.5) { p.carry = [gx, p.z * 0.5]; return; }      // close: straight at goal
  const fwd = { x: s, z: 0 }, q = bestTarget(G, p, fwd, false), lq = bestTarget(G, p, fwd, true);
  if (nf < 3 && q && R() < 0.75) { pass(G, p, { x: q.x - p.x, z: q.z - p.z }, true); return; }
  if (lq && (lq.x - p.x) * s > 18 && openness(G, lq) > 4 && R() < 0.15) { lob(G, p, { x: lq.x - p.x, z: lq.z - p.z }); return; }
  if (q && (q.x - p.x) * s > 8 && openness(G, q) > 5 && R() < 0.3) { pass(G, p, { x: q.x - p.x, z: q.z - p.z }, true); return; }
  // dribble: towards goal, away from the nearest defender
  let ax = 0, az = 0; for (const o of team(G, 1 - p.t)) { const d = dist(o, p); if (d < 8) { ax += (p.x - o.x) / (d * d); az += (p.z - o.z) / (d * d); } }
  p.carry = [p.x + s * 8 + ax * 6, clamp(p.z + az * 10 + (-p.z) * 0.15, -HW + 4, HW - 4)];
}
function finish(G, win, why) {
  G.over = win ? 'won' : 'lost'; const gd = G.score[0] - G.score[1], stars = win ? (gd >= 3 ? 3 : gd >= 2 ? 2 : 1) : 0;
  G.res = { win, why, stars, a: G.score[0], b: G.score[1], coins: G.score[0] * 3 + (win ? 6 + Math.ceil(G.N / 2) : 0), time: G.t };
  G.ev.push({ k: win ? 'won' : 'lost', why }); return true;
}
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'pass', title: 'PASS', how: 'Run with your LEFT thumb. Point at a team-mate (a white ring shows who) and tap PASS. Three passes.', need: 3 },
    { id: 'goal', title: 'SHOOT', how: 'Run at goal and tap SHOOT. Point up or down to pick the corner. Score once.', need: 1 }],
  2: [{ id: 'tackle', title: 'WIN IT BACK', how: 'Without the ball, run at the man with it and tap TACKLE when you are close (SLIDE reaches further). Win it twice.', need: 2 }],
  3: [{ id: 'lob', title: 'OVER THE TOP', how: 'Tap LOB to lift the ball over the defenders to a runner. Two lobs that reach a team-mate.', need: 2 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonSetup(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonSetup(G) {      // a quiet practice: their players stroll, nothing counts on the scoreboard
  const st = lessonNow(G); kickoff(G, st.id === 'tackle' ? 1 : 0, true); G.pause = 0.3; G.lessonGive = st.id;
  if (st.id === 'tackle') { const o = G.ball.own; o.x = 8; o.z = 0; const m = G.P[9]; m.x = 2; m.z = 0; G.ctrl = 9; }
  if (st.id === 'lob') { const m = G.P[6]; m.x = -8; m.z = 0; G.P[9].x = 16; G.P[9].z = -7; G.P[10].x = 16; G.P[10].z = 8; give(G, m); }
}
function lessonTick(G, dt) { const st = lessonNow(G); if (!st) return;
  if (st.id === 'tackle' && G.ball.own && G.ball.own.t === 0 && G.lessonTook) { G.lessonTook = false; lessonCount(G); if (G.lesson) G.lessonWait = 1.0; }
  if (G.ball.own && G.ball.own.t === 1 && st.id !== 'tackle' && G.t - (G.lostAt || 0) > 1) { G.lostAt = G.t; G.ev.push({ k: 'lessonmiss', how: st.how }); G.lessonWait = 1.0; } }
function lessonSee(G, what) { const st = lessonNow(G); if (!st) return;
  if (what === 'pass' && st.id === 'pass') lessonCount(G);
  if (what === 'goal' && st.id === 'goal') lessonCount(G);
  if (what === 'lobbed' && st.id === 'lob') lessonCount(G);
  if (what === 'tackle' && st.id === 'tackle') G.lessonTook = true; }
function lessonCount(G) { const D = G.lesson, st = lessonNow(G); D.n++; if (D.n < st.need) { G.ev.push({ k: 'lessonok', n: D.n, need: st.need }); return; }
  D.i++; D.n = 0; if (D.i >= D.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.lessonEnd = true; G.lessonWait = 1.4; } else { G.ev.push({ k: 'lessonnext' }); G.lessonWait = 1.4; } }
// ---------- for the robots ----------
// BLIND: two thumbs that do not look: hold the stick some way (or let go), tap PASS, SHOOT or LOB
const BLIND = { m: G => { const R = Math.random; setSprint(G, R() < 0.5); if (R() < 0.2) setStick(G, 0, 0); else { const a = R() * TAU; setStick(G, Math.cos(a), Math.sin(a)); } }, p: G => btnPass(G), k: G => btnShoot(G), l: G => btnLob(G) };
// a player who looks: plays your man with the team's own football brain, a moment late and a little off (react, acc)
function honest(G, o, mem) {
  const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random, b = G.ball, p = me(G), c = G.cfg;
  if (G.over || G.pause > 0 || G.lessonWait) { setStick(G, 0, 0); setSprint(G, false); return; }
  if (G.t < (mem.next || 0)) return; mem.next = G.t + 0.08 + react * 0.4;
  if (b.own === p) {      // on the ball
    if (p.role === 'gk') { const q = bestTarget(G, p, { x: 1, z: 0 }, false); if (q) pass(G, p, { x: q.x - p.x, z: q.z - p.z }); return; }
    const gx = HL, dg = Math.hypot(gx - p.x, p.z), nf = nearestFoe(G, p), st = lessonNow(G);
    if (st && st.id === 'pass') { const q = bestTarget(G, p, { x: 1, z: 0 }, false); if (q) { pass(G, p, { x: q.x - p.x, z: q.z - p.z }); return; } }
    if (st && st.id === 'lob') { lob(G, p, { x: 1, z: 0 }); return; }
    const keeper = G.P[11];
    if (dg > 12 && dg < 24 && Math.abs(keeper.x - gx) > 6 && Math.abs(keeper.x - p.x) > 4 && R() < 0.6) { lob(G, p, { x: 1, z: (R() - 0.5) * 2 }); return; }
    if (dg < 19 && Math.abs(p.z) < 15 && (nf > 1.6 || dg < 11) && G.t - (p.gotAt || 0) > 0.8) { const kz = keeper.z, aim = (kz > p.z * 0.1 ? -1 : 1) * (R() < acc ? 1 : -1); shoot(G, p, aim); return; }
    if (nf < 2.6 || (nf < 4 && R() < 0.3)) { let q = bestTarget(G, p, { x: 1, z: 0 }, false); if (q && R() > acc) q = null; if (q) { pass(G, p, { x: q.x - p.x, z: q.z - p.z }); return; } if (R() < 0.3) { const lq = bestTarget(G, p, { x: 1, z: 0 }, true); if (lq) { lob(G, p, { x: lq.x - p.x, z: lq.z - p.z }); return; } } }
    let ax = 0, az = 0; for (const f of team(G, 1)) { const d = dist(f, p); if (d < 7 && f.x > p.x - 2) { ax += (p.x - f.x) / (d * d); az += (p.z - f.z) / (d * d); } }
    const tx = 1 + ax * 3, tz = az * 6 - p.z * 0.03 * (1 + (R() - 0.5) * (1 - acc)); setSprint(G, nf > 4.5 && p.st > 0.35 && dg > 20); setStick(G, tx, tz); return; }
  if (b.own && b.own.t === 1) {      // defending: be the nearest man, then go and win it
    const o2 = b.own; let near = null, nd = 1e9; for (const q of team(G, 0)) { if (q.role === 'gk') continue; const d = dist(q, o2); if (d < nd) { nd = d; near = q; } }
    if (near && near !== p && dist(p, o2) > nd + 4) { switchNear(G); return; }
    const d = dist(p, o2), gx = -HL; if (d < (R() < 0.3 ? 2.6 : 1.5) && R() < acc) { tackle(G, p, d > 1.6); return; }
    const tx = o2.x + o2.vx * 0.25 + (gx - o2.x) * 0.04, tz = o2.z + o2.vz * 0.25; setSprint(G, d > 5 && p.st > 0.2); setStick(G, tx - p.x, tz - p.z); return; }
  if (!b.own) { const d = Math.hypot(b.x - p.x, b.z - p.z); let near = null, nd = 1e9; for (const q of team(G, 0)) { if (q.role === 'gk') continue; const dd = Math.hypot(q.x - b.x, q.z - b.z); if (dd < nd) { nd = dd; near = q; } }
    if (b.to && b.to.t === 0 && b.to !== p) { G.ctrl = b.to.i; return; } if (b.to === p) { setStick(G, 0, 0); setSprint(G, d > 8); return; } if (near && near !== p && d > nd + 5) { switchNear(G); return; }
    setSprint(G, d > 6 && p.st > 0.2); setStick(G, b.x + b.vx * 0.3 - p.x, b.z + b.vz * 0.3 - p.z); return; }
  setStick(G, 0, 0);
}
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.score[0] = G.score[1] + 1; finish(G, true); }
