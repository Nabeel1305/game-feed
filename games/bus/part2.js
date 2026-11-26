
// ===================== THE RULES: Bus Driver =====================
// You drive the bus along its route (it steers itself: the route is set), with two pedals: hold GO to drive, hold BRAKE to
// slow (both ease in: a short press is gentle). Stop with the front door on the stop's mark and the doors open by themselves;
// everyone gets on; leave on time (never before it: the timetable is on screen). Red lights, people on zebra crossings and
// the car in front all need stopping for; a crash ends the shift. Smooth driving keeps the passengers' tea in its cup.
const RULES = [
  '<b>Hold GO</b> (right) to drive, <b>hold BRAKE</b> (left) to slow. Both ease in: tap for a little, hold for a lot.',
  '<b>Stop on the mark.</b> Stop with the front door at the stop\'s mark: the doors open, everyone gets on. Drive past a stop and those people are left behind.',
  '<b>Keep to time.</b> Every stop has a time. Leave on it, not before. Late at the end of the line and the shift is lost.',
  '<b>Red means stop</b>, and so do people on a zebra crossing and the car in front. A crash ends the shift; two red lights too.',
  '<b>Drive smoothly:</b> hard starts and stops spill the tea (and your stars). Someone running for the bus? Wait a moment and they will thank you.',
];
const RT = 11, CARLEN = 4.6, BUSLEN = 12;
const PLACES = [{ name: 'Harbour Town', sky: 'morning', tone: 0 }, { name: 'Downtown', sky: 'noon', tone: 1 }, { name: 'Old Town', sky: 'golden', tone: 2 },
  { name: 'Rainy Ridge', sky: 'rain', tone: 1 }, { name: 'Night Line', sky: 'night', tone: 1 }, { name: 'Sunset Coast', sky: 'sunset', tone: 0 }];
const placeOf = N => Math.floor((N - 1) / 5) % PLACES.length;
const SKINS = [{ id: 'red', name: 'City Red', col: 0xd8322a, stars: 0 }, { id: 'yellow', name: 'School Yellow', col: 0xf2b81a, stars: 5 }, { id: 'green', name: 'Park Green', col: 0x2f9a4a, stars: 12 },
  { id: 'blue', name: 'River Blue', col: 0x2a6ad8, stars: 20 }, { id: 'white', name: 'Express White', col: 0xeef2f6, stars: 30 }, { id: 'purple', name: 'Night Purple', col: 0x6a3ab8, stars: 42 },
  { id: 'orange', name: 'Sunset Orange', col: 0xf0782a, stars: 56 }, { id: 'gold', name: 'Gold Line', col: 0xd6a630, stars: 75 }];
const UPGRADES = [
  { id: 'engine', name: 'Engine', max: 4, cost: l => [30, 70, 140, 250][l], desc: 'Quicker away, a little faster.' },
  { id: 'brakes', name: 'Brakes', max: 3, cost: l => [25, 60, 120][l], desc: 'Stops in a shorter distance.' },
  { id: 'springs', name: 'Springs', max: 3, cost: l => [35, 80, 150][l], desc: 'A smoother ride: less tea spilt.' },
  { id: 'seats', name: 'Comfy seats', max: 3, cost: l => [40, 90, 170][l], desc: 'Happier passengers pay more.' },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Trainee'], [60, 'Driver'], [200, 'Senior driver'], [500, 'Route master'], [1100, 'Inspector'], [2500, 'Depot chief']];
function makeCfg(N, help) { const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), boss = N % 5 === 0;
  return { stops: Math.min(6, 3 + Math.floor(f / 9) + (boss ? 1 : 0)), lights: N >= 2 ? x(0.35, 0.8, 20) : 0, zebras: N >= 3 ? x(0.3, 0.7, 25) : 0, cars: N >= 4 ? x(0.25, 0.7, 25) : 0, zones: N >= 5,
    vRef: x(5.0, 7.3, 26) * (1 - 0.1 * easyOf(N)) * (boss ? 1.04 : 1) * (help ? 0.9 : 1), grace: Math.round(x(28, 8, 22)) + (help ? 10 : 0), boss, help: !!help,
    vmax: 13.5 * (1 + 0.03 * upLv('engine')), acc: 2.3 * (1 + 0.08 * upLv('engine')), brake: 4.6 * (1 + 0.08 * upLv('brakes')), comfy: 2.9 + 0.25 * upLv('springs'), fare: 2 + upLv('seats') }; }
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, wait: 0, next: null, mini: !!o.mini };
  setup(G); if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else G.ev.push({ k: 'start' });
  return G; }
// ---------- the route: straights and quarter turns on a city grid; stops, lights, zebras, speed zones, cars ----------
function route(G, o = {}) { const c = G.cfg, R = G.rnd, legs = [], items = { stops: [], lights: [], zebras: [], zones: [], cars: [] }; let s = 0, turnSide = R() < 0.5 ? 1 : -1;
  const nStraights = o.yard ? o.n : c.stops + 1;
  for (let i = 0; i < nStraights; i++) { const L = o.yard ? 62 : 78 + Math.round(R() * 32), s0 = s; legs.push({ kind: 'S', s0, L }); s += L;
    if (o.yard === 'light') { if (i % 2 === 0) items.lights.push({ s: s0 + L - 6, off: 0, g: 6, a: 2.2, r: 5, startRed: true }); else items.zebras.push({ s: s0 + L * 0.55, p: 1, ped: null, done: false }); }
    else { items.stops.push({ s: s0 + L * (i === nStraights - 1 && !o.yard ? 0.72 : 0.62), n: 2 + ((R() * (o.yard ? 3 : 5)) | 0), served: false, last: i === nStraights - 1 && !o.yard });
      if (!o.yard && i > 0 && R() < c.zebras) items.zebras.push({ s: s0 + L * 0.3, p: 0.75, ped: null, done: false });
      if (!o.yard && i < nStraights - 1 && R() < c.lights) items.lights.push({ s: s0 + L - 5, off: R() * 13, g: 6.5 + R() * 2, a: 2.2, r: 5 + R() * 2 });
      if (!o.yard && c.zones && R() < 0.35) items.zones.push({ s0: s0 + 8, s1: s0 + L * 0.5, lim: 20 / 3.6 * (R() < 0.5 ? 1 : 1.5) });
      if (!o.yard && i < nStraights - 1 && R() < c.cars) items.cars.push({ s: s0 + 30 + R() * 25, v: 0, vt: 7 + R() * 3, gone: false, lane: 0, kind: (R() * 4) | 0 }); }
    if (i < nStraights - 1) { turnSide = R() < 0.6 ? -turnSide : turnSide; legs.push({ kind: 'T', s0: s, L: Math.PI / 2 * RT, side: turnSide }); s += Math.PI / 2 * RT; } }
  G.legs = legs; G.D = s; Object.assign(G, items);
  // the timetable: each stop's time from the distance at a steady pace, with time to board
  G.stops.forEach((st, i) => { const lb = G.lights.filter(L => L.s < st.s).length, zb = G.zebras.filter(Z => Z.s < st.s).length, cb = G.cars.filter(q => q.s < st.s).length; st.due = o.yard === 'stop' ? -1 : Math.round(st.s / (c.vRef * (o.yard ? 0.75 : 1)) + 4 + i * 7 + lb * 4.5 + zb * 2.5 + cb * 3); }); }
function setup(G, o = {}) { const c = G.cfg; G.t = 0; G.yard = o.yard || null; route(G, o.yard ? { yard: o.yard, n: o.yard === 'light' ? 6 : 4, stops: o.yard !== 'light' } : {});
  G.bus = { s: 0, v: 0, a: 0, go: 0, br: 0, goH: false, brH: false, doors: 0, dwell: null, served: 0, stopI: 0 };
  G.tea = 100; G.spill = 0; G.pax = 0; G.boarded = 0; G.fares = 0; G.reds = 0; G.speeding = 0; G.spT = 0; G.late = []; G.early = 0; G.perfect = 0; G.coins = 0; G.tips = 0; G.runner = null; G.ok = 0; G.missed = 0; }
function lightAt(L, t) { if (L.startRed && t < 3.5) return 'r'; const C = L.g + L.a + L.r, p = ((t + L.off) % C + C) % C; return p < L.g ? 'g' : p < L.g + L.a ? 'a' : 'r'; }
// ---------- the pedals ----------
function pedal(G, which, on) { if (G.over || !G.bus) return; const b = G.bus; if (which === 'go') { b.goH = on; if (on && b.doors > 0) G.ev.push({ k: 'doorsopen' }); } else b.brH = on; }
const nextStop = G => G.stops.find(st => !st.served);
const inTurn = (G, s) => G.legs.find(l => l.kind === 'T' && s >= l.s0 - 2 && s < l.s0 + l.L + 2);
// ---------- the clock ----------
function step(G, dt) { if (G.over || !(dt > 0)) return;
  if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0 && G.next) { const f = G.next; G.next = null; f(); } return; }
  G.t += dt; const b = G.bus, c = G.cfg;
  // pedals ease in (a quick press is gentle); off at once when let go
  b.go = b.goH ? Math.min(1, b.go + dt * 1.8) : Math.max(0, b.go - dt * 5); b.br = b.brH ? Math.min(1, b.br + dt * 2.2) : Math.max(0, b.br - dt * 5);
  const st = nextStop(G);
  for (const car of G.cars) if (!car.gone) moveCar(G, car, dt);
  if (b.doors > 0) { doors(G, st, dt); b.a = 0; b.v = 0; return; }
  if (G.yard && b.s > G.D + 8) { if (G.lesson) lessonDeal(G); return; }
  const a = (b.br > 0 ? -b.br * c.brake : b.go * c.acc * (1 - b.v / c.vmax)) - 0.18 - 0.004 * b.v * b.v;
  const v0 = b.v; b.v = Math.max(0, b.v + a * dt); const realA = (b.v - v0) / dt; b.a += (realA - b.a) * Math.min(1, dt * 8);
  const s0 = b.s; b.s += b.v * dt;
  // the tea: hard starts and stops slop it
  const lim = c.comfy, turn = inTurn(G, b.s), lat = turn ? b.v * b.v / RT : 0, ga = Math.hypot(b.a, lat); b.lat = lat * (turn ? turn.side : 0); if (ga > lim) { const d = (ga - lim) * dt * 5; G.tea = Math.max(0, G.tea - d); G.spill += d; if (!G.sloshT || G.t - G.sloshT > 1.2) { G.sloshT = G.t; G.ev.push({ k: 'slosh', a: b.a, turn: lat > Math.abs(b.a) }); } }
  // speed zones and the camera
  const z = G.zones.find(q => b.s >= q.s0 && b.s <= q.s1); if (z && b.v > z.lim + 1.4) { G.spT += dt; if (G.spT > 1.2) { G.spT = -2; G.speeding++; G.coins -= 3; G.ev.push({ k: 'camera' }); } } else G.spT = Math.max(0, G.spT);
  // red lights
  for (const L of G.lights) if (!L.passed && b.s >= L.s) { L.passed = true; const col = lightAt(L, G.t); if (col === 'r') { G.reds++; G.ev.push({ k: 'red', n: G.reds }); if (G.lesson) { lessonMiss(G, 'red'); return; } if (G.reds >= 2) { finish(G, false, { why: 'reds' }); return; } } else { G.ev.push({ k: 'lightok', col }); if (G.lesson) lessonSee(G, 'pass'); } }
  // zebra crossings: people step out as you come; never through them
  for (const Z of G.zebras) { if (Z.done) continue; const d = Z.s - b.s;
    if (!Z.ped && !Z.skip && d < 52 && d > 30) { if (G.rnd() < Z.p) { Z.ped = { t0: G.t, dur: 6.2 + G.rnd() * 1.5, side: G.rnd() < 0.5 ? 1 : -1 }; G.ev.push({ k: 'ped' }); } else Z.skip = true; }
    const on = Z.ped && G.t >= Z.ped.t0 && G.t < Z.ped.t0 + Z.ped.dur;
    if (b.s >= Z.s - 1 && s0 < Z.s - 1) { if (on) { crash(G, 'ped'); return; } }
    if (b.s > Z.s + 2) { Z.done = true; if (Z.ped) { G.ev.push({ k: 'zebraok' }); if (G.lesson) lessonSee(G, 'pass'); } } }
  // the car in front
  for (const car of G.cars) if (!car.gone && b.s > car.s - CARLEN + 0.2) { crash(G, 'car'); return; }
  // stops
  if (st) { const d = st.s - b.s;
    if (b.v < 0.06 && Math.abs(d) <= 1.6) { b.doors = 0.001; b.v = 0; st.at = G.t; st.off = d; const late = st.due >= 0 ? Math.max(0, Math.round(G.t - st.due)) : 0; st.late = late; if (Math.abs(d) <= 0.5) { G.perfect++; G.coins += 2; }
      G.ev.push({ k: 'arrive', perfect: Math.abs(d) <= 0.5, late, n: st.n, last: st.last }); }
    else if (d < -6) { st.served = true; G.missed++; G.ev.push({ k: 'missed', n: st.n }); if (G.lesson) { lessonMiss(G, 'missed'); return; } finish(G, false, { why: 'missed' }); return; }
    else if (b.v < 0.06 && d > 1.6 && d < 14 && !G.hintShort) { G.hintShort = 1; G.ev.push({ k: 'short' }); } }
  if (!G.lesson && !G.yard) { const lastDue = G.stops[G.stops.length - 1].due; if (G.t > lastDue + c.grace + 40) finish(G, false, { why: 'time' }); } }
function doors(G, st, dt) { const b = G.bus;
  if (b.dwell == null) { b.dwell = { t: 0, board: st.n, on: 0, off: st.last ? G.pax : Math.min(G.pax, (G.rnd() * 3) | 0), closing: 0 }; G.ev.push({ k: 'doors', open: true }); }
  const D = b.dwell; D.t += dt; b.doors = Math.min(1, b.doors + dt * 2.5);
  // people step off, then on, one each half second
  const want = D.off + D.board, done = Math.min(want, Math.floor(Math.max(0, D.t - 0.5) / 0.5));
  while (D.on < done) { D.on++; if (D.on <= D.off) { G.pax--; G.ev.push({ k: 'off' }); } else { G.pax++; G.boarded++; G.fares += G.cfg.fare; G.ev.push({ k: 'on', n: D.on - D.off }); } }
  if (D.on < want) return;
  if (st.last) { st.served = true; b.doors = 0; finishRoute(G); return; }
  // ready: leave when you like, but not before the time (a runner may be coming)
  if (!D.ready) { D.ready = G.t; G.ev.push({ k: 'ready', due: st.due }); if (!G.yard && G.rnd() < 0.3) { G.runner = { t0: G.t, eta: 2.6 + G.rnd() * 1.2 }; G.ev.push({ k: 'runner' }); } }
  if (G.runner && G.t - G.runner.t0 >= G.runner.eta) { G.runner = null; G.pax++; G.fares += G.cfg.fare; G.tips++; G.coins += 3; G.ev.push({ k: 'thanks' }); }
  if (b.goH && b.br <= 0) { // go: the doors shut (ding ding) and away
    const early = st.due >= 0 ? Math.max(0, Math.round(st.due - G.t)) : 0; if (early > 0) { G.early++; G.coins -= 2; } st.served = true; st.left = G.t; st.early = early;
    if (G.runner) { G.ev.push({ k: 'leftrunner' }); G.runner = null; }
    G.late.push(st.late || 0); b.doors = 0; b.dwell = null; G.hintShort = 0; G.ev.push({ k: 'depart', early, late: st.late || 0 });
    if (G.lesson) lessonSee(G, 'depart', st); } }
function moveCar(G, car, dt) { // a car ahead: drives on, stops at a red light, turns off at a junction
  let want = car.vt; for (const L of G.lights) { const d = L.s - car.s; if (d > -0.5 && d < 30 && lightAt(L, G.t) !== 'g') want = Math.min(want, Math.max(0, Math.sqrt(2 * 3 * Math.max(0, d - 1)))); }
  for (const Z of G.zebras) { const d = Z.s - car.s; if (Z.ped && d > -0.5 && d < 25 && G.t < Z.ped.t0 + Z.ped.dur) want = Math.min(want, Math.sqrt(2 * 3 * Math.max(0, d - 2))); }
  car.v += clamp(want - car.v, -4 * dt, 2.2 * dt); car.s += car.v * dt;
  const leg = G.legs.find(l => l.kind === 'T' && car.s >= l.s0 && car.s < l.s0 + 2); if (leg && !car.turnChecked) { car.turnChecked = true; if (G.rnd() < 0.6) car.gone = true; } if (!leg) car.turnChecked = false;
  if (car.s > G.D) car.gone = true; }
function crash(G, why) { G.bus.v = 0; G.ev.push({ k: 'crash', why }); if (G.lesson) { lessonMiss(G, why); return; } finish(G, false, { why }); }
function finishRoute(G) { const c = G.cfg, last = G.stops[G.stops.length - 1], lateEnd = Math.max(0, Math.round(G.t - last.due)); G.lateEnd = lateEnd;
  if (G.lesson) { lessonSee(G, 'end'); return; }
  finish(G, lateEnd <= c.grace, { why: lateEnd > c.grace ? 'late' : null }); }
function finish(G, win, o = {}) { if (G.over) return true; G.over = win ? 'won' : 'lost'; const c = G.cfg, served = G.stops.filter(s => s.served && s.at != null).length;
  const onTime = G.late.filter(l => l <= 3).length, allOn = G.late.length && onTime === G.late.length, comfort = Math.round(G.tea);
  const stars = win ? 1 + (allOn && G.lateEnd <= 3 ? 1 : 0) + (comfort >= 80 && G.early === 0 && G.reds === 0 ? 1 : 0) : 0;
  G.res = { win, stars, why: o.why || null, served, stops: G.stops.length, pax: G.boarded, fares: G.fares, lateEnd: G.lateEnd != null ? G.lateEnd : null, grace: c.grace, onTime, legs: G.late.length, early: G.early, reds: G.reds, speeding: G.speeding, comfort, perfect: G.perfect, tips: G.tips,
    coins: Math.max(1, G.fares + G.coins + (win ? Math.ceil(G.N / 2) + stars * 3 + Math.round(comfort / 25) : 0)) };
  G.ev.push({ k: win ? 'won' : 'lost' }); return true; }
// ---------- the robot: a driver who looks ----------
const gauss = () => { let u = 0; for (let i = 0; i < 4; i++) u += Math.random(); return (u - 2) * 1.732; };
function honest(G, o, mem) { if (G.over || G.wait > 0 || !G.bus) return; const b = G.bus, c = G.cfg, acc = o.acc == null ? 0.85 : o.acc, react = o.react == null ? 0.3 : o.react;
  mem.cd = (mem.cd || 0) - 1 / 60; if (mem.cd > 0) return; mem.cd = react * 0.25 * (0.5 + Math.random());
  if (mem.err == null || mem.errFor !== (nextStop(G) || {}).s) { mem.errFor = (nextStop(G) || {}).s; mem.err = gauss() * (1 - acc) * 2.2; }
  const st = nextStop(G);
  if (b.doors > 0) { pedal(G, 'br', false); const D = b.dwell; const ready = D && D.ready != null && D.on >= D.off + D.board; if (ready && !G.runner && (st.due < 0 || G.t >= st.due - 0.2)) pedal(G, 'go', true); else pedal(G, 'go', false); return; }
  const P = busPlan(G, acc, mem.err, st); pedal(G, 'go', P.go); pedal(G, 'br', P.br); }
// what a careful driver's feet do now (the robot's, and the tutorial's cue): { go, br }
function busPlan(G, acc, err, st) { const b = G.bus, c = G.cfg, out = { go: false, br: false };
  let stopAt = Infinity; const dec = 2.0 + acc * 0.6;
  if (st) stopAt = st.s + err;
  for (const L of G.lights) { if (L.passed) continue; const d = L.s - b.s; if (d < 0) continue; const tArr = d / Math.max(1, b.v), col = lightAt(L, G.t + Math.min(tArr, 3)), now = lightAt(L, G.t); if (now !== 'g' && !(now === 'a' && d < b.v * 0.9) || (now === 'g' && col !== 'g' && d > b.v * b.v / (2 * dec) + 3)) stopAt = Math.min(stopAt, L.s - 1.5); }
  for (const Z of G.zebras) { if (Z.done) continue; const d = Z.s - b.s; if (Z.ped && G.t < Z.ped.t0 + Z.ped.dur && d > 0) stopAt = Math.min(stopAt, Z.s - 3); }
  for (const car of G.cars) if (!car.gone && car.s > b.s) stopAt = Math.min(stopAt, car.s - CARLEN - 4 - b.v * 0.6);
  const z = G.zones.find(q => b.s >= q.s0 - 15 && b.s <= q.s1); let vlim = z ? z.lim + 0.5 : c.vmax * 0.95; const vt0 = Math.sqrt(c.comfy * RT) * (0.88 + 0.08 * acc);
  for (const l of G.legs) { if (l.kind !== 'T') continue; const d0 = l.s0 - 2 - b.s; if (b.s > l.s0 + l.L + 2) continue; vlim = Math.min(vlim, d0 <= 0 ? vt0 : Math.sqrt(vt0 * vt0 + 2 * dec * 0.8 * d0)); }
  const d = stopAt - b.s, vt = Math.min(vlim, d > 0 ? Math.sqrt(2 * dec * Math.max(0, d)) : 0);
  const need = d > 0.3 ? b.v * b.v / (2 * Math.max(0.3, d)) : 9;
  if (b.v > vt + 0.25 || need > dec * 0.9) { out.go = false; out.br = b.br * c.brake < Math.max(need, 0.8) + 0.2; }
  else if (b.v < vt - 0.6 && d > 0.4) { out.br = false; out.go = b.go < 0.55 + 0.45 * acc || b.v > 3; }
  else { out.go = false; out.br = false; }
  if (b.v < 0.3 && d < 0.6 && d > -1.5 && st && Math.abs(st.s - b.s) <= 1.6) { out.go = false; out.br = true; }
  return out; }
// blind moves (no looking): GO down/up, BRAKE down/up
const BLIND = { g: G => pedal(G, 'go', !G.bus.goH), b: G => pedal(G, 'br', !G.bus.brH), n: G => { pedal(G, 'go', false); pedal(G, 'br', false); } };
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.wait = 0; G.stops.forEach(s => { s.served = true; s.at = s.at || G.t; }); G.late = G.stops.map(() => 0); G.lateEnd = 0; finish(G, true); }
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'stop', title: 'GO, BRAKE, STOP ON THE MARK', say: G => busCue(G)[0], do: G => busCue(G)[1], at: G => busCue(G)[2], how: 'Hold GO (right) to drive. Hold BRAKE (left) to slow. Stop with the front door on the yellow mark: the doors open by themselves. Serve 2 stops.', need: 2 }],
  2: [{ id: 'time', title: 'KEEP TO TIME', say: G => busCue(G)[0], do: G => busCue(G)[1], at: G => busCue(G)[2], how: 'Every stop has a time. When everyone is on, wait for the time, then press GO to leave. Not before it! Leave 2 stops on time.', need: 2 }],
  3: [{ id: 'light', title: 'RED LIGHTS AND ZEBRAS', say: G => busCue(G)[0], do: G => busCue(G)[1], at: G => busCue(G)[2], how: 'Stop at a red light and go on green. Stop for people on a zebra crossing. Get past 3 of them safely.', need: 3 }],
};
// THE TUTORIAL SHOWS THE PEDAL FOR THIS MOMENT (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing happens"). It said
// HOLD GO, STOP ON YELLOW for the whole lesson; now it is what a careful driver's feet do this second (busPlan, the robot's own driving):
// HOLD GO on the right, HOLD BRAKE on the left, LET GO, WAIT while people get on, and at the stop's time TAP GO.
function busCue(G) { const b = G.bus; if (!b || G.wait > 0) return ['WAIT…', 'wait', false]; const R = [W * 0.76, H * 0.72], Lf = [W * 0.24, H * 0.72], st = nextStop(G);
  if (b.doors > 0) { const D = b.dwell, ready = D && D.ready != null && D.on >= D.off + D.board; if (!ready || G.runner) return ['WAIT: PEOPLE GETTING ON', 'wait', false]; if (st && st.due >= 0 && G.t < st.due - 0.2) return ['WAIT FOR THE TIME…', 'wait', false]; return ['HOLD GO', 'hold', R]; }
  const P = busPlan(G, 1, 0, st); if (P.br) return [b.v < 0.3 ? 'KEEP HOLDING BRAKE' : 'HOLD BRAKE', 'hold', Lf]; if (P.go) return ['HOLD GO', 'hold', R]; return [b.goH || b.brH ? 'LET GO' : 'ROLL…', b.goH || b.brH ? 'release' : 'wait', b.goH ? R : b.brH ? Lf : false]; }
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonDeal(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonDeal(G) { const st = lessonNow(G); G.rnd = rng(G.seed + (G.deals = (G.deals | 0) + 1)); const n = G.lesson.n; setup(G, { yard: st.id }); G.lesson.n = st.id === 'stop' ? 0 : n; G.ev.push({ k: 'yard' }); }
function lessonMiss(G, why) { const msg = { red: 'That light was RED! Stop at the line until it is green.', ped: 'Someone was on the crossing! Stop for them.', car: 'Too close! Brake in time.', missed: 'You drove past the stop! Brake sooner: stop with the door on the mark.' }[why] || lessonNow(G).how;
  G.ev.push({ k: 'lessonmiss', how: msg }); G.wait = 1.6; G.next = () => lessonDeal(G); }
function lessonSee(G, what, st) { const L = lessonNow(G); if (!L || G.wait > 0) return;
  if (L.id === 'stop' && what === 'depart') { G.lesson.n++; G.ev.push({ k: 'lessonok', n: G.lesson.n, need: L.need }); }
  if (L.id === 'time' && what === 'depart') { if (st.early > 0) { G.lesson.n = 0; G.ev.push({ k: 'lessonreset', how: `Too early by ${st.early} s! Wait for the stop's time, then GO.` }); } else if (st.late > 12) { G.ev.push({ k: 'lessonreset', how: 'A bit late: drive on sooner between stops.' }); } else { G.lesson.n++; G.ev.push({ k: 'lessonok', n: G.lesson.n, need: L.need }); } }
  if (L.id === 'light' && what === 'pass') { G.lesson.n++; G.ev.push({ k: 'lessonok', n: G.lesson.n, need: L.need }); }
  if (what === 'end' && G.lesson.n < L.need) { lessonDeal(G); return; }
  if (G.lesson.n < L.need) return;
  G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.wait = 1.4; G.next = () => { G.rnd = rng(G.seed); setup(G); G.ev.push({ k: 'start' }); G.ev.push({ k: 'yard' }); }; }
