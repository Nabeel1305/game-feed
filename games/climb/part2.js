// ===================== RULES: Rock Climb =====================
// A rock face, a climber on four points (two hands, two feet), a rope clipped to the bolts as you pass them. Drag a hand (later
// a foot too) onto a hold you can reach; it snaps on. Your grip drains while you hang on small holds and recovers on big ones
// with your feet well placed. Run out and you slip (with a warning first); the rope catches you at your last bolt. Three falls
// and you are done for the day. Reach the top ledge to win. Wall units are metres: x across (-5..5), y up from the ground.

const RULES = [
  '<b>Drag a hand onto a hold.</b> The holds you can reach light up while you drag; let go near one and you grab it.',
  '<b>Watch your grip</b> (the bar). Small holds tire you, big ones and good feet rest you. Both hands on a big ledge: a proper rest.',
  '<b>Read the holds:</b> a dome (sloper) only works below your shoulders; a side-pull only from the side it faces.',
  '<b>Pick your way.</b> One line has ledges to rest on, the other is shorter and harder (bonus coins). 👁 shows the whole route.',
  '<b>The rope</b> clips in at each bolt. Slip, and it catches you there. Three falls end the climb. No falls for three stars.',
];
const PLACES = [{ name: 'Sunny crag', skies: ['morning', 'noon', 'golden'] }, { name: 'Forest cliff', skies: ['morning', 'golden', 'overcast', 'mist'] },
  { name: 'Sea cliffs', skies: ['noon', 'golden', 'sunset', 'overcast'] }, { name: 'Mountain face', skies: ['morning', 'noon', 'golden', 'mist'] }];
const placeOf = N => N <= 5 ? 0 : N <= 12 ? 1 : N <= 20 ? 2 : 3;
const SKINS = [{ id: 'red', name: 'Red', top: 0xd8402a, stars: 0 }, { id: 'teal', name: 'Teal', top: 0x1a9a9a, stars: 6 }, { id: 'sun', name: 'Sunflower', top: 0xf2c230, stars: 14 },
  { id: 'violet', name: 'Violet', top: 0x7a4ad0, stars: 24 }, { id: 'lime', name: 'Lime', top: 0x8ad040, stars: 36 }, { id: 'night', name: 'Night', top: 0x22283a, stars: 50 }];
const UPGRADES = [{ id: 'chalk', name: 'Chalk bag', max: 2, cost: l => [50, 130][l], desc: 'Your grip lasts a little longer.' },
  { id: 'shoes', name: 'Sticky shoes', max: 2, cost: l => [60, 150][l], desc: 'Your feet take more of your weight.' },
  { id: 'arms', name: 'Forearms', max: 1, cost: () => 120, desc: 'Rests fill your grip faster.' }];
const upLv = id => { if (typeof HEADLESS !== 'undefined' && HEADLESS) return 0; return ((store.get('ups', {}) || {})[id]) | 0; };
const RANKS = [[0, 'Boulderer'], [60, 'Top-roper'], [200, 'Lead climber'], [500, 'Crag rat'], [1100, 'Big-waller'], [2500, 'Alpinist']];

// ---------- holds: what each kind does (consistent shapes, never a random failure) ----------
// hand: grip drain while hanging on it; foot: how much weight a foot on it takes; good: a hand on it rests; need: an approach
const HT = {
  ground: { foot: 0.46 }, chip: { foot: 0.27 },
  jug:    { hand: 0.012, foot: 0.32, good: true },
  ledge:  { hand: 0.0, foot: 0.36, good: true, rest: true },
  top:    { hand: 0.0, foot: 0.36, good: true, rest: true },
  edge:   { hand: 0.05, foot: 0.3 },
  pocket: { hand: 0.05, foot: 0.22 },
  crimp:  { hand: 0.08, foot: 0.24 },
  sloper: { hand: 0.055, foot: 0.2, need: 'below' },
  side:   { hand: 0.05, foot: 0.22, need: 'side' },
};
const ARM = 0.8, LEG = 1.0, SHX = 0.2, SHY = 0.55, HPX = 0.11, SNAP = 0.34, DYNO = 0.9;
const LIMBS = ['lh', 'rh', 'lf', 'rf'], isHand = l => l === 'lh' || l === 'rh';

function makeCfg(N, help, o = {}) {
  const f = curve(N), e = easyOf(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s));
  return { N, f, e, help: !!help, place: placeOf(N),
    height: Math.round(Math.min(40, 8 + Math.min(f, 34) * 0.95)),           // metres to the top ledge
    drain: x(0.55, 1.5, 26) * (help ? 0.8 : 1) * (1 - 0.07 * upLv('chalk')),  // how fast small holds tire you
    footUp: 0.03 * upLv('shoes'), restUp: 1 + 0.15 * upLv('arms'),
    lives: 3 + (help ? 1 : 0),
    types: ['jug', 'edge'].concat(N >= 3 ? ['sloper'] : [], N >= 4 ? ['side'] : [], N >= 5 ? ['pocket'] : [], N >= 7 ? ['crimp'] : []),
    feet: o.feet != null ? o.feet : N >= 6 ? 'you' : 'auto',                 // from level 6 your feet are yours (an assisted mode keeps them automatic)
    traverse: N >= 5, overhang: N >= 8 ? Math.min(32, 12 + f * 0.5) : 0, dyno: N >= 10,
    spread: x(1, 1.25, 20) };                                                  // how far apart the holds of the hard line are
}
// ---------- the route: two lines from the same start (one with ledges to rest on, one shorter and harder), bolts, the top ----------
function makeRoute(N, cfg, R, lessonId) {
  const H = lessonId ? (lessonId === 'clip' ? 7 : 5) : cfg.height, hs = [], add = (x, y, ty, line, o = {}) => { const h = Object.assign({ i: hs.length, x: +x.toFixed(2), y: +y.toFixed(2), ty, line }, o); hs.push(h); return h; };
  for (let x = -4.8; x <= 4.81; x += 0.3) add(x, 0.04, 'ground', -1);
  const st0 = lessonId === 'rest' ? 'edge' : 'jug'; add(-0.32, 1.72, st0, 0, { start: 1 }); add(0.32, 1.72, st0, 0, { start: 1 }); add(-0.45, 0.55, 'chip', 0); add(0.45, 0.55, 'chip', 0); add(0, 0.95, 'chip', 0);
  const lean = []; if (cfg.overhang && !lessonId) { let y = 6 + R() * 3; while (y < H - 3) { const len = 2.5 + R() * 3; lean.push({ y0: y, y1: Math.min(H - 1.5, y + len), deg: cfg.overhang * (0.6 + 0.4 * R()) }); y += len + 4 + R() * 4; } }
  const leanAt = y => { for (const s of lean) if (y >= s.y0 && y <= s.y1) return s.deg; return 0; };
  const lines = [{ id: 0, x: -0.32, dir: -1 }, { id: 1, x: 0.32, dir: 1 }];
  for (const L of lines) {
    const easy = L.id === 0, base = easy ? -1.9 - R() * 0.9 : 1.2 + R() * 0.5;
    let y = 1.72, x = L.x, side = 1, sinceRest = 0, dynoDone = 0, trav = null;
    if (cfg.traverse && !lessonId) trav = { y: 3.5 + R() * Math.max(1, H - 9), dx: (easy ? -1 : 1) * (1.6 + R() * 1.2) };
    let lastX = x;
    while (y < H - 0.8) {
      let dy = easy ? 0.5 + R() * 0.2 : (0.66 + R() * 0.2) * cfg.spread; let dx = side * (easy ? 0.42 : 0.36) + (R() - 0.5) * 0.16;
      const want = base + (easy ? Math.sin(y * 0.45 + R()) * 0.9 : Math.sin(y * 0.3) * 0.4);
      dx += clamp(want - x, -0.4, 0.4) * 0.5;
      if (trav && y > trav.y && trav.dx) { const s = Math.sign(trav.dx) * Math.min(0.75, Math.abs(trav.dx)); dx = s; dy = 0.12 + R() * 0.1; trav.dx -= s; }
      let dyno = false;
      if (!easy && cfg.dyno && !lessonId && y > 4 + dynoDone * 7 && y < H - 3 && R() < 0.35) { dy = 1.2 + R() * 0.25; dx = (R() - 0.5) * 0.3; dyno = true; dynoDone++; }
      y += dy; x = clamp(x + dx, -4.4, 4.4); const was = Math.sign(dx) || side; side = -side; sinceRest += dy;
      if (y > H - 0.55) break;
      lastX = x;
      let ty;
      if (dyno) ty = 'jug';
      else if (easy) { if (sinceRest > 3.2 && R() < 0.5) { ty = 'ledge'; sinceRest = 0; } else ty = cfg.N <= 2 ? (R() < 0.8 ? 'jug' : 'edge') : (R() < 0.55 ? 'jug' : pick(R, cfg.types.filter(t => t !== 'crimp'))); }
      else ty = cfg.N <= 1 ? (R() < 0.45 ? 'jug' : 'edge') : (R() < 0.18 ? 'jug' : pick(R, cfg.types));
      if (ty === 'sloper' && dy > 0.72) ty = 'edge';
      if (lessonId === 'rest' && easy && y > 2.2 && !hs.some(h => h.ty === 'ledge')) ty = 'ledge';
      const o = {}; if (ty === 'side') o.d = -was; if (dyno) o.dyno = 1; if (ty === 'ledge') o.w = 1.1;
      add(x, y, ty, L.id, o);
      // a foothold under the move, about where your feet will want to be when your hands are here
      add(x - side * 0.28 + (R() - 0.5) * 0.2, y - 1.45 - R() * 0.15, 'chip', L.id);
      if (R() < 0.4) add(x + side * 0.3, y - 0.95, 'chip', L.id);
    }
    const last = hs.filter(h => h.line === L.id && HT[h.ty].hand != null).reduce((a, h) => h.y > a.y ? h : a, { y: 0 });
    if (last.y < H - 0.85) { add(last.x + 0.3, H - 0.6, 'jug', L.id); add(last.x - 0.1, H - 2.0, 'chip', L.id); }
  }
  // scattered holds: the wall is not bare, and a wrong guess is easy to make
  const n = Math.round(H * (lessonId ? 1.5 : 2.4));
  for (let i = 0; i < n; i++) { const x = -4.4 + R() * 8.8, y = 1.2 + R() * (H - 2.2); if (hs.some(h => Math.hypot(h.x - x, h.y - y) < 0.55)) continue; add(x, y, R() < 0.5 ? 'chip' : pick(R, cfg.types), 2, x > 0 ? { d: -1 } : { d: 1 }); }
  // the top: a long ledge across both lines
  for (let x = -4.4; x <= 4.41; x += 0.55) add(x, H, 'top', -1, { w: 0.55 });
  for (const h of hs) if (h.ty === 'side' && !h.d) h.d = h.x > 0 ? -1 : 1;
  // bolts: every three metres on each line, where a hand passes
  const bolts = []; for (const L of [0, 1]) { const mine = hs.filter(h => h.line === L && HT[h.ty].hand != null); for (let b = 3; b < H - 0.8; b += 3) { const h = mine.reduce((a, q) => Math.abs(q.y - b) < Math.abs(a.y - b) ? q : a, mine[0]); if (h && !bolts.some(q => Math.hypot(q.x - h.x, q.y - b) < 1)) bolts.push({ x: +(h.x + 0.25).toFixed(2), y: b, line: L, clip: false }); } }
  return { H, holds: hs, bolts, lean, leanAt };
}
// ---------- the body: where the hips go so every limb reaches its hold (or not) ----------
const sh = (b, l) => l === 'lh' ? { x: b.x - SHX, y: b.y + SHY } : l === 'rh' ? { x: b.x + SHX, y: b.y + SHY } : l === 'lf' ? { x: b.x - HPX, y: b.y } : { x: b.x + HPX, y: b.y };
function solve(G, S) {
  const P = {}; let n = 0, sx = 0, sy = 0;
  for (const l of LIMBS) { const i = S[l]; if (i == null || i < 0) continue; const h = G.route.holds[i]; P[l] = h; n++; sx += h.x; sy += h.y + (isHand(l) ? -SHY - 0.5 : 0.75); }
  if (!n) return { x: 0, y: 1, strain: 0, ok: false, ex: 9 };
  const b = { x: sx / n, y: sy / n }; let ex = 0, strain = 0;
  const hy0 = Math.max(P.lh ? P.lh.y : -9, P.rh ? P.rh.y : -9), lo = Math.min(P.lh ? P.lh.y : 99, P.rh ? P.rh.y : 99);
  for (let it = 0; it < 30; it++) {
    if (it < 20) b.y += 0.03;      // stand up on your feet as far as they let you
    if (hy0 > -9 && b.y + SHY > hy0 + 0.35) b.y = hy0 + 0.35 - SHY; if (lo < 99 && b.y > lo + 0.27) b.y = lo + 0.27;
    for (const l of LIMBS) { const h = P[l]; if (!h) continue; const j = sh(b, l), dx = h.x - j.x, dy = h.y - j.y, d = Math.hypot(dx, dy), M = isHand(l) ? ARM : LEG; if (d > M) { const m = (d - M) * 0.55 / d; b.x += dx * m; b.y += dy * m; } }
    for (const l of ['lf', 'rf']) { const h = P[l]; if (h && h.y > b.y + 0.12) b.y = h.y - 0.12; }      // a high step: the foot no higher than the hip
  }
  for (const l of LIMBS) { const h = P[l]; if (!h) continue; const j = sh(b, l), d = Math.hypot(h.x - j.x, h.y - j.y), M = isHand(l) ? ARM : LEG; ex = Math.max(ex, d - M); if (isHand(l)) strain = Math.max(strain, d / M); }
  let ok = ex < 0.035;
  for (const l of ['lf', 'rf']) if (P[l] && (P[l].y > b.y + 0.18 || Math.abs(P[l].x - sh(b, l).x) > 0.75)) ok = false;      // no splits: a foot stays under you
  for (const l of ['lh', 'rh']) if (P[l] && P[l].y < b.y - 0.3) ok = false;      // a hand on a hold below the hips is no use
  return { x: b.x, y: b.y, strain, ok, ex };
}
function approachOK(G, h, l, b) {      // the holds that need a particular approach (readable from their shape)
  const need = HT[h.ty].need; if (!need || !isHand(l)) return true;
  if (need === 'below') return h.y <= b.y + SHY + 0.18;
  if (need === 'side') return (b.x - h.x) * h.d > 0.1;
  return true;
}
const handOK = (G, S, b) => ['lh', 'rh'].every(l => S[l] == null || S[l] < 0 || approachOK(G, G.route.holds[S[l]], l, b));
const footSup = (G, S) => { let s = 0; for (const l of ['lf', 'rf']) { const i = S[l]; if (i == null || i < 0) continue; const h = G.route.holds[i]; s += (HT[h.ty].foot || 0) + (h.ty !== 'ground' ? G.cfg.footUp : 0); } const ln = G.route.leanAt(G.body ? G.body.y : 0); return s * (1 - ln / 55); };
// the best pair of footholds for these hands (auto feet), or null
function chooseFeet(G, S, near) {
  const hs = G.route.holds, a = hs[S.lh], c = hs[S.rh], mx = (a.x + c.x) / 2, my = Math.min(a.y, c.y);
  const cand = hs.filter(h => HT[h.ty].foot && h.y < my - 0.45 && h.y > my - 2.5 && Math.abs(h.x - mx) < 1.5).map(h => ({ h, d: Math.hypot(h.x - mx, (h.y - (my - 1.6)) * 1.2) })).sort((p, q) => p.d - q.d).slice(0, 9).map(p => p.h);
  let best = null, bs = 1e9;
  for (const f1 of cand) for (const f2 of cand) { if (f1.x > f2.x + 0.05) continue; if (f1 === f2 && f1.ty !== 'ground' && f1.ty !== 'ledge') continue;
    const T = { lh: S.lh, rh: S.rh, lf: f1.i, rf: f2.i }, b = solve(G, T); if (!b.ok || !handOK(G, T, b)) continue;
    let sc; if (near) { const o1 = hs[G.S.lf], o2 = hs[G.S.rf]; sc = (o1 ? Math.hypot(f1.x - o1.x, f1.y - o1.y) : 1) + (o2 ? Math.hypot(f2.x - o2.x, f2.y - o2.y) : 1) + b.strain * 0.3; }      // your feet: they only scramble to the nearest holds that work
    else sc = b.strain * 1.2 - (HT[f1.ty].foot + HT[f2.ty].foot) * 1.5 + (f2.x - f1.x < 0.2 ? 0.3 : 0);      // auto feet: the best holds
    if (sc < bs) { bs = sc; best = T; } }
  return best;
}
// try a limb on a hold: the stance it makes, or null
function tryStance(G, l, i) {
  const S = Object.assign({}, G.S); S[l] = i; const h = G.route.holds[i];
  if (isHand(l) ? HT[h.ty].hand == null : !HT[h.ty].foot) return null;
  { const o = { lh: 'rh', rh: 'lh', lf: 'rf', rf: 'lf' }[l]; if (S[o] === i && !['ground', 'ledge', 'jug', 'top'].includes(h.ty)) return null; }
  if (isHand(l) && G.cfg.feet === 'auto') return chooseFeet(G, S);
  if (isHand(l)) { const b = solve(G, S); if (b.ok && handOK(G, S, b)) return S; return chooseFeet(G, S, true); }      // your feet stay put if they can; if not they scramble
  const b = solve(G, S); return b.ok && handOK(G, S, b) ? S : null;
}
// every hold this limb can go to now (for the lights while dragging); dyno: out of reach, but a jump can get there
function targets(G, l) {
  const out = [], hs = G.route.holds, cur = hs[G.S[l]], b = G.body;
  for (const h of hs) { if (h.i === G.S[l]) continue; const from = cur && cur.i >= 0 ? cur : sh(b, l); if (Math.hypot(h.x - from.x, h.y - from.y) > 2.4) continue;
    if (isHand(l) ? HT[h.ty].hand == null : !HT[h.ty].foot) continue;
    const S = tryStance(G, l, h.i); if (S) out.push({ i: h.i, dyno: false });
    else if (h.dyno && isHand(l) && canDyno(G, l, h)) out.push({ i: h.i, dyno: true }); }
  return out;
}
function canDyno(G, l, h) { const S = G.S; if (S.lf < 0 || S.rf < 0) return false; const j = sh(G.body, l); const d = Math.hypot(h.x - j.x, h.y - j.y); return d > ARM - 0.05 && d < ARM + DYNO; }

function newGame(N, o = {}) {
  const help = o.help, feetPref = o.feet || (typeof store !== 'undefined' && !(typeof HEADLESS !== 'undefined' && HEADLESS) ? store.get('feet', null) : null);
  const cfg = makeCfg(N, help, { feet: N >= 6 && feetPref === 'auto' ? 'auto' : undefined }), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, mini: !!o.mini };
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else setup(G);
  return G;
}
function setup(G, lessonId) {
  G.route = makeRoute(G.N, G.cfg, rng(G.seed + (lessonId ? 99 : 0)), lessonId); const hs = G.route.holds;
  const st = hs.filter(h => h.start), gr = hs.filter(h => h.ty === 'ground');
  G.S = { lh: st[0].i, rh: st[1].i, lf: gr.reduce((a, h) => Math.abs(h.x + 0.2) < Math.abs(a.x + 0.2) ? h : a).i, rf: gr.reduce((a, h) => Math.abs(h.x - 0.2) < Math.abs(a.x - 0.2) ? h : a).i };
  G.body = solve(G, G.S); G.st = 1; G.phase = 'climb'; G.slipT = 0; G.fallT = 0; G.falls = 0; G.misses = 0; G.moves = 0; G.dyno = null; G.look = null;
  G.cp = Object.assign({}, G.S); G.clips = 0; G.maxY = G.body.y; G.used = [0, 0]; G.rests = 0; G.resting = false; G.dynos = 0; G.gold = -1;
  G.ev.push({ k: 'setup' });
}
const stanceNow = G => solve(G, G.S);
// ---------- the player's actions ----------
// move a limb to the hold nearest (x, y) that it can reach (within SNAP); nothing there: a slap at the rock, which costs more each time
function move(G, l, x, y) {
  if (G.over || (G.phase !== 'climb' && G.phase !== 'slip') || G.look) return false;
  if (!isHand(l) && G.cfg.feet === 'auto' && !G.lesson) return false;
  const hs = G.route.holds; let best = null;
  const near = hs.map(h => ({ h, d: Math.hypot(h.x - x, (h.y - y) * 0.9) - (h.ty === 'ledge' || h.ty === 'top' ? 0.12 : 0) })).filter(p => p.d < SNAP && p.h.i !== G.S[l]).sort((a, b) => a.d - b.d);
  for (const p of near) { const h = p.h; if (isHand(l) ? HT[h.ty].hand == null : !HT[h.ty].foot) continue; if (tryStance(G, l, h.i)) { best = { i: h.i, dyno: false }; break; } if (h.dyno && isHand(l) && canDyno(G, l, h)) { best = { i: h.i, dyno: true }; break; } }
  if (!best) { G.misses++; G.st -= 0.035 * Math.min(4, G.misses) * (G.lesson ? 0 : 1); G.ev.push({ k: 'miss', l, x, y, n: G.misses }); if (G.lesson && G.lesson.id === 'reach') lessonReset(G); return false; }
  if (best.dyno) { G.misses++; G.st -= 0.035 * Math.min(4, G.misses) * (G.lesson ? 0 : 1); G.ev.push({ k: 'needjump', l, i: best.i }); return false; }      // too far: it needs a jump (hold on it, let go in the green)
  return grab(G, l, best.i);
}
function grab(G, l, i) {
  const S = tryStance(G, l, i); if (!S) return false; const h = G.route.holds[i], from = G.route.holds[G.S[l]], dist = Math.hypot(h.x - from.x, h.y - from.y);
  G.S = S; G.body = solve(G, S); G.misses = 0; G.moves++;
  if (!G.lesson) G.st -= (0.008 + 0.03 * Math.max(0, G.body.strain - 0.8)) * (isHand(l) ? 1 : 0.5);
  if (h.line === 0 || h.line === 1) G.used[h.line]++;
  G.ev.push({ k: 'grab', l, i, ty: h.ty, dist });
  afterMove(G, l, i); return true;
}
function afterMove(G, l, i) {
  const h = G.route.holds[i];
  G.maxY = Math.max(G.maxY, G.body.y);
  for (const b of G.route.bolts) if (!b.clip && !b.skip && G.body.y + SHY > b.y && Math.abs(G.body.x - b.x) < 1.0) { b.clip = true; G.cp = Object.assign({}, G.S); G.ev.push({ k: 'clip', x: b.x, y: b.y }); for (const q of G.route.bolts) if (!q.clip && Math.abs(q.y - b.y) < 0.5) q.skip = true; G.clips++; lessonSee(G, 'clip'); break; }      // one clip per bolt height
  if (G.lesson && G.lesson.id === 'reach' && isHand(l)) { if (i === G.gold) { lessonSee(G, 'gold'); if (G.lesson) pickGold(G); } else lessonReset(G); }
  if (h.ty === 'top' && isHand(l) && !G.lesson) { G.phase = 'top'; G.topT = 1.4; G.ev.push({ k: 'top' }); }
}
// the jump: drag a hand onto a far hold and keep your finger there: you load up (a bar fills); let go in the green to jump
function dynoStart(G, l, i) { if (G.over || G.phase !== 'climb' || G.dyno || G.look) return false; const h = G.route.holds[i]; if (!h || !h.dyno || !isHand(l) || !canDyno(G, l, h)) return false;
  const R = Math.random; G.dyno = { l, i, t: 0, g0: 0.45 + R() * 0.3, gw: 0.2 }; G.ev.push({ k: 'load' }); return true; }
function dynoCancel(G) { if (G.dyno) { G.dyno = null; G.ev.push({ k: 'unload' }); } }
const dynoP = G => G.dyno ? Math.min(1.15, G.dyno.t / 1.1) : 0;
function dynoGo(G) { const D = G.dyno; if (!D) return false; G.dyno = null; const p = dynoP({ dyno: D });
  if (p >= D.g0 && p <= D.g0 + D.gw) {      // caught it: the hand lands, the other hand matches onto the same big hold, feet find the wall
    const h = G.route.holds[D.i], o = D.l === 'lh' ? 'rh' : 'lh'; const S = Object.assign({}, G.S); S[D.l] = D.i; S[o] = D.i; let T = chooseFeet(G, S) || Object.assign(S, { lf: -1, rf: -1 });
    G.S = T; G.body = solve(G, T); G.dynos++; G.used[1]++; G.st -= 0.06; G.ev.push({ k: 'caught', i: D.i }); afterMove(G, D.l, D.i); return true; }
  G.ev.push({ k: 'jumpmiss', early: p < D.g0 }); fall(G); return false; }
function preview(G) { if (G.over || G.phase !== 'climb') return false; if (G.look) { G.look = null; G.ev.push({ k: 'lookend' }); return true; } G.look = { t: 0, T: 3 + G.route.H * 0.12 }; G.ev.push({ k: 'look' }); return true; }
function fall(G) {
  if (G.phase === 'fall' || G.over) return; G.phase = 'fall'; G.fallT = 1.8; G.dyno = null; G.ev.push({ k: 'fall', y: G.body.y });
  if (G.lesson) return; G.falls++;
}
function step(G, dt) {
  if (G.over || !(dt > 0)) return; const c = G.cfg;
  if (G.look) { G.look.t += dt; if (G.look.t >= G.look.T) { G.look = null; G.ev.push({ k: 'lookend' }); } return; }      // looking at the route stops the clock
  G.t += dt; if (G.lesson) lessonTick(G, dt);
  if (G.phase === 'top') { G.topT -= dt; if (G.topT <= 0) finish(G, true); return; }
  if (G.phase === 'fall') { G.fallT -= dt; if (G.fallT <= 0) { if (G.falls >= c.lives) return finish(G, false); G.S = Object.assign({}, G.cp); G.body = solve(G, G.S); G.st = 1; G.phase = 'climb'; G.misses = 0; G.ev.push({ k: 'back' }); } return; }
  if (G.dyno && G.blindRel != null) { G.blindRel -= dt; if (G.blindRel <= 0) { G.blindRel = null; dynoGo(G); return; } }
  if (G.dyno) { G.dyno.t += dt; if (G.dyno.t > 1.35) { const D = G.dyno; G.dyno = null; G.ev.push({ k: 'jumpmiss', late: true }); fall(G); return; } }
  // the grip
  const hs = G.route.holds, S = G.S, b = G.body, fs = footSup(G, S), load = clamp(1 - fs, 0.22, 1);
  const hc = ['lh', 'rh'].reduce((a, l) => a + (S[l] >= 0 ? HT[hs[S[l]].ty].hand : 0.12), 0), strMul = b.strain > 0.9 ? 1 + (b.strain - 0.9) * 8 : 1;
  const drain = hc * load * 1.8 * strMul * c.drain * (G.dyno ? 1.5 : 1);
  const good = ['lh', 'rh'].every(l => S[l] >= 0 && HT[hs[S[l]].ty].good), ledge = ['lh', 'rh'].some(l => S[l] >= 0 && HT[hs[S[l]].ty].rest);
  const rest = good && fs >= 0.5 && b.strain < 1.0 ? (ledge ? 0.17 : 0.085) * c.restUp : 0;
  if (rest && !G.resting) G.rests++; G.resting = rest > 0 && rest > drain;
  G.st = clamp(G.st + (rest - drain) * dt, G.lesson && G.lesson.id !== 'rest' ? 0.3 : -0.01, 1);
  if (G.lesson && G.lesson.id === 'rest' && G.st >= 0.95 && ledge && good) lessonSee(G, 'rested');
  if (G.lesson && G.lesson.id === 'rest' && !ledge) G.st = Math.min(G.st, 0.3);      // (the lesson: only the ledge rests you)
  if (G.phase === 'slip') { if (G.st > 0.06) { G.phase = 'climb'; G.ev.push({ k: 'saved' }); } else { G.slipT -= dt; if (G.slipT <= 0) fall(G); } }
  else if (G.st <= 0) { G.phase = 'slip'; G.slipT = 1.3; G.ev.push({ k: 'slip' }); }
}
function finish(G, win) {
  if (G.over) return; G.over = win ? 'won' : 'lost'; const c = G.cfg, H = G.route.H, direct = G.used[1] > G.used[0];
  const stars = win ? (G.falls === 0 ? 3 : G.falls === 1 ? 2 : 1) : 0;
  const coins = win ? 8 + Math.round(H * 0.8) + (direct ? 12 : 0) + stars * 4 : Math.round(Math.max(0, G.maxY) * 0.4);
  G.res = { win, stars, coins, time: G.t, falls: G.falls, H, reached: Math.round(Math.max(0, Math.min(H, G.maxY + SHY + 0.8))), direct, rests: G.rests, moves: G.moves, dynos: G.dynos };
  G.ev.push({ k: win ? 'won' : 'lost' });
}

// ---------- LESSONS: reach (three gold holds in a row), rest (on the ledge until the grip is full), the rope (two bolts) ----------
const LESSONS = {
  1: [{ id: 'reach', title: 'REACH', say: G => climbCue(G)[0], do: G => climbCue(G)[1], at: G => climbCue(G)[2], how: 'Drag a hand onto the GOLD hold. Let go near it and you grab it. Three gold holds in a row.', need: 3 }],
  2: [{ id: 'rest', title: 'REST', say: G => climbCue(G)[0], do: G => climbCue(G)[1], at: G => climbCue(G)[2], how: 'Your grip is low (the bar). Get BOTH hands onto the big ledge and hang there until the bar is full.', need: 1 }],
  3: [{ id: 'clip', title: 'THE ROPE', say: G => climbCue(G)[0], do: G => climbCue(G)[1], at: G => climbCue(G)[2], how: 'Climb past two bolts. The rope clips in as you go, and catches you there if you slip.', need: 2 }],
};
// THE TUTORIAL'S HAND DRAGS THE RIGHT LIMB TO THE RIGHT HOLD (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing
// happens"). It drew a drag upward in a little box; a drag that does not start ON a hand or foot only moves the view. Now the hand starts on
// the limb the robot would move and ends on the hold (asked of the robot itself, dry: it does nothing, with its slips switched off);
// REST… HANG ON when it would rest; WAIT while the climber moves.
const CLC = { t: -1e9, v: null };
function climbCue(G) { if (G.over || (G.phase !== 'climb' && G.phase !== 'slip') || G.look) return ['WAIT…', 'wait', false];
  if (G.dyno) return ['LET GO TO JUMP', 'release', false];
  const now = performance.now(); if (now - CLC.t < 350 && CLC.g === G) return CLC.v; CLC.t = now; CLC.g = G;
  const save = Math.random, mem = { dry: true }; Math.random = () => 0.5; try { honest(G, { acc: 1, react: 0.3 }, mem); } finally { Math.random = save; }
  let v = ['WAIT…', 'wait', false]; const P = mem.plan;
  if (P === 'rest') v = ['REST… HANG ON', 'wait', false];
  else if (P && P.t) { const hs = G.route.holds, c = at(G, P.l), h = hs[P.t.i], a = scrOf(G, c.x, c.y), b = scrOf(G, h.x, h.y);
    if (a && b) v = [G.lesson && G.lesson.id === 'reach' && P.t.i === G.gold ? 'DRAG IT TO THE GOLD' : isHand(P.l) ? 'DRAG THIS HAND' : 'DRAG THIS FOOT', 'drag', [a.x, a.y, b.x, b.y]]; }
  CLC.v = v; return v; }
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0, id: LESSONS[G.N][0].id }; G.ev.push({ k: 'lessonnext', first: true }); lessonSetup(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonSetup(G) { const D = G.lesson; setup(G, D.id); if (D.id === 'reach') pickGold(G); if (D.id === 'rest') G.st = 0.3; }
function pickGold(G) {      // the next gold hold: up the easy line, one a hand can reach from here
  let best = -1, by = -9; for (const l of ['lh', 'rh']) for (const t of targets(G, l)) { const h = G.route.holds[t.i]; if (t.dyno || h.line !== 0 || HT[h.ty].hand == null) continue; const y = h.y - Math.abs(h.x - G.body.x) * 0.2; if (y > by && h.y > G.route.holds[G.S[l]].y + 0.2) { by = y; best = t.i; } }
  if (best < 0) for (const l of ['lh', 'rh']) for (const t of targets(G, l)) if (!t.dyno && G.route.holds[t.i].y > by) { by = G.route.holds[t.i].y; best = t.i; }
  G.gold = best; G.ev.push({ k: 'gold', i: best }); }
function lessonReset(G) { const D = G.lesson; if (!D || !D.n) return; D.n = 0; G.ev.push({ k: 'lessonmiss', how: lessonNow(G).how }); }
function lessonSee(G, what) {
  const D = G.lesson; if (!D || D.done) return; const st = D.steps[D.i];
  if (!(st.id === 'reach' && what === 'gold' || st.id === 'rest' && what === 'rested' || st.id === 'clip' && what === 'clip')) return;
  D.n++; if (D.n < st.need) { G.ev.push({ k: 'lessonok', n: D.n, need: st.need }); return; }
  D.done = true; D.wait = 1.2; G.ev.push({ k: 'lessonok', n: D.n, need: st.need });
}
function lessonTick(G, dt) { const D = G.lesson; if (!D.done) return; D.wait -= dt; if (D.wait > 0) return; G.lesson = null; G.gold = -1; setup(G); G.ev.push({ k: 'lessondone', N: G.N }); }

// ---------- for the robots: blind moves and an honest climber ----------
const rl = G => { const ls = G.cfg.feet === 'auto' ? ['lh', 'rh'] : LIMBS; return ls[(Math.random() * ls.length) | 0]; };
const at = (G, l) => { const i = G.S[l]; if (i >= 0) return G.route.holds[i]; return sh(G.body, l); };
const BLIND = {
  u: G => { const l = Math.random() < 0.5 ? 'lh' : 'rh', h = at(G, l); move(G, l, h.x, h.y + 0.9); },                                    // push a hand straight up
  d: G => { const l = rl(G), h = at(G, l), a = Math.random() * TAU, r = 0.4 + Math.random() * 1.2; move(G, l, h.x + Math.cos(a) * r, h.y + Math.sin(a) * r); },   // drag any limb anywhere near
  f: G => { const l = Math.random() < 0.5 ? 'lf' : 'rf', h = at(G, l); move(G, l, h.x, h.y + 0.6); },                                    // a foot up
  j: G => { const l = Math.random() < 0.5 ? 'lh' : 'rh', d = G.route.holds.find(h => h.dyno && canDyno(G, l, h)); if (d && dynoStart(G, l, d.i)) G.blindRel = 0.1 + Math.random() * 1.3; },   // hold on a far hold and let go whenever
  p: G => preview(G),
};
// how far each hand hold is from the top, along holds a hand can go between (a person who has looked at the route knows this)
function toTop(G) { const hs = G.route.holds.filter(h => HT[h.ty].hand != null), D = new Map(); const todo = hs.filter(h => h.ty === 'top'); todo.forEach(h => D.set(h.i, 0));
  while (todo.length) { todo.sort((a, b) => D.get(b.i) - D.get(a.i)); const h = todo.pop(), d0 = D.get(h.i);
    for (const q of hs) { const dd = Math.hypot(q.x - h.x, q.y - h.y); if (dd > 1.25 || q.y > h.y + 0.4) continue; const d = d0 + dd + HT[q.ty].hand * 6; if (d < (D.has(q.i) ? D.get(q.i) : 1e9)) { D.set(q.i, d); todo.push(q); } } }
  return D; }
function honest(G, o, mem) {
  if (G.over) return; const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random, hs = G.route.holds;
  if (G.look) { preview(G); return; }
  if (G.dyno) { if (mem.rel == null) mem.rel = G.dyno.g0 + G.dyno.gw * (0.5 + (R() - 0.5) * (1.6 - acc)); if (dynoP(G) >= mem.rel) { mem.rel = null; dynoGo(G); } return; }
  if (G.phase !== 'climb' && G.phase !== 'slip') { mem.next = G.t + 0.4; return; }
  if (G.t < (mem.next || 0) && !mem.dry) return;
  mem.next = G.t + 0.45 + react * 1.6 + R() * 0.3;
  const S = G.S, fs = footSup(G, S), good = ['lh', 'rh'].every(l => S[l] >= 0 && HT[hs[S[l]].ty].good), resting = good && fs >= 0.5 && G.body.strain < 1.0;
  if (resting && G.st < (mem.restTo || 0.9) && !(G.lesson && G.lesson.id === 'reach')) { mem.restTo = 0.88 + R() * 0.1; if (mem.dry) mem.plan = 'rest'; return; }
  const ls = G.cfg.feet === 'auto' && !G.lesson ? ['lh', 'rh'] : LIMBS; let best = null, bv = -1e9;
  const hy = Math.max(hs[S.lh] ? hs[S.lh].y : 0, hs[S.rh] ? hs[S.rh].y : 0);
  if (mem.D == null || mem.Dfor !== G.route) { mem.D = toTop(G); mem.Dfor = G.route; }
  { const dNow = Math.min(mem.D.get(S.lh) ?? 99, mem.D.get(S.rh) ?? 99); let g = -9; for (const q of ['lh', 'rh']) for (const t2 of targets(G, q)) if (!t2.dyno) g = Math.max(g, dNow - (mem.D.get(t2.i) ?? 99)); mem.gain = g; }      // can a hand get on from here? if not, step up
  for (const l of ls) { const cur = at(G, l);
    for (const t of targets(G, l)) { const h = hs[t.i]; let v;
      if (G.lesson && G.lesson.id === 'reach') v = t.i === G.gold ? 10 : -5;
      else if (G.lesson && G.lesson.id === 'rest') v = h.ty === 'ledge' ? 5 + (isHand(l) ? 1 : 0) : -5;
      else if (t.dyno) v = 1.2 + (h.y - hy) * 0.8 - (1 - acc) * 2;
      else if (isHand(l)) { const S2 = tryStance(G, l, t.i), b2 = solve(G, S2); const ok2 = ['lh', 'rh'].every(q => HT[hs[S2[q]].ty].good);
        if (mem.D == null || mem.Dfor !== G.route) { mem.D = toTop(G); mem.Dfor = G.route; } const dNow = Math.min(mem.D.get(S.lh) ?? 99, mem.D.get(S.rh) ?? 99), dT = mem.D.get(t.i) ?? 99;
        v = (dNow - dT) * 2.2 - HT[h.ty].hand * 10 - b2.strain * 0.8 + (h.ty === 'top' ? 9 : 0) + (G.st < 0.6 && ok2 && footSup(G, S2) >= 0.5 ? 3 : 0) + (dT < (mem.D.get(S[l]) ?? 99) - 0.1 ? 0.6 : -0.6); }
      else { const S2 = tryStance(G, l, t.i), b2 = solve(G, S2); v = (mem.gain < 0.3 ? (b2.y - G.body.y) * 5 + (footSup(G, S2) - footSup(G, S)) * 3 : (footSup(G, S2) - footSup(G, S)) * 14 - 0.7) - (b2.strain - G.body.strain) * 2 - (mem.prev && mem.prev[l] === t.i ? 2.5 : 0); }
      v += R() * 0.25; if (v > bv) { bv = v; best = { l, t }; } } }
  if (mem.dry) { mem.plan = best && bv >= -2 ? best : null; return; }      // the tutorial asks what the robot would do, and does nothing (climbCue)
  if (!best || bv < -2) { mem.next = G.t + 0.8; return; }
  const h = hs[best.t.i];
  if (best.t.dyno) { if (G.st > 0.5) dynoStart(G, best.l, h.i); return; }
  mem.prev = mem.prev || {}; mem.prev[best.l] = G.S[best.l];
  if (R() < acc) move(G, best.l, h.x + (R() - 0.5) * 0.12, h.y + (R() - 0.5) * 0.12); else { const a = R() * TAU; move(G, best.l, h.x + Math.cos(a) * 0.45, h.y + Math.sin(a) * 0.45); }
}
function winNow(G) { if (!G || G.over || G.lesson) return; const top = G.route.holds.find(h => h.ty === 'top'); G.phase = 'top'; G.topT = 0.01; G.ev.push({ k: 'top' }); step(G, 0.02); }
