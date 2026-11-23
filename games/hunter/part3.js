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
  // your arm, seen low on the right: a forearm with a fur cuff, a fist with fingers closed round the shaft (23 Nov 2026, his review: "horrible animation with... the spear throw")
  const hand = new T.Group(); { const arm = new T.Group(); hand.add(arm); const fa = new T.Mesh(new T.CylinderGeometry(0.036, 0.052, 0.46, 12), skin); fa.rotation.x = Math.PI / 2 - 0.42; fa.position.set(0.03, -0.1, 0.22); const cuff = new T.Mesh(new T.CylinderGeometry(0.06, 0.066, 0.2, 12), fur); cuff.rotation.x = Math.PI / 2 - 0.42; cuff.position.set(0.045, -0.165, 0.37);
    const palm = new T.Mesh(new T.SphereGeometry(0.048, 12, 10), skin); palm.scale.set(0.95, 1.1, 1.3); palm.position.set(0.012, -0.012, 0.01); arm.add(fa, cuff, palm);
    for (let f = 0; f < 4; f++) { const fg = new T.Mesh(new T.CapsuleGeometry(0.0125, 0.045, 3, 8), skin); fg.rotation.z = 1.25; fg.position.set(-0.012, 0.03, -0.045 + f * 0.03); arm.add(fg); } const th2 = new T.Mesh(new T.CapsuleGeometry(0.014, 0.04, 3, 8), skin); th2.rotation.set(0.9, 0, -0.5); th2.position.set(0.03, 0.03, -0.035); arm.add(th2);
    arm.traverse(o => o.castShadow = false); const sp = mkSpear(); sp.position.z = -0.3; hand.add(sp); hand.userData.sp = sp; }
  S.add(hand);
  const flying = mkSpear(); flying.visible = false; S.add(flying);
  const aim = new T.Mesh(new T.RingGeometry(0.3, 0.42, 32), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, depthWrite: false })); aim.rotation.x = -Math.PI / 2; aim.visible = false; aim.renderOrder = 3; S.add(aim);
  V3 = { T, S, N3, grass, hand, flying, mkSpear, aim, beasts: {}, lion: null, look: new T.Vector3(0, 0, -20), yaw: 0, sky: null, stuck: [], inBody: [], aFace: null, aRef: null };
  W3.setQuality(stepN); return V3;
}
// an animal with joints (part25_quad.js): one of each kind is built and kept
function beast(id) { const V = V3; if (V.beasts[id]) return V.beasts[id]; const R = quadMake(THREE, id, W3.grainTex(128, id.length * 7, 205, 40, 3)); R.g.visible = false; V.S.add(R.g); V.beasts[id] = R; return R; }
function setWeather(G) {
  const V = buildWorld(); if (V.none || V.sky === G.weather) return; V.sky = G.weather;
  W3.setSky(G.weather, { azim: { dawn: 120, sunset: 200, golden: 210, dusk: 195 }[G.weather] || 160, wind: [0.8, 0.3] });
  W3.S.onBolt = () => { if (!HEADLESS && sfx.thunder) setTimeout(() => sfx.thunder(), 300 + Math.random() * 900); };
}
function onEvent(G, e) {
  const cx = W / 2, cy = H * 0.3;
  switch (e.k) {
    case 'animal': if (V3 && V3.inBody) { for (const q of V3.inBody) q.parent && q.parent.remove(q); V3.inBody.length = 0; } break;
    case 'tell': sfx.tell(); break;
    case 'look': break;
    case 'heard': if (gate('heardfx', 500)) sfx.snort(); break;
    case 'seen': if (!gate('seenfx', 400)) break; FX.red = Math.max(FX.red, 0.25); sfx.snort(); break;
    case 'throw': sfx.throw(); vibe(HAP.light); ui.thr = 0; ui.rl = 0; break;
    case 'hit': ui.hurtT = 0.35; if (e.vital) { FX.stop = 0.08; FX.shake = 6; sfx.thud(true); vibe(HAP.thud); } else { sfx.thud(false); say('ONLY WOUNDED', cx, cy - 40 * k, '#ffd0c4', 24); } break;
    case 'kill': say(G.kills.length >= G.cfg.goal ? 'THE HUNT IS WON' : 'DOWN!', cx, cy, '#ffe08a', 32); sfx.kill(e.n); FX.flash = 0.6; vibe(HAP.best); break;
    case 'missed': sfx.miss(); say('MISSED', cx, cy - 40 * k, '#ffd0c4', 24); if (!e.still) tip('miss', 'Get closer: the spear is steadier', 2.8); break;
    case 'staggers': say('IT STAGGERS: AGAIN!', cx, cy, '#ffe08a', 24); break;
    case 'wary': if (gate('waryfx', 900)) { sfx.snort(); FX.red = Math.max(FX.red, 0.2); say('TOO CLOSE!', cx, cy, '#ffb4a8', 22); } break;
    case 'threat': sfx.snort(); sfx.growl(0); FX.shake = 5; vibe(HAP.heavy); say('IT TURNS ON YOU!', cx, H * 0.21, '#ffb48a', 30); tip('charge', 'A charge: keep still, then push the stick hard to one side at the last moment', 3.4); break;
    case 'charge': sfx.bolt(); sfx.roar(); FX.shake = 8; break;
    case 'commit': sfx.tell(); vibe(HAP.light); break;
    case 'dodged': sfx.turn(); sfx.miss(); FX.shake = 10; say('DODGED!', cx, cy, '#9be3b5', 30); vibe(HAP.thud); break;
    case 'winded': sfx.snort(); say('IT IS WINDED: THROW!', cx, cy, '#ffe08a', 26); break;
    case 'gored': FX.red = 1; FX.shake = 18; sfx.maul(); vibe(HAP.heavy); say('IT RAN YOU DOWN!', cx, cy, '#ffb4a8', 30); tip('gored', 'Wait until it is close, then push the stick hard to one side', 3.2); break;
    case 'bolt': sfx.bolt(); say(e.why === 'seen' ? 'IT SAW YOU!' : e.why === 'heard' ? 'IT HEARD YOU RUN!' : e.why === 'close' ? 'TOO CLOSE: IT RAN!' : 'IT GOT AWAY', cx, cy, '#ffb4a8', 28); FX.red = 0.4; tip('bolt_' + e.why, e.why === 'seen' ? 'Let go of the stick the moment its ears flick' : e.why === 'heard' ? 'Running is loud: creep (a gentle push) when you are close' : e.why === 'close' ? 'It will not let you that close: throw from further back' : 'Aim at the chest, just behind the front legs', 3); break;
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
const ui = { snap: false, aim: null, drag: null, stick: null, ch: null, aiming: null, fireT: 0, thr: null, rl: 0, hurtT: 0 };
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#0b1418'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D steppe.', W / 2, H / 2); return; }
  const T = V.T, cam = W3.cam, g = G || idleG(), me = g.me, a = g.a, t = now; setWeather(g);
  if (W3.S.windU) W3.S.windU.value = t;
  // the animal: a jointed body, posed from what it is doing; its heading turns quickly, not in one frame
  for (const id in V.beasts) V.beasts[id].g.visible = false;
  const B = beast(a.kind.id), QS = B.S; B.g.visible = true;
  if (V.aRef !== a || V.aFace == null || ui.snap) { V.aRef = a; V.aFace = a.face; B.fallT = 0; }
  { let df = a.face - V.aFace; while (df > Math.PI) df -= 2 * Math.PI; while (df < -Math.PI) df += 2 * Math.PI; V.aFace += df * Math.min(1, dt * (a.st === 'graze' ? 2.5 : 9)); }
  B.g.position.copy(g2w(a.x, a.z, HGT(a.x, a.z))); B.g.rotation.set(0, Math.PI - V.aFace, 0);
  { const st = a.st, sp = st === 'graze' ? (a.winded > 0 ? 0 : 0.25) : st === 'flee' ? a.kind.speed : st === 'charge' ? a.kind.speed * 0.95 : st === 'pass' ? a.kind.speed * Math.max(0, 1 - a.t / 1.6) : 0, fast = sp > 2;
    B.ph += dt * 2 * Math.PI * sp / ((fast ? QS.stride : 0.75) * QS.sz); ui.hurtT = Math.max(0, ui.hurtT - dt);
    let yaw = Math.atan2(me.x - a.x, -(me.z - a.z)) - (Math.PI - V.aFace); while (yaw > Math.PI) yaw -= 2 * Math.PI; while (yaw < -Math.PI) yaw += 2 * Math.PI; yaw = clamp(yaw, -1.3, 1.3);
    const rest = QS.neck[3], peek = Math.sin(a.t * 0.8 + a.next) > 0.82, P = { t, ph: B.ph, gait: 0 };
    if (st === 'graze' && a.winded > 0) Object.assign(P, { neck: Math.min(rest, 0.0) - 0.25 + Math.sin(t * 5) * 0.06, nod: 0.35, crouch: 0.15 + Math.sin(t * 5) * 0.05, tail: 0.2 });      // blowing, head low
    else if (st === 'graze') Object.assign(P, { gait: 1, amt: 0.7, neck: peek ? rest * 0.5 : Math.min(-0.75, rest - 1.75), nod: peek ? 0.1 : 0.5, chew: 1, ear: peek ? 0.4 : 0 });
    else if (st === 'tell') Object.assign(P, { neck: rest + 0.12, ear: 1, tail: 0.4 });
    else if (st === 'look') Object.assign(P, { neck: rest + 0.2, yaw, ear: 0.25, tail: 0.5, trunkUp: 1 });
    else if (st === 'flee') Object.assign(P, { gait: 2, neck: Math.min(rest, 0.4), tail: 1, back: 1, lame: a.lame ? 2 : null, amt: a.lame ? 0.8 : 1 });
    else if (st === 'threat') Object.assign(P, { neck: Math.min(rest, 0.1), nod: 0.45, paw: 1, back: 1, tail: 1, trunkUp: 1 });
    else if (st === 'charge') Object.assign(P, { gait: 2, neck: Math.min(rest, -0.05), nod: 0.5, back: 1, tail: 1, trunkUp: 1 });
    else if (st === 'pass') Object.assign(P, { gait: sp > 2 ? 2 : 1, amt: Math.max(0.3, 1 - a.t / 1.6), neck: rest * 0.6, tail: 0.6 });
    else if (st === 'dead') { B.fallT = (B.fallT || 0) + dt; const u = clamp((B.fallT - 0.18) / 0.55, 0, 1); Object.assign(P, { fall: u * u * (3 - 2 * u), neck: 0.1 - u * 0.5, nod: 0.3, pitch: B.fallT < 0.25 ? -0.25 : 0, side: a.x > me.x ? 1 : -1 }); }
    if (ui.hurtT > 0 && st !== 'dead') P.pitch = 0.3 * Math.sin(ui.hurtT / 0.35 * Math.PI);
    quadPose(B, P, dt); }
  // camera: crouched at my place, facing the animal, or the lion when I have turned
  const toA = Math.atan2(a.x - me.x, a.z - me.z), Ln = g.lion; let yaw = toA; if (Ln && Ln.st !== 'gone' && me.face) yaw = toA + me.face * Math.PI / 2;
  if (ui.snap) V.yaw = yaw; else { let dy = yaw - V.yaw; while (dy > Math.PI) dy -= 2 * Math.PI; while (dy < -Math.PI) dy += 2 * Math.PI; V.yaw += dy * Math.min(1, dt * 7); } ui.snap = false;
  const bob = me.creep ? Math.sin(t * 7) * 0.025 : 0, eye = g2w(me.x, me.z, HGT(me.x, me.z) + EYE + bob);
  cam.position.copy(eye); cam.fov = innerWidth > innerHeight ? 40 : 48; cam.updateProjectionMatrix();      // (a longer lens since 22 Nov 2026: the animal was a speck)
  cam.lookAt(eye.clone().add(new T.Vector3(Math.sin(V.yaw) * 10, -0.35, -Math.cos(V.yaw) * 10))); cam.rotateZ(Math.sin(t * 3.5) * 0.004 * (me.creep ? 3 : 1));
  if (FX.shake > 0) { cam.rotation.x += (Math.random() - 0.5) * FX.shake * 0.002; cam.rotation.y += (Math.random() - 0.5) * FX.shake * 0.002; }
  // my arm and spear, low on the right: drawn back beside the head while aiming; the throw whips it forward and through; then a new spear comes up from the bundle
  const fw = new T.Vector3(Math.sin(V.yaw), 0, -Math.cos(V.yaw)), rt = new T.Vector3(Math.cos(V.yaw), 0, Math.sin(V.yaw)), pull = ui.aiming != null ? 0.55 : ui.fireT > 0 ? 1 : 0, flyingNow = g.spears.some(s => !s.done);
  let hx = 0.28, hy = -0.32 + pull * 0.2, hz = 0.42 - pull * 0.25, hrx = 0.12 + pull * 0.25, hry = 0, showSp = true;
  if (ui.thr != null) { const th = ui.thr; ui.thr += dt;
    if (th < 0.13) { const u = th / 0.13; hz = 0.17 + u * 0.8; hy = -0.12 - u * 0.16; hrx = 0.37 - u * 1.0; hx = 0.28 - u * 0.1; showSp = false; }
    else if (flyingNow || th < 0.5) { const u = Math.min(1, (th - 0.13) / 0.32); hz = 0.97 - u * 0.45; hy = -0.28 - u * 0.55; hrx = -0.63 - u * 0.3; hx = 0.18 + u * 0.1; hry = 0.3 * u; showSp = false; }
    else { ui.rl += dt; const u = Math.min(1, ui.rl / 0.38), e2 = u * u * (3 - 2 * u); hy = -0.95 + e2 * 0.63; hz = 0.3 + e2 * 0.12; hrx = 0.9 - e2 * 0.78; if (u >= 1) { ui.thr = null; ui.rl = 0; } } }
  const s = g.spears[g.spears.length - 1]; if (s && !s.done && !s.p0) s.p0 = V.hand.position.clone().addScaledVector(fw, 0.5).add(new T.Vector3(0, 0.12, 0));      // it leaves from where the hand is
  V.hand.position.copy(eye).addScaledVector(rt, hx).addScaledVector(fw, hz).add(new T.Vector3(0, hy, 0)); V.hand.rotation.set(0, -V.yaw + hry, 0); V.hand.rotateX(hrx);
  V.hand.userData.sp.visible = showSp; if (Ln && Ln.st !== 'gone') { V.hand.rotateX(-0.1); V.hand.position.addScaledVector(rt, -0.12); }
  // the spear in flight: from the hand, in a low arc, nose along its path; at an animal it goes for the chest, and follows one that is charging
  V.flying.visible = !!(s && !s.done); V.flying.scale.setScalar(1.5); if (!V.flying.visible) ui.trail = null;
  if (s && !s.done) { const u = s.t / s.T, onA = Math.hypot(s.tx - a.x, s.tz - a.z) < a.kind.body * 0.9, chg = false;
    const end = chg ? g2w(a.x, a.z, HGT(a.x, a.z) + 0.7 * a.kind.body) : g2w(s.tx, s.tz, HGT(s.tx, s.tz) + (onA ? 0.72 * a.kind.body : 0.05)), p0 = s.p0 || eye, dist = p0.distanceTo(end);
    const at = q => p0.clone().lerp(end, q).add(new T.Vector3(0, Math.sin(q * Math.PI) * (0.3 + dist * 0.06), 0)), p = at(u), p2 = at(Math.min(1, u + 0.03)); ui.trail = { at, u };
    V.flying.position.copy(p); if (u < 0.97) V.flying.lookAt(p.clone().add(p.clone().sub(p2))); V.flying.rotateZ(u * 5); s.end = end; s.dir = p2.clone().sub(p).normalize(); }
  // landed: in the animal it stays in it (and goes where the animal goes); in the ground it stands quivering
  if (s && s.done && !s.stuck) { s.stuck = true; const st = V.mkSpear();
    if (s.hit) { const side = ((me.x - a.x) * Math.cos(a.face) - (me.z - a.z) * Math.sin(a.face)) > 0 ? -1 : 1, hzq = QS.len / 2, wd = (s.hit === 'vital' ? QS.chest[0] : QS.rump[0]), cyq = QS.chest[1] * 0.75;
      let lyaw = Math.atan2(me.x - a.x, -(me.z - a.z)) - (Math.PI - V.aFace); st.rotation.set(0, lyaw, 0); st.rotateX(-0.3); const dirL = new T.Vector3(0, 0, 1).applyEuler(st.rotation);
      st.position.set(Math.sin(lyaw) * wd * 0.55, cyq + 0.06, (s.hit === 'vital' ? hzq * 0.62 : -hzq * 0.6) + Math.cos(lyaw) * wd * 0.2).addScaledVector(dirL, 1.02); st.scale.setScalar(1 / QS.sz); B.body.add(st); V.inBody.push(st); }
    else { st.position.copy(g2w(s.tx, s.tz, HGT(s.tx, s.tz) + 0.62)); const d0 = s.dir || fw; st.lookAt(st.position.clone().sub(d0)); st.rotateX(0.5); st.userData.q = 0.7; st.userData.rx = st.rotation.x; V.S.add(st); V.stuck.push(st); if (V.stuck.length > 6) V.S.remove(V.stuck.shift()); } }
  for (const st of V.stuck) if (st.userData.q > 0) { st.userData.q -= dt; st.rotation.x = st.userData.rx + Math.sin(t * 46) * 0.07 * Math.max(0, st.userData.q) / 0.7; }
  V.aim.visible = false; ui.fireT = Math.max(0, ui.fireT - dt);      // (the old mark on the ground is gone: the crosshair shows the aim)
  // the lion: crouched in the grass to the side, coming; then the leap
  if (!V.lion) V.lion = beast('lion'); V.lion.g.visible = false;
  if (Ln && Ln.st !== 'gone') { const L2 = V.lion; L2.g.visible = true; const ang = toA + Ln.side * Math.PI / 2, lp = Ln.st === 'leap' ? Math.min(1, Ln.t / g.cfg.leap) : 0, d = Ln.st === 'stalk' ? Math.max(3.5, 14 - Ln.t / Ln.leapAt * 10) : Math.max(0.6, 3.5 - lp * 3);
    const lx = me.x + Math.sin(ang) * d, lz = me.z + Math.cos(ang) * d; L2.g.position.copy(g2w(lx, lz, HGT(lx, lz) + Math.sin(lp * Math.PI) * 1.2)); L2.g.rotation.y = Math.PI - (ang + Math.PI); L2.ph += dt * (Ln.st === 'stalk' ? 5 : 0);
    quadPose(L2, Ln.st === 'stalk' ? { t, ph: L2.ph, gait: 1, amt: 0.8, crouch: 0.9, neck: 0.05, nod: 0.1, back: 1, tail: 0.2 } : { t, ph: 3.5, gait: 2, amt: 1, pitch: 0.45 - lp * 0.5, neck: 0.5, nod: 0.3, tail: 0.6 }, dt); }
  W3.setFocus(eye.x + fw.x * 6, eye.y, eye.z + fw.z * 6, 14);
  W3.render(dt);
  // the throw's streak: the path the spear has just flown, drawn over the picture so that a spear going straight away from you is still seen
  if (ui.trail) { const { at, u } = ui.trail, n = 9; ctx.lineCap = 'round'; let prev = null; for (let i = 0; i <= n; i++) { const q = Math.max(0, u - 0.4) + (u - Math.max(0, u - 0.4)) * i / n, sp = W3.screen(at(q)); if (prev && sp.front && prev.front) { ctx.strokeStyle = `rgba(255,244,214,${0.08 + 0.5 * i / n})`; ctx.lineWidth = (1 + 3.5 * i / n) * k; ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(sp.x, sp.y); ctx.stroke(); } prev = sp; } }
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
    { const dm = distA(G), shy = a.kind.shy * c.shy, win = a.winded > 0, col = angry(a) ? '#fff' : win ? '#7dff9a' : dm < shy ? '#ff6b5a' : dm <= 15 ? '#7dff9a' : '#fff', lab = angry(a) ? `${Math.round(dm)} m` : win ? `${Math.round(dm)} m · WINDED: THROW` : dm < shy ? `${Math.round(dm)} m · TOO CLOSE` : dm <= 15 ? `${Math.round(dm)} m · GOOD RANGE` : `${Math.round(dm)} m`;      // the metres say when you are near enough, and when too near
      ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.strokeText(lab, ex, ey + r + 20 * k); ctx.fillStyle = col; ctx.fillText(lab, ex, ey + r + 20 * k); } } }
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
function controlsHud(G) { if (G.over) return; const L = layout(), Ln = G.lion && G.lion.st !== 'gone' ? G.lion : null, a = G.a, me = G.me; ctx.textAlign = 'center';
  // a charge: what to do, in big letters, and when
  if (a.st === 'threat' || a.st === 'charge') { const now2 = performance.now(), pulse = 0.6 + 0.4 * Math.sin(now2 / 80), lock = a.locked, y0 = H * (G.lesson ? 0.36 : 0.275);
    ctx.font = `700 ${Math.round((lock ? 26 : 19) * k)}px ${BC}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.fillStyle = lock ? `rgba(255,${Math.round(120 + 100 * pulse)},90,1)` : '#ffe08a';
    const msg = lock ? '◀ DIVE ASIDE! ▶' : a.st === 'threat' ? 'IT IS GOING TO CHARGE' : 'WAIT FOR IT…'; ctx.strokeText(msg, W / 2, y0); ctx.fillText(msg, W / 2, y0);
    if (lock) { ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = '#fff'; ctx.strokeText('PUSH THE STICK HARD TO ONE SIDE', W / 2, y0 + 26 * k); ctx.fillText('PUSH THE STICK HARD TO ONE SIDE', W / 2, y0 + 26 * k);
      ctx.strokeStyle = `rgba(255,150,90,${pulse})`; ctx.lineWidth = 5 * k; const s2 = ui.stick, bx = s2 ? s2.x0 : 86 * k, by = s2 ? s2.y0 : H - 100 * k; ctx.beginPath(); ctx.arc(bx, by, 64 * k, 0, TAU); ctx.stroke(); } } ctx.textBaseline = 'middle';
  if (Ln) { const turned = me.face === Ln.side, pulse = 0.6 + 0.4 * Math.sin(performance.now() / 90);
    for (const sd of [-1, 1]) { const x0 = sd < 0 ? 0 : W / 2, hot = Ln.st === 'stalk' && !me.face && sd === Ln.side; ctx.fillStyle = hot ? `rgba(255,120,60,${0.25 + 0.2 * pulse})` : 'rgba(0,0,0,.18)'; ctx.fillRect(x0, H * 0.62, W / 2, H * 0.38); ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(34 * k)}px ${BC}`; ctx.fillText(sd < 0 ? '◀' : '▶', x0 + W / 4, H * 0.76); ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillText(sd < 0 ? 'TAP: FACE LEFT' : 'TAP: FACE RIGHT', x0 + W / 4, H * 0.84); }
    const msg = Ln.st === 'leap' ? 'NOW! TAP!' : turned ? 'WAIT FOR THE LEAP… THEN TAP' : me.face ? 'WRONG WAY! TAP THE OTHER SIDE' : (Ln.side < 0 ? '◀ A LION ON YOUR LEFT: TAP LEFT' : 'A LION ON YOUR RIGHT: TAP RIGHT ▶'); ctx.font = `700 ${Math.round((Ln.st === 'leap' ? 30 : 17) * k)}px ${BC}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.strokeText(msg, W / 2, H * 0.56); ctx.fillStyle = Ln.st === 'leap' ? '#ffe08a' : '#fff'; ctx.fillText(msg, W / 2, H * 0.56); return; }
  // the crosshair: a circle, four marks and a dot; amber on the animal, green on its chest. It sways as your arm does.
  if (a.st !== 'dead' && a.st !== 'flee' && !angry(a) && !G.spears.some(s => !s.done)) { const A = aimPoint(); if (A) { const d = Math.hypot(A.x - me.x, A.z - me.z) || 1, sw = swayOf(G, d), short = Math.max(0, d - 16) * 0.65, lx = A.x + sw.x - (A.x - me.x) / d * short, lz = A.z + sw.z - (A.z - me.z) / d * short, k2 = a.kind;
      const vx = a.x + Math.sin(a.face) * k2.body * 0.5, vz = a.z + Math.cos(a.face) * k2.body * 0.5, onChest = Math.hypot(lx - vx, lz - vz) < k2.vital * (1 - Math.min(0.3, G.cfg.f / 150)) * (lessonNow(G) ? 1.3 : 1), onBody = Math.hypot(lx - a.x, lz - a.z) < k2.body * 0.75;
      let ox = 0, oy = 0; if (V3 && !V3.none) { const gy = HGT(a.x, a.z) + 0.75 * k2.body, p0 = W3.screen(g2w(A.x, A.z, gy)), p1 = W3.screen(g2w(lx, lz, gy)); ox = p1.x - p0.x; oy = (p1.y - p0.y) + Math.sin(G.t * 1.6 + 1.3) * 3 * k; }
      const cx = A.sx + ox, cy = A.sy + oy, col = short > 0 ? '#ff8a6a' : onChest ? '#7dff9a' : onBody ? '#ffd36a' : '#ffffff', r0 = 20 * k; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.45)'; for (let pass = 0; pass < 2; pass++) { ctx.beginPath(); ctx.arc(cx, cy, r0, 0, TAU); for (const [ux, uy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { ctx.moveTo(cx + ux * r0 * 0.55, cy + uy * r0 * 0.55); ctx.lineTo(cx + ux * r0 * 1.5, cy + uy * r0 * 1.5); } ctx.stroke(); ctx.lineWidth = 2.5; ctx.strokeStyle = col; }
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(cx, cy, 2.5 * k, 0, TAU); ctx.fill(); const lab = short > 0 ? 'TOO FAR' : onChest ? 'CHEST: THROW!' : onBody ? 'ON IT (AIM FOR THE CHEST)' : ''; if (lab) { ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.strokeText(lab, cx, cy + r0 * 1.5 + 12 * k); ctx.fillStyle = col; ctx.fillText(lab, cx, cy + r0 * 1.5 + 12 * k); } } }
  // THROW
  { const B = L.fire, on = ui.fireT > 0, can = !G.spears.some(s => !s.done) && a.st !== 'dead' && a.st !== 'flee' && !angry(a); ctx.globalAlpha = can ? 0.95 : 0.4; ctx.fillStyle = on ? '#ffd36a' : '#c8502a'; ctx.beginPath(); ctx.arc(B.x, B.y, B.r * (on ? 0.93 : 1), 0, TAU); ctx.fill(); ctx.strokeStyle = '#ffe8c8'; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(19 * k)}px ${BC}`; ctx.fillText('THROW', B.x, B.y - 2 * k); ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.fillText('tap', B.x, B.y + 16 * k); ctx.globalAlpha = 1;
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
