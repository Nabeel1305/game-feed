// ===================== RULES: Ramp Riders (game 49, my idea for set 8: two thumbs, fast, a sport) =====================
// A trials bike on a side-on track of hills, kickers, gaps and drops. The bike drives itself; your two thumbs lean it: hold
// the left side to lean BACK, the right side to lean FORWARD (both together: brake). On the ground leaning forward pumps
// speed out of downhills and leaning back slows you. Off a kicker you fly, and in the air a lean turns the bike: you must
// bring it round to the slope you will land on. Land it close and you ride on; land it badly and you crash and start again
// from the last flag, the clock running. Turn a whole flip and land it: a boost. Beat the time to win; beat it by more for
// stars. Your best run rides beside you as a ghost.
const RULES = [
  'The bike drives itself. <b>LEAN BACK</b> and <b>LEAN FWD</b> tip it a little. Both together: brake.',
  'Off a ramp you fly. In the air hold <b>BACK FLIP</b> or <b>FRONT FLIP</b> to spin, and lean to line it up with the <b>slope you will land on</b>. Land it straight or crash.',
  'A crash sends you back to the last <b>flag</b>, and the clock keeps running.',
  'Turn a whole <b>flip</b> and land it: a <b>boost</b>. A perfect landing: a little more.',
  'Reach the finish inside the <b>time</b>. Your best run rides with you as a <b>ghost</b>.',
];
const GRAV = 22, DX = 0.5;
const PLACES = [{ name: 'Dust Bowl', sky: ['#f6b25a', '#f8d89a'], ground: '#c8783a', top: '#e8a05a', hills: '#d8905a' }, { name: 'Pine Ridge', sky: ['#5aa0d8', '#c8e8f8'], ground: '#4a6a2a', top: '#7aa83a', hills: '#3a5a4a' },
  { name: 'Frost Peak', sky: ['#8ab0d8', '#e8f0f8'], ground: '#b8c8d8', top: '#f4f8fc', hills: '#9ab0c8' }, { name: 'Neon Docks', sky: ['#1a1040', '#5a2a6a'], ground: '#2a2a3a', top: '#ff4ab0', hills: '#3a2a5a' }];
const placeOf = N => Math.min(3, Math.floor((N - 1) / 5) % 4);
const UPGRADES = [
  { id: 'engine', name: 'Engine', desc: 'Top speed up 6%.', max: 3, cost: l => 30 + l * 40 },
  { id: 'shocks', name: 'Shocks', desc: 'Landings forgive a little more.', max: 2, cost: l => 45 + l * 50 },
  { id: 'nitro', name: 'Nitro tank', desc: 'Flip boosts last longer.', max: 2, cost: l => 40 + l * 45 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Rookie'], [40, 'Rider'], [130, 'Stuntman'], [320, 'Pro'], [700, 'Daredevil'], [1500, 'Legend']];
function makeCfg(N, help) { const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), e = easyOf(N);
  return { N, f, help: !!help, place: placeOf(N), len: Math.round(x(300, 700, 30)), kick: x(0.68, 0.8, 25), big: x(0.2, 1, 30), slack: x(0.06, 0.0, 30) * (1 + 0.5 * e) + (help ? 0.15 : 0),
    tol: 0.42 + 0.05 * upLv('shocks') + 0.12 * e + (help ? 0.1 : 0),      /* 25 Nov 2026: 0.16 before; with a gentle LEAN a landing is easier to find, by luck too, so the first levels forgive a little less */ top: 15 * (1 + 0.06 * upLv('engine')), nitro: 1.2 * (1 + 0.3 * upLv('nitro')), par: 0 }; }
// ---------- the track: a height for every half metre, built from pieces ----------
function buildTrack(G) { const c = G.cfg, R = G.rnd, hs = [], marks = [], flags = [], pits = []; let y = 0, x = 0; const push = yy => { hs.push(yy); x += DX; };
  const flat = m => { for (let i = 0; i < m / DX; i++) push(y); };
  const hill = (m, h) => { const y0 = y, n = m / DX; for (let i = 1; i <= n; i++) push(y0 + h * (1 - Math.cos(TAU * i / n)) / 2); y = y0; };
  const slope = (m, dh) => { const y0 = y, n = m / DX; for (let i = 1; i <= n; i++) push(y0 + dh * (1 - Math.cos(Math.PI * i / n)) / 2); y = y0 + dh; };
  // a kicker: a curved lip up to h, then a gap (a pit), then a landing slope down to the ground beyond
  const kicker = (h, gap, land, kind = 'down', ex = 1.8) => { const y0 = y, n = Math.round(h * 2.2 / DX); for (let i = 1; i <= n; i++) push(y0 + h * Math.pow(i / n, ex)); marks.push({ k: 'kick', x, kind });
    { const xa = x; for (let i = 0; i < gap / DX; i++) push(y0 - 3); pits.push([xa - DX, x]); } const m = land / DX;
    if (kind === 'down') { const top = y0 + h * 0.55; for (let i = 1; i <= m; i++) push(top - (top - (y0 - h * 0.4)) * (1 - Math.cos(Math.PI * i / m)) / 2); y = y0 - h * 0.4; }
    else if (kind === 'flat') { const top = y0 + h * 0.3; for (let i = 1; i <= m; i++) push(top); y = top; }
    else { const a = y0 + h * 0.15, b2 = y0 + h * 0.75; for (let i = 1; i <= m; i++) push(a + (b2 - a) * Math.sin(Math.PI / 2 * i / m)); y = b2; } };      // a step-up: you land going uphill
  flat(24); flags.push(0);
  while (x < c.len) { const r = R();
    if (r < c.kick) { const big = R() < c.big, kinds = ['down', 'flat', 'up'], kind = big ? (R() < 0.75 ? 'down' : 'flat') : kinds[(R() * 2) | 0]; kicker(big ? 3.8 + R() * 2 : 1.8 + R() * 1.2, big ? 5 + R() * 4 : (kind === 'up' ? 1.5 : 2.5) + R() * 3, big ? 22 : 14, kind, 1.8 + R() * 0.7); flat(6 + R() * 6); }
    else if (r < c.kick + 0.2) hill(18 + R() * 16, 2 + R() * 3);
    else if (r < c.kick + 0.35) { slope(10 + R() * 8, (R() < 0.5 ? -1 : 1) * (2 + R() * 4)); flat(6); }
    else flat(10 + R() * 10);
    if (x - (flags[flags.length - 1] || 0) > 110) { flat(6); flags.push(x - 4); } }
  flat(30); G.track = { hs, marks, flags, pits, end: x - 24 };
  // the time to beat: the length at a fair speed, with slack that shrinks over the levels
  c.par = Math.round(x / (c.top * 0.92) * (1 + c.slack)); }
const groundY = (G, x) => { const hs = G.track.hs, i = x / DX, i0 = Math.max(0, Math.min(hs.length - 2, Math.floor(i))), t = clamp(i - i0, 0, 1); return hs[i0] + (hs[i0 + 1] - hs[i0]) * t; };
const slopeAt = (G, x) => Math.atan2(groundY(G, x + 0.4) - groundY(G, x - 0.4), 0.8);
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(N * 1013 + 7), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, place: cfg.place, wait: 0, hold: { l: false, r: false, bl: false, br: false }, tl: 0, tr: 0, tbl: 0, tbr: 0 };
  buildTrack(G); G.rnd = rng(seed); reset(G, 0);
  G.clock = 0; G.flips = 0; G.crashes = 0; G.perfects = 0; G.trace = [];
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else G.ev.push({ k: 'start' });
  return G; }
// put the bike at a flag
function reset(G, x) { G.b = { x, y: groundY(G, x), vx: 6, vy: 0, a: slopeAt(G, x), w: 0, air: false, spin: 0, boost: 0, lastFlag: x, airT: 0 }; }
// 25 Nov 2026 (his words: "The problem is the controls flipping and just leaning back is confusing make it so you actually have to click the button
// to leaning back so the buttons for flipping will be clear"). There were two pads, each the whole half of the screen, both called LEAN: on the ground
// LEAN BACK leant him back, and in the air the very same hold span a backflip. One control, two meanings, and nothing on the screen said FLIP.
// Now there are FOUR buttons and each does one thing: LEAN BACK and LEAN FWD tip the bike a little (on the ground, and gently in the air to line up
// a landing; both together brake); BACK FLIP and FRONT FLIP spin it, in the air only (on the ground they do nothing at all).
// hold.bl / hold.br: the two LEAN buttons. hold.l / hold.r: the two FLIP buttons.
function leanNow(G) { const l = G.hold.bl || G.tbl > 0, r = G.hold.br || G.tbr > 0; return l && r ? 'brake' : l ? 1 : r ? -1 : 0; }      // +1 nose up (back), -1 nose down (forward)
function flipNow(G) { const l = G.hold.l || G.tl > 0, r = G.hold.r || G.tr > 0; return l && !r ? 1 : r && !l ? -1 : 0; }      // +1 a backflip, -1 a front flip
const LEAN_W = 3, FLIP_W = 6;      // how fast each turns the bike in the air (radians a second)
function step(G, dt) { if (G.over || !(dt > 0)) return; G.t += dt; G.tl = Math.max(0, G.tl - dt); G.tr = Math.max(0, G.tr - dt); G.tbl = Math.max(0, G.tbl - dt); G.tbr = Math.max(0, G.tbr - dt);
  if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0) { G.wait = 0; const f = G.next; G.next = null; if (f) f(); } return; }
  if (!G.lesson) G.clock += dt;
  const b = G.b, c = G.cfg, L = leanNow(G), lean = L === 'brake' ? 0 : L;
  b.boost = Math.max(0, b.boost - dt);
  if (!b.air) {
    // on the ground: the bike follows the ground; the engine pulls toward its top speed, slopes help or hinder
    if (inPit(G, b.x) && b.x > 2) return crash(G);
    const th = slopeAt(G, b.x), top = b.boost > 0 ? c.top * 1.4 : c.top; let sp = Math.hypot(b.vx, b.vy) * Math.sign(b.vx || 1);
    sp += (sp < top ? 9 : -6) * dt - GRAV * Math.sin(th) * dt * 0.55; if (L === 'brake') sp -= 14 * dt; else if (lean === 1) sp -= 3 * dt; else if (lean === -1 && th < -0.05) sp += 5 * dt;
    sp = clamp(sp, 2, top * 1.25);
    const nx = b.x + sp * Math.cos(th) * dt, gy = groundY(G, nx), vyG = (gy - b.y) / dt, vyBall = b.vy - GRAV * dt;
    // the ground falls away faster than gravity can follow (a lip, a drop): you fly
    if (vyG < vyBall - 2.5 && b.x > 2) { G.jumps = (G.jumps || 0) + 1; b.air = true; b.airT = 0; b.spin = 0; b.w = 0; b.used = 0; b.a = Math.atan2(b.vy, b.vx) + (lean === 1 ? 0.2 : 0); /* the bike leaves pointing along the lip */ G.ev.push({ k: 'air' }); b.vy -= GRAV * dt; b.x += b.vx * dt; b.y += b.vy * dt; return; }      // leave with the speed you had on the lip
    b.vx = sp * Math.cos(th); b.vy = vyG; b.x = nx; b.y = gy; b.a += (th + (lean === 1 ? 0.35 : 0) - b.a) * Math.min(1, dt * 14); b.w = 0;
  } else {
    // in the air: gravity; your lean turns the bike
    b.airT += dt; b.vy -= GRAV * dt; b.x += b.vx * dt; b.y += b.vy * dt; const fl = flipNow(G), want = fl ? fl * FLIP_W : lean * LEAN_W; b.used = (b.used | 0) | (fl ? 2 : 0) | (L === 'brake' || lean === 1 ? 4 : 0) | (lean === -1 ? 1 : 0);      /* which buttons this flight used (the first lesson is LEAN FWD, and nothing else) */ b.w += (want - b.w) * Math.min(1, dt * (fl || lean ? 9 : 6)); b.a += b.w * dt; b.spin += b.w * dt;
    const gy = groundY(G, b.x);
    // 25 Nov 2026 (his review: "The holes seem to be glitching out"): the gap after a ramp had a floor you could land on and ride along, and then the
    // bike drove straight up the far wall. A hole is a hole: come down in one and you have crashed.
    if (b.y <= gy && inPit(G, b.x)) return crash(G);
    if (b.y <= gy) { const th = slopeAt(G, b.x), diff = Math.abs(wrap(b.a - th)), flips = Math.floor(Math.abs(b.spin) / TAU + 0.25);
      if (diff > c.tol + (G.lesson ? 0.12 : 0) || Math.abs(th) > 1) return crash(G);      /* or you hit the face of the landing: too short */
      b.air = false; b.y = gy; const along = b.vx * Math.cos(th) + b.vy * Math.sin(th); b.vx = Math.max(4, along) * Math.cos(th); b.vy = 0; b.a = th; b.w = 0;
      const perfect = diff < 0.16; if (perfect) { G.perfects++; b.boost = Math.max(b.boost, 0.5); }
      if (flips > 0) { G.flips += flips; b.boost = Math.max(b.boost, c.nitro * flips); }
      G.ev.push({ k: 'land', perfect, flips, back: b.spin > 0, air: b.airT }); lessonSee(G, 'land', { perfect, flips, used: b.used | 0 }); } }
  // flags and the finish
  const tr = G.track; for (const f of tr.flags) if (f > b.lastFlag && b.x >= f) { b.lastFlag = f; G.ev.push({ k: 'flag' }); }
  if (G.trace.length < 6000 && ((G.t * 10) | 0) !== G.lastTr) { G.lastTr = (G.t * 10) | 0; G.trace.push([+b.x.toFixed(1), +b.y.toFixed(1), +b.a.toFixed(2)]); }
  if (b.y < -60) return crash(G);
  if (b.x >= tr.end) { if (G.lesson) { lessonSee(G, 'end'); return; } return finish(G, G.clock <= G.cfg.par); } }
const inPit = (G, x) => (G.track.pits || []).some(p => x > p[0] && x < p[1]);
function crash(G) { const b = G.b; G.crashes++; if (!G.lesson) G.clock += 2;      // a crash costs two seconds on top of the ride back
  G.ev.push({ k: 'crash', x: b.x, y: b.y, a: b.a }); lessonSee(G, 'crash'); const back = b.lastFlag; b.air = false; b.vx = 0; G.wait = 1.1; G.next = () => reset(G, back); }
function finish(G, win) { const c = G.cfg; G.over = win ? 'won' : 'lost'; const t = +G.clock.toFixed(2);
  const stars = win ? 1 + (t <= c.par * 0.9 ? 1 : 0) + (t <= c.par * 0.8 ? 1 : 0) : 0;
  G.res = { win, stars, time: t, par: c.par, flips: G.flips, crashes: G.crashes, perfects: G.perfects, trace: G.trace, coins: win ? 4 + Math.ceil(G.N / 3) + stars * 2 + Math.min(6, G.flips) : 1 };
  G.ev.push({ k: win ? 'won' : 'lost' }); return true; }
// ---------- what you do: hold a side (the screen's halves, for the robots a short press) ----------
function press(G, side, secs = 0.3) { if (side === 'l') G.tl = secs; else if (side === 'r') G.tr = secs; else if (side === 'bl') G.tbl = secs; else G.tbr = secs; }      // l, r: the FLIP buttons; bl, br: the LEAN buttons
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'land', title: 'STICK IT', say: G => rampCue(G)[0], do: G => rampCue(G)[1], at: G => rampCue(G)[2], how: 'Off the ramp the bike points up. Hold LEAN FWD in the air to tip it forward, so it lands flat on the slope. Three clean landings in a row.', need: 3 }],
  2: [{ id: 'flip', title: 'FLIP', say: G => rampCue(G)[0], do: G => rampCue(G)[1], at: G => rampCue(G)[2], how: 'Big ramp. Hold BACK FLIP in the air to spin a backflip, let go as it comes round, and land it. Twice.', need: 2 }],
  3: [{ id: 'perfect', title: 'PERFECT', say: G => rampCue(G)[0], do: G => rampCue(G)[1], at: G => rampCue(G)[2], how: 'Land so the wheels meet the slope exactly: a PERFECT gives a boost. Two perfect landings in a row.', need: 2 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonTrack(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonTrack(G) { const st = lessonNow(G), hs = [], flags = [0], pits = []; let y = 0; const push = v => hs.push(v); for (let i = 0; i < 40; i++) push(0);
  for (let k = 0; k < 6; k++) { const h = st.id === 'flip' ? 5.5 : 2.6, y0 = 0, n = Math.round(h * 2.2 / DX); for (let i = 1; i <= n; i++) push(y0 + h * Math.pow(i / n, 1.8)); const gap = st.id === 'flip' ? 5 : 4; { const xa = hs.length * DX; for (let i = 0; i < gap / DX; i++) push(-3); pits.push([xa - DX, hs.length * DX]); }
    const top = h * 0.55, m = (st.id === 'flip' ? 26 : 14) / DX; for (let i = 1; i <= m; i++) push(top - (top + h * 0.4) * (1 - Math.cos(Math.PI * i / m)) / 2); for (let i = 0; i < 30; i++) push(-h * 0.4 + h * 0.4 * i / 30); for (let i = 0; i < 16; i++) push(0); flags.push((hs.length - 20) * DX); }
  for (let i = 0; i < 60; i++) push(0); G.track = { hs, marks: [], flags, pits, end: (hs.length - 30) * DX }; reset(G, 0); }
function lessonSee(G, what, d) { const st = lessonNow(G); if (!st) return; let ok = null;
  if (what === 'crash') { if (st.id === 'flip') { G.ev.push({ k: 'lessonmiss', how: 'Let go a little earlier, so the spin stops as the wheels meet the slope.' }); return; } ok = false; }
  if (what === 'end') { G.ev.push({ k: 'lessonmiss', how: st.how }); lessonTrack(G); return; }
  if (what === 'land') { if (st.id === 'land') ok = d.used === 1;      /* landed it with LEAN FWD, as the hand shows (a lucky landing off some other button is not the lesson) */ if (st.id === 'flip') { if (d.flips > 0) ok = true; else return; } if (st.id === 'perfect') ok = !!d.perfect; }
  if (ok == null) return;
  if (!ok) { G.lesson.n = 0; G.ev.push({ k: 'lessonmiss', how: st.how }); return; }
  G.lesson.n++; if (G.lesson.n < st.need) { G.ev.push({ k: 'lessonok', n: G.lesson.n, need: st.need }); return; }
  G.lesson.i++; G.lesson.n = 0; if (G.lesson.i >= G.lesson.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.wait = 1.6; G.next = () => { buildTrack(G); reset(G, 0); G.clock = 0; G.flips = 0; G.crashes = 0; G.perfects = 0; G.trace = []; G.ev.push({ k: 'start' }); }; } else lessonTrack(G); }
// ---------- for the robots ----------
// BLIND: a thumb that does not look presses the left side, the right side, or both, for a moment
const BLIND = { l: G => press(G, Math.random() < 0.5 ? 'l' : 'bl', 0.15 + Math.random() * 0.4), r: G => press(G, Math.random() < 0.5 ? 'r' : 'br', 0.15 + Math.random() * 0.4), b: G => { press(G, Math.random() < 0.5 ? 'l' : 'bl', 0.3); press(G, Math.random() < 0.5 ? 'r' : 'br', 0.3); } };      /* a thumb that does not look lands on either button of that side (so the test's list of blind strings stays the size it was) */
// a rider who looks: in the air, works out where it will land and turns the bike to that slope (a flip too if there is
// time), letting go early enough for the spin to die; on the ground leans forward down hills
// THE TUTORIAL SHOWS WHICH BUTTON, AND WHEN TO LET GO (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing happens").
// It showed one button for the whole lesson. Now the robot is asked which button it would hold this moment (run dry: its buttons are read and
// put back): HOLD LEAN FWD / LEAN BACK / BACK FLIP / FRONT FLIP with the hand on that button, LET GO! when it would let go, WAIT… otherwise.
const RPC = { t: -1e9, v: null, was: null };
function rampCue(G) { const b = G.b; if (G.over || G.wait > 0) return ['WAIT…', 'wait', false]; const now = performance.now(); if (now - RPC.t < 100) return RPC.v; RPC.t = now;
  const h0 = Object.assign({}, G.hold), sr = Math.random, mem = { t: -1 }; Math.random = () => 0.5; let want = null; try { honest(G, { acc: 1, react: 0.15 }, mem); want = Object.assign({}, G.hold); } catch (e) {} finally { Math.random = sr; Object.assign(G.hold, h0); }
  const P = padRects(), mid = q => [q.x + q.w / 2, q.y + q.h / 2], name = { l: 'BACK FLIP', r: 'FRONT FLIP', bl: 'LEAN BACK', br: 'LEAN FWD' }, on = want && ['br', 'bl', 'l', 'r'].find(q => want[q]); let v;
  if (on) { v = ['HOLD ' + name[on], 'hold', mid(P[on])]; RPC.was = on; } else if (RPC.was && b.air) { v = ['LET GO!', 'release', mid(P[RPC.was])]; } else { RPC.was = null; v = [b.air ? 'WAIT… LAND IT' : 'RIDE…', 'wait', false]; }
  RPC.v = v; return v; }
function honest(G, o, mem) { const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, b = G.b; G.hold.l = G.hold.r = G.hold.bl = G.hold.br = false;
  if (G.over || G.wait > 0) { mem.plan = null; return; }
  mem.t = (mem.t || 0) - 1 / 60; if (mem.t > 0) { G.hold.l = mem.l; G.hold.r = mem.r; G.hold.br = mem.br; G.hold.bl = mem.bl; return; } mem.t = 0.05 + react * 0.22;
  let l = false, r = false, br = false, bl = false;
  if (b.air) { if (!mem.plan || mem.plan.id !== G.jumps) { // where will it land?
      let x = b.x, y = b.y, vx = b.vx, vy = b.vy, t = 0; while (t < 4) { vy -= GRAV / 60; x += vx / 60; y += vy / 60; t += 1 / 60; if (y <= groundY(G, x)) break; }
      const th = slopeAt(G, x), err = (Math.random() - 0.5) * (1 - acc) * 3, flip = o.flip !== false && (t > 1.35 + react * 0.4 || (G.lesson && lessonNow(G).id === 'flip' && t > 1.15)) && Math.random() < 0.85;
      mem.plan = { id: G.jumps, target: th + err + (flip ? TAU : 0) - 0.04 }; }
    const per = 0.05 + react * 0.22, left = mem.plan.target - (b.a + b.w * per * 0.6), stop = b.w / 6; if (b.w * left > 0 && Math.abs(stop) >= Math.abs(left) - 0.05) { if (Math.abs(stop) > Math.abs(left) + 0.6) { if (stop > 0) r = true; else l = true; } } else if (left > 0.15) l = true; else if (left < -0.15) r = true;      // coast in, or check a spin that will overshoot a lot
    // which button: a small turn to line up the landing is a LEAN, a big one is a FLIP (in the first lesson he does as the hand shows: LEAN FWD only)
    { const ls = G.lesson && lessonNow(G).id === 'land', small = ls || (Math.abs(left) < 0.9 && Math.abs(b.w) < 3.2); if (small) { if (l) { l = false; bl = true; } if (r) { r = false; br = true; } } if (ls) { l = false; bl = false; } } }
  else { mem.plan = null; const th = slopeAt(G, b.x + 3); if (th < -0.2) br = true; }      /* on the ground: LEAN FWD down the hills (the FLIP buttons do nothing there) */
  mem.wasAir = b.air; mem.l = l; mem.r = r; mem.br = br; mem.bl = bl; G.hold.l = l; G.hold.r = r; G.hold.br = br; G.hold.bl = bl; }
function winNow(G) { if (!G || G.over || G.wait > 0) return; G.lesson = null; G.clock = 1; finish(G, true); }
