// ===================== THE VIEW: Soar in 3D (three.js through tools/world3d.js) =====================
// A sea of islands under a real sky; a crimson cape, seen from just behind, rippling as it flies; rings of light ahead; clouds to
// fly through, gulls, the sun on the water.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [];
let hint = null, V3 = null;
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 6) TXT.shift(); }
function tip(key, txt, secs = 2.8) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function fxStep(dt) {
  FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.3) TXT.shift();
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; }
}
function buildWorld() {
  if (V3) return V3; const T = THREE; if (!W3 || !W3.init({ canvas: $('gl'), fov: 66, far: 9000, near: 0.1 })) { V3 = { none: true }; return V3; }
  const S = W3.scene, R0 = W3.rng(19);
  // the flier (23 Nov 2026, his review: "It doesn't even need to be a person flying you can just make a cape flying and flappy through the air"): a cape
  // by itself, crimson with a gold hem, fastened by a gold clasp at the front, rippling from collar to tail and flapping at its corners
  const sea = W3.water({ size: 20000, color: 0x0b6f86, distort: 1.4, ripple: 0.6, speed: 0.5 });
  const P = new T.Group(), CW = 10, CL = 18, capeG = new T.PlaneGeometry(1, 1, CW, CL), capeCol = new Float32Array((CW + 1) * (CL + 1) * 3);
  for (let iz = 0; iz <= CL; iz++) for (let ix = 0; ix <= CW; ix++) { const n = iz * (CW + 1) + ix, sx = ix / CW - 0.5, u = iz / CL, hem = Math.abs(sx) > 0.41 || u > 0.93, band = Math.abs(sx) > 0.33 || u > 0.86, c = hem ? [1, 0.78, 0.25] : band ? [0.62, 0.07, 0.16] : [0.86 - 0.12 * Math.abs(sx), 0.13, 0.2]; capeCol.set(c, n * 3); }
  capeG.setAttribute('color', new T.BufferAttribute(capeCol, 3));
  const capeM = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, side: T.DoubleSide, emissive: 0x4a0810, emissiveIntensity: 0.35 }), cape = new T.Mesh(capeG, capeM); cape.castShadow = true; cape.frustumCulled = false; P.add(cape);
  const gold = new T.MeshStandardMaterial({ color: 0xffd060, metalness: 0.9, roughness: 0.2, emissive: 0xffa020, emissiveIntensity: 0.5 }), clasp = new T.Mesh(new T.OctahedronGeometry(0.11, 0), gold); clasp.position.set(0, 0.02, -0.06); clasp.scale.set(1, 0.6, 1.3); P.add(clasp);
  for (const sx of [-1, 1]) { const cord = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 0.34, 6), gold); cord.rotation.z = Math.PI / 2 - sx * 0.35; cord.position.set(sx * 0.17, 0.02, 0.0); P.add(cord); }
  S.add(P);
  // rings (his review: "The rings are ugly. Make them more pretty"): each is a hoop of light: a bright core, a soft glow round it, a halo, a pearly
  // film across it that turns, and twelve gems that travel round the hoop. Each ring along the trail is the next colour of the rainbow.
  const haloC = document.createElement('canvas'); haloC.width = haloC.height = 256; { const g = haloC.getContext('2d'), gr = g.createRadialGradient(128, 128, 60, 128, 128, 128); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.42, 'rgba(255,255,255,0)'); gr.addColorStop(0.61, 'rgba(255,255,255,.5)'); gr.addColorStop(0.7, 'rgba(255,255,255,.14)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); }
  const haloTex = new T.CanvasTexture(haloC), filmC = document.createElement('canvas'); filmC.width = filmC.height = 256; { const g = filmC.getContext('2d'); for (let a = 0; a < 48; a++) { g.save(); g.translate(128, 128); g.rotate(a / 48 * 6.283); const gr = g.createLinearGradient(0, 0, 124, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.55, `hsla(${a * 30 % 360},90%,80%,.05)`); gr.addColorStop(1, `hsla(${a * 30 % 360},95%,82%,${a % 4 === 0 ? 0.5 : 0.22})`); g.fillStyle = gr; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 124, -0.07, 0.07); g.closePath(); g.fill(); g.restore(); } }
  const filmTex = new T.CanvasTexture(filmC), add = (o2) => new T.MeshBasicMaterial(Object.assign({ transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide }, o2));
  const coreG = new T.TorusGeometry(1, 0.022, 8, 72), glowG = new T.TorusGeometry(1, 0.06, 8, 72), gemG = new T.OctahedronGeometry(0.075, 0), rings = [];
  for (let i = 0; i < 6; i++) { const g = new T.Group(), core = new T.Mesh(coreG, new T.MeshBasicMaterial({ color: 0xfffbe8, transparent: true })), glow = new T.Mesh(glowG, add({ color: 0xffc040, opacity: 0.5 })), halo = new T.Mesh(new T.PlaneGeometry(3.3, 3.3), add({ map: haloTex, color: 0xffc040, opacity: 0.8 })), film = new T.Mesh(new T.CircleGeometry(0.985, 48), add({ map: filmTex, opacity: 0.5 })), gems = new T.Group();
    for (let q = 0; q < 12; q++) { const gm = new T.Mesh(gemG, new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.9, roughness: 0.15, metalness: 0.3, transparent: true })); gm.position.set(Math.cos(q / 12 * 6.283), Math.sin(q / 12 * 6.283), 0); gm.scale.setScalar(q % 3 === 0 ? 1.5 : 1); gems.add(gm); }
    g.add(halo, film, glow, core, gems); g.userData = { core, glow, halo, film, gems, pop: 0, of: null }; S.add(g); rings.push(g); }
  // the trail of sparks that leads from you to the next ring and on to the ones after it
  const NG = 64, gdG = new T.BufferGeometry(); gdG.setAttribute('position', new T.BufferAttribute(new Float32Array(NG * 3), 3)); gdG.setAttribute('a', new T.BufferAttribute(new Float32Array(NG), 1));
  // clouds to fly through: soft billboards
  const cc = document.createElement('canvas'); cc.width = cc.height = 128; { const g = cc.getContext('2d'); for (let i = 0; i < 26; i++) { const x = 30 + R0() * 68, y = 40 + R0() * 50, r = 14 + R0() * 26, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); } }
  const cloudTex = new T.CanvasTexture(cc), clouds = [];
  // (his review: "Make the surroundings really beautiful here its very important".) Clouds in heaped clumps at every height, some down where you fly;
  for (let i = 0; i < 34; i++) { const cx = (R0() - 0.5) * 3800, cy = 70 + R0() * 190, cz = (R0() - 0.5) * 3800 - 400, big = 50 + R0() * 90, n = 4 + (R0() * 4 | 0);
    for (let q = 0; q < n; q++) { const sp = new T.Sprite(new T.SpriteMaterial({ map: cloudTex, transparent: true, depthWrite: false, opacity: 0.92, fog: true })), s = big * (0.55 + R0() * 0.7); sp.scale.set(s * 1.25, s * 0.7, 1); sp.position.set(cx + (R0() - 0.5) * big * 1.6, cy + (R0() - 0.3) * big * 0.35 + (q === 0 ? 0 : big * 0.12), cz + (R0() - 0.5) * big * 0.9); S.add(sp); clouds.push(sp); } }
  // hot-air balloons in stripes, drifting; sailing boats on the sea; a rainbow over the far water
  const balloons = [], stripe = (cols) => { const c = document.createElement('canvas'); c.width = 128; c.height = 64; const g = c.getContext('2d'); for (let q = 0; q < 8; q++) { g.fillStyle = cols[q % cols.length]; g.fillRect(q * 16, 0, 16, 64); } g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(0, 26, 128, 6); const t2 = new T.CanvasTexture(c); t2.colorSpace = T.SRGBColorSpace; return t2; };
  const BCOL = [['#e8443a', '#fff4d6'], ['#f2a13a', '#3a78c9'], ['#8a4fd0', '#ffd24a'], ['#2fa37a', '#fff4d6', '#e8443a'], ['#e85a9a', '#ffe9f2']], envG = new T.SphereGeometry(1, 20, 16), basketM = new T.MeshStandardMaterial({ color: 0x8a5a2a, roughness: 0.9 });
  { const pa = envG.attributes.position; for (let q = 0; q < pa.count; q++) { const y = pa.getY(q); if (y < 0) { const kq = 1 + y * 0.55; pa.setX(q, pa.getX(q) * kq); pa.setZ(q, pa.getZ(q) * kq); pa.setY(q, y * 1.35); } } envG.computeVertexNormals(); }
  for (let i = 0; i < 7; i++) { const g = new T.Group(), env = new T.Mesh(envG, new T.MeshStandardMaterial({ map: stripe(BCOL[i % BCOL.length]), roughness: 0.6, emissive: 0x332211, emissiveIntensity: 0.25 })); env.scale.setScalar(7); env.position.y = 9; const bk = new T.Mesh(new T.BoxGeometry(1.6, 1.3, 1.6), basketM); bk.position.y = -2.6; g.add(env, bk);
    for (const [ax, az] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const rp = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 3.4, 4), basketM); rp.position.set(ax * 0.9, -0.6, az * 0.9); rp.rotation.set(az * 0.2, 0, -ax * 0.2); g.add(rp); } S.add(g); balloons.push({ g, x: (R0() - 0.5) * 1500, z: -150 - R0() * 1500, y: 55 + R0() * 110, ph: R0() * 6, sp: 0.6 + R0() }); }
  const boats = [], hullM = new T.MeshStandardMaterial({ color: 0x7a4a2a, roughness: 0.7 }), sailM = new T.MeshStandardMaterial({ color: 0xfffaf0, roughness: 0.8, side: T.DoubleSide, emissive: 0x554a40, emissiveIntensity: 0.3 });
  const sailG = new T.BufferGeometry(); sailG.setAttribute('position', new T.Float32BufferAttribute([0, 0.6, 0.3, 0, 9, 0.3, 0, 0.6, -4.2, 0, 0.9, 0.7, 0, 7.5, 0.7, 0, 0.9, 3.6], 3)); sailG.computeVertexNormals();
  for (let i = 0; i < 12; i++) { const g = new T.Group(), hull = new T.Mesh(new T.CapsuleGeometry(1.1, 5.5, 3, 8), hullM); hull.rotation.x = Math.PI / 2; hull.scale.set(1, 0.55, 1); hull.position.y = 0.2; const mast = new T.Mesh(new T.CylinderGeometry(0.07, 0.09, 9.5, 5), hullM); mast.position.set(0, 4.8, 0.5); g.add(hull, mast, new T.Mesh(sailG, sailM)); g.visible = false; S.add(g); boats.push({ g, ph: R0() * 6, a: R0() * 6.28, sp: 1.5 + R0() * 2 }); }
  const rbC = document.createElement('canvas'); rbC.width = 4; rbC.height = 64; { const g = rbC.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 64); [['rgba(255,60,60,0)', 0], ['rgba(255,60,60,.5)', 0.12], ['rgba(255,170,40,.5)', 0.28], ['rgba(255,240,70,.5)', 0.42], ['rgba(80,220,110,.5)', 0.56], ['rgba(70,150,255,.5)', 0.72], ['rgba(150,90,230,.45)', 0.86], ['rgba(150,90,230,0)', 1]].forEach(([c, o2]) => gr.addColorStop(o2, c)); g.fillStyle = gr; g.fillRect(0, 0, 4, 64); }
  const rainbow = new T.Mesh(new T.RingGeometry(820, 900, 96, 1, 0, Math.PI), new T.MeshBasicMaterial({ map: new T.CanvasTexture(rbC), transparent: true, depthWrite: false, opacity: 0.55, fog: false, side: T.DoubleSide }));
  { const uv = rainbow.geometry.attributes.uv, ps = rainbow.geometry.attributes.position; for (let q = 0; q < uv.count; q++) { const r = Math.hypot(ps.getX(q), ps.getY(q)); uv.setXY(q, 0.5, (r - 820) / 80); } } rainbow.position.set(500, -40, -2600); S.add(rainbow);
  // gulls: a few, wheeling
  const gullG = new T.BufferGeometry(); gullG.setAttribute('position', new T.Float32BufferAttribute([0, 0, 0, -0.5, 0.1, 0.1, -0.05, 0, 0.18, 0, 0, 0, 0.5, 0.1, 0.1, 0.05, 0, 0.18], 3)); gullG.computeVertexNormals();
  const gulls = []; for (let i = 0; i < 14; i++) { const m = new T.Mesh(gullG, new T.MeshStandardMaterial({ color: 0xf2f2ee, side: T.DoubleSide, roughness: 0.6 })); m.scale.setScalar(1.6); S.add(m); gulls.push({ m, a: R0() * 6.28, r: 30 + R0() * 60, h: 40 + R0() * 50, c: { x: (R0() - 0.5) * 800, z: -200 - R0() * 900 }, sp: 0.2 + R0() * 0.2, f: R0() * 6 }); }
  // sparkles when a ring is passed
  const NP = 240, spG = new T.BufferGeometry(); spG.setAttribute('position', new T.BufferAttribute(new Float32Array(NP * 3), 3)); spG.setAttribute('a', new T.BufferAttribute(new Float32Array(NP), 1));
  const spM = new T.ShaderMaterial({ transparent: true, depthWrite: false, blending: T.AdditiveBlending, uniforms: { px: { value: 1 } }, vertexShader: `attribute float a; uniform float px; varying float va; void main(){ va = a; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = min(px * 18.0, px * 260.0 / -mv.z); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying float va; void main(){ float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(1.0, 0.85, 0.45, va * smoothstep(0.5, 0.0, d)); }` });
  const sp = new T.Points(spG, spM); sp.frustumCulled = false; S.add(sp); const guide = new T.Points(gdG, spM); guide.frustumCulled = false; S.add(guide); const sparks = []; for (let i = 0; i < NP; i++) sparks.push({ t: 9, life: 1, x: 0, y: -999, z: 0, vx: 0, vy: 0, vz: 0 });
  V3 = { T, S, sea, P, cape, CW, CL, clasp, rings, guide, NG, balloons, boats, rainbow, clouds, gulls, sp, sparks, land: null, look: new T.Vector3(), camPos: new T.Vector3(), sky: null };
  W3.setQuality(stepN); return V3;
}
function buildLand(G) {
  const V = V3, T = V.T, key = (G.N * 37) % 9; if (V.landKey === key) return; V.landKey = key;      // nine coasts, built once each time the coast changes
  if (V.landM) { for (const m of V.landM) { V.S.remove(m); if (m.geometry) m.geometry.dispose(); } }
  // centre the land on the trail
  const cx = 0, cz = 0;      // the trail starts here and never goes 2 km from it
  const N3 = new T.ImprovedNoise(), H = G.land;
  // the colours of the land (his review: "Take your time renderings the surroundings"): pale sand, lush grass in three greens, meadows of flowers on
  // the gentle ground, warm rock on the steep, snow on the tops
  const colour = (x, z, h, sl) => { const n = 0.5 + 0.5 * N3.noise(x * 0.02, 1.7, z * 0.02), m = 0.5 + 0.5 * N3.noise(x * 0.004, 5.1, z * 0.004), fl = N3.noise(x * 0.011, 9.3, z * 0.011), sp = N3.noise(x * 0.35, 2.2, z * 0.35);
    if (h < 2.8) return h < -1 ? [0.62, 0.6, 0.46] : [0.95 + 0.03 * n, 0.88 + 0.04 * n, 0.68 + 0.05 * n];                // sand
    if (h > 172 + 30 * n && sl < 0.55) return [0.95, 0.96, 0.99];                                                       // snow
    if (sl > 0.44) return [0.5 + 0.1 * n, 0.44 + 0.08 * n, 0.38 + 0.06 * n];                                             // rock
    if (sl < 0.2 && h < 90 && fl > 0.18 && sp > 0.1) return fl > 0.42 ? [0.95, 0.5 + 0.2 * n, 0.72] : sp > 0.35 ? [0.98, 0.86, 0.3] : [0.72, 0.56, 0.95];      // flowers: pink, yellow, violet
    const dry = clamp((h - 95) / 70, 0, 1); return [0.2 + 0.14 * m + 0.05 * n + 0.2 * dry, 0.5 + 0.14 * n - 0.1 * m - 0.12 * dry, 0.14 + 0.05 * n + 0.04 * dry]; };      // grass, paler and browner up high
  const gt = W3.grainTex(256, 7, 205, 45, 2); gt.repeat.set(160, 160);
  const near = W3.terrain({ size: 4400, seg: 260, x: cx, z: cz, height: (x, z) => H(x, z), colour, map: gt });
  const far = W3.terrain({ size: 16000, seg: 120, x: cx, z: cz, height: (x, z) => { const inside = Math.abs(x - cx) < 2150 && Math.abs(z - cz) < 2150; return inside ? Math.min(H(x, z), 0) - 20 : H(x, z); }, colour, map: gt });
  // the shallows: turquoise water over the sand round every island, and a line of white foam at the shore (a picture of the depth, laid on the sea)
  const SZ = 640, shC = document.createElement('canvas'); shC.width = shC.height = SZ; { const g = shC.getContext('2d'), im = g.createImageData(SZ, SZ), d = im.data;
    for (let py = 0; py < SZ; py++) for (let px = 0; px < SZ; px++) { const wx = cx + (px / SZ - 0.5) * 4400, wz = cz + (py / SZ - 0.5) * 4400, h = H(wx, wz), q = (py * SZ + px) * 4; if (h > 1.5 || h < -26) continue;
      if (h > -1.2) { d[q] = 255; d[q + 1] = 255; d[q + 2] = 255; d[q + 3] = 200 * clamp(1 - Math.abs(h + 0.1) / 1.4, 0, 1); } else { const u = clamp((-h - 1.2) / 24, 0, 1); d[q] = 70 - 50 * u; d[q + 1] = 228 - 70 * u; d[q + 2] = 214 - 30 * u; d[q + 3] = 190 * (1 - u) * (1 - u); } }
    g.putImageData(im, 0, 0); }
  const shT = new T.CanvasTexture(shC); shT.colorSpace = T.SRGBColorSpace; const shallows = new T.Mesh(new T.PlaneGeometry(4400, 4400), new T.MeshBasicMaterial({ map: shT, transparent: true, depthWrite: false })); shallows.rotation.x = -Math.PI / 2; shallows.position.set(cx, 0.35, cz); shallows.renderOrder = 1; V.S.add(shallows);
  // trees: dark pines on the upper slopes; round broad-leaved trees lower down, one in eight in blossom; palms along the beaches
  const trees = [], broad = [], palms = [], R0 = W3.rng(G.N + 7); for (let i = 0; i < 60000 && trees.length + broad.length < 5200; i++) { const x = cx + (R0() - 0.5) * 4200, z = cz + (R0() - 0.5) * 4200, h = H(x, z); if (h < 2.6 || h > 150) continue;
    const sl = Math.abs(H(x + 3, z) - h) + Math.abs(H(x, z + 3) - h); if (sl > 2.6) continue; if (h < 9) { if (palms.length < 700 && R0() < 0.5) palms.push({ x, y: h - 0.3, z, s: 0.8 + R0() * 0.6, rot: R0() * 6.28 }); continue; }
    const wood = N3.noise(x * 0.008, 4, z * 0.008); if (wood < -0.12) continue; if (h > 55 + 30 * wood || R0() < 0.25) { if (trees.length < 2400) trees.push({ x, y: h - 0.5, z, s: 1.6 + R0() * 1.8, rot: R0() * 6, hue: R0() - 0.5, shade: R0() - 0.6 }); } else broad.push({ x, y: h - 0.3, z, s: 1.3 + R0() * 1.4, k: R0() }); }
  const tm = W3.pines(trees, { layers: 4 }), D = new T.Object3D(), C = new T.Color();
  const crownG = new T.IcosahedronGeometry(1, 1), trunkG = new T.CylinderGeometry(0.16, 0.24, 2.4, 5); trunkG.translate(0, 1.2, 0);
  const crownI = new T.InstancedMesh(crownG, new T.MeshStandardMaterial({ roughness: 0.85, flatShading: true }), broad.length * 2), trunkI = new T.InstancedMesh(trunkG, new T.MeshStandardMaterial({ color: 0x5a4030, roughness: 0.9 }), broad.length);
  broad.forEach((b, i) => { D.rotation.set(0, b.k * 6, 0); D.position.set(b.x, b.y, b.z); D.scale.setScalar(b.s); D.updateMatrix(); trunkI.setMatrixAt(i, D.matrix);
    const pink = b.k < 0.125, gold2 = b.k > 0.94; for (let q = 0; q < 2; q++) { D.position.set(b.x + (q ? b.s * 0.9 * Math.cos(b.k * 40) : 0), b.y + b.s * (q ? 3.4 : 2.7), b.z + (q ? b.s * 0.9 * Math.sin(b.k * 40) : 0)); D.scale.set(b.s * (q ? 1.1 : 1.7), b.s * (q ? 0.95 : 1.35), b.s * (q ? 1.1 : 1.7)); D.updateMatrix(); crownI.setMatrixAt(i * 2 + q, D.matrix);
      if (pink) C.setRGB(0.98, 0.62 + 0.12 * q, 0.78); else if (gold2) C.setRGB(0.95, 0.72, 0.2); else C.setRGB(0.2 + 0.18 * b.k, 0.52 + 0.2 * ((b.k * 7) % 1), 0.16); crownI.setColorAt(i * 2 + q, C); } });
  crownI.castShadow = true; if (crownI.instanceColor) crownI.instanceColor.needsUpdate = true; V.S.add(crownI, trunkI);
  const pt = new T.CylinderGeometry(0.12, 0.2, 6, 5); pt.translate(0, 3, 0); { const pa = pt.attributes.position; for (let q = 0; q < pa.count; q++) { const y = pa.getY(q); pa.setX(q, pa.getX(q) + y * y * 0.035); } }
  const fr = []; for (let q = 0; q < 7; q++) { const f2 = new T.ConeGeometry(0.5, 3.4, 4); f2.scale(1, 1, 0.18); f2.translate(0, 1.7, 0); f2.rotateZ(-1.15 - 0.25 * (q % 2)); f2.rotateY(q / 7 * 6.283); f2.translate(1.26, 6, 0); fr.push(f2); }
  const frG = T.mergeGeometries(fr), palmT = new T.InstancedMesh(pt, new T.MeshStandardMaterial({ color: 0x8a6a48, roughness: 0.9 }), palms.length), palmF = new T.InstancedMesh(frG, new T.MeshStandardMaterial({ color: 0x3f9a3a, roughness: 0.8, flatShading: true, side: T.DoubleSide }), palms.length);
  palms.forEach((b, i) => { D.position.set(b.x, b.y, b.z); D.rotation.set(0, b.rot, 0); D.scale.setScalar(b.s); D.updateMatrix(); palmT.setMatrixAt(i, D.matrix); palmF.setMatrixAt(i, D.matrix); }); palmF.castShadow = true; V.S.add(palmT, palmF);
  // the boats go where the sea is deep
  { const RB = W3.rng(G.N * 3 + 1); let nb = 0; for (let i = 0; i < 400 && nb < V.boats.length; i++) { const x = cx + (RB() - 0.5) * 3000, z = cz + (RB() - 0.5) * 3000; if (H(x, z) > -14) continue; const b = V.boats[nb++]; b.x = x; b.z = z; b.g.visible = true; } for (let i = nb; i < V.boats.length; i++) V.boats[i].g.visible = false; }
  V.landM = [near, far, tm, shallows, crownI, trunkI, palmT, palmF];
}
function setWeather(G) {
  const V = buildWorld(); if (V.none || V.sky === G.weather) return; V.sky = G.weather;
  W3.setSky(G.weather, { azim: { dawn: 120, sunset: 200, golden: 210, dusk: 195 }[G.weather] || 170, wind: [0.4, 0.2] });
  V.rainbow.visible = !W3.S.night && W3.S.name !== 'overcast' && W3.S.name !== 'dusk'; V.rainbow.material.opacity = W3.S.name === 'mist' ? 0.3 : 0.5;
  const dim = W3.S.night ? 0.25 : W3.S.name === 'overcast' ? 0.7 : 1; for (const c of V.clouds) { c.material.color.setScalar(dim * (W3.S.name === 'sunset' || W3.S.name === 'golden' ? 1 : 1)); if (W3.S.name === 'sunset' || W3.S.name === 'golden' || W3.S.name === 'dawn') c.material.color.set(0xffd2b0); }
}
function sparkle(x, y, z, n, sp = 8) { if (!V3 || V3.none) return; let k2 = 0; for (const d of V3.sparks) { if (d.t < d.life) continue; const a = Math.random() * 6.28, b = Math.random() * 3.14, v = sp * (0.4 + Math.random());
  Object.assign(d, { t: 0, life: 0.7 + Math.random() * 0.6, x, y, z, vx: Math.cos(a) * Math.sin(b) * v, vy: Math.cos(b) * v, vz: Math.sin(a) * Math.sin(b) * v }); if (++k2 >= n) break; } }
function onEvent(G, e) {
  const cx = W / 2, cy = H * 0.3;
  switch (e.k) {
    case 'ring': { const r = G.rings[e.i]; sparkle(r.x, r.y, r.z, 26 + Math.min(30, e.chain * 3)); sfx.ring(e.chain, e.off); vibe(HAP.tick);
      if (e.off < 0.25) say('BULLSEYE', cx, cy, '#ffe9a8', 22); else if (e.chain >= 3 && e.chain % 3 === 0) say(`${e.chain} IN A ROW`, cx, cy, '#ffe9a8', 22); break; }
    case 'miss': sfx.miss(); if (!e.far) tip('miss', 'Turn early: look at the ring after the next one too', 2.8); else tip('far', 'Follow the glow back to the trail', 2.6); break;
    case 'skim': sfx.skim(e.sea); FX.shake = 6; tip('skim', 'Thumb up to climb away', 2.4); break;
    case 'lessonnext': if (e.first) hint = null; say(e.first ? 'FIRST, A LESSON' : 'NEXT LESSON', cx, H * 0.5, '#ffd36a', 26); sfx.ding(); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, cx, H * 0.5, '#9be3b5', 26); sfx.coin(e.n); break;
    case 'lessonmiss': coachMiss(); break;
    case 'lessondone': say('YOU CAN FLY. NOW FOLLOW THE TRAIL!', cx, H * 0.5, '#ffd36a', 22); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); vibe(HAP.best); FX.flash = 0.5; break;
    case 'lost': sfx.lose(); break;
  }
}
const ui = { snap: false };
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#0b1418'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D sky.', W / 2, H / 2); return; }
  const T = V.T, cam = W3.cam, g = G || idleG(), f = g.f, t = now;
  buildLand(g); setWeather(g);
  // the flier
  const fw = fwdOf(f);
  V.P.position.set(f.x, f.y, f.z); V.P.rotation.set(0, 0, 0); V.P.rotateY(-f.yaw); V.P.rotateX(f.pitch); V.P.rotateZ(-f.bank * 1.1);
  V.P.position.y += Math.sin(t * 1.6) * 0.06;
  // the cape: narrow at the clasp, widening to the tail; a ripple runs down it, faster the faster you fly, and its corners flap; it billows in a turn
  { const cp = V.cape.geometry.attributes.position, CW = V.CW, CL = V.CL, wv = 7 + f.v * 0.25; for (let iz = 0; iz <= CL; iz++) for (let ix = 0; ix <= CW; ix++) { const n = iz * (CW + 1) + ix, sx = ix / CW - 0.5, u = iz / CL, wd = 0.42 + 1.75 * Math.pow(u, 0.75), A = 0.03 + 0.3 * Math.pow(u, 1.35);
      const y = -0.08 * u + A * Math.sin(t * wv - u * 7.5 + Math.abs(sx) * 2.4) + 0.45 * A * Math.sin(t * wv * 1.7 - u * 12 + sx * 5) + sx * sx * 2.2 * u * (0.25 + 0.3 * Math.sin(t * 6.5 - u * 5 + (sx > 0 ? 1.3 : 0))) - sx * f.bank * 0.9 * u;
      cp.setXYZ(n, sx * wd * (1 + 0.06 * Math.sin(t * 5 - u * 6)) + f.bank * 0.35 * u * u, y, u * 2.7 + 0.04 * Math.sin(t * 9 + sx * 4) * u); }
    cp.needsUpdate = true; V.cape.geometry.computeVertexNormals(); V.clasp.rotation.y = t * 1.5;
    if (G && !G.over && gate('capefx', 90)) { const bx = Math.sin(f.yaw) * -2.6, bz = Math.cos(f.yaw) * 2.6; sparkle(f.x + bx + (Math.random() - 0.5) * 1.6, f.y - 0.1, f.z + bz + (Math.random() - 0.5) * 1.6, 1, 1.2); } }
  // the camera: a few metres behind and above, leaning a little with the turn, looking well ahead
  const back = new T.Vector3(-Math.sin(f.yaw) * 5.2 + Math.cos(f.yaw) * 0.4, 1.9 - Math.sin(f.pitch) * 2.2, Math.cos(f.yaw) * 5.2 + Math.sin(f.yaw) * 0.4);      // behind and above the cape, so that all of it is seen
  const want = new T.Vector3(f.x, f.y, f.z).add(back);
  if (ui.snap || !V.started) { V.camPos.copy(want); V.started = true; } else V.camPos.lerp(want, Math.min(1, dt * 4));
  const gr = Math.max(-0.5, g.land(V.camPos.x, V.camPos.z)) + 1.2; if (V.camPos.y < gr) V.camPos.y = gr;
  cam.position.copy(V.camPos); cam.fov = (innerWidth > innerHeight ? 58 : 70) + (f.v - g.cfg.cruise) * 0.5; cam.updateProjectionMatrix();
  const look = new T.Vector3(f.x + fw.x * 24, f.y + fw.y * 24 + 2.2, f.z + fw.z * 24); if (ui.snap) V.look.copy(look); else V.look.lerp(look, Math.min(1, dt * 5)); ui.snap = false;
  cam.lookAt(V.look); cam.rotateZ(-f.bank * 0.35);
  if (FX.shake > 0) { cam.rotation.x += (Math.random() - 0.5) * FX.shake * 0.002; cam.rotation.y += (Math.random() - 0.5) * FX.shake * 0.002; }
  // rings: the next few along the trail; the next one brightest and breathing; one flown through blooms and fades; a missed one greys and fades
  const HUE = q => ((q * 47) % 360) / 360, CC = new T.Color();
  for (let i = 0; i < V.rings.length; i++) { const m = V.rings[i], idx = g.next - 1 + i, r = g.rings[idx], U = m.userData; if (!r) { m.visible = false; continue; }
    if (U.of !== r) { U.of = r; U.pop = 0; } if (r.done) U.pop += dt; const fade = r.done ? clamp(1 - U.pop / (r.done === 1 ? 0.6 : 0.9), 0, 1) : 1; m.visible = fade > 0; if (!m.visible) continue;
    const nextOne = idx === g.next, br = (nextOne ? 1 : 0.55) * fade, pulse = nextOne ? 1 + Math.sin(t * 4) * 0.035 : 1;
    m.position.set(r.x, r.y, r.z); m.rotation.set(0, -r.yaw, 0); m.scale.setScalar(r.r * pulse * (r.done === 1 ? 1 + U.pop * 1.3 : 1));
    if (r.done === -1) CC.setRGB(0.45, 0.45, 0.5); else CC.setHSL(HUE(idx), 1, 0.52);
    U.core.material.opacity = Math.min(1, br * 1.3); if (r.done === -1) U.core.material.color.set(0xa0a0a8); else U.core.material.color.setHSL(HUE(idx), 1, 0.86); U.glow.material.color.copy(CC); U.glow.material.opacity = 0.42 * br; U.halo.material.color.copy(CC); U.halo.material.opacity = (nextOne ? 0.42 + Math.sin(t * 4) * 0.12 : 0.2) * fade;
    U.film.material.opacity = (nextOne ? 0.22 : 0.1) * fade * (r.done === -1 ? 0.2 : 1); U.film.rotation.z = t * 0.5 + idx; U.gems.rotation.z = -t * 0.35 + idx; U.gems.visible = r.done !== -1;
    U.gems.children.forEach((gm, q) => { gm.rotation.set(t * 2 + q, t * 1.3, 0); CC.setHSL((HUE(idx) + q * 0.08) % 1, 0.9, 0.72); gm.material.emissive.copy(CC); gm.material.color.copy(CC); gm.material.opacity = fade; }); }
  // the trail of sparks: from the cape to the next ring, then on to the two after it
  { const ga = V.guide.geometry.attributes.position, gb = V.guide.geometry.attributes.a, pts = [new T.Vector3(f.x, f.y, f.z)]; for (let q = g.next; q < Math.min(g.rings.length, g.next + 3); q++) pts.push(new T.Vector3(g.rings[q].x, g.rings[q].y, g.rings[q].z));
    let tot = 0; const segs = []; for (let q = 1; q < pts.length; q++) { const l = pts[q].distanceTo(pts[q - 1]); segs.push(l); tot += l; }
    for (let q = 0; q < V.NG; q++) { let d = ((q + (t * 0.9) % 1) / V.NG) * tot, sI = 0; while (sI < segs.length - 1 && d > segs[sI]) { d -= segs[sI]; sI++; }
      if (!segs.length || G == null || g.over) { ga.setXYZ(q, 0, -999, 0); gb.setX(q, 0); continue; } const u = clamp(d / segs[sI], 0, 1), a = pts[sI], b = pts[sI + 1], w = t * 2 + q * 1.7;
      ga.setXYZ(q, a.x + (b.x - a.x) * u + Math.sin(w) * 0.5, a.y + (b.y - a.y) * u + Math.cos(w * 1.3) * 0.5, a.z + (b.z - a.z) * u + Math.sin(w * 0.7) * 0.5); gb.setX(q, (sI === 0 ? 0.95 : 0.5) * (0.55 + 0.45 * Math.sin(t * 7 + q * 2.1)) * (sI === 0 && d < 5 ? d / 5 : 1)); }
    ga.needsUpdate = true; gb.needsUpdate = true; }
  for (const b of V.balloons) { b.g.position.set(b.x + Math.sin(t * 0.05 * b.sp + b.ph) * 60, b.y + Math.sin(t * 0.3 + b.ph) * 3, b.z + Math.cos(t * 0.04 * b.sp + b.ph) * 60); b.g.rotation.y = t * 0.05 + b.ph; }
  for (const b of V.boats) { if (!b.g.visible) continue; b.g.position.set(b.x + Math.cos(b.a) * Math.sin(t * 0.02 * b.sp + b.ph) * 80, Math.sin(t * 1.3 + b.ph) * 0.25, b.z + Math.sin(b.a) * Math.sin(t * 0.02 * b.sp + b.ph) * 80); b.g.rotation.set(Math.sin(t * 1.1 + b.ph) * 0.05, -b.a + Math.PI / 2, Math.sin(t * 0.9 + b.ph) * 0.07); }
  // clouds drift; gulls wheel
  for (const c of V.clouds) { c.position.x += dt * 2; }
  for (const gl of V.gulls) { gl.a += dt * gl.sp; gl.m.position.set(gl.c.x + Math.cos(gl.a) * gl.r, gl.h + Math.sin(gl.a * 2) * 3, gl.c.z + Math.sin(gl.a) * gl.r); gl.m.rotation.set(0, -gl.a, Math.sin(t * 6 + gl.f) * 0.35); }
  const pa = V.sp.geometry.attributes.position, aa = V.sp.geometry.attributes.a;
  V.sparks.forEach((d0, i) => { if (d0.t < d0.life) { d0.t += dt; d0.vy -= 2 * dt; d0.x += d0.vx * dt; d0.y += d0.vy * dt; d0.z += d0.vz * dt; } pa.setXYZ(i, d0.x, d0.t < d0.life ? d0.y : -999, d0.z); aa.setX(i, d0.t < d0.life ? 1 - d0.t / d0.life : 0); });
  pa.needsUpdate = true; aa.needsUpdate = true; V.sp.material.uniforms.px.value = W3.R.getPixelRatio() * innerHeight / 844;
  W3.setFocus(f.x, f.y, f.z, 6);
  W3.render(dt);
  if (G) hud(G);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const a = t2.t < 0.9 ? 1 : 1 - (t2.t - 0.9) / 0.4; ctx.globalAlpha = Math.max(0, a); ctx.font = `700 ${Math.round(t2.size * k)}px ${BC}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 26 * k); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 26 * k); }
  ctx.globalAlpha = 1;
  if (hint) { const a = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, a); ctx.font = `700 ${Math.round(16 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 20 * k, h = lines.length * lh + 16 * k, w = Math.min(W - 24, Math.max(...lines.map(l => ctx.measureText(l).width)) + 34);
    ctx.fillStyle = 'rgba(0,0,0,.5)'; rrect(W / 2 - w / 2, H * 0.74 - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.74 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,248,230,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); }
}
let IG = null; function idleG() { if (!IG) { IG = newGame(Math.max(1, store.get('level', 1) | 0), { seed: 9 }); } const g = IG, f = g.f; f.yaw += 0.0015; f.bank = 0.12; const d = fwdOf(f); f.x += d.x * 0.25; f.z += d.z * 0.25; f.y = Math.max(f.y, g.land(f.x, f.z) + 35); return g; }
function weatherName(w) { return { dawn: 'DAWN', morning: 'MORNING', golden: 'GOLDEN HOUR', overcast: 'GREY SKY', mist: 'MIST', sunset: 'SUNSET', noon: 'MIDDAY', dusk: 'DUSK', night: 'NIGHT' }[w] || ''; }
function hud(G) {
  const c = G.cfg, x = 14, y = 44 * k;
  if (G.lesson) lessonPanel(G);
  else {
    const got = G.got, left = G.rings.length - G.next, w = W - 2 * x - 70 * k;
    ctx.fillStyle = 'rgba(0,0,0,.28)'; rrect(x, y + 4 * k, w, 8 * k, 4); ctx.fill(); ctx.fillStyle = '#ffd36a'; rrect(x, y + 4 * k, Math.max(8, w * Math.min(1, got / c.goal)), 8 * k, 4); ctx.fill();
    ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText(`${got} / ${c.goal}`, W - x, y + 8 * k);
    ctx.textAlign = 'left'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillText(`${left} rings left${G.chain >= 2 ? ` · chain ${G.chain}` : ''}`, x, y + 24 * k);
  }
  if (G.t < 3.2 && !G.lesson) { ctx.globalAlpha = Math.min(1, (3.2 - G.t) / 0.6); ctx.textAlign = 'center'; ctx.font = `700 ${Math.round(15 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.4)';
    const s = `FLIGHT ${G.N} · ${weatherName(G.weather)} · ${c.goal} OF ${c.rings} RINGS`; ctx.strokeText(s, W / 2, H * 0.2); ctx.fillText(s, W / 2, H * 0.2); ctx.globalAlpha = 1; }
  // the next ring when it is off the screen: a soft arrow at the edge pointing to it
  const r = G.rings[G.next]; if (r && V3 && !V3.none) { const p = W3.screen(new THREE.Vector3(r.x, r.y, r.z)); if (!p.front || p.x < 20 || p.x > W - 20 || p.y < 60 || p.y > H - 40) {
    let ax = p.x - W / 2, ay = p.y - H / 2; if (!p.front) { ax = -ax; ay = -ay; } const a = Math.atan2(ay, ax), ex = W / 2 + Math.cos(a) * (W / 2 - 34), ey = H / 2 + Math.sin(a) * (H / 2 - 70);
    ctx.save(); ctx.translate(ex, ey); ctx.rotate(a); ctx.fillStyle = 'rgba(255,214,110,.85)'; ctx.beginPath(); ctx.moveTo(14 * k, 0); ctx.lineTo(-8 * k, -10 * k); ctx.lineTo(-8 * k, 10 * k); ctx.closePath(); ctx.fill(); ctx.restore(); } }
  // the thumb's little stick, where it is down
  if (ui.stick) { const s = ui.stick; ctx.globalAlpha = 0.35; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(s.x0, s.y0, 46 * k, 0, TAU); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s.x0 + G.stick.x * 46 * k, s.y0 - G.stick.y * 46 * k, 13 * k, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
}
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { coachPanel(G); }
