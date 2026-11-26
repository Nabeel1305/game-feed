
// ===================== THE RULES: Hoop Shot (his idea 13, 20 Nov 2026) =====================
// Basketball, purely shooting. The camera stands behind the ball, facing the hoop. Put your thumb down anywhere, pull BACK
// (down the screen) to set the power and move SIDEWAYS to aim (like a slingshot: pull left to shoot right), let go to shoot.
// The same gesture always. Early levels show the ball's path; later only its start, then nothing. Each round is a run of
// shooting spots and a number of baskets to make with the balls you have. Clean baskets (nothing but net) are SWISHES.
// A miss says what was wrong: too strong, too weak, left or right, off the rim. Every fifth level is a challenge, kept apart
// from ordinary shooting: BANK SHOTS (off the board first), MOVING SPOT (you shoot while you slide), AROUND THE WORLD (score
// once from every marked spot). There is also PRACTICE: unlimited balls, the full path shown.
// World: metres; the hoop's centre is (0, 3.05, 0), the board behind it at z = -0.38; you shoot from z > 0.
const RULES = [
  '<b>Thumb down anywhere, pull back</b> (down) for power, <b>move sideways</b> to aim, <b>let go</b> to shoot.',
  'Like a slingshot: pull a little to the <b>left</b> and the ball goes a little to the <b>right</b>.',
  'Make the round\'s number of baskets with the balls you have. <b>Nothing but net</b> is a SWISH.',
  'Missed? The game says why: <b>too strong, too weak, left, right</b>. Your last shot\'s path stays faint on the screen.',
  'Every fifth level is a <b>challenge</b>: bank shots, a moving spot, or around the world.',
  '<b>Practice</b> (on the home screen): unlimited balls, the whole path shown.',
];
const RIM = { x: 0, y: 3.05, z: 0, r: 0.23 }, BALL = 0.12, BOARD = { z: -0.38, x: 0.915, y0: 2.9, y1: 3.97 }, GRAV = 9.81, ELEV = 52 * Math.PI / 180, H0 = 2.05, VMIN = 5.2, VMAX = 9.6;
const COURTS = [{ name: 'Neighbourhood Court', sky: 'golden' }, { name: 'The Old Gym', sky: 'noon', indoor: true }, { name: 'Rooftop', sky: 'dusk' }, { name: 'The Big Arena', sky: 'night', indoor: true }];
const placeOf = N => Math.floor((N - 1) / 5) % COURTS.length;
const PLACES = COURTS;
const SKINS = [{ id: 'classic', name: 'Classic', col: 0xe8742a, stars: 0 }, { id: 'street', name: 'Street Blue', col: 0x2a6ad8, stars: 5 }, { id: 'retro', name: 'Retro Red', col: 0xd8322a, stars: 12 },
  { id: 'gold', name: 'Gold', col: 0xd6a630, stars: 20 }, { id: 'lime', name: 'Lime', col: 0x7ad83a, stars: 30 }, { id: 'night', name: 'Night', col: 0x2a2440, stars: 42 },
  { id: 'pink', name: 'Bubblegum', col: 0xff7ab0, stars: 56 }, { id: 'white', name: 'Pearl', col: 0xeeeeee, stars: 75 }];
const UPGRADES = [
  { id: 'eye', name: 'Sharp eye', max: 3, cost: l => [30, 70, 140][l], desc: 'The path you see before a shot is a little longer.' },
  { id: 'grip', name: 'Soft touch', max: 3, cost: l => [25, 60, 120][l], desc: 'Shots that touch the rim drop in more often.' },
  { id: 'ball', name: 'Extra ball', max: 2, cost: l => [60, 140][l], desc: 'One more ball every round.' },
  { id: 'fans', name: 'Fans', max: 3, cost: l => [35, 80, 150][l], desc: 'More coins for streaks.' },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Rookie'], [60, 'Shooter'], [200, 'Sharpshooter'], [500, 'Splash artist'], [1100, 'Net burner'], [2500, 'Legend']];
// a level: the spots, the balls, the baskets needed, how much of the path you see, and the challenge (every fifth)
function makeCfg(N, help, practice) { const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), ch = N % 5 === 0 ? ['bank', 'moving', 'around'][(N / 5 - 1) % 3] : null;
  const spots = ch === 'around' ? 5 : Math.min(8, 5 + Math.floor(f / 7)), need = ch === 'around' ? 5 : Math.ceil(spots * x(0.6, 0.8, 20));
  const prev = practice ? 1 : N <= 3 ? 1 : N <= 8 ? 0.5 : N <= 14 ? 0.22 : 0;
  return { N, ch, spots, need: practice ? 1e9 : need, balls: practice ? 1e9 : (ch === 'around' ? 8 : spots + 1) + upLv('ball') + (help ? 2 : 0), dMin: x(2.2, 4.0, 14), dMax: x(2.8, 7.2, 14), ang: x(0.05, 0.75, 12), prev: Math.min(1, prev + 0.12 * upLv('eye') * (prev > 0 ? 1 : 0)) + (help && !practice ? 0.2 : 0),
    slide: ch === 'moving' ? x(0.7, 1.6, 30) : 0, practice: !!practice, help: !!help, soft: upLv('grip') }; }
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help, o.practice), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach && !o.practice, taught: o.taught | 0, lesson: null, wait: 0, next: null, mini: !!o.mini };
  setup(G); if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else G.ev.push({ k: 'start' });
  return G; }
function makeSpots(G, n, o = {}) { const c = G.cfg, R = G.rnd, out = [];
  for (let i = 0; i < n; i++) { const d = o.d != null ? o.d : c.dMin + (c.dMax - c.dMin) * (n > 1 ? (i / (n - 1)) * 0.6 + R() * 0.4 : R()), a = o.a != null ? o.a : (c.ch === 'around' ? (-0.8 + 1.6 * i / (n - 1)) : (R() * 2 - 1) * c.ang);
    out.push({ x: Math.sin(a) * d, z: Math.cos(a) * d, d, a }); }
  return out; }
function setup(G, o = {}) { const c = G.cfg; G.t = 0; G.yard = o.yard || null;
  G.spots = o.spots || makeSpots(G, c.spots); G.si = 0; G.balls = o.balls || c.balls; G.used = 0; G.made = 0; G.swish = 0; G.streak = 0; G.best = 0; G.swStreak = 0; G.bestSw = 0; G.done = G.spots.map(() => false);
  G.ball = null; G.aim = null; G.last = null; G.state = 'aim'; G.slide = { x: 0, v: c.slide, t: 0 }; G.shots = []; }
const spotNow = G => { const s = G.spots[G.si]; return G.cfg.slide ? { x: s.x + G.slide.x, z: s.z, d: s.d, a: s.a, vx: G.slide.vx || 0 } : Object.assign({ vx: 0 }, s); };
// ---------- the shot: power 0..1 and an aim offset -1..1 (as the thumb sets them) ----------
function launchV(G, sp, p, yaw) { const v = VMIN + clamp(p, 0, 1) * (VMAX - VMIN), dx = RIM.x - sp.x, dz = RIM.z - sp.z, base = Math.atan2(dx, dz), a = base + clamp(yaw, -1, 1) * 0.3;
  return { x: Math.sin(a) * Math.cos(ELEV) * v + (sp.vx || 0), y: Math.sin(ELEV) * v, z: Math.cos(a) * Math.cos(ELEV) * v }; }
function newBall(sp, v) { return { x: sp.x, y: H0, z: sp.z - 0.05, vx: v.x, vy: v.y, vz: v.z, t: 0, rim: 0, board: false, scored: false, swish: false, floor: 0, near: null, done: false, path: [] }; }
// one step of the flight: gravity, the rim (a ring), the board, the floor; a basket when it drops through the ring
function fly(b, dt, soft = 0, ev) { const py = b.y; b.vy -= GRAV * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt; b.t += dt;
  // the board
  if (b.z - BALL < BOARD.z && b.vz < 0 && Math.abs(b.x) < BOARD.x && b.y > BOARD.y0 && b.y < BOARD.y1 && b.z > BOARD.z - 0.3) { b.z = BOARD.z + BALL; b.vz = -b.vz * 0.62; b.vx *= 0.9; b.vy *= 0.92; if (!b.board) { b.board = true; ev && ev({ k: 'board' }); } }
  // the rim: the nearest point of the ring
  { const hx = b.x - RIM.x, hz = b.z - RIM.z, hd = Math.hypot(hx, hz) || 1e-6, px = RIM.x + hx / hd * RIM.r, pz = RIM.z + hz / hd * RIM.r, dx = b.x - px, dy = b.y - RIM.y, dz = b.z - pz, d = Math.hypot(dx, dy, dz);
    if (d < BALL + 0.01) { const nx = dx / d, ny = dy / d, nz = dz / d, vn = b.vx * nx + b.vy * ny + b.vz * nz; if (vn < 0) { const e = 0.55 - 0.08 * soft, fr = 0.82 - 0.05 * soft; b.vx = (b.vx - vn * nx) * fr - vn * nx * e; b.vy = (b.vy - vn * ny) * fr - vn * ny * e; b.vz = (b.vz - vn * nz) * fr - vn * nz * e; }
      const push = BALL + 0.01 - d; b.x += nx * push; b.y += ny * push; b.z += nz * push; b.rim++; if (b.rim === 1 || b.rim % 6 === 0) ev && ev({ k: 'rim', n: b.rim }); } }
  // the basket: down through the ring
  if (!b.scored && py >= RIM.y && b.y < RIM.y && b.vy < 0 && Math.hypot(b.x - RIM.x, b.z - RIM.z) < RIM.r - BALL * 0.35) { b.scored = true; b.swish = !b.rim && !b.board; b.vx *= 0.3; b.vz *= 0.3; b.vy *= 0.5; ev && ev({ k: 'net', swish: b.swish }); }
  if (b.scored && b.y < RIM.y && b.y > RIM.y - 0.45) { b.vx += (RIM.x - b.x) * dt * 20; b.vz += (RIM.z - b.z) * dt * 20; b.vy *= 0.96; }
  // where it was when it came down past the rim's height (for "too strong / too weak")
  if (!b.near && py >= RIM.y && b.y < RIM.y && b.vy < 0) b.near = { x: b.x, z: b.z, board: b.board };
  // the floor
  if (b.y < BALL) { b.y = BALL; if (b.vy < 0) { b.vy = -b.vy * 0.68; b.vx *= 0.8; b.vz *= 0.8; b.floor++; ev && ev({ k: 'bounce', v: Math.abs(b.vy) }); } }
  if (b.t > 4.5 || b.floor >= 2 || (b.scored && b.y < 0.8)) b.done = true; }
// the outcome of a shot without playing it (the robot's practice, and the path you are shown)
function simulate(G, sp, p, yaw) { const b = newBall(sp, launchV(G, sp, p, yaw)); let n = 0; while (!b.done && n++ < 600) fly(b, 1 / 120, G.cfg.soft); return b; }
function previewPath(G, p, yaw) { const sp = spotNow(G), b = newBall(sp, launchV(G, sp, p, yaw)), out = []; let n = 0, tEnd = null;
  while (n++ < 600) { const py = b.y; fly(b, 1 / 60, G.cfg.soft); out.push({ x: b.x, y: b.y, z: b.z }); if (py >= RIM.y && b.y < RIM.y && b.vy < 0) { tEnd = out.length; break; } if (b.done) break; }
  return out.slice(0, Math.max(3, Math.round((tEnd || out.length) * G.cfg.prev))); }
// ---------- your thumb ----------
function aimSet(G, p, yaw) { if (G.over || G.wait > 0 || G.state !== 'aim') return; G.aim = { p: clamp(p, 0, 1), yaw: clamp(yaw, -1, 1) }; }
function aimCancel(G) { G.aim = null; }
function shoot(G, p, yaw) { if (G.over || G.wait > 0 || G.state !== 'aim' || G.used >= G.balls) return false; if (p == null) { if (!G.aim) return false; p = G.aim.p; yaw = G.aim.yaw; }
  if (p < 0.04) { G.aim = null; return false; }      // a tiny pull is not a shot
  const sp = spotNow(G); G.ball = newBall(sp, launchV(G, sp, p, yaw)); G.ball.p = p; G.ball.yaw = yaw; G.aim = null; G.state = 'fly'; G.used++; G.ev.push({ k: 'shoot', p }); return true; }
// ---------- the clock ----------
function step(G, dt) { if (G.over || !(dt > 0)) return;
  if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0) { G.wait = 0; if (G.next) { const f = G.next; G.next = null; f(); } } return; }
  G.t += dt; const c = G.cfg;
  if (c.slide && G.state === 'aim') { const s = G.slide; s.t += dt; const nx = Math.sin(s.t * s.v) * 1.3; s.vx = (nx - s.x) / dt; s.x = nx; }
  if (G.state === 'fly' && G.ball) { const b = G.ball, ev = e => G.ev.push(e); for (let i = 0; i < 2; i++) fly(b, dt / 2, c.soft, ev); if (G.ball.path.length < 400 && G.t % 0.02 < dt) b.path.push({ x: b.x, y: b.y, z: b.z }); if (b.done) result(G); } }
function result(G) { const b = G.ball, c = G.cfg, sp = spotNow(G); G.state = 'after'; let ok = b.scored;
  if (c.ch === 'bank' && ok && !b.board) { ok = false; G.ev.push({ k: 'nobank' }); }
  let why = null; if (!ok) { const n = b.near || { x: b.x, z: b.z }, fx = RIM.x - sp.x, fz = RIM.z - sp.z, L = Math.hypot(fx, fz) || 1, ux = fx / L, uz = fz / L, ex = n.x - RIM.x, ez = n.z - RIM.z, along = ex * ux + ez * uz, lat = ex * uz - ez * ux;
    why = c.ch === 'bank' && b.scored ? 'nobank' : !b.near && !b.board && !b.rim ? 'short' : b.rim >= 3 && Math.hypot(ex, ez) < 0.35 ? 'rim' : (b.near && b.near.board || !b.near && b.board) && Math.abs(lat) < 0.3 ? 'long' : Math.abs(along) >= Math.abs(lat) ? (along > 0 ? 'long' : 'short') : (lat > 0 ? 'right' : 'left'); }
  G.shots.push({ ok, swish: ok && b.swish, why, p: b.p, yaw: b.yaw, spot: G.si }); G.last = { path: b.path.slice(), ok, why };
  if (ok) { G.made++; G.streak++; G.best = Math.max(G.best, G.streak); if (b.swish) { G.swish++; G.swStreak++; G.bestSw = Math.max(G.bestSw, G.swStreak); } else G.swStreak = 0; G.done[G.si] = true; }
  else { G.streak = 0; G.swStreak = 0; }
  G.ev.push({ k: ok ? 'score' : 'miss', swish: ok && b.swish, bank: ok && b.board, why, streak: G.streak, swStreak: G.swStreak });
  if (G.lesson) { lessonSee(G, ok ? 'score' : 'miss', why); return; }
  // next: ordinary rounds walk the spots in turn; around the world stays on a spot until it is scored
  const left = G.balls - G.used, needLeft = c.need - G.made;
  if (!c.practice && G.made >= c.need) { G.wait = 0.9; G.next = () => finish(G, true); return; }
  if (!c.practice && (left <= 0 || needLeft > left)) { G.wait = 0.9; G.next = () => finish(G, false, { why: 'balls' }); return; }
  G.wait = 0.75; G.next = () => { if (c.ch === 'around') { if (ok) { const nx = G.done.findIndex(d => !d); G.si = nx < 0 ? 0 : nx; } } else G.si = (G.si + 1) % G.spots.length; if (c.practice && G.si === 0) { G.spots = makeSpots(G, c.spots); } G.ball = null; G.state = 'aim'; G.slide.t = 0; G.ev.push({ k: 'spot', i: G.si }); }; }
function finish(G, win, o = {}) { if (G.over) return true; G.over = win ? 'won' : 'lost'; const c = G.cfg;
  const stars = win ? 1 + (G.made >= Math.min(G.spots.length, c.need + 1) || G.used <= c.need ? 1 : 0) + (G.swish >= Math.ceil(G.made / 2) ? 1 : 0) : 0;
  G.res = { win, stars, why: o.why || null, made: G.made, need: c.need, used: G.used, balls: G.balls, swish: G.swish, best: G.best, bestSw: G.bestSw, ch: c.ch, shots: G.shots,
    coins: Math.max(1, G.made * 2 + G.swish + (win ? Math.ceil(G.N / 2) + stars * 3 + G.best * (1 + upLv('fans')) : 0)) };
  G.ev.push({ k: win ? 'won' : 'lost' }); return true; }
// ---------- the robot: a shooter who looks (it finds the shot that drops, then its hand is a little off) ----------
function idealShot(G) { const sp = spotNow(G), bank = G.cfg.ch === 'bank', key = [G.si, sp.x.toFixed(2), sp.z.toFixed(2), bank].join(':'); if (G.ideal && G.ideal.key === key && !G.cfg.slide) return G.ideal;
  const good = (p, y) => { const b = simulate(G, sp, p, y); return b.scored && (!bank || b.board); }; let best = null;
  const y0 = sp.vx ? clamp(-sp.vx * Math.cos(Math.atan2(RIM.x - sp.x, RIM.z - sp.z)) / 4.6 / 0.3, -0.9, 0.9) : 0, span = bank ? 0.4 : sp.vx ? 0.2 : 0, stp = bank ? 0.2 : 0.1;
  for (let y = y0 - span; y <= y0 + span + 1e-4; y += stp) for (let p = 0; p <= 1.0001; p += 0.015) { if (!good(p, y)) continue; // the middle of the run of good powers
    let lo = p, hi = p; while (hi + 0.005 <= 1 && good(hi + 0.005, y)) hi += 0.005; const w = hi - lo; if (!best || w > best.w) best = { p: (lo + hi) / 2, yaw: y, w }; p = hi; }
  if (!best) best = { p: 0.5, yaw: 0, w: 0 }; best.key = key; G.ideal = best; return best; }
const gauss = () => { let u = 0; for (let i = 0; i < 4; i++) u += Math.random(); return (u - 2) * 1.732; };
// THE TUTORIAL'S HAND PULLS BACK THE SHOT THAT GOES IN (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing happens").
// It pulled straight down in a box: no aim, any strength. Now the hand pulls exactly the robot's ideal shot (idealShot): down for the power,
// sideways the other way for the aim (left sends the ball right).
function shotCue(G) { if (G.over || G.wait > 0 || G.state !== 'aim') return ['WAIT…', 'wait', false]; const I = idealShot(G), x0 = W / 2, y0 = H * 0.45, dy = I.p * H * 0.4, dx = -I.yaw * W * 0.42;
  return [Math.abs(I.yaw) > 0.08 ? 'PULL DOWN AND TO THE SIDE' : 'PULL BACK, LET GO', 'drag', [x0, y0, x0 + dx, y0 + dy]]; }
function honest(G, o, mem) { if (G.over || G.wait > 0 || G.state !== 'aim') return; const acc = o.acc == null ? 0.85 : o.acc, react = o.react == null ? 0.3 : o.react;
  mem.cd = (mem.cd || 0) - 1 / 60; if (mem.cd > 0) return; mem.cd = 0.5 + react * 2;
  const I = idealShot(G), pv = G.cfg.prev, sp = spotNow(G), learn = G.shots.filter(s => s.spot === G.si || Math.abs(G.spots[s.spot].d - sp.d) < 0.5).length;
  const mv = G.cfg.slide ? 1.4 : 1, sP = (pv >= 1 ? 0.004 : pv >= 0.5 ? 0.009 : pv > 0 ? 0.015 : 0.024) * (1.45 - acc) * (learn ? 0.85 : 1) * (1 + 0.05 * sp.d) * mv, sY = (pv > 0 ? 0.03 : 0.05) * (1.45 - acc) * mv;
  shoot(G, I.p + gauss() * sP, I.yaw + gauss() * sY); }
// blind moves: a pull of any strength any way; the same middling flick every time
const BLIND = { f: G => shoot(G, 0.1 + Math.random() * 0.9, Math.random() * 2 - 1), g: G => shoot(G, 0.5, 0) };
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.wait = 0; G.made = G.cfg.need; finish(G, true); }
// ---------- LESSONS ----------
const AIMCARD = {"pic": "🏀", "win": "SCORE ENOUGH BASKETS", "lose": "RUN OUT OF BALLS", "how": "PULL BACK, LET GO"};      // the aim card: specs/aims.json (tools/aims.py)
const LESSONS = {
  1: [{ id: 'pull', title: 'PULL BACK, LET GO', say: G => shotCue(G)[0], do: G => shotCue(G)[1], at: G => shotCue(G)[2], how: 'Put your thumb down, pull it back (down the screen) and let go. Pull further for more power: watch the dotted path. Make 2 baskets.', need: 2 }],
  2: [{ id: 'aim', title: 'AIM SIDEWAYS', say: G => shotCue(G)[0], do: G => shotCue(G)[1], at: G => shotCue(G)[2], how: 'Now the hoop is off to one side. Move your thumb sideways as you pull: left sends the ball right, like a slingshot. Make 2 baskets.', need: 2 }],
  3: [{ id: 'far', title: 'FURTHER OUT', say: G => shotCue(G)[0], do: G => shotCue(G)[1], at: G => shotCue(G)[2], how: 'The further from the hoop, the harder you pull. The path is shorter now: feel it. Make 2 baskets from the long spots.', need: 2 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonDeal(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonDeal(G) { const st = lessonNow(G), n = G.lesson.n; G.rnd = rng(G.seed + (G.deals = (G.deals | 0) + 1));
  if (st.id === 'pull') { G.cfg = Object.assign({}, G.cfg, { prev: 1 }); setup(G, { yard: 'pull', spots: makeSpots(G, 3, { d: 2.4, a: 0 }), balls: 99 }); }
  if (st.id === 'aim') { G.cfg = Object.assign({}, G.cfg, { prev: 1 }); setup(G, { yard: 'aim', spots: [makeSpots(G, 1, { d: 2.8, a: 0.55 })[0], makeSpots(G, 1, { d: 2.8, a: -0.55 })[0]], balls: 99 }); }
  if (st.id === 'far') { G.cfg = Object.assign({}, G.cfg, { prev: 0.5 }); setup(G, { yard: 'far', spots: [makeSpots(G, 1, { d: 4.2, a: 0.2 })[0], makeSpots(G, 1, { d: 4.6, a: -0.15 })[0]], balls: 99 }); }
  G.lesson.n = n; G.ev.push({ k: 'yard' }); }
function lessonSee(G, what, why) { const L = lessonNow(G); if (!L) return;
  if (what === 'score') { G.lesson.n++; G.ev.push({ k: 'lessonok', n: G.lesson.n, need: L.need }); }
  else G.ev.push({ k: 'lessonmiss', how: { long: 'Too strong! Pull back a little less.', short: 'Too weak! Pull back a little further.', left: 'It went left: move your thumb a little to the LEFT as you pull.', right: 'It went right: move your thumb a little to the RIGHT as you pull.', rim: 'Off the rim! So close. Nearly the same again.', nobank: 'Off the board first!' }[why] || L.how });
  if (G.lesson.n >= L.need) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.wait = 1.4; G.next = () => { G.rnd = rng(G.seed); G.cfg = makeCfg(G.N, G.cfg.help); setup(G); G.ev.push({ k: 'start' }); G.ev.push({ k: 'yard' }); }; return; }
  G.wait = 0.7; G.next = () => { G.si = (G.si + 1) % G.spots.length; G.ball = null; G.state = 'aim'; G.ev.push({ k: 'spot', i: G.si }); }; }
