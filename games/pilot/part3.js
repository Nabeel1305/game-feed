// ===================== THE VIEW: Pilot in 3D (three.js through tools/world3d.js) =====================
// An airport in the countryside: a long runway with its markings and lights, approach lights, the four glide-path lights, a
// terminal and hangars, fields and woods, hills, a town; your airliner seen from just behind. Runway direction is -z; the
// threshold is at z = 0; the approach comes from +z. World x = game x, y = height, z = game d.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [];
let hint = null, V3 = null;
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 6) TXT.shift(); }
function tip(key, txt, secs = 2.8) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function fxStep(dt) {
  FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 1.5);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.3) TXT.shift();
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; }
}
function buildWorld() {
  if (V3) return V3; const T = THREE; if (!W3 || !W3.init({ canvas: $('gl'), fov: 62, far: 30000, near: 0.5 })) { V3 = { none: true }; return V3; }
  const S = W3.scene, R0 = W3.rng(9), N3 = new T.ImprovedNoise();
  // the land: a patchwork of fields, woods and a few hills, flat round the airport
  const H = (x, z) => { const d = Math.hypot(x * 0.6, z + 1500); const flat = clamp((d - 2200) / 3000, 0, 1); return flat * (N3.noise(x * 0.0006, 0.5, z * 0.0006) * 260 + N3.noise(x * 0.002, 1.5, z * 0.002) * 60 + 80) - 0.4 + N3.noise(x * 0.01, 2, z * 0.01) * 1.5 * (1 - flat * 0.5); };
  const colour = (x, z, h, sl) => { const fx = Math.floor(x / 180), fz = Math.floor(z / 140), r = (Math.sin(fx * 12.9898 + fz * 78.233) * 43758.5) % 1, k2 = Math.abs(r);
    if (sl > 0.35) return [0.32, 0.3, 0.26]; if (h > 300) return [0.85, 0.87, 0.9]; const field = [[0.36, 0.42, 0.18], [0.5, 0.46, 0.22], [0.24, 0.36, 0.14], [0.55, 0.5, 0.3], [0.18, 0.3, 0.12]][(k2 * 5) | 0]; return field; };
  const gt = W3.grainTex(256, 21, 200, 40, 2); gt.repeat.set(300, 300);
  W3.terrain({ size: 30000, seg: 220, x: 0, z: 4000, height: H, colour, map: gt });
  // the airfield: grass round the runway, the runway itself with its markings, taxiway, apron
  const grass = new T.Mesh(new T.PlaneGeometry(500, 5200), new T.MeshStandardMaterial({ color: 0x4f6b2e, roughness: 0.95, map: gt })); grass.rotation.x = -Math.PI / 2; grass.position.set(0, 0.02, -1500); grass.receiveShadow = true; S.add(grass);
  const rc = document.createElement('canvas'); rc.width = 256; rc.height = 4096; { const g = rc.getContext('2d'); g.fillStyle = '#2a2b2d'; g.fillRect(0, 0, 256, 4096); for (let i = 0; i < 6000; i++) { g.fillStyle = `rgba(${R0() < 0.5 ? 255 : 0},${R0() < 0.5 ? 255 : 0},255,${R0() * 0.04})`; g.fillRect(R0() * 256, R0() * 4096, 2, 2); }
    g.fillStyle = '#e8e6df'; const yOf = d => 4096 - d / RW_LEN * 4096; for (let i = 0; i < 8; i++) g.fillRect(14 + i * 15 + (i >= 4 ? 106 : 0), yOf(70), 9, 4096 * 45 / RW_LEN);       // threshold bars
    g.font = 'bold 120px sans-serif'; g.textAlign = 'center'; g.save(); g.translate(128, yOf(140)); g.fillText('27', 0, 0); g.restore();
    for (let d = 260; d < RW_LEN - 100; d += 60) g.fillRect(126, yOf(d), 4, 4096 * 30 / RW_LEN);                                                                        // centre line
    for (const d of [300, 450, 600]) for (const sx of [-1, 1]) g.fillRect(128 + sx * 52 - 8, yOf(d), 16, 4096 * 22 / RW_LEN);                                           // touchdown zone
    g.fillRect(128 - 70, yOf(400) - 4096 * 45 / RW_LEN, 24, 4096 * 45 / RW_LEN); g.fillRect(128 + 46, yOf(400) - 4096 * 45 / RW_LEN, 24, 4096 * 45 / RW_LEN);            // aiming point
    g.fillRect(2, 0, 3, 4096); g.fillRect(251, 0, 3, 4096); }
  const rt = new T.CanvasTexture(rc); rt.colorSpace = T.SRGBColorSpace; rt.anisotropy = 8;
  const runway = new T.Mesh(new T.PlaneGeometry(45, RW_LEN), new T.MeshStandardMaterial({ map: rt, roughness: 0.75 })); runway.rotation.x = -Math.PI / 2; runway.position.set(0, 0.05, -RW_LEN / 2); runway.receiveShadow = true; S.add(runway);
  const taxi = new T.Mesh(new T.PlaneGeometry(22, RW_LEN), new T.MeshStandardMaterial({ color: 0x343537, roughness: 0.8 })); taxi.rotation.x = -Math.PI / 2; taxi.position.set(-160, 0.04, -RW_LEN / 2); S.add(taxi);
  const apron = new T.Mesh(new T.PlaneGeometry(220, 600), new T.MeshStandardMaterial({ color: 0x3e3f42, roughness: 0.8 })); apron.rotation.x = -Math.PI / 2; apron.position.set(-300, 0.04, -1500); S.add(apron);
  // terminal and hangars
  const glassM = new T.MeshStandardMaterial({ color: 0x5f7a8c, metalness: 0.8, roughness: 0.15, emissive: 0x223344, emissiveIntensity: 0.2 }), wallM = new T.MeshStandardMaterial({ color: 0xb8bcc0, roughness: 0.6 });
  const term = new T.Mesh(new T.BoxGeometry(60, 18, 420), glassM); term.position.set(-440, 9, -1500); term.castShadow = true; S.add(term);
  for (let i = 0; i < 4; i++) { const hg = new T.Mesh(new T.CylinderGeometry(30, 30, 70, 20, 1, false, 0, Math.PI), wallM); hg.rotation.z = Math.PI / 2; hg.rotation.y = Math.PI / 2; hg.position.set(-420, 0, -600 - i * 90); S.add(hg); }
  const tower = new T.Mesh(new T.CylinderGeometry(4, 6, 50, 12), wallM); tower.position.set(-380, 25, -2000); S.add(tower); const cab = new T.Mesh(new T.CylinderGeometry(9, 7, 7, 12), glassM); cab.position.set(-380, 52, -2000); S.add(cab);
  // lights: runway edges, centre line, approach lights (a bar every 30 m out to 900 m), and the four glide-path lights (PAPI)
  const lp = [], lc = [], addL = (x, y, z, c) => { lp.push(x, y, z); lc.push(...c); };
  for (let d = 0; d <= RW_LEN; d += 60) for (const sx of [-1, 1]) addL(sx * 23.5, 0.4, -d, d > RW_LEN - 600 ? [1, 0.6, 0.2] : [1, 0.95, 0.8]);
  for (let d = 0; d <= RW_LEN; d += 30) addL(0, 0.15, -d, [0.9, 0.95, 1]);
  for (let d = 30; d <= 900; d += 30) for (let k = -4; k <= 4; k++) addL(k * 1.6, 0.6 + d * 0.004, d, [1, 0.97, 0.9]);
  for (let k = -12; k <= 12; k++) if (Math.abs(k) > 3) addL(k * 1.6, 0.4, 2, [0.3, 1, 0.4]);
  const lg = new T.BufferGeometry(); lg.setAttribute('position', new T.Float32BufferAttribute(lp, 3)); lg.setAttribute('color', new T.Float32BufferAttribute(lc, 3));
  const lights = new T.Points(lg, new T.PointsMaterial({ size: 3, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.95, depthWrite: false, fog: false })); S.add(lights);
  const papi = []; for (let i = 0; i < 4; i++) { const m = new T.Mesh(new T.SphereGeometry(0.9, 10, 8), new T.MeshBasicMaterial({ color: 0xffffff })); m.position.set(-34 - i * 9, 1, -AIM); S.add(m); papi.push(m); }
  // a town to one side (lit at night)
  const tc = document.createElement('canvas'); tc.width = 64; tc.height = 64; { const g = tc.getContext('2d'); g.fillStyle = '#6b6862'; g.fillRect(0, 0, 64, 64); for (let y = 4; y < 64; y += 10) for (let x = 4; x < 64; x += 10) { g.fillStyle = R0() < 0.4 ? '#ffd28a' : '#2a2c30'; g.fillRect(x, y, 5, 6); } }
  const tt = new T.CanvasTexture(tc); tt.colorSpace = T.SRGBColorSpace; const townM = new T.MeshStandardMaterial({ map: tt, emissiveMap: tt, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.8 });
  const town = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), townM, 500), D = new T.Object3D(); for (let i = 0; i < 500; i++) { const x = 1800 + R0() * 2200, z = 2500 - R0() * 5000, h = 8 + R0() * R0() * 50; D.position.set(x, H(x, z) + h / 2, z); D.scale.set(14 + R0() * 20, h, 14 + R0() * 20); D.updateMatrix(); town.setMatrixAt(i, D.matrix); } S.add(town);
  // woods
  const trees = []; for (let i = 0; i < 2600; i++) { const x = (R0() - 0.5) * 12000, z = 4000 - R0() * 12000; if (Math.abs(x) < 400 && z < 1200 && z > -3500) continue; if (x > 1700 && x < 4100 && z < 2600 && z > -2600) continue; if (N3.noise(x * 0.001, 3, z * 0.001) < 0.05) continue; trees.push({ x, y: H(x, z) - 0.5, z, s: 1.6 + R0() * 1.5, rot: R0() * 6, hue: R0() - 0.5, shade: R0() - 0.6 }); }
  W3.pines(trees, { layers: 3 });
  // the airliner: fuselage, nose, tail cone, swept wings, engines, fin, tailplane, windows, a stripe; gear; lights
  const P = new T.Group(), white = new T.MeshStandardMaterial({ color: 0xf2f3f5, metalness: 0.35, roughness: 0.35 }), blue = new T.MeshStandardMaterial({ color: 0x1d4f9c, metalness: 0.3, roughness: 0.4 }), grey = new T.MeshStandardMaterial({ color: 0x9aa0a8, metalness: 0.6, roughness: 0.35 }), dark = new T.MeshStandardMaterial({ color: 0x111317, roughness: 0.3 });
  const fus = new T.Mesh(new T.CylinderGeometry(2, 2, 30, 24), white); fus.rotation.x = Math.PI / 2; P.add(fus);
  const nose = new T.Mesh(new T.SphereGeometry(2, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), white); nose.rotation.x = -Math.PI / 2; nose.scale.set(1, 1.8, 1); nose.position.z = -15; P.add(nose);
  const tailc = new T.Mesh(new T.ConeGeometry(2, 9, 24), white); tailc.rotation.x = Math.PI / 2; tailc.position.set(0, 0.5, 19.4); P.add(tailc);
  const stripe = new T.Mesh(new T.CylinderGeometry(2.02, 2.02, 30, 24, 1, true, Math.PI * 0.42, Math.PI * 0.16), blue); stripe.rotation.x = Math.PI / 2; P.add(stripe); const stripe2 = stripe.clone(); stripe2.rotation.z = Math.PI; P.add(stripe2);
  const win = new T.Mesh(new T.BoxGeometry(2.4, 0.5, 1.2), dark); win.position.set(0, 0.9, -16.6); win.rotation.x = 0.4; P.add(win);
  const wingS = new T.Shape(); wingS.moveTo(0, -3); wingS.lineTo(17, 4.5); wingS.lineTo(17, 6); wingS.lineTo(0, 3.5); wingS.lineTo(0, -3);
  for (const sd of [-1, 1]) { const w = new T.Mesh(new T.ExtrudeGeometry(wingS, { depth: 0.35, bevelEnabled: false }), white); w.rotation.x = Math.PI / 2; w.scale.x = sd; w.position.set(sd * 1.2, -0.9, 0); P.add(w);
    const eng = new T.Mesh(new T.CylinderGeometry(1.2, 1.0, 4.2, 20), grey); eng.rotation.x = Math.PI / 2; eng.position.set(sd * 6.5, -2.2, -1.2); P.add(eng); const inl = new T.Mesh(new T.CircleGeometry(1.1, 20), dark); inl.position.set(sd * 6.5, -2.2, -3.32); inl.rotation.y = Math.PI; P.add(inl);
    const tp = new T.Mesh(new T.BoxGeometry(6, 0.25, 2.6), white); tp.position.set(sd * 3.5, 0.9, 20); tp.rotation.y = sd * 0.35; P.add(tp);
    const gear = new T.Mesh(new T.CylinderGeometry(0.15, 0.15, 2.2, 8), grey); gear.position.set(sd * 2.6, -2.4, 1.5); P.add(gear); for (const z of [1.0, 2.0]) { const wh = new T.Mesh(new T.CylinderGeometry(0.55, 0.55, 0.4, 14), dark); wh.rotation.z = Math.PI / 2; wh.position.set(sd * 2.6, -3.5, z); P.add(wh); } }
  const ng = new T.Mesh(new T.CylinderGeometry(0.12, 0.12, 2, 8), grey); ng.position.set(0, -2.3, -12); P.add(ng); const nw = new T.Mesh(new T.CylinderGeometry(0.42, 0.42, 0.35, 12), dark); nw.rotation.z = Math.PI / 2; nw.position.set(0, -3.4, -12); P.add(nw);
  const finS = new T.Shape(); finS.moveTo(0, 0); finS.lineTo(7, 0); finS.lineTo(8, 8); finS.lineTo(5.5, 8); finS.lineTo(0, 0); const fin = new T.Mesh(new T.ExtrudeGeometry(finS, { depth: 0.3, bevelEnabled: false }), blue); fin.rotation.y = -Math.PI / 2; fin.position.set(0.15, 1.6, 15.5); P.add(fin);
  P.traverse(o => { if (o.isMesh) o.castShadow = true; }); P.position.y = 3.6; const plane = new T.Group(); plane.add(P); S.add(plane);
  const land = new T.SpotLight(0xfff4e0, 0, 900, 0.18, 0.5, 1); land.position.set(0, 0, -16); const lt = new T.Object3D(); lt.position.set(0, -20, -300); plane.add(land, lt); land.target = lt;
  const strobe = new T.Mesh(new T.SphereGeometry(0.35, 8, 6), new T.MeshBasicMaterial({ color: 0xffffff })); strobe.position.set(0, 2.2, 0); plane.add(strobe);
  const navL = []; for (const [sd, c] of [[-1, 0xff2020], [1, 0x20ff40]]) { const m = new T.Mesh(new T.SphereGeometry(0.3, 8, 6), new T.MeshBasicMaterial({ color: c })); m.position.set(sd * 18, -0.6, 4.6); plane.add(m); navL.push(m); }
  // smoke from the tyres at touchdown
  const NP = 120, pG = new T.BufferGeometry(); pG.setAttribute('position', new T.BufferAttribute(new Float32Array(NP * 3), 3)); pG.setAttribute('a', new T.BufferAttribute(new Float32Array(NP), 1));
  const pM = new T.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { px: { value: 1 } }, vertexShader: `attribute float a; uniform float px; varying float va; void main(){ va = a; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = min(px * 80.0, px * 900.0 / -mv.z); gl_Position = projectionMatrix * mv; }`, fragmentShader: `varying float va; void main(){ float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(0.85, 0.85, 0.85, va * 0.5 * smoothstep(0.5, 0.0, d)); }` });
  const smoke = new T.Points(pG, pM); smoke.frustumCulled = false; S.add(smoke); const puffs = []; for (let i = 0; i < NP; i++) puffs.push({ t: 9, life: 1, x: 0, y: -99, z: 0 });
  V3 = { T, S, plane, P, land, strobe, navL, lights, papi, townM, smoke, puffs, camPos: new T.Vector3(), look: new T.Vector3(), sky: null };
  W3.setQuality(stepN); return V3;
}
function setWeather(G) {
  const V = buildWorld(); if (V.none || V.sky === G.weather) return; V.sky = G.weather;
  W3.setSky(G.weather, { azim: { dawn: 110, sunset: 220, golden: 230, dusk: 205 }[G.weather] || 150, wind: [G.wind * 0.1, 0.2] });
  const dark = W3.S.night || G.weather === 'dusk' || G.weather === 'storm'; V.townM.emissiveIntensity = dark ? 1.2 : 0; V.land.intensity = dark ? 300 : 0; V.lights.material.size = dark ? 5.5 : 3;
  /* 22 Nov 2026 (the audit): night approaches were black, with no runway to see. The runway's lights now shine through dark and haze (as real ones do), and the night is lifted so the land can be read. */
  if (dark) { W3.S.exposure *= 1.5; W3.R.toneMappingExposure = W3.S.exposure; W3.S.hemiI *= 1.4; W3.hemi.intensity = W3.S.hemiI; W3.scene.fog.far *= 1.6; }
  // rain and fog thicken the air down low: the runway comes out of the murk late
  W3.S.onBolt = () => { if (!HEADLESS && sfx.thunder) setTimeout(() => sfx.thunder(), 300 + Math.random() * 900); };
}
function puff(x, z, n) { if (!V3 || V3.none) return; let k2 = 0; for (const p of V3.puffs) { if (p.t < p.life) continue; Object.assign(p, { t: 0, life: 1 + Math.random(), x: x + (Math.random() - 0.5) * 2, y: 0.6, z: z + Math.random() * 3 }); if (++k2 >= n) break; } }
const ui = { snap: false, stick: null, thr: null };
function onEvent(G, e) {
  const cx = W / 2, cy = H * 0.3;
  switch (e.k) {
    case 'warn': sfx.warn(); say({ slow: 'SPEED! TOO SLOW', fast: 'TOO FAST', low: 'TOO LOW', bank: 'BANK ANGLE' }[e.w], cx, cy, '#ffb48a', 22); tip('w_' + e.w, { slow: 'Left thumb up: more power', fast: 'Left thumb down: less power', low: 'Pull back a little to come up to the glide path', bank: 'Level the wings near the ground' }[e.w], 2.8); break;
    case 'online': if (G.lesson) sfx.ding(); break;
    case 'touch': { const a = G.ac; puff(a.x - 2.6, a.d, 14); puff(a.x + 2.6, a.d, 14); FX.shake = e.q === 'butter' ? 3 : e.q === 'smooth' ? 6 : 12; sfx.touch(e.q); vibe(e.q === 'butter' ? HAP.light : HAP.thud);
      say({ butter: 'BUTTER!', smooth: 'SMOOTH LANDING', firm: 'FIRM LANDING', hard: 'HARD, BUT DOWN' }[e.q], cx, cy, e.q === 'butter' ? '#ffe08a' : '#9be3b5', 30); say(`${e.sink.toFixed(1)} m/s down`, cx, cy + 40 * k, '#fff', 18); break; }
    case 'crash': sfx.crash(); FX.shake = 20; FX.red = 0.9; FX.stop = 0.1; say({ short: 'SHORT OF THE RUNWAY', side: 'OFF THE SIDE', hard: 'TOO HARD!', wing: 'A WING HIT', drift: 'SIDEWAYS: THE GEAR GAVE', long: 'OUT OF RUNWAY', lost: 'LOST THE AIRPORT' }[e.why] || 'CRASH', cx, cy, '#ffb4a8', 28);
      tip('c_' + e.why, { short: 'Stay on the glide path: two white, two red', side: 'Line up with the centre line early', hard: 'Pull back just before the wheels touch (the flare)', wing: 'Level the wings before touchdown', drift: 'In a crosswind, point into the wind, then straighten at the end', long: 'Touch down in the first part of the runway', lost: 'Follow the runway lights' }[e.why] || '', 3.2); break;
    case 'lessonnext': if (e.first) hint = null; say(e.first ? 'FIRST, A LESSON' : 'NEXT LESSON', cx, H * 0.5, '#ffd36a', 26); sfx.ding(); ui.snap = true; break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, cx, H * 0.5, '#9be3b5', 26); sfx.coin(e.n); break;
    case 'lessonmiss': hint = { txt: e.how, t: 0, secs: 3.6 }; break;
    case 'lessondone': say('YOU HAVE CONTROL', cx, H * 0.5, '#ffd36a', 28); sfx.win(); ui.snap = true; if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); vibe(HAP.best); break;
    case 'lost': sfx.lose(); break;
  }
}
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#0b1418'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D airport.', W / 2, H / 2); return; }
  const T = V.T, cam = W3.cam, g = G || idleG(), a = g.ac, t = now; setWeather(g);
  const crashed = g.ph === 'crash';
  V.plane.position.set(a.x, a.y, a.d); V.plane.rotation.set(0, 0, 0); V.plane.rotateY(-a.psi); V.plane.rotateX(a.th); V.plane.rotateZ(-a.phi);
  if (crashed) { V.plane.rotateZ(Math.min(0.6, g.ph_t * 0.6) * (g.why === 'wing' ? -1 : 1)); }
  V.strobe.visible = Math.sin(t * 9) > 0.85; V.navL.forEach(m => m.visible = true);
  // the glide-path lights: each shows white above its angle, red below
  const ang = Math.atan2(a.y + 2, Math.max(1, a.d + AIM)) * 180 / Math.PI; V.papi.forEach((m, i) => m.material.color.set(ang > [3.5, 3.17, 2.83, 2.5][i] ? 0xffffff : 0xff2a2a));
  // camera: behind and above, swinging round with the bank; lower and closer near the ground
  const near = clamp(a.y / 60, 0, 1), back = 42 + 20 * near, up = 9 + 6 * near;
  const want = new T.Vector3(a.x + Math.sin(a.psi) * back * 0.9 - a.phi * 6, a.y + up, a.d + Math.cos(a.psi) * back), look = new T.Vector3(a.x - Math.sin(a.psi) * 60, a.y + 2 - 6 * near, a.d - 120);
  if (ui.snap) { V.camPos.copy(want); V.look.copy(look); } else { V.camPos.lerp(want, Math.min(1, dt * 3)); V.look.lerp(look, Math.min(1, dt * 3)); } ui.snap = false;
  if (V.camPos.y < 2) V.camPos.y = 2;
  cam.position.copy(V.camPos); cam.fov = innerWidth > innerHeight ? 50 : 62; cam.updateProjectionMatrix(); cam.lookAt(V.look); cam.rotateZ(-a.phi * 0.25);
  if (FX.shake > 0) { cam.rotation.x += (Math.random() - 0.5) * FX.shake * 0.002; cam.rotation.y += (Math.random() - 0.5) * FX.shake * 0.002; }
  const pa = V.smoke.geometry.attributes.position, aa = V.smoke.geometry.attributes.a; V.puffs.forEach((p, i) => { if (p.t < p.life) { p.t += dt; p.y += dt * 1.5; } pa.setXYZ(i, p.x, p.t < p.life ? p.y : -99, p.z); aa.setX(i, p.t < p.life ? 1 - p.t / p.life : 0); }); pa.needsUpdate = aa.needsUpdate = true; V.smoke.material.uniforms.px.value = W3.R.getPixelRatio() * innerHeight / 844;
  W3.setFocus(a.x, Math.max(0, a.y - 3), a.d, 45);
  W3.render(dt);
  if (G) hud(G);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 0.9 ? 1 : 1 - (t2.t - 0.9) / 0.4; ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(t2.size * k)}px ${BC}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 26 * k); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 26 * k); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(16 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 20 * k, h = lines.length * lh + 16 * k, w = Math.min(W - 24, Math.max(...lines.map(l => ctx.measureText(l).width)) + 34);
    ctx.fillStyle = 'rgba(0,0,0,.6)'; rrect(W / 2 - w / 2, H * 0.56 - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.56 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,60,30,${FX.red * 0.25})`; ctx.fillRect(0, 0, W, H); }
}
let IG = null; function idleG() { if (!IG) IG = newGame(Math.max(1, store.get('level', 1) | 0), { seed: 2 }); const m = {}; if (IG.ph === 'air') { honest(IG, { react: 0.1, acc: 1 }, m); step(IG, 1 / 60); } IG.ev.length = 0; if (IG.ph !== 'air' || IG.over) { IG.over = null; approach(IG, 4000, 0); } return IG; }
function weatherName(w) { return { dawn: 'DAWN', morning: 'MORNING', golden: 'GOLDEN HOUR', overcast: 'OVERCAST', mist: 'FOG', sunset: 'SUNSET', noon: 'MIDDAY', dusk: 'DUSK', rain: 'RAIN', storm: 'STORM', night: 'NIGHT' }[w] || ''; }
function hud(G) {
  const c = G.cfg, a = G.ac, x = 14, y = 44 * k;
  if (G.lesson) lessonPanel(G);
  if (G.t < 3.2 && !G.lesson) { ctx.globalAlpha = Math.min(1, (3.2 - G.t) / 0.6); ctx.textAlign = 'center'; ctx.font = `700 ${Math.round(15 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.5)';
    const s = `FLIGHT ${G.N} · ${weatherName(G.weather)}${c.wind > 1 ? ` · CROSSWIND ${Math.round(c.wind * 1.94)} KT` : ''}`; ctx.strokeText(s, W / 2, H * 0.2); ctx.fillText(s, W / 2, H * 0.2); ctx.globalAlpha = 1; }
  // the instruments, simply: speed (with its green band), height, sink rate, distance, and where you are against the glide path
  const by = G.lesson ? H * 0.32 : y + 4 * k, box = (bx, label, val, col) => { ctx.fillStyle = 'rgba(0,0,0,.45)'; rrect(bx, by, 84 * k, 40 * k, 8); ctx.fill(); ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.fillText(label, bx + 42 * k, by + 11 * k); ctx.fillStyle = col; ctx.font = `700 ${Math.round(17 * k)}px ${BC}`; ctx.fillText(val, bx + 42 * k, by + 28 * k); };
  const kt = Math.round(a.v * 1.94), ok = a.v > 66 && a.v < 82; box(x, 'SPEED', `${kt} kt`, ok ? '#9be3b5' : a.v < 60 ? '#ff6b5a' : '#ffd36a');
  box(W / 2 - 42 * k, 'HEIGHT', `${Math.max(0, Math.round(a.y * 3.28))} ft`, '#fff');
  const vs = Math.round(a.vy * 196.85); box(W - x - 84 * k, 'SINK', `${vs} fpm`, a.y < 30 && -a.vy > c.sink * 0.8 ? '#ff6b5a' : '#fff');
  // the glide-path and centre-line marks (a diamond on each scale), and distance
  if (a.d > -50 && G.ph === 'air') { const gs = clamp((a.y - (a.d + AIM) * Math.tan(GS)) / Math.max(8, a.d * 0.012), -1, 1), lc = clamp(a.x / Math.max(15, a.d * 0.02), -1, 1);
    const sx = W - 20 * k, sy = H * 0.5, sh = 90 * k; ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx, sy - sh); ctx.lineTo(sx, sy + sh); ctx.stroke(); ctx.fillStyle = '#ff7adf'; ctx.beginPath(); const dy = sy - gs * sh; ctx.moveTo(sx, dy - 8 * k); ctx.lineTo(sx + 7 * k, dy); ctx.lineTo(sx, dy + 8 * k); ctx.lineTo(sx - 7 * k, dy); ctx.fill();
    const lx = W / 2, ly = H - 120 * k, lw = 100 * k; ctx.beginPath(); ctx.moveTo(lx - lw, ly); ctx.lineTo(lx + lw, ly); ctx.stroke(); ctx.fillStyle = '#ff7adf'; const dx2 = lx - lc * lw; ctx.beginPath(); ctx.moveTo(dx2 - 8 * k, ly); ctx.lineTo(dx2, ly - 7 * k); ctx.lineTo(dx2 + 8 * k, ly); ctx.lineTo(dx2, ly + 7 * k); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillText(a.d > 0 ? `${(a.d / 1852).toFixed(1)} nm to the runway` : 'OVER THE RUNWAY', lx, ly + 22 * k); }
  // the throttle lever (left) and the column (where your thumb is)
  const tx = 26 * k, ty = H * 0.62, th = 120 * k; ctx.fillStyle = 'rgba(0,0,0,.4)'; rrect(tx - 9 * k, ty - th, 18 * k, th * 2, 9); ctx.fill(); ctx.fillStyle = '#ffd36a'; const ky = ty + th - G.thr * th * 2; rrect(tx - 14 * k, ky - 7 * k, 28 * k, 14 * k, 5); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillText('POWER', tx, ty + th + 14 * k);
  if (ui.stick) { const s = ui.stick; ctx.globalAlpha = 0.35; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(s.x0, s.y0, 50 * k, 0, TAU); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s.x0 + G.st.x * 50 * k, s.y0 + G.st.y * 50 * k, 13 * k, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
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
  ctx.restore(); ctx.textBaseline = 'middle';
}
