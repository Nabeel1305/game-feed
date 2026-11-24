
// ===================== DRAW + JUICE: the spinning target (2D on purpose: a target seen face-on reads best flat) =====================
// A thick wooden round with growth rings and bark, turning; knives stuck in it handle-out; red apples sitting on the rim
// (gold ones now and then); steel studs. Your knife waits at the bottom and flies up in a blink. A stick: the target jumps,
// chips fly, a thunk. A hit on another knife: a clang, sparks, your knife spins away, a red flash. The last knife: the
// target bursts into wedges and the next one drops in. Bosses look like what they are: a cheese wheel, a tyre, a shield...
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, PT = [], TXT = [];
let hint = null, FLYING = [], WEDGES = [], dropIn = 0, HALVES = [];
const NU = 'Nunito, "Barlow Condensed", "Arial Narrow", sans-serif';
function sparks(x, y, n, col, sp = 220, g = 520) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random()); PT.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, life: 0.4 + Math.random() * 0.4, t: 0, col, r: 1.5 + Math.random() * 2.5, g }); } if (PT.length > 400) PT.splice(0, PT.length - 400); }
function say(txt, x, y, col = '#fff', size = 22) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
const S1 = () => Math.min(W, H * 0.6) / 390;
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of String(t).split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lay() { const s = S1(), R = Math.min(W * 0.31, H * 0.17), cx = W / 2, cy = Math.max(H * 0.36, 110 * s + R + 30 * s), ky = Math.min(H - 110 * s, cy + R + 230 * s); return { s, R, cx, cy, ky, klen: 86 * s }; }
function fillR(x, y, w, h, r, col) { ctx.fillStyle = col; rrect(x, y, w, h, r); ctx.fill(); }
function circ(x, y, r, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
// ---------- a knife, drawn pointing up (tip at 0,0) ----------
function knife(x, y, ang, len, alpha = 1, mine = true) { ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.globalAlpha = alpha; const l = len, w = l * 0.13;
  const g = ctx.createLinearGradient(-w, 0, w, 0); g.addColorStop(0, '#9aa6b2'); g.addColorStop(0.5, '#f4f8fc'); g.addColorStop(1, '#b8c2cc'); ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w, l * 0.18); ctx.lineTo(w, l * 0.55); ctx.lineTo(-w, l * 0.55); ctx.lineTo(-w, l * 0.12); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#5a6672'; ctx.fillRect(-w * 1.5, l * 0.55, w * 3, l * 0.05);
  const hg = ctx.createLinearGradient(-w, 0, w, 0); hg.addColorStop(0, mine ? '#5a2a14' : '#3a3a40'); hg.addColorStop(0.5, mine ? '#a0582a' : '#6a6a74'); hg.addColorStop(1, mine ? '#5a2a14' : '#3a3a40'); ctx.fillStyle = hg; rrect(-w * 1.05, l * 0.6, w * 2.1, l * 0.4, w); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-w * 0.2, l * 0.64, w * 0.4, l * 0.3); ctx.restore(); ctx.globalAlpha = 1; }
// ---------- the target ----------
const LOGPIC = { key: '', c: null };
function logPic(L, R) { const key = (L.name || 'wood') + ':' + Math.round(R) + ':' + DPR; if (LOGPIC.key === key) return LOGPIC.c; const d = Math.ceil(R * 2.2 * DPR), c = document.createElement('canvas'); c.width = c.height = d; const x = c.getContext('2d'); x.scale(DPR, DPR); x.translate(R * 1.1, R * 1.1);
  const nm = L.name, ring = (r, col) => { x.fillStyle = col; x.beginPath(); x.arc(0, 0, r, 0, TAU); x.fill(); };
  if (!nm) { ring(R, '#5a3418'); ring(R * 0.93, '#c88a50'); for (let i = 9; i > 0; i--) { x.strokeStyle = `rgba(110,60,25,${0.18 + (i % 2) * 0.12})`; x.lineWidth = 1.6; x.beginPath(); x.arc(R * 0.02 * Math.sin(i), R * 0.02 * Math.cos(i), R * 0.93 * i / 10, 0, TAU); x.stroke(); }
    for (let i = 0; i < 26; i++) { const a = i / 26 * TAU; x.strokeStyle = 'rgba(60,30,10,.35)'; x.lineWidth = 2; x.beginPath(); x.moveTo(Math.cos(a) * R * 0.94, Math.sin(a) * R * 0.94); x.lineTo(Math.cos(a) * R, Math.sin(a) * R); x.stroke(); } x.strokeStyle = 'rgba(90,45,15,.4)'; x.lineWidth = 2; x.beginPath(); x.moveTo(-R * 0.1, -R * 0.05); x.lineTo(R * 0.45, R * 0.3); x.stroke(); }
  else if (nm === 'The Cheese') { ring(R, '#e8a820'); ring(R * 0.92, '#ffd050'); for (let i = 0; i < 9; i++) { const a = i * 2.4, r = R * (0.2 + (i % 4) * 0.18); ring(0, 0); x.fillStyle = '#e8b030'; x.beginPath(); x.arc(Math.cos(a) * r, Math.sin(a) * r, R * (0.06 + (i % 3) * 0.03), 0, TAU); x.fill(); } }
  else if (nm === 'The Tyre') { ring(R, '#1a1a1e'); for (let i = 0; i < 30; i++) { const a = i / 30 * TAU; x.fillStyle = '#2e2e34'; x.save(); x.rotate(a); x.fillRect(R * 0.86, -R * 0.05, R * 0.14, R * 0.1); x.restore(); } ring(R * 0.62, '#2a2a30'); ring(R * 0.5, '#b8c0c8'); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; ring(0, 0); x.fillStyle = '#5a6068'; x.beginPath(); x.arc(Math.cos(a) * R * 0.28, Math.sin(a) * R * 0.28, R * 0.06, 0, TAU); x.fill(); } }
  else if (nm === 'The Shield') { ring(R, '#6a747e'); ring(R * 0.9, '#b8c4ce'); ring(R * 0.62, '#c03a3a'); ring(R * 0.42, '#b8c4ce'); ring(R * 0.2, '#c03a3a'); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; x.fillStyle = '#5a646e'; x.beginPath(); x.arc(Math.cos(a) * R * 0.95, Math.sin(a) * R * 0.95, R * 0.035, 0, TAU); x.fill(); } }
  else if (nm === 'The Cake') { ring(R, '#c86a3a'); ring(R * 0.9, '#ffb0d0'); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; x.fillStyle = '#fff'; x.beginPath(); x.arc(Math.cos(a) * R * 0.86, Math.sin(a) * R * 0.86, R * 0.07, 0, TAU); x.fill(); } for (let i = 0; i < 22; i++) { const a = i * 1.7, r = R * 0.65 * Math.sqrt((i + 1) / 22); x.fillStyle = ['#ff4a5a', '#ffd040', '#4ac0ff', '#7af07a'][i % 4]; x.fillRect(Math.cos(a) * r, Math.sin(a) * r, R * 0.05, R * 0.02); } }
  else if (nm === 'The Melon') { ring(R, '#2a7a3a'); for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; x.strokeStyle = '#1a5a28'; x.lineWidth = R * 0.05; x.beginPath(); x.arc(0, 0, R * 0.97, a, a + 0.12); x.stroke(); } ring(R * 0.86, '#e8f4c8'); ring(R * 0.8, '#ff5a6a'); for (let i = 0; i < 20; i++) { const a = i * 2.39, r = R * 0.55 * Math.sqrt((i + 1) / 20); x.fillStyle = '#2a1a1a'; x.beginPath(); x.ellipse(Math.cos(a) * r, Math.sin(a) * r, R * 0.025, R * 0.045, a, 0, TAU); x.fill(); } }
  else { ring(R, '#8a6a3a'); ring(R * 0.9, '#f4ecd8'); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; x.fillStyle = '#3a2a1a'; x.fillRect(Math.cos(a) * R * 0.78 - 2, Math.sin(a) * R * 0.78 - 2, 4, 4); } x.strokeStyle = '#3a2a1a'; x.lineWidth = 4; x.beginPath(); x.moveTo(0, 0); x.lineTo(0, -R * 0.55); x.moveTo(0, 0); x.lineTo(R * 0.4, 0); x.stroke(); }
  // a soft shine
  const g = x.createRadialGradient(-R * 0.35, -R * 0.4, R * 0.1, 0, 0, R); g.addColorStop(0, 'rgba(255,255,255,.18)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, R, 0, TAU); x.fill();
  LOGPIC.key = key; LOGPIC.c = c; return c; }
function drawLog(G, Lg, L, now) { const R = L.R, dy = -Lg.shake * 8 * L.s - Math.max(0, dropIn) * H * 0.6, cx = L.cx, cy = L.cy + dy, sc = 1 + Lg.shake * 0.02;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(sc, sc);
  // knives and studs behind first (handles outside the rim), then the target over the blades
  ctx.save(); ctx.rotate(Lg.rot); for (const q of Lg.items) { if (q.kind === 'stud') continue; const a = q.a; ctx.save(); ctx.rotate(a); knife(R * 0.8, 0, -Math.PI / 2, L.klen, 1, q.kind === 'mine'); ctx.restore(); } ctx.restore();
  const pic = logPic(Lg, R); ctx.drawImage(pic, -R * 1.1, -R * 1.1, R * 2.2, R * 2.2);
  ctx.save(); ctx.rotate(Lg.rot); for (const q of Lg.items) if (q.kind === 'stud') { const x = Math.cos(q.a) * R * 0.93, y = Math.sin(q.a) * R * 0.93; circ(x, y, R * 0.085, '#3a4048'); circ(x, y, R * 0.06, '#9aa6b2'); circ(x - R * 0.02, y - R * 0.02, R * 0.02, '#fff'); }
    for (const ap of Lg.apples) { const x = Math.cos(ap.a) * R * 1.1, y = Math.sin(ap.a) * R * 1.1; ctx.save(); ctx.translate(x, y); ctx.rotate(ap.a + Math.PI / 2); apple(0, 0, R * 0.12, ap.gold, now); ctx.restore(); } ctx.restore();
  ctx.restore();
  if (Lg.boss && Lg.name) { ctx.fillStyle = '#ffd040'; ctx.font = `${Math.round(15 * L.s)}px ${TF}`; ctx.textAlign = 'center'; ctx.fillText('BOSS · ' + Lg.name.toUpperCase(), cx, cy - R - 30 * L.s); } }
function apple(x, y, r, gold, now) { const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r); g.addColorStop(0, gold ? '#fff2a0' : '#ff8a8a'); g.addColorStop(1, gold ? '#d8a020' : '#c81e2a'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x - r * 0.35, y, r * 0.75, 0, TAU); ctx.arc(x + r * 0.35, y, r * 0.75, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = r * 0.15; ctx.beginPath(); ctx.moveTo(x, y - r * 0.5); ctx.lineTo(x + r * 0.1, y - r * 0.95); ctx.stroke(); ctx.fillStyle = '#4ab04a'; ctx.beginPath(); ctx.ellipse(x + r * 0.35, y - r * 0.85, r * 0.3, r * 0.14, -0.4, 0, TAU); ctx.fill();
  if (gold && Math.sin(now * 3 + x) > 0.8) circ(x + r * 0.3, y - r * 0.3, r * 0.15, '#fff'); }
// ---------- moment to moment ----------
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 40); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 2.5);
  for (const p of PT) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.g || 520) * dt; } for (let i = PT.length - 1; i >= 0; i--) if (PT[i].t > PT[i].life) PT.splice(i, 1);
  for (const t of TXT) { t.t += dt; t.y -= dt * 22; } while (TXT.length && TXT[0].t > 1.3) TXT.shift(); if (hint) { hint.t += dt; if (hint.t > hint.secs) hint = null; }
  for (const a of [FLYING, WEDGES, HALVES]) { for (const p of a) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 1400 * dt; p.ang += p.va * dt; } for (let i = a.length - 1; i >= 0; i--) if (a[i].t > 1.6) a.splice(i, 1); }
  if (dropIn > 0) dropIn = Math.max(0, dropIn - dt * 3.5); }
function draw(now) { ctx.setTransform(DPR, 0, 0, DPR, 0, 0); const L = lay(), s = L.s, g = G;
  // the background is painted once per size and place, then copied (a full-screen gradient every frame is slow on a phone)
  const bk = [W, H, DPR, g ? g.place : 0].join(':'); if (draw.bk !== bk) { draw.bk = bk; const oc = draw.oc || (draw.oc = document.createElement('canvas')); oc.width = cv.width; oc.height = cv.height; const o = oc.getContext('2d'); o.setTransform(DPR, 0, 0, DPR, 0, 0);
    const P = PLACES[g ? g.place : 0], bg = o.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, P.bg[0]); bg.addColorStop(1, P.bg[1]); o.fillStyle = bg; o.fillRect(0, 0, W, H);
    o.globalAlpha = 0.06; for (let i = 0; i < 9; i++) { o.fillStyle = i % 2 ? '#fff' : '#000'; o.fillRect(0, i * H / 9, W, H / 18); } o.globalAlpha = 1;
    const glow = o.createRadialGradient(L.cx, L.cy, L.R * 0.5, L.cx, L.cy, L.R * 2.6); glow.addColorStop(0, 'rgba(255,220,160,.18)'); glow.addColorStop(1, 'rgba(255,220,160,0)'); o.fillStyle = glow; o.fillRect(0, 0, W, H); }
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(draw.oc, 0, 0); ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.save(); if (FX.shake > 0) ctx.translate((Math.random() - 0.5) * FX.shake, (Math.random() - 0.5) * FX.shake);
  if (g && g.log && !(g.log.burst)) drawLog(g, g.log, L, now);
  for (const w of WEDGES) { ctx.save(); ctx.translate(w.x, w.y); ctx.rotate(w.ang); ctx.globalAlpha = Math.max(0, 1 - w.t / 1.4); ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, L.R, w.a0, w.a1); ctx.closePath(); ctx.save(); ctx.clip(); ctx.rotate(-w.ang0); if (LOGPIC.c) ctx.drawImage(LOGPIC.c, -L.R * 1.1, -L.R * 1.1, L.R * 2.2, L.R * 2.2); ctx.restore(); ctx.restore(); ctx.globalAlpha = 1; }
  for (const f of FLYING) knife(f.x, f.y, f.ang, L.klen, Math.max(0, 1 - f.t / 1.2), f.mine);
  for (const h of HALVES) { ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(h.ang); ctx.globalAlpha = Math.max(0, 1 - h.t / 1.2); ctx.fillStyle = h.gold ? '#e8b030' : '#d8283a'; ctx.beginPath(); ctx.arc(0, 0, L.R * 0.11, h.side * Math.PI / 2, h.side * Math.PI / 2 + Math.PI); ctx.fill(); ctx.fillStyle = '#fff4d0'; ctx.beginPath(); ctx.arc(0, 0, L.R * 0.08, h.side * Math.PI / 2, h.side * Math.PI / 2 + Math.PI); ctx.fill(); ctx.restore(); ctx.globalAlpha = 1; }
  // your knife: waiting at the bottom, or flying up
  if (g && g.log && !g.over) { const ty = L.cy + L.R * 0.78; if (g.fly) { const u = clamp(g.fly.t / g.cfg.fly, 0, 1), y = lerp(L.ky, ty, u); knife(L.cx, y, 0, L.klen); ctx.globalAlpha = 0.35; for (let i = 1; i < 4; i++) knife(L.cx, y + i * 18 * s, 0, L.klen, 0.25 / i); ctx.globalAlpha = 1; }
    else if (g.wait <= 0) knife(L.cx, L.ky + (1 - Math.min(1, (g.t - (g.lastThrow || -9)) * 8)) * 30 * s, 0, L.klen); }
  for (const p of PT) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); circ(p.x, p.y, p.r, p.col); } ctx.globalAlpha = 1;
  ctx.restore();
  if (g) hud(g, L, now);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; for (const q of TXT) { const a = q.t < 0.9 ? 1 : 1 - (q.t - 0.9) / 0.4, pop = 1 + 0.3 * Math.max(0, 1 - q.t * 6); ctx.globalAlpha = Math.max(0, a); ctx.font = `${Math.round(q.size * s * pop)}px ${TF}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(10,6,4,.7)'; ctx.strokeText(q.txt, q.x, q.y); ctx.fillStyle = q.col; ctx.fillText(q.txt, q.x, q.y); } ctx.globalAlpha = 1;
  if (hint) { const a = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, a); ctx.font = `700 ${Math.round(14 * s)}px ${BC}`; const lines = wrapText(hint.txt, W - 50), lh = 17 * s, hh = lines.length * lh + 14, ww = W - 30, hy = L.ky - L.klen * 0.6 - hh;
    fillR(W / 2 - ww / 2, hy - hh / 2, ww, hh, 12, 'rgba(20,12,8,.92)'); ctx.strokeStyle = '#ffb020'; ctx.lineWidth = 1.5; rrect(W / 2 - ww / 2, hy - hh / 2, ww, hh, 12); ctx.stroke(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, hy - hh / 2 + 7 + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,40,40,${FX.red * 0.22})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,250,235,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); } }
// ---------- the top and the knives left ----------
function hud(G, L, now) { const s = L.s; ctx.textBaseline = 'middle';
  if (G.lesson) lessonPanel(G, L);
  else { ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.font = `700 ${Math.round(12 * s)}px ${BC}`; ctx.fillText(`LEVEL ${G.N} · ${PLACES[G.place].name.toUpperCase()}`, 14, 52 * s);
    ctx.fillStyle = '#fff'; ctx.font = `${Math.round(26 * s)}px ${TF}`; ctx.fillText(G.score, 14, 80 * s); const bst = best[G.N]; if (bst) { ctx.font = `700 ${Math.round(12 * s)}px ${BC}`; ctx.fillStyle = G.score > bst ? '#ffd040' : 'rgba(255,255,255,.55)'; ctx.fillText(G.score > bst ? 'NEW BEST!' : `BEST ${bst}`, 14, 102 * s); }
    ctx.textAlign = 'right'; ctx.fillStyle = '#ff6a6a'; ctx.font = `${Math.round(18 * s)}px ${TF}`; ctx.fillText(`🍎 ${G.apples}`, W - 14, 54 * s);
    // targets in this level: dots (the boss a skull)
    const n = G.cfg.logs; for (let i = 0; i < n; i++) { const x = W - 14 - (n - 1 - i) * 22 * s, y = 82 * s, done = i < G.li, cur = i === G.li, boss = G.cfg.boss && i === n - 1; ctx.fillStyle = done ? '#ffd040' : cur ? '#fff' : 'rgba(255,255,255,.25)'; if (boss) { ctx.font = `${Math.round(15 * s)}px sans-serif`; ctx.textAlign = 'center'; ctx.globalAlpha = done || cur ? 1 : 0.45; ctx.fillText('💀', x, y); ctx.globalAlpha = 1; ctx.textAlign = 'right'; } else circ(x, y, (cur ? 6 : 5) * s, ctx.fillStyle); }
    if (G.spares) { ctx.fillStyle = '#9ae6ff'; ctx.font = `700 ${Math.round(12 * s)}px ${BC}`; ctx.fillText(`🛡 spare knife`, W - 14, 104 * s); } }
  // knives left: a column at the bottom left
  if (G.log) { const left = G.log.need - G.log.stuck - (G.fly ? 1 : 0), x = 22 * s, y0 = H - 40 * s; for (let i = 0; i < G.log.need; i++) { const y = y0 - i * 17 * s, on = i < left; ctx.save(); ctx.translate(x, y); ctx.rotate(-Math.PI / 4); ctx.globalAlpha = on ? 1 : 0.22; fillR(-2 * s, -9 * s, 4 * s, 11 * s, 2 * s, on ? '#e8eef4' : '#888'); fillR(-2.5 * s, 2 * s, 5 * s, 7 * s, 2 * s, on ? '#a0582a' : '#666'); ctx.restore(); } ctx.globalAlpha = 1; }
  if (G.N <= 1 && !G.lesson && G.thrown === 0 && !G.over) { ctx.globalAlpha = 0.6 + 0.4 * Math.sin(now * 5); ctx.fillStyle = '#fff'; ctx.font = `${Math.round(15 * s)}px ${TF}`; ctx.textAlign = 'center'; ctx.fillText('TAP TO THROW', W / 2, L.ky + L.klen + 16 * s); ctx.globalAlpha = 1; } }
function lessonPanel(G, L) { coachPanel(G); }
// ---------- what each happening looks and sounds like ----------
function onEvent(G, e) { const L = lay(), s = L.s, bx = L.cx, by = L.cy + L.R;
  switch (e.k) {
    case 'start': say(`LEVEL ${G.N}`, W / 2, L.cy - L.R - 40 * s, '#fff', 28); sfx.start(); if (G.N <= 1) tip('how', 'Tap to throw. Don\'t hit a knife that is already in!', 2.6); break;
    case 'log': dropIn = 1; HALVES.length = 0; LOGPIC.key = ''; if (e.boss) { say('BOSS!', W / 2, L.cy, '#ffd040', 40); sfx.boss(); FX.shake = 8; } else if (e.li > 0) sfx.drop(); break;
    case 'throw': G.lastThrow = G.t; sfx.throw(); break;
    case 'stick': { sfx.thunk(e.n); for (let i = 0; i < 6; i++) PT.push({ x: bx + (Math.random() - 0.5) * 10, y: by, vx: (Math.random() - 0.5) * 220, vy: 60 + Math.random() * 160, life: 0.5, t: 0, col: ['#c88a50', '#8a5a2a', '#e8b880'][i % 3], r: 2 + Math.random() * 2, g: 900 }); FX.shake = 2; vibe(HAP.tick);
      if (e.close) say('CLOSE!', bx + 60 * s, by - 10 * s, '#ffd040', 16); if (e.combo >= 2) say(`×${e.combo + 1}`, bx - 60 * s, by - 10 * s, '#9ae6ff', 16); break; }
    case 'apple': { const Lg = G.log, a = e.a + Lg.rot, x = L.cx + Math.cos(a) * L.R * 1.1, y = L.cy + Math.sin(a) * L.R * 1.1; for (const side of [-1, 1]) HALVES.push({ x, y, vx: side * 180 + (Math.random() - 0.5) * 60, vy: -260, ang: 0, va: side * 8, t: 0, side: side > 0 ? 0 : 1, gold: e.gold }); sparks(x, y, 14, e.gold ? '#ffd040' : '#ff5a6a', 200); sfx.apple(e.gold); say(e.gold ? '+5 🍎' : '+1 🍎', x, y - 20 * s, e.gold ? '#ffd040' : '#ff8a8a', 16); break; }
    case 'clang': { sfx.clang(); FX.shake = 14; FX.red = 1; FLYING.push({ x: bx, y: by + L.klen * 0.3, vx: (Math.random() < 0.5 ? -1 : 1) * 260, vy: 380, ang: 0, va: (Math.random() < 0.5 ? -1 : 1) * 14, t: 0, mine: true }); sparks(bx, by, 22, '#ffe08a', 300); break; }
    case 'spare': say('SPARE KNIFE SAVED YOU', W / 2, L.cy - L.R - 40 * s, '#9ae6ff', 15); break;
    case 'burst': { const Lg = G.log, n = 7; for (let i = 0; i < n; i++) { const a0 = i / n * TAU, a1 = (i + 1) / n * TAU, am = (a0 + a1) / 2; WEDGES.push({ x: L.cx, y: L.cy, vx: Math.cos(am) * 340, vy: Math.sin(am) * 340 - 220, ang: Lg.rot, ang0: 0, va: (Math.random() - 0.5) * 6, a0: a0, a1: a1, t: 0 }); }
      for (const q of Lg.items) { if (q.kind === 'stud') continue; const a = q.a + Lg.rot; FLYING.push({ x: L.cx + Math.cos(a) * L.R, y: L.cy + Math.sin(a) * L.R, vx: Math.cos(a) * 420, vy: Math.sin(a) * 420 - 200, ang: a - Math.PI / 2, va: (Math.random() - 0.5) * 16, t: 0, mine: q.kind === 'mine' }); }
      Lg.burst = true; sfx.burst(e.boss); FX.flash = e.boss ? 0.8 : 0.45; FX.shake = e.boss ? 16 : 9; FX.stop = 0.06; vibe(e.boss ? HAP.best : HAP.sharp); sparks(L.cx, L.cy, 30, '#ffd040', 380); say(e.boss ? 'BOSS DOWN!' : ['NICE!', 'SMASHED!', 'GREAT!', 'BOOM!'][(Math.random() * 4) | 0], W / 2, L.cy, '#ffd040', e.boss ? 34 : 26); break; }
    case 'lessonmiss': coachMiss(); break;
    case 'lessonnext': if (e.first) hint = null; break;
    case 'lessondone': say('YOU\'VE GOT IT!', W / 2, L.cy, '#ffd040', 28); sfx.goal(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); break;
    case 'lost': sfx.lose(); break;
  } }
