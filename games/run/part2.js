// ===================== RULES: On the Run (game 24) =====================
// The other side of Police Chase. Each level is one job: the alarm goes and you are away.
//   DRIVE: (second version, 23 Nov 2026, his words on Police Chase applied here: specs/run-v2-2026-11-23.md) the getaway through a
//          CITY OF STREETS AND CORNERS. Left thumb: a stick that steers. Right thumb: GAS and BRAKE (held at a standstill, BRAKE
//          reverses), and a NITRO button. GREEN ARROWS on the road and a green marker show the way to the drop, corner by corner
//          (take a wrong turn and the marker still points you back). Traffic keeps to its lanes; police cars come up your trail,
//          and one pulls ALONGSIDE AND FLASHES before it rams: steer away from it. Roadblocks leave one gap (steer through it),
//          spike strips cover part of the street, and a helicopter's spotlight raises the heat. Grab cash bags and nitro cans.
//          Three hits and the car is done. Reach the drop and you ditch the car.
//   FOOT:  down the alleys to the safehouse with the cops behind you. Swipe left or right round crates, up over fences, down
//          under pipes; grab the cash. Stumble and they gain. They catch you and the job is lost.
//   THE SAFEHOUSE: the cash is counted and banked; a clean run pays a bonus. The bank buys upgrades in the GARAGE that carry
//          from job to job (a faster engine, armour, more nitro, quicker feet, a magnet, a police scanner). Nothing expires.
// HEAT (one to five stars) rises as the job goes on and when you are seen; more heat, more cops, the helicopter, and a bigger
// payout. World: metres; x across (right +), s along the street (ahead +).

const RULES = [
  '<b>Follow the GREEN ARROWS to the drop.</b> Left thumb: the stick steers. Right thumb: <b>GAS</b> and <b>BRAKE</b> (hold BRAKE when stopped to reverse). <b>Brake for corners.</b>',
  '<b>NITRO</b> (the blue button) leaves the cops behind. <b>A police car pulls alongside and flashes</b> before it rams: steer away from it.',
  '<b>Roadblocks</b> leave one gap: steer through it. Spikes take a hit. Grab the cash bags and nitro cans.',
  '<b>On foot:</b> swipe round crates, up over fences, down under pipes. <b>At a corner, swipe the way the arrow points.</b> Stumble and the cops gain.',
  'Reach the safehouse. The cash buys upgrades in the garage, and they stay with you.',
];
const WEATHERS = ['night', 'rain', 'dusk', 'storm', 'night', 'overcast', 'mist', 'night', 'golden'];
function weatherOf(N) { if (N <= 2) return ['dusk', 'night'][N - 1]; const R = rng(N * 6011 + 7); R(); return WEATHERS[(R() * WEATHERS.length) | 0]; }
const ALLEY = [-1.3, 0, 1.3], P = 84, RW = 8, LANE = 3.4, DIRS = [[0, 1], [1, 0], [0, -1], [-1, 0]], DIRH = [0, Math.PI / 2, Math.PI, -Math.PI / 2];      // streets every P metres, RW either side; N E S W
const LANES = [-5.2, -1.7, 1.7, 5.2];      // four places across a street, measured from its middle, to the right of the way the route runs (the two on the left meet oncoming traffic)
const wrapPi = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; }, nearLine = v => Math.round(v / P) * P;
const onRoad = (x, s, m = 0) => Math.abs(x - nearLine(x)) <= RW - m || Math.abs(s - nearLine(s)) <= RW - m;
// the garage: what the bank can buy (each level costs more); read through upLv, so the robots always drive the plain car
const UPGRADES = [
  { id: 'engine', name: 'Engine', desc: 'More top speed: the cops close slower.', max: 5, cost: l => 120 + l * 140 },
  { id: 'armour', name: 'Armour', desc: 'One more hit before the car is done.', max: 3, cost: l => 200 + l * 260 },
  { id: 'nitro', name: 'Nitro tank', desc: 'Start each job with one more nitro.', max: 3, cost: l => 150 + l * 200 },
  { id: 'feet', name: 'Trainers', desc: 'Run faster on foot.', max: 4, cost: l => 100 + l * 120 },
  { id: 'magnet', name: 'Magnet', desc: 'Grab cash from the next lane over.', max: 1, cost: () => 450 },
  { id: 'scanner', name: 'Police scanner', desc: 'Hear the ram and see roadblocks sooner.', max: 3, cost: l => 160 + l * 180 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Pickpocket'], [500, 'Joyrider'], [1500, 'Getaway driver'], [4000, 'Wheelman'], [9000, 'Ghost'], [20000, 'Legend']];

function makeCfg(N, help) {
  const f = curve(N), e = easyOf(N), boss = N % 10 === 0, x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), slow = help ? 1.2 : 1;
  return { N, f, e, boss, help: !!help,
    hp: 3 + Math.floor(upLv('armour')), nitro: 2 + upLv('nitro'), magnet: upLv('magnet') > 0, scan: upLv('scanner'),
    vmax: 30 * (1 + 0.025 * upLv('engine')), boostV: 1.35, boostT: 2.4,
    drive: x(900, 1900, 30) + (boss ? 400 : 0),                         // metres to the drop
    traffic: x(0.022, 0.03, 30) * (1 - 0.1 * e), cars: Math.round(x(7, 13, 30) * (1 - 0.15 * e)),      // cars on the streets round you
    cops: N <= 1 ? 1 : Math.min(3, 1 + Math.round(x(0, 2, 25))), ram: x(1.4, 0.9, 30) * slow * (1 + 0.3 * e), rest: x(9, 4.5, 30) * (1 + 0.6 * e),   // cop speed (share of yours), how many, ram warning (s)
    blocks: N <= 2 ? 0 : x(1 / 700, 1 / 340, 30), blockSee: x(160, 125, 30) + 25 * upLv('scanner'), spikes: N < 4 ? 0 : x(1 / 1100, 1 / 450, 30),
    heli: N < 6 ? 0 : x(0.2, 1, 30), cash: 1 / 70, cans: 1 / 380,
    foot: x(240, 420, 30), run: 8.8 * (1 + 0.03 * upLv('feet')), copRun: x(8.5, 8.75, 30), footGap: x(9.5, 9, 30) * (help ? 1.3 : 1), obst: x(0.05, 0.11, 30) * (1 - 0.3 * e), turnGap: Math.round(x(9, 6, 30)) };      // turnGap: 6 m modules of alley between corners
}
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null,
    weather: weatherOf(N), ph: 'drive', ph_t: 0, hp: cfg.hp, nitro: cfg.nitro, boost: 0, heat: 1, heatX: 0, cash: 0, bags: 0, hits: 0, stumbles: 0, combo: 0, bestCombo: 0,
    in: { sx: 0, gas: false, brake: false }, me: { x: LANE, s: 12, h: 0, v: 12, w: 0, imm: 0 }, cops: [], traffic: [], trail: [], things: [], blocks: [], route: [], ri: 0, heli: null, foot: null, nextCop: 2, passed: 0 };
  makeRoute(G);
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G);
  return G;
}
// ---------- the way to the drop ----------
// G.route: junctions in order, { i, j, dir }: the junction at (i * P, j * P), reached travelling `dir` (an index into DIRS). Stretch k
// runs from junction k - 1 (the start, for k = 0) to junction k. It turns at about six junctions in ten and never visits one twice.
// G.ri is the stretch you are on (the junction you are heading for). Cash, cans, spikes and roadblocks are laid on the stretches.
const nodeAt = (G, k) => k < 0 ? [0, 0] : [G.route[k].i * P, G.route[k].j * P];
function segRel(G, k, x, s) { const [bx, bs] = nodeAt(G, k - 1), d = DIRS[G.route[k].dir]; return { along: (x - bx) * d[0] + (s - bs) * d[1], lat: (x - bx) * d[1] - (s - bs) * d[0] }; }      // how far along stretch k, and how far to the right of its middle
function segPt(G, k, along, lat) { const [bx, bs] = nodeAt(G, k - 1), d = DIRS[G.route[k].dir]; return [bx + d[0] * along + d[1] * lat, bs + d[1] * along - d[0] * lat]; }
function makeRoute(G) {
  const c = G.cfg, L = lessonNow(G); G.route = [{ i: 0, j: 1, dir: 0 }]; G.seenN = new Set(['0:0', '0:1']); G.things = []; G.blocks = []; G.ri = 0; G.path = null; G.ghost = null; G.trail = [];
  G.endless = !!L; extendRoute(G, (L ? 12 : Math.max(6, Math.round(c.drive / P))) - 1);
}
function extendRoute(G, n) {
  const c = G.cfg, R = G.rnd, rt = G.route, L = lessonNow(G);
  for (let q = 0; q < n; q++) { const last = rt[rt.length - 1], all = [last.dir, (last.dir + 1) % 4, (last.dir + 3) % 4], free = all.filter(d => !G.seenN.has((last.i + DIRS[d][0]) + ':' + (last.j + DIRS[d][1]))), from = free.length ? free : all, turns = from.filter(d => d !== last.dir);
    const prev2 = rt[rt.length - 2], long = prev2 && prev2.dir === last.dir, dir = turns.length && (R() < 0.6 || long || !from.includes(last.dir)) ? turns[(R() * turns.length) | 0] : from.includes(last.dir) ? last.dir : from[0], nd = { i: last.i + DIRS[dir][0], j: last.j + DIRS[dir][1], dir }; rt.push(nd); G.seenN.add(nd.i + ':' + nd.j);
    const k = rt.length - 1, lastOne = !G.endless && q === n - 1, put = (kind, along, lane) => { const [x, s] = segPt(G, k, along, LANES[lane]); G.things.push({ k: kind, seg: k, along, lane, x, s }); };
    if (R() < 0.9) { const lane = (R() * 4) | 0, a0 = 18 + R() * 18; for (let m = 0; m < 3 + ((R() * 3) | 0); m++) put('cash', a0 + m * 7, lane); }
    if (R() < c.cans * P * 1.2) put('can', 24 + R() * 40, (R() * 4) | 0);
    let spike = false; if ((!L || L.spikes) && c.spikes && k >= 2 && !lastOne && R() < c.spikes * P) { spike = true; put('spike', 34 + R() * 18, (R() * 4) | 0); }
    if ((L ? L.blocks && k % 2 === 0 : c.blocks && k >= 2 && !lastOne && !spike && R() < c.blocks * P * 1.2)) { const gap = (R() * 4) | 0, [x, s] = segPt(G, k, 46, 0); G.blocks.push({ seg: k, along: 46, gap, x, s, dir, seen: false, done: false }); } }
}
// ---------- the thumbs ----------
function drive(G, sx, gas, brake) { const I = G.in; I.sx = clamp(sx, -1, 1); I.gas = !!gas; I.brake = !!brake; }      // the stick (left -1 .. right +1) and the two pedals
function swipe(G, dir) {      // on foot: 'l' 'r' 'u' 'd'
  if (G.over) return;
  if (G.ph === 'foot') { const F = G.foot;
    if (dir === 'l' || dir === 'r') { const nt = F.turns.find(q => !q.past);      // near a corner a sideways swipe is the turn (the first one counts); anywhere else it changes lane
      if (nt && nt.s - F.s <= FOOT_WIN) { if (nt.got === null) { const ok = (dir === 'r' ? 1 : -1) === nt.dir; nt.got = ok ? 'ok' : 'wrong'; G.ev.push({ k: ok ? 'turnset' : 'turnwrong', dir }); } return; } }
    if (dir === 'l') F.lane = Math.max(0, F.lane - 1); else if (dir === 'r') F.lane = Math.min(2, F.lane + 1); else if (dir === 'u' && F.air <= 0 && F.low <= 0) { F.air = 0.75; G.ev.push({ k: 'jump' }); } else if (dir === 'd' && F.air <= 0 && F.low <= 0) { F.low = 0.8; G.ev.push({ k: 'slide' }); } }
}
function nitro(G) { if (G.over || G.ph !== 'drive' || G.boost > 0) return; if (G.nitro <= 0) { G.ev.push({ k: 'empty' }); return; } G.nitro--; G.boost = G.cfg.boostT; G.ev.push({ k: 'nitro', left: G.nitro }); lessonSee(G, 'nitro'); }
const tap = G => nitro(G);
// ---------- every frame ----------
function step(G, dt) {
  if (G.over) return; G.t += dt; G.ph_t += dt;
  if (G.ph === 'drive') driveStep(G, dt); else if (G.ph === 'ditch') { if (G.ph_t > 1.4) startFoot(G); } else if (G.ph === 'foot') footStep(G, dt); else if (G.ph === 'home') { if (G.ph_t > 1.6) payout(G); }
}
function driveStep(G, dt) {
  const c = G.cfg, me = G.me, I = G.in, R = G.rnd, L = lessonNow(G), rt = G.route;
  G.boost = Math.max(0, G.boost - dt); me.imm = Math.max(0, me.imm - dt);
  // ---- your car: gas, brake (then reverse), a stick that turns it less the faster it goes; nitro lifts the top speed and the pull
  const vmax = c.vmax * (G.boost > 0 ? c.boostV : 1) * (L ? 0.85 : 1);
  if (I.brake) me.v = me.v > 0.3 ? Math.max(0, me.v - 24 * dt) : Math.max(-8, me.v - 9 * dt);
  else if (I.gas || G.boost > 0) me.v = me.v < vmax ? Math.min(vmax, me.v + (me.v < 0 ? 22 : (G.boost > 0 ? 14 : 1.5 + 9 * (1 - 0.55 * me.v / vmax))) * dt) : Math.max(vmax, me.v - 6 * dt);
  else me.v -= Math.sign(me.v) * Math.min(Math.abs(me.v), 3.2 * dt);
  const sp = Math.abs(me.v), grip = Math.min(1, sp / 6) / (1 + Math.max(0, sp - 15) * 0.045); me.w = I.sx * 2.3 * grip * (me.v < 0 ? -1 : 1); me.h = wrapPi(me.h + me.w * dt);
  let nx = me.x + Math.sin(me.h) * me.v * dt, ns = me.s + Math.cos(me.h) * me.v * dt;
  if (!onRoad(nx, ns, 1.1)) {      // a wall: slide along it, lose speed by how squarely you met it, and be turned a little to run with the street
    const okx = onRoad(nx, me.s, 1.1), oks = onRoad(me.x, ns, 1.1), into = okx ? Math.abs(Math.cos(me.h)) : oks ? Math.abs(Math.sin(me.h)) : 1;
    if (okx) ns = me.s; else if (oks) nx = me.x; else { nx = me.x; ns = me.s; }
    if (me.imm <= 0) { if (sp * into > 21) { hit(G, 'wall'); me.v = -Math.abs(me.v) * 0.5; } else if (sp > 4) { G.ev.push({ k: 'kerb' }); me.imm = 0.35; } }
    me.v -= me.v * Math.min(1, into * 5 * dt); const along = okx ? (Math.sin(me.h) >= 0 ? Math.PI / 2 : -Math.PI / 2) : (Math.cos(me.h) >= 0 ? 0 : Math.PI); me.h = wrapPi(me.h + wrapPi(along - me.h) * Math.min(1, dt * 2.5 * into)); }
  const px0 = me.x, ps0 = me.s; me.x = nx; me.s = ns;
  { const tl = G.trail, last = tl[tl.length - 1]; if (!last || Math.hypot(me.x - last[0], me.s - last[1]) > 4) { tl.push([me.x, me.s]); if (tl.length > 90) { tl.shift(); for (const cp of G.cops) cp.ti = Math.max(0, cp.ti - 1); } } }
  // the street you are on: its direction (the nearest of the four to your heading) and how far right of its middle you are
  const ax = ((Math.round(me.h / (Math.PI / 2)) % 4) + 4) % 4, ad = DIRS[ax], myLat = ad[0] ? -(me.s - nearLine(me.s)) * ad[0] : (me.x - nearLine(me.x)) * ad[1];
  // heat: rises with the job, and when the helicopter's light is on you; it sets how many cops come
  G.heatX += dt * (0.012 + c.f * 0.0006); G.heat = clamp(1 + Math.floor(G.heatX), 1, 5);
  // ---- the way: the next junction is reached when you are in it (or in a later one: a short cut is a short cut)
  if (G.endless && G.ri > rt.length - 6) extendRoute(G, 6);
  for (let k = G.ri; k < Math.min(rt.length, G.ri + 4); k++) { const [qx, qs] = nodeAt(G, k); if (Math.hypot(me.x - qx, me.s - qs) < 12) { const turned = k > 0 && rt[k].dir !== rt[k - 1].dir; G.ri = k + 1; G.ev.push({ k: 'node', n: k }); if (turned) lessonSee(G, 'corner'); break; } }
  if (G.ri >= rt.length && !G.endless) { G.ph = 'ditch'; G.ph_t = 0; G.ev.push({ k: 'ditch' }); return; }
  // ---- traffic: cars keeping to their lane along the streets near you
  const want = Math.round(c.cars * (L && !L.traffic ? 0.4 : 1));
  for (let tries = 0; G.traffic.length < want && tries < 4; tries++) { const dir = (R() * 4) | 0, d = DIRS[dir], line = nearLine((d[0] ? me.s : me.x) + (R() - 0.5) * 5 * P), pos = (d[0] ? me.x : me.s) + (R() - 0.5) * 6 * P;
    const x = d[0] ? pos : line + d[1] * LANE, s2 = d[0] ? line - d[0] * LANE : pos; if (Math.hypot(x - me.x, s2 - me.s) < 70 || G.blocks.some(b => !b.done && Math.hypot(x - b.x, s2 - b.s) < 60)) continue; G.traffic.push({ x, s: s2, dir, v: 8 + R() * 6, col: (R() * 6) | 0, hit: 0 }); }
  for (const t of G.traffic) { const d = DIRS[t.dir]; if (G.blocks.some(b => !b.done && Math.hypot(t.x + d[0] * 14 - b.x, t.s + d[1] * 14 - b.s) < 12)) t.v = Math.max(0, t.v - 20 * dt); t.x += d[0] * t.v * dt; t.s += d[1] * t.v * dt; if (t.hit > 0) { t.hit -= dt; t.x += t.hx * dt; t.s += t.hs * dt; }
    const dx = t.x - me.x, ds = t.s - me.s, dd = dx * dx + ds * ds; if (dd < 7.3 && me.imm <= 0) { const k2 = Math.hypot(dx, ds) || 1; t.hit = 0.6; t.hx = dx / k2 * 5; t.hs = ds / k2 * 5; t.bad = true; if (sp > 6) hit(G, 'car'); else { me.v *= 0.5; me.imm = 0.5; G.ev.push({ k: 'kerb' }); } }
    if (dd < 60 && sp > 14) t.near = true; else if (t.near && dd > 110) { t.near = false; if (!t.bad) { G.passed++; G.combo++; G.bestCombo = Math.max(G.bestCombo, G.combo); if (G.combo % 5 === 0) G.ev.push({ k: 'weave', n: G.combo }); } t.bad = false; } }      // a near miss at speed is a weave
  G.traffic = G.traffic.filter(t => Math.hypot(t.x - me.x, t.s - me.s) < 3.6 * P);
  // ---- the cops: they come up the way you came. Close behind, one pulls alongside, flashes, and rams where you were heading: steer away
  const uAx = me.x * ad[0] + me.s * ad[1], toCross = Math.ceil(uAx / P) * P - uAx;      // how far to the next cross street: he only rams on a straight, with room for you to get out of the way
  G.nextCop -= dt; G.ramCool = Math.max(0, (G.ramCool || 0) - dt); const cw = Math.min(c.cops, L ? (L.cops || 0) : Math.ceil(G.heat * c.cops / 4)), tl = G.trail;
  if (G.cops.length < cw && G.nextCop <= 0) { const ti = Math.max(0, tl.length - 18 - ((R() * 7) | 0)), far = tl.length > 14, bx = far ? tl[ti][0] : me.x - ad[0] * 60, bs = far ? tl[ti][1] : me.s - ad[1] * 60;      // up your trail; or, if you have hardly moved, down the street behind you: parking is no hiding place
    G.cops.push({ x: bx, s: bs, h: me.h, v: sp, ti: far ? ti : Math.max(0, tl.length - 1), ram: 0, cool: 2 + R() * 2, side: 1 }); G.nextCop = 4 + R() * 4; G.ev.push({ k: 'siren' }); }
  for (const cp of G.cops) {
    cp.cool = Math.max(0, cp.cool - dt);
    if (cp.ram > 0) { const A = cp.aim, rx = A.d[1], rs = -A.d[0], al = (me.x - A.x) * A.d[0] + (me.s - A.s) * A.d[1], lat = (me.x - A.x) * rx + (me.s - A.s) * rs; cp.ram -= dt; cp.out = Math.min(1, (cp.out || 0) + dt * 3);      // abreast of you, a car's width off the line you were on
      const bk = -8 * (1 - cp.out); cp.x = A.x + A.d[0] * (al + bk) + rx * cp.side * 3.3 * cp.out; cp.s = A.s + A.d[1] * (al + bk) + rs * cp.side * 3.3 * cp.out; cp.h = Math.atan2(A.d[0], A.d[1]); cp.v = sp;
      if (cp.ram <= 0 || Math.hypot(cp.x - me.x, cp.s - me.s) < 2.3) { const touch = cp.ram > 0; cp.x = A.x + A.d[0] * al; cp.s = A.s + A.d[1] * al; G.ev.push({ k: 'ram', side: cp.side });
        if ((touch || Math.abs(lat) < 1.9) && me.imm <= 0) hit(G, 'ram'); else if (!touch) { G.ev.push({ k: 'dodged' }); lessonSee(G, 'dodge'); G.combo++; }
        cp.ram = 0; cp.out = 0; cp.ti = Math.max(0, tl.length - 6); cp.x = tl[cp.ti][0]; cp.s = tl[cp.ti][1]; cp.cool = c.rest * (0.8 + R() * 0.5); G.ramCool = c.rest * (0.8 + R() * 0.4); cp.aim = null; }
      continue; }
    while (cp.ti < tl.length - 1 && Math.hypot(cp.x - tl[cp.ti][0], cp.s - tl[cp.ti][1]) < 5) cp.ti++;
    const tg = cp.ti >= tl.length - 1 ? [me.x, me.s] : tl[cp.ti], gap = (tl.length - 1 - cp.ti) * 4 + Math.hypot(cp.x - tg[0], cp.s - tg[1]);
    const wantV = G.boost > 0 && gap < 60 ? Math.max(3, sp - 6) : gap > 9 ? Math.max(8, sp + 6 + gap * 0.05) : Math.min(sp, Math.max(0, (gap - 5) * 3)); cp.v += clamp(wantV - cp.v, -30 * dt, 14 * dt);
    if (Math.hypot(tg[0] - cp.x, tg[1] - cp.s) > 0.5) cp.h = Math.atan2(tg[0] - cp.x, tg[1] - cp.s); cp.x += Math.sin(cp.h) * cp.v * dt; cp.s += Math.cos(cp.h) * cp.v * dt;
    if (gap < 11 && cp.cool <= 0 && (G.ramCool || 0) <= 0 && (sp < 6 || toCross > 40 + sp * 0.9) && !G.cops.some(o => o.ram > 0) && !G.blocks.some(b => !b.done && Math.hypot(b.x - me.x, b.s - me.s) < 75)) {      // never while another is at it, nor into a roadblock's gap: that would be no way out
      cp.aim = { x: me.x, s: me.s, d: ad }; cp.side = myLat >= 0 ? 1 : -1; cp.out = 0; cp.ram = c.ram * (1 + 0.15 * c.scan) * (L ? 1.4 : 1); G.ev.push({ k: 'flash', side: cp.side }); }      // he comes up on the side nearer the kerb: the open street is your way out
  }
  G.cops = G.cops.filter(cp => cp.ram > 0 || (tl.length - 1 - cp.ti) * 4 < 170);
  // stopped, with a police car on your bumper: they have you (a getaway that parks is over)
  if (sp < 2 && !L && G.cops.some(cp => Math.hypot(cp.x - me.x, cp.s - me.s) < 9)) { G.boxed = (G.boxed || 0) + dt; if (G.boxed > 1.6) { finish(G, false, 'boxed'); return; } } else G.boxed = Math.max(0, (G.boxed || 0) - dt * 2);
  // ---- the helicopter: from heat 3 (on later jobs), a spotlight sweeping across your street; caught in it, the heat climbs
  if (c.heli && G.heat >= 3 && !G.heli) { G.heli = { lat: 0, t: 0, x: me.x, s: me.s }; G.ev.push({ k: 'heli' }); }
  if (G.heli) { const h = G.heli; h.t += dt; h.lat = Math.sin(h.t * (0.5 + c.heli * 0.5)) * 5.2; h.x = me.x + ad[1] * (h.lat - myLat); h.s = me.s - ad[0] * (h.lat - myLat); if (Math.abs(h.lat - myLat) < 1.6) { G.heatX += dt * 0.35 * c.heli; if (!h.on) { h.on = true; G.ev.push({ k: 'spotted' }); } } else h.on = false; }
  // ---- things on the street: cash and cans by touch; a spike strip covers its place across the street
  for (const th of G.things) { if (th.done || Math.abs(th.x - me.x) > 9 || Math.abs(th.s - me.s) > 9) continue; const dd = Math.hypot(th.x - me.x, th.s - me.s);
    if (th.k === 'cash' && (dd < 2.4 || (c.magnet && dd < 5.5))) { th.done = true; const v = 10 * G.heat; G.cash += v; G.bags++; G.ev.push({ k: 'cash', v }); lessonSee(G, 'cash'); }
    else if (th.k === 'can' && dd < 2.4) { th.done = true; G.nitro = Math.min(G.nitro + 1, 6); G.ev.push({ k: 'can' }); }
    else if (th.k === 'spike') { const q = segRel(G, th.seg, me.x, me.s); if (Math.abs(q.along - th.along) < 1.3 && Math.abs(q.lat - LANES[th.lane]) < 2.5) { th.done = true; if (me.imm <= 0) hit(G, 'spike'); } } }
  // ---- roadblocks: seen from far off; crossing the line anywhere but the gap smashes through and costs a hit
  for (const b of G.blocks) { if (b.done) continue; const far = Math.hypot(b.x - me.x, b.s - me.s); if (!b.seen && far < c.blockSee && b.seg <= G.ri + 1) { b.seen = true; G.ev.push({ k: 'block', gap: b.gap }); } if (far > 20) continue;
    const q0 = segRel(G, b.seg, px0, ps0), q1 = segRel(G, b.seg, me.x, me.s); if (q0.along < b.along && q1.along >= b.along && Math.abs(q1.lat) < RW) { b.done = true;
      if (Math.abs(q1.lat - LANES[b.gap]) > 1.5) { if (me.imm <= 0) hit(G, 'block'); } else { G.ev.push({ k: 'through' }); lessonSee(G, 'through'); G.combo += 3; G.cash += 25 * G.heat; } } }
}
function hit(G, what) {
  const me = G.me; me.v *= what === 'spike' ? 0.7 : 0.45; me.imm = 1.3; G.hits++; (G.hitLog = G.hitLog || []).push(what); G.combo = 0; G.heatX += 0.3; G.ev.push({ k: 'hit', what, hp: G.hp - 1 });
  if (lessonNow(G)) { lessonMiss(G, what); return; }
  G.hp--; if (G.hp <= 0) finish(G, false, 'wrecked');
}
// ---------- on foot ----------
// 23 Nov 2026 (his second Police Chase review: "the person when running should also be able to turn corners, and I can turn corners"; this
// alley was the same straight one): the alleys have corners. F.turns: { s (how far along the run), dir (-1 left, +1 right), px, py (the
// corner's place: x east, y north), h0 (the heading into it), got (null | 'ok' | 'wrong'), past }. The run only ever heads north, east or
// west, so it never crosses itself. Corridors are whole 6 m modules between 5.2 m corner squares (the view builds its walls from them).
const FOOT_R = 2.2, FOOT_WIN = 13, FOOT_BACK = 12;      // the arc you round a corner on; how far before a corner a swipe is the turn; alley behind the start
function footPath(R, len, o) {
  const turns = []; let s = o.first, h = 0, px = 0, py = 0, prev = 0;
  while (s < len - 30) { const hq = Math.round(h / (Math.PI / 2)), dir = hq === 0 ? (R() < 0.5 ? -1 : 1) : -hq;
    px += Math.sin(h) * (s - prev); py += Math.cos(h) * (s - prev); turns.push({ s, dir, tee: false, px, py, h0: h, got: null, past: false });
    h += dir * Math.PI / 2; prev = s; s += 5.2 + 6 * (o.gapMin + ((R() * o.gapVar) | 0)); }
  return turns;
}
function footAt(F, s) {      // where the run is, s metres along: { x, y, h }; each corner is rounded on a short arc
  const T = F.turns; let i = 0; while (i < T.length && T[i].s + FOOT_R <= s) i++; const t = T[i];
  if (t && s > t.s - FOOT_R) { const th = (s - (t.s - FOOT_R)) / (2 * FOOT_R) * Math.PI / 2, fx = Math.sin(t.h0), fy = Math.cos(t.h0), rx = fy * t.dir, ry = -fx * t.dir, ox = t.px - fx * FOOT_R + rx * FOOT_R, oy = t.py - fy * FOOT_R + ry * FOOT_R;
    return { x: ox + (-rx * Math.cos(th) + fx * Math.sin(th)) * FOOT_R, y: oy + (-ry * Math.cos(th) + fy * Math.sin(th)) * FOOT_R, h: t.h0 + t.dir * th }; }
  const p = T[i - 1], h = p ? p.h0 + p.dir * Math.PI / 2 : 0, d = s - (p ? p.s : 0); return { x: (p ? p.px : 0) + Math.sin(h) * d, y: (p ? p.py : 0) + Math.cos(h) * d, h };
}
function startFoot(G) {
  const c = G.cfg, R = G.rnd, obs = [], L = lessonNow(G), id = L && L.foot ? L.id : null, len = c.foot * (L ? 0.7 : 1);
  // a lesson teaches one thing at a time: the corners with nothing in the way, then the crates, fences and pipes down a straight alley
  const turns = id === 'run' ? [] : footPath(R, len, id === 'corner' ? { first: 32.6, gapMin: 6, gapVar: 2 } : { first: 44.6 + 6 * ((R() * 3) | 0), gapMin: c.turnGap, gapVar: 5 }), clear = s => !turns.some(t => s > t.s - 17 && s < t.s + 9);
  if (id !== 'corner') for (let s = 18; s < len + 60; s += 1 / c.obst * (0.6 + 0.8 * R())) { const r = R(), type = r < 0.5 ? 'crate' : r < 0.78 ? 'fence' : 'pipe', o = { s, lane: type === 'crate' ? (R() * 3) | 0 : -1, type, two: type === 'crate' && R() < 0.4 ? ((R() * 3) | 0) : -1 }; if (clear(s)) obs.push(o); }
  const coins = []; for (let s = 30; s < len; s += 25 + R() * 30) { const lane = (R() * 3) | 0; for (let k = 0; k < 4; k++) if (clear(s + k * 3)) coins.push({ s: s + k * 3, lane }); }
  G.ph = 'foot'; G.ph_t = 0; G.foot = { s: 0, lane: 1, x: 0, gap: c.footGap, air: 0, low: 0, stumble: 0, obs, coins, turns, len }; G.ev.push({ k: 'foot' });
}
function footStep(G, dt) {
  const c = G.cfg, F = G.foot, L = lessonNow(G);
  F.air = Math.max(0, F.air - dt); F.low = Math.max(0, F.low - dt); F.stumble = Math.max(0, F.stumble - dt);
  const v = F.stumble > 0 ? 3 : c.run, cv = c.copRun * (L ? 0.85 : 1); F.s += v * dt; F.gap += (v - cv) * dt; F.x += clamp(ALLEY[F.lane] - F.x, -7 * dt, 7 * dt);
  const lane = Math.round((F.x + 1.3) / 1.3);
  for (const o of F.obs) if (!o.done && o.s <= F.s) { o.done = true; const blocked = o.type === 'crate' ? (lane === o.lane || lane === o.two) : o.type === 'fence' ? F.air <= 0.08 : F.low <= 0.05;
    if (blocked) { F.stumble = 1.15; G.stumbles++; G.combo = 0; G.ev.push({ k: 'stumble', type: o.type }); lessonMiss(G, o.type); } else { G.ev.push({ k: 'cleared', type: o.type }); lessonSee(G, 'cleared'); G.combo++; } }
  // the corner: swiped the way it turns, you are round it; the wrong way or not at all, you meet the wall first
  for (const t of F.turns) { if (t.past) continue; if (F.s < t.s - 1.2) break; t.past = true;
    if (t.got === 'ok') { G.ev.push({ k: 'cornered', dir: t.dir }); lessonSee(G, 'corner'); G.combo++; }
    else { F.stumble = 1.15; G.stumbles++; G.combo = 0; G.ev.push({ k: 'wall', why: t.got === 'wrong' ? 'wrong' : 'late', dir: t.dir }); lessonMiss(G, 'corner'); } }
  for (const q of F.coins) if (!q.done && Math.abs(q.s - F.s) < 1 && (q.lane === lane || (c.magnet && Math.abs(q.lane - lane) <= 1))) { q.done = true; G.cash += 5 * G.heat; G.ev.push({ k: 'coin' }); }
  if (F.gap <= 0) { if (L) { F.gap = 10; lessonMiss(G, 'caught'); } else { finish(G, false, 'caught'); return; } }
  if (F.s >= F.len) { if (L) { lessonSee(G, 'home'); if (G.lesson) { startFoot(G); } } else { G.ph = 'home'; G.ph_t = 0; G.ev.push({ k: 'home' }); } }
}
function payout(G) { const clean = G.hits === 0 && G.stumbles === 0, bonus = Math.round(G.cash * (clean ? 0.5 : G.hits === 0 ? 0.25 : 0)); G.bonus = bonus; G.cash += bonus; finish(G, true); }
function finish(G, win, why) {
  G.over = win ? 'won' : 'lost'; const cash = win ? G.cash : Math.round(G.cash * 0.3);      // caught: you keep what you stuffed in your pockets
  G.res = { win, why, stars: win ? (G.hits === 0 && G.stumbles <= 1 ? 3 : G.hits <= 1 ? 2 : 1) : 0, cash, bonus: G.bonus || 0, heat: G.heat, hits: G.hits, stumbles: G.stumbles, combo: G.bestCombo, time: G.t };
  G.ev.push({ k: win ? 'won' : 'lost', why });
}
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'steer', title: 'FOLLOW THE GREEN ARROWS', say: 'STEER, HOLD GAS', do: 'hold', how: 'Left thumb: the stick steers. Right thumb: hold GAS. BRAKE before a corner. Follow the green arrows round 3 corners.', need: 3, ok: w => w === 'corner' },
      { id: 'nitro', title: 'NITRO', say: 'TAP NITRO', do: 'tap', at: G => { const b = nitroBtn(); return [b.x + b.w / 2, b.y + b.h / 2]; }, how: 'Press the blue NITRO button for a burst of speed: it leaves the cops behind. Try it.', need: 1, ok: w => w === 'nitro' }],
  2: [{ id: 'dodge', title: 'THE RAM', say: 'STEER AWAY!', do: 'drag', dir: 'lr', how: 'A police car pulls alongside and FLASHES: steer AWAY from it before it rams. Dodge two.', need: 2, ok: w => w === 'dodge', cops: 1 }],
  3: [{ id: 'block', title: 'ROADBLOCKS', say: 'THROUGH THE GAP', do: 'drag', dir: 'lr', how: 'A roadblock leaves ONE gap: the arrow shows it. Slow down and steer through the gap. Two of them.', need: 2, ok: w => w === 'through', blocks: true },
      { id: 'corner', title: 'CORNERS', say: 'SWIPE THE ARROW WAY', do: 'swipe', dir: 'lr', how: 'When the alley turns, swipe LEFT or RIGHT: the way the yellow arrow points. Take two corners.', need: 2, ok: w => w === 'corner', foot: true },
      { id: 'run', title: 'ON FOOT', say: 'SWIPE ROUND, UP, DOWN', do: 'swipe', dir: 'lr', how: 'Swipe left and right round crates, UP over fences, DOWN under pipes. Clear six.', need: 6, ok: w => w === 'cleared', foot: true }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0, miss: 0 }; lessonSet(G); G.ev.push({ k: 'lessonnext', first: true }); }
function resetDrive(G) { G.ph = 'drive'; G.ph_t = 0; Object.assign(G.me, { x: LANE, s: 12, h: 0, v: 12, w: 0, imm: 0 }); Object.assign(G.in, { sx: 0, gas: false, brake: false }); G.cops.length = 0; G.traffic.length = 0; G.heli = null; makeRoute(G); G.ev.push({ k: 'drive' }); }
function lessonSet(G) { const st = lessonNow(G); if (!st) return; if (st.foot) startFoot(G); else resetDrive(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonSee(G, what) {
  const D = G.lesson; if (!D) return; const st = D.steps[D.i]; if (!st.ok(what)) return;
  D.n++; if (D.n < st.need) { G.ev.push({ k: 'lessonok', n: D.n, need: st.need }); return; }
  D.i++; D.n = 0; D.miss = 0;
  if (D.i >= D.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); Object.assign(G, { ph: 'drive', ph_t: 0, hp: G.cfg.hp, nitro: G.cfg.nitro, boost: 0, heat: 1, heatX: 0, cash: 0, bags: 0, hits: 0, stumbles: 0, combo: 0, bestCombo: 0, heli: null, nextCop: 3 }); resetDrive(G); }
  else { G.ev.push({ k: 'lessonnext' }); lessonSet(G); }
}
function lessonMiss(G, why) { const D = G.lesson; if (!D) return; D.miss++; if (D.steps[D.i].strict) D.n = 0; G.ev.push({ k: 'lessonmiss', why, how: D.steps[D.i].how }); }

// ---------- for the robots ----------
// BLIND: the stick left, right, centred; GAS (brake off), BRAKE (gas off); the NITRO button; on foot, swipes
const BLIND = { L: G => { G.in.sx = -1; }, R: G => { G.in.sx = 1; }, N: G => { G.in.sx = 0; }, G: G => { G.in.gas = true; G.in.brake = false; }, B: G => { G.in.brake = true; G.in.gas = false; },
  l: G => swipe(G, 'l'), r: G => swipe(G, 'r'), u: G => swipe(G, 'u'), d: G => swipe(G, 'd'), t: G => tap(G) };
// the line a careful driver takes along the route: a ghost car drives it (right-hand lane, slowing for the corners) and drops
// crumbs every 4 m, each with the stretch it is on. Only the robots and the home screen use it.
function ensurePath(G) {
  const rt = G.route; if (!G.path) { G.path = []; G.ghost = { x: LANE, s: 12, h: 0, k: 0 }; } const gh = G.ghost, pt = G.path;
  for (let n = 0; gh.k < rt.length && n < 60000; n++) { const nd = rt[gh.k], d = DIRS[nd.dir], qx = nd.i * P, qs = nd.j * P, toNode = (qx - gh.x) * d[0] + (qs - gh.s) * d[1], nxt = rt[gh.k + 1], turn = nxt && nxt.dir !== nd.dir;
    if (toNode < (turn ? 7.5 : 0)) { gh.k++; continue; }
    const rx = d[1], rs = -d[0], ax = (d[0] ? gh.x : qx) + rx * LANE + d[0] * 13, as = (d[1] ? gh.s : qs) + rs * LANE + d[1] * 13, err = wrapPi(Math.atan2(ax - gh.x, as - gh.s) - gh.h), v = turn && toNode < 34 || Math.abs(err) > 0.5 ? 11 : 20, dt = 1 / 30;
    gh.h = wrapPi(gh.h + clamp(err * 4, -2.4, 2.4) * dt); gh.x += Math.sin(gh.h) * v * dt; gh.s += Math.cos(gh.h) * v * dt; const last = pt[pt.length - 1]; if (!last || Math.hypot(gh.x - last[0], gh.s - last[1]) > 4) pt.push([gh.x, gh.s, gh.k]); }
  return pt;
}
// a driver who looks: follows the green arrows in the right-hand lane, brakes for a corner and for a car ahead, lines up a roadblock's
// gap early, goes round a spike strip, swerves away from a flashing cop, uses nitro when one is close; on foot, reads what is coming
const b2f = v => v;
function honest(G, o, mem) {
  const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, c = G.cfg, t = G.t;
  const later = (key, cond) => { if (!cond) { mem[key] = null; return false; } if (mem[key] == null) mem[key] = t; return t - mem[key] >= react; };
  if (G.ph === 'drive') { const me = G.me, sp = Math.abs(me.v), tl = ensurePath(G); if (mem.rt !== G.route) { mem.rt = G.route; mem.bi = 0; }
    let bi = mem.bi | 0, bd = 1e9; const lo = Math.max(0, bi - 6), hi = Math.min(tl.length, bi + 40); for (let i = lo; i < hi; i++) { const d2 = Math.hypot(tl[i][0] - me.x, tl[i][1] - me.s); if (d2 <= bd) { bd = d2; bi = i; } }
    if (bd > 30) for (let i = 0; i < tl.length; i++) { const d2 = Math.hypot(tl[i][0] - me.x, tl[i][1] - me.s); if (d2 < bd && tl[i][2] >= G.ri - 1) { bd = d2; bi = i; } } mem.bi = bi;
    const ahead = Math.round((7 + sp * 0.5) / 4), far = Math.round((14 + sp * 1.1) / 4), p1 = tl[Math.min(tl.length - 1, bi + ahead)] || [me.x, me.s, G.ri], p2 = tl[Math.min(tl.length - 1, bi + far)] || p1;
    let tx = p1[0], ts = p1[1], brake = false; const seg = Math.min(p1[2], G.route.length - 1), d = DIRS[G.route[seg].dir], rx = d[1], rs = -d[0], q = segRel(G, seg, me.x, me.s);
    // where across the street to be: the gap of a roadblock he has seen, clear of a spike strip, away from a cop about to ram
    let shift = 0; const blk = G.blocks.find(b => !b.done && b.seen && b.seg === seg && q.along < b.along + 2);
    if (later('bk', !!blk)) { shift = LANES[blk.gap] - LANE; if (b2f(blk.along - q.along) < 34 && Math.abs(q.lat - LANES[blk.gap]) > 1.0 && sp > 9) brake = true; if (sp > 19) brake = true; } else if (blk && sp > 22) brake = true;
    const spk = G.things.find(th => !th.done && th.k === 'spike' && th.seg === seg && th.along - q.along > -2 && th.along - q.along < 12 + sp * (1.2 + react));
    if (!blk && later('sk', !!spk && Math.abs(LANE - LANES[spk.lane]) < 2.6)) shift = spk.lane >= 2 ? (spk.lane === 3 ? -2.9 : 2.3) : 0;
    const rm = G.cops.find(cp => cp.ram > 0); if (later('rm', !!rm)) { if (mem.rmSide == null) mem.rmSide = Math.random() < acc + (1 - acc) * 0.5 ? -rm.side : rm.side; const A = rm.aim, lat0 = segRel(G, seg, A.x, A.s).lat, moved = (me.x - A.x) * A.d[1] - (me.s - A.s) * A.d[0]; shift = clamp(lat0 + mem.rmSide * 3.2, -5.6, 5.6) - LANE; mem.jink = Math.abs(moved) < 2.4 ? mem.rmSide * 0.9 : 0; } else { mem.jink = 0; if (!rm) mem.rmSide = null; }      // a jink of the stick away from him, then hold the new line
    tx += rx * shift; ts += rs * shift;
    let err = wrapPi(Math.atan2(tx - me.x, ts - me.s) - me.h); const bend = Math.abs(wrapPi(Math.atan2(p2[0] - me.x, p2[1] - me.s) - me.h)); let dodge = mem.jink || 0;
    brake = brake || (Math.abs(err) > 0.5 && sp > 11) || (bend > 0.55 && sp > 15) || (bend > 0.9 && sp > 12);
    for (const t2 of G.traffic) { const lz = (t2.x - me.x) * Math.sin(me.h) + (t2.s - me.s) * Math.cos(me.h), lx = (t2.x - me.x) * Math.cos(me.h) - (t2.s - me.s) * Math.sin(me.h); if (lz > 0 && lz < 9 + sp * (0.7 + react) && Math.abs(lx) < 2.6) { if (!mem.jink) dodge = lx > 0 ? -0.9 : 0.9; if (lz < 6 + sp * react * 1.5 && sp > 9) brake = true; } }
    // slow hands, not blind ones: the stick follows what he wants with a lag (his reaction time), the brake comes on a reaction late, and now and then he misjudges
    if (t > (mem.offT || 0)) { mem.offT = t + 0.7; mem.off = Math.random() > acc ? (Math.random() - 0.5) * 0.7 : 0; } err += mem.off || 0;
    if (sp < 1.5 && !onRoad(me.x + Math.sin(me.h) * 4, me.s + Math.cos(me.h) * 4, 1.1)) mem.back = t + 0.9;      // nose against a wall: back out
    if (mem.back && t < mem.back) { drive(G, -clamp(err * 2, -1, 1), false, true); return; }
    mem.sx = (mem.sx || 0) + (clamp(err * 2.4 + dodge, -1, 1) - (mem.sx || 0)) * Math.min(1, (1 / 60) / (0.08 + react * 0.5)); const br = later('br', brake) && sp > 6;
    drive(G, mem.sx, !br, br);
    const Lh = lessonNow(G); if (G.nitro > 0 && G.boost <= 0 && t > (mem.nt || 0)) { mem.nt = t + 0.4; if (Lh && Lh.id === 'nitro' || !(Lh && Lh.id === 'dodge') && bend < 0.3 && !blk && G.cops.some(cp => Math.hypot(cp.x - me.x, cp.s - me.s) < 25) && Math.random() < 0.12) nitro(G); }
    return; }
  if (t < (mem.next || 0)) return; mem.next = t + 0.06 + react * 0.35;
  const slip = () => Math.random() < (1 - acc);
  if (G.ph === 'foot') { const F = G.foot, o2 = F.obs.find(q => !q.done && q.s > F.s), d = o2 ? o2.s - F.s : 99, nt = F.turns.find(q => !q.past);
    if (nt && nt.got === null && nt.s - F.s <= FOOT_WIN - 1 - react * 8) { const way = Math.random() < acc + (1 - acc) * 0.5 ? nt.dir : -nt.dir; swipe(G, way > 0 ? 'r' : 'l'); }      // reads the arrow a reaction late; now and then goes wrong
    if (!o2 || d > 9 * (0.6 + react)) return;
    if (o2.type === 'fence') { if (d < 4.5 && !slip()) swipe(G, 'u'); }
    else if (o2.type === 'pipe') { if (d < 4.5 && !slip()) swipe(G, 'd'); }
    else { const lane = Math.round((F.x + 1.3) / 1.3); if (lane === o2.lane || lane === o2.two) { const free = [0, 1, 2].filter(l => l !== o2.lane && l !== o2.two).sort((a, b) => Math.abs(a - lane) - Math.abs(b - lane))[0]; if (!slip()) swipe(G, free < lane ? 'l' : 'r'); } } }
}
function winNow(G) { if (!G || G.over || G.ph === 'home') return; G.lesson = null; G.ph = 'home'; G.ph_t = 0; G.cash = Math.max(G.cash, 50); }
