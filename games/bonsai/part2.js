// ===================== RULES: Bonsai (game 41, the calm one of set 7) =====================
// Grow a little tree in a pot through the seasons into the shape the festival asks for (a faint outline behind it). Buds sit
// at the tips of the branches: tap one and it grows a branch with a pad of leaves, the way it points. Growing costs sap; each
// season gives some. A bud you leave alone grows by itself in summer, wild and long, any way it likes: tap a branch to prune it
// (and everything beyond it). In summer caterpillars come for the leaves: tap one to flick it off before it eats a pad. In
// winter nothing grows: the last chance to tidy. At the end of the last winter the judges compare your tree to the outline:
// leaves inside count for you, leaves outside against you. No clock to beat, but the seasons turn (the Next season button
// turns them sooner).
// World: metres-ish; x across (+ right), y up; the trunk stands on the soil at (0, 0).
const RULES = [
  '<b>Tap a bud</b> (the little pink dots at the branch tips) to grow a branch that way. Growing costs <b>sap</b>.',
  'Grow your tree into the <b>outline</b>. Leaves inside it count for you; leaves outside count against you.',
  'Buds you leave alone grow <b>wild</b> in summer. <b>Tap a branch</b> to prune it (and everything beyond it).',
  'In summer <b>caterpillars</b> come for the leaves: tap one to flick it off before it eats.',
  'Winter: nothing grows, a last chance to tidy. Then the <b>festival</b> judges your tree.',
];
const SPECIES = [
  { id: 'juniper', name: 'Juniper', leaf: 0x3f7a3a, leaf2: 0x6aa04a, aut: 0x5a7a3a, bark: 0x6a4a32, stars: 0 },
  { id: 'maple', name: 'Red maple', leaf: 0x5aa040, leaf2: 0x9ad060, aut: 0xd8402a, bark: 0x5a3a2a, stars: 4 },
  { id: 'pine', name: 'Black pine', leaf: 0x2a5a3a, leaf2: 0x4a8a5a, aut: 0x2a5a3a, bark: 0x4a3a30, stars: 10 },
  { id: 'cherry', name: 'Cherry', leaf: 0x6aa050, leaf2: 0xffb0c8, aut: 0xd8902a, bark: 0x5a3434, bloom: 0xffb0c8, stars: 18 },
  { id: 'wisteria', name: 'Wisteria', leaf: 0x6a9a48, leaf2: 0xb08aff, aut: 0xc8b040, bark: 0x6a5a48, bloom: 0xb08aff, stars: 28 },
  { id: 'ginkgo', name: 'Ginkgo', leaf: 0x7ab040, leaf2: 0xb0d860, aut: 0xffd040, bark: 0x6a5a40, stars: 40 },
];
// the shapes the festival asks for: ovals of leaves (cx, cy, rx, ry)
const STYLES = [
  { id: 'upright', name: 'Formal upright', d: 0, e: [[0, 1.0, 0.52, 0.48]] },
  { id: 'broom', name: 'Broom', d: -8, e: [[0, 0.9, 0.74, 0.38]] },
  { id: 'slant', name: 'Slanting', d: -10, e: [[0.3, 0.98, 0.46, 0.38], [-0.26, 0.7, 0.3, 0.2]] },
  { id: 'wind', name: 'Windswept', d: -5, e: [[0.4, 0.86, 0.64, 0.32]] },
  { id: 'clouds', name: 'Clouds', d: -14, e: [[0.02, 1.34, 0.36, 0.25], [-0.44, 0.86, 0.33, 0.22], [0.44, 0.72, 0.33, 0.22]] },
  { id: 'tall', name: 'Literati', d: -3, e: [[-0.1, 1.42, 0.38, 0.28], [0.24, 0.98, 0.32, 0.21]] },
];
const PLACES = [{ name: 'The garden pond' }, { name: 'The temple yard' }, { name: 'The mountain hut' }, { name: 'The festival hall' }];
const placeOf = N => Math.floor((N - 1) / 5) % PLACES.length;
const SEASONS = ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'];
const UPGRADES = [
  { id: 'soil', name: 'Rich soil', desc: 'One more sap every spring and summer.', max: 2, cost: l => 25 + l * 30 },
  { id: 'eye', name: 'Gardener\'s eye', desc: 'Buds show where they will grow.', max: 1, cost: l => 20 },
  { id: 'birds', name: 'Birdhouse', desc: 'Birds eat some caterpillars: fewer come.', max: 2, cost: l => 25 + l * 30 },
  { id: 'shears', name: 'Sharp shears', desc: 'Pruning a branch gives back 1 sap.', max: 1, cost: l => 40 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Seedling'], [40, 'Gardener'], [130, 'Shaper'], [320, 'Bonsai artist'], [700, 'Master'], [1500, 'Living treasure']];
function mySpecies() { if (typeof HEADLESS !== 'undefined' && HEADLESS) return SPECIES[0]; const id = store.get('species', 'juniper'); return SPECIES.find(s => s.id === id) || SPECIES[0]; }
const SEG = 0.27, PAD = 0.17, SPREAD = 0.62, MAXD = 7, BUDOFF = 0.08;
const budX = b => b.x + Math.cos(b.ang) * BUDOFF, budY = b => b.y + Math.sin(b.ang) * BUDOFF;
function makeCfg(N, help) {
  const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), e = easyOf(N);
  const style = N <= 2 ? (N === 1 ? 0 : 1) : N === 3 ? 0 : (N * 7 + 3) % STYLES.length;
  return { N, f, help: !!help, place: placeOf(N), style,
    years: N <= 4 ? 1 : 2, len: x(15, 11, 30) * (help ? 1.2 : 1),           // seconds a season lasts (winter a little shorter)
    need: Math.round(x(50, 64, 30) + STYLES[style].d - (help ? 5 : 0)),                         // how good the match must be (per cent)
    sap: [Math.round(x(9, 6, 30)) + upLv('soil'), Math.round(x(6, 4, 30)) + upLv('soil'), 2, 0],   // sap each season gives
    wild: x(3.0, 1.8, 30) * (1 + 0.3 * e),                                   // seconds between wild shoots in summer
    pest: N >= 3 ? x(6, 3.2, 30) * (1 + 0.25 * upLv('birds')) * (1 + 0.3 * e) : 0, eat: x(5, 3.4, 30) * (help ? 1.3 : 1),
    jit: N <= 3 ? 0 : 0.08 };
}
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, place: cfg.place,
    sp: o.species || mySpecies(), nodes: [], buds: [], pests: [], season: 0, year: 0, sT: 0, sap: 0, nid: 1, grown: 0, wildN: 0, pruned: 0, flicked: 0, eaten: 0, coins: 0, wildT: 0, pestT: 0, match: 0, best: 0, mT: 0 };
  setShape(G); plant(G);
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else { G.sap = cfg.sap[0]; G.ev.push({ k: 'start' }); }
  rate(G); return G;
}
// the outline for this level (later levels nudge it a little so no two trees are the same)
function setShape(G) { const c = G.cfg, R = G.rnd, S = STYLES[c.style], fl = !!(c.jit && R() < 0.5);
  G.shape = { name: S.name, e: S.e.map(q => [(fl ? -q[0] : q[0]) + (R() - 0.5) * c.jit, q[1] + (R() - 0.5) * c.jit, q[2] * (1 + (R() - 0.5) * c.jit), q[3] * (1 + (R() - 0.5) * c.jit)]) }; }
// a young tree: a trunk and a first fork
function plant(G, bare) { G.nodes = []; G.buds = []; const tr = addNode(G, null, Math.PI / 2, 0.5, false); tr.g = 1; tr.trunk = true; let scaf = 0;
  // nursery stock: bare branches already heading for each part of the outline that is far from the trunk
  if (!bare) for (const q of G.shape.e) { let par = tr; const tx = q[0], ty = q[1] - q[3] * 0.55; for (let i = 0; i < 6; i++) { const dx = tx - par.x, dy = ty - par.y, d = Math.hypot(dx, dy); if (d < SEG * 0.9) break; const n = addNode(G, par, Math.atan2(dy, dx), SEG, false); n.g = 1; n.bare = true; par = n; }
    if (par !== tr) { budsAt(G, par); scaf++; } }
  if (!scaf) budsAt(G, tr); }
function addNode(G, par, ang, len, wild) { const x0 = par ? par.x : 0, y0 = par ? par.y : 0, n = { id: G.nid++, par: par ? par.id : 0, x0, y0, x: x0 + Math.cos(ang) * len, y: y0 + Math.sin(ang) * len, ang, len, d: par ? par.d + 1 : 0, g: 0, wild, r: PAD * (wild ? 1.15 : 1), eat: 1, kids: 0 };
  if (par) par.kids++; G.nodes.push(n); return n; }
const nodeById = (G, id) => G.nodes.find(n => n.id === id);
// two buds at a tip, splayed either side of the way it points (pulled a little upward, as trees grow toward light)
// spring: every branch with room for another (fewer than two going on from it) puts out buds again
function springBuds(G) { for (const n of G.nodes) if (n.g >= 1 && n.kids < 2 && n.d < MAXD && !G.buds.some(b => b.n === n.id)) budsAt(G, n, n.kids ? 1 : 2); }
function budsAt(G, n, want = 2) { if (n.d >= MAXD) return; const R = G.rnd, up = Math.PI / 2;
  const sides = want === 1 ? [R() < 0.5 ? -1 : 1] : [-1, 1]; for (const s of sides) { let a = n.ang + s * SPREAD * (0.75 + R() * 0.5); a += (up - a) * 0.08; if (a < -0.25 || a > Math.PI + 0.25) continue; G.buds.push({ id: G.nid++, n: n.id, ang: a, x: n.x, y: n.y, age: 0 }); } }
// how big a pad of leaves is now (a branch with branches beyond it keeps a smaller pad; a pad eaten by caterpillars is thin)
const padR = n => n.trunk || n.bare ? 0 : n.r * n.g * (n.kids ? 0.72 : 1) * n.eat;
// ---------- what you do ----------
// the one action: a tap at a point of the world. A caterpillar first, then a bud, then a branch.
function tap(G, x, y) {
  if (G.over || G.wait > 0) return false;
  let best = null, bd = 0.11; for (const p of G.pests) { const d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; best = p; } }
  if (best) { G.pests.splice(G.pests.indexOf(best), 1); G.flicked++; G.coins++; G.ev.push({ k: 'flick', x: best.x, y: best.y }); lessonSee(G, 'flick'); return true; }
  // a bud and a branch can both be near: the one the tap is closer to (for its size) wins
  let bb = null, bbs = 1; for (const b of G.buds) { const q = Math.hypot(budX(b) - x, budY(b) - y) / 0.1; if (q < bbs) { bbs = q; bb = b; } }
  let bn = null, bs = 1; for (const n of G.nodes) { if (n.trunk || n.bare || n.g < 0.5) continue; const ds = segDist(x, y, n), dp = Math.hypot(n.x - x, n.y - y) / Math.max(0.05, padR(n) * 0.8), q = Math.min(ds / 0.05, dp); if (q < bs) { bs = q; bn = n; } }
  if (bb && (!bn || bbs <= bs)) return grow(G, bb, false);
  if (bn) return prune(G, bn);
  G.ev.push({ k: 'empty', x, y }); if (G.lesson) lessonMiss(G); return false;
}
function segDist(px, py, n) { const vx = n.x - n.x0, vy = n.y - n.y0, L2 = vx * vx + vy * vy, u = clamp(((px - n.x0) * vx + (py - n.y0) * vy) / L2, 0, 1); return Math.hypot(n.x0 + vx * u - px, n.y0 + vy * u - py); }
function grow(G, b, wild) {
  if (!wild) { if (G.season === 3 && !G.lesson) { G.ev.push({ k: 'winter' }); return false; } if (G.sap <= 0 && !G.lesson) { G.ev.push({ k: 'nosap', x: b.x, y: b.y }); return false; } if (!G.lesson) G.sap--; }
  const par = nodeById(G, b.n); G.buds.splice(G.buds.indexOf(b), 1); if (!par) return false;
  const R = G.rnd, ang = wild ? b.ang + (R() - 0.5) * 1.1 : b.ang, n = addNode(G, par, ang, SEG * (wild ? 1.45 : 1), wild);
  if (wild) G.wildN++; else G.grown++;
  G.ev.push({ k: wild ? 'wild' : 'grow', id: n.id, x: n.x, y: n.y }); if (!wild) lessonSee(G, 'grow', n); return true;
}
function prune(G, n) {
  const gone = new Set([n.id]); let more = true; while (more) { more = false; for (const q of G.nodes) if (!gone.has(q.id) && gone.has(q.par)) { gone.add(q.id); more = true; } }
  const cut = G.nodes.filter(q => gone.has(q.id)), out = outsideShare(G, cut); G.nodes = G.nodes.filter(q => !gone.has(q.id)); G.buds = G.buds.filter(b => !gone.has(b.n)); G.pests = G.pests.filter(p => !gone.has(p.n));
  const par = nodeById(G, n.par); if (par) { par.kids--; if (!par.kids && (G.season < 2 || G.lesson)) budsAt(G, par); }
  G.pruned++; if (upLv('shears') && !G.lesson) G.sap++;
  G.ev.push({ k: 'prune', x: n.x0, y: n.y0, cut: cut.map(q => ({ x0: q.x0, y0: q.y0, x: q.x, y: q.y, r: padR(q), wild: q.wild })), out }); lessonSee(G, 'prune', null, out); return true;
}
// turn the season now (the Next season button)
function nextSeason(G) { if (G.over || G.lesson || G.wait > 0) return false; G.sT = seasonLen(G); return true; }
const seasonLen = G => G.cfg.len * (G.season === 3 ? 0.6 : 1);
// ---------- judging: the outline against the leaves ----------
// a grid over the pot's whole space; each point is inside the outline or not, under leaves or not
const GX0 = -1.4, GY0 = 0.1, GS = 0.05, GW = 57, GH = 46;
function inShape(G, x, y) { for (const q of G.shape.e) { const dx = (x - q[0]) / q[2], dy = (y - q[1]) / q[3]; if (dx * dx + dy * dy <= 1) return true; } return false; }
function shapeGrid(G) { if (G.sg) return G.sg; const s = new Uint8Array(GW * GH); let tot = 0; for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) if (inShape(G, GX0 + i * GS, GY0 + j * GS)) { s[j * GW + i] = 1; tot++; } G.sg = s; G.sgTot = tot; return s; }
function coverGrid(G, nodes, skip) { const c = new Uint8Array(GW * GH); for (const n of nodes) { if (skip && skip.has(n.id)) continue; const r = padR(n); if (r <= 0.01) continue; const i0 = Math.max(0, Math.floor((n.x - r - GX0) / GS)), i1 = Math.min(GW - 1, Math.ceil((n.x + r - GX0) / GS)), j0 = Math.max(0, Math.floor((n.y - r - GY0) / GS)), j1 = Math.min(GH - 1, Math.ceil((n.y + r - GY0) / GS));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const dx = GX0 + i * GS - n.x, dy = GY0 + j * GS - n.y; if (dx * dx + dy * dy <= r * r) c[j * GW + i] = 1; } } return c; }
function scoreOf(G, cov) { const s = shapeGrid(G); let good = 0, bad = 0; for (let i = 0; i < s.length; i++) if (cov[i]) { if (s[i]) good++; else bad++; } return { good, bad, pct: clamp(Math.round((good - 1.2 * bad) / G.sgTot * 100), 0, 100) }; }
function rate(G) { const r = scoreOf(G, coverGrid(G, G.nodes)); G.match = r.pct; G.good = r.good; G.bad = r.bad; G.best = Math.max(G.best, r.pct); return r.pct; }
// how much of a set of pads lies outside the outline (0..1), for the honest call on a cut
function outsideShare(G, nodes) { let a = 0, o = 0; for (const n of nodes) { const r = padR(n); if (r <= 0.01) continue; for (let k = 0; k < 8; k++) { const t = k / 8 * TAU, x = n.x + Math.cos(t) * r * 0.6, y = n.y + Math.sin(t) * r * 0.6; a++; if (!inShape(G, x, y)) o++; } a++; if (!inShape(G, n.x, n.y)) o++; } return a ? o / a : 0; }
// ---------- the seasons, step by step ----------
function step(G, dt) {
  if (G.over) return; G.t += dt; const c = G.cfg;
  if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0 && G.lessonEnd) { G.lessonEnd = false; Object.assign(G, { season: 0, year: 0, sT: 0, sap: c.sap[0], grown: 0, wildN: 0, pruned: 0, flicked: 0, eaten: 0, coins: 0, pests: [], best: 0 }); plant(G); G.ev.push({ k: 'start' }); } if (G.wait > 0) return; }
  for (const n of G.nodes) if (n.g < 1) { n.g = Math.min(1, n.g + dt / 0.7); if (n.g >= 1 && (G.season < 2 || G.lesson) && !n.kids) budsAt(G, n); }
  for (const b of G.buds) b.age += dt;
  // caterpillars crawl toward the middle of their pad; when they have been there long enough they eat it
  for (let i = G.pests.length - 1; i >= 0; i--) { const p = G.pests[i], n = nodeById(G, p.n); if (!n) { G.pests.splice(i, 1); continue; } p.t += dt; p.x += (n.x - p.x) * Math.min(1, dt * 0.8); p.y += (n.y - p.y) * Math.min(1, dt * 0.8);
    if (p.t >= p.eat) { G.pests.splice(i, 1); n.eat = Math.max(0.3, n.eat * 0.45); G.eaten++; G.ev.push({ k: 'eaten', x: n.x, y: n.y }); lessonMiss(G); } }
  if (G.lesson) { lessonTick(G, dt); G.mT -= dt; if (G.mT <= 0) { G.mT = 0.3; rate(G); } return; }
  // summer: the buds you left grow wild; caterpillars come
  if (G.season === 1) { G.wildT += dt; if (G.wildT >= c.wild && G.buds.length) { G.wildT = 0; const old = G.buds.filter(b => b.age > 2.5); if (old.length) grow(G, old[(G.rnd() * old.length) | 0], true); } }
  if (c.pest && G.season === 1 || c.pest && G.season === 2 && G.sT < c.len * 0.4) { G.pestT += dt; if (G.pestT >= c.pest) { G.pestT = 0; spawnPest(G, c.eat); } }
  G.sT += dt; if (G.sT >= seasonLen(G)) { G.sT = 0; turn(G); if (G.over) return; }
  G.mT -= dt; if (G.mT <= 0) { G.mT = 0.3; rate(G); }
}
function spawnPest(G, eat) { const R = G.rnd, pads = G.nodes.filter(n => !n.trunk && n.g >= 1 && n.eat > 0.5 && !G.pests.some(p => p.n === n.id)); if (!pads.length) return; const n = pads[(R() * pads.length) | 0], a = R() * TAU;
  G.pests.push({ id: G.nid++, n: n.id, x: n.x + Math.cos(a) * padR(n) * 0.9, y: n.y + Math.sin(a) * padR(n) * 0.9, t: 0, eat }); G.ev.push({ k: 'pest', x: n.x, y: n.y }); }
function turn(G) { const c = G.cfg;
  if (G.season === 3) { G.year++; if (G.year >= c.years) { rate(G); return finish(G); } G.season = 0; for (const n of G.nodes) n.eat = 1; springBuds(G); }
  else G.season++;
  if (G.season === 3) { G.buds = []; G.pests = []; }      // winter: the buds that were not grown wither
  if (G.season === 2) G.pests = G.pests.filter(p => p.t < p.eat);
  G.sap += c.sap[G.season]; G.wildT = 0; G.pestT = c.pest ? c.pest * 0.5 : 0;
  G.ev.push({ k: 'season', s: G.season, y: G.year });
}
function finish(G) { const c = G.cfg, win = G.match >= c.need; G.over = win ? 'won' : 'lost';
  const stars = win ? (G.match >= c.need + 16 ? 3 : G.match >= c.need + 8 ? 2 : 1) : 0;
  G.res = { win, stars, match: G.match, need: c.need, best: G.best, grown: G.grown, wild: G.wildN, pruned: G.pruned, flicked: G.flicked, eaten: G.eaten, coins: G.coins + (win ? 4 + Math.ceil(G.N / 3) + stars : 0), style: G.shape.name,
    tree: G.nodes.filter(n => n.g > 0.5).map(n => [+n.x0.toFixed(3), +n.y0.toFixed(3), +n.x.toFixed(3), +n.y.toFixed(3), +padR(n).toFixed(3)]), sp: G.sp.id };
  G.ev.push({ k: 'judge', match: G.match }); G.ev.push({ k: win ? 'won' : 'lost' }); return true; }
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'grow', title: 'GROW', say: 'TAP THIS BUD', do: 'tap', how: 'Tap a bud (a pink dot at a branch tip) whose branch would grow into the outline. Grow three.', need: 3 }],
  2: [{ id: 'prune', title: 'PRUNE', say: 'CUT THIS BRANCH', do: 'tap', how: 'Some branches grew wild, out of the outline. Tap each one to cut it off. Cut two.', need: 2 }],
  3: [{ id: 'flick', title: 'CATERPILLARS', say: 'TAP THE CATERPILLAR', do: 'tap', how: 'A caterpillar is on the leaves. Tap it to flick it off before it eats. Three times.', need: 3 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonSetup(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonSetup(G) { const st = lessonNow(G); plant(G); G.pests = []; G.sap = 99; G.season = st.id === 'flick' ? 1 : 0; G.lesson.pT = 1.2;
  if (st.id === 'prune' || st.id === 'flick') { const tr = G.nodes[0]; G.buds = []; const a = addNode(G, tr, Math.PI / 2 + 0.5, SEG, false), b = addNode(G, tr, Math.PI / 2 - 0.5, SEG, false); a.g = b.g = 1;
    const a2 = addNode(G, a, Math.PI / 2 + 0.2, SEG, false), b2 = addNode(G, b, Math.PI / 2 - 0.2, SEG, false); a2.g = b2.g = 1;
    if (st.id === 'prune') { const w1 = addNode(G, tr, Math.PI + 0.35, SEG * 1.9, true), w2 = addNode(G, b2, -1.0, SEG * 1.9, true); w1.g = w2.g = 1; } } }
function lessonTick(G, dt) { const st = lessonNow(G); if (!st) return;
  if (st.id === 'grow' && !G.buds.length && G.nodes.every(n => n.g >= 1)) plant(G);
  if (st.id === 'flick' && !G.pests.length) { G.lesson.pT -= dt; if (G.lesson.pT <= 0) { G.lesson.pT = 1.5; for (const n of G.nodes) n.eat = 1; spawnPest(G, 7); } }
  if (st.id === 'prune' && !G.nodes.some(n => n.wild)) { lessonSetup(G); } }
function lessonSee(G, what, n, out) { const st = lessonNow(G); if (!st) return; let ok = false;
  if (st.id === 'grow' && what === 'grow') { const inside = inShape(G, n.x, n.y); if (!inside) { G.lesson.n = 0; G.ev.push({ k: 'lessonmiss', how: 'That one grows out of the outline: pick a bud that points into it.' }); return; } ok = true; }
  if (st.id === 'prune' && what === 'prune') { if (out < 0.5) { G.lesson.n = 0; G.ev.push({ k: 'lessonmiss', how: 'That branch was inside the outline. Cut only the ones sticking out.' }); lessonSetup(G); return; } ok = true; }
  if (st.id === 'flick' && what === 'flick') ok = true;
  if (!ok) return; G.lesson.n++; if (G.lesson.n < st.need) { G.ev.push({ k: 'lessonok', n: G.lesson.n, need: st.need }); return; }
  G.lesson.i++; G.lesson.n = 0; if (G.lesson.i >= G.lesson.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.lessonEnd = true; G.wait = 1.4; } else lessonSetup(G); }
function lessonMiss(G) { const st = lessonNow(G); if (!st) return; G.lesson.n = 0; G.ev.push({ k: 'lessonmiss', how: st.how }); }
// ---------- for the robots ----------
// BLIND: a thumb that does not look: a tap somewhere on the tree's space, or the Next season button
const BLIND = { t: G => { const R = Math.random; tap(G, -1.2 + R() * 2.4, 0.2 + R() * 2.0); }, n: G => { nextSeason(G); } };
// a careful gardener: flicks caterpillars, grows the bud that adds the most leaves inside the outline, prunes the branch that
// costs more outside than it gives inside, and turns the season when nothing is worth doing (a person's eye: react, acc)
function honest(G, o, mem) {
  const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random;
  if (G.over || G.wait > 0) { mem.t0 = null; return; }
  if (mem.t0 == null) { mem.t0 = G.t + 0.35 + react * 1.2; return; } if (G.t < mem.t0) return; mem.t0 = null;
  const miss = () => R() > acc;      // now and then a person does the less good thing
  if (G.pests.length) { const p = G.pests.reduce((a, b) => a.t > b.t ? a : b); tap(G, p.x, p.y); return; }
  const s = shapeGrid(G), cov = coverGrid(G, G.nodes), val = (x, y, r) => { let v = 0; const i0 = Math.max(0, Math.floor((x - r - GX0) / GS)), i1 = Math.min(GW - 1, Math.ceil((x + r - GX0) / GS)), j0 = Math.max(0, Math.floor((y - r - GY0) / GS)), j1 = Math.min(GH - 1, Math.ceil((y + r - GY0) / GS));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const dx = GX0 + i * GS - x, dy = GY0 + j * GS - y, q = j * GW + i; if (dx * dx + dy * dy <= r * r && !cov[q]) v += s[q] ? 1 : -1.2; } return v; };
  // the worst branch: what is lost by cutting it (its leaves and those beyond it)
  let cutBest = null, cutV = -2.5;
  for (const n of G.nodes) { if (n.trunk || n.bare || n.g < 1) continue; const sub = new Set([n.id]); let more = true; while (more) { more = false; for (const q of G.nodes) if (!sub.has(q.id) && sub.has(q.par)) { sub.add(q.id); more = true; } }
    const without = scoreOf(G, coverGrid(G, G.nodes, sub)), now = { good: G.good, bad: G.bad }, gain = (without.good - now.good) - 1.2 * (without.bad - now.bad); if (gain > cutV) { cutV = gain; cutBest = n; } }
  if (cutBest && !miss()) { tap(G, (cutBest.x0 + cutBest.x) / 2, (cutBest.y0 + cutBest.y) / 2); return; }
  if (G.season < 3 && G.sap > 0) { let bb = null, bv = 1; for (const b of G.buds) { const x = b.x + Math.cos(b.ang) * SEG, y = b.y + Math.sin(b.ang) * SEG, v = val(x, y, PAD) * (G.year === G.cfg.years - 1 && G.season === 2 ? 1 : 0.7) + 0.6 * Math.max(0, val(x + Math.cos(b.ang) * SEG, y + Math.sin(b.ang) * SEG, PAD)) + 0.4 * Math.max(0, val(x + Math.cos(b.ang) * SEG * 2, y + Math.sin(b.ang) * SEG * 2, PAD)) + (G.season === 1 ? 2 : 0); if (v > bv) { bv = v; bb = b; } }
    if (bb && !miss()) { tap(G, budX(bb), budY(bb)); return; } }
  // nothing worth doing: the buds left would only grow wild, so in summer stay and tidy; otherwise turn the season
  const growing = G.nodes.some(n => n.g < 1); if (!growing && G.season !== 1 && !G.pests.length && G.sT > 2 + react * 4) nextSeason(G);
}
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.match = G.cfg.need; finish(G); }
