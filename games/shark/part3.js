// ===================== THE VIEW: Deep Bite in 3D (three.js through tools/world3d.js) =====================
// Looking down through clear water at a young shark: sand far below with light rippling over it, coral and rocks, kelp that
// sways, shafts of sunlight and drifting specks, reef walls round the bay. The camera lifts as the shark grows, so the sea
// gets wider around you (the growth you can see). Fish of each kind are drawn all at once (one drawing per kind). The 2D layer
// draws the green and red rings (eat / run), the red marks at the edge for hunters you cannot see, your bars, and your thumb.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { snap: true, stick: null, cam: { x: 0, z: 0, span: 12 }, combo: 0, comboT: 0, dashWas: false, fillShow: 0, hungerShow: 1, toast: null };
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 9) TXT.shift(); }
function tip(key, txt, secs = 2.8) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 120, up = 0) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: 0.45 + Math.random() * 0.4, col, r: (1.5 + Math.random() * 3) * k, up }); } if (PARTS.length > 260) PARTS.splice(0, PARTS.length - 260); }
function bubbles(x, y, n = 6) { if (HEADLESS) return; for (let i = 0; i < n; i++) PARTS.push({ x: x + (Math.random() - 0.5) * 16 * k, y: y + (Math.random() - 0.5) * 10 * k, vx: (Math.random() - 0.5) * 20 * k, vy: -(30 + Math.random() * 50) * k, t: 0, life: 0.7 + Math.random() * 0.6, col: 'bub', r: (2 + Math.random() * 3) * k, up: 1 }); }
function fxStep(dt) {
  FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2.5); FX.red = Math.max(0, FX.red - dt * 1.6);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.5) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; const dr = Math.exp(-3 * dt); p.vx *= dr; if (!p.up) p.vy *= dr; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; }
  if (ui.comboT > 0) { ui.comboT -= dt; if (ui.comboT <= 0) ui.combo = 0; }
  if (ui.toast) { ui.toast.t += dt; if (ui.toast.t > 2.6) ui.toast = null; }
}
const hex = c => '#' + c.toString(16).padStart(6, '0');
// ---------- the drawings ----------
// one fish drawing: a body pointing along +x, one unit long, two-toned (darker back, paler belly), a tail, fins and eyes
function fishGeo(sp, o = {}) {
  const T = THREE, parts = [], len = o.len || 1, ht = o.h || 0.32, wd = o.w || 0.2, c1 = new T.Color(sp.col), c2 = new T.Color(sp.col2);
  const paint = (g, fn) => { g = g.toNonIndexed(); const p = g.attributes.position, a = new Float32Array(p.count * 3), c = new T.Color(); for (let i = 0; i < p.count; i++) { fn(c, p.getX(i), p.getY(i), p.getZ(i)); a.set([c.r, c.g, c.b], i * 3); } g.setAttribute('color', new T.BufferAttribute(a, 3)); parts.push(g); };
  const body = new T.SphereGeometry(0.5, 16, 10); body.scale(len, ht / 0.5 * 0.5, wd / 0.5 * 0.5);
  paint(body, (c, x, y) => { const back = y > 0.02 ? 1 : 0; c.copy(c1); if (o.belly) c.lerp(c2, y < 0 ? 0.8 : 0); else if (back) c.lerp(c2, o.backMix != null ? o.backMix : 0.45); if (o.stripes) { const s = Math.abs(Math.sin((x + 0.5) * Math.PI * o.stripes)); if (s > 0.9) c.copy(c2); } });
  const tail = new T.ConeGeometry(ht * 0.6, len * 0.32, 4); tail.rotateZ(Math.PI / 2); tail.scale(1, 1, 0.18); tail.translate(-len * 0.58, 0, 0); paint(tail, c => c.copy(o.tailCol != null ? new T.Color(o.tailCol) : c1).lerp(c2, 0.3));
  if (o.dorsal) { const d = new T.ConeGeometry(ht * 0.35, ht * o.dorsal, 3); d.scale(1.6, 1, 0.2); d.translate(-len * 0.02, ht * 0.5 + ht * o.dorsal * 0.4, 0); paint(d, c => c.copy(c1).lerp(c2, o.belly ? 0 : 0.5)); }
  if (o.sword) { const s = new T.ConeGeometry(0.02, len * 0.45, 5); s.rotateZ(-Math.PI / 2); s.translate(len * 0.7, 0, 0); paint(s, c => c.copy(c1)); }
  for (const sz of [-1, 1]) { const e = new T.SphereGeometry(ht * 0.09, 6, 5); e.translate(len * 0.33, ht * 0.08, sz * wd * 0.42); paint(e, c => c.setHex(0x0a0a10)); }
  const g = T.mergeGeometries(parts); g.computeVertexNormals(); return g;
}
function specialGeo(kind) {
  const T = THREE, sp = SPECIES[kind], parts = [], c1 = new T.Color(sp.col), c2 = new T.Color(sp.col2);
  const add = (g, col) => { g = g.toNonIndexed(); const n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set([col.r, col.g, col.b], i * 3); g.setAttribute('color', new T.BufferAttribute(a, 3)); parts.push(g); };
  if (kind === 'jelly') { const d = new T.SphereGeometry(0.5, 14, 8, 0, TAU, 0, Math.PI / 2); add(d, c1); for (let i = 0; i < 7; i++) { const a = i / 7 * TAU, t = new T.CylinderGeometry(0.02, 0.01, 0.9, 4); t.translate(Math.cos(a) * 0.3, -0.45, Math.sin(a) * 0.3); add(t, c2); } }
  if (kind === 'puffer') { const b = new T.SphereGeometry(0.42, 14, 10); add(b, c1); for (let i = 0; i < 26; i++) { const u = Math.acos(1 - 2 * (i + 0.5) / 26), v = i * 2.4, s = new T.ConeGeometry(0.04, 0.16, 4), dir = new T.Vector3(Math.sin(u) * Math.cos(v), Math.cos(u), Math.sin(u) * Math.sin(v)); s.translate(0, 0.46, 0); s.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), dir)); add(s, c2); }
    const t = new T.ConeGeometry(0.16, 0.22, 4); t.rotateZ(Math.PI / 2); t.scale(1, 1, 0.2); t.translate(-0.5, 0, 0); add(t, c2); for (const sz of [-1, 1]) { const e = new T.SphereGeometry(0.06, 6, 5); e.translate(0.3, 0.12, sz * 0.25); add(e, new T.Color(0x101010)); } }
  if (kind === 'turtle') { const s = new T.SphereGeometry(0.5, 14, 8); s.scale(1, 0.32, 0.8); add(s, c1); const p = new T.SphereGeometry(0.48, 12, 6); p.scale(0.95, 0.12, 0.75); p.translate(0, -0.06, 0); add(p, c2); const h = new T.SphereGeometry(0.16, 10, 8); h.scale(1.3, 0.9, 1); h.translate(0.56, 0, 0); add(h, c2);
    for (const [x, z, l] of [[0.25, 1, 0.55], [0.25, -1, 0.55], [-0.3, 1, 0.3], [-0.3, -1, 0.3]]) { const f = new T.BoxGeometry(l * 0.5, 0.04, l); f.rotateY(z * 0.5); f.translate(x, -0.04, z * (0.38 + l * 0.35)); add(f, c2); } }
  if (kind === 'moray') { const b = new T.CylinderGeometry(0.07, 0.03, 1, 10, 8); b.rotateZ(Math.PI / 2); add(b, c1); const h = new T.SphereGeometry(0.1, 10, 8); h.scale(1.5, 1, 0.9); h.translate(0.5, 0, 0); add(h, c1); const fin = new T.BoxGeometry(0.95, 0.05, 0.01); fin.translate(-0.02, 0.07, 0); add(fin, c2); for (const sz of [-1, 1]) { const e = new T.SphereGeometry(0.02, 6, 5); e.translate(0.57, 0.04, sz * 0.07); add(e, new T.Color(0xf0f040)); } }
  if (kind === 'squid') { const b = new T.ConeGeometry(0.16, 0.6, 12); b.rotateZ(Math.PI / 2); b.translate(0.12, 0, 0); add(b, c1); const m = new T.SphereGeometry(0.15, 10, 8); m.translate(-0.2, 0, 0); add(m, c1); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, t = new T.CylinderGeometry(0.025, 0.008, 0.55, 4); t.rotateZ(Math.PI / 2); t.translate(-0.5, Math.cos(a) * 0.07, Math.sin(a) * 0.07); add(t, c2); }
    for (const sz of [-1, 1]) { const e = new T.SphereGeometry(0.05, 8, 6); e.translate(-0.18, 0.05, sz * 0.13); add(e, new T.Color(0x101418)); } }
  const g = T.mergeGeometries(parts); g.computeVertexNormals(); return g;
}
const SHAPES = { sardine: { len: 1, h: 0.22, w: 0.14, backMix: 0.7 }, clown: { h: 0.42, w: 0.22, stripes: 3 }, tang: { h: 0.55, w: 0.16, backMix: 0.15, tailCol: 0xffd83a }, mackerel: { h: 0.22, w: 0.16, backMix: 0.8, dorsal: 0.6 }, gold: { h: 0.4, w: 0.18, backMix: 0.2, dorsal: 0.6 },
  barracuda: { h: 0.16, w: 0.12, backMix: 0.7, dorsal: 0.8 }, tuna: { h: 0.3, w: 0.24, belly: true, dorsal: 0.7 }, grouper: { h: 0.4, w: 0.3, backMix: 0.6, dorsal: 0.5 }, swordfish: { h: 0.22, w: 0.16, belly: true, dorsal: 1.6, sword: true },
  tiger: { h: 0.22, w: 0.2, belly: true, dorsal: 1.4, stripes: 6 }, orca: { h: 0.3, w: 0.26, belly: true, dorsal: 2.2 } };
// the player's shark: a sleek grey body with a white belly, fins, a tail that beats and a jaw that opens
function sharkModel() {
  const T = THREE, g = new T.Group(), M = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.45, metalness: 0.05 }), parts = [];
  const paint = (geo, fn) => { geo = geo.toNonIndexed(); const p = geo.attributes.position, a = new Float32Array(p.count * 3), c = new T.Color(); for (let i = 0; i < p.count; i++) { fn(c, p.getX(i), p.getY(i), p.getZ(i)); a.set([c.r, c.g, c.b], i * 3); } geo.setAttribute('color', new T.BufferAttribute(a, 3)); return geo; };
  const grey = new T.Color(0x6a8296), white = new T.Color(0xf0f2f0), skin = (c, x, y) => c.copy(grey).lerp(white, clamp(0.5 - y * 7, 0, 1));
  const body = new T.SphereGeometry(0.5, 24, 14); body.scale(1, 0.24, 0.26); const pos = body.attributes.position; for (let i = 0; i < pos.count; i++) { const x = pos.getX(i); if (x > 0.25) pos.setY(i, pos.getY(i) * (1 - (x - 0.25) * 1.2)); if (x < -0.1) { const s = 1 - (-0.1 - x) * 1.1; pos.setY(i, pos.getY(i) * s); pos.setZ(i, pos.getZ(i) * s); } }
  parts.push(paint(body, skin));
  const dor = new T.ConeGeometry(0.09, 0.22, 3); dor.scale(1.8, 1, 0.18); dor.rotateZ(0.35); dor.translate(0.02, 0.17, 0); parts.push(paint(dor, c => c.copy(grey).multiplyScalar(0.85)));
  for (const sz of [-1, 1]) { const pec = new T.ConeGeometry(0.07, 0.24, 3); pec.scale(1.5, 1, 0.15); pec.rotateX(sz * 1.25); pec.rotateY(sz * 0.5); pec.translate(0.1, -0.06, sz * 0.18); parts.push(paint(pec, c => c.copy(grey).multiplyScalar(0.9)));
    const eye = new T.SphereGeometry(0.022, 8, 6); eye.translate(0.36, 0.035, sz * 0.085); parts.push(paint(eye, c => c.setHex(0x05070a))); }
  const gills = new T.BoxGeometry(0.004, 0.06, 0.2); for (let i = 0; i < 3; i++) { const q = gills.clone(); q.translate(0.2 - i * 0.03, 0.0, 0); parts.push(paint(q, c => c.copy(grey).multiplyScalar(0.6))); }
  const bodyG = T.mergeGeometries(parts); bodyG.computeVertexNormals(); const bm = new T.Mesh(bodyG, M); g.add(bm);
  const tail = new T.Group(); tail.position.set(-0.42, 0, 0); g.add(tail);
  const tg = []; const up = new T.ConeGeometry(0.06, 0.3, 3); up.scale(1.6, 1, 0.15); up.rotateZ(0.9); up.translate(-0.1, 0.1, 0); tg.push(paint(up, c => c.copy(grey))); const lo = new T.ConeGeometry(0.05, 0.2, 3); lo.scale(1.6, 1, 0.15); lo.rotateZ(Math.PI - 0.9); lo.translate(-0.07, -0.07, 0); tg.push(paint(lo, c => c.copy(grey).lerp(white, 0.2)));
  const stalk = new T.CylinderGeometry(0.03, 0.05, 0.14, 8); stalk.rotateZ(Math.PI / 2); stalk.translate(0.02, 0, 0); tg.push(paint(stalk, c => c.copy(grey)));
  const tm = new T.Mesh(T.mergeGeometries(tg), M); tail.add(tm);
  const jaw = new T.Group(); jaw.position.set(0.3, -0.04, 0); g.add(jaw); const jg = new T.SphereGeometry(0.12, 12, 6, 0, TAU, Math.PI / 2, Math.PI / 2); jg.scale(1.4, 0.4, 0.8); const jm = new T.Mesh(paint(jg, c => c.copy(white)), M); jm.position.x = 0.08; jaw.add(jm);
  const mouth = new T.Mesh(new T.SphereGeometry(0.08, 10, 6), new T.MeshBasicMaterial({ color: 0x5a1a20 })); mouth.scale.set(1.2, 0.35, 0.7); mouth.position.set(0.38, -0.04, 0); g.add(mouth);
  g.userData = { tail, jaw, mouth, M }; return g;
}
// caustics: bright wobbling lines of light on the sand (the cell edges of a pattern that joins up at its edges)
function causticTex() {
  const T = THREE, n = 256, cv2 = document.createElement('canvas'); cv2.width = cv2.height = n; const g = cv2.getContext('2d'), im = g.createImageData(n, n), R0 = W3.rng(21), P = [];
  for (let i = 0; i < 22; i++) P.push([R0() * n, R0() * n]);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { let d1 = 1e9, d2 = 1e9; for (const [px, py] of P) for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) { const d = Math.hypot(x - px - ox * n, y - py - oy * n); if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; }
    const e = Math.pow(clamp(1 - (d2 - d1) / 9, 0, 1), 2.2), i = (y * n + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = 255 * e; im.data[i + 3] = 255; }
  g.putImageData(im, 0, 0); const t = new T.CanvasTexture(cv2); t.wrapS = t.wrapT = T.RepeatWrapping; return t;
}
function gradTex(stops) { const T = THREE, c = document.createElement('canvas'); c.width = 4; c.height = 128; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 128); stops.forEach(([o, s]) => gr.addColorStop(o, s)); g.fillStyle = gr; g.fillRect(0, 0, 4, 128); return new T.CanvasTexture(c); }
const FLOOR = -12;
function buildWorld() {
  if (V3) return V3; const T = THREE; if (!W3 || !W3.init({ canvas: $('gl'), fov: 50, far: 400, near: 0.2 })) { V3 = { none: true }; return V3; }
  const S = W3.scene, R0 = W3.rng(35);
  S.traverse(o => { if (o.material && o.material.uniforms && o.material.uniforms.sunPosition) o.visible = false; });      // no sky under the sea
  // the sea floor: rolling sand, rising to the reef walls round the bay
  const hgt = (x, z) => { const r = Math.hypot(x, z); return FLOOR + Math.sin(x * 0.11) * Math.cos(z * 0.09) * 0.9 + Math.sin(x * 0.37 + z * 0.21) * 0.25 + Math.max(0, r - R_BAY - 2) * 0.55; };
  const sandMap = W3.grainTex(256, 8, 205, 40, 6); sandMap.repeat.set(26, 26);
  const floor = W3.terrain({ size: 200, seg: 120, height: hgt, colour: (x, z, h) => { const r = Math.hypot(x, z), u = clamp((r - R_BAY) / 10, 0, 1); return [0.62 - u * 0.3, 0.6 - u * 0.3, 0.5 - u * 0.2]; }, map: sandMap });
  const caus = causticTex(); caus.repeat.set(26, 26); const caus2 = caus.clone(); caus2.needsUpdate = true; caus2.repeat.set(19, 19);
  const cm = (t, o) => new T.MeshBasicMaterial({ map: t, transparent: true, opacity: o, blending: T.AdditiveBlending, depthWrite: false, fog: true });
  const cg = floor.geometry.clone(); const cMesh1 = new T.Mesh(cg, cm(caus, 0.16)), cMesh2 = new T.Mesh(cg, cm(caus2, 0.1)); cMesh1.position.y = 0.04; cMesh2.position.y = 0.06; S.add(cMesh1, cMesh2);
  // the reef walls: big rocks in a ring, tall enough to be seen from above
  const rockM = new T.MeshStandardMaterial({ color: 0x6a6a62, roughness: 0.95, flatShading: true }), wall = new T.InstancedMesh(new T.DodecahedronGeometry(1, 1), rockM, 150), d = new T.Object3D(), col = new T.Color();
  for (let i = 0; i < 150; i++) { const a = i / 150 * TAU + R0() * 0.05, r = R_BAY + 3 + R0() * 7, s = 2.5 + R0() * 4; d.position.set(Math.cos(a) * r, FLOOR + s * 0.3 + R0() * 2, Math.sin(a) * r); d.rotation.set(R0() * 3, R0() * 3, R0() * 3); d.scale.set(s, s * (0.8 + R0() * 1.1), s); d.updateMatrix(); wall.setMatrixAt(i, d.matrix); wall.setColorAt(i, col.setHSL(0.08 + R0() * 0.05, 0.12, 0.3 + R0() * 0.2)); } S.add(wall);
  // coral and rocks on the floor
  const coralCols = [0xc85a62, 0xd08a52, 0x9a6ab8, 0xc8b05a, 0x5aa8a0, 0xc86a9a];
  const coralA = new T.InstancedMesh(new T.IcosahedronGeometry(0.6, 1), new T.MeshStandardMaterial({ roughness: 0.9, flatShading: true }), 110), coralB = new T.InstancedMesh(new T.ConeGeometry(0.25, 1.6, 6), new T.MeshStandardMaterial({ roughness: 0.7 }), 110);
  const stones = new T.InstancedMesh(new T.DodecahedronGeometry(0.6, 0), rockM, 30);
  const place = [], put = (m, i, x, z, s, sy, c) => { d.position.set(x, hgt(x, z) + s * 0.3, z); d.rotation.set(R0() * 0.4, R0() * 6, R0() * 0.4); d.scale.set(s, s * (sy || 1), s); d.updateMatrix(); m.setMatrixAt(i, d.matrix); if (c != null) m.setColorAt(i, col.setHex(c)); };
  for (let i = 0; i < 110; i++) { const a = R0() * TAU, r = Math.sqrt(R0()) * (R_BAY - 2); const x = Math.cos(a) * r, z = Math.sin(a) * r, c = coralCols[(R0() * coralCols.length) | 0]; put(coralA, i, x, z, 0.3 + R0() * 0.7, 0.45, c); const a2 = a + 0.3 * R0(); put(coralB, i, x + Math.cos(a2) * 1.2, z + Math.sin(a2) * 1.2, 0.5 + R0() * 0.9, 1, coralCols[(R0() * coralCols.length) | 0]); }
  for (let i = 0; i < 30; i++) { const a = R0() * TAU, r = Math.sqrt(R0()) * R_BAY; put(stones, i, Math.cos(a) * r, Math.sin(a) * r, 0.6 + R0() * 1.6, 0.6, null); }
  S.add(coralA, coralB, stones);
  // kelp: tall ribbons that sway (the forest has many)
  const kelpG = new T.PlaneGeometry(0.5, 1, 1, 6); kelpG.translate(0, 0.5, 0); const kelpM = new T.MeshStandardMaterial({ color: 0x4a7a2a, roughness: 0.8, side: T.DoubleSide, transparent: true, opacity: 0.92 });
  const kelp = new T.InstancedMesh(kelpG, kelpM, 220), kelpL = []; for (let i = 0; i < 220; i++) { const a = R0() * TAU, r = 4 + Math.sqrt(R0()) * (R_BAY - 4), x = Math.cos(a) * r, z = Math.sin(a) * r; kelpL.push({ x, z, y: hgt(x, z), h: 5 + R0() * 7, ph: R0() * 6, rot: R0() * 6 }); } S.add(kelp);
  // light from above: soft shafts that drift, and specks of sea snow
  const rayT = gradTex([[0, 'rgba(255,255,255,0.9)'], [0.6, 'rgba(255,255,255,0.25)'], [1, 'rgba(255,255,255,0)']]), rays = [];
  for (let i = 0; i < 7; i++) { const m = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: rayT, transparent: true, opacity: 0.07, blending: T.AdditiveBlending, depthWrite: false, fog: false, side: T.DoubleSide })); S.add(m); rays.push({ m, ox: (R0() - 0.5) * 2, oz: (R0() - 0.5) * 2, ph: R0() * 6, w: 0.6 + R0() * 0.8 }); }
  const snowN = 700, sp = new Float32Array(snowN * 3); for (let i = 0; i < snowN; i++) sp.set([R0(), R0(), R0()], i * 3);
  const snowG = new T.BufferGeometry(); snowG.setAttribute('position', new T.BufferAttribute(sp, 3));
  const snow = new T.Points(snowG, new T.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { c: { value: new T.Vector3() }, box: { value: new T.Vector3(40, 9, 40) }, t: { value: 0 }, sz: { value: 2 } },
    vertexShader: `uniform vec3 c; uniform vec3 box; uniform float t; uniform float sz; varying float vf; void main(){ vec3 q = position * box; q.y = mod(q.y - t * 0.15 - c.y, box.y); q.x = mod(q.x + sin(t * 0.2 + position.z * 9.0) * 0.6 - c.x, box.x); q.z = mod(q.z - c.z, box.z); q += c - box * vec3(0.5, 0.7, 0.5);
      vec4 mv = modelViewMatrix * vec4(q, 1.0); vf = clamp(1.0 - (-mv.z) / 70.0, 0.0, 1.0); gl_PointSize = sz * (0.6 + fract(position.x * 37.0)); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying float vf; void main(){ vec2 p = gl_PointCoord - 0.5; if (dot(p, p) > 0.25) discard; gl_FragColor = vec4(0.85, 0.95, 1.0, 0.55 * vf); }` }));
  snow.frustumCulled = false; S.add(snow);
  // the fish: one drawing per kind, all of that kind at once
  const fishM = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, metalness: 0.15 }), jellyM = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.2, transparent: true, opacity: 0.6, emissive: 0xc070ff, emissiveIntensity: 0.35, depthWrite: false });
  fishM.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += vColor.rgb * 0.28;'); };      // fish glow a little in their own colours, so they stand out from the floor
  const goldM = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.25, metalness: 0.7, emissive: 0xffa010, emissiveIntensity: 0.45 });
  const inst = {}; for (const q of ORDER) { const geo = SHAPES[q] ? fishGeo(SPECIES[q], SHAPES[q]) : specialGeo(q), n = q === 'sardine' ? 160 : SPECIES[q].kind === 'hunter' ? 12 : 50; const m = new T.InstancedMesh(geo, q === 'jelly' ? jellyM : q === 'gold' ? goldM : fishM, n); m.count = 0; m.frustumCulled = false; S.add(m); inst[q] = m; }
  const shark = sharkModel(); S.add(shark);
  const glowT = (() => { const c2 = document.createElement('canvas'); c2.width = c2.height = 64; const g = c2.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new T.CanvasTexture(c2); })();
  const goldGlow = new T.InstancedMesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: glowT, color: 0xffd040, transparent: true, opacity: 0.55, blending: T.AdditiveBlending, depthWrite: false }), 8); goldGlow.count = 0; goldGlow.frustumCulled = false; S.add(goldGlow);
  const lamp = new T.PointLight(0xbfe8ff, 0, 30, 1.2); S.add(lamp);      // in the deep: a little light of your own
  V3 = { T, S, floor, cMesh1, cMesh2, caus, caus2, kelp, kelpL, kelpM, coralA, rays, snow, inst, shark, goldGlow, lamp, place: -1, sandM: floor.material, rockM };
  W3.setQuality(stepN); return V3;
}
const SV = new (window.THREE ? THREE.Vector3 : Object)();
function scr(x, y, z) { if (!V3 || V3.none) return { x: W / 2 + (x - ui.cam.x) * W / ui.cam.span, y: H * 0.5 + (z - ui.cam.z) * W / ui.cam.span, front: true }; SV.set(x, y, z); return W3.screen(SV); }
const TILT = 58 * Math.PI / 180;
function placeCam(g, dt) {
  const cam = W3.cam, asp = innerWidth / innerHeight, m = g.me, span = 5 + 2.6 * SIZES[m.tier], c = ui.cam;
  if (ui.snap) { c.x = m.x; c.z = m.z; c.span = span; ui.snap = false; }
  const e = 1 - Math.exp(-dt * 3.5); c.x += (m.x + m.vx * 0.25 - c.x) * e; c.z += (m.z + m.vz * 0.25 - c.z) * e; c.span += (span - c.span) * (1 - Math.exp(-dt * 1.6));
  cam.fov = 50; cam.aspect = asp; cam.updateProjectionMatrix(); const dist = c.span / (2 * Math.tan(25 * Math.PI / 180) * Math.min(asp, 1));
  const sh = FX.shake ? (Math.random() - 0.5) * FX.shake * 0.02 : 0;
  cam.position.set(c.x + sh, Math.sin(TILT) * dist, c.z + Math.cos(TILT) * dist); cam.lookAt(c.x, 0, c.z - dist * 0.02); cam.updateMatrixWorld();
  const f = W3.scene.fog; f.near = dist * 0.85; f.far = dist * 1.9 + 12; return dist;
}
// ---------- events ----------
function onEvent(G, e) {
  const m = G.me, sp = scr(m.x, 0, m.z), cx = W / 2;
  switch (e.k) {
    case 'start': say(PLACES[G.place].name.toUpperCase(), cx, H * 0.3, '#bfe8ff', 24); say(`GROW TO SIZE ${G.cfg.goal}`, cx, H * 0.36, '#ffe08a', 28); sfx.ding(); if (G.N <= 2) tip('drag', 'Put your thumb down anywhere and drag: the shark swims that way', 3.2); break;
    case 'eat': { const p = scr(e.x, 0, e.z); ui.combo++; ui.comboT = 1.6; burst(p.x, p.y, hex(SPECIES[e.kind].col), e.val > 2 ? 18 : 10); burst(p.x, p.y, '#ffffff', 4); sfx.bite(ui.combo, e.val >= 4); vibe(e.val >= 4 ? HAP.thud : HAP.light);
      if (e.gold) { sfx.gold(); say('GOLDEN! +3', p.x, p.y - 30 * k, '#ffd040', 28); burst(p.x, p.y, '#ffd040', 24, 200); FX.flash = 0.35; }
      else say('+' + e.val, p.x, p.y - 24 * k, '#bff5c8', 18 + Math.min(10, e.val * 2));
      if (e.wasHunter) say('THE HUNTER IS LUNCH!', cx, H * 0.3, '#ffe08a', 24);
      if (ui.combo >= 3) say(`FRENZY ×${ui.combo}`, sp.x, sp.y - 54 * k, '#ffb83a', 20 + Math.min(10, ui.combo));
      if (e.isNew && !G.lesson) { ui.toast = { txt: `NEW FOR YOUR AQUARIUM: ${SPECIES[e.kind].name.toUpperCase()}`, kind: e.kind, t: 0 }; sfx.newkind(); }
      if (e.val >= 4) FX.stop = 0.04; break; }
    case 'grow': FX.flash = 0.7; say(`BIGGER! SIZE ${e.tier + 1}`, cx, H * 0.32, '#ffe08a', 34); sfx.grow(e.tier); vibe(HAP.best); bubbles(sp.x, sp.y, 18);
      if (e.tier + 1 === G.cfg.goal - 1) tip('last', `One more size and you win! (size ${G.cfg.goal})`, 2.6); else if (e.tier >= 1) tip('turn', 'Some fish that were red are green now: eat them!', 3); break;
    case 'notice': sfx.growl(); vibe(HAP.light); tip('hunter', 'A hunter has seen you! Drag your thumb far to dash away', 3); break;
    case 'hunt': sfx.hunt(); FX.red = Math.max(FX.red, 0.35); break;
    case 'escaped': say('GOT AWAY!', sp.x, sp.y - 44 * k, '#9be3ff', 22); sfx.escaped(); break;
    case 'caught': sfx.caught(); FX.red = 1; FX.shake = 8; break;      // no buzz on a loss (P11)
    case 'sting': sfx.sting(); say('OUCH! JELLYFISH', sp.x, sp.y - 40 * k, '#f0a0ff', 20); FX.shake = 3; tip('jelly', 'Jellyfish sting and slow you: swim round them', 2.8); break;
    case 'spike': sfx.spike(); say('SPIKY!', sp.x, sp.y - 40 * k, '#e8d070', 18); tip('puffer', 'Pufferfish puff up when you come near: dash at them to catch one before it puffs', 3.2); break;
    case 'lessonnext': if (e.first) hint = null; say('FIRST, A LESSON', cx, H * 0.36, '#ffe08a', 26); sfx.ding(); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, cx, H * 0.4, '#9be3b5', 24); sfx.coin(e.n); break;
    case 'lessonmiss': coachMiss(); break;
    case 'lessondone': say('NOW THE REAL HUNT!', cx, H * 0.36, '#ffe08a', 26); sfx.win(); ui.snap = true; if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); vibe(HAP.best); say('BIG ENOUGH!', cx, H * 0.3, '#ffe08a', 38); break;
    case 'lost': sfx.lose(); say(e.why === 'starved' ? 'TOO HUNGRY...' : 'EATEN!', cx, H * 0.3, '#ffb4a8', 32); break;
  }
}
// ---------- every frame in 3D ----------
const DUMMY = new (window.THREE ? THREE.Object3D : Object)();
function animate(g, t, dt) {
  const V = V3, m = g.me, s = SIZES[m.tier], P = PLACES[g.place];
  // the shark: swims with a beating tail, banks into turns, opens its jaws to bite
  const sh = V.shark, u = sh.userData, sp = Math.hypot(m.vx, m.vz); sh.position.set(m.x, Math.sin(t * 1.3) * 0.08, m.z); sh.rotation.set(-(m.turn || 0) * 0.5, -m.face, 0, 'YXZ');
  ui.sharkS = (ui.sharkS || s) + (s - (ui.sharkS || s)) * (1 - Math.exp(-dt * 3)); sh.scale.setScalar(ui.sharkS);
  ui.tailPh = (ui.tailPh || 0) + dt * (5 + sp * 1.8 / Math.sqrt(s)); u.tail.rotation.y = Math.sin(ui.tailPh) * (0.35 + (m.dashing ? 0.2 : 0)); u.jaw.rotation.z = -(m.mouth > 0 ? Math.sin(m.mouth / 0.25 * Math.PI) * 0.6 : 0.05);
  u.M.emissive.setHex(m.stung > 0 ? 0x803060 : m.hunger <= 0 ? 0x401010 : 0x000000);
  // the fish, kind by kind
  for (const q in V.inst) V.inst[q].count = 0; V.goldGlow.count = 0;
  for (const f of g.fish) { const I = V.inst[f.kind]; if (!I || I.count >= I.instanceMatrix.count) continue; const sw = f.sp.kind === 'jelly' ? 0 : Math.sin(f.wob * (6 + f.v * 1.5) + f.id) * 0.14, by = Math.sin(f.wob * 0.8 + f.id) * 0.15 + (f.sp.kind === 'jelly' ? 0.4 : 0);
    DUMMY.position.set(f.x, by, f.z); DUMMY.rotation.set(0, -f.h + sw, f.sp.kind === 'jelly' ? 0 : 0, 'YXZ'); let sc = f.size; if (f.kind === 'puffer') sc *= 1 + f.puff * 0.7;
    if (f.kind === 'jelly') { const pu = 1 + Math.sin(f.wob * 2.2) * 0.1; DUMMY.scale.set(sc * pu, sc / pu, sc * pu); } else DUMMY.scale.setScalar(sc); DUMMY.updateMatrix(); I.setMatrixAt(I.count++, DUMMY.matrix);
    if (f.sp.gold && V.goldGlow.count < 8) { DUMMY.position.y = by + 0.1; DUMMY.rotation.set(-Math.PI / 2 + TILT * 0 - 0.6, 0, 0); DUMMY.scale.setScalar(f.size * 3.5 * (1 + Math.sin(t * 6) * 0.1)); DUMMY.updateMatrix(); V.goldGlow.setMatrixAt(V.goldGlow.count++, DUMMY.matrix); } }
  for (const q in V.inst) V.inst[q].instanceMatrix.needsUpdate = true; V.goldGlow.instanceMatrix.needsUpdate = true;
  // kelp sways; caustics ripple; light shafts drift; snow falls
  const kc = g.place === 1 ? 160 : 40; V.kelp.count = kc; for (let i = 0; i < kc; i++) { const kl = V.kelpL[i], a = Math.sin(t * 0.8 + kl.ph) * 0.12; DUMMY.position.set(kl.x, kl.y, kl.z); DUMMY.rotation.set(a, kl.rot, a * 0.6); DUMMY.scale.set(1, kl.h, 1); DUMMY.updateMatrix(); V.kelp.setMatrixAt(i, DUMMY.matrix); } V.kelp.instanceMatrix.needsUpdate = true;
  V.caus.offset.set(t * 0.012, t * 0.007); V.caus2.offset.set(-t * 0.009, t * 0.011);
  const c = ui.cam; for (const r of V.rays) { const w = c.span * r.w * 0.35; r.m.position.set(c.x + r.ox * c.span * 0.7 + Math.sin(t * 0.1 + r.ph) * 2, FLOOR + 10, c.z + r.oz * c.span * 0.7); r.m.scale.set(w, 26, 1); r.m.rotation.set(0, Math.atan2(W3.cam.position.x - r.m.position.x, W3.cam.position.z - r.m.position.z), 0.35); r.m.material.opacity = (0.05 + 0.03 * Math.sin(t * 0.4 + r.ph)) * (g.place === 3 ? 0.2 : 1); }
  const su = V.snow.material.uniforms; su.t.value = t; su.c.value.set(c.x, -1, c.z); su.box.value.set(c.span * 2.4, 9, c.span * 2.4); su.sz.value = 2 * DPR;
  V.lamp.position.set(m.x, 4 + s, m.z); V.lamp.intensity = g.place === 3 ? 40 + s * 8 : 0; V.lamp.distance = 14 + s * 4;
}
let IG = null; function idleG() { if (!IG || IG.over) { IG = newGame(Math.max(4, store.get('level', 1) | 0), { seed: (Math.random() * 1e6) | 0 }); IG.mem = {}; ui.snap = true; } honest(IG, { react: 0.3, acc: 0.95 }, IG.mem); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function setPlace(V, p) { const P = PLACES[p]; V.place = p; W3.setSky('noon', { fog: P.fog, azim: 160 }); const S = W3.scene; S.background = new THREE.Color(P.fog); S.environmentIntensity = p === 3 ? 0.08 : 0.35;
  W3.sun.color.set(p === 3 ? 0x4060a0 : 0xd8f4ff); W3.sun.intensity = [2.4, 1.9, 1.7, 0.25][p]; W3.hemi.color.set(P.sea); W3.hemi.groundColor.set(P.sand).multiplyScalar(0.5); W3.hemi.intensity = [1.5, 1.3, 1.2, 0.6][p];
  V.sandM.color.set(P.sand).multiplyScalar(1.2); V.cMesh1.material.opacity = p === 3 ? 0.03 : 0.16; V.cMesh2.material.opacity = p === 3 ? 0.02 : 0.1; V.kelpM.color.set(p === 1 ? 0x5a8a2a : 0x4a6a3a); V.coralA.visible = p !== 3; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#04202e'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D sea.', W / 2, H / 2); return; }
  const g = G || idleG(), t = now;
  if (V.place !== g.place) setPlace(V, g.place);
  placeCam(g, dt); animate(g, t, dt); W3.setFocus(ui.cam.x, 0, ui.cam.z, ui.cam.span); W3.render(dt);
  if (G) { const m = G.me; if (m.dashing && !ui.dashWas) { sfx.dash(); const p = scr(m.x, 0, m.z); bubbles(p.x, p.y, 8); } ui.dashWas = m.dashing; if (m.dashing && Math.random() < dt * 10) { const p = scr(m.x - Math.cos(m.face) * SIZES[m.tier] * 0.5, 0, m.z - Math.sin(m.face) * SIZES[m.tier] * 0.5); bubbles(p.x, p.y, 1); }
    rings(G, t); hud(G, t); }
  for (const p of PARTS) { const al = Math.max(0, 1 - p.t / p.life); ctx.globalAlpha = al; if (p.col === 'bub') { ctx.strokeStyle = 'rgba(220,245,255,.8)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.stroke(); } else { ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 1.1 ? 1 : 1 - (t2.t - 1.1) / 0.4; ctx.globalAlpha = Math.max(0, al); const sc = t2.t < 0.12 ? 1.35 - t2.t / 0.12 * 0.35 : 1; ctx.font = `400 ${Math.round(t2.size * k * sc)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(2,16,26,.65)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 22); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 22); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30;
    ctx.fillStyle = 'rgba(4,24,36,.86)'; rrect(W / 2 - w / 2, H * 0.62 - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.62 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (G && G.me.hunger < 0.2 && !G.over) { const a = (0.2 - G.me.hunger) / 0.2 * (0.5 + 0.5 * Math.sin(t * 6)); const gr = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75); gr.addColorStop(0, 'rgba(120,0,0,0)'); gr.addColorStop(1, `rgba(120,0,0,${0.5 * a})`); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,30,30,${FX.red * 0.16})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(230,250,255,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); }
}
// ---------- the 2D layer ----------
// green rings on what you can eat, red on what can eat you (pulsing when it is coming), a gold sparkle on the golden fish;
// a red mark at the edge of the screen for a hunter you cannot see that is near or coming
function rings(G, t) {
  const m = G.me, c = ui.cam, sense = G.cfg.sense;
  for (const f of G.fish) { const d = Math.hypot(f.x - m.x, f.z - m.z); if (d > c.span * 1.3 && !(danger(G, f) && f.state !== 'calm')) continue; const p = scr(f.x, 0, f.z), r = Math.max(6 * k, f.size * W / c.span * 0.55);
    const on = p.x > -10 && p.x < W + 10 && p.y > -10 && p.y < H + 10;
    if (danger(G, f)) { const hot = f.state !== 'calm'; if (on) { ctx.strokeStyle = hot ? `rgba(255,60,50,${0.65 + 0.35 * Math.sin(t * 12)})` : 'rgba(255,80,70,.45)'; ctx.lineWidth = (hot ? 3 : 2) * k; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.stroke();
        if (f.state === 'notice') { ctx.font = `400 ${Math.round(26 * k)}px ${TF}`; ctx.fillStyle = '#ff5a4a'; ctx.textAlign = 'center'; ctx.fillText('!', p.x, p.y - r - 14 * k); } }
      else if (hot || d < (10 + f.size * 1.5 + SIZES[m.tier] * 1.5) * sense) edgeMark(p, hot, t); }
    else if (edible(G, f) && on && d < c.span * 0.9) { ctx.strokeStyle = f.sp.gold ? `rgba(255,210,60,${0.7 + 0.3 * Math.sin(t * 8)})` : 'rgba(120,255,150,.55)'; ctx.lineWidth = (f.sp.gold ? 2.5 : 1.6) * k; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.stroke(); }
    else if (f.kind === 'puffer' && f.puff > 0.5 && on) { ctx.strokeStyle = 'rgba(255,220,120,.5)'; ctx.setLineDash([3 * k, 3 * k]); ctx.lineWidth = 1.5 * k; ctx.beginPath(); ctx.arc(p.x, p.y, r * 1.3, 0, TAU); ctx.stroke(); ctx.setLineDash([]); } }
}
function edgeMark(p, hot, t) { const cx = W / 2, cy = H / 2, dx = p.x - cx, dy = p.y - cy, mx = W / 2 - 22 * k, my = H / 2 - 30 * k, s = Math.min(mx / Math.abs(dx || 1e-6), my / Math.abs(dy || 1e-6)), x = cx + dx * s, y = cy + dy * s, a = Math.atan2(dy, dx), z = (hot ? 1.2 + 0.15 * Math.sin(t * 14) : 0.9) * k;
  ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = hot ? '#ff3a2a' : 'rgba(255,90,70,.7)'; ctx.beginPath(); ctx.moveTo(16 * z, 0); ctx.lineTo(-8 * z, -12 * z); ctx.lineTo(-8 * z, 12 * z); ctx.closePath(); ctx.fill(); ctx.restore(); }
function panel(x, y, w, h) { ctx.fillStyle = 'rgba(4,20,32,.72)'; rrect(x, y, w, h, 14); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.1)'; ctx.lineWidth = 1.5; rrect(x, y, w, h, 14); ctx.stroke(); }
function hud(G, t) {
  const m = G.me, goal = G.cfg.goal, need = needOf(G), bestS = HEADLESS ? 0 : ((store.get('bestSize', {}) || {})[G.N] | 0);
  ctx.textBaseline = 'middle';
  if (!G.lesson) {      // the goal: your size among the sizes to reach, your best here, how many more to grow
    const x = 12, y = 48 * k, w = W - 24, h = 70 * k; panel(x, y, w, h);
    ctx.textAlign = 'left'; ctx.font = `400 ${Math.round(16 * k)}px ${TF}`; ctx.fillStyle = '#fff'; ctx.fillText(`SIZE ${m.tier + 1}`, x + 12, y + 17 * k);
    ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillText(`grow to size ${goal}`, x + 12 + ctx.measureText('').width + 62 * k, y + 17 * k);
    const pw = 15 * k, gap = 5 * k, px0 = x + w - 12 - goal * (pw + gap) + gap;
    for (let i = 0; i < goal; i++) { const px = px0 + i * (pw + gap), on = i <= m.tier; ctx.fillStyle = on ? '#ffb83a' : 'rgba(255,255,255,.18)'; rrect(px, y + 10 * k, pw, 14 * k, 4 * k); ctx.fill();
      if (i === goal - 1) { ctx.font = `${Math.round(10 * k)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillStyle = '#1d1204'; ctx.fillText('🏁', px + pw / 2, y + 17 * k); }
      if (bestS && i === bestS - 1 && bestS > m.tier + 1) { ctx.strokeStyle = 'rgba(190,230,255,.9)'; ctx.lineWidth = 2; ctx.setLineDash([3, 2]); rrect(px - 2, y + 8 * k, pw + 4, 18 * k, 5 * k); ctx.stroke(); ctx.setLineDash([]); } }
    if (bestS > m.tier + 1) { ctx.textAlign = 'right'; ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.fillStyle = 'rgba(190,230,255,.85)'; ctx.fillText(`best here: size ${bestS}`, x + w - 12, y + 33 * k); }
    ui.fillShow += (m.fill / need - ui.fillShow) * 0.15; const bx = x + 12, bw = w - 24, by2 = y + 44 * k, bh = 10 * k;
    ctx.fillStyle = 'rgba(0,0,0,.4)'; rrect(bx, by2, bw, bh, bh / 2); ctx.fill(); ctx.fillStyle = '#7ef0a0'; if (ui.fillShow > 0.01) { rrect(bx, by2, Math.max(bh, bw * clamp(ui.fillShow, 0, 1)), bh, bh / 2); ctx.fill(); }
    ctx.textAlign = 'center'; ctx.font = `800 ${Math.round(11 * k)}px ${BC}`; ctx.fillStyle = '#fff'; const left = Math.max(0, need - m.fill); ctx.fillText(m.tier + 1 >= goal ? 'YOU MADE IT!' : `${left} more to grow`, x + w / 2, by2 + bh + 9 * k);
    // hunger
    const hy = y + h + 8 * k; ui.hungerShow += (m.hunger - ui.hungerShow) * 0.2; ctx.fillStyle = 'rgba(0,0,0,.45)'; rrect(x, hy, w * 0.5, 9 * k, 4.5 * k); ctx.fill(); const low = m.hunger < 0.3;
    ctx.fillStyle = low ? (Math.sin(t * 8) > 0 ? '#ff5a4a' : '#ff9a4a') : '#ffb83a'; if (ui.hungerShow > 0.01) { rrect(x, hy, Math.max(9 * k, w * 0.5 * ui.hungerShow), 9 * k, 4.5 * k); ctx.fill(); }
    ctx.textAlign = 'left'; ctx.font = `800 ${Math.round(11 * k)}px ${BC}`; ctx.fillStyle = low ? '#ffb4a8' : 'rgba(255,255,255,.8)'; ctx.fillText(m.hunger <= 0 ? 'STARVING!' : low ? 'HUNGRY!' : 'food', x + w * 0.5 + 8, hy + 4.5 * k);
    ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillText(`🪙 ${G.coins}`, x + w, hy + 4.5 * k);
  } else lessonPanel(G);
  // your dash: a thin blue bar under the shark, only while it is not full
  const p = scr(m.x, 0, m.z); if (m.dash < 0.99) { const w = 46 * k, y = p.y + Math.max(18 * k, SIZES[m.tier] * W / ui.cam.span * 0.35); ctx.fillStyle = 'rgba(0,0,0,.45)'; rrect(p.x - w / 2, y, w, 5 * k, 2.5 * k); ctx.fill(); ctx.fillStyle = m.dash < 0.15 ? '#ff8a6a' : '#6ad8ff'; rrect(p.x - w / 2, y, w * m.dash, 5 * k, 2.5 * k); ctx.fill(); }
  // your thumb: where you put it down, and where it is now (blue at the edge: a dash)
  const s2 = ui.stick; if (s2) { const R = 70 * k, dx = s2.x - s2.x0, dy = s2.y - s2.y0, L = Math.hypot(dx, dy), q = Math.min(1, L / R), kx = s2.x0 + (L ? dx / L : 0) * R * q, ky = s2.y0 + (L ? dy / L : 0) * R * q, dash = q > 0.92;
    ctx.strokeStyle = dash ? 'rgba(106,216,255,.85)' : 'rgba(255,255,255,.35)'; ctx.lineWidth = (dash ? 4 : 2.5) * k; ctx.beginPath(); ctx.arc(s2.x0, s2.y0, R, 0, TAU); ctx.stroke();
    ctx.fillStyle = dash ? 'rgba(106,216,255,.7)' : 'rgba(255,255,255,.45)'; ctx.beginPath(); ctx.arc(kx, ky, 22 * k, 0, TAU); ctx.fill(); if (dash) { ctx.font = `400 ${Math.round(12 * k)}px ${TF}`; ctx.textAlign = 'center'; ctx.fillStyle = '#dff6ff'; ctx.fillText('DASH', s2.x0, s2.y0 - R - 10 * k); } }
  else if ((G && G.lesson) && G.t < 6 && G.N <= 3 && !G.over) { const a = 0.5 + 0.5 * Math.sin(t * 4); ctx.globalAlpha = a; ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText('drag anywhere to swim', W / 2, H - 70 * k); ctx.globalAlpha = 1; }
  // the aquarium toast
  if (ui.toast) { const a = Math.min(1, ui.toast.t / 0.2, (2.6 - ui.toast.t) / 0.4); ctx.globalAlpha = Math.max(0, a); ctx.font = `800 ${Math.round(12 * k)}px ${BC}`; const tw = ctx.measureText(ui.toast.txt).width + 30 * k, ty = H - 120 * k; ctx.fillStyle = 'rgba(4,24,36,.88)'; rrect(W / 2 - tw / 2, ty - 16 * k, tw, 32 * k, 16 * k); ctx.fill(); ctx.strokeStyle = '#ffb83a'; ctx.lineWidth = 1.5; rrect(W / 2 - tw / 2, ty - 16 * k, tw, 32 * k, 16 * k); ctx.stroke(); ctx.textAlign = 'center'; ctx.fillStyle = '#ffe08a'; ctx.fillText('🐠 ' + ui.toast.txt, W / 2, ty); ctx.globalAlpha = 1; }
}
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { coachPanel(G); }
// a little picture of each kind for the aquarium (a shadow if not found yet)
function fishIcon(c, q, off) { const g = c.getContext('2d'), sp = SPECIES[q], w = c.width, h = c.height, c1 = off ? '#2a3a48' : hex(sp.col), c2 = off ? '#2a3a48' : hex(sp.col2); g.clearRect(0, 0, w, h); g.save(); g.translate(w / 2, h / 2);
  if (q === 'jelly') { g.fillStyle = c1; g.beginPath(); g.arc(0, -4, 18, Math.PI, 0); g.fill(); g.strokeStyle = c2; g.lineWidth = 2; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 7, -4); g.quadraticCurveTo(i * 7 + 4, 12, i * 7, 26); g.stroke(); } }
  else if (q === 'turtle') { g.fillStyle = c2; g.beginPath(); g.ellipse(26, 0, 8, 6, 0, 0, TAU); g.fill(); for (const [x, y] of [[10, -18], [10, 18], [-14, -14], [-14, 14]]) { g.beginPath(); g.ellipse(x, y, 9, 4, x > 0 ? 0.5 * Math.sign(y) : -0.5 * Math.sign(y), 0, TAU); g.fill(); } g.fillStyle = c1; g.beginPath(); g.ellipse(0, 0, 22, 16, 0, 0, TAU); g.fill(); }
  else if (q === 'puffer') { g.fillStyle = c2; for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; g.beginPath(); g.moveTo(Math.cos(a) * 16, Math.sin(a) * 16); g.lineTo(Math.cos(a + 0.12) * 23, Math.sin(a + 0.12) * 23); g.lineTo(Math.cos(a + 0.24) * 16, Math.sin(a + 0.24) * 16); g.fill(); } g.fillStyle = c1; g.beginPath(); g.arc(0, 0, 17, 0, TAU); g.fill(); }
  else if (q === 'squid') { g.strokeStyle = c2; g.lineWidth = 2.5; for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(-8, i * 2); g.quadraticCurveTo(-24, i * 5, -40, i * 6 + Math.sin(i) * 4); g.stroke(); } g.fillStyle = c1; g.beginPath(); g.moveTo(-10, -9); g.lineTo(34, 0); g.lineTo(-10, 9); g.closePath(); g.fill(); g.beginPath(); g.arc(-8, 0, 9, 0, TAU); g.fill(); }
  else { const L = q === 'moray' ? 40 : 30, Hh = (SHAPES[q] ? SHAPES[q].h : 0.3) * 34; g.fillStyle = c1; g.beginPath(); g.moveTo(-L * 0.85, 0); g.lineTo(-L * 1.15, -Hh * 0.6); g.lineTo(-L * 1.15, Hh * 0.6); g.closePath(); g.fill(); g.beginPath(); g.ellipse(0, 0, L, Math.max(4, Hh / 2), 0, 0, TAU); g.fill();
    g.fillStyle = c2; g.beginPath(); g.ellipse(0, -Hh * 0.18, L * 0.85, Math.max(2, Hh * 0.2), 0, Math.PI, TAU); g.fill(); if (SHAPES[q] && SHAPES[q].dorsal) { g.beginPath(); g.moveTo(-6, -Hh / 2 + 1); g.lineTo(2, -Hh / 2 - SHAPES[q].dorsal * 8); g.lineTo(8, -Hh / 2 + 1); g.fill(); }
    if (!off) { g.fillStyle = '#0a0a10'; g.beginPath(); g.arc(L * 0.6, -2, 2.4, 0, TAU); g.fill(); } }
  g.restore(); }
