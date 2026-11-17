// ===================== THE VIEW: Horde in 3D (three.js through tools/world3d.js) =====================
// A clearing at night seen from above and behind the hero: gravestones and dead trees, a broken fence, mist and moonlight,
// later the dead forest, the swamp and the bone desert. The monsters are drawn many at a time (one instanced shape per kind),
// bobbing and turning to you, flashing white when hit; blue crystals and gold on the ground; the sword's arc, homing bolts,
// spinning blades, the holy ring, lightning from the sky, axes wheeling over the crowd; the boss with its slam ring.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [];
let hint = null, V3 = null;
const ui = { stick: null, snap: true };
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 2.8) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function fxStep(dt) {
  FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 2.2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.3) TXT.shift();
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; }
}
// one merged, vertex-coloured shape per kind of monster: parts are [geometry, colour, x, y, z, sx, sy, sz]
function shape(parts) { const T = THREE, gs = parts.map(([g, col, x, y, z, sx = 1, sy = 1, sz = 1]) => { g = g.toNonIndexed(); g.scale(sx, sy, sz); g.translate(x, y, z); const n = g.attributes.position.count, a = new Float32Array(n * 3), c = new T.Color(col); for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3); g.setAttribute('color', new T.BufferAttribute(a, 3)); g.deleteAttribute('uv'); return g; });
  const geo = T.mergeGeometries(gs); geo.computeVertexNormals(); return geo; }
function foeGeo(k) {
  const T = THREE, S = (r, w = 10, h = 8) => new T.SphereGeometry(r, w, h), C = (r1, r2, h, n = 8) => new T.CylinderGeometry(r1, r2, h, n), B = (x, y, z) => new T.BoxGeometry(x, y, z), eye = 0xff3020;
  if (k === 'bat') return shape([[S(0.22), 0x2a2030, 0, 1.0, 0, 1, 0.9, 1.1], [B(0.5, 0.03, 0.25), 0x3a2840, -0.32, 1.05, 0], [B(0.5, 0.03, 0.25), 0x3a2840, 0.32, 1.05, 0], [S(0.04), eye, -0.08, 1.06, 0.2], [S(0.04), eye, 0.08, 1.06, 0.2]]);
  if (k === 'zombie') return shape([[C(0.22, 0.26, 0.75), 0x4a6a3a, 0, 0.75, 0], [S(0.2), 0x7a9a5a, 0, 1.3, 0.05], [C(0.06, 0.06, 0.5), 0x7a9a5a, -0.27, 1.0, 0.25, 1, 1, 1], [C(0.06, 0.06, 0.5), 0x7a9a5a, 0.27, 1.0, 0.25], [C(0.08, 0.08, 0.4), 0x3a3a2a, -0.1, 0.2, 0], [C(0.08, 0.08, 0.4), 0x3a3a2a, 0.1, 0.2, 0], [S(0.04), 0xffe060, -0.07, 1.33, 0.19], [S(0.04), 0xffe060, 0.07, 1.33, 0.19]]);
  if (k === 'skel' || k === 'archer') return shape([[C(0.16, 0.12, 0.6), 0xe8e4d8, 0, 0.8, 0], [S(0.19), 0xf0ece0, 0, 1.3, 0], [C(0.04, 0.04, 0.6), 0xe8e4d8, -0.06, 0.3, 0], [C(0.04, 0.04, 0.6), 0xe8e4d8, 0.06, 0.3, 0], [S(0.05), 0x111111, -0.07, 1.33, 0.16], [S(0.05), 0x111111, 0.07, 1.33, 0.16],
    ...(k === 'archer' ? [[B(0.05, 0.9, 0.05), 0x6a4a2a, 0.3, 0.95, 0.2], [C(0.2, 0.2, 0.3, 6), 0x5a2a2a, 0, 1.45, -0.02]] : [[B(0.06, 0.06, 0.7), 0x9a9aa0, 0.3, 0.9, 0.3]])]);
  if (k === 'ghost') return shape([[S(0.32, 12, 10), 0xc8d8ff, 0, 1.1, 0], [C(0.32, 0.12, 0.8, 12), 0xb8c8f0, 0, 0.55, 0], [S(0.06), 0x101030, -0.1, 1.15, 0.27], [S(0.06), 0x101030, 0.1, 1.15, 0.27]]);
  if (k === 'brute') return shape([[S(0.6, 12, 10), 0x7a5a4a, 0, 1.0, 0, 1, 1.1, 0.9], [S(0.28), 0x8a6a5a, 0, 1.75, 0.2], [C(0.18, 0.14, 0.9), 0x7a5a4a, -0.7, 0.9, 0.1], [C(0.18, 0.14, 0.9), 0x7a5a4a, 0.7, 0.9, 0.1], [C(0.16, 0.16, 0.5), 0x3a2a1a, -0.25, 0.25, 0], [C(0.16, 0.16, 0.5), 0x3a2a1a, 0.25, 0.25, 0], [S(0.05), eye, -0.1, 1.8, 0.45], [S(0.05), eye, 0.1, 1.8, 0.45], [C(0.12, 0.2, 0.9, 6), 0x5a4030, 0.85, 0.5, 0.4]]);
}
function bossModel(i) {
  const T = THREE, g = new T.Group(), M = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.6 }, o)), add = (geo, m, x, y, z) => { const o = new T.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
  const body = [0xd8d0c0, 0x4a6a3a, 0x6a6a70][i], eye = [0x40c0ff, 0x80ff40, 0xff6020][i];
  add(new T.CylinderGeometry(0.7, 1.0, 2.2, 10), M(body, i === 2 ? { metalness: 0.7, roughness: 0.35 } : {}), 0, 1.3, 0); add(new T.SphereGeometry(0.6, 14, 12), M(body), 0, 2.8, 0);
  for (const s of [-1, 1]) { add(new T.CylinderGeometry(0.2, 0.25, 1.6, 8), M(body), s * 1.0, 1.6, 0.2).rotation.z = s * 0.4; add(new T.SphereGeometry(0.12, 8, 6), M(eye, { emissive: eye, emissiveIntensity: 3 }), s * 0.22, 2.9, 0.5); }
  if (i === 0) for (let j = 0; j < 5; j++) add(new T.ConeGeometry(0.1, 0.5, 6), M(0xe8c040, { metalness: 0.8, roughness: 0.3 }), Math.sin(j * 1.25) * 0.45, 3.35, Math.cos(j * 1.25) * 0.45);
  if (i === 1) add(new T.ConeGeometry(0.7, 1.4, 10), M(0x2a3a20), 0, 3.6, 0);
  if (i === 2) add(new T.BoxGeometry(1.6, 0.4, 0.9), M(0x5a5a60, { metalness: 0.8 }), 0, 2.2, 0);
  return g;
}
function buildWorld() {
  if (V3) return V3; const T = THREE; if (!W3 || !W3.init({ canvas: $('gl'), fov: 46, far: 900, near: 0.3 })) { V3 = { none: true }; return V3; }
  const S = W3.scene, R0 = W3.rng(31);
  const groundM = new T.MeshStandardMaterial({ color: 0x3a4a32, roughness: 0.95, map: W3.grainTex(256, 9, 190, 55, 6) }); groundM.map.repeat.set(16, 16);
  const ground = new T.Mesh(new T.PlaneGeometry(200, 200), groundM); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; S.add(ground);
  // gravestones, dead trees, rocks (instanced); a broken fence round the clearing
  const stoneM = new T.MeshStandardMaterial({ color: 0x7a7a78, roughness: 0.9 }), d = new T.Object3D();
  const graves = new T.InstancedMesh(new T.BoxGeometry(0.7, 1.0, 0.18), stoneM, 60); for (let i = 0; i < 60; i++) { d.position.set((R0() - 0.5) * 2 * (HALF - 2), 0.4, (R0() - 0.5) * 2 * (HALF - 2)); d.rotation.set((R0() - 0.5) * 0.3, R0() * 0.6, (R0() - 0.5) * 0.3); d.scale.setScalar(0.7 + R0() * 0.6); d.updateMatrix(); graves.setMatrixAt(i, d.matrix); } graves.castShadow = graves.receiveShadow = true; S.add(graves);
  const treeG = new T.CylinderGeometry(0.12, 0.3, 4, 6); treeG.translate(0, 2, 0); const trees = new T.InstancedMesh(treeG, new T.MeshStandardMaterial({ color: 0x2a2018, roughness: 1 }), 50); for (let i = 0; i < 50; i++) { const a = R0() * TAU, r = HALF + 2 + R0() * 20; d.position.set(Math.sin(a) * r, 0, Math.cos(a) * r); d.rotation.set((R0() - 0.5) * 0.4, R0() * 6, (R0() - 0.5) * 0.4); d.scale.set(1, 0.6 + R0() * 0.8, 1); d.updateMatrix(); trees.setMatrixAt(i, d.matrix); } trees.castShadow = true; S.add(trees);
  const postM = new T.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 1 }), posts = []; for (let x = -HALF; x <= HALF; x += 3) posts.push([x, -HALF], [x, HALF]); for (let z = -HALF + 3; z < HALF; z += 3) posts.push([-HALF, z], [HALF, z]);
  const postI = new T.InstancedMesh(new T.BoxGeometry(0.2, 1.4, 0.2), postM, posts.length); posts.forEach(([x, z], i) => { d.position.set(x, 0.6, z); d.rotation.set((R0() - 0.5) * 0.4, 0, (R0() - 0.5) * 0.4); d.scale.setScalar(1); d.updateMatrix(); postI.setMatrixAt(i, d.matrix); }); S.add(postI);
  // the hero: a knight in silver with a red cape and a sword
  const hero = new T.Group(); { const M = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.4 }, o)), steel = M(0xc8ccd4, { metalness: 0.8, roughness: 0.3 });
    const body = new T.Mesh(new T.CapsuleGeometry(0.28, 0.5, 4, 10), steel); body.position.y = 0.85; const head = new T.Mesh(new T.SphereGeometry(0.24, 14, 12), steel); head.position.y = 1.45; const plume = new T.Mesh(new T.ConeGeometry(0.08, 0.35, 8), M(0xd82a2a)); plume.position.set(0, 1.75, -0.05);
    const cape = new T.Mesh(new T.PlaneGeometry(0.6, 0.9), M(0xb01818, { side: T.DoubleSide, roughness: 0.8 })); cape.position.set(0, 0.95, -0.3); cape.rotation.x = 0.2;
    const sword = new T.Mesh(new T.BoxGeometry(0.06, 0.06, 1.0), M(0xe8eef4, { metalness: 0.9, roughness: 0.2 })); sword.position.set(0.38, 0.9, 0.35); const visor = new T.Mesh(new T.BoxGeometry(0.3, 0.05, 0.05), M(0x111111)); visor.position.set(0, 1.47, 0.22);
    const legs = []; for (const x of [-0.12, 0.12]) { const l = new T.Mesh(new T.CapsuleGeometry(0.09, 0.35, 3, 8), steel); l.geometry.translate(0, -0.25, 0); l.position.set(x, 0.55, 0); hero.add(l); legs.push(l); }
    hero.add(body, head, plume, cape, sword, visor); hero.traverse(o => { if (o.isMesh) o.castShadow = true; }); hero.userData = { legs, cape, sword }; } S.add(hero);
  const heroLight = new T.PointLight(0xffd8a0, 45, 18, 1.3); S.add(heroLight); S.add(new T.AmbientLight(0x8090c0, 0.9));
  // monsters by kind (instanced), the boss, crystals and gold, arrows, the weapons' sights
  const foeM = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.7 }), ghostM = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.3, transparent: true, opacity: 0.6, emissive: 0x3040a0, emissiveIntensity: 0.4, depthWrite: false });
  const kinds = {}; for (const k of ['bat', 'zombie', 'skel', 'archer', 'ghost', 'brute']) { const m = new T.InstancedMesh(foeGeo(k), k === 'ghost' ? ghostM : foeM, 220); m.count = 0; m.castShadow = k !== 'ghost'; m.frustumCulled = false; m.setColorAt(0, new T.Color(1, 1, 1)); S.add(m); kinds[k] = m; }
  const bosses = [0, 1, 2].map(i => { const b = bossModel(i); b.visible = false; S.add(b); return b; });
  const gemI = new T.InstancedMesh(new T.OctahedronGeometry(0.16, 0), new T.MeshStandardMaterial({ color: 0x40a0ff, emissive: 0x2060ff, emissiveIntensity: 1.2, roughness: 0.2 }), 400); gemI.count = 0; gemI.frustumCulled = false; S.add(gemI);
  const coinI = new T.InstancedMesh(new T.CylinderGeometry(0.18, 0.18, 0.05, 12), new T.MeshStandardMaterial({ color: 0xf0c030, emissive: 0x806010, metalness: 0.8, roughness: 0.3 }), 60); coinI.count = 0; coinI.frustumCulled = false; S.add(coinI);
  const arrowI = new T.InstancedMesh(new T.BoxGeometry(0.06, 0.06, 0.8), new T.MeshStandardMaterial({ color: 0xffb060, emissive: 0xff6020, emissiveIntensity: 1 }), 80); arrowI.count = 0; arrowI.frustumCulled = false; S.add(arrowI);
  const glowT = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new T.CanvasTexture(c); })();
  const pool = (n, make) => { const a = []; for (let i = 0; i < n; i++) { const m = make(); m.visible = false; S.add(m); a.push(m); } return a; };
  const slashes = pool(4, () => { const m = new T.Mesh(new T.RingGeometry(0.5, 1, 24, 1, -1.1, 2.2), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending })); m.rotation.x = -Math.PI / 2; return m; });
  const bolts = pool(12, () => { const s = new T.Sprite(new T.SpriteMaterial({ map: glowT, color: 0xd0a0ff, transparent: true, depthWrite: false, blending: T.AdditiveBlending })); s.scale.set(0.9, 0.9, 1); return s; });
  const blades = pool(5, () => { const m = new T.Mesh(new T.BoxGeometry(0.7, 0.05, 0.16), new T.MeshStandardMaterial({ color: 0xe0f0ff, emissive: 0x6080ff, emissiveIntensity: 1, metalness: 0.8 })); return m; });
  const aura = new T.Mesh(new T.CircleGeometry(1, 40), new T.MeshBasicMaterial({ color: 0xffe080, transparent: true, opacity: 0.18, depthWrite: false, blending: T.AdditiveBlending })); aura.rotation.x = -Math.PI / 2; aura.visible = false; S.add(aura);
  const strikes = pool(6, () => { const m = new T.Mesh(new T.CylinderGeometry(0.12, 0.25, 14, 6), new T.MeshBasicMaterial({ color: 0xc0e0ff, transparent: true, opacity: 0.9, blending: T.AdditiveBlending, depthWrite: false })); return m; });
  const axes = pool(8, () => { const g = new T.Group(); const h = new T.Mesh(new T.BoxGeometry(0.06, 0.06, 0.7), new T.MeshStandardMaterial({ color: 0x6a4a2a })); const b = new T.Mesh(new T.BoxGeometry(0.05, 0.35, 0.3), new T.MeshStandardMaterial({ color: 0xc0c4cc, metalness: 0.8 })); b.position.set(0, 0, 0.3); g.add(h, b); return g; });
  const slamRing = new T.Mesh(new T.RingGeometry(3.7, 4, 48), new T.MeshBasicMaterial({ color: 0xff3020, transparent: true, opacity: 0.7, depthWrite: false, side: T.DoubleSide })); slamRing.rotation.x = -Math.PI / 2; slamRing.visible = false; S.add(slamRing);
  const beacons = [0, 1, 2].map(() => { const g = new T.Group(); const base = new T.Mesh(new T.CylinderGeometry(0.7, 0.9, 0.5, 10), stoneM); base.position.y = 0.25; const pole = new T.Mesh(new T.CylinderGeometry(0.12, 0.15, 2.2, 8), new T.MeshStandardMaterial({ color: 0x4a3a2a })); pole.position.y = 1.5; const bowl = new T.Mesh(new T.CylinderGeometry(0.6, 0.3, 0.4, 12), new T.MeshStandardMaterial({ color: 0x5a5a60, metalness: 0.7, roughness: 0.4 })); bowl.position.y = 2.7;
    const fire = new T.Sprite(new T.SpriteMaterial({ map: glowT, color: 0xff9030, transparent: true, depthWrite: false, blending: T.AdditiveBlending })); fire.position.y = 3.3; fire.scale.set(2.4, 3.2, 1); const ring = new T.Mesh(new T.RingGeometry(2.45, 2.6, 40), new T.MeshBasicMaterial({ color: 0xffc060, transparent: true, opacity: 0.5, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.05;
    const light = new T.PointLight(0xff9040, 0, 22, 1.4); light.position.y = 3.3; g.add(base, pole, bowl, fire, ring, light); g.traverse(o => { if (o.isMesh) o.castShadow = true; }); g.userData = { fire, ring, light }; S.add(g); return g; });
  V3 = { T, S, groundM, beacons, hero, heroLight, kinds, bosses, gemI, coinI, arrowI, slashes, bolts, blades, aura, strikes, axes, slamRing, glowT, cam: { x: 0, z: 0 }, place: -1, D: new T.Object3D(), col: new T.Color() };
  W3.setQuality(stepN); return V3;
}
function setScene(g) {
  const V = buildWorld(); if (V.none) return; if (V.sky !== g.weather) { V.sky = g.weather; W3.setSky(g.weather, { azim: 120 }); W3.scene.environmentIntensity = 1.3; W3.S.onBolt = () => { if (!HEADLESS && sfx.thunder) setTimeout(() => sfx.thunder(), 300 + Math.random() * 600); }; }
  if (V.place !== g.place) { V.place = g.place; V.groundM.color.setHex(PLACES[g.place].ground); }
}
const SV = new (window.THREE ? THREE.Vector3 : Object)();
function scr(x, y, z) { if (!V3 || V3.none) return { x: W / 2 + x * 16, y: H / 2 + z * 16, front: true }; SV.set(x, y, z); return W3.screen(SV); }
let killN = 0, killT = 0;
function onEvent(G, e) {
  const cx = W / 2, cy = H * 0.34;
  switch (e.k) {
    case 'swing': if (!HEADLESS) sfx.swing(); break;
    case 'zap': if (!HEADLESS) sfx.zap(); break;
    case 'thunder': if (!HEADLESS) sfx.crack(); FX.flash = Math.max(FX.flash, 0.15); break;
    case 'throw': if (!HEADLESS) sfx.whoosh(); break;
    case 'kill': if (G.t - killT > 0.6) killN = 0; killT = G.t; if (!HEADLESS) sfx.pop(killN++); if (e.elite) { FX.shake = 6; say('ELITE DOWN!', cx, cy, '#ffd36a', 22); } if (killN === 25) say('MASSACRE!', cx, cy, '#ffd36a', 28); break;
    case 'gem': if (!HEADLESS) sfx.gem(); break;
    case 'gold': if (!HEADLESS) sfx.coin(2); break;
    case 'hurt': FX.red = Math.min(1, FX.red + 0.35); FX.shake = Math.max(FX.shake, 4); if (!HEADLESS) sfx.hurt(); vibe(HAP.tick); if (e.why === 'arrow') tip('arrow', 'Archers draw first: step out of the red line', 2.6); break;
    case 'draw': if (!HEADLESS) sfx.draw(); tip('draw', 'An archer is drawing: step out of the red line!', 2.4); break;
    case 'arrow': if (!HEADLESS) sfx.arrow(); break;
    case 'levelup': sfx.levelup(); vibe(HAP.light); FX.flash = 0.4; break;
    case 'pick': sfx.click(); say(e.o.w ? `${WEAPONS[e.o.w].name.toUpperCase()}${e.o.lv > 1 ? ' ' + e.o.lv : ''}!` : `${PASSIVES[e.o.p].name.toUpperCase()}!`, cx, H * 0.45, '#ffd36a', 26); break;
    case 'boss': sfx.boss(); FX.shake = 12; vibe(HAP.thud); say(`${e.name.toUpperCase()} COMES`, cx, cy, '#ff8a6a', 30); tip('boss', 'Its red ring is a slam: get out before it lands', 3); break;
    case 'raise': sfx.raise(); break;
    case 'slam': sfx.slam(); FX.shake = 16; vibe(HAP.thud); break;
    case 'volley': sfx.volley(); break;
    case 'bossdown': sfx.bossdown(); FX.flash = 1; FX.shake = 18; FX.stop = 0.15; vibe(HAP.best); say('THE BOSS FALLS!', cx, cy, '#ffd36a', 32); break;
    case 'revive': sfx.levelup(); FX.flash = 1; say('RISE AGAIN!', cx, cy, '#ffd36a', 30); break;
    case 'lit': sfx.lit(); FX.flash = 0.5; vibe(HAP.light); say(e.n >= e.of ? 'ALL BEACONS LIT!' : `BEACON ${e.n} OF ${e.of} LIT`, cx, cy, '#ffd36a', 26); if (e.n < e.of) tip('lit', 'The light draws them: get away, then find the next beacon', 2.8); break;
    case 'gather': sfx.gather(); tip('gather', 'Standing still: the horde gathers round you. Keep moving!', 3); break;
    case 'lessonnext': if (e.first) hint = null; say(e.first ? 'FIRST, A LESSON' : 'NEXT LESSON', cx, H * 0.5, '#ffd36a', 26); sfx.ding(); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, cx, H * 0.5, '#9be3b5', 26); sfx.coin(e.n); break;
    case 'lessonmiss': hint = { txt: e.how, t: 0, secs: 3.4 }; break;
    case 'lessondone': say('NOW SURVIVE THE NIGHT!', cx, H * 0.5, '#ffd36a', 26); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); vibe(HAP.best); break;
    case 'lost': sfx.lose(); FX.red = 1; say('YOU FELL', cx, cy, '#ffb4a8', 32); break;
  }
}
let IG = null; function idleG() { if (!IG || IG.over || IG.clock > 50) { IG = newGame(Math.max(5, store.get('level', 1) | 0), { seed: (Math.random() * 1e6) | 0 }); IG.mem = {}; IG.me.hp = IG.me.max = 1e9; IG.weapons = { sword: 2, bolt: 2, orbit: 2 }; } if (IG.choice) choose(IG, 0); honest(IG, { react: 0.15, acc: 0.99 }, IG.mem); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#10141f'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D night.', W / 2, H / 2); return; }
  const g = G || idleG(), t = now, me = g.me, D = V.D, col = V.col; setScene(g);
  // the hero
  const h = V.hero, run = Math.min(1, Math.hypot(me.vx, me.vz) / 5); h.position.set(me.x, 0, me.z); h.rotation.y = me.face; h.visible = !(me.inv > 0 && Math.sin(t * 40) > 0);
  h.userData.legs.forEach((l, i) => l.rotation.x = Math.sin(t * 12 + i * Math.PI) * 0.7 * run); h.userData.cape.rotation.x = 0.2 + run * 0.5 + Math.sin(t * 8) * 0.05;
  V.heroLight.position.set(me.x, 3, me.z);
  // monsters
  const cnt = {}; for (const k in V.kinds) cnt[k] = 0; V.bosses.forEach(b => b.visible = false);
  for (const f of g.foes) { if (f.k === 'boss') { const b = V.bosses[(g.N - 1) % 3]; b.visible = true; b.position.set(f.x, 0, f.z); b.rotation.y = Math.atan2(me.x - f.x, me.z - f.z); b.scale.setScalar(1 + (f.slam > 0 ? 0.08 * Math.sin(t * 30) : 0)); continue; }
    const m = V.kinds[f.k]; if (!m || cnt[f.k] >= 220) continue; const i = cnt[f.k]++, s = f.elite ? 1.4 : 1;
    D.position.set(f.x, (f.k === 'bat' ? Math.sin(t * 9 + f.wob) * 0.25 : f.k === 'ghost' ? Math.sin(t * 3 + f.wob) * 0.15 : Math.abs(Math.sin(t * 6 + f.wob)) * 0.06), f.z); D.rotation.set(0, Math.atan2(me.x - f.x, me.z - f.z) + (f.k === 'zombie' ? Math.sin(t * 2 + f.wob) * 0.2 : 0), f.k === 'bat' ? Math.sin(t * 20 + f.wob) * 0.3 : 0); D.scale.setScalar(s); D.updateMatrix(); m.setMatrixAt(i, D.matrix);
    col.setRGB(1, 1, 1); if (f.hit > 0) col.setRGB(3, 3, 3); else if (f.elite) col.setRGB(1.4, 0.9, 0.5); else if (f.slow > 0) col.setRGB(0.7, 0.9, 1.4); m.setColorAt(i, col); }
  for (const k in V.kinds) { const m = V.kinds[k]; m.count = cnt[k]; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }
  // crystals, gold, arrows
  let gi = 0, ci = 0; for (const q of g.gems) { if (q.gold) { if (ci >= 60) continue; D.position.set(q.x, 0.3, q.z); D.rotation.set(Math.PI / 2, 0, t * 4); D.scale.setScalar(1); D.updateMatrix(); V.coinI.setMatrixAt(ci++, D.matrix); } else { if (gi >= 400) continue; D.position.set(q.x, 0.3 + Math.sin(t * 3 + q.x) * 0.06, q.z); D.rotation.set(0, t * 2, 0); D.scale.setScalar(q.v > 3 ? 1.6 : q.v > 1 ? 1.25 : 1); D.updateMatrix(); V.gemI.setMatrixAt(gi++, D.matrix); } }
  V.gemI.count = gi; V.coinI.count = ci; V.gemI.instanceMatrix.needsUpdate = V.coinI.instanceMatrix.needsUpdate = true;
  let ai = 0; for (const s of g.shots) { if (ai >= 80) break; D.position.set(s.x, 1, s.z); D.rotation.set(0, Math.atan2(s.vx, s.vz), 0); D.scale.setScalar(s.boss ? 2 : 1); D.updateMatrix(); V.arrowI.setMatrixAt(ai++, D.matrix); } V.arrowI.count = ai; V.arrowI.instanceMatrix.needsUpdate = true;
  // weapons
  let si = 0, bi = 0, ki = 0, xi = 0; V.slashes.forEach(m => m.visible = false); V.bolts.forEach(m => m.visible = false); V.strikes.forEach(m => m.visible = false); V.axes.forEach(m => m.visible = false);
  for (const p of g.fx) { if (p.k === 'slash' && si < 4) { const m = V.slashes[si++]; m.visible = true; m.position.set(p.x, 0.9, p.z); m.rotation.set(-Math.PI / 2, 0, p.a - Math.PI / 2); m.scale.setScalar(p.r * (0.7 + p.t * 1.2)); m.material.opacity = 0.75 * (1 - p.t / 0.3); }
    if (p.k === 'bolt' && bi < 12) { const m = V.bolts[bi++]; m.visible = true; m.position.set(p.x, 1, p.z); }
    if (p.k === 'strike' && ki < 6) { const m = V.strikes[ki++]; m.visible = true; m.position.set(p.x, 7, p.z); m.material.opacity = 1 - p.t / 0.3; }
    if (p.k === 'axe' && xi < 8) { const m = V.axes[xi++]; m.visible = true; m.position.set(p.x, 1 + Math.sin(p.t / 1.2 * Math.PI) * 2.5, p.z); m.rotation.set(t * 14, Math.atan2(p.vx, p.vz), 0); m.scale.setScalar(p.big ? 1.6 : 1); } }
  V.blades.forEach((m, i) => { const n = g.weapons.orbit || 0; m.visible = i < n; if (!m.visible) return; const r = 2.2 + ((g.weapons.orbit || 0) >= 4 ? 0.6 : 0), a = (g.orbA || 0) + i * TAU / n; m.position.set(me.x + Math.sin(a) * r, 0.9, me.z + Math.cos(a) * r); m.rotation.y = a + Math.PI / 2; });
  { const l = g.weapons.aura || 0; V.aura.visible = l > 0; if (l) { const r = 1.8 + (l >= 2 ? 0.4 : 0) + (l >= 4 ? 0.4 : 0); V.aura.position.set(me.x, 0.05, me.z); V.aura.scale.setScalar(r * (1 + Math.sin(t * 5) * 0.04)); } }
  { const b = g.foes.find(f => f.slam > 0); V.slamRing.visible = !!b; if (b) { V.slamRing.position.set(b.sx, 0.06, b.sz); V.slamRing.material.opacity = 0.4 + 0.5 * Math.sin(t * 20) ** 2; } }
  // the beacons
  V.beacons.forEach((m, i) => { const b = g.beacons[i]; m.visible = !!b; if (!b) return; m.position.set(b.x, 0, b.z); const u = m.userData; u.fire.visible = b.lit || b.p > 0; u.fire.material.opacity = b.lit ? 0.9 + 0.1 * Math.sin(t * 9 + i) : b.p * 0.6; u.fire.scale.set(2.4 * (b.lit ? 1 : 0.5 + b.p * 0.5), 3.2 * (b.lit ? 1 + 0.08 * Math.sin(t * 7) : 0.5 + b.p * 0.5), 1); u.light.intensity = b.lit ? 60 : b.p * 20; u.ring.material.color.setHex(b.lit ? 0xffd080 : 0x80b0ff); u.ring.material.opacity = b.lit ? 0.25 : 0.4 + 0.3 * Math.sin(t * 4); });
  // the camera: above and behind the hero
  const C = V.cam, e = ui.snap ? 1 : 1 - Math.exp(-dt * 6); ui.snap = false; C.x += (me.x - C.x) * e; C.z += (me.z - C.z) * e;
  const cam = W3.cam, asp = innerWidth / innerHeight, back = asp < 0.7 ? 1 : 0.85; cam.fov = 46; cam.updateProjectionMatrix(); cam.position.set(C.x, 20 * back, C.z + 10 * back); cam.lookAt(C.x, 0, C.z - 0.5);
  if (FX.shake > 0) { cam.position.x += (Math.random() - 0.5) * FX.shake * 0.03; cam.position.z += (Math.random() - 0.5) * FX.shake * 0.03; }
  W3.setFocus(C.x, 0, C.z, 16); W3.render(dt);
  marks(g, t);
  if (G) hud(G, t);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 0.9 ? 1 : 1 - (t2.t - 0.9) / 0.4; ctx.globalAlpha = Math.max(0, al); ctx.font = `${Math.round(t2.size * k)}px ${TF}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 26); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 26); }
  ctx.globalAlpha = 1;
  if (hint && !(G && G.choice)) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 18 * k, hh = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30;
    ctx.fillStyle = 'rgba(0,0,0,.7)'; rrect(W / 2 - w / 2, H * 0.66 - hh / 2, w, hh, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.66 - hh / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { const gr = ctx.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, H * 0.7); gr.addColorStop(0, 'rgba(200,0,0,0)'); gr.addColorStop(1, `rgba(200,0,0,${FX.red * 0.45})`); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,245,220,${FX.flash * 0.25})`; ctx.fillRect(0, 0, W, H); }
  if (G && G.choice) choiceCards(G, t);
}
// on the ground and in the air: archers' red lines, damage numbers, the hero's health
function marks(g, t) {
  ctx.lineCap = 'round';
  // beacons: a ring filling while you light one; arrows at the edge to those you cannot see
  for (const b of g.beacons) { const s = scr(b.x, 3.8, b.z); if (!b.lit && b.p > 0) { ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 7 * k; ctx.beginPath(); ctx.arc(s.x, s.y, 18 * k, 0, TAU); ctx.stroke(); ctx.strokeStyle = '#ffb040'; ctx.lineWidth = 5 * k; ctx.beginPath(); ctx.arc(s.x, s.y, 18 * k, -Math.PI / 2, -Math.PI / 2 + TAU * b.p); ctx.stroke(); }
    if (b.lit || (s.front && s.x > 16 && s.x < W - 16 && s.y > 70 * k && s.y < H - 20)) continue; const m2 = scr(g.me.x, 1, g.me.z), ax = clamp(s.x, 24, W - 24), ay = clamp(s.y, 90 * k, H - 30 * k), an = Math.atan2(ay - m2.y, ax - m2.x);
    ctx.save(); ctx.translate(ax, ay); ctx.rotate(an); ctx.fillStyle = '#ffb040'; ctx.beginPath(); ctx.moveTo(14 * k, 0); ctx.lineTo(-6 * k, -9 * k); ctx.lineTo(-6 * k, 9 * k); ctx.closePath(); ctx.fill(); ctx.restore(); ctx.font = `${Math.round(14 * k)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('🔥', ax - Math.cos(an) * 18 * k, ay - Math.sin(an) * 18 * k); }
  for (const f of g.foes) if (f.draw > 0) { const a = scr(f.x, 0.1, f.z), b = scr(f.x + Math.sin(f.aim) * 12, 0.1, f.z + Math.cos(f.aim) * 12); ctx.strokeStyle = `rgba(255,40,30,${0.35 + 0.4 * (1 - f.draw / 0.9)})`; ctx.lineWidth = 6 * k; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `700 ${Math.round(11 * k)}px ${BC}`;
  for (const p of g.fx) if (p.k === 'num') { const s = scr(p.x, 1.6 + p.t * 2, p.z); ctx.globalAlpha = 1 - p.t / 0.6; ctx.fillStyle = '#fff'; ctx.fillText(p.v, s.x, s.y); } ctx.globalAlpha = 1;
  const me = g.me, s = scr(me.x, 2.1, me.z), w = 40 * k, u = clamp(me.hp / me.max, 0, 1); ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(s.x - w / 2 - 1, s.y - 1, w + 2, 6 * k + 2); ctx.fillStyle = u > 0.5 ? '#6ad06a' : u > 0.25 ? '#e8b04a' : '#e04a3a'; ctx.fillRect(s.x - w / 2, s.y, w * u, 6 * k);
  const b = g.foes.find(f => f.k === 'boss'); if (b) { const bs = scr(b.x, 3.8, b.z), bw = 90 * k; ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(bs.x - bw / 2 - 1, bs.y - 1, bw + 2, 8 * k + 2); ctx.fillStyle = '#c03ad0'; ctx.fillRect(bs.x - bw / 2, bs.y, bw * clamp(b.hp / b.max, 0, 1), 8 * k); }
}
function hud(G, t) {
  const c = G.cfg, me = G.me;
  // the experience bar across the top, the level
  const y = 8 * k, bw = W - 16; ctx.fillStyle = 'rgba(0,0,0,.55)'; rrect(8, y, bw, 10 * k, 5); ctx.fill(); ctx.fillStyle = '#3a8aff'; rrect(8, y, Math.max(8, bw * clamp(me.xp / me.need, 0, 1)), 10 * k, 5); ctx.fill();
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.font = `${Math.round(18 * k)}px ${TF}`; ctx.fillStyle = '#fff'; const lv = `LV ${me.lv}`; ctx.strokeText(lv, 12, y + 26 * k); ctx.fillText(lv, 12, y + 26 * k);
  ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = '#ffd36a'; ctx.strokeText(`💀 ${G.kills}   🪙 ${G.gold}`, 12, y + 46 * k); ctx.fillText(`💀 ${G.kills}   🪙 ${G.gold}`, 12, y + 46 * k);
  // the clock to the boss
  if (!G.lesson) { ctx.textAlign = 'right'; ctx.font = `${Math.round(20 * k)}px ${TF}`; const lit = G.beacons.filter(b => b.lit).length, ts = G.boss || G.bossDown ? 'BOSS!' : `🔥 ${lit}/${G.beacons.length}`; ctx.fillStyle = G.boss ? '#ff8a6a' : '#ffd36a'; ctx.strokeText(ts, W - 12, y + 28 * k); ctx.fillText(ts, W - 12, y + 28 * k); }
  // weapons carried
  const items = Object.keys(G.weapons).map(w => WEAPONS[w].icon + G.weapons[w]).concat(Object.keys(G.pass).map(p => PASSIVES[p].icon + G.pass[p])); ctx.textAlign = 'right'; ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillStyle = '#fff'; ctx.strokeText(items.join(' '), W - 12, y + 50 * k); ctx.fillText(items.join(' '), W - 12, y + 50 * k);
  if (G.lesson) lessonPanel(G);
  const st = ui.stick; if (st) { ctx.globalAlpha = 0.45; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(st.x0, st.y0, 46 * k, 0, TAU); ctx.stroke(); ctx.globalAlpha = 0.8; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(st.x0 + clamp(st.x - st.x0, -46 * k, 46 * k), st.y0 + clamp(st.y - st.y0, -46 * k, 46 * k), 18 * k, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
  if (G.N <= 3 && G.t < 6 && !G.lesson) { ctx.textAlign = 'center'; ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = '#fff'; ctx.strokeText('DRAG TO MOVE · YOU ATTACK BY YOURSELF', W / 2, H - 60 * k); ctx.fillText('DRAG TO MOVE · YOU ATTACK BY YOURSELF', W / 2, H - 60 * k); }
}
// the level-up: three cards to pick from
function cardRects(G) { const n = G.choice.opts.length, cw = Math.min(W - 40, 320 * k), ch = 92 * k, gap = 12 * k, top = H / 2 - (n * ch + (n - 1) * gap) / 2 + 20 * k; return G.choice.opts.map((o, i) => ({ x: W / 2 - cw / 2, y: top + i * (ch + gap), w: cw, h: ch, o })); }
function choiceCards(G, t) {
  ctx.fillStyle = 'rgba(8,6,16,.72)'; ctx.fillRect(0, 0, W, H); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const rs = cardRects(G); ctx.font = `${Math.round(30 * k)}px ${TF}`; ctx.fillStyle = '#ffd36a'; ctx.fillText('LEVEL UP!', W / 2, rs[0].y - 40 * k); ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = '#fff'; ctx.fillText('Pick one', W / 2, rs[0].y - 16 * k);
  for (const r of rs) { const o = r.o, isW = !!o.w, X = isW ? WEAPONS[o.w] : PASSIVES[o.p], isNew = isW ? !G.weapons[o.w] : !G.pass[o.p];
    ctx.fillStyle = isW ? 'rgba(40,36,70,.96)' : 'rgba(30,50,40,.96)'; rrect(r.x, r.y, r.w, r.h, 14); ctx.fill(); ctx.strokeStyle = isNew ? '#ffd36a' : 'rgba(255,255,255,.4)'; ctx.lineWidth = 2.5; rrect(r.x, r.y, r.w, r.h, 14); ctx.stroke();
    ctx.font = `${Math.round(34 * k)}px sans-serif`; ctx.fillText(X.icon, r.x + 40 * k, r.y + r.h / 2); ctx.textAlign = 'left'; ctx.font = `${Math.round(18 * k)}px ${TF}`; ctx.fillStyle = '#fff'; ctx.fillText(`${X.name}${isNew ? '' : '  ' + o.lv}`, r.x + 78 * k, r.y + 26 * k);
    if (isNew) { ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.fillStyle = '#ffd36a'; ctx.fillText('NEW', r.x + r.w - 40 * k, r.y + 26 * k); }
    ctx.font = `700 ${Math.round(12.5 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.85)'; wrapText(isW ? X.desc[o.lv - 1] : X.desc, r.w - 92 * k).slice(0, 2).forEach((l, i) => ctx.fillText(l, r.x + 78 * k, r.y + 52 * k + i * 16 * k)); ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; }
}
function cardAt(G, x, y) { if (!G.choice) return -1; return cardRects(G).findIndex(r => x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h); }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) {
  const D = G.lesson, st = D.steps[D.i], x = 14, w = W - 28, y = 80 * k; ctx.save();
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; const lines = wrapText(st.how, w - 24), h = 54 * k + lines.length * 17 * k;
  ctx.fillStyle = 'rgba(0,0,0,.66)'; rrect(x, y, w, h, 12); ctx.fill(); ctx.strokeStyle = 'rgba(255,211,106,.7)'; ctx.lineWidth = 2; rrect(x, y, w, h, 12); ctx.stroke();
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#ffd36a'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillText(`LESSON ${G.N} OF 3`, x + 12, y + 10 * k);
  ctx.fillStyle = '#fff'; ctx.font = `${Math.round(18 * k)}px ${TF}`; ctx.fillText(st.title, x + 12, y + 25 * k);
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.9)'; lines.forEach((l, i) => ctx.fillText(l, x + 12, y + 48 * k + i * 17 * k));
  ctx.restore(); ctx.textBaseline = 'middle';
}
