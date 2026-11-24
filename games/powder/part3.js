// ===================== THE VIEW: Powder in 3D (three.js through tools/world3d.js) =====================
// From just behind and above the rider: a groomed piste curving down through pines, deep powder at its sides, peaks in the
// distance under the level's sky (morning, golden, mist, cloud, dusk), snow falling. Red and blue gates, snow kickers, rocks with
// snow on top, glinting ice. The rider crouches and leans into carves, spins in the air, tumbles in a fall, sprays snow off the
// edge. The ghost of your best run is a pale rider beside you. The 2D layer draws the clock, the course with you and your ghost,
// the split at each gate, and the trick calls.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { snap: true, touch: null, cam: null, combo: 0, split: null, boardKey: null };
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 2.8) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 140) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40 * k, t: 0, life: 0.45 + Math.random() * 0.4, col, r: (1.5 + Math.random() * 3) * k }); } if (PARTS.length > 220) PARTS.splice(0, PARTS.length - 220); }
function fxStep(dt) {
  FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2.5); FX.red = Math.max(0, FX.red - dt * 1.8);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.5) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * k * dt; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; }
  if (ui.split) { ui.split.t += dt; if (ui.split.t > 2) ui.split = null; }
}
// the snow's height: the mountain falls away as s grows, with gentle rolls (the piste is smoother than the powder beside it)
function ground(G, s, x) { const dx = x - centre(G, s), off = Math.max(0, Math.abs(dx) - G.cfg.hw); return -s * SLOPE + Math.sin(s * 0.05) * 0.8 + off * 0.06 + Math.sin(x * 0.3 + s * 0.11) * Math.min(1, off / 6) * 0.5; }
// ---------- the rider ----------
function riderModel(ghost) {
  const T = THREE, g = new T.Group(), body = new T.Group(); g.add(body);
  const M = c => ghost ? new T.MeshBasicMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.35, depthWrite: false }) : new T.MeshStandardMaterial({ color: c, roughness: 0.6 });
  const jacketM = M(0xff5a8a), pantsM = M(0x2a3a5a), skinM = M(0xe8b48a), helmM = M(0xf2f2f2), gogM = ghost ? M(0) : new T.MeshStandardMaterial({ color: 0xffa040, roughness: 0.15, metalness: 0.6 });
  const boardM = ghost ? M(0) : new T.MeshStandardMaterial({ color: 0xc89a5a, roughness: 0.4 }), stripeM = ghost ? M(0) : new T.MeshStandardMaterial({ color: 0x7a5228, roughness: 0.4 });
  // the board lies along the way you ride (+x of this group is forward), feet across it
  const bg = new T.CapsuleGeometry(0.14, 1.15, 4, 12); bg.rotateZ(Math.PI / 2); bg.scale(1, 0.12, 1.05); const board = new T.Mesh(bg, boardM); board.position.y = 0.03; body.add(board);
  const st = new T.Mesh(new T.BoxGeometry(0.9, 0.036, 0.08), stripeM); st.position.y = 0.04; body.add(st);
  const legs = []; for (const sx of [-1, 1]) { const thigh = new T.Mesh(new T.CapsuleGeometry(0.075, 0.32, 4, 8), pantsM), shin = new T.Mesh(new T.CapsuleGeometry(0.065, 0.3, 4, 8), pantsM), boot = new T.Mesh(new T.BoxGeometry(0.16, 0.1, 0.12), M(0x222222));
    boot.position.set(sx * 0.26, 0.09, 0); body.add(thigh, shin, boot); legs.push({ thigh, shin, sx }); }
  const torso = new T.Mesh(new T.CapsuleGeometry(0.17, 0.36, 4, 10), jacketM); body.add(torso);
  const head = new T.Group(); body.add(head); const hm = new T.Mesh(new T.SphereGeometry(0.15, 14, 10), helmM); head.add(hm); const face = new T.Mesh(new T.SphereGeometry(0.135, 12, 8), skinM); face.position.set(0, -0.04, 0.03); head.add(face);
  const gog = new T.Mesh(new T.BoxGeometry(0.2, 0.07, 0.06), gogM); gog.position.set(0, 0.0, 0.13); head.add(gog);
  const arms = []; for (const sx of [-1, 1]) { const a = new T.Mesh(new T.CapsuleGeometry(0.055, 0.42, 4, 8), jacketM); body.add(a); arms.push({ a, sx }); }
  g.userData = { body, board, legs, torso, head, arms, boardM, stripeM }; if (!ghost) g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g;
}
function poseRider(R, crouch, lean, t, air, crashed) {
  const u = R.userData, hip = 0.78 - crouch * 0.28;
  for (const L of u.legs) { const fx = L.sx * 0.26, kx = L.sx * 0.2 + 0.02, ky = 0.1 + (hip - 0.1) * 0.45, kz = 0.12 + crouch * 0.12; place(L.shin, fx, 0.12, 0, kx, ky, kz); place(L.thigh, kx, ky, kz, L.sx * 0.1, hip, 0); }
  const ty = hip + 0.24; u.torso.position.set(0, ty, -0.02 + crouch * 0.05); u.torso.rotation.set(0.25 + crouch * 0.4, 0, 0);
  u.head.position.set(0, ty + 0.36, 0.06 + crouch * 0.14); u.head.rotation.set(-0.1, -1.2, 0);
  for (const A of u.arms) { const sw = air ? 1.2 : 0.55 + Math.sin(t * 2 + A.sx) * 0.05; A.a.position.set(A.sx * (0.2 + sw * 0.2), ty + 0.05 - sw * 0.05, 0.05); A.a.rotation.set(0, 0, A.sx * (1.2 + sw * 0.4)); }
  u.body.rotation.set(0, 0, 0); if (crashed) { u.body.rotation.set(1.3, 0, 0); }
}
const _a = new (window.THREE ? THREE.Vector3 : Object)(), _b = new (window.THREE ? THREE.Vector3 : Object)();
function place(mesh, x1, y1, z1, x2, y2, z2) { _a.set(x1, y1, z1); _b.set(x2, y2, z2); mesh.position.copy(_a).add(_b).multiplyScalar(0.5); const d = _b.sub(_a), L = d.length(); mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); mesh.scale.set(1, L / 0.46, 1); }
// ---------- the world for this run ----------
function buildWorld() {
  if (V3) return V3; const T = THREE; if (!W3 || !W3.init({ canvas: $('gl'), fov: 62, far: 1600, near: 0.15 })) { V3 = { none: true }; return V3; }
  const S = W3.scene;
  const snowM = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0, map: W3.grainTex(256, 12, 228, 18, 10) }); snowM.map.repeat.set(40, 200);
  const peaks = new T.Group(); const pm = new T.MeshStandardMaterial({ color: 0xdfe8f2, roughness: 0.9, flatShading: true }), pr = new T.MeshStandardMaterial({ color: 0x6a7280, roughness: 1, flatShading: true }), R0 = W3.rng(9);
  for (let i = 0; i < 16; i++) { const h = 180 + R0() * 260, r = h * (0.6 + R0() * 0.4), cone = new T.Mesh(new T.ConeGeometry(r, h, 7, 3), i % 3 ? pm : pr); const a = -Math.PI / 2 + (R0() - 0.5) * 2.4, d = 900 + R0() * 400; cone.position.set(Math.cos(a) * d * 0.9, -h * 0.25, Math.sin(a) * d); cone.rotation.y = R0() * 3; peaks.add(cone); } S.add(peaks);
  const rider = riderModel(false), ghost = riderModel(true); S.add(rider, ghost);
  const sprayN = 260, sp = new Float32Array(sprayN * 3), sprayG = new T.BufferGeometry(); sprayG.setAttribute('position', new T.BufferAttribute(sp, 3));
  const spray = new T.Points(sprayG, new T.PointsMaterial({ color: 0xffffff, size: 0.16, transparent: true, opacity: 0.9, depthWrite: false, map: (() => { const c2 = document.createElement('canvas'); c2.width = c2.height = 32; const q = c2.getContext('2d'), gr = q.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); q.fillStyle = gr; q.fillRect(0, 0, 32, 32); return new T.CanvasTexture(c2); })() })); spray.frustumCulled = false; S.add(spray);
  const fallN = 900, fp = new Float32Array(fallN * 3); for (let i = 0; i < fallN; i++) fp.set([R0(), R0(), R0()], i * 3);
  const fallG = new T.BufferGeometry(); fallG.setAttribute('position', new T.BufferAttribute(fp, 3));
  const fall = new T.Points(fallG, new T.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { c: { value: new T.Vector3() }, t: { value: 0 }, a: { value: 0.6 }, sz: { value: 2 } },
    vertexShader: `uniform vec3 c; uniform float t; uniform float sz; varying float vf; void main(){ vec3 box = vec3(40.0, 24.0, 50.0); vec3 q = position * box; q.y = mod(q.y - t * 1.6 - c.y, box.y); q.x = mod(q.x + sin(t * 0.7 + position.z * 9.0) * 0.8 - c.x, box.x); q.z = mod(q.z - c.z, box.z); q += c - box * vec3(0.5, 0.5, 0.7);
      vec4 mv = modelViewMatrix * vec4(q, 1.0); vf = clamp(1.0 - (-mv.z) / 45.0, 0.0, 1.0); gl_PointSize = sz * (0.8 + fract(position.x * 37.0)) * clamp(8.0 / -mv.z, 0.5, 2.5); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float a; varying float vf; void main(){ vec2 p = gl_PointCoord - 0.5; if (dot(p, p) > 0.25) discard; gl_FragColor = vec4(1.0, 1.0, 1.0, a * vf); }` }));
  fall.frustumCulled = false; S.add(fall);
  V3 = { T, S, snowM, rider, ghost, spray, sprayP: [], fall, run: null, sky: null };
  W3.setQuality(stepN); return V3;
}
// everything that belongs to one run (the snow, the trees, gates, rocks, kickers, ice, flakes): built when a run starts
function buildRun(V, g) {
  const T = V.T, S = V.S; if (V.run) { for (const o of V.run.objs) { S.remove(o); if (o.geometry) o.geometry.dispose(); } }
  const objs = [], C = g.course, c = g.cfg, R0 = W3.rng(g.seed % 100000 + 3), len = c.len;
  // the snow: a ribbon down the course, 160 m wide
  const step = 3, cols = 46, half = 80, rows = Math.ceil((len + 260) / step), pos = new Float32Array(rows * cols * 3), col = new Float32Array(rows * cols * 3), idx = [];
  for (let r = 0; r < rows; r++) { const s = -60 + r * step, cx = centre(g, s); for (let q = 0; q < cols; q++) { const x = cx - half + q * (2 * half / (cols - 1)), i = r * cols + q, off = Math.abs(x - cx) - c.hw, h = ground(g, s, x);
      pos.set([x, h, -s], i * 3); const piste = off < 0, edge = clamp(off / 18, 0, 1), cord = piste ? (Math.sin(x * 9) > 0 ? 0.985 : 1) : 1; col.set(piste ? [0.95 * cord, 0.97 * cord, 1] : [0.86 - edge * 0.06, 0.9 - edge * 0.05, 0.98], i * 3); } }
  for (let r = 0; r + 1 < rows; r++) for (let q = 0; q + 1 < cols; q++) { const a = r * cols + q, b = a + 1, d = a + cols, e = d + 1; idx.push(a, b, d, b, e, d); }
  const sg = new T.BufferGeometry(); sg.setAttribute('position', new T.BufferAttribute(pos, 3)); sg.setAttribute('color', new T.BufferAttribute(col, 3)); const uv = new Float32Array(rows * cols * 2); for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) uv.set([q / (cols - 1), r / rows * 8], (r * cols + q) * 2); sg.setAttribute('uv', new T.BufferAttribute(uv, 2));
  sg.setIndex(idx); sg.computeVertexNormals(); const snow = new T.Mesh(sg, V.snowM); snow.receiveShadow = true; S.add(snow); objs.push(snow);
  // trees: the obstacles, and a forest beyond them
  const list = C.obs.filter(o => o.k === 'tree').map(o => ({ x: o.x, z: -o.s, y: ground(g, o.s, o.x) - 0.2, s: o.h / 7.5, hue: R0(), shade: R0() * 0.6 }));
  for (let s = -40; s < len + 200; s += 4) for (const sd of [-1, 1]) if (R0() < 0.8) { const x = centre(g, s) + sd * (c.hw + 16 + R0() * 60); list.push({ x, z: -s, y: ground(g, s, x) - 0.3, s: 0.6 + R0() * 0.8, hue: R0(), shade: R0() * 0.6 }); }
  const pines = W3.pines(list, { layers: 4, shadow: true }); objs.push(pines);
  // snow on the branches: a white cap on each tree
  const capM = new T.MeshStandardMaterial({ color: 0xf4f8ff, roughness: 0.8, flatShading: true }), caps = new T.InstancedMesh(new T.ConeGeometry(0.9, 1.6, 7), capM, list.length), d = new T.Object3D();
  list.forEach((t, i) => { d.position.set(t.x, t.y + 7.6 * t.s, t.z); d.rotation.set(0, R0() * 3, 0); d.scale.setScalar(t.s); d.updateMatrix(); caps.setMatrixAt(i, d.matrix); }); S.add(caps); objs.push(caps);
  // rocks with snow on top
  const rocks = C.obs.filter(o => o.k === 'rock'), rockM = new T.MeshStandardMaterial({ color: 0x5a5e66, roughness: 0.95, flatShading: true }), rk = new T.InstancedMesh(new T.DodecahedronGeometry(1, 0), rockM, Math.max(1, rocks.length)), rc = new T.InstancedMesh(new T.SphereGeometry(1, 10, 6, 0, TAU, 0, Math.PI / 2), capM, Math.max(1, rocks.length));
  rk.count = rc.count = rocks.length; rocks.forEach((o, i) => { const y = ground(g, o.s, o.x); d.position.set(o.x, y + o.r * 0.12, -o.s); d.rotation.set(R0(), R0(), R0()); d.scale.set(o.r, o.r * 0.5, o.r); d.updateMatrix(); rk.setMatrixAt(i, d.matrix); d.rotation.set(0, R0() * 3, 0); d.position.y = y + o.r * 0.42; d.scale.set(o.r * 0.85, o.r * 0.25, o.r * 0.85); d.updateMatrix(); rc.setMatrixAt(i, d.matrix); });
  rk.castShadow = true; S.add(rk, rc); objs.push(rk, rc); V.rockList = rocks;
  // gates: two poles and a banner, red and blue in turn
  const poleG = new T.CylinderGeometry(0.05, 0.05, 2.2, 6); poleG.translate(0, 1.1, 0); const poles = new T.InstancedMesh(poleG, new T.MeshStandardMaterial({ roughness: 0.5 }), Math.max(1, C.gates.length * 2));
  const banG = new T.PlaneGeometry(0.75, 0.9); banG.translate(0.38, 1.7, 0); const bans = new T.InstancedMesh(banG, new T.MeshStandardMaterial({ roughness: 0.7, side: T.DoubleSide }), Math.max(1, C.gates.length * 2)), cc = new T.Color();
  poles.count = bans.count = C.gates.length * 2;
  C.gates.forEach((q, i) => { const colr = i % 2 ? 0x2a6aff : 0xff3a3a; for (const sd of [-1, 1]) { const x = q.x + sd * q.w / 2, j = i * 2 + (sd > 0 ? 1 : 0); d.position.set(x, ground(g, q.s, x), -q.s); d.rotation.set(0, sd > 0 ? Math.PI : 0, 0); d.scale.setScalar(1); d.updateMatrix(); poles.setMatrixAt(j, d.matrix); poles.setColorAt(j, cc.setHex(colr)); bans.setMatrixAt(j, d.matrix); bans.setColorAt(j, cc.setHex(colr)); } });
  poles.castShadow = true; S.add(poles, bans); objs.push(poles, bans); V.bans = bans;
  // kickers: a wedge of packed snow with a coloured lip
  for (const q of C.kicks) { const y0 = ground(g, q.s, q.x), y1 = ground(g, q.s + q.l, q.x), wg = new T.BufferGeometry(), w2 = q.w / 2, lift = 1.2;
    const P = [[-w2, y0, -q.s], [w2, y0, -q.s], [-w2, y1 + lift, -(q.s + q.l)], [w2, y1 + lift, -(q.s + q.l)], [-w2, y1, -(q.s + q.l)], [w2, y1, -(q.s + q.l)]];
    wg.setAttribute('position', new T.BufferAttribute(new Float32Array([...P[0], ...P[2], ...P[1], ...P[1], ...P[2], ...P[3], ...P[2], ...P[4], ...P[3], ...P[3], ...P[4], ...P[5], ...P[0], ...P[4], ...P[2], ...P[1], ...P[3], ...P[5]]), 3)); wg.computeVertexNormals();
    const km = new T.Mesh(wg, new T.MeshStandardMaterial({ color: 0xeaf2ff, roughness: 0.6, side: T.DoubleSide })); km.castShadow = km.receiveShadow = true; S.add(km); objs.push(km);
    const lip = new T.Mesh(new T.BoxGeometry(q.w, 0.06, 0.25), new T.MeshStandardMaterial({ color: 0xff5a8a, roughness: 0.5 })); lip.position.set(q.x, y1 + lift, -(q.s + q.l)); S.add(lip); objs.push(lip); }
  // ice: glassy patches lying on the snow
  for (const z of C.ice) { const pg = new T.PlaneGeometry(z.w, z.l, 1, 4); pg.rotateX(-Math.PI / 2); const p = pg.attributes.position; for (let i = 0; i < p.count; i++) { const s = z.s + z.l / 2 - p.getZ(i), x = z.x + p.getX(i); p.setXYZ(i, x, ground(g, s, x) + 0.03, -s); } pg.computeVertexNormals();
    const im = new T.Mesh(pg, new T.MeshStandardMaterial({ color: 0x9ad8ff, roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.55 })); S.add(im); objs.push(im); }
  // snowflakes to collect
  const fl = new T.InstancedMesh(new T.OctahedronGeometry(0.22, 0), new T.MeshStandardMaterial({ color: 0x9ae8ff, emissive: 0x4ab8ff, emissiveIntensity: 0.9, roughness: 0.2, metalness: 0.4 }), Math.max(1, C.flakes.length)); fl.count = C.flakes.length; S.add(fl); objs.push(fl);
  V.run = { g, objs, fl, poles, finish: null }; V.flakes = fl;
  // the finish arch
  const fy = ground(g, len, centre(g, len)), arch = new T.Group(), am = new T.MeshStandardMaterial({ color: 0xff5a8a, roughness: 0.5 }); for (const sd of [-1, 1]) { const p = new T.Mesh(new T.BoxGeometry(0.5, 5, 0.5), am); p.position.set(sd * (c.hw * 0.9), 2.5, 0); arch.add(p); } const top = new T.Mesh(new T.BoxGeometry(c.hw * 1.8 + 0.5, 0.9, 0.4), am); top.position.y = 5; arch.add(top);
  const chk = new T.Mesh(new T.PlaneGeometry(c.hw * 1.8, 0.8), new T.MeshBasicMaterial({ map: checkTex(), side: T.DoubleSide })); chk.position.set(0, 5, 0.21); arch.add(chk); arch.position.set(centre(g, len), fy, -len); S.add(arch); objs.push(arch);
  // the board you ride
  const b = myBoard(); V.rider.userData.boardM.color.setHex(b.c1); V.rider.userData.stripeM.color.setHex(b.c2);
  ui.cam = null;
}
function checkTex() { const c = document.createElement('canvas'); c.width = 64; c.height = 8; const g = c.getContext('2d'); for (let i = 0; i < 16; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? '#111' : '#fff'; g.fillRect(i * 4, j * 4, 4, 4); } const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; return t; }
const SV = new (window.THREE ? THREE.Vector3 : Object)();
function scr(x, y, z) { if (!V3 || V3.none) return { x: W / 2, y: H / 2, front: true }; SV.set(x, y, z); return W3.screen(SV); }
function riderAt(g) { const m = g.me; return scr(m.x, ground(g, m.s, m.x) + m.y + 1, -m.s); }
// ---------- events ----------
function onEvent(G, e) {
  const p = riderAt(G), cx = W / 2;
  switch (e.k) {
    case 'start': say(PLACES[G.place].name.toUpperCase(), cx, H * 0.3, '#ffffff', 26); say(`BEAT ${G.par} S`, cx, H * 0.36, '#ffd0e0', 24); sfx.go(); if (G.N <= 2) tip('carve', 'Hold your thumb and slide it left or right to carve. Let go to tuck and go fastest.', 3.4); break;
    case 'gate': ui.combo++; sfx.gate(ui.combo); say('✓', p.x, p.y - 40 * k, '#8fe0ab', 26); vibe(HAP.light); splitAt(G, e); break;
    case 'gatemiss': ui.combo = 0; sfx.miss(); say('MISSED GATE +3 s', cx, H * 0.4, '#ff8a8a', 22); FX.red = 0.4; splitAt(G, e); tip('gates', 'Ride between the two flags of every gate.', 2.6); break;
    case 'ollie': sfx.ollie(); break;
    case 'launch': sfx.launch(); if (G.N <= 5) tip('spin', 'In the air: hold a side to spin, let go when the board faces down the hill', 3); break;
    case 'trick': { const name = { 180: '180!', 360: '360!', 540: '540!!', 720: '720!!', 900: '900!!!', 1080: '1080!!!' }[e.pts] || e.pts + '!'; sfx.trick(e.spins); say(name, cx, H * 0.34, '#ffd040', 34 + e.spins * 3); if (e.clean) say('CLEAN', cx, H * 0.4, '#ffffff', 18); FX.flash = 0.25 + e.spins * 0.08; vibe(e.spins >= 3 ? HAP.best : HAP.sharp); burst(p.x, p.y, '#ffd040', 14 + e.spins * 6); break; }
    case 'bigair': sfx.land(); say('BIG AIR', cx, H * 0.36, '#bfe8ff', 24); break;
    case 'land': sfx.land(); break;
    case 'crash': ui.combo = 0; sfx.crash(); FX.shake = 8; FX.red = 0.5; say(e.why === 'land' ? 'CROOKED LANDING!' : e.why === 'rock' ? 'ROCK!' : 'TREE!', cx, H * 0.38, '#ffb4a8', 26); burst(p.x, p.y, '#ffffff', 26, 220);
      if (e.why === 'land') tip('land', 'Let go of the spin when the board points down the hill (or right round backwards)', 3); if (e.why === 'rock') tip('rock', 'Tap to jump over rocks, just before you reach them', 2.8); break;
    case 'up': break;
    case 'ice': say('ICE!', p.x, p.y - 40 * k, '#9ad8ff', 18); sfx.ice(); tip('ice', 'On ice your edges slip: turn early', 2.4); break;
    case 'flake': sfx.flake(e.n); break;
    case 'lessonnext': if (e.first) hint = null; say('FIRST, A LESSON', cx, H * 0.36, '#ffe08a', 26); sfx.go(); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, cx, H * 0.44, '#9be3b5', 24); sfx.gate(e.n); break;
    case 'lessonmiss': coachMiss(); break;
    case 'lessondone': say('NOW THE REAL RUN!', cx, H * 0.36, '#ffe08a', 26); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); if (V3 && !V3.none) V3.runFor = null; break;
    case 'won': sfx.win(); vibe(HAP.best); say('BEAT THE CLOCK!', cx, H * 0.3, '#ffd040', 34); break;
    case 'lost': sfx.lose(); say('TOO SLOW', cx, H * 0.3, '#ffb4a8', 32); break;
  }
}
// at each gate: how you stand against your ghost (honest: its real time at this point of its run)
function splitAt(G, e) { const gt = ghostTimeAt(G, e.s); if (gt == null) return; const d = G.t + G.pen - gt; ui.split = { d, t: 0 }; }
function ghostTimeAt(G, s) { const tr = G.ghost; if (!tr || tr.length < 2) return null; let lo = 0, hi = tr.length - 1; if (s >= tr[hi][0]) return tr[hi][2]; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (tr[mid][0] <= s) lo = mid; else hi = mid; } const a = tr[lo], b = tr[hi], u = (s - a[0]) / Math.max(1e-6, b[0] - a[0]); return a[2] + (b[2] - a[2]) * u; }
function ghostAt(G, t) { const tr = G.ghost; if (!tr || tr.length < 2) return null; let lo = 0, hi = tr.length - 1; if (t >= tr[hi][2]) return null; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (tr[mid][2] <= t) lo = mid; else hi = mid; } const a = tr[lo], b = tr[hi], u = clamp((t - a[2]) / Math.max(1e-6, b[2] - a[2]), 0, 1); return { s: a[0] + (b[0] - a[0]) * u, x: a[1] + (b[1] - a[1]) * u, y: (a[3] || 0) + ((b[3] || 0) - (a[3] || 0)) * u }; }
// ---------- every frame in 3D ----------
function animate(g, t, dt) {
  const V = V3, m = g.me, gy = ground(g, m.s, m.x), R = V.rider, cr = m.crashT > 0;
  R.position.set(m.x, gy + m.y + 0.02, -m.s); const yaw = Math.PI / 2 - m.a + (m.switch ? Math.PI : 0) + m.rot;
  R.rotation.set(0, yaw, -Math.atan(SLOPE * Math.cos(m.a)) * (m.switch ? -1 : 1) * (Math.cos(m.rot) >= 0 ? 1 : -1) * (m.air ? 0.4 : 1), 'YXZ'); const lean = cr ? 0 : (m.air ? 0 : clamp(g.lean * Math.min(1, m.v / 8), -1, 1) * 0.5);
  R.userData.body.rotation.set(0, 0, 0); poseRider(R, cr ? 0.9 : m.air ? 0.6 : g.held ? 0.35 : 0.75, lean, t, m.air, cr);
  R.userData.body.rotation.x = cr ? 0 : -lean * (m.switch ? -1 : 1) * 0.9; if (cr) { R.userData.body.rotation.z = Math.sin((1.25 - m.crashT) * 9) * 0.6; R.userData.body.position.y = 0.1; } else R.userData.body.position.y = 0;
  // the ghost of your best
  const gh = ghostAt(g, g.t); V.ghost.visible = !!gh && !g.lesson; if (gh) { V.ghost.position.set(gh.x, ground(g, gh.s, gh.x) + gh.y + 0.02, -gh.s); V.ghost.rotation.set(0, Math.PI / 2, -Math.atan(SLOPE), 'YXZ'); poseRider(V.ghost, 0.7, 0, t, gh.y > 0.2, false); }
  // spray off the edge while carving hard, a puff when landing or falling
  const P = V.sprayP; if (!m.air && !cr && (m.edge > 0.25 || Math.abs(g.lean) > 0.5) && m.v > 5) for (let i = 0; i < 4; i++) P.push({ x: m.x - Math.sin(m.a) * 0.3, y: gy + 0.1, z: -m.s + 0.4, vx: -Math.sign(g.lean || 1) * (1 + Math.random() * 2) + Math.sin(m.a) * m.v * 0.6, vy: 1 + Math.random() * 2, vz: -Math.cos(m.a) * m.v * 0.6, t: 0 });
  if (cr && Math.random() < 0.6) for (let i = 0; i < 3; i++) P.push({ x: m.x, y: gy + 0.3, z: -m.s, vx: (Math.random() - 0.5) * 4, vy: Math.random() * 3, vz: -m.v * 0.3, t: 0 });
  while (P.length > 260) P.shift(); const pa = V.spray.geometry.attributes.position; for (let i = 0; i < 260; i++) { const q = P[i]; if (q) { q.t += dt; q.vy -= 6 * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; pa.setXYZ(i, q.x, q.y, q.z); } else pa.setXYZ(i, 0, -1e4, 0); } for (let i = P.length - 1; i >= 0; i--) if (P[i].t > 0.7) P.splice(i, 1); pa.needsUpdate = true;
  // flakes spin; taken ones vanish; gates you passed turn green
  const C = g.course, D = DUMMY; C.flakes.forEach((f, i) => { D.position.set(f.x, ground(g, f.s, f.x) + 0.9 + Math.sin(t * 3 + i) * 0.12, -f.s); D.rotation.set(0, t * 2 + i, 0); D.scale.setScalar(f.got ? 0.0001 : 1); D.updateMatrix(); V.flakes.setMatrixAt(i, D.matrix); }); V.flakes.instanceMatrix.needsUpdate = true;
  if (V.gateSeen !== g.gatesOk + g.missed) { V.gateSeen = g.gatesOk + g.missed; const cc = new THREE.Color(); C.gates.forEach((q, i) => { if (q.done) for (const j of [i * 2, i * 2 + 1]) V.bans.setColorAt(j, cc.setHex(q.done > 0 ? 0x5ae08a : 0x555555)); }); if (V.bans.instanceColor) V.bans.instanceColor.needsUpdate = true; }
  const fu = V.fall.material.uniforms; fu.t.value = t; fu.c.value.copy(W3.cam.position); fu.sz.value = 2 * DPR; fu.a.value = g.sky === 'overcast' || g.sky === 'mist' ? 0.85 : g.sky === 'dusk' ? 0.6 : 0.35;
}
const DUMMY = new (window.THREE ? THREE.Object3D : Object)();
function placeCam(g, dt) {
  const cam = W3.cam, m = g.me, asp = innerWidth / innerHeight, gy = ground(g, m.s, m.x), sp = Math.min(1, m.v / 16);
  cam.fov = asp < 0.8 ? 64 + sp * 6 : 52 + sp * 5; cam.aspect = asp; cam.updateProjectionMatrix();
  const back = 6.2 + sp * 1.4, up = 2.9 + sp * 0.4, want = { x: m.x - Math.sin(m.a) * back * 0.35, y: gy + Math.max(0, m.y * 0.6) + up + back * SLOPE, z: -m.s + back };
  if (!ui.cam || ui.snap) { ui.cam = Object.assign({}, want); ui.snap = false; }
  const c = ui.cam, e = 1 - Math.exp(-dt * 6), ez = 1 - Math.exp(-dt * 12); c.x += (want.x - c.x) * e; c.y += (want.y - c.y) * e; c.z += (want.z - c.z) * ez;
  const sh = FX.shake ? (Math.random() - 0.5) * FX.shake * 0.015 : 0;
  cam.position.set(c.x + sh, c.y + sh, c.z); const ls = m.s + 9; cam.lookAt(m.x * 0.6 + centre(g, ls) * 0.4, ground(g, ls, m.x) + 0.6 + m.y * 0.3, -ls); cam.updateMatrixWorld();
  W3.scene.fog.near = 30; W3.scene.fog.far = g.sky === 'mist' ? 120 : g.sky === 'overcast' ? 220 : 520;
}
let IG = null; function idleG() { if (!IG || IG.over) { IG = newGame(Math.max(3, store.get('level', 1) | 0), { seed: (Math.random() * 1e6) | 0 }); IG.mem = {}; ui.snap = true; } honest(IG, { react: 0.25, acc: 0.95 }, IG.mem); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#0e1c30'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D mountain.', W / 2, H / 2); return; }
  const g = G || idleG(), t = now;
  if (V.runFor !== g || V.runKey !== g.cv) { V.runFor = g; V.runKey = g.cv; buildRun(V, g); V.gateSeen = -1; }
  if (V.sky !== g.sky) { V.sky = g.sky; W3.setSky(g.sky, { azim: 200 }); if (g.sky === 'dusk') { W3.hemi.color.set(0x9ab0e8); W3.hemi.groundColor.set(0x6a7090); W3.S.hemiI = 1.6; W3.S.exposure = 1.0; W3.scene.environmentIntensity = 0.5; } }
  placeCam(g, dt); animate(g, t, dt); const m = g.me; W3.setFocus(m.x, ground(g, m.s, m.x), -m.s - 4, 14); W3.render(dt);
  if (G) hud(G, t);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 1.1 ? 1 : 1 - (t2.t - 1.1) / 0.4; ctx.globalAlpha = Math.max(0, al); const sc = t2.t < 0.12 ? 1.35 - t2.t / 0.12 * 0.35 : 1; ctx.font = `400 ${Math.round(t2.size * k * sc)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(10,20,40,.6)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 22); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 22); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30;
    ctx.fillStyle = 'rgba(14,28,48,.86)'; rrect(W / 2 - w / 2, H * 0.6 - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.6 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,40,60,${FX.red * 0.15})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,250,235,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); }
}
// ---------- the 2D layer ----------
function panel(x, y, w, h) { ctx.fillStyle = 'rgba(12,24,44,.7)'; rrect(x, y, w, h, 14); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 1.5; rrect(x, y, w, h, 14); ctx.stroke(); }
function hud(G, t) {
  const m = G.me, c = G.cfg; ctx.textBaseline = 'middle';
  if (!G.lesson) {
    const x = 12, y = 48 * k, w = W - 24, h = 64 * k; panel(x, y, w, h); const now = G.t + G.pen, left = G.par - now;
    ctx.textAlign = 'left'; ctx.font = `400 ${Math.round(24 * k)}px ${TF}`; ctx.fillStyle = left < 0 ? '#ff8a8a' : left < 5 ? '#ffd040' : '#fff'; ctx.fillText(now.toFixed(1), x + 12, y + 20 * k);
    const tw = ctx.measureText(now.toFixed(1)).width; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillText(`/ ${G.par} s` + (G.pen ? `  (+${G.pen} s gates)` : ''), x + 18 + tw, y + 22 * k);
    ctx.textAlign = 'right'; ctx.fillStyle = '#fff'; ctx.font = `800 ${Math.round(13 * k)}px ${BC}`; ctx.fillText(`${Math.round(m.v * 3.6)} km/h`, x + w - 12, y + 14 * k); ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillText(`gates ${G.gatesOk}/${G.course.gates.length} · ❄ ${G.flakes} · 🪙 ${G.coins}`, x + w - 12, y + 29 * k);
    // the course: where you are, where your ghost is, the finish flag
    const bx = x + 12, bw = w - 24, by = y + 46 * k; ctx.fillStyle = 'rgba(255,255,255,.18)'; rrect(bx, by - 2 * k, bw, 4 * k, 2 * k); ctx.fill(); ctx.fillStyle = '#ff5a8a'; rrect(bx, by - 2 * k, bw * clamp(m.s / c.len, 0, 1), 4 * k, 2 * k); ctx.fill();
    for (const q of G.course.gates) { ctx.fillStyle = q.done > 0 ? '#5ae08a' : q.done < 0 ? '#ff6a6a' : 'rgba(255,255,255,.5)'; ctx.fillRect(bx + bw * q.s / c.len - 1, by - 5 * k, 2, 10 * k); }
    const gh = ghostAt(G, G.t); if (gh) { ctx.fillStyle = 'rgba(200,230,255,.9)'; ctx.beginPath(); ctx.arc(bx + bw * clamp(gh.s / c.len, 0, 1), by, 5 * k, 0, TAU); ctx.fill(); ctx.font = `700 ${Math.round(9 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillText('ghost', bx + bw * clamp(gh.s / c.len, 0, 1), by + 11 * k); }
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(bx + bw * clamp(m.s / c.len, 0, 1), by, 6 * k, 0, TAU); ctx.fill(); ctx.font = `${Math.round(11 * k)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('🏁', bx + bw + 2, by - 1);
    if (ui.split) { const a = Math.min(1, (2 - ui.split.t) / 0.4), d = ui.split.d; ctx.globalAlpha = Math.max(0, a); ctx.font = `400 ${Math.round(20 * k)}px ${TF}`; ctx.textAlign = 'center'; ctx.fillStyle = d <= 0 ? '#7af0a0' : '#ff8a8a'; ctx.fillText(`${d <= 0 ? '−' : '+'}${Math.abs(d).toFixed(1)} s vs ghost`, W / 2, y + h + 22 * k); ctx.globalAlpha = 1; }
  } else lessonPanel(G);
  // your thumb: a slider showing how far you lean
  const tch = ui.touch; if (tch) { const R = 60 * k, l = G.lean; ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 4 * k; ctx.beginPath(); ctx.moveTo(tch.x0 - R, tch.y0); ctx.lineTo(tch.x0 + R, tch.y0); ctx.stroke();
    ctx.fillStyle = m.air ? 'rgba(255,208,64,.75)' : 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.arc(tch.x0 + l * R, tch.y0, 18 * k, 0, TAU); ctx.fill(); if (m.air) { ctx.font = `400 ${Math.round(12 * k)}px ${TF}`; ctx.textAlign = 'center'; ctx.fillStyle = '#ffe08a'; ctx.fillText('SPIN', tch.x0, tch.y0 - 30 * k); } }
  else if (G.t < 5 && G.N <= 2 && !G.over) { ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 4); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText('hold and slide to carve · tap to jump', W / 2, H - 70 * k); ctx.globalAlpha = 1; }
  // in the air: how far round you are (land at the top or bottom of the dial)
  if (m.air && m.airT > 0.12) { const p = riderAt(G), r = 22 * k, a = m.rot - Math.PI / 2; ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3 * k; ctx.beginPath(); ctx.arc(p.x, p.y - 70 * k, r, 0, TAU); ctx.stroke();
    const half = Math.round(m.rot / Math.PI), ok = Math.abs(m.rot - half * Math.PI) < c.land; ctx.fillStyle = ok ? '#7af0a0' : '#ff8a6a'; ctx.beginPath(); ctx.arc(p.x + Math.cos(a) * r, p.y - 70 * k + Math.sin(a) * r, 6 * k, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(122,240,160,.5)'; for (const q of [-Math.PI / 2, Math.PI / 2]) { ctx.beginPath(); ctx.arc(p.x + Math.cos(q) * r, p.y - 70 * k + Math.sin(q) * r, 3 * k, 0, TAU); ctx.fill(); }
    if (half) { ctx.font = `400 ${Math.round(14 * k)}px ${TF}`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText(Math.abs(half) * 180 + '°', p.x, p.y - 70 * k); } }
}
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { coachPanel(G); }
