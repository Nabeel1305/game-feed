// ===================== THE VIEW: Surf (rebuilt 27 Nov 2026 as a clear side view: the face, the white water behind, the surfer) =====================
// The wave is one mesh rebuilt each frame around the surfer: its face rises from the sea to the lip; behind the curl it is
// white water; in a barrel section the lip throws forward over a dark hollow; far ahead the shoulder fades. A foam trail
// follows the board; spray flies off hard turns and the lip. World: X along the shore (+ right), Z towards the beach, Y up.
const FX = { shake: 0, stop: 0, flash: 0, red: 0, slow: 0 }, TXT = [], PARTS = [], TRAIL = [];
let hint = null;
const ui = { snap: true, banner: null, stick: null, btn: {}, crId: null, sw: null, cam: null };
const optShake = () => store.get('shake', true) !== false, optSlow = () => store.get('slow', true) !== false;
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip2(key, txt, secs = 3) { if (HEADLESS) return; tip2.seen = tip2.seen || {}; if (tip2.seen[key]) return; tip2.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 160, up = 60) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - up * k, t: 0, life: 0.4 + Math.random() * 0.5, col, r: (1.5 + Math.random() * 3) * k }); } if (PARTS.length > 320) PARTS.splice(0, PARTS.length - 320); }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2.5); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.4) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 380 * k * dt; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (ui.banner) { ui.banner.t += dt; if (ui.banner.t > (ui.banner.secs || 1.6)) ui.banner = null; }
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; } }
function mySkin() { if (typeof HEADLESS !== 'undefined' && HEADLESS) return SKINS[0]; const id = store.get('skin', 'sun'); return SKINS.find(q => q.id === id) || SKINS[0]; }

let V3 = null;
function scrOf() { return null; }
// where things are on the screen: the camera follows the surfer, a little left of the middle, so the white water behind is in the picture
function cam(G) { const P = G.p, ppm = W / 34, base = H * 0.84, lip = H * 0.26; return { ppm, base, lip, x0: P.x - (W * 0.55) / ppm, X: x => (x - (P.x - (W * 0.55) / ppm)) * ppm, Y: (s, x) => base - s * (base - lip) * (x == null ? 1 : faceH(G || IG, x) / 1.2) }; }
function surferPos(G) { const C = cam(G), P = G.p; return { x: C.X(P.x), y: C.Y(P.s, P.x) - P.h * (C.base - C.lip) * 0.45 }; }
const TRAILS = [], SPRAY = [];
function layout(G) { return { pad: { x: 104 * k, y: H - 104 * k, r: 70 * k }, tr: { x: W - 84 * k, y: H - 86 * k, r: 52 * k } }; }
function onEvent(G, e) { const sp = G.p ? surferPos(G) : { x: W / 2, y: H / 2 };
  switch (e.k) {
    case 'wave': TRAILS.length = 0; SPRAY.length = 0; break;
    case 'link': sfx.move('carve', e.n); spray(sp.x, sp.y + 8 * k, 10 + e.n * 3, e.top); if (e.n >= 2) say(`FLOW ×${e.n + 1}  +${e.pts}`, sp.x, sp.y - 46 * k, '#bff8ff', 16 + e.n * 2); break;
    case 'launch': sfx.launch(); spray(sp.x, sp.y, 24, true); break;
    case 'trick': sfx.move('air', 2); vibe(HAP.light); say(`SPIN! +${e.pts}`, sp.x, sp.y - 50 * k, '#ffd36a', 26); spray(sp.x, sp.y + 10 * k, 20, false); break;
    case 'sloppy': sfx.wipe(); say('SLOPPY LANDING', sp.x, sp.y - 40 * k, '#ffd0c0', 16); break;
    case 'notrick': sfx.no(); break;
    case 'wipe': sfx.wipe(); vibe(HAP.thud); FX.shake = 10; spray(sp.x, sp.y, 40, true); ui.banner = { txt: 'WIPEOUT!', sub: e.why === 'slow' ? 'TOO SLOW' : e.why === 'over' ? 'OVER THE TOP' : 'THE WHITE WATER GOT YOU', t: 0, secs: 1.4 }; break;
    case 'done': sfx.cheer(); ui.banner = { txt: 'WAVE RIDDEN!', t: 0, secs: 1.6 }; break;
    case 'lessonnext': if (e.first) hint = null; break;
    case 'lessonok': sfx.coin(e.n); break;
    case 'lessonmiss': coachMiss(); break;
    case 'lessondone': say('NOW RIDE IT!', W / 2, H * 0.36, '#ffd36a', 28); sfx.fanfare(); break;
    case 'won': sfx.fanfare(); FX.flash = 0.5; vibe(HAP.best); break;
    case 'lost': sfx.lose(); break; } }
function spray(x, y, n, up) { for (let i = 0; i < n; i++) { const a = (up ? -Math.PI / 2 : -Math.PI * 0.75) + (Math.random() - 0.5) * 1.6, v = (120 + Math.random() * 220) * k; SPRAY.push({ x, y, vx: Math.cos(a) * v - 60 * k, vy: Math.sin(a) * v, t: 0, life: 0.5 + Math.random() * 0.6, r: (1.5 + Math.random() * 3) * k }); } }
let IG = null, IM = {}; function idleG() { if (!IG || IG.over || IG.t > 60) { IG = newGame(6, { seed: (Math.random() * 1e6) | 0, free: true }); IM = {}; } honest(IG, { react: 0.2, acc: 0.95 }, IM); step(IG, 1 / 60); return IG; }
// the picture
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; const gl = $('gl'); if (gl && gl.style.display !== 'none') gl.style.display = 'none';
  const g = G || idleG(), P = g.p, C = cam(g), pl = PLACES[g.cfg.place], t = now, sh = FX.shake > 0 && optShake() ? (Math.random() - 0.5) * FX.shake : 0;
  ctx.save(); ctx.translate(sh, sh * 0.6);
  // sky and the far sea
  const skyC = { morning: ['#7ec8f0', '#e8f6ff'], noon: ['#4aa8f0', '#cdeeff'], golden: ['#f6a66a', '#ffe2b0'], overcast: ['#8a9aa8', '#d0d8de'] }[pl.sky] || ['#7ec8f0', '#e8f6ff'];
  let gr = ctx.createLinearGradient(0, 0, 0, C.lip); gr.addColorStop(0, skyC[0]); gr.addColorStop(1, skyC[1]); ctx.fillStyle = gr; ctx.fillRect(-40, -40, W + 80, C.base + 40); ctx.fillStyle = skyC[1]; ctx.fillRect(-40, C.lip, W + 80, C.base - C.lip + 40);      /* the whole frame painted every time (a wave lower than its top left old pictures behind) */
  ctx.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 5; i++) { const cx = ((i * 230 - C.x0 * 4) % (W + 300) + W + 300) % (W + 300) - 150, cy = C.lip * (0.25 + 0.12 * (i % 3)); ctx.beginPath(); ctx.ellipse(cx, cy, 70 * k, 16 * k, 0, 0, TAU); ctx.ellipse(cx + 40 * k, cy - 8 * k, 40 * k, 14 * k, 0, 0, TAU); ctx.fill(); }
  // the face of the wave: deep at the bottom, glassy green-blue near the top, with lines of water drawing up it
  gr = ctx.createLinearGradient(0, C.lip, 0, C.base); gr.addColorStop(0, '#7ff0e0'); gr.addColorStop(0.25, '#2ec4c0'); gr.addColorStop(0.7, '#0a7a96'); gr.addColorStop(1, '#064a6a'); ctx.fillStyle = gr;
  ctx.beginPath(); ctx.moveTo(-20, C.base); for (let px = -20; px <= W + 20; px += 10) { const wx = C.x0 + px / C.ppm, wob = Math.sin(wx * 0.35 + t * 1.6) * 3 * k + (fastAt(g, wx) ? Math.sin(wx * 2 + t * 9) * 4 * k : 0); ctx.lineTo(px, C.base - (C.base - C.lip) * faceH(g, wx) / 1.2 + wob); } ctx.lineTo(W + 20, C.base); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 2; for (let i = 0; i < 9; i++) { const u = ((i / 9 + t * 0.12) % 1), y = C.base - u * (C.base - C.lip); ctx.globalAlpha = 0.3 + 0.5 * u; ctx.beginPath(); for (let px = -20; px <= W + 20; px += 24) { const wx = C.x0 + px / C.ppm; ctx.lineTo(px, y + Math.sin(wx * 0.6 + i) * 4 * k); } ctx.stroke(); } ctx.globalAlpha = 1;
  // the lip: a white feathered edge, spray blown back off it
  ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 4 * k; ctx.beginPath(); for (let px = -20; px <= W + 20; px += 10) { const wx = C.x0 + px / C.ppm; ctx.lineTo(px, C.base - (C.base - C.lip) * faceH(g, wx) / 1.2 + Math.sin(wx * 0.35 + t * 1.6) * 3 * k); } ctx.stroke();
  for (let i = 0; i < 16; i++) { const px = ((i * 61 + t * 90) % (W + 40)) - 20; ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.arc(px, C.lip - 6 * k - ((t * 40 + i * 13) % 18) * k, 2 * k, 0, TAU); ctx.fill(); }
  // the flat water at the bottom
  gr = ctx.createLinearGradient(0, C.base, 0, H); gr.addColorStop(0, '#05506e'); gr.addColorStop(1, '#043a52'); ctx.fillStyle = gr; ctx.fillRect(-20, C.base, W + 40, H - C.base + 20);
  // the flag at the end of the wave
  if (!g.cfg.free) { const fx = C.X(g.cfg.D); if (fx < W + 40) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 3 * k; ctx.beginPath(); ctx.moveTo(fx, C.base + 6); ctx.lineTo(fx, C.lip - 30 * k); ctx.stroke(); ctx.fillStyle = '#ff4a3a'; ctx.beginPath(); ctx.moveTo(fx, C.lip - 30 * k); ctx.lineTo(fx + 34 * k, C.lip - 20 * k); ctx.lineTo(fx, C.lip - 10 * k); ctx.fill(); } }
  // the trail of the board on the face
  if (g.phase === 'ride' && !P.air) TRAILS.push({ x: P.x, s: P.s, t: 0 }); for (const q of TRAILS) q.t += dt || 0; while (TRAILS.length && (TRAILS[0].t > 1.6 || TRAILS.length > 160)) TRAILS.shift();
  ctx.lineWidth = 4 * k; for (let i = 1; i < TRAILS.length; i++) { const a = TRAILS[i - 1], b = TRAILS[i]; ctx.strokeStyle = `rgba(255,255,255,${0.75 * (1 - b.t / 1.6)})`; ctx.beginPath(); ctx.moveTo(C.X(a.x), C.Y(a.s, a.x)); ctx.lineTo(C.X(b.x), C.Y(b.s, b.x)); ctx.stroke(); }
  // the white water: everything behind it is foam, and its front curls over
  { const bx = C.X(g.xb); if (bx > -60) { const top = C.lip - 10 * k;
      gr = ctx.createLinearGradient(bx - 160 * k, 0, bx + 30 * k, 0); gr.addColorStop(0, '#dfeef2'); gr.addColorStop(1, '#ffffff'); ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(-20, top - 20 * k); ctx.lineTo(bx - 40 * k, top - 24 * k);
      ctx.bezierCurveTo(bx + 10 * k, top - 34 * k, bx + 46 * k, top - 10 * k, bx + 38 * k, top + 22 * k); ctx.bezierCurveTo(bx + 30 * k, top + 40 * k, bx + 12 * k, top + 34 * k, bx + 10 * k, top + 16 * k);      // the lip throwing over
      ctx.lineTo(bx + 24 * k, C.base); ctx.lineTo(-20, C.base + 30 * k); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(8,70,96,.55)'; ctx.beginPath(); ctx.ellipse(bx + 14 * k, top + 40 * k, 16 * k, 30 * k, 0.2, 0, TAU); ctx.fill();      // the hollow under the curl
      for (let i = 0; i < 26; i++) { const fx = bx - ((i * 37) % 180) * k + Math.sin(t * 3 + i) * 6 * k, fy = top + ((i * 53) % Math.max(1, (C.base - top))) + Math.cos(t * 4 + i) * 5 * k; ctx.fillStyle = i % 3 ? 'rgba(200,225,235,.8)' : 'rgba(255,255,255,.95)'; ctx.beginPath(); ctx.arc(fx, fy, (8 + (i % 5) * 4) * k, 0, TAU); ctx.fill(); }
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + Math.sin(t * 5 + i) * 0.9, r = (20 + (t * 60 + i * 17) % 40) * k; ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(bx + Math.cos(a) * r * 0.6, top + Math.sin(a) * r * 0.5, 4 * k, 0, TAU); ctx.fill(); } } }
  // the surfer
  { const sp = surferPos(g), ang = P.air ? P.rot : Math.atan2(-P.vs * (C.base - C.lip), Math.max(1, P.v) * C.ppm), sk = mySkin(), low = !P.air && P.vs < -0.3 ? 1 : 0;
    ctx.save(); ctx.translate(sp.x, sp.y); ctx.rotate(ang); ctx.fillStyle = '#' + sk.col.toString(16).padStart(6, '0'); ctx.beginPath(); ctx.ellipse(0, 0, 26 * k, 5 * k, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#' + sk.col2.toString(16).padStart(6, '0'); ctx.lineWidth = 2 * k; ctx.beginPath(); ctx.moveTo(-22 * k, 0); ctx.lineTo(22 * k, 0); ctx.stroke();
    if (!P.air) ctx.rotate(-ang * 0.6);      /* the board follows the face; the rider stays upright over it */
    const kh = (low ? 16 : 22) * k; ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 5 * k; ctx.beginPath(); ctx.moveTo(-9 * k, -3 * k); ctx.lineTo(-4 * k, -kh * 0.55); ctx.lineTo(2 * k, -kh); ctx.moveTo(9 * k, -3 * k); ctx.lineTo(6 * k, -kh * 0.55); ctx.lineTo(2 * k, -kh); ctx.stroke();      // legs, knees bent
    ctx.strokeStyle = '#' + sk.col2.toString(16).padStart(6, '0'); ctx.lineWidth = 8 * k; ctx.beginPath(); ctx.moveTo(2 * k, -kh); ctx.lineTo(5 * k, -kh - 18 * k); ctx.stroke();      // body
    ctx.strokeStyle = '#8d5524'; ctx.lineWidth = 4 * k; ctx.beginPath(); ctx.moveTo(4 * k, -kh - 14 * k); ctx.lineTo(-14 * k, -kh - 8 * k + Math.sin(t * 6) * 3 * k); ctx.moveTo(4 * k, -kh - 14 * k); ctx.lineTo(20 * k, -kh - 20 * k); ctx.stroke();      // arms out for balance
    ctx.fillStyle = '#8d5524'; ctx.beginPath(); ctx.arc(6 * k, -kh - 25 * k, 6 * k, 0, TAU); ctx.fill(); ctx.fillStyle = '#2a1a10'; ctx.beginPath(); ctx.arc(5 * k, -kh - 27 * k, 6 * k, Math.PI, TAU); ctx.fill(); ctx.restore();
    if (!P.air && g.phase === 'ride' && P.v > 5 && Math.random() < 0.5) SPRAY.push({ x: sp.x - 20 * k, y: sp.y + 2 * k, vx: -120 * k, vy: (-40 - Math.random() * 60) * k, t: 0, life: 0.4, r: 2 * k }); }
  for (const q of SPRAY) { q.t += dt || 0; q.x += q.vx * (dt || 0); q.y += q.vy * (dt || 0); q.vy += 500 * k * (dt || 0); } for (let i = SPRAY.length - 1; i >= 0; i--) if (SPRAY[i].t > SPRAY[i].life) SPRAY.splice(i, 1);
  for (const q of SPRAY) { ctx.globalAlpha = Math.max(0, 1 - q.t / q.life); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.restore();
  if (G && !(G.over && !$('ovEnd').classList.contains('hidden'))) hud(G, now);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 1.1 ? 1 : 1 - (t2.t - 1.1) / 0.5; ctx.globalAlpha = Math.max(0, al); ctx.font = `400 ${Math.round(t2.size * k)}px ${TF}`; ctx.lineWidth = 6; ctx.lineJoin = 'round'; ctx.miterLimit = 2; ctx.strokeStyle = 'rgba(0,40,60,.7)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 18); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 18); }
  ctx.globalAlpha = 1; if (FX.flash > 0) { ctx.fillStyle = `rgba(255,255,240,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); } }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of String(t).split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function txt(s, x, y, col = '#fff', font, al = 'center') { ctx.textAlign = al; ctx.lineJoin = 'round'; ctx.miterLimit = 2; if (font) ctx.font = font; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,40,60,.7)'; ctx.strokeText(s, x, y); ctx.fillStyle = col; ctx.fillText(s, x, y); }

function hud(G, now) { ctx.textBaseline = 'middle'; const L = layout(G), P = G.p, C = cam(G);
  // how far along the wave, the white water behind you, the points
  { const y = 22 * k, w = Math.min(W * 0.5, 380 * k), x0 = W / 2 - w / 2, u = clamp(P.x / G.cfg.D, 0, 1), ub = clamp(G.xb / G.cfg.D, 0, 1); ctx.fillStyle = 'rgba(0,40,60,.55)'; rrect(x0 - 10, y - 14 * k, w + 20, 30 * k, 12); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.25)'; rrect(x0, y - 3 * k, w, 6 * k, 3); ctx.fill(); if (!G.cfg.free) { ctx.fillStyle = '#ffffff'; rrect(x0, y - 3 * k, w * ub, 6 * k, 3); ctx.fill(); ctx.fillStyle = '#ffd36a'; ctx.beginPath(); ctx.arc(x0 + w * u, y, 7 * k, 0, TAU); ctx.fill(); ctx.fillStyle = '#ff4a3a'; ctx.fillRect(x0 + w - 2, y - 10 * k, 4, 14 * k); }
    txt(`${Math.round(G.score)}`, x0 - 34 * k, y + 1, '#fff', `400 ${Math.round(18 * k)}px ${TF}`); }
  // how close the white water is (a bar that fills red as it closes on you)
  { const gap = P.x - G.xb, u = clamp(1 - gap / 22, 0, 1); if (u > 0.35) { const wx0 = 22 * k, wy0 = H * 0.18 - 20 * k; ctx.globalAlpha = 0.85; ctx.fillStyle = 'rgba(6,30,48,.85)'; ctx.beginPath(); ctx.roundRect(wx0, wy0, 150 * k, 30 * k, 15 * k); ctx.fill(); ctx.globalAlpha = 0.6 + 0.4 * Math.sin(now * 10) * u; txt('◀ WHITE WATER', wx0 + 75 * k, H * 0.18, u > 0.75 ? '#ff8a7a' : '#ffd36a', `400 ${Math.round(16 * k)}px ${TF}`); ctx.globalAlpha = 1; } }
  // the pad (left, in one place): up = climb, down = drop
  { const B = L.pad, on = !!ui.stick, sy = G.stick.y; ctx.globalAlpha = on ? 1 : 0.75; ctx.fillStyle = 'rgba(0,40,60,.5)'; rrect(B.x - B.r * 0.55, B.y - B.r, B.r * 1.1, B.r * 2, B.r * 0.55); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.font = `700 ${Math.round(18 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillText('▲', B.x, B.y - B.r * 0.72); ctx.fillText('▼', B.x, B.y + B.r * 0.74);
    ctx.fillStyle = on ? '#ffd36a' : '#fff'; ctx.beginPath(); ctx.arc(B.x, B.y - sy * B.r * 0.6, 22 * k, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
  // TRICK (right): lights up near the lip with speed
  if (G.cfg.trick || (G.lesson && G.lesson.id === 'trick')) { const B = L.tr, ready = !P.air && P.s > 0.8 && P.v > TRICKV; ctx.globalAlpha = ready ? 1 : 0.45; ctx.fillStyle = ready ? '#ff8a3a' : 'rgba(0,40,60,.55)'; ctx.beginPath(); ctx.arc(B.x, B.y, B.r, 0, TAU); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke(); txt('TRICK', B.x, B.y, '#fff', `400 ${Math.round(18 * k)}px ${TF}`); ctx.globalAlpha = 1; }
  if (G.lesson) lessonPanel(G);
  if (ui.banner) { const b = ui.banner, a = Math.min(1, b.t / 0.2, ((b.secs || 1.6) - b.t) / 0.4); ctx.globalAlpha = Math.max(0, a); txt(b.txt, W / 2, H * 0.3, '#ffd36a', `400 ${Math.round(34 * k)}px ${TF}`); if (b.sub) txt(b.sub, W / 2, H * 0.3 + 30 * k, '#fff', `700 ${Math.round(14 * k)}px ${BC}`); ctx.globalAlpha = 1; } }
function lessonPanel(G) { coachPanel(G); }
