// ===================== THE RULES: Metro Map (his idea 19, 20 Nov 2026) =====================
// A growing city on a clean 2D map. Stations have shapes (● homes, ■ offices, ▲ schools, ★ the stadium, ✚ the hospital, ◆ the
// market); passengers appear at stations as little shapes: the kind of place they want to reach. Drag from station to station
// to draw a line (a train starts on it); drag from the end of a line to extend it; drag the middle of a stretch onto a station
// to reroute through it; tap a line to put another train on it; tap a line's end tab to shorten it. Lines, trains and river
// bridges are limited: every week brings a new train and a choice of one more thing. Passengers change lines by themselves.
// A crowded station fills a ring; let it fill and the metro closes. Carry enough passengers to finish the level.
const RULES = [
  '<b>Drag from station to station</b> to draw a line. A train starts on it.',
  '<b>Drag from a line\'s end</b> to extend it. <b>Drag the middle</b> of a stretch onto a station to route it through.',
  '<b>Tap a line</b> to add a train. <b>Tap its end tab</b> to shorten it.',
  'Passengers are shapes: the kind of place they want. They change lines on their own.',
  'Crossing the river takes a <b>bridge</b>. Each week: a new train and a choice.',
  'A <b>crowded station</b> fills its ring. Let it fill up and the metro closes. Carry enough people before the last week ends to win.',
];
const MW = 10, MH = 14, SR = 0.34, TRAIN_V = 2.0, CAP0 = 6, QCAP = 6, WEEK = 45;
const TYPES = ['circle', 'square', 'tri', 'star', 'cross', 'diamond'], TNAME = { circle: 'homes', square: 'offices', tri: 'a school', star: 'the stadium', cross: 'the hospital', diamond: 'the market' };
const LCOL = ['#e8443a', '#2a7ad8', '#f0b020', '#2aa860', '#9a4ad0', '#f07a20', '#1ab0b0'];
const CITIES = ['Riverside', 'Harbourtown', 'Old Mill', 'Northbank', 'Greenhill', 'Lakeshore', 'Ironbridge', 'Westvale'];
const SKINS = [{ id: 'classic', name: 'Paper', col: '#f4f1e8', stars: 0 }, { id: 'night', name: 'Night map', col: '#1e2430', stars: 6 }, { id: 'blueprint', name: 'Blueprint', col: '#1a3a6a', stars: 14 }, { id: 'sepia', name: 'Old map', col: '#e8d8b0', stars: 24 }, { id: 'mint', name: 'Mint', col: '#dff2e8', stars: 36 }, { id: 'neon', name: 'Neon', col: '#140a24', stars: 50 }];
const UPGRADES = [{ id: 'depot', name: 'Spare train', max: 2, cost: l => [60, 150][l], desc: 'Start each level with one more train.' }, { id: 'wide', name: 'Wide platforms', max: 2, cost: l => [70, 160][l], desc: 'Stations hold 2 more before they crowd.' }, { id: 'fast', name: 'Faster trains', max: 1, cost: () => 120, desc: 'Trains run 10% quicker.' }];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Ticket clerk'], [60, 'Driver'], [200, 'Signaller'], [500, 'Line manager'], [1100, 'Network planner'], [2500, 'Legend of the lines']];
const cityOf = N => CITIES[(N - 1) % CITIES.length];
function makeCfg(N, help, o = {}) { const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s));
  return { N, f, help: !!help, endless: !!o.practice, target: o.practice ? 1e9 : Math.round(Math.min(190, 30 + 12 * Math.min(N, 10) + Math.max(0, N - 10))), weeks: N <= 3 ? 4 : 6, lines0: N <= 2 ? 1 : 2, trains0: (N <= 2 ? 1 : 2) + upLv('depot'), bridges0: N <= 1 ? 0 : N <= 4 ? 1 : 2, river: N >= 2,
    spawnSt: x(16, 11, 30) * (help ? 1.2 : 1), rate: x(0.045, 0.08, 30) * (help ? 0.8 : 1), grow: x(0.0006, 0.0014, 30), maxTypes: N <= 3 ? 3 : N <= 6 ? 4 : N <= 10 ? 5 : 6, rush: N >= 3, close: N >= 6, qcap: QCAP + 2 * upLv('wide'), fill: help ? 38 : 30 }; }
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help, o), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0, R = rng(seed);
  const G = { N, cfg, seed, rnd: R, t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, mini: !!o.mini, city: cityOf(N),
    S: [], L: [], trains: [], free: { lines: cfg.lines0, trains: cfg.trains0, bridges: cfg.bridges0 }, delivered: 0, week: 0, weekT: 0, choice: null, nextSt: 6, waitSum: 0, waitN: 0, weekLog: [], seg: {}, rush: null, closure: null, speed: 1, drag: null, sid: 0 };
  G.river = cfg.river ? makeRiver(R) : null;
  if (G.teach && LESSONS[N] && G.taught < N && !cfg.endless) lessonStart(G); else { firstStations(G); G.ev.push({ k: 'start' }); }
  return G; }
// the river: a band from one side to the other, with bends
function makeRiver(R) { const pts = [], y0 = 5.5 + R() * 3, horiz = true; for (let i = 0; i <= 10; i++) { const x = -0.5 + i * 1.1, y = y0 + Math.sin(i * 0.9 + R() * 2) * 1.1 + (R() - 0.5) * 0.5; pts.push([x, y]); } return { pts, w: 0.5 }; }
function riverY(G, x) { const P = G.river.pts; for (let i = 0; i < P.length - 1; i++) if (x >= P[i][0] && x <= P[i + 1][0]) { const u = (x - P[i][0]) / (P[i + 1][0] - P[i][0]); return P[i][1] + (P[i + 1][1] - P[i][1]) * u; } return P[0][1]; }
const segX = (a, b, c, d) => { const o = (p, q, r) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])); return o(a, b, c) !== o(a, b, d) && o(c, d, a) !== o(c, d, b); };
function crossings(G, a, b) { if (!G.river) return 0; const P = G.river.pts; let n = 0; for (let i = 0; i < P.length - 1; i++) if (segX([a.x, a.y], [b.x, b.y], P[i], P[i + 1])) n++; return n % 2; }
const usedBridges = G => G.L.reduce((n, l) => { for (let i = 0; i < l.st.length - 1; i++) n += crossings(G, st(G, l.st[i]), st(G, l.st[i + 1])); return n; }, 0);
const bridgesLeft = G => G.free.bridges - usedBridges(G);
// ---------- stations ----------
const st = (G, id) => G.S.find(s => s.id === id);
function placeStation(G, type, near) { const R = G.rnd; for (let tries = 0; tries < 80; tries++) { const x = near ? clamp(near[0] + (R() - 0.5) * 5, 0.8, MW - 0.8) : 0.8 + R() * (MW - 1.6), y = near ? clamp(near[1] + (R() - 0.5) * 5, 1.0, MH - 0.8) : 1.0 + R() * (MH - 1.8);
    if (G.S.some(s => Math.hypot(s.x - x, s.y - y) < 1.7)) continue; if (G.river && Math.abs(y - riverY(G, x)) < 0.8) continue; if (G.lessonArea && (y < G.lessonArea[0] || y > G.lessonArea[1])) continue;
    const s = { id: ++G.sid, x, y, type, q: [], over: 0, born: G.t, closed: 0, cap: G.cfg.qcap, rate: 0.6 + R() * 0.8, served: 0 }; G.S.push(s); G.ev.push({ k: 'station', id: s.id, type }); return s; } return null; }
function firstStations(G) { const c = [MW / 2, G.river ? Math.min(MH - 2, riverY(G, MW / 2) + 3) : MH / 2]; ['circle', 'square', 'tri'].forEach(t => placeStation(G, t, c)); }
function newStationType(G) { const R = G.rnd, have = TYPES.slice(0, G.cfg.maxTypes); const counts = have.map(t => G.S.filter(s => s.type === t).length); if (counts.some((n, i) => i >= 3 && n === 0) && R() < 0.35) return have[counts.findIndex((n, i) => i >= 3 && n === 0)]; const r = R(); return r < 0.5 ? 'circle' : r < 0.75 ? 'square' : r < 0.9 ? 'tri' : have[3 + ((R() * Math.max(1, have.length - 3)) | 0)] || 'tri'; }
// ---------- the network: lines, their order of stations, distances to each kind of place ----------
function works(G, lid) { for (const tr of G.trains) if (tr.line === lid) tr.dwell = Math.max(tr.dwell, 4); }      // track works: a changed line's trains stand a moment
function netChanged(G) { const adj = {}; for (const s of G.S) adj[s.id] = new Set(); for (const l of G.L) for (let i = 0; i < l.st.length - 1; i++) { adj[l.st[i]].add(l.st[i + 1]); adj[l.st[i + 1]].add(l.st[i]); }
  G.dist = {}; for (const t of TYPES) { const d = {}, q = []; for (const s of G.S) if (s.type === t && s.closed <= 0) { d[s.id] = 0; q.push(s.id); } while (q.length) { const u = q.shift(); for (const v of adj[u]) if (d[v] == null) { d[v] = d[u] + 1; q.push(v); } } G.dist[t] = d; }
  G.adj = adj; }
const distTo = (G, t, sid) => { const d = G.dist && G.dist[t] && G.dist[t][sid]; return d == null ? 99 : d; };
function lineOf(G, sid) { return G.L.filter(l => l.st.includes(sid)); }
// ---------- the player's moves ----------
const busy = G => G.over || G.choice || G.lesson && G.lesson.wait > 0;
function newLine(G, a, b) { if (busy(G) || G.free.lines <= 0 || a === b) return null; const A = st(G, a), B = st(G, b); if (!A || !B) return null; const cr = crossings(G, A, B); if (cr > bridgesLeft(G)) { G.ev.push({ k: 'needbridge' }); return null; }
  const used = new Set(G.L.map(l => l.col)), col = LCOL.find(c => !used.has(c)) || LCOL[G.L.length % LCOL.length], l = { id: G.L.length ? Math.max(...G.L.map(q => q.id)) + 1 : 1, col, st: [a, b] }; G.L.push(l); G.free.lines--;
  if (G.free.trains > 0) addTrain(G, l.id, true); netChanged(G); G.ev.push({ k: 'line', id: l.id }); lessonSee(G, 'line'); return l; }
function extendLine(G, lid, atEnd, sid) { if (busy(G)) return false; const l = G.L.find(q => q.id === lid); if (!l || l.st.includes(sid)) return false; const endId = atEnd ? l.st[l.st.length - 1] : l.st[0], cr = crossings(G, st(G, endId), st(G, sid)); if (cr > bridgesLeft(G)) { G.ev.push({ k: 'needbridge' }); return false; }
  if (atEnd) l.st.push(sid); else { l.st.unshift(sid); for (const tr of G.trains) if (tr.line === lid) tr.i++; } works(G, lid); netChanged(G); G.ev.push({ k: 'extend', id: lid }); lessonSee(G, 'extend'); return true; }
function insertStation(G, lid, seg, sid) { if (busy(G)) return false; const l = G.L.find(q => q.id === lid); if (!l || l.st.includes(sid) || seg < 0 || seg >= l.st.length - 1) return false; const a = st(G, l.st[seg]), b = st(G, l.st[seg + 1]), s = st(G, sid), cr = crossings(G, a, s) + crossings(G, s, b) - crossings(G, a, b);
  if (cr > bridgesLeft(G)) { G.ev.push({ k: 'needbridge' }); return false; } l.st.splice(seg + 1, 0, sid); for (const tr of G.trains) if (tr.line === lid && tr.i > seg) tr.i++; works(G, lid); netChanged(G); G.ev.push({ k: 'extend', id: lid }); lessonSee(G, 'extend'); return true; }
function trimLine(G, lid, atEnd) { if (busy(G)) return false; const l = G.L.find(q => q.id === lid); if (!l) return false;
  if (l.st.length <= 2) { for (const tr of G.trains.filter(q => q.line === lid)) { dropAll(G, tr); G.free.trains++; } G.trains = G.trains.filter(q => q.line !== lid); G.L = G.L.filter(q => q !== l); G.free.lines++; netChanged(G); G.ev.push({ k: 'removed' }); return true; }
  if (atEnd) { l.st.pop(); for (const tr of G.trains) if (tr.line === lid && tr.i >= l.st.length - 1) { tr.i = l.st.length - 2; tr.u = 1; tr.dir = -1; } } else { l.st.shift(); for (const tr of G.trains) if (tr.line === lid) { tr.i = Math.max(0, tr.i - 1); if (tr.i === 0 && tr.dir < 0) { tr.u = 0; tr.dir = 1; } } }
  works(G, lid); netChanged(G); G.ev.push({ k: 'trim' }); return true; }
function addTrain(G, lid, quiet) { if (G.over || G.choice || G.free.trains <= 0) { if (!quiet) G.ev.push({ k: 'notrain' }); return false; } const l = G.L.find(q => q.id === lid); if (!l) return false;
  const n = G.trains.filter(q => q.line === lid).length; G.trains.push({ line: lid, i: n % Math.max(1, l.st.length - 1), u: 0, dir: n % 2 ? -1 : 1, load: [], cap: CAP0, dwell: 0.5, at: null }); G.free.trains--; if (!quiet) G.ev.push({ k: 'train', id: lid }); lessonSee(G, 'train'); return true; }
function choose(G, i) { const c = G.choice; if (!c) return false; const pick = c.opts[i]; if (!pick) return false; if (pick === 'line') G.free.lines++; else if (pick === 'train') G.free.trains++; else if (pick === 'bridge') G.free.bridges += 2; else if (pick === 'carriage') { const tr = G.trains.slice().sort((a, b) => (b.load.length / b.cap) - (a.load.length / a.cap))[0]; if (tr) tr.cap += 4; else G.free.trains++; }
  else if (pick === 'platform') for (const s of G.S) s.cap += 2; G.choice = null; G.ev.push({ k: 'chosen', what: pick }); return true; }
// ---------- passengers ----------
function spawn(G, s) { const have = [...new Set(G.S.map(q => q.type))].filter(t => t !== s.type); if (!have.length) return; const dest = have[(G.rnd() * have.length) | 0]; s.q.push({ dest, t0: G.t }); }
function dropAll(G, tr) { const l = G.L.find(q => q.id === tr.line), sid = l && l.st[tr.dir > 0 ? tr.i : tr.i + 1], s = sid && st(G, sid); for (const p of tr.load) if (s) s.q.push(p); tr.load = []; }
// a train at a station: let off who arrived (or who should change here), take on who this train brings closer
function serveStation(G, tr, s, l) { const pos = l.st.indexOf(s.id), nextId = l.st[pos + tr.dir] != null ? l.st[pos + tr.dir] : l.st[pos - tr.dir]; let moved = 0;
  if (s.closed > 0) return 0;
  for (let k = tr.load.length - 1; k >= 0; k--) { const p = tr.load[k];
    if (p.dest === s.type) { tr.load.splice(k, 1); G.delivered++; s.served++; G.waitSum += G.t - p.t0; G.waitN++; moved++; G.ev.push({ k: 'deliver', x: s.x, y: s.y, type: p.dest }); continue; }
    if (distTo(G, p.dest, nextId) >= distTo(G, p.dest, s.id) && distTo(G, p.dest, s.id) < 99) { tr.load.splice(k, 1); p.xfer = (p.xfer || 0) + 1; s.q.push(p); moved++; } }      // change here: another line is closer
  for (let k = 0; k < s.q.length && tr.load.length < tr.cap; k++) { const p = s.q[k]; if (distTo(G, p.dest, nextId) < distTo(G, p.dest, s.id)) { s.q.splice(k, 1); k--; tr.load.push(p); moved++; const key = Math.min(s.id, nextId) + '-' + Math.max(s.id, nextId); G.seg[key] = (G.seg[key] || 0) + 1; } }
  return moved; }
// ---------- the clock ----------
function step(G, dt) { if (G.over || !(dt > 0) || G.choice) return; dt *= G.speed; G.t += dt; const c = G.cfg, R = G.rnd;
  if (G.lesson) { lessonTick(G, dt); if (G.lesson && G.lesson.wait > 0) return; }
  // the week: a new train, and a choice
  if (!G.lesson) { G.weekT += dt; if (G.weekT >= WEEK) { G.weekT = 0; G.week++; G.weekLog.push(G.delivered); if (!c.endless && G.week >= c.weeks) return finish(G, false, { time: true }); G.free.trains++; const all = ['line', 'carriage', 'bridge', 'platform', 'train'].filter(k2 => k2 !== 'bridge' || G.river), a = all[(R() * all.length) | 0]; let b = all[(R() * all.length) | 0]; while (b === a) b = all[(R() * all.length) | 0]; G.choice = { opts: [a, b] }; G.ev.push({ k: 'week', n: G.week }); return; }
    // new stations; rush hours and closures, warned first
    G.nextSt -= dt; if (G.nextSt <= 0) { G.nextSt = c.spawnSt * (0.8 + R() * 0.4); const near = G.S.length && R() < 0.7 ? (() => { const s = G.S[(R() * G.S.length) | 0]; return [s.x, s.y]; })() : null; placeStation(G, newStationType(G), near); netChanged(G); }
    if (c.rush) { if (!G.rush && R() < dt / 70) G.rush = { warn: 6, t: 15 }; if (G.rush) { if (G.rush.warn > 0) { G.rush.warn -= dt; if (G.rush.warn <= 0) G.ev.push({ k: 'rush' }); } else { G.rush.t -= dt; if (G.rush.t <= 0) G.rush = null; } } }
    if (c.close && !G.closure && G.S.length > 6 && R() < dt / 90) { const s = G.S[(R() * G.S.length) | 0]; G.closure = { id: s.id, warn: 6 }; G.ev.push({ k: 'closewarn', id: s.id }); }
    if (G.closure) { const s = st(G, G.closure.id); if (G.closure.warn > 0) { G.closure.warn -= dt; if (G.closure.warn <= 0 && s) { s.closed = 15; netChanged(G); G.ev.push({ k: 'closed', id: s.id }); } } else if (!s || s.closed <= 0) { G.closure = null; netChanged(G); } } }
  // passengers appear; crowds build
  const surge = G.rush && G.rush.warn <= 0 ? 2.5 : 1, rate = c.rate * (1 + c.grow * G.t * 60 / 60) * surge;
  for (const s of G.S) { if (s.closed > 0) { s.closed -= dt; if (s.closed <= 0) netChanged(G); continue; } if (G.t - s.born > 2 && R() < rate * s.rate * dt * (G.lesson ? G.lesson.rate : 1)) spawn(G, s);
    if (s.q.length > s.cap) { s.over += dt / c.fill * (G.t - s.born < 25 ? 0.5 : 1);      // a new station gets time: never lost because one appeared in an awkward place
      if (s.over > 0.5 && !s.warned) { s.warned = true; G.ev.push({ k: 'crowd', id: s.id }); } if (s.over >= 1 && !G.lesson) return finish(G, false, { why: s }); } else { s.over = Math.max(0, s.over - dt / 20); if (s.over < 0.3) s.warned = false; } }
  // trains move along their lines, stop at each station
  for (const tr of G.trains) { const l = G.L.find(q => q.id === tr.line); if (!l || l.st.length < 2) continue; if (tr.i > l.st.length - 2) { tr.i = l.st.length - 2; tr.u = 1; }
    if (tr.dwell > 0) { tr.dwell -= dt; continue; }
    const a = st(G, l.st[tr.i]), b = st(G, l.st[tr.i + 1]), len = Math.hypot(b.x - a.x, b.y - a.y) || 1, v = TRAIN_V * (1 + 0.1 * upLv('fast')) / len;
    tr.u += tr.dir * v * dt; if (tr.u >= 1 || tr.u <= 0) { const arrived = tr.u >= 1 ? b : a; tr.u = clamp(tr.u, 0, 1);
      if (tr.u >= 1) { if (tr.i + 1 >= l.st.length - 1) tr.dir = -1; else { tr.i++; tr.u = 0; } } else { if (tr.i <= 0) tr.dir = 1; else { tr.i--; tr.u = 1; } }
      const moved = serveStation(G, tr, arrived, l); tr.dwell = 0.25 + moved * 0.12; } }
  if (!c.endless && G.delivered >= c.target && !G.lesson) finish(G, true); }
function finish(G, win, o = {}) { if (G.over) return; G.over = win ? 'won' : 'lost'; const avg = G.waitN ? G.waitSum / G.waitN : 0, stars = win ? (avg < 18 ? 3 : avg < 26 ? 2 : 1) : 0; G.weekLog.push(G.delivered);
  let busiest = null, bn = 0; for (const k2 in G.seg) if (G.seg[k2] > bn) { bn = G.seg[k2]; busiest = k2; }
  G.res = { win, stars, delivered: G.delivered, target: G.cfg.target, avg: Math.round(avg), weeks: G.week, log: G.weekLog.slice(), why: o.why ? { type: o.why.type, waiting: o.why.q.length } : null, time: !!o.time, busiest, bn, stations: G.S.length, lines: G.L.length, coins: Math.round(G.delivered / 5) + (win ? 8 + Math.ceil(G.N / 2) + stars * 3 : 0) };
  G.ev.push({ k: win ? 'won' : 'lost' }); }
// why a station struggles (tap a station to see it)
function inspect(G, sid) { const s = st(G, sid); if (!s) return null; const want = {}; for (const p of s.q) want[p.dest] = (want[p.dest] || 0) + 1; const lines = lineOf(G, sid), reasons = [];
  if (!lines.length) reasons.push('No line stops here yet.'); else for (const t in want) if (distTo(G, t, sid) >= 99) reasons.push(`No route to ${TNAME[t]}.`);
  if (lines.length && !G.trains.some(tr => lines.some(l => l.id === tr.line))) reasons.push('Its line has no train.');
  if (!reasons.length && s.q.length > s.cap - 2) reasons.push(`Busy: ${s.q.length} waiting. Add a train to ${lines.length > 1 ? 'its lines' : 'its line'}.`);
  if (s.closed > 0) reasons.unshift('Closed for repairs.'); return { s, want, lines: lines.length, reasons }; }
// ---------- LESSONS ----------
const AIMCARD = {"pic": "🚇", "win": "GET PEOPLE WHERE THEY'RE GOING", "lose": "A STATION OVERFLOWS", "how": "DRAG STATION TO STATION"};      // the aim card: specs/aims.json (tools/aims.py)
const LESSONS = {
  1: [{ id: 'line', title: 'DRAW A LINE', say: G => metroCue(G)[0], do: G => metroCue(G)[1], at: G => metroCue(G)[2], how: 'Drag from one station to another, then on to the third, without lifting your finger. A train starts on it.', need: 1 }],
  2: [{ id: 'extend', title: 'REACH THE NEW STATIONS', say: G => metroCue(G)[0], do: G => metroCue(G)[1], at: G => metroCue(G)[2], how: 'New stations keep appearing. Drag from the END of your line to each one. Three of them.', need: 3 }],
  3: [{ id: 'train', title: 'MORE TRAINS', say: G => metroCue(G)[0], do: G => metroCue(G)[1], at: G => metroCue(G)[2], how: 'A crowd is growing. TAP your line to put a second train on it.', need: 1 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0, wait: 0, rate: 0.5 }; G.ev.push({ k: 'lessonnext', first: true }); firstStations(G); const st0 = lessonNow(G); G.lesson.setup = true;
  if (st0.id !== 'line') { const [a, b, c] = G.S; G.free.lines = Math.max(G.free.lines, 1); newLine(G, a.id, b.id); extendLine(G, G.L[0].id, true, c.id); }
  if (st0.id === 'extend') { G.lessonArea = null; const s = placeStation(G, 'square', [G.S[2].x, G.S[2].y]); netChanged(G); }
  if (st0.id === 'train') { G.free.trains = Math.max(1, G.free.trains); for (let i = 0; i < 5; i++) spawn(G, G.S[0]); G.lesson.rate = 1.5; }
  for (const tr of G.trains) tr.dwell = 0.5; netChanged(G); G.lesson.setup = false; }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonSee(G, what) { const st0 = lessonNow(G); if (!st0 || G.lesson.done || G.lesson.setup) return; const ok = (st0.id === 'line' && what === 'line' && G.L[0] && G.L[0].st.length >= 2) || (st0.id === 'extend' && what === 'extend') || (st0.id === 'train' && what === 'train');
  if (ok && st0.id === 'extend' && ++G.lesson.n < st0.need) { G.ev.push({ k: 'lessonok', n: G.lesson.n, need: st0.need }); const l = G.L[0], e = st(G, l.st[l.st.length - 1]); G.lesson.setup = true; placeStation(G, ['circle', 'tri', 'square'][G.lesson.n % 3], [e.x, e.y]); netChanged(G); G.lesson.setup = false; return; }
  if (ok) { G.lesson.done = true; G.lesson.wait = 1.6; G.ev.push({ k: 'lessonok', n: 1, need: 1 }); G.ev.push({ k: 'lessondone', N: G.N }); } }
function lessonTick(G, dt) { const D = G.lesson; if (D.wait > 0) { D.wait -= dt; if (D.wait <= 0 && D.done) { G.lesson = null; G.ev.push({ k: 'start' }); } } }
// ---------- for the robots ----------
// BLIND: a thumb that does not look: drags between random spots, taps random spots, picks either choice
function rndPt() { return { x: Math.random() * MW, y: Math.random() * MH }; }
function hitStation(G, p, r = 0.6) { let best = null, bd = r; for (const s of G.S) { const d = Math.hypot(s.x - p.x, s.y - p.y); if (d < bd) { bd = d; best = s; } } return best; }
function hitSegment(G, p, r = 0.35) { let best = null, bd = r; for (const l of G.L) for (let i = 0; i < l.st.length - 1; i++) { const a = st(G, l.st[i]), b = st(G, l.st[i + 1]), vx = b.x - a.x, vy = b.y - a.y, L2 = vx * vx + vy * vy || 1, u = clamp(((p.x - a.x) * vx + (p.y - a.y) * vy) / L2, 0, 1), d = Math.hypot(a.x + vx * u - p.x, a.y + vy * u - p.y); if (d < bd) { bd = d; best = { l, i, u }; } } return best; }
// a whole drag gesture from world point p0 through pts, as the screen does it (used by the robots and by the screen's input)
function gesture(G, pts, tap) { if (busy(G)) return false; const p0 = pts[0], s0 = hitStation(G, p0);
  if (tap) { const sn = hitStation(G, p0, 0.45); if (sn) { G.inspect = { id: sn.id, t: 3.5 }; G.ev.push({ k: 'inspect', id: sn.id }); return true; } const tab = hitTab(G, p0); if (tab) return trimLine(G, tab.l.id, tab.end); const sg = hitSegment(G, p0, 0.45); if (sg) return addTrain(G, sg.l.id); return false; }
  if (!hitStation(G, pts[pts.length - 1], 0.5)) { G.ev.push({ k: 'letgo' }); return false; }      // a line is only built when you let go on a station
  if (s0) { const ends = G.L.filter(l => l.st[0] === s0.id || l.st[l.st.length - 1] === s0.id); let cur = ends.length ? { l: ends[ends.length - 1], end: ends[ends.length - 1].st[ends[ends.length - 1].st.length - 1] === s0.id } : null, made = false, prev = s0.id;
    for (const p of pts.slice(1)) { const s = hitStation(G, p, 0.5); if (!s || s.id === prev) continue; if (cur) { if (extendLine(G, cur.l.id, cur.end, s.id)) { made = true; prev = s.id; } } else { const l = newLine(G, prev, s.id); if (l) { cur = { l, end: true }; made = true; prev = s.id; } } }
    return made; }
  const sg = hitSegment(G, p0); if (sg) { const last = pts[pts.length - 1], s = hitStation(G, last, 0.5); if (s) return insertStation(G, sg.l.id, sg.i, s.id); } return false; }
function hitTab(G, p) { for (const l of G.L) for (const end of [false, true]) { const a = st(G, end ? l.st[l.st.length - 1] : l.st[0]), b = st(G, end ? l.st[l.st.length - 2] : l.st[1]), d = Math.hypot(a.x - b.x, a.y - b.y) || 1, tx = a.x + (a.x - b.x) / d * 0.75, ty = a.y + (a.y - b.y) / d * 0.75; if (Math.hypot(p.x - tx, p.y - ty) < 0.32) return { l, end }; } return null; }
const BLIND = {
  d: G => { const a = rndPt(), b = rndPt(), pts = [a]; for (let i = 1; i <= 6; i++) pts.push({ x: a.x + (b.x - a.x) * i / 6, y: a.y + (b.y - a.y) * i / 6 }); gesture(G, pts, false); },
  t: G => gesture(G, [rndPt()], true),
  c: G => choose(G, Math.random() < 0.5 ? 0 : 1),
};
// HONEST: a planner who looks: links every station into the network (nearest line end, or the cheapest stretch to pass through),
// opens a new line where the city has grown, and puts spare trains where the crowds are. react: seconds between moves; acc:
// how often it picks the best option rather than a nearby one.
// THE HAND DRAWS THE LINE STATION TO STATION (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing happens"). It drew a
// drag to the right in a box, which joins nothing. Now the robot is asked (dryPlan) and the hand drags from the station (or the line's end) to
// the station it would join: DRAG FROM HERE TO HERE / DRAG FROM THE END TO HERE; TAP YOUR LINE for a train.
function metroCue(G) { if (G.over || busy(G)) return ['WAIT…', 'wait', false]; const L = layout(G), sc = q => [L.ox + q.x * L.s, L.oy + q.y * L.s];
  if (G.choice) { const P0 = dryPlan(G, null, { cd: -1 }); const r = P0 && P0[0] === 'choose' ? L.ch[P0[1]] : null; return r ? ['TAP THIS ONE', 'tap', [r.x + r.w / 2, r.y + r.h / 2]] : ['WAIT…', 'wait', false]; }
  const P = dryPlan(G, null, { cd: -1 }); if (!P) return ['WAIT…', 'wait', false];
  if (P[0] === 'newLine') { const a = st(G, P[1]), b = st(G, P[2]); return ['DRAG FROM HERE TO HERE', 'drag', [...sc(a), ...sc(b)]]; }
  if (P[0] === 'extendLine') { const l = G.L.find(q => q.id === P[1]), e = st(G, P[2] ? l.st[l.st.length - 1] : l.st[0]), b = st(G, P[3]); return ['DRAG FROM THE END TO HERE', 'drag', [...sc(e), ...sc(b)]]; }
  if (P[0] === 'insertStation') { const l = G.L.find(q => q.id === P[1]), a = st(G, l.st[P[2]]), c = st(G, l.st[P[2] + 1]), b = st(G, P[3]), m = { x: (a.x + c.x) / 2, y: (a.y + c.y) / 2 }; return ['DRAG THE LINE TO HERE', 'drag', [...sc(m), ...sc(b)]]; }
  if (P[0] === 'addTrain') { const l = G.L.find(q => q.id === P[1]), a = st(G, l.st[0]), c = st(G, l.st[1] || l.st[0]); return ['TAP YOUR LINE', 'tap', sc({ x: (a.x + c.x) / 2, y: (a.y + c.y) / 2 })]; }
  return ['WAIT…', 'wait', false]; }
function honest(G, o, mem) { if (G.over) return; const acc = o.acc == null ? 0.85 : o.acc, react = o.react == null ? 0.3 : o.react, R = Math.random;
  if (G.choice) { mem.cd = (mem.cd || 0) - 1 / 60; if (mem.cd > 0) return; mem.cd = react; const longest = Math.max(0, ...G.L.map(l => l.st.length)), pref = (!G.free.lines && longest > 6) ? ['line', 'train', 'carriage', 'platform', 'bridge'] : bridgesLeft(G) <= 0 && G.river ? ['bridge', 'train', 'line', 'carriage', 'platform'] : ['train', 'carriage', 'line', 'platform', 'bridge']; let best = 0, br = 99; G.choice.opts.forEach((p, i) => { const r = pref.indexOf(p); if (r < br) { br = r; best = i; } }); ACT.choose(G, R() < acc ? best : 1 - best); return; }
  if (busy(G)) return; mem.cd = (mem.cd || 0) - 1 / 60 * G.speed; if (mem.cd > 0) return; mem.cd = react * (1.5 + R()) * 2;
  const L = G.lesson && lessonNow(G);
  if (L && L.id === 'train') { if (G.L[0]) ACT.addTrain(G, G.L[0].id); return; }
  // the first line: the three stations
  if (!G.L.length) { const [a, b, c] = G.S; const l = ACT.newLine(G, a.id, b.id); if (l && c) ACT.extendLine(G, l.id, true, c.id); return; }
  // a station left out: join it
  const lone = G.S.filter(s => !lineOf(G, s.id).length).sort((a, b) => a.born - b.born)[0];
  if (lone) { let best = null; for (const l of G.L) { for (const end of [false, true]) { const e = st(G, end ? l.st[l.st.length - 1] : l.st[0]), cost = Math.hypot(e.x - lone.x, e.y - lone.y) + crossings(G, e, lone) * 3; if (crossings(G, e, lone) <= bridgesLeft(G) && (!best || cost < best.cost)) best = { kind: 'ext', l, end, cost }; }
        for (let i = 0; i < l.st.length - 1; i++) { const a = st(G, l.st[i]), b = st(G, l.st[i + 1]), extra = Math.hypot(a.x - lone.x, a.y - lone.y) + Math.hypot(b.x - lone.x, b.y - lone.y) - Math.hypot(a.x - b.x, a.y - b.y), cr = crossings(G, a, lone) + crossings(G, lone, b) - crossings(G, a, b); if (cr <= bridgesLeft(G) && (!best || extra * 1.3 < best.cost)) best = { kind: 'ins', l, i, cost: extra * 1.3 }; } }
    // a long line, or a station far from everything: a new line if one is free
    if (G.free.lines > 0 && (!best || best.cost > 3.5 || (best.l && best.l.st.length > 5 && R() < acc))) { let near = null, nd = 1e9; for (const s of G.S) if (s !== lone && s.type !== lone.type) { const d = Math.hypot(s.x - lone.x, s.y - lone.y) + crossings(G, s, lone) * 3; if (d < nd && crossings(G, s, lone) <= bridgesLeft(G)) { nd = d; near = s; } } if (near && ACT.newLine(G, lone.id, near.id)) return; }
    if (best) { if (R() > acc && best.kind === 'ins') return; if (best.kind === 'ext') ACT.extendLine(G, best.l.id, best.end, lone.id); else ACT.insertStation(G, best.l.id, best.i, lone.id); return; } }
  // spare trains: to the line with the biggest crowd
  if (G.free.trains > 0) { let bl = null, bw = -1; for (const l of G.L) { const w = l.st.reduce((n, id) => n + st(G, id).q.length, 0) / (1 + G.trains.filter(t => t.line === l.id).length); if (w > bw) { bw = w; bl = l; } } if (bl) { ACT.addTrain(G, bl.id); return; } }
  // a free line: link the two busiest stations that are not yet linked directly
  if (G.free.lines > 0 && R() < acc * 0.5) { const busy2 = G.S.slice().sort((a, b) => b.q.length - a.q.length).slice(0, 4); for (const a of busy2) { const want = a.q.map(p => p.dest).find(t => distTo(G, t, a.id) > 2); if (!want) continue; let near = null, nd = 1e9; for (const s of G.S) if (s.type === want) { const d = Math.hypot(s.x - a.x, s.y - a.y); if (d < nd && crossings(G, s, a) <= bridgesLeft(G)) { nd = d; near = s; } } if (near && ACT.newLine(G, a.id, near.id)) return; } } }
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.delivered = G.cfg.target; finish(G, true); }

// what the robot would do now, without doing it (tools/dry_plan.py): the tutorial shows this move
const ACT_REAL = { newLine, extendLine, insertStation, addTrain, choose }; let ACT = ACT_REAL;
function dryPlan(G, o, mem) { let got = null; const rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { if (!got && !(a.length > 2 && a.slice(1).every(v => v === 0 || v === false))) got = [n, ...a.slice(1)]; return true; };      /* (a stick at rest, all its numbers 0, is not a move; a first bed, number 0, is) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return got; }
function dryPlanAll(G, o, mem) { const all = [], rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { all.push([n, ...a.slice(1)]); return true; };      /* every call, in order (for a robot that steers and drifts at once) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return all; }
