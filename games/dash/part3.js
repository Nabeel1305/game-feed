
// ===================== THE VIEW: Beat Dash (2D on purpose: a side-on run reads best flat, like the original) =====================
// Neon on dark: the floor's glowing edge, black spikes and blocks with bright outlines, yellow pads and rings, blue portals.
// Everything pulses on the beat. The cube spins in the air and leaves a trail; a crash bursts it into squares. At the top:
// the run's progress (with the flags and your best), lives and the level.
const FX = { shake: 0, stop: 0, flash: 0, red: 0, pulse: 0 }, TXT = [], PARTS = [], TRAIL = [];
let hint0 = null;
const ui = { held: false, att: 1 };
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint0 = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 160, sq) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: 0.5 + Math.random() * 0.5, col, r: (2 + Math.random() * 3) * k, sq }); } if (PARTS.length > 300) PARTS.splice(0, PARTS.length - 300); }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2.5); FX.red = Math.max(0, FX.red - dt * 2); FX.pulse = Math.max(0, FX.pulse - dt * 4);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.3) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 400 * dt; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  for (const q of TRAIL) q.t += dt; while (TRAIL.length && TRAIL[0].t > 0.25) TRAIL.shift();
  if (hint0) { hint0.t += dt; if (hint0.t >= hint0.secs) hint0 = null; } }
function myCube() { if (typeof HEADLESS !== 'undefined' && HEADLESS) return CUBES[0]; const id = store.get('cube', 'classic'); return CUBES.find(q => q.id === id) || CUBES[0]; }
// the camera: one block is u pixels; the cube a fifth of the way across; the floor most of the way down
let CAMY = 0; function view(g) { const u = Math.min(W / 11, H / 15), gy = H * 0.7;      /* 22 Nov 2026: a little bigger and lower; the cube was tiny on an empty screen */ const want = g && g.s > 0 ? Math.max(0, g.y - 5.5) : 0; CAMY += (want - CAMY) * 0.08; return { u, x0: (g ? g.x : 0) - W * 0.2 / u, gy: gy + CAMY * u }; }
const SX = (V, x) => (x - V.x0) * V.u, SY = (V, y) => V.gy - y * V.u;
// ---------- what each happening looks and sounds like ----------
function onEvent(G, e) { const V = view(G), cx = W / 2;
  switch (e.k) {
    case 'start': case 'course': TRAIL.length = 0; if (e.k === 'start') { say(`LEVEL ${G.N}`, cx, H * 0.3, '#fff', 30); sfx.start(); if (G.N <= 1) tip('how', 'Tap anywhere to jump. Hold to keep jumping. Feel the beat!', 3.2); if (G.N === 3) tip('orb', 'Yellow rings: tap while you pass through to jump again in the air.', 3); if (G.N === 6) tip('flip', 'Blue portals flip you onto the ceiling!', 3); } break;
    case 'jump': sfx.jump(); break;
    case 'orb': sfx.orb(); { const x = SX(V, e.x), y = SY(V, e.y); burst(x, y, '#ffe040', 12, 160); } break;
    case 'pad': sfx.pad(); break;
    case 'flip': sfx.flip(); FX.flash = 0.25; break;
    case 'coin': sfx.coin(); say('★ SECRET COIN', cx, H * 0.3, '#ffd040', 20); break;
    case 'flag': sfx.flag(); say(`${e.pct}% ✓`, cx, H * 0.36, '#9aff9a', 22); break;
    case 'crash': { sfx.crash(); FX.shake = 16; FX.red = 0.8; FX.stop = 0.06; vibe(HAP.fail); const x = SX(V, e.x + 0.5), y = SY(V, G.s > 0 ? e.y + 0.5 : e.y - 0.5); burst(x, y, myCube().col, 26, 300, true); say(`${e.pct}%`, cx, H * 0.34, '#fff', 34); ui.att++; if (e.why === 'head') tip('head', 'Under hanging spikes: do not jump!', 2.6); } break;
    case 'respawn': TRAIL.length = 0; break;
    case 'finish': sfx.goal(); FX.flash = 0.6; say('LEVEL COMPLETE!', cx, H * 0.34, '#ffd040', 30); vibe(HAP.best); break;
    case 'lessonnext': if (e.first) hint0 = null; say('FIRST, A LESSON', cx, H * 0.26, '#ffe08a', 20); break;
    case 'lessonmiss': coachMiss(); break;
    case 'lessondone': say('YOU\'VE GOT IT!', cx, H * 0.3, '#ffe08a', 26); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); break;
    case 'lost': sfx.lose(); break;
  } }
// ---------- every frame ----------
let IG = null; function idleG() { if (!IG || IG.over) { IG = newGame(Math.max(2, store.get('level', 1) | 0), { seed: (Math.random() * 1e6) | 0 }); IG.mem = {}; } honest(IG, { react: 0.1, acc: 1 }, IG.mem); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
let BGC = null;
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const g = G || idleG(), P = PLACES[g.place], V = view(g), sh = FX.shake ? (Math.random() - 0.5) * FX.shake : 0, beatF = (g.x / g.beat) % 1, pulse = Math.max(0, 1 - beatF * 4);
  // the background: a gradient, and big squares drifting slowly (parallax), pulsing on the beat
  const gr = ctx.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, P.bg[0]); gr.addColorStop(1, P.bg[1]); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
  { const sx0 = W * 0.72, sy0 = H * 0.3, sr = (70 + pulse * 10) * k, sg = ctx.createRadialGradient(sx0, sy0, sr * 0.2, sx0, sy0, sr * 2.4); sg.addColorStop(0, P.acc); sg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.save(); ctx.globalAlpha = 0.16 + pulse * 0.1; ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 0.3 + pulse * 0.15; ctx.fillStyle = P.acc; ctx.beginPath(); ctx.arc(sx0, sy0, sr, 0, TAU); ctx.fill(); ctx.restore(); }      /* a sun that beats; skyline bars; brighter squares */
  ctx.save(); ctx.globalAlpha = 0.22; ctx.fillStyle = '#000'; for (let i = 0; i < 16; i++) { const bw = 46 * k, px = ((i * bw * 1.15 - V.x0 * V.u * 0.35) % (W + 120) + W + 120) % (W + 120) - 60, bh = (60 + ((i * 53) % 110) + pulse * ((i * 29) % 30)) * k; ctx.fillRect(px, V.gy - bh, bw, bh); } ctx.restore();
  ctx.save(); ctx.globalAlpha = 0.16 + pulse * 0.1; ctx.strokeStyle = P.acc; ctx.lineWidth = 2; for (let i = 0; i < 9; i++) { const s = (40 + (i * 37) % 70) * k, px = ((i * 173 - V.x0 * V.u * 0.2) % (W + 200) + W + 200) % (W + 200) - 100, py = H * (0.12 + ((i * 0.31) % 0.5)); ctx.strokeRect(px, py, s, s); } ctx.restore();
  ctx.save(); ctx.translate(sh, sh * 0.5);
  // the floor: solid below, a glowing edge on top; nothing in the pits
  for (const [a, b] of g.floor) { const x1 = SX(V, a), x2 = SX(V, b); if (x2 < -10 || x1 > W + 10) continue; ctx.fillStyle = P.ground; ctx.fillRect(x1, SY(V, 0), x2 - x1, H);
    { const y0 = SY(V, 0), cw = V.u; ctx.save(); ctx.beginPath(); ctx.rect(x1, y0, x2 - x1, H); ctx.clip(); ctx.strokeStyle = P.acc; ctx.lineWidth = 1; ctx.globalAlpha = 0.14 + pulse * 0.12; const off = -((V.x0 * V.u) % cw); for (let x = off; x < W + cw; x += cw) { ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, H); ctx.stroke(); } for (let y = y0 + cw; y < H; y += cw) { ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke(); }
      ctx.fillStyle = P.acc; for (let i = 0; i < 14; i++) { const bx = i * W / 14 + 4, bh = (18 + ((i * 37 + Math.floor(g.x / g.beat) * 13) % 60) * (0.35 + pulse * 0.65)) * k; ctx.globalAlpha = 0.22; ctx.fillRect(bx, H - bh, W / 14 - 8, bh); } ctx.restore(); }      /* under the floor: a grid and bars that jump on the beat */
    ctx.fillStyle = P.acc; ctx.globalAlpha = 0.7 + pulse * 0.3; ctx.fillRect(x1, SY(V, 0) - 1.5, x2 - x1, 3); ctx.globalAlpha = 1; }
  // blocks and roofs
  for (const b of g.blocks) { const x1 = SX(V, b.x), x2 = SX(V, b.x + b.w); if (x2 < -10 || x1 > W + 10) continue; const y1 = SY(V, b.y + b.h), y2 = SY(V, b.y); ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(x1, y1, x2 - x1, y2 - y1); ctx.strokeStyle = P.acc; ctx.lineWidth = 2; ctx.globalAlpha = 0.85 + pulse * 0.15; ctx.strokeRect(x1 + 1, y1 + 1, x2 - x1 - 2, y2 - y1 - 2); ctx.globalAlpha = 1;
    if (b.roof) { ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(x1, 0, x2 - x1, y1); } }
  // spikes
  for (const s of g.spikes) { const x = SX(V, s.x); if (x < -V.u || x > W + V.u) continue; const y = SY(V, s.y), h = 0.9 * V.u * (s.up ? 1 : -1); ctx.fillStyle = '#0a0a14'; ctx.beginPath(); ctx.moveTo(x + 0.05 * V.u, y); ctx.lineTo(x + 0.5 * V.u, y - h); ctx.lineTo(x + 0.95 * V.u, y); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.globalAlpha = 0.75; ctx.lineWidth = 1.6; ctx.stroke(); ctx.globalAlpha = 1; }
  // pads, rings, portals, coins
  for (const p of g.pads) { const x = SX(V, p.x), y = SY(V, 0); if (x < -V.u || x > W + V.u) continue; ctx.fillStyle = '#ffe040'; ctx.beginPath(); ctx.ellipse(x + 0.4 * V.u, y, 0.45 * V.u, 0.18 * V.u, 0, Math.PI, 0); ctx.fill(); }
  for (const o of g.orbs) { const x = SX(V, o.x), y = SY(V, o.y); if (x < -V.u || x > W + V.u) continue; const used = g.orbUsed.has(o.x); ctx.strokeStyle = used ? 'rgba(255,224,64,.3)' : '#ffe040'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, (0.38 + pulse * 0.06) * V.u, 0, TAU); ctx.stroke(); ctx.fillStyle = 'rgba(255,224,64,.25)'; ctx.fill(); }
  for (const p of g.portals) { const x = SX(V, p.x), y = SY(V, p.y + (p.to < 0 ? 1.2 : -0.2)); if (x < -V.u || x > W + V.u) continue; ctx.strokeStyle = p.to < 0 ? '#3ac8ff' : '#ffd040'; ctx.lineWidth = 5; ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.ellipse(x, y, 0.35 * V.u, 1.4 * V.u, 0, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; }
  g.coins.forEach((q, i) => { if (g.coinsHave[i]) return; const x = SX(V, q.x), y = SY(V, q.y); if (x < -V.u || x > W + V.u) return; ctx.fillStyle = '#ffd040'; ctx.beginPath(); ctx.arc(x, y, 0.32 * V.u * (0.8 + 0.2 * Math.abs(Math.sin(now * 3))), 0, TAU); ctx.fill(); ctx.fillStyle = '#a07a10'; ctx.font = `700 ${Math.round(0.36 * V.u)}px ${BC}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('★', x, y + 1); });
  // flags, and the end
  for (const f of g.flags) { const x = SX(V, f); if (x < -10 || x > W + 10) continue; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, SY(V, 0)); ctx.lineTo(x, SY(V, 2.2)); ctx.stroke(); ctx.fillStyle = g.flagX >= f ? '#9aff9a' : 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.moveTo(x, SY(V, 2.2)); ctx.lineTo(x + 0.7 * V.u, SY(V, 1.95)); ctx.lineTo(x, SY(V, 1.7)); ctx.fill(); }
  { const x = SX(V, g.len); if (x < W + 10) { for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? '#fff' : '#111'; ctx.fillRect(x, SY(V, (i + 1) * 0.5), 0.5 * V.u, 0.5 * V.u); ctx.fillStyle = i % 2 ? '#111' : '#fff'; ctx.fillRect(x + 0.5 * V.u, SY(V, (i + 1) * 0.5), 0.5 * V.u, 0.5 * V.u); } } }
  // the cube: a trail, then the cube itself (spinning in the air), unless it has just crashed
  const C = myCube(); if (!g.dead) { const cx = SX(V, g.x + 0.5), cy = SY(V, g.s > 0 ? g.y + 0.5 : g.y - 0.5); TRAIL.push({ x: cx, y: cy, t: 0 });
    for (const q of TRAIL) { ctx.globalAlpha = Math.max(0, 0.4 - q.t * 1.6); ctx.fillStyle = C.col; const s = V.u * 0.5 * (1 - q.t * 2); ctx.fillRect(q.x - s / 2, q.y - s / 2, s, s); } ctx.globalAlpha = 1;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(g.rot); const s = V.u; ctx.fillStyle = C.col; ctx.fillRect(-s / 2, -s / 2, s, s); ctx.strokeStyle = '#000'; ctx.lineWidth = 2.5; ctx.strokeRect(-s / 2 + 1, -s / 2 + 1, s - 2, s - 2);
    ctx.fillStyle = '#000'; const f = C.face; if (f === 0) { ctx.fillRect(-s * 0.28, -s * 0.18, s * 0.16, s * 0.16); ctx.fillRect(s * 0.12, -s * 0.18, s * 0.16, s * 0.16); ctx.fillRect(-s * 0.22, s * 0.12, s * 0.44, s * 0.08); }
    else if (f === 1) { ctx.beginPath(); ctx.arc(-s * 0.18, -s * 0.1, s * 0.09, 0, TAU); ctx.arc(s * 0.18, -s * 0.1, s * 0.09, 0, TAU); ctx.fill(); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, s * 0.05, s * 0.2, 0.2, Math.PI - 0.2); ctx.stroke(); }
    else if (f === 2) { ctx.fillRect(-s * 0.3, -s * 0.15, s * 0.6, s * 0.12); ctx.fillRect(-s * 0.1, s * 0.12, s * 0.2, s * 0.12); }
    else { ctx.strokeRect(-s * 0.25, -s * 0.25, s * 0.5, s * 0.5); ctx.fillRect(-s * 0.08, -s * 0.08, s * 0.16, s * 0.16); } ctx.restore(); }
  ctx.restore();
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; if (p.sq) ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2); else { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } } ctx.globalAlpha = 1;
  if (G) hud(G, now);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 0.8 ? 1 : 1 - (t2.t - 0.8) / 0.5; ctx.globalAlpha = Math.max(0, al); const sc = t2.t < 0.12 ? 1.3 - t2.t / 0.12 * 0.3 : 1; ctx.font = `700 ${Math.round(t2.size * k * sc)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 20); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 20); }
  ctx.globalAlpha = 1;
  if (hint0) { const al = Math.min(1, hint0.t / 0.2, (hint0.secs - hint0.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint0.txt, W - 70), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30;
    ctx.fillStyle = 'rgba(10,6,24,.88)'; rrect(W / 2 - w / 2, H * 0.84 - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.84 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,40,80,${FX.red * 0.2})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,250,235,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); } }
// ---------- the 2D layer ----------
function hud(G, t) { ctx.textBaseline = 'middle'; if (G.lesson) { lessonPanel(G); return; }
  const w = Math.min(260 * k, W * 0.64), x0 = W / 2 - w / 2, y0 = 62 * k, p = clamp(G.x / G.len, 0, 1), P = PLACES[G.place];
  ctx.fillStyle = 'rgba(255,255,255,.18)'; rrect(x0, y0 - 6 * k, w, 12 * k, 6 * k); ctx.fill(); ctx.fillStyle = P.acc; rrect(x0, y0 - 6 * k, Math.max(12 * k, w * p), 12 * k, 6 * k); ctx.fill();
  if (G.best > p) { ctx.fillStyle = '#fff'; ctx.fillRect(x0 + w * G.best - 1, y0 - 9 * k, 2, 18 * k); }
  for (const f of G.flags) { const fx = x0 + w * f / G.len; ctx.fillStyle = G.flagX >= f ? '#9aff9a' : 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.arc(fx, y0, 3 * k, 0, TAU); ctx.fill(); }
  ctx.font = `700 ${Math.round(13 * k)}px ${TF}`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText(`${Math.floor(p * 100)}%`, W / 2, y0 + 20 * k);
  ctx.textAlign = 'left'; ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = '#ff6a9a'; ctx.fillText('♥'.repeat(Math.max(0, G.lives)), 14, y0 + 20 * k);
  ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillText(`LEVEL ${G.N}${G.coins.length ? ' · ★ ' + G.got + '/' + G.coins.length : ''}`, W - 14, y0 + 20 * k);
  if (G.N <= 1 && G.x < 6) { ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 5); ctx.font = `700 ${Math.round(15 * k)}px ${TF}`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText('TAP TO JUMP', W / 2, H * 0.8); ctx.globalAlpha = 1; } }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { coachPanel(G); }
