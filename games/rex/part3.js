// ===================== THE VIEW: Rex in 3D (three.js through tools/world3d.js) =====================
// A green valley under the level's sky: rolling grass, sand round the watering hole, pines and tree ferns, fern brakes, rocks,
// a cliff with a dark cave mouth, and the rival's nesting ground ringed with stones and eggs. The camera rides high behind
// you, the rex, so you see the herds ahead. Every warning shows on the animal itself (a club tail lifts, a hornface lowers its
// head and paws, a rival rears) with a red "!" over it. Your footsteps shake the picture when you charge.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [];
let hint = null, V3 = null;
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 6) TXT.shift(); }
function tip(key, txt, secs = 2.8) { if (HEADLESS || !(G && G.lesson)) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 1.8);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.3) TXT.shift(); if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; } }
const ui = { drag: null, look: null, snap: false, camYaw: null, camPitch: 0.5 };
// the stick never moves (23 Nov 2026, his words: "make the joystick in one place, not everywhere I tap"): bottom left, drawn all the time
function stickBase() { const r = 56 * k; return { x: r + 30 * k, y: H - r - 70 * k, r, zone: r * 1.75 }; }
// a dinosaur from smooth shapes
function dino(T, kind, col) {
  if (kind === 'rex' && typeof trexModel === 'function') return trexModel(T, col);      // the T-Rex has his own body (part25_trex.js)
  const g = new T.Group(), skin = new T.MeshStandardMaterial({ color: col, roughness: 0.85, map: W3.grainTex(128, 9, 200, 50, 4) }), belly = new T.MeshStandardMaterial({ color: new T.Color(col).lerp(new T.Color(0xe8d8b0), 0.45), roughness: 0.9 });
  const dark = new T.MeshStandardMaterial({ color: 0x1a1410, roughness: 0.6 }), bone = new T.MeshStandardMaterial({ color: 0xe8e0c8, roughness: 0.5 });
  const blob = (sx, sy, sz, m, x, y, z, par) => { const s = new T.Mesh(new T.SphereGeometry(1, 18, 12), m); s.scale.set(sx, sy, sz); s.position.set(x, y, z); s.castShadow = true; par.add(s); return s; };
  const body = new T.Group(); g.add(body); const legs = []; let head, jaw = null, tail, neck;
  const biped = kind === 'rex' || kind === 'runner' || kind === 'duck';
  if (biped) { const hip = kind === 'duck' ? 2.4 : 3.0;
    blob(1.05, 1.15, 2.1, skin, 0, hip, 0, body); blob(0.95, 0.75, 1.6, belly, 0, hip - 0.45, 0.2, body);
    tail = new T.Group(); tail.position.set(0, hip + 0.1, -1.6); body.add(tail); const tc = new T.Mesh(new T.ConeGeometry(0.75, kind === 'runner' ? 5 : 4.4, 12), skin); tc.rotation.x = -Math.PI / 2 - 0.08; tc.position.z = -2.1; tc.castShadow = true; tail.add(tc);
    neck = new T.Group(); neck.position.set(0, hip + 0.6, 1.7); body.add(neck); blob(0.6, 0.75, 0.8, skin, 0, 0.3, 0.3, neck);
    head = new T.Group(); head.position.set(0, kind === 'duck' ? 1.4 : 0.9, kind === 'duck' ? 0.6 : 0.9); neck.add(head);
    if (kind === 'duck') { blob(0.42, 0.45, 0.8, skin, 0, 0, 0.3, head); blob(0.38, 0.14, 0.45, bone, 0, -0.15, 1.0, head); const crest = new T.Mesh(new T.ConeGeometry(0.18, 1.3, 8), new T.MeshStandardMaterial({ color: 0xc8582a, roughness: 0.7 })); crest.rotation.x = -2.2; crest.position.set(0, 0.45, -0.4); head.add(crest); }
    else { blob(0.62, 0.62, 1.2, skin, 0, 0.15, 0.5, head); jaw = new T.Group(); jaw.position.set(0, -0.15, 0); head.add(jaw); blob(0.52, 0.22, 1.05, belly, 0, -0.2, 0.55, jaw);
      for (const s of [-1, 1]) for (let i = 0; i < 5; i++) { const tooth = new T.Mesh(new T.ConeGeometry(0.05, 0.22, 4), bone); tooth.rotation.x = Math.PI; tooth.position.set(s * 0.42, -0.08, 0.25 + i * 0.2); head.add(tooth); } }
    for (const s of [-1, 1]) { blob(0.07, 0.07, 0.07, new T.MeshStandardMaterial({ color: 0xffc830, emissive: 0x442200, roughness: 0.2 }), s * 0.45, 0.4, 0.75, head); if (kind !== 'duck') { const arm = new T.Mesh(new T.CylinderGeometry(0.1, 0.07, 0.8, 6), skin); arm.position.set(s * 0.75, hip + 0.1, 1.5); arm.rotation.x = 0.9; body.add(arm); } }
    for (const s of [-1, 1]) { const lg = new T.Group(); lg.position.set(s * 0.7, hip - 0.2, 0.1); body.add(lg); blob(0.45, 0.95, 0.6, skin, 0, -0.5, 0, lg); const shin = new T.Mesh(new T.CylinderGeometry(0.22, 0.16, hip * 0.7, 8), skin); shin.position.set(0, -hip * 0.55, -0.25); shin.castShadow = true; lg.add(shin); blob(0.3, 0.12, 0.55, dark, 0, -hip + 0.08, 0.15, lg); legs.push(lg); } }
  else { // four legs: the spikeback and the hornface
    const hip = 1.5; blob(1.4, 0.95, 2.1, skin, 0, hip + 0.3, 0, body); blob(1.2, 0.6, 1.8, belly, 0, hip - 0.1, 0, body);
    tail = new T.Group(); tail.position.set(0, hip + 0.3, -1.9); body.add(tail); const tc = new T.Mesh(new T.ConeGeometry(0.45, 3, 10), skin); tc.rotation.x = -Math.PI / 2; tc.position.z = -1.5; tail.add(tc);
    if (kind === 'spike') { blob(0.55, 0.45, 0.45, bone, 0, 0, -3.0, tail); for (let i = 0; i < 9; i++) { const sp = new T.Mesh(new T.ConeGeometry(0.22, 0.6, 5), bone); sp.position.set((i % 2 ? 1 : -1) * 0.9, hip + 1.0, -1.6 + i * 0.4); sp.rotation.z = (i % 2 ? -1 : 1) * 0.6; body.add(sp); } }
    neck = new T.Group(); neck.position.set(0, hip + 0.3, 2.0); body.add(neck); head = new T.Group(); head.position.set(0, 0, 0.5); neck.add(head); blob(0.6, 0.55, 0.9, skin, 0, 0, 0.4, head);
    if (kind === 'horns') { const frill = new T.Mesh(new T.CylinderGeometry(1.35, 1.35, 0.15, 20, 1, false, 0, Math.PI), new T.MeshStandardMaterial({ color: 0xb84a2a, roughness: 0.7 })); frill.rotation.set(Math.PI / 2, 0, Math.PI / 2 + Math.PI / 2); frill.rotation.z = Math.PI; frill.position.set(0, 0.5, -0.1); head.add(frill);
      for (const [hx, hy, hl] of [[-0.35, 0.45, 1.4], [0.35, 0.45, 1.4], [0, 0.05, 0.6]]) { const h = new T.Mesh(new T.ConeGeometry(0.12, hl, 6), bone); h.rotation.x = Math.PI / 2 - 0.35; h.position.set(hx, hy, 0.7 + hl * 0.35); head.add(h); } }
    for (const [lx, lz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) { const lg = new T.Group(); lg.position.set(lx * 0.95, hip - 0.1, lz * 1.2); body.add(lg); const l = new T.Mesh(new T.CylinderGeometry(0.32, 0.28, hip, 8), skin); l.position.y = -hip / 2; l.castShadow = true; lg.add(l); legs.push(lg); } }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); g.userData = { legs, body, head, jaw, tail, neck, ph: Math.random() * 6 };
  const sc = { rex: 1, rival: 1, runner: 0.38, duck: 0.82, spike: 0.95, horns: 1.05 }[kind] || 1; g.scale.setScalar(sc); return g;
}
// the meal, from 0 (the kill) to 1 (swallowed): head down with jaws wide, three bites (snap shut, tug with a shake, tear a piece free), head thrown back, two gulps
function eatPose(u) { const none = { bow: 0, open: 0, shake: 0, up: 0, tug: 0, f: 0, cyc: -1, left: 1 }; if (!(u >= 0)) return none;
  const ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }, down = ss(0, 0.13, u) * (1 - ss(0.72, 0.84, u)), up = ss(0.76, 0.86, u) * (1 - ss(0.93, 1, u));
  let open = 0, shake = 0, tug = 0, cyc = -1, f = 0;
  if (u < 0.13) open = ss(0, 0.1, u) * 0.85;
  else if (u < 0.73) { const p = (u - 0.13) / 0.2; cyc = Math.min(2, Math.floor(p)); f = p - cyc; open = f < 0.2 ? 0.85 * (1 - f / 0.2) : f > 0.8 && cyc < 2 ? 0.85 * ((f - 0.8) / 0.2) : 0.05; tug = ss(0.2, 0.42, f) * (1 - ss(0.62, 0.8, f)); shake = tug * Math.sin(f * 42) * 0.3; }
  else if (u > 0.8 && u < 0.97) open = Math.max(0, Math.sin((u - 0.8) / 0.17 * Math.PI * 2)) * 0.4;
  return { bow: down * (1 - tug * 0.28), open, shake, up, tug, f, cyc, left: u >= 0.73 ? 0 : 1 - (Math.max(0, cyc) + (cyc >= 0 && f > 0.62 ? 1 : 0)) / 3.4 }; }
// pieces of the meal: they fly from his jaws when he tears one free
function gibs(V, x, y, z, n) { const T = V.T; if (!V.gib) { V.gib = []; const g = new T.BoxGeometry(1, 1, 1), red = new T.MeshStandardMaterial({ color: 0x8e1c18, roughness: 0.6 }), bone = new T.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 0.5 });
    for (let i = 0; i < 18; i++) { const m = new T.Mesh(g, i % 4 === 3 ? bone : red); m.visible = false; m.userData = { t: 9, life: 1 }; V.S.add(m); V.gib.push(m); } }
  for (let i = 0; i < n; i++) for (const m of V.gib) if (m.userData.t >= m.userData.life) { const s = 0.12 + Math.random() * 0.2; m.scale.set(s, s * 0.6, s * 1.3); m.position.set(x + (Math.random() - 0.5) * 0.8, y, z + (Math.random() - 0.5) * 0.8); m.userData = { t: 0, life: 0.6 + Math.random() * 0.4, vx: (Math.random() - 0.5) * 7, vy: 3 + Math.random() * 5, vz: (Math.random() - 0.5) * 7 }; m.visible = true; break; } }
function gibStep(V, dt) { if (!V.gib) return; for (const m of V.gib) { const q = m.userData; if (q.t >= q.life) { m.visible = false; continue; } q.t += dt; q.vy -= 16 * dt; m.position.x += q.vx * dt; m.position.y += q.vy * dt; m.position.z += q.vz * dt; m.rotation.x += dt * 9; m.rotation.z += dt * 7; const gy = hgt(m.position.x, m.position.z) + 0.08; if (m.position.y < gy) { m.position.y = gy; q.vy = 0; q.vx *= 0.5; q.vz *= 0.5; } } }
function gait(m, sp, dt, o = {}) { const u = m.userData; u.ph += sp * dt * 1.3; const sw = Math.min(0.7, sp * 0.09);
  u.legs.forEach((lg, i) => lg.rotation.x = Math.sin(u.ph + (u.legs.length === 2 ? i * Math.PI : [0, Math.PI, Math.PI, 0][i])) * sw);
  u.body.position.y = Math.abs(Math.sin(u.ph)) * Math.min(0.25, sp * 0.02); u.body.rotation.x = -(o.rear || 0) * 0.5 + (o.lower || 0) * 0.15;
  if (u.tail) u.tail.rotation.y = Math.sin(u.ph * 0.5) * 0.12 + (o.swing || 0); if (u.tail) u.tail.rotation.x = -(o.lift || 0) * 0.8;
  if (u.neck) u.neck.rotation.x = (o.lower || 0) * 0.6 - (o.rear || 0) * 0.3; if (u.jaw) u.jaw.rotation.x = (o.open || 0) * 0.7;
  if (u.trex) {      // the T-Rex: knees and ankles fold as each foot comes forward, the tail's end swings after its base, the body rocks over the planted foot
    u.legs.forEach((lg, i) => { const p = u.ph + i * Math.PI, lift = Math.max(0, -Math.cos(p)) * Math.min(1, sp * 0.12); lg.userData.knee.rotation.x = lift * 0.8; lg.userData.ankle.rotation.x = -lift * 1.15; });
    // eating (o.bow 0..1): he tips forward from the hips with his feet planted (the body turns about the hip, the legs turn back by as much), the neck
    // and head go down to the meal, the tail lifts to balance; o.shake swings the head from side to side as he tears; o.up throws it back to swallow
    { const a = (o.bow || 0) * 0.42, hy = 3.05, hz = -0.25, c = Math.cos(a), sn = Math.sin(a); u.body.rotation.x += a; u.body.position.y += hy - (hy * c - hz * sn); u.body.position.z = hz - (hy * sn + hz * c);
      u.legs.forEach(lg => lg.rotation.x -= a); u.neck.rotation.x += (o.bow || 0) * 0.5 - (o.up || 0) * 0.55; u.head.rotation.x = 0.12 + (o.bow || 0) * 0.2 - (o.up || 0) * 0.35; u.head.rotation.y = o.shake || 0; u.head.rotation.z = (o.shake || 0) * 0.5; u.tail.rotation.x -= (o.bow || 0) * 0.22; }
    u.body.rotation.z = Math.sin(u.ph) * Math.min(0.05, sp * 0.006); if (u.tail2) u.tail2.rotation.y = Math.sin(u.ph * 0.5 - 0.9) * 0.18 + (o.swing || 0) * 0.6;
    if (sp < 0.3) { const br = Math.sin(performance.now() / 900) * 0.012; u.body.position.y += br; } } }
function buildWorld() {
  if (V3) return V3; const T = THREE; if (!W3 || !W3.init({ canvas: $('gl'), fov: 58, far: 3000, near: 0.2 })) { V3 = { none: true }; return V3; }
  const S = W3.scene;
  const land = W3.terrain({ size: 700, seg: 180, x: 0, z: 60, height: hgt, colour: (x, z, h, sl) => { const dw = Math.hypot(x - SPOTS.water.x, z - SPOTS.water.z); if (dw < SPOTS.water.r + 6) return [0.72, 0.64, 0.45]; if (sl > 0.35) return [0.45, 0.4, 0.35]; const dn = Math.hypot(x - SPOTS.nest.x, z - SPOTS.nest.z); if (dn < SPOTS.nest.r) return [0.5, 0.42, 0.3]; return [0.28 + h * 0.008, 0.42 + h * 0.01, 0.18]; }, map: W3.grainTex(256, 4, 210, 40, 8) });
  if (land.material.map) land.material.map.repeat.set(40, 40);
  W3.water({ geometry: new T.CircleGeometry(SPOTS.water.r + 3, 48), color: 0x1a4a4a, distort: 0.6, ripple: 2, speed: 0.4, y: hgt(SPOTS.water.x, SPOTS.water.z) + 1.6 }).position.set(SPOTS.water.x, hgt(SPOTS.water.x, SPOTS.water.z) + 1.6, SPOTS.water.z);
  const R0 = W3.rng(11), trees = [];
  for (let i = 0; i < 420; i++) { const x = (R0() - 0.5) * 340, z = -100 + R0() * 340; if (Math.hypot(x - SPOTS.water.x, z - SPOTS.water.z) < 30 || Math.hypot(x, z) < 25 || Math.hypot(x - SPOTS.nest.x, z - SPOTS.nest.z) < 22 || (Math.abs(x) < 60 && R0() < 0.6)) continue; trees.push({ x, z, y: hgt(x, z), s: 1.2 + R0() * 1.4, hue: R0(), shade: R0() * 0.5, lean: (R0() - 0.5) * 0.1 }); }
  const pineM = W3.pines(trees, { layers: 4, shadow: true }); if (W3.seeThrough) W3.seeThrough(pineM.material);      /* a tree between the camera and the rex turns to a fine see-through screen; it is never cut away (23 Nov 2026) */
  // tree ferns and fern brakes, rocks
  const fernG = new T.ConeGeometry(1.4, 1.6, 6, 1, true); fernG.translate(0, 0.6, 0); const fernM = new T.MeshStandardMaterial({ color: 0x6aa83a, roughness: 0.9, side: T.DoubleSide, flatShading: true }), NF = 360, ferns = new T.InstancedMesh(fernG, fernM, NF), d = new T.Object3D();
  for (let i = 0; i < NF; i++) { const a = R0() * TAU, r = i < 160 ? Math.sqrt(R0()) * SPOTS.ferns.r : 20 + R0() * 120, x = (i < 160 ? SPOTS.ferns.x : 0) + Math.cos(a) * r, z = (i < 160 ? SPOTS.ferns.z : 60) + Math.sin(a) * r; d.position.set(x, hgt(x, z), z); d.rotation.set(Math.PI, R0() * TAU, 0); d.position.y += 0.75; d.scale.setScalar(0.45 + R0() * 0.5);      /* 22 Nov 2026: ferns half the size; in the fern brake they filled the screen and hid the rex */ d.updateMatrix(); ferns.setMatrixAt(i, d.matrix); }
  ferns.receiveShadow = true; S.add(ferns);
  const rockM = new T.MeshStandardMaterial({ color: 0x7a7066, roughness: 0.95, flatShading: true, map: W3.grainTex(128, 3, 190, 60, 3) }), NR = 70, rocks = new T.InstancedMesh(new T.DodecahedronGeometry(1, 0), rockM, NR);
  for (let i = 0; i < NR; i++) { let x, z, s; if (i < 16) { const a = i / 16 * TAU; x = SPOTS.nest.x + Math.cos(a) * SPOTS.nest.r; z = SPOTS.nest.z + Math.sin(a) * SPOTS.nest.r; s = 1 + R0(); } else { x = (R0() - 0.5) * 300; z = -80 + R0() * 300; s = 0.6 + R0() * 2; } d.position.set(x, hgt(x, z) + s * 0.3, z); d.rotation.set(R0() * 3, R0() * 3, R0() * 3); d.scale.set(s, s * 0.7, s); d.updateMatrix(); rocks.setMatrixAt(i, d.matrix); }
  rocks.castShadow = rocks.receiveShadow = true; S.add(rocks);
  // the cliff and the cave mouth
  const cliff = new T.Mesh(new T.DodecahedronGeometry(14, 1), rockM); cliff.scale.set(1.6, 1.1, 0.8); cliff.position.set(SPOTS.cave.x, hgt(SPOTS.cave.x, SPOTS.cave.z + 10) + 6, SPOTS.cave.z + 12); cliff.castShadow = true; S.add(cliff);
  const mouth = new T.Mesh(new T.CircleGeometry(4.5, 24, 0, Math.PI), new T.MeshBasicMaterial({ color: 0x050403 })); mouth.position.set(SPOTS.cave.x, hgt(SPOTS.cave.x, SPOTS.cave.z) + 0.2, SPOTS.cave.z + 4.2); mouth.rotation.y = Math.PI; S.add(mouth);
  // eggs in the nest
  const eggM = new T.MeshStandardMaterial({ color: 0xe8e0d0, roughness: 0.6 }); for (let i = 0; i < 6; i++) { const e = new T.Mesh(new T.SphereGeometry(0.35, 12, 8), eggM); e.scale.y = 1.3; const a = i / 6 * TAU; e.position.set(SPOTS.nest.x + Math.cos(a) * 1.2, hgt(SPOTS.nest.x, SPOTS.nest.z) + 0.4, SPOTS.nest.z + Math.sin(a) * 1.2); S.add(e); }
  const me = dino(T, 'rex', 0x6e7440); S.add(me);
  const ring = new T.Mesh(new T.RingGeometry(2.2, 2.6, 40), new T.MeshBasicMaterial({ color: 0xffb030, transparent: true, opacity: 0.7, side: T.DoubleSide, depthWrite: false })); ring.rotation.x = -Math.PI / 2; S.add(ring);
  const NP = 90, pG = new T.BufferGeometry(); pG.setAttribute('position', new T.BufferAttribute(new Float32Array(NP * 3), 3)); const dust = new T.Points(pG, new T.PointsMaterial({ color: 0xc8b090, size: 0.35, transparent: true, opacity: 0.8, depthWrite: false })); dust.frustumCulled = false; S.add(dust);
  V3 = { T, S, me, ring, dust, P: Array.from({ length: NP }, () => ({ t: 9, life: 1, x: 0, y: -99, z: 0, vx: 0, vy: 0, vz: 0 })), models: new Map(), cam: { x: 0, y: 8, z: -32 } };
  W3.setQuality(stepN); return V3;
}
const COLS = { runner: 0x8a7a3a, duck: 0x5a7a8a, spike: 0x7a6a4a, horns: 0x6a5a4a, rival: 0x6a3a2a };
function modelOf(V, d) { let m = V.models.get(d.id); if (!m) { m = dino(V.T, d.k === 'rival' ? 'rex' : d.k, COLS[d.k]); if (d.big) m.scale.multiplyScalar(1.2); V.S.add(m); V.models.set(d.id, m); } return m; }
function setWeather(G) { const V = buildWorld(); if (V.none || V.sky === G.weather) return; V.sky = G.weather; W3.setSky(G.weather, { azim: 40 }); W3.S.onBolt = () => { if (!HEADLESS && sfx.thunder) setTimeout(() => sfx.thunder(), 300 + Math.random() * 900); }; }
function puff(V, x, z, n, up = 3) { for (let i = 0; i < n; i++) for (const q of V.P) if (q.t >= q.life) { Object.assign(q, { t: 0, life: 0.5 + Math.random() * 0.5, x: x + (Math.random() - 0.5) * 2, y: hgt(x, z) + 0.2, z: z + (Math.random() - 0.5) * 2, vx: (Math.random() - 0.5) * 4, vy: up * Math.random(), vz: (Math.random() - 0.5) * 4 }); break; } }
const VW = new (window.THREE ? THREE.Vector3 : Object)();
function wScreen(x, y, z) { W3.cam.updateMatrixWorld(); VW.set(x, y, z); return W3.screen(VW); }
function onEvent(G, e) { const cx = W / 2, cy = H * 0.3, V = V3 && !V3.none ? V3 : null;
  switch (e.k) {
    case 'start': { const s = G.cfg.goals.map(g => g.k === 'rival' ? (g.big ? 'BEAT THE BIG RIVAL' : 'BEAT THE RIVAL') : `EAT ${g.n} ${KINDS[g.k].name.toUpperCase()}${g.n > 1 ? 'S' : ''}`).join(' · '); say(s, cx, cy, '#ffd36a', 18); sfx.roar(0.6); break; }
    case 'snap': sfx.snap(); break;
    case 'bitehit': sfx.crunch(e.big); FX.shake = Math.max(FX.shake, 8); FX.stop = 0.06; vibe(HAP.light); if (V) puff(V, e.x, e.z, 8, 2); break;
    case 'deflect': sfx.clank(); say(e.why === 'armour' ? 'ARMOUR! BITE THE HEAD' : 'BLOCKED', cx, cy, '#ffd0c4', 20); tip('armour', 'Spikebacks are armoured: come round to the head, away from the tail.', 3); break;
    case 'roar': sfx.roar(1); FX.shake = 10; vibe(HAP.thud); break;
    case 'flinch': say('IT FLINCHES!', cx, cy, '#ffe08a', 20); break;
    case 'bolt': if (G.lesson || Math.random() < 0.5) sfx.squeal(); break;
    case 'winded': if (Math.hypot(e.x - G.me.x, e.z - G.me.z) < 45) say('IT IS WINDED!', cx, cy, '#ffe08a', 20); break;
    case 'tell': sfx.warn(e.kind); if (e.kind === 'spike') tip('tail', 'The tail is lifting: get away from it!', 2.4); else if (e.kind === 'rival') tip('rear', 'It rears up before it lunges: step out of its line!', 2.6); else tip('horn', 'It paws and lowers its head: it will charge. Step aside!', 2.6); break;
    case 'charge': case 'lunge': sfx.stomp(); break;
    case 'swing': sfx.whoosh(); break;
    case 'stuck': say(G && G.lesson ? 'NOW! BITE IT' : 'STUCK!', cx, cy, '#ffe08a', 20); break;
    case 'hurt': sfx.hurt(); FX.red = 0.7; FX.shake = 14; vibe(HAP.thud); say(e.why === 'tail' ? 'CLUBBED!' : e.why === 'horns' ? 'GORED!' : e.why === 'counter' ? 'IT BIT BACK' : 'BITTEN!', cx, cy, '#ffb4a8', 24); if (e.why === 'counter') tip('counter', 'A rival bites back unless it is tired: wait for it to lunge, then bite.', 3); break;
    case 'eat': sfx.eat(); FX.flash = 0.3; say('+FOOD', cx, cy, '#9be3b5', 22); break;
    case 'beaten': sfx.roar(1.2); FX.flash = 0.5; say('THE RIVAL FLEES!', cx, cy, '#ffe08a', 26); break;
    case 'lessonnext': if (e.first) hint = null; say(e.first ? 'FIRST, A LESSON' : 'NEXT LESSON', cx, H * 0.5, '#ffd36a', 26); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, cx, H * 0.5, '#9be3b5', 26); sfx.coin(e.n); break;
    case 'lessonmiss': coachMiss(); break;
    case 'lessondone': say('THE VALLEY IS YOURS!', cx, H * 0.5, '#ffd36a', 26); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); vibe(HAP.best); break;
    case 'lost': sfx.lose(); break;
  } }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#10140c'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D valley.', W / 2, H / 2); return; }
  const g = G || idleG(), t = now; setWeather(g); const m = g.me;
  const eu = m.eatT > 0 ? 1 - m.eatT / EAT : -1, ep = eatPose(eu), mouth = { x: m.x + Math.sin(m.h) * 4.1, z: m.z + Math.cos(m.h) * 4.1 };
  V.me.position.set(m.x, hgt(m.x, m.z), m.z); V.me.rotation.y = m.h; gait(V.me, m.v, dt, eu >= 0 ? ep : { open: m.bite > 0 ? Math.sin((0.35 - m.bite) / 0.35 * Math.PI) : 0, lower: m.bite > 0 ? 0.6 : 0 });
  // the sounds and the flying pieces of each bite, once each
  { const E = V.eatS || (V.eatS = { id: 0, snap: -1, tear: -1, gulp: false }); if (eu < 0) E.id = 0; else { if (E.id !== m.eatId) Object.assign(E, { id: m.eatId, snap: -1, tear: -1, gulp: false });
      if (ep.cyc >= 0 && ep.f > 0.2 && E.snap < ep.cyc) { E.snap = ep.cyc; if (g === G) { sfx.crunch(ep.cyc === 2); vibe(HAP.light); } }
      if (ep.cyc >= 0 && ep.f > 0.62 && E.tear < ep.cyc) { E.tear = ep.cyc; gibs(V, mouth.x, hgt(mouth.x, mouth.z) + 1.1, mouth.z, 5); if (g === G) { FX.shake = Math.max(FX.shake, 4); sfx.tear(); } }
      if (eu > 0.84 && !E.gulp) { E.gulp = true; if (g === G) sfx.gulp(); } } }
  gibStep(V, dt);
  if (m.run && Math.random() < 0.5) puff(V, m.x, m.z, 1, 2);
  const seen = new Set(); for (const d of g.dinos) { const mo = modelOf(V, d); seen.add(d.id); mo.visible = !d.dead || d.eat > 0; if (!mo.visible) continue;
    mo.position.set(d.x, hgt(d.x, d.z), d.z); mo.rotation.y = d.h; mo.rotation.z = d.dead ? 1.4 : 0; if (d.dead) mo.position.y -= 0.3;
    { const s0 = mo.userData.s0 || (mo.userData.s0 = mo.scale.x); if (d.dead && eu >= 0 && d.id === m.eatId) {      // the meal: dragged to his jaws, jerked as he tugs, smaller with every piece torn off, gone when he swallows
        const kk = Math.min(1, eu / 0.13), e2 = kk * kk * (3 - 2 * kk), px = d.x + (mouth.x - d.x) * e2 - Math.sin(m.h) * ep.tug * 0.5, pz = d.z + (mouth.z - d.z) * e2 - Math.cos(m.h) * ep.tug * 0.5;
        mo.position.set(px, hgt(px, pz) - 0.3 + ep.tug * 0.7, pz); mo.rotation.y = d.h + ep.shake * 1.2; mo.scale.setScalar(s0 * (0.25 + 0.75 * ep.left)); mo.visible = ep.left > 0; } else if (mo.scale.x !== s0) mo.scale.setScalar(s0); }
    if (!d.dead && d.puff > 0 && Math.random() < dt * 7) puff(V, d.x + Math.sin(d.h) * 1.1, d.z + Math.cos(d.h) * 1.1, 1, 1.6);      /* winded: its head hangs and it pants */
    gait(mo, d.dead ? 0 : d.v, dt, { rear: d.state === 'tell' && d.k === 'rival' ? 1 : 0, lower: d.state === 'tell' && d.k === 'horns' ? 1 : d.state === 'charge' ? 0.8 : d.puff > 0 ? 0.75 : 0, lift: d.state === 'tell' && d.k === 'spike' ? 1 : 0, swing: d.state === 'swing' ? Math.sin(t * 20) * 0.9 : 0, open: d.k === 'rival' && (d.state === 'tell' || d.state === 'lunge') ? 1 : 0 }); }
  for (const [id, mo] of V.models) if (!seen.has(id)) { V.S.remove(mo); V.models.delete(id); }
  // the goal's nearest, ringed
  const left = g.lesson ? g.dinos.filter(d => !d.dead).map(d => d.k) : goalLeft(g).map(q => q.k); let tg = null, bd = 1e9; for (const d of g.dinos) if (!d.dead && left.includes(d.k)) { const dd = dist(d, m); if (dd < bd) { bd = dd; tg = d; } }
  V.ring.visible = !!tg; if (tg) { V.ring.position.set(tg.x, hgt(tg.x, tg.z) + 0.15, tg.z); V.ring.material.opacity = 0.45 + Math.sin(t * 5) * 0.25; V.ring.scale.setScalar(KINDS[tg.k].size * 1.1 + 0.4); }
  const pa = V.dust.geometry.attributes.position; V.P.forEach((q, i) => { if (q.t < q.life) { q.t += dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; q.vy -= 5 * dt; } pa.setXYZ(i, q.x, q.t < q.life ? q.y : -99, q.z); }); pa.needsUpdate = true;
  // the camera (23 Nov 2026, his words: "make it that I can be able to see around the area just by clicking the screen and moving around"):
  // it turns only when you drag the screen (left and right turns the view, up and down tilts it); it never swings round by itself, so the
  // stick's left is always the screen's left. Camera and aim are both set from one followed point along one heading: the view never drifts.
  if (ui.camYaw == null || ui.snap) { ui.camYaw = m.h; ui.camPitch = 0.5; V.F = { x: m.x, z: m.z }; } ui.snap = false;
  if (!(G && g === G)) ui.camYaw += wrapA(m.h - ui.camYaw) * Math.min(1, dt * 1.2);      // the demo behind the menu follows him round
  if (!V.F) V.F = { x: m.x, z: m.z }; { const ef = 1 - Math.exp(-dt * 8); V.F.x += (m.x - V.F.x) * ef; V.F.z += (m.z - V.F.z) * ef; }
  V.back = (V.back || 17) + ((m.run ? 19 : 17) - (V.back || 17)) * Math.min(1, dt * 2);
  // while he eats the view comes round to his side, low and close, so the meal is seen, and then goes back to exactly where it was: ui.camYaw itself
  // is never touched, so the stick's left is still the screen's left the moment he can walk again
  { const on = !!(G && g === G && eu >= 0 && eu < 0.9); if (on && !V.eatOn) { const a = wrapA(m.h + Math.PI / 2 + 0.55 - ui.camYaw), b = wrapA(m.h - Math.PI / 2 - 0.55 - ui.camYaw); V.eatOff = Math.abs(a) < Math.abs(b) ? a : b; } V.eatOn = on; V.eatK = (V.eatK || 0) + ((on ? 1 : 0) - (V.eatK || 0)) * Math.min(1, dt * (on ? 4.5 : 3.5)); if (V.eatK < 0.002) V.eatK = 0; }
  const ek = V.eatK * V.eatK * (3 - 2 * V.eatK), C = V.cam, cyw = ui.camYaw + ek * (V.eatOff || 0), cp = ui.camPitch + (0.2 - ui.camPitch) * ek, bk = V.back + (11.5 - V.back) * ek, Fx = V.F.x + Math.sin(m.h) * 3.3 * ek, Fz = V.F.z + Math.cos(m.h) * 3.3 * ek, fy = hgt(Fx, Fz), cx = Fx - Math.sin(cyw) * bk * Math.cos(cp), cz = Fz - Math.cos(cyw) * bk * Math.cos(cp);
  C.x = cx; C.z = cz; C.y = Math.max(hgt(cx, cz) + 2.5 - ek, fy + 2 + bk * Math.sin(cp));
  const cam = W3.cam, stomp = m.run ? Math.abs(Math.sin(V.me.userData.ph)) * 0.12 : 0; cam.position.set(C.x, C.y + stomp, C.z); if (cam.near !== 0.3) { cam.near = 0.3; cam.updateProjectionMatrix(); } if (W3.setSee) W3.setSee(cam.position, new THREE.Vector3(m.x, hgt(m.x, m.z) + 2.2, m.z), 5.5);
  cam.lookAt(Fx + Math.sin(cyw) * 6 * (1 - ek), fy + 3.2 - 1.3 * ek, Fz + Math.cos(cyw) * 6 * (1 - ek)); V.viewYaw = ui.camYaw; if (ui.drag && G && g === G) G.in.ref = ui.camYaw;
  if (FX.shake > 0) { cam.rotation.z += (Math.random() - 0.5) * FX.shake * 0.003; cam.position.y += (Math.random() - 0.5) * FX.shake * 0.02; }
  W3.setFocus(m.x, 0, m.z + 10, 50); W3.render(dt);
  if (G) hud(G, t, tg);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 0.9 ? 1 : 1 - (t2.t - 0.9) / 0.4; ctx.globalAlpha = Math.max(0, al); ctx.font = `${Math.round(t2.size * k)}px ${TF}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 22); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 22); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(15 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 19 * k, h = lines.length * lh + 16 * k, w2 = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30;
    ctx.fillStyle = 'rgba(0,0,0,.66)'; rrect(W / 2 - w2 / 2, H * 0.42 - h / 2, w2, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.42 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,60,40,${FX.red * 0.2})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); } }
let IG = null; function idleG() { if (!IG || IG.over) { IG = newGame(5, { seed: (Math.random() * 1e6) | 0 }); IG.mem = {}; } honest(IG, { react: 0.2, acc: 0.95 }, IG.mem); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function btnRects() { const b = 92 * k, r = 62 * k; return { bite: { x: W - b - 18, y: H - b - 26 * k, w: b, h: b }, roar: { x: W - b - 18 - r - 14, y: H - r - 22 * k, w: r, h: r } }; }
function hud(G, t, tg) { const c = G.cfg, m = G.me;
  if (G.lesson) lessonPanel(G);
  const ty = G.lesson ? H * 0.25 : 44 * k;
  if (!G.lesson) { ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.5)';
    c.goals.forEach((q, i) => { const got = Math.min(q.n, G.got[q.k] || 0), done = got >= q.n, s = `${done ? '✓' : '○'} ${q.k === 'rival' ? (q.big ? 'Beat the big rival' : 'Beat the rival') : `Eat ${q.n} ${KINDS[q.k].name.toLowerCase()}${q.n > 1 ? 's' : ''}`}${q.n > 1 && !done ? `  ${got}/${q.n}` : ''}`; ctx.fillStyle = done ? '#9be3b5' : '#fff'; ctx.strokeText(s, 14, ty + i * 18 * k); ctx.fillText(s, 14, ty + i * 18 * k); }); }
  // hunger, health, wind
  const bw = W * 0.34, bx = W - bw - 14, by = G.lesson ? H * 0.25 : 44 * k; const bar = (y, u, col, lab) => { ctx.fillStyle = 'rgba(0,0,0,.45)'; rrect(bx, y, bw, 9 * k, 4); ctx.fill(); ctx.fillStyle = col; rrect(bx, y, bw * clamp(u, 0, 1), 9 * k, 4); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(9 * k)}px ${BC}`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(lab, bx - 5, y + 4.5 * k); };
  bar(by, m.hp / 100, m.hp < 35 ? '#ff6a5a' : '#8fe0ab', 'HEALTH'); if (!G.lesson) bar(by + 14 * k, m.hunger / 100, m.hunger < 25 ? '#ff9a5a' : '#e8b04a', 'HUNGER'); bar(by + (G.lesson ? 14 : 28) * k, m.stam / c.stam, '#9bd3ff', 'CHARGE');
  // where to go: an arrow at the top edge when the goal is off to the side or behind, and the distance
  if (tg) { const s = wScreen(tg.x, hgt(tg.x, tg.z) + 5, tg.z), dd = Math.round(dist(tg, m)); if (s.front && s.x > 20 && s.x < W - 20 && s.y > 60) { ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = '#ffd36a'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.strokeText(`▼ ${dd} m`, s.x, s.y); ctx.fillText(`▼ ${dd} m`, s.x, s.y); }
    else { const a = wrapA(angTo(m, tg) - (ui.camYaw != null ? ui.camYaw : m.h)), ax = W / 2 - Math.sin(a) * W * 0.38, ay = H * 0.2; ctx.save(); ctx.translate(ax, ay); ctx.rotate(-a); ctx.fillStyle = '#ffd36a'; ctx.beginPath(); ctx.moveTo(0, -16 * k); ctx.lineTo(10 * k, 6 * k); ctx.lineTo(-10 * k, 6 * k); ctx.fill(); ctx.restore(); ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillText(`${dd} m`, ax, ay + 18 * k); } }
  // warnings over the animals that are about to strike
  for (const d of G.dinos) { if (d.dead || !(d.state === 'tell' || d.state === 'lunge' || d.state === 'charge' || ((KINDS[d.k].rival && d.tired > 0) || d.state === 'stuck'))) continue; const s = wScreen(d.x, hgt(d.x, d.z) + 6 * KINDS[d.k].size + 1, d.z); if (!s.front) continue;
    const open = d.tired > 0 || d.state === 'stuck'; ctx.font = `${Math.round((open ? 16 : 28) * k)}px ${TF}`; ctx.textAlign = 'center'; ctx.fillStyle = open ? '#9be3b5' : '#ff4a3a'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.6)'; const s2 = open ? 'BITE!' : '!'; ctx.strokeText(s2, s.x, s.y); ctx.fillText(s2, s.x, s.y); }
  // the buttons and the stick
  const B = btnRects(); ctx.globalAlpha = m.bcd > 0 ? 0.55 : 0.92; ctx.fillStyle = 'rgba(160,40,20,.75)'; ctx.beginPath(); ctx.arc(B.bite.x + B.bite.w / 2, B.bite.y + B.bite.h / 2, B.bite.w / 2, 0, TAU); ctx.fill(); ctx.strokeStyle = '#ffd0a0'; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.font = `${Math.round(18 * k)}px ${TF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('BITE', B.bite.x + B.bite.w / 2, B.bite.y + B.bite.h / 2);
  ctx.globalAlpha = m.roarCD > 0 ? 0.5 : 0.92; ctx.fillStyle = 'rgba(120,90,30,.8)'; const rc = { x: B.roar.x + B.roar.w / 2, y: B.roar.y + B.roar.h / 2, r: B.roar.w / 2 }; ctx.beginPath(); ctx.arc(rc.x, rc.y, rc.r, 0, TAU); ctx.fill(); if (m.roarCD > 0) { ctx.strokeStyle = '#ffd36a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(rc.x, rc.y, rc.r - 3, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - m.roarCD / c.roarCD)); ctx.stroke(); } ctx.fillStyle = '#fff'; ctx.font = `${Math.round(12 * k)}px ${TF}`; ctx.fillText('ROAR', rc.x, rc.y);
  ctx.globalAlpha = 1; { const sb = stickBase(), on = !!ui.drag; let kx = sb.x, ky = sb.y; if (on) { const dx = ui.drag.x - sb.x, dy = ui.drag.y - sb.y, dl = Math.hypot(dx, dy), q = dl > sb.r ? sb.r / dl : 1; kx += dx * q; ky += dy * q; }      /* the knob is drawn UNDER HIS THUMB (25 Nov 2026: it was drawn from the rules' own number, which runs the other way across, so it slid left when he pushed right) */
    ctx.fillStyle = on ? 'rgba(0,0,0,.28)' : 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.arc(sb.x, sb.y, sb.r, 0, TAU); ctx.fill(); ctx.strokeStyle = on ? 'rgba(255,255,255,.85)' : 'rgba(255,255,255,.55)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.5)'; for (let a = 0; a < 4; a++) { const ax = sb.x + Math.sin(a * Math.PI / 2) * sb.r * 0.78, ay = sb.y - Math.cos(a * Math.PI / 2) * sb.r * 0.78; ctx.beginPath(); ctx.arc(ax, ay, 3.5 * k, 0, TAU); ctx.fill(); }
    ctx.fillStyle = m.run ? '#ffb030' : on ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(kx, ky, 24 * k, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 2; ctx.stroke(); }
}
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { coachPanel(G); }
