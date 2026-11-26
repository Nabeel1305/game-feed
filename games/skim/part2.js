// ===================== RULES: Skimming Stones =====================
// A quiet lake at golden hour. Pick up a stone, drag your thumb back down the screen to aim and wind up (the line shows where
// it goes), let go to throw. Each time the stone kisses the water, tap: right on time it keeps its speed and skips on; late,
// early or not at all, it slows; a stone that is too slow sinks. Each lake asks for something: so many skips, a distance,
// rings to skip through, the far jetty. Five stones per lake. Wind pushes the stone; lily pads and ducks stop it.
// World: x across the lake (+ right), z out from the shore (+ away), metres.
const RULES = [
  '<b>Throw:</b> put your thumb on the stone and drag back down: the longer the drag, the harder the throw; left and right aim it. Let go to throw.',
  '<b>Skip:</b> each time the stone kisses the water, <b>tap</b>. Right on time (the ring closes on the stone) it keeps its speed and skips on.',
  'Late, early or not at all, it slows. Extra taps make it wobble. Too slow, and it sinks.',
  'Each lake asks for something: skips, a distance, rings to skip through. Five stones each. Watch the wind on the reeds and the flag.',
  'Flat stones skip best; heavy ones shrug off the wind. Lily pads and ducks stop a stone (the ducks do not mind).',
];
const SKINS = [{ id: 'slate', name: 'Grey slate', col: 0x6a7078, col2: 0x9aa0a8, stars: 0 }, { id: 'sand', name: 'Sandstone', col: 0xc8a070, col2: 0xe0c090, stars: 5 }, { id: 'jade', name: 'River jade', col: 0x3a8a6a, col2: 0x6ac8a0, stars: 12 },
  { id: 'rose', name: 'Rose quartz', col: 0xe0a0b0, col2: 0xf8d0d8, stars: 22 }, { id: 'night', name: 'Obsidian', col: 0x1a1a22, col2: 0x4a4a5a, stars: 34 }, { id: 'gold', name: 'Lucky gold', col: 0xd8b040, col2: 0xf8e090, stars: 50 }];
const UPGRADES = [{ id: 'eye', name: 'Keen eye', max: 2, cost: l => [60, 140][l], desc: 'The perfect-tap moment is a little wider.' }, { id: 'arm', name: 'Strong arm', max: 2, cost: l => [70, 160][l], desc: 'Throws go a little harder.' },
  { id: 'pocket', name: 'Deep pocket', max: 1, cost: () => 120, desc: 'One more stone on every lake.' }];
const upLv = id => { if (typeof HEADLESS !== 'undefined' && HEADLESS) return 0; return ((store.get('ups', {}) || {})[id]) | 0; };
const RANKS = [[0, 'Pebble'], [60, 'Ripple'], [200, 'Skipper'], [500, 'Lake walker'], [1100, 'Stone whisperer'], [2500, 'Legend of the shore']];
const PLACES = [{ name: 'Mill Pond', sky: 'golden' }, { name: 'Willow Lake', sky: 'sunset' }, { name: 'Misty Loch', sky: 'mist' }, { name: 'Moon Water', sky: 'dusk' }];
const placeOf = N => Math.floor((N - 1) / 4) % PLACES.length;
// the stones: flat ones skip best (a shallow bounce, less speed lost), heavy ones push through the wind
const STONES = [{ id: 'flat', name: 'Flat slate', flat: 1.0, heavy: 0.6, icon: '▬' }, { id: 'round', name: 'Round pebble', flat: 0.7, heavy: 0.8, icon: '●' }, { id: 'heavy', name: 'Heavy granite', flat: 0.8, heavy: 1.2, icon: '⬬' }];
const GRAV = 9.8, H0 = 1.1, VMIN = 2.2;
function makeCfg(N, help, o = {}) {
  const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), R = rng(N * 457 + 11);
  const kind = N <= 4 ? ['skips', 'far', 'skips', 'rings'][N - 1] : ['skips', 'far', 'rings', 'jetty'][(R() * 4) | 0];
  return { N, f, help: !!help, place: placeOf(N), kind, skips: Math.round(x(9, 12.5, 20)), far: Math.round(x(48, 95, 16)), rings: Math.min(4, 1 + Math.floor(f / 8)),
    wind: N >= 5 ? x(0, 3.2, 18) * (R() < 0.5 ? -1 : 1) : 0, pads: N >= 6 ? Math.round(x(0, 9, 20)) : 0, ducks: N >= 8 ? Math.round(x(0, 3, 20)) : 0,
    perfect: x(0.08, 0.04, 14) * (help ? 1.3 : 1), good: x(0.15, 0.09, 14) * (help ? 1.3 : 1), stones: 5 + (help ? 1 : 0), free: !!o.free };
}
function makeLake(cfg) { const R = rng(cfg.N * 911 + 5), L = { rings: [], pads: [], ducks: [], jetty: null, buoy: null };
  if (cfg.kind === 'rings') for (let i = 0; i < cfg.rings; i++) L.rings.push({ x: (R() - 0.5) * 6 * (1 + i * 0.3), z: 13 + i * (8 + R() * 6), r: 1.1 - Math.min(0.4, cfg.f * 0.01), done: false });
  if (cfg.kind === 'far') L.buoy = { x: (R() - 0.5) * 10, z: cfg.far };
  if (cfg.kind === 'jetty') L.jetty = { x: (R() - 0.5) * 16, z: cfg.far * 0.85, w: 6, d: 8 };
  for (let i = 0; i < cfg.pads; i++) { let x, z, t = 0; do { x = (R() - 0.5) * 14; z = 8 + R() * 50; } while (t++ < 30 && (Math.abs(x) < 1.2 && z < 20 || L.rings.some(r => Math.hypot(r.x - x, r.z - z) < 3))); L.pads.push({ x, z, r: 0.7 + R() * 0.4 }); }
  for (let i = 0; i < cfg.ducks; i++) L.ducks.push({ x0: (R() - 0.5) * 8, z: 14 + R() * 40, amp: 2.5 + R() * 3.5, w: 0.15 + R() * 0.15, ph: R() * TAU, r: 0.45 });
  return L; }
const duckPos = (d, t) => ({ x: d.x0 + d.amp * Math.sin(d.w * t + d.ph), z: d.z });
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help, o), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, mini: !!o.mini, free: !!o.free, blind: {} };
  G.L = makeLake(cfg); G.left = cfg.stones + upLv('pocket'); G.throws = 0; G.best = { skips: 0, far: 0 }; G.stone = 0; G.phase = 'aim'; G.aim = null; G.s = null; G.log = [];
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G);
  return G;
}
// ---------- the player's actions ----------
function chooseStone(G, i) { if (G.phase === 'aim') { G.stone = clamp(i | 0, 0, STONES.length - 1); G.ev.push({ k: 'stone', i: G.stone }); } }
function setAim(G, ang, pow) { if (G.phase !== 'aim') return; G.aim = ang == null ? null : { ang: clamp(ang, -0.7, 0.7), pow: clamp(pow, 0, 1) }; }
// let go: the stone flies (a drag too short does nothing)
function release(G) { if (G.phase !== 'aim' || !G.aim) return; const a = G.aim; G.aim = null; if (a.pow < 0.08) return; if (!G.free && !G.lesson && G.left <= 0) return;
  const st = STONES[G.stone], v = (7 + 17 * a.pow) * (1 + 0.05 * upLv('arm'));
  G.s = { x: 0, z: 0.8, y: H0, vx: Math.sin(a.ang) * v, vz: Math.cos(a.ang) * v, vy: 0.5 + 2.5 * a.pow, st, skips: 0, hop: 0, tdT: null, taps: 0, lastQ: null, done: false, sinkT: 0, path: [] };
  G.phase = 'fly'; G.throws++; if (!G.free && !G.lesson) G.left--; G.s.tdT = nextTouch(G.s); G.ev.push({ k: 'throw', v, ang: a.ang }); }
// tap: the stone is about to kiss the water; how close to the moment decides how well it skips
function tap(G) { if (G.phase !== 'fly') return; const s = G.s, gd = G.cfg.good * (1 + 0.2 * upLv('eye')), pw = G.cfg.perfect * (1 + 0.2 * upLv('eye')), lk = s.lastKiss;
  // a tap just after a kiss that had no tap still counts (a moment late)
  if (lk && lk.none && !lk.up && G.t - lk.t <= pw && s.tapT == null) { lk.up = true; const d = G.t - lk.t, q = 'good', k = kissK(q, s.st), r = k / lk.k; s.vx *= r; s.vz *= r; s.vy *= r; s.tdT = nextTouch(s); s.run = (s.run | 0) + 1; G.ev.push({ k: 'kiss', q, n: s.skips, x: s.x, z: s.z, late: true }); lessonSee(G, 'kiss', q); return; }
  s.taps++; if (s.tapT == null) s.tapT = G.t; else { s.extra = (s.extra || 0) + 1; G.ev.push({ k: 'wobble' }); } }
// when (in this hop) the stone will next meet the water
function nextTouch(s) { const disc = s.vy * s.vy + 2 * GRAV * s.y; return (s.vy + Math.sqrt(Math.max(0, disc))) / GRAV; }
// ---------- every frame ----------
function step(G, dt) { if (G.over || !(dt > 0)) return; G.t += dt; if (G.lesson) lessonTick(G, dt); const cfg = G.cfg;
  if (G.phase === 'rest') { G.restT -= dt; if (G.restT <= 0) afterStone(G); return; }
  if (G.phase !== 'fly') return; const s = G.s;
  // flight: gravity, the wind (heavier stones shrug it off)
  const y0 = s.y; s.vy -= GRAV * dt; s.vx += cfg.wind / s.st.heavy * 0.35 * dt; s.x += s.vx * dt; s.z += s.vz * dt; s.y += s.vy * dt; s.tdT -= dt;
  // passing through a ring (in the air, between two kisses)
  for (const r of G.L.rings) if (!r.done && Math.abs(s.z - r.z) < 0.5 && Math.abs(s.x - r.x) < r.r && s.y < 0.3 + r.r * 1.6) { r.done = true; G.ev.push({ k: 'ring', n: G.L.rings.filter(q => q.done).length, of: G.L.rings.length }); lessonSee(G, 'ring'); }
  // onto the old jetty: a low pass over its boards (it slides to a stop there)
  if (G.L.jetty && Math.abs(s.x - G.L.jetty.x) < G.L.jetty.w / 2 && Math.abs(s.z - G.L.jetty.z) < G.L.jetty.d / 2 && s.y < 0.7) { G.ev.push({ k: 'jetty' }); return stopStone(G, 'jetty'); }
  // a duck in the way
  for (const d of G.L.ducks) { const p = duckPos(d, G.t); if (Math.hypot(p.x - s.x, p.z - s.z) < d.r + 0.2 && s.y < 0.5) return stopStone(G, 'duck'); }
  if (s.y > 0) return;
  // the stone meets the water
  const tk = G.t - dt + dt * clamp(y0 / Math.max(1e-6, y0 - s.y), 0, 1); s.y = 0; s.kT = tk; const d = s.tapT == null ? 1e9 : Math.abs(tk - s.tapT);      // the exact moment of the kiss
  const pw = cfg.perfect * (1 + 0.2 * upLv('eye')), gd = cfg.good * (1 + 0.2 * upLv('eye'));
  // was the tap close enough? a tap just after the kiss still counts (we look a moment ahead)
  if (G.L.pads.some(p => Math.hypot(p.x - s.x, p.z - s.z) < p.r)) return stopStone(G, 'pad');
  s.early = s.tapT != null && s.tapT < tk; resolveKiss(G, s.tapT == null ? null : d, pw, gd); }

// the kiss: perfect keeps most of the speed, good some, a miss loses a lot; wobbles cost too; slow stones sink
const kissK = (q, st) => Math.max(0.15, 1 - (1 - (q === 'perfect' ? 0.94 : q === 'good' ? 0.85 : 0.45)) / st.flat);
function resolveKiss(G, d, pw, gd) { const s = G.s, st = s.st, q = d == null ? 'miss' : d <= pw ? 'perfect' : d <= gd ? 'good' : 'miss';
  s.run = q === 'miss' || s.extra ? 0 : (s.run | 0) + 1; let k = kissK(q, st); if (s.extra) k *= Math.pow(0.85, s.extra); s.lastKiss = { t: s.kT != null ? s.kT : G.t, q, k, none: d == null };
  s.vx *= k; s.vz *= k; const hspd = Math.hypot(s.vx, s.vz); s.tapT = null; s.extra = 0; s.taps = 0;
  if (hspd < VMIN || s.skips > 60) return sink(G);
  s.skips++; s.vy = hspd * Math.tan(0.16 * st.flat + 0.04) * (q === 'perfect' ? 1.05 : 1); s.tdT = nextTouch(s); s.path.push({ x: s.x, z: s.z });
  if (d != null || G.lesson) { G.ev.push({ k: 'kiss', q, n: s.skips, x: s.x, z: s.z, early: s.early, none: d == null }); if (d != null) lessonSee(G, 'kiss', q); } else G.ev.push({ k: 'kiss', q, n: s.skips, x: s.x, z: s.z, quiet: true });
  if (s.skips > G.best.skips) G.best.skips = s.skips; checkGoal(G, false); }
function sink(G) { const s = G.s; G.ev.push({ k: 'sink', x: s.x, z: s.z, skips: s.skips, far: s.z }); stopStone(G, 'sink'); }
function stopStone(G, why) { const s = G.s; if (G.phase !== 'fly') return; if (why !== 'sink') G.ev.push({ k: why, x: s.x, z: s.z });
  if (s.z > G.best.far) G.best.far = s.z; G.log.push({ skips: s.skips, far: Math.round(s.z), why }); G.phase = 'rest'; G.restT = 1.2; checkGoal(G, true); }
function goalMet(G) { const c = G.cfg, b = G.best; return c.kind === 'skips' ? b.skips >= c.skips : c.kind === 'far' ? b.far >= c.far : c.kind === 'rings' ? G.L.rings.every(r => r.done) : G.log.some(l => l.why === 'jetty'); }
function checkGoal(G, end) { if (G.lesson || G.free || G.over) return; if (goalMet(G)) { if (end) finish(G, true, 'goal'); else G.goalHit = true; } }
function afterStone(G) { G.s = null; if (G.over) return; if (G.lesson) { G.phase = 'aim'; return; }
  if (!G.free && goalMet(G)) return finish(G, true, 'goal');
  if (!G.free && G.left <= 0) return finish(G, false, 'stones');
  G.phase = 'aim'; G.ev.push({ k: 'ready', left: G.left }); }
function finish(G, win, why) { if (G.over) return; G.over = win ? 'won' : 'lost'; const left = G.left;
  const stars = win ? (left >= 3 ? 3 : left >= 1 ? 2 : 1) : 0;
  G.res = { win, why, stars, left, used: G.throws, best: G.best, kind: G.cfg.kind, coins: win ? 8 + stars * 6 + Math.min(12, G.best.skips) : 2 };
  G.ev.push({ k: win ? 'won' : 'lost', why }); }
function winNow(G) { if (!G || G.over || G.lesson) return; finish(G, true, 'goal'); }
function goalText(cfg) { return cfg.kind === 'skips' ? `Skip a stone ${cfg.skips} times` : cfg.kind === 'far' ? `Skip a stone past the buoy (${cfg.far} m)` : cfg.kind === 'rings' ? `Skip through ${cfg.rings === 1 ? 'the floating ring' : `all ${cfg.rings} floating rings`}` : 'Skip a stone onto the old jetty'; }
// ---------- lessons (levels 1-3) ----------
const LESSONS = {
  1: [{ id: 'throw', title: 'DRAG BACK, LET GO', say: G => skimCue(G)[0], do: G => skimCue(G)[1], at: G => skimCue(G)[2], how: 'Put your thumb on the stone and drag back down the screen: the line shows where it goes. Let go to throw. Then tap each time it kisses the water. Three good taps in a row.', need: 3 }],
  2: [{ id: 'perfect', title: 'RIGHT ON TIME', say: G => skimCue(G)[0], do: G => skimCue(G)[1], at: G => skimCue(G)[2], how: 'Watch the ring close on the stone as it comes down: tap just as it touches. Three PERFECT kisses.', need: 3 }],
  3: [{ id: 'chain', title: 'KEEP IT GOING', say: G => skimCue(G)[0], do: G => skimCue(G)[1], at: G => skimCue(G)[2], how: 'Throw hard and tap every kiss: each perfect tap keeps its speed. Six skips on one stone.', need: 6 }],
};
function lessonStart(G) { const st = LESSONS[G.N][0]; G.lesson = { steps: LESSONS[G.N], i: 0, n: 0, id: st.id, need: st.need }; G.ev.push({ k: 'lessonnext', first: true }); }
function lessonSee(G, what, q) { const D = G.lesson; if (!D || D.done) return; let good = false;
  if (D.id === 'throw' && what === 'kiss') { const n = G.s ? G.s.run | 0 : 0; if (n > D.n) { D.n = n; good = true; } }
  if (D.id === 'perfect' && what === 'kiss') { if (q === 'perfect') { D.n++; good = true; } }
  if (D.id === 'chain' && what === 'kiss') { D.n = G.s.skips; good = true; }
  if (good) { G.ev.push({ k: 'lessonok', n: Math.min(D.n, D.need), need: D.need }); if (D.n >= D.need) { D.done = true; D.wait = 1.8; } } }
function lessonTick(G, dt) { const D = G.lesson; if (!D.done) return; D.wait -= dt; if (D.wait > 0 || G.phase === 'fly') return; G.lesson = null; G.left = G.cfg.stones + upLv('pocket'); G.throws = 0; G.best = { skips: 0, far: 0 }; G.log = []; G.L = makeLake(G.cfg); G.phase = 'aim'; G.s = null; G.ev.push({ k: 'lessondone', N: G.N }); }

// ---------- for the robots: blind moves and an honest skimmer ----------
const BLIND = {
  t: G => tap(G),                                                                                          // tap
  h: G => { setAim(G, (Math.random() - 0.5) * 1.2, 0.5 + Math.random() * 0.5); release(G); },             // a hard throw anywhere
  s: G => { setAim(G, (Math.random() - 0.5) * 1.2, Math.random() * 0.5); release(G); },                   // a soft throw anywhere
  k: G => chooseStone(G, (Math.random() * STONES.length) | 0),                                             // pick another stone
};
// HONEST: a skimmer who looks: picks the flat stone (the heavy one in a strong wind), aims at what the lake asks for (allowing
// for the wind), throws as hard as the goal needs, and taps each kiss with a little error (react, acc).
// THE TUTORIAL SHOWS THE THROW AND THE MOMENT (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing happens"). The hand
// dragged straight down whatever the target, and TAP AS IT TOUCHES pointed the whole flight long. Now the robot is asked (dryPlanAll): TAP THIS
// STONE when it would pick another, DRAG BACK, LET GO along the very line it would throw (aim and strength), then WAIT… and TAP NOW! only as the
// stone comes down.
const SMC = { t: -1e9, v: null };
function skimCue(G) { if (G.over) return ['WAIT…', 'wait', false]; if (G.phase === 'fly') { const s2 = G.s; return s2 && s2.tdT != null && s2.tdT < 0.3 ? ['TAP AS IT LANDS!', 'tap', false] : ['WATCH THE STONE…', 'wait', false]; }
  if (G.phase !== 'aim') return ['WAIT…', 'wait', false]; if (ui.drag && SMC.v) return SMC.v; const now = performance.now(); if (now - SMC.t < 300) return SMC.v; SMC.t = now;
  const all = dryPlanAll(G, null, { wait: -1e9 }), cs = all.find(q => q[0] === 'chooseStone'), am = all.find(q => q[0] === 'setAim'), L = layout(G); let v = ['WAIT…', 'wait', false];
  if (cs && cs[1] !== G.stone && L.picks[cs[1]]) v = ['TAP THIS STONE', 'tap', [L.picks[cs[1]].x, L.picks[cs[1]].y]];
  else if (am) { const x0 = W / 2, y0 = H * 0.42; v = ['DRAG BACK, LET GO', 'drag', [x0, y0, x0 - am[1] / 0.7 * W * 0.42, y0 + Math.max(0.15, am[2]) * H * 0.3]]; }
  SMC.v = v; return v; }
function honest(G, o, mem) { if (G.over) return; const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random, cfg = G.cfg;
  if (G.phase === 'aim') { if (mem.wait == null) mem.wait = G.t + 0.4 + R() * 0.4; if (G.t < mem.wait) return; mem.wait = null;
    ACT.chooseStone(G, Math.abs(cfg.wind) > 2 ? 2 : 0); let tx = 0, tz = 40, pow = 1;
    if (cfg.kind === 'rings') { const r = G.L.rings.find(q => !q.done); if (r) { tx = r.x; tz = r.z; } }
    if (cfg.kind === 'far' && G.L.buoy) { tx = G.L.buoy.x; tz = G.L.buoy.z; }
    if (cfg.kind === 'jetty') { tx = G.L.jetty.x; tz = G.L.jetty.z; pow = planPow(G, tx, tz + 2.5); }
    const drift = cfg.wind / STONES[G.stone].heavy * 0.35 * Math.pow(tz / 16, 2) * 0.5, ang = Math.atan2(tx - drift, tz) + (R() - 0.5) * (1 - acc) * 0.25;
    let a2 = ang, clear = !pathHit(G, ang, pow); if (!clear && (cfg.kind === 'skips' || cfg.kind === 'far')) { for (const off of [0.07, -0.07, 0.14, -0.14, 0.21, -0.21, 0.3, -0.3]) if (!pathHit(G, ang + off, pow)) { a2 = ang + off; clear = true; break; } }      // steer clear of lily pads and ducks
    if (!clear && (mem.waited || 0) < 5) { mem.waited = (mem.waited || 0) + 0.3; mem.wait = G.t + 0.3; return; } mem.waited = 0;      // or wait for the duck to paddle out of the way
    ACT.setAim(G, a2, clamp(pow + (R() - 0.5) * (1 - acc) * 0.2, 0.1, 1)); ACT.release(G); mem.tap = null; return; }
  if (G.phase !== 'fly') return; const s = G.s;
  if (mem.tap != null && mem.hop !== s.skips && !mem.tapped && mem.hop === s.skips - 1) { mem.tapped = true; ACT.tap(G); }      // a moment late: it still counts
  if (mem.tap == null || mem.hop !== s.skips) { mem.hop = s.skips; mem.tap = G.t + s.tdT - 0.022 + (R() - 0.5) * react * 0.2 + (R() < (1 - acc) * 0.5 ? (R() - 0.5) * 0.4 : 0); mem.tapped = false; }
  if (!mem.tapped && G.t >= mem.tap) { mem.tapped = true; ACT.tap(G); } }
// does the stone (good taps, with the wind) come down on a lily pad, or meet a duck?
function pathHit(G, ang, pow) { const st = STONES[G.stone], v = 7 + 17 * pow; let x = 0, z = 0.8, y = H0, vx = Math.sin(ang) * v, vz = Math.cos(ang) * v, vy = 0.5 + 2.5 * pow, n = 0;
  for (let i = 0; i < 3000; i++) { const dt = 1 / 60; vy -= GRAV * dt; vx += G.cfg.wind / st.heavy * 0.35 * dt; x += vx * dt; z += vz * dt; y += vy * dt; if (y < 0.5 && G.L.ducks.some(d => { const q = duckPos(d, G.t + i * dt); return Math.hypot(q.x - x, q.z - z) < d.r + 0.8; })) return true; if (y <= 0) { if (G.L.pads.some(p => Math.hypot(p.x - x, p.z - z) < p.r + 0.6)) return true; const k = kissK('good', st); vx *= k; vz *= k; if (Math.hypot(vx, vz) < VMIN || n++ > 30) return false; y = 0; vy = Math.hypot(vx, vz) * Math.tan(0.16 * st.flat + 0.04); } } return false; }
// the power that lands a stone near (tx, tz) with good taps (for the jetty)
function planPow(G, tx, tz) { let best = 1, bd = 1e9; for (let p = 0.2; p <= 1.001; p += 0.05) { const z = simFar(G, p); const d = Math.abs(z - tz); if (d < bd) { bd = d; best = p; } } return best; }
function simFar(G, pow) { const st = STONES[G.stone], v = 7 + 17 * pow; let x = 0, z = 0.8, y = H0, vz = v, vy = 0.5 + 2.5 * pow, n = 0; for (let i = 0; i < 4000; i++) { const dt = 1 / 60; vy -= GRAV * dt; z += vz * dt; y += vy * dt; if (y <= 0) { y = 0; let k = 0.9; k = 1 - (1 - k) / st.flat; vz *= k; if (vz < VMIN || n++ > 60) return z; vy = vz * Math.tan(0.16 * st.flat + 0.04); } } return z; }

// what the robot would do now, without doing it (tools/dry_plan.py): the tutorial shows this move
const ACT_REAL = { setAim, release, chooseStone, tap }; let ACT = ACT_REAL;
function dryPlan(G, o, mem) { let got = null; const rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { if (!got && !(a.length > 2 && a.slice(1).every(v => v === 0 || v === false))) got = [n, ...a.slice(1)]; return true; };      /* (a stick at rest, all its numbers 0, is not a move; a first bed, number 0, is) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return got; }
function dryPlanAll(G, o, mem) { const all = [], rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { all.push([n, ...a.slice(1)]); return true; };      /* every call, in order (for a robot that steers and drifts at once) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return all; }
