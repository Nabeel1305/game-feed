// ===================== THE RULES: Timber (my idea for set 16, 21 Nov 2026) =====================
// A logger in a forest clearing drops trees, one at a time, into the open strip marked for them, the way real fellers do: a
// NOTCH on the side it should fall to (it aims the fall), then the BACK CUT from the other side, stopping before the end so a
// strip of wood, the HINGE, steers the tree down. Too thin a hinge (or none) and the tree twists where its lean and the wind
// take it; too thick and it just stands there: tap in a WEDGE to tip it. A lean pulls it sideways, gusts push, a hiker may be
// on the path, and there is a cabin, a fence, a truck or a power pole to miss. A tree outside the strip or on something costs
// a chance, and you fell that tree again at once.
const RULES = [
  '<b>Drag</b> across the picture to turn the <b>felling line</b> toward the open strip.',
  '<b>Hold NOTCH</b>: the notch faces where it will fall. About a third of the trunk is right (the ring shows it).',
  '<b>Hold SAW</b> for the back cut and <b>let go before the end</b>: the wood left (the HINGE, green on the ring) steers the tree.',
  'Still standing? <b>Tap WEDGE</b> to tip it over. Cut through the hinge and it falls where it likes.',
  'A <b>lean</b> pulls it sideways (aim a little against it); <b>gusts</b> push it; wait for the <b>hiker</b> to pass.',
  'Every tree in the strip to finish. A miss, or a hit on something, costs a chance; you fell that tree again.',
];
const KINDS = {
  pine: { name: 'Pine', lv: 1, h: [14, 22], d: [0.45, 0.7], crown: 1.5, rate: 1, col: 0x2f6a3a },
  oak: { name: 'Oak', lv: 4, h: [13, 18], d: [0.7, 1.0], crown: 2.8, rate: 0.85, lean: 1.4, col: 0x4a7a30 },
  birch: { name: 'Birch', lv: 7, h: [15, 21], d: [0.3, 0.45], crown: 1.6, rate: 1.35, col: 0x8ab04a },
  snag: { name: 'Dead snag', lv: 10, h: [14, 20], d: [0.5, 0.75], crown: 0.8, rate: 1.1, brittle: 0.16, col: 0x6a5a48 },
  giant: { name: 'Giant fir', lv: 13, h: [26, 32], d: [1.1, 1.4], crown: 2.2, rate: 0.6, col: 0x245a34 },
};
const HAZ = { cabin: { name: 'the cabin', r: 2.2, lv: 2 }, fence: { name: 'the fence', r: 0.4, lv: 1 }, truck: { name: 'the truck', r: 1.6, lv: 3 }, pole: { name: 'the power pole', r: 0.5, lv: 6 }, tree: { name: 'the next tree', r: 0.9, lv: 4 } };
const SKINS = [{ id: 'classic', name: 'Orange saw', col: 0xf08a20, stars: 0 }, { id: 'lime', name: 'Lime saw', col: 0x8ad030, stars: 6 }, { id: 'red', name: 'Fire-red saw', col: 0xd8302a, stars: 14 }, { id: 'blue', name: 'Glacier saw', col: 0x3a8ad8, stars: 24 }, { id: 'black', name: 'Night saw', col: 0x2a2a30, stars: 36 }, { id: 'gold', name: 'Golden saw', col: 0xd6a630, stars: 50 }];
const UPGRADES = [{ id: 'chain', name: 'Sharp chain', max: 2, cost: l => [50, 120][l], desc: 'Cuts a little faster.' }, { id: 'ring', name: 'Hinge gauge', max: 1, cost: () => 70, desc: 'Finer marks on the ring.' }, { id: 'axe', name: 'Felling axe', max: 1, cost: () => 90, desc: 'Each wedge tap hits harder.' }];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Greenhorn'], [60, 'Swamper'], [200, 'Choker setter'], [500, 'Faller'], [1100, 'Head faller'], [2500, 'Legend of the woods']];
const PLACES = [{ name: 'Pine valley', sky: 'day' }, { name: 'Autumn wood', sky: 'dusk' }, { name: 'Snowy ridge', sky: 'overcast' }, { name: 'Misty highlands', sky: 'dawn' }];
const placeOf = N => Math.min(3, Math.floor((N - 1) / 5) % 4);
const NOTCH_OK = [0.22, 0.36], HINGE_OK = [0.06, 0.14];
function makeCfg(N, help, o = {}) { const f = curve(N), e = Math.min(1, f / 40);
  return { N, f, help: !!help, practice: !!o.practice, trees: o.practice ? 999 : N <= 3 ? 3 : Math.min(5, 3 + Math.floor(f / 12)), fails: o.practice ? 999 : N <= 3 ? 2 : 1,
    zw: (3.0 - 1.4 * e) * (help ? 1.3 : 1), lean: N <= 3 ? 0 : Math.min(0.15, 0.04 + f * 0.003), back: N >= 3 ? Math.min(0.35, 0.12 + f * 0.006) : 0,
    wind: N >= 5 ? Math.min(8, 2.5 + f * 0.14) : 0, hiker: N >= 6 ? Math.min(0.6, 0.25 + f * 0.01) : 0, haz: N <= 1 ? 1 : Math.min(4, 1 + Math.floor((f + 2) / 6)),
    guide: N <= 4 ? 'full' : N <= 12 ? 'lean' : 'none' }; }
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help, o), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, mini: !!o.mini, done: 0, failed: 0, coins: 0, log: [], wait: 0, next: null, ti: 0, felled: [] };
  if (G.teach && LESSONS[N] && G.taught < N && !cfg.practice) lessonStart(G); else { nextTree(G); G.ev.push({ k: 'start' }); }
  return G; }
const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
// ---------- a tree, its clearing, what is around it ----------
function kindsFor(N) { return Object.keys(KINDS).filter(k2 => KINDS[k2].lv <= N); }
function nextTree(G, retry) { const c = G.cfg, R = G.rnd, L = lessonNow(G);
  if (retry && G.tree) { const T0 = G.tree.spec; if (G.felled.length && G.felled[G.felled.length - 1].spec === T0) G.felled.pop(); G.ti--; G.tree = makeTree(G, T0); G.ev.push({ k: 'tree', retry: true }); return; }
  const ks = kindsFor(G.N), newest = ks[ks.length - 1], kind = L ? 'pine' : (G.done === 0 && R() < 0.5 ? newest : ks[(R() * ks.length) | 0]), K = KINDS[kind];
  const spec = { kind, h: lerp(K.h[0], K.h[1], R()), d: lerp(K.d[0], K.d[1], R()), t: R() * TAU, la: 0, lm: 0, wind: 0, wa: R() * TAU, gust: R() * 100, haz: [], hiker: null, pos: { x: G.ti * 40, z: 0 } };
  const lean = c.lean * (K.lean || 1); if (L && L.id === 'wedge' || !L && R() < c.back) { spec.la = spec.t + Math.PI + (R() - 0.5) * 0.6; spec.lm = 0.03 + R() * 0.03; }
  else if (lean > 0) { spec.la = spec.t + (R() < 0.5 ? 1 : -1) * (0.9 + R() * 0.7); spec.lm = lean * (0.5 + 0.5 * R()); }
  if (!L) spec.wind = c.wind * (0.4 + 0.6 * R());
  // hazards around the strip: one tight against the side the lean (or a gust) would push it to; others further round
  const hk = Object.keys(HAZ).filter(k2 => HAZ[k2].lv <= G.N), side = spec.lm > 0 && spec.la !== spec.t ? Math.sign(angDiff(spec.la, spec.t)) || 1 : (R() < 0.5 ? 1 : -1);
  for (let i = 0; i < (L ? (L.id === 'cut' ? 0 : 1) : c.haz); i++) { const kd = L ? 'fence' : hk[(R() * hk.length) | 0], H = HAZ[kd], s = i % 2 ? -side : side, near = i === 0;
    const off = c.zw + H.r + (near ? 0.6 + R() * 1.2 : 2 + R() * 5), along = spec.h * (0.55 + R() * 0.45), dx = Math.cos(spec.t), dz = Math.sin(spec.t), cx = dx * along - dz * off * s, cz = dz * along + dx * off * s;
    if (kd === 'fence') { const g = i; for (let j = -2; j <= 2; j++) spec.haz.push({ kind: kd, x: cx + dx * j * 2, z: cz + dz * j * 2, r: H.r, rot: spec.t, grp: g, j }); }      // a fence: five posts in a row beside the strip
    else spec.haz.push({ kind: kd, x: cx, z: cz, r: H.r, rot: spec.t + R() * 0.5 }); }
  if (!L && spec.lm > 0.02 && spec.la !== spec.t && Math.cos(angDiff(spec.la, spec.t)) < -0.5 && G.N >= 3) spec.haz.push({ kind: 'truck', x: Math.cos(spec.la) * spec.h * 0.75, z: Math.sin(spec.la) * spec.h * 0.75, r: 1.6, rot: spec.la });
  if (!L && R() < c.hiker) { const a = spec.t, dist = spec.h * (0.7 + R() * 0.3); spec.hiker = { cx: Math.cos(a) * dist, cz: Math.sin(a) * dist, dir: a + Math.PI / 2, len: 14 + R() * 6, speed: 1.3 + R() * 0.4, phase: R() * 40 }; }
  G.tree = makeTree(G, spec); G.ev.push({ k: 'tree' }); }
function makeTree(G, spec) { const L = lessonNow(G), aim0 = L && L.id === 'cut' ? spec.t : spec.t + (G.rnd() < 0.5 ? 1 : -1) * (1.0 + G.rnd() * 1.6);
  return { spec, aim: aim0, nd: 0, bc: 0, wedges: 0, phase: 'aim', notching: false, sawing: false, th: 0, om: 0, dir: aim0, tipT: 0, hingeAt: null, ctl: 0, sitT: 0, t0: G.t, res: null, warned: 0 }; }
// the wind: a steady breeze with gusts that come and go (the same for the robot and the picture)
function windNow(T, t) { const S = T.spec; if (!S.wind) return 0; const g = Math.sin(t * 0.7 + S.gust) * 0.5 + Math.sin(t * 1.9 + S.gust * 2) * 0.3 + Math.sin(t * 0.23 + S.gust * 3) * 0.6; return S.wind * clamp(0.45 + 0.4 * g, 0, 1.2); }
function hikerAt(T, t) { const h = T.spec.hiker; if (!h) return null; const per = (h.len * 2) / h.speed + 18, u = ((t + h.phase) % per); if (u > per - 18) return null; const p = u * h.speed, s = (p < h.len ? p : 2 * h.len - p) - h.len / 2;
  return { x: h.cx + Math.cos(h.dir) * s, z: h.cz + Math.sin(h.dir) * s, back: p >= h.len }; }
// ---------- the player's moves ----------
const busy = G => !G.tree || G.wait > 0 || G.over;
function aimSet(G, a) { const T = G.tree; if (busy(G) || T.phase !== 'aim' || T.nd > 0) return false; T.aim = T.dir = a; return true; }
function aimBy(G, da) { const T = G.tree; return T ? aimSet(G, T.aim + da) : false; }
function notchOn(G) { const T = G.tree; if (busy(G) || T.bc > 0 || T.phase === 'fall' || T.phase === 'down') return false; T.notching = true; T.sawing = false; if (T.phase === 'aim') T.phase = 'cut'; G.ev.push({ k: 'notchon' }); return true; }
function sawOn(G) { const T = G.tree; if (busy(G) || T.phase === 'down') return false; if (T.phase === 'fall' && T.th > 0.25) return false; T.sawing = true; T.notching = false; if (T.phase === 'aim') T.phase = 'cut'; G.ev.push({ k: 'sawon' }); return true; }
function release(G) { const T = G.tree; if (!T || (!T.notching && !T.sawing)) return false; const was = T.notching ? 'notch' : 'saw'; T.notching = T.sawing = false; G.ev.push({ k: 'off', was, nd: T.nd, hinge: hingeOf(T) }); lessonSee(G, was); return true; }
function wedge(G) { const T = G.tree; if (busy(G) || T.phase !== 'cut' || T.bc < 0.15 || T.sawing) return false; T.wedges += 1 + 0.5 * upLv('axe'); G.ev.push({ k: 'wedge', n: T.wedges }); lessonSee(G, 'wedge'); return true; }
const hingeOf = T => Math.max(0, 1 - T.nd - T.bc);
const nq = nd => nd < 0.08 ? 0 : clamp(1 - Math.max(0, NOTCH_OK[0] - nd, nd - NOTCH_OK[1]) * 6, 0, 1);
const hq = (h, K) => { const lo = HINGE_OK[0] + (K.brittle ? 0.04 : 0), hi = HINGE_OK[1] + (K.brittle ? 0.04 : 0); return h < lo ? clamp(h / lo, 0, 1) ** 1.5 : h > hi ? Math.max(0.55, 1 - (h - hi) * 4) : 1; };
// what pushes the tree over along the felling line (and sideways)
function forces(G, T) { const S = T.spec, w = windNow(T, G.t), a = T.aim;
  return { along: S.lm * Math.cos(angDiff(S.la, a)) * 3 + w * Math.cos(angDiff(S.wa, a)) * 0.012 + T.wedges * 0.045 + 0.06 * Math.min(1, T.nd / 0.22) + (T.nd > 0.45 ? 0.06 : 0), side: S.lm * Math.sin(angDiff(S.la, a)), wside: w * Math.sin(angDiff(S.wa, a)), w }; }
// ---------- the clock ----------
function step(G, dt) { if (G.over || !(dt > 0)) return; if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0) { G.wait = 0; if (G.next) { const f = G.next; G.next = null; f(); } } return; }
  G.t += dt; const T = G.tree; if (!T) return; const S = T.spec, K = KINDS[S.kind], rate = K.rate * (1 + 0.12 * upLv('chain')) / Math.max(0.6, S.d / 0.6) ** 0.5;
  if (T.phase === 'cut') {
    if (T.notching && T.bc === 0) { T.nd = Math.min(0.6, T.nd + 0.11 * rate * dt); if (T.nd >= 0.6) release(G); }
    if (T.sawing) { T.bc = Math.min(1 - T.nd, T.bc + 0.13 * rate * dt); }
    const F = forces(G, T), h = hingeOf(T), tip = F.along > 0 ? clamp(0.03 + 0.55 * F.along, 0, 0.3) + (K.brittle && h < K.brittle ? 0.2 : 0) : -1;
    if (T.bc > 0 && (h <= tip || h <= 0.0001)) { T.phase = 'fall'; T.tipT = 0; T.om = 0.05; T.th = 0.01; T.back = F.along <= 0; G.ev.push({ k: 'tip', back: T.back }); }
    else if (T.bc > 0.15 && !T.sawing && !T.notching) { T.sitT += dt; if (T.sitT > 1.2 && !T.warned) { T.warned = 1; G.ev.push({ k: 'sits' }); } } else T.sitT = 0;
    return; }
  if (T.phase === 'fall') { T.tipT += dt; if (T.sawing) T.bc = Math.min(1 - T.nd, T.bc + 0.13 * rate * dt);
    if (T.hingeAt == null && (T.tipT >= 0.5 || (!T.sawing && T.tipT >= 0.2))) settleDir(G, T);
    T.om += (3 * 9.8 / (2 * S.h)) * Math.sin(Math.max(0.02, T.th)) * dt; T.th += T.om * dt; if (T.hingeAt != null) T.dir += angDiff(T.fdir, T.dir) * Math.min(1, dt * 4);
    if (T.th >= Math.PI / 2) { T.th = Math.PI / 2; T.dir = T.fdir; land(G, T); } return; } }
// the hinge (what was left of it once the tree went) decides how well the notch steers: lean, gusts and luck do the rest
function settleDir(G, T) { const S = T.spec, K = KINDS[S.kind], F = forces(G, T), h = hingeOf(T); T.sawing = false; T.hingeAt = h;
  T.ctl = nq(T.nd) * hq(h, K); const c = T.ctl, luck = (G.rnd() - 0.5) * 2 * 0.7 * (1 - c) ** 1.5;
  if (T.back) { T.fdir = S.la + F.wside * 0.02 + luck * 0.5; return; }
  T.fdir = T.aim + F.side * (1 - 0.7 * c) * 2.2 + F.wside * 0.012 * (1 - 0.5 * c) + luck; T.wAt = F.w; }
function segDist(px, pz, ax, az, bx, bz) { const vx = bx - ax, vz = bz - az, L2 = vx * vx + vz * vz || 1, u = clamp(((px - ax) * vx + (pz - az) * vz) / L2, 0, 1); return { d: Math.hypot(px - (ax + vx * u), pz - (az + vz * u)), u }; }
function land(G, T) { if (T.hingeAt == null) settleDir(G, T); const S = T.spec, K = KINDS[S.kind], d = T.fdir, tx = Math.cos(d) * S.h, tz = Math.sin(d) * S.h, err = angDiff(d, S.t), lat = S.h * Math.sin(err), zw = G.cfg.zw;
  let hit = null; const width = u => S.d / 2 + (u > 0.6 ? K.crown * (u - 0.6) / 0.4 : 0) + 0.2;
  for (const H of S.haz) { const q = segDist(H.x, H.z, 0, 0, tx, tz); if (q.d < H.r + width(q.u)) { hit = HAZ[H.kind].name; break; } }
  const hk = hikerAt(T, G.t); if (!hit && hk) { const q = segDist(hk.x, hk.z, 0, 0, tx, tz); if (q.d < 0.7 + width(q.u)) hit = 'the hiker'; }
  const inZone = !hit && Math.cos(err) > 0 && Math.abs(lat) < zw, grade = !inZone ? (hit ? 'hit' : 'miss') : Math.abs(lat) < zw * 0.3 ? 'perfect' : Math.abs(lat) < zw * 0.65 ? 'good' : 'in';
  const why = grade === 'hit' ? whyHit(T, hit) : grade === 'miss' ? whyMiss(G, T, lat) : null, coins = { perfect: 5, good: 3, in: 2 }[grade] || 0;
  T.phase = 'down'; T.res = { grade, lat, hit, why, coins, ctl: T.ctl, nd: T.nd, hinge: T.hingeAt, lean: S.lm > 0.02 ? Math.sign(angDiff(S.la, S.t)) : 0 }; G.felled.push({ spec: S, dir: d, pos: S.pos });
  G.log.push(T.res); G.ev.push({ k: 'land', grade, hit, why, lat, coins }); G.wait = grade === 'hit' || grade === 'miss' ? 2.4 : 1.8; G.ti++;
  if (G.lesson) { if (inZone) lessonSee(G, 'land'); else G.next = () => nextTree(G, true); return; }
  if (inZone) { G.done++; G.coins += coins; G.next = () => { if (G.done >= G.cfg.trees) finish(G, true); else nextTree(G); }; }
  else { G.failed++; G.next = () => { if (G.failed > G.cfg.fails) finish(G, false, { why }); else nextTree(G, true); }; } }
function whyHit(T, what) { const S = T.spec; if (T.back) return `It sat back and fell the wrong way onto ${what}. A tree leaning back needs a thick hinge and WEDGES.`;
  if (T.hingeAt != null && T.hingeAt < 0.03) return `It fell onto ${what}: the hinge was cut through, so the lean and wind took it. Let go of SAW sooner.`;
  if (T.nd < 0.15) return `It fell onto ${what}: the notch was too small to steer it. Hold NOTCH longer.`;
  if (what === 'the hiker') return 'The hiker was under it! Wait until the path is clear before the last cut.';
  return `It fell onto ${what}. ${S.lm > 0.02 ? 'The lean pulled it: aim a little the other way.' : 'Turn the felling line more into the open strip.'}`; }
function whyMiss(G, T, lat) { const S = T.spec; if (T.back) return 'It fell backwards: a tree leaning back needs WEDGES before the hinge is cut through.';
  if (T.hingeAt != null && T.hingeAt < 0.03) return 'The hinge was cut through, so it twisted. Let go of SAW while some green is left.';
  if (T.nd < 0.15) return 'The notch was too small to steer it. Hold NOTCH until the ring shows a third.';
  if (S.lm > 0.02 && Math.sign(lat) === Math.sign(angDiff(S.la, S.t))) return 'The lean pulled it off the strip: aim a little against the lean.';
  if (T.wAt > 3) return 'A gust pushed it. Tip it over in a lull (watch the flag).';
  return 'The felling line was off the strip. Turn it to the middle of the clearing.'; }
function finish(G, win, o = {}) { if (G.over) return; G.over = win ? 'won' : 'lost'; const perfect = G.log.filter(q => q.grade === 'perfect').length, stars = win ? (G.failed === 0 ? (perfect * 2 >= G.done ? 3 : 2) : 1) : 0;
  G.res = { win, stars, why: o.why || null, done: G.done, failed: G.failed, perfect, log: G.log, coins: win ? G.coins + Math.ceil(G.N / 2) + stars * 3 : Math.max(1, G.coins >> 1) }; G.ev.push({ k: win ? 'won' : 'lost' }); }
// ---------- LESSONS: notch and saw; aim; the wedge ----------
const AIMCARD = {"pic": "🌲", "win": "DROP EACH TREE IN THE STRIP", "lose": "TREES FALL WRONG", "how": "NOTCH, SAW, STOP ON GREEN"};      // the aim card: specs/aims.json (tools/aims.py)
const LESSONS = {
  1: [{ id: 'cut', title: 'NOTCH, THEN SAW', say: G => timberCue(G)[0], do: G => timberCue(G)[1], at: G => timberCue(G)[2], how: 'The felling line already points at the strip. HOLD NOTCH until the ring shows about a third, let go. Then HOLD SAW and let go while a green strip of wood is left.' }],
  2: [{ id: 'aim', title: 'AIM THE FALL', say: G => timberCue(G)[0], do: G => timberCue(G)[1], at: G => timberCue(G)[2], how: 'DRAG across the picture to turn the felling line into the open strip, away from the fence. Then NOTCH and SAW.' }],
  3: [{ id: 'wedge', title: 'THE WEDGE', say: G => timberCue(G)[0], do: G => timberCue(G)[1], at: G => timberCue(G)[2], how: 'This tree leans back: it will sit on its hinge. Stop SAW with green left, then TAP WEDGE until it tips.' }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); nextTree(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonSee(G, what) { const D = G.lesson; if (!D || what !== 'land') return; G.lesson = null; G.ev.push({ k: 'lessonok', n: 1, need: 1 }); G.ev.push({ k: 'lessondone', N: G.N });
  G.next = () => { G.rnd = rng(G.seed); G.done = 0; G.failed = 0; G.log = []; G.coins = 0; nextTree(G); G.ev.push({ k: 'start' }); }; }
// ---------- for the robots ----------
const BLIND = {
  a: G => aimBy(G, (Math.random() - 0.5) * 2.4),      // a drag across the picture, any way
  n: G => notchOn(G), s: G => sawOn(G), u: G => release(G), w: G => wedge(G),
};
// HONEST: a faller who looks. Aims at the strip (against the lean by what experience says), holds NOTCH to about a third and
// SAW to the green, with a thumb's reaction; taps wedges; waits for a lull (sharp ones) and for the path to clear.
function expectAim(G, T, c = 0.85) { const S = T.spec; let a = S.t; for (let i = 0; i < 6; i++) { const side = S.lm * Math.sin(angDiff(S.la, a)); a = S.t - side * (1 - 0.7 * c) * 2.2; } return a; }
// THE TUTORIAL SHOWS THE ONE MOVE TO MAKE NOW (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing happens"). DRAG TO AIM slid
// both ways in a box (which way is the strip?), TAP WEDGE pointed nowhere, and no lesson said when to LET GO. Now the robot is asked
// (dryPlanAll, its own aim and depths): DRAG LEFT / DRAG RIGHT to the strip, HOLD NOTCH, LET GO! at a third, HOLD SAW, LET GO! with green left,
// TAP WEDGE (the left button) until it tips.
const TBC = { t: -1e9, v: null };
function timberCue(G) { const T = G.tree; if (G.over || G.wait > 0 || !T || T.phase === 'down') return ['WAIT…', 'wait', false]; const now = performance.now(); if (now - TBC.t < 60) return TBC.v; TBC.t = now; const K = KINDS[T.spec.kind], L = layout(G), mid = b => [b.x + b.w / 2, b.y + b.h / 2];
  const all = dryPlanAll(G, null, { T, cd: -1, aim: expectAim(G, T), nd: 0.29, hg: K.brittle ? 0.16 : 0.11, lag: 99, patient: true }), q = all[all.length - 1]; let v;
  if (!q) v = T.notching ? ['KEEP HOLDING', 'hold', mid(L.notch)] : T.sawing ? ['KEEP HOLDING', 'hold', mid(L.saw)] : ['WAIT…', 'wait', false];
  else if (q[0] === 'release') v = ['LET GO!', 'release', mid(T.notching ? L.notch : L.saw)];
  else if (q[0] === 'notchOn') v = ['HOLD NOTCH', 'hold', mid(L.notch)];
  else if (q[0] === 'sawOn') v = ['HOLD SAW', 'hold', mid(L.saw)];
  else if (q[0] === 'wedge') v = ['TAP WEDGE', 'tap', mid(L.notch)];
  else { const d = angDiff(q[1], T.aim), dx = clamp(d * W / 1.5, -W * 0.35, W * 0.35); v = [dx < 0 ? 'DRAG LEFT TO AIM' : 'DRAG RIGHT TO AIM', 'drag', [W / 2, H * 0.42, W / 2 + dx, H * 0.42]]; }
  TBC.v = v; return v; }
function honest(G, o, mem) { const T = G.tree; if (G.over || G.wait > 0 || !T || T.phase === 'down') return; const acc = o.acc == null ? 0.85 : o.acc, react = o.react == null ? 0.3 : o.react, S = T.spec, K = KINDS[S.kind];
  if (mem.T !== T) { mem.T = T; mem.cd = react; mem.aim = expectAim(G, T) + (Math.random() - 0.5) * 2 * (1 - acc) * 0.25 * (G.cfg.guide === 'none' ? 1.6 : 1); mem.nd = 0.29 + (Math.random() - 0.5) * 2 * (1 - acc) * 0.12; mem.hg = (K.brittle ? 0.16 : 0.11) + (Math.random() - 0.5) * 2 * (1 - acc) * 0.06; mem.lag = 0; mem.patient = Math.random() < 0.3 + 0.7 * acc; }
  if (T.phase === 'fall') { if (T.sawing) { mem.lag += 1 / 60; if (mem.lag > react * 0.8) ACT.release(G); } return; }
  if (T.notching) { if (T.nd >= mem.nd) { mem.lag += 1 / 60; if (mem.lag > react * 0.25) { ACT.release(G); mem.lag = 0; } } return; }
  if (T.sawing) { if (hingeOf(T) <= mem.hg) { mem.lag += 1 / 60; if (mem.lag > react * 0.25) { ACT.release(G); mem.lag = 0; } } return; }
  mem.cd -= 1 / 60; if (mem.cd > 0) return; mem.cd = react * (0.6 + 0.8 * Math.random());
  if (T.nd === 0 && Math.abs(angDiff(T.aim, mem.aim)) > 0.01) { ACT.aimSet(G, mem.aim); return; }
  if (T.nd === 0) { ACT.notchOn(G); return; }
  const hk = hikerAt(T, G.t + 3), F = forces(G, T);
  if (mem.patient && hk && Math.hypot(hk.x - Math.cos(S.t) * S.h * 0.8, hk.z - Math.sin(S.t) * S.h * 0.8) < S.h * 0.5 + 4) return;      // the hiker would be under it
  if (mem.patient && acc > 0.9 && F.w > S.wind * 0.6 && S.wind > 3) return;      // wait for a lull
  if (hingeOf(T) > mem.hg + 0.02) { ACT.sawOn(G); return; }
  ACT.wedge(G); }
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.done = G.cfg.trees; finish(G, true); }

// what the robot would do now, without doing it (tools/dry_plan.py): the tutorial shows this move
const ACT_REAL = { aimSet, notchOn, sawOn, release, wedge }; let ACT = ACT_REAL;
function dryPlan(G, o, mem) { let got = null; const rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { if (!got && !(a.length > 2 && a.slice(1).every(v => v === 0 || v === false))) got = [n, ...a.slice(1)]; return true; };      /* (a stick at rest, all its numbers 0, is not a move; a first bed, number 0, is) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return got; }
function dryPlanAll(G, o, mem) { const all = [], rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { all.push([n, ...a.slice(1)]); return true; };      /* every call, in order (for a robot that steers and drifts at once) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return all; }
