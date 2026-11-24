// ===================== THE VIEW: Rodeo in 3D (three.js through tools/world3d.js) =====================
// A dusty arena at the end of the day: a wooden fence all round, banners, stands full of hats, strings of lights coming on.
// The bull is big and dark, with horns, a hump and a rope round his middle; the rider sits on him, one hand up, his hat on.
// Seen from behind the bull, so the rider tips left and right just as your thumbs push him. The bull tells you what is coming:
// his head swings out to the side he means to throw you, he drops a shoulder before a spin, his back end rises before a kick.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { snap: true, held: { l: 0, r: 0 } };
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 2.8) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function dust(x, y, n = 16, col = 'rgba(190,150,100,') { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = -Math.PI * Math.random(), v = (60 + Math.random() * 140) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6, t: 0, life: 0.6 + Math.random() * 0.6, col, r: (4 + Math.random() * 8) * k }); } if (PARTS.length > 200) PARTS.splice(0, PARTS.length - 200); }
function fxStep(dt) {
  FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.4) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.97; p.vy *= 0.97; p.r += 6 * k * dt; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; }
}
const BULLCOL = [0x2a1a14, 0x5a2a1a, 0x1a1a1e, 0x6a4a2a, 0x8a3a1a, 0x3a3030];
function bullModel() {
  const T = THREE, g = new T.Group(), M = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.8 }, o));
  const hide = M(0x2a1a14), body = new T.Group(); body.position.y = 1.15; g.add(body);
  const torso = new T.Mesh(new T.CapsuleGeometry(0.62, 1.3, 6, 14), hide); torso.rotation.x = Math.PI / 2; torso.scale.set(1, 1, 0.92); body.add(torso);
  const hump = new T.Mesh(new T.SphereGeometry(0.5, 14, 10), hide); hump.position.set(0, 0.42, -0.55); hump.scale.set(1, 0.7, 1.1); body.add(hump);
  const neck = new T.Group(); neck.position.set(0, 0.2, -1.05); body.add(neck);
  const head = new T.Group(); head.position.set(0, -0.05, -0.45); neck.add(head);
  const skull = new T.Mesh(new T.BoxGeometry(0.52, 0.5, 0.7), hide); head.add(skull); const snout = new T.Mesh(new T.BoxGeometry(0.42, 0.34, 0.25), M(0x6a5048)); snout.position.set(0, -0.1, -0.42); head.add(snout);
  for (const sx of [-1, 1]) { const horn = new T.Mesh(new T.ConeGeometry(0.11, 1.15, 8), M(0xfff4dc, { roughness: 0.4, emissive: 0x403828 })); horn.position.set(sx * 0.52, 0.28, -0.05); horn.rotation.z = -sx * 1.2; horn.rotation.x = -0.3; head.add(horn); const ear = new T.Mesh(new T.SphereGeometry(0.1, 8, 6), hide); ear.scale.set(1.6, 0.5, 0.8); ear.position.set(sx * 0.32, 0.12, 0.12); head.add(ear);
    const eye = new T.Mesh(new T.SphereGeometry(0.05, 8, 6), M(0xffffff, { emissive: 0x442222 })); eye.position.set(sx * 0.24, 0.06, -0.25); head.add(eye); }
  const legs = []; for (const [x, z] of [[-0.35, -0.75], [0.35, -0.75], [-0.35, 0.75], [0.35, 0.75]]) { const p = new T.Group(); p.position.set(x, -0.35, z); const l = new T.Mesh(new T.CylinderGeometry(0.19, 0.1, 0.85, 8), hide); l.position.y = -0.42; p.add(l); const hoof = new T.Mesh(new T.CylinderGeometry(0.12, 0.13, 0.12, 8), M(0x1a1410)); hoof.position.y = -0.84; p.add(hoof); body.add(p); legs.push(p); }
  for (const sx of [-1, 1]) { const ha = new T.Mesh(new T.SphereGeometry(0.46, 14, 10), hide); ha.position.set(sx * 0.3, 0.02, 0.72); ha.scale.set(0.9, 1.1, 1); body.add(ha); const sh = new T.Mesh(new T.SphereGeometry(0.4, 12, 8), hide); sh.position.set(sx * 0.34, 0.05, -0.7); body.add(sh); }      /* 22 Nov 2026: haunches and shoulders, a tufted tail, bigger horns: he was a barrel on sticks */
  const tail = new T.Group(); tail.position.set(0, 0.3, 0.95); { const tuft = new T.Mesh(new T.SphereGeometry(0.1, 8, 6), M(0x120c08)); tuft.scale.set(1, 1.8, 1); tuft.position.y = -0.86; tail.add(tuft); } const tl = new T.Mesh(new T.CylinderGeometry(0.03, 0.04, 0.8, 6), hide); tl.position.y = -0.4; tail.add(tl); body.add(tail); tail.rotation.x = 0.4;
  const rope = new T.Mesh(new T.TorusGeometry(0.66, 0.035, 6, 24), M(0xd8b060)); rope.rotation.y = Math.PI / 2; rope.position.set(0, 0, -0.35); rope.scale.set(1, 1, 1); body.add(rope);
  const bell = new T.Mesh(new T.ConeGeometry(0.09, 0.16, 8), M(0xc8a040, { metalness: 0.7, roughness: 0.3 })); bell.position.set(0, -0.7, -0.35); bell.rotation.x = Math.PI; body.add(bell);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  g.userData = { body, neck, head, legs, tail, hide }; return g;
}
function riderModel() {
  const T = THREE, g = new T.Group(), M = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.8 }, o));
  const hips = new T.Group(); g.add(hips);      // pivot at the seat
  const jeans = M(0x2a3a6a), shirtC = document.createElement('canvas'); shirtC.width = shirtC.height = 64; { const x = shirtC.getContext('2d'); x.fillStyle = '#c8302a'; x.fillRect(0, 0, 64, 64); x.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 64; i += 16) { x.fillRect(i, 0, 6, 64); x.fillRect(0, i, 64, 6); } }
  const shirtT = new T.CanvasTexture(shirtC); shirtT.wrapS = shirtT.wrapT = T.RepeatWrapping; shirtT.repeat.set(2, 2);
  const torso = new T.Mesh(new T.CapsuleGeometry(0.2, 0.42, 4, 10), M(0xffffff, { map: shirtT })); torso.position.y = 0.45; torso.scale.set(1.1, 1, 0.8); hips.add(torso);
  const vest = new T.Mesh(new T.CapsuleGeometry(0.215, 0.3, 4, 10), M(0x5a3a22)); vest.position.y = 0.5; vest.scale.set(1.1, 1, 0.82); hips.add(vest);
  const head = new T.Mesh(new T.SphereGeometry(0.15, 14, 12), M(0xd9a07a)); head.position.y = 0.95; hips.add(head);
  const hat = new T.Group(); hat.position.y = 1.05; const brim = new T.Mesh(new T.CylinderGeometry(0.32, 0.32, 0.03, 18), M(0xc8a070)); brim.scale.z = 0.8; const crown = new T.Mesh(new T.CylinderGeometry(0.14, 0.17, 0.2, 14), M(0xc8a070)); crown.position.y = 0.1; hat.add(brim, crown); hips.add(hat);
  for (const sx of [-1, 1]) { const leg = new T.Mesh(new T.CapsuleGeometry(0.09, 0.55, 3, 8), jeans); leg.position.set(sx * 0.42, -0.15, -0.1); leg.rotation.z = sx * 1.0; hips.add(leg); const boot = new T.Mesh(new T.BoxGeometry(0.14, 0.18, 0.3), M(0x4a2a14)); boot.position.set(sx * 0.66, -0.5, -0.05); hips.add(boot); }
  const armUp = new T.Group(); armUp.position.set(0.27, 0.68, 0); const a1 = new T.Mesh(new T.CapsuleGeometry(0.06, 0.5, 3, 8), M(0xffffff, { map: shirtT })); a1.position.y = 0.3; armUp.add(a1); armUp.rotation.z = -0.5; hips.add(armUp);
  const armDn = new T.Group(); armDn.position.set(-0.27, 0.68, 0); const a2 = new T.Mesh(new T.CapsuleGeometry(0.06, 0.45, 3, 8), M(0xffffff, { map: shirtT })); a2.position.y = -0.28; armDn.add(a2); armDn.rotation.x = -0.5; hips.add(armDn);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); g.userData = { hips, hat, armUp, armDn }; return g;
}
function buildWorld() {
  if (V3) return V3; const T = THREE; if (!W3 || !W3.init({ canvas: $('gl'), fov: 50, far: 1500, near: 0.1 })) { V3 = { none: true }; return V3; }
  const S = W3.scene, R0 = W3.rng(41), M = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.9 }, o));
  const dirtM = M(0xa8805a, { roughness: 1, map: W3.grainTex(256, 6, 190, 40, 8) }); dirtM.map.repeat.set(12, 12);
  const dirt = new T.Mesh(new T.CircleGeometry(60, 48), dirtM); dirt.rotation.x = -Math.PI / 2; dirt.receiveShadow = true; S.add(dirt);
  // the fence: posts and three rails all round
  const R = 15, n = 60, woodM = M(0x8a6040), postI = new T.InstancedMesh(new T.CylinderGeometry(0.1, 0.12, 1.8, 6), woodM, n), d = new T.Object3D();
  for (let i = 0; i < n; i++) { const a = i / n * TAU; d.position.set(Math.sin(a) * R, 0.9, Math.cos(a) * R); d.updateMatrix(); postI.setMatrixAt(i, d.matrix); } S.add(postI);
  for (const y of [0.5, 1.0, 1.5]) { const rail = new T.Mesh(new T.TorusGeometry(R, 0.05, 4, 96), woodM); rail.rotation.x = Math.PI / 2; rail.position.y = y; S.add(rail); }
  const bannerT = (() => { const c = document.createElement('canvas'); c.width = 1024; c.height = 64; const x = c.getContext('2d'); const cols = ['#c8302a', '#f2c14b', '#1a3a6a', '#f4ead8']; for (let i = 0; i < 4; i++) { x.fillStyle = cols[i]; x.fillRect(i * 256, 0, 256, 64); x.fillStyle = i === 1 || i === 3 ? '#2a1a10' : '#ffffff'; x.font = 'bold 32px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(['RODEO', '8 SECONDS', 'HOLD ON!', 'YEE-HAW'][i], i * 256 + 128, 34); } const t = new T.CanvasTexture(c); t.wrapS = T.RepeatWrapping; t.repeat.set(5, 1); t.colorSpace = T.SRGBColorSpace; return t; })();
  const band = new T.Mesh(new T.CylinderGeometry(R - 0.05, R - 0.05, 0.5, 96, 1, true), new T.MeshStandardMaterial({ map: bannerT, side: T.BackSide, roughness: 0.8 })); band.position.y = 1.0; S.add(band);
  // stands full of people in hats, and strings of lights
  const seats = []; for (let r = 0; r < 12; r++) { const rad = R + 2.5 + r * 0.9, y = 1.2 + r * 0.55, cnt = Math.floor(TAU * rad / 0.6); for (let i = 0; i < cnt; i++) { const a = i / cnt * TAU + r * 0.13; if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a)) - 0) < 0.25 && r < 4) continue; if (R0() < 0.88) seats.push([Math.sin(a) * rad, y, Math.cos(a) * rad, a]); } }
  const stand = new T.Mesh(new T.CylinderGeometry(R + 13, R + 2, 7, 64, 1, true), M(0x5a4a3a, { side: T.DoubleSide })); stand.position.y = 3.4; S.add(stand);
  const crowd = new T.InstancedMesh(new T.BoxGeometry(0.42, 0.62, 0.3), M(0xffffff), seats.length), col = new T.Color(), ccols = [0xc8302a, 0x2a4a8a, 0xf4ead8, 0xd8a040, 0x3a6a3a, 0x8a5a3a, 0xe8e0d0];
  seats.forEach((s, i) => { d.position.set(s[0], s[1] + 0.3, s[2]); d.rotation.set(0, s[3], 0); d.updateMatrix(); crowd.setMatrixAt(i, d.matrix); crowd.setColorAt(i, col.setHex(ccols[(R0() * ccols.length) | 0])); }); const crowdG = new T.Group(); crowdG.add(crowd); S.add(crowdG);
  const bulbs = []; for (let j = 0; j < 6; j++) { const a0 = j / 6 * TAU, a1 = (j + 1) / 6 * TAU; for (let i = 0; i <= 14; i++) { const u = i / 14, a = lerp(a0, a1, u), rr = R + 1.2; bulbs.push([Math.sin(a) * rr, 5.5 - Math.sin(u * Math.PI) * 1.2, Math.cos(a) * rr]); } }
  const bulbI = new T.InstancedMesh(new T.SphereGeometry(0.09, 6, 4), new T.MeshStandardMaterial({ color: 0xffe0a0, emissive: 0xffc060, emissiveIntensity: 0 }), bulbs.length); bulbs.forEach((b, i) => { d.position.set(b[0], b[1], b[2]); d.rotation.set(0, 0, 0); d.updateMatrix(); bulbI.setMatrixAt(i, d.matrix); }); S.add(bulbI);
  for (let j = 0; j < 6; j++) { const a = j / 6 * TAU, p = new T.Mesh(new T.CylinderGeometry(0.1, 0.12, 6, 6), woodM); p.position.set(Math.sin(a) * (R + 1.2), 3, Math.cos(a) * (R + 1.2)); S.add(p); }
  const lamp = new T.PointLight(0xffd8a0, 0, 60, 1.2); lamp.position.set(0, 9, 0); S.add(lamp);
  const chute = new T.Group(); for (let i = 0; i < 3; i++) { const gte = new T.Mesh(new T.BoxGeometry(2.4, 1.9, 0.12), M(0x6a4a2a)); gte.position.set(-3 + i * 3, 0.95, -R + 0.3); chute.add(gte); } S.add(chute);
  const bull = bullModel(), rider = riderModel(); S.add(bull, rider);
  const clown = new T.Group(); { const b = new T.Mesh(new T.CapsuleGeometry(0.25, 0.6, 4, 10), M(0xffd02a)); b.position.y = 0.8; const h = new T.Mesh(new T.SphereGeometry(0.17, 12, 10), M(0xf4e0d0)); h.position.y = 1.45; const nose = new T.Mesh(new T.SphereGeometry(0.06, 8, 6), M(0xff2a2a)); nose.position.set(0, 1.43, 0.17); const wig = new T.Mesh(new T.SphereGeometry(0.2, 10, 8), M(0x3aa8ff)); wig.position.y = 1.55; wig.scale.y = 0.6; clown.add(b, h, nose, wig); } clown.visible = false; S.add(clown);
  V3 = { T, S, dirtM, bull, rider, clown, crowdG, bulbI, lamp, sky: null, bc: -1 };
  W3.setQuality(stepN); return V3;
}
const SV = new (window.THREE ? THREE.Vector3 : Object)();
function scr(x, y, z) { if (!V3 || V3.none) return { x: W / 2 + x * 60, y: H * 0.5 - y * 60, front: true }; SV.set(x, y, z); return W3.screen(SV); }
// ---------- events ----------
function onEvent(G, e) {
  const cx = W / 2, cy = H * 0.3;
  switch (e.k) {
    case 'chute': say(G.bull.toUpperCase(), cx, H * 0.24, '#ffe08a', 26); sfx.snort(); break;
    case 'gate': sfx.gate(); FX.shake = 3; if (G.N <= 3) tip('hold', 'Hold the LEFT or RIGHT side to lean back the other way', 2.6); break;
    case 'tell': if (e.mv === 'spin') sfx.snort(); else sfx.snort(0.6); if (G.cfg.arrow || G.lesson) tip('tell' + e.mv, e.mv === 'spin' ? 'A SPIN! Hold BOTH thumbs to grip' : 'His head shows where he will throw you: hold the OTHER side', 2.6); break;
    case 'buck': case 'kick': sfx.buck(e.k === 'kick'); FX.shake = e.k === 'kick' ? 7 : 5; vibe(HAP.thud); dust(W / 2 + (Math.random() - 0.5) * 80, H * 0.62, 10); break;
    case 'spin': case 'push': sfx.buck(false); FX.shake = 3; break;
    case 'faked': sfx.snort(0.5); break;
    case 'rodeit': if (e.n >= 2) { say(e.n >= 5 ? 'WHAT A RIDE!' : e.n >= 3 ? 'NICE!' : 'GOOD!', cx, cy, '#ffe08a', 20 + Math.min(10, e.n * 2)); sfx.combo(e.n); } break;
    case 'gripgone': if (gate('gg', 1500)) say('GRIP GONE!', cx, H * 0.78, '#ffb4a8', 18); break;
    case 'shoe': sfx.bell(); say('LUCKY HORSESHOE!', cx, cy, '#9be3b5', 22); vibe(HAP.light); break;
    case 'thrown': sfx.thud(); FX.shake = 8; FX.red = 0.6; vibe(HAP.heavy); dust(W / 2 + e.d * 90 * k, H * 0.7, 26); if (!e.lesson) say('THROWN!', cx, cy, '#ffb4a8', 34); break;
    case 'horn': sfx.horn(); if (scoreOf(G) >= G.cfg.qualify) { sfx.cheer(); FX.flash = 0.8; vibe(HAP.best); say('EIGHT SECONDS!', cx, cy, '#ffe08a', 34); } break;
    case 'noscore': sfx.groan && sfx.groan(); say('TOO WILD: NO SCORE', cx, cy, '#ffb4a8', 28); break;
    case 'lessonnext': if (e.first) hint = null; say('FIRST, A LESSON', cx, H * 0.4, '#ffe08a', 24); sfx.ding(); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, cx, H * 0.4, '#9be3b5', 24); sfx.coin(e.n); break;
    case 'lessonmiss': coachMiss(); break;
    case 'lessondone': say('NOW THE REAL RIDE!', cx, H * 0.4, '#ffe08a', 24); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); break;
    case 'lost': sfx.lose(); break;
  }
}
// ---------- the bull and the rider, frame by frame ----------
function animate(g, t, dt) {
  const V = V3, B = V.bull.userData, Rd = V.rider.userData, mv = g.mv, riding = g.ph === 'ride' || g.ph === 'chute';
  if (V.bc !== g.N) { V.bc = g.N; B.hide.color.setHex(BULLCOL[(g.N + (g.seed | 0)) % BULLCOL.length]); }
  let pitch = 0, yaw = 0, roll = 0, headY = 0, headX = 0, lift = 0, x = 0, z = 0;
  const run = g.ph === 'ride' ? Math.sin(g.ride * 9) * 0.06 : 0; pitch += run; lift += Math.abs(run) * 0.6;
  if (mv && g.ph === 'ride') { const tt = g.ride - mv.t0, tu = clamp(tt / mv.tell, 0, 1), after = tt - mv.tell;
    if (mv.k === 'buck' || mv.k === 'kick' || mv.k === 'fake') { headY = -(mv.k === 'fake' ? Math.sin(tt * 18) * 0.5 : 0.6 * easeOut(tu)) * mv.d * (after < mv.dur + 0.2 ? 1 : 0); }      // his head swings out to the side he will throw you
    if (mv.k === 'spin') { roll = -mv.d * 0.22 * easeOut(tu); headY = -mv.d * 0.4 * tu; }
    if (mv.k === 'kick' && after < 0) { pitch -= 0.12 * tu; }
    if (after >= 0 && after < mv.dur + 0.25) { const u = after / (mv.dur + 0.25), s = Math.sin(u * Math.PI);
      if (mv.k === 'buck') { pitch += -0.5 * s; lift += 0.6 * s; roll += mv.d * 0.25 * s; }
      if (mv.k === 'kick') { pitch += 0.55 * s; lift += 0.4 * s; roll += mv.d * 0.3 * s; }
      if (mv.k === 'spin') { yaw = mv.d * after * 3.2; roll = -mv.d * 0.3; } } }
  if (g.ph === 'thrown' || (g.over === 'lost')) { const u = clamp(g.pt / 1.2, 0, 1); x = u * 6; z = -u * 2; yaw = -0.8 * u; pitch = Math.sin(g.t * 9) * 0.2; }
  if (g.ph === 'horn' || g.over === 'won') { pitch = Math.sin(g.t * 6) * 0.15; }
  V.bull.position.set(x, lift, z); V.bull.rotation.set(0, yaw, 0); B.body.rotation.set(pitch, 0, roll);
  B.neck.rotation.set(headX + (riding ? -0.1 : 0) - Math.abs(headY) * 0.5, headY * 1.5, -headY * 0.4); B.legs.forEach((l, i) => l.rotation.x = Math.sin(t * 12 + i * 1.6) * (g.ph === 'ride' ? 0.4 : 0.05) + (i > 1 ? -pitch * 0.8 : pitch * 0.5)); B.tail.rotation.z = Math.sin(t * 7) * 0.5;
  // the rider sits on the bull's back and tips with your balance (positive = to the right of the screen)
  V.bull.updateMatrixWorld(); const seat = new THREE.Vector3(0, 0.7, -0.15).applyMatrix4(B.body.matrixWorld);
  if (g.ph === 'thrown' || g.over === 'lost') { const u = clamp(g.pt / 0.7, 0, 1), d = Math.sign(g.th) || 1; V.rider.position.set(seat.x * (1 - u) + d * 2.4 * u, Math.max(0.15, seat.y + Math.sin(u * Math.PI) * 1.5 - u * seat.y), seat.z + u * 1.5); V.rider.rotation.set(0, 0, -d * (1.2 + u * 1.5)); }
  else if (g.ph === 'horn' || g.over === 'won') { const u = clamp(g.pt / 0.6, 0, 1); V.rider.position.set(seat.x - 1.8 * u, Math.max(0.6, seat.y + Math.sin(u * Math.PI) * 1.2 - u * (seat.y - 0.6)), seat.z + 0.8 * u); V.rider.rotation.set(0, 0, 0); Rd.armUp.rotation.z = -0.3 + Math.sin(t * 10) * 0.6; }
  else { V.rider.position.copy(seat); V.rider.rotation.set(pitch * 0.6, yaw, -g.th + roll * 0.5); Rd.armUp.rotation.z = -0.5 - g.th * 0.8 + Math.sin(t * 8) * 0.15; Rd.hips.rotation.x = -pitch * 0.4; }
  V.rider.rotation.order = 'YXZ';
  // the clown runs in when you are thrown
  V.clown.visible = g.over === 'lost'; if (V.clown.visible) { const u = clamp(g.pt / 1.0, 0, 1); V.clown.position.set(-6 + u * 7, 0, 3 - u); V.clown.rotation.y = Math.PI / 2; }
  V.crowdG.position.y = (g.ph === 'horn' || g.over === 'won') ? Math.abs(Math.sin(t * 9)) * 0.3 : 0;
}
let IG = null; function idleG() { if (!IG || IG.over) { IG = newGame(Math.max(4, store.get('level', 1) | 0), { seed: (Math.random() * 1e6) | 0 }); IG.mem = {}; IG.idleOver = 0; } if (!IG.over) { honest(IG, { react: 0.2, acc: 0.97 }, IG.mem); step(IG, 1 / 60); if (IG.ride > 7.5) IG.ride = 0.5; } IG.ev.length = 0; return IG; }
const CAMR = { y: 4.4, z: 6.6 };
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#20140c'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D arena.', W / 2, H / 2); return; }
  const g = G || idleG(), t = now;
  if (V.sky !== g.weather) { V.sky = g.weather; W3.setSky(g.weather, { azim: 120 }); W3.scene.environmentIntensity = 0.5; const night = g.weather === 'night' || g.weather === 'dusk'; V.lamp.intensity = night ? 60 : g.weather === 'sunset' ? 20 : 0; V.bulbI.material.emissiveIntensity = night ? 2.2 : g.weather === 'sunset' ? 1 : 0.1; }
  animate(g, t, dt);
  const cam = W3.cam, asp = innerWidth / innerHeight; if (Math.abs(cam.aspect - asp) > 0.001) { cam.aspect = asp; cam.fov = asp < 0.75 ? 50 : 40; cam.updateProjectionMatrix(); }
  const bp = V.bull.position, sh = FX.shake ? (Math.random() - 0.5) * FX.shake * 0.012 : 0; cam.position.set(bp.x * 0.5 + sh, CAMR.y, CAMR.z + bp.z * 0.5); cam.lookAt(bp.x * 0.7, 1.25, bp.z - 1.6); cam.updateMatrixWorld();
  W3.setFocus(0, 1, 0, 8); W3.render(dt);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, (1 - p.t / p.life) * 0.7); ctx.fillStyle = p.col + '1)'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  if (G) hud(G, t);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 1.0 ? 1 : 1 - (t2.t - 1.0) / 0.4; ctx.globalAlpha = Math.max(0, al); const sc = t2.t < 0.12 ? 1.35 - t2.t / 0.12 * 0.35 : 1; ctx.font = `${Math.round(t2.size * k * sc)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(30,14,6,.65)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 20); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 20); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30;
    ctx.fillStyle = 'rgba(40,20,10,.82)'; rrect(W / 2 - w / 2, H * 0.27 - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.27 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(200,40,20,${FX.red * 0.15})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,240,200,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); }
}
// ---------- the 2D layer: the clock, the balance, your thumbs, the bull's tell ----------
function hud(G, t) {
  ctx.textBaseline = 'middle';
  // the clock: eight seconds
  if (!G.lesson) { const y = 64 * k, w = W * 0.62, x = W / 2 - w / 2, u = clamp(G.ride / RIDE, 0, 1); ctx.fillStyle = 'rgba(30,16,8,.75)'; rrect(x - 10, y - 26 * k, w + 20, 52 * k, 14); ctx.fill();
    ctx.textAlign = 'center'; ctx.fillStyle = u >= 1 ? '#ffe08a' : '#fff'; ctx.font = `${Math.round(24 * k)}px ${TF}`; ctx.fillText(Math.min(RIDE, G.ride).toFixed(1), W / 2, y - 6 * k);
    ctx.fillStyle = 'rgba(255,255,255,.18)'; rrect(x, y + 13 * k, w, 7 * k, 3.5 * k); ctx.fill(); ctx.fillStyle = '#f2c14b'; rrect(x, y + 13 * k, Math.max(7 * k, w * u), 7 * k, 3.5 * k); ctx.fill();
    ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillText(`${G.bull.toUpperCase()} · ${townOf(G.N).toUpperCase()}`, W / 2, y + 36 * k);
    if (G.nb) { const sc = scoreOf(G), q = G.cfg.qualify; ctx.textAlign = 'right'; ctx.font = `${Math.round(18 * k)}px ${TF}`; ctx.fillStyle = sc >= q ? '#8fe0ab' : '#ffb4a8'; ctx.fillText(sc, x + w + 4, y - 6 * k); ctx.textAlign = 'left'; ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillText(`SCORE (${q})`, x - 4, y - 6 * k); } }
  else lessonPanel(G);
  // the bull's tell: an arrow for where he will throw you, and which side to hold (early levels and lessons)
  const mv = G.mv; if (mv && G.ph === 'ride' && mv.k !== 'fake' && (G.cfg.arrow || G.lesson)) { const tt = G.ride - mv.t0; if (tt < mv.tell + mv.dur) { const al = clamp(tt / 0.15, 0, 1), y = H * 0.36, cx = W / 2;
      ctx.globalAlpha = al; ctx.textAlign = 'center'; ctx.font = `800 ${Math.round(15 * k)}px ${BC}`;
      if (mv.k === 'spin') { ctx.fillStyle = '#9ad8ff'; ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 4; ctx.strokeText('SPIN! HOLD BOTH TO GRIP', cx, y); ctx.fillText('SPIN! HOLD BOTH TO GRIP', cx, y); }
      else { const d = mv.d, ax = cx + d * 70 * k; ctx.strokeStyle = '#ff7a5a'; ctx.fillStyle = '#ff7a5a'; ctx.lineWidth = 7 * k; ctx.beginPath(); ctx.moveTo(cx - d * 20 * k, y); ctx.lineTo(ax, y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(ax + d * 16 * k, y); ctx.lineTo(ax - d * 4 * k, y - 13 * k); ctx.lineTo(ax - d * 4 * k, y + 13 * k); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 4; const s = `HOLD ${d > 0 ? 'LEFT' : 'RIGHT'}`; ctx.strokeText(s, cx, y + 26 * k); ctx.fillText(s, cx, y + 26 * k); }
      ctx.globalAlpha = 1; } }
  // your balance: an arc with the danger at both ends
  if (G.ph === 'ride' || G.ph === 'chute') { const cx = W / 2, cy = H - 70 * k, r = 96 * k, a0 = -Math.PI / 2, span = 1.1, f = G.cfg.fall;
    ctx.lineWidth = 12 * k; ctx.strokeStyle = 'rgba(30,16,8,.6)'; ctx.beginPath(); ctx.arc(cx, cy, r, a0 - span, a0 + span); ctx.stroke();
    ctx.strokeStyle = 'rgba(94,224,138,.55)'; ctx.beginPath(); ctx.arc(cx, cy, r, a0 - span * GREEN / f, a0 + span * GREEN / f); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,90,74,.7)'; ctx.beginPath(); ctx.arc(cx, cy, r, a0 - span, a0 - span * 0.8); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, cy, r, a0 + span * 0.8, a0 + span); ctx.stroke();
    const a = a0 + clamp(G.th / f, -1, 1) * span, danger = Math.abs(G.th) / f; ctx.fillStyle = danger > 0.8 ? '#ff5a4a' : danger > 0.45 ? '#ffd23a' : '#ffffff'; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 11 * k, 0, TAU); ctx.fill();
    if (G.held.l && G.held.r) { const gw = 90 * k, gu = clamp(G.grip / G.cfg.grip, 0, 1); ctx.fillStyle = 'rgba(30,16,8,.6)'; rrect(cx - gw / 2, cy + 20 * k, gw, 8 * k, 4 * k); ctx.fill(); ctx.fillStyle = gu > 0.25 ? '#d8b060' : '#ff5a4a'; rrect(cx - gw / 2, cy + 20 * k, gw * gu, 8 * k, 4 * k); ctx.fill(); ctx.textAlign = 'center'; ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillStyle = '#fff'; ctx.fillText('GRIP', cx, cy + 40 * k); } }
  // the two halves of the screen: they glow while held
  for (const s of ['l', 'r']) { ui.held[s] = G.held[s] ? 1 : ui.held[s] * 0.85; if (ui.held[s] > 0.02) { const x = s === 'l' ? 0 : W / 2, gr = ctx.createLinearGradient(s === 'l' ? 0 : W, 0, W / 2, 0); gr.addColorStop(0, `rgba(242,193,75,${0.22 * ui.held[s]})`); gr.addColorStop(1, 'rgba(242,193,75,0)'); ctx.fillStyle = gr; ctx.fillRect(x, H * 0.45, W / 2, H * 0.55); } }
  if ((G.N <= 3 || G.lesson) && G.ph === 'ride') { ctx.textAlign = 'center'; ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 4; for (const [txt, x] of [['◀ HOLD TO LEAN', W * 0.2], ['HOLD TO LEAN ▶', W * 0.8]]) { ctx.strokeText(txt, x, H - 30 * k); ctx.fillText(txt, x, H - 30 * k); } }
}
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { coachPanel(G); }
