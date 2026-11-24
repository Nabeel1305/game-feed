// ===================== DRAW + JUICE: the magician's shop (2D on purpose: words, jars and runes read best flat) =====================
// Candlelit shop: the customer across the counter (their face shows how they feel), their story in a parchment bubble with the
// clue words in bold, the cauldron bubbling on its fire in the middle (its brew takes the colour of what is in it), and below it
// whatever the step needs: the shelf of jars, the pouring gauge, the stirring ring, the runes, the seal with its coloured ring.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, PT = [], TXT = [];
let hint = null, bgC = null, mood = 0, speech = null, trace = null;
function sparks(x, y, n, col, sp = 220) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random()); PT.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.5 + Math.random() * 0.4, t: 0, col, r: 2 + Math.random() * 2.5 }); } }
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
const S1 = () => Math.min(W, H * 0.6) / 390;
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of String(t).split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { coachPanel(G); }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 40); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 2);
  for (const p of PT) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.g == null ? 300 : p.g) * dt; } for (let i = PT.length - 1; i >= 0; i--) if (PT[i].t > PT[i].life) PT.splice(i, 1);
  for (const t of TXT) { t.t += dt; t.y -= dt * 18; } while (TXT.length && TXT[0].t > 1.6) TXT.shift(); if (hint) { hint.t += dt; if (hint.t > hint.secs) hint = null; } }
const ingOf = id => INGS.find(i => i.id === id), runeOf = id => RUNES.find(r => r.id === id);
const knownSet = () => { const k = (typeof HEADLESS !== 'undefined' && HEADLESS) ? {} : (store.get('known', {}) || {}); return k; };
const knows = id => ingOf(id).n <= 5 || !!knownSet()[id];
// where everything is
function lay() { const s = S1(), cx = W / 2, top = 44 * s;
  const C = { x: cx, y: H * 0.47, r: Math.min(W * 0.26, H * 0.11) }, panelY = H * 0.62, ings = G ? G.cfg.ings : INGS.slice(0, 6), cols = 4, jw = (W - 30) / cols, jh = Math.min(64 * s, (H * 0.27) / Math.ceil(ings.length / cols) - 6);
  const jars = ings.map((g, i) => ({ id: g.id, x: 15 + (i % cols) * jw + 3, y: panelY + Math.floor(i / cols) * (jh + 6), w: jw - 6, h: jh }));
  const rs = G ? G.cfg.runes : RUNES.slice(0, 3), rw = Math.min(70 * s, (W - 30) / rs.length - 8), runes = rs.map((r, i) => ({ id: r.id, x: W / 2 + (i - (rs.length - 1) / 2) * (rw + 8) - rw / 2, y: panelY + 30 * s, w: rw, h: rw }));
  return { s, top, C, panelY, jars, runes, act: { x: 24, y: H - 74 * s, w: W - 48, h: 54 * s }, gauge: { x: W - 56 * s, y: C.y - C.r * 1.4, w: 30 * s, h: C.r * 2.4 }, who: { x: 62 * s, y: H * 0.19, r: 40 * s }, bub: { x: 118 * s, y: top + 30 * s, w: W - 128 * s, h: H * 0.17 } }; }
const MIXC = { rose: '#ff5a8a', moon: '#6a7aff', thistle: '#b05aff', gold: '#ffd040', mint: '#4ae08a', salt: '#e8eef8', ash: '#8a8a8a', sage: '#8ac06a', honey: '#ffb030', feather: '#c8e0ff', iron: '#7a8a9a', silk: '#e0e0f0', acorn: '#a0703a', rain: '#4ab0ff', mirror: '#d0f0ff', ember: '#ff6a2a' };
function brewCol(G) { if (!G.pick.length) return '#3a5a3a'; const cs = G.pick.map(id => MIXC[id]); return cs[Math.floor(G.t * 1.5) % cs.length]; }
function shopBg() { const w = Math.round(W * DPR), h = Math.round(H * DPR); if (bgC && bgC.width === w && bgC.height === h) return bgC; bgC = document.createElement('canvas'); bgC.width = w; bgC.height = h; const g = bgC.getContext('2d'); g.scale(DPR, DPR);
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#2a1a3a'); gr.addColorStop(0.55, '#3a2438'); gr.addColorStop(1, '#1a1018'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,255,255,.03)'; for (let y = 0; y < H * 0.6; y += 30) for (let x = (y / 30) % 2 * 25; x < W; x += 50) g.fillRect(x, y, 48, 28);      // stone wall
  g.fillStyle = '#4a2e1e'; g.fillRect(0, H * 0.585, W, H * 0.03); g.fillStyle = '#2a1a12'; g.fillRect(0, H * 0.615, W, H);      // the counter
  // shelves of bottles in the dark behind
  for (const sy of [0.32]) { g.fillStyle = '#3a2416'; g.fillRect(0, H * sy, W * 0.22, 5); g.fillRect(W * 0.78, H * sy, W * 0.22, 5); for (let i = 0; i < 8; i++) { const x = (i < 4 ? 6 + i * W * 0.05 : W * 0.6 + i * W * 0.05), hh = 14 + (i * 7) % 12; g.fillStyle = ['#5a3a7a', '#3a6a5a', '#7a3a3a', '#6a6a3a'][i % 4]; g.fillRect(x, H * sy - hh, 12, hh); } }
  return bgC; }
function drawWho(v, x, y, r, t) { const c = ctx, skin = ['#f0c8a0', '#c8946a', '#8a5a3a', '#e8b890', '#a87050', '#f8d8b8'][v.face % 6], bob = Math.sin(t * 2) * 2; c.save(); c.translate(x, y + bob);
  c.fillStyle = ['#5a3a7a', '#3a5a3a', '#7a3a2a', '#2a4a6a', '#6a5a2a', '#4a2a4a'][(v.face + v.hat) % 6]; rrect(-r * 1.1, r * 0.75, r * 2.2, r * 1.6, r * 0.5); c.fill();
  c.fillStyle = skin; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
  c.fillStyle = '#2a1a10'; if (v.hat === 0) { c.beginPath(); c.moveTo(-r * 1.1, -r * 0.55); c.lineTo(r * 1.1, -r * 0.55); c.lineTo(r * 0.5, -r * 0.8); c.lineTo(r * 0.45, -r * 1.5); c.lineTo(-r * 0.45, -r * 1.5); c.lineTo(-r * 0.5, -r * 0.8); c.fill(); }
  else if (v.hat === 1) { c.fillStyle = '#c84a4a'; c.beginPath(); c.arc(0, -r * 0.45, r * 0.9, Math.PI, 0); c.fill(); } else if (v.hat === 2) { c.fillStyle = '#e8e0d0'; c.beginPath(); c.arc(0, -r * 0.2, r * 1.02, Math.PI * 1.05, Math.PI * 1.95); c.lineTo(r * 0.9, r * 0.5); c.lineTo(r * 0.7, r * 0.1); c.lineTo(-r * 0.7, r * 0.1); c.lineTo(-r * 0.9, r * 0.5); c.fill(); } else { c.fillStyle = '#5a3a1a'; c.beginPath(); c.arc(0, -r * 0.3, r * 1.0, Math.PI * 1.1, Math.PI * 1.9); c.fill(); }
  c.fillStyle = '#1a1010'; for (const sx of [-1, 1]) { c.beginPath(); c.arc(sx * r * 0.35, -r * 0.05, r * 0.09, 0, TAU); c.fill(); }
  c.strokeStyle = '#1a1010'; c.lineWidth = 3; c.beginPath(); if (mood > 0) c.arc(0, r * 0.25, r * 0.35, 0.2, Math.PI - 0.2); else if (mood < -1) c.arc(0, r * 0.65, r * 0.3, Math.PI + 0.3, -0.3); else if (mood < 0) { c.moveTo(-r * 0.3, r * 0.45); c.quadraticCurveTo(0, r * 0.3, r * 0.3, r * 0.45); } else { c.moveTo(-r * 0.25, r * 0.4); c.lineTo(r * 0.25, r * 0.4); } c.stroke();
  if (mood === 3) { c.fillStyle = '#ffd040'; c.font = `${r * 0.6}px sans-serif`; c.textAlign = 'center'; c.fillText('✨', r * 0.9, -r * 0.9); } c.restore(); }
// the story, with **clue words** in bold (glowing with the reading lamp)
function drawStory(txt, B, s) { const parts = []; String(txt).split('**').forEach((p, i) => p.split(' ').forEach((w, j) => { if (!w) return; if (j === 0 && /^[.,!?;:']/.test(w) && parts.length && !/ $/.test(p.slice(0, 1))) { parts[parts.length - 1].w += w; parts[parts.length - 1].tail = i % 2 === 0; return; } parts.push({ w, b: i % 2 === 1 }); }));
  ctx.fillStyle = '#f4ead6'; rrect(B.x, B.y, B.w, B.h, 14); ctx.fill(); ctx.beginPath(); ctx.moveTo(B.x + 2, B.y + B.h * 0.55); ctx.lineTo(B.x - 14 * s, B.y + B.h * 0.7); ctx.lineTo(B.x + 2, B.y + B.h * 0.75); ctx.fill();
  let fs = 15 * s, lines; for (;;) { ctx.font = `600 ${fs}px Nunito,sans-serif`; lines = [[]]; let w = 0; const sp = ctx.measureText(' ').width; for (const p of parts) { ctx.font = `${p.b ? 800 : 600} ${fs}px Nunito,sans-serif`; const pw = ctx.measureText(p.w).width; if (w + pw > B.w - 22 && lines[lines.length - 1].length) { lines.push([]); w = 0; } lines[lines.length - 1].push(Object.assign({ pw }, p)); w += pw + sp; } if (lines.length * fs * 1.3 < B.h - 16 || fs < 10) break; fs -= 1; }
  ctx.textBaseline = 'top'; ctx.textAlign = 'left'; lines.forEach((ln, i) => { let x = B.x + 11; for (const p of ln) { ctx.font = `${p.b ? 800 : 600} ${fs}px Nunito,sans-serif`; if (p.b && upLv('lamp')) { ctx.fillStyle = 'rgba(255,200,80,.45)'; ctx.fillRect(x - 1, B.y + 9 + i * fs * 1.3, p.pw + 2, fs * 1.15); } ctx.fillStyle = p.b ? '#5a1a6a' : '#3a2a1a'; ctx.fillText(p.w, x, B.y + 9 + i * fs * 1.3); x += p.pw + ctx.measureText(' ').width; } }); }
function btn(r, txt, on = true, col = '#b58cff') { ctx.fillStyle = on ? col : 'rgba(255,255,255,.12)'; rrect(r.x, r.y, r.w, r.h, 14); ctx.fill(); ctx.fillStyle = on ? '#1a0e2a' : 'rgba(255,255,255,.5)'; ctx.font = `${Math.round(r.h * 0.36)}px ${TF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, r.x + r.w / 2, r.y + r.h / 2 + 1); }
function draw(now) { ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.drawImage(shopBg(), 0, 0, W, H); const g = G, t = now, L = lay(), s = L.s, C = L.C;
  ctx.save(); if (FX.shake > 0) ctx.translate((Math.random() - 0.5) * FX.shake, (Math.random() - 0.5) * FX.shake);
  // candle glow
  const cg = ctx.createRadialGradient(C.x, C.y + C.r, 10, C.x, C.y + C.r, W * 0.7); cg.addColorStop(0, `rgba(255,150,60,${0.22 + Math.sin(t * 9) * 0.02})`); cg.addColorStop(1, 'rgba(255,150,60,0)'); ctx.fillStyle = cg; ctx.fillRect(0, 0, W, H);
  if (g) { const v = g.cur;
    if (v) { drawWho(v, L.who.x, L.who.y, L.who.r, t); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.font = `700 ${Math.round(11 * s)}px ${BC}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(v.who.toUpperCase(), L.who.x, L.who.y + L.who.r * 2.45); drawStory(speech || v.story, L.bub, s); }
    // the cauldron
    ctx.fillStyle = '#ff7a2a'; for (let i = 0; i < 5; i++) { const fx = C.x + (i - 2) * C.r * 0.3, fh = C.r * (0.35 + 0.15 * Math.sin(t * 11 + i * 2)); ctx.beginPath(); ctx.moveTo(fx - C.r * 0.15, C.y + C.r * 1.05); ctx.quadraticCurveTo(fx, C.y + C.r * 1.05 - fh * 2, fx + C.r * 0.15, C.y + C.r * 1.05); ctx.fill(); }
    ctx.fillStyle = '#1a1a22'; ctx.beginPath(); ctx.ellipse(C.x, C.y + C.r * 0.15, C.r * 1.08, C.r * 0.95, 0, 0, Math.PI); ctx.fill(); ctx.fillRect(C.x - C.r * 1.08, C.y - C.r * 0.05, C.r * 2.16, C.r * 0.2);
    const col = g.phase === 'seal' ? `hsl(${Math.round(sealPhase(g) * 360)},80%,58%)` : brewCol(g); ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(C.x, C.y, C.r * 0.98, C.r * 0.28, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#2a2a34'; ctx.lineWidth = 7 * s; ctx.beginPath(); ctx.ellipse(C.x, C.y, C.r * 1.04, C.r * 0.3, 0, 0, TAU); ctx.stroke();
    if (Math.random() < 0.25) PT.push({ x: C.x + (Math.random() - 0.5) * C.r * 1.4, y: C.y, vx: 0, vy: -40 - Math.random() * 40, g: 0, life: 0.8, t: 0, col: 'rgba(255,255,255,.35)', r: 2 + Math.random() * 4 });
    // the step's panel
    const P = g.phase;
    if (P === 'pick' && v) { for (const J of L.jars) { const I = ingOf(J.id), on = g.pick.includes(J.id); ctx.fillStyle = on ? 'rgba(181,140,255,.55)' : 'rgba(255,255,255,.09)'; rrect(J.x, J.y, J.w, J.h, 10); ctx.fill(); if (on) { ctx.strokeStyle = '#d8c0ff'; ctx.lineWidth = 2; rrect(J.x, J.y, J.w, J.h, 10); ctx.stroke(); }
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.font = `${Math.round(J.h * 0.38)}px sans-serif`; ctx.fillText(I.icon, J.x + J.w / 2, J.y + J.h * 0.36); ctx.font = `700 ${Math.round(Math.min(10.5 * s, J.h * 0.17))}px ${BC}`; ctx.fillStyle = '#fff'; ctx.fillText(knows(J.id) ? I.means.split(' ')[0].toUpperCase() : '?', J.x + J.w / 2, J.y + J.h * 0.8); }
      btn(L.act, g.pick.length ? `BREW (${g.pick.map(id => ingOf(id).icon).join('')})` : 'PICK THE JARS', g.pick.length > 0); }
    if (P === 'pour') { const Gg = L.gauge, u = clamp(g.amount / 2, 0, 1.1); ctx.fillStyle = 'rgba(255,255,255,.12)'; rrect(Gg.x, Gg.y, Gg.w, Gg.h, 8); ctx.fill(); ctx.fillStyle = brewCol(g); ctx.fillRect(Gg.x + 3, Gg.y + Gg.h * (1 - Math.min(1, u)), Gg.w - 6, Gg.h * Math.min(1, u));
      [[0.33, 'a little'], [1, 'usual'], [1.67, 'strong']].forEach(([a, l]) => { const y = Gg.y + Gg.h * (1 - a / 2); ctx.fillStyle = '#fff'; ctx.fillRect(Gg.x - 6, y, Gg.w + 12, 2); ctx.font = `700 ${Math.round(10 * s)}px ${BC}`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(l.toUpperCase(), Gg.x - 9, y); });
      ctx.fillStyle = 'rgba(255,80,60,.5)'; ctx.fillRect(Gg.x, Gg.y, Gg.w, Gg.h * 0.075); if (g.pouring) { ctx.strokeStyle = brewCol(g); ctx.lineWidth = 6 * s; ctx.beginPath(); ctx.moveTo(C.x + C.r * 0.5, C.y - C.r * 1.6); ctx.lineTo(C.x + C.r * 0.3, C.y); ctx.stroke(); }
      btn(L.act, g.pouring ? 'POURING... LET GO AT THE LINE' : 'HOLD TO POUR', true, '#ffb030'); }
    if (P === 'stir') { const a = g.stirA, n = g.cfg.turns; ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.ellipse(C.x, C.y, C.r * 0.75, C.r * 0.22, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      const sx = C.x + Math.cos(a) * C.r * 0.75, sy = C.y + Math.sin(a) * C.r * 0.22; ctx.strokeStyle = '#c8a070'; ctx.lineWidth = 7 * s; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + C.r * 0.2, sy - C.r * 1.3); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = `${Math.round(14 * s)}px ${TF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(`STIR ROUND ${n === 1 ? 'ONCE' : 'TWICE'}`, W / 2, L.panelY + 22 * s);
      ctx.font = `700 ${Math.round(13 * s)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillText('↻ CLOCKWISE draws it IN     ↺ ANTICLOCKWISE drives it OUT', W / 2, L.panelY + 48 * s);
      const u = clamp(Math.abs(a) / (TAU * n), 0, 1); ctx.fillStyle = 'rgba(255,255,255,.12)'; rrect(40, L.panelY + 70 * s, W - 80, 10, 5); ctx.fill(); ctx.fillStyle = a >= 0 ? '#9be3b5' : '#ff9a7a'; rrect(40, L.panelY + 70 * s, (W - 80) * u, 10, 5); ctx.fill();
      if (Math.abs(a) > 0.3) { ctx.fillText(a > 0 ? '↻ IN' : '↺ OUT', W / 2, L.panelY + 96 * s); } }
    if (P === 'rune') { ctx.fillStyle = '#fff'; ctx.font = `${Math.round(14 * s)}px ${TF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(trace ? 'TRACE THE RUNE' : 'WHAT DOES IT ACT ON?', W / 2, L.panelY + 10 * s);
      for (const R of L.runes) { const ru = runeOf(R.id), on = trace && trace.id === R.id; ctx.fillStyle = on ? 'rgba(181,140,255,.6)' : 'rgba(255,255,255,.1)'; rrect(R.x, R.y, R.w, R.h, 12); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = `${Math.round(R.w * 0.42)}px sans-serif`; ctx.fillText(ru.icon, R.x + R.w / 2, R.y + R.h * 0.42); ctx.font = `700 ${Math.round(9.5 * s)}px ${BC}`; ctx.fillText(ru.name.split(' ').slice(-1)[0].toUpperCase(), R.x + R.w / 2, R.y + R.h * 0.84); }
      if (trace) { const ru = runeOf(trace.id), pts = ru.pts.map(([px, py]) => ({ x: C.x + px * C.r * 1.6, y: C.y - C.r * 0.8 + py * C.r * 1.6 })); ctx.strokeStyle = 'rgba(200,170,255,.35)'; ctx.lineWidth = 10 * s; ctx.lineCap = 'round'; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
        ctx.strokeStyle = '#e8d8ff'; ctx.lineWidth = 6 * s; ctx.beginPath(); pts.slice(0, trace.i + 1).forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
        pts.forEach((p, i) => { ctx.fillStyle = i < trace.i ? '#e8d8ff' : i === trace.i ? '#ffd040' : 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.arc(p.x, p.y, (i === trace.i ? 11 : 7) * s, 0, TAU); ctx.fill(); }); } }
    if (P === 'seal') { const want = `hsl(${Math.round(g.sealWant * 360)},80%,58%)`; ctx.strokeStyle = want; ctx.lineWidth = 8 * s; ctx.beginPath(); ctx.ellipse(C.x, C.y, C.r * 1.25, C.r * 0.42, 0, 0, TAU); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = `${Math.round(14 * s)}px ${TF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('SEAL IT WHEN IT GLOWS THE RING\'S COLOUR', W / 2, L.panelY + 24 * s); btn(L.act, 'SEAL ✦', true, want); }
    if (P === 'back' && v) { const d = v.returning; btn(L.act, d.grade === 'bad' ? '... I\'M SO SORRY' : 'BREW IT AGAIN, PROPERLY', true, d.grade === 'bad' ? '#ff8a7a' : '#ffd040'); }
    hud(g, L); }
  for (const p of PT) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1; ctx.restore();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; for (const q of TXT) { const a = q.t < 1.1 ? 1 : 1 - (q.t - 1.1) / 0.5; ctx.globalAlpha = Math.max(0, a); ctx.font = `${Math.round(q.size * s)}px ${TF}`; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.strokeText(q.txt, q.x, q.y); ctx.fillStyle = q.col; ctx.fillText(q.txt, q.x, q.y); } ctx.globalAlpha = 1;
  if (hint) { const a = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, a); ctx.font = `700 ${Math.round(14 * s)}px ${BC}`; const lines = wrapText(hint.txt, W - 50), lh = 17 * s, hh = lines.length * lh + 14, ww = W - 30;
    ctx.fillStyle = 'rgba(20,10,30,.93)'; rrect(W / 2 - ww / 2, H * 0.36 - hh / 2, ww, hh, 10); ctx.fill(); ctx.fillStyle = '#ffe3a0'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.36 - hh / 2 + 7 + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,60,40,${FX.red * 0.2})`; ctx.fillRect(0, 0, W, H); } if (FX.flash > 0) { ctx.fillStyle = `rgba(230,210,255,${FX.flash * 0.35})`; ctx.fillRect(0, 0, W, H); } }
function hud(G, L) { const s = L.s; if (G.lesson) { lessonPanel(G); return; }
  ctx.fillStyle = 'rgba(0,0,0,.4)'; rrect(8, 10, 92 * s, 26 * s, 9); ctx.fill(); ctx.fillStyle = '#e8d8ff'; ctx.font = `700 ${Math.round(12 * s)}px ${BC}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(`CUSTOMER ${Math.min(G.total, G.done.length + (G.cur && !G.cur.returning ? 1 : 0))}/${G.total}`, 15, 10 + 13 * s);
  const backs = G.done.filter(d => d.back && !d.seenBack).length; if (backs) { ctx.fillStyle = 'rgba(255,200,80,.25)'; rrect(W - 100 * s, 10, 92 * s, 26 * s, 9); ctx.fill(); ctx.fillStyle = '#ffd040'; ctx.textAlign = 'right'; ctx.fillText(`${backs} COMING BACK…`, W - 14, 10 + 13 * s); } }
// what they say when they come back
function backLine(d) { const J = d.J; if (d.grade === 'bad') return `You! Your spell did nothing but harm. I want my money back, and I\'m telling the whole town.`;
  if (J.side === 'spill') return 'Your potion was so strong it fizzed out of the bottle and singed my eyebrows. Try again?';
  if (J.side) return `Well... it sort of worked. But now ${ingOf(J.side).side}. Can you fix it?`;
  if (!J.dirOk) return 'It did the very opposite of what I asked! Can you put it right?';
  if (!J.runeOk) return 'It worked... but on the wrong thing entirely. My goat is very confused. Again, please?';
  if (J.missing.length) return 'Nothing much happened at all. A faint smell of cabbage. Try again?';
  return 'Not quite right. A little too much, or too little. Once more?'; }
function goodLine(d) { if (d.J.alt) return d.J.alt + '.'; return pick(Math.random, ['Thank you! I can feel it working already.', 'Oh, that\'s wonderful. Bless you.', 'Marvellous! I\'ll tell everyone.', 'It tingles! In a good way!']); }
// how the game reacts
function onEvent(G, e) { const L = lay(), C = L.C;
  switch (e.k) {
    case 'start': say(`${PLACES[G.place].name.toUpperCase()}: ${G.total} CUSTOMERS`, W / 2, H * 0.3, '#e8d8ff', 18); sfx.bell(); break;
    case 'enter': speech = null; mood = 0; sfx.bell(); if (G.N <= 1 && !G.lesson) tip('read', 'The bold words are the clues. Tap the jars they point to, then BREW.', 3.2); break;
    case 'jar': sfx[e.on ? 'clink' : 'click'](); if (e.on) for (let i = 0; i < 6; i++) PT.push({ x: C.x, y: C.y, vx: (Math.random() - 0.5) * 100, vy: -120 - Math.random() * 80, life: 0.6, t: 0, col: MIXC[e.id], r: 3 }); break;
    case 'phase': sfx.whoosh(); trace = null; if (e.p === 'pour' && G.N <= 2) tip('pour', 'Hold to pour. Let go at the line they asked for: a little, usual, or strong.', 3); break;
    case 'poured': sfx.splash(); break;
    case 'stirred': sfx.swirl(e.dir); break;
    case 'rune': sfx.rune(); FX.flash = 0.3; break;
    case 'sealed': sfx.seal(e.acc); break;
    case 'served': { const gr = e.grade; mood = gr === 'perfect' ? 3 : gr === 'good' ? 1 : gr === 'funny' ? 0 : -1; speech = gr === 'perfect' || gr === 'good' ? goodLine({ J: e.J }) : gr === 'funny' ? 'Hmm. Thank you... I think.' : 'Is it... supposed to smell like that?';
      say(gr === 'perfect' ? 'PERFECT!' : gr === 'good' ? 'WELL BREWED' : gr === 'funny' ? 'HMM...' : 'UH OH', W / 2, H * 0.33, gr === 'perfect' ? '#ffd040' : gr === 'good' ? '#9be3b5' : '#ffb4a8', 26);
      if (gr === 'perfect' || gr === 'good') { sfx.good(gr === 'perfect'); for (let i = 0; i < 24; i++) { const a = Math.random() * TAU; PT.push({ x: C.x, y: C.y, vx: Math.cos(a) * 180, vy: Math.sin(a) * 180 - 80, life: 0.9, t: 0, col: i % 2 ? '#ffd040' : '#d8c0ff', r: 2.5 }); } vibe(HAP.light); }
      else { sfx.fizzle(); FX.shake = 5; } break; }
    case 'back': { const d = e.d; speech = backLine(d); mood = d.grade === 'bad' ? -2 : -1; sfx.door(); if (d.grade !== 'bad') tip('back', 'A funny side effect: brew it again, properly. Get it right this time.', 3.2); break; }
    case 'retry': speech = null; break;
    case 'fixed': mood = e.grade === 'good' || e.grade === 'perfect' ? 3 : -2; speech = e.grade === 'good' || e.grade === 'perfect' ? 'Oh, thank goodness. Much better!' : 'Worse! This is the last straw.'; if (mood > 0) { sfx.good(true); say('FIXED!', W / 2, H * 0.33, '#9be3b5', 26); } break;
    case 'complain': mood = -2; speech = 'That\'s it. I\'m telling the whole town about this so-called magician!'; FX.red = 0.7; FX.shake = 10; sfx.angry(); break;
    case 'lessonnext': if (e.first) hint = null; say('FIRST, A LESSON', W / 2, H * 0.3, '#ffd040', 22); sfx.bell(); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, W / 2, H * 0.3, '#9be3b5', 24); break;
    case 'lessonmiss': say('TRY AGAIN', W / 2, H * 0.3, '#ffd0c4', 22); coachMiss(); break;
    case 'lessondone': say('THE SHOP IS OPEN!', W / 2, H * 0.3, '#ffd040', 24); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': FX.flash = 0.7; sfx.win(); vibe(HAP.best); break;
    case 'lost': sfx.lose(); break;
  } }
function area() { return { x: 0, y: 0, w: W, h: H }; }
