// ===================== RULES: Balloon Drift =====================
// A hot air balloon cannot be steered: it goes where the wind at its height goes. The winds blow different ways at different
// heights, so you steer by climbing or sinking into the layer that carries you where you want to go. Hold to burn (the
// envelope warms, slowly, and you rise), let go to cool and sink, flick down to vent (sink faster). Drop a marker on each X
// (the closer, the more points), then land softly in the landing field. Units: metres; x east, z north, y up.

const RULES = [
  '<b>Hold anywhere to fire the burner</b>: the balloon warms and rises, a little late. Let go and it cools and sinks. Tap <b>VENT</b> to sink faster.',
  '<b>You cannot steer, the wind does.</b> The bar on the right shows the wind at each height: climb or sink into the one that carries you to the X.',
  '<b>🎯 Drop a marker</b> when the ring on the ground (where it will land) is on the X. Closer is more points.',
  '<b>Land softly in the landing field</b> (the green square): sink slowly, a short burn just before the ground.',
  'Mind the fuel. Stay clear of power lines. Points enough and a soft landing for the next flight; a bullseye and no bumps for three stars.',
];
const PLACES = [{ name: 'Farmland', sky: 'morning' }, { name: 'Vineyards', sky: 'golden' }, { name: 'Red canyon', sky: 'morning' }, { name: 'Alpine meadows', sky: 'noon' }, { name: 'Lakes at dusk', sky: 'sunset' }];
const placeOf = N => N <= 4 ? 0 : N <= 9 ? 1 : N <= 15 ? 2 : N <= 22 ? 3 : 4;
const SKINS = [{ id: 'sun', name: 'Sunrise', top: 0xf2a03a, bot: 0xd8402a, stars: 0 }, { id: 'sea', name: 'Seaside', top: 0x2a9ad8, bot: 0xf2f2f2, stars: 6 }, { id: 'lime', name: 'Lime', top: 0x8ad040, bot: 0x2a6a3a, stars: 14 },
  { id: 'berry', name: 'Berry', top: 0xb02a6a, bot: 0xf2c23a, stars: 24 }, { id: 'night', name: 'Night sky', top: 0x2a2a6a, bot: 0xf2d86a, stars: 36 }, { id: 'rainbow', name: 'Rainbow', top: 0xe8402a, bot: 0x2ab0e8, stars: 50 }];
const UPGRADES = [{ id: 'tank', name: 'Bigger tank', max: 2, cost: l => [60, 140][l], desc: 'More fuel for each flight.' }, { id: 'burner', name: 'Double burner', max: 2, cost: l => [70, 160][l], desc: 'The balloon answers a little sooner.' },
  { id: 'marker', name: 'Heavy markers', max: 1, cost: () => 110, desc: 'Markers drift less on the way down.' }];
const upLv = id => { if (typeof HEADLESS !== 'undefined' && HEADLESS) return 0; return ((store.get('ups', {}) || {})[id]) | 0; };
const RANKS = [[0, 'Passenger'], [60, 'Student pilot'], [200, 'Pilot'], [500, 'Competition pilot'], [1100, 'Champion'], [2500, 'Sky legend']];
const TOP = 260;      // the highest the balloon may go (the airspace ceiling)

function makeCfg(N, help) {
  const f = curve(N), e = easyOf(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s));
  return { N, f, e, help: !!help, place: placeOf(N),
    layers: N <= 2 ? 2 : N <= 6 ? 3 : 4, targets: N <= 1 ? 1 : N <= 5 ? 2 : 3, lines: N >= 4, shift: N >= 7, thermals: N >= 9,
    fuel: x(1.25, 0.8, 22) * (help ? 1.3 : 1) * (1 + 0.15 * upLv('tank')),      // fuel against what a steady flight needs
    goal: x(0.38, 0.44, 24) * (help ? 0.75 : 1),                               // share of the best possible points needed
    speed: x(4.5, 7.5, 25), land: N >= 2 };
}
// ---------- the winds: layers that turn with height (and slowly with time, later) ----------
function makeWinds(G, R) { const c = G.cfg, L = []; let dir = R() * TAU; const n = c.layers;
  for (let i = 0; i < n; i++) { L.push({ y: 30 + i * 70, dir, sp: c.speed * (0.7 + 0.5 * R()) * (0.75 + i * 0.15) }); dir += (Math.PI * 2 / 3 + (R() - 0.5) * 0.7) * (R() < 0.85 ? 1 : -1); }
  return L; }
function windAt(G, y) { const L = G.winds; if (y <= L[0].y) return wv(L[0], G); if (y >= L[L.length - 1].y) return wv(L[L.length - 1], G);
  for (let i = 0; i < L.length - 1; i++) if (y >= L[i].y && y <= L[i + 1].y) { const u = (y - L[i].y) / (L[i + 1].y - L[i].y), s = u * u * (3 - 2 * u), a = wv(L[i], G), b = wv(L[i + 1], G); return { x: a.x + (b.x - a.x) * s, z: a.z + (b.z - a.z) * s }; } }
const wv = (l, G) => { const d = l.dir + (G.cfg.shift ? Math.sin(G.t * 0.025 + l.y) * 0.22 : 0); return { x: Math.cos(d) * l.sp, z: Math.sin(d) * l.sp }; };
// ---------- the ground: gentle hills, power lines, the targets and the landing field ----------
function groundAt(G, x, z) { const h = Math.sin(x * 0.006 + G.seed % 7) * 8 + Math.sin(z * 0.005 + x * 0.002) * 10 + Math.sin((x + z) * 0.013) * 3; return Math.max(0, h + (G.cfg.place === 2 ? 6 : G.cfg.place === 3 ? 14 : 0)); }
// a flight that can be flown: simulate a pilot from the start, going through the layers, to place the targets on reachable paths
function makeFlight(G, R) {
  const c = G.cfg, T = [], start = { x: 0, z: 0 };
  // fly a plan with a simple balloon (climb and sink at about 2 m/s, carried by the wind at its height); the X goes where it gets to
  let p = { x: 0, z: 0, y: 0 }; const t0 = G.t; G.t = 8; const fly = (y1, secs) => { for (let t = 0; t < secs; t += 0.5) { p.y += clamp(y1 - p.y, -1, 1); const w = windAt(G, p.y); p.x += w.x * 0.5; p.z += w.z * 0.5; G.t += 0.5; } };
  for (let i = 0; i < c.targets; i++) { const a = (R() * G.winds.length) | 0, b2 = (a + 1 + ((R() * (G.winds.length - 1)) | 0)) % G.winds.length; fly(G.winds[a].y, 9 + R() * 15); fly(G.winds[b2].y, 7 + R() * 15); T.push({ x: p.x, z: p.z, r: 30, mark: null, i }); }
  fly(G.winds[0].y, 16 + R() * 12); const field = { x: p.x, z: p.z, half: 70 }; const planT = G.t - 8; G.t = t0;      // the field: down to the lowest wind after the last X, and ride it in
  // power lines: across the way, low (stay above them, or go round)
  const lines = []; if (c.lines) { const want = 1 + (c.N > 12 ? 1 : 0) + (c.N > 25 ? 1 : 0), pts = [start].concat(T, [field]);
    for (let k2 = 0; k2 < 40 && lines.length < want; k2++) { const s = (R() * (pts.length - 1)) | 0, a2 = pts[s], b3 = pts[s + 1], u = 0.35 + R() * 0.3, q = { x: a2.x + (b3.x - a2.x) * u, z: a2.z + (b3.z - a2.z) * u };
      if (pts.some(p2 => Math.hypot(p2.x - q.x, p2.z - q.z) < 70) || lines.some(L => Math.hypot((L.x0 + L.x1) / 2 - q.x, (L.z0 + L.z1) / 2 - q.z) < 120)) continue;      // never right by the start, an X or the field
      const ang = Math.atan2(b3.z - a2.z, b3.x - a2.x) + Math.PI / 2 + (R() - 0.5) * 0.5; lines.push({ x0: q.x - Math.cos(ang) * 200, z0: q.z - Math.sin(ang) * 200, x1: q.x + Math.cos(ang) * 200, z1: q.z + Math.sin(ang) * 200, h: 16 }); } }
  const thermals = []; if (c.thermals) for (let i = 0; i < 3; i++) { const tg = T[(R() * T.length) | 0]; thermals.push({ x: tg.x + (R() - 0.5) * 300, z: tg.z + (R() - 0.5) * 300, r: 50 + R() * 40, up: 1.2 + R() * 0.8 }); }
  return { start, T, field, lines, thermals, planT };
}
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0, R = rng(seed + 11);
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, mini: !!o.mini };
  G.winds = makeWinds(G, R); G.F = makeFlight(G, R);
  G.b = { x: 0, y: groundAt(G, 0, 0), z: 0, vx: 0, vy: 0, vz: 0, heat: 0.42, burn: false, vent: 0, landed: true, air: false };
  G.fuel0 = estimateFuel(G) * cfg.fuel; G.fuel = G.fuel0; G.ti = 0; G.score = 0; G.bumps = 0; G.markers = []; G.phase = 'fly'; G.limit = Math.max(80, G.F.planT * 2.3 + 25); G.best = (G.F.T.length + (cfg.land ? 1 : 0)) * 1000;
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G);
  return G;
}
// roughly how much burning a steady flight needs (what a calm pilot uses): time aloft x the burn to hold height, plus climbs
function estimateFuel(G) { let d = 0, p = G.F.start; for (const t of G.F.T) { d += Math.hypot(t.x - p.x, t.z - p.z); p = t; } d += Math.hypot(G.F.field.x - p.x, G.F.field.z - p.z); return 30 + d / G.cfg.speed * 0.45; }
const neutral = y => 0.42 + y / 1500;      // y here is the height above the ground      // the heat that holds the balloon level at this height (thinner air higher up)
// ---------- the player's actions ----------
function burn(G, on) { if (G.over || G.phase !== 'fly') return false; const was = G.b.burn; G.b.burn = !!on && G.fuel > 0; if (G.b.burn && !was) G.ev.push({ k: 'burn' }); return true; }
function vent(G) { if (G.over || G.phase !== 'fly') return false; G.b.vent = 1.0; G.b.burn = false; G.ev.push({ k: 'vent' }); return true; }
function dropMarker(G) { if (G.over || G.phase !== 'fly') return false; const t = G.F.T[G.ti]; if (!t || G.b.landed || G.markers.some(m => m.falling)) return false;
  const b = G.b; G.markers.push({ x: b.x, y: b.y - 3, z: b.z, vx: b.vx, vz: b.vz, vy: 0, falling: true, ti: G.ti }); G.ev.push({ k: 'drop', ti: G.ti }); G.ti++; return true; }
// where a marker dropped now would land (the ring on the ground): the same fall, worked out ahead
function predictDrop(G, s) { const b = s || G.b; let x = b.x, y = b.y - 3, z = b.z, vx = b.vx, vz = b.vz, vy = 0, dt = 0.1, drag = 1.2 * (1 - 0.35 * upLv('marker'));
  for (let i = 0; i < 400; i++) { const w = windAt(G, y - groundAt(G, x, z)); vx += (w.x - vx) * Math.min(1, drag * dt); vz += (w.z - vz) * Math.min(1, drag * dt); vy = Math.max(-14, vy - 9.8 * dt); x += vx * dt; z += vz * dt; y += vy * dt; if (y <= groundAt(G, x, z)) break; } return { x, z }; }
// ---------- every frame ----------
function step(G, dt) {
  if (G.over || !(dt > 0)) return; G.t += dt; if (G.lesson) lessonTick(G, dt); if (G.blindHold != null) { G.blindHold -= dt; if (G.blindHold <= 0) { G.blindHold = null; burn(G, false); } }
  const b = G.b, c = G.cfg, gnd = groundAt(G, b.x, b.z);
  if (G.phase === 'landed') { G.landT -= dt; if (G.landT <= 0) finishFlight(G); return; }
  // the envelope's heat: the burner warms it (a little late), the air cools it, the vent lets it out
  if (b.burn && G.fuel <= 0) { b.burn = false; G.ev.push({ k: 'nofuel' }); }
  if (b.burn) { b.heat += dt * 0.09 * (1 + 0.15 * upLv('burner')); G.fuel = Math.max(0, G.fuel - dt); }
  b.heat -= dt * (0.03 + (b.vent > 0 ? 0.12 : 0)); b.vent = Math.max(0, b.vent - dt);
  let th = 0; for (const T of G.F.thermals) if (Math.hypot(b.x - T.x, b.z - T.z) < T.r && b.y - gnd < 200) th = T.up;
  const agl = b.y - gnd;
  const lift = (b.heat - neutral(agl)) * 45 + th * 0.6; b.vy += (lift - b.vy * 0.5) * dt; b.vy = clamp(b.vy, -6, 5);
  if (agl >= TOP && b.vy > 0) { b.vy = 0; b.heat = Math.min(b.heat, neutral(TOP) + 0.004); }
  if (!b.landed) { const w = windAt(G, agl); const k2 = 1 - Math.exp(-dt / 2.2); b.vx += (w.x - b.vx) * k2; b.vz += (w.z - b.vz) * k2; b.x += b.vx * dt; b.z += b.vz * dt; }
  b.y += b.vy * dt;
  if (b.y > gnd + 1.5) { if (b.landed) { b.landed = false; b.air = true; } }
  if (b.y <= gnd) { b.y = gnd; if (!b.landed) touchDown(G, -b.vy); b.vy = Math.max(0, b.vy); b.landed = true; b.vx *= 0.9; b.vz *= 0.9; }
  // power lines: brushing them ends the flight (go over them, or round)
  for (const L of G.F.lines) { const d = segDist(b.x, b.z, L); if (d < 6 && b.y - groundAt(G, b.x, b.z) < L.h + 4 && !b.landed) { G.ev.push({ k: 'wires' }); return finish(G, false, 'wires'); } if (d < 60 && b.y - gnd < L.h + 25 && !b.landed && !G.warnedL) { G.warnedL = true; G.ev.push({ k: 'lineswarn' }); } }
  // markers falling
  for (const m of G.markers) if (m.falling) { const w = windAt(G, m.y - groundAt(G, m.x, m.z)), drag = 1.2 * (1 - 0.35 * upLv('marker')); m.vx += (w.x - m.vx) * Math.min(1, drag * dt); m.vz += (w.z - m.vz) * Math.min(1, drag * dt); m.vy = Math.max(-14, m.vy - 9.8 * dt); m.x += m.vx * dt; m.z += m.vz * dt; m.y += m.vy * dt;
    if (m.y <= groundAt(G, m.x, m.z)) { m.falling = false; const t = G.F.T[m.ti], d = Math.hypot(m.x - t.x, m.z - t.z), pts = Math.round(1000 * Math.max(0, 1 - d / 120) ** 2); m.d = d; m.pts = pts; t.mark = m; G.score += pts; G.ev.push({ k: 'mark', ti: m.ti, d, pts }); lessonSee(G, 'mark', d); } }
  // a target left far behind (the wind took you past it): it is lost; the next one is up
  if (!G.lesson && G.t > G.limit && G.ti < G.F.T.length && !G.late) { G.late = true; G.ev.push({ k: 'late', n: G.F.T.length - G.ti }); G.ti = G.F.T.length; }      // the morning is over: time to land
  const t = G.F.T[G.ti]; if (t && !G.lesson) { const d = Math.hypot(b.x - t.x, b.z - t.z); t.minD = Math.min(t.minD == null ? 1e9 : t.minD, d); if (t.minD < 400 && d > t.minD + 650) { G.ev.push({ k: 'passed', ti: G.ti }); G.ti++; } }
  if (!G.lesson && G.fuel <= 0 && b.landed && b.air) touchDown(G, 0);
}
function segDist(x, z, L) { const dx = L.x1 - L.x0, dz = L.z1 - L.z0, u = clamp(((x - L.x0) * dx + (z - L.z0) * dz) / (dx * dx + dz * dz), 0, 1); return Math.hypot(x - (L.x0 + dx * u), z - (L.z0 + dz * u)); }
const inField = (G, x, z) => Math.abs(x - G.F.field.x) < G.F.field.half && Math.abs(z - G.F.field.z) < G.F.field.half;
function touchDown(G, v) { const b = G.b; if (!b.air) return; const hard = v > 2.2, inF = inField(G, b.x, b.z);
  if (G.lesson) { G.ev.push({ k: 'touch', hard }); return; }
  if (hard) { G.bumps++; G.ev.push({ k: 'bump', v }); b.vy = Math.min(2.5, v * 0.35); b.y += 0.5; b.landed = false; if (G.bumps >= 3) return finish(G, false, 'bumps'); return; }
  const allDone = G.ti >= G.F.T.length && !G.markers.some(m => m.falling);
  if (G.fuel <= 0 || allDone) { b.vx = b.vz = 0; G.phase = 'landed'; G.landT = 1.6; G.inField = inF; const d = Math.hypot(b.x - G.F.field.x, b.z - G.F.field.z); G.landD = d; G.landPts = G.cfg.land ? Math.round(1000 * Math.max(0, 1 - d / 260) ** 2) : 0; G.score += G.landPts; G.ev.push({ k: 'landed', inF, v, d, pts: G.landPts }); return; }
  G.ev.push({ k: 'touch', hard: false }); }      // a soft touch outside the field: off you go again
function finishFlight(G) { const c = G.cfg, need = G.best * c.goal, ok = G.score >= need; finish(G, ok, ok ? null : 'points'); }
function finish(G, win, why) { if (G.over) return; G.over = win ? 'won' : 'lost'; const bull = G.F.T.some(t => t.mark && t.mark.d < 10);
  const stars = win ? (G.bumps === 0 && G.score >= G.best * Math.min(0.85, G.cfg.goal + 0.25) ? 3 : G.bumps <= 1 ? 2 : 1) : 0;
  const coins = win ? 8 + Math.round(G.score / 100) + stars * 4 + (bull ? 6 : 0) : Math.round(G.score / 200);
  G.res = { win, why, stars, coins, score: G.score, need: Math.round(G.best * G.cfg.goal), best: G.best, bumps: G.bumps, marks: G.F.T.map(t => t.mark ? Math.round(t.mark.d) : null), fuel: Math.round(G.fuel / G.fuel0 * 100), bull, time: G.t };
  G.ev.push({ k: win ? 'won' : 'lost', why }); }

// ---------- LESSONS: rise to the ring, sink to the ring, drop on the X ----------
const AIMCARD = {"pic": "🎈", "win": "DROP ON THE X, LAND SOFT", "lose": "RUN OUT OF FUEL", "how": "HOLD TO RISE, LET GO TO SINK"};      // the aim card: specs/aims.json (tools/aims.py)
const LESSONS = {
  1: [{ id: 'rise', title: 'BURN TO RISE', say: G => heightCue(G, G.lesson.y)[0], do: G => heightCue(G, G.lesson.y)[1], at: G => heightCue(G, G.lesson.y)[2], how: 'Hold anywhere: the burner warms the balloon and it rises, a little late. Let go before the ring: it keeps going a moment. Stop inside the gold ring, twice.', need: 2 }],
  2: [{ id: 'wind', title: 'STEER BY HEIGHT', say: G => heightCue(G, G.winds[G.lesson.layer].y + 8)[0], do: G => heightCue(G, G.winds[G.lesson.layer].y + 8)[1], at: G => heightCue(G, G.winds[G.lesson.layer].y + 8)[2], how: 'The winds blow different ways at different heights (the arrows on the right). Climb or sink into the one that blows you to the gold flag.', need: 2 }],
  3: [{ id: 'drop', title: 'DROP ON THE X', say: G => dropCue(G) ? 'TAP 🎯 NOW!' : 'WAIT FOR THE X…', do: G => dropCue(G) ? 'tap' : 'wait', at: G => dropCue(G) ? [layout(G).drop.x, layout(G).drop.y] : false, how: 'The ring on the ground shows where a marker would land. When it crosses the X, tap 🎯. Get within 40 m, twice.', need: 2 }],
};
// THE TUTORIAL SHOWS ONE MOVE AT A TIME, the move for this moment (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing
// happens"). It said HOLD TO GO UP for the whole lesson, but the lesson is done by STOPPING in the ring: hold, then let go early (the balloon
// keeps rising a moment), wait, or vent if too high. Where the balloon will stop if he lets go now: its height, plus what its climb and its
// spare heat will still give.
function heightCue(G, want) { const b = G.b, agl = b.y - groundAt(G, b.x, b.z), spare = b.heat - neutral(agl), fut = agl + b.vy * 2.2 + Math.max(0, spare) * 70, L = layout(G);
  if (fut < want - 8) return [b.burn ? 'KEEP HOLDING' : 'HOLD TO GO UP', 'hold', [W / 2, H * 0.55]];
  if (b.burn) return ['LET GO', 'release', [W / 2, H * 0.55]];
  if (fut > want + 22 && b.vy > -1.5) return ['TAP VENT TO GO DOWN', 'tap', [L.vent.x, L.vent.y]];
  return ['WAIT…', 'wait', false]; }
function dropCue(G) { const t = G.F.T[G.ti]; if (!t || G.b.landed || G.markers.some(m => m.falling)) return false; const p = predictDrop(G); return Math.hypot(p.x - t.x, p.z - t.z) < 32; }
function lessonStart(G) { const st = LESSONS[G.N][0]; G.lesson = { steps: LESSONS[G.N], i: 0, n: 0, id: st.id }; G.ev.push({ k: 'lessonnext', first: true }); G.fuel = G.fuel0 = 1e9;
  const b = G.b; b.y = groundAt(G, b.x, b.z) + 45; b.heat = neutral(45); b.landed = false; b.air = true; lessonGoal(G); }      // the lessons start in the air
function lessonGoal(G) { const D = G.lesson, b = G.b, R = G.rnd;
  if (D.id === 'rise') { const ag = b.y - groundAt(G, b.x, b.z); D.y = clamp(ag + (D.n % 2 ? -1 : 1) * (30 + R() * 15), 30, TOP - 30); D.hold = 0; }
  if (D.id === 'wind') { D.layer = (D.n + 1) % G.winds.length; const L = G.winds[D.layer], w = wv(L, G), s = Math.hypot(w.x, w.z); let x = b.x, z = b.z, y = b.y - groundAt(G, b.x, b.z); for (let t = 0; t < 120 && Math.abs(y - L.y - 8) > 2; t += 0.5) { y += clamp(L.y + 8 - y, -1, 1); const w2 = windAt(G, y); x += w2.x * 0.5; z += w2.z * 0.5; }
    D.fx = x + w.x / s * 90; D.fz = z + w.z / s * 90; }      // past where you will be once you are in that wind, along it
  if (D.id === 'drop') { const s = { x: b.x, y: b.y, z: b.z, vx: b.vx, vz: b.vz }, agl = b.y - groundAt(G, b.x, b.z);      // fly 20 s ahead at this height: the X goes where the ring will be then
    for (let t = 0; t < 20; t += 0.1) { const w = windAt(G, agl), k2 = 1 - Math.exp(-0.1 / 2.2); s.vx += (w.x - s.vx) * k2; s.vz += (w.z - s.vz) * k2; s.x += s.vx * 0.1; s.z += s.vz * 0.1; s.y = groundAt(G, s.x, s.z) + agl; }
    const p = predictDrop(G, s); G.F.T = [{ x: p.x, z: p.z, r: 30, mark: null, i: 0 }]; G.ti = 0; G.markers = []; }      // straight ahead on the wind you are in
  G.ev.push({ k: 'lgoal' }); }
function lessonSee(G, what, d) { const D = G.lesson; if (!D || D.done) return;
  if (D.id === 'drop' && what === 'mark') { if (d < 40) lessonOk(G); else { G.ev.push({ k: 'lessonmiss', how: D.steps[0].how }); lessonGoal(G); } } }
function lessonOk(G) { const D = G.lesson; D.n++; G.ev.push({ k: 'lessonok', n: D.n, need: D.steps[0].need }); if (D.n >= D.steps[0].need) { D.done = true; D.wait = 1.4; } else lessonGoal(G); }
function lessonTick(G, dt) { const D = G.lesson; if (D.done) { D.wait -= dt; if (D.wait <= 0) { G.lesson = null; const R = rng(G.seed + 11); G.winds = makeWinds(G, R); G.F = makeFlight(G, R); Object.assign(G.b, { x: 0, z: 0, y: groundAt(G, 0, 0), vx: 0, vy: 0, vz: 0, heat: 0.42, burn: false, landed: true, air: false }); G.fuel0 = estimateFuel(G) * G.cfg.fuel; G.fuel = G.fuel0; G.ti = 0; G.score = 0; G.bumps = 0; G.markers = []; G.limit = G.t + Math.max(80, G.F.planT * 2.3 + 25); G.ev.push({ k: 'lessondone', N: G.N }); } return; }
  const b = G.b;
  if (D.id === 'rise') { if (Math.abs(b.y - groundAt(G, b.x, b.z) - D.y) < 14 && Math.abs(b.vy) < 1.0) { D.hold += dt; if (D.hold > 1.2) lessonOk(G); } else D.hold = 0; }
  if (D.id === 'wind') { if (Math.hypot(b.x - D.fx, b.z - D.fz) < 55) lessonOk(G); else if (Math.hypot(b.x - D.fx, b.z - D.fz) > 450) lessonGoal(G); }
  if (D.id === 'drop') { const t = G.F.T[0]; if (t && !G.markers.length && Math.hypot(b.x - t.x, b.z - t.z) > 650 && (t.minD = Math.min(t.minD || 1e9, Math.hypot(b.x - t.x, b.z - t.z))) < 600) lessonGoal(G); else if (t) t.minD = Math.min(t.minD || 1e9, Math.hypot(b.x - t.x, b.z - t.z)); if (G.ti > 0 && !G.markers.some(m => m.falling) && !D.done && G.markers.length && G.markers[G.markers.length - 1].pts == null) {} }
  if (b.landed && b.air && D.id !== 'rise') { b.heat = Math.max(b.heat, neutral(0) + 0.02); } }

// ---------- for the robots: blind moves and an honest pilot ----------
const BLIND = {
  b: G => { burn(G, true); G.blindHold = 0.3 + Math.random() * 2.5; },      // hold the burner a while
  s: G => { burn(G, true); G.blindHold = 0.15; },                            // a quick blip
  v: G => vent(G),
  d: G => dropMarker(G),
  o: G => { burn(G, false); G.blindHold = null; },
};
// HONEST: a pilot who reads the winds: picks the height whose wind carries the balloon closest to the next X (or the field),
// holds it with the burner (a little late, like a person), drops when the ring is about to cross the X, and lands slowly.
function honest(G, o, mem) {
  if (G.over) return; const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random, b = G.b;
  if (G.phase !== 'fly') return;
  if (G.t >= (mem.next || 0)) { mem.next = G.t + (G.ti >= G.F.T.length ? 0.4 : 1.2) + react * 2;
    let goal = null; if (G.lesson) { const D = G.lesson; if (D.id === 'rise') { mem.want = D.y; mem.mode = 'hold'; } else if (D.id === 'wind') { mem.want = G.winds[D.layer].y + 8; mem.mode = 'hold'; } else goal = G.F.T[G.ti]; }
    else goal = G.F.T[G.ti] || null;
    if (G.lesson && G.lesson.id === 'drop') { if (mem.dropFor !== G.F.T[0]) { mem.dropFor = G.F.T[0]; mem.want = b.y - groundAt(G, b.x, b.z); mem.mode = 'hold'; } }
    else if (!G.lesson) {
      if (goal) { mem.want = bestHeight(G, goal, 70); mem.mode = 'hold'; }
      else if (G.cfg.land) { const f = G.F.field, L = predictLand(G), miss = Math.hypot(L.x - f.x, L.z - f.z);
        if (mem.mode === 'land' || (L.ok && ((mem.lm != null && miss > mem.lm + (mem.lm < 110 ? 3 : 25)) || miss < 30)) || G.fuel < G.fuel0 * 0.12) mem.mode = 'land';
        else { mem.lm = mem.lm == null ? miss : Math.min(mem.lm, miss); const aim = { x: f.x - (L.x - b.x), z: f.z - (L.z - b.z) }; mem.want = bestHeight(G, aim, 60); mem.mode = 'hold'; } }      // aim upwind of the field by the drift of the way down; go down when that is as close as it gets
      else mem.mode = 'land';
      mem.want += (1 - acc) * (R() - 0.5) * 80; } }
  // the burner: aim the heat at what holds the wanted height, plus a nudge towards it (a little slow, like a hand)
  const gnd = groundAt(G, b.x, b.z);
  // the burner: aim the envelope's heat at the heat that gives the climb or sink wanted (the heat is what the burner changes)
  const h = b.y - gnd; let vyT; if (mem.mode === 'land') vyT = h > 30 ? -2.2 : h > 8 ? -1.5 : -0.8; else vyT = clamp((mem.want - h) * 0.045, -2.5, 2.5);
  const heatT = neutral(h) + vyT * 0.5 / 45 + (vyT - b.vy) * 0.004; if (b.heat < heatT - 0.004) burn(G, true); else { burn(G, false); if (b.heat > heatT + 0.04 && !b.vent) vent(G); }
  // drop the marker when the ring is closest to the X
  const t = G.F.T[G.ti]; if (t && !G.lesson || (G.lesson && G.lesson.id === 'drop' && t)) { if (mem.pdFor !== t) { mem.pd = null; mem.pdFor = t; } if (!b.landed && !G.markers.some(m => m.falling)) { const p = predictDrop(G), d = Math.hypot(p.x - t.x, p.z - t.z); if (mem.pd != null && d > mem.pd + 3 && (mem.pd < (G.lesson ? 999 : 45 + (1 - acc) * 80) || d > 260)) { dropMarker(G); mem.pd = null; } else mem.pd = mem.pd == null ? d : Math.min(mem.pd, d); } }
}
// where the balloon would touch down if it started a calm descent now (and whether that path stays clear of the wires)
function predictLand(G) { const b = G.b; let x = b.x, z = b.z, h = b.y - groundAt(G, b.x, b.z), ok = true;
  for (let t = 0; t < 200 && h > 0; t += 0.5) { const vy = h > 30 ? -2.2 : h > 8 ? -1.5 : -0.8, w = windAt(G, h); x += w.x * 0.5; z += w.z * 0.5; h += vy * 0.5; for (const Ln of G.F.lines) if (h < Ln.h + 6 && segDist(x, z, Ln) < 10) ok = false; }
  return { x, z, ok }; }
// the height whose wind (held for a while) brings the balloon nearest the goal
function bestHeight(G, goal, lookT) { const b = G.b, ag = b.y - groundAt(G, b.x, b.z); let best = ag, bd = 1e9;
  for (let y = 25; y <= TOP - 5; y += 10) { let px = b.x, pz = b.z, py = ag, m = 1e9;      // fly it ahead: climb or sink to y (about 2 m/s), carried by the wind on the way
    for (let t = 0; t < lookT; t += 0.5) { py += clamp(y - py, -1, 1); const w = windAt(G, py); px += w.x * 0.5; pz += w.z * 0.5; m = Math.min(m, Math.hypot(goal.x - px, goal.z - pz)); }
    const d = m + 0.3 * Math.hypot(goal.x - px, goal.z - pz) + Math.abs(y - ag) * 0.05 + (y < 30 && G.F.lines.length ? 30 : 0); if (d < bd) { bd = d; best = y; } }
  return best; }
function winNow(G) { if (!G || G.over || G.lesson) return; G.score = G.best; G.inField = true; G.phase = 'landed'; G.landT = 0.01; step(G, 0.02); }
