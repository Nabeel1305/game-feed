// ===================== THE VIEW: Police Chase in 3D (three.js through tools/world3d.js) =====================
// A city avenue at night: wet tarmac, lane lines, towers of lit windows, street lamps, traffic; your patrol car with its light bar
// throwing red and blue; the getaway car. Then a brick alley on foot, and the arrest. Game (x, s) is three.js (x, y, -s).
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [];
let hint = null, V3 = null;
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 6) TXT.shift(); }
function tip(key, txt, secs = 2.8) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function fxStep(dt) {
  FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 1.8);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.3) TXT.shift();
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; }
}
const hash = n => { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };
function buildWorld() {
  if (V3) return V3; const T = THREE; if (!W3 || !W3.init({ canvas: $('gl'), fov: 68, far: 2500, near: 0.1 })) { V3 = { none: true }; return V3; }
  const S = W3.scene, R0 = W3.rng(5);
  // the avenue: tarmac, kerbs, pavements; all of it slides along under the car (it repeats every 100 m)
  const tar = W3.grainTex(256, 17, 80, 30, 6); tar.repeat.set(4, 60);
  const road = new T.Mesh(new T.PlaneGeometry(2 * HALF, 1200), new T.MeshStandardMaterial({ color: 0x2b2d31, roughness: 0.55, metalness: 0.0, map: tar })); road.rotation.x = -Math.PI / 2; road.receiveShadow = true; S.add(road);
  const walkM = new T.MeshStandardMaterial({ color: 0x6c6a66, roughness: 0.85, map: W3.grainTex(128, 4, 170, 40, 3) }); const walks = [];
  for (const sd of [-1, 1]) { const w = new T.Mesh(new T.BoxGeometry(5, 0.18, 1200), walkM); w.position.set(sd * (HALF + 2.5), 0.09, 0); w.receiveShadow = true; S.add(w); walks.push(w); }
  const lineM = new T.MeshStandardMaterial({ color: 0xe8e4d8, roughness: 0.5, emissive: 0x222222 }), dash = new T.InstancedMesh(new T.BoxGeometry(0.14, 0.02, 3), lineM, 3 * 120), D = new T.Object3D();
  S.add(dash);
  // buildings: towers of windows (lit at night), many heights; a pool re-placed as you go
  const wc = document.createElement('canvas'); wc.width = 128; wc.height = 256; const we = document.createElement('canvas'); we.width = 128; we.height = 256;
  { const g = wc.getContext('2d'), e = we.getContext('2d'); g.fillStyle = '#5a5650'; g.fillRect(0, 0, 128, 256); e.fillStyle = '#000'; e.fillRect(0, 0, 128, 256);
    for (let y = 6; y < 256; y += 16) for (let x = 6; x < 128; x += 15) { const lit = R0() < 0.42, warm = R0() < 0.7; g.fillStyle = '#1d2228'; g.fillRect(x, y, 9, 10); if (lit) { e.fillStyle = warm ? `rgba(255,${190 + R0() * 50},${110 + R0() * 60},1)` : 'rgba(170,200,255,1)'; e.fillRect(x, y, 9, 10); } } }
  const wt = new T.CanvasTexture(wc), wet = new T.CanvasTexture(we); wt.colorSpace = wet.colorSpace = T.SRGBColorSpace; wt.wrapS = wt.wrapT = wet.wrapS = wet.wrapT = T.RepeatWrapping; wt.repeat.set(2, 3); wet.repeat.set(2, 3);
  const bM = new T.MeshStandardMaterial({ map: wt, emissiveMap: wet, emissive: 0xffffff, emissiveIntensity: 1, roughness: 0.8 });
  const NB = 70, blds = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), bM, NB); blds.castShadow = false; blds.receiveShadow = true; S.add(blds);
  // street lamps: poles and glowing heads (instanced), and a few real lights that move along with you
  const NL = 24, poleI = new T.InstancedMesh(new T.CylinderGeometry(0.08, 0.1, 6.5, 6), new T.MeshStandardMaterial({ color: 0x3a3d42, metalness: 0.6, roughness: 0.4 }), NL), headI = new T.InstancedMesh(new T.SphereGeometry(0.28, 10, 8), new T.MeshStandardMaterial({ color: 0xffe3b0, emissive: 0xffc070, emissiveIntensity: 3 }), NL);
  S.add(poleI, headI); const lamps = []; for (let i = 0; i < 4; i++) { const l = new T.PointLight(0xffc68a, 30, 26, 1.6); S.add(l); lamps.push(l); }
  // cars: a body, a cabin, wheels, lights; colours by car
  const carModel = (col, police) => { const g = new T.Group(), paint = new T.MeshStandardMaterial({ color: col, metalness: 0.6, roughness: 0.28 }), glass = new T.MeshStandardMaterial({ color: 0x0c1015, metalness: 0.9, roughness: 0.08 }), rub = new T.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
    const body = new T.Mesh(new T.BoxGeometry(1.86, 0.62, 4.5), paint); body.position.y = 0.55; const cab = new T.Mesh(new T.BoxGeometry(1.6, 0.5, 2.3), glass); cab.position.set(0, 1.08, 0.15); const roof = new T.Mesh(new T.BoxGeometry(1.58, 0.06, 2.0), paint); roof.position.set(0, 1.35, 0.2);
    g.add(body, cab, roof); for (const [x, z] of [[-0.85, 1.45], [0.85, 1.45], [-0.85, -1.45], [0.85, -1.45]]) { const w = new T.Mesh(new T.CylinderGeometry(0.34, 0.34, 0.26, 14), rub); w.rotation.z = Math.PI / 2; w.position.set(x, 0.34, z); g.add(w); }
    const tl = new T.MeshStandardMaterial({ color: 0x400000, emissive: 0xff1a10, emissiveIntensity: 1.6 }), hl = new T.MeshStandardMaterial({ color: 0xfff6e0, emissive: 0xfff2d0, emissiveIntensity: 2 });
    for (const x of [-0.68, 0.68]) { const t2 = new T.Mesh(new T.BoxGeometry(0.36, 0.14, 0.05), tl); t2.position.set(x, 0.66, 2.26); const h2 = new T.Mesh(new T.BoxGeometry(0.34, 0.12, 0.05), hl); h2.position.set(x, 0.62, -2.26); g.add(t2, h2); }
    if (police) { const doors = new T.Mesh(new T.BoxGeometry(1.88, 0.4, 2.2), new T.MeshStandardMaterial({ color: 0xf2f2f2, metalness: 0.4, roughness: 0.3 })); doors.position.set(0, 0.55, 0.1); g.add(doors);
      const bar = new T.Group(); for (const [x, c] of [[-0.4, 0xff2020], [0.4, 0x2050ff]]) { const b = new T.Mesh(new T.BoxGeometry(0.62, 0.12, 0.26), new T.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 2 })); b.position.set(x, 1.45, 0.2); bar.add(b); } g.add(bar); g.userData.bar = bar; }
    g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g; };
  const me = carModel(0x111418, true); S.add(me);
  const redL = new T.PointLight(0xff2020, 0, 30, 1.5), blueL = new T.PointLight(0x2050ff, 0, 30, 1.5); S.add(redL, blueL);
  const head = new T.SpotLight(0xfff2d8, 60, 70, 0.5, 0.5, 1.2); S.add(head, head.target);
  const crook = carModel(0x6b1d1d); S.add(crook);
  const COLS = [0x8a8f96, 0x2b3d5c, 0xd8d4c8, 0x324a2e, 0x8a6a2a, 0x1a1a1a], traffic = []; for (let i = 0; i < 26; i++) { const c = carModel(COLS[i % 6]); c.visible = false; S.add(c); traffic.push(c); }
  // the alley (on foot): brick walls close either side, crates, fences, pipes; and the man you are chasing
  const brick = document.createElement('canvas'); brick.width = brick.height = 128; { const g = brick.getContext('2d'); g.fillStyle = '#4a4440'; g.fillRect(0, 0, 128, 128); for (let y = 0; y < 128; y += 10) for (let x = (y / 10 % 2) * 12; x < 128; x += 24) { g.fillStyle = `hsl(${10 + R0() * 12},${30 + R0() * 20}%,${26 + R0() * 14}%)`; g.fillRect(x + 1, y + 1, 22, 8); } }
  const bt = new T.CanvasTexture(brick); bt.colorSpace = T.SRGBColorSpace; bt.wrapS = bt.wrapT = T.RepeatWrapping; bt.repeat.set(80, 3);
  const alley = new T.Group(); for (const sd of [-1, 1]) { const w = new T.Mesh(new T.BoxGeometry(0.4, 9, 1000), new T.MeshStandardMaterial({ map: bt, roughness: 0.9 })); w.position.set(sd * 2.6, 4.5, -450); w.receiveShadow = true; alley.add(w); }
  const aFloor = new T.Mesh(new T.PlaneGeometry(5.2, 1000), new T.MeshStandardMaterial({ color: 0x34322f, roughness: 0.6, map: tar })); aFloor.rotation.x = -Math.PI / 2; aFloor.position.z = -450; alley.add(aFloor);
  const crateM = new T.MeshStandardMaterial({ color: 0x8a6a42, roughness: 0.9, map: W3.grainTex(128, 9, 170, 60, 4) }), metal = new T.MeshStandardMaterial({ color: 0x6a6e74, metalness: 0.7, roughness: 0.4 });
  const obsPool = []; for (let i = 0; i < 24; i++) { const g = new T.Group(); g.visible = false; alley.add(g); obsPool.push(g); }
  alley.visible = false; S.add(alley);
  const alleyLamps = []; for (let i = 0; i < 3; i++) { const l = new T.PointLight(0xffd6a0, 0, 16, 1.6); S.add(l); alleyLamps.push(l); }
  // a person: the man you chase (hoodie), built from capsules
  const person = (top, legs) => { const g = new T.Group(), sk = new T.MeshStandardMaterial({ color: 0x7a5238, roughness: 0.6 }), tp = new T.MeshStandardMaterial({ color: top, roughness: 0.85 }), lg = new T.MeshStandardMaterial({ color: legs, roughness: 0.85 });
    const cap = (r, l, m, x, y, z) => { const o = new T.Mesh(new T.CapsuleGeometry(r, l, 6, 10), m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
    const torso = cap(0.2, 0.42, tp, 0, 1.25, 0), head2 = new T.Mesh(new T.SphereGeometry(0.12, 14, 10), sk); head2.position.set(0, 1.72, 0); g.add(head2); const hood = new T.Mesh(new T.SphereGeometry(0.135, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.6), tp); hood.position.set(0, 1.73, 0.02); g.add(hood);
    const limbs = []; for (const s of [-1, 1]) { const a = new T.Group(); a.position.set(s * 0.26, 1.48, 0); const ar = cap(0.06, 0.5, tp, 0, -0.3, 0); g.remove(ar); a.add(ar); g.add(a); const l = new T.Group(); l.position.set(s * 0.1, 0.92, 0); const lr = cap(0.08, 0.72, lg, 0, -0.45, 0); g.remove(lr); l.add(lr); g.add(l); limbs.push(a, l); }
    g.userData.limbs = limbs; return g; };
  const runner = person(0x23262b, 0x2b3346); S.add(runner);
  const gloves = new T.Group(); { const gm = new T.MeshStandardMaterial({ color: 0x15171a, roughness: 0.7 }), sl = new T.MeshStandardMaterial({ color: 0x1c2a44, roughness: 0.8 }); for (const s of [-1, 1]) { const h = new T.Mesh(new T.SphereGeometry(0.07, 10, 8), gm); h.position.set(s * 0.22, 0, 0); const a = new T.Mesh(new T.CapsuleGeometry(0.06, 0.4, 4, 8), sl); a.rotation.x = Math.PI / 2; a.position.set(s * 0.25, -0.02, 0.26); gloves.add(h, a); } gloves.visible = false; S.add(gloves); }
  // spray kicked up on a wet road
  V3 = { T, S, road, walks, dash, D, blds, poleI, headI, lamps, me, crook, traffic, redL, blueL, head, alley, alleyLamps, obsPool, crateM, metal, runner, gloves, camPos: new T.Vector3(), look: new T.Vector3(), sky: null, bk: -1, lk: -1 };
  W3.setQuality(stepN); return V3;
}
function setWeather(G) {
  const V = buildWorld(); if (V.none || V.sky === G.weather) return; V.sky = G.weather;
  W3.setSky(G.weather, { azim: 200, wind: [0.5, 0.2] }); const dark = W3.S.night || G.weather === 'dusk' || G.weather === 'storm' || G.weather === 'rain';
  V.blds.material.emissiveIntensity = dark ? 1.4 : 0.15; V.lamps.forEach(l => l.intensity = dark ? 40 : 0); V.headI.material.emissiveIntensity = dark ? 3 : 0.3;
  V.road.material.roughness = W3.S.rain ? 0.12 : 0.55; V.road.material.color.set(W3.S.rain ? 0x1e2024 : 0x2b2d31); V.head.intensity = dark ? 80 : 0;
  W3.S.onBolt = () => { if (!HEADLESS && sfx.thunder) setTimeout(() => sfx.thunder(), 300 + Math.random() * 900); };
}
const ui = { snap: false };
function onEvent(G, e) {
  const cx = W / 2, cy = H * 0.3;
  switch (e.k) {
    case 'kerb': sfx.scrape(); FX.shake = 3; break;
    case 'crash': sfx.crash(); FX.shake = 16; FX.red = 0.6; FX.stop = 0.08; say(e.what === 'cross' ? 'T-BONED!' : 'CRASH!', cx, cy, '#ffb4a8', 32); tip('crash', 'Steer into a free lane early: look further ahead', 2.8); break;
    case 'pit': sfx.pit(); FX.shake = 12; FX.stop = 0.07; vibe(HAP.thud); say(G.ph === 'crash' || G.pitN >= G.cfg.pits ? 'HE’S DONE!' : `PIT! ${G.pitN} OF ${G.cfg.pits}`, cx, cy, '#ffe08a', 30); break;
    case 'bump': sfx.bump(); FX.shake = 5; tip('bump', 'Not his bumper: come alongside his back wheel and steer into it', 3); break;
    case 'crookcrash': sfx.crash(); sfx.door(); say('HE’S RUNNING!', cx, cy, '#ffe08a', 30); break;
    case 'foot': ui.snap = true; break;
    case 'drive': ui.snap = true; break;
    case 'jump': sfx.jump(); break; case 'slide': sfx.slide(); break;
    case 'dodge': break;
    case 'cleared': sfx.step(); break;
    case 'stumble': sfx.thump(); FX.shake = 9; FX.red = 0.35; say({ crate: 'INTO THE CRATES!', fence: 'HIT THE FENCE!', pipe: 'HEAD ON THE PIPE!' }[e.type], cx, cy, '#ffb4a8', 24); tip('stumble_' + e.type, { crate: 'Swipe left or right round crates', fence: 'Swipe UP to jump a fence', pipe: 'Swipe DOWN to slide under a pipe' }[e.type], 2.6); break;
    case 'shove': sfx.thump(); say('HE SHOVED YOU OFF', cx, cy, '#ffd0c4', 22); tip('shove', 'Right behind him: tap to tackle', 2.4); break;
    case 'dive': sfx.thump(); say('TOO FAR!', cx, cy, '#ffd0c4', 26); break;
    case 'tackle': sfx.tackle(); FX.shake = 14; FX.stop = 0.1; vibe(HAP.heavy); say('GOT HIM!', cx, cy, '#ffe08a', 32); break;
    case 'cuffstart': ui.snap = true; break;
    case 'twist': sfx.grunt(); break;
    case 'heave': FX.shake = 6; break;
    case 'held': sfx.hold(e.n); vibe(HAP.light); say('HOLD!', cx, cy, '#9be3b5', 26); break;
    case 'free': sfx.free(); FX.red = 0.5; say('HE BROKE FREE!', cx, cy, '#ffb4a8', 30); tip('free', 'Watch his shoulders: swipe the OTHER way', 3); break;
    case 'cuffed': sfx.cuffs(); FX.flash = 0.7; say('CUFFED!', cx, cy, '#ffe08a', 34); vibe(HAP.best); break;
    case 'horn': sfx.horn(); break;
    case 'lessonnext': if (e.first) hint = null; say(e.first ? 'FIRST, A LESSON' : 'NEXT LESSON', cx, H * 0.5, '#ffd36a', 26); sfx.ding(); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, cx, H * 0.5, '#9be3b5', 26); sfx.coin(e.n); break;
    case 'lessonmiss': hint = { txt: e.how, t: 0, secs: 3.6 }; break;
    case 'lessondone': say('NOW CATCH HIM!', cx, H * 0.5, '#ffd36a', 28); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); vibe(HAP.best); break;
    case 'lost': sfx.lose(); say({ escaped: 'HE GOT AWAY', wrecked: 'CAR WRECKED', away: 'LOST HIM', free: 'HE GOT AWAY' }[e.why] || 'HE GOT AWAY', cx, H * 0.5, '#ffd0c4', 28); break;
  }
}
function carPose(m, x, s, yaw = 0, roll = 0) { m.position.set(x, 0, -s); m.rotation.set(0, yaw, roll); }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#0b1418'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D city.', W / 2, H / 2); return; }
  const T = V.T, cam = W3.cam, g = G || idleG(), t = now; setWeather(g);
  const onFoot = g.ph === 'foot' || g.ph === 'cuff', me = g.me, D = V.D;
  V.alley.visible = onFoot; for (const m of [V.road, ...V.walks, V.dash, V.blds, V.poleI, V.headI, V.me, V.crook]) m.visible = !onFoot; V.traffic.forEach(c => c.visible = false);
  V.runner.visible = onFoot; V.gloves.visible = g.ph === 'cuff';
  const flash = Math.sin(t * 14) > 0;
  if (!onFoot) {
    // the street moves under you: road and pavements follow, lines, buildings and lamps are placed by where you are
    const base = Math.floor(me.s / 100) * 100; V.road.position.z = -(base + 450); V.walks.forEach(w => w.position.z = -(base + 450));
    let i = 0; for (let s = Math.floor((me.s - 40) / 9) * 9; s < me.s + 900 && i < 360; s += 9) for (const x of [-3.5, 0, 3.5]) { if (i >= 360) break; D.position.set(x, 0.012, -s); D.rotation.set(0, 0, 0); D.scale.set(x === 0 ? 1.3 : 1, 1, 1); D.updateMatrix(); V.dash.setMatrixAt(i++, D.matrix); }
    V.dash.count = i; V.dash.instanceMatrix.needsUpdate = true;
    const bk = Math.floor((me.s - 60) / 26); if (bk !== V.bk) { V.bk = bk; let n = 0; for (let k = bk; n < 70; k++) for (const sd of [-1, 1]) { if (n >= 70) break; const h = 14 + hash(k * 3 + sd) * 70, w = 16 + hash(k * 7 + sd) * 8, d = 18 + hash(k * 11 + sd) * 6; D.position.set(sd * (HALF + 5 + w / 2), h / 2, -(k * 26)); D.rotation.set(0, 0, 0); D.scale.set(w, h, d); D.updateMatrix(); V.blds.setMatrixAt(n++, D.matrix); } V.blds.instanceMatrix.needsUpdate = true; }
    const lk = Math.floor((me.s - 20) / 32); if (lk !== V.lk) { V.lk = lk; for (let q = 0; q < 24; q++) { const k = lk + (q >> 1), sd = q % 2 ? 1 : -1; D.position.set(sd * (HALF + 0.8), 3.25, -(k * 32 + (sd > 0 ? 16 : 0))); D.scale.setScalar(1); D.updateMatrix(); V.poleI.setMatrixAt(q, D.matrix); D.position.y = 6.5; D.position.x = sd * (HALF - 0.3); D.updateMatrix(); V.headI.setMatrixAt(q, D.matrix); } V.poleI.instanceMatrix.needsUpdate = V.headI.instanceMatrix.needsUpdate = true; }
    V.lamps.forEach((l, q) => { const k = lk + 1 + q; l.position.set((q % 2 ? 1 : -1) * (HALF - 0.5), 6, -(k * 32 + (q % 2 ? 16 : 0))); });
    // cars
    carPose(V.me, me.x, me.s, -me.vx * 0.04, me.vx * 0.006); V.me.userData.bar.children[0].material.emissiveIntensity = flash ? 4 : 0.2; V.me.userData.bar.children[1].material.emissiveIntensity = flash ? 0.2 : 4;
    V.redL.position.set(me.x - 0.4, 2, -me.s); V.blueL.position.set(me.x + 0.4, 2, -me.s); V.redL.intensity = flash ? 40 : 0; V.blueL.intensity = flash ? 0 : 40;
    V.head.position.set(me.x, 0.8, -me.s + 2.2); V.head.target.position.set(me.x + me.vx * 0.5, 0, -me.s - 25);
    const ck = g.crook; carPose(V.crook, ck.x, ck.s, ck.spin > 0 ? Math.sin(ck.spin * 5) * 0.9 : (LANES[ck.lane] - ck.x) * -0.05);
    let q = 0; for (const c2 of g.traffic) { if (c2.s < me.s - 20 || c2.s > me.s + 350 || q >= V.traffic.length) continue; const m = V.traffic[q++]; m.visible = true; carPose(m, c2.x, c2.s, c2.hit > 0 ? c2.hit * 1.5 : 0); }
    for (const j of g.junctions) if (j.car && j.car.t != null && j.car.t < 4 && q < V.traffic.length) { const m = V.traffic[q++]; m.visible = true; carPose(m, j.car.x, j.s, Math.PI / 2 * j.car.dir); }
    // camera: behind and above the patrol car, swinging a little with the steering
    const want = new T.Vector3(me.x * 0.85 - me.vx * 0.2, 3.1, -me.s + 7.2), look = new T.Vector3(me.x * 0.7 + (g.crook.x - me.x) * 0.15, 0.8, -me.s - 16);
    if (ui.snap) { V.camPos.copy(want); V.look.copy(look); } else { V.camPos.lerp(want, Math.min(1, dt * 6)); V.look.lerp(look, Math.min(1, dt * 6)); } ui.snap = false;
    cam.position.copy(V.camPos); cam.fov = (innerWidth > innerHeight ? 58 : 70) + (me.v - 25) * 0.25; cam.updateProjectionMatrix(); cam.lookAt(V.look); cam.rotateZ(-me.vx * 0.008);
    W3.setFocus(me.x, 0, -me.s - 4, 16);
  } else {
    const F = g.foot, s = F ? F.s : 0, ph = t * 11;
    V.alley.position.z = -Math.floor(s / 100) * 100 + 0; V.alley.position.z = 0;
    V.alleyLamps.forEach((l, q) => { l.intensity = 25; l.position.set((q % 2 ? 1.8 : -1.8), 3.5, -(Math.floor(s / 25) * 25 + q * 25 + 10)); });
    // obstacles ahead
    let n = 0; if (F && g.ph === 'foot') for (const o of F.obs) { if (o.s < s - 3 || o.s > s + 70 || n >= V.obsPool.length) continue; const gO = V.obsPool[n++]; gO.visible = true; if (gO.userData.type !== o.type + o.lane + o.two) { gO.clear(); gO.userData.type = o.type + o.lane + o.two;
        if (o.type === 'crate') for (const ln of [o.lane, o.two]) { if (ln < 0) continue; const b = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 1.0), V.crateM); b.position.set(ALLEY[ln], 0.5, 0); b.castShadow = true; gO.add(b); const b2 = b.clone(); b2.scale.setScalar(0.7); b2.position.y = 1.35; b2.rotation.y = 0.4; gO.add(b2); }
        if (o.type === 'fence') { for (let x = -2.4; x <= 2.4; x += 0.3) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.0, 0.04), V.crateM); p.position.set(x, 0.5, 0); gO.add(p); } const r = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.1, 0.06), V.crateM); r.position.set(0, 0.75, 0); gO.add(r); }
        if (o.type === 'pipe') { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 5, 12), V.metal); p.rotation.z = Math.PI / 2; p.position.set(0, 1.25, 0); p.castShadow = true; gO.add(p); } }
      gO.position.set(0, 0, -o.s); }
    for (let q = n; q < V.obsPool.length; q++) V.obsPool[q].visible = false;
    // the man ahead: running, or on the ground under you
    const R2 = V.runner, L2 = R2.userData.limbs;
    if (g.ph === 'foot') { R2.position.set(F.crookX, Math.abs(Math.sin(ph)) * 0.06, -(s + F.gap + 0.6)); R2.rotation.set(0.15, Math.PI, 0); L2.forEach((l, i) => l.rotation.x = Math.sin(ph + (i % 2 ? 0 : Math.PI) + (i > 1 ? Math.PI : 0)) * 0.8); }
    else { const C = g.cuff, tw = C && C.heave && !C.heave.done ? { l: -1, r: 1, u: 0, d: 0 }[C.heave.dir] * Math.min(1, (C.heave.t + 0.6) * 2) : 0, lift = C && C.heave && !C.heave.done && (C.heave.dir === 'u') ? 0.15 : 0;
      R2.position.set(0, 0.2 + lift, -(s + 1.4)); R2.rotation.set(-Math.PI / 2, Math.PI, tw * 0.45); L2.forEach((l, i) => l.rotation.x = i % 2 ? 0 : -1.2); }
    // first person: running eyes, ducking, jumping; for the arrest, looking down at him, gloves on his back
    const bob = g.ph === 'foot' ? Math.sin(ph * 2) * 0.05 : 0, ey = g.ph === 'cuff' ? 1.85 : F && F.air > 0 ? 1.7 + Math.sin(F.air / 0.75 * Math.PI) * 0.9 : F && F.low > 0 ? 0.75 : 1.7;
    const want = new T.Vector3(F && g.ph === 'foot' ? F.x : 0.3, ey + bob, -s + (g.ph === 'cuff' ? 0.9 : 0)), look = g.ph === 'cuff' ? new T.Vector3(0, 0, -(s + 1.4)) : new T.Vector3((F ? F.x : 0) * 0.5, 1.4, -(s + 14));
    if (ui.snap) { V.camPos.copy(want); V.look.copy(look); } else { V.camPos.lerp(want, Math.min(1, dt * 12)); V.look.lerp(look, Math.min(1, dt * 8)); } ui.snap = false;
    cam.position.copy(V.camPos); cam.fov = innerWidth > innerHeight ? 62 : 74; cam.updateProjectionMatrix(); cam.lookAt(V.look);
    if (g.ph === 'cuff') { V.gloves.position.set(0, 0.42, -(s + 1.0)); V.gloves.scale.setScalar(0.8); V.gloves.rotation.set(-0.9, 0, (R2.rotation.z) * 0.6); }
    W3.setFocus(V.camPos.x, 0, V.camPos.z - 5, 10);
  }
  if (FX.shake > 0) { cam.rotation.x += (Math.random() - 0.5) * FX.shake * 0.002; cam.rotation.y += (Math.random() - 0.5) * FX.shake * 0.002; }
  W3.render(dt);
  if (G) hud(G);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 0.9 ? 1 : 1 - (t2.t - 0.9) / 0.4; ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(t2.size * k)}px ${BC}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 26 * k); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 26 * k); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(16 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 20 * k, h = lines.length * lh + 16 * k, w = Math.min(W - 24, Math.max(...lines.map(l => ctx.measureText(l).width)) + 34);
    ctx.fillStyle = 'rgba(0,0,0,.6)'; rrect(W / 2 - w / 2, H * 0.62 - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.62 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (!onFoot && g.ph !== 'crash' && G) { ctx.globalAlpha = 0.07; ctx.fillStyle = flash ? '#ff2020' : '#2050ff'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,40,30,${FX.red * 0.22})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,248,230,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); }
}
let IG = null; function idleG() { if (!IG) IG = newGame(Math.max(1, store.get('level', 1) | 0), { seed: 3 }); IG.lesson = null; const s0 = IG.me.s; driveStep(IG, 1 / 60); IG.ev.length = 0; IG.crook.s = Math.max(IG.crook.s, IG.me.s + 25); if (IG.crashes) { IG.crashes = 0; IG.lives = 3; } return IG; }
function weatherName(w) { return { dawn: 'DAWN', morning: 'MORNING', golden: 'GOLDEN HOUR', overcast: 'GREY SKY', mist: 'FOG', sunset: 'SUNSET', noon: 'MIDDAY', dusk: 'DUSK', rain: 'RAIN', storm: 'STORM', night: 'NIGHT' }[w] || ''; }
function hud(G) {
  const c = G.cfg, x = 14, y = 44 * k;
  if (G.lesson) lessonPanel(G);
  else { ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillStyle = '#fff';
    const step = G.ph === 'drive' || G.ph === 'crash' ? 0 : G.ph === 'foot' ? 1 : 2; ['PURSUIT', 'ON FOOT', 'ARREST'].forEach((s, i) => { ctx.globalAlpha = i === step ? 1 : 0.4; ctx.fillText(s, x + i * 78 * k, y + 8 * k); }); ctx.globalAlpha = 1;
    for (let i = 0; i < c.lives; i++) { ctx.fillStyle = i < G.lives ? '#5aa2ff' : 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.arc(W - x - 8 * k - i * 18 * k, y + 8 * k, 6 * k, 0, TAU); ctx.fill(); }
    if (G.ph === 'drive') { const ds = G.crook.s - G.me.s, u = clamp(1 - ds / c.escape, 0, 1); ctx.fillStyle = 'rgba(0,0,0,.35)'; rrect(x, y + 22 * k, W - 2 * x, 6 * k, 3); ctx.fill(); ctx.fillStyle = u < 0.3 ? '#ff6b5a' : '#ffd36a'; rrect(x, y + 22 * k, Math.max(6, (W - 2 * x) * u), 6 * k, 3); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillText(`${Math.max(0, Math.round(ds))} m to him · PIT ${G.pitN} of ${c.pits}`, x, y + 40 * k); }
    if (G.ph === 'foot') { const F = G.foot; ctx.fillStyle = F.gap < c.tackle ? '#9be3b5' : '#fff'; ctx.fillText(F.gap < c.tackle ? 'TAP TO TACKLE!' : `${F.gap.toFixed(1)} m behind him`, x, y + 28 * k); }
    if (G.ph === 'cuff') { ctx.fillText(`Held ${G.cuff.held} of ${c.holds}`, x, y + 28 * k); } }
  if (G.t < 3.2 && !G.lesson) { ctx.globalAlpha = Math.min(1, (3.2 - G.t) / 0.6); ctx.textAlign = 'center'; ctx.font = `700 ${Math.round(15 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.5)';
    const s = `CASE ${G.N} · ${weatherName(G.weather)} · ${c.pits} PIT${c.pits > 1 ? 'S' : ''} TO STOP HIM`; ctx.strokeText(s, W / 2, H * 0.2); ctx.fillText(s, W / 2, H * 0.2); ctx.globalAlpha = 1; }
  if (G.ph === 'drive' && G.N <= 3 && !G.over) { ctx.globalAlpha = 0.4; ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText('◀ HOLD', W * 0.18, H - 30 * k); ctx.fillText('HOLD ▶', W * 0.82, H - 30 * k); ctx.fillText('BOTH: BRAKE', W / 2, H - 30 * k); ctx.globalAlpha = 1; }
  // the arrest: his twist shown by an arrow (the way he goes) on the first cases
  if (G.ph === 'cuff' && G.cuff.heave && !G.cuff.heave.done && (G.N <= 4 || G.lesson)) { const d = G.cuff.heave.dir, ax = { l: -1, r: 1, u: 0, d: 0 }[d], ay = { l: 0, r: 0, u: -1, d: 1 }[d]; ctx.save(); ctx.translate(W / 2 + ax * 90 * k, H * 0.5 + ay * 90 * k); ctx.rotate(Math.atan2(ay, ax)); ctx.globalAlpha = 0.75; ctx.fillStyle = '#ff8a6a'; ctx.beginPath(); ctx.moveTo(26 * k, 0); ctx.lineTo(-14 * k, -18 * k); ctx.lineTo(-14 * k, 18 * k); ctx.closePath(); ctx.fill(); ctx.restore(); }
}
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
