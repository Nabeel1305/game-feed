// ===================== DRAW + JUICE: side-on, the bike big and the ground ahead readable (2D on purpose) =====================
// A side-on run: sky with the place's light, two layers of far hills sliding slower, the ground with its bright lip, the ramps'
// edges striped, flags at the checkpoints and the chequered finish. The bike: two spoked wheels, a frame, the rider leaning with
// your thumbs. In the air a dotted arc shows where you will come down, and the slope there; a halo turns green when the bike's
// angle matches it. Your best run rides as a pale ghost. Dust on landing, sparks and a SNAP on a crash, a streak on a boost.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, PT = [], TXT = [];
let hint = null, camX = 0, camY = 0, ghost = null;
function sparks(x, y, n, col, sp = 220) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random()); PT.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.5 + Math.random() * 0.4, t: 0, col, r: 2 + Math.random() * 2.5 }); } }
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
const S1 = () => Math.min(W, H * 0.6) / 390;
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of String(t).split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { const D = G.lesson, st = D.steps[D.i], s = S1(), x = 10, w = W - 20, y = 42 * s; ctx.save(); ctx.font = `700 ${Math.round(12.5 * s)}px ${BC}`; const lines = wrapText(st.how, w - 24), h = 40 * s + lines.length * 16 * s;
  ctx.fillStyle = 'rgba(16,10,4,.9)'; rrect(x, y, w, h, 12); ctx.fill(); ctx.strokeStyle = 'rgba(255,211,106,.7)'; ctx.lineWidth = 2; rrect(x, y, w, h, 12); ctx.stroke();
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#ffd36a'; ctx.font = `700 ${Math.round(14 * s)}px ${BC}`; ctx.fillText(`LESSON: ${st.title} · ${D.n} OF ${st.need}`, x + 12, y + 8 * s);
  ctx.font = `700 ${Math.round(12.5 * s)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.9)'; lines.forEach((l, i) => ctx.fillText(l, x + 12, y + 28 * s + i * 16 * s)); ctx.restore(); }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 40); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 2);
  for (const p of PT) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 420 * dt; } for (let i = PT.length - 1; i >= 0; i--) if (PT[i].t > PT[i].life) PT.splice(i, 1);
  for (const t of TXT) { t.t += dt; t.y -= dt * 20; } while (TXT.length && TXT[0].t > 1.5) TXT.shift(); if (hint) { hint.t += dt; if (hint.t > hint.secs) hint = null; } }
const PPM = () => Math.min(W, H * 0.62) / 390 * 20;      // pixels per metre
const toS = (x, y) => ({ x: (x - camX) * PPM() + W * 0.32, y: H * 0.5 - (y - camY) * PPM() });
function lay() { const s = S1(); return { s, left: { x: 0, y: H * 0.62, w: W / 2, h: H * 0.38 }, right: { x: W / 2, y: H * 0.62, w: W / 2, h: H * 0.38 } }; }
function drawBike(x, y, a, s, lean, alpha = 1, col = '#ff3a2a') { const c = ctx, m = PPM(); c.save(); c.globalAlpha = alpha; c.translate(x, y); c.rotate(-a); const r = 0.42 * m, wb = 0.78 * m;
  for (const wx of [-wb, wb]) { c.strokeStyle = '#111'; c.lineWidth = 0.14 * m; c.beginPath(); c.arc(wx, -r, r, 0, TAU); c.stroke(); c.strokeStyle = 'rgba(200,200,200,.7)'; c.lineWidth = 1; for (let i = 0; i < 4; i++) { const q = i * Math.PI / 4 + x * 0.05; c.beginPath(); c.moveTo(wx + Math.cos(q) * r * 0.85, -r + Math.sin(q) * r * 0.85); c.lineTo(wx - Math.cos(q) * r * 0.85, -r - Math.sin(q) * r * 0.85); c.stroke(); } }
  c.strokeStyle = col; c.lineWidth = 0.16 * m; c.lineJoin = 'round'; c.beginPath(); c.moveTo(-wb, -r); c.lineTo(-0.1 * m, -r * 2.1); c.lineTo(wb * 0.75, -r * 2.5); c.lineTo(wb, -r); c.moveTo(-0.1 * m, -r * 2.1); c.lineTo(0.15 * m, -r * 1.1); c.lineTo(-wb, -r); c.stroke();
  c.fillStyle = '#222'; c.fillRect(-0.45 * m, -r * 2.4, 0.5 * m, 0.12 * m);
  // the rider: leans with your thumbs
  const lx = lean === 1 ? -0.25 : lean === -1 ? 0.3 : 0; c.strokeStyle = '#1a2a4a'; c.lineWidth = 0.17 * m; c.lineCap = 'round'; c.beginPath(); c.moveTo(-0.15 * m, -r * 2.5); c.lineTo((-0.05 + lx) * m, -r * 4.0); c.lineTo(wb * 0.7, -r * 2.7); c.stroke();
  c.beginPath(); c.moveTo(-0.15 * m, -r * 2.5); c.lineTo(0.2 * m, -r * 1.5); c.stroke();
  c.fillStyle = col; c.beginPath(); c.arc((-0.02 + lx) * m, -r * 4.6, 0.26 * m, 0, TAU); c.fill(); c.fillStyle = '#9ad0ff'; c.fillRect((0.05 + lx) * m, -r * 4.75, 0.2 * m, 0.1 * m);
  c.restore(); }
function draw(now) { ctx.setTransform(DPR, 0, 0, DPR, 0, 0); const g = G, s = S1(), P = PLACES[g ? g.place : 0], m = PPM();
  const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, P.sky[0]); sky.addColorStop(1, P.sky[1]); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  if (!g) return; const b = g.b;
  camX += (b.x + b.vx * 0.25 - camX) * 0.15; camY += (b.y - camY) * 0.08;
  // the sun (or moon) and slow clouds
  { const sx = W * 0.78, sy = H * 0.16; const sg = ctx.createRadialGradient(sx, sy, 4, sx, sy, 70 * s); sg.addColorStop(0, 'rgba(255,255,230,.95)'); sg.addColorStop(0.3, 'rgba(255,240,200,.5)'); sg.addColorStop(1, 'rgba(255,240,200,0)'); ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(sx, sy, 70 * s, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 5; i++) { const cx = ((i * 230 - camX * m * 0.05) % (W + 200) + W + 200) % (W + 200) - 100, cy = H * (0.1 + (i % 3) * 0.07); for (const [dx, r] of [[0, 22], [24, 28], [52, 20]]) { ctx.beginPath(); ctx.arc(cx + dx * s, cy, r * s, 0, TAU); ctx.fill(); } } }
  // far hills, slower
  for (const [k2, a, hgt] of [[0.15, 0.35, 0.3], [0.35, 0.6, 0.2]]) { ctx.fillStyle = P.hills; ctx.globalAlpha = a; ctx.beginPath(); ctx.moveTo(0, H); for (let px = 0; px <= W + 8; px += 8) { const wx = (px + camX * m * k2) / 90; ctx.lineTo(px, H * (0.3 + hgt * 0.5) - (Math.sin(wx) * 0.5 + Math.sin(wx * 2.3) * 0.3 + 0.8) * H * hgt * 0.5 + camY * m * k2 * 0.3); } ctx.lineTo(W, H); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.save(); if (FX.shake > 0) ctx.translate((Math.random() - 0.5) * FX.shake, (Math.random() - 0.5) * FX.shake);
  // the ground
  const x0 = camX - W * 0.32 / m - 2, x1 = camX + W * 0.7 / m + 2; ctx.beginPath(); ctx.moveTo(toS(x0, -100).x, H + 10);
  for (let x = Math.max(0, x0); x <= x1; x += DX) { const p = toS(x, groundY(g, x)); ctx.lineTo(p.x, p.y); } ctx.lineTo(toS(x1, 0).x, H + 10); ctx.closePath(); ctx.fillStyle = P.ground; ctx.fill();
  ctx.strokeStyle = P.top; ctx.lineWidth = 5; ctx.beginPath(); for (let x = Math.max(0, x0); x <= x1; x += DX) { const p = toS(x, groundY(g, x)); if (x === Math.max(0, x0)) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); } ctx.stroke();
  // flags and the finish
  for (const f of g.track.flags) { if (f < x0 || f > x1 || f === 0) continue; const p = toS(f, groundY(g, f)); ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y - 2.2 * m); ctx.stroke(); ctx.fillStyle = f <= b.lastFlag ? '#4ad06a' : '#ffd020'; ctx.beginPath(); ctx.moveTo(p.x, p.y - 2.2 * m); ctx.lineTo(p.x + 0.9 * m, p.y - 1.9 * m); ctx.lineTo(p.x, p.y - 1.6 * m); ctx.fill(); }
  { const e = g.track.end; if (e > x0 && e < x1) { const p = toS(e, groundY(g, e)); for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) { ctx.fillStyle = (i + j) % 2 ? '#111' : '#fff'; ctx.fillRect(p.x - 0.3 * m + j * 0.3 * m, p.y - 4 * m + i * 0.5 * m, 0.3 * m, 0.5 * m); } } }
  // the ghost of your best
  if (ghost && !g.lesson) { const i = Math.min(ghost.length - 1, Math.floor(g.clock * 10)); if (i >= 0) { const q = ghost[i], p = toS(q[0], q[1]); drawBike(p.x, p.y, q[2], s, 0, 0.3, '#ffffff'); } }
  // in the air: where you will land, and whether the bike matches it
  if (b.air && g.wait <= 0) { let x = b.x, y = b.y, vx = b.vx, vy = b.vy; ctx.fillStyle = 'rgba(255,255,255,.7)'; for (let t = 0; t < 3; t += 1 / 30) { vy -= GRAV / 30; x += vx / 30; y += vy / 30; if (y <= groundY(g, x)) break; if (((t * 30) | 0) % 3 === 0) { const p = toS(x, y); ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, TAU); ctx.fill(); } }
    const th = slopeAt(g, x), p = toS(x, groundY(g, x)), d = Math.abs(wrap(b.a - th)), okc = d < g.cfg.tol * 0.6 ? '#4aff8a' : d < g.cfg.tol ? '#ffd020' : '#ff5a4a'; ctx.strokeStyle = okc; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(p.x - Math.cos(th) * 1.4 * m, p.y + Math.sin(th) * 1.4 * m); ctx.lineTo(p.x + Math.cos(th) * 1.4 * m, p.y - Math.sin(th) * 1.4 * m); ctx.stroke();
    const bp = toS(b.x, b.y); ctx.strokeStyle = okc; ctx.globalAlpha = 0.5; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(bp.x, bp.y - 0.8 * m, 1.6 * m, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; }
  // the bike
  if (!(g.wait > 0 && g.crashed)) { const p = toS(b.x, b.y), L = leanNow(g); if (b.boost > 0) { for (let i = 1; i < 6; i++) { ctx.fillStyle = `rgba(255,${150 + i * 15},40,${0.35 - i * 0.05})`; ctx.beginPath(); ctx.arc(p.x - i * 0.5 * m * Math.cos(b.a), p.y - 0.5 * m + i * 0.5 * m * Math.sin(b.a), (0.5 - i * 0.06) * m, 0, TAU); ctx.fill(); } } drawBike(p.x, p.y, b.a, s, L === 'brake' ? 0 : L); }
  for (const p of PT) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1; ctx.restore();
  hud(g, s);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; for (const q of TXT) { const a = q.t < 1.1 ? 1 : 1 - (q.t - 1.1) / 0.4; ctx.globalAlpha = Math.max(0, a); ctx.font = `${Math.round(q.size * s)}px ${TF}`; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.strokeText(q.txt, q.x, q.y); ctx.fillStyle = q.col; ctx.fillText(q.txt, q.x, q.y); } ctx.globalAlpha = 1;
  if (hint) { const a = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, a); ctx.font = `700 ${Math.round(14 * s)}px ${BC}`; const lines = wrapText(hint.txt, W - 50), lh = 17 * s, hh = lines.length * lh + 14, ww = W - 30;
    ctx.fillStyle = 'rgba(10,16,24,.9)'; rrect(W / 2 - ww / 2, H * 0.3 - hh / 2, ww, hh, 10); ctx.fill(); ctx.fillStyle = '#ffe3a0'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.3 - hh / 2 + 7 + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,60,40,${FX.red * 0.25})`; ctx.fillRect(0, 0, W, H); } if (FX.flash > 0) { ctx.fillStyle = `rgba(255,250,220,${FX.flash * 0.35})`; ctx.fillRect(0, 0, W, H); } }
// the top: the clock against the time to beat, the track as a line with you (and your ghost) on it; the bottom: the two thumbs
function hud(G, s) { const c = G.cfg, L = leanNow(G);
  // the two thumb pads
  for (const [side, on, lab] of [['l', G.hold.l || G.tl > 0, '⟲ LEAN BACK'], ['r', G.hold.r || G.tr > 0, 'LEAN FWD ⟳']]) { const x = side === 'l' ? 14 : W / 2 + 7, w = W / 2 - 21, y = H - 74 * s, h = 58 * s;
    ctx.fillStyle = on ? 'rgba(255,176,32,.55)' : 'rgba(0,0,0,.22)'; rrect(x, y, w, h, 16); ctx.fill(); ctx.fillStyle = on ? '#fff' : 'rgba(255,255,255,.75)'; ctx.font = `${Math.round(13 * s)}px ${TF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(lab, x + w / 2, y + h / 2); }
  if (G.lesson) { lessonPanel(G); return; }
  const y = 44 * s; ctx.fillStyle = 'rgba(0,0,0,.45)'; rrect(8, y, W - 16, 44 * s, 10); ctx.fill();
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.font = `${Math.round(17 * s)}px ${TF}`; ctx.fillStyle = G.clock > c.par ? '#ff8a7a' : G.clock > c.par * 0.85 ? '#ffd020' : '#fff'; ctx.fillText(G.clock.toFixed(1), 18, y + 15 * s);
  ctx.font = `700 ${Math.round(11 * s)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillText(`BEAT ${c.par}s · ★★ ${(c.par * 0.9).toFixed(0)} · ★★★ ${(c.par * 0.8).toFixed(0)}`, 18, y + 33 * s);
  ctx.textAlign = 'right'; ctx.fillStyle = '#ffd020'; ctx.font = `${Math.round(13 * s)}px ${TF}`; ctx.fillText(`FLIPS ${G.flips}`, W - 18, y + 15 * s); ctx.font = `700 ${Math.round(11 * s)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillText(`${G.crashes} crash${G.crashes === 1 ? '' : 'es'}`, W - 18, y + 33 * s);
  // the track line
  const tx = 18, tw = W - 36, ty = y + 52 * s, u = clamp(G.b.x / G.track.end, 0, 1); ctx.fillStyle = 'rgba(0,0,0,.3)'; rrect(tx, ty, tw, 6, 3); ctx.fill(); ctx.fillStyle = '#ffb020'; rrect(tx, ty, Math.max(6, tw * u), 6, 3); ctx.fill();
  for (const f of G.track.flags) if (f > 0) { ctx.fillStyle = f <= G.b.lastFlag ? '#4ad06a' : 'rgba(255,255,255,.6)'; ctx.fillRect(tx + tw * f / G.track.end - 1, ty - 3, 2, 12); }
  if (ghost) { const i = Math.min(ghost.length - 1, Math.floor(G.clock * 10)); if (i >= 0) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(tx + tw * clamp(ghost[i][0] / G.track.end, 0, 1), ty + 3, 4, 0, TAU); ctx.fill(); } } }
// how the game reacts
function onEvent(G, e) { const s = S1(), b = G.b, p = toS(b.x, b.y);
  switch (e.k) {
    case 'start': say(PLACES[G.place].name.toUpperCase(), W / 2, H * 0.24, '#fff', 18); say(`BEAT ${G.cfg.par}s`, W / 2, H * 0.29, '#ffd020', 26); sfx.go(); if (G.N <= 2) tip('lean', 'Hold the RIGHT side in the air to tip the nose down, the LEFT to lift it. Land along the slope.', 3.6); break;
    case 'air': sfx.whoosh(); break;
    case 'land': { const m = PPM(); for (let i = 0; i < (e.perfect ? 16 : 8); i++) PT.push({ x: p.x + (Math.random() - 0.5) * m, y: p.y, vx: (Math.random() - 0.5) * 160, vy: -Math.random() * 160, life: 0.5, t: 0, col: 'rgba(220,200,170,.8)', r: 2 + Math.random() * 3 });
      FX.shake = Math.min(8, 2 + e.air * 4); sfx.land(e.air);
      if (e.flips) { say(`${e.flips > 1 ? e.flips + '× ' : ''}${e.back ? 'BACKFLIP' : 'FRONTFLIP'}!`, p.x, p.y - 3.6 * m, '#ffd020', 26); sfx.flip(e.flips); FX.flash = 0.3; vibe(HAP.light); }
      if (e.perfect) { say('PERFECT', p.x, p.y - (e.flips ? 5.2 : 3.6) * m, '#4aff8a', 20); sfx.perfect(); } break; }
    case 'crash': { FX.shake = 14; FX.red = 0.6; sfx.crash(); vibe(HAP.best); G.crashed = true; setTimeout(() => { if (G) G.crashed = false; }, 1100); for (let i = 0; i < 24; i++) { const a = Math.random() * TAU; PT.push({ x: p.x, y: p.y - 10, vx: Math.cos(a) * 240, vy: Math.sin(a) * 240 - 100, life: 0.8, t: 0, col: i % 3 ? '#ff3a2a' : '#222', r: 2 + Math.random() * 3 }); } say('CRASH!', W / 2, H * 0.36, '#ff8a7a', 30); break; }
    case 'flag': sfx.flag(); say('CHECKPOINT', p.x, p.y - 4 * PPM(), '#4ad06a', 16); break;
    case 'lessonnext': if (e.first) hint = null; say('FIRST, A LESSON', W / 2, H * 0.3, '#ffd020', 22); sfx.go(); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, W / 2, H * 0.3, '#9be3b5', 24); sfx.perfect(); break;
    case 'lessonmiss': say('TRY AGAIN', W / 2, H * 0.3, '#ffd0c4', 22); hint = { txt: e.how, t: 0, secs: 3.4 }; break;
    case 'lessondone': say('YOU CAN RIDE!', W / 2, H * 0.3, '#ffd020', 26); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': FX.flash = 0.7; sfx.win(); vibe(HAP.best); break;
    case 'lost': sfx.lose(); break;
  } }
function area() { return { x: 0, y: 0, w: W, h: H }; }
