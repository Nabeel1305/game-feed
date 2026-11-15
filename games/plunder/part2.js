
// ===================== PART 2: the expedition and the sea (no drawing) =====================
// Headings: 0 = up the map; forward = (sin h, cos h); starboard (right) = (cos h, -sin h). Sides: 0 = port, 1 = starboard.
const SEA = { RANGE: 150, BALL_V: 330, ARC: 0.42, ARC_E: 0.55, E_RANGE: 135, RAKE: 1.8, BOARD_R: 46, MY_SPREAD: 0.055, PAD: 3.5 };
const MYSHIP = { navy: 0, size: 2, cls: 'Your sloop', len: 46, beam: 13, hull: 100, guns: 5, speed: 47, turn: 0.95, masts: 2 };
const KINDS = {
  trader:   { navy: 0, size: 1, cls: 'Trader',           len: 40, beam: 13,   hull: 30, guns: 0, speed: 27, turn: 0.5,  masts: 2, loot: 1.0,  crew: 0.85 },
  indiaman: { navy: 0, size: 2, cls: 'Indiaman',         len: 52, beam: 16,   hull: 40, guns: 0, speed: 26, turn: 0.45, masts: 3, loot: 1.7,  crew: 1.0 },
  galleon:  { navy: 0, size: 3, cls: 'Treasure galleon', len: 62, beam: 19,   hull: 50, guns: 0, speed: 24, turn: 0.4,  masts: 3, loot: 2.8,  crew: 1.1 },
  cutter:   { navy: 1, size: 1, cls: 'Navy cutter',      len: 38, beam: 11,   hull: 55, guns: 3, speed: 46, turn: 0.55, masts: 1, loot: 0.35, crew: 1.2 },
  brig:     { navy: 1, size: 2, cls: 'Navy brig',        len: 48, beam: 13.5, hull: 85, guns: 4, speed: 44, turn: 0.48, masts: 2, loot: 0.5,  crew: 1.3 },
  frigate:  { navy: 1, size: 3, cls: 'Frigate',          len: 58, beam: 15,   hull: 120, guns: 6, speed: 45, turn: 0.42, masts: 3, loot: 0.7,  crew: 1.38 },
  manowar:  { navy: 1, size: 4, cls: 'Man-o\'-war',      len: 72, beam: 19,   hull: 150, guns: 9, speed: 39, turn: 0.34,  masts: 3, loot: 1.0,  crew: 1.45 }
};
// names (rule 9: long lists, mixed, so they rarely repeat)
const SHIP_A = ['Golden', 'Swift', 'Proud', 'Lucky', 'Merry', 'Royal', 'Bonny', 'Faithful', 'Stout', 'Fair', 'Silver', 'Crimson', 'Gallant', 'Happy', 'Brave', 'Good', 'White', 'Scarlet', 'Sea', 'Morning', 'Evening', 'Northern', 'Southern', 'Wandering', 'Laughing', 'Dancing', 'Rising', 'Honest', 'Patient', 'Blessed', 'Summer', 'Amber', 'Gentle', 'Bold'];
const SHIP_B = ['Heron', 'Rose', 'Venture', 'Fortune', 'Mary', 'Anne', 'Dolphin', 'Pelican', 'Swan', 'Star', 'Hope', 'Providence', 'Trader', 'Lion', 'Unicorn', 'Tiger', 'Gull', 'Marlin', 'Otter', 'Lark', 'Kestrel', 'Comet', 'Dawn', 'Tide', 'Gale', 'Willow', 'Thistle', 'Lily', 'Hart', 'Stag', 'Falcon', 'Mermaid', 'Maiden', 'Queen', 'Duchess', 'Bride', 'Harvest', 'Endeavour', 'Prosperity', 'Concord'];
const NAVY_N = ['Resolute', 'Vigilant', 'Defiance', 'Intrepid', 'Relentless', 'Sovereign', 'Thunderer', 'Indomitable', 'Valiant', 'Steadfast', 'Tempest', 'Leviathan', 'Majestic', 'Vengeance', 'Triumph', 'Audacious', 'Implacable', 'Formidable', 'Renown', 'Swiftsure', 'Courageous', 'Orion', 'Minotaur', 'Centaur', 'Hercules', 'Neptune', 'Jupiter', 'Ajax', 'Hector', 'Achilles', 'Monarch', 'Bulwark', 'Superb', 'Terrible', 'Invincible', 'Zealous'];
const FIRST = ['Elias', 'Josiah', 'Tobias', 'Barnaby', 'Silas', 'Amos', 'Gideon', 'Jasper', 'Ezekiel', 'Bartholomew', 'Cornelius', 'Horatio', 'Edmund', 'Nathaniel', 'Thaddeus', 'Reuben', 'Obadiah', 'Ambrose', 'Lemuel', 'Hezekiah', 'Rufus', 'Augustus', 'Percival', 'Ignatius', 'Solomon', 'Matthias', 'Jeremiah', 'Phineas', 'Caleb', 'Abel', 'Anne', 'Mary', 'Grace', 'Charlotte', 'Eleanor', 'Rachel', 'Hannah', 'Judith', 'Esther', 'Abigail', 'Constance', 'Prudence', 'Mercy', 'Temperance'];
const LAST = ['Hawkins', 'Pemberton', 'Ashdown', 'Blackwood', 'Carrow', 'Dunmore', 'Fairweather', 'Greaves', 'Hallowell', 'Inchbald', 'Jessop', 'Kettering', 'Lockyer', 'Merriweather', 'Northcott', 'Oakshott', 'Penhallow', 'Quill', 'Ravenscroft', 'Stanhope', 'Thornbury', 'Underhill', 'Vane', 'Whitlock', 'Yarrow', 'Bramble', 'Crane', 'Drummond', 'Easton', 'Finch', 'Garrick', 'Holloway', 'Ironside', 'Kemp', 'Lovell', 'Marsh', 'Nettle', 'Orme', 'Pike', 'Rook', 'Sherwood', 'Trask', 'Vickers', 'Wolfe', 'Tregarth', 'Calloway', 'Dacre', 'Ellery', 'Fenwick', 'Gaunt'];
const RANK_N = ['Lieutenant', 'Lieutenant', 'Commander', 'Commander', 'Captain', 'Captain', 'Post-Captain', 'Commodore'];
const RANK_M = ['Master', 'Master', 'Captain', 'Captain', 'Skipper', 'Old'];
const pick = (R, a) => a[(R() * a.length) | 0];
function nameShip(R, K) { return K.navy ? pick(R, NAVY_N) : pick(R, SHIP_A) + ' ' + pick(R, SHIP_B); }
function nameCapt(R, K) { return (K.navy ? RANK_N[Math.min(RANK_N.length - 1, ((K.size - 1) * 2 + R() * 2) | 0)] : pick(R, RANK_M)) + ' ' + pick(R, FIRST) + ' ' + pick(R, LAST); }

// ---------- how hard an expedition is ----------
function makeCfg(N, help) {
  const f = curve(N), e = easyOf(N), x = (a, b, kk) => a + (b - a) * (1 - Math.exp(-f / kk)), boss = N % 10 === 0;
  const c = { N, f, e, boss, help: !!help,
    // the sea
    eReload: x(5.0, 2.7, 12) + e * 1.4,            // seconds between one of her broadsides and the next
    eAim: x(1.25, 0.52, 22) + e * 0.5,              // warning: her gun ports are open this long before she fires
    eSpread: x(0.2, 0.07, 24),                     // how far her broadside scatters: wide at range, tight up close
    eSkill: x(0.25, 0.95, 20) * (1 - 0.5 * e),     // how well she places herself
    eSide: x(10, 45, 9) * (1 - 0.5 * e),          // what a whole broadside of hers does to your hull if every ball lands (yours is 100)
    eHull: x(0.8, 2.6, 9) * (1 - 0.35 * e),       // her hull, times her kind's own
    maxNavy: boss ? 1 : N < 6 ? 1 : N < 15 ? 2 : 3,
    engage: N < 40 ? 1 : 2,                        // how many navy ships come in to fight you at once; the others stand off and wait their turn
    myBall: 6, myReload: 3.6,
    // boarding (part 3 turns these into each man)
    windup: 0.3 + 0.6 * Math.exp(-f / 18) + 0.45 * e,          // seconds of warning before a blow lands (never under 0.3)
    parryWin: 0.14 + 0.46 * Math.exp(-f / 36) + 0.2 * e,       // how early a block still counts
    gap: (0.5 + 1.6 * Math.exp(-f / 22)) * (1 + 0.4 * e),      // pause between a man's attacks
    oParry: Math.min(0.5, 0.06 + f * 0.009),                   // he turns your attacks aside
    oDodge: Math.min(0.22, f * 0.005),
    combo: N >= 4 ? Math.min(0.6, (f - 3) * 0.03) : 0,
    feint: N >= 8 ? Math.min(0.35, (f - 7) * 0.015) : 0,
    heavy: N >= 6 ? Math.min(0.3, 0.08 + (f - 6) * 0.01) : 0,   // red blows that cannot be blocked, only dodged
    shots: N >= 4 ? Math.min(0.5, 0.15 + f * 0.012) : 0,        // marines and captains with a pistol of their own
    read: 1 + Math.min(2.5, (N - 1) * 0.3),                     // how hard a man punishes the same move over and over
    punish: 1.2 + Math.min(0.6, N * 0.05),
    hit: (0.07 + f * 0.0012) * (1 - 0.4 * e),                  // how far one of his blows pushes the tide against you
    hp: (30 + f * 1.2) * (1 - 0.25 * e),                        // one ordinary man
    kill: clamp(0.3 - f * 0.003, 0.16, 0.3),                   // how far dropping a man pushes the tide (so more men later)
    tol: (28 + 30 * Math.exp(-N / 14)) * (1 + 0.6 * e)          // how close your block must pass to his blade (at 390 wide)
  };
  if (help) { c.eReload += 0.7; c.eAim += 0.25; c.windup *= 1.12; c.gap += 0.25; }
  return c;
}

// ---------- ships ----------
function mkShip(K, x, y, hdg, o) {
  return Object.assign({ K, x, y, hdg, v: K.speed, rud: 0, hull: K.hull, hull0: K.hull, alive: true, struck: false, gone: false, sink: 0, load: [0, 0], aim: [0, 0], aimOn: [false, false], hitT: 9, fireT: 9, bob: Math.random() * 9, holes: [] }, o || {});
}
const fwdX = s => Math.sin(s.hdg), fwdY = s => Math.cos(s.hdg), rgtX = s => Math.cos(s.hdg), rgtY = s => -Math.sin(s.hdg);
function relTo(s, t) {      // where t is from s: to starboard (lx), ahead (ly), how far, and its bearing off the bow (+ to starboard)
  const dx = t.x - s.x, dy = t.y - s.y, lx = dx * rgtX(s) + dy * rgtY(s), ly = dx * fwdX(s) + dy * fwdY(s);
  return { lx, ly, d: Math.hypot(dx, dy), brg: Math.atan2(lx, ly) };
}
function inArc(s, t, side, arc, range) { const r = relTo(s, t), sx = side ? r.lx : -r.lx; return sx > 0 && r.d < range && Math.abs(Math.atan2(r.ly, sx)) < arc; }
function sail(s, dt, top) {
  const want = (top != null ? top : s.K.speed) * (1 - 0.22 * Math.abs(s.rud)) * (s.hull < s.hull0 * 0.3 ? 0.86 : 1);
  s.v += clamp(want - s.v, -16 * dt, 9 * dt);
  s.hdg = wrapA(s.hdg + s.rud * s.K.turn * dt * clamp(s.v / 30, 0.25, 1));
  s.x += fwdX(s) * s.v * dt; s.y += fwdY(s) * s.v * dt;
  s.load[0] = Math.max(0, s.load[0] - dt); s.load[1] = Math.max(0, s.load[1] - dt); s.hitT += dt; s.fireT += dt; s.bob += dt;
}

// ---------- what the lookout sees ----------
function makeSight(G) {
  const N = G.N, c = G.cfg, f = c.f, R = G.rnd; let kinds;
  if (N === 1) kinds = ['trader'];
  else if (N === 2) kinds = ['cutter'];
  else if (c.boss) kinds = ['galleon', f < 15 ? 'brig' : f < 35 ? 'frigate' : 'manowar'];
  else {
    const merch = () => { const r = R() + f * 0.012; return r > 1.25 ? 'galleon' : r > 0.62 ? 'indiaman' : 'trader'; };
    const navy = n => { const r = R() + f * 0.014 - (n - 1) * 0.28; return r > 1.05 ? 'frigate' : r > 0.5 ? 'brig' : 'cutter'; };
    const opts = [['M', Math.max(0.15, 1.6 - f * 0.07)], ['N', 0.8], ['MN', 1.2], ['MM', f > 5 ? 0.25 : 0], ['NN', c.maxNavy >= 2 ? 0.6 : 0], ['MMN', f > 8 ? 0.7 : 0],
      ['MNN', c.maxNavy >= 2 && f > 10 ? 0.9 : 0], ['NNN', c.maxNavy >= 3 ? 0.35 : 0], ['MMM', f > 12 ? 0.12 : 0]];
    let tot = 0; for (const o of opts) tot += o[1];
    let r = R() * tot, comp = 'M'; for (const o of opts) { r -= o[1]; if (r <= 0) { comp = o[0]; break; } }
    const nn = comp.split('N').length - 1; kinds = comp.split('').map(ch => ch === 'M' ? merch() : navy(nn));
  }
  const base = 260 + 40 * f;
  const ships = kinds.map(kind => { const K = KINDS[kind]; return { kind, K, name: nameShip(R, K), capt: nameCapt(R, K), loot: Math.round(K.loot * base * (0.85 + 0.3 * R()) / 10) * 10 }; });
  const loot = ships.reduce((a, s) => a + s.loot, 0);
  const threat = ships.reduce((a, s) => a + (s.K.navy ? 0.9 + s.K.size * 0.75 : 0.25 + s.K.size * 0.12), 0);
  return { ships, loot, coins: clamp(Math.round(loot / base * 1.1 + 0.3), 1, 5), skulls: clamp(Math.round(threat * 0.95), 1, 5), navy: ships.filter(s => s.K.navy).length };
}
function placeSight(G, near) {      // put the sighted ships on the sea ahead, crossing our bows
  const me = G.me, S = G.sight, n = S.ships.length, D = near ? 150 : 215, cross = me.hdg + (G.rnd() < 0.5 ? 1 : -1) * (Math.PI / 2 - 0.25 + G.rnd() * 0.3);
  G.foes = S.ships.map((sh, i) => {
    const off = (i - (n - 1) / 2) * 72, ax = Math.sin(cross), ay = Math.cos(cross);
    return mkShip(sh.K, me.x + fwdX(me) * D + ax * off, me.y + fwdY(me) * D + ay * off, cross, { info: sh, pal: i + ((G.seed >> 3) & 3), v: sh.K.speed * 0.45, hull: Math.round(sh.K.hull * (sh.K.navy ? G.cfg.eHull : 1)), think: 0, wantBrg: 0 });
  });
  for (const s of G.foes) s.hull0 = s.hull;
  const merch = G.foes.filter(s => !s.K.navy), pool = merch.length ? merch : G.foes;
  G.prize = pool.reduce((a, b) => (b.info.loot > a.info.loot ? b : a));
}

// ---------- an expedition ----------
function newExp(N, o = {}) {
  const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  return { N, cfg, seed, rnd: rng(seed), phase: 'sail', t: 0, pt: 0, me: mkShip(MYSHIP, 0, 0, 0), foes: [], balls: [], ev: [], msgs: [],
    in: { rud: 0, fire: false, held: false }, firePrev: false, choice: null, sightI: 0, passes: N <= 2 || cfg.boss ? 0 : 2, sight: null, prize: null,
    took: { hull: 0, wounds: 0 }, dealt: 0, lastHit: 0, battleT: 0, shots: 3, fight: null, over: null, nextSight: N === 1 ? 2.4 : 4.0, lit: [false, false], idle: 0, taken: [] };
}
function setPhase(G, p) { G.phase = p; G.pt = 0; G.ev.push({ k: 'phase', p }); }
function predict(s, T, q) {      // where a ship will be T seconds on if she holds her wheel as it is (q: how much of that the gunners allow for)
  let x = s.x, y = s.y, h = s.hdg; const n = 6, h1 = T / n, w = s.rud * s.K.turn * clamp(s.v / 30, 0.25, 1);
  for (let i = 0; i < n; i++) { h += w * h1; x += Math.sin(h) * s.v * h1; y += Math.cos(h) * s.v * h1; }
  return { x: s.x + (x - s.x) * q, y: s.y + (y - s.y) * q };
}
// A broadside goes where the guns point when they fire: straight out of the side, at the ship in front of them. Each ball lands near that spot.
function broadside(G, s, side, t, spread, dmg, mine, reload) {
  const n = s.K.guns, sg = side ? 1 : -1, d = t ? relTo(s, t).d : 110, p = t ? predict(t, d / SEA.BALL_V + 0.1, 1) : { x: s.x + rgtX(s) * sg * 110, y: s.y + rgtY(s) * sg * 110 }, scatter = spread * d;
  for (let i = 0; i < n; i++) {
    const at = (i + 0.5) / n - 0.5, a = G.rnd() * TAU, r = Math.sqrt(G.rnd()) * scatter;
    G.balls.push({ s, sg, at, wait: i * 0.07 + G.rnd() * 0.03, x1: p.x + fwdX(s) * at * s.K.len * 0.5 + Math.cos(a) * r, y1: p.y + fwdY(s) * at * s.K.len * 0.5 + Math.sin(a) * r, dmg, mine, live: false, t: 0, T: 1 });
  }
  s.load[side] = reload; s.fireT = 0; s.aimOn[side] = false; s.aim[side] = 0;
  G.ev.push({ k: 'fire', s, side: sg, mine, n });
}
function hitShip(G, t, dmg, b, rake) {
  const me = t === G.me;
  if (t.holes.length < 14) { const dx = b.x - t.x, dy = b.y - t.y; t.holes.push({ lx: clamp((dx * rgtX(t) + dy * rgtY(t)) / (t.K.beam * 0.5), -0.8, 0.8), ly: clamp((dx * fwdX(t) + dy * fwdY(t)) / (t.K.len * 0.5), -0.85, 0.85) }); }
  G.ev.push({ k: 'hit', x: b.x, y: b.y, me, rake, s: t });
  if (me) {
    t.hull -= dmg; t.hitT = 0; G.took.hull += dmg;
    if (t.hull <= 0) { t.hull = 0; t.alive = false; t.sink = 0.001; G.ev.push({ k: 'sunk', s: t, me: true }); setPhase(G, 'sunk'); }
    return;
  }
  if (!t.alive) return;
  t.hitT = 0; G.dealt += dmg; G.lastHit = G.t;
  if (!t.K.navy) {            // a merchant has no guns: one ball and she heaves to. But every hole is cargo over the side.
    t.info.loot = Math.max(Math.round(t.info.loot0 * 0.7 / 10) * 10, t.info.loot - Math.round(t.info.loot0 * 0.05 / 10) * 10);
    if (!t.struck) { t.struck = true; G.ev.push({ k: 'hove', s: t }); }
    return;
  }
  if (t.struck) return;
  t.hull -= dmg;
  if (t.hull <= 0) {
    t.hull = 0;
    if (t === G.prize) { t.struck = true; G.ev.push({ k: 'struck', s: t }); } else { t.alive = false; t.sink = 0.001; G.ev.push({ k: 'sunk', s: t }); }
    if (!G.foes.some(s => s.K.navy && s.alive && !s.struck && !s.gone)) { for (const s of G.foes) if (!s.K.navy) s.struck = true; if (G.phase === 'battle') { setPhase(G, 'close'); G.ev.push({ k: 'seawon' }); } }
  }
}
function ballsStep(G, dt) {
  for (const b of G.balls) {
    if (!b.live) {
      b.wait -= dt; if (b.wait > 0) continue;
      const s = b.s; if (!s.alive) { b.dead = true; continue; }
      b.x0 = s.x + fwdX(s) * b.at * s.K.len * 0.72 + rgtX(s) * b.sg * s.K.beam * 0.5; b.y0 = s.y + fwdY(s) * b.at * s.K.len * 0.72 + rgtY(s) * b.sg * s.K.beam * 0.5;
      b.T = Math.max(0.12, Math.hypot(b.x1 - b.x0, b.y1 - b.y0) / SEA.BALL_V); b.live = true; b.t = 0; b.x = b.x0; b.y = b.y0;
      G.ev.push({ k: 'gun', x: b.x0, y: b.y0, a: Math.atan2(b.x1 - b.x0, b.y1 - b.y0), mine: b.mine });
      continue;
    }
    b.t += dt; const u = Math.min(1, b.t / b.T); b.x = lerp(b.x0, b.x1, u); b.y = lerp(b.y0, b.y1, u);
    if (u < 1) continue;
    b.dead = true; let hit = false;
    for (const t of (b.mine ? G.foes : [G.me])) {
      if (!t.alive || t.gone) continue;
      const dx = b.x - t.x, dy = b.y - t.y, lx = dx * rgtX(t) + dy * rgtY(t), ly = dx * fwdX(t) + dy * fwdY(t), hb = t.K.beam * 0.5 + SEA.PAD, hl = t.K.len * 0.5 + 1;
      if ((lx * lx) / (hb * hb) + (ly * ly) / (hl * hl) <= 1) { const L = Math.hypot(b.x1 - b.x0, b.y1 - b.y0) || 1, rake = Math.abs((b.x1 - b.x0) * fwdX(t) + (b.y1 - b.y0) * fwdY(t)) / L > 0.8; hitShip(G, t, b.dmg * (rake ? SEA.RAKE : 1), b, rake); hit = true; break; }
    }
    if (!hit) G.ev.push({ k: 'splash', x: b.x, y: b.y });
  }
  if (G.balls.length) G.balls = G.balls.filter(b => !b.dead);
}
function sideOf(s, t) { return relTo(s, t).lx >= 0 ? 1 : 0; }
function targetFor(G, side) {      // the nearest ship your guns on that side can reach
  const me = G.me, navy = G.foes.some(s => s.K.navy && s.alive && !s.struck && !s.gone); let best = null, bd = 1e9;
  for (const t of G.foes) { if (!t.alive || t.gone || t.struck || (navy && !t.K.navy)) continue; if (!inArc(me, t, side, SEA.ARC, SEA.RANGE)) continue; const d = relTo(me, t).d; if (d < bd) { bd = d; best = t; } }
  return best;
}
function myFire(G) {
  const me = G.me; let any = false;
  for (let side = 0; side < 2; side++) { if (me.load[side] > 0) continue; const t = targetFor(G, side); if (!t) continue; broadside(G, me, side, t, SEA.MY_SPREAD, G.cfg.myBall, true, G.cfg.myReload); any = true; }
  if (any) return;
  let side = -1, bd = 1e9;        // nothing in front of the guns: the loaded side nearest a ship fires at the empty sea all the same
  for (const t of G.foes) { if (!t.alive || t.gone) continue; const r = relTo(me, t), sd = r.lx >= 0 ? 1 : 0; if (me.load[sd] <= 0 && r.d < bd) { bd = r.d; side = sd; } }
  if (side < 0) side = me.load[1] <= 0 ? 1 : me.load[0] <= 0 ? 0 : -1;
  if (side >= 0) { broadside(G, me, side, null, SEA.MY_SPREAD, G.cfg.myBall, true, G.cfg.myReload); G.ev.push({ k: 'wasted' }); } else G.ev.push({ k: 'empty' });
}
// a navy ship: she comes at you under full sail, then shortens sail and turns her side to you; her ports open (that is your warning) and she fires.
// She is a heavy thing to turn: a quick sloop can stay off her bow or her stern, where no gun of hers will reach.
function navyAI(G, s, dt) {
  const c = G.cfg, me = G.me, sk = c.eSkill, pm = sk > 0.3 ? predict(me, 0.9 * sk, 1) : me, r = relTo(s, pm), rn = relTo(s, me);
  s.think -= dt;
  if (s.think <= 0) {
    s.think = lerp(0.7, 0.18, sk) * (0.7 + G.rnd() * 0.6);
    let side = r.lx >= 0 ? 1 : -1; const near = side > 0 ? 1 : 0;
    if (s.load[near] > 1.4 && s.load[1 - near] <= 0.6 && rn.d < 125) side = -side;      // that side is spent: she wears round to give you the other
    const live = G.foes.filter(o => o.K.navy && o.alive && !o.struck && !o.gone), busy = live.filter(o => o.eng).length;
    if (!s.eng && (busy < c.engage && !live.some(o => !o.eng && o !== s && relTo(o, me).d < rn.d) || rn.d < 105)) { s.eng = true; G.ev.push({ k: 'engage', s }); }
    if (s.eng) { s.close = rn.d > (s.close ? 105 : 128); s.wantBrg = s.close ? side * 0.35 : side * (Math.PI / 2 - (rn.d > 78 ? 0.3 : 0)); }
    else { s.close = rn.d > 215; s.wantBrg = s.close ? side * 0.3 : side * (rn.d < 175 ? 2.2 : Math.PI / 2); }      // standing off: she keeps her distance and watches
  }
  const idle = Math.max(0, G.t - Math.max(G.lastHit, G.battleT) - 12);      // left alone, she crowds on sail, comes alongside, and her gunners find the range
  let rud = clamp(wrapA(r.brg - s.wantBrg) * 2.4, -1, 1), dp = 0;
  if (idle > 0 && s.eng) {
    const sm = relTo(me, s).lx >= 0 ? 1 : -1, px = me.x + rgtX(me) * sm * 66 + fwdX(me) * me.v * 0.5, py = me.y + rgtY(me) * sm * 66 + fwdY(me) * me.v * 0.5, dx = px - s.x, dy = py - s.y;
    dp = Math.hypot(dx, dy); const w = clamp((dp - 12) / 50, 0, 1); rud = clamp((wrapA(Math.atan2(dx, dy) - s.hdg) * w + wrapA(me.hdg - s.hdg) * (1 - w)) * 2.4, -1, 1);
  }
  for (const o of G.foes) if (o !== s && o.alive && !o.gone) { const q = relTo(s, o); if (q.d < 62 && q.ly > -10) rud = q.lx > 0 ? -1 : 1; }      // do not run aboard a friend
  if (rn.d < 38 && rn.ly > 0) rud = rn.lx > 0 ? -1 : 1;                                                                                           // nor aboard you
  const hold = idle > 0 && s.eng, rush = clamp((idle - 15) / 30, 0, 1);      // left alone, even a clumsy captain keeps her station on your beam; left alone for long, she is on you like a hawk (no battle goes on for ever)
  s.rud += (rud * (hold ? 1 + 0.6 * rush : 0.45 + 0.75 * sk) - s.rud) * Math.min(1, dt * (hold ? 4 : lerp(1.4, 4, sk)));
  const chase = Math.max(s.K.speed, me.v + 6) * 1.2, full = lerp(me.v * 0.75, chase, clamp(sk * 1.7, 0, 1));
  sail(s, dt, hold ? me.v + clamp(dp * 0.5, 0, 40) : s.close ? full : s.eng ? 24 : Math.min(s.K.speed, me.v));
  for (let side = 0; side < 2; side++) {
    if (s.eng && s.load[side] <= 0 && inArc(s, me, side, SEA.ARC_E, SEA.E_RANGE)) {      // you are in front of her guns: her ports open (your warning), and then she fires
      if (!s.aimOn[side]) { s.aimOn[side] = true; G.ev.push({ k: 'ports', s, side }); }
      s.aim[side] += dt;
      if (s.aim[side] >= c.eAim * (1 - 0.7 * rush)) broadside(G, s, side, me, c.eSpread * (1 - Math.min(0.5, idle * 0.03)), c.eSide * (0.55 + 0.15 * s.K.size) / s.K.guns * (1 + idle * 0.08), false, c.eReload * (0.95 + G.rnd() * 0.2) * (1 - Math.min(0.5, idle * 0.03)));
    } else if (s.aimOn[side]) { s.aim[side] -= dt * 2; if (s.aim[side] <= 0) { s.aim[side] = 0; s.aimOn[side] = false; G.ev.push({ k: 'portsshut', s, side }); } }
  }
}
function merchAI(G, s, dt, flee) {
  if (s.struck || !flee) { s.rud *= 0.9; sail(s, dt, s.struck ? 0 : s.K.speed * 0.45); return; }
  const r = relTo(s, G.me);                      // run: put us dead astern
  s.rud += (clamp(-wrapA(r.brg - Math.PI * Math.sign(r.brg || 1)) * 1.5, -1, 1) - s.rud) * Math.min(1, dt * 1.5);
  sail(s, dt);
}
function helm(G, dt, auto) {         // your own ship: the thumb, or the helmsman making for the prize when the thumb is off
  const me = G.me; let rud = G.in.rud;
  if (auto && !G.in.held && G.prize) { const r = relTo(me, G.prize); rud = clamp(r.brg * 1.6, -1, 1); if (r.d < 90) me.v = Math.min(me.v, 24 + r.d * 0.26); }
  me.rud += (rud - me.rud) * Math.min(1, dt * 7);
  sail(me, dt);
}
function seaStep(G, dt) {
  G.t += dt; G.pt += dt;
  const me = G.me, fireNow = G.in.fire && !G.firePrev; G.firePrev = G.in.fire;
  switch (G.phase) {
    case 'sail':
      helm(G, dt, false); G.nextSight -= dt;
      if (G.nextSight <= 0) { G.sight = makeSight(G); for (const s of G.sight.ships) s.loot0 = s.loot; placeSight(G, false); G.choice = null; setPhase(G, 'sight'); G.ev.push({ k: 'sight' }); }
      break;
    case 'sight': {
      const slow = dt * 0.12;
      helm(G, slow, false); for (const s of G.foes) merchAI(G, s, slow, false);
      if (G.choice === 'raid' || (G.choice === 'pass' && G.passes <= 0)) { G.choice = null; G.ev.push({ k: 'raid' }); for (const s of G.foes) s.v = Math.max(s.v, s.K.speed * 0.6); G.battleT = G.lastHit = G.t; setPhase(G, G.sight.navy ? 'battle' : 'chase'); }
      else if (G.choice === 'pass') { G.choice = null; G.passes--; G.sightI++; for (const s of G.foes) s.gone = true; G.prize = null; G.nextSight = 3.0; setPhase(G, 'sail'); G.ev.push({ k: 'pass' }); }
      break; }
    case 'battle': case 'chase': case 'close': {
      helm(G, dt, G.phase !== 'battle');
      for (const s of G.foes) { if (s.gone) continue; if (!s.alive) { s.sink += dt; if (s.sink > 5) s.gone = true; continue; } if (s.K.navy && !s.struck && G.phase === 'battle') navyAI(G, s, dt); else merchAI(G, s, dt, G.phase !== 'close'); }
      for (const s of G.foes) if (s.alive && !s.gone && me.alive) {      // ships do not sail through each other: you are shouldered off, and lose a little way
        const dx = s.x - me.x, dy = s.y - me.y, d = Math.hypot(dx, dy) || 1, min = (s.K.beam + me.K.beam) * 0.5 + 10;
        if (d < min) {
          const p = min - d, ux = dx / d, uy = dy / d, mine = s.struck || !s.K.navy ? 1 : 0.6; me.x -= ux * p * mine; me.y -= uy * p * mine; s.x += ux * p * (1 - mine); s.y += uy * p * (1 - mine);
          if (G.phase === 'battle' && (!G.bumpT || G.t - G.bumpT > 0.8)) { G.bumpT = G.t; me.v *= 0.75; me.hdg = wrapA(me.hdg + ((ux * fwdY(me) - uy * fwdX(me)) > 0 ? -0.12 : 0.12)); G.ev.push({ k: 'bump', x: me.x + ux * d * 0.5, y: me.y + uy * d * 0.5 }); }
        }
      }
      if (fireNow) myFire(G);
      ballsStep(G, dt);
      for (let side = 0; side < 2; side++) G.lit[side] = me.load[side] <= 0 && !!targetFor(G, side);
      if (G.phase !== 'battle' && G.prize && me.alive && relTo(me, G.prize).d < SEA.BOARD_R) { setPhase(G, 'grapple'); G.ev.push({ k: 'grapple' }); }
      break;
    }
    case 'grapple':
      me.rud *= 0.9; sail(me, dt, 0); if (G.prize) { G.prize.rud = 0; sail(G.prize, dt, 0); } ballsStep(G, dt);
      if (G.pt > 1.5) { setPhase(G, 'board'); startBoarding(G); }
      break;
    case 'sunk':
      me.sink += dt; for (const s of G.foes) if (s.alive && !s.gone) sail(s, dt, s.K.speed * 0.4); ballsStep(G, dt);
      if (G.pt > 1.0 && !G.over) G.over = 'lost';
      break;
  }
}
