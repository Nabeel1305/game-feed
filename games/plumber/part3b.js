
// ===================== DRAW (2 of 2): the phone, the street, the job card, the hands-on fixes, the top bar =====================
const ICON = { drip: '💧', trap: '🪣', sinkclog: '🚰', wcclog: '🚽', wcrun: '🚽', burst: '💦', nowater: '🚱', lowpress: '🚿', nohot: '🥶', radcold: '🌡️', boiler: '🔥', bang: '💥', wmflood: '🌊', smell: '🤢', sewer: '🕳️', showerslow: '🛁', otap: '🌿', cartridge: '🚿', aerator: '🚰', wmdrain: '🧺', otapfrozen: '🧊' };
let lastPaid = null, ringT = 0, cashShow = 0, POP = [];
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 40); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 2); ringT = Math.max(0, ringT - dt);
  for (const p of PT) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.g || 520) * dt; } for (let i = PT.length - 1; i >= 0; i--) if (PT[i].t > PT[i].life) PT.splice(i, 1);
  for (const t of TXT) { t.t += dt; t.y -= dt * 22; } while (TXT.length && TXT[0].t > 1.5) TXT.shift(); if (hint) { hint.t += dt; if (hint.t > hint.secs) hint = null; }
  if (G) cashShow = lerp(cashShow, G.cash, Math.min(1, dt * 6)); if (lastPaid) lastPaid.t += dt;
  const F = G && G.job && G.job.fix; if (F && F.held && !paused) { if (F.kind === 'feed') { if (F.st !== 'snag') sfx.feedTick(); } else sfx.ratchet(); } }
const clockStr = G => { const m = Math.round((1 - G.clock / G.cfg.day) * 8 * 60), h = 9 + Math.floor(m / 60), mm = m % 60; return `${h > 12 ? h - 12 : h}:${String(mm).padStart(2, '0')} ${h >= 12 ? 'pm' : 'am'}`; };
// ---------- the top bar: the time, the money, the level ----------
function hud(G, L, now) { const s = L.s; ctx.fillStyle = 'rgba(8,24,40,.9)'; ctx.fillRect(0, 0, W, L.top); ctx.textBaseline = 'middle';
  if (G.lesson) { lessonPanel(G, L); return; }
  const late = G.clock < 25; ctx.textAlign = 'left'; ctx.fillStyle = late ? (Math.sin(now * 8) > 0 ? '#ff8a7a' : '#fff') : '#fff'; ctx.font = `${Math.round(20 * s)}px ${TF}`; ctx.fillText(clockStr(G), 12, 26 * s);
  ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.font = `700 ${Math.round(11 * s)}px ${BC}`; ctx.fillText(`DAY ${G.N} · ${PLACES[G.place].name.toUpperCase()}${G.cfg.boss ? ' · BUSY DAY' : ''}`, 12, 48 * s);
  const p = clamp(G.cash / G.cfg.target, 0, 1), bw = Math.min(150 * s, W * 0.38), bx = W - bw - 12, by = 40 * s;
  ctx.textAlign = 'right'; ctx.fillStyle = '#ffd36a'; ctx.font = `${Math.round(19 * s)}px ${TF}`; ctx.fillText('$' + Math.round(cashShow), W - 12 - 0, 22 * s); ctx.fillStyle = 'rgba(255,255,255,.65)'; ctx.font = `700 ${Math.round(11 * s)}px ${BC}`;
  ctx.fillText(`of $${G.cfg.target} today` + (best[G.N] ? `  ·  best $${best[G.N]}` : ''), W - 12, by - 2 * s + 14 * s);
  fillR(bx, by - 8 * s, bw, 7 * s, 3.5 * s, 'rgba(255,255,255,.15)'); fillR(bx, by - 8 * s, Math.max(7 * s, bw * p), 7 * s, 3.5 * s, p >= 1 ? '#7be08a' : '#ffb21e');
  // the day: a thin bar under the top
  fillR(0, L.top - 3, W * (1 - G.clock / G.cfg.day), 3, 0, late ? '#ff6a5a' : 'rgba(255,255,255,.35)'); }
// the lesson: its title in the top bar (clear of the pause and Skip buttons), what to do in a box just under it
function lessonPanel(G, L) { coachPanel(G); }
// ---------- the street (between jobs) ----------
function street(G, L, now, drive) { const s = L.s, P = PLACES[G.place], h = L.sy0 || L.top + 200 * s; const g = ctx.createLinearGradient(0, L.top, 0, h); g.addColorStop(0, P.sky[0]); g.addColorStop(1, P.sky[1]); ctx.fillStyle = g; ctx.fillRect(0, L.top, W, h - L.top);
  const off = drive ? (now * 260 * s) : now * 6 * s, gy = h - 34 * s;
  for (let i = -1; i < 9; i++) { const w = 74 * s, x = ((i * w - off) % (w * 8) + w * 8) % (w * 8) - w, hh = (46 + ((i * 37) % 3) * 12) * s, hue = (i * 67 + 20) % 360;
    fillR(x + 4, gy - hh, w - 8, hh, 2, hsl(hue, 30, 78)); ctx.fillStyle = hsl(hue, 35, 42); ctx.beginPath(); ctx.moveTo(x, gy - hh + 1); ctx.lineTo(x + w / 2, gy - hh - 22 * s); ctx.lineTo(x + w, gy - hh + 1); ctx.fill();
    fillR(x + 14 * s, gy - hh + 12 * s, 14 * s, 14 * s, 2, '#fff8e0'); fillR(x + w - 30 * s, gy - hh + 12 * s, 14 * s, 14 * s, 2, '#fff8e0'); fillR(x + w / 2 - 6 * s, gy - 20 * s, 12 * s, 20 * s, 2, hsl(hue, 40, 34)); }
  ctx.fillStyle = '#5a646e'; ctx.fillRect(0, gy, W, 34 * s); ctx.fillStyle = '#fff'; for (let i = 0; i < 12; i++) { const x = ((i * 50 * s - off * 1.0) % (W + 50 * s) + W + 50 * s) % (W + 50 * s) - 50 * s; ctx.fillRect(x, gy + 16 * s, 24 * s, 2.5 * s); }
  van(W * (drive ? 0.42 + Math.sin(now * 3) * 0.01 : 0.3), gy + 10 * s, 40 * s, now, drive); }
function van(x, y, z, now, moving) { ctx.save(); ctx.translate(x, y + (moving ? Math.sin(now * 30) * 0.6 : 0)); const k = z / 40; ctx.scale(k, k);
  fillR(-34, -26, 52, 24, 4, '#f4f6f8'); fillR(18, -18, 18, 16, 4, '#f4f6f8'); fillR(22, -16, 11, 8, 2, '#9fd4f0'); fillR(-34, -12, 70, 6, 0, '#2a64b0');
  ctx.fillStyle = '#2a64b0'; ctx.font = '900 8px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('PLUMBER', -8, -16); ctx.fillText('🔧', 8, -16);
  for (const wx of [-22, 22]) { circ(wx, -2, 7, '#2a2a30'); circ(wx, -2, 3, '#aab'); if (moving) line([[wx, -2], [wx + Math.cos(now * 30) * 3, -2 + Math.sin(now * 30) * 3]], '#555', 1); }
  if (moving) for (let i = 0; i < 3; i++) { ctx.globalAlpha = 0.4 - i * 0.12; circ(-40 - i * 8 - (now * 40 % 8), -6 - i * 2, 3 + i, '#ccc'); } ctx.globalAlpha = 1; ctx.restore(); }
// ---------- the phone: the calls waiting ----------
function phoneRect(L) { const s = L.s, y = L.top + 196 * s; return { x: 10, y, w: W - 20, h: H - y - 10 }; }
function callRect(i, L) { const P = phoneRect(L), s = L.s, n = Math.max(3, G ? G.cfg.calls : 3), ch = Math.min(96 * s, (P.h - 44 * s - (n - 1) * 8) / n); return { x: P.x + 8, y: P.y + 38 * s + i * (ch + 8), w: P.w - 16, h: ch }; }
function drawCalls(G, L, now) { const s = L.s, P = phoneRect(L); fillR(P.x, P.y, P.w, P.h, 18, 'rgba(10,22,36,.94)'); ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.font = `${Math.round(14 * s)}px ${TF}`; ctx.fillText('📞 CALLS', P.x + 14, P.y + 20 * s); ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.font = `700 ${Math.round(12 * s)}px ${BC}`; ctx.fillText(G.calls.length ? 'tap one to go' : 'waiting for the phone...', P.x + P.w - 14, P.y + 20 * s);
  G.calls.forEach((c, i) => { const r = callRect(i, L), born = Math.min(1, c.age / 0.25), x = r.x + (1 - easeOut(born)) * W, left = 1 - c.age / c.ttl, urgent = c.urgent;
    fillR(x, r.y, r.w, r.h, 12, urgent ? '#3a1a1e' : '#1e3448'); ctx.strokeStyle = urgent ? 'rgba(255,90,74,.8)' : 'rgba(255,255,255,.12)'; ctx.lineWidth = 1.5; rrect(x, r.y, r.w, r.h, 12); ctx.stroke();
    circ(x + 30 * s, r.y + r.h / 2, 21 * s, 'rgba(255,255,255,.1)'); ctx.font = `${Math.round(22 * s)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText(ICON[c.job.id] || '🔧', x + 30 * s, r.y + r.h / 2 + 1);
    ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.font = `800 ${Math.round(14 * s)}px ${NU}`; const q = wrapText('“' + c.say + '”', r.w - 150 * s); q.slice(0, 2).forEach((l, k) => ctx.fillText(l, x + 58 * s, r.y + r.h * 0.3 + k * 16 * s));
    ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.font = `700 ${Math.round(11.5 * s)}px ${BC}`; ctx.fillText(`${c.who} · ${c.addr}`, x + 58 * s, r.y + r.h * 0.3 + Math.min(2, q.length) * 16 * s);
    ctx.textAlign = 'right'; ctx.fillStyle = '#ffd36a'; ctx.font = `${Math.round(18 * s)}px ${TF}`; ctx.fillText('$' + c.pay, x + r.w - 12, r.y + r.h * 0.34); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.font = `700 ${Math.round(11.5 * s)}px ${BC}`; ctx.fillText(`🚐 ${Math.round(c.dist)} min`, x + r.w - 12, r.y + r.h * 0.62);
    if (urgent) { fillR(x + r.w - 62 * s, r.y + r.h - 20 * s, 52 * s, 14 * s, 7 * s, '#ff5a4a'); ctx.fillStyle = '#fff'; ctx.font = `800 ${Math.round(9 * s)}px ${NU}`; ctx.textAlign = 'center'; ctx.fillText('URGENT', x + r.w - 36 * s, r.y + r.h - 13 * s); }
    fillR(x + 12, r.y + r.h - 5, (r.w - 24) * clamp(left, 0, 1), 3, 1.5, left < 0.3 ? '#ff6a5a' : 'rgba(255,255,255,.35)'); });
  if (!G.calls.length) { ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.font = `700 ${Math.round(14 * s)}px ${NU}`; ctx.textAlign = 'center'; ctx.fillText('· · ·', W / 2, P.y + P.h / 2); } }
// ---------- at the house: the card at the bottom (what they said, what you found) ----------
function leaveRect(L) { const s = L.s; return { x: W - 108 * s - 12, y: H - 40 * s, w: 108 * s, h: 30 * s }; }
function drawJobCard(G, L, now) { const J = G.job, s = L.s, y = L.sy + 8; fillR(8, y, W - 16, H - y - 8, 16, 'rgba(10,22,36,.94)');
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#fff'; ctx.font = `800 ${Math.round(16 * s)}px ${NU}`; const q = wrapText('“' + J.call.say + '”', W - 44); q.slice(0, 2).forEach((l, i) => ctx.fillText(l, 20, y + 12 * s + i * 19 * s));
  let yy = y + 14 * s + Math.min(2, q.length) * 19 * s; ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.font = `700 ${Math.round(12 * s)}px ${BC}`; ctx.fillText(`— ${J.call.who}, ${J.call.addr}` + (J.call.urgent ? '  ·  URGENT' : ''), 20, yy); yy += 22 * s;
  if (J.found && J.found.length) { for (const f of J.found.slice(-3)) { ctx.fillStyle = '#9fd4f0'; ctx.font = `700 ${Math.round(13 * s)}px ${NU}`; for (const l of wrapText('🔍 ' + f, W - 44).slice(0, 2)) { ctx.fillText(l, 20, yy); yy += 16 * s; } yy += 3 * s; } }
  if (J.si > 0) { ctx.fillStyle = '#7be08a'; ctx.font = `800 ${Math.round(13 * s)}px ${NU}`; ctx.fillText(`✓ ${J.steps.slice(0, J.si).map(q => q[1]).join('  ✓ ')}`, 20, yy); yy += 18 * s; }
  if (!J.walk && !J.look) { ctx.fillStyle = `rgba(255,210,100,${0.75 + 0.25 * Math.sin(now * 4)})`; ctx.font = `800 ${Math.round(13 * s)}px ${NU}`; wrapText(J.flooding ? '⚠ Water everywhere! Find the stopcock and shut it off!' : 'Tap a part of the house to look at it.', W - 44).forEach((l, i) => ctx.fillText(l, 20, Math.min(yy + 4 * s, H - 76 * s) + i * 16 * s)); }
  // the patience of the customer
  const m = clamp(J.mood, 0, 1); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.font = `700 ${Math.round(11 * s)}px ${BC}`; ctx.fillText('PATIENCE', 20, H - 36 * s); fillR(80 * s, H - 35 * s, 110 * s, 8 * s, 4 * s, 'rgba(255,255,255,.14)'); fillR(80 * s, H - 35 * s, 110 * s * m, 8 * s, 4 * s, m > 0.78 ? '#7be08a' : m > 0.5 ? '#ffd36a' : '#ff6a5a');
  ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.font = `700 ${Math.round(11 * s)}px ${BC}`; ctx.fillText('★'.repeat(m > 0.78 ? 3 : m > 0.5 ? 2 : 1), 196 * s, H - 37 * s);
  if (!G.lesson) { const r = leaveRect(L); fillR(r.x, r.y, r.w, r.h, r.h / 2, 'rgba(255,255,255,.08)'); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.font = `700 ${Math.round(11.5 * s)}px ${NU}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('Give up job', r.x + r.w / 2, r.y + r.h / 2); } }
// ---------- the look: a close-up of the part, what you found, the fixes to pick from ----------
function actRect(k, n, L) { const s = L.s, cols = 2, bw = (W - 44) / cols, bh = 44 * s, row = Math.floor(k / cols), col = k % cols, y0 = H - 16 - Math.ceil(n / cols) * (bh + 8); return { x: 16 + col * (bw + 12), y: y0 + row * (bh + 8), w: bw, h: bh }; }
function closeRect(L) { const s = L.s; return { x: W - 50 * s, y: L.sy + 14, w: 38 * s, h: 38 * s }; }
function drawLook(G, L, now) { const J = G.job, lk = J.look, s = L.s, y = L.sy + 4, id = lk.id; fillR(6, y, W - 12, H - y - 6, 18, '#0e2236'); ctx.strokeStyle = 'rgba(255,178,30,.5)'; ctx.lineWidth = 1.5; rrect(6, y, W - 12, H - y - 6, 18); ctx.stroke();
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffb21e'; ctx.font = `${Math.round(15 * s)}px ${TF}`; ctx.fillText(FIX[id].name.toUpperCase(), 20, y + 26 * s);
  const cr = closeRect(L); circ(cr.x + cr.w / 2, cr.y + cr.h / 2, cr.w / 2, 'rgba(255,255,255,.1)'); ctx.fillStyle = '#fff'; ctx.font = `800 ${Math.round(16 * s)}px ${NU}`; ctx.textAlign = 'center'; ctx.fillText('✕', cr.x + cr.w / 2, cr.y + cr.h / 2 + 1);
  const px = 62 * s, py = y + 96 * s; circ(px, py, 44 * s, 'rgba(255,255,255,.07)'); drawPart(id, px, py + 4 * s, 64 * s, partState(G, id, now), now);
  ctx.textAlign = 'left'; const tx = 120 * s, tw = W - tx - 20; if (!lk.seen) { ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.font = `700 ${Math.round(14 * s)}px ${NU}`; ctx.fillText('Looking' + '.'.repeat(1 + ((now * 4) | 0) % 3), tx, py); }
  else { const lt = lookText(G, id); ctx.fillStyle = lt.bad ? '#ffb4a8' : '#a8f0b8'; ctx.font = `800 ${Math.round(15 * s)}px ${NU}`; const ls = wrapText((lt.bad ? '⚠ ' : '✓ ') + lt.txt, tw); ls.slice(0, 4).forEach((l, i) => ctx.fillText(l, tx, py - (Math.min(4, ls.length) - 1) * 9 * s + i * 18 * s)); }
  const acts = FIX[id].acts; acts.forEach((a, k) => { const r = actRect(k, acts.length, L), dis = J.busy > 0; fillR(r.x, r.y, r.w, r.h, 12, dis ? 'rgba(255,255,255,.06)' : '#ffb21e'); ctx.fillStyle = dis ? 'rgba(255,255,255,.3)' : '#1a2430'; ctx.font = `800 ${Math.round(14.5 * s)}px ${NU}`; ctx.textAlign = 'center'; ctx.fillText(a, r.x + r.w / 2, r.y + r.h / 2 + 1); });
  if (J.busy > 0) { ctx.fillStyle = '#ffb4a8'; ctx.font = `800 ${Math.round(13 * s)}px ${NU}`; ctx.textAlign = 'center'; ctx.fillText('That didn\'t help...', W / 2, actRect(0, acts.length, L).y - 14 * s); } }
// ---------- the fixes: one picture each ----------
const fitTarget = L => [W / 2, L.sy + L.sheetH * 0.4], fitStart = L => [W / 2, L.sy + L.sheetH * 0.8], gaugeAt = L => [W / 2, L.sy + L.sheetH * 0.6, Math.min(L.sheetH * 0.3, W * 0.27)];
const sliderRect = L => ({ x: 40 * L.s, y: L.sy + L.sheetH * 0.58, w: W - 80 * L.s, h: 22 * L.s });
let dragFit = null;
function drawFix(G, L, now) { const J = G.job, F = J.fix, s = L.s, y = L.sy + 4; fillR(6, y, W - 12, H - y - 6, 18, '#0e2236');
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffb21e'; ctx.font = `${Math.round(15 * s)}px ${TF}`; ctx.fillText(F.name.toUpperCase() + (F.need > 1 && F.kind !== 'pump' ? `  ${F.ok + 1}/${F.need}` : ''), 20, y + 24 * s);
  ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.font = `700 ${Math.round(13 * s)}px ${NU}`; wrapText(F.how, W - 40).slice(0, 2).forEach((l, i) => ctx.fillText(l, 20, y + 48 * s + i * 16 * s));
  const k = F.kind;
  if (k === 'hold' || k === 'end') { const [cx, cy, R] = gaugeAt(L), a0 = Math.PI * 0.8, a1 = Math.PI * 2.2, A = v => a0 + (a1 - a0) * v;
    ctx.lineCap = 'round'; ctx.lineWidth = 14 * s; ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.arc(cx, cy, R, a0, a1); ctx.stroke();
    if (k === 'hold') { ctx.strokeStyle = 'rgba(255,90,74,.55)'; ctx.beginPath(); ctx.arc(cx, cy, R, A(F.b + 0.02), a1); ctx.stroke(); }
    ctx.strokeStyle = '#4ad86a'; ctx.beginPath(); ctx.arc(cx, cy, R, A(F.a), A(Math.min(1, F.b))); ctx.stroke();
    ctx.strokeStyle = F.m > F.b ? '#ff5a4a' : '#ffd36a'; ctx.lineWidth = 6 * s; ctx.beginPath(); ctx.arc(cx, cy, R, a0, A(Math.max(0.001, F.m))); ctx.stroke();
    const na = A(F.m); line([[cx, cy], [cx + Math.cos(na) * (R - 4 * s), cy + Math.sin(na) * (R - 4 * s)]], '#fff', 3 * s); circ(cx, cy, 7 * s, '#fff');
    // what is being turned, in the middle
    ctx.save(); ctx.translate(cx, cy + R * 0.42); ctx.rotate(F.held ? now * 6 : 0); ctx.fillStyle = '#9aa6b2'; ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; i ? ctx.lineTo(Math.cos(a) * 12 * s, Math.sin(a) * 12 * s) : ctx.moveTo(Math.cos(a) * 12 * s, Math.sin(a) * 12 * s); } ctx.closePath(); ctx.fill(); circ(0, 0, 5 * s, '#0e2236'); ctx.restore();
    if (!F.held) { ctx.fillStyle = `rgba(255,255,255,${0.6 + 0.4 * Math.sin(now * 6)})`; ctx.font = `${Math.round(16 * s)}px ${TF}`; ctx.textAlign = 'center'; ctx.fillText('HOLD', cx, cy - R * 0.35); } }
  if (k === 'pump') { const [cx, cy] = gaugeAt(L), r0 = 30 * s, r1 = r0 + 70 * s * (1 - F.p), near = (1 - F.p) * F.T < G.cfg.win;
    ctx.lineWidth = 6 * s; ctx.strokeStyle = near ? '#4ad86a' : '#fff'; ctx.beginPath(); ctx.arc(cx, cy, r0, 0, TAU); ctx.stroke(); ctx.lineWidth = 3 * s; ctx.strokeStyle = `rgba(255,211,106,${0.4 + 0.6 * F.p})`; ctx.beginPath(); ctx.arc(cx, cy, r1, 0, TAU); ctx.stroke();
    const pl = F.lastHit != null && G.t - F.lastHit < 0.2 ? 8 * s : 0; fillR(cx - 3 * s, cy - 44 * s + pl, 6 * s, 40 * s, 3 * s, '#c98d55'); ctx.fillStyle = '#d83a3a'; ctx.beginPath(); ctx.ellipse(cx, cy + 4 * s + pl, 18 * s, 10 * s, 0, Math.PI, 0); ctx.fill();
    for (let i = 0; i < F.need; i++) circ(cx + (i - (F.need - 1) / 2) * 18 * s, cy + 58 * s, 6 * s, i < F.hits ? '#4ad86a' : 'rgba(255,255,255,.18)');
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.font = `800 ${Math.round(12 * s)}px ${NU}`; ctx.textAlign = 'center'; ctx.fillText('TAP when the ring meets the circle', cx, cy + 80 * s); }
  if (k === 'feed') { const [cx, cy, R] = gaugeAt(L), px0 = 30 * s, px1 = W - 30 * s, py = cy - R * 0.65;
    fillR(px0, py - 9 * s, px1 - px0, 18 * s, 9 * s, '#5a6672'); fillR(px0 + 3, py - 6 * s, (px1 - px0 - 6) * F.prog, 12 * s, 6 * s, '#ffd36a'); ctx.fillStyle = '#2a3038'; fillR(px1 - 30 * s, py - 9 * s, 26 * s, 18 * s, 6 * s, '#3a2a1a');
    ctx.fillStyle = '#fff'; ctx.font = `800 ${Math.round(11 * s)}px ${NU}`; ctx.textAlign = 'right'; ctx.fillText('BLOCKAGE', px1 - 2 * s, py - 18 * s);
    const zone = { ok: 0.2, warn: 0.5, snag: 0.82 }[F.st], wob = F.st === 'snag' ? Math.sin(now * 50) * 0.04 : Math.sin(now * 5) * 0.03, na = Math.PI + (zone + wob) * Math.PI, gy = cy + R * 0.5;
    ctx.lineWidth = 16 * s; ctx.lineCap = 'butt'; [['#4ad86a', 0, 0.4], ['#ffb21e', 0.4, 0.62], ['#ff5a4a', 0.62, 1]].forEach(([c, a, b]) => { ctx.strokeStyle = c; ctx.beginPath(); ctx.arc(cx, gy, R * 0.8, Math.PI + a * Math.PI, Math.PI + b * Math.PI); ctx.stroke(); });
    line([[cx, gy], [cx + Math.cos(na) * R * 0.75, gy + Math.sin(na) * R * 0.75]], '#fff', 3 * s); circ(cx, gy, 6 * s, '#fff');
    ctx.fillStyle = F.st === 'snag' ? '#ff8a7a' : '#fff'; ctx.font = `${Math.round(16 * s)}px ${TF}`; ctx.textAlign = 'center'; ctx.fillText(F.stall > 0 ? 'KINKED!' : F.st === 'snag' ? 'LET GO!' : F.held ? 'FEEDING...' : 'HOLD', cx, gy + 26 * s); }
  if (k === 'set') { const r = sliderRect(L), gx = r.x + r.w * (F.tgt - F.w / 2), gw = r.w * F.w; fillR(r.x, r.y, r.w, r.h, r.h / 2, 'rgba(255,255,255,.12)'); fillR(gx, r.y, gw, r.h, 6, '#4ad86a');
    for (let i = 0; i <= 10; i++) fillR(r.x + r.w * i / 10 - 1, r.y + r.h + 4 * s, 2, 6 * s, 1, 'rgba(255,255,255,.35)');
    const kx = r.x + r.w * F.v; circ(kx, r.y + r.h / 2, 18 * s, F.drag ? '#fff' : '#ffd36a'); circ(kx, r.y + r.h / 2, 7 * s, '#0e2236');
    ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.font = `800 ${Math.round(12 * s)}px ${NU}`; ctx.textAlign = 'center'; ctx.fillText('drag the knob into the green, then let go', W / 2, r.y + r.h + 30 * s); }
  if (k === 'fit') { const [tx, ty] = fitTarget(L), [sx, sy] = dragFit ? [dragFit.x, dragFit.y] : fitStart(L), gw = 54 * s;
    line([[24 * s, ty], [tx - gw / 2, ty]], '#3a8ad0', 16 * s); line([[tx + gw / 2, ty], [W - 24 * s, ty]], '#3a8ad0', 16 * s); ctx.setLineDash([5, 5]); ctx.strokeStyle = `rgba(255,211,106,${0.5 + 0.4 * Math.sin(now * 6)})`; ctx.lineWidth = 2; rrect(tx - gw / 2, ty - 10 * s, gw, 20 * s, 4); ctx.stroke(); ctx.setLineDash([]);
    fillR(sx - gw / 2 + 2, sy - 8 * s, gw - 4, 16 * s, 4, F.name === 'New hose' ? '#3a4450' : F.name === 'New cartridge' ? '#c0c8d0' : '#d9a441'); ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(sx - gw / 2 + 4, sy - 6 * s, gw - 8, 3 * s);
    if (!dragFit) { ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.font = `800 ${Math.round(12 * s)}px ${NU}`; ctx.textAlign = 'center'; ctx.fillText('drag me ↑', sx, sy + 22 * s); } } }
// ---------- the picture ----------
function draw(now) { ctx.setTransform(DPR, 0, 0, DPR, 0, 0); const L = lay(), s = L.s, g = G;
  ctx.fillStyle = '#123a5a'; ctx.fillRect(0, 0, W, H);
  ctx.save(); if (FX.shake > 0) ctx.translate((Math.random() - 0.5) * FX.shake, (Math.random() - 0.5) * FX.shake);
  if (g) { const J = g.job;
    if (J && (g.phase === 'job' || g.phase === 'fix' || g.phase === 'paid')) { paintHouse(g, L); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(HOUSE.oc, 0, 0); ctx.setTransform(DPR, 0, 0, DPR, 0, 0); if (FX.shake > 0) ctx.translate((Math.random() - 0.5) * FX.shake, 0); liveHouse(g, L, now);
      if (J.fix) drawFix(g, L, now); else if (J.look) drawLook(g, L, now); else drawJobCard(g, L, now); }
    else { const L2 = Object.assign({}, L, { sy0: L.top + 190 * s }); street(g, L2, now, g.phase === 'drive'); if (g.phase === 'drive') driveCard(g, L, now); else drawCalls(g, L, now); } }
  for (const p of PT) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); circ(p.x, p.y, p.r, p.col); } ctx.globalAlpha = 1;
  ctx.restore();
  if (g) hud(g, L, now);
  if (g && lastPaid && lastPaid.t < 1.8) receipt(L, now);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; for (const q of TXT) { const a = q.t < 1.1 ? 1 : 1 - (q.t - 1.1) / 0.4, pop = 1 + 0.3 * Math.max(0, 1 - q.t * 6); ctx.globalAlpha = Math.max(0, a); ctx.font = `${Math.round(q.size * s * pop)}px ${TF}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(8,20,34,.75)'; ctx.strokeText(q.txt, q.x, q.y); ctx.fillStyle = q.col; ctx.fillText(q.txt, q.x, q.y); } ctx.globalAlpha = 1;
  if (hint) { const a = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, a); ctx.font = `700 ${Math.round(14 * s)}px ${BC}`; const lines = wrapText(hint.txt, W - 50), lh = 17 * s, hh = lines.length * lh + 14, ww = W - 30, hy = (G && G.job ? L.sy - 10 : H * 0.5) - hh / 2;
    fillR(W / 2 - ww / 2, hy - hh / 2, ww, hh, 12, 'rgba(8,24,40,.95)'); ctx.strokeStyle = '#ffb21e'; ctx.lineWidth = 1.5; rrect(W / 2 - ww / 2, hy - hh / 2, ww, hh, 12); ctx.stroke(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, hy - hh / 2 + 7 + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,60,60,${FX.red * 0.18})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); } }
function driveCard(G, L, now) { const s = L.s, P = phoneRect(L), c = G.driving; if (!c) return; fillR(P.x, P.y, P.w, 120 * s, 18, 'rgba(10,22,36,.94)'); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.font = `700 ${Math.round(12 * s)}px ${BC}`; ctx.fillText('ON THE WAY TO', P.x + 16, P.y + 20 * s); ctx.fillStyle = '#fff'; ctx.font = `800 ${Math.round(17 * s)}px ${NU}`; ctx.fillText(`${c.addr}`, P.x + 16, P.y + 44 * s);
  ctx.fillStyle = '#9fd4f0'; ctx.font = `700 ${Math.round(13 * s)}px ${NU}`; ctx.fillText(`${ICON[c.job.id] || ''} “${c.say}”`, P.x + 16, P.y + 70 * s); const p = 1 - G.drive / G.driveT; fillR(P.x + 16, P.y + 94 * s, P.w - 32, 8 * s, 4 * s, 'rgba(255,255,255,.12)'); fillR(P.x + 16, P.y + 94 * s, (P.w - 32) * clamp(p, 0, 1), 8 * s, 4 * s, '#ffb21e'); }
function receipt(L, now) { const s = L.s, t = lastPaid.t, a = Math.min(1, t / 0.15, (1.8 - t) / 0.3), y = L.by + L.bh * 0.32 - Math.max(0, 1 - t * 5) * 30 * s; ctx.globalAlpha = Math.max(0, a);
  fillR(W / 2 - 110 * s, y - 50 * s, 220 * s, 100 * s, 14, '#fffdf4'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (lastPaid.lost) { ctx.fillStyle = '#c03a2a'; ctx.font = `${Math.round(18 * s)}px ${TF}`; ctx.fillText(lastPaid.title, W / 2, y - 14 * s); ctx.fillStyle = '#5a5a5a'; ctx.font = `700 ${Math.round(13 * s)}px ${NU}`; ctx.fillText(lastPaid.sub, W / 2, y + 16 * s); }
  else { ctx.fillStyle = '#2a7a3a'; ctx.font = `${Math.round(28 * s)}px ${TF}`; ctx.fillText('+$' + lastPaid.pay, W / 2, y - 16 * s); ctx.fillStyle = '#e8a010'; ctx.font = `${Math.round(18 * s)}px sans-serif`; ctx.fillText('★'.repeat(lastPaid.stars) + '☆'.repeat(3 - lastPaid.stars), W / 2, y + 12 * s);
    ctx.fillStyle = '#5a5a5a'; ctx.font = `700 ${Math.round(12 * s)}px ${NU}`; ctx.fillText(lastPaid.tip ? `incl. $${lastPaid.tip} tip — “${lastPaid.thanks}”` : `“${lastPaid.thanks}”`, W / 2, y + 36 * s); }
  ctx.globalAlpha = 1; }
// ---------- what each happening looks and sounds like ----------
const THANKS = ['Lifesaver!', 'Thank you so much!', 'Brilliant work!', 'You\'re a star!', 'Quick and tidy!', 'Best plumber in town!', 'Phew, thank you!', 'Magic!'];
function onEvent(G, e) { const L = lay(), s = L.s;
  switch (e.k) {
    case 'start': say(`DAY ${G.N}`, W / 2, L.top + 90 * s, '#fff', 30); say(`Make $${G.cfg.target} by 5 pm`, W / 2, L.top + 124 * s, '#ffd36a', 15); sfx.start(); if (G.N <= 1) tip('how', 'Tap a call to drive there. Make the day\'s money before 5 pm.', 3.4); break;
    case 'ring': sfx.ring(); ringT = 0.6; break;
    case 'drive': sfx.van(); break;
    case 'arrive': HOUSE.key = ''; sfx.door(); if (e.call.job.flood) { FX.red = 0.8; sfx.alarm(); } if (G.N <= 2 && !G.lesson) tip('look', 'Tap a part of the house to walk over and look at it.', 3); if (e.call.job.flood) tip('flood', 'Water everywhere! Find the stopcock by the meter, downstairs, and shut it off first.', 3.6); break;
    case 'walk': sfx.step(); break;
    case 'seen': if (e.bad) sfx.found(); else sfx.fine(); break;
    case 'fix': sfx.click(); if (e.kind === 'pump') tip('pump', 'Tap each time the yellow ring closes on the white circle.', 3); if (e.kind === 'feed') tip('feed', 'Hold to feed the snake in. On RED, let go, or it kinks!', 3.2); break;
    case 'press': break;
    case 'plunge': { const [cx, cy] = gaugeAt(L); sfx.plunge(e.n); sparks(cx, cy, 6, '#7cc8ff', 140 * s); vibe(HAP.tick); break; }
    case 'fixmiss': sfx.miss(); if (e.why === 'beat') say('off beat', W / 2, L.sy + 70 * s, '#ffb4a8', 14); if (e.why === 'short') say('not enough', W / 2, L.sy + 70 * s, '#ffb4a8', 14); if (e.why === 'off') say('not quite', W / 2, L.sy + 70 * s, '#ffb4a8', 14); if (e.why === 'drop') say('missed the gap', W / 2, L.sy + 70 * s, '#ffb4a8', 14); break;
    case 'kink': sfx.kink(); FX.shake = 6; break;
    case 'snag': sfx.snag(); break;
    case 'over': sfx.crack(); FX.shake = 8; say({ 'Light pilot': 'TOO LONG!', 'Thaw pipe': 'TOO HOT!', 'Thaw': 'TOO HOT!', 'Top up pressure': 'TOO MUCH!', 'Bleed air': 'SPLASH!' }[e.name] || 'TOO TIGHT!', W / 2, L.sy + 70 * s, '#ff8a7a', 22); break;
    case 'fixpart': sfx.good(); say(`${e.n} / ${e.need}`, W / 2, L.sy + 70 * s, '#a8f0b8', 18); vibe(HAP.light); break;
    case 'fixed': { sfx.good(); vibe(HAP.light); const [px, py] = spot(G, e.part); sparks(L.X(px), L.Y(py), 14, '#ffd36a', 160 * s); say(e.name === 'Shut off' ? 'WATER OFF!' : 'FIXED!', L.X(px), L.Y(py) - 30 * s, '#a8f0b8', 18); break; }
    case 'mistake': sfx.wrong(); FX.shake = 5; if (e.why === 'spray') { say('SHUT THE WATER OFF FIRST!', W / 2, L.by + L.bh * 0.4, '#ff8a7a', 15); FX.red = 0.8; sfx.alarm(); } else say(e.n ? `Wrong again! −patience` : 'Wrong fix!', W / 2, L.by + L.bh * 0.4, '#ff8a7a', 18); break;
    case 'paid': lastPaid = { t: 0, pay: e.pay, tip: e.tip, stars: e.stars, thanks: THANKS[(Math.random() * THANKS.length) | 0] }; sfx.cash(e.stars); FX.flash = 0.3; vibe(e.stars === 3 ? HAP.best : HAP.light); for (let i = 0; i < 24; i++) sparks(W / 2, L.by + L.bh * 0.32, 1, ['#ffd36a', '#7be08a', '#fff'][i % 3], 260 * s);
      if (!HEADLESS && e.stars === 3) { const notes = store.get('notes', []) || []; notes.push({ who: e.who, job: e.job, d: G.N }); store.set('notes', notes.slice(-200)); } break;
    case 'joblost': lastPaid = { t: 0, lost: true, title: { flood: 'FLOODED OUT', angry: 'SENT AWAY', left: 'GAVE UP' }[e.why], sub: { flood: 'The room filled up. No pay.', angry: '“Get out! I\'ll call someone else.”', left: 'No pay for this one.' }[e.why] }; sfx.lose(); FX.red = 1; break;
    case 'expired': if (G.phase === 'board') say('A call went elsewhere', W / 2, L.top + 170 * s, 'rgba(255,255,255,.7)', 12); break;
    case 'five': say('5 PM!', W / 2, L.top + 120 * s, '#ff8a7a', 40); sfx.bell(); break;
    case 'goal': say('DAY\'S MONEY MADE!', W / 2, L.top + 120 * s, '#ffd36a', 24); FX.flash = 0.6; sfx.goal(); vibe(HAP.best); for (let i = 0; i < 40; i++) { const a = Math.random() * TAU; PT.push({ x: W / 2, y: L.top + 120 * s, vx: Math.cos(a) * 320, vy: Math.sin(a) * 320 - 160, life: 1.1, t: 0, col: ['#ffd36a', '#7be08a', '#9fd4f0'][i % 3], r: 3.5, g: 520 }); } break;
    case 'lessonmiss': coachMiss(); sfx.wrong(); break;
    case 'lessonnext': if (e.first) hint = null; break;
    case 'lessonok': sfx.cash(3); say(`${e.n} / ${e.need}`, W / 2, L.by + L.bh * 0.35, '#ffd36a', 26); break;
    case 'lessondone': say('YOU\'VE GOT IT!', W / 2, L.by + L.bh * 0.35, '#ffd36a', 26); sfx.goal(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); break;
    case 'lost': sfx.lose(); break;
  } }
