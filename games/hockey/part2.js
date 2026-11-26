// ===================== THE RULES: Ice Hockey (his idea 16, 20 Nov 2026) =====================
// Three skaters and a goalkeeper a side on a compact rink, played sideways: you are blue, attacking to the right. With the puck
// you control whoever has it: the stick (left thumb, anywhere on the left) skates; PASS slides it to the team-mate the stick
// points at (off the boards when the straight lane is blocked); SHOOT taps a quick wrist shot or, held, winds up a slap shot
// (harder, but a defender can poke it away while you wind up); the stick up or down picks the corner. Without the puck you
// control the team-mate nearest it: SWITCH (the pass button) jumps to another, POKE (the shoot button) stabs at the puck,
// BURST (both) gives a short burst of speed. Saves often bounce back into play. Two-minute matches, golden-goal overtime;
// or first to three goals. Every goal starts again with a faceoff: tap the moment the puck drops.
// World: metres. x along the rink (our goal at -16.5, theirs at +16.5), z across it (the far boards -10, near +10).
const RULES = [
  '<b>Turn your phone sideways.</b> You are blue, attacking to the right.',
  '<b>Left thumb</b> anywhere on the left: skate. <b>BURST</b> for a short dash.',
  '<b>PASS</b> to the team-mate you point at. <b>SHOOT</b>: tap for a quick shot, <b>hold</b> for a slap shot. Point up or down for the corner.',
  '<b>One-timer</b>: tap SHOOT while a pass is coming to you (or the moment it arrives): a fast shot the goalie hardly sees.',
  'Without the puck: <b>SWITCH</b> to the nearest team-mate, <b>POKE</b> to steal it.',
  'Faceoff: <b>tap</b> PASS or SHOOT the moment the puck drops (not before).',
  'Assists, interceptions and passing moves earn extra coins.',
];
const HL = 20, HW = 10, CR = 6, GX = 16.5, GW2 = 0.92, GD = 1.1, MATCH = 120;
const FORM = [[-GX + 0.8, 0], [-8, 0], [-3, -4.5], [-2, 4.5]];      // goalie, defender, two forwards
const ROLE = ['g', 'd', 'f', 'f'];
const TEAMS = ['Polar Bears', 'Northern Lights', 'Ice Wolves', 'Glacier', 'Blizzard', 'Frostbite', 'Avalanche', 'Snow Owls', 'Harbour Seals', 'Iron Pikes', 'Comets', 'Thunder'];
const KITS = [[0xd8302a, 0xffffff], [0x2a9a4a, 0xffffff], [0xf0b020, 0x1a1a1a], [0x7a3ad0, 0xffffff], [0x1a1a1e, 0xf0a020], [0xe86a20, 0x1a1a1a], [0xe8e8e8, 0x8a1a1a], [0x2ab0b0, 0x101828]];
const SKINS = [{ id: 'classic', name: 'Blue', col: 0x2a6ad8, stars: 0 }, { id: 'navy', name: 'Navy', col: 0x1a2a6a, stars: 6 }, { id: 'teal', name: 'Teal', col: 0x1a9a9a, stars: 14 }, { id: 'sky', name: 'Sky', col: 0x6ab8f0, stars: 24 }, { id: 'violet', name: 'Violet', col: 0x6a3ad0, stars: 36 }, { id: 'gold', name: 'Gold', col: 0xd6a630, stars: 50 }];
const UPGRADES = [{ id: 'skate', name: 'Sharp skates', max: 2, cost: l => [60, 140][l], desc: 'A little quicker on the ice.' }, { id: 'shot', name: 'Composite stick', max: 2, cost: l => [70, 160][l], desc: 'Harder, truer shots.' }, { id: 'pads', name: 'Goalie pads', max: 2, cost: l => [60, 140][l], desc: 'Your goalie saves more.' }];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Pond hockey'], [60, 'Juniors'], [200, 'Minor league'], [500, 'Pro'], [1100, 'All-star'], [2500, 'Legend of the ice']];
const PLACES = [{ name: 'Frozen pond rink' }, { name: 'Town arena' }, { name: 'City arena' }, { name: 'Grand dome' }];
const placeOf = N => Math.min(3, Math.floor((N - 1) / 6));
const STYLES = { even: 'a steady team', press: 'they press you hard', tight: 'they defend the slot', pass: 'they pass a lot' };
function styleOf(N) { if (N <= 3) return 'even'; return ['press', 'even', 'tight', 'pass'][(N - 4) % 4]; }
function makeCfg(N, help, o = {}) { const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), style = styleOf(N);
  return { N, f, help: !!help, style, first3: !!o.first3, len: MATCH,
    oSpd: x(5.9, 7.7, 40) * (help ? 0.95 : 1) * (style === 'press' ? 1.04 : 1), oSkill: x(0.25, 0.85, 40), oThink: x(0.38, 0.24, 40) * (style === 'pass' ? 0.8 : 1), oPass: x(0.6, 0.94, 40), oShot: x(0.62, 0.88, 40), oKeep: x(0.0, 0.8, 45) * (help ? 0.93 : 1),
    oPoke: x(1.0, 2.2, 40) * (style === 'press' ? 1.3 : 1), oFace: x(0.42, 0.22, 40), oRange: x(9, 10.5, 30),
    uSpd: 7.4 + 0.25 * upLv('skate') + (help ? 0.3 : 0) + (N <= 3 ? 0.3 : 0), uShot: 0.55 + 0.1 * upLv('shot') + (help ? 0.06 : 0), uPass: 0.82, uKeep: 0.3 + 0.08 * upLv('pads') + (help ? 0.08 : 0) + (N <= 3 ? 0.02 : 0), uPoke: 0.6 }; }
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help, o), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0, R = rng(seed + 11);
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, clock: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, mini: !!o.mini,
    foe: TEAMS[(N * 7 + 3) % TEAMS.length], kit: KITS[N % KITS.length], score: [0, 0], P: [], ctrl: 3, stick: { x: 0, z: 0 }, pause: 0, golden: false, shots: [0, 0], think: 0, face: null,
    stats: { assists: 0, steals: 0, intercepts: 0, combos: 0, saves: 0, slap: 0 }, chain: [], scorers: [], rank: [[], []] };
  for (let t = 0; t < 2; t++) for (let i = 0; i < 4; i++) G.P.push({ t, i, role: ROLE[i], x: 0, z: 0, vx: 0, vz: 0, face: t ? Math.PI : 0, down: 0, cd: 0, dec: 0, plan: null, pk: 0, st: 1, burst: 0, wind: 0 });
  G.T = [G.P.slice(0, 4), G.P.slice(4)];
  G.puck = { x: 0, z: 0, vx: 0, vz: 0, own: null, last: null, kind: null, to: null, shot: null, trail: [] };
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else faceoff(G, true);
  return G; }
const team = (G, t) => G.T[t], me = G => G.P[G.ctrl], goalX = t => t === 0 ? GX : -GX, dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
// the rink: a rounded rectangle. inside(x, z, m): the nearest point at least m inside the boards, and the normal there
function boards(x, z, m) { const ax = HL - m, az = HW - m, cr = Math.max(0.1, CR - m), cx = clamp(x, -(ax - cr), ax - cr), cz = clamp(z, -(az - cr), az - cr), dx = x - cx, dz = z - cz, d = Math.hypot(dx, dz);
  if (Math.abs(x) <= ax - cr || Math.abs(z) <= az - cr) { const nx = Math.abs(x) > ax ? Math.sign(x) : 0, nz = Math.abs(z) > az ? Math.sign(z) : 0; if (!nx && !nz) return null; return { x: clamp(x, -ax, ax), z: clamp(z, -az, az), nx, nz }; }
  if (d <= cr) return null; return { x: cx + dx / d * cr, z: cz + dz / d * cr, nx: dx / d, nz: dz / d }; }
const inNet = (x, z, m = 0) => Math.abs(z) < GW2 + 0.1 + m && Math.abs(x) > GX - m && Math.abs(x) < GX + GD + m;
// formation spots (mirrored for them): the defender stays back, the forwards spread to the passing lanes
function home(G, p) { const s = p.t ? -1 : 1, f = FORM[p.i], u = G.puck, att = u.own ? u.own.t === p.t : u.last ? u.last.t === p.t : false, px = u.x * s;
  if (p.role === 'g') return goaliePos(G, p);
  let x = f[0] + clamp(px * 0.55 + (att ? 5 : -2), -6, p.role === 'd' ? 7 : 12), z = f[1] * (att ? 1.25 : 0.9) + u.z * (p.role === 'd' ? 0.25 : 0.35);
  if (att && p.role === 'f' && px > 6) { x = Math.min(x, GX - 3); z = f[1] > 0 ? Math.max(z, 2.5) : Math.min(z, -2.5); }
  if (!att && G.cfg.style === 'tight' && p.t === 1) { x = Math.min(x, -2); }
  return [clamp(s * x, -HL + 1.5, HL - 1.5), clamp(z, -HW + 1.5, HW - 1.5)]; }
function goaliePos(G, p) { const gx = -goalX(p.t), u = G.puck, dx = u.x - gx, dz = u.z, d = Math.hypot(dx, dz) || 1, out = clamp(0.4 + d * 0.04, 0.4, 1.1); return [gx + dx / d * out + Math.sign(-gx) * 0.2, clamp(dz / d * out, -GW2 + 0.15, GW2 - 0.15)]; }
function faceoff(G, first) { const u = G.puck; Object.assign(u, { x: 0, z: 0, vx: 0, vz: 0, own: null, last: null, kind: null, to: null, shot: null }); u.trail.length = 0; G.chain.length = 0;
  for (const p of G.P) { const s = p.t ? -1 : 1, f = FORM[p.i]; p.x = p.i === 3 ? s * -0.8 : s * Math.min(-2, f[0] * 0.8); p.z = p.i === 3 ? 0 : f[1]; if (p.role === 'g') p.x = s * -(GX - 0.6); p.vx = p.vz = 0; p.down = 0; p.cd = 0; p.wind = 0; p.face = p.t ? Math.PI : 0; }
  G.ctrl = 3; G.face = { t: 0, drop: 0.7 + G.rnd() * 0.6, you: null, early: false, ai: null }; G.pause = 0; G.ev.push({ k: 'faceoff', first }); }
function give(G, p) { const u = G.puck; p.gotAt = G.t; if (u.last && u.last.t === p.t && u.kind === 'pass' && u.last !== p) G.chain.push(u.last); else if (!u.last || u.last.t !== p.t) G.chain.length = 0;
  u.viaPass = u.kind === 'pass' && u.to === p; u.own = p; u.last = p; u.kind = null; u.to = null; u.shot = null; u.vx = u.vz = 0; p.cd = 0; if (p.t === 0 && G.ctrl !== p.i && p.role !== 'g') { G.ctrl = p.i; G.ev.push({ k: 'switch', auto: true }); }
  if (p.t === 0 && G.queued != null && G.t - G.queued < 1.5 && u.viaPass && p === me(G)) { G.queued = null; shoot(G, p, G.stick, 0, true); } else if (p.t === 0) G.queued = null; }
// ---------- the controls ----------
function setStick(G, x, z) { const L = Math.hypot(x, z); G.stick = L > 1 ? { x: x / L, z: z / L } : { x, z }; }
const havePuck = G => G.puck.own && G.puck.own.t === 0;
function faceTap(G) { const F = G.face; if (!F || F.you != null) return false; if (F.t < F.drop) { F.early = true; F.you = 99; G.ev.push({ k: 'early' }); return true; } F.you = F.t - F.drop; return true; }
function btnPass(G) { if (G.over || G.pause > 0) return false; if (G.face) return faceTap(G); if (havePuck(G) && G.puck.own === me(G)) return pass(G, me(G), G.stick, false); return switchNear(G); }
function shootDown(G) { if (G.over || G.pause > 0) return false; if (G.face) return faceTap(G); const p = me(G), u = G.puck; if (havePuck(G) && u.own === p) { if (u.viaPass && G.t - (p.gotAt || 0) < 0.4) return shoot(G, p, G.stick, 0, true); p.wind = 0.001; G.ev.push({ k: 'windup' }); return true; }
  if (!u.own && u.kind === 'pass' && u.to === p) { G.queued = G.t; G.ev.push({ k: 'oneready' }); return true; } return poke(G, p); }      // SHOOT while the pass is on its way: a one-timer the moment it arrives
function shootUp(G) { const p = me(G); if (!p.wind) return false; const w = p.wind; p.wind = 0; if (G.puck.own !== p) return false; return shoot(G, p, G.stick, w > 0.22 ? Math.min(1, (w - 0.22) / 0.4) : 0); }
function btnBurst(G) { if (G.over || G.pause > 0 || G.face) return false; const p = me(G); if (p.st < 0.25 || p.burst > 0) return false; p.burst = 0.8; p.st -= 0.25; G.ev.push({ k: 'burst' }); return true; }
function switchNear(G) { const u = G.puck; let best = null, bd = 1e9; for (const p of team(G, 0)) { if (p.role === 'g' || p.i === G.ctrl) continue; const d = Math.hypot(p.x - u.x, p.z - u.z); if (d < bd) { bd = d; best = p; } } if (!best) return false; G.ctrl = best.i; G.ev.push({ k: 'switch' }); return true; }
// ---------- the puck: passes (straight or off the boards), shots ----------
function openness(G, q) { let m = 99; for (const o of team(G, 1 - q.t)) if (o.role !== 'g') m = Math.min(m, dist(o, q)); return m; }
function lineRisk(G, p, tx, tz) { let r = 0; const dx = tx - p.x, dz = tz - p.z, L2 = dx * dx + dz * dz || 1; for (const o of team(G, 1 - p.t)) { if (o.role === 'g') continue; const u = clamp(((o.x - p.x) * dx + (o.z - p.z) * dz) / L2, 0, 1), d = Math.hypot(p.x + dx * u - o.x, p.z + dz * u - o.z); if (d < 1.8) r += (1.8 - d); } return r; }
function bestTarget(G, p, dir) { const s = p.t ? -1 : 1, dl = Math.hypot(dir.x, dir.z), mates = team(G, p.t).filter(q => q !== p && q.role !== 'g'); let best = null, bs = -1e9;
  for (const q of mates) { const dx = q.x - p.x, dz = q.z - p.z, d = Math.hypot(dx, dz); if (d < 2 || d > 26) continue; let sc = -Math.abs(d - 9) * 0.06 + dx * s * 0.05;
    if (dl > 0.3) { const cos = (dx * dir.x + dz * dir.z) / (d * dl); sc += cos * 3; if (cos < 0.2) sc -= 4; }
    sc += Math.min(5, openness(G, q)) * 0.3 - Math.min(lineRisk(G, p, q.x, q.z), lineRisk(G, p, q.x, Math.sign(q.z + p.z || 1) * 2 * HW - q.z) + 0.3) * 1.0; if (sc > bs) { bs = sc; best = q; } }
  return best; }
function release(G, p) { const u = G.puck; u.x = p.x + Math.cos(p.face) * 0.7; u.z = p.z + Math.sin(p.face) * 0.7; u.own = null; u.last = p; p.cd = 0.3; p.wind = 0; }
function pass(G, p, dir, ai) { const q = bestTarget(G, p, dir); if (!q) return false; const acc = p.t ? G.cfg.oPass : G.cfg.uPass, u = G.puck, d = dist(p, q), sp = clamp(9 + d * 0.7, 10, 20), tt = d / sp;
  let tx = q.x + q.vx * tt * 0.8, tz = q.z + q.vz * tt * 0.8; const direct = lineRisk(G, p, tx, tz), wall = Math.sign(tz + p.z || 1) * HW, bz = 2 * wall - tz, bank = lineRisk(G, p, tx, bz) + 0.3, viaBoards = direct > 0.8 && bank < direct && Math.abs(tz - wall) < 8 && Math.abs(tx) < HL - CR;
  if (viaBoards) tz = bz; const err = (1 - acc) * 0.18 * (G.rnd() - 0.5) * 2, a = Math.atan2(tz - p.z, tx - p.x) + err; release(G, p); const spd = viaBoards ? sp * 1.15 : sp;
  u.vx = Math.cos(a) * spd; u.vz = Math.sin(a) * spd; u.kind = 'pass'; u.to = q; u.boards = viaBoards; G.ev.push({ k: 'pass', t: p.t, boards: viaBoards }); if (p.t === 0) { G.ctrl = q.i; lessonSee(G, 'pass'); } return true; }
function gauss(R) { return Math.sqrt(-2 * Math.log(1 - R() * 0.9999)) * Math.cos(TAU * R()); }
function nearestFoe(G, p) { let m = 99; for (const o of team(G, 1 - p.t)) if (o.down <= 0 && o.role !== 'g') m = Math.min(m, dist(o, p)); return m; }
// aim: a number for the computer's players (the sign picks the corner), or the stick: point it at the net, a little to one side
// for that corner; straight at the net, at the goalie; pointed off the net, the shot goes where it points (wide)
function shoot(G, p, aim, power, oneT) { const c = G.cfg, gx = goalX(p.t), u = G.puck, gk = G.P[(1 - p.t) * 4], dg = Math.hypot(gx - p.x, p.z); let aimZ = aim, wide = null;
  let tz = null;
  if (typeof aim === 'object') { const L = Math.hypot(aim.x, aim.z); aimZ = 0; if (L >= 0.3) { const sa = Math.atan2(aim.z, aim.x), cs = Math.cos(sa) * Math.sign(gx - p.x), zHit = p.z + Math.tan(sa) * (gx - p.x);      // where the stick's line meets the goal line
      if (cs > 0.2 && Math.abs(zHit) < GW2 + 1.0) { tz = clamp(zHit, -(GW2 - 0.15), GW2 - 0.15); aimZ = Math.abs(tz) > 0.3 ? Math.sign(tz) : 0; } else wide = sa; } }      // pointed at the net (or near it): there; off it: wide
  if (tz == null) tz = Math.abs(aimZ) > 0.3 ? Math.sign(aimZ) * (GW2 - 0.18) : clamp(gk.z, -0.5, 0.5);      // no aim: it goes at the goalie
  const skill = p.t ? c.oShot : c.uShot, nfo = nearestFoe(G, p), open = p.t === 1 && nfo > 2.5 && dg < 10,      // their forwards punish a team that does not defend
    press = Math.max(0, 2 - nfo) / 2, sdev = (0.02 + dg * 0.004) * (1.4 - skill) * (1 + press * 0.8) * (open ? 0.5 : 1) * (1 + power * 0.6);
  const want = wide != null ? wide : Math.atan2(tz - p.z, gx - p.x), off = Math.abs(angD(want, p.face)); oneT = oneT && dg < 9 && Math.abs(p.z) < 4.5 && off < 0.8;      // a one-timer is from the slot, facing the net
  // snatched the moment it arrives (and not a one-timer): weak and wild; facing away: a weak, wild backhand
  const snatched = G.t - (p.gotAt || 0) < 0.35 && !oneT, back = off > 1.9 ? 2.6 : off > 1.3 ? 1.4 : 1, a = want + gauss(G.rnd) * sdev * back * (snatched ? 1.5 : 1), sp = (19 + skill * 6) * (1 + power * 0.5) * (oneT ? 1.15 : 1) * (back > 2 ? 0.7 : 1) * (snatched ? 0.75 : 1); release(G, p); u.vx = Math.cos(a) * sp; u.vz = Math.sin(a) * sp; u.kind = 'shot';
  u.shot = { t: p.t, from: p, roll: G.rnd(), dg, power, high: G.rnd() < 0.3 + power * 0.4, screen: screened(G, p, gx), oneT: !!oneT && dg < 10, open, snatched, corner: Math.abs(tz) > 0.5 && Math.abs(p.z) < 3.5, aimed: Math.abs(aimZ) > 0.3 }; G.shots[p.t]++; if (power > 0.3 && p.t === 0) G.stats.slap++; G.ev.push({ k: 'shoot', t: p.t, power, oneT: !!oneT }); if (oneT && p.t === 0) G.stats.oneT = (G.stats.oneT || 0) + 1; lessonSee(G, power > 0.3 ? 'slap' : 'shoot'); return true; }
function screened(G, p, gx) { let n = 0; for (const q of G.P) { if (q === p || q.role === 'g') continue; const L = Math.hypot(gx - p.x, -p.z) || 1, ux = (gx - p.x) / L, uz = -p.z / L, along = (q.x - p.x) * ux + (q.z - p.z) * uz, off = Math.abs(-(q.x - p.x) * uz + (q.z - p.z) * ux); if (along > 1 && along < L - 0.6 && off < 0.6) n++; } return n; }
// a poke check: a quick stab at the puck, short reach; it misses (and you overreach a moment) if he is not in front of you
function poke(G, p) { const u = G.puck; if (p.down > 0 || p.pk > 0) return false; p.pk = 0.5; G.ev.push({ k: 'poke', t: p.t }); const o = u.own;
  if (!o || o.t === p.t) { if (!o && Math.hypot(u.x - p.x, u.z - p.z) < 1.6) { give(G, p); return true; } return false; }
  const d = Math.hypot(p.x - u.x, p.z - u.z), skill = p.t ? G.cfg.oSkill : G.cfg.uPoke, dodge = o.t ? G.cfg.oSkill : 0.5, wind = o.wind > 0.1 ? 0.3 : 0;
  const facing = Math.abs(angD(Math.atan2(u.z - p.z, u.x - p.x), p.face)) < 1.1;      // a poke goes where you face
  if (d < 1.7 && facing && G.rnd() < clamp(0.4 + skill * 0.45 - dodge * 0.3 + wind - (d / 1.7) * 0.25, 0.05, 0.95)) { o.down = 0.45; o.wind = 0; o.cd = 0.6; give(G, p);
    G.ev.push({ k: 'stolen', t: p.t }); if (p.t === 0) { G.stats.steals++; lessonSee(G, 'poke'); } return true; }
  p.down = 0.25; return false; }
// ---------- how a skater moves: glide and edges ----------
// Speed builds quickly and bleeds off slowly (ice), turns are smooth and wider when fast, but never so loose that the thumb
// loses him: what is left of the old direction fades in a fraction of a second.
function move(G, p, tx, tz, sp, dt) { const dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz), withPuck = G.puck.own === p, top = sp * (p.burst > 0 ? 1.35 : 1) * (withPuck ? 0.93 : 1) * (p.wind > 0 ? 0.6 : 1);
  let wx = d > 0.25 && p.down <= 0 ? dx / d * Math.min(top, d * 3) : 0, wz = d > 0.25 && p.down <= 0 ? dz / d * Math.min(top, d * 3) : 0;
  const v = Math.hypot(p.vx, p.vz), acc = (p.burst > 0 ? 16 : 9) * (v < 3 ? 1.4 : 1), grip = 1 - Math.exp(-dt * (wx || wz ? 5 : 1.2));
  let ax = wx - p.vx, az = wz - p.vz; const al = Math.hypot(ax, az), lim = Math.max(acc * dt, al * grip); if (al > lim) { ax = ax / al * lim; az = az / al * lim; } p.vx += ax; p.vz += az;
  p.x += p.vx * dt; p.z += p.vz * dt; const b = boards(p.x, p.z, 0.45); if (b) { p.x = b.x; p.z = b.z; const vn = p.vx * b.nx + p.vz * b.nz; if (vn > 0) { p.vx -= vn * b.nx * 1.3; p.vz -= vn * b.nz * 1.3; if (vn > 5) G.ev.push({ k: 'boards', x: p.x, z: p.z, v: vn }); } }
  if (inNet(p.x, p.z, 0.4) && p.role !== 'g') { const s = Math.sign(p.x); if (Math.abs(p.x) < GX + 0.2) p.x = s * (GX - 0.45); else p.z = Math.sign(p.z || 1) * (GW2 + 0.55); }
  const nv = Math.hypot(p.vx, p.vz); if (nv > 0.4) { const h = Math.atan2(p.vz, p.vx), da = angD(h, p.face); p.face += clamp(da, -10 * dt, 10 * dt); p.cut = Math.abs(da) > 0.9 && nv > 4; }
  if (p.burst > 0) p.burst -= dt; p.st = clamp(p.st + 0.09 * dt, 0, 1); }
const angD = (a, b) => { let d = a - b; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
// ---------- the match, step by step ----------
function step(G, dt) { if (G.over) return; G.t += dt; const c = G.cfg, u = G.puck;
  if (G.lessonWait) { G.lessonWait -= dt; if (G.lessonWait <= 0) { G.lessonWait = 0; if (G.lessonEnd) { G.lessonEnd = false; G.score = [0, 0]; G.clock = 0; G.shots = [0, 0]; faceoff(G, true); } else lessonSetup(G); } return; }
  if (G.pause > 0) { G.pause -= dt; if (G.pause <= 0 && G.after) { const f = G.after; G.after = null; f(); } return; }
  if (G.face) { const F = G.face; F.t += dt; if (F.ai == null && F.t >= F.drop) F.ai = F.drop + c.oFace * (0.8 + G.rnd() * 0.4) * (G.lesson ? 3 : 1);
    if (F.t >= F.drop && (F.you != null || F.t >= F.ai)) { const youWin = !F.early && F.you != null && F.drop + F.you <= F.ai; G.face = null; const wn = G.P[youWin ? 3 : 7], d = G.P[youWin ? 1 : 5]; u.x = 0; u.z = 0; u.last = wn; u.kind = 'loose'; const a = Math.atan2(d.z - 0, d.x - 0); u.vx = Math.cos(a) * 7; u.vz = Math.sin(a) * 7; u.to = d; G.ev.push({ k: 'faceoffwon', t: youWin ? 0 : 1, early: F.early }); } return; }
  if (!G.lesson) { G.clock += dt; if (!c.first3 && G.clock >= c.len && !G.golden) { if (G.score[0] !== G.score[1]) return finish(G, G.score[0] > G.score[1]); G.golden = true; G.ev.push({ k: 'golden' }); } if (G.golden && G.clock >= c.len + 120) return finish(G, false, 'draw'); if (c.first3 && G.clock > 300) return finish(G, G.score[0] > G.score[1], G.score[0] === G.score[1] ? 'draw' : null); }
  for (const p of G.P) { if (p.down > 0) p.down -= dt; if (p.cd > 0) p.cd -= dt; if (p.pk > 0) p.pk -= dt; }
  const m = me(G); if (m.wind > 0) { m.wind += dt; if (u.own !== m) m.wind = 0; else if (m.wind > 1.2) shootUp(G); }
  G.think -= dt; const thinkNow = G.think <= 0; if (thinkNow) { G.think = 0.1; const o = u.own || u; for (let t = 0; t < 2; t++) { const L = G.rank[t]; L.length = 0; for (const q of G.T[t]) if (q.role !== 'g' && !(q.t === 0 && q.i === G.ctrl)) L.push(q); L.sort((a, q) => ((a.x - o.x) ** 2 + (a.z - o.z) ** 2) - ((q.x - o.x) ** 2 + (q.z - o.z) ** 2)); } }
  for (const p of G.P) { let tx, tz, sp; const top = p.role === 'g' ? 4 : p.t ? c.oSpd : c.uSpd;
    if (p.t === 0 && p.i === G.ctrl) { const s2 = G.stick, L = Math.hypot(s2.x, s2.z); if (L < 0.1 && !u.own && u.to === p) [tx, tz, sp] = brain(G, p); else { tx = p.x + s2.x * 4; tz = p.z + s2.z * 4; sp = top * Math.min(1, L * 1.2); } }
    else { if (thinkNow || !p.plan) p.plan = brain(G, p); [tx, tz, sp] = p.plan; sp = Math.min(sp, top * (p.burst > 0 ? 1.35 : 1)); }
    move(G, p, tx, tz, sp, dt); }
  for (let i = 0; i < 8; i++) { const p = G.P[i]; for (let j = i + 1; j < 8; j++) { const q = G.P[j], dx = q.x - p.x, dz = q.z - p.z, d2 = dx * dx + dz * dz; if (d2 < 0.64 && d2 > 1e-6) { const d = Math.sqrt(d2), push = (0.8 - d) * 0.5 / d; p.x -= dx * push; p.z -= dz * push; q.x += dx * push; q.z += dz * push; } } }
  if (u.own && !(u.own.t === 0 && u.own.i === G.ctrl)) { const p = u.own; p.dec -= dt; if (p.dec <= 0) { p.dec = (p.t ? c.oThink : 0.3) * (0.7 + G.rnd() * 0.6); decide(G, p); } }
  if (u.own) { const o = u.own; for (const p of team(G, 1 - o.t)) { if (p.down > 0 || p.role === 'g') continue; const d = dist(p, o); if (d < 1.4) { const rate = p.t ? (G.lesson ? 0 : c.oPoke) : 0; if (rate && G.rnd() < rate * dt * (o.wind > 0.1 ? 2.5 : 1)) poke(G, p); } } }
  if (u.own) { const o = u.own, dangle = Math.sin(G.t * 9 + o.i) * 0.12; u.x = o.x + Math.cos(o.face) * 0.75 - Math.sin(o.face) * dangle; u.z = o.z + Math.sin(o.face) * 0.75 + Math.cos(o.face) * dangle; u.vx = o.vx; u.vz = o.vz; }
  else { const n = Math.ceil(Math.hypot(u.vx, u.vz) * dt / 0.3) || 1; for (let s = 0; s < n && !u.own; s++) { const h = dt / n, px = u.x, pz = u.z; u.x += u.vx * h; u.z += u.vz * h; if (puckWalls(G, px, pz)) return; if (u.shot) goalieWatch(G); }
    const sp = Math.hypot(u.vx, u.vz), f = Math.max(0, sp - (0.35 + 0.08 * sp) * dt) / (sp || 1); u.vx *= f; u.vz *= f; if (!u.own) pickup(G); }
  if (G.lesson) lessonTick(G, dt); }
// the puck off the boards and the net, and into it
function puckWalls(G, px, pz) { const u = G.puck, s = Math.sign(u.x) || 1;
  if (Math.abs(px) < GX && Math.abs(u.x) >= GX && Math.abs(u.z) < GW2 && Math.abs(pz) < GW2 + 0.2) { const t = u.x > 0 ? 0 : 1; if (u.kind === 'shot' && u.shot && !u.shot.done) { u.shot.force = true; goalieWatch(G); if (u.own || u.kind !== 'shot') return true; }      // a shot that slipped past the watch: the goalie still gets his chance
    if ((u.kind === 'shot' && u.last && u.last.t === t) || (u.kind === 'rebound' && u.rebFor === t)) { goal(G, t); return true; }
    const gk = G.P[(1 - t) * 4]; gk.z = clamp(u.z, -GW2, GW2); give(G, gk); gk.dec = 0.8; G.ev.push({ k: 'save', t: gk.t, hold: true }); return true; }      // a pass or a loose puck that slides at the net: the goalie covers it
  if (inNet(u.x, u.z)) { if (Math.abs(px) >= GX + GD) { u.x = s * (GX + GD + 0.12); u.vx = s * Math.abs(u.vx) * 0.5; }
    else if (Math.abs(pz) >= GW2 + 0.1) { u.z = Math.sign(u.z || 1) * (GW2 + 0.12); u.vz = -u.vz * 0.5; }
    else { u.x = s * (GX - 0.08); u.vx = -u.vx * 0.6; u.vz += (G.rnd() - 0.5) * 2; } G.ev.push({ k: 'post', x: u.x, z: u.z }); if (u.shot) { u.rebFor = u.shot.aimed ? u.shot.t : -1; u.shot = null; u.kind = 'rebound'; } }
  const b = boards(u.x, u.z, 0.05); if (b) { u.x = b.x; u.z = b.z; const vn = u.vx * b.nx + u.vz * b.nz; if (vn > 0) { u.vx -= vn * b.nx * 1.75; u.vz -= vn * b.nz * 1.75; u.vx *= 0.92; u.vz *= 0.92; if (vn > 3) G.ev.push({ k: 'boards', x: u.x, z: u.z, v: vn, puck: true }); if (u.shot) { u.shot = null; u.kind = 'loose'; } } }
  return false; }
// someone takes a loose puck
function pickup(G) { const u = G.puck; let best = null, bd = 1e9; const sp = Math.hypot(u.vx, u.vz);
  for (const p of G.P) { if (p.cd > 0 || p.down > 0) continue; if (p.role === 'g' && (u.shot || Math.abs(p.x - u.x) > 1.2)) continue; const d = Math.hypot(p.x - u.x, p.z - u.z), reach = u.to === p ? 1.3 : 0.9; if (d > reach || d >= bd) continue;
    const meant = u.to === p, foe = u.last && u.last.t !== p.t, ch = meant ? 0.96 : sp < 5 ? 0.9 : foe ? clamp((p.t ? 0.2 + G.cfg.oSkill * 0.4 : 0.35) * (1 - sp / 28), 0.03, 0.6) : 0.7;
    if (G.rnd() < ch * (u.kind === 'shot' ? 0.35 : 1)) { bd = d; best = p; } }
  if (best) { const icp = u.last && u.last.t !== best.t && u.kind === 'pass'; give(G, best); if (icp) { G.ev.push({ k: 'intercept', t: best.t }); if (best.t === 0) G.stats.intercepts++; } } }
// the goalie and a shot: he slides across; if he gets there in time he saves, and often the puck bounces back out (a rebound)
function goalieWatch(G) { const u = G.puck, s = u.shot, gk = G.P[(1 - s.t) * 4], gx = goalX(s.t); if (s.done) return;
  const toLine = s.force ? 0 : (gx - u.x) / (u.vx || 1e-6); if (toLine < 0 || (toLine > 0.12 && Math.abs(gx - u.x) > 1.2)) return;      // in time, or close (a slow, sideways puck)
  const zAt = u.z + u.vz * Math.min(toLine, 0.3); if (Math.abs(zAt) > GW2 + 0.05 && !s.force) return; s.done = true;      // heading wide: keep watching (it may still curl in)
  const LS = G.lesson && lessonNow(G), skill = LS ? (s.aimed && !s.snatched && !s.oneT && s.dg < (LS.id === 'slap' ? 11.5 : 9) ? (LS.id === 'slap' ? 0.5 : 0.75) : 1) : (s.t === 0 ? G.cfg.oKeep : G.cfg.uKeep), sp = Math.hypot(u.vx, u.vz), gap = Math.max(0, Math.abs(zAt - gk.z) - 0.35 - skill * 0.3);
  const far = clamp((s.dg - 6) * 0.06, 0, 0.9), p = clamp(0.5 + skill * 0.45 + far - gap * 0.9 - (sp - 20) * 0.012 - s.screen * 0.18 - (s.high ? 0.1 : 0) - (s.oneT ? 0.18 : 0) - (s.open ? 0.25 : 0) + (Math.abs(zAt) < 0.35 ? 0.25 : 0), 0.04, 0.985), pf = s.dg > 12 ? Math.max(p, 0.997) : s.dg > 10 ? Math.max(p, 0.95) : p, pp = !s.aimed || (LS && skill >= 1) ? 1 : Math.abs(zAt - gk.z) < 0.3 && !s.oneT ? Math.max(pf, 0.96) : pf;      // from far he sees it all the way      // no aim: it goes at him, and he has it      // straight at him: he has it
  if (s.roll < pp) { gk.z = clamp(zAt, -GW2, GW2); const hold = sp < 16 && s.roll < p * 0.5; G.ev.push({ k: 'save', t: gk.t, hold }); if (gk.t === 0) G.stats.saves++;
    if (hold) { gk.face = gx > 0 ? Math.PI : 0; give(G, gk); gk.dec = 0.9; } else { const out = -Math.sign(gx), a = (G.rnd() - 0.5) * 2.2; u.x = gx + out * 0.6; u.z = zAt; u.vx = out * Math.cos(a) * (4 + G.rnd() * 5); u.vz = Math.sin(a) * (4 + G.rnd() * 5); u.rebFor = s.t; u.shot = null; u.last = gk; u.kind = 'rebound'; } } }
function goal(G, t) { const u = G.puck, scorer = u.shot ? u.shot.from : u.last, ast = G.chain.filter(q => q.t === t && q !== scorer).slice(-2);
  G.score[t]++; G.scorers.push({ t, at: Math.round(G.clock), ast: ast.length, combo: G.chain.length }); if (t === 0) { G.stats.assists += ast.length; if (G.chain.length >= 2) G.stats.combos++; lessonSee(G, 'goal'); }
  G.ev.push({ k: 'goal', t, ast: ast.length, combo: G.chain.length, power: u.shot ? u.shot.power : 0, oneT: !!(u.shot && u.shot.oneT) }); u.own = null; u.shot = null; u.vx *= 0.1; u.vz *= 0.1;
  if (G.lesson) { G.lessonWait = 1.8; return; }
  if (G.golden || (G.cfg.first3 && G.score[t] >= 3)) { G.pause = 1.6; G.after = () => finish(G, G.score[0] > G.score[1]); return; }
  G.pause = 2.2; G.after = () => faceoff(G, false); }
// ---------- the brains (everyone but you): returns [target x, target z, speed] ----------
function brain(G, p) { const c = G.cfg, u = G.puck, s = p.t ? -1 : 1, spd = (p.role === 'g' ? 4 : p.t ? c.oSpd : c.uSpd) * (G.lesson && p.t ? 0.45 : 1), own = u.own, att = own ? own.t === p.t : u.last ? u.last.t === p.t : false;
  if (p.role === 'g') { const gp = goaliePos(G, p); return [gp[0], gp[1], 4]; }
  if (G.lesson && p.t === 0 && lessonNow(G) && lessonNow(G).id === 'poke') return [-12, FORM[p.i][1] * 1.5, spd * 0.5];      // the poke lesson is yours alone
  if (own === p) { const gx = goalX(p.t), pl = p.carry || [gx - s * 3, clamp(p.z * 0.5, -4, 4)]; return [pl[0], pl[1], spd * 0.9]; }
  if (!own && u.to === p) return [u.x + u.vx * 0.25, u.z + u.vz * 0.25, spd];
  if (!own) { const near = G.rank[p.t][0]; if (near === p && !(u.kind === 'pass' && u.last && u.last.t === p.t)) return [u.x + u.vx * 0.25, u.z + u.vz * 0.25, spd]; }
  // a shot is on: one forward goes to the crease for the rebound
  if (u.shot && u.shot.t === p.t && p.role === 'f' && G.rank[p.t][0] === p) { const gx = goalX(p.t); return [gx - s * 2.2, clamp(u.z, -1.2, 1.2), spd]; }
  const h = home(G, p);
  if (att) { if (p.role === 'f' && own) { let bx = h[0], bz = h[1], bs = -1e9; for (let i = 0; i < 6; i++) { const cx = clamp(h[0] + (i % 3 - 1) * 3, -HL + 2, HL - 2), cz = clamp(h[1] + (i < 3 ? -2 : 2), -HW + 1.5, HW - 1.5), sc = Math.min(4, openness(G, { x: cx, z: cz, t: p.t })) - lineRisk(G, own, cx, cz) * 1.5; if (sc > bs) { bs = sc; bx = cx; bz = cz; } } return [bx, bz, spd * 0.8]; }
    return [h[0], h[1], spd * 0.75]; }
  if (own) { const rank = G.rank[p.t].indexOf(p), gx = -goalX(p.t);
    if (rank === 0) { if (p.t) return [own.x + own.vx * 0.2, own.z + own.vz * 0.2, dist(p, own) > 4 ? spd : spd * 0.75]; const dx = gx - own.x, dz = -own.z, d = Math.hypot(dx, dz) || 1; return [own.x + dx / d * 3, own.z + dz / d * 3, spd * 0.6]; }      // your team-mates only shadow: winning it is your job
    if (rank === 1 && p.t === 1 && c.style === 'press') return [own.x + own.vx * 0.3 + s * -1.5, own.z, spd * 0.9];
    if (rank === 1 || (c.style === 'tight' && p.t === 1)) return [own.x + (gx - own.x) * 0.45, own.z * 0.45, spd * 0.85]; }
  return [h[0], h[1], spd * 0.7]; }
function decide(G, p) { const c = G.cfg, gx = goalX(p.t), dg = Math.hypot(gx - p.x, p.z), nf = nearestFoe(G, p), R = G.rnd, s = p.t ? -1 : 1;
  if (G.lesson && p.t === 1) { let m = me(G); for (const q2 of team(G, 0)) if (q2.role !== 'g' && dist(q2, p) < dist(m, p)) m = q2; const side = Math.sign(p.z - m.z) || 1, near = dist(p, m) < 5; p.carry = [p.x + s * 4, clamp(near ? p.z + side * 4 : p.z * 0.8, -HW + 2, HW - 2)]; p.dec = 0.25; return; }      // in a lesson they stroll forward, stepping round you
  if (p.role === 'g') { const q = bestTarget(G, p, { x: s, z: 0 }); if (q) pass(G, p, { x: q.x - p.x, z: q.z - p.z }, true); return; }
  const range = p.t ? c.oRange : 10, passy = c.style === 'pass' && p.t ? 0.25 : 0;
  if (dg < range && (p.x - gx) * -s > -1 && Math.abs(p.z) < 7 && (nf > 1.3 || dg < 5 || R() < 0.4) && R() > passy) { const gk = G.P[(1 - p.t) * 4]; shoot(G, p, (gk.z > 0 ? -1 : 1) * (R() < 0.5 + c.oShot * 0.5 ? 1 : -1), R() < 0.25 ? 0.6 : 0); return; }
  const q = bestTarget(G, p, { x: s, z: 0 });
  if (nf < 2.2 && q && R() < 0.75) { pass(G, p, { x: q.x - p.x, z: q.z - p.z }, true); return; }
  if (q && (q.x - p.x) * s > 3 && openness(G, q) > 3 && R() < 0.3 + passy) { pass(G, p, { x: q.x - p.x, z: q.z - p.z }, true); return; }
  let ax = 0, az = 0; for (const o of team(G, 1 - p.t)) { if (o.role === 'g') continue; const d = dist(o, p); if (d < 6) { ax += (p.x - o.x) / (d * d); az += (p.z - o.z) / (d * d); } }
  const sx = gx - s * 6, dx = sx - p.x, dz = -p.z, dl = Math.hypot(dx, dz) || 1; p.carry = [clamp(p.x + dx / dl * 5 + ax * 4, -GX + 1, GX - 1), clamp(p.z + dz / dl * 5 + az * 6, -HW + 2, HW - 2)]; }      // dribble: toward the slot, away from defenders
function finish(G, win, why) { if (G.over) return; G.over = win ? 'won' : 'lost'; const gd = G.score[0] - G.score[1], stars = win ? (gd >= 3 ? 3 : gd >= 2 || G.stats.combos > 0 ? 2 : 1) : 0, S = G.stats;
  const bonus = S.assists * 2 + S.intercepts * 2 + S.steals + S.combos * 4;
  G.res = { win, why, stars, a: G.score[0], b: G.score[1], stats: S, coins: G.score[0] * 3 + bonus + (win ? 6 + Math.ceil(G.N / 2) : 0), time: G.t };
  G.ev.push({ k: win ? 'won' : 'lost', why }); return true; }
// ---------- LESSONS ----------
const AIMCARD = {"pic": "🏒", "win": "SCORE MORE GOALS", "lose": "THEY SCORE MORE", "how": "SKATE, PASS, SHOOT"};      // the aim card: specs/aims.json (tools/aims.py)
const LESSONS = {
  1: [{ id: 'pass', title: 'PASS', say: G => hockeyCue(G)[0], do: G => hockeyCue(G)[1], at: G => hockeyCue(G)[2], how: 'Skate with your LEFT thumb. Point at a team-mate and tap PASS. Two passes.', need: 2 },
    { id: 'goal', title: 'SHOOT', say: G => hockeyCue(G)[0], do: G => hockeyCue(G)[1], at: G => hockeyCue(G)[2], how: 'Skate at the net and tap SHOOT. Point up or down to pick the corner. Score once.', need: 1 }],
  2: [{ id: 'poke', title: 'POKE CHECK', say: G => hockeyCue(G)[0], do: G => hockeyCue(G)[1], at: G => hockeyCue(G)[2], how: 'Without the puck: skate at the man with it and tap POKE when you are close, facing the puck. Steal it three times.', need: 3 }],
  3: [{ id: 'slap', title: 'SLAP SHOT', say: G => hockeyCue(G)[0], do: G => hockeyCue(G)[1], at: G => hockeyCue(G)[2], how: 'HOLD SHOOT to wind up, let go to fire. Harder and faster: score once with one.', need: 1 }],
};
// THE TUTORIAL SHOWS ONE MOVE AT A TIME, WITH THE HAND ON IT (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing
// happens"). It said SKATE, TAP PASS (two moves) with a hand in a box. Now the robot is asked (dryPlan) and the hand does it: SKATE THIS WAY
// (the stick on the left), TAP PASS, TAP SHOOT, TAP POKE, HOLD SHOOT then LET GO for a slap shot, TAP SWITCH, TAP BURST, TAP NOW at a face-off.
const HKC = { t: -1e9, v: null };
function hockeyCue(G) { if (G.over || G.pause > 0) return ['WAIT…', 'wait', false]; const now = performance.now(); if (now - HKC.t < 250) return HKC.v; HKC.t = now;
  const L = layout(G), at = b => [b.x, b.y], P = dryPlan(G, null, { next: -1, cd: -1 }), slap = G.lesson && G.lesson.steps[G.lesson.i] && G.lesson.steps[G.lesson.i].id === 'slap'; let v = ['WAIT…', 'wait', false];
  if (me(G).wind) v = me(G).wind > 0.55 ? ['LET GO!', 'release', at(L.shoot)] : ['KEEP HOLDING', 'hold', at(L.shoot)];
  else if ((slap || (G.lesson && G.lesson.steps[G.lesson.i] && G.lesson.steps[G.lesson.i].id === 'goal')) && G.puck.own === me(G)) { const p = me(G), d = Math.hypot(GX - p.x, p.z);      // a shooting lesson: skate at the net, then shoot
    if (d < 7.5) v = slap ? ['HOLD SHOOT', 'hold', at(L.shoot)] : ['TAP SHOOT', 'tap', at(L.shoot)]; else { const R = 56 * k * 0.8, x0 = W * 0.22, y0 = H * 0.6, dx = GX - 3 - p.x, dz = -p.z, m = Math.hypot(dx, dz) || 1; v = ['SKATE AT THE NET', 'drag', [x0, y0, x0 + dx / m * R, y0 + dz / m * R]]; } }
  else if (P) { const a = P[0];
    if (a === 'pass') v = ['TAP PASS', 'tap', at(L.pass)]; else if (a === 'poke') v = ['TAP POKE', 'tap', at(L.shoot)]; else if (a === 'shootDown') v = slap ? ['HOLD SHOOT', 'hold', at(L.shoot)] : ['TAP SHOOT', 'tap', at(L.shoot)];
    else if (a === 'switchNear') v = ['TAP SWITCH', 'tap', at(L.pass)]; else if (a === 'btnBurst') v = ['TAP BURST', 'tap', at(L.burst)]; else if (a === 'faceTap') v = ['TAP NOW!', 'tap', at(L.shoot)];
    else if (a === 'setStick') { const R = 56 * k * 0.8, x0 = W * 0.22, y0 = H * 0.6; v = ['SKATE THIS WAY', 'drag', [x0, y0, x0 + P[1] * R, y0 + P[2] * R]]; } }
  HKC.v = v; return v; }
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonSetup(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonSetup(G) { const st = lessonNow(G); faceoff(G, true); G.face = null; G.pause = 0.3; const u = G.puck;
  if (st.id === 'poke') { const o = G.P[7], R = G.rnd; o.x = 7; o.z = (R() < 0.5 ? -1 : 1) * (2 + R() * 3); o.face = Math.PI; const m = G.P[3]; m.x = -3; m.z = -o.z * 0.5; m.face = Math.PI / 2; G.ctrl = 3; u.own = null; give(G, o); }
  else { const m = G.P[3]; m.x = st.id === 'pass' ? -4 : 4; m.z = 0; give(G, m); } }
function lessonTick(G, dt) { const st = lessonNow(G); if (!st) return;
  if (st.id === 'poke' && G.puck.own && G.puck.own.t === 0 && G.lessonTook) { G.lessonTook = false; lessonCount(G); if (G.lesson) G.lessonWait = 1.0; }
  else if (st.id === 'poke' && G.puck.own && G.puck.own.t === 1 && G.puck.own.x < -11) { G.ev.push({ k: 'lessonmiss', how: 'He got past you. ' + st.how }); G.lessonWait = 1.0; }
  if (G.puck.own && G.puck.own.t === 1 && st.id !== 'poke' && G.t - (G.lostAt || 0) > 1) { G.lostAt = G.t; G.ev.push({ k: 'lessonmiss', how: st.how }); G.lessonWait = 1.0; } }
function lessonSee(G, what) { const st = lessonNow(G); if (!st) return; if (what === 'pass' && st.id === 'pass') lessonCount(G); if (what === 'goal' && (st.id === 'goal' || (st.id === 'slap' && G.lastSlap))) lessonCount(G);
  if (what === 'slap') G.lastSlap = true; if (what === 'shoot') G.lastSlap = false; if (what === 'poke' && st.id === 'poke') G.lessonTook = true; }
function lessonCount(G) { const D = G.lesson, st = lessonNow(G); D.n++; if (D.n < st.need) { G.ev.push({ k: 'lessonok', n: D.n, need: st.need }); return; }
  D.i++; D.n = 0; if (D.i >= D.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.lessonEnd = true; G.lessonWait = 1.4; } else { G.ev.push({ k: 'lessonnext' }); G.lessonWait = 1.4; } }
// ---------- for the robots ----------
// BLIND: two thumbs that do not look: hold the stick some way (or let go), tap PASS, tap or hold SHOOT, BURST
const BLIND = { m: G => { const R = Math.random; if (R() < 0.2) setStick(G, 0, 0); else { const a = R() * TAU; setStick(G, Math.cos(a), Math.sin(a)); } }, p: G => btnPass(G), k: G => { shootDown(G); shootUp(G); }, h: G => { if (me(G).wind) shootUp(G); else shootDown(G); }, b: G => btnBurst(G) };
// a player who looks: plays your man with the team's own brain, a moment late and a little off (react, acc)
function honest(G, o, mem) { const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random, u = G.puck, p = me(G);
  if (G.over || G.pause > 0 || G.lessonWait) { ACT.setStick(G, 0, 0); return; }
  if (G.face) { const F = G.face; if (F.t >= F.drop + react * 0.9 + R() * 0.05) ACT.faceTap(G); return; }
  if (p.wind) { if (p.wind > mem.windTo) ACT.shootUp(G); return; }
  if (G.t < (mem.next || 0)) return; mem.next = G.t + 0.08 + react * 0.4;
  if (u.own === p) { const gx = GX, dg = Math.hypot(gx - p.x, p.z), nf = nearestFoe(G, p), st = lessonNow(G), gk = G.P[4];
    if (st && st.id === 'pass') { const q = bestTarget(G, p, { x: 1, z: 0 }); if (q) { ACT.pass(G, p, { x: q.x - p.x, z: q.z - p.z }); return; } }
    const slap = st && st.id === 'slap' || (nf > 3.5 && dg > 7 && R() < 0.4);
    if (dg < (slap ? 11 : 8.5) && p.x < GX - 1.2 && Math.abs(p.z) < 6 && (nf > 1.4 || dg < 4.5) && G.t - (p.gotAt || 0) > 0.4) { const aim = (gk.z > 0 ? -1 : 1) * (R() < acc ? 1 : -1); ACT.setStick(G, GX - p.x, aim * (GW2 - 0.2) - p.z); ACT.shootDown(G); if (slap) mem.windTo = 0.4 + R() * 0.3; else ACT.shootUp(G); return; }
    if (nf < 2 || (nf < 3.5 && R() < 0.3)) { let q = bestTarget(G, p, { x: 1, z: 0 }); if (q && R() > acc) q = null; if (q) { ACT.pass(G, p, { x: q.x - p.x, z: q.z - p.z }); return; } }
    let ax = 0, az = 0; for (const f of team(G, 1)) { if (f.role === 'g') continue; const d = dist(f, p); if (d < 5 && f.x > p.x - 1.5) { ax += (p.x - f.x) / (d * d); az += (p.z - f.z) / (d * d); } }
    const tx = (GX - 4 - p.x) * 0.2 + ax * 2, tz = az * 4 - p.z * 0.12 * (1 + (R() - 0.5) * (1 - acc)); ACT.setStick(G, tx, tz); if (nf > 4 && p.st > 0.6 && dg > 10 && R() < 0.2) ACT.btnBurst(G); return; }
  if (u.own && u.own.t === 1) { const o2 = u.own; let near = null, nd = 1e9; for (const q of team(G, 0)) { if (q.role === 'g') continue; const d = dist(q, o2); if (d < nd) { nd = d; near = q; } }
    if (near && near !== p && dist(p, o2) > nd + 3) { ACT.switchNear(G); return; }
    const d = dist(p, o2); if (d < 1.5 && R() < acc) { ACT.poke(G, p); return; }
    const tx = o2.x + o2.vx * 0.25 - 0.8, tz = o2.z + o2.vz * 0.25; ACT.setStick(G, tx - p.x, tz - p.z); if (d > 5 && p.st > 0.5 && R() < 0.15) ACT.btnBurst(G); return; }
  if (!u.own) { const d = Math.hypot(u.x - p.x, u.z - p.z); let near = null, nd = 1e9; for (const q of team(G, 0)) { if (q.role === 'g') continue; const dd = Math.hypot(q.x - u.x, q.z - u.z); if (dd < nd) { nd = dd; near = q; } }
    if (u.to && u.to.t === 0 && u.to !== p && u.to.role !== 'g') { G.ctrl = u.to.i; return; } if (u.to === p) { ACT.setStick(G, 0, 0); if (G.queued == null && u.kind === 'pass' && Math.hypot(GX - p.x, p.z) < 9 && Math.abs(p.z) < 5 && R() < acc * 0.6) { ACT.setStick(G, GX - p.x, (G.P[4].z > 0 ? -1 : 1) * (GW2 - 0.2) - p.z); ACT.shootDown(G); } return; } if (near && near !== p && d > nd + 3) { ACT.switchNear(G); return; }
    ACT.setStick(G, u.x + u.vx * 0.3 - p.x, u.z + u.vz * 0.3 - p.z); return; }
  ACT.setStick(G, 0, 0); }
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.face = null; G.score[0] = G.score[1] + 1; finish(G, true); }

// what the robot would do now, without doing it (tools/dry_plan.py): the tutorial shows this move
const ACT_REAL = { pass, poke, shootDown, shootUp, switchNear, btnBurst, faceTap, setStick }; let ACT = ACT_REAL;
function dryPlan(G, o, mem) { let got = null; const rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { if (!got && !(a.length > 2 && a.slice(1).every(v => v === 0 || v === false))) got = [n, ...a.slice(1)]; return true; };      /* (a stick at rest, all its numbers 0, is not a move; a first bed, number 0, is) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return got; }
