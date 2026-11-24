// ===================== THE VIEW: Penalty Kings in 3D (three.js through tools/world3d.js) =====================
// A floodlit stadium: a striped pitch with its white lines, the goal and its net, advertising boards, four packed stands that
// jump when a goal goes in, floodlight towers. Your kick is seen from behind your striker, the goal ahead; their kick from
// behind your keeper's goal, the kicker running in at you. The camera glides from one to the other.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [];
let hint = null, V3 = null;
const ui = { snap: true };
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 2.8) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function fxStep(dt) {
  FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.5) TXT.shift();
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; }
}
const ME = { shirt: 0xf2c14b, shorts: 0x1a2a5a, socks: 0xf2c14b }, MYKEEP = { shirt: 0x3ae07a, shorts: 0x1a1a1a, socks: 0x3ae07a }, SKIN = [0xf1c8a8, 0xd9a07a, 0xa8714a, 0x7a4a2a, 0x5a3a22], HAIRC = [0x1a1a1a, 0x3a2414, 0x6a3a1a, 0xc8a060];
const NUMTEX = {};
function numTex(n, col) { const key = n + ':' + col; if (NUMTEX[key]) return NUMTEX[key]; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); x.fillStyle = col; x.font = 'bold 44px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(n), 32, 34); return (NUMTEX[key] = new THREE.CanvasTexture(c)); }
// a footballer: root on the ground; body pivots at the hips (turn for the cue, tilt for a dive)
function playerModel(o) {
  const T = THREE, g = new T.Group(), M = (c, r = 0.75) => new T.MeshStandardMaterial({ color: c, roughness: r });
  const body = new T.Group(); body.position.y = 0.95; g.add(body);
  const torso = new T.Mesh(new T.CapsuleGeometry(0.2, 0.42, 4, 10), M(o.shirt)); torso.position.y = 0.36; torso.scale.set(1.15, 1, 0.8); body.add(torso);
  const shorts = new T.Mesh(new T.CylinderGeometry(0.2, 0.22, 0.24, 10), M(o.shorts)); shorts.position.y = 0.02; body.add(shorts);
  const head = new T.Mesh(new T.SphereGeometry(0.15, 14, 12), M(o.skin)); head.position.y = 0.86; body.add(head);
  const hair = new T.Mesh(new T.SphereGeometry(0.158, 14, 8, 0, TAU, 0, Math.PI * 0.5), M(o.hair, 0.9)); hair.position.y = 0.88; body.add(hair);
  const num = new T.Mesh(new T.PlaneGeometry(0.26, 0.26), new T.MeshBasicMaterial({ map: numTex(o.no || 9, o.numCol || '#ffffff'), transparent: true })); num.position.set(0, 0.42, -0.165); num.rotation.y = Math.PI; body.add(num);
  const limb = (r, l, c, x, y, sock) => { const p = new T.Group(); p.position.set(x, y, 0); const m = new T.Mesh(new T.CapsuleGeometry(r, l, 3, 8), M(c)); m.position.y = -l / 2 - r; p.add(m);
    if (sock) { const s = new T.Mesh(new T.CylinderGeometry(r * 1.08, r * 1.0, l * 0.5, 8), M(sock)); s.position.y = -l * 0.72 - r; p.add(s); const boot = new T.Mesh(new T.BoxGeometry(r * 1.8, r * 1.1, r * 3.2), M(0x111111, 0.5)); boot.position.set(0, -l - r * 1.6, r * 0.8); p.add(boot); }
    if (o.gloves && !sock) { const gl = new T.Mesh(new T.SphereGeometry(r * 1.7, 8, 6), M(0xf4f4f4, 0.6)); gl.position.y = -l - r * 1.6; p.add(gl); }
    body.add(p); return p; };
  const arms = [limb(0.06, 0.5, o.gloves ? o.shirt : o.skin, -0.28, 0.58), limb(0.06, 0.5, o.gloves ? o.shirt : o.skin, 0.28, 0.58)];
  const legs = [limb(0.085, 0.66, o.skin, -0.11, 0, o.socks), limb(0.085, 0.66, o.skin, 0.11, 0, o.socks)];
  g.traverse(q => { if (q.isMesh && q !== num) q.castShadow = true; });
  g.userData = { body, arms, legs, torso, mats: [torso.material, shorts.material] }; return g;
}
function dressModel(m, o) { const u = m.userData; u.mats[0].color.setHex(o.shirt); u.mats[1].color.setHex(o.shorts); }
function pose(m, o) {      // o: run (phase of the stride, or null), kick (0-1), dive (-1/0/1 and u), turn, tilt, arms up
  const u = m.userData, s = o.run != null ? Math.sin(o.run) : 0, amp = o.run != null ? 0.7 : 0;
  u.legs[0].rotation.x = s * amp; u.legs[1].rotation.x = -s * amp; u.arms[0].rotation.x = -s * amp * 0.8; u.arms[1].rotation.x = s * amp * 0.8;
  if (o.kick != null) { const k = o.kick; u.legs[1].rotation.x = k < 0.5 ? lerp(0, 0.9, k * 2) : lerp(0.9, -1.4, (k - 0.5) * 2); u.legs[0].rotation.x = -0.15; u.arms[0].rotation.z = -0.6 * Math.sin(k * Math.PI); }
  u.arms[0].rotation.z = o.armsUp != null ? -o.armsUp * 2.6 : (o.kick != null ? u.arms[0].rotation.z : -0.12); u.arms[1].rotation.z = o.armsUp != null ? o.armsUp * 2.6 : 0.12;
  u.body.rotation.set(o.lean || 0, o.turn || 0, o.tilt || 0); if (o.crouch != null) { u.body.position.y = 0.95 - o.crouch * 0.18; u.legs[0].rotation.x -= o.crouch * 0.4; u.legs[1].rotation.x -= o.crouch * 0.4; } else u.body.position.y = 0.95;
}
function stripeTex() { const c = document.createElement('canvas'); c.width = 64; c.height = 512; const x = c.getContext('2d'); for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#3f8a34' : '#4a9a3c'; x.fillRect(0, i * 64, 64, 64); }
  const d = x.getImageData(0, 0, 64, 512); for (let i = 0; i < d.data.length; i += 4) { const n = (Math.random() - 0.5) * 18; d.data[i] += n; d.data[i + 1] += n; d.data[i + 2] += n * 0.5; } x.putImageData(d, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t; }
function boardTex() { const c = document.createElement('canvas'); c.width = 1024; c.height = 64; const x = c.getContext('2d'); const cols = ['#e8302a', '#1a4ad8', '#f2c14b', '#1a1a1a'];
  for (let i = 0; i < 4; i++) { x.fillStyle = cols[i]; x.fillRect(i * 256, 0, 256, 64); x.fillStyle = i === 2 ? '#1a1a1a' : '#ffffff'; x.font = 'bold 34px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(['PENALTY KINGS', 'GAME FEED', 'GOAL!', 'SUPER BOOTS'][i], i * 256 + 128, 34); }
  const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t; }
function buildWorld() {
  if (V3) return V3; const T = THREE; if (!W3 || !W3.init({ canvas: $('gl'), fov: 55, far: 1500, near: 0.1 })) { V3 = { none: true }; return V3; }
  const S = W3.scene, R0 = W3.rng(31), M = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.85 }, o));
  // the pitch and its lines
  const st = stripeTex(); st.repeat.set(1, 3.75); const pitch = new T.Mesh(new T.PlaneGeometry(90, 150), M(0xdce8d4, { map: st, roughness: 0.95 })); pitch.rotation.x = -Math.PI / 2; pitch.position.set(0, 0, 50); pitch.receiveShadow = true; S.add(pitch);
  const lineM = new T.MeshBasicMaterial({ color: 0xf4f4ee, transparent: true, opacity: 0.85 });
  const line = (x0, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0), m = new T.Mesh(new T.PlaneGeometry(L, 0.12), lineM); m.rotation.x = -Math.PI / 2; m.rotation.z = -Math.atan2(z1 - z0, x1 - x0); m.position.set((x0 + x1) / 2, 0.012, (z0 + z1) / 2); S.add(m); };
  line(-34, 0, 34, 0); line(-9.16, 5.5, 9.16, 5.5); line(-9.16, 0, -9.16, 5.5); line(9.16, 0, 9.16, 5.5); line(-20.16, 16.5, 20.16, 16.5); line(-20.16, 0, -20.16, 16.5); line(20.16, 0, 20.16, 16.5); line(-34, 0, -34, 105); line(34, 0, 34, 105); line(-34, 52.5, 34, 52.5);
  const spot = new T.Mesh(new T.CircleGeometry(0.13, 16), lineM); spot.rotation.x = -Math.PI / 2; spot.position.set(0, 0.013, SPOT); S.add(spot);
  const arc = new T.Mesh(new T.RingGeometry(9.09, 9.21, 48, 1, Math.PI * 0.2, Math.PI * 0.6), lineM); arc.rotation.x = -Math.PI / 2; arc.position.set(0, 0.012, SPOT); S.add(arc);
  const cc = new T.Mesh(new T.RingGeometry(9.09, 9.21, 64), lineM); cc.rotation.x = -Math.PI / 2; cc.position.set(0, 0.012, 52.5); S.add(cc);
  // the goal: posts, bar, the net
  const postM = M(0xffffff, { roughness: 0.35 }); for (const x of [-GW, GW]) { const p = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, GH, 10), postM); p.position.set(x, GH / 2, 0); p.castShadow = true; S.add(p); }
  const bar = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, GW * 2 + 0.12, 10), postM); bar.rotation.z = Math.PI / 2; bar.position.set(0, GH, 0); bar.castShadow = true; S.add(bar);
  const net = new T.Group(); S.add(net); { const pts = [], D = 2.0, gap = 0.16;
    for (let x = -GW; x <= GW + 0.01; x += gap) { pts.push(x, 0, -D, x, GH - 0.3, -D); pts.push(x, GH - 0.3, -D, x, GH, 0); }
    for (let y = 0; y <= GH - 0.3; y += gap) pts.push(-GW, y, -D, GW, y, -D);
    for (let z = 0; z >= -D - 0.01; z -= gap) { const y = GH - 0.3 * (-z / D); pts.push(-GW, y, z, GW, y, z); for (const x of [-GW, GW]) pts.push(x, 0, z, x, y, z); }
    for (let y = 0; y <= GH; y += gap) for (const x of [-GW, GW]) pts.push(x, y, 0, x, Math.min(y, GH - 0.3), -D);
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pts, 3)); net.add(new T.LineSegments(geo, new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 }))); }
  // advertising boards and the stands, packed
  const bt = boardTex(); for (const [x, z, ry, w] of [[0, -4.5, 0, 60], [-36, 50, Math.PI / 2, 110], [36, 50, -Math.PI / 2, 110]]) { const t2 = bt.clone(); t2.needsUpdate = true; t2.repeat.set(w / 12, 1); const b = new T.Mesh(new T.BoxGeometry(w, 0.9, 0.12), [M(0x222222), M(0x222222), M(0x222222), M(0x222222), new T.MeshStandardMaterial({ map: t2, emissive: 0xffffff, emissiveMap: t2, emissiveIntensity: 0.35 }), M(0x222222)]); b.position.set(x, 0.45, z); b.rotation.y = ry; S.add(b); }
  const standM = M(0x3a3e48, { roughness: 0.9 }), crowdCols = [0xe8302a, 0xf2c14b, 0xffffff, 0x1a4ad8, 0x2a2a2a, 0xe8e0d0, 0x3ae07a], seats = [];
  const stand = (cx, cz, ry, len, rows) => { const g = new T.Group(); g.position.set(cx, 0, cz); g.rotation.y = ry; S.add(g);
    for (let r = 0; r < rows; r++) { const step = new T.Mesh(new T.BoxGeometry(len, 0.55, 0.9), standM); step.position.set(0, 1.0 + r * 0.55, -r * 0.9); g.add(step); for (let x = -len / 2 + 0.4; x < len / 2; x += 0.55 + R0() * 0.15) if (R0() < 0.93) seats.push({ g, x, y: 1.3 + r * 0.55 + 0.3, z: -r * 0.9 }); }
    const roof = new T.Mesh(new T.BoxGeometry(len, 0.3, rows * 0.9 + 3), M(0x8a8e98, { metalness: 0.4 })); roof.position.set(0, 2 + rows * 0.55 + 3.5, -rows * 0.45); g.add(roof); return g; };
  const stands = [stand(0, -7, 0, 70, 22), stand(-40, 50, Math.PI / 2, 110, 20), stand(40, 50, -Math.PI / 2, 110, 20), stand(0, 112, Math.PI, 70, 22)];
  const crowdG = []; for (let part = 0; part < 3; part++) { const mine = seats.filter((s, i) => i % 3 === part), im = new T.InstancedMesh(new T.BoxGeometry(0.42, 0.62, 0.32), M(0xffffff, { roughness: 0.9 }), mine.length), d = new T.Object3D(), col = new T.Color(); const grp = new T.Group(); S.add(grp);
    mine.forEach((s, i) => { s.g.updateMatrixWorld(); d.position.set(s.x, s.y, s.z); d.position.applyMatrix4(s.g.matrixWorld); d.rotation.set(0, s.g.rotation.y, 0); d.updateMatrix(); im.setMatrixAt(i, d.matrix); im.setColorAt(i, col.setHex(crowdCols[(R0() * crowdCols.length) | 0])); });
    im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; grp.add(im); crowdG.push(grp); }
  // floodlights
  const glowT = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new T.CanvasTexture(c); })();
  const lamps = []; for (const [x, z] of [[-42, -10], [42, -10], [-42, 112], [42, 112]]) { const tw = new T.Mesh(new T.CylinderGeometry(0.4, 0.7, 34, 8), M(0x6a6e78, { metalness: 0.5 })); tw.position.set(x, 17, z); S.add(tw); const panel = new T.Mesh(new T.BoxGeometry(7, 4, 0.6), M(0xdde4ee, { emissive: 0xffffff, emissiveIntensity: 0 })); panel.position.set(x, 35, z); panel.lookAt(0, 0, 50); S.add(panel);
    const gl = new T.Sprite(new T.SpriteMaterial({ map: glowT, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0, fog: false })); gl.scale.set(26, 26, 1); gl.position.set(x, 35, z); S.add(gl); lamps.push({ panel, gl }); }
  const flood = new T.DirectionalLight(0xffffff, 0); flood.position.set(10, 40, 30); flood.target.position.set(0, 0, 6); S.add(flood, flood.target);
  const flood2 = new T.DirectionalLight(0xe8f0ff, 0); flood2.position.set(-20, 35, -10); flood2.target.position.set(0, 0, 8); S.add(flood2, flood2.target);
  // the players and the ball
  const striker = playerModel(Object.assign({ skin: SKIN[1], hair: HAIRC[0], no: 10, numCol: '#1a2a5a' }, ME)); S.add(striker);
  const theirKeeper = playerModel({ shirt: 0xe86ad0, shorts: 0x1a1a1a, socks: 0xe86ad0, skin: SKIN[2], hair: HAIRC[1], gloves: true, no: 1 }); S.add(theirKeeper);
  const myKeeper = playerModel(Object.assign({ skin: SKIN[0], hair: HAIRC[2], gloves: true, no: 1 }, MYKEEP)); S.add(myKeeper);
  const kicker = playerModel({ shirt: 0xd8302a, shorts: 0xffffff, socks: 0xd8302a, skin: SKIN[3], hair: HAIRC[0], no: 9 }); S.add(kicker);
  const ballC = document.createElement('canvas'); ballC.width = 128; ballC.height = 64; { const x = ballC.getContext('2d'); x.fillStyle = '#fafafa'; x.fillRect(0, 0, 128, 64); x.fillStyle = '#1a1a1a'; for (let i = 0; i < 10; i++) { x.beginPath(); const cx = (i % 5) * 26 + (i > 4 ? 13 : 0) + 6, cy = i > 4 ? 46 : 18; for (let j = 0; j < 5; j++) { const a = j / 5 * TAU; x.lineTo(cx + Math.cos(a) * 7, cy + Math.sin(a) * 7); } x.fill(); } }
  const ballT = new T.CanvasTexture(ballC); ballT.colorSpace = T.SRGBColorSpace; const ball = new T.Mesh(new T.SphereGeometry(0.11, 20, 14), new T.MeshStandardMaterial({ map: ballT, roughness: 0.45 })); ball.castShadow = true; S.add(ball);
  const ray = new T.Raycaster(), plane = new T.Plane(new T.Vector3(0, 0, 1), 0), hitV = new T.Vector3(), ndc = new T.Vector2();
  V3 = { T, S, net, crowdG, lamps, flood, flood2, striker, theirKeeper, myKeeper, kicker, ball, ray, plane, hitV, ndc, glowT, sky: null, team: null };
  W3.setQuality(stepN); return V3;
}
// ---------- the cameras ----------
const SV = new (window.THREE ? THREE.Vector3 : Object)();
function scr(x, y, z) { if (!V3 || V3.none) return { x: W / 2 + x * 40, y: H * 0.3 - y * 40 + z * 10, front: true }; SV.set(x, y, z); return W3.screen(SV); }
const CAM = { side: null, blend: 1, from: null, dS: 18, key: '' };
function camFor(side) { if (side === 'S') return { p: [0.7, 2.0, CAM.dS], l: [0, 1.1, 0] }; const fx = V3 && V3.myKeeper ? V3.myKeeper.position.x * 0.6 : 0; return { p: [fx * 0.5, 2.2, -6.4], l: [fx, 1.3, 11] }; }
function fitCam() {      // the goal and a little round it fill the width of the screen
  const cam = W3.cam, asp = innerWidth / innerHeight, key = asp.toFixed(3); if (CAM.key === key) return; CAM.key = key; cam.fov = CAM.fov = asp < 0.75 ? 55 : 42; cam.aspect = asp; cam.updateProjectionMatrix();
  const th = Math.tan(cam.fov * Math.PI / 360) * asp; CAM.dS = clamp((GW + 0.9) / th, 11.5, 40);
}
function placeCam(g, dt) {
  const cam = W3.cam; fitCam(); const side = g.side; if (CAM.side !== side) { CAM.from = CAM.cur ? CAM.cur.map(v => v.slice()) : null; CAM.side = side; CAM.blend = ui.snap || !CAM.from ? 1 : 0; ui.snap = false; }
  CAM.blend = Math.min(1, CAM.blend + dt / 0.7); const to = camFor(side), u = easeOut(CAM.blend);
  const P = CAM.from ? to.p.map((v, i) => lerp(CAM.from[0][i], v, u)) : to.p, L = CAM.from ? to.l.map((v, i) => lerp(CAM.from[1][i], v, u)) : to.l; CAM.cur = [P, L];
  const fv = side === 'S' ? CAM.fov : CAM.fov * 0.84, f0 = side === 'S' ? CAM.fov * 0.84 : CAM.fov, fov = CAM.from ? lerp(f0, fv, u) : fv; if (Math.abs(cam.fov - fov) > 0.01) { cam.fov = fov; cam.updateProjectionMatrix(); }
  cam.position.set(P[0], P[1], P[2]); if (FX.shake > 0) { cam.position.x += (Math.random() - 0.5) * FX.shake * 0.012; cam.position.y += (Math.random() - 0.5) * FX.shake * 0.008; } cam.lookAt(L[0], L[1], L[2]); cam.updateMatrixWorld();
}
// where on the goal (the plane of the goal line) a tap lands: x across, y up, in metres
function goalAt(sx, sy) {
  if (!V3 || V3.none) { const u = sx / W, v = sy / H; return { x: (u - 0.5) * 2 * (GW + 0.9), y: (0.36 - v) / 0.2 * GH }; }
  const V = V3; V.ndc.set(sx / innerWidth * 2 - 1, -(sy / innerHeight) * 2 + 1); V.ray.setFromCamera(V.ndc, W3.cam); if (!V.ray.ray.intersectPlane(V.plane, V.hitV)) return null; return { x: V.hitV.x, y: V.hitV.y };
}
// ---------- where the ball is ----------
function ballAt(g) {
  const sp = [0, 0.11, SPOT];
  if (g.side === 'S') { const S = g.S; if (!S || g.ph === 'aim' || g.ph === 'meter' || (g.ph === 'kickS' && g.pt < S.strike)) return { p: sp, spin: 0 };
    const t = g.ph === 'kickS' ? g.pt - S.strike : S.T + g.pt; return flight(S.x, S.y, S.T, t, g.ph === 'resS' || t >= S.T ? S.out : null); }
  const K = g.K; if (!K || g.ph === 'spot' || g.ph === 'run' || (g.ph === 'kickK' && g.pt < 0.22)) return { p: sp, spin: 0 };
  const t = g.ph === 'kickK' ? g.pt - 0.22 : K.T + g.pt; return flight(K.x, K.y, K.T, t, g.ph === 'resK' || t >= K.T ? (K.out === 'conceded' ? 'goal' : K.out === 'save' ? 'saved' : K.miss ? (K.y > GH ? 'over' : 'wide') : 'wide') : null);
}
function flight(x, y, T, t, out) {
  if (t <= T) { const u = t / T; return { p: [x * u, 0.11 + (y - 0.11) * u + Math.sin(u * Math.PI) * 0.35 * T, SPOT * (1 - u)], spin: 1 }; }
  const a = t - T, e = Math.min(1, a / 0.6);
  if (out === 'goal') { const z = -1.85 * easeOut(Math.min(1, a / 0.35)); return { p: [x * 1.02, Math.max(0.11, y - a * a * 4.9 - (a > 0.35 ? 0 : 0)), z], spin: 0.3 }; }
  if (out === 'saved') { const d = Math.min(a, 1.4); return { p: [x * (1 + d * 0.6), Math.max(0.11, y + d * 2.2 - d * d * 4.9), d * 6], spin: 1 }; }
  if (out === 'post') { const d = Math.min(a, 1.4); return { p: [x - Math.sign(x) * d * 2, Math.max(0.11, y + d * 1.5 - d * d * 4.9), d * 7], spin: 1 }; }
  const d = Math.min(a, 1.2); return { p: [x * (1 + d * 0.5), y + d * 1.0, -d * 9], spin: 1 };
}
// ---------- events ----------
const MSG = { wide: 'WIDE!', over: 'OVER THE BAR!', post: 'OFF THE POST!' };
function onEvent(G, e) {
  const cx = W / 2, cy = H * 0.42;
  switch (e.k) {
    case 'match': say(`${stageOf(G.N).toUpperCase()}`, cx, H * 0.58, '#ffe08a', 24); say(`KINGS v ${G.team.name.toUpperCase()}`, cx, H * 0.63, '#ffffff', 20); sfx.whistle(); break;
    case 'shotup': if (G.N <= 3 || G.lesson) tip('aim' + (G.lesson ? G.lesson.i : ''), 'Tap the goal where you want to shoot', 2.4); break;
    case 'aim': sfx.click(); tip('meter', 'Now tap again when the needle is in the GREEN', 2.4); break;
    case 'run': break;
    case 'strike': sfx.kick(e.q === 'g' ? 1 : 0.6); vibe(HAP.light); break;
    case 'goal': sfx.net(); sfx.roar(e.top ? 1.4 : 1); FX.shake = e.top ? 5 : 3; FX.flash = e.top ? 0.8 : 0.4; vibe(e.top ? HAP.best : HAP.sharp); say(e.top ? 'TOP BINS!' : 'GOAL!', cx, cy, '#ffe08a', e.top ? 44 : 40); if (e.top) say('+1 🪙', cx, cy + 46 * k, '#ffe08a', 18); break;
    case 'saved': sfx.glove(); sfx.groan(); FX.red = 0.5; vibe(HAP.thud); say('SAVED!', cx, cy, '#ffb4a8', 36); tip('lean', 'Watch the keeper lean before you aim: shoot the other way', 3); break;
    case 'wide': case 'over': case 'post': if (e.k === 'post') sfx.post(); sfx.groan(); FX.red = 0.4; vibe(HAP.thud); say(MSG[e.k], cx, cy, '#ffb4a8', 32); if (e.k !== 'post') tip('green', 'Stop the needle in the green, or it flies off', 2.8); break;
    case 'slow': say('TOO SLOW!', cx, cy - 40 * k, '#ffb4a8', 24); break;
    case 'retake': say("CAPTAIN'S RETAKE!", cx, cy + 50 * k, '#9be3b5', 24); sfx.whistle(); break;
    case 'spot': if (G.lesson || G.N <= 3) tip('save' + (G.lesson ? G.lesson.i : ''), 'Wait for him to plant his foot, then tap a side to dive', 2.6); break;
    case 'runup': sfx.tick(); break;
    case 'plant': break;
    case 'dive': sfx.dive(); if (e.early) tip('early', 'Too early! He saw you go. Wait for the plant.', 2.8); break;
    case 'kstrike': sfx.kick(0.9); break;
    case 'save': sfx.glove(); sfx.roar(1.2); FX.shake = 5; FX.flash = 0.6; vibe(HAP.best); say(e.top ? 'WORLD-CLASS SAVE!' : 'WHAT A SAVE!', cx, cy, '#9be3b5', 36); say('+2 🪙', cx, cy + 44 * k, '#ffe08a', 18); break;
    case 'conceded': sfx.net(); sfx.groan(0.6); FX.red = 0.4; say(e.switched ? 'TOO EARLY: HE SAW YOU GO' : e.late ? 'TOO LATE!' : e.top ? 'TOP CORNER: NO CHANCE' : 'THEY SCORE', cx, cy, '#ffd0c0', e.switched || e.late ? 26 : 28); break;
    case 'kmiss': sfx.roar(0.8); say('HE MISSED!', cx, cy, '#9be3b5', 34); vibe(HAP.light); break;
    case 'sd': sfx.whistle(); say('SUDDEN DEATH', cx, H * 0.5, '#ffe08a', 32); break;
    case 'lessonnext': if (e.first) hint = null; say(e.first ? 'FIRST, A LESSON' : 'NEXT LESSON', cx, H * 0.55, '#ffe08a', 26); sfx.ding(); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, cx, H * 0.55, '#9be3b5', 26); sfx.coin(e.n); break;
    case 'lessonmiss': coachMiss(); break;
    case 'lessondone': say('NOW THE REAL THING!', cx, H * 0.55, '#ffe08a', 26); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); sfx.roar(1.5); vibe(HAP.best); say(stageOf(G.N) === 'Final' ? 'CUP WINNERS!' : 'THROUGH!', cx, H * 0.3, '#ffe08a', 36); break;
    case 'lost': sfx.lose(); say('KNOCKED OUT', cx, H * 0.3, '#ffb4a8', 32); break;
  }
}
// ---------- the players, frame by frame ----------
function animate(g, t) {
  const V = V3, S = g.S, K = g.K, shoot = g.side === 'S';
  V.striker.visible = shoot; V.theirKeeper.visible = shoot; V.myKeeper.visible = !shoot; V.kicker.visible = !shoot;
  if (V.team !== g.team) { V.team = g.team; dressModel(V.kicker, { shirt: g.team.c, shorts: g.team.c2 }); }
  if (shoot && S) {
    // your striker: waits behind the ball, runs in and strikes
    const st = V.striker, run = g.ph === 'kickS' ? clamp(g.pt / S.strike, 0, 1) : g.ph === 'resS' ? 1 : 0;
    st.position.set(lerp(-1.0, -0.32, run), 0, lerp(12.9, 11.3, run)); st.rotation.y = Math.PI - 0.45 * (1 - run) - 0.2;
    if (g.ph === 'kickS' || g.ph === 'resS') { const kick = g.ph === 'resS' ? 1 : clamp((g.pt - S.strike * 0.55) / 0.32, 0, 1); pose(st, { run: run < 0.6 ? g.pt * 18 : null, kick: run >= 0.6 ? kick : null }); }
    else pose(st, { lean: 0.08 + Math.sin(t * 2) * 0.02 });
    // their keeper: bounces on his line, leans to his side, dives at the strike
    const kp = V.theirKeeper, leanU = g.ph === 'aim' ? clamp((g.pt - S.leanAt) / 0.35, 0, 1) : 1;
    const lean = S.lean * leanU, dv = g.ph === 'kickS' ? clamp((g.pt - S.strike + 0.05) / 0.35, 0, 1) : g.ph === 'resS' ? 1 : 0;
    kp.rotation.y = 0; const bob = Math.sin(t * 6) * 0.05 * (1 - dv);
    if (dv > 0) { const d = S.dive; if (d) { kp.position.set(lean * 0.45 + d * 1.5 * easeOut(dv), Math.sin(dv * Math.PI) * 0.55, 0.45); pose(kp, { tilt: -d * 1.35 * easeOut(dv), armsUp: 0.9 }); } else { kp.position.set(lean * 0.45, Math.sin(dv * Math.PI) * 0.45, 0.45); pose(kp, { armsUp: 0.95 }); } }
    else { kp.position.set(lean * 0.45 + Math.sin(t * 2.3) * 0.08 * (1 - Math.abs(S.lean) * leanU), bob * 0.3, 0.45); pose(kp, { tilt: -lean * 0.3, crouch: 0.6 + bob, armsUp: 0.25 }); }
  }
  if (!shoot && K) {
    // their kicker: steps back, runs in (a stutter at higher levels), plants, turns his body (the cue), strikes
    const kc = V.kicker, sx = 1.4, sz = 14.6, px = 0.42, pz = 11.45;
    let u = 0, running = false; if (g.ph === 'run') { let tt = g.pt; if (K.stut) { const s0 = K.stutAt; tt = g.pt < s0 ? g.pt : g.pt < s0 + K.stut ? s0 : g.pt - K.stut; } u = clamp(tt / 1.0, 0, 1); running = !(K.stut && g.pt > K.stutAt && g.pt < K.stutAt + K.stut); }
    else if (g.ph === 'kickK' || g.ph === 'resK') u = 1;
    kc.position.set(lerp(sx, px, u), 0, lerp(sz, pz, u)); const cueU = g.ph === 'kickK' ? clamp(g.pt / 0.12, 0, 1) : g.ph === 'resK' ? 1 : 0;
    kc.rotation.y = Math.PI - 0.3 * (1 - u) - K.cue * 0.6 * cueU;
    if (g.ph === 'kickK' || g.ph === 'resK') pose(kc, { kick: g.ph === 'resK' ? 1 : clamp((g.pt - 0.05) / 0.3, 0, 1), turn: -K.cue * 0.35 * cueU, lean: -0.1 });
    else if (g.ph === 'run') pose(kc, { run: running ? g.pt * 14 : null, lean: running ? 0.15 : 0, crouch: running ? null : 0.2 + Math.sin(g.pt * 10) * 0.05 });
    else pose(kc, { lean: 0.05 });
    // your keeper: crouched on the line; dives where you tapped
    const mk = V.myKeeper; mk.rotation.y = 0;
    if (K.dive != null) { const du = clamp((g.t - K.diveG) / 0.32, 0, 1), d = K.dive;
      if (d) { mk.position.set(d * 1.25 * easeOut(du), Math.sin(du * Math.PI) * 0.55, 0.45); pose(mk, { tilt: -d * 1.35 * easeOut(du), armsUp: 0.9 }); } else { mk.position.set(0, Math.sin(du * Math.PI) * 0.45, 0.45); pose(mk, { armsUp: 0.95 }); } }
    else { const bob = Math.sin(t * 6) * 0.05; mk.position.set(Math.sin(t * 2) * 0.06, 0, 0.45); pose(mk, { crouch: 0.6 + bob, armsUp: 0.25 }); }
  }
  const b = ballAt(g); V.ball.position.set(b.p[0], b.p[1], b.p[2]); V.ball.rotation.x -= b.spin * 0.4;
  // the net bulges when it is hit; the crowd jumps for a goal (yours) or a save
  const hitNet = (g.ph === 'resS' && S && S.out === 'goal') || (g.ph === 'resK' && K && K.out === 'conceded'); V.net.position.z = hitNet ? -Math.sin(Math.min(1, g.pt / 0.4) * Math.PI) * 0.25 : 0;
  const joy = (g.ph === 'resS' && S && S.out === 'goal') || (g.ph === 'resK' && K && (K.out === 'save' || K.out === 'kmiss')) || g.over === 'won';
  V.crowdG.forEach((c, i) => c.position.y = joy ? Math.abs(Math.sin(t * 9 + i * 2.1)) * 0.35 : Math.abs(Math.sin(t * 2 + i)) * 0.03);
}
let IG = null; function idleG() { if (!IG || IG.over) { IG = newGame(Math.max(4, store.get('level', 1) | 0), { seed: (Math.random() * 1e6) | 0 }); IG.mem = {}; } honest(IG, { react: 0.3, acc: 0.92 }, IG.mem); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#10141f'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D stadium.', W / 2, H / 2); return; }
  const g = G || idleG(), t = now;
  if (V.sky !== g.weather) { V.sky = g.weather; W3.setSky(g.weather, { azim: 200 }); W3.scene.environmentIntensity = g.weather === 'night' || g.weather === 'dusk' ? 0.6 : 0.25; const lit = g.weather === 'night' || g.weather === 'dusk' || g.weather === 'rain' || g.weather === 'overcast' || g.weather === 'sunset'; V.flood.intensity = g.weather === 'night' ? 1.3 : g.weather === 'dusk' ? 1.0 : g.weather === 'rain' ? 0.3 : g.weather === 'sunset' ? 0.5 : 0; V.flood2.intensity = V.flood.intensity * 0.6;
    V.lamps.forEach(L => { L.panel.material.emissiveIntensity = lit ? 2 : 0.1; L.gl.material.opacity = g.weather === 'night' ? 0.9 : lit ? 0.5 : 0; }); }
  placeCam(g, dt); animate(g, t); V.net.visible = g.side === 'S' || CAM.blend < 0.6;
  W3.setFocus(0, 1, g.side === 'S' ? 4 : 8, 14); W3.render(dt);
  if (G) hud(G, t);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 1.1 ? 1 : 1 - (t2.t - 1.1) / 0.4; ctx.globalAlpha = Math.max(0, al); const sc = t2.t < 0.12 ? 1.4 - t2.t / 0.12 * 0.4 : 1; ctx.font = `${Math.round(t2.size * k * sc)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 18); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 18); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30;
    ctx.fillStyle = 'rgba(10,16,30,.8)'; rrect(W / 2 - w / 2, H * 0.68 - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.68 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,40,40,${FX.red * 0.12})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,248,210,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); }
}
// ---------- the 2D layer: scoreboard, the aim, the power bar, the dive zones ----------
function dots(list, x, y, n) { const r = 5 * k; for (let i = 0; i < n; i++) { const v = list[i]; ctx.beginPath(); ctx.arc(x + i * 14 * k, y, r, 0, TAU); ctx.fillStyle = v == null ? 'rgba(255,255,255,.22)' : v ? '#5ee08a' : '#ff5a4a'; ctx.fill(); } }
function hud(G, t) {
  ctx.textBaseline = 'middle'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.5)';
  if (!G.lesson) { const y = 64 * k, a = sum(G.ours), b = sum(G.theirs), w = 230 * k; ctx.fillStyle = 'rgba(8,12,24,.72)'; rrect(W / 2 - w / 2, y - 20 * k, w, 54 * k, 12); ctx.fill();
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = `${Math.round(20 * k)}px ${TF}`; ctx.fillText(`${a} : ${b}`, W / 2, y - 3 * k);
    ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.textAlign = 'right'; ctx.fillStyle = '#f2c14b'; ctx.fillText('KINGS', W / 2 - 34 * k, y - 4 * k); ctx.textAlign = 'left'; ctx.fillStyle = '#' + G.team.c.toString(16).padStart(6, '0'); ctx.fillStyle = G.team.c === 0x26262c ? '#d8b040' : ctx.fillStyle; ctx.fillText(G.team.name.toUpperCase(), W / 2 + 34 * k, y - 4 * k);
    const off = G.sd ? Math.max(0, Math.min(G.ours.length, G.theirs.length) - 4) : 0, n = 5; dots(G.ours.slice(off), W / 2 - 100 * k, y + 20 * k, n); dots(G.theirs.slice(off), W / 2 + 44 * k, y + 20 * k, n);
    ctx.textAlign = 'center'; ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillText(`${cupOf(G.N).toUpperCase()} · ${stageOf(G.N).toUpperCase()}${G.sd ? ' · SUDDEN DEATH' : ''}`, W / 2, y + 44 * k); }
  else lessonPanel(G);
  const lab = G.side === 'S' ? 'YOUR KICK' : 'SAVE IT!', ly = G.lesson ? H - 120 * k : 134 * k; ctx.textAlign = 'center'; ctx.font = `${Math.round(17 * k)}px ${TF}`; ctx.fillStyle = G.side === 'S' ? '#ffe08a' : '#9be3b5'; ctx.strokeText(lab, W / 2, ly); ctx.fillText(lab, W / 2, ly);
  if (G.side === 'S' && G.S) { const S = G.S;
    if (G.ph === 'aim' && (G.N <= 3 || G.lesson)) { ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; ctx.fillStyle = '#fff'; const ty = H * 0.86; ctx.strokeText('TAP THE GOAL WHERE YOU WANT TO SHOOT', W / 2, ty); ctx.fillText('TAP THE GOAL WHERE YOU WANT TO SHOOT', W / 2, ty); }
    if (S.aim && (G.ph === 'meter' || (G.ph === 'kickS' && G.pt < S.strike))) { const p = scr(S.aim.x, S.aim.y, 0), r = 12 * k + Math.sin(t * 8) * 2; ctx.strokeStyle = '#ffe08a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(p.x - r - 5, p.y); ctx.lineTo(p.x + r + 5, p.y); ctx.moveTo(p.x, p.y - r - 5); ctx.lineTo(p.x, p.y + r + 5); ctx.stroke(); }
    if (G.ph === 'meter' || (G.ph === 'kickS' && G.pt < 0.6)) meter(G, S); }
  if (G.side === 'K' && G.K) { const K = G.K;
    if (G.N <= 3 || G.lesson) { const y = H - 44 * k; ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.textAlign = 'center'; [['◀ DIVE', W / 6], ['STAY', W / 2], ['DIVE ▶', W * 5 / 6]].forEach(([s, x]) => { ctx.strokeText(s, x, y); ctx.fillText(s, x, y); });
      ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (const x of [W / 3, W * 2 / 3]) { ctx.moveTo(x, H * 0.62); ctx.lineTo(x, H - 20 * k); } ctx.stroke();
      if (G.ph === 'spot' || G.ph === 'run') { ctx.font = `700 ${Math.round(15 * k)}px ${BC}`; ctx.fillStyle = '#ffe08a'; ctx.strokeText('WAIT FOR THE PLANT...', W / 2, H * 0.58); ctx.fillText('WAIT FOR THE PLANT...', W / 2, H * 0.58); } }
    if (G.ph !== 'resK') { const kk = K.kk, sideTxt = kk.fs > 0 ? 'YOUR LEFT' : 'YOUR RIGHT'; ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; const s2 = `No. ${kk.no} ${kk.name.toUpperCase()}` + (G.cfg.scout ? ` · LIKES ${sideTxt}` : ''); ctx.strokeText(s2, W / 2, ly + 22 * k); ctx.fillText(s2, W / 2, ly + 22 * k); }
    if (G.cfg.arrow && (G.ph === 'kickK') && G.pt < 0.22 + K.T) { const a = scr(0, 0.05, SPOT - 0.3), b = scr(K.cue * 2.2, 0.05, SPOT - 3.2); const al = clamp(G.pt / 0.08, 0, 1); ctx.globalAlpha = 0.85 * al; arrow(a, b, '#ffffff'); ctx.globalAlpha = 1; } }
}
function arrow(a, b, col) { const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L; ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 6 * k; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x - ux * 12 * k, b.y - uy * 12 * k); ctx.stroke(); ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - ux * 18 * k - uy * 11 * k, b.y - uy * 18 * k + ux * 11 * k); ctx.lineTo(b.x - ux * 18 * k + uy * 11 * k, b.y - uy * 18 * k - ux * 11 * k); ctx.closePath(); ctx.fill(); }
function meter(G, S) {
  const x0 = 34, w = W - 68, y = H * 0.84, h = 20 * k, X = v => x0 + v * w;
  ctx.fillStyle = 'rgba(0,0,0,.5)'; rrect(x0 - 6, y - h / 2 - 6, w + 12, h + 12, 10); ctx.fill();
  ctx.fillStyle = '#c8402a'; ctx.fillRect(x0, y - h / 2, w, h);
  ctx.fillStyle = '#f2c14b'; ctx.fillRect(X(S.bc - S.w / 2 - 0.05), y - h / 2, (S.w + 0.1) * w, h);
  ctx.fillStyle = '#4ad86a'; ctx.fillRect(X(S.bc - S.w / 2), y - h / 2, S.w * w, h);
  const nx = X(S.m); ctx.fillStyle = '#fff'; ctx.fillRect(nx - 2.5, y - h / 2 - 8, 5, h + 16); ctx.beginPath(); ctx.moveTo(nx, y - h / 2 - 8); ctx.lineTo(nx - 8, y - h / 2 - 18); ctx.lineTo(nx + 8, y - h / 2 - 18); ctx.closePath(); ctx.fill();
  if (G.N <= 3 || G.lesson) { ctx.textAlign = 'center'; ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 4; ctx.strokeText('TAP WHEN THE NEEDLE IS IN THE GREEN', W / 2, y + h + 6 * k); ctx.fillText('TAP WHEN THE NEEDLE IS IN THE GREEN', W / 2, y + h + 6 * k); }
}
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { coachPanel(G); }
