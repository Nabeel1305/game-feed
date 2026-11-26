// ===================== RULES: Vine (game 12) =====================
// Through the jungle canopy on vines. Your thumb is your grip: keep it down to hold the vine and swing; lift it to let go and fly;
// put it down again to catch the next vine when your hand reaches it. Let go at the right point of the swing or you fall short or
// fly low; catch too early and you close your hand on nothing. Move the thumb sideways WHILE you hold on to steer the swing.
// (23 Nov 2026, his words: "I don't want any impossible physics in any of these games".) Everything here is a real rope and a real
// body: the vine is a rope of fixed length from its branch; you are a weight on it (gravity, the rope's pull, your own kick); you
// catch it where your hand actually is (it was: you jumped to the vine's end and swung BACKWARDS); you then slide down it to the
// knot; you steer the swing round while you hold on (it was: steering sideways in mid-air); in the air nothing but gravity acts;
// a fall goes into the river, and only then are you put back on the vine (a cut, under a fade).
// World: metres, y up, the route runs toward -z. Each vine hangs from a branch (anchor) and swings in the plane of travel.

const RULES = [
  '<b>Your thumb is your grip.</b> Keep it down to hold the vine. You swing by yourself.',
  '<b>Lift it to let go</b>, as you swing forward and up: too soon and you fly low, too late and you fly straight up.',
  '<b>Put it down to catch the next vine</b> when your hand reaches it. Grab at air and your hand needs a moment.',
  '<b>Steer the swing:</b> while you hold on, move your thumb left or right and the swing turns that way. Once you let go, you fly where you were heading.',
  'Fall into the river three times and it is over. Reach the tree house before the light goes.',
];
const WEATHERS = ['mist', 'morning', 'golden', 'rain', 'overcast', 'sunset', 'noon', 'storm', 'dusk'];
function weatherOf(N) { if (N <= 2) return ['morning', 'golden'][N - 1]; const R = rng(N * 5051 + 9); R(); return WEATHERS[(R() * WEATHERS.length) | 0]; }
const GR = 9.8, ARM = 1.0, KNOT = 0.6, REACH = 0.9, STEER = 0.4, PUMP = 2.5;      // gravity; the swinger's middle is ARM below his hands; the rope runs KNOT past the knot the hands rest on;
// REACH: how far from where the hands are a stretched arm can close on a rope (a shoulder's width and an arm's length, and the rope's thickness);
// STEER: how fast (radians a second) a full sideways thumb turns the swing round (a kick and a twist of the hips: a fifth of your weight sideways at most);
// PUMP: how hard his legs pump the swing (along his path, m/s each second: a quarter of his weight, as a gymnast on a rope); he brakes it as hard once it is big enough
const ropeOf = v => v.rope || v.L - ARM + KNOT;      // how far the rope hangs below its branch (it hangs on below where the course expects the hands, so a low arrival still finds it)

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
    weather: weatherOf(N), vines: [], on: 0, p: { x: 0, y: 20, z: 0, vx: 0, vy: 0, vz: 0 }, th: 0, om: 0, held: true, grabT: 0, lean: 0, rh: 0, arm: ARM, down: 0, phi: 0,
    lives: cfg.lives, falls: 0, time: cfg.time, perfect: 0, streak: 0, bestStreak: 0 };
  makeVines(G, cfg.vines + 1);
  attach(G, 0, -0.5, 0.9);
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G);
  return G;
}
// the route (rebuilt 23 Nov 2026 for real physics): each next vine is placed by flying the swing forward. On a vine of length L whose
// swing reaches `amp` (radians), letting go `rel` up the forward swing sends you at v = sqrt(2gL(cos rel - cos amp)), up at rel. You
// fly; just after the top of the flight the next vine hangs straight down where you are. Catching it, the rope takes your forward speed
// as swing (the little you were falling is lost in your arms); its length is chosen so that this speed, with your pumping, swings you
// to a good height (`amp`) on the first forward swing. The best moment to let go differs from vine to vine (no fixed beat works).
const ampOf = (vf, L) => { let th = 0.8; for (let k = 0; k < 30; k++) th = Math.acos(clamp(1 - vf * vf / (2 * GR * L) - PUMP * th / GR, -1, 1)); return th; };
function makeVines(G, n) {
  const c = G.cfg, R = G.rnd;
  for (let i = 0; i < n; i++) {
    if (!G.vines.length) { G.vines.push({ x: 0, y: 28, z: 0, L: 8, rel: 0.6, amp: 1.0, rope: 10 }); continue; }
    const a = G.vines[G.vines.length - 1], amp = a.amp, rel = clamp(0.32 + R() * (amp - 0.52), 0.3, amp - 0.18);      // the best moment to let go: this far up the forward swing
    const v = Math.sqrt(2 * GR * a.L * (Math.cos(rel) - Math.cos(amp))), vf = v * Math.cos(rel), vu = v * Math.sin(rel), ry = a.y - a.L * Math.cos(rel), rz = a.z - a.L * Math.sin(rel), ta = vu / GR;
    const yTop = ry + vu * vu / (2 * GR), want = 21, drop = clamp(yTop - want, 0.05, 1.0), dt2 = clamp(Math.sqrt(2 * drop / GR), 0.1, 0.45) * (0.85 + 0.3 * R());      // catch a moment after the top of the flight (later if the route has climbed)
    const tc = ta + dt2, cy = ry + vu * tc - GR * tc * tc / 2, cz = rz - vf * tc, D = a.z - cz;
    let L = 5 + R() * 4.5, am = ampOf(vf, L); while (am < 0.82 && L > 3.4) { L -= 0.4; am = ampOf(vf, L); }
    const side = (R() * 2 - 1) * Math.min(c.side, 0.3 * D);      // never further to the side than the swing can be turned
    G.vines.push({ x: a.x + side, y: cy + L, z: cz, L, rel, amp: Math.min(1.0, am), catchY: cy, rope: Math.min(L - ARM + 4 + R() * 3, cy + L - 4) });      // lianas hang long: a little early or late, the hand still finds rope (lower down)
  }
  const last = G.vines[G.vines.length - 1]; G.house = { x: last.x, y: last.y - last.L - 1, z: last.z - 9 };
}
// hanging from vine i at angle th (forward of straight down is +), swinging at om (radians a second), hands on the knot
function attach(G, i, th, om) { const v = G.vines[i], p = G.p, R = v.L, nv = G.vines[i + 1]; G.on = i; G.held = true; G.lean = 0; G.rh = v.L - ARM; G.arm = ARM; G.down = 0; G.best = null; G.bestT = 0;      // the hands where the course expects them
  G.phi = nv ? Math.atan2(nv.x - v.x, v.z - nv.z) : 0; const sx = Math.sin(G.phi), cz = Math.cos(G.phi);      // swinging toward the next vine
  p.x = v.x + R * Math.sin(th) * sx; p.y = v.y - R * Math.cos(th); p.z = v.z - R * Math.sin(th) * cz; p.vx = R * om * Math.cos(th) * sx; p.vy = R * om * Math.sin(th); p.vz = -R * om * Math.cos(th) * cz; swingAngles(G); }
// where letting go NOW (or at each angle further up this swing) would carry the hand: the flight is gravity only, and it is flown
// forward step by step against the next rope. bestRelease() is the gold mark on the swing meter, and what a person judges by eye.
function flyMiss(G, x, y, z, vx, vy, vz) { const nv = G.vines[G.on + 1]; if (!nv) return { d: 99, aim: 99 }; const top = nv.y, bot = nv.y - ropeOf(nv), ty = (nv.catchY != null ? nv.catchY : nv.y - nv.L) + ARM; let best = { d: 99, t: 0, aim: 99 };
  for (let t = 0; t < 3.2; t += 1 / 30) { const px = x + vx * t, py = y + vy * t - GR * t * t / 2, pz = z + vz * t, hy = py + ARM; if (py < 0.4) break; const d = Math.hypot(px - nv.x, hy - clamp(hy, bot, top), pz - nv.z), a = Math.hypot(px - nv.x, (hy - ty) * 0.5, pz - nv.z);
    if (d < best.d) best = Object.assign(best, { d, t, vy: vy - GR * t }); if (a < best.aim) best.aim = a; if (pz < nv.z - 3) break; }
  return best; }      // d: how near the hand passes the rope; aim: how near it passes where the course meant you to take it (height counts half)
function bestRelease(G) { const v = G.vines[G.on], p = G.p, nv = G.vines[G.on + 1]; if (!nv) return null; const R = G.rh + G.arm, sp = Math.hypot(p.vx, p.vy, p.vz), dx = Math.sin(G.phi), dz = -Math.cos(G.phi), fw = p.vx * dx + p.vz * dz >= 0 ? 1 : -1;
  const E0 = 0.5 * sp * sp + GR * (p.y - v.y), Ew = -GR * R * Math.cos(v.amp || 1), th0 = fw > 0 ? G.th : -1; let best = { rel: null, d: 99, score: null };
  for (let th = Math.max(0.05, th0); th < 1.35; th += 0.025) { const E = Math.min(Math.max(E0, Ew), E0 + PUMP * R * Math.max(0, th - th0)), k2 = 2 * (E + GR * R * Math.cos(th)); if (k2 <= 0) break; const sv = Math.sqrt(k2);
    const x = v.x + dx * R * Math.sin(th), y = v.y - R * Math.cos(th), z = v.z + dz * R * Math.sin(th), m = flyMiss(G, x, y, z, dx * sv * Math.cos(th), sv * Math.sin(th), dz * sv * Math.cos(th));
    const score = m.d > REACH ? 50 + m.d : m.aim + 0.18 * Math.max(0, -m.vy); if (best.score == null || score < best.score) best = { rel: th, d: m.d, score }; }      // near where the course meant, and not dropping hard onto the rope (the jolt costs your speed)
  return best; }
// the swing's angle and its rate, measured from where the body is (for the meter, the lessons and the robots)
function swingAngles(G) { const v = G.vines[G.on], p = G.p, dx = Math.sin(G.phi || 0), dz = -Math.cos(G.phi || 0), ry = p.y - v.y, a = (p.x - v.x) * dx + (p.z - v.z) * dz, ud = p.vx * dx + p.vz * dz, d = a * a + ry * ry || 1; G.th = Math.atan2(a, -ry); G.om = (-ry * ud + a * p.vy) / d; }      // in the plane he is swinging in (heading phi)
// ---------- the thumb ----------
function letGo(G) {
  if (G.over || !G.held) return;
  G.held = false; G.relTh = G.th; G.relOm = G.om;      // you fly on with exactly the speed you had
  const next = G.vines[G.on + 1], best = next ? next.relBest || G.vines[G.on + 1].rel : 0.6;
  G.ev.push({ k: 'letgo', th: G.th, best: next ? next.rel : null });
}
function grab(G) {
  if (G.over || G.held || G.down > 0) return false; if (G.grabT > 0) { G.ev.push({ k: 'busy' }); return false; }
  const p = G.p, c = G.cfg, L = lessonNow(G), reach = Math.min(c.reach, REACH) * (L ? 1.15 : 1); let best = -1, bd = 1e9;
  for (let i = G.on + 1; i < Math.min(G.vines.length, G.on + 3); i++) { const v = G.vines[i], top = v.y, bot = v.y - ropeOf(v), hy = p.y + ARM, cy = clamp(hy, bot, top), d = Math.hypot(p.x - v.x, hy - cy, p.z - v.z); if (d < bd) { bd = d; best = i; } }
  if (best < 0 || bd > reach) { G.grabT = c.cool; G.ev.push({ k: 'air', d: bd }); lessonMiss(G, 'air'); G.streak = 0; return false; }
  // the hand closes on the rope where it is: you do not move; the rope is drawn to your hand and goes taut. What was moving along the
  // rope is stopped (the jolt in your arms), the rest of your speed swings on, forward, the way you were going.
  const v = G.vines[best], rx = p.x - v.x, ry = p.y - v.y, rz = p.z - v.z, Rb = Math.hypot(rx, ry, rz), ux = rx / Rb, uy = ry / Rb, uz = rz / Rb, vr = p.vx * ux + p.vy * uy + p.vz * uz;
  p.vx -= vr * ux; p.vy -= vr * uy; p.vz -= vr * uz;
  G.on = best; G.held = true; G.rh = clamp(Rb - ARM, 0.8, ropeOf(v)); G.arm = Rb - G.rh; G.lean = 0; G.phi = Math.atan2(p.vx, -p.vz); swingAngles(G); G.best = null; G.bestT = 0;      // he swings on the way he was going
  const fine = bd < reach * 0.45; G.streak++; G.bestStreak = Math.max(G.bestStreak, G.streak); if (fine) G.perfect++;
  G.ev.push({ k: 'catch', i: best, fine, streak: G.streak, d: bd, jolt: Math.abs(vr) }); lessonSee(G, 'catch');
  return true;
}
// ---------- every frame ----------
function step(G, dt) {
  if (G.over) return; G.t += dt; const c = G.cfg, p = G.p, L = lessonNow(G);
  if (!G.lesson) { G.time -= dt; if (G.time <= 0) { G.time = 0; finish(G, false, 'time'); return; } }
  G.grabT = Math.max(0, G.grabT - dt);
  if (G.down > 0) { G.down -= dt; p.y = Math.max(-1.4, p.y - dt * 0.9); p.vx = p.vy = p.vz = 0; if (G.down <= 0) { const v = G.vines[G.on]; attach(G, G.on, -(v.amp || 1) * 0.97, 0); G.ev.push({ k: 'back' }); } return; }      // in the river; then back on the vine
  if (G.held) {
    const v = G.vines[G.on];
    // the hands stay where they closed on the rope; the arms take up any stretch (the radius changes and the turning momentum is kept)
    const R0 = G.rh + G.arm; G.arm += (ARM - G.arm) * Math.min(1, dt * 5); const R = G.rh + G.arm;
    // what acts on him: gravity; his kick, which keeps the swing going toward a comfortable height (a tenth of his weight, at most);
    // and, with the thumb to one side, a push across his path that turns the swing round that way
    const sp = Math.hypot(p.vx, p.vy, p.vz), E = 0.5 * sp * sp + GR * (p.y - v.y), Ewant = -GR * R * Math.cos(v.amp || 1), kick = E < Ewant - 0.3 ? PUMP : E > Ewant + 0.3 ? -PUMP * 0.6 : 0; G.kick = kick;
    let ax = 0, ay = -GR, az = 0; if (sp > 0.05) { ax += kick * p.vx / sp; ay += kick * p.vy / sp; az += kick * p.vz / sp; }
    // he holds the swing in one upright plane through the foot of the branch (heading phi), steadying it with his body; the thumb turns that plane
    G.phi += G.lean * STEER * dt; { const nx = Math.cos(G.phi), nz = Math.sin(G.phi), xp = (p.x - v.x) * nx + (p.z - v.z) * nz, vp = p.vx * nx + p.vz * nz, ap = clamp(-3.2 * vp - 2.2 * xp, -2.4, 2.4); ax += ap * nx; az += ap * nz; }
    p.vx += ax * dt; p.vy += ay * dt; p.vz += az * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
    // the rope: he stays its length from the branch, and nothing moves along it
    let rx = p.x - v.x, ry = p.y - v.y, rz = p.z - v.z; const d = Math.hypot(rx, ry, rz) || 1; rx /= d; ry /= d; rz /= d;
    p.x = v.x + rx * R; p.y = v.y + ry * R; p.z = v.z + rz * R; const vr = p.vx * rx + p.vy * ry + p.vz * rz; p.vx -= vr * rx; p.vy -= vr * ry; p.vz -= vr * rz;
    if (Math.abs(R - R0) > 1e-6) { const f = R0 / R; p.vx *= f; p.vy *= f; p.vz *= f; }
    swingAngles(G); G.bestT = (G.bestT || 0) - dt; if (G.bestT <= 0) { G.best = bestRelease(G); G.bestT = 0.15; }
    if (L && L.autoGo && G.om > 0 && G.best && G.best.rel != null && G.best.d < REACH && G.th >= G.best.rel) letGo(G);
    // the last vine: the tree house is in reach
    if (G.on === G.vines.length - 1 && !G.lesson) { finish(G, true); return; }
  } else {
    p.vy -= GR * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;      // in the air: only gravity (it was steerable)
    if (L && L.autoGrab) { const nv = G.vines[G.on + 1]; if (nv && Math.hypot(p.x - nv.x, p.z - nv.z) < 0.7 && p.y + ARM < nv.y && p.y + ARM > nv.y - ropeOf(nv)) grab(G); }
    if (p.y < 0.4) fall(G);      // the river
  }
}
function fall(G) {
  const L = lessonNow(G), p = G.p; G.falls++; G.streak = 0; G.ev.push({ k: 'fall', x: p.x, z: p.z, v: Math.hypot(p.vx, p.vy, p.vz) });
  if (L) lessonMiss(G, 'fall'); else { G.lives--; if (G.lives <= 0) { finish(G, false, 'falls'); return; } }
  G.held = false; G.down = 1.2; p.y = 0.4;      // into the river; a moment later, back on the vine you jumped from, at the back of its swing
}
function finish(G, win, why) {
  const c = G.cfg; G.over = win ? 'won' : 'lost';
  G.res = { win, why, stars: win ? (G.falls === 0 && G.time > c.time * 0.3 ? 3 : G.falls <= 1 ? 2 : 1) : 0, on: G.on, of: G.vines.length - 1, falls: G.falls, combo: G.bestStreak, time: G.t };
  G.ev.push({ k: win ? 'won' : 'lost', why });
}
// ---------- LESSONS ----------
const AIMCARD = {"pic": "🌿", "win": "SWING TO THE END OF THE JUNGLE", "lose": "FALL TOO OFTEN, OR TIME RUNS OUT", "how": "HOLD TO SWING, LET GO, CATCH"};      // the aim card: specs/aims.json (tools/aims.py)
const LESSONS = {
  1: [{ id: 'go', title: 'LET GO AT THE RIGHT MOMENT', say: G => vineCue(G)[0], do: G => vineCue(G)[1], at: G => vineCue(G)[2], how: 'Hold your thumb down: you swing. Lift it as you swing forward and up. Your hand catches the next vine by itself, for now.', need: 3, ok: w => w === 'catch', autoGrab: 1 },
      { id: 'grab', title: 'CATCH THE VINE', say: G => vineCue(G)[0], do: G => vineCue(G)[1], at: G => vineCue(G)[2], how: 'This time you let go by yourself. Put your thumb down when your hand reaches the next vine.', need: 3, ok: w => w === 'catch', autoGo: 1 }],
  2: [{ id: 'both', title: 'LET GO, THEN CATCH', say: G => vineCue(G)[0], do: G => vineCue(G)[1], at: G => vineCue(G)[2], how: 'Lift your thumb at the top of the forward swing, put it down as you reach the vine.', need: 3, ok: w => w === 'catch' }],
  3: [{ id: 'lean', title: 'STEER THE SWING', say: G => vineCue(G)[0], do: G => vineCue(G)[1], at: G => vineCue(G)[2], how: 'Some vines hang to the side. While you hold on, move your thumb left or right: the swing turns that way. Then let go.', need: 3, ok: w => w === 'catch', side: 1 }],
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
// BLIND: thumb down, thumb up, steer left, steer right, straight.
const BLIND = { D: G => { if (!G.held) grab(G); G.thumb = 1; }, U: G => { G.thumb = 0; letGo(G); }, l: G => { G.lean = -1; }, r: G => { G.lean = 1; }, c: G => { G.lean = 0; } };
// HONEST: lets go when the swing reaches the next vine's best point (late by react, more or less exactly by acc), catches when the
// hand is near the vine (late by react), leans toward the next vine.
function honest(G, o, mem) {
  const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, nv = G.vines[G.on + 1], p = G.p;
  if (G.held) { if (!nv) return; const v = G.vines[G.on], want = Math.atan2(nv.x - v.x, v.z - nv.z);
    // he steers the swing round to face the next vine (the swing and the flight after it run along one line through the point under the branch)
    { const err = want - G.phi; G.lean = Math.abs(err) < 0.015 * (2 - acc) ? 0 : clamp(err * 4, -1, 1); }
    // he judges by eye the moment to let go (the gold mark), and lets go about then: a little early or late, more so if he is sloppy;
    // if this swing will not carry him there, he waits for the next (his legs pump it up)
    const b = G.best; if (!b || b.rel == null || b.d > REACH * 0.8 || G.om <= 0.15) { if (G.om <= 0) mem.aim = null; return; }
    if (mem.aim == null) mem.aim = b.rel + (Math.random() - 0.5) * ((1 - acc) * 1.2 + 0.1);
    if (G.th + G.om * react * 0.35 >= mem.aim) { letGo(G); mem.aim = null; mem.grab = null; } return; }
  mem.aim = null; G.lean = 0; if (!nv || G.down > 0) return;
  // in the air he watches the vine come and closes his hand as it reaches him (a little early or late)
  const m = flyMiss(G, p.x, p.y, p.z, p.vx, p.vy, p.vz); if (mem.grab == null) mem.grab = (Math.random() - 0.5) * (1 - acc) * 0.5 + 0.02;
  if (m.d < Math.min(G.cfg.reach, REACH) * 1.1 && m.t <= Math.max(0, mem.grab)) { grab(G); mem.grab = null; }
}
// THE TUTORIAL SAYS WHEN (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing happens"). It said HOLD… LET GO! with a hand
// lifting all swing long, and TOUCH AT THE VINE with a hand tapping all flight long. Now, as the robot judges it (a moment early, for a thumb):
// HOLD… SWING, SLIDE LEFT / RIGHT to face the next vine, LET GO! at the gold mark, WAIT… in the air, TOUCH NOW! as the vine comes.
function vineCue(G) { if (G.over || G.wait > 0) return ['WAIT…', 'wait', false]; const nv = G.vines[G.on + 1], p = G.p; if (!nv) return ['…', 'wait', false];
  if (G.held) { const v = G.vines[G.on], want = Math.atan2(nv.x - v.x, v.z - nv.z), err = want - G.phi, x0 = touch.id != null ? touch.x0 : W / 2, y0 = H * 0.7;
    if (Math.abs(err) > 0.06) { const l = clamp(err * 4, -1, 1); return [l < 0 ? 'SLIDE LEFT' : 'SLIDE RIGHT', 'drag', [x0, y0, x0 + l * W * 0.18, y0]]; }
    const b = G.best; if (b && b.rel != null && b.d <= REACH * 0.8 && G.om > 0.15 && G.th + G.om * 0.2 >= b.rel) return ['LET GO!', 'release', [x0, y0]];
    return [touch.id != null ? 'HOLD… SWING' : 'HOLD ON', 'hold', [x0, y0]]; }
  if (G.down > 0) return ['WAIT…', 'wait', false];
  const m = flyMiss(G, p.x, p.y, p.z, p.vx, p.vy, p.vz); if (m.d < Math.min(G.cfg.reach, REACH) * 1.1 && m.t <= 0.22) return ['TOUCH NOW!', 'tap', [W / 2, H * 0.7]];
  return ['WAIT…', 'wait', false]; }
function winNow(G) { if (!G || G.over) return; G.lesson = null; attach(G, G.vines.length - 1, 0, 0); G.time = Math.max(G.time, 5); }
