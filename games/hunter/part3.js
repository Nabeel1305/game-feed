// ===================== THE VIEW: Hunter in 3D (three.js through tools/world3d.js) =====================
// The ice-age steppe at the foot of snowy mountains; you crouch in grass taller than your eyes; the animal grazes ahead; your
// spear in your right hand. Game (x, z) is three.js (x, y, -z).
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [];
let hint = null, V3 = null;
const EYE = 1.05;
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 6) TXT.shift(); }
function tip(key, txt, secs = 2.8) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function fxStep(dt) {
  FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 1.5);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.3) TXT.shift();
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; }
}
const g2w = (x, z, y = 0) => new THREE.Vector3(x, y, -z);
let HGT = null;
function buildWorld() {
  if (V3) return V3; const T = THREE; if (!W3 || !W3.init({ canvas: $('gl'), fov: 66, far: 6000, near: 0.05 })) { V3 = { none: true }; return V3; }
  const S = W3.scene, R0 = W3.rng(31), N3 = new T.ImprovedNoise();
  HGT = (x, z) => N3.noise(x * 0.012, 0.3, z * 0.012) * 3 + N3.noise(x * 0.05, 1.3, z * 0.05) * 0.5 + Math.max(0, Math.hypot(x, z - 40) - 350) * 0.12;
  const mtn = (x, z) => { const d = Math.hypot(x, z - 40); return d < 900 ? 0 : (d - 900) / 2500 * 700 * (0.5 + 0.5 * N3.noise(x * 0.0015, 4, z * 0.0015)) + N3.noise(x * 0.006, 2, z * 0.006) * 60 * Math.min(1, (d - 900) / 600); };
  const colour = (x, z, h, sl) => { const n = 0.5 + 0.5 * N3.noise(x * 0.04, 7, z * 0.04), m = 0.5 + 0.5 * N3.noise(x * 0.008, 9, z * 0.008);
    if (h > 260 + 60 * n && sl < 0.6) return [0.9, 0.92, 0.95]; if (sl > 0.45) return [0.4, 0.38, 0.35];
    return [0.42 + 0.12 * n - 0.1 * m, 0.4 + 0.08 * n, 0.2 + 0.04 * n]; };
  const gt = W3.grainTex(256, 3, 205, 60, 2); gt.repeat.set(90, 90);
  W3.terrain({ size: 1600, seg: 160, x: 0, z: -40, height: (x, z) => HGT(x, -z), colour: (x, z, h, s) => colour(x, -z, h, s), map: gt });
  W3.terrain({ size: 9000, seg: 120, x: 0, z: -40, height: (x, z) => { const inside = Math.abs(x) < 790 && Math.abs(z + 40) < 790; return (inside ? -6 : 0) + HGT(x, -z) + mtn(x, -z); }, colour: (x, z, h, s) => colour(x, -z, h, s), map: gt });
  // grass: thousands of clumps of tall blades, swaying in the wind (moved by the graphics chip)
  const gc = document.createElement('canvas'); gc.width = 128; gc.height = 256; { const g = gc.getContext('2d'); for (let i = 0; i < 70; i++) { const x = 8 + R0() * 112, h = 120 + R0() * 130, lean = (R0() - 0.5) * 40; g.strokeStyle = `hsl(${42 + R0() * 30},${35 + R0() * 25}%,${32 + R0() * 26}%)`; g.lineWidth = 1.5 + R0() * 2.5; g.beginPath(); g.moveTo(x, 256); g.quadraticCurveTo(x + lean * 0.3, 256 - h * 0.6, x + lean, 256 - h); g.stroke(); } }
  const gtx = new T.CanvasTexture(gc); gtx.colorSpace = T.SRGBColorSpace;
  const q1 = new T.PlaneGeometry(1.3, 0.95); q1.translate(0, 0.47, 0); const q2 = q1.clone(); q2.rotateY(Math.PI / 2); const clumpG = T.mergeGeometries([q1, q2]);
  const grassM = new T.MeshStandardMaterial({ map: gtx, alphaTest: 0.45, side: T.DoubleSide, roughness: 0.9 });
  grassM.onBeforeCompile = sh => { sh.uniforms.wt = W3.S.windU = { value: 0 }; sh.vertexShader = 'uniform float wt;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n float sway = position.y * position.y * 0.09 * sin(wt * 1.7 + instanceMatrix[3].x * 0.3 + instanceMatrix[3].z * 0.21);\n transformed.x += sway; transformed.z += sway * 0.5;'); };
  const NG = 6000, grass = new T.InstancedMesh(clumpG, grassM, NG), D = new T.Object3D(), C = new T.Color();
  for (let i = 0; i < NG; i++) { const r = Math.pow(R0(), 0.6) * 90, a = R0() * 6.28, x = Math.cos(a) * r * 0.8, z = 25 + Math.sin(a) * r; D.position.set(x, HGT(x, z) - 0.05, -z); D.rotation.set(0, R0() * 3, 0); const s = 0.7 + R0() * 0.6; D.scale.set(s, 0.5 + R0() * 0.3, s); D.updateMatrix(); grass.setMatrixAt(i, D.matrix); C.setHSL(0.13 + R0() * 0.04, 0.3, 0.55 + R0() * 0.25); grass.setColorAt(i, C); }
  S.add(grass);
  // a few pines and boulders
  const trees = []; for (let i = 0; i < 160; i++) { const a = R0() * 6.28, r = 70 + R0() * 500, x = Math.cos(a) * r, z = 40 + Math.sin(a) * r; trees.push({ x, y: HGT(x, z) - 0.3, z: -z, s: 1 + R0() * 1.3, rot: R0() * 6, hue: R0() - 0.5, shade: R0() - 0.6 }); }
  W3.pines(trees, { shadow: false });
  const rockM = new T.MeshStandardMaterial({ color: 0x8f8b84, roughness: 0.85, map: W3.grainTex(128, 6, 160, 70, 2) });
  for (let i = 0; i < 40; i++) { const a = R0() * 6.28, r = 15 + R0() * 200, x = Math.cos(a) * r, z = 40 + Math.sin(a) * r, rk = new T.Mesh(new T.DodecahedronGeometry(0.6 + R0() * 1.6, 1), rockM); rk.position.set(x, HGT(x, z) + 0.2, -z); rk.rotation.set(R0(), R0(), R0()); rk.scale.y = 0.6; rk.castShadow = true; S.add(rk); }
  // your arm and spear (seen low on the right), the spear in flight, the aim mark
  const skin = new T.MeshStandardMaterial({ color: 0x8e5f3e, roughness: 0.6 }), wood = new T.MeshStandardMaterial({ color: 0x7a5a36, roughness: 0.8 }), flint = new T.MeshStandardMaterial({ color: 0x3a3a40, roughness: 0.35, metalness: 0.2 }), fur = new T.MeshStandardMaterial({ color: 0x5b4330, roughness: 1 });
  const mkSpear = () => { const g = new T.Group(); const sh = new T.Mesh(new T.CylinderGeometry(0.018, 0.022, 2.2, 8), wood); sh.rotation.x = Math.PI / 2; const tip = new T.Mesh(new T.ConeGeometry(0.04, 0.22, 4), flint); tip.rotation.x = -Math.PI / 2; tip.position.z = -1.2; const lash = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 0.09, 6), fur); lash.rotation.x = Math.PI / 2; lash.position.z = -1.06; g.add(sh, tip, lash); g.traverse(o => o.castShadow = true); return g; };
  const hand = new T.Group(); { const arm = new T.Mesh(new T.CapsuleGeometry(0.05, 0.38, 4, 10), skin); arm.rotation.x = Math.PI / 2 - 0.3; arm.position.set(0, -0.06, 0.18); const wrap = new T.Mesh(new T.CylinderGeometry(0.062, 0.062, 0.12, 10), fur); wrap.rotation.x = Math.PI / 2 - 0.3; wrap.position.set(0, -0.03, 0.3); const fist = new T.Mesh(new T.SphereGeometry(0.06, 10, 8), skin); hand.add(arm, wrap, fist); const sp = mkSpear(); sp.position.z = -0.35; hand.add(sp); hand.userData.sp = sp; }
  S.add(hand);
  const flying = mkSpear(); flying.visible = false; S.add(flying);
  const aim = new T.Mesh(new T.RingGeometry(0.3, 0.42, 32), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, depthWrite: false })); aim.rotation.x = -Math.PI / 2; aim.visible = false; aim.renderOrder = 3; S.add(aim);
  V3 = { T, S, N3, grass, hand, flying, mkSpear, aim, beasts: {}, lion: null, look: new T.Vector3(0, 0, -20), yaw: 0, sky: null, stuck: [] };
  W3.setQuality(stepN); return V3;
}
// an animal from simple shapes: body, neck, head, four legs that walk, a tail; antlers, a mane, tusks or fur by kind
function beast(id) {
  const T = THREE, V = V3; if (V.beasts[id]) return V.beasts[id];
  const col = { deer: 0x8a5634, horse: 0x7a6142, boar: 0x3e3127, bison: 0x4a3524, mammoth: 0x5b3f2a, lion: 0xb08a55 }[id], m = new T.MeshStandardMaterial({ color: col, roughness: 0.9, map: W3.grainTex(128, id.length * 7, 190, 50, 3) }), dark = new T.MeshStandardMaterial({ color: 0x1e1712, roughness: 0.8 }), pale = new T.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 0.5 });
  const sz = { deer: 1, horse: 1.15, boar: 0.62, bison: 1.35, mammoth: 2.6, lion: 0.95 }[id], g = new T.Group(), body = new T.Group(); g.add(body);
  const cap = (r, l, mat, x, y, z, rx = 0, rz = 0, par = body) => { const o = new T.Mesh(new T.CapsuleGeometry(r, l, 6, 12), mat); o.position.set(x, y, z); o.rotation.set(rx, 0, rz); o.castShadow = true; par.add(o); return o; };
  const legH = id === 'boar' ? 0.38 : id === 'mammoth' ? 0.9 : id === 'bison' ? 0.6 : 0.75;
  cap(0.28 * (id === 'bison' ? 1.3 : id === 'mammoth' ? 1.35 : id === 'boar' ? 1.1 : 1), 0.85, m, 0, legH + 0.32, 0, Math.PI / 2);
  if (id === 'bison') cap(0.33, 0.25, m, 0, legH + 0.62, 0.32, 0.4);
  const neck = new T.Group(); neck.position.set(0, legH + 0.45, 0.55); body.add(neck); const head = new T.Group(); neck.add(head);
  if (id !== 'boar' && id !== 'mammoth') cap(0.11, 0.42, m, 0, 0.22, 0.12, -0.55, 0, neck);
  head.position.set(0, id === 'boar' || id === 'mammoth' ? 0.0 : 0.45, id === 'boar' ? 0.15 : 0.32);
  cap(id === 'mammoth' ? 0.32 : 0.1, id === 'mammoth' ? 0.2 : 0.28, m, 0, 0, 0.1, Math.PI / 2 - 0.3, 0, head);
  for (const s of [-1, 1]) { const e = new T.Mesh(new T.SphereGeometry(0.022, 8, 6), dark); e.position.set(s * 0.085 * (id === 'mammoth' ? 2.5 : 1), 0.06, 0.12); head.add(e);
    if (id !== 'mammoth') { const ear = new T.Mesh(new T.ConeGeometry(0.04, 0.12, 6), m); ear.position.set(s * 0.08, 0.14, 0); ear.rotation.z = -s * 0.5; head.add(ear); ear.userData.ear = s; } }
  if (id === 'deer') for (const s of [-1, 1]) { const a = cap(0.012, 0.45, pale, s * 0.08, 0.36, 0.0, -0.3, -s * 0.5, head); for (let t = 0; t < 3; t++) cap(0.009, 0.16, pale, s * (0.12 + t * 0.04), 0.4 + t * 0.12, 0.02, -0.6, -s * 1.1, head); }
  if (id === 'horse') cap(0.04, 0.42, dark, 0, 0.32, 0.0, -0.5, 0, neck);
  if (id === 'boar' || id === 'mammoth') for (const s of [-1, 1]) { const tk = new T.Mesh(new T.TorusGeometry(id === 'mammoth' ? 0.55 : 0.08, id === 'mammoth' ? 0.05 : 0.012, 6, 14, 2.2), pale); tk.position.set(s * (id === 'mammoth' ? 0.22 : 0.05), -0.12, id === 'mammoth' ? 0.55 : 0.22); tk.rotation.set(0, s * 0.3 + Math.PI / 2, 0.4); head.add(tk); }
  if (id === 'mammoth') { const trunk = cap(0.09, 0.9, m, 0, -0.55, 0.25, 0.2, 0, head); }
  const legs = []; for (const [lx, lz] of [[-0.14, 0.38], [0.14, 0.38], [-0.14, -0.38], [0.14, -0.38]]) { const p = new T.Group(); p.position.set(lx * (id === 'mammoth' ? 1.6 : 1), legH, lz); body.add(p); cap(0.045 * (id === 'mammoth' ? 2.6 : id === 'bison' ? 1.5 : 1), legH * 0.85, id === 'deer' || id === 'horse' ? m : m, 0, -legH * 0.5, 0, 0, 0, p); legs.push(p); }
  cap(0.03, 0.25, id === 'horse' ? dark : m, 0, legH + 0.3, -0.62, -0.6);
  g.scale.setScalar(sz); g.userData = { body, neck, head, legs, legH };
  V.beasts[id] = g; V.S.add(g); return g;
}
function setWeather(G) {
  const V = buildWorld(); if (V.none || V.sky === G.weather) return; V.sky = G.weather;
  W3.setSky(G.weather, { azim: { dawn: 120, sunset: 200, golden: 210, dusk: 195 }[G.weather] || 160, wind: [0.8, 0.3] });
  W3.S.onBolt = () => { if (!HEADLESS && sfx.thunder) setTimeout(() => sfx.thunder(), 300 + Math.random() * 900); };
}
function onEvent(G, e) {
  const cx = W / 2, cy = H * 0.3;
  switch (e.k) {
    case 'animal': break;
    case 'tell': sfx.tell(); break;
    case 'look': break;
    case 'heard': if (gate('heardfx', 500)) sfx.snort(); break;
    case 'seen': if (!gate('seenfx', 400)) break; FX.red = Math.max(FX.red, 0.25); sfx.snort(); break;
    case 'throw': sfx.throw(); vibe(HAP.light); break;
    case 'hit': if (e.vital) { FX.stop = 0.08; FX.shake = 6; sfx.thud(true); vibe(HAP.thud); } else { sfx.thud(false); say('ONLY WOUNDED', cx, cy, '#ffd0c4', 24); } break;
    case 'kill': say(G.kills.length >= G.cfg.goal ? 'THE HUNT IS WON' : 'DOWN!', cx, cy, '#ffe08a', 32); sfx.kill(e.n); FX.flash = 0.6; vibe(HAP.best); break;
    case 'missed': sfx.miss(); say('MISSED', cx, cy, '#ffd0c4', 24); tip('miss', 'Get closer: the spear is steadier', 2.8); break;
    case 'staggers': say('IT STAGGERS: AGAIN!', cx, cy, '#ffe08a', 24); break;
    case 'bolt': sfx.bolt(); say(e.why === 'seen' ? 'IT SAW YOU!' : e.why === 'heard' ? 'IT HEARD YOU RUN!' : 'IT GOT AWAY', cx, cy, '#ffb4a8', 28); FX.red = 0.4; tip('bolt_' + e.why, e.why === 'seen' ? 'Let go of the stick the moment its ears flick' : e.why === 'heard' ? 'Running is loud: creep (a gentle push) when you are close' : 'Aim at the chest, just behind the front legs', 3); break;
    case 'calm': break;
    case 'growl': sfx.growl(e.side); FX.shake = 4; vibe(HAP.heavy); say(e.side < 0 ? '◀ GROWL' : 'GROWL ▶', e.side < 0 ? W * 0.25 : W * 0.75, H * 0.45, '#ffb48a', 30); tip('lion', 'Tap the side of the growl to face it, then tap when it leaps', 3); break;
    case 'turn': sfx.turn(); break;
    case 'leap': sfx.roar(); FX.shake = 10; break;
    case 'lionkill': FX.stop = 0.1; FX.flash = 0.8; FX.shake = 14; sfx.brace(); say('YOU HELD IT!', cx, cy, '#ffe08a', 32); vibe(HAP.best); break;
    case 'maul': FX.red = 1; FX.shake = 16; sfx.maul(); say(e.why === 'wrongway' ? 'IT CAME FROM BEHIND!' : e.why === 'soon' ? 'TOO SOON!' : 'TOO LATE!', cx, cy, '#ffb4a8', 28); break;
    case 'lessonnext': if (e.first) hint = null; say(e.first ? 'FIRST, A LESSON' : 'NEXT LESSON', cx, H * 0.5, '#ffd36a', 26); sfx.ding(); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, cx, H * 0.5, '#9be3b5', 26); sfx.coin(e.n); break;
    case 'lessonmiss': hint = { txt: e.how, t: 0, secs: 3.6 }; break;
    case 'lessondone': say('NOW HUNT!', cx, H * 0.5, '#ffd36a', 28); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); vibe(HAP.best); break;
    case 'lost': sfx.lose(); break;
  }
}
const ui = { snap: false, aim: null, drag: null, stick: null, ch: null, aiming: null, fireT: 0 };
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#0b1418'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D steppe.', W / 2, H / 2); return; }
  const T = V.T, cam = W3.cam, g = G || idleG(), me = g.me, a = g.a, t = now; setWeather(g);
  if (W3.S.windU) W3.S.windU.value = t;
  // the animal
  for (const id in V.beasts) V.beasts[id].visible = false;
  const B = beast(a.kind.id), U = B.userData; B.visible = true; B.position.copy(g2w(a.x, a.z, HGT(a.x, a.z))); B.rotation.set(0, Math.PI - a.face, 0);
  const running = a.st === 'flee', walk = a.st === 'graze' ? 0.25 : running ? 1 : 0, ph = t * (running ? 14 : 3);
  U.legs.forEach((l, i) => l.rotation.x = Math.sin(ph + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI / 2 : 0)) * 0.5 * walk);
  const headDown = a.st === 'graze' ? 0.9 : a.st === 'tell' ? 0.35 + Math.sin(t * 30) * 0.08 : 0; U.neck.rotation.x += (headDown - U.neck.rotation.x) * Math.min(1, dt * 6);
  U.body.rotation.z = a.st === 'dead' ? Math.min(1.45, (U.body.rotation.z || 0) + dt * 3) : 0; U.body.position.y = a.st === 'dead' ? -0.2 : running ? Math.abs(Math.sin(ph)) * 0.08 : 0;
  // camera: crouched at my place, facing the animal, or the lion when I have turned
  const toA = Math.atan2(a.x - me.x, a.z - me.z), Ln = g.lion; let yaw = toA; if (Ln && Ln.st !== 'gone' && me.face) yaw = toA + me.face * Math.PI / 2;
  if (ui.snap) V.yaw = yaw; else { let dy = yaw - V.yaw; while (dy > Math.PI) dy -= 2 * Math.PI; while (dy < -Math.PI) dy += 2 * Math.PI; V.yaw += dy * Math.min(1, dt * 7); } ui.snap = false;
  const bob = me.creep ? Math.sin(t * 7) * 0.025 : 0, eye = g2w(me.x, me.z, HGT(me.x, me.z) + EYE + bob);
  cam.position.copy(eye); cam.fov = innerWidth > innerHeight ? 40 : 48; cam.updateProjectionMatrix();      // (a longer lens since 22 Nov 2026: the animal was a speck)
  cam.lookAt(eye.clone().add(new T.Vector3(Math.sin(V.yaw) * 10, -0.35, -Math.cos(V.yaw) * 10))); cam.rotateZ(Math.sin(t * 3.5) * 0.004 * (me.creep ? 3 : 1));
  if (FX.shake > 0) { cam.rotation.x += (Math.random() - 0.5) * FX.shake * 0.002; cam.rotation.y += (Math.random() - 0.5) * FX.shake * 0.002; }
  // my arm and spear, low on the right; drawn back while aiming, gone while a spear flies
  const fw = new T.Vector3(Math.sin(V.yaw), 0, -Math.cos(V.yaw)), rt = new T.Vector3(Math.cos(V.yaw), 0, Math.sin(V.yaw)), pull = ui.aiming != null ? 0.55 : ui.fireT > 0 ? 1 : 0, flyingNow = g.spears.some(s => !s.done);
  V.hand.position.copy(eye).addScaledVector(rt, 0.28).addScaledVector(fw, 0.42 - pull * 0.25).add(new T.Vector3(0, -0.32 + pull * 0.18, 0)); V.hand.rotation.set(0, -V.yaw, 0); V.hand.rotateX(0.12 + pull * 0.25);
  V.hand.userData.sp.visible = !flyingNow; if (Ln && Ln.st !== 'gone') { V.hand.rotateX(-0.1); V.hand.position.addScaledVector(rt, -0.12); }
  // the spear in flight
  const s = g.spears[g.spears.length - 1]; V.flying.visible = !!(s && !s.done);
  if (s && !s.done) { const u = s.t / s.T, x = s.x0 + (s.tx - s.x0) * u, z = s.z0 + (s.tz - s.z0) * u, h = HGT(x, z) + 1.2 * (1 - u) + Math.sin(u * Math.PI) * (0.6 + s.T * 2.2) + 0.5 * u;
    const p = g2w(x, z, h), u2 = Math.min(1, u + 0.02), p2 = g2w(s.x0 + (s.tx - s.x0) * u2, s.z0 + (s.tz - s.z0) * u2, HGT(x, z) + 1.2 * (1 - u2) + Math.sin(u2 * Math.PI) * (0.6 + s.T * 2.2) + 0.5 * u2);
    V.flying.position.copy(p); V.flying.lookAt(p.clone().add(p.clone().sub(p2))); }
  if (s && s.done && !s.stuck) { s.stuck = true; const st = V.mkSpear(); st.position.copy(g2w(s.tx, s.tz, HGT(s.tx, s.tz) + 0.6)); st.rotation.set(-1.0, Math.random() * 6, 0); V.S.add(st); V.stuck.push(st); if (V.stuck.length > 6) V.S.remove(V.stuck.shift()); }
  V.aim.visible = false; ui.fireT = Math.max(0, ui.fireT - dt);      // (the old mark on the ground is gone: the crosshair shows the aim)
  // the lion: crouched in the grass to the side, coming; then the leap
  if (!V.lion) V.lion = beast('lion');
  if (Ln && Ln.st !== 'gone') { const L2 = V.lion; L2.visible = true; const ang = toA + Ln.side * Math.PI / 2, d = Ln.st === 'stalk' ? Math.max(3.5, 14 - Ln.t / Ln.leapAt * 10) : Math.max(0.6, 3.5 - Ln.t / g.cfg.leap * 3);
    const lx = me.x + Math.sin(ang) * d, lz = me.z + Math.cos(ang) * d; L2.position.copy(g2w(lx, lz, HGT(lx, lz) + (Ln.st === 'leap' ? Math.sin(Math.min(1, Ln.t / g.cfg.leap) * Math.PI) * 1.2 : 0))); L2.rotation.y = Math.PI - (ang + Math.PI);
    L2.userData.neck.rotation.x = Ln.st === 'stalk' ? 0.2 : -0.3; L2.userData.legs.forEach((l, i) => l.rotation.x = Ln.st === 'leap' ? (i < 2 ? -0.9 : 0.8) : Math.sin(t * 5 + i) * 0.2); }
  W3.setFocus(eye.x + fw.x * 6, eye.y, eye.z + fw.z * 6, 14);
  W3.render(dt);
  if (G) hud(G);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 0.9 ? 1 : 1 - (t2.t - 0.9) / 0.4; ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(t2.size * k)}px ${BC}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 26 * k); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 26 * k); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(16 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 20 * k, h = lines.length * lh + 16 * k, w = Math.min(W - 24, Math.max(...lines.map(l => ctx.measureText(l).width)) + 34);
    ctx.fillStyle = 'rgba(0,0,0,.6)'; rrect(W / 2 - w / 2, H * 0.6 - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.6 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { const gr = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.7); gr.addColorStop(0, 'rgba(160,0,0,0)'); gr.addColorStop(1, `rgba(160,0,0,${FX.red * 0.5})`); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,248,230,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); }
}
let IG = null; function idleG() { if (!IG) IG = newGame(Math.max(1, store.get('level', 1) | 0), { seed: 7 }); IG.a.st = 'graze'; IG.a.t = 0; return IG; }
function weatherName(w) { return { dawn: 'DAWN', morning: 'MORNING', golden: 'GOLDEN HOUR', overcast: 'GREY SKY', mist: 'MIST', sunset: 'SUNSET', noon: 'MIDDAY', dusk: 'DUSK', rain: 'RAIN', storm: 'STORM' }[w] || ''; }
function hud(G) {
  const c = G.cfg, x = 14, y = 44 * k, a = G.a;
  if (G.lesson) lessonPanel(G);
  else { for (let i = 0; i < c.goal; i++) { ctx.fillStyle = i < G.kills.length ? '#ffd36a' : 'rgba(0,0,0,.4)'; ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x + 12 * k + i * 26 * k, y + 8 * k, 9 * k, 0, TAU); ctx.fill(); ctx.stroke(); }
    ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText('CHANCES', W - x - 46 * k, y + 8 * k);
    for (let i = 0; i < c.lives; i++) { ctx.fillStyle = i < G.lives ? '#ff7a4a' : 'rgba(255,255,255,.25)'; ctx.fillRect(W - x - 36 * k + i * 12 * k, y + 2 * k, 6 * k, 13 * k); } }
  if (G.t < 3.2 && !G.lesson) { ctx.globalAlpha = Math.min(1, (3.2 - G.t) / 0.6); ctx.textAlign = 'center'; ctx.font = `700 ${Math.round(15 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.5)';
    const s = `HUNT ${G.N} · ${weatherName(G.weather)} · ${c.boss ? 'THE MAMMOTH' : `BRING DOWN ${c.goal}`}`; ctx.strokeText(s, W / 2, H * 0.2); ctx.fillText(s, W / 2, H * 0.2); ctx.globalAlpha = 1; }
  // the animal's eye: how much it has seen of you; open when it is looking
  if (a.st !== 'dead' && a.st !== 'flee' && V3 && !V3.none) { const p = W3.screen(g2w(a.x, a.z, HGT(a.x, a.z) + 2.4 * a.kind.body)); if (p.front) { const ex = clamp(p.x, 30, W - 30), ey = clamp(p.y, 90, H - 200), r = 13 * k, open = a.st === 'look' ? 1 : a.st === 'tell' ? 0.45 : 0.08;
    ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.ellipse(ex, ey, r * 1.5, r * (0.25 + open * 0.75), 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = a.alert > 0.6 ? '#ff6b5a' : '#fff'; ctx.lineWidth = 2; ctx.stroke();
    if (open > 0.3) { ctx.fillStyle = a.alert > 0.6 ? '#ff6b5a' : '#ffd36a'; ctx.beginPath(); ctx.arc(ex, ey, r * 0.45 * open, 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,90,70,.9)'; ctx.fillRect(ex - r * 1.5, ey + r + 5, r * 3 * clamp(a.alert, 0, 1), 3 * k);
    ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText(`${Math.round(distA(G))} m`, ex, ey + r + 20 * k); } }
  controlsHud(G);
}
// ---------- the controls on screen: the stick (creep / run), the crosshair, THROW; and big prompts for a lion ----------
function layout() { return { fire: { x: W - 74 * k, y: H - 96 * k, r: 50 * k } }; }
// where the crosshair points: on the animal (the upright sheet through it that faces you), or the ground in front of it
function aimPoint() { if (!G || !V3 || V3.none) return G ? { x: G.a.x, z: G.a.z, sx: W / 2, sy: H / 2 } : null; const a = G.a, me = G.me, T = V3.T, cam = W3.cam; cam.updateMatrixWorld(); const c0 = W3.screen(g2w(a.x, a.z, HGT(a.x, a.z) + 0.75 * a.kind.body)), ch = ui.ch || { x: 0, y: 0 }, sx = c0.x + ch.x, sy = c0.y + ch.y;
  const ray = new T.Raycaster(); ray.setFromCamera(new T.Vector2(sx / W * 2 - 1, -(sy / H * 2 - 1)), cam); const o = ray.ray.origin, d = ray.ray.direction, gy = HGT(a.x, a.z);
  const n = new T.Vector3(Math.sin(V3.yaw), 0, -Math.cos(V3.yaw)), pa = g2w(a.x, a.z, gy), den = d.dot(n); let P = null;
  if (Math.abs(den) > 1e-4) { const t = pa.clone().sub(o).dot(n) / den; if (t > 0) P = o.clone().addScaledVector(d, t); }
  if (!P || P.y < gy - 0.05) { const t = (gy - o.y) / (d.y || -1e-4); if (t > 0) P = o.clone().addScaledVector(d, t); else return { x: a.x, z: a.z, sx, sy }; }
  const top = gy + 1.55 * a.kind.body, over = Math.max(0, P.y - top) * 4; return { x: P.x + n.x * over, z: -(P.z + n.z * over), sx, sy }; }
function controlsHud(G) { if (G.over) return; const L = layout(), Ln = G.lion && G.lion.st !== 'gone' ? G.lion : null, a = G.a, me = G.me; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (Ln) { const turned = me.face === Ln.side, pulse = 0.6 + 0.4 * Math.sin(performance.now() / 90);
    for (const sd of [-1, 1]) { const x0 = sd < 0 ? 0 : W / 2, hot = Ln.st === 'stalk' && !me.face && sd === Ln.side; ctx.fillStyle = hot ? `rgba(255,120,60,${0.25 + 0.2 * pulse})` : 'rgba(0,0,0,.18)'; ctx.fillRect(x0, H * 0.62, W / 2, H * 0.38); ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(34 * k)}px ${BC}`; ctx.fillText(sd < 0 ? '◀' : '▶', x0 + W / 4, H * 0.76); ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillText(sd < 0 ? 'TAP: FACE LEFT' : 'TAP: FACE RIGHT', x0 + W / 4, H * 0.84); }
    const msg = Ln.st === 'leap' ? 'NOW! TAP!' : turned ? 'WAIT FOR THE LEAP… THEN TAP' : me.face ? 'WRONG WAY! TAP THE OTHER SIDE' : (Ln.side < 0 ? '◀ A LION ON YOUR LEFT: TAP LEFT' : 'A LION ON YOUR RIGHT: TAP RIGHT ▶'); ctx.font = `700 ${Math.round((Ln.st === 'leap' ? 30 : 17) * k)}px ${BC}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.strokeText(msg, W / 2, H * 0.56); ctx.fillStyle = Ln.st === 'leap' ? '#ffe08a' : '#fff'; ctx.fillText(msg, W / 2, H * 0.56); return; }
  // the crosshair: a circle, four marks and a dot; amber on the animal, green on its chest. It sways as your arm does.
  if (a.st !== 'dead' && a.st !== 'flee' && !G.spears.some(s => !s.done)) { const A = aimPoint(); if (A) { const d = Math.hypot(A.x - me.x, A.z - me.z) || 1, sw = swayOf(G, d), short = Math.max(0, d - 16) * 0.65, lx = A.x + sw.x - (A.x - me.x) / d * short, lz = A.z + sw.z - (A.z - me.z) / d * short, k2 = a.kind;
      const vx = a.x + Math.sin(a.face) * k2.body * 0.5, vz = a.z + Math.cos(a.face) * k2.body * 0.5, onChest = Math.hypot(lx - vx, lz - vz) < k2.vital * (1 - Math.min(0.3, G.cfg.f / 150)) * (lessonNow(G) ? 1.3 : 1), onBody = Math.hypot(lx - a.x, lz - a.z) < k2.body * 0.75;
      let ox = 0, oy = 0; if (V3 && !V3.none) { const gy = HGT(a.x, a.z) + 0.75 * k2.body, p0 = W3.screen(g2w(A.x, A.z, gy)), p1 = W3.screen(g2w(lx, lz, gy)); ox = p1.x - p0.x; oy = (p1.y - p0.y) + Math.sin(G.t * 1.6 + 1.3) * 3 * k; }
      const cx = A.sx + ox, cy = A.sy + oy, col = short > 0 ? '#ff8a6a' : onChest ? '#7dff9a' : onBody ? '#ffd36a' : '#ffffff', r0 = 20 * k; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.45)'; for (let pass = 0; pass < 2; pass++) { ctx.beginPath(); ctx.arc(cx, cy, r0, 0, TAU); for (const [ux, uy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { ctx.moveTo(cx + ux * r0 * 0.55, cy + uy * r0 * 0.55); ctx.lineTo(cx + ux * r0 * 1.5, cy + uy * r0 * 1.5); } ctx.stroke(); ctx.lineWidth = 2.5; ctx.strokeStyle = col; }
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(cx, cy, 2.5 * k, 0, TAU); ctx.fill(); const lab = short > 0 ? 'TOO FAR' : onChest ? 'CHEST: THROW!' : onBody ? 'ON IT (AIM FOR THE CHEST)' : ''; if (lab) { ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.strokeText(lab, cx, cy + r0 * 1.5 + 12 * k); ctx.fillStyle = col; ctx.fillText(lab, cx, cy + r0 * 1.5 + 12 * k); } } }
  // THROW
  { const B = L.fire, on = ui.fireT > 0, can = !G.spears.some(s => !s.done) && a.st !== 'dead' && a.st !== 'flee'; ctx.globalAlpha = can ? 0.95 : 0.4; ctx.fillStyle = on ? '#ffd36a' : '#c8502a'; ctx.beginPath(); ctx.arc(B.x, B.y, B.r * (on ? 0.93 : 1), 0, TAU); ctx.fill(); ctx.strokeStyle = '#ffe8c8'; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(19 * k)}px ${BC}`; ctx.fillText('THROW', B.x, B.y - 2 * k); ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.fillText('tap', B.x, B.y + 16 * k); ctx.globalAlpha = 1;
    if (ui.aiming == null && G.N <= 3) { ctx.globalAlpha = 0.8; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = '#fff'; ctx.fillText('DRAG HERE TO AIM', W * 0.75, H - 190 * k); ctx.globalAlpha = 1; } }
  // the stick: an inner ring (creep) and an outer one (run)
  { const s2 = ui.stick, R = 56 * k, bx = s2 ? s2.x0 : 86 * k, by = s2 ? s2.y0 : H - 100 * k; ctx.globalAlpha = s2 ? 0.9 : 0.5; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(bx, by, R, 0, TAU); ctx.stroke(); ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.arc(bx, by, R * 0.78, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    const dx = s2 ? s2.x - s2.x0 : 0, dy = s2 ? s2.y - s2.y0 : 0, m = Math.hypot(dx, dy), c2 = m > R ? R / m : 1; ctx.fillStyle = me.run ? '#ff9a6a' : me.creep ? '#9be3b5' : 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(bx + dx * c2, by + dy * c2, 20 * k, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.textAlign = 'left'; ctx.fillText(me.run ? 'RUNNING (IT HEARS YOU!)' : me.creep ? 'CREEPING…' : 'GENTLE PUSH: CREEP · FULL PUSH: RUN', 12 * k, Math.min(H - 12 * k, by + R + 16 * k)); ctx.textAlign = 'center'; ctx.globalAlpha = 1; } }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) {
  const D = G.lesson, st = D.steps[D.i], x = 14, w = W - 28, y = 42 * k; ctx.save();
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; const lines = wrapText(st.how, w - 24), h = 54 * k + lines.length * 17 * k;
  ctx.fillStyle = 'rgba(0,0,0,.6)'; rrect(x, y, w, h, 12); ctx.fill(); ctx.strokeStyle = 'rgba(255,211,106,.7)'; ctx.lineWidth = 2; rrect(x, y, w, h, 12); ctx.stroke();
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#ffd36a'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillText(`LESSON ${D.i + 1} OF ${D.steps.length}`, x + 12, y + 10 * k);
  ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(18 * k)}px ${BC}`; ctx.fillText(st.title, x + 12, y + 25 * k);
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.9)'; lines.forEach((l, i) => ctx.fillText(l, x + 12, y + 48 * k + i * 17 * k));
  for (let i = 0; i < st.need; i++) { ctx.beginPath(); ctx.arc(x + w - 16 - (st.need - 1 - i) * 18 * k, y + 18 * k, 6 * k, 0, TAU); if (i < D.n) { ctx.fillStyle = '#8fe0ab'; ctx.fill(); } else { ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; ctx.stroke(); } }
  ctx.restore();
}
