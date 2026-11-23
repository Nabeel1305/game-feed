// ===================== THE VIEW: Police Chase in 3D (three.js through tools/world3d.js) =====================
// A city of streets and corners (second version, 23 Nov 2026): blocks of towers with lit windows, street lamps at the junctions, traffic;
// your patrol car with its light bar; the getaway car, bright orange, under a red marker that nothing hides. Then an alley on foot,
// seen from behind your own officer, and the arrest. Game (x, s) is three.js (x, y, -s); a heading h is rotation.y = -h.
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
  // the city: tarmac everywhere, a paved block between every four streets, towers on the blocks, lines down the streets. Everything
  // is instanced and re-placed round the car as it moves, so it never runs out; frustumCulled is OFF on all of it (three.js keeps
  // the bounding sphere of where the instances FIRST were, so far from the start the whole mesh was culled: his vanishing skyscrapers).
  const tar = W3.grainTex(256, 17, 80, 30, 6); tar.repeat.set(60, 60);
  const road = new T.Mesh(new T.PlaneGeometry(1400, 1400), new T.MeshStandardMaterial({ color: 0x2b2d31, roughness: 0.55, metalness: 0.0, map: tar })); road.rotation.x = -Math.PI / 2; road.receiveShadow = true; S.add(road);
  const inst = (geo, mat, n) => { const m = new T.InstancedMesh(geo, mat, n); m.frustumCulled = false; S.add(m); return m; };
  const BS = P - 2 * RW, NBK = 49, slabs = inst(new T.BoxGeometry(BS, 0.22, BS), new T.MeshStandardMaterial({ color: 0x77736c, roughness: 0.85, map: W3.grainTex(128, 4, 170, 40, 3) }), NBK); slabs.receiveShadow = true;
  const lineM = new T.MeshStandardMaterial({ color: 0xe8e4d8, roughness: 0.5, emissive: 0x222222 }), dash = inst(new T.BoxGeometry(0.16, 0.02, 3.2), lineM, 640), D = new T.Object3D();
  const wc = document.createElement('canvas'); wc.width = 128; wc.height = 256; const we = document.createElement('canvas'); we.width = 128; we.height = 256;
  { const g = wc.getContext('2d'), e = we.getContext('2d'); g.fillStyle = '#6a655e'; g.fillRect(0, 0, 128, 256); e.fillStyle = '#000'; e.fillRect(0, 0, 128, 256);
    for (let y = 6; y < 256; y += 16) for (let x = 6; x < 128; x += 15) { const lit = R0() < 0.42, warm = R0() < 0.7; g.fillStyle = '#1d2228'; g.fillRect(x, y, 9, 10); if (lit) { e.fillStyle = warm ? '#ffcf8a' : '#bfe0ff'; e.fillRect(x, y, 9, 10); } } }
  const wt = new T.CanvasTexture(wc), wet = new T.CanvasTexture(we); wt.colorSpace = wet.colorSpace = T.SRGBColorSpace; wt.wrapS = wt.wrapT = wet.wrapS = wet.wrapT = T.RepeatWrapping;
  const bM = new T.MeshStandardMaterial({ map: wt, emissiveMap: wet, emissive: 0xffffff, emissiveIntensity: 1, roughness: 0.8 });
  const blds = inst(new T.BoxGeometry(1, 1, 1), bM, NBK * 4); blds.receiveShadow = true;
  const poleI = inst(new T.CylinderGeometry(0.09, 0.11, 6.5, 6), new T.MeshStandardMaterial({ color: 0x3a3d42, metalness: 0.6, roughness: 0.5 }), 144), headI = inst(new T.SphereGeometry(0.32, 8, 6), new T.MeshStandardMaterial({ color: 0xfff0d0, emissive: 0xffc68a, emissiveIntensity: 2 }), 144);
  const lamps = []; for (let i = 0; i < 4; i++) { const l = new T.PointLight(0xffc68a, 30, 30, 1.6); S.add(l); lamps.push(l); }
  // the marker on the road under the getaway car: a red ring that pulses
  const ring = new T.Mesh(new T.RingGeometry(2.7, 3.3, 40), new T.MeshBasicMaterial({ color: 0xff2a1a, transparent: true, opacity: 0.85, depthWrite: false, fog: false })); ring.rotation.x = -Math.PI / 2; ring.renderOrder = 2; S.add(ring);
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
  const crook = carModel(0xff7a14); S.add(crook);      // bright orange: nothing else on the street is
  const COLS = [0x8a8f96, 0x2b3d5c, 0xb8b4a8, 0x324a2e, 0x6a5a3a, 0x3a3a3e], traffic = []; for (let i = 0; i < 26; i++) { const c = carModel(COLS[i % 6]); c.visible = false; S.add(c); traffic.push(c); }
  // the alley (on foot): brick walls close either side, crates, fences, pipes; and the man you are chasing
  const brick = document.createElement('canvas'); brick.width = brick.height = 128; { const g = brick.getContext('2d'); g.fillStyle = '#4a4440'; g.fillRect(0, 0, 128, 128); for (let y = 0; y < 128; y += 10) for (let x = (y / 10 % 2) * 12; x < 128; x += 24) { g.fillStyle = `hsl(${10 + R0() * 12},${30 + R0() * 20}%,${26 + R0() * 14}%)`; g.fillRect(x + 1, y + 1, 22, 8); } }
  const bt = new T.CanvasTexture(brick); bt.colorSpace = T.SRGBColorSpace; bt.wrapS = bt.wrapT = T.RepeatWrapping; bt.repeat.set(80, 3);
  const alley = new T.Group(); for (const sd of [-1, 1]) { const w = new T.Mesh(new T.BoxGeometry(0.4, 9, 1000), new T.MeshStandardMaterial({ map: bt, roughness: 0.9 })); w.position.set(sd * 2.6, 4.5, -450); w.receiveShadow = true; alley.add(w); }
  const tar2 = tar.clone(); tar2.repeat.set(2, 240); tar2.needsUpdate = true; const aFloor = new T.Mesh(new T.PlaneGeometry(5.2, 1000), new T.MeshStandardMaterial({ color: 0x5a5650, roughness: 0.6, map: tar2 })); aFloor.rotation.x = -Math.PI / 2; aFloor.position.z = -450; alley.add(aFloor);
  const crateM = new T.MeshStandardMaterial({ color: 0x8a6a42, roughness: 0.9, map: W3.grainTex(128, 9, 170, 60, 4) }), metal = new T.MeshStandardMaterial({ color: 0x6a6e74, metalness: 0.7, roughness: 0.4 });
  const obsPool = []; for (let i = 0; i < 24; i++) { const g = new T.Group(); g.visible = false; alley.add(g); obsPool.push(g); }
  alley.visible = false; S.add(alley);
  const alleyLamps = []; for (let i = 0; i < 3; i++) { const l = new T.PointLight(0xffd6a0, 0, 16, 1.6); S.add(l); alleyLamps.push(l); }
  // people (second version: "the running graphics are just awful"): built with knees and elbows, front towards -z. joints: arms, forearms, thighs, shins.
  const person = (top, legs, o = {}) => { const g = new T.Group(), body = new T.Group(); g.add(body); const M2 = (c2, r = 0.8) => new T.MeshStandardMaterial({ color: c2, roughness: r }), sk = M2(o.skin || 0x8a5a3c, 0.6), tp = M2(top), lg = M2(legs), sh = M2(o.shoe || 0xf2f2f2, 0.5);
    const cap = (par, r, l, m, x, y, z) => { const q = new T.Mesh(new T.CapsuleGeometry(r, l, 6, 10), m); q.position.set(x, y, z); q.castShadow = true; par.add(q); return q; };
    cap(body, 0.19, 0.4, tp, 0, 1.27, 0); cap(body, 0.17, 0.12, lg, 0, 0.98, 0); const hd = new T.Mesh(new T.SphereGeometry(0.125, 14, 10), sk); hd.position.set(0, 1.74, -0.01); hd.castShadow = true; body.add(hd);
    if (o.hood) { const h2 = new T.Mesh(new T.SphereGeometry(0.15, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62), tp); h2.position.set(0, 1.75, 0.02); body.add(h2); }
    if (o.cap) { const c2 = new T.Mesh(new T.CylinderGeometry(0.13, 0.135, 0.07, 14), M2(o.cap)); c2.position.set(0, 1.85, 0); const pk = new T.Mesh(new T.BoxGeometry(0.2, 0.02, 0.12), M2(0x0a0c10)); pk.position.set(0, 1.83, -0.15); body.add(c2, pk); }
    if (o.bag) { const b2 = new T.Mesh(new T.BoxGeometry(0.34, 0.26, 0.2), M2(o.bag)); b2.position.set(0.05, 1.2, 0.24); b2.rotation.z = 0.3; b2.castShadow = true; body.add(b2); g.userData.bag = b2; }
    if (o.stripe) { const st = new T.Mesh(new T.BoxGeometry(0.4, 0.06, 0.34), M2(o.stripe, 0.4)); st.position.set(0, 1.32, 0); body.add(st); }
    const J = { arm: [], fore: [], thigh: [], shin: [] };
    for (const sd of [-1, 1]) { const a = new T.Group(); a.position.set(sd * 0.27, 1.5, 0); cap(a, 0.06, 0.24, tp, 0, -0.16, 0); const f = new T.Group(); f.position.set(0, -0.32, 0); cap(f, 0.052, 0.22, o.sleeve ? tp : sk, 0, -0.14, 0); const hand = new T.Mesh(new T.SphereGeometry(0.06, 8, 6), sk); hand.position.set(0, -0.3, 0); f.add(hand); a.add(f); body.add(a);
      const th = new T.Group(); th.position.set(sd * 0.11, 0.92, 0); cap(th, 0.085, 0.3, lg, 0, -0.2, 0); const sn = new T.Group(); sn.position.set(0, -0.42, 0); cap(sn, 0.068, 0.3, lg, 0, -0.2, 0); const shoe = new T.Mesh(new T.BoxGeometry(0.11, 0.09, 0.27), sh); shoe.position.set(0, -0.42, -0.06); shoe.castShadow = true; sn.add(shoe); th.add(sn); body.add(th);
      J.arm.push(a); J.fore.push(f); J.thigh.push(th); J.shin.push(sn); }
    g.userData.J = J; g.userData.body = body; return g; };
  // a run you can read: thighs swing, knees fold as the leg comes through, arms pump the other way with bent elbows, the body leans and bounces
  const runPose = (m, ph, amt = 1) => { const J = m.userData.J, b = m.userData.body; for (let i = 0; i < 2; i++) { const p = ph + i * Math.PI, sw = Math.sin(p); J.thigh[i].rotation.x = (sw * 0.95 + 0.12) * amt; J.shin[i].rotation.x = -(0.25 + 1.25 * Math.max(0, Math.cos(p + 0.5))) * amt; J.arm[i].rotation.x = -sw * 0.95 * amt; J.arm[i].rotation.z = (i ? -1 : 1) * 0.08; J.fore[i].rotation.x = (1.25 + sw * 0.25) * amt; }
    b.rotation.x = -0.24 * amt; b.position.y = Math.abs(Math.sin(ph)) * 0.09 * amt; b.rotation.y = Math.sin(ph) * 0.12 * amt; if (m.userData.bag) m.userData.bag.rotation.x = Math.sin(ph * 2) * 0.25; };
  const runner = person(0xe8552a, 0x3a4a6a, { hood: true, sleeve: true, bag: 0x2a2a2a }); S.add(runner);      // the man you chase: an orange hoodie, like his car
  const cop = person(0x1c2a44, 0x10141c, { cap: 0x1c2a44, shoe: 0x101010, stripe: 0xd8e04a, sleeve: true }); S.add(cop);      // you
  const gloves = new T.Group(); { const gm = new T.MeshStandardMaterial({ color: 0x15171a, roughness: 0.7 }), sl = new T.MeshStandardMaterial({ color: 0x1c2a44, roughness: 0.8 }); for (const s of [-1, 1]) { const h = new T.Mesh(new T.SphereGeometry(0.07, 10, 8), gm); h.position.set(s * 0.22, 0, 0); const a = new T.Mesh(new T.CapsuleGeometry(0.06, 0.4, 4, 8), sl); a.rotation.x = Math.PI / 2; a.position.set(s * 0.25, -0.02, 0.26); gloves.add(h, a); } gloves.visible = false; S.add(gloves); }
  // the alley has colour: doors and shutters along both walls, and its own soft light so it is never a black tunnel
  const doors = new T.InstancedMesh(new T.BoxGeometry(0.12, 2.3, 1.3), new T.MeshStandardMaterial({ roughness: 0.6 }), 80); doors.frustumCulled = false; { const DC = [0x2f7a8a, 0xb8482e, 0xd8b23a, 0x3f7a4a, 0x6a4a8a, 0xc8c2b4], c3 = new T.Color(); for (let i = 0; i < 80; i++) { const sd = i % 2 ? 1 : -1; D.position.set(sd * 2.38, i % 3 === 0 ? 1.9 : 1.15, -(8 + (i >> 1) * 11 + (sd > 0 ? 5 : 0))); D.rotation.set(0, 0, 0); D.scale.set(1, i % 3 === 0 ? 0.55 : 1, i % 3 === 0 ? 1.5 : 1); D.updateMatrix(); doors.setMatrixAt(i, D.matrix); doors.setColorAt(i, c3.set(DC[(i * 7) % 6])); } } alley.add(doors);
  const alleyFill = new T.HemisphereLight(0xdfe8ff, 0x5a5048, 0); S.add(alleyFill);
  // spray kicked up on a wet road
  V3 = { T, S, road, slabs, dash, D, blds, poleI, headI, lamps, ring, cop, runPose, alleyFill, cell: null, camH: 0, me, crook, traffic, redL, blueL, head, alley, alleyLamps, obsPool, crateM, metal, runner, gloves, camPos: new T.Vector3(), look: new T.Vector3(), sky: null, bk: -1, lk: -1 };
  W3.setQuality(stepN); return V3;
}
function setWeather(G) {
  const V = buildWorld(); if (V.none || V.sky === G.weather) return; V.sky = G.weather;
  W3.setSky(G.weather, { azim: 200, wind: [0.5, 0.2] }); const dark = W3.S.night || G.weather === 'dusk' || G.weather === 'storm' || G.weather === 'rain';
  V.blds.material.emissiveIntensity = dark ? 1.4 : 0.15; V.lamps.forEach(l => l.intensity = dark ? 40 : 0); V.headI.material.emissiveIntensity = dark ? 3 : 0.3;
  V.road.material.roughness = W3.S.rain ? 0.14 : 0.55; V.dark = dark; V.road.material.color.set(W3.S.rain ? 0x1e2024 : 0x2b2d31); V.head.intensity = dark ? 80 : 0;
  W3.S.onBolt = () => { if (!HEADLESS && sfx.thunder) setTimeout(() => sfx.thunder(), 300 + Math.random() * 900); };
}
const ui = { snap: false };
function onEvent(G, e) {
  const cx = W / 2, cy = H * 0.3;
  switch (e.k) {
    case 'kerb': sfx.scrape(); FX.shake = 3; break;
    case 'crash': sfx.crash(); FX.shake = 16; FX.red = 0.6; FX.stop = 0.08; say(e.what === 'wall' ? 'INTO THE WALL!' : 'CRASH!', cx, cy, '#ffb4a8', 32); tip('crash' + e.what, e.what === 'wall' ? 'BRAKE before the corner, then turn' : 'Steer round the traffic: look further ahead', 2.8); break;
    case 'pit': sfx.pit(); FX.shake = 12; FX.stop = 0.07; vibe(HAP.thud); say(G.ph === 'crash' || G.pitN >= G.cfg.pits ? 'HE’S DONE!' : `PIT! ${G.pitN} OF ${G.cfg.pits}`, cx, cy, '#ffe08a', 30); break;
    case 'bump': sfx.bump(); FX.shake = 5; tip('bump', 'Not his bumper: drive into his SIDE or his back corner', 3); break;
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
function carPose(m, x, s, h = 0, roll = 0) { m.position.set(x, 0, -s); m.rotation.set(0, -h, roll); }
function pedals() { const w = 86 * k, h = 118 * k; return { gas: { x: W - w - 12, y: H - h - 22 * k, w, h }, brake: { x: W - 2 * w - 24, y: H - h * 0.8 - 22 * k, w, h: h * 0.8 } }; }
function toScreen(x, y, z) { const v = new THREE.Vector3(x, y, z).project(W3.cam); return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H, front: v.z < 1 }; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#0b1418'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D city.', W / 2, H / 2); return; }
  const T = V.T, cam = W3.cam, g = G || idleG(), t = now; setWeather(g);
  const onFoot = g.ph === 'foot' || g.ph === 'cuff', me = g.me, D = V.D;
  V.alley.visible = onFoot; for (const m of [V.road, V.slabs, V.dash, V.blds, V.poleI, V.headI, V.me, V.crook, V.ring]) m.visible = !onFoot; V.traffic.forEach(c => c.visible = false);
  V.runner.visible = onFoot; V.cop.visible = g.ph === 'foot'; V.gloves.visible = g.ph === 'cuff'; V.alleyFill.intensity = onFoot ? (V.dark ? 1.5 : 0.7) : 0;
  const flash = Math.sin(t * 14) > 0; ui.mark = null;
  if (!onFoot) {
    // the city is laid out round the block you are in, and laid out again when you move to the next one
    const ci = Math.floor(me.x / P), cj = Math.floor(me.s / P), key = ci + ':' + cj; V.road.position.set(ci * P, 0, -cj * P);
    if (V.cell !== key) { V.cell = key; let n = 0, b = 0, d = 0, q = 0; const put = (mesh, i, x, y, z, sx, sy, sz) => { D.position.set(x, y, z); D.rotation.set(0, 0, 0); D.scale.set(sx, sy, sz); D.updateMatrix(); mesh.setMatrixAt(i, D.matrix); };
      for (let i = ci - 3; i <= ci + 3; i++) for (let j = cj - 3; j <= cj + 3; j++) { const bx = (i + 0.5) * P, bs = (j + 0.5) * P, BS = P - 2 * RW; put(V.slabs, n++, bx, 0.11, -bs, 1, 1, 1);
        for (let u = 0; u < 4; u++) { const hh = hash(i * 31.7 + j * 57.3 + u * 7.1), w = BS / 2 - 7 - hash(i * 3.1 + j + u) * 5, dp = BS / 2 - 7 - hash(i + j * 5.3 + u * 2) * 5, h = 9 + hh * hh * 62, ox = (u % 2 ? 1 : -1) * (BS / 4 - 0.5), os = (u > 1 ? 1 : -1) * (BS / 4 - 0.5); put(V.blds, b++, bx + ox, h / 2, -(bs + os), w, h, dp); } }
      for (let i = ci - 2; i <= ci + 3; i++) for (let j = cj - 2; j <= cj + 3; j++) for (const [ox, os] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { if (q >= 144) break; const x = i * P + ox * (RW + 1.2), z = -(j * P + os * (RW + 1.2)); put(V.poleI, q, x, 3.25, z, 1, 1, 1); put(V.headI, q, x - ox * 0.9, 6.5, z + os * 0.9, 1, 1, 1); q++; }
      for (let i = ci - 2; i <= ci + 3; i++) for (let v = (cj - 2) * P; v < (cj + 3) * P && d < 640; v += 8) { if (Math.abs(v - nearLine(v)) < RW + 1) continue; put(V.dash, d++, i * P, 0.013, -v, 1, 1, 1); }
      for (let j = cj - 2; j <= cj + 3; j++) for (let v = (ci - 2) * P; v < (ci + 3) * P && d < 640; v += 8) { if (Math.abs(v - nearLine(v)) < RW + 1) continue; D.position.set(v, 0.013, -j * P); D.rotation.set(0, Math.PI / 2, 0); D.scale.set(1, 1, 1); D.updateMatrix(); V.dash.setMatrixAt(d++, D.matrix); }
      V.dash.count = d; V.poleI.count = V.headI.count = q; for (const m of [V.slabs, V.blds, V.dash, V.poleI, V.headI]) m.instanceMatrix.needsUpdate = true; }
    const jx = nearLine(me.x + Math.sin(me.h) * 30), js = nearLine(me.s + Math.cos(me.h) * 30); V.lamps.forEach((l, q) => l.position.set(jx + (q % 2 ? 1 : -1) * (RW + 0.3), 6.2, -(js + (q > 1 ? 1 : -1) * (RW + 0.3))));
    // cars
    carPose(V.me, me.x, me.s, me.h, -(me.w || 0) * Math.min(1, Math.abs(me.v) / 20) * 0.05); V.me.userData.bar.children[0].material.emissiveIntensity = flash ? 4 : 0.2; V.me.userData.bar.children[1].material.emissiveIntensity = flash ? 0.2 : 4;
    V.redL.position.set(me.x, 2.2, -me.s); V.blueL.position.set(me.x, 2.2, -me.s); V.redL.intensity = flash ? 40 : 0; V.blueL.intensity = flash ? 0 : 40;
    const fx = Math.sin(me.h), fs = Math.cos(me.h); V.head.position.set(me.x + fx * 2.2, 0.9, -(me.s + fs * 2.2)); V.head.target.position.set(me.x + fx * 26, 0, -(me.s + fs * 26));
    const ck = g.crook; carPose(V.crook, ck.x, ck.s, ck.h + (ck.spin > 0 ? (1.8 - ck.spin) * 7 : 0)); V.ring.position.set(ck.x, 0.05, -ck.s); V.ring.scale.setScalar(1 + Math.sin(t * 6) * 0.12); V.ring.visible = g.ph === 'drive';
    let q = 0; for (const c2 of g.traffic) { if (q >= V.traffic.length) break; const m = V.traffic[q++]; m.visible = true; carPose(m, c2.x, c2.s, [0, Math.PI / 2, Math.PI, -Math.PI / 2][c2.dir] + (c2.hit > 0 ? c2.hit * 1.5 : 0)); }
    // camera: above and behind the patrol car, coming round after it through the corners
    V.camH = ui.snap ? me.h : V.camH + wrapPi(me.h - V.camH) * Math.min(1, dt * 3.2); const cx2 = Math.sin(V.camH), cs2 = Math.cos(V.camH), port = innerWidth <= innerHeight, back = port ? 13 : 11, up = port ? 10 : 7.5;
    const want = new T.Vector3(me.x - cx2 * back, up + Math.abs(me.v) * 0.05, -(me.s - cs2 * back)), look = new T.Vector3(me.x + cx2 * 9, 0.8, -(me.s + cs2 * 9));
    if (ui.snap) { V.camPos.copy(want); V.look.copy(look); } else { V.camPos.lerp(want, Math.min(1, dt * 7)); V.look.lerp(look, Math.min(1, dt * 7)); } ui.snap = false;
    cam.position.copy(V.camPos); cam.fov = (port ? 66 : 56) + Math.max(0, me.v - 22) * 0.3; if (cam.near !== 3) cam.near = 3; cam.updateProjectionMatrix(); cam.lookAt(V.look);
    W3.setFocus(me.x, 0, -me.s, 22); if (g.ph === 'drive') ui.mark = { p: toScreen(ck.x, 2.6, -ck.s), d: Math.hypot(ck.x - me.x, ck.s - me.s) };
  } else {
    const F = g.foot, s = F ? F.s : 0, ph = t * 12.5;
    V.alleyLamps.forEach((l, q) => { l.intensity = 45; l.position.set((q % 2 ? 1.8 : -1.8), 3.5, -(Math.floor(s / 25) * 25 + q * 25 + 10)); });
    // obstacles ahead
    let n = 0; if (F && g.ph === 'foot') for (const o of F.obs) { if (o.s < s - 3 || o.s > s + 70 || n >= V.obsPool.length) continue; const gO = V.obsPool[n++]; gO.visible = true; if (gO.userData.type !== o.type + o.lane + o.two) { gO.clear(); gO.userData.type = o.type + o.lane + o.two;
        if (o.type === 'crate') for (const ln of [o.lane, o.two]) { if (ln < 0) continue; const b = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 1.0), V.crateM); b.position.set(ALLEY[ln], 0.5, 0); b.castShadow = true; gO.add(b); const b2 = b.clone(); b2.scale.setScalar(0.7); b2.position.y = 1.35; b2.rotation.y = 0.4; gO.add(b2); }
        if (o.type === 'fence') { for (let x = -2.4; x <= 2.4; x += 0.3) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.0, 0.04), V.crateM); p.position.set(x, 0.5, 0); gO.add(p); } const r = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.1, 0.06), V.crateM); r.position.set(0, 0.75, 0); gO.add(r); }
        if (o.type === 'pipe') { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 5, 12), V.metal); p.rotation.z = Math.PI / 2; p.position.set(0, 1.25, 0); p.castShadow = true; gO.add(p); } }
      gO.position.set(0, 0, -o.s); }
    for (let q = n; q < V.obsPool.length; q++) V.obsPool[q].visible = false;
    // the man ahead, and you: both running properly; or him on the ground under you
    const R2 = V.runner, C2 = V.cop, JR = R2.userData.J;
    if (g.ph === 'foot') { R2.rotation.set(0, 0, 0); R2.position.set(F.crookX, 0, -(s + F.gap + 0.6)); V.runPose(R2, ph + 1.3);
      const jump = F.air > 0 ? Math.sin(F.air / 0.75 * Math.PI) * 1.0 : 0, low = F.low > 0, dive = F.dive > 0, cb = C2.userData.body; C2.position.set(F.x, jump, -s); V.runPose(C2, ph, F.stumble > 0 ? 0.5 : 1);
      C2.rotation.set(low ? 1.15 : dive ? -1.0 : 0, 0, F.stumble > 0 ? Math.sin(t * 30) * 0.15 : 0); if (low) C2.position.y = 0.25; if (dive) C2.position.y = 0.3; if (jump > 0.1) { const CJ = C2.userData.J; CJ.thigh[0].rotation.x = 1.3; CJ.shin[0].rotation.x = -1.5; CJ.thigh[1].rotation.x = 0.6; CJ.shin[1].rotation.x = -1.2; cb.rotation.x = -0.1; }
      ui.mark = { p: toScreen(F.crookX, 2.25, -(s + F.gap + 0.6)), d: F.gap, foot: true }; }
    else { const C = g.cuff, tw = C && C.heave && !C.heave.done ? { l: -1, r: 1, u: 0, d: 0 }[C.heave.dir] * Math.min(1, (C.heave.t + 0.6) * 2) : 0, lift = C && C.heave && !C.heave.done && (C.heave.dir === 'u') ? 0.15 : 0;
      V.runPose(R2, 0, 0); R2.position.set(0, 0.22 + lift, -(s + 0.5)); R2.rotation.set(-Math.PI / 2, 0, tw * 0.45); for (let i = 0; i < 2; i++) { JR.arm[i].rotation.x = -0.5; JR.arm[i].rotation.z = (i ? 1 : -1) * 0.9; JR.fore[i].rotation.x = 0.2; } }
    // the camera: behind and above your own officer on foot (it was first person); for the arrest, looking down at him, gloves on his back
    const want = g.ph === 'cuff' ? new T.Vector3(0.3, 1.85, -s + 0.9) : new T.Vector3((F ? F.x : 0) * 0.55, 3.3, -s + 5.4), look = g.ph === 'cuff' ? new T.Vector3(0, 0, -(s + 1.4)) : new T.Vector3((F ? F.x : 0) * 0.5, 1.0, -(s + 8));
    if (ui.snap) { V.camPos.copy(want); V.look.copy(look); } else { V.camPos.lerp(want, Math.min(1, dt * 10)); V.look.lerp(look, Math.min(1, dt * 8)); } ui.snap = false;
    cam.position.copy(V.camPos); cam.fov = innerWidth > innerHeight ? 56 : 66; if (cam.near !== 0.3) cam.near = 0.3; cam.updateProjectionMatrix(); cam.lookAt(V.look);
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
let IG = null, IGM = {}; function idleG() { if (!IG || IG.over || IG.ph !== 'drive' || Math.hypot(IG.crook.x - IG.me.x, IG.crook.s - IG.me.s) > 140) { IG = newGame(Math.max(1, store.get('level', 1) | 0), { seed: 3 + ((Math.random() * 50) | 0) }); IGM = {}; } IG.lesson = null; honest(IG, { react: 0.12, acc: 1 }, IGM); IG.t += 1 / 60; driveStep(IG, 1 / 60); IG.ev.length = 0; IG.lives = 3; IG.pitN = 0; return IG; }      // the home screen: a chase round the city, driven by the robot
function weatherName(w) { return { dawn: 'DAWN', morning: 'MORNING', golden: 'GOLDEN HOUR', overcast: 'GREY SKY', mist: 'FOG', sunset: 'SUNSET', noon: 'MIDDAY', dusk: 'DUSK', rain: 'RAIN', storm: 'STORM', night: 'NIGHT' }[w] || ''; }
function hud(G) {
  const c = G.cfg, x = 14, y = 44 * k;
  if (G.lesson) lessonPanel(G);
  else { ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillStyle = '#fff';
    const step = G.ph === 'drive' || G.ph === 'crash' ? 0 : G.ph === 'foot' ? 1 : 2; ['PURSUIT', 'ON FOOT', 'ARREST'].forEach((s, i) => { ctx.globalAlpha = i === step ? 1 : 0.4; ctx.fillText(s, x + i * 78 * k, y + 8 * k); }); ctx.globalAlpha = 1;
    for (let i = 0; i < c.lives; i++) { ctx.fillStyle = i < G.lives ? '#5aa2ff' : 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.arc(W - x - 8 * k - i * 18 * k, y + 8 * k, 6 * k, 0, TAU); ctx.fill(); }
    if (G.ph === 'drive') { const ds = Math.hypot(G.crook.x - G.me.x, G.crook.s - G.me.s), u = clamp(1 - ds / c.escape, 0, 1); ctx.fillStyle = 'rgba(0,0,0,.35)'; rrect(x, y + 22 * k, W - 2 * x, 6 * k, 3); ctx.fill(); ctx.fillStyle = u < 0.3 ? '#ff6b5a' : '#ffd36a'; rrect(x, y + 22 * k, Math.max(6, (W - 2 * x) * u), 6 * k, 3); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillText(`${Math.max(0, Math.round(ds))} m to him · PIT ${G.pitN} of ${c.pits}`, x, y + 40 * k); }
    if (G.ph === 'foot') { const F = G.foot; ctx.fillStyle = F.gap < c.tackle ? '#9be3b5' : '#fff'; ctx.fillText(F.gap < c.tackle ? 'TAP TO TACKLE!' : `${F.gap.toFixed(1)} m behind him`, x, y + 28 * k); }
    if (G.ph === 'cuff') { ctx.fillText(`Held ${G.cuff.held} of ${c.holds}`, x, y + 28 * k); } }
  if (G.t < 3.2 && !G.lesson) { ctx.globalAlpha = Math.min(1, (3.2 - G.t) / 0.6); ctx.textAlign = 'center'; ctx.font = `700 ${Math.round(15 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.5)';
    const s = `CASE ${G.N} · ${weatherName(G.weather)} · ${c.pits} PIT${c.pits > 1 ? 'S' : ''} TO STOP HIM`; ctx.strokeText(s, W / 2, H * 0.2); ctx.fillText(s, W / 2, H * 0.2); ctx.globalAlpha = 1; }
  // the one to chase: a red marker nothing can hide, on him when he is in sight, at the edge of the screen (with how far) when he is not
  if (ui.mark && !G.over) { const m = ui.mark, pad = 34 * k, top = (G.lesson ? 150 : 96) * k, on = m.p.front && m.p.x > pad && m.p.x < W - pad && m.p.y > top && m.p.y < H - 150 * k, bob = Math.sin(performance.now() / 140) * 5 * k; ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    if (on) { const x = m.p.x, y = m.p.y - 26 * k + bob; ctx.fillStyle = '#ff2a1a'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y + 20 * k); ctx.lineTo(x - 15 * k, y - 4 * k); ctx.lineTo(x - 6 * k, y - 4 * k); ctx.lineTo(x - 6 * k, y - 22 * k); ctx.lineTo(x + 6 * k, y - 22 * k); ctx.lineTo(x + 6 * k, y - 4 * k); ctx.lineTo(x + 15 * k, y - 4 * k); ctx.closePath(); ctx.stroke(); ctx.fill();
      if (!m.foot) { ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.strokeText('SUSPECT', x, y - 34 * k); ctx.fillStyle = '#fff'; ctx.fillText('SUSPECT', x, y - 34 * k); } }
    else if (!m.foot) { let dx = m.p.x - W / 2, dy = m.p.y - H * 0.45; if (!m.p.front) { dx = -dx; dy = Math.abs(dy) + H; } const a = Math.atan2(dy, dx), rx = W / 2 - pad, ry = H * 0.3, x = W / 2 + clamp(Math.cos(a) * rx * 1.4, -rx, rx), y = clamp(H * 0.45 + Math.sin(a) * ry * 1.4, top, H - 170 * k);
      ctx.translate(x, y); ctx.fillStyle = '#ff2a1a'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.save(); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(24 * k + bob * 0.6, 0); ctx.lineTo(-8 * k, -15 * k); ctx.lineTo(-8 * k, 15 * k); ctx.closePath(); ctx.stroke(); ctx.fill(); ctx.restore();
      ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.7)'; const tx = `${Math.round(m.d)} m`; ctx.strokeText(tx, -Math.cos(a) * 26 * k, -Math.sin(a) * 26 * k); ctx.fillStyle = '#fff'; ctx.fillText(tx, -Math.cos(a) * 26 * k, -Math.sin(a) * 26 * k); }
    ctx.restore(); }
  // the controls: a stick under the left thumb, two pedals under the right
  if (G.ph === 'drive' && !G.over) { const Pd = pedals(), I = G.in, st = ui.stick, sx0 = st ? st.x0 : 78 * k, sy0 = st ? st.y0 : H - 96 * k, R1 = 46 * k; ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.globalAlpha = st ? 0.9 : 0.5; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(sx0, sy0, R1, 0, TAU); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(sx0 + I.sx * R1, sy0, 20 * k, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillText('◀  STEER  ▶', sx0, sy0 + R1 + 14 * k);
    for (const [key, lab, sub, col] of [['gas', 'GAS', '', '#3fbf6a'], ['brake', 'BRAKE', 'hold: reverse', '#e0483a']]) { const b = Pd[key], on = key === 'gas' ? I.gas : I.brake; ctx.globalAlpha = on ? 1 : 0.72; ctx.fillStyle = on ? col : 'rgba(16,20,28,.72)'; rrect(b.x, b.y, b.w, b.h, 16 * k); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 3; rrect(b.x, b.y, b.w, b.h, 16 * k); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(19 * k)}px ${BC}`; ctx.fillText(lab, b.x + b.w / 2, b.y + b.h / 2 - (sub ? 7 * k : 0)); if (sub) { ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.fillText(sub, b.x + b.w / 2, b.y + b.h / 2 + 13 * k); } }
    ctx.restore(); }
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
