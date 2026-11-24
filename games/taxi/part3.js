
// ===================== THE VIEW: Taxi Driver in 3D (three.js; light and weather from tools/world3d.js) =====================
// A city of blocks seen from just behind your taxi. Roads with two lanes each way, traffic lights on the corners, road works,
// a fountain square. The one waiting for you waves on the kerb under a green beam; their door has a gold one. The road glows
// before each junction (the TURN ZONE) and a big arrow over the junction shows the GPS way. On top: the meter, the map.
const FX = { shake: 0, stop: 0, flash: 0, red: 0, slow: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { snap: true, cam: null, banner: null, off: [0, 0], yaw: null };
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 160) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: 0.5 + Math.random() * 0.4, col, r: (1.5 + Math.random() * 2.5) * k }); } if (PARTS.length > 240) PARTS.splice(0, PARTS.length - 240); }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2.5); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.4) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (ui.banner) { ui.banner.t += dt; if (ui.banner.t > (ui.banner.secs || 1)) ui.banner = null; }
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; } }
function mySkin() { if (typeof HEADLESS !== 'undefined' && HEADLESS) return SKINS[0]; const id = store.get('skin', 'yellow'); return SKINS.find(q => q.id === id) || SKINS[0]; }
// a place on a road: x, z in the world (north is -z), and the heading's yaw
const DX = h => DIRS[h][0], DZ = h => -DIRS[h][1];
const yawOf = h => Math.atan2(DX(h), DZ(h));
function wp(i, j, h, s, lx) { const r = (h + 1) % 4; return { x: i * BL + DX(h) * s + DX(r) * lx, z: -j * BL + DZ(h) * s + DZ(r) * lx }; }
function canvasTex(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
function buildWorld() {
  if (V3) return V3; const T = window.THREE; if (!T || !W3 || !W3.init({ canvas: $('gl'), fov: 58, far: 2500, near: 0.2 })) { V3 = { none: true }; return V3; }
  V3 = { T, S: W3.scene, built: null, t: 0, uNight: { value: 0 } }; const V = V3;
  V.boxG = new T.BoxGeometry(1, 1, 1); V.sphG = new T.SphereGeometry(1, 12, 8); V.cylG = new T.CylinderGeometry(1, 1, 1, 14);
  V.ground = new T.Mesh(new T.PlaneGeometry(3000, 3000), new T.MeshStandardMaterial({ color: 0x46494f, roughness: 0.85, map: W3.grainTex(256, 9, 170, 45, 8) })); V.ground.material.map.wrapS = V.ground.material.map.wrapT = T.RepeatWrapping; V.ground.material.map.repeat.set(400, 400); V.ground.rotation.x = -Math.PI / 2; V.ground.position.y = 0; V.ground.receiveShadow = true; V.S.add(V.ground);
  V.pave = new T.MeshStandardMaterial({ color: 0xb8b2a6, roughness: 0.9, map: W3.grainTex(256, 13, 200, 30, 4) });
  V.white = new T.MeshStandardMaterial({ color: 0xf0f0ea, roughness: 0.6 }); V.yellowL = new T.MeshStandardMaterial({ color: 0xf6c21a, roughness: 0.6 });
  V.bld = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75, metalness: 0.05 });
  V.bld.onBeforeCompile = sh => { sh.uniforms.uNight = V.uNight;
    sh.vertexShader = 'varying vec3 vWP; varying vec3 vWN;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n#ifdef USE_INSTANCING\n vWP = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz; vWN = normalize(mat3(modelMatrix * instanceMatrix) * objectNormal);\n#else\n vWP = (modelMatrix * vec4(transformed, 1.0)).xyz; vWN = normalize(mat3(modelMatrix) * objectNormal);\n#endif');
    sh.fragmentShader = 'uniform float uNight; varying vec3 vWP; varying vec3 vWN;\n' + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      float side = step(abs(vWN.y), 0.5); vec2 q = vec2(abs(vWN.x) > 0.5 ? vWP.z : vWP.x, vWP.y); vec2 cell = q / vec2(2.7, 3.3); vec2 f = fract(cell);
      float win = side * step(0.2, f.x) * step(f.x, 0.8) * step(0.22, f.y) * step(f.y, 0.78) * step(3.4, vWP.y);
      float hh = fract(sin(dot(floor(cell), vec2(12.9898, 78.233))) * 43758.5453);
      float shop = side * step(vWP.y, 2.9) * step(0.6, vWP.y) * step(0.12, fract(q.x / 6.0)) * step(fract(q.x / 6.0), 0.88);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.1, 0.13, 0.18) + 0.12 * hh, max(win, shop * 0.85));`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n roughnessFactor = mix(roughnessFactor, 0.12, max(win, shop));')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += (win * step(0.5, hh) + shop * 0.8) * uNight * vec3(1.0, 0.82, 0.5) * 1.3;'); };
  V.carMats = [0xd8322a, 0x2a6ad8, 0xeeeeee, 0x22262e, 0x2f9a4a, 0x8a8f98, 0x7a3ab8].map(c => new T.MeshPhysicalMaterial({ color: c, roughness: 0.3, clearcoat: 0.8 }));
  V.tyre = new T.MeshStandardMaterial({ color: 0x18191c, roughness: 0.8 }); V.glass = new T.MeshPhysicalMaterial({ color: 0x15202c, roughness: 0.08, metalness: 0.2, clearcoat: 1 });
  V.skinM = [0x8d5524, 0xc68642, 0xe0ac69, 0x5a3825, 0xf1c27d].map(c => new T.MeshStandardMaterial({ color: c, roughness: 0.6 })); V.clothM = [0xe8463c, 0x2f7de0, 0x2fb060, 0xf2c230, 0x8a4fd0, 0xf07a2a, 0x22b8c8, 0xe85aa0].map(c => new T.MeshStandardMaterial({ color: c, roughness: 0.75 }));
  V.taxi = makeTaxi(V); V.S.add(V.taxi.g);
  V.cars = []; for (let i = 0; i < 26; i++) { const c = makeCar(V, i); c.g.visible = false; V.S.add(c.g); V.cars.push(c); }
  V.onc = []; for (let i = 0; i < 4; i++) { const c = makeCar(V, i + 3); V.S.add(c.g); V.onc.push({ c, s: i * 16, lane: i % 2 }); }
  V.hailer = makePerson(V, 0); V.S.add(V.hailer.g); V.rider = makePerson(V, 3); V.S.add(V.rider.g); V.rider.g.visible = false;
  // the beams over the goal, the ring on the road, the arrow over the junction, the turn zone glow
  V.beam = new T.Mesh(new T.CylinderGeometry(1.4, 1.4, 60, 20, 1, true), new T.MeshBasicMaterial({ color: 0x40ff80, transparent: true, opacity: 0.22, depthWrite: false, side: T.DoubleSide })); V.S.add(V.beam);
  V.ring = new T.Mesh(new T.RingGeometry(2.4, 3.0, 32), new T.MeshBasicMaterial({ color: 0x40ff80, transparent: true, opacity: 0.8, depthWrite: false })); V.ring.rotation.x = -Math.PI / 2; V.S.add(V.ring);
  const arrowShape = new T.Shape(); arrowShape.moveTo(-0.5, -1.6); arrowShape.lineTo(0.5, -1.6); arrowShape.lineTo(0.5, 0.2); arrowShape.lineTo(1.2, 0.2); arrowShape.lineTo(0, 1.6); arrowShape.lineTo(-1.2, 0.2); arrowShape.lineTo(-0.5, 0.2); arrowShape.closePath();
  V.arrowG = new T.ExtrudeGeometry(arrowShape, { depth: 0.3, bevelEnabled: false }); V.arrow = new T.Mesh(V.arrowG, new T.MeshBasicMaterial({ color: 0x40ff80, toneMapped: false })); V.S.add(V.arrow);
  V.qArrow = new T.Mesh(V.arrowG, new T.MeshBasicMaterial({ color: 0xffd040, toneMapped: false, transparent: true, opacity: 0.85 })); V.qArrow.scale.setScalar(1.5); V.S.add(V.qArrow);
  V.zone = new T.Mesh(new T.PlaneGeometry(7.2, ZONE), new T.MeshBasicMaterial({ map: canvasTex(64, 256, (c, w, h) => { c.clearRect(0, 0, w, h); for (let y = 0; y < h; y += 32) { c.fillStyle = 'rgba(255,214,64,.9)'; c.beginPath(); c.moveTo(8, y + 26); c.lineTo(32, y + 6); c.lineTo(56, y + 26); c.lineTo(46, y + 26); c.lineTo(32, y + 14); c.lineTo(18, y + 26); c.closePath(); c.fill(); } }), transparent: true, opacity: 0.5, depthWrite: false, toneMapped: false }));
  V.zone.rotation.x = -Math.PI / 2; V.zone.material.map.wrapT = T.RepeatWrapping; V.zone.material.map.repeat.set(1, ZONE / 8); V.zoneG = new T.Group(); V.zoneG.add(V.zone); V.S.add(V.zoneG);
  V.flood = new T.DirectionalLight(0xffe8c8, 0); V.flood.position.set(30, 60, 10); V.S.add(V.flood);
  V.head = new T.SpotLight(0xfff4d0, 0, 60, 0.5, 0.6, 1); V.S.add(V.head); V.S.add(V.head.target);
  W3.setQuality(stepN); return V; }
function makeTaxi(V) { const T = V.T, g = new T.Group(), body = new T.Group(); g.add(body);
  const paint = new T.MeshPhysicalMaterial({ color: mySkin().col, roughness: 0.3, clearcoat: 0.9, clearcoatRoughness: 0.15 });
  const B = (w, h, d, x, y, z, m) => { const ms = new T.Mesh(V.boxG, m); ms.scale.set(w, h, d); ms.position.set(x, y, z); ms.castShadow = true; body.add(ms); return ms; };
  const tglass = new T.MeshPhysicalMaterial({ color: 0x2a3a4c, roughness: 0.08, metalness: 0.2, clearcoat: 1, transparent: true, opacity: 0.42, depthWrite: false });      // you can see who is on the back seat
  B(1.9, 0.72, 4.6, 0, 0.66, 0, paint); const cabin = B(1.66, 0.52, 2.3, 0, 1.28, -0.2, tglass); cabin.castShadow = false; cabin.renderOrder = 3; B(1.72, 0.1, 2.1, 0, 1.58, -0.25, paint);
  // the back seat and its passenger (shown while a fare is aboard); the kerb-side rear door, hinged at its front edge (the kerb side is -x: the model faces +z)
  B(1.5, 0.3, 0.5, 0, 1.12, -1.05, new T.MeshStandardMaterial({ color: 0x3a2a22, roughness: 0.9 }));
  const pax = new T.Group(); { const pb = new T.Mesh(new T.CapsuleGeometry(0.2, 0.22, 3, 8), V.clothM[3]); pb.position.y = 1.02; const ph = new T.Mesh(V.sphG, V.skinM[0]); ph.scale.setScalar(0.13); ph.position.y = 1.36; pax.add(pb, ph); pax.position.set(-0.42, 0, -0.75); pax.visible = false; body.add(pax); pax.userData = { pb, ph }; }
  const door = new T.Group(); { const dp = new T.Mesh(V.boxG, paint); dp.scale.set(0.07, 0.62, 1.05); dp.position.set(0, 0, -0.525); dp.castShadow = true; const dw = new T.Mesh(V.boxG, tglass); dw.scale.set(0.05, 0.42, 0.9); dw.position.set(0, 0.52, -0.5); door.add(dp, dw); door.position.set(-0.985, 0.7, 0.18); body.add(door); } for (const sx of [-0.8, 0.8]) B(0.08, 0.5, 0.1, sx, 1.28, 0.9, paint);
  const check = new T.MeshStandardMaterial({ map: canvasTex(128, 16, (c, w, h) => { for (let x = 0; x < w; x += 8) for (let y = 0; y < h; y += 8) { c.fillStyle = ((x + y) / 8) % 2 ? '#111' : '#fff'; c.fillRect(x, y, 8, 8); } }) });
  B(1.92, 0.14, 4.0, 0, 0.82, 0, check);
  const sign = new T.Mesh(V.boxG, new T.MeshStandardMaterial({ map: canvasTex(128, 40, (c, w, h) => { c.fillStyle = '#fff6c0'; c.fillRect(0, 0, w, h); c.fillStyle = '#111'; c.font = '900 30px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('TAXI', w / 2, h / 2 + 2); }), emissive: 0xfff0a0, emissiveIntensity: 0.4 }));
  sign.scale.set(0.9, 0.3, 0.32); sign.position.set(0, 1.76, -0.1); body.add(sign); V.signM = sign.material;
  for (const sx of [-0.7, 0.7]) { const hl = new T.Mesh(V.sphG, new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff4d0, emissiveIntensity: 1.5 })); hl.scale.set(0.18, 0.1, 0.05); hl.position.set(sx, 0.72, 2.31); body.add(hl);
    const tl = new T.Mesh(V.sphG, new T.MeshStandardMaterial({ color: 0xff2020, emissive: 0xff1010, emissiveIntensity: 0.6 })); tl.scale.set(0.18, 0.1, 0.05); tl.position.set(sx, 0.78, -2.31); body.add(tl); if (sx < 0) V.brakeL = tl; else V.brakeR = tl; }
  const wheels = []; for (const z of [-1.45, 1.45]) for (const sx of [-1, 1]) { const w = new T.Mesh(V.cylG, V.tyre); w.scale.set(0.34, 0.24, 0.34); w.rotation.z = Math.PI / 2; w.position.set(sx * 0.88, 0.34, z); body.add(w); wheels.push(w); }
  const sh = new T.Mesh(new T.PlaneGeometry(2.4, 5.2), new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.position.y = 0.03; g.add(sh);
  return { g, body, paint, wheels, door, pax }; }
function makePerson(V, i) { const T = V.T, g = new T.Group(), cl = V.clothM[i % V.clothM.length], sk = V.skinM[(i * 7) % V.skinM.length];
  const b = new T.Mesh(new T.CapsuleGeometry(0.22, 0.75, 3, 8), cl); b.position.y = 0.8; b.castShadow = true; g.add(b);
  const h = new T.Mesh(V.sphG, sk); h.scale.setScalar(0.14); h.position.y = 1.52; g.add(h); const l = new T.Mesh(new T.CapsuleGeometry(0.09, 0.4, 2, 6), V.clothM[(i + 4) % V.clothM.length]); l.position.y = 0.28; g.add(l);
  const arm = new T.Group(); arm.position.set(0.24, 1.3, 0); const am = new T.Mesh(new T.CapsuleGeometry(0.06, 0.5, 2, 6), cl); am.position.y = 0.3; arm.add(am); g.add(arm);
  const bag = new T.Mesh(V.boxG, new T.MeshStandardMaterial({ color: 0x5a3a2a })); bag.scale.set(0.3, 0.4, 0.15); bag.position.set(-0.3, 0.5, 0); g.add(bag);
  return { g, b, arm, cl }; }
function makeCar(V, i) { const T = V.T, g = new T.Group(), m = V.carMats[i % V.carMats.length];
  const a = new T.Mesh(V.boxG, m); a.scale.set(1.8, 0.75, CARLEN); a.position.set(0, 0.65, 0); a.castShadow = true; g.add(a);
  const c = new T.Mesh(V.boxG, V.glass); c.scale.set(1.6, 0.6, 2.3); c.position.set(0, 1.3, -0.2); c.castShadow = true; g.add(c);
  for (const z of [-1.4, 1.4]) for (const sx of [-0.85, 0.85]) { const w = new T.Mesh(V.cylG, V.tyre); w.scale.set(0.33, 0.22, 0.33); w.rotation.z = Math.PI / 2; w.position.set(sx, 0.33, z); g.add(w); }
  const bl = new T.Mesh(V.boxG, new T.MeshStandardMaterial({ color: 0xff2020, emissive: 0xff1010, emissiveIntensity: 0.4 })); bl.scale.set(1.5, 0.12, 0.04); bl.position.set(0, 0.85, -CARLEN / 2 - 0.01); g.add(bl);
  return { g, bl }; }
// ---------- the city: built once per shift (its road works and lights are the shift's own) ----------
function buildCity(V, g) { const T = V.T, S = V.S;
  if (V.city) { S.remove(V.city); V.city.traverse(o => { if (o.geometry && ![V.boxG, V.sphG, V.cylG, V.arrowG].includes(o.geometry)) o.geometry.dispose(); }); }
  V.city = new T.Group(); S.add(V.city); V.built = g; const R = W3.rng(g.seed % 9999 + 3), pl = PLACES[placeOf(g.N)];
  W3.setSky(g.yard ? 'morning' : pl.sky, { azim: 140 }); const night = W3.S.night > 0; V.uNight.value = night ? 1 : W3.S.name === 'sunset' || W3.S.name === 'rain' ? 0.35 : 0; V.flood.intensity = night ? 0.9 : 0; V.head.intensity = night ? 60 : 0; W3.hemi.intensity = W3.S.hemiI + (night ? 0.6 : 0);
  // blocks (the town and a ring round it): a raised pavement and buildings set back from the kerb
  const blds = [], tones = [[0xe8d8c0, 0xc8b8a0, 0xf0e6d6, 0xd8c0a0, 0xb8c8d0], [0x9aa4b0, 0xb8c0c8, 0x7a8490, 0xd0d4d8, 0x6a7480], [0xc87a5a, 0xd8a070, 0xb86a50, 0xe0c090, 0xa85a40]][placeOf(g.N) % 3], pv = [];
  for (let bi = -1; bi < NX; bi++) for (let bj = -1; bj < NY; bj++) { const x0 = bi * BL + HW, x1 = (bi + 1) * BL - HW, z0 = -(bj + 1) * BL + HW, z1 = -bj * BL - HW, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, w = x1 - x0;
    pv.push([cx, cz, w]); const plaza = bi === g.sight.i && bj === g.sight.j;
    if (plaza) continue;
    const n = 2 + ((R() * 3) | 0); for (let q = 0; q < n; q++) { const side = q % 4, bw = 10 + R() * 8, bd = 9 + R() * 6, h = 8 + R() * (R() < 0.25 ? 40 : 18), along = (R() - 0.5) * (w - bw - 6), inset = 3.4 + bd / 2;
      const [x, z] = side === 0 ? [cx + along, z0 + inset] : side === 1 ? [cx + along, z1 - inset] : side === 2 ? [x0 + inset, cz + along] : [x1 - inset, cz + along];
      blds.push({ x, z, w: side < 2 ? bw : bd, d: side < 2 ? bd : bw, h, c: tones[(R() * tones.length) | 0] }); } }
  { const m = new T.InstancedMesh(V.boxG, V.pave, pv.length), d = new T.Object3D(); pv.forEach(([x, z, w], i) => { d.position.set(x, 0.08, z); d.scale.set(w, 0.16, w); d.updateMatrix(); m.setMatrixAt(i, d.matrix); }); m.receiveShadow = true; V.city.add(m); }
  { const m = new T.InstancedMesh(V.boxG, V.bld, blds.length), d = new T.Object3D(), c = new T.Color(); blds.forEach((b, i) => { d.position.set(b.x, b.h / 2, b.z); d.scale.set(b.w, b.h, b.d); d.updateMatrix(); m.setMatrixAt(i, d.matrix); m.setColorAt(i, c.setHex(b.c)); }); m.castShadow = true; m.receiveShadow = true; V.city.add(m); }
  // trees on the pavements
  const trees = []; for (const [x, z, w] of pv) for (let q = 0; q < 6; q++) { const side = q % 4, along = (R() - 0.5) * (w - 6), [tx, tz] = side === 0 ? [x + along, z - w / 2 + 1.4] : side === 1 ? [x + along, z + w / 2 - 1.4] : side === 2 ? [x - w / 2 + 1.4, z + along] : [x + w / 2 - 1.4, z + along]; if (R() < 0.6) trees.push({ x: tx, z: tz, y: 0.16, s: 0.26 + R() * 0.12, rot: R() * 6, hue: R() * 2 - 1, shade: R() }); }
  if (trees.length) V.city.add(W3.pines(trees, { shadow: false }));
  // the markings: a double yellow line down the middle, dashes between the lanes, stop lines at lit junctions
  { const gs = [], ln = (x, z, sx, sz) => { const b = new T.BoxGeometry(sx, 0.02, sz); b.translate(x, 0.02, z); gs.push(b); }, ys = [];
    for (let i = 0; i < NX; i++) for (let j = 0; j < NY; j++) for (const h of [0, 1]) { const [a, b] = ahead(i, j, h); if (!inB(a, b)) continue; const p0 = wp(i, j, h, HW + 1, 0), p1 = wp(i, j, h, BL - HW - 1, 0), L = BL - 2 * HW - 2, mx = (p0.x + p1.x) / 2, mz = (p0.z + p1.z) / 2;
      for (const o of [-0.15, 0.15]) { const b2 = new T.BoxGeometry(h ? L : 0.1, 0.02, h ? 0.1 : L); b2.translate(mx + (h ? 0 : o), 0.021, mz + (h ? o : 0)); ys.push(b2); }
      for (const side of [-1, 1]) for (let s = HW + 2; s < BL - HW - 2; s += 6) { const p = wp(i, j, h, s + 1.5, 3.7 * side); ln(p.x, p.z, h ? 3 : 0.12, h ? 0.12 : 3); } }
    V.city.add(new T.Mesh(T.mergeGeometries(gs), V.white), new T.Mesh(T.mergeGeometries(ys), V.yellowL)); }
  // traffic lights at the lit junctions: a pole on each corner, a head facing the cars coming at it
  const heads = []; for (let i = 0; i < NX; i++) for (let j = 0; j < NY; j++) if (g.light[i][j].on) for (let h = 0; h < 4; h++) { const [a, b] = ahead(i, j, (h + 2) % 4); if (!inB(a, b)) continue; heads.push({ i, j, h }); }
  V.heads = heads; { const pole = new T.InstancedMesh(V.cylG, new T.MeshStandardMaterial({ color: 0x2a2d33, roughness: 0.5 }), heads.length), box = new T.InstancedMesh(V.boxG, new T.MeshStandardMaterial({ color: 0x15171a }), heads.length), d = new T.Object3D();
    V.lamps = new T.InstancedMesh(V.sphG, new T.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), heads.length * 3);
    heads.forEach((q, n) => { const p = wp(q.i, q.j, q.h, -HW - 1.2, HW + 0.8), yaw = yawOf(q.h); d.position.set(p.x, 2.2, p.z); d.rotation.set(0, yaw, 0); d.scale.set(0.09, 4.4, 0.09); d.updateMatrix(); pole.setMatrixAt(n, d.matrix);
      d.position.set(p.x, 4.4, p.z); d.scale.set(0.42, 1.2, 0.28); d.updateMatrix(); box.setMatrixAt(n, d.matrix);
      for (let c = 0; c < 3; c++) { const lp = { x: p.x + DX(q.h) * -0.16, z: p.z + DZ(q.h) * -0.16 }; d.position.set(lp.x, 4.8 - c * 0.38, lp.z); d.scale.setScalar(0.13); d.updateMatrix(); V.lamps.setMatrixAt(n * 3 + c, d.matrix); V.lamps.setColorAt(n * 3 + c, new T.Color(0x222222)); } });
    V.city.add(pole, box, V.lamps); }
  // road works: barriers and cones across the road
  const cone = new T.MeshStandardMaterial({ color: 0xff7a1a, roughness: 0.6 }), stripe = new T.MeshStandardMaterial({ map: canvasTex(64, 16, (c, w, h) => { for (let x = -16; x < w; x += 16) { c.fillStyle = '#e02a1a'; c.beginPath(); c.moveTo(x, h); c.lineTo(x + 8, 0); c.lineTo(x + 16, 0); c.lineTo(x + 8, h); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(x + 8, h); c.lineTo(x + 16, 0); c.lineTo(x + 24, 0); c.lineTo(x + 16, h); c.fill(); } }) });
  for (const key of g.works) { const [i, j, h] = key.split(',').map(Number); for (const s of [HW + 3, BL - HW - 3]) { const p = wp(i, j, h, s, 0), bar = new T.Mesh(V.boxG, stripe); bar.scale.set(h ? 0.2 : 14, 0.5, h ? 14 : 0.2); bar.position.set(p.x, 1.0, p.z); V.city.add(bar);
      for (let q = -6; q <= 6; q += 3) { const cp = wp(i, j, h, s + (s < BL / 2 ? 2 : -2), q), cn = new T.Mesh(new T.ConeGeometry(0.3, 0.8, 10), cone); cn.position.set(cp.x, 0.4, cp.z); V.city.add(cn); } }
    const dig = new T.Mesh(V.boxG, new T.MeshStandardMaterial({ color: 0x6a4a2a, roughness: 1 })), p = wp(i, j, h, BL / 2, 0); dig.scale.set(h ? BL - 2 * HW - 12 : 10, 0.6, h ? 10 : BL - 2 * HW - 12); dig.position.set(p.x, 0.3, p.z); V.city.add(dig); }
  // the fountain square
  { const cx = (g.sight.i + 0.5) * BL, cz = -(g.sight.j + 0.5) * BL, base = new T.Mesh(new T.CylinderGeometry(7, 7.5, 0.8, 32), new T.MeshStandardMaterial({ color: 0xd8d0c0, roughness: 0.6 })); base.position.set(cx, 0.4, cz); V.city.add(base);
    const water = new T.Mesh(new T.CylinderGeometry(6.4, 6.4, 0.1, 32), new T.MeshPhysicalMaterial({ color: 0x3aa0d8, roughness: 0.05, transmission: 0.3, clearcoat: 1 })); water.position.set(cx, 0.82, cz); V.city.add(water);
    const col = new T.Mesh(new T.CylinderGeometry(0.6, 0.9, 4, 16), base.material); col.position.set(cx, 2.4, cz); V.city.add(col);
    V.spray = new T.Mesh(new T.ConeGeometry(2.2, 3, 20, 1, true), new T.MeshBasicMaterial({ color: 0xcfefff, transparent: true, opacity: 0.45, depthWrite: false, side: T.DoubleSide })); V.spray.position.set(cx, 4.8, cz); V.spray.rotation.x = Math.PI; V.city.add(V.spray); }
  V.taxi.paint.color.setHex(mySkin().col); ui.snap = true; ui.off = [0, 0]; ui.yaw = null; }
// ---------- each frame ----------
function sync(V, g, dt) { const t = g.taxi, T = V.T; V.t += dt;
  // the taxi: at its place on the road; after a junction it swings round (the offset fades)
  const p = { x: t.x, z: -t.y }, yaw = Math.PI - t.th;      // (second version) the taxi is wherever you have driven it
  if (V.lastE !== `${t.i},${t.j},${t.h}`) { ui.off = [0, 0]; V.lastE = `${t.i},${t.j},${t.h}`; }
  const dec = Math.exp(-dt * 5); ui.off[0] *= dec; ui.off[1] *= dec; const px = p.x + ui.off[0], pz = p.z + ui.off[1]; V.lastP = p;
  if (ui.yaw == null || ui.snap) ui.yaw = yaw; let dy = yaw - ui.yaw; while (dy > Math.PI) dy -= TAU; while (dy < -Math.PI) dy += TAU; ui.yaw += dy * Math.min(1, dt * 3.4);
  const X = V.taxi; X.g.position.set(px, 0, pz); X.g.rotation.y = yaw; X.body.rotation.z += (clamp((t.w || 0) * Math.min(1, Math.abs(t.v) / 12) * 0.05, -0.06, 0.06) - X.body.rotation.z) * Math.min(1, dt * 6); X.body.rotation.x += ((t.brH && t.v > 0.5 ? 0.03 : 0) - X.body.rotation.x) * Math.min(1, dt * 8);
  for (const w of X.wheels) w.rotation.x += t.v * dt / 0.34; V.brakeL.material.emissiveIntensity = V.brakeR.material.emissiveIntensity = t.brH ? 3 : 0.5; V.signM.emissiveIntensity = g.fare ? 0.05 : 0.6 + 0.2 * Math.sin(V.t * 3);
  V.head.position.set(px, 1.2, pz); V.head.target.position.set(px + Math.sin(yaw) * 30, 0, pz + Math.cos(yaw) * 30);
  // the lights
  if (V.lamps && V.heads.length && V.lamps.instanceColor) { const c = V.cpool || (V.cpool = { r: new T.Color(0xff2a1a), a: new T.Color(0xffa010), g: new T.Color(0x30ff70), off: new T.Color(0x202020) });
    V.heads.forEach((q, n) => { const col = lightAt(g, q.i, q.j, q.h % 2, g.t); ['r', 'a', 'g'].forEach((L, j) => V.lamps.setColorAt(n * 3 + j, L === col ? c[L] : c.off)); }); V.lamps.instanceColor.needsUpdate = true; }
  // the cars
  let ci = 0; for (const car of g.cars) { const c = V.cars[ci++]; if (!c) break; c.g.visible = true; const q = wp(car.i, car.j, car.h, car.s, car.lx); c.g.position.set(q.x, 0, q.z); c.g.rotation.y = yawOf(car.h); c.bl.material.emissiveIntensity = car.v < 1 ? 2.5 : 0.4; }
  for (; ci < V.cars.length; ci++) V.cars[ci].g.visible = false;
  for (const o of V.onc) { o.s -= (9 + (o.lane ? 2 : 0)) * dt; if (o.s < -6) o.s += BL + 12; const q = wp(t.i, t.j, t.h, o.s, -LANES[o.lane]); o.c.g.position.set(q.x, 0, q.z); o.c.g.rotation.y = yaw + Math.PI; o.c.g.visible = false; }      /* the oncoming cars are real ones now (g.cars) */
  // the goal: a person waving (or the door), the ring, the beam
  const G2 = g.goal, A = g.anim, ease = u => u * u * (3 - 2 * u), cl01 = u => clamp(u, 0, 1); V.beam.visible = V.ring.visible = !!G2 && !A; V.hailer.g.visible = !!G2 && G2.kind === 'pick'; V.rider.g.visible = false;
  if (G2) { const gp = wp(G2.e.i, G2.e.j, G2.e.h, G2.s, LANES[1]), kerb = wp(G2.e.i, G2.e.j, G2.e.h, G2.s, HW + 1.2), col = G2.kind === 'pick' ? 0x40ff80 : 0xffc61a;
    V.beam.position.set(kerb.x, 30, kerb.z); V.beam.material.color.setHex(col); V.beam.material.opacity = 0.16 + 0.08 * Math.sin(V.t * 4); V.ring.position.set(gp.x, 0.05, gp.z); V.ring.material.color.setHex(col); const sc = 1 + 0.08 * Math.sin(V.t * 6); V.ring.scale.set(sc, sc, sc);
    if (G2.kind === 'pick' && !A) { const H2 = V.hailer; H2.g.scale.setScalar(1); H2.g.position.set(kerb.x, 0.16, kerb.z); H2.g.lookAt(gp.x, 0.16, gp.z); H2.arm.rotation.z = -2.4 + Math.sin(V.t * 9) * 0.5; } }
  // getting in and getting out (his words, 23 Nov 2026: "you don't animate the person entering the car, nor do you animate them leaving the car"): the kerb-side
  // rear door swings open, they walk between the kerb and the door and step in or out, the door shuts. On the way they are on the back seat, seen through the glass.
  { const fx = Math.sin(yaw), fz = Math.cos(yaw), rx = -fz, rz = fx, dpt = { x: px + rx * 1.45 - fx * 0.35, z: pz + rz * 1.45 - fz * 0.35 }, seat = { x: px + rx * 0.45 - fx * 0.7, z: pz + rz * 0.45 - fz * 0.7 }; let open = 0, aboard = !!g.fare;
    if (A) { const u = cl01(1 - g.wait / A.T), K = wp(A.e.i, A.e.j, A.e.h, A.s, HW + 1.2), P = A.kind === 'in' ? V.hailer : V.rider, walk = (a, b2, w) => { const q = ease(cl01(w)); P.g.position.set(a.x + (b2.x - a.x) * q, 0.16 + Math.abs(Math.sin(w * 9)) * 0.05 * (w > 0 && w < 1 ? 1 : 0), a.z + (b2.z - a.z) * q); P.g.lookAt(b2.x, 0.16, b2.z); };
      P.g.visible = true; P.arm.rotation.z = -0.2 + Math.sin(V.t * 12) * 0.25;
      if (A.kind === 'in') { open = u < 0.72 ? cl01(u / 0.22) : cl01((1 - u) / 0.2); aboard = u > 0.7; if (u < 0.42) { walk(K, dpt, u / 0.42); P.g.scale.setScalar(1); } else if (u < 0.7) { const w = (u - 0.42) / 0.28; walk(dpt, seat, w); P.g.scale.setScalar(1 - 0.3 * w); P.g.position.y = 0.16 + 0.22 * w; } else P.g.visible = false; }
      else { open = u < 0.62 ? cl01(u / 0.2) : cl01((0.86 - u) / 0.2); aboard = u < 0.2; if (u < 0.2) P.g.visible = false; else if (u < 0.45) { const w = (u - 0.2) / 0.25; walk(seat, dpt, w); P.g.scale.setScalar(0.7 + 0.3 * w); P.g.position.y = 0.38 - 0.22 * w; } else if (u < 0.8) { walk(dpt, K, (u - 0.45) / 0.35); P.g.scale.setScalar(1); } else { P.g.scale.setScalar(1); P.g.position.set(K.x, 0.16, K.z); P.g.lookAt(px, 0.16, pz); P.arm.rotation.z = -2.5 + Math.sin(V.t * 10) * 0.45; }      // a wave goodbye
        ui.left = { x: K.x, z: K.z, t: 0, ax: K.x - wp(A.e.i, A.e.j, A.e.h, A.s, HW - 2).x, az: K.z - wp(A.e.i, A.e.j, A.e.h, A.s, HW - 2).z }; } }
    else if (ui.left) { const Lf = ui.left, P = V.rider; Lf.t += dt; if (Lf.t > 3.2 || ui.snap) ui.left = null; else { const m = Math.hypot(Lf.ax, Lf.az) || 1, d2 = Math.min(3.4, Lf.t * 1.5); P.g.visible = true; P.g.scale.setScalar(1); P.g.position.set(Lf.x + Lf.ax / m * d2, 0.16 + Math.abs(Math.sin(Lf.t * 9)) * 0.05, Lf.z + Lf.az / m * d2); P.g.lookAt(Lf.x + Lf.ax / m * 9, 0.16, Lf.z + Lf.az / m * 9); P.arm.rotation.z = -0.2 + Math.sin(V.t * 12) * 0.25; } }      // then off across the pavement to their door
    X.door.rotation.y = ease(open) * 1.2; X.pax.visible = aboard; if (aboard) { X.pax.userData.ph.position.x = Math.sin(V.t * 1.3) * 0.02; } }
  if (V.spray) V.spray.scale.y = 1 + 0.08 * Math.sin(V.t * 7);
  // the turn zone and the arrows
  const d2n = BL - t.s, [ni, nj] = ahead(t.i, t.j, t.h), zoneOn = d2n > 1, inZ = inZone(g);
  V.zoneG.visible = false; if (false) { const zp = wp(t.i, t.j, t.h, BL - HW - ZONE / 2 + 2, 3.7); V.zoneG.position.set(zp.x, 0.03, zp.z); V.zoneG.rotation.y = yaw + Math.PI; V.zone.material.opacity = inZ ? 0.4 + 0.2 * Math.sin(V.t * 10) : 0.14; V.zone.material.map.offset.y = (V.zone.material.map.offset.y - dt * 1.5) % 1; }
  const r = G2 ? gps(g, G2) : null; V.arrow.visible = !!r && !r.on && d2n < 90 && !g.over;
  if (V.arrow.visible) { const c = wp(ni, nj, t.h, -HW, 3.7), q = r.turn; V.arrow.position.set(c.x, 6.2 + Math.sin(V.t * 3) * 0.25, c.z); V.arrow.rotation.order = 'YXZ'; V.arrow.rotation.set(0, yawOf(t.h) + Math.PI, q === 'L' ? Math.PI / 2 : q === 'R' ? -Math.PI / 2 : 0); V.arrow.scale.setScalar(0.85); V.arrow.material.color.setHex(G2.kind === 'pick' ? 0x40ff80 : 0xffc61a); }
  V.qArrow.visible = false; if (false) { const c = wp(t.i, t.j, t.h, BL - HW - 4, t.lx), ay = t.turn === 'L' ? yaw + Math.PI / 2 : yaw - Math.PI / 2; V.qArrow.position.set(c.x, 0.08, c.z); V.qArrow.rotation.order = 'YXZ'; V.qArrow.rotation.set(Math.PI / 2, ay, 0); }
  // the camera: behind and above
  const fw = [Math.sin(ui.yaw), Math.cos(ui.yaw)], asp = innerWidth / innerHeight, portrait = asp < 0.8, back = portrait ? 9.5 : 8, up = portrait ? 5.2 : 4.4, la = 12 + t.v * 0.9;
  const cp = [px - fw[0] * back, up, pz - fw[1] * back], cl = [px + fw[0] * la, 1.0, pz + fw[1] * la];
  if (ui.snap || !ui.cam) { ui.cam = { p: cp.slice(), l: cl.slice() }; ui.snap = false; }
  const kk = Math.min(1, dt * 5); for (let i = 0; i < 3; i++) { ui.cam.p[i] += (cp[i] - ui.cam.p[i]) * kk; ui.cam.l[i] += (cl[i] - ui.cam.l[i]) * kk; }
  const cam = W3.cam, sh = FX.shake ? (Math.random() - 0.5) * FX.shake * 0.02 : 0; cam.fov = portrait ? 64 : 52; cam.aspect = asp; cam.updateProjectionMatrix();
  cam.position.set(ui.cam.p[0] + sh, ui.cam.p[1] + sh, ui.cam.p[2]); cam.lookAt(ui.cam.l[0], ui.cam.l[1], ui.cam.l[2]); cam.updateMatrixWorld(); W3.setFocus(px + fw[0] * 10, 0, pz + fw[1] * 10, 40); }
const SV = window.THREE ? new THREE.Vector3() : null;
function scr(x, y, z) { if (!V3 || V3.none) return { x: W / 2, y: H / 2 }; SV.set(x, y, z); return W3.screen(SV); }
// ---------- what happens, seen and heard ----------
function onEvent(G, e) { const cx = W / 2;
  switch (e.k) {
    case 'start': case 'yard': ui.snap = true; ui.banner = { txt: G.lesson ? 'LESSON' : `SHIFT ${G.N}`, t: 0, secs: 1.3, col: '#ffc61a' }; break;
    case 'hail': if (!G.lesson || G.lesson.steps[0].id === 'pick') { sfx.whistle(); if (G.t > 1) say(`TAXI! ${TYPES[e.type].icon}`, cx, H * 0.34, '#80ff90', 22); } break;
    case 'queue': sfx.tick(); vibe(HAP.tick); break;
    case 'noturn': sfx.no(); say('NO ENTRY 🚧', cx, H * 0.4, '#ffb070', 20); break;
    case 'lane': sfx.swish(); vibe(HAP.tick); break;
    case 'kerb': sfx.bump(); break;
    case 'pass': if (!G.yard || G.yard === 'lane') sfx.whoosh(); break;
    case 'turn': if (!e.right && !G.lesson) say('RECALCULATING...', cx, H * 0.36, '#ffb070', 16); break;
    case 'forced': say('ROAD CLOSED', cx, H * 0.36, '#ffb070', 18); break;
    case 'pick': sfx.door(); vibe(HAP.light); setTimeout(() => { if (!paused) sfx.door(); }, 1300); break;
    case 'in': sfx.meter(); say(`${TYPES[e.type].icon} ${TYPES[e.type].name.toUpperCase()}: ${e.allow} s`, cx, H * 0.32, '#fff', 20); if (e.type === 'calm') tip('calm', 'A nervous passenger: no crashes, no red lights, no fast corners, no hard braking. Gentle!', 3.6); if (e.type === 'rush') tip('rush', 'A rusher: quick, and they tip double.', 3); if (e.type === 'sight') tip('sight', 'A tourist: drive past the fountain (📷 on the map) for a tip.', 3.4); break;
    case 'out': sfx.door(); setTimeout(() => { if (!paused) sfx.door(); }, 1250); sfx.till(); sfx.coin(2); say(`+${e.pay} 🪙` + (e.tip ? `  TIP +${e.tip}` : ''), cx, H * 0.34, e.late ? '#ffb070' : '#80ff90', 26); if (e.late) say('LATE: HALF FARE', cx, H * 0.41, '#ffb070', 18); burst(cx, H * 0.34, '#ffd040', 20); break;
    case 'missed': sfx.no(); say(e.kind === 'pick' ? 'MISSED THEM: GO ROUND THE BLOCK' : 'MISSED THE DOOR: GO ROUND', cx, H * 0.38, '#ffb070', 18); tip('missed', 'Pull over to the kerb (on the right) and BRAKE to stop in the ring.', 3); break;
    case 'red': sfx.alarm(); FX.red = 1; vibe(HAP.heavy); ui.banner = { txt: 'RED LIGHT! -5', t: 0, secs: 1.3, col: '#ff5a4a' }; break;
    case 'skid': sfx.skid(); FX.shake = 8; say('TOO FAST FOR THE CORNER!', cx, H * 0.4, '#ffb070', 18); tip('skid', 'BRAKE before the corner, then turn.', 2.6); break;
    case 'scared': sfx.gasp(); say(`😰 ${['', 'CAREFUL!', 'PLEASE!', 'LAST WARNING!'][Math.min(3, e.n)] || 'AAAH!'}`, cx, H * 0.46, '#ffd0a0', 20); break;
    case 'letout': ui.banner = { txt: 'LET ME OUT!', t: 0, secs: 1.5, col: '#ff5a4a' }; break;
    case 'sight': sfx.combo(3); say('📷 THE FOUNTAIN!', cx, H * 0.36, '#7ad8ff', 22); break;
    case 'walk': ui.banner = { txt: "I'LL WALK!", t: 0, secs: 1.5, col: '#ff5a4a' }; break;
    case 'gone': ui.banner = { txt: 'THEY TOOK ANOTHER CAB', t: 0, secs: 1.5, col: '#ff5a4a' }; break;
    case 'crash': sfx.crash(); FX.shake = 20; FX.red = 1; vibe(HAP.heavy); ui.banner = { txt: `CRASH! ${e.n}/${G.cfg.crashes}`, t: 0, secs: 1.4, col: '#ff5a4a' }; tip(e.wall ? 'hitwall' : 'hitcar', e.wall ? 'BRAKE before the corner: the kerb is hard' : 'Steer round slow cars, or BRAKE behind them', 2.8); break;
    case 'won': sfx.win(); break;
    case 'lost': sfx.lose(); break;
    case 'lessonnext': hint = null; break;
    case 'lessonok': sfx.coin(e.n); say(`${e.n} / ${e.need}`, cx, H * 0.46, '#80ff90', 22); break;
    case 'lessonmiss': coachMiss(); sfx.no(); break;
    case 'lessondone': sfx.goal(); say('LESSON DONE!', cx, H * 0.4, '#80ff90', 28); burst(cx, H * 0.4, '#80ff90', 24); break;
  } }
let IG = null; function idleG() { if (!IG || IG.over) { IG = newGame(Math.max(6, store.get('level', 1) | 0), { seed: (Math.random() * 1e6) | 0 }); IG.mem = {}; ui.snap = true; } honest(IG, { react: 0.3, acc: 0.95 }, IG.mem); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#2a3a2a'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D city.', W / 2, H / 2); if (G) hud(G, now); return; }
  const g = G || idleG(); if (V.built !== g || V.worksFor !== g.works) { buildCity(V, g); V.worksFor = g.works; }
  sync(V, g, dt);
  W3.render(dt);
  if (G && !(G.over && !$('ovEnd').classList.contains('hidden'))) hud(G, now);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 0.9 ? 1 : 1 - (t2.t - 0.9) / 0.5; ctx.globalAlpha = Math.max(0, al); const sc = t2.t < 0.12 ? 1.3 - t2.t / 0.12 * 0.3 : 1; ctx.font = `400 ${Math.round(t2.size * k * sc)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(20,20,30,.65)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 20); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 20); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30, hy = H * 0.6;
    ctx.fillStyle = 'rgba(20,24,36,.88)'; rrect(W / 2 - w / 2, hy - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, hy - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,60,30,${FX.red * 0.2})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${FX.flash * 0.45})`; ctx.fillRect(0, 0, W, H); } }
// ---------- the 2D layer: the meter, the GPS, the map, the speed ----------
function arrowIcon(x, y, s, q, col) { ctx.save(); ctx.translate(x, y); ctx.rotate(q === 'L' ? -Math.PI / 2 : q === 'R' ? Math.PI / 2 : 0); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * 0.75, -s * 0.1); ctx.lineTo(s * 0.3, -s * 0.1); ctx.lineTo(s * 0.3, s); ctx.lineTo(-s * 0.3, s); ctx.lineTo(-s * 0.3, -s * 0.1); ctx.lineTo(-s * 0.75, -s * 0.1); ctx.closePath(); ctx.fill(); ctx.restore(); }
function minimap(G, x, y, w) { const t = G.taxi, c = w / (NX - 1 + 0.6), o = c * 0.3, P = (i, j) => [x + o + i * c, y + o + (NY - 1 - j) * c];
  ctx.fillStyle = 'rgba(14,18,28,.72)'; rrect(x, y, w, w, 10 * k); ctx.fill(); ctx.lineWidth = Math.max(2, c * 0.16);
  for (let i = 0; i < NX; i++) for (let j = 0; j < NY; j++) for (const h of [0, 1]) { const [a, b] = ahead(i, j, h); if (!inB(a, b)) continue; const key = ekey(i, j, h), [x0, y0] = P(i, j), [x1, y1] = P(a, b);
    ctx.strokeStyle = G.works.has(key) ? 'rgba(255,140,40,.9)' : G.jams.has(key) ? 'rgba(255,60,60,.85)' : 'rgba(255,255,255,.22)'; if (G.works.has(key)) ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.setLineDash([]); }
  { const [fx, fy] = P(G.sight.i + 0.5, G.sight.j + 0.5); ctx.font = `${Math.round(c * 0.7)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('⛲', fx, fy + 1); }
  const g = G.goal; if (g) { const r = gps(G, g); if (r && r.path && r.path.length) { ctx.strokeStyle = g.kind === 'pick' ? '#40ff80' : '#ffc61a'; ctx.lineWidth = Math.max(2, c * 0.14); ctx.beginPath(); const [ax, ay] = P(t.i + DIRS[t.h][0] * t.s / BL, t.j + DIRS[t.h][1] * t.s / BL); ctx.moveTo(ax, ay); for (const [i, j] of r.path) ctx.lineTo(...P(i, j)); const [gx, gy] = P(g.e.i + DIRS[g.e.h][0] * g.s / BL, g.e.j + DIRS[g.e.h][1] * g.s / BL); ctx.lineTo(gx, gy); ctx.stroke(); }
    const [gx, gy] = P(g.e.i + DIRS[g.e.h][0] * g.s / BL, g.e.j + DIRS[g.e.h][1] * g.s / BL); ctx.fillStyle = g.kind === 'pick' ? '#40ff80' : '#ffc61a'; ctx.beginPath(); ctx.arc(gx, gy, c * 0.28 + Math.sin(G.t * 6) * 1.5, 0, TAU); ctx.fill(); }
  const [tx, ty] = P(t.i + DIRS[t.h][0] * t.s / BL, t.j + DIRS[t.h][1] * t.s / BL); ctx.save(); ctx.translate(tx, ty); ctx.rotate(t.th); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(0, -c * 0.32); ctx.lineTo(c * 0.22, c * 0.22); ctx.lineTo(-c * 0.22, c * 0.22); ctx.closePath(); ctx.fill(); ctx.restore(); }
function hud(G, now) { ctx.textBaseline = 'middle'; const t = G.taxi, c = G.cfg;
  if (G.lesson) lessonPanel(G);
  else { // the top: the meter (or who is waiting), coins, the fares
    const x0 = 12, w = W - 24 - 112 * k, y0 = 64 * k, F = G.fare, g = G.goal; ctx.fillStyle = 'rgba(14,18,28,.68)'; rrect(x0, y0 - 18 * k, w, 62 * k, 14 * k); ctx.fill(); ctx.textAlign = 'left';
    if (F) { const T2 = TYPES[F.type], left = F.left, frac = clamp(left / F.allow, 0, 1); ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillText(`${T2.icon} ${T2.name.toUpperCase()} · ${F.blocks} BLOCKS${F.type === 'calm' && F.bumps ? ` · 😰 ${F.bumps}` : ''}${F.type === 'sight' ? (F.sight ? ' · 📷 ✓' : ' · 📷 ⛲') : ''}`, x0 + 10, y0 - 6 * k);
      ctx.font = `400 ${Math.round(22 * k)}px ${TF}`; ctx.fillStyle = left > 0 ? (frac > 0.3 ? '#80ff90' : '#ffd040') : '#ff7a5a'; ctx.fillText(left > 0 ? `${Math.ceil(left)} s` : `LATE ${Math.ceil(-left)}`, x0 + 10, y0 + 18 * k);
      ctx.fillStyle = 'rgba(255,255,255,.15)'; rrect(x0 + 110 * k, y0 + 12 * k, w - 122 * k, 10 * k, 5 * k); ctx.fill(); ctx.fillStyle = left > 0 ? (frac > 0.3 ? '#40d870' : '#ffc61a') : '#ff5a4a'; rrect(x0 + 110 * k, y0 + 12 * k, (w - 122 * k) * (left > 0 ? frac : clamp(-left / 15, 0, 1)), 10 * k, 5 * k); ctx.fill(); }
    else if (g && g.kind === 'pick') { ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillText(`PICK UP ${TYPES[g.type].icon}`, x0 + 10, y0 - 6 * k); ctx.font = `400 ${Math.round(18 * k)}px ${TF}`; ctx.fillStyle = g.left > 15 ? '#fff' : '#ffb070'; ctx.fillText(`WAITING ${Math.max(0, Math.ceil(g.left))} s`, x0 + 10, y0 + 18 * k); }
    ctx.textAlign = 'right'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = '#ffc61a'; ctx.fillText(`FARE ${Math.min(G.done + 1, c.fares)}/${c.fares}`, x0 + w - 10, y0 - 6 * k); ctx.fillStyle = '#fff'; ctx.fillText(`🪙 ${G.coins}` + (t.crashes ? '  ' + '💥'.repeat(t.crashes) : ''), x0 + w - 10, y0 + (F ? 34 : 18) * k);
    minimap(G, W - 12 - 104 * k, y0 - 18 * k, 104 * k); }
  // the GPS: the next turn, how far, and the zone
  const g = G.goal; if (g && !G.over) { const r = gps(G, g), d2n = BL - t.s, y = (G.lesson ? 196 : 158) * k, inZ = inZone(G);
    if (r) { const on = r.on, q = on ? 'S' : r.turn, x = W / 2; ctx.fillStyle = inZ && !on ? 'rgba(255,198,26,.92)' : 'rgba(14,18,28,.7)'; rrect(x - 104 * k, y - 26 * k, 208 * k, 52 * k, 14 * k); ctx.fill();
      arrowIcon(x - 60 * k, y, 18 * k, q, inZ && !on ? '#1a1a1a' : g.kind === 'pick' ? '#40ff80' : '#ffc61a'); ctx.textAlign = 'left'; ctx.fillStyle = inZ && !on ? '#1a1a1a' : '#fff';
      if (on) { ctx.font = `400 ${Math.round(15 * k)}px ${TF}`; ctx.fillText(`${g.kind === 'pick' ? 'PICK UP' : 'DROP OFF'} ${Math.max(0, Math.round(g.s - t.s))} m`, x - 34 * k, y - 6 * k); ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillText(t.lane ? 'BRAKE: STOP IN THE RING' : 'STEER RIGHT TO THE KERB', x - 34 * k, y + 13 * k); }
      else { ctx.font = `400 ${Math.round(16 * k)}px ${TF}`; ctx.fillText(inZ ? (t.turn ? (t.turn === r.turn ? 'GOOD!' : 'WRONG WAY?') : q === 'S' ? 'STRAIGHT ON' : `SWIPE ${q === 'L' ? 'LEFT' : 'RIGHT'}!`) : q === 'S' ? 'STRAIGHT ON' : `${q === 'L' ? 'LEFT' : 'RIGHT'} IN ${Math.round(d2n)} m`, x - 34 * k, y - 6 * k);
        ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillText(inZ ? 'TURN ZONE' : `${Math.max(1, Math.round(r.dist / BL))} blocks to go`, x - 34 * k, y + 13 * k); } } }
  // the banner
  if (ui.banner) { const B = ui.banner, sc = B.t < 0.12 ? 1.25 - B.t / 0.12 * 0.25 : 1; ctx.textAlign = 'center'; ctx.font = `400 ${Math.round(36 * k * sc)}px ${TF}`; ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(10,12,20,.7)'; ctx.strokeText(B.txt, W / 2, H * 0.3); ctx.fillStyle = B.col || '#fff'; ctx.fillText(B.txt, W / 2, H * 0.3); }
  // the light ahead
  { const [ni, nj] = ahead(t.i, t.j, t.h), L = G.light[ni] && G.light[ni][nj]; if (L && L.on && BL - t.s < 60) { const col = lightAt(G, ni, nj, t.h % 2, G.t), x = W - 30 * k, y = (G.lesson ? 330 : 230) * k; ctx.fillStyle = 'rgba(10,12,16,.85)'; rrect(x - 14 * k, y - 34 * k, 28 * k, 68 * k, 7 * k); ctx.fill(); ['r', 'a', 'g'].forEach((q, j) => { ctx.fillStyle = q === col ? ['#ff3a2a', '#ffb020', '#30ff70'][j] : 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.arc(x, y - 21 * k + j * 21 * k, 8 * k, 0, TAU); ctx.fill(); }); } }
  // speed and the brake
  ctx.textAlign = 'center'; ctx.font = `400 ${Math.round(26 * k)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(10,12,20,.6)'; const kmh = Math.round(Math.abs(t.v) * 3.6), sxm = (124 * k + W - 172 * k - 24) / 2; ctx.strokeText(kmh, sxm, H - 70 * k); ctx.fillStyle = t.brH ? '#ff7a6a' : '#fff'; ctx.fillText(kmh, sxm, H - 70 * k); ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillText(t.v < -0.3 ? 'REVERSE' : 'km/h', sxm, H - 50 * k);
  // the controls: a stick under the left thumb, GAS and BRAKE under the right
  if (!G.over && G.in) { const Pd = pedals(), I = G.in, st = ui.stick, sx0 = st ? st.x0 : 78 * k, sy0 = st ? st.y0 : H - 96 * k, R1 = 46 * k; ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.globalAlpha = st ? 0.9 : 0.5; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(sx0, sy0, R1, 0, TAU); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(sx0 + I.sx * R1, sy0, 20 * k, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillText('◀  STEER  ▶', sx0, sy0 + R1 + 14 * k);
    for (const [key, lab, sub, col] of [['gas', 'GAS', '', '#3fbf6a'], ['brake', 'BRAKE', 'hold: reverse', '#e0483a']]) { const b = Pd[key], on = key === 'gas' ? I.gas : I.brake; ctx.globalAlpha = on ? 1 : 0.72; ctx.fillStyle = on ? col : 'rgba(16,20,28,.72)'; rrect(b.x, b.y, b.w, b.h, 16 * k); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 3; rrect(b.x, b.y, b.w, b.h, 16 * k); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(19 * k)}px ${BC}`; ctx.fillText(lab, b.x + b.w / 2, b.y + b.h / 2 - (sub ? 7 * k : 0)); if (sub) { ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.fillText(sub, b.x + b.w / 2, b.y + b.h / 2 + 13 * k); } }
    ctx.restore(); } }
function pedals() { const w = 86 * k, h = 118 * k; return { gas: { x: W - w - 12, y: H - h - 22 * k, w, h }, brake: { x: W - 2 * w - 24, y: H - h * 0.8 - 22 * k, w, h: h * 0.8 } }; }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { coachPanel(G); }
