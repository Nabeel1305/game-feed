// ===================== THE VIEW: Harvest Valley in 3D (three.js through tools/world3d.js) =====================
// A small farm in a green valley seen from above the gate: raised beds of dark soil in rows, the crops growing in them
// (sprout, leaves, then the carrot tops, the tomatoes reddening, the pumpkins swelling, corn and sunflowers later), the red
// hen house with its hens pecking, the market cart by the gate, the farmhouse behind, trees and hills; spring, summer,
// autumn and snowy winter; rain on some days. Everything is tapped where it stands.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [];
let hint = null, V3 = null;
const ui = { flash: {} };
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 2.8) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function fxStep(dt) {
  FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 1.8);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.3) TXT.shift();
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; }
}
const BED_SP = 2.6, bedPos = b => [(b.c - 1.5) * BED_SP, -1.5 + b.r * BED_SP], COOP = [-4.3, -6.5], CART = [4.3, -6.2];      /* 22 Nov 2026: drawn in, so the camera can come closer and the beds are bigger */
const ICON = k2 => k2 === 'egg' ? EGG.icon : CROPS[k2].icon;
const GROUNDS = { spring: 0x5e9a3a, summer: 0x7a9a3a, autumn: 0x9a8a3a, winter: 0xe8eef4 };
function buildWorld() {
  if (V3) return V3; const T = THREE; if (!W3 || !W3.init({ canvas: $('gl'), fov: 36, far: 1500, near: 0.3 })) { V3 = { none: true }; return V3; }
  const S = W3.scene, R0 = W3.rng(13);
  const landM = new T.MeshStandardMaterial({ color: 0x5e9a3a, roughness: 0.95, map: W3.grainTex(256, 5, 200, 50, 8) }); landM.map.repeat.set(12, 12);
  const land = new T.Mesh(new T.PlaneGeometry(240, 240), landM); land.rotation.x = -Math.PI / 2; land.receiveShadow = true; S.add(land);
  const hillM = new T.MeshStandardMaterial({ color: 0x4e8a32, roughness: 1, flatShading: true }); for (let i = 0; i < 9; i++) { const h = new T.Mesh(new T.SphereGeometry(18 + R0() * 14, 16, 10), hillM); h.scale.y = 0.35; h.position.set((i - 4) * 22, -2, -48 - R0() * 20); S.add(h); }
  // the yard: a dirt patch, a path to the gate, a fence round it all
  const dirt = new T.Mesh(new T.PlaneGeometry(20, 24), new T.MeshStandardMaterial({ color: 0x8a6a48, roughness: 1, map: W3.grainTex(256, 7, 180, 40, 6) })); dirt.rotation.x = -Math.PI / 2; dirt.position.set(0, 0.01, -1); dirt.receiveShadow = true; S.add(dirt);
  const woodM = new T.MeshStandardMaterial({ color: 0x8a6a4a, roughness: 0.9 }), posts = []; for (let x = -10; x <= 10; x += 2) posts.push([x, -13], [x, 11]); for (let z = -11; z <= 9; z += 2) posts.push([-10, z], [10, z]);
  const postI = new T.InstancedMesh(new T.BoxGeometry(0.16, 1.1, 0.16), woodM, posts.length), d = new T.Object3D(); posts.forEach(([x, z], i) => { d.position.set(x, 0.55, z); d.updateMatrix(); postI.setMatrixAt(i, d.matrix); }); postI.castShadow = true; S.add(postI);
  for (const [w, x, z, ry] of [[20, 0, -13, 0], [20, 0, 11, 0], [24, -10, -1, Math.PI / 2], [24, 10, -1, Math.PI / 2]]) for (const y of [0.4, 0.85]) { const r = new T.Mesh(new T.BoxGeometry(w, 0.08, 0.06), woodM); r.position.set(x, y, z); r.rotation.y = ry; S.add(r); }
  // the farmhouse behind, the hen house, the cart
  const house = new T.Group(); house.position.set(0, 0, -18); S.add(house);
  { const wall = new T.Mesh(new T.BoxGeometry(9, 4, 6), new T.MeshStandardMaterial({ color: 0xf0e6d0, roughness: 0.9 })); wall.position.y = 2; const roof = new T.Mesh(new T.ConeGeometry(6.8, 3, 4), new T.MeshStandardMaterial({ color: 0x9a3a2a, roughness: 0.8 })); roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, 0.75); roof.position.y = 5.4;
    const door = new T.Mesh(new T.BoxGeometry(1.2, 2, 0.1), woodM); door.position.set(0, 1, 3.02); house.add(wall, roof, door); for (const x of [-2.6, 2.6]) { const w2 = new T.Mesh(new T.BoxGeometry(1.2, 1, 0.1), new T.MeshStandardMaterial({ color: 0x9ac8e8, emissive: 0x334455 })); w2.position.set(x, 2.4, 3.02); house.add(w2); } }
  const coop = new T.Group(); coop.position.set(COOP[0], 0, COOP[1]); S.add(coop);
  { const b = new T.Mesh(new T.BoxGeometry(3, 1.8, 2.2), new T.MeshStandardMaterial({ color: 0xb8402a, roughness: 0.85 })); b.position.y = 1.2; const legs = new T.Mesh(new T.BoxGeometry(2.8, 0.3, 2), woodM); legs.position.y = 0.15; const rf = new T.Mesh(new T.ConeGeometry(2.3, 1.1, 4), new T.MeshStandardMaterial({ color: 0x4a3a2a })); rf.rotation.y = Math.PI / 4; rf.scale.z = 0.8; rf.position.y = 2.65;
    const ramp = new T.Mesh(new T.BoxGeometry(0.6, 0.05, 1.4), woodM); ramp.position.set(0.6, 0.45, 1.6); ramp.rotation.x = 0.5; const hole = new T.Mesh(new T.CircleGeometry(0.3, 16), new T.MeshBasicMaterial({ color: 0x1a1a1a })); hole.position.set(0.6, 1.0, 1.11); coop.add(b, legs, rf, ramp, hole); }
  const cart = new T.Group(); cart.position.set(CART[0], 0, CART[1]); S.add(cart);
  { const bx = new T.Mesh(new T.BoxGeometry(2.6, 0.9, 1.6), woodM); bx.position.y = 1.0; const cv2 = document.createElement('canvas'); cv2.width = 64; cv2.height = 16; const g = cv2.getContext('2d'); for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#f4f0e0' : '#d83a2a'; g.fillRect(i * 8, 0, 8, 16); } const tx = new T.CanvasTexture(cv2); tx.colorSpace = T.SRGBColorSpace;
    const awn = new T.Mesh(new T.BoxGeometry(3, 0.1, 2), new T.MeshStandardMaterial({ map: tx })); awn.position.y = 2.6; awn.rotation.x = 0.15; for (const [x, z] of [[-1.3, -0.7], [1.3, -0.7], [-1.3, 0.7], [1.3, 0.7]]) { const p = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 2.1, 6), woodM); p.position.set(x, 1.6, z); cart.add(p); }
    for (const x of [-0.9, 0.9]) { const w = new T.Mesh(new T.CylinderGeometry(0.5, 0.5, 0.12, 16), new T.MeshStandardMaterial({ color: 0x3a2a1a })); w.rotation.x = Math.PI / 2; w.rotation.z = Math.PI / 2; w.position.set(x, 0.5, 0.85); cart.add(w); } cart.add(bx, awn);
    const pile = new T.Group(); pile.position.y = 1.5; cart.add(pile); cart.userData.pile = pile; }
  // trees round the farm
  const trees = []; for (let i = 0; i < 40; i++) { const a = R0() * TAU, r = 16 + R0() * 30; trees.push({ x: Math.sin(a) * r, z: Math.cos(a) * r * 0.8 - 6, y: 0, s: 0.5 + R0() * 0.4, hue: R0(), shade: R0() }); }
  W3.pines(trees.filter(t2 => Math.abs(t2.x) > 12 || t2.z < -22), { layers: 3 });
  // beds: up to five rows of four, built once; crops are rebuilt when they change
  const soilM = new T.MeshStandardMaterial({ color: 0x4a3222, roughness: 1 }), wetM = new T.MeshStandardMaterial({ color: 0x2e1e14, roughness: 0.5 }), rimM = new T.MeshStandardMaterial({ color: 0x7a5a3a, roughness: 0.9 });
  const beds = []; for (let r = 0; r < 5; r++) for (let c2 = 0; c2 < 4; c2++) { const g = new T.Group(); const [x, z] = bedPos({ r, c: c2 }); g.position.set(x, 0, z); const rim = new T.Mesh(new T.BoxGeometry(2.2, 0.3, 2.2), rimM); rim.position.y = 0.15; const soil = new T.Mesh(new T.BoxGeometry(1.9, 0.32, 1.9), soilM); soil.position.y = 0.18; g.add(rim, soil); g.userData = { soil, crop: null, key: '' }; g.traverse(o => { if (o.isMesh) o.receiveShadow = true; }); g.visible = false; S.add(g); beds.push(g); }
  const hens = []; for (let i = 0; i < 4; i++) { const h = new T.Group(); const body = new T.Mesh(new T.SphereGeometry(0.28, 12, 10), new T.MeshStandardMaterial({ color: i === 3 ? 0x8a5a2a : 0xf4f0e8, roughness: 0.8 })); body.scale.set(1, 0.9, 1.3); body.position.y = 0.35; const head = new T.Mesh(new T.SphereGeometry(0.14, 10, 8), body.material); head.position.set(0, 0.6, 0.3); const comb = new T.Mesh(new T.BoxGeometry(0.04, 0.1, 0.14), new T.MeshStandardMaterial({ color: 0xd8201a })); comb.position.set(0, 0.74, 0.3); const beak = new T.Mesh(new T.ConeGeometry(0.04, 0.1, 6), new T.MeshStandardMaterial({ color: 0xe8a020 })); beak.rotation.x = Math.PI / 2; beak.position.set(0, 0.6, 0.45); h.add(body, head, comb, beak); h.traverse(o => { if (o.isMesh) o.castShadow = true; }); h.userData = { head, ph: R0() * 6, x: COOP[0] + (R0() - 0.5) * 3, z: COOP[1] + 2 + R0() * 2 }; S.add(h); hens.push(h); }
  const crowM = new T.MeshStandardMaterial({ color: 0x1a1a22, roughness: 0.5 }), crows = []; for (let i = 0; i < 4; i++) { const g = new T.Group(); const b = new T.Mesh(new T.SphereGeometry(0.25, 10, 8), crowM); b.scale.set(0.8, 0.8, 1.4); b.position.y = 0.3; const hd = new T.Mesh(new T.SphereGeometry(0.14, 8, 6), crowM); hd.position.set(0, 0.45, 0.3); const bk = new T.Mesh(new T.ConeGeometry(0.05, 0.18, 6), new T.MeshStandardMaterial({ color: 0x333333 })); bk.rotation.x = Math.PI / 2; bk.position.set(0, 0.43, 0.48); const wings = []; for (const s of [-1, 1]) { const w = new T.Mesh(new T.BoxGeometry(0.5, 0.03, 0.3), crowM); w.position.set(s * 0.3, 0.38, 0); g.add(w); wings.push(w); } g.add(b, hd, bk); g.userData = { wings }; g.visible = false; S.add(g); crows.push(g); }
  V3 = { T, S, landM, beds, hens, crows, cart, coop, soilM, wetM, season: null };
  W3.setQuality(stepN); return V3;
}
function cropModel(cr) {
  const T = THREE, g = new T.Group(), M = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.75 }, o)), u = clamp(cr.g / cr.grow, 0, 1), sick = cr.dead || cr.rot ? 1 : cr.wilt > 0 ? 0.5 : 0;
  const leafC = new T.Color(0x4aa03a).lerp(new T.Color(cr.rot ? 0x2a1a10 : 0x8a6a2a), sick), leaf = M(leafC.getHex());
  const plants = cr.kd === 'pumpkin' || cr.kd === 'corn' || cr.kd === 'sunflower' ? [[0, 0]] : [[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]];
  for (const [px, pz] of plants) { const p = new T.Group(); p.position.set(px, 0.34, pz); g.add(p); const s = 0.3 + u * 0.7;
    if (cr.kd === 'corn' || cr.kd === 'sunflower') { const st = new T.Mesh(new T.CylinderGeometry(0.06, 0.08, 2.4 * s, 6), leaf); st.position.y = 1.2 * s; p.add(st); for (let i = 0; i < 4; i++) { const l = new T.Mesh(new T.BoxGeometry(0.7 * s, 0.02, 0.18), leaf); l.position.y = (0.5 + i * 0.45) * s; l.rotation.y = i * 1.6; l.rotation.z = 0.4; p.add(l); }
      if (cr.ripe && cr.kd === 'corn') for (const a of [0, 2.2, 4.1]) { const cob = new T.Mesh(new T.CapsuleGeometry(0.12, 0.4, 3, 8), M(0xf0c830)); cob.position.set(Math.sin(a) * 0.18, 1.4, Math.cos(a) * 0.18); cob.rotation.z = 0.3; p.add(cob); }
      if (cr.kd === 'sunflower' && u > 0.6) { const hd = new T.Mesh(new T.CylinderGeometry(0.45 * s, 0.45 * s, 0.08, 18), M(cr.ripe ? 0xf8c820 : 0x9ab83a)); hd.position.set(0, 2.4 * s, 0.1); hd.rotation.x = 1.2; const ctr = new T.Mesh(new T.CylinderGeometry(0.2 * s, 0.2 * s, 0.1, 14), M(0x5a3a1a)); ctr.position.set(0, 2.42 * s, 0.14); ctr.rotation.x = 1.2; p.add(hd, ctr); } }
    else if (cr.kd === 'pumpkin') { for (let i = 0; i < 5; i++) { const l = new T.Mesh(new T.CircleGeometry(0.35 * s, 10), leaf); l.rotation.x = -Math.PI / 2 + 0.3; l.rotation.z = i * 1.25; l.position.set(Math.sin(i * 1.25) * 0.4, 0.15, Math.cos(i * 1.25) * 0.4); p.add(l); }
      if (u > 0.3) { const pk = new T.Mesh(new T.SphereGeometry(0.55 * u, 14, 10), M(cr.ripe ? 0xf07818 : 0x9ab840)); pk.scale.y = 0.75; pk.position.y = 0.35 * u; p.add(pk); } }
    else { const nl = cr.kd === 'carrot' ? 5 : 6; for (let i = 0; i < nl; i++) { const l = new T.Mesh(new T.ConeGeometry(0.07, 0.6 * s, 4), leaf); l.position.y = 0.3 * s; l.rotation.z = Math.cos(i * 1.3) * 0.5 + (sick ? 0.6 : 0); l.rotation.x = Math.sin(i * 1.3) * 0.5; p.add(l); }
      if (cr.kd === 'carrot' && u > 0.5) { const top = new T.Mesh(new T.ConeGeometry(0.12, 0.25, 8), M(cr.ripe ? 0xf07a20 : 0xc8a050)); top.rotation.x = Math.PI; top.position.y = 0.05; p.add(top); }
      if (cr.kd === 'tomato' && u > 0.45) for (const a of [0, 2.1, 4.2]) { const tm = new T.Mesh(new T.SphereGeometry(0.11, 10, 8), M(cr.ripe ? 0xe0281a : 0x8ab83a)); tm.position.set(Math.sin(a) * 0.16, 0.35 * s, Math.cos(a) * 0.16); p.add(tm); } } }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g;
}
function setScene(g) {
  const V = buildWorld(); if (V.none) return; if (V.sky !== g.weather) { V.sky = g.weather; W3.setSky(g.weather, { azim: 160 }); W3.scene.environmentIntensity = 0.75; W3.S.onBolt = () => { if (!HEADLESS && sfx.thunder) setTimeout(() => sfx.thunder(), 300 + Math.random() * 900); }; }
  if (V.season !== g.season) { V.season = g.season; V.landM.color.setHex(GROUNDS[g.season]); }
}
const SV = new (window.THREE ? THREE.Vector3 : Object)();
function scr(x, y, z) { if (!V3 || V3.none) return { x: W / 2 + x * 16, y: H / 2 + z * 16, front: true }; SV.set(x, y, z); return W3.screen(SV); }
let pickN = 0, pickT = 0;
function onEvent(G, e) {
  const cx = W / 2, cy = H * 0.4, bp = e.bed != null ? scr(...(([x, z]) => [x, 1.2, z])(bedPos(G.beds[e.bed]))) : { x: cx, y: cy };
  switch (e.k) {
    case 'plant': sfx.plant(); vibe(HAP.tick); ui.flash[e.bed] = 0.3; break;
    case 'water': sfx.water(); ui.flash[e.bed] = 0.3; say('💧', bp.x, bp.y - 10, '#9fdcff', 20); break;
    case 'sprinkle': if (!HEADLESS && Math.random() < 0.3) sfx.water(); break;
    case 'thirst': if (!HEADLESS) sfx.drip(); tip('thirst', 'A 💧 drop: that crop is thirsty. Tap it to water.', 2.6); break;
    case 'ripe': sfx.ripe(); tip('ripe', 'It sparkles: ripe! Tap to pick it.', 2.4); break;
    case 'harvest': if (G.t - pickT > 2) pickN = 0; pickT = G.t; sfx.pick(pickN++); vibe(HAP.light); ui.flash[e.bed] = 0.4; say(`+${ICON(e.kd)}`, bp.x, bp.y - 20, '#fff', 22); if (e.n > 0 && e.n % 5 === 0) say(`${e.n} IN A ROW!`, cx, H * 0.32, '#ffe08a', 24); break;
    case 'rot': sfx.squelch(); FX.red = 0.5; FX.shake = 5; say('ROTTED!', bp.x, bp.y - 10, '#d8a080', 22); tip('rot', 'Too much water rots a crop. Water only when it shows a 💧 drop.', 3.2); break;
    case 'dead': sfx.wilt(); FX.red = 0.4; say('WILTED', bp.x, bp.y - 10, '#c8a070', 20); tip('dead', 'A thirsty crop left too long dies. Watch for the 💧 drops.', 3); break;
    case 'clear': sfx.dig(); break;
    case 'laid': sfx.cluck(); tip('eggs', 'Eggs! Tap the hen house to collect them.', 2.4); break;
    case 'eggs': sfx.eggs(e.n); vibe(HAP.light); { const s = scr(COOP[0], 2.5, COOP[1]); say(`+${e.n} 🥚`, s.x, s.y, '#fff', 22); } break;
    case 'sulk': sfx.squawk(); { const s = scr(COOP[0], 2.5, COOP[1]); say('NOT YET!', s.x, s.y, '#ffb4a8', 18); } tip('sulk', 'Wait for the eggs to show over the hen house, or the hens sulk.', 3); break;
    case 'crow': sfx.caw(); tip('crow', 'A crow! Tap it to shoo it before it eats your crop.', 2.6); break;
    case 'shoo': sfx.shoo(); vibe(HAP.tick); say('SHOO!', bp.x, bp.y - 10, '#fff', 20); break;
    case 'eaten': sfx.caw(); FX.red = 0.3; say('EATEN!', bp.x, bp.y - 10, '#ffb4a8', 20); break;
    case 'sell': sfx.sell(e.n); FX.flash = 0.25; vibe(HAP.light); { const s = scr(CART[0], 2.8, CART[1]); say(`+${e.coins} 🪙`, s.x, s.y, '#ffe08a', 24); } break;
    case 'nosale': sfx.no(); { const s = scr(CART[0], 2.8, CART[1]); say('NOTHING THEY WANT', s.x, s.y, '#fff', 16); } break;
    case 'seed': sfx.click(); break;
    case 'lessonnext': if (e.first) hint = null; say(e.first ? 'FIRST, A LESSON' : 'NEXT LESSON', cx, H * 0.5, '#ffe08a', 26); sfx.ding(); break;
    case 'lessonmiss': coachMiss(); break;
    case 'lessondone': say('A FARMER! NOW THE REAL DAY', cx, H * 0.5, '#ffe08a', 24); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); vibe(HAP.best); FX.flash = 0.8; say('ALL ORDERS FILLED!', cx, cy, '#ffe08a', 28); break;
    case 'lost': sfx.lose(); say('THE SUN HAS SET', cx, cy, '#ffb4a8', 28); break;
  }
}
// ---------- the camera: from above the gate, the whole farm on any screen ----------
const CAM = { tilt: 1.12, look: [0, 0, -2.5], d: 40, asp: 0 };
function fitCam(rows) {
  const cam = W3.cam, asp = innerWidth / innerHeight, key = asp + ':' + rows; if (CAM.asp === key) return; CAM.asp = key; cam.fov = 36; cam.aspect = asp; cam.updateProjectionMatrix();
  const zb = -1.5 + (rows - 1) * BED_SP + 1.4, pts = [[-6.1, 0, -7], [6.1, 0, -7], [-5.5, 0, zb], [5.5, 0, zb], [0, 2.8, -6.4]]; CAM.look[2] = (zb - 8.5) / 2 - 0.5;
  let lo = 8, hi = 200; for (let it = 0; it < 30; it++) { const d = (lo + hi) / 2; place(d); cam.updateMatrixWorld(); let ok = true; for (const p of pts) { SV.set(p[0], p[1], p[2]).project(cam); if (Math.abs(SV.x) > 0.95 || SV.y > 0.6 || SV.y < -0.66) { ok = false; break; } } if (ok) hi = d; else lo = d; }
  CAM.d = hi; place(hi);
}
function place(d) { const cam = W3.cam, L = CAM.look; cam.position.set(L[0], L[1] + Math.sin(CAM.tilt) * d, L[2] + Math.cos(CAM.tilt) * d); cam.lookAt(L[0], L[1], L[2]); }
let IG = null; function idleG() { if (!IG || IG.over) { IG = newGame(Math.max(5, store.get('level', 1) | 0), { seed: (Math.random() * 1e6) | 0 }); IG.mem = {}; IG.cfg.day = 1e9; } honest(IG, { react: 0.2, acc: 0.99 }, IG.mem); step(IG, 1 / 60); IG.ev.length = 0; if (IG.orders.every(o => o.got >= o.want)) IG = null; return IG || idleG(); }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#10141f'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D farm.', W / 2, H / 2); return; }
  const g = G || idleG(), t = now; setScene(g); fitCam(g.cfg.rows); place(CAM.d);
  // beds and their crops
  V.beds.forEach((m, i) => { const b = g.beds[i]; m.visible = !!b; if (!b) return; const u = m.userData, cr = b.crop;
    u.soil.material = cr && ((cr.thirsty === 0 && cr.drank > 0) || g.raining) ? V.wetM : V.soilM;
    const key = cr ? [cr.kd, Math.floor(clamp(cr.g / cr.grow, 0, 1) * 6), cr.ripe, cr.dead, cr.rot, cr.wilt > 0].join() : '';
    if (key !== u.key) { if (u.crop) m.remove(u.crop); u.crop = cr ? cropModel(cr) : null; if (u.crop) m.add(u.crop); u.key = key; }
    const f = ui.flash[i] || 0; m.scale.setScalar(1 + f * 0.12); if (f) ui.flash[i] = Math.max(0, f - dt);
    if (u.crop && cr && cr.ripe) u.crop.rotation.y = Math.sin(t * 2 + i) * 0.05; });
  // hens peck about; crows on the crops
  V.hens.forEach((h, i) => { const u = h.userData; u.ph += dt; const wx = COOP[0] + Math.sin(u.ph * 0.3 + i) * 1.8, wz = COOP[1] + 2.4 + Math.cos(u.ph * 0.23 + i * 2) * 1.2; h.position.set(wx, 0, wz); h.rotation.y = u.ph * 0.3 + i; u.head.position.y = 0.6 - Math.max(0, Math.sin(u.ph * 3)) * 0.2; });
  V.crows.forEach(m => m.visible = false); g.crows.filter(q => !q.gone || q.t < 1).forEach((q, j) => { const m = V.crows[j % V.crows.length]; m.visible = true; const [x, z] = bedPos(g.beds[q.bed]); if (q.gone) { m.position.set(x + q.t * 6, 0.5 + q.t * 5, z - q.t * 4); m.userData.wings.forEach((w, s) => w.rotation.z = (s ? 1 : -1) * Math.sin(t * 30) * 0.8); } else { m.position.set(x + 0.3, 0.55, z + 0.2); m.rotation.y = Math.sin(t * 2 + j) * 0.8; m.userData.wings.forEach(w => w.rotation.z = 0); m.children[3] && (m.children[3].rotation.x = 0); } });
  // the cart's pile: what you have sold today
  { const pile = V.cart.userData.pile, n = Math.min(14, g.sold); while (pile.children.length < n) { const c = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), new THREE.MeshStandardMaterial({ color: [0xf07a20, 0xe0281a, 0xf0c830, 0x9ac840][pile.children.length % 4] })); c.position.set(((pile.children.length * 7) % 5 - 2) * 0.4, 0, ((pile.children.length * 3) % 3 - 1) * 0.4); pile.add(c); } while (pile.children.length > n) pile.remove(pile.children[pile.children.length - 1]); }
  if (FX.shake > 0) W3.cam.position.x += (Math.random() - 0.5) * FX.shake * 0.02;
  W3.setFocus(0, 0, -2, 16); W3.render(dt);
  marks(g, t);
  if (G) hud(G, t);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 0.9 ? 1 : 1 - (t2.t - 0.9) / 0.4; ctx.globalAlpha = Math.max(0, al); ctx.font = `600 ${Math.round(t2.size * k)}px ${TF}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 26); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 26); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30;
    ctx.fillStyle = 'rgba(30,24,16,.8)'; rrect(W / 2 - w / 2, H * 0.6 - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.6 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,80,40,${FX.red * 0.14})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,248,210,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); }
}
// drops over thirsty crops, sparkles on ripe ones, eggs over the hen house, the cart's sign
function marks(g, t) {
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  g.beds.forEach((b, i) => { const cr = b.crop; if (!cr) return; const [x, z] = bedPos(b), s = scr(x, 1.9, z);
    if (cr.thirsty > 0 && !cr.dead && !cr.rot) { const urgent = cr.thirsty > g.cfg.thirstT * 0.6; ctx.font = `${Math.round((urgent ? 26 : 22) * k)}px sans-serif`; ctx.globalAlpha = urgent ? 0.6 + 0.4 * Math.sin(t * 12) : 1; ctx.fillText('💧', s.x, s.y + Math.sin(t * 4 + i) * 3); ctx.globalAlpha = 1;
      if (cr.thirsty > g.cfg.thirstT) { const u = clamp(cr.wilt / g.cfg.wiltT, 0, 1); ctx.strokeStyle = '#e05a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(s.x, s.y, 16 * k, -Math.PI / 2, -Math.PI / 2 + TAU * u); ctx.stroke(); } }
    else if (cr.ripe) { ctx.font = `${Math.round(18 * k)}px sans-serif`; for (let j = 0; j < 3; j++) { const a = t * 2 + j * 2.1; ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 6 + j); ctx.fillText('✨', s.x + Math.cos(a) * 14 * k, s.y + Math.sin(a) * 8 * k); } ctx.globalAlpha = 1; }
    else if (cr.dead || cr.rot) { ctx.font = `${Math.round(16 * k)}px sans-serif`; ctx.globalAlpha = 0.8; ctx.fillText('🗑️', s.x, s.y); ctx.globalAlpha = 1; }
    else { const u = clamp(cr.g / cr.grow, 0, 1); ctx.fillStyle = 'rgba(0,0,0,.35)'; rrect(s.x - 14 * k, s.y + 10 * k, 28 * k, 4 * k, 2); ctx.fill(); ctx.fillStyle = '#9be37a'; rrect(s.x - 14 * k, s.y + 10 * k, 28 * k * u, 4 * k, 2); ctx.fill(); } });
  for (const q of g.crows) if (!q.gone) { const [x, z] = bedPos(g.beds[q.bed]), s = scr(x, 1.2, z), u = q.t / g.cfg.crowEat; ctx.strokeStyle = '#ff5a4a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(s.x, s.y, 20 * k, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(u, 0, 1)); ctx.stroke(); }
  if (g.N >= 3 || g.lesson) { const s = scr(COOP[0], 3.4, COOP[1]); ctx.font = `${Math.round(18 * k)}px sans-serif`; if (g.eggs > 0) { ctx.fillStyle = 'rgba(255,255,255,.85)'; rrect(s.x - (14 + g.eggs * 9) * k, s.y - 14 * k, (28 + g.eggs * 18) * k, 28 * k, 14 * k); ctx.fill(); ctx.fillText('🥚'.repeat(g.eggs), s.x, s.y + 1); } else if (g.sulk > 0) ctx.fillText('😤', s.x, s.y); }
  { const s = scr(CART[0], 3.3, CART[1]), has = g.orders.some(o => (g.basket[o.kd] || 0) > 0 && o.got < o.want); ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = has ? 'rgba(60,140,60,.95)' : 'rgba(0,0,0,.45)'; rrect(s.x - 34 * k, s.y - 11 * k, 68 * k, 22 * k, 11 * k); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillText(has ? 'SELL! 🪙' : 'MARKET', s.x, s.y + 1); }
}
function seedBar(G) { const seeds = G.lesson ? (G.N === 2 ? ['carrot', 'tomato'] : ['carrot']) : seedsOf(G.N), w = Math.min(70 * k, (W - 24) / seeds.length), h = 62 * k, y = H - h - 14 * k, x0 = W / 2 - w * seeds.length / 2; return seeds.map((kd, i) => ({ kd, x: x0 + i * w, y, w: w - 6 * k, h })); }
function hud(G, t) {
  const c = G.cfg, x = 12; ctx.textBaseline = 'middle';
  if (G.lesson) lessonPanel(G);
  // the orders, on a market slate
  const oy = G.lesson ? H * 0.27 : 46 * k, ow = W - 24, oh = 50 * k; ctx.fillStyle = 'rgba(40,30,20,.78)'; rrect(x, oy, ow, oh, 12); ctx.fill();
  ctx.textAlign = 'left'; ctx.fillStyle = '#ffe08a'; ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.fillText('THE CART WANTS', x + 10, oy + 11 * k);
  const cw = (ow - 20) / Math.max(1, G.orders.length); G.orders.forEach((o, i) => { const ox = x + 10 + i * cw, done = o.got >= o.want, inB = G.basket[o.kd] || 0; ctx.font = `${Math.round(19 * k)}px sans-serif`; ctx.globalAlpha = done ? 0.5 : 1; ctx.fillText(ICON(o.kd), ox, oy + 32 * k); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; ctx.fillStyle = done ? '#9be37a' : '#fff'; ctx.fillText(done ? '✓' : `${o.got}/${o.want}`, ox + 26 * k, oy + 32 * k); if (inB && !done) { ctx.fillStyle = '#ffe08a'; ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.fillText(`+${inB} in basket`, ox + 26 * k, oy + 44 * k); } ctx.globalAlpha = 1; ctx.fillStyle = '#ffe08a'; });
  // the sun, the coins
  if (!G.lesson) { const u = clamp(G.sun / c.day, 0, 1), sx = x, sy = 22 * k, sw = W * 0.3; ctx.fillStyle = 'rgba(0,0,0,.35)'; rrect(sx, sy - 5 * k, sw, 10 * k, 5); ctx.fill(); ctx.fillStyle = u > 0.8 ? '#e0603a' : '#f0c040'; rrect(sx, sy - 5 * k, Math.max(6, sw * (1 - u)), 10 * k, 5); ctx.fill(); ctx.font = `${Math.round(14 * k)}px sans-serif`; ctx.fillText(u > 0.8 ? '🌇' : '☀️', sx + sw + 6, sy + 1); }
  ctx.textAlign = 'right'; ctx.font = `700 ${Math.round(16 * k)}px ${BC}`; ctx.fillStyle = '#fff'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.strokeText(`🪙 ${G.coins}`, W - 14, 22 * k); ctx.fillText(`🪙 ${G.coins}`, W - 14, 22 * k);
  // the seed bar
  for (const s of seedBar(G)) { const sel = G.seed === s.kd; ctx.fillStyle = sel ? 'rgba(255,224,138,.95)' : 'rgba(40,30,20,.75)'; rrect(s.x, s.y, s.w, s.h, 12); ctx.fill(); if (sel) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; rrect(s.x, s.y, s.w, s.h, 12); ctx.stroke(); }
    ctx.textAlign = 'center'; ctx.font = `${Math.round(22 * k)}px sans-serif`; ctx.fillStyle = '#fff'; ctx.fillText(CROPS[s.kd].icon, s.x + s.w / 2, s.y + s.h * 0.34); ctx.font = `700 ${Math.round(9.5 * k)}px ${BC}`; ctx.fillStyle = sel ? '#3a2a10' : '#fff'; ctx.fillText(CROPS[s.kd].name.toUpperCase(), s.x + s.w / 2, s.y + s.h * 0.68); ctx.font = `600 ${Math.round(8.5 * k)}px ${BC}`; ctx.fillText(`${Math.round(CROPS[s.kd].grow * c.grow)} s · 💧${CROPS[s.kd].drinks}`, s.x + s.w / 2, s.y + s.h * 0.86); }
}
// a tap: the seed bar, the hen house, the cart, a crow or a bed
function tapAt(G, x, y) {
  for (const s of seedBar(G)) if (x > s.x && x < s.x + s.w && y > s.y && y < s.y + s.h) { pickSeed(G, s.kd); return 'seed'; }
  const near = (wx, wy, wz, r) => { const s = scr(wx, wy, wz); return Math.hypot(s.x - x, s.y - y) < r * k; };
  if (near(COOP[0], 1.3, COOP[1], 52)) return tapCoop(G);
  if (near(CART[0], 1.4, CART[1], 52)) return tapCart(G);
  let best = -1, bd = 1e9; G.beds.forEach((b, i) => { const [bx, bz] = bedPos(b), s = scr(bx, 0.6, bz), d = Math.hypot(s.x - x, s.y - y); if (d < bd) { bd = d; best = i; } });
  if (best >= 0 && bd < 40 * k) return tapBed(G, best);
  return 'none';
}
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { coachPanel(G); }
