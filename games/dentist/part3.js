// ===================== THE VIEW: Dentist =====================
// The clinic in 3D (a bright room, the chair under its lamp, the patient with a face that shows how they feel) when a patient
// comes in, talks and leaves smiling; the mouth close-up in 2D when work begins (one row of teeth seen from above, a U, big
// enough for a thumb): the dirt, the decay and the work you do on each little patch of each tooth, the tool at your fingertip
// (just above it, so your thumb never hides what it does), the tray, the patient's face and comfort, the clock, the checklist.
const FX = { shake: 0, stop: 0, flash: 0, red: 0, slow: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { snap: true, banner: null, finger: null, zoom: 1, zc: { x: 0, y: -0.15 }, demo: null, seen: {} };
const LIFT = 46;      // the tool works this far above the fingertip (in px, times k)
function say(txt, x, y, col = '#fff', size = 20) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 140) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60 * k, t: 0, life: 0.5 + Math.random() * 0.5, col, r: (2 + Math.random() * 3) * k }); } }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2.5); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.6) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (ui.banner) { ui.banner.t += dt; if (ui.banner.t > (ui.banner.secs || 2.4)) ui.banner = null; }
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; } if (ui.demo) { ui.demo.t += dt; if (ui.demo.t > 2.2) ui.demo = null; } }
function mySkin() { if (typeof HEADLESS !== 'undefined' && HEADLESS) return SKINS[0]; const id = store.get('skin', 'mint'); return SKINS.find(q => q.id === id) || SKINS[0]; }
const SKIN = ['#f1c9a5', '#e0ac69', '#c68642', '#8d5524', '#5a3825'], HAIR = ['#2a1a10', '#6a4020', '#d8b060', '#a02a1a', '#1a1a1a', '#8a8a8a'];
// ---------- where the mouth is on the screen ----------
function layout(G) { const top = 160 * k, bot = H - 196 * k, av = bot - top, S = Math.min((W - 14) / 1.48, av / 1.05) * ui.zoom, cx = W / 2, cy = top + av * 0.5;
  const n = G ? G.cfg.tools.length : 1, per = Math.min(8, n), rows = Math.ceil(n / per), bw = Math.min(46 * k, (W - 20) / per - 4), tray = []; G && G.cfg.tools.forEach((id, i) => { const r = Math.floor(i / per), c = i % per, m = Math.min(per, n - r * per); tray.push({ id, x: W / 2 + (c - (m - 1) / 2) * (bw + 4), y: H - 24 * k - bw / 2 - (rows - 1 - r) * (bw + 6), r: bw / 2 }); });
  const by = H - 24 * k - rows * (bw + 6) - 34 * k;
  return { S, cx, cy, top, bot, tray, flip: { x: 40 * k, y: by, r: 25 * k }, re: { x: 102 * k, y: by, r: 25 * k }, zoom: { x: W - 102 * k, y: by, r: 25 * k }, done: { x: W - 40 * k, y: by, r: 27 * k } }; }
function m2s(G, x, y) { const L = layout(G), z = ui.zoom > 1 ? ui.zc : { x: 0, y: -0.27 }; return { x: L.cx + (x - z.x) * L.S, y: L.cy + (y - z.y - 0.0) * L.S }; }
function s2m(G, px, py) { const L = layout(G), z = ui.zoom > 1 ? ui.zc : { x: 0, y: -0.27 }; return { x: (px - L.cx) / L.S + z.x, y: (py - L.cy) / L.S + z.y }; }
// ---------- the clinic in 3D ----------
function buildWorld() {
  if (V3) return V3; const T = window.THREE; if (!T || !W3 || !W3.init({ canvas: $('gl'), fov: 50, far: 400, near: 0.05 })) { V3 = { none: true }; return V3; }
  V3 = { T, S: W3.scene, t: 0, for: null }; const V = V3, M = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.7 }, o));
  W3.scene.children.forEach(o => { if (o.isLineSegments) o.visible = false; }); W3.setSky('noon');
  const box = (w, h, d, c, x, y, z, o) => { const m = new T.Mesh(new T.BoxGeometry(w, h, d), M(c, o)); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; V.S.add(m); return m; };
  box(12, 0.1, 10, 0xe8e2d8, 0, -0.05, 0); box(12, 4, 0.1, 0xcdeee6, 0, 2, 3); box(0.1, 4, 10, 0xe8f4f0, -4, 2, 0); box(0.1, 4, 10, 0xe8f4f0, 4, 2, 0);
  const win = box(2.2, 1.4, 0.05, 0x9ad0ff, 1.8, 2.3, 2.94, { emissive: 0x6aa0d0, emissiveIntensity: 0.6 }); box(2.4, 0.08, 0.1, 0xffffff, 1.8, 1.56, 2.9);
  for (const [x, c] of [[-1.6, 0xf2a07a], [-2.7, 0x6aaee8]]) { box(0.8, 1.0, 0.04, 0xffffff, x, 2.4, 2.94); box(0.66, 0.86, 0.05, c, x, 2.4, 2.92); }      // posters (a tooth, a smile: shapes only)
  box(1.4, 0.9, 0.6, 0xffffff, -2.6, 0.45, 2.5); box(1.42, 0.05, 0.62, 0x6ad0b8, -2.6, 0.92, 2.5);       // the cabinet
  { const pot = box(0.35, 0.4, 0.35, 0xd86a4a, 3.3, 0.2, 2.4); const leaf = new T.Mesh(new T.SphereGeometry(0.45, 10, 8), M(0x3a9a4a)); leaf.position.set(3.3, 0.85, 2.4); leaf.castShadow = true; V.S.add(leaf); }
  // the chair
  V.chairM = M(mySkin().top, { roughness: 0.5 }); const ch = new T.Group(); V.S.add(ch); V.chair = ch;
  const part = (geo, m, x, y, z, rx = 0) => { const p = new T.Mesh(geo, m); p.position.set(x, y, z); p.rotation.x = rx; p.castShadow = p.receiveShadow = true; ch.add(p); return p; };
  part(new T.CylinderGeometry(0.25, 0.4, 0.5, 16), M(0xdddddd, { metalness: 0.4 }), 0, 0.25, 0); part(new T.BoxGeometry(0.8, 0.18, 1.0), V.chairM, 0, 0.6, 0.1); part(new T.BoxGeometry(0.8, 0.16, 1.1), V.chairM, 0, 0.95, 0.95, -1.1); part(new T.BoxGeometry(0.7, 0.14, 0.7), V.chairM, 0, 0.45, -0.75, 0.5);
  { const arm = part(new T.CylinderGeometry(0.03, 0.03, 1.6, 8), M(0xcccccc, { metalness: 0.5 }), 0.8, 1.6, 0.6); arm.rotation.z = 0.3; const lamp = part(new T.CylinderGeometry(0.22, 0.32, 0.18, 16), M(0xffffff, { emissive: 0xffffee, emissiveIntensity: 0.8 }), 0.45, 2.35, 0.3); lamp.rotation.x = 0.5;
    V.lampL = new T.PointLight(0xfff6e0, 6, 6); V.lampL.position.set(0.4, 2.2, 0.2); V.S.add(V.lampL); }
  part(new T.BoxGeometry(0.6, 0.04, 0.35), M(0xd8dde4, { metalness: 0.6 }), -0.85, 1.05, 0.2);      // the tray table
  // the patient
  const P = new T.Group(); ch.add(P); V.pat = P; V.skinM = M(0xe0ac69, { roughness: 0.6 }); V.shirtM = M(0x6aaee8); V.hairM = M(0x2a1a10);
  const body = new T.Mesh(new T.CapsuleGeometry(0.26, 0.5, 3, 10), V.shirtM); body.position.set(0, 1.0, 0.7); body.rotation.x = 0.75; body.castShadow = true; P.add(body);
  const legs = new T.Mesh(new T.CapsuleGeometry(0.13, 0.7, 3, 8), M(0x2a3448)); legs.position.set(0, 0.68, -0.15); legs.rotation.x = -1.75; P.add(legs);
  V.faceC = document.createElement('canvas'); V.faceC.width = V.faceC.height = 256; V.faceT = new T.CanvasTexture(V.faceC); V.faceT.colorSpace = T.SRGBColorSpace;
  const head = new T.Mesh(new T.SphereGeometry(0.22, 24, 18), [V.skinM]); head.position.set(0, 1.5, 1.12); P.add(head); V.head = head;
  const face = new T.Mesh(new T.CircleGeometry(0.2, 24), new T.MeshStandardMaterial({ map: V.faceT, transparent: true, roughness: 0.7 })); face.position.set(0, 1.5 + 0.67 * 0.215, 1.12 - 0.74 * 0.215); face.rotation.set(-2.4, 0, Math.PI); P.add(face); V.face = face;
  const hair = new T.Mesh(new T.SphereGeometry(0.235, 20, 12, 0, TAU, 0, Math.PI / 2), V.hairM); hair.position.copy(head.position); hair.rotation.x = 1.25; P.add(hair);
  V.bib = new T.Mesh(new T.PlaneGeometry(0.4, 0.3), M(0x8ad0e8)); V.bib.position.set(0, 1.25 + 0.2, 0.86 - 0.1); V.bib.rotation.set(-2.4, 0, Math.PI); P.add(V.bib);
  W3.setQuality(stepN); return V; }
// a face that shows how they feel: happy, fine, worried, hurting; a big white smile at the end
function drawFace(V, P, mood) { const c = V.faceC.getContext('2d'), s = 256; c.clearRect(0, 0, s, s); const sk = SKIN[P.skin]; c.fillStyle = sk; c.beginPath(); c.arc(s / 2, s / 2, s / 2, 0, TAU); c.fill();
  c.fillStyle = '#1a1a22'; const ey = 108; if (mood === 'hurt') { c.lineWidth = 8; c.strokeStyle = '#1a1a22'; for (const ex of [88, 168]) { c.beginPath(); c.moveTo(ex - 16, ey - 8); c.lineTo(ex + 16, ey + 4); c.stroke(); } }
  else for (const ex of [88, 168]) { c.beginPath(); c.ellipse(ex, ey, 11, mood === 'smile' ? 7 : 14, 0, 0, TAU); c.fill(); }
  c.fillStyle = 'rgba(230,120,120,.35)'; c.beginPath(); c.arc(64, 150, 18, 0, TAU); c.arc(192, 150, 18, 0, TAU); c.fill();
  c.lineWidth = 8; c.strokeStyle = '#5a2020'; c.lineCap = 'round';
  if (mood === 'smile') { c.fillStyle = '#5a1a1a'; c.beginPath(); c.moveTo(70, 160); c.quadraticCurveTo(128, 238, 186, 160); c.closePath(); c.fill(); c.fillStyle = '#fff'; c.fillRect(82, 160, 92, 18); }
  else if (mood === 'fine') { c.beginPath(); c.moveTo(90, 172); c.quadraticCurveTo(128, 196, 166, 172); c.stroke(); }
  else if (mood === 'worried') { c.beginPath(); c.moveTo(94, 186); c.quadraticCurveTo(128, 170, 162, 186); c.stroke(); }
  else { c.beginPath(); c.ellipse(128, 182, 20, 14, 0, 0, TAU); c.fillStyle = '#5a1a1a'; c.fill(); }
  V.faceT.needsUpdate = true; }
const moodOf = (G, P) => G.phase === 'smile' ? 'smile' : P.comfort < 0.3 ? 'hurt' : P.comfort < 0.6 || (G.phase === 'talk' && P.probs.length) ? 'worried' : 'fine';
function sync(V, G, dt) { V.t += dt; const P = pat(G);
  if (V.for !== P) { V.for = P; V.skinM.color.set(SKIN[P.skin]); V.hairM.color.set(HAIR[P.hair]); V.shirtM.color.setHSL((P.name.charCodeAt(0) * 37 % 100) / 100, 0.5, 0.55); V.chairM.color.setHex(mySkin().top); V.mood = null; ui.snap = true; }
  const mood = moodOf(G, P); if (mood !== V.mood) { V.mood = mood; drawFace(V, P, mood); }
  const enter = G.phase === 'talk' ? Math.min(1, (2.2 - G.phT) / 0.6) : 1; V.pat.position.x = (1 - enter) * -2.5; V.head.rotation.z = Math.sin(V.t * 1.3) * 0.05;
  const cam = W3.cam, close = G.phase === 'smile' ? 1 : 0, pos = [1.5 - close * 0.7, 2.6 - close * 0.3, -1.9 + close * 1.05], tgt = [0, 1.2 + close * 0.2, 0.85 + close * 0.15];
  if (!V.cv || ui.snap) { V.cv = pos.concat(tgt); ui.snap = false; } const kq = Math.min(1, dt * 2.5); for (let i = 0; i < 3; i++) { V.cv[i] += (pos[i] - V.cv[i]) * kq; V.cv[3 + i] += (tgt[i] - V.cv[3 + i]) * kq; }
  cam.position.set(V.cv[0], V.cv[1], V.cv[2]); cam.lookAt(V.cv[3], V.cv[4], V.cv[5]); cam.updateMatrixWorld(); W3.setFocus(0, 1, 0.5, 6); }
// ---------- the mouth, drawn ----------
const COL = { food: [138, 90, 42], plaque: [232, 216, 112], tartar: [196, 156, 64], stain: [122, 80, 48] };
function drawArch(G, A, opt = {}) { const L = layout(G), S = L.S, toS = (x, y) => m2s(G, x, y), xr = opt.xray, P = pat(G);
  // gums: a thick pink band along the arch
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = xr ? 'rgba(60,80,100,.9)' : '#e8828e'; ctx.lineWidth = 0.34 * S; ctx.beginPath(); A.teeth.forEach((t, i) => { const p = toS(t.x, t.y); i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); }); ctx.stroke();
  ctx.strokeStyle = xr ? 'rgba(80,100,120,.6)' : '#f0a0a8'; ctx.lineWidth = 0.22 * S; ctx.stroke();
  for (const t of A.teeth) { const c = toS(t.x, t.y), r = t.r * S;
    if (t.gone) { ctx.fillStyle = '#8a2a3a'; ctx.beginPath(); ctx.ellipse(c.x, c.y, r * 0.6, r * 0.5, 0, 0, TAU); ctx.fill(); continue; }
    if (t.abscess && t.found && !xr) { ctx.fillStyle = `rgba(220,40,40,${0.25 + 0.15 * Math.sin(performance.now() / 300)})`; ctx.beginPath(); ctx.arc(c.x, c.y, r * 1.5, 0, TAU); ctx.fill(); }
    // the tooth
    const g = ctx.createRadialGradient(c.x - r * 0.3, c.y - r * 0.3, r * 0.1, c.x, c.y, r * 1.05); g.addColorStop(0, xr ? 'rgba(230,240,255,.9)' : '#ffffff'); g.addColorStop(1, xr ? 'rgba(150,170,200,.7)' : '#e8e0cc');
    ctx.fillStyle = g; ctx.beginPath(); if (t.molar) { const q = r * 0.95; rrect(c.x - q, c.y - q, q * 2, q * 2, r * 0.45); } else ctx.arc(c.x, c.y, r * 0.96, 0, TAU); ctx.fill();
    if (t.molar && !xr) { ctx.strokeStyle = 'rgba(160,140,110,.45)'; ctx.lineWidth = Math.max(1, r * 0.08); ctx.beginPath(); ctx.moveTo(c.x - r * 0.45, c.y); ctx.lineTo(c.x + r * 0.45, c.y); ctx.moveTo(c.x, c.y - r * 0.45); ctx.lineTo(c.x, c.y + r * 0.45); ctx.stroke(); }
    const cs = 2 * t.r / GR * S * 0.62;
    for (const cl of t.cells) { const p = toS(cl.x, cl.y);
      if (xr) { if (cl.decay > 0.05 || (t.cav && cl.decay > 0)) { ctx.fillStyle = `rgba(20,20,30,${0.8 * cl.decay})`; ctx.beginPath(); ctx.arc(p.x, p.y, cs * 1.1, 0, TAU); ctx.fill(); } if (t.abscess) { ctx.fillStyle = 'rgba(20,20,30,.35)'; ctx.beginPath(); ctx.arc(p.x, p.y, cs, 0, TAU); ctx.fill(); } continue; }
      if (cl.chip > 0 && cl.fill < 0.9) { ctx.fillStyle = `rgba(160,60,70,${0.95 * (1 - cl.fill)})`; ctx.beginPath(); ctx.arc(p.x, p.y, cs * 1.15, 0, TAU); ctx.fill(); }
      if (cl.decay > 0) { const vis = t.found ? 1 : t.cav === 'deep' ? 0 : 0.22; if (vis) { ctx.fillStyle = `rgba(52,36,24,${vis * Math.min(1, cl.decay + 0.2)})`; ctx.beginPath(); ctx.arc(p.x, p.y, cs * 1.1, 0, TAU); ctx.fill(); } }
      if (cl.hole > 0.05) { ctx.fillStyle = `rgba(70,66,72,${Math.min(1, cl.hole) * (1 - cl.fill)})`; ctx.beginPath(); ctx.arc(p.x, p.y, cs, 0, TAU); ctx.fill(); }
      if (cl.dust > 0.05) { ctx.fillStyle = `rgba(200,200,200,${cl.dust * 0.7})`; ctx.beginPath(); ctx.arc(p.x + cs * 0.2, p.y, cs * 0.6, 0, TAU); ctx.fill(); }
      if (cl.fill > 0.05) { const cu = cl.cure; ctx.fillStyle = `rgba(${Math.round(200 + 55 * cu)},${Math.round(225 + 25 * cu)},255,${Math.min(1, cl.fill)})`; ctx.beginPath(); ctx.arc(p.x, p.y, cs * 1.05, 0, TAU); ctx.fill(); }
      if (cl.extra > 0.05) { ctx.fillStyle = `rgba(250,252,255,${Math.min(1, cl.extra)})`; ctx.beginPath(); ctx.arc(p.x, p.y - cs * 0.15, cs * 1.25, 0, TAU); ctx.fill(); ctx.strokeStyle = `rgba(150,160,180,${cl.extra * 0.8})`; ctx.lineWidth = 1; ctx.stroke(); }
      if (cl.jag > 0.05) { ctx.strokeStyle = `rgba(90,70,60,${cl.jag})`; ctx.lineWidth = Math.max(1, cs * 0.35); ctx.beginPath(); ctx.moveTo(p.x - cs, p.y - cs * 0.6); ctx.lineTo(p.x, p.y + cs * 0.4); ctx.lineTo(p.x + cs, p.y - cs * 0.5); ctx.stroke(); }
      for (const Ly of ['stain', 'plaque', 'tartar', 'food']) { const v = cl[Ly]; if (v <= 0.04) continue; const C = COL[Ly], a = Ly === 'plaque' ? v * 0.55 : Ly === 'stain' ? v * 0.6 : Math.min(1, v * 1.1);
        ctx.fillStyle = `rgba(${C[0]},${C[1]},${C[2]},${a})`; ctx.beginPath(); if (Ly === 'food') { ctx.arc(p.x + Math.sin(cl.x * 97) * cs * 0.3, p.y + Math.cos(cl.y * 89) * cs * 0.3, cs * (0.5 + v * 0.5), 0, TAU); } else if (Ly === 'tartar') { ctx.arc(p.x, p.y, cs * 1.2, 0, TAU); } else ctx.arc(p.x, p.y, cs * 1.15, 0, TAU); ctx.fill(); } }
    if (t.broken) { if (t.crown >= 1) { const g2 = ctx.createRadialGradient(c.x - r * 0.3, c.y - r * 0.4, r * 0.1, c.x, c.y, r * 1.1); g2.addColorStop(0, '#ffffff'); g2.addColorStop(1, t.crown >= 2 ? '#e8eef8' : '#cfe0ff'); ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(c.x, c.y, r * 1.02, 0, TAU); ctx.fill(); ctx.strokeStyle = t.crown >= 2 ? 'rgba(180,190,210,.8)' : 'rgba(120,170,255,.9)'; ctx.lineWidth = 2; ctx.stroke(); } }
    if (t.loose > 0 && t.abscess) { ctx.strokeStyle = '#ff9a6a'; ctx.lineWidth = 4 * k; ctx.beginPath(); ctx.arc(c.x, c.y, r * 1.3, -Math.PI / 2, -Math.PI / 2 + TAU * t.loose); ctx.stroke(); }
    if (t.numbAt != null && G.t - t.numbAt < 3.2) { const u = Math.min(1, (G.t - t.numbAt) / 3); ctx.strokeStyle = '#8ad8ff'; ctx.lineWidth = 3 * k; ctx.beginPath(); ctx.arc(c.x, c.y, r * 1.45, -Math.PI / 2, -Math.PI / 2 + TAU * u); ctx.stroke(); }
    if (opt.left && !xr) { const lt = toothLeft(t, A).filter(w => w !== 'decay' || t.found).filter(w => w !== 'extract' || t.found); if (lt.length) { ctx.strokeStyle = 'rgba(255,90,90,.9)'; ctx.setLineDash([5, 4]); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(c.x, c.y, r * 1.25, 0, TAU); ctx.stroke(); ctx.setLineDash([]); } }
  }
  // braces: brackets on the teeth and a wire through them
  if (A.braces && !xr) { const B = A.braces, pts = []; for (const i of B.on) { const t = A.teeth[i]; if (t.gone) continue; const c = toS(t.x + t.out[0] * t.r * 0.1, t.y + t.out[1] * t.r * 0.1), loose = B.loose.includes(i) && !B.fixed.includes(i), s = t.r * S * 0.5;
      ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(loose ? 0.6 : 0); ctx.fillStyle = '#b8c0cc'; ctx.fillRect(-s / 2, -s / 2, s, s); if (loose) { ctx.strokeStyle = '#ff5a4a'; ctx.lineWidth = 3; ctx.strokeRect(-s / 2, -s / 2, s, s); } ctx.restore(); pts.push(c); }
    ctx.strokeStyle = B.wire ? '#e8f0ff' : 'rgba(170,180,195,.85)'; ctx.lineWidth = B.wire ? 3 : 2; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y + (B.wire ? 0 : Math.sin(i * 1.7) * 3)) : ctx.moveTo(p.x, p.y)); ctx.stroke(); } }
function drawMouth(G, now) { const L = layout(G), P = pat(G), A = archOf(G), S = L.S;
  ctx.fillStyle = '#f6efe6'; ctx.fillRect(0, 0, W, H);
  // the mouth: lips around a dark, warm inside
  ctx.save(); ctx.beginPath(); ctx.rect(0, L.top - 6 * k, W, L.bot - L.top + 12 * k); ctx.clip();
  const c0 = m2s(G, 0, -0.24); ctx.fillStyle = '#c86a76'; ctx.beginPath(); ctx.ellipse(c0.x, c0.y, 0.8 * S, 0.62 * S, 0, 0, TAU); ctx.fill();
  const gi = ctx.createRadialGradient(c0.x, c0.y + 0.2 * S, 0.1 * S, c0.x, c0.y, 0.8 * S); gi.addColorStop(0, '#6a1a2a'); gi.addColorStop(1, '#a8404e'); ctx.fillStyle = gi; ctx.beginPath(); ctx.ellipse(c0.x, c0.y, 0.74 * S, 0.55 * S, 0, 0, TAU); ctx.fill();
  if (G.arch === 1) { ctx.fillStyle = '#c85a6a'; ctx.beginPath(); ctx.ellipse(c0.x, c0.y + 0.18 * S, 0.36 * S, 0.2 * S, 0, 0, TAU); ctx.fill(); }      // the tongue, under the lower row
  drawArch(G, A, { left: ui.showLeft > 0 });
  if (G.xr > 0) { ctx.globalAlpha = Math.min(1, G.xr); ctx.fillStyle = 'rgba(20,34,50,.88)'; ctx.fillRect(0, L.top - 6 * k, W, L.bot - L.top + 12 * k); drawArch(G, A, { xray: true }); ctx.globalAlpha = 1;
    ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillStyle = '#bfe0ff'; ctx.fillText('X-RAY: dark patches are decay', W / 2, L.top + 12 * k); }
  // the mirror: a lens that looks closer (a cavity shows up in it)
  const h = G.hand; if (G.tool === 'mirror' && h.down) { const p = m2s(G, h.x, h.y), R = 0.2 * S; ctx.save(); ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, TAU); ctx.clip(); ctx.translate(p.x, p.y); ctx.scale(1.8, 1.8); ctx.translate(-p.x, -p.y); ctx.fillStyle = '#8a3040'; ctx.fillRect(p.x - R, p.y - R, R * 2, R * 2); drawArch(G, A, { lens: true }); ctx.restore();
    ctx.strokeStyle = '#c8d0dc'; ctx.lineWidth = 6 * k; ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, TAU); ctx.stroke(); }
  ctx.restore();
  // the tool at your fingertip (it works just above your thumb)
  if (G.tool && ui.finger) { const T = TOOLS[G.tool], f = ui.finger, p = { x: f.x, y: f.y - LIFT * k };
    if (G.tool === 'crown' && G.crownAt) { const q = m2s(G, G.crownAt.x, G.crownAt.y), r = 0.1 * S; ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, TAU); ctx.fill(); ctx.strokeStyle = '#8ab8ff'; ctx.lineWidth = 2; ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(6 * k, T.r * S), 0, TAU); ctx.stroke(); ctx.strokeStyle = 'rgba(40,40,60,.5)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.font = `${Math.round(26 * k)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(T.icon, p.x + 20 * k, p.y - 18 * k);
    ctx.strokeStyle = 'rgba(40,40,60,.25)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(p.x, p.y + 8 * k); ctx.stroke(); }
  // a quick demonstration the first time a tool is picked: a ghost finger stroking a tooth that needs it
  if (ui.demo) { const d = ui.demo, u = (d.t % 1.1) / 1.1, p = m2s(G, d.x + Math.sin(u * TAU) * 0.08, d.y + Math.cos(u * TAU * 2) * 0.02); ctx.globalAlpha = Math.min(1, (2.2 - d.t) * 2); ctx.font = `${Math.round(30 * k)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('👆', p.x, p.y + LIFT * k * 0.8); ctx.globalAlpha = 1; }
  // the wire key's gauge
  if (G.gauge) { const g = G.gauge, bx = W - 40 * k, bh = 160 * k, y0 = L.cy - bh / 2, u = Math.min(1.25, gaugeP(G)) / 1.25; ctx.fillStyle = 'rgba(20,24,34,.85)'; rrect(bx - 14 * k, y0 - 6, 28 * k, bh + 12, 10); ctx.fill();
    ctx.fillStyle = 'rgba(120,230,150,.9)'; ctx.fillRect(bx - 9 * k, y0 + bh * (1 - (g.g0 + g.gw) / 1.25), 18 * k, bh * g.gw / 1.25); ctx.fillStyle = '#fff'; ctx.fillRect(bx - 12 * k, y0 + bh * (1 - u) - 2, 24 * k, 4);
    ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.textAlign = 'right'; ctx.fillText('LET GO IN THE GREEN', bx - 18 * k, y0 + bh * (1 - g.g0 / 1.25)); }
  // buttons and the tray
  const btn = (b, txt, on, sub) => { ctx.fillStyle = on ? 'rgba(106,208,184,.95)' : 'rgba(30,40,56,.75)'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill(); ctx.font = `${Math.round(b.r * 0.9)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText(txt, b.x, b.y + 1);
    if (sub) { ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.fillStyle = '#3a4a5a'; ctx.fillText(sub, b.x, b.y + b.r + 9 * k); } };
  const other = left(P).some(q => q.a !== G.arch);
  btn(L.flip, '⇅', other && left(P).every(q => q.a !== G.arch), G.arch ? 'LOWER' : 'UPPER'); btn(L.re, '💬', false, G.reCd > 0 ? `${Math.ceil(G.reCd)}s` : 'CALM'); btn(L.zoom, ui.zoom > 1 ? '➖' : '➕', ui.zoom > 1, 'ZOOM'); btn(L.done, '✓', !left(P).length, 'DONE');
  const want = nextTool(G); for (const b of L.tray) { const sel = G.tool === b.id, glow = want === b.id && !sel && (G.N <= 10 || G.lesson); ctx.fillStyle = sel ? '#6ad0b8' : 'rgba(255,255,255,.95)'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill();
    if (glow) { ctx.strokeStyle = `rgba(255,190,60,${0.6 + 0.4 * Math.sin(now * 6)})`; ctx.lineWidth = 4; ctx.stroke(); } else { ctx.strokeStyle = 'rgba(60,80,100,.25)'; ctx.lineWidth = 1.5; ctx.stroke(); }
    ctx.font = `${Math.round(b.r * 1.05)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(TOOLS[b.id].icon, b.x, b.y + 1); }
  if (G.tool) { ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillStyle = '#3a4a5a'; ctx.fillText(TOOLS[G.tool].name.toUpperCase(), W / 2, L.flip.y); }
}
// which tool the next job wants (the tray glows it), from the checklist of this row
function nextTool(G) { const P = pat(G), Lf = left(P).filter(q => q.a === G.arch), A = archOf(G); if (G.lesson) return G.lesson.steps[0].tool;
  if (A.teeth.some(t => (t.cav || t.abscess) && !t.found)) return G.cfg.tools.includes('xray') && A.teeth.some(t => (t.cav === 'deep' || t.abscess) && !t.found && t.mHint) ? 'xray' : 'mirror';
  const w = (Lf[0] || {}).w, has = x => Lf.some(q => q.w === x); if (!w) return null;
  for (const [x, tl] of [['food', 'brush'], ['plaque', 'brush'], ['tartar', 'scaler'], ['stain', 'polish'], ['decay', 'drill'], ['rinse', 'water'], ['fill', 'fill'], ['chip', 'fill'], ['smooth', 'shaper'], ['prep', 'shaper'], ['cure', 'light'], ['crown', 'crown'], ['cement', 'light'], ['bracket', 'glue'], ['wire', 'wire']]) if (has(x)) return tl;
  if (has('extract')) { const t = A.teeth.find(q => q.abscess); return t && t.numbAt != null ? 'forceps' : 'gel'; } return null; }
// ---------- the top strip: the patient, their comfort, the clock, the checklist ----------
function strip(G, now) { const P = pat(G), y = 72 * k, fx = 34 * k, fr = 24 * k, c = P.comfort, mood = moodOf(G, P);
  ctx.fillStyle = 'rgba(255,255,255,.94)'; rrect(8, y - 30 * k, W - 16, 62 * k, 14); ctx.fill(); ctx.strokeStyle = 'rgba(60,80,100,.15)'; ctx.lineWidth = 1; ctx.stroke();
  // their face
  ctx.fillStyle = SKIN[P.skin]; ctx.beginPath(); ctx.arc(fx, y, fr, 0, TAU); ctx.fill(); ctx.fillStyle = HAIR[P.hair]; ctx.beginPath(); ctx.arc(fx, y - fr * 0.25, fr, Math.PI * 1.05, Math.PI * 1.95); ctx.fill();
  ctx.fillStyle = '#1a1a22'; if (mood === 'hurt') { ctx.lineWidth = 2.5; ctx.strokeStyle = '#1a1a22'; for (const ex of [-8, 8]) { ctx.beginPath(); ctx.moveTo(fx + ex * k - 4, y - 4); ctx.lineTo(fx + ex * k + 4, y); ctx.stroke(); } } else for (const ex of [-8, 8]) { ctx.beginPath(); ctx.arc(fx + ex * k, y - 2, 2.6 * k, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#5a1a1a'; ctx.beginPath(); ctx.ellipse(fx, y + 9 * k, 7 * k, 5 * k, 0, 0, TAU); ctx.fill();      // mouth open: they are in the chair
  if (mood === 'hurt') { ctx.fillStyle = '#8ad0ff'; ctx.beginPath(); ctx.arc(fx + 16 * k, y - 12 * k, 4 * k, 0, TAU); ctx.fill(); }
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = `700 ${Math.round(15 * k)}px ${TF}`; ctx.fillStyle = '#2a3a4a'; ctx.fillText(`${P.name}${P.kind !== 'calm' ? ` · ${KINDS[P.kind].name}` : ''}`, fx + 32 * k, y - 13 * k);
  const bx = fx + 32 * k, bw = W * 0.38, col = c > 0.6 ? '#5ac88a' : c > 0.3 ? '#f2c23a' : '#f2604a'; ctx.fillStyle = 'rgba(60,80,100,.12)'; rrect(bx, y + 2 * k, bw, 10 * k, 5); ctx.fill(); ctx.fillStyle = col; rrect(bx, y + 2 * k, Math.max(5, bw * clamp(c, 0, 1)), 10 * k, 5); ctx.fill();
  ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.fillStyle = '#5a6a7a'; ctx.fillText('COMFORT' + (P.strikes ? `  · breaks ${'●'.repeat(P.strikes)}${'○'.repeat(G.cfg.strikes - P.strikes)}` : ''), bx, y + 22 * k);
  // the clock: when the clinic closes
  if (!G.cfg.relax && !G.lesson) { const u = clamp(G.clock / G.budget, 0, 1), x = W - 20 - 58 * k, cy = y; ctx.strokeStyle = 'rgba(60,80,100,.15)'; ctx.lineWidth = 6 * k; ctx.beginPath(); ctx.arc(x + 29 * k, cy, 20 * k, 0, TAU); ctx.stroke();
    ctx.strokeStyle = u > 0.25 ? '#6aaee8' : '#f2604a'; ctx.beginPath(); ctx.arc(x + 29 * k, cy, 20 * k, -Math.PI / 2, -Math.PI / 2 + TAU * u); ctx.stroke(); ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillStyle = '#2a3a4a'; ctx.fillText(`${Math.ceil(G.clock)}s`, x + 29 * k, cy + 1);
    if (G.pts.length > 1) { ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.fillText(`patient ${G.pi + 1}/${G.pts.length}`, x + 29 * k, cy + 30 * k); } }
  // the checklist
  const rows = checklist(G); ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; let x = 10, yy = y + 46 * k;
  for (const r of rows) { const t = `${r.done ? '✓' : r.icon} ${r.txt}`, w = ctx.measureText(t).width + 16; if (x + w > W - 10) { x = 10; yy += 22 * k; } ctx.fillStyle = r.done ? 'rgba(90,200,138,.2)' : 'rgba(255,255,255,.9)'; rrect(x, yy - 9 * k, w, 18 * k, 9); ctx.fill(); ctx.fillStyle = r.done ? '#2a8a5a' : '#2a3a4a'; ctx.textAlign = 'left'; ctx.fillText(t, x + 8, yy); x += w + 6; }
}
// ---------- events ----------
const WARN = { brushwrong: 'The brush is done here: that yellow crust needs the 🪝 scaler, the brown stain the ✨ polisher.', scalerwrong: 'The scaler is for the yellow crust (tartar) at the gum line.',
  polishfirst: 'Brush and scrape first: the polisher only works on clean teeth.', lookfirst: 'Find it first: drag the 🔍 mirror over the teeth (or take an X-ray).', drillslow: 'Slowly with the drill: hold it on the dark decay.',
  rinsefirst: 'Rinse the dust out first (💧 water), then fill.', nohole: 'Nothing to fill on this tooth.', fillfirst: 'Fill it up first, then the blue light.', nothingtocure: 'The blue light sets a filling or a crown. Nothing to set here.',
  prep: 'Smooth the broken edge with the 🥄 shaper first, then the crown.', jagshaper: 'Use the 🥄 shaper to smooth the broken edge.', nobraces: 'No braces on this row.', brackets: 'Glue the loose bracket first (🧴), then tighten the wire.', done: 'The wire is already right.',
  healthy: 'That tooth is healthy! The forceps are only for the bad tooth.', numb: 'Numb it first: 🧊 gel on the bad tooth, then wait a moment.' };
function onEvent(G, e) { const P = pat(G), A = archOf(G), at = i => { const t = A.teeth[i]; return t ? m2s(G, t.x, t.y) : { x: W / 2, y: H / 2 }; };
  switch (e.k) {
    case 'patient': ui.snap = true; ui.zoom = 1; ui.showLeft = 0; break;
    case 'work': sfx.click(); if (G.N <= 3 && !G.lesson) tip('order' + G.N, 'Brush 🪥 first, scrape 🪝 the yellow crust, polish ✨ the stains. ⇅ turns to the other row. ✓ when it all shines.', 4.5);
      if (P.probs.length) tip('find', 'Something hurts: the checklist has a ❓. The glowing tool on the tray is the one to use next.', 4); break;
    case 'tool': sfx.pick(); vibe(HAP.tick); if (!ui.seen[e.id]) { ui.seen[e.id] = 1; const t = A.teeth.find(q => toothLeft(q, A).length) || A.teeth[4]; ui.demo = { t: 0, x: t.x, y: t.y }; } break;
    case 'warn': sfx.no(); if (WARN[e.why]) hint = { txt: WARN[e.why], t: 0, secs: 3.2 }; break;
    case 'ouch': sfx.ouch(); vibe(HAP.tick); FX.red = 0.3; say({ rough: 'TOO ROUGH!', enamel: 'OUCH! NOT THE HEALTHY PART', tight: 'OUCH! TOO TIGHT', healthy: 'THAT ONE IS HEALTHY!', numb: 'OUCH! NUMB IT FIRST' }[e.why] || 'OUCH!', W / 2, H * 0.3, '#f2604a', 20); if (e.why === 'rough') hint = { txt: 'Calm, steady strokes clean. Scrubbing fast does nothing and hurts.', t: 0, secs: 3 }; break;
    case 'enamel': hint = { txt: 'Only the dark decay. The drill on healthy tooth hurts and costs a star.', t: 0, secs: 3.2 }; break;
    case 'found': sfx.found(); vibe(HAP.light); { const p = at(e.t); say(e.what === 'abscess' ? 'BAD TOOTH FOUND' : 'CAVITY FOUND!', p.x, p.y - 30 * k, '#f2a03a', 20); burst(p.x, p.y, '#f2c23a', 10, 90); } break;
    case 'deephint': { const p = at(e.t); say('HMM… DEEPER? X-RAY IT', p.x, p.y - 30 * k, '#6aaee8', 16); } break;
    case 'xray': sfx.xray(); break;
    case 'clean': sfx.ding(); vibe(HAP.tick); { const p = at(e.t); burst(p.x, p.y, '#ffffff', 6, 70); if (e.what !== 'food') say('✨', p.x, p.y - 20 * k, '#fff', 20); } break;
    case 'drilled': sfx.ding(); { const p = at(e.t); say('DECAY GONE', p.x, p.y - 26 * k, '#5ac88a', 16); } break;
    case 'fixed': sfx.fixed(); vibe(HAP.light); { const p = e.t != null ? at(e.t) : { x: W / 2, y: H * 0.45 }; say({ filling: 'FILLED!', chip: 'GOOD AS NEW!', crown: 'CROWN SET!', bracket: 'BRACKET ON', wire: 'WIRE JUST RIGHT' }[e.what] || 'DONE!', p.x, p.y - 30 * k, '#5ac88a', 22); burst(p.x, p.y, '#ffffff', 16, 140); } break;
    case 'crownon': sfx.click(); { const p = at(e.t); say('NOW THE BLUE LIGHT', p.x, p.y - 30 * k, '#6aaee8', 16); } break;
    case 'gel': sfx.click(); { const p = at(e.t); say('NUMBING…', p.x, p.y - 30 * k, '#8ad8ff', 16); } break;
    case 'rock': sfx.creak(); break;
    case 'pulled': sfx.fixed(); vibe(HAP.best); { const p = at(e.t); say('OUT!', p.x, p.y - 30 * k, '#5ac88a', 26); burst(p.x, p.y, '#f2a0a8', 14, 140); } break;
    case 'wire': if (e.why === 'loose') say('TOO LOOSE: AGAIN', W / 2, H * 0.4, '#f2c23a', 18); break;
    case 'gauge': sfx.gauge(); break;
    case 'reassure': sfx.reassure(); say(pick(Math.random, ['"You are doing great!"', '"Nearly there."', '"Deep breath. All fine."', '"Tell me if it pinches."']), W / 2, H * 0.24, '#2a8a5a', 16); break;
    case 'break': sfx.ouch(); FX.red = 0.5; ui.banner = { txt: 'THEY NEED A BREAK', sub: P.strikes < G.cfg.strikes ? `Slower, gentler, and 💬. ${G.cfg.strikes - P.strikes} more and they leave.` : 'They are leaving…', t: 0, secs: 2.6, small: true }; break;
    case 'notyet': sfx.no(); ui.showLeft = 3; hint = { txt: `Not yet: ${e.n} ${e.n === 1 ? 'thing' : 'things'} left (red rings).${e.left.some(q => q.a !== G.arch) ? ' Some on the other row: ⇅.' : ''}`, t: 0, secs: 3.2 }; break;
    case 'flip': sfx.flip(); ui.zoom = 1; break;
    case 'smile': sfx.smile(); vibe(HAP.best); FX.flash = 0.4; ui.banner = { txt: pick(Math.random, ['WHAT A SMILE!', 'ALL BETTER!', 'SPARKLING!']), sub: pick(Math.random, [`"Thank you, doctor!"`, `"It doesn't hurt any more!"`, `"Look at that shine!"`]), t: 0, secs: 2.4 }; break;
    case 'lessonnext': if (e.first) hint = null; say('FIRST, A LESSON', W / 2, H * 0.36, '#f2a03a', 24); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, W / 2, H * 0.36, '#2a8a5a', 24); sfx.coin(e.n); break;
    case 'lessonmiss': hint = { txt: e.how, t: 0, secs: 3.6 }; break;
    case 'lessondone': say('YOU\'VE GOT IT. NEXT PATIENT!', W / 2, H * 0.36, '#2a8a5a', 22); sfx.smile(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.star(3); break;
    case 'lost': sfx.lose(); break;      // (P11: never vibrate on failure)
  } }
// ---------- the picture ----------
let IG = null, IM = {}; function idleG() { if (!IG || IG.over || IG.t > 40) { IG = newGame(2 + ((Math.random() * 8) | 0), { seed: (Math.random() * 1e6) | 0 }); IM = {}; ui.snap = true; } honest(IG, { react: 0.4, acc: 0.95 }, IM); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const g = G || idleG(), work = g.phase === 'work' || g.phase === 'break';
  const V = buildWorld(); if (!V.none && !(work && G)) { sync(V, g, dt || 1 / 60); W3.render(dt || 1 / 60); } else if (V.none && !(work && G)) { ctx.fillStyle = '#cdeee6'; ctx.fillRect(0, 0, W, H); }
  if (G && work) { drawMouth(G, now); strip(G, now); if (G.phase === 'break') { ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(0, 0, W, H); } }
  if (G && G.lesson && work) lessonPanel(G);
  if (G && G.phase === 'talk') talkBubble(G, now);
  if (G && G.phase === 'smile') beforeAfter(G);
  if (FX.red > 0) { ctx.fillStyle = `rgba(240,80,70,${FX.red * 0.16})`; ctx.fillRect(0, 0, W, H); }
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 1.1 ? 1 : 1 - (t2.t - 1.1) / 0.5; ctx.globalAlpha = Math.max(0, al); ctx.font = `600 ${Math.round(t2.size * k)}px ${TF}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 18); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 18); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30, L = layout(g), hy = L.flip.y - 44 * k - h / 2;
    ctx.fillStyle = 'rgba(30,44,60,.94)'; rrect(W / 2 - w / 2, hy - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, hy - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (ui.banner) banner();
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${FX.flash * 0.35})`; ctx.fillRect(0, 0, W, H); } }
function talkBubble(G, now) { const P = pat(G), y = H * 0.18, w = W - 40; ctx.font = `600 ${Math.round(17 * k)}px ${TF}`; const lines = wrapText(`"${P.complaint}"`, w - 40), h = lines.length * 24 * k + 54 * k;
  ctx.fillStyle = 'rgba(255,255,255,.96)'; rrect(20, y, w, h, 18); ctx.fill(); ctx.beginPath(); ctx.moveTo(W * 0.55, y + h); ctx.lineTo(W * 0.62, y + h + 22 * k); ctx.lineTo(W * 0.68, y + h); ctx.fill();
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#6a7a8a'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillText(`${P.name.toUpperCase()}${P.kind !== 'calm' ? ' · ' + KINDS[P.kind].name.toUpperCase() : ''}${G.pts.length > 1 ? ` · PATIENT ${G.pi + 1} OF ${G.pts.length}` : ''}`, 36, y + 14 * k);
  ctx.fillStyle = '#2a3a4a'; ctx.font = `600 ${Math.round(17 * k)}px ${TF}`; lines.forEach((l, i) => ctx.fillText(l, 36, y + 34 * k + i * 24 * k)); ctx.textBaseline = 'middle';
  ctx.textAlign = 'center'; ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; ctx.fillStyle = 'rgba(42,58,74,.8)'; ctx.fillText('tap to begin · "Open wide!"', W / 2, H - 60 * k); }
function beforeAfter(G) { const P = pat(G), w = W * 0.42, y = H - 170 * k;
  const mini = (data, x0, lbl, A) => { ctx.fillStyle = 'rgba(255,255,255,.95)'; rrect(x0, y, w, 140 * k, 14); ctx.fill(); ctx.fillStyle = '#6a7a8a'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillText(lbl, x0 + w / 2, y + 14 * k);
    const s = w / 1.7, cx = x0 + w / 2, cy = y + 74 * k; A.teeth.forEach((t, i) => { const px = cx + t.x * s, py = cy + (t.y + 0.2) * s * 0.75, r = t.r * s; const g = data ? data[i].g : null, dirty = g && g.some(v => v & 7), bad = g && g.some(v => v & 24);
      ctx.fillStyle = t.gone && !data ? '#e8a0a8' : data ? (bad ? '#7a5a3a' : dirty ? '#e8d090' : '#fffaf0') : '#ffffff'; ctx.beginPath(); ctx.arc(px, py, r, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(60,80,100,.25)'; ctx.lineWidth = 1; ctx.stroke(); }); };
  const a = P.probs.length ? P.probs[0].a : 0; mini(P.before[a], W / 2 - w - 6, 'BEFORE', P.arches[a]); mini(null, W / 2 + 6, 'AFTER ✨', P.arches[a]); }
function banner() { const b = ui.banner, a = Math.min(1, b.t / 0.2, ((b.secs || 2.4) - b.t) / 0.4); ctx.globalAlpha = Math.max(0, a); ctx.textAlign = 'center';
  ctx.font = `700 ${Math.round((b.small ? 28 : 38) * k)}px ${TF}`; ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.strokeText(b.txt, W / 2, H * 0.4); ctx.fillStyle = '#2a8a7a'; ctx.fillText(b.txt, W / 2, H * 0.4);
  if (b.sub) { ctx.font = `700 ${Math.round(15 * k)}px ${BC}`; ctx.lineWidth = 4; ctx.strokeText(b.sub, W / 2, H * 0.4 + 30 * k); ctx.fillStyle = '#2a3a4a'; ctx.fillText(b.sub, W / 2, H * 0.4 + 30 * k); } ctx.globalAlpha = 1; }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { const D = G.lesson, st0 = D.steps[D.i], x = 10, w = W - 20, y = 108 * k; ctx.save();
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; const lines = wrapText(st0.how, w - 24), h = 46 * k + lines.length * 17 * k;
  ctx.fillStyle = 'rgba(30,44,60,.93)'; rrect(x, y, w, h, 12); ctx.fill();
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#6ad0b8'; ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillText(`LESSON ${G.N} OF 3`, x + 12, y + 8 * k);
  ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(17 * k)}px ${TF}`; ctx.fillText(st0.title, x + 12, y + 21 * k);
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.9)'; lines.forEach((l, i) => ctx.fillText(l, x + 12, y + 42 * k + i * 17 * k));
  for (let i = 0; i < st0.need; i++) { ctx.beginPath(); ctx.arc(x + w - 16 - (st0.need - 1 - i) * 18 * k, y + 16 * k, 6 * k, 0, TAU); if (i < D.n) { ctx.fillStyle = '#8fe0ab'; ctx.fill(); } else { ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; ctx.stroke(); } }
  ctx.restore(); }
