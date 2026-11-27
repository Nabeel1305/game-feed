// ===================== RULES: Joust =====================
// Two riders charge down either side of the tilt barrier. Your left thumb sets your lean (it moves your shield, and leaning
// far costs balance); your right thumb aims the lance at their shield, and the tip sways with the gallop in a steady
// figure-of-eight you can learn. Hold BRACE just before the crash: too early and your arm tires (the sway grows), too late
// and you take the hit unbraced. Points: a hit on the shield 1, a clean hit in the centre while braced breaks the lance 2;
// unseat them and you win outright. Three passes (a fourth on a tie).
// The shield plane: x across (metres, + to your right as you look at them), y up, 0 at the shield's centre.

const RULES = [
  '<b>Right thumb: aim.</b> Drag to move the lance tip onto their shield. It sways with the gallop in a steady rhythm: learn where it will be at the crash.',
  '<b>Left thumb: lean.</b> It moves your shield; a late lean makes their lance glance off. Leaning far costs balance.',
  '<b>Lift your right thumb to BRACE</b>: the lance locks where you aimed and you brace. Do it just before the crash (the pad glows). Too early and your arm tires; too late and you take the hit unbraced. Touch the pad again to aim again.',
  '<b>Points:</b> a shield hit 1; a clean hit in the centre, braced, breaks the lance: 2. Knock them off and you win outright. Three passes.',
  'Watch them: one aims well but wobbles after a hit, one braces like a wall, one shifts at the last moment (their head dips first).',
];
const SKINS = [{ id: 'blue', name: 'Azure & silver', col: 0x2a4a9a, col2: 0xd8d8d8, stars: 0 }, { id: 'red', name: 'Gules & gold', col: 0x9a2a2a, col2: 0xd8b040, stars: 6 }, { id: 'green', name: 'Vert & white', col: 0x2a7a3a, col2: 0xf0f0f0, stars: 14 },
  { id: 'black', name: 'Sable & silver', col: 0x222428, col2: 0xc8c8c8, stars: 24 }, { id: 'purple', name: 'Purpure & gold', col: 0x5a2a7a, col2: 0xe0b040, stars: 36 }, { id: 'gold', name: 'Or & azure', col: 0xc8a030, col2: 0x2a4a9a, stars: 50 }];
const UPGRADES = [{ id: 'lance', name: 'Balanced lance', max: 2, cost: l => [60, 140][l], desc: 'The tip sways a little less.' }, { id: 'saddle', name: 'High-backed saddle', max: 2, cost: l => [70, 160][l], desc: 'Hits push you back less.' },
  { id: 'horse', name: 'Steady destrier', max: 1, cost: () => 120, desc: 'A smoother, slower rhythm.' }];
const upLv = id => { if (typeof HEADLESS !== 'undefined' && HEADLESS) return 0; return ((store.get('ups', {}) || {})[id]) | 0; };
const RANKS = [[0, 'Squire'], [60, 'Knight'], [200, 'Knight banneret'], [500, 'Champion'], [1100, 'Lord of the lists'], [2500, 'Legend of the tourney']];
const PLACES = [{ name: 'Village green', sky: 'morning' }, { name: 'Castle lists', sky: 'noon' }, { name: 'The royal tourney', sky: 'golden' }, { name: 'Autumn fair', sky: 'overcast' }];
const placeOf = N => N <= 2 ? 0 : Math.floor((N - 3) / 4) % 4;
const RIVALS = [
  { name: 'Sir Aldric the Steady', habit: 'steady', aim: 0.10, brace: 0.6, recover: 0.35, lean: 0 },
  { name: 'Dame Isolde of the Fen', habit: 'aims', aim: 0.06, brace: 0.5, recover: 0.12, lean: 0 },
  { name: 'Sir Brannoc the Wall', habit: 'wall', aim: 0.12, brace: 0.95, recover: 0.3, lean: 0 },
  { name: 'The Grey Knight', habit: 'shifts', aim: 0.09, brace: 0.6, recover: 0.25, lean: 1 },
  { name: 'Lady Morwen Swiftlance', habit: 'aims', aim: 0.05, brace: 0.7, recover: 0.2, lean: 0.5 },
  { name: 'Sir Gareth Ironhand', habit: 'wall', aim: 0.08, brace: 0.9, recover: 0.4, lean: 0.3 },
];
const HABIT = { steady: 'rides steady and true', aims: 'aims well, but wobbles after a hit', wall: 'braces like a wall', shifts: 'shifts their shield at the last moment: watch their head dip' };
const SHIELD = 0.26, CLEAN = 0.09, PASS_T = 4.2, BW = G => G.N <= 3 ? 1.0 : G.N <= 6 ? 0.8 : 0.6;      // the brace window (s before the crash): wider on the first levels (27 Nov 2026)
function makeCfg(N, help, o = {}) {
  const f = curve(N), e = easyOf(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s));
  return { N, f, e, help: !!help, place: placeOf(N), training: N <= 2, rival: N <= 2 ? null : (N - 3) % RIVALS.length, assist: x(0.45, 0.1, 12) * (help ? 1.3 : 1), sway: x(0.3, 0.42, 15) * (1 - 0.12 * upLv('lance')),
    rhythm: x(1.6, 2.3, 15) * (1 - 0.1 * upLv('horse')), rivalSkill: x(0.6, 1.2, 14) * (help ? 0.8 : 1), sturdy: x(1, 0.6, 15), passes: 3, needClean: 3, of: 5 };
}
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help, o), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, mini: !!o.mini };
  G.R = cfg.rival == null ? null : Object.assign({}, RIVALS[cfg.rival]); G.pass = 0; G.pts = [0, 0]; G.bal = [0, 0]; G.clean = 0; G.hits = 0; G.log = [];
  G.aim = { x: 0, y: 0 }; G.lean = 0; G.brace = false; G.braceT = null; startPass(G);
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G);
  return G;
}
function startPass(G) { const R = G.rnd; G.pass++; G.phase = 'charge'; G.pt = 0; G.braceT = null; G.brace = false; G.phi = R() * TAU; G.tired = 0; G.aim = { x: 0, y: 0.6 }; G.lean = 0; G.body = 0; G.leanAtTell = null; G.sh0 = { x: -0.14 + (R() - 0.5) * 0.24, y: 0.02 + (R() - 0.5) * 0.2 };   // where their shield sits this pass (the shield arm, how they sit)   // the lance starts raised: lower it and aim
  // the rival this pass: where they will aim (at you), when they brace, and (for some) a late shift with its tell
  const Rv = G.R; if (Rv) { const sk = G.cfg.rivalSkill; G.rv = { err: { x: (R() - 0.5) * 2 * (Rv.aim + 0.04) / sk, y: (R() - 0.5) * 2 * (Rv.aim + 0.04) / sk }, braceAt: PASS_T - 0.25 - R() * 0.2, braced: R() < Rv.brace * Math.min(1.2, sk), shift: Rv.lean && R() < Rv.lean ? (R() < 0.5 ? -1 : 1) * 0.22 : 0, tellAt: PASS_T - 0.9 }; }
  else G.rv = { err: { x: 0, y: 0 }, braceAt: 99, braced: false, shift: 0, tellAt: 99 };
  G.ev.push({ k: 'pass', n: G.pass }); }
// the lance tip: where you aim, plus the gallop's sway (a figure of eight), bigger when your arm has tired from bracing early
function sway(G, t) { const c = G.cfg, w = TAU * c.rhythm, A = c.sway * (1 + G.tired * 1.5); return { x: A * Math.sin(w * t + G.phi), y: A * 0.6 * Math.sin(2 * w * t + G.phi * 2) }; }
const tip = (G, t = G.pt) => { const s = sway(G, t); return { x: G.aim.x + s.x, y: G.aim.y + s.y }; };
// where their shield is (it moves with their lean; a late shifter moves it in the last half second)
const rivalShield = (G, t = G.pt) => ({ x: G.sh0.x + (G.rv.shift && t > PASS_T - 0.45 ? G.rv.shift : 0), y: G.sh0.y });
// ---------- the player's actions ----------
function setAim(G, x, y) { G.aim = { x: clamp(x, -0.7, 0.7), y: clamp(y, -0.6, 0.6) }; }
function setLean(G, l) { G.lean = clamp(l, -1, 1); }
function braceOn(G, on) { if (G.over || G.phase !== 'charge') { G.brace = false; return false; } if (on && !G.brace) { G.braceT = G.pt; G.ev.push({ k: 'brace' }); } G.brace = !!on; return true; }
// ---------- every frame ----------
function step(G, dt) { if (G.over || !(dt > 0)) return; G.t += dt; if (G.lesson) lessonTick(G, dt);
  if (G.blindT != null) { G.blindT -= dt; if (G.blindT <= 0) { G.blindT = null; braceOn(G, false); } }
  G.body = (G.body || 0) + (G.lean - (G.body || 0)) * Math.min(1, dt * 3.5);   // the rider's body follows the thumb, with weight
  if (G.phase === 'charge') { G.pt += dt; if (G.brace && G.braceT != null && G.pt - G.braceT > BW(G)) G.tired = Math.min(1, G.tired + dt * 0.9);
    if (G.rv.shift && G.pt > G.rv.tellAt && !G.told) { G.told = true; G.ev.push({ k: 'tell', side: Math.sign(G.rv.shift) }); }
    if (G.leanAtTell == null && G.pt > PASS_T - 0.6) G.leanAtTell = G.body;
    if (G.pt >= PASS_T) clash(G); }
  else if (G.phase === 'after') { G.afterT -= dt; if (G.afterT <= 0) nextPass(G); } }
// the crash: your tip against their shield, their tip against yours; who was braced; who is still in the saddle
function clash(G) { const c = G.cfg, R = G.rnd; G.phase = 'after'; G.afterT = 2.2; G.told = false;
  let tp = tip(G); tp = { x: tp.x - G.body * 0.2, y: tp.y + Math.abs(G.body) * 0.08 }; const sh = rivalShield(G), dx0 = tp.x - sh.x, dy0 = tp.y - sh.y, d0 = Math.hypot(dx0, dy0);
  if (d0 < SHIELD * 1.2) { const pull = c.assist * clamp(1 - d0 / (SHIELD * 1.2), 0, 1); tp = { x: tp.x - dx0 * pull, y: tp.y - dy0 * pull }; }   // aim help: only near the shield
  const d = Math.hypot(tp.x - sh.x, tp.y - sh.y), myBrace = G.braceT != null && G.brace ? PASS_T - G.braceT : null, braceOk = myBrace != null && myBrace <= BW(G), braceEarly = myBrace != null && myBrace > BW(G);
  const q = d < CLEAN ? 'clean' : d < SHIELD ? 'shield' : d < SHIELD * 1.35 ? 'glance' : 'miss';
  // your hit on them
  const braced = myBrace != null; let mine = 0; if (braced) { if (q === 'clean') mine = braceOk ? 2 : 1; else if (q === 'shield') mine = 1; }   // an unbraced lance skids off: no point
  const force = { clean: 1, shield: 0.6, glance: 0.2, miss: 0 }[q] * (braceOk ? 1.2 : braceEarly ? 0.9 : 0.7);
  // their hit on you: they aimed where your shield was before your last lean
  let theirs = 0, tq = 'miss', tforce = 0; if (G.R) { const leanShift = G.lean * 0.3, late = G.leanAtTell != null ? clamp((G.body - G.leanAtTell) * 0.3, -0.1, 0.1) : 0, ex = G.rv.err.x + late, ey = G.rv.err.y, dd = Math.hypot(ex, ey);
    G.theirHit = { x: ex, y: ey }; tq = dd < CLEAN ? 'clean' : dd < SHIELD ? 'shield' : dd < SHIELD * 1.35 ? 'glance' : 'miss'; theirs = tq === 'clean' ? (G.rv.braced ? 2 : 1) : tq === 'shield' ? 1 : 0;
    tforce = { clean: 1, shield: 0.6, glance: 0.2, miss: 0 }[tq] * (G.rv.braced ? 1.2 : 0.7) * c.rivalSkill; }
  const absorbMe = (braceOk ? 0.45 : braceEarly ? 0.75 : 1) * (1 + Math.abs(G.body) * 0.6) * (1 - 0.12 * upLv('saddle')), absorbThem = G.R ? (G.rv.braced ? 0.45 + (1 - G.R.brace) * 0.3 : 1) : 0;
  G.bal[0] += tforce * 0.75 * absorbMe + Math.max(0, Math.abs(G.body) - 0.45) * 0.45; if (G.R) G.bal[1] += force * 0.75 * absorbThem * c.sturdy;   // (leaning far out at the crash takes your seat)
  G.pts[0] += mine; G.pts[1] += theirs; if (q === 'clean') G.clean++; if (q !== 'miss') G.hits++;
  const ev = { k: 'clash', d, braced, their: G.R ? G.theirHit : null, q, tq, mine, theirs, tip: tp, sh, braceOk, braceEarly, late: myBrace == null, broke: q === 'clean' && braceOk, theyBroke: tq === 'clean' && G.rv.braced };
  G.log.push(ev); G.ev.push(ev); lessonSee(G, 'clash', ev);
  if (G.lesson) return;
  if (G.bal[0] >= 1) return finish(G, false, 'unseated'); if (G.R && G.bal[1] >= 1) return finish(G, true, 'unseat');
  G.leanAtTell = null; }
function nextPass(G) { const c = G.cfg;
  // riders settle back into the saddle between passes (some slower than others)
  G.bal[0] = Math.max(0, G.bal[0] - 0.3); if (G.R) G.bal[1] = Math.max(0, G.bal[1] - G.R.recover);
  if (c.training && !G.lesson) { if (G.log.filter(e => e.broke).length >= c.needClean) return finish(G, true, 'trained'); if (G.pass >= c.of) return finish(G, false, 'training'); return startPass(G); }
  if (!G.lesson && G.pass >= c.passes && G.pts[0] !== G.pts[1]) return finish(G, G.pts[0] > G.pts[1], 'points');
  if (!G.lesson && G.pass >= c.passes + 2) return finish(G, G.pts[0] > G.pts[1], 'points');
  startPass(G); }
function finish(G, win, why) { if (G.over) return; G.over = win ? 'won' : 'lost'; const clean = G.log.filter(e => e.q === 'clean').length;
  const stars = win ? (why === 'unseat' || why === 'trained' && clean >= 4 || G.pts[0] - G.pts[1] >= 4 ? 3 : G.pts[0] - G.pts[1] >= 2 || clean >= 2 ? 2 : 1) : 0;
  G.res = { win, why, stars, coins: win ? 12 + G.pts[0] * 3 + stars * 4 + (why === 'unseat' ? 15 : 0) : 3, pts: G.pts.slice(), passes: G.pass, clean, rival: G.R ? G.R.name : 'the training targets', log: G.log.map(e => ({ q: e.q, tq: e.tq, tip: e.tip, sh: e.sh })) };
  G.ev.push({ k: win ? 'won' : 'lost', why }); }

// ---------- LESSONS: aim with the rhythm, brace on time, the whole pass ----------
const AIMCARD = {"pic": "🐎", "win": "KNOCK THEM OFF THEIR HORSE", "lose": "THEY KNOCK YOU OFF", "how": "AIM THE LANCE, BRACE AT THE HIT"};      // the aim card: specs/aims.json (tools/aims.py)
const LESSONS = {
  1: [{ id: 'lean', title: 'LEAN', say: G => joustCue(G)[0], do: G => joustCue(G)[1], at: G => joustCue(G)[2], how: 'Slide your left thumb to lean.', need: 1 },
      { id: 'aim', title: 'AIM WITH THE RHYTHM', say: G => joustCue(G)[0], do: G => joustCue(G)[1], at: G => joustCue(G)[2], how: 'Drag your right thumb to move the lance tip. It sways with the gallop in a steady figure of eight: aim so the yellow ring (where it will be as you arrive) sits on the red middle. Three in a row.', need: 3 }],
  2: [{ id: 'brace', title: 'BRACE AT THE CRASH', say: G => joustCue(G)[0], do: G => joustCue(G)[1], at: G => joustCue(G)[2], how: 'Hold BRACE just before the crash, when it glows (not earlier: your arm tires). Three braced hits.', need: 3 }],
  3: [{ id: 'clean', title: 'BREAK A LANCE', say: G => joustCue(G)[0], do: G => joustCue(G)[1], at: G => joustCue(G)[2], how: 'Aim for the centre of the shield and brace on time: a clean braced hit breaks your lance (2 points). Twice.', need: 2 }],
};
function lessonStart(G) { const st = LESSONS[G.N][0]; G.lesson = { steps: LESSONS[G.N], i: 0, n: 0, id: st.id }; G.ev.push({ k: 'lessonnext', first: true }); }
function lessonSee(G, what, e) { const D = G.lesson; if (!D || D.done || what !== 'clash') return; const id = D.id; if (id === 'lean') return;
  const good = id === 'aim' && e.d < CLEAN * 2 || id === 'brace' && e.braceOk && e.q !== 'miss' || id === 'clean' && e.broke;
  if (good) lessonGood(G);
  else if (D.n && (id === 'aim' || id === 'brace' && !e.braceOk || id === 'clean' && e.q !== 'clean')) { D.n = 0; G.ev.push({ k: 'lessonmiss', how: id === 'aim' ? 'Not near the middle: three in a row, from the start.' : id === 'brace' ? (e.braceEarly ? 'Too early: brace in the last half second.' : 'Too late: hold BRACE as it glows.') : 'The centre of the shield, and brace on time.' }); }
  else if (!good) G.ev.push({ k: 'lessonmiss', how: e.q === 'miss' ? 'Missed: watch the sway, and aim so the tip swings onto the shield at the crash.' : 'Close: again.' }); }
function lessonGood(G) { const D = G.lesson, st = D.steps[D.i]; D.n++; G.ev.push({ k: 'lessonok', n: D.n, need: st.need });
  if (D.n >= st.need) { if (D.i + 1 < D.steps.length) { D.i++; D.n = 0; D.id = D.steps[D.i].id; G.ev.push({ k: 'lessonnext' }); } else { D.done = true; D.wait = 2.4; } } }
function lessonTick(G, dt) { const D = G.lesson; if (!D.done && D.id === 'lean') { D.leanT = Math.abs(G.lean) > 0.45 ? (D.leanT || 0) + dt : 0; if (D.leanT > 0.5) { D.leanT = 0; lessonGood(G); } return; } if (!D.done) return; D.wait -= dt; if (D.wait > 0) return; G.lesson = null; G.pass = 0; G.pts = [0, 0]; G.bal = [0, 0]; G.clean = 0; G.hits = 0; G.log = []; startPass(G); G.ev.push({ k: 'lessondone', N: G.N }); }

// ---------- for the robots: blind moves and an honest jouster ----------
const BLIND = {
  a: G => setAim(G, (Math.random() - 0.5) * 1.4, (Math.random() - 0.5) * 1.2),     // aim anywhere
  c: G => setAim(G, 0, 0),                                                          // aim at the middle
  l: G => setLean(G, Math.random() * 2 - 1),                                        // lean anywhere
  b: G => { braceOn(G, true); G.blindT = 0.2 + Math.random() * 3; },              // hold brace a while
  r: G => braceOn(G, false),                                                        // let go of brace
};
// HONEST: a jouster who looks: learns the rhythm (knows where the sway will be at the crash, as well as acc allows) and aims
// so the tip swings onto the shield centre; watches the late shifter's tell; braces about a third of a second before the
// crash (later or earlier by react); leans a little at the last moment if the rival aims well.
// THE TUTORIAL SHOWS THE ONE THING TO DO NOW (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing happens"). It slid
// left and right in a box, and MIDDLE + BRACE was two things. Now: DRAG TO AIM (on the right: the drag that puts the ring on the middle, as
// the robot works it out), WAIT FOR THE CRASH…, HOLD BRACE! a quarter second before the robot would brace (the time a thumb takes).
function joustCue(G) { if (G.over || G.phase !== 'charge') return ['WAIT…', 'wait', false]; const L = layout(G), id = G.lesson && G.lesson.steps[G.lesson.i] ? G.lesson.steps[G.lesson.i].id : '';
  if (id === 'lean') return ['LEAN', 'drag', [L.lean.x, L.lean.y, L.lean.x + L.lean.r * 0.8, L.lean.y]];
  const P0 = L.pad, here = [P0.x + clamp(G.aim.x / 0.7, -1, 1) * P0.r, P0.y - clamp(G.aim.y / 0.6, -1, 1) * P0.r];
  if (G.brace) return G.pt >= PASS_T - BW(G) ? ['BRACED', 'wait', false] : ['TOO SOON: THUMB BACK', 'hold', here];
  if (G.pt >= PASS_T - BW(G)) return ['LET GO: BRACE', 'release', [L.pad.x + clamp(G.aim.x / 0.7, -1, 1) * L.pad.r, L.pad.y - clamp(G.aim.y / 0.6, -1, 1) * L.pad.r]];
  const sw = sway(G, PASS_T), tx = G.sh0.x + (G.told ? G.rv.shift : 0) - sw.x, ty = G.sh0.y - sw.y, sc = 0.0042 / k, ex = tx - G.aim.x, ey = ty - G.aim.y;
  if (G.pt > 1 && G.pt < PASS_T - 0.4 && Math.hypot(ex, ey) > 0.03) { const P = L.pad, ax = P.x + clamp(G.aim.x / 0.7, -1, 1) * P.r, ay = P.y - clamp(G.aim.y / 0.6, -1, 1) * P.r; return ['AIM', 'drag', [ax, ay, P.x + clamp(tx / 0.7, -1, 1) * P.r, P.y - clamp(ty / 0.6, -1, 1) * P.r]]; }
  if (G.pt > 1) { const P = L.pad; return ['HOLD', 'hold', [P.x + clamp(G.aim.x / 0.7, -1, 1) * P.r, P.y - clamp(G.aim.y / 0.6, -1, 1) * P.r]]; }      // keep the thumb on the pad until it glows
  return ['WAIT…', 'wait', false]; }
function honest(G, o, mem) { if (G.over) return; const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random;
  if (G.lesson && G.lesson.id === 'lean' && !G.lesson.done) { setLean(G, 0.7); return; }
  if (G.phase !== 'charge') { braceOn(G, false); mem.pass = null; return; }
  if (mem.pass !== G.pass) { mem.pass = G.pass; mem.err = { x: (R() - 0.5) * (1 - acc) * 0.5, y: (R() - 0.5) * (1 - acc) * 0.4 }; mem.bt = PASS_T - 0.32 + (R() - 0.5) * react * 0.9; mem.seenTell = false; mem.lean = null; }
  if (G.told && !mem.seenTell && R() < acc) mem.seenTell = true;
  const s = sway(G, PASS_T), tx = G.sh0.x + (mem.seenTell ? G.rv.shift : 0) - s.x + mem.err.x, ty = G.sh0.y - s.y + mem.err.y; if (G.pt > 1 && G.pt < PASS_T - 0.15) setAim(G, tx, ty);
  if (G.pt >= mem.bt && !G.brace) braceOn(G, true);
  if (mem.lean == null) mem.lean = G.R && R() < acc * 0.7 ? (R() < 0.5 ? -1 : 1) * 0.5 : 0;
  if (G.pt > PASS_T - 0.55) { setLean(G, mem.lean); setAim(G, tx + mem.lean * 0.17, ty - Math.abs(mem.lean) * 0.07); } else setLean(G, 0); }
function winNow(G) { if (!G || G.over || G.lesson) return; finish(G, true, 'points'); }
