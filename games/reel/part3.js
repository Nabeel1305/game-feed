// ===================== THE VIEW: Reel's lake in 3D (three.js through tools/world3d.js) =====================
// Game x, z (metres: right, out over the water) is three.js (x, y, -z). The player stands at the end of a jetty, eyes 2.2 m up.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [];
let hint = null, V3 = null, bigs = store.get("bigs", {});
const EYE = 2.15, DECK = 0.55;
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 6) TXT.shift(); }
function tip(key, txt, secs = 2.8) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function fxStep(dt) {
  FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.3) TXT.shift();
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; }
}
// ---------- building the world (once), and its weather (each trip) ----------
function buildWorld() {
  if (V3) return V3; const T = THREE; if (!W3 || !W3.init({ canvas: $('gl'), fov: 72, far: 7000, near: 0.05 })) { V3 = { none: true }; return V3; }
  const S = W3.scene, R0 = W3.rng(41), N3 = new T.ImprovedNoise();
  const nz = (x, z, s) => N3.noise(x * s, 0.37, z * s);
  // the lake: an oval with the jetty on its near shore; hills round it, mountains far off
  const lakeQ = (x, z) => Math.pow(x / 120, 2) + Math.pow((z - 95) / 107, 2) + nz(x, z, 0.02) * 0.18;
  const hNear = (x, z) => { const q = lakeQ(x, z); if (q < 1) return -2.6 * Math.min(1, (1 - q) * 4) - 0.3; const u = q - 1; return 16 * (1 - Math.exp(-u * 0.8)) + Math.min(1, u) * nz(x, z, 0.018) * 12 + nz(x, z, 0.12) * 0.6 * Math.min(1, u * 3); };
  const mtn = (x, z) => { const d = Math.hypot(x, z - 95), m = Math.max(0, (d - 620) / 1200); return m * 420 * (0.55 + 0.45 * nz(x, z, 0.0016)) + nz(x, z, 0.006) * 60 * m + (m > 0 ? nz(x, z, 0.02) * 9 * Math.min(1, m * 8) : 0); };
  const hAll = (x, z) => hNear(x, z) + mtn(x, z);
  const hFar = (x, z) => Math.abs(x) < 316 && Math.abs(z - 90) < 316 ? hAll(x, z) - 4 : hAll(x, z);      // under the near land, out of sight (and out of the water's reflection)
  const colour = (x, z, h, sl) => { const n = nz(x, z, 0.08) * 0.5 + 0.5, m = nz(x, z, 0.011) * 0.5 + 0.5;
    let c = [0.16 + 0.08 * n, 0.27 + 0.1 * m, 0.08 + 0.04 * n];                                  // grass
    if (h < 0.9) { const u = clamp((h + 0.4) / 1.3, 0, 1); c = [lerp(0.2, c[0], u), lerp(0.17, c[1], u), lerp(0.11, c[2], u)]; }   // mud at the waterline
    if (h < -0.4) c = [0.13, 0.12, 0.08];
    if (sl > 0.35 || h > 160) { const u = clamp(Math.max((sl - 0.35) * 3, (h - 160) / 60), 0, 1); c = [lerp(c[0], 0.36 + 0.06 * n, u), lerp(c[1], 0.35 + 0.05 * n, u), lerp(c[2], 0.33 + 0.05 * n, u)]; }
    if (h > 255 + n * 40 && sl < 0.55) c = [0.92, 0.93, 0.96];
    return c; };
  const grain = W3.grainTex(256, 9, 205, 50, 1); grain.repeat.set(60, 60);
  const near = W3.terrain({ size: 640, seg: 150, x: 0, z: -90, height: (x, z) => hAll(x, -z), colour: (x, z, h, s) => colour(x, -z, h, s), map: grain });
  const grain2 = W3.grainTex(128, 4, 210, 40, 1); grain2.repeat.set(30, 30);
  W3.terrain({ size: 5200, seg: 150, x: 0, z: -90, height: (x, z) => hFar(x, -z), colour: (x, z, h, s) => colour(x, -z, h, s), map: grain2 });
  // forest: pines on the hills (thicker in patches), a few lighter trees by the water
  const trees = []; for (let i = 0; i < 2600 && trees.length < 900; i++) { const a = R0() * Math.PI * 2, r = 105 + Math.pow(R0(), 0.8) * 150, x = Math.cos(a) * r * 1.1, z = 95 + Math.sin(a) * r;
    const h = hAll(x, z); if (h < 0.8 || h > 45 || nz(x, z, 0.025) < -0.15 || Math.abs(x) < 7 && z < -4) continue;
    trees.push({ x, y: h - 0.3, z: -z, s: 0.9 + R0() * 1.1, sy: 0.85 + R0() * 0.5, rot: R0() * 6.3, hue: R0() - 0.5, shade: R0() - 0.5, lean: (R0() - 0.5) * 0.06 }); }
  W3.pines(trees, { shadow: false });
  // far forest belt: smaller, cheap
  const far = []; for (let i = 0; i < 3000 && far.length < 900; i++) { const a = R0() * Math.PI * 2, r = 300 + R0() * 380, x = Math.cos(a) * r, z = 95 + Math.sin(a) * r; const h = hFar(x, z); if (h < 0 || h > 200) continue; far.push({ x, y: h - 1, z: -z, s: 2.2 + R0() * 1.5, rot: R0() * 6, hue: R0() - 0.5, shade: R0() - 0.6 }); }
  W3.pines(far, { layers: 3 });
  // the water
  const water = W3.water({ size: 6000, color: 0x0c262c, distort: 0.35, ripple: 1.6, speed: 0.45 });
  // weeds, the place a hooked fish runs for: reeds on the left, lily pads on the right (and reeds all round the shore)
  const reedG = new T.CylinderGeometry(0.012, 0.025, 1, 4, 1); reedG.translate(0, 0.5, 0);
  const reedM = new T.MeshStandardMaterial({ color: 0x6f7a3a, roughness: 0.8 }), reeds = [];
  const addReed = (x, z, h) => reeds.push({ x, z, h, r: R0() * 6, l: (R0() - 0.5) * 0.3, l2: (R0() - 0.5) * 0.3, c: R0() });
  for (let i = 0; i < 900; i++) { const z = 2 + R0() * 40, x = -(8.2 + Math.pow(R0(), 0.7) * 10) + Math.sin(z * 0.2) * 0.6; addReed(x, z, 1.3 + R0() * 1.2); }
  for (let i = 0; i < 1100; i++) { const a = R0() * Math.PI * 2, x = Math.cos(a) * 118, z = 95 + Math.sin(a) * 105; if (z < -6 && Math.abs(x) < 10) continue; addReed(x + (R0() - 0.5) * 5, z + (R0() - 0.5) * 5, 1 + R0() * 1.4); }
  const reedI = new T.InstancedMesh(reedG, reedM, reeds.length), D = new T.Object3D(), C = new T.Color();
  reeds.forEach((r, i) => { D.position.set(r.x, -0.2, -r.z); D.rotation.set(r.l, r.r, r.l2); D.scale.set(1, r.h, 1); D.updateMatrix(); reedI.setMatrixAt(i, D.matrix); C.setHSL(0.17 + r.c * 0.06, 0.4, 0.22 + r.c * 0.14); reedI.setColorAt(i, C); });
  S.add(reedI);
  const headG = new T.CylinderGeometry(0.035, 0.035, 0.22, 6); const heads = new T.InstancedMesh(headG, new T.MeshStandardMaterial({ color: 0x4a2c18, roughness: 0.9 }), 200);
  for (let i = 0; i < 200; i++) { const r = reeds[(R0() * 900) | 0]; D.position.set(r.x + Math.sin(r.l2) * r.h * 0.9, -0.2 + r.h * 0.92, -r.z - Math.sin(r.l) * r.h * 0.9); D.rotation.set(r.l, 0, r.l2); D.scale.set(1, 1, 1); D.updateMatrix(); heads.setMatrixAt(i, D.matrix); }
  S.add(heads);
  const padS = new T.Shape(); padS.moveTo(0, 0); padS.absarc(0, 0, 1, 0.25, Math.PI * 2 - 0.05, false); padS.lineTo(0, 0);
  const padG = new T.ShapeGeometry(padS, 14); padG.rotateX(-Math.PI / 2);
  const pads = [], padI = new T.InstancedMesh(padG, new T.MeshStandardMaterial({ color: 0x3f6a2a, roughness: 0.55, side: T.DoubleSide }), 420);
  for (let i = 0; i < 420; i++) { const z = 3 + R0() * 38, x = 8.1 + Math.pow(R0(), 0.7) * 10 + Math.sin(z * 0.17) * 0.6, s = 0.25 + R0() * 0.45; pads.push([x, z]); D.position.set(x, 0.03 + R0() * 0.01, -z); D.rotation.set(0, R0() * 6.3, 0); D.scale.set(s, 1, s); D.updateMatrix(); padI.setMatrixAt(i, D.matrix); C.setHSL(0.26 + R0() * 0.06, 0.45, 0.2 + R0() * 0.12); padI.setColorAt(i, C); }
  padI.receiveShadow = true; S.add(padI);
  const flG = new T.ConeGeometry(0.09, 0.08, 7, 1, true); flG.rotateX(Math.PI);
  const flI = new T.InstancedMesh(flG, new T.MeshStandardMaterial({ color: 0xf2bfd0, roughness: 0.5, side: T.DoubleSide, emissive: 0x2a0a14 }), 40);
  for (let i = 0; i < 40; i++) { const p = pads[(R0() * pads.length) | 0]; D.position.set(p[0], 0.08, -p[1]); D.rotation.set(0, 0, 0); D.scale.setScalar(1); D.updateMatrix(); flI.setMatrixAt(i, D.matrix); }
  S.add(flI);
  // a dead tree in the water by the lily pads (a snag you can see)
  const logM = new T.MeshStandardMaterial({ color: 0x4a3f33, roughness: 0.95, map: W3.grainTex(128, 21, 170, 70, 2) });
  const log = new T.Mesh(new T.CylinderGeometry(0.18, 0.32, 9, 8), logM); log.position.set(10.5, 0.1, -20); log.rotation.set(1.2, 0.4, 1.35); log.castShadow = true; S.add(log);
  const br = new T.Mesh(new T.CylinderGeometry(0.05, 0.12, 2.6, 6), logM); br.position.set(9.7, 1.2, -18.2); br.rotation.set(0.2, 0, -0.6); S.add(br);
  // the jetty: boards, posts, a bucket for the catch, a lantern for the dark
  const wood = W3.grainTex(256, 33, 150, 60, 3); wood.repeat.set(1, 4);
  const boardM = new T.MeshStandardMaterial({ color: 0x8d7458, roughness: 0.85, map: wood }), jetty = new T.Group();
  for (let i = 0; i < 44; i++) { const b = new T.Mesh(new T.BoxGeometry(1.9, 0.06, 0.22), boardM); b.position.set((R0() - 0.5) * 0.04, DECK, -1.3 + i * 0.25); b.rotation.y = (R0() - 0.5) * 0.02; b.castShadow = b.receiveShadow = true; jetty.add(b); }
  const postM = new T.MeshStandardMaterial({ color: 0x4f4032, roughness: 0.9, map: wood });
  for (let i = 0; i < 6; i++) for (const sx of [-1, 1]) { const p = new T.Mesh(new T.CylinderGeometry(0.09, 0.1, 2.4, 8), postM); p.position.set(sx * 0.92, DECK - 0.9, -1.25 + i * 2); p.castShadow = true; jetty.add(p); }
  const bucket = new T.Mesh(new T.CylinderGeometry(0.17, 0.14, 0.32, 18, 1, true), new T.MeshStandardMaterial({ color: 0x7b8a8e, metalness: 0.75, roughness: 0.35, side: T.DoubleSide }));
  bucket.position.set(-0.62, DECK + 0.19, 0.55); bucket.castShadow = true; jetty.add(bucket);
  const lantern = new T.Group(), lgl = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 0.14, 10), new T.MeshStandardMaterial({ color: 0xffd9a0, emissive: 0xffb050, emissiveIntensity: 0 }));
  lantern.add(lgl, new T.Mesh(new T.CylinderGeometry(0.08, 0.08, 0.02, 10), postM)); lantern.position.set(0.7, DECK + 0.1, 0.7); jetty.add(lantern);
  const lamp = new T.PointLight(0xffb060, 0, 14, 2); lamp.position.set(0.7, DECK + 0.25, 0.7); jetty.add(lamp);
  S.add(jetty);
  // the rod (seen over the right shoulder): a bending blank in pieces, a cork grip, a reel
  const rod = new T.Group(), blankM = new T.MeshStandardMaterial({ color: 0x1d2330, roughness: 0.3, metalness: 0.4 }), segs = [];
  for (let i = 0; i < 12; i++) { const r0 = 0.013 - i * 0.00095, m = new T.Mesh(new T.CylinderGeometry(r0 * 0.92, r0, 1, 6), blankM); m.castShadow = true; segs.push(m); rod.add(m); }
  const cork = new T.Mesh(new T.CylinderGeometry(0.019, 0.017, 0.36, 10), new T.MeshStandardMaterial({ color: 0xb08a5a, roughness: 0.9, map: W3.grainTex(64, 8, 180, 60, 4) }));
  const reel = new T.Group(); { const m = new T.MeshStandardMaterial({ color: 0x9aa1ab, metalness: 0.85, roughness: 0.3 }); const sp = new T.Mesh(new T.CylinderGeometry(0.045, 0.045, 0.05, 20), m); sp.rotation.z = Math.PI / 2; const ft = new T.Mesh(new T.BoxGeometry(0.012, 0.06, 0.02), m); ft.position.y = 0.04; const hd = new T.Mesh(new T.CylinderGeometry(0.006, 0.006, 0.07, 6), m); hd.rotation.z = Math.PI / 2; hd.position.set(0.05, -0.02, 0); const kn = new T.Mesh(new T.SphereGeometry(0.012, 8, 6), new T.MeshStandardMaterial({ color: 0x222222 })); kn.position.set(0.08, -0.04, 0); reel.add(sp, ft, hd, kn); reel.userData.h = hd; }
  rod.add(cork, reel); S.add(rod);
  // the line, from rod tip to float or fish
  const lineG = new T.BufferGeometry(); lineG.setAttribute('position', new T.BufferAttribute(new Float32Array(32 * 3), 3));
  const line = new T.Line(lineG, new T.LineBasicMaterial({ color: 0xe9eef2, transparent: true, opacity: 0.75 })); line.frustumCulled = false; S.add(line);
  // the float: a red tip over a white body, a little ballast below
  const fl = new T.Group(); { const pts = [[0, -0.1], [0.012, -0.08], [0.03, -0.03], [0.034, 0], [0.026, 0.03], [0.008, 0.06], [0.006, 0.14], [0, 0.145]].map(p => new T.Vector2(p[0], p[1]));
    const g = new T.LatheGeometry(pts, 16); const cnv = document.createElement('canvas'); cnv.width = 8; cnv.height = 64; const c2 = cnv.getContext('2d');
    c2.fillStyle = '#ef3b2c'; c2.fillRect(0, 0, 8, 30); c2.fillStyle = '#111'; c2.fillRect(0, 30, 8, 4); c2.fillStyle = '#f4f2ec'; c2.fillRect(0, 34, 8, 16); c2.fillStyle = '#3a6ad0'; c2.fillRect(0, 50, 8, 14);
    const tx = new T.CanvasTexture(cnv); tx.colorSpace = T.SRGBColorSpace;
    const body = new T.Mesh(g, new T.MeshStandardMaterial({ map: tx, roughness: 0.35, emissive: 0x000000 })); body.scale.setScalar(3.2); fl.add(body); fl.userData.body = body; }
  S.add(fl);
  // the aim: a ring on the water where the cast is pointing
  const aim = new T.Mesh(new T.RingGeometry(0.85, 1, 40), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false })); aim.rotation.x = -Math.PI / 2; aim.visible = false; S.add(aim);
  // ripples: a pool of rings that spread and fade
  const ripM = new T.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: {}, vertexShader: `attribute float a; varying vec2 vu; varying float va; void main(){ vu = uv; va = a; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }`,
    fragmentShader: `varying vec2 vu; varying float va; void main(){ float r = length(vu - 0.5) * 2.0; float ring = smoothstep(0.78, 0.9, r) * (1.0 - smoothstep(0.9, 1.0, r)) + 0.35 * smoothstep(0.55, 0.68, r) * (1.0 - smoothstep(0.68, 0.76, r)); gl_FragColor = vec4(vec3(0.92, 0.96, 1.0), ring * va * 0.55); }` });
  const NR = 120, ripG = new T.PlaneGeometry(1, 1); ripG.rotateX(-Math.PI / 2); ripG.setAttribute('a', new T.InstancedBufferAttribute(new Float32Array(NR), 1));
  const ripI = new T.InstancedMesh(ripG, ripM, NR); ripI.frustumCulled = false; ripI.renderOrder = 2; S.add(ripI);
  const rips = []; for (let i = 0; i < NR; i++) rips.push({ t: 9, x: 0, z: 0, s: 1, life: 1 });
  // splashes: droplets as soft dots
  const NP = 260, spG = new T.BufferGeometry(); spG.setAttribute('position', new T.BufferAttribute(new Float32Array(NP * 3), 3)); spG.setAttribute('a', new T.BufferAttribute(new Float32Array(NP), 1));
  const spM = new T.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { px: { value: 1 } }, vertexShader: `attribute float a; uniform float px; varying float va; void main(){ va = a; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = px * 60.0 / -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying float va; void main(){ float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(0.93, 0.97, 1.0, va * smoothstep(0.5, 0.15, d)); }` });
  const sp = new T.Points(spG, spM); sp.frustumCulled = false; sp.renderOrder = 3; S.add(sp);
  const drops = []; for (let i = 0; i < NP; i++) drops.push({ t: 9, life: 1, x: 0, y: -9, z: 0, vx: 0, vy: 0, vz: 0 });
  // the hooked fish when it leaps, and the fish in the hand
  const fishes = {};
  V3 = { T, S, water, rod, segs, cork, reel, line, fl, aim, ripI, rips, sp, drops, fishes, lamp, lgl, near, look: new T.Vector3(0, 0, -18), lookS: new T.Vector3(0, 0, -18), tip: new T.Vector3(), jump: null, held: null, bend: 0, side: 0, sky: null, rainT: 0, wobble: 0 };
  W3.setQuality(stepN);
  return V3;
}
// a fish, built from its kind: a body shaped from a sphere, fins, eyes, a painted skin (made once per kind)
function fishMesh(sp) {
  const T = THREE, L = sp.look, cl = f => { const c = f.clone(); c.userData = { tail: c.getObjectByName('tail') }; return c; }; if (V3.fishes[sp.id]) return cl(V3.fishes[sp.id]);
  const cv2 = document.createElement('canvas'); cv2.width = 256; cv2.height = 256; const g = cv2.getContext('2d'), hex = c => '#' + c.toString(16).padStart(6, '0'), R0 = W3.rng(sp.id.length * 13 + 5);
  // columns go round the body (0 the back, 0.5 the belly), rows along it (top the head)
  const grad = g.createLinearGradient(0, 0, 256, 0); [[0, L.back], [0.16, L.side], [0.32, L.belly], [0.5, L.belly], [0.68, L.belly], [0.84, L.side], [1, L.back]].forEach(([u, c]) => grad.addColorStop(u, hex(c))); g.fillStyle = grad; g.fillRect(0, 0, 256, 256);
  g.globalAlpha = 0.35; for (let y = 0; y < 256; y += 3) { g.fillStyle = y % 6 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.06)'; g.fillRect(0, y, 256, 1); } g.globalAlpha = 1;
  if (L.band) { g.fillStyle = hex(L.band); for (const x0 of [64, 192]) { const gr = g.createLinearGradient(x0 - 22, 0, x0 + 22, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, hex(L.band) + 'cc'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x0 - 22, 40, 44, 200); } }
  if (L.bars) { g.fillStyle = 'rgba(25,32,12,.55)'; for (let i = 0; i < 7; i++) { const y = 60 + i * 24; for (const x0 of [0, 256]) { g.beginPath(); g.ellipse(x0, y, 70, 7, 0, 0, Math.PI * 2); g.fill(); } } }
  if (L.spots || L.dots || L.specks) { const n = L.specks ? 160 : 120; for (let i = 0; i < n; i++) { const u = R0(), y = 30 + R0() * 220, x = (u < 0.5 ? u * 0.4 : 1 - (u - 0.5) * 0.4) * 256, r = L.dots ? 3 + R0() * 3 : L.specks ? 1.2 + R0() : 1.5 + R0() * 2;
    g.fillStyle = L.dots ? 'rgba(236,230,190,.75)' : 'rgba(18,18,14,.7)'; g.beginPath(); g.ellipse(x, y, r, r * (L.dots ? 1.6 : 1), 0, 0, Math.PI * 2); g.fill(); } }
  if (L.blotch) { g.fillStyle = 'rgba(30,40,18,.6)'; for (const x0 of [64, 192]) for (let y = 40; y < 240; y += 14) { g.beginPath(); g.ellipse(x0 + (R0() - 0.5) * 8, y, 9 + R0() * 6, 9, 0, 0, Math.PI * 2); g.fill(); } }
  if (L.scales) { g.strokeStyle = 'rgba(60,40,10,.35)'; g.lineWidth = 1.4; for (let y = 20; y < 250; y += 12) for (let x = (y / 12 % 2) * 7; x < 256; x += 14) { g.beginPath(); g.arc(x, y, 7, 0.2, Math.PI - 0.2); g.stroke(); } }
  const tx = new T.CanvasTexture(cv2); tx.colorSpace = T.SRGBColorSpace; tx.anisotropy = 4;
  const len = 1, deep = L.deep * 1.0, geo = new T.SphereGeometry(0.5, 40, 24), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const xs = p.getX(i) * 2, ys = p.getY(i) * 2, zs = p.getZ(i) * 2, u = (ys + 1) / 2;
    const prof = u >= 0.6 ? Math.sqrt(Math.max(0, 1 - Math.pow((u - 0.6) / 0.4, 2))) * (0.75 + 0.25 * Math.sqrt(Math.max(0, 1 - Math.pow((u - 0.6) / 0.4, 2)))) : u > 0.07 ? 1 - Math.pow((0.6 - u) / 0.53, 1.5) * 0.8 : 0.2 * (0.4 + 0.6 * u / 0.07), h = deep * prof, w = h * (0.36 + 0.12 * Math.min(1, u * 1.6));
    const rr = Math.hypot(xs, zs) || 1; let up = -xs / rr * h; if (up < 0) up *= 1.08; p.setXYZ(i, ys * len / 2, up, zs / rr * w); }
  geo.computeVertexNormals();
  const skin = new T.MeshStandardMaterial({ map: tx, roughness: sp.gold ? 0.25 : 0.33, metalness: sp.gold ? 0.55 : 0.12, envMapIntensity: 1.3 });
  const body = new T.Mesh(geo, skin); body.castShadow = true;
  const finM = new T.MeshStandardMaterial({ color: L.fins, roughness: 0.6, transparent: true, opacity: 0.88, side: T.DoubleSide });
  const tail = new T.Shape(); tail.moveTo(0, 0); tail.quadraticCurveTo(-0.12, 0.05, -0.2, deep * 0.62); tail.quadraticCurveTo(-0.13, 0, -0.2, -deep * 0.62); tail.quadraticCurveTo(-0.12, -0.05, 0, 0);
  const tailM = new T.Mesh(new T.ShapeGeometry(tail, 10), finM); tailM.position.x = -len / 2 + 0.03; const tailG = new T.Group(); tailG.name = 'tail'; tailG.add(tailM); tailG.position.x = 0;
  const dor = new T.Shape(); dor.moveTo(0, 0); dor.quadraticCurveTo(0.05, deep * 0.45, 0.2, deep * 0.12); dor.lineTo(0.22, 0); const dM = new T.Mesh(new T.ShapeGeometry(dor, 8), finM); dM.position.set(-0.12, deep * 0.42, 0);
  const pec = new T.Shape(); pec.moveTo(0, 0); pec.quadraticCurveTo(-0.06, -0.04, -0.11, -0.01); pec.quadraticCurveTo(-0.06, 0.02, 0, 0);
  const pA = new T.Mesh(new T.ShapeGeometry(pec, 6), finM); pA.position.set(0.22, -deep * 0.12, deep * 0.2); pA.rotation.y = -0.5; const pB = pA.clone(); pB.position.z *= -1; pB.rotation.y = 0.5;
  const an = dM.clone(); an.scale.set(0.6, -0.5, 1); an.position.set(-0.24, -deep * 0.38, 0);
  const eyeM = new T.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.1, metalness: 0.2 }), ringM = new T.MeshStandardMaterial({ color: sp.gold ? 0xffe9a0 : 0xd8c27a, roughness: 0.3 });
  const eye = new T.Group(); for (const s of [-1, 1]) { const r = new T.Mesh(new T.SphereGeometry(deep * 0.075, 12, 8), ringM); r.position.set(len * 0.39, deep * 0.08, s * deep * 0.115); const e = new T.Mesh(new T.SphereGeometry(deep * 0.05, 12, 8), eyeM); e.position.set(len * 0.395, deep * 0.08, s * deep * 0.15); eye.add(r, e); }
  const fish = new T.Group(); fish.add(body, tailG, dM, pA, pB, an, eye);
  if (L.whiskers) { const wm = new T.MeshStandardMaterial({ color: 0x2a2a2a }); for (const s of [-1, 1]) { const w = new T.Mesh(new T.CylinderGeometry(0.003, 0.006, 0.16, 4), wm); w.position.set(len * 0.5, -deep * 0.05, s * 0.05); w.rotation.set(s * 0.6, 0, 1.3); fish.add(w); } }
  V3.fishes[sp.id] = fish; return cl(fish);
}
function weatherName(w) { return { dawn: 'DAWN', morning: 'MORNING', golden: 'GOLDEN HOUR', overcast: 'GREY SKY', rain: 'RAIN', mist: 'MIST ON THE WATER', sunset: 'SUNSET', noon: 'MIDDAY SUN', storm: 'STORM', dusk: 'DUSK', night: 'NIGHT' }[w] || ''; }
function setWeather(G) {
  const V = buildWorld(); if (V.none || V.sky === G.weather) return; V.sky = G.weather;
  const az = { dawn: 120, sunset: 200, golden: 210, dusk: 195, morning: 140, noon: 170 }[G.weather] || 160;
  W3.setSky(G.weather, { azim: az, wind: [G.wind, 0.4] }); const night = G.weather === 'night' || G.weather === 'dusk';
  V.lamp.intensity = night ? 6 : 0; V.lgl.material.emissiveIntensity = night ? 2.5 : 0;
  V.fl.userData.body.material.emissive.set(night ? 0xff3010 : 0x000000); V.fl.userData.body.material.emissiveIntensity = night ? 0.6 : 0;
  V.water.material.uniforms.distortionScale.value = G.weather === 'storm' ? 0.9 : G.weather === 'rain' ? 0.6 : 0.35;
  W3.S.onBolt = () => { if (!HEADLESS && sfx.thunder) setTimeout(() => sfx.thunder(), 300 + Math.random() * 900); };
}
// ---------- what happens, seen and heard ----------
const g2w = (x, z, y = 0) => new THREE.Vector3(x, y, -z);
function ripple(x, z, s, life = 1.6) { if (!V3 || V3.none) return; const r = V3.rips.find(q => q.t >= q.life) || V3.rips[0]; Object.assign(r, { t: 0, x, z, s, life }); }
function splash(x, z, n, sp = 2.2, y = 0.05) { if (!V3 || V3.none) return; let k2 = 0; for (const d of V3.drops) { if (d.t < d.life) continue; const a = Math.random() * 6.28, v = sp * (0.3 + Math.random());
  Object.assign(d, { t: 0, life: 0.5 + Math.random() * 0.5, x: x + (Math.random() - 0.5) * 0.2, y, z: -z + (Math.random() - 0.5) * 0.2, vx: Math.cos(a) * v * 0.45, vy: v * (0.8 + Math.random()), vz: Math.sin(a) * v * 0.45 }); if (++k2 >= n) break; } }
function onEvent(G, e) {
  const cx = W / 2, cy = H * 0.42;
  switch (e.k) {
    case 'cast': sfx.cast(e.d); vibe(HAP.tick); break;
    case 'splash': sfx.plop(); ripple(e.x, e.z, 1.2); ripple(e.x, e.z, 2.2, 2.2); splash(e.x, e.z, 10, 1.6); break;
    case 'inspot': break;
    case 'nospot': if (G.lesson) break; tip('nospot', 'Cast into the rings: that is where the fish are', 2.6); break;
    case 'rise': ripple(e.x, e.z, e.big ? 2.6 : 1.6, 2.4); setTimeout(() => ripple(e.x, e.z, e.big ? 1.6 : 1, 1.8), 220); if (Math.random() < 0.35) { splash(e.x, e.z, e.big ? 8 : 4, e.big ? 2 : 1.2); sfx.rise(e.big); } break;
    case 'nibble': ripple(e.x, e.z, 0.6, 0.9); sfx.nibble(); vibe(HAP.tick); break;
    case 'bite': ripple(e.x, e.z, 0.9, 1.2); ripple(e.x, e.z, 1.6, 1.6); splash(e.x, e.z, 6, 1); sfx.bite(); vibe([30]); break;
    case 'jerk': sfx.swish(); break;
    case 'hooked': sfx.swish(); sfx.hooked(); FX.shake = 6; FX.stop = 0.06; vibe(HAP.sharp); say('FISH ON!', cx, cy, '#ffe08a', 34); splash(e.x, e.z, 16, 2.4); ripple(e.x, e.z, 2); tip('reel', 'Hold to reel. Let go when it runs', 3); break;
    case 'missed': case 'stolen': say(e.k === 'stolen' ? 'TOO LATE: BAIT TAKEN' : 'MISSED IT', cx, cy, '#ffd0c4', 24); if (e.k === 'stolen') tip('late', 'Strike the moment it goes under. Cast again', 2.8); break;
    case 'spooked': ripple(e.x, e.z, 2.2, 1.4); splash(e.x, e.z, 7, 2.6); sfx.flee(); break;
    case 'moved': break;
    case 'thrash': if (G.F) { if (G.F.D < 22) V3 && !V3.none && (V3.jump = { t: 0, x: G.F.X, z: G.F.D, dur: 0.75 + Math.random() * 0.2, sp: G.F.fish.sp, kg: G.F.fish.kg }); splash(G.F.X, G.F.D, 14, 2.4); ripple(G.F.X, G.F.D, 2); } sfx.thrash(); vibe(HAP.light); break;
    case 'run': sfx.run(); FX.shake = Math.max(FX.shake, 3); break;
    case 'runover': if (e.ok && !G.lesson) say('HELD IT', cx, cy, '#9be3b5', 22); break;
    case 'turned': say('TURNED IT', cx, cy, '#9be3b5', 22); sfx.turned(); vibe(HAP.tick); break;
    case 'turn': break;
    case 'caught': { const f = e.fish, prev = bigs[f.sp.id] || 0; e.fish.nb = f.kg > prev; if (!HEADLESS && f.kg > prev) { bigs[f.sp.id] = f.kg; store.set("bigs", bigs); }
      sfx.landed(f.kg, f.sp.gold || f.sp.giant); FX.flash = f.sp.gold || f.sp.giant ? 1 : 0.5; vibe(HAP.best); if (V3 && !V3.none) { if (V3.held && V3.held.m) W3.scene.remove(V3.held.m); V3.held = { t: 0, fish: f, m: null }; splash(0.3, 2, 20, 2.6); } break; }
    case 'gone': { const w = { snap: 'SNAP! THE LINE BROKE', off: 'IT SHOOK THE HOOK', snag: 'SNAGGED IN THE WEEDS', spool: 'IT TOOK ALL YOUR LINE' }[e.why];
      say(w, cx, cy, '#ffb4a8', 26); FX.red = 0.5; e.why === 'snap' ? sfx.snap() : sfx.lost(); if (e.why !== 'off') { FX.shake = 8; }
      tip('why_' + e.why, { snap: 'Lift your thumb when it thrashes and runs', off: 'Keep holding: a slack line lets it go', snag: 'Drag your thumb away from the weeds as you reel', spool: 'Reel it in between its runs' }[e.why], 3.2); break; }
    case 'saved': FX.red = 0.3; sfx.lost(); say({ snap: 'TOO TIGHT!', snag: 'INTO THE WEEDS!', spool: 'TOO MUCH LINE OUT' }[e.why] || 'CAREFUL', cx, cy, '#ffd0c4', 26); break;
    case 'fault': if (e.why === 'soon') { say('TOO SOON: IT BOLTED', cx, cy, '#ffd0c4', 24); tip('soon', 'Leave the little dips. Strike when it goes right under', 3); }
      else if (e.why === 'nothing') { say('NOTHING THERE YET', cx, cy, '#ffd0c4', 22); }
      else if (e.why === 'bare') say('NO BAIT LEFT: CAST AGAIN', cx, cy, '#ffd0c4', 22);
      if (G.noise > 1.6 && !G.lesson) tip('quiet', 'You are scaring the fish. Strike only when it goes under', 3); break;
    case 'lessonnext': if (e.first) hint = null; say(e.first ? 'FIRST, A LESSON' : 'NEXT LESSON', cx, H * 0.5, '#ffd36a', 26); sfx.ding(); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, cx, H * 0.5, '#9be3b5', 26); sfx.coin(e.n); break;
    case 'lessonmiss': hint = { txt: e.how, t: 0, secs: 3.6 }; break;
    case 'lessondone': say('YOU KNOW IT. NOW FISH!', cx, H * 0.5, '#ffd36a', 26); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); vibe(HAP.best); break;
    case 'lost': sfx.lose(); say(e.why === 'dark' ? 'THE LIGHT IS GONE' : 'OUT OF LINE', cx, H * 0.5, '#ffd0c4', 28); break;      // (P11: never vibrate on failure)
  }
}
// ---------- each frame ----------
const ui = { aim: null, drag: null };      // set by the touch code in part5
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#0b1418'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D lake.', W / 2, H / 2); return; }
  const T = V.T, cam = W3.cam, g = G || idleG(); setWeather(g);
  const t = now;
  // where to look: the float, the fish, or the fish in the hand
  const F = g.F; let lx = 0, lz = 18;
  if (g.ph === 'fight' && F) { lx = F.X * 0.85; lz = Math.max(6, F.D * 0.95); }
  else if (g.ph === 'fly') { lx = g.fl.tx * 0.85; lz = Math.max(9, g.fl.tz); }
  else if (ui.aim) { lx = ui.aim.x * 0.6; lz = Math.max(10, ui.aim.z * 0.8); }
  else if (g.ph === 'wait' || g.ph === 'bite') { lx = g.fl.x * 0.85; lz = Math.max(9, g.fl.z); }
  else lx = 0;
  V.look.set(lx, 0, -lz); V.lookS.lerp(V.look, ui.snap ? 1 : Math.min(1, dt * 2.2)); ui.snap = false;
  const sway = Math.sin(t * 0.6) * 0.02 + Math.sin(t * 1.3) * 0.008;
  const fz = (g.ph === 'wait' || g.ph === 'bite') && !ui.aim ? 0.72 : 1; V.zoom = V.zoom == null ? 1 : V.zoom + (fz - V.zoom) * Math.min(1, dt * 1.5); cam.fov = (innerWidth > innerHeight ? 55 : 72) * V.zoom; cam.updateProjectionMatrix();
  cam.position.set(0.05 + sway, EYE + Math.sin(t * 0.9) * 0.01, 0.9);
  const lookAt = V.lookS.clone(); lookAt.y = -0.25 - 0.02 * V.lookS.length();
  if (V.held) lookAt.set(0.1, EYE - 0.35, -1.4);
  cam.lookAt(lookAt);
  if (FX.shake > 0) { cam.rotation.z += (Math.random() - 0.5) * FX.shake * 0.002; cam.rotation.x += (Math.random() - 0.5) * FX.shake * 0.0015; }
  // the rod: held over the right shoulder, its tip pointed toward the line; it bends with the strain and swings with the thumb
  const tens = F ? clamp(F.T, 0, 1.4) : g.ph === 'bite' ? 0.15 : 0;
  V.bend += (tens - V.bend) * Math.min(1, dt * 10);
  const sideT = g.ph === 'fight' ? g.in.side : 0; V.side += (sideT - V.side) * Math.min(1, dt * 6);
  const castPull = ui.drag && ui.drag.mode === 'cast' ? clamp(ui.drag.pull, 0, 1) : 0, flyU = g.ph === 'fly' ? Math.min(1, g.ph_t / 0.25) : 1;
  const base = new T.Vector3(0.44, EYE - 0.6, 0.15);
  const tgt = F ? g2w(F.X, F.D) : g2w(g.fl.x, g.fl.z);
  const yaw = Math.atan2(tgt.x - base.x, -(tgt.z - base.z)) * 0.75 + V.side * 0.45;
  let pitch = 0.42 - castPull * 0.6 + (1 - flyU) * -0.6 + (g.ph === 'reelin' ? 0.2 : 0) + (F ? 0.15 : 0);
  const dir = new T.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch)), toLine = tgt.clone().sub(base).normalize();
  let p = base.clone(), d = dir.clone(); const segL = 2.7 / V.segs.length;
  V.cork.position.copy(base).addScaledVector(dir, -0.05); V.cork.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir);
  V.reel.position.copy(base).addScaledVector(dir, 0.18).add(new T.Vector3(0, -0.06, 0)); V.reel.quaternion.copy(V.cork.quaternion);
  if (V.reel.userData.h) V.reel.userData.h.rotation.x = g.in.hold && F ? t * 18 : 0;
  V.segs.forEach((m, i) => { const u = (i + 1) / V.segs.length, b = V.bend * 0.11 * u * u * 2.2;
    d.lerp(toLine, b).normalize(); if (V.bend < 0.05) d.y -= 0.004 * i; d.normalize();
    const mid = p.clone().addScaledVector(d, segL / 2); m.position.copy(mid); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d); m.scale.set(1, segL, 1); p.addScaledVector(d, segL); });
  V.tip.copy(p);
  // the float and the line
  const fl = g.fl; let fy = fl.y;
  const bob = Math.sin(t * 2.1 + fl.x) * 0.012 + Math.sin(t * 3.7) * 0.006 + (g.weather === 'storm' ? Math.sin(t * 4) * 0.02 : 0);
  if (g.ph === 'wait' || g.ph === 'bite') fy = -0.03 + bob - fl.dip * 0.55;
  if (g.ph === 'fight' || g.ph === 'land') fy = -1;
  V.fl.position.copy(g2w(fl.x, fl.z, fy)); V.fl.rotation.z = Math.sin(t * 1.7) * 0.06 + fl.dip * 0.2; V.fl.visible = g.ph !== 'fight' && g.ph !== 'land' && !(g.ph === 'idle' && !G);
  if (g.ph === 'idle') V.fl.position.copy(V.tip).add(new T.Vector3(0, -0.6, 0));
  const pos = V.line.geometry.attributes.position, end = F ? g2w(F.X, F.D, -0.2) : V.fl.position.clone().add(new T.Vector3(0, 0.3, 0)), sag = F ? 0.15 * (1 - Math.min(1, F.T)) : g.ph === 'fly' ? 0.3 : 0.9;
  for (let i = 0; i < 32; i++) { const u = i / 31, q = V.tip.clone().lerp(end, u); q.y -= Math.sin(u * Math.PI) * sag * Math.min(1, V.tip.distanceTo(end) / 8); pos.setXYZ(i, q.x, q.y, q.z); }
  pos.needsUpdate = true; V.line.material.color.set(F && F.T > 1 ? 0xffb0a0 : 0xe9eef2); V.line.material.opacity = F ? 0.95 : 0.65; V.line.visible = !V.held;
  // aim ring while pulling back for a cast
  V.aim.visible = !!ui.aim; if (ui.aim) { V.aim.position.copy(g2w(ui.aim.x, ui.aim.z, 0.04)); V.aim.scale.setScalar(1.1 + Math.sin(t * 6) * 0.05); }
  // ripples, splashes, rain rings
  if (W3.S.rain > 0) { V.rainT -= dt * W3.S.rain * 26; while (V.rainT < 0) { V.rainT += 1; const a = Math.random() * 6.28, r = 1 + Math.random() * 18; ripple(Math.cos(a) * r * 0.8 + cam.position.x, 4 + Math.sin(a) * r * 0.5 + r * 0.6, 0.2 + Math.random() * 0.25, 0.6); } }
  const D3 = new T.Object3D(), aA = V.ripI.geometry.attributes.a;
  V.rips.forEach((r, i) => { r.t += dt; const u = r.t / r.life; if (u >= 1) { aA.setX(i, 0); D3.position.set(0, -9, 0); D3.scale.setScalar(0.001); } else { D3.position.set(r.x, 0.03, -r.z); D3.scale.setScalar(r.s * (0.25 + u * 1.6)); aA.setX(i, (1 - u) * (1 - u)); } D3.updateMatrix(); V.ripI.setMatrixAt(i, D3.matrix); });
  V.ripI.instanceMatrix.needsUpdate = true; aA.needsUpdate = true;
  const sp = V.sp.geometry.attributes.position, sa = V.sp.geometry.attributes.a;
  V.drops.forEach((d0, i) => { if (d0.t < d0.life) { d0.t += dt; d0.vy -= 9.8 * dt; d0.x += d0.vx * dt; d0.y += d0.vy * dt; d0.z += d0.vz * dt; if (d0.y < 0) d0.t = d0.life; } sp.setXYZ(i, d0.x, d0.t < d0.life ? d0.y : -9, d0.z); sa.setX(i, d0.t < d0.life ? 0.8 * (1 - d0.t / d0.life) : 0); });
  sp.needsUpdate = true; sa.needsUpdate = true; V.sp.material.uniforms.px.value = W3.R.getPixelRatio() * innerHeight / 844;
  // the fish leaping as it thrashes
  if (V.jump) { const J = V.jump; J.t += dt; if (!J.m) { J.m = fishMesh(J.sp); const s = 0.35 + Math.pow(J.kg, 0.33) * 0.32; J.m.scale.setScalar(s); W3.scene.add(J.m); }
    const u = J.t / J.dur, x = F ? F.X : J.x, z = F ? F.D : J.z; J.m.position.copy(g2w(x, z, Math.sin(Math.min(1, u) * Math.PI) * (0.5 + 0.3 * Math.min(1, J.kg / 4)) - 0.15));
    J.m.rotation.set(Math.sin(u * 20) * 0.5, yaw + Math.PI / 2 + Math.sin(u * 13) * 0.6, (0.5 - u) * 2.2); if (J.m.userData.tail) J.m.userData.tail.rotation.y = Math.sin(J.t * 40) * 0.5;
    if (u >= 1) { splash(x, z, 18, 2.6); ripple(x, z, 2.4); sfx.splash(); W3.scene.remove(J.m); V.jump = null; } }
  // the fish in the hand: lifted up in front of the camera, turning in the light
  if (V.held) { const Hd = V.held; Hd.t += dt; if (!Hd.m) { Hd.m = fishMesh(Hd.fish.sp); Hd.s = 0.42 + Math.pow(Hd.fish.kg, 0.33) * 0.16; W3.scene.add(Hd.m); }
    const u = Math.min(1, Hd.t / 0.5), e = easeOut(u); Hd.m.scale.setScalar(Hd.s * (0.6 + 0.4 * e));
    Hd.m.position.copy(cam.position).add(new T.Vector3(0.04, -0.36 - (1 - e) * 0.6, -1.05 - Hd.s * 0.3)); Hd.m.rotation.set(0.15, -0.25 + Math.sin(Hd.t * 1.4) * 0.35, -0.12 + Math.sin(Hd.t * 2.6) * 0.06);
    if (Hd.m.userData.tail) Hd.m.userData.tail.rotation.y = Math.sin(Hd.t * 9) * 0.35 * Math.max(0, 1 - Hd.t / 2);
    if (!G || G.ph !== 'land') { W3.scene.remove(Hd.m); V.held = null; } }
  W3.setFocus(cam.position.x, 0.5, cam.position.z - 3, 9);
  W3.render(dt);
  if (G) hud(G);
  // floating words, hints
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const a = t2.t < 0.9 ? 1 : 1 - (t2.t - 0.9) / 0.4; ctx.globalAlpha = Math.max(0, a); ctx.font = `700 ${Math.round(t2.size * k)}px ${BC}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 26 * k); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 26 * k); }
  ctx.globalAlpha = 1;
  if (hint) { const a = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, a); ctx.font = `700 ${Math.round(16 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 20 * k, h = lines.length * lh + 16 * k, w = Math.min(W - 24, Math.max(...lines.map(l => ctx.measureText(l).width)) + 34);
    ctx.fillStyle = 'rgba(0,0,0,.6)'; rrect(W / 2 - w / 2, H * 0.7 - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.7 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,60,40,${FX.red * 0.18})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,250,235,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); }
}
let IG = null; function idleG() { if (!IG) { IG = newGame(Math.max(1, store.get('level', 1) | 0), { seed: 1 }); IG.ph = 'idle'; } return IG; }
// ---------- the head-up display: only what he needs, mostly on the edges ----------
function hud(G) {
  const c = G.cfg, x = 14, y = 44 * k;
  if (G.lesson) lessonPanel(G);
  else {
    // fish to catch (P14): a little fish for each, filled as they are landed
    for (let i = 0; i < c.goal; i++) { const fx = x + 14 * k + i * 30 * k, fy = y + 8 * k, got = i < G.caught.length; ctx.save(); ctx.translate(fx, fy); ctx.scale(k, k);
      ctx.beginPath(); ctx.ellipse(0, 0, 10, 5, 0, 0, TAU); ctx.moveTo(-8, 0); ctx.lineTo(-15, -5); ctx.lineTo(-15, 5); ctx.closePath();
      ctx.fillStyle = got ? '#ffd36a' : 'rgba(0,0,0,.35)'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = got ? '#fff3c4' : 'rgba(255,255,255,.55)'; ctx.stroke(); ctx.restore(); }
    // lines left
    ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'rgba(0,0,0,.35)'; rrect(W - x - 78 * k, y - 3 * k, 78 * k, 22 * k, 8); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillText('LINES', W - x - 36 * k, y + 8 * k); for (let i = 0; i < c.rigs; i++) { ctx.beginPath(); ctx.arc(W - x - 28 * k + i * 9 * k, y + 8 * k, 3.4 * k, 0, TAU); ctx.fillStyle = i < G.rigs ? '#ff6b5a' : 'rgba(255,255,255,.25)'; ctx.fill(); }
    // the light left: a thin bar that goes from gold to dusk
    const u = G.time / c.time; ctx.fillStyle = 'rgba(0,0,0,.3)'; rrect(x, y + 24 * k, W - 2 * x, 4 * k, 2); ctx.fill();
    ctx.fillStyle = u > 0.25 ? 'rgba(255,215,130,.9)' : '#ff8a6a'; rrect(x, y + 24 * k, Math.max(4, (W - 2 * x) * u), 4 * k, 2); ctx.fill();
  }
  if (G.t < 3.2 && !G.lesson) { ctx.globalAlpha = Math.min(1, (3.2 - G.t) / 0.6); ctx.textAlign = 'center'; ctx.font = `700 ${Math.round(15 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.5)';
    const s = `LEVEL ${G.N} · ${weatherName(G.weather)} · CATCH ${c.goal}${c.boss ? ': THE GIANT' : ''}`; ctx.strokeText(s, W / 2, H * 0.2); ctx.fillText(s, W / 2, H * 0.2); ctx.globalAlpha = 1; }
  // the fight: a tension gauge on the right, the weeds warning on the side the fish is heading
  const F = G.F;
  if (F) {
    const gx = W - 30 * k, gy = H * 0.3, gh = H * 0.34, gw = 12 * k, tv = clamp(F.T / 1.3, 0, 1);
    ctx.fillStyle = 'rgba(0,0,0,.4)'; rrect(gx - 4 * k, gy - 4 * k, gw + 8 * k, gh + 8 * k, 9); ctx.fill();
    const yOf = v => gy + gh * (1 - v / 1.3);
    ctx.fillStyle = 'rgba(160,170,180,.35)'; ctx.fillRect(gx, yOf(0.3), gw, gh - (yOf(0.3) - gy));
    ctx.fillStyle = 'rgba(120,220,150,.45)'; ctx.fillRect(gx, yOf(1), gw, yOf(0.3) - yOf(1));
    ctx.fillStyle = 'rgba(255,90,70,.5)'; ctx.fillRect(gx, gy, gw, yOf(1) - gy);
    const yy = yOf(clamp(F.T, 0, 1.3)); ctx.fillStyle = F.T > 1 ? '#ff6b5a' : F.T < 0.3 ? '#c9d2da' : '#9be3b5'; ctx.fillRect(gx - 5 * k, yy - 2.5 * k, gw + 10 * k, 5 * k);
    if (F.strain > 0.05) { ctx.fillStyle = `rgba(255,80,60,${0.3 + 0.5 * F.strain})`; ctx.fillRect(gx, gy, gw, gh * F.strain * 0.35); }
    ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText(`${Math.round(F.D)} m`, gx + gw / 2, gy + gh + 18 * k);
    if (F.slack > 0.5) { ctx.fillStyle = '#e8eef4'; ctx.fillText('SLACK', gx + gw / 2, gy + gh + 34 * k); }
    if (F.tell > 0 || F.surge > 0) { ctx.globalAlpha = 0.6 + 0.4 * Math.sin(G.t * 30); ctx.fillStyle = '#ffd36a'; ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; ctx.fillText('RUN!', gx + gw / 2, gy - 18 * k); ctx.globalAlpha = 1; }
    const near = Math.abs(F.X) / c.snag;
    if (near > 0.55) { const s = Math.sign(F.X), a = clamp((near - 0.55) / 0.4, 0, 1), xx = s > 0 ? W - 4 : 4, gr = ctx.createLinearGradient(xx, 0, xx - s * 70 * k, 0);
      gr.addColorStop(0, `rgba(255,120,80,${0.5 * a})`); gr.addColorStop(1, 'rgba(255,120,80,0)'); ctx.fillStyle = gr; ctx.fillRect(s > 0 ? W - 70 * k : 0, H * 0.25, 70 * k, H * 0.5);
      ctx.fillStyle = `rgba(255,230,210,${a})`; ctx.font = `700 ${Math.round(15 * k)}px ${BC}`; ctx.textAlign = s > 0 ? 'right' : 'left'; ctx.fillText(s > 0 ? 'WEEDS ▶' : '◀ WEEDS', s > 0 ? W - 46 * k : 12, H * 0.66); }
  }
  // the fish in the hand: its name, weight, a best
  if (G.ph === 'land' && G.land) { const f = G.land, a = clamp((G.ph_t - 0.3) / 0.3, 0, 1); ctx.globalAlpha = a; ctx.textAlign = 'center';
    ctx.font = `400 ${Math.round(30 * k)}px ${TF}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.fillStyle = f.sp.gold ? '#ffd36a' : '#fff'; ctx.strokeText(f.sp.name, W / 2, H * 0.17); ctx.fillText(f.sp.name, W / 2, H * 0.17);
    ctx.font = `700 ${Math.round(24 * k)}px ${BC}`; ctx.fillStyle = '#ffe9b0'; const kgT = `${f.kg.toFixed(2)} kg`; ctx.strokeText(kgT, W / 2, H * 0.17 + 34 * k); ctx.fillText(kgT, W / 2, H * 0.17 + 34 * k);
    if (f.nb) { ctx.fillStyle = '#9be3b5'; ctx.font = `700 ${Math.round(16 * k)}px ${BC}`; ctx.strokeText('YOUR BIGGEST ' + f.sp.name.toUpperCase(), W / 2, H * 0.17 + 62 * k); ctx.fillText('YOUR BIGGEST ' + f.sp.name.toUpperCase(), W / 2, H * 0.17 + 62 * k); }
    ctx.globalAlpha = 1; }
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
