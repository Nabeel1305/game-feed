
// ===================== RULES: Knife Spin (game 67, set 12: one of mine, like Knife Hit) =====================
// A wooden target spins in front of you. Tap to throw a knife up into it: it sticks where it lands. Stick every knife you
// are given and the target bursts apart; the next one drops in. Hit a knife that is already there and yours bounces off:
// that's the round. Apples on the rim are a bonus; knives already in it (and steel studs) are in the way. The spin changes:
// speeds up, slows, stops, turns back. Every fifth level ends on a boss target. A level is three targets (a boss is a fourth).
// Angles: the target's own frame; a knife always lands at the bottom of the target (screen angle +PI/2).
const RULES = [
  '<b>Tap</b> to throw a knife into the spinning target.',
  'Stick all your knives and it <b>bursts</b>. Three targets make a level.',
  'Hit a knife that is already in and you are <b>out</b>. Watch the gap at the bottom!',
  'Slice the <b>apples</b> on the rim for a bonus. Steel studs block like knives.',
  'The spin changes: it speeds up, stops, turns back. Every fifth level: a <b>boss</b>.',
];
const HIT = Math.PI / 2, KW = 0.27, FLY = 0.09;
const BOSSES = [{ name: 'The Cheese', col: '#ffcc40' }, { name: 'The Tyre', col: '#2a2a30' }, { name: 'The Shield', col: '#a8b4c0' }, { name: 'The Cake', col: '#ff9ac0' }, { name: 'The Melon', col: '#4ac060' }, { name: 'The Clock', col: '#e8d8b0' }];
const PLACES = [{ name: 'The Barn', bg: ['#3a2a1e', '#1a120c'] }, { name: 'The Dojo', bg: ['#4a1e1e', '#200c0c'] }, { name: 'The Circus', bg: ['#2a1e4a', '#100c24'] }, { name: 'The Docks', bg: ['#1e3a4a', '#0c1a24'] }];
const placeOf = N => Math.floor((N - 1) / 5) % 4;
const UPGRADES = [
  { id: 'spare', name: 'Spare knife', desc: 'Once a level, a knife that hits another does not end the round.', max: 1, cost: l => 90 },
  { id: 'fast', name: 'Quick arm', desc: 'Knives fly faster: less to judge.', max: 2, cost: l => 40 + l * 50 },
  { id: 'slow', name: 'Steady target', desc: 'Targets spin a little slower.', max: 2, cost: l => 50 + l * 60 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Beginner'], [40, 'Thrower'], [130, 'Sharp'], [320, 'Blade'], [700, 'Knife master'], [1500, 'Legend']];
function makeCfg(N, help) { const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), boss = N % 5 === 0;
  return { N, f, help: !!help, place: placeOf(N), boss, logs: boss ? 4 : 3, knives: Math.round(x(6, 8, 30)), obst: Math.round(x(1.6, 3, 30)), apples: Math.round(x(1, 3, 20)),
    spin: x(1.7, 2.45, 30) * (1 - 0.1 * upLv('slow')) * (help ? 0.85 : 1), wild: x(0.15, 1, 25), fly: FLY / (1 + 0.35 * upLv('fast')), spare: upLv('spare') + (help ? 1 : 0) }; }
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, place: cfg.place, wait: 0, next: null };
  setup(G); if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else { G.ev.push({ k: 'start' }); newLog(G); }
  return G; }
function setup(G) { G.li = 0; G.score = 0; G.apples = 0; G.applesAll = 0; G.thrown = 0; G.close = 0; G.combo = 0; G.lastStick = -9; G.spares = G.cfg.spare; G.spareUsed = 0; G.fly = null; G.log = null; }
// a target: how many knives, what is in it already, apples, and how it spins (a list of moves, each a speed for a time,
// eased from one to the next; later levels add stops, reverses and sudden changes)
function newLog(G, o = {}) { const c = G.cfg, R = G.rnd, last = G.li === c.logs - 1, boss = c.boss && last, lv = G.li;
  const need = o.need != null ? o.need : Math.round(c.knives + lv * 0.4 + (boss ? 2 : 0)), nob = o.obst != null ? o.obst : Math.max(0, Math.round(c.obst + lv * 0.3 - (G.N <= 1 && lv === 0 ? 1 : 0))), items = [];
  const freeAt = a => items.every(q => Math.abs(angd(q.a, a)) > KW * 1.6);
  if (o.items) for (const a of o.items) items.push({ a, kind: 'knife' }); else for (let i = 0; i < nob; i++) for (let t = 0; t < 30; t++) { const a = R() * TAU; if (freeAt(a)) { items.push({ a, kind: G.N >= 8 && R() < 0.3 ? 'stud' : 'knife' }); break; } }
  const apples = (o.appleAt || []).map(a => ({ a, gold: false })); const na = o.appleAt ? 0 : o.apples != null ? o.apples : c.apples; for (let i = 0; i < na; i++) for (let t = 0; t < 30; t++) { const a = R() * TAU; if (freeAt(a) && apples.every(q => Math.abs(angd(q.a, a)) > 0.6)) { apples.push({ a, gold: R() < 0.15 }); break; } }
  const moves = []; const base = c.spin * (boss ? 1.1 : 1) * (0.9 + R() * 0.2) * (R() < 0.5 ? 1 : -1);
  for (let i = 0; i < 12; i++) { const u = R(), w = c.wild; let v = base * (0.7 + R() * 0.6), d = 1.2 + R() * 2;
    if (u < w * 0.25 || i === 1 || i === 4) v = -v * (i === 1 || i === 4 ? 0.8 : 1); else if (u < w * 0.4) { v = 0; d = 0.4 + R() * 0.6; } else if (u < w * 0.55) v *= 1.6; moves.push({ v, d, ease: G.N <= 2 ? 0.8 : Math.max(0.3, 0.4 / (0.5 + w)) }); }      /* every target turns back now and then */
  if (o.moves) moves.splice(0, moves.length, ...o.moves);
  G.log = { need, stuck: 0, items, apples, rot: R() * TAU, w: moves[0].v, moves, mi: 0, mt: 0, boss, name: boss ? BOSSES[((G.N / 5) | 0) % BOSSES.length].name : null, shake: 0 }; G.fly = null;
  G.ev.push({ k: 'log', boss, li: G.li, need }); }
const angd = (a, b) => { let d = (a - b) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
// ---------- what you do ----------
// a throw rushed in straight after the last one (within 0.2 s of it sticking) wobbles and can land a little either way
function throwKnife(G) { if (G.over || G.wait > 0 || !G.log || G.fly) return false; const rushed = G.t - G.lastStick < 0.2 || G.t - (G.lastThrowT || -9) < 0.3;
  G.fly = { t: 0, err: rushed ? (G.rnd() * 2 - 1) * 0.34 : 0, rushed }; G.lastThrowT = G.t; G.thrown++; G.ev.push({ k: 'throw', rushed }); return true; }
// where on the target the knife at the bottom would land right now
const landAt = G => angd(HIT - G.log.rot, 0);
function arrive(G) { const L = G.log, a = angd(landAt(G) + G.fly.err, 0); G.fly = null;
  let near = 1e9; for (const q of L.items) near = Math.min(near, Math.abs(angd(q.a, a)));
  if (near < KW) { const by = L.items.find(q => Math.abs(angd(q.a, a)) < KW); G.ev.push({ k: 'clang', a, stud: by && by.kind === 'stud' });
    if (G.lesson) { lessonMiss(G); return; }
    if (G.spares > 0) { G.spares--; G.spareUsed++; G.ev.push({ k: 'spare' }); G.combo = 0; return; }
    G.wait = 1.0; G.next = () => finish(G, false); return; }
  L.items.push({ a, kind: 'mine', t: G.t }); L.stuck++; L.shake = 1; G.score += 1; const quick = G.t - G.lastStick < 0.6; G.combo = quick ? G.combo + 1 : 0; G.lastStick = G.t;
  const close = near < KW * 1.35; if (close) { G.close++; G.score += 2; }
  for (let i = L.apples.length - 1; i >= 0; i--) { const ap = L.apples[i]; if (Math.abs(angd(ap.a, a)) < 0.3) { L.apples.splice(i, 1); const v = ap.gold ? 5 : 1; G.apples += v; G.applesAll++; G.score += 5 * v; G.ev.push({ k: 'apple', a: ap.a, gold: ap.gold }); } }
  G.ev.push({ k: 'stick', a, n: L.stuck, need: L.need, close, combo: G.combo });
  if (G.lesson) lessonSee(G);
  if (L.stuck >= L.need) { G.ev.push({ k: 'burst', boss: L.boss, li: G.li, apples: L.apples.length }); if (G.lesson) return; G.score += 10 + (L.boss ? 25 : 0);
    G.li++; G.wait = L.boss ? 1.3 : 0.75; if (G.li >= G.cfg.logs) G.next = () => finish(G, true); else G.next = () => newLog(G); } }
function step(G, dt) { if (G.over || !(dt > 0)) return; G.t += dt;
  if (G.wait > 0) { G.wait -= dt; if (G.log) spin(G, dt * 0.3); if (G.wait <= 0) { G.wait = 0; const f = G.next; G.next = null; if (f) f(); } return; }
  if (!G.log) return; spin(G, dt); if (G.log.shake > 0) G.log.shake = Math.max(0, G.log.shake - dt * 6);
  if (G.fly) { G.fly.t += dt; if (G.fly.t >= G.cfg.fly) arrive(G); } }
function spin(G, dt) { const L = G.log, m = L.moves[L.mi]; L.mt += dt; if (L.mt >= m.d) { L.mt = 0; L.mi = (L.mi + 1) % L.moves.length; }
  const tgt = L.moves[L.mi].v, e = L.moves[L.mi].ease; L.w += (tgt - L.w) * Math.min(1, dt / Math.max(0.05, e)); L.rot = (L.rot + L.w * dt) % TAU; }
function finish(G, win) { if (G.over) return true; G.over = win ? 'won' : 'lost'; const c = G.cfg, L = G.log;
  const prog = Math.min(1, (G.li + (L ? L.stuck / L.need : 0)) / c.logs), stars = win ? 1 + (G.spareUsed === 0 ? 1 : 0) + (G.applesAll >= Math.max(1, c.apples * c.logs - 1) ? 1 : 0) : 0;
  G.res = { win, stars, score: G.score, prog, logs: G.li, need: c.logs, apples: G.apples, close: G.close, thrown: G.thrown, coins: Math.round(G.apples * 1.5) + (win ? 4 + Math.ceil(G.N / 3) + stars * 2 : 1) };
  G.ev.push({ k: win ? 'won' : 'lost' }); return true; }
// ---------- LESSONS: a slow target; a hit starts the lesson's target again ----------
// each lesson target is full of knives except for a few gaps, so only a throw timed for a gap gets in (blind tapping cannot)
const gapsAt = (n, off) => { const out = [], arc = TAU / n, m = Math.ceil((arc - 0.8) / 0.48) + 1; for (let k = 0; k < n; k++) for (let j = 0; j < m; j++) out.push(off + k * arc + 0.4 + j * (arc - 0.8) / (m - 1)); return out; };      /* knives no more than 0.48 apart: nothing fits between them */
const LESSONS = {
  1: [{ id: 'gap', title: 'THROW INTO THE GAPS', say: 'TAP AT THE GAP', do: 'tap', at: G => [W / 2, H * 0.7], how: 'Knives are already in this target. Tap when a GAP is at the bottom: one knife into each of the 3 gaps.', need: 1, log: { need: 3, items: gapsAt(3, 0), moves: [{ v: 1.15, d: 99, ease: 0.5 }] } }],
  2: [{ id: 'apple', title: 'APPLES', say: 'TAP AT THE APPLE', do: 'tap', at: G => [W / 2, H * 0.7], how: 'An apple sits in each gap. Throw when one is at the bottom to slice it: slice both.', need: 1, log: { need: 2, items: gapsAt(2, 0.3), appleAt: [0.3, 0.3 + Math.PI], moves: [{ v: -1.2, d: 99, ease: 0.5 }] } }],
  3: [{ id: 'turn', title: 'IT TURNS BACK', say: 'WAIT… TAP', do: 'tap', at: G => [W / 2, H * 0.7], how: 'This one stops and turns back. Watch it, wait for a gap to settle at the bottom, then throw. Fill the 3 gaps.', need: 1, log: { need: 3, items: gapsAt(3, 1), moves: [{ v: 1.3, d: 2.6, ease: 0.4 }, { v: 0, d: 0.6, ease: 0.3 }, { v: -1.1, d: 1.1, ease: 0.4 }, { v: 0, d: 0.6, ease: 0.3 }] } }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonDeal(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonDeal(G) { const st = lessonNow(G); G.apples = 0; G.applesAll = 0; G.li = 0; newLog(G, st.log); }
function lessonMiss(G) { const st = lessonNow(G); G.ev.push({ k: 'lessonmiss', how: st.how }); G.wait = 1.1; G.next = () => lessonDeal(G); }
function lessonSee(G) { const st = lessonNow(G), L = G.log; if (L.stuck < L.need) return;
  if (st.id === 'apple' && G.applesAll < 2) { G.ev.push({ k: 'lessonmiss', how: 'Slice 2 apples too: throw when one is at the bottom.' }); G.wait = 1.1; G.next = () => lessonDeal(G); return; }
  G.ev.push({ k: 'lessonok', n: 1, need: 1 }); G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.wait = 1.4; G.next = () => { G.rnd = rng(G.seed); setup(G); G.ev.push({ k: 'start' }); newLog(G); }; }
// ---------- for the robots ----------
// BLIND: a thumb that does not look: taps to throw
const BLIND = { t: G => throwKnife(G) };
// a player who looks: watches the bottom of the target and throws when the gap that will be there when the knife lands is
// wide enough (wider for a careful one), a beat late now and then, and goes for an apple when it comes round
function honest(G, o, mem) { const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random;
  if (G.over || G.wait > 0 || !G.log || G.fly) { mem.t = 0; mem.go = null; return; }
  if (mem.go != null) { mem.go -= 1 / 60; if (mem.go <= 0) { mem.go = null; throwKnife(G); mem.t = 0; } return; }      /* the thumb moves a moment after the eye decides */
  const acc2 = mem.w0 == null ? 0 : Math.abs(G.log.w - mem.w0) * 60; mem.w0 = G.log.w;
  mem.t = (mem.t || 0) + 1 / 60; if (mem.t < 0.15 + react * 0.4) return; if (acc2 > 2.5 && R() < acc) return;      /* the spin is changing: wait for it to settle */
  const L = G.log, late = 0.02 + react * 0.08, lag = G.cfg.fly + late, a = angd(HIT - (L.rot + L.w * lag), 0);
  let near = 1e9; for (const q of L.items) near = Math.min(near, Math.abs(angd(q.a, a))); const apple = L.apples.some(q => Math.abs(angd(q.a, a)) < 0.2);
  // how wide a gap to wait for: comfortable if there is one, else the middle of the widest there is
  const as = L.items.map(q => ((q.a % TAU) + TAU) % TAU).sort((p, q) => p - q); let gap = TAU; for (let i = 0; i < as.length; i++) gap = Math.min(TAU, i ? gap : 0) || gap; let wide = 0; for (let i = 0; i < as.length; i++) { const g = ((as[(i + 1) % as.length] - as[i]) + TAU) % TAU || TAU; wide = Math.max(wide, g); }
  const need = Math.min(KW * (1.3 + (1 - acc) * 0.5), Math.max(KW * 1.04, wide / 2 * 0.8));
  if (near > need && (apple || R() < 0.05 + acc * 0.08)) mem.go = Math.max(0, late + (R() + R() - 1) * (0.015 + react * 0.06 + (1 - acc) * 0.05)); }
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.wait = 0; G.li = G.cfg.logs; finish(G, true); }
