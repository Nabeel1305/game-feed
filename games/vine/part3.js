// ===================== THE VIEW: Vine in 3D (three.js through tools/world3d.js) =====================
// A rainforest gorge: giant trunks, a roof of leaves, light falling through mist, a river far below; vines hanging from the
// branches; you, seen from just behind, hanging by your hands.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [];
let hint = null, V3 = null;
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 6) TXT.shift(); }
function tip(key, txt, secs = 2.8) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function fxStep(dt) {
  FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.3) TXT.shift();
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; }
}
function buildWorld() {
  if (V3) return V3; const T = THREE; if (!W3 || !W3.init({ canvas: $('gl'), fov: 70, far: 3000, near: 0.1 })) { V3 = { none: true }; return V3; }
  const S = W3.scene, R0 = W3.rng(23);
  const river = W3.water({ size: 4000, color: 0x2a3a1c, distort: 0.6, ripple: 1.6, speed: 0.6 });
  // the swinger: a person with joints (part25_human.js): hands that close on the vine, arms that reach, legs that kick and tuck
  const HM = humMake(T), P = HM.g, arms = [];
  S.add(P);
  // the forest is built per run (it follows the route); materials and shapes once
  const bark = W3.grainTex(256, 41, 140, 70, 3); bark.repeat.set(2, 6);
  const leafC = document.createElement('canvas'); leafC.width = leafC.height = 128; { const g = leafC.getContext('2d'); for (let i = 0; i < 60; i++) { const x = 64 + (R0() - 0.5) * 100, y = 64 + (R0() - 0.5) * 100, a = R0() * 6.3; g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = `hsl(${95 + R0() * 40},${45 + R0() * 25}%,${18 + R0() * 22}%)`; g.beginPath(); g.ellipse(0, 0, 18, 7, 0, 0, 6.3); g.fill(); g.restore(); } }
  const leafTex = new T.CanvasTexture(leafC); leafTex.colorSpace = T.SRGBColorSpace;
  V3 = { T, S, river, P, H: HM, arms, bark, leafTex, mats: { bark: new T.MeshStandardMaterial({ color: 0x8a7a66, map: bark, roughness: 0.95 }), leaf: new T.MeshStandardMaterial({ map: leafTex, alphaTest: 0.4, side: T.DoubleSide, roughness: 0.75, transparent: false }), vine: new T.MeshStandardMaterial({ color: 0x4f5a2a, roughness: 0.9 }) },
    run: null, camPos: new T.Vector3(), look: new T.Vector3(), sky: null };
  W3.setQuality(stepN); return V3;
}
function buildRun(G) {
  const V = V3, T = V.T, S = V.S; if (V.run) { for (const m of V.run.meshes) { S.remove(m); if (m.geometry) m.geometry.dispose(); } }
  const run = { meshes: [] }, add = m => { S.add(m); run.meshes.push(m); return m; }, R0 = W3.rng(G.seed % 9999 + 1), vs = G.vines;
  const minZ = Math.min(...vs.map(v => v.z)) - 60, maxZ = 40;
  // ground: the gorge's sides rising from the river, thick with green
  const N3 = new T.ImprovedNoise(), cxAt = z => { let best = vs[0]; for (const v of vs) if (Math.abs(v.z - z) < Math.abs(best.z - z)) best = v; return best.x; };
  const gt = W3.grainTex(256, 13, 200, 55, 2); gt.repeat.set(30, 30);
  const ground = W3.terrain({ size: 900, seg: 120, x: 0, z: (minZ + maxZ) / 2, height: (x, z) => { const d = Math.abs(x - cxAt(z)); return d < 18 ? -3 : Math.min(60, (d - 18) * 0.9) + N3.noise(x * 0.04, 0.5, z * 0.04) * 6; },
    colour: (x, z, h, sl) => { const n = 0.5 + 0.5 * N3.noise(x * 0.1, 2, z * 0.1); return h < 0.5 ? [0.2, 0.16, 0.1] : sl > 0.5 ? [0.27, 0.25, 0.2] : [0.08 + 0.05 * n, 0.2 + 0.08 * n, 0.06]; }, map: gt });
  run.meshes.push(ground);
  // giant trees: the vines hang from their branches, and more stand all around
  const trunkG = new T.CylinderGeometry(0.9, 1.5, 1, 10), branchG = new T.CylinderGeometry(0.18, 0.35, 1, 6), crownG = new T.IcosahedronGeometry(1, 1);
  const trees = []; for (const v of vs) { const side = R0() < 0.5 ? -1 : 1; trees.push({ x: v.x + side * (5.5 + R0() * 4), z: v.z - 1 + R0() * 2, h: v.y + 8 + R0() * 10, anchor: v, side }); }
  for (let i = 0; i < 70; i++) { const z = minZ + R0() * (maxZ - minZ), side = R0() < 0.5 ? -1 : 1; trees.push({ x: cxAt(z) + side * (10 + R0() * 35), z, h: 34 + R0() * 18 }); }
  const TI = new T.InstancedMesh(trunkG, V.mats.bark, trees.length), CI = new T.InstancedMesh(crownG, V.mats.leaf, trees.length * 3), D = new T.Object3D(); let ci = 0;
  trees.forEach((t, i) => { D.position.set(t.x, t.h / 2 - 3, t.z); D.rotation.set(0, R0() * 6, 0); const tw = 0.6 + R0() * 0.9; D.scale.set(tw, t.h + 3, tw); D.updateMatrix(); TI.setMatrixAt(i, D.matrix);
    for (let k = 0; k < 3; k++) { D.position.set(t.x + (R0() - 0.5) * 9, t.h - 1 + R0() * 4, t.z + (R0() - 0.5) * 9); D.rotation.set(R0() * 6, R0() * 6, R0() * 6); const s = 7 + R0() * 6; D.scale.set(s, s * 0.5, s); D.updateMatrix(); CI.setMatrixAt(ci++, D.matrix); } });
  TI.castShadow = true; TI.receiveShadow = true; CI.receiveShadow = true; add(TI); add(CI);
  // branches out to each vine's anchor, and the vine itself
  for (const t of trees) if (t.anchor) { const a = new T.Vector3(t.x, t.anchor.y + 0.2, t.z), b = new T.Vector3(t.anchor.x, t.anchor.y + 0.2, t.anchor.z), L = a.distanceTo(b) + 1.5;
    const br = add(new T.Mesh(branchG, V.mats.bark)); br.position.copy(a).lerp(b, 0.5); br.scale.set(1, L, 1); br.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), b.clone().sub(a).normalize()); br.castShadow = true;
    const lf = add(new T.Mesh(crownG, V.mats.leaf)); lf.position.copy(b).add(new T.Vector3(0, 1.2, 0)); lf.scale.set(3, 1.6, 3); }
  run.vines = vs.map((v, i) => { const g = new T.CylinderGeometry(0.045, 0.06, 1, 5, 8); g.translate(0, -0.5, 0); const m = add(new T.Mesh(g, V.mats.vine)); m.castShadow = true; m.userData.i = i; return m; });
  // the tree house at the end
  { const h = G.house, wood = new T.MeshStandardMaterial({ color: 0x7a5a3a, roughness: 0.9, map: V.bark });
    const deck = add(new T.Mesh(new T.BoxGeometry(6, 0.3, 5), wood)); deck.position.set(h.x, h.y, h.z); deck.castShadow = deck.receiveShadow = true;
    const hut = add(new T.Mesh(new T.BoxGeometry(4, 2.6, 3.4), wood)); hut.position.set(h.x, h.y + 1.45, h.z - 0.4); hut.castShadow = true;
    const roof = add(new T.Mesh(new T.ConeGeometry(3.6, 2, 4), new T.MeshStandardMaterial({ color: 0xb9a26a, roughness: 1 }))); roof.position.set(h.x, h.y + 3.7, h.z - 0.4); roof.rotation.y = Math.PI / 4;
    const flag = add(new T.Mesh(new T.PlaneGeometry(1.2, 0.7), new T.MeshStandardMaterial({ color: 0xe8b23a, side: T.DoubleSide }))); flag.position.set(h.x + 1.8, h.y + 5, h.z); }
  // light falling through the leaves: soft shafts
  for (let i = 0; i < 10; i++) { const z = minZ + R0() * (maxZ - minZ), sh = add(new T.Mesh(new T.CylinderGeometry(1.5, 4, 60, 12, 1, true), new T.MeshBasicMaterial({ color: 0xfff1c8, transparent: true, opacity: 0.05, depthWrite: false, side: T.DoubleSide, fog: false })));
    sh.position.set(cxAt(z) + (R0() - 0.5) * 20, 28, z); sh.rotation.z = 0.3; sh.userData.shaft = true; }
  run.seed = G.seed; run.n = vs.length; V.run = run;
}
function setWeather(G) {
  const V = buildWorld(); if (V.none || V.sky === G.weather) return; V.sky = G.weather;
  W3.setSky(G.weather, { azim: 150, wind: [0.2, 0.1] }); if (W3.S.night || W3.S.rain || G.weather === 'dusk') { W3.S.exposure *= 1.35; W3.R.toneMappingExposure = W3.S.exposure; }
  const shafts = W3.S.rain || W3.S.night || W3.S.name === 'overcast' ? 0 : 1; if (V.run) for (const m of V.run.meshes) if (m.userData.shaft) m.visible = !!shafts;
}
function onEvent(G, e) {
  const cx = W / 2, cy = H * 0.3;
  switch (e.k) {
    case 'letgo': sfx.whoosh(); vibe(HAP.tick); ui.relT = 0; break;
    case 'catch': ui.catchT = 0.45; sfx.catch(e.streak, e.fine); FX.shake = 4; vibe(HAP.light); if (e.fine) say('PERFECT CATCH', cx, cy, '#ffe9a8', 24); else if (e.streak >= 3 && e.streak % 3 === 0) say(`${e.streak} IN A ROW`, cx, cy, '#ffe9a8', 22); break;
    case 'air': ui.airT = 0.5; sfx.air(); say('NOTHING THERE', cx, cy + 40, '#ffd0c4', 20); tip('air', 'Wait until your hand reaches the vine', 2.6); break;
    case 'busy': break;
    case 'fall': sfx.fall(); FX.red = 0.5; FX.shake = 8; say('SPLASH!', cx, cy, '#ffb4a8', 30); tip('fall', 'Let go as you swing forward and up', 3); break;
    case 'vines': if (V3 && !V3.none) buildRun(G); break;
    case 'lessonnext': if (e.first) hint = null; say(e.first ? 'FIRST, A LESSON' : 'NEXT LESSON', cx, H * 0.5, '#ffd36a', 26); sfx.ding(); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, cx, H * 0.5, '#9be3b5', 26); sfx.coin(e.n); break;
    case 'lessonmiss': hint = { txt: e.how, t: 0, secs: 3.6 }; break;
    case 'lessondone': say('YOU HAVE IT. TO THE TREE HOUSE!', cx, H * 0.5, '#ffd36a', 22); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); vibe(HAP.best); FX.flash = 0.5; break;
    case 'lost': sfx.lose(); say(e.why === 'time' ? 'THE LIGHT IS GONE' : 'TOO MANY FALLS', cx, H * 0.5, '#ffd0c4', 26); break;
  }
}
const ui = { snap: false, relT: 9, catchT: 0, airT: 0 };
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#0b1418'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D jungle.', W / 2, H / 2); return; }
  const T = V.T, cam = W3.cam, g = G || idleG(), p = g.p, t = now;
  if (!V.run || V.run.seed !== g.seed || V.run.n !== g.vines.length) buildRun(g);
  setWeather(g);
  // vines: each hangs from its anchor; the one you hold runs to your hands; the others sway a little
  for (const m of V.run.vines) { const v = g.vines[m.userData.i]; if (!v) { m.visible = false; continue; } m.visible = true; m.position.set(v.x, v.y, v.z);
    if (g.held && m.userData.i === g.on) { const hx = p.x, hy = p.y + ARM, hz = p.z, dir = new T.Vector3(hx - v.x, hy - v.y, hz - v.z), L = dir.length(); m.scale.set(1, L, 1); m.quaternion.setFromUnitVectors(new T.Vector3(0, -1, 0), dir.normalize()); }
    else { m.scale.set(1, v.L, 1); m.rotation.set(Math.sin(t * 0.7 + m.userData.i) * 0.05, 0, Math.sin(t * 0.5 + m.userData.i * 2) * 0.04); } }
  // the swinger (23 Nov 2026, his review: "do better on the animation... hands and the person holding the vines and swinging"):
  // held: both hands closed on the end of the vine, one above the other, the body hanging from them and trailing the swing, the legs
  // kicking forward on the way up and tucking on the way back. In the air: the arms come down and forward and reach for the next
  // vine with open hands, the legs stride. A grab at nothing: the hands snatch and the arms wheel. A catch: the legs swing through.
  { const H = V.H, e3 = (a, b, u) => a + (b - a) * u; ui.relT += dt; ui.catchT = Math.max(0, ui.catchT - dt); ui.airT = Math.max(0, ui.airT - dt); V.P.position.set(p.x, p.y, p.z);
    if (g.held) { const jolt = ui.catchT / 0.45, phi = clamp(0.8 * g.th - clamp(g.om * 0.13, -0.3, 0.3) + jolt * 0.35, -1.2, 1.2); V.P.rotation.set(phi, 0, -g.lean * 0.3);
      const hy = ARM * Math.cos(phi), hz = -ARM * Math.sin(phi), sag = jolt * 0.08;      // where the end of the vine is, seen from the body
      humReach(H, 1, 0.02, hy - sag, hz); humReach(H, 0, -0.02, hy - 0.13 - sag, hz - 0.01); humGrip(H, 1, dt);
      const kick = clamp(0.25 + g.om * 0.42 + g.th * 0.25 + jolt * 0.7, -0.45, 1.25), tuck = clamp(0.55 - g.om * 0.55, 0.15, 1.5);
      humLegs(H, [kick + 0.1, tuck * 0.8, 0.05], [kick - 0.12, tuck, 0.05]); H.neck.rotation.x = clamp(-phi * 0.7 - 0.1, -0.7, 0.5); H.head.userData.band.rotation.x = clamp(0.5 + g.om * 0.5, -0.4, 1.4); }
    else { const fallF = clamp((-p.vy - 6) / 8, 0, 1), phi = Math.atan2(-p.vz, Math.max(0.1, p.vy + 8)) * -0.45 - fallF * 0.3; V.P.rotation.set(phi, 0, -g.lean * 0.45); V.P.updateMatrixWorld(true);
      const nv = g.vines[g.on + 1], u = clamp(ui.relT / 0.22, 0, 1), miss = ui.airT > 0 || g.grabT > 0;
      for (let i = 0; i < 2; i++) { const sx = i ? 1 : -1; let tx = sx * 0.17, ty = 0.78, tz = -0.42;
        if (nv && !miss) { const q = V.P.worldToLocal(new T.Vector3(nv.x, clamp(p.y + ARM, nv.y - nv.L, nv.y), nv.z)), sh = new T.Vector3(sx * 0.2, H.SH, 0), d = q.sub(sh), l = d.length() || 1; d.multiplyScalar(Math.min(l, 0.56) / l); tx = sh.x + d.x - sx * 0.02; ty = Math.max(sh.y + d.y, H.SH + 0.36) + (i ? 0.03 : -0.06); tz = Math.max(sh.z + d.z, -0.36); }      // (kept high enough to be seen from behind)
        if (miss || fallF > 0.5) { const w = t * 15 + i * 2.4; tx = sx * 0.34; ty = 0.62 + Math.sin(w) * 0.26; tz = -0.18 + Math.cos(w) * 0.26; }
        humReach(H, i, e3(sx * 0.02, tx, u), e3(ARM - i * 0.0 - (i ? 0 : 0.13), ty, u), e3(0, tz, u)); }
      humGrip(H, ui.airT > 0.3 ? 1 : 0, dt); const st = Math.sin(t * 6.5) * (0.3 + 0.5 * fallF);
      humLegs(H, [0.75 + st, 1.0 - st * 0.4, 0.06], [-0.45 - st, 0.75 + st * 0.4, 0.06]); H.neck.rotation.x = clamp(-phi * 0.8 - 0.25, -0.8, 0.4); H.head.userData.band.rotation.x = 1.1 + Math.sin(t * 9) * 0.2; }
    if (!V.tail) { V.tail = new T.Mesh(new T.CylinderGeometry(0.03, 0.012, 0.6, 6), V.mats.vine); V.tail.geometry.translate(0, -0.3, 0); V.S.add(V.tail); }
    V.tail.visible = g.held; if (g.held) { V.tail.position.set(p.x, p.y + ARM - 0.12, p.z); V.tail.rotation.set(V.P.rotation.x * 0.6 + Math.sin(t * 3) * 0.06, 0, 0); } }
  // the camera: behind and a little above, following along the route, looking ahead to the next vine
  if (W3.cam.near !== 2.3) { W3.cam.near = 2.3; W3.cam.updateProjectionMatrix(); }      /* 22 Nov 2026: a vine hanging right in front of the camera is cut away, so it cannot cross the view */
  const nv = g.vines[g.on + 1] || g.vines[g.on], want = new T.Vector3(p.x + 0.6, p.y + 1.5, p.z + 4.1), look = new T.Vector3((p.x + nv.x) / 2, (p.y + nv.y - nv.L * 0.6) / 2 + 0.5, Math.min(p.z - 4, nv.z));
  if (ui.snap || !V.started) { V.camPos.copy(want); V.look.copy(look); V.started = true; } else { V.camPos.lerp(want, Math.min(1, dt * 4)); V.look.lerp(look, Math.min(1, dt * 4)); } ui.snap = false;
  cam.position.copy(V.camPos); cam.fov = innerWidth > innerHeight ? 54 : 64; cam.updateProjectionMatrix(); cam.lookAt(V.look);
  /* 22 Nov 2026 (the audit): under the trees at dusk, at night and in rain the swinger was a dark speck. The camera is closer, and a soft lamp travels with the swinger so they and the next vine are always lit. */
  if (!V.lamp) { V.lamp = new T.PointLight(0xfff0d8, 0, 16, 1.4); V.S.add(V.lamp); } V.lamp.position.set(p.x + 0.6, p.y + 1.4, p.z + 2.4); V.lamp.intensity = W3.S.night ? 26 : (W3.S.rain || W3.S.name === 'dusk' || W3.S.name === 'overcast' || W3.S.name === 'mist') ? 16 : 6;
  if (FX.shake > 0) { cam.rotation.x += (Math.random() - 0.5) * FX.shake * 0.002; cam.rotation.y += (Math.random() - 0.5) * FX.shake * 0.002; }
  W3.setFocus(p.x, p.y, p.z, 10);
  W3.render(dt);
  if (G) hud(G);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const a = t2.t < 0.9 ? 1 : 1 - (t2.t - 0.9) / 0.4; ctx.globalAlpha = Math.max(0, a); ctx.font = `700 ${Math.round(t2.size * k)}px ${BC}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 26 * k); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 26 * k); }
  ctx.globalAlpha = 1;
  if (hint) { const a = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, a); ctx.font = `700 ${Math.round(16 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 20 * k, h = lines.length * lh + 16 * k, w = Math.min(W - 24, Math.max(...lines.map(l => ctx.measureText(l).width)) + 34);
    ctx.fillStyle = 'rgba(0,0,0,.55)'; rrect(W / 2 - w / 2, H * 0.78 - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.78 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,60,40,${FX.red * 0.18})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,248,230,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); }
}
let IG = null; function idleG() { if (!IG) IG = newGame(Math.max(1, store.get('level', 1) | 0), { seed: 4 }); step(IG, 1 / 60); IG.ev.length = 0; IG.time = 999; if (!IG.held) attach(IG, IG.on, -0.5, 0.9); return IG; }
function weatherName(w) { return { dawn: 'DAWN', morning: 'MORNING', golden: 'GOLDEN HOUR', overcast: 'GREY SKY', mist: 'MIST', sunset: 'SUNSET', noon: 'MIDDAY', dusk: 'DUSK', rain: 'RAIN', storm: 'STORM' }[w] || ''; }
function hud(G) {
  const c = G.cfg, x = 14, y = 44 * k;
  if (G.lesson) lessonPanel(G);
  else { const w = W - 2 * x - 80 * k, u = G.on / (G.vines.length - 1);
    ctx.fillStyle = 'rgba(0,0,0,.3)'; rrect(x, y + 4 * k, w, 8 * k, 4); ctx.fill(); ctx.fillStyle = '#9be36a'; rrect(x, y + 4 * k, Math.max(8, w * u), 8 * k, 4); ctx.fill();
    for (let i = 0; i < c.lives; i++) { ctx.beginPath(); ctx.arc(W - x - 10 * k - i * 20 * k, y + 8 * k, 6 * k, 0, TAU); ctx.fillStyle = i < G.lives ? '#ffcf5a' : 'rgba(255,255,255,.25)'; ctx.fill(); }
    const tu = G.time / c.time; ctx.fillStyle = 'rgba(0,0,0,.3)'; rrect(x, y + 20 * k, w, 3 * k, 2); ctx.fill(); ctx.fillStyle = tu > 0.25 ? 'rgba(255,225,150,.9)' : '#ff8a6a'; rrect(x, y + 20 * k, Math.max(3, w * tu), 3 * k, 2); ctx.fill();
    ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText(`${G.vines.length - 1 - G.on} vines to the tree house`, x, y + 34 * k); }
  if (G.t < 3.2 && !G.lesson) { ctx.globalAlpha = Math.min(1, (3.2 - G.t) / 0.6); ctx.textAlign = 'center'; ctx.font = `700 ${Math.round(15 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.45)';
    const s = `CANOPY ${G.N} · ${weatherName(G.weather)} · ${c.vines} VINES`; ctx.strokeText(s, W / 2, H * 0.2); ctx.fillText(s, W / 2, H * 0.2); ctx.globalAlpha = 1; }
  // the swing meter: where on the swing you are, and the moment to let go for the next vine (a gold notch)
  if (G.held && G.vines[G.on + 1] && (G.N <= 5 || G.lesson)) { const cx = W / 2, cy = H * 0.86, r = 70 * k, nv = G.vines[G.on + 1];
    ctx.lineWidth = 6 * k; ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.arc(cx, cy - r * 0.2, r, Math.PI * 0.15 + Math.PI / 2, Math.PI * 0.85 + Math.PI / 2 + Math.PI, false); ctx.stroke();
    const ang = th => Math.PI / 2 - th * 0.9; const best = ang(nv.rel), sp = Math.max(0.08, c.spread);
    ctx.strokeStyle = 'rgba(255,214,110,.9)'; ctx.beginPath(); ctx.arc(cx, cy - r * 0.2, r, best - sp, best + sp); ctx.stroke();
    const a = ang(G.th); ctx.fillStyle = G.om > 0 ? '#fff' : 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r, cy - r * 0.2 + Math.sin(a) * r, 7 * k, 0, TAU); ctx.fill(); }
}
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) {
  const D = G.lesson, st = D.steps[D.i], x = 14, w = W - 28, y = 42 * k; ctx.save();
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; const lines = wrapText(st.how, w - 24), h = 54 * k + lines.length * 17 * k;
  ctx.fillStyle = 'rgba(0,0,0,.55)'; rrect(x, y, w, h, 12); ctx.fill(); ctx.strokeStyle = 'rgba(255,211,106,.7)'; ctx.lineWidth = 2; rrect(x, y, w, h, 12); ctx.stroke();
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#ffd36a'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillText(`LESSON ${D.i + 1} OF ${D.steps.length}`, x + 12, y + 10 * k);
  ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(18 * k)}px ${BC}`; ctx.fillText(st.title, x + 12, y + 25 * k);
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.9)'; lines.forEach((l, i) => ctx.fillText(l, x + 12, y + 48 * k + i * 17 * k));
  for (let i = 0; i < st.need; i++) { ctx.beginPath(); ctx.arc(x + w - 16 - (st.need - 1 - i) * 18 * k, y + 18 * k, 6 * k, 0, TAU); if (i < D.n) { ctx.fillStyle = '#8fe0ab'; ctx.fill(); } else { ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; ctx.stroke(); } }
  ctx.restore();
}
