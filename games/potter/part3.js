// ===================== THE VIEW: Potter's Wheel in 3D (three.js through tools/world3d.js) =====================
// A potter's corner of an old workshop: a brick wall with a window (the level's weather and light), wooden shelves of fired
// pots (yours join them), a lamp, the wheel on its bench with a splash pan, a bowl of water and a sponge. The clay is wet and
// shiny, spinning, with the throwing lines turning round it. The order's outline is dotted on both sides; your fingertip
// leaves a ripple where it touches, and drops of slip fly off.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [], PT = [];
let hint = null, V3 = null;
const POT_H = 0.24, TOP = 0.92;      // the pot's full height in metres; the wheel head's top
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 6) TXT.shift(); }
function tip(key, txt, secs = 2.8) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function fxStep(dt) {
  FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 1.8);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.4) TXT.shift();
  for (const p of PT) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 600 * dt; } for (let i = PT.length - 1; i >= 0; i--) if (PT[i].t > PT[i].life) PT.splice(i, 1);
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; }
}
const ui = { drag: null, fireBtn: null };
const GLAZES = [0x2f6f8f, 0x8a3a2a, 0x3f7a4a, 0xd8c8a0, 0x2a2a3a, 0xc07a2a, 0x6a4a8a, 0xe0e0d8];
function clayTex() { const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#b06a48'; g.fillRect(0, 0, 256, 128);
  for (let y = 0; y < 128; y += 3) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '70,30,15' : '235,180,150'},${0.05 + Math.random() * 0.12})`; g.fillRect(0, y + Math.random() * 2, 256, 1 + Math.random() * 1.5); }
  for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(60,25,10,${Math.random() * 0.15})`; g.fillRect(Math.random() * 256, Math.random() * 128, 2 + Math.random() * 8, 1); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }
function potGeo(T, r, thick = 0.035) {
  const pts = []; for (let i = 0; i < NR; i++) pts.push(new T.Vector2(Math.max(0.002, r[i] * POT_H), i / (NR - 1) * POT_H));
  const top = r[NR - 1] * POT_H; pts.push(new T.Vector2(top - thick * 0.5 * POT_H, POT_H + 0.004));
  for (let i = NR - 1; i >= 3; i--) pts.push(new T.Vector2(Math.max(0.004, (r[i] - thick) * POT_H), i / (NR - 1) * POT_H));
  pts.push(new T.Vector2(0.001, 3 / (NR - 1) * POT_H));
  return new T.LatheGeometry(pts, 56);
}
function buildWorld() {
  if (V3) return V3; const T = THREE; if (!W3 || !W3.init({ canvas: $('gl'), fov: 42, far: 3000, near: 0.02 })) { V3 = { none: true }; return V3; }
  const S = W3.scene, R0 = W3.rng(21);
  // the wall: bricks, with a window onto the yard
  const bc = document.createElement('canvas'); bc.width = 256; bc.height = 256; { const g = bc.getContext('2d'); g.fillStyle = '#6a5a4c'; g.fillRect(0, 0, 256, 256); for (let y = 0; y < 256; y += 16) for (let x = (y / 16 % 2) * 16 - 16; x < 256; x += 32) { g.fillStyle = `hsl(${12 + R0() * 10},${30 + R0() * 15}%,${36 + R0() * 12}%)`; g.fillRect(x + 1, y + 1, 30, 14); } }
  const bt = new T.CanvasTexture(bc); bt.colorSpace = T.SRGBColorSpace; bt.wrapS = bt.wrapT = T.RepeatWrapping; bt.repeat.set(3, 2); const brick = new T.MeshStandardMaterial({ map: bt, roughness: 0.95 });
  const wall = (w, h, x, y) => { const m = new T.Mesh(new T.BoxGeometry(w, h, 0.1), brick); m.position.set(x, y, -1.2); m.receiveShadow = true; S.add(m); };
  wall(1.6, 3, -1.55, 1.5); wall(1.6, 3, 1.55, 1.5); wall(1.5, 0.95, 0, 0.475); wall(1.5, 1.05, 0, 2.475);
  const frameM = new T.MeshStandardMaterial({ color: 0x3a2a1c, roughness: 0.8 }); for (const [w, h, x, y] of [[1.52, 0.06, 0, 0.96], [1.52, 0.06, 0, 1.94], [0.06, 1, -0.75, 1.45], [0.06, 1, 0.75, 1.45], [0.04, 1, 0, 1.45], [1.5, 0.04, 0, 1.45]]) { const m = new T.Mesh(new T.BoxGeometry(w, h, 0.06), frameM); m.position.set(x, y, -1.17); S.add(m); }
  const sill = new T.Mesh(new T.BoxGeometry(1.7, 0.05, 0.25), frameM); sill.position.set(0, 0.94, -1.08); S.add(sill);
  // outside: grass, a hedge, trees (the sky is the real one)
  const grass = new T.Mesh(new T.PlaneGeometry(200, 120), new T.MeshStandardMaterial({ color: 0x4a6a2a, roughness: 1 })); grass.rotation.x = -Math.PI / 2; grass.position.set(0, 0, -62); S.add(grass);
  if (W3.pines) { const list = []; const R = W3.rng(9); for (let i = 0; i < 20; i++) list.push({ x: (R() - 0.5) * 40, z: -12 - R() * 30, y: 0, s: 0.5 + R() * 0.5, hue: R() }); W3.pines(list, { layers: 4 }); }
  const floor = new T.Mesh(new T.PlaneGeometry(8, 6), new T.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.95, map: W3.grainTex(128, 5, 160, 30, 4) })); floor.rotation.x = -Math.PI / 2; floor.position.z = 0.5; floor.receiveShadow = true; S.add(floor);
  // shelves, with pots made earlier
  const wood = new T.MeshStandardMaterial({ color: 0x7a5232, roughness: 0.8, map: W3.grainTex(128, 14, 190, 40, 6) });
  const shelves = []; for (const [x, y] of [[-1.35, 1.25], [-1.35, 1.75], [1.35, 1.25], [1.35, 1.75]]) { const s2 = new T.Mesh(new T.BoxGeometry(0.85, 0.035, 0.28), wood); s2.position.set(x, y, -1.02); s2.castShadow = s2.receiveShadow = true; S.add(s2); shelves.push(s2); }
  const shelfPots = new T.Group(); S.add(shelfPots);
  const R2 = W3.rng(3); for (let i = 0; i < 9; i++) { const r = []; const a = 0.2 + R2() * 0.2, b = (R2() - 0.5) * 0.3; for (let j = 0; j < NR; j++) { const u = j / (NR - 1); r.push(clamp(a + b * u + Math.sin(u * Math.PI) * (R2() - 0.3) * 0.2, 0.1, 0.45)); } const m = new T.Mesh(potGeo(T, r), new T.MeshStandardMaterial({ color: GLAZES[i % GLAZES.length], roughness: 0.25, metalness: 0.05, side: T.DoubleSide })); const sc = 0.5 + R2() * 0.4; m.scale.setScalar(sc); const sh = shelves[i % 4]; m.position.set(sh.position.x - 0.32 + (Math.floor(i / 4) * 0.22) + R2() * 0.05, sh.position.y + 0.018, -1.0); m.castShadow = true; shelfPots.add(m); }
  // the bench and the wheel
  const bench = new T.Mesh(new T.BoxGeometry(1.3, 0.06, 0.8), wood); bench.position.set(0, TOP - 0.13, 0); bench.castShadow = bench.receiveShadow = true; S.add(bench);
  for (const x of [-0.6, 0.6]) for (const z of [-0.35, 0.35]) { const l = new T.Mesh(new T.BoxGeometry(0.06, TOP - 0.16, 0.06), wood); l.position.set(x, (TOP - 0.16) / 2, z); S.add(l); }
  const pan = new T.Mesh(new T.CylinderGeometry(0.3, 0.27, 0.09, 40, 1, true), new T.MeshStandardMaterial({ color: 0x3a3c40, roughness: 0.6, side: T.DoubleSide })); pan.position.set(0, TOP - 0.06, 0); S.add(pan);
  const panB = new T.Mesh(new T.CircleGeometry(0.28, 40), new T.MeshStandardMaterial({ color: 0x5a4436, roughness: 0.5 })); panB.rotation.x = -Math.PI / 2; panB.position.set(0, TOP - 0.098, 0); S.add(panB);
  const head = new T.Mesh(new T.CylinderGeometry(0.16, 0.16, 0.03, 48), new T.MeshStandardMaterial({ color: 0x9a9ea4, metalness: 0.8, roughness: 0.35 })); head.position.set(0, TOP - 0.015, 0); head.castShadow = head.receiveShadow = true; S.add(head);
  const bowl = new T.Mesh(new T.SphereGeometry(0.07, 24, 12, 0, TAU, Math.PI / 2, Math.PI / 2), new T.MeshStandardMaterial({ color: 0x9a8a7a, roughness: 0.5, side: T.DoubleSide })); bowl.position.set(0.42, TOP - 0.03, 0.12); S.add(bowl);
  const water = new T.Mesh(new T.CircleGeometry(0.062, 24), new T.MeshStandardMaterial({ color: 0x5a6a6a, roughness: 0.05, metalness: 0.3 })); water.rotation.x = -Math.PI / 2; water.position.set(0.42, TOP - 0.05, 0.12); S.add(water);
  const sponge = new T.Mesh(new T.BoxGeometry(0.07, 0.03, 0.05), new T.MeshStandardMaterial({ color: 0xd8b84a, roughness: 1 })); sponge.position.set(-0.4, TOP - 0.085, 0.15); sponge.rotation.y = 0.4; S.add(sponge);
  // the clay
  const clayM = new T.MeshStandardMaterial({ color: 0xffffff, map: clayTex(), roughness: 0.32, metalness: 0.0, side: T.DoubleSide });
  const pot = new T.Mesh(potGeo(T, lump()), clayM); pot.position.set(0, TOP, 0); pot.castShadow = true; S.add(pot);
  const lamp = new T.PointLight(0xffe0b0, 3.2, 4, 1.4); lamp.position.set(0.5, 1.9, 0.6); lamp.castShadow = true; S.add(lamp);
  V3 = { T, S, pot, clayM, head, shelfPots, shelves, cam: { y: 0 }, lastR: '', glazed: null };
  W3.setQuality(stepN); return V3;
}
function setWeather(G) {
  const V = buildWorld(); if (V.none || V.sky === G.weather) return; V.sky = G.weather;
  W3.setSky(G.weather, { azim: 170 }); W3.S.exposure *= 0.8; W3.scene.environmentIntensity = 0.6;
  W3.scene.children.forEach(o => { if (o.isLineSegments) o.visible = false; });
  W3.S.onBolt = () => { if (!HEADLESS && sfx.thunder) setTimeout(() => sfx.thunder(), 300 + Math.random() * 900); };
}
function onEvent(G, e) {
  const cx = W / 2, cy = H * 0.24;
  switch (e.k) {
    case 'pot': if (V3 && !V3.none) { V3.glazed = null; V3.sag = 0; } sfx.plop(); break;
    case 'better': sfx.step(Math.round(e.m * 10)); break;
    case 'fired': sfx.fire(e.n); FX.flash = 0.5; vibe(HAP.best); say(e.perfect ? `PERFECT ${e.shape.toUpperCase()}!` : `${e.shape.toUpperCase()}: ${Math.round(e.m * 100)}%`, cx, cy, '#ffe08a', 26); if (e.n > 1) say(`${e.n} IN A ROW`, cx, cy + 32 * k, '#9be3b5', 18); if (V3 && !V3.none) { V3.glazed = { col: GLAZES[(G.good * 3 + G.N) % GLAZES.length], t: 0 }; } break;
    case 'cracked': sfx.crack(); FX.red = 0.5; FX.shake = 6; say(`CRACKED IN THE KILN: ${Math.round(e.m * 100)}%`, cx, cy, '#ffb4a8', 20); tip('early', `Fire only when the match reaches the mark (${Math.round(e.need * 100)}%)`, 3); break;
    case 'collapse': sfx.slump(); FX.red = 0.5; FX.shake = 10; say('IT COLLAPSED!', cx, cy, '#ffb4a8', 24); tip('slow', 'Slow, steady fingers: fast hard pushes make the clay wobble', 3); if (V3 && !V3.none) V3.sag = 0.01; break;
    case 'dried': sfx.crack(); FX.red = 0.4; say('THE CLAY DRIED OUT', cx, cy, '#ffb4a8', 22); tip('dry', 'Later the clay dries: shape it before the bar runs out', 3); break;
    case 'lessonnext': if (e.first) hint = null; say(e.first ? 'FIRST, A LESSON' : 'NEXT LESSON', cx, H * 0.5, '#ffd36a', 26); sfx.ding(); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, cx, H * 0.5, '#9be3b5', 26); sfx.coin(e.n); break;
    case 'lessonmiss': hint = { txt: e.how, t: 0, secs: 3.6 }; break;
    case 'lessondone': say('THE WHEEL IS YOURS!', cx, H * 0.5, '#ffd36a', 26); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); vibe(HAP.best); break;
    case 'lost': sfx.lose(); break;
  }
}
const VV = new (window.THREE ? THREE.Vector3 : Object)();
function potScreen(u, rr) { if (!V3 || V3.none) return { x: W / 2 + rr * 300, y: H * 0.62 - u * 300 }; W3.cam.updateMatrixWorld(); VV.set(rr * POT_H, TOP + u * POT_H, 0); return W3.screen(VV); }
// the fingertip on the screen, as a height on the pot and a distance from its middle
function potAt(x, y) { const b = potScreen(0, 0), t = potScreen(1, 0), u = (y - b.y) / (t.y - b.y), s = potScreen(clamp(u, 0, 1), 1), axis = potScreen(clamp(u, 0, 1), 0), per = Math.abs(s.x - axis.x) || 1; return { u, d: Math.abs(x - axis.x) / per }; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#1a1410'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D workshop.', W / 2, H / 2); return; }
  const T = V.T, g = G || idleG(), t = now; setWeather(g);
  // the clay: rebuilt when its shape changes; spinning; wobbling; sagging after a collapse; glazed when fired
  const key = g.r.map(v => v.toFixed(3)).join(); if (key !== V.lastR) { V.lastR = key; V.pot.geometry.dispose(); V.pot.geometry = potGeo(T, g.r); }
  V.pot.rotation.y -= dt * 9; V.head.rotation.y -= dt * 9;
  const wob = g.wob || 0; V.pot.position.x = Math.sin(t * 9) * wob * 0.008; V.pot.rotation.z = Math.sin(t * 9 + 1) * wob * 0.06;
  if (V.sag) { V.sag = Math.min(1, V.sag + dt * 2.5); V.pot.scale.set(1 + V.sag * 0.5, 1 - V.sag * 0.7, 1 + V.sag * 0.5); } else V.pot.scale.set(1, 1, 1);
  if (V.glazed) { V.glazed.t += dt; V.clayM.color.setHex(V.glazed.col); V.clayM.roughness = 0.15; V.clayM.map = null; V.clayM.needsUpdate = true; V.pot.position.y = TOP + Math.max(0, V.glazed.t - 0.6) * 0.3; }
  else if (!V.clayM.map) { V.clayM.color.setHex(0xffffff); V.clayM.roughness = 0.32; V.clayM.map = V.clayTex || (V.clayTex = clayTex()); V.clayM.needsUpdate = true; V.pot.position.y = TOP; }
  else V.pot.position.y = TOP;
  if (!V.clayTex) V.clayTex = V.clayM.map;
  // the camera: in front of the wheel, a little above, the pot in the middle of the screen
  const asp = innerWidth / innerHeight, cam = W3.cam, dist = asp < 0.6 ? 0.95 : 0.7; cam.fov = 42; cam.updateProjectionMatrix();
  cam.position.set(0, TOP + POT_H * 0.95, dist); cam.lookAt(0, TOP + POT_H * 0.42, 0);
  if (FX.shake > 0) cam.rotation.z += (Math.random() - 0.5) * FX.shake * 0.002;
  W3.setFocus(0, TOP, 0, 0.6);
  W3.render(dt);
  if (G) hud(G, t);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 1.0 ? 1 : 1 - (t2.t - 1.0) / 0.4; ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(t2.size * k)}px ${BC}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 22); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 22); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(15 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 19 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30;
    ctx.fillStyle = 'rgba(0,0,0,.66)'; rrect(W / 2 - w / 2, H * 0.3 - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.3 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,60,40,${FX.red * 0.18})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,236,200,${FX.flash * 0.35})`; ctx.fillRect(0, 0, W, H); }
}
let IG = null; function idleG() { if (!IG) { IG = newGame(3, { seed: 11 }); } IG.t += 1 / 60; const u = (Math.sin(IG.t * 0.7) + 1) / 2, i = Math.round(u * (NR - 1)); IG.r[i] += (IG.target[i] - IG.r[i]) * 0.04; return IG; }
function fireRect() { const w = 150 * k, h = 52 * k; return { x: W / 2 - w / 2, y: H - h - 22 * k, w, h }; }
function hud(G, t) {
  const c = G.cfg;
  // the order's outline, dotted on both sides of the clay
  if (!G.gap || G.gap <= 0) { ctx.save(); ctx.setLineDash([5 * k, 5 * k]); ctx.lineWidth = 2.5 * k; ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 4;
    for (const s of [-1, 1]) { ctx.beginPath(); for (let i = 0; i < NR; i++) { const p = potScreen(i / (NR - 1), s * G.target[i]); if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); } ctx.stroke(); }
    ctx.restore(); }
  // the fingertip: a ring where it touches, drops of slip
  if (G.finger) { const f = G.finger, p = potScreen(f.u, f.d * (ui.drag && ui.drag.side || 1)); ctx.strokeStyle = G.touching ? 'rgba(255,220,180,.9)' : 'rgba(255,255,255,.35)'; ctx.lineWidth = 3 * k; ctx.beginPath(); ctx.arc(p.x, p.y, 14 * k, 0, TAU); ctx.stroke();
    if (G.touching && Math.random() < 0.5) PT.push({ x: p.x, y: p.y, vx: (Math.random() - 0.5) * 160, vy: -Math.random() * 120, t: 0, life: 0.5 }); }
  ctx.fillStyle = 'rgba(150,90,60,.9)'; for (const q of PT) { ctx.globalAlpha = 1 - q.t / q.life; ctx.beginPath(); ctx.arc(q.x, q.y, 2.5 * k, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  if (G.lesson) lessonPanel(G);
  // the order card and the match bar
  const ty = G.lesson ? H * 0.24 : 44 * k, bx = 16, bw = W - 32;
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.font = `700 ${Math.round(15 * k)}px ${TF}`; ctx.fillStyle = '#fff'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.5)';
  const title = `Order: ${G.shape}` + (G.lesson ? '' : `   ·   pot ${Math.min(G.made + 1, c.pots)} of ${c.pots}`); ctx.strokeText(title, bx, ty); ctx.fillText(title, bx, ty);
  if (!G.lesson) { for (let i = 0; i < c.lives; i++) { ctx.beginPath(); ctx.arc(W - 20 - i * 16 * k, ty + 9 * k, 5 * k, 0, TAU); ctx.fillStyle = i < G.lives ? '#e8a06a' : 'rgba(255,255,255,.25)'; ctx.fill(); } }
  const my = ty + 26 * k, m = G.match; ctx.fillStyle = 'rgba(0,0,0,.45)'; rrect(bx, my, bw, 12 * k, 6); ctx.fill();
  ctx.fillStyle = m >= c.pass ? '#8fe0ab' : '#e8b04a'; rrect(bx, my, Math.max(8, bw * m), 12 * k, 6); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.fillRect(bx + bw * c.pass - 1.5, my - 4 * k, 3, 20 * k);
  ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.textAlign = 'left'; ctx.strokeText(`MATCH ${Math.round(m * 100)}%`, bx, my + 16 * k); ctx.fillText(`MATCH ${Math.round(m * 100)}%`, bx, my + 16 * k); ctx.textAlign = 'right'; ctx.strokeText(`FIRE AT ${Math.round(c.pass * 100)}%`, bx + bw, my + 16 * k); ctx.fillText(`FIRE AT ${Math.round(c.pass * 100)}%`, bx + bw, my + 16 * k);
  if (c.dry && !G.lesson && G.gap <= 0) { const u = 1 - G.potT / c.dry; ctx.fillStyle = 'rgba(0,0,0,.35)'; rrect(bx, my + 34 * k, bw, 5 * k, 2); ctx.fill(); ctx.fillStyle = u > 0.3 ? '#7fb8d8' : '#d9534f'; rrect(bx, my + 34 * k, bw * Math.max(0, u), 5 * k, 2); ctx.fill(); ctx.font = `700 ${Math.round(9 * k)}px ${BC}`; ctx.textAlign = 'left'; ctx.fillStyle = '#cfe6f0'; ctx.fillText('CLAY STILL WET', bx, my + 42 * k); }
  if (G.wob > 0.25) { ctx.fillStyle = `rgba(255,140,100,${Math.min(1, G.wob)})`; ctx.font = `700 ${Math.round(16 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillText('WOBBLING: SLOWER!', W / 2, H * 0.4); }
  // FIRE
  const fr = fireRect(), ready = m >= c.pass; ui.fireBtn = fr; ctx.fillStyle = ready ? '#d8602a' : 'rgba(80,50,40,.75)'; rrect(fr.x, fr.y, fr.w, fr.h, 26 * k); ctx.fill(); if (ready) { ctx.strokeStyle = `rgba(255,220,160,${0.5 + 0.5 * Math.sin(t * 6)})`; ctx.lineWidth = 3; rrect(fr.x, fr.y, fr.w, fr.h, 26 * k); ctx.stroke(); }
  ctx.fillStyle = ready ? '#fff' : 'rgba(255,255,255,.55)'; ctx.font = `700 ${Math.round(20 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🔥 FIRE', fr.x + fr.w / 2, fr.y + fr.h / 2);
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
