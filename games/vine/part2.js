// ===================== RULES: Vine (game 12) =====================
// Through the jungle canopy on vines. Your thumb is your grip: keep it down to hold the vine and swing; lift it to let go and fly;
// put it down again to catch the next vine when your hand reaches it. Let go at the right point of the swing or you fall short or
// fly low; catch too early and you close your hand on nothing. Lean left or right in the air by moving the thumb sideways.
// World: metres, y up, the route runs toward -z. Each vine hangs from a branch (anchor) and swings in the plane of travel.

const RULES = [
  '<b>Your thumb is your grip.</b> Keep it down to hold the vine. You swing by yourself.',
  '<b>Lift it to let go</b>, as you swing forward and up: too soon and you fly low, too late and you fly straight up.',
  '<b>Put it down to catch the next vine</b> when your hand reaches it. Grab at air and your hand needs a moment.',
  '<b>Lean in the air:</b> move your thumb left or right to reach a vine to the side.',
  'Fall into the river three times and it is over. Reach the tree house before the light goes.',
];
const WEATHERS = ['mist', 'morning', 'golden', 'rain', 'overcast', 'sunset', 'noon', 'storm', 'dusk'];
function weatherOf(N) { if (N <= 2) return ['morning', 'golden'][N - 1]; const R = rng(N * 5051 + 9); R(); return WEATHERS[(R() * WEATHERS.length) | 0]; }
const GR = 9.8, ARM = 1.0;      // gravity; the swinger's middle is ARM below his hands

function makeCfg(N, help) {
  const f = curve(N), e = easyOf(N), boss = N % 10 === 0, x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s));
  return { N, f, e, boss, help: !!help,
    vines: Math.round(x(8, 20, 30)) + (boss ? 6 : 0),
    reach: (x(1.7, 0.55, 30) + 0.6 * e) * (help ? 1.25 : 1),     // how far the hand can be from a vine and still catch it (m)
    spread: x(0.08, 0.32, 30),                                    // how far from the best moment the release can be and still make it
    side: x(0.3, 2.6, 25),                                        // how far to the side the next vine can hang (m)
    cool: x(0.35, 0.55, 30),                                      // after grabbing at air, the hand needs this long
    lives: 3, time: Math.round(x(80, 150, 30) * (1 + 0.4 * e) * (help ? 1.2 : 1)) };
}
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null,
    weather: weatherOf(N), vines: [], on: 0, p: { x: 0, y: 20, z: 0, vx: 0, vy: 0, vz: 0 }, th: 0, om: 0, held: true, grabT: 0, lean: 0,
    lives: cfg.lives, falls: 0, time: cfg.time, perfect: 0, streak: 0, bestStreak: 0 };
  makeVines(G, cfg.vines + 1);
  attach(G, 0, -0.5, 0.9);
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G);
  return G;
}
// the route: each next vine is placed where a good release from the last one carries the hand, so every gap can be made, and
// the best release point differs from vine to vine (no fixed beat works)
function makeVines(G, n) {
  const c = G.cfg, R = G.rnd;
  for (let i = 0; i < n; i++) {
    if (!G.vines.length) { G.vines.push({ x: 0, y: 28, z: 0, L: 8, rel: 0.6 }); continue; }
    const a = G.vines[G.vines.length - 1], amp = 1.0, rel = 0.42 + R() * 0.38;      // the best moment to let go: this far up the forward swing
    const om = Math.sqrt(2 * GR / a.L * (Math.cos(rel) - Math.cos(amp))), v = a.L * om, hx = a.x, hy = a.y - a.L * Math.cos(rel), hz = a.z - a.L * Math.sin(rel);
    const vf = v * Math.cos(rel), vu = v * Math.sin(rel), tFly = (vu + Math.sqrt(vu * vu + 2 * GR * 1.2)) / GR * (0.62 + R() * 0.2);      // catch on the way down
    const side = (R() * 2 - 1) * Math.min(c.side, 1.1 * tFly * tFly), L = 6 + R() * 6;      // never further to the side than a lean can carry you
    const cx = hx + side, cy = hy + vu * tFly - GR * tFly * tFly / 2, cz = hz - vf * tFly;
    G.vines.push({ x: cx, y: Math.max(14, cy + L * 0.92), z: cz, L, rel, catchY: cy });      // the hand reaches the vine near its lower part
  }
  const last = G.vines[G.vines.length - 1]; G.house = { x: last.x, y: last.y - last.L - 1, z: last.z - 9 };
}
function attach(G, i, th, om) { const v = G.vines[i]; G.on = i; G.held = true; G.th = th; G.om = om; G.lean = 0; place(G); G.p.vx = G.p.vy = G.p.vz = 0; }
function place(G) { const v = G.vines[G.on], p = G.p; p.x = v.x; p.y = v.y - v.L * Math.cos(G.th); p.z = v.z - v.L * Math.sin(G.th); }
// ---------- the thumb ----------
function letGo(G) {
  if (G.over || !G.held) return; const v = G.vines[G.on], s = v.L * G.om;
  G.held = false; G.p.vx = 0; G.p.vy = s * Math.sin(G.th); G.p.vz = -s * Math.cos(G.th); G.relTh = G.th; G.relOm = G.om;
  const next = G.vines[G.on + 1], best = next ? next.relBest || G.vines[G.on + 1].rel : 0.6;
  G.ev.push({ k: 'letgo', th: G.th, best: next ? next.rel : null });
}
function grab(G) {
  if (G.over || G.held) return false; if (G.grabT > 0) { G.ev.push({ k: 'busy' }); return false; }
  const p = G.p, c = G.cfg, L = lessonNow(G), reach = c.reach * (L ? 1.35 : 1); let best = -1, bd = 1e9;
  for (let i = G.on + 1; i < Math.min(G.vines.length, G.on + 3); i++) { const v = G.vines[i], top = v.y, bot = v.y - v.L, hy = p.y + ARM, cy = clamp(hy, bot, top), d = Math.hypot(p.x - v.x, hy - cy, p.z - v.z); if (d < bd) { bd = d; best = i; } }
  if (best < 0 || bd > reach) { G.grabT = c.cool; G.ev.push({ k: 'air', d: bd }); lessonMiss(G, 'air'); G.streak = 0; return false; }
  const v = G.vines[best], hy = p.y + ARM;      // your hands slide to the end of the vine
  const th = Math.atan2(-(p.z - v.z), v.y - hy) * 0.5, sp = Math.hypot(p.vz, p.vy) * 0.85;
  const fine = bd < reach * 0.45; G.streak++; G.bestStreak = Math.max(G.bestStreak, G.streak); if (fine) G.perfect++;
  const th0 = clamp(th, -0.6, 0.6); attach(G, best, th0, -Math.sqrt(Math.max(0.05, 2 * GR / v.L * (Math.cos(th0) - Math.cos(1.0)))));      // the catch swings you back first, then forward, at a full swing
  G.ev.push({ k: 'catch', i: best, fine, streak: G.streak }); lessonSee(G, 'catch');
  return true;
}
// ---------- every frame ----------
function step(G, dt) {
  if (G.over) return; G.t += dt; const c = G.cfg, p = G.p, L = lessonNow(G);
  if (!G.lesson) { G.time -= dt; if (G.time <= 0) { G.time = 0; finish(G, false, 'time'); return; } }
  G.grabT = Math.max(0, G.grabT - dt);
  if (G.held) {
    const v = G.vines[G.on];
    // a pendulum; he kicks a little to keep the swing going toward a comfortable height (amplitude 1 rad)
    const E = 0.5 * v.L * G.om * G.om - GR * Math.cos(G.th), Ewant = -GR * Math.cos(1.0);
    G.om += (-GR / v.L * Math.sin(G.th) + (E < Ewant ? 0.6 : -0.2) * Math.sign(G.om || 1) / v.L * 2) * dt; G.th += G.om * dt; place(G);
    if (L && L.autoGo && G.om > 0 && G.th >= (G.vines[G.on + 1] ? G.vines[G.on + 1].rel : 0.6)) letGo(G);
    // the last vine: the tree house is in reach
    if (G.on === G.vines.length - 1 && !G.lesson) { finish(G, true); return; }
  } else {
    p.vx += (G.lean * 3.2 - p.vx * 0.6) * dt; p.vy -= GR * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
    if (L && L.autoGrab) { const nv = G.vines[G.on + 1]; if (nv && Math.hypot(p.x - nv.x, p.z - nv.z) < 1.0 && p.y + ARM < nv.y && p.y + ARM > nv.y - nv.L - 0.6) grab(G); }
    if (p.y < 2.2) fall(G);
  }
}
function fall(G) {
  const L = lessonNow(G); G.falls++; G.streak = 0; G.ev.push({ k: 'fall' });
  if (L) lessonMiss(G, 'fall'); else { G.lives--; if (G.lives <= 0) { finish(G, false, 'falls'); return; } }
  attach(G, G.on, -0.5, 0.9);      // back on the vine you jumped from
}
function finish(G, win, why) {
  const c = G.cfg; G.over = win ? 'won' : 'lost';
  G.res = { win, why, stars: win ? (G.falls === 0 && G.time > c.time * 0.3 ? 3 : G.falls <= 1 ? 2 : 1) : 0, on: G.on, of: G.vines.length - 1, falls: G.falls, combo: G.bestStreak, time: G.t };
  G.ev.push({ k: win ? 'won' : 'lost', why });
}
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'go', title: 'LET GO AT THE RIGHT MOMENT', how: 'Hold your thumb down: you swing. Lift it as you swing forward and up. Your hand catches the next vine by itself, for now.', need: 3, ok: w => w === 'catch', autoGrab: 1 },
      { id: 'grab', title: 'CATCH THE VINE', how: 'This time you let go by yourself. Put your thumb down when your hand reaches the next vine.', need: 3, ok: w => w === 'catch', autoGo: 1 }],
  2: [{ id: 'both', title: 'LET GO, THEN CATCH', how: 'Lift your thumb at the top of the forward swing, put it down as you reach the vine.', need: 3, ok: w => w === 'catch' }],
  3: [{ id: 'lean', title: 'LEAN TO THE SIDE', how: 'Some vines hang to the side. In the air, move your thumb left or right to lean toward them.', need: 3, ok: w => w === 'catch', side: 1 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0, miss: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonVines(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonVines(G) { const st = lessonNow(G); if (!st) return; G.vines.length = G.on + 1; const keep = G.cfg.side; G.cfg.side = st.side ? 2.2 : 0.15; makeVines(G, 12); G.cfg.side = keep; G.ev.push({ k: 'vines' }); }
function lessonSee(G, what) {
  const D = G.lesson; if (!D) return; const st = D.steps[D.i]; if (!st.ok(what)) return;
  if (G.on > G.vines.length - 4) { G.vines.length = G.on + 1; makeVines(G, 10); G.ev.push({ k: 'vines' }); }
  D.n++; if (D.n < st.need) { G.ev.push({ k: 'lessonok', n: D.n, need: st.need }); return; }
  D.i++; D.n = 0; D.miss = 0;
  if (D.i >= D.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.vines.length = G.on + 1; makeVines(G, G.cfg.vines); G.lives = G.cfg.lives; G.falls = 0; G.ev.push({ k: 'vines' }); }
  else { G.ev.push({ k: 'lessonnext' }); lessonVines(G); }
}
function lessonMiss(G, why) { const D = G.lesson; if (!D) return; D.miss++; G.ev.push({ k: 'lessonmiss', why, how: D.steps[D.i].how }); }

// ---------- for the robots ----------
// BLIND: thumb down, thumb up, lean left, lean right, lean straight.
const BLIND = { D: G => { if (!G.held) grab(G); G.thumb = 1; }, U: G => { G.thumb = 0; letGo(G); }, l: G => { G.lean = -1; }, r: G => { G.lean = 1; }, c: G => { G.lean = 0; } };
// HONEST: lets go when the swing reaches the next vine's best point (late by react, more or less exactly by acc), catches when the
// hand is near the vine (late by react), leans toward the next vine.
function honest(G, o, mem) {
  const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, nv = G.vines[G.on + 1];
  if (G.held) { if (!nv) return; if (mem.aim == null) mem.aim = Math.min(0.95, nv.rel + (Math.random() - 0.5) * ((1 - acc) * 1.2 + 0.1));      // a thumb lifts within a few hundredths of a second of when it means to
    // he sees the swing coming and lets go a touch early to allow for his thumb
    if (G.om > 0.2 && G.th + G.om * react * 0.35 >= mem.aim) { letGo(G); mem.aim = null; mem.seen = null; } return; }
  mem.aim = null; if (!nv) return; const p = G.p;
  G.lean = clamp((nv.x - p.x) * 1.2 - p.vx * 0.8, -1, 1);
  const hy = p.y + ARM, d = Math.hypot(p.x - nv.x, hy - clamp(hy, nv.y - nv.L, nv.y), p.z - nv.z), will = d < G.cfg.reach * (0.5 + 0.4 * acc);
  if (will) { if (mem.seen == null) mem.seen = G.t; if (G.t - mem.seen >= react * 0.5) { grab(G); mem.seen = null; } } else mem.seen = null;
}
function winNow(G) { if (!G || G.over) return; G.lesson = null; attach(G, G.vines.length - 1, 0, 0); G.time = Math.max(G.time, 5); }
