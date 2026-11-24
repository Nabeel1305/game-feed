// ===================== THE VIEW: Hoops 3v3 (sideways; a raised camera along the near sideline follows the ball) =====================
// A compact court: polished wood with the key and the three-point arc painted on, two hoops (pole, glass board, orange rim, white
// net), a park court with a fence and trees at first, then gyms and arenas with a crowd. Six players in vests and shorts who
// dribble, jump and reach. The ball is a little bigger than life. Below: the stick on the left, PASS / SHOOT / SPRINT on the
// right; holding SHOOT shows the meter over your player with its green band.
const FX = { shake: 0, stop: 0, flash: 0, red: 0, slow: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { snap: true, banner: null, stick: null, btn: {}, flash: 0, aim: null };
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 160) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40 * k, t: 0, life: 0.5 + Math.random() * 0.4, col, r: (1.5 + Math.random() * 2.5) * k }); } if (PARTS.length > 240) PARTS.splice(0, PARTS.length - 240); }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2.5); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.4) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 200 * dt; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (ui.banner) { ui.banner.t += dt; if (ui.banner.t > (ui.banner.secs || 1)) ui.banner = null; }
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; } }
function mySkin() { if (typeof HEADLESS !== 'undefined' && HEADLESS) return SKINS[0]; const id = store.get('skin', 'blue'); return SKINS.find(q => q.id === id) || SKINS[0]; }
function courtTex(park) { const c = document.createElement('canvas'), S = 40, w = HL * 2 * S, h = HW * 2 * S; c.width = w; c.height = h; const g = c.getContext('2d'), X = x => (x + HL) * S, Z = z => (z + HW) * S;
  if (park) { g.fillStyle = '#3a6a8a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); } }
  else { for (let i = 0; i < h; i += 0.4 * S) { g.fillStyle = `hsl(32,${45 + Math.random() * 10}%,${52 + Math.random() * 8}%)`; g.fillRect(0, i, w, 0.4 * S); } for (let i = 0; i < 400; i++) { g.fillStyle = 'rgba(90,50,20,.12)'; g.fillRect(Math.random() * w, Math.random() * h, 1.2 * S + Math.random() * 2 * S, 1); } }
  g.strokeStyle = '#fff'; g.lineWidth = 0.08 * S; g.strokeRect(X(-HL + 0.05), Z(-HW + 0.05), (HL * 2 - 0.1) * S, (HW * 2 - 0.1) * S); g.beginPath(); g.moveTo(X(0), 0); g.lineTo(X(0), h); g.stroke(); g.beginPath(); g.arc(X(0), Z(0), 1.8 * S, 0, TAU); g.stroke();
  for (const s of [-1, 1]) { const hx = s * HX; g.fillStyle = park ? 'rgba(216,90,40,.85)' : 'rgba(200,60,30,.8)'; const kx = s > 0 ? X(HX - 4.6 + 1.2) : X(-HL); g.fillRect(s > 0 ? X(HL - 5.8) : X(-HL), Z(-2.45), 5.8 * S, 4.9 * S); g.strokeRect(s > 0 ? X(HL - 5.8) : X(-HL), Z(-2.45), 5.8 * S, 4.9 * S);
    g.beginPath(); g.arc(X(s * (HL - 5.8)), Z(0), 1.8 * S, 0, TAU); g.stroke();
    g.beginPath(); const a0 = Math.asin(Math.min(1, (HW - 0.9) / R3)); for (let i = 0; i <= 40; i++) { const a = -a0 + 2 * a0 * i / 40, x = hx - s * Math.cos(a) * R3, z = Math.sin(a) * R3; i ? g.lineTo(X(x), Z(z)) : g.moveTo(X(x), Z(z)); } g.stroke();
    const zc = Math.sin(a0) * R3, xc = hx - s * Math.cos(a0) * R3; for (const zz of [-zc, zc]) { g.beginPath(); g.moveTo(X(xc), Z(zz)); g.lineTo(X(s * HL), Z(zz)); g.stroke(); } }
  g.font = `${2.2 * S}px Russo One, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(255,255,255,.12)'; g.fillText('GAME FEED', X(0), Z(-4.2));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
function buildWorld() {
  if (V3) return V3; const T = window.THREE; if (!T || !W3 || !W3.init({ canvas: $('gl'), fov: 36, far: 400, near: 0.3, dims: () => [W, H] })) { V3 = { none: true }; return V3; }
  V3 = { T, S: W3.scene, t: 0 }; const V = V3, S = V.S, M = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.6 }, o)); V.M = M;
  V.boxG = new T.BoxGeometry(1, 1, 1); V.sphG = new T.SphereGeometry(1, 14, 10); V.cylG = new T.CylinderGeometry(1, 1, 1, 12);
  W3.scene.children.forEach(o => { if (o.isLineSegments) o.visible = false; });
  V.courtM = [courtTex(true), courtTex(false)]; V.court = new T.Mesh(new T.PlaneGeometry(HL * 2, HW * 2), new T.MeshStandardMaterial({ map: V.courtM[1], roughness: 0.35, metalness: 0.05 })); V.court.rotation.x = -Math.PI / 2; V.court.receiveShadow = true; S.add(V.court);
  V.floor = new T.Mesh(new T.PlaneGeometry(400, 400), M(0x22242a, { roughness: 0.9 })); V.floor.rotation.x = -Math.PI / 2; V.floor.position.y = -0.02; V.floor.receiveShadow = true; S.add(V.floor);
  // the hoops: pole, arm, glass board with a square, orange rim, a net
  for (const s of [1, -1]) { const g = new T.Group(), hx = s * HX; const pole = new T.Mesh(V.cylG, M(0x3a3e46, { metalness: 0.5 })); pole.scale.set(0.09, 3.4, 0.09); pole.position.set(hx + s * 1.5, 1.7, 0); pole.castShadow = true; g.add(pole);
    const arm = new T.Mesh(V.boxG, M(0x3a3e46)); arm.scale.set(1.2, 0.1, 0.1); arm.position.set(hx + s * 0.95, 3.35, 0); g.add(arm);
    const board = new T.Mesh(V.boxG, new T.MeshStandardMaterial({ color: 0xe8f4ff, transparent: true, opacity: 0.35, roughness: 0.05 })); board.scale.set(0.05, 1.05, 1.8); board.position.set(hx + s * 0.38, 3.45, 0); g.add(board);
    const sq = new T.Mesh(V.boxG, M(0xffffff)); sq.scale.set(0.06, 0.45, 0.6); sq.position.set(hx + s * 0.37, 3.3, 0); g.add(sq);
    const rim = new T.Mesh(new T.TorusGeometry(0.23, 0.02, 8, 24), M(0xff6a1a, { metalness: 0.4, roughness: 0.4 })); rim.rotation.x = Math.PI / 2; rim.position.set(hx, 3.05, 0); g.add(rim);
    const net = new T.Mesh(new T.CylinderGeometry(0.23, 0.14, 0.45, 12, 1, true), new T.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, side: T.DoubleSide, wireframe: true })); net.position.set(hx, 2.8, 0); g.add(net); g.userData.net = net; S.add(g); (V.hoops = V.hoops || []).push(g); }
  // the crowd (indoors): tiers along the far side and both ends
  V.crowd = new T.Group(); S.add(V.crowd); const tierM = M(0x2a2e3a), seats = []; for (let r = 0; r < 6; r++) { const t2 = new T.Mesh(V.boxG, tierM); t2.scale.set(40, 0.6, 1.2); t2.position.set(0, 0.6 + r * 0.6, -HW - 1.5 - r * 1.2); V.crowd.add(t2); for (let i = 0; i < 46; i++) seats.push([-18 + i * 0.8 + (r % 2) * 0.4, 1.3 + r * 0.6, -HW - 1.5 - r * 1.2]); }
  for (const s of [-1, 1]) for (let r = 0; r < 5; r++) { const t2 = new T.Mesh(V.boxG, tierM); t2.scale.set(1.2, 0.6, 20); t2.position.set(s * (HL + 2.6 + r * 1.2), 0.6 + r * 0.6, 0); V.crowd.add(t2); for (let i = 0; i < 22; i++) seats.push([s * (HL + 2.6 + r * 1.2), 1.3 + r * 0.6, -9.5 + i * 0.9]); }
  const fan = new T.InstancedMesh(new T.BoxGeometry(0.45, 0.7, 0.35), M(0xffffff, { roughness: 0.9 }), seats.length), d = new T.Object3D(), col = new T.Color(); seats.forEach((p, i) => { d.position.set(p[0], p[1], p[2]); d.updateMatrix(); fan.setMatrixAt(i, d.matrix); col.setHSL(Math.random(), 0.5, 0.35 + Math.random() * 0.3); fan.setColorAt(i, col); }); V.crowd.add(fan); V.fans = fan; V.seats = seats;
  // outdoors (the park court): a chain-link fence and trees
  V.out = new T.Group(); S.add(V.out); const fence = new T.MeshStandardMaterial({ color: 0x9aa4ae, transparent: true, opacity: 0.35, wireframe: true });
  for (const [w, x, z, ry] of [[HL * 2 + 3, 0, -HW - 1.5, 0], [HW * 2 + 3, -HL - 1.5, 0, Math.PI / 2], [HW * 2 + 3, HL + 1.5, 0, Math.PI / 2]]) { const f = new T.Mesh(new T.PlaneGeometry(w, 3, Math.round(w * 2), 6), fence); f.position.set(x, 1.5, z); f.rotation.y = ry; V.out.add(f); }
  V.pines = W3.pines(Array.from({ length: 40 }, (_, i) => ({ x: -26 + i * 1.4 + Math.random(), y: 0, z: -HW - 6 - Math.random() * 10, s: 1.2 + Math.random() })), {}); V.pines.visible = false;
  const lamp = new T.PointLight(0xffffff, 90, 60, 1.6); lamp.position.set(0, 14, 0); S.add(lamp); V.lamp = lamp; for (const x of [-9, 9]) { const l = new T.PointLight(0xfff4e8, 45, 45, 1.7); l.position.set(x, 12, 0); S.add(l); }
  V.men = []; for (let i = 0; i < 6; i++) V.men.push(player(V, i >= 3));
  V.ring = new T.Mesh(new T.RingGeometry(0.5, 0.7, 32), new T.MeshBasicMaterial({ color: 0xffe040, transparent: true, opacity: 0.9, depthWrite: false })); V.ring.rotation.x = -Math.PI / 2; V.ring.position.y = 0.03; S.add(V.ring);
  V.arrow = new T.Mesh(new T.ConeGeometry(0.18, 0.35, 3), new T.MeshBasicMaterial({ color: 0xffe040 })); V.arrow.rotation.x = Math.PI; S.add(V.arrow);
  V.tgt = new T.Mesh(new T.RingGeometry(0.5, 0.62, 32), new T.MeshBasicMaterial({ color: 0x7af0ff, transparent: true, opacity: 0.9, depthWrite: false })); V.tgt.rotation.x = -Math.PI / 2; V.tgt.position.y = 0.035; S.add(V.tgt);
  V.ball = new T.Mesh(new T.SphereGeometry(0.17, 18, 12), M(0xe8682a, { roughness: 0.75 })); V.ball.castShadow = true; S.add(V.ball);
  const seam = new T.Mesh(new T.TorusGeometry(0.171, 0.008, 4, 24), M(0x1a1a1a)); V.ball.add(seam); const seam2 = seam.clone(); seam2.rotation.y = Math.PI / 2; V.ball.add(seam2);
  V.shadow = new T.Mesh(new T.CircleGeometry(0.2, 16), new T.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.35, depthWrite: false })); V.shadow.rotation.x = -Math.PI / 2; V.shadow.position.y = 0.02; S.add(V.shadow);
  W3.setQuality(stepN); return V; }
function player(V, them) { const T = V.T, M = V.M, g = new T.Group(), jersey = M(0x2a6ad8, { roughness: 0.7 }), shorts = M(0x2a6ad8, { roughness: 0.7 }), skin = M(them ? 0x8d5524 : 0xc68642), shoe = M(0xf4f4f4);
  const torso = new T.Mesh(V.cylG, jersey); torso.scale.set(0.27, 0.62, 0.2); torso.position.y = 1.25; g.add(torso); const sh = new T.Mesh(V.boxG, shorts); sh.scale.set(0.44, 0.32, 0.3); sh.position.y = 0.85; g.add(sh);
  const legs = []; for (const s of [-1, 1]) { const L = new T.Group(); L.position.set(0, 0.75, s * 0.11); const shin = new T.Mesh(V.boxG, skin); shin.scale.set(0.12, 0.66, 0.12); shin.position.y = -0.36; L.add(shin); const sk = new T.Mesh(V.boxG, shoe); sk.scale.set(0.28, 0.1, 0.13); sk.position.set(0.05, -0.7, 0); L.add(sk); g.add(L); legs.push(L); }
  const arms = []; for (const s of [-1, 1]) { const A = new T.Group(); A.position.set(0, 1.52, s * 0.3); const a = new T.Mesh(V.boxG, skin); a.scale.set(0.1, 0.62, 0.1); a.position.y = -0.3; A.add(a); g.add(A); arms.push(A); }
  const head = new T.Mesh(V.sphG, skin); head.scale.setScalar(0.15); head.position.y = 1.72; g.add(head);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); V.S.add(g); return { g, torso, jersey, shorts, legs, arms, them, ph: Math.random() * 6 }; }
// ---------- every frame ----------
function sync(V, G, dt) { V.t += dt; const b = G.ball, pl = G.place, park = pl === 0;
  if (V.place !== pl) { V.place = pl; W3.setSky(park ? 'golden' : 'night'); V.crowd.visible = !park; V.out.visible = V.pines.visible = park; V.court.material.map = V.courtM[park ? 0 : 1]; V.court.material.needsUpdate = true; V.floor.material.color.setHex(park ? 0x5a6a48 : 0x22242a); V.lamp.intensity = park ? 25 : 90; }
  const mine = mySkin().col, foe = G.kit[0];
  G.P.forEach((p, i) => { const m = V.men[i], v = Math.hypot(p.vx, p.vz), hasB = b.own === p; m.jersey.color.setHex(p.t ? foe : mine); m.shorts.color.setHex(p.t ? foe : mine); m.g.position.set(p.x, 0, p.z); m.g.rotation.y = -p.face;
    m.ph += dt * (2 + v * 1.6); const sw = Math.sin(m.ph) * Math.min(0.7, v * 0.12); m.legs[0].rotation.z = sw; m.legs[1].rotation.z = -sw; m.torso.rotation.z = -Math.min(0.3, v * 0.04);
    const shooting = (b.kind === 'shot' && b.from === p && b.t < 0.35) || p.holding, jump = shooting ? Math.sin(Math.min(1, (b.kind === 'shot' && b.from === p ? b.t / 0.35 : p.meter)) * Math.PI) * (b.shot && b.shot.kind === 'dunk' ? 0.8 : 0.45) : 0;
    m.g.position.y = jump + Math.abs(Math.sin(m.ph)) * 0.02; m.g.rotation.x = p.off > 0 ? Math.sin(V.t * 20) * 0.15 : 0;
    m.arms[0].rotation.z = shooting ? 2.8 : hasB ? -0.6 + Math.abs(Math.sin(G.t * 9)) * 0.4 : (!p.t === (b.own && b.own.t === 1)) ? 0.4 : Math.sin(m.ph) * 0.4; m.arms[1].rotation.z = shooting ? 2.6 : (b.own && b.own.t !== p.t && dist(p, b.own) < 2) ? 1.2 : -Math.sin(m.ph) * 0.4; });
  const c = G.P[G.ctrl]; V.ring.position.set(c.x, 0.03, c.z); V.arrow.position.set(c.x, 2.25 + Math.sin(V.t * 5) * 0.06, c.z); V.ring.visible = V.arrow.visible = !G.over;
  // the teammate a tap on PASS would find (or the one your drag points at)
  const tq = haveBall(G) && b.own === c ? bestTarget(G, c, ui.aim) : null; V.tgt.visible = !!tq && !G.over; if (tq) V.tgt.position.set(tq.x, 0.035, tq.z);
  V.ball.position.set(b.x, b.y, b.z); V.ball.rotation.x += dt * 6; V.shadow.position.set(b.x, 0.02, b.z);
  if (V.fans && V.t - (V.fanT || 0) > 0.05) { V.fanT = V.t; const d = new V.T.Object3D(), ex = Math.max(0, V.cheer || 0); for (let i = 0; i < 30; i++) { const j = (Math.random() * V.seats.length) | 0, s = V.seats[j]; d.position.set(s[0], s[1] + Math.random() * 0.12 * (1 + ex * 3), s[2]); d.updateMatrix(); V.fans.setMatrixAt(j, d.matrix); } V.fans.instanceMatrix.needsUpdate = true; V.cheer = Math.max(0, (V.cheer || 0) - dt * 0.4); }
  V.hoops.forEach(h => { const n = h.userData.net; n.scale.y = 1 + (V.swish && V.swish.h === h ? Math.sin(V.swish.t * 20) * 0.2 * Math.max(0, 1 - V.swish.t) : 0); }); if (V.swish) { V.swish.t += dt; if (V.swish.t > 1) V.swish = null; }
  // the camera: high on the near sideline, following the ball along the court
  const cam = W3.cam, tx = clamp(b.x * 0.85, -6.5, 6.5); V.cx = V.cx == null ? tx : V.cx + (tx - V.cx) * Math.min(1, dt * 3); const cz = clamp(b.z * 0.25, -1.5, 1.5); V.cz = V.cz == null ? cz : V.cz + (cz - V.cz) * Math.min(1, dt * 2);
  const asp = W / H, sh = FX.shake ? (Math.random() - 0.5) * FX.shake * 0.01 : 0; cam.fov = asp > 1.6 ? 38 : 44; cam.aspect = asp; cam.updateProjectionMatrix();
  cam.position.set(V.cx + sh, 9.5 + sh, 12.5 + V.cz); cam.lookAt(V.cx, 0.6, V.cz + 0.2); cam.updateMatrixWorld(); W3.setFocus(V.cx, 0, 0, 20); }
const SV = window.THREE ? new THREE.Vector3() : null;
function scr(x, y, z) { if (!V3 || V3.none) return { x: W / 2, y: H / 2 }; SV.set(x, y, z); return W3.screen(SV); }
// ---------- what happens, seen and heard ----------
function onEvent(G, e) { const cx = W / 2, b = G.ball;
  switch (e.k) {
    case 'start': ui.banner = { txt: G.tour ? `${['QUARTER-FINAL', 'SEMI-FINAL', 'FINAL'][G.tour.round] || 'TOURNAMENT'}` : PLACES[G.place].name.toUpperCase(), t: 0, secs: 1.4, col: '#ffb070' }; sfx.whistle(); tip('start', 'Left thumb: move (push all the way to sprint). Right: PASS, SHOOT (hold, let go in the green).', 3.4); break;
    case 'change': if (e.t === 0) tip('att', 'Your ball: find the open teammate (ringed) or the open shot.', 2.6); else tip('def', 'Defend: stay between your player and the basket. SWITCH, then STEAL when close.', 3.2); break;
    case 'pass': sfx.pass(); break; case 'catch': sfx.catchB(); break;
    case 'gather': sfx.click(); break;
    case 'fake': if (e.late) { say('HELD TOO LONG', W / 2, H * 0.38, '#ffd0a0', 16); tip('late', 'Let go while the meter is in the green.', 2.6); } else say('PUMP FAKE', W / 2, H * 0.4, '#d8f0ff', 14); break;
    case 'release': if (e.grade === 'perfect') say('PERFECT RELEASE', cx, H * 0.36, '#9be3b5', 18); else if (e.grade === 'early') say('TOO EARLY', cx, H * 0.38, '#ffd0a0', 16); else if (e.grade === 'late') say('TOO LATE', cx, H * 0.38, '#ffd0a0', 16); break;
    case 'shot': sfx.shot(); if (e.kind === 'dunk') { say('DUNK!', cx, H * 0.34, '#ffe060', 30); FX.shake = 6; vibe(HAP.heavy || HAP.sharp); } break;
    case 'score': { const hx = hoopX(e.t), p = scr(hx, 3, 0); sfx.swish(e.t === 0); V3 && (V3.cheer = e.t === 0 ? 3 : 1, V3.swish = { h: V3.hoops[e.t === 0 ? 0 : 1], t: 0 }); burst(p.x, p.y, e.t === 0 ? '#ffb070' : '#ff9a8a', e.pts === 3 ? 34 : 22, 200); vibe(e.t === 0 ? HAP.best : HAP.light);
      ui.banner = { txt: e.t === 0 ? (e.pts === 3 ? 'THREE!' : e.kind === 'dunk' ? 'SLAM!' : 'BUCKET!') : (e.pts === 3 ? 'THEY HIT A THREE' : 'THEY SCORE'), t: 0, secs: 1.3, col: e.t === 0 ? '#ffe060' : '#ffb4a8' }; break; }
    case 'miss': sfx.rim(); { const p = scr(hoopX(e.t), 3, 0); say('OFF THE RIM', p.x, p.y - 30 * k, '#fff', 15); } tip('reb', 'A miss bounces out: get to the rebound!', 2.4); break;
    case 'rebound': sfx.bounce(); if (e.t === 0) { const m = G.P[G.ctrl], p = scr(m.x, 2.2, m.z); say('REBOUND', p.x, p.y - 20 * k, '#9be3b5', 15); } break;
    case 'steal': sfx.steal(); vibe(HAP.light); if (e.t === 0) { const m = G.P[G.ctrl], p = scr(m.x, 2.2, m.z); say('STOLEN!', p.x, p.y - 20 * k, '#9be3b5', 20); } else say('STRIPPED', cx, H * 0.4, '#ffd0a0', 16); break;
    case 'intercept': sfx.steal(); if (e.t === 0) say('PICKED OFF!', cx, H * 0.36, '#ffe060', 18); else say('INTERCEPTED', cx, H * 0.4, '#ffd0a0', 16); break;
    case 'block': sfx.block(); FX.shake = 5; say(e.t === 0 ? 'BLOCKED!' : 'BLOCKED', cx, H * 0.36, e.t === 0 ? '#ffe060' : '#ffd0a0', 24); vibe(HAP.sharp); break;
    case 'contest': if (e.t === 0) say('HAND UP', cx, H * 0.4, '#d8f0ff', 14); break;
    case 'swipe': if (e.t === 0) sfx.swipe(); break;
    case 'offbal': if (e.t === 0 || e.t == null) { sfx.no(); say('OFF BALANCE', cx, H * 0.42, '#ffd0a0', 16); tip('offbal', 'Steal too often and you lose your balance. Pick your moment.', 3); } break;
    case 'shotclock': sfx.buzzer(); say(e.t === 0 ? 'SHOT CLOCK! THEIR BALL' : 'SHOT CLOCK: OUR BALL', cx, H * 0.38, '#ffd0a0', 18); break;
    case 'switch': sfx.click(); break;
    case 'overtime': ui.banner = { txt: 'OVERTIME: NEXT BASKET WINS', t: 0, secs: 2, col: '#ffe060' }; sfx.buzzer(); break;
    case 'won': sfx.win(); break; case 'lost': sfx.lose(); break;
    case 'lessonnext': hint = null; break; case 'lessonok': sfx.coin(e.n); say(`${e.n} OF ${e.need}`, cx, H * 0.36, '#9be3b5', 20); break;
    case 'lessonmiss': coachMiss(); sfx.no(); break;
    case 'lessondone': sfx.swish(true); say('READY FOR A GAME!', cx, H * 0.4, '#ffb070', 26); break;
  } }
let IG = null, IM = {}; function idleG() { if (!IG || IG.over || IG.t > 40) { IG = newGame(5 + ((Math.random() * 10) | 0), { seed: (Math.random() * 1e6) | 0 }); IM = {}; } honest(IG, { react: 0.3, acc: 0.95 }, IM); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#1e1410'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D court.', W / 2, H / 2); if (G) hud(G, now); return; }
  const g = G || idleG(); sync(V, g, dt); W3.render(dt);
  if (G && !(G.over && !$('ovEnd').classList.contains('hidden'))) hud(G, now);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 0.9 ? 1 : 1 - (t2.t - 0.9) / 0.5; ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(t2.size * k)}px ${BC}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(24,14,8,.75)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 20); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 20); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W * 0.5), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30, hy = H * 0.3;
    ctx.fillStyle = 'rgba(30,18,10,.94)'; rrect(W / 2 - w / 2, hy - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, hy - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,240,220,${FX.flash * 0.35})`; ctx.fillRect(0, 0, W, H); } }
// ---------- the 2D layer: the scoreboard, the shot meter, the stick and the three buttons ----------
function layout(G) { const r = 44 * k, bx = W - 70 * k, by = H - 70 * k; return { shoot: { x: bx, y: by, r: r * 1.15 }, pass: { x: bx - 108 * k, y: by + 8 * k, r }, sprint: { x: bx - 20 * k, y: by - 104 * k, r: r * 0.82 }, stickZone: { x: 0, y: H * 0.25, w: W * 0.45, h: H * 0.75 } }; }
function hud(G, now) { ctx.textBaseline = 'middle'; const L = layout(G), b = G.ball, p = me(G);
  if (G.lesson) lessonPanel(G);
  else { const s = Math.max(0, Math.ceil(G.cfg.len - G.clock)), mm = G.golden ? 'OVERTIME' : `${(s / 60) | 0}:${String(s % 60).padStart(2, '0')}`;
    const w = 300 * k, x0 = W / 2 - w / 2, y0 = 8 * k; ctx.fillStyle = 'rgba(24,14,8,.82)'; rrect(x0, y0, w, 34 * k, 10 * k); ctx.fill();
    ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.textAlign = 'right'; ctx.fillStyle = '#' + mySkin().col.toString(16).padStart(6, '0'); ctx.fillStyle = '#9ad8ff'; ctx.fillText('YOU', W / 2 - 46 * k, y0 + 17 * k); ctx.textAlign = 'left'; ctx.fillStyle = '#' + G.kit[0].toString(16).padStart(6, '0'); ctx.fillText(G.foe.toUpperCase(), W / 2 + 46 * k, y0 + 17 * k);
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = `400 ${Math.round(20 * k)}px ${TF}`; ctx.fillText(`${G.score[0]} : ${G.score[1]}`, W / 2, y0 + 18 * k);
    ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillStyle = G.golden ? '#ffe060' : 'rgba(255,255,255,.8)'; ctx.fillText(mm, W / 2 - 30 * k, y0 + 44 * k);
    if (b.kind === 'held' && G.sc < 99) { ctx.fillStyle = G.sc < 4 ? '#ff7a5a' : 'rgba(255,255,255,.8)'; ctx.fillText(`SHOT ${Math.ceil(G.sc)}`, W / 2 + 34 * k, y0 + 44 * k); } }
  // the shot meter over your player while you hold SHOOT
  if (p.holding && b.own === p) { const q = scr(p.x, 2.3, p.z), w = 16 * k, h = 70 * k, x = q.x + 26 * k, y = q.y - h; const [g0, g1] = greenZone(G, p), Y = v => y + h - h * Math.min(1, v / 1.2);
    ctx.fillStyle = 'rgba(24,14,8,.8)'; rrect(x - 3, y - 3, w + 6, h + 6, 6); ctx.fill(); ctx.fillStyle = '#3ad06a'; ctx.fillRect(x, Y(g1), w, Y(g0) - Y(g1)); ctx.fillStyle = '#ffe060'; ctx.fillRect(x, Y(Math.min(1.2, p.meter)), w, Y(0) - Y(Math.min(1.2, p.meter))); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(x, Y(g1), w, Y(g0) - Y(g1)); }
  // the stick
  const s2 = ui.stick; if (s2) { ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.arc(s2.x0, s2.y0, 56 * k, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 2; ctx.stroke(); const dx = s2.x - s2.x0, dy = s2.y - s2.y0, d = Math.hypot(dx, dy), m = Math.min(1, 56 * k / (d || 1)); ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.arc(s2.x0 + dx * m, s2.y0 + dy * m, 24 * k, 0, TAU); ctx.fill(); }
  else { ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(90 * k, H - 90 * k, 56 * k, 0, TAU); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillText('MOVE', 90 * k, H - 90 * k); }
  // the buttons: what they do now (with the ball / without it)
  const att = haveBall(G) && b.own === p, btn = (o, label, sub, col, on) => { ctx.fillStyle = on ? col : 'rgba(24,14,8,.55)'; ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, TAU); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = on ? '#1a0e06' : '#fff'; ctx.textAlign = 'center'; ctx.font = `400 ${Math.round(15 * k)}px ${TF}`; ctx.fillText(label, o.x, o.y - (sub ? 5 * k : 0)); if (sub) { ctx.font = `700 ${Math.round(9 * k)}px ${BC}`; ctx.fillText(sub, o.x, o.y + 12 * k); } };
  btn(L.pass, att ? 'PASS' : 'SWITCH', att ? 'DRAG TO AIM' : '', '#9ad8ff', !!ui.btn.pass);
  if (ui.aim && ui.btn.pass) { ctx.strokeStyle = '#7af0ff'; ctx.lineWidth = 4 * k; ctx.beginPath(); ctx.moveTo(L.pass.x, L.pass.y); ctx.lineTo(L.pass.x + ui.aim.sx * 60 * k, L.pass.y + ui.aim.sy * 60 * k); ctx.stroke(); }
  btn(L.shoot, att ? (dHoop(p, 0) < 1.9 ? 'LAYUP' : 'SHOOT') : 'STEAL', att ? (dHoop(p, 0) < 1.9 ? '' : 'HOLD') : '', '#ffb070', !!ui.btn.shoot || p.holding);
  if (p.off > 0) { ctx.strokeStyle = '#ff7a6a'; ctx.lineWidth = 6 * k; ctx.beginPath(); ctx.arc(L.shoot.x, L.shoot.y, L.shoot.r + 6 * k, -Math.PI / 2, -Math.PI / 2 + TAU * p.off / 0.9); ctx.stroke(); }
  { const sx = 26 * k, sy = H - 26 * k; ctx.fillStyle = 'rgba(0,0,0,.35)'; rrect(sx, sy, 70 * k, 7 * k, 3 * k); ctx.fill(); ctx.fillStyle = p.st >= 0.25 ? '#9be3b5' : '#ff7a6a'; rrect(sx, sy, 70 * k * clamp(p.st, 0, 1), 7 * k, 3 * k); ctx.fill(); }      // breath left (no SPRINT button since 22 Nov 2026: a full push of the stick sprints)
  if (ui.banner) { const B = ui.banner; ctx.textAlign = 'center'; ctx.font = `400 ${Math.round(40 * k)}px ${TF}`; ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(24,14,8,.75)'; ctx.strokeText(B.txt, W / 2, H * 0.3); ctx.fillStyle = B.col || '#fff'; ctx.fillText(B.txt, W / 2, H * 0.3); } }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of String(t).split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { coachPanel(G); }
