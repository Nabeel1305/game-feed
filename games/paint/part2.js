
// ===================== RULES: Paint Drop (game 62, set 11: "the game where you take colours and mash them together") =====================
// A glass jar. Slide your thumb to move the next paint blob along the top; let go to drop it. Blobs fall, roll and stack. Two
// blobs of the same colour that touch squash together into ONE blob of the next colour, a size bigger (red, orange, yellow,
// lime, green, teal, sky, blue, violet, pink, then a RAINBOW; two rainbows make a masterpiece and vanish). A squash can set off
// another (a chain). Each level asks for a colour: make it before your paint runs out, and do not let the jar overflow: a blob
// that stays above the dashed line for too long ends it. Later: bigger goals, grey STONES that never squash (a squash right
// beside one cracks it away), a narrower jar.
const RULES = [
  '<b>Slide</b> to move the blob along the top, <b>let go</b> to drop it.',
  'Two blobs of the <b>same colour</b> that touch squash into the <b>next colour</b>, a size bigger. Squashes can chain!',
  'Make the colour the level asks for before your <b>paint runs out</b>.',
  'Keep the jar under the <b>dashed line</b>: a blob that stays above it too long ends it.',
  'Grey <b>stones</b> never squash; a squash right beside one cracks it away.',
];
const TIERS = [
  { n: 'Red', c: '#ff4a4a', r: 0.42 }, { n: 'Orange', c: '#ff9a2a', r: 0.55 }, { n: 'Yellow', c: '#ffd83a', r: 0.71 }, { n: 'Lime', c: '#b8e83a', r: 0.87 },
  { n: 'Green', c: '#3ac85a', r: 1.04 }, { n: 'Teal', c: '#2ac8b8', r: 1.22 }, { n: 'Sky', c: '#4ab8ff', r: 1.42 }, { n: 'Blue', c: '#3a6aff', r: 1.64 },
  { n: 'Violet', c: '#9a5aff', r: 1.88 }, { n: 'Pink', c: '#ff6ac8', r: 2.14 }, { n: 'Rainbow', c: '#ffffff', r: 2.44 } ];
const PLACES = [{ name: 'The Studio', wall: ['#ffd9a8', '#ffb07a'] }, { name: 'The Gallery', wall: ['#bcd4ff', '#8fb0f2'] }, { name: 'The Workshop', wall: ['#cdeeb8', '#9dd484'] }, { name: 'The Attic', wall: ['#f9c6e2', '#e09acb'] }];
const placeOf = N => Math.floor((N - 1) / 6) % 4;
const UPGRADES = [
  { id: 'paint', name: 'More paint', desc: 'Four more drops on every level.', max: 2, cost: l => 40 + l * 50 },
  { id: 'wide', name: 'Wider jar', desc: 'The jar is a little wider.', max: 1, cost: l => 80 },
  { id: 'shake', name: 'Shake', desc: 'Once a level: shake the jar to settle it.', max: 1, cost: l => 60 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Dabbler'], [40, 'Painter'], [130, 'Colourist'], [320, 'Artist'], [700, 'Master'], [1500, 'Old master']];
const GRAV = 30, WET = 1.2, DRYN = 6;      /* wet: seconds a blob stays wet after it is dropped or made; the palette holds six drops */      /* how long a blob stays wet after it is dropped or made */
function makeCfg(N, help) { const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), e = easyOf(N);
  const goal = N <= 9 ? 6 : 7, jw = (N <= 4 ? 10.5 : 10.5 - Math.min(1.1, f / 35)) + 0.6 * upLv('wide') + (help ? 0.5 : 0), par = goal === 6 ? 56 : 96;
  return { N, f, help: !!help, place: placeOf(N), goal, spawnTop: N <= 9 ? 3 : 4, jw, line: jw - 1.3, stones: N >= 6 ? x(0.03, 0.1, 30) : 0, par,
    drops: Math.round(par * 1.6) + 4 * upLv('paint'), dry: DRYN + (help ? 1 : 0), shake: upLv('shake') }; }
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, place: cfg.place, wait: 0, next: null };
  setup(G); if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else G.ev.push({ k: 'start' });
  return G; }
let BID = 1;
function setup(G, o = {}) { const c = G.cfg; G.jw = c.jw; G.b = []; G.aim = G.jw / 2; G.cool = 0; G.queue = []; G.drops = o.drops != null ? o.drops : c.drops; G.line = c.line; G.dropsMax = G.drops; G.best = 0; G.score = 0; G.danger = 0; G.chain = 0; G.chainT = 0; G.done = false; G.shakes = c.shake; G.merges = 0; G.idle = 0; G.made = 0; G.dry = 0; G.dropped = false; G.sqSince = false;
  G.rig = o.rig || null; for (let i = 0; i < 2; i++) G.queue.push(pickTier(G)); }
function pickTier(G) { if (G.rig && G.rig.length) return G.rig.shift(); const c = G.cfg;
  if (c.stones && G.rnd() < c.stones && G.b.length > 4) return -1;
  const last = G.queue.length ? G.queue[G.queue.length - 1] : -9, roll = () => { const w = [0.34, 0.3, 0.22, 0.14, 0.09].slice(0, c.spawnTop + 1), s = w.reduce((a, b) => a + b, 0); let r = G.rnd() * s; for (let t = 0; t < w.length; t++) { r -= w[t]; if (r <= 0) return t; } return 0; };
  let t = roll(); if (t === last) t = roll(); return t; }      /* the same colour twice in a row only rarely: dropping in one spot over and over must not work */
const radOf = t => t < 0 ? 0.62 : TIERS[t].r;
// ---------- what you do ----------
function aimAt(G, x) { const r = radOf(G.queue[0]); G.aim = clamp(x, r, G.jw - r); }
function drop(G) { if (G.over || G.wait > 0 || G.cool > 0 || G.done || G.drops <= 0) return false; if (G.lesson && G.lesson.dropAt != null) return false;      /* in a lesson, one drop at a time: it is judged first */ const t = G.queue.shift(); G.queue.push(pickTier(G)); const r = radOf(t);
  G.b.push({ id: BID++, t, x: clamp(G.aim, r, G.jw - r), y: G.line + 1.2, vx: 0, vy: -2, r, age: 0, sq: 0, wet: WET }); G.drops--; G.cool = 0.85; G.idle = 0;
  // the palette: a drop that led to no squash dries one of its drops; a squash refills it; all dry and the paint is finished
  if (G.dropped && !G.sqSince && !G.lesson) { G.dry++; G.ev.push({ k: 'dry', n: G.dry, of: G.cfg.dry }); if (G.dry >= G.cfg.dry) { G.ev.push({ k: 'dried' }); G.wait = 1.2; G.next = () => finish(G, false, 'dried'); } }
  G.dropped = true; G.sqSince = false; G.ev.push({ k: 'drop', t }); aimAt(G, G.aim); if (G.lesson) { const id = lessonNow(G).id; if (id === 'aim' || id === 'chain') G.lesson.dropAt = G.t; lessonSee(G, 'drop'); } return true; }
function shake(G) { if (G.shakes <= 0 || G.over || G.done) return false; G.shakes--; for (const b of G.b) { b.vy += 6 + G.rnd() * 4; b.vx += (G.rnd() - 0.5) * 6; } G.ev.push({ k: 'shake' }); return true; }
// ---------- the physics: circles under gravity in a jar, pushed apart, squashing when they match ----------
function physics(G, dt) { const B = G.b, jw = G.jw, merges = [];
  for (const b of B) { b.vy -= GRAV * dt; b.vx *= 0.999; b.x += b.vx * dt; b.y += b.vy * dt; b.age += dt; b.sq = Math.max(0, b.sq - dt * 4); if (b.wet > 0) b.wet -= dt; }
  for (let it = 0; it < 3; it++) {
    for (let i = 0; i < B.length; i++) { const a = B[i]; for (let j = i + 1; j < B.length; j++) { const b = B[j]; const dx = b.x - a.x, dy = b.y - a.y, rr = a.r + b.r; if (Math.abs(dx) > rr || Math.abs(dy) > rr) continue; const d2 = dx * dx + dy * dy; if (d2 >= rr * rr) continue;
        const d = Math.sqrt(d2) || 1e-4, nx = dx / d, ny = dy / d, ov = rr - d, ma = a.r * a.r, mb = b.r * b.r, s = ma + mb;
        if (a.t === b.t && a.t >= 0 && !a.gone && !b.gone && (a.wet > 0 || b.wet > 0)) { merges.push([a, b]); a.gone = b.gone = true; continue; }      /* wet paint squashes; two dry blobs do not */
        a.x -= nx * ov * mb / s; a.y -= ny * ov * mb / s; b.x += nx * ov * ma / s; b.y += ny * ov * ma / s;
        const vn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny; if (vn < 0) { const jn = -(1.15) * vn / (1 / ma + 1 / mb); a.vx -= jn * nx / ma; a.vy -= jn * ny / ma; b.vx += jn * nx / mb; b.vy += jn * ny / mb; if (-vn > 3) { a.sq = b.sq = Math.min(1, -vn / 12); } }
        const tx = -ny, ty = nx, vt = (b.vx - a.vx) * tx + (b.vy - a.vy) * ty, f = vt * 0.06; a.vx += tx * f; a.vy += ty * f; b.vx -= tx * f; b.vy -= ty * f; } }
    for (const b of B) { if (b.x < b.r) { b.x = b.r; if (b.vx < 0) b.vx *= -0.2; } if (b.x > jw - b.r) { b.x = jw - b.r; if (b.vx > 0) b.vx *= -0.2; } if (b.y < b.r) { if (b.vy < -4) b.sq = Math.min(1, -b.vy / 14); b.y = b.r; if (b.vy < 0) b.vy *= -0.15; b.vx *= 0.97; } } }
  for (const [a, b] of merges) squash(G, a, b); if (merges.length) G.b = G.b.filter(b => !b.gone); }
function squash(G, a, b) { const t = a.t + 1, x = (a.x * a.r * a.r + b.x * b.r * b.r) / (a.r * a.r + b.r * b.r), y = (a.y + b.y) / 2, vx = (a.vx + b.vx) / 2, vy = (a.vy + b.vy) / 2 + 2;
  G.sqSince = true; if (G.dry) G.ev.push({ k: 'refill' }); G.dry = 0;
  G.chain = G.chainT > 0 ? G.chain + 1 : 1; G.chainT = 0.9; G.merges++; const pts = (t + 1) * (t + 2) / 2 * 10 * G.chain; G.score += pts;
  if (t > 10) { G.ev.push({ k: 'masterpiece', x, y }); G.score += 2000; return; }
  const nb = { id: BID++, t, x, y, vx, vy, r: TIERS[t].r, age: 1, sq: 1, wet: WET }; nb.x = clamp(nb.x, nb.r, G.jw - nb.r); nb.y = Math.max(nb.r, nb.y); G.b.push(nb);
  // stones right beside a squash crack away
  for (const s of G.b) if (s.t < 0 && !s.gone && Math.hypot(s.x - x, s.y - y) < nb.r + s.r + 0.35) { s.gone = true; G.ev.push({ k: 'crack', x: s.x, y: s.y }); }
  G.best = Math.max(G.best, t); G.made = Math.max(G.made, t); G.ev.push({ k: 'squash', t, x, y, chain: G.chain, pts, from: a.t }); lessonSee(G, 'squash', t); }
function step(G, dt) { if (G.over || !(dt > 0)) return; G.t += dt;
  if (G.wait > 0) { G.wait -= dt; physicsSteps(G, dt); if (G.wait <= 0) { G.wait = 0; const f = G.next; G.next = null; if (f) f(); } return; }
  G.cool = Math.max(0, G.cool - dt); G.chainT = Math.max(0, G.chainT - dt); G.idle += dt; physicsSteps(G, dt);
  // the line: a blob resting above it too long ends it
  const over = G.b.some(b => b.age > 1.2 && b.y + b.r > G.line && Math.abs(b.vy) < 3); G.danger = over ? G.danger + dt : Math.max(0, G.danger - dt * 2);
  if (G.danger > 0 && !G.warned) { G.warned = true; G.ev.push({ k: 'warn' }); } if (!G.danger) G.warned = false;
  if (G.lesson) { if (G.danger >= 2.5) { G.danger = 0; lessonMiss(G); } lessonSee(G, 'tick'); return; }
  if (G.danger >= 2.5) { G.ev.push({ k: 'spill' }); G.wait = 1.2; G.next = () => finish(G, false, 'spill'); return; }
  if (!G.done && G.made >= G.cfg.goal) { G.done = true; G.ev.push({ k: 'goal', t: G.made }); G.wait = 1.4; G.next = () => finish(G, true); return; }
  if (G.drops <= 0 && G.idle > 2.2) { G.ev.push({ k: 'empty' }); G.wait = 0.8; G.next = () => finish(G, false, 'paint'); } }
function physicsSteps(G, dt) { const n = 6; for (let i = 0; i < n; i++) physics(G, dt / n); }
function finish(G, win, why) { if (G.over) return true; G.over = win ? 'won' : 'lost'; const left = G.drops, mx = G.dropsMax;
  const stars = win ? 1 + (left >= mx * 0.3 ? 1 : 0) + (left >= mx * 0.42 ? 1 : 0) : 0;
  G.res = { win, why, stars, score: G.score, left, best: G.best, goal: G.cfg.goal, merges: G.merges, coins: win ? 4 + Math.ceil(G.N / 3) + stars * 2 : 1 + G.best };
  G.ev.push({ k: win ? 'won' : 'lost', why }); return true; }
// ---------- LESSONS ----------
// lesson 1 asks for aim: drop each red right onto the red in the jar, four in a row (a drop that does not squash on landing
// starts the count again), so it cannot be passed by luck
const LESSONS = {
  1: [{ id: 'aim', title: 'SAME COLOURS SQUASH', how: 'Slide to aim, let go to drop. Drop the red right onto the red in the jar: they squash into an ORANGE! Four in a row.', need: 4 }],
  2: [{ id: 'chain', title: 'CHAINS', how: 'Drop the red on the red: it makes an orange, which squashes into the orange beside it. Make a YELLOW in one drop, three times.', need: 3 }],
  3: [{ id: 'line', title: 'MIND THE LINE', how: 'The jar is getting full. Keep everything under the dashed line: squash blobs to make room. Drop twelve blobs safely.', need: 12 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonDeal(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonDeal(G, keepN) { const st = lessonNow(G), R0 = G.rnd; if (!keepN) G.lesson.n = 0; G.lesson.dropAt = null;
  if (st.id === 'aim') { setup(G, { drops: 99, rig: Array(40).fill(0) }); const x = 1 + R0() * (G.jw - 2); G.b.push({ id: BID++, t: 0, x, y: 0.42, vx: 0, vy: 0, r: 0.42, age: 5, sq: 0, target: true }); }
  if (st.id === 'chain') { setup(G, { drops: 99, rig: Array(40).fill(0) }); const x = 1.6 + R0() * (G.jw - 3.2), s = R0() < 0.5 ? 1 : -1; G.b.push({ id: BID++, t: 1, x: x + s * 0.97, y: 0.55, vx: 0, vy: 0, r: 0.55, age: 5, sq: 0 }); G.b.push({ id: BID++, t: 0, x, y: 0.42, vx: 0, vy: 0, r: 0.42, age: 5, sq: 0, target: true }); }
  if (st.id === 'line') { setup(G, { drops: 99 }); const R = rng(G.seed + 5); for (let k = 0; k < 18; k++) { const t = (R() * 4) | 0; G.b.push({ id: BID++, t, x: 0.8 + R() * (G.jw - 1.6), y: 1 + k * 0.5, vx: 0, vy: 0, r: TIERS[t].r, age: 5, sq: 0 }); } }
  G.ev.push({ k: 'lessondeal' }); }
function lessonMiss(G) { const st = lessonNow(G); G.ev.push({ k: 'lessonmiss', how: st.how }); G.wait = 1.3; G.next = () => lessonDeal(G); }
function lessonSee(G, what, t) { const st = lessonNow(G); if (!st || G.wait > 0) return; const D = G.lesson;
  if ((st.id === 'aim' || st.id === 'chain') && what === 'tick' && D.dropAt != null) { const want = st.id === 'aim' ? 1 : 2;
    if (G.made >= want && !G.b.some(b => b.target)) { D.dropAt = null; D.n++; G.ev.push({ k: 'lessonok', n: D.n, need: st.need }); if (D.n >= st.need) { G.wait = 1.0; G.next = done; return; } G.wait = 0.8; G.next = () => lessonDeal(G, true); return; }
    if (G.t - D.dropAt > 1.6) { D.dropAt = null; D.n = 0; G.ev.push({ k: 'lessonmiss', how: st.how }); G.wait = 1.1; G.next = () => lessonDeal(G, true); } return; }
  if (st.id === 'line' && what === 'drop') { D.n++; G.ev.push({ k: 'lessonok', n: D.n, need: st.need, quiet: true }); if (D.n >= st.need) { G.wait = 1.4; G.next = done; } return; }
  function done() { D.i++; if (D.i >= D.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.wait = 1.6; G.next = () => { G.rnd = rng(G.seed); setup(G); G.ev.push({ k: 'start' }); }; } else { G.wait = 1.2; G.next = () => lessonDeal(G); } } }
// ---------- for the robots ----------
// BLIND: a thumb that does not look: drop where it is; slide somewhere and drop; nudge left or right
const BLIND = { d: G => drop(G), m: G => aimAt(G, Math.random() * G.jw), l: G => aimAt(G, G.aim - 1.2), r: G => aimAt(G, G.aim + 1.2) };
// a player who looks: for the blob in hand, tries places along the top and judges where it would land (on a blob of its own
// colour is best, beside one good; landing high, or on a smaller blob, bad), then drops a little off where it meant to
function landing(G, x, r) { let top = r, hit = null; for (const b of G.b) { const dx = Math.abs(b.x - x); if (dx >= b.r + r) continue; const y = b.y + Math.sqrt((b.r + r) ** 2 - dx * dx); if (y > top) { top = y; hit = b; } } return { y: top, hit }; }
function honest(G, o, mem) { const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random;
  if (G.over || G.wait > 0 || G.cool > 0) return; mem.t = (mem.t || 0) + 1 / 60; if (mem.t < 0.35 + react * 1.6) return; mem.t = 0;
  const t = G.queue[0], r = radOf(t), top = Math.max(1, G.cfg.goal); let best = G.jw / 2, bv = -1e9;
  for (let k = 0; k <= 30; k++) { const x = r + (G.jw - 2 * r) * k / 30, L = landing(G, x, r); let v = -L.y * 1.5;
    if (t < 0) { v -= Math.min(x, G.jw - x) * 2; }      /* stones go to a wall */
    else { if (L.hit) { if (L.hit.t === t) v += 30 + 3 * t; else if (L.hit.t >= 0 && L.hit.t < t) v -= 6 + 2 * (t - L.hit.t); else if (L.hit.t > t) v -= 1.5 * (L.hit.t - t); }
      for (const b of G.b) { if (b === L.hit) continue; const d = Math.hypot(b.x - x, b.y - L.y) - b.r - r; if (d < 0.5) { if (b.t === t) v += 18; else if (b.t === t + 1) v += 4; } }
      v -= Math.abs(x - G.jw * (1 - Math.min(1, t / top)) ) * 0.5; }      /* big ones to the left, small ones to the right */
    v += gs(R) * (1 - acc) * 10; if (v > bv) { bv = v; best = x; } }
  aimAt(G, best + gs(R) * (1 - acc) * 0.5); drop(G); }
const gs = R => { let s = 0; for (let i = 0; i < 4; i++) s += R(); return (s - 2) / 0.577; };
function winNow(G) { if (!G || G.over || G.wait > 0) return; G.lesson = null; G.made = G.cfg.goal; finish(G, true); }
