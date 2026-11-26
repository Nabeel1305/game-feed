// ===================== RULES: Oarsmen (game 56, mine for set 10: a two-thumb race) =====================
// A rowing race down a winding river. Your left thumb pulls the left oar, your right thumb the right oar: tap to take a
// stroke. After a stroke each oar swings back for the next (a ring fills); stroke as it fills and turns green and you get a
// full stroke; stroke too soon and the blade "catches a crab": a weak, splashy stroke. Both oars together drive you straight;
// one oar alone turns you (the left oar turns you right, the right oar turns you left), which is how you steer round the
// bends, rocks and logs. Perfect strokes with both oars together build your RHYTHM, and rhythm makes you faster. Hitting the
// bank or a rock costs you speed. Beat the other boats to the finish.
// World: metres; x across, z down the river; heading h (0 = straight down the river), forward is (sin h, cos h).
const RULES = [
  '<b>Left thumb: left oar. Right thumb: right oar.</b> Tap to take a stroke.',
  'Wait for each oar\'s ring to turn <b>green</b>: a full stroke. Too soon and you <b>catch a crab</b> (weak, splashy).',
  'Both oars together: <b>straight</b>. Left oar alone turns you <b>right</b>; right oar alone turns you <b>left</b>.',
  'Perfect strokes, both together, build <b>RHYTHM</b>: you go faster. Banks and rocks slow you down.',
  'Beat the other boats to the finish.',
];
const WEATHERS = ['morning', 'golden', 'noon', 'sunset', 'mist', 'overcast', 'dawn', 'rain', 'dusk', 'storm'];
function weatherOf(N) { if (N <= 3) return ['morning', 'golden', 'noon'][N - 1]; const R = rng(N * 1931 + 7); R(); return WEATHERS[(R() * WEATHERS.length) | 0]; }
const PLACES = [{ name: 'The Willow Reach' }, { name: 'The Gorge' }, { name: 'The Lowland Canal' }, { name: 'The Lake Run' }];
const placeOf = N => Math.floor((N - 1) / 5) % 4;
const UPGRADES = [
  { id: 'blade', name: 'Wide blades', desc: 'Every stroke is 6% stronger.', max: 2, cost: l => 35 + l * 45 },
  { id: 'hull', name: 'Slim hull', desc: 'You glide further between strokes.', max: 2, cost: l => 35 + l * 45 },
  { id: 'cox', name: 'A cox', desc: 'The green window stays open longer.', max: 1, cost: l => 70 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Novice'], [40, 'Club rower'], [130, 'Racer'], [320, 'Stroke'], [700, 'Champion'], [1500, 'Olympian']];
const CYCLE = 0.85;      // seconds for an oar to swing back
function makeCfg(N, help) { const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), e = easyOf(N);
  return { N, f, help: !!help, place: placeOf(N), weather: weatherOf(N), len: Math.round(x(300, 750, 30)), bend: x(0.9, 1.2, 25), width: x(26, 20, 30), rocks: N >= 2 ? Math.round(x(2, 10, 30)) : 0, logs: N >= 4 ? Math.round(x(1, 5, 30)) : 0,
    rivals: N <= 2 ? 1 : Math.min(3, 1 + Math.floor(N / 4)), rivalSp: x(3.7, 4.2, 30) * (1 - 0.06 * e) * (help ? 0.92 : 1), power: 1.55 * (1 + 0.06 * upLv('blade')), drag: 0.42 * (1 - 0.12 * upLv('hull')), win: 0.35 + 0.1 * upLv('cox'), place1: N >= 6 ? 1 : 1 }; }
function riverX(G, z) { const c = G.cfg, b = G.lesson && lessonNow(G) && lessonNow(G).id !== 'steer' ? 0.1 : c.bend; return Math.sin(z * 0.012 * Math.max(0.7, b) + 0.5) * 18 * b + Math.sin(z * 0.031 + 1.7) * 6 * b; }
function riverW(G, z) { return G.cfg.width * (1 + 0.25 * Math.sin(z * 0.02 + 2)); }
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(N * 7717 + 3), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, place: cfg.place, weather: cfg.weather, wait: 0,
    me: { x: 0, z: 0, h: 0, v: 0, w: 0, oars: [{ t: 9, pull: 0 }, { t: 9, pull: 0 }], rhythm: 0, bump: 0 }, boats: [], obs: [], go: 0, strokes: 0, perfect: 0, crabs: 0, bumps: 0, len: cfg.len };
  buildRiver(G); G.rnd = rng(seed); if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else G.ev.push({ k: 'start' });
  return G; }
function buildRiver(G) { const c = G.cfg, R = G.rnd; G.obs = []; G.len = G.lesson ? 200 : c.len;
  for (let i = 0; i < c.rocks; i++) { const z = 40 + R() * (G.len - 60); G.obs.push({ k: 'rock', z, x: riverX(G, z) + (R() - 0.5) * riverW(G, z) * 0.6, r: 1.4 + R() }); }
  for (let i = 0; i < c.logs; i++) { const z = 50 + R() * (G.len - 70); G.obs.push({ k: 'log', z, x: riverX(G, z) + (R() < 0.5 ? -1 : 1) * riverW(G, z) * 0.18, r: 3.2 }); }
  G.boats = []; for (let i = 0; i < c.rivals; i++) G.boats.push({ id: i, x: riverX(G, 0) + (i % 2 ? 1 : -1) * (3 + Math.floor(i / 2) * 3), z: 0, v: 0, h: 0, sp: c.rivalSp * (1 - i * 0.04) * (0.97 + R() * 0.06), ph: R() * 6, line: (R() - 0.5) * 4, bump: 0 });
  G.me.x = riverX(G, 0); }
// ---------- what you do: a stroke with an oar (0 left, 1 right) ----------
function stroke(G, side) { if (G.over || G.wait > 0 || G.go > 0) return false; const m = G.me, o = m.oars[side], c = G.cfg; const since = o.t;
  let q, kind; if (since < CYCLE * 0.6) { q = 0.15; kind = 'crab'; } else if (since < CYCLE) { q = 0.3 + 0.35 * (since - CYCLE * 0.6) / (CYCLE * 0.4); kind = 'early'; } else if (since < CYCLE + c.win) { q = 1; kind = 'perfect'; } else { q = 0.85; kind = 'late'; }
  o.t = 0; o.pull = 0.35; o.q = q; o.kind = kind; G.strokes++; if (kind === 'crab') { G.crabs++; m.rhythm = 0; m.v *= 0.92; } if (kind === 'perfect') G.perfect++;
  // together: the other oar struck within a breath, both well
  const other = m.oars[1 - side], sync = other.t < 0.14 && other.kind && (other.kind === 'perfect' || other.kind === 'late') && kind !== 'crab';
  if (sync) { m.rhythm = Math.min(8, m.rhythm + (kind === 'perfect' && other.kind === 'perfect' ? 1 : 0.5)); G.ev.push({ k: 'sync', r: m.rhythm }); }
  else if (other.t > 1.6 && kind !== 'crab') m.rhythm = Math.max(0, m.rhythm - 0.25);      /* one oar now and then to steer is fine; rowing on one side only is not */
  m.v += c.power * q * (1 + m.rhythm * 0.045) * (sync ? 1 : 0.85); m.w += (side === 0 ? -1 : 1) * q * 0.55 * (sync ? 0.0 : 1);      /* +x is the screen's left (the camera looks down +z): the left oar turns you to -x, the right */
  if (sync) m.w -= (side === 0 ? -1 : 1) * other.q * 0.55;      /* undo the turn the first oar began: together goes straight */
  G.ev.push({ k: 'stroke', side, kind, sync }); lessonSee(G, 'stroke', { side, kind, sync }); return true; }
// ---------- the race, step by step ----------
function step(G, dt) { if (G.over || !(dt > 0)) return; G.t += dt; if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0) { G.wait = 0; const f = G.next; G.next = null; if (f) f(); } return; }
  const c = G.cfg, m = G.me, R = G.rnd;
  if (G.go > 0) { const was = Math.ceil(G.go); G.go -= dt; if (Math.ceil(G.go) !== was) G.ev.push({ k: 'count', n: Math.ceil(G.go) }); if (G.go <= 0) G.ev.push({ k: 'go' }); return; }
  for (const o of m.oars) { o.t += dt; o.pull = Math.max(0, o.pull - dt); }
  // the boat: glides and slows; turns with its turning speed
  m.v *= Math.exp(-c.drag * dt); m.w *= Math.exp(-2.4 * dt); m.h = clamp(m.h + m.w * dt, -1.3, 1.3); m.x += Math.sin(m.h) * m.v * dt; m.z += Math.cos(m.h) * m.v * dt; m.bump = Math.max(0, m.bump - dt);
  // the banks and things in the water
  const rx = riverX(G, m.z), hw = riverW(G, m.z) / 2; if (Math.abs(m.x - rx) > hw - 1.2) { m.x = rx + Math.sign(m.x - rx) * (hw - 1.2); if (m.bump <= 0) { m.v *= 0.35; m.bump = 0.8; m.rhythm = 0; G.bumps++; m.h *= 0.4; G.ev.push({ k: 'bank' }); lessonSee(G, 'bump'); } }
  for (const ob of G.obs) { const d = ob.k === 'log' ? Math.max(Math.abs(m.z - ob.z) * 2, Math.abs(m.x - ob.x) - ob.r) : Math.hypot(m.x - ob.x, m.z - ob.z) - ob.r; if (d < 0.9) { const sx = Math.sign(m.x - ob.x || 1); if (ob.k === 'log') m.z = Math.min(m.z, ob.z - 0.6); else { const dx = m.x - ob.x, dz = m.z - ob.z, dd = Math.hypot(dx, dz) || 1; m.x = ob.x + dx / dd * (ob.r + 0.95); m.z = ob.z + dz / dd * (ob.r + 0.95); } m.x += sx * 0.2; if (m.bump > 0) continue; m.v *= 0.6; m.bump = 0.8; m.rhythm = 0; G.bumps++; G.ev.push({ k: 'hit', what: ob.k }); lessonSee(G, 'bump'); } }
  // the other boats: follow the river at their pace, with a stroke pulse; they steer round rocks too
  for (const b of G.boats) { const want = b.sp * (1 + 0.18 * Math.sin(G.t * 7.4 + b.ph)), ahead = riverX(G, b.z + 12) + b.line; let tx = ahead; for (const ob of G.obs) if (ob.z > b.z && ob.z - b.z < 14 && Math.abs(ob.x - tx) < ob.r + 2.5) tx = ob.x + Math.sign(tx - ob.x || 1) * (ob.r + 3);
    b.h += clamp(Math.atan2(tx - b.x, 12) - b.h, -dt * 1.2, dt * 1.2); b.v += (want - b.v) * Math.min(1, dt * 1.5); b.x += Math.sin(b.h) * b.v * dt; b.z += Math.cos(b.h) * b.v * dt; }
  if (G.lesson) { lessonTick(G); return; }
  // the finish
  if (m.z >= G.len) { const place = 1 + G.boats.filter(b => b.z >= G.len || b.z > m.z).length; return finish(G, place); }
  if (G.boats.length && G.boats.every(b => b.z >= G.len) && m.z < G.len) return finish(G, G.boats.length + 1); }
function finish(G, place) { if (G.over) return; const win = place === 1; G.over = win ? 'won' : 'lost'; const c = G.cfg, t = +G.t.toFixed(1), q = G.perfect / Math.max(1, G.strokes);
  const stars = win ? 1 + (G.bumps === 0 ? 1 : 0) + (q >= 0.6 ? 1 : 0) : 0;
  G.res = { win, stars, place, of: G.boats.length + 1, time: t, perfect: Math.round(q * 100), crabs: G.crabs, bumps: G.bumps, coins: win ? 4 + Math.ceil(G.N / 3) + stars * 2 : 1 + (place === 2 ? 1 : 0) };
  G.ev.push({ k: win ? 'won' : 'lost', place }); }
// ---------- LESSONS ----------
const AIMCARD = {"pic": "🚣", "win": "WIN THE RACE", "lose": "THEY FINISH FIRST", "how": "TAP BOTH SIDES ON GREEN"};      // the aim card: specs/aims.json (tools/aims.py)
const LESSONS = {
  1: [{ id: 'together', title: 'TOGETHER', say: G => rowCue(G)[0], do: G => rowCue(G)[1], at: G => rowCue(G)[2], how: 'Tap left and right at the same time, each time both rings turn green. Six perfect strokes together.', need: 6 }],
  2: [{ id: 'steer', title: 'STEER', say: G => rowCue(G)[0], do: G => rowCue(G)[1], at: G => rowCue(G)[2], how: 'One oar turns you: the LEFT oar turns you RIGHT, the right oar turns you left. Row 150 m down the bends without touching the bank.', need: 1 }],
  3: [{ id: 'race', title: 'RHYTHM', say: G => rowCue(G)[0], do: G => rowCue(G)[1], at: G => rowCue(G)[2], how: 'Keep stroking together on the green: your RHYTHM grows and so does your speed. Reach a rhythm of 5.', need: 1 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonSetup(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonSetup(G) { const st = lessonNow(G), m = G.me; Object.assign(m, { x: riverX(G, 0), z: 0, h: 0, v: 0, w: 0, rhythm: 0 }); G.obs = []; G.boats = []; G.go = 0; G.lessonZ = 0; }
function lessonTick(G) { const st = lessonNow(G); if (st.id === 'steer' && G.me.z >= 150) lessonSee(G, 'end'); if (G.me.z > 190) { G.me.z = 0; G.me.x = riverX(G, 0); } }
function lessonSee(G, what, d) { const st = lessonNow(G); if (!st) return; let ok = null;
  if (st.id === 'together' && what === 'stroke') { if (d.sync && d.kind === 'perfect') ok = true; else if (d.kind === 'crab') ok = false; else return; }
  if (st.id === 'steer') { if (what === 'end') ok = true; if (what === 'bump') ok = false; }
  if (st.id === 'race' && what === 'stroke' && G.me.rhythm >= 5) ok = true;
  if (ok == null) return;
  if (!ok) { G.lesson.n = 0; G.ev.push({ k: 'lessonmiss', how: st.how }); if (st.id === 'steer') lessonSetup(G); return; }
  G.lesson.n++; if (G.lesson.n < st.need) { G.ev.push({ k: 'lessonok', n: G.lesson.n, need: st.need }); return; }
  G.lesson.i++; G.lesson.n = 0; if (G.lesson.i >= G.lesson.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.wait = 1.6; G.next = () => { G.rnd = rng(G.N * 7717 + 3); buildRiver(G); G.rnd = rng(G.seed); Object.assign(G.me, { x: riverX(G, 0), z: 0, h: 0, v: 0, w: 0, rhythm: 0 }); G.t = 0; G.go = 0; G.strokes = G.perfect = G.crabs = G.bumps = 0; G.ev.push({ k: 'start' }); }; } else lessonSetup(G); }
// ---------- for the robots ----------
// BLIND: a thumb that does not look: the left oar, the right, or both
const BLIND = { l: G => stroke(G, 0), r: G => stroke(G, 1), b: G => { stroke(G, 0); stroke(G, 1); } };
// a rower who looks: strokes both oars together on the green, a little early or late (react, acc); steers by stroking one oar
// a moment ahead of the other or alone, aiming down the river past the rocks and logs
// THE TUTORIAL SAYS WHICH OAR, NOW (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing happens"). It said LEFT OAR TURNS
// RIGHT with a hand tapping in a box. Now the robot is asked (dryPlanAll stroke, on time): TAP BOTH SIDES when both rings are green, TAP LEFT /
// TAP RIGHT with the hand on that half to turn, WAIT FOR GREEN between strokes.
const RWC = { t: -1e9, v: null };
function rowCue(G) { if (G.over || G.wait > 0 || G.go > 0) return ['WAIT…', 'wait', false]; const now = performance.now(); if (now - RWC.t < 60) return RWC.v; RWC.t = now;
  const all = dryPlanAll(G, null, { due: CYCLE }), l = all.some(q => q[1] === 0), r = all.some(q => q[1] === 1); let v;
  if (l && r) v = ['TAP BOTH SIDES!', 'tap', false]; else if (l) v = ['TAP LEFT', 'tap', [W * 0.25, H * 0.7]]; else if (r) v = ['TAP RIGHT', 'tap', [W * 0.75, H * 0.7]]; else v = ['WAIT FOR GREEN', 'wait', false];
  RWC.v = v; return v; }
function honest(G, o, mem) { const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, m = G.me, R = Math.random, c = G.cfg;
  if (G.over || G.wait > 0 || G.go > 0) return;
  // where to point: down the river, round what is ahead
  const look = 10 + m.v * 1.2; let tx = riverX(G, m.z + look); for (const ob of G.obs) if (ob.z > m.z - 1 && ob.z - m.z < look + 4 && Math.abs(ob.x - tx) < ob.r + 2.2) { const cx = riverX(G, ob.z), hw = riverW(G, ob.z) / 2; let side = Math.sign(m.x - ob.x) || 1; if (Math.abs(cx + side * hw - ob.x) < ob.r + 3.5) side = -side; tx = ob.x + side * (ob.r + 2.6); }      /* round it on the side you are on, if there is room */
  const want = Math.atan2(tx - m.x, look) * 1.1, err = want - (m.h + m.w * 0.35);
  if (!mem.due) mem.due = CYCLE + (R() - 0.3) * (1 - acc) * 0.9 + react * 0.12;
  const t0 = m.oars[0].t, t1 = m.oars[1].t;
  if (Math.min(t0, t1) >= mem.due) { mem.due = 0;
    if (Math.abs(err) > 0.12 && R() < 0.5 + acc * 0.5) { ACT.stroke(G, err > 0 ? 1 : 0); return; }      // one oar to turn (the right oar turns you to +x)
    ACT.stroke(G, 0); if (R() < 0.55 + acc * 0.45) ACT.stroke(G, 1); else mem.late = 0.2 + R() * 0.2; return; }
  if (mem.late) { mem.late -= 1 / 60; if (mem.late <= 0) { mem.late = 0; ACT.stroke(G, 1); } } }
function winNow(G) { if (!G || G.over || G.wait > 0) return; G.lesson = null; G.me.z = G.len; finish(G, 1); }

// what the robot would do now, without doing it (tools/dry_plan.py): the tutorial shows this move
const ACT_REAL = { stroke }; let ACT = ACT_REAL;
function dryPlan(G, o, mem) { let got = null; const rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { if (!got && !(a.length > 2 && a.slice(1).every(v => v === 0 || v === false))) got = [n, ...a.slice(1)]; return true; };      /* (a stick at rest, all its numbers 0, is not a move; a first bed, number 0, is) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return got; }
function dryPlanAll(G, o, mem) { const all = [], rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { all.push([n, ...a.slice(1)]); return true; };      /* every call, in order (for a robot that steers and drifts at once) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return all; }
