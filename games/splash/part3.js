// ===================== THE VIEW: Splash Course (sideways; the camera picks a clear angle for each obstacle) =====================
// Sparkling pools under bright padded equipment; stands of spectators and umbrellas along the sides; the finish arch at the
// end. Game x is drawn mirrored (X = -x) so that + x is the right of the screen when the camera looks down the course.
const FX = { shake: 0, stop: 0, flash: 0, red: 0, slow: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { snap: true, banner: null, stick: null, btn: {}, jumpId: null, duckId: null, phi: 0, cam: null };
const optShake = () => store.get('shake', true) !== false, optGhost = () => store.get('ghost', true) !== false, optSlow = optGhost;
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip2(key, txt, secs = 3) { if (HEADLESS) return; tip2.seen = tip2.seen || {}; if (tip2.seen[key]) return; tip2.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 160, up = 40) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - up * k, t: 0, life: 0.5 + Math.random() * 0.6, col, r: (2 + Math.random() * 3.5) * k }); } if (PARTS.length > 300) PARTS.splice(0, PARTS.length - 300); }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2.5); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.4) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 420 * k * dt; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (ui.banner) { ui.banner.t += dt; if (ui.banner.t > (ui.banner.secs || 1.6)) ui.banner = null; }
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; } }
function mySkin() { if (typeof HEADLESS !== 'undefined' && HEADLESS) return SKINS[0]; const id = store.get('skin', 'red'); return SKINS.find(q => q.id === id) || SKINS[0]; }
const PAD = [0xff4a3a, 0xffc21a, 0x2ab8ff, 0x8ae02a, 0xff6ab0];
function buildWorld() {
  if (V3) return V3; const T = window.THREE; if (!T || !W3 || !W3.init({ canvas: $('gl'), fov: 55, far: 900, near: 0.2, dims: () => [W, H] })) { V3 = { none: true }; return V3; }
  V3 = { T, S: W3.scene, t: 0, for: null, grp: null }; const V = V3, M = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.55 }, o)); V.M = M;
  V.boxG = new T.BoxGeometry(1, 1, 1); V.cylG = new T.CylinderGeometry(1, 1, 1, 24); V.sphG = new T.SphereGeometry(1, 28, 18);
  V.sea = W3.water({ size: 1400, color: 0x0aa8c8, distort: 1.2, ripple: 3.0, speed: 0.5, y: 0 });
  V.ring = new T.Mesh(new T.TorusGeometry(0.42, 0.06, 8, 32), new T.MeshBasicMaterial({ color: 0x5aff8a, transparent: true, opacity: 0.9 })); V.ring.rotation.x = Math.PI / 2; V.S.add(V.ring);
  V.me = runner(V, mySkin().col, mySkin().col2, 1); V.S.add(V.me.g); V.ghost = runner(V, 0xffffff, 0xffffff, 0.35); V.S.add(V.ghost.g);
  W3.setQuality(stepN); return V; }
// a runner: body, head, helmet, arms and legs that swing; a soft "ghost" copy for your best run
function runner(V, col, col2, op) { const T = V.T, tr = op < 1, mat = c => new T.MeshStandardMaterial({ color: c, roughness: 0.6, transparent: tr, opacity: op, depthWrite: !tr }), g = new T.Group(), body = new T.Group(); g.add(body);
  const torso = new T.Mesh(V.boxG, mat(col)); torso.scale.set(0.46, 0.6, 0.3); torso.position.y = 1.05; body.add(torso);
  const head = new T.Mesh(V.sphG, mat(0xf0c8a0)); head.scale.setScalar(0.2); head.position.y = 1.55; body.add(head); const helm = new T.Mesh(new T.SphereGeometry(1, 16, 10, 0, TAU, 0, Math.PI / 2), mat(col2)); helm.scale.setScalar(0.215); helm.position.y = 1.58; body.add(helm);
  const limb = (x, y, len, c) => { const p = new T.Group(); p.position.set(x, y, 0); const m = new T.Mesh(V.boxG, mat(c)); m.scale.set(0.13, len, 0.13); m.position.y = -len / 2; p.add(m); body.add(p); return p; };
  const arms = [limb(-0.3, 1.3, 0.55, col), limb(0.3, 1.3, 0.55, col)], legs = [limb(-0.12, 0.75, 0.75, col2), limb(0.12, 0.75, 0.75, col2)];
  if (!tr) g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return { g, body, arms, legs }; }
function poseRunner(R, P, t, run, mode) {   // mode: ground, air, duck, charge, fall
  R.g.position.set(-P.x, P.y, P.z); R.g.rotation.y = -(P.face || 0); const b = R.body; b.rotation.set(0, 0, 0); b.position.set(0, 0, 0); b.scale.set(1, 1, 1);
  const s = Math.sin(t * 12) * Math.min(1, run);
  R.legs[0].rotation.x = s * 0.9; R.legs[1].rotation.x = -s * 0.9; R.arms[0].rotation.x = -s * 0.8; R.arms[1].rotation.x = s * 0.8; R.arms[0].rotation.z = R.arms[1].rotation.z = 0;
  if (mode === 'air') { R.legs[0].rotation.x = 0.9; R.legs[1].rotation.x = -0.3; R.arms[0].rotation.z = -2.4; R.arms[1].rotation.z = 2.4; }
  if (mode === 'duck') { b.scale.set(1.1, 0.58, 1.1); R.arms[0].rotation.x = R.arms[1].rotation.x = -1.2; }
  if (mode === 'charge') { b.scale.set(1.08, 0.8, 1.08); R.arms[0].rotation.x = R.arms[1].rotation.x = 0.9; }
  if (mode === 'fall') { const tu = P.tumble || 0; b.position.y = 0.9; b.rotation.set(tu * 5, 0, tu * 3.2); R.arms[0].rotation.z = -2 + Math.sin(tu * 20); R.arms[1].rotation.z = 2 - Math.sin(tu * 20); R.legs[0].rotation.x = Math.sin(tu * 18); R.legs[1].rotation.x = -Math.sin(tu * 18); } }
// the course: built once per level (the layout is fixed for a level, so your ghost raced the same course)
function buildCourse3(V, G) { const T = V.T, M = V.M, S = V.S; if (V.grp) { S.remove(V.grp); V.grp.traverse(o => { if (o.geometry && o.geometry !== V.boxG && o.geometry !== V.cylG && o.geometry !== V.sphG) o.geometry.dispose(); }); }
  const grp = new T.Group(); V.grp = grp; S.add(grp); V.dyn = []; const C = G.C, add = (m, x, y, z) => { m.position.set(x, y, z); grp.add(m); m.castShadow = m.receiveShadow = true; return m; };
  const box = (w, h, d, c, x, y, z) => { const m = new T.Mesh(V.boxG, M(c)); m.scale.set(w, h, d); return add(m, x, y, z); };
  const post = (x, z, h, c = 0xd8d8d8) => { const m = new T.Mesh(V.cylG, M(c, { metalness: 0.4 })); m.scale.set(0.12, h, 0.12); return add(m, x, h / 2, z); };
  C.plats.forEach((pl, i) => { const L = pl.z1 - pl.z0; box(4.4, 0.5, L, i % 2 ? 0xffc21a : 0xff4a3a, 0, TOP - 0.25, (pl.z0 + pl.z1) / 2); box(4.5, 0.12, L + 0.05, 0xffffff, 0, TOP - 0.55, (pl.z0 + pl.z1) / 2); for (const x of [-1.9, 1.9]) for (const z of [pl.z0 + 0.4, pl.z1 - 0.4]) post(x, z, TOP - 0.6);
    if (pl.fin) { for (const x of [-2.4, 2.4]) { const p = new T.Mesh(V.cylG, M(0xffffff)); p.scale.set(0.25, 4.5, 0.25); add(p, x, TOP + 2.25, C.finZ); } box(5.3, 0.9, 0.4, 0x1a1a1a, 0, TOP + 4.6, C.finZ); const cv2 = document.createElement('canvas'); cv2.width = 256; cv2.height = 48; const g2 = cv2.getContext('2d'); g2.fillStyle = '#ffd23a'; g2.font = '40px "Luckiest Guy", "Arial Black"'; g2.textAlign = 'center'; g2.fillText('FINISH', 128, 40); const tx = new T.CanvasTexture(cv2); const sign = new T.Mesh(new T.PlaneGeometry(4.6, 0.8), new T.MeshBasicMaterial({ map: tx, transparent: true })); sign.rotation.y = Math.PI; add(sign, 0, TOP + 4.6, C.finZ - 0.22);
      for (let k2 = 0; k2 < 8; k2++) box(0.55, 0.02, 0.55, k2 % 2 ? 0x111111 : 0xffffff, -1.925 + k2 * 0.55, TOP + 0.01, C.finZ); } });
  for (const o of C.obs) {
    if (o.kind === 'balls') o.balls.forEach((b, bi) => { const m = new T.Mesh(V.sphG, M(PAD[bi % 2 ? 0 : 4], { roughness: 0.25 })); m.scale.setScalar(b.r); add(m, -b.cx0, b.top - b.r, b.cz); V.dyn.push({ m, f: (G2) => { m.position.x = -ballX(b, G2.t); const q = b.sq; m.scale.set(b.r * (1 + q * 0.08), b.r * (1 - q * 0.14), b.r * (1 + q * 0.08)); m.position.y = b.top - b.r * (1 - q * 0.14) - q * 0.02; } }); });
    else if (o.kind === 'sweep') { const ped = new T.Mesh(V.cylG, M(0x2ab8ff)); ped.scale.set(o.pr, 0.5, o.pr); add(ped, 0, TOP - 0.25, o.pz); post(0, o.pz, TOP - 0.5); const pv = new T.Mesh(V.cylG, M(0xffc21a)); pv.scale.set(0.35, TOP + 1.8, 0.35); add(pv, -o.pivot.x, (TOP + 1.8) / 2, o.pivot.z);
      const arm = (y, c) => { const g3 = new T.Group(); g3.position.set(-o.pivot.x, TOP + y, o.pivot.z); const a = new T.Mesh(V.cylG, M(c, { roughness: 0.4 })); a.scale.set(0.2, o.len, 0.2); a.rotation.z = Math.PI / 2; a.position.x = o.len / 2; g3.add(a); grp.add(g3); return { g3, a }; };
      const lo = arm(0.25, 0xff7a1a), hi = o.high ? arm(1.25, 0x8a3ad8) : null;
      const gate = box(4.6, 0.3, 0.3, 0xff4a3a, 0, TOP + 1.0, o.z1 + 0.15); for (const x of [-2.4, 2.4]) post(x, o.z1 + 0.15, TOP + 2.6, 0xffc21a);
      V.dyn.push({ f: G2 => { lo.g3.rotation.y = Math.PI + o.th; lo.a.material.color.setHex(o.k > 1 ? 0xff2020 : 0xff7a1a); if (hi) hi.g3.rotation.y = Math.PI + o.th + Math.PI; gate.position.y = o.open ? TOP + 2.5 : TOP + 1.0; gate.material.color.setHex(o.open ? 0x40e060 : 0xff4a3a); } }); }
    else if (o.kind === 'wall') { const L = o.z1 - o.z0; box(0.4, 3.2, L, 0x2ab8ff, 0.65, TOP + 1.6, (o.z0 + o.z1) / 2); box(0.9, 0.3, L, 0xffc21a, 0, TOP - 0.15, (o.z0 + o.z1) / 2); for (let z = o.z0 + 1; z < o.z1; z += 3) post(0, z, TOP - 0.3);
      o.gloves.forEach(gl => { const arm = new T.Mesh(V.cylG, M(0xd8d8d8, { metalness: 0.5 })); arm.scale.set(0.1, 1, 0.1); arm.rotation.z = Math.PI / 2; grp.add(arm); const fist = new T.Mesh(V.sphG, M(0xe82020, { roughness: 0.3 })); fist.scale.set(0.45, 0.55, 0.6); grp.add(fist); const lamp = new T.Mesh(V.sphG, new T.MeshBasicMaterial({ color: 0x40ff60 })); lamp.scale.setScalar(0.16); add(lamp, 0.45, TOP + 2.7, gl.z);
        V.dyn.push({ f: G2 => { const s = glove(gl, G2.t), x = -0.45 + 0.1 + Math.max(0, s.e) * 1.5 + Math.min(0, s.e) * 0.5, X = -x; fist.position.set(X, TOP + 1.05, gl.z); arm.position.set((0.45 + X) / 2, TOP + 1.05, gl.z); arm.scale.y = Math.max(0.05, 0.45 - X); lamp.material.color.setHex(s.st === 'out' ? 0xff3020 : s.st === 'warn' ? (Math.floor(G2.t * 10) % 2 ? 0xff3020 : 0xffd23a) : 0x40ff60); } }); }); }
    else if (o.kind === 'belt') { const L = o.z1 - o.b0, c2 = document.createElement('canvas'); c2.width = 64; c2.height = 64; const g2 = c2.getContext('2d'); g2.fillStyle = '#2a2a34'; g2.fillRect(0, 0, 64, 64); g2.fillStyle = '#ffd23a'; g2.fillRect(0, 0, 64, 10); const tex = new T.CanvasTexture(c2); tex.wrapS = tex.wrapT = T.RepeatWrapping; tex.repeat.set(1, L / 1.2);
      const belt = new T.Mesh(V.boxG, M(0xffffff, { map: tex })); belt.scale.set(4.2, 0.4, L); add(belt, 0, TOP - 0.2, (o.b0 + o.z1) / 2); for (const x of [-2.25, 2.25]) box(0.25, 0.7, L + 0.6, 0xff4a3a, x, TOP - 0.15, (o.b0 + o.z1) / 2); for (let z = o.b0 + 0.5; z < o.z1; z += 4) for (const x of [-2, 2]) post(x, z, TOP - 0.5);
      const lamps = [-2.3, 2.3].map(x => { const l = new T.Mesh(V.sphG, new T.MeshBasicMaterial({ color: 0x40ff60 })); l.scale.setScalar(0.2); return add(l, x, TOP + 0.5, o.b0 + 0.6); });
      const items = o.items.map(it => { const g3 = new T.Group(); grp.add(g3);
        if (it.type === 'barrier') { const m = new T.Mesh(V.boxG, M(0x8ae02a)); m.scale.set(2.7, 1.4, 0.5); m.position.set(it.side < 0 ? 0.75 : -0.75, 0.7, 0); g3.add(m); }
        else if (it.type === 'hurdle') { const m = new T.Mesh(V.boxG, M(0xff6ab0)); m.scale.set(4.0, 0.3, 0.3); m.position.y = 0.3; g3.add(m); }
        else { const m = new T.Mesh(V.boxG, M(0xffc21a)); m.scale.set(4.6, 0.25, 0.3); m.position.y = 1.15; g3.add(m); for (const x of [-2.25, 2.25]) { const p2 = new T.Mesh(V.boxG, M(0xd8d8d8)); p2.scale.set(0.12, 1.2, 0.12); p2.position.set(x, 0.6, 0); g3.add(p2); } }
        g3.traverse(q => { if (q.isMesh) q.castShadow = true; }); return { g3, it }; });
      V.dyn.push({ f: G2 => { tex.offset.y = -(o.sh / 1.2) % 1; for (const { g3, it } of items) { const z = beltItemZ(o, it); g3.visible = z >= o.b0 - 0.1 && z <= o.z1; g3.position.set(0, TOP + (it.hit > 0 ? Math.sin(it.hit * 30) * 0.05 : 0), z); } lamps.forEach(l => l.material.color.setHex(o.warn ? (Math.floor(G2.t * 8) % 2 ? 0xff3020 : 0xffd23a) : o.v > o.v0 * 1.1 ? 0xff3020 : 0x40ff60)); } }); }
    else { const g3 = new T.Group(); g3.position.set(0, TOP, o.cz); grp.add(g3); const mk = (sx, sz, c) => { const m = new T.Mesh(V.boxG, M(c)); m.scale.set(sx, 0.4, sz); m.position.y = -0.2; m.castShadow = m.receiveShadow = true; g3.add(m); };
      mk(o.L * 2, 1.1, 0x2ab8ff); mk(1.1, o.L * 2, 0xff6ab0); const hub = new T.Mesh(V.cylG, M(0xffc21a)); hub.scale.set(0.8, 0.45, 0.8); hub.position.y = -0.15; g3.add(hub); const pole = new T.Mesh(V.cylG, M(0xd8d8d8)); pole.scale.set(0.3, TOP, 0.3); pole.position.y = -TOP / 2; g3.add(pole);
      let bar = null; if (o.bar) { bar = new T.Group(); bar.position.set(0, TOP + 0.25, o.cz); const b2 = new T.Mesh(V.cylG, M(0xff2020)); b2.scale.set(0.18, o.L - 0.9, 0.18); b2.rotation.z = Math.PI / 2; b2.position.x = 0.9 + (o.L - 0.9) / 2; bar.add(b2); grp.add(bar); }
      V.dyn.push({ f: G2 => { g3.rotation.y = Math.PI + o.th; if (bar) bar.rotation.y = Math.PI + o.bth; } }); } }
  // the crowd in stands along the course, and beach umbrellas
  const zEnd = C.finZ + 6, crowd = [], cols = [0xff4a3a, 0x2ab8ff, 0xffd23a, 0x8ae02a, 0xff6ab0, 0xffffff, 0xff8a2a];
  for (const side of [-1, 1]) for (let r = 0; r < 3; r++) for (let z = -8; z < zEnd; z += 1.4) crowd.push({ x: side * (13 + r * 1.3), y: 1.0 + r * 0.9, z: z + (r % 2) * 0.7, c: cols[Math.abs(Math.round(z * 3) + r * 2 + (side > 0 ? 3 : 0)) % cols.length] });
  { const im = new T.InstancedMesh(new T.BoxGeometry(0.55, 1.1, 0.45), M(0xffffff), crowd.length), m = new T.Matrix4(), c = new T.Color(); crowd.forEach((q, i) => { m.makeTranslation(q.x, q.y, q.z); im.setMatrixAt(i, m); im.setColorAt(i, c.setHex(q.c)); }); grp.add(im); V.crowd = im; V.crowdP = crowd; }
  for (const side of [-1, 1]) { const st = new T.Mesh(V.boxG, M(0xe8e0d0)); st.scale.set(5, 3, zEnd + 10); st.position.set(side * 14.5, 0.3, (zEnd - 8) / 2); st.rotation.z = side * 0.3; grp.add(st); }
  for (let z = 0; z < zEnd; z += 9) for (const side of [-1, 1]) { const u = new T.Mesh(new T.ConeGeometry(1.4, 0.7, 10), M(PAD[(z / 9 + (side > 0 ? 2 : 0)) % PAD.length | 0])); add(u, side * 9, 3.4, z + 4); post(side * 9, z + 4, 3.2, 0xffffff); } }
function sectionOf(G) { const P = G.p, C = G.C; if (P.on && P.on.kind === 'plat') { const o = C.obs[P.on.pl.i]; return o ? o : null; } for (const o of C.obs) if (P.z >= o.z0 - 0.5 && P.z <= o.z1 + 0.5) return o; const o = C.obs.find(q => q.z0 > P.z); return o || null; }
function camFor(G, o) { const P = G.p;
  if (!o) return { pos: [P.x, TOP + 3.2, P.z - 6.5], at: [P.x * 0.5, TOP + 0.8, P.z + 5], phi: 0 };
  if (o.kind === 'wall') return { pos: [7.5, TOP + 3.2, P.z - 2.2], at: [0, TOP + 0.9, P.z + 1.8], phi: -Math.PI / 2 };
  if (o.kind === 'sweep') return { pos: [1.5, TOP + 7.5, o.pz - 8.5], at: [-0.8, TOP, o.pz + 0.3], phi: 0 };
  if (o.kind === 'cross') return { pos: [0, TOP + 9.5, o.cz - 10.5], at: [0, TOP, o.cz + 0.6], phi: 0 };
  if (o.kind === 'balls') return { pos: [P.x * 0.6, TOP + 4.6, P.z - 7], at: [P.x * 0.4, TOP + 0.4, P.z + 6], phi: 0 };
  return { pos: [P.x * 0.5, TOP + 4.2, P.z - 6.2], at: [P.x * 0.3, TOP + 0.6, P.z + 5], phi: 0 }; }
function sync(V, G, dt) { V.t += dt; const T = V.T, P = G.p;
  if (V.for !== G.N + ':' + (G.C && G.C.obs.length)) { V.for = G.N + ':' + G.C.obs.length; W3.setSky(PLACES[G.cfg.place].sky); buildCourse3(V, G); const s = mySkin(); V.S.remove(V.me.g); V.me = runner(V, s.col, s.col2, 1); V.S.add(V.me.g); ui.cam = null; }
  for (const d of V.dyn) d.f(G);
  const sp = Math.hypot(P.vx, P.vz); if (sp > 0.4 && P.state !== 'fall') P.face = Math.atan2(P.vx, P.vz);
  poseRunner(V.me, P, V.t, P.state === 'ground' ? sp / 3 : 0, P.state === 'fall' ? 'fall' : P.state === 'air' ? 'air' : P.duck ? 'duck' : G.charging ? 'charge' : 'ground');
  if (P.stun > 0) V.me.body.rotation.x = -0.6;
  // the ghost: your best run on this course, at the same moment of the clock
  const gt = ghostTrace(G); V.ghost.g.visible = !!gt && optGhost() && !G.lesson; if (V.ghost.g.visible) { const i = Math.min(gt.length - 1, Math.floor(G.clock / GSTEP)), a = gt[i], b = gt[Math.min(gt.length - 1, i + 1)], u = clamp(G.clock / GSTEP - i, 0, 1), q = { x: a[0] + (b[0] - a[0]) * u, y: a[1] + (b[1] - a[1]) * u, z: a[2] + (b[2] - a[2]) * u, face: Math.atan2(b[0] - a[0], b[2] - a[2] + 1e-6), tumble: 0 }; poseRunner(V.ghost, q, V.t, Math.hypot(b[0] - a[0], b[2] - a[2]) > 0.05 ? 1 : 0, 'ground'); }
  // the landing ring while you hold JUMP (and, at the easy levels, the moment you are about to jump)
  V.ring.visible = false; if (G.charging && P.state === 'ground') { const pw = Math.min(1, G.charge / CH); let L = landAt(G, pw, G.stick.x, G.stick.z, TOP); if (L) { const s2 = support(G, L.x, L.z, 10, 0); if (s2 && s2.h > TOP + 0.05) L = landAt(G, pw, G.stick.x, G.stick.z, s2.h) || L; const s3 = support(G, L.x, L.z, 10, 0); V.ring.visible = true; V.ring.position.set(-L.x, (s3 ? s3.h : 0) + 0.05, L.z); V.ring.material.color.setHex(s3 ? (s3.s.kind === 'ball' && s3.s.d > s3.s.b.r * G.cfg.slideAt ? 0xffd23a : 0x5aff8a) : 0xff5040); V.ring.scale.setScalar(1 + Math.sin(V.t * 10) * 0.08); } }
  // the crowd jumps up for splashes and the finish
  if (V.crowd && FX.cheer > 0) { const m = new T.Matrix4(); V.crowdP.forEach((q, i) => { m.makeTranslation(q.x, q.y + Math.abs(Math.sin(V.t * 9 + i)) * 0.3 * Math.min(1, FX.cheer), q.z); V.crowd.setMatrixAt(i, m); }); V.crowd.instanceMatrix.needsUpdate = true; }
  FX.cheer = Math.max(0, (FX.cheer || 0) - dt * 0.6);
  // the camera: a clear angle for each obstacle, changing smoothly while you are on a safe platform
  const onSafe = !P.on || P.on.kind === 'plat' || P.state === 'fall'; if (onSafe || !ui.cam) ui.sec = sectionOf(G); else if (P.on && P.on.o && P.on.o !== ui.sec) ui.sec = P.on.o; const want = camFor(G, ui.sec);
  if (!ui.cam || ui.snap) { ui.cam = { pos: want.pos.slice(), at: want.at.slice() }; ui.snap = false; } else { const a = Math.min(1, dt * 3); for (let i = 0; i < 3; i++) { ui.cam.pos[i] += (want.pos[i] - ui.cam.pos[i]) * a; ui.cam.at[i] += (want.at[i] - ui.cam.at[i]) * a; } }
  if (onSafe || P.state === 'ground' && P.on.kind !== 'ledge' && want.phi === 0) ui.phi = want.phi;
  const sk = FX.shake > 0 && optShake() ? (Math.random() - 0.5) * FX.shake * 0.02 : 0, cam = W3.cam; cam.position.set(-ui.cam.pos[0] + sk, ui.cam.pos[1] + sk, ui.cam.pos[2]); cam.lookAt(-ui.cam.at[0], ui.cam.at[1], ui.cam.at[2]); cam.updateMatrixWorld();
  W3.setFocus(-P.x, TOP, P.z + 3, 18); }
const GSTEP = 0.1; let ghostFor = null, ghostT = null;
function ghostTrace(G) { if (HEADLESS || !G) return null; if (ghostFor !== G.N) { ghostFor = G.N; ghostT = store.get('ghost' + G.N, null); } return ghostT; }
function scrOf(x, y, z) { if (!V3 || V3.none) return null; return W3.screen(new V3.T.Vector3(-x, y, z)); }
// ---------- events ----------
function onEvent(G, e) { const P = G.p;
  switch (e.k) {
    case 'jump': sfx.jump(e.pw); vibe(HAP.light); break;
    case 'land': if (e.on === 'ball') { sfx.squeak(e.clean); if (e.clean) say('CLEAN!', W / 2, H * 0.34, '#8fe0ab', 22); else tip2('edge', 'Near the edge you slide: push back towards the middle!', 3); } else sfx.thud(); vibe(HAP.light); break;
    case 'slide': sfx.slip(); break;
    case 'splash': { const p = scrOf(e.x, 0.2, e.z) || { x: W / 2, y: H * 0.7 }; sfx.splash(); burst(p.x, p.y, '#e8fbff', 46, 320, 220); burst(p.x, p.y, '#7fe0ff', 24, 220, 160); FX.cheer = 1.2; sfx.crowd(false);
      say(['SPLASH!', 'SPLOOSH!', 'KER-SPLASH!', 'OOPS!'][G.falls % 4], W / 2, H * 0.3, '#7fe0ff', 34);
      hint = { txt: e.why === 'punch' ? 'Punched! Wait in a gap until the glove ahead has punched and pulled back.' : e.why === 'arm' ? 'The arm got you: tap JUMP just before it reaches you.' : e.why === 'high' ? 'The high arm: hold DUCK as it comes.' : e.why === 'bar' ? 'The red bar: jump it as it sweeps round.' : e.why === 'slid' ? 'You slid off the edge: land nearer the middle, or push back towards it.' : 'Missed! Watch the ring as you hold JUMP: let go when it is green.', t: 0, secs: 2.6 }; } break;
    case 'hit': sfx.bonk(); vibe(HAP.thud); FX.shake = 10; { const p = scrOf(P.x, P.y + 1, P.z); if (p) burst(p.x, p.y, '#ffd23a', 14, 200); } break;
    case 'trip': sfx.bonk(); vibe(HAP.thud); FX.shake = 6; say(e.why === 'bar' ? 'BONK! DUCK!' : 'TRIPPED! JUMP IT!', W / 2, H * 0.32, '#ffb0a0', 26); break;
    case 'bump': sfx.boing(); break;
    case 'pass': sfx.coin(e.n); say(`${e.n} / ${e.need}`, W / 2, H * 0.3, '#8fe0ab', 30); break;
    case 'sweepdone': say('GATE OPENING!', W / 2, H * 0.3, '#ffd23a', 28); break;
    case 'gate': sfx.fanfare(); break;
    case 'cp': { const o = G.C.obs[e.i]; FX.cheer = 0.8; sfx.chime(); if (o) ui.banner = { txt: KNAME[o.kind].toUpperCase(), sub: TIPS[o.kind], t: 0, secs: 2.2, small: true }; } break;
    case 'respawn': ui.snap = true; break;
    case 'lessonnext': if (e.first) hint = null; say('FIRST, A PRACTICE RUN', W / 2, H * 0.36, '#ffd36a', 24); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, W / 2, H * 0.42, '#8fe0ab', 24); sfx.coin(e.n); break;
    case 'lessonmiss': hint = { txt: e.how, t: 0, secs: 3.2 }; break;
    case 'lessondone': say('NOW FOR REAL!', W / 2, H * 0.36, '#ffd36a', 26); sfx.fanfare(); ui.snap = true; if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.fanfare(); FX.flash = 0.5; FX.cheer = 2.5; vibe(HAP.best); sfx.crowd(true); { const p = scrOf(P.x, P.y + 1, P.z) || { x: W / 2, y: H / 2 }; for (const c of ['#ffd23a', '#ff4a3a', '#2ab8ff', '#8ae02a']) burst(p.x, p.y, c, 18, 300, 200); } break;
    case 'lost': sfx.lose(); ui.banner = { txt: 'OUT OF TIME', sub: 'Over the qualifying time', t: 0, secs: 2 }; break;      // (P11: never vibrate on failure)
  } }
const TIPS = { balls: 'Hold JUMP, let go when the ring sits on the next ball', sweep: 'Tap JUMP just before the arm reaches you', wall: 'Stop in the gaps; go after a glove punches', belt: 'Run! Steer round, jump the low ones, duck the high ones', cross: 'Hop on, ride it round, hop off facing the exit' };
// ---------- the picture ----------
let IG = null, IM = {}; function idleG() { if (!IG || IG.over || IG.t > 50) { IG = newGame(10, { seed: (Math.random() * 1e6) | 0 }); IG.qual = 1e9; IM = {}; } honest(IG, { react: 0.2, acc: 0.95 }, IM); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#0aa8c8'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D course.', W / 2, H / 2); if (G) hud(G, now); return; }
  const g = G || idleG(); sync(V, g, dt || 1 / 60); W3.render(dt || 1 / 60);
  if (G && !(G.over && !$('ovEnd').classList.contains('hidden'))) hud(G, now);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 1.1 ? 1 : 1 - (t2.t - 1.1) / 0.5; ctx.globalAlpha = Math.max(0, al); ctx.font = `400 ${Math.round(t2.size * k)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(0,40,70,.7)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 18); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 18); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, Math.min(W - 380 * k, 420 * k)), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30, hy = H - 46 * k - h / 2;
    ctx.fillStyle = 'rgba(0,40,70,.9)'; rrect(W / 2 - w / 2, hy - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, hy - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,255,240,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); } }
// ---------- the HUD ----------
function layout(G) { return { jump: { x: W - 86 * k, y: H - 88 * k, r: 60 * k }, duck: { x: W - 196 * k, y: H - 58 * k, r: 38 * k } }; }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of String(t).split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function txt(s, x, y, col = '#fff', font, al = 'center') { ctx.textAlign = al; if (font) ctx.font = font; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,40,70,.7)'; ctx.strokeText(s, x, y); ctx.fillStyle = col; ctx.fillText(s, x, y); }
const fmt = s => { s = Math.max(0, s); const m = Math.floor(s / 60), r = s - m * 60; return (m ? m + ':' + (r < 10 ? '0' : '') : '') + r.toFixed(1); };
function hud(G, now) { ctx.textBaseline = 'middle'; const L = layout(G), P = G.p;
  // the clock, the qualifying time, the ghost's lead
  { const y = 22 * k, left = G.qual - G.clock, warn = !G.lesson && !G.free && left < 10; ctx.fillStyle = 'rgba(0,40,70,.55)'; rrect(W / 2 - 150 * k, y - 16 * k, 300 * k, 32 * k, 12); ctx.fill();
    txt(fmt(G.clock), W / 2 - 60 * k, y + 1, warn ? (Math.floor(now * 4) % 2 ? '#ff8a7a' : '#fff') : '#fff', `400 ${Math.round(20 * k)}px ${TF}`);
    txt(G.lesson || G.free ? 'practice: no clock' : `qualify ${fmt(G.qual)} · gold ${fmt(G.par)}`, W / 2 + 50 * k, y + 1, 'rgba(255,255,255,.85)', `700 ${Math.round(12 * k)}px ${BC}`);
    const gt = ghostTrace(G); if (gt && optGhost() && !G.lesson) { const i = Math.min(gt.length - 1, Math.floor(G.clock / GSTEP)), gz = gt[i][2], d = P.z - gz; txt(d >= 0 ? `👻 you lead by ${d.toFixed(1)} m` : `👻 ${(-d).toFixed(1)} m behind your best`, W / 2, y + 26 * k, d >= 0 ? '#8fe0ab' : '#ffd0a0', `700 ${Math.round(11 * k)}px ${BC}`); }
    // progress along the course: a bar with a dot per obstacle
    const bx = 70 * k, bw = 170 * k, by = 22 * k, fz = G.C.finZ, u = clamp(P.z / fz, 0, 1); ctx.fillStyle = 'rgba(0,40,70,.55)'; rrect(bx - 8 * k, by - 9 * k, bw + 16 * k, 18 * k, 9); ctx.fill(); ctx.fillStyle = '#ffd23a'; rrect(bx, by - 3 * k, bw * u, 6 * k, 3); ctx.fill();
    G.C.obs.forEach((o, i) => { const x = bx + bw * clamp(o.z0 / fz, 0, 1); ctx.fillStyle = i < G.cp ? '#8fe0ab' : '#fff'; ctx.beginPath(); ctx.arc(x, by, 4 * k, 0, TAU); ctx.fill(); });
    if (G.falls) txt(`💦 ${G.falls}`, bx + bw + 30 * k, by, '#7fe0ff', `700 ${Math.round(13 * k)}px ${BC}`); }
  // the sweeper's count
  const o = ui.sec; if (o && o.kind === 'sweep' && !o.open) txt(`${o.n} / ${o.need} sweeps`, W / 2, 70 * k, '#ffd23a', `400 ${Math.round(20 * k)}px ${TF}`);
  if (o && o.kind === 'sweep' && o.fast && o.k > 1 && !o.open) txt('FAST ROUND (red arm)', W / 2, 92 * k, '#ff8a7a', `700 ${Math.round(12 * k)}px ${BC}`);
  if (o && o.kind === 'belt' && o.warn) txt('SPEED-UP COMING!', W / 2, 70 * k, '#ff8a7a', `400 ${Math.round(18 * k)}px ${TF}`);
  // the move stick (left)
  if (ui.stick) { const s2 = ui.stick, R = 56 * k; ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.beginPath(); ctx.arc(s2.x0, s2.y0, R, 0, TAU); ctx.fill(); const dx = s2.x - s2.x0, dy = s2.y - s2.y0, m = Math.hypot(dx, dy), c = m > R ? R / m : 1; ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.arc(s2.x0 + dx * c, s2.y0 + dy * c, 22 * k, 0, TAU); ctx.fill(); }
  else if (G.t < 6 || G.lesson) txt('◀ MOVE ▶', 110 * k, H - 70 * k, 'rgba(255,255,255,.85)', `700 ${Math.round(13 * k)}px ${BC}`);
  // JUMP (with its power ring) and DUCK
  { const B = L.jump, on = G.jumpHeld, pw = G.charging ? Math.min(1, G.charge / CH) : 0; ctx.globalAlpha = 0.92; ctx.fillStyle = on ? '#d0801a' : 'rgba(0,40,70,.55)'; ctx.beginPath(); ctx.arc(B.x, B.y, B.r * (on ? 0.94 : 1), 0, TAU); ctx.fill(); ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 3; ctx.stroke();
    if (pw > 0) { ctx.strokeStyle = pw >= 1 ? '#ff5040' : '#8fe0ab'; ctx.lineWidth = 8 * k; ctx.beginPath(); ctx.arc(B.x, B.y, B.r + 8 * k, -Math.PI / 2, -Math.PI / 2 + TAU * pw); ctx.stroke(); }
    txt('JUMP', B.x, B.y - 4 * k, '#fff', `400 ${Math.round(20 * k)}px ${TF}`); txt('hold = farther', B.x, B.y + 17 * k, 'rgba(255,255,255,.85)', `700 ${Math.round(10 * k)}px ${BC}`);
    const D = L.duck; ctx.fillStyle = G.duckHeld ? '#d0801a' : 'rgba(0,40,70,.55)'; ctx.beginPath(); ctx.arc(D.x, D.y, D.r, 0, TAU); ctx.fill(); ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 2; ctx.stroke(); txt('DUCK', D.x, D.y, '#fff', `400 ${Math.round(14 * k)}px ${TF}`); ctx.globalAlpha = 1; }
  if (G.lesson) lessonPanel(G);
  if (ui.banner) { const b = ui.banner, a = Math.min(1, b.t / 0.2, ((b.secs || 1.6) - b.t) / 0.4); ctx.globalAlpha = Math.max(0, a); txt(b.txt, W / 2, H * 0.22, '#ffd23a', `400 ${Math.round((b.small ? 26 : 34) * k)}px ${TF}`); if (b.sub) txt(b.sub, W / 2, H * 0.22 + 27 * k, '#fff', `700 ${Math.round(14 * k)}px ${BC}`); ctx.globalAlpha = 1; } }
function lessonPanel(G) { const D = G.lesson, st0 = D.steps[D.i], w = Math.min(W - 300 * k, 420 * k), x = W / 2 - w / 2, y = 52 * k; ctx.save();
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; const lines = wrapText(st0.how, w - 24), h = 50 * k + lines.length * 17 * k;
  ctx.fillStyle = 'rgba(0,40,70,.88)'; rrect(x, y, w, h, 12); ctx.fill(); ctx.strokeStyle = 'rgba(255,210,58,.8)'; ctx.lineWidth = 2; rrect(x, y, w, h, 12); ctx.stroke();
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#ffd23a'; ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillText(`LESSON ${G.N} OF 3`, x + 12, y + 9 * k);
  ctx.fillStyle = '#fff'; ctx.font = `400 ${Math.round(15 * k)}px ${TF}`; ctx.fillText(st0.title, x + 12, y + 23 * k);
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.92)'; lines.forEach((l, i) => ctx.fillText(l, x + 12, y + 45 * k + i * 17 * k));
  const need = Math.min(D.need, 8); for (let i = 0; i < need; i++) { ctx.beginPath(); ctx.arc(x + w - 16 - (need - 1 - i) * 18 * k, y + 16 * k, 6 * k, 0, TAU); if (i < D.n) { ctx.fillStyle = '#8fe0ab'; ctx.fill(); } else { ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; ctx.stroke(); } }
  ctx.restore(); ctx.textBaseline = 'middle'; }
