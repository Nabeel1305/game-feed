// ===================== THE VIEW: Timber (3D clearing seen from behind the tree; the cut ring and two big buttons below) =====
// The camera stands behind the tree looking along the felling line, so the open strip, the stakes and whatever must not be hit
// are ahead. The felling line is painted on the ground; a lean shows as an arrow; a flag shows the wind; leaves (or snow)
// drift with it. The tree really leans, creaks, tips, swings down about its hinge and lands with a thump and dust.
const FX = { shake: 0, stop: 0, flash: 0, red: 0, slow: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { snap: true, banner: null, drag: null, hold: null };
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 160) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60 * k, t: 0, life: 0.6 + Math.random() * 0.5, col, r: (2 + Math.random() * 3) * k }); } if (PARTS.length > 260) PARTS.splice(0, PARTS.length - 260); }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2.5); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.4) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 220 * dt; p.vx *= 0.98; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (ui.banner) { ui.banner.t += dt; if (ui.banner.t > (ui.banner.secs || 1)) ui.banner = null; }
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; } }
function mySkin() { if (typeof HEADLESS !== 'undefined' && HEADLESS) return SKINS[0]; const id = store.get('skin', 'classic'); return SKINS.find(q => q.id === id) || SKINS[0]; }
const GROUND = [0x5a8a3a, 0x8a6a2a, 0xe8eef2, 0x6a7a4a], SKYOF = ['morning', 'golden', 'overcast', 'dawn'];
function buildWorld() {
  if (V3) return V3; const T = window.THREE; if (!T || !W3 || !W3.init({ canvas: $('gl'), fov: 58, far: 400, near: 0.1 })) { V3 = { none: true }; return V3; }
  V3 = { T, S: W3.scene, t: 0 }; const V = V3, S = V.S, M = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.8 }, o));
  V.M = M; V.boxG = new T.BoxGeometry(1, 1, 1); V.sphG = new T.SphereGeometry(1, 14, 10); V.cylG = new T.CylinderGeometry(1, 1, 1, 12); V.coneG = new T.ConeGeometry(1, 1, 9);
  W3.setSky('morning'); W3.scene.children.forEach(o => { if (o.isLineSegments) o.visible = false; });
  V.ground = W3.terrain({ size: 500, seg: 100, height: (x, z) => { const r = Math.hypot(x, z); return r < 48 ? 0 : (r - 48) * 0.06 * (1 + Math.sin(x * 0.03) * Math.cos(z * 0.025)); }, colour: (x, z) => { const n = 0.85 + 0.15 * Math.sin(x * 0.7) * Math.cos(z * 0.9) + 0.08 * Math.sin(x * 0.13 + z * 0.17); return [n, n, n]; }, map: W3.grainTex ? W3.grainTex(256, 7, 200, 40, 1) : null });
  // the forest round the clearing: one instanced mesh, placed again for every tree
  V.forestList = []; for (let i = 0; i < 260; i++) V.forestList.push({ x: 0, y: -50, z: 0, s: 1 }); V.forest = W3.pines(V.forestList, { shadow: false });
  // the strip: where the tree should land, a centre line, stakes with ribbons
  V.zone = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ color: 0xffe0a0, transparent: true, opacity: 0.22, depthWrite: false })); V.zone.rotation.x = -Math.PI / 2; V.zone.position.y = 0.03; S.add(V.zone);
  V.mid = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, depthWrite: false })); V.mid.rotation.x = -Math.PI / 2; V.mid.position.y = 0.04; S.add(V.mid);
  V.stakes = []; for (let i = 0; i < 5; i++) { const g = new T.Group(), post = new T.Mesh(V.cylG, M(0xd8c090)); post.scale.set(0.05, 1.2, 0.05); post.position.y = 0.6; g.add(post); const rib = new T.Mesh(V.boxG, new T.MeshBasicMaterial({ color: i === 4 ? 0xff3a6a : 0xffa020 })); rib.scale.set(0.3, 0.12, 0.02); rib.position.set(0.15, 1.15, 0); g.add(rib); g.userData.rib = rib; S.add(g); V.stakes.push(g); }
  // the felling line (aim), and the guide: where a clean cut would put it
  V.line = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, depthWrite: false })); V.line.rotation.x = -Math.PI / 2; V.line.position.y = 0.06; S.add(V.line);
  V.head = new T.Mesh(new T.CircleGeometry(1, 3), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, depthWrite: false })); V.head.rotation.x = -Math.PI / 2; V.head.position.y = 0.07; S.add(V.head);
  V.ghost = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ color: 0x8ae0ff, transparent: true, opacity: 0.35, depthWrite: false })); V.ghost.rotation.x = -Math.PI / 2; V.ghost.position.y = 0.05; S.add(V.ghost);
  V.leanA = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ color: 0xff6a3a, transparent: true, opacity: 0.8, depthWrite: false })); V.leanA.rotation.x = -Math.PI / 2; V.leanA.position.y = 0.07; S.add(V.leanA);
  // the tree: fall group (turns to the fall direction, tips about the hinge) > lean group > the tree itself
  V.fallG = new T.Group(); V.fallI = new T.Group(); V.fallG.add(V.fallI); V.leanG = new T.Group(); V.leanI = new T.Group(); V.leanG.add(V.leanI); V.fallI.add(V.leanG); S.add(V.fallG); V.fallG.position.y = 0.5;
  V.stump = new T.Mesh(V.cylG, M(0x6a4a2a, { roughness: 0.9 })); S.add(V.stump); V.cutTop = new T.Mesh(new T.CircleGeometry(1, 20), M(0xe8c890)); V.cutTop.rotation.x = -Math.PI / 2; S.add(V.cutTop);
  V.notch = new T.Mesh(V.boxG, M(0x2a1a0a)); S.add(V.notch); V.kerf = new T.Mesh(V.boxG, M(0x1a1008)); S.add(V.kerf);
  // the faller, with a saw
  V.man = new T.Group(); S.add(V.man); const jacket = M(0xf0b020); const body = new T.Mesh(V.cylG, jacket); body.scale.set(0.25, 0.75, 0.2); body.position.y = 1.1; V.man.add(body);
  const legs = new T.Mesh(V.boxG, M(0x2a3a5a)); legs.scale.set(0.34, 0.75, 0.2); legs.position.y = 0.38; V.man.add(legs); const head = new T.Mesh(V.sphG, M(0xd8a07a)); head.scale.setScalar(0.15); head.position.y = 1.62; V.man.add(head);
  const hat = new T.Mesh(new T.SphereGeometry(1, 14, 8, 0, TAU, 0, Math.PI / 2), M(0xff6a10)); hat.scale.set(0.18, 0.13, 0.18); hat.position.y = 1.68; V.man.add(hat);
  V.saw = new T.Group(); V.saw.position.set(0.35, 0.65, 0); V.man.add(V.saw); V.sawBody = new T.Mesh(V.boxG, M(mySkin().col, { roughness: 0.5 })); V.sawBody.scale.set(0.3, 0.22, 0.16); V.saw.add(V.sawBody); const bar = new T.Mesh(V.boxG, M(0xb0b4b8, { metalness: 0.8, roughness: 0.3 })); bar.scale.set(0.55, 0.06, 0.03); bar.position.x = 0.4; V.saw.add(bar);
  // hazards (built for each tree), the hiker, the flag, drifting leaves
  V.hazG = new T.Group(); S.add(V.hazG);
  V.hiker = new T.Group(); const hb = new T.Mesh(V.cylG, M(0x3a6ad8)); hb.scale.set(0.22, 0.7, 0.18); hb.position.y = 1.0; V.hiker.add(hb); const hh = new T.Mesh(V.sphG, M(0xe0b090)); hh.scale.setScalar(0.14); hh.position.y = 1.52; V.hiker.add(hh); const pack = new T.Mesh(V.boxG, M(0xd83a3a)); pack.scale.set(0.3, 0.4, 0.2); pack.position.set(0, 1.1, -0.15); V.hiker.add(pack); const hl = new T.Mesh(V.boxG, M(0x4a3a2a)); hl.scale.set(0.3, 0.65, 0.18); hl.position.y = 0.33; V.hiker.add(hl); S.add(V.hiker);
  V.trail = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ color: 0x8a6a4a, transparent: true, opacity: 0.45, depthWrite: false })); V.trail.rotation.x = -Math.PI / 2; V.trail.position.y = 0.025; S.add(V.trail);
  V.flag = new T.Group(); const fp = new T.Mesh(V.cylG, M(0xcfcfcf)); fp.scale.set(0.04, 3, 0.04); fp.position.y = 1.5; V.flag.add(fp); V.sock = new T.Mesh(new T.ConeGeometry(0.22, 1.1, 10, 1, true), new T.MeshStandardMaterial({ color: 0xff5a20, side: T.DoubleSide, roughness: 0.7 })); V.sockG = new T.Group(); V.sockG.position.y = 2.9; V.sock.rotation.z = Math.PI / 2; V.sock.position.x = 0.55; V.sockG.add(V.sock); V.flag.add(V.sockG); S.add(V.flag);
  const N = 220, pos = new Float32Array(N * 3); for (let i = 0; i < N * 3; i++) pos[i] = (Math.random() - 0.5) * 40; const pg = new T.BufferGeometry(); pg.setAttribute('position', new T.BufferAttribute(pos, 3)); V.leaves = new T.Points(pg, new T.PointsMaterial({ color: 0xd8a040, size: 0.12, transparent: true, opacity: 0.85 })); S.add(V.leaves);
  W3.setQuality(stepN); return V; }
// ---------- a new tree: its shape, the forest round it, the strip, the hazards ----------
function treeMesh(V, S) { const T = V.T, K = KINDS[S.kind], g = new T.Group(), M = V.M, len = S.h - 0.5, r = S.d / 2;
  const trunk = new T.Mesh(new T.CylinderGeometry(r * 0.35, r, len, 12), M(S.kind === 'birch' ? 0xe8e4dc : S.kind === 'snag' ? 0x7a6a5a : 0x6a4a2a, { roughness: 0.95 })); trunk.position.y = len / 2; trunk.castShadow = true; g.add(trunk);
  const cm = M(K.col, { roughness: 0.85, flatShading: true });
  if (S.kind === 'pine' || S.kind === 'giant') { const n = S.kind === 'giant' ? 7 : 5; for (let i = 0; i < n; i++) { const u = i / n, cr = K.crown * (1 - u * 0.7) * 1.1, ch = len * 0.2; const c = new T.Mesh(V.coneG, cm); c.scale.set(cr, ch, cr); c.position.y = len * (0.35 + u * 0.55) + ch / 2; c.castShadow = true; g.add(c); } }
  else if (S.kind === 'oak' || S.kind === 'birch') { for (let i = 0; i < 6; i++) { const s = new T.Mesh(V.sphG, cm), a = i * 1.1, rr = K.crown * (i ? 0.55 : 0); s.scale.setScalar(K.crown * (i ? 0.7 : 0.95)); s.position.set(Math.cos(a) * rr, len * 0.82 + (i % 3) * 0.6 * (S.kind === 'birch' ? 1.5 : 1), Math.sin(a) * rr); s.castShadow = true; g.add(s); } }
  else { for (let i = 0; i < 4; i++) { const b = new T.Mesh(V.cylG, M(0x6a5a48)); b.scale.set(0.06, 2.2, 0.06); b.position.set(Math.cos(i * 1.6) * 0.8, len * (0.6 + i * 0.08), Math.sin(i * 1.6) * 0.8); b.rotation.set(Math.sin(i * 1.6) * 0.9, 0, -Math.cos(i * 1.6) * 0.9); g.add(b); } }
  return g; }
function hazMesh(V, H) { const T = V.T, M = V.M, g = new T.Group();
  if (H.kind === 'cabin') { const w = new T.Mesh(V.boxG, M(0x8a5a3a)); w.scale.set(3.4, 2.4, 2.8); w.position.y = 1.2; g.add(w); const roof = new T.Mesh(new T.CylinderGeometry(1, 1, 1, 3), M(0x6a2a20)); roof.scale.set(1.9, 3.6, 1.6); roof.rotation.z = Math.PI / 2; roof.rotation.y = Math.PI / 2; roof.position.y = 2.9; g.add(roof); const door = new T.Mesh(V.boxG, M(0x3a2a1a)); door.scale.set(0.7, 1.4, 0.05); door.position.set(0, 0.7, 1.41); g.add(door); }
  else if (H.kind === 'fence') { const p = new T.Mesh(V.boxG, M(0xb89a70)); p.scale.set(0.15, 1.2, 0.15); p.position.y = 0.6; g.add(p); if (H.j < 2) for (const y of [0.45, 0.95]) { const r = new T.Mesh(V.boxG, M(0xc8aa80)); r.scale.set(2, 0.1, 0.06); r.position.set(1, y, 0); g.add(r); } }
  else if (H.kind === 'truck') { const b = new T.Mesh(V.boxG, M(0xc83a2a, { roughness: 0.5 })); b.scale.set(4.6, 1.1, 2); b.position.y = 1.0; g.add(b); const cab = new T.Mesh(V.boxG, M(0xc83a2a, { roughness: 0.5 })); cab.scale.set(1.4, 1.2, 1.9); cab.position.set(1.6, 2.0, 0); g.add(cab); for (const x of [-1.5, 1.5]) for (const z of [-1, 1]) { const wh = new T.Mesh(V.cylG, M(0x1a1a1a)); wh.scale.set(0.45, 0.3, 0.45); wh.rotation.x = Math.PI / 2; wh.position.set(x, 0.45, z); g.add(wh); } }
  else if (H.kind === 'pole') { const p = new T.Mesh(V.cylG, M(0x6a5a4a)); p.scale.set(0.16, 9, 0.16); p.position.y = 4.5; g.add(p); const x = new T.Mesh(V.boxG, M(0x6a5a4a)); x.scale.set(2, 0.15, 0.15); x.position.y = 8.6; g.add(x); for (const s of [-1, 1]) { const w = new T.Mesh(V.cylG, M(0x202020)); w.scale.set(0.02, 60, 0.02); w.rotation.x = Math.PI / 2; w.position.set(s * 0.9, 8.4, 0); g.add(w); } }
  else { const t = treeMesh(V, { kind: 'pine', h: 16, d: 0.5 }); g.add(t); }
  g.position.set(H.x, 0, H.z); g.rotation.y = -(H.rot || 0) + (H.kind === 'fence' ? 0 : 0); return g; }
function setupTree(V, G) { const T = G.tree, S = T.spec, Vt = V.T, c = G.cfg, R = rng(S.gust * 1000 | 0); V.for = T;
  if (V.treeObj) { V.leanI.remove(V.treeObj); } V.treeObj = treeMesh(V, S); V.leanI.add(V.treeObj);
  V.stump.scale.set(S.d / 2, 0.5, S.d / 2); V.stump.position.y = 0.25; V.cutTop.scale.setScalar(S.d / 2 * 0.98); V.cutTop.position.y = 0.505;
  // the forest: a ring round the clearing, kept out of the strip and its sides
  let n = 0; const ok = (x, z) => { const r = Math.hypot(x, z); if (r < 8) return false; const al = x * Math.cos(S.t) + z * Math.sin(S.t), lat = -x * Math.sin(S.t) + z * Math.cos(S.t); if (al > -2 && al < S.h * 1.35 && Math.abs(lat) < c.zw + 9) return false; for (const H of S.haz) if (Math.hypot(x - H.x, z - H.z) < H.r + 3) return false; return r > S.h * 0.5 || Math.abs(lat) > c.zw + 10 || al < -4; };
  for (const f of V.forestList) { let x, z, tries = 0; do { const a = R() * TAU, r = 10 + Math.sqrt(R()) * 70; x = Math.cos(a) * r; z = Math.sin(a) * r; } while (!ok(x, z) && ++tries < 20); f.x = x; f.z = z; f.y = tries >= 20 ? -60 : 0; f.s = 1.2 + R() * 1.1; f.rot = R() * 6; f.hue = R(); n++; }
  { const d = new Vt.Object3D(), cc = new Vt.Color(); V.forestList.forEach((t, i) => { d.position.set(t.x, t.y, t.z); d.rotation.set(0, t.rot, 0); d.scale.setScalar(t.s); d.updateMatrix(); V.forest.setMatrixAt(i, d.matrix); }); V.forest.instanceMatrix.needsUpdate = true; }
  const zl = S.h * 0.65, zc = S.h * 0.875; V.zone.scale.set(zl, c.zw * 2, 1); V.zone.position.set(Math.cos(S.t) * zc, 0.03, Math.sin(S.t) * zc); V.zone.rotation.z = -S.t;
  V.mid.scale.set(zl, 0.12, 1); V.mid.position.copy(V.zone.position).setY(0.04); V.mid.rotation.z = -S.t;
  const cs = [[0.55, 1], [0.55, -1], [1.2, 1], [1.2, -1], [1, 0]]; V.stakes.forEach((g, i) => { const [al, s] = cs[i], lat = s * c.zw; g.position.set(Math.cos(S.t) * S.h * al - Math.sin(S.t) * lat, 0, Math.sin(S.t) * S.h * al + Math.cos(S.t) * lat); g.rotation.y = -S.wa; });
  V.hazG.clear(); for (const H of S.haz) V.hazG.add(hazMesh(V, H));
  const hk = S.hiker; V.trail.visible = V.hiker.visible = !!hk; if (hk) { V.trail.scale.set(hk.len + 30, 1.2, 1); V.trail.position.set(hk.cx, 0.025, hk.cz); V.trail.rotation.z = -hk.dir; }
  V.flag.position.set(-Math.cos(S.t) * 4 + Math.sin(S.t) * 5, 0, -Math.sin(S.t) * 4 - Math.cos(S.t) * 5); V.flag.visible = S.wind > 0;
  const pl = placeOf(G.N); if (V.place !== pl) { V.place = pl; W3.setSky(S.wind > 6 && pl !== 2 ? 'overcast' : SKYOF[pl]); V.ground.material.color.setHex(GROUND[pl]); V.leaves.material.color.setHex(pl === 2 ? 0xffffff : pl === 1 ? 0xd87a20 : 0xa8c060); V.leaves.material.size = pl === 2 ? 0.1 : 0.13; }
  V.camA = T.aim; V.fallen = false; }
// ---------- every frame: the tree, the cuts, the man, the camera ----------
function sync(V, G, dt) { V.t += dt; const T = G.tree; if (!T) return; if (V.for !== T) setupTree(V, G); const S = T.spec, c = G.cfg, K = KINDS[S.kind], Vt = V.T;
  V.sawBody.material.color.setHex(mySkin().col);
  const a = T.phase === 'fall' || T.phase === 'down' ? T.dir : T.aim, ca = Math.cos(a), sa = Math.sin(a), ct = Math.cos(S.t), st = Math.sin(S.t);
  // the tree: leans as it stands, then tips about the hinge toward the fall direction
  V.leanG.rotation.y = -S.la; V.leanI.rotation.z = -S.lm * (T.phase === 'fall' || T.phase === 'down' ? Math.max(0, 1 - T.th * 3) : 1) + (T.phase === 'cut' && hingeOf(T) < 0.2 && T.bc > 0 ? Math.sin(V.t * 30) * 0.002 : 0);
  V.fallG.rotation.y = -a; V.fallI.rotation.z = -T.th; V.fallG.position.y = 0.5 + (T.phase === 'down' ? Math.max(0, Math.sin(Math.min(1, (G.t - (T.landT || G.t)) * 5) * Math.PI) * 0.25) : 0);
  if (T.phase === 'down' && T.landT == null) T.landT = G.t;
  // the cuts on the stump: notch on the felling side, back cut opposite
  const r = S.d / 2; V.notch.visible = T.nd > 0.01; V.notch.scale.set(T.nd * S.d, 0.16, S.d * 0.9); V.notch.position.set(ca * (r - T.nd * S.d / 2), 0.52, sa * (r - T.nd * S.d / 2)); V.notch.rotation.y = -a;
  V.kerf.visible = T.bc > 0.01; V.kerf.scale.set(T.bc * S.d, 0.03, S.d * 0.95); V.kerf.position.set(-ca * (r - T.bc * S.d / 2), 0.55, -sa * (r - T.bc * S.d / 2)); V.kerf.rotation.y = -a;
  // the faller stands beside the trunk, saw to it; steps back once it goes
  const back = T.phase === 'fall' || T.phase === 'down' ? Math.min(4, (V.mb = (V.mb || 0) + dt * 3)) : (V.mb = 0), side = -1, px = -sa * side * (r + 0.6) - ca * (0.3 + back), pz = ca * side * (r + 0.6) - sa * (0.3 + back);
  V.man.position.set(px, 0, pz); V.man.rotation.y = Math.atan2(-(0 - px), -(0 - pz)) + Math.PI; V.man.rotation.y = -Math.atan2(-pz, -px) ; V.saw.position.y = T.notching || T.sawing ? 0.62 + Math.sin(V.t * 50) * 0.01 : 0.5; V.saw.visible = T.phase !== 'down';
  // the line, its head, the guide, the lean arrow (on the ground)
  const showLine = T.phase === 'aim' || T.phase === 'cut', L = S.h; V.line.visible = V.head.visible = showLine; V.line.scale.set(L, 0.14, 1); V.line.position.set(ca * L / 2, 0.06, sa * L / 2); V.line.rotation.z = -a; V.head.scale.setScalar(0.7); V.head.position.set(ca * L, 0.07, sa * L); V.head.rotation.z = -a;
  const guide = c.guide === 'full' || G.lesson; V.ghost.visible = showLine && guide && (S.lm > 0.01 || S.wind > 0); if (V.ghost.visible) { const side2 = S.lm * Math.sin(angDiff(S.la, T.aim)), g = T.aim + side2 * 0.3 * 2.2; V.ghost.scale.set(L * 0.5, 0.5, 1); V.ghost.position.set(Math.cos(g) * L * 0.75, 0.05, Math.sin(g) * L * 0.75); V.ghost.rotation.z = -g; }
  V.leanA.visible = S.lm > 0.01 && c.guide !== 'none' && T.phase !== 'down'; if (V.leanA.visible) { const ll = 1.5 + S.lm * 25; V.leanA.scale.set(ll, 0.3, 1); V.leanA.position.set(Math.cos(S.la) * (r + ll / 2 + 0.3), 0.07, Math.sin(S.la) * (r + ll / 2 + 0.3)); V.leanA.rotation.z = -S.la; }
  V.stakes[4].userData.rib.rotation.y = Math.sin(V.t * 6) * 0.3 * (windNow(T, G.t) / 8);
  // the hiker on the path, the flag, the leaves drifting with the wind
  const hk = hikerAt(T, G.t); V.hiker.visible = !!hk; if (hk) { V.hiker.position.set(hk.x, Math.abs(Math.sin(V.t * 8)) * 0.05, hk.z); V.hiker.rotation.y = -(S.hiker.dir + (hk.back ? Math.PI : 0)) + Math.PI / 2; }
  const w = windNow(T, G.t); V.sockG.rotation.y = -S.wa; V.sock.rotation.z = Math.PI / 2 + (1 - Math.min(1, w / 6)) * 1.2; V.sock.rotation.x = Math.sin(V.t * 7) * 0.08 * w / 8;
  const lp = V.leaves.geometry.attributes.position, wx = Math.cos(S.wa) * (0.6 + w * 0.8), wz = Math.sin(S.wa) * (0.6 + w * 0.8), cp = W3.cam.position;
  for (let i = 0; i < lp.count; i++) { let x = lp.getX(i) + (wx + Math.sin(V.t + i) * 0.4) * dt, y = lp.getY(i) - (0.6 + (i % 5) * 0.1) * dt, z = lp.getZ(i) + (wz + Math.cos(V.t * 1.3 + i) * 0.4) * dt;
    if (y < 0 || Math.abs(x - cp.x) > 25 || Math.abs(z - cp.z) > 25) { x = cp.x + (Math.random() - 0.5) * 40; z = cp.z + (Math.random() - 0.5) * 40; y = 6 + Math.random() * 10; } lp.setXYZ(i, x, y, z); } lp.needsUpdate = true;
  // the camera: behind the tree along the felling line; it lifts and pulls back to watch the fall
  if (T.phase === 'aim' || T.phase === 'cut') V.camA = a; else V.camA += angDiff(a, V.camA) * Math.min(1, dt * 2);
  const asp = innerWidth / innerHeight, portrait = asp < 0.8, ff = T.phase === 'fall' || T.phase === 'down' ? Math.min(1, (V.ft = (V.ft || 0) + dt * 0.8)) : (V.ft = 0), cam = W3.cam, A = V.camA;
  const dist = 9 + S.h * 0.25 + ff * 6, hgt = 5 + S.h * 0.08 + ff * 5, sh = FX.shake ? (Math.random() - 0.5) * FX.shake * 0.01 : 0;
  cam.fov = portrait ? 62 : 48; cam.aspect = asp; cam.setViewOffset(W, H * 1.3, 0, H * 0.18, W, H); cam.updateProjectionMatrix();
  const off = 3.2 + ff * 2; cam.position.set(-Math.cos(A) * dist + Math.sin(A) * off + sh, hgt + sh, -Math.sin(A) * dist - Math.cos(A) * off); cam.lookAt(Math.cos(A) * S.h * (0.5 + ff * 0.2) + Math.sin(A) * 1.2, 2.2, Math.sin(A) * S.h * (0.5 + ff * 0.2) - Math.cos(A) * 1.2); cam.updateMatrixWorld(); W3.setFocus(Math.cos(A) * S.h * 0.4, 0, Math.sin(A) * S.h * 0.4, 30); }
const SV = window.THREE ? new THREE.Vector3() : null;
function scr(x, y, z) { if (!V3 || V3.none) return { x: W / 2, y: H * 0.35 }; SV.set(x, y, z); return W3.screen(SV); }
// ---------- what happens, seen and heard ----------
function onEvent(G, e) { const cx = W / 2, T = G.tree;
  switch (e.k) {
    case 'start': ui.banner = { txt: G.cfg.practice ? 'PRACTICE' : PLACES[placeOf(G.N)].name, t: 0, secs: 1.5, col: '#f4c46c' }; break;
    case 'tree': { const S = T.spec; if (e.retry) say('AGAIN: SAME TREE', cx, H * 0.3, '#ffe0b0', 20); else { sfx.birds(); if (S.kind !== 'pine' && G.N >= KINDS[S.kind].lv) tip('kind_' + S.kind, { oak: 'An OAK: heavy crown, its lean pulls harder.', birch: 'A BIRCH: thin, the saw goes through fast. Let go early!', snag: 'A DEAD SNAG: its wood is brittle. Leave a THICKER hinge.', giant: 'A GIANT FIR: a long cut. Watch the ring.' }[S.kind], 3.4); }
      if (S.lm > 0.02 && Math.cos(angDiff(S.la, S.t)) < -0.5) tip('back', 'This one LEANS BACK: it will sit on its hinge. Stop the saw with green left, then WEDGE.', 3.6);
      else if (S.lm > 0.02) tip('lean', 'It LEANS to one side (red arrow): aim the line a little the other way.', 3.4);
      if (S.wind > 0) tip('wind', 'WIND: watch the flag. Tip it over in a lull.', 3); if (S.hiker) tip('hiker', 'A HIKER uses the path: wait until they are out of the way.', 3.2); break; }
    case 'notchon': sfx.sawOn(); vibe(HAP.tick); break; case 'sawon': sfx.sawOn(); vibe(HAP.tick); break;
    case 'off': sfx.sawOff(); if (e.was === 'notch') { const q = e.nd; say(q < NOTCH_OK[0] ? 'NOTCH: DEEPER' : q > NOTCH_OK[1] ? 'NOTCH: TOO DEEP' : 'GOOD NOTCH', cx, H * 0.36, q < NOTCH_OK[0] || q > NOTCH_OK[1] ? '#ffd0a0' : '#9be3b5', 18); } break;
    case 'wedge': sfx.wedge(); vibe(HAP.light); FX.shake = 3; break;
    case 'sits': tip('sits', 'It is sitting on its hinge. Tap WEDGE to tip it.', 3); break;
    case 'tip': sfx.crack(); FX.shake = 6; ui.banner = { txt: 'TIMBER!', t: 0, secs: 1.2, col: '#ffd36a' }; vibe(HAP.heavy || HAP.light); break;
    case 'land': { sfx.thud(T.spec.d); FX.shake = 14; vibe(HAP.heavy || HAP.light); const p = scr(Math.cos(T.fdir) * T.spec.h * 0.7, 0.5, Math.sin(T.fdir) * T.spec.h * 0.7); burst(p.x, p.y, '#c8a878', 26, 200); burst(p.x, p.y, '#8a6a4a', 14, 120);
      if (e.grade === 'hit' || e.grade === 'miss') { sfx.bad(); FX.red = 1; say(e.grade === 'hit' ? 'HIT ' + e.hit.toUpperCase() + '!' : 'OFF THE STRIP', cx, H * 0.26, '#ffb4a8', 22); hint = { txt: e.why, t: 0, secs: 4 }; }
      else { sfx.good(e.grade); say({ perfect: 'PERFECT!', good: 'GOOD DROP', in: 'IN THE STRIP' }[e.grade], cx, H * 0.26, e.grade === 'perfect' ? '#ffd36a' : '#9be3b5', e.grade === 'perfect' ? 30 : 24); say(`+${e.coins} 🪙`, cx, H * 0.32, '#ffd36a', 18); if (e.grade === 'perfect') FX.flash = 0.6; } break; }
    case 'won': sfx.win(); ui.banner = { txt: 'ALL DOWN!', t: 0, secs: 1.5, col: '#f4c46c' }; break;
    case 'lost': sfx.lose(); break;
    case 'lessonnext': hint = null; break; case 'lessonok': sfx.coin(e.n); break;
    case 'lessondone': sfx.goal(); say('YOU CAN FELL A TREE!', cx, H * 0.4, '#f4c46c', 26); break;
  } }
let IG = null, IM = {}; function idleG() { if (!IG || IG.over || IG.t > 50) { IG = newGame(4 + ((Math.random() * 6) | 0), { seed: (Math.random() * 1e6) | 0 }); IM = {}; } honest(IG, { react: 0.4, acc: 0.95 }, IM); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#12201a'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D forest.', W / 2, H / 2); if (G) hud(G, now); return; }
  const g = G || idleG(); sync(V, g, dt); W3.render(dt);
  if (FX.red > 0) { ctx.fillStyle = `rgba(200,40,30,${FX.red * 0.18})`; ctx.fillRect(0, 0, W, H); }
  if (G && !(G.over && !$('ovEnd').classList.contains('hidden'))) hud(G, now);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 0.9 ? 1 : 1 - (t2.t - 0.9) / 0.5; ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(t2.size * k)}px ${BC}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(10,20,10,.75)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 20); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 20); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30, hy = H * 0.42;
    ctx.fillStyle = 'rgba(16,26,18,.94)'; rrect(W / 2 - w / 2, hy - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, hy - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,250,230,${FX.flash * 0.35})`; ctx.fillRect(0, 0, W, H); } }
// ---------- the 2D layer: the tree's card, the ring (a cross-section of the trunk), the wind, the two buttons ----------
function layout(G) { const bh = 92 * k, y = H - bh - 16 * k, gap = 10; return { notch: { x: 12, y, w: (W - 24 - gap) * 0.42, h: bh }, saw: { x: 12 + (W - 24 - gap) * 0.42 + gap, y, w: (W - 24 - gap) * 0.58, h: bh }, ring: { x: 70 * k, y: y - 82 * k, r: 54 * k } }; }
function hud(G, now) { ctx.textBaseline = 'middle'; const T = G.tree; if (!T) return; const S = T.spec, L = layout(G), K = KINDS[S.kind];
  if (G.lesson) lessonPanel(G);
  else { const x0 = 10, y0 = 46 * k, w = W - 20; ctx.fillStyle = 'rgba(16,26,18,.78)'; rrect(x0, y0, w, 42 * k, 12 * k); ctx.fill(); ctx.textAlign = 'left';
    ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillText(G.cfg.practice ? `PRACTICE · ${G.ti + 1}` : `TREE ${G.done + 1} OF ${G.cfg.trees} · ${'♥'.repeat(Math.max(0, G.cfg.fails - G.failed + 1))}`, x0 + 10, y0 + 12 * k);
    const leanTxt = S.lm <= 0.02 ? 'straight' : Math.cos(angDiff(S.la, S.t)) < -0.5 ? 'leans BACK' : (angDiff(S.la, S.t) > 0 ? 'leans RIGHT' : 'leans LEFT');
    ctx.font = `400 ${Math.round(16 * k)}px ${TF}`; ctx.fillStyle = '#f4c46c'; ctx.fillText(`${K.name}, ${Math.round(S.h)} m, ${leanTxt}`, x0 + 10, y0 + 30 * k); }
  // the wind (top right): which way across the picture, and how hard
  if (S.wind > 0) { const w = windNow(T, G.t), rel = angDiff(S.wa, V3 && V3.camA != null ? V3.camA : T.aim), cx = W - 40 * k, cy = 120 * k; ctx.fillStyle = 'rgba(16,26,18,.7)'; ctx.beginPath(); ctx.arc(cx, cy, 26 * k, 0, TAU); ctx.fill();
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rel); ctx.strokeStyle = w > S.wind * 0.75 ? '#ff8a5a' : '#e8f4ff'; ctx.lineWidth = 3 + w * 0.5; ctx.beginPath(); ctx.moveTo(0, 14 * k); ctx.lineTo(0, -14 * k); ctx.moveTo(-7 * k, -6 * k); ctx.lineTo(0, -14 * k); ctx.lineTo(7 * k, -6 * k); ctx.stroke(); ctx.restore();
    ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillText(w < S.wind * 0.45 ? 'LULL' : w > S.wind * 0.75 ? 'GUST' : 'WIND', cx, cy + 36 * k); }
  // the hiker warning
  const hk = hikerAt(T, G.t); if (hk && (T.phase === 'cut' || T.phase === 'aim')) { const al = hk.x * Math.cos(T.aim) + hk.z * Math.sin(T.aim), lat = -hk.x * Math.sin(T.aim) + hk.z * Math.cos(T.aim), danger = al > 0 && al < S.h + 3 && Math.abs(lat) < 5;
    ctx.fillStyle = danger ? 'rgba(220,60,40,.9)' : 'rgba(16,26,18,.7)'; rrect(W - 96 * k, 176 * k, 86 * k, 26 * k, 8 * k); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillText(danger ? '🚶 HIKER!' : '🚶 path', W - 53 * k, 189 * k); }
  ring(G, L.ring);
  // the two buttons: NOTCH (then WEDGE) and SAW
  const wedgeMode = T.bc > 0.15 || (T.nd > 0 && T.bc > 0), nb = L.notch, sb = L.saw, canW = T.phase === 'cut' && T.bc >= 0.15 && !T.sawing, canN = T.bc === 0 && (T.phase === 'aim' || T.phase === 'cut');
  const live = T.phase === 'aim' || T.phase === 'cut' || (T.phase === 'fall' && T.sawing);
  ctx.globalAlpha = live ? 1 : 0.45;
  ctx.fillStyle = wedgeMode ? (canW ? '#c8d0d8' : 'rgba(255,255,255,.15)') : T.notching ? '#ffd36a' : canN ? '#f4a43c' : 'rgba(255,255,255,.15)'; rrect(nb.x, nb.y, nb.w, nb.h, 18 * k); ctx.fill();
  ctx.fillStyle = '#1a1206'; ctx.textAlign = 'center'; ctx.font = `400 ${Math.round(22 * k)}px ${TF}`; ctx.fillText(wedgeMode ? 'Wedge' : 'Notch', nb.x + nb.w / 2, nb.y + nb.h / 2 - 9 * k); ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillText(wedgeMode ? `TAP${T.wedges ? ' · ' + Math.round(T.wedges) : ''}` : 'HOLD', nb.x + nb.w / 2, nb.y + nb.h / 2 + 16 * k);
  ctx.fillStyle = T.sawing ? '#ffd36a' : T.nd > 0.05 ? '#f08a20' : 'rgba(255,255,255,.22)'; rrect(sb.x, sb.y, sb.w, sb.h, 18 * k); ctx.fill(); ctx.fillStyle = '#1a1206'; ctx.font = `400 ${Math.round(24 * k)}px ${TF}`; ctx.fillText(T.sawing ? 'Sawing…' : 'Saw', sb.x + sb.w / 2, sb.y + sb.h / 2 - 9 * k); ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillText(T.nd > 0.05 ? 'HOLD · LET GO ON THE GREEN' : 'NOTCH FIRST', sb.x + sb.w / 2, sb.y + sb.h / 2 + 16 * k);
  ctx.globalAlpha = 1;
  if ((G && G.lesson) && T.phase === 'aim' && !G.lesson && T.nd === 0) { ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillText('◀  DRAG TO AIM THE FALL  ▶', W / 2, L.ring.y - 70 * k); }
  if (ui.banner) { const B = ui.banner; ctx.textAlign = 'center'; ctx.font = `400 ${Math.round(34 * k)}px ${TF}`; ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(10,20,10,.75)'; ctx.strokeText(B.txt, W / 2, H * 0.2); ctx.fillStyle = B.col || '#fff'; ctx.fillText(B.txt, W / 2, H * 0.2); } }
// the ring: the trunk seen from above, the felling line pointing up. Notch from the top, back cut from below, the hinge between.
function ring(G, R) { const T = G.tree, S = T.spec, r = R.r, cx = R.x, cy = R.y, K = KINDS[S.kind], h = hingeOf(T), fine = upLv('ring');
  ctx.save(); ctx.fillStyle = 'rgba(16,26,18,.75)'; ctx.beginPath(); ctx.arc(cx, cy, r + 14 * k, 0, TAU); ctx.fill();
  ctx.fillStyle = '#e8c890'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(140,100,50,.5)'; ctx.lineWidth = 1; for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.arc(cx + 2, cy - 1, r * i / 5, 0, TAU); ctx.stroke(); }
  ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
  const yAt = u => cy - r + u * 2 * r;      // u: 0 at the felling side (top), 1 at the back
  // the good notch depth and the good hinge, as marks
  const lo = HINGE_OK[0] + (K.brittle ? 0.04 : 0), hi = HINGE_OK[1] + (K.brittle ? 0.04 : 0);
  ctx.fillStyle = 'rgba(80,200,120,.35)'; if (T.bc === 0) ctx.fillRect(cx - r, yAt(NOTCH_OK[0]), 2 * r, yAt(NOTCH_OK[1]) - yAt(NOTCH_OK[0])); else ctx.fillRect(cx - r, yAt(T.nd + lo), 2 * r, yAt(T.nd + hi) - yAt(T.nd + lo));
  if (fine) { ctx.strokeStyle = 'rgba(40,120,60,.8)'; ctx.lineWidth = 1; for (let u = 0.05; u < 1; u += 0.05) { ctx.beginPath(); ctx.moveTo(cx + r - 8 * k, yAt(u)); ctx.lineTo(cx + r, yAt(u)); ctx.stroke(); } }
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.clip();
  if (T.nd > 0) { ctx.fillStyle = '#2a1a0a'; const d = yAt(T.nd); ctx.beginPath(); ctx.moveTo(cx - r, cy - r); ctx.lineTo(cx + r, cy - r); ctx.lineTo(cx + r * 0.9, d); ctx.lineTo(cx - r * 0.9, d); ctx.closePath(); ctx.fill(); }
  if (T.bc > 0) { ctx.fillStyle = '#1a1008'; ctx.fillRect(cx - r, yAt(1 - T.bc), 2 * r, T.bc * 2 * r); }
  if (T.nd > 0 && T.bc > 0) { const y1 = yAt(T.nd), y2 = yAt(1 - T.bc); if (h <= hi + 0.06) { ctx.fillStyle = h < lo ? '#ff5a3a' : h > hi ? '#ffd36a' : '#3ad070'; ctx.fillRect(cx - r, y1, 2 * r, Math.max(2, y2 - y1)); } ctx.fillStyle = '#ff8a20'; ctx.fillRect(cx - r, y2 - 2, 2 * r, 3); }
  ctx.restore();
  // the felling line (up), and the lean as a red arrow
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, cy - r - 4 * k); ctx.lineTo(cx, cy - r - 13 * k); ctx.moveTo(cx - 5 * k, cy - r - 8 * k); ctx.lineTo(cx, cy - r - 13 * k); ctx.lineTo(cx + 5 * k, cy - r - 8 * k); ctx.stroke();
  if (S.lm > 0.01 && G.cfg.guide !== 'none') { const rel = angDiff(S.la, T.aim) , len = r * (0.4 + Math.min(1, S.lm * 8)); ctx.save(); ctx.translate(cx, cy); ctx.rotate(rel); ctx.strokeStyle = '#ff6a3a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -len); ctx.moveTo(-6 * k, -len + 8 * k); ctx.lineTo(0, -len); ctx.lineTo(6 * k, -len + 8 * k); ctx.stroke(); ctx.restore(); }
  ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.textAlign = 'left';
  const label = T.bc === 0 ? (T.nd === 0 ? 'NOTCH: about a third' : `NOTCH ${Math.round(T.nd * 100)}%`) : (h < lo ? 'HINGE TOO THIN!' : h > hi ? `HINGE ${Math.round(h * 100)}%: thick` : 'HINGE: good, stop');
  ctx.fillText(label, cx + r + 18 * k, cy - 6 * k); if (T.bc > 0 && T.phase === 'cut' && !T.sawing) { ctx.fillStyle = '#ffd36a'; ctx.fillText(h > lo ? 'standing: WEDGE it, or saw a little' : '', cx + r + 18 * k, cy + 12 * k); }
  ctx.restore(); }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of String(t).split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { coachPanel(G); }
