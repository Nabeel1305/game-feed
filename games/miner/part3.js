// ===================== THE VIEW: Star Miner in 3D (three.js through tools/world3d.js) =====================
// Deep space from above and behind the ship: stars, a coloured nebula for each sector, a far sun lighting the rocks from one
// side. Lumpy asteroids that tumble (gold-flecked ones, violet crystal ones), glowing ore that spins, the little ship with its
// engine flame, an orange mining beam, the long mothership with its green docking ring. Meteors burn red with a tail;
// pirates are sharp red ships firing pink bolts. The 2D layer draws the warning lines, the arrow home, the hold, the hull,
// the mothership's clock and the calls.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { snap: true, stick: null, cam: null };
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 140) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: 0.4 + Math.random() * 0.4, col, r: (1.5 + Math.random() * 2.5) * k }); } if (PARTS.length > 240) PARTS.splice(0, PARTS.length - 240); }
function fxStep(dt) {
  FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2.5); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.5) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 1 - dt * 2; p.vy *= 1 - dt * 2; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; }
}
const hex = n => '#' + n.toString(16).padStart(6, '0');
// ---------- the drawings ----------
function rockGeo(seed, kind) { const T = THREE, g = new T.IcosahedronGeometry(1, 2), p = g.attributes.position, R0 = W3.rng(seed), a = [R0() * 6, R0() * 6, R0() * 6], cols = [];
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), n = 1 + 0.18 * Math.sin(x * 3 + a[0]) * Math.cos(z * 3 + a[1]) + 0.1 * Math.sin(y * 5 + a[2]); p.setXYZ(i, x * n, y * n * 0.8, z * n);
    const fleck = kind === 'gold' && Math.sin(x * 9 + a[1]) * Math.cos(y * 8 + a[2]) > 0.55; const sh = 0.75 + R0() * 0.25; cols.push(...(fleck ? [1.6, 1.2, 0.3] : [sh, sh, sh])); }
  g.setAttribute('color', new T.Float32BufferAttribute(cols, 3)); g.computeVertexNormals(); return g; }
function shipModel(q, pirate) { const T = THREE, g = new T.Group(), M = (c, e) => new T.MeshStandardMaterial({ color: c, roughness: 0.35, metalness: 0.5, emissive: e || 0, emissiveIntensity: e ? 0.6 : 0 });
  const body = new T.Mesh(new T.ConeGeometry(0.32, 1.3, pirate ? 4 : 8), M(pirate ? 0x3a0a10 : q.col)); body.rotation.z = -Math.PI / 2; body.scale.set(1, 1, 0.55); g.add(body);
  const wg = new T.BoxGeometry(0.5, 0.06, pirate ? 1.5 : 1.25); const wing = new T.Mesh(wg, M(pirate ? 0xd02030 : q.col2, pirate ? 0x600010 : 0)); wing.position.x = -0.2; g.add(wing);
  if (pirate) { for (const s of [-1, 1]) { const f = new T.Mesh(new T.ConeGeometry(0.08, 0.6, 4), M(0xff3040, 0xff2030)); f.rotation.x = s * Math.PI / 2; f.position.set(-0.1, 0, s * 0.8); g.add(f); } }
  const cock = new T.Mesh(new T.SphereGeometry(0.16, 12, 8), new T.MeshStandardMaterial({ color: pirate ? 0xff4060 : 0x7ad8ff, roughness: 0.1, metalness: 0.2, emissive: pirate ? 0x400010 : 0x0a3050 })); cock.scale.set(1.4, 0.7, 0.8); cock.position.set(0.12, 0.12, 0); g.add(cock);
  const fl = new T.Mesh(new T.ConeGeometry(0.14, 0.7, 10), new T.MeshBasicMaterial({ color: pirate ? 0xff4060 : 0xffb030, transparent: true, opacity: 0.85, blending: T.AdditiveBlending, depthWrite: false })); fl.rotation.z = Math.PI / 2; fl.position.x = -0.95; g.add(fl); g.userData.flame = fl;
  g.scale.setScalar(pirate ? 1.4 : 1.5); g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g; }
function glowTex(c0) { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, c0); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); }
function buildWorld() {
  if (V3) return V3; const T = THREE; if (!W3 || !W3.init({ canvas: $('gl'), fov: 52, far: 2000, near: 0.1 })) { V3 = { none: true }; return V3; }
  const S = W3.scene, R0 = W3.rng(42); S.traverse(o => { if (o.material && o.material.uniforms && o.material.uniforms.sunPosition) o.visible = false; });
  const V = { T, S, rocks: new Map(), ore: new Map(), mets: [], pirs: new Map(), bolts: [], geos: {} }; V3 = V;
  // stars: a big shell of points far below and around
  const N = 2400, sp = new Float32Array(N * 3); for (let i = 0; i < N; i++) { const a = R0() * TAU, b = Math.acos(R0() * 2 - 1), r = 600; sp.set([Math.sin(b) * Math.cos(a) * r, -Math.abs(Math.cos(b)) * r * 0.9 - 40, Math.sin(b) * Math.sin(a) * r], i * 3); }
  const sg = new T.BufferGeometry(); sg.setAttribute('position', new T.BufferAttribute(sp, 3)); const stars = new T.Points(sg, new T.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, fog: false })); S.add(stars);
  // nebula clouds under the field
  V.nebM = []; for (let i = 0; i < 7; i++) { const m = new T.MeshBasicMaterial({ map: glowTex('rgba(255,255,255,.9)'), color: 0x3a1a4a, transparent: true, opacity: 0.55, depthWrite: false, blending: T.AdditiveBlending, fog: false }); const p = new T.Mesh(new T.PlaneGeometry(1, 1), m); p.rotation.x = -Math.PI / 2; p.scale.setScalar(80 + R0() * 120); p.position.set((R0() - 0.5) * 160, -60 - R0() * 40, -40 + (R0() - 0.5) * 140); S.add(p); V.nebM.push(m); }
  // the mothership and its docking ring
  const hullM = new T.MeshStandardMaterial({ color: 0x8a94a8, roughness: 0.5, metalness: 0.6 }), darkM = new T.MeshStandardMaterial({ color: 0x2a3040, roughness: 0.6, metalness: 0.4 });
  const mom = new T.Group(); const core = new T.Mesh(new T.BoxGeometry(13, 1.0, 2.6), hullM); core.position.set(0, -2.6, 9.6); mom.add(core);
  for (const sx of [-5, -1.7, 1.7, 5]) { const pod = new T.Mesh(new T.CylinderGeometry(0.55, 0.55, 2.6, 12), darkM); pod.rotation.z = Math.PI / 2; pod.position.set(sx, -2.2, 10.6); mom.add(pod); const l = new T.Mesh(new T.SphereGeometry(0.14, 8, 6), new T.MeshBasicMaterial({ color: 0xff4040 })); l.position.set(sx, -2.0, 8.3); mom.add(l); }
  for (const sx of [-6.8, 6.8]) { const eg = new T.Sprite(new T.SpriteMaterial({ map: glowTex('rgba(120,200,255,1)'), blending: T.AdditiveBlending, depthWrite: false })); eg.scale.setScalar(2.4); eg.position.set(sx, -2.4, 9.6); mom.add(eg); }
  const tower = new T.Mesh(new T.BoxGeometry(2, 0.8, 1.2), hullM); tower.position.set(0, -1.8, 10.2); mom.add(tower); const arm = new T.Mesh(new T.BoxGeometry(0.6, 0.3, 2.4), darkM); arm.position.set(0, -1.9, 7.6); mom.add(arm); S.add(mom);
  V.ring = new T.Mesh(new T.TorusGeometry(DOCK_R, 0.12, 10, 48), new T.MeshBasicMaterial({ color: 0x40ff9a })); V.ring.rotation.x = -Math.PI / 2; V.ring.position.set(DOCK.x, -0.2, DOCK.z); S.add(V.ring);
  V.ringGlow = new T.Mesh(new T.CircleGeometry(DOCK_R, 40), new T.MeshBasicMaterial({ color: 0x40ff9a, transparent: true, opacity: 0.12, depthWrite: false })); V.ringGlow.rotation.x = -Math.PI / 2; V.ringGlow.position.set(DOCK.x, -0.25, DOCK.z); S.add(V.ringGlow);
  // the ship, the beam, the magnet's ring
  V.beam = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 1, 6, 1, true), new T.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: 0.9, blending: T.AdditiveBlending, depthWrite: false })); S.add(V.beam);
  V.beamGlow = new T.Sprite(new T.SpriteMaterial({ map: glowTex('rgba(255,180,80,1)'), blending: T.AdditiveBlending, depthWrite: false })); V.beamGlow.scale.setScalar(1.4); S.add(V.beamGlow);
  V.boltM = new T.SpriteMaterial({ map: glowTex('rgba(255,90,170,1)'), blending: T.AdditiveBlending, depthWrite: false }); V.metM = new T.MeshStandardMaterial({ color: 0x5a2010, emissive: 0xff4010, emissiveIntensity: 0.9, roughness: 0.8, flatShading: true });
  V.trailM = new T.SpriteMaterial({ map: glowTex('rgba(255,120,40,1)'), blending: T.AdditiveBlending, depthWrite: false, opacity: 0.8 });
  V.oreG = new T.OctahedronGeometry(0.2, 0); V.oreM = [new T.MeshStandardMaterial({ color: 0xc8d0e0, emissive: 0x506080, roughness: 0.3, metalness: 0.6 }), new T.MeshStandardMaterial({ color: 0xffc830, emissive: 0xa06000, roughness: 0.2, metalness: 0.9 }), new T.MeshStandardMaterial({ color: 0x60f0ff, emissive: 0x2090c0, roughness: 0.1 })];
  V.crystM = new T.MeshStandardMaterial({ color: 0xb070ff, emissive: 0x6020c0, emissiveIntensity: 0.8, roughness: 0.15, transparent: true, opacity: 0.9 });
  V.dir = new T.DirectionalLight(0xfff0e0, 2.6); V.dir.position.set(-30, 40, -10); S.add(V.dir); V.fill = new T.AmbientLight(0x404a70, 0.9); S.add(V.fill);
  W3.setQuality(stepN); return V;
}
function setPlace(V, i) { const P = PLACES[i]; V.rockCol = P.rock; for (const m of V.nebM) m.color.setHex(P.neb); for (const [, m] of V.rocks) if (m.userData.kind === 'rock') m.material.color.setHex(P.rock); }
function rockMesh(V, r) { let m = V.rocks.get(r.id); if (m) return m; const T = THREE, key = r.kind + (r.seed % 6); if (!V.geos[key]) V.geos[key] = rockGeo(r.seed % 6 + 1, r.kind);
  m = new T.Mesh(V.geos[key], new T.MeshStandardMaterial({ color: r.kind === 'gold' ? 0x6a5a40 : r.kind === 'crystal' ? 0x3a3048 : V.rockCol || 0x7a6250, roughness: 0.9, flatShading: true, vertexColors: true, emissive: 0xff8040, emissiveIntensity: 0 }));
  if (r.kind === 'crystal') for (let i = 0; i < 5; i++) { const c = new T.Mesh(new T.OctahedronGeometry(0.35, 0), V.crystM); const a = i / 5 * TAU; c.position.set(Math.cos(a) * 0.8, 0.4, Math.sin(a) * 0.8); c.scale.set(0.6, 1.6, 0.6); c.rotation.set(Math.cos(a) * 0.6, 0, Math.sin(a) * 0.6); m.add(c); }
  m.userData.kind = r.kind; m.castShadow = true; V.S.add(m); V.rocks.set(r.id, m); return m; }
// keep the 3D in step with the game: what is new gets a mesh, what is gone loses it
function sync(V, g, t, dt) {
  const seen = new Set(); for (const r of g.rocks) { const m = rockMesh(V, r); seen.add(r.id); m.position.set(r.x, -0.2, r.z); m.scale.setScalar(r.r); m.rotation.set(r.spin * 0.7, r.spin, r.spin * 0.4); m.material.emissiveIntensity = r.hit * 0.35 + (1 - r.hp / r.max) * 0.25; }
  for (const [id, m] of V.rocks) if (!seen.has(id)) { V.S.remove(m); V.rocks.delete(id); }
  seen.clear(); for (const o of g.ore) { let m = V.ore.get(o.id); if (!m) { m = new THREE.Mesh(V.oreG, V.oreM[o.val >= 5 ? 2 : o.val >= 3 ? 1 : 0]); V.S.add(m); V.ore.set(o.id, m); } seen.add(o.id); m.position.set(o.x, 0.1 + Math.sin(t * 3 + o.id) * 0.08, o.z); m.rotation.set(0.4, t * 2 + o.id, 0); m.scale.setScalar(o.val >= 5 ? 1.3 : o.val >= 3 ? 1.1 : 0.9); }
  for (const [id, m] of V.ore) if (!seen.has(id)) { V.S.remove(m); V.ore.delete(id); }
  // the ship
  const me = g.me, Sh = V.ship; Sh.position.set(me.x, 0.2 + Math.sin(t * 2) * 0.05, me.z); Sh.rotation.set(0, -me.face, -clamp((g.stick.x * Math.sin(me.face) - g.stick.z * Math.cos(me.face)) * 0.5, -0.5, 0.5));
  Sh.visible = !(me.inv > 0 && Math.floor(t * 12) % 2); const thr = Math.hypot(g.stick.x, g.stick.z); Sh.userData.flame.scale.set(1, 0.4 + thr * 1.4 + Math.random() * 0.2, 1);
  // the beam
  const b = g.beam; V.beam.visible = V.beamGlow.visible = !!b; if (b) { const dx = b.x - me.x, dz = b.z - me.z, L = Math.hypot(dx, dz); V.beam.position.set(me.x + dx / 2, 0.15, me.z + dz / 2); V.beam.scale.set(1 + Math.random() * 0.4, L, 1 + Math.random() * 0.4); V.beam.rotation.set(Math.PI / 2, 0, -Math.atan2(dx, dz) + Math.PI); V.beam.rotation.order = 'YXZ'; V.beam.rotation.set(Math.PI / 2, Math.atan2(dx, dz), 0); V.beamGlow.position.set(b.x, 0.3, b.z); V.beamGlow.scale.setScalar(1.2 + Math.random() * 0.5); }
  // meteors (and their tails), bolts, pirates
  while (V.mets.length < g.mets.length) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6, 1), V.metM); const tr = new THREE.Sprite(V.trailM); V.S.add(m, tr); V.mets.push({ m, tr }); }
  V.mets.forEach((q, i) => { const o = g.mets[i]; q.m.visible = q.tr.visible = !!o; if (!o) return; q.m.position.set(o.x, 0.2, o.z); q.m.rotation.set(t * 3, t * 2, 0); const L = Math.hypot(o.vx, o.vz); q.tr.position.set(o.x - o.vx / L * 1.2, 0.2, o.z - o.vz / L * 1.2); q.tr.scale.set(2.6, 2.6, 1); });
  while (V.bolts.length < g.bolts.length) { const s = new THREE.Sprite(V.boltM); s.scale.setScalar(0.9); V.S.add(s); V.bolts.push(s); }
  V.bolts.forEach((s, i) => { const o = g.bolts[i]; s.visible = !!o; if (o) s.position.set(o.x, 0.25, o.z); });
  seen.clear(); for (const p of g.pirates) { let m = V.pirs.get(p.id); if (!m) { m = shipModel(null, true); V.S.add(m); V.pirs.set(p.id, m); } seen.add(p.id); m.position.set(p.x, 0.25, p.z); const fa = Math.atan2(g.me.z - p.z, g.me.x - p.x); m.rotation.set(0, -fa, 0); m.children[0].material.emissiveIntensity = p.hit; m.children[0].material.emissive.setHex(0xff2020); }
  for (const [id, m] of V.pirs) if (!seen.has(id)) { V.S.remove(m); V.pirs.delete(id); }
  V.ring.material.color.setHex(g.me.cargo ? 0x40ff9a : 0x2a8a5a); V.ringGlow.material.opacity = g.me.cargo ? 0.12 + 0.08 * Math.sin(t * 4) : 0.05;
}
const SV = new (window.THREE ? THREE.Vector3 : Object)();
function scr(x, y, z) { if (!V3 || V3.none) return { x: W / 2 + x * 30, y: H / 2 + z * 30, front: true }; SV.set(x, y, z); return W3.screen(SV); }
// ---------- events ----------
function onEvent(G, e) {
  const m = G.me, p = e.x != null ? scr(e.x, 0.2, e.z) : scr(m.x, 0.2, m.z), cx = W / 2;
  switch (e.k) {
    case 'start': say(PLACES[G.place].name.toUpperCase(), cx, H * 0.26, '#ffffff', 20); say(`DELIVER ${G.cfg.goal} ORE`, cx, H * 0.32, '#ffd080', 20); sfx.go();
      if (G.N <= 2) tip('fly', 'Drag anywhere to fly. Your laser cracks rocks by itself; fly over the ore to scoop it.', 3.6); break;
    case 'crack': sfx.crack(e.size); burst(p.x, p.y, e.kind === 'gold' ? '#ffd040' : e.kind === 'crystal' ? '#c090ff' : '#b0a090', 8 + e.size * 6, 120 + e.size * 40); if (e.size === 0) sfx.burst(); FX.shake = Math.max(FX.shake, e.size * 2); break;
    case 'scoop': sfx.scoop(e.n, e.val); say(e.val >= 5 ? '💎 +5' : e.val >= 3 ? '+3' : '+1', p.x, p.y - 26 * k, e.val >= 5 ? '#80f0ff' : e.val >= 3 ? '#ffd040' : '#dde4f0', e.val >= 3 ? 20 : 15); if (e.full) { sfx.full(); say('HOLD FULL', cx, H * 0.4, '#ffd080', 22); tip('home', 'Hold full: follow the green arrow home to the mothership.', 3); } break;
    case 'full': break;
    case 'dock': sfx.dock(e.n); vibe(HAP.sharp); FX.flash = 0.25; say(`+${e.val} DELIVERED`, cx, H * 0.36, '#6af0c0', 26); if (e.hull) say('HULL PATCHED', cx, H * 0.42, '#bfefff', 16); break;
    case 'warn': sfx.warn(); if (G.N <= 4) tip('met', 'A red line: a meteor is coming that way. Fly out of it!', 2.6); break;
    case 'meteor': sfx.whoosh(); break;
    case 'dodge': sfx.dodge(); break;
    case 'pirate': sfx.pirate(); say('PIRATE!', cx, H * 0.3, '#ff6a7a', 24); tip('pir', 'Pirates shoot slow bolts. Keep moving, or fly close and your laser turns on them.', 3.4); break;
    case 'shoot': sfx.pew(); break;
    case 'boom': sfx.boom(); FX.shake = 10; FX.flash = 0.4; vibe(HAP.best); burst(p.x, p.y, '#ff6a40', 30, 220); say('PIRATE DOWN +4 🪙', p.x, p.y - 30 * k, '#ffd040', 18); break;
    case 'dent': sfx.dent(); FX.shake = 12; FX.red = 0.6; vibe(HAP.fail || HAP.sharp); burst(p.x, p.y, '#ffffff', 16, 200); if (e.spill) say(`-${e.spill} SPILLED`, p.x, p.y - 30 * k, '#ffb4a8', 18); break;
    case 'bump': sfx.bump(); break;
    case 'lessonnext': if (e.first) hint = null; say('FIRST, A LESSON', cx, H * 0.3, '#ffe08a', 22); sfx.go(); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, cx, H * 0.36, '#9be3b5', 22); break;
    case 'lessonmiss': hint = { txt: e.how, t: 0, secs: 3.4 }; break;
    case 'lessondone': say('NOW THE REAL RUN!', cx, H * 0.3, '#ffe08a', 22); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); vibe(HAP.best); say('CARGO DELIVERED!', cx, H * 0.3, '#ffd040', 26); break;
    case 'lost': sfx.lose(); say(e.why === 'time' ? 'THE MOTHERSHIP JUMPED' : 'HULL GONE', cx, H * 0.3, '#ffb4a8', 22); break;
  }
}
// ---------- every frame ----------
function placeCam(g, dt) { const cam = W3.cam, asp = innerWidth / innerHeight, m = g.me; cam.fov = asp < 0.8 ? 56 : 44; cam.aspect = asp; cam.updateProjectionMatrix();
  const want = { x: m.x + m.vx * 0.25, y: 19, z: m.z + 10 + m.vz * 0.25 }; if (!ui.cam || ui.snap) { ui.cam = Object.assign({}, want); ui.snap = false; }
  const c = ui.cam, e = 1 - Math.exp(-dt * 4); c.x += (want.x - c.x) * e; c.y += (want.y - c.y) * e; c.z += (want.z - c.z) * e; const sh = FX.shake ? (Math.random() - 0.5) * FX.shake * 0.02 : 0;
  cam.position.set(c.x + sh, c.y, c.z + sh); cam.lookAt(c.x, 0, c.z - 9.5); cam.updateMatrixWorld(); }
let IG = null; function idleG() { if (!IG || IG.over) { IG = newGame(Math.max(2, store.get('level', 1) | 0), { seed: (Math.random() * 1e6) | 0 }); IG.mem = {}; ui.snap = true; } honest(IG, { react: 0.25, acc: 0.95 }, IG.mem); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#070b1c'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D field.', W / 2, H / 2); return; }
  const g = G || idleG(), t = now;
  if (!V.sky) { V.sky = 1; W3.setSky('night', {}); W3.scene.background = new THREE.Color(0x02030a); W3.scene.fog.near = 400; W3.scene.fog.far = 1500; W3.S.hemiI = 0.25; W3.sun.intensity = 0.0; W3.S.exposure = 0.95; W3.scene.environmentIntensity = 0.25; }
  if (V.place !== g.place) { V.place = g.place; setPlace(V, g.place); }
  if (V.shipId !== g.ship.id) { V.shipId = g.ship.id; if (V.ship) V.S.remove(V.ship); V.ship = shipModel(g.ship, false); V.S.add(V.ship); }
  placeCam(g, dt); sync(V, g, t, dt); W3.setFocus(g.me.x, 0, g.me.z, 20); W3.render(dt);
  warnings(g, t);
  if (G) hud(G, t);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 1.0 ? 1 : 1 - (t2.t - 1.0) / 0.5; ctx.globalAlpha = Math.max(0, al); const sc = t2.t < 0.12 ? 1.3 - t2.t / 0.12 * 0.3 : 1; ctx.font = `900 ${Math.round(t2.size * k * sc)}px ${TF}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(4,6,20,.7)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 20); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 20); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30;
    ctx.fillStyle = 'rgba(10,14,34,.88)'; rrect(W / 2 - w / 2, H * 0.72 - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.72 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,40,60,${FX.red * 0.18})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,250,235,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); }
}
// meteor warnings: a flashing red line along the path it will take
function warnings(g, t) { ctx.save(); for (const w of g.warn) { const L = Math.hypot(w.vx, w.vz), a = scr(w.x, 0.2, w.z), b = scr(w.x + w.vx / L * 60, 0.2, w.z + w.vz / L * 60); ctx.globalAlpha = 0.6 + 0.35 * Math.sin(t * 20); ctx.strokeStyle = '#ff3a3a'; ctx.lineWidth = 7 * k; ctx.setLineDash([12 * k, 8 * k]); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
  ctx.restore(); }
// ---------- the 2D layer ----------
function panel(x, y, w, h) { ctx.fillStyle = 'rgba(10,14,34,.74)'; rrect(x, y, w, h, 14); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 1.5; rrect(x, y, w, h, 14); ctx.stroke(); }
function hud(G, t) {
  const c = G.cfg, m = G.me; ctx.textBaseline = 'middle';
  if (!G.lesson) {
    const x = 12, y = 48 * k, w = W - 24, h = 64 * k; panel(x, y, w, h);
    ctx.textAlign = 'left'; ctx.font = `900 ${Math.round(20 * k)}px ${TF}`; ctx.fillStyle = '#fff'; ctx.fillText(`${G.delivered}`, x + 12, y + 18 * k); const tw = ctx.measureText(`${G.delivered}`).width;
    ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillText(`/ ${c.goal} ore home`, x + 18 + tw, y + 20 * k);
    ctx.textAlign = 'right'; const left = Math.ceil(G.left); ctx.font = `900 ${Math.round(16 * k)}px ${TF}`; ctx.fillStyle = left <= 15 ? (Math.floor(t * 4) % 2 ? '#ff6a6a' : '#fff') : '#fff'; ctx.fillText(`${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`, x + w - 12, y + 17 * k);
    ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.65)'; ctx.fillText('mothership jumps in', x + w - 12, y + 31 * k);
    // delivered bar
    const bx = x + 12, bw = w * 0.55, by = y + 32 * k; ctx.fillStyle = 'rgba(255,255,255,.15)'; rrect(bx, by, bw, 5 * k, 3); ctx.fill(); ctx.fillStyle = '#6af0c0'; rrect(bx, by, bw * clamp(G.delivered / c.goal, 0, 1), 5 * k, 3); ctx.fill(); ctx.fillStyle = 'rgba(255,176,48,.75)'; rrect(bx + bw * clamp(G.delivered / c.goal, 0, 1), by, bw * clamp(m.load / c.goal, 0, 1 - G.delivered / c.goal), 5 * k, 3); ctx.fill();
    // the hold and the hull
    ctx.textAlign = 'left'; ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillText('HOLD', bx, y + 50 * k); for (let i = 0; i < c.hold; i++) { ctx.fillStyle = i < m.cargo ? '#ffb030' : 'rgba(255,255,255,.18)'; rrect(bx + 34 * k + i * 9 * k, y + 46 * k, 7 * k, 8 * k, 2); ctx.fill(); }
    ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(255,255,255,.8)'; const hx0 = x + w - 12; for (let i = 0; i < c.hull; i++) { ctx.fillStyle = i < m.hull ? '#7ad8ff' : 'rgba(255,90,90,.5)'; ctx.beginPath(); ctx.arc(hx0 - i * 13 * k - 5 * k, y + 50 * k, 4.5 * k, 0, TAU); ctx.fill(); } ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillText('HULL', hx0 - c.hull * 13 * k - 2, y + 50 * k);
  } else lessonPanel(G);
  // the way home: an arrow at the edge of the screen when the dock is off it (gold and pulsing when the hold is full)
  const d = scr(DOCK.x, 0, DOCK.z), on = d.x > 20 && d.x < W - 20 && d.y > 130 * k && d.y < H - 40; if (m.cargo > 0 && !on) { const sp = scr(m.x, 0, m.z), ang = Math.atan2(d.y - sp.y, d.x - sp.x), rx = W / 2 - 34 * k, ry = H / 2 - 120 * k, cxx = W / 2, cyy = H / 2 + 20 * k, sc = Math.min(rx / Math.abs(Math.cos(ang) || 1e-6), ry / Math.abs(Math.sin(ang) || 1e-6)), ax = cxx + Math.cos(ang) * sc, ay = cyy + Math.sin(ang) * sc, full = m.cargo >= G.cfg.hold;
    ctx.save(); ctx.translate(ax, ay); ctx.rotate(ang); const s = (full ? 1.25 + 0.15 * Math.sin(t * 8) : 1) * k; ctx.fillStyle = full ? '#ffd040' : '#6af0c0'; ctx.beginPath(); ctx.moveTo(16 * s, 0); ctx.lineTo(-8 * s, -11 * s); ctx.lineTo(-3 * s, 0); ctx.lineTo(-8 * s, 11 * s); ctx.closePath(); ctx.fill(); ctx.restore();
    ctx.font = `800 ${Math.round(10 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillStyle = full ? '#ffd040' : '#6af0c0'; ctx.fillText('HOME', ax - Math.cos(ang) * 24 * k, ay - Math.sin(ang) * 24 * k); }
  // your thumb: the stick
  const st = ui.stick; if (st) { const R = 70 * k, dx = st.x - st.x0, dy = st.y - st.y0, L = Math.hypot(dx, dy), u = Math.min(1, L / R); ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 3 * k; ctx.beginPath(); ctx.arc(st.x0, st.y0, R, 0, TAU); ctx.stroke();
    ctx.fillStyle = 'rgba(255,176,48,.55)'; ctx.beginPath(); ctx.arc(st.x0 + (L ? dx / L : 0) * R * u, st.y0 + (L ? dy / L : 0) * R * u, 20 * k, 0, TAU); ctx.fill(); }
  else if (G.t < 5 && G.N <= 2 && !G.over) { ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 4); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText('drag anywhere to fly', W / 2, H - 70 * k); ctx.globalAlpha = 1; }
}
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) {
  const D = G.lesson, st = D.steps[D.i], x = 12, w = W - 24, y = 48 * k; ctx.save();
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; const lines = wrapText(st.how, w - 24), h = 50 * k + lines.length * 17 * k;
  ctx.fillStyle = 'rgba(10,14,34,.88)'; rrect(x, y, w, h, 12); ctx.fill(); ctx.strokeStyle = 'rgba(255,176,48,.7)'; ctx.lineWidth = 2; rrect(x, y, w, h, 12); ctx.stroke();
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#ffd080'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillText(`LESSON ${G.N} OF 3 · ${D.n} OF ${st.need}`, x + 12, y + 9 * k);
  ctx.fillStyle = '#fff'; ctx.font = `900 ${Math.round(16 * k)}px ${TF}`; ctx.fillText(st.title, x + 12, y + 23 * k);
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.92)'; lines.forEach((l, i) => ctx.fillText(l, x + 12, y + 46 * k + i * 17 * k));
  ctx.restore(); ctx.textBaseline = 'middle';
}
