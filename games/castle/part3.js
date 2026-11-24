// ===================== THE VIEW: Castle Siege in 3D (three.js through tools/world3d.js) =====================
// A green valley seen from above your castle walls: the dirt road winds out of the dark forest to your gate; stone pads either
// side of it; your towers on them (they grow with each upgrade); the enemy marching, flying and floating down the road; arrows,
// stones, bolts of magic, frost; the meteor falling from the sky. Weather and light change from level to level.
// Game (x, z) is three.js (x, y, z); the camera looks from the castle (bottom of the screen) up the valley to the forest.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [];
let hint = null, V3 = null;
const ui = { sel: -1, aim: false, btns: [], flash: {} };
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 2.8) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function fxStep(dt) {
  FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 1.8);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.3) TXT.shift();
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; }
}
const ICON = { archer: '🏹', cat: '🪨', mage: '🔮', frost: '❄️' }, FICON = { goblin: '👺', soldier: '🗡️', knight: '🛡️', bat: '🦇', ogre: '👹', shaman: '🧙', ghost: '👻', ram: '🪵', dragon: '🐉', giant: '🗿' };
function buildWorld() {
  if (V3) return V3; const T = THREE; if (!W3 || !W3.init({ canvas: $('gl'), fov: 34, far: 1500, near: 0.5 })) { V3 = { none: true }; return V3; }
  const S = W3.scene, R0 = W3.rng(9);
  // the valley: grass, the dirt road worn into it, hills rising at the sides and behind the forest
  const hill = (x, z) => { const side = Math.max(0, Math.abs(x) - 14) * 0.35, back = Math.max(0, -z - 30) * 0.3; return side + back + Math.sin(x * 0.3) * Math.cos(z * 0.25) * 0.25; };
  const land = W3.terrain({ size: 200, seg: 120, x: 0, z: 0, height: hill, colour: () => [0.3, 0.45, 0.18], map: W3.grainTex(256, 7, 210, 45, 4) });
  // the forest the enemy comes out of, and trees along the hills
  const trees = []; const R = W3.rng(4);
  for (let i = 0; i < 170; i++) { const x = (R() - 0.5) * 60, z = -28.5 - R() * 30; trees.push({ x, z, y: hill(x, z) - 0.2, s: 0.55 + R() * 0.4, hue: R(), shade: R() }); }
  for (let i = 0; i < 90; i++) { const sd = R() < 0.5 ? -1 : 1, x = sd * (14.5 + R() * 20), z = -30 + R() * 56; trees.push({ x, z, y: hill(x, z) - 0.2, s: 0.5 + R() * 0.45, hue: R(), shade: R() }); }
  const treeM = W3.pines(trees, { layers: 3, shadow: false });
  // rocks and bushes for life
  { const rk = new T.InstancedMesh(new T.DodecahedronGeometry(0.5, 0), new T.MeshStandardMaterial({ color: 0x8a8a84, roughness: 0.9, flatShading: true }), 40), d = new T.Object3D(); let n = 0;
    for (let i = 0; i < 400 && n < 40; i++) { const x = (R() < 0.5 ? -1 : 1) * (12.4 + R() * 4), z = -26 + R() * 46; d.position.set(x, 0.1, z); d.rotation.set(R() * 3, R() * 3, R() * 3); d.scale.set(0.5 + R(), 0.4 + R() * 0.5, 0.5 + R()); d.updateMatrix(); rk.setMatrixAt(n++, d.matrix); }
    rk.count = n; rk.castShadow = rk.receiveShadow = true; S.add(rk); }
  { const bu = new T.InstancedMesh(new T.IcosahedronGeometry(0.6, 1), new T.MeshStandardMaterial({ color: 0x3f6a2a, roughness: 0.95, flatShading: true }), 50), d = new T.Object3D(), c = new T.Color(); let n = 0;
    for (let i = 0; i < 400 && n < 50; i++) { const x = (R() < 0.5 ? -1 : 1) * (12.4 + R() * 5), z = -26 + R() * 46; d.position.set(x, 0.2, z); d.scale.setScalar(0.5 + R() * 0.8); d.scale.y *= 0.7; d.updateMatrix(); bu.setMatrixAt(n, d.matrix); bu.setColorAt(n++, c.setHSL(0.25 + R() * 0.06, 0.45, 0.22 + R() * 0.1)); }
    bu.count = n; bu.castShadow = true; S.add(bu); }
  // your castle: the wall across the valley's foot, round towers, the gate where the road ends, banners
  const stoneT = W3.grainTex(256, 31, 175, 40, 3); stoneT.repeat.set(6, 1); const stoneM = new T.MeshStandardMaterial({ color: 0xb8b0a0, roughness: 0.92, map: stoneT }), roofM = new T.MeshStandardMaterial({ color: 0x3a4a7a, roughness: 0.6 });
  const castle = new T.Group(); S.add(castle);
  for (const [x0, x1] of [[-16, -1.6], [1.6, 16]]) { const w = new T.Mesh(new T.BoxGeometry(x1 - x0, 3.4, 1.4), stoneM); w.position.set((x0 + x1) / 2, 1.7, 23); castle.add(w); for (let x = x0 + 0.4; x < x1; x += 1.0) { const m = new T.Mesh(new T.BoxGeometry(0.5, 0.5, 1.4), stoneM); m.position.set(x, 3.65, 23); castle.add(m); } }
  for (const x of [-2.4, 2.4, -9, 9]) { const tw = new T.Mesh(new T.CylinderGeometry(1.25, 1.4, 5.2, 16), stoneM); tw.position.set(x, 2.6, 23); castle.add(tw); const cone = new T.Mesh(new T.ConeGeometry(1.55, 2.2, 16), roofM); cone.position.set(x, 6.3, 23); castle.add(cone);
    const fl = new T.Mesh(new T.PlaneGeometry(0.9, 0.5), new T.MeshStandardMaterial({ color: 0xc8282a, side: T.DoubleSide, roughness: 0.7 })); fl.position.set(x + 0.45, 7.6, 23); castle.add(fl); const pole = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 1.3, 5), roofM); pole.position.set(x, 7.5, 23); castle.add(pole); (castle.userData.flags = castle.userData.flags || []).push(fl); }
  const gateM = new T.MeshStandardMaterial({ color: 0x5a3a22, roughness: 0.85, map: W3.grainTex(128, 12, 150, 50, 6) });
  const gate = new T.Mesh(new T.BoxGeometry(3.2, 2.8, 0.3), gateM); gate.position.set(0, 1.4, 22.4); castle.add(gate); const arch = new T.Mesh(new T.BoxGeometry(3.6, 0.8, 1.4), stoneM); arch.position.set(0, 3.2, 23); castle.add(arch);
  castle.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  // the stone pads
  const padM = new T.MeshStandardMaterial({ color: 0x9a948a, roughness: 0.9, map: W3.grainTex(128, 19, 180, 40, 6) }), pads = GRID.map(() => { const p = new T.Mesh(new T.CylinderGeometry(1.15, 1.3, 0.3, 20), padM); p.receiveShadow = true; p.visible = false; S.add(p); return p; });
  // the range ring and the selected-pad glow
  const ring = new T.Mesh(new T.RingGeometry(0.96, 1, 64), new T.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.6, depthWrite: false, side: T.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.visible = false; ring.renderOrder = 3; S.add(ring);
  const disc = new T.Mesh(new T.CircleGeometry(1, 48), new T.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.1, depthWrite: false })); disc.rotation.x = -Math.PI / 2; disc.visible = false; disc.renderOrder = 2; S.add(disc);
  const glowT = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new T.CanvasTexture(c); })();
  const glow = (col, s, op = 0.8) => { const sp = new T.Sprite(new T.SpriteMaterial({ map: glowT, color: col, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: op })); sp.scale.set(s, s, 1); return sp; };
  V3 = { T, S, pads, land, hill, trees, treeM, ring, disc, castle, gate, glow, road: -1, towers: [], foes: new Map(), shots: [], booms: [], meteorL: new T.PointLight(0xff8040, 0, 22, 1.4), puffs: [] };
  S.add(V3.meteorL);
  W3.setQuality(stepN); return V3;
}
// ---------- the towers: one model per kind, taller and grander with each rank ----------
function towerModel(kind, lv) {
  const T = THREE, g = new T.Group(), wood = new T.MeshStandardMaterial({ color: 0x7a5232, roughness: 0.85 }), stone = new T.MeshStandardMaterial({ color: 0xc2bab0, roughness: 0.9 }), dark = new T.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.6 });
  const h = 2.6 + lv * 0.7, trim = [0xb0b0b8, 0xd8b048, 0xffe080][lv];
  if (kind === 'archer') { for (const [x, z] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]) { const p = new T.Mesh(new T.BoxGeometry(0.16, h, 0.16), wood); p.position.set(x, h / 2, z); g.add(p); }
    const fl = new T.Mesh(new T.BoxGeometry(1.6, 0.18, 1.6), wood); fl.position.y = h; g.add(fl); const rail = new T.Mesh(new T.BoxGeometry(1.6, 0.4, 1.6), new T.MeshStandardMaterial({ color: 0x8a6240, roughness: 0.85, transparent: true, opacity: 0.95 })); rail.position.y = h + 0.3; rail.scale.set(1, 1, 1); g.add(rail);
    const roof = new T.Mesh(new T.ConeGeometry(1.25, 1.1, 4), new T.MeshStandardMaterial({ color: [0x6a3a22, 0x2a6a3a, 0x2a4a8a][lv], roughness: 0.7 })); roof.rotation.y = Math.PI / 4; roof.position.y = h + 1.3; g.add(roof);
    const bow = new T.Group(); const body = new T.Mesh(new T.CylinderGeometry(0.18, 0.22, 0.6, 8), new T.MeshStandardMaterial({ color: 0x3a6a3a })); body.position.y = h + 0.5; const hd = new T.Mesh(new T.SphereGeometry(0.15, 10, 8), new T.MeshStandardMaterial({ color: 0xe0b090 })); hd.position.y = h + 0.92; bow.add(body, hd); g.add(bow); g.userData.turn = bow; }
  if (kind === 'cat') { const base = new T.Mesh(new T.BoxGeometry(1.8, 0.5 + lv * 0.2, 1.8), stone); base.position.y = 0.25 + lv * 0.1; g.add(base); const top = 0.5 + lv * 0.2;
    const frame = new T.Group(); frame.position.y = top; for (const x of [-0.5, 0.5]) { const s = new T.Mesh(new T.BoxGeometry(0.14, 0.9, 1.2), wood); s.position.set(x, 0.45, 0); frame.add(s); }
    const axle = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 1.1, 8), dark); axle.rotation.z = Math.PI / 2; axle.position.y = 0.6; frame.add(axle);
    const arm = new T.Group(); arm.position.y = 0.6; const beam = new T.Mesh(new T.BoxGeometry(0.14, 0.14, 2.0 + lv * 0.3), wood); beam.position.z = -0.5; arm.add(beam); const cup = new T.Mesh(new T.SphereGeometry(0.22, 10, 6, 0, TAU, 0, Math.PI / 2), dark); cup.rotation.x = Math.PI; cup.position.set(0, 0.1, -1.5 - lv * 0.15); arm.add(cup); frame.add(arm);
    const cw = new T.Mesh(new T.BoxGeometry(0.4, 0.4, 0.4), dark); cw.position.set(0, 0.6, 0.6); frame.add(cw); g.add(frame); g.userData.turn = frame; g.userData.arm = arm; }
  if (kind === 'mage') { const t = new T.Mesh(new T.CylinderGeometry(0.55, 0.85, h, 12), stone); t.position.y = h / 2; g.add(t); const roof = new T.Mesh(new T.ConeGeometry(0.8, 1.6 + lv * 0.3, 12), new T.MeshStandardMaterial({ color: [0x4a2a8a, 0x6a2aaa, 0x8a3ad0][lv], roughness: 0.5 })); roof.position.y = h + 0.8; g.add(roof);
    const orb = new T.Mesh(new T.SphereGeometry(0.28 + lv * 0.06, 16, 12), new T.MeshStandardMaterial({ color: 0xb080ff, emissive: 0x9a50ff, emissiveIntensity: 2.5 })); orb.position.y = h + 2.0 + lv * 0.3; g.add(orb); const gl = V3.glow(0xb070ff, 2.4 + lv * 0.5); gl.position.copy(orb.position); g.add(gl); g.userData.orb = orb;
    for (let i = 0; i < 3; i++) { const w = new T.Mesh(new T.BoxGeometry(0.2, 0.36, 0.05), new T.MeshStandardMaterial({ color: 0xffd080, emissive: 0xffa040, emissiveIntensity: 1.5 })); const a = i * TAU / 3; w.position.set(Math.sin(a) * 0.62, h * 0.6, Math.cos(a) * 0.62); w.rotation.y = a; g.add(w); } }
  if (kind === 'frost') { const base = new T.Mesh(new T.CylinderGeometry(0.9, 1.0, 0.5, 6), stone); base.position.y = 0.25; g.add(base); const cm = new T.MeshStandardMaterial({ color: 0xbfe8ff, emissive: 0x4ab0ff, emissiveIntensity: 0.8, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.88 });
    const cr = new T.Group(); for (let i = 0; i < 3 + lv * 2; i++) { const c = new T.Mesh(new T.OctahedronGeometry(0.35 + (i === 0 ? 0.5 + lv * 0.2 : 0.1 * Math.random()), 0), cm); c.scale.y = 2.2; const a = i * 2.4; c.position.set(i ? Math.sin(a) * 0.5 : 0, 1.2 + (i ? 0 : lv * 0.3), i ? Math.cos(a) * 0.5 : 0); c.rotation.z = i ? Math.sin(a) * 0.3 : 0; cr.add(c); } g.add(cr); const gl = V3.glow(0x7fd0ff, 3 + lv, 0.5); gl.position.y = 1.4; g.add(gl); g.userData.spin = cr; }
  // the rank's trim: a band of gold for each upgrade
  for (let i = 0; i < lv; i++) { const b = new T.Mesh(new T.TorusGeometry(1.2 - i * 0.05, 0.06, 6, 24), new T.MeshStandardMaterial({ color: trim, metalness: 0.8, roughness: 0.3, emissive: trim, emissiveIntensity: 0.15 })); b.rotation.x = Math.PI / 2; b.position.y = 0.32 + i * 0.12; g.add(b); }
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g;
}
// ---------- the enemy ----------
const FSIZE = { goblin: 0.75, soldier: 1, knight: 1.05, bat: 0.8, ogre: 1.7, shaman: 1, ghost: 1.05, ram: 1.4, dragon: 2.6, giant: 2.8 };
function foeModel(kind) {
  const T = THREE, g = new T.Group(), M = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.75 }, o)), add = (geo, m, x, y, z) => { const o = new T.Mesh(geo, m); o.position.set(x, y, z); g.add(o); return o; };
  const skin = { goblin: 0x6aa040, soldier: 0xd8a888, knight: 0xd8a888, ogre: 0x8a9a50, shaman: 0x7a9a60, giant: 0x9a9088 }[kind];
  const body = { goblin: 0x5a4028, soldier: 0x8a2a2a, knight: 0xb8bcc8, ogre: 0x6a4a2a, shaman: 0x5a2a7a, giant: 0x6a6460 }[kind];
  if (kind === 'bat' || kind === 'dragon') { const col = kind === 'bat' ? 0x2a2230 : 0xa82a1a, m = M(col, { roughness: 0.6 }); add(new T.SphereGeometry(0.35, 12, 8), m, 0, 0, 0).scale.set(0.8, 0.7, 1.4); const hd = add(new T.SphereGeometry(0.22, 10, 8), m, 0, 0.12, -0.45);
    if (kind === 'dragon') { hd.scale.set(1, 0.9, 1.6); add(new T.ConeGeometry(0.12, 0.8, 8), m, 0, 0, 0.85).rotation.x = Math.PI / 2; for (const sx of [-0.1, 0.1]) add(new T.ConeGeometry(0.05, 0.25, 6), M(0xe8d8b0), sx, 0.3, -0.5); add(new T.SphereGeometry(0.05, 6, 4), M(0xffd040, { emissive: 0xffa000, emissiveIntensity: 2 }), 0.12, 0.18, -0.6); }
    const wm = M(kind === 'bat' ? 0x3a2a40 : 0x7a1a10, { side: T.DoubleSide, roughness: 0.7 }), wings = [];
    for (const s of [-1, 1]) { const w = new T.Group(); const sh = new T.Shape(); sh.moveTo(0, 0); sh.lineTo(1.1, 0.25); sh.lineTo(0.9, -0.15); sh.lineTo(0.55, -0.05); sh.lineTo(0.35, -0.3); sh.lineTo(0, -0.25); const geo = new T.ShapeGeometry(sh); const mesh = new T.Mesh(geo, wm); mesh.rotation.x = -Math.PI / 2; mesh.scale.x = s; w.add(mesh); w.position.x = s * 0.15; g.add(w); wings.push(w); }
    g.userData.wings = wings; g.userData.fly = kind === 'bat' ? 2.4 : 3.6; }
  else if (kind === 'ghost') { const m = M(0xd8eaff, { transparent: true, opacity: 0.55, emissive: 0x6a8aff, emissiveIntensity: 0.6, depthWrite: false }); add(new T.SphereGeometry(0.32, 14, 10), m, 0, 1.1, 0); add(new T.ConeGeometry(0.34, 0.9, 14, 1, true), m, 0, 0.6, 0).rotation.x = Math.PI; for (const sx of [-0.1, 0.1]) add(new T.SphereGeometry(0.05, 6, 4), M(0x000000), sx, 1.15, -0.28); g.userData.float = true; const gl = V3.glow(0x9ab8ff, 2, 0.4); gl.position.y = 0.9; g.add(gl); }
  else if (kind === 'ram') { const wood = M(0x6a4a2a), roof = M(0x4a3a2a); add(new T.BoxGeometry(1.2, 0.2, 2.2), wood, 0, 0.45, 0); for (const [x, z] of [[-0.65, 0.7], [0.65, 0.7], [-0.65, -0.7], [0.65, -0.7]]) add(new T.CylinderGeometry(0.3, 0.3, 0.12, 12), M(0x3a2a1a), x, 0.3, z).rotation.z = Math.PI / 2;
    const log = add(new T.CylinderGeometry(0.2, 0.2, 2.6, 10), M(0x8a6a4a), 0, 0.85, -0.3); log.rotation.x = Math.PI / 2; add(new T.SphereGeometry(0.24, 10, 8), M(0x555560, { metalness: 0.8, roughness: 0.4 }), 0, 0.85, -1.6); const r = add(new T.ConeGeometry(1.1, 0.9, 4), roof, 0, 1.5, 0); r.rotation.y = Math.PI / 4; r.scale.z = 1.5; }
  else { const bm = M(body, kind === 'knight' ? { metalness: 0.85, roughness: 0.3 } : {}), sm = M(skin);
    add(new T.CylinderGeometry(0.22, 0.28, 0.7, 10), bm, 0, 0.75, 0); const hd = add(new T.SphereGeometry(0.2, 12, 10), kind === 'knight' ? bm : sm, 0, 1.3, 0);
    const legs = []; for (const x of [-0.11, 0.11]) { const l = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 0.42, 6), M(0x2a2a2a)); l.geometry.translate(0, -0.21, 0); l.position.set(x, 0.42, 0); g.add(l); legs.push(l); } g.userData.legs = legs;
    if (kind === 'goblin') for (const s of [-1, 1]) add(new T.ConeGeometry(0.06, 0.26, 6), sm, s * 0.22, 1.35, 0).rotation.z = -s * 1.2;
    if (kind === 'soldier') { add(new T.CylinderGeometry(0.02, 0.02, 1.8, 5), M(0x6a5030), 0.3, 1.0, 0); add(new T.ConeGeometry(0.06, 0.2, 6), M(0xcccccc, { metalness: 0.8 }), 0.3, 1.95, 0); add(new T.SphereGeometry(0.21, 10, 6, 0, TAU, 0, Math.PI / 2), M(0x888890, { metalness: 0.7 }), 0, 1.33, 0); }
    if (kind === 'knight') { add(new T.BoxGeometry(0.06, 0.6, 0.45), M(0x2a4a9a), -0.3, 0.85, -0.05); add(new T.ConeGeometry(0.06, 0.3, 6), M(0xc82a2a), 0, 1.58, 0); }
    if (kind === 'shaman') { add(new T.ConeGeometry(0.4, 0.9, 10), bm, 0, 0.6, 0); add(new T.CylinderGeometry(0.025, 0.025, 1.6, 5), M(0x5a4030), 0.32, 0.9, 0); const o = add(new T.SphereGeometry(0.1, 10, 8), M(0x80ff80, { emissive: 0x40ff60, emissiveIntensity: 2 }), 0.32, 1.75, 0); const gl = V3.glow(0x80ff90, 1.2, 0.6); gl.position.copy(o.position); g.add(gl); }
    if (kind === 'ogre') { add(new T.CylinderGeometry(0.06, 0.12, 0.9, 6), M(0x5a4030), 0.35, 0.9, -0.1).rotation.x = 0.6; }
    if (kind === 'giant') { add(new T.BoxGeometry(0.7, 0.3, 0.4), M(0x7a7470), 0, 1.05, 0); } }
  g.scale.setScalar(FSIZE[kind] * 1.75);      /* 22 Nov 2026: goblins and towers a third bigger; they were specks */ g.traverse(o => { if (o.isMesh) o.castShadow = !!FOES[kind].boss || kind === 'ogre' || kind === 'ram'; }); return g;
}
// this siege's road: worn into the grass; its pads set out; the trees at the forest's edge opened where it comes out
function setRoadView(g) {
  setRoad(g.road); const V = V3; if (V.road === ROAD_ID) return; V.road = ROAD_ID;
  const geo = V.land.geometry, p = geo.attributes.position, col = geo.attributes.color, sx = ROAD[0][0];
  const rd = (x, z) => Math.min(roadDist(x, z), z < -25.5 && z > -40 ? Math.abs(x - sx) : 1e9);
  for (let i = 0; i < p.count; i++) { const x = p.getX(i) + V.land.position.x, z = p.getZ(i) + V.land.position.z, h = p.getY(i); if (Math.abs(x) > 40 || z < -45 || z > 35) { col.setXYZ(i, 0.26, 0.42, 0.16); continue; }
    const r = rd(x, z), n = Math.sin(x * 1.7 + z * 0.9) * 0.02 + Math.cos(x * 0.6 - z * 1.3) * 0.02; let c;
    if (r < 1.5) c = [0.55 + n, 0.42 + n, 0.27 + n]; else if (r < 2.0) { const u = (r - 1.5) / 0.5; c = [0.55 - 0.27 * u + n, 0.42 + 0.01 * u + n, 0.27 - 0.1 * u + n]; } else c = [0.28 + n + h * 0.01, 0.43 + n * 2 + h * 0.01, 0.17 + n];
    col.setXYZ(i, c[0], c[1], c[2]); }
  col.needsUpdate = true;
  const d = new THREE.Object3D(); V.trees.forEach((t, i) => { const gap = t.z > -40 && Math.abs(t.x - sx) < 2.6; d.position.set(t.x, t.y, t.z); d.rotation.set(0, t.rot || 0, 0); d.scale.setScalar(gap ? 0.0001 : t.s || 1); d.updateMatrix(); V.treeM.setMatrixAt(i, d.matrix); }); V.treeM.instanceMatrix.needsUpdate = true;
  V.pads.forEach(m => m.visible = false); PADS.forEach(([x, z], i) => { const m = V.pads[i]; m.visible = true; m.position.set(x, V.hill(x, z) + 0.12, z); });
  V.towers.forEach(m => m && V.S.remove(m)); V.towers = [];
}
function setWeather(G) {
  const V = buildWorld(); if (V.none || V.sky === G.weather) return; V.sky = G.weather;
  W3.setSky(G.weather, { azim: 150 }); W3.scene.environmentIntensity = 0.7;
  W3.S.onBolt = () => { if (!HEADLESS && sfx.thunder) setTimeout(() => sfx.thunder(), 300 + Math.random() * 900); };
}
// where a world point lands on the screen
const SV = new (window.THREE ? THREE.Vector3 : Object)();
function scr(x, y, z) { if (!V3 || V3.none) return { x: W / 2 + x * 12, y: H / 2 + z * 12 }; SV.set(x, y, z); return W3.screen(SV); }
let fallN = 0, fallT = 0;
function onEvent(G, e) {
  const cx = W / 2, cy = H * 0.42;
  switch (e.k) {
    case 'build': sfx.build(); vibe(HAP.light); FX.shake = 3; { const s = scr(PADS[e.pad][0], 2, PADS[e.pad][1]); say(TOWERS[e.kind].name.toUpperCase(), s.x, s.y - 30 * k, '#ffe08a', 18); } ui.flash[e.pad] = 0.4; puff(e.pad); break;
    case 'upgrade': sfx.upgrade(e.lv); vibe(HAP.light); { const s = scr(PADS[e.pad][0], 3, PADS[e.pad][1]); say(e.lv === 2 ? 'TOP RANK!' : 'UPGRADED!', s.x, s.y - 30 * k, '#ffe08a', 20); } ui.flash[e.pad] = 0.5; puff(e.pad); break;
    case 'sell': sfx.sell(); { const s = scr(PADS[e.pad][0], 1, PADS[e.pad][1]); say(`+${e.back}`, s.x, s.y - 20 * k, '#ffe08a', 18); } break;
    case 'poor': sfx.poor(); say(`NEED ${e.need} MORE GOLD`, cx, H * 0.3, '#ffb4a8', 18); break;
    case 'shot': if (e.kind === 'archer') sfx.twang(); else if (e.kind === 'cat') sfx.creak(); else if (e.kind === 'mage') sfx.zap(); break;
    case 'thud': sfx.thud(); FX.shake = Math.max(FX.shake, 2.5); dust(e.x, e.z, 0x9a8a6a, 1.6); break;
    case 'kill': if (G.t - fallT > 1.2) fallN = 0; fallT = G.t; sfx.fall(fallN++); if (!HEADLESS) { const s = scr(e.x, 1.4, e.z); say(`+${e.gold}`, s.x, s.y - 10 * k, '#ffd36a', 15); }
      if (e.boss) { sfx.boss(); FX.shake = 14; FX.flash = 0.6; FX.stop = 0.12; vibe(HAP.best); say(`${FOES[e.foe].name} FALLS!`, cx, cy, '#ffe08a', 30); }
      if (fallN === 6) { say('SLAUGHTER!', cx, H * 0.3, '#ffe08a', 26); sfx.combo(3); } else if (fallN === 12) { say('UNSTOPPABLE!', cx, H * 0.3, '#ffe08a', 28); sfx.combo(5); } break;
    case 'leak': sfx.gate(); FX.shake = 10; FX.red = 0.7; vibe(HAP.thud); say(`GATE −${e.dmg}`, cx, H * 0.8, '#ffb4a8', 24); tip('leak', 'They hit the gate! Put towers near the end of the road too', 3); break;
    case 'heal': sfx.heal(); tip('heal', 'A shaman heals those near him: kill him first (magic or stones)', 3); break;
    case 'wave': sfx.horn(); { const w = G.waves[e.n - 1] || [], boss = w.find(q => FOES[q].boss); say(boss ? `${FOES[boss].name} APPROACHES` : `WAVE ${e.n} OF ${e.of}`, cx, H * 0.36, boss ? '#ff9a7a' : '#fff', boss ? 30 : 26); if (boss) { sfx.roar(); FX.shake = 8; } }
      if (G.waves[e.n - 1] && G.waves[e.n - 1].includes('bat')) tip('bat', 'Bats fly: only Archers and Mages can hit them', 3); else if (G.waves[e.n - 1] && G.waves[e.n - 1].includes('knight')) tip('knight', 'Knights wear plate: arrows bounce. Use Catapults or Mages', 3); else if (G.waves[e.n - 1] && G.waves[e.n - 1].includes('ghost')) tip('ghost', 'Ghosts: only Mages can touch them', 3); break;
    case 'early': sfx.early(); say(`EARLY! +${e.bonus} GOLD`, cx, H * 0.3, '#ffe08a', 22); vibe(HAP.light); break;
    case 'meteor': sfx.meteor(); break;
    case 'boom': sfx.boom(); FX.shake = 16; FX.flash = 0.5; FX.stop = 0.06; vibe(HAP.thud); dust(e.x, e.z, 0xff9040, 3.4); break;
    case 'lessonnext': if (e.first) hint = null; say(e.first ? 'FIRST, A LESSON' : 'NEXT LESSON', cx, H * 0.5, '#ffd36a', 26); sfx.ding(); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, cx, H * 0.5, '#9be3b5', 26); sfx.coin(e.n); break;
    case 'lessonmiss': coachMiss(); break;
    case 'lessondone': say('YOU KNOW IT. NOW DEFEND!', cx, H * 0.5, '#ffd36a', 26); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); vibe(HAP.best); FX.flash = 0.8; say('THE SIEGE IS LIFTED!', cx, cy, '#ffe08a', 28); break;
    case 'lost': sfx.lose(); FX.red = 1; say('THE GATE FALLS', cx, cy, '#ffb4a8', 30); break;
  }
}
function puff(pad) { dust(PADS[pad][0], PADS[pad][1], 0xd8d0c0, 2.2); }
function dust(x, z, col, s) { const V = V3; if (HEADLESS || !V || V.none) return; const sp = V.glow(col, s, 0.9); sp.material.blending = THREE.NormalBlending; sp.position.set(x, 0.8, z); V.S.add(sp); V.puffs.push({ sp, t: 0, s }); }
// ---------- the camera: from above the castle, framing the whole valley on any screen ----------
const CAM = { tilt: 0.9, look: [0, 0, -2], d: 60, asp: 0 };
function fitCam() {
  const cam = W3.cam, asp = innerWidth / innerHeight; if (CAM.asp === asp) return; CAM.asp = asp; cam.fov = 34; cam.aspect = asp; cam.updateProjectionMatrix();
  const pts = [[-12.6, 0, -27], [12.6, 0, -27], [-12.6, 0, 21], [12.6, 0, 21], [0, 0, 24.5], [-12, 0, 0], [12, 0, 0]];
  let lo = 20, hi = 300; for (let it = 0; it < 30; it++) { const d = (lo + hi) / 2; place(d); cam.updateMatrixWorld(); let ok = true; for (const p of pts) { SV.set(p[0], p[1], p[2]).project(cam); if (Math.abs(SV.x) > 0.97 || SV.y > 0.8 || SV.y < -0.78) { ok = false; break; } } if (ok) hi = d; else lo = d; }
  CAM.d = hi; place(hi);
}
function place(d) { const cam = W3.cam, L = CAM.look; cam.position.set(L[0], L[1] + Math.sin(CAM.tilt) * d, L[2] + Math.cos(CAM.tilt) * d); cam.lookAt(L[0], L[1], L[2]); }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#10141f'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D valley.', W / 2, H / 2); return; }
  const T = V.T, g = G || idleG(), t = now; setWeather(g); setRoadView(g);
  CAM.asp !== innerWidth / innerHeight && fitCam(); place(CAM.d); if (FX.shake > 0) { W3.cam.position.x += (Math.random() - 0.5) * FX.shake * 0.04; W3.cam.position.z += (Math.random() - 0.5) * FX.shake * 0.04; }
  // towers
  g.towers.forEach((tw, i) => { const cur = V.towers[i], key = tw ? tw.kind + tw.lv : '';
    if (!cur || cur.userData.key !== key) { if (cur) V.S.remove(cur); V.towers[i] = null; if (tw) { const m = towerModel(tw.kind, tw.lv); m.scale.setScalar(1.55); m.userData.base = 1.55; m.userData.key = key; m.position.set(PADS[i][0], 0.27, PADS[i][1]); V.S.add(m); V.towers[i] = m; } }
    const m = V.towers[i]; if (!m) return; const u = m.userData; if (u.turn) u.turn.rotation.y += (((tw.aim - u.turn.rotation.y + Math.PI * 3) % TAU) - Math.PI) * Math.min(1, dt * 8);
    if (u.arm) { const sh = g.shots.find(s => s.from === i && s.t < 0.25); u.arm.rotation.x = sh ? -1.2 * (1 - sh.t / 0.25) : u.arm.rotation.x * 0.9 + 0.3 * 0.1; }
    if (u.orb) u.orb.position.y += Math.sin(t * 2 + i) * 0.003; if (u.spin) u.spin.rotation.y += dt * 0.6;
    const f = ui.flash[i] || 0; m.scale.setScalar(1.55 * (1 + f * 0.25)); if (f) ui.flash[i] = Math.max(0, f - dt); });
  // the selected pad: its ring of range; pads glow when you can afford to build
  V.ring.visible = V.disc.visible = false;
  const selT = G && ui.sel >= 0 ? G.towers[ui.sel] : null;
  if (G && ui.sel >= 0) { const r = selT ? TOWERS[selT.kind].range[selT.lv] : TOWERS.archer.range[0]; V.ring.visible = V.disc.visible = true; V.ring.position.set(PADS[ui.sel][0], 0.3, PADS[ui.sel][1]); V.disc.position.copy(V.ring.position); V.ring.scale.setScalar(r); V.disc.scale.setScalar(r); }
  V.pads.forEach((p, i) => { p.material.emissive && p.material.emissive.setHex(0); });
  // foes
  const seen = new Set();
  for (const f of g.foes) { seen.add(f.id); let m = V.foes.get(f.id); if (!m) { m = foeModel(f.k); V.S.add(m); V.foes.set(f.id, m); }
    const u = m.userData, fl = u.fly || 0; m.position.set(f.x, fl + (u.float ? 0.3 + Math.sin(t * 3 + f.id) * 0.15 : 0), f.z); m.rotation.y = f.h + Math.PI;
    if (u.wings) u.wings.forEach((w, j) => w.rotation.z = (j ? -1 : 1) * Math.sin(t * (f.k === 'dragon' ? 5 : 16) + f.id) * 0.7);
    if (u.legs) u.legs.forEach((l, j) => l.rotation.x = Math.sin(t * 9 * FOES[f.k].v * (1 - f.slow * 0.6) + j * Math.PI) * 0.6);
    m.traverse(o => { if (o.isMesh && o.material.emissive && !o.material.transparent) { if (!o.userData.e0) o.userData.e0 = o.material.emissive.getHex() || 1; o.material.emissive.setHex(f.flash > 0 ? 0xff4020 : f.slow > 0.05 ? 0x2a6aaa : (o.userData.e0 === 1 ? 0 : o.userData.e0)); } }); }
  for (const [id, m] of V.foes) if (!seen.has(id)) { V.S.remove(m); V.foes.delete(id); }
  // shots
  while (V.shots.length < g.shots.length) { const T2 = THREE, grp = new T2.Group(); const ar = new T2.Mesh(new T2.CylinderGeometry(0.03, 0.03, 0.9, 4), new T2.MeshStandardMaterial({ color: 0x6a4a2a })); ar.rotation.x = Math.PI / 2; const st = new T2.Mesh(new T2.DodecahedronGeometry(0.32, 0), new T2.MeshStandardMaterial({ color: 0x7a7470, roughness: 0.9, flatShading: true })); const mg = V.glow(0xc080ff, 1.6, 1); grp.add(ar, st, mg); grp.userData = { ar, st, mg }; V.S.add(grp); V.shots.push(grp); }
  V.shots.forEach((m, i) => { const s = g.shots[i]; m.visible = !!s; if (!s) return; const P = PADS[s.from], tw = g.towers[s.from], u = Math.min(1, s.t / s.fly), h0 = s.kind === 'cat' ? 1.4 : 2.6 + (tw ? tw.lv * 0.7 : 0) + 0.6, h1 = s.air ? 2.4 : 0.8, arc = s.kind === 'cat' ? 5 : s.kind === 'archer' ? 1.2 : 0.3;
    const x = P[0] + (s.x - P[0]) * u, z = P[1] + (s.z - P[1]) * u, y = h0 + (h1 - h0) * u + Math.sin(u * Math.PI) * arc; m.position.set(x, y, z);
    m.userData.ar.visible = s.kind === 'archer'; m.userData.st.visible = s.kind === 'cat'; m.userData.mg.visible = s.kind === 'mage'; if (s.kind === 'archer') m.lookAt(s.x, h1, s.z); if (s.kind === 'cat') m.rotation.x += 0.2; });
  // the meteor falling, its glow on the land; dust and fire puffs
  V.meteorL.intensity = 0;
  while (V.booms.length < g.booms.length) { const grp = new THREE.Group(); const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.9, 1), new THREE.MeshStandardMaterial({ color: 0x3a2010, emissive: 0xff5010, emissiveIntensity: 2.5 })); grp.add(rock, V.glow(0xff8030, 5, 1)); V.S.add(grp); V.booms.push(grp); }
  V.booms.forEach((m, i) => { const b = g.booms[i]; m.visible = !!b && b.t > 0; if (!b) return; const p = roadAt(b.d); if (b.t > 0) { const u = 1 - b.t / 0.8; m.position.set(p.x + (1 - u) * 8, 0.5 + (1 - u) * 30, p.z - (1 - u) * 6); V.meteorL.position.set(p.x, 3, p.z); V.meteorL.intensity = 40 * u; } else { V.meteorL.position.set(p.x, 2, p.z); V.meteorL.intensity = Math.max(V.meteorL.intensity, 80 * Math.max(0, 1 + b.t / 1.5)); } });
  for (const p of V.puffs) { p.t += dt; p.sp.scale.setScalar(p.s * (1 + p.t * 1.5)); p.sp.material.opacity = Math.max(0, 0.8 - p.t * 1.2); p.sp.position.y += dt * 0.8; }
  for (let i = V.puffs.length - 1; i >= 0; i--) if (V.puffs[i].t > 0.7) { V.S.remove(V.puffs[i].sp); V.puffs.splice(i, 1); }
  // the gate shudders when struck; banners wave
  V.gate.position.z = 22.4 + (FX.red > 0 ? Math.sin(t * 60) * 0.05 * FX.red : 0);
  (V.castle.userData.flags || []).forEach((f, i) => f.rotation.y = Math.sin(t * 3 + i) * 0.4);
  W3.setFocus(0, 0, -2, 30);
  W3.render(dt);
  hpBars(g);
  if (G) hud(G, t);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 0.9 ? 1 : 1 - (t2.t - 0.9) / 0.4; ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(t2.size * k)}px ${BC}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 26); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 26); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30;
    ctx.fillStyle = 'rgba(0,0,0,.66)'; rrect(W / 2 - w / 2, H * 0.6 - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.6 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,60,40,${FX.red * 0.18})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,236,200,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); }
}
// health bars over the foes (and a frost tint when slowed)
function hpBars(g) {
  for (const f of g.foes) { const F = FOES[f.k], m = V3.foes.get(f.id), y = (m && m.userData.fly || 0) + 2.5 * FSIZE[f.k]; const s = scr(f.x, y, f.z); if (!s.front) continue; const w = (F.boss ? 60 : 24) * k, h = (F.boss ? 6 : 3.5) * k, u = clamp(f.hp / f.max, 0, 1);
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(s.x - w / 2 - 1, s.y - 1, w + 2, h + 2); ctx.fillStyle = u > 0.5 ? '#7ad06a' : u > 0.25 ? '#e8b04a' : '#e05a4a'; ctx.fillRect(s.x - w / 2, s.y, w * u, h);
    if (F.armour && F.armour.arrow < 0.5) { ctx.font = `${Math.round(9 * k)}px sans-serif`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText('🛡', s.x - w / 2 - 2, s.y + h / 2); } }
}
let IG = null; function idleG() { if (!IG || IG.over || IG.t > 120) { IG = newGame(Math.max(6, store.get('level', 1) | 0), { seed: (Math.random() * 1e6) | 0 }); IG.mem = {}; IG.gate = 999; IG.next = 1; } honest(IG, { react: 0.2, acc: 0.98 }, IG.mem); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function weatherName(w) { return { dawn: 'DAWN', morning: 'MORNING', golden: 'GOLDEN HOUR', overcast: 'GREY SKY', mist: 'FOG', sunset: 'SUNSET', noon: 'MIDDAY', dusk: 'DUSK', rain: 'RAIN', storm: 'STORM', night: 'NIGHT' }[w] || ''; }
// ---------- the HUD and the buttons (all taps) ----------
function meteorBtn() { const r = 34 * k; return { x: W - r - 14, y: H - r - 18 * k, r }; }
function callBtn() { const w = 112 * k, h = 34 * k; return { x: W - w - 12, y: 52 * k, w, h }; }
function menuFor(G) {      // the buttons around the chosen pad: build (4 kinds) or upgrade and sell
  const out = []; if (ui.sel < 0) return out; const P = PADS[ui.sel], s = scr(P[0], 0.4, P[1]), t = G.towers[ui.sel], R = 66 * k, r = 26 * k;
  const pos = (a) => ({ x: clamp(s.x + Math.cos(a) * R, r + 6, W - r - 6), y: clamp(s.y + Math.sin(a) * R, 110 * k, H - 100 * k) });
  const row = clamp(s.x, r * 4 + 10, W - r * 4 - 10), ry = s.y - 72 * k < 110 * k ? s.y + 72 * k : s.y - 72 * k;
  if (!t) KINDS.forEach((kd, i) => { const p = { x: row + (i - 1.5) * 2.15 * r, y: ry }, cost = priceOf(G, kd); out.push({ ...p, r, act: 'build', kind: kd, cost, can: G.gold >= cost }); });
  else { if (t.lv < 2) { const cost = TOWERS[t.kind].cost[t.lv + 1]; out.push({ ...pos(-Math.PI / 2 - 0.55), r, act: 'up', cost, can: G.gold >= cost }); } out.push({ ...pos(-Math.PI / 2 + 0.55), r, act: 'sell', cost: Math.round(t.paid * 0.6), can: true }); }
  return out;
}
function hud(G, t) {
  const c = G.cfg, x = 14; ctx.textBaseline = 'middle';
  if (G.lesson) lessonPanel(G);
  const y = G.lesson ? H * 0.25 : 24 * k;
  // gold and the gate
  ctx.font = `700 ${Math.round(18 * k)}px ${BC}`; ctx.textAlign = 'left'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.6)'; const gs = `🪙 ${G.gold}`; ctx.strokeText(gs, x, y); ctx.fillStyle = '#ffd36a'; ctx.fillText(gs, x, y);
  const gw = Math.min(80 * k, W * 0.22), gx = W - 14 - gw - 46 * k, u = clamp(G.gate / c.gate, 0, 1); ctx.font = `${Math.round(13 * k)}px sans-serif`; ctx.fillText('🏰', gx, y); ctx.fillStyle = 'rgba(0,0,0,.5)'; rrect(gx + 20 * k, y - 5 * k, gw, 10 * k, 5); ctx.fill(); ctx.fillStyle = u > 0.5 ? '#7ad06a' : u > 0.25 ? '#e8b04a' : '#e05a4a'; rrect(gx + 20 * k, y - 5 * k, Math.max(6, gw * u), 10 * k, 5); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.fillText(`${Math.max(0, Math.ceil(G.gate))}`, gx + 24 * k + gw, y);
  // the wave, and what the next one brings
  if (!G.lesson) { ctx.textAlign = 'left'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = '#fff'; ctx.strokeText(`WAVE ${G.wave} / ${G.waves.length}`, x, y + 24 * k); ctx.fillText(`WAVE ${G.wave} / ${G.waves.length}`, x, y + 24 * k); }
  const nextW = !G.queue.length && G.wave < G.waves.length ? G.waves[G.wave] : null;
  if (nextW) { const kinds = [...new Set(nextW)], yy = y + (G.lesson ? 24 : 46) * k; ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(0,0,0,.5)'; rrect(x - 4, yy - 12 * k, 30 * k + kinds.length * 24 * k, 24 * k, 8); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.fillText('NEXT', x + 2, yy); ctx.font = `${Math.round(15 * k)}px sans-serif`; kinds.forEach((kd, i) => ctx.fillText(FICON[kd], x + 32 * k + i * 24 * k, yy));
    const b = callBtn(), by = G.lesson ? yy - b.h / 2 : b.y; ui.callY = by; if (G.foes.length) return hudRest(G, t); ctx.fillStyle = 'rgba(160,40,30,.85)'; rrect(b.x, by, b.w, b.h, 10); ctx.fill(); ctx.strokeStyle = '#ffd36a'; ctx.lineWidth = 2; rrect(b.x, by, b.w, b.h, 10); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillText(`CALL NOW +${Math.round(G.next * 1.5)}`, b.x + b.w / 2, by + b.h / 2);
    ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.font = `700 ${Math.round(9 * k)}px ${BC}`; ctx.fillText(`COMING IN ${Math.ceil(G.next)}s`, b.x + b.w / 2, by + b.h + 9 * k); }
  hudRest(G, t);
}
function hudRest(G, t) {
  const c = G.cfg;
  // the meteor
  const m = meteorBtn(), ready = G.meteor <= 0; ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, TAU); ctx.fillStyle = ui.aim ? 'rgba(255,120,40,.95)' : ready ? 'rgba(120,30,10,.85)' : 'rgba(40,30,30,.75)'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = ready ? '#ffb060' : 'rgba(255,255,255,.3)'; ctx.stroke();
  if (!ready) { ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.arc(m.x, m.y, m.r, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - G.meteor / c.meteorCD)); ctx.closePath(); ctx.fillStyle = 'rgba(255,140,60,.25)'; ctx.fill(); }
  ctx.font = `${Math.round(24 * k)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.globalAlpha = ready ? 1 : 0.5; ctx.fillText('☄️', m.x, m.y - 3 * k); ctx.globalAlpha = 1; ctx.font = `700 ${Math.round(8.5 * k)}px ${BC}`; ctx.fillText(ready ? 'METEOR' : `${Math.ceil(G.meteor)}s`, m.x, m.y + 18 * k);
  if (ui.aim) { ctx.font = `700 ${Math.round(15 * k)}px ${BC}`; ctx.fillStyle = '#ffb060'; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 4; if (G && G.lesson) ctx.strokeText('TAP THE ROAD TO DROP IT', W / 2, H - 40 * k); if (G && G.lesson) ctx.fillText('TAP THE ROAD TO DROP IT', W / 2, H - 40 * k); }
  // pads you can build on: a soft gold marker when you can afford a tower
  if (!ui.aim) PADS.forEach((P, i) => { if (G.towers[i] || i === ui.sel) return; const s = scr(P[0], 0.3, P[1]), can = G.gold >= priceOf(G, 'archer'); ctx.globalAlpha = can ? 0.55 + Math.sin(t * 3 + i) * 0.25 : 0.25; ctx.strokeStyle = '#ffe08a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(s.x, s.y, 10 * k, 0, TAU); ctx.stroke(); ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = '#ffe08a'; ctx.fillText('+', s.x, s.y + 1); ctx.globalAlpha = 1; });
  // the menu around the chosen pad
  ui.btns = menuFor(G); const tw = ui.sel >= 0 ? G.towers[ui.sel] : null;
  if (tw) { const P = PADS[ui.sel], s = scr(P[0], 4.5, P[1]); ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.7)'; const lab = `${TOWERS[tw.kind].name} ${'★'.repeat(tw.lv + 1)}`; ctx.strokeText(lab, s.x, s.y + 64 * k); ctx.fillStyle = '#fff'; ctx.fillText(lab, s.x, s.y + 64 * k); }
  for (const b of ui.btns) { ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fillStyle = b.can ? (b.act === 'sell' ? 'rgba(60,50,30,.92)' : 'rgba(40,60,110,.94)') : 'rgba(40,40,40,.85)'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = b.can ? '#ffe08a' : 'rgba(255,255,255,.25)'; ctx.stroke();
    ctx.globalAlpha = b.can ? 1 : 0.45; ctx.font = `${Math.round(20 * k)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText(b.act === 'build' ? ICON[b.kind] : b.act === 'up' ? '⬆️' : '💰', b.x, b.y - 4 * k);
    ctx.font = `700 ${Math.round(9.5 * k)}px ${BC}`; ctx.fillStyle = b.can ? '#ffd36a' : '#bbb'; ctx.fillText(b.act === 'sell' ? `+${b.cost}` : `${b.cost}`, b.x, b.y + 15 * k); ctx.globalAlpha = 1;
    if (b.act === 'build') { ctx.font = `700 ${Math.round(9 * k)}px ${BC}`; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.strokeText(TOWERS[b.kind].name.toUpperCase(), b.x, b.y + b.r + 8 * k); ctx.fillStyle = '#fff'; ctx.fillText(TOWERS[b.kind].name.toUpperCase(), b.x, b.y + b.r + 8 * k); } }
  if ((G && G.lesson) && G.N <= 3 && !G.towers.some(Boolean) && ui.sel < 0 && G.t < 20) { ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.lineWidth = 4; ctx.strokeText('TAP A GOLD + BY THE ROAD TO BUILD', W / 2, H - 92 * k); ctx.fillText('TAP A GOLD + BY THE ROAD TO BUILD', W / 2, H - 92 * k); }
}
// a tap on the screen: menu button, meteor, call the wave, a pad, the road (when the meteor is ready to drop)
function tapAt(G, x, y) {
  const m = meteorBtn(); if (Math.hypot(x - m.x, y - m.y) < m.r + 8) { ui.sel = -1; if (G.meteor > 0) { sfx.no(); return 'meteor-wait'; } ui.aim = !ui.aim; sfx.click(); if (ui.aim) tip('aim', 'Now tap the road where they are thickest', 2.2); return 'meteor'; }
  if (ui.aim) { let best = -1, bd = 1e9; for (let d = 0; d <= PATH_LEN; d += 0.5) { const p = roadAt(d), s = scr(p.x, 0, p.z), dd = Math.hypot(s.x - x, s.y - y); if (dd < bd) { bd = dd; best = d; } } ui.aim = false; if (bd < 60 * k) { meteor(G, best); return 'drop'; } sfx.no(); return 'miss'; }
  for (const b of ui.btns) if (Math.hypot(x - b.x, y - b.y) < b.r + 6) { const pad = ui.sel; if (b.act === 'build') { if (build(G, pad, b.kind)) ui.sel = -1; } else if (b.act === 'up') { upgrade(G, pad); if (!G.towers[pad] || G.towers[pad].lv >= 2) ui.sel = -1; } else { sell(G, pad); ui.sel = -1; } return b.act; }
  const cb = callBtn(), cy = ui.callY != null ? ui.callY : cb.y; if (x > cb.x && x < cb.x + cb.w && y > cy && y < cy + cb.h && !G.queue.length && !G.foes.length && G.wave < G.waves.length) { ui.sel = -1; callWave(G); return 'call'; }
  let best = -1, bd = 1e9; PADS.forEach((P, i) => { const s = scr(P[0], 0.4, P[1]), dd = Math.hypot(s.x - x, s.y - y); if (dd < bd) { bd = dd; best = i; } });
  if (bd < 36 * k) { ui.sel = ui.sel === best ? -1 : best; sfx.click(); return 'pad'; }
  ui.sel = -1; return 'none';
}
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { coachPanel(G); }
