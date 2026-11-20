
// ===================== THE RULES: Paint It =====================
// Each job is a thing to paint (a fence, a door, a beach hut, a shed, a birdhouse, a car, a boat...) with a design: which
// colour goes where, glass to keep clean, and tape that keeps the edges crisp. Drag your thumb over it to paint with the
// ROLLER (wide) or the BRUSH (fine); tap a pot to change colour. Paint on the tape is fine (it peels off at the end, leaving
// sharp lines); paint on the glass or off the edges is a spill. When it is covered, DONE: the tape peels and it is judged.
const RULES = [
  '<b>Drag your thumb over it</b> to paint. The ROLLER covers a lot; the BRUSH does the fine bits.',
  '<b>Tap a pot</b> to change colour. The faint pattern shows which colour goes where.',
  '<b>Tape (blue) is safe to paint over:</b> it peels off at the end and leaves crisp lines.',
  '<b>Keep paint off the glass and off the edges</b>: every spill costs.',
  '<b>DONE</b> when it is covered (or it finishes itself at 100%). The owner scores it: cover it all, spill nothing.',
];
const GW = 60, GH = 84, OUT = 0, TAPE = -1, GLASS = -2;
const PAINTS = [{ name: 'Sky blue', col: 0x4aa8f0 }, { name: 'Sunshine', col: 0xf6c82a }, { name: 'Tomato', col: 0xe8463c }, { name: 'Mint', col: 0x5ad0a0 }, { name: 'Lilac', col: 0xa888e8 },
  { name: 'Coral', col: 0xff8a6a }, { name: 'Forest', col: 0x2f8a4a }, { name: 'Navy', col: 0x2a3a7a }, { name: 'Snow', col: 0xf4f6f8 }, { name: 'Pink', col: 0xf28ab8 }, { name: 'Orange', col: 0xf28a2a }, { name: 'Teal', col: 0x22a0a8 }];
const JOBS = ['fence', 'door', 'hut', 'heart', 'bird', 'car', 'boat', 'flag'];
const JOBNAME = { fence: 'the garden fence', door: 'the front door', hut: 'a beach hut', heart: 'the shed wall', bird: 'a birdhouse', car: 'a little car', boat: 'a fishing boat', flag: 'the mural' };
const PLACES = [{ name: 'Back Garden', sky: 'morning' }, { name: 'High Street', sky: 'noon' }, { name: 'Seaside', sky: 'golden' }, { name: 'Harbour', sky: 'sunset' }, { name: 'Allotment', sky: 'overcast' }, { name: 'Town Square', sky: 'noon' }];
const placeOf = N => Math.floor((N - 1) / 5) % PLACES.length;
const SKINS = [{ id: 'basic', name: 'Basic', col: 0x4aa8f0, stars: 0 }, { id: 'pastel', name: 'Pastels', col: 0xf2b8d8, stars: 6 }, { id: 'neon', name: 'Neon', col: 0x5aff8a, stars: 14 },
  { id: 'earth', name: 'Earth', col: 0xb8784a, stars: 24 }, { id: 'ocean', name: 'Ocean', col: 0x22a0c8, stars: 36 }, { id: 'sunset', name: 'Sunset', col: 0xff8a4a, stars: 50 }, { id: 'royal', name: 'Royal', col: 0x6a3ab8, stars: 66 }, { id: 'gold', name: 'Gold leaf', col: 0xe0b040, stars: 85 }];
const UPGRADES = [
  { id: 'roller', name: 'Big roller', max: 3, cost: l => [25, 60, 120][l], desc: 'A wider roller.' },
  { id: 'brush', name: 'Fine brush', max: 3, cost: l => [30, 70, 140][l], desc: 'A brush that keeps its edge.' },
  { id: 'tape', name: 'More tape', max: 3, cost: l => [35, 80, 150][l], desc: 'Wider tape round the glass.' },
  { id: 'tips', name: 'Good name', max: 4, cost: l => [40, 90, 170, 280][l], desc: 'Happier owners tip more.' },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Apprentice'], [60, 'Painter'], [200, 'Decorator'], [500, 'Master painter'], [1100, 'Artist'], [2500, 'Legend']];
function makeCfg(N, help) { const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), boss = N % 5 === 0;
  return { job: N <= 5 ? JOBS[N - 1] : JOBS[(N * 3 + Math.floor(N / 8)) % JOBS.length], stripe: Math.round(x(10, 3, 20)), pass: Math.round(x(72, 97, 20)) - (help ? 8 : 0), spillK: x(2.0, 3.5, 25), boss, help: !!help,
    rr: 4.4 + 0.6 * upLv('roller'), br: 1.5 - 0.1 * upLv('brush'), tape: (N >= 25 ? 0.5 : 1) + upLv('tape') * 0.5 }; }
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, wait: 0, next: null };
  setup(G); if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else G.ev.push({ k: 'start' });
  return G; }
// ---------- the designs: a grid GW x GH (x across, y up); each cell OUT, TAPE, GLASS or a colour 1, 2, 3 ----------
function design(job, c, R) { const g = new Int8Array(GW * GH), set = (x, y, v) => { if (x >= 0 && y >= 0 && x < GW && y < GH) g[y * GW + x] = v; }, at = (x, y) => x >= 0 && y >= 0 && x < GW && y < GH ? g[y * GW + x] : OUT, s = c.stripe, tp = c.tape;
  const rect = (x0, y0, x1, y1, v) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) set(x, y, v); };
  const ring = (fn, v, w) => { const m = g.slice(); for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (m[y * GW + x] > 0) { for (let dy = -w; dy <= w; dy++) for (let dx = -w; dx <= w; dx++) if (fn(x + dx, y + dy) && !fn(x, y)) { g[y * GW + x] = v; dy = w + 1; break; } } };
  if (job === 'fence') { for (let p = 0; p < 6; p++) { const x0 = 1 + p * 10; for (let x = x0; x < x0 + 8; x++) { const top = 66 + 4 - Math.abs(x - x0 - 3.5); rect(x, 6, x + 1, Math.round(top), 1); } } rect(0, 18, GW, 22, 2); rect(0, 50, GW, 54, 2); }
  else if (job === 'door') { rect(8, 2, 52, 80, 2); rect(12, 2, 48, 76, 1); rect(18, 50, 42, 70, GLASS); ring((x, y) => at(x, y) === GLASS, TAPE, Math.round(tp)); rect(38, 34, 43, 38, 3); }
  else if (job === 'hut') { for (let x = 6; x < 54; x++) rect(x, 4, x + 1, 58, Math.floor((x - 6) / s) % 2 ? 2 : 1); for (let y = 58; y < 80; y++) { const w = Math.round((80 - y) * 1.35); rect(30 - w, y, 30 + w, y + 1, 3); } rect(22, 4, 38, 40, 3); rect(25, 30, 35, 37, GLASS); ring((x, y) => at(x, y) === GLASS, TAPE, Math.round(tp)); }
  else if (job === 'heart') { rect(4, 4, 56, 80, 1); const hc = (x, y) => { const X = (x - 30) / 16, Y = (y - 44) / 16; return Math.pow(X * X + Y * Y - 1, 3) - X * X * Y * Y * Y < 0; }; for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (hc(x, y)) set(x, y, 2); ring((x, y) => at(x, y) === 2, TAPE, 1); for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (hc(x, y)) set(x, y, 2); }
  else if (job === 'bird') { rect(12, 6, 48, 52, 1); for (let y = 52; y < 76; y++) { const w = Math.round((76 - y) * 0.95); rect(30 - w - 3, y, 30 + w + 3, y + 1, 2); } for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (Math.hypot(x - 30, y - 34) < 6) set(x, y, OUT); rect(28, 20, 32, 24, 3); rect(12, 6, 48, 10, 3); }
  else if (job === 'car') { for (let y = 14; y < 40; y++) for (let x = 2; x < 58; x++) { const r = Math.min(x - 2, 57 - x, y - 14, 39 - y); if (r >= 0 && !(r < 3 && Math.hypot(Math.min(x - 2, 57 - x) - 3, Math.min(y - 14, 39 - y) - 3) > 3)) set(x, y, 1); } for (let y = 40; y < 60; y++) { const w0 = 12 + Math.round((y - 40) * 0.35), w1 = 48 - Math.round((y - 40) * 0.5); rect(w0, y, w1, y + 1, 1); }
    rect(17, 43, 28, 56, GLASS); rect(31, 43, 42, 54, GLASS); ring((x, y) => at(x, y) === GLASS, TAPE, Math.round(tp)); rect(2, 25, 58, 25 + Math.max(3, Math.round(s * 0.6)), 2); for (const cx of [14, 46]) for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (Math.hypot(x - cx, y - 14) < 7.5) set(x, y, OUT); }
  else if (job === 'boat') { for (let y = 6; y < 36; y++) { const w = 18 + Math.round((y - 6) * 0.42); rect(30 - w, y, 30 + w, y + 1, y < 16 ? 2 : y >= 31 ? 3 : 1); } rect(20, 36, 44, 54, 3); rect(23, 42, 29, 50, GLASS); rect(33, 42, 39, 50, GLASS); ring((x, y) => at(x, y) === GLASS, TAPE, Math.round(tp)); }
  else { rect(4, 4, 56, 80, 1); for (let y = 4; y < 80; y++) if (Math.floor((y - 4) / s) % 2) rect(4, y, 56, y + 1, 2); for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (Math.hypot(x - 30, y - 56) < 11) set(x, y, 3); }
  return g; }
function setup(G, o = {}) { const c = G.cfg, R = G.rnd; G.t = 0; G.yard = o.yard || null; G.job = o.job || c.job;
  G.grid = design(G.job, c, R); G.paint = new Int8Array(GW * GH); G.tapeOff = false; G.thumb = null; G.tool = 'roller'; G.spill = 0; G.spilt = new Uint8Array(GW * GH);
  const used = [...new Set(Array.from(G.grid).filter(v => v > 0))].sort(); const pal = PAINTS.slice().sort(() => R() - 0.5); G.cols = {}; used.forEach((v, i) => G.cols[v] = pal[i]); G.colours = used; G.colour = used[0];
  G.target = 0; G.right = 0; for (const v of G.grid) if (v > 0) G.target++;
  G.regions = regions(G); G.doneRegions = 0; edges(G); G.ev.push({ k: 'job' }); }
// the cell just past an edge takes a little paint without it showing (cutting in): only further out is a spill
function edges(G) { G.edge = new Uint8Array(GW * GH); for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { const j = y * GW + x; if (G.grid[j] !== OUT) continue; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < GW && Y < GH && G.grid[Y * GW + X] !== OUT && G.grid[Y * GW + X] !== GLASS) G.edge[j] = 1; } } }
// connected areas of one colour (a plank, a stripe): each one finished rings a note
function regions(G) { const id = new Int16Array(GW * GH).fill(-1), out = []; for (let j = 0; j < GW * GH; j++) { if (G.grid[j] <= 0 || id[j] >= 0) continue; const r = { v: G.grid[j], n: 0, ok: 0, done: false, cells: [] }, st = [j]; id[j] = out.length;
    while (st.length) { const q = st.pop(), x = q % GW, y = (q / GW) | 0; r.n++; r.cells.push(q); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue; const nq = ny * GW + nx; if (id[nq] < 0 && G.grid[nq] === r.v) { id[nq] = out.length; st.push(nq); } } }
    out.push(r); } G.rid = id; return out; }
// ---------- your thumb: { x, y } in cells (off the board is fine: that is the wall behind), or a button ----------
function press(G, w) { if (G.over || G.wait > 0) return; if (w.pot != null) { const v = G.colours[w.pot]; if (v != null && v !== G.colour) { G.colour = v; G.ev.push({ k: 'pot', v }); } return; }
  if (w.tool) { if (w.tool !== G.tool) { G.tool = w.tool; G.ev.push({ k: 'tool', t: w.tool }); } return; }
  if (w.done) { if (cover(G) >= 0.85) done(G); return; }
  G.thumb = { x: w.x, y: w.y }; dab(G, w.x, w.y); }
function move(G, w) { if (!G.thumb || G.over || G.wait > 0 || w.x == null) return; const a = G.thumb, d = Math.hypot(w.x - a.x, w.y - a.y), r = G.tool === 'roller' ? G.cfg.rr : G.cfg.br, n = Math.max(1, Math.ceil(d / (r * 0.5)));
  for (let i = 1; i <= n; i++) dab(G, a.x + (w.x - a.x) * i / n, a.y + (w.y - a.y) * i / n); G.thumb = { x: w.x, y: w.y }; G.stroke = (G.stroke || 0) + d; }
function lift(G) { G.thumb = null; }
function dab(G, cx, cy) { const r = G.tool === 'roller' ? G.cfg.rr : G.cfg.br, v = G.colour; let spill = 0, fresh = 0;
  const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(GW - 1, Math.ceil(cx + r)), y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(GH - 1, Math.ceil(cy + r));
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { if ((x - cx) ** 2 + (y - cy) ** 2 > r * r) continue; const j = y * GW + x, g = G.grid[j], was = G.paint[j]; if (was === v) continue;
    if (g > 0) { if (was === g) G.right--; if (v === g) { G.right++; fresh++; const R = G.regions[G.rid[j]]; R.ok++; } else if (was === g) G.regions[G.rid[j]].ok--; }
    else if ((g === OUT && !G.edge[j]) || g === GLASS) { if (!G.spilt[j]) { G.spilt[j] = 1; G.spill++; spill++; } }
    G.paint[j] = v; }
  // the board's edges: paint off the board altogether is a spill too (the wall behind)
  if (cx < -r * 0.3 || cy < -r * 0.3 || cx > GW - 1 + r * 0.3 || cy > GH - 1 + r * 0.3) { G.spill += 2; spill += 2; }
  if (spill) G.ev.push({ k: 'spill', n: spill }); if (fresh) G.fresh = (G.fresh || 0) + fresh;
  for (const R of G.regions) if (!R.done && R.ok >= R.n * 0.985) { R.done = true; G.doneRegions++; G.ev.push({ k: 'region', n: G.doneRegions, of: G.regions.length }); }
  if (G.lesson) lessonSee(G, 'paint');
  if (!G.lesson && G.right >= G.target) done(G); }
const cover = G => G.right / Math.max(1, G.target);
function done(G) { if (G.over || G.wait > 0) return; if (G.lesson) { lessonSee(G, 'done'); return; } G.tapeOff = true; G.ev.push({ k: 'peel' }); G.wait = 1.2; G.next = () => judge(G); }
function step(G, dt) { if (G.over || !(dt > 0)) return;
  if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0) { G.wait = 0; if (G.next) { const f = G.next; G.next = null; f(); } } return; }
  G.t += dt; if (!G.lesson && G.t > 150) { G.ev.push({ k: 'hurry' }); done(G); } }
function judge(G) { const c = G.cfg, cov = cover(G), sp = G.spill / Math.max(1, G.target), score = Math.max(0, Math.round(100 * cov - 100 * sp * c.spillK));
  G.score = score; G.parts = [['Covered', Math.round(cov * 100)], ['Clean', Math.max(0, Math.round(100 - 100 * sp * c.spillK * 2))]]; finish(G, score >= c.pass); }
function finish(G, win) { if (G.over) return true; G.over = win ? 'won' : 'lost'; const c = G.cfg, s = G.score || 0;
  const stars = win ? 1 + (s >= c.pass + 5 ? 1 : 0) + (s >= 97 ? 1 : 0) : 0, tip = win && s >= 92 ? 3 + upLv('tips') * 2 : 0;
  G.res = { win, stars, score: s, pass: c.pass, parts: G.parts || [], job: G.job, spill: G.spill, tip, coins: Math.max(1, Math.round(s / 10) + (win ? 4 + Math.ceil(G.N / 3) + stars * 2 + tip : 0)) };
  G.ev.push({ k: win ? 'won' : 'lost' }); return true; }
// ---------- the robot: a painter who looks (it dabs: rollers where the roller fits, the brush for the rest) ----------
const gauss = () => { let u = 0; for (let i = 0; i < 4; i++) u += Math.random(); return (u - 2) * 1.732; };
function safe(G, cx, cy, r, v) { for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) { if ((x - cx) ** 2 + (y - cy) ** 2 > r * r) continue; if (x < 0 || y < 0 || x >= GW || y >= GH) return false; const j = y * GW + x, g = G.grid[j]; if (g !== v && g !== TAPE && !G.edge[j] && !(g > 0 && G.paint[j] !== g && false)) return false; } return true; }
function plan(G, acc) { const out = [], c = G.cfg, m = (1 - acc) * 5;
  for (const v of G.colours) { const need = new Uint8Array(GW * GH); for (let j = 0; j < GW * GH; j++) if (G.grid[j] === v) need[j] = 1;
    const st = c.rr * 1.1; for (let y = c.rr; y < GH; y += st) for (let x = c.rr; x < GW; x += st) if (safe(G, x, y, c.rr + m, v)) { out.push({ v, tool: 'roller', x, y }); for (let yy = Math.floor(y - c.rr); yy <= y + c.rr; yy++) for (let xx = Math.floor(x - c.rr); xx <= x + c.rr; xx++) if ((xx - x) ** 2 + (yy - y) ** 2 <= c.rr * c.rr && xx >= 0 && yy >= 0 && xx < GW && yy < GH) need[yy * GW + xx] = 0; }
    for (let j = 0; j < GW * GH; j++) if (need[j]) { const x = j % GW, y = (j / GW) | 0; let bx = x, by = y; for (const [dx, dy] of [[0, 0], [0.6, 0], [-0.6, 0], [0, 0.6], [0, -0.6]]) if (safe(G, x + dx, y + dy, c.br + m * 0.3, v)) { bx = x + dx; by = y + dy; break; }
      out.push({ v, tool: 'brush', x: bx, y: by }); for (let yy = Math.floor(by - c.br); yy <= by + c.br; yy++) for (let xx = Math.floor(bx - c.br); xx <= bx + c.br; xx++) if ((xx - bx) ** 2 + (yy - by) ** 2 <= c.br * c.br && xx >= 0 && yy >= 0 && xx < GW && yy < GH) need[yy * GW + xx] = 0; } }
  return out; }
const needs = (G, p) => { const r = p.tool === 'roller' ? G.cfg.rr : G.cfg.br; for (let y = Math.floor(p.y - r); y <= p.y + r; y++) for (let x = Math.floor(p.x - r); x <= p.x + r; x++) { if (x < 0 || y < 0 || x >= GW || y >= GH) continue; const j = y * GW + x; if (G.grid[j] === p.v && G.paint[j] !== p.v) return true; } return false; };
function honest(G, o, mem) { if (G.over || G.wait > 0) return; const acc = o.acc == null ? 0.85 : o.acc, react = o.react == null ? 0.3 : o.react;
  if (mem.g !== G.grid) { mem.g = G.grid; mem.plan = plan(G, acc); mem.i = 0; mem.cd = react; }
  mem.cd -= 1 / 60; if (mem.cd > 0) return; mem.cd = 0.02 + react * 0.05;
  if (mem.i >= mem.plan.length) { if (G.thumb) lift(G); mem.round = (mem.round || 0) + 1; if (mem.round < 3 && cover(G) < 0.995) { mem.plan = plan(G, acc).filter(p => { const j = Math.round(p.y) * GW + Math.round(p.x); return true; }).filter(p => needs(G, p)); mem.i = 0; if (mem.plan.length) return; } press(G, { done: true }); return; }
  const p = mem.plan[mem.i]; if (G.colour !== p.v) { press(G, { pot: G.colours.indexOf(p.v) }); return; } if (G.tool !== p.tool) { press(G, { tool: p.tool }); return; }
  const j = (1 - acc) * (p.tool === 'roller' ? 3.2 : 1.6); press(G, { x: p.x + gauss() * j, y: p.y + gauss() * j }); lift(G); mem.i++; }
// blind moves: a thumb put down anywhere (the board is about half the screen), dragged anywhere, lifted; a tap on a pot
const blindAt = () => ({ x: Math.random() * 120 - 30, y: Math.random() * 168 - 42 });
const BLIND = { d: G => press(G, Math.random() < 0.08 ? { done: true } : blindAt()), m: G => move(G, blindAt()), u: G => { lift(G); if (Math.random() < 0.3) press(G, { pot: (Math.random() * 3) | 0 }); } };
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.wait = 0; G.score = 100; G.parts = []; finish(G, true); }
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'roll', title: 'DRAG TO PAINT', how: 'Drag your thumb over the fence plank to roll paint on. Cover it all; keep off the grass.', need: 1 }],
  2: [{ id: 'pots', title: 'TWO COLOURS', how: 'Tap a pot to change colour. Paint each part the colour its faint pattern shows.', need: 1 }],
  3: [{ id: 'tape', title: 'TAPE IS SAFE', how: 'Use the BRUSH near the window. The blue tape is safe to paint over: it peels off at the end. Keep paint off the glass!', need: 1 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonDeal(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonDeal(G) { const st = lessonNow(G); G.rnd = rng(G.seed + (G.deals = (G.deals | 0) + 1)); G.lesson.n = 0; setup(G, { yard: st.id, job: { roll: 'fence', pots: 'hut', tape: 'door' }[st.id] }); if (st.id === 'roll') { for (let j = 0; j < GW * GH; j++) { const x = j % GW; if (G.grid[j] > 0) G.grid[j] = x >= 21 && x < 29 ? 1 : OUT; } G.target = 0; for (const v of G.grid) if (v > 0) G.target++; G.regions = regions(G); G.colours = [...new Set(Array.from(G.grid).filter(v => v > 0))]; G.colour = G.colours[0]; } G.ev.push({ k: 'yard' }); }
function lessonSee(G, what) { const L = lessonNow(G); if (!L || G.wait > 0) return;
  if (G.spill > G.target * 0.08) { G.ev.push({ k: 'lessonmiss', how: L.id === 'tape' ? 'Paint on the glass! Use the BRUSH near it, and keep to the tape.' : 'Too much paint off the edges! Keep your thumb on the thing you are painting.' }); G.wait = 1.6; G.next = () => lessonDeal(G); return; }
  if (cover(G) < 0.94 && !(what === 'done' && cover(G) >= 0.85)) return;
  G.lesson.n = 1; G.tapeOff = true; G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.wait = 1.6; G.next = () => { G.rnd = rng(G.seed); setup(G); G.ev.push({ k: 'start' }); G.ev.push({ k: 'yard' }); }; }
