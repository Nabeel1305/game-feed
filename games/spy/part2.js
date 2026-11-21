// ===================== THE RULES: Spy (his idea 18, 20 Nov 2026) =====================
// Get into the building from the van, find the secret document, take a clear photograph of it, and get back to the van
// without being caught. Left thumb: a floating stick (push further to run: faster but noisy). Right thumb: CROUCH (slow and
// silent; low desks hide you) and one ACTION button that says what it will do: OPEN / CLOSE a door, HIDE in a cupboard (and
// COME OUT), PHOTOGRAPH the file, TAKE a keycard or a bonus file, THROW a coin (a noise somewhere else).
// Guards walk their rounds. In their sight (the cone) they grow suspicious: a glimpse makes them look ("?"), more and they come
// to where they saw you; full sight is "!" and they run at you: if one reaches you, you are caught. Lose them and they search
// where they last saw you, then go back to their rounds. They hear running feet and coins. Later: security cameras that sweep,
// locked rooms (a keycard somewhere), the file on one of several desks.
// World: metres; a grid of 1 m cells, x to the right, z down the screen; the van is outside the bottom wall.
const RULES = [
  '<b>Left thumb</b>: a floating stick. Push it far to <b>run</b> (fast, but guards hear you).',
  '<b>CROUCH</b>: slow and silent, and <b>low desks</b> hide you. Tall cupboards and walls always hide you.',
  'The <b>ACTION</b> button says what it does: OPEN a door, HIDE in a cupboard, PHOTOGRAPH, TAKE, THROW a coin.',
  'Photograph the <b>file</b>: keep it inside the frame (the stick steadies it) until the picture is clear.',
  'Guards see in their <b>cone</b>: a glimpse makes them look ("?"), a long look and they come running ("!"). Break their sight and hide.',
  'Get back to the <b>van</b> with the photo. Fewer sightings, bonus files and a quick escape earn stars.',
];
const PLACES = [{ name: 'Small office' }, { name: 'Embassy annexe' }, { name: 'Research lab' }, { name: 'Bank headquarters' }];
const placeOf = N => Math.min(3, Math.floor((N - 1) / 8));
const SKINS = [{ id: 'trench', name: 'Trench coat', col: 0x8a6a42, stars: 0 }, { id: 'black', name: 'All black', col: 0x1a1c22, stars: 5 }, { id: 'navy', name: 'Navy', col: 0x1e2e52, stars: 12 },
  { id: 'grey', name: 'City grey', col: 0x6a6e74, stars: 20 }, { id: 'olive', name: 'Olive', col: 0x4a5a2a, stars: 30 }, { id: 'red', name: 'Bold red', col: 0x9a1a22, stars: 42 },
  { id: 'white', name: 'Ice white', col: 0xe8e8e8, stars: 56 }, { id: 'gold', name: 'Gold', col: 0xc8962a, stars: 75 }];
const UPGRADES = [      // comfort, never the whole answer: every mission is won by sneaking
  { id: 'soles', name: 'Soft soles', max: 2, cost: l => [40, 100][l], desc: 'Running is a little quieter.' },
  { id: 'coins', name: 'Pocket of coins', max: 2, cost: l => [50, 120][l], desc: 'One more coin to throw (from level 4).' },
  { id: 'lens', name: 'Steady lens', max: 2, cost: l => [35, 90][l], desc: 'The camera shakes a little less.' },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Trainee'], [60, 'Agent'], [200, 'Field agent'], [500, 'Senior agent'], [1100, 'Spymaster'], [2500, 'Ghost']];
const CELL = 1, PR = 0.3;      // a cell is a metre; the spy is a 0.3 m circle
// cells: 0 floor, 1 wall, 2 door (closed), 3 door (open), 4 locked door, 5 outside (pavement)
function makeCfg(N, help) { const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s));
  return { N, f, help: !!help, cols: N <= 2 ? 2 : N <= 5 ? 3 : Math.min(5, 3 + Math.floor((f - 4) / 10)), rows: N <= 4 ? 2 : 3, guards: N <= 4 ? 1 : Math.min(4, 1 + Math.floor((f - 1) / 8)),
    see: (N <= 2 ? 0.25 : N <= 3 ? 0.35 : x(0.42, 0.62, 40)) * (help ? 0.7 : 1), range: N <= 2 ? 4.8 : x(5.2, 6.0, 40), gspeed: N <= 2 ? 0.85 : x(1.0, 1.2, 40), cones: N <= 14 ? 1 : N <= 30 ? 0.5 : 0.25,
    crouch: N >= 2, hide: N >= 3, coins: N >= 4 ? 2 + upLv('coins') : 0, locked: N >= 7, cams: N >= 8 ? Math.min(3, 1 + Math.floor((f - 8) / 14)) : 0, moving: N >= 9, bonus: N >= 5 ? 1 + (N >= 15 ? 1 : 0) : 0,
    par: 0, shake: (0.05 + 0.04 * Math.min(1, f / 30)) * (1 - 0.25 * upLv('lens')) }; }
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, wait: 0, next: null, mini: !!o.mini };
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else { build(G); G.ev.push({ k: 'start' }); }
  return G; }
// ---------- the building: rooms in a grid, a corridor through the middle, doors, furniture, the file, guards ----------
function build(G, lesson) { const R = G.rnd, c = G.cfg, RS = 6, cols = lesson ? 2 : c.cols, rows = lesson ? (lesson === 'snap' ? 1 : 2) : c.rows, corr = rows >= 2 ? 1 : -1;
  const rh = r => r === corr ? 4 : RS, W = cols * RS + 1, rowY = []; let y = 0; for (let r = 0; r < rows; r++) { rowY.push(y); y += rh(r); } const H = y + 1 + 3;      // 3 rows of pavement below
  const g = []; for (let z = 0; z < H; z++) { g.push([]); for (let xx = 0; xx < W; xx++) g[z].push(z >= H - 3 ? 5 : 1); }
  const rooms = []; for (let r = 0; r < rows; r++) { if (r === corr) { for (let z = rowY[r] + 1; z < rowY[r] + rh(r); z++) for (let xx = 1; xx < W - 1; xx++) g[z][xx] = 0; rooms.push({ r, c: -1, x0: 1, z0: rowY[r] + 1, x1: W - 2, z1: rowY[r] + rh(r) - 1, corr: true }); continue; }
    for (let cc = 0; cc < cols; cc++) { const x0 = cc * RS + 1, z0 = rowY[r] + 1, x1 = x0 + RS - 2, z1 = z0 + rh(r) - 2; for (let z = z0; z <= z1; z++) for (let xx = x0; xx <= x1; xx++) g[z][xx] = 0; rooms.push({ r, c: cc, x0, z0, x1, z1 }); } }
  const door = (xx, z, k = 2) => { g[z][xx] = k; };
  // doors: between neighbours in a row (most), and from each room to the corridor (most); every room reachable
  const rid = (r, cc) => rooms.find(q => q.r === r && q.c === cc);
  for (const q of rooms) { if (q.corr) continue; const right = rid(q.r, q.c + 1); if (right && (R() < 0.65 || lesson)) door(q.x1 + 1, q.z0 + 1 + ((R() * (q.z1 - q.z0 - 1)) | 0), R() < 0.5 ? 3 : 2);
    if (corr >= 0) { const toward = q.r < corr ? q.z1 + 1 : q.z0 - 1; if (R() < 0.75 || q.c === 0 || !right) door(q.x0 + 1 + ((R() * (q.x1 - q.x0 - 1)) | 0), toward, R() < 0.6 ? 3 : 2); } }
  if (corr < 0) for (const q of rooms) { const right = rid(q.r, q.c + 1); if (right && g.slice(q.z0, q.z1 + 1).every(row => row[q.x1 + 1] === 1)) door(q.x1 + 1, q.z0 + 2, 3); }
  // the way in: a door in the bottom wall of the bottom-left room (a second, at the right, on bigger levels)
  const last = rows - 1, entr = []; const bl = rid(last, 0) || rooms.find(q => q.r === last); { const ex = bl.x0 + 2, ez = bl.z1 + 1; door(ex, ez, 3); entr.push({ x: ex + 0.5, z: ez + 1.5 }); }
  if (!lesson && cols >= 4) { const br = rid(last, cols - 1); const ex = br.x1 - 1, ez = br.z1 + 1; door(ex, ez, 3); entr.push({ x: ex + 0.5, z: ez + 1.5 }); }
  // make sure every room connects (a door to the corridor or a neighbour)
  G.grid = g; G.W = W; G.H = H; G.rooms = rooms; G.furn = []; G.fgrid = null; G.entr = entr; G.van = { x: entr[0].x, z: H - 1.2 };
  for (const q of rooms) if (!q.corr && !pathTo(G, { x: q.x0 + 0.5, z: q.z0 + 0.5 }, entr[0], true)) { const up = corr >= 0 ? (q.r < corr ? q.z1 + 1 : q.z0 - 1) : null; if (up != null) door(q.x0 + 2, up, 3); else door(q.x1 + 1, q.z0 + 2, 3); }
  // furniture: desks (low: hide a crouching spy), cupboards (tall, hide in some), plants (just in the way)
  const busy = (xx, z) => g[z][xx] !== 0 || G.furn.some(f => f.x === xx && f.z === z) || [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => g[z + b] && g[z + b][xx + a] >= 2 && g[z + b][xx + a] <= 4);
  const put = (q, kind, n) => { for (let k = 0, t = 0; k < n && t < 60; t++) { const xx = q.x0 + 1 + ((R() * (q.x1 - q.x0 - 1)) | 0), z = q.z0 + 1 + ((R() * (q.z1 - q.z0 - 1)) | 0); if (busy(xx, z)) continue; G.furn.push({ kind, x: xx, z }); if (!pathTo(G, { x: q.x0 + 0.5, z: q.z0 + 0.5 }, entr[0], true) && !q.corr) { G.furn.pop(); continue; } k++; } };
  for (const q of rooms) { if (q.corr) { put(q, 'plant', Math.floor((q.x1 - q.x0) / 7)); continue; } put(q, 'desk', 2 + ((R() * 2) | 0)); put(q, R() < 0.5 ? 'cupboard' : 'plant', 1); }
  // closets to hide in (a few), the file (or several desks it might be on), bonus files, keycard and a locked room
  const deskRooms = rooms.filter(q => !q.corr && q.r === 0); const far = deskRooms[(R() * deskRooms.length) | 0] || rooms[0];
  if (lesson !== 'snap') for (const q of rooms.filter(q => !q.corr && R() < 0.6 || lesson === 'hide')) put(q, 'closet', 1);
  const desksIn = q => G.furn.filter(f => f.kind === 'desk' && f.x >= q.x0 && f.x <= q.x1 && f.z >= q.z0 && f.z <= q.z1);
  const cands = []; for (const q of (c.moving && !lesson ? deskRooms.concat(rooms.filter(q => !q.corr && q.r !== 0 && q !== bl)) : [far])) { const d = desksIn(q)[0]; if (d && !cands.includes(d) && cands.length < (c.moving && !lesson ? 3 : 1)) cands.push(d); }
  if (!cands.length) { G.furn.push({ kind: 'desk', x: far.x0 + 2, z: far.z0 + 2 }); cands.push(G.furn[G.furn.length - 1]); }
  const real = cands[(R() * cands.length) | 0]; G.doc = { x: real.x + 0.5, z: real.z + 0.5, desk: real, cands: cands.map(d => ({ x: d.x + 0.5, z: d.z + 0.5 })), found: cands.length === 1, shot: false };
  G.bonus = []; if (!lesson) for (let i = 0; i < c.bonus; i++) { const q = rooms.filter(r2 => !r2.corr)[((R() * 99) | 0) % rooms.filter(r2 => !r2.corr).length], d = desksIn(q).find(dd => dd !== real && !G.bonus.some(b => b.desk === dd)); if (d) G.bonus.push({ x: d.x + 0.5, z: d.z + 0.5, desk: d, got: false }); }
  G.key = null; if (c.locked && !lesson && far !== bl) { const dz = G.grid; for (let z = far.z0 - 1; z <= far.z1 + 1; z++) for (let xx = far.x0 - 1; xx <= far.x1 + 1; xx++) if (dz[z] && (dz[z][xx] === 2 || dz[z][xx] === 3)) dz[z][xx] = 4;
    const others = rooms.filter(q => !q.corr && q !== far); for (let t = 0; t < 30 && !G.key; t++) { const q = others[(R() * others.length) | 0], xx = q.x0 + 1 + ((R() * (q.x1 - q.x0 - 1)) | 0), z = q.z0 + 1 + ((R() * (q.z1 - q.z0 - 1)) | 0); if (!busy(xx, z) && pathTo(G, { x: xx + 0.5, z: z + 0.5 }, entr[0], true)) G.key = { x: xx + 0.5, z: z + 0.5, got: false }; } if (!G.key) for (let z = 0; z < H; z++) for (let xx = 0; xx < W; xx++) if (dz[z][xx] === 4) dz[z][xx] = 2; }
  // the guards: rounds through the corridor and rooms
  G.guards = []; const gn = lesson === 'snap' ? 0 : lesson ? 1 : c.guards;
  for (let i = 0; i < gn; i++) { const pts = [], pool = rooms.slice().sort(() => R() - 0.5); for (const q of pool.slice(0, 2 + ((R() * 2) | 0))) pts.push(q.corr ? { x: q.x0 + 1 + R() * (q.x1 - q.x0 - 1), z: (q.z0 + q.z1) / 2 + 0.5 } : { x: (q.x0 + q.x1) / 2 + 0.5, z: (q.z0 + q.z1) / 2 + 0.5 });
    if (lesson === 'crouch') { const q = rooms.find(r2 => r2.r === 0 && r2.c === 1) || rooms[0]; pts.length = 0; pts.push({ x: q.x0 + 1.5, z: q.z0 + 1.5 }, { x: q.x1 - 0.5, z: q.z0 + 1.5 }); }
    if (lesson === 'hide') { const q = rooms.find(r2 => r2.corr) || rooms[0]; pts.length = 0; pts.push({ x: q.x0 + 1.5, z: q.z0 + 1.5 }, { x: q.x1 - 0.5, z: q.z0 + 1.5 }); }
    const p0 = pts[0]; G.guards.push({ x: p0.x, z: p0.z, face: 0, pts, pi: 1, path: null, st: 'patrol', sus: 0, wait: 0, look: 0, tgt: null, seenT: 0, speed: c.gspeed * (lesson ? 0.8 : 1) * (0.9 + 0.2 * R()), step: 0 }); }
  G.cams = []; if (!lesson) for (let i = 0; i < c.cams; i++) { const q = rooms[(i * 3 + 1) % rooms.length]; G.cams.push({ x: q.x0 + 0.2, z: q.z0 + 0.2, base: Math.PI / 4 + (q.corr ? 0 : 0), a: 0, sweep: 0.9, sp: 0.35 + 0.1 * i, ph: R() * 6, off: 0, range: 6.5 }); }
  // you, by the van
  G.me = { x: G.van.x, z: G.van.z - 0.6, face: Math.PI, sx: 0, sz: 0, crouch: false, hidden: null, cam: false, photo: null, coins: c.coins, noise: 0, step: 0, run: false };
  G.clock = lesson ? 9999 : Math.round((70 + 11 * rooms.length + 8 * G.guards.length) * (c.help ? 1.3 : 1));      // the shift changes: be out before then
  G.noises = []; G.coinsF = []; G.seen = 0; G.spotted = 0; G.alarmT = 0; G.photoQ = 0; }
const cellAt = (G, x, z) => { const xx = Math.floor(x), zz = Math.floor(z); return G.grid[zz] && G.grid[zz][xx] != null ? G.grid[zz][xx] : 1; };
function furnAt(G, x, z) { const L = G.furn.length, last = G.furn[L - 1]; if (!G.fgrid || G.fgridN !== L || G.fgridLast !== last) { G.fgrid = new Array(G.W * G.H); for (const f of G.furn) G.fgrid[f.z * G.W + f.x] = f; G.fgridN = L; G.fgridLast = last; } const xx = Math.floor(x), zz = Math.floor(z); return xx < 0 || zz < 0 || xx >= G.W || zz >= G.H ? undefined : G.fgrid[zz * G.W + xx]; }      // a grid of the furniture (looked up thousands of times a second)
const solid = (G, x, z) => { const c = cellAt(G, x, z); return c === 1 || c === 2 || c === 4 || !!furnAt(G, x, z); };
// line of sight from (ax, az) to (bx, bz): walls, closed doors and cupboards block; desks block a crouching target near them
function sight(G, ax, az, bx, bz, low) { const d = Math.hypot(bx - ax, bz - az), n = Math.ceil(d / 0.2);
  for (let i = 1; i < n; i++) { const x = ax + (bx - ax) * i / n, z = az + (bz - az) * i / n, c = cellAt(G, x, z); if (c === 1 || c === 2 || c === 4) return false; const f = furnAt(G, x, z); if (f && (f.kind === 'cupboard' || f.kind === 'closet')) return false; if (f && f.kind === 'desk' && low && Math.hypot(bx - x, bz - z) < 1.6) return false; }
  return true; }
// A* over cells (doors count as open for planning when 'doors' is true)
function pathTo(G, a, b, doors) { const W = G.W, H = G.H, key = (x, z) => z * W + x, sx = Math.floor(a.x), sz = Math.floor(a.z), tx = Math.floor(b.x), tz = Math.floor(b.z);
  const ok = (x, z) => { if (x < 0 || z < 0 || x >= W || z >= H) return false; const c = G.grid[z][x]; if (c === 1 || (c === 4 && !(G.me && G.me.key))) return false; if (c === 2 && !doors) return false; if (x === tx && z === tz) return true; return !furnAt(G, x, z); };
  const open = [[sx, sz]], came = new Map(), gs = new Map([[key(sx, sz), 0]]), seen = new Set(); let it = 0;
  while (open.length && it++ < 4000) { let bi = 0, bf = 1e9; for (let i = 0; i < open.length; i++) { const [x, z] = open[i], f = gs.get(key(x, z)) + Math.abs(x - tx) + Math.abs(z - tz); if (f < bf) { bf = f; bi = i; } } const [x, z] = open.splice(bi, 1)[0], kk = key(x, z);
    if (x === tx && z === tz) { const out = []; let k2 = kk; while (k2 != null) { out.unshift({ x: k2 % W + 0.5, z: Math.floor(k2 / W) + 0.5 }); k2 = came.get(k2); } return out; }
    if (seen.has(kk)) continue; seen.add(kk);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, nz = z + dz; if (!ok(nx, nz)) continue; const nk = key(nx, nz), gg = gs.get(kk) + 1 + (G.cost ? G.cost(nx, nz) : 0); if (gg < (gs.has(nk) ? gs.get(nk) : 1e9)) { gs.set(nk, gg); came.set(nk, kk); open.push([nx, nz]); } } }
  return null; }
// ---------- your thumbs ----------
function stick(G, x, z) { const m = G.me; if (!m) return; const L = Math.hypot(x, z); m.sx = L > 1 ? x / L : x; m.sz = L > 1 ? z / L : z; }
function crouchBtn(G, on) { const m = G.me; if (!m || !G.cfg.crouch && !G.lesson) return; m.crouch = on == null ? !m.crouch : !!on; G.ev.push({ k: m.crouch ? 'crouch' : 'stand' }); lessonSee(G, m.crouch ? 'crouch' : 'stand'); }
// what the ACTION button will do here, now (the label on the button)
function actionHere(G) { const m = G.me; if (!m || G.over || G.wait > 0) return null; if (m.hidden) return { k: 'unhide', label: 'COME OUT' }; if (m.cam) return { k: 'camoff', label: 'LOWER CAMERA' };
  const near = (p, r) => p && Math.hypot(p.x - m.x, p.z - m.z) < r;
  if (!G.doc.shot && near(G.doc, 1.45)) return { k: 'photo', label: 'PHOTOGRAPH' };
  const cand = G.doc.cands.find(c2 => near(c2, 1.45)); if (cand && !G.doc.shot && !G.doc.found) return { k: 'check', label: 'LOOK AT DESK' };
  const b = G.bonus.find(q => !q.got && near(q, 1.45)); if (b) return { k: 'take', label: 'TAKE FILE', it: b };
  if (G.key && !G.key.got && near(G.key, 1.0)) return { k: 'key', label: 'TAKE KEYCARD' };
  const dr = doorNear(G), facing = dr && Math.cos(Math.atan2(dr.x + 0.5 - m.x, dr.z + 0.5 - m.z) - m.face) > 0.5;      // walking at a door: the door comes first
  if (dr && facing && !(dr.c === 3)) return { k: 'door', label: dr.c === 4 ? (m.key ? 'UNLOCK' : 'LOCKED') : 'OPEN DOOR', it: dr };
  const cl = G.furn.find(f => f.kind === 'closet' && near({ x: f.x + 0.5, z: f.z + 0.5 }, 1.25)); if (cl && (G.cfg.hide || G.lesson)) return { k: 'hide', label: 'HIDE', it: cl }; if (dr) return { k: 'door', label: dr.c === 4 ? (m.key ? 'UNLOCK' : 'LOCKED') : dr.c === 2 ? 'OPEN DOOR' : 'CLOSE DOOR', it: dr };
  if (m.coins > 0) return { k: 'coin', label: `THROW COIN (${m.coins})` };
  return null; }
function doorNear(G) { const m = G.me; let best = null, bd = 1.3; for (let z = Math.floor(m.z) - 1; z <= Math.floor(m.z) + 1; z++) for (let x = Math.floor(m.x) - 1; x <= Math.floor(m.x) + 1; x++) { const c = G.grid[z] && G.grid[z][x]; if (c >= 2 && c <= 4) { const d = Math.hypot(x + 0.5 - m.x, z + 0.5 - m.z); if (d < bd && !(c === 3 && Math.floor(m.x) === x && Math.floor(m.z) === z)) { bd = d; best = { x, z, c }; } } } return best; }
function action(G) { const A = actionHere(G), m = G.me; if (!A) return false;
  switch (A.k) {
    case 'unhide': m.hidden = null; G.ev.push({ k: 'unhide' }); break;
    case 'camoff': m.cam = false; m.photo = null; G.ev.push({ k: 'camoff' }); break;
    case 'photo': m.cam = true; m.photo = { fx: 0.35 * (G.rnd() < 0.5 ? -1 : 1), fz: 0.2, vx: 0, vz: 0, q: 0 }; m.sx = m.sz = 0; G.ev.push({ k: 'camon' }); lessonSee(G, 'camon'); break;
    case 'check': { const c2 = G.doc.cands.find(q => Math.hypot(q.x - m.x, q.z - m.z) < 1.45); if (Math.hypot(c2.x - G.doc.x, c2.z - G.doc.z) < 0.1) { G.doc.found = true; G.ev.push({ k: 'found' }); } else { c2.empty = true; G.doc.cands = G.doc.cands.filter(q => q !== c2); if (G.doc.cands.length === 1) G.doc.found = true; G.ev.push({ k: 'empty' }); } break; }
    case 'take': A.it.got = true; G.ev.push({ k: 'bonus' }); break;
    case 'key': G.key.got = true; m.key = true; G.ev.push({ k: 'key' }); break;
    case 'hide': { m.hidden = A.it; m.cam = false; const spot = [[0, 1], [1, 0], [-1, 0], [0, -1]].map(([a2, b2]) => ({ x: A.it.x + 0.5 + a2, z: A.it.z + 0.5 + b2 })).filter(q => !blocked(G, q.x, q.z)).sort((p1, p2) => Math.hypot(p1.x - m.x, p1.z - m.z) - Math.hypot(p2.x - m.x, p2.z - m.z))[0]; if (spot) { m.x = spot.x; m.z = spot.z; } } G.ev.push({ k: 'hide' }); lessonSee(G, 'hide'); break;
    case 'door': { const d = A.it; if (d.c === 4) { if (!m.key) { G.ev.push({ k: 'locked' }); return false; } G.grid[d.z][d.x] = 3; G.ev.push({ k: 'unlock' }); break; } G.grid[d.z][d.x] = d.c === 2 ? 3 : 2; G.ev.push({ k: d.c === 2 ? 'open' : 'close' }); makeNoise(G, d.x + 0.5, d.z + 0.5, 1.6); break; }
    case 'coin': { m.coins--; let x = m.x, z = m.z; const fx = Math.sin(m.face), fz = Math.cos(m.face); for (let i = 0; i < 25; i++) { const nx = x + fx * 0.25, nz = z + fz * 0.25; if (solid(G, nx, nz)) break; x = nx; z = nz; } G.coinsF.push({ x, z, t: 0, ox: m.x, oz: m.z }); G.ev.push({ k: 'coin' }); setTimeoutG(G, 0.5, () => makeNoise(G, x, z, 7, true)); break; }
  } return true; }
function setTimeoutG(G, t, f) { (G.timers = G.timers || []).push({ t, f }); }
function makeNoise(G, x, z, r, coin) { G.noises.push({ x, z, r, t: 0, coin }); for (const g of G.guards) if (Math.hypot(g.x - x, g.z - z) < r && g.st !== 'alert') { g.st = 'investigate'; g.tgt = { x, z }; g.path = null; g.look = 3 + G.rnd() * 1.5; g.sus = Math.max(g.sus, 0.3); G.ev.push({ k: 'heard', coin }); } }
// ---------- the clock ----------
function step(G, dt) { if (G.over || !(dt > 0)) return;
  if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0) { G.wait = 0; if (G.next) { const f = G.next; G.next = null; f(); } } return; }
  G.t += dt; const m = G.me, c = G.cfg;
  if (G.timers) for (let i = G.timers.length - 1; i >= 0; i--) { const q = G.timers[i]; q.t -= dt; if (q.t <= 0) { G.timers.splice(i, 1); q.f(); } }
  // you: move (not while hidden or photographing); running is noisy
  const L = Math.hypot(m.sx, m.sz); m.run = L > 0.85 && !m.crouch && !m.cam && !m.hidden;
  if (!m.hidden && !m.cam && L > 0.08) { const sp = m.crouch ? 0.95 : m.run ? 3.0 : 1.7; const vx = m.sx * sp, vz = -m.sz * sp; m.face = Math.atan2(vx, vz);
    const nx = m.x + vx * dt, nz = m.z + vz * dt, cx = Math.floor(m.x) + 0.5, cz = Math.floor(m.z) + 0.5; let mx2 = false, mz2 = false; if (!blocked(G, nx, m.z)) { m.x = nx; mx2 = true; } if (!blocked(G, m.x, nz)) { m.z = nz; mz2 = true; }
    if (!mz2 && Math.abs(vz) > Math.abs(vx) && Math.abs(m.x - cx) > 0.02) { const s2 = Math.min(Math.abs(m.x - cx), sp * dt); if (!blocked(G, m.x + Math.sign(cx - m.x) * s2, m.z)) m.x += Math.sign(cx - m.x) * s2; }      // slide into a doorway: line up with it
    if (!mx2 && Math.abs(vx) > Math.abs(vz) && Math.abs(m.z - cz) > 0.02) { const s2 = Math.min(Math.abs(m.z - cz), sp * dt); if (!blocked(G, m.x, m.z + Math.sign(cz - m.z) * s2)) m.z += Math.sign(cz - m.z) * s2; } m.step += Math.hypot(vx, vz) * dt;
    if (m.run && m.step > 0.9) { m.step = 0; makeNoise(G, m.x, m.z, 4.5 * (1 - 0.2 * upLv('soles'))); G.ev.push({ k: 'foot', run: true }); } else if (!m.run && m.step > 0.8) { m.step = 0; G.ev.push({ k: 'foot' }); } }
  // the camera: the frame drifts (more with a guard near); the stick steadies it; hold the file in the frame until it is clear
  if (m.cam && m.photo) { const P = m.photo, threat = Math.max(0, ...G.guards.map(g => g.st === 'alert' ? 1 : clamp(1 - Math.hypot(g.x - m.x, g.z - m.z) / 7, 0, 1) * 0.8)), amp = c.shake * (1 + 2 * threat);
    P.vx += ((G.rnd() - 0.5) * amp * 30 - P.vx * 2.5) * dt; P.vz += ((G.rnd() - 0.5) * amp * 30 - P.vz * 2.5) * dt; P.fx += (P.vx + m.sx * 0.9) * dt; P.fz += (P.vz - m.sz * 0.9) * dt; P.fx = clamp(P.fx, -0.6, 0.6); P.fz = clamp(P.fz, -0.6, 0.6);
    const inF = Math.abs(P.fx) < 0.16 && Math.abs(P.fz) < 0.16, still = Math.hypot(P.vx, P.vz) < 0.35; P.inF = inF; P.q = clamp(P.q + (inF && still ? dt / 1.1 : -dt * 0.4), 0, 1);
    if (P.q >= 1) { G.doc.shot = true; G.photoQ = 1; m.cam = false; m.photo = null; G.ev.push({ k: 'snap' }); lessonSee(G, 'snap'); } }
  // coins in the air
  for (const q of G.coinsF) q.t += dt; G.coinsF = G.coinsF.filter(q => q.t < 0.6); for (const q of G.noises) q.t += dt; G.noises = G.noises.filter(q => q.t < 1.2);
  // the guards
  let watched = 0; for (const g of G.guards) { guardStep(G, g, dt); watched = Math.max(watched, g.sus); if (G.over) return; }
  for (const k2 of G.cams) { k2.a = k2.base + Math.sin(G.t * k2.sp + k2.ph) * k2.sweep; if (k2.off > 0) { k2.off -= dt; continue; } if (!m.hidden && seesFrom(G, k2.x, k2.z, k2.a, 0.38, k2.range)) { k2.see = (k2.see || 0) + dt; if (k2.see > 0.5) { k2.see = 0; G.ev.push({ k: 'camalarm' }); for (const g of G.guards) { if (g.st === 'patrol') { g.st = 'investigate'; g.tgt = { x: m.x, z: m.z }; g.path = null; g.look = 3; } g.sus = Math.max(g.sus, 0.45); } } } else k2.see = 0; }
  G.watched = watched;
  G.clock -= dt; if (G.clock <= 0 && !G.lesson) { G.ev.push({ k: 'shift' }); finish(G, false, { why: 'time' }); return; }
  // home: back at the van with the photo
  if (G.doc.shot && Math.hypot(m.x - G.van.x, m.z - G.van.z) < 1.2) { if (G.lesson) { lessonSee(G, 'van'); return; } finish(G, true); } }
function blocked(G, x, z) { for (const [a, b] of [[PR, 0], [-PR, 0], [0, PR], [0, -PR], [PR * 0.7, PR * 0.7], [-PR * 0.7, PR * 0.7], [PR * 0.7, -PR * 0.7], [-PR * 0.7, -PR * 0.7]]) if (solid(G, x + a, z + b)) return true; return x < 0.3 || z < 0.3 || x > G.W - 0.3 || z > G.H - 0.3; }
// does someone at (x, z) facing a see you? (half-angle, range); crouching: shorter range, desks hide you
function seesFrom(G, x, z, a, half, range) { const m = G.me, dx = m.x - x, dz = m.z - z, d = Math.hypot(dx, dz), r = range * (m.crouch ? 0.65 : 1) * (m.run ? 1.15 : 1); if (d > r || m.hidden) return 0;
  let da = Math.atan2(dx, dz) - a; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU; if (Math.abs(da) > half && d > 0.9) return 0;
  if (!sight(G, x, z, m.x, m.z, m.crouch)) return 0; return 1 - d / (r + 0.01) * 0.7; }
function guardStep(G, g, dt) { const m = G.me, c = G.cfg;
  // seeing: a glimpse makes him look, more and he comes, full and he runs at you
  const v = seesFrom(G, g.x, g.z, g.face, 0.62, c.range); if (v > 0) { g.sus = Math.min(1.2, g.sus + dt * c.see * (0.6 + 1.4 * v) * (m.cam ? 1.3 : 1)); g.last = { x: m.x, z: m.z }; g.seenT = 0; if (!g.seenOnce) { g.seenOnce = true; G.ev.push({ k: 'glimpse' }); } } else { g.seenT += dt; g.sus = Math.max(0, g.sus - dt * (g.st === 'alert' ? 0.12 : 0.22)); g.seenOnce = g.sus > 0.05 && g.seenOnce; }
  if (G.lesson && G.lesson.safe) g.sus = Math.min(g.sus, 0.9);
  if (g.sus >= 1 && g.st !== 'alert') { g.st = 'alert'; g.path = null; G.spotted++; G.ev.push({ k: 'spotted' }); }
  else if (g.sus >= 0.35 && v > 0 && (g.st === 'patrol' || g.st === 'investigate')) { g.st = 'look'; g.tgt = { x: m.x, z: m.z }; g.look = 1.2; g.path = null; G.ev.push({ k: 'huh' }); }
  // moving
  let goal = null, sp = c.gspeed * (g.speed / c.gspeed);
  if (g.st === 'alert') { if (v > 0) goal = { x: m.x, z: m.z }; else if (g.seenT > 3.5) { g.st = 'search'; g.tgt = g.last; g.look = 4; g.path = null; G.ev.push({ k: 'gone' }); } else goal = g.last; sp *= 1.6;
    if (v > 0 && Math.hypot(m.x - g.x, m.z - g.z) < 0.75) { G.caughtBy = g; return caught(G); } }
  else if (g.st === 'look') { g.face = turnTo(g.face, Math.atan2(g.tgt.x - g.x, g.tgt.z - g.z), dt * 4); g.look -= dt; if (g.look <= 0) { g.st = g.sus >= 0.5 ? 'search' : 'patrol'; g.look = 3.5; g.path = null; } }
  else if (g.st === 'investigate' || g.st === 'search') { goal = g.tgt; sp *= g.st === 'search' ? 1.15 : 1; if (goal && Math.hypot(goal.x - g.x, goal.z - g.z) < 0.6) { goal = null; g.look -= dt; g.face += dt * 1.6; if (g.look <= 0) { g.st = 'patrol'; g.path = null; g.tgt = null; } } }
  else { if (g.wait > 0) { g.wait -= dt; g.face += dt * 0.8 * Math.sin(G.t * 0.7 + g.x); } else goal = g.pts[g.pi]; }
  if (goal) { if (!g.path || G.t - (g.pathT || 0) > (g.st === 'alert' ? 0.4 : 1.2) || (g.pathFor !== goal && g.st !== 'alert')) { g.path = pathTo(G, g, goal, true) || [goal]; g.pathFor = goal; g.pathT = G.t; } const p = g.path[0] && Math.hypot(g.path[0].x - g.x, g.path[0].z - g.z) < 0.25 && g.path.length > 1 ? (g.path.shift(), g.path[0]) : g.path[0] || goal;
    const dx = p.x - g.x, dz = p.z - g.z, d = Math.hypot(dx, dz); if (d > 0.05) { const cx = Math.floor(p.x), cz = Math.floor(p.z); if (G.grid[cz] && G.grid[cz][cx] === 2) { G.grid[cz][cx] = 3; G.ev.push({ k: 'gdoor' }); }
      g.face = turnTo(g.face, Math.atan2(dx, dz), dt * (g.st === 'alert' ? 8 : 5)); const s = Math.min(d, sp * dt); g.x += dx / d * s; g.z += dz / d * s; g.step += s; }
    if (g.st === 'patrol' && Math.hypot(goal.x - g.x, goal.z - g.z) < 0.35) { g.pi = (g.pi + 1) % g.pts.length; g.wait = 1.2 + G.rnd() * 1.6; g.path = null; } } }
const turnTo = (a, b, k2) => { let d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return a + clamp(d, -k2, k2); };
function caught(G) { G.ev.push({ k: 'caught' }); if (G.lesson) { G.ev.push({ k: 'lessonmiss', how: lessonNow(G).how }); G.wait = 1.4; G.next = () => lessonDeal(G); return; } finish(G, false, { why: 'caught' }); }
function finish(G, win, o = {}) { if (G.over) return true; G.over = win ? 'won' : 'lost'; const bon = G.bonus.filter(b => b.got).length, clean = G.spotted === 0, par = 40 + G.W * 2.2;
  const stars = win ? 1 + (clean ? 1 : 0) + (bon >= Math.max(1, G.bonus.length) && G.bonus.length || (!G.bonus.length && G.t < par) ? 1 : 0) : 0;
  G.res = { win, stars, why: o.why || null, spotted: G.spotted, bonus: bon, bonusN: G.bonus.length, time: Math.round(G.t), clean, coins: win ? Math.max(1, 6 + Math.ceil(G.N / 2) + stars * 3 + bon * 4 - G.spotted * 2) : 1 };
  G.ev.push({ k: win ? 'won' : 'lost' }); return true; }
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'snap', title: 'IN, SNAP, OUT', how: 'Walk in (left thumb), to the desk with the glowing file. Tap PHOTOGRAPH and keep the file in the frame (steady it with the stick). Then back to the van.', need: 1 }],
  2: [{ id: 'crouch', title: 'CROUCH BEHIND DESKS', how: 'A guard watches the far room. Tap CROUCH: slow and silent, and the desks hide you. Get the photo and get out unseen.', need: 1 }],
  3: [{ id: 'hide', title: 'HIDE IN A CUPBOARD', how: 'A guard walks the corridor. Stand by a cupboard and tap HIDE until he has passed, then come out and carry on.', need: 1 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0, safe: true }; G.ev.push({ k: 'lessonnext', first: true }); lessonDeal(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonDeal(G) { const st = lessonNow(G); G.rnd = rng(G.seed + (G.deals = (G.deals | 0) + 1)); build(G, st.id); G.spotted = 0; G.ev.push({ k: 'yard' }); }
function lessonSee(G, what) { const L = lessonNow(G); if (!L) return; if (what === 'van') { G.lesson = null; G.ev.push({ k: 'lessonok', n: 1, need: 1 }); G.ev.push({ k: 'lessondone', N: G.N }); G.wait = 1.6; G.next = () => { G.rnd = rng(G.seed); build(G); G.ev.push({ k: 'start' }); }; } }
// ---------- for the robots ----------
const BLIND = {
  m: G => { if (Math.random() < 0.3) crouchBtn(G); if (Math.random() < 0.2) stick(G, 0, 0); else { const a = Math.random() * TAU, r = Math.random() < 0.5 ? 1 : 0.6; stick(G, Math.cos(a) * r, Math.sin(a) * r); } },      // the stick any way (or let go), now and then crouch or stand
  a: G => action(G),          // the action button, whatever it says
};
// HONEST: a careful player who looks: plans a way that keeps out of the guards' cones, waits behind cover when the next steps
// are seen, crouches near guards, hides when one comes, throws a coin to move a guard who blocks the way, photographs steadily.
function honest(G, o, mem) { if (G.over || G.wait > 0 || !G.me) return; const m = G.me, react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.85 : o.acc;
  mem.cd = (mem.cd || 0) - 1 / 60; if (m.cam && m.photo) { const P = m.photo, err = Math.random() < acc ? 1 : 0.4; stick(G, clamp(-P.fx * 4 - P.vx * 0.8, -1, 1) * err, clamp(P.fz * 4 + P.vz * 0.8, -1, 1) * err); return; }
  if (mem.cd > 0) return; mem.cd = react * (0.6 + 0.8 * Math.random());
  const near = Math.min(99, ...G.guards.map(g => Math.hypot(g.x - m.x, g.z - m.z))), danger = G.guards.find(g => g.st === 'alert' || (g.sus > 0.3 && Math.hypot(g.x - m.x, g.z - m.z) < 6));
  const A = actionHere(G);
  if (m.hidden) { mem.hidT = (mem.hidT || 0) + react; const calm = !G.guards.some(g => g.st === 'alert' || g.st === 'search'), clear = !G.guards.some(g => Math.hypot(g.x - m.x, g.z - m.z) < 4.5), unseen = !G.guards.some(g => { const dx = m.x - g.x, dz = m.z - g.z, d = Math.hypot(dx, dz); let da = Math.atan2(dx, dz) - g.face; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU; return d < 2 || (d < G.cfg.range && Math.abs(da) < 1.0 && sight(G, g.x, g.z, m.x, m.z, true)); });
    if (calm && (clear || (mem.hidT > 5 && unseen))) { action(G); mem.hidT = 0; if (G.cfg.crouch || G.lesson) crouchBtn(G, true); } return; }
  if (danger && A && A.k === 'hide' && Math.random() < acc) { action(G); stick(G, 0, 0); return; }
  if (A && (A.k === 'photo' || A.k === 'check' || A.k === 'take' || A.k === 'key') && !danger) { stick(G, 0, 0); action(G); return; }
  { const d0 = doorNear(G); if (d0 && d0.c !== 3 && (d0.c !== 4 || m.key) && (mem.path || []).some(p => Math.floor(p.x) === d0.x && Math.floor(p.z) === d0.z) && Math.random() < acc) { m.face = Math.atan2(d0.x + 0.5 - m.x, d0.z + 0.5 - m.z); if (action(G)) return; } }
  if (A && A.k === 'door' && A.it.c !== 3 && (A.it.c !== 4 || m.key) && Math.random() < acc) { const pth = mem.path || []; if (pth.some(p => Math.floor(p.x) === A.it.x && Math.floor(p.z) === A.it.z)) { action(G); return; } }
  // spotted: run out of his sight (a cupboard if one is close and he is not between), and come back later
  const hunter = G.guards.find(g => g.st === 'alert'); if (hunter) { if (m.crouch) crouchBtn(G, false); const cl = G.furn.filter(f => f.kind === 'closet' && G.cfg.hide).map(f => ({ x: f.x + 0.5, z: f.z + 1.1 })).find(q => Math.hypot(q.x - m.x, q.z - m.z) < 5 && Math.hypot(q.x - hunter.x, q.z - hunter.z) > Math.hypot(q.x - m.x, q.z - m.z) + 1.5);
    let best = cl; if (!best) { let bd = -1; for (const q of G.rooms) { const c2 = { x: (q.x0 + q.x1) / 2 + 0.5, z: (q.z0 + q.z1) / 2 + 0.5 }, d = Math.hypot(c2.x - hunter.x, c2.z - hunter.z) - 0.5 * Math.hypot(c2.x - m.x, c2.z - m.z); if (d > bd && Math.hypot(c2.x - m.x, c2.z - m.z) > 2) { bd = d; best = c2; } } }
    if (A && A.k === 'door' && A.it.c === 2) { action(G); return; }
    const pf = best && pathTo(G, m, best, true); if (pf && pf.length > 1) { const t3 = pf[1], dx = t3.x - m.x, dz = t3.z - m.z, d = Math.hypot(dx, dz) || 1; stick(G, dx / d, -dz / d); } else { const dx = m.x - hunter.x, dz = m.z - hunter.z, d = Math.hypot(dx, dz) || 1; stick(G, dx / d, -dz / d); } mem.path = pf; return; }
  if (!mem.reach || G.t - mem.reachT > 3) { mem.reachT = G.t; mem.reach = G.doc.cands.map(q => { const p2 = pathTo(G, m, q, true); return p2 ? p2.length : 1e9; }); }
  const ci = mem.reach.length ? mem.reach.indexOf(Math.min(...mem.reach)) : -1, cand = ci >= 0 && mem.reach[ci] < 1e9 ? G.doc.cands[ci] : null;
  const want = !G.doc.shot ? (G.doc.found ? (pathTo(G, m, G.doc, true) ? G.doc : G.key && !G.key.got ? G.key : G.doc) : cand || (G.key && !G.key.got ? G.key : G.doc.cands[0])) : G.bonus.find(b => !b.got && Math.hypot(b.x - m.x, b.z - m.z) < 5) || G.van;
  if (G.cfg.crouch || G.lesson) { const cr = near < 8.5 || G.cams.length > 0; if (cr !== m.crouch && Math.random() < acc) crouchBtn(G, cr); }
  // the plan: cells in a guard's cone (now or a step ahead) cost a lot
  const cf = (x, z) => { let k2 = 0; for (const g of G.guards) { const d = Math.hypot(x + 0.5 - g.x, z + 0.5 - g.z); if (d < 2.2) k2 += 12; if (d < G.cfg.range) { let da = Math.atan2(x + 0.5 - g.x, z + 0.5 - g.z) - g.face; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU; if (Math.abs(da) < 0.8 && sight(G, g.x, g.z, x + 0.5, z + 0.5, true)) k2 += 25; } } return k2; }, cg = new Float32Array(G.W * G.H); for (let z = 0; z < G.H; z++) for (let x = 0; x < G.W; x++) cg[z * G.W + x] = G.grid[z][x] === 1 ? 0 : cf(x, z); G.cost = (x, z) => cg[z * G.W + x];
  const p = pathTo(G, m, want, true); G.cost = null; mem.path = p;
  if (!p || p.length < 2) { const dx = want.x - m.x, dz = want.z - m.z, d = Math.hypot(dx, dz) || 1; stick(G, dx / d * 0.8, -dz / d * 0.8); return; }
  const nx = p[Math.min(2, p.length - 1)], seen = G.guards.some(g => { const dx = nx.x - g.x, dz = nx.z - g.z, d = Math.hypot(dx, dz); if (d > G.cfg.range * (m.crouch ? 0.7 : 1)) return false; let da = Math.atan2(dx, dz) - g.face; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU; return Math.abs(da) < 0.75 && sight(G, g.x, g.z, nx.x, nx.z, m.crouch); });
  const watcher = G.guards.find(g => g.sus > 0.08 && seesFrom(G, g.x, g.z, g.face, 0.62, G.cfg.range) > 0); if (watcher && Math.random() < acc) { const e = mem.esc && G.t < mem.escT ? mem.esc : (mem.esc = escapeDir(G, watcher), mem.escT = G.t + 0.7, mem.esc); if (e) { if (Math.hypot(watcher.x - m.x, watcher.z - m.z) < 3.5 && m.crouch) crouchBtn(G, false); stick(G, e[0], e[1]); return; } }
  const searcher = G.guards.find(g => (g.st === 'search' || g.st === 'investigate' || g.st === 'look') && Math.hypot(g.x - m.x, g.z - m.z) < 6.5); if (searcher && Math.random() < acc) { if (A && A.k === 'hide') { action(G); stick(G, 0, 0); return; } if (!m.crouch && G.cfg.crouch) crouchBtn(G, true); const exposed = Math.hypot(searcher.x - m.x, searcher.z - m.z) < G.cfg.range && sight(G, searcher.x, searcher.z, m.x, m.z, m.crouch); const e = exposed && escapeDir(G, searcher); if (e) stick(G, e[0] * 0.8, e[1] * 0.8); else stick(G, 0, 0); return; }
  if (seen && !(G.guards.some(g => g.st === 'alert')) && Math.random() < acc) { mem.waited = (mem.waited || 0) + react; if (mem.waited > 4 && m.coins > 0) { const g = G.guards.reduce((a, b) => Math.hypot(a.x - m.x, a.z - m.z) < Math.hypot(b.x - m.x, b.z - m.z) ? a : b); m.face = Math.atan2(g.x - m.x, g.z - m.z) + Math.PI * 0.6; action(G); mem.waited = 0; } stick(G, 0, 0); return; }
  mem.waited = 0; const t2 = p[1], dx = t2.x - m.x, dz = t2.z - m.z, d = Math.hypot(dx, dz) || 1, fast = !danger && near > 9 && !m.crouch ? 1 : 0.8; stick(G, dx / d * fast, -dz / d * fast); }
// a step out of his sight: try a few directions and distances; prefer hidden spots, then far from him
function escapeDir(G, g) { const m = G.me; let best = null, bs = -1e9; for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; for (const r of [1.2, 2.4]) { const x = m.x + Math.sin(a) * r, z = m.z + Math.cos(a) * r; let bad = false; for (let q = 0.3; q <= r + 0.01; q += 0.3) if (blocked(G, m.x + Math.sin(a) * q, m.z + Math.cos(a) * q)) { bad = true; break; } if (bad) continue;
      const vis = Math.hypot(x - g.x, z - g.z) < G.cfg.range && sight(G, g.x, g.z, x, z, m.crouch), sc = (vis ? 0 : 20) + Math.hypot(x - g.x, z - g.z) - r * 0.5; if (sc > bs) { bs = sc; best = [Math.sin(a), -Math.cos(a)]; } } } return best; }
function keyNeeded(G) { return !pathTo(G, G.me, G.doc, true); }
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.doc.shot = true; G.me.x = G.van.x; G.me.z = G.van.z; G.me.hidden = null; step(G, 1 / 60); }
