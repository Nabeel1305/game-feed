
// ===================== RULES: Fire Crew (game 58, mine for set 10) =====================
// A building on fire at night, seen from your fire engine in the street. Its front is a grid of windows. HOLD your thumb on the
// screen and the hose sprays where your thumb points (the water lands just above your thumb, a moment behind it, and the wind
// pushes it sideways); LIFT and it stops. Water puts fire out; fire left alone grows, and a window that is fully ablaze spreads
// to its neighbours, mostly upwards. The tank runs dry if you spray without stopping: lift your thumb and it refills.
// People wave from windows; smoke from fire around them chokes them. TAP a person whose own window is not burning and the
// ladder goes up and brings them down (if their window flares up while it climbs, it has to come back). Later: gas bottles
// (a window with one explodes when it catches, lighting everything round it), hot windows (backdraft: they glow, heat up and
// burst into flame unless you cool them first), wind that shifts, more floors, more people.
// Win: every fire out and every person down. Lose: too many people lost, or half the building ablaze.
const RULES = [
  '<b>Hold your thumb</b> on the fire: the hose sprays just above it. <b>Lift</b> to stop.',
  'Fire grows and <b>climbs</b>. A window fully ablaze lights its neighbours. Put fires out early.',
  'The <b>tank</b> runs dry: lift your thumb and it refills.',
  '<b>Tap a person</b> to send the ladder, once their own window is not burning. Smoke around them chokes them.',
  'Later: <b>gas bottles</b> 🧯 explode when fire reaches them; <b>hot windows</b> glow and burst unless you cool them; <b>wind</b> 🚩 bends the water.',
  'Win: every fire out, everyone down. Stars for no one lost and a fast job.',
];
const PLACES = [{ name: 'Elm Street', brick: 0x8a4a3a }, { name: 'The Old Mill', brick: 0x6a5a4a }, { name: 'Harbour Flats', brick: 0x5a6a7a }, { name: 'The Grand Tower', brick: 0x7a6a5a }];
const placeOf = N => Math.floor((N - 1) / 5) % 4;
const WEATHERS = ['dusk', 'night', 'night', 'rain', 'night', 'storm', 'dusk', 'night', 'mist', 'night'];
const weatherOf = N => N <= 3 ? ['dusk', 'night', 'night'][N - 1] : WEATHERS[(N * 7 + 3) % WEATHERS.length];
const UPGRADES = [
  { id: 'pump', name: 'Big pump', desc: 'The water puts fire out 15% faster.', max: 2, cost: l => 35 + l * 45 },
  { id: 'tank', name: 'Bigger tank', desc: 'Spray for longer before it runs dry.', max: 2, cost: l => 35 + l * 45 },
  { id: 'ladder', name: 'Fast ladder', desc: 'The ladder climbs faster.', max: 1, cost: l => 60 },
  { id: 'mask', name: 'Smoke masks', desc: 'People last longer in the smoke.', max: 1, cost: l => 80 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Recruit'], [40, 'Firefighter'], [130, 'Crew leader'], [320, 'Station officer'], [700, 'Fire chief'], [1500, 'Legend']];
function makeCfg(N, help) { const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), e = easyOf(N);
  const C = Math.min(5, 4 + Math.floor(f / 12)), R = Math.min(6, 4 + Math.floor(f / 8)), cells = C * R;
  return { N, f, help: !!help, place: placeOf(N), weather: weatherOf(N), C, R, fires: Math.round(x(5, 8, 30)),
    grow: x(0.06, 0.075, 30) * (1 + 0.5 * e) * (help ? 0.8 : 1), spreadT: x(4.5, 3.4, 30), power: 1.0 * (1 + 0.15 * upLv('pump')), rad: 0.7,
    tank: 6 + 2 * upLv('tank'), refill: 1.0, people: Math.min(Math.floor(cells / 3), 2 + Math.floor(f / 5)), smoke: x(0.05, 0.11, 30) * (1 - 0.15 * upLv('mask')) * (help ? 0.8 : 1),
    allow: Math.floor((2 + Math.floor(f / 5)) / 3), gas: N >= 4 ? Math.round(x(1, 4, 30)) : 0, hot: N >= 7 ? Math.round(x(1, 3, 30)) : 0, wind: N >= 5 ? x(0.35, 1.1, 30) : 0,
    ladder: (1.0 - 0.3 * upLv('ladder')), burnOut: 0.5 }; }
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, place: cfg.place, weather: cfg.weather, wait: 0, next: null };
  setup(G); if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else G.ev.push({ k: 'start' });
  return G; }
function setup(G, o = {}) { const c = G.cfg, R = G.rnd, C = c.C, Rr = c.R; G.C = C; G.R = Rr;
  G.w = []; for (let r = 0; r < Rr; r++) for (let q = 0; q < C; q++) G.w.push({ c: q, r, f: 0, sp: 0, wet: 0, gas: false, hot: 0, isHot: false, p: null });
  const free = () => { for (let n = 0; n < 200; n++) { const w = G.w[(R() * G.w.length) | 0]; if (!w.f && !w.p && !w.gas && !w.isHot) return w; } return G.w.find(w => !w.f && !w.p); };
  const nf = o.fires != null ? o.fires : c.fires; for (let i = 0; i < nf; i++) { const w = free(); if (w) w.f = 0.4 + 0.5 * R(); }
  const np = o.people != null ? o.people : c.people; for (let i = 0; i < np; i++) { const lit = G.w.filter(w => w.f > 0), near = lit.length ? nbs(G, lit[(R() * lit.length) | 0]).filter(q => !q.f && !q.p) : []; const w = near.length && R() < 0.8 ? near[(R() * near.length) | 0] : free(); if (w) w.p = { s: 0, st: 'in', id: i }; }      /* most people start next to a fire */
  for (let i = 0; i < (o.gas != null ? o.gas : c.gas); i++) { const w = free(); if (w) w.gas = true; }
  for (let i = 0; i < (o.hot != null ? o.hot : c.hot); i++) { const w = free(); if (w) { w.isHot = true; w.hot = 0.15 + 0.2 * R(); } }
  G.tank = c.tank * (o.tankK || 1); G.tankMax = G.tank; G.on = false; G.dry = 0; G.aim = { x: (C - 1) / 2, y: (Rr - 1) / 2 }; G.land = { x: G.aim.x, y: G.aim.y }; G.wind = 0; G.windT = 3; G.useWind = o.wind != null ? o.wind : c.wind;
  G.lad = null; G.rescued = 0; G.lost = 0; G.outs = 0; G.blasts = 0; G.spread = o.spread != null ? o.spread : true; G.dead = o.dead != null ? o.dead : true; G.peak = 0; }
const at = (G, c, r) => (c >= 0 && c < G.C && r >= 0 && r < G.R) ? G.w[r * G.C + c] : null;
const nbs = (G, w) => [at(G, w.c - 1, w.r), at(G, w.c + 1, w.r), at(G, w.c, w.r + 1), at(G, w.c, w.r - 1)].filter(Boolean);
const burning = G => G.w.filter(w => w.f > 0 || (w.isHot && w.hot > 0));
const inside = G => G.w.filter(w => w.p && w.p.st === 'in');
// ---------- what you do ----------
function aimAt(G, x, y) { G.aim.x = x; G.aim.y = y; }
function hoseOn(G) { if (G.over || G.wait > 0) return false; G.on = true; return true; }
function hoseOff(G) { G.on = false; return true; }
// a tap on a window: the ladder, if a person is there and their window is not burning
function tapWin(G, c, r) { if (G.over || G.wait > 0) return false; const w = at(G, Math.round(c), Math.round(r)); if (!w || !w.p || w.p.st !== 'in') return false;
  if (G.lad) { G.ev.push({ k: 'busy' }); return false; } if (w.f > 0.15) { G.ev.push({ k: 'hot', c: w.c, r: w.r }); return false; }
  G.lad = { w, t: 0, dur: (1.6 + 0.45 * w.r) * G.cfg.ladder, got: false }; G.ev.push({ k: 'ladder', c: w.c, r: w.r }); return true; }
function ignite(G, w, f) { if (!w || w.f > 0) return; if (w.wet > 0.3 && G.rnd() < w.wet) return; w.f = f; w.sp = 0; if (w.isHot) { w.isHot = false; w.hot = 0; } G.ev.push({ k: 'catch', c: w.c, r: w.r }); if (w.gas) blast(G, w); }
function blast(G, w) { w.gas = false; w.f = 1; G.blasts++; G.ev.push({ k: 'blast', c: w.c, r: w.r }); for (let dc = -1; dc <= 1; dc++) for (let dr = -1; dr <= 1; dr++) { const q = at(G, w.c + dc, w.r + dr); if (q && q !== w) { if (q.f > 0) q.f = Math.min(1, q.f + 0.4); else ignite(G, q, 0.55); if (q.p && q.p.st === 'in') q.p.s += 0.25; } } }
function step(G, dt) { if (G.over || !(dt > 0)) return; G.t += dt;
  if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0) { G.wait = 0; const f = G.next; G.next = null; if (f) f(); } return; }
  const c = G.cfg;
  // wind
  if (G.useWind) { G.windT -= dt; if (G.windT <= 0) { G.windT = 5 + 4 * G.rnd(); const nw = (G.rnd() * 2 - 1) * G.useWind; if (Math.abs(nw - G.wind) > 0.4) G.ev.push({ k: 'wind', w: nw }); G.wind = nw; } }
  // the water: lands where you aim, a moment behind, pushed by the wind
  const tx = G.aim.x + G.wind, ty = G.aim.y, ease = 1 - Math.exp(-dt * 9); G.land.x += (tx - G.land.x) * ease; G.land.y += (ty - G.land.y) * ease;
  const spraying = G.on && G.tank > 0;
  if (G.on) { G.tank = Math.max(0, G.tank - dt); if (G.tank <= 0 && G.dry <= 0) { G.ev.push({ k: 'dry' }); G.dry = 1; } G.idle = 0; } else { G.idle = (G.idle || 0) + dt; if (G.idle > 0.25) G.tank = Math.min(G.tankMax, G.tank + c.refill * dt); if (G.tank > 0.5) G.dry = 0; }
  for (const w of G.w) { w.wet = Math.max(0, w.wet - dt * 0.4);
    if (spraying) { const d = Math.hypot(w.c - G.land.x, (w.r - G.land.y) * 0.9); if (d < c.rad) { const k = c.power * dt * (1 - d / c.rad * 0.6); w.wet = Math.min(1, w.wet + dt * 2);
      if (w.f > 0) { w.f -= k; if (w.f <= 0) { w.f = 0; w.sp = 0; G.outs++; G.ev.push({ k: 'out', c: w.c, r: w.r }); lessonSee(G, 'out'); } }
      if (w.isHot && w.hot > 0) { w.hot -= k * 0.8; if (w.hot <= 0) { w.hot = 0; w.isHot = false; G.ev.push({ k: 'cooled', c: w.c, r: w.r }); } } } }
    if (w.f > 0) { w.f = Math.min(1, w.f + c.grow * dt); if (w.f >= 1 && G.spread) { w.sp += dt; if (w.sp >= c.spreadT) { w.sp = 0; const R = G.rnd(), dir = R < 0.45 ? [0, 1] : R < 0.7 ? [-1, 0] : R < 0.95 ? [1, 0] : [0, -1]; ignite(G, at(G, w.c + dir[0], w.r + dir[1]), 0.2); } } }
    if (w.isHot && G.spread) { w.hot += c.grow * 0.55 * dt; if (w.hot >= 1) { w.isHot = false; w.hot = 0; w.f = 1; G.ev.push({ k: 'burst', c: w.c, r: w.r }); for (const q of nbs(G, w)) ignite(G, q, 0.45); } } }
  // the people: smoke from fire around them
  for (const w of G.w) { const p = w.p; if (!p || p.st !== 'in') continue; if (G.lad && G.lad.w === w && G.lad.got) continue;
    const sm = w.f + nbs(G, w).reduce((a, q) => a + q.f * 0.45, 0) + (at(G, w.c, w.r - 1) ? at(G, w.c, w.r - 1).f * 0.3 : 0);
    if (sm > 0.05) p.s += sm * c.smoke * dt; else p.s = Math.max(0, p.s - 0.03 * dt);
    if (p.s >= 1) { if (!G.dead) p.s = 0.95; else { p.st = 'lost'; G.lost++; G.ev.push({ k: 'lostp', c: w.c, r: w.r }); } } }
  // the ladder
  if (G.lad) { const L = G.lad; L.t += dt;
    if (!L.got && L.t >= L.dur * 0.5) { if (L.w.f > 0.35 || L.w.p.st !== 'in') { G.ev.push({ k: 'ladderback' }); L.got = 'no'; L.t = L.dur - L.t; } else { L.got = true; G.ev.push({ k: 'grab', c: L.w.c, r: L.w.r }); } }
    if (L.t >= L.dur) { if (L.got === true) { L.w.p.st = 'safe'; G.rescued++; G.ev.push({ k: 'rescued', n: G.rescued }); lessonSee(G, 'rescued'); } G.lad = null; } }
  // how it ends
  const ablaze = G.w.filter(w => w.f >= 0.95).length; G.peak = Math.max(G.peak, ablaze / G.w.length);
  if (G.lesson) { if (!burning(G).length && !inside(G).length && !G.lad) lessonSee(G, 'clear'); return; }
  if (G.lost > c.allow) { G.wait = 1.1; G.next = () => finish(G, false, 'people'); return; }
  if (ablaze >= G.w.length * c.burnOut) { G.ev.push({ k: 'collapse' }); G.wait = 1.1; G.next = () => finish(G, false, 'fire'); return; }
  if (!burning(G).length && !inside(G).length && !G.lad) { G.ev.push({ k: 'allout' }); G.wait = 1.2; G.next = () => finish(G, true); } }
function finish(G, win, why) { if (G.over) return true; G.over = win ? 'won' : 'lost'; const c = G.cfg, par = 25 + 6 * c.C * c.R / 3;
  const stars = win ? 1 + (G.lost === 0 ? 1 : 0) + (G.t <= par ? 1 : 0) : 0;
  G.res = { win, why: why || null, stars, saved: G.rescued, lost: G.lost, people: G.w.filter(w => w.p).length, outs: G.outs, blasts: G.blasts, time: Math.round(G.t), par: Math.round(par), coins: win ? 4 + Math.ceil(G.N / 3) + stars * 2 : 1 + G.rescued };
  G.ev.push({ k: win ? 'won' : 'lost', why }); return true; }
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'hose', title: 'THE HOSE', say: G => fireCue(G)[0], do: G => fireCue(G)[1], at: G => fireCue(G)[2], how: 'Hold your thumb on a fire: the water lands just above your thumb. Put every fire out.', need: 1 }],
  2: [{ id: 'ladder', title: 'THE LADDER', say: G => fireCue(G)[0], do: G => fireCue(G)[1], at: G => fireCue(G)[2], how: 'Someone is trapped! Put out the fire in their window, then TAP them to send up the ladder.', need: 1 }],
  3: [{ id: 'tank', title: 'THE TANK', say: G => fireCue(G)[0], do: G => fireCue(G)[1], at: G => fireCue(G)[2], how: 'The tank runs dry if you never stop. Lift your thumb to let it refill. Put every fire out.', need: 1 }],
};
// THE TUTORIAL'S HAND IS ON THE FIRE TO HOSE, OR THE PERSON TO SAVE (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then
// nothing happens"). It said HOLD ON THE FIRE with the hand in a box. Now the robot is asked (dryPlan): HOLD HERE with the hand just under the
// fire it would hose (the water lands above the thumb, wind allowed for), TAP THEM with the hand on a person whose window is out, LET GO TO
// REFILL when the tank is nearly dry, WAIT while it fills.
function fireCue(G) { if (G.over || G.wait > 0) return ['WAIT…', 'wait', false]; const cellAt = (c, r) => { const v = wScreen((c - (G.C - 1) / 2) * SX, r * SY + Y0, 0); return [v.x, v.y]; };
  const P = dryPlan(G, null, { rest: false, wt: 99 }); if (G.tank <= G.tankMax * 0.2 && G.on) return ['LET GO TO REFILL', 'release', false];
  if (!P) return ['WAIT…', 'wait', false];
  if (P[0] === 'tapWin') return ['TAP THEM!', 'tap', cellAt(P[1], P[2])];
  if (P[0] === 'aimAt') { const [x, y] = cellAt(P[1], P[2]); return [G.on ? "KEEP HOLDING" : "HOLD HERE", 'hold', [x, y + AIMUP()]]; }
  return [G.tank < G.tankMax * 0.5 && !G.on ? "WAIT: IT IS FILLING" : 'WAIT…', 'wait', false]; }
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonDeal(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonDeal(G) { const st = lessonNow(G);
  if (st.id === 'hose') setup(G, { fires: 3, people: 0, gas: 0, hot: 0, wind: 0, spread: false, dead: false });
  if (st.id === 'ladder') { setup(G, { fires: 0, people: 0, gas: 0, hot: 0, wind: 0, spread: false, dead: false }); const w = at(G, 1, 2); w.p = { s: 0, st: 'in', id: 0 }; w.f = 0.4; }
  if (st.id === 'tank') setup(G, { fires: 5, people: 0, gas: 0, hot: 0, wind: 0, spread: false, dead: false, tankK: 0.6 }); }
function lessonSee(G, what) { const st = lessonNow(G); if (!st) return; let ok = null;
  if (what === 'clear') ok = true;
  if (!ok) return;
  G.lesson.i++; if (G.lesson.i >= G.lesson.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.wait = 1.6; G.next = () => { G.rnd = rng(G.seed); setup(G); G.t = 0; G.ev.push({ k: 'start' }); }; } else { G.wait = 1.2; G.next = () => lessonDeal(G); } }
// ---------- for the robots ----------
// BLIND: a thumb that does not look: press (spray where it is), lift, move to somewhere on the building, tap somewhere
const rndPt = G => ({ x: Math.random() * (G.C - 1), y: Math.random() * (G.R - 1) });
const BLIND = { h: G => hoseOn(G), u: G => hoseOff(G), m: G => { const p = rndPt(G); aimAt(G, p.x, p.y); }, t: G => { const p = rndPt(G); hoseOff(G); tapWin(G, p.x, p.y); } };
// a person who looks: sends the ladder to anyone it can reach, sprays the fire that matters most (near people, gas, hot windows,
// the biggest), corrects for the wind after a moment, lifts when the tank runs low, and is a little off aim
function honest(G, o, mem) { const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random, dt = 1 / 60, c = G.cfg;
  if (G.over || G.wait > 0) { ACT.hoseOff(G); return; }
  mem.t = (mem.t || 0) - dt; mem.wt = G.wind === mem.lw ? (mem.wt || 0) + dt : 0; mem.lw = G.wind;
  if (mem.rest) { ACT.hoseOff(G); if (G.tank >= G.tankMax * (acc > 0.8 ? 0.6 : 0.35)) mem.rest = false; else return; }
  if (G.tank <= 0.15) { mem.rest = true; ACT.hoseOff(G); return; }
  if (mem.t > 0) { if (mem.tg) { const comp = mem.wt > react ? G.wind * (0.6 + 0.4 * acc) : 0; ACT.aimAt(G, mem.tg.c - comp + mem.jx, mem.tg.r + mem.jy); } return; }
  mem.t = 0.2 + react * 0.6;
  if (!G.lad) { let best = null; for (const w of G.w) if (w.p && w.p.st === 'in' && w.f <= 0.1 && (!best || w.p.s > best.p.s)) best = w; if (best && R() < acc + 0.1) { ACT.hoseOff(G); ACT.tapWin(G, best.c, best.r); return; } }
  let tg = null, tv = -1; for (const w of G.w) { if (!(w.f > 0) && !(w.isHot && w.hot > 0)) continue;
    const nearP = [w, ...nbs(G, w)].reduce((a, q) => a + (q.p && q.p.st === 'in' ? 1 + q.p.s * 2 : 0), 0), gasN = nbs(G, w).some(q => q.gas) ? 1.5 : 0;
    const v = w.f + nearP * 0.8 + gasN + (w.isHot ? w.hot * 1.5 : 0) + (w.f >= 1 ? 0.6 : 0) - Math.hypot(w.c - G.land.x, w.r - G.land.y) * 0.15; if (v > tv) { tv = v; tg = w; } }
  if (!tg) { ACT.hoseOff(G); mem.tg = null; return; }
  if (tg !== mem.tg) { mem.jx = (R() - 0.5) * (1 - acc) * 1.6; mem.jy = (R() - 0.5) * (1 - acc) * 1.2; } mem.tg = tg;
  const comp = mem.wt > react ? G.wind * (0.6 + 0.4 * acc) : 0; ACT.aimAt(G, tg.c - comp + mem.jx, tg.r + mem.jy); ACT.hoseOn(G); }
function winNow(G) { if (!G || G.over || G.wait > 0) return; G.lesson = null; for (const w of G.w) { w.f = 0; w.isHot = false; w.hot = 0; if (w.p && w.p.st === 'in') { w.p.st = 'safe'; G.rescued++; } } G.lad = null; finish(G, true); }

// what the robot would do now, without doing it (tools/dry_plan.py): the tutorial shows this move
const ACT_REAL = { tapWin, aimAt, hoseOff, hoseOn }; let ACT = ACT_REAL;
function dryPlan(G, o, mem) { let got = null; const rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { if (!got && !(a.length > 2 && a.slice(1).every(v => v === 0 || v === false))) got = [n, ...a.slice(1)]; return true; };      /* (a stick at rest, all its numbers 0, is not a move; a first bed, number 0, is) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return got; }
