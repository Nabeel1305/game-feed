
// ===================== DRAW + JUICE: the garden from above (2D on purpose: stripes on a lawn are a thing seen from above) =====================
// Long grass, soft and uneven; every cut cell turns into a stripe, light one way and dark the other, the way a real lawn
// looks after a good mow (the stripes are drawn soft, at one dot a cell, then smoothed up). Flower beds full of colour,
// round trees with their shadows, a little red mower trailing clippings, its grass box filling, the compost bin in its
// corner, the dog trotting about. The top bar: how much is cut against what is needed, the fuel, the bag, the stripes.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, PT = [], TXT = [];
let hint = null, LAWN = { key: '', c: null, cx: null, img: null, dirty: true };
const NU = 'Nunito, "Barlow Condensed", "Arial Narrow", sans-serif';
function say(txt, x, y, col = '#fff', size = 20) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS || !(G && G.lesson)) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
const S1 = () => Math.min(W, H * 0.6) / 390;
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of String(t).split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
// paint into a screen-sized picture of its own (with the usual helpers, which draw on ctx)
function layer(f) { const c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height; const keep = ctx; const o = c.getContext('2d'); o.setTransform(DPR, 0, 0, DPR, 0, 0); ctx = o; try { f(o); } finally { ctx = keep; } return c; }
function fillR(x, y, w, h, r, col) { ctx.fillStyle = col; rrect(x, y, w, h, r); ctx.fill(); }
function circ(x, y, r, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
// the lawn fitted under the top bar, with a border of hedge round it
function lay(g) { const s = S1(), top = 96 * s, bot = 70 * s, gw = g ? g.W : 9, gh = g ? g.H : 13, sc = Math.min((W - 30) / gw, (H - top - bot) / gh), lw = gw * sc, lh = gh * sc, lx = (W - lw) / 2, ly = top + (H - top - bot - lh) / 2;
  return { s, top, sc, lx, ly, lw, lh, X: x => lx + x * sc, Y: y => ly + y * sc }; }
function doneRect(L) { const s = L.s, w = 150 * s, h = 44 * s; return { x: W / 2 - w / 2, y: H - h - 12 * s, w, h }; }
// ---------- the lawn picture: long grass underneath (once per garden), cut cells over it (one dot each) ----------
function lawnPics(G, L) { const key = [G.seed, G.W, G.H, G.place, Math.round(L.sc * DPR)].join(':'); if (LAWN.key !== key) { LAWN.key = key;
    const P = PLACES[G.place].grass, w = Math.ceil(L.lw * DPR), h = Math.ceil(L.lh * DPR), c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'), R0 = rng(G.seed + 3);
    x.fillStyle = `rgb(${P[0] - 18},${P[1] - 22},${P[2] - 14})`; x.fillRect(0, 0, w, h);
    for (let i = 0; i < w * h / 26; i++) { const px = R0() * w, py = R0() * h, l = 4 + R0() * 7 * DPR, sh = (R0() - 0.5) * 50; x.strokeStyle = `rgba(${P[0] + sh},${P[1] + 10 + sh},${P[2] + sh * 0.5},.75)`; x.lineWidth = 1.1 * DPR; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (R0() - 0.5) * 3 * DPR, py - l); x.stroke(); }
    LAWN.c = c; LAWN.cx = document.createElement('canvas'); LAWN.cx.width = G.nx; LAWN.cx.height = G.ny; LAWN.img = LAWN.cx.getContext('2d').createImageData(G.nx, G.ny); LAWN.dirty = true; LAWN.gid = G; }
  if (LAWN.gid !== G) { LAWN.gid = G; LAWN.dirty = true; }
  if (LAWN.dirty) { LAWN.dirty = false; const P = PLACES[G.place].grass, d = LAWN.img.data; for (let k = 0; k < G.nx * G.ny; k++) { const o = k * 4; if (!G.cut[k]) { d[o + 3] = 0; continue; } const dir = G.dir[k], light = dir === 0 || dir === 3, b = light ? 40 : -12, i = k % G.nx, j = (k / G.nx) | 0, nz = ((i * 7 + j * 13) % 5) - 2;
      d[o] = P[0] + b + nz; d[o + 1] = P[1] + 18 + b + nz; d[o + 2] = P[2] + b * 0.6 + nz; d[o + 3] = 255; } LAWN.cx.getContext('2d').putImageData(LAWN.img, 0, 0); } }
// ---------- the things in the garden ----------
function drawBed(b, L, now) { const x = L.X(b.x - b.w / 2), y = L.Y(b.y - b.h / 2), w = b.w * L.sc, h = b.h * L.sc; fillR(x - 3, y - 3, w + 6, h + 6, 10, '#8a6a4a'); fillR(x, y, w, h, 8, b.crushed ? '#6a4a2a' : '#5a3a20');
  const R0 = rng((b.x * 100 | 0) + (b.y * 37 | 0)); const n = Math.round(b.w * b.h * 9);
  for (let i = 0; i < n; i++) { const fx = x + 6 + R0() * (w - 12), fy = y + 6 + R0() * (h - 12), hue = (b.hue + R0() * 60) % 360, rr = (2.2 + R0() * 1.8) * L.s;
    if (b.crushed) { if (R0() < 0.4) circ(fx, fy, rr * 0.6, `hsla(${hue},60%,55%,.6)`); continue; }
    circ(fx, fy + rr * 0.6, rr * 0.8, '#3a7a2a'); const sw = Math.sin(now * 1.5 + i) * 0.6; for (let p = 0; p < 5; p++) { const a = p / 5 * TAU + sw * 0.2; circ(fx + Math.cos(a) * rr * 0.75, fy + Math.sin(a) * rr * 0.75, rr * 0.55, `hsl(${hue},75%,62%)`); } circ(fx, fy, rr * 0.4, '#ffe04a'); } }
function tree(b, L, now) { const x = L.X(b.x), y = L.Y(b.y), r = b.crown * L.sc * 0.55; ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(x + r * 0.25, y + r * 0.3, r * 1.05, r * 0.9, 0, 0, TAU); ctx.fill();
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r); g.addColorStop(0, '#6ac04a'); g.addColorStop(1, '#2a6a24'); ctx.fillStyle = g; ctx.beginPath(); for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, rr = r * (0.88 + 0.12 * Math.sin(i * 2.7 + b.x)); i ? ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); ctx.fill();
  for (let i = 0; i < 5; i++) circ(x + Math.cos(i * 1.3) * r * 0.45, y + Math.sin(i * 1.3) * r * 0.45, r * 0.25, 'rgba(140,220,110,.25)'); }
function gnome(b, L) { const x = L.X(b.x), y = L.Y(b.y), r = 0.3 * L.sc; circ(x + r * 0.2, y + r * 0.3, r, 'rgba(0,0,0,.2)'); circ(x, y, r, '#3a6ad0'); circ(x, y - r * 0.1, r * 0.55, '#f0d0b0'); ctx.fillStyle = '#e03a3a'; ctx.beginPath(); ctx.moveTo(x - r * 0.6, y - r * 0.1); ctx.lineTo(x + r * 0.6, y - r * 0.1); ctx.lineTo(x + r * 0.1, y - r * 1.2); ctx.closePath(); ctx.fill(); circ(x, y + r * 0.35, r * 0.4, '#fff'); }
function binPic(b, L, G) { const x = L.X(b.x - b.w / 2), y = L.Y(b.y - b.h / 2), w = b.w * L.sc, h = b.h * L.sc; fillR(x + 4, y + 5, w, h, 6, 'rgba(0,0,0,.22)'); fillR(x, y, w, h, 6, '#8a5a2a'); for (let i = 1; i < 4; i++) fillR(x + 4, y + i * h / 4 - 2, w - 8, 3, 1, '#6a4018'); fillR(x + w * 0.15, y + h * 0.2, w * 0.7, h * 0.6, 4, '#4a3a1a');
  ctx.fillStyle = '#fff'; ctx.font = `800 ${Math.round(Math.max(9, 10 * L.s))}px ${NU}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('BIN', x + w / 2, y + h / 2);
}
function dogPic(D, L, now) { const x = L.X(D.x), y = L.Y(D.y), s = 0.35 * L.sc; ctx.save(); ctx.translate(x, y); ctx.rotate(D.h); ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(2, 3, s * 1.6, s * 0.8, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#a0683a'; ctx.beginPath(); ctx.ellipse(0, 0, s * 1.4, s * 0.7, 0, 0, TAU); ctx.fill(); circ(s * 1.4, 0, s * 0.6, '#b07848'); circ(s * 1.6, -s * 0.45, s * 0.25, '#5a3a1a'); circ(s * 1.6, s * 0.45, s * 0.25, '#5a3a1a'); circ(s * 2, 0, s * 0.15, '#1a1a1a');
  ctx.strokeStyle = '#a0683a'; ctx.lineWidth = s * 0.3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-s * 1.3, 0); ctx.lineTo(-s * 2, Math.sin(now * 14) * s * 0.6); ctx.stroke(); ctx.restore(); }
function mower(G, L, now) { const m = G.m, x = L.X(m.x), y = L.Y(m.y), s = L.sc; ctx.save(); ctx.translate(x, y); ctx.rotate(m.h); const v = m.v > 0.2 ? Math.sin(now * 60) * 0.6 : 0; ctx.translate(v * 0.3, 0);
  ctx.fillStyle = 'rgba(0,0,0,.25)'; rrect(-0.55 * s + 3, -0.5 * s + 4, 1.1 * s, 1.0 * s, 0.2 * s); ctx.fill();
  // the grass box behind, filling with the bag
  const bf = clamp(G.bag / G.bagMax, 0, 1); fillR(-0.95 * s, -0.36 * s, 0.42 * s, 0.72 * s, 0.08 * s, '#3a3a40'); fillR(-0.93 * s, -0.34 * s + 0.68 * s * (1 - bf), 0.38 * s, 0.68 * s * bf, 0.06 * s, bf >= 1 ? '#c8a040' : '#7ac050');
  ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 0.05 * s; ctx.beginPath(); ctx.moveTo(-0.55 * s, -0.3 * s); ctx.lineTo(-1.2 * s, -0.35 * s); ctx.lineTo(-1.2 * s, 0.35 * s); ctx.lineTo(-0.55 * s, 0.3 * s); ctx.stroke();
  for (const [wx, wy] of [[0.35, -0.48], [0.35, 0.48], [-0.38, -0.5], [-0.38, 0.5]]) fillR(wx * s - 0.1 * s, wy * s - 0.06 * s, 0.2 * s, 0.12 * s, 0.03 * s, '#1a1a1e');
  fillR(-0.5 * s, -0.45 * s, 1.0 * s, 0.9 * s, 0.22 * s, '#e03a32'); fillR(-0.42 * s, -0.37 * s, 0.84 * s, 0.74 * s, 0.18 * s, '#f0503e'); circ(0.05 * s, 0, 0.22 * s, '#2a2a30'); circ(0.05 * s, 0, 0.1 * s, '#8a96a2'); fillR(0.22 * s, -0.08 * s, 0.18 * s, 0.16 * s, 0.03 * s, '#ffd23a');
  ctx.restore(); }
// ---------- moment to moment ----------
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 2);
  for (const p of PT) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 1 - dt * 3; p.vy *= 1 - dt * 3; } for (let i = PT.length - 1; i >= 0; i--) if (PT[i].t > PT[i].life) PT.splice(i, 1); if (PT.length > 300) PT.splice(0, PT.length - 300);
  for (const t of TXT) { t.t += dt; t.y -= dt * 20; } while (TXT.length && TXT[0].t > 1.5) TXT.shift(); if (hint) { hint.t += dt; if (hint.t > hint.secs) hint = null; } }
function draw(now) { ctx.setTransform(DPR, 0, 0, DPR, 0, 0); const g = G, L = lay(g), s = L.s;
  // the garden round the lawn: a hedge, a path
  ctx.fillStyle = '#2a4a26'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#c8b898'; ctx.fillRect(0, H - 60 * s, W, 60 * s); ctx.fillStyle = 'rgba(0,0,0,.08)'; for (let i = 0; i < W; i += 26 * s) ctx.fillRect(i, H - 60 * s, 2, 60 * s);
  if (!g) return;
  ctx.save(); if (FX.shake > 0) ctx.translate((Math.random() - 0.5) * FX.shake, (Math.random() - 0.5) * FX.shake);
  // what does not move is painted once into two layers (under the cut grass, and the beds and bin over it), redrawn only when it changes
  lawnPics(g, L); const lk = [LAWN.key, W, H, DPR].join(':'), tk = lk + ':' + g.obst.filter(b => b.kind === 'bed').map(b => b.crushed ? 1 : 0).join('') + (g.bag >= g.bagMax ? 'F' : '');
  if (LAWN.lk !== lk) { LAWN.lk = lk; LAWN.base = layer(o => { ctx.fillStyle = '#2a4a26'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#c8b898'; ctx.fillRect(0, H - 60 * s, W, 60 * s); ctx.fillStyle = 'rgba(0,0,0,.08)'; for (let i = 0; i < W; i += 26 * s) ctx.fillRect(i, H - 60 * s, 2, 60 * s);
      fillR(L.lx - 10, L.ly - 10, L.lw + 20, L.lh + 20, 14, '#3a6a2a'); for (let i = 0; i < 60; i++) { const a = i / 60; circ(L.lx - 6 + a * (L.lw + 12), L.ly - 8, 7, '#2e5e22'); circ(L.lx - 6 + a * (L.lw + 12), L.ly + L.lh + 8, 7, '#2e5e22'); } ctx.drawImage(LAWN.c, L.lx, L.ly, L.lw, L.lh); });
    LAWN.trees = layer(() => { for (const b of g.obst) if (b.kind === 'tree') tree(b, L, 0); }); }
  if (LAWN.tk !== tk) { LAWN.tk = tk; LAWN.top = layer(() => { for (const b of g.obst) if (b.kind === 'bed') drawBed(b, L, 0); binPic(g.bin, L, g); }); }
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(LAWN.base, 0, 0); ctx.setTransform(DPR, 0, 0, DPR, 0, 0); if (FX.shake > 0) ctx.translate((Math.random() - 0.5) * FX.shake, 0);
  ctx.imageSmoothingEnabled = true; ctx.drawImage(LAWN.cx, L.lx, L.ly, L.lw, L.lh);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(LAWN.top, 0, 0); ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  // glints in the long grass: coins and the treasure
  for (const cn of g.coins) if (!cn.got && Math.sin(now * 3 + cn.x * 5) > 0.7) { const x = L.X(cn.x), y = L.Y(cn.y); ctx.fillStyle = 'rgba(255,230,120,.9)'; ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.lineTo(x + 1.5, y - 1.5); ctx.lineTo(x + 4, y); ctx.lineTo(x + 1.5, y + 1.5); ctx.lineTo(x, y + 4); ctx.lineTo(x - 1.5, y + 1.5); ctx.lineTo(x - 4, y); ctx.lineTo(x - 1.5, y - 1.5); ctx.fill(); }
  if (g.treasure && !g.treasure.got && Math.sin(now * 2) > 0.3) { const x = L.X(g.treasure.x), y = L.Y(g.treasure.y); ctx.fillStyle = 'rgba(200,240,255,.95)'; ctx.font = `${Math.round(12 * s)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('✨', x, y); }
  for (const b of g.obst) if (b.kind === 'gnome') gnome(b, L);
  if (g.bag >= g.bagMax) { const p = 0.5 + 0.5 * Math.sin(g.t * 6); ctx.strokeStyle = `rgba(255,220,80,${p})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(L.X(g.bin.x), L.Y(g.bin.y), 2.2 * L.sc, 0, TAU); ctx.stroke(); }
  for (const p of PT) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.fillRect(p.x, p.y, p.r, p.r * 0.5); } ctx.globalAlpha = 1;
  mower(g, L, now); if (g.dog) dogPic(g.dog, L, now);
  ctx.restore(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(LAWN.trees, 0, 0); ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  hud(g, L, now);
  // your thumb
  if (ui.stick) { const st = ui.stick, R2 = 50 * s; ctx.globalAlpha = 0.5; circ(st.x0, st.y0, R2, 'rgba(255,255,255,.15)'); ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(st.x0, st.y0, R2, 0, TAU); ctx.stroke(); const dx = st.x - st.x0, dy = st.y - st.y0, d = Math.hypot(dx, dy), k2 = Math.min(1, R2 / Math.max(1, d)); circ(st.x0 + dx * k2, st.y0 + dy * k2, 20 * s, '#fff'); ctx.globalAlpha = 1; }
  else if ((G && G.lesson) && g.N <= 1 && g.t < 6 && !g.over) { ctx.globalAlpha = 0.6 + 0.4 * Math.sin(now * 4); ctx.fillStyle = '#fff'; ctx.font = `${Math.round(14 * s)}px ${TF}`; ctx.textAlign = 'center'; ctx.fillText('SLIDE YOUR THUMB TO DRIVE', W / 2, H - 30 * s); ctx.globalAlpha = 1; }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; for (const q of TXT) { const a = q.t < 1.1 ? 1 : 1 - (q.t - 1.1) / 0.4; ctx.globalAlpha = Math.max(0, a); ctx.font = `${Math.round(q.size * s)}px ${TF}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(20,40,16,.75)'; ctx.strokeText(q.txt, q.x, q.y); ctx.fillStyle = q.col; ctx.fillText(q.txt, q.x, q.y); } ctx.globalAlpha = 1;
  if (hint) { const a = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, a); ctx.font = `700 ${Math.round(14 * s)}px ${BC}`; const lines = wrapText(hint.txt, W - 50), lh = 17 * s, hh = lines.length * lh + 14, ww = W - 30, hy = H - 90 * s - hh / 2;
    fillR(W / 2 - ww / 2, hy - hh / 2, ww, hh, 12, 'rgba(20,40,16,.94)'); ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 1.5; rrect(W / 2 - ww / 2, hy - hh / 2, ww, hh, 12); ctx.stroke(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, hy - hh / 2 + 7 + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,60,60,${FX.red * 0.18})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,255,240,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); } }
// ---------- the top bar ----------
function bar(x, y, w, h, p, col, mark) { fillR(x, y, w, h, h / 2, 'rgba(255,255,255,.15)'); fillR(x, y, Math.max(h, w * clamp(p, 0, 1)), h, h / 2, col); if (mark != null) fillR(x + w * mark - 1, y - 3, 2, h + 6, 1, '#fff'); }
function hud(G, L, now) { const s = L.s; fillR(0, 0, W, L.top - 10 * s, 0, 'rgba(16,36,14,.85)'); ctx.textBaseline = 'middle';
  if (G.lesson) { lessonPanel(G, L); return; }
  const share = cutShare(G), need = G.cfg.need, ok = share >= need;
  ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.font = `700 ${Math.round(11 * s)}px ${BC}`; ctx.fillText(`LEVEL ${G.N} · ${PLACES[G.place].name.toUpperCase()} · ${G.owner.toUpperCase()}'S LAWN`, 12, 48 * s);
  ctx.fillStyle = ok ? '#a8f08a' : '#fff'; ctx.font = `${Math.round(18 * s)}px ${TF}`; ctx.fillText(`${Math.floor(share * 100)}%`, 12, 72 * s); ctx.font = `700 ${Math.round(11 * s)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.65)'; ctx.fillText(`cut · need ${Math.round(need * 100)}%`, 64 * s, 66 * s);
  bar(64 * s, 74 * s, W * 0.42, 7 * s, share, ok ? '#7be08a' : '#ffd23a', need);
  const rx = W - 12 - 104 * s; ctx.fillStyle = G.fuel < G.fuelMax * 0.2 ? (Math.sin(now * 8) > 0 ? '#ff8a7a' : '#fff') : '#fff'; ctx.font = `700 ${Math.round(11 * s)}px ${BC}`; ctx.fillText('⛽ FUEL', rx, 50 * s); bar(rx + 46 * s, 46 * s, 58 * s, 7 * s, G.fuel / G.fuelMax, G.fuel < G.fuelMax * 0.2 ? '#ff6a5a' : '#ffb21e');
  const full = G.bag >= G.bagMax; ctx.fillStyle = full ? (Math.sin(now * 8) > 0 ? '#ffd23a' : '#fff') : '#fff'; ctx.fillText(full ? '🧺 FULL!' : '🧺 BAG', rx, 70 * s); bar(rx + 46 * s, 66 * s, 58 * s, 7 * s, G.bag / G.bagMax, full ? '#ff6a5a' : '#7ac050');
  ctx.textAlign = 'right'; ctx.fillStyle = '#ffd23a'; ctx.fillText(`STRIPES ${G.stripes}`, W - 12, 86 * s);
  if (ok && !G.over && G.wait <= 0) { const r = doneRect(L), p = 0.9 + 0.1 * Math.sin(now * 5); fillR(r.x, r.y, r.w, r.h, r.h / 2, `rgba(123,224,138,${p})`); ctx.fillStyle = '#123a1a'; ctx.font = `${Math.round(16 * s)}px ${TF}`; ctx.textAlign = 'center'; ctx.fillText('DONE ✓', r.x + r.w / 2, r.y + r.h / 2 + 1); } }
function lessonPanel(G, L) { coachPanel(G); }
// ---------- what each happening looks and sounds like ----------
function onEvent(G, e) { const L = lay(G), s = L.s;
  switch (e.k) {
    case 'start': say(`${G.owner.toUpperCase()}'S LAWN`, W / 2, L.ly + L.lh * 0.3, '#fff', 22); say(`cut ${Math.round(G.cfg.need * 100)}% · mind the flowers`, W / 2, L.ly + L.lh * 0.3 + 30 * s, '#ffe9a0', 14); sfx.start(); LAWN.dirty = true; if (G.N <= 1) tip('how', 'Slide your thumb anywhere to drive. Mow up and down in straight lines for stripes.', 3.4); break;
    case 'cut': { LAWN.dirty = true; sfx.cut(); const m = G.m, x = L.X(m.x), y = L.Y(m.y); if (Math.random() < 0.6) { const a = m.h + Math.PI / 2 * (Math.random() < 0.5 ? 1 : -1) + (Math.random() - 0.5) * 0.6, v = 60 + Math.random() * 80; PT.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: 0.5, col: ['#7ac050', '#9ad870', '#5aa040'][(Math.random() * 3) | 0], r: 3 + Math.random() * 2 }); } break; }
    case 'stripe': sfx.stripe(e.n); say('STRIPE!', L.X(G.m.x), L.Y(G.m.y) - 24 * s, '#ffd23a', 15); vibe(HAP.tick); break;
    case 'bagfull': sfx.full(); tip('bag', 'The grass box is full! Drive to the compost BIN to empty it.', 3); say('BAG FULL!', W / 2, L.top + 40 * s, '#ffd23a', 20); break;
    case 'emptied': sfx.empty(); say('EMPTIED', L.X(G.bin.x), L.Y(G.bin.y) + 30 * s, '#a8f08a', 14); vibe(HAP.light); break;
    case 'clump': break;
    case 'crush': sfx.crush(); FX.red = 0.8; FX.shake = 5; say(e.n >= 3 ? 'THE FLOWERS!!' : `FLOWERS! (${e.n}/3)`, W / 2, L.ly + L.lh * 0.45, '#ff8a7a', 22); tip('flowers', 'Not the flowers! Three beds and the owner sends you home.', 3); break;
    case 'sent': say(`${G.owner} sends you home`, W / 2, L.ly + L.lh * 0.5, '#ffb4a8', 16); break;
    case 'fence': case 'bump': sfx.bump(); FX.shake = 4; break;
    case 'gnome': sfx.gnome(); break;
    case 'woof': sfx.woof(); say('WOOF!', L.X(G.dog.x), L.Y(G.dog.y) - 16 * s, '#fff', 14); break;
    case 'coin': sfx.coin(G.coinsGot); say('+🪙', L.X(e.x), L.Y(e.y) - 14 * s, '#ffd23a', 14); break;
    case 'treasure': sfx.treasure(); FX.flash = 0.4; say(`Found ${e.what}!`, W / 2, L.ly + L.lh * 0.4, '#bfe9ff', 16); vibe(HAP.sharp); break;
    case 'goal': sfx.goal(); say('ENOUGH CUT!', W / 2, L.top + 40 * s, '#a8f08a', 20); tip('done', 'Tap DONE when you are happy, or keep going for a perfect lawn.', 3); break;
    case 'all': say('EVERY BLADE!', W / 2, L.ly + L.lh * 0.4, '#a8f08a', 26); FX.flash = 0.5; sfx.win(); break;
    case 'done': sfx.click(); break;
    case 'empty': say('OUT OF FUEL', W / 2, L.ly + L.lh * 0.45, '#ffb4a8', 22); sfx.sputter(); break;
    case 'lessonmiss': coachMiss(); break;
    case 'lessonnext': if (e.first) hint = null; break;
    case 'lessondone': say('YOU\'VE GOT IT!', W / 2, L.ly + L.lh * 0.4, '#ffd23a', 26); sfx.goal(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); break;
    case 'lost': sfx.lose(); break;
  } }
