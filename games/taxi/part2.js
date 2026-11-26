
// ===================== THE RULES: Taxi Driver =====================
// (second version, 23 Nov 2026: his words on Police Chase's car, applied here; specs/taxi-v2-2026-11-23.md) A city of blocks. YOU
// DRIVE: the left thumb's stick steers; the right thumb holds GAS or BRAKE (BRAKE held at a standstill reverses). Someone waving
// on the kerb: pull over to the kerb and stop beside them in the ring; they get in and the meter starts. Find the way (the GPS
// arrow, the map) and stop at their door. Early with a tip, late with half the fare; too late and they walk. Red lights cost a
// ticket; three crashes end the shift. The taxi is anywhere on the streets (x east, y north, heading th clockwise from north);
// every frame `locate` works out which road it is on (i, j, h), how far along (s) and how far right of the middle (lx), and the
// fares, the GPS, the lights and the other cars go by those, as they always did.
const RULES = [
  '<b>You drive.</b> Left thumb: the stick steers. Right thumb: <b>GAS</b> and <b>BRAKE</b> (hold BRAKE when stopped to reverse).',
  '<b>Keep right</b> of the yellow line; steer round slow cars. <b>Brake for corners.</b> The <b>GPS arrow</b> shows the way.',
  '<b>Pick up:</b> someone waving on the kerb: pull over to the kerb and stop in their ring. <b>Drop off</b> the same way at the glowing door.',
  '<b>Beat the meter</b> for a tip. Let it run out and they walk. A <b>rusher</b> ⚡ tips big for speed; a <b>nervous</b> one 😰 hates crashes, red lights and screeching corners; a <b>tourist</b> 📷 tips if you pass the fountain.',
  'Red lights: a ticket. <b>Three crashes</b> end the shift. Red streets on the map are jams; 🚧 are road works.',
];
const BL = 52, NX = 8, NY = 8, LANES = [2.0, 5.4], CARLEN = 4.6, ZONE = 24, VTURN = 9.5, HW = 7.6;      // HW: half the road's width
const wrapPi = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
const DIRS = [[0, 1], [1, 0], [0, -1], [-1, 0]];      // N E S W (in grid steps; north is +j)
const PLACES = [{ name: 'Midtown', sky: 'morning' }, { name: 'Riverside', sky: 'noon' }, { name: 'Old Quarter', sky: 'golden' }, { name: 'Rainy Avenue', sky: 'rain' }, { name: 'Night Shift', sky: 'night' }, { name: 'Sunset Strip', sky: 'sunset' }];
const placeOf = N => Math.floor((N - 1) / 5) % PLACES.length;
const SKINS = [{ id: 'yellow', name: 'Classic Yellow', col: 0xffc61a, stars: 0 }, { id: 'green', name: 'Garden Green', col: 0x2f9a4a, stars: 5 }, { id: 'black', name: 'City Black', col: 0x1c1e22, stars: 12 },
  { id: 'white', name: 'Pearl White', col: 0xeef2f6, stars: 20 }, { id: 'pink', name: 'Bubblegum', col: 0xff7ab0, stars: 30 }, { id: 'blue', name: 'Harbour Blue', col: 0x2a6ad8, stars: 42 },
  { id: 'orange', name: 'Tangerine', col: 0xf0782a, stars: 56 }, { id: 'gold', name: 'Gold Cab', col: 0xd6a630, stars: 75 }];
const UPGRADES = [
  { id: 'engine', name: 'Engine', max: 4, cost: l => [30, 70, 140, 250][l], desc: 'A higher top speed and quicker away.' },
  { id: 'brakes', name: 'Brakes', max: 3, cost: l => [25, 60, 120][l], desc: 'Stops in a shorter distance.' },
  { id: 'gps', name: 'Smart GPS', max: 1, cost: l => [120][l], desc: 'The GPS knows the jams and goes round them.' },
  { id: 'seats', name: 'Comfy seats', max: 3, cost: l => [40, 90, 170][l], desc: 'Nervous passengers forgive one more bump; everyone tips more.' },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'New driver'], [60, 'Cabbie'], [200, 'Night owl'], [500, 'Street king'], [1100, 'Road legend'], [2500, 'Taxi tycoon']];
const TYPES = { plain: { name: 'Passenger', icon: '🙂', time: 1, tip: 1 }, rush: { name: 'Rusher', icon: '⚡', time: 0.8, tip: 2 }, calm: { name: 'Nervous', icon: '😰', time: 1.3, tip: 1.5 }, sight: { name: 'Tourist', icon: '📷', time: 1.15, tip: 1 } };
function makeCfg(N, help) { const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), boss = N % 5 === 0;
  return { fares: N === 1 || N > 5 ? 4 : 3, hailNear: N <= 1 ? 1 : 1.5, hailFar: N <= 1 ? 2 : 3, lights: N >= 2, cars: N === 1 ? 0.3 : x(0.7, 2.6, 18), works: N >= 4 ? Math.round(x(2, 8, 20)) : 0, jams: N >= 6 ? Math.round(x(2, 9, 25)) : 0,
    far: x(9.5, 10.5, 25), near: x(7, 8, 25),      // (23 Nov 2026, his words: "you're literally taking them just around the corner... let the people drive for... 3 to 5 minutes at least") a fare is a drive across town, in blocks
    types: ['plain'].concat(N >= 3 ? ['rush'] : [], N >= 5 ? ['calm'] : [], N >= 8 ? ['sight'] : []),
    vRef: x(7.0, 9.4, 22) * (1 - 0.15 * easyOf(N)) * (help ? 0.85 : 1), slack: Math.round(x(14, 4, 18) + 5 * easyOf(N)) + (help ? 8 : 0), wait: Math.round(x(40, 25, 20) + 10 * easyOf(N)) + (help ? 15 : 0), boss, help: !!help,
    vmax: 15 * (1 + 0.04 * upLv('engine')), acc: 4.0 * (1 + 0.08 * upLv('engine')), brake: 8 * (1 + 0.08 * upLv('brakes')), smart: upLv('gps') > 0, forgive: upLv('seats'), crashes: 3 }; }
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, wait: 0, next: null, mini: !!o.mini };
  setup(G); if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else G.ev.push({ k: 'start' });
  return G; }
// ---------- the city: a grid of nodes; an edge is a road from a node, one way (you drive on the right) ----------
const inB = (i, j) => i >= 0 && j >= 0 && i < NX && j < NY;
const ekey = (i, j, h) => i + ',' + j + ',' + h;
const ahead = (i, j, h) => [i + DIRS[h][0], j + DIRS[h][1]];
const twoWay = (i, j, h) => { const [a, b] = ahead(i, j, h); return ekey(Math.min(i, a), Math.min(j, b), h % 2); };      // a road, either way
function edgeOk(G, i, j, h) { const [a, b] = ahead(i, j, h); return inB(i, j) && inB(a, b) && !G.works.has(twoWay(i, j, h)); }
const turnTo = (h, q) => q === 'L' ? (h + 3) % 4 : q === 'R' ? (h + 1) % 4 : h;
const turnOf = (h, h2) => h2 === h ? 'S' : h2 === (h + 1) % 4 ? 'R' : h2 === (h + 3) % 4 ? 'L' : 'U';
function setup(G, o = {}) { const c = G.cfg, R = G.rnd; G.t = 0; G.yard = o.yard || null;
  G.works = new Set(); G.jams = new Set(); G.cars = []; G.spawned = new Set(); G.spawnKey = null; G.carN = 0;
  // road works and jams: never on the edge of town, never next to where you start
  const roads = []; for (let i = 0; i < NX; i++) for (let j = 0; j < NY; j++) for (const h of [0, 1]) { const [a, b] = ahead(i, j, h); if (inB(a, b)) roads.push(ekey(i, j, h)); }
  const start = o.start || { i: 1 + ((R() * (NX - 2)) | 0), j: 1 + ((R() * 2) | 0), h: 0 };
  const near = k2 => { const [i, j] = k2.split(',').map(Number); return Math.abs(i - start.i) + Math.abs(j - start.j) <= 1; };
  for (let n = 0; n < (o.works != null ? o.works : c.works); n++) { const k2 = roads[(R() * roads.length) | 0]; if (!near(k2)) G.works.add(k2); }
  for (let n = 0; n < (o.jams != null ? o.jams : c.jams); n++) { const k2 = roads[(R() * roads.length) | 0]; if (!near(k2) && !G.works.has(k2)) G.jams.add(k2); }
  G.light = []; for (let i = 0; i < NX; i++) { G.light.push([]); for (let j = 0; j < NY; j++) G.light[i].push({ off: R() * 20, on: (o.lights != null ? o.lights : c.lights) && R() < 0.5 }); }
  G.sight = { i: 2 + ((R() * (NX - 4)) | 0), j: 3 + ((R() * (NY - 5)) | 0) };
  { const d = DIRS[start.h], s0 = o.s0 || 4; G.in = { sx: 0, gas: false, brake: false };
    G.taxi = { x: start.i * BL + d[0] * s0 + d[1] * LANES[1], y: start.j * BL + d[1] * s0 - d[0] * LANES[1], th: start.h * Math.PI / 2, w: 0, imm: 0, box: null, entry: null, skT: 0, stopT: 0,
      i: start.i, j: start.j, h: start.h, s: s0, lane: 1, lx: LANES[1], v: o.v0 != null ? o.v0 : 6, brH: false, turn: null, crashes: 0, skids: 0, reds: 0, dist: 0, kick: 0 }; locate(G); const bi = Math.round(G.taxi.x / BL), bj = Math.round(G.taxi.y / BL); if (Math.abs(G.taxi.x - bi * BL) <= HW && Math.abs(G.taxi.y - bj * BL) <= HW) G.taxi.box = { i: bi, j: bj }; }      // it starts in a junction: leaving it is not a turn
  G.fare = null; G.goal = null; G.done = 0; G.coins = 0; G.tips = 0; G.late = 0; G.passed = 0; G.turnsOk = 0; G.turnsBad = 0; G.log = [];
  if (!o.noFare) newHail(G, o.hail); }
// a light at a node: the north-south road has green, then amber, then east-west (and back)
function lightAt(G, i, j, axis, t) { const L = G.light[i] && G.light[i][j]; if (!L || !L.on) return 'g'; const C = 14, p = ((t + L.off) % C + C) % C, ns = p < 5.5 ? 'g' : p < 7 ? 'a' : 'r', ew = p >= 7 && p < 12.5 ? 'g' : p >= 12.5 ? 'a' : 'r'; return axis === 0 ? ns : ew; }
// ---------- the GPS: the shortest way from the junction ahead (no U-turns) to the start of the road the goal is on ----------
function gps(G, goal, from, looks) { const t = from || G.taxi; if (!goal) return null; const e = goal.e;
  if (t.i === e.i && t.j === e.j && t.h === e.h && t.s < goal.s - 2) return { turn: 'S', dist: goal.s - t.s, path: [], on: true };
  const [ni, nj] = ahead(t.i, t.j, t.h), smart = G.cfg.smart || looks, cost = (i, j, h) => BL * (smart && G.jams.has(twoWay(i, j, h)) ? 3.5 : 1) + (lightAt(G, i, j, 0, 0) && G.light[i][j].on ? 3 : 0);
  const D = new Map(), P = new Map(), Q = [[BL - t.s, ni, nj, t.h]]; D.set(ekey(ni, nj, t.h), BL - t.s);
  while (Q.length) { Q.sort((a, b) => a[0] - b[0]); const [d, i, j, hin] = Q.shift(), key = ekey(i, j, hin); if (d > D.get(key)) continue;
    if (i === e.i && j === e.j && hin !== (e.h + 2) % 4 && edgeOk(G, i, j, e.h)) { // reached the goal's road: walk back for the first turn
      let k2 = key, first = null; const path = [[i, j]]; while (P.has(k2)) { const pr = P.get(k2); first = { from: pr, to: k2 }; path.unshift(pr.split(',').slice(0, 2).map(Number)); k2 = pr; }
      const h2 = first ? +first.to.split(',')[2] : e.h; return { turn: turnOf(t.h, first ? +first.to.split(',')[2] : e.h), dist: d + goal.s, path, h2 }; }
    for (const h of [hin, (hin + 1) % 4, (hin + 3) % 4]) { if (!edgeOk(G, i, j, h)) continue; const [a, b] = ahead(i, j, h), nd = d + cost(i, j, h), k2 = ekey(a, b, h); if (!D.has(k2) || nd < D.get(k2)) { D.set(k2, nd); P.set(k2, key); Q.push([nd, a, b, h]); } } }
  return { turn: 'S', dist: 9999, path: [] }; }
// a place on a road for someone to wait: between near and far blocks of driving from "from" (by the GPS), on the kerb side
function placeFrom(G, from, near, far, avoid) { const R = G.rnd; let best = null;
  for (let n = 0; n < 160; n++) { const i = (R() * NX) | 0, j = (R() * NY) | 0, h = (R() * 4) | 0;
    if (!edgeOk(G, i, j, h) || G.jams.has(twoWay(i, j, h))) continue; if (avoid && avoid.i === i && avoid.j === j && avoid.h === h) continue;
    const p = { e: { i, j, h }, s: 20 + R() * (BL - 34) }, d = gps(G, p, from).dist / BL; if (d >= near && d <= far + 0.8) return p;
    if (d < 99 && (!best || Math.abs(d - near) < best.d)) best = { p, d: Math.abs(d - near) }; }
  return best ? best.p : { e: { i: 1, j: 1, h: 0 }, s: 26 }; }
function newHail(G, at) { const t = G.taxi, c = G.cfg;
  const p = at ? { e: Object.assign({}, at.e), s: at.s } : placeFrom(G, t, c.hailNear, c.hailFar);
  const type = G.yard ? 'plain' : c.types[(G.rnd() * c.types.length) | 0];
  G.goal = Object.assign(p, { kind: 'pick', type, patience: 0 }); const g = gps(G, G.goal); G.goal.patience = g.dist / Math.max(6, c.vRef) + c.wait; G.goal.left = G.goal.patience; G.ev.push({ k: 'hail', type }); }
function pickedUp(G) { const c = G.cfg, g = G.goal, T = TYPES[g.type], t = G.taxi;
  const d = G.yard && G.yardDrop ? G.yardDrop : placeFrom(G, { i: g.e.i, j: g.e.j, h: g.e.h, s: g.s }, c.near, c.far, g.e);
  G.fare = { type: g.type, t0: G.t, bumps: 0, sight: false, tipOk: true };
  G.goal = Object.assign(d, { kind: 'drop', type: g.type }); const r = gps(G, G.goal); G.fare.blocks = Math.max(1, Math.round(r.dist / BL));
  G.fare.allow = Math.round((r.dist / c.vRef + 6 + c.slack + G.fare.blocks) * T.time); G.fare.left = G.fare.allow; G.fare.pay = 4 + G.fare.blocks;      // the meter allows a second a block for lights and corners
  G.ev.push({ k: 'in', type: g.type, allow: G.fare.allow }); }
function dropped(G) { const F = G.fare, T = TYPES[F.type], c = G.cfg; let pay = F.pay, tip = 0;
  if (F.left >= 0) { if (F.tipOk) tip = Math.round((2 + F.left / 6) * T.tip) + c.forgive; } else { pay = Math.ceil(pay / 2); G.late++; }
  if (F.type === 'sight' && F.sight) tip += 6; G.coins += pay + tip; if (tip > 0) G.tips++; G.done++;
  G.log.push({ type: F.type, left: Math.round(F.left), pay, tip, bumps: F.bumps }); G.ev.push({ k: 'out', pay, tip, late: F.left < 0, type: F.type });
  // they get out: the door, a step to the kerb, a wave (the taxi waits; the view plays it from G.anim)
  G.anim = { kind: 'out', T: 1.9, type: F.type, e: Object.assign({}, G.goal.e), s: G.goal.s }; G.fare = null; G.goal = null; G.taxi.v = 0;
  G.wait = G.anim.T; G.next = () => { G.anim = null; if (G.lesson) { lessonSee(G, 'drop'); return; } if (G.done >= c.fares) { finish(G, true); return; } newHail(G); }; }
// ---------- your thumbs ----------
function drive(G, sx, gas, brake) { if (!G.in) return; const I = G.in; I.sx = clamp(sx, -1, 1); I.gas = !!gas; I.brake = !!brake; }      // the stick (left -1 .. right +1) and the two pedals
// is this place on a street? Streets run along the grid lines, HW either side; not beyond the edge of town, not through road works
function onRoadT(G, x, y, m = 0) { const i = Math.round(x / BL), j = Math.round(y / BL), dx = Math.abs(x - i * BL), dy = Math.abs(y - j * BL), w = HW - m;
  if (dx <= w && dy <= w) return inB(i, j);
  if (dx <= w && i >= 0 && i < NX) { const j0 = Math.floor(y / BL); if (j0 >= 0 && j0 + 1 < NY && !G.works.has(ekey(i, j0, 0))) return true; }
  if (dy <= w && j >= 0 && j < NY) { const i0 = Math.floor(x / BL); if (i0 >= 0 && i0 + 1 < NX && !G.works.has(ekey(i0, j, 1))) return true; }
  return false; }
// which road the taxi is on, from where it is and the way it points: i, j, h (the road from junction i, j heading h), s, lx, lane
function locate(G) { const t = G.taxi, i0 = Math.round(t.x / BL), j0 = Math.round(t.y / BL), onNS = Math.abs(t.x - i0 * BL) <= HW, onEW = Math.abs(t.y - j0 * BL) <= HW; let hd = ((Math.round(t.th / (Math.PI / 2)) % 4) + 4) % 4;
  if (hd % 2 === 0 && !onNS && onEW) hd = Math.sin(t.th) >= 0 ? 1 : 3; else if (hd % 2 === 1 && !onEW && onNS) hd = Math.cos(t.th) >= 0 ? 0 : 2;
  const d = DIRS[hd];
  if (hd % 2 === 0) { const u = t.y * d[1], n = Math.floor(u / BL); t.i = i0; t.j = n * d[1]; t.s = u - n * BL; t.lx = (t.x - i0 * BL) * d[1]; }
  else { const u = t.x * d[0], n = Math.floor(u / BL); t.j = j0; t.i = n * d[0]; t.s = u - n * BL; t.lx = -(t.y - j0 * BL) * d[0]; }
  t.h = hd; t.lane = t.lx > 3.7 ? 1 : 0; t.brH = !!(G.in && G.in.brake); return t; }
const carXY = car => { const d = DIRS[car.h]; return [car.i * BL + d[0] * car.s + d[1] * car.lx, car.j * BL + d[1] * car.s - d[0] * car.lx]; };
const inZone = G => false;      // (the first version's turn zone: there is none now; the view still asks)
function brake(G, on) { if (G.over || !G.taxi || !G.in) return; G.in.brake = !!on; if (on) G.in.gas = false; }
// ---------- the clock ----------
function bump(G, what) { const F = G.fare; if (!F) return; F.tipOk = F.tipOk && F.type !== 'calm'; if (F.type !== 'calm') return; F.bumps++; G.ev.push({ k: 'scared', what, n: F.bumps });
  if (F.bumps > 2 + G.cfg.forgive) { G.ev.push({ k: 'letout' }); if (G.lesson) return; finish(G, false, { why: 'scared' }); } }
function step(G, dt) { if (G.over || !(dt > 0)) return;
  if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0) { G.wait = 0; if (G.next) { const f = G.next; G.next = null; f(); } } return; }
  G.t += dt; const t = G.taxi, c = G.cfg;
  // your car: gas, brake (then, held at a standstill, reverse), a stick that turns it less the faster it goes
  const I = G.in, v0 = t.v; t.imm = Math.max(0, t.imm - dt);
  if (I.brake) { if (t.v > 0.3) { t.v = Math.max(0, t.v - c.brake * dt); t.stopT = 0; } else { t.stopT += dt; if (t.stopT > 0.45) t.v = Math.max(-5, t.v - 4 * dt); else t.v = Math.min(0, t.v); } }
  else { t.stopT = 0; if (I.gas) t.v = t.v < 0 ? Math.min(0, t.v + 12 * dt) + (t.v > -0.2 ? 0.3 : 0) : Math.min(c.vmax, t.v + (c.acc * (1 - t.v / c.vmax) + 0.4) * dt); else t.v -= Math.sign(t.v) * Math.min(Math.abs(t.v), 1.6 * dt); }
  if (I.brake) { t.brT = (t.brT || 0) + dt; if (t.brT === dt) t.brV = v0; if (t.brT > 0.5 && t.brV > 10 && G.fare && G.fare.type === 'calm' && !t.hardT) { t.hardT = 1; bump(G, 'brake'); } } else { t.brT = 0; t.hardT = 0; }
  const sp = Math.abs(t.v), grip = Math.min(1, sp / 5) / (1 + Math.max(0, sp - 11) * 0.06); t.w = I.sx * 2.2 * grip * (t.v < 0 ? -1 : 1); t.th = wrapPi(t.th + t.w * dt);
  let nx = t.x + Math.sin(t.th) * t.v * dt, ny = t.y + Math.cos(t.th) * t.v * dt;
  if (!onRoadT(G, nx, ny, 1.0)) {      // a kerb, a wall, road works: slide along it, lose speed by how squarely you met it
    const okx = onRoadT(G, nx, t.y, 1.0), oky = onRoadT(G, t.x, ny, 1.0), into = okx ? Math.abs(Math.cos(t.th)) : oky ? Math.abs(Math.sin(t.th)) : 1;
    if (okx) ny = t.y; else if (oky) nx = t.x; else { nx = t.x; ny = t.y; }
    if (t.imm <= 0 && sp * into > 9) { crash(G, null); if (G.over) return; } else if (t.imm <= 0 && sp > 3) { G.ev.push({ k: 'kerb' }); t.imm = 0.35; }
    t.v -= t.v * Math.min(1, into * 5 * dt); const along = okx ? (Math.sin(t.th) >= 0 ? Math.PI / 2 : -Math.PI / 2) : (Math.cos(t.th) >= 0 ? 0 : Math.PI); t.th = wrapPi(t.th + wrapPi(along - t.th) * Math.min(1, dt * 2.5 * into)); }
  t.dist += Math.hypot(nx - t.x, ny - t.y); t.x = nx; t.y = ny;
  // a corner taken too fast screeches: a nervous passenger hates it
  if (sp > VTURN && Math.abs(t.w) > 0.9) { t.skT += dt; if (t.skT > 0.35) { t.skT = -1.2; t.skids++; t.v *= 0.75; G.ev.push({ k: 'skid' }); bump(G, 'skid'); if (G.over) return; } } else t.skT = t.skT < 0 ? Math.min(0, t.skT + dt) : Math.max(0, t.skT - dt * 2);
  // which junction it is in, if any: coming in on red is a ticket; going out, the turn it made is counted against the GPS
  const bi = Math.round(t.x / BL), bj = Math.round(t.y / BL), inBox = Math.abs(t.x - bi * BL) <= HW && Math.abs(t.y - bj * BL) <= HW && inB(bi, bj);
  if (inBox && !t.box) { const hIn = t.h, want = G.goal ? gps(G, G.goal).turn : null; t.box = { i: bi, j: bj }; t.entry = { h: hIn, want, from: [t.i, t.j, t.h] };
    if (t.v > 1.5 && lightAt(G, bi, bj, hIn % 2, G.t) === 'r') { t.reds++; G.coins -= 5; G.ev.push({ k: 'red' }); bump(G, 'red'); if (G.over) return; if (G.lesson) { lessonMiss(G, 'red'); return; } } }
  locate(G);
  if (!inBox && t.box) { const E = t.entry, nb = t.box; t.box = null; t.entry = null; const q = E ? turnOf(E.h, t.h) : 'U';
    if (q !== 'U') { if (E.want) { if (q === E.want) G.turnsOk++; else G.turnsBad++; } G.ev.push({ k: 'turn', q, right: E.want ? q === E.want : true, from: E.from });
      if (G.fare && G.fare.type === 'sight' && nb.i === G.sight.i && nb.j === G.sight.j && !G.fare.sight) { G.fare.sight = true; G.ev.push({ k: 'sight' }); }
      if (G.lesson) { lessonSee(G, 'turn', q === E.want); if (G.over || G.wait > 0) return; } } }
  // the cars: on your road and the roads ahead (so you can see them), and the ones coming the other way
  spawnAround(G); for (const car of G.cars) moveCar(G, car, dt); G.cars = G.cars.filter(q => !q.gone);
  // crashes: you drove into a car (one that runs into the back of you while you are stopped is its own fault)
  for (const car of G.cars) { const [cx, cy] = carXY(car), d = DIRS[car.h], dx = t.x - cx, dy = t.y - cy, al = dx * d[0] + dy * d[1], lt = dx * d[1] - dy * d[0];
    if (Math.abs(al) < CARLEN * 0.88 && Math.abs(lt) < 1.9 && t.imm <= 0 && sp > 1 && (-dx * Math.sin(t.th) - dy * Math.cos(t.th)) * Math.sign(t.v) > 0) { crash(G, car); if (G.over) return; break; }
    if (car.i === t.i && car.j === t.j && car.h === t.h) { const ds = car.s - t.s; if (ds < -1 && ds > -3 && Math.abs(car.lx - t.lx) >= 2.0 && !car.passed && t.v > car.v) { car.passed = true; G.passed++; G.ev.push({ k: 'pass' }); if (G.lesson) lessonSee(G, 'pass'); } } }
  // the goal: stop in the ring, in the kerb lane
  const g = G.goal; if (g) { const on = g.e.i === t.i && g.e.j === t.j && g.e.h === t.h, d = g.s - t.s;
    if (on && Math.abs(d) < 6 && t.lx > 3.4 && Math.abs(t.v) < 1.2) { if (g.kind === 'pick') { G.ev.push({ k: 'pick' }); t.v = 0; G.anim = { kind: 'in', T: 1.8, type: g.type, e: Object.assign({}, g.e), s: g.s }; G.wait = G.anim.T; G.next = () => { G.anim = null; pickedUp(G); if (G.lesson) lessonSee(G, 'pick'); }; return; } else { dropped(G); return; } }      // they walk to the door and get in (the taxi waits)
    else if (on && d < -6 && !g.passT) { g.passT = 1; G.ev.push({ k: 'missed', kind: g.kind }); if (G.lesson) { lessonMiss(G, 'missed'); return; } }
    if (!on) g.passT = 0; }
  // the meter and the wait
  if (G.fare) { G.fare.left -= dt; if (G.fare.left < -15) { G.ev.push({ k: 'walk' }); if (G.lesson) { lessonMiss(G, 'walk'); return; } finish(G, false, { why: 'walked' }); return; } }
  else if (G.goal && G.goal.kind === 'pick' && !G.lesson) { G.goal.left -= dt; if (G.goal.left < 0) { G.ev.push({ k: 'gone' }); finish(G, false, { why: 'gone' }); return; } } }
// cars: a few on every road you drive (more each level), packed and slow on a jam; they keep their lane, slow for the car in
// front and for red lights, and turn off at the junction
function spawnOn(G, i, j, h, from, upTo) { const k2 = ekey(i, j, h); if (G.spawned.has(k2) || !edgeOk(G, i, j, h)) return; G.spawned.add(k2); const R = G.rnd, jam = G.jams.has(twoWay(i, j, h)), c = G.cfg;
  const n = G.yard === 'lane' ? 2 : G.yard ? 0 : jam ? 7 : Math.floor(c.cars + R()); const used = [];
  for (let q = 0; q < n; q++) { const yl = G.yard === 'lane', lane = jam || yl ? (q + (yl ? 1 : 0)) % 2 : (R() < 0.5 ? 0 : 1), s = jam ? 10 + q * 7.5 : yl ? (from || 0) + 12 + q * 20 : (from || 0) + 14 + R() * (BL - 14 - (from || 0)); if (used.some(u => u.lane === lane && Math.abs(u.s - s) < CARLEN + 3) || (upTo != null && s > upTo)) continue; used.push({ lane, s });
    G.cars.push({ id: ++G.carN, i, j, h, s, lane, lx: LANES[lane], v: 0, vt: jam ? 1.5 + R() * 1.5 : G.yard === 'lane' ? 3 + R() * 1.5 : 4.5 + R() * 4, kind: (R() * 6) | 0, jam }); } }
function spawnAround(G) { const t = G.taxi, sk = t.i + ',' + t.j + ',' + t.h + (BL - t.s < 45 ? '+' : ''); if (G.spawnKey === sk) return; G.spawnKey = sk; spawnOn(G, t.i, t.j, t.h, t.s + 8);
  { const [oi, oj] = ahead(t.i, t.j, t.h); if (inB(oi, oj) && !G.yard) spawnOn(G, oi, oj, (t.h + 2) % 4, 0, BL - t.s - 16); }      // the other side of your road: the cars coming at you are real now
  if (BL - t.s < 45) { const [ni, nj] = ahead(t.i, t.j, t.h); for (const q of ['S', 'L', 'R']) spawnOn(G, ni, nj, turnTo(t.h, q)); }
  const keep = new Set([ekey(t.i, t.j, t.h)]), [ni, nj] = ahead(t.i, t.j, t.h); for (let h = 0; h < 4; h++) keep.add(ekey(ni, nj, h));
  for (const k2 of [...G.spawned]) if (!keep.has(k2)) G.spawned.delete(k2); for (const car of G.cars) if (!keep.has(ekey(car.i, car.j, car.h))) car.gone = true; }
function moveCar(G, car, dt) { const t = G.taxi; let want = car.vt;
  if (car.i === t.i && car.j === t.j && car.h === t.h && Math.abs(t.lx - car.lx) < 2.5 && t.s > car.s && t.s - car.s < 14) want = Math.min(want, Math.max(0, (t.s - car.s - CARLEN - 1.5) * 0.8), Math.max(0, t.v));      // it slows for you, as for any car in front
  for (const o of G.cars) if (o !== car && o.i === car.i && o.j === car.j && o.h === car.h && o.lane === car.lane && o.s > car.s && o.s - car.s < 12) want = Math.min(want, Math.max(0, (o.s - car.s - CARLEN - 1.5) * 0.8), o.v);
  const [ni, nj] = ahead(car.i, car.j, car.h), d = BL - 4 - car.s; if (d > -1 && d < 24 && lightAt(G, ni, nj, car.h % 2, G.t) !== 'g') want = Math.min(want, Math.sqrt(2 * 3 * Math.max(0, d)));
  car.v += clamp(want - car.v, -5 * dt, 2.5 * dt); car.s += car.v * dt; if (car.s > BL + 2) car.gone = true; }
function crash(G, car) { const t = G.taxi; t.crashes++; t.v = t.v > 0 ? -2.5 : 1.5; t.imm = 1.3; if (car) car.v = Math.max(car.v, 3); G.coins -= 5; if (G.fare) G.fare.tipOk = false; G.ev.push({ k: 'crash', n: t.crashes, wall: !car }); bump(G, 'crash'); if (G.over) return;
  if (G.lesson) { lessonMiss(G, 'crash'); return; } if (t.crashes >= G.cfg.crashes) finish(G, false, { why: 'crashes' }); }
function finish(G, win, o = {}) { if (G.over) return true; G.over = win ? 'won' : 'lost'; const t = G.taxi;
  const onTime = G.log.filter(q => q.left >= 0).length, stars = win ? 1 + (onTime === G.log.length && G.tips >= G.log.length ? 1 : 0) + (t.crashes === 0 && t.reds === 0 && t.skids === 0 ? 1 : 0) : 0;
  G.res = { win, stars, why: o.why || null, fares: G.cfg.fares, done: G.done, tips: G.tips, late: G.late, onTime, crashes: t.crashes, reds: t.reds, skids: t.skids, km: +(t.dist / 1000).toFixed(1), log: G.log,
    coins: Math.max(1, G.coins + (win ? Math.ceil(G.N / 2) + stars * 3 : 0)) };
  G.ev.push({ k: win ? 'won' : 'lost' }); return true; }
// ---------- the robot: a driver who reads the GPS and the road ----------
// He keeps to the right of the yellow line, pulls out round a slower car when the other lane is clear, takes the kerb lane for
// the ring, slows for a corner and turns the way the GPS says (now and then the wrong way), stops for a red light and at the ring.
// Slow hands, not blind ones: the stick follows what he wants with a lag, the pedals change a reaction late.
// THE TUTORIAL SHOWS THE ONE MOVE TO MAKE NOW (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing happens"). It said STEER,
// GAS, STOP IN GREEN (three things) with a hand holding in a box. Now the robot is asked (dryPlanAll drive): HOLD GAS, HOLD BRAKE (to stop in
// the ring, before a corner), STEER LEFT / STEER RIGHT on the stick (the GPS way, round a slow car), LET GO OF GAS to roll.
const TXC = { t: -1e9, v: null };
function taxiCue(G) { if (G.over || G.wait > 0 || !G.in) return ['WAIT…', 'wait', false]; const now = performance.now(); if (now - TXC.t < 150) return TXC.v; TXC.t = now; const all = dryPlanAll(G, null, { t: -1, next: -1 }), dv = all.filter(q => q[0] === 'drive').pop(), mid = b => [b.x + b.w / 2, b.y + b.h / 2]; let v = ['WAIT…', 'wait', false];
  if (dv) { const Pd = pedals(), x0 = 78 * k, y0 = H - 96 * k, R1 = 46 * k;
    if (dv[3]) v = ['HOLD BRAKE', 'hold', mid(Pd.brake)];
    else if (dv[2] && !G.in.gas) v = ['HOLD GAS', 'hold', mid(Pd.gas)];
    else if (Math.abs(dv[1]) > 0.25) v = [dv[1] < 0 ? 'STEER LEFT' : 'STEER RIGHT', 'drag', [x0, y0, x0 + dv[1] * R1, y0]];
    else v = dv[2] ? ['HOLD GAS', 'hold', mid(Pd.gas)] : G.in.gas ? ['LET GO OF GAS', 'release', mid(Pd.gas)] : ['ROLL…', 'wait', false]; }
  TXC.v = v; return v; }
function honest(G, o, mem) { if (G.over || G.wait > 0 || !G.taxi) return; const t = G.taxi, c = G.cfg, acc = o.acc == null ? 0.85 : o.acc, react = o.react == null ? 0.3 : o.react, T = G.t;
  const g = G.goal, d2n = BL - t.s, F = G.fare, sp = Math.abs(t.v), inJ = !!t.box;
  // decisions a few times a second: the turn at the junction ahead, the lane, the speed to hold
  mem.cd = (mem.cd || 0) - 1 / 60; if (mem.cd <= 0) { mem.cd = react * 0.3 * (0.5 + Math.random()); const r = g ? gps(G, g, null, Math.random() < acc) : null;      // he looks at the map: the red streets are jams, and he goes round them when he notices
    const zkey = t.i + ',' + t.j + ',' + t.h + ':' + (G.deals | 0) + ':' + G.done + ':' + (g ? g.kind : '');
    if (!inJ && mem.zone !== zkey && r) { mem.zone = zkey; let q = r.turn === 'U' ? 'R' : r.turn; if (Math.random() < 0.02 + (1 - acc) * 0.2) q = ['L', 'R', 'S'].filter(x => x !== q)[(Math.random() * 2) | 0];      // a slip: the wrong way
      if (F && F.type === 'sight' && !F.sight && Math.random() < acc) { const [ni, nj] = ahead(t.i, t.j, t.h), dI = Math.sign(G.sight.i - ni), dJ = Math.sign(G.sight.j - nj); const toward = [0, 1, 2, 3].find(h => DIRS[h][0] === dI && DIRS[h][1] === dJ); if (toward != null && Math.abs(G.sight.i - ni) + Math.abs(G.sight.j - nj) <= 3 && F.left > 25) { const q2 = turnOf(t.h, toward); if (q2 !== 'U') q = q2; } }
      const [ni, nj] = ahead(t.i, t.j, t.h); if (!edgeOk(G, ni, nj, turnTo(t.h, q))) q = ['S', 'R', 'L'].find(x => edgeOk(G, ni, nj, turnTo(t.h, x))) || 'S'; mem.q = q; mem.qe = [t.i, t.j, t.h]; }
    const onGoal = g && g.e.i === t.i && g.e.j === t.j && g.e.h === t.h && g.s > t.s - 4, carAhead = L => G.cars.find(q => q.i === t.i && q.j === t.j && q.h === t.h && q.lane === L && q.s > t.s - CARLEN - 0.5 && q.s - t.s < 8 + sp * 1.6);
    let lane = mem.lane == null ? 1 : mem.lane; if (onGoal && g.s - t.s < 45) { if (!carAhead(1) || g.s - t.s < 16) lane = 1; } else if (carAhead(lane) && !carAhead(1 - lane)) lane = 1 - lane; else if (!carAhead(1) && lane === 0 && Math.random() < 0.1) lane = 1;
    if ((mem.q || 'S') !== 'S' && !onGoal && d2n < 30 && !carAhead(0)) lane = 0;      // a turn coming: the inside lane, so the corner is a wide one
    mem.lane = lane;
    const dec = c.brake * (0.5 + 0.2 * acc); let vt = c.vmax; const q = mem.q || 'S';
    if (onGoal && !(sp < 0.4 && t.lx < 3.5 && Math.abs(g.s - t.s) < 6)) vt = Math.min(vt, Math.sqrt(2 * dec * Math.max(0, g.s - t.s - 0.5 + (1 - acc) * (Math.random() - 0.5) * 3))); else if (onGoal) vt = 4;      // stopped beside the ring, not in it: drive on and come round again
    if (q !== 'S') vt = Math.min(vt, Math.sqrt(36 + 2 * dec * Math.max(0, d2n - HW - 3))); if (inJ && q !== 'S') vt = Math.min(vt, 6.5);
    const [ni, nj] = ahead(t.i, t.j, t.h), dl = d2n - HW, col = lightAt(G, ni, nj, t.h % 2, G.t), colSoon = lightAt(G, ni, nj, t.h % 2, G.t + dl / Math.max(3, sp));
    if (!inJ && dl > 0.5 && (col === 'r' || (col === 'a' && dl > sp * 1.2) || (colSoon !== 'g' && dl > sp * sp / (2 * dec) + 2)) && (F && F.type === 'calm' || Math.random() < 0.92 + 0.08 * acc || mem.redSeen === zkey)) { mem.redSeen = zkey; vt = Math.min(vt, Math.sqrt(2 * dec * Math.max(0, dl - 3))); }
    const blk = carAhead(t.lane); if (blk && Math.abs(blk.lx - t.lx) < 2.4) vt = Math.min(vt, Math.max(0, (blk.s - t.s - CARLEN - 2)) * 0.9, blk.v + 0.5);
    if (F && F.type === 'calm') vt = Math.min(vt, 8.5); mem.vt = vt; }
  // where to point: along the lane; near the junction, at the lane of the road the turn leads to
  const lane = mem.lane == null ? 1 : mem.lane, q = mem.q || 'S', look = 7 + sp * 0.8, d = DIRS[t.h], bx = t.i * BL, by = t.j * BL; let tx, ty;
  const turning = q !== 'S' && mem.qe && mem.qe[0] === t.i && mem.qe[1] === t.j && mem.qe[2] === t.h;
  if (turning && t.s > BL - HW - (q === 'L' ? -1 : 2.5)) { const h2 = turnTo(t.h, q), d2 = DIRS[h2], nx = bx + d[0] * BL, ny = by + d[1] * BL, s2 = HW + 4, [ti, tj] = ahead(t.i, t.j, t.h), kerb = g && g.e.i === ti && g.e.j === tj && g.e.h === h2 ? 1 : 0; tx = nx + d2[0] * s2 + d2[1] * LANES[kerb]; ty = ny + d2[1] * s2 - d2[0] * LANES[kerb]; if (kerb) mem.lane = 1; }      // the ring is on the road he is turning into: straight to the kerb
  else if (turning && t.s + look > BL - HW) { const s2 = BL - HW + 2; tx = bx + d[0] * s2 + d[1] * LANES[lane]; ty = by + d[1] * s2 - d[0] * LANES[lane]; }
  else { const s2 = t.s + look; tx = bx + d[0] * s2 + d[1] * LANES[lane]; ty = by + d[1] * s2 - d[0] * LANES[lane]; }
  let err = wrapPi(Math.atan2(tx - t.x, ty - t.y) - t.th);
  if (T > (mem.offT || 0)) { mem.offT = T + 0.7; mem.off = Math.random() > acc ? (Math.random() - 0.5) * 0.5 : 0; } err += mem.off || 0;
  if (sp < 0.8 && (mem.vt || 0) > 2 && !onRoadT(G, t.x + Math.sin(t.th) * 3.5, t.y + Math.cos(t.th) * 3.5, 1.0)) mem.back = T + 1.1;      // nose against a kerb: back out
  if (mem.back && T < mem.back) { ACT.drive(G, -clamp(err * 2, -1, 1), false, true); return; }
  mem.sx = (mem.sx || 0) + (clamp(err * 2.6, -1, 1) - (mem.sx || 0)) * Math.min(1, (1 / 60) / (0.08 + react * 0.5));
  const vt = mem.vt == null ? c.vmax : mem.vt, slow = t.v > vt + 0.4, stop = vt < 0.4 && t.v < 0.5;
  ACT.drive(G, mem.sx, !slow && !stop && t.v < vt - 0.2, slow && t.v > 0.2); }
// blind moves (no looking): the stick left, right, centred; GAS (brake off), BRAKE (gas off)
const BLIND = { L: G => { G.in.sx = -1; }, R: G => { G.in.sx = 1; }, N: G => { G.in.sx = 0; }, G: G => { G.in.gas = true; G.in.brake = false; }, B: G => { G.in.brake = true; G.in.gas = false; } };
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.wait = 0; G.log = [{ type: 'plain', left: 10, pay: 8, tip: 3, bumps: 0 }]; G.tips = 1; G.done = G.cfg.fares; finish(G, true); }
// ---------- LESSONS ----------
const AIMCARD = {"pic": "🚕", "win": "DRIVE EACH FARE THERE FAST", "lose": "SCARE THEM OR TAKE TOO LONG", "how": "GAS, BRAKE, FOLLOW THE ARROW"};      // the aim card: specs/aims.json (tools/aims.py)
const LESSONS = {
  1: [{ id: 'pick', title: 'GAS, BRAKE, STOP IN THE RING', say: G => taxiCue(G)[0], do: G => taxiCue(G)[1], at: G => taxiCue(G)[2], how: 'Left thumb: the stick steers. Right thumb: hold GAS to go, BRAKE to stop. Stop in the green ring beside the person waving; then stop in the ring at their door.', need: 2 }],
  2: [{ id: 'turn', title: 'FOLLOW THE GPS ARROW', say: G => taxiCue(G)[0], do: G => taxiCue(G)[1], at: G => taxiCue(G)[2], how: 'BRAKE before the corner, then steer the way the GPS arrow points (left or right). Take 2 turns.', need: 2 }],
  3: [{ id: 'lane', title: 'PASS SLOW CARS', say: G => taxiCue(G)[0], do: G => taxiCue(G)[1], at: G => taxiCue(G)[2], how: 'Steer out round a slow car and back in. Pass 3 without touching them.', need: 3 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonDeal(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonDeal(G) { const st = lessonNow(G); G.rnd = rng(G.seed + (G.deals = (G.deals | 0) + 1)); const n = G.lesson.n;
  if (st.id === 'pick') { G.yardDrop = { e: { i: 3, j: 2, h: 0 }, s: 40 }; setup(G, { yard: 'pick', start: { i: 3, j: 0, h: 0 }, works: 0, jams: 0, lights: false, hail: { e: { i: 3, j: 1, h: 0 }, s: 32 }, v0: 7 }); G.lesson.n = 0; }
  if (st.id === 'turn') { const right = G.rnd() < 0.5; setup(G, { yard: 'turn', start: { i: 3, j: 0, h: 0 }, works: 0, jams: 0, lights: false, noFare: true, s0: 10, v0: 6 }); G.goal = { kind: 'drop', e: { i: right ? 4 : 2, j: 1, h: right ? 1 : 3 }, s: 30, type: 'plain', lesson: true }; G.lesson.n = n; }
  if (st.id === 'lane') { setup(G, { yard: 'lane', start: { i: 3, j: 0, h: 0 }, works: 0, jams: 0, lights: false, noFare: true, s0: 2, v0: 7 }); G.goal = null; G.lesson.n = n; }
  G.ev.push({ k: 'yard' }); }
function lessonMiss(G, why) { const msg = { red: 'That light was RED! BRAKE and stop at the line.', crash: 'Bump! Steer round a slow car before you reach it, or BRAKE.', missed: 'You went past the ring! BRAKE sooner, by the kerb (on the right).', walk: 'Too slow!' }[why] || lessonNow(G).how;
  G.ev.push({ k: 'lessonmiss', how: msg }); G.wait = 1.6; G.next = () => lessonDeal(G); }
function lessonSee(G, what, ok) { const L = lessonNow(G); if (!L || G.wait > 0) return;
  if (L.id === 'pick' && (what === 'pick' || what === 'drop')) { G.lesson.n++; G.ev.push({ k: 'lessonok', n: G.lesson.n, need: L.need }); }
  if (L.id === 'turn' && what === 'turn') { if (ok) { G.lesson.n++; G.ev.push({ k: 'lessonok', n: G.lesson.n, need: L.need }); if (G.lesson.n < L.need) { G.wait = 0.6; G.next = () => lessonDeal(G); return; } } else { G.ev.push({ k: 'lessonmiss', how: 'Not that way! Steer the way the GPS arrow points.' }); G.wait = 1.6; G.next = () => lessonDeal(G); return; } }
  if (L.id === 'lane' && what === 'pass') { G.lesson.n++; G.ev.push({ k: 'lessonok', n: G.lesson.n, need: L.need }); }
  if (G.lesson.n < L.need) { if (L.id === 'lane' && G.taxi.s > BL - 10 && G.taxi.i === 3) { /* more road: the next block has more cars */ } return; }
  G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.wait = 1.4; G.next = () => { G.rnd = rng(G.seed); G.yardDrop = null; setup(G); G.ev.push({ k: 'start' }); G.ev.push({ k: 'yard' }); }; }

// what the robot would do now, without doing it (tools/dry_plan.py): the tutorial shows this move
const ACT_REAL = { drive }; let ACT = ACT_REAL;
function dryPlan(G, o, mem) { let got = null; const rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { if (!got && !(a.length > 2 && a.slice(1).every(v => v === 0 || v === false))) got = [n, ...a.slice(1)]; return true; };      /* (a stick at rest, all its numbers 0, is not a move; a first bed, number 0, is) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return got; }
function dryPlanAll(G, o, mem) { const all = [], rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { all.push([n, ...a.slice(1)]); return true; };      /* every call, in order (for a robot that steers and drifts at once) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return all; }
