// ===================== DRAW + JUICE: the paper (2D on purpose: paper folding is flat, and reads best from above) =====================
// A wooden table under soft light. The paper: coloured on one side, cream on the other, each layer a little darker below the
// one on top, creases drawn as fine lines, a soft shadow under it. While your thumb is down the paper is folded live along
// the crease halfway to your thumb, so the corner follows you. The faint dashed outline is the shape to make; a glowing ring
// marks the corner to take and a dot where it goes (early levels). A fold snaps neat with a crisp crease; a bad one shakes and
// leaves a crumple. The finished animal gets eyes, hops, and says its name.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, PT = [], TXT = [];
let hint = null, anim = null, alive = null, crumT = 0;
function sparks(x, y, n, col, sp = 220) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random()); PT.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.5 + Math.random() * 0.4, t: 0, col, r: 2 + Math.random() * 2.5 }); } }
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS || !(G && G.lesson)) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
const S1 = () => Math.min(W, H * 0.6) / 390;
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of String(t).split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { coachPanel(G); }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 40); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 2);
  for (const p of PT) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 400 * dt; } for (let i = PT.length - 1; i >= 0; i--) if (PT[i].t > PT[i].life) PT.splice(i, 1);
  for (const t of TXT) { t.t += dt; t.y -= dt * 18; } while (TXT.length && TXT[0].t > 1.5) TXT.shift(); if (hint) { hint.t += dt; if (hint.t > hint.secs) hint = null; }
  if (anim) { anim.t += dt; if (anim.t >= 0.32) anim = null; } if (alive) alive.t += dt; crumT = Math.max(0, crumT - dt); }
// paper units to the screen: the square is 2 across
function lay() { const s = S1(), U = Math.min(W * 0.3, H * 0.17), cx = W / 2, cy = H * 0.52; return { s, U, cx, cy, toS: p => [cx + p[0] * U, cy - p[1] * U], toP: (x, y) => [(x - cx) / U, (cy - y) / U] }; }
function shade(hex, k) { const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255, f = v => Math.round(clamp(v * k, 0, 255)); return `rgb(${f(r)},${f(g)},${f(b)})`; }
function drawFaces(faces, L, col, o = {}) { if (!faces.length) return; const top = Math.max(...faces.map(f => f.z)), bot = Math.min(...faces.map(f => f.z));
  // the shadow
  ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.28)'; for (const f of faces) { ctx.beginPath(); f.pts.forEach((p, i) => { const q = L.toS(p); i ? ctx.lineTo(q[0] + 5, q[1] + 7) : ctx.moveTo(q[0] + 5, q[1] + 7); }); ctx.closePath(); ctx.fill(); } ctx.restore();
  for (const f of faces) { const lv = top === bot ? 1 : 0.92 + 0.08 * (f.z - bot) / (top - bot), base = f.up === 0 ? col : '#f6f1e6';
    ctx.beginPath(); f.pts.forEach((p, i) => { const q = L.toS(p); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); ctx.closePath(); ctx.fillStyle = shade(base, lv * (f.moving && o.lift ? 1.06 : 1)); ctx.fill();
    ctx.strokeStyle = 'rgba(40,30,20,.35)'; ctx.lineWidth = 1.2; ctx.stroke(); } }
function ghost(faces, L) { ctx.save(); ctx.setLineDash([6, 5]); ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2; ctx.fillStyle = 'rgba(255,255,255,.07)';
  for (const f of faces) { ctx.beginPath(); f.pts.forEach((p, i) => { const q = L.toS(p); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); ctx.closePath(); ctx.fill(); ctx.stroke(); } ctx.restore(); }
function draw(now) { ctx.setTransform(DPR, 0, 0, DPR, 0, 0); const L = lay(), s = L.s, g = G, P = PLACES[g ? g.place : 0];
  const rk = W + 'x' + H + ':' + DPR + ':' + (g ? g.place : 0); if (draw.rk !== rk) { draw.rk = rk; const oc = draw.oc || (draw.oc = document.createElement('canvas')); oc.width = cv.width; oc.height = cv.height; const o = oc.getContext('2d'); o.setTransform(DPR, 0, 0, DPR, 0, 0);      /* the table never changes: painted once */
    o.fillStyle = P.table; o.fillRect(0, 0, W, H); const R0 = rng(7); for (let i = 0; i < 70; i++) { o.strokeStyle = `rgba(0,0,0,${0.04 + R0() * 0.06})`; o.lineWidth = 1 + R0() * 2; const y = R0() * H; o.beginPath(); o.moveTo(0, y); o.bezierCurveTo(W * 0.3, y + (R0() - 0.5) * 30, W * 0.7, y + (R0() - 0.5) * 30, W, y + (R0() - 0.5) * 20); o.stroke(); }
    const vg = o.createRadialGradient(W / 2, H * 0.5, 40, W / 2, H * 0.5, H * 0.75); vg.addColorStop(0, 'rgba(255,240,210,.16)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); o.fillStyle = vg; o.fillRect(0, 0, W, H); }
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(draw.oc, 0, 0); ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.save(); if (FX.shake > 0) ctx.translate((Math.random() - 0.5) * FX.shake, (Math.random() - 0.5) * FX.shake);
  if (g) { const m = MODELS[g.mi], st = stepNow(g);
    let faces = g.faces; if (anim) faces = foldFaces(anim.from, anim.ln, easeOut(clamp(anim.t / 0.32, 0, 1))); else if (g.drag && Math.hypot(g.drag.b[0] - g.drag.a[0], g.drag.b[1] - g.drag.a[1]) > 0.04) faces = foldFaces(g.faces, lineOf(g.drag.a, g.drag.b), 1);
    let hop = 0, sc = 1; if (alive) { const u = alive.t; hop = Math.abs(Math.sin(u * 7)) * Math.max(0, 1 - u / 1.6) * 22 * s; sc = 1 + 0.06 * Math.max(0, 1 - u * 2); }
    ctx.save(); ctx.translate(L.cx, L.cy - hop); ctx.scale(sc, sc); ctx.translate(-L.cx, -L.cy); drawFaces(faces, L, m.col, { lift: !!g.drag });
    if (crumT > 0 || g.crum) { ctx.strokeStyle = 'rgba(60,40,20,.25)'; ctx.lineWidth = 1; const R0 = rng(g.crum * 31 + g.mi); for (let i = 0; i < g.crum * 5; i++) { const a = [(R0() - 0.5) * 1.6, (R0() - 0.5) * 1.6], b = [a[0] + (R0() - 0.5) * 0.7, a[1] + (R0() - 0.5) * 0.7], p = L.toS(a), q = L.toS(b); ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); } }
    if (alive && alive.mi === g.mi) face(m, L, now);
    ctx.restore();
    if (st && !alive && !anim) ghost(foldFaces(g.faces, st.ln, 1), L);      /* the shape to make, drawn over the paper */
    // hints: the corner to take, and where it goes
    if (st && !g.drag && !anim && !alive && g.wait <= 0) { const pulse = 0.5 + 0.5 * Math.sin(now * 5);
      if (g.cfg.glow || g.lesson) { const p = L.toS(st.P); ctx.strokeStyle = `rgba(255,220,120,${0.5 + 0.5 * pulse})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p[0], p[1], (14 + pulse * 6) * s, 0, TAU); ctx.stroke(); }
      if (g.cfg.dot || (g.lesson && g.lesson.steps[g.lesson.i].id === 'fold')) { const q = L.toS(st.Q); ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.arc(q[0], q[1], 6 * s, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(q[0], q[1], G.cfg.tol * L.U * 0.3 + 6, 0, TAU); ctx.stroke(); } }
    hud(g, L, now); }
  for (const p of PT) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1; ctx.restore();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; for (const q of TXT) { const a = q.t < 1.1 ? 1 : 1 - (q.t - 1.1) / 0.4; ctx.globalAlpha = Math.max(0, a); ctx.font = `${Math.round(q.size * s)}px ${TF}`; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.strokeText(q.txt, q.x, q.y); ctx.fillStyle = q.col; ctx.fillText(q.txt, q.x, q.y); } ctx.globalAlpha = 1;
  if (hint) { const a = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, a); ctx.font = `700 ${Math.round(14 * s)}px ${BC}`; const lines = wrapText(hint.txt, W - 50), lh = 17 * s, hh = lines.length * lh + 14, ww = W - 30;
    ctx.fillStyle = 'rgba(30,20,10,.92)'; rrect(W / 2 - ww / 2, H * 0.88 - hh / 2, ww, hh, 10); ctx.fill(); ctx.fillStyle = '#ffe3a0'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.88 - hh / 2 + 7 + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,250,230,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); } }
// the finished animal comes to life: eyes that blink, a nose, whiskers, a spout or a bubble
function face(m, L, now) { const s = L.s, blink = (now % 3.2) < 0.12; for (const e of m.eyes || []) { const p = L.toS(e); ctx.fillStyle = '#1a1410'; if (blink) ctx.fillRect(p[0] - 5 * s, p[1] - 1, 10 * s, 2.5); else { ctx.beginPath(); ctx.arc(p[0], p[1], 5 * s, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p[0] + 1.5 * s, p[1] - 1.5 * s, 1.6 * s, 0, TAU); ctx.fill(); } }
  if (m.nose) { const p = L.toS(m.nose); ctx.fillStyle = '#1a1410'; ctx.beginPath(); ctx.arc(p[0], p[1], 4.5 * s, 0, TAU); ctx.fill(); if (m.whisk) { ctx.strokeStyle = '#1a1410'; ctx.lineWidth = 1.3; for (const sx of [-1, 1]) for (const dy of [-4, 2]) { ctx.beginPath(); ctx.moveTo(p[0] + sx * 7 * s, p[1] + dy * s * 0.5); ctx.lineTo(p[0] + sx * 34 * s, p[1] + dy * s * 1.6); ctx.stroke(); } } }
  if (m.spout) { const p = L.toS(m.spout), u = (now * 1.5) % 1; ctx.strokeStyle = 'rgba(200,235,255,.9)'; ctx.lineWidth = 3; for (const a of [-0.5, 0, 0.5]) { ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.quadraticCurveTo(p[0] + a * 20 * s, p[1] - 30 * s * (0.6 + u * 0.4), p[0] + a * 34 * s, p[1] - 22 * s); ctx.stroke(); } }
  if (m.bubble) { const p = L.toS(m.bubble), u = (now * 0.8) % 1; ctx.strokeStyle = 'rgba(220,240,255,.8)'; ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(p[0] + i * 6 * s, p[1] - ((u + i * 0.33) % 1) * 50 * s, (3 + i * 2) * s, 0, TAU); ctx.stroke(); } } }
function hud(G, L, now) { const s = L.s, c = G.cfg, m = MODELS[G.mi];
  if (G.lesson) { lessonPanel(G); return; }
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.font = `${Math.round(20 * s)}px ${TF}`; ctx.fillText(m.name, 14, 56 * s);
  ctx.font = `700 ${Math.round(12 * s)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillText(G.si < m.folds.length ? `FOLD ${G.si + 1} OF ${m.folds.length}${c.models.length > 1 ? ` · MODEL ${G.made.length + 1} OF ${c.models.length}` : ''}` : 'DONE!', 14, 78 * s);
  ctx.textAlign = 'right'; ctx.font = `${Math.round(18 * s)}px sans-serif`; let str = ''; for (let i = 0; i < c.crumples; i++) str += i < c.crumples - G.crum ? '📄' : '🗞️'; ctx.fillText(str, W - 14, 56 * s);
  ctx.font = `700 ${Math.round(11 * s)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillText('PAPER', W - 14, 78 * s); }
function onEvent(G, e) { const L = lay(), s = L.s;
  switch (e.k) {
    case 'start': say(PLACES[G.place].name.toUpperCase(), W / 2, H * 0.2, '#fff', 18); sfx.paper(); alive = null; if (G.N <= 1) tip('how', 'Drag the glowing corner onto the dot.', 3); break;
    case 'model': alive = null; anim = null; sfx.paper(); break;
    case 'fold': { anim = { from: e.from, ln: e.ln, t: 0 }; const lab = ['ROUGH', 'NEAT', 'PERFECT!'][e.g], col = ['#ffd0a0', '#e8f4ff', '#ffe08a'][e.g]; say(lab, W / 2, H * 0.24, col, e.g === 2 ? 28 : 22); sfx.crease(e.g); vibe(HAP.light);
      if (e.g === 2) { const p = L.toS(e.ln.p); sparks(p[0], p[1], 18, '#fff3c0'); } break; }
    case 'crumple': crumT = 0.6; FX.shake = 8; sfx.crumple(); say(e.n >= e.of ? '' : e.wrong ? 'OTHER WAY!' : 'NOT QUITE', W / 2, H * 0.24, '#ffb4a8', 22); tip('crum', e.wrong ? 'That folds the wrong flap: take the glowing corner.' : 'Make the paper fit the dashed outline, then let go.', 3); break;
    case 'takecorner': tip('corner', 'Start on the glowing corner.', 2.4); sfx.no(); break;
    case 'tear': FX.shake = 14; sfx.tear(); say('IT TORE!', W / 2, H * 0.24, '#ff8a7a', 28); break;
    case 'alive': alive = { mi: e.mi, t: 0 }; FX.flash = 0.5; sfx.alive(); say(`${MODELS[e.mi].name}!`, W / 2, H * 0.32, '#ffe08a', 32); for (let i = 0; i < 30; i++) { const a = Math.random() * TAU; PT.push({ x: L.cx, y: L.cy, vx: Math.cos(a) * 240, vy: Math.sin(a) * 240 - 150, life: 1, t: 0, col: [MODELS[e.mi].col, '#fff', '#ffe08a'][i % 3], r: 3 }); } vibe(HAP.best); break;
    case 'lessonnext': if (e.first) hint = null; say('FIRST, A LESSON', W / 2, H * 0.88, '#ffd36a', 22); break;
    case 'lessonmiss': say('TRY AGAIN', W / 2, H * 0.88, '#ffd0c4', 22); coachMiss(); break;
    case 'lessondone': say('LOVELY!', W / 2, H * 0.88, '#ffd36a', 24); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); break;
    case 'lost': sfx.lose(); break;
  } }
