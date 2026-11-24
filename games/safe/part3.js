// ===================== DRAW + JUICE: the safe (2D on purpose: a dial reads best face on) =====================
// A dark room at night, a steel safe door filling the screen, its big dial in the middle with a red pointer at the top. The
// dial turns with your thumb, one to one. A click pulses the listening strip gold and leaves a chalk mark on the dial. The rim
// glows green while you turn softly enough to feel, orange when too fast. Noise on the left (the dog), the alarm on the right.
// The guard: light under the door and footsteps, then a torch beam sweeping the room.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, PT = [], TXT = [];
let hint = null, pulse = 0, boltT = [], doorT = 0, jam = 0;
function sparks(x, y, n, col, sp = 220) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random()); PT.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.5 + Math.random() * 0.4, t: 0, col, r: 2 + Math.random() * 2.5 }); } }
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
const S1 = () => Math.min(W, H * 0.6) / 390;
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of String(t).split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { coachPanel(G); }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 40); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 2); pulse = Math.max(0, pulse - dt * 2.5); jam = Math.max(0, jam - dt * 3);
  for (const p of PT) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt; } for (let i = PT.length - 1; i >= 0; i--) if (PT[i].t > PT[i].life) PT.splice(i, 1);
  for (const t of TXT) { t.t += dt; t.y -= dt * 18; } while (TXT.length && TXT[0].t > 1.5) TXT.shift(); if (hint) { hint.t += dt; if (hint.t > hint.secs) hint = null; }
  boltT = boltT.map(b => Math.min(1, b + dt * 4)); if (G && G.k >= G.n) doorT = Math.min(1, doorT + dt * 1.3); else doorT = 0; }
// where everything is
function lay() { const s = S1(), R = Math.min(W * 0.4, H * 0.22), cx = W / 2, cy = H * 0.5;
  return { s, R, cx, cy, door: { x: cx - R * 1.45, y: cy - R * 1.47, w: R * 2.9, h: R * 2.9 }, set: { x: W / 2 - 90 * s, y: H * 0.81, w: 180 * s, h: 58 * s }, strip: { x: 24, y: 0, w: W - 48, h: 34 * s } }; }
const angOf = (G, i) => -Math.PI / 2 + (i - G.pos) / G.cfg.M * TAU;
function draw(now) { ctx.setTransform(DPR, 0, 0, DPR, 0, 0); const L = lay(), s = L.s, g = G, P = PLACES[g ? g.place : 0];
  // the room
  const rk = W + 'x' + H + ':' + DPR + ':' + (g ? g.place : 0); if (draw.rk !== rk) { draw.rk = rk; const oc = draw.oc || (draw.oc = document.createElement('canvas')); oc.width = cv.width; oc.height = cv.height; const o = oc.getContext('2d'); o.setTransform(DPR, 0, 0, DPR, 0, 0);      /* the room never changes: painted once */
    o.fillStyle = P.wall; o.fillRect(0, 0, W, H); o.globalAlpha = 0.08; o.fillStyle = '#fff'; for (let x = 0; x < W; x += 26 * s) o.fillRect(x, 0, 2, H * 0.78); o.globalAlpha = 1;
    o.fillStyle = P.trim; o.fillRect(0, H * 0.78, W, 6); o.fillStyle = '#1a120c'; o.fillRect(0, H * 0.78 + 6, W, H); const vg = o.createRadialGradient(W / 2, H * 0.5, 40, W / 2, H * 0.5, H * 0.75); vg.addColorStop(0, 'rgba(255,230,180,.10)'); vg.addColorStop(1, 'rgba(0,0,0,.7)'); o.fillStyle = vg; o.fillRect(0, 0, W, H); }
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(draw.oc, 0, 0); ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.save(); if (FX.shake > 0) ctx.translate((Math.random() - 0.5) * FX.shake, (Math.random() - 0.5) * FX.shake);
  if (g) { drawSafe(g, L, now); drawGuard(g, L, now); hud(g, L, now); }
  for (const p of PT) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1; ctx.restore();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; for (const q of TXT) { const a = q.t < 1.1 ? 1 : 1 - (q.t - 1.1) / 0.4; ctx.globalAlpha = Math.max(0, a); ctx.font = `${Math.round(q.size * s)}px ${TF}`; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.strokeText(q.txt, q.x, q.y); ctx.fillStyle = q.col; ctx.fillText(q.txt, q.x, q.y); } ctx.globalAlpha = 1;
  if (hint) { const a = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, a); ctx.font = `700 ${Math.round(14 * s)}px ${BC}`; const lines = wrapText(hint.txt, W - 50), lh = 17 * s, hh = lines.length * lh + 14, ww = W - 30;
    ctx.fillStyle = 'rgba(10,14,20,.93)'; rrect(W / 2 - ww / 2, H * 0.935 - hh / 2, ww, hh, 10); ctx.fill(); ctx.fillStyle = '#ffe3a0'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.935 - hh / 2 + 7 + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,30,30,${FX.red * 0.25})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,250,220,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); } }
function drawSafe(g, L, now) { const { R, cx, cy, s } = L, D = L.door, c = g.cfg;
  // inside (seen when the door opens): the loot
  ctx.fillStyle = '#0c0c10'; rrect(D.x, D.y, D.w, D.h, 14); ctx.fill();
  if (doorT > 0) { ctx.font = `${Math.round(R * 0.5)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const lt = SAFES[c.kind].loot; for (let i = 0; i < 6; i++) ctx.fillText(lt, D.x + D.w * (0.25 + 0.25 * (i % 3)), D.y + D.h * (0.4 + 0.25 * Math.floor(i / 3))); }
  ctx.save(); const sw = 1 - easeOut(doorT) * 0.85; ctx.translate(D.x, 0); ctx.scale(sw, 1); ctx.translate(-D.x, 0);
  const st = ctx.createLinearGradient(D.x, D.y, D.x + D.w, D.y + D.h); st.addColorStop(0, '#6a7078'); st.addColorStop(0.5, '#3a4048'); st.addColorStop(1, '#22262c'); ctx.fillStyle = st; rrect(D.x, D.y, D.w, D.h, 14); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.15)'; ctx.lineWidth = 3; rrect(D.x + 10, D.y + 10, D.w - 20, D.h - 20, 10); ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,.4)'; for (const [fx, fy] of [[0.06, 0.05], [0.94, 0.05], [0.06, 0.95], [0.94, 0.95]]) { ctx.beginPath(); ctx.arc(D.x + D.w * fx, D.y + D.h * fy, 5 * s, 0, TAU); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.font = `${Math.round(13 * s)}px ${TF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(SAFES[c.kind].name, cx, D.y + 16 * s);
  // the bolts: one light each
  const bw = Math.min(34 * s, D.w * 0.7 / g.n); for (let i = 0; i < g.n; i++) { const bx = cx + (i - (g.n - 1) / 2) * bw, by = cy + R * 1.26, on = i < g.k; ctx.fillStyle = on ? '#5ae08a' : 'rgba(0,0,0,.5)'; ctx.beginPath(); ctx.arc(bx, by, 9 * s, 0, TAU); ctx.fill(); ctx.strokeStyle = on ? '#c8ffd8' : 'rgba(255,255,255,.25)'; ctx.lineWidth = 2; ctx.stroke(); }
  // the dial
  const fast = g.spd > c.feel, rim = g.spd < 0.3 ? 'rgba(255,255,255,.15)' : fast ? 'rgba(255,150,60,.8)' : 'rgba(110,240,150,.7)';
  ctx.save(); if (jam > 0) ctx.translate(Math.sin(now * 80) * jam * 5, 0);
  ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.arc(cx + 4, cy + 6, R * 1.08, 0, TAU); ctx.fill();
  ctx.strokeStyle = rim; ctx.lineWidth = 6 * s; ctx.beginPath(); ctx.arc(cx, cy, R * 1.08, 0, TAU); ctx.stroke();
  const dg = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R); dg.addColorStop(0, '#2a2e34'); dg.addColorStop(1, '#0e1014'); ctx.fillStyle = dg; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
  const M = c.M, step10 = M <= 50 ? 5 : 10; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let i = 0; i < M; i++) { const a = angOf(g, i), big = i % step10 === 0, r0 = R * (big ? 0.84 : 0.9); ctx.strokeStyle = big ? '#f0ece0' : 'rgba(240,236,224,.6)'; ctx.lineWidth = big ? 2.5 : 1.3; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a) * R * 0.97, cy + Math.sin(a) * R * 0.97); ctx.stroke();
    if (big) { ctx.fillStyle = '#f0ece0'; ctx.font = `${Math.round(R * 0.13)}px ${TF}`; ctx.fillText(String(i), cx + Math.cos(a) * R * 0.71, cy + Math.sin(a) * R * 0.71); } }
  if (g.mark != null) { const a = angOf(g, g.mark); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5 * s; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * R * 0.98, cy + Math.sin(a) * R * 0.98); ctx.lineTo(cx + Math.cos(a) * R * 1.16, cy + Math.sin(a) * R * 1.16); ctx.stroke(); ctx.lineCap = 'butt';
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * R * 1.22, cy + Math.sin(a) * R * 1.22, 4 * s, 0, TAU); ctx.fill(); }
  // the knob in the middle, and the number under the pointer
  const kg = ctx.createRadialGradient(cx - R * 0.08, cy - R * 0.08, 2, cx, cy, R * 0.34); kg.addColorStop(0, '#8a9098'); kg.addColorStop(1, '#2a2e34'); ctx.fillStyle = kg; ctx.beginPath(); ctx.arc(cx, cy, R * 0.34, 0, TAU); ctx.fill();
  const rd = reading(g), onMark = g.mark != null && rd === g.mark; ctx.fillStyle = onMark ? '#ffe08a' : '#fff'; ctx.font = `${Math.round(R * 0.24)}px ${TF}`; ctx.fillText(String(rd), cx, cy + 2);
  ctx.restore();
  // the pointer
  ctx.fillStyle = '#e83a3a'; ctx.beginPath(); ctx.moveTo(cx, cy - R * 1.0); ctx.lineTo(cx - 10 * s, cy - R * 1.2); ctx.lineTo(cx + 10 * s, cy - R * 1.2); ctx.closePath(); ctx.fill();
  if (pulse > 0) { ctx.strokeStyle = `rgba(255,214,90,${pulse})`; ctx.lineWidth = 4 * s; ctx.beginPath(); ctx.arc(cx, cy, R * (1.1 + (1 - pulse) * 0.3), 0, TAU); ctx.stroke(); }
  ctx.restore();
  // SET
  if (g.k < g.n) { const B = L.set; ctx.fillStyle = onMark ? '#e8c25a' : 'rgba(232,194,90,.55)'; rrect(B.x, B.y, B.w, B.h, 16); ctx.fill(); ctx.fillStyle = '#1d1204'; ctx.font = `${Math.round(24 * s)}px ${TF}`; ctx.fillText('SET', B.x + B.w / 2, B.y + B.h / 2 + 2); } }
function drawGuard(g, L, now) { const s = L.s, gd = g.gd; if (!g.useGuard || gd.s === 'away') return;
  if (gd.s === 'warn') { const u = 1 - gd.t / g.cfg.warn; ctx.fillStyle = `rgba(255,220,140,${0.15 + u * 0.35})`; ctx.fillRect(0, H * 0.78, W, 6);
    ctx.font = `${Math.round(18 * s)}px sans-serif`; ctx.textAlign = 'center'; ctx.globalAlpha = 0.5 + 0.5 * Math.sin(now * 8); ctx.fillText('👣', W * (0.1 + u * 0.3), H * 0.86); ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffd36a'; ctx.font = `${Math.round(22 * s)}px ${TF}`; ctx.fillText('FOOTSTEPS…', W / 2, H * 0.135); }
  if (gd.s === 'torch') { const u = 1 - gd.t / g.cfg.torch, bx = W * (-0.1 + u * 1.2), by = H * 0.5; const tg = ctx.createRadialGradient(bx, by, 10, bx, by, W * 0.55); tg.addColorStop(0, 'rgba(255,240,180,.55)'); tg.addColorStop(1, 'rgba(255,240,180,0)'); ctx.fillStyle = tg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff'; ctx.font = `${Math.round(26 * s)}px ${TF}`; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.strokeText('KEEP STILL', W / 2, H * 0.135); ctx.fillText('KEEP STILL', W / 2, H * 0.135); } }
function hud(G, L, now) { const s = L.s, c = G.cfg; let top = 48 * s;
  if (G.lesson) top = lessonPanel(G) + 6; else {
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.font = `${Math.round(16 * s)}px ${TF}`; ctx.fillText(PLACES[G.place].name, 14, 52 * s);
    ctx.font = `700 ${Math.round(11 * s)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillText(`BOLTS ${G.k} OF ${G.n}${c.relock ? ' · RELOCKS' : ''}`, 14, 70 * s);
    const m = Math.floor(G.left / 60), sec = Math.floor(G.left % 60), low = G.left < 20; ctx.textAlign = 'right'; ctx.fillStyle = low ? '#ffb070' : '#fff'; ctx.font = `${Math.round(16 * s)}px ${TF}`; ctx.fillText(`🌙 ${m}:${String(sec).padStart(2, '0')}`, W - 14, 52 * s);
    ctx.font = `700 ${Math.round(11 * s)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillText('UNTIL DAWN', W - 14, 70 * s); top = 84 * s; }
  // the listening strip: every number that passes is a tick; the click is a gold spike
  const S = L.strip; S.y = top + 4; ctx.fillStyle = 'rgba(0,0,0,.45)'; rrect(S.x, S.y, S.w, S.h, 8); ctx.fill(); const mid = S.y + S.h / 2;
  ctx.strokeStyle = 'rgba(120,220,160,.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let i = 0; i <= 60; i++) { const x = S.x + 6 + (S.w - 12) * i / 60, a = Math.min(1, G.spd / Math.max(1, c.feel)) * 3 * s; const y = mid + Math.sin(i * 1.7 + now * 30) * a * Math.random(); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
  for (const w of G.wave) { const x = S.x + S.w - 6 - (G.t - w.t) / 3 * (S.w - 12), h = w.big * S.h * 0.45; ctx.strokeStyle = w.big > 0.5 ? '#ffd040' : 'rgba(255,255,255,.4)'; ctx.lineWidth = w.big > 0.5 ? 4 : 2; ctx.beginPath(); ctx.moveTo(x, mid - h); ctx.lineTo(x, mid + h); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.font = `700 ${Math.round(10 * s)}px ${BC}`; ctx.textAlign = 'left'; ctx.fillText(G.spd > c.feel ? 'TOO FAST TO FEEL' : 'LISTENING', S.x + 8, S.y + 9 * s);
  // noise (left) and alarm (right)
  const bh = H * 0.3, by = L.cy - bh / 2, bwid = 12 * s; for (const [x, v, col, ic] of [[12, G.noise, '#ffb040', '🐕'], [W - 12 - bwid, G.alarm, '#ff4a4a', '🚨']]) {
    ctx.fillStyle = 'rgba(0,0,0,.5)'; rrect(x, by, bwid, bh, 6); ctx.fill(); ctx.fillStyle = col; const f = clamp(v, 0, 1) * bh; rrect(x, by + bh - f, bwid, f, 6); ctx.fill();
    ctx.font = `${Math.round(16 * s)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText(ic, x + bwid / 2, by - 14 * s); }
  ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.font = `700 ${Math.round(9 * s)}px ${BC}`; ctx.fillText('NOISE', 12 + bwid / 2, by + bh + 10 * s); ctx.fillText('ALARM', W - 12 - bwid / 2, by + bh + 10 * s); }
function onEvent(G, e) { const L = lay(), s = L.s;
  switch (e.k) {
    case 'start': say(PLACES[G.place].name.toUpperCase(), W / 2, H * 0.935, '#fff', 18); sfx.creak(); boltT = []; doorT = 0; if (G.N <= 1) tip('how', 'Drag round the dial slowly. Listen for the click.', 3); break;
    case 'tick': sfx.tick(); break;
    case 'click': pulse = 1; sfx.thunk(); vibe(HAP.light); say('CLICK', L.cx, L.cy - L.R * 1.35, '#ffd040', 20); tip('mark', 'Turn back until the chalk mark is under the red pointer, then tap SET.', 3.4); break;
    case 'muffle': sfx.muffle(); tip('fast', 'Too fast to feel the click. Slow down.', 2.6); break;
    case 'set': sfx.bolt(e.i); vibe(HAP.light); sparks(L.cx + (e.i - (e.of - 1) / 2) * Math.min(34 * s, L.door.w * 0.7 / e.of), L.cy + L.R * 1.26, 14, '#7affa8'); say(e.i + 1 >= e.of ? '' : 'BOLT ' + (e.i + 1), L.cx, L.cy + L.R * 1.55, '#7affa8', 20); break;
    case 'open': FX.flash = 0.6; sfx.open(); say('OPEN!', L.cx, L.cy - L.R * 1.35, '#ffe08a', 32); break;
    case 'wrong': jam = 1; FX.shake = 6; sfx.jam(); say('JAMMED', L.cx, L.cy - L.R * 1.35, '#ffb4a8', 22); tip('wrong', 'Only SET when the chalk mark is under the pointer.', 3); break;
    case 'relock': say('A BOLT RELOCKED', W / 2, H * 0.3, '#ffb4a8', 18); break;
    case 'charm': say('LUCKY!', W / 2, H * 0.3, '#ffe08a', 22); sfx.chime(); break;
    case 'bark': FX.red = 0.8; FX.shake = 8; sfx.bark(); say('WOOF!', 56 * s, L.cy - H * 0.17, '#ffb040', 22); tip('bark', 'Turning fast is noisy. Keep the noise bar down.', 3); break;
    case 'warn': sfx.steps(); tip('guard', 'Footsteps! Lift your thumb and keep still when the torch comes.', 3); break;
    case 'torch': sfx.torch(); break;
    case 'gone': say('PHEW', W / 2, H * 0.3, '#cfe8ff', 20); break;
    case 'spotted': FX.red = 1; FX.shake = 10; sfx.shout(); say('HEY!', W / 2, H * 0.3, '#ff6a5a', 32); break;
    case 'alarm': sfx.siren(); FX.red = 1.5; break;
    case 'lessonnext': if (e.first) hint = null; say('FIRST, A LESSON', W / 2, H * 0.935, '#ffd36a', 22); break;
    case 'lessonmiss': say('TRY AGAIN', W / 2, H * 0.935, '#ffd0c4', 22); coachMiss(); break;
    case 'lessondone': say('YOU\'VE GOT IT!', W / 2, H * 0.935, '#ffd36a', 24); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); vibe(HAP.best); for (let i = 0; i < 50; i++) { const a = Math.random() * TAU; PT.push({ x: L.cx, y: L.cy, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300 - 200, life: 1.2, t: 0, col: ['#ffd040', '#7affa8', '#fff'][i % 3], r: 3 }); } break;
    case 'lost': sfx.lose(); break;
  } }
