// ===================== RULES: Soar (game 11) =====================
// The calm one: you fly, seen from just behind your shoulder, over a sea of islands, and follow a trail of golden rings. One thumb
// steers: put it down anywhere and move it the way you want to go (left and right bank and turn you; up climbs, down dives).
// Diving gains speed, climbing costs it. Nothing kills you: touch the land or the sea and you skim off it, losing your chain.
// Fly through enough of the trail's rings to finish the flight. World: metres, y up, the trail starts heading toward -z.

const RULES = [
  '<b>Fly with one thumb.</b> Put it down anywhere and move it the way you want to go: left or right to turn, up to climb, down to dive.',
  '<b>Follow the rings of light.</b> A trail of sparks leads to the next one, the brightest. Fly through its middle.',
  '<b>Dive to speed up, climb to slow down.</b> Let go and you level out.',
  '<b>Rings in a row make a chain</b>, and each one rings a higher note.',
  'Nothing can hurt you. Skim the sea or a hillside and you bounce off, but the chain breaks.',
  'Fly through enough rings to finish the flight. All of them for three stars.',
];
const WEATHERS = ['golden', 'morning', 'sunset', 'dawn', 'mist', 'noon', 'dusk', 'night', 'overcast'];
function weatherOf(N) { if (N <= 2) return ['golden', 'morning'][N - 1]; const R = rng(N * 6007 + 5); R(); return WEATHERS[(R() * WEATHERS.length) | 0]; }

// the land: islands rising from the sea, the same for the rules and the picture (deterministic noise)
function landNoise(seed) {
  const R = rng(seed), P = new Uint8Array(512), p = []; for (let i = 0; i < 256; i++) p.push(i); for (let i = 255; i > 0; i--) { const j = (R() * (i + 1)) | 0; [p[i], p[j]] = [p[j], p[i]]; } for (let i = 0; i < 512; i++) P[i] = p[i & 255];
  const fade = t => t * t * t * (t * (t * 6 - 15) + 10), grad = (h, x, y) => { const u = h & 1 ? x : -x, v = h & 2 ? y : -y; return (h & 4 ? u + v : u - v) * 0.7; };
  const n2 = (x, y) => { const X = Math.floor(x) & 255, Y = Math.floor(y) & 255; x -= Math.floor(x); y -= Math.floor(y); const u = fade(x), v = fade(y), a = P[X] + Y, b = P[X + 1] + Y;
    return (grad(P[a], x, y) * (1 - u) + grad(P[b], x - 1, y) * u) * (1 - v) + (grad(P[a + 1], x, y - 1) * (1 - u) + grad(P[b + 1], x - 1, y - 1) * u) * v; };
  return (x, z) => { let h = 0, a = 1, f = 1 / 520; for (let o = 0; o < 5; o++) { h += a * n2(x * f + 17, z * f + 31); a *= 0.5; f *= 2.05; } return h; };
}
function landOf(seed) { const n = landNoise(seed); return (x, z) => { const v = n(x, z), d = Math.hypot(x, z) / 3000; const isl = (v + 0.02 - 0.12 * d) * 1.6; return isl <= 0 ? isl * 60 - 4 : Math.pow(isl, 1.7) * 170 + isl * 18; }; }

function makeCfg(N, help) {
  const f = curve(N), e = easyOf(N), boss = N % 10 === 0, x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s));
  const rings = Math.round(x(14, 30, 30)) + (boss ? 6 : 0);
  return { N, f, e, boss, help: !!help, rings,
    goal: Math.ceil(rings * (x(0.62, 0.8, 30) - 0.1 * e - (help ? 0.08 : 0))),     // rings needed to finish
    r: (x(9, 3.3, 30) + 2 * e) * (help ? 1.2 : 1),                                // ring radius (m)
    gap: x(56, 52, 30),                                                             // metres between rings
    turn: x(0.22, 0.95, 30),                                                       // how hard the trail bends between rings (rad)
    // (23 Nov 2026, his review: "Make the game easier let me see the rings and be able to slowly go into them".) You used to fly at 22 m/s on every
    // flight; the first flights are now half that, the rings bigger and closer together, the trail straighter; the speed comes back over the flights.
    cruise: (x(12.5, 25, 30) - 1.5 * e) * (help ? 0.9 : 1),                         // the speed you settle to (m/s)
    climb: x(8, 26, 30),                                                           // how much it rises or falls between rings (m)
    gust: x(0, 0.9, 25) * (1 - e),                                                 // wind that pushes you off line
    low: N >= 4 };                                                                  // the trail dips into valleys and between islands
}
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null,
    weather: weatherOf(N), land: landOf(1000 + (N * 37) % 9), f: { x: 0, y: 60, z: 0, yaw: 0, pitch: 0, bank: 0, v: cfg.cruise, yr: 0, pr: 0 }, stick: { x: 0, y: 0 },
    rings: [], next: 0, got: 0, chain: 0, bestChain: 0, skims: 0, gust: { x: 0, y: 0, t: 0 } };
  G.f.y = Math.max(60, G.land(0, 0) + 40);
  makeTrail(G, 0, G.cfg.rings);
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G);
  return G;
}
// the trail: each ring a little way on from the last, bending and rising or falling, never into the land
function makeTrail(G, from, count, kind) {
  const c = G.cfg, R = G.rnd; let p = from === 0 ? { x: G.f.x, y: G.f.y, z: G.f.z, yaw: G.f.yaw } : Object.assign({}, G.rings[G.rings.length - 1]);
  for (let i = 0; i < count; i++) {
    let yaw = p.yaw, y = p.y, best = null;
    for (let tries = 0; tries < 8; tries++) {
      let dyaw = (R() * 2 - 1) * c.turn, dy = (R() * 2 - 1) * c.climb;
      if (kind === 'turn') { dyaw = (i % 2 ? 1 : -1) * 0.6; dy = 0; } else if (kind === 'updown') { dyaw = 0; dy = (i % 2 ? 1 : -1) * 16; } else if (kind === 'easy') { dyaw *= 0.4; dy *= 0.4; }
      const yw = yaw + dyaw, nx = p.x + Math.sin(yw) * c.gap, nz = p.z - Math.cos(yw) * c.gap, ground = Math.max(0, G.land(nx, nz));
      let ny = y + dy; const floor = ground + (c.low ? 12 : 22) + c.r; ny = clamp(ny, floor, 190);
      // on later levels, prefer a line that runs low over the land (through the valleys): more to see and more to steer round
      const score = (c.low ? -Math.abs(ny - floor - 10) * 0.05 : 0) - Math.abs(ny - y) * 0.02 + (R() * 0.5);
      if (!best || score > best.score) best = { x: nx, y: ny, z: nz, yaw: yw, score };
    }
    G.rings.push({ x: best.x, y: best.y, z: best.z, yaw: best.yaw, r: c.r * (kind ? 1.25 : 1), done: 0 }); p = best;
  }
}
const fwdOf = f => ({ x: Math.sin(f.yaw) * Math.cos(f.pitch), y: Math.sin(f.pitch), z: -Math.cos(f.yaw) * Math.cos(f.pitch) });
// ---------- every frame ----------
function step(G, dt) {
  if (G.over) return; G.t += dt; const f = G.f, c = G.cfg, s = G.stick, L = lessonNow(G);
  // the body follows the thumb, smoothly: bank to turn, pitch to climb or dive
  const bankT = s.x * 0.95, pitchT = s.y * 0.55;
  f.bank += (bankT - f.bank) * Math.min(1, dt * 3); f.pitch += (pitchT - f.pitch) * Math.min(1, dt * 2.2);
  f.yr = Math.sin(f.bank) * 1.15 * (22 / Math.max(14, f.v)) ; f.yaw += f.yr * dt;
  // speed: diving gains, climbing loses, always drifting back to a cruise
  f.v += (-Math.sin(f.pitch) * 9.8 * 0.75 * (c.cruise / 22) - (f.v - c.cruise) * 0.18) * dt; f.v = clamp(f.v, c.cruise * 0.6, c.cruise * 1.75);
  // wind gusts (later levels): their own clock, never the player's
  const gu = G.gust; gu.t -= dt; if (gu.t <= 0) { gu.t = 1.5 + G.rnd() * 3; gu.tx = (G.rnd() * 2 - 1) * c.gust * 4; gu.ty = (G.rnd() * 2 - 1) * c.gust * 2; } gu.x += ((gu.tx || 0) - gu.x) * dt; gu.y += ((gu.ty || 0) - gu.y) * dt;
  const d = fwdOf(f), px = f.x, py = f.y, pz = f.z;
  f.x += (d.x * f.v + gu.x * Math.cos(f.yaw)) * dt; f.y += (d.y * f.v + gu.y) * dt; f.z += (d.z * f.v + gu.x * Math.sin(f.yaw)) * dt;
  // the land and the sea: you skim off them, never crash
  const ground = Math.max(-0.5, G.land(f.x, f.z)) + 1.8;
  if (f.y < ground) { f.y = ground; f.pitch = Math.max(f.pitch, 0.35); f.v *= 0.92; if (!f.skimT) { G.skims++; G.chain = 0; G.ev.push({ k: 'skim', sea: G.land(f.x, f.z) < 0 }); lessonMiss(G, 'skim'); } f.skimT = 0.8; }
  f.skimT = Math.max(0, (f.skimT || 0) - dt); if (f.y > 230) { f.y = 230; f.pitch = Math.min(f.pitch, 0); }
  // rings: crossing a ring's flat face inside its edge counts; going past it outside is a miss
  for (let i = G.next; i < Math.min(G.rings.length, G.next + 2); i++) {
    const r = G.rings[i], nx = Math.sin(r.yaw), nz = -Math.cos(r.yaw), a = (px - r.x) * nx + (pz - r.z) * nz, b = (f.x - r.x) * nx + (f.z - r.z) * nz;
    if (a < 0 && b >= 0) {
      const u = -a / (b - a), cx = px + (f.x - px) * u - r.x, cy = py + (f.y - py) * u - r.y, cz = pz + (f.z - pz) * u - r.z, off = Math.hypot(cx, cy, cz);
      if (off <= r.r) { r.done = 1; G.got++; G.chain++; G.bestChain = Math.max(G.bestChain, G.chain); G.ev.push({ k: 'ring', i, chain: G.chain, off: off / r.r }); lessonSee(G, L && L.kind ? L.kind : 'ring'); }
      else { r.done = -1; G.chain = 0; G.ev.push({ k: 'miss', i, off }); lessonMiss(G, 'miss'); }
      G.next = i + 1; break;
    }
    // flown well past it without crossing (gone round it): a miss
    if (Math.hypot(f.x - r.x, f.z - r.z) > c.gap * 1.6 && b > 0) { r.done = -1; G.chain = 0; G.next = i + 1; G.ev.push({ k: 'miss', i }); lessonMiss(G, 'miss'); break; }
  }
  // lost the trail completely (flown away from it): the next ring calls you back, and counts as missed
  const nr = G.rings[G.next]; if (nr && Math.hypot(f.x - nr.x, f.z - nr.z) > c.gap * 4.5) { nr.done = -1; G.chain = 0; G.next++; G.ev.push({ k: 'miss', i: G.next - 1, far: true }); }
  if (G.lesson && G.next > G.rings.length - 3) makeTrail(G, 1, 6, L && L.kind === 'ring' ? 'easy' : L && L.trail);
  if (!G.lesson && G.next >= G.rings.length) finish(G, G.got >= c.goal);
}
function finish(G, win) {
  const c = G.cfg; G.over = win ? 'won' : 'lost';
  G.res = { win, stars: win ? (G.got >= c.rings ? 3 : G.got >= Math.ceil((c.goal + c.rings) / 2) ? 2 : 1) : 0, got: G.got, rings: c.rings, goal: c.goal, combo: G.bestChain, time: G.t };
  G.ev.push({ k: win ? 'won' : 'lost' });
}
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'turn', kind: 'ring', trail: 'turn', title: 'TURN', say: 'SLIDE TO TURN', do: 'drag', dir: 'lr', at: G => [W / 2, H * 0.7], how: 'Put your thumb down anywhere and move it left or right: you lean and turn. Fly through the rings.', need: 3, ok: w => w === 'ring' }],
  2: [{ id: 'updown', kind: 'ring', trail: 'updown', title: 'CLIMB AND DIVE', say: 'SLIDE UP OR DOWN', do: 'drag', dir: 'ud', at: G => [W / 2, H * 0.7], how: 'Move your thumb up to climb, down to dive. Diving is faster. Through the rings, high and low.', need: 3, ok: w => w === 'ring' }],
  3: [{ id: 'chain', kind: 'ring', trail: 'easy', title: 'A CHAIN OF RINGS', say: 'TURN EARLY', do: 'drag', dir: 'lr', at: G => [W / 2, H * 0.7], how: 'Look ahead to the next ring and turn early. Three in a row.', need: 3, ok: w => w === 'ring', chain: true }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0, miss: 0 }; G.ev.push({ k: 'lessonnext', first: true }); G.rings.length = G.next; makeTrail(G, G.next ? 1 : 0, 6, LESSONS[G.N][0].trail); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonSee(G, what) {
  const D = G.lesson; if (!D) return; const st = D.steps[D.i]; if (!st.ok(what)) return;
  if (st.chain && G.chain < D.n + 1) D.n = G.chain - 1;
  D.n++; if (D.n < st.need) { G.ev.push({ k: 'lessonok', n: D.n, need: st.need }); return; }
  D.i++; D.n = 0; D.miss = 0;
  if (D.i >= D.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.rings.length = G.next; G.got = 0; G.chain = 0; G.skims = 0; makeTrail(G, G.next ? 1 : 0, G.cfg.rings); G.rings.splice(0, 0); G.base = G.next; }
  else G.ev.push({ k: 'lessonnext' });
}
function lessonMiss(G, why) { const D = G.lesson; if (!D) return; const st = D.steps[D.i]; if (st.chain) D.n = 0; D.miss++; G.ev.push({ k: 'lessonmiss', why, how: st.how }); }

// ---------- for the robots ----------
// BLIND: a thumb held one way without looking: hard left, hard right, up, down, middle, gentle left, gentle right.
const BLIND = {
  L: G => { G.stick.x = -1; }, R: G => { G.stick.x = 1; }, U: G => { G.stick.y = 1; }, D: G => { G.stick.y = -1; }, C: G => { G.stick.x = 0; G.stick.y = 0; },
  l: G => { G.stick.x = -0.35; }, r: G => { G.stick.x = 0.35; },
};
// HONEST: steers for the next ring (seen `react` late), with a thumb that wobbles (acc)
function honest(G, o, mem) {
  const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, f = G.f, r = G.rings[G.next]; if (!r) return;
  mem.hist = mem.hist || []; mem.hist.push({ t: G.t, x: f.x, y: f.y, z: f.z, yaw: f.yaw, pitch: f.pitch, yr: f.yr }); while (mem.hist.length > 2 && G.t - mem.hist[1].t > react) mem.hist.shift();
  const h = mem.hist[0];
  // aim a little before the ring along its line, so you come through it straight
  const ax = r.x - Math.sin(r.yaw) * 14, az = r.z + Math.cos(r.yaw) * 14, far = Math.hypot(r.x - h.x, r.z - h.z), tx = far > 24 ? ax : r.x, tz = far > 24 ? az : r.z;
  let dyaw = Math.atan2(tx - h.x, -(tz - h.z)) - h.yaw; while (dyaw > Math.PI) dyaw -= 2 * Math.PI; while (dyaw < -Math.PI) dyaw += 2 * Math.PI;
  const want = Math.atan2(r.y - h.y, Math.max(8, far)), wob = (1 - acc) * 1.6;
  G.stick.x = clamp(dyaw * 2.6 - h.yr * 0.6 + (Math.random() - 0.5) * wob, -1, 1);
  G.stick.y = clamp((want - h.pitch) * 3 + want * 1.2 + (Math.random() - 0.5) * wob, -1, 1);
}
// The shortest real win, for tools/test_controls.py: enough rings counted, the last one just ahead.
function winNow(G) { if (!G || G.over) return; G.lesson = null; const c = G.cfg, r = G.rings[G.rings.length - 1]; G.got = c.goal; G.next = G.rings.length - 1;
  const f = G.f; f.yaw = r.yaw; f.pitch = 0; f.bank = 0; G.stick.x = G.stick.y = 0; f.x = r.x - Math.sin(r.yaw) * 2; f.z = r.z + Math.cos(r.yaw) * 2; f.y = r.y; }
