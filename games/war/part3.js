// ===================== THE VIEW: Battle Lines in 3D (three.js through tools/world3d.js) =====================
// The general's view from a rise behind his own lines: the whole field below, grass and hills and woods, the enemy drawn up
// at the far end. Every soldier is a little figure (hundreds of them, drawn as a few instanced shapes: LESSONS, Eleven): your
// men in your banner's colour, theirs in red; spears, horses, archers' arcs of arrows. Each unit carries a banner with its kind,
// and a bar of how many men it has left, coloured by its nerve. A broken unit scatters and runs. Tap a unit and a ring marks it;
// an arrow shows the order. Before battle: the formation cards and the BATTLE button; in battle: the horn.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { snap: true, cam: null, flash: [], btn: [] };
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 140) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40 * k, t: 0, life: 0.4 + Math.random() * 0.4, col, r: (1.5 + Math.random() * 2) * k }); } if (PARTS.length > 200) PARTS.splice(0, PARTS.length - 200); }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2.5); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.5) TXT.shift(); for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 200 * k * dt; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; } }
const hex = n => '#' + n.toString(16).padStart(6, '0'), RED = 0xc8302a;
function hillH(G, x, z) { let h = 0; for (const q of G.hills) { const d = Math.hypot(x - q.x, z - q.z) / q.r; if (d < 1.4) h += 3.2 * Math.max(0, Math.cos(Math.min(1, d / 1.4) * Math.PI / 2)) ** 2; } return h; }
function iconTex(txt, col) { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.fillStyle = col; g.beginPath(); g.arc(32, 32, 28, 0, TAU); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 4; g.stroke(); g.font = '34px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 32, 35); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
function buildWorld() { if (V3) return V3; const T = THREE; if (!W3 || !W3.init({ canvas: $('gl'), fov: 58, far: 3000, near: 0.5 })) { V3 = { none: true }; return V3; }
  const MAX = 900, V = { T, S: W3.scene, MAX, key: null, banners: new Map(), icons: {} }; V3 = V;
  const mk = (geo, mat) => { const m = new T.InstancedMesh(geo, mat, MAX); m.instanceMatrix.setUsage(T.DynamicDrawUsage); m.count = 0; m.castShadow = true; m.frustumCulled = false; V.S.add(m); return m; };
  V.body = mk(new T.BoxGeometry(0.75, 1.25, 0.5), new T.MeshStandardMaterial({ roughness: 0.6 })); V.head = mk(new T.SphereGeometry(0.27, 8, 6), new T.MeshStandardMaterial({ color: 0xe0b896, roughness: 0.7 }));
  V.helm = mk(new T.SphereGeometry(0.3, 8, 6, 0, TAU, 0, 1.4), new T.MeshStandardMaterial({ color: 0x9aa0a8, metalness: 0.6, roughness: 0.35 }));
  V.horse = mk(new T.BoxGeometry(1.9, 0.9, 0.6), new T.MeshStandardMaterial({ color: 0x5a3a24, roughness: 0.8 })); V.hhead = mk(new T.BoxGeometry(0.7, 0.4, 0.35), new T.MeshStandardMaterial({ color: 0x4a2e1c, roughness: 0.8 }));
  V.spear = mk(new T.CylinderGeometry(0.04, 0.04, 3.2, 4), new T.MeshStandardMaterial({ color: 0x8a6a4a })); V.shield = mk(new T.BoxGeometry(0.12, 0.8, 0.6), new T.MeshStandardMaterial({ roughness: 0.5 }));
  V.bow = mk(new T.TorusGeometry(0.45, 0.04, 4, 10, Math.PI), new T.MeshStandardMaterial({ color: 0x6a4424 }));
  V.ring = new T.Mesh(new T.TorusGeometry(1, 0.12, 6, 40), new T.MeshBasicMaterial({ color: 0xffe08a })); V.ring.rotation.x = -Math.PI / 2; V.S.add(V.ring);
  V.arrowG = new T.BufferGeometry(); V.arrowP = new Float32Array(40 * 6 * 3); V.arrowG.setAttribute('position', new T.BufferAttribute(V.arrowP, 3)); V.arrows = new T.LineSegments(V.arrowG, new T.LineBasicMaterial({ color: 0x2a1a10 })); V.arrows.frustumCulled = false; V.S.add(V.arrows);
  W3.setQuality(stepN); return V; }
// the field for this battle: the ground with its hills, woods, a river of a stream at the edge, a few farm walls
function buildField(V, g) { const T = THREE, P = PLACES[g.place]; if (V.field) { V.S.remove(V.field); V.field.traverse(o => { if (o.geometry) o.geometry.dispose(); }); } const F = new T.Group(); V.field = F; V.S.add(F);
  const N3 = new T.ImprovedNoise(), base = new T.Color(P.ground);
  const tr = W3.terrain({ size: 900, seg: 120, x: 0, z: 0, height: (x, z) => { const out = Math.max(0, Math.max(Math.abs(x) - FW - 8, Math.abs(z) - FZ - 10)); return hillH(g, x, z) + N3.noise(x * 0.05, 0.3, z * 0.05) * 0.6 + Math.min(40, out * out * 0.02); },
    colour: (x, z, h) => { const n = N3.noise(x * 0.1, 1.3, z * 0.1) * 0.5 + 0.5; return [base.r * (0.85 + n * 0.25) + h * 0.01, base.g * (0.85 + n * 0.2) + h * 0.01, base.b * (0.85 + n * 0.2)]; }, map: W3.grainTex(256, 11, 200, 40, 6) });
  const trees = []; for (const w of g.woods) for (let i = 0; i < w.r * w.r * 0.9; i++) { const a = Math.random() * TAU, r = Math.sqrt(Math.random()) * w.r; trees.push({ x: w.x + Math.cos(a) * r, z: w.z + Math.sin(a) * r, y: hillH(g, w.x, w.z) - 0.2, s: 0.8 + Math.random() * 0.6, hue: Math.random(), shade: Math.random() * 0.5 }); }
  for (let i = 0; i < 300; i++) { const x = (Math.random() - 0.5) * 400, z = (Math.random() - 0.5) * 400; if (Math.abs(x) < FW + 14 && Math.abs(z) < FZ + 16) continue; trees.push({ x, z, y: 0, s: 1 + Math.random(), hue: Math.random(), shade: Math.random() * 0.5 }); } if (trees.length) W3.pines(trees, { layers: 3 });
  // lines on the grass where each army stands at first (a faint chalk mark), and a field edge of hedges
  const hedgeM = new T.MeshStandardMaterial({ color: 0x3a5a2a, roughness: 1 }); for (const sx of [-1, 1]) { const h = new T.Mesh(new T.BoxGeometry(1.2, 1.2, FZ * 2 + 20), hedgeM); h.position.set(sx * (FW + 6), 0.6, 0); F.add(h); }
  for (const [, b] of V.banners) V.S.remove(b); V.banners.clear(); }
function banner(V, u, g) { let b = V.banners.get(u.id); if (b) return b; const T = THREE, grp = new T.Group(), col = u.side === 0 ? g.banner.col : RED;
  const pole = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 4.6, 5), new T.MeshStandardMaterial({ color: 0x5a3a20 })); pole.position.y = 2.3; grp.add(pole);
  const flag = new T.Mesh(new T.PlaneGeometry(1.6, 1.0), new T.MeshStandardMaterial({ color: col, side: T.DoubleSide, roughness: 0.7 })); flag.position.set(0.8, 4.0, 0); grp.add(flag);
  const key = u.type + u.side; if (!V.icons[key]) V.icons[key] = new T.SpriteMaterial({ map: iconTex(UT[u.type].icon, u.side === 0 ? hex(col) : '#a02020'), depthTest: false }); const ic = new T.Sprite(V.icons[key]); ic.scale.setScalar(2.6); ic.position.y = 6.2; ic.renderOrder = 5; grp.add(ic);
  grp.userData = { flag }; V.S.add(grp); V.banners.set(u.id, b = grp); return b; }
const MM = new (window.THREE ? THREE.Matrix4 : Object)(), QQ = new (window.THREE ? THREE.Quaternion : Object)(), PP = new (window.THREE ? THREE.Vector3 : Object)(), SC = new (window.THREE ? THREE.Vector3 : Object)(1, 1, 1), CC = new (window.THREE ? THREE.Color : Object)(), YAX = new (window.THREE ? THREE.Vector3 : Object)(0, 1, 0);
// place every soldier of every unit in its ranks (or scattered, running)
function syncUnits(V, g, t) { const n = { body: 0, head: 0, helm: 0, horse: 0, hhead: 0, spear: 0, shield: 0, bow: 0 };
  const put = (m, x, y, z, rot, sx = 1, sy = 1, sz = 1, col) => { if (n[m] >= V.MAX) return; QQ.setFromAxisAngle(YAX, rot); PP.set(x, y, z); SC.set(sx, sy, sz); MM.compose(PP, QQ, SC); V[m].setMatrixAt(n[m], MM); if (col != null) { CC.setHex(col); V[m].setColorAt(n[m], CC); } n[m]++; };
  const seen = new Set();
  for (const u of g.units) { if (u.gone) continue; seen.add(u.id); const U = UT[u.type], horse = !!U.charge, sp = horse ? 1.9 : 1.25, cols = Math.max(2, Math.ceil(Math.sqrt(u.n0 * (horse ? 1 : 1.6)))), col = u.side === 0 ? g.banner.col : RED, rot = -u.face, fx = Math.cos(u.face), fz = Math.sin(u.face), rx = -fz, rz = fx, moving = u.order || u.tgt;
    for (let i = 0; i < u.n; i++) { const r = Math.floor(i / cols), c = i % cols, w = (Math.min(cols, u.n) - 1) / 2; let lx = (c - w) * sp, lz = -r * sp * 1.1;
      if (u.rout) { lx += Math.sin(i * 7.3 + t * 3) * 2.5; lz += Math.cos(i * 3.1) * 3; } else if (u.fight > 0) { lx += Math.sin(t * 9 + i) * 0.25; lz += Math.sin(t * 7 + i * 2) * 0.35; }
      const x = u.x + rx * lx + fx * lz * 1, z = u.z + rz * lx + fz * lz, y = hillH(g, x, z), bob = moving || u.rout ? Math.abs(Math.sin(t * (horse ? 10 : 7) + i)) * 0.18 : 0, srot = u.rout ? rot + Math.PI : rot;
      if (horse) { put('horse', x, y + 1.0 + bob, z, srot, 1, 1, 1); put('hhead', x + fx * 1.05 * (u.rout ? -1 : 1), y + 1.55 + bob, z + fz * 1.05 * (u.rout ? -1 : 1), srot); put('body', x, y + 1.95 + bob, z, srot, 0.85, 0.75, 0.85, col); put('head', x, y + 2.6 + bob, z, srot); put('helm', x, y + 2.66 + bob, z, srot);
        if (u.type === 'knight') put('spear', x + fx * 0.8, y + 2.1 + bob, z + fz * 0.8, srot, 1, 1, 1); }
      else { put('body', x, y + 0.65 + bob, z, srot, 1, 1, 1, col); put('head', x, y + 1.5 + bob, z, srot); if (u.type !== 'archer' && u.type !== 'xbow') put('helm', x, y + 1.56 + bob, z, srot);
        if (u.type === 'spear') { put('spear', x + rx * 0.3 + fx * 0.6, y + 1.4 + bob, z + rz * 0.3 + fz * 0.6, srot, 1, 1, 1); put('shield', x + fx * 0.35, y + 0.75 + bob, z + fz * 0.35, srot, 1, 1, 1, col); }
        if (u.type === 'sword') put('shield', x + fx * 0.35, y + 0.75 + bob, z + fz * 0.35, srot, 1, 1, 1, col);
        if (u.type === 'archer' || u.type === 'xbow') put('bow', x + rx * 0.35, y + 1.0 + bob, z + rz * 0.35, srot + Math.PI / 2, 1, 1, 1); } }
    const b = banner(V, u, g); b.visible = !u.rout; b.position.set(u.x - fx * (Math.ceil(u.n / cols) * sp * 0.6), hillH(g, u.x, u.z), u.z - fz * (Math.ceil(u.n / cols) * sp * 0.6)); b.userData.flag.rotation.y = Math.sin(t * 2 + u.id) * 0.3; }
  for (const [id, b] of V.banners) if (!seen.has(id)) { V.S.remove(b); V.banners.delete(id); }
  for (const m in n) { V[m].count = n[m]; V[m].instanceMatrix.needsUpdate = true; if (V[m].instanceColor) V[m].instanceColor.needsUpdate = true; }
  const su = g.sel && g.units.find(u => u.id === g.sel) || (g.pickD && g.units.find(u => u.id === g.pickD)); V.ring.visible = !!su; if (su) { V.ring.position.set(su.x, hillH(g, su.x, su.z) + 0.2, su.z); V.ring.scale.setScalar(R_(su) + 0.8 + Math.sin(t * 6) * 0.2); }
  // arrows in flight: little arcs
  const P = V.arrowP; let q = 0; for (const a of g.arrows) { const u = a.t / 0.6; for (let j = 0; j < 3; j++) { const uu = clamp(u - j * 0.05, 0, 1), x = a.x0 + (a.x1 - a.x0) * uu, z = a.z0 + (a.z1 - a.z0) * uu, y = 2 + Math.sin(uu * Math.PI) * 8; if (q < 40 * 6) { P.set([x, y, z, x + (a.x1 - a.x0) * 0.03, y - 0.3, z + (a.z1 - a.z0) * 0.03], q * 3); q += 2; } } }
  for (let i = q; i < 40 * 6; i++) P.set([0, -100, 0], i * 3); V.arrowG.attributes.position.needsUpdate = true; }
const SV = new (window.THREE ? THREE.Vector3 : Object)(), RV = new (window.THREE ? THREE.Vector3 : Object)();
function scr(x, y, z) { if (!V3 || V3.none) return { x: W / 2 + x * 6, y: H / 2 + z * 6, front: true }; SV.set(x, y, z); return W3.screen(SV); }
function groundAt(px, py) { if (!V3 || V3.none) return { x: (px - W / 2) / 6, z: (py - H / 2) / 6 }; const cam = W3.cam, r = cv.getBoundingClientRect(); RV.set((px - r.left) / r.width * 2 - 1, -((py - r.top) / r.height) * 2 + 1, 0.5).unproject(cam).sub(cam.position); if (RV.y > -1e-4) return null; const t = -cam.position.y / RV.y; return { x: cam.position.x + RV.x * t, z: cam.position.z + RV.z * t }; }
// ---------- events ----------
function onEvent(G, e) { const p = e.x != null ? scr(e.x, 2, e.z) : { x: W / 2, y: H / 2 }, cx = W / 2;
  switch (e.k) {
    case 'start': say(PLACES[G.place].name.toUpperCase(), cx, H * 0.2, '#ffffff', 22); say('THE ENEMY IS DRAWN UP', cx, H * 0.25, '#ffd0c4', 16); sfx.horn(0); if (G.N <= 2) tip('form', 'Pick a formation card, tap two of your units to swap them, then BATTLE!', 3.6); break;
    case 'form': sfx.click(); break; case 'swap': sfx.drum(); break;
    case 'battle': sfx.horn(1); say('TO BATTLE!', cx, H * 0.3, '#ffe08a', 34); FX.flash = 0.2; if (G.N <= 3) tip('orders', 'Tap one of your units, then tap the ground to send it, or tap an enemy to attack.', 3.6); break;
    case 'sel': sfx.click(); break; case 'reinf': sfx.horn(0); say('ENEMY REINFORCEMENTS!', W / 2, H * 0.22, '#ffb4a8', 20); break; case 'busy': sfx.no(); say('A RIDER IS ON HIS WAY', W / 2, H * 0.7, '#ffd0c4', 14); break; case 'order': sfx.hup(); break; case 'attack': sfx.hup(); say('CHARGE!', p.x, p.y - 20 * k, '#ffe08a', 16); break;
    case 'charge': sfx.thunder(); FX.shake = Math.max(FX.shake, 6); burst(p.x, p.y, '#d8c8a0', 10, 120); break;
    case 'flank': if (e.by === 0) { say(e.rear ? 'FROM BEHIND!' : 'FLANKED!', p.x, p.y - 30 * k, '#ffe08a', 18); sfx.flank(); } break;
    case 'volley': sfx.volley(); break;
    case 'fall': if (Math.random() < 0.3) burst(p.x, p.y, e.side === 0 ? '#9ab8ff' : '#ff9a8a', 3, 60); break;
    case 'rout': if (e.side === 1) { sfx.cheer(); say('THEY RUN!', p.x, p.y - 30 * k, '#9be3b5', 20); vibe(HAP.sharp); } else { sfx.groan(); say('OUR MEN BREAK!', p.x, p.y - 30 * k, '#ffb4a8', 18); FX.red = 0.4; if (G.N <= 5) tip('rally', 'A unit broke and runs. Sound the HORN to rally your army.', 3); } break;
    case 'wiped': break; case 'fled': break;
    case 'rally': sfx.horn(2); say('RALLY!', cx, H * 0.35, '#ffe08a', 30); FX.flash = 0.3; break;
    case 'lessonnext': if (e.first) hint = null; say('FIRST, A LESSON', cx, H * 0.3, '#ffe08a', 24); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, cx, H * 0.36, '#9be3b5', 22); sfx.cheer(); break;
    case 'lessonmiss': coachMiss(); break;
    case 'lessondone': say('NOW, THE REAL BATTLE!', cx, H * 0.3, '#ffe08a', 24); sfx.horn(1); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); vibe(HAP.best); say('VICTORY!', cx, H * 0.3, '#ffd040', 40); FX.flash = 0.5; break;
    case 'lost': sfx.lose(); say('DEFEAT', cx, H * 0.3, '#ffb4a8', 36); break;
  } }
// ---------- every frame ----------
function placeCam(g, dt) { const cam = W3.cam, asp = innerWidth / innerHeight; cam.fov = asp < 0.8 ? 64 : 48; cam.aspect = asp; cam.updateProjectionMatrix(); const sh = FX.shake ? (Math.random() - 0.5) * FX.shake * 0.05 : 0;
  // 22 Nov 2026 (the audit: soldiers were specks on a dark field with 40% of the screen empty): the camera frames the armies, not the whole valley, and eases as they move
  const C = placeCam.C || (placeCam.C = { x: 0, z: 4, d: 96, key: null }); let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, n = 0; for (const u of g.units) if (!u.gone && !u.rout) { x0 = Math.min(x0, u.x); x1 = Math.max(x1, u.x); z0 = Math.min(z0, u.z); z1 = Math.max(z1, u.z); n++; }
  if (!n) { x0 = -10; x1 = 10; z0 = -10; z1 = 10; } const hw = Math.max(13, (x1 - x0) / 2 + 7), hd = Math.max(15, (z1 - z0) / 2 + 9), tf = Math.tan(cam.fov * Math.PI / 360), full = asp < 0.8 ? 96 : 76;
  const want = Math.min(full, Math.max(hw / (tf * asp), hd * 0.73 / (tf * 0.6))), ease = C.key !== g ? 1 : 1 - Math.exp(-(dt || 0.016) * 1.4); C.key = g;
  C.x += (clamp((x0 + x1) / 2, -14, 14) - C.x) * ease; C.z += ((z0 + z1) / 2 + 2 - C.z) * ease; C.d += (want - C.d) * ease;
  const ky = asp < 0.8 ? 0.728 : 0.733, kz = asp < 0.8 ? 0.686 : 0.68; cam.position.set(C.x + sh, ky * C.d, C.z + kz * C.d); cam.lookAt(C.x, 0, C.z); cam.updateMatrixWorld(); }
let IG = null; function idleG() { if (!IG || IG.over) { IG = newGame(Math.max(2, store.get('level', 1) | 0), { seed: (Math.random() * 1e6) | 0 }); IG.mem = {}; } honest(IG, { react: 0.3, acc: 0.95 }, IG.mem); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function draw(now, dt) { ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#1a1a14'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D battlefield.', W / 2, H / 2); return; }
  const g = G || idleG(), t = now;
  if (V.key !== g) { V.key = g; W3.setSky(PLACES[g.place].sky, { azim: 120 }); buildField(V, g); }
  placeCam(g, dt); syncUnits(V, g, t); W3.setFocus(0, 0, 0, 80); W3.render(dt);
  if (G) overlay(G, t);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const q of TXT) { const al = q.t < 1.0 ? 1 : 1 - (q.t - 1.0) / 0.5; ctx.globalAlpha = Math.max(0, al); ctx.font = `400 ${Math.round(q.size * k)}px ${TF}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(20,14,6,.75)'; ctx.strokeText(q.txt, q.x, q.y - q.t * 18); ctx.fillStyle = q.col; ctx.fillText(q.txt, q.x, q.y - q.t * 18); } ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30;
    ctx.fillStyle = 'rgba(24,18,8,.9)'; rrect(W / 2 - w / 2, H * 0.62 - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.62 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,40,40,${FX.red * 0.15})`; ctx.fillRect(0, 0, W, H); } if (FX.flash > 0) { ctx.fillStyle = `rgba(255,250,235,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); } }
// unit bars, the order arrows, the formation cards, BATTLE, the horn
function overlay(G, t) { ui.btn = []; const sel = G.units.find(u => u.id === G.sel);
  for (const u of G.units) { if (u.gone || u.rout) continue; const p = scr(u.x, 7.6, u.z), w = 26 * k, f = u.n / u.n0; ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(p.x - w / 2, p.y, w, 5 * k); ctx.fillStyle = u.morale > 60 ? '#7af0a0' : u.morale > 30 ? '#ffd040' : '#ff6a5a'; ctx.fillRect(p.x - w / 2, p.y, w * f, 5 * k); if (u.side === 0 && u.cd > 0) { ctx.font = `${Math.round(12 * k)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('⏳', p.x + w / 2 + 8 * k, p.y + 3 * k); }
    const go = u.side === 0 && (u.order || u.tgt) ? (u.tgt ? G.units.find(q => q.id === u.tgt) : u.order) : null; if (go && G.phase === 'battle') { const a = scr(u.x, 0.5, u.z), b = scr(go.x, 0.5, go.z); ctx.strokeStyle = u.tgt ? 'rgba(255,120,90,.7)' : 'rgba(255,240,180,.55)'; ctx.lineWidth = 2.5 * k; ctx.setLineDash([6 * k, 6 * k]); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.setLineDash([]); } }
  if (!G.lesson) { const mine = men(G, 0), theirs = men(G, 1), x = 12, y = 48 * k, w = W - 24; ctx.fillStyle = 'rgba(24,18,8,.75)'; rrect(x, y, w, 30 * k, 10); ctx.fill(); ctx.font = `400 ${Math.round(15 * k)}px ${TF}`; ctx.textAlign = 'left'; ctx.fillStyle = hex(G.banner.col === 0x2a2a34 ? 0x8a8aa4 : G.banner.col); ctx.fillText(`YOURS ${mine}`, x + 10, y + 15 * k); ctx.textAlign = 'right'; ctx.fillStyle = '#ff7a6a'; ctx.fillText(`THEIRS ${theirs}`, x + w - 10, y + 15 * k);
    if (G.phase === 'battle' && G.reinf != null) { ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillStyle = G.reinf < 10 ? '#ff9a7a' : 'rgba(255,255,255,.8)'; ctx.fillText(`enemy reinforcements in ${Math.ceil(G.reinf)} s`, W / 2, y + 15 * k); }
    const tot = mine + theirs || 1; ctx.fillStyle = '#ff7a6a'; ctx.fillRect(x + 10, y + 26 * k, w - 20, 3 * k); ctx.fillStyle = '#7ab0ff'; ctx.fillRect(x + 10, y + 26 * k, (w - 20) * mine / tot, 3 * k); } else lessonPanel(G);
  if (G.phase === 'deploy') { const n = FORMS.length, bw = (W - 20 - (n - 1) * 6) / n, by = H - 170 * k; FORMS.forEach((f, i) => { const b = { x: 10 + i * (bw + 6), y: by, w: bw, h: 62 * k, id: 'form:' + f.id }; ui.btn.push(b); ctx.fillStyle = G.form === f.id ? 'rgba(255,224,138,.9)' : 'rgba(24,18,8,.8)'; rrect(b.x, b.y, b.w, b.h, 10); ctx.fill();
      ctx.fillStyle = G.form === f.id ? '#1a1206' : '#fff'; ctx.font = `400 ${Math.round(13 * k)}px ${TF}`; ctx.textAlign = 'center'; const ls = wrapText(f.name, bw - 8); ls.forEach((l, j) => ctx.fillText(l, b.x + b.w / 2, b.y + 20 * k + j * 15 * k)); });
    const F = FORMS.find(f => f.id === G.form); ctx.font = `700 ${Math.round(12.5 * k)}px ${BC}`; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText(F.desc, W / 2, by - 14 * k);
    const B = { x: 30, y: H - 96 * k, w: W - 60, h: 54 * k, id: 'battle' }; ui.btn.push(B); ctx.fillStyle = '#c8302a'; rrect(B.x, B.y, B.w, B.h, 14); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = `400 ${Math.round(26 * k)}px ${TF}`; ctx.fillText('⚔ BATTLE!', W / 2, B.y + B.h / 2 + 2); }
  else if (!G.over) { const r = 30 * k, b = { x: W - 2 * r - 16, y: H - 2 * r - 30 * k, w: 2 * r, h: 2 * r, id: 'horn' }; ui.btn.push(b); ctx.fillStyle = G.rally > 0 ? 'rgba(200,140,40,.9)' : 'rgba(80,70,50,.6)'; ctx.beginPath(); ctx.arc(b.x + r, b.y + r, r, 0, TAU); ctx.fill(); ctx.font = `${Math.round(26 * k)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText('📯', b.x + r, b.y + r + 2); ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.fillText(`RALLY ×${G.rally}`, b.x + r, b.y - 8 * k);
    if (sel) { ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; ctx.fillStyle = '#ffe08a'; if (G && G.lesson) ctx.fillText(`${UT[sel.type].name}: tap the ground, or an enemy`, W / 2, H - 40 * k); } else if (G.N <= 3 && G.bt < 12) { ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 4); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; ctx.fillStyle = '#fff'; if (G && G.lesson) ctx.fillText('tap one of your units', W / 2, H - 40 * k); ctx.globalAlpha = 1; } } }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of String(t).split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { coachPanel(G); }
