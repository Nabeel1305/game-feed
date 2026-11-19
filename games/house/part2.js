// ===================== RULES: Homemaker (game 53, his idea) =====================
// Build houses on a plot, level by level: a shed first, then a cottage with windows and a roof, then rooms inside, then whole
// homes with several rooms, on tighter plots. The plot is a grid. Pick a piece from the tray and tap or drag on the plot:
// WALL (drag along the grid lines: walls snap to them), WINDOW and DOOR (tap a wall to turn it into one), FLOOR (drag over the
// squares), furniture (tap a square; tap it again to turn it), ROOF (one tap roofs every closed house). ERASE and UNDO are always
// there. The checklist shows what this house still needs; when it is all ticked, MOVE IN, and walk through your home. Every
// house is kept, so you can come back and improve it. Stars for building within the piece budget and for the extra wishes.
const RULES = [
  'Pick a piece from the tray, then <b>tap or drag</b> on the plot. <b>Walls</b> snap to the grid lines; drag to build a run.',
  'Tap a wall with <b>WINDOW</b> or <b>DOOR</b> to turn it into one. <b>FLOOR</b>: drag over the squares.',
  'Furniture: tap a square (tap again to turn it). A <b>room</b> is floor closed in by walls; what is in it makes it a bedroom, a kitchen...',
  '<b>ROOF</b> covers every closed house in one tap. <b>UNDO</b> and <b>ERASE</b> are always there.',
  'Tick the <b>checklist</b>, then <b>MOVE IN</b> and walk through. Your houses are kept: come back and improve them.',
];
const TOOLS = [
  { id: 'wall', name: 'Wall', icon: '▮', kind: 'edge' }, { id: 'window', name: 'Window', icon: '▭', kind: 'conv' }, { id: 'door', name: 'Door', icon: '🚪', kind: 'conv' },
  { id: 'floor', name: 'Floor', icon: '▦', kind: 'cell' }, { id: 'bed', name: 'Bed', icon: '🛏️', kind: 'item', n: 3 }, { id: 'stove', name: 'Stove', icon: '🍳', kind: 'item', n: 3 },
  { id: 'table', name: 'Table', icon: '🍽️', kind: 'item', n: 3 }, { id: 'sofa', name: 'Sofa', icon: '🛋️', kind: 'item', n: 5 }, { id: 'bath', name: 'Bath', icon: '🛁', kind: 'item', n: 6 },
  { id: 'desk', name: 'Desk', icon: '🖥️', kind: 'item', n: 9 }, { id: 'plant', name: 'Plant', icon: '🪴', kind: 'item', n: 4 }, { id: 'tree', name: 'Tree', icon: '🌳', kind: 'garden', n: 7 },
  { id: 'roof', name: 'Roof', icon: '⌂', kind: 'once' }, { id: 'erase', name: 'Erase', icon: '✕', kind: 'erase' } ];
const ROOMS = { bedroom: { name: 'a bedroom', need: ['bed'] }, kitchen: { name: 'a kitchen', need: ['stove', 'table'] }, living: { name: 'a living room', need: ['sofa'] }, bathroom: { name: 'a bathroom', need: ['bath'] }, study: { name: 'a study', need: ['desk'] } };
const PLACES = [{ name: 'Meadow Lane', grass: 0x6aa84a }, { name: 'Lakeside', grass: 0x5a9a5a }, { name: 'Hill Top', grass: 0x8aa850 }, { name: 'Pine Edge', grass: 0x4a8a4a }];
const placeOf = N => Math.floor((N - 1) / 5) % 4;
const UPGRADES = [
  { id: 'brick', name: 'Brick walls', desc: 'Your walls are red brick.', max: 1, cost: l => 40 },
  { id: 'tile', name: 'Clay tiles', desc: 'Your roofs are clay tiles.', max: 1, cost: l => 40 },
  { id: 'paint', name: 'Paint pot', desc: 'Doors and shutters in a bright colour.', max: 1, cost: l => 30 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Apprentice'], [40, 'Builder'], [130, 'Master builder'], [320, 'Architect'], [700, 'Town planner'], [1500, 'City maker']];
// the brief for each level: plot, what it must have, the wishes for stars, the piece budget
function briefOf(N) {
  if (N === 1) return { title: 'A garden shed', plot: [5, 5], minFloor: 4, rooms: [], windows: 0, door: 1, roof: false, wishes: [] };
  if (N === 2) return { title: 'A cottage', plot: [6, 6], minFloor: 9, rooms: [], windows: 2, door: 1, roof: true, wishes: [{ k: 'plant', n: 1 }] };
  if (N === 3) return { title: 'A one-room home', plot: [6, 6], minFloor: 9, rooms: ['bedroom'], items: ['stove', 'table'], windows: 2, door: 1, roof: true, wishes: [{ k: 'plant', n: 1 }] };
  if (N === 4) return { title: 'A two-room cottage', plot: [7, 6], minFloor: 12, rooms: ['bedroom', 'kitchen'], windows: 2, door: 1, roof: true, wishes: [{ k: 'everyWin' }] };
  const R = rng(N * 6271 + 5), pool = ['bedroom', 'kitchen', 'living', 'bathroom', 'study'].filter(r => N >= ({ bedroom: 1, kitchen: 1, living: 5, bathroom: 6, study: 9 })[r]), n = Math.min(pool.length, 2 + Math.floor((N - 3) / 3)), rooms = ['bedroom', 'kitchen'];
  while (rooms.length < n) { const r = pool[(R() * pool.length) | 0]; if (r !== 'kitchen' || !rooms.includes('kitchen')) rooms.push(r); }
  const area = rooms.length * 4 + 2, side = Math.ceil(Math.sqrt(area * 1.6)), tight = N >= 8 && R() < 0.5;
  return { title: ['A family home', 'A town house', 'A farmhouse', 'A lake house', 'A villa'][(R() * 5) | 0], plot: [Math.max(side + (tight ? 2 : 3), rooms.length * 2 + (tight ? 2 : 3)), side + (tight ? 1 : 2)], minFloor: area, rooms, windows: rooms.length, door: 1 + (N >= 7 ? 1 : 0), roof: true,
    wishes: [{ k: 'everyWin' }].concat(N >= 7 ? [{ k: 'tree', n: 2 }] : [{ k: 'plant', n: 2 }]), tight }; }
function makeCfg(N, help) { const b = briefOf(N); const f = curve(N), x = (a, c, s) => a + (c - a) * (1 - Math.exp(-f / s)); return { N, help: !!help, place: placeOf(N), brief: b, tools: TOOLS.filter(t => !t.n || t.n <= N).map(t => t.id), budget: Math.round(budgetOf(b) * (help ? 1.3 : 1)), work: Math.round(budgetOf(b) / 1.25 * x(2, 1.32, 30) * (help ? 1.25 : 1)) + 4 }; }      /* work: the jobs the crew can do before the family arrives */
// a tidy build of the brief takes about this many pieces; the budget allows some room
function budgetOf(b) { const area = Math.max(b.minFloor, b.rooms.length * 4), w = Math.ceil(Math.sqrt(area)), d = Math.ceil(area / w), per = 2 * (w + d) + Math.max(0, b.rooms.length - 1) * Math.max(w, d);
  return Math.ceil((per + w * d + b.rooms.reduce((a, r) => a + ROOMS[r].need.length, 0) + (b.items || []).length + 3) * 1.25); }
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0, [pw, pd] = cfg.brief.plot;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, place: cfg.place, wait: 0, pw, pd, tool: 'wall', E: {}, C: {}, items: {}, roof: false, hist: [], placed: 0 };
  if (o.load) load(G, o.load); if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else G.ev.push({ k: 'start' }); check(G);
  return G; }
// the plot: edges keyed 'h:x:z' (from x,z to x+1,z) and 'v:x:z' (x,z to x,z+1); cells 'x:z'
const ek = (o, x, z) => `${o}:${x}:${z}`, ck = (x, z) => `${x}:${z}`;
const inPlot = (G, x, z) => x >= 0 && z >= 0 && x < G.pw && z < G.pd;
function snapshot(G) { return JSON.stringify({ E: G.E, C: G.C, items: G.items, roof: G.roof }); }
function load(G, s) { try { const o = typeof s === 'string' ? JSON.parse(s) : s; G.E = o.E || {}; G.C = o.C || {}; G.items = o.items || {}; G.roof = !!o.roof; } catch (e) {} }
function push(G) { G.hist.push(snapshot(G)); if (G.hist.length > 80) G.hist.shift(); }
// ---------- what you do ----------
function setTool(G, id) { if (!G.cfg.tools.includes(id) || G.over) return false; if (id === 'roof') return raiseRoof(G); G.tool = id; G.ev.push({ k: 'tool', id }); return true; }
function placeEdge(G, o, x, z) { if (G.over || G.wait > 0) return false; const key = ek(o, x, z), t = G.tool, cur = G.E[key];
  if (o === 'h' ? !(x >= 0 && x < G.pw && z >= 0 && z <= G.pd) : !(z >= 0 && z < G.pd && x >= 0 && x <= G.pw)) return false;
  if (t === 'wall') { if (cur === 'wall') return false; push(G); G.E[key] = 'wall'; G.placed++; G.roof = false; G.ev.push({ k: 'put', what: 'wall', o, x, z }); return after(G); }
  if (t === 'window' || t === 'door') { if (!cur || cur === t) { if (!cur) G.ev.push({ k: 'needwall' }); return false; } push(G); G.E[key] = t; G.ev.push({ k: 'put', what: t, o, x, z }); return after(G); }
  if (t === 'erase') { if (!cur) return false; push(G); delete G.E[key]; G.roof = false; G.ev.push({ k: 'erase' }); return after(G); }
  return false; }
function placeCell(G, x, z) { if (G.over || G.wait > 0 || !inPlot(G, x, z)) return false; const key = ck(x, z), t = G.tool, T = TOOLS.find(q => q.id === t);
  if (t === 'floor') { if (G.C[key]) return false; push(G); G.C[key] = 1; G.placed++; G.roof = false; G.ev.push({ k: 'put', what: 'floor', x, z }); return after(G); }
  if (T && (T.kind === 'item' || T.kind === 'garden')) { const it = G.items[key];
    if (it && it.k === t) { push(G); it.r = (it.r + 1) % 4; G.ev.push({ k: 'turn', x, z }); return after(G); }
    if (T.kind === 'item' && !G.C[key]) { G.ev.push({ k: 'needfloor' }); return false; } if (T.kind === 'garden' && G.C[key]) return false;
    push(G); G.items[key] = { k: t, r: 0 }; G.placed++; G.ev.push({ k: 'put', what: t, x, z }); return after(G); }
  if (t === 'erase') { if (G.items[key]) { push(G); delete G.items[key]; G.ev.push({ k: 'erase' }); return after(G); } if (G.C[key]) { push(G); delete G.C[key]; G.roof = false; G.ev.push({ k: 'erase' }); return after(G); } }
  return false; }
// a tap on the plot at (fx, fz) in grid units: the nearest grid line for edge tools, the square for the rest
function tapAt(G, fx, fz) { const T = TOOLS.find(q => q.id === G.tool); if (!T) return false;
  const nearEdge = () => { const xi = Math.round(fx), zi = Math.round(fz), dx = Math.abs(fx - xi), dz = Math.abs(fz - zi); return dz < dx ? ['h', Math.floor(fx), zi] : ['v', xi, Math.floor(fz)]; };
  if (T.kind === 'edge' || T.kind === 'conv') { const [o, x, z] = nearEdge(); return placeEdge(G, o, x, z); }
  if (T.kind === 'erase') { const cx = Math.floor(fx), cz = Math.floor(fz), [o, x, z] = nearEdge(), ed = o === 'h' ? Math.abs(fz - z) : Math.abs(fx - x); if (ed < 0.18 && G.E[ek(o, x, z)]) return placeEdge(G, o, x, z); return placeCell(G, cx, cz); }
  return placeCell(G, Math.floor(fx), Math.floor(fz)); }
function undo(G) { if (G.over || !G.hist.length) return false; load(G, G.hist.pop()); G.ev.push({ k: 'undo' }); return after(G, false); }      /* undoing is free; the mistake already cost a job */
function raiseRoof(G) { if (G.over) return false; const A = analyse(G); if (!A.closed.length) { G.ev.push({ k: 'noroof' }); return false; } push(G); G.roof = true; G.ev.push({ k: 'roof' }); return after(G); }
function after(G, worked = true) { if (worked && !G.lesson) G.work = (G.work || 0) + 1; check(G); lessonSee(G); if (!G.lesson && !G.over && G.work >= G.cfg.work && !G.ready) { G.over = 'lost'; G.res = { win: false, stars: 0, pieces: G.pieces, budget: G.cfg.budget, missing: G.list.filter(q => !q.ok && !q.star).map(q => q.txt), coins: 1, save: snapshot(G) }; G.ev.push({ k: 'lost' }); } return true; }
// ---------- what the plot adds up to: rooms, closed houses, windows, doors ----------
function analyse(G) { const floor = Object.keys(G.C).map(k => k.split(':').map(Number)), seen = {}, rooms = [], E = G.E;
  const wallBetween = (x, z, nx, nz) => { const key = nx !== x ? ek('v', Math.max(x, nx), z) : ek('h', x, Math.max(z, nz)); return E[key]; };
  for (const [x, z] of floor) { if (seen[ck(x, z)]) continue; const cells = [], q = [[x, z]]; seen[ck(x, z)] = 1; let open = false; const edges = [];
    while (q.length) { const [cx, cz] = q.pop(); cells.push([cx, cz]); for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, nz = cz + dz, w = wallBetween(cx, cz, nx, nz);
        if (w) { edges.push({ w, x: cx, z: cz, nx, nz, out: !G.C[ck(nx, nz)] }); continue; } if (!G.C[ck(nx, nz)]) { open = true; continue; } if (!seen[ck(nx, nz)]) { seen[ck(nx, nz)] = 1; q.push([nx, nz]); } } }
    const items = cells.map(([cx, cz]) => G.items[ck(cx, cz)]).filter(Boolean).map(i => i.k); rooms.push({ cells, open, edges, items, windows: edges.filter(e => e.w === 'window' && e.out).length, outDoors: edges.filter(e => e.w === 'door' && e.out).length }); }
  // houses: rooms joined by inner doors; closed when none of their rooms is open to the outside
  const house = []; const rid = {}; rooms.forEach((r, i) => r.cells.forEach(([x, z]) => rid[ck(x, z)] = i)); const par = rooms.map((_, i) => i), f = i => par[i] === i ? i : (par[i] = f(par[i]));
  rooms.forEach((r, i) => r.edges.forEach(e => { if (e.w === 'door' && !e.out) { const j = rid[ck(e.nx, e.nz)]; if (j != null) par[f(i)] = f(j); } }));
  const groups = {}; rooms.forEach((r, i) => (groups[f(i)] = groups[f(i)] || []).push(r)); for (const g of Object.values(groups)) house.push({ rooms: g, closed: g.every(r => !r.open), floor: g.reduce((a, r) => a + r.cells.length, 0), windows: g.reduce((a, r) => a + r.windows, 0), doors: g.reduce((a, r) => a + r.outDoors, 0) });
  return { rooms, houses: house, closed: house.filter(h => h.closed) }; }
// the checklist
function check(G) { const b = G.cfg.brief, A = analyse(G), H = A.closed.sort((a, b2) => b2.floor - a.floor)[0], list = [];
  const add = (txt, ok, star) => list.push({ txt, ok: !!ok, star: !!star });
  add(`Floor of at least ${b.minFloor} squares`, H ? H.floor >= b.minFloor : Object.keys(G.C).length >= b.minFloor && false);
  add('Walls all the way round', !!H && A.houses.length === 1);
  add(b.door > 1 ? `${b.door} doors to the outside` : 'A door to the outside', H && H.doors >= b.door);
  if (b.windows) add(`${b.windows} windows`, H && H.windows >= b.windows);
  const roomsLeft = H ? H.rooms.slice() : [];
  for (const r of b.rooms) { const R = ROOMS[r], i = roomsLeft.findIndex(q => R.need.every(n => q.items.includes(n)) && q.cells.length >= 2); add(`${R.name[0].toUpperCase() + R.name.slice(1)} (${R.need.map(n => TOOLS.find(t => t.id === n).icon).join(' ')})`, i >= 0); if (i >= 0) roomsLeft.splice(i, 1); }
  for (const it of b.items || []) add(`A ${TOOLS.find(t => t.id === it).name.toLowerCase()} ${TOOLS.find(t => t.id === it).icon}`, H && H.rooms.some(q => q.items.includes(it)));
  if (b.roof) add('A roof on it', H && G.roof);
  // wishes (for stars)
  for (const w of b.wishes) { if (w.k === 'everyWin') add('Wish: a window in every room', H && H.rooms.every(q => q.windows > 0), true); else { const n = Object.values(G.items).filter(i => i.k === w.k).length; add(`Wish: ${w.n} ${TOOLS.find(t => t.id === w.k).name.toLowerCase()}${w.n > 1 ? 's' : ''}`, n >= w.n, true); } }
  G.list = list; G.ready = list.filter(q => !q.star).every(q => q.ok); G.pieces = Object.keys(G.E).length + Object.keys(G.C).length + Object.keys(G.items).length; return list; }
function moveIn(G) { if (G.over || G.wait > 0) return false; check(G); if (!G.ready) { G.ev.push({ k: 'notyet', what: G.list.find(q => !q.ok && !q.star) }); lessonSee(G, 'notyet'); return false; }
  if (G.lesson) { lessonSee(G, 'done'); return true; } return finish(G); }
function finish(G) { const c = G.cfg, wish = G.list.filter(q => q.star), within = G.pieces <= c.budget, stars = 1 + (within ? 1 : 0) + (wish.length && wish.every(q => q.ok) ? 1 : 0);
  G.over = 'won'; G.res = { win: true, stars, pieces: G.pieces, budget: c.budget, wishes: wish.filter(q => q.ok).length, ofWishes: wish.length, time: Math.round(G.t), save: snapshot(G), coins: 4 + Math.ceil(G.N / 3) + stars * 2 };
  G.ev.push({ k: 'won' }); return true; }
function step(G, dt) { if (G.over || !(dt > 0)) return; G.t += dt; if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0) { G.wait = 0; const f = G.next; G.next = null; if (f) f(); } } }
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'walls', title: 'FLOOR AND WALLS', how: 'Pick FLOOR and drag over 4 squares. Then pick WALL and drag along the grid lines all round it. Then DOOR: tap one of the walls. Tap MOVE IN.', need: 1 }],
  2: [{ id: 'roof', title: 'WINDOWS AND A ROOF', how: 'Turn two walls into WINDOWS (tap them), then tap ROOF. Then MOVE IN.', need: 1 }],
  3: [{ id: 'room', title: 'FURNISH IT', how: 'Put a bed, a stove and a table on the floor: pick one, tap a square (tap again to turn it). Then MOVE IN.', need: 1 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonSetup(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
// later lessons start from a part-built house, so each teaches one new thing
function lessonSetup(G) { const st = lessonNow(G); G.E = {}; G.C = {}; G.items = {}; G.roof = false; G.hist = [];
  const box = (x0, z0, w, d, door) => { for (let x = x0; x < x0 + w; x++) for (let z = z0; z < z0 + d; z++) G.C[ck(x, z)] = 1; for (let x = x0; x < x0 + w; x++) { G.E[ek('h', x, z0)] = 'wall'; G.E[ek('h', x, z0 + d)] = 'wall'; } for (let z = z0; z < z0 + d; z++) { G.E[ek('v', x0, z)] = 'wall'; G.E[ek('v', x0 + w, z)] = 'wall'; } if (door) G.E[ek('h', x0 + 1, z0 + d)] = 'door'; };
  if (st.id === 'roof') box(1, 1, 3, 3, true); if (st.id === 'room') { box(1, 1, 3, 3, true); G.E[ek('v', 1, 1)] = 'window'; G.E[ek('v', 4, 2)] = 'window'; G.roof = true; } check(G); }
function lessonSee(G, what) { const st = lessonNow(G); if (!st || what !== 'done') return; G.lesson.i++; if (G.lesson.i >= G.lesson.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.wait = 1.6; G.next = () => { G.E = {}; G.C = {}; G.items = {}; G.roof = false; G.hist = []; G.placed = 0; G.t = 0; G.ev.push({ k: 'start' }); check(G); }; } else lessonSetup(G); }
// the lessons' checklists
const _check = check; check = function (G) { const st = lessonNow(G); if (!st) return _check(G); const A = analyse(G), H = A.closed[0], L = [];
  if (st.id === 'walls') { L.push({ txt: 'Floor of at least 4 squares', ok: Object.keys(G.C).length >= 4 }, { txt: 'Walls all the way round', ok: !!H && H.floor >= 4 }, { txt: 'A door to the outside', ok: H && H.doors >= 1 }); }
  if (st.id === 'roof') { L.push({ txt: '2 windows', ok: H && H.windows >= 2 }, { txt: 'A roof on it', ok: H && G.roof }); }
  if (st.id === 'room') { for (const it of ['bed', 'stove', 'table']) L.push({ txt: `A ${it} ${TOOLS.find(t => t.id === it).icon}`, ok: H && H.rooms.some(q => q.items.includes(it)) }); }
  G.list = L; G.ready = L.every(q => q.ok); G.pieces = 0; return L; };
// ---------- for the robots ----------
// BLIND: a thumb that does not look: picks a tool, taps somewhere on the plot, undoes, or taps MOVE IN
const BLIND = { t: G => setTool(G, G.cfg.tools[(Math.random() * G.cfg.tools.length) | 0]), p: G => tapAt(G, Math.random() * G.pw, Math.random() * G.pd), m: G => moveIn(G), u: G => undo(G) };
// a builder who looks: lays out a rectangle big enough, splits it into rooms with inner walls and doors, a front door, a window
// in each room, furniture, the wishes, the roof; a slip of the thumb (acc) puts a piece in the wrong place, which it undoes
function plan(G) { const b = G.cfg.brief, st = lessonNow(G), steps = [];
  if (st && st.id === 'roof') { steps.push(['tool', 'window'], ['edge', 'v', 1, 1], ['edge', 'v', 4, 2], ['tool', 'roof']); return steps; }
  if (st && st.id === 'room') { steps.push(['tool', 'bed'], ['cell', 1, 1], ['tool', 'stove'], ['cell', 3, 1], ['tool', 'table'], ['cell', 2, 2]); return steps; }
  const rooms = st ? [] : b.rooms, nR = Math.max(1, rooms.length), area = Math.max(st ? 4 : b.minFloor, nR * 4), d = st ? 2 : Math.min(G.pd - 2, Math.max(2, Math.ceil(Math.sqrt(area / 1.4)))), w = Math.min(G.pw - 2, Math.max(2 * nR, Math.ceil(area / d))), x0 = 1, z0 = 1;
  steps.push(['tool', 'floor']); for (let x = x0; x < x0 + w; x++) for (let z = z0; z < z0 + d; z++) steps.push(['cell', x, z]);
  steps.push(['tool', 'wall']); for (let x = x0; x < x0 + w; x++) steps.push(['edge', 'h', x, z0], ['edge', 'h', x, z0 + d]); for (let z = z0; z < z0 + d; z++) steps.push(['edge', 'v', x0, z], ['edge', 'v', x0 + w, z]);
  // inner walls: split the width into rooms
  const cuts = []; for (let i = 1; i < nR; i++) cuts.push(x0 + Math.round(w * i / nR)); for (const cx of cuts) for (let z = z0; z < z0 + d; z++) steps.push(['edge', 'v', cx, z]);
  const bounds = [x0].concat(cuts, [x0 + w]);
  steps.push(['tool', 'door']); steps.push(['edge', 'h', x0, z0 + d]); if (!st && b.door > 1) steps.push(['edge', 'h', x0 + w - 1, z0]); for (const cx of cuts) steps.push(['edge', 'v', cx, z0]);
  if (!st && b.windows) { steps.push(['tool', 'window']); for (let i = 0; i < nR; i++) steps.push(['edge', 'h', i === 0 ? x0 + 1 : bounds[i], z0 + d]); for (let i = nR; i < b.windows; i++) steps.push(['edge', 'v', x0, z0 + d - 1 - (i - nR) % d]); }
  rooms.forEach((r, i) => ROOMS[r].need.forEach((it, j) => steps.push(['tool', it], ['cell', bounds[i] + (j % (bounds[i + 1] - bounds[i])), z0 + d - 1 - Math.floor(j / (bounds[i + 1] - bounds[i]))])));
  if (!st) (b.items || []).forEach((it, i) => steps.push(['tool', it], ['cell', x0 + w - 1 - i, z0]));
  if (!st) for (const wi of b.wishes) if (wi.k !== 'everyWin') for (let i = 0; i < wi.n; i++) { if (wi.k === 'tree') steps.push(['tool', 'tree'], ['cell', G.pw - 1, i]); else steps.push(['tool', wi.k], ['cell', x0 + i, z0]); }
  if (!st && b.roof) steps.push(['tool', 'roof']); return steps; }
function honest(G, o, mem) { const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random;
  if (G.over || G.wait > 0) return; mem.t = (mem.t || 0) - 1 / 60; if (mem.t > 0) return; mem.t = 0.15 + react * 0.6;
  const key = (lessonNow(G) || {}).id || 'main'; if (mem.key !== key) { mem.key = key; mem.steps = plan(G); mem.i = 0; mem.slip = 0; }
  if (mem.slip) { mem.slip = 0; undo(G); return; }
  if (mem.i >= mem.steps.length) { moveIn(G); if (!G.over && !G.lesson && G.ready === false) { mem.steps = plan(G); mem.i = 0; } return; }
  const s = mem.steps[mem.i++];
  if (s[0] === 'tool') { if (s[1] === 'roof') raiseRoof(G); else setTool(G, s[1]); return; }
  if (R() > acc) { if (tapAt(G, R() * G.pw, R() * G.pd)) mem.slip = 1; mem.i--; return; }
  if (s[0] === 'cell') placeCell(G, s[1], s[2]); else placeEdge(G, s[1], s[2], s[3]); }
function winNow(G) { if (!G || G.over || G.wait > 0) return; G.lesson = null; G.list = []; G.ready = true; finish(G); }
