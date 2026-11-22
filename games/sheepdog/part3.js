
// ===================== THE VIEW: Sheepdog in 3D (three.js; light and sky from tools/world3d.js) =====================
// A green field from above and behind: stone walls, the pen and its gate up the field, trees, a river and its plank bridge,
// a farmhouse beyond. Fluffy sheep (lambs smaller, the black ram with curled horns), your collie running or lying down, a fox
// at dusk. The light warms and fades as the day runs out. Your thumb's spot on the grass is marked with a ring.
const FX = { shake: 0, stop: 0, flash: 0, red: 0, slow: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { snap: true, cam: null, banner: null, touch: null };
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 160) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: 0.5 + Math.random() * 0.4, col, r: (1.5 + Math.random() * 2.5) * k }); } if (PARTS.length > 240) PARTS.splice(0, PARTS.length - 240); }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2.5); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.4) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (ui.banner) { ui.banner.t += dt; if (ui.banner.t > (ui.banner.secs || 1)) ui.banner = null; }
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; } }
function mySkin() { if (typeof HEADLESS !== 'undefined' && HEADLESS) return SKINS[0]; const id = store.get('skin', 'bess'); return SKINS.find(q => q.id === id) || SKINS[0]; }
function canvasTex(w, h, fn, rep) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return t; }
const WZ = z => -z;      // the field's z runs away from the camera
function buildWorld() {
  if (V3) return V3; const T = window.THREE; if (!T || !W3 || !W3.init({ canvas: $('gl'), fov: 50, far: 2500, near: 0.3 })) { V3 = { none: true }; return V3; }
  V3 = { T, S: W3.scene, built: null, t: 0 }; const V = V3;
  V.boxG = new T.BoxGeometry(1, 1, 1); V.sphG = new T.SphereGeometry(1, 14, 10); V.cylG = new T.CylinderGeometry(1, 1, 1, 12);
  V.wool = new T.MeshStandardMaterial({ color: 0xf2efe6, roughness: 1 }); V.woolD = new T.MeshStandardMaterial({ color: 0x2a2624, roughness: 1 }); V.face = new T.MeshStandardMaterial({ color: 0x1a1614, roughness: 0.7 });
  V.sheepPool = []; V.dog = makeDog(V); V.S.add(V.dog.g);
  V.foxes = [0, 1].map(() => { const f = makeFox(V); f.visible = false; V.S.add(f); return f; });
  V.ring = new T.Mesh(new T.RingGeometry(0.7, 1.0, 28), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, depthWrite: false })); V.ring.rotation.x = -Math.PI / 2; V.ring.visible = false; V.S.add(V.ring);
  V.barkR = new T.Mesh(new T.RingGeometry(0.9, 1.0, 40), new T.MeshBasicMaterial({ color: 0xffe080, transparent: true, opacity: 0, depthWrite: false })); V.barkR.rotation.x = -Math.PI / 2; V.S.add(V.barkR);
  W3.setQuality(stepN); return V; }
function makeSheep(V, kind) { const T = V.T, g = new T.Group(), body = new T.Group(); g.add(body); const ram = kind === 'ram', sc = kind === 'lamb' ? 0.6 : ram ? 1.15 : 1, wool = ram ? V.woolD : V.wool;
  for (const [x, y, z, r] of [[0, 0.75, 0, 0.5], [0.32, 0.8, 0, 0.42], [-0.32, 0.8, 0, 0.42], [0, 0.95, 0.15, 0.4], [0, 0.95, -0.15, 0.4], [0.5, 0.78, 0, 0.36]]) { const m = new T.Mesh(V.sphG, wool); m.scale.setScalar(r); m.position.set(x, y, z); m.castShadow = true; body.add(m); }
  const head = new T.Mesh(V.sphG, V.face); head.scale.set(0.22, 0.25, 0.18); head.position.set(0.85, 0.85, 0); body.add(head);
  for (const s of [-1, 1]) { const ear = new T.Mesh(V.sphG, V.face); ear.scale.set(0.06, 0.04, 0.14); ear.position.set(0.82, 0.98, s * 0.2); body.add(ear); }
  if (ram) for (const s of [-1, 1]) { const horn = new T.Mesh(new T.TorusGeometry(0.13, 0.05, 6, 12, Math.PI * 1.5), new T.MeshStandardMaterial({ color: 0xc8b890, roughness: 0.6 })); horn.position.set(0.8, 0.98, s * 0.2); horn.rotation.set(0, s * 0.3, 0); body.add(horn); }
  const legs = []; for (const [x, z] of [[0.35, 0.2], [0.35, -0.2], [-0.35, 0.2], [-0.35, -0.2]]) { const l = new T.Mesh(V.cylG, V.face); l.scale.set(0.06, 0.5, 0.06); l.position.set(x, 0.25, z); body.add(l); legs.push(l); }
  g.scale.setScalar(sc); return { g, body, legs, kind }; }
function makeDog(V) { const T = V.T, g = new T.Group(), body = new T.Group(); g.add(body); const coat = new T.MeshStandardMaterial({ color: mySkin().col, roughness: 0.8 }), white = new T.MeshStandardMaterial({ color: 0xf4f2ec, roughness: 0.8 });
  const tor = new T.Mesh(new T.CapsuleGeometry(0.22, 0.6, 4, 10), coat); tor.rotation.z = Math.PI / 2; tor.position.y = 0.55; tor.castShadow = true; body.add(tor);
  const chest = new T.Mesh(V.sphG, white); chest.scale.set(0.2, 0.22, 0.2); chest.position.set(0.42, 0.5, 0); body.add(chest);
  const head = new T.Group(); head.position.set(0.6, 0.78, 0); body.add(head); const hm = new T.Mesh(V.sphG, coat); hm.scale.set(0.2, 0.18, 0.17); head.add(hm); const snout = new T.Mesh(V.sphG, white); snout.scale.set(0.14, 0.09, 0.09); snout.position.set(0.17, -0.04, 0); head.add(snout);
  for (const s of [-1, 1]) { const ear = new T.Mesh(new T.ConeGeometry(0.06, 0.14, 6), coat); ear.position.set(-0.03, 0.17, s * 0.09); head.add(ear); }
  const tail = new T.Mesh(new T.CapsuleGeometry(0.05, 0.35, 3, 6), coat); tail.position.set(-0.55, 0.62, 0); tail.rotation.z = -1; body.add(tail);
  const legs = []; for (const [x, z] of [[0.3, 0.12], [0.3, -0.12], [-0.3, 0.12], [-0.3, -0.12]]) { const l = new T.Mesh(V.cylG, white); l.scale.set(0.05, 0.42, 0.05); l.position.set(x, 0.21, z); body.add(l); legs.push(l); }
  return { g, body, head, tail, legs, coat }; }
function makeFox(V) { const T = V.T, g = new T.Group(), fur = new T.MeshStandardMaterial({ color: 0xd8641a, roughness: 0.8 }), w = new T.MeshStandardMaterial({ color: 0xf4f0e8 });
  const b = new T.Mesh(new T.CapsuleGeometry(0.18, 0.5, 4, 8), fur); b.rotation.z = Math.PI / 2; b.position.y = 0.4; g.add(b); const h = new T.Mesh(new T.ConeGeometry(0.15, 0.4, 8), fur); h.rotation.z = -Math.PI / 2; h.position.set(0.5, 0.48, 0); g.add(h);
  const t = new T.Mesh(new T.CapsuleGeometry(0.1, 0.45, 4, 8), fur); t.position.set(-0.55, 0.42, 0); t.rotation.z = 1.2; g.add(t); const tip2 = new T.Mesh(V.sphG, w); tip2.scale.setScalar(0.09); tip2.position.set(-0.78, 0.55, 0); g.add(tip2);
  for (const s of [-1, 1]) { const e = new T.Mesh(new T.ConeGeometry(0.05, 0.14, 5), fur); e.position.set(0.42, 0.66, s * 0.07); g.add(e); } g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g; }
// ---------- the field: built once per round ----------
function buildField(V, g) { const T = V.T, S = V.S;
  if (V.field) { S.remove(V.field); V.field.traverse(o => { if (o.geometry && ![V.boxG, V.sphG, V.cylG].includes(o.geometry)) o.geometry.dispose(); }); }
  V.field = new T.Group(); S.add(V.field); V.built = g; const pl = FIELDS[placeOf(g.N)], R = W3.rng(g.seed % 9999 + 3); W3.setSky(g.yard ? 'morning' : pl.sky, { azim: 220 }); V.sun0 = W3.sun.intensity; V.hemi0 = W3.hemi.intensity; V.exp0 = W3.S.exposure;
  const M = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.9 }, o));
  const grassT = canvasTex(256, 256, (c, w, h) => { c.fillStyle = '#5f8f3a'; c.fillRect(0, 0, w, h); const r = W3.rng(5); for (let i = 0; i < 2600; i++) { c.fillStyle = `rgba(${r() < 0.5 ? '40,90,20' : '140,180,70'},${0.15 + r() * 0.25})`; c.fillRect(r() * w, r() * h, 2, 3 + r() * 4); } }, [60, 60]);
  const fl = new T.Mesh(new T.PlaneGeometry(400, 400), new T.MeshStandardMaterial({ map: grassT, roughness: 1 })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; V.field.add(fl);
  // dry-stone walls round the field
  const stone = M(0x8a8478); for (const [x, z, w, d] of [[0, FR + 0.4, 2 * FR + 1.6, 0.8], [0, -FR - 0.4, 2 * FR + 1.6, 0.8], [FR + 0.4, 0, 0.8, 2 * FR], [-FR - 0.4, 0, 0.8, 2 * FR]]) { const m = new T.Mesh(V.boxG, stone); m.scale.set(w, 1.1, d); m.position.set(x, 0.55, WZ(z)); m.castShadow = true; m.receiveShadow = true; V.field.add(m); }
  // the pen: posts and rails, a gap for the gate (with two open gates), straw inside
  { const p = g.pen, wood = M(0x8a6040, { roughness: 0.8 }), hw = p.w / 2, hd = p.d / 2, segs = [[-hw, -hd, -p.gw / 2, -hd], [p.gw / 2, -hd, hw, -hd], [-hw, hd, hw, hd], [-hw, -hd, -hw, hd], [hw, -hd, hw, hd]];
    for (const [x0, z0, x1, z1] of segs) { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(2, Math.round(L / 1.6)); for (let i = 0; i <= n; i++) { const post = new T.Mesh(V.boxG, wood); post.scale.set(0.14, 1.2, 0.14); post.position.set(p.x + x0 + (x1 - x0) * i / n, 0.6, WZ(p.z + z0 + (z1 - z0) * i / n)); post.castShadow = true; V.field.add(post); }
      for (const y of [0.45, 0.95]) { const rail = new T.Mesh(V.boxG, wood); rail.scale.set(x1 === x0 ? 0.08 : L, 0.1, z1 === z0 ? 0.08 : L); rail.position.set(p.x + (x0 + x1) / 2, y, WZ(p.z + (z0 + z1) / 2)); V.field.add(rail); } }
    for (const s of [-1, 1]) { const gate = new T.Mesh(V.boxG, M(0xc8a060)); gate.scale.set(0.08, 0.9, 1.6); gate.position.set(p.x + s * p.gw / 2, 0.6, WZ(p.z - hd - 0.8)); V.field.add(gate); }
    const straw = new T.Mesh(new T.PlaneGeometry(p.w - 0.4, p.d - 0.4), M(0xd8c070)); straw.rotation.x = -Math.PI / 2; straw.position.set(p.x, 0.02, WZ(p.z)); V.field.add(straw); V.penGlow = straw; }
  // trees, the river and its bridge, the farmhouse
  if (g.trees.length) { const tr = g.trees.map(t => ({ x: t.x, z: WZ(t.z), y: 0, s: t.r * 0.42, rot: R() * 6, hue: R(), shade: R() })); V.field.add(W3.pines(tr, { shadow: true })); }
  if (g.river) { const rv = g.river, water = new T.Mesh(new T.PlaneGeometry(400, rv.z1 - rv.z0), new T.MeshPhysicalMaterial({ color: 0x2a6a9a, roughness: 0.08, metalness: 0.1, clearcoat: 1, transparent: true, opacity: 0.92 })); water.rotation.x = -Math.PI / 2; water.position.set(0, 0.04, WZ((rv.z0 + rv.z1) / 2)); V.field.add(water); V.water = water;
    for (const s of [-1, 1]) { const bank = new T.Mesh(V.boxG, M(0x6a5a3a)); bank.scale.set(400, 0.12, 0.4); bank.position.set(0, 0.06, WZ(s < 0 ? rv.z0 : rv.z1)); V.field.add(bank); }
    const br = new T.Mesh(V.boxG, M(0x9a7048, { roughness: 0.8 })); br.scale.set(rv.bw, 0.25, rv.z1 - rv.z0 + 1.4); br.position.set(rv.bx, 0.18, WZ((rv.z0 + rv.z1) / 2)); br.castShadow = true; br.receiveShadow = true; V.field.add(br);
    for (const s of [-1, 1]) { const rail = new T.Mesh(V.boxG, M(0x6a4a2a)); rail.scale.set(0.1, 0.5, rv.z1 - rv.z0 + 1.4); rail.position.set(rv.bx + s * rv.bw / 2, 0.5, WZ((rv.z0 + rv.z1) / 2)); V.field.add(rail); } } else V.water = null;
  { const h = new T.Mesh(V.boxG, M(0xe8e0d0)); h.scale.set(10, 6, 7); h.position.set(-FR - 14, 3, WZ(FR + 8)); V.field.add(h); const rf = new T.Mesh(new T.ConeGeometry(7.5, 4, 4), M(0x8a3a2a)); rf.position.set(h.position.x, 8, h.position.z); rf.rotation.y = Math.PI / 4; rf.scale.set(1, 1, 0.75); V.field.add(rf); }
  const far = []; for (let i = 0; i < 60; i++) { const a = R() * TAU, d = FR + 25 + R() * 60; far.push({ x: Math.cos(a) * d, z: Math.sin(a) * d, y: 0, s: 0.8 + R() * 0.9, rot: R() * 6, hue: R(), shade: R() }); } V.field.add(W3.pines(far, { shadow: false }));
  // the sheep
  for (const q of V.sheepPool) V.S.remove(q.g); V.sheepPool = g.sheep.map(s => { const m = makeSheep(V, s.kind); V.S.add(m.g); return m; });
  V.dog.coat.color.setHex(mySkin().col); ui.snap = true; }
// ---------- each frame ----------
function sync(V, g, dt) { V.t += dt; const d = g.dog;
  // the light: warmer and dimmer as the day runs out
  if (!g.lesson && V.sun0 != null) { const f = clamp(g.clock / g.day, 0, 1), dusk = 1 - Math.min(1, f / 0.35); W3.sun.intensity = V.sun0 * (1 - 0.6 * dusk); W3.hemi.intensity = V.hemi0 * (1 - 0.45 * dusk); W3.sun.color.setHSL(0.08, 0.6 * dusk, 0.7 + 0.3 * (1 - dusk)); }
  if (V.sheepPool.length !== g.sheep.length) { for (const q of V.sheepPool) V.S.remove(q.g); V.sheepPool = g.sheep.map(s => { const m = makeSheep(V, s.kind); V.S.add(m.g); return m; }); }
  g.sheep.forEach((s, i) => { const m = V.sheepPool[i]; m.g.visible = !s.lost; if (s.lost) return; m.g.position.set(s.x, 0, WZ(s.z)); m.g.rotation.y = s.h; const v = Math.hypot(s.vx, s.vz), ph = V.t * 12 + i; m.legs.forEach((l, j) => l.rotation.z = v > 0.3 ? Math.sin(ph + j * Math.PI / 2) * 0.4 : 0); m.body.position.y = v > 0.3 ? Math.abs(Math.sin(ph)) * 0.06 : 0; m.body.rotation.x = 0; });
  // the dog: runs, or lies down; a bark ring
  const D = V.dog, sp = Math.hypot(d.vx, d.vz); D.g.position.set(d.x, 0, WZ(d.z)); if (sp > 0.4) { const want = Math.atan2(d.vz, d.vx); let dd = want - D.g.rotation.y; while (dd > Math.PI) dd -= TAU; while (dd < -Math.PI) dd += TAU; D.g.rotation.y += dd * Math.min(1, dt * 12); }
  const lie = d.down && sp < 0.5; D.body.position.y += ((lie ? -0.32 : 0) - D.body.position.y) * Math.min(1, dt * 8); const ph = V.t * (6 + sp * 1.6); D.legs.forEach((l, j) => { l.rotation.z = sp > 0.5 ? Math.sin(ph + (j % 2) * Math.PI + (j > 1 ? 0.6 : 0)) * 0.7 : 0; l.scale.y = lie ? 0.15 : 0.42; });
  D.tail.rotation.x = Math.sin(V.t * (sp > 0.5 ? 10 : 3)) * 0.4; D.head.rotation.z = d.bark > 0 ? 0.35 : 0;
  V.barkR.position.set(d.x, 0.06, WZ(d.z)); const br = 1 - d.bark / 0.4; V.barkR.scale.setScalar(0.5 + br * g.cfg.barkR); V.barkR.material.opacity = d.bark > 0 ? 0.6 * (1 - br) : 0;
  V.ring.visible = d.tx != null && !g.over; if (V.ring.visible) { V.ring.position.set(d.tx, 0.05, WZ(d.tz)); V.ring.scale.setScalar(1 + 0.1 * Math.sin(V.t * 8)); }
  V.foxes.forEach((F, i) => { const f = g.foxes[i]; F.visible = !!f && f.state !== 'gone'; if (!F.visible) return; F.position.set(f.x, 0, WZ(f.z)); const T2 = f.state === 'flee' ? { x: f.x - d.x, z: f.z - d.z } : f.target ? { x: f.target.x - f.x, z: f.target.z - f.z } : { x: 1, z: 0 }; F.rotation.y = Math.atan2(T2.z, T2.x); F.position.y = f.state === 'creep' ? -0.12 : 0; });
  if (V.penGlow) V.penGlow.material.emissive && V.penGlow.material.emissive.setRGB(0.25 * Math.max(0, Math.sin(V.t * 3)) * (g.penned ? 0 : 1), 0.2 * Math.max(0, Math.sin(V.t * 3)) * (g.penned ? 0 : 1), 0);
  // the camera: above and behind, looking at the work (the dog, the flock, the way to the pen)
  const live = g.sheep.filter(s => !s.lost && !s.penned); let cx = d.x, cz = d.z; if (live.length) { let sx = 0, sz = 0; for (const s of live) { sx += s.x; sz += s.z; } cx = (sx / live.length) * 0.6 + d.x * 0.4; cz = (sz / live.length) * 0.6 + d.z * 0.4; }
  /* 22 Nov 2026 (the audit: the dog was tiny on an empty field): the camera comes in close and only pulls back as far as the flock is spread */
  let spread = 0; for (const s of live) spread = Math.max(spread, Math.hypot(s.x - cx, s.z - cz)); spread = Math.max(spread, Math.hypot(d.x - cx, d.z - cz));
  const asp = innerWidth / innerHeight, portrait = asp < 0.8, zoom = clamp(0.56 + spread / 26, 0.62, 1), h = (portrait ? 25 : 20) * zoom, back = (portrait ? 17 : 15) * zoom, cp = [cx, h, WZ(cz) + back], cl = [cx, 0, WZ(cz) - (portrait ? 6 : 4) * zoom];
  if (ui.snap || !ui.cam) { ui.cam = { p: cp.slice(), l: cl.slice() }; ui.snap = false; }
  const kk = Math.min(1, dt * 1.6); for (let i = 0; i < 3; i++) { ui.cam.p[i] += (cp[i] - ui.cam.p[i]) * kk; ui.cam.l[i] += (cl[i] - ui.cam.l[i]) * kk; }
  const cam = W3.cam; cam.fov = portrait ? 56 : 46; cam.aspect = asp; cam.updateProjectionMatrix(); cam.position.set(...ui.cam.p); cam.lookAt(...ui.cam.l); cam.updateMatrixWorld(); W3.setFocus(cx, 0, WZ(cz), 30); }
const SV = window.THREE ? new THREE.Vector3() : null;
function scr(x, y, z) { if (!V3 || V3.none) return { x: W / 2, y: H / 2 }; SV.set(x, y, z); return W3.screen(SV); }
// the spot on the grass under a screen point (the thumb)
function groundAt(px, py) { if (!V3 || V3.none) return { x: (px / W - 0.5) * 2 * FR, z: (0.5 - py / H) * 2 * FR }; const T = V3.T, cam = W3.cam, v = new T.Vector3(px / W * 2 - 1, -(py / H) * 2 + 1, 0.5).unproject(cam), dir = v.sub(cam.position).normalize(); if (dir.y > -0.02) return null; const t = -cam.position.y / dir.y; return { x: cam.position.x + dir.x * t, z: -(cam.position.z + dir.z * t) }; }
// ---------- what happens, seen and heard ----------
function onEvent(G, e) { const cx = W / 2;
  switch (e.k) {
    case 'start': case 'yard': ui.snap = true; ui.banner = { txt: G.lesson ? 'LESSON' : FIELDS[placeOf(G.N)].name.toUpperCase(), t: 0, secs: 1.4, col: '#ffd36a' }; if (!G.lesson) say(`PEN ${G.cfg.need} OF ${G.sheep.length}`, cx, H * 0.38, '#fff', 20); sfx.whistle(); break;
    case 'bark': sfx.bark(); vibe(HAP.light); break;
    case 'penned': sfx.bleat(e.kind); sfx.coin(Math.min(8, e.n)); vibe(HAP.tick); say(`${e.n} IN`, cx, H * 0.34, '#80ff90', 22); break;
    case 'scatter': sfx.scatter(); say('TOO FAST! THEY SCATTER', cx, H * 0.42, '#ffb070', 18); tip('scatter', 'Rushing at the flock makes them panic and scatter. Come in slowly, from behind.', 3); break;
    case 'fox': sfx.fox(); ui.banner = { txt: 'A FOX!', t: 0, secs: 1.4, col: '#ff8a3a' }; tip('fox', 'A fox creeps up on any sheep left on its own. Run at it (or bark) to see it off!', 3.4); break;
    case 'foxoff': sfx.yip(); say('SEE YOU OFF, FOX!', cx, H * 0.36, '#ffd36a', 20); break;
    case 'taken': sfx.taken(); FX.red = 1; ui.banner = { txt: 'THE FOX TOOK ONE', t: 0, secs: 1.5, col: '#ff5a4a' }; break;
    case 'dusk': ui.banner = { txt: 'SUNSET', t: 0, secs: 1.5, col: '#ffb070' }; break;
    case 'won': sfx.win(); ui.banner = { txt: 'GOOD DOG!', t: 0, secs: 1.5, col: '#80ff90' }; break;
    case 'lost': sfx.lose(); break;
    case 'lessonnext': hint = null; break;
    case 'lessonok': sfx.coin(e.n); break;
    case 'lessonmiss': hint = { txt: e.how, t: 0, secs: 3 }; sfx.no(); break;
    case 'lessondone': sfx.goal(); say('LESSON DONE!', cx, H * 0.4, '#80ff90', 28); burst(cx, H * 0.4, '#80ff90', 24); break;
  } }
let IG = null; function idleG() { if (!IG || IG.over) { IG = newGame(Math.max(4, store.get('level', 1) | 0), { seed: (Math.random() * 1e6) | 0 }); IG.mem = {}; ui.snap = true; } honest(IG, { react: 0.3, acc: 0.95 }, IG.mem); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#243a1a'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D field.', W / 2, H / 2); if (G) hud(G, now); return; }
  const g = G || idleG(); if (V.built !== g || V.penFor !== g.pen) { buildField(V, g); V.penFor = g.pen; }
  sync(V, g, dt);
  W3.render(dt);
  if (G && !(G.over && !$('ovEnd').classList.contains('hidden'))) hud(G, now);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 0.9 ? 1 : 1 - (t2.t - 0.9) / 0.5; ctx.globalAlpha = Math.max(0, al); const sc = t2.t < 0.12 ? 1.3 - t2.t / 0.12 * 0.3 : 1; ctx.font = `400 ${Math.round(t2.size * k * sc)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(16,24,10,.7)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 20); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 20); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30, hy = H * 0.6;
    ctx.fillStyle = 'rgba(16,24,10,.88)'; rrect(W / 2 - w / 2, hy - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, hy - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,60,30,${FX.red * 0.2})`; ctx.fillRect(0, 0, W, H); } }
// ---------- the 2D layer: the count, the sun, pointers to strays and the fox ----------
function edgeArrow(p, col, label) { const cx = W / 2, cy = H * 0.55; let dx = p.x - cx, dy = p.y - cy; if (!p.front) { dx = -dx; dy = -dy; } const a = Math.atan2(dy, dx), R2 = Math.min(W, H) * 0.42; ctx.save(); ctx.translate(cx + Math.cos(a) * R2 * 0.95, cy + Math.sin(a) * R2 * 1.05); ctx.rotate(a); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(16 * k, 0); ctx.lineTo(-8 * k, -10 * k); ctx.lineTo(-8 * k, 10 * k); ctx.closePath(); ctx.fill(); ctx.restore(); if (label) { ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.fillText(label, cx + Math.cos(a) * R2 * 0.8, cy + Math.sin(a) * R2 * 0.88); } }
const offScreen = p => !p.front || p.x < 16 || p.x > W - 16 || p.y < 110 * k || p.y > H - 40;
function hud(G, now) { ctx.textBaseline = 'middle'; const c = G.cfg;
  if (G.lesson) lessonPanel(G);
  else { const x0 = 12, y0 = 62 * k, w = W - 24; ctx.fillStyle = 'rgba(16,24,10,.62)'; rrect(x0, y0 - 18 * k, w, 52 * k, 14 * k); ctx.fill(); ctx.textAlign = 'left';
    ctx.font = `400 ${Math.round(20 * k)}px ${TF}`; ctx.fillStyle = G.penned >= c.need ? '#80ff90' : '#fff'; ctx.fillText(`🐑 ${G.penned}/${c.need}`, x0 + 10, y0 - 1 * k);
    ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = '#fff'; ctx.fillText(`${G.sheep.length} in the field` + (G.lost ? ` · 🦊 took ${G.lost}` : ''), x0 + 10, y0 + 20 * k);
    const bx = x0 + 140 * k, bw = w - 150 * k, f = clamp(G.clock / G.day, 0, 1); ctx.fillStyle = 'rgba(255,255,255,.15)'; rrect(bx, y0 - 6 * k, bw, 10 * k, 5 * k); ctx.fill(); ctx.fillStyle = f > 0.3 ? '#ffd36a' : '#ff8a3a'; rrect(bx, y0 - 6 * k, bw * f, 10 * k, 5 * k); ctx.fill();
    ctx.textAlign = 'right'; ctx.fillStyle = f > 0.3 ? '#ffe8a0' : '#ffb070'; ctx.fillText(`${f > 0.3 ? '☀️' : '🌅'} ${Math.ceil(G.clock)} s TO SUNSET`, bx + bw, y0 + 20 * k); }
  if (ui.banner) { const B = ui.banner, sc = B.t < 0.12 ? 1.25 - B.t / 0.12 * 0.25 : 1; ctx.textAlign = 'center'; ctx.font = `400 ${Math.round(32 * k * sc)}px ${TF}`; { const mw = ctx.measureText(B.txt).width; if (mw > W - 30) ctx.font = `400 ${Math.round(32 * k * sc * (W - 30) / mw)}px ${TF}`; } ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(16,24,10,.75)'; ctx.strokeText(B.txt, W / 2, H * 0.28); ctx.fillStyle = B.col || '#fff'; ctx.fillText(B.txt, W / 2, H * 0.28); }
  // pointers: the pen, strays off the screen, the fox
  { const p = scr(G.pen.gx, 0.5, WZ(G.pen.gz)); if (offScreen(p)) edgeArrow(p, 'rgba(255,211,106,.9)', 'PEN'); }
  for (const s of G.sheep) { if (s.lost || s.penned) continue; const p = scr(s.x, 0.6, WZ(s.z)); if (offScreen(p)) { edgeArrow(p, 'rgba(255,255,255,.55)'); } }
  for (const f of G.foxes) { if (f.state === 'gone' || f.state === 'flee') continue; const p = scr(f.x, 0.5, WZ(f.z)); if (offScreen(p)) edgeArrow(p, '#ff6a3a', 'FOX'); else { ctx.strokeStyle = '#ff6a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y, 18 * k + Math.sin(now * 8) * 3, 0, TAU); ctx.stroke(); } }
  // the dog's speed: walking pushes, running scatters
  const d = G.dog, sp = Math.hypot(d.vx, d.vz); if (!G.over && G.N <= 4) { ctx.textAlign = 'center'; ctx.font = `400 ${Math.round(13 * k)}px ${TF}`; ctx.fillStyle = sp > 6.5 ? '#ffb070' : '#fff'; ctx.globalAlpha = 0.85; ctx.fillText(d.down && sp < 0.5 ? 'LYING DOWN · HOLD TO MOVE · TAP TO BARK' : sp > 6.5 ? 'RUNNING (SHEEP PANIC NEAR HER)' : 'WALKING', W / 2, H - 34 * k); ctx.globalAlpha = 1; } }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { const D = G.lesson, st = D.steps[D.i], x = 12, w = W - 24, y = 44 * k; ctx.save(); ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; const lines = wrapText(st.how, w - 24), h = 50 * k + lines.length * 17 * k;
  ctx.fillStyle = 'rgba(16,24,10,.88)'; rrect(x, y, w, h, 12); ctx.fill(); ctx.strokeStyle = 'rgba(255,211,106,.7)'; ctx.lineWidth = 2; rrect(x, y, w, h, 12); ctx.stroke();
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#ffd36a'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillText(`LESSON ${G.N} OF 3 · ${D.n}/${st.need}`, x + 12, y + 9 * k);
  ctx.fillStyle = '#fff'; ctx.font = `400 ${Math.round(16 * k)}px ${TF}`; ctx.fillText(st.title, x + 12, y + 23 * k); ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.92)'; lines.forEach((l, i) => ctx.fillText(l, x + 12, y + 46 * k + i * 17 * k)); ctx.restore(); ctx.textBaseline = 'middle'; }
