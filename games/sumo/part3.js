// ===================== THE VIEW: Sumo in 3D (three.js; renderer and light from tools/world3d.js) =====================
// A raised clay dohyo with its ring of straw bales, under a hanging roof with four coloured tassels, in a dark hall with the
// crowd on cushions all round. Two huge wrestlers: belly, thick legs, the belt (mawashi) in their colour, a topknot. The camera
// stands behind you, so "stick up" on the screen is always "toward him". They lean into what they push against (you see
// the weight), knees bend as they drive, arms reach for the belt when they grip, the feet scrape the clay when driven back.
// A bout ends in slow motion with the name of the technique.
const FX = { shake: 0, stop: 0, flash: 0, red: 0, slow: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { snap: true, cam: null, banner: null, drag: null, hold: {}, endCam: 0 };
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 160) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60 * k, t: 0, life: 0.5 + Math.random() * 0.4, col, r: (1.5 + Math.random() * 2.5) * k }); } if (PARTS.length > 240) PARTS.splice(0, PARTS.length - 240); }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2.5); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.4) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (ui.banner) { ui.banner.t += dt; if (ui.banner.t > (ui.banner.secs || 1)) ui.banner = null; }
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; } }
function mySkin() { if (typeof HEADLESS !== 'undefined' && HEADLESS) return SKINS[0]; const id = store.get('skin', 'black'); return SKINS.find(q => q.id === id) || SKINS[0]; }
function canvasTex(w, h, fn, rep) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return t; }
const SKIN_TONES = [0xe0a882, 0xc88a64, 0xb07a58, 0xd8a078, 0x9a6648, 0xe8b48e, 0xc4906c];
function buildWorld() {
  if (V3) return V3; const T = window.THREE; if (!T || !W3 || !W3.init({ canvas: $('gl'), fov: 50, far: 300, near: 0.05 })) { V3 = { none: true }; return V3; }
  V3 = { T, S: W3.scene, t: 0 }; const V = V3, S = V.S;
  V.sphG = new T.SphereGeometry(1, 20, 14); V.cylG = new T.CylinderGeometry(1, 1, 1, 20); V.boxG = new T.BoxGeometry(1, 1, 1); V.capG = new T.CapsuleGeometry(1, 1, 4, 12);
  W3.setSky('night', { azim: 200 }); W3.S.exposure = 1.0; W3.R.toneMappingExposure = 1.0; W3.scene.environmentIntensity = 0.25; W3.hemi.intensity = 0.45; W3.S.hemiI = 0.45; W3.sun.intensity = 0.0; W3.sun.visible = false; W3.scene.fog.near = 14; W3.scene.fog.far = 60; W3.scene.fog.color.setHex(0x120c08);
  W3.scene.children.forEach(o => { if (o.isLineSegments) o.visible = false; });
  const M = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.8 }, o));
  // the hall: dark walls and a high ceiling all round (no sky indoors)
  const hall = new T.Mesh(new T.BoxGeometry(46, 22, 46), M(0x1a120c, { side: T.BackSide, roughness: 1 })); hall.position.y = 10; S.add(hall);
  const floor = new T.Mesh(new T.PlaneGeometry(46, 46), M(0x2a1c12, { roughness: 0.9 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -0.6; floor.receiveShadow = true; S.add(floor);
  // the dohyo: a raised square of clay, the ring of straw, the two start lines, sand round the ring
  const clay = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#c89a62'; g.fillRect(0, 0, w, h); for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${90 + Math.random() * 60},${60 + Math.random() * 40},${30 + Math.random() * 20},${Math.random() * 0.25})`; g.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 4, 1 + Math.random() * 2); } });
  const top = new T.Mesh(new T.BoxGeometry(6.7, 0.6, 6.7), [M(0xa87a48), M(0xa87a48), new T.MeshStandardMaterial({ map: clay, roughness: 0.95 }), M(0x8a6038), M(0xa87a48), M(0xa87a48)]); top.position.y = -0.3; top.receiveShadow = true; S.add(top);
  const sand = new T.Mesh(new T.RingGeometry(RR + 0.2, RR + 0.75, 64), new T.MeshStandardMaterial({ color: 0xe8d8b0, roughness: 1 })); sand.rotation.x = -Math.PI / 2; sand.position.y = 0.005; S.add(sand);
  const straw = new T.Mesh(new T.TorusGeometry(RR + 0.08, 0.1, 10, 72), M(0xd8c07a, { roughness: 1 })); straw.rotation.x = -Math.PI / 2; straw.position.y = 0.04; straw.castShadow = true; straw.receiveShadow = true; S.add(straw); V.straw = straw;
  const sqStraw = new T.Mesh(new T.TorusGeometry(4.3, 0.1, 6, 4), M(0xc8b06a, { roughness: 1 })); sqStraw.rotation.x = -Math.PI / 2; sqStraw.rotation.z = Math.PI / 4; sqStraw.position.y = 0.04; S.add(sqStraw);
  for (const s of [-1, 1]) { const l = new T.Mesh(V.boxG, new T.MeshBasicMaterial({ color: 0xf4f0e8 })); l.scale.set(0.9, 0.01, 0.06); l.position.set(0, 0.008, s * 0.62); S.add(l); }
  V.edgeGlow = new T.Mesh(new T.RingGeometry(RR - 0.22, RR + 0.02, 72, 1, 0, 0.9), new T.MeshBasicMaterial({ color: 0xff4a2a, transparent: true, opacity: 0, depthWrite: false, toneMapped: false })); V.edgeGlow.rotation.x = -Math.PI / 2; V.edgeGlow.position.y = 0.012; S.add(V.edgeGlow);
  // the hanging roof with its four tassels (blue, red, white, black: the four seasons)
  const roof = new T.Group(); roof.position.y = 6.6; S.add(roof);
  const rf = new T.Mesh(new T.ConeGeometry(5.4, 1.4, 4, 1, true), M(0x5a3a22, { roughness: 0.7, side: T.DoubleSide })); rf.rotation.y = Math.PI / 4; rf.position.y = 0.7; roof.add(rf);
  const valance = new T.Mesh(new T.CylinderGeometry(3.9, 3.9, 0.45, 4, 1, true), M(0x6a2a7a, { roughness: 0.9, side: T.DoubleSide })); valance.rotation.y = Math.PI / 4; roof.add(valance);
  [0x2a5ad8, 0xd83a2a, 0xf0ece0, 0x1a1a1a].forEach((c, i) => { const a = Math.PI / 4 + i * Math.PI / 2, ts = new T.Mesh(V.capG, M(c, { roughness: 1 })); ts.scale.set(0.14, 0.5, 0.14); ts.position.set(Math.cos(a) * 2.75, -0.8, Math.sin(a) * 2.75); roof.add(ts); });
  // the light: warm lamps on the ring; the crowd in the half dark
  V.key = new T.SpotLight(0xffe2b8, 60, 0, 0.62, 0.45, 1.6); V.key.position.set(0.6, 9, 2.2); V.key.target.position.set(0, 0, 0); S.add(V.key); S.add(V.key.target);
  V.fill = new T.SpotLight(0xffc890, 24, 0, 0.75, 0.6, 1.6); V.fill.position.set(-3, 8, -4); V.fill.target.position.set(0, 0, 0); S.add(V.fill); S.add(V.fill.target);
  V.crowdL = new T.PointLight(0xffa860, 4, 30, 1.6); V.crowdL.position.set(0, 6, 0); S.add(V.crowdL);
  // the crowd: rows of people on cushions round the four sides, each a little different (instanced: cheap)
  { const N = 520, body = new T.InstancedMesh(V.capG, M(0xffffff, { roughness: 0.9 }), N), head = new T.InstancedMesh(V.sphG, M(0xffffff, { roughness: 0.7 }), N), mm = new T.Matrix4(), q = new T.Quaternion(), col = new T.Color(); let n = 0;
    const kimono = [0x3a4a6a, 0x6a2a3a, 0x2a4a3a, 0x8a6a3a, 0x4a3a5a, 0xc8b8a0, 0x2a2a2a, 0x7a3a2a, 0x3a6a7a];
    for (let row = 0; row < 9 && n < N; row++) for (let side = 0; side < 4 && n < N; side++) for (let i = 0; i < 15 && n < N; i++) {
      const d = 5.0 + row * 1.05, along = (i - 7) * 0.95 + ((row * 37 + side * 11) % 7) * 0.05, y = row * 0.32, a = side * Math.PI / 2, cx = Math.cos(a) * d - Math.sin(a) * along, cz = Math.sin(a) * d + Math.cos(a) * along;
      if (Math.abs(along) > d + 0.4) continue; const sc = 0.92 + ((n * 53) % 17) / 100;
      mm.compose(new T.Vector3(cx, y + 0.42 * sc, cz), q, new T.Vector3(0.24 * sc, 0.3 * sc, 0.2 * sc)); body.setMatrixAt(n, mm); body.setColorAt(n, col.setHex(kimono[(n * 7 + row) % kimono.length]));
      mm.compose(new T.Vector3(cx, y + 0.95 * sc, cz), q, new T.Vector3(0.12, 0.13, 0.12)); head.setMatrixAt(n, mm); head.setColorAt(n, col.setHex(SKIN_TONES[(n * 3) % SKIN_TONES.length])); n++; }
    body.count = head.count = n; V.crowd = { body, head, n }; S.add(body); S.add(head);
    const tiers = new T.Mesh(V.boxG, M(0x3a2418, { roughness: 1 })); for (let side = 0; side < 4; side++) for (let row = 0; row < 9; row++) { const t2 = tiers.clone(), a = side * Math.PI / 2, d = 5.0 + row * 1.05; t2.scale.set(side % 2 ? 16 + row * 2.1 : 1.05, row * 0.32 + 0.02, side % 2 ? 1.05 : 16 + row * 2.1); t2.position.set(Math.cos(a) * d, (row * 0.32) / 2, Math.sin(a) * d); S.add(t2); } }
  // the two wrestlers
  V.me = makeRikishi(V, mySkin().col, SKIN_TONES[0]); V.op = makeRikishi(V, 0x2a5ad8, SKIN_TONES[2]); S.add(V.me.g); S.add(V.op.g);
  V.dust = []; const dm = new T.MeshBasicMaterial({ color: 0xd8b888, transparent: true, opacity: 0, depthWrite: false }); for (let i = 0; i < 24; i++) { const p = new T.Mesh(V.sphG, dm.clone()); p.visible = false; S.add(p); V.dust.push({ m: p, t: 9 }); }
  W3.setQuality(stepN); return V; }
// one wrestler: hips at the origin of "body" (so a lean tips him over his feet), legs below
function makeRikishi(V, beltCol, skinCol) { const T = V.T, g = new T.Group(), body = new T.Group(), skin = new T.MeshStandardMaterial({ color: skinCol, roughness: 0.55 }), belt = new T.MeshStandardMaterial({ color: beltCol, roughness: 0.6 }), hair = new T.MeshStandardMaterial({ color: 0x141010, roughness: 0.4 });
  g.add(body); body.position.y = 0.78; const P = (geo, mat, s, p, par = body) => { const m = new T.Mesh(geo, mat); m.scale.set(...s); m.position.set(...p); m.castShadow = true; m.receiveShadow = true; par.add(m); return m; };
  const belly = P(V.sphG, skin, [0.52, 0.5, 0.48], [0, 0.32, 0.06]); P(V.sphG, skin, [0.46, 0.42, 0.4], [0, 0.72, 0.0]);      // belly and chest
  const mawashi = P(V.cylG, belt, [0.53, 0.2, 0.5], [0, 0.06, 0.04]); P(V.boxG, belt, [0.2, 0.36, 0.1], [0, -0.1, 0.42]); P(V.boxG, belt, [0.16, 0.3, 0.12], [0, 0.0, -0.42]);
  const head = new T.Group(); head.position.set(0, 1.18, 0.06); body.add(head); P(V.sphG, skin, [0.2, 0.23, 0.21], [0, 0, 0], head); P(V.sphG, hair, [0.205, 0.12, 0.2], [0, 0.1, -0.02], head); P(V.sphG, hair, [0.07, 0.05, 0.12], [0, 0.22, 0.04], head);      // head, hair, the topknot
  for (const s of [-1, 1]) P(V.sphG, hair, [0.03, 0.02, 0.01], [s * 0.07, 0.04, 0.19], head);      // eyes
  const arms = [-1, 1].map(s => { const sh = new T.Group(); sh.position.set(s * 0.5, 0.86, 0.02); body.add(sh); const up = P(V.capG, skin, [0.13, 0.26, 0.13], [0, -0.25, 0], sh); up.rotation.z = s * 0.25; const fo = new T.Group(); fo.position.set(s * 0.1, -0.5, 0); sh.add(fo); P(V.capG, skin, [0.115, 0.22, 0.115], [0, -0.2, 0], fo); P(V.sphG, skin, [0.11, 0.1, 0.12], [0, -0.42, 0.02], fo); return { sh, fo, s }; });
  const legs = [-1, 1].map(s => { const hip = new T.Group(); hip.position.set(s * 0.3, 0.78, 0); g.add(hip); const th = P(V.capG, skin, [0.2, 0.22, 0.2], [0, -0.2, 0], hip); const kn = new T.Group(); kn.position.set(0, -0.42, 0); hip.add(kn); P(V.capG, skin, [0.16, 0.18, 0.16], [0, -0.16, 0], kn); P(V.boxG, skin, [0.2, 0.07, 0.3], [0, -0.34, 0.06], kn); return { hip, kn, s }; });
  const sh = new T.Mesh(new T.CircleGeometry(0.75, 24), new T.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.35, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.position.y = 0.01; g.add(sh);
  return { g, body, belly, mawashi, belt, skin, head, arms, legs, ph: 0, fall: 0 }; }
function dust(V, x, z, n = 3) { for (let i = 0; i < n; i++) { const d = V.dust.find(q => q.t > 0.8); if (!d) return; d.t = 0; d.x = x + (Math.random() - 0.5) * 0.3; d.z = z + (Math.random() - 0.5) * 0.3; d.m.visible = true; } }
// ---------- each frame: the wrestlers and the camera ----------
function poseRikishi(V, R, w, o, dt, g) { const T = V.T;
  R.g.position.set(w.x, 0, w.z); R.g.rotation.y = w.face;
  const sp = Math.hypot(w.vx, w.vz), drive = Math.max(0, w.inp.sy), lean = clamp(w.lean, -1.2, 1.3);
  R.ph += dt * (2 + sp * 5); const stepA = Math.sin(R.ph) * Math.min(1, sp * 1.4);
  // the lean: forward over the feet when pressing; back when shoved; the roll when turned (side)
  const down = w.down ? Math.min(1, (R.fall += dt * 1.8)) : (R.fall = 0);
  const lx = lean * 0.55 + (w.down && w.lean > 0.9 ? down * 0.9 : 0) + (w.down && w.lean < -0.9 ? -down * 0.9 : 0), rz = clamp(w.side, -1.2, 1.2) * 0.45 + (w.down && Math.abs(w.side) > 0.9 ? Math.sign(w.side) * down * 0.9 : 0);
  R.body.rotation.set(lx, 0, -rz); R.body.position.y = 0.78 - 0.12 * drive - (w.brace > 0 ? 0.14 : 0) - down * 0.5 + (w.dodge > 0 ? 0.03 : 0);
  R.g.position.y = -down * 0.05;
  // the legs: knees bend as he drives (low and strong), feet stepping when he moves
  R.legs.forEach((L, i) => { const s = i ? 1 : -1; L.hip.rotation.x = -0.25 * drive - (w.brace > 0 ? 0.35 : 0) + stepA * 0.4 * s; L.hip.rotation.z = s * (0.18 + 0.12 * drive); L.kn.rotation.x = 0.35 * drive + (w.brace > 0 ? 0.6 : 0) + Math.max(0, -stepA * s) * 0.5; });
  // the arms: on his belt when gripping; thrust out on a shove; ready in front otherwise
  const thrust = w.actT > 0 ? w.actT / 0.25 : 0, d = dist(w, o), reach = clamp((d - 0.6) / 0.9, 0, 1);
  R.arms.forEach(A => { if (w.grip) { A.sh.rotation.set(-1.25 - reach * 0.2, 0, A.s * -0.35); A.fo.rotation.set(-0.5, 0, A.s * -0.2); }
    else if (thrust > 0) { A.sh.rotation.set(-1.5 * thrust - 0.3, 0, A.s * -0.1); A.fo.rotation.set(-0.2 * (1 - thrust), 0, 0); }
    else { A.sh.rotation.set(-0.7 - 0.2 * drive, 0, A.s * 0.1); A.fo.rotation.set(-0.9, 0, 0); } });
  // the winner's pose at the end of a bout (the Victory poses in the shop: a stomp, arms high, a deep bow)
  if (g.phase === 'end' && w === g.me && g.log.length && g.log[g.log.length - 1].won && !w.down) { const pl = upLv('pose'), f = Math.min(1, (V.t - (R.poseT || (R.poseT = V.t))) * 2);
    if (pl >= 1) R.arms.forEach(A => { A.sh.rotation.set(-2.7 * f, 0, A.s * -0.3 * f); A.fo.rotation.set(0, 0, 0); });
    if (pl >= 2) R.body.rotation.x = 0.55 * f * Math.abs(Math.sin(V.t * 1.5));
    if (pl === 0 || pl >= 3) { const L = R.legs[1]; L.hip.rotation.z = 0.9 * f * Math.max(0, Math.sin(V.t * 3)); L.kn.rotation.x = 0.3; } } else R.poseT = 0;
  // tired: the belly heaves
  const br = 1 + (1 - w.stam) * 0.03 * Math.sin(V.t * 9); R.belly.scale.set(0.52 * br, 0.5, 0.48 * br);
  // dust when his feet scrape (driven back), when he lands, when he hits the clay at the charge
  if (w.scrape > 0) { w.scrape -= dt; if (Math.random() < dt * 14) dust(V, w.x - Math.sin(w.face) * 0.2, w.z - Math.cos(w.face) * 0.2, 1); }
  if (w.down && down < 0.15 && Math.random() < 0.5) dust(V, w.x, w.z, 3); }
function sync(V, g, dt) { V.t += dt; const T = V.T, a = g.me, b = g.op; if (!a || !b) return;
  if (V.opFor !== g.rival) { V.opFor = g.rival; V.op.belt.color.setHex(g.rival.col); V.op.skin.color.setHex(SKIN_TONES[(g.rival.look | 0) % SKIN_TONES.length]); V.me.belt.color.setHex(mySkin().col); }
  poseRikishi(V, V.me, a, b, dt, g); poseRikishi(V, V.op, b, a, dt, g);
  for (const d of V.dust) { if (d.t > 0.8) { d.m.visible = false; continue; } d.t += dt; const f = d.t / 0.8; d.m.position.set(d.x, 0.05 + f * 0.25, d.z); d.m.scale.setScalar(0.08 + f * 0.25); d.m.material.opacity = 0.45 * (1 - f); }
  // the edge glows red behind you when your heels are near the straw (the danger, seen at once)
  const myR = Math.hypot(a.x, a.z), edge = RR - myR; V.edgeGlow.material.opacity = g.phase === 'fight' && edge < 0.8 ? (0.8 - edge) / 0.8 * (0.55 + 0.25 * Math.sin(V.t * 12)) : 0;
  V.edgeGlow.rotation.z = -Math.atan2(a.z, a.x) - 0.45; V.straw.material.color.setHex(edge < 0.35 && g.phase === 'fight' ? 0xffb070 : 0xd8c07a);
  // the camera: behind you, looking past you at him; it swings round with you; lower and closer at the end (slow motion)
  const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2, [ux, uz] = toward(b, a), asp = innerWidth / innerHeight, portrait = asp < 0.8;
  const endF = ui.endCam = g.phase === 'end' ? Math.min(1, ui.endCam + dt * 1.5) : Math.max(0, ui.endCam - dt * 2); const rp = 1 + 0.5 * upLv('replay');      // the Replay camera upgrade: closer at the end
  const back = (portrait ? 5.0 : 4.2) - endF * 1.4 * rp, up = (portrait ? 4.4 : 3.4) - endF * 2.0 * Math.min(1.2, rp), side = (portrait ? 1.5 : 1.2) + endF * 1.0;
  const cp = [mx + ux * back - uz * side, up, mz + uz * back + ux * side], cl = [mx - ux * 0.35, 0.5, mz - uz * 0.35];
  if (ui.snap || !ui.cam) { ui.cam = { p: cp.slice(), l: cl.slice() }; ui.snap = false; }
  const kk = Math.min(1, dt * 4); for (let i = 0; i < 3; i++) { ui.cam.p[i] += (cp[i] - ui.cam.p[i]) * kk; ui.cam.l[i] += (cl[i] - ui.cam.l[i]) * kk; }
  const cam = W3.cam, sh = FX.shake ? (Math.random() - 0.5) * FX.shake * 0.006 : 0; cam.fov = portrait ? 60 : 48; cam.aspect = asp; cam.updateProjectionMatrix();
  cam.position.set(ui.cam.p[0] + sh, ui.cam.p[1] + sh, ui.cam.p[2]); cam.lookAt(ui.cam.l[0], ui.cam.l[1], ui.cam.l[2]); if (window.__camAt) { cam.position.set(...window.__camAt[0]); cam.lookAt(...window.__camAt[1]); } cam.updateMatrixWorld(); W3.setFocus(mx, 0, mz, 8);
  // the crowd stirs (more as the bout goes near an edge)
  const heat = g.phase === 'fight' ? clamp(1 - Math.min(RR - myR, RR - Math.hypot(b.x, b.z)) / 1.2, 0, 1) : 0; V.crowdL.intensity = 3 + heat * 3; const cn = Math.round(V.crowd.n * (0.6 + 0.2 * upLv('crowd'))); if (V.crowd.body.count !== cn) V.crowd.body.count = V.crowd.head.count = cn;      // the Bigger crowd upgrade
  for (const R of [V.me, V.op]) R.g.visible = true; }
const SV = window.THREE ? new THREE.Vector3() : null;
function scr(x, y, z) { if (!V3 || V3.none) return { x: W / 2, y: H / 2 }; SV.set(x, y, z); return W3.screen(SV); }
// ---------- what happens, seen and heard ----------
const STYLE_WORD = { charger: 'A CHARGER', anchor: 'AN ANCHOR', puller: 'A PULLER', mixed: 'THE ALL-ROUNDER' };
function onEvent(G, e) { const cx = W / 2, V = V3 && !V3.none ? V3 : null;
  switch (e.k) {
    case 'start': case 'yard': ui.snap = true; break;
    case 'ready': ui.snap = true; ui.endCam = 0; ui.banner = { txt: 'READY…', t: 0, secs: 1.2, col: '#ffe0a0' }; sfx.ready(); if (!G.lesson && G.bi === 0) say(`${G.rival.name.toUpperCase()}: ${STYLE_WORD[G.rival.style] || ''}`, cx, H * 0.4, '#fff', 18);
      if (!G.lesson && G.N <= 6) tip('style_' + G.rival.style, { charger: 'He CHARGES at the start. Tap DODGE as it begins: he flies past and falls or runs out.', anchor: 'He is HEAVY and holds his ground. Grip his belt and TURN him (stick sideways), or drive when he tires.', puller: 'He PULLS: do not lean in too long. Short pushes; when he pulls, stop pushing.', mixed: 'He does everything. Watch his weight: when he leans in, pull or dodge.' }[G.rival.style], 3.4); break;
    case 'go': ui.banner = { txt: 'HAKKEYOI!', t: 0, secs: 0.9, col: '#ffd040' }; sfx.go(); break;
    case 'charge': sfx.clash(1); FX.shake = 10; vibe(HAP.heavy); if (V) { dust(V, (G.me.x + G.op.x) / 2, (G.me.z + G.op.z) / 2, 6); } break;
    case 'grip': if (e.who === 'me') { sfx.grip(); vibe(HAP.tick); say('GRIP!', cx, H * 0.46, '#ffd080', 18); } else sfx.grip(0.6); break;
    case 'release': if (e.who === 'me' || e.who === 'both') sfx.release(); break;
    case 'push': case 'bigpush': if (e.hit) { sfx.slap(e.k === 'bigpush'); FX.shake = Math.max(FX.shake, e.k === 'bigpush' ? 9 : 4); if (e.who === 'me') vibe(e.k === 'bigpush' ? HAP.thud : HAP.light); if (e.k === 'bigpush' && e.who === 'me') FX.stop = 0.05; } else sfx.whiff(); break;
    case 'dodge': sfx.dodge(); if (e.who === 'me') vibe(HAP.tick); break;
    case 'foot': if (Math.random() < 0.6) sfx.foot(e.who === 'me' ? 1 : 0.7); if (e.who === 'me') vibe(HAP.tick); break;
    case 'restart': ui.banner = { txt: 'A LONG BOUT: AGAIN!', t: 0, secs: 1.3, col: '#ffe0a0' }; sfx.ready(); break;
    case 'end': { FX.slow = 1.1; FX.shake = 16; sfx.fall(e.how); sfx.crowd(e.won ? 1 : 0.6); if (e.won) vibe(HAP.best); else vibe(HAP.thud);
      const nm = e.tech.split(' (')[0], why = e.tech.includes('(') ? e.tech.slice(e.tech.indexOf('(') + 1, -1) : ''; ui.banner = { txt: nm.toUpperCase(), sub: (e.won ? 'YOU WIN: ' : 'HE WINS: ') + why, t: 0, secs: 1.8, col: e.won ? '#80ff90' : '#ff9a7a' };
      if (V) { const L = e.loser === 'me' ? G.me : G.op; dust(V, L.x, L.z, 8); }
      if (!e.won && !G.lesson) { const tipTxt = { out: 'Pushed out: when your heels reach the straw (it glows red), TURN (grip + stick sideways) or DODGE.', forward: 'You fell forward: you leaned in too long. Push in short bursts and stop when he pulls or steps aside.', down: 'Knocked down backwards: brace (stand still) or push back when he shoves.', side: 'Thrown on the turn: when he turns you, stop pushing and turn back the other way.' }[e.how]; if (tipTxt) hint = { txt: tipTxt, t: 0, secs: 3.6 }; }
      if (G.cfg.tour && !G.lesson) say(`BOUTS ${G.wins} – ${G.losses}`, cx, H * 0.62, '#fff', 20); break; }
    case 'won': sfx.win(); break;
    case 'lost': sfx.lose(); break;
    case 'lessonnext': hint = null; break;
    case 'lessonok': sfx.coin(e.n); break;
    case 'lessonmiss': coachMiss(); sfx.no(); break;
    case 'lessondone': sfx.goal(); say('LESSON DONE!', cx, H * 0.4, '#80ff90', 28); burst(cx, H * 0.4, '#80ff90', 24); break;
  } }
let IG = null; function idleG() { if (!IG || IG.over) { IG = newGame(Math.max(4, store.get('level', 1) | 0), { seed: (Math.random() * 1e6) | 0 }); IG.mem = {}; ui.snap = true; } honest(IG, { react: 0.3, acc: 0.9 }, IG.mem); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#2a1a10'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D ring.', W / 2, H / 2); if (G) hud(G, now); return; }
  const g = G || idleG(); sync(V, g, dt); W3.render(dt);
  if (G && !(G.over && !$('ovEnd').classList.contains('hidden'))) hud(G, now);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 0.9 ? 1 : 1 - (t2.t - 0.9) / 0.5; ctx.globalAlpha = Math.max(0, al); const sc = t2.t < 0.12 ? 1.3 - t2.t / 0.12 * 0.3 : 1; ctx.font = `400 ${Math.round(t2.size * k * sc)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(20,12,6,.7)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 20); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 20); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30, hy = 150 * k + h / 2;
    ctx.fillStyle = 'rgba(24,16,10,.9)'; rrect(W / 2 - w / 2, hy - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, hy - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,60,30,${FX.red * 0.2})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,250,220,${FX.flash * 0.6})`; ctx.fillRect(0, 0, W, H); } }
// ---------- the 2D layer: the rival, the two stamina bars, your balance, the stick and the three buttons ----------
// The buttons sit low on the right (big, apart), the stick floats wherever the left thumb lands: nothing covers the ring.
function btnRects(G) { const b = 92 * k, s = 74 * k, x = W - b - 18 * k, y = H - b - 30 * k;
  return { push: { x, y, w: b, h: b }, grip: { x: x - s - 16 * k, y: y + b - s + 4 * k, w: s, h: s }, dodge: { x: x + (b - s) / 2, y: y - s - 16 * k, w: s, h: s } }; }
function bar(x, y, w, h, f, col, lab, right) { ctx.fillStyle = 'rgba(0,0,0,.45)'; rrect(x, y, w, h, h / 2); ctx.fill(); ctx.fillStyle = col; const fw = Math.max(h, w * clamp(f, 0, 1)); rrect(right ? x + w - fw : x, y, fw, h, h / 2); ctx.fill();
  ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.fillStyle = '#fff'; ctx.textAlign = right ? 'right' : 'left'; ctx.fillText(lab, right ? x + w : x, y - 7 * k); }
function hud(G, now) { ctx.textBaseline = 'middle'; const m = G.me, o = G.op, c = G.cfg; if (!m || !o) return;
  if (G.lesson) lessonPanel(G);
  else { const x0 = 12, y0 = 58 * k, w = W - 24; ctx.fillStyle = 'rgba(24,16,10,.62)'; rrect(x0, y0 - 16 * k, w, 62 * k, 14 * k); ctx.fill();
    ctx.textAlign = 'left'; ctx.font = `400 ${Math.round(16 * k)}px ${TF}`; ctx.fillStyle = '#ffd080'; ctx.fillText(`LEVEL ${G.N}`, x0 + 10, y0 + 2 * k);
    ctx.textAlign = 'right'; ctx.fillStyle = '#' + G.rival.col.toString(16).padStart(6, '0'); ctx.font = `400 ${Math.round(16 * k)}px ${TF}`; ctx.fillText(G.rival.name.toUpperCase(), x0 + w - 10, y0 + 2 * k);
    if (c.tour) { ctx.textAlign = 'center'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = '#fff'; let s = ''; for (let i = 0; i < c.bouts; i++) s += i < G.log.length ? (G.log[i].won ? '● ' : '✕ ') : '○ '; ctx.fillText(`TOURNAMENT · BEST OF 3   ${s}`, W / 2, y0 + 2 * k); }
    const bw = (w - 40) / 2; bar(x0 + 10, y0 + 30 * k, bw, 9 * k, m.stam, m.stam < 0.25 ? '#ff7a5a' : '#ffd080', m.stam < 0.25 ? 'YOU: TIRED!' : 'YOUR STRENGTH'); bar(x0 + w - 10 - bw, y0 + 30 * k, bw, 9 * k, o.stam, o.stam < 0.25 ? '#9aff9a' : '#c8c8d8', o.stam < 0.25 ? 'HE IS TIRED: GO!' : 'HIS STRENGTH', true); }
  // your balance: a little level under the ring (forward = leaning in; red at the ends: you are about to fall)
  { const bx = W / 2, by = (G.lesson ? 176 : 128) * k, bw2 = 120 * k, f = clamp(m.lean, -1, 1); ctx.fillStyle = 'rgba(0,0,0,.45)'; rrect(bx - bw2 / 2, by - 6 * k, bw2, 12 * k, 6 * k); ctx.fill(); ctx.fillStyle = 'rgba(255,90,60,.6)'; rrect(bx - bw2 / 2, by - 6 * k, bw2 * 0.18, 12 * k, 6 * k); ctx.fill(); rrect(bx + bw2 / 2 - bw2 * 0.18, by - 6 * k, bw2 * 0.18, 12 * k, 6 * k); ctx.fill();
    ctx.fillStyle = Math.abs(f) > 0.64 ? '#ff5a4a' : '#fff'; ctx.beginPath(); ctx.arc(bx + f * bw2 / 2, by, 7 * k, 0, TAU); ctx.fill(); ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillText(Math.abs(f) > 0.64 ? (f > 0 ? 'LEANING IN: CAREFUL!' : 'FALLING BACK!') : 'BALANCE', bx, by - 15 * k); }
  if (ui.banner) { const B = ui.banner, sc = B.t < 0.12 ? 1.25 - B.t / 0.12 * 0.25 : 1; ctx.textAlign = 'center'; ctx.font = `400 ${Math.round(32 * k * sc)}px ${TF}`; ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(20,12,6,.75)'; ctx.strokeText(B.txt, W / 2, H * 0.3); ctx.fillStyle = B.col || '#fff'; ctx.fillText(B.txt, W / 2, H * 0.3);
    if (B.sub) { ctx.font = `700 ${Math.round(15 * k)}px ${BC}`; ctx.lineWidth = 5; ctx.strokeText(B.sub.toUpperCase(), W / 2, H * 0.3 + 30 * k); ctx.fillStyle = '#fff'; ctx.fillText(B.sub.toUpperCase(), W / 2, H * 0.3 + 30 * k); } }
  // the stick (where the left thumb landed), or a pulsing ring showing where to put it
  if (ui.drag) { const d2 = ui.drag, R = 50 * k, dx = clamp(d2.x - d2.x0, -R, R), dy = clamp(d2.y - d2.y0, -R, R); ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(d2.x0, d2.y0, R, 0, TAU); ctx.stroke();
    ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.textAlign = 'center'; ctx.fillText(m.grip ? 'DRIVE' : 'PRESS', d2.x0, d2.y0 - R - 9 * k); ctx.fillText(m.grip ? 'PULL' : 'BACK', d2.x0, d2.y0 + R + 9 * k);
    ctx.fillStyle = 'rgba(255,208,128,.65)'; ctx.beginPath(); ctx.arc(d2.x0 + dx, d2.y0 + dy, 22 * k, 0, TAU); ctx.fill(); }
  else if (!G.over && G.phase !== 'end') { ctx.globalAlpha = 0.4 + 0.3 * Math.sin(now * 4); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(W * 0.24, H - 120 * k, 50 * k, 0, TAU); ctx.stroke(); ctx.font = `400 ${Math.round(12 * k)}px ${TF}`; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText('THUMB HERE', W * 0.24, H - 120 * k); ctx.fillText('↑ PRESS IN', W * 0.24, H - 120 * k - 64 * k); ctx.globalAlpha = 1; }
  // the three buttons: PUSH (big; a ring fills while you hold it for the big push), GRIP (lit while you hold his belt), DODGE (dims while it recovers)
  const B = btnRects(G), hold = m.pushing ? clamp(m.pushing / 0.35, 0, 1) : 0, near = dist(m, o) < 1.25;
  const btn = (r, txt, col, on, dim, sub) => { const cx2 = r.x + r.w / 2, cy2 = r.y + r.h / 2; ctx.globalAlpha = dim ? 0.45 : 1; ctx.fillStyle = on ? col : 'rgba(24,16,10,.66)'; ctx.beginPath(); ctx.arc(cx2, cy2, r.w / 2, 0, TAU); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 3 * k; ctx.beginPath(); ctx.arc(cx2, cy2, r.w / 2 - 2 * k, 0, TAU); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `400 ${Math.round(14 * k)}px ${TF}`; ctx.fillText(txt, cx2, cy2 - (sub ? 5 * k : 0)); if (sub) { ctx.font = `700 ${Math.round(9 * k)}px ${BC}`; ctx.fillText(sub, cx2, cy2 + 11 * k); } ctx.globalAlpha = 1; };
  btn(B.push, hold >= 1 ? 'BIG!' : 'PUSH', '#ff8a3a', m.pushing > 0, m.pushCd > 0 && !m.pushing, 'TAP · HOLD');
  if (hold > 0) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 5 * k; ctx.beginPath(); ctx.arc(B.push.x + B.push.w / 2, B.push.y + B.push.h / 2, B.push.w / 2 + 5 * k, -Math.PI / 2, -Math.PI / 2 + TAU * hold); ctx.stroke(); }
  btn(B.grip, m.grip ? 'HOLDING' : 'GRIP', '#e8b04a', m.grip || ui.hold.grip, !near && !m.grip, m.grip ? '' : near ? 'HOLD' : 'GET CLOSE');
  btn(B.dodge, 'DODGE', '#5aa8e8', m.dodge > 0, m.dodgeCd > 0, '');
  if (m.dodgeCd > 0) { ctx.strokeStyle = '#5aa8e8'; ctx.lineWidth = 4 * k; ctx.beginPath(); ctx.arc(B.dodge.x + B.dodge.w / 2, B.dodge.y + B.dodge.h / 2, B.dodge.w / 2 + 4 * k, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - m.dodgeCd / 0.85)); ctx.stroke(); } }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { coachPanel(G); }
