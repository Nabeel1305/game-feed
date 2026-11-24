// ===================== RULES: Skydive =====================
// Out of the plane door into freefall: the left thumb flies your body (drag forward to track, left or right to turn), hold
// TUCK to dive faster, let go to spread out and slow. Tap the CHUTE button between the yellow marks on the altimeter; under the
// canopy the stick turns you (pull back for brakes), the wind carries you, and a ring on the ground shows where you will land.
// Hold FLARE just above the ground for a soft landing. Land inside the circle; the closer to the X the more points.
// Units: metres, seconds; x east, z north, y up.

const RULES = [
  '<b>Freefall:</b> drag the left thumb forward to fly forward, left or right to turn. <b>Hold TUCK</b> to dive faster; let go to spread out and slow down.',
  '<b>Tap CHUTE</b> when the altimeter is between the yellow marks. Too low, and the safety opens it for you (it costs points).',
  '<b>Under the canopy:</b> drag left or right to turn, pull back for brakes. The arrow shows the wind; the ring on the ground is where you will land.',
  '<b>Land into the wind</b> (flying against it you come in slow) and <b>hold FLARE</b> just above the ground: a soft landing.',
  'Land inside the circle; the closer to the X, the more points. Gold rings in the sky are extra points (some levels make them a course you must fly).',
];
const SKINS = [{ id: 'red', name: 'Red canopy', col: 0xe8403a, col2: 0xffffff, stars: 0 }, { id: 'sky', name: 'Sky blue', col: 0x3a8ae8, col2: 0xffe040, stars: 6 }, { id: 'lime', name: 'Lime', col: 0x8ad83a, col2: 0x1a1a1a, stars: 14 },
  { id: 'sunset', name: 'Sunset', col: 0xff8a3a, col2: 0x8a2ae0, stars: 24 }, { id: 'night', name: 'Midnight', col: 0x1a2a5a, col2: 0x40e0ff, stars: 36 }, { id: 'gold', name: 'Gold', col: 0xe0b030, col2: 0xffffff, stars: 50 }];
const UPGRADES = [{ id: 'canopy', name: 'Bigger canopy', max: 2, cost: l => [60, 140][l], desc: 'Falls a little slower under the canopy: more time to line up.' }, { id: 'suit', name: 'Wing suit seams', max: 2, cost: l => [70, 160][l], desc: 'Fly forward a little faster in freefall.' },
  { id: 'alti', name: 'Talking altimeter', max: 1, cost: () => 90, desc: 'Beeps when it is time to open, and again for the flare.' }];
const upLv = id => { if (typeof HEADLESS !== 'undefined' && HEADLESS) return 0; return ((store.get('ups', {}) || {})[id]) | 0; };
const RANKS = [[0, 'Student'], [60, 'Jumper'], [200, 'Canopy pilot'], [500, 'Swooper'], [1100, 'Instructor'], [2500, 'Sky legend']];
const PLACES = [{ name: 'Green countryside', sky: 'morning' }, { name: 'The islands', sky: 'noon' }, { name: 'Mountain valley', sky: 'golden' }, { name: 'The city', sky: 'dusk' }, { name: 'The coast at sunset', sky: 'sunset' }];
const placeOf = N => N <= 3 ? 0 : N <= 7 ? 1 : N <= 11 ? 2 : N <= 16 ? 3 : [0, 1, 2, 3, 4][N % 5];
const DEPLOY = [220, 440];      // the yellow marks on the altimeter (metres above the ground)
const AAD = 140;                // the safety opens the canopy here
function makeCfg(N, help, o = {}) {
  const f = curve(N), e = easyOf(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), place = placeOf(N), scenic = !!o.free;
  return { N, f, e, help: !!help, scenic, free: scenic, place,
    zone: x(55, 24, 16) * (help ? 1.3 : 1) * (scenic ? 1.6 : 1), wind: x(1.5, 6.5, 18) * (scenic ? 0.5 : 1), shift: N >= 5 && !scenic, dist: x(360, 640, 14), alt: 820 + Math.min(400, f * 10),
    rings: N >= 2 ? Math.min(6, 2 + Math.floor(f / 4)) : 0, course: N >= 8 && N % 4 === 0 && !scenic, roof: place === 3 && N >= 12 && !scenic, isl: place === 1 || place === 4, mtn: place === 2,
    hardOk: scenic, assist: N <= 2 || scenic, canopy: 1 + 0.08 * upLv('canopy'), suit: 1 + 0.08 * upLv('suit') };
}
// ---------- the ground: hills, flattened round the landing zone; islands in the sea; a valley in the mountains; a roof in the city ----------
function groundAt(G, x, z) { const c = G.cfg, T = G.T, d = Math.hypot(x - T.x, z - T.z), flat = clamp((d - c.zone - 50) / 220, 0, 1);
  let h = (Math.sin(x * 0.004 + G.seed % 7) * 14 + Math.sin(z * 0.0035 + x * 0.002) * 12 + Math.sin((x + z) * 0.011) * 4) * flat;
  if (c.mtn) h += Math.pow(clamp((d - c.zone - 120) / 900, 0, 1), 1.3) * (260 + 120 * Math.sin(Math.atan2(z - T.z, x - T.x) * 3 + G.seed));
  if (c.isl) h += 8 - Math.max(0, d - c.zone - 140) * 0.09 + 18 * flat * Math.sin(x * 0.01) * Math.sin(z * 0.012) * clamp(1 - d / 900, 0, 1);
  return h; }
function surfAt(G, x, z) { const R = G.roof; if (R && Math.abs(x - R.x) < R.half && Math.abs(z - R.z) < R.half) return R.h; return Math.max(groundAt(G, x, z), G.cfg.isl ? 0 : -1e9); }
// the wind: aloft (freefall), and down low (under the canopy); on some levels it turns below a height you can see coming
function windAt(G, agl) { const W = G.W, lo = agl < W.shiftH ? W.lo2 : W.lo, k2 = clamp((agl - 250) / 400, 0, 1); return { x: lerp(lo.x, W.hi.x, k2), z: lerp(lo.z, W.hi.z, k2) }; }
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help, o), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0, R = rng(seed + 9);
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, mini: !!o.mini };
  layout0(G, R);
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G);
  return G;
}
function layout0(G, R) { const c = G.cfg; G.T = { x: 0, z: 0 };
  const a0 = R() * TAU, wd = a0 + (R() < 0.5 ? -1 : 1) * (Math.PI / 2 + (R() - 0.5) * 0.6), ws = c.wind;
  G.W = { lo: { x: Math.cos(wd) * ws, z: Math.sin(wd) * ws }, hi: { x: Math.cos(wd + 0.6) * ws * 1.8, z: Math.sin(wd + 0.6) * ws * 1.8 }, shiftH: -1, lo2: null };
  if (c.shift) { const s = (R() < 0.5 ? -1 : 1) * (0.7 + R() * 0.8); G.W.shiftH = 120 + R() * 120; G.W.lo2 = { x: Math.cos(wd + s) * ws * 1.2, z: Math.sin(wd + s) * ws * 1.2 }; } else G.W.lo2 = G.W.lo;
  // the exit: upwind-ish of the target, the plane flying across (you start facing along its track, not at the X)
  const ex = { x: G.T.x + Math.cos(a0) * c.dist, z: G.T.z + Math.sin(a0) * c.dist }, track = a0 + Math.PI + (R() < 0.5 ? -1 : 1) * (1.0 + R() * 0.5);
  G.roof = c.roof ? { x: G.T.x, z: G.T.z, h: 26 + R() * 22, half: Math.max(12, c.zone * 0.75) } : null;
  const gy = surfAt(G, ex.x, ex.z); G.p = { x: ex.x, y: gy + c.alt, z: ex.z, vx: Math.cos(track) * 30, vy: 0, vz: Math.sin(track) * 30, yaw: track, phase: 'free', open: 0, flare: 0, fe: 1, aad: false, openAt: 0 };
  G.stick = { x: 0, y: 0 }; G.tuck = false; G.flareOn = false; G.path = [];
  // the rings: off the direct line (extra points cost height and distance), all reachable in freefall
  G.rings = []; const nR = Math.min(c.rings, Math.floor((c.alt - DEPLOY[1] - 80) / 150)); let px = ex.x, pz = ex.z;
  for (let i = 0; i < nR; i++) { const reach = 150 / 44 * 20 * (c.course ? 0.55 : 0.8), toT = Math.atan2(G.T.z - pz, G.T.x - px), a = toT + (R() < 0.5 ? -1 : 1) * (c.course ? 0.3 + R() * 0.5 : 0.6 + R() * 0.7), d = reach * (0.6 + R() * 0.4);
    px += Math.cos(a) * d; pz += Math.sin(a) * d; const y = surfAt(G, ex.x, ex.z) + c.alt - 150 * (i + 1); G.rings.push({ x: px, y, z: pz, r: c.course ? 16 : 12, done: false, miss: false }); }
  G.score = 0; G.ringPts = 0; G.landed = null;
}
const agl = G => G.p.y - surfAt(G, G.p.x, G.p.z);
// ---------- the player's actions ----------
function setStick(G, x, y) { const L = Math.hypot(x, y); G.stick = L > 1 ? { x: x / L, y: y / L } : { x, y }; }
function tuckOn(G, on) { if (G.over) return false; G.tuck = !!on && G.p.phase === 'free'; return G.p.phase === 'free'; }
function chute(G) { const p = G.p; if (G.over || p.phase !== 'free') return false; p.phase = 'opening'; p.open = 0; p.openAt = agl(G); G.ev.push({ k: 'open', h: p.openAt }); lessonSee(G, 'open', p.openAt); return true; }
function flareOn(G, on) { if (G.over) return false; const was = G.flareOn; G.flareOn = !!on && G.p.phase === 'canopy'; if (G.flareOn && !was) G.ev.push({ k: 'flare' }); return G.p.phase === 'canopy'; }
// ---------- every frame ----------
function step(G, dt) {
  if (G.over || !(dt > 0)) return; G.t += dt; if (G.lesson) lessonTick(G, dt); const c = G.cfg, p = G.p;
  if (G.blindT != null) { G.blindT -= dt; if (G.blindT <= 0) { G.blindT = null; tuckOn(G, false); flareOn(G, false); } }
  if (p.phase === 'landed') { G.endT -= dt; if (G.endT <= 0) finishLanding(G); return; }
  const h = agl(G), w = windAt(G, h);
  if (p.phase === 'free') {
    p.yaw += G.stick.x * 1.3 * dt;
    const fwd = G.tuck ? 6 + 30 * Math.max(0, G.stick.y) : 4 + 18 * c.suit * Math.max(0, G.stick.y) - 3 * Math.max(0, -G.stick.y), sink = G.tuck ? 64 : 44 - 6 * Math.max(0, -G.stick.y);
    const tx = Math.cos(p.yaw) * fwd + w.x, tz = Math.sin(p.yaw) * fwd + w.z, kk = Math.min(1, dt * 0.9);
    p.vx += (tx - p.vx) * kk; p.vz += (tz - p.vz) * kk; p.vy += (-9.8 - 9.8 / (sink * sink) * p.vy * Math.abs(p.vy)) * dt;      /* 23 Nov 2026: gravity and air drag (falls at 9.8 m/s/s at the door, levels off at the falling speed; it was 3 to 4 times gravity at the door) */
    if (h < AAD && !G.lesson) { p.aad = true; G.ev.push({ k: 'aad' }); p.phase = 'opening'; p.open = 0; p.openAt = h; }
    if (h < DEPLOY[1] + 60 && h > DEPLOY[1] && !G.deployCue) { G.deployCue = true; G.ev.push({ k: 'deploycue' }); }
  } else if (p.phase === 'opening') {      // the canopy snaps open: a big slowdown over a second
    p.open += dt; const u = clamp(p.open / 1.1, 0, 1); p.vy += (-6 - p.vy) * Math.min(1, dt * (2 + u * 6)); p.vx += (w.x + Math.cos(p.yaw) * 8 - p.vx) * Math.min(1, dt * 3); p.vz += (w.z + Math.sin(p.yaw) * 8 - p.vz) * Math.min(1, dt * 3);
    if (p.open >= 1.1) { p.phase = 'canopy'; G.ev.push({ k: 'canopy' }); }
  } else if (p.phase === 'canopy') {
    const brake = Math.max(0, -G.stick.y), turn = G.stick.x * 0.85 * (1 - 0.3 * brake); p.yaw += turn * dt;
    let air = 14 - 5.5 * brake, sink = (9 - 2.5 * brake + Math.abs(turn) * 3) / c.canopy;
    if (G.flareOn) { if (p.fe > 0) { p.fe -= dt / (c.assist ? 5 : 2.6); air = 3.5; sink = 1.8; } else { air = 2; sink = 9; } } else if (p.fe < 1 && h > 30) p.fe = Math.min(1, p.fe + dt * 0.2);
    const tx = Math.cos(p.yaw) * air + w.x, tz = Math.sin(p.yaw) * air + w.z, kk = Math.min(1, dt * (G.flareOn ? 2.5 : 1.5));
    p.vx += (tx - p.vx) * kk; p.vz += (tz - p.vz) * kk; p.vy += (-sink - p.vy) * Math.min(1, dt * (G.flareOn ? 5 : 1.5));
    if (h < 14 && !G.flareCue) { G.flareCue = true; G.ev.push({ k: 'flarecue' }); }
    if (c.assist && h < 4.5 && !G.flareOn && p.fe > 0.5 && !G.lesson) { flareOn(G, true); G.autoFlare = true; G.ev.push({ k: 'autoflare' }); }
  }
  p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
  if ((G.pathT = (G.pathT || 0) + dt) > 0.25) { G.pathT = 0; G.path.push([p.x, p.y, p.z]); if (G.path.length > 600) G.path.shift(); }
  // rings: through one when you pass its height within its radius
  for (const r of G.rings) if (!r.done && !r.miss && p.y <= r.y && p.y - p.vy * dt > r.y) { const d = Math.hypot(p.x - r.x, p.z - r.z); if (d <= r.r) { r.done = true; G.ringPts += 150; G.ev.push({ k: 'ring', n: G.rings.filter(q => q.done).length, of: G.rings.length }); lessonSee(G, 'ring'); } else { r.miss = true; G.ev.push({ k: 'ringmiss', d: d - r.r }); } }
  // the ground
  const s = surfAt(G, p.x, p.z); if (p.y <= s) touchdown(G, s);
}
function touchdown(G, s) { const p = G.p, vs = -p.vy, hs = Math.hypot(p.vx, p.vz); p.y = s;
  const q = p.phase !== 'canopy' ? 'crash' : vs < 2.6 && hs < 7.5 ? 'soft' : vs < 4.6 && hs < 13 ? 'ok' : 'hard';
  const d = Math.hypot(p.x - G.T.x, p.z - G.T.z), water = G.cfg.isl && groundAt(G, p.x, p.z) < 0 && !(G.roof && s === G.roof.h), street = G.roof && s !== G.roof.h;
  p.phase = 'landed'; p.vx = p.vy = p.vz = 0; G.landed = { d, q, vs, hs, water, street, x: p.x, z: p.z }; G.endT = 1.3; G.flareOn = false; G.tuck = false;
  G.ev.push({ k: 'touch', q, d, water, street }); lessonSee(G, 'land', q); }
function finishLanding(G) { const L = G.landed, c = G.cfg; if (G.lesson) return lessonLanded(G);
  if (c.free) { G.ev.push({ k: 'again' }); const R = rng(G.seed + G.t * 1000); layout0(G, R); G.deployCue = G.flareCue = false; G.scenicN = (G.scenicN || 0) + 1; G.scenicBest = Math.min(G.scenicBest || 1e9, L.d); return; }
  const acc = Math.round(1000 * Math.pow(Math.max(0, 1 - L.d / c.zone), 2)), land = { soft: 300, ok: 100, hard: 0, crash: 0 }[L.q], aad = G.p.aad ? -200 : 0;
  G.score = Math.max(0, acc + land + G.ringPts + aad);
  const inZone = L.d <= c.zone && !L.water && !L.street, courseOk = !c.course || G.rings.every(r => r.done), qOk = L.q === 'soft' || L.q === 'ok' || (L.q === 'hard' && c.hardOk);
  const win = inZone && courseOk && qOk, why = !win ? (L.water ? 'water' : L.street ? 'street' : !inZone ? 'missed' : !courseOk ? 'course' : 'hard') : null;
  finish(G, win, why); }
function finish(G, win, why) { if (G.over) return; G.over = win ? 'won' : 'lost'; const L = G.landed || { d: 999, q: 'crash' }, c = G.cfg;
  const stars = win ? (L.d < c.zone * 0.2 && L.q === 'soft' && !G.p.aad ? 3 : L.d < c.zone * 0.5 && L.q !== 'hard' ? 2 : 1) : 0;
  const coins = win ? 10 + Math.round(G.score / 60) + stars * 4 : 3;
  G.res = { win, why, stars, coins, score: G.score, d: L.d, q: L.q, rings: G.rings.filter(r => r.done).length, of: G.rings.length, aad: G.p.aad, course: c.course, path: G.path.slice(), T: G.T, zone: c.zone };
  G.ev.push({ k: win ? 'won' : 'lost', why }); }

// ---------- LESSONS: fly the freefall, open between the marks, flare to land soft ----------
const LESSONS = {
  1: [{ id: 'fly', title: 'FLY YOUR BODY', say: 'DRAG TO FLY', do: 'drag', dir: 'up', how: 'Drag the left thumb: forward to fly forward, left or right to turn. Fly through three gold rings.', need: 3 }],
  2: [{ id: 'open', title: 'OPEN BETWEEN THE MARKS', say: 'TAP CHUTE ON YELLOW', do: 'tap', at: G => { const b = layout(G).a; return [b.x, b.y]; }, how: 'Watch the altimeter on the right. When the needle is between the yellow marks, tap CHUTE. Twice.', need: 2 }],
  3: [{ id: 'flare', title: 'FLARE', say: 'HOLD FLARE', do: 'hold', at: G => { const b = layout(G).a; return [b.x, b.y]; }, how: 'Turn to face the wind arrow, then hold FLARE when the ground is close (the ring turns green). Land softly twice.', need: 2 }],
};
function lessonStart(G) { const st = LESSONS[G.N][0]; G.lesson = { steps: LESSONS[G.N], i: 0, n: 0, id: st.id }; G.ev.push({ k: 'lessonnext', first: true }); lessonSetup(G); }
function lessonSetup(G) { const D = G.lesson, p = G.p, T = G.T; G.deployCue = G.flareCue = false; p.aad = false;
  if (D.id === 'fly') { G.rings = []; lessonRing(G); }
  if (D.id === 'open') { G.rings = []; p.phase = 'free'; p.y = surfAt(G, p.x, p.z) + DEPLOY[1] + 260; p.vy = -40; }
  if (D.id === 'flare') { G.rings = []; const wl = G.W.lo, ws = Math.hypot(wl.x, wl.z) || 1, a = Math.atan2(-wl.z, -wl.x); p.phase = 'canopy'; p.fe = 1; p.x = T.x + wl.x / ws * 140; p.z = T.z + wl.z / ws * 140; p.y = surfAt(G, p.x, p.z) + 70; p.yaw = a; p.vx = Math.cos(a) * 14 + wl.x; p.vz = Math.sin(a) * 14 + wl.z; p.vy = -9; } }
function lessonRing(G) { const p = G.p, a = p.yaw + (G.lesson.n % 2 ? 0.5 : -0.5), d = 110; if (p.y - surfAt(G, p.x, p.z) < 700) { p.y += 600; } G.rings = [{ x: p.x + Math.cos(a) * d, y: p.y - 44 * 7, z: p.z + Math.sin(a) * d, r: 22, done: false, miss: false }]; }
function lessonSee(G, what, v) { const D = G.lesson; if (!D || D.done) return; const id = D.id;
  const good = id === 'fly' && what === 'ring' || id === 'open' && what === 'open' && v >= DEPLOY[0] && v <= DEPLOY[1] || id === 'flare' && what === 'land' && v === 'soft';
  const bad = id === 'open' && what === 'open' && !good || id === 'flare' && what === 'land' && !good;
  if (good) { D.n++; G.ev.push({ k: 'lessonok', n: D.n, need: D.steps[0].need }); if (D.n >= D.steps[0].need) { D.done = true; D.wait = 1.4; } }
  else if (bad) G.ev.push({ k: 'lessonmiss', how: id === 'open' ? (v > DEPLOY[1] ? 'Too high: wait for the needle to reach the yellow marks.' : 'Too low: tap as soon as the needle reaches the yellow marks.') : 'Hold FLARE a little later: when the ring turns green, about the height of a house.' }); }
function lessonTick(G, dt) { const D = G.lesson, p = G.p;
  if (!D.done) { if (D.id === 'fly') { const r = G.rings[0]; if (!r || r.done || r.miss) lessonRing(G); if (agl(G) < 400) p.y += 500; }
    if (D.id === 'open' && p.phase === 'free' && agl(G) < AAD + 20) { G.ev.push({ k: 'lessonmiss', how: 'Too low: tap CHUTE as soon as the needle reaches the yellow marks.' }); lessonSetup(G); }
    if (D.id === 'open' && p.phase === 'canopy') { lessonSetup(G); }
    return; }
  D.wait -= dt; if (D.wait > 0) return; const R = rng(G.seed + 9); G.lesson = null; layout0(G, R); G.deployCue = G.flareCue = false; G.t0 = G.t; G.ev.push({ k: 'lessondone', N: G.N }); }
function lessonLanded(G) { const D = G.lesson; if (!D) return; if (D.done) { G.p.phase = 'canopy'; G.p.y += 40; return; } lessonSetup(G); if (D.id !== 'flare') { G.p.phase = 'free'; G.p.y = surfAt(G, G.p.x, G.p.z) + 900; } }

// ---------- predictions (the ring on the ground, and the robots) ----------
function predictLand(G, yaw, brake = 0, stopH = 0) { const p = G.p, c = G.cfg; let x = p.x, z = p.z, y = p.y; const air = 14 - 5.5 * brake, sink = (9 - 2.5 * brake) / c.canopy;
  for (let i = 0; i < 400; i++) { const h = y - surfAt(G, x, z); if (h <= stopH) break; const w = windAt(G, h), dtt = Math.max(0.1, Math.min(1, h / sink / 30)); x += (Math.cos(yaw) * air + w.x) * dtt; z += (Math.sin(yaw) * air + w.z) * dtt; y -= sink * dtt; }
  return { x, z }; }

// ---------- for the robots: blind moves and an honest jumper ----------
const BLIND = {
  m: G => { const a = Math.random() * TAU; setStick(G, Math.cos(a), Math.sin(a)); },     // the stick anywhere
  c: G => setStick(G, 0, 0),                                                              // let go of the stick
  u: G => setStick(G, 0, 1),                                                              // stick forward
  t: G => { tuckOn(G, true); G.blindT = 0.5 + Math.random() * 4; },                      // hold tuck a while
  o: G => chute(G),                                                                       // tap CHUTE
  f: G => { flareOn(G, true); G.blindT = 0.3 + Math.random() * 3; },                     // hold flare a while
};
// HONEST: a jumper who looks: in freefall flies towards a point upwind of the X and opens at the marks (a little early or
// late); under the canopy picks the heading and brakes whose straight-line landing comes nearest, turning to face the wind
// for the last part; flares near the ground. react: seconds behind; acc: how steady the thumb is.
function honest(G, o, mem) {
  if (G.over) return; const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, p = G.p, R = Math.random;
  if (G.t < (mem.next || 0)) return; mem.next = G.t + 0.08 + react * 0.3; const h = agl(G), T = G.T;
  if (mem.openH == null) mem.openH = DEPLOY[0] + 50 + R() * (DEPLOY[1] - DEPLOY[0] - 100) + (1 - acc) * (R() - 0.5) * 300;
  const turnTo = (yaw, k2 = 1.6) => { let d = yaw - p.yaw; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return clamp(d * k2, -1, 1) + (1 - acc) * (R() - 0.5) * 0.5; };
  if (p.phase === 'free') {
    let goal = { x: T.x - G.W.lo.x * 25, z: T.z - G.W.lo.z * 25, y: surfAt(G, T.x, T.z) + mem.openH };   // upwind of the X: the canopy will drift back
    const nr = G.rings.find(r => !r.done && !r.miss && r.y < p.y - 20); if (nr && (G.cfg.course || (G.lesson && G.lesson.id === 'fly'))) goal = nr;
    const tR = Math.max(1.5, (p.y - goal.y) / 44), w = windAt(G, h), ax = (goal.x - p.x) / tR - w.x, az = (goal.z - p.z) / tR - w.z, need = Math.hypot(ax, az);   // the air speed that gets there in time
    setStick(G, turnTo(Math.atan2(az, ax)), clamp((need - 4) / 18, 0, 1)); tuckOn(G, false);
    if (h < mem.openH && !(G.lesson && G.lesson.id === 'fly')) chute(G);
    return; }
  if (p.phase !== 'canopy') return;
  // under the canopy: fly a pattern. Above 60 m, aim to be downwind of the X at 60 m (heading and brakes whose straight flight
  // passes nearest that point); then the final, into the wind, choosing what lands nearest the X.
  const wl = windAt(G, 20), ws = Math.hypot(wl.x, wl.z) || 0.01, upw = Math.atan2(-wl.z, -wl.x), FH = 95, gsF = Math.max(3, 14 - ws), A = { x: T.x + wl.x / ws * (FH / 9) * gsF * 0.55, z: T.z + wl.z / ws * (FH / 9) * gsF * 0.55 }; let best = null;
  for (let i = 0; i < 36; i++) for (const br of [0, 0.5, 1]) { const yaw = i / 36 * TAU; let cost;
    if (h > FH + 5) { const P = predictLand(G, yaw, br, FH); cost = Math.hypot(P.x - A.x, P.z - A.z); }
    else { const P = predictLand(G, yaw, br); cost = Math.hypot(P.x - T.x, P.z - T.z); let dd = yaw - upw; while (dd > Math.PI) dd -= TAU; while (dd < -Math.PI) dd += TAU; if (h < 25) cost += Math.abs(dd) * 12; }
    if (!best || cost < best.cost) best = { yaw, br, cost }; }
  setStick(G, turnTo(best.yaw, 2), -best.br);
  if (mem.flareH == null) mem.flareH = 3 + R() * 2.5 + (1 - acc) * (R() - 0.5) * 8 + react * 3;
  flareOn(G, h < mem.flareH);
}
function winNow(G) { if (!G || G.over || G.lesson) return; G.landed = { d: 0, q: 'soft', vs: 1, hs: 2 }; G.p.phase = 'landed'; G.score = 1300; finish(G, true); }
