// ===================== THE VIEW: Wild Water in 3D (three.js through tools/world3d.js) =====================
// The river is a ribbon of water that follows the course (bends, ledges), with a second ribbon of foam over it that is thickest in
// the rapids and behind every rock. Banks of rock and forest each side, mountains far off. You sit in the kayak: its bow in front,
// the paddle in your gloves.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [];
let hint = null, V3 = null;
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 6) TXT.shift(); }
function tip(key, txt, secs = 2.8) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function fxStep(dt) {
  FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.3) TXT.shift();
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; }
}
// ---------- the parts that do not change from run to run: built once ----------
function buildWorld() {
  if (V3) return V3; const T = THREE; if (!W3 || !W3.init({ canvas: $('gl'), fov: 74, far: 6000, near: 0.05 })) { V3 = { none: true }; return V3; }
  const S = W3.scene, R0 = W3.rng(77);
  // rock shapes: lumpy stones (three of them, scaled and turned for every rock)
  const N3 = new T.ImprovedNoise(), rockGeo = [];
  for (let i = 0; i < 3; i++) { let g = new T.IcosahedronGeometry(1, 2); g.deleteAttribute('normal'); g.deleteAttribute('uv'); g = T.mergeVertices(g); const p = g.attributes.position; for (let j = 0; j < p.count; j++) { const v = new T.Vector3().fromBufferAttribute(p, j), n = 1 + 0.28 * N3.noise(v.x * 1.7 + i * 5, v.y * 1.7, v.z * 1.7) + 0.1 * N3.noise(v.x * 4, v.y * 4 + i, v.z * 4); v.multiplyScalar(n); v.y *= 0.75; p.setXYZ(j, v.x, v.y, v.z); } g.computeVertexNormals(); rockGeo.push(g); }
  const rockTex = W3.grainTex(256, 12, 150, 70, 3);
  const rockM = new T.MeshStandardMaterial({ color: 0x8a8a84, roughness: 0.62, map: rockTex, metalness: 0 });
  // kayak and paddle
  const boat = new T.Group(), hullM = new T.MeshStandardMaterial({ color: 0xe8541c, roughness: 0.3, metalness: 0.05 });
  { const pts = []; for (let i = 0; i <= 24; i++) { const u = i / 24, z = -1.8 + u * 3.6, r = 0.32 * Math.pow(Math.sin(Math.PI * u), 0.6); pts.push(new T.Vector3(0, 0, z)); }
    const g = new T.SphereGeometry(1, 28, 14); const p = g.attributes.position; for (let j = 0; j < p.count; j++) { let x = p.getX(j), y = p.getY(j), z = p.getZ(j); y = y > 0 ? y * 0.14 : y * 0.2; const taper = 1 - Math.pow(Math.abs(z), 2.4) * 0.15; p.setXYZ(j, x * 0.32 * taper, y, z * 1.85); } g.computeVertexNormals();
    const hull = new T.Mesh(g, hullM); hull.castShadow = hull.receiveShadow = true; boat.add(hull);
    const skirt = new T.Mesh(new T.CylinderGeometry(0.27, 0.3, 0.06, 20), new T.MeshStandardMaterial({ color: 0x1b1d22, roughness: 0.85 })); skirt.scale.set(1, 1, 1.35); skirt.position.set(0, 0.13, 0.25); boat.add(skirt);
    const rim = new T.Mesh(new T.TorusGeometry(0.3, 0.025, 6, 24), new T.MeshStandardMaterial({ color: 0x222222, roughness: 0.6 })); rim.rotation.x = Math.PI / 2; rim.scale.set(1, 1.35, 1); rim.position.set(0, 0.15, 0.25); boat.add(rim);
    const line = new T.Mesh(new T.BoxGeometry(0.01, 0.01, 1.4), new T.MeshStandardMaterial({ color: 0x222222 })); line.position.set(0, 0.14, -0.9); boat.add(line); }
  S.add(boat);
  const paddle = new T.Group(); { const shaftM = new T.MeshStandardMaterial({ color: 0x2b2f36, roughness: 0.35, metalness: 0.3 }), bladeM = new T.MeshStandardMaterial({ color: 0xf2d22e, roughness: 0.4, side: T.DoubleSide });
    const shaft = new T.Mesh(new T.CylinderGeometry(0.016, 0.016, 2.1, 10), shaftM); shaft.rotation.z = Math.PI / 2; paddle.add(shaft);
    const bs = new T.Shape(); bs.moveTo(-0.08, 0); bs.quadraticCurveTo(-0.1, 0.28, -0.04, 0.46); bs.quadraticCurveTo(0.02, 0.5, 0.09, 0.44); bs.quadraticCurveTo(0.1, 0.2, 0.07, 0); bs.lineTo(-0.08, 0);
    for (const sd of [-1, 1]) { const bl = new T.Mesh(new T.ShapeGeometry(bs, 8), bladeM); bl.rotation.z = sd * -Math.PI / 2; bl.position.x = sd * 1.02; bl.rotation.y = sd * 0.3; bl.castShadow = true; paddle.add(bl); }
    const gloveM = new T.MeshStandardMaterial({ color: 0x1f262e, roughness: 0.8 });
    for (const sd of [-1, 1]) { const gl = new T.Mesh(new T.CapsuleGeometry(0.045, 0.07, 4, 8), gloveM); gl.rotation.z = Math.PI / 2; gl.position.x = sd * 0.36; gl.castShadow = true; paddle.add(gl);
      const arm = new T.Mesh(new T.CylinderGeometry(0.05, 0.06, 0.55, 8), new T.MeshStandardMaterial({ color: 0x2f5aa8, roughness: 0.75 })); arm.position.set(sd * 0.4, -0.12, 0.27); arm.rotation.set(1.15, 0, -sd * 0.25); paddle.add(arm); } }
  S.add(paddle);
  // splashes: droplets and white spray
  const NP = 360, spG = new T.BufferGeometry(); spG.setAttribute('position', new T.BufferAttribute(new Float32Array(NP * 3), 3)); spG.setAttribute('a', new T.BufferAttribute(new Float32Array(NP), 1));
  const spM = new T.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { px: { value: 1 }, lit: { value: 1 } }, vertexShader: `attribute float a; uniform float px; varying float va; void main(){ va = a; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = min(px * 26.0, px * 34.0 / -mv.z); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float lit; varying float va; void main(){ float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(vec3(0.94, 0.97, 1.0) * lit, va * smoothstep(0.5, 0.1, d)); }` });
  const sp = new T.Points(spG, spM); sp.frustumCulled = false; sp.renderOrder = 4; S.add(sp);
  const drops = []; for (let i = 0; i < NP; i++) drops.push({ t: 9, life: 1, x: 0, y: -99, z: 0, vx: 0, vy: 0, vz: 0 });
  // the water's ripples (a normal picture that flows downstream) and the foam's picture
  const nrm = W3.normalTex(256, 40, 9); nrm.repeat.set(1, 1);
  const fc = document.createElement('canvas'); fc.width = fc.height = 256; { const g = fc.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 1400; i++) { const x = R0() * 256, y = R0() * 256, r = 1 + Math.pow(R0(), 3) * 9; for (const ox of [-256, 0, 256]) for (const oy of [-256, 0, 256]) { const gr = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r); gr.addColorStop(0, 'rgba(255,255,255,.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x + ox - r, y + oy - r, r * 2, r * 2); } } }
  const foamTex = new T.CanvasTexture(fc); foamTex.wrapS = foamTex.wrapT = T.RepeatWrapping;
  V3 = { T, S, rockGeo, rockM, boat, paddle, sp, drops, nrm, foamTex, run: null, look: new T.Vector3(), cam: { roll: 0, pitch: 0, bob: 0 }, sky: null };
  W3.setQuality(stepN);
  return V3;
}
// ---------- the river of this run (made again for every run, from its seed) ----------
function riverPath(RV) {      // the middle line in the world: x, z (three.js), heading phi, for every metre
  const n = RV.n, X = new Float32Array(n), Z = new Float32Array(n), P = new Float32Array(n); let x = 0, z = 0, ph = 0;
  for (let j = 0; j < n; j++) { X[j] = x; Z[j] = z; P[j] = ph; ph += RV.k[j]; x += Math.sin(ph); z -= Math.cos(ph); }
  return { X, Z, P };
}
function wpos(RV, s, d, y = 0) { const p = RV.path, j = clamp(s, 0, RV.n - 1.001), i = j | 0, f = j - i, i2 = Math.min(RV.n - 1, i + 1);
  const x = p.X[i] + (p.X[i2] - p.X[i]) * f, z = p.Z[i] + (p.Z[i2] - p.Z[i]) * f, ph = p.P[i] + (p.P[i2] - p.P[i]) * f;
  return new THREE.Vector3(x + Math.cos(ph) * d, rv(RV.y, s) + y, z + Math.sin(ph) * d); }
function buildRun(G) {
  const V = buildWorld(); if (V.none) return; const T = V.T, S = V.S, RV = G.river, R0 = W3.rng(G.seed % 100000 + 3), N3 = new T.ImprovedNoise();
  if (V.run) { for (const m of V.run.meshes) { S.remove(m); if (m.geometry && !m.userData.shared) m.geometry.dispose(); } }
  RV.path = riverPath(RV); const run = { meshes: [] }, add = m => { S.add(m); run.meshes.push(m); return m; };
  const n = RV.n, ACR = 14;
  // rocks, sorted by where they are, to whiten the water round them
  const rocks = RV.rocks.filter(r => !r.gap), byS = {}; for (const r of rocks) { const k2 = Math.floor(r.s / 4); (byS[k2] = byS[k2] || []).push(r); }
  const foamAt = (s, d) => { let f = rv(RV.foam, s) * (0.55 + 0.45 * Math.abs(N3.noise(s * 0.15, d * 0.3, 0.5))); for (let q = -2; q <= 1; q++) for (const r of byS[Math.floor(s / 4) + q] || []) { const ds = s - r.s, dd = d - r.d;
      const wake = ds > 0 ? Math.exp(-Math.pow(dd / (r.r * (1.1 + ds * 0.08)), 2)) * Math.exp(-ds / (4 + r.r * 3)) : Math.exp(-(ds * ds + dd * dd) / (r.r * r.r * 2.5)); f += wake * (r.sub ? 1.2 : 0.9); }
    for (const dp of RV.drops) { const ds = s - dp.s, inT = Math.abs(d - dp.d) < dp.w / 2 - Math.max(0, -ds) * 0.08; if (ds > -10 && ds < 0 && inT) f *= 0.15; if (ds > -1.5 && ds < 8) f += inT ? (ds > 0.5 ? 0.8 * Math.exp(-ds / 3) : 0) : 1.3 * Math.exp(-Math.max(0, ds) / 3.5); }
    return clamp(f, 0, 1); };
  // water and foam ribbons
  const pos = [], uv = [], foam = [], idx = [];
  for (let j = 0; j < n; j++) { const w = RV.w[j] / 2 + 0.8; for (let a = 0; a <= ACR; a++) { const d = -w + 2 * w * a / ACR, p = wpos(RV, j, d, 0); pos.push(p.x, p.y, p.z); uv.push(d / 5, j / 5); foam.push(foamAt(j, d)); } }
  for (let j = 0; j < n - 1; j++) for (let a = 0; a < ACR; a++) { const i0 = j * (ACR + 1) + a, i1 = i0 + ACR + 1; idx.push(i0, i0 + 1, i1, i1, i0 + 1, i1 + 1); }      // wound so the water faces up
  const wg = new T.BufferGeometry(); wg.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); wg.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); wg.setAttribute('foam', new T.Float32BufferAttribute(foam, 1)); wg.setIndex(idx); wg.computeVertexNormals();
  const waterM = new T.MeshStandardMaterial({ color: 0x0f2422, roughness: 0.12, metalness: 0.1, normalMap: V.nrm, normalScale: new T.Vector2(0.9, 0.9), envMapIntensity: 1.25 });
  const water = add(new T.Mesh(wg, waterM)); water.receiveShadow = true;
  const foamM = new T.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { map: { value: V.foamTex }, t: { value: 0 }, lit: { value: new T.Color(1, 1, 1) } }, polygonOffset: true, polygonOffsetFactor: -2,
    vertexShader: `attribute float foam; varying float vf; varying vec2 vu; void main(){ vf = foam; vu = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform sampler2D map; uniform float t; uniform vec3 lit; varying float vf; varying vec2 vu;
      void main(){ float a = texture2D(map, vu * vec2(1.6, 0.9) + vec2(0.0, t * 1.0)).r; float b = texture2D(map, vu * vec2(0.9, 0.5) + vec2(0.37, t * 0.6)).r;
        float tx = a * 0.65 + b * 0.5; float f = clamp(vf * 1.7 * (0.3 + tx * 1.4) - 0.12, 0.0, 1.0); gl_FragColor = vec4(lit * (0.8 + 0.2 * a), f * 0.95); }` });
  const fm = add(new T.Mesh(wg, foamM)); fm.renderOrder = 2; fm.userData.shared = true;
  // banks: rock at the water, then forest floor climbing away; trees on them
  const bankPts = [0, 0.4, 1.2, 2.5, 4.5, 7, 10, 14, 20, 28, 40, 56, 80];
  for (const side of [-1, 1]) { const bp = [], bc = [], bi = [], M = bankPts.length;
    for (let j = 0; j < n; j++) { const w = RV.w[j] / 2 + 0.6; for (let a = 0; a < M; a++) { const o = bankPts[a], d = side * (w + o), cliff = 0.6 + 0.5 * Math.abs(N3.noise(j * 0.03, side * 3, 1));
      const hgt = (o < 0.5 ? -0.5 + o : Math.min(o, 12) * cliff * 0.9 + Math.max(0, o - 12) * 0.35) + N3.noise(j * 0.08, o * 0.15, side) * Math.min(3, o * 0.4); const p = wpos(RV, j, d, hgt); bp.push(p.x, p.y, p.z);
      const rocky = o < 3 || cliff > 0.85 && o < 14, n2 = 0.5 + 0.5 * N3.noise(j * 0.2, o * 0.3, side * 7);
      const c = rocky ? [0.24 + 0.07 * n2, 0.23 + 0.06 * n2, 0.21 + 0.05 * n2] : [0.15 + 0.06 * n2, 0.22 + 0.08 * n2, 0.1 + 0.03 * n2]; bc.push(...c); } }
    for (let j = 0; j < n - 1; j++) for (let a = 0; a < M - 1; a++) { const i0 = j * M + a, i1 = i0 + M; if (side < 0) bi.push(i0, i1, i0 + 1, i1, i1 + 1, i0 + 1); else bi.push(i0, i0 + 1, i1, i1, i0 + 1, i1 + 1); }
    const bg = new T.BufferGeometry(); bg.setAttribute('position', new T.Float32BufferAttribute(bp, 3)); bg.setAttribute('color', new T.Float32BufferAttribute(bc, 3)); bg.setIndex(bi); bg.computeVertexNormals();
    const gt = W3.grainTex(256, 31, 200, 55, 2); gt.repeat.set(40, 40);
    const bank = add(new T.Mesh(bg, new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, map: gt }))); bank.receiveShadow = true; }
  const pts = []; for (let j = 0; j < n; j += 3) pts.push(wpos(RV, j, 0)); const pathNear = q => { let m = 1e9; for (const a of pts) { const dx = a.x - q.x, dz = a.z - q.z; m = Math.min(m, dx * dx + dz * dz); } return Math.sqrt(m); };
  const trees = []; for (let j = 0; j < n; j += 2.2) for (const side of [-1, 1]) { if (R0() < 0.25) continue; const o = 8 + Math.pow(R0(), 0.7) * 60, w = RV.w[j | 0] / 2 + 0.6, cliff = 0.6 + 0.5 * Math.abs(N3.noise(j * 0.03, side * 3, 1)), hgt = Math.min(o, 12) * cliff * 0.9 + Math.max(0, o - 12) * 0.35;
    const p = wpos(RV, j, side * (w + o), hgt - 0.4); if (pathNear(p) < RV.w[j | 0] / 2 + 6) continue; trees.push({ x: p.x, y: p.y, z: p.z, s: 0.9 + R0() * 1.2, sy: 0.9 + R0() * 0.5, rot: R0() * 6, hue: R0() - 0.5, shade: R0() - 0.5, lean: (R0() - 0.5) * 0.08 }); }
  const tm = W3.pines(trees, {}); run.meshes.push(tm);
  // the hills and mountains round the valley (kept away from the river so they never cut the banks)
  const mid = wpos(RV, n / 2, 0), samp = []; for (let j = 0; j < n; j += 12) samp.push(wpos(RV, j, 0));
  const far = W3.terrain({ size: 6000, seg: 140, x: mid.x, z: mid.z, height: (x, z) => { let dm = 1e9; for (const q of samp) dm = Math.min(dm, Math.hypot(x - q.x, z - q.z)); const m = clamp((dm - 90) / 600, 0, 1);
      return -30 + m * (60 + 380 * (0.5 + 0.5 * N3.noise(x * 0.0012, 1.3, z * 0.0012))) + N3.noise(x * 0.008, 0.2, z * 0.008) * 40 * m + rv(RV.y, n / 2); },
    colour: (x, z, h, sl) => { const n2 = 0.5 + 0.5 * N3.noise(x * 0.01, 3, z * 0.01); return h > 280 + 40 * n2 && sl < 0.5 ? [0.9, 0.92, 0.95] : sl > 0.4 ? [0.36, 0.35, 0.33] : [0.14 + 0.05 * n2, 0.2 + 0.07 * n2, 0.1]; } });
  run.meshes.push(far);
  // rocks
  const rI = [0, 1, 2].map(i => { const list = rocks.filter((r, q) => q % 3 === i); const m = new T.InstancedMesh(V.rockGeo[i], V.rockM, Math.max(1, list.length)); m.count = list.length; const D = new T.Object3D(), C = new T.Color();
    list.forEach((r, q) => { const p = wpos(RV, r.s, r.d, r.sub ? -0.35 : r.ledge ? -0.1 : -0.15); D.position.copy(p); D.rotation.set(R0() * 0.4, R0() * 6.3, R0() * 0.4); D.scale.set(r.r * 1.05, r.sub ? r.r * 0.5 : r.h + r.r * 0.4, r.r * (0.9 + R0() * 0.3)); D.updateMatrix(); m.setMatrixAt(q, D.matrix); C.setHSL(0.08, 0.05 + R0() * 0.05, 0.62 + R0() * 0.2); m.setColorAt(q, C); });
    m.castShadow = true; m.receiveShadow = true; m.userData.shared = true; return add(m); });
  // fallen trees on the outside of the bends
  const wood = new T.MeshStandardMaterial({ color: 0x4b3d2f, roughness: 0.95, map: W3.grainTex(128, 21, 170, 70, 2) });
  for (const tr of RV.trees) { const w = rv(RV.w, tr.s + tr.len / 2) / 2, a = wpos(RV, tr.s, tr.side * (w + 3), 0.6), b = wpos(RV, tr.s + tr.len, tr.side * (w - tr.reach - 0.3), 0.1), L = a.distanceTo(b);
    const trunk = add(new T.Mesh(new T.CylinderGeometry(0.16, 0.3, L, 8), wood)); trunk.position.copy(a).lerp(b, 0.5); trunk.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), b.clone().sub(a).normalize()); trunk.castShadow = true;
    for (let i = 0; i < 7; i++) { const u = 0.25 + i * 0.1, q = a.clone().lerp(b, u), br = add(new T.Mesh(new T.CylinderGeometry(0.03, 0.07, 1.4 + R0(), 5), wood)); br.position.copy(q).add(new T.Vector3(0, 0.4, 0)); br.rotation.set(R0() - 0.5, R0() * 6, (R0() - 0.5) * 2); br.castShadow = true; } }
  // slalom gates: two striped poles hanging over the water
  const pc = document.createElement('canvas'); pc.width = 4; pc.height = 32; { const g = pc.getContext('2d'); for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#ffffff' : '#1fa34a'; g.fillRect(0, i * 4, 4, 4); } }
  const poleTex = new T.CanvasTexture(pc); poleTex.colorSpace = T.SRGBColorSpace; poleTex.magFilter = T.NearestFilter; const poleM = new T.MeshStandardMaterial({ map: poleTex, roughness: 0.5 });
  for (const gt of RV.gates) for (const sd of [-1, 1]) { const p = wpos(RV, gt.s, gt.d + sd * gt.w / 2, 1.35), pole = add(new T.Mesh(new T.CylinderGeometry(0.035, 0.035, 2.3, 8), poleM)); pole.position.copy(p); pole.castShadow = true; gt.m = gt.m || []; gt.m.push(pole); }
  for (const gt of RV.gates) { const a = wpos(RV, gt.s, -RV.w[gt.s | 0] / 2 - 2, 3.3), b = wpos(RV, gt.s, RV.w[gt.s | 0] / 2 + 2, 3.3); const g = new T.BufferGeometry().setFromPoints([a, b]); add(new T.Line(g, new T.LineBasicMaterial({ color: 0x222222 }))); }
  // the finish: a banner across the river
  { const a = wpos(RV, RV.len, -RV.w[RV.len | 0] / 2 - 1.5, 0), b = wpos(RV, RV.len, RV.w[RV.len | 0] / 2 + 1.5, 0); const postM = new T.MeshStandardMaterial({ color: 0x777777, metalness: 0.6, roughness: 0.4 });
    for (const p of [a, b]) { const post = add(new T.Mesh(new T.CylinderGeometry(0.08, 0.08, 4.5, 8), postM)); post.position.copy(p).add(new T.Vector3(0, 2.25, 0)); }
    const bc2 = document.createElement('canvas'); bc2.width = 512; bc2.height = 64; const g = bc2.getContext('2d'); for (let i = 0; i < 32; i++) for (let jj = 0; jj < 4; jj++) { g.fillStyle = (i + jj) % 2 ? '#111' : '#f4f4f4'; g.fillRect(i * 16, jj * 16, 16, 16); }
    const bt = new T.CanvasTexture(bc2); bt.colorSpace = T.SRGBColorSpace; const ban = add(new T.Mesh(new T.PlaneGeometry(a.distanceTo(b), 0.7), new T.MeshStandardMaterial({ map: bt, side: T.DoubleSide, roughness: 0.7 })));
    ban.position.copy(a).lerp(b, 0.5).add(new T.Vector3(0, 4, 0)); ban.lookAt(wpos(RV, RV.len - 5, 0, 4)); }
  run.water = water; run.foamM = foamM; V.run = run; run.seed = G.seed; run.river = RV;
}
function setWeather(G) {
  const V = buildWorld(); if (V.none || V.sky === G.weather) return; V.sky = G.weather;
  W3.setSky(G.weather, { azim: { dawn: 110, sunset: 230, golden: 220, morning: 140 }[G.weather] || 160, wind: [0.6, 0.3] });
  const d = W3.S.night ? 0.25 : W3.S.name === 'storm' ? 0.45 : W3.S.name === 'rain' ? 0.6 : 1; if (V.run) V.run.foamM.uniforms.lit.value.setScalar(0.65 + 0.35 * d);
  V.sp.material.uniforms.lit.value = 0.6 + 0.4 * d;
  W3.S.onBolt = () => { if (!HEADLESS && sfx.thunder) setTimeout(() => sfx.thunder(), 300 + Math.random() * 900); };
}
// ---------- what happens, seen and heard ----------
function spray(p, n, sp = 2.5, up = 1) { if (!V3 || V3.none) return; let k2 = 0; for (const d of V3.drops) { if (d.t < d.life) continue; const a = Math.random() * 6.28, v = sp * (0.3 + Math.random());
  Object.assign(d, { t: 0, life: 0.45 + Math.random() * 0.5, x: p.x + (Math.random() - 0.5) * 0.3, y: p.y, z: p.z + (Math.random() - 0.5) * 0.3, vx: Math.cos(a) * v * 0.5, vy: v * up * (0.6 + Math.random()), vz: Math.sin(a) * v * 0.5 }); if (++k2 >= n) break; } }
function boatPos(G, d = 0, y = 0, fwd = 0) { const b = G.b; return wpos(G.river, b.s + fwd * Math.cos(b.h) - d * Math.sin(b.h), b.d + d * Math.cos(b.h) + fwd * Math.sin(b.h), y); }
function onEvent(G, e) {
  const cx = W / 2, cy = H * 0.36;
  switch (e.k) {
    case 'stroke': sfx.stroke(e.back); if (G.river.path) spray(boatPos(G, e.side * 1.0, 0.05, 0.4), 6, 1.6); vibe(HAP.tick); break;
    case 'scrape': sfx.scrape(); FX.shake = 3; break;
    case 'dent': say(e.n === 1 ? 'SCRAPED A ROCK' : 'TWO SCRAPES: A KNOCK', W / 2, H * 0.4, '#ffd0c4', 20); break;
    case 'knock': if (e.big) { FX.shake = 12; FX.red = 0.5; FX.stop = 0.07; sfx.crash(); say(e.what === 'tree' ? 'INTO THE TREE!' : e.what === 'ledge' ? 'MISSED THE TONGUE!' : 'SMASH!', cx, cy, '#ffb4a8', 30); tip('k_' + e.what, e.what === 'tree' ? 'Stay off the outside of the bends: the current pushes you there' : e.what === 'ledge' ? 'Go over the ledge through the smooth tongue' : 'Find the gap in each row of rocks', 3); }
      else { FX.shake = 5; sfx.bump(); } if (G.river.path) spray(boatPos(G, 0, 0.2, 1.6), e.big ? 26 : 10, 3); break;
    case 'roll': FX.shake = 14; FX.red = 0.6; sfx.roll(); say('ROLLED!', cx, cy, '#ffb4a8', 34); tip('roll', 'Point straight down the river before a ledge', 3); break;
    case 'rollup': sfx.rollup(); break;
    case 'drop': sfx.drop(e.h); FX.shake = 7; if (G.river.path) spray(boatPos(G, 0, 0, 1.2), 30, 3.5); if (e.ok) say('CLEAN!', cx, cy, '#9be3b5', 28); vibe(HAP.thud); break;
    case 'gate': sfx.gate(e.n); say(`GATE ${e.n}`, cx, cy, '#9be3b5', 26); vibe(HAP.light); break;
    case 'gatemiss': say('MISSED THE GATE', cx, cy, '#ffd0c4', 22); break;
    case 'line': if (!G.lesson) { G.near++; if (G.near % 4 === 0) { say(`${G.near} ROWS CLEAN`, cx, cy + 40, '#ffe08a', 20); sfx.gate(G.near / 4); } } break;
    case 'river': if (V3 && !V3.none) buildRun(G); break;
    case 'lessonnext': if (e.first) hint = null; say(e.first ? 'FIRST, A LESSON' : 'NEXT LESSON', cx, H * 0.5, '#ffd36a', 26); sfx.ding(); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, cx, H * 0.5, '#9be3b5', 26); sfx.coin(e.n); break;
    case 'lessonmiss': hint = { txt: e.how, t: 0, secs: 3.6 }; break;
    case 'lessondone': say('YOU KNOW IT. NOW RUN THE RIVER!', cx, H * 0.5, '#ffd36a', 24); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); vibe(HAP.best); FX.flash = 0.6; break;
    case 'lost': sfx.lose(); say(e.why === 'roll' ? 'ROLLED ONE TIME TOO MANY' : 'THE BOAT IS WRECKED', cx, H * 0.5, '#ffd0c4', 26); break;      // (P11: never vibrate on failure)
  }
}
// ---------- each frame ----------
const ui = { snap: false, hint: 1 };
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#0b1418'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D river.', W / 2, H / 2); return; }
  const T = V.T, cam = W3.cam, g = G || idleG(), b = g.b, t = now;
  if (!V.run || V.run.river !== g.river) buildRun(g);
  setWeather(g);
  // the camera sits in the cockpit, a little behind the middle, and leans and bobs with the water
  const foam = rv(g.river.foam, b.s), rolled = b.roll > 0 ? Math.sin(clamp(1 - b.roll / 1.6, 0, 1) * Math.PI) : 0;
  const head = b.h + Math.sin(t * 1.3) * 0.01;
  V.cam.roll += ((-b.w * 0.07 + Math.sin(t * 2.3) * 0.02 * (0.3 + foam)) - V.cam.roll) * Math.min(1, dt * 6);
  const eye = boatPos(g, 0, 0.82 + Math.sin(t * 3.1) * 0.03 * (0.4 + foam) - rolled * 0.9, -0.15);
  cam.position.copy(eye); cam.fov = innerWidth > innerHeight ? 60 : 74; cam.updateProjectionMatrix();
  const ahead = wpos(g.river, b.s + 9 * Math.cos(head), b.d + 9 * Math.sin(head), 0), dropAhead = g.river.drops.some(d => d.s - b.s > 0 && d.s - b.s < 4);
  ahead.y = eye.y - 1.25 - (dropAhead ? 1.2 : 0);
  if (ui.snap) V.look.copy(ahead); else V.look.lerp(ahead, Math.min(1, dt * 7)); ui.snap = false;
  cam.lookAt(V.look); cam.rotateZ(V.cam.roll + rolled * 2.6);
  if (FX.shake > 0) { cam.rotation.x += (Math.random() - 0.5) * FX.shake * 0.002; cam.rotation.y += (Math.random() - 0.5) * FX.shake * 0.002; }
  // the boat
  const bp = boatPos(g, 0, -0.02 - rolled * 0.2, 0); V.boat.position.copy(bp); const ph = (() => { const p = g.river.path, i = clamp(b.s, 0, g.river.n - 1) | 0; return p.P[i]; })();
  V.boat.rotation.set(0, -(ph + b.h), 0); V.boat.rotateZ(-V.cam.roll * 0.6 + rolled * 2.8); V.boat.rotateX(Math.sin(t * 2.6) * 0.03 * (0.4 + foam) + (dropAhead ? 0.15 : 0));
  // the paddle: held across the body; a stroke dips one blade in and sweeps it back
  const st = b.stroke > 0 ? 1 - b.stroke / STROKE : 0, sw = Math.sin(st * Math.PI), side = b.side, back = b.back ? -1 : 1;
  const pp = boatPos(g, 0, 0.47 - sw * 0.1, 0.36 + (back > 0 ? sw * -0.15 : sw * 0.15));
  V.paddle.position.copy(pp); V.paddle.rotation.set(0, -(ph + b.h) + side * sw * 0.55 * back, 0); V.paddle.rotateZ(side * sw * 0.55 + Math.sin(t * 1.7) * 0.03); V.paddle.rotateX(-0.25);
  V.paddle.visible = b.roll <= 0;
  // water moves
  if (V.run) { V.nrm.offset.y += dt * rv(g.river.u, b.s) / 5 * 0.8; V.run.foamM.uniforms.t.value -= dt * rv(g.river.u, b.s) / 5 * 0.9; }
  if (foam > 0.5 && Math.random() < foam * dt * 6) spray(boatPos(g, (Math.random() - 0.5) * 0.8, 0.05, 1.7), 2, 1.4);
  // a ledge shows as a line where the water falls away, with spray thrown up beyond it everywhere but the smooth tongue
  for (const dp of g.river.drops) { const ahead2 = dp.s - b.s; if (ahead2 < -3 || ahead2 > 45) continue; const w2 = rv(g.river.w, dp.s) / 2;
    for (let q = 0; q < 2; q++) { const d = (Math.random() * 2 - 1) * w2; if (Math.abs(d - dp.d) < dp.w / 2) continue; spray(wpos(g.river, dp.s + 1.2 + Math.random(), d, -dp.h * 0.6), 1, 2.6, 1.3); } }
  const sp = V.sp.geometry.attributes.position, sa = V.sp.geometry.attributes.a;
  V.drops.forEach((d0, i) => { if (d0.t < d0.life) { d0.t += dt; d0.vy -= 9.8 * dt; d0.x += d0.vx * dt; d0.y += d0.vy * dt; d0.z += d0.vz * dt; } sp.setXYZ(i, d0.x, d0.t < d0.life ? d0.y : -999, d0.z); sa.setX(i, d0.t < d0.life ? 0.85 * (1 - d0.t / d0.life) : 0); });
  sp.needsUpdate = true; sa.needsUpdate = true; V.sp.material.uniforms.px.value = W3.R.getPixelRatio() * innerHeight / 844;
  for (const gt of g.river.gates) if (gt.m) for (const m of gt.m) m.material.emissive && m.material.emissive.set(gt.got ? 0x103a18 : 0x000000);
  W3.setFocus(bp.x, bp.y, bp.z, 12);
  W3.render(dt);
  if (G) hud(G);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const a = t2.t < 0.9 ? 1 : 1 - (t2.t - 0.9) / 0.4; ctx.globalAlpha = Math.max(0, a); ctx.font = `700 ${Math.round(t2.size * k)}px ${BC}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 26 * k); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 26 * k); }
  ctx.globalAlpha = 1;
  if (hint) { const a = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, a); ctx.font = `700 ${Math.round(16 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 20 * k, h = lines.length * lh + 16 * k, w = Math.min(W - 24, Math.max(...lines.map(l => ctx.measureText(l).width)) + 34);
    ctx.fillStyle = 'rgba(0,0,0,.6)'; rrect(W / 2 - w / 2, H * 0.62 - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.62 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,60,40,${FX.red * 0.18})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,250,235,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); }
}
let IG = null; function idleG() { if (!IG) { IG = newGame(Math.max(1, store.get('level', 1) | 0), { seed: 5 }); IG.b.s = 30; } IG.b.s += 0.02; if (IG.b.s > IG.river.len - 20) IG.b.s = 30; return IG; }
function weatherName(w) { return { dawn: 'DAWN', morning: 'MORNING', golden: 'GOLDEN HOUR', overcast: 'GREY SKY', rain: 'RAIN', mist: 'MIST', sunset: 'SUNSET', noon: 'MIDDAY SUN', storm: 'STORM' }[w] || ''; }
function hud(G) {
  const c = G.cfg, x = 14, y = 44 * k, RV = G.river;
  if (G.lesson) lessonPanel(G);
  else {
    // how far down the river (P14), with the gates on it
    const w = W - 2 * x - 86 * k, u = clamp(G.b.s / RV.len, 0, 1);
    ctx.fillStyle = 'rgba(0,0,0,.35)'; rrect(x, y + 4 * k, w, 8 * k, 4); ctx.fill(); ctx.fillStyle = '#5fd0e6'; rrect(x, y + 4 * k, Math.max(8, w * u), 8 * k, 4); ctx.fill();
    for (const gt of RV.gates) { const gx = x + w * gt.s / RV.len; ctx.fillStyle = gt.got ? '#7be08f' : gt.missed ? 'rgba(255,255,255,.25)' : '#fff'; ctx.fillRect(gx - 1.5, y, 3, 16 * k); }
    ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText(`${Math.max(0, Math.round(RV.len - G.b.s))} m to go`, x, y + 24 * k);
    // the boat's knocks left
    for (let i = 0; i < c.lives; i++) { const bx = W - x - 14 * k - i * 26 * k, by = y + 8 * k; ctx.save(); ctx.translate(bx, by); ctx.beginPath(); ctx.ellipse(0, 0, 11 * k, 3.5 * k, 0, 0, TAU); ctx.fillStyle = i < G.lives ? '#ff7a3c' : 'rgba(255,255,255,.2)'; ctx.fill(); ctx.restore(); }
  }
  if (G.t < 3.2 && !G.lesson) { ctx.globalAlpha = Math.min(1, (3.2 - G.t) / 0.6); ctx.textAlign = 'center'; ctx.font = `700 ${Math.round(15 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.5)';
    const s = `RUN ${G.N} · ${weatherName(G.weather)} · ${c.len} M${c.boss ? ' · THE GORGE' : ''}`; ctx.strokeText(s, W / 2, H * 0.2); ctx.fillText(s, W / 2, H * 0.2); ctx.globalAlpha = 1; }
  // the two paddle zones, faint, for the first runs: where the thumbs go
  if ((G.N <= 3 || ui.showZones) && !G.over) { const a = G.lesson ? 0.5 : Math.max(0, 0.4 - G.t * 0.03); if (a > 0) { ctx.globalAlpha = a; ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
    for (const sd of [-1, 1]) { const zx = W / 2 + sd * W / 4; ctx.fillText(sd < 0 ? 'LEFT STROKE ↓' : 'RIGHT STROKE ↓', zx, H - 40 * k); ctx.fillText(sd < 0 ? 'turns you right' : 'turns you left', zx, H - 22 * k); }
    ctx.fillRect(W / 2 - 0.5, H - 70 * k, 1, 60 * k); ctx.globalAlpha = 1; } }
}
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) {
  const D = G.lesson, st = D.steps[D.i], x = 14, w = W - 28, y = 42 * k; ctx.save();
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; const lines = wrapText(st.how, w - 24), h = 54 * k + lines.length * 17 * k;
  ctx.fillStyle = 'rgba(0,0,0,.62)'; rrect(x, y, w, h, 12); ctx.fill(); ctx.strokeStyle = 'rgba(255,211,106,.7)'; ctx.lineWidth = 2; rrect(x, y, w, h, 12); ctx.stroke();
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#ffd36a'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillText(`LESSON ${D.i + 1} OF ${D.steps.length}`, x + 12, y + 10 * k);
  ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(18 * k)}px ${BC}`; ctx.fillText(st.title, x + 12, y + 25 * k);
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.9)'; lines.forEach((l, i) => ctx.fillText(l, x + 12, y + 48 * k + i * 17 * k));
  for (let i = 0; i < st.need; i++) { ctx.beginPath(); ctx.arc(x + w - 16 - (st.need - 1 - i) * 18 * k, y + 18 * k, 6 * k, 0, TAU); if (i < D.n) { ctx.fillStyle = '#8fe0ab'; ctx.fill(); } else { ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; ctx.stroke(); } }
  ctx.restore();
}
