// ===================== THE VIEW (2 of 2): every frame: karts, items, dangers, the camera, the calls and the 2D layer =====================
// The camera sits just behind and above your kart and swoops in from the front of the grid while the lights count down; it
// widens as you go faster. Sparks under the wheels in a drift (blue, orange, purple), flames on a boost, a rainbow STAR, a rocket
// strapped on, a bubble, three shells spinning round you, a bee that fetches you when you fall. On the 2D layer: your place (big),
// the lap, the map, the item (a roulette while it is chosen), the coins, the drift gauge, the start lights, speed lines, the air
// ring (how long until you land: the white tick is one trick), and the calls.
function hazModel(h) { const T = THREE, g = new T.Group(), k2 = h.kind;
  const sp = (r, c, x = 0, y = 0, z = 0, m) => { const s = new T.Mesh(new T.SphereGeometry(r, 12, 9), m || M(c, 0.7)); s.position.set(x, y, z); g.add(s); return s; };
  if (k2 === 'sheep') { for (const [x, y, z] of [[0, 0.9, 0], [0.45, 1.0, 0.25], [-0.45, 1.0, -0.2], [0.2, 1.2, -0.3], [-0.3, 1.15, 0.3]]) sp(0.55, 0xf8f8f0, x, y, z); sp(0.32, 0x1a1a1a, 0.95, 1.05, 0); for (const [x, z] of [[0.4, 0.3], [0.4, -0.3], [-0.4, 0.3], [-0.4, -0.3]]) { const l = new T.Mesh(new T.CylinderGeometry(0.08, 0.08, 0.6), M(0x1a1a1a)); l.position.set(x, 0.3, z); g.add(l); } }
  else if (k2 === 'crab') { const b = sp(0.55, 0xe83a2a, 0, 0.5, 0); b.scale.set(1, 0.55, 1.3); for (const s of [-1, 1]) { sp(0.22, 0xe83a2a, 0.5, 0.6, s * 0.75); sp(0.12, 0xffffff, 0.3, 0.95, s * 0.2); sp(0.06, 0x101010, 0.38, 0.97, s * 0.2); } }
  else if (k2 === 'boulder' || k2 === 'snowball') { const b = new T.Mesh(k2 === 'boulder' ? new T.DodecahedronGeometry(h.r, 1) : new T.SphereGeometry(h.r, 16, 12), M(k2 === 'boulder' ? 0x9a6a4a : 0xf4f8ff, 0.9)); b.material.flatShading = k2 === 'boulder'; b.position.y = h.r; g.add(b); g.userData.roll = b; }
  else if (k2 === 'ghost') { const b = new T.Mesh(new T.CapsuleGeometry(0.7, 0.8, 6, 12), new T.MeshStandardMaterial({ color: 0xf0f0ff, transparent: true, opacity: 0.75, emissive: 0x8a8aff, emissiveIntensity: 0.4 })); b.position.y = 1.6; g.add(b); for (const s of [-1, 1]) sp(0.13, 0x101018, 0.62, 1.9, s * 0.25); const mo = sp(0.15, 0x101018, 0.66, 1.45, 0); mo.scale.set(0.5, 1.3, 1); }
  else if (k2 === 'twister') { for (let q = 0; q < 5; q++) { const c = new T.Mesh(new T.ConeGeometry(1.2 + q * 0.5, 1.8, 14, 1, true), new T.MeshBasicMaterial({ color: 0xd8b070, transparent: true, opacity: 0.45, side: T.DoubleSide, depthWrite: false })); c.rotation.x = Math.PI; c.position.y = 0.9 + q * 1.5; g.add(c); } g.userData.spin = true; }
  else if (k2 === 'gumdrop') { const b = new T.Mesh(new T.SphereGeometry(h.r, 16, 10, 0, TAU, 0, Math.PI / 2), M([0xff3a5a, 0x3ab0ff, 0x8ae84a, 0xffd23a][(h.i | 0) % 4], 0.6)); g.add(b); const bot = new T.Mesh(new T.CircleGeometry(h.r, 16), b.material); bot.rotation.x = Math.PI / 2; g.add(bot); g.userData.bob = true; }
  else if (k2 === 'mud' || k2 === 'ice') { const d = new T.Mesh(new T.CircleGeometry(h.r, 24), new T.MeshStandardMaterial({ color: k2 === 'mud' ? 0x5a3a1a : 0xc8f0ff, roughness: k2 === 'mud' ? 1 : 0.05, metalness: k2 === 'ice' ? 0.4 : 0, transparent: true, opacity: 0.92 })); d.rotation.x = -Math.PI / 2; d.position.y = 0.06; g.add(d); }
  else if (k2 === 'car') { const col = [0xffd23a, 0xff3a5a, 0x3ae0ff, 0xffffff][(h.i | 0) % 4]; const b = new T.Mesh(new T.BoxGeometry(3.2, 0.9, 1.7), M(col, 0.3, 0.4)); b.position.y = 0.7; g.add(b); const cb = new T.Mesh(new T.BoxGeometry(1.6, 0.6, 1.5), M(0x1a2a3a, 0.1, 0.5)); cb.position.set(-0.2, 1.4, 0); g.add(cb); for (const s of [-0.6, 0.6]) { const l = new T.Mesh(new T.SphereGeometry(0.16, 8, 6), new T.MeshBasicMaterial({ color: 0xffffe0 })); l.position.set(1.62, 0.8, s); g.add(l); const r = new T.Mesh(new T.SphereGeometry(0.14, 8, 6), new T.MeshBasicMaterial({ color: 0xff2020 })); r.position.set(-1.62, 0.8, s); g.add(r); } }
  else { // cannon, lava, meteor: a warning ring on the road, then the hit
    const ring = new T.Mesh(new T.RingGeometry(h.r * 0.85, h.r, 32), new T.MeshBasicMaterial({ color: k2 === 'lava' ? 0xff7a1a : 0xff3a3a, transparent: true, opacity: 0.8, side: T.DoubleSide, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.08; g.add(ring); g.userData.ring = ring;
    const fill = new T.Mesh(new T.CircleGeometry(h.r, 32), new T.MeshBasicMaterial({ color: k2 === 'lava' ? 0xff7a1a : 0xff3a3a, transparent: true, opacity: 0.3, depthWrite: false })); fill.rotation.x = -Math.PI / 2; fill.position.y = 0.07; g.add(fill); g.userData.fill = fill;
    const ball = k2 === 'lava' ? new T.Mesh(new T.CylinderGeometry(1.2, 1.8, 10, 12, 1, true), new T.MeshBasicMaterial({ color: 0xffa02a, transparent: true, opacity: 0.85, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide })) : new T.Mesh(k2 === 'meteor' ? new T.DodecahedronGeometry(1.1, 0) : new T.SphereGeometry(0.9, 14, 10), M(k2 === 'meteor' ? 0x5a4a4a : 0x1a1a1a, 0.4, 0.5, k2 === 'meteor' ? 0xff4a00 : 0));
    g.add(ball); g.userData.ball = ball; }
  g.traverse(o => { if (o.isMesh && k2 !== 'mud' && k2 !== 'ice') o.castShadow = true; }); return g; }
function shotModel(kind) { const T = THREE, g = new T.Group();
  if (kind === 'comet') { const s = new T.Sprite(new T.SpriteMaterial({ map: glowTex('rgba(255,255,255,1)', 'rgba(120,180,255,.8)'), blending: T.AdditiveBlending, depthWrite: false })); s.scale.setScalar(4); g.add(s); const c = new T.Mesh(new T.IcosahedronGeometry(0.8, 1), M(0x3a6aff, 0.3, 0.3, 0x3a6aff)); g.add(c); return g; }
  const sh = new T.Mesh(new T.SphereGeometry(0.62, 16, 10, 0, TAU, 0, Math.PI / 2), new T.MeshStandardMaterial({ map: kind === 'homing' ? shellTex('#e8402a', '#ffe0a0') : shellTex('#3aaa3a', '#f0f0d0'), roughness: 0.35, metalness: 0.1 })); sh.scale.y = 0.75; g.add(sh); const rim = new T.Mesh(new T.TorusGeometry(0.6, 0.1, 6, 20), M(0xf8f0d8, 0.5)); rim.rotation.x = Math.PI / 2; g.add(rim);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g; }
function peelModel() { const T = THREE, g = new T.Group(), y = M(0xffd83a, 0.5); for (let q = 0; q < 3; q++) { const p = new T.Mesh(new T.CapsuleGeometry(0.16, 0.5, 4, 8), y); p.position.set(Math.cos(q / 3 * TAU) * 0.3, 0.2, Math.sin(q / 3 * TAU) * 0.3); p.rotation.z = Math.PI / 2 - 0.4; p.rotation.y = -q / 3 * TAU; g.add(p); } const c = new T.Mesh(new T.SphereGeometry(0.22, 10, 8), y); c.position.y = 0.3; g.add(c); return g; }
const TIERC = [0xffffff, 0x4ac0ff, 0xff9a20, 0xc050ff];
function sync(V, g, t, dt) { const T = THREE, TR = g.T, S = TR.S;
  for (const k of g.karts) { let m = V.karts.get(k); if (!m) { m = kartModel(k.who, k.me ? g.kart : KARTS[(k.who.stars | 0) % KARTS.length]); V.S.add(m); V.karts.set(k, m); }
    const u = m.userData; m.visible = k.fall <= 0 || k.y > (S[k.i].y - 12);
    m.position.set(k.x, (k.y || 0), k.z); m.rotation.set(0, -(k.h + (k.slip || 0) * 0.6), 0);
    // nose up or down with the slope; a lean in the drift; a wobble at speed; a hop when spun
    const sl = k.air ? clamp(k.vy * 0.03, -0.35, 0.35) : Math.atan(S[k.i].slope || 0); u.inner.rotation.set(k.drift || k.drifting ? -(k.drift || Math.sign(S[k.i].curve)) * 0.12 : 0, 0, sl); u.body.position.y = k.spin ? Math.abs(Math.sin(t * 12)) * 0.4 : Math.sin(t * 30 + k.x) * 0.012 * Math.min(1, k.v / 10);
    u.body.rotation.y = k.spin ? t * 14 : 0; u.wheels.forEach((w, i) => { w.rotation.z -= k.v * dt / 0.33; if (i < 2) w.rotation.y = -(k.me ? g.steer : k.steer) * 0.4; });
    u.head.rotation.y = -(k.me ? g.steer : k.steer) * 0.35; u.head.rotation.z = k.air ? 0.2 : 0;
    if (k.trick) { const p = clamp(k.trick.t / TRICK, 0, 1), e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2, a = e * TAU, kd = k.trick.kind; u.inner.position.y = Math.sin(p * Math.PI) * 0.5; if (kd === 0) u.inner.rotation.z = a; else if (kd === 1) u.inner.rotation.y = a; else if (kd === 2) u.inner.rotation.x = a; else if (kd === 3) u.inner.rotation.x = Math.sin(p * Math.PI) * 1.3; else { u.inner.rotation.x = a; u.inner.rotation.y = a * 0.5; } } else u.inner.position.y = 0;
    if (k.star > 0 || u.glow) { if (!u.glow) { u.glow = new T.Sprite(new T.SpriteMaterial({ map: glowTex(), blending: T.AdditiveBlending, depthWrite: false, transparent: true })); u.glow.scale.setScalar(5); u.glow.position.y = 0.9; u.inner.add(u.glow); } u.glow.visible = k.star > 0; if (k.star > 0) u.glow.material.color.setHSL((t * 1.6) % 1, 1, 0.6); }
    u.wings.visible = !!k.glide; u.rk.visible = k.rocket > 0; u.bub.visible = k.shield > 0; if (u.bub.visible) u.bub.scale.setScalar(1 + Math.sin(t * 6) * 0.03);
    if (k.star > 0) { const hue = (t * 1.6 + k.x * 0.01) % 1; u.mats.forEach(mt => mt.emissive.setHSL(hue, 1, 0.5)); } else u.mats.forEach(mt => mt.emissive.setHex(0x000000));
    const bt = k.me ? (k.lastTier || 1) : 1, fl = k.boost > 0 || k.rocket > 0; u.flames.forEach(f => { f.visible = fl; f.scale.set(1, 0.8 + Math.random() * 0.7 + (k.rocket > 0 ? 1.2 : k.boost * 0.4), 1); f.material.color.setHex(k.rocket > 0 ? 0xff7a2a : bt === 3 ? 0xd060ff : bt === 2 ? 0xff9a20 : 0x60c0ff); });
    // three shells spinning round
    if (k.orbit > 0 || u.orb) { if (!u.orb) { u.orb = [0, 1, 2].map(() => { const s = shotModel('shell'); s.scale.setScalar(0.8); V.S.add(s); return s; }); } u.orb.forEach((s, q) => { s.visible = q < k.orbit && m.visible; const a = t * 5 + q / 3 * TAU; s.position.set(k.x + Math.cos(a) * 2.0, (k.y || 0) + 0.5, k.z + Math.sin(a) * 2.0); s.rotation.y = -a; }); }
    // the rescue bee
    if (k.resT != null && g.t - k.resT < 1.1) { if (!u.bee) { u.bee = new T.Group(); const bb = new T.Mesh(new T.SphereGeometry(0.5, 12, 9), M(0xffd23a, 0.5)); bb.scale.x = 1.3; u.bee.add(bb); for (const s of [-1, 1]) { const w = new T.Mesh(new T.CircleGeometry(0.5, 12), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, side: T.DoubleSide })); w.position.set(0, 0.45, s * 0.4); w.rotation.x = Math.PI / 2; u.bee.add(w); } V.S.add(u.bee); } u.bee.visible = true; u.bee.position.set(k.x, (k.y || 0) + 2.4 + (g.t - k.resT) * 3, k.z); } else if (u.bee) u.bee.visible = false;
    // sparks: under the back wheels in a drift; boost and star sparkles; dust on the grass
    const bx = k.x - Math.cos(k.h) * 0.9, bz = k.z - Math.sin(k.h) * 0.9, by = (k.y || 0) + 0.15;
    if ((k.drift && k.tier) || (k.drifting && k.v > 15 && Math.random() < 0.5)) { const col = k.me ? TIERC[k.tier] : 0x4ac0ff; for (const s of [-0.75, 0.75]) if (Math.random() < (k.me ? 0.9 : 0.25)) V.sparkP.push({ x: bx - Math.sin(k.h) * s, y: by, z: bz + Math.cos(k.h) * s, vx: (Math.random() - 0.5) * 4 - Math.cos(k.h) * 3, vy: 1.5 + Math.random() * 2.5, vz: (Math.random() - 0.5) * 4 - Math.sin(k.h) * 3, t: 0, c: col }); }
    if ((k.star > 0 || (k.boost > 0.3 && k.me)) && Math.random() < 0.7) V.sparkP.push({ x: bx, y: by + 0.4, z: bz, vx: (Math.random() - 0.5) * 3, vy: 1 + Math.random() * 2, vz: (Math.random() - 0.5) * 3, t: 0, c: k.star > 0 ? [0xff5a5a, 0xffd040, 0x5aff8a, 0x5ac8ff, 0xc05aff][(Math.random() * 5) | 0] : 0x9ad8ff });
    if (k.off && !k.air && k.v > 8 && Math.random() < 0.5) V.sparkP.push({ x: bx, y: by, z: bz, vx: (Math.random() - 0.5) * 2, vy: 0.8 + Math.random(), vz: (Math.random() - 0.5) * 2, t: 0, c: 0xa89070 }); }
  // coins, rings, boxes, pads
  V.coins.forEach((m, i) => { const cn = g.coinsT[i]; m.visible = !!cn && cn.t <= 0; if (cn) { m.position.set(cn.x, cn.y + Math.sin(t * 3 + i) * 0.12, cn.z); m.rotation.y = t * 3 + i; } });
  V.rings.forEach((m, i) => { const rg = g.ringsT[i], took = rg && (rg.by || []).indexOf(g.me) >= 0; m.material.emissiveIntensity = took ? 0.1 : 0.7 + 0.5 * Math.sin(t * 6 + i); m.material.opacity = 1; m.rotation.z = t * 0.6; m.scale.setScalar(took ? 0.9 : 1 + Math.sin(t * 5 + i) * 0.04); });
  V.pads.forEach((m, i) => { m.material.opacity = 0.6 + 0.4 * Math.sin(t * 8 + i); });
  V.boxes.forEach((m, i) => { const b = g.boxes[i]; if (!b) { m.visible = false; return; } m.visible = b.t <= 0; m.rotation.set(t * 0.8, t * 1.2, 0); m.position.set(b.x, b.y + Math.sin(t * 2 + i) * 0.18, b.z); m.material.emissive.setHSL((t * 0.25 + i * 0.07) % 1, 0.9, 0.4); });
  // the dangers
  while (V.haz.length < g.hz.length) { const h = g.hz[V.haz.length], m = hazModel(h); V.track.add(m); V.haz.push(m); }
  V.haz.forEach((m, i) => { const h = g.hz[i]; if (!h) { m.visible = false; return; } m.visible = true; const gy = h.gy || 0; m.position.set(h.x, gy, h.z); const u = m.userData;
    if (h.kind === 'sheep' || h.kind === 'crab' || h.kind === 'ghost') { const dir = Math.cos(t * TAU / h.per + h.ph); m.rotation.y = -(h.h + (dir > 0 ? -Math.PI / 2 : Math.PI / 2)); if (h.kind === 'ghost') m.position.y = gy + Math.sin(t * 3 + i) * 0.3; else m.position.y = gy + Math.abs(Math.sin(t * 10 + i)) * 0.12; }
    if (u.roll) { u.roll.rotation.x += dt * 4; m.rotation.y = -h.h; }
    if (u.spin) { m.rotation.y = t * 6; }
    if (u.bob) m.position.y = gy + (h.y || 0);
    if (h.kind === 'car') m.rotation.y = -h.h;
    if (u.ring) { const on = h.warn > 0 || h.act; u.ring.visible = u.fill.visible = on; u.fill.scale.setScalar(Math.max(0.01, h.warn || 1)); u.ring.material.opacity = 0.5 + 0.5 * Math.sin(t * 16);
      const b = u.ball; if (h.kind === 'lava') { b.visible = h.act || (h.blast > 0 && h.blast < 0.6); b.position.y = 5; b.scale.y = h.act ? 1 : 0.5; } else { b.visible = h.warn > 0.3 || h.act; b.position.y = h.act ? 0.9 : 0.9 + (1 - h.warn) * 40; b.rotation.x = t * 3; } } });
  // shells, peels, comets, booms
  while (V.shotsM.length < g.shots.length) { V.shotsM.push(null); } V.shotsM.forEach((m, i) => { const o = g.shots[i]; if (m && (!o || m.userData.kind !== o.kind)) { V.S.remove(m); V.shotsM[i] = m = null; } if (o && !m) { m = shotModel(o.kind); m.userData.kind = o.kind; V.S.add(m); V.shotsM[i] = m; } if (m) { m.position.set(o.x, o.y + (o.kind === 'comet' ? 0 : 0.05), o.z); m.rotation.y = t * 12; } });
  while (V.peelsM.length < g.peels.length) { const m = peelModel(); V.S.add(m); V.peelsM.push(m); } V.peelsM.forEach((m, i) => { const p = g.peels[i]; m.visible = !!p; if (p) m.position.set(p.x, (p.y || 0) + 0.05, p.z); });
  while (V.boomsM.length < g.booms.length) { const sp = new T.Sprite(new T.SpriteMaterial({ map: glowTex('rgba(255,255,220,1)', 'rgba(255,140,40,.8)'), blending: T.AdditiveBlending, depthWrite: false })); V.S.add(sp); V.boomsM.push(sp); }
  V.boomsM.forEach((m, i) => { const b = g.booms[i]; m.visible = !!b; if (b) { const u = b.t / 1.2; m.position.set(b.x, (b.y || 0) + 1 + u * 2, b.z); m.scale.setScalar(2 + u * (b.kind === 'comet' ? 16 : 9)); m.material.opacity = 1 - u; m.material.color.setHex(b.kind === 'comet' ? 0x8ab0ff : b.kind === 'lava' ? 0xffa040 : 0xffffff); } });
  // the start lights on the arch
  if (V.startLights) V.startLights.forEach((l, i) => { const lit = g.count > 0 ? (3 - Math.ceil(g.count)) >= i : false, gl = g.count <= 0 && g.t < 4; l.material.color.setHex(gl ? 0x3aff6a : lit ? 0xff2a2a : 0x331111); });
  // sparks
  const P = V.sparkP; while (P.length > 400) P.shift(); const pa = V.sparks.geometry.attributes.position, ca = V.sparks.geometry.attributes.color, col = new T.Color();
  for (let i = 0; i < 400; i++) { const q = P[i]; if (q) { q.t += dt; q.vy -= 9 * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; pa.setXYZ(i, q.x, q.y, q.z); col.setHex(q.c); ca.setXYZ(i, col.r, col.g, col.b); } else pa.setXYZ(i, 0, -1e4, 0); } for (let i = P.length - 1; i >= 0; i--) if (P[i].t > 0.4) P.splice(i, 1); pa.needsUpdate = ca.needsUpdate = true;
  // the weather follows the camera
  if (V.wx.visible) { const wp = V.wx.geometry.attributes.position, c = W3.cam.position, th = TR.info.theme, fall = th === 'frost' ? 3 : th === 'blossom' ? 1.6 : th === 'lava' ? -2 : 0.3;
    for (let i = 0; i < wp.count; i++) { let x = wp.getX(i), y = wp.getY(i), z = wp.getZ(i); y -= fall * dt; x += Math.sin(t + i) * dt * (th === 'blossom' ? 1.5 : 0.4); if (x - c.x > 40) x -= 80; if (c.x - x > 40) x += 80; if (z - c.z > 40) z -= 80; if (c.z - z > 40) z += 80; if (y - c.y > 30) y -= 50; if (c.y - y > 20) y += 50; wp.setXYZ(i, x, y, z); } wp.needsUpdate = true; }
  for (const a of V.anim) a.f(a.o, t, dt);
}
const SV = new (window.THREE ? THREE.Vector3 : Object)();
function scr(x, y, z) { if (!V3 || V3.none) return { x: W / 2, y: H / 2, front: true }; SV.set(x, y, z); return W3.screen(SV); }
// ---------- events: calls, sounds, shakes ----------
const nth = q => q + (q === 1 ? 'st' : q === 2 ? 'nd' : q === 3 ? 'rd' : 'th');
function onEvent(G, e) {
  const cx = W / 2;
  switch (e.k) {
    case 'start': { const c = G.cfg; say(TRACKS[c.track].name.toUpperCase(), cx, H * 0.27, '#ffffff', 22); say(`${CUPS[c.cup].icon} ${CUPS[c.cup].name.toUpperCase()} · ${CLASSES[c.cls]}${c.boss ? ' · BOSS RACE' : ''}`, cx, H * 0.31, '#ffd080', 14); say(c.place === 1 ? 'WIN THE RACE!' : `FINISH TOP ${c.place}`, cx, H * 0.345, '#9be3ff', 16); sfx.go(); if (G.N <= 3) tip('rocket', 'Hold the RIGHT side of the screen as the 2nd light comes on for a ROCKET START!', 3.0); } break;
    case 'light': sfx.light(e.n); if (e.n <= 3 && !G.lesson) say(String(e.n), cx, H * 0.46, ['#7af0a0', '#ffd040', '#ff9a3a', '#ff5a5a'][e.n], 64); break;
    case 'go': sfx.light(0); say('GO!', cx, H * 0.36, '#7af0a0', 50); FX.flash = 0.2; music.start(G); break;
    case 'rocket': sfx.boost(3); say('ROCKET START!', cx, H * 0.42, '#ffd040', 26); FX.shake = 6; vibe(HAP.sharp); break;
    case 'stall': sfx.no(); say('STALLED! TOO EARLY', cx, H * 0.42, '#ff9a8a', 20); tip('stall', 'Too early! Hold the right side only when the SECOND light comes on.', 3); break;
    case 'drift': sfx.drift(); break;
    case 'spark': sfx.spark(e.tier); G.me.lastTier = e.tier; break;
    case 'boost': sfx.boost(e.tier); FX.shake = 2 + e.tier; G.me.lastTier = e.tier; say(['', 'BOOST', 'SUPER BOOST!', 'ULTRA BOOST!!'][e.tier], cx, H * 0.6, ['#fff', '#7ad0ff', '#ffb040', '#d080ff'][e.tier], 16 + e.tier * 4); if (e.tier >= 2) vibe(HAP.light); if (G.N <= 2) tip('drift2', 'Hold the drift longer for orange, then purple sparks: bigger boosts!', 2.6); break;
    case 'hop': break;
    case 'launch': sfx.launch(e.big); FX.shake = 3; if (e.big) say('GLIDE!', cx, H * 0.3, '#ffd040', 30); if (G.N <= 4) tip(e.big ? 'glide' : 'air', e.big ? 'Steer through the gold RINGS for a boost when you land. Tap for tricks!' : 'In the air: TAP the right side for a trick!', 2.4); break;
    case 'trick': sfx.trick(e.n); say(TRICKS[e.kind] + (e.n > 1 ? ` ×${e.n}` : ''), cx, H * 0.36 - Math.min(5, e.n) * 6 * k, ['#ffffff', '#ffd040', '#ff9a3a', '#ff5ac8', '#9ae6ff'][Math.min(4, e.n - 1)], 18 + Math.min(10, e.n * 2)); vibe(HAP.tick); break;
    case 'trickdone': sfx.tick(); break;
    case 'land': if (e.n) { sfx.land(e.n, e.perfect); FX.shake = 3 + e.n; say(e.perfect ? 'PERFECT!' : 'CLEAN! +BOOST', cx, H * 0.6, e.perfect ? '#ffd040' : '#7af0a0', e.perfect ? 30 : 20); if (e.perfect) { FX.flash = 0.35; burst(cx, H * 0.62, '#ffd040', 20, 200); } vibe(e.perfect ? HAP.sharp : HAP.light); } else sfx.thump(); if (e.rings) say(`${e.rings} RING${e.rings > 1 ? 'S' : ''}! +BOOST`, cx, H * 0.66, '#ffd040', 18); break;
    case 'ring': sfx.ring(e.n); say('◎ ' + e.n, cx + (e.n - 2) * 40 * k, H * 0.44, '#ffd040', 22); break;
    case 'wipeout': sfx.spin(); FX.shake = 12; FX.red = 0.5; say('WIPEOUT!', cx, H * 0.4, '#ff8a7a', 32); if (e.lost) say(`−${e.lost} 🪙`, cx, H * 0.46, '#ffd040', 16); tip('wipe', 'You landed in the middle of a trick. Only tap again if there is time to finish it!', 3); break;
    case 'coin': sfx.coin(e.n); if (e.air) say('+🪙', cx + (Math.random() - 0.5) * 60 * k, H * 0.5, '#ffd040', 16); break;
    case 'pad': sfx.pad(); FX.shake = 2; break;
    case 'draft': sfx.pad(); say('SLIPSTREAM!', cx, H * 0.56, '#bfe8ff', 18); tip('draft', 'Stay right behind a kart for a moment: its slipstream gives you a boost.', 2.6); break;
    case 'box': sfx.item(); ui.roulT = 0; break;
    case 'boxhit': sfx.boxhit(); { const p = scr(e.x, e.y, e.z); burst(p.x, p.y, '#9ad8ff', 10, 160); } break;
    case 'item': say(ITEMS[e.it].icon + ' ' + ITEMS[e.it].name.toUpperCase(), cx, H * 0.4, '#ffffff', 18); sfx.ding(); if (G.N <= 5) tip('item', e.it === 'triple' ? 'Three shells spin round you: they block a hit. Tap to fire them, one at a time.' : 'Tap the right side of the screen to use your item.', 2.8); break;
    case 'use': if (e.me) sfx.use(e.it); break;
    case 'freeze': if (!e.me) { say('❄ SNOW FLURRY!', cx, H * 0.34, '#bfe8ff', 22); } break;
    case 'spin': if (e.me) { sfx.spin(); FX.shake = 10; FX.red = 0.4; FX.stop = 0.06; say({ shell: 'SHELLED!', homing: 'SEEKER!', peel: 'SLIPPED!', star: 'STARRED!', comet: 'COMET!!', freeze: 'FROZEN!', sheep: 'BAAA!', crab: 'PINCHED!', boulder: 'BOULDER!', snowball: 'SNOWBALL!', ghost: 'BOO!', twister: 'TWISTER!', gumdrop: 'BOING!', cannon: 'CANNONBALL!', lava: 'TOO HOT!', meteor: 'METEOR!', car: 'BEEP BEEP!' }[e.why] || 'SPUN OUT!', cx, H * 0.4, '#ffb4a8', 26); if (e.lost) say(`−${e.lost} 🪙`, cx, H * 0.46, '#ffd040', 16); } else { const p = scr(e.x, (e.y || 0) + 1.5, e.z); if (p.front && Math.abs(p.x - cx) < W) burst(p.x, p.y, '#ffffff', 6, 90); } break;
    case 'haz': if (G.N <= 8) tip('haz' + e.kind, { sheep: 'Sheep wander across the road: go round them!', crab: 'Crabs scuttle across: go round them.', boulder: 'Boulders roll across the road: time it!', snowball: 'Snowballs roll across: time it!', ghost: 'Ghosts drift across: steer round them.', twister: 'Keep clear of the twister!', gumdrop: 'Gumdrops bounce: go under when they are high.', cannon: 'A red circle on the road: a cannonball is coming. Steer out of it!', lava: 'An orange circle: lava is about to burst up. Steer out of it!', meteor: 'A red circle: a meteor is coming. Steer out of it!', car: 'Traffic! Go round the cars.' }[e.kind] || '', 3); break;
    case 'pop': if (e.me) { sfx.pop(); say('BUBBLE SAVED YOU', cx, H * 0.42, '#9adfff', 16); } break;
    case 'block': if (e.me) { sfx.pop(); say('BLOCKED!', cx, H * 0.42, '#7af0a0', 18); } break;
    case 'clash': sfx.bump(); { const p = scr(e.x, (e.y || 0) + 0.5, e.z); burst(p.x, p.y, '#ffffff', 8, 120); } break;
    case 'gotem': sfx.gotem(); { const p = scr(e.x, (e.y || 0) + 1.6, e.z); say({ shell: 'HIT!', homing: 'GOT \'EM!', peel: 'SLIPPED!', star: 'BOOM!', comet: 'KABOOM!', freeze: 'FROZEN!' }[e.why] || 'HIT!', p.front ? p.x : cx, p.front ? p.y - 20 * k : H * 0.3, '#ffd040', 18); } break;
    case 'bump': sfx.bump(); break;
    case 'wall': sfx.wall(); FX.shake = 5; break;
    case 'fall': sfx.fall(); say('FELL OFF!', cx, H * 0.38, '#ff9a8a', 28); FX.red = 0.3; tip('fall', 'No walls here! Keep on the road: the bee brings you back, but it costs time.', 3); break;
    case 'rescue': sfx.bee(); break;
    case 'star': break;
    case 'starend': break;
    case 'rocketend': break;
    case 'lap': ui.lapT = 2; if (e.lap < G.cfg.laps) { sfx.lap(e.lap); if (e.lap === G.cfg.laps - 1) { say('FINAL LAP!', cx, H * 0.3, '#ffd080', 34); music.final(); } else say(`LAP ${e.lap + 1}`, cx, H * 0.3, '#ffd080', 30); } break;
    case 'finish': music.stop(); break;
    case 'lessonnext': if (e.first) hint = null; say('FIRST, A LESSON', cx, H * 0.3, '#ffe08a', 20); sfx.go(); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, cx, H * 0.36, '#9be3b5', 22); sfx.combo(e.n); break;
    case 'lessonmiss': hint = { txt: e.how, t: 0, secs: 3.4 }; break;
    case 'lessondone': say('NOW RACE!', cx, H * 0.3, '#ffe08a', 28); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); vibe(HAP.best); FX.flash = 0.4; music.stop(); say(e.place === 1 ? 'YOU WIN!' : `${nth(e.place).toUpperCase()} PLACE!`, cx, H * 0.3, '#ffd040', 36); burst(cx, H * 0.3, '#ffd040', 30, 260); burst(cx, H * 0.3, '#ff5ac8', 20, 220); break;
    case 'lost': sfx.lose(); music.stop(); say(G.full ? 'THE TOP PLACES ARE TAKEN' : `${nth(e.place).toUpperCase()} PLACE`, cx, H * 0.3, '#ffb4a8', G.full ? 22 : 30); break;
  }
}
// ---------- every frame ----------
function placeCam(g, dt) { const cam = W3.cam, asp = innerWidth / innerHeight, k2 = g.me, sp = k2.v / VMAX; FX.speed = lerp(FX.speed, k2.boost > 0 || k2.rocket > 0 ? 1 : 0, Math.min(1, dt * 4));
  cam.fov = (asp < 0.8 ? 68 : 54) + sp * 6 + FX.speed * 8; cam.aspect = asp; cam.updateProjectionMatrix();
  if (!ui.cam || ui.snap) { ui.cam = { h: k2.h, y: k2.y || 0 }; ui.snap = false; } let dh = k2.h - ui.cam.h; dh = Math.atan2(Math.sin(dh), Math.cos(dh)); ui.cam.h += dh * Math.min(1, dt * (k2.spin ? 1.5 : 5));
  ui.cam.y = lerp(ui.cam.y, k2.fall > 0 ? ui.cam.y : (k2.y || 0), Math.min(1, dt * (k2.air ? 3 : 8)));
  const h = ui.cam.h, back = 6.6 + FX.speed * 0.8, up = 3.0, sh = FX.shake ? (Math.random() - 0.5) * FX.shake * 0.02 : 0;
  let px = k2.x - Math.cos(h) * back, py = up + ui.cam.y, pz = k2.z - Math.sin(h) * back, lx = k2.x + Math.cos(h) * 6, ly = 0.8 + ui.cam.y, lz = k2.z + Math.sin(h) * 6;
  // during the countdown: in from the front of the grid, round and down behind your kart
  if (g.count > 0 && !g.lesson) { const u = clamp((3.2 - g.count) / 2.6, 0, 1), e = u * u * (3 - 2 * u), a = h + Math.PI * (1 - e), r = lerp(15, back, e), hy = lerp(10, up, e) + Math.sin(e * Math.PI) * 2; px = k2.x - Math.cos(a) * r; pz = k2.z - Math.sin(a) * r; py = hy + ui.cam.y; }
  cam.position.set(px + sh, py, pz + sh); cam.lookAt(lx, ly, lz); cam.updateMatrixWorld(); }
// bright enough for real eyes on a real phone (his words, 20 Nov 2026: "make it for human eyes"): every course at every
// time of day is lifted to a clear, colourful picture; night courses keep their dark sky but the road and the karts are lit
function brighten(info, sk) { const S = W3.S, night = ['night', 'dusk'].includes(sk), wet = ['rain', 'mist', 'overcast', 'storm'].includes(sk);
  S.exposure *= night ? 1.0 : wet ? 1.4 : info.theme === 'candy' || info.theme === 'desert' || info.theme === 'sky' ? 0.95 : 1.1; if (night) S.exposure = Math.max(S.exposure, sk === 'dusk' ? 1.6 : 2.0); if (sk === 'sunset') S.exposure *= 1.7; S.hemiI = Math.max(S.hemiI, night ? 1.5 : 1.25); W3.hemi.intensity = S.hemiI; if (night) { W3.hemi.color.set(0xb8c8ff); W3.hemi.groundColor.set(0x6a6a8a); }
  W3.scene.environmentIntensity = Math.max(W3.scene.environmentIntensity, night ? 0.6 : 1.0); if (V3 && V3.amb) V3.amb.intensity = night ? 0.9 : wet ? 0.6 : 0.4;
  W3.scene.fog.far = Math.max(W3.scene.fog.far, 420); W3.scene.fog.near = Math.max(W3.scene.fog.near, 60); }
// the same course at another time of day when the cups come round again (light and weather that change)
function skyOf(info, cls) { const b = info.sky, night = ['night', 'storm', 'sunset', 'dusk'].includes(b) || ['sky', 'lava', 'pirate'].includes(info.theme); if (night || cls === 0 || cls === 3) return b;
  if (cls === 1) return ['golden', 'sunset', 'morning'][info.seed % 3] === b ? 'noon' : ['golden', 'sunset', 'morning'][info.seed % 3];
  if (cls === 2) return ['rain', 'mist', 'overcast'][info.seed % 3]; return 'golden'; }
let IG = null; function idleG() { if (!IG || IG.over || IG.t > 70) { IG = newGame(Math.max(1, (store.get('level', 1) | 0)), { seed: (Math.random() * 1e6) | 0 }); IG.lesson = null; IG.mem = {}; ui.snap = true; } honest(IG, { react: 0.2, acc: 0.95 }, IG.mem); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (!V.none && V.restored !== W3.S.restored) { V.restored = W3.S.restored; V.trackN = -1; }
  if (V.none) { ctx.fillStyle = '#101828'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D track.', W / 2, H / 2); return; }
  const g = G || idleG(), t = now, key = g.cfg.track + (g.cfg.mirror ? 100 : 0);
  if (V.trackN !== key || V.forG !== g) { if (V.trackN !== key) { V.trackN = key; buildTrack(V, g); const info = TRACKS[g.cfg.track]; const sk = skyOf(info, g.cfg.cls); W3.setSky(sk, { azim: 140 + info.seed % 90 }); brighten(info, sk); }
    else { for (const [, m] of V.karts) { V.S.remove(m); const u = m.userData; if (u.orb) u.orb.forEach(s => V.S.remove(s)); if (u.bee) V.S.remove(u.bee); } V.karts.clear(); V.haz.forEach(m => V.track.remove(m)); V.haz = []; V.shotsM.forEach(m => m && V.S.remove(m)); V.shotsM = []; V.peelsM.forEach(m => V.S.remove(m)); V.peelsM = []; }
    V.forG = g; ui.snap = true; }
  placeCam(g, dt); sync(V, g, t, dt); W3.setFocus(g.me.x, g.me.y || 0, g.me.z, 34); W3.render(dt);
  // speed lines on a boost
  if (FX.speed > 0.05) { ctx.save(); ctx.globalAlpha = FX.speed * 0.45; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; for (let i = 0; i < 26; i++) { const a = (i / 26) * TAU + (Math.floor(t * 20) % 7) * 0.13, r0 = Math.max(W, H) * (0.42 + Math.random() * 0.15), r1 = r0 + 60 + Math.random() * 120; ctx.beginPath(); ctx.moveTo(W / 2 + Math.cos(a) * r0, H * 0.45 + Math.sin(a) * r0); ctx.lineTo(W / 2 + Math.cos(a) * r1, H * 0.45 + Math.sin(a) * r1); ctx.stroke(); } ctx.restore(); }
  if (G && !(G.over && !$('ovEnd').classList.contains('hidden'))) hud(G, t);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 1.0 ? 1 : 1 - (t2.t - 1.0) / 0.5; ctx.globalAlpha = Math.max(0, al); const sc = t2.t < 0.12 ? 1.3 - t2.t / 0.12 * 0.3 : 1; ctx.font = `400 ${Math.round(t2.size * k * sc)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(10,14,30,.75)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 20); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 20); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30;
    ctx.fillStyle = 'rgba(16,24,40,.88)'; rrect(W / 2 - w / 2, H * 0.5 - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.5 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,40,60,${FX.red * 0.18})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,250,235,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); }
}
// ---------- the 2D layer ----------
function panel(x, y, w, h) { ctx.fillStyle = 'rgba(16,24,40,.72)'; rrect(x, y, w, h, 14); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 1.5; rrect(x, y, w, h, 14); ctx.stroke(); }
const PLC = ['#ffd040', '#e0e8f0', '#e8a060', '#ffffff'];
function hud(G, t) {
  const c = G.cfg, me = G.me; ctx.textBaseline = 'middle';
  if (!G.lesson) {
    // your place: big, gold for first; and the lap
    const x = 12, y = 46 * k, pl = me.place || G.karts.length, ok = pl <= c.place; if (ui.pl !== pl) { ui.plT = 0.35; ui.plUp = ui.pl != null && pl < ui.pl; ui.pl = pl; } ui.plT = Math.max(0, (ui.plT || 0) - 1 / 60);
    const sc = 1 + ui.plT * 1.2; ctx.save(); ctx.translate(x + 30 * k, y + 32 * k); ctx.scale(sc, sc); ctx.textAlign = 'center'; ctx.font = `400 ${Math.round(46 * k)}px ${TF}`; ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(10,14,30,.8)'; ctx.strokeText(String(pl), 0, 0); ctx.fillStyle = PLC[Math.min(3, pl - 1)]; ctx.fillText(String(pl), 0, 0); ctx.restore();
    ctx.textAlign = 'left'; ctx.font = `400 ${Math.round(16 * k)}px ${TF}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(10,14,30,.8)'; const suf = ['', 'ST', 'ND', 'RD'][pl] || 'TH'; ctx.strokeText(suf, x + 52 * k, y + 18 * k); ctx.fillStyle = PLC[Math.min(3, pl - 1)]; ctx.fillText(suf, x + 52 * k, y + 18 * k);
    ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = ok ? '#7af0a0' : '#ffb4a8'; ctx.strokeText(c.place === 1 ? 'need 1st' : `need top ${c.place}`, x + 52 * k, y + 40 * k); ctx.fillText(c.place === 1 ? 'need 1st' : `need top ${c.place}`, x + 52 * k, y + 40 * k);
    ctx.font = `400 ${Math.round(15 * k)}px ${TF}`; ctx.fillStyle = me.lap >= c.laps - 1 ? '#ffd080' : '#fff'; const lt = `LAP ${Math.min(c.laps, me.lap + 1)}/${c.laps}`; ctx.strokeText(lt, x + 4, y + 72 * k); ctx.fillText(lt, x + 4, y + 72 * k);
    ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.8)'; const tt = G.t.toFixed(1) + ' s'; ctx.strokeText(tt, x + 4, y + 92 * k); ctx.fillText(tt, x + 4, y + 92 * k);
    map(G, W - 12 - 92 * k, 46 * k, 92 * k);
  } else lessonPanel(G);
  // the item: bottom right, under the right thumb; a roulette while it is being chosen
  const r = 36 * k, bx = W - r - 18, by = H - r - 34 * k; ctx.fillStyle = 'rgba(16,24,40,.72)'; ctx.beginPath(); ctx.arc(bx, by, r, 0, TAU); ctx.fill();
  const has = me.item || me.orbit || me.peppers; ctx.strokeStyle = has ? '#ffd040' : me.roul > 0 ? '#ffffff' : 'rgba(255,255,255,.25)'; ctx.lineWidth = 3 * k; ctx.stroke(); ctx.textAlign = 'center';
  if (me.roul > 0) { const ids = Object.keys(ITEMS), q = ids[Math.floor(t * 14) % ids.length]; ctx.font = `${Math.round(28 * k)}px sans-serif`; ctx.fillText(ITEMS[q].icon.slice(0, 2), bx, by + 2); }
  else if (has) { const ic = me.item ? ITEMS[me.item].icon : me.orbit ? '🐢×' + me.orbit : '🌶×' + me.peppers; ctx.font = `${Math.round((ic.length > 2 ? 20 : 30) * k)}px sans-serif`; ctx.fillText(ic, bx, by + 2); ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillStyle = '#ffd040'; ctx.fillText(me.air ? 'TRICK' : 'TAP', bx, by - r - 10 * k); }
  else { ctx.font = `700 ${Math.round(20 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillText('?', bx, by); }
  // coins and the drift gauge
  { const w = 150 * k, x0 = W / 2 - w / 2, y0 = H - 44 * k; panel(x0 - 8, y0 - 22 * k, w + 16, 40 * k); ctx.textAlign = 'left'; ctx.font = `400 ${Math.round(11 * k)}px ${TF}`; ctx.fillStyle = '#ffd040'; ctx.fillText(`🪙 ${me.coin}/10`, x0, y0 - 9 * k);
    ctx.textAlign = 'right'; const tn = ['DRIFT', 'BLUE', 'ORANGE', 'PURPLE'][me.tier || 0]; ctx.fillStyle = me.drift ? hex(TIERC[me.tier || 0]) : 'rgba(255,255,255,.5)'; ctx.fillText(me.drift ? tn : 'DRIFT', x0 + w, y0 - 9 * k);
    const u = me.drift ? clamp(me.charge / 2.1, 0, 1) : 0; ctx.fillStyle = 'rgba(255,255,255,.14)'; rrect(x0, y0, w, 9 * k, 5); ctx.fill(); if (u > 0) { ctx.fillStyle = hex(TIERC[Math.max(1, me.tier || 0)]); rrect(x0, y0, Math.max(9 * k, w * u), 9 * k, 5); ctx.fill(); }
    for (const m of [0.55, 1.25]) { ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(x0 + w * m / 2.1 - 1, y0 - 2, 2, 9 * k + 4); } }
  // in the air: a ring round your kart that empties as the ground comes up (a trick takes this much: the white tick)
  if (me.air && !me.spin && me.fall <= 0) { const p = scr(me.x, (me.y || 0) + 0.8, me.z), tl = landPred(G, me), full = me.glide ? 3 : 1.2, R3 = 38 * k, u = clamp(tl / full, 0, 1);
    if (tl > 0.3 || me.trick) { ctx.lineWidth = 6 * k; ctx.strokeStyle = 'rgba(16,24,40,.5)'; ctx.beginPath(); ctx.arc(p.x, p.y, R3, 0, TAU); ctx.stroke(); const ok = tl > TRICK; ctx.strokeStyle = me.trick ? '#ff9a3a' : ok ? '#7af0a0' : '#ff5a5a'; ctx.beginPath(); ctx.arc(p.x, p.y, R3, -Math.PI / 2, -Math.PI / 2 + TAU * u); ctx.stroke();
      const tk = -Math.PI / 2 + TAU * clamp(TRICK / full, 0, 1); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2 * k; ctx.beginPath(); ctx.moveTo(p.x + Math.cos(tk) * (R3 - 6 * k), p.y + Math.sin(tk) * (R3 - 6 * k)); ctx.lineTo(p.x + Math.cos(tk) * (R3 + 6 * k), p.y + Math.sin(tk) * (R3 + 6 * k)); ctx.stroke();
      if (me.trick) { const q = me.trick.t / TRICK; ctx.strokeStyle = '#ffd040'; ctx.lineWidth = 3 * k; ctx.beginPath(); ctx.arc(p.x, p.y, R3 - 9 * k, -Math.PI / 2, -Math.PI / 2 + TAU * q); ctx.stroke(); }
      else if (ok) { ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 12); ctx.font = `400 ${Math.round(14 * k)}px ${TF}`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText('TAP!', p.x, p.y - R3 - 12 * k); ctx.globalAlpha = 1; } } }
  // the start lights (and the rocket start: hold on the second light)
  if (G.count > 0) { const n = Math.ceil(G.count), cx = W / 2, cy = H * 0.16; ctx.fillStyle = 'rgba(16,16,24,.88)'; rrect(cx - 80 * k, cy - 26 * k, 160 * k, 52 * k, 14); ctx.fill(); for (let i = 0; i < 3; i++) { const lit = i < 4 - n; ctx.fillStyle = lit ? '#ff3a3a' : 'rgba(255,255,255,.12)'; if (lit) { ctx.shadowColor = '#ff3a3a'; ctx.shadowBlur = 16; } ctx.beginPath(); ctx.arc(cx - 46 * k + i * 46 * k, cy, 16 * k, 0, TAU); ctx.fill(); ctx.shadowBlur = 0; }
    ctx.textAlign = 'center'; ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = G.hold ? (G.holdAt > 2.05 ? '#ff9a8a' : '#7af0a0') : 'rgba(255,255,255,.85)'; ctx.fillText(G.hold ? (G.holdAt > 2.05 ? 'TOO EARLY…' : 'REVVING!') : 'hold the right side on the 2nd light', cx, cy + 42 * k); }
  // the steering thumb (the outer part of the slide is the drift zone)
  const st = ui.stick; if (st) { const R2 = 60 * k; ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 4 * k; ctx.beginPath(); ctx.moveTo(st.x0 - R2, st.y0); ctx.lineTo(st.x0 + R2, st.y0); ctx.stroke(); ctx.strokeStyle = 'rgba(255,170,60,.6)'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(st.x0 + s * R2 * 0.72, st.y0); ctx.lineTo(st.x0 + s * R2, st.y0); ctx.stroke(); }
    ctx.fillStyle = me.drift ? hex(TIERC[Math.max(1, me.tier)]) : 'rgba(255,255,255,.65)'; ctx.beginPath(); ctx.arc(st.x0 + G.steer * R2, st.y0, 18 * k, 0, TAU); ctx.fill(); }
  else if (G.N <= 2 && !G.over && G.t < 9 && G.count <= 0) { ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 4); ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText('left thumb: slide to steer · right: tap (items; tricks in the air)', W / 2, H - 130 * k); ctx.globalAlpha = 1; }
}
function map(G, x, y, s) { const S = G.T.S; if (!G.T.mapB) { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of S) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); } G.T.mapB = { x0, x1, z0, z1 }; } const { x0, x1, z0, z1 } = G.T.mapB, sc = s / Math.max(x1 - x0, z1 - z0), ox = x + (s - (x1 - x0) * sc) / 2, oy = y + (s - (z1 - z0) * sc) / 2;
  ctx.fillStyle = 'rgba(16,24,40,.55)'; rrect(x - 6, y - 6, s + 12, s + 12, 10); ctx.fill(); ctx.lineWidth = 4 * k; ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); let pen = false; S.forEach((p, i) => { const px = ox + (p.x - x0) * sc, py = oy + (p.z - z0) * sc; if (p.gap) { pen = false; return; } pen ? ctx.lineTo(px, py) : ctx.moveTo(px, py); pen = true; }); ctx.stroke();
  ctx.lineWidth = 2 * k; ctx.strokeStyle = '#ffd040'; ctx.beginPath(); S.forEach((p, i) => { if (!p.gap) return; const px = ox + (p.x - x0) * sc, py = oy + (p.z - z0) * sc; ctx.moveTo(px - 1, py); ctx.lineTo(px + 1, py); }); ctx.stroke();
  for (const q of G.karts) { if (q.me) continue; ctx.fillStyle = hex(q.who.col); ctx.beginPath(); ctx.arc(ox + (q.x - x0) * sc, oy + (q.z - z0) * sc, 3.2 * k, 0, TAU); ctx.fill(); }
  const m = G.me; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(ox + (m.x - x0) * sc, oy + (m.z - z0) * sc, 5 * k, 0, TAU); ctx.fill(); ctx.stroke(); }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) {
  const D = G.lesson, st = D.steps[D.i], x = 12, w = W - 24, y = 48 * k; ctx.save();
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; const lines = wrapText(st.how, w - 24), h = 50 * k + lines.length * 17 * k;
  ctx.fillStyle = 'rgba(16,24,40,.88)'; rrect(x, y, w, h, 12); ctx.fill(); ctx.strokeStyle = 'rgba(255,176,32,.7)'; ctx.lineWidth = 2; rrect(x, y, w, h, 12); ctx.stroke();
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#ffd080'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillText(`LESSON ${G.N} OF 3` + (st.need > 1 ? ` · ${D.n} OF ${st.need}` : ''), x + 12, y + 9 * k);
  ctx.fillStyle = '#fff'; ctx.font = `400 ${Math.round(16 * k)}px ${TF}`; ctx.fillText(st.title, x + 12, y + 23 * k);
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.92)'; lines.forEach((l, i) => ctx.fillText(l, x + 12, y + 46 * k + i * 17 * k));
  ctx.restore(); ctx.textBaseline = 'middle';
}
