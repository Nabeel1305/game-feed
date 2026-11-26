// ===================== RULES: Battle Lines (game 47, his idea) =====================
// You are the general, above the field. Before the battle you see the enemy drawn up, pick a FORMATION for your army (it sets
// where each of your units stands and how it goes into the fight) and may swap any two of your units by tapping them. Then
// BATTLE: tap one of your units, then tap the ground to send it there, or tap an enemy unit to attack it. Spearmen beat
// horsemen, horsemen beat archers, archers wear down foot soldiers from afar, swordsmen beat spearmen. Hitting a unit in
// the flank or the rear does far more harm and breaks its nerve. Every unit has morale: lose too many men or be caught from
// behind and it breaks and runs. Hills help whoever stands on them; woods slow horses and shelter men from arrows. Your
// horn rallies every unit's nerve once a battle. Break the enemy before they break you.
// World: metres; x across, z toward the camera; your army starts near the camera (z > 0), the enemy far (z < 0).
const RULES = [
  'Before battle: <b>pick a formation</b> (it sets where your units stand and how they go in). Tap two of your units to <b>swap</b> them.',
  'In battle: <b>tap one of your units</b>, then <b>tap the ground</b> to send it, or <b>tap an enemy</b> to attack it.',
  '<b>Spears</b> beat horses, <b>horses</b> beat archers, <b>archers</b> shoot foot soldiers down, <b>swords</b> beat spears.',
  'Hit them in the <b>flank or rear</b>: far more harm, and their nerve breaks. A broken unit runs.',
  'Hills help, woods slow horses and stop arrows. Your <b>horn</b> rallies everyone once a battle.',
];
const UT = {
  spear: { name: 'Spearmen', icon: '🛡', sp: 2.3, atk: 1.0, def: 1.25, hp: 10, n: 16, beats: { cav: 2.4, knight: 2.0 } },
  sword: { name: 'Swordsmen', icon: '⚔', sp: 2.6, atk: 1.45, def: 1.1, hp: 10, n: 16, beats: { spear: 1.6, archer: 1.4, xbow: 1.4 } },
  archer: { name: 'Archers', icon: '🏹', sp: 2.6, atk: 0.45, def: 0.65, hp: 8, n: 16, range: 26, shot: 0.6, beats: { sword: 1.2, spear: 1.2 } },
  cav: { name: 'Horsemen', icon: '🐎', sp: 6.8, atk: 1.25, def: 0.9, hp: 12, n: 10, charge: 2.4, beats: { archer: 2.4, xbow: 2.4, sword: 1.1 } },
  knight: { name: 'Knights', icon: '♞', sp: 5.6, atk: 1.7, def: 1.4, hp: 16, n: 10, charge: 2.8, beats: { archer: 2.4, xbow: 2.4, sword: 1.4, spear: 0.8 }, unlock: 6 },
  xbow: { name: 'Crossbows', icon: '🎯', sp: 2.3, atk: 0.5, def: 0.8, hp: 9, n: 14, range: 22, shot: 0.95, beats: { knight: 1.6, cav: 1.2 }, unlock: 10 },
};
// formations: where each slot stands (x across, z back from the front line) and what kind of unit it wants; and the opening
const FORMS = [
  { id: 'line', name: 'Line', desc: 'Everyone abreast; the whole line walks forward.', open: 'advance' },
  { id: 'wall', name: 'Shield Wall', desc: 'Spears in front, archers behind, horses in reserve; you stand and let them come.', open: 'hold' },
  { id: 'hammer', name: 'Hammer & Anvil', desc: 'Foot hold the middle while the horses ride round both flanks.', open: 'flank' },
  { id: 'wedge', name: 'Wedge', desc: 'A spearhead of swords drives straight at their middle.', open: 'charge' },
];
const PLACES = [{ name: 'The Green Valley', sky: 'morning', ground: 0x5a8a3a }, { name: 'The Border Hills', sky: 'golden', ground: 0x7a8a4a }, { name: 'The Frozen Ford', sky: 'overcast', ground: 0xd8dee6 }, { name: 'The Red Plains', sky: 'golden', ground: 0x9a7a4a }];
const placeOf = N => Math.floor((N - 1) / 5) % PLACES.length;
const BANNERS = [{ id: 'blue', name: 'Azure', col: 0x2a5ae0, stars: 0 }, { id: 'green', name: 'Forest', col: 0x2a9a4a, stars: 4 }, { id: 'purple', name: 'Royal', col: 0x7a3ad0, stars: 10 }, { id: 'gold', name: 'Gold', col: 0xd8a820, stars: 18 }, { id: 'black', name: 'Night', col: 0x2a2a34, stars: 28 }, { id: 'white', name: 'Silver', col: 0xe8eef4, stars: 40 }];
const UPGRADES = [
  { id: 'armour', name: 'Better armour', desc: 'Your men take less harm.', max: 3, cost: l => 25 + l * 30 },
  { id: 'drill', name: 'Drill', desc: 'Your units march faster.', max: 2, cost: l => 25 + l * 30 },
  { id: 'nerve', name: 'Veterans', desc: 'Your units hold their nerve longer.', max: 2, cost: l => 30 + l * 35 },
  { id: 'horn', name: 'Second horn', desc: 'Rally twice a battle.', max: 1, cost: l => 50 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Sergeant'], [40, 'Captain'], [130, 'Commander'], [320, 'General'], [700, 'Marshal'], [1500, 'Warlord']];
function myBanner() { if (typeof HEADLESS !== 'undefined' && HEADLESS) return BANNERS[0]; const id = store.get('banner', 'blue'); return BANNERS.find(b => b.id === id) || BANNERS[0]; }
const FW = 26, FZ = 40;      // half the field across, half its length
// ---------- the armies for a level ----------
function makeCfg(N, help) { const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), e = easyOf(N);
  const have = Object.keys(UT).filter(t => !UT[t].unlock || N >= UT[t].unlock);
  return { N, f, help: !!help, place: placeOf(N), mine: Math.min(8, 4 + Math.floor((N + 1) / 3)), odds: x(1.18, 1.24, 30) * (1 - 0.22 * e) * (help ? 0.88 : 1), have, aiWit: x(0.6, 1, 25), hills: N >= 2, woods: N >= 4, rally: 1 + upLv('horn') }; }
function armyMix(G, n, have, bias) { const R = G.rnd, out = [], base = ['spear', 'sword', 'archer', 'cav']; for (let i = 0; i < n; i++) { let t = base[i % 4]; if (i >= 4) t = have[(R() * have.length) | 0]; if (bias && R() < 0.35) t = bias; out.push(t); } return out; }
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, place: cfg.place, phase: 'deploy', units: [], nid: 1, form: 'line', sel: null, rally: cfg.rally, banner: o.banner || myBanner(), arrows: [], hills: [], woods: [] };
  field(G); if (G.teach && LESSONS[G.N] && G.taught < G.N) lessonStart(G); else { armies(G); G.ev.push({ k: 'start' }); }
  return G; }
function field(G) { const R = G.rnd, c = G.cfg; G.hills = []; G.woods = []; if (c.hills) { G.hills.push({ x: (R() - 0.5) * 30, z: 14 + R() * 8, r: 9 + R() * 4 }); if (R() < 0.7) G.hills.push({ x: (R() - 0.5) * 34, z: -16 - R() * 8, r: 9 + R() * 4 }); }
  if (c.woods) { G.woods.push({ x: (R() < 0.5 ? -1 : 1) * (18 + R() * 8), z: (R() - 0.5) * 20, r: 7 + R() * 3 }); if (R() < 0.5) G.woods.push({ x: (R() - 0.5) * 20, z: (R() - 0.5) * 10, r: 5 + R() * 2 }); } }
const onHill = (G, x, z) => G.hills.some(h => Math.hypot(x - h.x, z - h.z) < h.r), inWood = (G, x, z) => G.woods.some(w => Math.hypot(x - w.x, z - w.z) < w.r);
function mkUnit(G, side, type, x, z, scale = 1) { const U = UT[type], n = Math.max(3, Math.round(U.n * scale)), u = { id: G.nid++, side, type, x, z, face: side === 0 ? -Math.PI / 2 : Math.PI / 2, n, n0: n, hp: n * U.hp, morale: 100, order: null, tgt: null, state: 'hold', charge: 0, fight: 0, rout: false, gone: false, kills: 0, lastFlank: 0, shotT: Math.random() };
  G.units.push(u); return u; }
function armies(G) { const c = G.cfg, R = G.rnd, mine = armyMix(G, c.mine, c.have), en = armyMix(G, Math.round(c.mine * c.odds * 0.85), c.have, c.N >= 4 && R() < 0.5 ? pick(R, c.have) : null);
  // the enemy: drawn up in one of the formations too
  const ef = FORMS[(R() * FORMS.length) | 0]; G.enemyForm = ef.id; place(G, 1, en, ef.id, Math.max(0.95, c.odds / Math.max(0.85, en.length / c.mine) * 0.85));      // never weaker men than yours, only fewer units
  place(G, 0, mine, G.form, 1); }
// put a side's units into their slots for a formation
function slots(form, list) { const n = list.length, out = [], spread = Math.min(7, 36 / Math.max(1, n));
  const by = t => list.map((u, i) => [u, i]).filter(([u]) => t.includes(u)).map(([, i]) => i);
  if (form === 'line') list.forEach((u, i) => out[i] = { x: (i - (n - 1) / 2) * spread, z: 0 });
  else { const front = form === 'wall' ? by(['spear', 'sword']) : form === 'wedge' ? by(['sword', 'knight', 'spear']) : by(['spear', 'sword']), back = by(['archer', 'xbow']), horse = by(['cav', 'knight']).filter(i => !front.includes(i));
    const rest = list.map((_, i) => i).filter(i => !front.includes(i) && !back.includes(i) && !horse.includes(i));
    front.concat(rest).forEach((i, q, a) => out[i] = form === 'wedge' ? { x: (q % 2 ? 1 : -1) * Math.ceil(q / 2) * 5.5, z: Math.ceil(q / 2) * 5 } : { x: (q - (a.length - 1) / 2) * spread, z: 0 });
    back.forEach((i, q, a) => out[i] = { x: (q - (a.length - 1) / 2) * spread, z: form === 'wedge' ? 14 : 8 });
    horse.forEach((i, q, a) => out[i] = form === 'hammer' ? { x: (q % 2 ? 1 : -1) * (16 + Math.floor(q / 2) * 4), z: -3 } : { x: (q - (a.length - 1) / 2) * spread, z: form === 'wedge' ? 18 : 15 }); }
  return out; }
function place(G, side, types, form, scale) { const sl = slots(form, types), front = side === 0 ? 20 : -20, dir = side === 0 ? 1 : -1;
  types.forEach((t, i) => mkUnit(G, side, t, clamp(sl[i].x, -FW + 6, FW - 6), front + dir * Math.min(14, sl[i].z), scale)); }
// ---------- before the battle ----------
function setForm(G, id) { if (G.phase !== 'deploy' || G.over) return false; G.form = id; const mine = G.units.filter(u => u.side === 0), types = mine.map(u => u.type), sl = slots(id, types);
  mine.forEach((u, i) => { u.x = clamp(sl[i].x, -FW + 6, FW - 6); u.z = 20 + Math.min(14, sl[i].z); }); G.ev.push({ k: 'form', id }); return true; }
function swap(G, a, b) { if (G.phase !== 'deploy') return false; const p = G.units.find(u => u.id === a), q = G.units.find(u => u.id === b); if (!p || !q || p.side || q.side || p === q) return false; [p.x, q.x] = [q.x, p.x]; [p.z, q.z] = [q.z, p.z]; G.ev.push({ k: 'swap' }); return true; }
function battle(G) { if (G.phase !== 'deploy' || G.over) return false; G.phase = 'battle'; G.bt = 0; const F = FORMS.find(f => f.id === G.form), EF = FORMS.find(f => f.id === G.enemyForm);
  for (const u of G.units) { if (u.side === 1) continue; const open = F.open, dir = u.side === 0 ? -1 : 1, horse = u.type === 'cav' || u.type === 'knight';
    if (open === 'advance' || (open === 'charge' && !['archer', 'xbow'].includes(u.type))) u.order = { x: u.x, z: u.z - (open === 'charge' ? 16 : 10), adv: true };      // up to striking distance, then your orders
    else if (open === 'flank' && horse) u.order = { x: Math.sign(u.x || 1) * (FW - 3), z: 4, flank: true };      // out to the wings, waiting for your word
    else if (open === 'hold') u.order = null; else if (open === 'charge') u.order = { x: u.x, z: u.z - 8 }; }
  G.ev.push({ k: 'battle' }); return true; }
// ---------- in battle: orders ----------
function select(G, id) { const u = G.units.find(q => q.id === id && q.side === 0 && !q.rout && !q.gone); if (!u || G.phase !== 'battle') { G.sel = null; return false; } G.sel = u.id; G.ev.push({ k: 'sel' }); return true; }
function countOrd(G, u) { G.__orders = (G.__orders || 0) + 1; if (u.lastOrd != null && G.bt - u.lastOrd < 3.5) G.__re = (G.__re || 0) + 1; u.lastOrd = G.bt; }
function orderTo(G, x, z) { const u = G.units.find(q => q.id === G.sel); if (!u || u.rout || G.phase !== 'battle') return false; if (u.cd > 0) { G.sel = null; G.ev.push({ k: 'busy' }); return false; } countOrd(G, u); u.cd = 2; u.order = { x: clamp(x, -FW, FW), z: clamp(z, -FZ, FZ) }; u.tgt = null; u.fight = 0; G.ev.push({ k: 'order', x, z }); G.sel = null; return true; }
function orderAttack(G, id) { const u = G.units.find(q => q.id === G.sel), e = G.units.find(q => q.id === id && q.side === 1 && !q.gone); if (!u || !e || u.rout || G.phase !== 'battle') return false; if (u.cd > 0) { G.sel = null; G.ev.push({ k: 'busy' }); return false; } countOrd(G, u); u.cd = 2; u.led = 10; u.tgt = e.id; u.order = null; G.ev.push({ k: 'attack', x: e.x, z: e.z }); G.sel = null; return true; }
function rally(G) { if (G.phase !== 'battle' || G.rally <= 0 || G.over) return false; G.rally--; for (const u of G.units) if (u.side === 0 && !u.gone) { u.morale = Math.min(100, u.morale + 45); if (u.rout && u.n >= 3) { u.rout = false; u.order = null; } } G.ev.push({ k: 'rally' }); return true; }
// ---------- the fight, step by step ----------
const LED = 1.8;      // men you send into a fight yourself strike harder while your eye is on them
const R_ = u => 1.6 + Math.sqrt(u.n) * 0.75;
function step(G, dt) { if (G.over) return; G.t += dt; if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0 && G.lessonEnd) { G.lessonEnd = false; G.units = []; G.phase = 'deploy'; G.form = 'line'; G.sel = null; G.arrows = []; G.rally = G.cfg.rally; field(G); armies(G); G.ev.push({ k: 'start' }); } return; }
  if (G.phase !== 'battle') return; G.bt += dt; const c = G.cfg, live = G.units.filter(u => !u.gone);
  if (G.lesson) lessonTick(G, dt);
  for (const u of live) { u.cd = Math.max(0, (u.cd || 0) - dt); u.led = Math.max(0, (u.led || 0) - dt); const U = UT[u.type], foes = live.filter(q => q.side !== u.side && !q.rout), sp = U.sp * (u.side === 0 ? 1 + 0.1 * upLv('drill') : 1) * (inWood(G, u.x, u.z) ? (U.charge ? 0.45 : 0.7) : 1) * (u.rout ? 1.2 : 1);
    if (u.rout) { const away = u.side === 0 ? 1 : -1; u.z += away * sp * dt; u.face = away > 0 ? Math.PI / 2 : -Math.PI / 2; if (Math.abs(u.z) > FZ + 4) { u.gone = true; G.ev.push({ k: 'fled', side: u.side }); } continue; }
    // the enemy's mind (and your units' own sense: engage what comes close if no order)
    if (u.side === 1 && G.bt > 1.5) aiThink(G, u, foes, dt); 
    // where to go
    let gx = null, gz = null; const tg = u.tgt ? G.units.find(q => q.id === u.tgt && !q.gone && !q.rout) : null; if (u.tgt && !tg) u.tgt = null;
    if (tg) { if (U.range && dist(u, tg) < U.range * 0.9) { gx = null; } else { gx = tg.x; gz = tg.z; } }
    else if (u.order) { gx = u.order.x; gz = u.order.z; if (Math.hypot(gx - u.x, gz - u.z) < 1) { u.order = null; gx = null; } }
    // in contact with an enemy: fight (and stop)
    // a unit marching to a point fights only what attacks it; otherwise its target, or whatever it bumps into
    let fighting = null; for (const q of foes) if (dist(u, q) < R_(u) + R_(q) + 0.6 && (q === tg || q.tgt === u.id || (!u.order && !tg))) { if (!fighting || q === tg) fighting = q; }
    // pulling out of a fight to march off: it turns its back and goes slowly, and the enemy strikes it from behind
    if (fighting && u.order && fighting !== tg) { u.fight += dt; const dx = u.order.x - u.x, dz = u.order.z - u.z, d = Math.hypot(dx, dz) || 1; u.face = Math.atan2(dz, dx); u.x += dx / d * sp * 0.4 * dt; u.z += dz / d * sp * 0.4 * dt; u.morale -= dt * 6; }
    else if (fighting) { u.fight += dt; if (!U.range || dist(u, fighting) < R_(u) + R_(fighting) + 0.6) melee(G, u, fighting, dt); u.face = Math.atan2(fighting.z - u.z, fighting.x - u.x); }
    else { u.fight = 0; if (gx != null) { const dx = gx - u.x, dz = gz - u.z, d = Math.hypot(dx, dz); if (d > 0.3) { u.x += dx / d * Math.min(d, sp * dt); u.z += dz / d * Math.min(d, sp * dt); u.face = Math.atan2(dz, dx); u.charge = Math.min(1, u.charge + dt * (U.charge ? 0.8 : 0)); } } else u.charge = Math.max(0, u.charge - dt); }
    // archers loose at the nearest in range, wherever they are
    if (U.range && !fighting) { u.shotT -= dt; const t2 = tg && dist(u, tg) <= U.range ? tg : nearestIn(u, foes, U.range); if (t2 && u.shotT <= 0) { u.shotT = 1.4 + Math.random() * 0.3; const hill = onHill(G, u.x, u.z) ? 1.3 : 1, wood = inWood(G, t2.x, t2.z) ? 0.4 : 1, m = (U.beats[t2.type] || 1) * hill * wood, armour = t2.type === 'sword' || t2.type === 'knight' ? 0.75 : 1;
        hurt(G, t2, U.atk * U.shot * u.n * m * armour * 1.4 / UT[t2.type].def, u, 0); G.arrows.push({ x0: u.x, z0: u.z, x1: t2.x, z1: t2.z, t: 0 }); if (G.arrows.length > 40) G.arrows.shift(); G.ev.push({ k: 'volley' }); } }
    u.x = clamp(u.x, -FW - 2, FW + 2); u.z = clamp(u.z, -FZ - 6, FZ + 6);
    if (!fighting) u.morale = Math.min(100, u.morale + dt * 2); }
  // units keep apart (a little)
  for (let i = 0; i < live.length; i++) for (let j = i + 1; j < live.length; j++) { const a = live[i], b = live[j]; if (a.gone || b.gone) continue; const d = dist(a, b), m = (R_(a) + R_(b)) * (a.side === b.side ? 0.95 : 0.8); if (d < m && d > 0.01) { const o = (m - d) / 2, ux = (b.x - a.x) / d, uz = (b.z - a.z) / d; a.x -= ux * o; a.z -= uz * o; b.x += ux * o; b.z += uz * o; } }
  for (const a of G.arrows) a.t += dt; G.arrows = G.arrows.filter(a => a.t < 0.6);
  // enemy reinforcements: from a minute in, a fresh unit marches on every twenty seconds (be decisive)
  if (!G.lesson) { G.reinf = (G.reinf == null ? 50 : G.reinf) - dt; if (G.reinf <= 0) { G.reinf = 15; const t = pick(G.rnd, G.cfg.have), r = mkUnit(G, 1, t, (G.rnd() - 0.5) * FW, -FZ - 2); r.provoked = true; G.ev.push({ k: 'reinf', type: t }); } }
  // the end
  const alive = s => G.units.filter(u => u.side === s && !u.gone && !u.rout).length; if (!G.lesson) { if (!alive(1)) return finish(G, true); if (!alive(0)) return finish(G, false); if (G.bt > 150) return finish(G, false); } }      // the enemy holds the field
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z), nearest = (u, list) => list.reduce((a, q) => !a || dist(u, q) < dist(u, a) ? q : a, null), nearestIn = (u, list, r) => { const q = nearest(u, list); return q && dist(u, q) <= r ? q : null; };
const men = (G, s) => G.units.filter(u => u.side === s && !u.gone).reduce((a, u) => a + u.n, 0);
// one unit strikes another: kind against kind, the angle of the blow (front, flank, rear), a charge, the hill
function melee(G, a, b, dt) { const A = UT[a.type], B = UT[b.type]; let da = Math.atan2(a.z - b.z, a.x - b.x) - b.face; da = Math.abs(Math.atan2(Math.sin(da), Math.cos(da)));
  const side = da > 2.2 ? 3.4 : da > 1.1 ? 2.2 : 1, chg = A.charge && a.charge > 0.5 ? A.charge : 1, hill = onHill(G, a.x, a.z) && !onHill(G, b.x, b.z) ? 1.25 : 1, firm = side === 1 && !b.order && b.fight > 0.5 && !b.rout ? 1 / 1.8 : 1, m = (1 + ((A.beats[b.type] || 1) - 1) * 1.6) * side * chg * hill * firm * (A.range ? 0.6 : 1) * (a.led > 0 ? LED : 1);      // a unit standing firm turns a frontal blow
  if (chg > 1) { a.charge = 0; G.ev.push({ k: 'charge', x: b.x, z: b.z, side: a.side }); }
  if (side > 1 && G.t - (b.lastFlank || -9) > 2) { b.lastFlank = G.t; b.morale -= side > 2 ? 18 : 9; G.ev.push({ k: 'flank', x: b.x, z: b.z, rear: side > 2, by: a.side }); if (a.side === 0) lessonSee(G, 'flank'); }
  hurt(G, b, A.atk * a.n * m * 0.55 * dt / B.def, a, dt); }
function hurt(G, u, dmg, by, dt) { if (u.gone) return; const arm = u.side === 0 ? 1 - 0.08 * upLv('armour') : 1; u.hp -= dmg * arm; const n2 = Math.max(0, Math.ceil(u.hp / UT[u.type].hp)); if (n2 < u.n) { const lost = u.n - n2; u.n = n2; u.morale -= lost / u.n0 * 140 * (u.side === 0 ? 1 - 0.15 * upLv('nerve') : 1); if (by) by.kills += lost; G.ev.push({ k: 'fall', x: u.x, z: u.z, side: u.side, n: lost }); }
  if (u.n <= 0) { u.gone = true; G.ev.push({ k: 'wiped', side: u.side, x: u.x, z: u.z }); if (by && by.side === 0) lessonSee(G, 'beat', u, by); return; }
  if (u.morale <= 0 && !u.rout) { u.rout = true; u.tgt = null; u.order = null; G.ev.push({ k: 'rout', side: u.side, x: u.x, z: u.z, type: u.type }); if (by && by.side === 0) lessonSee(G, 'beat', u, by); } }
// the enemy general: foot advance on the nearest; horses go for your archers round the side; archers close to range
function aiThink(G, u, foes, dt) { if (u.hold) return; u.think = (u.think || 0) - dt; if (u.think > 0) return; u.think = 0.8 + G.rnd() * 0.6; const U = UT[u.type], wit = G.cfg.aiWit;
  if (!foes.length) return; let t = nearest(u, foes);
  // the enemy holds its ground and lets its archers work, until you come close (or a soft target strays near its horses)
  if (!u.provoked) { const near = dist(u, t) < 15 || (U.charge && foes.some(q => UT[q.type].range && dist(u, q) < 22)) || G.units.some(q => q.side === 1 && q.provoked && dist(q, u) < 12); if (!near) { if (U.range && dist(u, t) <= U.range) { u.tgt = t.id; } return; } u.provoked = true; G.ev.push({ k: 'provoked' }); }
  if (U.charge && G.rnd() < wit) { const soft = foes.filter(q => q.type === 'archer' || q.type === 'xbow'); if (soft.length) t = nearest(u, soft); }
  if (U.range) { if (dist(u, t) > U.range * 0.85) { u.order = { x: t.x, z: t.z + (u.z < t.z ? -U.range * 0.7 : U.range * 0.7) }; u.tgt = null; } else { u.order = null; u.tgt = t.id; } return; }
  if (u.type === 'spear' && G.rnd() < wit) { const horse = foes.filter(q => q.type === 'cav' || q.type === 'knight'); if (horse.length && dist(u, nearest(u, horse)) < 20) t = nearest(u, horse); }
  u.tgt = t.id; u.order = null; }
function finish(G, win) { const mine0 = G.units.filter(u => u.side === 0), kept = mine0.reduce((a, u) => a + (u.gone ? 0 : u.n), 0), all = mine0.reduce((a, u) => a + u.n0, 0), k = kept / Math.max(1, all);
  G.over = win ? 'won' : 'lost'; const stars = win ? (k >= 0.55 ? 3 : k >= 0.3 ? 2 : 1) : 0;
  G.res = { win, stars, kept, all, kills: G.units.filter(u => u.side === 1).reduce((a, u) => a + (u.n0 - (u.gone ? 0 : u.n)), 0), routed: G.units.filter(u => u.side === 1 && (u.rout || u.gone)).length, enemy: G.units.filter(u => u.side === 1).length, time: Math.round(G.bt), form: G.form, coins: win ? 4 + Math.ceil(G.N / 3) + stars * 2 : 1 };
  G.ev.push({ k: win ? 'won' : 'lost' }); return true; }
// ---------- LESSONS ----------
const AIMCARD = {"pic": "⚔️", "win": "BREAK THEIR ARMY", "lose": "YOUR ARMY BREAKS", "how": "TAP YOUR UNIT, TAP THE ENEMY"};      // the aim card: specs/aims.json (tools/aims.py)
const LESSONS = {
  1: [{ id: 'order', title: 'ORDERS', say: G => warCue(G)[0], do: G => warCue(G)[1], at: G => warCue(G)[2], how: 'Tap one of your units (blue), then tap a red unit to attack it: men you send in yourself fight twice as hard. Break two enemy units.', need: 2 }],
  2: [{ id: 'match', title: 'SPEARS STOP HORSES', say: G => warCue(G)[0], do: G => warCue(G)[1], at: G => warCue(G)[2], how: 'Horsemen are coming for your archers. Send your SPEARMEN at them. Break two with spears.', need: 2 }],
  3: [{ id: 'flank', title: 'THE FLANK', say: G => warCue(G)[0], do: G => warCue(G)[1], at: G => warCue(G)[2], how: 'Send your horsemen round the side of the red unit that is fighting, and hit it from the side or behind. Three flank blows.', need: 3 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonSetup(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonSetup(G) { const st = lessonNow(G); G.units = []; G.phase = 'battle'; G.bt = 0; G.sel = null;
  if (st.id === 'order') { mkUnit(G, 0, 'sword', -6, 18); mkUnit(G, 0, 'sword', 6, 18); mkUnit(G, 1, 'archer', -10, -14, 0.6).hold = true; mkUnit(G, 1, 'archer', 10, -14, 0.6).hold = true; }
  if (st.id === 'match') { mkUnit(G, 0, 'archer', 0, 26); mkUnit(G, 0, 'spear', -14, 14); mkUnit(G, 0, 'sword', 14, 14); const h = mkUnit(G, 1, 'cav', (G.rnd() - 0.5) * 30, -24, 0.7); h.lesson = 'archers'; }
  if (st.id === 'flank') { mkUnit(G, 0, 'spear', 0, 6); mkUnit(G, 0, 'cav', -20, 20); const e = mkUnit(G, 1, 'sword', 0, -2); e.face = Math.PI / 2; e.tgt = G.units[0].id; } }
function lessonTick(G, dt) { const st = lessonNow(G); for (const u of G.units) { if (u.hold && u.side === 1) { u.order = null; u.tgt = null; }
    if (u.lesson === 'archers' && !u.rout && !u.gone) { const a = G.units.find(q => q.side === 0 && q.type === 'archer' && !q.gone); if (a) u.tgt = a.id; } }
  if (st.id === 'flank') { const e = G.units.find(q => q.side === 1 && !q.gone && !q.rout); if (e) { e.hp = Math.max(e.hp, e.n0 * 6); e.morale = Math.max(e.morale, 40); } const sp = G.units.find(q => q.side === 0 && q.type === 'spear'); if (sp) { sp.hp = sp.n0 * UT.spear.hp; sp.morale = 100; sp.n = sp.n0; } }
  const mine = G.units.filter(q => q.side === 0 && !q.gone && !q.rout), theirs = G.units.filter(q => q.side === 1 && !q.gone && !q.rout);
  if (!mine.length || (st.id === 'flank' && !mine.some(q => UT[q.type].charge))) { lessonMiss(G); lessonSetup(G); return; }      // the horsemen broke: start the lesson again
  if (!theirs.length && st.id !== 'flank') { lessonSetup(G); } }
function lessonSee(G, what, u, by) { const st = lessonNow(G); if (!st) return; let ok = false;
  if (st.id === 'order' && what === 'beat') ok = true; if (st.id === 'match' && what === 'beat') { if (by.type !== 'spear') { G.lesson.n = 0; G.ev.push({ k: 'lessonmiss', how: 'Use the SPEARMEN: spears are what beat horses.' }); return; } ok = true; } if (st.id === 'flank' && what === 'flank') ok = true;
  if (!ok) return; G.lesson.n++; if (G.lesson.n < st.need) { G.ev.push({ k: 'lessonok', n: G.lesson.n, need: st.need }); return; }
  G.lesson.i++; G.lesson.n = 0; if (G.lesson.i >= G.lesson.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.lessonEnd = true; G.wait = 1.6; } else lessonSetup(G); }
function lessonMiss(G) { const st = lessonNow(G); if (!st) return; G.lesson.n = 0; G.ev.push({ k: 'lessonmiss', how: st.how }); }
// ---------- for the robots ----------
// BLIND: a thumb that does not look: taps somewhere on the field (it may pick a unit, or send the picked one there), picks a
// formation card at random, or taps BATTLE / the horn
function tapField(G, x, z) { const u = G.units.find(q => !q.gone && Math.hypot(q.x - x, q.z - z) < R_(q) + 1); if (G.phase === 'deploy') { if (u && u.side === 0) { if (G.pickD && G.pickD !== u.id) { swap(G, G.pickD, u.id); G.pickD = null; } else G.pickD = u.id; } return; }
  if (u && u.side === 0) return select(G, u.id); if (u && u.side === 1 && G.sel) return orderAttack(G, u.id); if (G.sel) return orderTo(G, x, z); return false; }
const BLIND = { t: G => tapField(G, (Math.random() * 2 - 1) * FW, (Math.random() * 2 - 1) * FZ), f: G => { if (G.phase === 'deploy') { if (Math.random() < 0.5) setForm(G, FORMS[(Math.random() * FORMS.length) | 0].id); else battle(G); } else rally(G); } };
// a general who looks: picks a formation for what he sees, then every second or so gives each unit the job its kind is for
// THE TUTORIAL POINTS AT THE VERY UNIT (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing happens"). It said TAP BLUE, TAP
// RED with a hand tapping in a box, on no unit. Now the robot is asked (dryPlanAll, its best order this moment): TAP THIS BLUE (the hand on the
// unit it would send: the spearmen for horses, the horsemen for a flank), then TAP THIS RED (the enemy to hit) or TAP HERE (the ground to ride
// round to first), TAP THE HORN to rally, TAP BATTLE.
const WRC = { t: -1e9, v: null };
function warCue(G) { if (G.over || G.wait > 0) return ['WAIT…', 'wait', false]; const now = performance.now(); if (now - WRC.t < 250) return WRC.v; WRC.t = now; const all = dryPlanAll(G, null, { t: -1, formed: true }), has = n => all.find(q => q[0] === n), B = id => (ui.btn || []).find(b => b.id === id), mid = b => [b.x + b.w / 2, b.y + b.h / 2], at = u => { const p = scr(u.x, 4, u.z); return [p.x, p.y]; }; let v = ['WATCH…', 'wait', false];
  const sel = has('select'), oa = has('orderAttack'), ot = has('orderTo');
  if (has('battle') && B('battle')) v = ['TAP BATTLE', 'tap', mid(B('battle'))];
  else if (has('rally') && B('horn')) v = ['TAP THE HORN', 'tap', mid(B('horn'))];
  else if (sel && G.sel !== sel[1]) { const u = G.units.find(q => q.id === sel[1]); if (u) v = ['TAP THIS BLUE', 'tap', at(u)]; }
  else if (oa) { const e = G.units.find(q => q.id === oa[1]); if (e) v = ['TAP THIS RED', 'tap', at(e)]; }
  else if (ot) { const p = scr(ot[1], 0, ot[2]); v = ['TAP HERE: GO', 'tap', [p.x, p.y]]; }
  WRC.v = v; return v; }
function honest(G, o, mem) { const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random;
  if (G.over || G.wait > 0) return; mem.t = (mem.t || 0) - 1 / 60; if (mem.t > 0) return; mem.t = 0.25 + react * 1.2;
  if (G.phase === 'deploy') { const en = G.units.filter(u => u.side === 1), horse = en.filter(u => UT[u.type].charge).length, shoot = en.filter(u => UT[u.type].range).length;
    if (!mem.formed) { mem.formed = true; ACT.setForm(G, horse >= 2 ? 'wall' : shoot >= 2 ? 'wedge' : 'hammer'); return; } ACT.battle(G); return; }
  const mine = G.units.filter(u => u.side === 0 && !u.gone && !u.rout), foes = G.units.filter(u => u.side === 1 && !u.gone && !u.rout); if (!foes.length) return;
  if (G.rally > 0 && mine.filter(u => u.morale < 30).length >= 2) { ACT.rally(G); return; }
  const engaged = q => G.units.some(m => m.side !== q.side && !m.gone && !m.rout && dist(m, q) < R_(m) + R_(q) + 1), inf = mine.filter(u => !UT[u.type].range && !UT[u.type].charge);
  mem.jobs = mem.jobs || {}; const want = [];
  for (const u of mine) { const U = UT[u.type]; if ((u.fight > 0 && engaged(u)) || u.cd > 0) continue;      // never pull a unit out of a fight
    if (U.range) { const inR = nearestIn(u, foes, U.range); if (inR) { if (u.order) want.push({ u, go: { x: u.x, z: u.z }, v: 0.2 }); continue; } const t = nearest(u, foes), d = dist(u, t), k2 = (d - U.range * 0.85) / d; want.push({ u, go: { x: u.x + (t.x - u.x) * k2, z: u.z + (t.z - u.z) * k2 }, v: 0.9, key: 'arch' }); continue; }
    if (U.charge) { const spears = foes.filter(q => q.type === 'spear'), safe = q => !spears.some(sp => sp !== q && dist(sp, q) < 12 && !engaged(sp)), soft = foes.filter(q => UT[q.type].range && !engaged(q) && safe(q)), busy = foes.filter(q => engaged(q) && !q.rout && q.type !== 'spear' && safe(q)), t = busy.length ? nearest(u, busy) : soft.length ? nearest(u, soft) : null; if (!t) { if (G.bt > 14) want.push({ u, t: nearest(u, foes), v: 0.5 }); continue; }
      // come round to its back: a point behind it first (or wide round the side for archers), then the blow
      const back = { x: t.x - Math.cos(t.face) * (R_(t) + 5), z: t.z - Math.sin(t.face) * (R_(t) + 5) }, wide = { x: Math.sign(t.x - u.x || 1) * (FW - 2), z: t.z };
      const rideWide = Math.abs(u.x) < FW - 6 && Math.abs(u.z - t.z) > 8, way = rideWide ? { x: Math.sign(u.x - t.x || u.x || 1) * (FW - 2), z: (u.z + t.z) / 2 } : busy.includes(t) ? back : wide, near = Math.hypot(u.x - way.x, u.z - way.z) < 4 || (dist(u, t) < R_(u) + R_(t) + 6 && Math.abs(Math.atan2(Math.sin(Math.atan2(u.z - t.z, u.x - t.x) - t.face), Math.cos(Math.atan2(u.z - t.z, u.x - t.x) - t.face))) > 1.2);
      want.push(near && !rideWide ? { u, t, v: 3 } : { u, go: way, v: 2.5, key: 'way' + t.id }); continue; }
    // foot: wait for them to come a little, then meet the right enemy
    const horse = foes.filter(q => UT[q.type].charge), t = u.type === 'spear' && horse.length ? nearest(u, horse) : nearest(u, foes.filter(q => (u.type === 'sword' ? ['spear', 'archer', 'xbow', 'sword'] : ['sword', 'spear', 'archer', 'xbow']).includes(q.type)).length ? foes.filter(q => (u.type === 'sword' ? ['spear', 'archer', 'xbow', 'sword'] : ['sword', 'spear', 'archer', 'xbow']).includes(q.type)) : foes);
    if (G.bt < 3) continue; const helpOut = foes.filter(q => engaged(q) && u.tgt !== q.id && dist(u, q) < 22), t2 = u.type === 'spear' && UT[t.type].charge ? t : helpOut.length && !engaged(u) ? nearest(u, helpOut) : t; want.push({ u, t: t2, v: u.type === 'spear' && UT[t2.type].charge ? 2.8 : 1.5 }); }
  // one order per look: the most needed that is not already being done
  let best = null; for (const w of want) { const done = w.t ? w.u.tgt === w.t.id : w.u.order && Math.hypot(w.u.order.x - w.go.x, w.u.order.z - w.go.z) < 3; if (done) continue; if (!best || w.v > best.v) best = w; }
  if (!best || R() > acc) return; ACT.select(G, best.u.id); if (best.go) ACT.orderTo(G, best.go.x, best.go.z); else ACT.orderAttack(G, best.t.id); }
function winNow(G) { if (!G || G.over || G.wait > 0) return; G.lesson = null; for (const u of G.units) if (u.side === 1) u.gone = true; if (G.phase === 'deploy') { G.phase = 'battle'; G.bt = 0; } finish(G, true); }

// what the robot would do now, without doing it (tools/dry_plan.py): the tutorial shows this move
const ACT_REAL = { setForm, battle, rally, select, orderTo, orderAttack }; let ACT = ACT_REAL;
function dryPlan(G, o, mem) { let got = null; const rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { if (!got && !(a.length > 2 && a.slice(1).every(v => v === 0 || v === false))) got = [n, ...a.slice(1)]; return true; };      /* (a stick at rest, all its numbers 0, is not a move; a first bed, number 0, is) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return got; }
function dryPlanAll(G, o, mem) { const all = [], rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { all.push([n, ...a.slice(1)]); return true; };      /* every call, in order (for a robot that steers and drifts at once) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return all; }
