
// ===================== THE VIEW: Bus Driver in 3D (three.js; sky, light, shadows from tools/world3d.js) =====================
// A city built along the route: a two-lane road with kerbs and pavements, buildings whose windows are drawn by a shader (lit
// at night), trees and street lamps, side streets at every junction. Your bus (your livery, a lit destination board, doors
// that slide open), people waiting at shelters who walk to the door and climb on, traffic lights, zebra crossings with people
// crossing, cars in front and coming the other way. The camera rides behind and above; at a stop it swings round to the door.
const FX = { shake: 0, stop: 0, flash: 0, red: 0, slow: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { snap: true, cam: null, banner: null, pend: null, held: { go: false, br: false } };
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 160) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: 0.5 + Math.random() * 0.4, col, r: (1.5 + Math.random() * 2.5) * k }); } if (PARTS.length > 240) PARTS.splice(0, PARTS.length - 240); }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2.5); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.4) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (ui.banner) { ui.banner.t += dt; if (ui.banner.t > (ui.banner.secs || 1)) ui.banner = null; }
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; } }
const hex = n => '#' + n.toString(16).padStart(6, '0');
function mySkin() { if (typeof HEADLESS !== 'undefined' && HEADLESS) return SKINS[0]; const id = store.get('skin', 'red'); return SKINS.find(q => q.id === id) || SKINS[0]; }
const clockTxt = t => { t = Math.max(0, Math.round(t)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };
const STREETS = ['Market St', 'Harbour Rd', 'King St', 'Station Rd', 'Park Lane', 'Mill St', 'Church Rd', 'High St', 'Bridge St', 'Garden Ave', 'Palm Rd', 'Lighthouse', 'Depot'];
const stopName = (G, i) => G.stops[i] && G.stops[i].last ? 'Depot (end of the line)' : STREETS[(G.seed + i * 3) % (STREETS.length - 1)];
// ---------- where things are: the route as a path (s: metres along it; the lane's middle) ----------
function legPoses(G) { if (G.legs.p) return; let x = 0, z = 0, h = 0; for (const l of G.legs) { l.x = x; l.z = z; l.h = h; const e = legAt(l, l.L); x = e.x; z = e.z; h = e.h; } G.legs.p = true; }
function legAt(l, d) { if (l.kind === 'S') return { x: l.x + Math.sin(l.h) * d, z: l.z + Math.cos(l.h) * d, h: l.h };
  const side = l.side, rx = -Math.cos(l.h), rz = Math.sin(l.h), cx = l.x + rx * RT * side, cz = l.z + rz * RT * side, th = d / RT, h = l.h - side * th; return { x: cx + Math.cos(h) * RT * side, z: cz - Math.sin(h) * RT * side, h }; }
function pathAt(G, s) { legPoses(G); const L = G.legs; if (s <= 0) { const l = L[0]; return { x: l.x + Math.sin(l.h) * s, z: l.z + Math.cos(l.h) * s, h: l.h }; }
  for (const l of L) if (s <= l.s0 + l.L) return legAt(l, s - l.s0);
  const l = L[L.length - 1], e = legAt(l, l.L), d = s - l.s0 - l.L; return { x: e.x + Math.sin(e.h) * d, z: e.z + Math.cos(e.h) * d, h: e.h }; }
const RIGHT = h => [-Math.cos(h), Math.sin(h)];
// ---------- the city: built once per route ----------
function canvasTex(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
function buildWorld() {
  if (V3) return V3; const T = window.THREE; if (!T || !W3 || !W3.init({ canvas: $('gl'), fov: 58, far: 2500, near: 0.2 })) { V3 = { none: true }; return V3; }
  V3 = { T, S: W3.scene, built: null, t: 0, uNight: { value: 0 } }; const V = V3;
  V.boxG = new T.BoxGeometry(1, 1, 1); V.sphG = new T.SphereGeometry(1, 12, 8); V.cylG = new T.CylinderGeometry(1, 1, 1, 14);
  V.ground = new T.Mesh(new T.PlaneGeometry(3000, 3000), new T.MeshStandardMaterial({ color: 0x6c8a52, roughness: 0.95, map: W3.grainTex(256, 4, 190, 40, 2) })); V.ground.material.map.repeat.set(200, 200); V.ground.rotation.x = -Math.PI / 2; V.ground.position.y = -0.05; V.ground.receiveShadow = true; V.S.add(V.ground);
  V.asphalt = new T.MeshStandardMaterial({ color: 0x45484e, roughness: 0.82, map: W3.grainTex(256, 9, 170, 45, 8) });
  V.pave = new T.MeshStandardMaterial({ color: 0xb8b2a6, roughness: 0.9, map: W3.grainTex(256, 13, 200, 30, 4) });
  V.white = new T.MeshStandardMaterial({ color: 0xf0f0ea, roughness: 0.6 }); V.yellow = new T.MeshStandardMaterial({ color: 0xf6c21a, roughness: 0.6, emissive: 0x302000 });
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
  V.carMats = [0xd8322a, 0x2a6ad8, 0xeeeeee, 0x22262e, 0xf2b81a, 0x2f9a4a, 0x8a8f98].map(c => new T.MeshPhysicalMaterial({ color: c, roughness: 0.3, clearcoat: 0.8 }));
  V.tyre = new T.MeshStandardMaterial({ color: 0x18191c, roughness: 0.8 }); V.glass = new T.MeshPhysicalMaterial({ color: 0x15202c, roughness: 0.08, metalness: 0.2, clearcoat: 1 });
  V.skinM = [0x8d5524, 0xc68642, 0xe0ac69, 0x5a3825, 0xf1c27d].map(c => new T.MeshStandardMaterial({ color: c, roughness: 0.6 })); V.clothM = [0xe8463c, 0x2f7de0, 0x2fb060, 0xf2c230, 0x8a4fd0, 0xf07a2a, 0x22b8c8, 0xe85aa0, 0x404650].map(c => new T.MeshStandardMaterial({ color: c, roughness: 0.75 }));
  V.bus = makeBus(V); V.S.add(V.bus.g);
  V.people = []; for (let i = 0; i < 14; i++) { const p = makePerson(V, i); p.g.visible = false; V.S.add(p.g); V.people.push(p); }
  V.cars = []; for (let i = 0; i < 12; i++) { const c = makeCar(V, i); c.g.visible = false; V.S.add(c.g); V.cars.push(c); }
  V.flood = new T.DirectionalLight(0xffe8c8, 0); V.flood.position.set(30, 60, 10); V.S.add(V.flood);
  W3.setQuality(stepN); return V; }
function makeBus(V) { const T = V.T, g = new T.Group(), body = new T.Group(); g.add(body); const L = BUSLEN, Wd = 2.55;
  const paint = new T.MeshPhysicalMaterial({ color: mySkin().col, roughness: 0.32, clearcoat: 0.9, clearcoatRoughness: 0.15 });
  const B = (w, h, d, x, y, z, m) => { const ms = new T.Mesh(V.boxG, m); ms.scale.set(w, h, d); ms.position.set(x, y, z); ms.castShadow = true; body.add(ms); return ms; };
  B(Wd, 2.6, L, 0, 1.75, -L / 2, paint); B(Wd - 0.12, 0.25, L - 0.4, 0, 3.12, -L / 2, new T.MeshStandardMaterial({ color: 0xdfe3e6, roughness: 0.5 }));
  B(Wd + 0.02, 1.05, L - 2.2, 0, 2.25, -L / 2 - 0.5, V.glass); B(Wd - 0.2, 1.5, 0.08, 0, 2.15, -0.02, V.glass);
  B(Wd + 0.03, 0.3, L, 0, 0.6, -L / 2, new T.MeshStandardMaterial({ color: 0x2a2d33, roughness: 0.6 }));
  B(Wd - 0.3, 1.0, 0.06, 0, 2.3, -L - 0.01, V.glass); B(1.2, 0.35, 0.05, 0, 1.15, -L - 0.02, new T.MeshStandardMaterial({ color: 0x1a1c20, roughness: 0.5 }));
  B(0.5, 0.14, 0.04, 0, 0.75, -L - 0.03, new T.MeshStandardMaterial({ color: 0xf2d830, roughness: 0.4 })); B(Wd + 0.04, 0.12, L - 0.3, 0, 1.5, -L / 2, new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }));
  // the destination board
  V.signC = document.createElement('canvas'); V.signC.width = 256; V.signC.height = 40; V.signT = new T.CanvasTexture(V.signC); V.signT.colorSpace = T.SRGBColorSpace;
  const sign = new T.Mesh(V.boxG, new T.MeshBasicMaterial({ map: V.signT, toneMapped: false })); sign.scale.set(2.0, 0.32, 0.04); sign.position.set(0, 2.95, 0.02); body.add(sign);
  for (const sx of [-0.85, 0.85]) { const hl = new T.Mesh(V.sphG, new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff4d0, emissiveIntensity: 1.5 })); hl.scale.set(0.16, 0.12, 0.05); hl.position.set(sx, 0.85, 0.02); body.add(hl);
    const tl = new T.Mesh(V.sphG, new T.MeshStandardMaterial({ color: 0xff2020, emissive: 0xff1010, emissiveIntensity: 0.6 })); tl.scale.set(0.14, 0.14, 0.05); tl.position.set(sx, 0.9, -L - 0.02); body.add(tl); if (sx < 0) V.brakeL = tl; else V.brakeR = tl; }
  // doors on the right side (-x): front and middle; they slide back
  const doorM = new T.MeshPhysicalMaterial({ color: 0x1a2430, roughness: 0.1, metalness: 0.3 }); const doors = [];
  for (const z of [-1.3, -L / 2 - 0.4]) { const d1 = B(0.06, 2.2, 0.62, -Wd / 2 - 0.02, 1.55, z + 0.31, doorM), d2 = B(0.06, 2.2, 0.62, -Wd / 2 - 0.02, 1.55, z - 0.31, doorM); doors.push({ d1, d2, z }); }
  const wheels = []; for (const z of [-2.2, -L + 2.6]) for (const sx of [-1, 1]) { const w = new T.Mesh(V.cylG, V.tyre); w.scale.set(0.52, 0.32, 0.52); w.rotation.z = Math.PI / 2; w.position.set(sx * (Wd / 2 - 0.12), 0.52, z); w.castShadow = true; body.add(w); wheels.push(w); }
  const sh = new T.Mesh(new T.PlaneGeometry(Wd + 0.6, L + 0.6), new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.position.set(0, 0.03, -L / 2); g.add(sh);
  return { g, body, paint, doors, wheels }; }
function makePerson(V, i) { const T = V.T, g = new T.Group(), cl = V.clothM[i % V.clothM.length], sk = V.skinM[(i * 7) % V.skinM.length];
  const b = new T.Mesh(new T.CapsuleGeometry(0.2, 0.75, 3, 8), cl); b.position.y = 0.75; b.castShadow = true; g.add(b);
  const h = new T.Mesh(V.sphG, sk); h.scale.setScalar(0.13); h.position.y = 1.45; g.add(h); const l = new T.Mesh(new T.CapsuleGeometry(0.08, 0.35, 2, 6), V.clothM[(i + 4) % V.clothM.length]); l.position.y = 0.25; g.add(l);
  return { g, b, busy: false }; }
function makeCar(V, i) { const T = V.T, g = new T.Group(), m = V.carMats[i % V.carMats.length];
  const a = new T.Mesh(V.boxG, m); a.scale.set(1.8, 0.75, CARLEN); a.position.set(0, 0.65, 0); a.castShadow = true; g.add(a);
  const c = new T.Mesh(V.boxG, V.glass); c.scale.set(1.6, 0.6, 2.3); c.position.set(0, 1.3, -0.2); c.castShadow = true; g.add(c);
  for (const z of [-1.4, 1.4]) for (const sx of [-0.85, 0.85]) { const w = new T.Mesh(V.cylG, V.tyre); w.scale.set(0.33, 0.22, 0.33); w.rotation.z = Math.PI / 2; w.position.set(sx, 0.33, z); g.add(w); }
  const bl = new T.Mesh(V.boxG, new T.MeshStandardMaterial({ color: 0xff2020, emissive: 0xff1010, emissiveIntensity: 0.4 })); bl.scale.set(1.5, 0.12, 0.04); bl.position.set(0, 0.85, -CARLEN / 2 - 0.01); g.add(bl);
  return { g, bl }; }
function buildRoute(V, g) { const T = V.T, S = V.S; legPoses(g);
  if (V.route) { S.remove(V.route); V.route.traverse(o => { if (o.geometry && o.geometry !== V.boxG && o.geometry !== V.sphG && o.geometry !== V.cylG) o.geometry.dispose(); }); }
  V.route = new T.Group(); S.add(V.route); V.built = g; const R = W3.rng(g.seed % 9999 + 3), pl = PLACES[placeOf(g.N)];
  W3.setSky(g.yard ? 'morning' : pl.sky, { azim: 140 }); const night = W3.S.night > 0; V.uNight.value = night ? 1 : W3.S.name === 'sunset' || W3.S.name === 'rain' ? 0.35 : 0; V.flood.intensity = night ? 0.9 : 0; W3.hemi.intensity = W3.S.hemiI + (night ? 0.6 : 0);
  const pts = []; for (let s = -40; s <= g.D + 60; s += 2) { const p = pathAt(g, s); pts.push(p); }
  // the road and the pavements: ribbons along the path (the lane is the right half of the road)
  const ribbon = (off0, off1, y, step = 1) => { const pos = [], idx = []; let n = 0; for (let i = 0; i < pts.length; i += step) { const p = pts[i], [rx, rz] = RIGHT(p.h); pos.push(p.x + rx * off0, y, p.z + rz * off0, p.x + rx * off1, y, p.z + rz * off1); if (n) idx.push(2 * n - 2, 2 * n - 1, 2 * n, 2 * n - 1, 2 * n + 1, 2 * n); n++; }
    const gg = new T.BufferGeometry(); gg.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); const uv = []; for (let i = 0; i < pos.length / 3; i++) uv.push(pos[i * 3] / 6, pos[i * 3 + 2] / 6); gg.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); gg.setIndex(idx); gg.computeVertexNormals(); if (gg.attributes.normal.getY(0) < 0) { for (let i = 0; i < idx.length; i += 3) { const t = idx[i]; idx[i] = idx[i + 1]; idx[i + 1] = t; } gg.setIndex(idx); gg.computeVertexNormals(); } return gg; };
  const road = new T.Mesh(ribbon(-5.25, 1.75, 0.01), V.asphalt); road.receiveShadow = true; V.route.add(road);
  for (const [a, b] of [[1.75, 4.75], [-8.25, -5.25]]) { const pv = new T.Mesh(ribbon(a, b, 0.16), V.pave); pv.receiveShadow = true; V.route.add(pv); const kb = new T.Mesh(ribbon(a < 0 ? b - 0.18 : a, a < 0 ? b : a + 0.18, 0.17), V.white); V.route.add(kb); }
  // the line down the middle (dashed) and side streets at every junction
  { const dash = []; for (let s = -30; s < g.D + 50; s += 6) { const p = pathAt(g, s), q = pathAt(g, s + 3), [rx, rz] = RIGHT(p.h), [qx, qz] = RIGHT(q.h); dash.push(p.x - rx * 1.75, p.z - rz * 1.75, q.x - qx * 1.75, q.z - qz * 1.75); }
    const gs = []; for (let i = 0; i < dash.length; i += 4) { const [ax, az, bx, bz] = dash.slice(i, i + 4), b = new T.BoxGeometry(0.14, 0.02, Math.hypot(bx - ax, bz - az)); b.rotateY(Math.atan2(bx - ax, bz - az)); b.translate((ax + bx) / 2, 0.025, (az + bz) / 2); gs.push(b); }
    V.route.add(new T.Mesh(T.mergeGeometries(gs), V.white)); }
  const stubs = []; for (const l of g.legs) if (l.kind === 'T') { const p = legAt(l, 0); for (const dir of [0, Math.PI]) { const h = l.h + (dir ? Math.PI : 0); const [rx, rz] = RIGHT(l.h); const cx = p.x - rx * 1.75 + Math.sin(l.h) * (dir ? -4 : 9) + (dir ? 0 : 0), cz = p.z - rz * 1.75 + Math.cos(l.h) * (dir ? -4 : 9);
      if (!dir) { const st = new T.Mesh(V.boxG, V.asphalt); st.scale.set(7, 0.02, 30); st.position.set(cx + Math.sin(l.h) * 12, 0.012, cz + Math.cos(l.h) * 12); st.rotation.y = l.h; st.receiveShadow = true; V.route.add(st); stubs.push([st.position.x, st.position.z]); }
      const side = -l.side, ox = p.x + rx * side * 10 - rx * 1.75, oz = p.z + rz * side * 10 - rz * 1.75; const st2 = new T.Mesh(V.boxG, V.asphalt); st2.scale.set(30, 0.02, 7); st2.position.set(ox + rx * side * 8, 0.012, oz + rz * side * 8); st2.rotation.y = l.h; st2.receiveShadow = true; V.route.add(st2); stubs.push([st2.position.x, st2.position.z]); break; } }
  // buildings along both sides, never on the road
  const near = (x, z, r) => { for (const p of pts) if ((p.x - x) ** 2 + (p.z - z) ** 2 < r * r) return true; for (const [sx, sz] of stubs) if ((sx - x) ** 2 + (sz - z) ** 2 < (r + 6) ** 2) return true; return false; };
  const blds = [], tall = [1, 1.6, 0.6][pl.tone] || 1, tones = [[0xe8d8c0, 0xc8b8a0, 0xf0e6d6, 0xd8c0a0, 0xb8c8d0], [0x9aa4b0, 0xb8c0c8, 0x7a8490, 0xd0d4d8, 0x6a7480], [0xc87a5a, 0xd8a070, 0xb86a50, 0xe0c090, 0xa85a40]][pl.tone];
  for (let s = -30; s < g.D + 50; s += 13 + R() * 4) { const p = pathAt(g, s), [rx, rz] = RIGHT(p.h); for (const sd of [1, -1]) { const w = 9 + R() * 6, d = 9 + R() * 8, h = (7 + R() * (R() < 0.25 ? 34 : 16)) * tall, off = sd > 0 ? 6 + d / 2 : -9.5 - d / 2, x = p.x + rx * off, z = p.z + rz * off; if (near(x, z, Math.min(w, d) / 2 + 5.2)) continue; blds.push({ x, z, w, d, h, rot: p.h, c: tones[(R() * tones.length) | 0] }); } }
  { const m = new T.InstancedMesh(V.boxG, V.bld, blds.length), d = new T.Object3D(), c = new T.Color(); blds.forEach((b, i) => { d.position.set(b.x, b.h / 2, b.z); d.rotation.set(0, b.rot, 0); d.scale.set(b.w, b.h, b.d); d.updateMatrix(); m.setMatrixAt(i, d.matrix); m.setColorAt(i, c.setHex(b.c)); }); m.castShadow = true; m.receiveShadow = true; V.route.add(m); }
  // trees and lamps on the pavements
  const trees = [], lamps = []; for (let s = -20; s < g.D + 40; s += 9) { const p = pathAt(g, s), [rx, rz] = RIGHT(p.h); for (const sd of [1, -1]) { const off = sd > 0 ? 4.0 : -7.5, x = p.x + rx * off, z = p.z + rz * off; if (near(x, z, 3.0)) continue; if ((Math.round(s / 9) + (sd > 0 ? 0 : 1)) % 3 === 0) lamps.push({ x, z, h: p.h + (sd > 0 ? Math.PI / 2 : -Math.PI / 2) }); else if (R() < 0.6) trees.push({ x, z, y: 0.16, s: 0.32 + R() * 0.16, rot: R() * 6, hue: R() * 2 - 1, shade: R() }); } }
  if (trees.length) V.route.add(W3.pines(trees, { shadow: true }));
  { const gs = []; const pole = new T.CylinderGeometry(0.07, 0.09, 6, 6); pole.translate(0, 3, 0); const arm = new T.BoxGeometry(0.08, 0.08, 1.4); arm.translate(0, 5.9, 0.6); gs.push(pole, arm); const lg = T.mergeGeometries(gs.map(q => q.index ? q.toNonIndexed() : q));
    const lm = new T.InstancedMesh(lg, new T.MeshStandardMaterial({ color: 0x3a3e44, metalness: 0.6, roughness: 0.4 }), lamps.length), hm = new T.InstancedMesh(new T.BoxGeometry(0.35, 0.12, 0.6).translate(0, 5.82, 1.2), new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffe0a0, emissiveIntensity: night ? 3 : 0.2 }), lamps.length), d = new T.Object3D();
    lamps.forEach((q, i) => { d.position.set(q.x, 0.16, q.z); d.rotation.set(0, q.h, 0); d.updateMatrix(); lm.setMatrixAt(i, d.matrix); hm.setMatrixAt(i, d.matrix); }); lm.castShadow = true; V.route.add(lm, hm); }
  // stops: a shelter, a sign, the yellow box and the door mark
  V.stopsV = g.stops.map((st, i) => { const p = pathAt(g, st.s), [rx, rz] = RIGHT(p.h), grp = new T.Group(); grp.position.set(p.x, 0, p.z); grp.rotation.y = p.h; V.route.add(grp);
    const sx = -3.3; const roof = new T.Mesh(V.boxG, new T.MeshStandardMaterial({ color: 0x2a3038, metalness: 0.5, roughness: 0.4 })); roof.scale.set(1.6, 0.1, 4); roof.position.set(sx - 0.2, 2.6, -1); roof.castShadow = true; grp.add(roof);
    const back = new T.Mesh(V.boxG, new T.MeshPhysicalMaterial({ color: 0xbfe0ff, transparent: true, opacity: 0.3, roughness: 0.05 })); back.scale.set(0.05, 2.3, 4); back.position.set(sx - 0.95, 1.35, -1); grp.add(back);
    const bench = new T.Mesh(V.boxG, new T.MeshStandardMaterial({ color: 0x8a5a3a })); bench.scale.set(0.45, 0.08, 2.4); bench.position.set(sx - 0.6, 0.6, -1); grp.add(bench);
    const pole = new T.Mesh(V.cylG, new T.MeshStandardMaterial({ color: 0x3a3e44 })); pole.scale.set(0.05, 3, 0.05); pole.position.set(-2.2, 1.6, 0.6); grp.add(pole);
    const signT = canvasTex(128, 128, (c, w, h) => { c.fillStyle = '#d8322a'; c.beginPath(); c.arc(64, 64, 62, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(64, 64, 46, 0, TAU); c.fill(); c.fillStyle = '#1a3a8a'; c.font = '900 34px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('BUS', 64, 66); });
    const sign = new T.Mesh(new T.CircleGeometry(0.4, 24), new T.MeshBasicMaterial({ map: signT, side: T.DoubleSide })); sign.position.set(-2.2, 3.0, 0.6); sign.rotation.y = Math.PI / 2; sign.material.side = T.FrontSide; grp.add(sign); const sign2 = sign.clone(); sign2.rotation.y = -Math.PI / 2; sign2.position.x -= 0.01; grp.add(sign2);
    const box = new T.Group(); for (const [w, d, x, z] of [[0.15, 3.2, 0.1, 0], [0.15, 3.2, 3.4, 0], [3.4, 0.15, 1.75, 1.6], [3.4, 0.15, 1.75, -1.6]]) { const m = new T.Mesh(V.boxG, V.yellow); m.scale.set(w, 0.02, d); m.position.set(-x + 1.75 - 1.75, 0.03, z); box.add(m); }
    const mark = new T.Mesh(V.boxG, V.yellow); mark.scale.set(3.2, 0.03, 0.22); mark.position.set(0, 0.035, 0); box.add(mark); box.position.set(0, 0, 0); grp.add(box);
    const people = []; return { grp, people, mark }; });
  // traffic lights and stop lines; zebra crossings; speed signs
  V.lightsV = g.lights.map(L => { const p = pathAt(g, L.s), grp = new T.Group(); grp.position.set(p.x, 0, p.z); grp.rotation.y = p.h; V.route.add(grp);
    const pole = new T.Mesh(V.cylG, new T.MeshStandardMaterial({ color: 0x2a2d33 })); pole.scale.set(0.09, 4, 0.09); pole.position.set(-2.4, 2, 0.6); grp.add(pole);
    const head = new T.Mesh(V.boxG, new T.MeshStandardMaterial({ color: 0x15171a })); head.scale.set(0.42, 1.25, 0.3); head.position.set(-2.4, 4.3, 0.6); grp.add(head);
    const lamps = ['r', 'a', 'g'].map((c, i) => { const m = new T.Mesh(V.sphG, new T.MeshStandardMaterial({ color: 0x222222, emissive: [0xff2010, 0xffa010, 0x20ff60][i], emissiveIntensity: 0 })); m.scale.setScalar(0.13); m.position.set(-2.4, 4.7 - i * 0.38, 0.77); grp.add(m); return m; });
    const line = new T.Mesh(V.boxG, V.white); line.scale.set(3.4, 0.02, 0.35); line.position.set(0, 0.03, 0); grp.add(line); return { lamps }; });
  V.zebrasV = g.zebras.map(Z => { const p = pathAt(g, Z.s), grp = new T.Group(); grp.position.set(p.x, 0, p.z); grp.rotation.y = p.h; V.route.add(grp);
    for (let i = 0; i < 9; i++) { const m = new T.Mesh(V.boxG, V.white); m.scale.set(0.5, 0.02, 3); m.position.set(1.5 - i * 0.85, 0.028, 0); grp.add(m); }
    for (const x of [-6, 2.4]) { const b = new T.Mesh(V.cylG, new T.MeshStandardMaterial({ color: 0x222222 })); b.scale.set(0.05, 2.4, 0.05); b.position.set(x, 1.2, 1.8); grp.add(b); const gl = new T.Mesh(V.sphG, new T.MeshStandardMaterial({ color: 0xffa020, emissive: 0xff8000, emissiveIntensity: 1 })); gl.scale.setScalar(0.17); gl.position.set(x, 2.5, 1.8); grp.add(gl); }
    return { grp }; });
  for (const z of g.zones) { const p = pathAt(g, z.s0), grp = new T.Group(); grp.position.set(p.x, 0, p.z); grp.rotation.y = p.h; V.route.add(grp);
    const n = Math.round(z.lim * 3.6), t = canvasTex(128, 128, (c) => { c.fillStyle = '#fff'; c.beginPath(); c.arc(64, 64, 60, 0, TAU); c.fill(); c.strokeStyle = '#e02020'; c.lineWidth = 14; c.beginPath(); c.arc(64, 64, 52, 0, TAU); c.stroke(); c.fillStyle = '#111'; c.font = '900 52px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(n, 64, 68); });
    const sg = new T.Mesh(new T.CircleGeometry(0.5, 24), new T.MeshBasicMaterial({ map: t, side: T.DoubleSide })); sg.position.set(-2.4, 2.6, 0); sg.rotation.y = Math.PI; grp.add(sg); const pole = new T.Mesh(V.cylG, new T.MeshStandardMaterial({ color: 0x777777 })); pole.scale.set(0.04, 2.4, 0.04); pole.position.set(-2.4, 1.2, 0); grp.add(pole);
    const paint = new T.Mesh(new T.PlaneGeometry(2.2, 2.2), new T.MeshBasicMaterial({ map: t, transparent: true, opacity: 0.8 })); paint.rotation.x = -Math.PI / 2; paint.rotation.z = Math.PI; paint.position.set(0, 0.03, 3); grp.add(paint); }
  // the oncoming traffic (just for life): cars on a loop in the other lane
  V.onc = [0, 1, 2, 3, 4].map(i => ({ s: g.D * (i / 5) + 30, v: 9 + i, car: V.cars[7 + i] }));
  V.bus.paint.color.setHex(mySkin().col); for (const p of V.people) { p.g.visible = false; p.busy = false; } ui.snap = true; }
function setSign(V, g) { const c = V.signC.getContext('2d'); c.fillStyle = '#0a0a0a'; c.fillRect(0, 0, 256, 40); c.fillStyle = '#ffb020'; c.font = '700 26px "Courier New", monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(`${(g.N % 90) + 7}  ${PLACES[placeOf(g.N)].name.toUpperCase()}`.slice(0, 18), 128, 21); V.signT.needsUpdate = true; V.signFor = g; }
// ---------- each frame ----------
function sync(V, g, dt) { const b = g.bus, T = V.T; V.t += dt; if (V.signFor !== g) setSign(V, g);
  // the bus: front at s, back at s - 11.5 (so it bends round the corners)
  const f = pathAt(g, b.s), r = pathAt(g, b.s - BUSLEN + 0.5), yaw = Math.atan2(f.x - r.x, f.z - r.z), B = V.bus;
  B.g.position.set(f.x, 0, f.z); B.g.rotation.y = yaw; const pitch = clamp(-b.a * 0.012, -0.04, 0.04), roll = clamp((b.lat || 0) * 0.012, -0.05, 0.05); B.body.rotation.x += (pitch - B.body.rotation.x) * Math.min(1, dt * 5); B.body.rotation.z += (roll - B.body.rotation.z) * Math.min(1, dt * 5);
  for (const w of B.wheels) w.rotation.x += b.v * dt / 0.52; const op = b.doors > 0 ? 1 : 0; for (const d of B.doors) { d.o = (d.o || 0) + (op - (d.o || 0)) * Math.min(1, dt * 6); d.d1.position.z = d.z + 0.31 + d.o * 0.55; d.d2.position.z = d.z - 0.31 - d.o * 0.55; }
  const br = b.br > 0.05; V.brakeL.material.emissiveIntensity = V.brakeR.material.emissiveIntensity = br ? 3 : 0.5;
  // the lights
  g.lights.forEach((L, i) => { const c = lightAt(L, g.t); V.lightsV[i].lamps.forEach((m, j) => m.material.emissiveIntensity = (['r', 'a', 'g'][j] === c) ? 4 : 0); });
  // people: waiting at the next stops, walking to the door, crossing at zebras
  let pi = 0; const use = () => V.people[pi++];
  g.stops.forEach((st, i) => { if (st.served && !(b.dwell && nextStop(g) === st)) return; if (st.s - b.s > 140) return; const p = pathAt(g, st.s), [rx, rz] = RIGHT(p.h), D = b.dwell && nextStop(g) === st ? b.dwell : null, waiting = D ? st.n - Math.max(0, D.on - D.off) : st.n;
    for (let j = 0; j < Math.min(waiting, 6); j++) { const q = use(); if (!q) break; q.g.visible = true; const walk = D && j === 0 && D.on >= D.off ? clamp((D.t - 0.5 - (D.on) * 0.5) / 0.5 + 1, 0, 1) : 0; const ox = -3.6 + walk * 2.4 + Math.sin(j * 7) * 0.3, oz = -0.5 - j * 0.8 + walk * (0.5 + j * 0.8 - 1.3);
      q.g.position.set(p.x - rx * ox + Math.sin(p.h) * oz, 0.16, p.z - rz * ox + Math.cos(p.h) * oz); q.g.rotation.y = p.h - Math.PI / 2; q.b.position.y = 0.75 + (walk > 0 ? Math.abs(Math.sin(V.t * 12)) * 0.05 : 0); } });
  if (g.runner) { const q = use(); if (q) { const st = nextStop(g), p = pathAt(g, st ? st.s : b.s), f2 = clamp((g.t - g.runner.t0) / g.runner.eta, 0, 1), [rx, rz] = RIGHT(p.h), back = -1.3 + (1 - f2) * 18; q.g.visible = true; q.g.position.set(p.x + rx * 3.2 + Math.sin(p.h) * back, 0.16 + Math.abs(Math.sin(V.t * 14)) * 0.12, p.z + rz * 3.2 + Math.cos(p.h) * back); q.g.rotation.y = p.h + Math.PI; } }
  g.zebras.forEach(Z => { if (!Z.ped) return; const f2 = (g.t - Z.ped.t0) / Z.ped.dur; if (f2 < -0.05 || f2 > 1.05) return; const q = use(); if (!q) return; const p = pathAt(g, Z.s), [rx, rz] = RIGHT(p.h), off = Z.ped.side > 0 ? lerp(3.5, -7, clamp(f2, 0, 1)) : lerp(-7, 3.5, clamp(f2, 0, 1)); q.g.visible = true; q.g.position.set(p.x + rx * off, 0.05, p.z + rz * off); q.g.rotation.y = p.h + (Z.ped.side > 0 ? Math.PI / 2 : -Math.PI / 2); q.b.position.y = 0.75 + Math.abs(Math.sin(V.t * 10)) * 0.05; });
  for (; pi < V.people.length; pi++) V.people[pi].g.visible = false;
  // cars: the ones in your lane, and the oncoming ones
  let ci = 0; for (const car of g.cars) { const c = V.cars[ci++]; if (!c) break; c.g.visible = !car.gone && car.s - b.s < 220; if (!c.g.visible) continue; const p = pathAt(g, car.s - CARLEN / 2), p2 = pathAt(g, car.s - CARLEN); c.g.position.set(p.x, 0, p.z); c.g.rotation.y = Math.atan2(p.x - p2.x, p.z - p2.z); c.bl.material.emissiveIntensity = car.v < 1 ? 2.5 : 0.4; }
  for (; ci < 7; ci++) V.cars[ci].g.visible = false;
  for (const o of V.onc) { o.s -= o.v * dt; if (o.s < b.s - 60) o.s += 260 + Math.random() * 60; const p = pathAt(g, o.s), [rx, rz] = RIGHT(p.h), vis = o.s > -30 && o.s < g.D + 40; o.car.g.visible = vis; o.car.g.position.set(p.x - rx * 3.5, 0, p.z - rz * 3.5); o.car.g.rotation.y = p.h + Math.PI; }
  // the camera: behind and above; at the stop it swings round to the door
  const fw = [Math.sin(yaw), Math.cos(yaw)], rt = RIGHT(yaw), asp = innerWidth / innerHeight, portrait = asp < 0.8, atStop = b.doors > 0;
  let cp, cl; if (atStop) { cp = [f.x + rt[0] * 6 + fw[0] * 9, 6.5, f.z + rt[1] * 6 + fw[1] * 9]; cl = [f.x - fw[0] * 2.5 + rt[0] * 1.2, 1.1, f.z - fw[1] * 2.5 + rt[1] * 1.2]; }
  else { const back = portrait ? 10 : 8, up = portrait ? 6.2 : 5, la = 14 + b.v * 0.8; cp = [r.x - fw[0] * back - rt[0] * 0.8, up, r.z - fw[1] * back - rt[1] * 0.8]; cl = [f.x + fw[0] * la, 1.2, f.z + fw[1] * la]; }
  if (ui.snap || !ui.cam) { ui.cam = { p: cp.slice(), l: cl.slice() }; ui.snap = false; }
  const kk = Math.min(1, dt * (atStop ? 1.8 : 3.2)); for (let i = 0; i < 3; i++) { ui.cam.p[i] += (cp[i] - ui.cam.p[i]) * kk; ui.cam.l[i] += (cl[i] - ui.cam.l[i]) * kk; }
  const cam = W3.cam, sh = FX.shake ? (Math.random() - 0.5) * FX.shake * 0.02 : 0; cam.fov = portrait ? 62 : 50; cam.aspect = asp; cam.updateProjectionMatrix();
  cam.position.set(ui.cam.p[0] + sh, ui.cam.p[1] + sh, ui.cam.p[2]); cam.lookAt(ui.cam.l[0], ui.cam.l[1], ui.cam.l[2]); cam.updateMatrixWorld(); W3.setFocus(f.x + fw[0] * 6, 0, f.z + fw[1] * 6, 30); }
const SV = window.THREE ? new THREE.Vector3() : null;
function scr(x, y, z) { if (!V3 || V3.none) return { x: W / 2, y: H / 2 }; SV.set(x, y, z); return W3.screen(SV); }
// ---------- what happens, seen and heard ----------
function onEvent(G, e) { const cx = W / 2;
  switch (e.k) {
    case 'start': case 'yard': ui.snap = true; ui.banner = { txt: G.lesson ? 'LESSON' : `ROUTE ${(G.N % 90) + 7}`, t: 0, secs: 1.3, col: '#ffd040' }; break;
    case 'arrive': sfx.brakes(); vibe(HAP.light); if (e.perfect) { say('PERFECT STOP!', cx, H * 0.36, '#ffd040', 26); sfx.combo(2); } else say('STOPPED', cx, H * 0.36, '#fff', 20); if (e.late > 3) say(`${e.late} s LATE`, cx, H * 0.42, '#ffb070', 20); else if (!G.yard || G.yard === 'time') say('ON TIME', cx, H * 0.42, '#80ff90', 20); break;
    case 'doors': sfx.doors(); break;
    case 'on': sfx.beep(e.n); break;
    case 'off': sfx.step(); break;
    case 'ready': sfx.bell(); if (e.due >= 0 && G.t < e.due - 1) tip('wait', 'Everyone is on. Wait for the stop\'s time, then press GO. Leaving early is as bad as late.', 3.5); break;
    case 'doorsopen': if (G.bus.dwell && G.bus.dwell.ready == null) tip('doors', 'Wait: people are still getting on.', 2); break;
    case 'runner': say('SOMEONE IS RUNNING FOR IT!', cx, H * 0.3, '#7af0ff', 18); tip('runner', 'Wait a moment for them, if the time allows: they will thank you (and tip).', 3); break;
    case 'thanks': sfx.coin(3); say('THANK YOU! +3 🪙', cx, H * 0.32, '#80ff90', 22); break;
    case 'leftrunner': say('Left them behind...', cx, H * 0.32, '#ffb4a8', 18); break;
    case 'depart': sfx.doorsShut(); if (e.early > 0) { say(`${e.early} s EARLY!`, cx, H * 0.36, '#ffb070', 24); FX.red = 0.4; } break;
    case 'short': tip('short', 'Pull up a little more: the front door goes on the yellow mark.', 3); break;
    case 'missed': sfx.no(); FX.red = 1; ui.banner = { txt: 'MISSED THE STOP', t: 0, secs: 1.5, col: '#ff6a5a' }; break;
    case 'slosh': sfx.slosh(); if (!G.lesson) say(e.turn ? 'EASY ROUND THE CORNER!' : 'SPLASH! GENTLY!', cx, H * 0.5, '#b4e0ff', 18); tip('tea', e.turn ? 'Slow down before a corner: too fast and the tea spills.' : 'Easy on the pedals: tap for a little, hold for a lot.', 3); break;
    case 'camera': sfx.camera(); FX.flash = 1; say('SPEED CAMERA! -3 🪙', cx, H * 0.36, '#ffb070', 20); break;
    case 'red': sfx.alarm(); FX.red = 1; vibe(HAP.heavy); ui.banner = { txt: 'RED LIGHT!', t: 0, secs: 1.4, col: '#ff5a4a' }; if (!G.lesson) say(e.n >= 2 ? 'Two red lights: shift over' : 'One more and the shift is over', cx, H * 0.47, '#ffb4a8', 18); break;
    case 'lightok': break;
    case 'ped': sfx.beep(0); break;
    case 'zebraok': say('THANK YOU!', cx, H * 0.38, '#80ff90', 18); break;
    case 'crash': sfx.crash(); FX.shake = 20; FX.red = 1; vibe(HAP.heavy); ui.banner = { txt: 'CRASH!', t: 0, secs: 1.5, col: '#ff5a4a' }; break;
    case 'won': sfx.win(); break;
    case 'lost': sfx.lose(); break;
    case 'lessonnext': hint = null; break;
    case 'lessonok': sfx.coin(e.n); say(`${e.n} / ${e.need}`, cx, H * 0.46, '#80ff90', 22); break;
    case 'lessonreset': hint = { txt: e.how, t: 0, secs: 3.2 }; break;
    case 'lessonmiss': hint = { txt: e.how, t: 0, secs: 3.2 }; sfx.no(); break;
    case 'lessondone': sfx.goal(); say('LESSON DONE!', cx, H * 0.4, '#80ff90', 28); burst(cx, H * 0.4, '#80ff90', 24); break;
  } }
let IG = null; function idleG() { if (!IG || IG.over) { IG = newGame(Math.max(6, store.get('level', 1) | 0), { seed: (Math.random() * 1e6) | 0 }); IG.mem = {}; ui.snap = true; } honest(IG, { react: 0.3, acc: 0.95 }, IG.mem); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#2a3a2a'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D city.', W / 2, H / 2); if (G) hud(G, now); return; }
  const g = G || idleG(); if (V.built !== g || V.legsFor !== g.legs) { buildRoute(V, g); V.legsFor = g.legs; }
  sync(V, g, dt);
  W3.render(dt);
  if (G && !(G.over && !$('ovEnd').classList.contains('hidden'))) hud(G, now);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 0.9 ? 1 : 1 - (t2.t - 0.9) / 0.5; ctx.globalAlpha = Math.max(0, al); const sc = t2.t < 0.12 ? 1.3 - t2.t / 0.12 * 0.3 : 1; ctx.font = `400 ${Math.round(t2.size * k * sc)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(20,20,30,.65)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 20); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 20); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30, hy = H * 0.62;
    ctx.fillStyle = 'rgba(20,24,36,.88)'; rrect(W / 2 - w / 2, hy - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, hy - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,60,30,${FX.red * 0.2})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${FX.flash * 0.45})`; ctx.fillRect(0, 0, W, H); } }
// ---------- the 2D layer: the pedals, the stop meter, the timetable, the tea ----------
const pedalPos = w => w === 'br' ? { x: 16, y: H - 150 * k, w: W * 0.36, h: 132 * k } : { x: W - 16 - W * 0.36, y: H - 150 * k, w: W * 0.36, h: 132 * k };
function hud(G, t) { ctx.textBaseline = 'middle'; const b = G.bus, st = nextStop(G), i = G.stops.indexOf(st);
  if (G.lesson) lessonPanel(G);
  else { // the top: the clock, the next stop and its time, the tea
    const x0 = 12, w = W - 24, y0 = 46 * k; ctx.fillStyle = 'rgba(14,18,28,.62)'; rrect(x0, y0 - 20 * k, w, 58 * k, 14 * k); ctx.fill();
    ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.font = `400 ${Math.round(22 * k)}px ${TF}`; ctx.fillText(clockTxt(G.t), x0 + 10, y0 - 1 * k);
    if (st) { const left = st.due - G.t; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillText(`NEXT ${i + 1}/${G.stops.length}: ${stopName(G, i).toUpperCase()}`.slice(0, 30), x0 + 78 * k, y0 - 8 * k);
      ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; ctx.fillStyle = left >= 0 ? '#80ff90' : '#ffb070'; ctx.fillText(st.due < 0 ? 'NO TIMETABLE' : left >= 0 ? `DUE ${clockTxt(st.due)} · in ${Math.ceil(left)} s` : `DUE ${clockTxt(st.due)} · ${Math.ceil(-left)} s LATE`, x0 + 78 * k, y0 + 9 * k); }
    // the tea cup (comfort)
    const cx = x0 + w - 26 * k, cy = y0 + 8 * k; ctx.fillStyle = 'rgba(255,255,255,.9)'; rrect(cx - 13 * k, cy - 14 * k, 26 * k, 28 * k, 5 * k); ctx.fill(); ctx.fillStyle = '#a0682a'; const lv = G.tea / 100; rrect(cx - 11 * k, cy + 12 * k - 24 * k * lv, 22 * k, 24 * k * lv, 3 * k); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx + 15 * k, cy, 6 * k, -1.2, 1.2); ctx.stroke(); ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText('TEA', cx, cy + 24 * k);
    ctx.textAlign = 'center'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = '#ffd040'; ctx.fillText(`🧍 ${G.pax} on board`, W / 2, y0 + 50 * k); }
  // the banner
  if (ui.banner) { const B = ui.banner, sc = B.t < 0.12 ? 1.25 - B.t / 0.12 * 0.25 : 1; ctx.textAlign = 'center'; ctx.font = `400 ${Math.round(40 * k * sc)}px ${TF}`; ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(10,12,20,.7)'; ctx.strokeText(B.txt, W / 2, H * 0.3); ctx.fillStyle = B.col || '#fff'; ctx.fillText(B.txt, W / 2, H * 0.3); }
  // the next light, the speed limit
  const L = G.lights.find(q => !q.passed && q.s - b.s < 70 && q.s > b.s); if (L) { const c = lightAt(L, G.t), x = W - 30 * k, y = 120 * k; ctx.fillStyle = 'rgba(10,12,16,.85)'; rrect(x - 14 * k, y - 34 * k, 28 * k, 68 * k, 7 * k); ctx.fill(); ['r', 'a', 'g'].forEach((q, j) => { ctx.fillStyle = q === c ? ['#ff3a2a', '#ffb020', '#30ff70'][j] : 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.arc(x, y - 21 * k + j * 21 * k, 8 * k, 0, TAU); ctx.fill(); }); ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText(`${Math.round(L.s - b.s)} m`, x, y + 44 * k); }
  const z = G.zones.find(q => b.s >= q.s0 - 25 && b.s <= q.s1); if (z) { const x = 30 * k, y = 122 * k, over = b.v > z.lim + 1.4 && b.s >= z.s0; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 20 * k, 0, TAU); ctx.fill(); ctx.strokeStyle = over && Math.sin(t * 16) > 0 ? '#ffd040' : '#e02020'; ctx.lineWidth = 5 * k; ctx.stroke(); ctx.fillStyle = '#111'; ctx.font = `400 ${Math.round(15 * k)}px ${TF}`; ctx.textAlign = 'center'; ctx.fillText(Math.round(z.lim * 3.6), x, y + 1); }
  // the stop meter: where the front door is against the mark
  if (st && b.doors <= 0) { const d = st.s - b.s; if (d < 90 && d > -6) { const y = H * 0.2, w2 = Math.min(280 * k, W - 40), x0 = W / 2 - w2 / 2, span = 20, X = q => x0 + w2 / 2 + clamp(q, -span / 2, span / 2) / span * w2;
      ctx.fillStyle = 'rgba(14,18,28,.6)'; rrect(x0 - 10, y - 26 * k, w2 + 20, 52 * k, 12 * k); ctx.fill(); ctx.fillStyle = 'rgba(120,255,140,.35)'; ctx.fillRect(X(-1.6), y - 9 * k, X(1.6) - X(-1.6), 18 * k); ctx.fillStyle = '#ffd040'; ctx.fillRect(X(-0.5), y - 9 * k, X(0.5) - X(-0.5), 18 * k);
      ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2; ctx.strokeRect(x0, y - 9 * k, w2, 18 * k); const bx = X(-d); ctx.fillStyle = Math.abs(d) <= 1.6 ? '#80ff90' : '#fff'; ctx.beginPath(); ctx.moveTo(bx, y - 12 * k); ctx.lineTo(bx - 8 * k, y - 22 * k); ctx.lineTo(bx + 8 * k, y - 22 * k); ctx.closePath(); ctx.fill(); ctx.fillRect(bx - 1.5, y - 12 * k, 3, 24 * k);
      ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText(d > 1.6 ? `STOP IN ${Math.round(d)} m` : d >= -1.6 ? (b.v < 0.06 ? 'DOORS OPENING' : 'STOP NOW!') : 'TOO FAR!', W / 2, y + 19 * k); } }
  // boarding, then the time to leave
  if (b.doors > 0 && b.dwell) { const D = b.dwell, want = D.off + D.board, y = H * 0.2; ctx.fillStyle = 'rgba(14,18,28,.65)'; rrect(W / 2 - 130 * k, y - 26 * k, 260 * k, 56 * k, 12 * k); ctx.fill(); ctx.textAlign = 'center';
    if (D.on < want) { ctx.font = `400 ${Math.round(18 * k)}px ${TF}`; ctx.fillStyle = '#fff'; ctx.fillText(D.on < D.off ? `GETTING OFF ${D.on}/${D.off}` : `GETTING ON ${D.on - D.off}/${D.board}`, W / 2, y); }
    else if (st) { const left = st.due - G.t; ctx.font = `400 ${Math.round(18 * k)}px ${TF}`; if (G.runner) { ctx.fillStyle = '#7af0ff'; ctx.fillText('SOMEONE IS COMING... WAIT', W / 2, y); } else if (st.due >= 0 && left > 0.5) { ctx.fillStyle = '#ffd040'; ctx.fillText(`LEAVE AT ${clockTxt(st.due)} · ${Math.ceil(left)} s`, W / 2, y); } else { ctx.fillStyle = '#80ff90'; ctx.globalAlpha = 0.7 + 0.3 * Math.sin(t * 10); ctx.fillText('ALL ON: PRESS GO!', W / 2, y); ctx.globalAlpha = 1; } } }
  // speed
  ctx.textAlign = 'center'; ctx.font = `400 ${Math.round(26 * k)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(10,12,20,.6)'; const kmh = Math.round(b.v * 3.6); ctx.strokeText(kmh, W / 2, H - 112 * k); ctx.fillStyle = '#fff'; ctx.fillText(kmh, W / 2, H - 112 * k); ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillText('km/h', W / 2, H - 92 * k);
  pedals(G, t);
  if (G.N <= 1 && !G.lesson && G.t < 5) { ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 5); ctx.font = `400 ${Math.round(15 * k)}px ${TF}`; ctx.fillStyle = '#fff'; ctx.fillText('HOLD GO TO DRIVE', W / 2, H - 175 * k); ctx.globalAlpha = 1; } }
function pedals(G, t) { const b = G.bus; for (const [w, name, col, lv] of [['br', 'BRAKE', '#e0463a', b.br], ['go', 'GO', '#2fbf5a', b.go]]) { const p = pedalPos(w), held = w === 'go' ? b.goH : b.brH;
    ctx.fillStyle = 'rgba(14,18,28,.45)'; rrect(p.x, p.y, p.w, p.h, 18 * k); ctx.fill(); ctx.fillStyle = col; ctx.globalAlpha = 0.35 + 0.55 * lv; rrect(p.x, p.y + p.h * (1 - lv), p.w, p.h * lv, 18 * k); ctx.fill(); ctx.globalAlpha = 1;
    ctx.strokeStyle = held ? '#fff' : 'rgba(255,255,255,.55)'; ctx.lineWidth = (held ? 4 : 2.5) * k; rrect(p.x, p.y, p.w, p.h, 18 * k); ctx.stroke();
    for (let i = 0; i < 4; i++) { ctx.fillStyle = 'rgba(255,255,255,.18)'; rrect(p.x + p.w * 0.2, p.y + p.h * (0.22 + i * 0.16), p.w * 0.6, 5 * k, 3); ctx.fill(); }
    ctx.fillStyle = '#fff'; ctx.font = `400 ${Math.round(20 * k)}px ${TF}`; ctx.textAlign = 'center'; ctx.fillText(name, p.x + p.w / 2, p.y + p.h / 2);
    if (w === 'go' && b.doors > 0 && b.dwell && b.dwell.on >= b.dwell.off + b.dwell.board && !G.runner) { const st = nextStop(G); if (st && (st.due < 0 || G.t >= st.due - 0.3)) { ctx.strokeStyle = '#80ff90'; ctx.lineWidth = 5 * k; ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 10); rrect(p.x - 4, p.y - 4, p.w + 8, p.h + 8, 20 * k); ctx.stroke(); ctx.globalAlpha = 1; } } } }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { const D = G.lesson, st = D.steps[D.i], x = 12, w = W - 24, y = 44 * k; ctx.save(); ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; const lines = wrapText(st.how, w - 24), h = 50 * k + lines.length * 17 * k;
  ctx.fillStyle = 'rgba(20,24,36,.88)'; rrect(x, y, w, h, 12); ctx.fill(); ctx.strokeStyle = 'rgba(255,208,64,.7)'; ctx.lineWidth = 2; rrect(x, y, w, h, 12); ctx.stroke();
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#ffd040'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillText(`LESSON ${G.N} OF 3 · ${D.n}/${st.need}`, x + 12, y + 9 * k);
  ctx.fillStyle = '#fff'; ctx.font = `400 ${Math.round(16 * k)}px ${TF}`; ctx.fillText(st.title, x + 12, y + 23 * k); ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.92)'; lines.forEach((l, i) => ctx.fillText(l, x + 12, y + 46 * k + i * 17 * k)); ctx.restore(); ctx.textBaseline = 'middle'; }
