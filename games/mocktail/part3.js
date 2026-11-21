// ===================== THE VIEW: Mocktail Bar (3D counter in front of you; the bar's tools in a tray below) =====================
// From behind the counter: the customer on a stool opposite (their face shows what they think), the back shelves glowing, and in
// front of you the glass you are making: liquid rising in its colours (a heavy syrup sinks into a layer), ice tumbling, the
// stream from the bottle while you pour, the shaker, the spoon, the garnish on the rim. Below: the order card at the top, and
// the tray: tabs of bottles, glasses, ice, tools, a big POUR (hold) and SERVE.
const FX = { shake: 0, stop: 0, flash: 0, red: 0, slow: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { snap: true, banner: null, drag: null, tab: 'juice', bubble: null, stirA: null, book: 0 };
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 160) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60 * k, t: 0, life: 0.6 + Math.random() * 0.4, col, r: (1.5 + Math.random() * 2.5) * k }); } if (PARTS.length > 240) PARTS.splice(0, PARTS.length - 240); }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2.5); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.4) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (ui.banner) { ui.banner.t += dt; if (ui.banner.t > (ui.banner.secs || 1)) ui.banner = null; } if (ui.bubble) { ui.bubble.t += dt; if (ui.bubble.t > ui.bubble.secs) ui.bubble = null; } ui.book = Math.max(0, ui.book - dt);
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; } }
function mySkin() { if (typeof HEADLESS !== 'undefined' && HEADLESS) return SKINS[0]; const id = store.get('skin', 'classic'); return SKINS.find(q => q.id === id) || SKINS[0]; }
function canvasTex(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const SKINC = ['#e8b48e', '#c88a64', '#8d5524', '#f0c8a0', '#6a4024', '#d8a078'], HAIRC = ['#1a1410', '#4a2a14', '#c8a050', '#2a1a10', '#8a3a1a', '#e0e0e0'];
function buildWorld() {
  if (V3) return V3; const T = window.THREE; if (!T || !W3 || !W3.init({ canvas: $('gl'), fov: 46, far: 60, near: 0.05 })) { V3 = { none: true }; return V3; }
  V3 = { T, S: W3.scene, t: 0 }; const V = V3, S = V.S, M = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.6 }, o));
  V.boxG = new T.BoxGeometry(1, 1, 1); V.sphG = new T.SphereGeometry(1, 20, 14); V.cylG = new T.CylinderGeometry(1, 1, 1, 24);
  W3.setSky('dusk', { azim: 200 }); W3.S.exposure = 1.1; W3.R.toneMappingExposure = 1.1; W3.scene.environmentIntensity = 0.5; W3.hemi.intensity = 0.8; W3.S.hemiI = 0.8; W3.sun.visible = false; W3.scene.fog.near = 20; W3.scene.fog.far = 60; W3.scene.children.forEach(o => { if (o.isLineSegments) o.visible = false; });
  // the room: back wall with glowing shelves of bottles, the counter in front of you, a stool for the customer
  const wall = new T.Mesh(new T.PlaneGeometry(14, 6), M(0x3a2430, { roughness: 0.9 })); wall.position.set(0, 2.2, -4.2); S.add(wall);
  for (let r = 0; r < 3; r++) { const sh = new T.Mesh(V.boxG, M(0x6a4a2a)); sh.scale.set(6, 0.06, 0.35); sh.position.set(0, 1.5 + r * 0.7, -4.0); S.add(sh); for (let i = 0; i < 16; i++) { const b = new T.Mesh(V.cylG, new T.MeshStandardMaterial({ color: new T.Color().setHSL(((i * 37 + r * 13) % 100) / 100, 0.6, 0.5), roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.85, emissive: new T.Color().setHSL(((i * 37 + r * 13) % 100) / 100, 0.7, 0.18) })); b.scale.set(0.08, 0.32 + ((i * 7) % 3) * 0.06, 0.08); b.position.set(-2.8 + i * 0.37, 1.7 + r * 0.7, -4.0); S.add(b); } }
  const strip = new T.Mesh(V.boxG, new T.MeshBasicMaterial({ color: 0xff7aa8, toneMapped: false })); strip.scale.set(6.2, 0.03, 0.03); strip.position.set(0, 3.7, -4.05); S.add(strip);
  V.bar = new T.Mesh(V.boxG, M(mySkin().col, { roughness: 0.35 })); V.bar.scale.set(5, 0.12, 1.6); V.bar.position.set(0, 0.95, -0.1); S.add(V.bar); const front = new T.Mesh(V.boxG, M(0x2a1a14)); front.scale.set(5, 1.0, 0.1); front.position.set(0, 0.45, -0.95); S.add(front);
  const stool = new T.Mesh(V.cylG, M(0x8a1a2a)); stool.scale.set(0.3, 0.08, 0.3); stool.position.set(0, 0.55, -2.25); S.add(stool);
  V.lights = []; for (let i = 0; i < 9; i++) { const L = new T.Mesh(V.sphG, new T.MeshBasicMaterial({ color: [0xffd080, 0xff9ac0, 0x9ad8ff][i % 3], toneMapped: false })); L.scale.setScalar(0.035); L.position.set(-2 + i * 0.5, 2.6 + Math.sin(i) * 0.08, -1.2); L.visible = false; S.add(L); V.lights.push(L); }
  const face = new T.PointLight(0xffe0c8, 4, 4, 1.5); face.position.set(0, 1.9, -1.2); S.add(face); const lamp = new T.PointLight(0xffd8b0, 6, 8, 1.4); lamp.position.set(0, 2.8, 0.3); S.add(lamp); const lamp2 = new T.PointLight(0xff8ac0, 3, 8, 1.5); lamp2.position.set(-2, 2.5, -3); S.add(lamp2);
  // the customer: body, head with a face drawn on a texture (it changes with their mood)
  V.cust = new T.Group(); V.cust.scale.setScalar(0.85); V.cust.position.set(0, 0.62, -2.3); S.add(V.cust); V.custBody = new T.Mesh(V.sphG, M(0x3a6ab8)); V.custBody.scale.set(0.32, 0.42, 0.24); V.custBody.position.y = 0.45; V.cust.add(V.custBody);
  V.faceC = document.createElement('canvas'); V.faceC.width = V.faceC.height = 128; V.faceT = new T.CanvasTexture(V.faceC); V.faceT.colorSpace = T.SRGBColorSpace;
  V.head = new T.Mesh(V.sphG, new T.MeshStandardMaterial({ map: V.faceT, roughness: 0.7 })); V.head.scale.set(0.2, 0.23, 0.2); V.head.position.y = 1.05; V.head.rotation.y = -Math.PI / 2; V.cust.add(V.head);
  V.hair = new T.Mesh(new T.SphereGeometry(1, 20, 12, 0, TAU, 0, 1.3), M(0x1a1410, { roughness: 0.8 })); V.hair.scale.set(0.215, 0.24, 0.215); V.hair.position.y = 1.08; V.cust.add(V.hair);
  for (const s of [-1, 1]) { const a = new T.Mesh(V.cylG, M(0x3a6ab8)); a.scale.set(0.07, 0.42, 0.07); a.position.set(s * 0.3, 0.42, 0.15); a.rotation.x = -0.9; V.cust.add(a); }
  // your glass: a clear shell, the drink inside (stacked layers), ice cubes, a garnish; the shaker; the stream; the spoon
  V.glassG = new T.Group(); V.glassG.position.set(0, 1.01, GZ); S.add(V.glassG);
  V.shell = new T.Mesh(new T.CylinderGeometry(1, 1, 1, 32, 1, true), new T.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, transmission: 0.6, transparent: true, opacity: 0.28, side: T.DoubleSide })); V.glassG.add(V.shell);
  V.layers = []; for (let i = 0; i < 6; i++) { const l = new T.Mesh(V.cylG, new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, transparent: true, opacity: 0.85 })); l.visible = false; V.glassG.add(l); V.layers.push(l); }
  V.ice = []; for (let i = 0; i < 8; i++) { const c = new T.Mesh(V.boxG, new T.MeshPhysicalMaterial({ color: 0xe8f8ff, roughness: 0.1, transmission: 0.5, transparent: true, opacity: 0.7 })); c.visible = false; V.glassG.add(c); V.ice.push(c); }
  V.garn = new T.Group(); V.glassG.add(V.garn); V.fresh = []; for (let i = 0; i < 6; i++) { const f = new T.Mesh(V.sphG, M(0x3aa050)); f.scale.set(0.02, 0.01, 0.03); f.visible = false; V.glassG.add(f); V.fresh.push(f); }
  V.shaker = new T.Group(); V.shaker.position.set(0.36, 1.01, GZ); S.add(V.shaker); const sk = new T.Mesh(new T.CylinderGeometry(0.075, 0.06, 0.26, 24), M(0xd8dce0, { metalness: 0.9, roughness: 0.2 })); sk.position.y = 0.13; V.shaker.add(sk); const cap = new T.Mesh(new T.CylinderGeometry(0.05, 0.075, 0.08, 24), M(0xd8dce0, { metalness: 0.9, roughness: 0.2 })); cap.position.y = 0.3; V.shaker.add(cap);
  V.stream = new T.Mesh(V.cylG, new T.MeshStandardMaterial({ color: 0xffa020, transparent: true, opacity: 0.85 })); V.stream.visible = false; S.add(V.stream);
  V.bottle = new T.Group(); const bb = new T.Mesh(V.cylG, new T.MeshPhysicalMaterial({ color: 0x88cc88, roughness: 0.1, transmission: 0.3, transparent: true, opacity: 0.8 })); bb.scale.set(0.032, 0.16, 0.032); V.bottle.add(bb); const neck = new T.Mesh(V.cylG, M(0x222222)); neck.scale.set(0.012, 0.07, 0.012); neck.position.y = 0.11; V.bottle.add(neck); V.bottle.visible = false; S.add(V.bottle); V.bottleM = bb.material;
  V.spoon = new T.Mesh(V.cylG, M(0xd0d0d0, { metalness: 0.9, roughness: 0.2 })); V.spoon.scale.set(0.006, 0.32, 0.006); V.spoon.visible = false; V.glassG.add(V.spoon);
  W3.setQuality(stepN); return V; }
const GZ = -0.45, GSHAPE = { highball: { r: 0.06, h: 0.2 }, rocks: { r: 0.072, h: 0.12 }, coupe: { r: 0.085, h: 0.08 }, hurricane: { r: 0.07, h: 0.24 } };
function drawFace(V, mood, look) { const g = V.faceC.getContext('2d'), w = 128; g.fillStyle = SKINC[look % SKINC.length]; g.fillRect(0, 0, w, w); g.fillStyle = '#1a1410';
  for (const sx of [0.38, 0.62]) { g.beginPath(); g.ellipse(sx * w + 0, 0.46 * w, 5, mood === 'happy' ? 3 : 6, 0, 0, TAU); g.fill(); }
  g.strokeStyle = '#5a2a1a'; g.lineWidth = 4; g.beginPath(); if (mood === 'happy') g.arc(0.5 * w, 0.58 * w, 14, 0.15 * Math.PI, 0.85 * Math.PI); else if (mood === 'sad') g.arc(0.5 * w, 0.72 * w, 13, 1.15 * Math.PI, 1.85 * Math.PI); else if (mood === 'wait') { g.moveTo(0.42 * w, 0.66 * w); g.lineTo(0.58 * w, 0.66 * w); } else { g.arc(0.5 * w, 0.62 * w, 8, 0.1 * Math.PI, 0.9 * Math.PI); } g.stroke();
  if (mood === 'sad') { g.beginPath(); g.moveTo(0.3 * w, 0.36 * w); g.lineTo(0.43 * w, 0.4 * w); g.moveTo(0.7 * w, 0.36 * w); g.lineTo(0.57 * w, 0.4 * w); g.stroke(); }
  if (mood === 'happy') { g.fillStyle = 'rgba(255,100,100,.35)'; g.beginPath(); g.arc(0.3 * w, 0.58 * w, 8, 0, TAU); g.arc(0.7 * w, 0.58 * w, 8, 0, TAU); g.fill(); }
  V.faceT.needsUpdate = true; }
const colOf = id => (ING[id] || FRESH[id] || {}).col || '#ffffff';
function mixCol(parts) { let r = 0, g = 0, b = 0, n = 0; for (const p of parts) { const c = new THREE.Color(colOf(p.id)); r += c.r * p.n; g += c.g * p.n; b += c.b * p.n; n += p.n; } return n ? new THREE.Color(r / n, g / n, b / n) : new THREE.Color(1, 1, 1); }
function sync(V, G, dt) { V.t += dt; const T = V.T, D = G.drink, o = G.order; if (!D) return;
  V.lights.forEach(L => L.visible = upLv('lights') > 0); V.bar.material.color.setHex(mySkin().col);
  // the customer: a new face for each order; their mood follows the verdict
  const look = o ? PEOPLE.indexOf(o.who) : 0, mood = ui.bubble ? (ui.bubble.like ? 'happy' : ui.bubble.like === false ? 'sad' : 'wait') : o && o.feel ? 'think' : 'wait';
  if (V.faceKey !== look + mood) { V.faceKey = look + mood; drawFace(V, mood, Math.max(0, look)); V.hair.material.color.set(HAIRC[Math.max(0, look) % HAIRC.length]); V.custBody.material.color.setHSL((Math.max(0, look) * 0.17) % 1, 0.5, 0.45); }
  V.cust.visible = !!o && !o.free; V.cust.position.y = 0.62 + Math.sin(V.t * 2) * 0.006; V.head.rotation.z = ui.bubble && ui.bubble.like ? Math.sin(V.t * 10) * 0.08 : ui.bubble && ui.bubble.like === false ? Math.sin(V.t * 6) * 0.15 : 0;
  // the glass: shape, the drink as layers (mixed into one colour once stirred or shaken; a heavy syrup poured last sits at the bottom)
  const gs = GSHAPE[D.glass] || GSHAPE.highball, cap = D.glass ? GLASSES[D.glass].cap : 9; V.glassG.visible = !!D.glass; V.shell.scale.set(gs.r, gs.h, gs.r); V.frost = D.ice !== 'none' && D.parts.length ? Math.min(1, (V.frost || 0) + dt / 4) : Math.max(0, (V.frost || 0) - dt); V.shell.material.opacity = 0.28 + 0.22 * V.frost; V.shell.material.roughness = 0.05 + 0.5 * V.frost;   /* condensation: the glass mists over once it is cold */ V.shell.position.y = gs.h / 2;
  const tot = D.parts.reduce((a, b) => a + b.n, 0), fillH = gs.h * Math.min(1, (tot + (D.ice !== 'none' ? 1 : 0)) / cap); let segs;
  if (!tot) segs = []; else if (D.mixedAfter || D.shook) segs = [{ col: mixCol(D.parts), n: tot }]; else { const heavy = D.parts.filter(p => ING[p.id].heavy && D.lastPour === p.id), rest = D.parts.filter(p => !heavy.includes(p)); segs = []; if (heavy.length) segs.push({ col: mixCol(heavy), n: heavy.reduce((a, b) => a + b.n, 0) }); if (rest.length) segs.push({ col: mixCol(rest), n: rest.reduce((a, b) => a + b.n, 0) }); }
  let y = 0.004; V.layers.forEach((l, i) => { const s = segs[i]; l.visible = !!s && !!D.glass; if (!s) return; const h = fillH * s.n / tot; l.scale.set(gs.r * 0.94, Math.max(0.001, h), gs.r * 0.94); l.position.y = y + h / 2; y += h; l.material.color.copy(s.col); l.material.emissive.copy(s.col).multiplyScalar(0.35); l.material.opacity = D.parts.some(p => ING[p.id].fizz) ? 0.8 : 0.93; });
  const nIce = D.ice === 'none' ? 0 : D.ice === 'crushed' ? 8 : 4; V.ice.forEach((c, i) => { c.visible = i < nIce && !!D.glass; if (!c.visible) return; const s = D.ice === 'crushed' ? 0.018 : 0.03; c.scale.setScalar(s); const a = i * 2.4 + V.t * 0.2, r = gs.r * 0.45; c.position.set(Math.cos(a) * r, Math.min(fillH, gs.h) - s * 0.3 - (i % 3) * s * 0.8 + Math.sin(V.t * 2 + i) * 0.002, Math.sin(a) * r); c.rotation.set(i, i * 2, 0); });
  V.fresh.forEach((f, i) => { const id = D.fresh[i % Math.max(1, D.fresh.length)]; f.visible = D.fresh.length > 0 && i < D.fresh.length * 3 && !!D.glass; if (f.visible) { f.material.color.set(colOf(id)); f.position.set(Math.cos(i * 2) * gs.r * 0.5, 0.012 + (D.muddled >= 3 ? 0 : 0.01 * i), Math.sin(i * 2) * gs.r * 0.5); f.scale.set(0.02, D.muddled >= 3 ? 0.004 : 0.01, 0.03); } });
  if (V.garnFor !== D.garn + D.glass) { V.garnFor = D.garn + D.glass; V.garn.clear(); if (D.garn) { const c = new THREE.Color(GARN[D.garn].col), m = new T.MeshStandardMaterial({ color: c, roughness: 0.5 }); let mesh;
      if (D.garn === 'cherry') { mesh = new T.Mesh(V.sphG, m); mesh.scale.setScalar(0.018); mesh.position.set(gs.r * 0.6, gs.h + 0.01, 0); }
      else if (D.garn === 'umbrella') { mesh = new T.Mesh(new T.ConeGeometry(0.06, 0.03, 12), m); mesh.position.set(gs.r * 0.5, gs.h + 0.08, 0); }
      else if (D.garn === 'mint') { mesh = new T.Mesh(V.sphG, m); mesh.scale.set(0.025, 0.035, 0.012); mesh.position.set(gs.r * 0.3, gs.h + 0.02, 0); }
      else { mesh = new T.Mesh(V.cylG, m); mesh.scale.set(0.035, 0.006, 0.035); mesh.rotation.z = Math.PI / 2; mesh.position.set(gs.r, gs.h - 0.01, 0); }
      V.garn.add(mesh); } }
  // the shaker rattles while you swipe; the bottle tips and pours a stream; the spoon turns while you stir
  V.shaker.visible = D.vessel === 'shaker' || D.shaker.length > 0; V.shaker.position.set(D.vessel === 'shaker' ? 0.2 : 0.36, 1.01 + (D.shakeAnim || 0) * 0.08, GZ); V.shaker.rotation.z = (D.shakeAnim || 0) * 0.5; D.shakeAnim = Math.max(0, (D.shakeAnim || 0) - dt * 4);
  const tgt = D.vessel === 'shaker' ? V.shaker.position : V.glassG.position, top = D.vessel === 'shaker' ? 0.34 : gs.h; V.bottle.visible = !!D.pouring; V.stream.visible = !!D.pouring;
  if (D.pouring) { V.bottleM.color.set(colOf(D.pouring)); V.bottle.position.set(tgt.x - 0.125, tgt.y + top + 0.2, tgt.z); V.bottle.rotation.z = -2.1; V.stream.material.color.set(colOf(D.pouring)); const sl = 0.13; V.stream.scale.set(0.006, sl, 0.006); V.stream.position.set(tgt.x, tgt.y + top + sl / 2, tgt.z); }
  V.spoon.visible = ui.stirA != null && !!D.glass; if (V.spoon.visible) { V.spoon.position.set(Math.cos(ui.stirA) * gs.r * 0.5, gs.h * 0.6, Math.sin(ui.stirA) * gs.r * 0.5); V.spoon.rotation.z = 0.2; }
  // the camera: your eyes behind the counter, looking at the glass and the customer
  const asp = innerWidth / innerHeight, portrait = asp < 0.8, cam = W3.cam; cam.fov = portrait ? 72 : 48; cam.aspect = asp; cam.setViewOffset(W, H * 1.36, 0, H * 0.37, W, H); cam.updateProjectionMatrix(); const sh = FX.shake ? (Math.random() - 0.5) * FX.shake * 0.0008 : 0;
  cam.position.set(sh, 1.45, portrait ? 0.95 : 0.85); cam.lookAt(0, 1.23, -1.6); cam.updateMatrixWorld(); W3.setFocus(0, 1, -0.5, 3); }
const SV = window.THREE ? new THREE.Vector3() : null;
function scr(x, y, z) { if (!V3 || V3.none) return { x: W / 2, y: H * 0.35 }; SV.set(x, y, z); return W3.screen(SV); }
function glassScr() { const D = G && G.drink, gs = GSHAPE[(D && D.glass) || 'highball'], b = scr(0, 1.01, GZ), t = scr(0, 1.01 + gs.h, GZ), e = scr(gs.r, 1.01 + gs.h / 2, GZ); return { x: b.x, y: (b.y + t.y) / 2, top: t.y, bot: b.y, r: Math.max(28 * k, Math.abs(e.x - b.x) * 1.6), h: Math.abs(b.y - t.y) }; }
// ---------- what happens, seen and heard ----------
function onEvent(G, e) { const cx = W / 2;
  switch (e.k) {
    case 'start': ui.banner = { txt: G.cfg.practice ? 'FREE MIX' : PLACES[placeOf(G.N)].name, t: 0, secs: 1.5, col: '#ff9ac0' }; break;
    case 'order': ui.bubble = null; ui.tab = G.drink && G.drink.glass ? 'juice' : 'glass'; if (!G.order.free) { sfx.bell(); if (e.retry) say('TRY AGAIN', cx, H * 0.3, '#ffd0e0', 22); else if (G.order.feel) tip('feel', 'They describe a FEELING: any drink that fits is right. Not sure? ASK one question.', 3.5); else if (G.N >= 4 && G.order.drink.how === 'muddle') tip('muddle', 'Fresh mint or berries: add them to the glass, then MUDDLE (tap 3 times) to crush them.', 3.4); else if (G.N >= 5 && G.order.drink.how === 'shake') tip('shake', 'SHAKE: tap SHAKER, pour into it, swipe up and down 6 times, then tap SHAKER again to pour it into the glass.', 3.8); else if (G.order.drink.how === 'layer') tip('layer', 'LAYERS: pour the heavy syrup LAST and do not stir: it sinks into a red layer.', 3.4); else if (G.order.drink.how === 'stir') tip('stir', 'STIR: draw circles on the glass with your finger.', 3); } break;
    case 'glass': sfx.glass(); vibe(HAP.tick); if (ui.tab === 'glass') ui.tab = 'juice'; break;
    case 'needglass': sfx.no(); say('PICK A GLASS FIRST', cx, H * 0.42, '#ffd0e0', 18); ui.tab = 'glass'; break;
    case 'select': sfx.click(); break;
    case 'pour': sfx.pourOn(); break; case 'pourstop': sfx.pourOff(); break; case 'full': sfx.no(); say('FULL!', cx, H * 0.42, '#fff', 18); sfx.pourOff(); break;
    case 'ice': sfx.ice(e.kind); vibe(HAP.tick); break; case 'fresh': sfx.leaf(); break;
    case 'muddle': sfx.muddle(); vibe(HAP.tick); if (e.n === 3) say('MUDDLED', cx, H * 0.42, '#9be3b5', 16); break;
    case 'shaker': sfx.glass(); break; case 'shake': sfx.shake(); if (G.drink) G.drink.shakeAnim = 1; if (e.n === 6) { say('SHAKEN!', cx, H * 0.42, '#9be3b5', 18); vibe(HAP.light); } break;
    case 'strain': sfx.pourOn(); setTimeout(() => sfx.pourOff(), 400); break;
    case 'stirred': sfx.stir(); say('STIRRED', cx, H * 0.42, '#9be3b5', 16); break;
    case 'garnish': sfx.leaf(); vibe(HAP.tick); break; case 'empty': sfx.pourOff(); say('EMPTIED', cx, H * 0.42, '#fff', 16); break;
    case 'asked': ui.bubble = { txt: e.txt, like: null, t: 0, secs: 4 }; sfx.chat(); break;
    case 'verdict': ui.bubble = { txt: e.like ? (e.minor && e.minor.length ? 'Lovely! ' + e.minor[0] : ['Perfect!', 'Delicious!', 'Just right!', 'Mmm, lovely!'][(G.t * 10 | 0) % 4]) : e.why.join(' '), like: e.like, t: 0, secs: 3.2 }; if (e.like) { sfx.happy(); vibe(HAP.light); const p = glassScr(); burst(p.x, p.top, '#ff9ac0', 20); } else { sfx.sad(); } break;
    case 'tip': say(`+${e.n} 🪙 TIP`, cx, H * 0.36, '#ffd36a', 20); sfx.coin(e.n); break;
    case 'free': { const q = e.q; ui.bubble = { txt: `Saved! Sweet ${q.sw.toFixed(1)} · sour ${q.so.toFixed(1)} · bitter ${q.bi.toFixed(1)} · fizz ${Math.round(q.fizz * 100)}%`, like: true, t: 0, secs: 3.5 }; sfx.happy(); const list = store.get('creations', []) || []; list.unshift(G.saved); store.set('creations', list.slice(0, 12)); break; }
    case 'won': sfx.win(); ui.banner = { txt: 'SHIFT DONE!', t: 0, secs: 1.5, col: '#ff9ac0' }; break;
    case 'lost': sfx.lose(); break;
    case 'lessonnext': hint = null; break; case 'lessonok': sfx.coin(e.n); break;
    case 'lessonmiss': hint = { txt: e.how + ' Look at the card and try again.', t: 0, secs: 3.4 }; sfx.no(); break;
    case 'lessondone': sfx.goal(); say('YOU CAN MIX!', cx, H * 0.4, '#ff9ac0', 28); burst(cx, H * 0.4, '#ff9ac0', 24); break;
  } }
let IG = null; function idleG() { if (!IG || IG.over || IG.t > 60) { IG = newGame(4 + ((Math.random() * 4) | 0), { seed: (Math.random() * 1e6) | 0 }); IG.mem = {}; } honest(IG, { react: 0.5, acc: 0.95 }, IG.mem); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#1a1424'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D bar.', W / 2, H / 2); if (G) hud(G, now); return; }
  const g = G || idleG(); sync(V, g, dt); W3.render(dt);
  if (G && !(G.over && !$('ovEnd').classList.contains('hidden'))) hud(G, now);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 0.9 ? 1 : 1 - (t2.t - 0.9) / 0.5; ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(t2.size * k)}px ${BC}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(20,10,20,.75)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 20); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 20); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30, hy = H * 0.3;
    ctx.fillStyle = 'rgba(30,16,30,.94)'; rrect(W / 2 - w / 2, hy - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, hy - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,240,250,${FX.flash * 0.4})`; ctx.fillRect(0, 0, W, H); } }
// ---------- the 2D layer: the order card, the customer's speech, the glass's marks, and the tray ----------
const TABS = [['glass', 'GLASS'], ['juice', 'JUICE'], ['syrup', 'SYRUP'], ['fizz', 'FIZZ'], ['fresh', 'FRESH'], ['garn', 'GARNISH']];
function tabItems(G, tab) { const N = G.cfg.practice ? 99 : G.N, ok = lv => lv <= Math.max(N, 1);
  if (tab === 'glass') return Object.keys(GLASSES).filter(id => ok(GLASSES[id].lv)).map(id => ({ id, name: GLASSES[id].name, col: '#cfe8ff', kind: 'glass' }));
  if (tab === 'fresh') return Object.keys(FRESH).filter(id => ok(FRESH[id].lv)).map(id => ({ id, name: FRESH[id].name, col: FRESH[id].col, kind: 'fresh' }));
  if (tab === 'garn') return Object.keys(GARN).filter(id => ok(GARN[id].lv)).map(id => ({ id, name: GARN[id].name, col: GARN[id].col, kind: 'garn' }));
  return Object.keys(ING).filter(id => ING[id].cat === tab && ok(ING[id].lv)).map(id => ({ id, name: ING[id].name, col: ING[id].col, kind: 'ing' })); }
function layout(G) { const panelY = H * 0.6, tabH = 34 * k, tw = (W - 16) / TABS.length, tabs = TABS.map((t, i) => ({ id: t[0], label: t[1], x: 8 + i * tw, y: panelY, w: tw - 4, h: tabH }));
  const items = tabItems(G, ui.tab), iy = panelY + tabH + 8 * k, cols = 4, iw = (W - 16 - 3 * 8) / cols, ih = Math.min(64 * k, iw * 0.8), its = items.map((it, i) => Object.assign({ x: 8 + (i % cols) * (iw + 8), y: iy + Math.floor(i / cols) * (ih + 8), w: iw, h: ih }, it));
  const ty = iy + 2 * (ih + 8) + 4 * k, bw = (W - 16 - 4 * 6) / 5, tools = [['cubes', 'ICE'], ['crushed', 'CRUSHED'], ['shaker', 'SHAKER'], ['muddle', 'MUDDLE'], ['empty', 'EMPTY']].map((t, i) => ({ id: t[0], label: t[1], x: 8 + i * (bw + 6), y: ty, w: bw, h: 40 * k }));
  const by = ty + 48 * k, pour = { x: 8, y: by, w: (W - 24) * 0.58, h: H - by - 12 * k }, serve = { x: 16 + (W - 24) * 0.58, y: by, w: (W - 24) * 0.42, h: H - by - 12 * k };
  return { tabs, items: its, tools, pour, serve, ask: { x: W - 92 * k, y: 104 * k, w: 80 * k, h: 30 * k }, book: { x: W - 92 * k, y: 104 * k, w: 80 * k, h: 30 * k } }; }
function cardLines(G) { const o = G.order; if (!o || o.free) return []; if (o.feel) return []; const R = o.drink, show = G.cfg.card === 'full' || ui.book > 0 || o.tries > 0;
  if (!show) return [G.cfg.card === 'names' ? 'Tap 📖 for the recipe' : 'Tap 📖 for the recipe (it costs the tip)'];
  return [Object.keys(R.ing).map(id => `${R.ing[id]} ${ING[id].name}`).concat((R.fresh || []).map(f => FRESH[f].name + ' (muddled)')).join(' · '), `${GLASSES[R.glass].name} glass · ${R.ice === 'none' ? 'no ice' : R.ice === 'crushed' ? 'crushed ice' : 'ice cubes'} · ${{ build: 'pour', layer: 'heavy syrup last: layers', stir: 'stir', muddle: 'muddle', shake: 'shake' }[R.how]} · ${GARN[R.garn].name}`]; }
function hud(G, now) { ctx.textBaseline = 'middle'; const o = G.order, D = G.drink; if (!D) return; const L = layout(G);
  if (G.lesson) lessonPanel(G);
  else { const x0 = 10, y0 = 46 * k, w = W - 20; ctx.fillStyle = 'rgba(30,16,30,.8)'; rrect(x0, y0, w, 52 * k, 12 * k); ctx.fill(); ctx.textAlign = 'left';
    if (o && o.free) { ctx.font = `400 ${Math.round(17 * k)}px ${TF}`; ctx.fillStyle = '#ff9ac0'; ctx.fillText('Free mix', x0 + 10, y0 + 16 * k); ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = '#fff'; ctx.fillText(`Make anything. SERVE saves it (${(store.get('creations', []) || []).length} saved).`, x0 + 10, y0 + 38 * k); }
    else if (o) { ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillText(`${o.who.toUpperCase()} · ORDER ${G.served + 1} OF ${G.cfg.orders} · ${'♥'.repeat(Math.max(0, G.cfg.fails - G.failed + 1))}`, x0 + 10, y0 + 11 * k);
      ctx.font = `400 ${Math.round(17 * k)}px ${TF}`; ctx.fillStyle = '#ff9ac0'; ctx.fillText(o.drink ? o.drink.name : '"Something ' + o.feel.map(k2 => WANTS[k2].say).join(', ') + '"', x0 + 10, y0 + 30 * k);
      ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillStyle = '#fff'; cardLines(G).forEach((l, i) => ctx.fillText(l, x0 + 10, y0 + 46 * k + i * 14 * k)); } }
  // ASK (a feeling) or 📖 (the recipe card, once it is no longer shown)
  if (o && o.feel && !o.asked && !G.lesson) { const b = L.ask; ctx.fillStyle = '#ff7aa8'; rrect(b.x, b.y + 24 * k, b.w, b.h, 10 * k); ctx.fill(); ctx.fillStyle = '#1a0a14'; ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillText('ASK ?', b.x + b.w / 2, b.y + 24 * k + b.h / 2); }
  if (o && o.drink && G.cfg.card !== 'full' && !o.tries) { const b = L.book; ctx.fillStyle = ui.book > 0 ? '#ffd36a' : 'rgba(255,255,255,.2)'; rrect(b.x, b.y + 24 * k, b.w, b.h, 10 * k); ctx.fill(); ctx.fillStyle = ui.book > 0 ? '#1a0a14' : '#fff'; ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillText('📖 RECIPE', b.x + b.w / 2, b.y + 24 * k + b.h / 2); }
  // the customer's speech bubble
  if (ui.bubble) { const B = ui.bubble, p = scr(0, 1.95, -2.3); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(B.txt, W * 0.62), lh = 17 * k, h = lines.length * lh + 14 * k, bw = Math.max(...lines.map(l => ctx.measureText(l).width)) + 24, bx = clamp(p.x - bw / 2, 8, W - bw - 8), by = Math.max(110 * k, p.y - h);
    ctx.fillStyle = B.like ? '#eaffef' : B.like === false ? '#ffe8ec' : '#ffffff'; rrect(bx, by, bw, h, 14 * k); ctx.fill(); ctx.fillStyle = '#2a1a24'; ctx.textAlign = 'center'; lines.forEach((l, i) => ctx.fillText(l, bx + bw / 2, by + 7 * k + lh * (i + 0.5))); }
  // the glass's marks: parts poured (in their colours) against the card's parts
  if (D.glass || D.vessel === 'shaker') { const gp = glassScr(), cap = D.vessel === 'shaker' ? 8 : GLASSES[D.glass].cap, x = W - 48 * k, h = Math.min(170 * k, H * 0.22), y1 = H * 0.56, y0 = y1 - h, into = D.vessel === 'shaker' ? D.shaker : D.parts;
    ctx.fillStyle = 'rgba(30,16,30,.7)'; rrect(x - 6 * k, y0 - 22 * k, 46 * k, h + 30 * k, 10 * k); ctx.fill(); let yy = y1; for (const p of into) { const hh = h * p.n / cap; ctx.fillStyle = colOf(p.id); ctx.fillRect(x, yy - hh, 16 * k, hh); yy -= hh; }
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1; for (let i = 0; i <= cap; i += upLv('jigger') ? 0.5 : 1) { const yy2 = y1 - h * i / cap; ctx.beginPath(); ctx.moveTo(x, yy2); ctx.lineTo(x + (i % 1 ? 6 : 16) * k, yy2); ctx.stroke(); if (!(i % 1) && i) { ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(9 * k)}px ${BC}`; ctx.textAlign = 'left'; ctx.fillText(i, x + 19 * k, yy2); } }
    ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillStyle = '#ffd36a'; ctx.fillText(D.vessel === 'shaker' ? 'SHAKER' : 'PARTS', x + 12 * k, y0 - 12 * k);
    if (D.vessel === 'shaker' && D.shaker.length) { ctx.font = `700 ${Math.round(16 * k)}px ${BC}`; ctx.fillStyle = '#fff'; ctx.fillText(D.shakes >= 6 ? 'TAP SHAKER TO POUR IT OUT' : `SWIPE UP AND DOWN TO SHAKE ${D.shakes}/6`, W / 2, H * 0.53); } }
  // the tray
  ctx.fillStyle = 'rgba(26,14,26,.92)'; ctx.fillRect(0, H * 0.6 - 6 * k, W, H);
  for (const t of L.tabs) { const on = ui.tab === t.id; ctx.fillStyle = on ? '#ff7aa8' : 'rgba(255,255,255,.1)'; rrect(t.x, t.y, t.w, t.h, 9 * k); ctx.fill(); ctx.fillStyle = on ? '#1a0a14' : '#fff'; ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillText(t.label, t.x + t.w / 2, t.y + t.h / 2); }
  const need = o && o.drink && (G.cfg.card === 'full' || ui.book > 0 || o.tries > 0) && (G.N <= 3 || G.lesson) ? new Set([...Object.keys(o.drink.ing), o.drink.glass, o.drink.garn, ...(o.drink.fresh || [])]) : null;
  for (const it of L.items) { const sel = D.sel === it.id && it.kind === 'ing' || D.glass === it.id && it.kind === 'glass' || D.garn === it.id && it.kind === 'garn' || D.fresh.includes(it.id) && it.kind === 'fresh', glow = need && need.has(it.id) && !sel;
    ctx.fillStyle = sel ? 'rgba(255,122,168,.35)' : 'rgba(255,255,255,.08)'; rrect(it.x, it.y, it.w, it.h, 10 * k); ctx.fill(); if (glow) { ctx.strokeStyle = `rgba(255,211,106,${0.5 + 0.4 * Math.sin(now * 5)})`; ctx.lineWidth = 3; rrect(it.x, it.y, it.w, it.h, 10 * k); ctx.stroke(); }
    const cx = it.x + it.w / 2, cy = it.y + it.h * 0.42; ctx.fillStyle = it.col; if (it.kind === 'ing') { rrect(cx - 8 * k, cy - 16 * k, 16 * k, 28 * k, 4 * k); ctx.fill(); ctx.fillRect(cx - 3 * k, cy - 22 * k, 6 * k, 8 * k); } else if (it.kind === 'glass') { ctx.strokeStyle = '#cfe8ff'; ctx.lineWidth = 2; const gs = GSHAPE[it.id]; ctx.strokeRect(cx - gs.r * 160 * k, cy + 12 * k - gs.h * 140 * k, gs.r * 320 * k, gs.h * 140 * k); } else { ctx.beginPath(); ctx.arc(cx, cy, 11 * k, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillText(it.name, cx, it.y + it.h - 9 * k); }
  for (const t of L.tools) { const on = (t.id === 'cubes' || t.id === 'crushed') && D.ice === t.id || t.id === 'shaker' && D.vessel === 'shaker'; ctx.fillStyle = on ? '#9ad8ff' : 'rgba(255,255,255,.12)'; rrect(t.x, t.y, t.w, t.h, 9 * k); ctx.fill(); ctx.fillStyle = on ? '#0a1a24' : '#fff'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillText(t.id === 'muddle' && D.fresh.length ? `MUDDLE ${Math.min(3, D.muddled)}/3` : t.label, t.x + t.w / 2, t.y + t.h / 2); }
  const P = L.pour, S2 = L.serve; ctx.fillStyle = D.pouring ? '#ffd36a' : D.sel ? '#ff7aa8' : 'rgba(255,255,255,.15)'; rrect(P.x, P.y, P.w, P.h, 16 * k); ctx.fill(); ctx.fillStyle = D.sel ? '#1a0a14' : 'rgba(255,255,255,.6)'; ctx.font = `400 ${Math.round(20 * k)}px ${TF}`; ctx.textAlign = 'center'; ctx.fillText(D.pouring ? 'pouring…' : D.sel ? 'Hold to pour' : 'Tap a bottle', P.x + P.w / 2, P.y + P.h / 2 - 6 * k);
  if (D.sel) { ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillText(ING[D.sel].name.toUpperCase(), P.x + P.w / 2, P.y + P.h / 2 + 16 * k); }
  ctx.fillStyle = o && o.free ? '#9be3b5' : '#9ad8ff'; rrect(S2.x, S2.y, S2.w, S2.h, 16 * k); ctx.fill(); ctx.fillStyle = '#0a1a24'; ctx.font = `400 ${Math.round(20 * k)}px ${TF}`; ctx.fillText(o && o.free ? 'Save' : 'Serve', S2.x + S2.w / 2, S2.y + S2.h / 2);
  if (ui.drag && ui.drag.garn) { ctx.fillStyle = GARN[ui.drag.garn].col; ctx.beginPath(); ctx.arc(ui.drag.x, ui.drag.y - 20 * k, 14 * k, 0, TAU); ctx.fill(); }
  if (ui.banner) { const B = ui.banner; ctx.textAlign = 'center'; ctx.font = `400 ${Math.round(28 * k)}px ${TF}`; ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(20,10,20,.75)'; ctx.strokeText(B.txt, W / 2, H * 0.24); ctx.fillStyle = B.col || '#fff'; ctx.fillText(B.txt, W / 2, H * 0.24); } }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of String(t).split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { const D = G.lesson, st = D.steps[D.i], x = 10, w = W - 20, y = 44 * k, o = G.order; ctx.save(); ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; const lines = wrapText(st.how, w - 24).concat(cardLines(G).map(l => '→ ' + l)), h = 44 * k + lines.length * 15 * k;
  ctx.fillStyle = 'rgba(30,16,30,.94)'; rrect(x, y, w, h, 12); ctx.fill(); ctx.strokeStyle = 'rgba(255,122,168,.7)'; ctx.lineWidth = 2; rrect(x, y, w, h, 12); ctx.stroke();
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#ff7aa8'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillText(`LESSON ${G.N} OF 3 · ${o && o.drink ? o.drink.name.toUpperCase() : ''}`, x + 12, y + 8 * k);
  ctx.fillStyle = '#fff'; ctx.font = `400 ${Math.round(16 * k)}px ${TF}`; ctx.fillText(st.title, x + 12, y + 20 * k); ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.92)'; lines.forEach((l, i) => ctx.fillText(l, x + 12, y + 42 * k + i * 15 * k)); ctx.restore(); ctx.textBaseline = 'middle'; }
