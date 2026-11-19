// ===================== THE VIEW: Fire Crew in 3D (three.js through tools/world3d.js) =====================
// A street at night. In front of you a brick building, its front a grid of windows; neighbours either side. Fire is flames
// (glowing sprites) licking out of the windows and orange light on the street; smoke rolls up and drifts with the wind. People
// wave from windows. Your red fire engine is in the front of the picture: the hose arcs water up to where your thumb points,
// and the ladder swings up to a window and brings the person down. 3D because the building towering over you, its glow and the
// smoke are the scene.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [];
let hint = null, V3 = null;
const SX = 3.2, SY = 3.4, Y0 = 3;
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 6) TXT.shift(); }
function tip(key, txt, secs = 2.8) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 1.8);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.3) TXT.shift(); if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; } }
const ui = { drag: null };
const wx = (G, c) => (c - (G.C - 1) / 2) * SX, wy = r => Y0 + r * SY;
function glowTex(T, inner, outer) { const cnv = document.createElement('canvas'); cnv.width = cnv.height = 64; const x = cnv.getContext('2d'), g = x.createRadialGradient(32, 32, 2, 32, 32, 32); g.addColorStop(0, inner); g.addColorStop(0.4, outer); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); const t = new T.CanvasTexture(cnv); t.colorSpace = T.SRGBColorSpace; return t; }
function person(T, col) { const g = new T.Group(), skin = new T.MeshStandardMaterial({ color: 0xe0b08a }), shirt = new T.MeshStandardMaterial({ color: col });
  const body = new T.Mesh(new T.CylinderGeometry(0.32, 0.38, 1.1, 10), shirt); body.position.y = 0.55; g.add(body); const head = new T.Mesh(new T.SphereGeometry(0.28, 12, 10), skin); head.position.y = 1.4; g.add(head);
  const arm = new T.Group(); arm.position.set(0.35, 1.0, 0); const a = new T.Mesh(new T.BoxGeometry(0.14, 0.8, 0.14), shirt); a.position.y = 0.4; arm.add(a); g.add(arm); g.userData.arm = arm; return g; }
function buildWorld(G) { const T = THREE, key = G.N + ':' + G.C + 'x' + G.R + ':' + G.place;
  if (!V3) { if (!W3 || !W3.init({ canvas: $('gl'), fov: 55, far: 2000, near: 0.1 })) { V3 = { none: true }; return V3; }
    V3 = { T, S: W3.scene, items: [], flameT: glowTex(T, 'rgba(255,210,110,1)', 'rgba(240,80,10,.75)'), smokeT: glowTex(T, 'rgba(60,56,54,.75)', 'rgba(40,38,38,.4)'), waterT: glowTex(T, 'rgba(230,245,255,1)', 'rgba(140,200,255,.6)') };
    const V = V3, NP = 160; V.water = []; for (let i = 0; i < NP; i++) { const s = new T.Sprite(new T.SpriteMaterial({ map: V.waterT, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0.8 })); s.scale.setScalar(0.6); s.visible = false; V.S.add(s); V.water.push({ s, u: i / NP }); }
    V.smoke = []; for (let i = 0; i < 90; i++) { const s = new T.Sprite(new T.SpriteMaterial({ map: V.smokeT, transparent: true, depthWrite: false, opacity: 0 })); s.visible = false; V.S.add(s); V.smoke.push({ s, t: 9, life: 1, x: 0, y: 0, z: 0, vx: 0, vy: 0 }); }
    V.glow = new T.PointLight(0xff7a2a, 0, 80, 1.6); V.glow.position.set(0, 10, 8); V.S.add(V.glow);
    // the fire engine
    const truck = new T.Group(), red = new T.MeshStandardMaterial({ color: 0xc81e1e, roughness: 0.45, metalness: 0.2 }), chrome = new T.MeshStandardMaterial({ color: 0xd8d8d8, metalness: 0.8, roughness: 0.3 }), dark = new T.MeshStandardMaterial({ color: 0x1a1a1a });
    const body = new T.Mesh(new T.BoxGeometry(3.2, 2.0, 7), red); body.position.y = 1.5; truck.add(body); const cab = new T.Mesh(new T.BoxGeometry(3.2, 2.4, 2.2), red); cab.position.set(0, 1.7, 4.4); truck.add(cab);
    for (const [x, z] of [[-1.6, -2.4], [1.6, -2.4], [-1.6, 3.8], [1.6, 3.8]]) { const wh = new T.Mesh(new T.CylinderGeometry(0.6, 0.6, 0.4, 14), dark); wh.rotation.z = Math.PI / 2; wh.position.set(x, 0.6, z); truck.add(wh); }
    const strip = new T.Mesh(new T.BoxGeometry(3.25, 0.15, 7.05), chrome); strip.position.y = 1.0; truck.add(strip); const bar = new T.Mesh(new T.BoxGeometry(2, 0.25, 0.4), new T.MeshStandardMaterial({ color: 0x2a6aff, emissive: 0x2a4aff, emissiveIntensity: 1 })); bar.position.set(0, 3.05, 4.4); truck.add(bar); V.beacon = bar;
    truck.position.set(-6, 0, 12); truck.rotation.y = Math.PI * 0.8; truck.scale.setScalar(0.75); V.S.add(truck); V.truck = truck;
    const lad = new T.Group(); lad.position.set(-6, 2.3, 12); V.S.add(lad); const rails = new T.Group(); for (const s of [-0.35, 0.35]) { const r = new T.Mesh(new T.BoxGeometry(0.12, 0.12, 1), chrome); r.position.set(s, 0, 0.5); rails.add(r); } for (let i = 0; i < 10; i++) { const rg = new T.Mesh(new T.BoxGeometry(0.7, 0.06, 0.06), chrome); rg.position.z = 0.05 + i * 0.1; rails.add(rg); } lad.add(rails); V.lad = lad; V.rails = rails;
    V.nozzle = new T.Vector3(-5, 2.6, 11); V.people = new Map(); }
  const V = V3; if (V.none || V.key === key) return V; V.key = key; for (const o of V.items) V.S.remove(o); V.items = []; for (const m of V.people.values()) V.S.remove(m); V.people.clear(); const add = o => { V.S.add(o); V.items.push(o); return o; };
  const T2 = T, P = PLACES[G.place], bw = G.C * SX + 1.6, bh = Y0 + G.R * SY + 1.2;
  const ground = add(new T2.Mesh(new T2.PlaneGeometry(400, 400), new T2.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 0.85 }))); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
  const kerb = add(new T2.Mesh(new T2.BoxGeometry(200, 0.3, 4), new T2.MeshStandardMaterial({ color: 0x6a6a6a }))); kerb.position.set(0, 0.15, 2);
  const brick = new T2.MeshStandardMaterial({ color: P.brick, roughness: 0.9, map: W3.grainTex(128, 4, 160, 30, 20) }); const bld = add(new T2.Mesh(new T2.BoxGeometry(bw, bh, 12), brick)); bld.position.set(0, bh / 2, -6); bld.castShadow = true; bld.receiveShadow = true;
  const roof = add(new T2.Mesh(new T2.BoxGeometry(bw + 0.6, 0.6, 12.6), new T2.MeshStandardMaterial({ color: 0x3a3a3a }))); roof.position.set(0, bh, -6);
  for (const s of [-1, 1]) { const h2 = bh * (0.6 + 0.3 * (s > 0 ? 0.6 : 0.2)); const nb = add(new T2.Mesh(new T2.BoxGeometry(14, h2, 12), new T2.MeshStandardMaterial({ color: 0x3a3438, roughness: 0.95 }))); nb.position.set(s * (bw / 2 + 7.2), h2 / 2, -7);
    for (let r = 0; r < Math.floor((h2 - 3) / 3.4); r++) for (let q = 0; q < 3; q++) { const lit = (r * 3 + q + G.N) % 4 === 0, wm = add(new T2.Mesh(new T2.PlaneGeometry(1.6, 2), new T2.MeshStandardMaterial({ color: 0x111111, emissive: lit ? 0xffd88a : 0x000000, emissiveIntensity: 0.5 }))); wm.position.set(s * (bw / 2 + 7.2) + (q - 1) * 3.6, 3 + r * 3.4, -0.98); } }
  V.win = []; const frameM = new T2.MeshStandardMaterial({ color: 0xd8d0c0 });
  for (const w of G.w) { const x = wx(G, w.c), y = wy(w.r), m = add(new T2.Mesh(new T2.PlaneGeometry(2.0, 2.4), new T2.MeshStandardMaterial({ color: 0x0c0c10, emissive: 0x000000, roughness: 0.3 }))); m.position.set(x, y, 0.02);
    const sill = add(new T2.Mesh(new T2.BoxGeometry(2.4, 0.18, 0.4), frameM)); sill.position.set(x, y - 1.28, 0.15); const top = add(new T2.Mesh(new T2.BoxGeometry(2.4, 0.18, 0.2), frameM)); top.position.set(x, y + 1.28, 0.1);
    const fl = []; for (let j = 0; j < 3; j++) { const s = add(new T2.Sprite(new T2.SpriteMaterial({ map: V.flameT, transparent: true, depthWrite: false, blending: T2.AdditiveBlending }))); s.visible = false; fl.push(s); }
    const gas = add(new T2.Mesh(new T2.CylinderGeometry(0.22, 0.22, 0.8, 10), new T2.MeshStandardMaterial({ color: 0xd82a2a, metalness: 0.4, roughness: 0.4 }))); gas.position.set(x + 0.7, y - 0.85, 0.35); gas.visible = false;
    V.win.push({ m, fl, gas }); }
  W3.setQuality(stepN); return V; }
function setWeather(G) { const V = V3; if (!V || V.none || V.sky === G.weather) return; V.sky = G.weather; W3.setSky(G.weather, { azim: 200 }); W3.S.onBolt = () => { if (!HEADLESS && sfx.thunder) setTimeout(() => sfx.thunder(), 300 + Math.random() * 900); }; }
const VW = new (window.THREE ? THREE.Vector3 : Object)();
function wScreen(x, y, z) { W3.cam.updateMatrixWorld(); VW.set(x, y, z); return W3.screen(VW); }
// a point on the screen to a place on the building's front (in windows: column, row)
const RV = new (window.THREE ? THREE.Vector3 : Object)();
function gridAt(G, px, py) { if (!V3 || V3.none) return { c: (px / W) * G.C - 0.5, r: (1 - py / H) * G.R - 0.5 }; const cam = W3.cam; cam.updateMatrixWorld(); RV.set(px / W * 2 - 1, -(py / H) * 2 + 1, 0.5).unproject(cam).sub(cam.position);
  const t = -cam.position.z / RV.z, X = cam.position.x + RV.x * t, Y = cam.position.y + RV.y * t; return { c: X / SX + (G.C - 1) / 2, r: (Y - Y0) / SY }; }
function smokeAt(V, x, y, n, wind) { for (let i = 0; i < n; i++) for (const q of V.smoke) if (q.t >= q.life) { Object.assign(q, { t: 0, life: 2.5 + Math.random() * 1.5, x: x + (Math.random() - 0.5), y: y + 1, z: 0.6, vx: wind * 1.2 + (Math.random() - 0.5) * 0.5, vy: 1.6 + Math.random() }); break; } }
function onEvent(G, e) { const cx = W / 2, cy = H * 0.3, V = V3 && !V3.none ? V3 : null, sp = (c, r) => V ? wScreen(wx(G, c), wy(r), 0.5) : { x: cx, y: cy };
  switch (e.k) {
    case 'start': say(`${PLACES[G.place].name.toUpperCase()}`, cx, H * 0.18, '#fff', 18); sfx.siren(); break;
    case 'out': { const p = sp(e.c, e.r); say('OUT!', p.x, p.y - 30 * k, '#bfe8ff', 16); sfx.hiss(); vibe(HAP.tick); break; }
    case 'cooled': { const p = sp(e.c, e.r); say('COOLED', p.x, p.y - 30 * k, '#bfe8ff', 14); sfx.hiss(); break; }
    case 'catch': sfx.whoosh(); break;
    case 'blast': { const p = sp(e.c, e.r); say('BOOM!', p.x, p.y, '#ffb040', 34); sfx.boom(); FX.shake = 18; FX.flash = 0.8; vibe(HAP.heavy); tip('gas', 'Gas bottles 🧯 explode when fire reaches them. Keep fire away from them!', 3.2); break; }
    case 'burst': { const p = sp(e.c, e.r); say('BACKDRAFT!', p.x, p.y, '#ff8040', 24); sfx.boom(); FX.shake = 12; tip('hot', 'A glowing window bursts into flame: spray it to cool it first.', 3.2); break; }
    case 'wind': say(e.w > 0 ? 'WIND →' : '← WIND', cx, H * 0.24, '#cfe8ff', 18); tip('wind', 'The wind pushes your water sideways: aim into it.', 3); break;
    case 'dry': sfx.sputter(); say('TANK EMPTY', W * 0.25, H * 0.7, '#ffd0a0', 18); tip('tank', 'Tank empty! Lift your thumb to let it refill.', 2.8); break;
    case 'ladder': sfx.ladder(); say('LADDER UP!', cx, H * 0.24, '#ffe08a', 18); break;
    case 'busy': tip('busy', 'The ladder is already busy.', 2); sfx.no(); break;
    case 'hot': { const p = sp(e.c, e.r); say('TOO HOT', p.x, p.y - 34 * k, '#ffb4a8', 16); sfx.no(); tip('hot2', 'Put out the fire in their window first, then tap them.', 2.8); break; }
    case 'ladderback': say('TOO HOT! LADDER BACK', cx, H * 0.24, '#ffb4a8', 18); sfx.no(); break;
    case 'grab': sfx.grab(); break;
    case 'rescued': say('SAVED!', cx, H * 0.62, '#9be3b5', 28); sfx.saved(e.n); vibe(HAP.light); break;
    case 'lostp': { const p = sp(e.c, e.r); say('LOST', p.x, p.y, '#ff6a5a', 24); FX.red = 0.8; sfx.lostp(); break; }
    case 'collapse': say('THE BUILDING IS LOST', cx, cy, '#ff6a5a', 24); FX.red = 1.2; break;
    case 'allout': say('ALL OUT!', cx, cy, '#ffe08a', 32); break;
    case 'lessonnext': if (e.first) hint = null; say(e.first ? 'FIRST, A LESSON' : 'NEXT LESSON', cx, H * 0.55, '#ffd36a', 26); break;
    case 'lessondone': say('GOOD WORK!', cx, H * 0.55, '#ffd36a', 26); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); FX.flash = 0.5; vibe(HAP.best); break;
    case 'lost': sfx.lose(); break;
  } }
const LADV = window.THREE ? new THREE.Vector3() : null;
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round';
  const g = G || idleG(), V = buildWorld(g); if (V.none) { ctx.fillStyle = '#1a0e0a'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D street.', W / 2, H / 2); return; }
  setWeather(g); const T = V.T; let fireSum = 0, fx = 0, fy = 0;
  g.w.forEach((w, i) => { const v = V.win[i]; if (!v) return; const x = wx(g, w.c), y = wy(w.r), f = w.f;
    fireSum += f; fx += x * f; fy += y * f;
    v.m.material.emissive.setRGB(f > 0 ? 1 : w.isHot ? 0.9 : 0, f > 0 ? 0.28 + 0.1 * Math.sin(now * 13 + i) : w.isHot ? 0.1 : 0, f > 0 ? 0.03 : 0); v.m.material.emissiveIntensity = f > 0 ? 0.35 + f * 0.7 : w.isHot ? 0.3 + w.hot * 1.2 + 0.25 * Math.sin(now * 5 + i) : 0;
    v.fl.forEach((s, j) => { s.visible = f > 0.02; if (!s.visible) return; const fl = 0.8 + 0.25 * Math.sin(now * (9 + j * 3) + i * 2 + j); s.position.set(x + (j - 1) * 0.55 * f, y - 0.3 + (0.6 + j * 0.45) * f * fl, 0.6 + j * 0.1); s.scale.setScalar((0.9 + f * 2.4) * (j === 1 ? 1.25 : 0.85) * fl); s.material.opacity = 0.3 + 0.35 * f; });
    v.gas.visible = !!w.gas; if (f > 0.5 && Math.random() < f * dt * 6) smokeAt(V, x, y + 0.5, 1, g.wind);
    let pm = V.people.get(i); if (w.p && w.p.st === 'in' && !(g.lad && g.lad.w === w && g.lad.got === true)) { if (!pm) { pm = person(T, [0x3a7ad8, 0xe8c23a, 0x5ab84a, 0xd85aa8][w.p.id % 4]); V.S.add(pm); V.people.set(i, pm); } pm.visible = true; pm.position.set(x - 0.3, y - 1.2, 0.25); pm.userData.arm.rotation.z = 2.4 + Math.sin(now * (8 + w.p.s * 8) + i) * 0.6; pm.rotation.y = Math.sin(now + i) * 0.2; } else if (pm) pm.visible = false; });
  // the glow on the street
  V.glow.intensity = Math.min(300, fireSum * 40); if (fireSum > 0) V.glow.position.set(fx / fireSum, fy / fireSum, 6); V.beacon.material.emissiveIntensity = 0.5 + 0.5 * Math.sin(now * 12);
  // smoke
  V.smoke.forEach(q => { if (q.t < q.life) { q.t += dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vx += g.wind * 0.3 * dt; } const on = q.t < q.life; q.s.visible = on; if (on) { const u = q.t / q.life; q.s.position.set(q.x, q.y, q.z); q.s.scale.setScalar(1.5 + u * 5); q.s.material.opacity = 0.6 * (1 - u) * Math.min(1, u * 6); } });
  // the water: an arc from the nozzle to where it lands
  const lx = wx(g, g.land.x), ly = wy(g.land.y), on = g.on && g.tank > 0, N0 = V.nozzle;
  V.water.forEach(q => { q.u = (q.u + dt * 1.6) % 1; q.s.visible = on; if (!on) return; const u = q.u, x = N0.x + (lx - N0.x) * u, z = N0.z + (0.5 - N0.z) * u, y = N0.y + (ly - N0.y) * u + Math.sin(u * Math.PI) * 4 + (Math.random() - 0.5) * 0.3; q.s.position.set(x + (Math.random() - 0.5) * 0.2 * u, y, z); q.s.scale.setScalar(0.35 + u * 0.9); });
  // the ladder: swings up to the window it is fetching from, and back
  const L = g.lad; let len = 1, tgt = null; if (L) { const u = L.t / L.dur, ext = u < 0.5 ? u * 2 : (1 - u) * 2; tgt = LADV.set(wx(g, L.w.c), wy(L.w.r) - 1.2, 0.6); const d = tgt.clone().sub(V.lad.position).length(); len = 1 + (d - 1) * easeOut(clamp(ext, 0, 1)); V.lad.lookAt(tgt); }
  else { V.lad.rotation.set(0, Math.PI * 0.85, 0); } V.rails.scale.z = len;
  if (L && L.got === true) { let pm = V.people.get(g.w.indexOf(L.w)); if (pm) { pm.visible = true; const tip2 = new T.Vector3(0, 0, len).applyQuaternion(V.lad.quaternion).add(V.lad.position); pm.position.set(tip2.x, tip2.y - 0.4, tip2.z); } }
  // the camera: the whole building in view, looking up a little from the street
  const cam = W3.cam, asp = W / H, th = Math.tan(55 / 2 * Math.PI / 180), bw = g.C * SX + 3, bh = Y0 + g.R * SY + 2, D = Math.max(bw / (2 * th * asp), bh / (2 * th) * 1.05) + 4, cyW = bh * 0.52;
  cam.position.set(0, cyW - 3, D); cam.lookAt(0, cyW + 0.5, 0); if (FX.shake > 0) { cam.position.x += (Math.random() - 0.5) * FX.shake * 0.02; cam.position.y += (Math.random() - 0.5) * FX.shake * 0.02; }
  W3.setFocus(0, cyW, 0, 40); W3.render(dt);
  if (G) hud(G, now);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 0.9 ? 1 : 1 - (t2.t - 0.9) / 0.4; ctx.globalAlpha = Math.max(0, al); ctx.font = `${Math.round(t2.size * k)}px ${TF}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 22); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 22); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(15 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 19 * k, h = lines.length * lh + 16 * k, w2 = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30;
    ctx.fillStyle = 'rgba(0,0,0,.7)'; rrect(W / 2 - w2 / 2, H * 0.84 - h / 2, w2, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.84 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,60,40,${FX.red * 0.2})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,230,180,${FX.flash * 0.35})`; ctx.fillRect(0, 0, W, H); } }
let IG = null; function idleG() { if (!IG || IG.over) { IG = newGame(5, { seed: (Math.random() * 1e6) | 0 }); IG.mem = {}; } honest(IG, { react: 0.2, acc: 0.95 }, IG.mem); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function hud(G, t) { const c = G.cfg;
  // over the people: a smoke ring that fills, and TAP when the ladder can reach them
  for (const w of G.w) { if (!w.p || w.p.st !== 'in') continue; const p = wScreen(wx(G, w.c), wy(w.r) + 1.6, 0.5), r = 13 * k; ctx.lineWidth = 4 * k; ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.stroke();
    ctx.strokeStyle = w.p.s > 0.7 ? '#ff4a3a' : w.p.s > 0.4 ? '#ffb040' : '#cfd8e0'; ctx.beginPath(); ctx.arc(p.x, p.y, r, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(w.p.s, 0, 1)); ctx.stroke();
    if (w.f <= 0.15 && !G.lad) { ctx.font = `${Math.round(13 * k)}px ${TF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = `rgba(255,232,138,${0.6 + 0.4 * Math.sin(t * 8)})`; ctx.fillText('TAP', p.x, p.y - 22 * k); } }
  // where the water lands
  if (G.on) { const p = wScreen(wx(G, G.land.x), wy(G.land.y), 0.5); ctx.strokeStyle = G.tank > 0 ? 'rgba(190,230,255,.8)' : 'rgba(255,160,120,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, 16 * k, 0, TAU); ctx.moveTo(p.x - 22 * k, p.y); ctx.lineTo(p.x + 22 * k, p.y); ctx.moveTo(p.x, p.y - 22 * k); ctx.lineTo(p.x, p.y + 22 * k); ctx.stroke(); }
  if (G.lesson) lessonPanel(G);
  else { ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.6)';
    const ppl = G.w.filter(w => w.p).map(w => w.p).sort((a, b) => a.id - b.id); ctx.font = `${Math.round(17 * k)}px sans-serif`; ppl.forEach((p, i) => ctx.fillText(p.st === 'safe' ? '✅' : p.st === 'lost' ? '❌' : '🧍', 14 + i * 22 * k, 44 * k));
    ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = '#fff'; const s2 = `${G.rescued} saved · can lose ${Math.max(0, c.allow - G.lost)} more`; ctx.strokeText(s2, 14, 68 * k); ctx.fillText(s2, 14, 68 * k);
    // the blaze meter: how close the building is to being lost
    const ab = G.w.filter(w => w.f >= 0.95).length / (G.w.length * c.burnOut), bx = W - 150 * k, by = 46 * k; ctx.fillStyle = 'rgba(0,0,0,.5)'; rrect(bx, by, 136 * k, 12 * k, 6); ctx.fill(); ctx.fillStyle = ab > 0.7 ? '#ff3a2a' : '#ff8a2a'; rrect(bx, by, 136 * k * clamp(ab, 0, 1), 12 * k, 6); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.strokeText('BLAZE', bx, by + 15 * k); ctx.fillText('BLAZE', bx, by + 15 * k);
    if (G.useWind) { ctx.textAlign = 'right'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; const ws = `🚩 WIND ${G.wind > 0.1 ? '→'.repeat(Math.ceil(Math.abs(G.wind) * 2)) : G.wind < -0.1 ? '←'.repeat(Math.ceil(Math.abs(G.wind) * 2)) : 'calm'}`; ctx.strokeText(ws, W - 14, by + 15 * k); ctx.fillText(ws, W - 14, by + 15 * k); } }
  // the tank
  const tx = 16 * k, th2 = H * 0.2, ty = H - th2 - 40 * k, tw = 16 * k, u = G.tank / G.tankMax; ctx.fillStyle = 'rgba(0,0,0,.5)'; rrect(tx, ty, tw, th2, 8); ctx.fill(); ctx.fillStyle = u < 0.2 ? '#ff8a5a' : '#5ab8ff'; rrect(tx, ty + th2 * (1 - u), tw, th2 * u, 8); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('TANK', tx - 2, ty + th2 + 6); }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { const D = G.lesson, st = D.steps[D.i], x = 14, w = W - 28, y = 42 * k; ctx.save();
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; const lines = wrapText(st.how, w - 24), h = 54 * k + lines.length * 17 * k;
  ctx.fillStyle = 'rgba(0,0,0,.66)'; rrect(x, y, w, h, 12); ctx.fill(); ctx.strokeStyle = 'rgba(255,211,106,.7)'; ctx.lineWidth = 2; rrect(x, y, w, h, 12); ctx.stroke();
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#ffd36a'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillText(`LESSON ${D.i + 1} OF ${D.steps.length}`, x + 12, y + 10 * k);
  ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(18 * k)}px ${BC}`; ctx.fillText(st.title, x + 12, y + 25 * k);
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.9)'; lines.forEach((l, i) => ctx.fillText(l, x + 12, y + 48 * k + i * 17 * k));
  ctx.restore(); }
