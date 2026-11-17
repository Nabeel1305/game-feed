// ===================== RULES: Pilot (game 15) =====================
// Land an airliner. You fly the final approach, seen from just behind and above the plane. Right thumb is the control column:
// move it left or right to bank and turn, PULL IT BACK (down) to raise the nose, push it forward (up) to lower it. Left thumb is
// the throttle: slide it up for more power, down for less. Follow the glide path (the four lights beside the runway: two white,
// two red is right), keep on the centre line, keep the speed in the green, and just before the wheels touch, pull back gently to
// flare so you touch down softly. Crosswind pushes you sideways; turbulence bumps you.
// World: metres. d = distance to the runway threshold along the approach (falls to 0 at the threshold, below 0 over the runway);
// x = to the right of the centre line; y = height of the wheels; psi = heading off the runway's direction (+ right).

const RULES = [
  '<b>Right thumb: the control column.</b> Left and right to bank and turn. <b>Pull back (down)</b> to raise the nose, push forward (up) to lower it.',
  '<b>Left thumb: the throttle.</b> Slide up for more power, down for less. Keep the speed in the green.',
  '<b>Follow the glide path:</b> the four lights beside the runway show two white and two red when you are right. All white: too high. All red: too low.',
  '<b>Keep on the centre line.</b> In a crosswind, point a little into the wind.',
  '<b>Flare:</b> just before the wheels touch, pull back gently and bring the power off. A soft touchdown, wings level, on the runway.',
  'Touch down too hard, short, off the side, or not at all, and it is a crash.',
];
const WEATHERS = ['morning', 'golden', 'overcast', 'rain', 'mist', 'sunset', 'night', 'storm', 'noon', 'dusk'];
function weatherOf(N) { if (N <= 2) return ['morning', 'golden'][N - 1]; const R = rng(N * 9001 + 5); R(); return WEATHERS[(R() * WEATHERS.length) | 0]; }
const VREF = 72, GS = 3 * Math.PI / 180, AIM = 300, RW_LEN = 3000;

function makeCfg(N, help) {
  const f = curve(N), e = easyOf(N), boss = N % 10 === 0, x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s));
  return { N, f, e, boss, help: !!help,
    start: x(3500, 8000, 30) + (boss ? 3000 : 0),                 // how far out the approach begins (m)
    offset: N < 3 ? 0 : x(0, 900, 25),                              // how far off the centre line you start (m): a turn to line up
    wind: N < 2 ? 0 : x(1.5, 11, 30) * (1 - 0.4 * e),               // crosswind (m/s)
    turb: x(0.15, 1.0, 30) * (1 - 0.4 * e),                         // turbulence
    width: x(30, 21, 30) + 6 * e,                                   // half the runway's width you may touch down in (m)
    sink: (x(2.9, 2.3, 30) + 0.4 * e) * (help ? 1.1 : 1),           // hardest touchdown the gear takes (m/s down): never the 3.8 of the glide itself, so every landing needs a flare
    drift: x(4.5, 2.5, 30) + 1.5 * e,                               // sideways speed allowed at touchdown (m/s)
    zone: x(1600, 900, 30) + 300 * e };                              // touch down within this far past the threshold (m)
}
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null,
    weather: weatherOf(N), ac: null, st: { x: 0, y: 0 }, thr: 0.58, gust: { t: 0, b: 0, g: 0 }, landed: null, warn: {} };
  G.wind = cfg.wind * (G.rnd() < 0.5 ? -1 : 1);
  approach(G, cfg.start, cfg.offset * (G.rnd() < 0.5 ? -1 : 1));
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G);
  return G;
}
function approach(G, d, x) { const y = (d + AIM) * Math.tan(GS); G.ac = { d, x, y, psi: x ? -Math.sign(x) * 0.35 : 0, phi: 0, th: -GS + 0.05, v: VREF + 4, vy: -VREF * Math.sin(GS), gnd: false }; G.thr = 0.58; G.st.x = G.st.y = 0; G.landed = null; G.ph = 'air'; G.ph_t = 0; }
const alphaOf = v => 0.05 * Math.pow(VREF / Math.max(30, v), 2);
// ---------- every frame ----------
function step(G, dt) {
  if (G.over) return; G.t += dt; G.ph_t += dt; const c = G.cfg, a = G.ac, R = G.rnd, L = lessonNow(G);
  if (G.ph === 'roll') { a.v = Math.max(0, a.v - 3.5 * dt); a.d -= a.v * dt; a.x += Math.sin(a.psi) * a.v * dt * 0.2; if (G.ph_t > 2.4) { if (L) { lessonSee(G, 'landed'); if (G.lesson) approach(G, L.d || 1800, 0); } else finish(G, true); } return; }
  if (G.ph === 'crash') { if (G.ph_t > 2.2) { if (L) approach(G, L.d || 1800, 0); else finish(G, false, G.why); } return; }
  // the lessons fly what has not been taught yet
  const autoP = L && L.autoPitch, autoT = L && L.autoThr;
  // turbulence: bumps on its own clock
  const gu = G.gust; gu.t -= dt; if (gu.t <= 0) { gu.t = 0.4 + R() * 1.2; gu.b = (R() * 2 - 1) * c.turb * 0.12; gu.g = (R() * 2 - 1) * c.turb * 0.025; }
  // the column: bank and pitch follow it; the nose trims itself to hold the flight path you leave it on
  a.phi += (G.st.x * 0.5 - a.phi) * Math.min(1, dt * 2.4) + gu.b * dt * 3;
  const thWant = autoP && !(L.flareYou && a.y < 14) ? autoPitch(G) : a.trim != null ? a.trim + G.st.y * 0.16 : a.th;
  if (!autoP || (L.flareYou && a.y < 14)) { if (a.trim == null) a.trim = a.th; if (Math.abs(G.st.y) < 0.05) a.trim = a.th; }
  a.th += (thWant - a.th) * Math.min(1, dt * 1.6) + gu.g * dt * 3;
  if (autoT) G.thr = autoThr(G);
  a.psi += 9.8 * Math.tan(a.phi) / Math.max(40, a.v) * dt;
  const gamma = a.th - alphaOf(a.v) - (a.v < 52 ? (52 - a.v) * 0.02 : 0);      // too slow and it sinks (a stall)
  a.v += (G.thr * 4.0 - 0.00055 * a.v * a.v - 9.8 * Math.sin(gamma)) * dt; a.v = clamp(a.v, 35, 110);
  a.vy = a.v * Math.sin(gamma);
  const vx = a.v * Math.cos(gamma) * Math.sin(a.psi) + G.wind;
  a.d -= a.v * Math.cos(gamma) * Math.cos(a.psi) * dt; a.x += vx * dt; a.y += a.vy * dt; a.vx = vx;
  // warnings (once each, they say what is wrong)
  const gsErr = a.y - (a.d + AIM) * Math.tan(GS);
  warnOnce(G, 'slow', a.v < 60); warnOnce(G, 'fast', a.v > 90); warnOnce(G, 'low', a.d > 400 && gsErr < -25); warnOnce(G, 'bank', Math.abs(a.phi) > 0.45 && a.y < 60);
  if (a.d > 600 && Math.abs(a.x) < 25 && Math.abs(gsErr) < 15) { G.onLine = (G.onLine || 0) + dt; if (G.onLine > 3) { G.onLine = 0; G.ev.push({ k: 'online' }); lessonSee(G, 'online'); } } else G.onLine = 0;
  // the ground
  if (a.y <= 0) touchdown(G);
  else if (a.d < -c.zone - 400) crash(G, 'long');
  if (Math.abs(a.x) > 3000 || a.d > c.start + 3000) crash(G, 'lost');
}
function warnOnce(G, k, on) { if (on && !G.warn[k]) { G.warn[k] = 1; G.ev.push({ k: 'warn', w: k }); } if (!on) G.warn[k] = 0; }
function touchdown(G) {
  const a = G.ac, c = G.cfg, L = lessonNow(G), sink = -a.vy, sk = c.sink * (L ? 1.3 : 1);
  const why = a.d > 0 ? 'short' : Math.abs(a.x) > c.width ? 'side' : sink > sk ? 'hard' : Math.abs(a.phi) > 0.2 ? 'wing' : Math.abs(a.vx) > c.drift * (L ? 1.4 : 1) ? 'drift' : a.d < -c.zone ? 'long' : null;
  if (why) return crash(G, why);
  a.y = 0; a.gnd = true; const q = sink < 1.0 ? 'butter' : sink < sk * 0.6 ? 'smooth' : sink < sk * 0.85 ? 'firm' : 'hard';
  G.landed = { sink, q, x: a.x, d: -a.d }; G.ph = 'roll'; G.ph_t = 0; G.ev.push({ k: 'touch', q, sink }); lessonSee(G, 'flare');
}
function crash(G, why) { const a = G.ac; a.y = Math.max(0, a.y); G.ph = 'crash'; G.ph_t = 0; G.why = why; G.ev.push({ k: 'crash', why }); if (lessonNow(G)) lessonMiss(G, why); }
function finish(G, win, why) {
  const c = G.cfg, Ld = G.landed; G.over = win ? 'won' : 'lost';
  const stars = win ? (Ld.q === 'butter' && Math.abs(Ld.x) < 6 ? 3 : Ld.q === 'butter' || Ld.q === 'smooth' ? 2 : 1) : 0;
  G.res = { win, why, stars, q: Ld && Ld.q, sink: Ld ? +Ld.sink.toFixed(2) : 0, cl: Ld ? +Math.abs(Ld.x).toFixed(1) : 0, combo: 0, time: G.t };
  G.ev.push({ k: win ? 'won' : 'lost', why });
}
// what an autopilot would do (the lessons use it for what is not taught yet; the robots read it)
function autoPitch(G) { const a = G.ac, want = (a.d + AIM) * Math.tan(GS), err = a.y - want; return -GS + alphaOf(a.v) - clamp(err * 0.004, -0.06, 0.06) + (a.y < 12 ? (12 - a.y) * 0.009 : 0); }
function autoThr(G) { const a = G.ac; return a.y < 8 ? 0.1 : clamp(0.58 + (VREF + 4 - a.v) * 0.05, 0, 1); }
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'line', title: 'KEEP ON THE CENTRE LINE', how: 'Right thumb left or right to bank and turn. Line up with the runway and stay on it. (The plane holds its own height and speed for now.)', need: 3, ok: w => w === 'online', autoPitch: 1, autoThr: 1, d: 6000 },
      { id: 'flare', title: 'FLARE, THEN TOUCH DOWN', how: 'Just before the wheels touch, PULL BACK gently (thumb down) to raise the nose. A soft touchdown.', need: 1, ok: w => w === 'flare', autoPitch: 1, flareYou: 1, autoThr: 1, d: 1500 }],
  2: [{ id: 'glide', title: 'FOLLOW THE GLIDE PATH', how: 'Watch the four lights by the runway: two white, two red is right. Push forward to go down, pull back to come up. Then flare and land.', need: 1, ok: w => w === 'landed', autoThr: 1, d: 2600 }],
  3: [{ id: 'power', title: 'THE THROTTLE', how: 'Left thumb up for more power, down for less: keep the speed in the green. Land it, flaring at the end.', need: 1, ok: w => w === 'landed', d: 2600 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0, miss: 0 }; G.ev.push({ k: 'lessonnext', first: true }); approach(G, lessonNow(G).d, G.N === 1 ? 250 : 0); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonSee(G, what) {
  const D = G.lesson; if (!D) return; const st = D.steps[D.i]; if (!st.ok(what)) return;
  D.n++; if (D.n < st.need) { G.ev.push({ k: 'lessonok', n: D.n, need: st.need }); return; }
  D.i++; D.n = 0; D.miss = 0;
  if (D.i >= D.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); approach(G, G.cfg.start, G.cfg.offset * (G.rnd() < 0.5 ? -1 : 1)); }
  else { G.ev.push({ k: 'lessonnext' }); approach(G, lessonNow(G).d, 0); }
}
function lessonMiss(G, why) { const D = G.lesson; if (!D) return; D.miss++; G.ev.push({ k: 'lessonmiss', why, how: D.steps[D.i].how }); }

// ---------- for the robots ----------
// BLIND: column left, right, back, forward, centre; more power, less power.
const BLIND = { l: G => { G.st.x = -1; }, r: G => { G.st.x = 1; }, b: G => { G.st.y = 1; }, f: G => { G.st.y = -1; }, c: G => { G.st.x = G.st.y = 0; },
  P: G => { G.thr = Math.min(1, G.thr + 0.25); }, M: G => { G.thr = Math.max(0, G.thr - 0.25); } };
// HONEST: a pilot flying the approach by eye, a moment late (react), with an unsteady hand (acc)
function honest(G, o, mem) {
  const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, a = G.ac; if (G.ph !== 'air') { G.st.x = G.st.y = 0; return; }
  mem.next = mem.next || 0; if (G.t < mem.next) return; mem.next = G.t + react * 0.5;
  const noise = () => (Math.random() - 0.5) * (1 - acc) * 2;
  // lateral: aim the ground track at the centre line ahead, allowing for the wind
  const crab = -Math.asin(clamp(G.wind / a.v, -0.5, 0.5)), track = clamp(-a.x / Math.max(400, a.d * 0.35 + 300), -0.35, 0.35), psiWant = track + crab * (a.y > 4 ? 1 : 0.3);
  const phiWant = clamp((psiWant - a.psi) * 2.2, -0.45, 0.45); G.st.x = clamp((phiWant - a.phi) * 3 + phiWant * 1.6, -1, 1) + noise() * 0.6;
  // vertical: hold the glide path, then flare
  const want = (a.d + AIM) * Math.tan(GS), err = a.y - want, gamma = Math.asin(clamp(a.vy / a.v, -1, 1));
  let gWant = -GS - clamp(err * 0.006, -0.05, 0.05); if (a.y < 13) gWant = -Math.max(0.6, a.y * 0.11) / a.v;
  G.st.y = clamp((gWant - gamma) * 18 + noise(), -1, 1);      // + is pulling back: nose up
  if (!(lessonNow(G) && lessonNow(G).autoThr)) G.thr = a.y < 8 ? 0.1 : clamp(G.thr + ((VREF + 4) - a.v) * 0.01 + noise() * 0.05, 0, 1);
}
function winNow(G) { if (!G || G.over || G.ph !== 'air') return; G.lesson = null; const a = G.ac; a.d = -100; a.x = 0; a.y = 0.05; a.phi = 0; a.psi = 0; G.wind = 0; a.v = 70; G.st.x = G.st.y = 0; a.th = a.trim = alphaOf(70) - 0.008; G.cfg.turb = 0; }
