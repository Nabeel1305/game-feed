// ===================== THE VIEW: Vine in 3D (three.js through tools/world3d.js) =====================
// A rainforest gorge: giant trunks, a roof of leaves, light falling through mist, a river far below; vines hanging from the
// branches; you, seen from just behind, hanging by your hands.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [];
let hint = null, V3 = null;
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 6) TXT.shift(); }
function tip(key, txt, secs = 2.8) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function fxStep(dt) {
  FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.3) TXT.shift();
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; }
}
// (23 Nov 2026, his review: "the graphics are still bad. You need to do the graphics better".) The jungle is painted, not just
// shaped: bark with grooves and lichen on trunks that flare into buttress roots, mossy at the foot; crowns of leaf sprays, not
// green balls; ferns and broad leaves on the banks; mossy boulders with foam in a green river; hanging lianas; blossom on the vines
// you can catch; a waterfall at the gorge's end behind the tree house; mist on the water, shafts of light, motes, parrots.
function canvasTex(w, h, paint, srgb = true) { const c = document.createElement('canvas'); c.width = w; c.height = h; paint(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t; }
function paintLeaf(g, x, y, len, wid, ang, col, rib) { g.save(); g.translate(x, y); g.rotate(ang); g.fillStyle = col; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(len * 0.5, -wid, len, 0); g.quadraticCurveTo(len * 0.5, wid, 0, 0); g.fill();
  if (rib) { g.strokeStyle = rib; g.lineWidth = Math.max(1, wid * 0.12); g.beginPath(); g.moveTo(0, 0); g.lineTo(len * 0.95, 0); g.stroke(); } g.restore(); }
function buildWorld() {
  if (V3) return V3; const T = THREE; if (!W3 || !W3.init({ canvas: $('gl'), fov: 70, far: 3000, near: 0.1 })) { V3 = { none: true }; return V3; }
  const S = W3.scene, R0 = W3.rng(23);
  const river = W3.water({ size: 4000, color: 0x24583f, distort: 0.7, ripple: 1.8, speed: 0.6 });
  // the swinger: a person with joints (part25_human.js): hands that close on the vine, arms that reach, legs that kick and tuck
  const HM = humMake(T, { top: 0x2f7a4a, shorts: 0x7a5530, skin: 0xa8754f }), P = HM.g, arms = [];
  S.add(P);
  // textures, made once
  const bark = canvasTex(256, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#7c6e5a'); gr.addColorStop(0.5, '#9a8a70'); gr.addColorStop(1, '#786a56'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) { let x = R0() * w; g.strokeStyle = `rgba(${30 + R0() * 20},${24 + R0() * 16},${18 + R0() * 12},${0.35 + R0() * 0.4})`; g.lineWidth = 1 + R0() * 4; g.beginPath(); g.moveTo(x, 0); for (let y = 0; y <= h; y += 16) { x += (R0() - 0.5) * 6; g.lineTo(x, y); } g.stroke(); }
    for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(200,190,170,${0.08 + R0() * 0.12})`; g.lineWidth = 1 + R0() * 2; const x = R0() * w, y = R0() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R0() - 0.5) * 4, y + 20 + R0() * 60); g.stroke(); }
    for (let i = 0; i < 26; i++) { const x = R0() * w, y = R0() * h, r = 4 + R0() * 14; g.fillStyle = R0() < 0.8 ? `rgba(${150 + R0() * 40},${175 + R0() * 40},${120 + R0() * 30},${0.35 + R0() * 0.3})` : `rgba(225,222,205,${0.12 + R0() * 0.15})`; g.beginPath(); g.ellipse(x, y, r, r * (0.5 + R0() * 0.5), R0() * 3, 0, 6.3); g.fill(); } });
  bark.repeat.set(2, 7);
  const leafTex = canvasTex(256, 256, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = '#3a4a20'; g.lineWidth = 4; g.beginPath(); g.moveTo(w * 0.5, h); g.quadraticCurveTo(w * 0.46, h * 0.5, w * 0.52, h * 0.08); g.stroke();
    for (let i = 0; i < 46; i++) { const u = R0(), x = w * 0.5 + (R0() - 0.5) * w * 0.15, y = h * (0.1 + u * 0.85), side = R0() < 0.5 ? -1 : 1, len = 40 + R0() * 55, a = side > 0 ? -0.3 - R0() * 0.9 : Math.PI + 0.3 + R0() * 0.9;
      const hue = 82 + R0() * 42, l = 28 + R0() * 24; paintLeaf(g, x, y, len, 9 + R0() * 9, a, `hsl(${hue},${48 + R0() * 22}%,${l}%)`, `hsla(${hue},40%,${l + 18}%,.7)`); } });
  const fernTex = canvasTex(128, 256, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = '#3f6b25'; g.lineWidth = 3; g.beginPath(); g.moveTo(w / 2, h); g.quadraticCurveTo(w * 0.55, h * 0.4, w * 0.5, 4); g.stroke();
    for (let y = 12; y < h - 6; y += 7) { const u = 1 - y / h, len = 10 + Math.sin(u * Math.PI) * 44; for (const s of [-1, 1]) paintLeaf(g, w / 2, y, len, 4.5, s > 0 ? -0.35 : Math.PI + 0.35, `hsl(${100 + R0() * 18},${50 + R0() * 15}%,${26 + R0() * 14}%)`); } });
  const broadTex = canvasTex(256, 256, (g, w, h) => { g.clearRect(0, 0, w, h); for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.42; paintLeaf(g, w / 2, h, 130 + R0() * 40, 34 + R0() * 10, a, `hsl(${100 + R0() * 22},${45 + R0() * 15}%,${24 + R0() * 12}%)`, 'rgba(190,220,150,.55)'); } });
  const ropeTex = canvasTex(64, 256, (g, w, h) => { g.fillStyle = '#4c5a26'; g.fillRect(0, 0, w, h); for (let i = -8; i < 24; i++) { g.strokeStyle = i % 2 ? 'rgba(30,38,12,.55)' : 'rgba(150,160,80,.35)'; g.lineWidth = 5; g.beginPath(); g.moveTo(0, i * 16); g.lineTo(w, i * 16 + 40); g.stroke(); } });
  ropeTex.repeat.set(1, 1);
  const plank = canvasTex(256, 256, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = `hsl(${26 + R0() * 8},${38 + R0() * 10}%,${28 + R0() * 10}%)`; g.fillRect(0, i * 32, w, 32); g.fillStyle = 'rgba(20,10,5,.5)'; g.fillRect(0, i * 32, w, 2); for (let k = 0; k < 6; k++) { g.fillStyle = 'rgba(15,8,3,.18)'; g.fillRect(R0() * w, i * 32 + 6 + R0() * 20, 30 + R0() * 60, 1); } } });
  const thatch = canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#a88a4a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 260; i++) { g.strokeStyle = `hsla(${38 + R0() * 10},${45 + R0() * 20}%,${35 + R0() * 30}%,.8)`; g.lineWidth = 1 + R0(); const x = R0() * w; g.beginPath(); g.moveTo(x, R0() * h); g.lineTo(x + (R0() - 0.5) * 6, R0() * h); g.stroke(); } });
  const fall = canvasTex(64, 256, (g, w, h) => { g.clearRect(0, 0, w, h); for (let i = 0; i < 90; i++) { const x = R0() * w, y = R0() * h, l = 20 + R0() * 60; const gr = g.createLinearGradient(0, y, 0, y + l); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, `rgba(240,250,255,${0.35 + R0() * 0.5})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x, y, 1 + R0() * 2.5, l); } });
  const soft = canvasTex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,.85)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  const mats = { bark: new T.MeshStandardMaterial({ map: bark, roughness: 0.95, vertexColors: true }), branch: new T.MeshStandardMaterial({ map: bark, roughness: 0.95, color: 0xc8b89c }),
    leaf: new T.MeshStandardMaterial({ map: leafTex, alphaTest: 0.42, side: T.DoubleSide, roughness: 0.7 }), fern: new T.MeshStandardMaterial({ map: fernTex, alphaTest: 0.4, side: T.DoubleSide, roughness: 0.75 }),
    broad: new T.MeshStandardMaterial({ map: broadTex, alphaTest: 0.4, side: T.DoubleSide, roughness: 0.6 }), vine: new T.MeshStandardMaterial({ map: ropeTex, roughness: 0.85 }), liana: new T.MeshStandardMaterial({ color: 0x3b3a22, roughness: 0.9 }),
    flower: new T.MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xffc860, emissiveIntensity: 0.35, roughness: 0.5 }), plank: new T.MeshStandardMaterial({ map: plank, roughness: 0.9 }), thatch: new T.MeshStandardMaterial({ map: thatch, roughness: 1 }),
    rock: new T.MeshStandardMaterial({ map: W3.grainTex(128, 77, 150, 60, 2), roughness: 0.9, vertexColors: false }), foam: new T.MeshBasicMaterial({ map: soft, color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false }),
    fall: new T.MeshBasicMaterial({ map: fall, transparent: true, depthWrite: false, side: T.DoubleSide, fog: true }), mist: new T.SpriteMaterial({ map: soft, color: 0xeef6f0, transparent: true, opacity: 0.22, depthWrite: false, fog: true }) };
  // motes in the light, and three parrots that cross the gorge
  const NM = 70, mG = new T.BufferGeometry(); mG.setAttribute('position', new T.BufferAttribute(new Float32Array(NM * 3), 3)); const motes = new T.Points(mG, new T.PointsMaterial({ color: 0xfff2c0, size: 0.06, transparent: true, opacity: 0.8, depthWrite: false, blending: T.AdditiveBlending })); motes.frustumCulled = false; S.add(motes);
  const moteP = []; for (let i = 0; i < NM; i++) moteP.push({ x: (R0() - 0.5) * 14, y: (R0() - 0.5) * 8, z: -R0() * 16, ph: R0() * 6 });
  const birds = []; for (let i = 0; i < 3; i++) { const g = new T.Group(), col = [0xd23a2a, 0x2a7ad2, 0xe6b21e][i], bm = new T.MeshStandardMaterial({ color: col, roughness: 0.6 }), body = new T.Mesh(new T.CapsuleGeometry(0.13, 0.35, 4, 8), bm); body.rotation.x = Math.PI / 2; g.add(body);
    const tail = new T.Mesh(new T.ConeGeometry(0.08, 0.5, 5), bm); tail.rotation.x = -Math.PI / 2; tail.position.z = 0.42; g.add(tail); const wings = []; for (const s of [-1, 1]) { const w = new T.Mesh(new T.PlaneGeometry(0.6, 0.26), new T.MeshStandardMaterial({ color: col, side: T.DoubleSide })); w.geometry.translate(s * 0.3, 0, 0); g.add(w); wings.push(w); }
    S.add(g); birds.push({ g, wings, ph: R0() * 6, sp: 0.07 + R0() * 0.05, r: 22 + R0() * 18, h: 30 + R0() * 10, off: R0() * 6 }); }
  const fill = new T.HemisphereLight(0xe8f4ff, 0x40502a, 0.9); S.add(fill);
  V3 = { T, S, river, P, H: HM, arms, bark, leafTex, mats, motes, moteP, birds, fill, run: null, camPos: new T.Vector3(), look: new T.Vector3(), sky: null, ropes: [] };
  W3.setQuality(stepN); return V3;
}
function buildRun(G) {
  const V = V3, T = V.T, S = V.S, M = V.mats; if (V.run) { for (const m of V.run.meshes) { S.remove(m); if (m.geometry) m.geometry.dispose(); } }
  const run = { meshes: [] }, add = m => { S.add(m); run.meshes.push(m); return m; }, R0 = W3.rng(G.seed % 9999 + 1), vs = G.vines;
  const minZ = Math.min(...vs.map(v => v.z)) - 60, maxZ = 40, endZ = Math.min(...vs.map(v => v.z)) - 34;
  // the gorge: green water between banks that rise steeply, thick with growth; a cliff with a waterfall closes its far end
  const N3 = new T.ImprovedNoise(), cxAt = z => { let best = vs[0]; for (const v of vs) if (Math.abs(v.z - z) < Math.abs(best.z - z)) best = v; return best.x; };
  const H = (x, z) => { const d = Math.abs(x - cxAt(z)), wall = z < endZ ? (endZ - z) * 2.2 : 0; return Math.max(d < 18 ? -3 : Math.min(60, (d - 18) * 0.9) + N3.noise(x * 0.04, 0.5, z * 0.04) * 6, Math.min(70, wall) + N3.noise(x * 0.05, 3, z * 0.05) * 4 - 3); };
  const gt = W3.grainTex(256, 13, 200, 55, 2); gt.repeat.set(40, 40);
  const ground = W3.terrain({ size: 900, seg: 150, x: 0, z: (minZ + maxZ) / 2, height: H,
    colour: (x, z, h, sl) => { const n = 0.5 + 0.5 * N3.noise(x * 0.1, 2, z * 0.1), m = 0.5 + 0.5 * N3.noise(x * 0.02, 5, z * 0.02); if (h < 0.6) return [0.3, 0.26, 0.17]; if (sl > 0.55) return [0.33 + 0.08 * n, 0.31 + 0.06 * n, 0.25]; return [0.1 + 0.08 * n + 0.04 * m, 0.27 + 0.12 * n, 0.07 + 0.03 * m]; }, map: gt });
  run.meshes.push(ground);
  // giant trees: the vines hang from their branches, and more stand all around; trunks flare into buttress roots, mossy at the foot
  const trunkG = new T.CylinderGeometry(1, 1, 1, 20, 14, true); trunkG.translate(0, 0.5, 0); { const p = trunkG.attributes.position, col = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), h = p.getY(i), a = Math.atan2(z, x); let r = 0.5 + 0.5 * Math.pow(1 - h, 1.5); if (h < 0.14) r += Math.pow((0.14 - h) / 0.14, 2) * (0.6 + 1.1 * Math.max(0, Math.sin(5 * a + 0.7))); r *= 1 + 0.05 * Math.sin(3 * a + h * 9);
      p.setXYZ(i, Math.cos(a) * r, h, Math.sin(a) * r); const moss = Math.min(1, Math.max(0, 1 - h * 7) * 0.9 + (Math.sin(a * 2 + 1) > 0.55 ? 0.35 * (1 - h) : 0)); col.set([1 - 0.42 * moss, 1 - 0.12 * moss, 1 - 0.55 * moss], i * 3); }
    trunkG.setAttribute('color', new T.BufferAttribute(col, 3)); trunkG.computeVertexNormals(); }
  const trees = []; for (const v of vs) { const side = R0() < 0.5 ? -1 : 1; trees.push({ x: v.x + side * (5.5 + R0() * 4), z: v.z - 1 + R0() * 2, h: v.y + 8 + R0() * 10, anchor: v, side }); }
  for (let i = 0; i < 70; i++) { const z = minZ + R0() * (maxZ - minZ), side = R0() < 0.5 ? -1 : 1; trees.push({ x: cxAt(z) + side * (20 + R0() * 30), z, h: 36 + R0() * 22 }); }
  const card = (() => { const a = new T.PlaneGeometry(1, 1), b = a.clone(); b.rotateY(Math.PI / 2); const c = a.clone(); c.rotateX(Math.PI / 2); return T.mergeGeometries([a, b, c]); })();
  const TI = new T.InstancedMesh(trunkG, M.bark, trees.length), D = new T.Object3D(), C = new T.Color(), crowns = [];
  trees.forEach((t, i) => { const base = H(t.x, t.z) - 1.5; D.position.set(t.x, base, t.z); D.rotation.set((R0() - 0.5) * 0.04, R0() * 6, (R0() - 0.5) * 0.04); const tw = 0.7 + R0() * 0.8; D.scale.set(tw, t.h - base + 2, tw); D.updateMatrix(); TI.setMatrixAt(i, D.matrix); C.setHSL(0.08 + R0() * 0.04, 0.12 + R0() * 0.15, 0.55 + R0() * 0.3); TI.setColorAt(i, C);
    const n = 14 + (R0() * 6 | 0); for (let k = 0; k < n; k++) { const a = R0() * 6.28, rr = Math.sqrt(R0()) * 8.5; crowns.push({ x: t.x + Math.cos(a) * rr, y: t.h + (R0() - 0.3) * 4.5 - rr * 0.18, z: t.z + Math.sin(a) * rr, s: 5 + R0() * 4.5, ry: R0() * 6, rx: (R0() - 0.5) * 0.7, hue: R0() }); } });
  TI.castShadow = true; TI.receiveShadow = true; add(TI);
  // the walls of the gorge: leaf sprays all the way down the banks, ferns and broad leaves at the water
  const wall = [], ferns = [], broad = [];
  for (let i = 0; i < 520; i++) { const z = minZ + R0() * (maxZ - minZ), side = R0() < 0.5 ? -1 : 1, d = 18 + Math.pow(R0(), 0.7) * 30, x = cxAt(z) + side * d, h = H(x, z); if (h < 0.5) continue; wall.push({ x, y: h + 1 + R0() * 4, z, s: 3 + R0() * 4, ry: R0() * 6, rx: (R0() - 0.5) * 0.5, hue: R0() }); }
  for (let i = 0; i < 700; i++) { const z = minZ + R0() * (maxZ - minZ), side = R0() < 0.5 ? -1 : 1, d = 17.5 + Math.pow(R0(), 1.6) * 16, x = cxAt(z) + side * d, h = H(x, z); if (h < 0.1 || h > 22) continue; (R0() < 0.6 ? ferns : broad).push({ x, y: h - 0.2, z, s: 1.4 + R0() * 1.8, ry: R0() * 6 }); }
  const CI = new T.InstancedMesh(card, M.leaf, crowns.length + wall.length); let ci = 0;
  for (const q of crowns.concat(wall)) { D.position.set(q.x, q.y, q.z); D.rotation.set(q.rx, q.ry, 0); D.scale.setScalar(q.s); D.updateMatrix(); CI.setMatrixAt(ci, D.matrix); C.setHSL(0.24 + q.hue * 0.1, 0.45 + q.hue * 0.25, 0.42 + (1 - q.hue) * 0.18); CI.setColorAt(ci++, C); }
  CI.receiveShadow = true; add(CI);
  const plantCard = (() => { const a = new T.PlaneGeometry(1, 1); a.translate(0, 0.5, 0); const b = a.clone(); b.rotateY(Math.PI / 2); return T.mergeGeometries([a, b]); })();
  for (const [list, mat] of [[ferns, M.fern], [broad, M.broad]]) { const I = new T.InstancedMesh(plantCard, mat, list.length); list.forEach((q, i) => { D.position.set(q.x, q.y, q.z); D.rotation.set(0, q.ry, 0); D.scale.set(q.s, q.s * (mat === M.fern ? 1.3 : 1), q.s); D.updateMatrix(); I.setMatrixAt(i, D.matrix); C.setHSL(0.25 + (i % 7) * 0.012, 0.55, 0.45 + (i % 5) * 0.04); I.setColorAt(i, C); }); add(I); }
  // boulders in the river, mossy on top, with foam round them where the water breaks
  const rockG = new T.DodecahedronGeometry(1, 1); { const p = rockG.attributes.position, col = new Float32Array(p.count * 3); for (let i = 0; i < p.count; i++) { const y = p.getY(i), n = N3.noise(p.getX(i) * 2, y * 2, p.getZ(i) * 2); p.setXYZ(i, p.getX(i) * (1 + n * 0.25), y * (1 + n * 0.2), p.getZ(i) * (1 + n * 0.25)); const moss = y > 0.35 ? 1 : 0; col.set(moss ? [0.5, 0.72, 0.38] : [0.82, 0.8, 0.76], i * 3); } rockG.setAttribute('color', new T.BufferAttribute(col, 3)); rockG.computeVertexNormals(); }
  M.rock.vertexColors = true; const rocks = []; for (let i = 0; i < 90; i++) { const z = minZ + R0() * (maxZ - minZ), side = R0() < 0.5 ? -1 : 1, d = R0() < 0.75 ? 13 + R0() * 5 : R0() * 12, x = cxAt(z) + side * d; rocks.push({ x, z, s: 0.6 + R0() * 2.2, ry: R0() * 6 }); }
  const RI = new T.InstancedMesh(rockG, M.rock, rocks.length), FI = new T.InstancedMesh(new T.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), M.foam, rocks.length);
  rocks.forEach((r, i) => { D.position.set(r.x, -r.s * 0.35, r.z); D.rotation.set(0, r.ry, 0); D.scale.set(r.s * 1.3, r.s, r.s); D.updateMatrix(); RI.setMatrixAt(i, D.matrix); D.position.set(r.x, 0.05, r.z); D.rotation.set(0, r.ry, 0); D.scale.set(r.s * 3.6, 1, r.s * 3); D.updateMatrix(); FI.setMatrixAt(i, D.matrix); });
  RI.castShadow = true; RI.receiveShadow = true; add(RI); add(FI);
  // hanging lianas (to look at: thin and dark, away from your line), and the branches that hold the vines you catch
  const lianas = []; for (const t of trees) { if (t.anchor || Math.abs(t.x - cxAt(t.z)) < 9 || R0() < 0.45) continue; const n = 1 + (R0() * 3 | 0); for (let k = 0; k < n; k++) { const x0 = t.x + (R0() - 0.5) * 8, z0 = t.z + (R0() - 0.5) * 8, y0 = t.h - 1, len = 12 + R0() * 22, pts = [];
      for (let s = 0; s <= 8; s++) { const u = s / 8; pts.push(new T.Vector3(x0 + Math.sin(u * 3 + k) * 0.4 * u, y0 - len * u, z0 + Math.cos(u * 2 + k) * 0.4 * u)); } lianas.push(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 16, 0.04 + R0() * 0.05, 5, false)); } }
  if (lianas.length) { const lm = new T.Mesh(T.mergeGeometries(lianas), M.liana); add(lm); }
  const brG = new T.CylinderGeometry(0.12, 0.36, 1, 8); const anchors = trees.filter(t => t.anchor), BI = new T.InstancedMesh(brG, M.branch, anchors.length); const up = new T.Vector3(0, 1, 0), qq = new T.Quaternion();
  anchors.forEach((t, i) => { const hd = Math.hypot(t.anchor.x - t.x, t.anchor.z - t.z), a = new T.Vector3(t.x, t.anchor.y + 0.25 - hd * 0.42, t.z), b = new T.Vector3(t.anchor.x, t.anchor.y + 0.25, t.anchor.z), L = a.distanceTo(b) + 1.2;      /* a limb rising from the trunk to where the vine hangs, not a bar across the view */ qq.setFromUnitVectors(up, b.clone().sub(a).normalize()); D.position.copy(a).lerp(b, 0.5); D.quaternion.copy(qq); D.scale.set(1, L, 1); D.updateMatrix(); BI.setMatrixAt(i, D.matrix); D.quaternion.identity(); });
  BI.castShadow = true; add(BI);
  { const clumps = []; anchors.forEach(t => { const a = t.anchor; for (let k = 0; k < 5; k++) clumps.push({ x: a.x + (R0() - 0.5) * 3, y: a.y + 0.6 + R0() * 1.5, z: a.z + (R0() - 0.5) * 3, s: 2.2 + R0() * 1.6, ry: R0() * 6, rx: (R0() - 0.5) * 0.6, hue: R0() }); });
    const KI = new T.InstancedMesh(card, M.leaf, clumps.length); clumps.forEach((q, i) => { D.position.set(q.x, q.y, q.z); D.rotation.set(q.rx, q.ry, 0); D.scale.setScalar(q.s); D.updateMatrix(); KI.setMatrixAt(i, D.matrix); C.setHSL(0.25 + q.hue * 0.08, 0.5, 0.5); KI.setColorAt(i, C); }); add(KI); }
  // the vines you catch: a twisted rope with leaves along it, blossom where your hand goes, and a loop at the end
  run.vines = vs.map((v, i) => { const Lr = ropeOf(v), parts = [], leaves = [], flowers = [], rope = new T.CylinderGeometry(0.05, 0.068, Lr, 7, Math.max(8, Math.round(Lr * 3))); rope.translate(0, -Lr / 2, 0);
    { const p = rope.attributes.position, uv = rope.attributes.uv; for (let k = 0; k < p.count; k++) { const y = p.getY(k); p.setX(k, p.getX(k) + Math.sin(y * 1.3 + i) * 0.035); p.setZ(k, p.getZ(k) + Math.cos(y * 0.9 + i) * 0.035); uv.setY(k, -y / 0.9); } rope.computeVertexNormals(); }
    const loop = new T.TorusGeometry(0.15, 0.045, 6, 14); loop.translate(0, -Lr - 0.12, 0); parts.push(rope, loop);
    for (let y = 0.8; y < Lr - 0.3; y += 0.55 + ((i * 7 + y * 13) % 1) * 0.4) { const lf = new T.PlaneGeometry(0.42, 0.42); lf.translate(0.21, 0, 0); lf.rotateZ(-0.6); lf.rotateY(y * 2.4 + i); lf.translate(0, -y, 0); leaves.push(lf); }
    for (let k = 0; k < 5; k++) { const f = new T.CircleGeometry(0.07, 5); f.rotateY(k * 1.3); f.translate(Math.cos(k * 2.2) * 0.08, -(v.L - ARM) + 0.9 - k * 0.32, Math.sin(k * 2.2) * 0.08); flowers.push(f); }
    const geo = T.mergeGeometries([T.mergeGeometries(parts), T.mergeGeometries(leaves), T.mergeGeometries(flowers)], true), mm = [M.vine.clone(), M.leaf.clone(), M.flower.clone()]; mm.forEach(m => { m.transparent = true; m.userData.base = m.opacity; });
    const m = add(new T.Mesh(geo, mm)); m.castShadow = true; m.userData.i = i; m.position.set(v.x, v.y, v.z); return m; });
  V.ropes = vs.map(v => ({ x: 0, y: -1, z: 0, vx: 0, vz: 0, held: false }));      // each vine's swing, in the picture (the one you let go of swings back and settles)
  // the tree house at the end: a plank deck with railings, a hut with a thatched roof, a rope ladder and a lantern
  { const h = G.house, g = new T.Group(); g.position.set(h.x, h.y, h.z); add(g); const box = (w, hh, d, m, x, y, z) => { const b = new T.Mesh(new T.BoxGeometry(w, hh, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; g.add(b); return b; };
    box(7, 0.3, 6, M.plank, 0, 0, 0); for (const x of [-3.4, 3.4]) box(0.12, 1, 6, M.plank, x, 0.6, 0); box(7, 1, 0.12, M.plank, 0, 0.6, -2.95);
    { const tr = new T.Mesh(trunkG, M.bark), base = H(h.x, h.z - 4.2) - 1.5; tr.position.set(0, base - h.y, -4.2); tr.scale.set(1.9, h.y + 16 - base, 1.9); tr.castShadow = tr.receiveShadow = true; g.add(tr);
      for (const x of [-3.2, 3.2]) { const br = new T.Mesh(new T.CylinderGeometry(0.14, 0.18, 1, 6), M.branch), a = new T.Vector3(x, -0.15, 2.6), b = new T.Vector3(x * 0.25, -6, -3.4), L = a.distanceTo(b); br.position.copy(a).lerp(b, 0.5); br.scale.set(1, L, 1); br.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), a.clone().sub(b).normalize()); br.castShadow = true; g.add(br); }
      for (let k = 0; k < 18; k++) { const c = new T.Mesh(card, M.leaf); const a = k * 2.1, rr = 2 + (k % 5) * 1.6; c.position.set(Math.cos(a) * rr, 12 + (k % 4) * 1.4, -4.2 + Math.sin(a) * rr); c.scale.setScalar(6 + (k % 3) * 1.5); c.rotation.set((k % 3 - 1) * 0.3, a, 0); g.add(c); } }
    box(4.2, 2.6, 3.4, M.plank, 0, 1.45, -1); const roof = new T.Mesh(new T.ConeGeometry(3.8, 2.2, 4, 1, true), M.thatch); roof.position.set(0, 3.85, -1); roof.rotation.y = Math.PI / 4; roof.castShadow = true; g.add(roof);
    const door = new T.Mesh(new T.PlaneGeometry(1, 1.8), new T.MeshStandardMaterial({ color: 0x1a120a })); door.position.set(0, 1.05, 0.71); g.add(door);
    const lamp = new T.Mesh(new T.SphereGeometry(0.16, 10, 8), new T.MeshStandardMaterial({ color: 0xffd080, emissive: 0xffb040, emissiveIntensity: 2 })); lamp.position.set(1.6, 2.4, 0.85); g.add(lamp); const pl = new T.PointLight(0xffb060, 6, 14, 1.6); pl.position.copy(lamp.position); g.add(pl);
    for (const x of [-0.3, 0.3]) { const r = new T.Mesh(new T.CylinderGeometry(0.025, 0.025, 7, 5), M.liana); r.position.set(x + 2.4, -3.5, 2.9); g.add(r); } for (let k = 0; k < 12; k++) box(0.7, 0.05, 0.08, M.plank, 2.4, -0.4 - k * 0.55, 2.9);
    const flag = new T.Mesh(new T.PlaneGeometry(1.3, 0.75), new T.MeshStandardMaterial({ color: 0xe8b23a, side: T.DoubleSide })); flag.position.set(2.6, 5.4, -1); g.add(flag); box(0.08, 3, 0.08, M.branch, 1.9, 4.3, -1); run.flag = flag; }
  // the waterfall at the gorge's end, and mist on the water
  { const fx = cxAt(endZ), slope = Math.atan(2.2), len = 50, wf = add(new T.Mesh(new T.PlaneGeometry(14, len, 1, 1), M.fall)); wf.rotation.x = -(Math.PI / 2 - slope); wf.position.set(fx, Math.sin(slope) * len / 2 - 2.5, endZ - Math.cos(slope) * len / 2 + 2.2); run.fall = wf; const fz = endZ;
    const base = add(new T.Mesh(new T.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), M.foam.clone())); base.position.set(fx, 0.1, fz + 3); base.scale.set(26, 1, 12); base.material.opacity = 0.75;
    for (let i = 0; i < 6; i++) { const sp = add(new T.Sprite(M.mist.clone())); sp.position.set(fx + (R0() - 0.5) * 14, 2 + R0() * 5, fz + 3 + R0() * 6); sp.scale.set(14, 9, 1); sp.material.opacity = 0.32; } }
  for (let i = 0; i < 16; i++) { const z = minZ + R0() * (maxZ - minZ), sp = add(new T.Sprite(M.mist)); sp.position.set(cxAt(z) + (R0() - 0.5) * 26, 1.2 + R0() * 3, z); sp.scale.set(18 + R0() * 14, 4 + R0() * 3, 1); }
  // light falling through the leaves: soft shafts
  for (let i = 0; i < 12; i++) { const z = minZ + R0() * (maxZ - minZ), sh = add(new T.Mesh(new T.CylinderGeometry(1.5, 4, 60, 12, 1, true), new T.MeshBasicMaterial({ color: 0xfff1c8, transparent: true, opacity: 0.05, depthWrite: false, side: T.DoubleSide, fog: false })));
    sh.position.set(cxAt(z) + (R0() - 0.5) * 20, 28, z); sh.rotation.z = 0.3; sh.userData.shaft = true; }
  run.seed = G.seed; run.n = vs.length; run.cx = cxAt(0); V.run = run; V.cxAt = cxAt;
}
function setWeather(G) {
  const V = buildWorld(); if (V.none || V.sky === G.weather) return; V.sky = G.weather;
  W3.setSky(G.weather, { azim: 150, wind: [0.2, 0.1] }); if (W3.S.night || W3.S.rain || G.weather === 'dusk') { W3.S.exposure *= 1.35; W3.R.toneMappingExposure = W3.S.exposure; }
  if (V.fill) V.fill.intensity = W3.S.night ? 0.25 : W3.S.rain ? 0.55 : 0.9;
  const shafts = W3.S.rain || W3.S.night || W3.S.name === 'overcast' ? 0 : 1; if (V.run) for (const m of V.run.meshes) if (m.userData.shaft) m.visible = !!shafts;
}
function onEvent(G, e) {
  const cx = W / 2, cy = H * 0.3;
  switch (e.k) {
    case 'letgo': sfx.whoosh(); vibe(HAP.tick); ui.relT = 0; break;
    case 'catch': ui.catchT = 0.45; sfx.catch(e.streak, e.fine); FX.shake = 4; vibe(HAP.light); if (e.fine) say('PERFECT CATCH', cx, cy, '#ffe9a8', 24); else if (e.streak >= 3 && e.streak % 3 === 0) say(`${e.streak} IN A ROW`, cx, cy, '#ffe9a8', 22); break;
    case 'air': ui.airT = 0.5; sfx.air(); say('NOTHING THERE', cx, cy + 40, '#ffd0c4', 20); tip('air', 'Wait until your hand reaches the vine', 2.6); break;
    case 'busy': break;
    case 'fall': sfx.fall(); FX.shake = 8; say('SPLASH!', cx, cy, '#ffb4a8', 30); tip('fall', 'Let go at the gold mark on the swing, and close your hand as the vine reaches it', 3.2); if (V3 && !V3.none) V3.splash = { x: e.x, z: e.z, t: 0 }; break;
    case 'back': ui.fadeIn = 0.45; ui.snap = true; break;
    case 'vines': if (V3 && !V3.none) buildRun(G); break;
    case 'lessonnext': if (e.first) hint = null; say(e.first ? 'FIRST, A LESSON' : 'NEXT LESSON', cx, H * 0.5, '#ffd36a', 26); sfx.ding(); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, cx, H * 0.5, '#9be3b5', 26); sfx.coin(e.n); break;
    case 'lessonmiss': hint = { txt: e.how, t: 0, secs: 3.6 }; break;
    case 'lessondone': say('YOU HAVE IT. TO THE TREE HOUSE!', cx, H * 0.5, '#ffd36a', 22); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); vibe(HAP.best); FX.flash = 0.5; break;
    case 'lost': sfx.lose(); say(e.why === 'time' ? 'THE LIGHT IS GONE' : 'TOO MANY FALLS', cx, H * 0.5, '#ffd0c4', 26); break;
  }
}
const ui = { snap: false, relT: 9, catchT: 0, airT: 0, fadeIn: 0 };
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#0b1418'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D jungle.', W / 2, H / 2); return; }
  const T = V.T, cam = W3.cam, g = G || idleG(), p = g.p, t = now;
  if (!V.run || V.run.seed !== g.seed || V.run.n !== g.vines.length) buildRun(g);
  setWeather(g);
  // vines (23 Nov 2026, his words: "On Vine, the vines are disappearing... They shouldn't disappear... render it like invisible, but it
  // should still be kind of seeable"): nothing is cut away any more. Each vine is a rope that swings on its own: the one you hold runs
  // through your hands; the one you let go of swings back on, and settles; the rest stir in the air. A vine that comes close to the
  // camera turns see-through (never less than a fifth), so it never blocks the view and never vanishes.
  const camP = V.camPos, tmp = new T.Vector3(), down = new T.Vector3(0, -1, 0);
  for (const m of V.run.vines) { const i = m.userData.i, v = g.vines[i]; if (!v) { m.visible = false; continue; } m.visible = true; const r = V.ropes[i] || (V.ropes[i] = { x: 0, y: -1, z: 0, vx: 0, vy: 0, vz: 0 }), Lr = ropeOf(v), Lp = Lr * 0.66;
    if (g.held && i === g.on && !g.down) { const dx = p.x - v.x, dy = p.y - v.y, dz = p.z - v.z, d = Math.hypot(dx, dy, dz) || 1, R = d; r.x = dx / d; r.y = dy / d; r.z = dz / d; const f = 1 / R; r.vx = p.vx * f; r.vy = p.vy * f; r.vz = p.vz * f; }
    else { const k2 = Math.min(dt, 1 / 30); r.vy -= 9.8 / Lp * k2; r.vx += Math.sin(t * 0.6 + i * 1.7) * 0.004 * k2; r.vz += Math.cos(t * 0.5 + i) * 0.003 * k2; const damp = 1 - Math.min(1, 0.55 * k2); r.vx *= damp; r.vy *= damp; r.vz *= damp;
      r.x += r.vx * k2; r.y += r.vy * k2; r.z += r.vz * k2; const n = Math.hypot(r.x, r.y, r.z) || 1; r.x /= n; r.y /= n; r.z /= n; const vr = r.vx * r.x + r.vy * r.y + r.vz * r.z; r.vx -= vr * r.x; r.vy -= vr * r.y; r.vz -= vr * r.z; }
    m.position.set(v.x, v.y, v.z); tmp.set(r.x, r.y, r.z); m.quaternion.setFromUnitVectors(down, tmp);
    // how near the camera comes to this rope: closer than about three metres, it fades (to a fifth at the nearest)
    const ax = camP.x - v.x, ay = camP.y - v.y, az = camP.z - v.z, u = clamp(ax * r.x + ay * r.y + az * r.z, 0, Lr), dd = Math.hypot(ax - r.x * u, ay - r.y * u, az - r.z * u), op = clamp((dd - 0.9) / 2.2, 0.2, 1);
    const next = i === g.on + 1; m.material.forEach((mt, j) => { mt.opacity = op; mt.depthWrite = op > 0.98; if (j === 2) mt.emissiveIntensity = next ? 0.5 + 0.6 * (0.5 + 0.5 * Math.sin(t * 4)) : 0.25; }); }
  // the swinger
  { const H = V.H; ui.relT += dt; ui.catchT = Math.max(0, ui.catchT - dt); ui.airT = Math.max(0, ui.airT - dt); V.P.position.set(p.x, p.y, p.z);
    if (g.held && !g.down) { const v = g.vines[g.on], A = new T.Vector3(v.x, v.y, v.z), B = new T.Vector3(p.x, p.y, p.z), dirA = B.clone().sub(A).normalize(), jolt = ui.catchT / 0.45;
      // his body hangs along the rope from his hands, facing the way he swings, trailing a little behind the rope as it speeds and slows
      const U = dirA.clone().negate(), F = new T.Vector3(Math.sin(g.phi), 0, -Math.cos(g.phi)); F.addScaledVector(U, -F.dot(U)).normalize(); const Z = F.clone().negate(), X = new T.Vector3().crossVectors(U, Z);
      V.P.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(X, U, Z)); V.P.rotateX(clamp(-g.om * 0.14 - jolt * 0.25, -0.4, 0.4)); V.P.updateMatrixWorld(true);
      const h1 = V.P.worldToLocal(A.clone().addScaledVector(dirA, g.rh)), h2 = V.P.worldToLocal(A.clone().addScaledVector(dirA, g.rh + 0.14));      // both hands closed on the rope, one above the other
      humReach(H, 1, h1.x + 0.03, h1.y, h1.z); humReach(H, 0, h2.x - 0.03, h2.y, h2.z); humGrip(H, 1, dt);
      // his legs pump the swing: thrown forward as he swings forward (hardest while he is pumping), tucked as he swings back
      const pump = g.kick > 0 ? 1 : 0, fwd = clamp(g.om * 0.9, -1, 1), kick = 0.2 + 0.55 * fwd + 0.25 * pump * Math.max(0, fwd) + jolt * 0.5, tuck = clamp(0.45 - g.om * 0.6, 0.12, 1.4);
      humLegs(H, [kick + 0.08, tuck * 0.85, 0.05], [kick - 0.1, tuck, 0.05]); H.neck.rotation.x = clamp(-0.15 - g.om * 0.1, -0.5, 0.3); H.head.userData.band.rotation.x = clamp(0.5 + g.om * 0.5, -0.4, 1.4); }
    else { const hd = Math.atan2(-p.vx, -p.vz), fallF = g.down > 0 ? 1 : clamp((-p.vy - 6) / 8, 0, 1), pitch = clamp(-p.vy * 0.04, -0.4, 0.6) + fallF * 0.4; V.P.quaternion.setFromEuler(new T.Euler(pitch, hd, 0, 'YXZ')); V.P.updateMatrixWorld(true);
      const nv = g.vines[g.on + 1], u = clamp(ui.relT / 0.22, 0, 1), miss = ui.airT > 0 || g.grabT > 0;
      for (let i = 0; i < 2; i++) { const sx = i ? 1 : -1; let tx = sx * 0.17, ty = 0.78, tz = -0.42;
        if (nv && !miss && !g.down) { const q = V.P.worldToLocal(new T.Vector3(nv.x, clamp(p.y + ARM, nv.y - ropeOf(nv), nv.y), nv.z)), sh = new T.Vector3(sx * 0.2, H.SH, 0), d = q.sub(sh), l = d.length() || 1; d.multiplyScalar(Math.min(l, 0.56) / l); tx = sh.x + d.x - sx * 0.02; ty = Math.max(sh.y + d.y, H.SH + 0.36) + (i ? 0.03 : -0.06); tz = Math.max(sh.z + d.z, -0.36); }
        if (miss || fallF > 0.5) { const w = t * 15 + i * 2.4; tx = sx * 0.34; ty = 0.62 + Math.sin(w) * 0.26; tz = -0.18 + Math.cos(w) * 0.26; }
        humReach(H, i, tx * u + sx * 0.02 * (1 - u), ty * u + (ARM - (i ? 0 : 0.13)) * (1 - u), tz * u); }
      humGrip(H, ui.airT > 0.3 ? 1 : 0, dt); const st = Math.sin(t * 6.5) * (0.3 + 0.5 * fallF);
      humLegs(H, [0.75 + st, 1.0 - st * 0.4, 0.06], [-0.45 - st, 0.75 + st * 0.4, 0.06]); H.neck.rotation.x = clamp(-pitch * 0.8 - 0.25, -0.8, 0.4); H.head.userData.band.rotation.x = 1.1 + Math.sin(t * 9) * 0.2; } }
  // the splash where he fell in, spreading rings on the water
  if (V.splash) { const s = V.splash; s.t += dt; if (!s.m) { s.m = []; for (let k = 0; k < 3; k++) { const m = new T.Mesh(new T.RingGeometry(0.7, 1, 32).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, depthWrite: false })); m.position.set(s.x, 0.08, s.z); V.S.add(m); s.m.push(m); }
      s.burst = new T.Sprite(new T.SpriteMaterial({ map: V.mats.foam.map, color: 0xffffff, transparent: true, depthWrite: false })); s.burst.position.set(s.x, 1, s.z); V.S.add(s.burst); }
    s.m.forEach((m, k) => { const u = Math.max(0, s.t - k * 0.18); m.scale.setScalar(0.5 + u * 4); m.material.opacity = Math.max(0, 0.8 - u * 0.6); }); const b = clamp(s.t / 0.5, 0, 1); s.burst.scale.set(2 + b * 3, 3 * Math.sin(b * Math.PI) + 0.01, 1); s.burst.position.y = 0.4 + b * 1.4; s.burst.material.opacity = 0.9 * (1 - b);
    if (s.t > 2.2) { s.m.forEach(m => V.S.remove(m)); V.S.remove(s.burst); V.splash = null; } }
  // the life of the place: the waterfall runs, the flag stirs, motes drift in the light, parrots cross the gorge
  if (V.mats.fall.map) V.mats.fall.map.offset.y = (V.mats.fall.map.offset.y - dt * 1.4) % 1; if (V.run.flag) V.run.flag.rotation.y = Math.sin(t * 3) * 0.35;
  { const mp = V.motes.geometry.attributes.position, lit = !(W3.S.night || W3.S.rain); V.motes.visible = lit; if (lit) { V.moteP.forEach((q, i) => mp.setXYZ(i, p.x + q.x + Math.sin(t * 0.3 + q.ph) * 0.8, p.y + q.y + Math.sin(t * 0.21 + q.ph * 2) * 0.6, p.z + q.z - 2 + Math.cos(t * 0.25 + q.ph) * 0.8)); mp.needsUpdate = true; } }
  for (const b of V.birds) { b.ph += dt * b.sp; const a = b.ph * 6.28, cz = p.z - 30, cx = V.cxAt ? V.cxAt(cz) : 0; b.g.position.set(cx + Math.cos(a + b.off) * b.r, b.h + Math.sin(a * 2) * 2, cz + Math.sin(a + b.off) * b.r * 0.6); b.g.rotation.y = -(a + b.off) - Math.PI / 2 + Math.PI; b.wings.forEach((w, k) => w.rotation.z = (k ? -1 : 1) * Math.sin(t * 13 + b.off) * 0.7); }
  // the camera: behind him and a little above, turning with the way he swings, looking ahead to the next vine
  if (W3.cam.near !== 0.1) { W3.cam.near = 0.1; W3.cam.updateProjectionMatrix(); }
  const yawT = g.held && !g.down ? g.phi : Math.atan2(p.vx, -p.vz || -1e-3); if (V.camYaw == null || ui.snap) V.camYaw = yawT; else { let dy = yawT - V.camYaw; while (dy > Math.PI) dy -= 2 * Math.PI; while (dy < -Math.PI) dy += 2 * Math.PI; V.camYaw += dy * Math.min(1, dt * 2); }
  const fx = Math.sin(V.camYaw), fz = -Math.cos(V.camYaw), nv = g.vines[g.on + 1] || g.vines[g.on], want = new T.Vector3(p.x - fx * 3.6 - fz * 0.5, p.y + 1.35, p.z - fz * 3.6 + fx * 0.5), look = new T.Vector3((p.x + nv.x) / 2, (p.y + nv.y - nv.L * 0.6) / 2 + 0.4, (p.z + nv.z) / 2 + fz * 2);
  if (ui.snap || !V.started) { V.camPos.copy(want); V.look.copy(look); V.started = true; } else { V.camPos.lerp(want, Math.min(1, dt * 4)); V.look.lerp(look, Math.min(1, dt * 4)); } ui.snap = false;
  cam.position.copy(V.camPos); cam.fov = innerWidth > innerHeight ? 54 : 62; cam.updateProjectionMatrix(); cam.lookAt(V.look);
  /* 22 Nov 2026 (the audit): under the trees at dusk, at night and in rain the swinger was a dark speck. The camera is closer, and a soft lamp travels with the swinger so they and the next vine are always lit. */
  if (!V.lamp) { V.lamp = new T.PointLight(0xfff0d8, 0, 16, 1.4); V.S.add(V.lamp); } V.lamp.position.set(p.x + 0.6, p.y + 1.4, p.z + 2.4); V.lamp.intensity = W3.S.night ? 26 : (W3.S.rain || W3.S.name === 'dusk' || W3.S.name === 'overcast' || W3.S.name === 'mist') ? 16 : 6;
  if (FX.shake > 0) { cam.rotation.x += (Math.random() - 0.5) * FX.shake * 0.002; cam.rotation.y += (Math.random() - 0.5) * FX.shake * 0.002; }
  W3.setFocus(p.x, p.y, p.z, 10);
  W3.render(dt);
  if (G) hud(G);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const a = t2.t < 0.9 ? 1 : 1 - (t2.t - 0.9) / 0.4; ctx.globalAlpha = Math.max(0, a); ctx.font = `700 ${Math.round(t2.size * k)}px ${BC}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 26 * k); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 26 * k); }
  ctx.globalAlpha = 1;
  if (hint) { const a = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, a); ctx.font = `700 ${Math.round(16 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 20 * k, h = lines.length * lh + 16 * k, w = Math.min(W - 24, Math.max(...lines.map(l => ctx.measureText(l).width)) + 34);
    ctx.fillStyle = 'rgba(0,0,0,.55)'; rrect(W / 2 - w / 2, H * 0.78 - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.78 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,60,40,${FX.red * 0.18})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,248,230,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); }
  // a fall is a cut: the splash, then dark, then back on the vine (it was a jump with no break)
  ui.fadeIn = Math.max(0, ui.fadeIn - dt); const fa = g.down > 0 ? clamp((0.55 - g.down) / 0.5, 0, 1) : ui.fadeIn / 0.45; if (fa > 0) { ctx.fillStyle = `rgba(4,10,8,${fa})`; ctx.fillRect(0, 0, W, H); }
}
let IG = null; function idleG() { if (!IG) IG = newGame(Math.max(1, store.get('level', 1) | 0), { seed: 4 }); step(IG, 1 / 60); IG.ev.length = 0; IG.time = 999; if (!IG.held) attach(IG, IG.on, -0.5, 0.9); return IG; }
function weatherName(w) { return { dawn: 'DAWN', morning: 'MORNING', golden: 'GOLDEN HOUR', overcast: 'GREY SKY', mist: 'MIST', sunset: 'SUNSET', noon: 'MIDDAY', dusk: 'DUSK', rain: 'RAIN', storm: 'STORM' }[w] || ''; }
function hud(G) {
  const c = G.cfg, x = 14, y = 44 * k;
  if (G.lesson) lessonPanel(G);
  else { const w = W - 2 * x - 80 * k, u = G.on / (G.vines.length - 1);
    ctx.fillStyle = 'rgba(0,0,0,.3)'; rrect(x, y + 4 * k, w, 8 * k, 4); ctx.fill(); ctx.fillStyle = '#9be36a'; rrect(x, y + 4 * k, Math.max(8, w * u), 8 * k, 4); ctx.fill();
    for (let i = 0; i < c.lives; i++) { ctx.beginPath(); ctx.arc(W - x - 10 * k - i * 20 * k, y + 8 * k, 6 * k, 0, TAU); ctx.fillStyle = i < G.lives ? '#ffcf5a' : 'rgba(255,255,255,.25)'; ctx.fill(); }
    const tu = G.time / c.time; ctx.fillStyle = 'rgba(0,0,0,.3)'; rrect(x, y + 20 * k, w, 3 * k, 2); ctx.fill(); ctx.fillStyle = tu > 0.25 ? 'rgba(255,225,150,.9)' : '#ff8a6a'; rrect(x, y + 20 * k, Math.max(3, w * tu), 3 * k, 2); ctx.fill();
    ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText(`${G.vines.length - 1 - G.on} vines to the tree house`, x, y + 34 * k); }
  if (G.t < 3.2 && !G.lesson) { ctx.globalAlpha = Math.min(1, (3.2 - G.t) / 0.6); ctx.textAlign = 'center'; ctx.font = `700 ${Math.round(15 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.45)';
    const s = `CANOPY ${G.N} · ${weatherName(G.weather)} · ${c.vines} VINES`; ctx.strokeText(s, W / 2, H * 0.2); ctx.fillText(s, W / 2, H * 0.2); ctx.globalAlpha = 1; }
  // the swing meter: where on the swing you are, and the moment to let go for the next vine (a gold notch)
  if (G.held && G.vines[G.on + 1] && (G.N <= 5 || G.lesson)) { const cx = W / 2, cy = H * 0.86, r = 70 * k, nv = G.vines[G.on + 1];
    ctx.lineWidth = 6 * k; ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.arc(cx, cy - r * 0.2, r, Math.PI * 0.15 + Math.PI / 2, Math.PI * 0.85 + Math.PI / 2 + Math.PI, false); ctx.stroke();
    const ang = th => Math.PI / 2 - th * 0.9, b = G.best, ok = b && b.rel != null && b.d < REACH, sp = Math.max(0.08, c.spread);
    if (ok) { const best = ang(b.rel); ctx.strokeStyle = 'rgba(255,214,110,.9)'; ctx.beginPath(); ctx.arc(cx, cy - r * 0.2, r, best - sp, best + sp); ctx.stroke(); }
    else if (b) { ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillText('SWING HIGHER: WAIT', cx, cy - r * 0.2 - r - 10 * k); }
    const a = ang(G.th); ctx.fillStyle = G.om > 0 ? '#fff' : 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r, cy - r * 0.2 + Math.sin(a) * r, 7 * k, 0, TAU); ctx.fill(); }
}
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) {
  const D = G.lesson, st = D.steps[D.i], x = 14, w = W - 28, y = 42 * k; ctx.save();
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; const lines = wrapText(st.how, w - 24), h = 54 * k + lines.length * 17 * k;
  ctx.fillStyle = 'rgba(0,0,0,.55)'; rrect(x, y, w, h, 12); ctx.fill(); ctx.strokeStyle = 'rgba(255,211,106,.7)'; ctx.lineWidth = 2; rrect(x, y, w, h, 12); ctx.stroke();
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#ffd36a'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillText(`LESSON ${D.i + 1} OF ${D.steps.length}`, x + 12, y + 10 * k);
  ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(18 * k)}px ${BC}`; ctx.fillText(st.title, x + 12, y + 25 * k);
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.9)'; lines.forEach((l, i) => ctx.fillText(l, x + 12, y + 48 * k + i * 17 * k));
  for (let i = 0; i < st.need; i++) { ctx.beginPath(); ctx.arc(x + w - 16 - (st.need - 1 - i) * 18 * k, y + 18 * k, 6 * k, 0, TAU); if (i < D.n) { ctx.fillStyle = '#8fe0ab'; ctx.fill(); } else { ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; ctx.stroke(); } }
  ctx.restore();
}
