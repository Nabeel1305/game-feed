
// ===================== RULES: Strike Alley (game 40) =====================
// Bowling. Put your thumb down: the ball slides across to line up under it. Pull back toward you and let go: it rolls the
// other way, faster the further you pulled; tilt the pull to angle it. The ball you bowl with decides how much it curls
// (a straight ball, a hook...), and the lane's oil decides where: dry wood at the far end lets a ball grab and turn. Hit the
// pocket (just beside the head pin) for strikes. A level is a short game of frames with a score to beat; some levels are
// spare challenges (a split already standing) or strike-outs. Pins knocked score, a spare adds 5, a strike 10, and strikes and
// spares in a row build a run that multiplies. A golden pin, now and then, is worth coins. Balls to collect, upgrades that stay.
// World: metres; x across the lane (+ right), z up the lane from the foul line (pins at z = 18.3).
const RULES = [
  '<b>Touch</b> to line the ball up. <b>Pull back</b> and <b>let go</b> to roll: further is faster. Tilt the pull to angle it.',
  'Aim for the <b>pocket</b>: just beside the front pin. That is where strikes come from.',
  'Your ball decides how much it <b>curls</b>; the dry wood at the far end of the lane decides where. Watch the arrow.',
  'Two rolls a frame. Spare: +5. Strike: +10, and strikes in a row build a run.',
  'A <b>rival bowls on each lane beside you</b>, frame for frame. Finish ahead of <b>both</b> to win.',
  'Some levels are <b>spare challenges</b> (a split already standing) or <b>strike-outs</b>. A <b>golden pin</b> is worth coins.',
];
const LANE_W = 1.05, LANE_L = 18.29, BR = 0.109, PR = 0.06, HEAD_Z = 18.29 - 0.9;
// the ten pins: 1 at the front, rows behind it (spacing 0.3048 m)
const PINPOS = (() => { const P = [], s = 0.3048; let n = 1; for (let r = 0; r < 4; r++) for (let i = 0; i <= r; i++) P.push({ n: n++, x: (i - r / 2) * s, z: HEAD_Z + r * s * 0.866 }); return P; })();
const BALLS = [{ id: 'house', name: 'House ball', hook: 0, mass: 1, col: 0x3a6aff, col2: 0x9ab8ff, stars: 0 },
  { id: 'cherry', name: 'Cherry', hook: 0.35, mass: 1, col: 0xd81a3a, col2: 0xff8a9a, stars: 4 }, { id: 'galaxy', name: 'Galaxy', hook: 0.6, mass: 1.05, col: 0x2a1a6a, col2: 0xd08aff, stars: 10 },
  { id: 'lava', name: 'Lava', hook: 0.85, mass: 1.08, col: 0x2a0a0a, col2: 0xff6a1a, stars: 18 }, { id: 'marble', name: 'Marble', hook: 0.45, mass: 1.12, col: 0xeeeeee, col2: 0x8a8a9a, stars: 26 },
  { id: 'gold', name: 'Gold', hook: 0.7, mass: 1.15, col: 0xe8b830, col2: 0xfff0a0, stars: 40 }, { id: 'neon', name: 'Neon', hook: 1.0, mass: 1.08, col: 0x1ae0a0, col2: 0xff3ab0, stars: 55 }];
const PLACES = [{ name: 'Starlight Lanes', glow: 0x3ae0ff }, { name: 'Retro Bowl', glow: 0xff8a2a }, { name: 'Cosmic Night', glow: 0xb05aff }, { name: 'Gold Cup Arena', glow: 0xffd040 }];
const placeOf = N => Math.floor((N - 1) / 5) % PLACES.length;
const UPGRADES = [
  { id: 'line', name: 'Aim line', desc: 'A longer arrow down the lane.', max: 2, cost: l => 25 + l * 30 },
  { id: 'grip', name: 'Steady grip', desc: 'Your roll goes where you aim it, a little truer.', max: 3, cost: l => 20 + l * 25 },
  { id: 'power', name: 'Strong arm', desc: 'Faster rolls: pins fly harder.', max: 2, cost: l => 25 + l * 30 },
  { id: 'lucky', name: 'Lucky pins', desc: 'Golden pins come more often.', max: 2, cost: l => 20 + l * 25 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Rookie'], [40, 'League bowler'], [130, 'Pin crusher'], [320, 'Pro'], [700, 'Champion'], [1500, 'Perfect 300']];
function myBall() { if (typeof HEADLESS !== 'undefined' && HEADLESS) return BALLS[0]; const id = store.get('ball', 'house'); return BALLS.find(b => b.id === id) || BALLS[0]; }
function makeCfg(N, help) {
  const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), e = easyOf(N);
  const kind = N <= 3 ? 'game' : N % 5 === 4 ? 'spares' : N % 5 === 0 ? 'strikeout' : 'game';
  return { N, f, help: !!help, place: placeOf(N), kind,
    frames: kind === 'strikeout' ? 5 : kind === 'spares' ? 5 : 10,
    target: 0, oil: x(0.62, 0.78, 30), dry: x(1.0, 1.35, 30),
    wobble: x(0.012, 0.022, 30) * (1 - 0.18 * upLv('grip')) * (help ? 0.75 : 1), line: [0.42, 0.62, 0.8][upLv('line')] * (N <= 2 ? 1.6 : 1), power: 1 + 0.06 * upLv('power'),
    gold: (0.08 + 0.05 * upLv('lucky')), bumpers: false };
}
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, place: cfg.place,
    ball: o.ball || myBall(), frame: 0, roll: 0, score: 0, frames: [], run: 0, bestRun: 0, strikes: 0, spares: 0, coins: 0, phase: 'aim', b: null, pins: [], aim: { x: 0, a: 0, p: 0 }, wait: 0 };
  setTarget(G); setRivals(G); rack(G, true);
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else G.ev.push({ k: 'start' });
  return G;
}
function setTarget(G) { const c = G.cfg, f = c.frames, N = G.N, per = c.kind === 'spares' ? 0 : Math.min(25, 15.6 + N * 0.35); c.target = c.kind === 'spares' ? Math.max(2, Math.min(5, 1 + Math.floor((N + 1) / 6))) : c.kind === 'strikeout' ? Math.min(3, 1 + Math.floor(N / 10)) : Math.round(per * f); }
// 25 Nov 2026 (his review: "Should be playing against both players in this bowling plus it's honestly not challenging enough to be engaging").
// The two lanes either side were scenery. Now a rival bowls on each, frame for frame with you, and a game is won by finishing ahead of
// BOTH. Their frames are dealt when the level starts (from its seed) and scored exactly as yours are (the pins, +5 for a spare, +10 for
// a strike, runs multiply). One lands a little under what the level used to ask for and one over it: from level 4 on, the better of the
// two scores more than the old target did (2% to 10% more), so there is more to beat; on the first three levels a little less.
const RIVALS = ['Dee', 'Marco', 'Big Al', 'Yuki', 'Rosa', 'Tank', 'Lola', 'Vince', 'Ada', 'Kofi'];
function dealRival(seed, frames, want) { const play = sk => { const R = rng(seed); let run = 0, tot = 0; const out = [], mult = () => Math.min(3, 1 + 0.5 * (run - 1));
    for (let f = 0; f < frames; f++) { const a = R(), b = R(), c2 = R(), d = R(), ps = 0.06 + 0.66 * sk, pp = 0.22 + 0.6 * sk; let marks, pts;
      if (a < ps) { run++; pts = Math.round(20 * mult()); marks = ['X']; }
      else { const n1 = Math.min(9, 3 + Math.floor(c2 * 4 + sk * 3.5)); if (b < pp) { run++; pts = n1 + Math.round((10 - n1 + 5) * mult()); marks = [n1, '/']; } else { run = 0; const n2 = Math.min(9 - n1, Math.floor(d * (10 - n1))); pts = n1 + n2; marks = [n1, n2]; } }
      out.push({ marks, pts, tot: tot += pts }); } return out; };
  let lo = 0, hi = 1; for (let i = 0; i < 14; i++) { const mid = (lo + hi) / 2; if (play(mid)[frames - 1].tot < want) lo = mid; else hi = mid; } return play(hi); }
function setRivals(G) { const c = G.cfg; G.rivals = null; if (c.kind !== 'game') return; const R = rng(G.seed * 7 + 31), top = c.target * (G.N <= 3 ? 0.87 + 0.07 * R() : 1.02 + 0.08 * R()), low = top * (0.8 + 0.12 * R()), names = RIVALS.slice().sort(() => R() - 0.5), left = R() < 0.5;
  G.rivals = [{ name: names[0], frames: dealRival(G.seed + 11, c.frames, left ? top : low) }, { name: names[1], frames: dealRival(G.seed + 23, c.frames, left ? low : top) }];
  c.target = Math.max(G.rivals[0].frames[c.frames - 1].tot, G.rivals[1].frames[c.frames - 1].tot); }
// a rival's score after the frames you have finished (they bowl each frame while you do)
const rivalNow = (G, i) => { const k2 = Math.min(G.cfg.frames, G.frames.length); return k2 > 0 ? G.rivals[i].frames[k2 - 1].tot : 0; };
// a fresh rack (or, in a spare challenge, a leave)
function rack(G, fresh) { const R = G.rnd, c = G.cfg; G.pins = PINPOS.map(p => ({ n: p.n, x: p.x, z: p.z, vx: 0, vz: 0, up: true, gone: false, fall: 0, gold: false }));
  if (c.kind === 'spares' && !G.lesson) { const LEAVES = [[7, 10], [4, 6], [6, 7, 10], [2, 7], [3, 10], [5, 7], [4, 7, 10], [8, 10], [1, 2, 4, 7], [3, 6, 10], [2, 4, 5, 8]], L = LEAVES[(R() * LEAVES.length) | 0]; for (const p of G.pins) if (!L.includes(p.n)) { p.up = false; p.gone = true; } G.roll = 1; G.leave = true; }
  if (R() < c.gold) { const up = G.pins.filter(p => p.up); up[(R() * up.length) | 0].gold = true; } }
// ---------- your thumb ----------
// x: where along the foul line (-0.42..0.42); a: the angle (radians, + to the right); p: power 0..1. Rolls when p > 0.2.
function setAim(G, x, a, p) { if (G.phase !== 'aim') return; G.aim = { x: clamp(x, -0.42, 0.42), a: clamp(a, -0.09, 0.09), p: clamp(p, 0, 1) }; }
function bowl(G) { if (G.phase !== 'aim' || G.over || G.wait > 0) return false; const a = G.aim, c = G.cfg; if (a.p < 0.2) return false; const R = G.rnd, w = (R() + R() + R() - 1.5) * c.wobble * 1.4;
  const v = (5.4 + a.p * 4.2) * c.power, ang = a.a + w; G.b = { x: a.x, z: 0, vx: Math.sin(ang) * v, vz: Math.cos(ang) * v, hook: G.ball.hook * (a.x > 0.05 ? 1 : a.x < -0.05 ? -1 : (a.a >= 0 ? -1 : 1)) * -1, gutter: false, spin: 0, mass: 6.4 * G.ball.mass };
  G.phase = 'roll'; G.rollT = 0; G.ev.push({ k: 'bowl', v }); return true; }
// ---------- the lane ----------
function step(G, dt) {
  if (G.over) return; G.t += dt; const c = G.cfg;
  if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0) { if (G.lessonEnd) { G.lessonEnd = false; Object.assign(G, { frame: 0, roll: 0, score: 0, frames: [], run: 0, bestRun: 0, strikes: 0, spares: 0, coins: 0, leave: false }); rack(G, true); G.phase = 'aim'; G.ev.push({ k: 'start' }); } else if (G.next) { const nx = G.next; G.next = null; nx(); } } return; }
  if (G.phase !== 'roll') return;
  G.rollT += dt; const n = 6, h = dt / n;
  for (let s = 0; s < n; s++) { sim(G, h); }
  // done when everything has stopped (or the ball is in the pit and the pins settle)
  const b = G.b, moving = G.pins.some(p => !p.gone && Math.hypot(p.vx, p.vz) > 0.05);
  if ((b.z > LANE_L + 0.6 || b.stopped) && !moving && (G.settle = (G.settle || 0) + dt) > 0.9) { G.settle = 0; endRoll(G); }
  else if (G.rollT > 9) endRoll(G);
}
function sim(G, h) {
  const b = G.b, c = G.cfg;
  if (!b.stopped && b.z <= LANE_L + 0.6) {
    // the curl: on the oiled part the ball skids straight; past the oil it grabs and turns
    const u = b.z / LANE_L; if (!b.gutter && u > c.oil) b.vx += b.hook * c.dry * 1.25 * h * Math.min(1, (u - c.oil) / 0.15);
    b.x += b.vx * h; b.z += b.vz * h; b.vz *= 1 - 0.012 * h;
    if (!b.gutter && Math.abs(b.x) > LANE_W / 2 - BR * 0.3) { if (c.bumpers) { b.x = Math.sign(b.x) * (LANE_W / 2 - BR * 0.3); b.vx = -b.vx * 0.6; G.ev.push({ k: 'bumper' }); } else { b.gutter = true; b.x = Math.sign(b.x) * (LANE_W / 2 + 0.1); b.vx = 0; if (b.z < HEAD_Z - 0.25) G.ev.push({ k: 'gutter' }); } }
    if (b.z > LANE_L + 0.6) { b.stopped = true; G.ev.push({ k: 'pit' }); } }
  // the pins: hit by the ball, by each other, they slide and fall
  for (const p of G.pins) { if (p.gone) continue;
    if (!b.gutter && !b.stopped) { const dx = p.x - b.x, dz = p.z - b.z, d = Math.hypot(dx, dz), m = BR + PR; if (d < m && d > 1e-6) { const nx = dx / d, nz = dz / d, rv = (b.vx - p.vx) * nx + (b.vz - p.vz) * nz; if (rv > 0) { const mb = b.mass, mp = 1.5, j = (1 + 0.75) * rv / (1 / mb + 1 / mp);
          b.vx -= j / mb * nx; b.vz -= j / mb * nz; p.vx += j / mp * nx + (G.rnd() - 0.5) * 0.25; p.vz += j / mp * nz; knock(G, p, rv); } p.x = b.x + nx * m; p.z = b.z + nz * m; } } }
  for (let i = 0; i < G.pins.length; i++) { const p = G.pins[i]; if (p.gone) continue; for (let j = i + 1; j < G.pins.length; j++) { const q = G.pins[j]; if (q.gone) continue; const dx = q.x - p.x, dz = q.z - p.z, d = Math.hypot(dx, dz), m = PR * 2 + (p.up ? 0 : 0.12) + (q.up ? 0 : 0.12);
      if (d < m && d > 1e-6) { const nx = dx / d, nz = dz / d, rv = (p.vx - q.vx) * nx + (p.vz - q.vz) * nz; if (rv > 0) { const j2 = (1 + 0.6) * rv / 2; p.vx -= j2 * nx; p.vz -= j2 * nz; q.vx += j2 * nx; q.vz += j2 * nz; if (rv > 0.5) { knock(G, p, rv); knock(G, q, rv); } } const ov = (m - d) / 2; p.x -= nx * ov; p.z -= nz * ov; q.x += nx * ov; q.z += nz * ov; } } }
  for (const p of G.pins) { if (p.gone) continue; p.x += p.vx * h; p.z += p.vz * h; const fr = p.up ? 6 : 2.2; p.vx *= Math.max(0, 1 - fr * h); p.vz *= Math.max(0, 1 - fr * h); if (!p.up) p.fall = Math.min(1, p.fall + h * 4);
    if (Math.abs(p.x) > LANE_W / 2 + 0.05 || p.z > LANE_L + 1.2) { if (p.up) knock(G, p, 1); p.gone = true; } }
}
function knock(G, p, v) { if (!p.up || v < 0.5) return; p.up = false; p.downT = G.rollT; G.ev.push({ k: 'pin', n: p.n, v, gold: p.gold }); }
function endRoll(G) {
  const c = G.cfg, down = G.pins.filter(p => !p.up && !p.counted), upLeft = G.pins.filter(p => p.up); down.forEach(p => p.counted = true);
  const n = down.length, first = G.roll === 0, all = upLeft.length === 0, gold = down.some(p => p.gold);
  let pts = n, kind = 'roll';
  if (all && first) { kind = 'strike'; G.strikes++; G.run++; pts += 10; } else if (all) { kind = 'spare'; G.spares++; G.run++; pts += 5; } else if (!first || c.kind === 'strikeout') G.run = 0;
  if (kind !== 'roll') pts *= Math.min(3, 1 + 0.5 * (G.run - 1));      // strikes and spares in a row: x1.5, x2, x2.5, x3
  pts = Math.round(pts); G.bestRun = Math.max(G.bestRun, G.run); if (gold) G.coins += 5; if (kind === 'strike') G.coins += 2; if (kind === 'spare') G.coins += 1;
  if (!G.lesson) G.score += c.kind === 'spares' ? (kind === 'spare' ? 1 : 0) : c.kind === 'strikeout' ? (kind === 'strike' ? 1 : 0) : pts;
  G.ev.push({ k: 'result', kind, n, pts, gold, gutter: G.b.gutter, split: isSplit(G), leave: upLeft.map(p => p.n) });
  lessonResult(G, kind, n, upLeft);
  G.phase = 'show'; G.wait = 1.6;
  G.cur = (G.cur || []).concat([kind === 'strike' ? 'X' : kind === 'spare' ? '/' : n]);
  const nextFrame = () => { if (!G.lesson) { G.frames.push(G.cur); G.frame++; if (G.frame >= c.frames || mustLose(G)) return finish(G); } G.cur = []; G.roll = 0; G.leave = false; rack(G, true); G.phase = 'aim'; G.ev.push({ k: 'frame', f: G.frame }); };
  if (all || G.roll === 1 || c.kind === 'strikeout') { G.next = nextFrame; }
  else { G.next = () => { G.roll = 1; for (const p of G.pins) if (!p.up) p.gone = true; G.phase = 'aim'; G.ev.push({ k: 'second' }); }; }
}
// the target can no longer be reached: say so straight away
function mustLose(G) { const c = G.cfg, left = c.frames - G.frame; if (c.kind === 'spares' || c.kind === 'strikeout') return G.score + left < c.target; return G.score + left * 40 < c.target; }
function isSplit(G) { const up = G.pins.filter(p => p.up); if (up.length < 2 || G.pins.find(p => p.n === 1).up) return false; up.sort((a, b) => a.x - b.x); for (let i = 1; i < up.length; i++) if (up[i].x - up[i - 1].x > 0.4) return true; return false; }
function finish(G) { const c = G.cfg, win = G.score >= c.target; G.over = win ? 'won' : 'lost';
  const stars = win ? (G.score >= c.target * 1.4 || (c.kind !== 'game' && G.score >= c.target + 1) ? 3 : G.score >= c.target * 1.15 ? 2 : 1) : 0;
  G.res = { win, stars, score: G.score, target: c.target, kind: c.kind, rivals: G.rivals ? G.rivals.map(r => ({ name: r.name, tot: r.frames[c.frames - 1].tot })) : null, strikes: G.strikes, spares: G.spares, bestRun: G.bestRun, frames: G.frames, coins: G.coins + (win ? 4 + Math.ceil(G.N / 3) : 0) };
  G.ev.push({ k: win ? 'won' : 'lost' }); return true; }
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'roll', title: 'ROLL', say: 'PULL BACK, LET GO', do: 'drag', dir: 'down', how: 'Touch to line the ball up, pull back toward you and let go. Knock down 6 pins or more, twice in a row.', need: 2 }],
  2: [{ id: 'pocket', title: 'THE POCKET', say: 'AIM BESIDE THE FRONT PIN', do: 'drag', dir: 'down', how: 'Roll just beside the front pin, not straight at it. Get a strike, or 9 pins.', need: 1 }],
  3: [{ id: 'spare', title: 'A SPARE', say: 'HIT WHAT IS LEFT', do: 'drag', dir: 'down', how: 'Knock down what is left with your second ball. Aim at the middle of the pins still standing.', need: 1 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonResult(G, kind, n, upLeft) { const st = lessonNow(G); if (!st) return; let ok = null;
  if (st.id === 'roll') ok = n >= 6; if (st.id === 'pocket') ok = kind === 'strike' || (G.roll === 0 && n >= 9) ? true : (G.roll === 0 ? false : null);
  if (st.id === 'spare') ok = G.roll === 1 ? kind === 'spare' : null;
  if (ok === null) return; if (!ok) { G.lesson.n = 0; G.ev.push({ k: 'lessonmiss', how: st.how }); return; }
  G.lesson.n++; if (G.lesson.n < st.need) { G.ev.push({ k: 'lessonok', n: G.lesson.n, need: st.need }); return; }
  G.lesson.i++; G.lesson.n = 0; if (G.lesson.i >= G.lesson.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.lessonEnd = true; } }
// ---------- for the robots ----------
// BLIND: a thumb that does not look: a pull of some length and some tilt from somewhere, let go
const BLIND = { b: G => { const R = Math.random; setAim(G, (R() - 0.5) * 0.84, (R() - 0.5) * 0.18, 0.2 + R() * 0.8); bowl(G); } };
// where a roll from x at angle a would cross the head pin's line (no pins in the way): the bowler's eye down the lane
function landX(G, x, a, p) { const c = G.cfg, v = (5.4 + p * 4.2) * c.power, hook = G.ball.hook * (x > 0.05 ? 1 : x < -0.05 ? -1 : (a >= 0 ? -1 : 1)) * -1; let bx = x, bz = 0, vx = Math.sin(a) * v, vz = Math.cos(a) * v; const h = 1 / 120;
  while (bz < HEAD_Z) { const u = bz / LANE_L; if (u > c.oil) vx += hook * c.dry * 1.25 * h * Math.min(1, (u - c.oil) / 0.15); bx += vx * h; bz += vz * h; vz *= 1 - 0.012 * h; if (Math.abs(bx) > LANE_W / 2) return 99; } return bx; }
// a bowler who looks: picks the spot (the pocket for a full rack, the middle of what stands for a spare), finds the line from
// a lane position by eye, and rolls it, a little off as a hand is
function honest(G, o, mem) {
  const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random;
  if (G.over || G.wait > 0 || G.phase !== 'aim') { mem.t0 = null; return; }
  if (mem.t0 == null) { mem.t0 = G.t + 0.6 + react; return; } if (G.t < mem.t0) return;
  const up = G.pins.filter(p => p.up); let tx;
  if (up.length === 10) tx = (G.ball.hook > 0.2 ? 0.065 : 0.06) * (R() < 0.5 ? 1 : -1);      // the pocket, either side of the head pin
  else { const xs = up.map(p => p.x), zs = up.map(p => p.z); const front = up.reduce((a, b) => a.z < b.z ? a : b); tx = up.length === 1 ? front.x : (Math.min(...xs) + Math.max(...xs)) / 2 * 0.5 + front.x * 0.5; }
  const p = 0.75 + R() * 0.2, xs = [-0.3, -0.15, 0, 0.15, 0.3]; let best = null, bd = 1e9;
  for (const x of xs) for (let a = -0.08; a <= 0.08; a += 0.004) { const lx = landX(G, x, a, p), d = Math.abs(lx - tx); if (d < bd) { bd = d; best = { x, a }; } }
  const err = (R() < acc ? 0.35 : 1.4) * (R() * 2 - 1) * (0.004 + react * 0.012);
  setAim(G, best.x + (R() - 0.5) * 0.02, best.a + err, p); bowl(G); mem.t0 = null;
}
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.score = G.cfg.target; finish(G); }
