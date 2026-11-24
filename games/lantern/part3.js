// ===================== THE VIEW: Ghost Lantern in 3D (three.js through tools/world3d.js) =====================
// A dark house from above and behind you: creaky floorboards, striped wallpaper on low walls, old furniture, moonlight through
// the windows. You are a small figure in a hooded coat holding a lantern; its warm beam sweeps the room (a real spotlight and
// a faint cone of light in the dust). Rooms you have not been in are black until you step in. Ghosts are sheets with dark
// eyes, seen in the beam (and as a faint shimmer near you); one held in the light glows and shakes as it is pulled in. The 2D
// layer draws the frost of a ghost close behind, the catch ring round a held ghost, the hearts, the oil, the map, the calls.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { snap: true, stick: null, cam: null, row: 0 };
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 140) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: 0.4 + Math.random() * 0.5, col, r: (1.5 + Math.random() * 2.5) * k }); } if (PARTS.length > 240) PARTS.splice(0, PARTS.length - 240); }
function fxStep(dt) {
  FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2.5); FX.red = Math.max(0, FX.red - dt * 1.6);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.5) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 1 - dt * 2; p.vy *= 1 - dt * 2; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; }
}
const hex = n => '#' + n.toString(16).padStart(6, '0');
// ---------- textures and models ----------
function stripeTex(col) { const c = document.createElement('canvas'); c.width = 64; c.height = 64; const g = c.getContext('2d'), base = new THREE.Color(col); g.fillStyle = '#' + base.getHexString(); g.fillRect(0, 0, 64, 64); g.fillStyle = 'rgba(255,230,200,.12)'; for (let i = 0; i < 64; i += 16) g.fillRect(i, 0, 6, 64); g.fillStyle = 'rgba(255,230,200,.18)'; for (let i = 8; i < 64; i += 16) { g.beginPath(); g.arc(i + 3, 32, 2, 0, TAU); g.fill(); } const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t; }
function boardTex() { const c = document.createElement('canvas'); c.width = 128; c.height = 128; const g = c.getContext('2d'), R = W3.rng(8); for (let i = 0; i < 8; i++) { const l = 22 + R() * 10; g.fillStyle = `hsl(25,40%,${l}%)`; g.fillRect(0, i * 16, 128, 16); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, i * 16, 128, 1.2); g.fillRect(((R() * 128) | 0), i * 16, 1.2, 16); } const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t; }
function ghostModel(K) { const T = THREE, g = new T.Group(), P = []; for (let i = 0; i <= 12; i++) { const a = i / 12 * Math.PI / 2; P.push(new T.Vector2(Math.sin(a) * 0.38, 0.55 + Math.cos(a) * 0.38)); } P.push(new T.Vector2(0.42, 0.25), new T.Vector2(0.45, 0.0));
  const geo = new T.LatheGeometry(P.reverse(), 24), pos = geo.attributes.position; for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); if (y < 0.08) { const a = Math.atan2(pos.getZ(i), pos.getX(i)); pos.setY(i, y + Math.sin(a * 6) * 0.06); } } geo.computeVertexNormals();
  const mat = new T.MeshStandardMaterial({ color: K.col, emissive: K.col, emissiveIntensity: 0.55, roughness: 0.6, transparent: true, opacity: 0, depthWrite: false }); const body = new T.Mesh(geo, mat); g.add(body);
  const em = new T.MeshBasicMaterial({ color: 0x140a1c, transparent: true, opacity: 0 }); for (const s of [-1, 1]) { const e = new T.Mesh(new T.SphereGeometry(0.07, 10, 8), em); e.scale.set(0.8, 1.3, 0.5); e.position.set(s * 0.13, 0.62, 0.34); g.add(e); } const mo = new T.Mesh(new T.SphereGeometry(0.06, 10, 8), em); mo.scale.set(1, 0.8, 0.5); mo.position.set(0, 0.44, 0.38); g.add(mo);
  g.userData = { mat, em }; if (K.big) g.scale.setScalar(1.45); return g; }
function kidModel() { const T = THREE, g = new T.Group(), coat = new T.MeshStandardMaterial({ color: 0xf0b030, roughness: 0.6, emissive: 0x6a4000, emissiveIntensity: 0.5 }), skin = new T.MeshStandardMaterial({ color: 0xe8c0a0, roughness: 0.7, emissive: 0x5a3a2a, emissiveIntensity: 0.5 });
  const body = new T.Mesh(new T.ConeGeometry(0.3, 0.75, 14), coat); body.position.y = 0.38; g.add(body); const head = new T.Mesh(new T.SphereGeometry(0.17, 14, 10), skin); head.position.y = 0.88; g.add(head);
  const hood = new T.Mesh(new T.SphereGeometry(0.2, 14, 10, 0, TAU, 0, 1.9), coat); hood.position.y = 0.9; hood.rotation.x = -0.4; g.add(hood);
  const lamp = new T.Group(); const glass = new T.Mesh(new T.CylinderGeometry(0.07, 0.08, 0.16, 10), new T.MeshStandardMaterial({ color: 0xffd080, emissive: 0xffb040, emissiveIntensity: 2 })); lamp.add(glass); const cap = new T.Mesh(new T.ConeGeometry(0.09, 0.08, 10), new T.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.6, roughness: 0.4 })); cap.position.y = 0.12; lamp.add(cap); lamp.position.set(0.28, 0.6, 0); g.add(lamp);
  g.userData = { lamp, glass }; g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g; }
function furnModel(f, wood) { const T = THREE, g = new T.Group(), M = c => new T.MeshStandardMaterial({ color: c, roughness: 0.75 }); const h = { wardrobe: 1.7, table: 0.75, chest: 0.6, clock: 1.9, sofa: 0.8, piano: 1.1 }[f.kind] || 0.8;
  if (f.kind === 'table') { const top = new T.Mesh(new T.BoxGeometry(f.w, 0.08, f.d), wood); top.position.y = h; g.add(top); for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const l = new T.Mesh(new T.BoxGeometry(0.08, h, 0.08), wood); l.position.set(sx * (f.w / 2 - 0.1), h / 2, sz * (f.d / 2 - 0.1)); g.add(l); } const cl = new T.Mesh(new T.BoxGeometry(f.w * 0.9, 0.02, f.d * 1.05), M(0xc8c0b0)); cl.position.y = h + 0.05; g.add(cl); }
  else { const b = new T.Mesh(new T.BoxGeometry(f.w, h, f.d), f.kind === 'sofa' ? M(0x6a2a3a) : f.kind === 'piano' ? M(0x141014) : wood); b.position.y = h / 2; g.add(b); if (f.kind === 'clock') { const face = new T.Mesh(new T.CircleGeometry(0.18, 16), new T.MeshStandardMaterial({ color: 0xe8dcc0, emissive: 0x302a20 })); face.position.set(0, 1.5, f.d / 2 + 0.01); g.add(face); } if (f.kind === 'piano') { const keys = new T.Mesh(new T.BoxGeometry(f.w * 0.9, 0.04, 0.2), M(0xf0f0e8)); keys.position.set(0, 0.75, f.d / 2 + 0.1); g.add(keys); } }
  g.position.set(f.x, 0, f.z); g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; }
// ---------- the house ----------
function buildWorld() {
  if (V3) return V3; const T = THREE; if (!W3 || !W3.init({ canvas: $('gl'), fov: 55, far: 400, near: 0.1 })) { V3 = { none: true }; return V3; }
  const S = W3.scene; S.traverse(o => { if (o.material && o.material.uniforms && o.material.uniforms.sunPosition) o.visible = false; });
  V3 = { T, S, house: null, ghosts: new Map(), jars: [], key: null }; const V = V3;
  V.kid = kidModel(); S.add(V.kid);
  V.spot = new T.SpotLight(0xffd8a0, 60, 11, 0.55, 0.45, 1.4); V.spot.castShadow = true; V.spot.shadow.mapSize.set(512, 512); S.add(V.spot, V.spot.target);
  V.glow = new T.PointLight(0xffb060, 14, 4.5, 1.5); S.add(V.glow);
  V.cone = new T.Mesh(new T.ConeGeometry(1, 1, 24, 1, true), new T.MeshBasicMaterial({ color: 0xffd8a0, transparent: true, opacity: 0.06, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide })); V.cone.geometry.translate(0, -0.5, 0); V.cone.geometry.rotateZ(Math.PI / 2); S.add(V.cone);
  V.moon = new T.DirectionalLight(0x7a90d0, 0.7); V.moon.position.set(-10, 20, 5); S.add(V.moon); V.amb = new T.AmbientLight(0x4a4470, 2.6); S.add(V.amb);
  W3.setQuality(stepN); return V;
}
// the floor plan for this game: floors, walls, furniture, jars, the black over rooms not yet seen
function buildHouse(V, g) { const T = THREE; if (V.house) { V.S.remove(V.house); V.house.traverse(o => { if (o.geometry) o.geometry.dispose(); }); } const H = new T.Group(); V.house = H; V.S.add(H);
  const P = PLACES[g.place], wood = new T.MeshStandardMaterial({ color: 0x5a3a24, roughness: 0.7 }), bt = boardTex(); bt.repeat.set(RS / 2, RS / 2);
  const floorM = new T.MeshStandardMaterial({ map: bt, color: P.floor, roughness: 0.85 }), wallM = new T.MeshStandardMaterial({ map: stripeTex(P.wall), roughness: 0.9 }), topM = new T.MeshStandardMaterial({ color: 0x1a1218, roughness: 0.9 });
  V.fog = []; for (const rm of g.rooms) { const r = roomRect(g, rm.i, rm.j), fl = new T.Mesh(new T.PlaneGeometry(RS, RS), floorM); fl.rotation.x = -Math.PI / 2; fl.position.set(r.cx, 0, r.cz); fl.receiveShadow = true; H.add(fl);
    const rug = new T.Mesh(new T.CircleGeometry(1.4, 24), new T.MeshStandardMaterial({ color: [0x5a2030, 0x2a3a5a, 0x3a4a2a][(rm.i + rm.j) % 3], roughness: 1 })); rug.rotation.x = -Math.PI / 2; rug.scale.set(1.3, 0.8, 1); rug.position.set(r.cx, 0.01, r.cz); H.add(rug);
    const dark = new T.Mesh(new T.BoxGeometry(RS + 0.02, 2.2, RS + 0.02), new T.MeshBasicMaterial({ color: 0x04030a, transparent: true, opacity: 0.97 })); dark.position.set(r.cx, 1.1, r.cz); H.add(dark); V.fog.push(dark); }
  for (const w of g.walls) { const h = 1.5, m = new T.Mesh(new T.BoxGeometry(w.x1 - w.x0, h, w.z1 - w.z0), [wallM, wallM, topM, topM, wallM, wallM]); m.position.set((w.x0 + w.x1) / 2, h / 2, (w.z0 + w.z1) / 2); m.castShadow = m.receiveShadow = true; H.add(m); }
  V.furn = g.furn.map(f => { const m = furnModel(f, wood); H.add(m); return m; });
  // windows: pale moonlight squares on the floor by the outer walls
  const wm = new T.MeshBasicMaterial({ color: 0x8aa0e0, transparent: true, opacity: 0.12, depthWrite: false }); for (const rm of g.rooms) { if (rm.j !== g.cfg.rh - 1) continue; const r = roomRect(g, rm.i, rm.j), w = new T.Mesh(new T.PlaneGeometry(1.4, 1.8), wm); w.rotation.x = -Math.PI / 2; w.position.set(r.cx + 1.2, 0.02, r.z0 + 1.2); H.add(w); }
  V.jars.forEach(j => V.S.remove(j)); V.jars = g.jars.map(j => { const m = new T.Group(), b = new T.Mesh(new T.CylinderGeometry(0.12, 0.16, 0.34, 10), new T.MeshStandardMaterial({ color: 0xffb040, emissive: 0xc06010, emissiveIntensity: 0.9, transparent: true, opacity: 0.9 })); b.position.y = 0.17; m.add(b); const c = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 0.08, 8), new T.MeshStandardMaterial({ color: 0x5a3a20 })); c.position.y = 0.38; m.add(c); m.position.set(j.x, 0, j.z); m.userData.j = j; V.S.add(m); return m; });
  for (const [, m] of V.ghosts) V.S.remove(m); V.ghosts.clear(); }
function sync(V, g, t, dt) {
  const m = g.me; V.kid.position.set(m.x, 0, m.z); V.kid.rotation.y = -m.face; V.kid.userData.lamp.position.y = 0.6 + Math.sin(t * 6) * (m.v > 0 ? 0.03 : 0.01); if (m.scared > 0) V.kid.position.y = Math.abs(Math.sin(t * 30)) * 0.05;
  const lit = g.oil > 0 ? 1 : 0.25 + 0.2 * Math.random(), rng = g.cfg.range * (g.oil > 0 ? 1 : 0.3), lx = m.x + Math.cos(m.face) * 0.3, lz = m.z + Math.sin(m.face) * 0.3;
  V.spot.position.set(lx, 1.2, lz); V.spot.target.position.set(m.x + Math.cos(m.face) * 5, 0, m.z + Math.sin(m.face) * 5); V.spot.target.updateMatrixWorld(); V.spot.angle = g.cfg.cone + 0.12; V.spot.distance = rng + 2; V.spot.intensity = 60 * lit * (0.95 + Math.random() * 0.05);
  V.glow.position.set(lx, 1.1, lz); V.glow.intensity = 14 * lit; V.kid.userData.glass.material.emissiveIntensity = 2 * lit;
  V.cone.position.set(lx, 0.7, lz); V.cone.rotation.set(0, -m.face, -0.06); const rad = Math.tan(g.cfg.cone) * rng; V.cone.scale.set(rng, rad, rad); V.cone.material.opacity = 0.05 * lit;
  g.rooms.forEach((rm, i) => { const f = V.fog[i]; if (!f) return; const want = rm.seen || rm.awake ? 0 : 0.97; f.material.opacity += (want - f.material.opacity) * Math.min(1, dt * 3); f.visible = f.material.opacity > 0.01; });
  g.furn.forEach((f, i) => { const o = V.furn[i]; if (!o) return; if (f.shake > 0) { f.shake -= dt; o.rotation.z = Math.sin(t * 40) * 0.04 * f.shake; o.position.x = f.x + Math.sin(t * 33) * 0.03 * f.shake; } else { o.rotation.z = 0; o.position.x = f.x; } });
  V.jars.forEach(o => { o.visible = g.jars.includes(o.userData.j); o.rotation.y = t; });
  // ghosts: seen in the beam; a faint shimmer when one is near; held ones glow and shake
  const seen = new Set(); for (const q of g.ghosts) { if (q.hid) continue; let o = V.ghosts.get(q.id); if (!o) { o = ghostModel(KINDS[q.kind]); V.S.add(o); V.ghosts.set(q.id, o); } seen.add(q.id);
    const d = Math.hypot(q.x - m.x, q.z - m.z), shim = d < 5.5 ? 0.1 + 0.06 * Math.sin(t * 7 + q.id) : 0, vis = Math.max(q.lit * 0.9, shim);
    o.position.set(q.x + (q.lit > 0.5 ? (Math.random() - 0.5) * 0.06 * (1 + q.cap * 2) : 0), 0.15 + Math.sin(t * 2 + q.id) * 0.1, q.z); o.rotation.y = Math.atan2(m.x - q.x, m.z - q.z); const sc = (KINDS[q.kind].big ? 1.45 : 1) * (1 - q.cap * 0.35); o.scale.setScalar(sc);
    o.userData.mat.opacity = vis; o.userData.mat.emissiveIntensity = 0.5 + q.cap * 1.5; o.userData.em.opacity = vis > 0.2 ? vis : 0; }
  for (const [id, o] of V.ghosts) if (!seen.has(id)) { V.S.remove(o); V.ghosts.delete(id); }
}
const SV = new (window.THREE ? THREE.Vector3 : Object)();
function scr(x, y, z) { if (!V3 || V3.none) return { x: W / 2 + x * 40, y: H / 2 + z * 40, front: true }; SV.set(x, y, z); return W3.screen(SV); }
// ---------- events ----------
function onEvent(G, e) {
  const m = G.me, p = e.x != null ? scr(e.x, 0.6, e.z) : scr(m.x, 0.6, m.z), cx = W / 2;
  switch (e.k) {
    case 'start': ui.row = 0; say(PLACES[G.place].name.toUpperCase(), cx, H * 0.26, '#ffffff', 26); say(`CATCH ${G.total} GHOSTS`, cx, H * 0.32, '#ffe08a', 22); sfx.go();
      if (G.N <= 2) tip('turn', 'Drag a little to turn your lantern. Drag further to walk. Hold ghosts in the light!', 3.6); break;
    case 'lit': sfx.lit(); break;
    case 'catch': ui.row++; sfx.catch(ui.row); vibe(HAP.sharp); FX.flash = 0.2; burst(p.x, p.y, e.kind === 'gold' ? '#ffd040' : '#e8f0ff', 22, 180); say(e.kind === 'gold' ? 'GOLDEN! +6 🪙' : 'CAUGHT!', p.x, p.y - 30 * k, e.kind === 'gold' ? '#ffd040' : '#e8f0ff', 24); break;
    case 'popout': sfx.ooo(); say('BOO!', p.x, p.y - 20 * k, '#e8f0ff', 20); break;
    case 'wake': sfx.rattle(); break;
    case 'scare': ui.row = 0; sfx.scare(); FX.shake = 14; FX.red = 0.8; vibe(HAP.fail || HAP.best); say('AAH!', cx, H * 0.4, '#ffb4a8', 34); if (G.N <= 4) tip('frost', 'Frost at the edge of the screen means a ghost is close that way. Turn to it!', 3); break;
    case 'oil': sfx.oil(); say('+OIL', p.x, p.y - 26 * k, '#ffc060', 20); break;
    case 'dark': sfx.dark(); say('THE OIL IS GONE!', cx, H * 0.36, '#ffb4a8', 22); tip('dark', 'No oil: the lantern is dying. Find a jar fast!', 3); break;
    case 'goldghost': sfx.gold(); say('A GOLDEN GHOST!', cx, H * 0.3, '#ffd040', 22); tip('gold', 'A golden ghost runs from you. Catch it for coins before it vanishes.', 3); break;
    case 'goldgone': break;
    case 'lessonnext': if (e.first) hint = null; say('FIRST, A LESSON', cx, H * 0.3, '#ffe08a', 24); sfx.go(); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, cx, H * 0.36, '#9be3b5', 22); break;
    case 'lessonmiss': coachMiss(); break;
    case 'lessondone': say('NOW THE HOUSE!', cx, H * 0.3, '#ffe08a', 24); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); vibe(HAP.best); say('ALL CAUGHT!', cx, H * 0.3, '#ffd040', 34); break;
    case 'lost': sfx.lose(); say(e.why === 'oil' ? 'THE LANTERN WENT OUT' : 'TOO SCARED!', cx, H * 0.3, '#ffb4a8', 26); break;
  }
}
// ---------- every frame ----------
function placeCam(g, dt) { const cam = W3.cam, asp = innerWidth / innerHeight, m = g.me; cam.fov = asp < 0.8 ? 56 : 44; cam.aspect = asp; cam.updateProjectionMatrix();
  const want = { x: m.x + Math.cos(m.face) * 0.8, y: 11, z: m.z + 5.2 + Math.sin(m.face) * 0.8 }; if (!ui.cam || ui.snap) { ui.cam = Object.assign({}, want); ui.snap = false; }
  const c = ui.cam, e = 1 - Math.exp(-dt * 5); c.x += (want.x - c.x) * e; c.y += (want.y - c.y) * e; c.z += (want.z - c.z) * e; const sh = FX.shake ? (Math.random() - 0.5) * FX.shake * 0.015 : 0;
  cam.position.set(c.x + sh, c.y, c.z + sh); cam.lookAt(c.x, 0, c.z - 6.8); cam.updateMatrixWorld(); }
let IG = null; function idleG() { if (!IG || IG.over) { IG = newGame(Math.max(2, store.get('level', 1) | 0), { seed: (Math.random() * 1e6) | 0 }); IG.mem = {}; ui.snap = true; } honest(IG, { react: 0.25, acc: 0.95 }, IG.mem); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#0a0812'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D house.', W / 2, H / 2); return; }
  const g = G || idleG(), t = now;
  if (!V.sky) { V.sky = 1; W3.setSky('night', {}); W3.scene.background = new THREE.Color(0x04030a); W3.scene.fog.near = 30; W3.scene.fog.far = 90; W3.S.hemiI = 0.34; W3.sun.intensity = 0.0; W3.S.exposure = 1.3; W3.scene.environmentIntensity = 0.08; }
  if (V.key !== g) { V.key = g; buildHouse(V, g); ui.snap = true; }
  placeCam(g, dt); sync(V, g, t, dt); W3.setFocus(g.me.x, 0, g.me.z, 12); W3.render(dt);
  if (G) overlay(G, t);
  if (G) hud(G, t);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 1.0 ? 1 : 1 - (t2.t - 1.0) / 0.5; ctx.globalAlpha = Math.max(0, al); const sc = t2.t < 0.12 ? 1.3 - t2.t / 0.12 * 0.3 : 1; ctx.font = `400 ${Math.round(t2.size * k * sc)}px ${TF}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(8,4,16,.75)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 20); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 20); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30;
    ctx.fillStyle = 'rgba(16,10,26,.9)'; rrect(W / 2 - w / 2, H * 0.74 - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.74 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,40,80,${FX.red * 0.2})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,250,235,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); }
}
// frost at the edge toward a ghost close and unlit; the catch ring round a held ghost
function overlay(g, t) { const m = g.me, me = scr(m.x, 0.6, m.z);
  for (const q of g.ghosts) { if (q.hid) continue; const d = Math.hypot(q.x - m.x, q.z - m.z);
    if (q.lit < 0.3 && d < 3.4 && !KINDS[q.kind].flee) { const p = scr(q.x, 0.6, q.z), a = Math.atan2(p.y - me.y, p.x - me.x), u = 1 - d / 3.4, ex = W / 2 + Math.cos(a) * W * 0.62, ey = H / 2 + Math.sin(a) * H * 0.55, gr = ctx.createRadialGradient(ex, ey, 0, ex, ey, W * 0.7);
      gr.addColorStop(0, `rgba(200,230,255,${0.55 * u})`); gr.addColorStop(0.5, `rgba(160,200,255,${0.22 * u})`); gr.addColorStop(1, 'rgba(160,200,255,0)'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); }
    if (q.lit > 0.4 && q.cap > 0.02) { const p = scr(q.x, 0.8, q.z), r = 26 * k * (KINDS[q.kind].big ? 1.4 : 1); ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 5 * k; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.stroke(); ctx.strokeStyle = q.kind === 'gold' ? '#ffd040' : '#ffe08a'; ctx.beginPath(); ctx.arc(p.x, p.y, r, -Math.PI / 2, -Math.PI / 2 + TAU * q.cap); ctx.stroke(); } } }
// ---------- the 2D layer ----------
function panel(x, y, w, h) { ctx.fillStyle = 'rgba(16,10,26,.76)'; rrect(x, y, w, h, 14); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 1.5; rrect(x, y, w, h, 14); ctx.stroke(); }
function hud(G, t) {
  const c = G.cfg, m = G.me; ctx.textBaseline = 'middle';
  if (!G.lesson) {
    const x = 12, y = 48 * k, w = W - 24, h = 62 * k; panel(x, y, w, h);
    ctx.textAlign = 'left'; ctx.font = `400 ${Math.round(22 * k)}px ${TF}`; ctx.fillStyle = '#fff'; ctx.fillText(`👻 ${G.caught}`, x + 12, y + 18 * k); const tw = ctx.measureText(`👻 ${G.caught}`).width; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillText(`/ ${G.total} caught`, x + 18 + tw, y + 20 * k);
    // hearts
    ctx.textAlign = 'right'; ctx.font = `${Math.round(15 * k)}px sans-serif`; let hs = ''; for (let i = 0; i < c.hearts; i++) hs += i < m.hearts ? '❤️' : '🖤'; ctx.fillText(hs, x + w - 12, y + 18 * k);
    // oil
    const ox = x + 12, ow = w - 24 - 80 * k, oy = y + 42 * k; ctx.textAlign = 'left'; ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillStyle = G.oil < 25 ? '#ff9a7a' : 'rgba(255,255,255,.8)'; ctx.fillText('OIL', ox, oy); ctx.fillStyle = 'rgba(255,255,255,.15)'; rrect(ox + 26 * k, oy - 4 * k, ow - 26 * k, 8 * k, 4); ctx.fill();
    ctx.fillStyle = G.oil < 25 ? (Math.floor(t * 4) % 2 ? '#ff6a4a' : '#ffb040') : '#ffb040'; rrect(ox + 26 * k, oy - 4 * k, (ow - 26 * k) * clamp(G.oil / (c.oil + 20), 0, 1), 8 * k, 4); ctx.fill();
    // the map: rooms you have seen, where you are
    const mw = 64 * k, mh = Math.min(48 * k, mw * c.rh / c.rw), cs = Math.min(mw / c.rw, mh / c.rh), mx0 = x + w - 12 - c.rw * cs, my0 = y + h + 8 * k; ctx.fillStyle = 'rgba(16,10,26,.7)'; rrect(mx0 - 4, my0 - 4, c.rw * cs + 8, c.rh * cs + 8, 6); ctx.fill();
    const here = roomAt(G, m.x, m.z); G.rooms.forEach((rm, i) => { const rx = mx0 + rm.i * cs, ry = my0 + (c.rh - 1 - rm.j) * cs; ctx.fillStyle = i === here ? '#ffe08a' : rm.seen ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.08)'; ctx.fillRect(rx + 1, ry + 1, cs - 2, cs - 2); });
    for (const j of G.jars) if (G.rooms[j.room] && G.rooms[j.room].seen) { const rm = G.rooms[j.room]; ctx.fillStyle = '#ffb040'; ctx.beginPath(); ctx.arc(mx0 + (rm.i + 0.5) * cs, my0 + (c.rh - 1 - rm.j + 0.5) * cs, 2.5 * k, 0, TAU); ctx.fill(); }
  } else lessonPanel(G);
  // your thumb: the stick, with the inner ring (turn) and the outer (walk)
  const st = ui.stick; if (st) { const R = 70 * k, dx = st.x - st.x0, dy = st.y - st.y0, L = Math.hypot(dx, dy), u = Math.min(1, L / R); ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 3 * k; ctx.beginPath(); ctx.arc(st.x0, st.y0, R, 0, TAU); ctx.stroke(); ctx.setLineDash([4 * k, 5 * k]); ctx.beginPath(); ctx.arc(st.x0, st.y0, R * 0.4, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = u > 0.4 ? 'rgba(255,224,138,.6)' : 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.arc(st.x0 + (L ? dx / L : 0) * R * u, st.y0 + (L ? dy / L : 0) * R * u, 20 * k, 0, TAU); ctx.fill();
    ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillText(u > 0.4 ? 'walk' : 'turn', st.x0, st.y0 + R + 12 * k); }
  else if (G.t < 6 && G.N <= 2 && !G.over) { ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 4); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText('drag a little to turn · further to walk', W / 2, H - 70 * k); ctx.globalAlpha = 1; }
}
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { coachPanel(G); }
