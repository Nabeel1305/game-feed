
// ===================== PART 3: boarding (no drawing) =====================
// One bar, the tide of the fight: 0 = your crew breaks, 1 = they give up this part of the ship. It starts each part at one half.
const FIGHT = { SLICE: 9, STAB: 6, RIP_STAB: 2.4, RIP_SLICE: 1.6, OPEN: 1.5, RELOAD: 4, DODGE: 0.45, DODGE_CD: 0.8, GROUND: 0.02, IDLE: 4.5, SLIDE: 0.02, EYE: 0.27,
  TURN_UP: 1.5, TURN_MAX: 4, TURN_FADE: 8, GUESS: 0,
  KNOCK: 0.42, FOOT_BACK: 0.3, COUNTER: 0.4, BREAK: 0.65, SET: 1.3, BRK_FADE: 10 };      // hitting his sword: each blow knocks his footing; broken, he reels and is open; then he is set for a moment      // a blow at a man on guard: he turns it and cuts you (a share of one of his blows), harder each time you do it again
const TYPES = {
  sailor:  { mul: 0.9,  shot: 0,   heavy: 0.6, title: 'Sailor' },
  bosun:   { mul: 1.08, shot: 0,   heavy: 1.4, title: 'Bosun' },
  marine:  { mul: 1.0,  shot: 1,   heavy: 0.7, title: 'Marine' },
  officer: { mul: 1.15, shot: 0.7, heavy: 1.0, title: 'Lieutenant' },
  mcapt:   { mul: 1.25, shot: 0.6, heavy: 1.3, title: 'Captain', capt: 1 },
  ncapt:   { mul: 1.35, shot: 1,   heavy: 1.2, title: 'Captain', capt: 1 }
};
// Where his cuts come from (degrees: 180 = from your left, -90 = from above, 0 = from your right; and how far each may stray).
// The first expeditions have two plain sides. A block must meet the blade on the side it comes from (judgeBlock), so that
// no one stroke, repeated without looking, blocks them all.
const SIDES2 = [[-150, 10], [-30, 10]];
const CUTS = [[-155, 5], [-125, 5], [-90, 6], [-55, 5], [-25, 5]];
const cutPool = N => N <= 2 ? SIDES2 : N < 6 ? CUTS : N < 14 ? CUTS.concat([[-180, 4], [0, 4]]) : CUTS.concat([[-180, 4], [0, 4], [150, 5], [30, 5]]);
const STAGE_N = ['ON DECK', 'BELOW DECK', "THE CAPTAIN'S CABIN"];
const fu = () => Math.min(W, H * 0.6) / 390;
const YOU = () => ({ x: W / 2, y: H * 0.52 });

// what he looks like (rule 9: mixed from long lists)
const SKIN = ['#f1c9a5', '#e6b48c', '#d49a6a', '#c28154', '#a8683c', '#8b5230', '#6f4026', '#5a3320', '#edc2a0', '#dba77c'];
const HAIR = ['#1c1410', '#2e2018', '#4a3020', '#6b4a2a', '#8a6a3a', '#b08a52', '#7a7a78', '#c9c4b8', '#5a2a16', '#2a2a30'];
const SHIRT = ['#e8e0cf', '#d9cdb4', '#c9d3d6', '#b9c4a8', '#d8b9a0', '#a9b7c9', '#e3d6b0', '#c4a98a'];
const VEST = ['#5a3a22', '#3f4a3a', '#6b2f2a', '#2f3f52', '#4a4038', '#70552f', '#3a2f4a', '#254040'];
const SASH = ['#a8322a', '#c98a2a', '#2f6a5a', '#3a4f8a', '#7a2f6a', '#d0c8b0'];
function mkLook(R, type, navy) {
  const L = { skin: pick(R, SKIN), hair: pick(R, HAIR), build: 0.93 + R() * 0.17, tall: 0.97 + R() * 0.07, beard: R() < 0.5 ? (R() < 0.5 ? 2 : 1) : 0, scar: R() < 0.18, patch: R() < 0.07, ring: R() < 0.3, seed: (R() * 1e6) | 0 };
  if (type === 'marine') Object.assign(L, { coat: '#b3271f', trim: '#f2ead8', hat: 'shako', belt: 1, beard: R() < 0.25 ? 1 : 0, breeches: '#e9e3d2', sword: 'sabre' });
  else if (type === 'officer') Object.assign(L, { coat: '#1f3157', trim: '#e2b84a', hat: 'bicorne', epaul: 1, beard: R() < 0.3 ? 1 : 0, breeches: '#e9e3d2', sword: 'sabre' });
  else if (type === 'ncapt') Object.assign(L, { coat: '#172848', trim: '#f0c552', hat: R() < 0.5 ? 'bicorne' : 'tricorne', epaul: 2, breeches: '#efe9da', sword: 'sabre', sashC: '#a8322a', wig: R() < 0.4 });
  else if (type === 'mcapt') Object.assign(L, { coat: pick(R, ['#5b3a1e', '#4a2f3a', '#2f4a40', '#5a4a2a', '#3a3a4a']), trim: '#c9a24a', hat: 'tricorne', breeches: pick(R, ['#3a3028', '#5a5040', '#2f2f38']), sword: 'cutlass', beard: R() < 0.75 ? 2 : 1, sashC: pick(R, SASH) });
  else Object.assign(L, { shirt: pick(R, SHIRT), vest: R() < 0.6 ? pick(R, VEST) : null, hat: pick(R, ['bandana', 'bandana', 'cap', 'none', 'none', 'straw', 'tricorne']), hatC: pick(R, SASH), sashC: R() < 0.6 ? pick(R, SASH) : null, breeches: pick(R, ['#4a4034', '#5c5a4c', '#3a4452', '#6a5a40', '#2f3a34']), stripes: R() < 0.3, sword: type === 'bosun' ? 'axe' : 'cutlass', big: type === 'bosun' });
  if (type === 'bosun') { L.build *= 1.12; L.beard = 2; }
  return L;
}
function mkMan(G, type) {
  const c = G.cfg, T = TYPES[type], P = G.prize, s = P.K.crew * T.mul, R = G.rnd, capt = !!T.capt, hp0 = c.hp * s * (capt ? 2.3 : 1);
  return { type, T, capt, look: mkLook(R, type, !!P.K.navy), name: capt ? P.info.capt : T.title,
    wind: Math.max(0.3, c.windup / Math.pow(s, 0.6)), gap: c.gap / s, oParry: Math.min(0.6, c.oParry * s), oDodge: Math.min(0.3, c.oDodge * s),
    combo: Math.min(0.7, c.combo * s), feint: Math.min(0.45, c.feint * s), heavy: Math.min(0.42, c.heavy * T.heavy + (capt && c.N >= 3 ? 0.12 : 0)),
    shot: (P.K.navy || capt) && R() < c.shots * T.shot ? 1 : 0, hit: c.hit * (0.85 + 0.15 * s), hp0, hp: hp0, worth: capt ? 0.5 : c.kill,
    os: 'enter', ot: 0, z: 0.45, next: 0, atk: null, hits: 0, ph: R() * 9, lean: 0, hitT: 9, lastA: null, rec: 0.3, stag: 0.7, rip: false, ripD: 0, soft: 0, foot: 1, brk: 0, set: 0, broke: false, chainNext: 0, side: R() < 0.5 ? -1 : 1 };
}
function manGeo(F) {      // where he is on the screen: everything scales about the eye line as he steps in
  const m = F.man, f = fu(), s = f * (m ? m.z * m.look.tall : 1), ey = H * FIGHT.EYE;
  const x = W / 2 + (m ? (Math.sin(F.t * 1.1 + m.ph) * 9 + m.lean * 30 + (1 - m.z) * m.side * 150) * f : 0);
  return { x, s, ey, head: { x, y: ey - 4 * s, r: 25 * s }, chest: { x, y: ey + 88 * s, r: 46 * s }, belly: { x, y: ey + 166 * s, r: 42 * s } };
}
function spawnMan(G) {
  const F = G.fight, R = G.rnd, f = G.cfg.f; let type;
  if (F.stage === 2) type = F.navy ? 'ncapt' : 'mcapt';
  else if (F.navy) type = F.stage === 0 ? (R() < 0.72 ? 'marine' : 'sailor') : (f > 5 && R() < 0.3 ? 'officer' : R() < 0.6 ? 'marine' : 'sailor');
  else type = f > 3 && R() < (F.stage ? 0.4 : 0.2) ? 'bosun' : 'sailor';
  F.man = mkMan(G, type); F.men++; G.ev.push({ k: 'man', type });
}
function startBoarding(G) {
  const P = G.prize;
  G.fight = { stage: -1, t: 0, tide: 0.5, shown: 0.5, man: null, phase: 'intro', pt: 0, dodge: null, dodgeCd: 0, pBusy: 0, pStun: 0, lastSwing: -9, lastStroke: -9, lastTry: 0,
    aim: null, loaded: true, reload: 0, reloading: false, chain: 0, dropped: 0, turnN: 0, turnT: -9, recentAtk: [], lastKind: '', sameN: 0, navy: !!P.K.navy, ship: P.info.name, capt: P.info.capt, men: 0, hurtT: 9, pAnim: null };
  nextStage(G);
}
function nextStage(G) {
  const F = G.fight; F.stage++; F.tide = 0.5; F.shown = 0.5; F.peak = 0.5; F.phase = 'intro'; F.pt = 0; F.man = null; F.dodge = null; F.aim = null; F.men = 0; F.lastTry = F.t; F.recentAtk.length = 0; F.sameN = 0; F.turnN = 0;
  G.ev.push({ k: 'stage', i: F.stage }); spawnMan(G);
}

// ---------- his attacks ----------
function makeAtk(G, m, kind) {
  const R = G.rnd, c = YOU(), rad = Math.min(W, H * 0.6) * 0.5, N = G.N;
  if (kind === 'cut' || kind === 'heavy') {
    const pool = cutPool(N); let i = (R() * pool.length) | 0; if (pool.length > 2 && i === m.lastI) i = (R() * pool.length) | 0; m.lastI = i;      // (two sides: a plain coin each time, nothing to count on)
    const q = (pool[i][0] + (R() * 2 - 1) * pool[i][1]) * Math.PI / 180;
    return { ang: q, sec: (N <= 2 ? 50 : 40) * Math.PI / 180, sx: c.x + Math.cos(q) * rad, sy: c.y + Math.sin(q) * rad, ex: c.x - Math.cos(q) * rad, ey: c.y - Math.sin(q) * rad };
  }
  if (kind === 'thrust') return { px: c.x + (R() * 2 - 1) * 75 * fu(), py: c.y - (R() * 0.9 - 0.2) * 90 * fu() };
  return {};
}
function startAttack(G, m, o = {}) {
  const R = G.rnd, F = G.fight; let kind = o.kind;
  if (!kind) kind = m.shot && !o.chain && R() < 0.3 ? 'shot' : !o.chain && R() < m.heavy ? 'heavy' : G.N >= 2 && R() < 0.32 ? 'thrust' : 'cut';
  const wind = kind === 'shot' ? Math.max(0.85, m.wind * 1.6) : kind === 'heavy' ? Math.max(0.5, m.wind * 1.4) : Math.max(0.3, m.wind * (o.fast || 1) * (0.9 + 0.2 * R()));
  m.atk = Object.assign({ kind, wind, mul: o.mul || 1, chain: o.chain || 0, feint: kind === 'cut' && !o.chain && !o.fast && R() < m.feint, feinted: false, result: null, tried: false, why: '' }, makeAtk(G, m, kind));
  m.os = 'windup'; m.ot = 0; m.hits = 0; m.chainNext = 0; m.open = false;
  G.ev.push({ k: 'windup', kind, wind });
}
function parried(G, m, perfect) {      // your stroke met his blade: the clash happens there and then
  const F = G.fight, c = G.cfg, A = m.atk; A.result = perfect ? 'perfect' : 'parried'; m.ot = 0; F.chain++; m.chainNext = 0;
  if (perfect) { m.os = 'stagger'; m.stag = 0.75 + 0.5 * c.e; }      // a late, clean block: he is off balance, time for a riposte
  else { m.os = 'recover'; m.rec = 0.45 + 0.25 * c.e; m.open = true; if (A.chain < 2 && G.rnd() < m.combo) m.chainNext = A.chain + 1; }      // blocked: he is open for a moment, time for one blow
  G.ev.push({ k: 'parry', perfect, chain: F.chain, x: A.cx, y: A.cy });
}
function resolve(G, m) {      // his blow arrives: you dodged it, or it lands
  const F = G.fight, c = G.cfg, A = m.atk; A.result = F.dodge && F.dodge.t <= FIGHT.DODGE ? 'dodged' : 'hit'; m.ot = 0; if (A.kind === 'shot') m.shot = 0;
  if (A.result === 'dodged') {
    // A dodge saves you; it is the block that opens him. (A dodge thrown without looking is in the right place a third of the
    // time, whatever side his blow comes from: when it opened him too, dodge-and-cut on a steady beat won the first expedition.)
    // A red blow cannot be blocked, so dodging that one is what throws him off balance; a dodged shot leaves him fumbling.
    if (A.kind === 'heavy') { m.os = 'stagger'; m.stag = 0.9; } else { m.os = 'recover'; m.rec = A.kind === 'shot' ? 0.8 : 0.42; m.open = A.kind === 'shot'; }
    G.ev.push({ k: 'dodged', kind: A.kind });
  } else {
    const missed = !!A.tried, caught = F.t - F.lastSwing < 0.3 || missed || !!F.aim || F.reloading;      // swinging at him, or at the air, when his blow lands: it lands hard
    const d = m.hit * A.mul * (A.kind === 'heavy' ? 1.6 : A.kind === 'shot' ? 1.5 : 1) * (missed ? 2.1 : caught ? 1.6 : 1);
    F.tide -= d; G.took.wounds++; F.chain = 0; F.pStun = 0.3; F.hurtT = 0; if (F.aim) { F.aim = null; G.ev.push({ k: 'spoiled' }); }
    m.os = 'recover'; m.rec = 0.42; m.open = false; if (A.chain < 2 && G.rnd() < m.combo) m.chainNext = A.chain + 1;
    G.ev.push({ k: 'hurt', kind: A.kind, caught, missed, why: A.why, d });
  }
}
function manThink(G, m, dt) {
  const F = G.fight, R = G.rnd; m.ot += dt; m.hitT += dt; m.lean *= Math.pow(0.02, dt);
  switch (m.os) {
    case 'enter': m.z = Math.min(1, 0.45 + 0.55 * easeOut(Math.min(1, m.ot / 0.9))); if (m.ot >= 0.9 && F.phase === 'fight') { m.z = 1; m.os = 'guard'; m.ot = 0; m.next = m.gap * (0.45 + 0.4 * R()); } break;
    case 'guard': if (F.phase !== 'fight') break; m.soft -= dt; m.set -= dt; m.foot = Math.min(1, m.foot + dt * FIGHT.FOOT_BACK); m.next -= dt; if (m.next <= 0) startAttack(G, m); break;
    case 'windup': { const A = m.atk;
      if (A.feint && !A.feinted && m.ot >= A.wind * 0.45) { A.feinted = true; const keep = A.ang; let g = makeAtk(G, m, 'cut'), n = 0; while (Math.abs(wrapA(g.ang - keep)) < 0.7 && n++ < 6) g = makeAtk(G, m, 'cut'); Object.assign(A, g); A.tried = false; G.ev.push({ k: 'feint' }); }
      if (m.ot >= A.wind) { m.os = 'strike'; m.ot = 0; G.ev.push({ k: 'strike', kind: A.kind }); } break; }
    case 'strike': if (m.ot >= 0.1) resolve(G, m); break;
    case 'recover': if (m.ot >= m.rec) { m.soft = m.open ? 0.3 : 0; m.open = false; if (m.chainNext && F.phase === 'fight') startAttack(G, m, { chain: m.chainNext, fast: 0.74 }); else { m.os = 'guard'; m.ot = 0; m.next = m.gap * (0.75 + 0.5 * R()); } } break;
    case 'stagger': if (m.ot >= m.stag) { m.os = 'guard'; m.ot = 0; m.soft = 0.3; if (m.broke) { m.broke = false; m.set = FIGHT.SET; m.foot = 1; } m.next = m.gap * (0.4 + 0.4 * R()); } break;
    case 'hurt': if (m.ot >= 0.22) { m.os = 'guard'; m.ot = 0; m.soft = 0.3; m.next = Math.max(m.next, m.gap * (0.15 + 0.6 * R())); } break;      // when he comes back at you is his secret (it used to be a fixed beat after every hit, and a blind rhythm could ride it)
    case 'block': if (F.phase === 'fight' && !m.rip) m.next -= dt; if (m.cnt && m.ot >= 0.16) { m.cnt = false; if (F.phase === 'fight') { startAttack(G, m, { fast: 0.8 }); break; } } if (m.rip) { if (m.ot >= 0.14) { m.os = 'riposte'; m.ot = 0; } } else if (m.ot >= 0.26) { m.os = 'guard'; m.ot = 0; m.next = Math.max(0.25, m.next); } break;
    case 'riposte':      // he turned your blow, and his blade comes straight back along yours: there is no stopping it
      if (m.rip && m.ot >= 0.1) { m.rip = false; if (F.phase === 'fight') { const d = m.ripD; F.tide -= d; G.took.wounds++; F.chain = 0; F.hurtT = 0; G.ev.push({ k: 'turned', d, n: F.turnN }); } }
      if (m.ot >= 0.24) { m.os = 'guard'; m.ot = 0; m.next = Math.max(0.3, m.next); } break;
    case 'evade': if (m.ot >= 0.32) { m.os = 'guard'; m.ot = 0; m.soft = 0.3; m.next = Math.max(0.2, m.next); } break;
    case 'down': if (m.ot >= 0.9 && F.phase === 'fight') spawnMan(G); break;
  }
}

// ---------- your moves ----------
function ptSeg(px, py, ax, ay, bx, by) { const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy || 1, u = clamp(((px - ax) * dx + (py - ay) * dy) / L, 0, 1), x = ax + dx * u, y = ay + dy * u; return { d: Math.hypot(px - x, py - y), u, x, y }; }
function strokeVsPath(p1x, p1y, p2x, p2y, ax, ay, bx, by) {      // where your stroke comes closest to the path of his blade: how near, and how far along his path
  const rx = p2x - p1x, ry = p2y - p1y, sx = bx - ax, sy = by - ay, den = rx * sy - ry * sx;
  if (Math.abs(den) > 1e-6) { const t = ((ax - p1x) * sy - (ay - p1y) * sx) / den, u = ((ax - p1x) * ry - (ay - p1y) * rx) / den; if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return { d: 0, u, x: ax + sx * u, y: ay + sy * u }; }
  let best = ptSeg(p1x, p1y, ax, ay, bx, by); const b2 = ptSeg(p2x, p2y, ax, ay, bx, by); if (b2.d < best.d) best = b2;
  for (const e of [[ax, ay, 0], [bx, by, 1]]) { const q = ptSeg(e[0], e[1], p1x, p1y, p2x, p2y); if (q.d < best.d) best = { d: q.d, u: e[2], x: e[0], y: e[1] }; }
  return best;
}
function judgeBlock(G, A, ax, ay, bx, by) {
  // A block must meet his blade where it is: your stroke has to cross the drawn part of a cut, on the side it comes from, or
  // pass through the ring of a thrust. "On its side" = the middle of your stroke lies out towards where the cut starts. So a
  // stroke through the middle of him, or clean across the screen, blocks nothing, and no one stroke blocks both sides.
  const f = fu(), e = G.cfg.e, c = YOU(), mx = (ax + bx) / 2 - c.x, my = (ay + by) / 2 - c.y;
  if (A.kind === 'cut') {
    const q = strokeVsPath(ax, ay, bx, by, A.sx, A.sy, A.ex, A.ey); A.cx = q.x; A.cy = q.y;
    if (q.d > (20 + 14 * e) * f) { A.why = 'far'; return false; }
    if (q.u > 0.47 || Math.hypot(mx, my) < 24 * f || Math.abs(wrapA(Math.atan2(my, mx) - A.ang)) > A.sec) { A.why = 'side'; return false; }
    return true;
  }
  const q = ptSeg(A.px, A.py, ax, ay, bx, by), r = (30 + 16 * e) * f; A.cx = A.px; A.cy = A.py;
  if (q.d > r || Math.hypot((ax + bx) / 2 - A.px, (ay + by) / 2 - A.py) > r * 2.4) { A.why = 'far'; return false; }
  return true;
}
const fightOn = F => F && (F.phase === 'fight' || F.phase === 'intro');
function fStroke(G, ax, ay, bx, by) {
  const F = G.fight; if (!fightOn(F) || F.aim || F.reloading || F.pStun > 0) return;
  const m = F.man, s = fu(), dx = bx - ax, dy = by - ay; if (Math.hypot(dx, dy) < 30 * s) return;
  if (dy > 60 * s && Math.abs(dx) < dy * 0.6 && ay > H * 0.6) { fDodge(G); return; }
  if (m && (m.os === 'windup' || m.os === 'strike') && m.atk.kind !== 'shot') {      // while his blow is coming, a stroke is a block
    // One block per blow: the first stroke you make at it is where your blade goes. Meet his blade and the clash happens at
    // once; miss it and there is no second try at this blow (you can still dodge it). So a string of strokes covering both
    // sides, thrown without looking, blocks no better than a coin, and a blade that was just flung about blocks nothing.
    const A = m.atk, flail = F.t - F.lastStroke < (G.cfg.e > 0.5 ? 0.2 : 0.4), first = !A.tried;
    F.lastStroke = F.t; F.pAnim = { kind: 'guard', t: 0, dur: 0.3, ax, ay, bx, by };
    if (A.kind === 'heavy') { G.ev.push({ k: 'guard', ok: false, heavy: true }); return; }
    if (!first) { G.ev.push({ k: 'guard', ok: false, why: 'again' }); return; }
    // ...and a stroke thrown the instant he starts, before anyone could have seen where his blade is going, is a guess.
    const guess = m.os === 'windup' && m.ot < Math.min(FIGHT.GUESS, A.wind * 0.3);
    A.tried = true; A.why = flail ? 'flail' : guess ? 'guess' : '';
    const ok = !flail && !guess && judgeBlock(G, A, ax, ay, bx, by);
    if (ok && A.feint && !A.feinted) { A.why = 'feint'; G.ev.push({ k: 'guard', ok: false, why: 'feint' }); return; }      // you bit on a feint
    G.ev.push({ k: 'guard', ok, why: A.why });
    if (ok) { const tl = m.os === 'windup' ? A.wind - m.ot + 0.1 : 0.1 - m.ot; parried(G, m, tl <= G.cfg.parryWin * 0.38); }
    return;
  }
  pAttack(G, 'slice', ax, ay, bx, by);
}
function fPoke(G, x, y) { const F = G.fight; if (!fightOn(F) || F.aim || F.reloading || F.pStun > 0) return; pAttack(G, 'stab', x, y, x, y); }
function pAttack(G, kind, ax, ay, bx, by) {
  const F = G.fight, m = F.man, c = G.cfg, R = G.rnd; if (F.phase !== 'fight') return;
  let where = null, hx = 0, hy = 0;
  if (m && m.os !== 'down' && m.os !== 'yield' && m.z >= 0.85) { const g = manGeo(F), pad = 10 * g.s;
    for (const w of ['head', 'chest', 'belly']) { const q = ptSeg(g[w].x, g[w].y, ax, ay, bx, by); if (q.d <= g[w].r + (kind === 'stab' ? pad : 0)) { where = w; hx = q.x; hy = q.y; break; } } }
  // Your arm is still coming back from your last blow: nothing happens... unless this one reaches a man on guard. That is never
  // free (a stroke at the air used to keep your arm "busy", and blows thrown under its cover cost nothing).
  if (F.pBusy > 0 && !(where && m.os === 'guard' && !(m.soft > 0) && m.set > 0)) return;
  F.pBusy = kind === 'slice' ? 0.42 : 0.3; F.lastSwing = F.lastStroke = F.t; F.pAnim = { kind, t: 0, dur: kind === 'slice' ? 0.3 : 0.24, ax, ay, bx, by };
  G.ev.push({ k: 'swing', kind });
  if (!m || m.os === 'down' || m.os === 'yield' || m.z < 0.85) return;
  if (!where) { G.ev.push({ k: 'whiff' }); return; }
  F.lastTry = F.t;
  F.recentAtk = F.recentAtk.filter(t => F.t - t < 2.2); F.recentAtk.push(F.t);
  F.sameN = kind === F.lastKind ? F.sameN + 1 : 1; F.lastKind = kind;
  const base = kind === 'slice' ? FIGHT.SLICE : FIGHT.STAB, ang = Math.atan2(by - ay, bx - ax);
  // Spamming cannot win. Your blows land only on a man you have opened up: for a moment after your block, or while he is off
  // balance after a late, clean block or after you dodged his red blow (the riposte). A man on guard turns your blow aside
  // and cuts you as he does it: it costs you, and it costs more each time you do it again. Only time wipes that out (one step
  // every eight seconds): a slip now and then is cheap, a habit is ruinous, at any speed.
  if (m.os === 'stagger' && m.broke) { land(G, base * 1.1, { kind, where, x: hx, y: hy, ang }); return; }      // his footing broken: hit him, hit him
  if (m.os === 'stagger') { land(G, base * (kind === 'stab' ? FIGHT.RIP_STAB : FIGHT.RIP_SLICE) * (1 + 0.08 * Math.min(F.chain, 5)), { kind, where, x: hx, y: hy, ang, rip: true }); return; }
  if (m.os === 'recover' && m.open) {
    if (R() < m.oDodge) { m.open = false; m.os = 'evade'; m.ot = 0; m.lean = (bx >= ax ? 1 : -1) * (kind === 'stab' ? (R() < 0.5 ? 1 : -1) : 1); G.ev.push({ k: 'evaded' }); return; }
    land(G, base * FIGHT.OPEN, { kind, where, x: hx, y: hy, ang }); return;
  }
  if (m.os === 'windup' || m.os === 'strike') { G.ev.push({ k: 'late', x: hx, y: hy }); return; }      // his blow is already coming: yours is knocked aside
  m.bx = hx; m.by = hy;
  if (m.os !== 'guard' || m.soft > 0) { if (m.os !== 'block' && m.os !== 'riposte') { m.os = 'block'; m.ot = 0; m.rip = false; } G.ev.push({ k: 'blocked', x: hx, y: hy }); return; }
  // You can start it: a blow at a man on guard hits his sword and knocks him back a step. Two or three in a row and his footing
  // breaks: he reels, open, for a moment (hit him, hit him). Then he is set again, and while he is set a blow at his guard is
  // turned and he cuts you for it, harder each time. Each break is harder to win than the last (fading with time). And his own
  // blows keep coming whenever he likes: swinging when one lands makes it land hard. So: attack in bursts, stop, block.
  if (!(m.set > 0)) {
    m.brk = Math.max(0, m.brk - (F.t - (m.brkT || F.t)) / FIGHT.BRK_FADE); m.brkT = F.t;
    m.foot -= FIGHT.KNOCK / (1 + 0.5 * m.brk) * (1 + 0.3 * G.cfg.e);
    if (m.foot <= 0) { m.foot = 1; m.brk++; m.os = 'stagger'; m.ot = 0; m.stag = FIGHT.BREAK * (1 + 0.3 * G.cfg.e); m.broke = true; G.ev.push({ k: 'guardbreak', x: hx, y: hy }); return; }
    m.os = 'block'; m.ot = 0; m.rip = false; G.ev.push({ k: 'knocked', x: hx, y: hy });
    if (R() < FIGHT.COUNTER) m.cnt = true;      // ...and sometimes he answers straight off the parry: watch for it, and block it
    return;
  }      // he is busy (hurt, slipping, stepping back) or only just back on guard: turned, and no more
  m.os = 'block'; m.ot = 0; m.rip = true; m.ripD = G.cfg.turn * Math.pow(FIGHT.TURN_UP, Math.min(F.turnN, FIGHT.TURN_MAX)); F.turnN = Math.min(F.turnN, FIGHT.TURN_MAX) + 1; F.turnT = F.t;
  F.pStun = 0.4; F.pBusy = 0.4;      // your blade is knocked wide: nothing you can do about what comes next
  G.ev.push({ k: 'blocked', x: hx, y: hy, rip: true, n: F.turnN });
}
function land(G, dmg, o) {
  const F = G.fight, m = F.man; if (o.where === 'head') dmg *= 1.2;
  dmg = Math.min(dmg, m.hp); m.hp -= dmg; m.hits++; m.hitT = 0; F.tide = Math.min(1, F.tide + m.worth * dmg / m.hp0);
  G.ev.push(Object.assign({ k: 'cut', dmg }, o));
  if (m.hp <= 0.01) { m.hp = 0; if (m.capt) F.tide = 1; else { m.os = 'down'; m.ot = 0; m.fall = o.x < manGeo(F).x ? 1 : -1; F.dropped++; G.ev.push({ k: 'down' }); } }
  else if (!o.trade && m.os !== 'stagger') { m.os = 'hurt'; m.ot = 0; m.open = false; m.chainNext = 0; }
  stageCheck(G);
}
function stageCheck(G) {
  const F = G.fight, m = F.man;
  if (F.phase === 'fight' && F.tide >= 0.9999) { F.tide = 1; F.phase = 'won'; F.pt = 0; F.aim = null; if (m && m.os !== 'down') { m.os = 'yield'; m.ot = 0; m.atk = null; } G.ev.push({ k: 'stagewon', i: F.stage }); }
}
function fDodge(G) {
  const F = G.fight; if (!F || F.phase !== 'fight' || F.dodgeCd > 0 || F.aim || F.reloading || F.pStun > 0) return;
  F.dodge = { t: 0 }; F.dodgeCd = FIGHT.DODGE_CD; F.tide = Math.max(0.01, F.tide - FIGHT.GROUND); G.ev.push({ k: 'dodge' });
}
// the pistol: one ball; hold to raise it, drag the sights onto him as they settle, let go to fire. It never comes up pointing at
// him (it used to: hold, let go, and a man dropped, three times over, without looking): the sights start a little way off,
// on any side, and it is your thumb that brings them on.
function fAim(G, x, y) { const F = G.fight; if (!F || F.phase !== 'fight' || !F.loaded || F.aim || F.reloading || F.pStun > 0) return false; let bx = 0, by = 0; const g = manGeo(F), cx = W / 2, cy = H * FIGHT.EYE + 80 * fu(), off = c => Math.hypot(cx + bx - c.x, cy + by - c.y) > c.r + 18 * fu();
  for (let i = 0; i < 12; i++) { const q = G.rnd() * TAU, r = (66 + 8 * G.rnd()) * fu(); bx = Math.cos(q) * r; by = Math.sin(q) * r; if (off(g.head) && off(g.chest) && off(g.belly)) break; }      // (never on him to begin with)
  F.aim = { t: 0, ox: x, oy: y, dx: 0, dy: 0, ph: G.rnd() * 9, bx, by }; G.ev.push({ k: 'raise' }); return true; }
function fAimMove(G, x, y) { const a = G.fight && G.fight.aim; if (a) { a.dx = (x - a.ox) * 1.3; a.dy = (y - a.oy) * 1.3; } }
function aimAt(F) { const a = F.aim, f = fu(), A = f * (50 * Math.exp(-a.t / 0.5) + 6); return { x: W / 2 + a.bx + a.dx + A * Math.sin(a.t * 2.9 + a.ph), y: H * FIGHT.EYE + 80 * f + a.by + a.dy + A * 0.8 * Math.sin(a.t * 3.7 + a.ph * 1.7), A }; }
function fFire(G) {
  const F = G.fight, a = F && F.aim; if (!a) return;
  if (a.t < 0.3 || F.phase !== 'fight') { F.aim = null; G.ev.push({ k: 'lower' }); return; }
  const p = aimAt(F), m = F.man; F.aim = null; F.loaded = false; G.shots--; F.pBusy = 0.5; F.lastTry = F.t; let res = 'miss';
  if (m && m.os !== 'down' && m.os !== 'yield' && m.z >= 0.8) {
    const g = manGeo(F), d = (c) => Math.hypot(p.x - c.x, p.y - c.y);
    if (d(g.head) <= g.head.r) res = 'head'; else if (d(g.chest) <= g.chest.r * 0.62) res = 'heart'; else if (d(g.chest) <= g.chest.r || d(g.belly) <= g.belly.r) res = 'body';
    if (res !== 'miss') {
      const vital = res !== 'body', dmg = m.capt ? m.hp0 * (vital ? 0.3 : 0.15) : vital ? m.hp : m.hp0 * 0.6;
      G.ev.push({ k: 'shot', x: p.x, y: p.y, res });
      if (m.os !== 'windup' && m.os !== 'strike') { m.os = 'stagger'; m.ot = 0; m.stag = m.capt ? (vital ? 1.3 : 0.7) : 0.9; }
      land(G, dmg, { kind: 'ball', where: res === 'head' ? 'skull' : 'chest', x: p.x, y: p.y, ang: 0, trade: true }); return;
    }
  }
  G.ev.push({ k: 'shot', x: p.x, y: p.y, res });
}
function fReload(G, on) {
  const F = G.fight; if (!F) return;
  if (on) { if ((fightOn(F) || F.phase === 'won') && !F.loaded && G.shots > 0 && !F.aim && !F.reloading) { F.reloading = true; F.reload = 0; G.ev.push({ k: 'reload' }); } }
  else if (F.reloading) { F.reloading = false; F.reload = 0; G.ev.push({ k: 'reloadstop' }); }
}
function boardStep(G, dt) {
  const F = G.fight, m = F.man; G.t += dt; G.pt += dt; F.t += dt; F.pt += dt; F.hurtT += dt;
  F.pBusy = Math.max(0, F.pBusy - dt); F.pStun = Math.max(0, F.pStun - dt); F.dodgeCd = Math.max(0, F.dodgeCd - dt); F.turnN = Math.max(0, F.turnN - dt / FIGHT.TURN_FADE);
  if (F.dodge) { F.dodge.t += dt; if (F.dodge.t > 0.6) F.dodge = null; }
  if (F.pAnim) { F.pAnim.t += dt; if (F.pAnim.t >= F.pAnim.dur) F.pAnim = null; }
  if (F.aim) F.aim.t += dt;
  if (F.reloading) { F.reload += dt; if (F.reload >= FIGHT.RELOAD) { F.loaded = true; F.reloading = false; F.reload = 0; G.ev.push({ k: 'loaded' }); } }
  if (m) manThink(G, m, dt);
  switch (F.phase) {
    case 'intro': if (F.pt >= 1.3) { F.phase = 'fight'; F.pt = 0; F.lastTry = F.t; } break;
    case 'fight':
      if (F.t - F.lastTry > FIGHT.IDLE && F.man && F.man.os !== 'down' && F.man.os !== 'enter') F.tide -= FIGHT.SLIDE * dt;
      if (F.tide <= 0) { F.tide = 0; F.phase = 'lost'; F.pt = 0; F.aim = null; F.reloading = false; G.ev.push({ k: 'broken' }); }
      break;
    case 'won': if (F.pt >= 1.9) { if (F.stage < 2) nextStage(G); else if (!G.over) G.over = 'won'; } break;
    case 'lost': if (F.pt >= 0.8 && !G.over) G.over = 'lost'; break;
  }
  F.shown += (F.tide - F.shown) * Math.min(1, dt * 7); if (F.tide > F.peak) F.peak = F.tide;
}
function stepAll(G, dt) { if (G.over) return; if (G.phase === 'board') boardStep(G, dt); else seaStep(G, dt); }

// ---------- the haul ----------
const RANKS = [[0, 'Deckhand'], [600, 'Swab'], [1800, 'Buccaneer'], [4200, 'Corsair'], [8500, 'Quartermaster'], [15000, 'First Mate'], [26000, 'Captain'], [42000, 'Sea Wolf'], [66000, 'Scourge of the Seas'], [100000, 'Dread Pirate'], [150000, 'Pirate Lord'], [230000, 'Pirate King'], [360000, 'Legend of the Deep']];
function rankOf(g) { let i = 0; while (i + 1 < RANKS.length && g >= RANKS[i + 1][0]) i++; return { i, name: RANKS[i][1], next: RANKS[i + 1] || null, from: RANKS[i][0] }; }
function haulOf(G) {
  const P = G.prize, L = P.info.loot, lines = [], r10 = v => Math.round(v / 10) * 10;
  const deck = r10(L * 0.2), cabin = r10(L * 0.32), hold = L - deck - cabin;
  lines.push(['On deck', deck], [P.K.navy ? 'The gun deck' : 'The hold', hold], ["The captain's cabin", cabin]);
  for (const s of G.foes) if (s !== P) lines.push([(s.K.navy ? (s.alive ? 'Struck: ' : 'Sunk: ') : 'Taken: ') + s.info.name, s.info.loot]);
  return { lines, total: lines.reduce((a, l) => a + l[1], 0) };
}
function starsOf(G) { const hurt = G.took.hull / 100 + G.took.wounds * 0.07; return hurt <= 0.22 ? 3 : hurt <= 0.6 ? 2 : 1; }
