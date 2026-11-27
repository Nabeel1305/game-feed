// ===================== THE VIEW: Skydive (sideways; behind the jumper) =====================
// The land far below (fields and farms, islands in a blue sea, a mountain valley, a city of towers, a coast at sunset), the
// landing circle with its X, a windsock and flags; the plane flying on after you jump; gold rings to fall through; your
// jumper spread out or tucked head-down in freefall, then hanging under a bright canopy; the ring on the ground where you
// will land; after a landing the path you flew, drawn in the sky.
const FX = { shake: 0, stop: 0, flash: 0, red: 0, slow: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { snap: true, banner: null, stick: null, btn: {}, cam: null, yaw: 0, fov: 60 };
const optGuide = () => (typeof HEADLESS !== 'undefined' && HEADLESS) ? true : store.get('guide', true) !== false, optShake = () => store.get('shake', true) !== false;
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS || !(G && G.lesson)) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 160) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40 * k, t: 0, life: 0.5 + Math.random() * 0.4, col, r: (1.5 + Math.random() * 2.5) * k }); } if (PARTS.length > 240) PARTS.splice(0, PARTS.length - 240); }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2.5); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.4) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 200 * dt; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (ui.banner) { ui.banner.t += dt; if (ui.banner.t > (ui.banner.secs || 1.6)) ui.banner = null; }
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; } }
function mySkin() { if (typeof HEADLESS !== 'undefined' && HEADLESS) return SKINS[0]; const id = store.get('skin', 'red'); return SKINS.find(q => q.id === id) || SKINS[0]; }
function buildWorld() {
  if (V3) return V3; const T = window.THREE; if (!T || !W3 || !W3.init({ canvas: $('gl'), fov: 60, far: 12000, near: 0.5, dims: () => [W, H] })) { V3 = { none: true }; return V3; }
  V3 = { T, S: W3.scene, t: 0, for: null, items: [] }; const V = V3, M = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.8 }, o)); V.M = M;
  V.sphG = new T.SphereGeometry(1, 14, 10); V.boxG = new T.BoxGeometry(1, 1, 1); V.cylG = new T.CylinderGeometry(1, 1, 1, 10);
  V.me = makeJumper(V); V.S.add(V.me.g);
  V.plane = makePlane(V); V.S.add(V.plane);
  V.guide = new T.Mesh(new T.RingGeometry(3.2, 4.6, 32).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false })); V.S.add(V.guide);
  V.shadow = new T.Mesh(new T.CircleGeometry(1.6, 16).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3, depthWrite: false })); V.S.add(V.shadow);
  V.ringG = new T.TorusGeometry(1, 0.08, 8, 40); V.ringG.rotateX(Math.PI / 2); V.rings = []; V.pathL = null;
  W3.setQuality(stepN); return V; }
function makeJumper(V) { const T = V.T, M = V.M, sk = mySkin(), g = new T.Group(), suit = M(sk.col, { roughness: 0.6 }), dark = M(0x222428), skin = M(0x8d5a3a);
  const body = new T.Group(); g.add(body);
  const torso = new T.Mesh(V.boxG, suit); torso.scale.set(0.5, 0.75, 0.3); body.add(torso);
  const head = new T.Mesh(V.sphG, M(0xf0f0f0, { roughness: 0.3 })); head.scale.setScalar(0.2); head.position.y = 0.55; body.add(head);
  const pack = new T.Mesh(V.boxG, dark); pack.scale.set(0.42, 0.55, 0.16); pack.position.set(0, 0.05, -0.22); body.add(pack);
  const limb = (x, y, len, m) => { const pv = new T.Group(); pv.position.set(x, y, 0); const l = new T.Mesh(V.boxG, m); l.scale.set(0.14, len, 0.14); l.position.y = -len / 2; pv.add(l); body.add(pv); return pv; };
  const aL = limb(-0.3, 0.3, 0.65, suit), aR = limb(0.3, 0.3, 0.65, suit), lL = limb(-0.14, -0.38, 0.85, dark), lR = limb(0.14, -0.38, 0.85, dark);
  // the canopy: a curved wing of cells over the jumper, with lines
  const can = new T.Group(); const cA = M(sk.col, { side: T.DoubleSide, roughness: 0.7 }), cB = M(sk.col2, { side: T.DoubleSide, roughness: 0.7 });
  for (let i = 0; i < 9; i++) { const u = (i - 4) / 4, cell = new T.Mesh(V.boxG, i % 2 ? cB : cA); cell.scale.set(0.95, 0.35, 2.4); cell.position.set(u * 4.1, 6.2 - u * u * 1.1, 0); cell.rotation.z = -u * 0.45; can.add(cell); }
  const pts = []; for (let i = 0; i < 9; i++) { const u = (i - 4) / 4; for (const z of [-0.9, 0.9]) { pts.push(new T.Vector3(0, 0.6, 0), new T.Vector3(u * 4.1, 6.2 - u * u * 1.1 - 0.15, z)); } }
  can.add(new T.LineSegments(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: 0x333333, transparent: true, opacity: 0.6 }))); can.visible = false; g.add(can);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); g.scale.setScalar(1.3);
  return { g, body, aL, aR, lL, lR, can, skin: sk.id }; }
function makePlane(V) { const T = V.T, M = V.M, g = new T.Group(), w = M(0xf2f2ee, { roughness: 0.5 }), r = M(0xd03a2a);
  const f = new T.Mesh(V.cylG, w); f.scale.set(1.4, 14, 1.4); f.rotation.z = Math.PI / 2; g.add(f); const n = new T.Mesh(V.sphG, w); n.scale.set(1.6, 1.4, 1.4); n.position.x = 7; g.add(n);
  const wing = new T.Mesh(V.boxG, w); wing.scale.set(3, 0.25, 22); wing.position.set(1, 1, 0); g.add(wing); const tail = new T.Mesh(V.boxG, r); tail.scale.set(2, 3, 0.25); tail.position.set(-6.5, 2, 0); g.add(tail); const tw = new T.Mesh(V.boxG, w); tw.scale.set(1.6, 0.2, 7); tw.position.set(-6.5, 0.8, 0); g.add(tw);
  return g; }
// ---------- the place: built once per jump ----------
function buildPlace(V, G) { const T = V.T, R = rng(G.seed + 5), c = G.cfg, P = c.place, Tg = G.T;
  for (const o of V.items) { V.S.remove(o); if (o.geometry && o.geometry !== V.boxG && o.geometry !== V.cylG && o.geometry !== V.sphG) o.geometry.dispose(); } V.items = []; const add = o => { V.S.add(o); V.items.push(o); return o; };
  W3.setSky(PLACES[P].sky);
  const lin = v => Math.pow(clamp(v, 0, 1), 2.2);
  const col = (x, z, h, sl) => { const f = Math.floor(x / 70 + 100) + Math.floor(z / 55 + 100) * 3, u = Math.abs((Math.sin(f * 12.9898) * 43758.5453) % 1), d = Math.hypot(x - Tg.x, z - Tg.z);
    let c3; if (c.isl && h < 2) c3 = [0.9, 0.82, 0.6]; else if (c.mtn && h > 60) c3 = h > 230 ? [0.95, 0.96, 0.98] : [0.5 - sl * 0.1, 0.48 - sl * 0.1, 0.42]; else if (P === 3) c3 = [0.42 + u * 0.08, 0.42 + u * 0.08, 0.44];
    else { const F = [[0.38, 0.6, 0.24], [0.84, 0.74, 0.36], [0.28, 0.48, 0.2], [0.62, 0.7, 0.3], [0.74, 0.56, 0.34], [0.46, 0.66, 0.36]]; c3 = F[Math.floor(u * F.length) % F.length].slice(); const rx = Math.abs(((x + 2000) % 380) - 190), rz = Math.abs(((z + 2000) % 320) - 160); if (rx > 186 || rz > 156) c3 = [0.55, 0.53, 0.5]; else if ((Math.floor(x / 7) + Math.floor(z / 7)) % 2 && u > 0.5) c3 = c3.map(q => q * 0.93); }      /* a patchwork of fields in six colours, furrowed, with lanes between them (27 Nov 2026: "Substantially improve the scenery, terrain... and sense of height") */
    if (d < c.zone + 40 && !G.roof) c3 = [0.36, 0.62, 0.3];
    return c3.map(lin); };
  add(W3.terrain({ size: 3400, seg: 170, x: Tg.x, z: Tg.z, height: (x, z) => groundAt(G, x, z), colour: col }));
  if (c.isl) add(W3.water({ size: 6000, color: 0x1a5a8a, y: 0 }));
  // far below and far off: a wider, plainer land out to the horizon, and a ring of hills, so the ground never ends under you
  { const far = add(W3.terrain({ size: 14000, seg: 90, x: Tg.x, z: Tg.z, height: (x, z) => { const d = Math.hypot(x - Tg.x, z - Tg.z); return d < 1650 ? -30 : groundAt(G, x, z) * 0.6 - 4 + Math.max(0, d - 4500) * 0.06 * (1 + Math.sin(Math.atan2(z - Tg.z, x - Tg.x) * 7) * 0.5); }, colour: (x, z, h, sl) => { const q = Math.abs(Math.sin(Math.floor(x / 160) * 12.9898 + Math.floor(z / 140) * 78.233) * 43758.5453) % 1; return (h > 180 ? [0.55, 0.6, 0.66] : q < 0.5 ? [0.36, 0.56, 0.26] : [0.7, 0.66, 0.38]).map(lin); } })); far.position.y = 0; }
  // clouds: soft puffs at several heights, so you fall past them and feel the drop
  { const cc = document.createElement('canvas'); cc.width = cc.height = 128; const g2 = cc.getContext('2d'); for (let i = 0; i < 14; i++) { const x = 30 + Math.random() * 68, y = 44 + Math.random() * 40, r = 18 + Math.random() * 26, gr = g2.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g2.fillStyle = gr; g2.fillRect(0, 0, 128, 128); }
    const tex = new T.CanvasTexture(cc); tex.colorSpace = T.SRGBColorSpace; const cm = new T.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false, toneMapped: false, opacity: P === 3 ? 0.6 : 0.95 }), p0 = G.p;
    for (let i = 0; i < 70; i++) { const sp = new T.Sprite(cm), a = R() * TAU, d = 60 + R() * 1400, y = 350 + R() * 1400; sp.position.set(Tg.x + (p0.x - Tg.x) * R() + Math.cos(a) * d, y, Tg.z + (p0.z - Tg.z) * R() + Math.sin(a) * d); const sc = 120 + R() * 260; sp.scale.set(sc, sc * 0.55, 1); add(sp); } }
  // trees, houses, towers
  if (P !== 3) { const trees = []; for (let i = 0; i < 320; i++) { const x = Tg.x + (R() - 0.5) * 2200, z = Tg.z + (R() - 0.5) * 2200, y = groundAt(G, x, z); if (Math.hypot(x - Tg.x, z - Tg.z) < c.zone + 60 || (c.isl && y < 2) || y > 200) continue; trees.push({ x, y, z, s: 2 + R() * 2.2, rot: R() * 6, hue: R(), shade: R() }); } add(W3.pines(trees, { shadow: false })); }
  { const n = P === 3 ? 160 : 26, ms = [V.M(0xd8d4cc), V.M(0x9aa4b0), V.M(0xc8b8a0)]; for (let i = 0; i < n; i++) { const x = Tg.x + (R() - 0.5) * (P === 3 ? 1400 : 1800), z = Tg.z + (R() - 0.5) * (P === 3 ? 1400 : 1800), y = groundAt(G, x, z); if (Math.hypot(x - Tg.x, z - Tg.z) < c.zone + (P === 3 ? 30 : 80) || (c.isl && y < 2)) continue;
      const tall = P === 3 ? 12 + R() * 70 : 6, b = add(new T.Mesh(V.boxG, ms[i % 3])); b.scale.set(P === 3 ? 18 + R() * 14 : 10, tall, P === 3 ? 18 + R() * 14 : 8); b.position.set(x, y + tall / 2, z); b.rotation.y = P === 3 ? 0 : R() * 3; b.castShadow = P !== 3; if (P !== 3) { const r = add(new T.Mesh(new T.ConeGeometry(7, 4, 4), V.M(0xb04a3a))); r.position.set(x, y + 8, z); r.rotation.y = b.rotation.y + Math.PI / 4; } } }
  // the landing zone: a circle, rings, the X; on a roof, the building under it
  const gy = G.roof ? G.roof.h : groundAt(G, Tg.x, Tg.z), zg = new T.Group(); zg.position.set(Tg.x, gy + 0.3, Tg.z); add(zg);
  if (G.roof) { const b = add(new T.Mesh(V.boxG, V.M(0xb8bcc4))); b.scale.set(G.roof.half * 2, G.roof.h, G.roof.half * 2); b.position.set(Tg.x, G.roof.h / 2, Tg.z); b.castShadow = true; b.receiveShadow = true; const top = new T.Mesh(new T.PlaneGeometry(G.roof.half * 2, G.roof.half * 2).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: 0x5a6a5a })); top.position.y = -0.2; zg.add(top); }
  const zm = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, depthWrite: false }); zg.add(new T.Mesh(new T.RingGeometry(c.zone - 1.2, c.zone, 64).rotateX(-Math.PI / 2), zm));
  for (const f of [0.5, 0.2]) zg.add(new T.Mesh(new T.RingGeometry(c.zone * f - 0.6, c.zone * f, 48).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: 0xffe040, transparent: true, opacity: 0.8, depthWrite: false })));
  for (const a of [Math.PI / 4, -Math.PI / 4]) { const bar = new T.Mesh(new T.PlaneGeometry(Math.max(6, c.zone * 0.35), 1.6).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: 0xff3a2a })); bar.rotation.y = a; bar.position.y = 0.05; zg.add(bar); }
  // windsock and two flags by the zone (they show the wind down low)
  V.socks = []; for (const s of [0, 1]) { const a = s * 2.4 + 0.6, x = Tg.x + Math.cos(a) * (c.zone + 8), z = Tg.z + Math.sin(a) * (c.zone + 8), y = surfAt(G, x, z), g = new T.Group(); g.position.set(x, y, z); const pole = new T.Mesh(V.cylG, V.M(0xdddddd)); pole.scale.set(0.2, 9, 0.2); pole.position.y = 4.5; g.add(pole);
    const sock = new T.Mesh(new T.ConeGeometry(0.9, 4.2, 10, 1, true).rotateZ(Math.PI / 2), V.M(0xff7a1a, { side: T.DoubleSide })); sock.position.set(2.1, 8.6, 0); const sp = new T.Group(); sp.position.y = 0; sp.add(sock); g.add(sp); add(g); V.socks.push(sp); }
  if (V.pathL) { V.S.remove(V.pathL); V.pathL.geometry.dispose(); V.pathL = null; }
  buildRings(V, G); V.forR = G.rings; V.plane.userData = { t: 0, x: G.p.x, y: G.p.y + 4, z: G.p.z, a: G.p.yaw }; ui.snap = true; }
function buildRings(V, G) { const T = V.T; V.rings.forEach(r => { V.S.remove(r); r.material.dispose(); }); V.rings = G.rings.map(r => { const m = new T.Mesh(V.ringG, new T.MeshBasicMaterial({ color: 0xffd040, transparent: true, opacity: 0.95 })); m.scale.setScalar(r.r); m.position.set(r.x, r.y, r.z); V.S.add(m); return m; }); }
// ---------- each frame ----------
function sync(V, G, dt) { V.t += dt; const T = V.T, p = G.p, h = agl(G);
  if (V.for !== G.T) { V.for = G.T; buildPlace(V, G); }
  if (V.forR !== G.rings) { V.forR = G.rings; buildRings(V, G); }
  if (V.me.skin !== mySkin().id) { V.S.remove(V.me.g); V.me = makeJumper(V); V.S.add(V.me.g); }
  // the jumper: belly to earth and spread, tucked head-down, or hanging under the canopy
  const J = V.me, free = p.phase === 'free', op = p.phase === 'opening', can = p.phase === 'canopy' || p.phase === 'landed' && p.open > 0;
  J.g.position.set(p.x, p.y, p.z); J.g.rotation.set(0, -p.yaw + Math.PI / 2, 0);
  if (free) { const tk = G.tuck ? 1 : 0, tilt = Math.PI / 2 + tk * 0.9 + G.stick.y * 0.25; J.body.rotation.set(tilt, 0, -G.stick.x * 0.35); J.aL.rotation.z = lerp(-1.9, -0.3, tk); J.aR.rotation.z = lerp(1.9, 0.3, tk); J.lL.rotation.z = lerp(-0.45, -0.05, tk); J.lR.rotation.z = lerp(0.45, 0.05, tk); J.aL.rotation.x = J.aR.rotation.x = tk ? 0.3 : 0;
    if (G.tr) { const u = clamp(G.tr.t / G.tr.dur, 0, 1), e = u * u * (3 - 2 * u); if (G.tr.id === 'spin') J.g.rotation.y += e * TAU; else if (G.tr.id === 'barrel') J.body.rotation.z += e * TAU; else J.body.rotation.x += e * TAU * (G.tr.id === 'double' ? 2 : 1); J.aL.rotation.z = J.aR.rotation.z = 0; J.aL.rotation.z = -0.4; J.aR.rotation.z = 0.4; J.lL.rotation.z = J.lR.rotation.z = 0; } }
  else { J.body.rotation.set(G.flareOn ? 0.25 : 0, 0, -G.stick.x * 0.15); J.aL.rotation.z = -2.6; J.aR.rotation.z = 2.6; J.aL.rotation.x = J.aR.rotation.x = G.flareOn ? 0.9 : 0; J.lL.rotation.z = J.lR.rotation.z = 0; }
  J.can.visible = op || p.phase === 'canopy' || (p.phase === 'landed' && p.openAt > 0); if (op) J.can.scale.set(clamp(p.open / 0.9, 0.08, 1), clamp(p.open / 0.6, 0.15, 1), clamp(p.open / 0.9, 0.08, 1)); else J.can.scale.set(1, 1, 1); J.can.rotation.z = -G.stick.x * 0.25; J.can.rotation.x = G.flareOn ? -0.25 : 0;
  if (p.phase === 'landed') { J.can.rotation.x = Math.min(1.4, (J.can.rotation.x || 0) + dt * 1.2); }
  // the plane flies on
  { const pu = V.plane.userData; pu.t += dt; V.plane.visible = pu.t < 14 && !G.lesson; V.plane.position.set(pu.x + Math.cos(pu.a) * pu.t * 42, pu.y + pu.t * 2, pu.z + Math.sin(pu.a) * pu.t * 42); V.plane.rotation.set(0, -pu.a, 0.05); }
  // rings
  G.rings.forEach((r, i) => { const m = V.rings[i]; if (!m) return; m.material.color.setHex(r.done ? 0x60e070 : r.miss ? 0x888888 : 0xffd040); m.material.opacity = r.done || r.miss ? 0.35 : 0.95; m.rotation.y = V.t * 0.5; });
  // where you will land (under the canopy), and your shadow
  const s = surfAt(G, p.x, p.z); V.shadow.position.set(p.x, s + 0.2, p.z); V.shadow.scale.setScalar(clamp(1.5 - h / 300, 0.3, 1.5)); V.shadow.visible = h < 300;
  V.guide.visible = p.phase === 'canopy' && optGuide(); if (V.guide.visible) { const L = predictLand(G, p.yaw, Math.max(0, -G.stick.y)), ly = surfAt(G, L.x, L.z), d = Math.hypot(L.x - G.T.x, L.z - G.T.z), fl = h < 6.5 && h > 2.2; V.guide.position.set(L.x, ly + 0.4, L.z); V.guide.material.color.setHex(fl ? 0x40ff70 : d < G.cfg.zone * 0.2 ? 0xffe040 : d < G.cfg.zone ? 0xffffff : 0xff6a5a); V.guide.scale.setScalar(clamp(h / 30, 0.8, 4)); }
  for (const sp of V.socks || []) { const w = windAt(G, 5); sp.rotation.y = -Math.atan2(w.z, w.x); sp.scale.x = 0.5 + clamp(Math.hypot(w.x, w.z) / 7, 0, 1) * 0.6; }
  // after a landing: the path you flew
  if (p.phase === 'landed' && !V.pathL && G.path.length > 2) { V.pathL = new T.Line(new T.BufferGeometry().setFromPoints(G.path.map(q => new T.Vector3(q[0], q[1], q[2])).concat([new T.Vector3(p.x, p.y + 1, p.z)])), new T.LineBasicMaterial({ color: 0xffe040 })); V.S.add(V.pathL); }
  { const f = W3.scene.fog; if (f) { const hi = clamp(h / 1200, 0, 1); f.near = 200 + hi * 600; f.far = 1400 + hi * 4600; } }
  // the camera: behind the jumper, the horizon level; looking down more in freefall; above the zone after landing
  let want = p.yaw; if (p.phase === 'landed') want = ui.yaw; if (ui.snap) ui.yaw = want; let dy = want - ui.yaw; while (dy > Math.PI) dy -= TAU; while (dy < -Math.PI) dy += TAU; ui.yaw += dy * Math.min(1, dt * (free ? 1.8 : 2.4));
  if (!ui.look && (ui.lookYaw || ui.lookPit)) { const kb = Math.min(1, dt * 0.8); ui.lookYaw -= ui.lookYaw * kb; ui.lookPit -= ui.lookPit * kb; }      // let go: the view drifts back behind you
  const cyw = ui.yaw + (ui.lookYaw || 0), dir = [Math.cos(cyw), Math.sin(cyw)], lp = ui.lookPit || 0; let pos, tgt;
  if (p.phase === 'landed') { pos = [p.x - dir[0] * 40, p.y + 30, p.z - dir[1] * 40]; tgt = [p.x, p.y + 1, p.z]; }
  else if (free || op) { pos = [p.x - dir[0] * 13 * Math.cos(lp), p.y + 7 + 12 * Math.sin(lp), p.z - dir[1] * 13 * Math.cos(lp)]; tgt = [p.x + dir[0] * 30, p.y - 26 - 30 * lp, p.z + dir[1] * 30]; }
  else { pos = [p.x - dir[0] * 17, p.y + 6, p.z - dir[1] * 17]; tgt = [p.x + dir[0] * 34, p.y - 10, p.z + dir[1] * 34]; }
  pos[1] = Math.max(pos[1], surfAt(G, pos[0], pos[2]) + 3);
  if (!ui.cam || ui.snap) { ui.cam = { p: pos.slice(), l: tgt.slice() }; ui.snap = false; } const kc = Math.min(1, dt * (p.phase === 'landed' ? 1.2 : 5)); for (let i = 0; i < 3; i++) { ui.cam.p[i] += (pos[i] - ui.cam.p[i]) * kc; ui.cam.l[i] += (tgt[i] - ui.cam.l[i]) * kc; }
  // fast cameras: the follow is exact along the fall (no lag that lets the jumper drop out of view)
  if (p.phase !== 'landed') { ui.cam.p[1] = pos[1] + (ui.cam.p[1] - pos[1]) * 0.2; ui.cam.l[1] = tgt[1] + (ui.cam.l[1] - tgt[1]) * 0.2; }
  const sh = FX.shake > 0 && optShake() ? (Math.random() - 0.5) * FX.shake * 0.05 : 0, cam = W3.cam; cam.position.set(ui.cam.p[0] + sh, ui.cam.p[1] + sh, ui.cam.p[2]); cam.lookAt(ui.cam.l[0], ui.cam.l[1], ui.cam.l[2]);
  const fv = free ? 62 + (G.tuck ? 8 : 0) : 58; ui.fov += (fv - ui.fov) * Math.min(1, dt * 2); if (Math.abs(cam.fov - ui.fov) > 0.05) { cam.fov = ui.fov; cam.updateProjectionMatrix(); } cam.updateMatrixWorld();
  W3.setFocus(p.x, p.y, p.z, 60); }
function scrOf(x, y, z) { const V = V3; if (!V || V.none) return null; return W3.screen(new V.T.Vector3(x, y, z)); }
const meAt = G => scrOf(G.p.x, G.p.y + 2, G.p.z) || { x: W / 2, y: H * 0.45 };
// ---------- events ----------
function onEvent(G, e) {
  switch (e.k) {
    case 'trick': sfx.whoosh(); break;
    case 'trickdone': say(`${e.name}! +${e.pts}`, W / 2, H * 0.3, '#e0a0ff', 26); vibe(HAP.light); break;
    case 'notrick': say('TOO LOW FOR A TRICK', W / 2, H * 0.3, '#ffd0d0', 16); break;
    case 'open': sfx.open(); vibe(HAP.heavy); FX.shake = 10; { const h = e.h; say(h > DEPLOY[1] ? 'HIGH OPENING' : h >= DEPLOY[0] ? 'GOOD OPENING' : 'LOW!', W / 2, H * 0.3, h > DEPLOY[1] ? '#fff' : h >= DEPLOY[0] ? '#8fe0ab' : '#ffb0a0', 26); } break;
    case 'canopy': tip('canopy', 'Under the canopy: drag left or right to turn, pull back for brakes. The ring on the ground is where you will land.', 4); break;
    case 'aad': ui.banner = { txt: 'SAFETY OPENED IT!', sub: 'Open between the yellow marks next time (-200)', t: 0, secs: 2.2, small: true }; break;
    case 'deploycue': if (upLv('alti') || G.N <= 3) sfx.beep(); if (G.N <= 3 && !G.lesson) say('OPEN SOON: the yellow marks', W / 2, H * 0.36, '#ffe040', 20); break;
    case 'flarecue': if (upLv('alti')) sfx.beep(2); break;
    case 'flare': sfx.flare(); break;
    case 'autoflare': say('FLARE!', W / 2, H * 0.36, '#8fe0ab', 26); break;
    case 'ring': sfx.ring(e.n); vibe(HAP.light); say(`RING ${e.n}/${e.of}  +150`, W / 2, H * 0.3, '#ffe040', 26); burst(W / 2, H * 0.3, '#ffe040', 16, 140); break;
    case 'ringmiss': sfx.no(); say(`missed by ${Math.round(e.d)} m`, W / 2, H * 0.32, '#ffd0a0', 18); break;
    case 'touch': { vibe(e.q === 'soft' ? HAP.light : HAP.thud); sfx.touch(e.q); if (e.q === 'hard' || e.q === 'crash') FX.shake = 12;
      ui.banner = { txt: e.water ? 'SPLASH!' : e.street ? 'MISSED THE ROOF' : e.q === 'soft' ? 'SOFT LANDING!' : e.q === 'ok' ? 'LANDED' : 'HARD LANDING', sub: e.water || e.street ? '' : `${Math.round(e.d)} m from the X`, t: 0, secs: 1.6 };
      if (e.q === 'hard') tip('hard', 'Hard landing: hold FLARE just above the ground (about a house high), facing into the wind.', 4); } break;
    case 'again': ui.banner = { txt: 'NEXT JUMP', sub: 'Scenic: as long as you like', t: 0, secs: 1.4, small: true }; ui.snap = true; break;
    case 'lessonnext': if (e.first) hint = null; say('FIRST, A LESSON', W / 2, H * 0.36, '#ffd36a', 24); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, W / 2, H * 0.4, '#8fe0ab', 24); sfx.coin(e.n); break;
    case 'lessonmiss': coachMiss(); say('AGAIN', W / 2, H * 0.44, '#ffd0a0', 20); break;
    case 'lessondone': say('READY: YOUR JUMP!', W / 2, H * 0.36, '#ffd36a', 24); sfx.ring(5); ui.snap = true; if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); FX.flash = 0.5; vibe(HAP.best); break;
    case 'lost': sfx.lose(); break;      // (P11: never vibrate on failure)
  } }
// ---------- the picture ----------
let IG = null, IM = {}; function idleG() { if (!IG || IG.over || IG.t > 60) { IG = newGame(3 + ((Math.random() * 12) | 0), { seed: (Math.random() * 1e6) | 0 }); IM = {}; ui.snap = true; } honest(IG, { react: 0.3, acc: 0.95 }, IM); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#8ac0e8'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D sky.', W / 2, H / 2); if (G) hud(G, now); return; }
  const g = G || idleG(); sync(V, g, dt || 1 / 60); W3.render(dt || 1 / 60);
  if (FX.red > 0) { ctx.fillStyle = `rgba(200,40,30,${FX.red * 0.18})`; ctx.fillRect(0, 0, W, H); }
  if (G && !(G.over && !$('ovEnd').classList.contains('hidden'))) hud(G, now);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 1.1 ? 1 : 1 - (t2.t - 1.1) / 0.5; ctx.globalAlpha = Math.max(0, al); ctx.font = `400 ${Math.round(t2.size * 0.85 * k)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(20,30,50,.7)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 18); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 18); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, Math.min(W - 360 * k, 420 * k)), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30, hy = H - 56 * k - h / 2;
    ctx.fillStyle = 'rgba(20,30,50,.92)'; rrect(W / 2 - w / 2, hy - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, hy - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,250,230,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); } }
// ---------- the HUD: stick (left), the buttons (right), the altimeter, the wind, the X ----------
// (27 Nov 2026) the stick has one place (bottom left); TRICK sits above TUCK; anywhere else, a drag looks around
function layout(G) { return { a: { x: W - 74 * k, y: H - 80 * k, r: 52 * k }, b: { x: W - 190 * k, y: H - 66 * k, r: 40 * k }, c: { x: W - 190 * k, y: H - 158 * k, r: 36 * k }, s: { x: 100 * k, y: H - 96 * k, r: 62 * k }, alt: { x: W - 30 * k, y0: 70 * k, y1: H - 150 * k } }; }
function btnLabels(G) { const ph = G.p.phase; if (ph === 'free') return { a: 'CHUTE', as: 'tap', b: 'TUCK', bs: 'hold' }; if (ph === 'canopy' || ph === 'opening') return { a: 'FLARE', as: 'hold', b: '', bs: '' }; return { a: '', b: '' }; }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of String(t).split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function txt(s, x, y, col = '#fff', font, al = 'center') { ctx.textAlign = al; if (font) ctx.font = font; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(20,30,50,.7)'; ctx.strokeText(s, x, y); ctx.fillStyle = col; ctx.fillText(s, x, y); }
function button(B, on, label, sub, col, glow) { if (!label) return; ctx.globalAlpha = on ? 1 : 0.88; ctx.fillStyle = on ? col : 'rgba(20,30,50,.5)'; ctx.beginPath(); ctx.arc(B.x, B.y, B.r * (on ? 0.94 : 1), 0, TAU); ctx.fill(); ctx.strokeStyle = on || glow ? '#fff' : col; ctx.lineWidth = glow ? 5 : 3; ctx.stroke();
  txt(label, B.x, B.y - (sub ? 5 * k : 0), '#fff', `400 ${Math.round(B.r * 0.36)}px ${TF}`); if (sub) txt(sub, B.x, B.y + 15 * k, 'rgba(255,255,255,.8)', `700 ${Math.round(10 * k)}px ${BC}`); ctx.globalAlpha = 1; }
function hud(G, now) { ctx.textBaseline = 'middle'; const L = layout(G), p = G.p, h = agl(G), lab = btnLabels(G);
  // the altimeter: height above the ground, the yellow marks to open between, the flare band near the bottom
  { const A = L.alt, top = Math.max(G.cfg.alt, 900), Y = v => A.y1 - (A.y1 - A.y0) * clamp(Math.sqrt(Math.max(0, v) / top), 0, 1);
    ctx.fillStyle = 'rgba(20,30,50,.55)'; rrect(A.x - 12 * k, A.y0 - 10 * k, 24 * k, A.y1 - A.y0 + 20 * k, 10); ctx.fill();
    ctx.fillStyle = 'rgba(255,224,64,.85)'; ctx.fillRect(A.x - 11 * k, Y(DEPLOY[1]), 22 * k, Y(DEPLOY[0]) - Y(DEPLOY[1])); ctx.fillStyle = 'rgba(255,90,70,.7)'; ctx.fillRect(A.x - 11 * k, Y(AAD), 22 * k, 3);
    ctx.fillStyle = 'rgba(80,255,120,.8)'; ctx.fillRect(A.x - 11 * k, Y(6.5), 22 * k, Y(2.2) - Y(6.5));
    const y = Y(h); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(A.x - 16 * k, y); ctx.lineTo(A.x - 26 * k, y - 7 * k); ctx.lineTo(A.x - 26 * k, y + 7 * k); ctx.fill();
    txt(`${Math.round(h)} m`, A.x - 30 * k, y, h <= DEPLOY[1] && h >= DEPLOY[0] && p.phase === 'free' ? '#ffe040' : '#fff', `700 ${Math.round(13 * k)}px ${BC}`, 'right');
    txt(`${Math.round(-p.vy * 3.6)} km/h ↓`, A.x - 30 * k, y + 16 * k, 'rgba(255,255,255,.8)', `700 ${Math.round(10 * k)}px ${BC}`, 'right'); }
  // the wind (at your height), turned to your view: up the screen is the way you face
  { const w = windAt(G, h), s2 = Math.hypot(w.x, w.z), a = Math.atan2(w.z, w.x) - ui.yaw, x = 62 * k, y = 78 * k; ctx.fillStyle = 'rgba(20,30,50,.55)'; ctx.beginPath(); ctx.arc(x, y, 26 * k, 0, TAU); ctx.fill();
    ctx.save(); ctx.translate(x, y); ctx.rotate(a + Math.PI / 2); ctx.fillStyle = '#9fd8ff'; ctx.beginPath(); ctx.moveTo(0, -18 * k); ctx.lineTo(9 * k, 6 * k); ctx.lineTo(0, 1 * k); ctx.lineTo(-9 * k, 6 * k); ctx.fill(); ctx.restore();
    txt(`WIND ${s2.toFixed(0)} m/s`, x, y + 36 * k, '#fff', `700 ${Math.round(11 * k)}px ${BC}`);
    if (G.W.shiftH > 0 && h > G.W.shiftH && p.phase !== 'free') { txt(`turns below ${Math.round(G.W.shiftH)} m`, x, y + 50 * k, '#ffd36a', `700 ${Math.round(10 * k)}px ${BC}`); } }
  // the X: an arrow and the distance, or a marker on it
  { const T = G.T, d = Math.hypot(T.x - p.x, T.z - p.z), s = scrOf(T.x, surfAt(G, T.x, T.z) + 2, T.z);
    if (s && s.front && s.x > 30 && s.x < W - 90 * k && s.y > 30 && s.y < H - 20) { txt('✕', s.x, s.y - 18 * k, '#ff5a4a', `900 ${Math.round(16 * k)}px sans-serif`); txt(`${Math.round(d)} m`, s.x, s.y - 34 * k, '#fff', `700 ${Math.round(12 * k)}px ${BC}`); }
    else { let a = Math.atan2(T.z - p.z, T.x - p.x) - ui.yaw; while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; const ax = W / 2 + clamp(a / 1.2, -1, 1) * (W / 2 - 120 * k), ay = 40 * k; ctx.save(); ctx.translate(ax, ay); ctx.rotate(a); ctx.fillStyle = '#ff5a4a'; ctx.beginPath(); ctx.moveTo(0, -14 * k); ctx.lineTo(10 * k, 8 * k); ctx.lineTo(-10 * k, 8 * k); ctx.fill(); ctx.restore(); txt(`X ${Math.round(d)} m`, ax, ay + 20 * k, '#fff', `700 ${Math.round(12 * k)}px ${BC}`); } }
  if (G.lesson) lessonPanel(G);
  else if (G.rings.length) { txt(`◯ ${G.rings.filter(r => r.done).length}/${G.rings.length}${G.cfg.course ? ' · COURSE: fly every ring' : ''}`, W / 2, 16 * k, G.cfg.course ? '#ffd36a' : '#fff', `700 ${Math.round(13 * k)}px ${BC}`); }
  if (G.cfg.free && !G.lesson) txt(`SCENIC · jump ${(G.scenicN || 0) + 1}${G.scenicBest ? ` · best ${Math.round(G.scenicBest)} m` : ''}`, W / 2, 34 * k, '#fff', `700 ${Math.round(12 * k)}px ${BC}`);
  // the stick
  { const S = L.s, on = !!ui.stick, dx = G.stick.x * S.r * 0.85, dy = -G.stick.y * S.r * 0.85; ctx.globalAlpha = on ? 1 : 0.6; ctx.fillStyle = 'rgba(20,30,50,.4)'; ctx.beginPath(); ctx.arc(S.x, S.y, S.r, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2.5; ctx.stroke();      // the stick, in its one place
    ctx.fillStyle = on ? '#ffe040' : 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(S.x + dx, S.y + dy, 24 * k, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
  if (p.phase === 'free' && tricksOf(G).length) button(L.c, !!G.tr, G.tr ? G.tr.name.split(' ')[0] : 'TRICK', 'tap', '#c060ff');
  const inBand = p.phase === 'free' && h <= DEPLOY[1] && h >= DEPLOY[0] && Math.sin(now * 8) > 0, flareBand = p.phase === 'canopy' && h < 6.5 && h > 2.2;
  button(L.a, lab.a === 'FLARE' ? G.flareOn : false, lab.a, lab.as, lab.a === 'CHUTE' ? '#ff5a4a' : '#40c070', inBand || flareBand); button(L.b, G.tuck, lab.b, lab.bs, '#5aa0ff');
  if (ui.banner) banner(); }
function banner() { const b = ui.banner, a = Math.min(1, b.t / 0.2, ((b.secs || 1.6) - b.t) / 0.4); ctx.globalAlpha = Math.max(0, a); txt(b.txt, W / 2, H * 0.34, '#ffe040', `400 ${Math.round((b.small ? 28 : 38) * k)}px ${TF}`); if (b.sub) txt(b.sub, W / 2, H * 0.34 + 30 * k, '#fff', `700 ${Math.round(14 * k)}px ${BC}`); ctx.globalAlpha = 1; }
function lessonPanel(G) { coachPanel(G); }
