
// ===================== DRAW + JUICE: the toy-box grid (2D on purpose: a block puzzle reads best flat and square, like the originals) =====================
// A dark, soft board of 64 wells; glossy bevelled blocks in eight bright colours; grey stone for junk; gems are crystal blocks
// with a diamond that twinkles. The tray sits under the board; a piece being dragged rides above the finger (so the finger
// never hides it), full size, with a shadow on the grid where it would land and the rows and columns it would clear lit up
// in advance (the "it's going to clear!" promise, P3/P6). A clear sweeps a white flash along the line, every block pops into
// sparks of its colour, gems fly to the goal, and the words climb with a double, triple or combo.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, PT = [], TXT = [];
let hint = null, POPS = [], SWEEP = [], FLY = [], BACK = null, born = {}, comboShow = 0, dangerT = 0, lastClearN = 0;
function sparks(x, y, n, col, sp = 220) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random()); PT.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, life: 0.45 + Math.random() * 0.35, t: 0, col, r: 2 + Math.random() * 3 }); } if (PT.length > 400) PT.splice(0, PT.length - 400); }
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS || !(G && G.lesson)) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
const S1 = () => Math.min(W, H * 0.6) / 390;
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of String(t).split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
const rowOf = i => (i / GRID) | 0, colOf = i => i % GRID;
// where everything is: the HUD at the top, the board, the tray under it, the two power buttons under the tray
function lay() { const s = S1(), top = 112 * s, trayH = Math.max(130 * s, H * 0.18), cs = Math.min((W - 20) / GRID, (H - top - trayH - 56 * s) / GRID), bw = cs * GRID, bx = (W - bw) / 2,
    by = top + Math.max(0, (H - top - trayH - 56 * s - bw) * 0.4), ty = by + bw + 22 * s, tcs = Math.min(cs * 0.6, 30 * s);
  return { s, cs, bx, by, bw, ty, tcs, cx: c => bx + (c + 0.5) * cs, cy: r => by + (r + 0.5) * cs, slot: k => W / 2 + (k - 1) * W * 0.32, py: ty + trayH }; }
// ---------- the blocks, drawn once per size and colour into little pictures ----------
let SPR = { key: '', c: {} };
function shade(hex, k) { const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255, f = v => Math.round(clamp(k > 1 ? v + (255 - v) * (k - 1) : v * k, 0, 255)); return `rgb(${f(r)},${f(g)},${f(b)})`; }
const colHex = col => col === 8 ? '#7d8597' : col === 9 ? '#bfe9ff' : BCOL[col % 8];
function block(col, px) { const key = col + ':' + Math.round(px * DPR); if (SPR.c[key]) return SPR.c[key]; const d = Math.max(4, Math.ceil(px * DPR)), cnv = document.createElement('canvas'); cnv.width = cnv.height = d; const x = cnv.getContext('2d'), h = colHex(col), r = d * 0.16, m = d * 0.03;
  const rr = (a, b, w, hh, q) => { x.beginPath(); x.roundRect(a, b, w, hh, q); };
  rr(m, m, d - 2 * m, d - 2 * m, r); x.fillStyle = shade(h, 0.62); x.fill();                                  // the dark edge
  const g = x.createLinearGradient(0, 0, 0, d); g.addColorStop(0, shade(h, 1.18)); g.addColorStop(1, shade(h, 0.92)); rr(m, m, d - 2 * m, d - 2 * m - d * 0.09, r); x.fillStyle = g; x.fill();      // the face
  rr(d * 0.17, d * 0.15, d * 0.66, d * 0.56, r * 0.7); const g2 = x.createLinearGradient(0, d * 0.15, 0, d * 0.7); g2.addColorStop(0, shade(h, 1.05)); g2.addColorStop(1, shade(h, 0.98)); x.fillStyle = g2; x.fill();      // the raised top
  x.fillStyle = 'rgba(255,255,255,.55)'; rr(d * 0.2, d * 0.17, d * 0.36, d * 0.1, d * 0.05); x.fill();          // the shine
  if (col === 8) { x.strokeStyle = 'rgba(40,44,56,.5)'; x.lineWidth = d * 0.04; x.beginPath(); x.moveTo(d * 0.3, d * 0.3); x.lineTo(d * 0.48, d * 0.5); x.lineTo(d * 0.42, d * 0.68); x.moveTo(d * 0.48, d * 0.5); x.lineTo(d * 0.68, d * 0.45); x.stroke(); }
  return SPR.c[key] = cnv; }
function gemPic(px) { const key = 'gem:' + Math.round(px * DPR); if (SPR.c[key]) return SPR.c[key]; const d = Math.max(4, Math.ceil(px * DPR)), cnv = document.createElement('canvas'); cnv.width = cnv.height = d; const x = cnv.getContext('2d');
  const P = [[0.5, 0.18], [0.8, 0.4], [0.5, 0.84], [0.2, 0.4]].map(([a, b]) => [a * d, b * d]); x.beginPath(); P.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.closePath();
  const g = x.createLinearGradient(0, d * 0.18, 0, d * 0.84); g.addColorStop(0, '#ff9ef0'); g.addColorStop(0.5, '#c050ff'); g.addColorStop(1, '#6a20d0'); x.fillStyle = g; x.fill(); x.strokeStyle = '#fff'; x.lineWidth = d * 0.04; x.stroke();
  x.beginPath(); x.moveTo(d * 0.2, d * 0.4); x.lineTo(d * 0.8, d * 0.4); x.moveTo(d * 0.5, d * 0.18); x.lineTo(d * 0.38, d * 0.4); x.lineTo(d * 0.5, d * 0.84); x.lineTo(d * 0.62, d * 0.4); x.lineTo(d * 0.5, d * 0.18); x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = d * 0.025; x.stroke();
  return SPR.c[key] = cnv; }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 40); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 2); comboShow = Math.max(0, comboShow - dt);
  for (const p of PT) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 520 * dt; } for (let i = PT.length - 1; i >= 0; i--) if (PT[i].t > PT[i].life) PT.splice(i, 1);
  for (const t of TXT) { t.t += dt; t.y -= dt * 22; } while (TXT.length && TXT[0].t > 1.4) TXT.shift(); if (hint) { hint.t += dt; if (hint.t > hint.secs) hint = null; }
  for (const a of [POPS, SWEEP, FLY]) { for (const p of a) p.t += dt; for (let i = a.length - 1; i >= 0; i--) if (a[i].t > a[i].life) { if (a === FLY && a[i].done) a[i].done(); a.splice(i, 1); } }
  for (const k in born) { born[k] += dt; if (born[k] > 1) delete born[k]; }
  if (BACK) { BACK.t += dt; if (BACK.t > 0.22) BACK = null; }
  if (G && !G.over && !G.lesson) { const f = G.b.filter(Boolean).length; dangerT = lerp(dangerT, f > 44 ? 1 : 0, dt * 2); } else dangerT = 0; }
// ---------- what a piece dragged to here would do ----------
function dropSpot(L) { const d = ui.drag; if (!d || !G) return null; const p = G.tray[d.ti]; if (!p) return null; const w = 1 + Math.max(...p.cells.map(c => c[1])), h = 1 + Math.max(...p.cells.map(c => c[0]));
  const px = d.x - w * L.cs / 2, py = d.y - liftOf(L) - h * L.cs / 2, c = Math.round((px - L.bx) / L.cs), r = Math.round((py - L.by) / L.cs); return { p, r, c, px, py, w, h, ok: fits(G, p, r, c) }; }
const liftOf = L => L.cs * 2.1;
function wouldClear(G, p, r, c) { const B = G.b.slice(); for (const [a, b] of p.cells) B[idx(r + a, c + b)] = 1; const rows = [], cols = [];
  for (let rr = 0; rr < GRID; rr++) { let f = true; for (let cc = 0; cc < GRID; cc++) if (!B[idx(rr, cc)]) { f = false; break; } if (f) rows.push(rr); }
  for (let cc = 0; cc < GRID; cc++) { let f = true; for (let rr = 0; rr < GRID; rr++) if (!B[idx(rr, cc)]) { f = false; break; } if (f) cols.push(cc); } return { rows, cols }; }
// ---------- the picture ----------
function draw(now) { ctx.setTransform(DPR, 0, 0, DPR, 0, 0); const L = lay(), s = L.s, g = G;
  const key = L.cs.toFixed(2) + ':' + DPR; if (SPR.key !== key) SPR = { key, c: {} };
  const rk = W + 'x' + H + ':' + DPR + ':' + (g ? g.place : 0); if (draw.rk !== rk) { draw.rk = rk; paintBack(L, g); }
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(draw.oc, 0, 0); ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.save(); if (FX.shake > 0) ctx.translate((Math.random() - 0.5) * FX.shake, (Math.random() - 0.5) * FX.shake);
  if (g) { drawBoard(g, L, now); drawTray(g, L, now); hud(g, L, now); }
  for (const p of PT) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 - p.t / p.life * 0.5), 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  for (const f of FLY) { const u = easeOut(Math.min(1, f.t / f.life)), x = lerp(f.x0, f.x1, u), y = lerp(f.y0, f.y1, u) - Math.sin(u * Math.PI) * 70 * s, sz = L.cs * (1 - u * 0.4); ctx.drawImage(gemPic(L.cs), x - sz / 2, y - sz / 2, sz, sz); }
  if (g) drawDrag(g, L, now);
  ctx.restore();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; for (const q of TXT) { const a = q.t < 1 ? 1 : 1 - (q.t - 1) / 0.4, pop = 1 + 0.3 * Math.max(0, 1 - q.t * 6); ctx.globalAlpha = Math.max(0, a); ctx.font = `900 ${Math.round(q.size * s * pop)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(10,16,40,.6)'; ctx.strokeText(q.txt, q.x, q.y); ctx.fillStyle = q.col; ctx.fillText(q.txt, q.x, q.y); } ctx.globalAlpha = 1;
  if (hint) { const a = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, a); ctx.font = `700 ${Math.round(14 * s)}px ${BC}`; const lines = wrapText(hint.txt, W - 50), lh = 17 * s, hh = lines.length * lh + 14, ww = W - 30, hy = clamp(L.by + L.bw * 0.5, 60, H - hh);
    ctx.fillStyle = 'rgba(14,20,48,.94)'; rrect(W / 2 - ww / 2, hy - hh / 2, ww, hh, 12); ctx.fill(); ctx.strokeStyle = '#ffc23a'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, hy - hh / 2 + 7 + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (dangerT > 0.02) { const gr = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75); gr.addColorStop(0, 'rgba(255,60,60,0)'); gr.addColorStop(1, `rgba(255,60,60,${0.22 * dangerT * (0.75 + 0.25 * Math.sin(now * 4))})`); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); } }
function paintBack(L, g) { const oc = draw.oc || (draw.oc = document.createElement('canvas')); oc.width = cv.width; oc.height = cv.height; const o = oc.getContext('2d'); o.setTransform(DPR, 0, 0, DPR, 0, 0); const P = PLACES[g ? g.place : 0];
  const bg = o.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, P.bg[0]); bg.addColorStop(1, P.bg[1]); o.fillStyle = bg; o.fillRect(0, 0, W, H);
  const R0 = rng(31 + (g ? g.place : 0)); for (let i = 0; i < 34; i++) { const x = R0() * W, y = R0() * H, z = 6 + R0() * 22; o.save(); o.translate(x, y); o.rotate(R0() * TAU); o.globalAlpha = 0.05 + R0() * 0.07; o.fillStyle = BCOL[i % 8]; o.beginPath(); o.roundRect(-z / 2, -z / 2, z, z, z * 0.2); o.fill(); o.restore(); }
  if (!g) return; const cs = L.cs;
  // the board: a rounded tray of 64 wells
  o.fillStyle = 'rgba(5,8,24,.78)'; o.beginPath(); o.roundRect(L.bx - 8, L.by - 8, L.bw + 16, L.bw + 16, 16); o.fill(); o.strokeStyle = 'rgba(255,255,255,.3)'; o.lineWidth = 2; o.stroke();      // (22 Nov 2026: the wells were too faint to see where a piece would land)
  for (let r = 0; r < GRID; r++) for (let c = 0; c < GRID; c++) { const x = L.bx + c * cs, y = L.by + r * cs; o.fillStyle = (r + c) % 2 ? 'rgba(150,170,255,.2)' : 'rgba(150,170,255,.13)'; o.beginPath(); o.roundRect(x + 1.5, y + 1.5, cs - 3, cs - 3, cs * 0.14); o.fill(); o.strokeStyle = 'rgba(255,255,255,.1)'; o.lineWidth = 1; o.stroke(); } }
function drawBoard(G, L, now) { const cs = L.cs, sp = dropSpot(L);
  // what the dragged piece would clear lights up first (the promise)
  let lit = null; if (sp && sp.ok) { const w = wouldClear(G, sp.p, sp.r, sp.c); lit = w; for (const r of w.rows) { ctx.fillStyle = `rgba(255,214,90,${0.22 + 0.12 * Math.sin(now * 12)})`; rrect(L.bx - 3, L.by + r * cs, L.bw + 6, cs, 8); ctx.fill(); } for (const c of w.cols) { ctx.fillStyle = `rgba(255,214,90,${0.22 + 0.12 * Math.sin(now * 12)})`; rrect(L.bx + c * cs, L.by - 3, cs, L.bw + 6, 8); ctx.fill(); } }
  // in a lesson the gap glows until it is filled
  if (G.lesson && !ui.drag) for (let i = 0; i < GRID * GRID; i++) { if (G.b[i]) continue; const r = rowOf(i), c = colOf(i); let nr = 0, nc = 0; for (let k = 0; k < GRID; k++) { if (G.b[idx(r, k)]) nr++; if (G.b[idx(k, c)]) nc++; } if (nr >= 5 || nc >= 6) { ctx.strokeStyle = `rgba(255,214,90,${0.5 + 0.4 * Math.sin(now * 6)})`; ctx.lineWidth = 3; rrect(L.bx + c * cs + 3, L.by + r * cs + 3, cs - 6, cs - 6, cs * 0.15); ctx.stroke(); } }
  // the blocks
  for (let i = 0; i < GRID * GRID; i++) { const b = G.b[i]; if (!b) continue; let x = L.bx + colOf(i) * cs, y = L.by + rowOf(i) * cs, z = cs; const bt = born[i];
    if (bt != null && bt < 0.25) { const u = bt / 0.25, k = 1 + Math.sin(u * Math.PI) * 0.12; z = cs * k; x -= (z - cs) / 2; y -= (z - cs) / 2; }      // a landing squash (P9)
    const glow = lit && (lit.rows.includes(rowOf(i)) || lit.cols.includes(colOf(i)));
    ctx.drawImage(block(glow ? b.col === 8 || b.col === 9 ? b.col : (sp.p.col) : b.col, cs), x, y, z, z);
    if (G.gem[i]) { const tw = 0.88 + 0.08 * Math.sin(now * 3 + i); ctx.drawImage(gemPic(cs), x + z * (1 - tw) / 2, y + z * (1 - tw) / 2 - z * 0.03, z * tw, z * tw); if (Math.sin(now * 2.3 + i * 1.7) > 0.97) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + z * 0.66, y + z * 0.3, 2.2, 0, TAU); ctx.fill(); } } }
  // the shadow where the piece would land
  if (sp) { for (const [a, b] of sp.p.cells) { const r = sp.r + a, c = sp.c + b; if (r < 0 || c < 0 || r >= GRID || c >= GRID) continue; const x = L.bx + c * cs, y = L.by + r * cs; if (sp.ok) { ctx.globalAlpha = 0.42; ctx.drawImage(block(sp.p.col, cs), x, y, cs, cs); ctx.globalAlpha = 1; } else if (!G.b[idx(r, c)]) { ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 2; rrect(x + 4, y + 4, cs - 8, cs - 8, 6); ctx.stroke(); } } }
  // pops and line sweeps
  for (const p of POPS) { const u = p.t / p.life, z = cs * (1 + u * 0.5); ctx.globalAlpha = 1 - u; ctx.drawImage(block(p.col, cs), p.x - z / 2, p.y - z / 2, z, z); } ctx.globalAlpha = 1;
  for (const w of SWEEP) { const u = w.t / w.life, a = 1 - u; ctx.globalAlpha = a; ctx.fillStyle = '#fff'; if (w.row != null) { const y = L.by + w.row * cs, x0 = L.bx + (w.from < 0 ? L.bw * (1 - u) : 0); ctx.fillRect(L.bx, y + cs * 0.3 * u, L.bw, cs * (1 - 0.6 * u)); } else { const x = L.bx + w.col * cs; ctx.fillRect(x + cs * 0.3 * u, L.by, cs * (1 - 0.6 * u), L.bw); } ctx.globalAlpha = 1; } }
function pieceSize(p) { return [1 + Math.max(...p.cells.map(c => c[1])), 1 + Math.max(...p.cells.map(c => c[0]))]; }
function drawPiece(p, x, y, z, alpha = 1) { ctx.globalAlpha = alpha; for (const [a, b] of p.cells) ctx.drawImage(block(p.col, z), x + b * z, y + a * z, z, z); ctx.globalAlpha = 1; }
function drawTray(G, L, now) { const s = L.s;
  ctx.fillStyle = 'rgba(5,8,24,.35)'; rrect(10, L.ty - 4 * s, W - 20, L.py - L.ty - 2 * s, 16); ctx.fill();
  for (let k = 0; k < 3; k++) { const p = G.tray[k]; if (!p) continue; if (ui.drag && ui.drag.ti === k) continue; const [w, h] = pieceSize(p); let z = Math.min(L.tcs, W * 0.29 / w), x = L.slot(k) - w * z / 2, y = (L.ty + L.py) / 2 - h * z / 2 - 6 * s;
    if (BACK && BACK.ti === k) { const u = easeOut(BACK.t / 0.22); x = lerp(BACK.x, x, u); y = lerp(BACK.y, y, u); z = lerp(L.cs, L.tcs, u); }
    const fitsAny = anyFit(G, p); drawPiece(p, x, y, z, fitsAny ? 1 : 0.28);
    if (G.lesson && !ui.drag && p.cells.length <= 3 && lessonKey(G, k)) { const b = 1 + 0.06 * Math.sin(now * 7); ctx.strokeStyle = 'rgba(255,214,90,.9)'; ctx.lineWidth = 2.5; rrect(L.slot(k) - (w * z / 2 + 8) * b, y - 8 * b, (w * z + 16) * b, (h * z + 16) * b, 10); ctx.stroke(); } }
  // the two power-ups (only once bought)
  for (const pw of powers(G, L)) { const on = pw.n > 0, armed = pw.id === 'bomb' && G.arm; ctx.fillStyle = armed ? '#ff5a5a' : on ? 'rgba(255,194,58,.95)' : 'rgba(255,255,255,.1)'; rrect(pw.x, pw.y, pw.w, pw.h, pw.h / 2); ctx.fill();
    ctx.fillStyle = on ? '#1a2448' : 'rgba(255,255,255,.35)'; ctx.font = `800 ${Math.round(13 * s)}px ${TF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(armed ? 'TAP THE GRID' : pw.label + (on ? '' : ' (used)'), pw.x + pw.w / 2, pw.y + pw.h / 2 + 1); } }
function lessonKey(G, k) { const p = G.tray[k]; if (!p) return false; for (let r = 0; r < GRID; r++) for (let c = 0; c < GRID; c++) if (fits(G, p, r, c)) { const w = wouldClear(G, p, r, c); if (w.rows.length + w.cols.length) return true; } return false; }
function powers(G, L) { const out = [], s = L.s, h = 30 * s, y = L.py + 4 * s; if (G.lesson) return out; if (G.cfg.reroll) out.push({ id: 'reroll', label: '🔄 NEW PIECES', n: G.rerolls }); if (G.cfg.bomb) out.push({ id: 'bomb', label: '💣 BOMB', n: G.bombs });
  const w = Math.min(150 * s, (W - 40) / Math.max(1, out.length) - 10); out.forEach((p, k) => { p.w = w; p.h = h; p.x = W / 2 + (k - out.length / 2) * (w + 12) + 6; p.y = Math.min(y, H - h - 8); }); return out; }
function drawDrag(G, L, now) { const sp = dropSpot(L); if (!sp) return; const z = L.cs * 0.96;
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 8; drawPiece(sp.p, ui.drag.x - sp.w * z / 2, ui.drag.y - liftOf(L) - sp.h * z / 2, z); ctx.restore(); }
// ---------- the top: level, score, the goal ----------
function goalLeft(G) { return G.cfg.goal === 'score' ? Math.max(0, G.cfg.target - G.score) : Math.max(0, G.cfg.gems - G.gemsGot); }
function progress(G) { return clamp(G.cfg.goal === 'score' ? G.score / G.cfg.target : G.gemsGot / G.cfg.gems, 0, 1); }
const goalSpot = L => [W - 54 * L.s, 74 * L.s];
function hud(G, L, now) { const s = L.s;
  if (G.lesson) { lessonPanel(G, L); return; }
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.font = `700 ${Math.round(12 * s)}px ${BC}`; ctx.textAlign = 'left'; ctx.fillText(`LEVEL ${G.N} · ${PLACES[G.place].name.toUpperCase()}`, 16, 54 * s);
  ctx.fillStyle = '#fff'; ctx.font = `900 ${Math.round(34 * s)}px ${TF}`; ctx.fillText(G.score.toLocaleString(), 16, 82 * s);
  const bst = best[G.N]; if (bst) { ctx.font = `700 ${Math.round(12 * s)}px ${BC}`; ctx.fillStyle = G.score > bst ? '#ffc23a' : 'rgba(255,255,255,.55)'; ctx.fillText(G.score > bst ? 'NEW BEST!' : `BEST ${bst.toLocaleString()}`, 16, 104 * s); }
  // the goal, top right
  const [gx, gy] = goalSpot(L), gem = G.cfg.goal === 'gems'; ctx.fillStyle = 'rgba(255,255,255,.12)'; rrect(gx - 44 * s, gy - 30 * s, 88 * s, 60 * s, 14); ctx.fill();
  if (gem) { const z = 30 * s; ctx.drawImage(gemPic(z), gx - z / 2, gy - 22 * s, z, z); } else { ctx.fillStyle = '#ffc23a'; ctx.font = `800 ${Math.round(12 * s)}px ${TF}`; ctx.textAlign = 'center'; ctx.fillText('TARGET', gx, gy - 12 * s); }
  ctx.textAlign = 'center'; ctx.font = `900 ${Math.round(17 * s)}px ${TF}`; const left = goalLeft(G); ctx.fillStyle = left ? '#fff' : '#9be3b5'; ctx.fillText(left ? (gem ? `${G.gemsGot} / ${G.cfg.gems}` : G.cfg.target.toLocaleString()) : '✓', gx, gy + 16 * s);
  // the bar
  const bx = 130 * s, bw = W - bx - 110 * s, by = 76 * s, p = progress(G); if (bw > 40) { ctx.fillStyle = 'rgba(255,255,255,.14)'; rrect(bx, by, bw, 10 * s, 5 * s); ctx.fill(); const gr = ctx.createLinearGradient(bx, 0, bx + bw, 0); gr.addColorStop(0, '#3ac8d8'); gr.addColorStop(1, '#ffc23a'); ctx.fillStyle = gr; rrect(bx, by, Math.max(10 * s, bw * p), 10 * s, 5 * s); ctx.fill();
    if (G.streak > 0) { ctx.fillStyle = '#ff9a3a'; ctx.font = `900 ${Math.round(14 * s * (1 + comboShow * 0.3))}px ${TF}`; ctx.textAlign = 'center'; ctx.fillText(`COMBO ×${G.streak + 1}` + (G.since ? ' ' + '●'.repeat(3 - G.since) : ''), bx + bw / 2, by + 26 * s); } } }
function lessonPanel(G, L) { coachPanel(G); }
// ---------- what each happening looks and sounds like ----------
const WORDS = ['', '', 'DOUBLE!', 'TRIPLE!', 'QUADRUPLE!', 'INCREDIBLE!', 'UNREAL!'];
function onEvent(G, e) { const L = lay(), s = L.s, cs = L.cs;
  switch (e.k) {
    case 'start': say(`LEVEL ${G.N}`, W / 2, L.by + L.bw * 0.38, '#fff', 34); say(goalLine(G), W / 2, L.by + L.bw * 0.38 + 40 * s, '#ffe9b0', 18); sfx.start(); if (G.N <= 1) tip('how', 'Drag a piece from the tray onto the grid. Fill a row or a column to clear it.', 3.6); break;
    case 'deal': if (!G.lesson || G.placed) sfx.deal(); break;
    case 'place': for (const [a, b] of e.cells) born[idx(e.r + a, e.c + b)] = 0; sfx.place(e.cells.length); vibe(HAP.tick); break;
    case 'nofit': sfx.nope(); break;
    case 'fumble': if (e.cost) { say(`−${e.cost}`, W / 2, L.ty - 6 * s, '#ff6a6a', 22); } tip('fumble', 'Careful: a second wrong drop soon after the first costs points.', 3); break;
    case 'clear': { const n = e.n; let sx = 0, sy = 0; for (const c of e.cells) { const x = L.cx(colOf(c.i)), y = L.cy(rowOf(c.i)); sx += x; sy += y; POPS.push({ x, y, col: c.col, t: -Math.random() * 0.12, life: 0.3 }); sparks(x, y, 3, colHex(c.col), 170 * s); }
      for (const r of e.rows) SWEEP.push({ row: r, t: 0, life: 0.3 }); for (const c of e.cols) SWEEP.push({ col: c, t: 0, life: 0.3 });
      const mx = sx / e.cells.length, my = sy / e.cells.length; say(`+${e.pts}`, mx, my, '#fff', 20 + Math.min(14, n * 4));
      if (n >= 2) say(WORDS[Math.min(6, n)], W / 2, L.by + L.bw * 0.42, ['#fff', '#fff', '#ffe08a', '#ff9a3a', '#ff6ac8', '#a8f0ff', '#fff'][Math.min(6, n)], 30 + n * 4);
      if (e.streak >= 2) { comboShow = 1; say(`COMBO ×${e.streak}`, W / 2, L.by + L.bw * 0.42 + (n >= 2 ? 44 : 0) * s, '#ff9a3a', 24 + Math.min(12, e.streak * 2)); }
      for (const i of e.gems) { const [tx, ty] = goalSpot(L); FLY.push({ x0: L.cx(colOf(i)), y0: L.cy(rowOf(i)), x1: tx, y1: ty - 8 * s, t: 0, life: 0.6, done: () => sfx.gem() }); }
      sfx.clear(n, e.streak); FX.stop = n >= 2 ? 0.07 : 0.035; FX.shake = Math.min(16, 4 + n * 3); if (n >= 3) FX.flash = 0.5; vibe(n >= 2 ? HAP.sharp : HAP.light); lastClearN = n; break; }
    case 'gemnew': born[e.i] = 0; break;
    case 'streakend': if (e.n >= 2) say('combo over', W / 2, L.by - 4 * s, 'rgba(255,255,255,.6)', 14); break;
    case 'stuck': tip('stuck', 'Nothing fits! Use a power-up below the tray.', 3); sfx.nope(); break;
    case 'full': say('NO ROOM!', W / 2, L.by + L.bw * 0.45, '#ff8a8a', 40); FX.red = 1; FX.shake = 8; sfx.full(); vibe(HAP.thud); break;
    case 'reroll': sfx.deal(); say('NEW PIECES', W / 2, L.ty - 4 * s, '#ffc23a', 18); break;
    case 'bomb': { const x = L.cx(e.c), y = L.cy(e.r); for (const c of e.cells) { POPS.push({ x: L.cx(colOf(c.i)), y: L.cy(rowOf(c.i)), col: c.col, t: 0, life: 0.3 }); sparks(L.cx(colOf(c.i)), L.cy(rowOf(c.i)), 5, '#ffb43a', 260 * s); } sfx.boom(); FX.shake = 14; FX.flash = 0.4; vibe(HAP.thud); say('BOOM!', x, y, '#ffb43a', 30); break; }
    case 'goal': say('GOAL!', W / 2, L.by + L.bw * 0.4, '#ffe08a', 46); FX.flash = 0.6; sfx.goal(); vibe(HAP.best); for (let i = 0; i < 46; i++) { const a = Math.random() * TAU; PT.push({ x: W / 2, y: L.by + L.bw * 0.4, vx: Math.cos(a) * 340, vy: Math.sin(a) * 340 - 160, life: 1.1, t: 0, col: BCOL[i % 8], r: 3.5 }); } break;
    case 'lessonmiss': coachMiss(); sfx.nope(); break;
    case 'lessonnext': if (e.first) hint = null; break;
    case 'lessonok': sfx.tick(); say(`${e.n} / ${e.need}`, W / 2, L.by + L.bw * 0.55, '#ffc23a', 26); break;
    case 'lessondone': say('YOU\'VE GOT IT!', W / 2, L.by + L.bw * 0.45, '#ffc23a', 30); sfx.goal(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); break;
    case 'lost': sfx.lose(); break;
  } }
function goalLine(G) { return G.cfg.goal === 'score' ? `Score ${G.cfg.target.toLocaleString()}` : `Collect ${G.cfg.gems} gems 💎`; }
