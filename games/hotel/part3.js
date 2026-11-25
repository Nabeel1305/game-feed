// ===================== DRAW + JUICE: the hotel as a doll's house (2D on purpose: every room, bubble and ring must read at once) =====================
// A cutaway of the hotel at dusk: the lobby at the bottom (the front desk with its bell, the kitchen with a steaming pot, the
// laundry with a turning drum), floors of rooms above (beds, lamps that glow when someone is in, mess when a room is dirty),
// the lift up the left side with its cabin. Requests are round bubbles above the place, their ring emptying green to red;
// a gold edge for a VIP; the number of a job you have taken. You are the little attendant in the red jacket and pillbox hat,
// carrying what you hold. Along the bottom: the stops you have lined up (three at most) and what is in your hands.
// (25 Nov 2026: you send him yourself now; a room that would take what you carry glows green, a stop lined up wears its number.)
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, PT = [], TXT = [];
let hint = null, bgC = null;
function sparks(x, y, n, col, sp = 220) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random()); PT.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.5 + Math.random() * 0.4, t: 0, col, r: 2 + Math.random() * 2.5 }); } }
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS || !(G && G.lesson)) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
const S1 = () => Math.min(W, H * 0.6) / 390;
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of String(t).split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { coachPanel(G); }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 40); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 2);
  for (const p of PT) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 420 * dt; } for (let i = PT.length - 1; i >= 0; i--) if (PT[i].t > PT[i].life) PT.splice(i, 1);
  for (const t of TXT) { t.t += dt; t.y -= dt * 22; } while (TXT.length && TXT[0].t > 1.5) TXT.shift(); if (hint) { hint.t += dt; if (hint.t > hint.secs) hint = null; } }
// where everything is: the building between the HUD and the job bar
function lay() { const s = S1(), top = 84 * s, bot = H - 96 * s, n = (G ? G.cfg.floors : 3) + 1, fh = (bot - top) / n, mx = 10;
  return { s, top, bot, fh, n, mx, bw: W - mx * 2, sx: x => mx + x * (W - mx * 2), fy: f => bot - f * fh, chips: [0, 1, 2].map(i => ({ x: 10 + i * (W * 0.62 - 10) / 3, y: H - 82 * s, w: (W * 0.62 - 10) / 3 - 6, h: 60 * s })), hands: { x: W * 0.64, y: H - 82 * s, w: W * 0.36 - 10, h: 60 * s } }; }
const bubXY = (q, L) => ({ x: L.sx(q.x), y: L.fy(q.f) - L.fh * 0.78 });
function hotelBg(L) { const w = Math.round(W * DPR), h = Math.round(H * DPR), key = w + 'x' + h + 'x' + L.n; if (bgC && bgC.key === key) return bgC; bgC = document.createElement('canvas'); bgC.key = key; bgC.width = w; bgC.height = h; const g = bgC.getContext('2d'); g.scale(DPR, DPR);
  const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#1a1440'); sky.addColorStop(0.5, '#4a2a5a'); sky.addColorStop(1, '#2a1a28'); g.fillStyle = sky; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,255,255,${0.2 + (i % 5) * 0.12})`; g.fillRect((i * 97) % W, (i * 53) % (L.top * 0.9), 1.5, 1.5); }
  // the building
  g.fillStyle = '#6a2a2a'; g.fillRect(L.mx - 4, L.top - 14, L.bw + 8, L.bot - L.top + 18); g.fillStyle = '#8a3a30'; g.fillRect(L.mx - 8, L.top - 22, L.bw + 16, 10);
  for (let f = 0; f < L.n; f++) { const y0 = L.fy(f + 1), y1 = L.fy(f), wall = g.createLinearGradient(0, y0, 0, y1);
    wall.addColorStop(0, f === 0 ? '#e8d2a8' : '#d8c4a0'); wall.addColorStop(1, f === 0 ? '#c8a878' : '#b8a07a'); g.fillStyle = wall; g.fillRect(L.mx, y0 + 4, L.bw, y1 - y0 - 4);
    g.fillStyle = '#4a2a1a'; g.fillRect(L.mx, y1 - 5, L.bw, 6); g.fillStyle = f === 0 ? '#8a2a2a' : '#6a4a6a'; g.fillRect(L.mx, y1 - 9, L.bw, 4);      // floor and carpet
    if (f > 0) COLS.forEach((x, i) => { const cx = L.sx(x), rw = L.bw * 0.2, rh = L.fh * 0.62; g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(cx - rw / 2, y1 - 9 - rh, rw, rh); g.strokeStyle = '#7a5a3a'; g.lineWidth = 2; g.strokeRect(cx - rw / 2, y1 - 9 - rh, rw, rh);
      g.fillStyle = '#4a3a5a'; g.font = `800 ${Math.round(10 * L.s)}px ${BC}`; g.textAlign = 'center'; g.fillText(String(f * 100 + i + 1), cx, y1 - 13 - rh); });
    else { // the lobby: desk, kitchen, laundry
      const d = L.sx(DESK), k2 = L.sx(KITCHEN), la = L.sx(LAUNDRY), fl = y1 - 9, u = L.fh;
      g.fillStyle = '#5a3420'; g.fillRect(d - L.bw * 0.08, fl - u * 0.3, L.bw * 0.16, u * 0.3); g.fillStyle = '#c8962a'; g.fillRect(d - L.bw * 0.085, fl - u * 0.32, L.bw * 0.17, 4); g.fillStyle = '#e8c25a'; g.beginPath(); g.arc(d + L.bw * 0.05, fl - u * 0.34, 5, Math.PI, 0); g.fill();
      g.fillStyle = '#9aa0a8'; g.fillRect(k2 - L.bw * 0.08, fl - u * 0.34, L.bw * 0.16, u * 0.34); g.fillStyle = '#2a2a2a'; g.fillRect(k2 - L.bw * 0.07, fl - u * 0.36, L.bw * 0.14, 4); g.fillStyle = '#5a5a60'; g.fillRect(k2 - 10, fl - u * 0.5, 20, u * 0.14);
      g.fillStyle = '#e8e8f0'; g.fillRect(la - L.bw * 0.07, fl - u * 0.42, L.bw * 0.14, u * 0.42); g.fillStyle = '#4a6a9a'; g.beginPath(); g.arc(la, fl - u * 0.22, u * 0.12, 0, TAU); g.fill(); g.fillStyle = '#bcd8f0'; g.beginPath(); g.arc(la, fl - u * 0.22, u * 0.08, 0, TAU); g.fill();
      g.fillStyle = '#4a3a5a'; g.font = `800 ${Math.round(10 * L.s)}px ${BC}`; g.textAlign = 'center'; [['DESK', d], ['KITCHEN', k2], ['LAUNDRY', la]].forEach(([t, x]) => g.fillText(t, x, fl - u * 0.62)); }
  }
  // the lift shaft
  const lx = L.sx(LIFT); g.fillStyle = '#3a2a2a'; g.fillRect(lx - L.bw * 0.05, L.top - 8, L.bw * 0.1, L.bot - L.top + 4); g.strokeStyle = '#8a7a6a'; g.lineWidth = 1; for (let y = L.top; y < L.bot; y += 10) { g.beginPath(); g.moveTo(lx - L.bw * 0.05, y); g.lineTo(lx + L.bw * 0.05, y + 10); g.stroke(); }
  g.fillStyle = '#1a1018'; g.fillRect(0, L.bot + 2, W, H - L.bot); return bgC; }
function drawGuy(x, y, s, t, walk, face, carry) { const c = ctx, b = walk ? Math.abs(Math.sin(t * 12)) * 3 : 0, lg = walk ? Math.sin(t * 12) * 5 : 0; c.save(); c.translate(x, y - b); c.scale(s * face, s);
  c.strokeStyle = '#1a1a2a'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(-3, -12); c.lineTo(-3 - lg, 0); c.moveTo(3, -12); c.lineTo(3 + lg, 0); c.stroke();
  c.fillStyle = '#c8202a'; rrect(-8, -34, 16, 23, 4); c.fill(); c.fillStyle = '#e8c25a'; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(0, -30 + i * 6, 1.4, 0, TAU); c.fill(); }
  c.fillStyle = '#e8b890'; c.beginPath(); c.arc(0, -41, 7, 0, TAU); c.fill(); c.fillStyle = '#c8202a'; rrect(-5, -53, 10, 6, 2); c.fill(); c.fillStyle = '#e8c25a'; c.fillRect(-5, -48, 10, 1.5);
  c.fillStyle = '#1a1a1a'; c.beginPath(); c.arc(3, -42, 1.2, 0, TAU); c.fill(); c.restore();
  ctx.font = `${Math.round(15 * s)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; carry.forEach((it, i) => ctx.fillText(KINDS[it.k].icon, x + (i - (carry.length - 1) / 2) * 15 * s, y - 64 * s - b)); }
function draw(now) { ctx.setTransform(DPR, 0, 0, DPR, 0, 0); const L = lay(), s = L.s, g = G, t = now; ctx.drawImage(hotelBg(L), 0, 0, W, H);
  ctx.save(); if (FX.shake > 0) ctx.translate((Math.random() - 0.5) * FX.shake, (Math.random() - 0.5) * FX.shake);
  if (g) {
    // rooms: lamps, guests, mess
    for (const r of g.rooms) { const cx = L.sx(r.x), fl = L.fy(r.f) - 9, rw = L.bw * 0.2, rh = L.fh * 0.62;
      if (r.state === 'occ') { const lg = ctx.createRadialGradient(cx, fl - rh * 0.7, 2, cx, fl - rh * 0.7, rw * 0.6); lg.addColorStop(0, 'rgba(255,220,140,.55)'); lg.addColorStop(1, 'rgba(255,220,140,0)'); ctx.fillStyle = lg; ctx.fillRect(cx - rw / 2, fl - rh, rw, rh); }
      ctx.fillStyle = r.state === 'dirty' ? '#8a7a6a' : '#f4f0f8'; rrect(cx - rw * 0.4, fl - rh * 0.32, rw * 0.6, rh * 0.22, 4); ctx.fill(); ctx.fillStyle = r.state === 'dirty' ? '#6a5a4a' : '#7a5aa8'; ctx.fillRect(cx - rw * 0.4, fl - rh * 0.14, rw * 0.6, rh * 0.14); ctx.fillStyle = '#fff'; rrect(cx - rw * 0.38, fl - rh * 0.4, rw * 0.16, rh * 0.1, 3); ctx.fill();
      if (r.state === 'occ') { ctx.fillStyle = '#3a2a4a'; ctx.beginPath(); ctx.arc(cx + rw * 0.3, fl - rh * 0.5, rh * 0.09, 0, TAU); ctx.fill(); rrect(cx + rw * 0.22, fl - rh * 0.42, rh * 0.16, rh * 0.32, 4); ctx.fill(); }
      if (r.state === 'dirty') { ctx.fillStyle = 'rgba(90,70,40,.6)'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(cx - rw * 0.3 + i * rw * 0.18, fl - 4 - (i % 2) * 3, 4, 0, TAU); ctx.fill(); } }
      if (r.state === 'clean' && g.me.carry.some(it => it.k === 'bags')) { const a = 0.55 + 0.45 * Math.sin(t * 6); ctx.fillStyle = `rgba(110,230,150,${0.18 + a * 0.16})`; ctx.fillRect(cx - rw / 2 + 2, fl - rh + 2, rw - 4, rh - 4); ctx.strokeStyle = `rgba(110,230,150,${0.6 + a * 0.4})`; ctx.lineWidth = 3; ctx.strokeRect(cx - rw / 2 + 2, fl - rh + 2, rw - 4, rh - 4); ctx.fillStyle = '#0c3a1c'; ctx.font = `800 ${Math.round(11 * s)}px ${BC}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('FREE ✓', cx, fl - rh * 0.72); } }
    // the kitchen pot steams, the drum turns
    const k2 = L.sx(KITCHEN), fl0 = L.fy(0) - 9; ctx.fillStyle = 'rgba(255,255,255,.25)'; for (let i = 0; i < 3; i++) { const ph = (t * 0.6 + i / 3) % 1; ctx.beginPath(); ctx.arc(k2 + Math.sin(ph * 6 + i) * 6, fl0 - L.fh * (0.52 + ph * 0.25), 5 * (1 - ph) + 2, 0, TAU); ctx.fill(); }
    // guests waiting at the desk
    for (const q of g.reqs) if (q.k === 'bags' && !q.got) { const x = L.sx(q.x); ctx.fillStyle = q.vip ? '#e8c25a' : '#3a4a7a'; rrect(x - 6, fl0 - 30 * s, 12, 22 * s, 4); ctx.fill(); ctx.fillStyle = '#e8b890'; ctx.beginPath(); ctx.arc(x, fl0 - 36 * s, 6 * s, 0, TAU); ctx.fill(); ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x + 6, fl0 - 12 * s, 9 * s, 10 * s); }
    // the lift cabin and you
    const me = g.me, lx = L.sx(LIFT), myY = L.fy(me.f) - 9; liftF = me.inLift ? me.f : (Math.abs(me.x - LIFT) < 0.03 ? me.f : liftF);
    { const cy = L.fy(liftF) - 9; ctx.fillStyle = '#c8a060'; ctx.fillRect(lx - L.bw * 0.045, cy - L.fh * 0.7, L.bw * 0.09, L.fh * 0.7); ctx.fillStyle = '#5a3a20'; ctx.fillRect(lx - L.bw * 0.04, cy - L.fh * 0.66, L.bw * 0.08, L.fh * 0.62); }
    if (me.work > 0) { ctx.strokeStyle = '#9be3b5'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(L.sx(me.x), myY - 28 * s, 22 * s, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - me.work / KINDS.clean.work)); ctx.stroke(); if (Math.random() < 0.3) PT.push({ x: L.sx(me.x) + (Math.random() - 0.5) * 30, y: myY - 10, vx: 0, vy: -60, life: 0.5, t: 0, col: 'rgba(255,255,255,.8)', r: 2 }); }
    drawGuy(L.sx(me.x), myY, s * Math.min(1.2, L.fh / 70), t, me.walk || me.inLift, me.face, me.carry);
    // the bubbles
    for (const q of g.reqs) { if (q.got && q.k === 'bags') continue; const p = bubXY(q, L), r = 19 * s, left = clamp(1 - q.t / q.pat, 0, 1), qi = -1, match = q.k !== 'bags' && q.k !== 'clean' && g.me.carry.some(it => it.k === q.k), urgent = left < 0.3, wob = urgent ? Math.sin(t * 18) * 2 : 0;
      if (match) { ctx.strokeStyle = `rgba(110,230,150,${0.6 + 0.4 * Math.sin(t * 6)})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(p.x, p.y, r + 9 + 2 * Math.sin(t * 6), 0, TAU); ctx.stroke(); }
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.arc(p.x, p.y + 3, r + 4, 0, TAU); ctx.fill();
      ctx.fillStyle = qi >= 0 ? '#fff6dc' : '#ffffff'; ctx.beginPath(); ctx.arc(p.x + wob, p.y, r, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.15)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(p.x + wob, p.y, r + 3, 0, TAU); ctx.stroke();
      ctx.strokeStyle = `hsl(${Math.round(left * 120)},80%,48%)`; ctx.beginPath(); ctx.arc(p.x + wob, p.y, r + 3, -Math.PI / 2, -Math.PI / 2 + TAU * left); ctx.stroke();
      if (q.vip) { ctx.strokeStyle = '#e8c25a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x + wob, p.y, r - 2, 0, TAU); ctx.stroke(); }
      ctx.font = `${Math.round(19 * s)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(KINDS[q.k].icon, p.x + wob, p.y + 1);
      if (qi >= 0) { ctx.fillStyle = '#c8202a'; ctx.beginPath(); ctx.arc(p.x + r * 0.85, p.y - r * 0.85, 9 * s, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = `800 ${Math.round(12 * s)}px ${BC}`; ctx.fillText(String(qi + 1), p.x + r * 0.85, p.y - r * 0.85 + 1); }
      if (q.vip) { ctx.fillStyle = '#e8c25a'; ctx.font = `800 ${Math.round(9 * s)}px ${BC}`; ctx.fillText('VIP', p.x, p.y + r + 9 * s); } }
    // the stops you have lined up: a numbered pin on each
    g.route.forEach((st, i) => { const px = L.sx(st.x) + (st.place === 'room' ? L.bw * 0.085 : 0), py = L.fy(st.f) - (st.place === 'room' ? L.fh * 0.62 * 0.9 + 9 : L.fh * 0.5); ctx.fillStyle = i === 0 ? '#c8202a' : '#7a3a3a'; ctx.beginPath(); ctx.arc(px, py, 10 * s, 0, TAU); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.font = `800 ${Math.round(12 * s)}px ${BC}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(i + 1), px, py + 1); });
    hud(g, L); bar(g, L); }
  for (const p of PT) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1; ctx.restore();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; for (const q of TXT) { const a = q.t < 1.1 ? 1 : 1 - (q.t - 1.1) / 0.4; ctx.globalAlpha = Math.max(0, a); ctx.font = `${Math.round(q.size * s)}px ${TF}`; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.strokeText(q.txt, q.x, q.y); ctx.fillStyle = q.col; ctx.fillText(q.txt, q.x, q.y); } ctx.globalAlpha = 1;
  if (hint) { const a = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, a); ctx.font = `700 ${Math.round(14 * s)}px ${BC}`; const lines = wrapText(hint.txt, W - 50), lh = 17 * s, hh = lines.length * lh + 14, ww = W - 30;
    ctx.fillStyle = 'rgba(20,10,24,.93)'; rrect(W / 2 - ww / 2, H * 0.42 - hh / 2, ww, hh, 10); ctx.fill(); ctx.fillStyle = '#ffe3a0'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.42 - hh / 2 + 7 + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,60,40,${FX.red * 0.2})`; ctx.fillRect(0, 0, W, H); } if (FX.flash > 0) { ctx.fillStyle = `rgba(255,240,200,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); } }
let liftF = 0;
// the top: tips against the target (a bar that fills), the clock, the hotel's stars
function hud(G, L) { const c = G.cfg, s = L.s; if (G.lesson) { lessonPanel(G); return; }
  const y = 44 * s, w = W - 16; ctx.fillStyle = 'rgba(0,0,0,.5)'; rrect(8, y, w, 34 * s, 10); ctx.fill();
  const u = clamp(G.tips / c.target, 0, 1); if (u > 0) { ctx.fillStyle = u >= 1 ? '#5a9a6a' : '#8a6a24'; rrect(10, y + 2, Math.max(20, (w - 4) * u * 0.52), 30 * s, 9); ctx.fill(); }
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.font = `800 ${Math.round(14 * s)}px ${BC}`; ctx.fillText(`£${G.tips} / £${c.target}`, 18, y + 17 * s);
  ctx.textAlign = 'center'; ctx.fillStyle = G.clock < 15 ? '#ffb4a8' : '#fff'; ctx.fillText(`⏱ ${Math.max(0, Math.ceil(G.clock))}`, W * 0.66, y + 17 * s);
  ctx.textAlign = 'right'; ctx.font = `${Math.round(13 * s)}px sans-serif`; let st = ''; for (let i = 1; i <= 5; i++) st += G.rating >= i - 0.25 ? '★' : '☆'; ctx.fillStyle = G.rating < 2.6 ? '#ff8a7a' : '#ffd36a'; ctx.fillText(st, W - 16, y + 17 * s);
  if (G.combo > 0 && G.t - G.lastDone < 5) { ctx.fillStyle = '#ffd36a'; ctx.font = `${Math.round(14 * s)}px ${TF}`; ctx.textAlign = 'center'; ctx.fillText(`STREAK ×${G.combo + 1}`, W / 2, y + 46 * s); } }
// the bottom: the stops you have lined up, in order (tap one to cancel it), and your hands
const STOPNAME = (G, st) => st.place === 'room' ? 'ROOM ' + G.rooms[st.room].no : st.place.toUpperCase(), STOPICON = { kitchen: '🍝', laundry: '🧺', desk: '🧳', room: '🚪' };
function bar(G, L) { const s = L.s; L.chips.forEach((b, i) => { const st = G.route[i];
    ctx.fillStyle = st ? 'rgba(255,246,220,.95)' : 'rgba(255,255,255,.08)'; rrect(b.x, b.y, b.w, b.h, 10); ctx.fill(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (st) { ctx.font = `${Math.round(20 * s)}px sans-serif`; ctx.fillText(STOPICON[st.place], b.x + b.w / 2, b.y + b.h * 0.38); ctx.fillStyle = '#4a2a2a'; ctx.font = `800 ${Math.round(10.5 * s)}px ${BC}`; ctx.fillText(`${i + 1}. ${STOPNAME(G, st)}`, b.x + b.w / 2, b.y + b.h * 0.78); }
    else { ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.font = `700 ${Math.round(11 * s)}px ${BC}`; ctx.fillText(`STOP ${i + 1}`, b.x + b.w / 2, b.y + b.h / 2); } });
  const h = L.hands; ctx.fillStyle = 'rgba(255,255,255,.08)'; rrect(h.x, h.y, h.w, h.h, 10); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.font = `700 ${Math.round(10 * s)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillText('YOUR HANDS', h.x + h.w / 2, h.y + 12 * s);
  for (let i = 0; i < G.cfg.hands; i++) { const it = G.me.carry[i], x = h.x + h.w * (i + 0.5) / G.cfg.hands, y = h.y + h.h * 0.62; ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, 15 * s, 0, TAU); ctx.stroke(); if (it) { ctx.font = `${Math.round(18 * s)}px sans-serif`; ctx.fillText(KINDS[it.k].icon, x, y + 1); } } }
// how the game reacts
function onEvent(G, e) { const L = lay(), s = L.s;
  switch (e.k) {
    case 'start': say(`TIPS TARGET £${G.cfg.target}`, W / 2, H * 0.36, '#ffd36a', 22); say(PLACES[G.place].name.toUpperCase(), W / 2, H * 0.31, '#fff', 16); sfx.bell(); break;
    case 'req': { const p = bubXY(e.q, L); sparks(p.x, p.y, 6, '#fff', 120); sfx[e.q.k === 'bags' ? 'bell' : e.q.k === 'clean' ? 'door' : 'ring'](); break; }
    case 'checkout': sfx.door(); break;
    case 'go': { sfx.take(e.n); vibe(HAP.light); sparks(L.sx(e.st.x), L.fy(e.st.f) - L.fh * 0.5, 8, '#ffd36a', 140); break; }
    case 'cancel': sfx.no(); break;
    case 'wrong': { const r = G.rooms[e.room], x = L.sx(r.x), y = L.fy(r.f) - L.fh * 0.8; FX.shake = 7; FX.red = 0.5; sfx.huff(); vibe(HAP.light); say(e.why === 'empty' ? 'NOTHING IN YOUR HANDS! −★' : e.why === 'taken' ? 'ROOM TAKEN! −★' : 'WRONG ROOM! −★', clamp(x, 110 * s, W - 110 * s), y, '#ff8a7a', 18); break; }
    case 'nothing': say(e.full ? 'HANDS FULL' : 'NOBODY IS WAITING', L.sx(G.me.x), L.fy(0) - L.fh * 0.9, '#ffd0a0', 16); sfx.no(); break;
    case 'putback': sfx.pick(1); break;
    case 'cleaned': sfx.tip(0); break;
    case 'full': sfx.no(); say('THREE STOPS AT MOST', W / 2, H * 0.4, '#ffd0a0', 16); break;
    case 'noroom': say('NO CLEAN ROOM!', W / 2, H * 0.4, '#ffb4a8', 20); tip('noroom', 'Every room is full or dirty: clean a 🧹 room so the guest has somewhere to go.', 3.2); break;
    case 'pickup': sfx.pick(e.n || 1); break;
    case 'two': say(`${e.n} IN ONE TRIP!`, L.sx(G.me.x), L.fy(G.me.f) - L.fh, '#9be3b5', 20); sfx.combo(e.n); break;
    case 'ding': sfx.ding(); break;
    case 'cleaning': sfx.scrub(); break;
    case 'done': { const x = L.sx(G.me.x), y = L.fy(G.me.f) - L.fh * 0.9; sfx.tip(e.chain); sparks(x, y, e.fast ? 16 : 8, '#ffd36a'); say(`+£${e.tip}`, x, y, e.q.vip ? '#ffe9a0' : '#ffd36a', e.fast ? 24 : 19); if (e.chain >= 2) { FX.flash = 0.2; vibe(HAP.light); } break; }
    case 'expire': { const p = bubXY(e.q, L); FX.shake = 6; FX.red = 0.5; sfx.huff(); say(e.q.vip ? 'VIP LEFT! −★' : 'TOO SLOW −★', p.x, p.y, '#ff8a7a', 18); vibe(HAP.light); break; }
    case 'lessonnext': if (e.first) hint = null; say('FIRST, A LESSON', W / 2, H * 0.36, '#ffd36a', 22); sfx.bell(); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, W / 2, H * 0.36, '#9be3b5', 24); sfx.tip(e.n); break;
    case 'lessonmiss': say('TRY AGAIN', W / 2, H * 0.36, '#ffd0c4', 22); coachMiss(); break;
    case 'lessondone': say('THE HOTEL IS YOURS!', W / 2, H * 0.36, '#ffd36a', 24); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': FX.flash = 0.7; sfx.win(); vibe(HAP.best); break;
    case 'lost': sfx.lose(); break;
  } }
// where the lesson's hand points: the very place to tap next
{ const at = (f, x, up) => { const L = lay(); return [L.sx(x), L.fy(f) - L.fh * (up || 0.4)]; }, freeRoom = G => G.rooms.find(r => r.state === 'clean'), bagsQ = G => G.reqs.find(q => !q.gone && q.k === 'bags' && !q.got);
  LESSONS[1][0].at = G => { if (holds(G, 'bags')) { const r = freeRoom(G); return r ? at(r.f, r.x) : null; } const q = bagsQ(G); return q ? at(0, q.x, 0.78) : null; };
  LESSONS[2][0].at = G => { if (holds(G, 'food')) { const q = G.reqs.find(x => !x.gone && x.k === 'food'); return q ? at(q.f, q.x, 0.78) : null; } return at(0, KITCHEN, 0.3); };
  LESSONS[3][0].at = G => { const d = G.rooms.find(r => r.state === 'dirty'); if (d) return at(d.f, d.x); if (holds(G, 'bags')) { const r = freeRoom(G); return r ? at(r.f, r.x) : null; } const q = bagsQ(G); return q ? at(0, q.x, 0.78) : null; }; }
function area() { return { x: 0, y: 0, w: W, h: H }; }
