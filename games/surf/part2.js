// ===================== RULES: Surf (rebuilt 27 Nov 2026, his review: "complete overhaul... make one short wave fun first") =====================
// Seen from the side. You ride along the face of a wave (it carries you along by itself); the breaking part, the white water, chases you from behind.
// One pad, in one place: drag UP to climb the face, DOWN to carve back down it. Coming down the face gives you speed; climbing it spends speed. Turn
// from climbing to dropping (and back) smoothly and in rhythm: each linked turn throws spray and gives you a little more. Stay ahead of the white
// water and reach the end of the wave (the flag). Too slow, and the white water catches you: a wipeout (try again at once). From level 3 a TRICK button
// lights up near the lip: tap it with speed and you fly off the top and spin, landing back on the face for points.
// Units: x metres along the wave, s 0 (the bottom of the face) to 1 (the lip), v metres a second.
const RULES = [
  '<b>Drag up</b> on the pad to climb the wave, <b>drag down</b> to drop. Dropping gives speed, climbing spends it.',
  '<b>Stay ahead</b> of the white water behind you and reach the flag at the end of the wave.',
  'Up and down in rhythm (linked turns) keeps your speed up and throws spray.',
  'From level 3: near the top, with speed, tap <b>TRICK</b> to fly off the lip and spin. Land it for points.',
];
const SKINS = [{ id: 'sun', name: 'Sunburst', col: 0xffb020, col2: 0xff5a3a, stars: 0 }, { id: 'reef', name: 'Reef', col: 0x2ad8c0, col2: 0x1a5aa8, stars: 5 }, { id: 'kelp', name: 'Kelp', col: 0x5aa82a, col2: 0xf0e8c0, stars: 12 },
  { id: 'coral', name: 'Coral', col: 0xff6a8a, col2: 0xffffff, stars: 22 }, { id: 'night', name: 'Night swell', col: 0x2a2a6a, col2: 0x8ad8ff, stars: 34 }, { id: 'gold', name: 'Golden hour', col: 0xf0c040, col2: 0x8a3a1a, stars: 50 }];
const UPGRADES = [{ id: 'fins', name: 'Thruster fins', max: 2, cost: l => [60, 140][l], desc: 'Sharper turns wobble you less.' }, { id: 'rail', name: 'Soft rails', max: 2, cost: l => [70, 160][l], desc: 'Climbing costs a little less speed.' },
  { id: 'wax', name: 'Fresh wax', max: 1, cost: () => 110, desc: 'Steadier landings.' }];
const upLv = id => { if (typeof HEADLESS !== 'undefined' && HEADLESS) return 0; return ((store.get('ups', {}) || {})[id]) | 0; };
const RANKS = [[0, 'Grom'], [60, 'Wave catcher'], [200, 'Local'], [500, 'Ripper'], [1100, 'Charger'], [2500, 'Legend of the line-up']];
const PLACES = [{ name: 'Lagoon Point', sky: 'morning' }, { name: 'Palm Reef', sky: 'noon' }, { name: 'Sunset Bay', sky: 'golden' }, { name: 'Storm Cove', sky: 'overcast' }];
const placeOf = N => Math.floor((N - 1) / 4) % PLACES.length;

const SLOPE = 6, DRAG = 0.12, VMAX = 16;
function makeCfg(N, help, o = {}) { const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), e = easyOf(N);
  return { N, f, help: !!help, place: placeOf(N), free: !!o.free, D: Math.round(x(170, 420, 25)) * (o.free ? 4 : 1), vc: x(7.2, 12.3, 22) * (help ? 0.92 : 1) * (1 - 0.06 * e), start: 12,
    fast: N >= 4 ? x(0.25, 0.8, 25) : 0, trick: N >= 3, target: Math.round(x(250, 1400, 28)) }; }
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help, o), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, mini: !!o.mini, free: !!o.free, blind: {} };
  G.stick = { x: 0, y: 0 }; G.crouch = false; G.score = 0; G.links = 0; G.tricks = 0; startRide(G);
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G);
  return G; }
// the wave: its fast sections (where the white water surges for a while)
function startRide(G) { const c = G.cfg, R = G.rnd; G.phase = 'ride'; G.p = { x: 0, s: 0.55, vs: 0, v: 7.5, air: false, h: 0, vh: 0, rot: 0, lastSign: 0, lastTurn: -9, flow: 0 }; G.xb = -c.start; G.secs = [];
  let x = 60; while (x < c.D - 30) { if (R() < c.fast) G.secs.push({ x0: x, x1: x + 24 + R() * 20 }); x += 50 + R() * 50; } G.ev.push({ k: 'wave' }); }
// the wave is not the same height all along: bigger parts take longer to climb and give more speed coming down (so a rhythm has to follow the wave)
const TRICKV = 7;      /* speed needed to fly off the lip */
const faceH = (G, x) => 1 + 0.26 * Math.sin(x / 19 + G.seed % 7) + 0.1 * Math.sin(x / 7.3 + G.seed % 3);
const fastAt = (G, x) => G.secs.some(q => x >= q.x0 && x < q.x1);
function setStick(G, x, y) { const m = Math.hypot(x, y); G.stick = m > 1 ? { x: x / m, y: y / m } : { x, y }; }
function crouchOn(G, on) { G.crouch = !!on; }
function trick(G) { const P = G.p; if (G.over || G.phase !== 'ride' || P.air || !G.cfg.trick && !(G.lesson && G.lesson.id === 'trick')) return false; if (P.s < 0.8 || P.v < TRICKV) { G.ev.push({ k: 'notrick' }); return false; }
  P.air = true; P.vh = 3.2 + (P.v - 8) * 0.35; P.h = 0.01; P.rot = 0; G.ev.push({ k: 'launch' }); return true; }
function swipe() {}
function standUp() {}
// ---------- every frame ----------
function step(G, dt) { if (G.over || !(dt > 0)) return; G.t += dt; if (G.lesson) lessonTick(G, dt); const c = G.cfg, P = G.p;
  if (G.phase === 'out') { G.outT -= dt; if (G.outT <= 0) { if (G.lesson) { startRide(G); return; } finish(G, false, G.why); } return; }
  if (G.phase !== 'ride') return;
  // the white water: steady, faster in a fast section
  G.xb += c.vc * (fastAt(G, G.xb) ? 1.35 : 1) * dt;
  if (P.air) { P.vh -= 9 * dt; P.h += P.vh * dt; P.rot += dt * TAU * 1.35; P.x += P.v * dt;
    if (P.h <= 0) { P.air = false; P.h = 0; const clean = Math.abs(((P.rot + Math.PI) % TAU) - Math.PI) < 1.1; if (clean) { const pts = 250 + Math.round(P.v * 10); G.score += pts; G.tricks++; G.ev.push({ k: 'trick', pts }); lessonSee(G, 'trick'); }
      else { P.v *= 0.55; G.ev.push({ k: 'sloppy' }); } P.s = 0.8; P.vs = -0.6; P.v *= 0.92; } }
  else { const want = G.stick.y > 0 ? G.stick.y * 0.9 * clamp(P.v / 7, 0.3, 1) : G.stick.y * 1.35;      /* dropping is quicker than climbing (gravity helps): to stay on the face you hold UP longer than DOWN, watching where you are */      // up the pad: climb; down: drop (it needs some speed to climb)
    P.vs += (want - P.vs) * Math.min(1, dt * 7); const fh = faceH(G, P.x); P.s += P.vs * dt / fh;
    if (P.s >= 1) { if (P.vs > 0.6 && P.v > 7) { P.s = 1; return wipe(G, 'over'); } P.s = 1; P.vs = Math.min(P.vs, 0); }      /* climbing hard right over the top: over the falls */ if (P.s <= 0) { P.s = 0; P.vs = Math.max(P.vs, 0); }
    // speed: dropping gains it, climbing spends it, the water drags; at the very bottom the flat water bogs you down
    const bell = Math.max(0, 1 - Math.pow(2 * P.s - 1, 2)), pump = 0.35 * Math.abs(P.vs) * bell;      // moving up and down the open face (pumping) draws speed from the wave; sitting still on it does not
    P.v += (-P.vs * SLOPE * 1 + pump - DRAG * P.v - (P.s < 0.06 ? 1.2 : 0) - (P.s > 0.97 ? 0.6 : 0)) * dt; P.v = clamp(P.v, 0, VMAX);
    // linked turns: from climbing to dropping (or back) with speed, in rhythm
    const sg = P.vs > 0.35 ? 1 : P.vs < -0.35 ? -1 : 0; if (sg && sg !== P.lastSign && P.lastSign !== 0 && P.v > 3) { const good = sg < 0 ? P.s > 0.68 : P.s < 0.32, linked = good && G.t - P.lastTurn < 3.0; P.lastTurn = good ? G.t : -9; P.flow = linked ? Math.min(5, P.flow + 1) : 0; if (linked) { P.v = Math.min(VMAX, P.v + 1.5 + 0.15 * P.flow);      /* a turn counts when it is made high on the wave (a top turn) or low (a bottom turn), linked to the last one */ const pts = 20 + 10 * P.flow; G.score += pts; G.links++; G.ev.push({ k: 'link', n: P.flow, pts, top: sg < 0 }); lessonSee(G, 'link'); } }
    if (sg) P.lastSign = sg;
    P.x += P.v * dt; }
  if (P.s > 0.8 && !P.air) lessonSee(G, 'up'); if (P.s < 0.2 && !P.air) lessonSee(G, 'down');
  if (P.x - G.xb < 0) return wipe(G, P.v < 5 ? 'slow' : 'caught');
  if (P.x >= c.D && !c.free) { G.score += 200; G.ev.push({ k: 'done' }); if (G.lesson) { lessonSee(G, 'end'); startRide(G); return; } finish(G, true, 'end'); } }
function wipe(G, why) { if (G.phase !== 'ride') return; G.phase = 'out'; G.outT = 1.4; G.why = why; G.ev.push({ k: 'wipe', why }); }
function finish(G, win, why) { if (G.over) return; G.over = win ? 'won' : 'lost'; const sc = Math.round(G.score), tg = G.cfg.target;
  const stars = win ? (sc >= tg * 1.4 ? 3 : sc >= tg ? 2 : 1) : 0;
  G.res = { win, why, stars, score: sc, target: tg, dist: Math.round(G.p.x), D: G.cfg.D, coins: win ? 10 + stars * 6 + Math.min(20, Math.round(sc / 150)) : 3 };
  G.ev.push({ k: win ? 'won' : 'lost', why }); }
function winNow(G) { if (!G || G.over || G.lesson) return; finish(G, true, 'end'); }
// ---------- lessons: Drag up, Drag down, Stay ahead (level 1); a trick (level 3) ----------
const AIMCARD = {"pic": "🏄", "win": "REACH THE FLAG", "lose": "THE WHITE WATER CATCHES YOU", "how": "UP AND DOWN THE WAVE"};
const LESSONS = {
  1: [{ id: 'up', title: 'CLIMB', say: G => surfCue(G)[0], do: G => surfCue(G)[1], at: G => surfCue(G)[2], how: 'Drag up.', need: 1 },
      { id: 'down', title: 'DROP', say: G => surfCue(G)[0], do: G => surfCue(G)[1], at: G => surfCue(G)[2], how: 'Drag down.', need: 1 },
      { id: 'ahead', title: 'STAY AHEAD', say: G => surfCue(G)[0], do: G => surfCue(G)[1], at: G => surfCue(G)[2], how: 'Up and down: stay ahead.', need: 4 }],
  3: [{ id: 'trick', title: 'TRICK', say: G => surfCue(G)[0], do: G => surfCue(G)[1], at: G => surfCue(G)[2], how: 'At the top, tap TRICK.', need: 1 }],
};
function lessonStart(G) { const st = LESSONS[G.N][0]; G.lesson = { steps: LESSONS[G.N], i: 0, n: 0, id: st.id, need: st.need }; G.ev.push({ k: 'lessonnext', first: true }); }
function lessonSee(G, what) { const D = G.lesson; if (!D || D.done) return; const id = D.id;
  if ((id === 'up' && what === 'up') || (id === 'down' && what === 'down') || (id === 'ahead' && what === 'link') || (id === 'trick' && what === 'trick')) { D.n++; G.ev.push({ k: 'lessonok', n: Math.min(D.n, D.need), need: D.need });
    if (D.n >= D.need) { if (D.i + 1 < D.steps.length) { D.i++; D.id = D.steps[D.i].id; D.need = D.steps[D.i].need; D.n = 0; G.ev.push({ k: 'lessonnext' }); } else { D.done = true; D.wait = 1.2; } } } }
function lessonTick(G, dt) { const D = G.lesson; if (!D.done) { if (G.phase === 'ride' && !G.p.air) G.p.v = Math.max(G.p.v, D.id === 'trick' ? TRICKV + 1.5 : 6);      /* while learning, the board never stalls */ if (G.phase === 'ride' && G.p.x - G.xb < 6) G.xb = G.p.x - 14; if (G.p.x > G.cfg.D - 20) { G.p.x -= 120; G.xb -= 120; } return; }      // in a lesson the white water waits for you
  D.wait -= dt; if (D.wait > 0) return; G.lesson = null; G.score = 0; G.links = 0; G.tricks = 0; startRide(G); G.ev.push({ k: 'lessondone', N: G.N }); }
// ---------- for the robots ----------
const BLIND = { u: G => setStick(G, 0, 1), d: G => setStick(G, 0, -1), n: G => setStick(G, 0, 0), t: G => trick(G) };
// HONEST: a surfer who looks: rides up to near the lip and back down to the lower face in rhythm, a little sooner when the white water is close; tries a
// trick at the top when it has the speed. react: how late the turns are; acc: how well it judges the heights.
function honest(G, o, mem) { if (G.over || G.phase !== 'ride') return; const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random, P = G.p;
  if (G.lesson && !G.lesson.done) { const id = G.lesson.id; if (id === 'up') { ACT.setStick(G, 0, 1); return; } if (id === 'down') { ACT.setStick(G, 0, -1); return; } }
  if (P.air) return; mem.cd = (mem.cd || 0) - 1 / 60; if (mem.cd > 0) return; mem.cd = 0.05 + react * 0.25 * R();
  const gap = P.x - G.xb, top = clamp(0.8 - (1 - acc) * 0.2 * R() - (gap < 10 ? 0.1 : 0), 0.5, 0.97), low = clamp(0.18 + (1 - acc) * 0.25 * R(), 0.05, 0.45);
  if (mem.dir == null) mem.dir = -1; if (mem.dir > 0 && P.s >= top) mem.dir = -1; else if (mem.dir < 0 && P.s <= low) mem.dir = 1;
  if ((G.cfg.trick || (G.lesson && G.lesson.id === 'trick')) && P.s > 0.85 && P.v > TRICKV + 1 && gap > 14 && R() < acc * 0.6) { ACT.trick(G); return; }
  ACT.setStick(G, 0, mem.dir); }
const ACT_REAL = { setStick, crouchOn, swipe, trick }; let ACT = ACT_REAL;
// the cue: one move at a time, on the pad
const SFC = { t: -1e9, v: null };
function surfCue(G) { if (G.over || G.phase !== 'ride') return ['WAIT…', 'wait', false]; const L = layout(G), P0 = L.pad, D = G.lesson, id = D && !D.done ? D.id : '';
  if (G.p.air) return ['WAIT…', 'wait', false];
  if (id === 'up') return ['DRAG UP', 'drag', [P0.x, P0.y, P0.x, P0.y - P0.r * 0.85]];
  if (id === 'down') return ['DRAG DOWN', 'drag', [P0.x, P0.y, P0.x, P0.y + P0.r * 0.85]];
  const P = G.p; if (G.cfg.trick && P.s > 0.8 && P.v > TRICKV && (id === 'trick' || !id)) return ['TAP TRICK', 'tap', [L.tr.x, L.tr.y]];
  if (SFC.dir >= 0 && P.s > 0.76) SFC.dir = -1; else if (SFC.dir < 0 && P.s < 0.24) SFC.dir = 1; else if (!SFC.dir) SFC.dir = 1;      /* up to near the lip, down to the bottom: the same every time, so the hand never jumps about */
  const dn = SFC.dir < 0; return [dn ? 'DRAG DOWN' : 'DRAG UP', 'drag', [P0.x, P0.y, P0.x, P0.y + (dn ? 1 : -1) * P0.r * 0.85]]; }
function dryPlan(G, o, mem) { let got = null; const rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { if (!got && !(a.length > 2 && a.slice(1).every(v => v === 0 || v === false))) got = [n, ...a.slice(1)]; return true; };      /* (a stick at rest, all its numbers 0, is not a move; a first bed, number 0, is) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return got; }
function dryPlanAll(G, o, mem) { const all = [], rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { all.push([n, ...a.slice(1)]); return true; };      /* every call, in order (for a robot that steers and drifts at once) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return all; }
