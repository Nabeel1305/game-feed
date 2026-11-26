// ===================== RULES: Lighthouse (game 18) =====================
// A wild night at sea, seen from the gallery of a lighthouse on the cliffs. Small fishing boats are lost out in the dark,
// drifting slowly towards the rocks along the coast. Your thumb moves the great lamp's beam over the water. Hold the light on a
// boat until it sees you (its lamp blinks back); from then on it follows your light, at a boat's pace. Lead it slowly round the
// rocks (they only show in the light, by their surf) to the harbour mouth, where it sees the harbour lights and goes in by
// itself. Move the light too fast and the boat loses it. Boats you are not lighting keep drifting. Three wrecks and the night
// is over. Coordinates: metres, x across (right +), y out to sea; the lighthouse is at (0, 0), the coast runs along y = COAST.

const RULES = [
  '<b>Your thumb moves the lighthouse beam</b> over the sea: touch where you want the light, slide to move it.',
  '<b>Hold the light on a lost boat</b> until it sees you: its lamp blinks back. Now it follows your light.',
  '<b>Lead it slowly</b> to the harbour mouth (the red and green lights). Too fast and the boat loses the light.',
  '<b>Rocks show white with surf</b> in the light. Lead the boat round them, never across.',
  'Boats you are not lighting drift towards the rocky shore. Bring them home: lose all your lifebuoys to wrecks and the night is over.',
];
const COAST = 20, MOUTH_W = 11, SEE_HARBOUR = 48, RANGE = [26, 260], ARC = 1.42;
const WEATHERS = ['night', 'storm', 'rain', 'mist', 'dusk', 'night', 'storm', 'rain', 'mist', 'night'];
function weatherOf(N) { if (N <= 3) return ['dusk', 'night', 'night'][N - 1]; const R = rng(N * 6007 + 1); R(); return WEATHERS[(R() * WEATHERS.length) | 0]; }

function makeCfg(N, help) {
  const f = curve(N), e = easyOf(N), boss = N % 10 === 0, x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), slow = help ? 1.25 : 1;
  const boats = N <= 2 ? 2 : Math.round(x(3, 7, 30)) + (boss ? 1 : 0), need = Math.ceil(boats * 0.6);
  return { N, f, e, boss, help: !!help, boats, need, lives: boats - need + 1,      // lifebuoys: the wrecks the night can take, plus one
    maxAt: N <= 2 ? 1 : N <= 5 ? 2 : Math.round(x(2, 3.2, 25)),
    gap: x(16, 11, 30),                                    // seconds between new boats appearing
    rocks: N <= 1 ? 0 : Math.round(x(3, 15, 30)),
    drift: x(1.3, 2.3, 30) / slow,                          // m/s a lost boat drifts shorewards
    follow: 4.6,                                           // m/s a boat steams after your light
    turn: x(0.9, 0.6, 30),                                 // rad/s a boat can turn
    spot: x(17, 11, 30),                                   // radius of the pool of light, m
    notice: x(0.45, 1.0, 30) * (help ? 0.8 : 1),            // seconds of light on a boat before it sees you
    lose: x(2.6, 1.9, 30),                                 // past this many spot-radii away, the boat has lost your light
    lamp: x(46, 30, 30),                                   // m/s the lamp can swing the light
    current: N < 5 ? 0 : x(0, 1.1, 30) / slow,              // m/s sideways set of the tide
    spawnY: [x(125, 175, 20), x(150, 225, 20)] };
}
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0, R = rng(seed);
  const side = R() < 0.5 ? -1 : 1, hx = side * (38 + R() * 26);
  const G = { N, cfg, seed, rnd: R, t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null,
    weather: weatherOf(N), hx, rocks: [], boats: [], made: 0, home: 0, wrecks: 0, lives: cfg.lives, next: 1.0, S: { x: hx * 0.4, y: 90 }, T: { x: hx * 0.4, y: 90 },
    set: (R() < 0.5 ? -1 : 1), streak: 0, bestStreak: 0, aimed: false };
  makeRocks(G, cfg.rocks);
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G);
  return G;
}
// rocks: scattered over the approaches, never on the harbour's own way in, never touching each other
function makeRocks(G, n) {
  const R = G.rnd; G.rocks = [];
  for (let tries = 0; G.rocks.length < n && tries < 600; tries++) {
    const r = 4 + R() * 6 + (R() < 0.2 ? 5 : 0), x = (R() - 0.5) * 300, y = COAST + 22 + R() * (G.cfg.spawnY[0] - 30 - COAST - 22);      // open water where the boats appear
    if (Math.abs(x - G.hx) < MOUTH_W + 14 + r && y < SEE_HARBOUR + 25) continue;
    if (G.rocks.some(q => Math.hypot(q.x - x, q.y - y) < q.r + r + 26)) continue;
    G.rocks.push({ x, y, r, seen: 0 });
  }
}
const azOf = (x, y) => Math.atan2(x, y), inMouth = (G, x) => Math.abs(x - G.hx) < MOUTH_W;
function newBoat(G) {
  const c = G.cfg, R = G.rnd; let x = 0;
  for (let i = 0; i < 30; i++) { x = (R() - 0.5) * 250; if (Math.abs(x - G.hx) > 50 && Math.abs(azOf(x, 200)) < ARC - 0.1) break; }
  const y = lessonNow(G) ? 105 + R() * 30 : c.spawnY[0] + R() * (c.spawnY[1] - c.spawnY[0]);
  // where it would drift: the shore, well away from the harbour mouth
  let tx = clamp(x + (R() - 0.5) * 40, -85, 85); if (Math.abs(tx - G.hx) < 45) { tx = G.hx + Math.sign(tx - G.hx || 1) * 45; if (Math.abs(tx) > 85) tx = G.hx - Math.sign(tx - G.hx) * 45; }      // always within the lamp's reach
  const b = { id: ++G.made, x, y, h: Math.atan2(tx - x, COAST - y), v: c.drift, mode: 'lost', seen: 0, tx, name: BOATNAMES[(G.made - 1) % BOATNAMES.length], age: 0, blink: 0 };
  G.boats.push(b); G.ev.push({ k: 'boat', id: b.id }); return b;
}
const BOATNAMES = ['Mary Rose', 'Kittiwake', 'Seabird', 'Lucky Star', 'Good Hope', 'Morning Tide', 'Puffin', 'Silver Fin', 'Ellen May', 'Gannet', 'Brave Heart', 'Rosa'];
// ---------- the thumb ----------
// aim the lamp at a point on the water (it swings there at the lamp's own pace)
function aim(G, x, y) { if (G.over) return; const d = clamp(Math.hypot(x, y), RANGE[0], RANGE[1]), a = clamp(Math.atan2(x, Math.max(1, y)), -ARC, ARC); G.T = { x: Math.sin(a) * d, y: Math.cos(a) * d }; G.aimed = true; }
// ---------- every frame ----------
function step(G, dt) {
  if (G.over) return; G.t += dt; const c = G.cfg, L = lessonNow(G);
  // the light swings towards where the thumb is
  const S = G.S, T = G.T, dx = T.x - S.x, dy = T.y - S.y, dd = Math.hypot(dx, dy), mv = Math.min(dd, c.lamp * dt);
  const vx = dd > 1e-6 ? dx / dd * mv / dt : 0, vy = dd > 1e-6 ? dy / dd * mv / dt : 0; if (dd > 1e-6) { S.x += dx / dd * mv; S.y += dy / dd * mv; } S.vx = vx; S.vy = vy;
  for (const q of G.rocks) if (Math.hypot(q.x - S.x, q.y - S.y) < c.spot + q.r) q.seen = Math.min(1, q.seen + dt * 3); else q.seen = Math.max(0, q.seen - dt * 0.25);
  // new boats
  const want = L ? (L.two ? 2 : 1) : c.boats, live = G.boats.length;
  G.next -= dt; if (G.next <= 0 && live < (L ? want : c.maxAt) && (L ? G.boats.length < want : G.made < c.boats)) { newBoat(G); G.next = L ? 2 : c.gap * (0.75 + 0.5 * G.rnd()); }
  if (live === 0 && G.next > 2) G.next = 2;
  // the boats
  for (const b of G.boats.slice()) {
    b.age += dt; b.blink = Math.max(0, b.blink - dt);
    const ds = Math.hypot(b.x - S.x, b.y - S.y), lit = ds < c.spot;
    if (b.mode === 'lost' || b.mode === 'adrift') { if (lit) { b.seen += dt; if (b.seen >= c.notice) { b.mode = 'follow'; b.blink = 1.2; G.ev.push({ k: 'sees', id: b.id }); lessonSee(G, 'sees'); } } else b.seen = Math.max(0, b.seen - dt * 2); }
    else if (b.mode === 'follow') { if (ds > c.spot * c.lose) { b.mode = 'adrift'; b.seen = 0; G.ev.push({ k: 'lostlight', id: b.id }); lessonMiss(G, 'fast'); } }
    // where it steers
    let want = b.h, sp = b.v;
    if (b.mode === 'home') { want = Math.atan2(G.hx - b.x, COAST - 8 - b.y); sp = c.follow * 0.8; }
    else if (b.mode === 'follow') { want = Math.atan2(S.x - b.x, S.y - b.y); sp = ds < 5 ? c.follow * ds / 5 : c.follow;
      if (Math.abs(b.x - G.hx) < MOUTH_W + 6 && b.y < SEE_HARBOUR) { b.mode = 'home'; G.ev.push({ k: 'harbour', id: b.id }); } }
    else { want = Math.atan2(b.tx - b.x, COAST - 2 - b.y); sp = c.drift; }
    let dh = want - b.h; while (dh > Math.PI) dh -= TAU; while (dh < -Math.PI) dh += TAU; b.h += clamp(dh, -c.turn * dt, c.turn * dt);
    b.v += (sp - b.v) * Math.min(1, dt * 0.8);
    b.x += Math.sin(b.h) * b.v * dt + G.set * c.current * dt * (b.mode === 'home' ? 0 : 1); b.y += Math.cos(b.h) * b.v * dt;
    // rocks, the shore, the harbour
    const rock = G.rocks.find(q => Math.hypot(q.x - b.x, q.y - b.y) < q.r + 2.5);
    if (rock) { if (L) { const a = Math.atan2(b.x - rock.x, b.y - rock.y); b.x = rock.x + Math.sin(a) * (rock.r + 6); b.y = rock.y + Math.cos(a) * (rock.r + 6); b.v = 0.5; rock.seen = 1; G.ev.push({ k: 'bump', id: b.id }); lessonMiss(G, 'rock'); } else { wreck(G, b, 'rock'); if (G.over) return; } continue; }
    if (b.y < COAST) { if (inMouth(G, b.x) || b.mode === 'home') { safe(G, b); } else if (L) { b.y = COAST + 6; b.h = 0; b.v = 0.5; b.mode = 'adrift'; G.ev.push({ k: 'bump', id: b.id }); lessonMiss(G, 'shore'); } else { wreck(G, b, 'shore'); if (G.over) return; } continue; }
    if (Math.abs(b.x) > 400 || b.y > 400) { b.h = Math.atan2(-b.x, COAST - b.y); }
  }
  if (!G.lesson && G.made >= c.boats && !G.boats.length && !G.over) finish(G, G.lives > 0);
}
function wreck(G, b, why) {
  G.boats.splice(G.boats.indexOf(b), 1); G.wrecks++; G.lives--; G.streak = 0; G.ev.push({ k: 'wreck', id: b.id, x: b.x, y: b.y, why, name: b.name });
  if (G.lives <= 0) finish(G, false, 'wrecks');
}
function safe(G, b) {
  G.boats.splice(G.boats.indexOf(b), 1); G.home++; G.streak++; G.bestStreak = Math.max(G.bestStreak, G.streak); G.ev.push({ k: 'home', id: b.id, name: b.name, n: G.streak }); lessonSee(G, 'home');
}
function finish(G, win, why) {
  G.over = win ? 'won' : 'lost';
  G.res = { win, why, stars: win ? (G.wrecks === 0 && G.t < G.cfg.boats * 75 ? 3 : G.wrecks === 0 ? 2 : 1) : 0, home: G.home, boats: G.cfg.boats, wrecks: G.wrecks, combo: G.bestStreak, time: G.t };
  G.ev.push({ k: win ? 'won' : 'lost', why });
}
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'catch', title: 'FIND THE BOAT', say: G => lightCue(G)[0], do: G => lightCue(G)[1], at: G => lightCue(G)[2], how: 'A boat is lost out there: its little lamp is in the dark. Touch the sea to move your light onto it, and hold it there until its lamp blinks back.', need: 1, ok: w => w === 'sees' },
      { id: 'lead', title: 'LEAD IT HOME', say: G => lightCue(G)[0], do: G => lightCue(G)[1], at: G => lightCue(G)[2], how: 'Now it follows your light. Slide your light slowly to the harbour mouth, between the red and green lights. Too fast and it loses you.', need: 1, ok: w => w === 'home' }],
  2: [{ id: 'rocks', title: 'ROUND THE ROCKS', say: G => lightCue(G)[0], do: G => lightCue(G)[1], at: G => lightCue(G)[2], how: 'Rocks show white with surf where your light falls. Lead the boat round them to the harbour, never across.', need: 1, ok: w => w === 'home', rocks: 4 }],
  3: [{ id: 'two', title: 'TWO AT ONCE', say: G => lightCue(G)[0], do: G => lightCue(G)[1], at: G => lightCue(G)[2], how: 'Two boats are lost. Bring one in, then go back for the other; a boat you leave drifts towards the shore.', need: 2, ok: w => w === 'home', two: true, rocks: 3 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0, miss: 0 }; const st = LESSONS[G.N][0]; if (st.rocks != null) makeRocks(G, st.rocks); G.ev.push({ k: 'lessonnext', first: true }); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonSee(G, what) {
  const D = G.lesson; if (!D) return; const st = D.steps[D.i]; if (!st.ok(what)) return;
  D.n++; if (D.n < st.need) { G.ev.push({ k: 'lessonok', n: D.n, need: st.need }); return; }
  D.i++; D.n = 0; D.miss = 0;
  if (D.i >= D.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); Object.assign(G, { boats: [], made: 0, home: 0, wrecks: 0, lives: G.cfg.lives, next: 2.5, streak: 0, bestStreak: 0 }); makeRocks(G, G.cfg.rocks); }
  else G.ev.push({ k: 'lessonnext' });
}
function lessonMiss(G, why) { const D = G.lesson; if (!D) return; D.miss++; G.ev.push({ k: 'lessonmiss', why, how: D.steps[D.i].how }); }

// ---------- for the robots ----------
// BLIND: a thumb that does not look: touch anywhere on the sea, slide the light left, right, out or in, or hold still.
const BLIND = {
  s: G => aim(G, (Math.random() - 0.5) * 300, 30 + Math.random() * 220),
  l: G => aim(G, G.T.x - 30, G.T.y), r: G => aim(G, G.T.x + 30, G.T.y), o: G => aim(G, G.T.x, G.T.y + 30), i: G => aim(G, G.T.x, G.T.y - 30),
  h: G => {},
};
// a person who looks: picks the boat in most danger, lights it, then leads it home round the rocks at a boat's pace
function danger(G, b) { const c = G.cfg; if (b.mode === 'follow' || b.mode === 'home') return 1e9; let t = (b.y - COAST) / Math.max(0.3, b.v); for (const q of G.rocks) { const d = Math.hypot(q.x - b.x, q.y - b.y) - q.r; const ahead = (q.x - b.x) * Math.sin(b.h) + (q.y - b.y) * Math.cos(b.h); if (ahead > 0 && Math.abs((q.x - b.x) * Math.cos(b.h) - (q.y - b.y) * Math.sin(b.h)) < q.r + 4) t = Math.min(t, d / Math.max(0.3, b.v)); } return t; }
function waypoint(G, b, goal) {
  // where to lead it next: towards the goal (the harbour approach unless given), stepping round any rock in the way
  const gx = goal ? goal.x : G.hx, gy = goal ? goal.y : b.y > SEE_HARBOUR + 10 ? SEE_HARBOUR - 6 : COAST - 4;
  let wx = gx, wy = gy;
  for (let k2 = 0; k2 < 3; k2++) {
    const dx = wx - b.x, dy = wy - b.y, L2 = Math.hypot(dx, dy) || 1, ux = dx / L2, uy = dy / L2; let hit = null, best = 1e9;
    for (const q of G.rocks) { const along = (q.x - b.x) * ux + (q.y - b.y) * uy; if (along < 0 || along > L2) continue; const off = (q.x - b.x) * uy - (q.y - b.y) * ux; if (Math.abs(off) < q.r + 9 && along < best) { best = along; hit = { q, off }; } }
    if (!hit) break; const s = hit.off > 0 ? -1 : 1, q = hit.q; wx = q.x + uy * s * (q.r + 16); wy = q.y - ux * s * (q.r + 16);
  }
  return { x: wx, y: wy };
}
// a person who looks: lights the boat in most danger; with boats following, fetches the next lost one on the way (they all
// follow the one light), then leads the little convoy home round the rocks, at a boat's pace
// THE HAND DRAGS THE LIGHT WHERE IT SHOULD GO (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing happens"). It dragged
// in a fixed place whatever was out there. Now the robot is asked where it would put the light (dryPlan aim) and the hand drags from the light
// to there: onto the lost boat, then a little at a time towards the harbour mouth, round the rocks.
const LHC = { t: -1e9, v: null };
function lightCue(G) { if (G.over || !G.T) return ['WAIT…', 'wait', false]; const now = performance.now(); if (now - LHC.t < 200) return LHC.v; LHC.t = now; const P = dryPlan(G, null, { next: -1 }); let v = ['HOLD IT THERE…', 'wait', false];
  if (P && P[0] === 'aim') { const a = seaScreen(G.T.x, G.T.y), b = seaScreen(P[1], P[2]); if (Math.hypot(b.x - a.x, b.y - a.y) > 14 * k) v = ['DRAG THE LIGHT HERE', 'drag', [a.x, a.y, b.x, b.y]]; }
  LHC.v = v; return v; }
function honest(G, o, mem) {
  const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, c = G.cfg;
  if (G.t < (mem.next || 0)) { if (mem.goal) ACT.aim(G, mem.goal.x, mem.goal.y); return; }
  mem.next = G.t + 0.12 + react * 0.3;
  if (!G.boats.length) { mem.goal = null; return; }
  const n = (1 - acc) * 14, j = () => (Math.random() - 0.5) * 2 * n;
  const fol = G.boats.filter(q => q.mode === 'follow'), lost = G.boats.filter(q => q.mode === 'lost' || q.mode === 'adrift').sort((p, q) => danger(G, p) - danger(G, q));
  if (!fol.length) { const b = lost[0]; if (!b) { mem.goal = null; return; } if (mem.id !== b.id) { mem.id = b.id; mem.next = G.t + react; }
    mem.goal = { x: b.x + Math.sin(b.h) * b.v * 0.6 + j() * 0.5, y: b.y + Math.cos(b.h) * b.v * 0.6 + j() * 0.5 }; ACT.aim(G, mem.goal.x, mem.goal.y); return; }
  const lead = fol.slice().sort((p, q) => Math.hypot(p.x - G.S.x, p.y - G.S.y) - Math.hypot(q.x - G.S.x, q.y - G.S.y))[0];
  const tail = Math.max(...fol.map(q => Math.hypot(q.x - lead.x, q.y - lead.y)));
  let goal = null; const next = lost[0];
  if (next && fol.length < 3 && (danger(G, next) < 30 || Math.hypot(lead.x - G.hx, lead.y - COAST) > 60)) { if (mem.id !== next.id) { mem.id = next.id; mem.next = G.t + react * 0.5; } goal = { x: next.x, y: next.y }; }
  const w = waypoint(G, lead, goal), dx = w.x - lead.x, dy = w.y - lead.y, L2 = Math.hypot(dx, dy) || 1, step = Math.min(L2, (tail > 14 ? 5 : 9) + Math.random() * 4);
  mem.goal = { x: lead.x + dx / L2 * step + j(), y: lead.y + dy / L2 * step + j() };
  ACT.aim(G, mem.goal.x, mem.goal.y);
}
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.made = G.cfg.boats; G.lives = G.cfg.lives; G.boats.length = 0; const b = newBoat(G); G.made = G.cfg.boats; b.x = G.hx; b.y = COAST + 0.5; b.mode = 'home'; b.h = Math.PI; b.v = 3; }

// what the robot would do now, without doing it (tools/dry_plan.py): the tutorial shows this move
const ACT_REAL = { aim }; let ACT = ACT_REAL;
function dryPlan(G, o, mem) { let got = null; const rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { if (!got && !(a.length > 2 && a.slice(1).every(v => v === 0 || v === false))) got = [n, ...a.slice(1)]; return true; };      /* (a stick at rest, all its numbers 0, is not a move; a first bed, number 0, is) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return got; }
function dryPlanAll(G, o, mem) { const all = [], rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { all.push([n, ...a.slice(1)]); return true; };      /* every call, in order (for a robot that steers and drifts at once) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return all; }
