
// ===================== THE RULES: Sprint =====================
// Two thumbs are two feet. Each tap is a stride; the next foot is due when the last one lands (the quicker you run, the
// sooner). Tap on the beat for a PERFECT push; a little off is weaker; too soon or the same thumb twice and you trip.
// Wait for the gun (a tap on SET is a false start; two and you are out). Both thumbs together: jump a hurdle, or dip at the line.
const RULES = [
  '<b>Left, right, left, right.</b> Each thumb is a foot. Tap the side whose ring is closing, as it closes.',
  '<b>Rhythm, not mashing.</b> On the beat is PERFECT and drives you on. Too soon, or the same thumb twice, and you <b>trip</b>.',
  '<b>Wait for the gun.</b> Keep still on SET and go on BANG. Tap early and it is a <b>false start</b>: two and you are out.',
  '<b>Both thumbs together</b> to jump a hurdle (when it reaches the green mark), or to <b>dip</b> at the line.',
  '<b>FLOW:</b> perfect after perfect makes you faster. Finish in the places shown to go on. Beat your best time: your ghost runs with you.',
];
const LW = 1.22, R0 = 36.8, LS = 84.39, LANES = 8, YOU_LANE = 3, BOTH = 0.085, EARLY = 0.13, DRAG = 0.12, FLOAT = 3.2;
const EVENTS = {
  '60': { id: '60', name: '60 m', D: 60 },
  '100': { id: '100', name: '100 m', D: 100 },
  '60H': { id: '60H', name: '60 m hurdles', D: 60, H: [13, 21.5, 30, 38.5, 47] },
  '110H': { id: '110H', name: '110 m hurdles', D: 110, H: Array.from({ length: 10 }, (_, i) => 13.72 + 9.14 * i) },
  '200': { id: '200', name: '200 m', D: 200 },
};
const eventOf = N => N <= 2 ? '60' : N === 3 ? '60H' : N <= 5 ? '100' : ['60', '100', '110H', '200', '100'][(N - 6) % 5];
const roundOf = N => N % 5 === 0 ? 'FINAL' : N % 5 >= 3 ? 'SEMI-FINAL' : 'HEAT';
const PLACES = [{ name: 'School Track', sky: 'morning', crowd: 0.35 }, { name: 'City Stadium', sky: 'noon', crowd: 0.6 }, { name: 'Night Lights', sky: 'night', crowd: 0.8 },
  { name: 'Rain Meet', sky: 'rain', crowd: 0.55 }, { name: 'Golden Games', sky: 'golden', crowd: 0.9 }, { name: 'World Final', sky: 'sunset', crowd: 1 }];
const placeOf = N => Math.floor((N - 1) / 5) % PLACES.length;
const NAMES = ['KOFI', 'MARA', 'JETT', 'RIO', 'ZANE', 'AYO', 'LENA', 'TOMAS', 'KAI', 'NOOR', 'IKE', 'SAMI', 'DARA', 'LUCA', 'EMEKA', 'YUKI'];
const KITS = [0xe8463c, 0x2f7de0, 0x2fb060, 0xf2c230, 0x8a4fd0, 0xf07a2a, 0x22b8c8, 0xe85aa0, 0x606a78, 0xffffff];
const SKINS = [{ id: 'blue', name: 'Blue', col: 0x30a0ff, stars: 0 }, { id: 'red', name: 'Red', col: 0xff4040, stars: 5 }, { id: 'lime', name: 'Lime', col: 0x9aff3a, stars: 12 },
  { id: 'purple', name: 'Purple', col: 0xa060ff, stars: 20 }, { id: 'orange', name: 'Orange', col: 0xff8a20, stars: 30 }, { id: 'black', name: 'Black', col: 0x22262e, stars: 42 },
  { id: 'pink', name: 'Pink', col: 0xff6ac8, stars: 56 }, { id: 'gold', name: 'Gold', col: 0xffc830, stars: 75 }];
const UPGRADES = [
  { id: 'spikes', name: 'Spikes', max: 4, cost: l => [30, 70, 140, 250][l], desc: 'A higher top speed.' },
  { id: 'blocks', name: 'Blocks', max: 3, cost: l => [25, 60, 120][l], desc: 'Harder drive in the first strides.' },
  { id: 'rhythm', name: 'Rhythm', max: 3, cost: l => [40, 90, 170][l], desc: 'A wider PERFECT beat.' },
  { id: 'spring', name: 'Spring', max: 3, cost: l => [35, 80, 150][l], desc: 'A longer, higher jump.' },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Rookie'], [60, 'Club runner'], [200, 'County champ'], [500, 'National star'], [1100, 'World class'], [2500, 'Legend']];
const PLACE_TXT = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
function makeCfg(N, help) { const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), boss = N % 5 === 0, ev = eventOf(N);
  return { ev, E: EVENTS[ev], boss, round: roundOf(N), rivals: 7, need: N <= 12 ? 3 : 2, help: !!help,
    rv: x(8.7, 11.6, 30) * (1 - 0.15 * easyOf(N)) * (boss ? 1.015 : 1) * (help ? 0.955 : 1), spread: 0.08,
    vcap: 10.9 * (1 + 0.02 * upLv('spikes')), perfW: 0.05 + 0.01 * upLv('rhythm'), blocks: upLv('blocks'), spring: upLv('spring'), setT: [1.3, 2.6] }; }
const T_OF = v => 1 / (2.0 + 0.24 * v);      // the time from one foot landing to the next, at speed v (m/s)
const other = s => s === 'L' ? 'R' : 'L';
const fade = (G, s) => G.cfg.E.D >= 200 ? 1 - 0.05 * clamp((s - 140) / 60, 0, 1) : 1;      // legs tire in the last 60 m of a 200
const JT = G => 0.48 + 0.035 * G.cfg.spring;
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, wait: 0, next: null, mini: !!o.mini };
  setup(G); if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else G.ev.push({ k: 'start' });
  return G; }
function runner(lane, o = {}) { return Object.assign({ lane, s: 0, v: 0, fin: null, ph: Math.random(), air: 0 }, o); }
function setup(G, o = {}) { const c = G.cfg, R = G.rnd; G.t = 0; G.fs = 0; G.gunT = null; G.endIn = 0; G.coins = 0; G.yard = o.yard || null; G.knock = {}; G.shift = 0;
  G.D = c.E.D; G.H = (c.E.H || []).slice(); G.trace = [];
  G.you = runner(YOU_LANE, { you: true, due: null, side: null, last: null, stag: 0, airL: 0, s0: 0, low: false, dip: 0, flow: 0, perfects: 0, strides: 0, stumbles: 0, clips: 0, react: null, started: false, top: 0, hi: 0, run: 0, bestFlow: 0 });
  G.rivals = [];
  if (!G.yard) { const names = NAMES.slice().sort(() => R() - 0.5), lanes = [0, 1, 2, 4, 5, 6, 7], kits = KITS.slice().sort(() => R() - 0.5);
    const sk = lanes.map((_, i) => 1 - c.spread * (i / 6) * (0.7 + 0.6 * R())).sort(() => R() - 0.5);
    lanes.forEach((ln, i) => G.rivals.push(runner(ln, { name: names[i], col: kits[i], vt: c.rv * sk[i], tau: 1.05 + 0.4 * R(), react: 0.13 + 0.12 * R(), clipP: 0.04 + 0.12 * R(), hi: 0 }))); }
  else if (G.yard === 'hurdle') { G.D = 1e9; G.H = Array.from({ length: 6 }, (_, i) => 20 + 15 * i); }
  else if (G.yard === 'stride') G.D = 1e9;
  else if (G.yard === 'gun') G.D = 1e9;
  G.all = [G.you].concat(G.rivals);
  // the start: on your marks, set, BANG (a feed start skips "on your marks": he is in the blocks, the gun comes soon)
  if (G.yard === 'stride' || G.yard === 'hurdle') { G.phase = 'run'; G.gunT = 0; G.ph = 0; }
  else { G.phase = 'marks'; G.ph = G.mini ? 0.25 : 1.1; } }
function setTime(G) { const [a, b] = G.cfg.setT; return a + (b - a) * G.rnd(); }
// ---------- your thumbs ----------
function tap(G, side) { if (G.over || G.wait > 0 || !G.you) return; const y = G.you, t = G.t;
  if (G.phase === 'marks') return;      // nothing counts until SET
  if (G.phase === 'set') { falseStart(G, 'set'); return; }
  if (G.phase !== 'run' || y.fin != null) return;
  const L = y.last; y.last = { side, t };
  if (L && L.side !== side && t - L.t < BOTH && !L.both) { y.last.both = true; if (L.undo) Object.assign(y, L.undo); G.ev.push({ k: 'cancel' }); both(G); return; }      // both thumbs: jump or dip
  if (y.stag > 0 || y.air > 0 || y.dip > 0) return;
  y.last.undo = { v: y.v, due: y.due, side: y.side, flow: y.flow, stag: y.stag, perfects: y.perfects, strides: y.strides, stumbles: y.stumbles, run: y.run, started: y.started, react: y.react };
  stride(G, side, t); }
const vcapNow = (G, y) => G.cfg.vcap * (1 + 0.012 * y.flow) * fade(G, y.s) * (G.H.length ? 0.97 : 1);
function stride(G, side, t) { const y = G.you, c = G.cfg;
  if (!y.started) {      // off the blocks: the reaction to the gun sets the first push
    const r = t - G.gunT;
    if (!G.yard && r < 0.1) { falseStart(G, 'quick', r); return; }      // under a tenth: nobody hears a gun that fast
    const g = G.yard === 'stride' || G.yard === 'hurdle' ? 0.22 : r < 0.15 ? 0.34 : r < 0.25 ? 0.27 : r < 0.4 ? 0.2 : 0.14;
    y.started = true; y.react = G.yard ? null : r; y.v += (vcapNow(G, y) - y.v) * g * (1 + 0.12 * c.blocks); y.side = other(side); y.due = t + T_OF(y.v); y.strides = 1;
    G.ev.push({ k: 'go', r: y.react, side, q: G.yard ? 'good' : r < 0.15 ? 'perfect' : r < 0.25 ? 'good' : 'late' }); if (G.yard === 'gun') lessonSee(G, 'start', r); return; }
  if (y.side && side !== y.side) { stumble(G, 'foot'); return; }      // the same thumb twice: the wrong foot
  const err = t - y.due; if (err < -EARLY) { stumble(G, 'fast'); return; }
  let q, g;
  let up = false; if (Math.abs(err) <= c.perfW) { q = 'perfect'; g = 0.22; up = y.flow < 10; y.flow = Math.min(10, y.flow + 1); y.perfects++; }
  else if (err < 0) { q = 'early'; g = 0.1; y.flow = Math.max(0, y.flow - 2); }
  else if (err <= 0.12) { q = 'good'; g = 0.14; }
  else { q = 'late'; g = 0.05; y.flow = y.flow >> 1; }
  if (y.strides < 6) g *= 1 + 0.12 * c.blocks;
  y.v += (vcapNow(G, y) - y.v) * g; y.strides++; y.run++; y.side = other(side); y.due = t + T_OF(y.v); y.bestFlow = Math.max(y.bestFlow, y.flow);
  G.ev.push({ k: 'stride', q, side, err, flow: y.flow, up }); if (G.lesson) lessonSee(G, 'stride'); }
function stumble(G, why) { const y = G.you; y.v *= 0.58; y.stag = 0.42; y.flow = 0; y.stumbles++; y.run = 0; y.side = null; G.ev.push({ k: 'stumble', why }); if (G.lesson) lessonSee(G, 'stumble'); }
function falseStart(G, why, r) { G.fs++; const out = !G.yard && G.fs >= 2;
  G.ev.push({ k: 'false', why, r, out, n: G.fs });
  if (out) { finish(G, false, { dq: true }); return; }
  if (G.yard === 'gun') { lessonMiss(G, 'false'); return; }
  // everyone back to the blocks
  for (const q of G.all) { q.s = 0; q.v = 0; } const y = G.you; y.started = false; y.due = null; y.side = null; y.last = null; y.strides = 0;
  G.phase = 'marks'; G.ph = 1.4; G.gunT = null; }
function nextHurdle(G) { const y = G.you; return y.hi < G.H.length ? G.H[y.hi] : null; }
function both(G) { const y = G.you; if (!y.started || y.fin != null || y.stag > 0 || y.air > 0 || y.dip > 0) return;
  const h = nextHurdle(G), u = G.D - y.s;
  if (h != null && (h - y.s < 12 || G.H.length)) { y.air = JT(G); y.airL = y.v * y.air; y.s0 = y.s; y.low = y.v < 4.5; G.ev.push({ k: 'jump', low: y.low }); return; }
  if (u < 6) { y.dip = 0.38; G.ev.push({ k: 'dip' }); return; }
  y.v *= 0.9; y.flow = y.flow >> 1; G.ev.push({ k: 'dipearly' }); }
// ---------- the clock ----------
function step(G, dt) { if (G.over || !(dt > 0)) return;
  if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0 && G.next) { const f = G.next; G.next = null; f(); } return; }
  G.t += dt; const y = G.you;
  if (G.phase === 'marks') { G.ph -= dt; if (G.ph <= 0) { G.phase = 'set'; G.ph = setTime(G) * (G.mini && !G.fs ? 0.6 : 1); G.ev.push({ k: 'set' }); } return; }
  if (G.phase === 'set') { G.ph -= dt; if (G.ph <= 0) { G.phase = 'run'; G.gunT = G.t; G.ev.push({ k: 'gun' }); } return; }
  moveYou(G, dt); for (const r of G.rivals) moveRival(G, r, dt);
  if (!G.yard) { if (G.trace.length < 900 && (G.t - G.gunT) >= G.trace.length * 0.1) G.trace.push(+y.s.toFixed(2)); }
  else if (y.s > 100) { const sh = 80; y.s -= sh; y.s0 -= sh; G.shift += sh; if (G.yard === 'hurdle') { G.H = Array.from({ length: 6 }, (_, i) => y.s + 18 + 15 * i); y.hi = 0; G.knock = {}; } G.ev.push({ k: 'wrap' }); }
  if (G.endIn > 0) { G.endIn -= dt; if (G.endIn <= 0) finish(G, G.endWin, G.endO); return; }
  if (G.yard) return;
  const done = G.rivals.filter(r => r.fin != null).length;
  if (y.fin != null) { if (!G.endIn) { const place = 1 + G.rivals.filter(r => r.fin != null && r.fin < y.fin).length; y.place = place; G.endWin = place <= G.cfg.need; G.endO = { place }; G.endIn = 1.3; } }
  else if (done >= G.cfg.need && !G.endIn) { const place = 1 + G.rivals.filter(r => r.fin != null || r.s > y.s).length; G.endWin = false; G.endO = { place, beaten: true }; G.endIn = 0.9; }
  else if (G.t - G.gunT > 40 + G.D / 4) finish(G, false, { place: 8 }); }
function moveYou(G, dt) { const y = G.you;
  if (!y.started) return;
  if (y.fin != null) { y.v = Math.max(0, y.v - 2.5 * dt); y.s += y.v * dt; return; }
  if (y.stag > 0) { y.stag -= dt; if (y.stag <= 0) { y.stag = 0; y.due = G.t + 0.14; y.side = null; } }
  if (y.air > 0) { y.air -= dt; y.v -= y.v * 0.1 * dt; if (y.air <= 0) { y.air = 0; y.due = G.t + 0.12; y.side = null; G.ev.push({ k: 'land' }); } }
  else { y.v -= y.v * DRAG * dt; if (y.stag <= 0 && y.dip <= 0 && y.due != null && G.t > y.due + 0.08) y.v = Math.max(0, y.v - FLOAT * dt); }
  if (y.dip > 0) { y.dip -= dt; if (y.dip <= 0) { y.dip = 0; if (y.fin == null && G.D - y.s > 0.3) { y.v *= 0.92; G.ev.push({ k: 'dipearly' }); } } }
  const s0 = y.s; y.s += y.v * dt; y.top = Math.max(y.top, y.v); y.ph += dt * (2.0 + 0.24 * y.v) * 0.5;
  while (y.hi < G.H.length && G.H[y.hi] <= y.s) { const h = G.H[y.hi], fr = y.air > 0 ? (h - y.s0) / Math.max(0.1, y.airL) : -1, m = 0.15 - 0.03 * G.cfg.spring;
    if (y.air > 0 && !y.low && fr > m && fr < 1 - m) { G.ev.push({ k: 'clear', i: y.hi, fr }); if (G.lesson) lessonSee(G, 'clear'); }
    else { y.v *= 0.72; y.flow = 0; y.clips++; G.knock[y.hi] = 1; G.ev.push({ k: 'clip', i: y.hi, low: y.low, air: y.air > 0 }); if (G.lesson) lessonSee(G, 'clip'); }
    y.hi++; }
  if (y.s >= G.D && y.fin == null) { let tc = G.t - dt * (y.s - G.D) / Math.max(1e-6, y.s - s0); if (y.dip > 0) tc -= 0.04; y.fin = tc; y.dipped = y.dip > 0;
    G.ev.push({ k: 'finish', time: tc - G.gunT, dip: y.dipped }); } }
function moveRival(G, r, dt) { if (r.fin != null) { r.v = Math.max(0, r.v - 2.2 * dt); r.s += r.v * dt; r.ph += dt * (2 + 0.24 * r.v) * 0.5; return; }
  if (G.t - G.gunT < r.react) return;
  const want = r.vt * fade(G, r.s) * (G.H.length ? 0.93 : 1); r.v += (want - r.v) * Math.min(1, dt / r.tau);
  const s0 = r.s; r.s += r.v * dt; r.ph += dt * (2 + 0.24 * r.v) * 0.5;
  while (r.hi < G.H.length && G.H[r.hi] <= r.s) { if (G.rnd() < r.clipP) { r.v *= 0.84; G.ev.push({ k: 'rclip', lane: r.lane, i: r.hi }); } r.hi++; }
  if (r.s >= G.D) { r.fin = G.t - dt * (r.s - G.D) / Math.max(1e-6, r.s - s0); G.ev.push({ k: 'rfin', lane: r.lane }); } }
const placeNow = G => 1 + G.rivals.filter(r => (r.fin != null && (G.you.fin == null || r.fin < G.you.fin)) || (r.fin == null && G.you.fin == null && r.s > G.you.s)).length;
function finish(G, win, o = {}) { if (G.over) return true; G.over = win ? 'won' : 'lost'; const y = G.you, c = G.cfg, place = o.place || placeNow(G);
  const time = y.fin != null ? y.fin - G.gunT : null, clean = y.stumbles + y.clips === 0 && G.fs === 0;
  const stars = win ? 1 + (place <= 3 && clean ? 1 : 0) + (place === 1 ? 1 : 0) : 0;
  const board = G.all.map(q => ({ name: q.you ? 'YOU' : q.name, you: !!q.you, col: q.col, t: q.fin != null ? q.fin - G.gunT : (q.v > 1 && !o.dq ? G.t - G.gunT + (G.D - q.s) / q.v : null), s: q.s })).sort((a, b) => (a.t == null) - (b.t == null) || (a.t != null ? a.t - b.t : b.s - a.s));
  G.res = { win, stars, place, time, dq: !!o.dq, beaten: !!o.beaten, need: c.need, ev: c.E.id, evName: c.E.name, round: c.round, react: y.react, fs: G.fs, perfPct: y.strides > 1 ? Math.round(100 * y.perfects / (y.strides - 1)) : 0,
    top: Math.round(y.top * 3.6), stumbles: y.stumbles, clips: y.clips, flow: y.bestFlow, dip: !!y.dipped, board, trace: G.trace.slice(),
    coins: (o.dq ? 1 : [0, 25, 18, 12, 8, 6, 5, 4, 3][place] || 3) + Math.floor(y.perfects / 5) + (win ? Math.ceil(G.N / 2) + stars * 2 : 0) };
  G.ev.push({ k: win ? 'won' : 'lost' }); return true; }
// ---------- the robot: a player who looks (and listens) ----------
const gauss = () => { let u = 0; for (let i = 0; i < 4; i++) u += Math.random(); return (u - 2) * 1.732; };
function honest(G, o, mem) { if (G.over || G.wait > 0 || !G.you) return; const y = G.you, acc = o.acc == null ? 0.85 : o.acc, react = o.react == null ? 0.3 : o.react, sd = 0.012 + (1 - acc) * 0.25;
  if (G.phase !== 'run' || y.fin != null) { mem.go = null; mem.at = null; return; }
  if (!y.started) { if (mem.go == null) mem.go = G.gunT + Math.max(0.11, react * 0.6 + gauss() * 0.04); if (G.t >= mem.go) { mem.go = null; tap(G, 'L'); } return; }
  if (y.air > 0 || y.stag > 0 || y.dip > 0) { mem.at = null; return; }
  const h = nextHurdle(G);
  if (h != null) { if (mem.jh !== h + G.shift) { mem.jh = h + G.shift; mem.off = gauss() * (1 - acc) * 3; } const at = h - y.v * JT(G) * 0.5 + mem.off; if (y.s >= at && h - y.s < 9) { tap(G, 'L'); tap(G, 'R'); return; } }
  else if (G.D - y.s < 1.8 + gauss() * 0.2 * (1 - acc) * 4 && !mem.dipped && G.D < 1e8) { mem.dipped = true; tap(G, 'L'); tap(G, 'R'); return; }
  if (mem.for !== y.due) { mem.for = y.due; mem.at = y.due - 0.006 + gauss() * sd; }
  if (mem.at != null && G.t >= mem.at) { mem.at = null; mem.for = -1; tap(G, y.side || 'L'); } }
// blind moves (no looking): a left tap, a right tap, both together
const BLIND = { l: G => tap(G, 'L'), r: G => tap(G, 'R'), b: G => { tap(G, 'L'); tap(G, 'R'); } };
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.wait = 0; const y = G.you; if (G.phase !== 'run') { G.phase = 'run'; G.gunT = G.t; }
  y.started = true; y.fin = G.t; y.s = G.D; y.react = y.react || 0.18; y.place = 1; finish(G, true, { place: 1 }); }
// ---------- LESSONS: the first three levels ----------
const LESSONS = {
  1: [{ id: 'stride', title: 'LEFT, RIGHT, IN TIME', say: 'TAP THE CLOSING RING', do: 'tap', how: 'Tap the side whose ring is closing, just as it closes. Left, right, left... Too soon, or the same side twice, and you trip. Run 10 strides without tripping!', need: 10 }],
  2: [{ id: 'gun', title: 'WAIT FOR THE GUN', say: 'WAIT FOR BANG!', do: 'wait', at: G => [W / 2, H * 0.7], how: 'On SET keep still. Tap the moment you hear BANG! Tap before it and it is a false start. Make 2 clean starts.', need: 2 }],
  3: [{ id: 'hurdle', title: 'BOTH THUMBS: JUMP', say: 'TAP BOTH!', do: 'tap', how: 'Keep striding. When a hurdle reaches the GREEN mark, tap BOTH sides together to jump it. Clear 3 in a row!', need: 3 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonDeal(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonDeal(G) { const st = lessonNow(G); G.rnd = rng(G.seed + (G.deals = (G.deals | 0) + 1)); G.lesson.n = 0; setup(G, { yard: st.id }); G.ev.push({ k: 'yard' }); }
function lessonMiss(G, why) { const keep = G.lesson.n; G.ev.push({ k: 'lessonmiss', how: why === 'false' ? 'FALSE START! You tapped before BANG. Keep still on SET, then go.' : lessonNow(G).how }); G.wait = 1.4; G.next = () => { lessonDeal(G); if (why === 'false') G.lesson.n = keep; }; }
function lessonSee(G, what, r) { const st = lessonNow(G); if (!st || G.wait > 0) return;
  if (st.id === 'stride') { if (what === 'stride') { G.lesson.n++; G.ev.push({ k: 'lessonok', n: G.lesson.n, need: st.need }); } if (what === 'stumble' && G.lesson.n) { G.lesson.n = 0; G.ev.push({ k: 'lessonreset', how: 'Tripped! Wait for the ring to close. Again: 10 in a row.' }); } }
  if (st.id === 'gun' && what === 'start') { G.lesson.n++; G.ev.push({ k: 'lessonok', n: G.lesson.n, need: st.need, r });
    if (G.lesson.n < st.need) { G.wait = 1.6; G.next = () => { const n = G.lesson.n; setup(G, { yard: 'gun' }); G.lesson.n = n; G.ev.push({ k: 'yard' }); }; return; } }
  if (st.id === 'hurdle') { if (what === 'clear') { G.lesson.n++; G.ev.push({ k: 'lessonok', n: G.lesson.n, need: st.need }); } if (what === 'clip' && G.lesson.n) { G.lesson.n = 0; G.ev.push({ k: 'lessonreset', how: 'Knocked it! Jump when the hurdle reaches the green mark. 3 in a row.' }); } }
  if (G.lesson.n < st.need) return;
  G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.wait = 1.4; G.next = () => { G.rnd = rng(G.seed); setup(G); G.ev.push({ k: 'start' }); G.ev.push({ k: 'yard' }); }; }
