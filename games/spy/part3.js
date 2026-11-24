// ===================== THE VIEW: Spy in 3D (three.js; renderer from tools/world3d.js) =====================
// The building at night seen from above and a little behind you (walls cut at waist height so you can see into rooms).
// Guards carry torches: their sight is a fan of light on the floor, cut by walls and cupboards, white when calm, amber when
// curious, red when they have seen you. Footsteps you make running ring out on the floor. The file glows on its desk; the
// van waits outside. The camera button (top right) steps the view between close, middle and far.
const FX = { shake: 0, stop: 0, flash: 0, red: 0, slow: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { snap: true, cam: null, banner: null, drag: null, zoom: 1 };
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 160) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: 0.5 + Math.random() * 0.4, col, r: (1.5 + Math.random() * 2.5) * k }); } if (PARTS.length > 240) PARTS.splice(0, PARTS.length - 240); }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2.5); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.4) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (ui.banner) { ui.banner.t += dt; if (ui.banner.t > (ui.banner.secs || 1)) ui.banner = null; }
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; } }
function mySkin() { if (typeof HEADLESS !== 'undefined' && HEADLESS) return SKINS[0]; const id = store.get('skin', 'trench'); return SKINS.find(q => q.id === id) || SKINS[0]; }
function canvasTex(w, h, fn, rep) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return t; }
const WALL_H = 1.25;
function buildWorld() {
  if (V3) return V3; const T = window.THREE; if (!T || !W3 || !W3.init({ canvas: $('gl'), fov: 50, far: 200, near: 0.1 })) { V3 = { none: true }; return V3; }
  V3 = { T, S: W3.scene, t: 0 }; const V = V3;
  V.boxG = new T.BoxGeometry(1, 1, 1); V.sphG = new T.SphereGeometry(1, 16, 12); V.cylG = new T.CylinderGeometry(1, 1, 1, 16); V.capG = new T.CapsuleGeometry(1, 1, 4, 10);
  W3.setSky('night', { azim: 210 }); W3.S.exposure = 1.1; W3.R.toneMappingExposure = 1.1; W3.scene.environmentIntensity = 0.3; W3.hemi.intensity = 0.9; W3.S.hemiI = 0.9; W3.scene.fog.near = 30; W3.scene.fog.far = 90; W3.scene.children.forEach(o => { if (o.isLineSegments) o.visible = false; });
  V.spy = makePerson(V, mySkin().col, 0x2a2a2a, true); V.S.add(V.spy.g);
  V.guards = []; V.cones = []; V.coneM = []; for (let i = 0; i < 6; i++) { const P = makePerson(V, 0x2a3a5a, 0x1a2234, false); P.g.visible = false; V.S.add(P.g); V.guards.push(P);
    const m = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, depthWrite: false, side: T.DoubleSide }), geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(new Float32Array(26 * 3 * 3), 3)); const c = new T.Mesh(geo, m); c.frustumCulled = false; c.visible = false; V.S.add(c); V.cones.push(c); }
  V.camCones = []; for (let i = 0; i < 4; i++) { const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(new Float32Array(26 * 3 * 3), 3)); const c = new T.Mesh(geo, new T.MeshBasicMaterial({ color: 0xff5a4a, transparent: true, opacity: 0.16, depthWrite: false, side: T.DoubleSide })); c.frustumCulled = false; c.visible = false; V.S.add(c); V.camCones.push(c); }
  V.ringM = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, depthWrite: false }); V.rings = []; for (let i = 0; i < 8; i++) { const r = new T.Mesh(new T.RingGeometry(0.9, 1, 32), V.ringM.clone()); r.rotation.x = -Math.PI / 2; r.visible = false; V.S.add(r); V.rings.push(r); }
  V.glowT = canvasTex(64, 64, (g, w, h) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  W3.setQuality(stepN); return V; }
function makePerson(V, coat, trousers, spy) { const T = V.T, g = new T.Group(), body = new T.Group(); g.add(body); const M = (c, r = 0.7) => new T.MeshStandardMaterial({ color: c, roughness: r });
  const coatM = M(coat, 0.8), legs = [-1, 1].map(s => { const L = new T.Mesh(V.capG, M(trousers)); L.scale.set(0.09, 0.3, 0.09); L.position.set(s * 0.1, 0.38, 0); L.castShadow = true; body.add(L); return L; });
  const torso = new T.Mesh(V.capG, coatM); torso.scale.set(0.2, 0.28, 0.15); torso.position.y = 1.0; torso.castShadow = true; body.add(torso);
  const head = new T.Mesh(V.sphG, M(0xd8a07a, 0.6)); head.scale.setScalar(0.13); head.position.y = 1.42; body.add(head);
  const hat = new T.Group(); hat.position.y = 1.52; body.add(hat); const brim = new T.Mesh(V.cylG, M(spy ? 0x3a2a1a : 0x1a2234)); brim.scale.set(spy ? 0.22 : 0.15, 0.02, spy ? 0.22 : 0.15); hat.add(brim); const crown = new T.Mesh(V.cylG, M(spy ? 0x3a2a1a : 0x1a2234)); crown.scale.set(0.13, 0.12, 0.13); crown.position.y = 0.06; hat.add(crown);
  let torch = null; if (!spy) { torch = new T.Mesh(V.cylG, M(0x444444, 0.3)); torch.scale.set(0.03, 0.18, 0.03); torch.rotation.x = Math.PI / 2; torch.position.set(0.2, 0.95, 0.18); body.add(torch); const L = new T.Mesh(new T.CircleGeometry(0.035, 12), new T.MeshBasicMaterial({ color: 0xfff2c0, toneMapped: false })); L.position.set(0.2, 0.95, 0.28); body.add(L); }
  const sh = new T.Mesh(new T.CircleGeometry(0.32, 20), new T.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.35, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.position.y = 0.012; g.add(sh);
  return { g, body, legs, torso, coatM, step: 0 }; }
// the building: walls, doors and furniture, once per mission
function buildLevel(V, G) { const T = V.T, S = V.S; if (V.lvl) { S.remove(V.lvl); V.lvl.traverse(o => { if (o.geometry && ![V.boxG, V.sphG, V.cylG, V.capG].includes(o.geometry)) o.geometry.dispose(); }); }
  V.lvl = new T.Group(); S.add(V.lvl); V.built = G.grid; const M = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.8 }, o));
  const floorTex = canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#5a6068'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(20,24,30,.5)'; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2); for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`; g.fillRect(Math.random() * w, Math.random() * h, 3, 3); } }, [G.W, G.H]);
  const fl = new T.Mesh(new T.PlaneGeometry(G.W, G.H), new T.MeshStandardMaterial({ map: floorTex, roughness: 0.6 })); fl.rotation.x = -Math.PI / 2; fl.position.set(G.W / 2, 0, G.H / 2); fl.receiveShadow = true; V.lvl.add(fl);
  const pave = new T.Mesh(new T.PlaneGeometry(G.W + 30, 30), M(0x2a2c30, { roughness: 1 })); pave.rotation.x = -Math.PI / 2; pave.position.set(G.W / 2, -0.01, G.H - 3 + 15); V.lvl.add(pave);
  const grass = new T.Mesh(new T.PlaneGeometry(G.W + 60, G.H + 60), M(0x1a2a1a, { roughness: 1 })); grass.rotation.x = -Math.PI / 2; grass.position.set(G.W / 2, -0.02, G.H / 2 - 10); V.lvl.add(grass);
  // walls: one instanced box per wall cell
  let n = 0; for (let z = 0; z < G.H; z++) for (let x = 0; x < G.W; x++) if (G.grid[z][x] === 1) n++;
  const wm = new T.InstancedMesh(V.boxG, M(0xd8d0c0, { roughness: 0.9 }), n), mm = new T.Matrix4(); let i = 0; for (let z = 0; z < G.H; z++) for (let x = 0; x < G.W; x++) if (G.grid[z][x] === 1) { mm.makeScale(1, WALL_H, 1); mm.setPosition(x + 0.5, WALL_H / 2, z + 0.5); wm.setMatrixAt(i++, mm); }
  wm.castShadow = true; wm.receiveShadow = true; V.lvl.add(wm); const top = new T.InstancedMesh(V.boxG, new T.MeshBasicMaterial({ color: 0x8a8278 }), n); i = 0; for (let z = 0; z < G.H; z++) for (let x = 0; x < G.W; x++) if (G.grid[z][x] === 1) { mm.makeScale(1.002, 0.02, 1.002); mm.setPosition(x + 0.5, WALL_H + 0.01, z + 0.5); top.setMatrixAt(i++, mm); } V.lvl.add(top);
  // doors (drawn each frame as open or shut), furniture
  V.doors = []; for (let z = 0; z < G.H; z++) for (let x = 0; x < G.W; x++) if (G.grid[z][x] >= 2 && G.grid[z][x] <= 4) { const horiz = G.grid[z][x - 1] === 1 && G.grid[z][x + 1] === 1, d = new T.Group(); d.position.set(x + (horiz ? 0.05 : 0.5), 0, z + (horiz ? 0.5 : 0.05)); const p = new T.Mesh(V.boxG, M(0x8a5a34, { roughness: 0.6 })); p.scale.set(horiz ? 0.9 : 0.08, WALL_H * 0.95, horiz ? 0.08 : 0.9); p.position.set(horiz ? 0.45 : 0, WALL_H * 0.475, horiz ? 0 : 0.45); p.castShadow = true; d.add(p); const lock = new T.Mesh(V.boxG, new T.MeshBasicMaterial({ color: 0xff4a3a, toneMapped: false })); lock.scale.set(0.12, 0.12, 0.12); lock.position.set(horiz ? 0.45 : 0, 1.0, horiz ? 0.06 : 0.45); d.add(lock); V.lvl.add(d); V.doors.push({ x, z, d, horiz, lock, a: 0 }); }
  for (const f of G.furn) { const x = f.x + 0.5, z = f.z + 0.5, g = new T.Group(); g.position.set(x, 0, z); V.lvl.add(g);
    const B = (w, h, d, c, y = h / 2, o) => { const b = new T.Mesh(V.boxG, M(c, o)); b.scale.set(w, h, d); b.position.y = y; b.castShadow = true; b.receiveShadow = true; g.add(b); return b; };
    if (f.kind === 'desk') { B(0.9, 0.06, 0.6, 0x8a6a4a, 0.72); for (const [a, b] of [[-0.4, -0.25], [0.4, -0.25], [-0.4, 0.25], [0.4, 0.25]]) { const l = B(0.05, 0.72, 0.05, 0x3a3a3a, 0.36); l.position.x = a; l.position.z = b; } B(0.3, 0.2, 0.05, 0x1a1a1a, 0.88).position.z = -0.15; }
    if (f.kind === 'cupboard') B(0.9, 1.9, 0.6, 0x6a7a8a, 0.95, { roughness: 0.5 });
    if (f.kind === 'closet') { B(0.9, 1.9, 0.7, 0x7a5a3a, 0.95); B(0.02, 1.7, 0.02, 0x2a1a0a, 0.95).position.z = 0.36; f.mesh = g; }
    if (f.kind === 'plant') { const pot = new T.Mesh(V.cylG, M(0xb0603a)); pot.scale.set(0.2, 0.35, 0.2); pot.position.y = 0.18; g.add(pot); for (let q = 0; q < 6; q++) { const l = new T.Mesh(V.sphG, M(0x2f7a3a)); l.scale.set(0.1, 0.32, 0.05); l.position.set(Math.cos(q) * 0.1, 0.6, Math.sin(q) * 0.1); l.rotation.set(Math.sin(q) * 0.6, q, Math.cos(q) * 0.5); g.add(l); } } }
  // the file, the candidate desks, bonus files, the keycard, the van, the cameras on the walls
  const glow = (c, s) => { const m = new T.Mesh(new T.PlaneGeometry(s, s), new T.MeshBasicMaterial({ map: V.glowT, color: c, transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false })); m.rotation.x = -Math.PI / 2; return m; };
  V.doc = new T.Group(); const folder = new T.Mesh(V.boxG, M(0xe8c060)); folder.scale.set(0.32, 0.02, 0.24); folder.position.y = 0.77; V.doc.add(folder); const stamp = new T.Mesh(V.boxG, new T.MeshBasicMaterial({ color: 0xd83a2a })); stamp.scale.set(0.12, 0.022, 0.05); stamp.position.set(0.04, 0.775, 0.03); V.doc.add(stamp); V.docGlow = glow(0xffe080, 2.2); V.docGlow.position.y = 0.79; V.doc.add(V.docGlow); V.lvl.add(V.doc);
  V.cands = G.doc.cands.map(c => { const q = glow(0x9ad8ff, 1.6); q.position.set(c.x, 0.79, c.z); V.lvl.add(q); return q; });
  V.bonus = G.bonus.map(b => { const g = new T.Group(); const f = new T.Mesh(V.boxG, M(0x9ac8e8)); f.scale.set(0.26, 0.02, 0.2); f.position.y = 0.77; g.add(f); const q = glow(0x9ad8ff, 1.2); q.position.y = 0.79; g.add(q); g.position.set(b.x, 0, b.z); V.lvl.add(g); return g; });
  V.key = null; if (G.key) { V.key = new T.Group(); const c = new T.Mesh(V.boxG, new T.MeshStandardMaterial({ color: 0x3ad8a8, emissive: 0x1a6a50 })); c.scale.set(0.2, 0.02, 0.13); c.position.y = 0.05; V.key.add(c); const q = glow(0x5af0c0, 1.2); q.position.y = 0.06; V.key.add(q); V.key.position.set(G.key.x, 0, G.key.z); V.lvl.add(V.key); }
  { const van = new T.Group(); van.position.set(G.van.x + 1.4, 0, G.van.z + 1.0); const body = new T.Mesh(V.boxG, M(0x3a3f48, { roughness: 0.5 })); body.scale.set(1.9, 1.5, 4.2); body.position.y = 1.0; van.add(body); for (const [a, b] of [[-0.9, -1.4], [0.9, -1.4], [-0.9, 1.4], [0.9, 1.4]]) { const w = new T.Mesh(V.cylG, M(0x111111)); w.scale.set(0.35, 0.2, 0.35); w.rotation.z = Math.PI / 2; w.position.set(a, 0.35, b); van.add(w); } van.rotation.y = 0.3; V.lvl.add(van); V.vanGlow = glow(0x5ad8c8, 2.4); V.vanGlow.position.set(G.van.x, 0.02, G.van.z); V.lvl.add(V.vanGlow); }
  V.camBoxes = G.cams.map(c => { const b = new T.Mesh(V.boxG, M(0x222222, { roughness: 0.4 })); b.scale.set(0.25, 0.18, 0.35); b.position.set(c.x, WALL_H + 0.1, c.z); V.lvl.add(b); return b; });
  // ceiling lamps over each room (one light per two rooms, on low quality none)
  for (const q of G.rooms.slice(0, 6)) { const L = new T.PointLight(0xfff0d8, 2.2, 9, 1.6); L.position.set((q.x0 + q.x1) / 2 + 0.5, 2.6, (q.z0 + q.z1) / 2 + 0.5); V.lvl.add(L); }
  ui.snap = true; V.spy.coatM.color.setHex(mySkin().col); }
// a fan of floor cut by walls: the sight of a guard (or a camera)
function fanGeom(G, mesh, x, z, a, half, range, low) { const P = mesh.geometry.attributes.position.array, N = 25, pts = [];
  for (let i = 0; i <= N; i++) { const b = a - half + (2 * half) * i / N, dx = Math.sin(b), dz = Math.cos(b); let r = 0; for (; r < range; r += 0.15) { const c = cellAt(G, x + dx * r, z + dz * r); if (c === 1 || c === 2 || c === 4) break; const f = furnAt(G, x + dx * r, z + dz * r); if (f && (f.kind === 'cupboard' || f.kind === 'closet')) break; } pts.push([x + dx * r, z + dz * r]); }
  let k2 = 0; for (let i = 0; i < N; i++) { P[k2++] = x; P[k2++] = 0.03; P[k2++] = z; P[k2++] = pts[i][0]; P[k2++] = 0.03; P[k2++] = pts[i][1]; P[k2++] = pts[i + 1][0]; P[k2++] = 0.03; P[k2++] = pts[i + 1][1]; }
  mesh.geometry.attributes.position.needsUpdate = true; mesh.geometry.setDrawRange(0, N * 3); }
function walkPose(P, sp, dt, crouch) { P.step += dt * sp * 5; const s = Math.sin(P.step) * Math.min(1, sp); P.legs[0].rotation.x = s * 0.6; P.legs[1].rotation.x = -s * 0.6; P.body.scale.y = crouch ? 0.65 : 1; P.body.rotation.x = crouch ? 0.25 : 0; }
function sync(V, G, dt) { V.t += dt; const m = G.me, T = V.T; if (!m) return; if (V.built !== G.grid) buildLevel(V, G);
  // you
  const sp = Math.hypot(m.sx, m.sz) * (m.hidden || m.cam ? 0 : m.crouch ? 0.6 : m.run ? 1.8 : 1); V.spy.g.visible = !m.hidden; V.spy.g.position.set(m.x, 0, m.z); V.spy.g.rotation.y = m.face; walkPose(V.spy, sp, dt, m.crouch);
  // guards and their fans of sight
  V.guards.forEach((P, i) => { const g = G.guards[i]; P.g.visible = !!g; V.cones[i].visible = false; if (!g) return; P.g.position.set(g.x, 0, g.z); P.g.rotation.y = g.face; walkPose(P, g.st === 'alert' ? 1.8 : g.wait > 0 || g.st === 'look' ? 0 : 1, dt, false);
    const c = V.cones[i], col = g.st === 'alert' ? 0xff3a2a : g.sus > 0.35 ? 0xffb03a : 0xfff4d0, show = G.cfg.cones > 0.3 || g.sus > 0.1 || G.lesson; c.visible = show; if (show) { c.material.color.setHex(col); c.material.opacity = (0.08 + 0.14 * G.cfg.cones + 0.12 * Math.min(1, g.sus)) * (G.lesson ? 1.4 : 1); fanGeom(G, c, g.x, g.z, g.face, 0.62, G.cfg.range * (m.crouch ? 0.65 : 1), false); } });
  V.camCones.forEach((c, i) => { const k2 = G.cams[i]; c.visible = !!k2 && !(k2.off > 0); if (c.visible) fanGeom(G, c, k2.x, k2.z, k2.a, 0.38, k2.range, false); });
  // doors open or shut (they swing)
  for (const D of V.doors) { const c = G.grid[D.z][D.x], want = c === 3 ? 1 : 0; D.a += (want - D.a) * Math.min(1, dt * 8); D.d.rotation.y = (D.horiz ? -1 : 1) * D.a * 1.45; D.lock.visible = c === 4; }
  // the file: glows on its desk until photographed; candidates glow blue until checked
  V.doc.position.set(G.doc.x, 0, G.doc.z); V.doc.visible = G.doc.found || G.doc.cands.length <= 1; V.docGlow.material.opacity = G.doc.shot ? 0 : 0.6 + 0.35 * Math.sin(V.t * 4);
  V.cands.forEach((q, i) => { const c = G.doc.cands.find(cc => Math.abs(cc.x - q.position.x) < 0.01 && Math.abs(cc.z - q.position.z) < 0.01); q.visible = !!c && !G.doc.found && G.doc.cands.length > 1; q.material.opacity = 0.5 + 0.3 * Math.sin(V.t * 3 + i); });
  V.bonus.forEach((b, i) => { b.visible = !!G.bonus[i] && !G.bonus[i].got; }); if (V.key) V.key.visible = !!G.key && !G.key.got;
  V.vanGlow.material.opacity = G.doc.shot ? 0.7 + 0.3 * Math.sin(V.t * 5) : 0.25;
  // noise rings on the floor (your running feet, coins)
  V.rings.forEach((r, i) => { const q = G.noises[G.noises.length - 1 - i]; r.visible = !!q; if (q) { const f = q.t / 1.2; r.position.set(q.x, 0.04, q.z); r.scale.setScalar(Math.max(0.05, q.r * Math.min(1, f * 2))); r.material.opacity = 0.35 * (1 - f); r.material.color.setHex(q.coin ? 0xffd060 : 0xffffff); } });
  // the camera: above and a little behind you, looking ahead; three heights (the zoom button)
  const asp = innerWidth / innerHeight, portrait = asp < 0.8, zh = [6.5, 9.5, 14][ui.zoom] * (portrait ? 1.05 : 0.9), back = zh * 0.55;
  const cp = [m.x, zh, m.z + back], cl = [m.x, 0, m.z - (portrait ? 0.6 : 0.3)];
  if (ui.snap || !ui.cam) { ui.cam = { p: cp.slice(), l: cl.slice() }; ui.snap = false; }
  const kk = Math.min(1, dt * 5); for (let i = 0; i < 3; i++) { ui.cam.p[i] += (cp[i] - ui.cam.p[i]) * kk; ui.cam.l[i] += (cl[i] - ui.cam.l[i]) * kk; }
  const cam = W3.cam, sh = FX.shake ? (Math.random() - 0.5) * FX.shake * 0.01 : 0; cam.fov = portrait ? 58 : 48; cam.aspect = asp; cam.updateProjectionMatrix();
  cam.position.set(ui.cam.p[0] + sh, ui.cam.p[1], ui.cam.p[2] + sh); cam.lookAt(ui.cam.l[0], ui.cam.l[1], ui.cam.l[2]); cam.updateMatrixWorld(); W3.setFocus(m.x, 0, m.z, 14); }
const SV = window.THREE ? new THREE.Vector3() : null;
function scr(x, y, z) { if (!V3 || V3.none) return { x: W / 2, y: H / 2 }; SV.set(x, y, z); return W3.screen(SV); }
// ---------- what happens, seen and heard ----------
function onEvent(G, e) { const cx = W / 2;
  switch (e.k) {
    case 'start': case 'yard': ui.snap = true; ui.banner = { txt: G.lesson ? 'TRAINING' : PLACES[placeOf(G.N)].name.toUpperCase(), t: 0, secs: 1.6, col: '#5ad8c8' }; if (!G.lesson) { say('PHOTOGRAPH THE FILE · BACK TO THE VAN', cx, H * 0.36, '#fff', 16); if (G.doc.cands.length > 1) tip('cands', 'The file is on ONE of the desks glowing blue. LOOK AT DESK to check each.', 3.5); if (G.key) tip('key', 'A LOCKED room (red light on its door). The KEYCARD is somewhere else in the building.', 3.5); if (G.cams.length) tip('cams', 'Security CAMERAS sweep the rooms (red fans). Being seen calls the guards.', 3.5); if (G.cfg.coins && G.N <= 5) tip('coins', 'You have COINS: when nothing else is near, ACTION throws one ahead of you: guards go to look.', 3.5); } break;
    case 'foot': if (e.run) sfx.run(); else if (Math.random() < 0.5) sfx.step(); break;
    case 'crouch': sfx.crouch(); break; case 'stand': sfx.crouch(true); break;
    case 'open': sfx.door(); break; case 'close': sfx.door(true); break; case 'gdoor': sfx.door(); break;
    case 'locked': sfx.no(); say('LOCKED: FIND THE KEYCARD', cx, H * 0.42, '#ff8a7a', 18); break; case 'unlock': sfx.unlock(); say('UNLOCKED', cx, H * 0.42, '#5af0c0', 18); break;
    case 'hide': sfx.hide(); say('HIDDEN', cx, H * 0.42, '#9ad8ff', 18); break; case 'unhide': sfx.hide(true); break;
    case 'camon': sfx.camera(); tip('cam', 'Keep the file inside the frame: steady it with the stick until the bar fills.', 3); break;
    case 'camoff': sfx.camera(true); break;
    case 'snap': sfx.shutter(); FX.flash = 0.8; vibe(HAP.light); say('GOT IT! NOW BACK TO THE VAN', cx, H * 0.36, '#5ad8c8', 20); break;
    case 'found': sfx.coin(2); say('THIS IS THE ONE', cx, H * 0.4, '#ffe080', 18); break; case 'empty': sfx.no(); say('NOTHING HERE', cx, H * 0.4, '#fff', 16); break;
    case 'bonus': sfx.coin(3); say('BONUS FILE!', cx, H * 0.4, '#9ad8ff', 20); vibe(HAP.tick); break; case 'key': sfx.coin(1); say('KEYCARD', cx, H * 0.4, '#5af0c0', 20); vibe(HAP.tick); break;
    case 'coin': sfx.coinThrow(); break;
    case 'heard': if (e.coin) sfx.ping(); break;
    case 'glimpse': sfx.hmm(); break;
    case 'huh': sfx.hmm(true); vibe(HAP.tick); break;
    case 'spotted': sfx.alarm(); FX.red = 0.8; FX.shake = 6; vibe(HAP.thud); ui.banner = { txt: 'SPOTTED!', t: 0, secs: 1.0, col: '#ff5a4a' }; tip('spotted', 'He has seen you! RUN out of his sight (round a corner) or into a cupboard.', 3); break;
    case 'gone': sfx.hmm(); say('HE LOST YOU', cx, H * 0.4, '#9ad8ff', 18); break;
    case 'camalarm': sfx.alarm(); FX.red = 0.5; say('CAMERA!', cx, H * 0.4, '#ff5a4a', 20); break;
    case 'caught': sfx.caught(); FX.shake = 14; FX.red = 1; vibe(HAP.heavy); ui.banner = { txt: 'CAUGHT!', t: 0, secs: 1.4, col: '#ff5a4a' }; break;
    case 'shift': ui.banner = { txt: 'SHIFT CHANGE: TOO LATE', t: 0, secs: 1.4, col: '#ffb347' }; break;
    case 'won': sfx.win(); ui.banner = { txt: 'MISSION COMPLETE', t: 0, secs: 1.5, col: '#5ad8c8' }; break;
    case 'lost': sfx.lose(); break;
    case 'lessonnext': hint = null; break;
    case 'lessonok': sfx.coin(e.n); break;
    case 'lessonmiss': coachMiss(); sfx.no(); break;
    case 'lessondone': sfx.goal(); say('TRAINING DONE!', cx, H * 0.4, '#5ad8c8', 28); burst(cx, H * 0.4, '#5ad8c8', 24); break;
  } }
let IG = null; function idleG() { if (!IG || IG.over || IG.t > 90) { IG = newGame(Math.max(5, store.get('level', 1) | 0), { seed: (Math.random() * 1e6) | 0 }); IG.mem = {}; ui.snap = true; } honest(IG, { react: 0.3, acc: 0.95 }, IG.mem); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#0d1218'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D building.', W / 2, H / 2); if (G) hud(G, now); return; }
  const g = G || idleG(); if (!g.grid) return; sync(V, g, dt); W3.render(dt);
  // guards' "?" and "!" over their heads
  for (const gd of g.guards) { if (gd.sus < 0.12 && gd.st === 'patrol') continue; const p = scr(gd.x, 2.0, gd.z); if (!p.front) continue; const al = gd.st === 'alert'; ctx.font = `400 ${Math.round((al ? 30 : 24) * k)}px ${TF}`; ctx.textAlign = 'center'; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.7)'; const t2 = al ? '!' : gd.st === 'search' || gd.st === 'investigate' ? '?!' : '?'; ctx.strokeText(t2, p.x, p.y); ctx.fillStyle = al ? '#ff4a3a' : '#ffc040'; ctx.fillText(t2, p.x, p.y);
    if (!al && gd.sus > 0.05) { ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(p.x - 16 * k, p.y + 8 * k, 32 * k, 4 * k); ctx.fillStyle = '#ffc040'; ctx.fillRect(p.x - 16 * k, p.y + 8 * k, 32 * k * Math.min(1, gd.sus), 4 * k); } }
  if (G && !(G.over && !$('ovEnd').classList.contains('hidden'))) hud(G, now);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 0.9 ? 1 : 1 - (t2.t - 0.9) / 0.5; ctx.globalAlpha = Math.max(0, al); const sc = t2.t < 0.12 ? 1.3 - t2.t / 0.12 * 0.3 : 1; ctx.font = `400 ${Math.round(t2.size * k * sc)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(5,10,16,.75)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 20); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 20); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30, hy = H * 0.24;
    ctx.fillStyle = 'rgba(8,14,20,.92)'; rrect(W / 2 - w / 2, hy - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, hy - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,40,30,${FX.red * 0.22})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${FX.flash * 0.7})`; ctx.fillRect(0, 0, W, H); } }
// ---------- the 2D layer: the objectives, the clock, the viewfinder, the stick and the buttons ----------
function btnRects(G) { const b = 98 * k, s = 70 * k; return { act: { x: W - b - 16, y: H - b - 28 * k, w: b, h: b }, crouch: { x: W - b - 16 - s - 16 * k, y: H - s - 34 * k, w: s, h: s }, zoom: { x: W - 50 * k, y: 104 * k, w: 40 * k, h: 40 * k } }; }
function hud(G, now) { ctx.textBaseline = 'middle'; const m = G.me; if (!m) return;
  if (G.lesson) lessonPanel(G);
  else { const x0 = 12, y0 = 58 * k, w = W - 24; ctx.fillStyle = 'rgba(8,14,20,.7)'; rrect(x0, y0 - 16 * k, w, 44 * k, 12 * k); ctx.fill();
    ctx.textAlign = 'left'; ctx.font = `400 ${Math.round(15 * k)}px ${TF}`; ctx.fillStyle = G.doc.shot ? '#5ad8c8' : '#ffe080'; ctx.fillText(G.doc.shot ? '📷 FILE ✓ → VAN' : G.doc.found || G.doc.cands.length <= 1 ? '📄 PHOTOGRAPH THE FILE' : `📄 FIND THE FILE (${G.doc.cands.length} DESKS)`, x0 + 10, y0 + 6 * k);
    ctx.textAlign = 'right'; ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = G.clock < 20 ? '#ff8a7a' : '#fff'; const mm = Math.max(0, Math.ceil(G.clock)); ctx.fillText(`${G.bonus.length ? `📁 ${G.bonus.filter(b => b.got).length}/${G.bonus.length}  ` : ''}${G.key ? (m.key ? '🔑 ✓  ' : '🔑 ·  ') : ''}${m.coins ? `🪙 ${m.coins}  ` : ''}⏱ ${Math.floor(mm / 60)}:${String(mm % 60).padStart(2, '0')}`, x0 + w - 10, y0 + 6 * k); }
  // the eye: the most suspicious guard
  { const s2 = G.watched || 0, x = 30 * k, y = (G.lesson ? 190 : 124) * k, r = 18 * k; ctx.fillStyle = 'rgba(8,14,20,.7)'; ctx.beginPath(); ctx.arc(x, y, r + 4, 0, TAU); ctx.fill(); ctx.strokeStyle = s2 >= 1 ? '#ff4a3a' : s2 > 0.35 ? '#ffb03a' : '#ffffff'; ctx.lineWidth = 2.5 * k; ctx.beginPath(); ctx.ellipse(x, y, r * 0.85, r * (0.15 + 0.4 * Math.min(1, s2)), 0, 0, TAU); ctx.stroke(); ctx.fillStyle = ctx.strokeStyle; ctx.beginPath(); ctx.arc(x, y, r * 0.22 * (0.4 + Math.min(1, s2)), 0, TAU); ctx.fill();
    ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.textAlign = 'left'; ctx.fillStyle = m.hidden ? '#9ad8ff' : m.crouch ? '#c8e8ff' : '#fff'; ctx.fillText(m.hidden ? 'HIDDEN' : s2 >= 1 ? 'SPOTTED!' : s2 > 0.35 ? 'SUSPICIOUS' : m.crouch ? 'CROUCHING' : m.run ? 'RUNNING: NOISY' : 'UNSEEN', x + r + 10, y); }
  if (ui.banner) { const B = ui.banner, sc = B.t < 0.12 ? 1.25 - B.t / 0.12 * 0.25 : 1; ctx.textAlign = 'center'; ctx.font = `400 ${Math.round(30 * k * sc)}px ${TF}`; ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(5,10,16,.8)'; ctx.strokeText(B.txt, W / 2, H * 0.3); ctx.fillStyle = B.col || '#fff'; ctx.fillText(B.txt, W / 2, H * 0.3); }
  // the viewfinder while photographing
  if (m.cam && m.photo) { const P = m.photo, cx = W / 2, cy = H * 0.45, fs = Math.min(W, H) * 0.34; ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.translate(cx + P.fx * fs * 2.2, cy + P.fz * fs * 2.2); ctx.fillStyle = '#f2ead8'; ctx.fillRect(-fs * 0.22, -fs * 0.3, fs * 0.44, fs * 0.6); ctx.fillStyle = '#d83a2a'; ctx.font = `400 ${Math.round(13 * k)}px ${TF}`; ctx.textAlign = 'center'; ctx.fillText('TOP SECRET', 0, -fs * 0.18); ctx.fillStyle = 'rgba(40,40,40,.6)'; for (let i = 0; i < 6; i++) ctx.fillRect(-fs * 0.16, -fs * 0.06 + i * fs * 0.06, fs * 0.32 * (i % 3 ? 1 : 0.7), 3); ctx.restore();
    ctx.strokeStyle = P.inF ? '#5af0c0' : '#ffffff'; ctx.lineWidth = 3 * k; const half = fs * 0.5; for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { ctx.beginPath(); ctx.moveTo(cx + sx * half, cy + sy * half * 0.75); ctx.lineTo(cx + sx * half * 0.7, cy + sy * half * 0.75); ctx.moveTo(cx + sx * half, cy + sy * half * 0.75); ctx.lineTo(cx + sx * half, cy + sy * half * 0.45); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,.2)'; rrect(cx - half, cy + half * 0.9, half * 2, 10 * k, 5 * k); ctx.fill(); ctx.fillStyle = '#5af0c0'; rrect(cx - half, cy + half * 0.9, half * 2 * P.q, 10 * k, 5 * k); ctx.fill();
    ctx.font = `400 ${Math.round(16 * k)}px ${TF}`; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText(P.inF ? 'HOLD STEADY…' : 'STICK: BRING THE FILE INTO THE FRAME', cx, cy - half * 0.95); }
  // the stick
  if (ui.drag) { const d2 = ui.drag, R = 50 * k, dx = clamp(d2.x - d2.x0, -R, R), dy = clamp(d2.y - d2.y0, -R, R); ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(d2.x0, d2.y0, R, 0, TAU); ctx.stroke(); ctx.setLineDash([4, 6]); ctx.beginPath(); ctx.arc(d2.x0, d2.y0, R * 0.85, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = m.run ? 'rgba(255,150,90,.75)' : 'rgba(90,216,200,.65)'; ctx.beginPath(); ctx.arc(d2.x0 + dx, d2.y0 + dy, 22 * k, 0, TAU); ctx.fill(); }
  else if (!G.over && G.t < 6) { ctx.globalAlpha = 0.45 + 0.3 * Math.sin(now * 4); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(W * 0.24, H - 120 * k, 50 * k, 0, TAU); ctx.stroke(); ctx.font = `400 ${Math.round(12 * k)}px ${TF}`; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText('THUMB HERE', W * 0.24, H - 120 * k); ctx.fillText('PUSH FAR = RUN', W * 0.24, H - 120 * k + 64 * k); ctx.globalAlpha = 1; }
  // the buttons: ACTION (says what it will do), CROUCH (lit while crouching), the camera height
  const B = btnRects(G), A = actionHere(G); const btn = (r, txt, col, on, dim, small) => { const cx2 = r.x + r.w / 2, cy2 = r.y + r.h / 2; ctx.globalAlpha = dim ? 0.4 : 1; ctx.fillStyle = on ? col : 'rgba(8,14,20,.72)'; ctx.beginPath(); ctx.arc(cx2, cy2, r.w / 2, 0, TAU); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 3 * k; ctx.beginPath(); ctx.arc(cx2, cy2, r.w / 2 - 2 * k, 0, TAU); ctx.stroke();
    ctx.fillStyle = on ? '#0d1218' : '#fff'; ctx.textAlign = 'center'; const words = txt.split(' '); ctx.font = `400 ${Math.round((small || 13) * k)}px ${TF}`; const lines = words.length > 1 ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')] : [txt]; lines.forEach((l, i) => ctx.fillText(l, cx2, cy2 + (i - (lines.length - 1) / 2) * 15 * k)); ctx.globalAlpha = 1; };
  btn(B.act, A ? A.label : 'ACTION', A && A.k === 'photo' ? '#ffe080' : A && A.k === 'hide' ? '#9ad8ff' : '#5ad8c8', !!A && A.label !== 'LOCKED', !A, A && A.label.length > 11 ? 11 : 13);
  if (G.cfg.crouch || G.lesson) btn(B.crouch, 'CROUCH', '#c8e8ff', m.crouch, false, 12);
  const z = B.zoom; ctx.fillStyle = 'rgba(8,14,20,.72)'; rrect(z.x, z.y, z.w, z.h, 10 * k); ctx.fill(); ctx.font = `${Math.round(20 * k)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText(['🔍', '🗺', '🛰'][ui.zoom], z.x + z.w / 2, z.y + z.h / 2 + 1); }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { coachPanel(G); }
