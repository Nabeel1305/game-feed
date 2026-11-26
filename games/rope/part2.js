// ===================== RULES: High Wire (game 52, his idea) =====================
// You walk a wire strung high between two places (a canyon, city towers, a waterfall gorge, a mountain pass). One thumb does it
// all, as a floating stick: slide it left or right to swing your balancing pole (you lean back the other way); push it up to
// walk, let it rest to stand (steadier), pull it down to crouch (slower, steadier, and the only way under a low banner).
// You are always tipping a little: the further you lean the faster you go over, so you catch it early. Walking jolts you at each
// step; wind gusts push (flags stream ahead of a gust); birds sit on the wire and shake it as they fly off; sandbags swing
// across it (wait, then go). Past 0.45 of lean the wire creaks and your heart pounds: a last chance to pull back. Further,
// you fall: back to the last platform, one of your three tries gone. Lean out to snatch the stars hanging beside the wire
// (a risk for points). Reach the far side.
const RULES = [
  'Put your thumb down anywhere. <b>Slide left or right</b> to swing your pole and lean back. Catch a wobble early!',
  '<b>Push up</b> to walk. Let it rest in the middle to <b>stand</b>: you are steadier standing.',
  '<b>Pull down</b> to crouch: slower, steadier, and the only way under a <b>low banner</b>.',
  'Flags stream before a <b>gust</b>. Birds shake the wire. <b>Sandbags</b> swing across it: wait, then go.',
  'Lean out to grab a <b>star</b>, if you dare. Three falls and the crowd goes home.',
];
const WEATHERS = ['golden', 'morning', 'noon', 'sunset', 'mist', 'overcast', 'dusk', 'storm', 'dawn', 'rain'];
function weatherOf(N) { if (N <= 3) return ['golden', 'morning', 'noon'][N - 1]; const R = rng(N * 4421 + 9); R(); return WEATHERS[(R() * WEATHERS.length) | 0]; }
const PLACES = [{ name: 'Red Canyon', h: 120 }, { name: 'City Towers', h: 180 }, { name: 'Waterfall Gorge', h: 90 }, { name: 'Mountain Pass', h: 300 }];
const placeOf = N => Math.floor((N - 1) / 4) % 4;
const UPGRADES = [
  { id: 'pole', name: 'Longer pole', desc: 'Your pole pulls you back 10% harder.', max: 2, cost: l => 35 + l * 45 },
  { id: 'shoes', name: 'Soft shoes', desc: 'Each step jolts you less.', max: 2, cost: l => 30 + l * 40 },
  { id: 'nerve', name: 'Steady nerve', desc: 'A little more lean before you fall.', max: 2, cost: l => 40 + l * 45 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Rookie'], [40, 'Wire walker'], [130, 'Funambulist'], [320, 'Daredevil'], [700, 'Sky walker'], [1500, 'Legend of the wire']];
function makeCfg(N, help) { const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), e = easyOf(N);
  return { N, f, help: !!help, place: placeOf(N), weather: weatherOf(N), len: Math.round(x(30, 110, 30)), tip: x(2.2, 3.1, 30) * (1 - 0.15 * e) * (help ? 0.85 : 1), jolt: x(0.25, 0.42, 30) * (1 - 0.15 * upLv('shoes')) * (help ? 0.8 : 1),
    wind: N >= 2 ? x(0.35, 1.1, 30) : 0, birds: N >= 3 ? x(0.5, 2, 30) : 0, banners: N >= 4 ? x(0.5, 2, 30) : 0, bags: N >= 5 ? x(0.5, 2.2, 30) : 0, stars: Math.round(x(2, 5, 25)),
    pull: 7 * (1 + 0.1 * upLv('pole')), fall: 0.72 + 0.04 * upLv('nerve') + (help ? 0.05 : 0), lives: 3, cp: 40 }; }
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(N * 3331 + 1), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, place: cfg.place, weather: cfg.weather, wait: 0,
    me: { s: 0, th: 0, w: 0, step: 0, walking: false, crouch: false, cp: 0 }, in: { down: false, u: 0, walk: false, crouch: false }, lives: cfg.lives, falls: 0, got: 0, gust: 0, gustT: 0, shake: 0 };
  buildWire(G); G.rnd = rng(seed); if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else G.ev.push({ k: 'start' });
  return G; }
// the wire's things, laid along it (fixed per level, so a run can be learned)
function buildWire(G) { const c = G.cfg, R = G.rnd, L = c.len, things = []; G.len = L;
  const put = (k, n, o = {}) => { for (let i = 0; i < Math.round(n * L / 50); i++) things.push(Object.assign({ k, s: 8 + R() * (L - 14), side: R() < 0.5 ? -1 : 1, ph: R() * TAU, done: false }, o)); };
  put('bird', c.birds); put('banner', c.banners); put('bag', c.bags); for (let i = 0; i < c.stars; i++) things.push({ k: 'star', s: 6 + (L - 12) * (i + 0.5) / c.stars, side: R() < 0.5 ? -1 : 1, done: false });
  // gusts: when, how strong, which way (the flags show them a second and a half early)
  G.gusts = []; let t = 4 + R() * 4; while (t < 400 && c.wind) { G.gusts.push({ t, dir: R() < 0.5 ? -1 : 1, str: c.wind * (0.6 + R() * 0.6), dur: 1.4 + R() * 1.4 }); t += 5 + R() * 6; }
  things.sort((a, b) => a.s - b.s); for (let i = 1; i < things.length; i++) if (things[i].s - things[i - 1].s < 4 && things[i].k !== 'star' && things[i - 1].k !== 'star') things[i].s += 4;
  G.things = things.filter(q => q.s < L - 3); G.cps = []; for (let s = c.cp; s < L - 10; s += c.cp) G.cps.push(s); }
const leanNow = G => G.me.th;
// ---------- what you do ----------
function hold(G, on) { G.in.down = !!on; if (!on) { G.in.u = 0; G.in.crouch = false; G.in.walk = false; } }
function walk(G, on) { G.in.walk = !!on; }
function lean(G, u) { G.in.u = clamp(u, -1, 1); }
function crouch(G, on) { G.in.crouch = !!on; }
// ---------- the wire, step by step ----------
function step(G, dt) { if (G.over || !(dt > 0)) return; G.t += dt; if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0) { G.wait = 0; const f = G.next; G.next = null; if (f) f(); } return; }
  const c = G.cfg, m = G.me, I = G.in, R = G.rnd; G.shake = Math.max(0, G.shake - dt * 2);
  m.crouch = I.down && I.crouch; m.walking = I.down && (I.walk || I.crouch);
  // the wind
  const gs = G.gusts.find(q => G.t >= q.t - 1.6 && G.t < q.t + q.dur); G.gustWarn = gs && G.t < gs.t ? gs : null; G.gust = gs && G.t >= gs.t ? gs.dir * gs.str * Math.sin(Math.PI * (G.t - gs.t) / gs.dur) : 0;
  if (gs && G.t >= gs.t && !gs.said) { gs.said = true; G.ev.push({ k: 'gust', dir: gs.dir }); }
  // the body: an upturned pendulum; the pole pulls back; a crouch lowers you (slower to tip)
  const tipK = c.tip * (m.crouch ? 0.6 : 1) * (m.walking ? 1 : 0.85), acc = tipK * Math.sin(m.th) * 2.2 - c.pull * I.u * 0.55 + G.gust * 1.3 - m.w * 1.1;
  m.w += acc * dt; m.th += m.w * dt;
  // walking: forward, a jolt each step
  if (m.walking) { const sp = m.crouch ? 0.55 : 1.15; m.s = Math.min(G.len, m.s + sp * dt); m.step -= dt * sp; if (m.step <= 0) { m.step = 0.55; m.w += (R() - 0.5) * 2 * c.jolt * (m.crouch ? 0.6 : 1); G.ev.push({ k: 'step' }); } }
  // things on the wire
  for (const q of G.things) { if (q.done) continue; const d = q.s - m.s;
    if (q.k === 'bird' && d < 3 && d > -1) { q.done = true; m.w += (R() < 0.5 ? -1 : 1) * 0.9 * c.jolt / 0.3; G.shake = 1; G.ev.push({ k: 'bird' }); }
    if (q.k === 'banner' && Math.abs(d) < 0.4 && m.walking) { q.done = true; if (!m.crouch) { m.w += q.side * 2.4; G.ev.push({ k: 'banner', hit: true }); lessonSee(G, 'banner', false); } else { G.ev.push({ k: 'banner', hit: false }); lessonSee(G, 'banner', true); } }
    if (q.k === 'bag') { const sw = Math.sin(G.t * 1.6 + q.ph); q.x = sw * 1.8; if (Math.abs(d) < 0.5 && Math.abs(q.x) < 0.45 && !q.hitT) { q.hitT = 1.2; m.w += Math.sign(sw - Math.sin((G.t - 0.05) * 1.6 + q.ph) || 1) * 2.2; G.ev.push({ k: 'bag' }); lessonSee(G, 'bag', false); } if (q.hitT) q.hitT = Math.max(0, q.hitT - dt); if (d < -0.6 && !q.passed) { q.passed = true; if (!q.hitT) lessonSee(G, 'bag', true); } }
    if (q.k === 'star' && Math.abs(d) < 0.5) { if (Math.sign(m.th) === q.side && Math.abs(m.th) > 0.28) { q.done = true; G.got++; G.ev.push({ k: 'star', n: G.got }); lessonSee(G, 'star'); } else if (d < -0.4) q.done = true; } }
  // checkpoints
  for (const cp of G.cps) if (m.s >= cp && m.cp < cp) { m.cp = cp; G.ev.push({ k: 'cp' }); }
  // the edge: a creak, a heartbeat, the fall
  const lim = c.fall; if (Math.abs(m.th) > lim * 0.55 && !m.warned) { m.warned = true; G.ev.push({ k: 'danger' }); } if (Math.abs(m.th) < lim * 0.3 && m.warned) { m.warned = false; G.ev.push({ k: 'saved' }); lessonSee(G, 'saved'); }
  if (Math.abs(m.th) > lim) return fall(G);
  if (m.s >= G.len) { if (G.lesson) { lessonSee(G, 'end'); return; } return finish(G, true); } }
function fall(G) { const m = G.me; G.falls++; G.ev.push({ k: 'fall', dir: Math.sign(m.th) }); lessonSee(G, 'fall');
  if (!G.lesson) { G.lives--; if (G.lives <= 0) { G.wait = 1.4; G.next = () => finish(G, false); return; } }
  G.wait = 1.6; G.next = () => { m.s = G.lesson ? 0 : m.cp; m.th = 0; m.w = 0; m.warned = false; for (const q of G.things) if (q.s > m.s && q.k !== 'star') { q.done = false; q.passed = false; } G.ev.push({ k: 'back' }); }; }
function finish(G, win) { if (G.over) return; const c = G.cfg; G.over = win ? 'won' : 'lost'; const t = Math.round(G.t);
  const stars = win ? 1 + (G.falls === 0 ? 1 : 0) + (G.got >= Math.ceil(c.stars * 0.6) ? 1 : 0) : 0;
  G.res = { win, stars, time: t, falls: G.falls, got: G.got, of: c.stars, len: G.len, dist: Math.round(G.me.s), coins: win ? 4 + Math.ceil(G.N / 3) + stars * 2 + G.got : 1 };
  G.ev.push({ k: win ? 'won' : 'lost' }); }
// ---------- LESSONS ----------
const AIMCARD = {"pic": "🤸", "win": "WALK ACROSS THE WIRE", "lose": "FALL OFF TOO OFTEN", "how": "PUSH UP TO WALK, SLIDE TO BALANCE"};      // the aim card: specs/aims.json (tools/aims.py)
const LESSONS = {
  1: [{ id: 'walk', title: 'WALK AND LEAN', say: G => ropeCue(G)[0], do: G => ropeCue(G)[1], at: G => ropeCue(G)[2], how: 'Thumb down, push UP to walk. When you tip, slide the OTHER way to swing the pole and pull back. Cross 20 m without falling.', need: 1 }],
  2: [{ id: 'wind', title: 'WIND', say: G => ropeCue(G)[0], do: G => ropeCue(G)[1], at: G => ropeCue(G)[2], how: 'When the flags stream and WIND shows, stop walking (thumb to the middle) and lean into it, then go on. Cross 25 m in the wind.', need: 1 }],
  3: [{ id: 'star', title: 'REACH FOR IT', say: G => ropeCue(G)[0], do: G => ropeCue(G)[1], at: G => ropeCue(G)[2], how: 'A star hangs beside the wire. As you reach it, lean out towards it (just enough), then pull back. Grab two.', need: 2 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonSetup(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonSetup(G) { const st = lessonNow(G), m = G.me; m.s = 0; m.th = 0; m.w = 0; m.cp = 0; G.len = st.id === 'walk' ? 20 : 30; G.things = []; G.cps = [];
  if (st.id === 'wind') { G.len = 25; G.gusts = []; for (let i = 0; i < 12; i++) G.gusts.push({ t: G.t + 2.5 + i * 4.5, dir: i % 2 ? 1 : -1, str: 0.8, dur: 2 }); }
  if (st.id === 'star') for (let i = 0; i < 5; i++) G.things.push({ k: 'star', s: 5 + i * 5, side: i % 2 ? 1 : -1, done: false }); }
function lessonSee(G, what, d) { const st = lessonNow(G); if (!st) return; let ok = null;
  if (st.id === 'walk') { if (what === 'end') ok = true; if (what === 'fall') ok = false; }
  if (st.id === 'wind') { if (what === 'end') ok = true; if (what === 'fall') ok = false; }
  if (st.id === 'star') { if (what === 'star') ok = true; if (what === 'fall') ok = false; if (what === 'end') { G.ev.push({ k: 'lessonmiss', how: st.how }); G.lesson.n = 0; lessonSetup(G); return; } }
  if (ok == null) return;
  if (!ok) { G.lesson.n = 0; G.ev.push({ k: 'lessonmiss', how: st.how }); return; }
  G.lesson.n++; if (G.lesson.n < st.need) { G.ev.push({ k: 'lessonok', n: G.lesson.n, need: st.need }); return; }
  G.lesson.i++; G.lesson.n = 0; if (G.lesson.i >= G.lesson.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.wait = 1.6; G.next = () => { G.rnd = rng(G.N * 3331 + 1); buildWire(G); G.rnd = rng(G.seed); Object.assign(G.me, { s: 0, th: 0, w: 0, cp: 0 }); G.t = 0; G.falls = 0; G.got = 0; G.ev.push({ k: 'start' }); }; } else lessonSetup(G); }
// ---------- for the robots ----------
// BLIND: a thumb that does not look: puts the thumb down somewhere (walking, leaning some way), slides down (crouch), or lifts
const BLIND = { d: G => { hold(G, true); lean(G, Math.random() * 2 - 1); walk(G, Math.random() < 0.6); crouch(G, false); }, c: G => { hold(G, true); crouch(G, Math.random() < 0.5); }, u: G => hold(G, false) };
// a walker who looks: pulls against the lean and its speed (a little late, a little off), stands still when it is wobbling, crouches
// for banners, waits for a sandbag to swing clear, reaches for stars when steady
// THE TUTORIAL SAYS WHICH WAY NOW (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing happens"). It said PUSH UP, SLIDE TO
// LEAN (two at once) with a hand sliding in a box; which way to lean was his to work out. Now the robot is asked (dryPlanAll): PUSH UP: WALK,
// SLIDE LEFT / SLIDE RIGHT (the way it would lean, from where the thumb went down), THUMB TO THE MIDDLE, PULL DOWN: CROUCH.
const RPC = { t: -1e9, v: null };
function ropeCue(G) { if (G.over || G.wait > 0) return ['WAIT…', 'wait', false]; const now = performance.now(); if (now - RPC.t < 120) return RPC.v; RPC.t = now; const all = dryPlanAll(G, null, { t: -1, next: -1 }), last = n => (all.filter(q => q[0] === n).pop() || [])[1];
  const d = ui.drag, x0 = d ? d.x0 : W / 2, y0 = d ? d.y0 : H * 0.7, R = 48 * k, u = last('lean') || 0, wk = last('walk'), cr = last('crouch'); let v;
  if (!d && !wk && Math.abs(u) < 0.2 && !cr) v = ['THUMB DOWN', 'hold', [x0, y0]];
  else if (cr) v = ['PULL DOWN: CROUCH', 'drag', [x0, y0, x0 + u * R * 0.8, y0 + R * 0.7]];
  else if (Math.abs(u) > 0.25) v = [u < 0 ? 'SLIDE LEFT' : 'SLIDE RIGHT', 'drag', [x0, y0, x0 + u * R * 0.8, y0 + (wk ? -R * 0.5 : 0)]];
  else if (wk) v = ['PUSH UP: WALK', 'drag', [x0, y0, x0 + u * R * 0.8, y0 - R * 0.5]];
  else v = ['THUMB TO THE MIDDLE', 'drag', [d ? d.x : x0, d ? d.y : y0, x0, y0]];
  RPC.v = v; return v; }
function honest(G, o, mem) { const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, m = G.me, c = G.cfg, R = Math.random;
  if (G.over || G.wait > 0) { ACT.hold(G, false); mem.hist = []; return; }
  mem.hist = mem.hist || []; mem.hist.push([m.th, m.w]); const lag = Math.round(react * 0.25 * 60), seen = mem.hist[Math.max(0, mem.hist.length - 1 - lag)]; if (mem.hist.length > 120) mem.hist.shift();
  mem.t = (mem.t || 0) - 1 / 60; if (mem.t > 0) return; mem.t = 0.03 + react * 0.08;
  const th = seen[0] + (R() - 0.5) * (1 - acc) * 0.12, w = seen[1], gustAhead = G.gustWarn ? G.gustWarn.dir * G.gustWarn.str * 0.35 : 0;
  // which star to reach for
  const star = G.things.find(q => q.k === 'star' && !q.done && q.s - m.s < 0.9 && q.s - m.s > -0.3);
  const want = star && (acc > 0.75 || G.lesson) && Math.abs(w) < 0.4 ? star.side * 0.36 : 0;
  let u = clamp(((th - want) * 3.4 + w * 1.25 + G.gust * 0.25 + gustAhead) * (0.75 + acc * 0.25), -1, 1);
  const wobbly = Math.abs(th - want) > 0.3 || Math.abs(w) > 0.9;
  const bag = G.things.find(q => q.k === 'bag' && q.s - m.s < 1.8 && q.s - m.s > 0.6), inBag = G.things.some(q => q.k === 'bag' && Math.abs(q.s - m.s) <= 0.6), bagClear = !bag || (Math.abs(Math.sin((G.t + 0.9) * 1.6 + bag.ph) * 1.8) > 0.9 && Math.abs(Math.sin((G.t + 0.4) * 1.6 + bag.ph) * 1.8) > 0.6);
  const banner = G.things.find(q => q.k === 'banner' && !q.done && q.s - m.s < 1.2 && q.s - m.s > -0.5);
  const go = inBag || (!wobbly && bagClear && !(G.gust && Math.abs(G.gust) > 0.6));
  ACT.hold(G, true); ACT.lean(G, u); ACT.walk(G, go); ACT.crouch(G, go && (!!banner || (G.gust && Math.abs(G.gust) > 0.5)));
  mem.walk = go; }
function winNow(G) { if (!G || G.over || G.wait > 0) return; G.lesson = null; finish(G, true); }

// what the robot would do now, without doing it (tools/dry_plan.py): the tutorial shows this move
const ACT_REAL = { hold, walk, lean, crouch }; let ACT = ACT_REAL;
function dryPlan(G, o, mem) { let got = null; const rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { if (!got && !(a.length > 2 && a.slice(1).every(v => v === 0 || v === false))) got = [n, ...a.slice(1)]; return true; };      /* (a stick at rest, all its numbers 0, is not a move; a first bed, number 0, is) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return got; }
function dryPlanAll(G, o, mem) { const all = [], rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { all.push([n, ...a.slice(1)]); return true; };      /* every call, in order (for a robot that steers and drifts at once) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return all; }
