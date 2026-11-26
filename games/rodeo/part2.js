
// ===================== RULES: Rodeo (game 33) =====================
// Eight seconds on a bucking bull. You sit on top like a stick standing on a hand: you tip one way or the other all the time,
// and you hold the LEFT or RIGHT half of the screen to lean that way and bring yourself back. Hold both to GRIP (a buck throws
// you less) while your grip lasts. The bull shows what is coming: his head swings to the side he is about to throw you (a
// buck), he drops his shoulder and turns (a spin, a long pull), he kicks out his back legs (short and hard), and wise old bulls
// fake it. Lean against the throw just before it lands. Stay on for the horn; ride well for the score (the judges like a rider
// who stays in the middle). Coins buy gear that stays; your rank grows.
const RULES = [
  'Hold the <b>left</b> or <b>right</b> half of the screen to lean that way. You tip all the time: lean back the other way.',
  "Watch the bull: his head swings to the side he's about to <b>throw you</b>. Lean the <b>other way</b> just before he bucks.",
  'Hold <b>both</b> thumbs to <b>grip</b> through a spin. Your grip runs out, then comes back slowly.',
  'Stay on for <b>eight seconds</b>. The judges mark the ride: the dot in the <b>green</b> and every buck met. 65 to count. Old bulls fake it.',
  'Coins buy gear that stays. Wilder bulls every level.',
];
const BULLS = ['Bramble', 'Dust Devil', 'Old Smokey', 'Thunderhoof', 'Widowmaker', 'Bodacious', 'Red Rocket', 'Tornado', 'Big Iron', 'Little Jim', 'Copperhead', 'Moonshine'];
const UPGRADES = [
  { id: 'glove', name: 'Rosin glove', desc: 'Your grip lasts longer.', max: 3, cost: l => 20 + l * 25 },
  { id: 'chaps', name: 'Leather chaps', desc: 'You can tip a little further before you fall.', max: 2, cost: l => 25 + l * 30 },
  { id: 'rope', name: 'Bull rope', desc: 'Gripping holds you tighter.', max: 2, cost: l => 25 + l * 30 },
  { id: 'spurs', name: 'Silver spurs', desc: 'More coins and score for every ride.', max: 2, cost: l => 20 + l * 25 },
  { id: 'shoe', name: 'Lucky horseshoe', desc: 'Once a ride, when you would fall, you hang on.', max: 1, cost: () => 60 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Greenhorn'], [40, 'Wrangler'], [130, 'Bronc buster'], [320, 'Bull rider'], [700, 'Champion'], [1500, 'Rodeo legend']];
const TOWNS = ['Dry Creek', 'Tumbleweed', 'Silver Mesa', 'Cheyenne', 'Las Vegas Finals'], townOf = N => TOWNS[Math.floor((N - 1) / 5) % TOWNS.length];
const WEATHERS = ['golden', 'sunset', 'dusk', 'night', 'noon', 'golden', 'dusk', 'night'];
function weatherOf(N) { if (N <= 3) return ['golden', 'sunset', 'dusk'][N - 1]; const R = rng(N * 7741 + 5); R(); return WEATHERS[(R() * WEATHERS.length) | 0]; }
const RIDE = 8, GREEN = 0.36;      // eight seconds, and the dot in the green for over half of them

function makeCfg(N, help) { help = help || N === 1;      /* 26 Nov 2026, his words: "the first level should be the only one that is given": level 1 always has the help a loss gives */
  const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), boss = N % 10 === 0, e = easyOf(N);
  return { N, f, help: !!help, boss,
    inst: x(1.6, 4.5, 30) * (1 - 0.15 * e), lean: 9, damp: 6, wob: x(1.0, 3.0, 30) * (1 - 0.4 * e) * (N === 1 ? 0.7 : 1), fall: 1.1 + 0.07 * upLv('chaps') + (help ? 0.12 : 0),
    gap: x(0.22, 0.1, 30) * (1 + 0.3 * e), tell: x(0.52, 0.26, 35) * (N === 1 ? 1.3 : 1), buckA: x(30, 46, 35) * (1 - 0.25 * e) * (boss ? 1.1 : 1), spinA: x(7, 11, 35), kickA: x(38, 55, 35),
    spinP: N >= 2 ? x(0.15, 0.3, 30) : 0, kickP: N >= 4 ? x(0.1, 0.3, 30) : 0, fakeP: N >= 6 ? x(0.05, 0.3, 40) : 0, combo: x(0, 0.45, 40), first: x(0.7, 0.5, 20),
    qualify: 65 - (help ? 5 : 0), grip: 1.2 + 0.4 * upLv('glove'), gripCut: 0.5 + 0.08 * upLv('rope'), shoe: upLv('shoe'), spurs: upLv('spurs'), arrow: N <= 5 };
}
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0, R = rng(seed);
  const G = { N, cfg, seed, rnd: R, t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null,
    weather: weatherOf(N), bull: (cfg.boss ? 'King ' : '') + BULLS[(N * 5 + seed) % BULLS.length], th: (R() - 0.5) * 0.06, w: 0, u: 0, held: { l: false, r: false },
    grip: cfg.grip, gripping: false, ph: 'chute', pt: 0, ride: 0, moves: [], mv: null, nextAt: cfg.first, shoe: cfg.shoe, mid: 0, counters: 0, combo: 0, bestCombo: 0, wobT: 0, wobV: 0 };
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else G.ev.push({ k: 'chute' });
  return G;
}
// ---------- your thumbs ----------
function hold(G, side, on) { if (G.over) return; G.held[side] = !!on; }
function lean(G) { const l = G.held.l, r = G.held.r; G.gripping = l && r && G.grip > 0; return l && !r ? -1 : r && !l ? 1 : 0; }
// ---------- the bull: what he does next ----------
function planMove(G) {
  const c = G.cfg, R = G.rnd, L = lessonNow(G), d = R() < 0.5 ? -1 : 1;
  let k = 'buck'; const r = R(); if (L) k = L.id === 'lean' ? 'push' : L.id === 'grip' ? 'spin' : 'buck'; else if (r < c.fakeP) k = 'fake'; else if (r < c.fakeP + c.kickP) k = 'kick'; else if (r < c.fakeP + c.kickP + c.spinP) k = 'spin';
  const tell = k === 'push' ? 0.7 : c.tell * (k === 'kick' ? 0.75 : 1) * (L ? 1.3 : 1), dur = k === 'push' ? 1.2 : k === 'spin' ? 1.1 : k === 'kick' ? 0.16 : 0.24, A = k === 'push' ? 6.5 : k === 'spin' ? c.spinA : k === 'kick' ? c.kickA : k === 'fake' ? 0 : c.buckA * (L ? 0.85 : 1);
  return { k, d, tell, dur, A, t0: G.ride, counted: false };
}
// ---------- the ride ----------
function step(G, dt) {
  if (G.over) return; G.t += dt; G.pt += dt; const c = G.cfg, R = G.rnd;
  if (G.lessonWait) { if (G.pt < 1.3) return; G.lessonWait = false; resetRider(G); if (G.lessonEnd) { G.lessonEnd = false; G.ph = 'chute'; G.pt = 0; G.ev.push({ k: 'chute' }); } else { G.ph = 'ride'; G.pt = 0; } return; }
  if (G.ph === 'chute') { if (G.pt >= 0.5) { G.ph = 'ride'; G.pt = 0; G.ev.push({ k: 'gate' }); } return; }
  if (G.ph !== 'ride') return;
  G.ride += dt; const u = lean(G); G.u = u;
  // the bull's next move: first a tell (what you can read), then the throw
  if (!G.mv && G.ride >= G.nextAt) { G.mv = planMove(G); if (G.mv) G.ev.push({ k: 'tell', mv: G.mv.k, d: G.mv.d }); else G.nextAt = G.ride + c.gap; }
  let push = 0; const mv = G.mv;
  if (mv) { const t = G.ride - mv.t0 - mv.tell; if (t >= 0 && !mv.hit) { mv.hit = true; G.ev.push({ k: mv.k === 'fake' ? 'faked' : mv.k, d: mv.d }); }
    if (t < 0 && t > -0.15) { mv.pn = (mv.pn || 0) + 1; if (u === -mv.d) mv.pg = (mv.pg || 0) + 1; }      // were you already leaning against it as it came?
    if (t >= 0 && mv.met == null) { mv.met = (mv.pg || 0) >= 0.5 * (mv.pn || 1); if (mv.k !== 'fake') { G.nb = (G.nb || 0) + 1; if (mv.met) G.met = (G.met || 0) + 1; } }
    if (t >= 0 && t < mv.dur) { push = mv.d * mv.A; if (mv.k === 'push') { mv.hn = (mv.hn || 0) + 1; if (u === -mv.d) mv.hg = (mv.hg || 0) + 1; } else if (mv.met && u !== mv.d) push *= 0.15; }      // leaning against the throw before it lands takes almost all of it
    if (t >= mv.dur + 0.25) { const ok = mv.k === 'push' ? (mv.hg || 0) >= 0.7 * (mv.hn || 1) : Math.abs(G.th) < 0.45; if (mv.k !== 'fake') { if (ok) { G.counters++; G.combo++; G.bestCombo = Math.max(G.bestCombo, G.combo); G.ev.push({ k: 'rodeit', n: G.combo }); lessonSee(G, 'buck'); } else { G.combo = 0; lessonSee(G, 'wobbly'); } } else if (ok) lessonSee(G, 'fake');
      const chain = R() < c.combo; G.mv = null; G.nextAt = G.ride + (chain ? 0.15 : c.gap * (0.7 + R() * 0.6)); } }
  // the wobble: the bull is never still
  G.wobT -= dt; if (G.wobT <= 0) { G.wobT = 0.25 + R() * 0.35; G.wobV = (R() * 2 - 1) * c.wob; }
  const gripK = G.gripping ? 1 - c.gripCut : 1; if (G.gripping) { G.grip = Math.max(0, G.grip - dt); if (G.grip <= 0) G.ev.push({ k: 'gripgone' }); } else G.grip = Math.min(c.grip, G.grip + dt * 0.2);
  const acc = c.inst * Math.sin(G.th) * (G.gripping ? 1.4 : 1) + u * c.lean + (push + G.wobV) * gripK - c.damp * G.w;
  G.w += acc * dt; G.th += G.w * dt;
  if (Math.abs(G.th) < GREEN) G.mid += dt;
  if (Math.abs(G.th) > c.fall) { if (G.shoe > 0 && !G.lesson) { G.shoe--; G.th = Math.sign(G.th) * c.fall * 0.7; G.w = -G.w * 0.3; G.ev.push({ k: 'shoe' }); }
    else if (G.lesson) { G.ev.push({ k: 'thrown', d: Math.sign(G.th), lesson: true }); lessonMiss(G); resetRider(G); }
    else { G.ph = 'thrown'; G.pt = 0; G.ev.push({ k: 'thrown', d: Math.sign(G.th) }); finish(G, false); return; } }
  if (G.lesson) { lessonTick(G, dt); return; }
  if (G.ride >= RIDE) { G.ph = 'horn'; G.pt = 0; G.ev.push({ k: 'horn' }); const sc = scoreOf(G); if (sc >= G.cfg.qualify) finish(G, true); else { G.ev.push({ k: 'noscore', sc }); finish(G, false, 'score'); } }      // the judges mark the ride: too wild and it does not count
}
function resetRider(G) { G.th = (G.rnd() - 0.5) * 0.06; G.w = 0; G.mv = null; G.nextAt = G.ride + 0.9; G.grip = G.cfg.grip; }
// the judges: half for riding in the green, half for meeting his bucks (leaning against them before they land)
function scoreOf(G) { return Math.round(50 * clamp(G.mid / Math.max(1, G.ride), 0, 1) + 50 * (G.met || 0) / Math.max(1, G.nb || 0)) + 2 * G.cfg.spurs; }
function finish(G, win, why) {
  G.over = win ? 'won' : 'lost'; const sc = G.ride >= RIDE ? scoreOf(G) : 0, stars = win ? (sc >= 88 ? 3 : sc >= 78 ? 2 : 1) : 0;
  G.res = { win, why, stars, score: sc, ride: Math.min(RIDE, G.ride), counters: G.counters, combo: G.bestCombo, coins: (win ? 4 + Math.ceil(G.N / 3) + Math.max(0, Math.round((sc - 60) / 6)) : Math.floor(G.ride)) + G.counters + G.cfg.spurs * 2, time: G.t };
  G.ev.push({ k: win ? 'won' : 'lost', why });
}
// ---------- LESSONS ----------
const AIMCARD = {"pic": "🐂", "win": "STAY ON FOR 8 SECONDS", "lose": "GET THROWN OFF", "how": "HOLD THE SIDE AWAY FROM HIS LEAN"};      // the aim card: specs/aims.json (tools/aims.py)
const LESSONS = {
  1: [{ id: 'lean', title: 'LEAN AGAINST HIM', say: G => rodeoCue(G)[0], do: G => rodeoCue(G)[1], at: G => rodeoCue(G)[2], how: 'He leans you one way: the arrow shows which. Hold the OTHER half of the screen until he stops. Three in a row.', need: 3 }],
  2: [{ id: 'buck', title: 'THE BUCK', say: G => rodeoCue(G)[0], do: G => rodeoCue(G)[1], at: G => rodeoCue(G)[2], how: "His head swings to the side he's about to throw you. Hold the OTHER side just before he bucks. Ride out three bucks in a row.", need: 3 }],
  3: [{ id: 'grip', title: 'GRIP THE SPIN', say: G => rodeoCue(G)[0], do: G => rodeoCue(G)[1], at: G => rodeoCue(G)[2], how: 'When he drops his shoulder and spins, hold BOTH thumbs to grip. Ride out two spins in a row.', need: 2 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0, held: 0 }; G.ph = 'ride'; G.pt = 0; G.ev.push({ k: 'lessonnext', first: true }); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonTick(G, dt) {}
function lessonSee(G, what) { const D = G.lesson; if (!D) return; const st = lessonNow(G);
  if (what === 'wobbly') { D.n = 0; G.ev.push({ k: 'lessonmiss', how: st.how }); return; } if (what !== 'buck') return;
  D.n++; if (D.n < st.need) G.ev.push({ k: 'lessonok', n: D.n, need: st.need }); else lessonDone(G); }
function lessonMiss(G) { const D = G.lesson; D.n = 0; D.held = 0; G.ev.push({ k: 'lessonmiss', how: lessonNow(G).how }); }
function lessonDone(G) { const D = G.lesson; D.i++; D.n = 0; D.held = 0; if (D.i >= D.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.lessonEnd = true; G.lessonWait = true; G.pt = 0; G.ride = 0; G.mid = 0; G.counters = G.combo = G.bestCombo = 0; G.held = { l: false, r: false }; } }
// ---------- for the robots ----------
// BLIND: what two thumbs can do without looking: hold the left, hold the right, hold both, let go (each until the next move)
const BLIND = { l: G => { hold(G, 'l', true); hold(G, 'r', false); }, r: G => { hold(G, 'r', true); hold(G, 'l', false); }, b: G => { hold(G, 'l', true); hold(G, 'r', true); }, o: G => { hold(G, 'l', false); hold(G, 'r', false); } };
// a rider who looks: leans back against the tip (late by his reaction, sometimes wrong), reads the bull's head and leans against
// the throw just before it lands, grips through a spin, ignores a fake most of the time
// THE TUTORIAL SAYS WHICH SIDE, NOW (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing happens"). It said HOLD THE OTHER
// SIDE with a hand in a box: which side was his to work out. Now the robot is asked (dryPlanAll hold): HOLD LEFT / HOLD RIGHT with the hand on
// that half, HOLD BOTH SIDES for a spin, LET GO when he is level.
const RDC = { t: -1e9, v: null };
function rodeoCue(G) { if (G.over || G.ph !== 'ride' || G.lessonWait) return ['WAIT…', 'wait', false]; const now = performance.now(); if (now - RDC.t < 80) return RDC.v; RDC.t = now;
  const all = dryPlanAll(G, null, { next: -1 }), l = (all.filter(q => q[0] === 'hold' && q[1] === 'l').pop() || [])[2], r = (all.filter(q => q[0] === 'hold' && q[1] === 'r').pop() || [])[2]; let v;
  if (l && r) v = ['HOLD BOTH SIDES', 'hold', false]; else if (l) v = ['HOLD LEFT', 'hold', [W * 0.25, H * 0.62]]; else if (r) v = ['HOLD RIGHT', 'hold', [W * 0.75, H * 0.62]];
  else v = G.held.l || G.held.r ? ['LET GO', 'release', [W * (G.held.l ? 0.25 : 0.75), H * 0.62]] : ['RIDE…', 'wait', false]; RDC.v = v; return v; }
function honest(G, o, mem) {
  const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random, c = G.cfg;
  if (G.over || G.ph !== 'ride' || G.lessonWait) { mem.next = 0; return; }
  if (G.t < (mem.next || 0)) return; mem.next = G.t + 0.04 + react * 0.12;
  // what he has seen: the state a moment ago (his reaction), a little off
  mem.hist = mem.hist || []; mem.hist.push([G.t, G.th, G.w]); while (mem.hist.length > 2 && mem.hist[1][0] <= G.t - react * 0.25) mem.hist.shift(); const [, th, w] = mem.hist[0];
  const mv = G.mv; let want = null, grip = false;
  if (mv && mv.k !== 'fake') { const t = G.ride - mv.t0, seen = t > Math.min(mv.tell * 0.5, react * 0.6); if (mem.mv !== mv) { mem.mv = mv; mem.read = R() < Math.pow(acc, 0.45 / mv.tell) ? mv.d : (R() < 0.15 ? -mv.d : 0); }
    if (seen && mem.read) { if (mv.k === 'spin' && t > mv.tell - 0.1 && t < mv.tell + mv.dur) { if ((th + 0.32 * w) * mem.read > 0.15 || G.grip < 0.2) want = -mem.read; else grip = true; } else if (mv.k !== 'spin' && t > mv.tell - 0.2 && t < mv.tell + mv.dur * 0.9) want = -mem.read; } }
  if (mv && mv.k === 'fake' && mem.mv !== mv) { mem.mv = mv; mem.read = R() < 0.25 * (1 - acc) * 4 ? mv.d : 0; }
  if (want == null) { const s = th + 0.45 * w; want = s > 0.07 ? -1 : s < -0.07 ? 1 : 0; if (R() > acc) want = mem.prev != null ? mem.prev : 0; }      // a clumsy thumb: late to change, not random
  mem.prev = grip ? 0 : want; if (grip) { ACT.hold(G, 'l', true); ACT.hold(G, 'r', true); } else { ACT.hold(G, 'l', want < 0); ACT.hold(G, 'r', want > 0); }
}
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.ride = RIDE; G.mid = RIDE; G.met = G.nb = 1; finish(G, true); }

// what the robot would do now, without doing it (tools/dry_plan.py): the tutorial shows this move
const ACT_REAL = { hold }; let ACT = ACT_REAL;
function dryPlan(G, o, mem) { let got = null; const rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { if (!got && !(a.length > 2 && a.slice(1).every(v => v === 0 || v === false))) got = [n, ...a.slice(1)]; return true; };      /* (a stick at rest, all its numbers 0, is not a move; a first bed, number 0, is) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return got; }
function dryPlanAll(G, o, mem) { const all = [], rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { all.push([n, ...a.slice(1)]); return true; };      /* every call, in order (for a robot that steers and drifts at once) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return all; }
