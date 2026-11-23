// ===================== RULES: Pilot (game 15), rebuilt 23 Nov 2026 =====================
// His notes (23 Nov 2026): "Clear starting location: Start on a recognisable runway, ready for takeoff... Takeoff and landing: Allow a
// complete flight from taking off to descending and successfully landing... Destination waypoint: Clearly mark where you must fly and which
// runway you must land on, with useful direction and distance guidance... Mission progression: Begin with straightforward flights and
// landings, then make missions increasingly challenging... Landing feedback: Clearly recognise a successful landing and explain when an
// attempt fails." Also "Longer viewing distance", "Better surroundings" and "Look around" (the view: part3, part5).
//
// A flight: you start lined up on the runway at the home airport. Push the POWER lever up; as the speed reaches the ROTATE mark, hold ▲ UP:
// the nose lifts and she flies. Climb, then turn (◀ ▶) to the destination: a gold marker over its runway, with the direction and the distance.
// From about 10 km out, come down onto the glide path (the four lights by the runway: two white, two red), line up, flare (▲ UP) just
// before the wheels touch, power off, and stop on the runway. Some flights pass a waypoint ring first.
// World: metres. x to the right of the home runway, y the height of the wheels, d (z) along it: the home runway runs from d = 0 to
// d = -RW_LEN, take-off is towards -d. psi is the heading, 0 = along the home runway (towards -d), + to the right.
const RULES = [
  '<b>Take off:</b> push the <b>POWER</b> lever (left edge) all the way up. At the <b>ROTATE</b> speed, hold <b>▲ UP</b>: she lifts off.',
  '<b>Fly there:</b> ◀ LEFT and ▶ RIGHT turn. The gold arrow and marker show where the destination runway is, and how far.',
  '<b>Come down:</b> from about 10 km out, ▼ DOWN and less power. The four lights by the runway: two white, two red is the right slope.',
  '<b>Land:</b> line up with the runway; just before the wheels touch, ▲ UP to flare and power right off. Stop on the runway.',
  'Touch down too hard, off the runway, short of it or past its end, or hit the ground, and the flight is over: the card says why.',
];
const WEATHERS = ['morning', 'golden', 'overcast', 'rain', 'mist', 'sunset', 'night', 'storm', 'noon', 'dusk'];
function weatherOf(N) { if (N <= 2) return ['morning', 'golden'][N - 1]; const R = rng(N * 9001 + 5); R(); return WEATHERS[(R() * WEATHERS.length) | 0]; }
const VREF = 72, VR = 66, GS = 4 * Math.PI / 180, AIM = 300, RW_LEN = 3000;

// the missions: short and straight at first, then turns, a waypoint, wind, weather, a runway at an angle, longer and harder
function makeCfg(N, help) {
  const f = curve(N), e = easyOf(N), boss = N % 10 === 0, x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s));
  return { N, f, e, boss, help: !!help,
    dist: N <= 1 ? 2500 : Math.round(x(5000, 10000, 30)) + (boss ? 1500 : 0),     // from the home runway's end to the destination (m)
    side: N <= 1 ? 0 : N <= 2 ? 1500 : x(2000, 5000, 30),                          // how far off to one side the destination lies (m)
    turn: N <= 3 ? 0 : x(0.3, 1.0, 30),                                             // the destination runway's angle to the home one (rad)
    waypoint: N >= 5,                                                               // a ring to fly through on the way
    cruise: N <= 2 ? 250 : x(280, 500, 30),                                        // the height to fly at (m)
    wind: N < 3 ? 0 : x(1.5, 7, 30) * (1 - 0.4 * e),                               // crosswind (m/s)
    turb: x(0.1, 1.0, 30) * (1 - 0.4 * e),                                          // turbulence
    width: x(30, 21, 30) + 6 * e,                                                   // half the runway's width you may touch down in (m)
    sink: (x(3.0, 2.3, 30) + 0.4 * e) * (help ? 1.1 : 1),                           // hardest touchdown the gear takes (m/s down): every landing needs a flare
    drift: x(4.5, 3.2, 30) + 1.5 * e,                                               // sideways speed allowed at touchdown (m/s)
    zone: x(1600, 900, 30) + 300 * e };                                              // touch down within this far past the threshold (m)
}
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null,
    weather: weatherOf(N), ac: null, st: { x: 0, y: 0 }, thr: 0, gust: { t: 0, b: 0, g: 0 }, landed: null, warn: {}, app: { d: 0, x: 0 } };
  G.wind = cfg.wind * (G.rnd() < 0.5 ? -1 : 1);
  const s = G.rnd() < 0.5 ? -1 : 1, ez = -RW_LEN - cfg.dist; G.B = { x: s * cfg.side, d: ez, h: s * cfg.turn * (G.rnd() < 0.5 ? 1 : 0.6) };      // the destination runway: threshold and heading
  const Ld = Math.max(3500, cfg.cruise / Math.tan(GS) - AIM) + 2500, lx = G.B.x - Math.sin(G.B.h) * Ld, lz = G.B.d + Math.cos(G.B.h) * Ld;      // the line-up point
  G.wps = cfg.waypoint ? [{ x: lx * 0.45 - s * 1500, d: -RW_LEN + (lz + RW_LEN) * 0.45, y: cfg.cruise, r: 220, done: false }] : [];
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else onRunway(G);
  return G;
}
// on the home runway, lined up, ready to roll
function onRunway(G) { G.ac = { d: -60, x: 0, y: 0, psi: 0, phi: 0, th: 0, v: 0, vy: 0, vx: 0, gnd: true, trim: null }; G.thr = 0; G.st.x = G.st.y = 0; G.landed = null; G.ph = 'takeoff'; G.ph_t = 0; G.leg = G.wps.length ? 0 : 1; G.warn = {}; G.wps.forEach(w => w.done = false); }
// on the final approach to the destination, d metres out (the lessons start here)
function approach(G, d, x) { const B = G.B, h = B.h, y = (d + AIM) * Math.tan(GS), wx = B.x - Math.sin(h) * d + Math.cos(h) * x, wd = B.d + Math.cos(h) * d + Math.sin(h) * x;
  G.ac = { d: wd, x: wx, y, psi: h + (x ? -Math.sign(x) * 0.35 : 0), phi: 0, th: -GS + 0.05, v: VREF + 4, vy: -VREF * Math.sin(GS), gnd: false, trim: null }; G.thr = 0.5; G.st.x = G.st.y = 0; G.landed = null; G.ph = 'air'; G.ph_t = 0; G.leg = 2; G.wps.forEach(w => w.done = true); }
const alphaOf = v => 0.05 * Math.pow(VREF / Math.max(30, v), 2);
// where the plane is from the destination runway: d out along its approach (0 at its threshold, below 0 over it), x to the right of it
function appOf(G) { const a = G.ac, B = G.B, rx = a.x - B.x, rd = a.d - B.d, h = B.h; G.app.d = -(rx * Math.sin(h) - rd * Math.cos(h)); G.app.x = rx * Math.cos(h) + rd * Math.sin(h); G.app.psi = a.psi - h; return G.app; }
// the place to head for: the waypoint (leg 0), a point well out on the destination's centre line (leg 1), then the runway itself (leg 2)
const lineUpD = G => Math.max(3500, G.cfg.cruise / Math.tan(GS) - AIM) + 2500;
function target(G) { const w = G.wps.find(q => !q.done); if (w) return { x: w.x, d: w.d, y: w.y, kind: 'waypoint' };
  const B = G.B, h = B.h, Ld = lineUpD(G);
  if (G.leg < 2) return { x: B.x - Math.sin(h) * Ld, d: B.d + Math.cos(h) * Ld, y: G.cfg.cruise, kind: 'line up' };
  return { x: B.x, d: B.d, y: 0, kind: 'runway' }; }
function legStep(G) { if (G.leg >= 2) return; const w = G.wps.find(q => !q.done); if (w) { G.leg = 0; return; } G.leg = 1;
  const ap = appOf(G), Ld = lineUpD(G); if (ap.d < Ld + 600 && Math.abs(ap.x) < 700) { G.leg = 2; G.ev.push({ k: 'final' }); } }
function bearingTo(G, q) { const a = G.ac; let b = Math.atan2(q.x - a.x, -(q.d - a.d)) - a.psi; while (b > Math.PI) b -= TAU; while (b < -Math.PI) b += TAU; return b; }
// ---------- every frame ----------
function step(G, dt) {
  if (G.over) return; G.t += dt; G.ph_t += dt; const c = G.cfg, a = G.ac, R = G.rnd, L = lessonNow(G);
  if (G.ph === 'roll') { a.v = Math.max(0, a.v - (G.thr < 0.15 ? 5.5 : 1.0) * dt); a.d -= Math.cos(a.psi) * a.v * dt; a.x += Math.sin(a.psi) * a.v * dt; const ap = appOf(G);
    if (ap.d < -RW_LEN + 20 && a.v > 4) return crash(G, 'overrun');
    if (a.v <= 0.5 || G.ph_t > (G.quick ? 1 : 14)) { if (L) { lessonSee(G, 'landed'); if (G.lesson) lessonReset(G); } else finish(G, true); } return; }
  if (G.ph === 'crash') { if (G.ph_t > 2.4) { if (L) lessonReset(G); else finish(G, false, G.why); } return; }
  if (G.ph === 'takeoff') {      // rolling down the home runway: power pushes, UP lifts the nose once fast enough
    a.v = Math.max(0, a.v + (G.thr * 6.5 - 0.00055 * a.v * a.v - 0.25) * dt); a.d -= a.v * dt; a.x += Math.sin(a.psi) * a.v * dt;
    if (a.v >= VR && G.st.y > 0.2) a.th = Math.min(0.16, a.th + dt * 0.12); else a.th = Math.max(0, a.th - dt * 0.2);
    if (a.v >= VR - 2 && !G.warn.vr) { G.warn.vr = 1; G.ev.push({ k: 'rotate' }); }
    if (a.th > 0.09 && a.v > VR) { G.ph = 'air'; G.ph_t = 0; a.gnd = false; a.trim = a.th; a.y = 0.3; G.ev.push({ k: 'liftoff' }); lessonSee(G, 'airborne'); return; }
    if (a.d < -RW_LEN) return crash(G, 'runway');
    return; }
  // in the air: the lessons fly what has not been taught yet
  const autoP = L && L.autoPitch, autoT = L && L.autoThr, ap = appOf(G), finalApp = ap.d < 12000 && ap.d > -RW_LEN && Math.abs(ap.x) < 3000 && Math.abs(ap.psi) < 1.2 && G.leg >= 2;
  const gu = G.gust; gu.t -= dt; if (gu.t <= 0) { gu.t = 0.4 + R() * 1.2; gu.b = (R() * 2 - 1) * c.turb * 0.12; gu.g = (R() * 2 - 1) * c.turb * 0.025; }
  // the column: bank and pitch follow it; the nose trims itself to hold the flight path you leave it on
  a.phi += (G.st.x * 0.5 - a.phi) * Math.min(1, dt * 2.4) + gu.b * dt * 3;
  const thWant = autoP && !(L.flareYou && a.y < 14) ? autoPitch(G) + G.st.y * 0.16 : a.trim != null ? a.trim + G.st.y * 0.16 : a.th;
  if (!autoP || (L.flareYou && a.y < 14)) { if (a.trim == null) a.trim = a.th; if (Math.abs(G.st.y) < 0.05) a.trim = a.th; }
  a.th += (thWant - a.th) * Math.min(1, dt * 1.6) + gu.g * dt * 3; a.th = clamp(a.th, -0.35, 0.3);
  if (autoT) G.thr = autoThr(G);
  a.psi += 9.8 * Math.tan(a.phi) / Math.max(40, a.v) * dt; while (a.psi > Math.PI) a.psi -= TAU; while (a.psi < -Math.PI) a.psi += TAU;
  const gamma = a.th - alphaOf(a.v) - (a.v < 52 ? (52 - a.v) * 0.02 : 0);      // too slow and it sinks (a stall)
  a.v += (G.thr * 5.0 - 0.00055 * a.v * a.v - 9.8 * Math.sin(gamma)) * dt; a.v = clamp(a.v, 35, 130);
  a.vy = a.v * Math.sin(gamma);
  const wx = G.wind * Math.cos(G.B.h), wd = G.wind * Math.sin(G.B.h), vx = a.v * Math.cos(gamma) * Math.sin(a.psi) + wx;      // the wind blows across the destination runway
  a.d += -a.v * Math.cos(gamma) * Math.cos(a.psi) * dt + wd * dt; a.x += vx * dt; a.y += a.vy * dt; a.vx = a.v * Math.cos(gamma) * Math.sin(a.psi - G.B.h) + G.wind;
  // the waypoint ring, the legs of the flight
  const w = G.wps.find(q => !q.done); if (w && Math.hypot(a.x - w.x, a.d - w.d) < w.r && Math.abs(a.y - w.y) < 260) { w.done = true; G.ev.push({ k: 'waypoint' }); lessonSee(G, 'waypoint'); }
  legStep(G);
  // warnings (once each, they say what is wrong)
  const gsErr = a.y - (ap.d + AIM) * Math.tan(GS);
  warnOnce(G, 'slow', a.v < 58); warnOnce(G, 'fast', a.v > 115); warnOnce(G, 'low', (finalApp && ap.d > 400 && gsErr < -25) || (!finalApp && a.y < 120 && G.ph_t > 12)); warnOnce(G, 'high', finalApp && ap.d > 400 && ap.d < 9000 && gsErr > 60 && !autoP);
  warnOnce(G, 'bank', Math.abs(a.phi) > 0.45 && a.y < 60); warnOnce(G, 'descend', finalApp && ap.d < 10000 && ap.d > 4000 && gsErr > 250);
  if (finalApp && ap.d > 600 && Math.abs(ap.x) < 25 && Math.abs(gsErr) < 15) { G.onLine = (G.onLine || 0) + dt; if (G.onLine > 3) { G.onLine = 0; G.ev.push({ k: 'online' }); lessonSee(G, 'online'); } } else G.onLine = 0;
  // the ground: on the destination runway it is a landing; anywhere else it is a crash
  const gH = groundH(a.x, a.d);
  if (a.y <= gH) { if (finalApp && ap.d < 200) touchdown(G); else crash(G, ap.d >= 200 && ap.d < 3000 && finalApp ? 'short' : 'ground'); return; }
  if (Math.abs(a.x) > 60000 || Math.abs(a.d) > 90000) crash(G, 'lost');
}
// the land under the plane: flat round both airports, hills further off (the view draws the same)
function groundH(x, d) { return 0; }
function warnOnce(G, k, on) { if (on && !G.warn[k]) { G.warn[k] = 1; G.ev.push({ k: 'warn', w: k }); } if (!on && k !== 'vr') G.warn[k] = 0; }
function touchdown(G) {
  const a = G.ac, c = G.cfg, L = lessonNow(G), ap = appOf(G), sink = -a.vy, sk = c.sink * (L ? 1.3 : 1);
  const why = ap.d > 0 ? 'short' : Math.abs(ap.x) > c.width ? 'side' : sink > sk ? 'hard' : Math.abs(a.phi) > 0.2 ? 'wing' : Math.abs(a.vx) > c.drift * (L ? 1.4 : 1) ? 'drift' : ap.d < -c.zone ? 'long' : null;
  if (why) return crash(G, why);
  a.y = 0; a.gnd = true; const q = sink < 1.0 ? 'butter' : sink < sk * 0.6 ? 'smooth' : sink < sk * 0.85 ? 'firm' : 'hard';
  G.landed = { sink, q, x: ap.x, d: -ap.d }; G.ph = 'roll'; G.ph_t = 0; a.phi = 0; a.th = 0; a.psi = G.B.h + (a.psi - G.B.h) * 0.3; G.ev.push({ k: 'touch', q, sink }); lessonSee(G, 'flare');
}
function crash(G, why) { const a = G.ac; a.y = Math.max(0, a.y); G.ph = 'crash'; G.ph_t = 0; G.why = why; G.ev.push({ k: 'crash', why }); if (lessonNow(G)) lessonMiss(G, why); }
function finish(G, win, why) {
  const c = G.cfg, Ld = G.landed; G.over = win ? 'won' : 'lost';
  const stars = win ? (Ld.q === 'butter' && Math.abs(Ld.x) < 6 ? 3 : Ld.q === 'butter' || Ld.q === 'smooth' ? 2 : 1) : 0;
  G.res = { win, why, stars, q: Ld && Ld.q, sink: Ld ? +Ld.sink.toFixed(2) : 0, cl: Ld ? +Math.abs(Ld.x).toFixed(1) : 0, at: Ld ? Math.round(Ld.d) : 0, combo: 0, time: G.t };
  G.ev.push({ k: win ? 'won' : 'lost', why });
}
// what an autopilot would do (the lessons use it for what is not taught yet; the robots read it)
function autoPitch(G) { const a = G.ac, ap = appOf(G), want = (ap.d + AIM) * Math.tan(GS), err = a.y - want; return -GS + alphaOf(a.v) - clamp(err * 0.004, -0.06, 0.06) + (a.y < 12 ? (12 - a.y) * 0.009 : 0); }
function autoThr(G) { const a = G.ac; return a.y < 8 ? 0.1 : clamp(0.5 + (VREF + 4 - a.v) * 0.05, 0, 1); }
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'takeoff', title: 'TAKE OFF', how: 'Slide the POWER lever (left edge) all the way up. When the speed reaches ROTATE, hold ▲ UP: she lifts off.', need: 1, ok: w => w === 'airborne', start: 'runway' },
      { id: 'flare', title: 'LAND: FLARE, THEN TOUCH DOWN', how: 'The autopilot brings you down the slope. Just before the wheels touch, press ▲ UP to lift the nose. A soft touchdown, then stop.', need: 1, ok: w => w === 'landed', autoPitch: 1, flareYou: 1, autoThr: 1, d: 1500 }],
  2: [{ id: 'line', title: 'LINE UP WITH THE RUNWAY', how: 'Press ◀ LEFT or ▶ RIGHT to turn onto the runway\'s centre line and stay on it. The autopilot holds the height for now.', need: 2, ok: w => w === 'online', autoPitch: 1, autoThr: 1, d: 6000, x: 400 }],
  3: [{ id: 'power', title: 'THE GLIDE PATH AND THE POWER', how: 'Four lights by the runway: two white, two red is right. ▼ DOWN to go down, ▲ UP to come up; power to keep the speed in the green. Flare at the end and land.', need: 1, ok: w => w === 'landed', d: 3000 }],
};
function lessonReset(G) { const st = lessonNow(G); if (!st) return; if (st.start === 'runway') onRunway(G); else approach(G, st.d || 1800, st.x || 0); }
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0, miss: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonReset(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonSee(G, what) {
  const D = G.lesson; if (!D) return; const st = D.steps[D.i]; if (!st.ok(what)) return;
  D.n++; if (D.n < st.need) { G.ev.push({ k: 'lessonok', n: D.n, need: st.need }); return; }
  D.i++; D.n = 0; D.miss = 0;
  if (D.i >= D.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); onRunway(G); }
  else { G.ev.push({ k: 'lessonnext' }); lessonReset(G); }
}
function lessonMiss(G, why) { const D = G.lesson; if (!D) return; D.miss++; G.ev.push({ k: 'lessonmiss', why, how: D.steps[D.i].how }); }

// ---------- for the robots ----------
// BLIND: column left, right, back, forward, centre; more power, less power.
const BLIND = { l: G => { G.st.x = -1; }, r: G => { G.st.x = 1; }, b: G => { G.st.y = 1; }, f: G => { G.st.y = -1; }, c: G => { G.st.x = G.st.y = 0; },
  P: G => { G.thr = Math.min(1, G.thr + 0.25); }, M: G => { G.thr = Math.max(0, G.thr - 0.25); } };
// HONEST: a pilot flying by eye, a moment late (react), with an unsteady hand (acc): full power and rotate; climb to the cruise height and
// turn for the gold marker; then fly the approach (the slope, the centre line), flare, power off
function honest(G, o, mem) {
  const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, a = G.ac, L = lessonNow(G);
  if (G.ph === 'takeoff') { G.thr = 1; G.st.x = 0; G.st.y = a.v >= VR + react * 3 ? 1 : 0; return; }
  if (G.ph === 'roll') { G.thr = 0; G.st.x = G.st.y = 0; return; }
  if (G.ph !== 'air') { G.st.x = G.st.y = 0; return; }
  mem.next = mem.next || 0; if (G.t < mem.next) return; mem.next = G.t + react * 0.5;
  const noise = () => (Math.random() - 0.5) * (1 - acc) * 2, ap = appOf(G), gamma = Math.asin(clamp(a.vy / a.v, -1, 1)), tg = target(G);
  if (tg.kind !== 'runway') {      // en route: head for the target, hold the cruise height, cruise speed
    const psiWant = clamp(bearingTo(G, tg), -0.6, 0.6), phiWant = clamp(psiWant * 1.8, -0.45, 0.45); G.st.x = clamp((phiWant - a.phi) * 3 + phiWant * 1.6, -1, 1) + noise() * 0.6;
    const gWant = clamp((tg.y - a.y) * 0.004, -0.08, 0.16); G.st.y = clamp((gWant - gamma) * 14 + noise(), -1, 1);
    if (!(L && L.autoThr)) G.thr = clamp(G.thr + ((VREF + 14) - a.v) * 0.01 + noise() * 0.05, 0.2, 1); return; }
  // the approach: aim the ground track at the centre line ahead, allowing for the wind
  const crab = -Math.asin(clamp(G.wind / a.v, -0.5, 0.5)), track = clamp(-ap.x / Math.max(400, ap.d * 0.35 + 300), -0.35, 0.35), psiWant = track + crab * (a.y > 1.5 ? 1 : 0.55);
  const phiWant = clamp((psiWant - ap.psi) * 2.2, -0.45, 0.45); G.st.x = clamp((phiWant - a.phi) * 3 + phiWant * 1.6, -1, 1) + noise() * 0.6;
  const want = (ap.d + AIM) * Math.tan(GS), err = a.y - want;
  let gWant = -GS - clamp(err * 0.006, -0.13, 0.05); if (a.y < 13 && ap.d < 900) gWant = -Math.max(0.9, a.y * 0.22) / a.v;
  G.st.y = clamp((gWant - gamma) * 18 + noise(), -1, 1);      // + is pulling back: nose up
  if (!(L && L.autoThr)) G.thr = a.y < 15 && ap.d < 800 ? 0 : clamp(G.thr + ((VREF + 4) - a.v) * 0.01 + noise() * 0.05, 0, 1);
}
function winNow(G) { if (!G || G.over || G.ph === 'crash' || G.quick) return; G.lesson = null; G.wps.forEach(w => w.done = true); approach(G, -100, 0); const a = G.ac; a.y = 0.05; a.phi = 0; G.wind = 0; a.v = 70; G.st.x = G.st.y = 0; a.th = a.trim = alphaOf(70) - 0.008; G.cfg.turb = 0; G.quick = true; }
