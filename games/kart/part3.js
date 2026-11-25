// ===================== THE VIEW: Drift Kings in 3D (three.js through tools/world3d.js) =====================
// A chase camera just behind and above your kart. The track is a ribbon of asphalt with red and white kerbs and a low
// striped barrier, through each track's own world: green hills and pines (Sunny Loop), red rock under a low gold sun
// (Canyon Run), a night city of lit towers (Neon City), snowy pines under cloud (Snow Peak). Chunky little karts with
// drivers in helmets; sparks under the wheels in a drift (blue, orange, purple), a flame on a boost, a bubble round a
// shielded kart. ? boxes spin; oil slicks and zap orbs. The 2D layer draws your place, the lap, the map, the item, the
// lights at the start, the steering under your thumb, and the calls.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { snap: true, stick: null, cam: null, lapT: 0 };
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS || !(G && G.lesson)) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 140) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: 0.4 + Math.random() * 0.4, col, r: (1.5 + Math.random() * 2.5) * k }); } if (PARTS.length > 240) PARTS.splice(0, PARTS.length - 240); }
function fxStep(dt) {
  FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2.5); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.5) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 1 - dt * 2; p.vy *= 1 - dt * 2; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; }
}
const hex = n => '#' + n.toString(16).padStart(6, '0'), TIERC = [0xffffff, 0x4ac0ff, 0xff9a20, 0xc050ff];
// ---------- textures and models ----------
function canvasTex(w, h, f, rep) { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
const roadTex = () => canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#4a4a50'; g.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { const v = 60 + Math.random() * 40; g.fillStyle = `rgb(${v},${v},${v + 4})`; g.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5); } g.fillStyle = 'rgba(255,255,255,.75)'; g.fillRect(w / 2 - 2, 0, 4, h / 2); });
const kerbTex = () => canvasTex(16, 64, (g, w, h) => { for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? '#ffffff' : '#e02030'; g.fillRect(0, i * 16, w, 16); } });
const fenceTex = () => canvasTex(16, 64, (g, w, h) => { for (let i = 0; i < 2; i++) { g.fillStyle = i % 2 ? '#2a5aff' : '#f2f2f2'; g.fillRect(0, i * 32, w, 32); } });
const boxTex = () => canvasTex(64, 64, (g, w, h) => { g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(0, 0, w, h); g.strokeStyle = '#fff'; g.lineWidth = 4; g.strokeRect(3, 3, w - 6, h - 6); g.fillStyle = '#fff'; g.font = 'bold 44px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', w / 2, h / 2 + 2); });
function kartModel(col, col2) { const T = THREE, g = new T.Group(), body = new T.Group(); g.add(body); const M = (c, r = 0.4, m = 0.2) => new T.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
  const base = new T.Mesh(new T.BoxGeometry(1.9, 0.32, 1.25), M(col, 0.35, 0.3)); base.position.y = 0.38; body.add(base);
  const nose = new T.Mesh(new T.BoxGeometry(0.7, 0.24, 1.0), M(col, 0.35, 0.3)); nose.position.set(1.1, 0.36, 0); body.add(nose);
  const stripe = new T.Mesh(new T.BoxGeometry(1.4, 0.04, 0.3), M(col2)); stripe.position.set(0.3, 0.56, 0); body.add(stripe);
  const wing = new T.Mesh(new T.BoxGeometry(0.25, 0.08, 1.4), M(col2)); wing.position.set(-0.95, 0.85, 0); body.add(wing); for (const s of [-0.5, 0.5]) { const p = new T.Mesh(new T.BoxGeometry(0.08, 0.35, 0.08), M(0x222222)); p.position.set(-0.9, 0.65, s); body.add(p); }
  const seat = new T.Mesh(new T.BoxGeometry(0.5, 0.4, 0.6), M(0x1a1a1a, 0.8)); seat.position.set(-0.35, 0.68, 0); body.add(seat);
  const torso = new T.Mesh(new T.CapsuleGeometry(0.22, 0.25, 4, 8), M(col2, 0.6)); torso.position.set(-0.2, 0.92, 0); body.add(torso);
  const helm = new T.Mesh(new T.SphereGeometry(0.26, 16, 12), M(col, 0.25, 0.4)); helm.position.set(-0.15, 1.33, 0); body.add(helm); const vis = new T.Mesh(new T.SphereGeometry(0.2, 12, 8, -0.9, 1.8, 1.0, 0.9), new T.MeshStandardMaterial({ color: 0x9ad8ff, roughness: 0.05, metalness: 0.5 })); vis.position.copy(helm.position); vis.rotation.y = 0; body.add(vis);
  const wheels = []; for (const [x, z, r] of [[0.75, 0.72, 0.3], [0.75, -0.72, 0.3], [-0.72, 0.75, 0.36], [-0.72, -0.75, 0.36]]) { const w = new T.Mesh(new T.CylinderGeometry(r, r, 0.32, 14), M(0x161616, 0.9)); w.rotation.x = Math.PI / 2; w.position.set(x, r, z); g.add(w); wheels.push(w); }
  const flame = new T.Mesh(new T.ConeGeometry(0.18, 0.9, 10), new T.MeshBasicMaterial({ color: 0x60c0ff, transparent: true, opacity: 0.9, blending: T.AdditiveBlending, depthWrite: false })); flame.rotation.z = Math.PI / 2; flame.position.set(-1.35, 0.45, 0); g.add(flame);
  const bub = new T.Mesh(new T.SphereGeometry(1.5, 20, 14), new T.MeshStandardMaterial({ color: 0x9adfff, transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.3, depthWrite: false })); bub.position.y = 0.8; g.add(bub);
  g.userData = { body, wheels, flame, bub }; g.traverse(o => { if (o.isMesh && o !== bub && o !== flame) o.castShadow = true; }); return g; }
// ---------- the world ----------
function buildWorld() {
  if (V3) return V3; const T = THREE; if (!W3 || !W3.init({ canvas: $('gl'), fov: 62, far: 2500, near: 0.1 })) { V3 = { none: true }; return V3; }
  V3 = { T, S: W3.scene, trackN: -1, karts: new Map(), boxes: [], slicks: [], orbs: [], sparks: null }; const V = V3;
  const N = 220, sp = new Float32Array(N * 3), sc = new Float32Array(N * 3); const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(sp, 3)); g.setAttribute('color', new T.BufferAttribute(sc, 3));
  V.sparks = new T.Points(g, new T.PointsMaterial({ size: 0.13, map: canvasTex(32, 32, (q) => { const gr = q.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); q.fillStyle = gr; q.fillRect(0, 0, 32, 32); }), vertexColors: true, transparent: true, opacity: 0.95, blending: T.AdditiveBlending, depthWrite: false })); V.sparks.frustumCulled = false; V.S.add(V.sparks); V.sparkP = [];
  W3.setQuality(stepN); return V;
}
// one track's world: built when the track changes
function buildTrack(V, g) { const T = THREE, TR = g.T, S = TR.S, n = S.length; if (V.track) { V.S.remove(V.track); V.track.traverse(o => { if (o.geometry) o.geometry.dispose(); }); } const H = new T.Group(); V.track = H; V.S.add(H);
  const info = TRACKS[g.cfg.track], R0 = W3.rng(g.cfg.track + 3);
  // ground
  const gr = new T.Mesh(new T.PlaneGeometry(1400, 1400), new T.MeshStandardMaterial({ color: info.grass, roughness: 0.95, map: W3.grainTex(256, 11, 200, 40, 6) })); gr.material.map.repeat.set(120, 120); gr.rotation.x = -Math.PI / 2; gr.position.y = -0.02; gr.receiveShadow = true; H.add(gr);
  // a ribbon along the track at a lateral band [a, b], at height y
  const ribbon = (a, b, y, mat, vRep, wall) => { const pos = [], uv = [], idx = []; let s = 0; for (let q = 0; q <= n; q++) { const p = S[q % n], nx = -Math.sin(p.h), nz = Math.cos(p.h); if (q) s += TR.ds;
      if (wall) { pos.push(p.x + nx * a, y, p.z + nz * a, p.x + nx * a, y + wall, p.z + nz * a); } else pos.push(p.x + nx * a, y, p.z + nz * a, p.x + nx * b, y, p.z + nz * b); uv.push(0, s / vRep, 1, s / vRep); if (q) { const i = q * 2; idx.push(i - 2, i - 1, i, i - 1, i + 1, i); } }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals(); const m = new T.Mesh(geo, mat); m.receiveShadow = true; H.add(m); return m; };
  ribbon(-TW / 2, TW / 2, 0.02, new T.MeshStandardMaterial({ map: roadTex(), roughness: 0.85 }), 12);
  for (const s of [-1, 1]) { ribbon(s * TW / 2, s * (TW / 2 + 0.9), 0.03, new T.MeshStandardMaterial({ map: kerbTex(), roughness: 0.7 }), 6); const wl = ribbon(s * (TW / 2 + 3.4), 0, 0, new T.MeshStandardMaterial({ map: fenceTex(), roughness: 0.6, side: T.DoubleSide }), 4, 0.8); }
  // the start line
  const st = new T.Mesh(new T.PlaneGeometry(2, TW), new T.MeshStandardMaterial({ map: canvasTex(16, 64, (q, w, h) => { for (let i = 0; i < 2; i++) for (let j = 0; j < 8; j++) { q.fillStyle = (i + j) % 2 ? '#111' : '#fff'; q.fillRect(i * 8, j * 8, 8, 8); } }), roughness: 0.7 })); st.rotation.set(-Math.PI / 2, 0, -S[0].h); st.position.set(S[0].x, 0.04, S[0].z); H.add(st);
  const arch = new T.Group(); for (const s of [-1, 1]) { const p = new T.Mesh(new T.BoxGeometry(0.4, 5, 0.4), new T.MeshStandardMaterial({ color: 0x2a2a34 })); p.position.set(0, 2.5, s * (TW / 2 + 1.2)); arch.add(p); } const bar = new T.Mesh(new T.BoxGeometry(0.6, 1, TW + 3), new T.MeshStandardMaterial({ color: 0xff3a4a, emissive: 0x401010 })); bar.position.y = 5; arch.add(bar); arch.position.set(S[0].x, 0, S[0].z); arch.rotation.y = -S[0].h; H.add(arch);
  // scenery away from the track
  const far = (x, z) => { let d = 1e9; for (let q = 0; q < n; q += 4) d = Math.min(d, Math.hypot(S[q].x - x, S[q].z - z)); return d; };
  if (g.cfg.track === 2) { const bm = []; for (let i = 0; i < 90; i++) { const x = -160 + R0() * 380, z = -120 + R0() * 380; if (far(x, z) < 24) continue; const h = 10 + R0() * 40, w = 6 + R0() * 10, b = new T.Mesh(new T.BoxGeometry(w, h, w), new T.MeshStandardMaterial({ color: 0x1a1a2a, emissive: [0xff3ab0, 0x3ae0ff, 0xffd040, 0x8a5aff][i % 4], emissiveIntensity: 0.12, roughness: 0.6, map: canvasTex(32, 64, (q, W2, H2) => { q.fillStyle = '#222'; q.fillRect(0, 0, W2, H2); for (let a = 0; a < 6; a++) for (let c = 0; c < 14; c++) if (Math.random() < 0.55) { q.fillStyle = '#ffe9a0'; q.fillRect(2 + a * 5, 2 + c * 4.4, 3, 2.4); } }) })); b.position.set(x, h / 2, z); H.add(b); } }
  else { const trees = []; for (let i = 0; i < 520; i++) { const x = -200 + R0() * 440, z = -160 + R0() * 440; if (far(x, z) < 12) continue; trees.push({ x, z, y: 0, s: 1 + R0() * 1.4, hue: R0(), shade: R0() * 0.5 }); } W3.pines(trees, { layers: 4 });
    if (g.cfg.track === 1) for (let i = 0; i < 40; i++) { const x = -160 + R0() * 360, z = -120 + R0() * 360; if (far(x, z) < 16) continue; const r = new T.Mesh(new T.DodecahedronGeometry(3 + R0() * 6, 0), new T.MeshStandardMaterial({ color: 0xb0603a, roughness: 0.95, flatShading: true })); r.position.set(x, 1, z); r.scale.y = 0.6 + R0(); H.add(r); } }
  // item boxes
  V.boxes.forEach(b => V.S.remove(b)); const bt = boxTex(); V.boxes = g.boxes.map(b => { const m = new T.Mesh(new T.BoxGeometry(1.1, 1.1, 1.1), new T.MeshStandardMaterial({ map: bt, transparent: true, opacity: 0.85, emissive: 0x4060ff, emissiveIntensity: 0.4, roughness: 0.2 })); m.position.set(b.x, 1, b.z); V.S.add(m); m.userData.b = b; return m; });
  for (const [, m] of V.karts) V.S.remove(m); V.karts.clear(); }
function sync(V, g, t, dt) {
  for (const k of g.karts) { let m = V.karts.get(k); if (!m) { m = kartModel(k.me ? g.kart.col : k.who.col, k.me ? g.kart.col2 : 0xffffff); V.S.add(m); V.karts.set(k, m); }
    m.position.set(k.x, 0, k.z); m.rotation.y = -(k.h); const u = m.userData; u.body.rotation.x = (k.slip || 0) * 0.4 + (k.wob || 0) * Math.sin(t * 26) * 0.28; u.body.rotation.z = Math.sin(t * 30) * 0.004 * k.v + (k.wob || 0) * Math.sin(t * 23) * 0.1; u.body.position.y = k.spin ? Math.abs(Math.sin(t * 12)) * 0.3 : 0;
    for (const w of u.wheels) w.rotation.y = 0; u.wheels[0].rotation.z = u.wheels[1].rotation.z = 0; u.wheels.forEach(w => { w.rotation.x = Math.PI / 2; });
    u.flame.visible = k.boost > 0; u.flame.scale.set(1, 0.8 + Math.random() * 0.6 + k.boost * 0.4, 1); u.flame.material.color.setHex(k.tierBoost === 3 ? 0xd060ff : k.boost > 1 ? 0xff9a20 : 0x60c0ff); u.bub.visible = k.shield > 0;
    // drift sparks from the back wheels
    if (k.drift && k.tier && Math.random() < 0.9) for (const s of [-1, 1]) V.sparkP.push({ x: k.x - Math.cos(k.h) * 0.8 + Math.sin(k.h) * 0.75 * s, y: 0.15, z: k.z - Math.sin(k.h) * 0.8 - Math.cos(k.h) * 0.75 * s, vx: (Math.random() - 0.5) * 3 - Math.cos(k.h) * 3, vy: 1 + Math.random() * 2.5, vz: (Math.random() - 0.5) * 3 - Math.sin(k.h) * 3, t: 0, c: TIERC[k.tier] }); }
  if (V.impacts) for (let i = V.impacts.length - 1; i >= 0; i--) { const q = V.impacts[i]; q.t += dt; const u = q.t / (q.big ? 0.7 : 0.5); if (u >= 1) { q.m.visible = false; V.impacts.splice(i, 1); continue; } q.m.visible = true; q.m.scale.setScalar((q.big ? 1.0 : 0.7) + u * (q.big ? 3.2 : 2.2)); q.m.material.opacity = 0.75 * (1 - u) * (1 - u); }
  const P = V.sparkP; while (P.length > 220) P.shift(); const pa = V.sparks.geometry.attributes.position, ca = V.sparks.geometry.attributes.color, col = new THREE.Color();
  for (let i = 0; i < 220; i++) { const q = P[i]; if (q) { q.t += dt; q.vy -= 9 * dt; q.x += q.vx * dt; q.y = Math.max(0.02, q.y + q.vy * dt); q.z += q.vz * dt; pa.setXYZ(i, q.x, q.y, q.z); col.setHex(q.c); ca.setXYZ(i, col.r, col.g, col.b); } else pa.setXYZ(i, 0, -1e4, 0); } for (let i = P.length - 1; i >= 0; i--) if (P[i].t > 0.35) P.splice(i, 1); pa.needsUpdate = ca.needsUpdate = true;
  V.boxes.forEach(m => { const b = m.userData.b; m.visible = b.t <= 0; m.rotation.set(t * 0.8, t * 1.2, 0); m.position.y = 1 + Math.sin(t * 2 + m.position.x) * 0.15; m.material.emissive.setHSL((t * 0.2 + m.position.x * 0.01) % 1, 0.8, 0.35); });
  while (V.slicks.length < g.slicks.length) { const m = new THREE.Mesh(new THREE.CircleGeometry(1.3, 20), new THREE.MeshStandardMaterial({ color: 0x101018, roughness: 0.05, metalness: 0.8 })); m.rotation.x = -Math.PI / 2; V.S.add(m); V.slicks.push(m); }
  V.slicks.forEach((m, i) => { const s = g.slicks[i]; m.visible = !!s; if (s) m.position.set(s.x, 0.05, s.z); });
  while (V.orbs.length < g.orbs.length) { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(64, 64, (q) => { const gr = q.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(120,200,255,.9)'); gr.addColorStop(1, 'rgba(60,120,255,0)'); q.fillStyle = gr; q.fillRect(0, 0, 64, 64); }), blending: THREE.AdditiveBlending, depthWrite: false })); m.scale.setScalar(1.8); V.S.add(m); V.orbs.push(m); }
  V.orbs.forEach((m, i) => { const o = g.orbs[i]; m.visible = !!o; if (o) m.position.set(o.x, 1 + Math.sin(t * 20) * 0.1, o.z); });
}
const SV = new (window.THREE ? THREE.Vector3 : Object)();
function scr(x, y, z) { if (!V3 || V3.none) return { x: W / 2, y: H / 2, front: true }; SV.set(x, y, z); return W3.screen(SV); }
// ---------- events ----------
function impact(x, y, z, h, big) { const V = V3, T = THREE; V.impacts = V.impacts || []; V.ringPool = V.ringPool || [];
  let m = V.ringPool.find(r => !r.visible); if (!m) { m = new T.Mesh(new T.RingGeometry(0.55, 0.75, 32), new T.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide })); V.S.add(m); V.ringPool.push(m); }
  m.position.set(x, y, z); m.rotation.set(0, -h, 0); m.material.color.setHex(big ? 0xffe08a : 0xffffff); V.impacts.push({ m, t: 0, big }); }
// the camera stays on the road's side of the fence, so a kart along the rail is never seen through the net
function camIn(g, k2) { const cam = W3.cam, l = locate(g.T, cam.position.x, cam.position.z, k2.i), lim = TW / 2 + 3.0; if (Math.abs(l.lat) > lim) { const p = g.T.S[l.i], s = Math.sign(l.lat), b = Math.abs(l.lat) - lim; cam.position.x += Math.sin(p.h) * s * b; cam.position.z -= Math.cos(p.h) * s * b; } }
function onEvent(G, e) {
  const cx = W / 2;
  switch (e.k) {
    case 'start': say(TRACKS[G.cfg.track].name.toUpperCase(), cx, H * 0.26, '#ffffff', 22); say(G.cfg.place === 1 ? 'WIN THE RACE' : `FINISH TOP ${G.cfg.place}`, cx, H * 0.32, '#ffd080', 18); if (G.N <= 2) tip('steer', 'Left thumb: slide to steer. Hold a hard turn in a bend to drift, then straighten up to boost.', 3.6); break;
    case 'light': sfx.light(e.n); break;
    case 'go': sfx.light(0); say('GO!', cx, H * 0.36, '#7af0a0', 46); FX.flash = 0.2; break;
    case 'drift': break;
    case 'spark': sfx.spark(e.tier); break;
    case 'boost': sfx.boost(e.tier); if (G.me) G.me.tierBoost = e.tier; FX.shake = 2 + e.tier; say(['', 'BOOST', 'BIG BOOST!', 'ULTRA BOOST!'][e.tier], cx, H * 0.62, hex(TIERC[e.tier]), 16 + e.tier * 4); vibe(e.tier >= 2 ? HAP.sharp : HAP.light); break;
    case 'item': sfx.item(); say(ITEMS[e.it].icon + ' ' + ITEMS[e.it].name.toUpperCase(), cx, H * 0.4, '#ffffff', 18); if (G.N <= 4) tip('item', 'Tap the right side of the screen to use your item.', 2.6); break;
    case 'use': if (e.me) sfx.use(e.it); break;
    case 'spin': if (e.me) { sfx.spin(); FX.shake = 10; FX.red = 0.5; vibe(HAP.fail || HAP.best); say(e.why === 'zap' ? 'ZAPPED!' : 'SPUN OUT!', cx, H * 0.4, '#ffb4a8', 24); } break;
    case 'pop': if (e.me) { sfx.pop(); say('BUBBLE SAVED YOU', cx, H * 0.42, '#9adfff', 16); } break;
    case 'gotem': sfx.gotem(); { const p = scr(e.x, 1.5, e.z); say(e.why === 'zap' ? 'ZAP! +1 🪙' : 'SLICKED! +1 🪙', p.x, p.y - 20 * k, '#ffd040', 16); } break;
    case 'bump': sfx.bump(); break;
    case 'wall': { sfx.wall(); if (sfx.clang) sfx.clang(e.fly); FX.shake = e.fly ? 12 : 7; vibe(HAP.thud);
      /* the hit you see: a burst of sparks off the rail, a ring flashing where you struck, the kart rocking */
      const V = V3; if (V && !V.none && V.sparkP) { const nx = -Math.sin(e.h) * e.s, nz = Math.cos(e.h) * e.s;
        for (let i = 0; i < (e.fly ? 40 : 26); i++) { const sp = 3 + Math.random() * 6; V.sparkP.push({ x: e.x, y: e.y + 0.4 + Math.random() * 0.5, z: e.z, vx: -nx * sp + (Math.random() - 0.5) * 5, vy: 1.5 + Math.random() * 4, vz: -nz * sp + (Math.random() - 0.5) * 5, t: Math.random() * 0.08, c: Math.random() < 0.6 ? 0xffd27a : 0xffffff }); }
        impact(e.x + nx * 0.15, e.y + (e.fly ? 1.4 : 0.6), e.z + nz * 0.15, e.h, e.fly); }
      say(e.fly ? 'CRASH!' : 'BANG!', W / 2, H * 0.42, '#ffd0a0', e.fly ? 26 : 20); break; }
    case 'scrape': { const V = V3; if (V && !V.none && V.sparkP) { const nx = -Math.sin(e.h) * e.s, nz = Math.cos(e.h) * e.s; for (let i = 0; i < 5; i++) V.sparkP.push({ x: e.x, y: e.y + 0.3, z: e.z, vx: -nx * 2 + (Math.random() - 0.5) * 3 - Math.cos(e.h) * 4, vy: 1 + Math.random() * 2, vz: -nz * 2 + (Math.random() - 0.5) * 3 - Math.sin(e.h) * 4, t: 0, c: 0xffc860 }); } if (sfx.scrape) sfx.scrape(); break; }
    case 'lap': ui.lapT = 2; if (e.lap < G.cfg.laps) { sfx.lap(e.lap); say(e.lap === G.cfg.laps - 1 ? 'FINAL LAP!' : `LAP ${e.lap + 1}`, cx, H * 0.3, '#ffd080', 30); } break;
    case 'finish': break;
    case 'lessonnext': if (e.first) hint = null; say('FIRST, A LESSON', cx, H * 0.3, '#ffe08a', 20); sfx.go(); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, cx, H * 0.36, '#9be3b5', 20); break;
    case 'lessonmiss': coachMiss(); break;
    case 'lessondone': say('NOW RACE!', cx, H * 0.3, '#ffe08a', 26); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); vibe(HAP.best); FX.flash = 0.4; say(e.place === 1 ? 'YOU WIN!' : `${e.place}${['', 'ST', 'ND', 'RD'][e.place] || 'TH'} PLACE!`, cx, H * 0.3, '#ffd040', 34); break;
    case 'lost': sfx.lose(); say(`${e.place}TH PLACE`, cx, H * 0.3, '#ffb4a8', 28); break;
  }
}
// ---------- every frame ----------
function placeCam(g, dt) { const cam = W3.cam, asp = innerWidth / innerHeight, k2 = g.me; cam.fov = asp < 0.8 ? 66 + Math.min(8, k2.v * 0.2) : 52; cam.aspect = asp; cam.updateProjectionMatrix();
  if (!ui.cam || ui.snap) { ui.cam = { h: k2.h }; ui.snap = false; } let dh = k2.h + (k2.slip || 0) * 0.5 - ui.cam.h; dh = Math.atan2(Math.sin(dh), Math.cos(dh)); ui.cam.h += dh * Math.min(1, dt * 5);
  const h = ui.cam.h, back = 6.4, up = 3.1, sh = FX.shake ? (Math.random() - 0.5) * FX.shake * 0.02 : 0;
  cam.position.set(k2.x - Math.cos(h) * back + sh, up, k2.z - Math.sin(h) * back + sh); camIn(g, k2); cam.lookAt(k2.x + Math.cos(h) * 6, 0.6, k2.z + Math.sin(h) * 6); cam.updateMatrixWorld(); }
let IG = null; function idleG() { if (!IG || IG.over) { IG = newGame(Math.max(2, store.get('level', 1) | 0), { seed: (Math.random() * 1e6) | 0 }); IG.mem = {}; ui.snap = true; } honest(IG, { react: 0.2, acc: 0.95 }, IG.mem); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#101828'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D track.', W / 2, H / 2); return; }
  const g = G || idleG(), t = now;
  if (V.trackN !== g.cfg.track || V.forG !== g) { if (V.trackN !== g.cfg.track) { V.trackN = g.cfg.track; buildTrack(V, g); W3.setSky(TRACKS[g.cfg.track].sky, { azim: 140 }); if (g.cfg.track === 2) { W3.S.exposure = 0.9; W3.S.hemiI = 0.7; } } else { for (const [, m] of V.karts) V.S.remove(m); V.karts.clear(); V.boxes.forEach((m, i) => m.userData.b = g.boxes[i]); } V.forG = g; ui.snap = true; }
  placeCam(g, dt); sync(V, g, t, dt); W3.setFocus(g.me.x, 0, g.me.z, 30); W3.render(dt);
  if (G) hud(G, t);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 1.0 ? 1 : 1 - (t2.t - 1.0) / 0.5; ctx.globalAlpha = Math.max(0, al); const sc = t2.t < 0.12 ? 1.3 - t2.t / 0.12 * 0.3 : 1; ctx.font = `400 ${Math.round(t2.size * k * sc)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(10,14,30,.7)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 20); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 20); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30;
    ctx.fillStyle = 'rgba(16,24,40,.88)'; rrect(W / 2 - w / 2, H * 0.48 - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.48 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,40,60,${FX.red * 0.18})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,250,235,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); }
}
// ---------- the 2D layer ----------
function panel(x, y, w, h) { ctx.fillStyle = 'rgba(16,24,40,.72)'; rrect(x, y, w, h, 14); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 1.5; rrect(x, y, w, h, 14); ctx.stroke(); }
function hud(G, t) {
  const c = G.cfg, me = G.me; ctx.textBaseline = 'middle';
  if (!G.lesson) {
    // place and lap
    const x = 12, y = 48 * k; panel(x, y, 118 * k, 62 * k); ctx.textAlign = 'left'; const pl = me.place || G.karts.length, ok = pl <= c.place; ctx.font = `400 ${Math.round(34 * k)}px ${TF}`; ctx.fillStyle = ok ? '#7af0a0' : '#fff'; ctx.fillText(String(pl), x + 12, y + 30 * k); const pw = ctx.measureText(String(pl)).width;
    ctx.font = `400 ${Math.round(13 * k)}px ${TF}`; ctx.fillText(['', 'ST', 'ND', 'RD'][pl] || 'TH', x + 14 + pw, y + 20 * k); ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillText(`of ${G.karts.length} · need ${c.place === 1 ? '1st' : 'top ' + c.place}`, x + 12, y + 52 * k);
    ctx.textAlign = 'right'; ctx.font = `400 ${Math.round(14 * k)}px ${TF}`; ctx.fillStyle = '#fff'; ctx.fillText(`LAP ${Math.min(c.laps, me.lap + 1)}/${c.laps}`, x + 118 * k - 10, y + 20 * k);
    // the map
    map(G, W - 12 - 86 * k, 48 * k, 86 * k);
  } else lessonPanel(G);
  // the item, bottom right (tap the right side)
  const r = 34 * k, bx = W - r - 18, by = H - r - 30 * k; ctx.fillStyle = 'rgba(16,24,40,.7)'; ctx.beginPath(); ctx.arc(bx, by, r, 0, TAU); ctx.fill(); ctx.strokeStyle = me.item ? '#ffd040' : 'rgba(255,255,255,.25)'; ctx.lineWidth = 3 * k; ctx.stroke();
  ctx.textAlign = 'center'; if (me.item) { ctx.font = `${Math.round(28 * k)}px sans-serif`; ctx.fillText(ITEMS[me.item].icon, bx, by + 2); ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.fillStyle = '#ffd040'; ctx.fillText('TAP', bx, by - r - 9 * k); } else { ctx.font = `700 ${Math.round(18 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillText('?', bx, by); }
  // drift charge
  if (me.drift) { const w = 120 * k, x0 = W / 2 - w / 2, y0 = H - 120 * k, u = Math.min(1, me.charge / 2.1); ctx.fillStyle = 'rgba(16,24,40,.6)'; rrect(x0, y0, w, 9 * k, 5); ctx.fill(); ctx.fillStyle = hex(TIERC[me.tier || 0]); rrect(x0, y0, w * u, 9 * k, 5); ctx.fill(); for (const m2 of [0.55, 1.25]) { ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(x0 + w * m2 / 2.1, y0 - 2, 2, 13 * k); } }
  // the start lights
  if (G.count > 0) { const n = Math.ceil(G.count), cx = W / 2, cy = H * 0.24; ctx.fillStyle = 'rgba(16,16,24,.85)'; rrect(cx - 70 * k, cy - 22 * k, 140 * k, 44 * k, 12); ctx.fill(); for (let i = 0; i < 3; i++) { ctx.fillStyle = i < 3 - n + 1 ? '#ff3a3a' : 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.arc(cx - 40 * k + i * 40 * k, cy, 14 * k, 0, TAU); ctx.fill(); } }
  // the steering thumb
  const st = ui.stick; if (st) { const R2 = 60 * k; ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 4 * k; ctx.beginPath(); ctx.moveTo(st.x0 - R2, st.y0); ctx.lineTo(st.x0 + R2, st.y0); ctx.stroke(); for (const s of [-1, 1]) { ctx.fillStyle = 'rgba(255,154,32,.35)'; ctx.fillRect(st.x0 + s * R2 * 0.72 - (s < 0 ? 0 : 0), st.y0 - 6 * k, s * R2 * 0.28, 12 * k); }
    ctx.fillStyle = me.drift ? hex(TIERC[me.tier || 0]) : 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.arc(st.x0 + G.steer * R2, st.y0, 18 * k, 0, TAU); ctx.fill(); }
  else if ((G && G.lesson) && G.N <= 2 && !G.over && G.t < 8) { ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 4); ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText('left thumb: slide to steer · right: tap for item', W / 2, H - 140 * k); ctx.globalAlpha = 1; }
}
function map(G, x, y, s) { const S = G.T.S; let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of S) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); } const sc = s / Math.max(x1 - x0, z1 - z0), ox = x + (s - (x1 - x0) * sc) / 2, oy = y + (s - (z1 - z0) * sc) / 2;
  ctx.fillStyle = 'rgba(16,24,40,.6)'; rrect(x - 6, y - 6, s + 12, s + 12, 10); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 3 * k; ctx.beginPath(); S.forEach((p, i) => { const px = ox + (p.x - x0) * sc, py = oy + (p.z - z0) * sc; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }); ctx.closePath(); ctx.stroke();
  for (const q of G.karts) { ctx.fillStyle = q.me ? '#ffffff' : hex(q.who.col); ctx.beginPath(); ctx.arc(ox + (q.x - x0) * sc, oy + (q.z - z0) * sc, (q.me ? 4.5 : 3) * k, 0, TAU); ctx.fill(); } }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { coachPanel(G); }
