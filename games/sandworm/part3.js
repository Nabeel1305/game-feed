// ===================== THE VIEW: Sandworm Rider (sideways; behind and above the rider) =====================
// Rolling dunes that follow you to the horizon, the worm's long banded body humping through the sand behind you (it is the
// trail of its head, so it carves the same curve), your rider standing on its head and leaning into the turns, pairs of tall
// waystones (the next pair glows, with a beam of light), canyon walls, rocks or broken columns, cracked sand with two warning
// poles, a brown wall of dust where a storm leg starts, small flags along the shortcuts, and sand pouring off the worm.
const FX = { shake: 0, stop: 0, flash: 0, red: 0, slow: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { snap: true, banner: null, stick: null, btn: {}, cam: null, yaw: 0, storm: 0, fov: 58, rt: null };
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS || !(G && G.lesson)) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 160) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40 * k, t: 0, life: 0.5 + Math.random() * 0.4, col, r: (1.5 + Math.random() * 2.5) * k }); } if (PARTS.length > 240) PARTS.splice(0, PARTS.length - 240); }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2.5); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.4) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 200 * dt; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (ui.banner) { ui.banner.t += dt; if (ui.banner.t > (ui.banner.secs || 1.6)) ui.banner = null; }
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; } }
function mySkin() { if (typeof HEADLESS !== 'undefined' && HEADLESS) return SKINS[0]; const id = store.get('skin', 'sand'); return SKINS.find(q => q.id === id) || SKINS[0]; }
const RAD = [3.8, 4.6, 5.4];      // the worm's thickness by kind
const SAND = [[0.86, 0.66, 0.42], [0.8, 0.46, 0.28], [0.88, 0.74, 0.54], [0.66, 0.56, 0.44], [0.86, 0.52, 0.3]];
function buildWorld() {
  if (V3) return V3; const T = window.THREE; if (!T || !W3 || !W3.init({ canvas: $('gl'), fov: 58, far: 2600, near: 0.5, dims: () => [W, H] })) { V3 = { none: true }; return V3; }
  V3 = { T, S: W3.scene, t: 0, for: null, items: [] }; const V = V3, M = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.85 }, o)); V.M = M;
  V.sphG = new T.SphereGeometry(1, 18, 12); V.boxG = new T.BoxGeometry(1, 1, 1); V.cylG = new T.CylinderGeometry(1, 1, 1, 10);
  // the worm: 34 body rings (instanced), a head with a round toothed mouth, and the rider
  V.body = new T.InstancedMesh(V.sphG, M(0xffffff, { roughness: 0.9 }), 34); V.body.castShadow = true; V.body.frustumCulled = false; V.S.add(V.body);
  V.head = new T.Group(); V.S.add(V.head);
  V.headM = new T.Mesh(V.sphG, M(0xffffff, { roughness: 0.75 })); V.headM.castShadow = true; V.head.add(V.headM);
  V.maw = new T.Mesh(new T.TorusGeometry(0.78, 0.2, 10, 24), M(0x5a2a20, { roughness: 0.6 })); V.maw.rotation.y = Math.PI / 2; V.maw.position.x = 0.86; V.head.add(V.maw);
  const tooth = new T.ConeGeometry(0.09, 0.32, 6); for (let i = 0; i < 14; i++) { const a = i / 14 * TAU, t2 = new T.Mesh(tooth, M(0xf4ead2, { roughness: 0.4 })); t2.position.set(0.86, Math.sin(a) * 0.66, Math.cos(a) * 0.66); t2.rotation.x = -a; t2.rotation.z = 0; t2.lookAt(0.86, 0, 0); t2.rotateX(Math.PI / 2); V.head.add(t2); }
  const throat = new T.Mesh(new T.CircleGeometry(0.62, 20), new T.MeshBasicMaterial({ color: 0x1a0806 })); throat.rotation.y = Math.PI / 2; throat.position.x = 0.9; V.head.add(throat);
  V.rider = makeRider(V); V.S.add(V.rider.g);
  // flying sand
  { const n = 420, g = new T.BufferGeometry(); V.sp = { n, i: 0, p: new Float32Array(n * 3), v: new Float32Array(n * 3), life: new Float32Array(n) }; g.setAttribute('position', new T.BufferAttribute(V.sp.p, 3));
    const dc = document.createElement('canvas'); dc.width = dc.height = 32; const dg = dc.getContext('2d'), gr = dg.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); dg.fillStyle = gr; dg.fillRect(0, 0, 32, 32);
    V.spray = new T.Points(g, new T.PointsMaterial({ color: 0xe8c090, size: 1.6, map: new T.CanvasTexture(dc), transparent: true, opacity: 0.9, depthWrite: false })); V.spray.frustumCulled = false; V.S.add(V.spray); }
  V.crackTex = crackTex(T); V.sandTex = W3.grainTex(256, 7, 236, 22, 1); V.sandTex.repeat.set(120, 120); V.rockTex = W3.grainTex(256, 11, 190, 60, 2);
  W3.setQuality(stepN); return V; }
function makeRider(V) { const T = V.T, M = V.M, g = new T.Group(), cloth = M(0x2a3a5a), skin = M(0x8d5a3a), scarf = M(0xd0482a);
  const legs = new T.Mesh(V.boxG, M(0x3a2a20)); legs.scale.set(0.35, 0.8, 0.5); legs.position.y = 0.4; g.add(legs);
  const body = new T.Mesh(V.boxG, cloth); body.scale.set(0.42, 0.75, 0.6); body.position.y = 1.15; g.add(body);
  const cape = new T.Mesh(new T.ConeGeometry(0.55, 1.4, 8, 1, true), M(0x8a6a44, { side: T.DoubleSide })); cape.position.set(-0.15, 1.05, 0); g.add(cape);
  const head = new T.Mesh(V.sphG, skin); head.scale.setScalar(0.24); head.position.y = 1.72; g.add(head);
  const wrap = new T.Mesh(V.sphG, scarf); wrap.scale.set(0.27, 0.16, 0.27); wrap.position.y = 1.66; g.add(wrap);
  const arm = new T.Mesh(V.boxG, cloth); arm.scale.set(0.7, 0.14, 0.14); arm.position.set(0.35, 1.3, 0.25); g.add(arm);
  const arm2 = arm.clone(); arm2.position.z = -0.25; g.add(arm2);
  const rein = new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(0.7, 1.3, 0), new T.Vector3(3, 0.2, 0)]), new T.LineBasicMaterial({ color: 0x3a2a1a })); g.add(rein);
  g.scale.setScalar(2.4); g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return { g, body, cape, head }; }
function crackTex(T) { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), R = rng(3); g.clearRect(0, 0, 256, 256);
  const grd = g.createRadialGradient(128, 128, 10, 128, 128, 128); grd.addColorStop(0, 'rgba(60,30,15,.55)'); grd.addColorStop(0.75, 'rgba(80,40,20,.35)'); grd.addColorStop(1, 'rgba(80,40,20,0)'); g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = 'rgba(30,12,6,.9)'; g.lineCap = 'round'; for (let i = 0; i < 16; i++) { let x = 128, y = 128, a = R() * TAU; g.lineWidth = 3 + R() * 3; g.beginPath(); g.moveTo(x, y); for (let j = 0; j < 7; j++) { a += (R() - 0.5) * 0.9; x += Math.cos(a) * 16; y += Math.sin(a) * 16; g.lineTo(x, y); } g.stroke(); }
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t; }
// ---------- the place: built once per route ----------
function buildPlace(V, G) { const T = V.T, R = rng(G.seed + 5), P = G.cfg.place, L = G.route;
  for (const o of V.items) { V.S.remove(o); if (o.geometry && o.geometry !== V.boxG && o.geometry !== V.cylG && o.geometry !== V.sphG) o.geometry.dispose(); } V.items = []; const add = o => { V.S.add(o); V.items.push(o); return o; };
  if (V.terr) { V.S.remove(V.terr); V.terr.geometry.dispose(); }
  W3.setSky(PLACES[P].sky); { const f = W3.scene.fog; V.fog0 = { n: f.near, f: f.far, c: f.color.clone() }; }
  V.terr = null; V.tc = null;
  // canyon walls: both sides of every narrow leg
  const walls = []; for (let i = 0; i < L.line.length - 1; i++) { const A = L.line[i], B = L.line[i + 1]; if (!L.legs[A.leg] || !L.legs[A.leg].narrow) continue; const dx = B.x - A.x, dz = B.z - A.z, len = Math.hypot(dx, dz), nx = -dz / len, nz = dx / len, hw = halfW(G, A.leg);
    for (const s of [-1, 1]) { const off = hw + 9 + RAD[G.cfg.worm] * 0.7, mx = (A.x + B.x) / 2 + nx * s * off, mz = (A.z + B.z) / 2 + nz * s * off; walls.push({ x: mx, z: mz, len: len + 14, a: Math.atan2(dz, dx), h: 22 + R() * 14 }); } }
  if (walls.length) { const im = add(new T.InstancedMesh(new T.BoxGeometry(1, 1, 1, 6, 6, 2), V.M(0xffffff, { roughness: 0.95, map: V.rockTex }), walls.length)), m = new T.Matrix4(), q = new T.Quaternion(), c = new T.Color(); walls.forEach((w, i) => { const y = sandH(G, w.x, w.z); q.setFromEuler(new T.Euler((R() - 0.5) * 0.12, -w.a + (R() - 0.5) * 0.15, (R() - 0.5) * 0.1, 'YXZ')); m.compose(new T.Vector3(w.x, y + w.h / 2 - 6, w.z), q, new T.Vector3(w.len, w.h, 18)); im.setMatrixAt(i, m); c.setRGB(0.62 + R() * 0.1, 0.3 + R() * 0.06, 0.18); im.setColorAt(i, c); }); im.castShadow = true; im.receiveShadow = true; }
  // rocks (or, in the buried city, broken columns)
  V.rockIM = null; if (L.rocks.length) { const col = P === 2, geo = col ? new T.CylinderGeometry(0.75, 0.9, 1, 12) : new T.DodecahedronGeometry(1, 0), im = add(new T.InstancedMesh(geo, V.M(col ? 0xd8c8a8 : 0x8a5a3a, { roughness: 0.9 }), L.rocks.length)), m = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler();
    L.rocks.forEach((r, i) => { const y = sandH(G, r.x, r.z); e.set((R() - 0.5) * (col ? 0.3 : 1), R() * 6, (R() - 0.5) * (col ? 0.3 : 1)); q.setFromEuler(e); m.compose(new T.Vector3(r.x, y + (col ? r.r * 1.2 : r.r * 0.35), r.z), q, col ? new T.Vector3(r.r * 0.8, r.r * 3, r.r * 0.8) : new T.Vector3(r.r, r.r * 0.9, r.r)); im.setMatrixAt(i, m); }); im.castShadow = true; }
  // cracked sand: a dark patch that follows the dune, two warning poles with red cloth
  V.cracks = L.cracks.map(cr => { const g = new T.CircleGeometry(cr.r, 28); g.rotateX(-Math.PI / 2); const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, sandH(G, cr.x + p.getX(i), cr.z + p.getZ(i)) + 0.35); const d = add(new T.Mesh(g, new T.MeshBasicMaterial({ map: V.crackTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }))); d.position.set(cr.x, 0, cr.z);
    const rd = routeDist(G, cr.x, cr.z), a = Math.atan2(rd.tg.z, rd.tg.x), poles = [];
    for (const s of [-1, 1]) { const px = cr.x - Math.sin(a) * s * (cr.r + 3), pz = cr.z + Math.cos(a) * s * (cr.r + 3), y = sandH(G, px, pz), pg = new T.Group(); const pole = new T.Mesh(V.cylG, V.M(0x3a2a1a)); pole.scale.set(0.25, 9, 0.25); pole.position.y = 4.5; pg.add(pole); const flag = new T.Mesh(new T.PlaneGeometry(3, 1.8), V.M(0xff3a1a, { side: T.DoubleSide, emissive: 0x401006 })); flag.position.set(1.5, 8, 0); pg.add(flag); pg.position.set(px, y, pz); add(pg); poles.push(pg); }
    return { cr, d, poles }; });
  // the shortcuts: little flags both sides
  { const fl = []; for (const c of L.cuts) { const dx = c.b.x - c.a.x, dz = c.b.z - c.a.z, len = Math.hypot(dx, dz), nx = -dz / len, nz = dx / len; for (let s2 = 10; s2 < len - 10; s2 += 22) for (const s of [-1, 1]) fl.push({ x: c.a.x + dx * s2 / len + nx * s * 8, z: c.a.z + dz * s2 / len + nz * s * 8 }); }
    if (fl.length) { const im = add(new T.InstancedMesh(new T.ConeGeometry(0.8, 3.2, 4), V.M(0x40c0ff, { emissive: 0x103040 }), fl.length)), m = new T.Matrix4(); fl.forEach((f, i) => { m.makeTranslation(f.x, sandH(G, f.x, f.z) + 1.6, f.z); im.setMatrixAt(i, m); }); } }
  // storm legs: a wall of dust at each end
  V.dust = []; L.legs.forEach((lg, i) => { if (!lg.storm) return; for (const e2 of [0, 1]) { const A = L.pts[i + e2], B = L.pts[i + (e2 ? 0 : 1)], a = Math.atan2(B.z - A.z, B.x - A.x); const pl = add(new T.Mesh(new T.PlaneGeometry(900, 160), new T.MeshBasicMaterial({ color: 0xa8783e, transparent: true, opacity: 0.55, depthWrite: false, side: T.DoubleSide, fog: false }))); pl.position.set(A.x + Math.cos(a) * 10, sandH(G, A.x, A.z) + 60, A.z + Math.sin(a) * 10); pl.rotation.y = -a + Math.PI / 2; V.dust.push(pl); } });
  // the buried city: arches and broken walls out in the sand, off the route
  if (P === 2 || P === 4) for (let i = 0; i < 14; i++) { const s = L.line[(R() * L.line.length) | 0], a = R() * TAU, d = 70 + R() * 180, x = s.x + Math.cos(a) * d, z = s.z + Math.sin(a) * d; if (routeDist(G, x, z).d < 55) continue; const y = sandH(G, x, z), g = new T.Group(), st = V.M(0xd8c4a0);
    for (const sx of [-6, 6]) { const c = new T.Mesh(V.cylG, st); c.scale.set(1.6, 16, 1.6); c.position.set(sx, 6, 0); g.add(c); } const top = new T.Mesh(V.boxG, st); top.scale.set(16, 2.4, 3.4); top.position.y = 14.5; g.add(top); g.position.set(x, y - 2, z); g.rotation.set((R() - 0.5) * 0.2, R() * 6, (R() - 0.5) * 0.25); g.traverse(o => { if (o.isMesh) o.castShadow = true; }); add(g); }
  V.ways = null; V.wayN = -1; V.route = L; ui.snap = true; }
// the waystones: rebuilt whenever the route grows (free roam) or the next pair changes
function buildWays(V, G) { const T = V.T, L = G.route; if (V.ways) { for (const o of V.ways) { V.S.remove(o); o.traverse(m => { if (m.isMesh && m.geometry !== V.boxG) m.geometry.dispose(); }); } } V.ways = []; const r = gateR(G);
  for (let i = 1; i < L.pts.length; i++) { const P = L.pts[i], A = L.pts[i - 1], a = Math.atan2(P.z - A.z, P.x - A.x), next = i === G.wp, done = i < G.wp, last = i === L.pts.length - 1 && !G.cfg.free;
    const g = new T.Group(), st = V.M(done ? 0x6a5a48 : 0xc8b08a, { emissive: next ? 0x553000 : 0x000000, roughness: 0.8 });
    const leg = L.legs[i - 1], ro = leg && leg.narrow ? Math.min(r + 1.5, halfW(G, i - 1) + RAD[G.cfg.worm] * 0.7 + 1) : r + 1.5;
    for (const s of [-1, 1]) { const x = P.x - Math.sin(a) * s * ro, z = P.z + Math.cos(a) * s * ro, y = sandH(G, x, z), ob = new T.Mesh(new T.CylinderGeometry(0.9, 2.4, last ? 30 : 20, 4), st); ob.position.set(x, y + (last ? 13 : 8), z); ob.rotation.y = -a + Math.PI / 4; ob.castShadow = true; g.add(ob);
      if (next) { const band = new T.Mesh(new T.CylinderGeometry(1.6, 1.8, 1.2, 4), new T.MeshBasicMaterial({ color: 0xffc040 })); band.position.set(x, y + (last ? 20 : 14), z); band.rotation.y = ob.rotation.y; g.add(band); } }
    if (next) { const y = sandH(G, P.x, P.z), beam = new T.Mesh(new T.CylinderGeometry(1.2, 1.2, 140, 10, 1, true), new T.MeshBasicMaterial({ color: 0xffd060, transparent: true, opacity: 0.28, depthWrite: false, side: T.DoubleSide })); beam.position.set(P.x, y + 70, P.z); g.add(beam);
      const lin = new T.Mesh(V.boxG, new T.MeshBasicMaterial({ color: 0xffd060, transparent: true, opacity: 0.7 })); lin.scale.set(0.4, 0.4, r * 2 + 3); lin.position.set(P.x, y + (last ? 24 : 16), P.z); lin.rotation.y = -a; g.add(lin); }
    V.S.add(g); V.ways.push(g); } }
// the ground follows you: a big patch of dunes, re-made around you whenever you have ridden far from its middle
function followGround(V, G) { const w = G.w; if (V.terr && V.tc && Math.hypot(w.x - V.tc.x, w.z - V.tc.z) < 330) return; if (V.terr) { V.S.remove(V.terr); V.terr.geometry.dispose(); }
  const P = G.cfg.place, base = SAND[P], cx = Math.round(w.x / 10) * 10, cz = Math.round(w.z / 10) * 10; V.tc = { x: cx, z: cz };
  V.terr = W3.terrain({ size: 1700, seg: 150, x: cx, z: cz, map: V.sandTex, height: (x, z) => sandH(G, x, z), colour: (x, z, h, sl) => { const u = clamp((h + 18) / 36, 0, 1), s = clamp(sl * 3, 0, 1); const ripple = 0.03 * Math.sin(x * 0.7 + z * 0.3);
    const lin = v => Math.pow(clamp(v, 0, 1), 2.2); return [lin(base[0] * (0.95 + 0.18 * u - 0.14 * s) + ripple), lin(base[1] * (0.93 + 0.2 * u - 0.15 * s) + ripple), lin(base[2] * (0.9 + 0.2 * u - 0.12 * s))]; } }); }
// ---------- each frame ----------
const TV = {}; function tv(V) { if (!TV.m) { const T = V.T; TV.m = new T.Matrix4(); TV.q = new T.Quaternion(); TV.e = new T.Euler(); TV.v = new T.Vector3(); TV.s = new T.Vector3(); TV.c = new T.Color(); } return TV; }
function emit(V, x, y, z, n, sp, up) { const S2 = V.sp; for (let i = 0; i < n; i++) { const j = S2.i = (S2.i + 1) % S2.n, a = Math.random() * TAU; S2.p[j * 3] = x + (Math.random() - 0.5) * 3; S2.p[j * 3 + 1] = y; S2.p[j * 3 + 2] = z + (Math.random() - 0.5) * 3; S2.v[j * 3] = Math.cos(a) * sp * Math.random(); S2.v[j * 3 + 1] = up * (0.4 + Math.random() * 0.8); S2.v[j * 3 + 2] = Math.sin(a) * sp * Math.random(); S2.life[j] = 0.8 + Math.random() * 0.9; } }
function sync(V, G, dt) { V.t += dt; const T = V.T, w = G.w, X = tv(V), rad = RAD[G.cfg.worm] * (G.cfg.worm ? 1 : 1);
  if (V.route !== G.route) { buildPlace(V, G); }
  if (V.wayN !== G.wp * 1000 + G.route.pts.length) { V.wayN = G.wp * 1000 + G.route.pts.length; buildWays(V, G); }
  followGround(V, G);
  const sk = mySkin(); if (V.skin !== sk.id) { V.skin = sk.id; V.body.material.color.setHex(0xffffff); V.headM.material.color.setHex(sk.col); }
  // the body: rings along the trail of the head, a ring every 3.4 m
  const tr = G.trail, n = Math.min(34, Math.round(WORMS[G.cfg.worm].len * 1.3)); let acc = 0, j = 0, prev = tr[0] || { x: w.x, y: w.y, z: w.z };
  const cA = new T.Color(sk.col), cB = new T.Color(sk.col).multiplyScalar(0.78);
  for (let i = 0; i < 34; i++) { let p = null; if (i < n && tr.length > 1) { const want = (i + 1) * rad * 0.95; while (j < tr.length - 1 && acc < want) { acc += Math.hypot(tr[j + 1].x - tr[j].x, tr[j + 1].z - tr[j].z); j++; } p = tr[j]; }
    if (!p || i >= n) { X.m.makeScale(0, 0, 0); V.body.setMatrixAt(i, X.m); continue; }
    const taper = 1 - (i / n) * 0.55, sink = (i / n) * 1.4, wav = Math.sin(V.t * 2 - i * 0.6) * 0.4; X.s.set(rad * 1.25 * taper, rad * taper, rad * taper); X.v.set(p.x, p.y - sink + wav, p.z);
    const a = Math.atan2(prev.z - p.z, prev.x - p.x); X.q.setFromAxisAngle(new T.Vector3(0, 1, 0), -a); X.m.compose(X.v, X.q, X.s); V.body.setMatrixAt(i, X.m); V.body.setColorAt(i, i % 2 ? cA : cB); prev = p; }
  V.body.instanceMatrix.needsUpdate = true; if (V.body.instanceColor) V.body.instanceColor.needsUpdate = true;
  // the head, pitched up on a breach
  const pitch = w.air ? clamp(w.vy / 25, -0.6, 0.6) : clamp(w.vy / 40, -0.3, 0.3); V.head.position.set(w.x, w.y + rad * 0.15, w.z); V.head.rotation.set(0, -w.h, pitch, 'YZX'); V.head.scale.setScalar(rad * 1.25);
  // the rider: on top of the head, leaning into the turn; crouched when bracing; wobbling when balance is going; thrown off on a fall
  const Rd = V.rider, top = rad * 1.25 * 0.96;
  if (G.phase === 'fall') { const f = G.fallAt || w, tt = 1.6 - G.fallT, u = tt / 1.6, fwd = f.v * 0.8 * (1 - Math.exp(-tt * 1.2)) / 1.2, side = 7 * tt;      // thrown off: you carry the worm's speed forward and fly out to the side on a real arc, and stop on the sand
    const x = f.x + Math.cos(f.h) * fwd - Math.sin(f.h) * side, z = f.z + Math.sin(f.h) * fwd + Math.cos(f.h) * side, y = Math.max(sandH(G, x, z) + 0.3, f.y + top + (f.vy || 0) * tt * 0.6 + 5 * tt - 11 * tt * tt); Rd.g.position.set(x, y, z); Rd.g.rotation.set(Math.min(u, 0.6) * 4, -f.h, Math.min(u, 0.6) * 3); }
  else { const wob = G.bal < 0.35 ? Math.sin(V.t * 18) * (0.35 - G.bal) * 0.9 : 0; Rd.g.position.set(w.x - Math.cos(w.h) * rad * 0.2, w.y + rad * 0.15 + top, w.z - Math.sin(w.h) * rad * 0.2); Rd.g.rotation.set(G.lean * 0.45 + wob, -w.h, (G.brace ? -0.35 : 0) + (w.air ? -0.2 : 0), 'YXZ'); Rd.g.scale.set(2.4, G.brace ? 1.8 : 2.4, 2.4); }
  // flying sand: off the sides at speed, a fountain on a breach, a burst on landing
  if (G.phase === 'ride' && !w.air && w.v > 12 && !HEADLESS) emit(V, w.x + Math.cos(w.h) * rad, sandH(G, w.x, w.z), w.z + Math.sin(w.h) * rad, Math.round(w.v / 9), 6, 4 + w.v * 0.2);
  { const S2 = V.sp; for (let i = 0; i < S2.n; i++) { if (S2.life[i] <= 0) { S2.p[i * 3 + 1] = -999; continue; } S2.life[i] -= dt; S2.v[i * 3 + 1] -= 14 * dt; S2.p[i * 3] += S2.v[i * 3] * dt; S2.p[i * 3 + 1] += S2.v[i * 3 + 1] * dt; S2.p[i * 3 + 2] += S2.v[i * 3 + 2] * dt; } V.spray.geometry.attributes.position.needsUpdate = true; }
  // cracked sand that has gone
  for (const c of V.cracks) if (c.cr.done) { c.d.position.y = Math.max(-6, c.d.position.y - dt * 4); c.poles.forEach((p, i) => { p.rotation.z = Math.min(1.4, p.rotation.z + dt * 2) * (i ? 1 : 1); }); }
  for (const d of V.dust) d.material.opacity = 0.45 + Math.sin(V.t * 0.7 + d.position.x) * 0.1;
  // the storm: the air thickens and browns
  ui.storm += ((G.inStorm ? 1 : 0) - ui.storm) * Math.min(1, dt * 1.2); { const f = W3.scene.fog, F0 = V.fog0; if (F0) { f.near = lerp(F0.n, 6, ui.storm); f.far = lerp(F0.f, 170, ui.storm); f.color.copy(F0.c).lerp(X.c.setHex(0xa0703c), ui.storm); } }
  // the camera: behind and above, swinging round after the worm's heading
  if (ui.snap) ui.yaw = w.h; let dy = w.h - ui.yaw; while (dy > Math.PI) dy -= TAU; while (dy < -Math.PI) dy += TAU; ui.yaw += dy * Math.min(1, dt * 2.6);
  { const lg = G.route.legs[routeDist(G, w.x, w.z).leg]; ui.canyon = (ui.canyon || 0) + (((lg && lg.narrow) ? 1 : 0) - (ui.canyon || 0)) * Math.min(1, dt * 1.5); }
  const back = lerp(26 + rad * 3.4, 12 + rad * 2, ui.canyon), upC = lerp(13 + rad * 2, 26 + rad * 2.4, ui.canyon), cx = w.x - Math.cos(ui.yaw) * back, cz = w.z - Math.sin(ui.yaw) * back, cy = Math.max(w.y * 0.6 + sandH(G, w.x, w.z) * 0.4 + upC, sandH(G, cx, cz) + 5);
  let px = cx, pz = cz; { const rd = routeDist(G, px, pz), lg = G.route.legs[rd.leg]; if (lg && lg.narrow) { const hw = halfW(G, rd.leg) - 3; if (rd.d > hw) { const u = (rd.d - hw) / rd.d; px += (rd.p.x - px) * u; pz += (rd.p.z - pz) * u; } } }
  const pos = [px, Math.max(cy, sandH(G, px, pz) + 5), pz], tgt = [w.x + Math.cos(ui.yaw) * 26, Math.max(w.y, sandH(G, w.x, w.z)) + 3, w.z + Math.sin(ui.yaw) * 26];
  if (!ui.cam || ui.snap) { ui.cam = { p: pos.slice(), l: tgt.slice() }; ui.snap = false; } const kc = Math.min(1, dt * 4); for (let i = 0; i < 3; i++) { ui.cam.p[i] += (pos[i] - ui.cam.p[i]) * kc; ui.cam.l[i] += (tgt[i] - ui.cam.l[i]) * kc; }
  const sh = FX.shake > 0 ? (Math.random() - 0.5) * FX.shake * 0.06 : 0, cam = W3.cam; cam.position.set(ui.cam.p[0] + sh, ui.cam.p[1] + sh, ui.cam.p[2]); cam.lookAt(ui.cam.l[0], ui.cam.l[1], ui.cam.l[2]);
  const fv = 56 + clamp((w.v - 12) / 25, 0, 1) * 12; ui.fov += (fv - ui.fov) * Math.min(1, dt * 2); if (Math.abs(cam.fov - ui.fov) > 0.05) { cam.fov = ui.fov; cam.updateProjectionMatrix(); } cam.updateMatrixWorld();
  W3.setFocus(w.x, w.y, w.z, 70); }
function scrOf(x, y, z) { const V = V3; if (!V || V.none) return null; return W3.screen(new V.T.Vector3(x, y, z)); }
const riderAt = G => scrOf(G.w.x, G.w.y + RAD[G.cfg.worm] * 1.4 + 3, G.w.z) || { x: W / 2, y: H * 0.5 };
// ---------- events ----------
function onEvent(G, e) { const rp = () => riderAt(G);
  switch (e.k) {
    case 'breach': { sfx.breach(e.v); vibe(e.v > 30 ? HAP.heavy : HAP.thud); FX.shake = 5; const p = rp(); say(e.v > 31 ? 'BIG AIR!' : 'BREACH!', p.x, p.y - 50 * k, '#ffd36a', e.v > 31 ? 34 : 28); if (V3 && !V3.none) emit(V3, G.w.x, G.w.y, G.w.z, 90, 10, 14); tip('breach', 'Breach! Hold BRACE before you come down.', 3); } break;
    case 'land': { sfx.land(e.hit, G.brace); vibe(e.hit > 6 ? HAP.heavy : HAP.thud); FX.shake = 4 + Math.min(12, e.hit); if (V3 && !V3.none) emit(V3, G.w.x, G.w.y + 2, G.w.z, 70 + Math.round(e.hit * 6), 12, 8); if (G.brace && e.hit > 0) { const p = rp(); say('BRACED', p.x, p.y - 30 * k, '#8fe0ab', 20); } } break;
    case 'knock': { const p = rp(), nm = { rock: G.cfg.place === 2 ? 'COLUMN!' : 'ROCK!', wall: 'CANYON WALL!', collapse: 'THE SAND GAVE WAY!', land: 'HARD LANDING!' }[e.why] || 'KNOCK!';
      if (e.braced) { sfx.braced(); say('BRACED', p.x, p.y - 30 * k, '#8fe0ab', 20); } else { FX.red = Math.min(1, e.v * 2); say(nm, p.x, p.y - 40 * k, '#ffb0a0', 22); }
      if (e.why === 'rock') sfx.rock(); else if (e.why === 'wall') sfx.wall(); FX.shake = Math.max(FX.shake, 6 + e.v * 20); vibe(HAP.sharp);
      if (!e.braced && e.why === 'land') tip('land', 'Hold BRACE as you come down from a breach: braced, you hardly wobble.', 3.4);
      if (!e.braced && e.why === 'rock') tip('rock', 'Steer round the rocks early: the worm turns late.', 3); } break;
    case 'collapse': sfx.collapse(); FX.shake = 10; break;
    case 'strain': if (gate('strainv', 260)) vibe(HAP.tick); sfx.creak(); break;
    case 'wobble': if (gate('wob', 1400)) { const p = rp(); say('HOLD ON!', p.x, p.y - 60 * k, '#ff7a5a', 26); sfx.warn(); tip('wobble', 'Your balance is going: ease the turn, or hold BRACE.', 3); } break;
    case 'brace': sfx.brace(); break;
    case 'fall': sfx.fall(); ui.banner = { txt: 'YOU FELL!', sub: G.cfg.free ? 'Back on the worm in a moment' : `Back to the last waystone · ${Math.max(0, G.cfg.lives - G.falls)} ${G.cfg.lives - G.falls === 1 ? 'fall' : 'falls'} left`, t: 0, secs: 1.6 }; FX.red = 0.6; break;
    case 'back': sfx.back(); ui.snap = true; ui.backAt = performance.now(); break;
    case 'dive': { sfx.dive(); const p = rp(); say('DIVE!', p.x, p.y - 30 * k, '#fff', 20); } break;
    case 'way': { sfx.way(e.i); vibe(HAP.light); const p = rp(); say(G.cfg.free || G.lesson ? 'WAYSTONE!' : `WAYSTONE ${e.i} OF ${e.n}`, W / 2, H * 0.3, '#ffd36a', 26); burst(W / 2, H * 0.3, '#ffd36a', 14, 120); } break;
    case 'arrive': sfx.arrive(); ui.banner = { txt: 'ARRIVED!', sub: '', t: 0, secs: 1.4 }; break;
    case 'storm': sfx.storm(); tip('storm', 'In the storm, gusts push you about and balance slips: brace if it gets wild.', 3.4); break;
    case 'stormahead': ui.banner = { txt: 'STORM AHEAD', sub: 'Gusts and dust on the next stretch', t: 0, secs: 2.2, small: true }; sfx.warn(); break;
    case 'crackahead': tip('crack', 'Red flags: cracked sand. It gives way under you: BRACE as you cross it.', 3.4); break;
    case 'lessonnext': if (e.first) hint = null; say('FIRST, A LESSON', W / 2, H * 0.36, '#ffd36a', 24); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, W / 2, H * 0.4, '#8fe0ab', 24); sfx.coin(e.n); break;
    case 'lessonmiss': coachMiss(); say('AGAIN', W / 2, H * 0.44, '#ffd0a0', 20); break;
    case 'lessondone': say('READY: RIDE THE ROUTE!', W / 2, H * 0.36, '#ffd36a', 24); sfx.arrive(); ui.snap = true; if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); FX.flash = 0.5; vibe(HAP.best); break;
    case 'lost': sfx.lose(); break;      // (P11: never vibrate on failure)
  } }
// ---------- the picture ----------
let IG = null, IM = {}; function idleG() { if (!IG || IG.over || IG.t > 50) { IG = newGame(3 + ((Math.random() * 10) | 0), { seed: (Math.random() * 1e6) | 0 }); IM = {}; ui.snap = true; } honest(IG, { react: 0.3, acc: 0.95 }, IM); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#d8a870'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D desert.', W / 2, H / 2); if (G) hud(G, now); return; }
  const g = G || idleG(); sync(V, g, dt || 1 / 60); W3.render(dt || 1 / 60);
  if (FX.red > 0) { ctx.fillStyle = `rgba(200,40,30,${FX.red * 0.18})`; ctx.fillRect(0, 0, W, H); }
  if (G) { const fa = G.phase === 'fall' ? clamp(1 - (G.fallT - 0.1) / 0.45, 0, 1) : clamp(1 - (performance.now() - (ui.backAt || -1e9)) / 450, 0, 1); if (fa > 0.01) { ctx.fillStyle = `rgba(20,12,6,${fa})`; ctx.fillRect(0, 0, W, H); } }      // the view goes dark before you are put back at the waystone, and opens again there
  if (G && !(G.over && !$('ovEnd').classList.contains('hidden'))) hud(G, now);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 1.1 ? 1 : 1 - (t2.t - 1.1) / 0.5; ctx.globalAlpha = Math.max(0, al); ctx.font = `900 ${Math.round(t2.size * 0.8 * k)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(40,20,10,.75)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 18); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 18); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, Math.min(W - 340 * k, 420 * k)), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30, hy = H - 60 * k - h / 2;
    ctx.fillStyle = 'rgba(40,22,12,.92)'; rrect(W / 2 - w / 2, hy - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, hy - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,240,210,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); } }
// ---------- the HUD: the stick (left), BRACE and SURGE (right), balance round the rider, the route and the sun at the top ----------
function layout(G) { const r = 50 * k; return { surge: { x: W - 72 * k, y: H - 78 * k, r }, brace: { x: W - 186 * k, y: H - 66 * k, r: 40 * k } }; }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of String(t).split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function txt(s, x, y, col = '#fff', font, al = 'center') { ctx.textAlign = al; if (font) ctx.font = font; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(40,20,10,.7)'; ctx.strokeText(s, x, y); ctx.fillStyle = col; ctx.fillText(s, x, y); }
function button(B, on, label, sub, col) { ctx.globalAlpha = on ? 1 : 0.85; ctx.fillStyle = on ? col : 'rgba(40,22,12,.5)'; ctx.beginPath(); ctx.arc(B.x, B.y, B.r * (on ? 0.94 : 1), 0, TAU); ctx.fill(); ctx.strokeStyle = on ? '#fff' : col; ctx.lineWidth = 3; ctx.stroke();
  txt(label, B.x, B.y - (sub ? 5 * k : 0), '#fff', `900 ${Math.round(B.r * 0.32)}px ${TF}`); if (sub) txt(sub, B.x, B.y + 14 * k, 'rgba(255,255,255,.8)', `700 ${Math.round(10 * k)}px ${BC}`); ctx.globalAlpha = 1; }
function hud(G, now) { ctx.textBaseline = 'middle'; const L = layout(G), w = G.w;
  // balance: a ring round the rider, and the lean
  if (G.phase === 'ride') { const p = riderAt(G), r = 26 * k, b = clamp(G.bal, 0, 1), col = b > 0.6 ? '#8fe0ab' : b > 0.3 ? '#ffd36a' : (Math.sin(now * 20) > 0 ? '#ff4a3a' : '#ffb0a0');
    ctx.lineWidth = 6 * k; ctx.strokeStyle = 'rgba(40,20,10,.45)'; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.stroke(); ctx.strokeStyle = col; ctx.beginPath(); ctx.arc(p.x, p.y, r, -Math.PI / 2, -Math.PI / 2 + TAU * b); ctx.stroke();
    if (Math.abs(G.lean) > 0.25) { const s = Math.sign(G.lean); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(p.x + s * (r + 14 * k), p.y); ctx.lineTo(p.x + s * (r + 4 * k), p.y - 7 * k); ctx.lineTo(p.x + s * (r + 4 * k), p.y + 7 * k); ctx.fill(); } }
  // the next pair of stones: a marker over them, or an arrow at the edge when they are off screen
  const P = G.route.pts[G.wp]; if (P && G.phase !== 'fall') { const s = scrOf(P.x, sandH(G, P.x, P.z) + 24, P.z), d = Math.hypot(P.x - w.x, P.z - w.z);
    if (s && s.front && s.x > 20 && s.x < W - 20 && s.y > 50 * k && s.y < H - 20) { txt('▼', s.x, s.y, '#ffd36a', `900 ${Math.round(18 * k)}px sans-serif`); txt(`${Math.round(d)} m`, s.x, s.y - 16 * k, '#fff', `700 ${Math.round(12 * k)}px ${BC}`); }
    else { let a = Math.atan2(P.z - w.z, P.x - w.x) - ui.yaw; while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; const ax = W / 2 + clamp(a / 1.2, -1, 1) * (W / 2 - 60 * k), ay = 78 * k; ctx.save(); ctx.translate(ax, ay); ctx.rotate(a); ctx.fillStyle = '#ffd36a'; ctx.beginPath(); ctx.moveTo(0, -16 * k); ctx.lineTo(11 * k, 8 * k); ctx.lineTo(-11 * k, 8 * k); ctx.fill(); ctx.restore(); txt(`${Math.round(d)} m`, ax, ay + 22 * k, '#fff', `700 ${Math.round(12 * k)}px ${BC}`); } }
  // the top: route, sunset, falls; or the lesson
  if (G.lesson) lessonPanel(G);
  else { const cx = W / 2, y = 24 * k; ctx.fillStyle = 'rgba(40,22,12,.55)'; rrect(cx - 150 * k, y - 16 * k, 300 * k, 34 * k, 12); ctx.fill();
    if (G.cfg.free) txt(`FREE ROAM · ${G.wp - 1} waystones · ${G.breaches} breaches`, cx, y + 1, '#fff', `700 ${Math.round(14 * k)}px ${BC}`);
    else { const n = G.route.pts.length - 1, left = Math.max(0, G.sunset - G.t), fr = clamp(left / (G.sunset - (G.t0 || 0)), 0, 1);
      txt(`◆ ${Math.min(n, G.wp - 1)}/${n}`, cx - 138 * k, y + 1, '#ffd36a', `700 ${Math.round(15 * k)}px ${BC}`, 'left');
      const bx = cx - 62 * k, bw = 128 * k; ctx.fillStyle = 'rgba(0,0,0,.35)'; rrect(bx, y - 6 * k, bw, 12 * k, 6); ctx.fill(); ctx.fillStyle = fr > 0.25 ? '#ffb347' : '#ff5a3a'; rrect(bx, y - 6 * k, bw * fr, 12 * k, 6); ctx.fill(); txt('☀', bx + bw * fr, y, '#fff3b0', `${Math.round(14 * k)}px sans-serif`);
      txt('♥'.repeat(Math.max(0, G.cfg.lives - G.falls)) + '♡'.repeat(Math.min(G.cfg.lives, G.falls)), cx + 140 * k, y + 1, '#ff8a6a', `700 ${Math.round(15 * k)}px sans-serif`, 'right');
      if (G.chal) { const c = G.chal, keep = c.id === 'nofall' || c.id === 'steady', ok = chalDone(G), mark = keep ? (ok ? '' : '✗ ') : ok ? '✓ ' : '';
        txt(mark + chalText(c) + (c.id === 'breach' ? ` (${Math.min(G.breaches, c.n)}/${c.n})` : ''), cx, y + 30 * k, keep ? (ok ? 'rgba(255,255,255,.85)' : '#ffb0a0') : ok ? '#8fe0ab' : 'rgba(255,255,255,.85)', `700 ${Math.round(11 * k)}px ${BC}`); } } }
  // speed
  { const sp = clamp(w.v / G.W.vmax, 0, 1.15), x = W - 132 * k, y = H - 150 * k; txt(`${Math.round(w.v * 3.6)} km/h`, x + 60 * k, y, sp > 0.85 ? '#ffd36a' : '#fff', `700 ${Math.round(13 * k)}px ${BC}`); }
  // the stick
  if (ui.stick) { const s2 = ui.stick, R = 56 * k; ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.arc(s2.x0, s2.y0, R, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 2; ctx.stroke(); const dx = clamp(s2.x - s2.x0, -R, R); ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.arc(s2.x0 + dx, s2.y0, 22 * k, 0, TAU); ctx.fill(); }
  else if (G.t < 8 || (G.lesson && G.lesson.id === 'steer')) { const x = 110 * k, y = H - 90 * k, a = Math.sin(now * 3) * 30 * k; ctx.globalAlpha = 0.6; ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.beginPath(); ctx.arc(x, y, 56 * k, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + a, y, 20 * k, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; txt('DRAG TO STEER', x, y - 70 * k, '#fff', `700 ${Math.round(12 * k)}px ${BC}`); }
  button(L.brace, G.brace, 'BRACE', 'hold', '#5aa0ff'); button(L.surge, G.surge, 'SURGE', 'hold', '#ff8a3a');
  if (ui.banner) banner(); }
function banner() { const b = ui.banner, a = Math.min(1, b.t / 0.2, ((b.secs || 1.6) - b.t) / 0.4); ctx.globalAlpha = Math.max(0, a); txt(b.txt, W / 2, H * 0.34, '#ffd36a', `900 ${Math.round((b.small ? 28 : 38) * k)}px ${TF}`); if (b.sub) txt(b.sub, W / 2, H * 0.34 + 30 * k, '#fff', `700 ${Math.round(14 * k)}px ${BC}`); ctx.globalAlpha = 1; }
function lessonPanel(G) { coachPanel(G); }
