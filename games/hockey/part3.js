// ===================== THE VIEW: Ice Hockey (sideways; a raised camera along the near boards follows the puck) =====================
// The rink: white ice with its lines and circles, boards and glass, two nets, the crowd. Eight skaters that lean into their
// strides, a goalie in pads. The puck is made a little bigger than life, with a pale outline and a short trail so it never
// gets lost among the lines and shadows. Below: the stick on the left, PASS / SHOOT / BURST on the right.
const FX = { shake: 0, stop: 0, flash: 0, red: 0, slow: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { snap: true, banner: null, stick: null, btn: {}, flash: 0 };
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 160) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40 * k, t: 0, life: 0.5 + Math.random() * 0.4, col, r: (1.5 + Math.random() * 2.5) * k }); } if (PARTS.length > 240) PARTS.splice(0, PARTS.length - 240); }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2.5); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.4) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 200 * dt; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (ui.banner) { ui.banner.t += dt; if (ui.banner.t > (ui.banner.secs || 1)) ui.banner = null; }
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; } }
function mySkin() { if (typeof HEADLESS !== 'undefined' && HEADLESS) return SKINS[0]; const id = store.get('skin', 'classic'); return SKINS.find(q => q.id === id) || SKINS[0]; }
// the rink's outline (rounded rectangle), as points
function outline(m = 0, n = 14) { const pts = [], ax = HL - m, az = HW - m, r = CR - m; const cs = [[ax - r, az - r, 0], [-(ax - r), az - r, Math.PI / 2], [-(ax - r), -(az - r), Math.PI], [ax - r, -(az - r), Math.PI * 1.5]];
  for (const [cx, cz, a0] of cs) for (let i = 0; i <= n; i++) { const a = a0 + i / n * Math.PI / 2; pts.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]); } return pts; }
function iceTex() { const c = document.createElement('canvas'), S = 40, w = HL * 2 * S, h = HW * 2 * S; c.width = w; c.height = h; const g = c.getContext('2d'), X = x => (x + HL) * S, Z = z => (z + HW) * S;
  g.fillStyle = '#eef6fb'; g.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(180,205,225,${Math.random() * 0.12})`; g.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 30, 1); }
  g.fillStyle = '#d8283a'; g.fillRect(X(-0.15), 0, 0.3 * S, h); g.fillStyle = '#2a5ad8'; for (const x of [-6, 6]) g.fillRect(X(x) - 0.15 * S, 0, 0.3 * S, h);
  g.strokeStyle = '#d8283a'; g.lineWidth = 0.08 * S; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(X(s * GX), Z(-HW + 1.2)); g.lineTo(X(s * GX), Z(HW - 1.2)); g.stroke(); }
  g.strokeStyle = '#2a5ad8'; g.lineWidth = 0.08 * S; g.beginPath(); g.arc(X(0), Z(0), 3 * S, 0, TAU); g.stroke(); g.fillStyle = '#2a5ad8'; g.beginPath(); g.arc(X(0), Z(0), 0.2 * S, 0, TAU); g.fill();
  g.strokeStyle = '#d8283a'; for (const s of [-1, 1]) for (const z of [-4.5, 4.5]) { g.beginPath(); g.arc(X(s * 11), Z(z), 2.6 * S, 0, TAU); g.stroke(); g.fillStyle = '#d8283a'; g.beginPath(); g.arc(X(s * 11), Z(z), 0.18 * S, 0, TAU); g.fill(); }
  g.fillStyle = 'rgba(90,160,240,.55)'; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(X(s * GX), Z(-1.4)); g.arc(X(s * GX), Z(0), 1.4 * S, s > 0 ? Math.PI / 2 : -Math.PI / 2, s > 0 ? Math.PI * 1.5 : Math.PI / 2); g.fill(); }
  g.font = `bold ${2.2 * S}px Russo One, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(42,90,216,.12)'; g.fillText('GAME FEED', X(0), Z(0) - 0.05 * S);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
function buildWorld() {
  if (V3) return V3; const T = window.THREE; if (!T || !W3 || !W3.init({ canvas: $('gl'), fov: 36, far: 400, near: 0.3, dims: () => [W, H] })) { V3 = { none: true }; return V3; }
  V3 = { T, S: W3.scene, t: 0 }; const V = V3, S = V.S, M = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.6 }, o)); V.M = M;
  V.boxG = new T.BoxGeometry(1, 1, 1); V.sphG = new T.SphereGeometry(1, 14, 10); V.cylG = new T.CylinderGeometry(1, 1, 1, 12);
  W3.setSky('night'); W3.scene.children.forEach(o => { if (o.isLineSegments) o.visible = false; }); W3.hemi.intensity = 1.0; W3.S.hemiI = 1.0; W3.S.exposure = 0.45; W3.R.toneMappingExposure = 0.45;
  // the ice
  const sh = new T.Shape(), ol = outline(0); ol.forEach(([x, z], i) => i ? sh.lineTo(x, -z) : sh.moveTo(x, -z)); const ig = new T.ShapeGeometry(sh, 6); const pos = ig.attributes.position, uv = ig.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + HL) / (2 * HL), (pos.getY(i) + HW) / (2 * HW)); ig.rotateX(-Math.PI / 2);
  V.ice = new T.Mesh(ig, new T.MeshStandardMaterial({ map: iceTex(), roughness: 0.18, metalness: 0.05 })); V.ice.receiveShadow = true; S.add(V.ice);
  // boards, kick plate, glass: one box per stretch of the outline
  const ob = outline(-0.12, 10), bw = M(0xf4f4f0, { roughness: 0.4 }), kick = M(0xf0c020), glass = new T.MeshStandardMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.12, roughness: 0.05, depthWrite: false });
  for (let i = 0; i < ob.length; i++) { const a = ob[i], b = ob[(i + 1) % ob.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]) + 0.02, ang = Math.atan2(b[1] - a[1], b[0] - a[0]), mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
    const w2 = new T.Mesh(V.boxG, bw); w2.scale.set(L, 1.05, 0.18); w2.position.set(mx, 0.52, mz); w2.rotation.y = -ang; S.add(w2); const kp = new T.Mesh(V.boxG, kick); kp.scale.set(L, 0.18, 0.2); kp.position.set(mx, 0.09, mz); kp.rotation.y = -ang; S.add(kp);
    if (mz < 0 || Math.abs(mx) > HL - 1) { const g = new T.Mesh(V.boxG, glass); g.scale.set(L, 1.6, 0.04); g.position.set(mx, 1.85, mz); g.rotation.y = -ang; S.add(g); } }
  // the crowd: tiers behind the far boards and the ends, a sea of little shirts
  V.crowd = new T.Group(); S.add(V.crowd); const tierM = M(0x2a2e3a), seats = []; for (let r = 0; r < 7; r++) { const t2 = new T.Mesh(V.boxG, tierM); t2.scale.set(52, 0.6, 1.2); t2.position.set(0, 0.6 + r * 0.6, -HW - 1.2 - r * 1.2); V.crowd.add(t2); for (let i = 0; i < 60; i++) seats.push([-24 + i * 0.8 + (r % 2) * 0.4, 1.3 + r * 0.6, -HW - 1.2 - r * 1.2]); }
  for (const s of [-1, 1]) for (let r = 0; r < 6; r++) { const t2 = new T.Mesh(V.boxG, tierM); t2.scale.set(1.2, 0.6, 26); t2.position.set(s * (HL + 1.4 + r * 1.2), 0.6 + r * 0.6, 0); V.crowd.add(t2); for (let i = 0; i < 28; i++) seats.push([s * (HL + 1.4 + r * 1.2), 1.3 + r * 0.6, -12 + i * 0.9]); }
  const fan = new T.InstancedMesh(new T.BoxGeometry(0.45, 0.7, 0.35), M(0xffffff, { roughness: 0.9 }), seats.length), d = new T.Object3D(), col = new T.Color(); seats.forEach((p, i) => { d.position.set(p[0], p[1], p[2]); d.updateMatrix(); fan.setMatrixAt(i, d.matrix); col.setHSL(Math.random(), 0.5, 0.35 + Math.random() * 0.3); fan.setColorAt(i, col); }); V.crowd.add(fan); V.fans = fan; V.seats = seats;
  // outdoor (the pond rink): snowbanks and pines instead
  V.out = new T.Group(); S.add(V.out); const snow = M(0xf4f8ff, { roughness: 0.9 }); for (let i = 0; i < 26; i++) { const s2 = new T.Mesh(V.sphG, snow); const a = i / 26 * TAU; s2.scale.set(3 + Math.random() * 2, 1 + Math.random(), 3); s2.position.set(Math.cos(a) * (HL + 4), 0, Math.sin(a) * (HW + 4)); V.out.add(s2); }
  V.pines = W3.pines(Array.from({ length: 60 }, (_, i) => { const a = i / 60 * TAU; return { x: Math.cos(a) * (HL + 10 + Math.random() * 15), y: 0, z: Math.sin(a) * (HW + 10 + Math.random() * 15) - 6, s: 1.5 + Math.random() }; }), {}); V.pines.visible = false;
  V.floor = new T.Mesh(new T.PlaneGeometry(400, 400), M(0x1a1e28, { roughness: 0.9 })); V.floor.rotation.x = -Math.PI / 2; V.floor.position.y = -0.02; S.add(V.floor);
  const lamp = new T.PointLight(0xffffff, 90, 60, 1.6); lamp.position.set(0, 16, 0); S.add(lamp); V.lamp = lamp; for (const x of [-12, 12]) { const l = new T.PointLight(0xfff4e8, 50, 50, 1.7); l.position.set(x, 14, 0); S.add(l); }
  // the nets: red posts and crossbar, white mesh
  for (const s of [1, -1]) { const g = new T.Group(); g.position.set(s * GX, 0, 0); g.rotation.y = s > 0 ? 0 : Math.PI; const red = M(0xd8283a, { roughness: 0.4, metalness: 0.3 }), net = new T.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, side: T.DoubleSide, wireframe: false });
    for (const z of [-GW2, GW2]) { const p = new T.Mesh(V.cylG, red); p.scale.set(0.05, 1.22, 0.05); p.position.set(0, 0.61, z); g.add(p); } const bar = new T.Mesh(V.cylG, red); bar.scale.set(0.05, GW2 * 2, 0.05); bar.rotation.x = Math.PI / 2; bar.position.set(0, 1.22, 0); g.add(bar);
    const back = new T.Mesh(new T.PlaneGeometry(GW2 * 2, 1.0), net); back.position.set(GD, 0.5, 0); back.rotation.y = Math.PI / 2; g.add(back); const top = new T.Mesh(new T.PlaneGeometry(GD, GW2 * 2), net); top.rotation.x = Math.PI / 2; top.position.set(GD / 2, 1.1, 0); g.add(top);
    for (const z of [-GW2, GW2]) { const sd = new T.Mesh(new T.PlaneGeometry(GD, 1.1), net); sd.position.set(GD / 2, 0.55, z); g.add(sd); } S.add(g); }
  // the skaters
  V.men = []; for (let i = 0; i < 8; i++) V.men.push(skater(V, i >= 4, i % 4 === 0));
  V.ring = new T.Mesh(new T.RingGeometry(0.55, 0.75, 32), new T.MeshBasicMaterial({ color: 0xffe040, transparent: true, opacity: 0.9, depthWrite: false })); V.ring.rotation.x = -Math.PI / 2; V.ring.position.y = 0.03; S.add(V.ring);
  V.arrow = new T.Mesh(new T.ConeGeometry(0.18, 0.35, 3), new T.MeshBasicMaterial({ color: 0xffe040 })); V.arrow.rotation.x = Math.PI; S.add(V.arrow);
  // the puck: bigger than life, a pale outline under it, a soft glow
  V.puck = new T.Group(); const pk = new T.Mesh(new T.CylinderGeometry(0.13, 0.13, 0.07, 20), M(0x0a0a0c, { roughness: 0.4 })); pk.position.y = 0.035; pk.castShadow = true; V.puck.add(pk);
  const ol2 = new T.Mesh(new T.RingGeometry(0.14, 0.2, 24), new T.MeshBasicMaterial({ color: 0xfff0a0, transparent: true, opacity: 0.85, depthWrite: false })); ol2.rotation.x = -Math.PI / 2; ol2.position.y = 0.02; V.puck.add(ol2); S.add(V.puck);
  W3.setQuality(stepN); return V; }
function skater(V, them, goalie) { const T = V.T, M = V.M, g = new T.Group(), jersey = M(0x2a6ad8, { roughness: 0.7 }), pants = M(0x1a1a24), dark = M(0x15151a, { roughness: 0.4 }), skin = M(0xd8a07a);
  const torso = new T.Mesh(V.cylG, jersey); torso.scale.set(goalie ? 0.36 : 0.28, 0.6, goalie ? 0.3 : 0.22); torso.position.y = 1.15; g.add(torso);
  const hips = new T.Mesh(V.boxG, pants); hips.scale.set(0.42, 0.3, 0.3); hips.position.y = 0.78; g.add(hips);
  const legs = []; for (const s of [-1, 1]) { const L = new T.Group(); L.position.set(0, 0.7, s * 0.11); const shin = new T.Mesh(V.boxG, goalie ? M(0xf4f4f4) : pants); shin.scale.set(goalie ? 0.24 : 0.14, 0.62, goalie ? 0.2 : 0.14); shin.position.y = -0.33; L.add(shin); const sk = new T.Mesh(V.boxG, dark); sk.scale.set(0.32, 0.08, 0.08); sk.position.set(0.05, -0.66, 0); L.add(sk); g.add(L); legs.push(L); }
  const head = new T.Mesh(V.sphG, skin); head.scale.setScalar(0.14); head.position.y = 1.58; g.add(head); const helm = new T.Mesh(new T.SphereGeometry(1, 14, 8, 0, TAU, 0, Math.PI * 0.6), goalie ? M(0xf4f4f4) : dark); helm.scale.setScalar(0.16); helm.position.y = 1.6; g.add(helm);
  const stick = new T.Group(); stick.position.set(0.15, 1.0, 0.2); const shaft = new T.Mesh(V.boxG, M(0xc8a070)); shaft.scale.set(0.04, 1.35, 0.04); shaft.position.y = -0.6; stick.add(shaft); const blade = new T.Mesh(V.boxG, dark); blade.scale.set(0.34, 0.08, 0.04); blade.position.set(0.15, -1.26, 0); stick.add(blade); stick.rotation.z = -0.6; g.add(stick);
  if (goalie) { const blocker = new T.Mesh(V.boxG, M(0xf4f4f4)); blocker.scale.set(0.1, 0.35, 0.28); blocker.position.set(0.2, 1.05, -0.32); g.add(blocker); }
  V.S.add(g); return { g, torso, jersey, legs, stick, them, goalie, ph: Math.random() * 6 }; }
// ---------- every frame ----------
function sync(V, G, dt) { V.t += dt; const u = G.puck, pl = placeOf(G.N), outdoor = pl === 0;
  if (V.place !== pl) { V.place = pl; W3.setSky(outdoor ? 'golden' : 'night'); V.crowd.visible = !outdoor; V.out.visible = V.pines.visible = outdoor; V.floor.material.color.setHex(outdoor ? 0xe8eef4 : 0x1a1e28); V.lamp.intensity = outdoor ? 20 : 90; }
  const mine = mySkin().col, foe = G.kit[0];
  G.P.forEach((p, i) => { const m = V.men[i], v = Math.hypot(p.vx, p.vz); m.jersey.color.setHex(p.t ? foe : mine); m.g.position.set(p.x, 0, p.z); m.g.rotation.y = -p.face;
    m.ph += dt * (2 + v * 1.1); const sw = Math.sin(m.ph) * Math.min(0.6, v * 0.08); m.legs[0].rotation.z = sw; m.legs[1].rotation.z = -sw; m.torso.rotation.z = -Math.min(0.45, v * 0.05) + (p.down > 0 ? 0.6 : 0); m.g.rotation.x = 0; m.g.position.y = Math.abs(Math.sin(m.ph)) * 0.02;
    m.g.rotation.z = p.cut ? clamp(angD(Math.atan2(p.vz, p.vx), p.face) * 0.2, -0.25, 0.25) : 0;
    m.stick.rotation.z = p.wind > 0 ? -0.6 + Math.min(1.8, p.wind * 3) : p.pk > 0.25 ? -1.2 : -0.6 + Math.sin(m.ph * 0.5) * 0.05; m.stick.rotation.x = p.pk > 0.25 ? -0.4 : 0; });
  const c = G.P[G.ctrl]; V.ring.position.set(c.x, 0.03, c.z); V.arrow.position.set(c.x, 2.15 + Math.sin(V.t * 5) * 0.06, c.z); V.ring.visible = V.arrow.visible = !G.over;
  V.puck.position.set(u.x, 0, u.z); u.trail.push([u.x, u.z]); if (u.trail.length > 9) u.trail.shift();
  if (V.fans && V.t - (V.fanT || 0) > 0.05) { V.fanT = V.t; const d = new V.T.Object3D(), ex = Math.max(0, V.cheer || 0); for (let i = 0; i < 40; i++) { const j = (Math.random() * V.seats.length) | 0, s = V.seats[j]; d.position.set(s[0], s[1] + Math.random() * 0.12 * (1 + ex * 3), s[2]); d.updateMatrix(); V.fans.setMatrixAt(j, d.matrix); } V.fans.instanceMatrix.needsUpdate = true; V.cheer = Math.max(0, (V.cheer || 0) - dt * 0.4); }
  // the camera: high on the near side, following the puck along the rink
  const cam = W3.cam, tx = clamp(u.x * 0.9, -11, 11); V.cx = V.cx == null ? tx : V.cx + (tx - V.cx) * Math.min(1, dt * 3); const cz = clamp(u.z * 0.3, -2, 2); V.cz = V.cz == null ? cz : V.cz + (cz - V.cz) * Math.min(1, dt * 2);
  const asp = W / H, sh = FX.shake ? (Math.random() - 0.5) * FX.shake * 0.01 : 0; cam.fov = asp > 1.6 ? 36 : 42; cam.aspect = asp; cam.updateProjectionMatrix();
  cam.position.set(V.cx + sh, 10.5 + sh, 12.5 + V.cz); cam.lookAt(V.cx, 0, V.cz + 0.3); cam.updateMatrixWorld(); W3.setFocus(V.cx, 0, 0, 25); }
const SV = window.THREE ? new THREE.Vector3() : null;
function scr(x, y, z) { if (!V3 || V3.none) return { x: W / 2, y: H / 2 }; SV.set(x, y, z); return W3.screen(SV); }
// ---------- what happens, seen and heard ----------
function onEvent(G, e) { const cx = W / 2, u = G.puck;
  switch (e.k) {
    case 'faceoff': ui.banner = { txt: e.first ? (G.cfg.first3 ? 'FIRST TO THREE' : PLACES[placeOf(G.N)].name) : 'FACEOFF', t: 0, secs: 1.0, col: '#9ad8ff' }; tip('face', 'FACEOFF: tap PASS or SHOOT the moment the puck drops. Not before!', 3); break;
    case 'early': sfx.no(); say('TOO EARLY!', cx, H * 0.4, '#ffb4a8', 22); break;
    case 'faceoffwon': sfx.stick(); say(e.t === 0 ? 'WON THE DRAW' : e.early ? 'TOO EARLY: THEIR PUCK' : 'THEIR PUCK', cx, H * 0.36, e.t === 0 ? '#9be3b5' : '#ffd0a0', 18); break;
    case 'pass': sfx.stick(); if (e.boards) { const p = scr(u.x, 0, u.z); say('OFF THE BOARDS', p.x, p.y - 30 * k, '#d8eaff', 14); } break;
    case 'windup': sfx.windup(); break;
    case 'oneready': say('ONE-TIMER READY', W / 2, H * 0.4, '#ffe060', 16); break;
    case 'shoot': sfx.shot(e.power); if (e.oneT && e.t === 0) say('ONE-TIMER!', W / 2, H * 0.36, '#ffe060', 22); vibe(e.power > 0.3 ? HAP.sharp : HAP.light); if (e.power > 0.3) FX.shake = 4; break;
    case 'save': { const gk = G.P[e.t * 4], p = scr(gk.x, 1, gk.z); sfx.save(); burst(p.x, p.y, '#ffffff', 10, 120); say(e.hold ? 'SAVE!' : 'SAVE! REBOUND', p.x, p.y - 40 * k, e.t === 0 ? '#9be3b5' : '#ffd0a0', 16); if (e.t === 0) tip('rebound', 'A save often bounces out: get to the rebound!', 2.6); break; }
    case 'goal': { sfx.horn(e.t === 0); V3 && (V3.cheer = e.t === 0 ? 3 : 1); FX.shake = 8; FX.flash = e.t === 0 ? 0.6 : 0; vibe(e.t === 0 ? HAP.best : HAP.thud); const gx = goalX(e.t), p = scr(gx, 0.6, 0); burst(p.x, p.y, e.t === 0 ? '#9ad8ff' : '#ff9a8a', 30, 220);
      ui.banner = { txt: e.t === 0 ? 'GOAL!' : 'THEY SCORE', t: 0, secs: 1.8, col: e.t === 0 ? '#ffe060' : '#ffb4a8' };
      if (e.t === 0) { const extra = []; if (e.ast) extra.push(`${e.ast} ASSIST${e.ast > 1 ? 'S' : ''}`); if (e.combo >= 2) extra.push(`${e.combo}-PASS MOVE!`); if (e.power > 0.3) extra.push('SLAP SHOT'); if (e.oneT) extra.push('ONE-TIMER'); if (extra.length) say(extra.join(' · '), cx, H * 0.36, '#d8f0ff', 18); } break; }
    case 'boards': if (e.puck || e.v > 5) { sfx.boards(e.v); if (e.v > 6) FX.shake = 3; } break;
    case 'post': sfx.post(); say('POST!', cx, H * 0.4, '#fff', 18); break;
    case 'poke': sfx.poke(); break;
    case 'stolen': sfx.stick(); vibe(HAP.light); if (e.t === 0) { const m = G.P[G.ctrl], p = scr(m.x, 2, m.z); say('STOLEN!', p.x, p.y - 20 * k, '#9be3b5', 18); } else say('LOST IT', cx, H * 0.4, '#ffd0a0', 16); break;
    case 'intercept': if (e.t === 0) { sfx.coin(2); say('INTERCEPTED! +2', cx, H * 0.36, '#ffe060', 18); } break;
    case 'switch': if (!e.auto) sfx.click(); break;
    case 'burst': sfx.burst(); vibe(HAP.tick); break;
    case 'golden': ui.banner = { txt: 'OVERTIME: NEXT GOAL WINS', t: 0, secs: 2, col: '#ffe060' }; sfx.horn(false); break;
    case 'won': sfx.win(); break; case 'lost': sfx.lose(); break;
    case 'lessonnext': hint = null; break; case 'lessonok': sfx.coin(e.n); say(`${e.n} OF ${e.need}`, cx, H * 0.36, '#9be3b5', 20); break;
    case 'lessonmiss': coachMiss(); sfx.no(); break;
    case 'lessondone': sfx.goal(); say('READY FOR A MATCH!', cx, H * 0.4, '#9ad8ff', 26); break;
  } }
let IG = null, IM = {}; function idleG() { if (!IG || IG.over || IG.t > 40) { IG = newGame(5 + ((Math.random() * 10) | 0), { seed: (Math.random() * 1e6) | 0 }); IM = {}; } honest(IG, { react: 0.3, acc: 0.95 }, IM); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#0e1a2a'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D rink.', W / 2, H / 2); if (G) hud(G, now); return; }
  const g = G || idleG(); sync(V, g, dt); W3.render(dt);
  // the puck's trail and a glow ring, drawn over the picture so it never gets lost
  const tr = g.puck.trail, sp = Math.hypot(g.puck.vx, g.puck.vz); if (!g.puck.own && sp > 4 && tr.length > 2) { ctx.strokeStyle = 'rgba(255,240,170,.5)'; ctx.lineWidth = 4 * k; ctx.beginPath(); tr.forEach(([x, z], i) => { const p = scr(x, 0.05, z); i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); }); ctx.stroke(); }
  if (G && !(G.over && !$('ovEnd').classList.contains('hidden'))) hud(G, now);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 0.9 ? 1 : 1 - (t2.t - 0.9) / 0.5; ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(t2.size * k)}px ${BC}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(8,14,24,.75)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 20); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 20); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W * 0.5), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30, hy = H * 0.3;
    ctx.fillStyle = 'rgba(10,18,30,.94)'; rrect(W / 2 - w / 2, hy - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, hy - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(220,240,255,${FX.flash * 0.35})`; ctx.fillRect(0, 0, W, H); } }
// ---------- the 2D layer: the scoreboard, the faceoff, the stick and the three buttons ----------
function layout(G) { const r = 44 * k, bx = W - 70 * k, by = H - 70 * k; return { shoot: { x: bx, y: by, r: r * 1.15 }, pass: { x: bx - 108 * k, y: by + 8 * k, r }, burst: { x: bx - 20 * k, y: by - 104 * k, r: r * 0.82 }, stickZone: { x: 0, y: H * 0.25, w: W * 0.45, h: H * 0.75 } }; }
function hud(G, now) { ctx.textBaseline = 'middle'; const L = layout(G), u = G.puck, p = me(G);
  if (G.lesson) lessonPanel(G);
  else { const mm = G.cfg.first3 ? '' : G.golden ? 'OT ' + Math.max(0, Math.ceil(G.cfg.len + 120 - G.clock)) : (() => { const s = Math.max(0, Math.ceil(G.cfg.len - G.clock)); return `${(s / 60) | 0}:${String(s % 60).padStart(2, '0')}`; })();
    const w = 300 * k, x0 = W / 2 - w / 2, y0 = 8 * k; ctx.fillStyle = 'rgba(8,14,24,.82)'; rrect(x0, y0, w, 34 * k, 10 * k); ctx.fill();
    ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.textAlign = 'right'; ctx.fillStyle = '#9ad8ff'; ctx.fillText('BLUE', W / 2 - 46 * k, y0 + 17 * k); ctx.textAlign = 'left'; ctx.fillStyle = '#' + G.kit[0].toString(16).padStart(6, '0'); ctx.fillText(G.foe.toUpperCase(), W / 2 + 46 * k, y0 + 17 * k);
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = `400 ${Math.round(20 * k)}px ${TF}`; ctx.fillText(`${G.score[0]} : ${G.score[1]}`, W / 2, y0 + 18 * k);
    if (mm) { ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillStyle = G.golden ? '#ffe060' : 'rgba(255,255,255,.75)'; ctx.fillText(mm, W / 2, y0 + 42 * k); } }
  // the faceoff
  if (G.face) { const F = G.face, dropped = F.t >= F.drop; ctx.textAlign = 'center'; ctx.font = `400 ${Math.round(30 * k)}px ${TF}`; ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(8,14,24,.75)'; const t2 = F.early ? 'TOO EARLY' : dropped ? 'TAP!' : 'WAIT FOR THE DROP…'; ctx.strokeText(t2, W / 2, H * 0.45); ctx.fillStyle = dropped ? '#ffe060' : '#fff'; ctx.fillText(t2, W / 2, H * 0.45); }
  // the stick
  const s2 = ui.stick; if (s2) { ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.arc(s2.x0, s2.y0, 56 * k, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 2; ctx.stroke(); const dx = s2.x - s2.x0, dy = s2.y - s2.y0, d = Math.hypot(dx, dy), m = Math.min(1, 56 * k / (d || 1)); ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.arc(s2.x0 + dx * m, s2.y0 + dy * m, 24 * k, 0, TAU); ctx.fill(); }
  else { ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(90 * k, H - 90 * k, 56 * k, 0, TAU); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillText('SKATE', 90 * k, H - 90 * k); }
  // the buttons: what they do now (with the puck / without it / at a faceoff)
  const att = havePuck(G) && u.own === p, faceNow = !!G.face, btn = (b, label, sub, col, on) => { ctx.fillStyle = on ? col : 'rgba(10,18,30,.55)'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = on ? '#0a1220' : '#fff'; ctx.textAlign = 'center'; ctx.font = `400 ${Math.round(15 * k)}px ${TF}`; ctx.fillText(label, b.x, b.y - (sub ? 5 * k : 0)); if (sub) { ctx.font = `700 ${Math.round(9 * k)}px ${BC}`; ctx.fillText(sub, b.x, b.y + 12 * k); } };
  btn(L.pass, faceNow ? 'TAP' : att ? 'PASS' : 'SWITCH', '', '#9ad8ff', !!ui.btn.pass);
  btn(L.shoot, faceNow ? 'TAP' : att ? 'SHOOT' : 'POKE', att ? 'HOLD: SLAP' : '', '#ffe060', !!ui.btn.shoot || p.wind > 0);
  if (p.wind > 0) { ctx.strokeStyle = '#ff7a3a'; ctx.lineWidth = 6 * k; ctx.beginPath(); ctx.arc(L.shoot.x, L.shoot.y, L.shoot.r + 6 * k, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, Math.max(0, p.wind - 0.22) / 0.4)); ctx.stroke(); }
  btn(L.burst, 'BURST', '', '#9be3b5', p.burst > 0); ctx.strokeStyle = p.st >= 0.25 ? '#9be3b5' : '#ff7a6a'; ctx.lineWidth = 4 * k; ctx.beginPath(); ctx.arc(L.burst.x, L.burst.y, L.burst.r + 5 * k, -Math.PI / 2, -Math.PI / 2 + TAU * p.st); ctx.stroke();
  if (ui.banner) { const B = ui.banner; ctx.textAlign = 'center'; ctx.font = `400 ${Math.round(40 * k)}px ${TF}`; ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(8,14,24,.75)'; ctx.strokeText(B.txt, W / 2, H * 0.3); ctx.fillStyle = B.col || '#fff'; ctx.fillText(B.txt, W / 2, H * 0.3); } }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of String(t).split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { coachPanel(G); }
