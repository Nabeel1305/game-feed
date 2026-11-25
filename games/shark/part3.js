// ===================== THE VIEW: Deep Bite in 3D (three.js through tools/world3d.js) =====================
// Looking down through clear water at a young shark: sand far below with light rippling over it, coral and rocks, kelp that
// sways, shafts of sunlight and drifting specks, reef walls round the bay. The camera lifts as the shark grows, so the sea
// gets wider around you (the growth you can see). Fish of each kind are drawn all at once (one drawing per kind). The 2D layer
// draws the green and red rings (eat / run), the red marks at the edge for hunters you cannot see, your bars, and your thumb.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { snap: true, stick: null, cam: { x: 0, z: 0, span: 12 }, combo: 0, comboT: 0, dashWas: false, fillShow: 0, hungerShow: 1, toast: null };
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 9) TXT.shift(); }
function tip(key, txt, secs = 2.8) { if (HEADLESS || !(G && G.lesson)) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
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
  const body = new T.SphereGeometry(0.5, 18, 12); body.scale(len, ht / 0.5 * 0.5, wd / 0.5 * 0.5);
  { const p = body.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i); if (x < 0) { const tp = 1 - Math.min(1, -x / (len * 0.5)) * 0.72; p.setY(i, p.getY(i) * tp); p.setZ(i, p.getZ(i) * tp); } else if (x > len * 0.3) { const tp = 1 - (x - len * 0.3) / (len * 0.2) * 0.25; p.setZ(i, p.getZ(i) * tp); } } }      /* 25 Nov 2026: a fish, not an egg: slim towards the tail, a narrower nose */
  paint(body, (c, x, y) => { const back = y > 0.02 ? 1 : 0; c.copy(c1); if (o.belly) c.lerp(c2, y < 0 ? 0.8 : 0); else if (back) c.lerp(c2, o.backMix != null ? o.backMix : 0.45); if (o.stripes) { const s = Math.abs(Math.sin((x + 0.5) * Math.PI * o.stripes)); if (s > 0.9) c.copy(c2); } });
  for (const sy of [-1, 1]) { const tail = new T.ConeGeometry(ht * 0.3, len * 0.36, 4); tail.rotateZ(Math.PI / 2); tail.scale(1, 1, 0.16); tail.rotateZ(sy * 0.55); tail.translate(-len * 0.6, sy * ht * 0.3, 0); paint(tail, c => c.copy(o.tailCol != null ? new T.Color(o.tailCol) : c1).lerp(c2, 0.3)); }      /* a forked tail */
  for (const sz of [-1, 1]) { const fin = new T.ConeGeometry(ht * 0.22, len * 0.24, 3); fin.rotateZ(Math.PI / 2); fin.scale(1, 0.2, 1); fin.rotateY(sz * 0.9); fin.translate(len * 0.08, -ht * 0.12, sz * wd * 0.5); paint(fin, c => c.copy(c1).lerp(c2, 0.45)); }      /* side fins: what you see from above */
  if (o.dorsal) { const d = new T.ConeGeometry(ht * 0.35, ht * o.dorsal, 3); d.scale(1.6, 1, 0.2); d.translate(-len * 0.02, ht * 0.5 + ht * o.dorsal * 0.4, 0); paint(d, c => c.copy(c1).lerp(c2, o.belly ? 0 : 0.5)); }
  if (o.sword) { const s = new T.ConeGeometry(0.02, len * 0.45, 5); s.rotateZ(-Math.PI / 2); s.translate(len * 0.7, 0, 0); paint(s, c => c.copy(c1)); }
  for (const sz of [-1, 1]) { const w = new T.SphereGeometry(ht * 0.13, 8, 6); w.translate(len * 0.33, ht * 0.1, sz * wd * 0.36); paint(w, c => c.setHex(0xf4f4f0)); const e = new T.SphereGeometry(ht * 0.08, 6, 5); e.translate(len * 0.345, ht * 0.1, sz * wd * 0.42); paint(e, c => c.setHex(0x0a0a10)); }
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
// the player's shark (25 Nov 2026, his words: "improve the graphics"). It was a squashed ball with cones stuck on. Now a great white's shape, made from
// its outline: a pointed snout, the body deepest at the shoulders and running back to a thin tail stalk; slate grey above and white below with the
// line between them wavy along the flank; a tall swept-back fin on the back and a small second one; long swept side fins (what you see most from
// above); the crescent tail, upper lobe the longer, that beats; gill slits, a black eye, a jaw of teeth that drops to bite.
function sharkModel() {
  const T = THREE, g = new T.Group(), M = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.38, metalness: 0.08, side: T.DoubleSide }), parts = [];
  const grey = new T.Color(0x8ea3b4), dark = new T.Color(0x5a6e80), white = new T.Color(0xfafcfa), c = new T.Color();
  const flat = (geo, col) => { geo = geo.index ? geo.toNonIndexed() : geo; const n = geo.attributes.position.count, a = new Float32Array(n * 3); for (let q = 0; q < n; q++) a.set([col.r, col.g, col.b], q * 3); geo.setAttribute('color', new T.BufferAttribute(a, 3)); geo.deleteAttribute('normal'); geo.setAttribute('uv', new T.BufferAttribute(new Float32Array(n * 2), 2)); return geo; };
  // the body: rings along its length [x, half height, half width, lift]
  const PR = [[0.52, 0.004, 0.004, 0.012], [0.47, 0.034, 0.04, 0.01], [0.4, 0.066, 0.078, 0.006], [0.3, 0.098, 0.108, 0.002], [0.17, 0.122, 0.128, 0], [0.03, 0.128, 0.13, 0], [-0.1, 0.116, 0.112, 0.002], [-0.22, 0.09, 0.082, 0.006], [-0.33, 0.058, 0.048, 0.012], [-0.41, 0.036, 0.026, 0.016], [-0.47, 0.026, 0.016, 0.018]];
  { const n = 16, pos = [], col = [], idx = [], sub = 3, R2 = []; for (let a = 0; a < PR.length - 1; a++) for (let q = 0; q < sub; q++) { const t = q / sub, A = PR[a], B = PR[a + 1], e = t * t * (3 - 2 * t); R2.push(A.map((v, w) => v + (B[w] - v) * (w ? e : t))); } R2.push(PR[PR.length - 1]);
    R2.forEach((r, ri) => { for (let q = 0; q <= n; q++) { const th = q / n * TAU, cy = Math.cos(th), sz = Math.sin(th), y = r[3] + cy * r[1] * (cy < 0 ? 0.86 : 1), z = sz * r[2]; pos.push(r[0], y, z);
        const line = -0.012 + Math.sin(r[0] * 21) * 0.012, u = clamp((y - r[3] - line) / (r[1] * 0.35 + 0.004), -1, 1); c.copy(white).lerp(grey, clamp(u * 0.5 + 0.5, 0, 1)); if (cy > 0.75) c.lerp(dark, (cy - 0.75) * 2.2); col.push(c.r, c.g, c.b); } });
    for (let a = 0; a < R2.length - 1; a++) for (let q = 0; q < n; q++) { const p = a * (n + 1) + q, r = p + n + 1; idx.push(p, p + 1, r, r, p + 1, r + 1); }
    const bg = new T.BufferGeometry(); bg.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); bg.setAttribute('color', new T.Float32BufferAttribute(col, 3)); bg.setAttribute('uv', new T.Float32BufferAttribute(new Float32Array(pos.length / 3 * 2), 2)); bg.setIndex(idx); parts.push(bg.toNonIndexed()); }
  // a fin from its outline (points [along, out]), a thin blade
  const fin = (pts, col, place) => { const sh = new T.Shape(); sh.moveTo(pts[0][0], pts[0][1]); for (let q = 1; q < pts.length; q++) { const p = pts[q]; if (p.length === 4) sh.quadraticCurveTo(p[0], p[1], p[2], p[3]); else sh.lineTo(p[0], p[1]); } const ge = new T.ExtrudeGeometry(sh, { depth: 0.012, bevelEnabled: false, curveSegments: 8 }); ge.translate(0, 0, -0.006); place(ge); return flat(ge, col); };
  parts.push(fin([[0.1, 0], [0.02, 0.2, -0.07, 0.235], [-0.075, 0.17, -0.06, 0.06], [-0.1, 0]], dark, ge => ge.translate(0.04, 0.115, 0)));      // the fin on his back
  parts.push(fin([[0.04, 0], [0.0, 0.05, -0.04, 0.06], [-0.045, 0]], dark, ge => ge.translate(-0.27, 0.085, 0)));      // the little second one
  for (const sz of [-1, 1]) { parts.push(fin([[0.1, 0], [0.03, 0.2, -0.13, 0.3], [-0.1, 0.16, -0.03, 0.04], [-0.06, 0]], grey, ge => { ge.rotateX(Math.PI / 2 * sz); ge.rotateX(-sz * 0.42); ge.translate(0.17, -0.03, sz * 0.105); }));      // the long side fins
    parts.push(fin([[0.04, 0], [0.0, 0.07, -0.05, 0.08], [-0.05, 0]], grey, ge => { ge.rotateX(Math.PI / 2 * sz); ge.rotateX(-sz * 0.6); ge.translate(-0.2, -0.05, sz * 0.06); }));
    const eye = new T.SphereGeometry(0.016, 8, 6); eye.translate(0.385, 0.03, sz * 0.078); parts.push(flat(eye, new T.Color(0x05070a)));
    for (let q = 0; q < 5; q++) { const gl = new T.BoxGeometry(0.004, 0.075 - q * 0.004, 0.004); gl.rotateZ(-0.25); gl.translate(0.265 - q * 0.022, 0.0, sz * (0.113 + q * 0.0035)); parts.push(flat(gl, new T.Color(0x2a3644))); } }
  const bodyG = T.mergeGeometries(parts); bodyG.computeVertexNormals(); const bm = new T.Mesh(bodyG, M); g.add(bm);
  // the tail: a crescent, the upper lobe the longer
  const tail = new T.Group(); tail.position.set(-0.45, 0.016, 0); g.add(tail);
  const tg = [fin([[0.03, 0.02], [-0.02, 0.14, -0.17, 0.27], [-0.1, 0.12, -0.06, 0.0], [-0.09, -0.08, -0.13, -0.17], [-0.02, -0.1, 0.03, -0.02]], grey, ge => 0)];
  const tm = new T.Mesh(T.mergeGeometries(tg), M); tm.geometry.computeVertexNormals(); tail.add(tm);
  // the jaw: white underneath, a row of teeth; the red mouth behind it shows when it drops
  const jaw = new T.Group(); jaw.position.set(0.28, -0.045, 0); g.add(jaw); const jp = []; { const jg = new T.SphereGeometry(0.1, 12, 6, 0, TAU, Math.PI / 2, Math.PI / 2); jg.scale(1.5, 0.42, 0.78); jg.translate(0.07, 0, 0); jp.push(flat(jg, white));
    for (let q = 0; q < 9; q++) { const a = (q / 8 - 0.5) * 2.2, th = new T.ConeGeometry(0.008, 0.026, 4); th.translate(0.07 + Math.cos(a) * 0.13, 0.012, Math.sin(a) * 0.07); jp.push(flat(th, new T.Color(0xffffff))); } }
  const jm = new T.Mesh(T.mergeGeometries(jp), M); jm.geometry.computeVertexNormals(); jaw.add(jm);
  const mouth = new T.Mesh(new T.SphereGeometry(0.07, 10, 6), new T.MeshBasicMaterial({ color: 0x7a1a24 })); mouth.scale.set(1.3, 0.3, 0.72); mouth.position.set(0.35, -0.045, 0); g.add(mouth);
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
  const spot = q => SPOTS0.find(o => o.k === q), near = (q, x, z, soft = 6) => { const o = spot(q); return clamp((o.r + soft * 0.4 - Math.hypot(x - o.x, z - o.z)) / soft, 0, 1); }, sm = u => u * u * (3 - 2 * u);
  const hgt = (x, z) => { const r = Math.hypot(x, z); return FLOOR + Math.sin(x * 0.11) * Math.cos(z * 0.09) * 0.9 + Math.sin(x * 0.37 + z * 0.21) * 0.25 + Math.max(0, r - R_BAY - 2) * 0.55 - sm(near('deep', x, z, 9)) * 4.2; };      /* the drop: a hollow in the floor */
  const sandMap = W3.grainTex(256, 8, 205, 40, 6); sandMap.repeat.set(26, 26);
  const floor = W3.terrain({ size: 200, seg: 120, height: hgt, colour: (x, z, h) => { const r = Math.hypot(x, z), u = clamp((r - R_BAY) / 10, 0, 1); let c = [0.62 - u * 0.3, 0.6 - u * 0.3, 0.5 - u * 0.2];
      const mix = (w, t) => { c = [c[0] + (t[0] - c[0]) * w, c[1] + (t[1] - c[1]) * w, c[2] + (t[2] - c[2]) * w]; };      /* each place colours its own sand, so it is seen from far off */
      mix(sm(near('deep', x, z, 9)) * 0.9, [0.05, 0.1, 0.2]); mix(sm(near('jelly', x, z)) * 0.55, [0.62, 0.36, 0.78]); mix(sm(near('kelp', x, z)) * 0.6, [0.18, 0.34, 0.16]); mix(sm(near('wreck', x, z)) * 0.4, [0.36, 0.3, 0.24]); mix(sm(near('reef', x, z)) * 0.3, [0.86, 0.66, 0.5]); return c; }, map: sandMap });
  const caus = causticTex(); caus.repeat.set(26, 26); const caus2 = caus.clone(); caus2.needsUpdate = true; caus2.repeat.set(19, 19);
  const cm = (t, o) => new T.MeshBasicMaterial({ map: t, transparent: true, opacity: o, blending: T.AdditiveBlending, depthWrite: false, fog: true });
  const cg = floor.geometry.clone(); const cMesh1 = new T.Mesh(cg, cm(caus, 0.16)), cMesh2 = new T.Mesh(cg, cm(caus2, 0.1)); cMesh1.position.y = 0.04; cMesh2.position.y = 0.06; S.add(cMesh1, cMesh2);
  // the reef walls: big rocks in a ring, tall enough to be seen from above
  const rockM = new T.MeshStandardMaterial({ color: 0x6a6a62, roughness: 0.95, flatShading: true }), wall = new T.InstancedMesh(new T.DodecahedronGeometry(1, 1), rockM, 150), d = new T.Object3D(), col = new T.Color();
  for (let i = 0; i < 150; i++) { const a = i / 150 * TAU + R0() * 0.05, r = R_BAY + 3 + R0() * 8, s = 4.5 + R0() * 6; d.position.set(Math.cos(a) * r, FLOOR + s * 0.3 + R0() * 2, Math.sin(a) * r); d.rotation.set(R0() * 3, R0() * 3, R0() * 3); d.scale.set(s, s * (0.8 + R0() * 1.1), s); d.updateMatrix(); wall.setMatrixAt(i, d.matrix); wall.setColorAt(i, col.setHSL(0.08 + R0() * 0.05, 0.12, 0.3 + R0() * 0.2)); } S.add(wall);
  // coral and rocks on the floor
  const coralCols = [0xc85a62, 0xd08a52, 0x9a6ab8, 0xc8b05a, 0x5aa8a0, 0xc86a9a];
  const coralA = new T.InstancedMesh(new T.IcosahedronGeometry(0.6, 3), new T.MeshStandardMaterial({ roughness: 0.85, bumpMap: W3.grainTex(128, 5, 128, 120, 3), bumpScale: 2.5 }), 110), coralB = new T.InstancedMesh(new T.ConeGeometry(0.25, 1.6, 6), new T.MeshStandardMaterial({ roughness: 0.7 }), 110);
  const stones = new T.InstancedMesh(new T.DodecahedronGeometry(0.6, 0), rockM, 30);
  const place = [], put = (m, i, x, z, s, sy, c) => { d.position.set(x, hgt(x, z) + s * 0.3, z); d.rotation.set(R0() * 0.4, R0() * 6, R0() * 0.4); d.scale.set(s, s * (sy || 1), s); d.updateMatrix(); m.setMatrixAt(i, d.matrix); if (c != null) m.setColorAt(i, col.setHex(c)); };
  const scat = (R, core = 0.6) => { const a = R() * TAU, inC = R() < core, r = inC ? Math.sqrt(R()) * 16 : 10 + Math.sqrt(R()) * (R_BAY - 13); let x = Math.cos(a) * r, z = Math.sin(a) * r; const dp = spot('deep'); if (Math.hypot(x - dp.x, z - dp.z) < dp.r) { x = -x; z = -z; } return [x, z]; };      /* (nothing grows in the drop) */
  for (let i = 0; i < 110; i++) { const [x, z] = scat(R0), a = R0() * TAU, c = coralCols[(R0() * coralCols.length) | 0]; put(coralA, i, x, z, 0.3 + R0() * 0.7, 0.45, c); const a2 = a + 0.3 * R0(); put(coralB, i, x + Math.cos(a2) * 1.2, z + Math.sin(a2) * 1.2, 0.5 + R0() * 0.9, 1, coralCols[(R0() * coralCols.length) | 0]); }
  for (let i = 0; i < 30; i++) { const a = R0() * TAU, r = Math.sqrt(R0()) * R_BAY; put(stones, i, Math.cos(a) * r, Math.sin(a) * r, 0.6 + R0() * 1.6, 0.6, null); }
  S.add(coralA, coralB, stones);
  // 25 Nov 2026 ("improve the graphics"): the reef was balls and cones. Added: staghorn coral (a bush of branches), sea fans (flat lace fans that
  // stand up), tube sponges, anemones (a mop of tentacles), starfish on the sand, each in its own colours
  { const merge = gs => { const g = T.mergeGeometries(gs); g.computeVertexNormals(); return g; }, R1 = W3.rng(351);
    const stag = []; for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + R1(), tl = 0.5 + R1() * 0.5, br = new T.CylinderGeometry(0.035, 0.07, tl, 5); br.translate(0, tl / 2, 0); br.rotateZ(0.35 + R1() * 0.55); br.rotateY(a); stag.push(br); const tw = new T.CylinderGeometry(0.02, 0.035, tl * 0.5, 4); tw.translate(0, tl * 0.25, 0); tw.rotateZ(-0.5); tw.translate(0, tl * 0.62, 0); tw.rotateZ(0.35 + R1() * 0.5); tw.rotateY(a); stag.push(tw); }
    const tube = []; for (let i = 0; i < 5; i++) { const hgt2 = 0.5 + R1() * 0.7, tb = new T.CylinderGeometry(0.13, 0.09, hgt2, 8, 1, true); tb.translate((R1() - 0.5) * 0.4, hgt2 / 2, (R1() - 0.5) * 0.4); tube.push(tb); }
    const anem = []; for (let i = 0; i < 22; i++) { const a = R1() * TAU, tl = 0.35 + R1() * 0.25, tn = new T.CylinderGeometry(0.012, 0.03, tl, 4); tn.translate(0, tl / 2, 0); tn.rotateZ(0.2 + R1() * 0.75); tn.rotateY(a); tn.translate(0, 0.08, 0); anem.push(tn); } { const b = new T.SphereGeometry(0.2, 10, 6, 0, TAU, 0, Math.PI / 2); b.scale(1, 0.6, 1); anem.push(b); }
    const star = new T.Shape(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, r = i % 2 ? 0.14 : 0.36; i ? star.lineTo(Math.cos(a) * r, Math.sin(a) * r) : star.moveTo(Math.cos(a) * r, Math.sin(a) * r); } const starG = new T.ExtrudeGeometry(star, { depth: 0.05, bevelEnabled: false }); starG.rotateX(-Math.PI / 2);
    const fanT = (() => { const c2 = document.createElement('canvas'); c2.width = c2.height = 128; const x2 = c2.getContext('2d'); x2.strokeStyle = '#fff'; x2.lineCap = 'round'; const br = (x, y, a, l, w, d) => { if (d > 5 || l < 4) return; const x1 = x + Math.cos(a) * l, y1 = y + Math.sin(a) * l; x2.lineWidth = w; x2.beginPath(); x2.moveTo(x, y); x2.lineTo(x1, y1); x2.stroke(); br(x1, y1, a - 0.32 - R1() * 0.2, l * 0.78, w * 0.72, d + 1); br(x1, y1, a + 0.32 + R1() * 0.2, l * 0.78, w * 0.72, d + 1); }; br(64, 126, -Math.PI / 2, 30, 5, 0); const tx = new T.CanvasTexture(c2); tx.colorSpace = T.SRGBColorSpace; return tx; })();
    const fanG = new T.PlaneGeometry(1.6, 1.6); fanG.translate(0, 0.8, 0);
    const sets = [[merge(stag), new T.MeshStandardMaterial({ roughness: 0.75 }), 70, [0xf2e6c8, 0xe8a070, 0xd87a9a, 0x8ad0c0, 0xf0c060], 0.8, 1.6], [merge(tube), new T.MeshStandardMaterial({ roughness: 0.8, side: T.DoubleSide }), 40, [0xe8b030, 0xd05a8a, 0x8a5ad0, 0xe07030], 0.7, 1.5],
      [merge(anem), new T.MeshStandardMaterial({ roughness: 0.6 }), 45, [0xf06a8a, 0xb07af0, 0x60d0b0, 0xf0a040], 0.7, 1.3], [starG, new T.MeshStandardMaterial({ roughness: 0.8 }), 30, [0xe8603a, 0xf0a030, 0xb04a8a], 0.5, 1.0],
      [fanG, new T.MeshStandardMaterial({ map: fanT, alphaMap: fanT, transparent: true, alphaTest: 0.35, side: T.DoubleSide, roughness: 0.8 }), 45, [0xc060d0, 0xf07048, 0xf0b040, 0xe04a7a], 0.8, 2.0]];
    const lift = mt => { mt.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n #ifdef USE_COLOR\n totalEmissiveRadiance += vColor.rgb * 0.3;\n #endif'); }; }; lift(coralA.material); lift(coralB.material);
    V3deco = []; for (const [geo, mat, n, cols, s0, s1] of sets) { lift(mat); const im = new T.InstancedMesh(geo, mat, n); for (let i = 0; i < n; i++) { const [x, z] = scat(R1, 0.55), sc = s0 + R1() * (s1 - s0); d.position.set(x, hgt(x, z) - 0.02, z); d.rotation.set(0, R1() * TAU, 0); d.scale.setScalar(sc); d.updateMatrix(); im.setMatrixAt(i, d.matrix); im.setColorAt(i, col.setHex(cols[(R1() * cols.length) | 0])); } S.add(im); V3deco.push(im); } }
  // kelp: tall ribbons that sway (the forest has many)
  const kelpG = new T.PlaneGeometry(0.5, 1, 1, 6); kelpG.translate(0, 0.5, 0); const kelpM = new T.MeshStandardMaterial({ color: 0x4a7a2a, emissive: 0x1c3a10, roughness: 0.8, side: T.DoubleSide, transparent: true, opacity: 0.92 });
  const kelp = new T.InstancedMesh(kelpG, kelpM, 220), kelpL = []; for (let i = 0; i < 220; i++) { const kb = spot('kelp'), a = R0() * TAU, inK = i < 170, r = inK ? Math.sqrt(R0()) * (kb.r + 2) : 6 + Math.sqrt(R0()) * (R_BAY - 8), x = (inK ? kb.x : 0) + Math.cos(a) * r, z = (inK ? kb.z : 0) + Math.sin(a) * r; kelpL.push({ x, z, y: hgt(x, z), h: 5 + R0() * 7, ph: R0() * 6, rot: R0() * 6 }); } S.add(kelp);
  // THE PLACES (25 Nov 2026: "make the field of play bigger... more challenging and engaging"): the wreck, the jelly garden's sea whips, the rocks
  // round the drop, and a treasure chest at each of the three
  const chests = {}, M2 = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.85, flatShading: true }, o || {}));
  { const w = spot('wreck'), g = new T.Group(), wood = M2(0xa8743c, { emissive: 0x3a240e, emissiveIntensity: 0.9 }), dark = M2(0x6a4624, { emissive: 0x24160a, emissiveIntensity: 0.9 }), deck = M2(0xc89a5c, { emissive: 0x40280e, emissiveIntensity: 0.8 });
    const half = (len, bow) => { const h2 = new T.Group(), body = new T.Mesh(new T.CylinderGeometry(1.5, 1.2, len, 7, 1, false, 0, Math.PI), wood); body.rotation.z = Math.PI / 2; body.rotation.y = 0; body.scale.set(1, 1, 1.05); h2.add(body);
      const dk = new T.Mesh(new T.BoxGeometry(len, 0.14, 2.7), deck); dk.position.y = 0.02; h2.add(dk); for (let i = 0; i < 4; i++) { const pl = new T.Mesh(new T.BoxGeometry(0.08, 0.16, 2.72), dark); pl.position.set(-len / 2 + (i + 0.5) * len / 4, 0.03, 0); h2.add(pl); }
      if (bow) { const b2 = new T.Mesh(new T.ConeGeometry(1.45, 2.6, 7, 1, false, 0, Math.PI), wood); b2.rotation.z = -Math.PI / 2; b2.position.x = len / 2 + 1.3; h2.add(b2); } else { const st = new T.Mesh(new T.BoxGeometry(0.5, 1.5, 2.6), dark); st.position.set(-len / 2 - 0.1, 0.6, 0); h2.add(st); const cab = new T.Mesh(new T.BoxGeometry(2.2, 1.1, 2.0), wood); cab.position.set(-len / 2 + 1.3, 0.6, 0); h2.add(cab); }
      return h2; };
    const a2 = half(6, true); a2.position.set(3.9, 1.0, 0.3); a2.rotation.set(0.5, 0.12, 0.1); const b2 = half(5, false); b2.position.set(-3.4, 0.9, -0.4); b2.rotation.set(-0.35, -0.2, -0.08); g.add(a2, b2);
    for (let i = 0; i < 5; i++) { const rb = new T.Mesh(new T.TorusGeometry(1.25, 0.09, 5, 10, Math.PI), dark); rb.position.set(-0.9 + i * 0.5, 0.2, 0); rb.rotation.set(0.2 * (i - 2), Math.PI / 2, 0); g.add(rb); }
    const mast = new T.Mesh(new T.CylinderGeometry(0.13, 0.2, 9, 6), dark); mast.position.set(1.5, 0.5, 3.6); mast.rotation.set(Math.PI / 2 - 0.12, 0, 0.9); g.add(mast);
    const sail = new T.Mesh(new T.PlaneGeometry(3.4, 2.2, 3, 2), new T.MeshStandardMaterial({ color: 0xd8d0b8, roughness: 1, side: T.DoubleSide, transparent: true, opacity: 0.85 })); sail.position.set(2.6, 0.5, 4.6); sail.rotation.set(-Math.PI / 2 + 0.2, 0, 0.9); g.add(sail);
    g.position.set(w.x, hgt(w.x, w.z) - 0.25, w.z); g.rotation.y = 0.55; g.scale.setScalar(1.25); S.add(g); }
  { const jg = spot('jelly'), whip = new T.InstancedMesh(new T.ConeGeometry(0.28, 2.6, 6), new T.MeshStandardMaterial({ roughness: 0.6, emissive: 0x7030a0, emissiveIntensity: 0.5 }), 46); for (let i = 0; i < 46; i++) { const a = R0() * TAU, r = (i < 30 ? 0.75 + R0() * 0.35 : R0() * 0.7) * jg.r, x = jg.x + Math.cos(a) * r, z = jg.z + Math.sin(a) * r, sc = 0.6 + R0() * 1.1; d.position.set(x, hgt(x, z) + 1.2 * sc, z); d.rotation.set((R0() - 0.5) * 0.3, R0() * 6, (R0() - 0.5) * 0.3); d.scale.set(sc * 0.8, sc, sc * 0.8); d.updateMatrix(); whip.setMatrixAt(i, d.matrix); whip.setColorAt(i, col.setHex([0xe070ff, 0xff7ac8, 0xa070ff, 0xff9ae0][i % 4])); } S.add(whip); }
  { const dp = spot('deep'), rim = new T.InstancedMesh(new T.DodecahedronGeometry(1, 0), rockM, 26); for (let i = 0; i < 26; i++) { const a = i / 26 * TAU + R0() * 0.2, r = dp.r * (0.95 + R0() * 0.2), x = dp.x + Math.cos(a) * r, z = dp.z + Math.sin(a) * r, sc = 1.2 + R0() * 2.2; d.position.set(x, hgt(x, z) + sc * 0.35, z); d.rotation.set(R0() * 3, R0() * 3, R0() * 3); d.scale.set(sc, sc * (0.7 + R0() * 0.8), sc); d.updateMatrix(); rim.setMatrixAt(i, d.matrix); rim.setColorAt(i, col.setHSL(0.6, 0.15, 0.22 + R0() * 0.15)); } S.add(rim); }
  for (const q of SPOTS0) { if (q.cx == null) continue; const g = new T.Group(), x = q.x + q.cx, z = q.z + q.cz, gold = new T.MeshStandardMaterial({ color: 0xffc830, emissive: 0xc88a10, emissiveIntensity: 0.7, roughness: 0.35, metalness: 0.6 });
    const base = new T.Mesh(new T.BoxGeometry(1.3, 0.7, 0.85), M2(0xa06a30, { emissive: 0x4a2a0c, emissiveIntensity: 0.9 })); base.position.y = 0.35; const lid = new T.Mesh(new T.CylinderGeometry(0.43, 0.43, 1.32, 8, 1, false, 0, Math.PI), M2(0xb47a38, { emissive: 0x4a2a0c, emissiveIntensity: 0.9 })); lid.rotation.z = Math.PI / 2; lid.rotation.y = 0; lid.position.set(0, 0.72, -0.2); lid.rotation.x = -0.9;
    const pile = new T.Mesh(new T.SphereGeometry(0.5, 10, 6, 0, TAU, 0, Math.PI / 2), gold); pile.scale.set(1.15, 0.6, 0.75); pile.position.y = 0.66; g.add(base, lid, pile); for (const sx of [-0.42, 0.42]) { const bd = new T.Mesh(new T.BoxGeometry(0.12, 0.74, 0.9), gold); bd.position.set(sx, 0.36, 0); g.add(bd); }
    const halo = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: null, color: 0xffd040, transparent: true, opacity: 0.5, blending: T.AdditiveBlending, depthWrite: false })); halo.rotation.x = -Math.PI / 2; halo.position.y = 1.4; g.add(halo);
    g.position.set(x, hgt(x, z), z); g.rotation.y = R0() * 6; g.scale.setScalar(1.5); S.add(g); chests[q.k] = { g, halo }; }
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
  for (const q in chests) chests[q].halo.material.map = glowT;
  V3 = { T, S, chests, floor, cMesh1, cMesh2, caus, caus2, kelp, kelpL, kelpM, coralA, rays, snow, inst, shark, goldGlow, lamp, place: -1, sandM: floor.material, rockM };
  W3.setQuality(stepN); return V3;
}
const SV = new (window.THREE ? THREE.Vector3 : Object)();
function scr(x, y, z) { if (!V3 || V3.none) return { x: W / 2 + (x - ui.cam.x) * W / ui.cam.span, y: H * 0.5 + (z - ui.cam.z) * W / ui.cam.span, front: true }; SV.set(x, y, z); return W3.screen(SV); }
const TILT = 58 * Math.PI / 180;
function placeCam(g, dt) {
  const cam = W3.cam, asp = innerWidth / innerHeight, m = g.me, span = viewOf(g) * (g.frenzy > 0 ? 1.08 : 1), c = ui.cam;
  if (ui.snap) { c.x = m.x; c.z = m.z; c.span = span; ui.snap = false; }
  const e = 1 - Math.exp(-dt * 3.5); c.x += (m.x + m.vx * 0.25 - c.x) * e; c.z += (m.z + m.vz * 0.25 - c.z) * e; c.span += (span - c.span) * (1 - Math.exp(-dt * 1.6));
  cam.fov = 50; cam.aspect = asp; cam.updateProjectionMatrix(); const dist = c.span / (2 * Math.tan(25 * Math.PI / 180) * Math.min(asp, 1));
  const sh = FX.shake ? (Math.random() - 0.5) * FX.shake * 0.02 : 0;
  cam.position.set(c.x + sh, Math.sin(TILT) * dist, c.z + Math.cos(TILT) * dist); cam.lookAt(c.x, 0, c.z - dist * 0.02); cam.updateMatrixWorld();
  const f = W3.scene.fog; f.near = dist * 1.0; f.far = dist * 2.8 + 18; return dist;
}
// ---------- events ----------
function onEvent(G, e) {
  const m = G.me, sp = scr(m.x, 0, m.z), cx = W / 2;
  switch (e.k) {
    case 'start': say(PLACES[G.place].name.toUpperCase(), cx, H * 0.3, '#bfe8ff', 24); say(`GROW TO SIZE ${G.cfg.goal}, EAT THE BIG ONE`, cx, H * 0.36, '#ffe08a', 22); sfx.ding(); if (G.N <= 2) tip('drag', 'Put your thumb down anywhere and drag: the shark swims that way', 3.2); break;
    case 'eat': { const p = scr(e.x, 0, e.z); ui.combo = e.frenzy ? (ui.combo | 0) + 1 : e.chain; ui.comboT = 1.6; ui.pop = Math.min(0.3, (ui.pop || 0) + 0.12 + e.val * 0.02); burst(p.x, p.y, hex(SPECIES[e.kind].col), e.val > 2 ? 18 : 10); burst(p.x, p.y, '#ffffff', 4); burst(p.x, p.y, '#c0202a', 5, 60); sfx.bite(ui.combo, e.val >= 4); vibe(e.val >= 4 ? HAP.thud : HAP.light);
      if (e.gold) { sfx.gold(); say('GOLDEN! +3', p.x, p.y - 30 * k, '#ffd040', 28); burst(p.x, p.y, '#ffd040', 24, 200); FX.flash = 0.35; }
      else say('+' + e.val * (e.frenzy ? 2 : 1), p.x, p.y - 24 * k, e.frenzy ? '#ffb83a' : '#bff5c8', 18 + Math.min(10, e.val * 2));
      if (e.wasHunter) say('THE HUNTER IS LUNCH!', cx, H * 0.3, '#ffe08a', 24);
      if (e.isNew && !G.lesson) { ui.toast = { txt: `NEW FOR YOUR AQUARIUM: ${SPECIES[e.kind].name.toUpperCase()}`, kind: e.kind, t: 0 }; sfx.newkind(); }
      if (e.val >= 4) FX.stop = 0.04; break; }
    case 'grow': FX.flash = 0.7; say(`BIGGER! SIZE ${e.tier + 1}`, cx, H * 0.32, '#ffe08a', 34); sfx.grow(e.tier); vibe(HAP.best); bubbles(sp.x, sp.y, 18);
      if (e.tier + 1 === G.cfg.goal - 1) tip('last', `One more size and you win! (size ${G.cfg.goal})`, 2.6); else if (e.tier >= 1) tip('turn', 'Some fish that were red are green now: eat them!', 3); break;
    case 'notice': sfx.growl(); vibe(HAP.light); tip('hunter', 'A hunter has seen you! Drag your thumb far to dash away', 3); break;
    case 'hunt': sfx.hunt(); FX.red = Math.max(FX.red, 0.35); break;
    case 'escaped': say('GOT AWAY!', sp.x, sp.y - 44 * k, '#9be3ff', 22); sfx.escaped(); break;
    case 'caught': sfx.caught(); FX.red = 1; FX.shake = 8; break;      // no buzz on a loss (P11)
    case 'bitten': sfx.caught(); FX.red = 0.9; FX.shake = 7; FX.stop = 0.07; vibe(HAP.thud); say('BITTEN!', sp.x, sp.y - 50 * k, '#ff8a7a', 26); burst(sp.x, sp.y, '#c0202a', 22, 170); bubbles(sp.x, sp.y, 10); break;
    case 'frenzy': sfx.frenzy(); FX.flash = 0.8; vibe(HAP.best); say('FEEDING FRENZY!', cx, H * 0.3, '#ffb83a', 36); say('EVERYTHING COUNTS DOUBLE', cx, H * 0.36, '#ffe08a', 18); ui.combo = 0; break;
    case 'frenzyend': sfx.ding(); break;
    case 'found': say(SPOT[e.spot].name, cx, H * 0.3, SPOT[e.spot].col, 30); say('A NEW PLACE  +2 🪙', cx, H * 0.36, '#ffe08a', 16); sfx.ding(); vibe(HAP.light); break;
    case 'fishedout': say('FISHED OUT', cx, H * 0.3, '#ffd0a0', 26); sfx.ding(); break;
    case 'chest': { const p = scr(e.x, 0, e.z); burst(p.x, p.y, '#ffd040', 30, 190); burst(p.x, p.y, '#ffffff', 10, 120); bubbles(p.x, p.y, 14); say(`TREASURE! ${e.n} OF 3`, cx, H * 0.3, '#ffd040', 30); sfx.coin(4); if (sfx.gold) sfx.gold(); FX.flash = 0.5; vibe(HAP.best); break; }
    case 'treasure': say('ALL THE TREASURE!', cx, H * 0.24, '#ffd040', 26); break;
    case 'sting': sfx.sting(); say('OUCH! JELLYFISH', sp.x, sp.y - 40 * k, '#f0a0ff', 20); FX.shake = 3; tip('jelly', 'Jellyfish sting and slow you: swim round them', 2.8); break;
    case 'spike': sfx.spike(); say('SPIKY!', sp.x, sp.y - 40 * k, '#e8d070', 18); tip('puffer', 'Pufferfish puff up when you come near: dash at them to catch one before it puffs', 3.2); break;
    case 'lessonnext': if (e.first) hint = null; say('FIRST, A LESSON', cx, H * 0.36, '#ffe08a', 26); sfx.ding(); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, cx, H * 0.4, '#9be3b5', 24); sfx.coin(e.n); break;
    case 'lessonmiss': coachMiss(); break;
    case 'lessondone': say('NOW THE REAL HUNT!', cx, H * 0.36, '#ffe08a', 26); sfx.win(); ui.snap = true; if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'ready': FX.flash = 0.6; sfx.ding(); vibe(HAP.best); say('BIG ENOUGH!', cx, H * 0.3, '#ffe08a', 34); say(e.spot && SPOT[e.spot] ? `THE BIG ONE 👑 · ${SPOT[e.spot].name}` : 'THE BIG ONE 👑', cx, H * 0.37, '#ffd040', 22); break;
    case 'met': FX.flash = Math.max(FX.flash || 0, 0.3); sfx.ding(); vibe(HAP.tap || 12); say('THE BIG ONE! 👑', cx, H * 0.3, '#ffd040', 30); break;
    case 'won': sfx.win(); vibe(HAP.best); say('GOT THE BIG ONE!', cx, H * 0.3, '#ffe08a', 36); break;
    case 'lost': sfx.lose(); say(e.why === 'starved' ? 'TOO HUNGRY...' : 'EATEN!', cx, H * 0.3, '#ffb4a8', 32); break;
  }
}
// ---------- every frame in 3D ----------
const DUMMY = new (window.THREE ? THREE.Object3D : Object)(); let V3deco = [];
function animate(g, t, dt) {
  const V = V3, m = g.me, s = sizeOf(g), P = PLACES[g.place];
  // the shark: swims with a beating tail, banks into turns, opens its jaws to bite
  const sh = V.shark, u = sh.userData, sp = Math.hypot(m.vx, m.vz); sh.position.set(m.x, Math.sin(t * 1.3) * 0.08, m.z); sh.rotation.set(-(m.turn || 0) * 0.5, -m.face, 0, 'YXZ');
  ui.sharkS = (ui.sharkS || s) + (s - (ui.sharkS || s)) * (1 - Math.exp(-dt * 5)); ui.pop = Math.max(0, (ui.pop || 0) - dt * 1.6); sh.scale.setScalar(ui.sharkS * (1 + ui.pop * 0.9));      /* every bite: he swells, then settles a little longer than before */
  sh.visible = !(m.inv > 0) || Math.sin(t * 34) > -0.3;
  ui.tailPh = (ui.tailPh || 0) + dt * (5 + sp * 1.8 / Math.sqrt(s)); u.tail.rotation.y = Math.sin(ui.tailPh) * (0.35 + (m.dashing ? 0.2 : 0)); u.jaw.rotation.z = -(m.mouth > 0 ? Math.sin(m.mouth / 0.25 * Math.PI) * 0.6 : 0.05);
  u.M.emissive.setHex(m.stung > 0 ? 0x803060 : g.frenzy > 0 ? 0x6a3200 : m.hunger <= 0 ? 0x401010 : 0x000000);
  // the fish, kind by kind
  for (const q in V.inst) V.inst[q].count = 0; V.goldGlow.count = 0;
  if (V.chests) for (const q of (g.spots || [])) { const c = V.chests[q.k]; if (!c) continue; c.g.visible = !!(q.chest && !q.chest.got) && !g.lesson; const z = 2.6 + Math.sin(t * 3 + q.x) * 0.5; c.halo.scale.set(z, z, 1); c.halo.material.opacity = 0.4 + 0.2 * Math.sin(t * 3 + q.x); }
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
  V.sandM.color.set(P.sand).multiplyScalar(1.2); V.cMesh1.material.opacity = p === 3 ? 0.03 : 0.16; V.cMesh2.material.opacity = p === 3 ? 0.02 : 0.1; V.kelpM.color.set(p === 1 ? 0x5a8a2a : 0x4a6a3a); V.coralA.visible = p !== 3; for (const im of V3deco) im.visible = p !== 3; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#04202e'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D sea.', W / 2, H / 2); return; }
  const g = G || idleG(), t = now;
  if (V.place !== g.place) setPlace(V, g.place);
  placeCam(g, dt); animate(g, t, dt); W3.setFocus(ui.cam.x, 0, ui.cam.z, ui.cam.span); W3.render(dt);
  if (G) { const m = G.me; if (m.dashing && !ui.dashWas) { sfx.dash(); const p = scr(m.x, 0, m.z); bubbles(p.x, p.y, 8); } ui.dashWas = m.dashing; if (m.dashing && Math.random() < dt * 10) { const p = scr(m.x - Math.cos(m.face) * sizeOf(G) * 0.5, 0, m.z - Math.sin(m.face) * sizeOf(G) * 0.5); bubbles(p.x, p.y, 1); }
    rings(G, t); hud(G, t); }
  for (const p of PARTS) { const al = Math.max(0, 1 - p.t / p.life); ctx.globalAlpha = al; if (p.col === 'bub') { ctx.strokeStyle = 'rgba(220,245,255,.8)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.stroke(); } else { ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 1.1 ? 1 : 1 - (t2.t - 1.1) / 0.4; ctx.globalAlpha = Math.max(0, al); const sc = t2.t < 0.12 ? 1.35 - t2.t / 0.12 * 0.35 : 1; ctx.font = `400 ${Math.round(t2.size * k * sc)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(2,16,26,.65)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 22); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 22); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30;
    ctx.fillStyle = 'rgba(4,24,36,.86)'; rrect(W / 2 - w / 2, H * 0.62 - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.62 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (G && G.me.hunger < 0.2 && !G.over) { const a = (0.2 - G.me.hunger) / 0.2 * (0.5 + 0.5 * Math.sin(t * 6)); const gr = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75); gr.addColorStop(0, 'rgba(120,0,0,0)'); gr.addColorStop(1, `rgba(120,0,0,${0.5 * a})`); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); }
  if (G && G.frenzy > 0 && !G.over) { const a = Math.min(1, G.frenzy / 0.6) * (0.75 + 0.25 * Math.sin(t * 9)), gr = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.72); gr.addColorStop(0, 'rgba(255,150,30,0)'); gr.addColorStop(1, `rgba(255,150,30,${0.42 * a})`); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,30,30,${FX.red * 0.16})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(230,250,255,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); }
}
// ---------- the 2D layer ----------
// green rings on what you can eat, red on what can eat you (pulsing when it is coming), a gold sparkle on the golden fish;
// a red mark at the edge of the screen for a hunter you cannot see that is near or coming
function rings(G, t) {
  const m = G.me, c = ui.cam, sense = G.cfg.sense;
  for (const f of G.fish) { const d = Math.hypot(f.x - m.x, f.z - m.z);
    if (f.prize) { const p = scr(f.x, 0, f.z), r = Math.max(10 * k, f.size * W / c.span * 0.6), on = p.x > 12 && p.x < W - 12 && p.y > 70 * k && p.y < H - 12;      // the big one: two gold rings and a crown; a gold arrow at the screen's edge when it is out of sight
      if (on) { ctx.strokeStyle = `rgba(255,208,64,${0.75 + 0.25 * Math.sin(t * 9)})`; ctx.lineWidth = 3 * k; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.stroke(); ctx.lineWidth = 1.5 * k; ctx.beginPath(); ctx.arc(p.x, p.y, r + 6 * k + 3 * k * Math.sin(t * 9), 0, TAU); ctx.stroke(); ctx.font = `${Math.round(18 * k)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('👑', p.x, p.y - r - 12 * k); }
      else { const cx = W / 2, cy = H / 2, dx = p.x - cx, dy = p.y - cy, s2 = Math.min((W / 2 - 24 * k) / Math.abs(dx || 1e-6), (H / 2 - 34 * k) / Math.abs(dy || 1e-6)), x = cx + dx * s2, y = cy + dy * s2, z = (1.25 + 0.15 * Math.sin(t * 10)) * k; ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(dy, dx)); ctx.fillStyle = '#ffd040'; ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(18 * z, 0); ctx.lineTo(-9 * z, -13 * z); ctx.lineTo(-9 * z, 13 * z); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); ctx.font = `${Math.round(15 * k)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('👑', x - dx / Math.hypot(dx, dy) * 26 * k, y - dy / Math.hypot(dx, dy) * 26 * k); }
      continue; }
    if (d > c.span * 1.3 && !(danger(G, f) && f.state !== 'calm')) continue; const p = scr(f.x, 0, f.z), r = Math.max(6 * k, f.size * W / c.span * 0.55);
    const on = p.x > -10 && p.x < W + 10 && p.y > -10 && p.y < H + 10;
    if (danger(G, f)) { const hot = f.state !== 'calm'; if (on) { ctx.strokeStyle = hot ? `rgba(255,60,50,${0.65 + 0.35 * Math.sin(t * 12)})` : 'rgba(255,80,70,.45)'; ctx.lineWidth = (hot ? 3 : 2) * k; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.stroke();
        if (f.state === 'notice') { ctx.font = `400 ${Math.round(26 * k)}px ${TF}`; ctx.fillStyle = '#ff5a4a'; ctx.textAlign = 'center'; ctx.fillText('!', p.x, p.y - r - 14 * k); } }
      else if (hot || d < (10 + f.size * 1.5 + sizeOf(G) * 1.5) * sense) edgeMark(p, hot, t); }
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
    ctx.font = `800 ${Math.round(11 * k)}px ${BC}`; ctx.fillStyle = '#fff'; const left = Math.max(0, Math.ceil(need - m.fill)), np = nextPrey(G);
    ctx.textAlign = 'left'; ctx.fillText(G.ready ? 'EAT THE BIG ONE 👑' : `${left} to size ${m.tier + 2}`, bx, by2 + bh + 9 * k);
    if (np) { ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(255,255,255,.7)'; const nm = SPECIES[np].name.toUpperCase(); ctx.fillText(nm, x + w - 12, by2 + bh + 9 * k); const tw = ctx.measureText(nm).width; ctx.fillStyle = '#ff9a8a'; ctx.fillText('STILL TOO BIG: ', x + w - 12 - tw, by2 + bh + 9 * k); }
    // hunger
    const hy = y + h + 8 * k; ui.hungerShow += (m.hunger - ui.hungerShow) * 0.2; ctx.fillStyle = 'rgba(0,0,0,.45)'; rrect(x, hy, w * 0.5, 9 * k, 4.5 * k); ctx.fill(); const low = m.hunger < 0.3;
    ctx.fillStyle = low ? (Math.sin(t * 8) > 0 ? '#ff5a4a' : '#ff9a4a') : '#ffb83a'; if (ui.hungerShow > 0.01) { rrect(x, hy, Math.max(9 * k, w * 0.5 * ui.hungerShow), 9 * k, 4.5 * k); ctx.fill(); }
    ctx.textAlign = 'left'; ctx.font = `800 ${Math.round(11 * k)}px ${BC}`; ctx.fillStyle = low ? '#ffb4a8' : 'rgba(255,255,255,.8)'; ctx.fillText(m.hunger <= 0 ? 'STARVING!' : low ? 'HUNGRY!' : 'food', x + w * 0.5 + 8, hy + 4.5 * k);
    ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillText(`🪙 ${G.coins}`, x + w, hy + 4.5 * k);
    // THE MAP (25 Nov 2026): the whole sea in a ring: each place by its sign (dim while it is fished out, ringed until he has been there), the chests
    // still to find in gold, the big one's crown, and him. And when there is little to eat where he is, a marker at the edge of the screen points to
    // the nearest place that still has fish.
    { const R = 36 * k, cx2 = W - 14 - R, cy2 = hy + 22 * k + R, sc = R / (R_BAY + 4), here = spotAt(G, m.x, m.z);
      ctx.fillStyle = 'rgba(4,20,32,.72)'; ctx.beginPath(); ctx.arc(cx2, cy2, R + 4 * k, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1.5; ctx.stroke();
      for (const q of G.spots) { const px = cx2 + q.x * sc, py = cy2 + q.z * sc, out = q.out > 0; ctx.globalAlpha = out ? 0.3 : 1; ctx.fillStyle = SPOT[q.k].col; ctx.beginPath(); ctx.arc(px, py, 6.5 * k, 0, TAU); ctx.fill();
        if (!q.found) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(px, py, (8.5 + Math.sin(t * 4) * 1.2) * k, 0, TAU); ctx.stroke(); }
        if (q.chest && !q.chest.got) { ctx.globalAlpha = 1; ctx.fillStyle = '#ffd040'; ctx.fillRect(px + 4 * k, py - 9 * k, 5 * k, 5 * k); ctx.strokeStyle = '#3a2a04'; ctx.lineWidth = 1; ctx.strokeRect(px + 4 * k, py - 9 * k, 5 * k, 5 * k); } ctx.globalAlpha = 1; }
      const pz = G.fish.find(f => f.prize); if (pz) { ctx.font = `${Math.round(11 * k)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('👑', cx2 + pz.x * sc, cy2 + pz.z * sc); }
      ctx.save(); ctx.translate(cx2 + m.x * sc, cy2 + m.z * sc); ctx.rotate(m.face); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#04141e'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(6 * k, 0); ctx.lineTo(-4 * k, -4 * k); ctx.lineTo(-4 * k, 4 * k); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      // ...and once he is big enough, to the big one, in gold, wherever it waits
      if (G.ready ? !!pz : !(here && !(here.out > 0))) { let to = null, bd = 1e9; if (G.ready) { to = { x: pz.x, z: pz.z, k: 'prize' }; bd = Math.hypot(pz.x - m.x, pz.z - m.z); } else for (const q of G.spots) { if (q.out > 0 || q === here) continue; const d = Math.hypot(q.x - m.x, q.z - m.z); if (d < bd) { bd = d; to = q; } }
        const SP1 = to && (to.k === 'prize' ? { col: '#ffd040', icon: '👑' } : SPOT[to.k]);
        if (to) { const p1 = scr(to.x, 0, to.z), on = p1.front !== false && p1.x > 30 && p1.x < W - 30 && p1.y > 150 * k && p1.y < H - 60; if (!on) { const p0 = scr(m.x, 0, m.z), dx = (to.x - m.x), dz = (to.z - m.z), a = Math.atan2(p1.y - p0.y, p1.x - p0.x), ccx = W / 2, ccy = H * 0.52, mx = W / 2 - 34 * k, my = H * 0.3, q2 = Math.min(mx / Math.abs(Math.cos(a) || 1e-6), my / Math.abs(Math.sin(a) || 1e-6)), bx2 = ccx + Math.cos(a) * q2, by3 = ccy + Math.sin(a) * q2, z2 = 1 + 0.08 * Math.sin(t * 6);
            ctx.save(); ctx.translate(bx2, by3); ctx.fillStyle = 'rgba(4,20,32,.8)'; ctx.beginPath(); ctx.arc(0, 0, 19 * k * z2, 0, TAU); ctx.fill(); ctx.strokeStyle = SP1.col; ctx.lineWidth = 3 * k; ctx.stroke(); ctx.font = `${Math.round(17 * k)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText(SP1.icon, 0, 1); ctx.rotate(a); ctx.fillStyle = SP1.col; ctx.beginPath(); ctx.moveTo(31 * k, 0); ctx.lineTo(22 * k, -7 * k); ctx.lineTo(22 * k, 7 * k); ctx.closePath(); ctx.fill(); ctx.restore();
            ctx.font = `800 ${Math.round(10 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText(`${Math.round(bd)} m`, bx2, by3 + 30 * k); } } } }
    // the chain: five lights over him, one for each fish eaten soon after the last, and a ring that runs down until the chain breaks; then the frenzy's own bar
    { const p0 = scr(m.x, 0, m.z), ry = p0.y - Math.max(34 * k, sizeOf(G) * W / ui.cam.span * 0.42);
      if (G.frenzy > 0) { const fw = 120 * k, a = G.frenzy / FRENZY; ctx.fillStyle = 'rgba(0,0,0,.5)'; rrect(p0.x - fw / 2, ry - 5 * k, fw, 10 * k, 5 * k); ctx.fill(); ctx.fillStyle = Math.sin(t * 16) > 0 ? '#ffb83a' : '#ff7a2a'; rrect(p0.x - fw / 2, ry - 5 * k, Math.max(10 * k, fw * a), 10 * k, 5 * k); ctx.fill(); ctx.textAlign = 'center'; ctx.font = `400 ${Math.round(14 * k)}px ${TF}`; ctx.fillStyle = '#ffe08a'; ctx.fillText('FRENZY ×2', p0.x, ry - 16 * k); }
      else if (G.combo > 0) { const a = clamp(G.comboT / CHAIN_T, 0, 1); for (let i = 0; i < CHAIN_N; i++) { const px = p0.x + (i - (CHAIN_N - 1) / 2) * 13 * k; ctx.beginPath(); ctx.arc(px, ry, 4.5 * k, 0, TAU); ctx.fillStyle = i < G.combo ? '#ffb83a' : 'rgba(255,255,255,.25)'; ctx.globalAlpha = i < G.combo ? 1 : a; ctx.fill(); } ctx.globalAlpha = 1; ctx.fillStyle = 'rgba(255,184,58,.85)'; rrect(p0.x - 30 * k, ry + 8 * k, 60 * k * a, 2.5 * k, 1.2 * k); ctx.fill(); } }
  } else lessonPanel(G);
  // your dash: a thin blue bar under the shark, only while it is not full
  const p = scr(m.x, 0, m.z); if (m.dash < 0.99) { const w = 46 * k, y = p.y + Math.max(18 * k, sizeOf(G) * W / ui.cam.span * 0.35); ctx.fillStyle = 'rgba(0,0,0,.45)'; rrect(p.x - w / 2, y, w, 5 * k, 2.5 * k); ctx.fill(); ctx.fillStyle = m.dash < 0.15 ? '#ff8a6a' : '#6ad8ff'; rrect(p.x - w / 2, y, w * m.dash, 5 * k, 2.5 * k); ctx.fill(); }
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
