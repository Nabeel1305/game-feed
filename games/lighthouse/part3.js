// ===================== THE VIEW: Lighthouse in 3D (three.js through tools/world3d.js) =====================
// From the gallery at the top of a lighthouse on a headland at night: the iron railing in front of you, the beam reaching out
// over a dark sea that moves, rain and lightning in a storm, stars and a moon on a clear night. The coast runs left and right:
// cliffs with surf, and on one side a little harbour (two breakwaters with a red and a green light, a village with lit
// windows). Fishing boats show as a lamp in the dark; rocks show by their surf when your light is on them. The view turns
// with the beam. World: x across, z = -y (out to sea), y up.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [];
let hint = null, V3 = null;
const LAMP_Y = 39.5, CAM_Y = 39.2;
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 6) TXT.shift(); }
function tip(key, txt, secs = 2.8) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function fxStep(dt) {
  FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 1.8);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.6) TXT.shift();
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; }
}
const ui = { drag: null };
function glowTex() { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); return t; }
function buildBoat(T, R, glow) {
  const g = new T.Group(), hullC = [0x2a4a6a, 0x7a2a22, 0x2a5a3a, 0x3a3a46, 0x6a5a2a][(R() * 5) | 0];
  const hg = new T.BoxGeometry(3, 1.6, 8, 1, 1, 4), p = hg.attributes.position;
  for (let i = 0; i < p.count; i++) { const z = p.getZ(i), y = p.getY(i); let x = p.getX(i); const bow = clamp((z + 1) / 3, 0, 1); x *= 1 - bow * 0.85 * (y < 0 ? 1.1 : 0.9); if (y < 0) x *= 0.55; p.setX(i, x); p.setY(i, y + bow * bow * 0.6 * (y > 0 ? 1 : 0)); }
  hg.computeVertexNormals();
  const hull = new T.Mesh(hg, new T.MeshStandardMaterial({ color: hullC, roughness: 0.6 })); hull.position.y = 0.4; hull.rotation.y = Math.PI; g.add(hull);
  const deck = new T.Mesh(new T.BoxGeometry(2.4, 0.15, 6.4), new T.MeshStandardMaterial({ color: 0x8a6a4a, roughness: 0.8 })); deck.position.y = 1.15; g.add(deck);
  const cab = new T.Mesh(new T.BoxGeometry(1.9, 1.6, 2.2), new T.MeshStandardMaterial({ color: 0xe8e4da, roughness: 0.7 })); cab.position.set(0, 2, 0.9); g.add(cab);
  const win = new T.Mesh(new T.PlaneGeometry(1.4, 0.5), new T.MeshStandardMaterial({ color: 0x332a10, emissive: 0xffc860, emissiveIntensity: 1.4 })); win.position.set(0, 2.3, -0.21); win.rotation.y = Math.PI; g.add(win);
  const mast = new T.Mesh(new T.CylinderGeometry(0.07, 0.09, 6, 6), new T.MeshStandardMaterial({ color: 0x5a4a3a })); mast.position.set(0, 4, -1.2); g.add(mast);
  const boom = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 3, 6), mast.material); boom.rotation.x = Math.PI / 2; boom.position.set(0, 2.2, -2.4); g.add(boom);
  const lampM = new T.MeshStandardMaterial({ color: 0xffe0a0, emissive: 0xffd080, emissiveIntensity: 3 }), lamp = new T.Mesh(new T.SphereGeometry(0.18, 8, 6), lampM); lamp.position.set(0, 7.1, -1.2); g.add(lamp);
  const halo = new T.Sprite(new T.SpriteMaterial({ map: glow, color: 0xffd890, transparent: true, depthWrite: false, blending: T.AdditiveBlending })); halo.scale.set(9, 9, 1); halo.position.copy(lamp.position); g.add(halo);
  g.traverse(o => { if (o.isMesh) o.castShadow = false; });
  g.userData = { lamp, halo, lampM }; g.scale.setScalar(1.4);
  return g;
}
function buildRock(T, R, r) {
  const geo = new T.IcosahedronGeometry(1, 2), p = geo.attributes.position, seed = R() * 100;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), n = 1 + 0.28 * Math.sin(x * 3.1 + seed) * Math.cos(z * 2.7 + seed) + 0.14 * Math.sin(y * 5 + seed * 2); p.setXYZ(i, x * n, y * n * (0.55 + R() * 0.15), z * n); }
  geo.computeVertexNormals();
  const g = new T.Group(), m = new T.Mesh(geo, new T.MeshStandardMaterial({ color: 0x3a3a3c, roughness: 0.95, flatShading: true })); m.scale.set(r, r * 0.9, r); m.position.y = r * 0.12; m.rotation.y = R() * TAU; g.add(m);
  for (let i = 0; i < 3; i++) { const p2 = m.clone(); p2.scale.set(r * (0.35 + R() * 0.3), r * (0.4 + R() * 0.4), r * (0.35 + R() * 0.3)); const a = R() * TAU; p2.position.set(Math.cos(a) * r * 0.8, 0, Math.sin(a) * r * 0.8); g.add(p2); }
  const foamM = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, depthWrite: false, side: T.DoubleSide, map: (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 16; const x2 = c.getContext('2d'); for (let i = 0; i < 400; i++) { x2.fillStyle = `rgba(255,255,255,${Math.random() * 0.9})`; x2.fillRect(Math.random() * 256, Math.random() * 16, 2 + Math.random() * 6, 1 + Math.random() * 3); } const t = new T.CanvasTexture(c); t.wrapS = T.RepeatWrapping; return t; })() });
  const foam = new T.Mesh(new T.RingGeometry(r * 0.95, r * 1.6, 40, 1), foamM); foam.rotation.x = -Math.PI / 2; foam.position.y = 0.15; foam.renderOrder = 5; g.add(foam);
  g.userData = { foam, foamM, rock: m };
  return g;
}
function buildWorld() {
  if (V3) return V3; const T = THREE; if (!W3 || !W3.init({ canvas: $('gl'), fov: 55, far: 5000, near: 0.1 })) { V3 = { none: true }; return V3; }
  const S = W3.scene, R0 = W3.rng(11), glow = glowTex();
  const sea = W3.water({ size: 8000, color: 0x082a36, distort: 2.6, ripple: 1.2, speed: 0.7 });
  // the headland and the coast; the harbour basin is cut into it later (per level, its side changes)
  const land = W3.terrain({ size: 1400, seg: 220, x: 0, z: 500, height: (x, z) => landH(x, z, 50), colour: (x, z, h, sl) => sl > 0.45 ? [0.24, 0.23, 0.22] : h < 2 ? [0.42, 0.38, 0.3] : [0.16 + h * 0.002, 0.24, 0.12] });
  // the lighthouse: tower under you, the gallery floor and railing round you, the lantern's frame above
  const white = new T.MeshStandardMaterial({ color: 0xe8e6e0, roughness: 0.7 }), red = new T.MeshStandardMaterial({ color: 0x9a2a22, roughness: 0.6 }), iron = new T.MeshStandardMaterial({ color: 0x1a1c1e, metalness: 0.7, roughness: 0.45 });
  for (let i = 0; i < 4; i++) { const seg = new T.Mesh(new T.CylinderGeometry(3.2 - i * 0.25 - 0.25, 3.2 - i * 0.25, 4.6, 32), i % 2 ? red : white); seg.position.set(0, 18 + 2.3 + i * 4.6, 0); S.add(seg); }
  const floor = new T.Mesh(new T.CylinderGeometry(3.3, 3.3, 0.2, 40), iron); floor.position.set(0, 36.9, 0); S.add(floor);
  const rail = new T.Mesh(new T.TorusGeometry(3.2, 0.05, 6, 64), iron); rail.rotation.x = Math.PI / 2; rail.position.set(0, 38.0, 0); S.add(rail);
  const rail2 = rail.clone(); rail2.position.y = 37.45; S.add(rail2);
  for (let i = 0; i < 36; i++) { const a = i / 36 * TAU, p = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, 1.1, 6), iron); p.position.set(Math.sin(a) * 3.2, 37.5, Math.cos(a) * 3.2); S.add(p); }
  const keep = new T.Mesh(new T.CylinderGeometry(1.7, 1.7, 0.4, 24), red); keep.position.set(0, 42.2, 0); S.add(keep);
  // the village and the harbour pieces (placed per level)
  const harbour = new T.Group(); S.add(harbour);
  const stone = new T.MeshStandardMaterial({ color: 0x5a5852, roughness: 0.95 });
  const armA = new T.Mesh(new T.BoxGeometry(5, 3, 22), stone), armB = armA.clone(); harbour.add(armA, armB);
  const mkLight = (col) => { const g = new T.Group(); const post = new T.Mesh(new T.CylinderGeometry(0.4, 0.5, 4, 8), white); post.position.y = 2; const l = new T.Mesh(new T.SphereGeometry(0.5, 10, 8), new T.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 4 })); l.position.y = 4.4; const h = new T.Sprite(new T.SpriteMaterial({ map: glow, color: col, transparent: true, depthWrite: false, blending: T.AdditiveBlending })); h.scale.set(16, 16, 1); h.position.y = 4.4; g.add(post, l, h); return g; };
  const redL = mkLight(0xff3020), greenL = mkLight(0x30ff60); harbour.add(redL, greenL);
  const houses = new T.Group(); harbour.add(houses);
  for (let i = 0; i < 22; i++) { const w = 5 + R0() * 4, h = 4 + R0() * 4, d = 5 + R0() * 3, hs = new T.Mesh(new T.BoxGeometry(w, h, d), new T.MeshStandardMaterial({ color: new T.Color().setHSL(0.08 + R0() * 0.1, 0.2, 0.55 + R0() * 0.3), roughness: 0.9 })); const roof = new T.Mesh(new T.CylinderGeometry(0.01, w * 0.75, 2.5, 4), new T.MeshStandardMaterial({ color: 0x3a2a26, roughness: 0.8 })); roof.rotation.y = Math.PI / 4; roof.position.y = h / 2 + 1.25; hs.add(roof);
    for (let j = 0; j < 2; j++) { const wn = new T.Mesh(new T.PlaneGeometry(0.9, 0.9), new T.MeshStandardMaterial({ color: 0x221a08, emissive: R0() < 0.7 ? 0xffc060 : 0x000000, emissiveIntensity: 1.6 })); wn.position.set((j - 0.5) * w * 0.5, 0.3, -d / 2 - 0.02); wn.rotation.y = Math.PI; hs.add(wn); }
    hs.userData = { u: R0(), v: R0(), h }; houses.add(hs); }
  // the beam: a long soft cone from the lamp to the pool of light on the water, and the pool itself
  const beamM = new T.ShaderMaterial({ transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide, uniforms: { col: { value: new T.Color(0xfff2c8) }, k: { value: 0.22 } },
    vertexShader: 'varying float vu; void main(){ vu = uv.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 col; uniform float k; varying float vu; void main(){ float a = k * (0.35 + 0.65 * vu) * smoothstep(0.0, 0.12, 1.0 - vu) * smoothstep(0.0, 0.08, vu); gl_FragColor = vec4(col * a, a); }' });
  const beamG = new T.CylinderGeometry(0.03, 1, 1, 32, 1, true); beamG.translate(0, -0.5, 0); beamG.rotateX(-Math.PI / 2);
  const beam = new T.Mesh(beamG, beamM); beam.frustumCulled = false; beam.renderOrder = 11; beam.position.set(0, LAMP_Y, 0); S.add(beam);
  const pool = new T.Mesh(new T.CircleGeometry(1, 48), new T.MeshBasicMaterial({ map: glow, color: 0xfff0c0, transparent: true, opacity: 0.85, depthWrite: false, blending: T.AdditiveBlending })); pool.rotation.x = -Math.PI / 2; pool.position.y = 0.4; pool.renderOrder = 10; S.add(pool);
  const spotL = new T.PointLight(0xfff0d0, 900, 70, 1.6); S.add(spotL);
  const lampGlow = new T.Sprite(new T.SpriteMaterial({ map: glow, color: 0xfff2c0, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0.5 })); lampGlow.scale.set(6, 6, 1); lampGlow.position.set(0, LAMP_Y + 0.4, 0); S.add(lampGlow);
  V3 = { T, S, R0, glow, sea, land, harbour, armA, armB, redL, greenL, houses, beam, pool, spotL, boats: new Map(), rocks: [], rockKey: null, wrecks: [], cam: { a: 0, D: 150 } };
  W3.setQuality(stepN); return V3;
}
// the land: a headland under the lighthouse, cliffs along the coast, the sea floor beyond; the harbour is a bay at x = hx
let HX = 50;
function landH(x, z, hx) {
  const y = -z, coast = COAST + Math.sin(x * 0.05) * 3 + Math.sin(x * 0.013) * 6;
  let h = y < coast ? 16 + Math.min(10, (coast - y) * 0.4) - Math.max(0, Math.abs(x) - 150) * 0.05 : -6 - (y - coast) * 0.3;
  if (y < coast + 3 && y > coast - 6) h = Math.min(h, 4 + (coast - y) * 2.2);
  const bx = Math.abs(x - hx); if (bx < 26 && y < coast + 2 && y > coast - 34) h = Math.min(h, bx < 18 && y > coast - 22 ? -4 : 2 + Math.max(0, bx - 18) * 0.8);
  if (bx < 60 && y < coast - 20 && y > coast - 70) h = Math.min(h, 3 + (coast - 20 - y) * 0.05);
  return h;
}
function setWeather(G) {
  const V = buildWorld(); if (V.none || V.sky === G.weather + G.hx) return; V.sky = G.weather + G.hx;
  W3.setSky(G.weather, { azim: 160 }); if (G.weather !== 'night') W3.S.exposure *= 0.55;
  W3.S.onBolt = () => { if (!HEADLESS && sfx.thunder) setTimeout(() => sfx.thunder(), 300 + Math.random() * 900); };
  // the harbour on this level's side: rebuild the land with its bay
  if (V.hx !== G.hx) { V.hx = G.hx; V.S.remove(V.land); V.land.geometry.dispose(); V.land = W3.terrain({ size: 1400, seg: 220, x: 0, z: 500, height: (x, z) => landH(x, z, G.hx), colour: (x, z, h, sl) => sl > 0.45 ? [0.24, 0.23, 0.22] : h < 2.5 ? [0.36, 0.33, 0.28] : [0.15 + h * 0.002, 0.23, 0.12] });
    const c = COAST + Math.sin(G.hx * 0.05) * 3 + Math.sin(G.hx * 0.013) * 6; V.armA.position.set(G.hx - MOUTH_W - 2.5, 1.2, -(c + 2)); V.armB.position.set(G.hx + MOUTH_W + 2.5, 1.2, -(c + 2));
    V.redL.position.set(G.hx - MOUTH_W - 1.5, 2.6, -(c + 12)); V.greenL.position.set(G.hx + MOUTH_W + 1.5, 2.6, -(c + 12));
    V.houses.children.forEach((h2, i) => { const u = h2.userData, side = i % 2 ? 1 : -1, x = G.hx + side * (22 + u.u * 34), z = -(c - 24 - u.v * 40); h2.position.set(x, landH(x, z, G.hx) + u.h / 2 - 0.5, z); h2.rotation.y = (u.u - 0.5) * 0.6; }); }
}
function onEvent(G, e) {
  const cx = W / 2, cy = H * 0.3;
  switch (e.k) {
    case 'boat': sfx.distant(); break;
    case 'sees': sfx.horn(); vibe(HAP.tick); say('SHE SEES YOU!', cx, cy, '#ffe08a', 22); tip('lead', 'Now lead her slowly to the harbour lights', 2.6); break;
    case 'lostlight': sfx.lostl(); say('SHE LOST YOUR LIGHT', cx, cy, '#ffd0c4', 20); tip('slow', 'Move the light slowly: a boat follows only at a boat\'s pace', 3); break;
    case 'harbour': sfx.bell(); break;
    case 'home': sfx.home(e.n); FX.flash = 0.3; vibe(HAP.best); say(`${e.name.toUpperCase()} IS HOME`, cx, cy, '#9be3b5', 24); if (e.n > 1) say(`${e.n} SAFE IN A ROW`, cx, cy + 30 * k, '#ffe08a', 17); break;
    case 'wreck': sfx.wreck(); FX.red = 0.6; FX.shake = 8; vibe(HAP.thud); say(e.why === 'rock' ? `${e.name.toUpperCase()} HIT THE ROCKS` : `${e.name.toUpperCase()} RAN ASHORE`, cx, cy, '#ffb4a8', 22); tip('wreck', 'Boats you are not lighting drift on to the rocks: go back for them in time', 3); if (V3 && !V3.none) V3.wrecks.push({ x: e.x, y: e.y, t: 0 }); break;
    case 'bump': sfx.bump(); FX.shake = 4; say('MIND THE ROCKS!', cx, cy, '#ffd0c4', 20); break;
    case 'lessonnext': if (e.first) hint = null; say(e.first ? 'FIRST, A LESSON' : 'NEXT LESSON', cx, H * 0.5, '#ffd36a', 26); sfx.ding(); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, cx, H * 0.5, '#9be3b5', 26); sfx.coin(e.n); break;
    case 'lessonmiss': hint = { txt: e.how, t: 0, secs: 3.6 }; break;
    case 'lessondone': say('THE LIGHT IS YOURS!', cx, H * 0.5, '#ffd36a', 26); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); vibe(HAP.best); break;
    case 'lost': sfx.lose(); break;
  }
}
const VW = new (window.THREE ? THREE.Vector3 : Object)();
function seaScreen(x, y, h = 0) { if (!V3 || V3.none) return { x: W / 2, y: H / 2, front: true }; W3.cam.updateMatrixWorld(); VW.set(x, h, -y); return W3.screen(VW); }
// where on the sea a point of the screen is (for the thumb)
function seaAt(sx, sy) { if (!V3 || V3.none) return null; const T = THREE, cam = W3.cam; cam.updateMatrixWorld(); const v = new T.Vector3(sx / innerWidth * 2 - 1, -(sy / innerHeight) * 2 + 1, 0.5).unproject(cam).sub(cam.position).normalize(); if (v.y >= -0.01) return { x: cam.position.x + v.x * 600, y: -(cam.position.z + v.z * 600), far: true }; const t = -cam.position.y / v.y; return { x: cam.position.x + v.x * t, y: -(cam.position.z + v.z * t) }; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#0b1220'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D sea.', W / 2, H / 2); return; }
  const T = V.T, g = G || idleG(), t = now; setWeather(g); const c = g.cfg;
  // rocks: rebuilt when the set changes
  const key = g.rocks.map(q => q.x.toFixed(0) + q.y.toFixed(0)).join('|');
  if (V.rockKey !== key) { V.rockKey = key; V.rocks.forEach(m => V.S.remove(m)); V.rocks = g.rocks.map(q => { const m = buildRock(T, W3.rng((q.x * 13 + q.y * 7) | 0), q.r); m.position.set(q.x, 0, -q.y); V.S.add(m); return m; }); }
  V.rocks.forEach((m, i) => { const q = g.rocks[i]; if (!q) return; m.userData.foamM.opacity = 0.12 + 0.75 * q.seen; m.userData.foamM.map.offset.x = t * 0.03 + i; m.userData.foam.scale.setScalar(1 + Math.sin(t * 1.3 + i) * 0.06); });
  // boats
  const seen = new Set();
  for (const b of g.boats) { let m = V.boats.get(b.id); if (!m) { m = buildBoat(T, W3.rng(b.id * 17 + g.seed), V.glow); V.boats.set(b.id, m); V.S.add(m); } seen.add(b.id);
    m.position.set(b.x, Math.sin(t * 1.4 + b.id) * 0.35, -b.y); m.rotation.set(Math.sin(t * 1.1 + b.id) * 0.06, -b.h + Math.PI, Math.sin(t * 0.9 + b.id * 2) * 0.12);
    { const far = clamp(Math.hypot(b.x, b.y) / 50, 1, 2.6); m.scale.setScalar(1.4 * far); }      /* far boats are drawn bigger: they were specks */
    const u = m.userData, blink = b.blink > 0 ? (Math.sin(b.blink * 30) > 0 ? 3 : 0.4) : 1; u.lampM.emissiveIntensity = 3 * blink; u.halo.material.opacity = Math.min(1, 0.7 * blink); u.halo.material.color.setHex(b.mode === 'follow' || b.mode === 'home' ? 0xc8ffd8 : 0xffd890); }
  for (const [id, m] of V.boats) if (!seen.has(id)) { V.S.remove(m); V.boats.delete(id); }
  // the beam, the pool of light, the light on the boats and rocks
  const S2 = g.S, az = Math.atan2(S2.x, S2.y), dist = Math.hypot(S2.x, S2.y), spot = c.spot;
  const bx = S2.x, bz = -S2.y, by = 0, L = Math.hypot(bx, LAMP_Y - by, bz);
  V.beam.scale.set(spot * 0.9, spot * 0.75, L); V.beam.lookAt(bx, by, bz); V.beam.material.uniforms.k.value = W3.S.night ? 0.2 : 0.09;
  V.pool.position.set(bx, 0.4, bz); V.pool.scale.set(spot * 1.25, spot * 1.25, 1); V.pool.material.opacity = W3.S.night ? 0.8 : 0.45;
  V.spotL.position.set(bx, 22, bz);
  // the camera: on the gallery, turning with the beam, looking out (further when the light is far)
  const C = V.cam, ease = 1 - Math.exp(-dt * 1.6); let da = az - C.a; C.a += da * ease; C.D += (clamp(dist * 1.15, 70, 118) - C.D) * ease;      /* 22 Nov 2026: looks down more, so the sea fills the screen (a quarter of it was black sky) */
  const cam = W3.cam; cam.fov = 55; cam.updateProjectionMatrix(); cam.position.set(Math.sin(C.a) * 3.0, CAM_Y, -Math.cos(C.a) * 3.0); cam.lookAt(Math.sin(C.a) * C.D, 0, -Math.cos(C.a) * C.D);
  if (FX.shake > 0) cam.rotation.z += (Math.random() - 0.5) * FX.shake * 0.002;
  W3.setFocus(bx * 0.5, 0, bz * 0.5, 120);
  W3.render(dt);
  if (G) hud(G, t);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 1.2 ? 1 : 1 - (t2.t - 1.2) / 0.4; ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(t2.size * k)}px ${BC}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 20); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 20); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(15 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 19 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30;
    ctx.fillStyle = 'rgba(0,0,0,.66)'; rrect(W / 2 - w / 2, H * 0.62 - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.62 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,60,40,${FX.red * 0.18})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,248,230,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); }
}
let IG = null; function idleG() { if (!IG) { IG = newGame(Math.max(4, store.get('level', 1) | 0), { seed: 5 }); for (let i = 0; i < 2; i++) newBoat(IG); IG.boats.forEach(b => b.y -= 60); } IG.t += 1 / 60; const a = IG.t * 0.15; IG.S.x = Math.sin(a) * 120; IG.S.y = 140 + Math.cos(a * 1.3) * 40; IG.boats.forEach(b => { b.h += 0.002; }); return IG; }
function hud(G, t) {
  const c = G.cfg;
  if (G.lesson) lessonPanel(G);
  const ty = G.lesson ? H * 0.25 : 44 * k;
  if (!G.lesson) { ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; ctx.fillStyle = '#fff'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.6)'; const s = `${G.home} / ${c.boats} boats home`; ctx.strokeText(s, 14, ty); ctx.fillText(s, 14, ty);
    for (let i = 0; i < c.lives; i++) { const x = W - 22 - i * 22 * k, y = ty + 8 * k; ctx.lineWidth = 4 * k; ctx.strokeStyle = i < G.lives ? '#ff6a4a' : 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.arc(x, y, 7 * k, 0, TAU); ctx.stroke(); if (i < G.lives) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 4 * k; for (let q = 0; q < 4; q++) { ctx.beginPath(); ctx.arc(x, y, 7 * k, q * Math.PI / 2 + 0.3, q * Math.PI / 2 + 0.75); ctx.stroke(); } } } }
  // each boat: a ring at its lamp (amber: lost, green: following you), the light filling as it notices you; arrows to boats off the screen
  for (const b of G.boats) { const p = seaScreen(b.x, b.y, 7), fol = b.mode === 'follow' || b.mode === 'home', dang = !fol && danger(G, b) < 12;
    const on = p.front && p.x > 10 && p.x < W - 10 && p.y > 60 && p.y < H - 30;
    if (on) { ctx.lineWidth = 2.5 * k; ctx.strokeStyle = fol ? 'rgba(140,255,170,.8)' : dang && Math.sin(t * 8) > 0 ? 'rgba(255,90,70,.9)' : 'rgba(255,210,120,.55)'; ctx.beginPath(); ctx.arc(p.x, p.y, 14 * k, 0, TAU); ctx.stroke();
      if (!fol && b.seen > 0) { ctx.strokeStyle = '#fff2c0'; ctx.lineWidth = 4 * k; ctx.beginPath(); ctx.arc(p.x, p.y, 19 * k, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(b.seen / c.notice, 0, 1)); ctx.stroke(); } }
    else { // an arrow at the edge, pointing towards it
      const cxp = W / 2, cyp = H / 2; let ax = p.x - cxp, ay = p.y - cyp; if (!p.front) { ax = -ax; ay = -ay; } const s2 = Math.min((W / 2 - 26) / Math.abs(ax || 1e-3), (H / 2 - 90) / Math.abs(ay || 1e-3)); const ex = cxp + ax * s2, ey = cyp + ay * s2, an = Math.atan2(ay, ax);
      ctx.save(); ctx.translate(ex, ey); ctx.rotate(an); ctx.fillStyle = fol ? 'rgba(140,255,170,.9)' : dang && Math.sin(t * 8) > 0 ? '#ff5a46' : 'rgba(255,210,120,.85)'; ctx.beginPath(); ctx.moveTo(12 * k, 0); ctx.lineTo(-6 * k, -8 * k); ctx.lineTo(-6 * k, 8 * k); ctx.closePath(); ctx.fill(); ctx.restore(); } }
  // the harbour mouth, named for the first levels
  if (G.N <= 3) { const p = seaScreen(G.hx, COAST + 12, 6); if (p.front && p.x > 0 && p.x < W) { ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillText('HARBOUR', p.x, p.y - 22 * k); } }
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
