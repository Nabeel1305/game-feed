// ===================== THE VIEW: Whaling in 3D (three.js through tools/world3d.js) =====================
// A grey, heaving sea (a golden one some days), a long wooden whaleboat with six men at the oars and the harpooner standing in
// the bow, seen from just behind. The whale: a long dark back rolling along the top, a spout of white breath, flukes lifting
// as she dives. On the line, the rope runs taut from the bow to her and the boat heels over if the bow strays; white water
// bursts ahead of her before a run.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [];
let hint = null, V3 = null;
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 6) TXT.shift(); }
function tip(key, txt, secs = 2.8) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function fxStep(dt) {
  FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 1.8);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.3) TXT.shift();
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; }
}
const ui = { L: null, R: null };
function glowTex() { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); }
function buildBoat(T) {
  const g = new T.Group(), wood = new T.MeshStandardMaterial({ color: 0x7a5a3a, roughness: 0.8, map: W3.grainTex(128, 6, 180, 40, 6) }), dark = new T.MeshStandardMaterial({ color: 0x2a2420, roughness: 0.9 });
  const hg = new T.BoxGeometry(1.8, 0.8, 8.5, 2, 1, 10), p = hg.attributes.position;
  for (let i = 0; i < p.count; i++) { const z = p.getZ(i), y = p.getY(i), e = Math.pow(Math.abs(z) / 4.25, 2.2); p.setX(i, p.getX(i) * (1 - e * 0.92) * (y < 0 ? 0.6 : 1)); p.setY(i, y + e * 0.35 * (y > 0 ? 1 : 0)); }
  hg.computeVertexNormals(); const hull = new T.Mesh(hg, wood); hull.position.y = 0.15; g.add(hull);
  const crewM = [0x2a3440, 0x3a2a24, 0x2a2a2a, 0x40382a].map(c2 => new T.MeshStandardMaterial({ color: c2, roughness: 0.9 })), skin = new T.MeshStandardMaterial({ color: 0xc89070, roughness: 0.8 });
  const oars = [];
  for (let i = 0; i < 6; i++) { const z = -2.6 + i * 1.0, s = i % 2 ? 1 : -1; const man = new T.Group(); man.position.set(-s * 0.25, 0.55, z); g.add(man);
    const body = new T.Mesh(new T.CapsuleGeometry(0.2, 0.45, 4, 8), crewM[i % 4]); body.position.y = 0.3; man.add(body); const hd = new T.Mesh(new T.SphereGeometry(0.13, 10, 8), skin); hd.position.y = 0.72; man.add(hd); const hat = new T.Mesh(new T.CylinderGeometry(0.14, 0.16, 0.08, 10), dark); hat.position.y = 0.82; man.add(hat);
    const oar = new T.Group(); oar.position.set(s * 0.85, 0.65, z); const shaft = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 4.2, 6), wood); shaft.rotation.z = Math.PI / 2; shaft.position.x = s * 1.6; oar.add(shaft); const blade = new T.Mesh(new T.BoxGeometry(0.6, 0.02, 0.18), wood); blade.position.x = s * 3.5; oar.add(blade); oar.userData = { s, man, i }; g.add(oar); oars.push(oar); }
  const harp = new T.Group(); harp.position.set(0, 0.6, 3.2); g.add(harp); const hb = new T.Mesh(new T.CapsuleGeometry(0.22, 0.6, 4, 8), crewM[0]); hb.position.y = 0.45; harp.add(hb); const hh = new T.Mesh(new T.SphereGeometry(0.14, 10, 8), skin); hh.position.y = 0.95; harp.add(hh);
  const arm = new T.Group(); arm.position.set(0.25, 0.75, 0); harp.add(arm); const iron = new T.Mesh(new T.CylinderGeometry(0.025, 0.025, 2.2, 6), new T.MeshStandardMaterial({ color: 0x8a7a6a, roughness: 0.6 })); iron.position.y = 0.9; arm.add(iron); arm.rotation.x = -0.4;
  const tub = new T.Mesh(new T.CylinderGeometry(0.3, 0.28, 0.4, 14), wood); tub.position.set(0, 0.5, -0.3); g.add(tub);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); g.userData = { oars, arm }; return g;
}
function buildWhale(T) {
  const g = new T.Group(), skin = new T.MeshStandardMaterial({ color: 0x3a3e44, roughness: 0.45, map: W3.grainTex(128, 13, 130, 50, 3) }), belly = new T.MeshStandardMaterial({ color: 0x8a8e92, roughness: 0.6 });
  const body = new T.Mesh(new T.SphereGeometry(1, 32, 18), skin); body.scale.set(2.0, 1.9, 7.5); body.position.z = 0.5; g.add(body);
  const head = new T.Mesh(new T.SphereGeometry(1, 28, 16), skin); head.scale.set(1.9, 2.0, 3.2); head.position.set(0, 0.2, 5.6); g.add(head);
  const jaw = new T.Mesh(new T.SphereGeometry(1, 16, 10), belly); jaw.scale.set(0.6, 0.4, 2.6); jaw.position.set(0, -1.5, 5.2); g.add(jaw);
  const tail = new T.Group(); tail.position.z = -6.2; g.add(tail); const stock = new T.Mesh(new T.CylinderGeometry(0.9, 0.4, 5, 16), skin); stock.rotation.x = Math.PI / 2; stock.position.z = -2.2; tail.add(stock);
  const fl = new T.Mesh(new T.SphereGeometry(1, 20, 8), skin); fl.scale.set(3.6, 0.18, 1.3); fl.position.z = -4.8; tail.add(fl);
  for (const s of [-1, 1]) { const fin = new T.Mesh(new T.SphereGeometry(1, 12, 8), skin); fin.scale.set(1.4, 0.15, 0.6); fin.position.set(s * 1.9, -0.9, 3.0); fin.rotation.z = s * 0.4; g.add(fin); }
  const hump = new T.Mesh(new T.SphereGeometry(0.6, 12, 8), skin); hump.scale.set(1, 0.7, 1.6); hump.position.set(0, 1.7, -2.5); g.add(hump);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; } }); g.userData = { tail }; return g;
}
function buildWorld() {
  if (V3) return V3; const T = THREE; if (!W3 || !W3.init({ canvas: $('gl'), fov: 58, far: 5000, near: 0.1 })) { V3 = { none: true }; return V3; }
  const S = W3.scene, glow = glowTex();
  const sea = W3.water({ size: 9000, color: 0x0a1e26, distort: 2.0, ripple: 1.3, speed: 0.9 });
  const boat = buildBoat(T), whale = buildWhale(T); S.add(boat, whale);
  const NP = 90, pG = new T.BufferGeometry(); pG.setAttribute('position', new T.BufferAttribute(new Float32Array(NP * 3), 3));
  const puffs = new T.Points(pG, new T.PointsMaterial({ map: glow, color: 0xf4f6f8, size: 2.2, transparent: true, opacity: 0.8, depthWrite: false, sizeAttenuation: true })); puffs.frustumCulled = false; S.add(puffs);
  const foam = new T.Points(new T.BufferGeometry().setAttribute('position', new T.BufferAttribute(new Float32Array(NP * 3), 3)), new T.PointsMaterial({ map: glow, color: 0xffffff, size: 3, transparent: true, opacity: 0.9, depthWrite: false })); foam.frustumCulled = false; S.add(foam);
  const lineG = new T.BufferGeometry().setAttribute('position', new T.BufferAttribute(new Float32Array(30 * 3), 3)); const line = new T.Line(lineG, new T.LineBasicMaterial({ color: 0xd8c8a0 })); line.frustumCulled = false; S.add(line);
  const dart = new T.Mesh(new T.CylinderGeometry(0.04, 0.04, 2.2, 6), new T.MeshStandardMaterial({ color: 0x8a7a6a })); S.add(dart);
  V3 = { T, S, sea, boat, whale, puffs, foam, line, dart, P: [], F: [], cam: { x: 0, y: 6, z: -12 }, row: 0 };
  for (let i = 0; i < NP; i++) { V3.P.push({ t: 9, life: 1, x: 0, y: -99, z: 0, vy: 0 }); V3.F.push({ t: 9, life: 1, x: 0, y: -99, z: 0 }); }
  W3.setQuality(stepN); return V3;
}
function setWeather(G) {
  const V = buildWorld(); if (V.none || V.sky === G.weather) return; V.sky = G.weather;
  W3.setSky(G.weather, { azim: 200 });
  W3.S.onBolt = () => { if (!HEADLESS && sfx.thunder) setTimeout(() => sfx.thunder(), 300 + Math.random() * 900); };
}
function emit(arr, n, x, y, z, spread, life, vy) { let k2 = 0; for (const p of arr) { if (p.t < p.life) continue; Object.assign(p, { t: 0, life: life * (0.7 + Math.random() * 0.6), x: x + (Math.random() - 0.5) * spread, y, z: z + (Math.random() - 0.5) * spread, vy: vy * (0.6 + Math.random() * 0.8), vx: (Math.random() - 0.5) * 2, vz: (Math.random() - 0.5) * 2 }); if (++k2 >= n) break; } }
function onEvent(G, e) {
  const cx = W / 2, cy = H * 0.3;
  switch (e.k) {
    case 'whale': sfx.distant(); break;
    case 'blow': sfx.blow(); say('THERE SHE BLOWS!', cx, cy, '#e8f4ff', 22); break;
    case 'dive': sfx.splash(0.6); break;
    case 'throw': sfx.throw(); if (V3 && !V3.none) V3.throwT = 0.5; break;
    case 'hit': sfx.hit(); FX.shake = 10; FX.flash = 0.4; vibe(HAP.heavy); say('FAST TO HER! HOLD ON!', cx, cy, '#ffe08a', 24); tip('haul', 'Hold your right thumb to haul. Lift it when her flukes rise!', 3); break;
    case 'miss': sfx.splash(0.4); say(e.under ? 'SHE WAS UNDER!' : 'MISSED!', cx, cy, '#ffd0c4', 22); if (e.under) tip('under', 'Throw only while her back is up', 2.6); else tip('lead', 'Lead her: throw a little ahead of where she is going', 2.6); break;
    case 'warn': sfx.warn(); vibe(HAP.sharp); say('SHE\'S GOING TO RUN! LET GO!', cx, cy, '#ffb46a', 22); break;
    case 'surge': sfx.surge(); FX.shake = 6; break;
    case 'swerve': break;
    case 'snap': sfx.snap(); FX.red = 0.6; FX.shake = 12; say('THE LINE SNAPPED!', cx, cy, '#ffb4a8', 26); break;
    case 'runout': sfx.snap(); FX.red = 0.5; say('OUT OF LINE!', cx, cy, '#ffb4a8', 26); tip('runout', 'Haul when she is calm, or the line runs out', 3); break;
    case 'capsize': sfx.splash(1.2); FX.red = 0.6; FX.shake = 14; say('OVER SHE GOES!', cx, cy, '#ffb4a8', 26); tip('heel', 'Keep the bow pointing at her with your left thumb', 3); break;
    case 'gone': if (e.why === 'harpoons') { sfx.splash(0.5); say('SHE GOT AWAY', cx, cy, '#ffd0c4', 24); } break;
    case 'caught': sfx.caught(e.n); FX.flash = 0.6; vibe(HAP.best); say('SHE\'S SPENT. WELL DONE!', cx, cy, '#ffe08a', 24); break;
    case 'lessonnext': if (e.first) hint = null; say(e.first ? 'FIRST, A LESSON' : 'NEXT LESSON', cx, H * 0.5, '#ffd36a', 26); sfx.ding(); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, cx, H * 0.5, '#9be3b5', 26); sfx.coin(e.n); break;
    case 'lessonmiss': hint = { txt: e.how, t: 0, secs: 3.6 }; break;
    case 'lessondone': say('A WHALER NOW!', cx, H * 0.5, '#ffd36a', 26); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); vibe(HAP.best); break;
    case 'lost': sfx.lose(); break;
  }
}
const VW = new (window.THREE ? THREE.Vector3 : Object)();
// where the right thumb is aiming: it starts straight ahead at half range; sideways turns it, up is further, down is nearer
function throwAim(u, G) { const dx = u.x - u.x0, dy = u.y - u.y0; return { aim: -clamp(dx / (150 * k), -0.9, 0.9), dist: clamp(15 - dy / (170 * k) * 15, 6, G.cfg.range) }; }
function wScreen(x, y, z) { W3.cam.updateMatrixWorld(); VW.set(x, y, z); return W3.screen(VW); }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#0e1a20'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D sea.', W / 2, H / 2); return; }
  const T = V.T, g = G || idleG(), t = now; setWeather(g); const b = g.boat, w = g.whale;
  // the boat: bobbing on the swell, heeling on the line, oars rowing in the chase
  const swell = Math.sin(t * 1.1) * 0.25 + Math.sin(t * 0.7 + 1) * 0.15;
  V.boat.position.set(b.x, swell, b.z); V.boat.rotation.set(Math.sin(t * 1.1 + 0.5) * 0.05, b.h, Math.sin(t * 0.9) * 0.04 + (b.heel || 0) * 0.5 * Math.sign(b.err || 1));
  V.row += dt * (g.ph === 'chase' ? 2.2 : 0); V.boat.userData.oars.forEach(o => { const a = V.row * TAU / 2.2 + o.userData.i * 0.1; o.rotation.y = (g.ph === 'chase' ? Math.sin(a) * 0.45 : 0.6) * o.userData.s; o.rotation.z = (g.ph === 'chase' ? Math.cos(a) * 0.12 : 0.25) * -o.userData.s; o.userData.man.rotation.x = g.ph === 'chase' ? Math.sin(a) * 0.3 : -0.2; });
  V.throwT = Math.max(0, (V.throwT || 0) - dt); V.boat.userData.arm.rotation.x = V.throwT > 0 ? -2.2 + (0.5 - V.throwT) * 4 : -0.4;
  // the whale: rolling along the top, or down below; flukes up as she dives and before a run
  if (w) { const riding = g.ph === 'ride' || g.ph === 'done'; let y = -6; if (g.ph === 'chase') { const k2 = w.up ? Math.min(1, w.t / 1.2) * Math.min(1, (w.dur - w.t) / 1.2 + 0.2) : 0; y = -6 + 5.6 * k2; } else if (riding) y = -0.6 + Math.sin(t * 0.8) * 0.3 - (w.surge > 0 ? 1.2 : 0);
    V.whale.position.set(w.x, y, w.z); V.whale.rotation.set(g.ph === 'chase' && !w.up ? 0.15 : Math.sin(t * 0.8) * 0.05, w.h, Math.sin(t * 0.5) * 0.06);
    V.whale.userData.tail.rotation.x = Math.sin(t * (w.surge > 0 ? 6 : 2)) * 0.25 - (w.warn > 0 ? 0.9 : 0) - (g.ph === 'chase' && !w.up && w.t < 1.5 ? 1 - w.t / 1.5 : 0);
    if (g.ph === 'chase' && w.spout > 0 && Math.random() < 0.7) emit(V.P, 3, w.x + Math.sin(w.h) * 6, 1.5, w.z + Math.cos(w.h) * 6, 0.8, 1.4, 7);
    if ((w.warn > 0 || w.surge > 0) && riding) emit(V.F, 4, w.x + Math.sin(w.h) * 8, 0.3, w.z + Math.cos(w.h) * 8, 6, 0.8, 1.5); }
  // spout and white water
  const pa = V.puffs.geometry.attributes.position, fa = V.foam.geometry.attributes.position;
  V.P.forEach((p, i) => { if (p.t < p.life) { p.t += dt; p.y += p.vy * dt; p.vy *= 0.97; p.x += p.vx * dt; p.z += p.vz * dt; } pa.setXYZ(i, p.x, p.t < p.life ? p.y : -99, p.z); }); pa.needsUpdate = true;
  V.F.forEach((p, i) => { if (p.t < p.life) { p.t += dt; p.y += p.vy * dt; p.vy -= 4 * dt; p.x += p.vx * dt * 2; p.z += p.vz * dt * 2; } fa.setXYZ(i, p.x, p.t < p.life ? Math.max(0, p.y) : -99, p.z); }); fa.needsUpdate = true;
  // the harpoon in the air; the line
  const d0 = g.darts[0]; V.dart.visible = !!d0; if (d0) { const u = d0.t, x = lerp(d0.x, d0.tx, u), z = lerp(d0.z, d0.tz, u), y = 1.8 + Math.sin(u * Math.PI) * d0.dist * 0.18; V.dart.position.set(x, y, z); V.dart.rotation.set(Math.PI / 2 - (0.5 - u) * 1.2, 0, 0); V.dart.rotation.y = Math.atan2(d0.tx - d0.x, d0.tz - d0.z); V.dart.rotation.order = 'YXZ'; }
  V.line.visible = g.ph === 'ride' && !!w; if (V.line.visible) { const la = V.line.geometry.attributes.position, bx = b.x + Math.sin(b.h) * 3.8, bz = b.z + Math.cos(b.h) * 3.8, sag = Math.max(0, 1 - g.T) * 3; for (let i = 0; i < 30; i++) { const u = i / 29; la.setXYZ(i, lerp(bx, w.x, u), lerp(1.1, -0.2, u) - Math.sin(u * Math.PI) * sag, lerp(bz, w.z, u)); } la.needsUpdate = true; V.line.material.color.setHex(g.T > 0.95 ? 0xff6a4a : g.T > 0.4 ? 0xf0e0a8 : 0xa89a80); }
  // the camera: behind the boat, looking where she is going (or at the whale on the line)
  const C = V.cam, look = g.ph === 'ride' && w ? Math.atan2(w.x - b.x, w.z - b.z) : b.h, cx = b.x - Math.sin(look) * 9.5, cz = b.z - Math.cos(look) * 9.5, e = 1 - Math.exp(-dt * 3);
  C.x += (cx - C.x) * e; C.y += (4.6 - C.y) * e; C.z += (cz - C.z) * e;
  const cam = W3.cam; cam.position.set(C.x, C.y + swell * 0.3, C.z); cam.lookAt(b.x + Math.sin(look) * 12, 0.8, b.z + Math.cos(look) * 12);
  if (FX.shake > 0) cam.rotation.z += (Math.random() - 0.5) * FX.shake * 0.003;
  W3.setFocus(b.x, 0, b.z, 40);
  W3.render(dt);
  if (G) hud(G, t);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 0.9 ? 1 : 1 - (t2.t - 0.9) / 0.4; ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(t2.size * k)}px ${BC}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 22); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 22); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(15 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 19 * k, h = lines.length * lh + 16 * k, w2 = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30;
    ctx.fillStyle = 'rgba(0,0,0,.66)'; rrect(W / 2 - w2 / 2, H * 0.45 - h / 2, w2, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.45 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,60,40,${FX.red * 0.18})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); }
}
let IG = null; function idleG() { if (!IG) { IG = newGame(4, { seed: 9 }); IG.mem = {}; } honest(IG, { react: 0.25, acc: 0.95 }, IG.mem); step(IG, 1 / 60); IG.ev.length = 0; if (IG.over || IG.ph === 'done' && IG.gap <= 0.1) { IG = null; return idleG(); } return IG; }
function hud(G, t) {
  const c = G.cfg, w = G.whale, b = G.boat;
  if (G.lesson) lessonPanel(G);
  const ty = G.lesson ? H * 0.25 : 44 * k;
  if (!G.lesson) { ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; ctx.fillStyle = '#fff'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.5)'; const s = `WHALE ${Math.min(G.caught + 1, c.whales)} OF ${c.whales}`; ctx.strokeText(s, 16, ty); ctx.fillText(s, 16, ty);
    for (let i = 0; i < c.lives; i++) { ctx.beginPath(); ctx.arc(W - 22 - i * 16 * k, ty + 8 * k, 5 * k, 0, TAU); ctx.fillStyle = i < G.lives ? '#e8d8a8' : 'rgba(255,255,255,.25)'; ctx.fill(); } }
  if (G.ph === 'chase' && w) {
    // harpoons left, how far she is, an arrow if she is off the screen
    for (let i = 0; i < c.harpoons; i++) { ctx.strokeStyle = i < G.harps ? '#e8d8a8' : 'rgba(255,255,255,.2)'; ctx.lineWidth = 3 * k; ctx.beginPath(); ctx.moveTo(18 + i * 12 * k, ty + 46 * k); ctx.lineTo(18 + i * 12 * k, ty + 22 * k); ctx.stroke(); }
    const dist = Math.hypot(w.x - b.x, w.z - b.z), p = wScreen(w.x, 1, w.z), on = p.front && p.x > 0 && p.x < W && p.y > 0 && p.y < H;
    ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillStyle = dist < c.range ? '#9be3b5' : '#fff';
    if (on && w.up) { ctx.strokeText(`${Math.round(dist)} m${dist < c.range ? ' · IN RANGE' : ''}`, p.x, p.y - 34 * k); ctx.fillText(`${Math.round(dist)} m${dist < c.range ? ' · IN RANGE' : ''}`, p.x, p.y - 34 * k); }
    if (!on || !w.up) { let ax = p.x - W / 2, ay = p.y - H / 2; if (!p.front) { ax = -ax; ay = -ay; } if (on) { ax = p.x - W / 2; ay = p.y - H / 2; } const s2 = Math.min((W / 2 - 30) / Math.abs(ax || 1e-3), (H / 2 - 120) / Math.abs(ay || 1e-3), on ? 1 : 1e9); ctx.save(); ctx.translate(W / 2 + ax * s2, H / 2 + ay * s2); if (!on) { ctx.rotate(Math.atan2(ay, ax)); ctx.fillStyle = w.up ? '#e8f4ff' : 'rgba(232,244,255,.45)'; ctx.beginPath(); ctx.moveTo(16 * k, 0); ctx.lineTo(-8 * k, -10 * k); ctx.lineTo(-8 * k, 10 * k); ctx.closePath(); ctx.fill(); } else { ctx.strokeStyle = 'rgba(232,244,255,.5)'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(0, 0, 16 * k, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = 'rgba(232,244,255,.7)'; ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.fillText('DIVING', 0, 28 * k); } ctx.restore(); }
    // the throw being aimed (22 Nov 2026): a ring on the water where the harpoon will land, moved by the right thumb
    if (ui.R) { const A = throwAim(ui.R, G), b = G.boat, a2 = b.h + A.aim, tx = b.x + Math.sin(a2) * A.dist, tz = b.z + Math.cos(a2) * A.dist, s0 = wScreen(b.x, 1.2, b.z), s1 = wScreen(tx, 0.3, tz), s2 = wScreen(tx + 2.2, 0.3, tz);
      if (s1 && s1.front !== false) { const rr = Math.max(12 * k, Math.abs((s2 ? s2.x : s1.x + 20) - s1.x)), hit = on && w.up && Math.hypot(w.x - tx, w.z - tz) < 4; ctx.strokeStyle = hit ? '#7dff9a' : '#ffe9a8'; ctx.lineWidth = 3 * k; ctx.setLineDash([8 * k, 8 * k]); ctx.beginPath(); if (s0) ctx.moveTo(s0.x, s0.y); else ctx.moveTo(W / 2, H * 0.7); ctx.quadraticCurveTo((s0 ? s0.x : W / 2) * 0.5 + s1.x * 0.5, Math.min(s0 ? s0.y : H * 0.7, s1.y) - 70 * k, s1.x, s1.y); ctx.stroke(); ctx.setLineDash([]);
        ctx.lineWidth = 4 * k; ctx.beginPath(); ctx.ellipse(s1.x, s1.y, rr, rr * 0.42, 0, 0, TAU); ctx.stroke(); ctx.fillStyle = hit ? 'rgba(125,255,154,.25)' : 'rgba(255,233,168,.18)'; ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 3; ctx.strokeText('LET GO TO THROW', s1.x, s1.y + rr * 0.42 + 16 * k); ctx.fillText('LET GO TO THROW', s1.x, s1.y + rr * 0.42 + 16 * k); } }
  }
  if (G.ph === 'ride' && w) {
    // the tension gauge: the band that tires her, the red where it snaps
    const gx = W - 34 * k, gy = H * 0.3, gh = H * 0.36, gw = 16 * k, at = v => gy + gh - clamp(v / 1.2, 0, 1) * gh;
    ctx.fillStyle = 'rgba(0,0,0,.45)'; rrect(gx - 4, gy - 4, gw + 8, gh + 8, 8); ctx.fill();
    ctx.fillStyle = 'rgba(140,220,160,.35)'; ctx.fillRect(gx, at(0.95), gw, at(0.4) - at(0.95)); ctx.fillStyle = 'rgba(255,90,70,.45)'; ctx.fillRect(gx, gy, gw, at(1) - gy);
    ctx.fillStyle = G.T >= 1 ? '#ff5a46' : G.T > 0.4 ? '#9be3b5' : '#e8d8a8'; ctx.fillRect(gx, at(G.T), gw, gy + gh - at(G.T));
    ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillText('LINE', gx + gw / 2, gy + gh + 14 * k);
    // her strength, the line left on the tub, the heel
    const bx = 16, bw = W * 0.55, by = H * 0.24; ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillText('HER STRENGTH', bx, by - 6 * k); ctx.fillStyle = 'rgba(0,0,0,.45)'; rrect(bx, by, bw, 9 * k, 4); ctx.fill(); ctx.fillStyle = '#c8d8e8'; rrect(bx, by, bw * clamp(w.stam / c.stamina, 0, 1), 9 * k, 4); ctx.fill();
    const lf = 1 - G.line / c.lineMax; ctx.fillStyle = '#fff'; ctx.fillText('LINE LEFT IN THE TUB', bx, by + 24 * k); ctx.fillStyle = 'rgba(0,0,0,.45)'; rrect(bx, by + 30 * k, bw, 7 * k, 3); ctx.fill(); ctx.fillStyle = lf < 0.25 ? '#ff7a5a' : '#e8d8a8'; rrect(bx, by + 30 * k, bw * clamp(lf, 0, 1), 7 * k, 3); ctx.fill();
    if (b.heel > 0.2) { ctx.fillStyle = `rgba(255,140,100,${Math.min(1, b.heel)})`; ctx.font = `700 ${Math.round(16 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillText((b.err > 0 ? 'STEER LEFT' : 'STEER RIGHT') + ': BOW TO HER!', W / 2, H * 0.62); }
    if (w.warn > 0 || w.surge > 0) { ctx.fillStyle = Math.sin(t * 20) > 0 ? '#ffb46a' : '#fff'; ctx.font = `800 ${Math.round(20 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillText(G.haul ? 'LET GO!' : 'LET IT RUN', W / 2, H * 0.55); }
  }
  // the thumbs: left steers, right throws or hauls
  const lb = ui.L, rb = ui.R; ctx.globalAlpha = 0.5; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
  const lx = lb ? lb.x0 : W * 0.22, ly = lb ? lb.y0 : H - 110 * k; ctx.beginPath(); ctx.arc(lx, ly, 46 * k, 0, TAU); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(lx - G.steer * 46 * k, ly, 14 * k, 0, TAU); ctx.fill();
  ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillText('STEER', lx, ly + 62 * k);
  const rx = W * 0.78, ry = H - 110 * k; ctx.fillText(G.ph === 'ride' ? (G.haul ? 'HAULING' : 'HOLD TO HAUL') : 'HOLD · MOVE THE RING · LET GO', rx, ry + 62 * k); if (G.ph === 'ride') { ctx.globalAlpha = G.haul ? 0.9 : 0.5; ctx.beginPath(); ctx.arc(rx, ry, 30 * k, 0, TAU); ctx.fillStyle = G.haul ? '#9be3b5' : 'rgba(255,255,255,.3)'; ctx.fill(); }
  ctx.globalAlpha = 1;
}
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) {
  const D = G.lesson, st = D.steps[D.i], x = 14, w = W - 28, y = 42 * k; ctx.save();
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; const lines = wrapText(st.how, w - 24), h = 54 * k + lines.length * 17 * k;
  ctx.fillStyle = 'rgba(0,0,0,.62)'; rrect(x, y, w, h, 12); ctx.fill(); ctx.strokeStyle = 'rgba(255,211,106,.7)'; ctx.lineWidth = 2; rrect(x, y, w, h, 12); ctx.stroke();
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#ffd36a'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillText(`LESSON ${D.i + 1} OF ${D.steps.length}`, x + 12, y + 10 * k);
  ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(18 * k)}px ${BC}`; ctx.fillText(st.title, x + 12, y + 25 * k);
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.9)'; lines.forEach((l, i) => ctx.fillText(l, x + 12, y + 48 * k + i * 17 * k));
  for (let i = 0; i < st.need; i++) { ctx.beginPath(); ctx.arc(x + w - 16 - (st.need - 1 - i) * 18 * k, y + 18 * k, 6 * k, 0, TAU); if (i < D.n) { ctx.fillStyle = '#8fe0ab'; ctx.fill(); } else { ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; ctx.stroke(); } }
  ctx.restore();
}
