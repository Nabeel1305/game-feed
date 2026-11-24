
// ===================== RULES: Helix Drop (game 69, set 12: one of mine, like Helix Jump) =====================
// A tall tower of round platforms, each with a gap or two and some RED pieces. A ball bounces on the platform under it.
// Slide your thumb left or right anywhere to turn the tower: bring a gap under the ball and it drops through to the next
// platform. Land on red and it is over. Drop through three platforms in a row without a bounce and the ball catches FIRE:
// the next platform it hits shatters, red or not. Reach the bottom. Later towers: more red, narrower gaps, platforms that
// turn on their own, red pieces that slide.
// Angles: the tower turns by theta; the ball sits in front (world angle 0); a platform piece k covers [k, k+1) * SEG of the
// platform's own angle, and what is under the ball is piece floor(((0 - theta - spin) mod 2PI) / SEG).
const RULES = [
  '<b>Slide your thumb</b> left or right to turn the tower.',
  'Bring a <b>gap</b> under the ball and it drops to the next platform.',
  'Land on <b>red</b> and it is over!',
  'Drop through <b>3 platforms in a row</b> without a bounce: the ball catches <b>fire</b> and smashes the next one, red or not.',
  'Reach the bottom of the tower. Faster drops score more.',
];
const SEGS = 12, SEG = TAU / SEGS, GAPY = 3.0, BOUNCE = 6.4, GRAV = 16, VFALL = 7;
const PLACES = [{ name: 'Candy Tower', bg: [0xff9ac8, 0xffd6a0], plat: 0x6ad0ff }, { name: 'Ocean Spire', bg: [0x3ac8e8, 0xa0f0ff], plat: 0xffd23a }, { name: 'Lava Column', bg: [0x2a1a3a, 0xff6a3a], plat: 0x5ae08a }, { name: 'Sky Needle', bg: [0x6a8aff, 0xe8d0ff], plat: 0xffffff }];
const placeOf = N => Math.floor((N - 1) / 5) % 4;
const BALLS = [{ id: 'red', col: 0xff3a5a, stars: 0 }, { id: 'lime', col: 0x9aff3a, stars: 6 }, { id: 'sky', col: 0x3ab0ff, stars: 15 }, { id: 'gold', col: 0xffd040, stars: 30 }];
const UPGRADES = [
  { id: 'shield', name: 'Shield', desc: 'Once a tower, a landing on red is forgiven.', max: 1, cost: l => 90 },
  { id: 'fire', name: 'Quick fire', desc: 'The ball catches fire after two drops in a row, not three.', max: 1, cost: l => 120 },
  { id: 'grip', name: 'Smooth turn', desc: 'The tower turns a little further for each slide.', max: 2, cost: l => 40 + l * 50 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Bouncer'], [40, 'Dropper'], [130, 'Spinner'], [320, 'Fireball'], [700, 'Tower breaker'], [1500, 'Helix legend']];
function makeCfg(N, help) { const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), boss = N % 10 === 0;
  return { N, f, help: !!help, place: placeOf(N), boss, floors: Math.round(x(20, 42, 30) * (boss ? 1.3 : 1)), red: x(3.1, 6.6, 30) * (help ? 0.75 : 1), gapW: x(2.6, 1.1, 25) * (help ? 1.15 : 1),
    spin: N >= 6 ? x(0, 0.9, 30) : 0, slide: N >= 10 ? x(0, 0.5, 30) : 0, fireN: upLv('fire') ? 2 : 3, shield: upLv('shield') + (help ? 1 : 0), turn: 1 + 0.15 * upLv('grip') }; }
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, place: cfg.place, wait: 0, next: null };
  setup(G); if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else G.ev.push({ k: 'start' });
  return G; }
// how long until the ball (falling no faster than VFALL) is down at height top
function landT(b, top) { let v = b.vy, y = b.y, t = 0; for (let i = 0; i < 300 && y > top; i++) { v = Math.max(-VFALL, v - GRAV / 60); y += v / 60; t += 1 / 60; } return t; }
// a platform: SEGS pieces, each 'gap', 'solid' or 'red'; gaps never next to the last platform's gaps (so a drop is never
// free twice), red never on both sides of a gap; it may turn on its own (spin) and its reds may slide
function platform(G, i, o = {}) { const c = G.cfg, R = G.rnd, p = Array(SEGS).fill('solid'), g0 = (R() * SEGS) | 0, gw = Math.max(1, Math.round(o.gapW || c.gapW + (R() - 0.5) * 0.8));
  for (let k = 0; k < gw; k++) p[(g0 + k) % SEGS] = 'gap';
  if (!o.single && R() < 0.35 && gw <= 2) { const g1 = (g0 + 5 + ((R() * 3) | 0)) % SEGS; p[g1] = 'gap'; }
  const nr = o.red != null ? o.red : Math.max(0, Math.round(c.red + (R() - 0.5) * 1.6)); let put = 0, tries = 0;
  while (put < nr && tries++ < 60) { const k = (R() * SEGS) | 0; if (p[k] !== 'solid') continue; const l = p[(k + SEGS - 1) % SEGS], r = p[(k + 1) % SEGS]; if (l === 'gap' && r === 'gap') continue; if (tries < 30 && (l === 'gap' || r === 'gap') && R() < 0.6) continue; p[k] = 'red'; put++; }
  const above = G.plats && G.plats[i - 1], a0 = R() * TAU;
  if (above) for (let k = 0; k < SEGS; k++) { if (above.p[k] !== 'gap') continue; for (const f of [0.1, 0.5, 0.9]) { const w = above.a + (k + f) * SEG, kk = Math.floor((((w - a0) % TAU) + TAU) % TAU / SEG) % SEGS; if (p[kk] === 'red') p[kk] = 'solid'; } }
  const spin = o.spin != null ? o.spin : (c.spin && R() < 0.5 ? (R() < 0.5 ? -1 : 1) * c.spin * (0.6 + R() * 0.8) : 0);
  return { y: -i * GAPY, p, a: a0, spin, slide: c.slide && R() < 0.4 ? c.slide : 0, broken: false, i }; }
function setup(G, o = {}) { const c = G.cfg, n = o.floors || c.floors; G.plats = []; for (let i = 0; i < n; i++) G.plats.push(platform(G, i, Object.assign({ red: i === 0 ? 0 : undefined }, o.plat || {})));
  // the first platform: a gap you can find, no red; the finish at the bottom
  G.finY = -n * GAPY; G.theta = 0; G.ball = { y: 1.4, vy: 0, squash: 0 }; G.pi = 0; G.streak = 0; G.fire = false; G.score = 0; G.passed = 0; G.bounces = 0; G.shields = c.shield; G.smashed = 0; G.bestStreak = 0; G.reds = 0; }
// what piece of platform pl is under the ball now
function under(G, pl) { const a = (((-G.theta - pl.a) % TAU) + TAU) % TAU, k = Math.floor(a / SEG) % SEGS; return { k, kind: pl.p[k], into: a - k * SEG }; }
// ---------- your thumb ----------
function turn(G, d) { if (G.over || G.wait > 0) return; G.theta += d * G.cfg.turn; }
function step(G, dt) { if (G.over || !(dt > 0)) return; G.t += dt;
  if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0) { G.wait = 0; const f = G.next; G.next = null; if (f) f(); } return; }
  for (const pl of G.plats) { if (pl.spin) pl.a += pl.spin * dt; if (pl.slide && !pl.broken) { pl.st = (pl.st || 0) + dt; if (pl.st > 1.6 / pl.slide) { pl.st = 0; const reds = []; pl.p.forEach((q, k) => { if (q === 'red') reds.push(k); }); for (const k of reds) { const n = (k + 1) % SEGS; if (pl.p[n] === 'solid') { pl.p[n] = 'red'; pl.p[k] = 'solid'; } } } } }
  const b = G.ball; b.vy = Math.max(-VFALL, b.vy - GRAV * dt); const ny = b.y + b.vy * dt; b.squash = Math.max(0, b.squash - dt * 5);
  // the next platform down (or the finish)
  const pl = G.plats[G.pi];
  if (!pl) { if (ny <= G.finY + 0.3) { b.y = G.finY + 0.3; b.vy = 0; G.ev.push({ k: 'finish' }); if (G.lesson) { lessonSee(G, 'finish'); return; } G.wait = 1.2; G.next = () => finish(G, true); return; } b.y = ny; return; }
  const top = pl.y + 0.3;
  if (b.y >= top && ny < top && b.vy < 0) { const u = under(G, pl);
    if (pl.broken || u.kind === 'gap') { G.pi++; G.passed++; G.streak++; G.bestStreak = Math.max(G.bestStreak, G.streak); G.score += 10 * G.streak; G.ev.push({ k: 'pass', n: G.streak, i: pl.i }); if (G.streak >= G.cfg.fireN && !G.fire) { G.fire = true; G.ev.push({ k: 'fire' }); } if (G.lesson) lessonSee(G, 'pass'); b.y = ny; return; }
    if (G.fire) { pl.broken = true; G.fire = false; G.smashed++; G.pi++; G.passed++; G.score += 30; G.streak = 1; G.ev.push({ k: 'smash', i: pl.i }); if (G.lesson) lessonSee(G, 'smash'); b.y = ny; return; }
    if (u.kind === 'red') { if (G.shields > 0) { G.shields--; G.ev.push({ k: 'shield' }); b.y = top; b.vy = BOUNCE; G.streak = 0; return; }
      G.reds++; G.ev.push({ k: 'red', i: pl.i, k2: u.k }); if (G.lesson) { lessonMiss(G); return; } b.y = top; b.vy = 0; G.wait = 1.0; G.next = () => finish(G, false); return; }
    b.y = top; b.vy = BOUNCE; b.squash = 1; G.bounces++; G.ev.push({ k: 'bounce', i: pl.i, k2: u.k, streak: G.streak }); G.streak = 0; return; }
  b.y = ny; }
function finish(G, win) { if (G.over) return true; G.over = win ? 'won' : 'lost'; const c = G.cfg, prog = Math.min(1, G.passed / c.floors);
  const stars = win ? 1 + (G.bestStreak >= 5 ? 1 : 0) + (G.bounces <= c.floors * 0.6 ? 1 : 0) : 0;
  G.res = { win, stars, score: G.score + (win ? 100 : 0), prog, passed: G.passed, floors: c.floors, smashed: G.smashed, streak: G.bestStreak, bounces: G.bounces, coins: Math.round(G.passed / 4) + (win ? 4 + Math.ceil(G.N / 3) + stars * 2 : 1) };
  G.ev.push({ k: win ? 'won' : 'lost' }); return true; }
// ---------- LESSONS: short towers ----------
const LESSONS = {
  1: [{ id: 'drop', title: 'TURN AND DROP', say: 'SLIDE TO TURN', do: 'drag', dir: 'lr', at: G => [W / 2, H * 0.7], how: 'Slide your thumb left or right to turn the tower. Bring the GAP under the ball. Reach the bottom of this little tower; red ends it.', need: 1, tower: { floors: 10, plat: { red: 5, gapW: 1, single: true } } }],
  2: [{ id: 'fire', title: 'CATCH FIRE', say: 'DROP 3 IN A ROW', do: 'drag', dir: 'lr', at: G => [W / 2, H * 0.7], how: 'Drop through 3 platforms in a row without a bounce: the ball catches FIRE and smashes the next one. Smash one!', need: 1, tower: { floors: 12, plat: { red: 5, gapW: 3, single: true } } }],
  3: [{ id: 'spin', title: 'MOVING PLATFORMS', say: 'WATCH THE GAP', do: 'drag', dir: 'lr', at: G => [W / 2, H * 0.7], how: 'These platforms turn by themselves. Watch the gap, and turn the tower to meet it. Reach the bottom.', need: 1, tower: { floors: 10, plat: { red: 5, gapW: 2, single: true, spin: 0.6 } } }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonDeal(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonDeal(G) { const st = lessonNow(G); setup(G, st.tower); G.lsmash = 0; G.ev.push({ k: 'tower' }); }
function lessonMiss(G) { const st = lessonNow(G); G.ev.push({ k: 'lessonmiss', how: st.how }); G.wait = 1.1; G.next = () => lessonDeal(G); }
function lessonSee(G, what) { const st = lessonNow(G); if (!st) return; if (what === 'smash') G.lsmash++;
  if (what !== 'finish') return; if (st.id === 'fire' && !G.lsmash) { G.ev.push({ k: 'lessonmiss', how: 'You reached the bottom without catching fire. Drop through 3 in a row, then smash one!' }); G.wait = 1.1; G.next = () => lessonDeal(G); return; }
  G.ev.push({ k: 'lessonok', n: 1, need: 1 }); G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.wait = 1.4; G.next = () => { G.rnd = rng(G.seed); setup(G); G.ev.push({ k: 'start' }); G.ev.push({ k: 'tower' }); }; }
// ---------- for the robots ----------
// BLIND: a thumb that does not look: slides some way, some distance
const BLIND = { l: G => turn(G, -(0.3 + Math.random() * 1.6)), r: G => turn(G, 0.3 + Math.random() * 1.6) };
// a player who looks: turns the tower to bring the nearest gap (clear of red on the way in) under the ball before it lands,
// as fast as a thumb slides; a little late or off now and then
function honest(G, o, mem) { const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random;
  if (G.over || G.wait > 0) { mem.aim = null; return; } const pl = G.plats[G.pi]; if (!pl) return;
  if (mem.pl !== pl) { mem.pl = pl; mem.see = 0.06 + react * 0.4; mem.aim = (R() - 0.5) * 2 * SEG * (0.04 + (1 - acc) * 0.5); }      /* a new platform: a moment to see it */
  if (mem.see > 0) { mem.see -= 1 / 60; return; }
  const b = G.ball, top = pl.y + 0.3, tl = landT(b, top), sp = 5 + acc * 5, a = (((-G.theta - pl.a) % TAU) + TAU) % TAU;
  // where each piece is from the ball (shortest way round)
  const off = k => { let d = (k + 0.5) * SEG - a; return Math.atan2(Math.sin(d), Math.cos(d)); };
  let gap = null; for (let k = 0; k < SEGS; k++) if (pl.p[k] === 'gap') { const d = off(k); if (gap == null || Math.abs(d) < Math.abs(gap)) gap = d; }
  if (gap == null) return; const need = Math.abs(gap) / sp + 0.05 + react * 0.1, cur = pl.p[Math.floor(a / SEG) % SEGS];
  let want = 0;
  if (need < tl) want = gap + mem.aim - (pl.spin || 0) * Math.min(tl, 0.4);      // time to get the gap round before it lands
  else if (cur === 'red') { let bd = 1e9; for (let k = 0; k < SEGS; k++) if (pl.p[k] !== 'red') { const d = off(k); if (Math.abs(d) < Math.abs(bd)) bd = d; } want = bd; }      // no time: just get off the red
  else return;      // no time: stay on the safe piece and wait for the next bounce
  const st = clamp(want, -sp / 60, sp / 60); turn(G, -st / G.cfg.turn); }
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.wait = 0; G.passed = G.cfg.floors; finish(G, true); }
