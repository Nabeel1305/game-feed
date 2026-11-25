// ===================== DRAW + JUICE: Metro Map =====================
// A clean paper map: neighbourhood blocks, a river, parks; stations as plain shapes; lines in bright colours, side by side where
// they share track; trains carrying little shapes; a ring that fills round a crowded station. Bottom bar: what you have left.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, PT = [], TXT = [], PARTS = PT;
let hint = null, V3 = null;
const ui = { drag: null, hold: null, snap: true, banner: null };
function sparks(x, y, n, col, sp = 120) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random()); PT.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.45 + Math.random() * 0.3, t: 0, col, r: 1.6 + Math.random() * 2 }); } if (PT.length > 240) PT.splice(0, PT.length - 240); }
function say(txt, x, y, col = '#fff', size = 22) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS || !(G && G.lesson)) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function fxStep(dt) {
  FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 2);
  for (const p of PT) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.94; p.vy *= 0.94; }
  for (let i = PT.length - 1; i >= 0; i--) if (PT[i].t > PT[i].life) PT.splice(i, 1);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.3) TXT.shift();
  if (hint) { hint.t += dt; if (hint.t > hint.secs) hint = null; }
  if (G && G.inspect) { G.inspect.t -= dt; if (G.inspect.t <= 0) G.inspect = null; }
}
const mySkin = () => SKINS.find(q => q.id === store.get('skin', 'classic')) || SKINS[0];
const darkMap = () => ['night', 'blueprint', 'neon'].includes(mySkin().id);
// ---------- where things are on screen ----------
function layout(G) { const top = 64 * k, bar = 76 * k, aw = W - 16, ah = H - top - bar - 8, s = Math.min(aw / MW, ah / MH), ox = (W - MW * s) / 2, oy = top + (ah - MH * s) / 2;
  const by = H - bar + 8 * k, bh = bar - 16 * k;
  const L = { s, ox, oy, top, bar: { x: 8, y: by, w: W - 16, h: bh }, speed: { x: W - 8 - 64 * k, y: by + 6 * k, w: 58 * k, h: bh - 12 * k } };
  if (G && G.choice) { const cw = Math.min(W - 40, 340 * k), ch = 96 * k, cx = (W - cw) / 2, cy = H * 0.36; L.ch = [{ x: cx, y: cy, w: cw, h: ch }, { x: cx, y: cy + ch + 14 * k, w: cw, h: ch }]; }
  return L; }
const toPx = (L, x, y) => [L.ox + x * L.s, L.oy + y * L.s];
const toW = (L, px, py) => ({ x: (px - L.ox) / L.s, y: (py - L.oy) / L.s });
// ---------- shapes ----------
function shape(type, x, y, r, fill, stroke, lw) { ctx.beginPath();
  if (type === 'circle') ctx.arc(x, y, r, 0, TAU);
  else if (type === 'square') ctx.rect(x - r * 0.88, y - r * 0.88, r * 1.76, r * 1.76);
  else if (type === 'tri') { ctx.moveTo(x, y - r * 1.1); ctx.lineTo(x + r * 1.05, y + r * 0.75); ctx.lineTo(x - r * 1.05, y + r * 0.75); ctx.closePath(); }
  else if (type === 'diamond') { ctx.moveTo(x, y - r * 1.15); ctx.lineTo(x + r * 1.0, y); ctx.lineTo(x, y + r * 1.15); ctx.lineTo(x - r * 1.0, y); ctx.closePath(); }
  else if (type === 'star') { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.5 : r * 1.15; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); }
  else if (type === 'cross') { const a = r * 0.38, b = r * 1.0; ctx.moveTo(x - a, y - b); ctx.lineTo(x + a, y - b); ctx.lineTo(x + a, y - a); ctx.lineTo(x + b, y - a); ctx.lineTo(x + b, y + a); ctx.lineTo(x + a, y + a); ctx.lineTo(x + a, y + b); ctx.lineTo(x - a, y + b); ctx.lineTo(x - a, y + a); ctx.lineTo(x - b, y + a); ctx.lineTo(x - b, y - a); ctx.lineTo(x - a, y - a); ctx.closePath(); }
  if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.stroke(); } }
// ---------- the city behind the map: blocks and parks from the level's seed (drawn once per level, kept) ----------
let bgFor = null, bgCv = null;
function background(G, L) { const key = G.seed + ':' + W + 'x' + H + ':' + mySkin().id; if (bgFor === key && bgCv) return bgCv; bgFor = key; bgCv = document.createElement('canvas'); bgCv.width = Math.round(W * DPR); bgCv.height = Math.round(H * DPR);
  const c = bgCv.getContext('2d'), R = rng(G.seed ^ 0x5a5a), sk = mySkin(), dark = darkMap(); c.setTransform(DPR, 0, 0, DPR, 0, 0); c.fillStyle = sk.col; c.fillRect(0, 0, W, H);
  const P = (x, y) => [L.ox + x * L.s, L.oy + y * L.s];
  // neighbourhood blocks: soft rounded rectangles on a loose grid
  for (let gx = 0; gx < MW; gx += 1.25) for (let gy = 0; gy < MH; gy += 1.25) { if (R() < 0.35) continue; const [x, y] = P(gx + 0.12 + R() * 0.1, gy + 0.12 + R() * 0.1), w = L.s * (0.8 + R() * 0.25), h = L.s * (0.8 + R() * 0.25);
    c.fillStyle = dark ? `rgba(255,255,255,${0.03 + R() * 0.03})` : `rgba(0,0,0,${0.035 + R() * 0.03})`; c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, 4) : c.rect(x, y, w, h); c.fill(); }
  // parks
  for (let i = 0; i < 4; i++) { const [x, y] = P(0.5 + R() * (MW - 1), 0.5 + R() * (MH - 1)); c.fillStyle = dark ? 'rgba(80,200,140,.10)' : 'rgba(90,170,100,.16)'; c.beginPath(); c.ellipse(x, y, L.s * (0.8 + R() * 0.7), L.s * (0.6 + R() * 0.5), R() * 3, 0, TAU); c.fill(); }
  // the river: a wide blue band with soft banks
  if (G.river) { const pts = G.river.pts.map(p => P(p[0], p[1])); for (const [w, col] of [[G.river.w * L.s * 1.5, dark ? 'rgba(80,140,220,.18)' : 'rgba(120,170,220,.25)'], [G.river.w * L.s, dark ? '#24507e' : '#a9cdea']]) { c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); } }
  return bgCv; }
// ---------- what the game does with each event ----------
function onEvent(G, e) { const L = layout(G), at = id => { const s = st(G, id); return s ? toPx(L, s.x, s.y) : [W / 2, H / 2]; };
  switch (e.k) {
    case 'start': if (!G.lesson) tip('start', G.L.length ? 'Passengers ride to the shape they want' : 'Drag from station to station to draw a line', 3.2); break;
    case 'station': if (G.t > 1) { const [x, y] = at(e.id); sparks(x, y, 10, '#ffd36a', 90); sfx.pop(); } break;
    case 'line': sfx.build(G.L.length); vibe(HAP.light); { const l = G.L.find(q => q.id === e.id); if (l) { const [x, y] = at(l.st[l.st.length - 1]); say('NEW LINE', x, y - 24 * k, l.col, 18); } } break;
    case 'extend': sfx.build(1); vibe(HAP.tick); break;
    case 'trim': sfx.trim(); vibe(HAP.tick); break;
    case 'removed': sfx.trim(); say('LINE TAKEN UP', W / 2, H * 0.45, '#ffd0c4', 18); break;
    case 'train': sfx.train(); vibe(HAP.light); say('+1 TRAIN', W / 2, H * 0.45, '#9be3b5', 18); break;
    case 'notrain': sfx.no(); say('NO SPARE TRAIN', W / 2, H * 0.45, '#ffd0c4', 18); tip('notrain', 'A new train comes every week', 2.6); break;
    case 'needbridge': sfx.no(); say('NO BRIDGE LEFT', W / 2, H * 0.45, '#ffd0c4', 18); tip('bridge', 'Crossing the river takes a bridge (🌉 below)', 3); break;
    case 'letgo': if (ui.lastDragLong) tip('letgo', 'Let go ON a station to build', 2.6); break;
    case 'deliver': { const [x, y] = toPx(L, e.x, e.y); if (PT.length < 160) sparks(x, y, 3, '#ffffff', 60); if (gate('deliver', 110)) sfx.deliver(TYPES.indexOf(e.type)); if (G.delivered % 25 === 0 && !G.lesson) { say(`${G.delivered} CARRIED`, x, y - 26 * k, '#ffd36a', 18); sfx.combo(Math.min(8, G.delivered / 25)); } } break;
    case 'crowd': { const [x, y] = at(e.id); say('CROWDED', x, y - 30 * k, '#ff9a6a', 17); sfx.warn(); tip('crowd', 'Tap a station to see why it is struggling', 3.4); } break;
    case 'inspect': sfx.click(); break;
    case 'week': sfx.week(); vibe(HAP.light); break;
    case 'chosen': sfx.combo(3); vibe(HAP.light); break;
    case 'rush': say('RUSH HOUR!', W / 2, H * 0.42, '#ffd36a', 26); sfx.warn(); break;
    case 'closewarn': { const [x, y] = at(e.id); say('CLOSING SOON', x, y - 30 * k, '#ffd36a', 16); sfx.warn(); tip('close', 'A station shuts for repairs soon: route around it', 3); } break;
    case 'closed': sfx.trim(); break;
    case 'lessonnext': if (e.first) hint = null; say('FIRST, A LESSON', W / 2, H * 0.5, '#ffd36a', 24); sfx.ding(); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, W / 2, H * 0.5, '#9be3b5', 24); sfx.coin(e.n); break;
    case 'lessondone': say('YOU KNOW IT. NOW PLAY!', W / 2, H * 0.5, '#ffd36a', 24); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': FX.flash = 1; sfx.win(); vibe(HAP.best); break;
    case 'lost': sfx.lose(); break;      // (P11: never vibrate on failure)
  } }
// ---------- the picture ----------
function segOffsets(G) { const by = {}; for (const l of G.L) for (let i = 0; i < l.st.length - 1; i++) { const a = l.st[i], b = l.st[i + 1], key = Math.min(a, b) + '-' + Math.max(a, b); (by[key] = by[key] || []).push(l.id); } return by; }
function linePts(G, L, l, offs) { const out = []; for (let i = 0; i < l.st.length; i++) { const s = st(G, l.st[i]); let [x, y] = toPx(L, s.x, s.y);
    // nudge sideways where lines share a stretch, so each stays visible
    const nb = l.st[i + 1] != null ? st(G, l.st[i + 1]) : st(G, l.st[i - 1]), key = Math.min(s.id, nb.id) + '-' + Math.max(s.id, nb.id), sh = offs[key] || [l.id], j = sh.indexOf(l.id), n = sh.length;
    if (n > 1) { const dx = nb.x - s.x, dy = nb.y - s.y, d = Math.hypot(dx, dy) || 1, o = (j - (n - 1) / 2) * 6 * k * (l.st[i + 1] != null ? 1 : -1); x += -dy / d * o; y += dx / d * o; }
    out.push([x, y]); } return out; }
function draw(now) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (!G) { ctx.fillStyle = '#1e2230'; ctx.fillRect(0, 0, W, H); homeMap(now); return; }
  const L = layout(G), dark = darkMap(), ink = dark ? '#e8ecf4' : '#22252e', paper = mySkin().col, R0 = SR * L.s;
  ctx.drawImage(background(G, L), 0, 0, W, H);
  ctx.save(); if (FX.shake > 0) ctx.translate((Math.random() - 0.5) * FX.shake, (Math.random() - 0.5) * FX.shake);
  // the busiest stretch glows softly (his "busiest connections")
  let busy = null, bn = 0; for (const key in G.seg) if (G.seg[key] > bn) { bn = G.seg[key]; busy = key; }
  if (busy && bn > 6) { const [a, b] = busy.split('-').map(Number), A = st(G, a), B = st(G, b); if (A && B && G.adj && G.adj[a] && G.adj[a].has(b)) { const [x1, y1] = toPx(L, A.x, A.y), [x2, y2] = toPx(L, B.x, B.y); ctx.strokeStyle = 'rgba(255,200,80,.35)'; ctx.lineWidth = 20 * k; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); } }
  // lines
  const offs = segOffsets(G);
  for (const l of G.L) { const P = linePts(G, L, l, offs);
    for (let i = 0; i < P.length - 1; i++) if (crossings(G, st(G, l.st[i]), st(G, l.st[i + 1]))) { ctx.strokeStyle = dark ? '#8a94a8' : '#5a6070'; ctx.lineWidth = 13 * k; ctx.lineCap = 'butt'; ctx.beginPath(); ctx.moveTo(P[i][0], P[i][1]); ctx.lineTo(P[i + 1][0], P[i + 1][1]); ctx.stroke(); }      // a bridge
    ctx.strokeStyle = l.col; ctx.lineWidth = 7 * k; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); P.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
    // the end tabs: tap one to shorten the line
    for (const end of [false, true]) { const a = end ? P[P.length - 1] : P[0], b = end ? P[P.length - 2] : P[1], d = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, ux = (a[0] - b[0]) / d, uy = (a[1] - b[1]) / d, tx = a[0] + ux * 0.75 * L.s, ty = a[1] + uy * 0.75 * L.s;
      ctx.lineWidth = 7 * k; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(tx, ty); ctx.stroke(); ctx.lineWidth = 6 * k; ctx.beginPath(); ctx.moveTo(tx - uy * 9 * k, ty + ux * 9 * k); ctx.lineTo(tx + uy * 9 * k, ty - ux * 9 * k); ctx.stroke(); } }
  // the drag being drawn
  const d = ui.drag; if (d && d.moved) { const p = d.px, hits = d.hits || []; const col = d.col || '#888';
    ctx.strokeStyle = col; ctx.globalAlpha = 0.75; ctx.lineWidth = 7 * k; ctx.lineCap = 'round'; ctx.setLineDash([10 * k, 8 * k]); ctx.beginPath();
    if (d.seg) { const A = st(G, d.seg.a), B = st(G, d.seg.b); if (A && B) { const a = toPx(L, A.x, A.y), b = toPx(L, B.x, B.y); ctx.moveTo(a[0], a[1]); ctx.lineTo(p[0], p[1]); ctx.lineTo(b[0], b[1]); } }
    else { hits.forEach((id, i) => { const s = st(G, id); if (!s) return; const q = toPx(L, s.x, s.y); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); ctx.lineTo(p[0], p[1]); }
    ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; }
  // trains, with their passengers
  for (const tr of G.trains) { const l = G.L.find(q => q.id === tr.line); if (!l || l.st.length < 2) continue; const P = linePts(G, L, l, offs), i = Math.min(tr.i, P.length - 2), a = P[i], b = P[i + 1], x = a[0] + (b[0] - a[0]) * tr.u, y = a[1] + (b[1] - a[1]) * tr.u, ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const tw = 34 * k * (tr.cap > CAP0 ? 1.35 : 1), th = 16 * k; ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.fillStyle = l.col; ctx.strokeStyle = dark ? '#0a0c12' : '#fff'; ctx.lineWidth = 2; rrect(-tw / 2, -th / 2, tw, th, 4 * k); ctx.fill(); ctx.stroke();
    const n = Math.min(tr.load.length, 12), cols = Math.ceil(tr.cap / 2), cw = tw / (cols + 0.5); for (let j = 0; j < n; j++) { const cx = -tw / 2 + cw * (0.75 + (j % cols)), cy = j < cols ? -th * 0.22 : th * 0.22; shape(tr.load[j].dest, cx, cy, 2.6 * k, '#fff'); }
    ctx.restore(); }
  // stations: shape, crowd ring, waiting passengers
  for (const s of G.S) { const [x, y] = toPx(L, s.x, s.y), age = G.t - s.born, pop = age < 0.4 ? 0.5 + age * 1.25 : 1, r = R0 * pop;
    if (s.over > 0) { const warn = s.over > 0.5, pul = warn ? 0.6 + 0.4 * Math.sin(now * 8) : 1; ctx.strokeStyle = `rgba(240,90,40,${0.35 + 0.5 * pul})`; ctx.lineWidth = 5 * k; ctx.beginPath(); ctx.arc(x, y, r + 9 * k, -Math.PI / 2, -Math.PI / 2 + TAU * s.over); ctx.stroke();
      ctx.fillStyle = `rgba(240,90,40,${0.08 + 0.12 * s.over})`; ctx.beginPath(); ctx.arc(x, y, r + 14 * k, 0, TAU); ctx.fill(); }
    const closing = G.closure && G.closure.id === s.id && G.closure.warn > 0, closed = s.closed > 0;
    shape(s.type, x, y, r, closed ? (dark ? '#3a3f4a' : '#c8c8c8') : (dark ? '#141821' : '#ffffff'), closing && Math.sin(now * 10) > 0 ? '#e0a020' : ink, 3.2 * k);
    if (closed) { ctx.strokeStyle = '#d04030'; ctx.lineWidth = 3 * k; ctx.beginPath(); ctx.moveTo(x - r * 0.7, y - r * 0.7); ctx.lineTo(x + r * 0.7, y + r * 0.7); ctx.moveTo(x + r * 0.7, y - r * 0.7); ctx.lineTo(x - r * 0.7, y + r * 0.7); ctx.stroke(); }
    if (G.inspect && G.inspect.id === s.id) { ctx.strokeStyle = '#ffd36a'; ctx.lineWidth = 3 * k; ctx.beginPath(); ctx.arc(x, y, r + 6 * k, 0, TAU); ctx.stroke(); }
    const n = Math.min(s.q.length, 14), ps = 4.2 * k, lft = x + r + 7 * k + 7 * ps * 2.2 > W - 4, sx0 = lft ? x - r - 7 * k : x + r + 7 * k, sd = lft ? -1 : 1; for (let j = 0; j < n; j++) { const cx = sx0 + sd * (j % 7) * ps * 2.2, cy = y - ps * 1.2 + Math.floor(j / 7) * ps * 2.4; shape(s.q[j].dest, cx, cy, ps, j >= s.cap ? '#e0603a' : ink); }
    if (s.q.length > 14) { ctx.fillStyle = '#e0603a'; ctx.font = `800 ${Math.round(11 * k)}px ${BC}`; ctx.textAlign = lft ? 'right' : 'left'; ctx.textBaseline = 'middle'; ctx.fillText('+' + (s.q.length - 14), sx0, y + ps * 3.8); } }
  for (const p of PT) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * k, 0, TAU); ctx.fill(); }
  ctx.globalAlpha = 1; ctx.restore();
  hud(G, L, dark); if (G.inspect) inspectCard(G, L); if (G.choice) choiceCard(G, L);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t of TXT) { const a = t.t < 1 ? 1 : 1 - (t.t - 1) / 0.3; ctx.globalAlpha = Math.max(0, a); ctx.font = `800 ${Math.round(t.size * k)}px ${BC}`; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.strokeText(t.txt, t.x, t.y - t.t * 24 * k); ctx.fillStyle = t.col; ctx.fillText(t.txt, t.x, t.y - t.t * 24 * k); }
  ctx.globalAlpha = 1;
  if (hint) { const a = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, a); ctx.font = `700 ${Math.round(15 * k)}px ${BC}`; const w = Math.min(W - 24, ctx.measureText(hint.txt).width + 30), hy = L.bar.y - 30 * k; ctx.fillStyle = 'rgba(20,24,34,.85)'; rrect(W / 2 - w / 2, hy - 17 * k, w, 34 * k, 12); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillText(hint.txt, W / 2, hy, W - 40); ctx.globalAlpha = 1; }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); }
}
// the home screen: a quiet metro map behind the menu, with trains gliding along it
const HOME = [['#e8443a', [[-0.1, 0.18], [0.3, 0.18], [0.55, 0.42], [1.1, 0.42]]], ['#2a7ad8', [[0.2, -0.05], [0.2, 0.3], [0.45, 0.55], [0.45, 1.05]]], ['#f0b020', [[-0.1, 0.78], [0.35, 0.78], [0.7, 0.5], [0.7, 0.1], [1.1, 0.1]]], ['#2aa860', [[0.85, 1.05], [0.85, 0.7], [1.1, 0.6]]]];
function homeMap(now) { ctx.save(); ctx.globalAlpha = 0.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const [col, P] of HOME) { ctx.strokeStyle = col; ctx.lineWidth = 9; ctx.beginPath(); P.forEach(([x, y], i) => i ? ctx.lineTo(x * W, y * H) : ctx.moveTo(x * W, y * H)); ctx.stroke();
    let tot = 0; const seg = []; for (let i = 0; i < P.length - 1; i++) { const d = Math.hypot((P[i + 1][0] - P[i][0]) * W, (P[i + 1][1] - P[i][1]) * H); seg.push(d); tot += d; }
    let u = ((now * 40 + col.charCodeAt(2) * 7) % tot); for (let i = 0; i < seg.length; i++) { if (u <= seg[i]) { const f = u / seg[i], x = (P[i][0] + (P[i + 1][0] - P[i][0]) * f) * W, y = (P[i][1] + (P[i + 1][1] - P[i][1]) * f) * H; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, 9, 0, TAU); ctx.fill(); break; } u -= seg[i]; }
    P.slice(1, -1).forEach(([x, y], i) => shape(TYPES[(i + col.length) % 3], x * W, y * H, 11, '#1e2230', '#f6f4ee', 3)); }
  ctx.restore(); }
function hud(G, L, dark) { const c = G.cfg, ink = dark ? '#eef2f8' : '#22252e', sub = dark ? 'rgba(238,242,248,.7)' : 'rgba(34,37,46,.65)';
  if (G.lesson) lessonPanel(G);
  else { ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillStyle = ink; ctx.font = `800 ${Math.round(17 * k)}px ${BC}`; ctx.fillText(c.endless ? 'ENDLESS' : G.city.toUpperCase(), 14, 20 * k);
    ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = sub; const avg = G.waitN ? Math.round(G.waitSum / G.waitN) : 0; ctx.fillText(c.endless ? `Week ${G.week + 1} · wait ${avg}s` : `Week ${G.week + 1} of ${c.weeks} · wait ${avg}s`, 14, 40 * k);
    // the week: a thin bar of days
    const wx = 14, ww = W * 0.36, wy = 52 * k; ctx.fillStyle = dark ? 'rgba(255,255,255,.14)' : 'rgba(0,0,0,.1)'; rrect(wx, wy, ww, 5 * k, 3); ctx.fill(); ctx.fillStyle = '#ff6a50'; rrect(wx, wy, Math.max(4, ww * G.weekT / WEEK), 5 * k, 3); ctx.fill();
    ctx.textAlign = 'right'; ctx.fillStyle = ink; ctx.font = `800 ${Math.round(24 * k)}px ${BC}`; ctx.fillText(c.endless ? `${G.delivered}` : `${G.delivered}/${c.target}`, W - 14, 22 * k);
    ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillStyle = sub; ctx.fillText('PASSENGERS', W - 14, 42 * k);
    if (!c.endless) { const px = W - 14 - W * 0.3; ctx.fillStyle = dark ? 'rgba(255,255,255,.14)' : 'rgba(0,0,0,.1)'; rrect(px, wy, W * 0.3, 5 * k, 3); ctx.fill(); ctx.fillStyle = '#2aa860'; rrect(px, wy, Math.max(4, W * 0.3 * Math.min(1, G.delivered / c.target)), 5 * k, 3); ctx.fill(); }
    if (G.rush && G.rush.warn > 0) { ctx.textAlign = 'center'; ctx.fillStyle = '#e0a020'; ctx.font = `800 ${Math.round(13 * k)}px ${BC}`; ctx.fillText(`RUSH HOUR IN ${Math.ceil(G.rush.warn)}`, W / 2, 54 * k); }
    else if (G.rush) { ctx.textAlign = 'center'; ctx.fillStyle = '#e0a020'; ctx.font = `800 ${Math.round(13 * k)}px ${BC}`; ctx.fillText('RUSH HOUR', W / 2, 54 * k); } }
  // the bottom bar: lines (a filled dot for each in use, a ring for each free), trains, bridges, speed
  const B = L.bar; ctx.fillStyle = dark ? 'rgba(10,12,20,.75)' : 'rgba(255,255,255,.85)'; rrect(B.x, B.y, B.w, B.h, 16 * k); ctx.fill(); ctx.strokeStyle = dark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.1)'; ctx.lineWidth = 1; rrect(B.x, B.y, B.w, B.h, 16 * k); ctx.stroke();
  const cy = B.y + B.h / 2; let x = B.x + 18 * k; const used = new Set(G.L.map(l => l.col));
  for (let i = 0; i < G.L.length + G.free.lines; i++) { const col = i < G.L.length ? G.L[i].col : LCOL.filter(c2 => !used.has(c2))[i - G.L.length] || '#999'; ctx.beginPath(); ctx.arc(x, cy - 8 * k, 8 * k, 0, TAU); if (i < G.L.length) { ctx.fillStyle = col; ctx.fill(); } else { ctx.strokeStyle = col; ctx.lineWidth = 3 * k; ctx.stroke(); } x += 21 * k; }
  ctx.textAlign = 'left'; ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.fillStyle = sub; ctx.fillText(G.free.lines ? `${G.free.lines} LINE${G.free.lines > 1 ? 'S' : ''} FREE` : 'LINES', B.x + 10 * k, cy + 14 * k);
  const tx = B.x + B.w * 0.47; ctx.font = `800 ${Math.round(17 * k)}px ${BC}`; ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.fillText(`🚆 ${G.free.trains}`, tx, cy - 6 * k); ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.fillStyle = sub; ctx.fillText('TRAINS', tx, cy + 14 * k);
  if (G.river) { const bx = B.x + B.w * 0.66; ctx.font = `800 ${Math.round(17 * k)}px ${BC}`; ctx.fillStyle = ink; ctx.fillText(`🌉 ${bridgesLeft(G)}`, bx, cy - 6 * k); ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.fillStyle = sub; ctx.fillText('BRIDGES', bx, cy + 14 * k); }
  const S = L.speed; ctx.fillStyle = G.speed > 1 ? '#ff6a50' : (dark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.07)'); rrect(S.x, S.y, S.w, S.h, 12 * k); ctx.fill(); ctx.fillStyle = G.speed > 1 ? '#fff' : ink; ctx.font = `800 ${Math.round(16 * k)}px ${BC}`; ctx.fillText(G.speed > 1 ? '▶▶' : '▶', S.x + S.w / 2, S.y + S.h / 2 - 4 * k); ctx.font = `700 ${Math.round(9 * k)}px ${BC}`; ctx.fillText(G.speed > 1 ? 'FAST' : 'SPEED', S.x + S.w / 2, S.y + S.h - 9 * k); }
function inspectCard(G, L) { const I = inspect(G, G.inspect.id); if (!I) return; const [sx, sy] = toPx(L, I.s.x, I.s.y), lines = [`${TNAME[I.s.type].replace(/^(a |the )/, '').toUpperCase()} · ${I.s.q.length} WAITING`].concat(I.reasons.length ? I.reasons : ['Running well.']);
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; const w = Math.min(W - 20, Math.max(...lines.map(t => ctx.measureText(t).width)) + 26), h = 14 * k + lines.length * 19 * k, x = clamp(sx - w / 2, 10, W - w - 10), y = sy > H * 0.5 ? sy - h - 28 * k : sy + 28 * k;
  ctx.fillStyle = 'rgba(20,24,34,.92)'; rrect(x, y, w, h, 12); ctx.fill(); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; lines.forEach((t, i) => { ctx.fillStyle = i ? '#fff' : '#ffd36a'; ctx.fillText(t, x + 13, y + 8 * k + i * 19 * k); }); }
const CHOICE = { line: ['🛤️', 'A NEW LINE', 'One more line to draw'], train: ['🚆', 'ANOTHER TRAIN', 'A second spare train'], bridge: ['🌉', 'TWO BRIDGES', 'Cross the river twice more'], carriage: ['🚃', 'A CARRIAGE', 'Your fullest train carries 4 more'], platform: ['🏢', 'BIGGER STATIONS', 'Every station holds 2 more'] };
function choiceCard(G, L) { ctx.fillStyle = 'rgba(10,12,20,.55)'; ctx.fillRect(0, 0, W, H); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.font = `800 ${Math.round(24 * k)}px ${BC}`; ctx.fillText(`WEEK ${G.week} IS OVER`, W / 2, L.ch[0].y - 58 * k);
  ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; ctx.fillStyle = '#d8dde8'; ctx.fillText('A new train is here. Choose one more:', W / 2, L.ch[0].y - 28 * k);
  G.choice.opts.forEach((o, i) => { const r = L.ch[i], c = CHOICE[o]; ctx.fillStyle = '#f6f4ee'; rrect(r.x, r.y, r.w, r.h, 16 * k); ctx.fill(); ctx.textAlign = 'left'; ctx.font = `${Math.round(34 * k)}px ${BC}`; ctx.fillText(c[0], r.x + 18 * k, r.y + r.h / 2);
    ctx.fillStyle = '#22252e'; ctx.font = `800 ${Math.round(18 * k)}px ${BC}`; ctx.fillText(c[1], r.x + 74 * k, r.y + r.h / 2 - 12 * k); ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = '#555'; ctx.fillText(c[2], r.x + 74 * k, r.y + r.h / 2 + 14 * k); }); }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { coachPanel(G); }
