
// ===================== THE VIEW: Roach Run in 3D (three.js; light from tools/world3d.js) =====================
// The house at night from a cockroach's height (the world is in centimetres): table legs are towers, a crumb is a rock, the
// gap under the cupboards is a tunnel. The camera hangs a little above and behind you; at the start it looks out of the crack.
// A slipper is a shadow that darkens and grows, then the slipper itself; the spray can comes down from above and aims, then
// a yellow-green cloud hangs in the air. Your stash grows in the mouth of the crack.
const FX = { shake: 0, stop: 0, flash: 0, red: 0, slow: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { snap: true, cam: null, banner: null, drag: null, look: 0 };
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS || !(G && G.lesson)) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 160) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: 0.5 + Math.random() * 0.4, col, r: (1.5 + Math.random() * 2.5) * k }); } if (PARTS.length > 240) PARTS.splice(0, PARTS.length - 240); }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2.5); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.4) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (ui.banner) { ui.banner.t += dt; if (ui.banner.t > (ui.banner.secs || 1)) ui.banner = null; }
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; } }
function mySkin() { if (typeof HEADLESS !== 'undefined' && HEADLESS) return SKINS[0]; const id = store.get('skin', 'brown'); return SKINS.find(q => q.id === id) || SKINS[0]; }
const WX = x => x, WZ = z => -z;      // room (x, z) to the world: the room runs away from the camera (-z)
function canvasTex(w, h, fn, rep) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return t; }
const FLOORS = {
  kitchen: (g, w, h) => { for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { g.fillStyle = (x + y) % 2 ? '#d8d0bc' : '#a89c84'; g.fillRect(x * w / 2, y * h / 2, w / 2, h / 2); } g.strokeStyle = 'rgba(60,50,40,.5)'; g.lineWidth = 3; g.strokeRect(0, 0, w, h); g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke(); },
  bath: (g, w, h) => { g.fillStyle = '#c8dce0'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8aa4aa'; g.lineWidth = 2; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * w / 8, 0); g.lineTo(i * w / 8, h); g.moveTo(0, i * h / 8); g.lineTo(w, i * h / 8); g.stroke(); } },
  bed: (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = ['#8a5a34', '#9a6a40', '#7a4e2c', '#94643a'][i % 4]; g.fillRect(0, i * h / 8, w, h / 8); g.fillStyle = 'rgba(40,20,10,.5)'; g.fillRect(0, i * h / 8, w, 2); g.fillRect(((i * 37) % 8) * w / 8, i * h / 8, 2, h / 8); } },
  dining: (g, w, h) => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = ['#6a4024', '#7a4c2a', '#5e3820'][(x + y * 3) % 3]; g.save(); g.translate(x * w / 8, y * h / 8); if ((x + y) % 2) g.fillRect(0, 0, w / 8, h / 16), g.fillRect(0, h / 16, w / 8, h / 16); else g.fillRect(0, 0, w / 16, h / 8), g.fillRect(w / 16, 0, w / 16, h / 8); g.restore(); g.strokeStyle = 'rgba(30,15,5,.6)'; g.strokeRect(x * w / 8, y * h / 8, w / 8, h / 8); } } };
function buildWorld() {
  if (V3) return V3; const T = window.THREE; if (!T || !W3 || !W3.init({ canvas: $('gl'), fov: 55, far: 4000, near: 0.4 })) { V3 = { none: true }; return V3; }
  V3 = { T, S: W3.scene, built: null, t: 0 }; const V = V3;
  V.boxG = new T.BoxGeometry(1, 1, 1); V.sphG = new T.SphereGeometry(1, 16, 12); V.cylG = new T.CylinderGeometry(1, 1, 1, 20);
  V.roach = makeRoach(V); V.S.add(V.roach.g);
  V.lamp = new T.PointLight(0xffe2b0, 0, 0, 0); V.lamp.position.set(CX, 230, -RD / 2); V.S.add(V.lamp);
  V.pools = [0, 1, 2].map(() => { const L = new T.SpotLight(0xcfe0ff, 0, 0, 0.32, 0.5, 0); V.S.add(L); V.S.add(L.target); return L; });
  // threats
  V.shadow = new T.Mesh(new T.CircleGeometry(1, 32), new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, depthWrite: false })); V.shadow.rotation.x = -Math.PI / 2; V.S.add(V.shadow);
  V.slipper = makeSlipper(V); V.S.add(V.slipper); V.slipper.visible = false; V.lying = []; for (let i = 0; i < 3; i++) { const s = makeSlipper(V); s.visible = false; V.S.add(s); V.lying.push(s); }
  V.can = makeCan(V); V.can.visible = false; V.S.add(V.can);
  V.puffM = new T.MeshBasicMaterial({ color: 0xd8f070, transparent: true, opacity: 0.3, depthWrite: false }); V.puffs = []; for (let i = 0; i < 30; i++) { const p = new T.Mesh(V.sphG, V.puffM.clone()); p.visible = false; V.S.add(p); V.puffs.push(p); }
  V.people = [0, 1].map(i => { const p = makePerson(V, i); p.g.visible = false; V.S.add(p.g); return p; });
  // food: crumbs (lumps) and big pieces (a biscuit, cheese, bread), each with a soft glow under it
  V.crumbG = new T.DodecahedronGeometry(1, 0); V.crumbM = new T.MeshStandardMaterial({ color: 0xc8904a, roughness: 0.9 }); V.glowT = canvasTex(64, 64, (g, w, h) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,220,120,.9)'); gr.addColorStop(1, 'rgba(255,200,80,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  V.foodPool = []; V.home = new T.Group(); V.S.add(V.home);
  V.beacon = new T.Mesh(new T.PlaneGeometry(26, 26), new T.MeshBasicMaterial({ map: V.glowT, transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false })); V.beacon.rotation.x = -Math.PI / 2; V.beacon.position.set(CX, 0.3, 2); V.S.add(V.beacon);
  W3.setQuality(stepN); return V; }
function makeRoach(V) { const T = V.T, g = new T.Group(), body = new T.Group(); g.add(body);
  const shell = new T.MeshPhysicalMaterial({ color: mySkin().col, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.2 });
  const b = new T.Mesh(V.sphG, shell); b.scale.set(0.75, 0.42, 1.55); b.position.y = 0.62; b.castShadow = true; body.add(b);
  const pro = new T.Mesh(V.sphG, shell); pro.scale.set(0.62, 0.36, 0.5); pro.position.set(0, 0.6, 1.25); body.add(pro);
  const head = new T.Mesh(V.sphG, new T.MeshStandardMaterial({ color: 0x2a160a, roughness: 0.5 })); head.scale.set(0.34, 0.26, 0.3); head.position.set(0, 0.5, 1.7); body.add(head);
  const legM = new T.MeshStandardMaterial({ color: 0x3a200e, roughness: 0.6 }), legs = [];
  for (let i = 0; i < 6; i++) { const side = i % 2 ? 1 : -1, row = Math.floor(i / 2), L = new T.Group(); L.position.set(side * 0.55, 0.5, 0.7 - row * 0.75); const seg = new T.Mesh(V.cylG, legM); seg.scale.set(0.06, 1.2, 0.06); seg.position.set(side * 0.45, -0.25, 0); seg.rotation.z = side * 1.05; L.add(seg); body.add(L); legs.push({ L, side, row }); }
  const ants = [-1, 1].map(s => { const a = new T.Mesh(V.cylG, legM); a.scale.set(0.025, 2.6, 0.025); a.position.set(s * 0.45, 1.2, 2.9); a.rotation.set(1.05, 0, -s * 0.35); body.add(a); return a; });
  const pack = new T.Group(); pack.position.set(0, 1.0, -0.2); body.add(pack);
  const sh = new T.Mesh(new T.CircleGeometry(1.4, 20), new T.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.4, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.scale.set(0.8, 1.6, 1); sh.position.y = 0.06; g.add(sh);
  return { g, body, shell, legs, ants, pack }; }
function makeSlipper(V) { const T = V.T, g = new T.Group(), m = new T.MeshStandardMaterial({ color: 0x3a6ab8, roughness: 0.85 });
  const sole = new T.Mesh(V.boxG, new T.MeshStandardMaterial({ color: 0xe0d8c8, roughness: 0.9 })); sole.scale.set(10, 2, 27); sole.position.y = 1; g.add(sole); const top = new T.Mesh(V.sphG, m); top.scale.set(5.6, 4, 7); top.position.set(0, 3, 6); g.add(top); g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g; }
function makeCan(V) { const T = V.T, g = new T.Group(); const body = new T.Mesh(V.cylG, new T.MeshStandardMaterial({ map: canvasTex(128, 64, (c, w, h) => { c.fillStyle = '#d82a2a'; c.fillRect(0, 0, w, h); c.fillStyle = '#ffe040'; c.fillRect(0, 20, w, 24); c.fillStyle = '#1a1a1a'; c.font = '900 18px Arial'; c.textAlign = 'center'; c.fillText('BUG OFF', w / 2, 39); }), metalness: 0.5, roughness: 0.35 }));
  body.scale.set(3.6, 20, 3.6); g.add(body); const cap = new T.Mesh(V.cylG, new T.MeshStandardMaterial({ color: 0xf0f0f0 })); cap.scale.set(2.2, 3, 2.2); cap.position.y = 11.5; g.add(cap); const noz = new T.Mesh(V.boxG, new T.MeshStandardMaterial({ color: 0x222222 })); noz.scale.set(1, 1, 2); noz.position.set(0, 12.5, 1.4); g.add(noz);
  const hand = new T.Mesh(V.sphG, new T.MeshStandardMaterial({ color: 0xc68642, roughness: 0.6 })); hand.scale.set(5, 6, 4.5); hand.position.set(0, 3, -3); g.add(hand); return g; }
function makePerson(V, i) { const T = V.T, g = new T.Group(), trou = new T.MeshStandardMaterial({ color: [0x2a3a5a, 0x5a2a3a][i], roughness: 0.9 }), skin = new T.MeshStandardMaterial({ color: [0xc68642, 0x8d5524][i], roughness: 0.6 }), sl = new T.MeshStandardMaterial({ color: [0x3a6ab8, 0xb83a6a][i], roughness: 0.85 });
  const legs = [-1, 1].map(s => { const L = new T.Group(); L.position.set(s * 11, 0, 0); g.add(L); const shin = new T.Mesh(new T.CapsuleGeometry(6.5, 70, 4, 12), trou); shin.position.y = 48; shin.castShadow = true; L.add(shin);
    const ank = new T.Mesh(V.cylG, skin); ank.scale.set(4.5, 8, 4.5); ank.position.y = 8; L.add(ank); const foot = new T.Mesh(V.boxG, sl); foot.scale.set(11, 6, 28); foot.position.set(0, 3, 7); foot.castShadow = true; L.add(foot); return L; });
  return { g, legs }; }
// ---------- the room: built once per round ----------
function buildRoom(V, g) { const T = V.T, S = V.S;
  if (V.room) { S.remove(V.room); V.room.traverse(o => { if (o.geometry && ![V.boxG, V.sphG, V.cylG, V.crumbG].includes(o.geometry)) o.geometry.dispose(); }); }
  V.room = new T.Group(); S.add(V.room); V.built = g; const room = g.room;
  W3.setSky('night', { azim: 200 }); W3.scene.fog.near = 400; W3.scene.fog.far = 3000; W3.S.exposure = 0.85; W3.R.toneMappingExposure = 0.85; W3.scene.environmentIntensity = 0.2; W3.hemi.intensity = 0.35; W3.S.hemiI = 0.35; W3.sun.intensity = 0.35; W3.scene.children.forEach(o => { if (o.isLineSegments) o.visible = false; });
  V.lamp.intensity = g.lights.length ? 0.9 : 1.6; V.lamp.position.set(CX + 40, 230, -RD * 0.55);
  V.pools.forEach((L, i) => { const P = g.lights[i]; L.intensity = P ? 4 : 0; if (P) { L.position.set(P.x, 220, -P.z + 30); L.target.position.set(P.x, 0, -P.z); L.angle = Math.atan(P.r / 220) * 1.25; } });
  const B = (x, y, z, w, h, d, m, par = V.room) => { const ms = new T.Mesh(V.boxG, m); ms.scale.set(w, h, d); ms.position.set(x, y, z); ms.castShadow = true; ms.receiveShadow = true; par.add(ms); return ms; };
  const M = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.7 }, o));
  // the floor, the walls, the skirting (with your crack in it)
  const fl = new T.Mesh(new T.PlaneGeometry(RW + 400, RD + 400), new T.MeshStandardMaterial({ map: canvasTex(256, 256, FLOORS[room], [(RW + 400) / (room === 'bath' ? 40 : room === 'kitchen' ? 60 : 120), (RD + 400) / (room === 'bath' ? 40 : room === 'kitchen' ? 60 : 120)]), roughness: room === 'bath' ? 0.25 : 0.55, metalness: 0.02 }));
  fl.rotation.x = -Math.PI / 2; fl.position.set(CX, 0, -RD / 2); fl.receiveShadow = true; V.room.add(fl);
  const wallM = M({ kitchen: 0xe8dcc0, bath: 0xd8ecf0, bed: 0xc8b8d8, dining: 0xd8c8a8 }[room], { roughness: 0.9 });
  B(CX, 125, -RD - 2, RW + 4, 250, 4, wallM); B(-2, 125, -RD / 2, 4, 250, RD + 4, wallM); B(RW + 2, 125, -RD / 2, 4, 250, RD + 4, wallM);
  const skM = M(0xf4f0e8, { roughness: 0.5 }); B(CX, 5, -RD + 0.6, RW, 10, 1.2, skM); B(0.6, 5, -RD / 2, 1.2, 10, RD, skM); B(RW - 0.6, 5, -RD / 2, 1.2, 10, RD, skM);
  B(CX / 2 - 3.5, 5, -0.6, CX - 7, 10, 1.2, skM); B(CX + 3.5 + (RW - CX - 7) / 2, 5, -0.6, RW - CX - 7, 10, 1.2, skM); B(CX, 8, -0.6, 7, 4, 1.2, skM);
  B(CX, 6, 9, 30, 12, 14, M(0x0a0604, { roughness: 1 }));      // the dark inside of the crack
  // the furniture
  const wood = M(0x8a5a34, { roughness: 0.6 }), white = M(0xf2f2ee, { roughness: 0.35 }), dark = M(0x1a1410, { roughness: 1 });
  for (const it of g.items) { const x = it.x, z = it.z;
    if (it.kind === 'counter') { B(x + it.w / 2, 5, -(z + it.d - 2), it.w, 10, 4, dark); B(x + it.w / 2, 50, -(z + it.d / 2 + 5), it.w, 80, it.d - 10, M(0xd8e4ec, { roughness: 0.4 })); B(x + it.w / 2, 92, -(z + it.d / 2), it.w + 4, 4, it.d + 2, M(0x3a3430, { roughness: 0.3 })); for (let q = 0; q < it.w / 50; q++) B(x + 25 + q * 50, 60, -(z + 10.2), 40, 60, 0.6, M(0xc8d6e0, { roughness: 0.35 })); }
    if (it.kind === 'fridge') { B(x + it.w / 2, 92, -(z + it.d / 2), it.w, 176, it.d, white); B(x + it.w / 2, 2, -(z + 4), it.w - 6, 4, 3, dark); B(x + 8, 110, -(z - 1.5), 2, 50, 2, M(0x999999, { metalness: 0.8, roughness: 0.3 })); }
    if (it.kind === 'table' || it.kind === 'chair' || it.kind === 'nightstand') { const lw = it.kind === 'table' ? 6 : it.kind === 'nightstand' ? 5 : 4, top = it.h; for (const [a, b] of [[0, 0], [it.w, 0], [0, it.d], [it.w, it.d]]) B(x + a, top / 2, -(z + b), lw, top, lw, wood); B(x + it.w / 2, top + 2, -(z + it.d / 2), it.w + 8, 4, it.d + 8, wood);
      if (it.kind === 'chair') { B(x + it.w / 2, top + 25, -(z + it.d + 2), it.w + 4, 46, 3, wood); } if (it.kind === 'nightstand') B(x + it.w / 2, top - 15, -(z + it.d / 2), it.w, 26, it.d, wood); }
    if (it.kind === 'bin') { const c = new T.Mesh(V.cylG, M(0x5a6a7a, { metalness: 0.6, roughness: 0.35 })); c.scale.set(it.r, it.h, it.r); c.position.set(x, it.h / 2, -z); c.castShadow = true; V.room.add(c); }
    if (it.kind === 'shoe') { const s = makeSlipper(V); s.scale.setScalar(0.9); s.position.set(x, 0, -z); s.rotation.y = 0.6; V.room.add(s); }
    if (it.kind === 'tub') { B(x + it.w / 2, 30, -(z + it.d / 2 + 4), it.w, 52, it.d - 8, white); B(x + it.w / 2, 3, -(z + 9), it.w, 6, 2, dark); }
    if (it.kind === 'toilet' || it.kind === 'sink' || it.kind === 'basket' || it.kind === 'plant') { const c = new T.Mesh(V.cylG, it.kind === 'plant' ? M(0xb0603a) : it.kind === 'basket' ? M(0xc8a060, { roughness: 1 }) : white); c.scale.set(it.r, it.h, it.r); c.position.set(x, it.h / 2, -z); c.castShadow = true; V.room.add(c);
      if (it.kind === 'toilet') B(x, 50, -(z + 10), 40, 20, 50, white); if (it.kind === 'sink') { const bw = new T.Mesh(new T.SphereGeometry(28, 20, 10, 0, TAU, 0, Math.PI / 2), white); bw.rotation.x = Math.PI; bw.position.set(x, 92, -z); V.room.add(bw); }
      if (it.kind === 'plant') for (let q = 0; q < 9; q++) { const l = new T.Mesh(V.sphG, M(0x2f7a3a)); l.scale.set(5, 18, 2); l.position.set(x + Math.cos(q) * 8, it.h + 14, -z + Math.sin(q) * 8); l.rotation.set(Math.sin(q) * 0.6, q, Math.cos(q) * 0.6); V.room.add(l); } }
    if (it.kind === 'mat' || it.kind === 'rug') { const r = new T.Mesh(V.boxG, M(it.kind === 'mat' ? 0x6ab0c8 : 0xb84a3a, { roughness: 1 })); r.scale.set(it.w, it.kind === 'mat' ? 1.5 : 0.8, it.d); r.position.set(x + it.w / 2, 0.6, -(z + it.d / 2)); r.receiveShadow = true; V.room.add(r); }
    if (it.kind === 'box') { B(x, 6, -z, 24, 12, 13, M(0x7ab8e8)); B(x, 12.2, -z, 8, 0.6, 3, dark); }
    if (it.kind === 'bed') { for (const [a, b] of [[4, 4], [it.w - 4, 4], [4, it.d - 4], [it.w - 4, it.d - 4]]) B(x + a, 14, -(z + b), 8, 28, 8, wood); B(x + it.w / 2, 38, -(z + it.d / 2), it.w, 22, it.d, M(0xf0ece4)); B(x + it.w / 2, 46, -(z + it.d / 2 + 30), it.w + 6, 8, it.d - 50, M(0x6a7ac8, { roughness: 0.95 })); B(x + it.w / 2, 30, -(z + 1), it.w + 6, 34, 2, M(0x6a7ac8, { roughness: 0.95 })); }
    if (it.kind === 'wardrobe' || it.kind === 'sideboard') { B(x + it.w / 2, it.h / 2 + 4, -(z + it.d / 2 + 4), it.w, it.h, it.d - 8, wood); for (const [a, b] of [[4, 4], [it.w - 4, 4]]) B(x + a, 2, -(z + b + 4), 5, 6, 5, dark); } }
  // the food and the stash
  V.foodFor = null; V.stashN = -1; V.home.clear(); ui.snap = true; ui.look = 0; V.roach.shell.color.setHex(mySkin().col); }
function foodMesh(V, f) { const T = V.T, g = new T.Group(); const glow = new T.Mesh(new T.PlaneGeometry(f.big ? 22 : 10, f.big ? 22 : 10), new T.MeshBasicMaterial({ map: V.glowT, transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false, opacity: 0.7 })); glow.rotation.x = -Math.PI / 2; glow.position.y = 0.2; g.add(glow);
  if (f.big) { const kind = f.id % 3; const m = new T.Mesh(kind === 0 ? new T.CylinderGeometry(5, 5, 1.6, 18) : kind === 1 ? new T.CylinderGeometry(5.5, 5.5, 3.6, 3) : V.boxG, new T.MeshStandardMaterial({ color: [0xc88a40, 0xf0c840, 0xe0b880][kind], roughness: 0.85 })); if (kind === 2) m.scale.set(7, 4, 5); m.position.y = kind === 0 ? 0.8 : 1.9; m.castShadow = true; g.add(m); if (kind === 0) for (let q = 0; q < 5; q++) { const ch = new T.Mesh(V.sphG, new T.MeshStandardMaterial({ color: 0x3a2010 })); ch.scale.setScalar(0.7); ch.position.set(Math.cos(q * 1.3) * 3, 1.7, Math.sin(q * 1.3) * 3); g.add(ch); } }
  else { const m = new T.Mesh(V.crumbG, V.crumbM); const s = 1.0 + (f.id % 3) * 0.25; m.scale.set(s, s * 0.7, s * 1.2); m.position.y = s * 0.6; m.rotation.set(f.id, f.id * 2, 0); m.castShadow = true; g.add(m); }
  return g; }
// ---------- each frame ----------
function sync(V, g, dt) { const m = g.me, T = V.T; V.t += dt;
  // the roach: faces where it runs; legs scuttle; what it carries sits on its back
  const R = V.roach, sp = Math.hypot(m.vx, m.vz); R.g.position.set(m.x, 0, -m.z); if (sp > 2) { const want = Math.atan2(m.vx, -m.vz); let d = want - R.g.rotation.y; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; R.g.rotation.y += d * Math.min(1, dt * 14); }
  R.g.visible = !m.hidden || Math.sin(V.t * 6) > 0.6; R.body.scale.setScalar(m.hidden ? 0.8 : 1); const ph = V.t * (m.running ? 34 : 22) * Math.min(1, sp / 20); R.legs.forEach(L => L.L.rotation.y = Math.sin(ph + (L.row + (L.side > 0 ? 1 : 0)) * Math.PI) * 0.5 * Math.min(1, sp / 10)); R.ants.forEach((a, i) => a.rotation.z = (i ? 0.35 : -0.35) + Math.sin(V.t * 5 + i) * 0.12);
  R.body.position.y = sp > 2 ? Math.abs(Math.sin(ph)) * 0.08 : 0; R.body.rotation.z = m.cough > 0 ? Math.sin(V.t * 30) * 0.1 * m.cough : 0;
  const sig = m.load.map(q => q.big ? 'B' : 'c').join(''); if (R.sig !== sig) { R.sig = sig; R.pack.clear(); let y = 0; m.load.forEach((q, i) => { if (q.big) { const b = new T.Mesh(new T.CylinderGeometry(3.4, 3.4, 1.2, 14), new T.MeshStandardMaterial({ color: 0xc88a40, roughness: 0.85 })); b.position.set(0, y + 0.8, 0); b.rotation.x = 0.15; R.pack.add(b); y += 1.4; } else { const c = new T.Mesh(V.crumbG, V.crumbM); c.scale.setScalar(0.8); c.position.set((i % 2 - 0.5) * 0.6, y + 0.5, (i % 3 - 1) * 0.5); R.pack.add(c); y += 0.55; } }); }
  // the food
  if (V.foodFor !== g || V.foodN !== g.fid + g.food.length) { V.foodFor = g; V.foodN = g.fid + g.food.length; for (const f of V.foodPool) V.room.remove(f.g); V.foodPool = g.food.map(f => { const fg = foodMesh(V, f); fg.position.set(f.x, 0, -f.z); V.room.add(fg); return { f, g: fg }; }); }
  for (const q of V.foodPool) { q.g.children[0].material.opacity = 0.45 + 0.3 * Math.sin(V.t * 3 + q.f.id); }
  if (V.stashN !== g.stash) { V.stashN = g.stash; V.home.clear(); for (let i = 0; i < Math.min(30, g.stash); i++) { const c = new T.Mesh(V.crumbG, V.crumbM); const a = i * 2.4, r = 1.5 + Math.sqrt(i) * 1.2; c.scale.setScalar(1.1); c.position.set(CX + Math.cos(a) * r, 0.8 + Math.floor(i / 9) * 1.2, 4 + Math.sin(a) * r * 0.6); V.home.add(c); } }
  V.beacon.material.opacity = m.load.length ? 0.7 + 0.3 * Math.sin(V.t * 5) : 0.25;
  // the people's legs
  V.people.forEach((P, i) => { const p = g.people[i]; P.g.visible = !!p; if (!p) return; P.g.position.set(p.x, 0, -p.z); P.g.rotation.y = Math.atan2(m.x - p.x, -(m.z - p.z)) * 0 + (p.walk ? Math.atan2(p.tx - p.x, -(p.tz - p.z)) : Math.PI + 0.3 * i); P.legs.forEach((L, j) => L.rotation.x = p.walk ? Math.sin(p.step * 6 + j * Math.PI) * 0.25 : 0); });
  // the slipper coming: its shadow darkens and grows; it falls in the last moment; landed ones lie there
  const s = g.slips.find(q => !q.land); V.shadow.visible = !!s; V.slipper.visible = false;
  if (s) { const f = clamp(s.t / s.T, 0, 1); V.shadow.position.set(s.x, 0.25, -s.z); V.shadow.scale.set(s.r * (1.8 - 0.8 * f), s.r * (2.4 - 1.0 * f), 1); V.shadow.material.opacity = 0.15 + 0.55 * f; if (f > 0.6) { V.slipper.visible = true; const y = 140 * Math.pow((1 - f) / 0.4, 2); V.slipper.position.set(s.x, y, -s.z - 8); V.slipper.rotation.set(-0.3 * (1 - f), 0.4, 0); } }
  const land = g.slips.filter(q => q.land); V.lying.forEach((L, i) => { const q = land[i]; L.visible = !!q && q.lt < 1.4; if (q) { L.position.set(q.x, q.lt > 1.1 ? (q.lt - 1.1) * 120 : 0, -q.z - 8); L.rotation.set(0, 0.4, 0); } });
  // the can: down from above, aiming
  const sp2 = g.sprays.find(q => q.t < q.raise + 0.9); V.can.visible = !!sp2; if (sp2) { const f = clamp(sp2.t / sp2.raise, 0, 1), y = 120 - 85 * Math.min(1, f * 1.6); V.can.position.set(sp2.ox + sp2.dx * 14, y, -(sp2.oz + sp2.dz * 14)); V.can.rotation.set(0, Math.atan2(sp2.dx, -sp2.dz), 0); V.can.rotateX(0.5 + 0.5 * f); if (sp2.t > sp2.raise) V.can.position.x += Math.sin(V.t * 50) * 0.4; }
  V.puffs.forEach((P, i) => { const q = g.puffs[i]; P.visible = !!q; if (q) { P.position.set(q.x, q.r * 0.5, -q.z); P.scale.set(q.r, q.r * 0.7, q.r); P.material.opacity = 0.32 * q.a; } });
  // the camera: out of the crack at the start, then a little above and behind
  const asp = innerWidth / innerHeight, portrait = asp < 0.8; ui.look = m.out ? Math.min(1, ui.look + dt * 1.6) : 0; const f = ui.look * ui.look * (3 - 2 * ui.look);
  const cx2 = clamp(m.x, 40, RW - 40), cz2 = m.z; const back = portrait ? 23 : 21, up = portrait ? 21 : 18;      /* 22 Nov 2026: a third closer (the roach was a speck on the floor) */
  const cpF = [cx2, up, -cz2 + back], clF = [cx2, 0, -cz2 - (portrait ? 17 : 15)], cpS = [CX, 4, 1.5], clS = [CX, 5, -90];
  const cp = cpS.map((v, i) => v + (cpF[i] - v) * f), cl = clS.map((v, i) => v + (clF[i] - v) * f);
  if (ui.snap || !ui.cam) { ui.cam = { p: cp.slice(), l: cl.slice() }; ui.snap = false; }
  const kk = Math.min(1, dt * 7); for (let i = 0; i < 3; i++) { ui.cam.p[i] += (cp[i] - ui.cam.p[i]) * kk; ui.cam.l[i] += (cl[i] - ui.cam.l[i]) * kk; }
  const cam = W3.cam, sh = FX.shake ? (Math.random() - 0.5) * FX.shake * 0.05 : 0; cam.fov = portrait ? 66 : 54; cam.aspect = asp; cam.updateProjectionMatrix();
  cam.position.set(ui.cam.p[0] + sh, ui.cam.p[1] + sh, ui.cam.p[2]); cam.lookAt(ui.cam.l[0], ui.cam.l[1], ui.cam.l[2]); cam.updateMatrixWorld(); W3.setFocus(m.x, 0, -m.z - 20, 160); }
const SV = window.THREE ? new THREE.Vector3() : null;
function scr(x, y, z) { if (!V3 || V3.none) return { x: W / 2, y: H / 2 }; SV.set(x, y, z); return W3.screen(SV); }
// ---------- what happens, seen and heard ----------
function onEvent(G, e) { const cx = W / 2;
  switch (e.k) {
    case 'start': case 'yard': ui.snap = true; ui.look = 0; ui.banner = { txt: G.lesson ? 'LESSON' : ROOMS[roomOf(G.N)].name.toUpperCase(), t: 0, secs: 1.4, col: '#ffb347' }; if (!G.lesson) say(`BRING HOME ${G.cfg.need} 🍞`, cx, H * 0.38, '#fff', 20); break;
    case 'out': sfx.skitter(); break;
    case 'take': sfx.crunch(e.big); vibe(HAP.tick); if (e.big) { say('BIG PIECE! (+3, SLOWER)', cx, H * 0.42, '#ffd080', 18); tip('big', 'Big pieces are worth 3 but slow you down. DROP it if you must run.', 3); } break;
    case 'home': sfx.stash(e.n); vibe(HAP.light); say(`+${e.v} 🍞 ${Math.min(G.stash, G.cfg.need)}/${G.cfg.need}`, cx, H * 0.36, '#80ff90', 26); burst(cx, H * 0.36, '#ffd080', 16); break;
    case 'drop': sfx.thud(); say('DROPPED!', cx, H * 0.42, '#fff', 18); break;
    case 'hide': sfx.tuck(); say(`HIDING ${e.name.toUpperCase()}`, cx, H * 0.42, '#b0d0ff', 16); break;
    case 'unhide': break;
    case 'tired': sfx.pant(); tip('tired', 'Out of breath! Walk, stop or hide to get your stamina back.', 2.6); break;
    case 'shadow': sfx.swish(); FX.red = 0.25; tip('shadow', 'A SHADOW! A slipper is coming where you were heading: turn away!', 2.6); break;
    case 'slap': sfx.slap(e.d); FX.shake = e.d < 30 ? 14 : 6; vibe(e.d < 30 ? HAP.heavy : HAP.light); break;
    case 'dodge': if (e.d < 18) { say('CLOSE ONE!', cx, H * 0.4, '#ffd040', 22); sfx.combo(2); } break;
    case 'can': sfx.shake(); tip('can', 'The SPRAY CAN! It sprays where it aims: get out of its line, under furniture, or HIDE.', 3); break;
    case 'hiss': sfx.hiss(); break;
    case 'cough': sfx.cough(); FX.red = 0.4; break;
    case 'caught': sfx.splat(e.why); FX.shake = 22; FX.red = 1; vibe(HAP.heavy); ui.banner = { txt: e.why === 'spray' ? 'SPRAYED!' : 'SPLAT!', t: 0, secs: 1.4, col: '#ff5a4a' }; break;
    case 'dawn': ui.banner = { txt: 'THE LIGHTS ARE ON!', t: 0, secs: 1.5, col: '#ffe080' }; FX.flash = 1; break;
    case 'won': sfx.win(); ui.banner = { txt: 'FEAST!', t: 0, secs: 1.5, col: '#80ff90' }; break;
    case 'lost': sfx.lose(); break;
    case 'lessonnext': hint = null; break;
    case 'lessonok': sfx.coin(e.n); say(`${e.n} / ${e.need}`, cx, H * 0.46, '#80ff90', 22); break;
    case 'lessonmiss': coachMiss(); sfx.no(); break;
    case 'lessondone': sfx.goal(); say('LESSON DONE!', cx, H * 0.4, '#80ff90', 28); burst(cx, H * 0.4, '#80ff90', 24); break;
  } }
let IG = null; function idleG() { if (!IG || IG.over) { IG = newGame(Math.max(6, store.get('level', 1) | 0), { seed: (Math.random() * 1e6) | 0 }); IG.mem = {}; ui.snap = true; } honest(IG, { react: 0.3, acc: 0.95 }, IG.mem); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#2a1a10'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D house.', W / 2, H / 2); if (G) hud(G, now); return; }
  const g = G || idleG(); if (V.built !== g || V.solidsFor !== g.solids) { buildRoom(V, g); V.solidsFor = g.solids; }
  sync(V, g, dt);
  W3.render(dt);
  if (G && !(G.over && !$('ovEnd').classList.contains('hidden'))) hud(G, now);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 0.9 ? 1 : 1 - (t2.t - 0.9) / 0.5; ctx.globalAlpha = Math.max(0, al); const sc = t2.t < 0.12 ? 1.3 - t2.t / 0.12 * 0.3 : 1; ctx.font = `400 ${Math.round(t2.size * k * sc)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(20,12,6,.7)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 20); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 20); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30, hy = H * 0.56;
    ctx.fillStyle = 'rgba(24,16,10,.9)'; rrect(W / 2 - w / 2, hy - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, hy - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,60,30,${FX.red * 0.2})`; ctx.fillRect(0, 0, W, H); }
  if (G && G.me && G.me.cough > 0.05) { const a = G.me.cough; const gr = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.7); gr.addColorStop(0, 'rgba(200,240,90,0)'); gr.addColorStop(1, `rgba(200,240,90,${a * 0.55})`); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,250,220,${FX.flash * 0.6})`; ctx.fillRect(0, 0, W, H); } }
// ---------- the 2D layer: the food bar, the night clock, the eye, the stick and the buttons ----------
function btnRects(G) { const b = 96 * k, s = 64 * k, m = G && G.me; return { run: null, hide: m && (m.hidden || hideNear(G)) ? { x: W - b - 16 - 4 * k, y: H - b - 28 * k - s - 18 * k, w: b + 8 * k, h: s } : null, drop: m && m.load.some(q => q.big) ? { x: W - b - 16 - s - 20 * k, y: H - s - 34 * k, w: s, h: s } : null }; }
function hud(G, now) { ctx.textBaseline = 'middle'; const m = G.me, c = G.cfg;
  if (G.lesson) lessonPanel(G);
  else { const x0 = 12, y0 = 62 * k, w = W - 24; ctx.fillStyle = 'rgba(24,16,10,.66)'; rrect(x0, y0 - 18 * k, w, 52 * k, 14 * k); ctx.fill();
    ctx.textAlign = 'left'; ctx.font = `400 ${Math.round(20 * k)}px ${TF}`; ctx.fillStyle = '#ffd080'; ctx.fillText(`🍞 ${Math.min(G.stash, c.need)}/${c.need}`, x0 + 10, y0 - 1 * k); ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = '#fff'; ctx.fillText(m.load.length ? `CARRYING ${loadOf(m)} · TAKE IT HOME` : 'TO YOUR CRACK', x0 + 10, y0 + 20 * k);
    // the night: the moon slides toward the dawn
    const bx = x0 + 150 * k, bw = w - 160 * k, f = clamp(G.clock / G.night, 0, 1); ctx.fillStyle = 'rgba(255,255,255,.15)'; rrect(bx, y0 - 6 * k, bw, 10 * k, 5 * k); ctx.fill(); ctx.fillStyle = f > 0.25 ? '#6a8ad8' : '#ffb347'; rrect(bx, y0 - 6 * k, bw * f, 10 * k, 5 * k); ctx.fill();
    ctx.textAlign = 'right'; ctx.fillStyle = f > 0.25 ? '#c8d8ff' : '#ffd080'; ctx.fillText(`🌙 ${Math.ceil(G.clock)} s TO DAWN`, bx + bw, y0 + 20 * k); }
  // the eye: how much they have noticed you
  const watch = Math.max(0, ...G.people.map(p => p.notice)); if (G.people.length && !G.lesson) { const x = 34 * k, y = (G.lesson ? 220 : 128) * k, r = 20 * k; ctx.fillStyle = 'rgba(24,16,10,.7)'; ctx.beginPath(); ctx.arc(x, y, r + 4, 0, TAU); ctx.fill();
    ctx.strokeStyle = watch > 0.7 ? '#ff5a4a' : watch > 0.35 ? '#ffb347' : '#ffffff'; ctx.lineWidth = 2.5 * k; ctx.beginPath(); ctx.ellipse(x, y, r * 0.85, r * (0.15 + 0.4 * watch), 0, 0, TAU); ctx.stroke(); ctx.fillStyle = ctx.strokeStyle; ctx.beginPath(); ctx.arc(x, y, r * 0.22 * (0.4 + watch), 0, TAU); ctx.fill();
    const cov = m.hidden || covered(G, m.x, m.z) || m.z < 4; ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.textAlign = 'left'; ctx.fillStyle = cov ? '#90ff9a' : lit(G, m.x, m.z) ? '#ffd040' : '#fff'; ctx.fillText(m.hidden ? 'HIDDEN' : cov ? 'UNDER COVER' : lit(G, m.x, m.z) ? 'IN THE LIGHT!' : 'IN THE OPEN', x + r + 10, y); }
  if (ui.banner) { const B = ui.banner, sc = B.t < 0.12 ? 1.25 - B.t / 0.12 * 0.25 : 1; ctx.textAlign = 'center'; ctx.font = `400 ${Math.round(34 * k * sc)}px ${TF}`; ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(20,12,6,.75)'; ctx.strokeText(B.txt, W / 2, H * 0.3); ctx.fillStyle = B.col || '#fff'; ctx.fillText(B.txt, W / 2, H * 0.3); }
  // a pointer to the nearest food (or home) when it is off the screen
  { const tgt = m.load.length && (loadOf(m) >= c.need - G.stash || loadOf(m) >= c.cap) ? { x: CX, z: 0 } : G.food.reduce((b, f) => !b || Math.hypot(f.x - m.x, f.z - m.z) < Math.hypot(b.x - m.x, b.z - m.z) ? f : b, null);
    if (tgt && m.out) { const p = scr(tgt.x, 2, -tgt.z); if (!p.front || p.x < 20 || p.x > W - 20 || p.y < 120 * k || p.y > H - 150 * k) { const cx2 = W / 2, cy2 = H * 0.55; let dx = p.x - cx2, dy = p.y - cy2; if (!p.front) { dx = -dx; dy = -dy; } const a = Math.atan2(dy, dx), R2 = Math.min(W, H) * 0.36; ctx.save(); ctx.translate(cx2 + Math.cos(a) * R2, cy2 + Math.sin(a) * R2 * 1.1); ctx.rotate(a); ctx.fillStyle = tgt.z === 0 && tgt.x === CX ? 'rgba(128,255,144,.85)' : 'rgba(255,208,128,.85)'; ctx.beginPath(); ctx.moveTo(16 * k, 0); ctx.lineTo(-8 * k, -10 * k); ctx.lineTo(-8 * k, 10 * k); ctx.closePath(); ctx.fill(); ctx.restore(); } } }
  // the stick
  if (ui.drag) { const d2 = ui.drag, R = 46 * k, dx = clamp(d2.x - d2.x0, -R, R), dy = clamp(d2.y - d2.y0, -R, R); ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(d2.x0, d2.y0, R, 0, TAU); ctx.stroke(); ctx.fillStyle = 'rgba(255,208,128,.6)'; ctx.beginPath(); ctx.arc(d2.x0 + dx, d2.y0 + dy, 22 * k, 0, TAU); ctx.fill(); }
  else if (!m.out && !G.over) { ctx.globalAlpha = 0.55 + 0.35 * Math.sin(now * 4); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(W * 0.24, H - 120 * k, 46 * k, 0, TAU); ctx.stroke(); ctx.font = `400 ${Math.round(13 * k)}px ${TF}`; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; if (G && G.lesson) ctx.fillText('PUSH TO RUN', W * 0.24, H - 120 * k); ctx.globalAlpha = 1; }
  // stamina: a ring round the stick (orange while sprinting, red when puffed), and HIDE, DROP
  const B = btnRects(G), st = m.stam / c.stam;
  if (ui.drag) { const d3 = ui.drag, R3 = 46 * k + 7 * k; ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 6 * k; ctx.beginPath(); ctx.arc(d3.x0, d3.y0, R3, 0, TAU); ctx.stroke(); ctx.strokeStyle = m.tired ? '#ff5a4a' : m.running ? '#ff9a30' : '#ffd080'; ctx.beginPath(); ctx.arc(d3.x0, d3.y0, R3, -Math.PI / 2, -Math.PI / 2 + TAU * st); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillText(m.tired ? 'OUT OF PUFF' : m.running ? 'SPRINTING' : 'PUSH ALL THE WAY TO SPRINT', clamp(d3.x0, 90 * k, W - 90 * k), d3.y0 + R3 + 14 * k); }
  for (const [key, txt, col] of [['hide', m.hidden ? 'COME OUT' : 'HIDE', '#5a8ad8'], ['drop', 'DROP', '#b86a2a']]) { const q = B[key]; if (!q) continue; ctx.fillStyle = col; ctx.globalAlpha = 0.9; rrect(q.x, q.y, q.w, q.h, 16 * k); ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; rrect(q.x, q.y, q.w, q.h, 16 * k); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.font = `400 ${Math.round(15 * k)}px ${TF}`; ctx.fillText(txt, q.x + q.w / 2, q.y + q.h / 2); }
  if (m.cough > 0.05) { ctx.fillStyle = 'rgba(24,16,10,.7)'; rrect(W / 2 - 70 * k, H * 0.66, 140 * k, 16 * k, 8 * k); ctx.fill(); ctx.fillStyle = '#c8f060'; rrect(W / 2 - 70 * k, H * 0.66, 140 * k * m.cough, 16 * k, 8 * k); ctx.fill(); ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillStyle = '#fff'; ctx.fillText('COUGH! GET OUT OF THE CLOUD', W / 2, H * 0.66 - 10 * k); } }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { coachPanel(G); }
