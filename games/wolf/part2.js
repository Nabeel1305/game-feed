// ===================== RULES: Wolf Pack (game 23) =====================
// You are the lead wolf of a small pack, on the snow in 3D. A herd of elk bolts; one of them (marked: the old or lame one) is
// your hunt. Your thumb runs you: slide left or right to steer, push up to put on a burst (it tires you). Your two packmates
// run with you: tap FLANK on a side and one of them races up that side of her, so she swerves away from it, towards you.
// She swerves now and then by herself too (her head turns first). Strike from her side: flick towards her when you are
// close and alongside. From straight behind she kicks; too far and you miss. If she reaches the trees, she is gone.
// Lives: three hunts lost (escaped, or a kick that hurts). World: metres; x across, z ahead.

const RULES = [
  '<b>Slide your thumb left and right to steer.</b> Push it up for a burst of speed: it tires you, so save it.',
  '<b>Tap FLANK</b> on a side: a packmate races up that side of her, and she swerves away from it, towards you.',
  '<b>Her head turns before she swerves.</b> Cut the corner.',
  '<b>Strike from her side:</b> tap <b>BITE</b> when you are close and alongside. From straight behind, she kicks.',
  'Reach her before the trees. Three hunts lost and the pack goes hungry.',
];
const WEATHERS = ['dusk', 'overcast', 'mist', 'golden', 'storm', 'dawn', 'night', 'sunset', 'overcast', 'mist'];
function weatherOf(N) { if (N <= 3) return ['golden', 'overcast', 'dusk'][N - 1]; const R = rng(N * 5023 + 11); R(); return WEATHERS[(R() * WEATHERS.length) | 0]; }

function makeCfg(N, help) {
  const f = curve(N), e = easyOf(N), boss = N % 10 === 0, x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), slow = help ? 0.92 : 1;
  return { N, f, e, boss, help: !!help, lives: 3,
    hunts: N <= 3 ? 1 : Math.round(x(1, 3, 25)) + (boss ? 1 : 0),
    run: 9.6, burst: 14.2, stam: 3.2, regen: 0.32, turn: 2.6,                            // the wolf
    pv: x(10.6, 13.85, 30) * slow, tire: x(0.03, 0.016, 30), tiredMax: x(0.32, 0.26, 30), start: x(22, 36, 25), trees: x(270, 255, 30),   // her speed, how fast she tires, head start, distance to the trees
    jink: [x(2.6, 1.3, 30), x(4.2, 2.4, 30)], tell: x(0.75, 0.38, 30) * (help ? 1.25 : 1), jinkA: x(0.7, 1.15, 30),
    flankCD: x(3, 5.5, 30), strike: x(4.2, 3.5, 30), side: [x(0.5, 0.7, 30), x(2.1, 1.8, 30)], kick: x(0.88, 0.95, 30) };
}
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null,
    weather: weatherOf(N), ph: 'chase', wolf: null, prey: null, herd: [], pack: [], in: { steer: 0, burst: false }, made: 0, caught: 0, lost: 0, lives: cfg.lives, gap: 0, flankCD: 0, streak: 0, bestStreak: 0, fast: 1e9 };
  newHunt(G);
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G);
  return G;
}
function newHunt(G) {
  const c = G.cfg, R = G.rnd, L = lessonNow(G), st = L && L.start || c.start;
  G.wolf = { x: 0, z: 0, h: 0, v: c.run, stam: c.stam, stun: 0, lunge: 0 };
  G.prey = { x: (R() - 0.5) * 10, z: st, h: (R() - 0.5) * 0.4, v: c.pv * (L ? 0.9 : 1), tired: 0, tell: 0, next: c.jink[0] + R() * (c.jink[1] - c.jink[0]), turnTo: 0, t0: G.t };
  G.herd = []; for (let i = 0; i < 6; i++) G.herd.push({ x: G.prey.x + (R() - 0.5) * 30, z: G.prey.z + 6 + R() * 20, h: (R() - 0.5) * 0.6, v: c.pv * (1.05 + R() * 0.15) });
  G.pack = [{ x: -4, z: -3, h: 0, side: -1, task: 0 }, { x: 4, z: -3, h: 0, side: 1, task: 0 }];
  G.ph = 'chase'; G.flankCD = 0; G.ev.push({ k: 'bolt' });
}
// ---------- the thumb ----------
function steer(G, v) { G.in.steer = clamp(v, -1, 1); }
function burst(G, on) { G.in.burst = !!on; }
// send a packmate up one side of her (-1 left, 1 right, as you see it)
function flank(G, side) { const c = G.cfg; if (G.over || G.ph !== 'chase' || G.flankCD > 0) return; const p = G.pack.find(q => q.side === side) || G.pack[0]; p.task = 3.2; G.flankCD = c.flankCD; G.ev.push({ k: 'flank', side }); }
// the strike: a flick towards her
// a: the flick's direction, off your heading (0 straight ahead, + towards the world's +x); it must point at her
function strike(G, a = 0) {
  const c = G.cfg, w = G.wolf, p = G.prey; if (G.over || G.ph !== 'chase' || w.stun > 0 || w.lunge > 0) return;
  w.lunge = 0.5; const dx = p.x - w.x, dz = p.z - w.z, d = Math.hypot(dx, dz);
  let aim = Math.atan2(dx, dz) - w.h - a; while (aim > Math.PI) aim -= TAU; while (aim < -Math.PI) aim += TAU;
  if (Math.abs(aim) > 0.6 && d <= c.strike) { w.stun = 0.45; G.ev.push({ k: 'wide' }); lessonMiss(G, 'wide'); return; }      // a flick away from her: a lunge at nothing
  // where the wolf is around her: 0 = straight behind, pi/2 = alongside
  let ang = Math.atan2(-dx, -dz) - (p.h + Math.PI); while (ang > Math.PI) ang -= TAU; while (ang < -Math.PI) ang += TAU; ang = Math.abs(ang);
  if (d > c.strike) { w.stam = Math.max(0, w.stam - 0.8); w.stun = 0.45; G.ev.push({ k: 'short', d }); lessonMiss(G, 'far'); return; }      // a lunge at nothing: a stumble
  if (ang < c.side[0]) { if (G.rnd() < c.kick) { G.ev.push({ k: 'kicked' }); w.stun = 1.6; if (G.lesson) { lessonMiss(G, 'behind'); return; } lose(G, 'kicked'); return; } G.ev.push({ k: 'slip' }); w.stun = 0.6; lessonMiss(G, 'behind'); return; }
  if (ang > c.side[1]) { w.stun = 0.45; G.ev.push({ k: 'short', d }); lessonMiss(G, 'ahead'); return; }
  // caught
  G.caught++; G.made++; G.streak++; G.bestStreak = Math.max(G.bestStreak, G.streak); G.fast = Math.min(G.fast, G.t - p.t0); G.ph = 'down'; G.gap = 2.6; G.ev.push({ k: 'caught', n: G.streak, secs: G.t - p.t0 }); lessonSee(G, 'caught');
}
function lose(G, why) { G.ev.push({ k: 'gone', why }); G.streak = 0; G.ph = 'down'; G.gap = 2.2; if (G.lesson) return; G.lost++; G.made++; G.lives--; if (G.lives <= 0) finish(G, false, why); }
// ---------- every frame ----------
function step(G, dt) {
  if (G.over) return; G.t += dt; const c = G.cfg, w = G.wolf, p = G.prey, R = G.rnd, I = G.in, L = lessonNow(G);
  if (G.gap > 0) { G.gap -= dt; if (G.gap <= 0) { if (!G.lesson && G.caught >= c.hunts) { finish(G, true); return; } newHunt(G); } return; }
  G.flankCD = Math.max(0, G.flankCD - dt);
  // the wolf
  w.stun = Math.max(0, w.stun - dt); w.lunge = Math.max(0, w.lunge - dt);
  const bursting = I.burst && w.stam > 0 && w.stun <= 0; w.stam = clamp(w.stam + (bursting ? -dt : c.regen * dt), 0, c.stam);
  const ws = w.stun > 0 ? 3 : bursting ? c.burst : c.run; w.v += (ws - w.v) * Math.min(1, dt * 2.5); w.h += I.steer * c.turn * dt * (bursting ? 0.75 : 1);
  w.x += Math.sin(w.h) * w.v * dt; w.z += Math.cos(w.h) * w.v * dt; w.bursting = bursting;
  // her: running for the trees, tiring; a swerve every so often, with her head turning first; away from a flanking packmate
  p.tired = Math.min(c.tiredMax, p.tired + c.tire * dt);
  const base = Math.atan2(p.x - w.x, p.z - w.z) * 0.7;      // she runs away from you
  if (p.tell > 0) { p.tell -= dt; if (p.tell <= 0) { p.h = clamp(p.h + p.turnTo, -1.3, 1.3); G.ev.push({ k: 'jink' }); p.next = c.jink[0] + R() * (c.jink[1] - c.jink[0]); } }
  else { p.next -= dt; if (p.next <= 0) { const flk = G.pack.find(q => q.task > 0); let dir = flk ? -Math.sign(flk.x - p.x) || 1 : (R() < 0.5 ? -1 : 1); if (!flk && Math.abs(p.h) > 0.7) dir = -Math.sign(p.h); p.turnTo = dir * c.jinkA * (0.75 + R() * 0.5); p.tell = c.tell; G.ev.push({ k: 'tell', dir }); } }
  p.h += (base - p.h) * Math.min(1, dt * 0.25);
  const pv = p.v * (1 - p.tired) * (p.tell > 0 ? 0.92 : 1); p.x += Math.sin(p.h) * pv * dt; p.z += Math.cos(p.h) * pv * dt;
  for (const h of G.herd) { h.x += Math.sin(h.h) * h.v * dt; h.z += Math.cos(h.h) * h.v * dt; }
  // the pack: running with you, or racing up a side of her when sent
  for (const q of G.pack) { q.task = Math.max(0, q.task - dt); const tx = q.task > 0 ? p.x + Math.cos(p.h) * q.side * 6 + Math.sin(p.h) * 3 : w.x + q.side * 4, tz = q.task > 0 ? p.z - Math.sin(p.h) * q.side * 6 + Math.cos(p.h) * 3 : w.z - 3;
    const sp = q.task > 0 ? c.burst * 1.05 : Math.max(c.run, w.v), dx = tx - q.x, dz = tz - q.z, d = Math.hypot(dx, dz) || 1; const mv = Math.min(d, sp * dt * (d > 3 ? 1.2 : 1)); q.x += dx / d * mv; q.z += dz / d * mv; q.h = Math.atan2(dx, dz); }
  // gone: the trees, or left far behind
  const gap = Math.hypot(p.x - w.x, p.z - w.z);
  if (p.z >= c.trees * (L ? 1.3 : 1) || gap > 75) { lose(G, gap > 75 ? 'far' : 'trees'); lessonMiss(G, 'trees'); return; }
}
function finish(G, win, why) {
  G.over = win ? 'won' : 'lost';
  G.res = { win, why, stars: win ? (G.lost === 0 ? 3 : G.lost === 1 ? 2 : 1) : 0, caught: G.caught, hunts: G.cfg.hunts, lost: G.lost, combo: G.fast < 1e9 ? Math.round(G.fast) : 0, time: G.t };
  G.ev.push({ k: win ? 'won' : 'lost', why });
}
// ---------- LESSONS ----------
const AIMCARD = {"pic": "🐺", "win": "CATCH THE MARKED ELK", "lose": "GET KICKED: NO HEARTS LEFT", "how": "RUN BESIDE HER, BITE FROM THE SIDE"};      // the aim card: specs/aims.json (tools/aims.py)
const LESSONS = {
  1: [{ id: 'run', title: 'RUN HER DOWN', say: G => wolfCue(G)[0], do: G => wolfCue(G)[1], at: G => wolfCue(G)[2], how: 'Slide your thumb left or right to steer at the marked elk. Push it up for a burst. When you are close and BESIDE her, the BITE button glows: tap it.', need: 1, ok: w => w === 'caught', start: 14 }],
  2: [{ id: 'cut', title: 'CUT THE CORNER', say: G => wolfCue(G)[0], do: G => wolfCue(G)[1], at: G => wolfCue(G)[2], how: 'Her head turns before she swerves. Steer to where she is going, come up alongside, and strike from the side.', need: 1, ok: w => w === 'caught' }],
  3: [{ id: 'flank', title: 'USE THE PACK', say: G => wolfCue(G)[0], do: G => wolfCue(G)[1], at: G => wolfCue(G)[2], how: 'Tap FLANK on a side: a packmate runs up that side of her and she swerves the other way, towards you. Then strike.', need: 1, ok: w => w === 'caught' }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0, miss: 0 }; newHunt(G); G.ev.push({ k: 'lessonnext', first: true }); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonSee(G, what) {
  const D = G.lesson; if (!D) return; const st = D.steps[D.i]; if (!st.ok(what)) return;
  D.n++; if (D.n < st.need) { G.ev.push({ k: 'lessonok', n: D.n, need: st.need }); return; }
  D.i++; D.n = 0; D.miss = 0;
  if (D.i >= D.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); Object.assign(G, { caught: 0, lost: 0, made: 0, lives: G.cfg.lives, streak: 0, bestStreak: 0, fast: 1e9 }); }
  else G.ev.push({ k: 'lessonnext' });
}
function lessonMiss(G, why) { const D = G.lesson; if (!D) return; D.miss++; G.ev.push({ k: 'lessonmiss', why, how: D.steps[D.i].how }); }

// ---------- for the robots ----------
// BLIND: steer hard left, right or straight; burst on, off; flank left, right; strike.
const BLIND = {
  l: G => steer(G, -1), r: G => steer(G, 1), s: G => steer(G, 0), b: G => burst(G, true), e: G => burst(G, false),
  f: G => flank(G, G.rnd() < 0.5 ? -1 : 1), k: G => strike(G, (Math.random() - 0.5) * 2.4),
};
// a wolf who looks: runs for a point beside her (the side she is turning to, cutting the corner), bursts when close, sends the
// pack to the far side, strikes alongside
// THE TUTORIAL SAYS WHICH WAY AND WHEN (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing happens"). SLIDE TO STEER and GO
// WHERE SHE GOES slid both ways in a box; TAP FLANK always pointed at the left one. Now the robot is asked (dryPlanAll): STEER LEFT / STEER RIGHT
// (the way it would run: where she is going), PUSH UP: BURST, TAP BITE! when it would strike, TAP THIS FLANK (the side it would send).
const WFC = { t: -1e9, v: null };
function wolfCue(G) { if (G.over || G.ph !== 'chase' || !G.wolf || !G.prey) return ['WAIT…', 'wait', false]; const now = performance.now(); if (now - WFC.t < 120) return WFC.v; WFC.t = now; const all = dryPlanAll(G, null, { t: -1, next: -1 }), last = n => all.filter(q => q[0] === n).pop(), B = biteBtn(), F = flankRects(), mid = r => [r.x + r.w / 2, r.y + r.h / 2];
  const sk = last('strike'), fl = last('flank'), st = last('steer'), bu = last('burst'), sv = st ? st[1] : 0, d = ui.drag, x0 = d ? d.x0 : W * 0.4, y0 = d ? d.y0 : H * 0.7, R = 40 * k; let v;
  if (sk) v = ['TAP BITE!', 'tap', [B.x, B.y]];
  else if (fl) v = ['TAP THIS FLANK', 'tap', mid(fl[1] < 0 ? F.L : F.R)];
  else if (Math.abs(sv) > 0.25) v = [sv > 0 ? 'STEER LEFT' : 'STEER RIGHT', 'drag', [x0, y0, x0 - sv * R * 0.9, y0 - (bu && bu[1] ? 30 * k : 0)]];
  else if (bu && bu[1]) v = ['PUSH UP: BURST', 'drag', [x0, y0, x0, y0 - 34 * k]];
  else v = ['RUN WITH HER…', 'wait', false];
  WFC.v = v; return v; }
function honest(G, o, mem) {
  const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, c = G.cfg, w = G.wolf, p = G.prey; if (G.ph !== 'chase') { ACT.steer(G, 0); ACT.burst(G, false); return; }
  if (G.t < (mem.next || 0)) return; mem.next = G.t + 0.05 + react * 0.2;
  // which side to come up on: the side she is turning towards (seen after a moment), else the side we are on
  const rel = (w.x - p.x) * Math.cos(p.h) - (w.z - p.z) * Math.sin(p.h); let side = rel >= 0 ? 1 : -1;
  if (p.tell > 0) { mem.tellAt = mem.tellAt || G.t; if (G.t - mem.tellAt > react) side = Math.sign(p.turnTo) || side; } else mem.tellAt = 0;
  const d = Math.hypot(p.x - w.x, p.z - w.z), lead = clamp(d / 14, 0, 1.6), fx = p.x + Math.sin(p.h) * p.v * lead + Math.cos(p.h) * side * 2.4, fz = p.z + Math.cos(p.h) * p.v * lead - Math.sin(p.h) * side * 2.4;
  let err = Math.atan2(fx - w.x, fz - w.z) - w.h; while (err > Math.PI) err -= TAU; while (err < -Math.PI) err += TAU;
  ACT.steer(G, clamp(err * 3 + (Math.random() - 0.5) * (1 - acc) * 1.5, -1, 1));
  ACT.burst(G, d < 24 && w.stam > 0.4);
  if (G.flankCD <= 0 && d < 30 && Math.random() < 0.5 * acc) ACT.flank(G, -side);
  let ang = Math.atan2(-(p.x - w.x), -(p.z - w.z)) - (p.h + Math.PI); while (ang > Math.PI) ang -= TAU; while (ang < -Math.PI) ang += TAU; ang = Math.abs(ang);
  if (d < c.strike * (0.8 + acc * 0.2) && ang > c.side[0] + 0.1 && ang < c.side[1] && Math.random() < acc + 0.05) { if (!mem.at) mem.at = G.t + react * 0.5; const bear = Math.atan2(p.x - w.x, p.z - w.z) - w.h, aimA = bear + (Math.random() - 0.5) * (1 - acc) * 1.2; if (G.t >= mem.at) { ACT.strike(G, aimA); mem.at = 0; } } else if (d < c.strike && Math.random() > acc + 0.05) ACT.strike(G, Math.atan2(p.x - w.x, p.z - w.z) - w.h);
}
function winNow(G) { if (!G || G.over || G.gap > 0) return; G.lesson = null; G.caught = G.cfg.hunts - 1; G.lives = G.cfg.lives; G.gap = 0; G.ph = 'chase'; const p = G.prey, w = G.wolf; w.x = p.x + Math.cos(p.h) * 2.5; w.z = p.z - Math.sin(p.h) * 2.5; w.h = p.h; w.stun = 0; w.lunge = 0; strike(G, Math.atan2(p.x - w.x, p.z - w.z) - w.h); }

// what the robot would do now, without doing it (tools/dry_plan.py): the tutorial shows this move
const ACT_REAL = { steer, burst, strike, flank }; let ACT = ACT_REAL;
function dryPlan(G, o, mem) { let got = null; const rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { if (!got && !(a.length > 2 && a.slice(1).every(v => v === 0 || v === false))) got = [n, ...a.slice(1)]; return true; };      /* (a stick at rest, all its numbers 0, is not a move; a first bed, number 0, is) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return got; }
function dryPlanAll(G, o, mem) { const all = [], rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { all.push([n, ...a.slice(1)]); return true; };      /* every call, in order (for a robot that steers and drifts at once) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return all; }
