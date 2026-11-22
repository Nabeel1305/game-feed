// ===================== THE VIEW: Santa's Round (sideways) =====================
// Outside: a snowy village at night under the northern lights; houses with glowing windows and lights along the eaves; the
// next house's roof marker glows; delivered houses glow gold. The sleigh and its reindeer, seen from behind and above.
// Inside: the living room from above: the tree, the fire and the stockings, furniture, someone asleep, perhaps a cat.
const FX = { shake: 0, stop: 0, flash: 0, red: 0, slow: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { snap: true, banner: null, stick: null, btn: {}, landId: null, cam: null, sackR: [] };
const optShake = () => store.get('shake', true) !== false, optSlow = () => store.get('slow', true) !== false;
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip2(key, txt, secs = 3) { if (HEADLESS) return; tip2.seen = tip2.seen || {}; if (tip2.seen[key]) return; tip2.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 160) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40 * k, t: 0, life: 0.6 + Math.random() * 0.6, col, r: (1.5 + Math.random() * 3) * k }); } if (PARTS.length > 260) PARTS.splice(0, PARTS.length - 260); }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2.5); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.4) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 120 * k * dt; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (ui.banner) { ui.banner.t += dt; if (ui.banner.t > (ui.banner.secs || 1.6)) ui.banner = null; }
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; } }
function mySkin() { if (typeof HEADLESS !== 'undefined' && HEADLESS) return SKINS[0]; const id = store.get('skin', 'red'); return SKINS.find(q => q.id === id) || SKINS[0]; }
const GIFT = id => GIFTS.find(g => g.id === id) || GIFTS[0];
const ROOMX = 600;      // the inside of a house is built far from the village
function buildWorld() {
  if (V3) return V3; const T = window.THREE; if (!T || !W3 || !W3.init({ canvas: $('gl'), fov: 55, far: 900, near: 0.2, dims: () => [W, H] })) { V3 = { none: true }; return V3; }
  V3 = { T, S: W3.scene, t: 0, for: null, room: null, roomFor: null }; const V = V3, M = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.8 }, o)); V.M = M; const S = V.S;
  V.boxG = new T.BoxGeometry(1, 1, 1); V.sphG = new T.SphereGeometry(1, 14, 10); V.coneG = new T.ConeGeometry(1, 1, 8); V.cylG = new T.CylinderGeometry(1, 1, 1, 12);
  const ground = new T.Mesh(new T.PlaneGeometry(900, 900), M(0xe8eef8, { roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; S.add(ground);
  // falling snow
  { const n = 1400, g = new T.BufferGeometry(), p = new Float32Array(n * 3); for (let i = 0; i < n; i++) { p[i * 3] = (Math.random() - 0.5) * 120; p[i * 3 + 1] = Math.random() * 40; p[i * 3 + 2] = (Math.random() - 0.5) * 120; } g.setAttribute('position', new T.BufferAttribute(p, 3));
    V.snow = new T.Points(g, new T.PointsMaterial({ color: 0xffffff, size: 0.25, transparent: true, opacity: 0.85, depthWrite: false })); S.add(V.snow); }
  // the northern lights: soft green and violet curtains high in the sky
  V.aur = []; for (let i = 0; i < 3; i++) { const c = document.createElement('canvas'); c.width = 4; c.height = 64; const g2 = c.getContext('2d'), gr = g2.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, 'rgba(120,80,220,0)'); gr.addColorStop(0.35, i === 1 ? 'rgba(160,90,255,.55)' : 'rgba(60,255,160,.6)'); gr.addColorStop(1, 'rgba(40,200,140,0)'); g2.fillStyle = gr; g2.fillRect(0, 0, 4, 64);
    const geo = new T.PlaneGeometry(260, 60, 40, 1), m = new T.Mesh(geo, new T.MeshBasicMaterial({ map: new T.CanvasTexture(c), transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false })); m.position.set(-40 + i * 50, 75 + i * 8, 180 + i * 30); m.rotation.y = 0.3 * (i - 1); S.add(m); V.aur.push(m); }
  V.sleigh = sleigh(V, mySkin()); S.add(V.sleigh.g);
  V.ring = new T.Mesh(new T.TorusGeometry(1, 0.08, 8, 40), new T.MeshBasicMaterial({ color: 0x8affc0, transparent: true, opacity: 0.9 })); V.ring.rotation.x = Math.PI / 2; S.add(V.ring);
  V.beam = new T.Mesh(new T.CylinderGeometry(0.2, 0.6, 30, 10, 1, true), new T.MeshBasicMaterial({ color: 0x8affc0, transparent: true, opacity: 0.18, depthWrite: false, blending: T.AdditiveBlending })); S.add(V.beam);
  W3.setQuality(stepN); return V; }
function sleigh(V, sk) { const T = V.T, M = V.M, g = new T.Group(); const body = new T.Mesh(V.boxG, M(sk.col, { roughness: 0.4 })); body.scale.set(1.6, 0.9, 2.4); body.position.y = 0.6; g.add(body); const trim = new T.Mesh(V.boxG, M(sk.col2, { metalness: 0.4, roughness: 0.3 })); trim.scale.set(1.7, 0.15, 2.5); trim.position.y = 1.05; g.add(trim);
  for (const x of [-0.7, 0.7]) { const run = new T.Mesh(V.boxG, M(0xd8c070, { metalness: 0.6 })); run.scale.set(0.1, 0.1, 3); run.position.set(x, 0.05, 0.2); g.add(run); }
  const santa = new T.Group(); santa.position.set(0, 1.2, -0.4); g.add(santa); const coat = new T.Mesh(V.sphG, M(0xc8202a)); coat.scale.set(0.55, 0.6, 0.5); santa.add(coat); const head = new T.Mesh(V.sphG, M(0xf0c8a0)); head.scale.setScalar(0.25); head.position.y = 0.7; santa.add(head);
  const beard = new T.Mesh(V.sphG, M(0xffffff)); beard.scale.set(0.24, 0.22, 0.18); beard.position.set(0, 0.58, 0.18); santa.add(beard); const hat = new T.Mesh(V.coneG, M(0xc8202a)); hat.scale.set(0.24, 0.45, 0.24); hat.position.y = 1.0; santa.add(hat);
  const sack = new T.Mesh(V.sphG, M(0x8a5a2a)); sack.scale.set(0.5, 0.5, 0.5); sack.position.set(0, 1.3, -0.95); g.add(sack);
  const deer = []; for (let i = 0; i < 2; i++) for (const x of [-0.5, 0.5]) { const d = new T.Group(); d.position.set(x, 0.8, 3 + i * 2); const b = new T.Mesh(V.boxG, M(0x8a5a32)); b.scale.set(0.45, 0.55, 1.2); d.add(b); const h = new T.Mesh(V.boxG, M(0x8a5a32)); h.scale.set(0.3, 0.35, 0.5); h.position.set(0, 0.5, 0.65); d.add(h);
    if (i === 1 && x < 0) { const nose = new T.Mesh(V.sphG, new T.MeshBasicMaterial({ color: 0xff2020 })); nose.scale.setScalar(0.1); nose.position.set(0, 0.5, 0.95); d.add(nose); } g.add(d); deer.push(d); }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return { g, santa, deer }; }
// the village for this level
function buildVillage(V, G) { const T = V.T, M = V.M; if (V.vg) { V.S.remove(V.vg); } const vg = new T.Group(); V.vg = vg; V.S.add(vg); V.hx = [];
  const wins = new T.MeshBasicMaterial({ color: 0xffd27a }), lightsC = [0xff4040, 0x40ff60, 0x4080ff, 0xffd040];
  for (const H of G.V) { const g = new T.Group(); g.position.set(-H.x, 0, H.z); vg.add(g);
    const wall = new T.Mesh(V.boxG, M([0xc8a88a, 0x9ab0c8, 0xd8c8a8, 0xb88a7a][H.i % 4])); wall.scale.set(H.w, H.h, H.d); wall.position.y = H.h / 2; wall.castShadow = wall.receiveShadow = true; g.add(wall);
    const roofG = new T.CylinderGeometry(0.01, H.w * 0.62, 2.6, 4, 1); const roof = new T.Mesh(roofG, M(0x6a3a2a)); roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, H.d / H.w * 1.0); roof.position.y = H.h + 1.3; roof.castShadow = true; g.add(roof);
    const snowR = new T.Mesh(roofG, M(0xffffff)); snowR.rotation.y = Math.PI / 4; snowR.scale.set(1.02, 0.5, H.d / H.w * 1.02); snowR.position.y = H.h + 2.0; g.add(snowR);
    const ch = new T.Mesh(V.boxG, M(0x8a3a2a)); ch.scale.set(H.narrow ? 0.6 : 1, 1.8, H.narrow ? 0.6 : 1); ch.position.set(H.mx - H.x > 0 ? -1.6 : 1.6, H.h + 2.3, 0); g.add(ch);
    for (let k2 = 0; k2 < (H.apt ? 8 : 4); k2++) { const w = new T.Mesh(new T.PlaneGeometry(0.9, 1.1), wins); w.position.set(-H.w / 2 + 1.4 + (k2 % 4) * 1.75, 1.6 + Math.floor(k2 / 4) * 3.5, -H.d / 2 - 0.02); w.rotation.y = Math.PI; g.add(w); }
    for (let k2 = 0; k2 < 12; k2++) { const l = new T.Mesh(V.sphG, new T.MeshBasicMaterial({ color: lightsC[k2 % 4] })); l.scale.setScalar(0.12); l.position.set(-H.w / 2 + k2 * H.w / 11, H.h + 0.1, -H.d / 2 - 0.1); g.add(l); }
    const glow = new T.Mesh(new T.RingGeometry(H.w * 0.7, H.w * 0.85, 40), new T.MeshBasicMaterial({ color: 0xffd36a, transparent: true, opacity: 0, side: T.DoubleSide })); glow.rotation.x = -Math.PI / 2; glow.position.y = 0.05; g.add(glow);
    if (H.slippery) { const ice = new T.Mesh(roofG, new T.MeshStandardMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.45, roughness: 0.05, metalness: 0.3 })); ice.rotation.y = Math.PI / 4; ice.scale.set(1.04, 0.52, H.d / H.w * 1.04); ice.position.y = H.h + 2.02; g.add(ice); }
    V.hx.push({ H, glow }); }
  for (let i = 0; i < 60; i++) { const R2 = rng(i * 17 + G.N), x = (R2() - 0.5) * 200, z = -30 + R2() * 170; if (G.V.some(h => Math.abs(-x - h.x) < 7 && Math.abs(z - h.z) < 7)) continue; const t = new T.Group(); const c = new T.Mesh(V.coneG, M(0x1a4a2a)); c.scale.set(1.6, 4, 1.6); c.position.y = 2.6; t.add(c); const s = new T.Mesh(V.coneG, M(0xffffff)); s.scale.set(1.0, 1.2, 1.0); s.position.y = 4.3; t.add(s); t.position.set(x, 0, z); vg.add(t); } }
// the room of a house
function buildRoom(V, H) { const T = V.T, M = V.M; if (V.room) V.S.remove(V.room.g); const R = H.room, g = new T.Group(); g.position.set(ROOMX, 0, 0); V.S.add(g);
  const P = (x, z) => [x - R.W / 2 + 0.5, z - R.D / 2 + 0.5];
  for (let z = 1; z < R.D - 1; z++) for (let x = 1; x < R.W - 1; x++) { const cr = R.creak.some(c => c.x === x && c.z === z), f = new T.Mesh(V.boxG, M(cr ? 0x5a3a22 : (x + z) % 2 ? 0xa8784a : 0x9a6c42, { roughness: 0.9 })); const [px, pz] = P(x, z); f.scale.set(0.98, 0.1, 0.98); f.position.set(-px, -0.05, pz); f.receiveShadow = true; g.add(f); }
  for (const [w, d, x, z] of [[R.W, 0.2, 0, -R.D / 2 + 0.5], [0.2, R.D, R.W / 2 - 0.5, 0], [0.2, R.D, -R.W / 2 + 0.5, 0]]) { const m = new T.Mesh(V.boxG, M(0xd8c8a0)); m.scale.set(w, 2.6, d); m.position.set(-x, 1.3, z); g.add(m); }
  { const [fx, fz] = P(R.fire.x, R.fire.z); const fp = new T.Mesh(V.boxG, M(0x8a4a3a)); fp.scale.set(2.2, 1.4, 0.8); fp.position.set(-fx, 0.7, fz - 0.2); g.add(fp); const fire = new T.Mesh(V.sphG, new T.MeshBasicMaterial({ color: 0xff8a2a })); fire.scale.set(0.5, 0.35, 0.2); fire.position.set(-fx, 0.35, fz + 0.15); g.add(fire); V.fireM = fire; const lt = new T.PointLight(0xff9a4a, 6, 8); lt.position.set(-fx, 1, fz + 0.8); g.add(lt); }
  const stockM = R.stock.map(s => { const [sx, sz] = P(s.x, s.z); const m = new T.Mesh(V.boxG, M(0xc8202a)); m.scale.set(0.3, 0.5, 0.15); m.position.set(-sx, 1.0, sz + 0.3); g.add(m); const top = new T.Mesh(V.boxG, M(0xffffff)); top.scale.set(0.34, 0.12, 0.17); top.position.set(-sx, 1.25, sz + 0.3); g.add(top); return { s, m }; });
  { const [tx, tz] = P(R.tree.x, R.tree.z); for (let i = 0; i < 3; i++) { const c = new T.Mesh(V.coneG, M(0x1a6a2a)); c.scale.set(0.9 - i * 0.22, 0.9, 0.9 - i * 0.22); c.position.set(-tx, 0.6 + i * 0.55, tz); c.castShadow = true; g.add(c); } const star = new T.Mesh(V.sphG, new T.MeshBasicMaterial({ color: 0xffe060 })); star.scale.setScalar(0.15); star.position.set(-tx, 2.1, tz); g.add(star);
    for (let i = 0; i < 14; i++) { const b = new T.Mesh(V.sphG, new T.MeshBasicMaterial({ color: [0xff4040, 0x40ff60, 0x4080ff, 0xffd040][i % 4] })); b.scale.setScalar(0.06); const a = i * 1.7, y = 0.4 + (i / 14) * 1.5, r = 0.75 - y * 0.3; b.position.set(-tx + Math.cos(a) * r, y, tz + Math.sin(a) * r); g.add(b); } }
  for (const f of R.furn) { const [x, z] = P(f.x, f.z); const c = { sofa: 0x5a6a9a, table: 0x8a5a32, chair: 0x9a7a4a, lamp: 0xe8d8a0, box: 0xc8a070 }[f.kind], h = { sofa: 0.7, table: 0.6, chair: 0.8, lamp: 1.4, box: 0.5 }[f.kind]; const m = new T.Mesh(V.boxG, M(c)); m.scale.set(0.9, h, 0.9); m.position.set(-x, h / 2, z); m.castShadow = true; g.add(m); }
  let sleeper = null; if (R.sl) { const [x, z] = P(R.sl.x, R.sl.z); const ch = new T.Mesh(V.boxG, M(0x7a3a4a)); ch.scale.set(0.95, 0.6, 0.95); ch.position.set(-x, 0.3, z); g.add(ch); const b = new T.Mesh(V.sphG, M(0x4a6aa8)); b.scale.set(0.3, 0.35, 0.28); b.position.set(-x, 0.85, z); g.add(b); const hd = new T.Mesh(V.sphG, M(0xf0c8a0)); hd.scale.setScalar(0.17); hd.position.set(-x, 1.3, z); g.add(hd); const cap = new T.Mesh(V.coneG, M(0x2a8a4a)); cap.scale.set(0.15, 0.3, 0.15); cap.position.set(-x, 1.5, z); g.add(cap); sleeper = { b, hd, x, z }; }
  let cat = null; if (R.cat) { cat = new T.Group(); const b = new T.Mesh(V.sphG, M(0x2a2a2a)); b.scale.set(0.18, 0.15, 0.3); b.position.y = 0.15; cat.add(b); const h = new T.Mesh(V.sphG, M(0x2a2a2a)); h.scale.setScalar(0.12); h.position.set(0, 0.28, 0.28); cat.add(h); for (const sx of [-0.06, 0.06]) { const e = new T.Mesh(V.coneG, M(0x2a2a2a)); e.scale.set(0.04, 0.08, 0.04); e.position.set(sx, 0.4, 0.28); cat.add(e); } g.add(cat); }
  const me = new T.Group(); const coat = new T.Mesh(V.sphG, M(0xc8202a)); coat.scale.set(0.32, 0.4, 0.3); coat.position.y = 0.45; me.add(coat); const hd = new T.Mesh(V.sphG, M(0xf0c8a0)); hd.scale.setScalar(0.16); hd.position.y = 0.95; me.add(hd); const bd = new T.Mesh(V.sphG, M(0xffffff)); bd.scale.set(0.15, 0.14, 0.1); bd.position.set(0, 0.85, 0.12); me.add(bd); const hat = new T.Mesh(V.coneG, M(0xc8202a)); hat.scale.set(0.16, 0.3, 0.16); hat.position.y = 1.18; me.add(hat); g.add(me);
  const gifts = new T.Group(); g.add(gifts);
  V.room = { g, H, P, me, cat, sleeper, stockM, gifts, n: -1 }; V.roomFor = H; }
function sync(V, G, dt) { V.t += dt; const T = V.T, s = G.s;
  if (V.for !== G.N) { V.for = G.N; W3.setSky('night'); buildVillage(V, G); const sk = mySkin(); V.S.remove(V.sleigh.g); V.sleigh = sleigh(V, sk); V.S.add(V.sleigh.g); ui.cam = null; V.room = null; V.roomFor = null; }
  const inside = G.phase === 'in' && G.in;
  // snow and the aurora drift
  { const p = V.snow.geometry.attributes.position.array, cx = inside ? ROOMX : -s.x, cz = inside ? 0 : s.z; for (let i = 0; i < p.length; i += 3) { p[i + 1] -= dt * 2.2; p[i] += Math.sin(V.t + i) * dt * 0.3; if (p[i + 1] < 0) { p[i + 1] = 30 + Math.random() * 10; p[i] = cx + (Math.random() - 0.5) * 100; p[i + 2] = cz + (Math.random() - 0.5) * 100; } } V.snow.geometry.attributes.position.needsUpdate = true; V.snow.visible = !inside; }
  V.aur.forEach(m => m.visible = optSlow()); V.aur.forEach((m, i) => { const pa = m.geometry.attributes.position; for (let j = 0; j < pa.count; j++) { const x = pa.getX(j); pa.setZ(j, Math.sin(x * 0.04 + V.t * 0.3 + i) * 8); } pa.needsUpdate = true; m.position.x = -s.x * 0.2 - 40 + i * 50; });
  for (const q of V.hx) q.glow.material.opacity = G.done.includes(q.H.i) ? 0.6 + Math.sin(V.t * 3) * 0.2 : 0;
  // the next house: a glowing marker on its roof, a soft beam of light above it
  const next = G.V.filter(h => !G.done.includes(h.i)); let tgt = null, best = 1e9; for (const h of next) { const d = Math.hypot(h.x - s.x, h.z - s.z); if (d < best) { best = d; tgt = h; } } ui.tgt = tgt;
  V.ring.visible = V.beam.visible = !!tgt && !inside; if (tgt) { const r = G.cfg.marker; V.ring.scale.setScalar(r); V.ring.position.set(-tgt.mx, tgt.top + 0.05, tgt.mz); V.beam.position.set(-tgt.mx, tgt.top + 15, tgt.mz); V.ring.material.color.setHex(G.landHeld ? 0xffd36a : 0x8affc0); }
  // the sleigh
  const sl = V.sleigh; sl.g.visible = !inside; sl.g.position.set(-s.x, s.y + (G.phase === 'fly' ? Math.sin(V.t * 3) * 0.1 : 0), s.z); sl.g.rotation.set(G.landHeld && G.phase === 'fly' ? 0.12 : 0, -s.yaw, 0); sl.deer.forEach((d, i) => d.position.y = 0.8 + Math.abs(Math.sin(V.t * 6 + i)) * 0.2);
  if (G.phase === 'roof' && G.roof) { const r = G.roof; if (r.slip != null && r.slip < 0.8) sl.g.position.y -= Math.min(1.5, r.t * 0.4); }
  // the room
  if (inside) { if (V.roomFor !== G.in.H) buildRoom(V, G.in.H); const Rm = V.room, I = G.in, [mx, mz] = Rm.P(I.x, I.z); Rm.g.visible = true; Rm.me.position.set(-mx, 0, mz); Rm.me.rotation.y = -I.face; Rm.me.position.y = Math.abs(Math.sin(V.t * (Math.hypot(G.stick.x, G.stick.y) > 0.7 ? 14 : 8))) * 0.06 * (Math.hypot(G.stick.x, G.stick.y) > 0.15 ? 1 : 0);
    if (Rm.cat) { const C = I.H.room.cat, [cx, cz] = Rm.P(C.x, C.z); Rm.cat.position.set(-cx, 0, cz); Rm.cat.rotation.y = Math.atan2(-(C.tx - C.x), C.tz - C.z); }
    if (Rm.sleeper) { const st = I.stir ? Math.sin(V.t * 12) * 0.08 : 0; Rm.sleeper.hd.position.x = -Rm.sleeper.x * 0 + Rm.sleeper.hd.position.x * 0 - Rm.sleeper.x + st; }
    Rm.stockM.forEach(q => { q.m.scale.y = q.s.full ? 0.75 : 0.5; q.m.material.color.setHex(q.s.full ? 0xe8303a : 0xb81a2a); });
    if (Rm.n !== I.placed.length) { Rm.n = I.placed.length; while (Rm.gifts.children.length) Rm.gifts.remove(Rm.gifts.children[0]); const [tx, tz] = Rm.P(I.H.room.tree.x, I.H.room.tree.z); I.placed.forEach((id, j) => { const c = [0xd83a3a, 0x3a8ad8, 0x3ab85a, 0xd8b83a, 0xa83ad8][GIFTS.findIndex(g => g.id === id) % 5], b = new T.Mesh(V.boxG, V.M(c)); b.scale.setScalar(0.32); const a = j * 1.3 + 0.5; b.position.set(-tx + Math.cos(a) * 0.65, 0.16, tz + Math.sin(a) * 0.65); Rm.gifts.add(b); const rb = new T.Mesh(V.boxG, V.M(0xffffff)); rb.scale.set(0.34, 0.06, 0.06); rb.position.copy(b.position); rb.position.y = 0.33; Rm.gifts.add(rb); }); }
    if (V.fireM) V.fireM.scale.y = 0.35 + Math.sin(V.t * 11) * 0.05; }
  else if (V.room) V.room.g.visible = false;
  // the camera
  let want; if (inside) { const I = G.in, [mx, mz] = V.room.P(I.x, I.z); want = { pos: [ROOMX - mx * 0.3, 8.5, mz * 0.3 + 5.6], at: [ROOMX - mx * 0.2, 0, mz * 0.2 + 0.4] }; }
  else if (G.phase === 'roof') want = { pos: [-s.x + 3, s.y + 4, s.z - 7], at: [-s.x, s.y, s.z] };
  else { const bx = Math.sin(s.yaw), bz = Math.cos(s.yaw); want = { pos: [-(s.x - bx * 11), s.y + 6.5, s.z - bz * 11], at: [-(s.x + bx * 8), s.y - 3, s.z + bz * 8] }; }
  if (!ui.cam || ui.snap || ui.wasIn !== !!inside) { ui.cam = { pos: want.pos.slice(), at: want.at.slice() }; ui.snap = false; } else { const a = Math.min(1, dt * 3.5); for (let i = 0; i < 3; i++) { ui.cam.pos[i] += (want.pos[i] - ui.cam.pos[i]) * a; ui.cam.at[i] += (want.at[i] - ui.cam.at[i]) * a; } }
  ui.wasIn = !!inside;
  const sk = FX.shake > 0 && optShake() ? (Math.random() - 0.5) * FX.shake * 0.02 : 0, cam = W3.cam; cam.position.set(ui.cam.pos[0] + sk, ui.cam.pos[1] + sk, ui.cam.pos[2]); cam.lookAt(ui.cam.at[0], ui.cam.at[1], ui.cam.at[2]); cam.updateMatrixWorld();
  W3.setFocus(ui.cam.at[0], ui.cam.at[1], ui.cam.at[2], inside ? 10 : 30); }
function scrOf(x, y, z) { if (!V3 || V3.none) return null; return W3.screen(new V3.T.Vector3(x, y, z)); }
// ---------- events ----------
function onEvent(G, e) {
  switch (e.k) {
    case 'land': sfx.land(); vibe(HAP.light); ui.banner = { txt: `THE ${G.V[e.i].fam.toUpperCase()}S`, sub: e.slippery ? 'Icy roof! Push up to hold the sleigh' : e.narrow ? 'A narrow chimney: tap ACT to wriggle down' : 'Down the chimney…', t: 0, secs: 1.6, small: true }; break;
    case 'bounce': sfx.no(); hint = { txt: e.why === 'done' ? 'Already delivered there: on to the next one!' : 'Missed the marker: come round and hold LAND right over the glowing ring.', t: 0, secs: 2.4 }; vibe(HAP.light); break;
    case 'slid': sfx.slip(); hint = { txt: 'The sleigh slid off the icy roof! Push up as soon as you land.', t: 0, secs: 2.6 }; break;
    case 'squeeze': sfx.thump(); vibe(HAP.light); break;
    case 'enter': sfx.chimney(); ui.snap = true; tip2('inside', 'Tiptoe: push gently. Read the wish list, tap a present in your sack, then ACT by the tree.', 4); break;
    case 'hold': sfx.click(); break;
    case 'place': sfx.place(e.ok); say(e.ok ? 'UNDER THE TREE!' : 'HMM, THAT ONE?', W / 2, H * 0.3, e.ok ? '#8fe0ab' : '#ffd0a0', 22); if (!e.ok) hint = { txt: 'Nobody here wished for that. ACT by the tree with empty hands to pick it back up.', t: 0, secs: 3 }; break;
    case 'pick': sfx.click(); break;
    case 'stocking': sfx.stocking(); say(`${e.name}'s stocking!`, W / 2, H * 0.3, '#ffd36a', 22); vibe(HAP.light); break;
    case 'notyet': sfx.no(); hint = { txt: 'Not yet: ' + e.what.join(', ') + '.', t: 0, secs: 3 }; break;
    case 'delivered': sfx.delivered(); vibe(HAP.thud); ui.banner = { txt: 'DELIVERED!', sub: `${e.n} of ${G.V.length} houses`, t: 0, secs: 1.8 }; ui.snap = true; burst(W / 2, H * 0.4, '#ffd36a', 30, 220); break;
    case 'bump': sfx.bump(); FX.shake = 4; break;
    case 'creak': sfx.creak(); tip2('creak', 'Creak! The dark boards creak: step round them.', 3); break;
    case 'meow': sfx.meow(); tip2('cat', 'The cat is curious! ACT near it to toss it a toy.', 3); break;
    case 'toy': sfx.toy(); say('A TOY MOUSE!', W / 2, H * 0.3, '#ffd36a', 20); break;
    case 'wake': sfx.wake(); FX.red = 0.6; ui.banner = { txt: 'SOMEONE WOKE UP!', sub: 'Back up the chimney: this house starts again', t: 0, secs: 2.4, small: true }; ui.snap = true; break;
    case 'lessonnext': if (e.first) hint = null; say('FIRST, A LESSON', W / 2, H * 0.36, '#ffd36a', 24); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, W / 2, H * 0.42, '#8fe0ab', 24); sfx.coin(e.n); break;
    case 'lessonmiss': hint = { txt: e.how, t: 0, secs: 3.2 }; break;
    case 'lessondone': say('NOW THE ROUND!', W / 2, H * 0.36, '#ffd36a', 24); sfx.fanfare(); ui.snap = true; if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.fanfare(); FX.flash = 0.5; vibe(HAP.best); break;
    case 'lost': sfx.lose(); ui.banner = { txt: 'DAWN!', sub: 'The sun is coming up', t: 0, secs: 2 }; break;      // (P11: never vibrate on failure)
  } }
// ---------- the picture ----------
let IG = null, IM = {}; function idleG() { if (!IG || IG.over || IG.t > 60) { IG = newGame(6, { seed: (Math.random() * 1e6) | 0, free: true }); IM = {}; } honest(IG, { react: 0.2, acc: 0.95 }, IM); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#0a1a36'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D village.', W / 2, H / 2); if (G) hud(G, now); return; }
  const g = G || idleG(); sync(V, g, dt || 1 / 60); W3.render(dt || 1 / 60);
  if (FX.red > 0) { ctx.fillStyle = `rgba(200,40,30,${FX.red * 0.2})`; ctx.fillRect(0, 0, W, H); }
  if (G && !(G.over && !$('ovEnd').classList.contains('hidden'))) hud(G, now);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 1.1 ? 1 : 1 - (t2.t - 1.1) / 0.5; ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(t2.size * k)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(10,20,50,.75)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 18); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 18); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, Math.min(W - 380 * k, 420 * k)), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30, hy = H * 0.62 - h / 2;
    ctx.fillStyle = 'rgba(10,20,50,.92)'; rrect(W / 2 - w / 2, hy - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, hy - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,250,230,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); } }
// ---------- the HUD ----------
function layout(G) { return { btn: { x: W - 86 * k, y: H - 88 * k, r: 60 * k } }; }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of String(t).split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function txt(s, x, y, col = '#fff', font, al = 'center') { ctx.textAlign = al; if (font) ctx.font = font; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(10,20,50,.75)'; ctx.strokeText(s, x, y); ctx.fillStyle = col; ctx.fillText(s, x, y); }
function hud(G, now) { ctx.textBaseline = 'middle'; const L = layout(G);
  // the night: the moon sets as dawn comes; houses done
  { const y = 20 * k, u = G.free || G.lesson ? 0 : clamp(G.clock / G.dawn, 0, 1); ctx.fillStyle = 'rgba(10,20,50,.6)'; rrect(W / 2 - 150 * k, y - 15 * k, 300 * k, 30 * k, 12); ctx.fill();
    const gr = ctx.createLinearGradient(W / 2 - 90 * k, 0, W / 2 + 60 * k, 0); gr.addColorStop(0, '#2a3a7a'); gr.addColorStop(1, '#ffb070'); ctx.fillStyle = 'rgba(255,255,255,.15)'; rrect(W / 2 - 90 * k, y - 4 * k, 150 * k, 8 * k, 4); ctx.fill(); ctx.fillStyle = gr; rrect(W / 2 - 90 * k, y - 4 * k, 150 * k * u, 8 * k, 4); ctx.fill();
    txt(G.free || G.lesson ? '🌙 no rush' : u > 0.8 ? '🌅 dawn is coming!' : '🌙', W / 2 - 118 * k, y + 1, u > 0.8 ? '#ffb070' : '#fff', `700 ${Math.round(13 * k)}px ${BC}`, 'left');
    txt(`🏠 ${G.done.length} / ${G.V.length}`, W / 2 + 108 * k, y + 1, '#fff', `700 ${Math.round(14 * k)}px ${BC}`); }
  // the list: houses to visit (outside); the wish list, stockings and noise (inside)
  if (G.phase !== 'in') { let y = 52 * k; ctx.fillStyle = 'rgba(10,20,50,.6)'; rrect(10 * k, y - 14 * k, 150 * k, (G.V.length + 1) * 18 * k + 8 * k, 10); ctx.fill(); txt('TONIGHT', 18 * k, y, '#ffd36a', `700 ${Math.round(11 * k)}px ${BC}`, 'left');
    G.V.forEach((h, i) => { y += 18 * k; const d = G.done.includes(h.i), next = ui.tgt === h; txt(`${d ? '✓' : next ? '➤' : '•'} The ${h.fam}s (${h.mem.length})`, 18 * k, y, d ? '#8fe0ab' : next ? '#ffd36a' : '#fff', `700 ${Math.round(12 * k)}px ${BC}`, 'left'); });
    for (const h of G.V) { if (G.done.includes(h.i)) continue; const p = scrOf(-h.x, h.top + 3.2, h.z); if (p && p.front && p.x > 0 && p.x < W) txt(`The ${h.fam}s`, p.x, p.y, ui.tgt === h ? '#ffd36a' : 'rgba(255,255,255,.75)', `700 ${Math.round(12 * k)}px ${BC}`); }
    if (G.phase === 'roof' && G.roof) { const r = G.roof; if (r.slip != null && r.slip < 0.8) txt('ICY! PUSH UP!', W / 2, H * 0.4, '#bfe8ff', `700 ${Math.round(24 * k)}px ${TF}`); else if (r.narrow) txt(`TAP ACT TO WRIGGLE DOWN (${r.squeeze}/3)`, W / 2, H * 0.4, '#ffd36a', `700 ${Math.round(20 * k)}px ${TF}`); } }
  else { const I = G.in; let y = 50 * k; const hgt = (I.H.mem.length + 2) * 19 * k + 10 * k; ctx.fillStyle = 'rgba(10,20,50,.7)'; rrect(10 * k, y - 14 * k, 176 * k, hgt, 10); ctx.fill(); txt(`THE ${I.H.fam.toUpperCase()}S WISH FOR`, 18 * k, y, '#ffd36a', `700 ${Math.round(11 * k)}px ${BC}`, 'left');
    const left = wantsLeft(I).slice(); I.H.mem.forEach(m => { y += 19 * k; const got = !left.includes(m.wish) || (left.splice(left.indexOf(m.wish), 1), false); const st = I.H.room.stock.find(s => s.name === m.name); txt(`${got ? '✓' : ' '} ${m.name}: ${GIFT(m.wish).icon} ${GIFT(m.wish).name}`, 18 * k, y, got ? '#8fe0ab' : '#fff', `700 ${Math.round(12 * k)}px ${BC}`, 'left'); txt(st && st.full ? '🧦✓' : '🧦', 176 * k, y, st && st.full ? '#8fe0ab' : 'rgba(255,255,255,.6)', `700 ${Math.round(11 * k)}px ${BC}`, 'right'); });
    // the noise meter
    const nx = W - 34 * k, ny = H * 0.22; txt('noise', nx, ny - 14 * k, 'rgba(255,255,255,.85)', `700 ${Math.round(11 * k)}px ${BC}`); ctx.fillStyle = 'rgba(10,20,50,.6)'; rrect(nx - 9 * k, ny, 18 * k, 110 * k, 7); ctx.fill(); const n = clamp(I.noise, 0, 1); ctx.fillStyle = n > 0.6 ? '#ff6a4a' : n > 0.3 ? '#ffd36a' : '#8fe0ab'; rrect(nx - 9 * k, ny + 110 * k * (1 - n), 18 * k, 110 * k * n, 7); ctx.fill();
    if (I.stir) txt('💤 stirring…', nx - 20 * k, ny + 128 * k, '#ffb0a0', `700 ${Math.round(12 * k)}px ${BC}`, 'right');
    // the sack: tap a present to hold it
    const sack = I.sack, bw = 44 * k, sx = W / 2 - (sack.length * bw) / 2, sy = H - 34 * k; ui.sackR = [];
    ctx.fillStyle = 'rgba(10,20,50,.6)'; rrect(sx - 8 * k, sy - 26 * k, sack.length * bw + 16 * k, 52 * k, 12); ctx.fill();
    sack.forEach((id, i) => { const x = sx + i * bw + bw / 2, held = I.hold === id; if (held) { ctx.fillStyle = 'rgba(255,211,106,.45)'; rrect(x - bw / 2 + 2, sy - 22 * k, bw - 4, 44 * k, 8); ctx.fill(); } ctx.font = `${Math.round(26 * k)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText(GIFT(id).icon, x, sy); ui.sackR.push({ id, x, y: sy, r: bw / 2 }); });
    txt(I.hold ? `holding: ${GIFT(I.hold).name}` : 'tap a present to hold it', W / 2, sy - 36 * k, '#fff', `700 ${Math.round(12 * k)}px ${BC}`); }
  // the stick
  if (ui.stick) { const s2 = ui.stick, R = 56 * k; ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.beginPath(); ctx.arc(s2.x0, s2.y0, R, 0, TAU); ctx.fill(); const dx = s2.x - s2.x0, dy = s2.y - s2.y0, m = Math.hypot(dx, dy), c = m > R ? R / m : 1; ctx.strokeStyle = 'rgba(255,214,110,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(s2.x0, s2.y0, R * 0.7, 0, TAU); ctx.stroke(); ctx.fillStyle = G.phase === 'in' && m / R > 0.7 ? '#ff8a6a' : 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.arc(s2.x0 + dx * c, s2.y0 + dy * c, 22 * k, 0, TAU); ctx.fill(); if (G.phase === 'in') txt(m / R > 0.7 ? 'RUNNING (noisy)' : 'tiptoe', s2.x0, s2.y0 - R - 12 * k, m / R > 0.7 ? '#ff8a6a' : '#8fe0ab', `700 ${Math.round(11 * k)}px ${BC}`); }
  else if (G.t < 8 || G.lesson) txt(G.phase === 'in' ? 'WALK ◀▶' : 'STEER ◀▶', 110 * k, H - 70 * k, 'rgba(255,255,255,.85)', `700 ${Math.round(13 * k)}px ${BC}`);
  // LAND (outside) / ACT (inside, and in a narrow chimney)
  { const B = L.btn, inside = G.phase === 'in', lab = inside || G.phase === 'roof' && G.roof && G.roof.narrow ? 'ACT' : 'LAND', on = !inside && G.landHeld; ctx.globalAlpha = 0.92; ctx.fillStyle = on ? '#c8202a' : 'rgba(10,20,50,.6)'; ctx.beginPath(); ctx.arc(B.x, B.y, B.r * (on ? 0.94 : 1), 0, TAU); ctx.fill(); ctx.strokeStyle = '#ffd36a'; ctx.lineWidth = 3; ctx.stroke();
    txt(lab, B.x, B.y - 4 * k, '#fff', `700 ${Math.round(22 * k)}px ${TF}`); txt(lab === 'LAND' ? 'hold' : 'tap', B.x, B.y + 18 * k, 'rgba(255,255,255,.85)', `700 ${Math.round(10 * k)}px ${BC}`); ctx.globalAlpha = 1; }
  if (G.lesson) lessonPanel(G);
  if (ui.banner) { const b = ui.banner, a = Math.min(1, b.t / 0.2, ((b.secs || 1.6) - b.t) / 0.4); ctx.globalAlpha = Math.max(0, a); txt(b.txt, W / 2, H * 0.24, '#ffd36a', `700 ${Math.round((b.small ? 26 : 34) * k)}px ${TF}`); if (b.sub) txt(b.sub, W / 2, H * 0.24 + 28 * k, '#fff', `700 ${Math.round(14 * k)}px ${BC}`); ctx.globalAlpha = 1; } }
function lessonPanel(G) { const D = G.lesson, st0 = D.steps[D.i], w = Math.min(W - 400 * k, 380 * k), x = W / 2 - w / 2, y = 44 * k; ctx.save();
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; const lines = wrapText(st0.how, w - 24), h = 50 * k + lines.length * 17 * k;
  ctx.fillStyle = 'rgba(10,20,50,.9)'; rrect(x, y, w, h, 12); ctx.fill(); ctx.strokeStyle = 'rgba(255,211,106,.8)'; ctx.lineWidth = 2; rrect(x, y, w, h, 12); ctx.stroke();
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#ffd36a'; ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillText(`LESSON ${G.N} OF 3`, x + 12, y + 9 * k);
  ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(15 * k)}px ${TF}`; ctx.fillText(st0.title, x + 12, y + 23 * k);
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.92)'; lines.forEach((l, i) => ctx.fillText(l, x + 12, y + 45 * k + i * 17 * k));
  ctx.restore(); ctx.textBaseline = 'middle'; }
