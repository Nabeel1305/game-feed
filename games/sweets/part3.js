// ===================== DRAW + JUICE: the sweet shop board (2D on purpose: a match-3 board reads best flat, like the originals) =====================
// A pastel sky, a board of soft cells, and glossy sweets, each colour its own shape (red heart, orange hexagon, yellow star,
// green square, blue ball, purple drop) so they read even without colour. Sweets fall with gravity and squash when they land;
// pops burst into crumbs of their colour; collected sweets fly to the goal; a striped sweet fires a beam, a wrapped one blasts,
// a colour bomb throws lightning. Cascades raise the word and the note. The Sugar Rush fires everything left.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, PT = [], TXT = [];
let CHIPTXT = '', hint = null, dropIn = false, VIEW = new Map(), POPS = [], BEAMS = [], RINGS = [], ZAPS = [], FLY = [], spawnN = {}, hintMove = null, chip = 0;
function sparks(x, y, n, col, sp = 220) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random()); PT.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, life: 0.45 + Math.random() * 0.35, t: 0, col, r: 2 + Math.random() * 3 }); } }
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
const S1 = () => Math.min(W, H * 0.6) / 390;
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of String(t).split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
// where everything is
function lay() { const s = S1(), cs = Math.min((W - 14) / C, (H * 0.64) / R), bw = cs * C, bh = cs * R, bx = (W - bw) / 2, top = 104 * s, by = top + Math.max(0, (H - top - bh) * 0.42); return { s, cs, bx, by, bw, bh, cx: q => bx + (q + 0.5) * cs, cy: r => by + (r + 0.5) * cs }; }
// ---------- the sweets, drawn once per size into little pictures ----------
let SPR = { key: '', c: {} };
function shapePath(x, col, r) { x.beginPath();
  if (col === 0) { x.moveTo(0, r * 0.85); x.bezierCurveTo(-r * 1.25, r * 0.05, -r * 0.9, -r * 0.95, 0, -r * 0.45); x.bezierCurveTo(r * 0.9, -r * 0.95, r * 1.25, r * 0.05, 0, r * 0.85); }
  else if (col === 1) { for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + Math.PI / 6; x.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.92); } }
  else if (col === 2) { for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k / 10 * TAU, rr = k % 2 ? r * 0.5 : r * 1.02; x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr + r * 0.06); } }
  else if (col === 3) { const q = r * 0.84, c = r * 0.3; x.moveTo(-q + c, -q); x.arcTo(q, -q, q, q, c); x.arcTo(q, q, -q, q, c); x.arcTo(-q, q, -q, -q, c); x.arcTo(-q, -q, q, -q, c); }
  else if (col === 4) { x.arc(0, 0, r * 0.9, 0, TAU); }
  else { x.moveTo(0, -r); x.bezierCurveTo(r * 0.9, -r * 0.2, r * 0.75, r * 0.9, 0, r * 0.9); x.bezierCurveTo(-r * 0.75, r * 0.9, -r * 0.9, -r * 0.2, 0, -r); }
  x.closePath(); }
function sprite(col, sp) { const key = col + ':' + sp; if (SPR.c[key]) return SPR.c[key]; const L = lay(), px = Math.ceil(L.cs * DPR), cnv = document.createElement('canvas'); cnv.width = cnv.height = px; const x = cnv.getContext('2d');
  x.translate(px / 2, px / 2); x.scale(DPR, DPR); const r = L.cs * 0.4;
  if (sp === 'cherry') { x.strokeStyle = '#5a3a1a'; x.lineWidth = r * 0.12; x.beginPath(); x.moveTo(-r * 0.35, r * 0.1); x.quadraticCurveTo(-r * 0.1, -r * 0.6, r * 0.15, -r * 0.8); x.moveTo(r * 0.4, r * 0.2); x.quadraticCurveTo(r * 0.3, -r * 0.5, r * 0.15, -r * 0.8); x.stroke();
    x.fillStyle = '#4aa83a'; x.beginPath(); x.ellipse(r * 0.4, -r * 0.75, r * 0.32, r * 0.14, -0.4, 0, TAU); x.fill();
    for (const [cx, cy] of [[-r * 0.38, r * 0.38], [r * 0.4, r * 0.48]]) { const g = x.createRadialGradient(cx - r * 0.12, cy - r * 0.12, r * 0.05, cx, cy, r * 0.42); g.addColorStop(0, '#ff8a8a'); g.addColorStop(1, '#b8101a'); x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r * 0.42, 0, TAU); x.fill(); x.fillStyle = 'rgba(255,255,255,.6)'; x.beginPath(); x.ellipse(cx - r * 0.13, cy - r * 0.15, r * 0.11, r * 0.07, -0.6, 0, TAU); x.fill(); }
    return SPR.c[key] = cnv; }
  if (sp === 'b') { const g = x.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r); g.addColorStop(0, '#8a5a3a'); g.addColorStop(1, '#2a160a'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, r * 0.92, 0, TAU); x.fill();
    const R0 = rng(5); for (let k = 0; k < 22; k++) { const a = R0() * TAU, d = R0() * r * 0.75; x.fillStyle = COLS6[k % 6]; x.save(); x.translate(Math.cos(a) * d, Math.sin(a) * d); x.rotate(R0() * 3); x.fillRect(-r * 0.12, -r * 0.035, r * 0.24, r * 0.07); x.restore(); }
    x.fillStyle = 'rgba(255,255,255,.35)'; x.beginPath(); x.ellipse(-r * 0.35, -r * 0.4, r * 0.3, r * 0.15, -0.6, 0, TAU); x.fill(); return SPR.c[key] = cnv; }
  const base = COLS6[col], rr = sp === 'w' ? r * 0.72 : r;
  if (sp === 'w') { x.fillStyle = shade(base, 1.25); x.strokeStyle = shade(base, 0.7); x.lineWidth = 1.5; for (const s of [-1, 1]) { x.beginPath(); x.moveTo(s * r * 0.55, 0); x.lineTo(s * r * 1.08, -r * 0.42); x.lineTo(s * r * 1.08, r * 0.42); x.closePath(); x.fill(); x.stroke(); }
    const q = r * 0.78; x.fillStyle = shade(base, 1.15); x.beginPath(); x.roundRect(-q, -q, q * 2, q * 2, r * 0.25); x.fill(); x.stroke(); x.fillStyle = 'rgba(255,255,255,.35)'; for (let k = -2; k <= 2; k++) { x.fillRect(k * q * 0.42 - 1, -q, 2, q * 2); } }
  // shadow, body, shine
  x.save(); x.translate(r * 0.04, r * 0.1); shapePath(x, col, rr); x.fillStyle = 'rgba(0,0,0,.22)'; x.fill(); x.restore();
  const g = x.createRadialGradient(-rr * 0.35, -rr * 0.45, rr * 0.1, 0, 0, rr * 1.1); g.addColorStop(0, shade(base, 1.45)); g.addColorStop(0.55, base); g.addColorStop(1, shade(base, 0.62)); shapePath(x, col, rr); x.fillStyle = g; x.fill();
  x.lineWidth = Math.max(1, rr * 0.07); x.strokeStyle = shade(base, 0.55); x.stroke();
  if (sp === 'h' || sp === 'v') { x.save(); shapePath(x, col, rr); x.clip(); x.fillStyle = 'rgba(255,255,255,.85)'; for (let k = -3; k <= 3; k++) { if (sp === 'h') x.fillRect(-rr * 1.2, k * rr * 0.36 - rr * 0.07, rr * 2.4, rr * 0.14); else x.fillRect(k * rr * 0.36 - rr * 0.07, -rr * 1.2, rr * 0.14, rr * 2.4); } x.restore(); shapePath(x, col, rr); x.stroke(); }
  x.fillStyle = 'rgba(255,255,255,.55)'; x.beginPath(); x.ellipse(-rr * 0.32, -rr * 0.42, rr * 0.28, rr * 0.13, -0.6, 0, TAU); x.fill(); x.fillStyle = 'rgba(255,255,255,.8)'; x.beginPath(); x.arc(-rr * 0.5, -rr * 0.18, rr * 0.06, 0, TAU); x.fill();
  return SPR.c[key] = cnv; }
function shade(hex, k) { const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255, f = v => Math.round(clamp(k > 1 ? v + (255 - v) * (k - 1) : v * k, 0, 255)); return `rgb(${f(r)},${f(g)},${f(b)})`; }
const spriteOf = k => sprite(k.col, k.sp || '');
// ---------- motion: every sweet has a place on screen that chases its place on the board ----------
function viewStep(G, dt) { const L = lay(), seen = new Set(); spawnN = {};
  for (let i = 0; i < R * C; i++) { const k = G.b[i].k; if (!k) continue; seen.add(k.id); const q = colOf(i), r = rowOf(i); let v = VIEW.get(k.id);
    if (!v) { const n = spawnN[q] = (spawnN[q] || 0) + 1; v = { x: q, y: dropIn ? r - R - 0.5 - (R - r) * 0.35 : k.fresh ? Math.min(r, topRow(G, q)) - n - 0.2 : r, vy: 0, sq: 0, wob: 0, born: 0 }; VIEW.set(k.id, v); }
    if (v.x !== q) { const d = q - v.x, st = 9 * dt; v.x = Math.abs(d) <= st ? q : v.x + Math.sign(d) * st; }
    if (v.y < r - 0.001) { v.vy += 46 * dt; v.y += v.vy * dt; if (v.y >= r) { v.y = r; if (v.vy > 3) { v.sq = Math.min(1, v.vy / 14); } v.vy = 0; } }
    else if (v.y > r + 0.001) { const d = r - v.y, st = 9 * dt; v.y = Math.abs(d) <= st ? r : v.y + Math.sign(d) * st; v.vy = 0; }
    v.sq = Math.max(0, v.sq - dt * 5); v.wob = Math.max(0, v.wob - dt * 4); v.born = Math.min(1, v.born + dt * 6); }
  for (const id of [...VIEW.keys()]) if (!seen.has(id)) VIEW.delete(id); dropIn = false;
  if (G.phase === 'idle' && !G.done && !hintMove && G.idle > hintDelay(G) - 0.1) { const ms = findMoves(G); let bv = -1; for (const m of ms) { const v = moveValue(G, m[0], m[1]); if (v > bv) { bv = v; hintMove = m; } } } }
function topRow(G, q) { for (let r = 0; r < R; r++) if (!G.b[idx(r, q)].hole) return r; return 0; }
function vpos(id) { const L = lay(), v = VIEW.get(id); return v ? [L.cx(v.x), L.cy(v.y)] : null; }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 40); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 2); chip = Math.max(0, chip - dt);
  for (const p of PT) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 520 * dt; } for (let i = PT.length - 1; i >= 0; i--) if (PT[i].t > PT[i].life) PT.splice(i, 1);
  for (const t of TXT) { t.t += dt; t.y -= dt * 22; } while (TXT.length && TXT[0].t > 1.4) TXT.shift(); if (hint) { hint.t += dt; if (hint.t > hint.secs) hint = null; }
  for (const a of [POPS, BEAMS, RINGS, ZAPS, FLY]) { for (const p of a) p.t += dt; for (let i = a.length - 1; i >= 0; i--) if (a[i].t > a[i].life) { if (a === FLY && a[i].done) a[i].done(); a.splice(i, 1); } }
  if (G) viewStep(G, dt); }
// ---------- the picture ----------
function draw(now) { ctx.setTransform(DPR, 0, 0, DPR, 0, 0); const L = lay(), s = L.s, g = G, P = PLACES[g ? g.place : 0];
  const key = L.cs.toFixed(2) + ':' + DPR; if (SPR.key !== key) SPR = { key, c: {} };
  const rk = W + 'x' + H + ':' + DPR + ':' + (g ? g.place : 0) + ':' + (g ? g.N : 0); if (draw.rk !== rk) { draw.rk = rk; paintBack(P, L, g); }
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(draw.oc, 0, 0); ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.save(); if (FX.shake > 0) ctx.translate((Math.random() - 0.5) * FX.shake, (Math.random() - 0.5) * FX.shake);
  if (g) { drawBoard(g, L, now); hud(g, L, now); if (g.done && !g.over && g.moves > 0 && !g.fast) { ctx.globalAlpha = 0.6 + 0.4 * Math.sin(now * 5); ctx.fillStyle = '#8a2a5a'; ctx.font = `${Math.round(15 * s)}px ${TF}`; ctx.textAlign = 'center'; ctx.fillText('Tap to hurry', W / 2, L.by + L.bh + 24 * s); ctx.globalAlpha = 1; } }
  for (const p of PT) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 - p.t / p.life * 0.5), 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  for (const f of FLY) { const u = easeOut(Math.min(1, f.t / f.life)), x = lerp(f.x0, f.x1, u), y = lerp(f.y0, f.y1, u) - Math.sin(u * Math.PI) * 60 * s, sz = L.cs * (1 - u * 0.45); ctx.drawImage(f.img, x - sz / 2, y - sz / 2, sz, sz); }
  ctx.restore();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; for (const q of TXT) { const a = q.t < 1 ? 1 : 1 - (q.t - 1) / 0.4, pop = 1 + 0.25 * Math.max(0, 1 - q.t * 6); ctx.globalAlpha = Math.max(0, a); ctx.font = `${Math.round(q.size * s * pop)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(90,20,60,.55)'; ctx.strokeText(q.txt, q.x, q.y); ctx.fillStyle = q.col; ctx.fillText(q.txt, q.x, q.y); } ctx.globalAlpha = 1;
  if (hint) { const a = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, a); ctx.font = `700 ${Math.round(14 * s)}px ${BC}`; const lines = wrapText(hint.txt, W - 50), lh = 17 * s, hh = lines.length * lh + 14, ww = W - 30, hy = Math.min(H - hh / 2 - 8, L.by + L.bh + 30 * s);
    ctx.fillStyle = 'rgba(90,30,70,.92)'; rrect(W / 2 - ww / 2, hy - hh / 2, ww, hh, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, hy - hh / 2 + 7 + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${FX.flash * 0.35})`; ctx.fillRect(0, 0, W, H); } }
function paintBack(P, L, g) { const oc = draw.oc || (draw.oc = document.createElement('canvas')); oc.width = cv.width; oc.height = cv.height; const o = oc.getContext('2d'); o.setTransform(DPR, 0, 0, DPR, 0, 0);
  const bg = o.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, P.sky[0]); bg.addColorStop(1, P.sky[1]); o.fillStyle = bg; o.fillRect(0, 0, W, H);
  const R0 = rng(11 + (g ? g.place : 0)); for (let i = 0; i < 26; i++) { o.fillStyle = `rgba(255,255,255,${0.15 + R0() * 0.25})`; o.beginPath(); o.arc(R0() * W, R0() * H, 8 + R0() * 40, 0, TAU); o.fill(); }
  for (let i = 0; i < 5; i++) { const x = R0() * W, y = H * (0.1 + R0() * 0.8), r = 14 + R0() * 18; o.save(); o.translate(x, y); o.globalAlpha = 0.25; o.strokeStyle = '#fff'; o.lineWidth = r * 0.35; o.beginPath(); o.arc(0, 0, r, 0, TAU * 0.85); o.stroke(); o.restore(); }
  if (!g) return; const cs = L.cs;
  // the board: a soft panel under every cell (holes show the sky)
  o.fillStyle = 'rgba(70,30,90,.38)'; for (let i = 0; i < R * C; i++) { if (g.b[i].hole) continue; const x = L.bx + colOf(i) * cs, y = L.by + rowOf(i) * cs; o.beginPath(); o.roundRect(x - 3, y - 3, cs + 6, cs + 6, 8); o.fill(); }
  for (let i = 0; i < R * C; i++) { if (g.b[i].hole) continue; const x = L.bx + colOf(i) * cs, y = L.by + rowOf(i) * cs; o.fillStyle = (rowOf(i) + colOf(i)) % 2 ? 'rgba(255,255,255,.34)' : 'rgba(255,255,255,.24)'; o.beginPath(); o.roundRect(x + 1.5, y + 1.5, cs - 3, cs - 3, 6); o.fill(); } }
function drawBoard(G, L, now) { const cs = L.cs;
  // jelly under the sweets
  for (let i = 0; i < R * C; i++) { const c = G.b[i]; if (!c.jelly) continue; const x = L.bx + colOf(i) * cs, y = L.by + rowOf(i) * cs; ctx.fillStyle = c.jelly > 1 ? 'rgba(255,60,150,.62)' : 'rgba(255,110,180,.48)'; rrect(x + 2, y + 2, cs - 4, cs - 4, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.35)'; rrect(x + 5, y + 4, cs * 0.5, cs * 0.14, 4); ctx.fill(); }
  // pops, under the sweets that fall in
  for (const p of POPS) { const u = p.t / p.life, sz = cs * (1 + u * 0.45); ctx.globalAlpha = 1 - u; ctx.drawImage(p.img, p.x - sz / 2, p.y - sz / 2, sz, sz); } ctx.globalAlpha = 1;
  // the sweets
  const hm = hintMove && G.phase === 'idle' && G.idle > hintDelay(G) ? hintMove : null;
  ctx.save(); ctx.beginPath(); ctx.rect(L.bx - 6, L.by - 4, L.bw + 12, L.bh + 10); ctx.clip();
  for (let i = 0; i < R * C; i++) { const k = G.b[i].k; if (!k) continue; const v = VIEW.get(k.id); if (!v) continue; let x = L.cx(v.x), y = L.cy(v.y), sx = 1, sy = 1;
    if (v.sq > 0) { sx = 1 + v.sq * 0.16; sy = 1 - v.sq * 0.16; y += v.sq * cs * 0.08; }
    if (hm && (hm[0] === i || hm[1] === i)) { const o = hm[0] === i ? hm[1] : hm[0], d = Math.sin(G.idle * 8) * 0.07 * cs; x += Math.sign(colOf(o) - colOf(i)) * d; y += Math.sign(rowOf(o) - rowOf(i)) * d; sx = sy = 1.06; }
    if (v.wob > 0) x += Math.sin(v.wob * 40) * v.wob * cs * 0.12;
    if ((ui.sel && ui.sel.i === i) || ui.pick === i) { sx *= 1.12; sy *= 1.12; }
    if (k.sp === 'b') { ctx.save(); ctx.translate(x, y); ctx.rotate(now * 1.2); ctx.drawImage(spriteOf(k), -cs / 2, -cs / 2, cs, cs); ctx.restore(); }
    else { const w = cs * sx, h = cs * sy; ctx.drawImage(spriteOf(k), x - w / 2, y - h / 2, w, h); }
    if (k.sp === 'w' || k.sp === 'b') { ctx.globalAlpha = 0.3 + 0.2 * Math.sin(now * 5 + i); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, cs * 0.46, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; } }
  ctx.restore();
  // frosting and cages on top
  for (let i = 0; i < R * C; i++) { const c = G.b[i], x = L.bx + colOf(i) * cs, y = L.by + rowOf(i) * cs;
    if (c.frost) { const gr = ctx.createLinearGradient(x, y, x, y + cs); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, c.frost > 1 ? '#b8d8f0' : '#dceefa'); ctx.fillStyle = gr; rrect(x + 2, y + 2, cs - 4, cs - 4, 8); ctx.fill(); ctx.strokeStyle = 'rgba(120,170,210,.8)'; ctx.lineWidth = 2; ctx.stroke();
      const R0 = rng(i + 3); for (let k = 0; k < 6; k++) { ctx.fillStyle = COLS6[k]; ctx.fillRect(x + 6 + R0() * (cs - 14), y + 6 + R0() * (cs - 14), 4, 2); } if (c.frost > 1) { ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 6, y + cs * 0.35); ctx.quadraticCurveTo(x + cs / 2, y + cs * 0.2, x + cs - 6, y + cs * 0.35); ctx.stroke(); } }
    if (c.lock) { ctx.strokeStyle = 'rgba(40,20,30,.85)'; ctx.lineWidth = cs * 0.1; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + cs * 0.18, y + cs * 0.18); ctx.lineTo(x + cs * 0.82, y + cs * 0.82); ctx.moveTo(x + cs * 0.82, y + cs * 0.18); ctx.lineTo(x + cs * 0.18, y + cs * 0.82); ctx.stroke(); ctx.lineCap = 'butt'; ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 2; ctx.stroke(); } }
  // beams, blasts, lightning
  for (const b of BEAMS) { const u = b.t / b.life, a = 1 - u, w = cs * (b.wide ? 2.6 : 0.7) * (1 - u * 0.6); ctx.globalAlpha = a; ctx.fillStyle = '#fff';
    if (b.d === 'h') { ctx.fillRect(L.bx - 4, b.y - w / 2, L.bw + 8, w); ctx.fillStyle = b.col; ctx.globalAlpha = a * 0.5; ctx.fillRect(L.bx - 4, b.y - w, L.bw + 8, w * 2); } else { ctx.fillRect(b.x - w / 2, L.by - 4, w, L.bh + 8); ctx.fillStyle = b.col; ctx.globalAlpha = a * 0.5; ctx.fillRect(b.x - w, L.by - 4, w * 2, L.bh + 8); } ctx.globalAlpha = 1; }
  for (const r of RINGS) { const u = r.t / r.life; ctx.globalAlpha = 1 - u; ctx.strokeStyle = '#fff'; ctx.lineWidth = cs * 0.35 * (1 - u); ctx.beginPath(); ctx.arc(r.x, r.y, cs * (0.5 + u * r.size), 0, TAU); ctx.stroke(); ctx.fillStyle = `rgba(255,240,200,${0.4 * (1 - u)})`; ctx.fill(); ctx.globalAlpha = 1; }
  for (const z of ZAPS) { const u = z.t / z.life; ctx.globalAlpha = 1 - u; ctx.strokeStyle = z.big ? '#fff6a0' : '#ffffff'; ctx.lineWidth = 2.5; for (const [tx, ty] of z.to) { ctx.beginPath(); ctx.moveTo(z.x, z.y); const n = 5; for (let k = 1; k <= n; k++) { const f = k / n; ctx.lineTo(lerp(z.x, tx, f) + (k < n ? (Math.random() - 0.5) * 14 : 0), lerp(z.y, ty, f) + (k < n ? (Math.random() - 0.5) * 14 : 0)); } ctx.stroke(); } ctx.globalAlpha = 1; } }
const hintDelay = G => G.lesson ? 2 : upLv('hint') ? 3 : 5;
// ---------- the top: moves, the goal and how far along it is ----------
function goalIcons(G) { const g = G.cfg.goal, out = [];
  if (g === 'collect') for (const x of G.collect) out.push({ img: sprite(x.col, ''), n: Math.max(0, x.n - x.got), done: x.got >= x.n });
  if (g === 'jelly') out.push({ jelly: true, n: jellyLeft(G), done: !jellyLeft(G) });
  if (g === 'frost') out.push({ frost: true, n: frostLeft(G), done: !frostLeft(G) });
  if (g === 'cherry') out.push({ img: sprite(-1, 'cherry'), n: Math.max(0, G.cherT - G.cherOut), done: G.cherOut >= G.cherT });
  if (g === 'score') out.push({ score: true, n: Math.max(0, G.target - G.score), done: G.score >= G.target }); return out; }
function goalSpot(G, L, k = 0) { const s = L.s, n = goalIcons(G).length, x0 = W - 16 - n * 62 * s; return [x0 + (k + 0.5) * 62 * s, 50 * s]; }
function hud(G, L, now) { const s = L.s;
  if (G.lesson) { lessonPanel(G, L); return; }
  // moves
  const mx = 50 * s, my = 52 * s, low = G.moves <= 5 && !G.done; ctx.fillStyle = low ? '#ff5a7a' : '#ff8ab8'; ctx.beginPath(); ctx.arc(mx, my, 32 * s * (low ? 1 + 0.05 * Math.sin(now * 8) : 1), 0, TAU); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `${Math.round(26 * s)}px ${TF}`; ctx.fillText(G.moves, mx, my - 3 * s); ctx.font = `700 ${Math.round(10 * s)}px ${BC}`; ctx.fillText('MOVES', mx, my + 16 * s);
  if (G.fumble >= 1 && !G.done) { const n = G.fumble; ctx.font = `700 ${Math.round(11 * s)}px ${BC}`; ctx.fillStyle = chip > 0 ? '#ff3a5a' : 'rgba(120,30,70,.85)'; ctx.textAlign = 'left'; ctx.fillText(chip > 0 ? CHIPTXT : `Next miss costs ${n} move${n > 1 ? 's' : ''}`, mx + 38 * s, my + 34 * s); }
  // the goal
  const icons = goalIcons(G); icons.forEach((ic, k) => { const [x, y] = goalSpot(G, L, k); ctx.fillStyle = 'rgba(255,255,255,.6)'; rrect(x - 28 * s, y - 26 * s, 56 * s, 52 * s, 12); ctx.fill(); const sz = 34 * s;
    if (ic.img) ctx.drawImage(ic.img, x - sz / 2, y - sz / 2 - 6 * s, sz, sz); if (ic.jelly) { ctx.fillStyle = 'rgba(255,90,170,.8)'; rrect(x - 14 * s, y - 20 * s, 28 * s, 26 * s, 6); ctx.fill(); } if (ic.frost) { ctx.fillStyle = '#e8f4ff'; rrect(x - 14 * s, y - 20 * s, 28 * s, 26 * s, 6); ctx.fill(); ctx.strokeStyle = '#8ab8e0'; ctx.lineWidth = 2; ctx.stroke(); }
    if (ic.score) { ctx.fillStyle = '#c84a8a'; ctx.font = `${Math.round(13 * s)}px ${TF}`; ctx.fillText('SCORE', x, y - 8 * s); }
    ctx.font = `${Math.round(15 * s)}px ${TF}`; ctx.fillStyle = ic.done ? '#2a9a4a' : '#8a2a5a'; ctx.fillText(ic.done ? '✓' : ic.score ? ic.n.toLocaleString() : ic.n, x, y + 17 * s); });
  // the bar: how far along the goal, and the score
  const bx = 90 * s, bw = W - bx - 16 - icons.length * 62 * s - 8, by = 72 * s, p = progress(G); ctx.fillStyle = 'rgba(255,255,255,.55)'; rrect(bx, by, bw, 12 * s, 6); ctx.fill();
  const gr = ctx.createLinearGradient(bx, 0, bx + bw, 0); gr.addColorStop(0, '#ff8ab8'); gr.addColorStop(1, '#ffd23a'); ctx.fillStyle = gr; rrect(bx, by, Math.max(12 * s, bw * p), 12 * s, 6); ctx.fill();
  ctx.fillStyle = '#8a2a5a'; ctx.font = `${Math.round(15 * s)}px ${TF}`; ctx.textAlign = 'left'; ctx.fillText(G.score.toLocaleString(), bx, by - 12 * s); ctx.font = `700 ${Math.round(11 * s)}px ${BC}`; ctx.textAlign = 'right'; ctx.fillText(`LEVEL ${G.N}`, bx + bw, by - 12 * s); }
function lessonPanel(G, L) { coachPanel(G); }
// ---------- what each happening looks and sounds like ----------
const CASC = ['', '', 'Nice!', 'Yummy!', 'Scrumptious!', 'Sugar storm!'];
function onEvent(G, e) { const L = lay(), s = L.s, cs = L.cs, at = i => [L.cx(colOf(i)), L.cy(rowOf(i))];
  switch (e.k) {
    case 'start': VIEW.clear(); dropIn = true; say(`LEVEL ${G.N}`, W / 2, L.by + L.bh * 0.4, '#fff', 34); say(goalLine(G), W / 2, L.by + L.bh * 0.4 + 40 * s, '#ffe8f4', 18); sfx.start(); if (G.N <= 1) tip('how', 'Swipe a sweet into its neighbour to make a line of three.', 3.4); hintMove = null; break;
    case 'swap': sfx.swap(); hintMove = null; break;
    case 'nope': { for (const i of [e.i, e.j]) { const k = G.b[i].k, v = k && VIEW.get(k.id); if (v) v.wob = 0.35; } sfx.nope(); if (e.cost) { chip = 1.2; CHIPTXT = `−${e.cost} MOVE${e.cost > 1 ? 'S' : ''}!`; say(CHIPTXT, W / 2, L.by - 8 * s, '#ff3a5a', 20); } else if (!G.lesson) tip('nope', 'No line there: it swaps back. Another miss soon after costs a move.', 3.2); break; }
    case 'stuck': sfx.nope(); break;
    case 'pop': { let sx = 0, sy = 0; for (const p of e.cells) { const pos = vpos(p.id) || at(p.i); sx += pos[0]; sy += pos[1]; if (p.col >= 0 || p.sp === 'b') { const img = p.sp === 'b' ? sprite(-2, 'b') : sprite(p.col, p.sp || ''); POPS.push({ x: pos[0], y: pos[1], img, t: 0, life: 0.22 });
          sparks(pos[0], pos[1], 5, p.col >= 0 ? COLS6[p.col] : '#fff', 160 * s); if (G.collect && G.collect.some(x => x.col === p.col) && FLY.length < 30) { const k = G.collect.findIndex(x => x.col === p.col), [tx, ty] = goalSpot(G, L, k); FLY.push({ img: sprite(p.col, ''), x0: pos[0], y0: pos[1], x1: tx, y1: ty, t: 0, life: 0.55, done: () => sfx.tick() }); } } }
      const n = e.cells.length, mx = sx / n, my = sy / n; say(`${60 * (1 + e.casc) * n}`, mx, my, '#fff', 15 + Math.min(10, n));
      sfx.pop(e.casc, n); if (e.casc >= 2) { const w = CASC[Math.min(5, e.casc)]; if (w) say(w, W / 2, L.by + L.bh * 0.45, ['#fff', '#fff', '#ffe08a', '#ff8ab8', '#a8f0ff', '#fff6a0'][Math.min(5, e.casc)], 26 + e.casc * 3); } if (n >= 5) FX.shake = Math.min(10, n); break; }
    case 'made': { const [x, y] = at(e.i); sparks(x, y, 14, '#fff', 200 * s); sfx.made(e.sp); vibe(HAP.light); say(e.sp === 'b' ? 'COLOUR BOMB!' : e.sp === 'w' ? 'WRAPPED!' : 'STRIPED!', x, y - cs * 0.7, '#fff', 17); break; }
    case 'beam': { const [x, y] = at(e.i), k = G.b[e.i].k; BEAMS.push({ x, y, d: e.d, wide: e.wide, t: 0, life: 0.35, col: k && k.col >= 0 ? COLS6[k.col] : '#ffe08a' }); sfx.beam(); FX.shake = Math.max(FX.shake, 5); break; }
    case 'blast': { const [x, y] = at(e.i); RINGS.push({ x, y, t: 0, life: 0.4, size: e.big ? 3 : 1.8 }); sfx.blast(e.big); FX.shake = e.big ? 14 : 8; FX.flash = e.big ? 0.5 : 0.25; vibe(HAP.thud); break; }
    case 'zap': { const [x, y] = at(e.i); ZAPS.push({ x, y, to: e.to.map(at), t: 0, life: 0.45, big: e.big }); sfx.zap(); FX.flash = 0.4; vibe(HAP.sharp); break; }
    case 'mega': FX.flash = 1; FX.shake = 18; say('SUGAR BLAST!', W / 2, L.by + L.bh * 0.45, '#fff6a0', 40); sfx.blast(true); break;
    case 'combo': say('COMBO!', W / 2, L.by + L.bh * 0.3, '#fff', 30); break;
    case 'jelly': { const [x, y] = at(e.i); sparks(x, y, 6, '#ff6ab8', 140 * s); sfx.jelly(); break; }
    case 'frost': { const [x, y] = at(e.i); sparks(x, y, 9, '#e8f6ff', 200 * s); sfx.crack(e.left); break; }
    case 'unlock': { const [x, y] = at(e.i); sparks(x, y, 6, '#3a2030', 160 * s); sfx.crack(1); break; }
    case 'cherry': { const [x, y] = at(e.i), [tx, ty] = goalSpot(G, L, 0); FLY.push({ img: sprite(-1, 'cherry'), x0: x, y0: y, x1: tx, y1: ty, t: 0, life: 0.7, done: () => sfx.cherry() }); say('+1000', x, y - 20 * s, '#fff', 18); break; }
    case 'shuffle': say('No moves: shuffle!', W / 2, L.by + L.bh / 2, '#fff', 22); sfx.shuffle(); VIEW.clear(); break;
    case 'goal': say('GOAL!', W / 2, L.by + L.bh * 0.4, '#fff6a0', 46); FX.flash = 0.6; sfx.goal(); vibe(HAP.best); for (let i = 0; i < 40; i++) { const a = Math.random() * TAU; PT.push({ x: W / 2, y: L.by + L.bh * 0.4, vx: Math.cos(a) * 320, vy: Math.sin(a) * 320 - 160, life: 1.1, t: 0, col: COLS6[i % 6], r: 3.5 }); } break;
    case 'rush': if (G.moves > 0) say('SUGAR RUSH!', W / 2, L.by + L.bh * 0.55, '#ffd23a', 34); break;
    case 'rushfire': { const [x, y] = at(e.i); sparks(x, y, 10, '#fff', 180 * s); sfx.rushfire(G.movesMax - G.moves); break; }
    case 'move': if (e.left === 5 && !G.done && !G.lesson) say('5 moves left!', W / 2, L.by - 8 * s, '#ff5a7a', 18); break;
    case 'lessonmiss': coachMiss(); sfx.nope(); break;
    case 'lessonnext': if (e.first) hint = null; VIEW.clear(); dropIn = true; hintMove = null; break;
    case 'lessonok': if (e.txt) say(e.txt, W / 2, L.by + L.bh * 0.45, '#fff', 24); else sfx.tick(); break;
    case 'lessondone': say('YOU\'VE GOT IT!', W / 2, L.by + L.bh * 0.45, '#ffd23a', 30); sfx.goal(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); break;
    case 'lost': sfx.lose(); break;
  } }
function goalLine(G) { const g = G.cfg.goal; if (g === 'score') return `Score ${G.target.toLocaleString()} in ${G.moves} moves`; if (g === 'jelly') return `Clear the jelly in ${G.moves} moves`; if (g === 'frost') return `Break the frosting in ${G.moves} moves`;
  if (g === 'cherry') return `Bring down ${G.cherT} cherries in ${G.moves} moves`; if (g === 'collect') return 'Collect ' + G.collect.map(x => `${x.n} ${['red', 'orange', 'yellow', 'green', 'blue', 'purple'][x.col]}`).join(' and ') + ` in ${G.moves} moves`; return ''; }
