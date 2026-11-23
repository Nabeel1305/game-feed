// ===================== RULES: On the Run (game 24) =====================
// The other side of Police Chase. Each level is one job: the alarm goes and you are away.
//   DRIVE: the getaway down a city avenue (it drives itself). Swipe left or right to change lane; tap for NITRO. Traffic,
//          police cars closing from behind (one pulls alongside and flashes before it rams: change lane away), roadblocks with
//          one gap (seen from far off), spike strips, and a helicopter whose spotlight raises the heat. Grab cash bags and nitro
//          cans in the lanes. Three hits and the car is done. Reach the drop (the end of the avenue) and you ditch the car.
//   FOOT:  down the alleys to the safehouse with the cops behind you. Swipe left or right round crates, up over fences, down
//          under pipes; grab the cash. Stumble and they gain. They catch you and the job is lost.
//   THE SAFEHOUSE: the cash is counted and banked; a clean run pays a bonus. The bank buys upgrades in the GARAGE that carry
//          from job to job (a faster engine, armour, more nitro, quicker feet, a magnet, a police scanner). Nothing expires.
// HEAT (one to five stars) rises as the job goes on and when you are seen; more heat, more cops, the helicopter, and a bigger
// payout. World: metres; x across (right +), s along the street (ahead +).

const RULES = [
  '<b>Swipe left or right</b> to change lane. <b>Tap</b> for nitro (the flames show how many you have).',
  '<b>A police car pulls alongside and flashes</b> before it rams: swipe away from it.',
  '<b>Roadblocks</b> leave one gap: get in that lane early. Spikes take a hit. Grab the cash bags and nitro cans.',
  '<b>On foot:</b> swipe round crates, up over fences, down under pipes. <b>At a corner, swipe the way the arrow points.</b> Stumble and the cops gain.',
  'Reach the safehouse. The cash buys upgrades in the garage, and they stay with you.',
];
const WEATHERS = ['night', 'rain', 'dusk', 'storm', 'night', 'overcast', 'mist', 'night', 'golden'];
function weatherOf(N) { if (N <= 2) return ['dusk', 'night'][N - 1]; const R = rng(N * 6011 + 7); R(); return WEATHERS[(R() * WEATHERS.length) | 0]; }
const LANES = [-5.25, -1.75, 1.75, 5.25], HALF = 7, ALLEY = [-1.3, 0, 1.3];
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
    traffic: x(0.022, 0.03, 30) * (1 - 0.1 * e),
    cops: N <= 1 ? 1 : Math.min(3, 1 + Math.round(x(0, 2, 25))), ram: x(1.4, 0.9, 30) * slow, rest: x(6, 3.5, 30),   // cop speed (share of yours), how many, ram warning (s)
    blocks: N <= 2 ? 0 : x(1 / 700, 1 / 340, 30), blockSee: x(160, 125, 30) + 25 * upLv('scanner'), spikes: N < 4 ? 0 : x(1 / 1100, 1 / 450, 30),
    heli: N < 6 ? 0 : x(0.2, 1, 30), cash: 1 / 70, cans: 1 / 380,
    foot: x(240, 420, 30), run: 8.8 * (1 + 0.03 * upLv('feet')), copRun: x(8.5, 8.75, 30), footGap: x(9.5, 9, 30) * (help ? 1.3 : 1), obst: x(0.05, 0.11, 30) * (1 - 0.3 * e), turnGap: Math.round(x(9, 6, 30)) };      // turnGap: 6 m modules of alley between corners
}
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null,
    weather: weatherOf(N), ph: 'drive', ph_t: 0, hp: cfg.hp, nitro: cfg.nitro, boost: 0, heat: 1, heatX: 0, cash: 0, bags: 0, hits: 0, stumbles: 0, combo: 0, bestCombo: 0,
    me: { x: LANES[1], lane: 1, s: 0, v: 22, imm: 0 }, cops: [], traffic: [], things: [], blocks: [], heli: null, foot: null, nextCop: 2, passed: 0 };
  makeRoad(G);
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G);
  return G;
}
// the avenue's set pieces: cash bags, nitro cans, spike strips and roadblocks, laid out ahead of time
function makeRoad(G) {
  const c = G.cfg, R = G.rnd, L = lessonNow(G), len = L ? (L.len || 700) : c.drive; G.things = []; G.blocks = [];
  for (let s = 80; s < len; s += 1 / c.cash * (0.5 + R())) { const lane = (R() * 4) | 0; for (let k = 0; k < 3 + ((R() * 3) | 0); k++) G.things.push({ k: 'cash', lane, s: s + k * 7 }); }
  for (let s = 200; s < len; s += 1 / c.cans * (0.6 + R() * 0.8)) G.things.push({ k: 'can', lane: (R() * 4) | 0, s });
  if (!L || L.spikes) for (let s = 300; c.spikes && s < len - 80; s += 1 / c.spikes * (0.6 + R() * 0.8)) G.things.push({ k: 'spike', lane: (R() * 4) | 0, s });
  if (!L || L.blocks) for (let s = 380; (c.blocks || (L && L.blocks)) && s < len - 120; s += 1 / (c.blocks || 1 / 260) * (0.7 + R() * 0.6)) G.blocks.push({ s, gap: (R() * 4) | 0, seen: false });
  G.len = len;
}
// ---------- the thumb ----------
function swipe(G, dir) {      // 'l' 'r' 'u' 'd'
  if (G.over) return;
  if (G.ph === 'drive') { const me = G.me; if (dir === 'l') me.lane = Math.max(0, me.lane - 1); else if (dir === 'r') me.lane = Math.min(3, me.lane + 1); else if (dir === 'u') return nitro(G); G.ev.push({ k: 'lane' }); return; }
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
  const c = G.cfg, me = G.me, R = G.rnd, L = lessonNow(G);
  G.boost = Math.max(0, G.boost - dt); me.imm = Math.max(0, me.imm - dt);
  const vmax = c.vmax * (G.boost > 0 ? c.boostV : 1) * (L ? 0.85 : 1); me.v += (me.v < vmax ? 9 : -6) * dt; me.v = clamp(me.v, 8, vmax * 1.02);
  me.x += clamp(LANES[me.lane] - me.x, -14 * dt, 14 * dt); me.s += me.v * dt;
  // heat: rises with the job, and when the helicopter's light is on you; it sets how many cops come
  G.heatX += dt * (0.012 + c.f * 0.0006); G.heat = clamp(1 + Math.floor(G.heatX), 1, 5);
  // traffic, as in the city: slower cars in the lanes
  while (G.traffic.length < 50) { const last = G.traffic.length ? Math.max(...G.traffic.map(t => t.s0)) : me.s + 70; const s = last + 1 / (c.traffic * (L && !L.traffic ? 0.25 : 1)) * (0.5 + R()); if (!G.blocks.some(b => s > b.s - 120 && s < b.s + 30)) G.traffic.push({ x: LANES[(R() * 4) | 0], s, s0: s, v: 11 + R() * 7, col: (R() * 6) | 0, hit: 0 }); else G.traffic.push({ x: 99, s, s0: s, v: 0, ghost: true, hit: 0 }); }      // the police have closed the road before a roadblock
  for (const t of G.traffic) { t.s += t.v * dt; if (t.hit > 0) { t.hit -= dt; t.x += t.hx * dt; } }
  for (const t of G.traffic) if (!t.passed && t.s < me.s - 3) { t.passed = true; if (!t.hit) { G.passed++; G.combo++; G.bestCombo = Math.max(G.bestCombo, G.combo); if (G.combo % 5 === 0) G.ev.push({ k: 'weave', n: G.combo }); } }
  G.traffic = G.traffic.filter(t => t.s > me.s - 40);
  for (const t of G.traffic) if (Math.abs(t.x - me.x) < 1.9 && t.s - me.s < 4.4 && t.s - me.s > -1.5 && me.imm <= 0) { t.hit = 0.6; t.hx = Math.sign(t.x - me.x || 1) * 4; hit(G, 'car'); }
  // the cops: they come up from behind; near you, one moves alongside, flashes, and rams the lane it is aiming at
  G.nextCop -= dt; const want = Math.min(c.cops, L ? (L.cops || 0) : Math.ceil(G.heat * c.cops / 4));
  if (G.cops.length < want && G.nextCop <= 0) { G.cops.push({ x: LANES[(R() * 4) | 0], lane: 1, s: me.s - 70 - R() * 30, ram: 0, aim: -1, cool: 2 + R() * 2 }); G.nextCop = 4 + R() * 4; G.ev.push({ k: 'siren' }); }
  for (const cp of G.cops) {
    const gap = me.s - cp.s, cv = me.v + (gap > 8 ? 6 + gap * 0.05 : 0);      // they close in, then sit on your tail
    cp.cool = Math.max(0, cp.cool - dt);
    if (cp.ram > 0) { cp.ram -= dt; cp.s += (me.v + 1) * dt; if (cp.ram <= 0) { cp.x = LANES[cp.aim]; G.ev.push({ k: 'ram', lane: cp.aim });
        if (Math.abs(LANES[cp.aim] - me.x) < 1.6 && me.imm <= 0) hit(G, 'ram'); else { G.ev.push({ k: 'dodged' }); lessonSee(G, 'dodge'); G.combo++; }
        cp.s -= 18; cp.cool = c.rest * (0.8 + R() * 0.5); cp.aim = -1; } }
    else { cp.s += (gap > 9 ? cv : me.v) * dt; const tl = gap < 14 ? (cp.lane = me.lane === 0 ? 1 : me.lane === 3 ? 2 : me.lane + (R() < 0.5 ? -1 : 1), cp.lane) : cp.lane; cp.x += clamp(LANES[tl] - cp.x, -6 * dt, 6 * dt);
      if (gap < 10 && cp.cool <= 0 && !G.blocks.some(b => !b.done && b.s - me.s < 90)) { cp.aim = me.lane;      // never into a roadblock's gap: that would be no way out
 cp.ram = c.ram * (1 + 0.15 * c.scan) * (L ? 1.4 : 1); G.ev.push({ k: 'flash', lane: me.lane }); } }
    if (G.boost > 0 && gap < 60) cp.s -= 6 * dt;
  }
  G.cops = G.cops.filter(cp => me.s - cp.s < 160);
  // the helicopter: from heat 3 (on later jobs), a spotlight sweeping the lanes; caught in it, the heat climbs
  if (c.heli && G.heat >= 3 && !G.heli) { G.heli = { x: 0, t: 0 }; G.ev.push({ k: 'heli' }); }
  if (G.heli) { const h = G.heli; h.t += dt; h.x = Math.sin(h.t * (0.5 + c.heli * 0.5)) * 5.2; if (Math.abs(h.x - me.x) < 1.6) { G.heatX += dt * 0.35 * c.heli; if (!h.on) { h.on = true; G.ev.push({ k: 'spotted' }); } } else h.on = false; }
  // things in the lanes
  for (const th of G.things) if (!th.done && Math.abs(th.s - me.s) < 2.2) { const near = Math.abs(LANES[th.lane] - me.x) < 1.4 || (c.magnet && th.k === 'cash' && Math.abs(LANES[th.lane] - me.x) < 5); if (!near) continue; th.done = true;
    if (th.k === 'cash') { const v = 10 * G.heat; G.cash += v; G.bags++; G.ev.push({ k: 'cash', v, lane: th.lane }); lessonSee(G, 'cash', th.lane); }
    else if (th.k === 'can') { G.nitro = Math.min(G.nitro + 1, 6); G.ev.push({ k: 'can' }); }
    else if (th.k === 'spike' && me.imm <= 0) hit(G, 'spike'); }
  for (const b of G.blocks) { if (!b.seen && b.s - me.s < c.blockSee) { b.seen = true; G.ev.push({ k: 'block', gap: b.gap }); }
    if (!b.done && b.s <= me.s) { b.done = true; if (Math.abs(LANES[b.gap] - me.x) > 1.3) { if (me.imm <= 0) hit(G, 'block'); } else { G.ev.push({ k: 'through' }); lessonSee(G, 'through'); G.combo += 3; G.cash += 25 * G.heat; } } }
  if (G.over) return;
  if (me.s >= G.len) { if (L) { lessonSee(G, 'drop'); if (G.lesson) { G.me.s = 0; makeRoad(G); G.traffic.length = 0; G.cops.length = 0; } } else { G.ph = 'ditch'; G.ph_t = 0; G.ev.push({ k: 'ditch' }); } }
}
function hit(G, what) {
  const me = G.me; me.v *= what === 'spike' ? 0.7 : 0.45; me.imm = 1.3; G.hits++; (G.hitLog = G.hitLog || []).push(what); G.combo = 0; G.heatX += 0.3; G.ev.push({ k: 'hit', what, hp: G.hp - 1 });
  for (const cp of G.cops) cp.s = Math.max(cp.s, me.s - 20);
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
  1: [{ id: 'lanes', title: 'SWIPE TO CHANGE LANE', how: 'Swipe left or right to change lane. Grab five bags of cash in a row, from three different lanes, without hitting a car.', need: 5, ok: w => w === 'cash', len: 99999, traffic: true, strict: true, lanes: 3 },
      { id: 'nitro', title: 'TAP FOR NITRO', how: 'Tap anywhere for a burst of nitro: it leaves the cops behind. Try it.', need: 1, ok: w => w === 'nitro' }],
  2: [{ id: 'dodge', title: 'THE RAM', how: 'A police car pulls alongside and FLASHES: swipe AWAY from it before it rams. Dodge two.', need: 2, ok: w => w === 'dodge', cops: 1, len: 99999 }],
  3: [{ id: 'block', title: 'ROADBLOCKS', how: 'A roadblock leaves ONE gap: the arrow shows it. Get in that lane early. Two of them.', need: 2, ok: w => w === 'through', blocks: true, len: 99999 },
      { id: 'corner', title: 'CORNERS', how: 'When the alley turns, swipe LEFT or RIGHT: the way the yellow arrow points. Take two corners.', need: 2, ok: w => w === 'corner', foot: true },
      { id: 'run', title: 'ON FOOT', how: 'Swipe left and right round crates, UP over fences, DOWN under pipes. Clear six.', need: 6, ok: w => w === 'cleared', foot: true }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0, miss: 0 }; lessonSet(G); G.ev.push({ k: 'lessonnext', first: true }); }
function lessonSet(G) { const st = lessonNow(G); if (!st) return; if (st.foot) startFoot(G); else { G.ph = 'drive'; G.me.s = 0; G.cops.length = 0; G.traffic.length = 0; makeRoad(G); } }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonSee(G, what, lane) {
  const D = G.lesson; if (!D) return; const st = D.steps[D.i]; if (!st.ok(what)) return;
  if (st.lanes) { D.lanes = D.lanes || new Set(); if (D.n === 0) D.lanes.clear(); D.lanes.add(lane); if (D.n + 1 >= st.need && D.lanes.size < st.lanes) { G.ev.push({ k: 'lessonok', n: D.n, need: st.need, more: true }); return; } }
  D.n++; if (D.n < st.need) { G.ev.push({ k: 'lessonok', n: D.n, need: st.need }); return; }
  D.i++; D.n = 0; D.miss = 0;
  if (D.i >= D.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); Object.assign(G, { ph: 'drive', ph_t: 0, hp: G.cfg.hp, nitro: G.cfg.nitro, boost: 0, heat: 1, heatX: 0, cash: 0, bags: 0, hits: 0, stumbles: 0, combo: 0, bestCombo: 0, heli: null, nextCop: 3 }); Object.assign(G.me, { s: 0, v: 22, lane: 1, x: LANES[1], imm: 0 }); G.cops.length = 0; G.traffic.length = 0; makeRoad(G); }
  else { G.ev.push({ k: 'lessonnext' }); lessonSet(G); }
}
function lessonMiss(G, why) { const D = G.lesson; if (!D) return; D.miss++; if (D.steps[D.i].strict) D.n = 0; G.ev.push({ k: 'lessonmiss', why, how: D.steps[D.i].how }); }

// ---------- for the robots ----------
// BLIND: swipes and taps without looking
const BLIND = { l: G => swipe(G, 'l'), r: G => swipe(G, 'r'), u: G => swipe(G, 'u'), d: G => swipe(G, 'd'), t: G => tap(G) };
// a driver who looks: keeps to a lane with no car close ahead, takes the roadblock's gap early, slips away from a flashing cop,
// goes for cash when it is safe, uses nitro when a cop is close; on foot, reads the next obstacle
function honest(G, o, mem) {
  const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, c = G.cfg;
  if (G.t < (mem.next || 0)) return; mem.next = G.t + 0.06 + react * 0.35;
  const slip = () => Math.random() < (1 - acc) * (G.ph === 'drive' ? 0.25 : 1);      // a slip is per decision; the driver decides several times a second
  if (G.ph === 'drive') { const me = G.me, look = me.v * (1.3 + react);
    const danger = l => { let d = 0; for (const t of G.traffic) if (Math.abs(t.x - LANES[l]) < 1.5 && t.s - me.s > -2 && t.s - me.s < look + 6) d += 3 - (t.s - me.s) / (look + 6); for (const th of G.things) if (!th.done && th.k === 'spike' && th.lane === l && th.s - me.s > 0 && th.s - me.s < look + 8) d += 2.5;
      for (const b of G.blocks) if (!b.done && b.seen && b.gap !== l && b.s - me.s < c.blockSee) d += 6; for (const cp of G.cops) if (cp.ram > 0 && cp.aim === l) d += 5; return d; };
    const goody = l => G.things.filter(th => !th.done && th.k !== 'spike' && th.lane === l && th.s - me.s > 5 && th.s - me.s < 60).length * 0.3;
    const score = l => -danger(l) + goody(l) - Math.abs(l - me.lane) * 0.3;
    // aim for the best lane anywhere, then move one lane at a time towards it (not through a car right beside you)
    const side = l => G.traffic.some(t => Math.abs(t.x - LANES[l]) < 1.5 && Math.abs(t.s - me.s) < 6);
    let target = me.lane; for (let l = 0; l < 4; l++) if (score(l) > score(target) + 0.2) target = l;
    let best = target === me.lane ? me.lane : me.lane + Math.sign(target - me.lane); if (best !== me.lane && (side(best) || G.cops.some(cp => cp.ram > 0 && cp.aim === best))) best = me.lane;
    if (G.cops.some(cp => cp.ram > 0 && cp.aim === me.lane)) { const away = [me.lane - 1, me.lane + 1].filter(l => l >= 0 && l < 4 && !side(l)); if (away.length) best = away.sort((a, b2) => score(b2) - score(a))[0]; }
    if (slip()) best = clamp(me.lane + (Math.random() < 0.5 ? -1 : 1), 0, 3);
    if (best !== me.lane) swipe(G, best < me.lane ? 'l' : 'r');
    const Lh = lessonNow(G); if (G.nitro > 0 && (Lh && Lh.id === 'nitro' || !(Lh && Lh.id === 'dodge') && G.cops.some(cp => me.s - cp.s < 25) && Math.random() < 0.3)) nitro(G);
    return; }
  if (G.ph === 'foot') { const F = G.foot, o2 = F.obs.find(q => !q.done && q.s > F.s), d = o2 ? o2.s - F.s : 99, nt = F.turns.find(q => !q.past);
    if (nt && nt.got === null && nt.s - F.s <= FOOT_WIN - 1 - react * 8) { const way = Math.random() < acc + (1 - acc) * 0.5 ? nt.dir : -nt.dir; swipe(G, way > 0 ? 'r' : 'l'); }      // reads the arrow a reaction late; now and then goes wrong
    if (!o2 || d > 9 * (0.6 + react)) return;
    if (o2.type === 'fence') { if (d < 4.5 && !slip()) swipe(G, 'u'); }
    else if (o2.type === 'pipe') { if (d < 4.5 && !slip()) swipe(G, 'd'); }
    else { const lane = Math.round((F.x + 1.3) / 1.3); if (lane === o2.lane || lane === o2.two) { const free = [0, 1, 2].filter(l => l !== o2.lane && l !== o2.two).sort((a, b) => Math.abs(a - lane) - Math.abs(b - lane))[0]; if (!slip()) swipe(G, free < lane ? 'l' : 'r'); } } }
}
function winNow(G) { if (!G || G.over || G.ph === 'home') return; G.lesson = null; G.ph = 'home'; G.ph_t = 0; G.cash = Math.max(G.cash, 50); }
