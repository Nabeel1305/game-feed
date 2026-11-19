
// ===================== RULES: Mow It (game 68, set 12: one of mine, the calm one) =====================
// A garden seen from above. Put your thumb down anywhere and slide: the mower drives that way (further for faster), and
// lifting the thumb stops it. Every pass cuts a stripe, light one way and dark the other, the way real lawns look. Cut the
// lawn (most of it) before the fuel runs out. Flowers are the owner's pride: drive over three beds of them and you are
// sent home. The grass bag fills as you cut; when it is full the mower stops cutting until you empty it at the compost bin.
// Long straight passes earn STRIPE points; coins and the odd lost treasure hide in the long grass. No clock: take it calm.
// World: metres; x across, y down the screen; a heading h points along (cos h, sin h).
const RULES = [
  '<b>Slide your thumb</b> anywhere: the mower drives that way. Lift it to stop.',
  'Cut the lawn before the <b>fuel</b> runs out. The bar shows how much is cut.',
  '<b>Don\'t mow the flowers!</b> Three beds and the owner sends you home.',
  'When the <b>bag</b> is full, empty it at the compost bin, or you cut nothing.',
  'Long straight passes make <b>stripes</b>: they earn bonus points and stars.',
];
const CELL = 0.25, DECK = 0.6, VMAX = 3.6, TURN = 4.2;
const PLACES = [{ name: 'Rose Cottage', grass: [86, 150, 60] }, { name: 'The Vicarage', grass: [70, 140, 70] }, { name: 'Sunny Villa', grass: [110, 160, 60] }, { name: 'The Manor', grass: [60, 130, 66] }];
const placeOf = N => Math.floor((N - 1) / 5) % 4;
const OWNERS = ['Mrs Bell', 'Mr Pike', 'Aunty Grace', 'Dr Okafor', 'Mrs Patel', 'Old Tom', 'Miss Rosa', 'the Vicar', 'Lady Hartley', 'Mr Mensah'];
const TREASURE = ['a lost ring', 'a gold coin', 'grandpa\'s watch', 'a toy car', 'the spare key', 'a cricket ball', 'a medal', 'a silver spoon'];
const UPGRADES = [
  { id: 'deck', name: 'Wider deck', desc: 'Cut a wider stripe each pass.', max: 2, cost: l => 50 + l * 60 },
  { id: 'bag', name: 'Big bag', desc: 'Empty the bag less often.', max: 2, cost: l => 40 + l * 50 },
  { id: 'tank', name: 'Big tank', desc: 'More fuel for every lawn.', max: 2, cost: l => 40 + l * 50 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Weekend mower'], [40, 'Gardener'], [130, 'Green thumb'], [320, 'Groundskeeper'], [700, 'Head gardener'], [1500, 'Lawn legend']];
function makeCfg(N, help) { const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), boss = N % 10 === 0;
  const w = Math.round(x(9, 12, 30) * (boss ? 1.1 : 1)), h = Math.round(w * 1.42);
  return { N, f, help: !!help, place: placeOf(N), boss, w, h, beds: Math.round(x(1, 3.3, 25)), trees: Math.round(x(0.5, 3, 25)), dog: N >= 6, gnomes: N >= 3 ? Math.round(x(0, 3, 30)) : 0,
    need: x(0.85, 0.9, 25), fuel: x(2.8, 2.4, 30) * (1 + 0.15 * upLv('tank')) * (help ? 1.25 : 1), bag: 0.45 * (1 + 0.3 * upLv('bag')) * (help ? 1.2 : 1), deck: DECK * (1 + 0.15 * upLv('deck')) }; }
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, place: cfg.place, wait: 0, next: null, stick: null };
  setup(G); if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else G.ev.push({ k: 'start' });
  return G; }
// the garden: a lawn (cells), beds of flowers, trees, gnomes, the compost bin, coins and a treasure in the grass
function setup(G, o = {}) { const c = G.cfg, R = G.rnd, w = o.w || c.w, h = o.h || c.h, nx = Math.round(w / CELL), ny = Math.round(h / CELL);
  G.W = w; G.H = h; G.nx = nx; G.ny = ny; G.cut = new Uint8Array(nx * ny); G.dir = new Uint8Array(nx * ny); G.lawn = new Uint8Array(nx * ny).fill(1); G.obst = [];
  const add = (q, pad) => { for (const b of G.obst) if (Math.hypot(b.x - q.x, b.y - q.y) < (b.r || Math.max(b.w, b.h) / 2) + (q.r || Math.max(q.w, q.h) / 2) + pad) return false; if (Math.hypot(q.x - 1.4, q.y - (h - 1.4)) < 3.2) return false; G.obst.push(q); return true; };
  G.bin = { x: w - 1.3, y: 1.3, w: 1.6, h: 1.6, kind: 'bin' }; G.obst.push(G.bin);
  const nb = o.beds != null ? o.beds : c.beds; for (let i = 0, t = 0; i < nb && t < 200; t++) { const bw = o.bed ? o.bed[0] : 1.4 + R() * 2.2, bh = o.bed ? o.bed[1] : 1.2 + R() * 1.6, q = { kind: 'bed', x: 1 + bw / 2 + R() * (w - 2 - bw), y: 1 + bh / 2 + R() * (h - 2 - bh), w: bw, h: bh, hue: (R() * 360) | 0, crushed: false }; if (add(q, 1.4)) i++; }
  const nt = o.trees != null ? o.trees : c.trees; for (let i = 0, t = 0; i < nt && t < 200; t++) { const q = { kind: 'tree', x: 1.5 + R() * (w - 3), y: 1.5 + R() * (h - 3), r: 0.5 + R() * 0.35, crown: 1.6 + R() * 0.8 }; if (add(q, 1.6)) i++; }
  for (let i = 0, t = 0; i < (o.gnomes != null ? o.gnomes : c.gnomes) && t < 200; t++) { const q = { kind: 'gnome', x: 1 + R() * (w - 2), y: 1 + R() * (h - 2), r: 0.28 }; if (add(q, 1.2)) i++; }
  // no lawn under beds, trees, the bin (they are not grass)
  for (const b of G.obst) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const x = (i + 0.5) * CELL, y = (j + 0.5) * CELL; if (inside(b, x, y, b.kind === 'bed' ? 0.35 : 0.3)) G.lawn[j * nx + i] = 0; }      /* the edging round them is not lawn */
  G.total = 0; for (let k = 0; k < nx * ny; k++) G.total += G.lawn[k]; G.done = 0;
  G.coins = []; for (let i = 0; i < 3 + (G.N / 4 | 0); i++) for (let t = 0; t < 40; t++) { const x = 1 + R() * (w - 2), y = 1 + R() * (h - 2); if (lawnAt(G, x, y)) { G.coins.push({ x, y, got: false }); break; } }
  for (let t = 0; t < 40; t++) { const x = 1 + R() * (w - 2), y = 1 + R() * (h - 2); if (lawnAt(G, x, y)) { G.treasure = { x, y, got: false, what: TREASURE[(R() * TREASURE.length) | 0] }; break; } }
  G.owner = OWNERS[(R() * OWNERS.length) | 0];
  G.m = { x: 1.4, y: h - 1.4, h: -Math.PI / 2, v: 0 }; G.fuel = G.fuelMax = Math.max(18, G.total * CELL * CELL / (c.deck * 2 * VMAX * 0.9) * c.fuel + 6); G.bag = 0; G.bagMax = G.total * c.bag; G.crushed = 0; G.stripes = 0; G.run = 0; G.runDir = -1; G.coinsGot = 0; G.bumps = 0;
  G.dog = c.dog && !o.nodog ? { x: w * 0.5, y: h * 0.3, h: 0, t: 0, sit: 0 } : null; G.stuckT = 0; G.stall = 0; }
// how far clear of a thing a point is (moving further clear is always allowed, so nothing can trap the mower)
function sep(b, x, y) { if (b.r) return Math.hypot(x - b.x, y - b.y) - b.r; return Math.max(Math.abs(x - b.x) - b.w / 2, Math.abs(y - b.y) - b.h / 2); }
function inside(b, x, y, pad) { if (b.r) return Math.hypot(x - b.x, y - b.y) < b.r + pad; return Math.abs(x - b.x) < b.w / 2 + pad && Math.abs(y - b.y) < b.h / 2 + pad; }
function lawnAt(G, x, y) { const i = Math.floor(x / CELL), j = Math.floor(y / CELL); return i >= 0 && j >= 0 && i < G.nx && j < G.ny && G.lawn[j * G.nx + i] && !G.cut[j * G.nx + i]; }
const cutShare = G => G.done / G.total;
// ---------- your thumb: a direction and how hard ----------
function setStick(G, ang, mag) { G.stick = mag > 0.05 ? { ang, mag: clamp(mag, 0, 1) } : null; }
function step(G, dt) { if (G.over || !(dt > 0)) return; G.t += dt;
  if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0) { G.wait = 0; const f = G.next; G.next = null; if (f) f(); } return; }
  const c = G.cfg, m = G.m, st = G.stick;
  // steering: turn toward the thumb, speed with how far it slid
  const want = st ? st.mag * VMAX : 0; if (st) { let d = st.ang - m.h; d = Math.atan2(Math.sin(d), Math.cos(d)); m.h += clamp(d, -TURN * dt, TURN * dt) * (m.v > 0.2 || Math.abs(d) > 0.3 ? 1 : 1); }
  m.v += (want - m.v) * Math.min(1, dt * (st ? 4 : 8)); if (m.v < 0.05 && !st) m.v = 0;
  if (G.stall > 0) { G.stall -= dt; m.v = 0; }
  let nx = m.x + Math.cos(m.h) * m.v * dt, ny = m.y + Math.sin(m.h) * m.v * dt; const r = 0.42;
  // driving into the fence at speed stalls the engine for a moment (a thumb that does not look does it all the time)
  const hitX = nx < r || nx > G.W - r, hitY = ny < r || ny > G.H - r; nx = clamp(nx, r, G.W - r); ny = clamp(ny, r, G.H - r);
  if ((hitX && Math.abs(Math.cos(m.h)) > 0.5 || hitY && Math.abs(Math.sin(m.h)) > 0.5) && m.v > 1.6) { G.stall = 0.9; m.v = 0; G.fuel -= 1.5; G.ev.push({ k: 'fence' }); }
  // things in the way: trees and the bin stop you; gnomes get nudged; flower beds get mown (and that is the owner's pride gone)
  for (const b of G.obst) { if (b.kind === 'bed') { if (inside(b, nx, ny, -0.1) && !b.crushed && m.v > 0.3) { b.crushed = true; G.crushed++; G.ev.push({ k: 'crush', b, n: G.crushed }); lessonMiss(G, 'bed'); if (G.crushed >= 3 && !G.lesson) { G.ev.push({ k: 'sent' }); G.wait = 1.4; G.next = () => finish(G, false, 'flowers'); return; } } continue; }
    if (inside(b, nx, ny, r) && sep(b, nx, ny) < sep(b, m.x, m.y) + 1e-6) { if (b.kind === 'gnome') { const a = Math.atan2(b.y - ny, b.x - nx); b.x = clamp(b.x + Math.cos(a) * 0.5, 0.5, G.W - 0.5); b.y = clamp(b.y + Math.sin(a) * 0.5, 0.5, G.H - 0.5); G.ev.push({ k: 'gnome' }); } else { if (m.v > 1.6 && !G.bumpT) { G.bumps++; G.ev.push({ k: 'bump' }); G.bumpT = 0.6; G.stall = 0.9; G.fuel -= 1.5; }
        // slide along it rather than stick to it
        if (!inside(b, nx, m.y, r) || sep(b, nx, m.y) >= sep(b, m.x, m.y)) ny = m.y; else if (!inside(b, m.x, ny, r) || sep(b, m.x, ny) >= sep(b, m.x, m.y)) nx = m.x; else { nx = m.x; ny = m.y; } m.v *= 0.85; } } }
  G.bumpT = Math.max(0, (G.bumpT || 0) - dt);
  if (G.dog && Math.hypot(G.dog.x - nx, G.dog.y - ny) < 0.8) { nx = m.x; ny = m.y; m.v = 0; if (!G.dogT) { G.dogT = 1; G.ev.push({ k: 'woof' }); } }
  G.dogT = Math.max(0, (G.dogT || 0) - dt);
  const moved = Math.hypot(nx - m.x, ny - m.y); m.x = nx; m.y = ny;
  // fuel: burnt by the engine while it moves (idling burns a little)
  G.fuel -= dt * (0.12 + 0.88 * (m.v / VMAX)); if (G.fuel <= 0) { G.fuel = 0; G.ev.push({ k: 'empty' }); if (G.lesson) { lessonMiss(G, 'fuel'); return; } G.wait = 1.2; G.next = () => finish(G, cutShare(G) >= c.need, 'fuel'); return; }      /* a lesson that runs dry starts again */
  // the bin: drive up to it with a bag that has anything in it and it empties
  if (Math.hypot(m.x - G.bin.x, m.y - G.bin.y) < 2.2 && G.bag > G.bagMax * 0.05) { G.bag = 0; G.ev.push({ k: 'emptied' }); lessonSee(G, 'bin'); }
  // cutting: every cell under the deck
  if (moved > 0) { const full = G.bag >= G.bagMax, d = c.deck, i0 = Math.floor((m.x - d) / CELL), i1 = Math.floor((m.x + d) / CELL), j0 = Math.floor((m.y - d) / CELL), j1 = Math.floor((m.y + d) / CELL);
    const dirIx = ((Math.round(m.h / (Math.PI / 2)) % 4) + 4) % 4; let n = 0;
    if (!full) for (let j = Math.max(0, j0); j <= Math.min(G.ny - 1, j1); j++) for (let i = Math.max(0, i0); i <= Math.min(G.nx - 1, i1); i++) { const k = j * G.nx + i; if (!G.lawn[k] || G.cut[k]) continue; const x = (i + 0.5) * CELL, y = (j + 0.5) * CELL; if ((x - m.x) ** 2 + (y - m.y) ** 2 > d * d) continue; G.cut[k] = 1; G.dir[k] = dirIx; n++; }
    if (n) { G.done += n; G.bag += n; G.ev.push({ k: 'cut', n }); if (G.bag >= G.bagMax) { G.bag = G.bagMax; G.ev.push({ k: 'bagfull' }); } }
    else if (full && G.lawn.length && moved > 0 && lawnAt(G, m.x, m.y)) G.ev.push({ k: 'clump' });
    // stripes: a long straight pass in one direction, cutting as it goes
    const onAxis = Math.abs(Math.sin(2 * m.h)) < 0.6; G.offT = onAxis ? 0 : (G.offT || 0) + dt; if (m.v > VMAX * 0.45 && G.offT < 0.3) { if (dirIx === G.runDir || G.runDir < 0) { if (G.runDir < 0) { G.runDir = dirIx; G.run = 0; G.runPaid = false; } if (n) G.lastCutT = G.t; if (G.t - (G.lastCutT || -9) < 0.25) G.run += moved; if (G.run >= 6 && !G.runPaid) { G.runPaid = true; G.stripes++; G.ev.push({ k: 'stripe', n: G.stripes }); } } else { G.runDir = dirIx; G.run = 0; G.runPaid = false; } } else G.runDir = -1;      /* a straight pass that keeps cutting; a little wobble is fine */
    for (const cn of G.coins) if (!cn.got && Math.hypot(cn.x - m.x, cn.y - m.y) < d + 0.1) { cn.got = true; G.coinsGot++; G.ev.push({ k: 'coin', x: cn.x, y: cn.y }); }
    if (G.treasure && !G.treasure.got && Math.hypot(G.treasure.x - m.x, G.treasure.y - m.y) < d + 0.1) { G.treasure.got = true; G.ev.push({ k: 'treasure', what: G.treasure.what }); } }
  if (G.lesson) lessonTick(G);
  // the dog: trots about, sits, gets up
  if (G.dog) { const D = G.dog; D.t -= dt; if (D.t <= 0) { D.t = 1.5 + G.rnd() * 3; D.sit = G.rnd() < 0.35 ? D.t : 0; D.h = G.rnd() * TAU; } if (D.sit <= 0) { const sp = 1.3; let dx = D.x + Math.cos(D.h) * sp * dt, dy = D.y + Math.sin(D.h) * sp * dt; if (dx < 0.6 || dy < 0.6 || dx > G.W - 0.6 || dy > G.H - 0.6 || G.obst.some(b => b.kind !== 'bed' && inside(b, dx, dy, 0.4))) { D.h += Math.PI * 0.7; } else { D.x = dx; D.y = dy; } } else D.sit -= dt; }
  if (!G.lesson && cutShare(G) >= 0.999) { G.ev.push({ k: 'all' }); G.wait = 1.2; G.next = () => finish(G, true, 'all'); }
  else if (!G.lesson && cutShare(G) >= c.need && !G.goalT) { G.goalT = 1; G.ev.push({ k: 'goal' }); } }
// finishing: the lawn done enough (you can stop: tap DONE, or keep going for the last bits)
function done(G) { if (G.over || G.wait > 0 || G.lesson || cutShare(G) < G.cfg.need) return false; G.ev.push({ k: 'done' }); G.wait = 0.8; G.next = () => finish(G, true, 'done'); return true; }
function finish(G, win, why) { if (G.over) return true; G.over = win ? 'won' : 'lost'; const c = G.cfg, share = cutShare(G);
  const stripeNeed = Math.max(3, Math.round(G.total * CELL * CELL / (c.deck * 2) / 6 * 0.5)), stars = win ? 1 + (G.crushed === 0 ? 1 : 0) + (G.stripes >= stripeNeed ? 1 : 0) : 0;
  const score = Math.round(share * 1000) + G.stripes * 50 + G.coinsGot * 25 + (G.treasure && G.treasure.got ? 100 : 0) - G.crushed * 150;
  G.res = { win, stars, why, share, need: c.need, score, stripes: G.stripes, stripeNeed, crushed: G.crushed, coinsGot: G.coinsGot, treasure: G.treasure && G.treasure.got ? G.treasure.what : null, owner: G.owner, fuel: G.fuel / G.fuelMax, prog: Math.min(1, share / c.need), coins: G.coinsGot + (win ? 4 + Math.ceil(G.N / 3) + stars * 2 : 1) };
  G.ev.push({ k: win ? 'won' : 'lost', why }); return true; }
// ---------- LESSONS: a small lawn each ----------
const LESSONS = {
  1: [{ id: 'mow', title: 'MOW IN STRIPES', how: 'Slide your thumb: the mower goes that way; lift it to stop. Mow this lawn in long straight lines, up and down: 2 STRIPES and most of the grass.', need: 1, lawn: { w: 6, h: 9, beds: 0, trees: 0, gnomes: 0, nodog: true } }],
  2: [{ id: 'flowers', title: 'MIND THE FLOWERS', how: 'Mow round the flower bed without touching it. Drive over it and the lesson starts again.', need: 1, lawn: { w: 6, h: 8, beds: 1, bed: [1.5, 1.2], trees: 0, gnomes: 0, nodog: true } }],
  3: [{ id: 'bin', title: 'EMPTY THE BAG', how: 'The bag is full: drive to the compost bin (top right) to empty it, then mow the rest.', need: 1, lawn: { w: 6, h: 8, beds: 0, trees: 1, gnomes: 0, nodog: true }, full: true }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonDeal(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonDeal(G) { const st = lessonNow(G); setup(G, st.lawn); G.fuel = G.fuelMax = G.fuelMax * (st.id === 'mow' ? 2 : 1.5); G.binDone = false; if (st.id !== 'bin') G.bagMax = 1e9; if (st.full) G.bag = G.bagMax; G.stick = null; }
// a lesson is passed when the little lawn is (nearly) all cut; for the bin lesson, after emptying the bag
function lessonTick(G) { const st = lessonNow(G); if (!st) return; if (cutShare(G) >= 0.85 && (st.id !== 'bin' || G.binDone) && (st.id !== 'mow' || G.stripes >= 2)) { G.ev.push({ k: 'lessonok', n: 1, need: 1 }); G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.wait = 1.4; G.next = () => { G.rnd = rng(G.seed); setup(G); G.ev.push({ k: 'start' }); }; } }
function lessonSee(G, what) { if (what === 'bin' && G.lesson) G.binDone = true; }
function lessonMiss(G, why) { if (!G.lesson) return; const st = lessonNow(G); G.ev.push({ k: 'lessonmiss', how: st.how }); G.wait = 1.2; G.next = () => lessonDeal(G); }
// ---------- for the robots ----------
// BLIND: a thumb that does not look: slides some way (and keeps it there), or lifts
const BLIND = { s: G => setStick(G, Math.random() * TAU, 0.4 + Math.random() * 0.6), r: G => setStick(G, 0, 0) };
// a gardener who looks: mows in lanes up and down the lawn, steering round beds, trees and the dog, goes to the bin when
// the bag is full, then hunts down what is left; a careless one wobbles off the line now and then
// the way round things: a coarse grid (half a metre) with beds, trees, the bin and the dog blocked; a breadth-first search
const PG = 0.5;
function pathTo(G, tx, ty, binOk) { const gw = Math.ceil(G.W / PG), gh = Math.ceil(G.H / PG), blk = new Uint8Array(gw * gh), at = (x, y) => [clamp(Math.floor(x / PG), 0, gw - 1), clamp(Math.floor(y / PG), 0, gh - 1)];
  for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) { const x = (i + 0.5) * PG, y = (j + 0.5) * PG; for (const b of G.obst) if (!(binOk && b === G.bin) && inside(b, x, y, b.kind === 'bed' ? 0.85 : 0.6)) { blk[j * gw + i] = 1; break; } if (G.dog && Math.hypot(x - G.dog.x, y - G.dog.y) < 0.9) blk[j * gw + i] = 1; }
  const [si, sj] = at(G.m.x, G.m.y), [ti, tj] = at(tx, ty), prev = new Int32Array(gw * gh).fill(-1), q = [sj * gw + si]; prev[sj * gw + si] = sj * gw + si; blk[sj * gw + si] = 0;
  while (q.length) { const c = q.shift(); if (c === tj * gw + ti) break; const ci = c % gw, cj = (c / gw) | 0; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) { const ni = ci + di, nj = cj + dj; if (ni < 0 || nj < 0 || ni >= gw || nj >= gh) continue; const n = nj * gw + ni; if (blk[n] || prev[n] >= 0) continue; if (di && dj && (blk[cj * gw + ni] || blk[nj * gw + ci])) continue; prev[n] = c; q.push(n); } }
  if (prev[tj * gw + ti] < 0) return null; const out = []; let c = tj * gw + ti; while (c !== prev[c]) { out.push([(c % gw + 0.5) * PG, ((c / gw | 0) + 0.5) * PG]); c = prev[c]; } out.reverse(); if (out.length) out[out.length - 1] = [tx, ty]; return out; }
// a gardener who looks: mows in lanes up and down the lawn, finding the way round beds, trees and the dog, goes to the bin
// when the bag is full, then hunts down what is left; a careless one wobbles off the line now and then
function honest(G, o, mem) { const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random, m = G.m, c = G.cfg;
  if (G.over || G.wait > 0) { mem.lane = null; mem.path = null; return; }
  if (!G.lesson && cutShare(G) >= c.need && (G.fuel < G.fuelMax * 0.12 || cutShare(G) > c.need + 0.05)) { done(G); return; }
  mem.t = (mem.t || 0) - 1 / 60; if (mem.t > 0) return; mem.t = 0.06 + react * 0.12;
  const gid = G.seed + ':' + G.W + ':' + G.total; if (mem.gid !== gid) { mem.gid = gid; mem.lane = 0; mem.dirUp = true; mem.path = null; }
  const full = G.bag >= G.bagMax * 0.98, lw = c.deck * 1.75, free = (x, y) => !G.obst.some(b => inside(b, x, y, b.kind === 'bed' ? 0.85 : 0.6));
  let tx, ty;
  if (full) { tx = G.bin.x - 1.0; ty = G.bin.y + 1.0; }
  else { let lx = Math.min(G.W - 0.45, 0.45 + mem.lane * lw);
    mem.hunting = 0.45 + mem.lane * lw > G.W + lw * 0.5;
    if (mem.hunting) { // the lanes are done: the nearest grass left
      let bd = 1e9; for (let j = 0; j < G.ny; j++) for (let i = 0; i < G.nx; i++) { const k = j * G.nx + i; if (!G.lawn[k] || G.cut[k]) continue; let x = (i + 0.5) * CELL, y = (j + 0.5) * CELL;
        // grass hard against a bed or a tree: aim just clear of it (the deck reaches the rest)
        for (const b of G.obst) { const pad = b.kind === 'bed' ? 0.9 : 0.65; if (!inside(b, x, y, pad)) continue; if (b.r) { const a = Math.atan2(y - b.y, x - b.x); x = b.x + Math.cos(a) * (b.r + pad + 0.05); y = b.y + Math.sin(a) * (b.r + pad + 0.05); } else { const ox = Math.abs(x - b.x) - b.w / 2, oy = Math.abs(y - b.y) - b.h / 2; if (ox > oy) x = b.x + Math.sign(x - b.x || 1) * (b.w / 2 + pad + 0.05); else y = b.y + Math.sign(y - b.y || 1) * (b.h / 2 + pad + 0.05); } }
        x = clamp(x, 0.45, G.W - 0.45); y = clamp(y, 0.45, G.H - 0.45); if (!free(x, y)) continue; const d = Math.hypot(x - m.x, y - m.y) + (mem.skip && mem.skip[k] ? 50 : 0); if (d < bd) { bd = d; tx = x; ty = y; mem.hk = k; } }
      if (bd === 1e9) { done(G); return; }
      // a spot it cannot get at after a while: try another
      if (mem.hk === mem.lastHk) { mem.hT = (mem.hT || 0) + 1; if (mem.hT > 40) { mem.skip = mem.skip || {}; mem.skip[mem.hk] = 1; mem.hT = 0; } } else { mem.lastHk = mem.hk; mem.hT = 0; } }
    else { // the far end of this lane (or the last free point before it)
      const endY = mem.dirUp ? 0.75 : G.H - 0.75, sgn = mem.dirUp ? -1 : 1;
      if (Math.abs(m.y - endY) < 0.6 && Math.abs(m.x - lx) < 0.6) { mem.lane++; mem.dirUp = !mem.dirUp; mem.path = null; return; }
      // a point a little way along the lane (so the mower follows the line), past anything in the way
      tx = lx; ty = Math.abs(m.x - lx) > 0.5 ? clamp(m.y, 0.75, G.H - 0.75) : clamp(m.y + sgn * 2, 0.75, G.H - 0.75); let tries = 0; while (!free(tx, ty) && tries++ < 60) ty = clamp(ty + sgn * 0.25, 0.75, G.H - 0.75);
      if (!free(tx, ty)) { mem.lane++; mem.dirUp = !mem.dirUp; mem.path = null; return; }
      if (Math.abs(ty - endY) < 0.3 && sgn * (m.y - endY) > -0.6 && Math.abs(m.x - lx) < 0.6) { mem.lane++; mem.dirUp = !mem.dirUp; mem.path = null; return; } } }
  // follow a path round things
  if (!mem.path || mem.tgt == null || Math.hypot(mem.tgt[0] - tx, mem.tgt[1] - ty) > 0.3 || (mem.pt = (mem.pt || 0) + 1) % 5 === 0) { mem.path = pathTo(G, tx, ty, full); mem.tgt = [tx, ty]; }
  let px = tx, py = ty; if (mem.path && mem.path.length) { while (mem.path.length > 1 && Math.hypot(mem.path[0][0] - m.x, mem.path[0][1] - m.y) < 0.7) mem.path.shift(); [px, py] = mem.path[0]; }
  else if (!mem.path) { if (!full) { if (mem.hunting) { mem.skip = mem.skip || {}; mem.skip[mem.hk] = 1; } else { mem.lane++; mem.dirUp = !mem.dirUp; } } return; }      /* no way there: skip it */
  // near flowers a gardener slows down and is careful
  const nearBed = G.obst.some(b => b.kind === 'bed' && !b.crushed && inside(b, m.x, m.y, 1.4));
  let ang = Math.atan2(py - m.y, px - m.x); if (R() > acc && !nearBed) ang += (R() - 0.5) * 0.9;
  setStick(G, ang, clamp(Math.hypot(tx - m.x, ty - m.y) / 1.6, 0.3, nearBed ? 0.6 : 1)); }
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.wait = 0; G.done = G.total; finish(G, true, 'all'); }
