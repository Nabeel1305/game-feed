// ===================== THE VIEW: Eleven in 3D (three.js through tools/world3d.js) =====================
// A full stadium seen from the main stand, like the television: a striped pitch with every line, two goals with nets, four
// packed stands that jump when you score, floodlights. Twenty-two players run, the ball rolls and flies. The camera follows the
// ball along the pitch. The 2D layer: the score and clock, a little map of the pitch, your stick, and the three buttons.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [];
let hint = null, V3 = null;
const ui = { snap: true, stick: null, flash: {}, cam: null };
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 2.8) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function fxStep(dt) {
  FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.6) TXT.shift();
  for (const q in ui.flash) ui.flash[q] = Math.max(0, ui.flash[q] - dt * 5);
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; }
}
function stripeTex() { const c = document.createElement('canvas'); c.width = 64; c.height = 512; const x = c.getContext('2d'); for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#3f8a34' : '#4a9a3c'; x.fillRect(0, i * 64, 64, 64); }
  const d = x.getImageData(0, 0, 64, 512); for (let i = 0; i < d.data.length; i += 4) { const n = (Math.random() - 0.5) * 18; d.data[i] += n; d.data[i + 1] += n; d.data[i + 2] += n * 0.5; } x.putImageData(d, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t; }
function boardTex() { const c = document.createElement('canvas'); c.width = 1024; c.height = 64; const x = c.getContext('2d'); const cols = ['#e8302a', '#1a4ad8', '#f2c14b', '#1a1a1a'];
  for (let i = 0; i < 4; i++) { x.fillStyle = cols[i]; x.fillRect(i * 256, 0, 256, 64); x.fillStyle = i === 2 ? '#1a1a1a' : '#ffffff'; x.font = 'bold 34px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(['PENALTY KINGS', 'GAME FEED', 'GOAL!', 'SUPER BOOTS'][i], i * 256 + 128, 34); }
  const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t; }
// a footballer, light enough for twenty-two: one material per kit, a body that pivots at the hips
const KITM = {};
function kitMats(shirt, shorts) { const key = shirt + ':' + shorts; if (!KITM[key]) KITM[key] = { shirt: new THREE.MeshStandardMaterial({ color: shirt, roughness: 0.7 }), shorts: new THREE.MeshStandardMaterial({ color: shorts, roughness: 0.7 }) }; return KITM[key]; }
const SKINM = [0xf1c8a8, 0xd9a07a, 0xa8714a, 0x7a4a2a, 0x5a3a22].map(c => null), SKINC = [0xf1c8a8, 0xd9a07a, 0xa8714a, 0x7a4a2a, 0x5a3a22];
function playerModel(km, skin) {
  const T = THREE, g = new T.Group(), body = new T.Group(); body.position.y = 0.95; g.add(body); const sm = SKINM[skin] || (SKINM[skin] = new T.MeshStandardMaterial({ color: SKINC[skin], roughness: 0.75 }));
  const torso = new T.Mesh(new T.CapsuleGeometry(0.21, 0.42, 3, 8), km.shirt); torso.position.y = 0.36; torso.scale.set(1.1, 1, 0.8); body.add(torso);
  const shorts = new T.Mesh(new T.CylinderGeometry(0.21, 0.22, 0.26, 8), km.shorts); shorts.position.y = 0.02; body.add(shorts);
  const head = new T.Mesh(new T.SphereGeometry(0.16, 10, 8), sm); head.position.y = 0.86; body.add(head);
  const limb = (r, l, m, x, y) => { const p = new T.Group(); p.position.set(x, y, 0); const mm = new T.Mesh(new T.CapsuleGeometry(r, l, 2, 6), m); mm.position.y = -l / 2 - r; p.add(mm); body.add(p); return p; };
  const arms = [limb(0.065, 0.48, km.shirt, -0.28, 0.58), limb(0.065, 0.48, km.shirt, 0.28, 0.58)], legs = [limb(0.09, 0.68, km.shorts, -0.11, 0), limb(0.09, 0.68, km.shorts, 0.11, 0)];
  g.userData = { body, arms, legs, km }; return g;
}
function dress(m, km) { const u = m.userData; if (u.km === km) return; u.km = km; m.traverse(o => { if (o.isMesh && (o.material === u.oldShirt || o.material.__kit === 'shirt')) {} }); }
function netMat(T) { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); x.strokeStyle = 'rgba(255,255,255,.75)'; x.lineWidth = 3; for (let i = 0; i <= 64; i += 16) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 64); x.moveTo(0, i); x.lineTo(64, i); x.stroke(); }
  const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(30, 10); return new T.MeshBasicMaterial({ map: t, transparent: true, side: T.DoubleSide, depthWrite: false }); }
function buildWorld() {
  if (V3) return V3; const T = THREE; if (!W3 || !W3.init({ canvas: $('gl'), fov: 30, far: 1500, near: 0.5, dims: () => [W, H] })) { V3 = { none: true }; return V3; }
  const S = W3.scene, R0 = W3.rng(37), M = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.85 }, o));
  const st = stripeTex(); st.repeat.set(1, 2.6); st.rotation = Math.PI / 2; st.center.set(0.5, 0.5);
  const pitch = new T.Mesh(new T.PlaneGeometry(130, 92), M(0xdce8d4, { map: st, roughness: 0.95 })); pitch.rotation.x = -Math.PI / 2; pitch.receiveShadow = true; S.add(pitch);
  const lineM = new T.MeshBasicMaterial({ color: 0xf4f4ee, transparent: true, opacity: 0.85 });
  const line = (x0, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0), m = new T.Mesh(new T.PlaneGeometry(L, 0.14), lineM); m.rotation.x = -Math.PI / 2; m.rotation.z = -Math.atan2(z1 - z0, x1 - x0); m.position.set((x0 + x1) / 2, 0.012, (z0 + z1) / 2); S.add(m); };
  line(-HL, -HW, HL, -HW); line(-HL, HW, HL, HW); line(-HL, -HW, -HL, HW); line(HL, -HW, HL, HW); line(0, -HW, 0, HW);
  for (const s of [-1, 1]) { const gx = s * HL; line(gx, -20.16, gx - s * 16.5, -20.16); line(gx, 20.16, gx - s * 16.5, 20.16); line(gx - s * 16.5, -20.16, gx - s * 16.5, 20.16); line(gx, -9.16, gx - s * 5.5, -9.16); line(gx, 9.16, gx - s * 5.5, 9.16); line(gx - s * 5.5, -9.16, gx - s * 5.5, 9.16);
    const sp = new T.Mesh(new T.CircleGeometry(0.15, 12), lineM); sp.rotation.x = -Math.PI / 2; sp.position.set(gx - s * 11, 0.013, 0); S.add(sp);
    const arc = new T.Mesh(new T.RingGeometry(9.08, 9.22, 40, 1, -Math.PI * 0.3, Math.PI * 0.6), lineM); arc.rotation.x = -Math.PI / 2; arc.rotation.z = s > 0 ? Math.PI : 0; arc.position.set(gx - s * 11, 0.012, 0); S.add(arc); }
  const cc = new T.Mesh(new T.RingGeometry(9.08, 9.22, 64), lineM); cc.rotation.x = -Math.PI / 2; cc.position.y = 0.012; S.add(cc);
  // the goals and their nets
  const postM = M(0xffffff, { roughness: 0.35 }), nets = [];
  for (const s of [-1, 1]) { const gx = s * HL; for (const z of [-GW2, GW2]) { const p = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, GH, 8), postM); p.position.set(gx, GH / 2, z); S.add(p); } const bar = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, GW2 * 2, 8), postM); bar.rotation.x = Math.PI / 2; bar.position.set(gx, GH, 0); S.add(bar);
    const net = new T.Group(), D = 2.0, nm = netMat(T); const pl = (w, h, x, y, z, ry, rx) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), nm); m.position.set(x, y, z); m.rotation.set(rx || 0, ry, 0, 'YXZ'); net.add(m); };
    pl(GW2 * 2, GH - 0.3, gx + s * D, (GH - 0.3) / 2, 0, Math.PI / 2); pl(GW2 * 2, Math.hypot(D, 0.3), gx + s * D / 2, GH - 0.15, 0, Math.PI / 2, s * (Math.PI / 2 - Math.atan2(0.3, D)));
    for (const z of [-GW2, GW2]) pl(D, GH - 0.15, gx + s * D / 2, (GH - 0.15) / 2, z, 0); S.add(net); nets.push(net); }
  // boards, stands packed with people, floodlights
  const bt = boardTex(); for (const [x, z, ry, w] of [[0, -HW - 3, 0, 110], [0, HW + 3, Math.PI, 110], [-HL - 4, 0, Math.PI / 2, 70], [HL + 4, 0, -Math.PI / 2, 70]]) { const t2 = bt.clone(); t2.needsUpdate = true; t2.repeat.set(w / 12, 1); const b = new T.Mesh(new T.PlaneGeometry(w, 0.9), new T.MeshStandardMaterial({ map: t2, emissive: 0xffffff, emissiveMap: t2, emissiveIntensity: 0.35 })); b.position.set(x, 0.45, z); b.rotation.y = ry; S.add(b); }
  const standM = M(0x3a3e48), seats = [], cols = [0xf2c14b, 0xf2c14b, 0x1a2a5a, 0xffffff, 0xd8302a, 0x2a2a2a, 0xe8e0d0];
  const stand = (cx, cz, ry, len, rows) => { const g = new T.Group(); g.position.set(cx, 0, cz); g.rotation.y = ry; S.add(g); const block = new T.Mesh(new T.BoxGeometry(len, rows * 0.55, rows * 0.9), standM); block.position.set(0, rows * 0.275 + 0.5, -rows * 0.45); block.rotation.x = 0; g.add(block);
    for (let r = 0; r < rows; r++) for (let x = -len / 2 + 0.4; x < len / 2; x += 0.6 + R0() * 0.1) if (R0() < 0.9) seats.push({ g, x, y: 1.3 + r * 0.55 + 0.3 - 0.1, z: -r * 0.9 - 0.2 }); return g; };
  stand(0, -HW - 6, 0, 120, 18); stand(-HL - 7, 0, Math.PI / 2, 80, 14); stand(HL + 7, 0, -Math.PI / 2, 80, 14);
  const crowdG = []; for (let part = 0; part < 2; part++) { const mine = seats.filter((s, i) => i % 2 === part), im = new T.InstancedMesh(new T.BoxGeometry(0.42, 0.62, 0.3), M(0xffffff, { roughness: 0.9 }), mine.length), d = new T.Object3D(), col = new T.Color(), grp = new T.Group();
    mine.forEach((s, i) => { s.g.updateMatrixWorld(); d.position.set(s.x, s.y, s.z); d.position.applyMatrix4(s.g.matrixWorld); d.rotation.set(0, s.g.rotation.y, 0); d.updateMatrix(); im.setMatrixAt(i, d.matrix); im.setColorAt(i, col.setHex(cols[(R0() * cols.length) | 0])); }); im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; grp.add(im); S.add(grp); crowdG.push(grp); }
  const flood = new T.DirectionalLight(0xffffff, 0); flood.position.set(10, 60, 40); S.add(flood, flood.target);
  const lamps = []; for (const [x, z] of [[-60, -42], [60, -42], [-60, 42], [60, 42]]) { const tw = new T.Mesh(new T.CylinderGeometry(0.5, 0.8, 38, 6), M(0x6a6e78)); tw.position.set(x, 19, z); S.add(tw); const pn = new T.Mesh(new T.BoxGeometry(8, 4, 0.6), M(0xdde4ee, { emissive: 0xffffff, emissiveIntensity: 0 })); pn.position.set(x, 39, z); pn.lookAt(0, 0, 0); S.add(pn); lamps.push(pn); }
  // the players: blob shadows (one draw for all), rings for the man you control
  // twenty-two players drawn as five instanced shapes (torsos, shorts, heads, legs, arms): a handful of draws, not a hundred and fifty
  const mat = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75 }), part = (geo, n) => { const im = new T.InstancedMesh(geo, mat, n); im.instanceMatrix.setUsage(T.DynamicDrawUsage); im.frustumCulled = false; S.add(im); return im; };
  const cap = (r, l) => { const g2 = new T.CapsuleGeometry(r, l, 2, 7); g2.translate(0, -(l / 2 + r * 0.6), 0); return g2; };      // limbs hang from their joint
  const men = { torso: part(new T.CapsuleGeometry(0.2, 0.4, 3, 8), 22), shorts: part(new T.CylinderGeometry(0.2, 0.21, 0.24, 8), 22), head: part(new T.SphereGeometry(0.15, 10, 8), 22), hair: part(new T.SphereGeometry(0.158, 10, 6, 0, TAU, 0, Math.PI * 0.55), 22),
    thigh: part(cap(0.085, 0.3), 44), shin: part(cap(0.07, 0.32), 44), boot: part(new T.BoxGeometry(0.11, 0.08, 0.26), 44), upper: part(cap(0.06, 0.22), 44), fore: part(cap(0.052, 0.22), 44) };
  const blob = new T.InstancedMesh(new T.CircleGeometry(0.5, 12), new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3, depthWrite: false }), 23), dB = new T.Object3D(); blob.rotation.x = 0; S.add(blob);
  const ring = new T.Mesh(new T.RingGeometry(0.75, 0.95, 24), new T.MeshBasicMaterial({ color: 0xffe060, transparent: true, opacity: 0.95, depthWrite: false })); ring.rotation.x = -Math.PI / 2; S.add(ring);
  const ball = new T.Mesh(new T.SphereGeometry(0.2, 14, 10), M(0xffffff, { roughness: 0.4, emissive: 0x404040 })); ball.castShadow = true; S.add(ball);
  V3 = { T, S, nets, crowdG, flood, lamps, men, blob, dB, ring, ball, kit: null, sky: null, M: [new T.Matrix4(), new T.Matrix4(), new T.Matrix4(), new T.Matrix4()], col: new T.Color() };
  W3.setQuality(stepN); return V3;
}
const SV = new (window.THREE ? THREE.Vector3 : Object)();
function scr(x, y, z) { if (!V3 || V3.none) return { x: W / 2 + x * 6, y: H / 2 + z * 5 - y * 6, front: true }; SV.set(x, y, z); return W3.screen(SV); }
// ---------- the camera: the main stand, following the ball ----------
const CAM = { x: 0, z: 0 };
function placeCam(g, dt) {
  const cam = W3.cam, b = g.ball, asp = W / H; if (Math.abs(cam.aspect - asp) > 0.001) { cam.aspect = asp; cam.fov = asp > 1.6 ? 30 : 36; cam.updateProjectionMatrix(); }
  const fol = ui.follow != null ? g.P[ui.follow] : null, tx = fol ? fol.x : clamp(b.x + (b.own ? Math.cos(b.own.face) * 5 : b.vx * 0.3), -HL + 12, HL - 12), tz = fol ? fol.z : clamp(b.z * 0.75, -22, 22), k2 = ui.snap || fol ? 1 : 1 - Math.exp(-dt * 3);
  CAM.x += (tx - CAM.x) * k2; CAM.z += (tz - CAM.z) * k2; ui.snap = false;
  const zm = ui.zoom || 1; cam.position.set(CAM.x + (FX.shake ? (Math.random() - 0.5) * FX.shake * 0.04 : 0), 19 * zm, CAM.z + 27 * zm); cam.lookAt(CAM.x, zm < 1 ? 0.9 : 0, CAM.z - 1 * zm); if (fol) { cam.position.set(fol.x + 2.2, 1.6, fol.z + 4.2); cam.lookAt(fol.x, 0.9, fol.z); } cam.updateMatrixWorld();
}
// ---------- events ----------
function onEvent(G, e) {
  const cx = W / 2, cy = H * 0.34;
  switch (e.k) {
    case 'kickoff': if (G.t < 0.5 && !G.lesson) { say(`ELEVEN v ${G.foe.toUpperCase()}`, cx, H * 0.4, '#ffe08a', 22); sfx.whistle(); } else if (e.t !== undefined && G.t > 0.5) sfx.whistle(); break;
    case 'pass': sfx.kick(0.6); if (e.t === 0) vibe(HAP.tick); break;
    case 'lob': sfx.kick(0.8); break;
    case 'shoot': sfx.kick(1); if (e.t === 0) vibe(HAP.light); break;
    case 'switch': if (!e.auto) sfx.click(); break;
    case 'tackle': case 'slide': sfx.whoosh(e.k === 'slide'); break;
    case 'won': if (e.t === 0) { sfx.won(); say('WON IT!', cx, cy, '#9be3b5', 22); vibe(HAP.light); } break;
    case 'intercept': if (e.t === 0) { sfx.won(); say('INTERCEPTED!', cx, cy, '#9be3b5', 20); } break;
    case 'save': sfx.glove(); if (e.t === 1) { say('SAVED!', cx, cy, '#ffb4a8', 28); sfx.groan(0.6); } else { say('WHAT A SAVE!', cx, cy, '#9be3b5', 26); sfx.roar(0.6); } FX.shake = 3; break;
    case 'goal': sfx.net(); if (e.t === 0) { sfx.roar(1.5); FX.flash = 0.8; FX.shake = 6; vibe(HAP.best); say('GOAL!', cx, cy, '#ffe08a', 52); } else { sfx.groan(1); FX.red = 0.6; vibe(HAP.thud); say(`${G.foe.toUpperCase()} SCORE`, cx, cy, '#ffb4a8', 26); } break;
    case 'out': sfx.whistle(0.5); break;
    case 'golden': sfx.whistle(); say('GOLDEN GOAL!', cx, cy, '#ffe08a', 30); say('next goal wins', cx, cy + 36 * k, '#ffffff', 18); break;
    case 'lessonnext': if (e.first) hint = null; say(e.first ? 'FIRST, A LESSON' : 'NEXT LESSON', cx, H * 0.45, '#ffe08a', 24); sfx.ding(); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, cx, H * 0.45, '#9be3b5', 24); sfx.coin(e.n); break;
    case 'lessonmiss': hint = { txt: e.how, t: 0, secs: 3.2 }; break;
    case 'lessondone': say('NOW THE MATCH!', cx, H * 0.45, '#ffe08a', 26); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won_': break;
    case 'lost': sfx.whistle(); sfx.lose(); break;
  }
  if (e.k === 'won' && e.why !== undefined) {}
}
// ---------- the players, frame by frame ----------
function animate(g, t, dt) {
  const V = V3, Mn = V.men, [M0, M1, M2, M3] = V.M, c3 = V.col;
  if (V.kit !== g.kit) { V.kit = g.kit; for (let j = 0; j < 22; j++) { const t = j < 11 ? 0 : 1, gk = j % 11 === 0, shirt = t === 0 ? (gk ? 0x3ae07a : 0xf2c14b) : (gk ? 0x1a1a1a : g.kit[0]), shorts = t === 0 ? (gk ? 0x1a1a1a : 0x1a2a5a) : (gk ? 0x1a1a1a : g.kit[1]), skin = SKINC[(j * 3) % 5];
      const sock = t === 0 ? (gk ? 0x1a1a1a : 0xf2c14b) : (gk ? 0x1a1a1a : g.kit[0]);
      Mn.torso.setColorAt(j, c3.setHex(shirt)); Mn.shorts.setColorAt(j, c3.setHex(shorts)); Mn.head.setColorAt(j, c3.setHex(skin)); Mn.hair.setColorAt(j, c3.setHex([0x1a1a1a, 0x3a2414, 0x6a3a1a, 0xc8a060, 0x111111][(j * 7) % 5]));
      for (const q of [0, 1]) { Mn.thigh.setColorAt(j * 2 + q, c3.setHex(skin)); Mn.shin.setColorAt(j * 2 + q, c3.setHex(sock)); Mn.boot.setColorAt(j * 2 + q, c3.setHex(0x111111)); Mn.upper.setColorAt(j * 2 + q, c3.setHex(shirt)); Mn.fore.setColorAt(j * 2 + q, c3.setHex(gk ? shirt : skin)); } }
    for (const k3 in Mn) Mn[k3].instanceColor.needsUpdate = true; }
  // the run: stride length and rate grow with speed, knees lift and heels kick up at a sprint, arms pump with bent elbows,
  // the body leans forward as he accelerates and into his turns, and bobs twice a stride. Standing: knees soft, a little sway.
  const put = (im, i, M) => im.setMatrixAt(i, M), E = V.E || (V.E = new THREE.Euler()), Q = V.Q || (V.Q = new THREE.Quaternion()), U = V.U || (V.U = new THREE.Vector3(1, 1, 1)), P = V.Pv || (V.Pv = new THREE.Vector3());
  const tf = (out, parent, x, y, z, rx, ry, rz, sx, sy, sz) => { E.set(rx || 0, ry || 0, rz || 0, 'YXZ'); Q.setFromEuler(E); P.set(x, y, z); U.set(sx || 1, sy || 1, sz || 1); out.compose(P, Q, U); if (parent) out.premultiply(parent); return out; };
  const HIP = V.HIP || (V.HIP = new THREE.Matrix4()), TH = V.TH || (V.TH = new THREE.Matrix4()), SH = V.SH || (V.SH = new THREE.Matrix4()), TMP = V.TMP || (V.TMP = new THREE.Matrix4()), CH = V.CH || (V.CH = new THREE.Matrix4());
  g.P.forEach((p, j) => { const sp = Math.hypot(p.vx, p.vz), top = p.t ? g.cfg.oSpd : g.cfg.uSpd, f = clamp(sp / top, 0, 1.1), a = p.anim || (p.anim = { ph: j, lean: 0, roll: 0, v: 0 });
    const stride = 0.9 + 1.5 * f; a.ph += sp * dt / stride * Math.PI; const ph = a.ph, acc = (sp - a.v) / Math.max(dt, 1e-3); a.v = sp;
    a.lean += ((0.04 + 0.22 * f * f + clamp(acc * 0.03, -0.1, 0.15)) - a.lean) * Math.min(1, dt * 6); a.roll += ((-(p.turnRate || 0) * f * 0.12) - a.roll) * Math.min(1, dt * 6);
    const sw = Math.min(1, f * 1.6), down = p.down > 0, slide = down && p.tk > 0.3, bob = Math.abs(Math.sin(ph)) * 0.05 * sw - (sp < 0.3 ? 0.03 : 0.0);
    // the whole man: position, facing, lean
    tf(M0, null, p.x, 0, p.z, 0, Math.PI / 2 - p.face, 0);
    if (down) tf(HIP, M0, 0, slide ? 0.3 : 0.25, 0, slide ? -1.15 : 1.25, 0, 0);
    else tf(HIP, M0, 0, 0.93 + bob - (sp < 0.3 ? 0.04 : 0), 0, a.lean, 0, a.roll);
    put(Mn.shorts, j, tf(TMP, HIP, 0, 0.0, 0)); put(Mn.torso, j, tf(TMP, HIP, 0, 0.36, 0, 0, Math.sin(ph) * 0.12 * sw, 0, 1.12, 1, 0.78));
    tf(CH, HIP, 0, 0, 0, 0, Math.sin(ph) * 0.12 * sw, 0);
    put(Mn.head, j, tf(TMP, CH, 0, 0.83, 0.01, -a.lean * 0.6)); put(Mn.hair, j, tf(TMP, CH, 0, 0.85, -0.005, -a.lean * 0.6 - 0.25));
    // legs: hip swing, knee bend (most on the swing-through), the kick
    const kick = p.kick > 0 ? 1 - p.kick / 0.32 : -1;
    for (const q of [0, 1]) { const sgn = q ? -1 : 1, s1 = Math.sin(ph + (q ? Math.PI : 0)), c1 = Math.cos(ph + (q ? Math.PI : 0));
      let hipA = -s1 * (0.25 + 0.55 * sw) * sw, knee = (0.15 + (c1 > 0 ? c1 * (0.5 + 1.3 * f) : 0.1)) * Math.max(0.25, sw);
      if (sp < 0.3) { hipA = -0.08; knee = 0.18; }
      if (kick >= 0 && q === 0) { hipA = kick < 0.45 ? 0.6 * (kick / 0.45) : 0.6 - 2.0 * ((kick - 0.45) / 0.55); knee = kick < 0.45 ? 1.2 : 0.3; }
      if (slide) { hipA = q ? -1.4 : -1.1; knee = q ? 0.1 : 0.9; }
      tf(TH, HIP, sgn * 0.11, -0.04, 0, hipA, 0, 0); put(Mn.thigh, j * 2 + q, TH);
      tf(SH, TH, 0, -0.44, 0, knee, 0, 0); put(Mn.shin, j * 2 + q, SH); put(Mn.boot, j * 2 + q, tf(TMP, SH, 0, -0.46, 0.06, -knee * 0.3)); }
    // arms: opposite to the legs, elbows bent more at a sprint
    for (const q of [0, 1]) { const sgn = q ? -1 : 1, s1 = Math.sin(ph + (q ? 0 : Math.PI)); let sh = s1 * (0.2 + 0.7 * sw) * sw, el = -(0.35 + 1.05 * f), out = sgn * 0.12;
      if (sp < 0.3) { sh = 0.05; el = -0.25; } if (p.role === 'gk' && sp < 2) { sh = -0.5; el = -0.9; out = sgn * 0.5; } if (slide) { sh = -0.6; el = -0.4; out = sgn * 0.9; }
      tf(TH, CH, sgn * 0.27, 0.6, 0, sh, 0, out); put(Mn.upper, j * 2 + q, TH); put(Mn.fore, j * 2 + q, tf(SH, TH, 0, -0.33, 0, el, 0, 0)); }
    V.dB.position.set(p.x, 0.02, p.z); V.dB.rotation.set(-Math.PI / 2, 0, 0); V.dB.scale.setScalar(1); V.dB.updateMatrix(); V.blob.setMatrixAt(j, V.dB.matrix); });
  for (const k3 in Mn) Mn[k3].instanceMatrix.needsUpdate = true;
  const b = g.ball; V.ball.position.set(b.x, b.y + 0.2, b.z); V.ball.rotation.z -= b.vx * dt * 3; V.ball.rotation.x += b.vz * dt * 3;
  V.dB.position.set(b.x, 0.02, b.z); V.dB.scale.setScalar(0.45); V.dB.updateMatrix(); V.blob.setMatrixAt(22, V.dB.matrix); V.blob.instanceMatrix.needsUpdate = true;
  const c = me(g); V.ring.visible = !!G && !g.over; V.ring.position.set(c.x, 0.03, c.z); V.ring.material.color.setHex(g.ball.own === c ? 0xffe060 : 0x9ad8ff);
  const goalNet = g.pause > 1 && g.score; V.nets.forEach((n, i) => n.position.x = 0);
  const joy = g.pause > 0.5 && g.lastGoal === 0; V.crowdG.forEach((cg, i) => cg.position.y = joy ? Math.abs(Math.sin(t * 9 + i * 2)) * 0.4 : 0);
}
let IG = null; function idleG() { if (!IG || IG.over) { IG = newGame(Math.max(4, store.get('level', 1) | 0), { seed: (Math.random() * 1e6) | 0 }); IG.mem = {}; } honest(IG, { react: 0.25, acc: 0.95 }, IG.mem); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#10241a'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D stadium.', W / 2, H / 2); return; }
  const g = G || idleG(), t = now;
  if (V.sky !== g.weather) { V.sky = g.weather; W3.setSky(g.weather, { azim: 200 }); W3.scene.environmentIntensity = g.weather === 'night' || g.weather === 'dusk' ? 0.6 : 0.3; const lit = g.weather === 'night' || g.weather === 'dusk' || g.weather === 'rain' || g.weather === 'sunset';
    V.flood.intensity = g.weather === 'night' ? 1.4 : g.weather === 'dusk' ? 1.1 : lit ? 0.5 : 0; V.lamps.forEach(L => L.material.emissiveIntensity = lit ? 2 : 0.1); }
  placeCam(g, dt); animate(g, t, dt);
  W3.setFocus(CAM.x, 0, CAM.z, 40); W3.render(dt);
  if (G) hud(G, t);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 1.2 ? 1 : 1 - (t2.t - 1.2) / 0.4; ctx.globalAlpha = Math.max(0, al); const sc = t2.t < 0.12 ? 1.4 - t2.t / 0.12 * 0.4 : 1; ctx.font = `${Math.round(t2.size * k * sc)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 14); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 14); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W * 0.6), lh = 18 * k, h = lines.length * lh + 14 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30;
    ctx.fillStyle = 'rgba(8,12,24,.82)'; rrect(W / 2 - w / 2, H * 0.24 - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.24 - h / 2 + 7 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,40,40,${FX.red * 0.12})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,248,210,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); }
}
// ---------- the 2D layer ----------
function buttons(G) { const r = 34 * k, x0 = W - 26 * k - r, y0 = H - 26 * k - r, att = haveBall(G);
  return [{ k: 'shoot', x: x0, y: y0, r: r * 1.15, label: att ? 'SHOOT' : 'TACKLE', col: '#e8402a' }, { k: 'pass', x: x0 - r * 2.5, y: y0 + r * 0.25, r, label: att ? 'PASS' : 'SWITCH', col: '#2a8ae8' }, { k: 'lob', x: x0 - r * 0.6, y: y0 - r * 2.4, r, label: att ? 'LOB' : 'SLIDE', col: '#f2c14b' },
    { k: 'sprint', x: x0 - r * 4.9, y: y0 + r * 0.35, r: r * 0.92, label: 'SPRINT', col: '#3ab86a', held: G.sprint }]; }
function hud(G, t) {
  ctx.textBaseline = 'middle';
  if (!G.lesson) { const y = 22 * k, w = 300 * k; ctx.fillStyle = 'rgba(8,12,24,.75)'; rrect(W / 2 - w / 2, y - 15 * k, w, 30 * k, 10); ctx.fill();
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = `${Math.round(17 * k)}px ${TF}`; ctx.fillText(`${G.score[0]} - ${G.score[1]}`, W / 2, y);
    ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.textAlign = 'right'; ctx.fillStyle = '#f2c14b'; ctx.fillText('ELEVEN', W / 2 - 36 * k, y); ctx.textAlign = 'left'; ctx.fillStyle = '#ffffff'; ctx.fillText(G.foe.toUpperCase(), W / 2 + 36 * k, y);
    const mins = G.golden ? 'GOLDEN GOAL' : `${Math.min(90, Math.floor(G.clock / G.cfg.len * 90))}'`; ctx.textAlign = 'center'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = G.golden ? '#ffe08a' : 'rgba(255,255,255,.85)'; ctx.fillText(mins, W / 2, y + 24 * k); }
  else lessonPanel(G);
  // the map of the pitch
  { const mw = 120 * k, mh = mw * 68 / 105, mx = W / 2 - mw / 2, my = H - mh - 10 * k; ctx.fillStyle = 'rgba(10,40,20,.6)'; rrect(mx, my, mw, mh, 6); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 1; ctx.strokeRect(mx + 2, my + 2, mw - 4, mh - 4); ctx.beginPath(); ctx.moveTo(mx + mw / 2, my + 2); ctx.lineTo(mx + mw / 2, my + mh - 2); ctx.stroke();
    const P = (x, z) => [mx + (x + HL) / 105 * mw, my + (z + HW) / 68 * mh]; for (const p of G.P) { const [a, b2] = P(p.x, p.z); ctx.fillStyle = p.t ? '#ffffff' : '#f2c14b'; ctx.beginPath(); ctx.arc(a, b2, p.t === 0 && p.i === G.ctrl ? 3.2 : 2.2, 0, TAU); ctx.fill(); }
    const [bx, by] = P(G.ball.x, G.ball.z); ctx.fillStyle = '#ff4a3a'; ctx.beginPath(); ctx.arc(bx, by, 2.4, 0, TAU); ctx.fill(); }
  // you: an arrow over your man
  { const c = me(G), sb = scr(c.x, 0, c.z), st = c.st == null ? 1 : c.st, bw = 34 * k; ctx.fillStyle = 'rgba(0,0,0,.5)'; rrect(sb.x - bw / 2, sb.y + 12 * k, bw, 5 * k, 2.5 * k); ctx.fill(); ctx.fillStyle = st > 0.5 ? '#5ee08a' : st > 0.2 ? '#ffd23a' : '#ff5a4a'; rrect(sb.x - bw / 2, sb.y + 12 * k, Math.max(5 * k, bw * st), 5 * k, 2.5 * k); ctx.fill(); }
  { const c = me(G), s = scr(c.x, 2.4, c.z); ctx.fillStyle = G.ball.own === c ? '#ffe060' : '#9ad8ff'; ctx.beginPath(); ctx.moveTo(s.x, s.y + 8 * k); ctx.lineTo(s.x - 7 * k, s.y - 4 * k); ctx.lineTo(s.x + 7 * k, s.y - 4 * k); ctx.closePath(); ctx.fill(); }
  // the stick
  const s2 = ui.stick; if (s2) { ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(s2.x0, s2.y0, 46 * k, 0, TAU); ctx.stroke(); const dx = s2.x - s2.x0, dy = s2.y - s2.y0, L = Math.hypot(dx, dy), m = Math.min(1, 46 * k / (L || 1)); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.arc(s2.x0 + dx * m, s2.y0 + dy * m, 20 * k, 0, TAU); ctx.fill(); }
  else if (G.N <= 3 || G.lesson) { ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.arc(80 * k, H - 80 * k, 46 * k, 0, TAU); ctx.fill(); ctx.textAlign = 'center'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillText('RUN', 80 * k, H - 80 * k); }
  // the buttons
  for (const b of buttons(G)) { const f = b.held ? 1 : ui.flash[b.k] || 0; ctx.globalAlpha = 0.85; ctx.fillStyle = b.col; ctx.beginPath(); ctx.arc(b.x, b.y, b.r * (1 - f * 0.1), 0, TAU); ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = `rgba(255,255,255,${0.4 + f * 0.6})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(b.x, b.y, b.r * (1 - f * 0.1), 0, TAU); ctx.stroke();
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = `${Math.round(12 * k)}px ${TF}`; ctx.fillText(b.label, b.x, b.y); }
}
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) {
  const D = G.lesson, st = D.steps[D.i], w = Math.min(W - 24, 460 * k), x = W / 2 - w / 2, y = 8 * k; ctx.save();
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; const lines = wrapText(st.how, w - 24), h = 46 * k + lines.length * 16 * k;
  ctx.fillStyle = 'rgba(8,12,24,.82)'; rrect(x, y, w, h, 12); ctx.fill(); ctx.strokeStyle = 'rgba(255,224,138,.7)'; ctx.lineWidth = 2; rrect(x, y, w, h, 12); ctx.stroke();
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#ffe08a'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillText(`LESSON ${G.N} OF 3 · ${D.n} OF ${st.need}`, x + 12, y + 8 * k);
  ctx.fillStyle = '#fff'; ctx.font = `${Math.round(16 * k)}px ${TF}`; ctx.fillText(st.title, x + 12, y + 22 * k);
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.92)'; lines.forEach((l, i) => ctx.fillText(l, x + 12, y + 42 * k + i * 16 * k));
  ctx.restore(); ctx.textBaseline = 'middle';
}
