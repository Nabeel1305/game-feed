// ===================== THE VIEW: Bin Round in 3D (three.js; sky, light, weather from tools/world3d.js) =====================
// A quiet residential street: a road with kerbs and pavements, front gardens with hedges and gates, houses in brick, cream and
// painted render with pitched roofs, trees, lamp posts. Your bin lorry (your colour), you in a hi-vis vest on the back step,
// Sam the driver's mate. Bins, recycling boxes, garden bins, bags and the odd armchair wait at each gate. The camera sits
// behind your shoulder at the back of the lorry, turned toward the house you are working.
const FX = { shake: 0, stop: 0, flash: 0, red: 0, slow: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { snap: true, cam: null, banner: null, hold: null, drag: null };
function say(txt, x, y, col = '#fff', size = 22) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 140) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60 * k, t: 0, life: 0.5 + Math.random() * 0.4, col, r: (1.5 + Math.random() * 2.2) * k }); } if (PARTS.length > 240) PARTS.splice(0, PARTS.length - 240); }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2.5); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.8) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (ui.banner) { ui.banner.t += dt; if (ui.banner.t > (ui.banner.secs || 2.4)) ui.banner = null; }
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; } }
function mySkin() { if (typeof HEADLESS !== 'undefined' && HEADLESS) return SKINS[0]; const id = store.get('skin', 'green'); return SKINS.find(q => q.id === id) || SKINS[0]; }
const ICON = { bin: '🗑️', bag: '🛍️', recycle: '♻️', garden: '🌿', bulky: '🛋️', litter: '✨' };
// ---------- the world ----------
function buildWorld() {
  if (V3) return V3; const T = window.THREE; if (!T || !W3 || !W3.init({ canvas: $('gl'), fov: 62, far: 900, near: 0.1 })) { V3 = { none: true }; return V3; }
  V3 = { T, S: W3.scene, t: 0, for: null }; const V = V3, M = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.8 }, o)); V.M = M;
  W3.scene.children.forEach(o => { if (o.isLineSegments) o.visible = false; });
  V.boxG = new T.BoxGeometry(1, 1, 1); V.sphG = new T.SphereGeometry(1, 14, 10); V.cylG = new T.CylinderGeometry(1, 1, 1, 14); V.prismG = new T.CylinderGeometry(1, 1, 1, 3); V.coneG = new T.ConeGeometry(1, 1, 10);
  V.ground = new T.Mesh(new T.PlaneGeometry(1600, 1600), M(0x6e9a4e, { map: W3.grainTex(256, 4, 190, 40, 2) })); V.ground.material.map.repeat.set(220, 220); V.ground.rotation.x = -Math.PI / 2; V.ground.position.y = -0.04; V.ground.receiveShadow = true; V.S.add(V.ground);
  V.asphalt = M(0x4a4d53, { roughness: 0.85, map: W3.grainTex(256, 9, 170, 45, 8) }); V.pave = M(0xbdb7aa, { roughness: 0.9, map: W3.grainTex(256, 13, 200, 30, 4) }); V.kerb = M(0xd8d4ca, { roughness: 0.7 });
  V.lawn = M(0x79a95a, { roughness: 0.95, map: W3.grainTex(256, 21, 200, 50, 3) }); V.hedge = M(0x3f6e32, { roughness: 1 }); V.white = M(0xf2efe8, { roughness: 0.6 }); V.glass = new T.MeshPhysicalMaterial({ color: 0x223040, roughness: 0.1, metalness: 0.3, clearcoat: 1 });
  V.walls = [0xb0563a, 0xe8dcc0, 0xf2f0ea, 0x9fb4c0, 0xb8c8a8, 0xd8a878].map(c => M(c, { roughness: 0.85 })); V.roofs = [0x5a3a30, 0x3a3e46, 0x6a4a3a].map(c => M(c, { roughness: 0.7 })); V.doors = [0x2a5ad0, 0xc03030, 0x2a7a4a, 0x303030, 0xf2c230].map(c => M(c, { roughness: 0.5 }));
  V.skinM = [0x8d5524, 0xc68642, 0xe0ac69, 0x5a3825, 0xf1c27d].map(c => M(c, { roughness: 0.6 })); V.clothM = [0xe8463c, 0x2f7de0, 0x2fb060, 0xf2c230, 0x8a4fd0, 0xf07a2a, 0x22b8c8, 0xe85aa0, 0x404650].map(c => M(c, { roughness: 0.75 }));
  V.kindM = { bin: M(0x3a3f45, { roughness: 0.5 }), recycle: M(0x2a6ad8, { roughness: 0.5 }), garden: M(0x3a8a3a, { roughness: 0.5 }), bag: M(0x15161a, { roughness: 0.35, metalness: 0.1 }), bulky: M(0xa84a3a, { roughness: 0.9 }), litter: M(0xe8d8a8) };
  V.lorry = makeLorry(V); V.S.add(V.lorry.g);
  V.me = makePerson(V, 0, true); V.S.add(V.me.g); V.sam = makePerson(V, 6, true); V.S.add(V.sam.g);
  V.res = makePerson(V, 3, false); V.S.add(V.res.g); V.cat = makeCat(V); V.S.add(V.cat);
  V.items = []; for (let i = 0; i < 16; i++) { const it = makeItem(V); it.g.visible = false; V.S.add(it.g); V.items.push(it); }
  V.marks = []; V.ringM = new T.MeshBasicMaterial({ color: 0xfff2a0, transparent: true, opacity: 0.6, depthWrite: false });
  for (let i = 0; i < 16; i++) { const r = new T.Mesh(new T.RingGeometry(0.42, 0.55, 28), V.ringM); r.rotation.x = -Math.PI / 2; r.visible = false; V.S.add(r); V.marks.push(r); }
  // leaves blowing along the street (autumn), petals (spring)
  { const n = 70, g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(new Float32Array(n * 3), 3)); V.leaves = new T.Points(g, new T.PointsMaterial({ color: 0xd88a30, size: 0.16, transparent: true, opacity: 0.9 })); V.leafD = Array.from({ length: n }, () => ({ x: (Math.random() - 0.5) * 14, y: Math.random() * 2, z: Math.random() * 40, s: Math.random() })); V.S.add(V.leaves); }
  V.dust = []; for (let i = 0; i < 18; i++) { const m = new T.Mesh(V.boxG, V.kindM.litter); m.scale.setScalar(0.08); m.visible = false; V.S.add(m); V.dust.push({ m, t: 9, vx: 0, vy: 0, vz: 0 }); }
  W3.setQuality(stepN); return V; }
function makeLorry(V) { const T = V.T, g = new T.Group(), M = V.M, paint = new T.MeshPhysicalMaterial({ color: mySkin().col, roughness: 0.35, clearcoat: 0.7 }); g.userData.paint = paint;
  const B = (w, h, d, x, y, z, m, sh = true) => { const ms = new T.Mesh(V.boxG, m); ms.scale.set(w, h, d); ms.position.set(x, y, z); ms.castShadow = sh; g.add(ms); return ms; };
  B(2.5, 2.9, 5.6, 0, 2.15, 3.8, paint); B(2.55, 0.25, 5.7, 0, 0.75, 3.8, M(0x2a2c30));
  B(2.45, 2.3, 1.9, 0, 1.85, 7.7, M(0xf2f0ea, { roughness: 0.4 })); B(2.3, 0.9, 0.06, 0, 2.4, 8.66, V.glass); B(0.06, 0.8, 1.2, 1.24, 2.4, 7.6, V.glass); B(0.06, 0.8, 1.2, -1.24, 2.4, 7.6, V.glass);
  // the rear: hopper opening, the lifting frame, the back step, the compactor plate
  B(2.5, 1.0, 1.0, 0, 1.0, 0.5, M(0x202226, { roughness: 0.6 })); B(2.3, 0.7, 0.2, 0, 1.25, 0.02, M(0x0c0d0f, { roughness: 0.9 }), false);
  const lip = B(2.55, 0.12, 0.25, 0, 1.6, 0.05, M(0xd8d0b8, { roughness: 0.5 }));
  for (const sx of [-0.8, 0.8]) B(0.1, 1.1, 0.1, sx, 0.9, -0.05, M(0x9aa0a8, { metalness: 0.7, roughness: 0.3 }));
  B(2.5, 0.08, 0.5, 0, 0.42, -0.2, M(0x8a8f98, { metalness: 0.6, roughness: 0.4 }));
  const blade = B(2.2, 1.6, 0.12, 0, 2.1, 1.05, M(0x6a6f78, { metalness: 0.5, roughness: 0.4 }));
  const stripe = B(2.52, 0.18, 5.62, 0, 1.25, 3.8, M(0xf2f0ea, { roughness: 0.5 }));
  const beacon = new T.Mesh(V.sphG, new T.MeshStandardMaterial({ color: 0xffa020, emissive: 0xff8a00, emissiveIntensity: 0 })); beacon.scale.setScalar(0.16); beacon.position.set(0.8, 3.1, 7.9); g.add(beacon);
  const wheels = []; for (const z of [1.6, 4.8, 7.6]) for (const sx of [-1.15, 1.15]) { const w = new T.Mesh(V.cylG, M(0x18191c)); w.scale.set(0.5, 0.32, 0.5); w.rotation.z = Math.PI / 2; w.position.set(sx, 0.5, z); w.castShadow = true; g.add(w); wheels.push(w); }
  const sh = new T.Mesh(new T.PlaneGeometry(3, 9.5), new T.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.3, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.position.set(0, 0.03, 4.3); g.add(sh);
  return { g, paint, blade, beacon, wheels, lip }; }
function makePerson(V, i, crew) { const T = V.T, g = new T.Group(), sk = V.skinM[(i * 3) % V.skinM.length], cl = crew ? V.M(mySkin().vest, { emissive: mySkin().vest, emissiveIntensity: 0.12 }) : V.clothM[i % V.clothM.length];
  const legs = new T.Mesh(new T.CapsuleGeometry(0.11, 0.55, 2, 6), V.M(crew ? 0x2a2e3a : 0x50586a)); legs.position.y = 0.42; legs.castShadow = true; g.add(legs);
  const b = new T.Mesh(new T.CapsuleGeometry(0.22, 0.5, 3, 8), cl); b.position.y = 1.05; b.castShadow = true; g.add(b);
  if (crew) { const st = new T.Mesh(V.cylG, V.M(0xe8e8e8, { emissive: 0x888888, emissiveIntensity: 0.4 })); st.scale.set(0.235, 0.06, 0.235); st.position.y = 1.0; g.add(st); }
  const h = new T.Mesh(V.sphG, sk); h.scale.setScalar(0.14); h.position.y = 1.58; h.castShadow = true; g.add(h);
  const arm = new T.Group(), a = new T.Mesh(new T.CapsuleGeometry(0.06, 0.45, 2, 6), cl); a.position.y = -0.25; arm.add(a); arm.position.set(0.27, 1.3, 0); g.add(arm);
  const arm2 = new T.Group(), a2 = new T.Mesh(new T.CapsuleGeometry(0.06, 0.45, 2, 6), cl); a2.position.y = -0.25; arm2.add(a2); arm2.position.set(-0.27, 1.3, 0); g.add(arm2);
  return { g, b, h, arm, arm2, cl }; }
function makeCat(V) { const T = V.T, g = new T.Group(), m = V.M(0xe08a3a); const b = new T.Mesh(V.sphG, m); b.scale.set(0.16, 0.14, 0.26); b.position.y = 0.15; g.add(b); const h = new T.Mesh(V.sphG, m); h.scale.setScalar(0.1); h.position.set(0, 0.28, 0.24); g.add(h);
  for (const sx of [-0.05, 0.05]) { const e = new T.Mesh(V.coneG, m); e.scale.set(0.035, 0.07, 0.035); e.position.set(sx, 0.38, 0.24); g.add(e); }
  const tail = new T.Group(), tm = new T.Mesh(V.cylG, m); tm.scale.set(0.025, 0.3, 0.025); tm.position.y = 0.15; tail.add(tm); tail.position.set(0, 0.15, -0.24); tail.rotation.x = -0.6; g.add(tail); g.userData.tail = tail; return g; }
function makeItem(V) { const T = V.T, g = new T.Group(), body = new T.Group(); g.add(body); const parts = {};
  const bin = new T.Group(); { const b = new T.Mesh(V.boxG, V.kindM.bin); b.scale.set(0.6, 0.95, 0.7); b.position.y = 0.55; b.castShadow = true; bin.add(b); const lid = new T.Mesh(V.boxG, V.kindM.bin); lid.scale.set(0.66, 0.07, 0.76); lid.position.y = 1.06; lid.castShadow = true; bin.add(lid);
    for (const sx of [-0.25, 0.25]) { const w = new T.Mesh(V.cylG, V.M(0x111214)); w.scale.set(0.11, 0.06, 0.11); w.rotation.z = Math.PI / 2; w.position.set(sx, 0.11, -0.32); bin.add(w); } parts.binB = b; parts.binL = lid; }
  body.add(bin); parts.bin = bin;
  const bag = new T.Mesh(V.sphG, V.kindM.bag); bag.scale.set(0.3, 0.36, 0.28); bag.position.y = 0.34; bag.castShadow = true; body.add(bag); parts.bag = bag;
  const knot = new T.Mesh(V.coneG, V.kindM.bag); knot.scale.set(0.08, 0.14, 0.08); knot.position.y = 0.74; bag.add(knot); knot.position.set(0, 1.05, 0); knot.scale.set(0.28, 0.4, 0.28);
  const chair = new T.Group(); { const m = V.kindM.bulky; const s = new T.Mesh(V.boxG, m); s.scale.set(0.9, 0.42, 0.8); s.position.y = 0.3; chair.add(s); const bk = new T.Mesh(V.boxG, m); bk.scale.set(0.9, 0.7, 0.2); bk.position.set(0, 0.75, -0.32); chair.add(bk);
    for (const sx of [-0.4, 0.4]) { const a = new T.Mesh(V.boxG, m); a.scale.set(0.16, 0.3, 0.8); a.position.set(sx, 0.6, 0); chair.add(a); } chair.traverse(o => { if (o.isMesh) o.castShadow = true; }); }
  body.add(chair); parts.chair = chair;
  const bits = new T.Group(); for (let i = 0; i < 4; i++) { const b = new T.Mesh(V.boxG, V.M([0xe8d8a8, 0xd84a3a, 0x3a7ad8, 0xf2f2f2][i])); b.scale.set(0.12, 0.03, 0.08); b.position.set((i % 2 - 0.5) * 0.25, 0.02, (i >> 1) * 0.2 - 0.1); b.rotation.y = i; bits.add(b); } body.add(bits); parts.bits = bits;
  const top = new T.Mesh(V.sphG, V.kindM.bag); top.scale.set(0.2, 0.18, 0.2); top.position.y = 1.18; body.add(top); parts.wrong = top;
  const note = new T.Mesh(V.boxG, V.M(0xfffbe8, { emissive: 0xfff0c0, emissiveIntensity: 0.3 })); note.scale.set(0.24, 0.015, 0.18); note.position.y = 1.11; note.rotation.y = 0.3; body.add(note); parts.note = note;
  return { g, body, parts, id: null }; }
// ---------- the street, built once per round ----------
function hashN(n) { n = (n ^ 61) ^ (n >>> 16); n = n + (n << 3); n = n ^ (n >>> 4); n = Math.imul(n, 0x27d4eb2d); return ((n ^ (n >>> 15)) >>> 0) / 4294967296; }
function buildStreet(V, G) { const T = V.T, key = G.seed + ':' + G.N + ':' + G.stops.length; if (V.for === key) return; V.for = key;
  if (V.street) { V.S.remove(V.street); V.street.traverse(o => { if (o.geometry && ![V.boxG, V.sphG, V.cylG, V.prismG, V.coneG].includes(o.geometry)) o.geometry.dispose(); }); }
  const g = new T.Group(); V.street = g; V.S.add(g); const R = rng(G.seed ^ 0x51ed), z0 = -60, z1 = stopZ(G, Math.max(G.stops.length, 1)) + 70, len = z1 - z0;
  const strip = (x0, x1, y, m) => { const ms = new T.Mesh(new T.PlaneGeometry(x1 - x0, len), m); ms.rotation.x = -Math.PI / 2; ms.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); ms.receiveShadow = true; g.add(ms); if (ms.material.map) { } return ms; };
  strip(-3.6, 3.6, 0.0, V.asphalt); for (const s of [-1, 1]) { strip(s > 0 ? 3.75 : -5.6, s > 0 ? 5.6 : -3.75, 0.12, V.pave); const kb = new T.Mesh(V.boxG, V.kerb); kb.scale.set(0.15, 0.14, len); kb.position.set(s * 3.68, 0.07, (z0 + z1) / 2); kb.receiveShadow = true; g.add(kb); strip(s > 0 ? 5.6 : -16, s > 0 ? 16 : -5.6, 0.02, V.lawn); }
  { const dash = new T.MeshBasicMaterial({ color: 0xf2f0e8 }); for (let z = z0; z < z1; z += 6) { const d = new T.Mesh(new T.PlaneGeometry(0.14, 2.6), dash); d.rotation.x = -Math.PI / 2; d.position.set(0, 0.01, z); g.add(d); } }
  // houses along both sides; the one at each stop faces the lorry
  const stopAt = {}; G.stops.forEach(S => { stopAt[S.side + ':' + Math.round(S.z / 8.5)] = S; });
  for (const s of [-1, 1]) for (let z = z0 + 6; z < z1 - 6; z += 8.5) { const S = G.stops.find(q => q.side === s && Math.abs(q.z - z) < 4.3), hz = S ? S.z : z, hv = (hashN(Math.round(z) * 7 + (s > 0 ? 3 : 11) + G.seed) * 1e3) | 0;
    if (!S && G.stops.some(q => q.side === s && Math.abs(q.z - z) < 8.5)) continue;
    house(V, g, s, hz, hv, !!S); }
  for (const s of [-1, 1]) for (let z = z0; z < z1; z += 22) { const lamp = new T.Group(), p = new T.Mesh(V.cylG, V.M(0x3a3e46, { metalness: 0.5 })); p.scale.set(0.07, 4.6, 0.07); p.position.y = 2.3; lamp.add(p); const hd = new T.Mesh(V.boxG, new T.MeshStandardMaterial({ color: 0xfff2d0, emissive: 0xffd890, emissiveIntensity: 0.4 })); hd.scale.set(0.5, 0.12, 0.25); hd.position.set(-s * 0.3, 4.6, 0); lamp.add(hd); lamp.position.set(s * 5.45, 0, z + (s > 0 ? 11 : 0)); if (!G.stops.some(S => lamp.position.z > S.z - 17 && lamp.position.z < S.z + 7)) g.add(lamp); }
  for (let i = 0; i < 26; i++) { const s = i % 2 ? 1 : -1, z = z0 + R() * len, x = s * (14 + R() * 10), tr = new T.Group(), tk = new T.Mesh(V.cylG, V.M(0x5a4030)); tk.scale.set(0.18, 2.4, 0.18); tk.position.y = 1.2; tr.add(tk); const cr = new T.Mesh(V.sphG, V.M(G.season.id === 'autumn' ? [0xc8702a, 0xd8a030, 0x9a5a2a][i % 3] : G.season.id === 'winter' ? 0x6a6a58 : [0x3f7a34, 0x4f8a3a, 0x356a2e][i % 3], { roughness: 1 })); cr.scale.set(1.8, 2.0, 1.8); cr.position.y = 3.4; cr.castShadow = true; tr.add(cr); tr.position.set(x, 0, z); g.add(tr); }
  V.leaves.material.color.setHex(G.season.id === 'spring' ? 0xffc8e0 : G.season.id === 'winter' ? 0xf4f6ff : 0xd88a30); V.leaves.visible = G.season.id !== 'summer';
  V.ground.material.color.setHex(G.season.id === 'winter' ? 0x8a9a78 : G.season.id === 'autumn' ? 0x7a9050 : 0x6e9a4e); V.lawn.color.setHex(G.season.id === 'winter' ? 0x9aa888 : G.season.id === 'autumn' ? 0x88a05a : 0x79a95a);
  W3.setSky(G.sky); V.lorry.paint.color.setHex(mySkin().col); [V.me, V.sam].forEach(p => { p.cl.color.setHex(mySkin().vest); p.cl.emissive.setHex(mySkin().vest); }); }
function house(V, g, s, z, hv, isStop) { const T = V.T, h = new T.Group(), wm = V.walls[hv % V.walls.length], rm = V.roofs[(hv >> 3) % V.roofs.length], dm = V.doors[(hv >> 5) % V.doors.length], fx = s * 13.2, w = 7, d = 6, ht = 5.2 + ((hv >> 7) % 3) * 0.4;
  const B = (sx, sy, sz, x, y, zz, m, sh = true) => { const ms = new T.Mesh(V.boxG, m); ms.scale.set(sx, sy, sz); ms.position.set(x, y, zz); ms.castShadow = sh; ms.receiveShadow = true; h.add(ms); return ms; };
  B(d, ht, w, fx + s * d / 2, ht / 2, 0, wm); const roof = new T.Mesh(V.prismG, rm); roof.scale.set(d * 0.6, w + 0.4, 2.0); roof.rotation.x = -Math.PI / 2; roof.position.set(fx + s * d / 2, ht + 1.0, 0); roof.castShadow = true; h.add(roof);
  const face = fx - s * 0.03; B(0.08, 2.1, 1.0, face, 1.05, -1.2, dm); B(0.1, 0.3, 1.3, face - s * 0.02, 2.25, -1.2, V.white);
  for (const [wz, wy] of [[1.6, 1.5], [1.6, 3.8], [-1.2, 3.8]]) { B(0.08, 1.2, 1.4, face, wy, wz, V.glass, false); B(0.1, 0.12, 1.6, face - s * 0.01, wy - 0.66, wz, V.white, false); }
  // front garden: path to the door, a hedge along the pavement with a gate gap, flowers
  const path = new T.Mesh(new T.PlaneGeometry(fx - s * 5.6, 1.1), V.pave); path.rotation.x = -Math.PI / 2; path.position.set(s * (5.6 + Math.abs(fx - s * 5.6) / 2), 0.05, -1.2); path.scale.x = s; h.add(path);
  for (const [z0, z1] of [[-3.5, -2.0], [-0.3, 3.5]]) { const hd = B(0.6, 0.9, z1 - z0, s * 5.9, 0.45, (z0 + z1) / 2, V.hedge); }
  for (let i = 0; i < 5; i++) { const f = new T.Mesh(V.sphG, V.M([0xe85a8a, 0xf2d040, 0xffffff, 0xa060e0][(hv + i) % 4], { roughness: 0.9 })); f.scale.setScalar(0.18); f.position.set(s * (7.2 + (i % 2) * 0.8), 0.25, 0.6 + i * 0.55); h.add(f); }
  if ((hv >> 9) % 3 === 0) { const wl = B(0.35, 0.7, 2.2, s * 6.5, 0.35, 2.6, V.M(0xb8a890), true); }
  h.position.z = z; g.add(h); }
// ---------- each frame: put everything where the rules say ----------
function sync(V, G, dt) { V.t += dt; buildStreet(V, G); const T = V.T, L = G.lorry, S = G.stops[Math.min(G.si, G.stops.length - 1)] || { side: 1, z: L.z + 4 }, side = S.side, w = G.wk;
  const lx = side * LANE; V.lorry.g.position.set(lx, 0, L.z); V.lorry.beacon.material.emissiveIntensity = L.state === 'stopped' ? (Math.sin(V.t * 6) > 0 ? 1.6 : 0.1) : 0;
  for (const wh of V.lorry.wheels) wh.rotation.x += L.v * dt / 0.5; V.lorry.blade.position.z = 1.05 + (G.compact > 0 ? Math.sin((2.2 - G.compact) / 2.2 * Math.PI) * 2.4 : 0);
  // me and Sam
  const me = V.me, walking = ['walk', 'bring', 'return', 'hop', 'board'].includes(w.st) || (w.st === 'idle' && Math.hypot(w.x - hopper(G).x, w.z - hopper(G).z) > 0.05);
  if (w.st === 'ride') me.g.position.set(lx + side * 0.8, 0.45, L.z - 0.25); else me.g.position.set(w.x, 0, w.z);
  me.g.rotation.y = w.st === 'ride' ? Math.PI : (w.face != null ? w.face : side * Math.PI / 2); me.g.position.y += walking ? Math.abs(Math.sin(V.t * 9)) * 0.05 : 0;
  const it0 = carried(G); me.arm.rotation.x = (w.st === 'lift' && it0) ? -1.6 - Math.min(1, it0.p) * 0.6 : walking ? Math.sin(V.t * 9) * 0.5 : w.st === 'ride' ? -2.2 : 0; me.arm2.rotation.x = (w.st === 'lift' || w.st === 'bring') ? me.arm.rotation.x : -me.arm.rotation.x;
  const sam = V.sam; if (G.sam.st === 'help' && it0 && it0.kind === 'bulky') { sam.g.position.set(it0.x + side * 0.6, 0, it0.z + 0.5); sam.g.rotation.y = me.g.rotation.y; sam.arm.rotation.x = sam.arm2.rotation.x = -1.2; }
  else { sam.g.position.set(lx - side * 0.8, 0.45, L.z - 0.25); sam.g.rotation.y = Math.PI; sam.arm.rotation.x = -2.2; sam.arm2.rotation.x = 0; }
  // the resident at the door, the cat on the wall
  const rs = V.res; rs.g.visible = !!(S && S.resident && L.state === 'stopped'); if (rs.g.visible) { rs.g.position.set(side * 12.6, 0, S.z - 1.2); rs.g.rotation.y = -side * Math.PI / 2; rs.arm.rotation.z = S.done || G.t % 9 < 1.5 ? Math.PI * 0.8 + Math.sin(V.t * 8) * 0.3 : 0; }
  V.cat.visible = !!(S && S.cat); if (V.cat.visible) { V.cat.position.set(side * 6.5, 0.7, S.z + 2.6); V.cat.rotation.y = -side * Math.PI / 2 + Math.sin(V.t * 0.4) * 0.6; V.cat.userData.tail.rotation.z = Math.sin(V.t * 3) * 0.5; }
  // the bins and bags
  const live = G.items.filter(q => !(q.st === 'done' && (q.kind === 'bag' || q.kind === 'litter' || q.kind === 'bulky') && !(q.fly > 0)));
  V.items.forEach((m, i) => { const q = live[i]; m.g.visible = !!q; V.marks[i].visible = false; if (!q) return; const P = m.parts, kd = q.kind, isBin = kd === 'bin' || kd === 'recycle' || kd === 'garden';
    P.bin.visible = isBin; P.bag.visible = kd === 'bag'; P.chair.visible = kd === 'bulky'; P.bits.visible = kd === 'litter'; P.wrong.visible = !!q.wrong; P.note.visible = !!q.note && isBin;
    if (isBin) { P.binB.material = V.kindM[kd]; P.binL.material = V.kindM[kd]; }
    m.g.position.set(q.x, 0.12, q.z); const lifting = q.id === w.item && (w.st === 'lift' || w.st === 'ready' || w.st === 'lower');
    if (lifting) { const p = Math.min(1.15, q.p), a = Math.min(1, p) * 2.3; m.g.position.set(hopper(G).x, 0.12 + Math.min(1, p) * 1.2, hopper(G).z + 0.75 - Math.min(1, p) * 0.4); m.body.rotation.set(-a * (isBin || kd === 'bulky' ? 1 : 0.5), 0, 0); if (p >= 1) m.body.rotation.x += Math.sin(V.t * 30) * 0.06; P.binL.rotation.x = p > 0.6 ? -1.2 : 0; P.binL.position.z = p > 0.6 ? 0.3 : 0; }
    else { m.body.rotation.set(0, (q.st === 'wait' ? q.rot : 0) + (side > 0 ? -Math.PI / 2 : Math.PI / 2), 0); P.binL.rotation.x = 0; P.binL.position.z = 0; if (q.st === 'bring' || q.st === 'fetch' && w.st === 'bring' && q.id === w.item) m.body.rotation.x = -0.25; }
    if (q.id === w.item && w.st === 'bring' && kd === 'bag') m.g.position.y = 0.6;
    if (q.st === 'wait') { const r = V.marks[i]; r.visible = true; r.position.set(q.x, 0.15, q.z); const pu = 1 + Math.sin(V.t * 4 + i) * 0.08; r.scale.setScalar(pu * (kd === 'bulky' ? 1.6 : kd === 'litter' ? 0.8 : 1.15)); } });
  V.ringM.opacity = 0.4 + Math.sin(V.t * 4) * 0.2;
  // things falling into the hopper
  for (const d of V.dust) { if (d.t < 1.2) { d.t += dt; d.vy -= 9 * dt; d.m.position.x += d.vx * dt; d.m.position.y += d.vy * dt; d.m.position.z += d.vz * dt; d.m.rotation.x += dt * 5; d.m.visible = d.m.position.y > 0.5; } else d.m.visible = false; }
  if (it0 && w.st === 'lift' && it0.p > 0.75 && it0.p < 1.1 && Math.random() < 0.6) { const d = V.dust.find(q => q.t >= 1.2); if (d) { const hp = hopper(G); d.t = 0; d.m.position.set(hp.x + (Math.random() - 0.5) * 0.4, 2.1, hp.z + 0.6); d.vx = (Math.random() - 0.5); d.vy = 0.5; d.vz = 1.2 + Math.random(); d.m.material = Math.random() < 0.5 ? V.kindM.litter : V.kindM[it0.kind] || V.kindM.bag; } }
  // leaves blowing along the street
  if (V.leaves.visible) { const pos = V.leaves.geometry.attributes.position; V.leafD.forEach((l, i) => { l.z += dt * (1.2 + l.s); l.x += Math.sin(V.t + i) * dt * 0.6; l.y = 0.1 + Math.abs(Math.sin(V.t * (1 + l.s) + i)) * 1.2; if (l.z > 24) { l.z = -16; l.x = (Math.random() - 0.5) * 14; } pos.setXYZ(i, l.x + side * 2, l.y, L.z + l.z); }); pos.needsUpdate = true; }
  // the camera: over your shoulder at the back of the lorry, turned toward the house; behind and above while driving
  const stopped = L.state === 'stopped', tz = stopped ? S.z - 0.2 : L.z + 6, tgt = stopped ? [side * 3.9, 0.0, tz] : [side * 2.2, 1.0, tz], pos = stopped ? [side * 4.6, 8.8, S.z - 11.2] : [side * 0.4, 6.2, L.z - 9.5];
  if (!ui.cam || ui.snap) { ui.cam = { p: pos.slice(), l: tgt.slice() }; ui.snap = false; } const kq = 1 - Math.exp(-dt * (stopped ? 2.2 : 3));
  for (let i = 0; i < 3; i++) { ui.cam.p[i] += (pos[i] - ui.cam.p[i]) * kq; ui.cam.l[i] += (tgt[i] - ui.cam.l[i]) * kq; }
  const sh = FX.shake > 0 ? (Math.random() - 0.5) * FX.shake * 0.01 : 0, cam = W3.cam; cam.position.set(ui.cam.p[0] + sh, ui.cam.p[1] + sh, ui.cam.p[2]); cam.lookAt(ui.cam.l[0], ui.cam.l[1], ui.cam.l[2]); cam.updateMatrixWorld();
  W3.setFocus(ui.cam.l[0], 0, ui.cam.l[2], 22); }
// where an item is on the screen (for taps and its little sign)
function itemScreen(q) { const V = V3; if (!V || V.none) return null; const v = new V.T.Vector3(q.x, q.kind === 'bag' ? 0.9 : q.kind === 'litter' ? 0.3 : 1.3, q.z); return W3.screen(v); }
// ---------- what the game does with each event ----------
function onEvent(G, e) {
  switch (e.k) {
    case 'start': if (!G.lesson) { ui.banner = { txt: G.street.toUpperCase(), sub: `${G.season.em} ${G.cfg.free ? 'a free round' : `${G.stops.length} houses`}`, t: 0, secs: 2.6 }; tip('start', 'Tap a bin or a bag to fetch it', 3); } ui.snap = true; break;
    case 'arrive': sfx.brake(); if (e.resident) sfx.birds(); break;
    case 'go': sfx.step(); vibe(HAP.tick); break;
    case 'queued': sfx.click(); break;
    case 'grab': sfx.grab(e.kind); break;
    case 'ready': sfx.click(); if (e.wrong) tip('wrong', 'A bin bag is on the recycling: PICK OUT (optional)', 3.4); else tip('hold', 'HOLD COLLECT, let go in the green', 3); break;
    case 'lift': sfx.lift(e.kind); break;
    case 'dump': sfx.dump(e.kind); vibe(HAP.light); break;
    case 'empty': sfx.ding(); vibe(HAP.tick); { const L = layout(G); say(e.kind === 'litter' ? 'TIDY' : 'NEAT', L.collect.x, L.collect.y - L.collect.r - 26 * k, '#c8f0a0', 18); } break;
    case 'early': sfx.early(); { const L = layout(G); say('NOT EMPTY YET', L.collect.x, L.collect.y - L.collect.r - 26 * k, '#ffe0a0', 17); } tip('early', 'Keep holding until the ring reaches the green', 3); break;
    case 'spill': sfx.bang(); FX.shake = 6; { const L = layout(G); say('OOPS, A FEW BITS', L.collect.x, L.collect.y - L.collect.r - 26 * k, '#ffd0a0', 17); } tip('spill', 'Let go once the ring is in the green. The bits wait for you by the lorry.', 3.6); break;
    case 'back': sfx.clunk(); break;
    case 'pickout': sfx.coin(2); vibe(HAP.light); { const L = layout(G); say('GOOD EYE! +3', W / 2, L.collect.y - L.collect.r - 50 * k, '#9be3ff', 19); } break;
    case 'wrongbin': ui.banner = { txt: 'A BIN BAG WAS IN THE RECYCLING', sub: 'Next time, PICK OUT keeps it clean', t: 0, secs: 2.6, small: true }; break;
    case 'note': sfx.note(); vibe(HAP.light); ui.banner = { txt: 'A NOTE ON THE LID', sub: e.txt, t: 0, secs: 3.4, small: true }; break;
    case 'compact': sfx.compact(); break;
    case 'housedone': sfx.house(); vibe(HAP.light); if (e.resident) say(`"${e.thanks}"`, W * 0.62, H * 0.3, '#fff', 20); burst(W * 0.6, H * 0.42, '#c8f0a0', 14); break;
    case 'samhelp': say('SAM GIVES YOU A HAND', W / 2, H * 0.4, '#fff', 16); break;
    case 'sam': say(`SAM SWEPT UP ${e.n === 1 ? 'A BIT' : e.n + ' BITS'}`, W / 2, H * 0.4, '#fff', 15); break;
    case 'next': sfx.go(); ui.snap = false; break;
    case 'lessonnext': if (e.first) hint = null; say('FIRST, A LESSON', W / 2, H * 0.36, '#ffd36a', 24); sfx.ding(); break;
    case 'lessonok': if (!e.soft) say(`GOOD! ${e.n} OF ${e.need}`, W / 2, H * 0.36, '#9be3b5', 24); sfx.coin(e.n); break;
    case 'lessonmiss': coachMiss(); break;
    case 'lessondone': say('YOU KNOW IT. OFF WE GO!', W / 2, H * 0.36, '#ffd36a', 24); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': FX.flash = 0.6; sfx.win(); vibe(HAP.best); break;
    case 'rest': sfx.house(); break;
  } }
// ---------- the picture ----------
let IG = null, IM = {}; function idleG() { if (!IG || IG.over || IG.t > 80) { IG = newGame(3 + ((Math.random() * 8) | 0), { seed: (Math.random() * 1e6) | 0 }); IM = {}; ui.snap = true; } honest(IG, { react: 0.4, acc: 0.95 }, IM); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#1c2a2a'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D street.', W / 2, H / 2); if (G) hud(G, now); return; }
  const g = G || idleG(); sync(V, g, dt || 1 / 60); W3.render(dt || 1 / 60);
  if (G && !(G.over && !$('ovEnd').classList.contains('hidden'))) hud(G, now);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 1.3 ? 1 : 1 - (t2.t - 1.3) / 0.5; ctx.globalAlpha = Math.max(0, al); ctx.font = `600 ${Math.round(t2.size * k)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(20,30,30,.7)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 16); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 16); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30, hy = (G && G.lesson ? 190 : 92) * k;
    ctx.fillStyle = 'rgba(20,34,32,.92)'; rrect(W / 2 - w / 2, hy - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, hy - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,250,230,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); } }
// ---------- the 2D layer: signs over the bins, the COLLECT button and its ring, NEXT HOUSE ----------
function layout(G) { const r = 56 * k, cy = H - r - 34 * k; return { collect: { x: W / 2, y: cy, r }, pick: { x: 14, y: cy - 24 * k, w: W / 2 - r - 28, h: 48 * k }, next: { x: 24, y: cy - 40 * k, w: W - 48, h: 64 * k }, stop: { x: W / 2 - 80 * k, y: cy + 32 * k, w: 160 * k, h: 34 * k }, auto: { x: W - 14 - 86 * k, y: cy + 4 * k, w: 86 * k, h: 40 * k } }; }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function pill(r, fill, txt, col, size, stroke) { ctx.fillStyle = fill; rrect(r.x, r.y, r.w, r.h, Math.min(r.h / 2, 22 * k)); ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); } ctx.fillStyle = col; ctx.font = `700 ${Math.round(size * k)}px ${TF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, r.x + r.w / 2, r.y + r.h / 2 + 1); }
function hud(G, now) { const L = layout(G), w = G.wk, it = carried(G), atS = G.lorry.state === 'stopped';
  // signs over what is waiting
  if (atS) for (const q of G.items) if (q.st === 'wait') { const p = itemScreen(q); if (!p || !p.front) continue; const bob = Math.sin(now * 3 + q.id) * 3 * k, y = p.y - 26 * k + bob, r = 17 * k * (q.kind === 'litter' ? 0.8 : 1);
    ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.beginPath(); ctx.arc(p.x, y, r, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(p.x - 6 * k, y + r - 3 * k); ctx.lineTo(p.x, y + r + 7 * k); ctx.lineTo(p.x + 6 * k, y + r - 3 * k); ctx.fill();
    if (G.queue === q.id) { ctx.strokeStyle = '#7cd36a'; ctx.lineWidth = 3 * k; ctx.beginPath(); ctx.arc(p.x, y, r + 3 * k, 0, TAU); ctx.stroke(); }
    ctx.font = `${Math.round(r * 1.15)}px ${BC}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ICON[q.kind], p.x, y + 1); if (q.wrong) { ctx.font = `${Math.round(11 * k)}px ${BC}`; ctx.fillText('🛍️', p.x + r * 0.75, y - r * 0.7); } }
  // top: the street and the houses
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  if (G.lesson) lessonPanel(G);
  else { ctx.font = `600 ${Math.round(18 * k)}px ${TF}`; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(10,20,20,.55)'; ctx.strokeText(`${G.season.em} ${G.street}`, 14, 22 * k); ctx.fillStyle = '#fff'; ctx.fillText(`${G.season.em} ${G.street}`, 14, 22 * k);
    const n = G.cfg.free ? 0 : G.stops.length; if (n) for (let i = 0; i < n; i++) { const x = 18 + i * 16 * k, y = 46 * k; ctx.beginPath(); ctx.arc(x, y, 5.5 * k, 0, TAU); ctx.fillStyle = i < G.si || (i === G.si && G.stops[i] && G.stops[i].done) ? '#7cd36a' : i === G.si ? '#ffffff' : 'rgba(255,255,255,.3)'; ctx.fill(); if (i === G.si) { ctx.strokeStyle = '#7cd36a'; ctx.lineWidth = 2; ctx.stroke(); } }
    else { ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillText(`${G.log.houses} houses so far`, 14, 46 * k); }
    ctx.textAlign = 'right'; ctx.font = `600 ${Math.round(18 * k)}px ${TF}`; ctx.strokeText(`🪙 ${G.coins}`, W - 14, 22 * k); ctx.fillStyle = '#ffe08a'; ctx.fillText(`🪙 ${G.coins}`, W - 14, 22 * k); }
  if (ui.banner) { const b = ui.banner, al = Math.min(1, b.t / 0.25, ((b.secs || 2.4) - b.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.textAlign = 'center'; const y = b.small ? H * 0.2 : H * 0.24;
    ctx.font = `600 ${Math.round((b.small ? 18 : 30) * k)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(10,20,20,.6)'; ctx.strokeText(b.txt, W / 2, y); ctx.fillStyle = '#fff'; ctx.fillText(b.txt, W / 2, y);
    if (b.sub) { ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const ls = wrapText(b.sub, W - 60); ls.forEach((l, i) => { ctx.strokeText(l, W / 2, y + (24 + i * 18) * k); ctx.fillStyle = '#e8f8e0'; ctx.fillText(l, W / 2, y + (24 + i * 18) * k); }); } ctx.globalAlpha = 1; }
  if (!atS) return;
  // NEXT HOUSE (and Stop here) once the house is done
  if (G.nextOk && !G.lesson) { const last = G.si === G.stops.length - 1 && !G.cfg.free; pill(L.next, '#7cd36a', last ? 'FINISH THE ROUND ✓' : 'NEXT HOUSE ➜', '#10240c', 24); if (G.autoT > 0) { ctx.fillStyle = 'rgba(16,36,12,.35)'; rrect(L.next.x, L.next.y + L.next.h - 6 * k, L.next.w * (1 - G.autoT / 1.4), 6 * k, 3); ctx.fill(); }
    if (!last) pill(L.stop, 'rgba(20,34,32,.6)', 'Stop here for now', '#fff', 14); }
  else if (G.nextOk && G.lesson) pill(L.next, '#7cd36a', 'NEXT HOUSE ➜', '#10240c', 24);
  else { // COLLECT: a big round button; its ring shows the lift, the green part is when to let go
    const C = L.collect, on = (w.st === 'ready' || w.st === 'lift' || w.st === 'lower') && it && G.compact <= 0; ctx.globalAlpha = on ? 1 : 0.55;
    ctx.fillStyle = on ? (G.hold ? '#5ab04a' : '#7cd36a') : 'rgba(20,34,32,.7)'; ctx.beginPath(); ctx.arc(C.x, C.y, C.r, 0, TAU); ctx.fill();
    if (on) { const K = KINDS[it.kind], top = 1 + G.cfg.win * K.win / K.lift, a0 = -Math.PI / 2, ang = v => a0 + TAU * 0.86 * v / top, rr = C.r + 9 * k;
      ctx.lineWidth = 9 * k; ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.arc(C.x, C.y, rr, a0, ang(top)); ctx.stroke(); ctx.strokeStyle = '#3ad06a'; ctx.beginPath(); ctx.arc(C.x, C.y, rr, ang(1), ang(top)); ctx.stroke();
      ctx.strokeStyle = it.p >= 1 ? '#ffffff' : '#ffe08a'; ctx.lineWidth = 5 * k; ctx.beginPath(); ctx.arc(C.x, C.y, rr, a0, ang(Math.min(top, Math.max(0.001, it.p)))); ctx.stroke(); }
    ctx.fillStyle = on ? '#10240c' : '#fff'; ctx.textAlign = 'center'; ctx.font = `700 ${Math.round(19 * k)}px ${TF}`; ctx.fillText(G.compact > 0 ? 'SQUASH…' : on ? (G.hold ? (it.p >= 1 ? 'LET GO!' : 'HOLD…') : 'COLLECT') : 'COLLECT', C.x, C.y - (on ? 6 : 0) * k);
    if (on) { ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillText(G.hold ? '' : 'HOLD', C.x, C.y + 16 * k); } ctx.globalAlpha = 1;
    if (!on && !G.compact) { ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fillText(G.items.some(q => q.st === 'wait') && w.st === 'idle' ? 'tap a bin' : '', C.x, C.y + 20 * k); }
    if (on && it.wrong && w.st === 'ready') pill(L.pick, '#9be3ff', 'PICK OUT 🛍️', '#0c2430', 16); }
  if (!G.lesson) { const A = L.auto; pill(A, G.auto ? 'rgba(124,211,106,.9)' : 'rgba(20,34,32,.55)', G.auto ? 'AUTO ✓' : 'AUTO', G.auto ? '#10240c' : '#fff', 13); } }
function lessonPanel(G) { coachPanel(G); }
