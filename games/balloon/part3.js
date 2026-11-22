// ===================== THE VIEW: Balloon Drift in 3D (three.js; sky, light, land from tools/world3d.js) =====================
// Behind and above your balloon, looking on towards the next X (so the X is always ahead): the patchwork of fields, the crosses
// on the ground, the green landing field with its windsock, pylons and wires, trees, other balloons far off. On top: the wind
// at each height (arrows on the right, turned to match the view), your height and how fast you climb or sink, the fuel, the
// ring on the ground where a marker would land, the 🎯 button.
const FX = { shake: 0, stop: 0, flash: 0, red: 0, slow: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { snap: true, cam: null, banner: null, yaw: 0, touch: null };
function say(txt, x, y, col = '#fff', size = 22) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 140) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60 * k, t: 0, life: 0.5 + Math.random() * 0.5, col, r: (2 + Math.random() * 3) * k }); } }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2.5); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.6) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (ui.banner) { ui.banner.t += dt; if (ui.banner.t > (ui.banner.secs || 2.4)) ui.banner = null; }
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; } }
function mySkin() { if (typeof HEADLESS !== 'undefined' && HEADLESS) return SKINS[0]; const id = store.get('skin', 'sun'); return SKINS.find(q => q.id === id) || SKINS[0]; }
// ---------- the world ----------
function buildWorld() {
  if (V3) return V3; const T = window.THREE; if (!T || !W3 || !W3.init({ canvas: $('gl'), fov: 55, far: 3000, near: 0.5 })) { V3 = { none: true }; return V3; }
  V3 = { T, S: W3.scene, t: 0, for: null }; const V = V3, M = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.8 }, o)); V.M = M;
  W3.scene.children.forEach(o => { if (o.isLineSegments) o.visible = false; });
  V.boxG = new T.BoxGeometry(1, 1, 1); V.cylG = new T.CylinderGeometry(1, 1, 1, 10);
  V.me = makeBalloon(V, mySkin()); V.S.add(V.me.g);
  V.ring = new T.Mesh(new T.RingGeometry(5, 7.5, 32).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: 0xffe040, transparent: true, opacity: 0.85, depthWrite: false })); V.S.add(V.ring);
  V.markers = []; V.decor = []; V.items = [];
  W3.setQuality(stepN); return V; }
function makeBalloon(V, skin) { const T = V.T, g = new T.Group();
  const pts = []; for (let i = 0; i <= 24; i++) { const u = i / 24, a = u * Math.PI; pts.push(new T.Vector2(Math.max(0.6, Math.sin(a) * 9 * (u < 0.5 ? 1 : 1 - (u - 0.5) * 0.9)), -Math.cos(a) * 10.5)); }
  const geo = new T.LatheGeometry(pts.reverse(), 24), cols = new Float32Array(geo.attributes.position.count * 3), cA = new T.Color(skin.top), cB = new T.Color(skin.bot);
  for (let i = 0; i < geo.attributes.position.count; i++) { const x = geo.attributes.position.getX(i), z = geo.attributes.position.getZ(i), a = Math.atan2(z, x), c = Math.floor((a + Math.PI) / (TAU / 12)) % 2 ? cA : cB; cols.set([c.r, c.g, c.b], i * 3); }
  geo.setAttribute('color', new T.BufferAttribute(cols, 3)); const env = new T.Mesh(geo, new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, side: T.DoubleSide })); env.position.y = 18; env.castShadow = true; g.add(env);
  const basket = new T.Mesh(V.boxG, V.M(0x8a6a3a)); basket.scale.set(2.2, 1.6, 2.2); basket.position.y = 1; basket.castShadow = true; g.add(basket);
  const rope = new T.LineSegments(new T.BufferGeometry().setFromPoints([[-1, 1.8, -1], [-2.5, 8, -2.5], [1, 1.8, -1], [2.5, 8, -2.5], [-1, 1.8, 1], [-2.5, 8, 2.5], [1, 1.8, 1], [2.5, 8, 2.5]].map(p => new T.Vector3(...p))), new T.LineBasicMaterial({ color: 0x3a3a3a })); g.add(rope);
  const flame = new T.Mesh(new T.ConeGeometry(0.6, 3.2, 10), new T.MeshBasicMaterial({ color: 0xffa030, transparent: true, opacity: 0.9 })); flame.position.y = 4.4; flame.visible = false; g.add(flame);
  const glow = new T.PointLight(0xffa040, 0, 40); glow.position.y = 6; g.add(glow);
  return { g, env, flame, glow }; }
function buildPlace(V, G) { const T = V.T, P = G.cfg.place, R = rng(G.seed + 5), F = G.F;
  for (const o of V.items) { V.S.remove(o); } V.items = []; const add = o => { V.S.add(o); V.items.push(o); return o; };
  let cx = 0, cz = 0; const all = [F.start].concat(F.T, [F.field]); all.forEach(p => { cx += p.x / all.length; cz += p.z / all.length; });
  const col = (x, z, h) => { const f = Math.floor(x / 60 + 100) + Math.floor(z / 45 + 100) * 3, v = (Math.sin(f * 12.9898) * 43758.5453) % 1, u = Math.abs(v);
    if (P === 2) return [0.62 + u * 0.1, 0.36 + u * 0.06, 0.24]; if (P === 3) return h > 40 ? [0.9, 0.92, 0.95] : [0.32 + u * 0.1, 0.5 + u * 0.1, 0.28];
    if (P === 1) return (Math.floor(x / 6) % 2) ? [0.36, 0.48, 0.22] : [0.52, 0.44, 0.3];
    return u < 0.33 ? [0.42, 0.6, 0.26] : u < 0.66 ? [0.78, 0.7, 0.36] : [0.3, 0.5, 0.24]; };
  add(W3.terrain({ size: 2600, seg: 150, x: cx, z: cz, height: (x, z) => groundAt(G, x, z) + (P === 3 ? Math.max(0, Math.hypot(x - cx, z - cz) - 700) * 0.35 : 0), colour: (x, z, h) => col(x, z, h) }));
  if (P === 4) add(W3.water({ size: 3000, color: 0x2a4a6a, y: 4 }));
  // trees and houses
  const trees = []; for (let i = 0; i < 260; i++) { const x = cx + (R() - 0.5) * 1600, z = cz + (R() - 0.5) * 1600; if (F.T.some(t => Math.hypot(t.x - x, t.z - z) < 50) || Math.hypot(F.field.x - x, F.field.z - z) < 90 || Math.hypot(x, z) < 30) continue; trees.push({ x, y: groundAt(G, x, z), z, s: 1.6 + R() * 1.8, rot: R() * 6, hue: R(), shade: R() }); }
  if (P !== 2) add(W3.pines(trees, { shadow: false }));
  for (let i = 0; i < 24; i++) { const x = cx + (R() - 0.5) * 1400, z = cz + (R() - 0.5) * 1400; if (F.T.some(t => Math.hypot(t.x - x, t.z - z) < 60)) continue; const h = add(new T.Mesh(V.boxG, V.M(0xf0e8d8))); h.scale.set(10, 6, 7); h.position.set(x, groundAt(G, x, z) + 3, z); h.rotation.y = R() * 3; const r = add(new T.Mesh(new T.ConeGeometry(7, 4, 4), V.M(0xb04a3a))); r.position.set(x, groundAt(G, x, z) + 8, z); r.rotation.y = h.rotation.y + Math.PI / 4; }
  // the crosses and their rings
  const xm = new T.MeshBasicMaterial({ color: 0xffffff }), rm = new T.MeshBasicMaterial({ color: 0xff4a3a, transparent: true, opacity: 0.6, side: T.DoubleSide, depthWrite: false });
  V.targets = F.T.map((t, i) => { const g = new T.Group(), y = groundAt(G, t.x, t.z) + 0.4; for (const a of [Math.PI / 4, -Math.PI / 4]) { const bar = new T.Mesh(new T.PlaneGeometry(26, 4).rotateX(-Math.PI / 2), xm); bar.rotation.y = a; g.add(bar); }
    for (const r of [10, 30, 60]) { const ring = new T.Mesh(new T.RingGeometry(r - 0.8, r + 0.8, 48).rotateX(-Math.PI / 2), rm); g.add(ring); } g.position.set(t.x, y, t.z); return add(g); });
  { const f = F.field, y = groundAt(G, f.x, f.z) + 0.3, g = new T.Group(); const sq = new T.Mesh(new T.PlaneGeometry(f.half * 2, f.half * 2).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: 0x5ad06a, transparent: true, opacity: 0.55, depthWrite: false })); g.add(sq);
    const edge = new T.LineLoop(new T.BufferGeometry().setFromPoints([[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => new T.Vector3(a * f.half, 0.3, b * f.half))), new T.LineBasicMaterial({ color: 0xffffff })); g.add(edge);
    const pole = new T.Mesh(V.cylG, V.M(0xdddddd)); pole.scale.set(0.3, 10, 0.3); pole.position.set(f.half - 6, 5, f.half - 6); g.add(pole); V.sock = new T.Mesh(new T.ConeGeometry(1.2, 6, 10, 1, true).rotateZ(Math.PI / 2), V.M(0xff7a1a, { side: T.DoubleSide })); V.sock.position.set(f.half - 6, 9.5, f.half - 6); g.add(V.sock);
    g.position.set(f.x, y, f.z); V.field = add(g); V.field.visible = G.cfg.land; }
  // pylons and wires
  for (const L of F.lines) { const n = 5, pts = []; for (let i = 0; i < n; i++) { const u = i / (n - 1), x = L.x0 + (L.x1 - L.x0) * u, z = L.z0 + (L.z1 - L.z0) * u, y = groundAt(G, x, z); const p = add(new T.Mesh(V.boxG, V.M(0x8a8a8a, { metalness: 0.5 }))); p.scale.set(1.2, L.h + 3, 1.2); p.position.set(x, y + (L.h + 3) / 2, z); const arm = add(new T.Mesh(V.boxG, V.M(0x8a8a8a))); arm.scale.set(8, 0.6, 0.6); arm.position.set(x, y + L.h + 2, z); arm.rotation.y = -Math.atan2(L.z1 - L.z0, L.x1 - L.x0) + Math.PI / 2; pts.push(new T.Vector3(x, y + L.h, z)); }
    add(new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: 0x1a1a1a }))); for (let i = 0; i < n - 1; i++) { const m = pts[i].clone().lerp(pts[i + 1], 0.5); const b = add(new T.Mesh(new T.SphereGeometry(1.4, 10, 8), V.M(0xff4a2a))); b.position.copy(m); } }
  // other balloons far off (it is a festival)
  V.decor = []; for (let i = 0; i < 7; i++) { const sk = SKINS[(i + 1) % SKINS.length], b = makeBalloon(V, sk); b.g.position.set(cx + (R() - 0.5) * 1400, 90 + R() * 160, cz + (R() - 0.5) * 1400); b.g.scale.setScalar(0.9); add(b.g); V.decor.push({ g: b.g, h: b.g.position.y }); }
}
// ---------- each frame ----------
function sync(V, G, dt) { V.t += dt; const T = V.T, b = G.b;
  if (V.for !== G.F) { V.for = G.F; W3.setSky(PLACES[G.cfg.place].sky); buildPlace(V, G); const s = mySkin(); if (V.skin !== s.id) { V.S.remove(V.me.g); V.me = makeBalloon(V, s); V.S.add(V.me.g); V.skin = s.id; } V.markers.forEach(m => V.S.remove(m)); V.markers = []; ui.snap = true; }
  V.me.g.position.set(b.x, b.y, b.z); V.me.g.rotation.y += dt * 0.05; V.me.flame.visible = b.burn; V.me.flame.scale.y = 0.8 + Math.random() * 0.5; V.me.glow.intensity = b.burn ? 60 : 0;
  V.targets.forEach((g, i) => { g.visible = true; const t = G.F.T[i]; g.children.forEach((c, j) => { if (j >= 2) c.material.opacity = i === G.ti ? 0.75 : 0.25; }); });
  V.field.visible = G.cfg.land || G.lesson == null;
  { const w = windAt(G, 2); V.sock.rotation.y = -Math.atan2(w.z, w.x); }
  for (const d of V.decor) { d.g.position.x += 0.3 * dt * 10; d.g.position.y = d.h + Math.sin(V.t * 0.2 + d.h) * 6; }
  // markers: a little weighted streamer
  while (V.markers.length < G.markers.length) { const m = new T.Mesh(V.boxG, V.M(0xff2a6a, { emissive: 0x401020 })); m.scale.set(1.2, 1.2, 1.2); V.S.add(m); V.markers.push(m); }
  G.markers.forEach((m, i) => { V.markers[i].position.set(m.x, m.y + (m.falling ? 0 : 0.6), m.z); V.markers[i].rotation.y += dt * 3; });
  // the ring: where a marker would land now
  const tg = G.F.T[G.ti]; V.ring.visible = !!tg && !b.landed && !G.markers.some(m => m.falling); if (V.ring.visible) { const p = predictDrop(G); V.ring.position.set(p.x, groundAt(G, p.x, p.z) + 0.6, p.z); const d = Math.hypot(p.x - tg.x, p.z - tg.z); V.ring.material.color.setHex(d < 10 ? 0x7cf07a : d < 30 ? 0xffe040 : 0xffffff); V.ring.scale.setScalar(1 + Math.sin(V.t * 4) * 0.08); }
  // the camera: behind and above, looking on towards the next X (or the field)
  const goal = tg || (G.lesson && G.lesson.id === 'wind' ? { x: G.lesson.fx, z: G.lesson.fz } : G.F.field), want = Math.atan2(goal.z - b.z, goal.x - b.x), dist = Math.hypot(goal.x - b.x, goal.z - b.z);
  if (ui.snap) ui.yaw = want; let dy = want - ui.yaw; while (dy > Math.PI) dy -= TAU; while (dy < -Math.PI) dy += TAU; if (dist > 25) ui.yaw += dy * Math.min(1, dt * 0.8);
  const back = 88, cx = b.x - Math.cos(ui.yaw) * back, cz = b.z - Math.sin(ui.yaw) * back, cy = Math.max(b.y + 34, groundAt(G, cx, cz) + 12), look = 40 + Math.min(dist, 160) * 0.5, gl = groundAt(G, b.x, b.z);
  const pos = [cx, cy, cz], tgt = [b.x + Math.cos(ui.yaw) * look, gl + (b.y - gl) * 0.35 + 6, b.z + Math.sin(ui.yaw) * look];
  if (!ui.cam || ui.snap) { ui.cam = { p: pos.slice(), l: tgt.slice() }; ui.snap = false; } const kc = Math.min(1, dt * 2.2); for (let i = 0; i < 3; i++) { ui.cam.p[i] += (pos[i] - ui.cam.p[i]) * kc; ui.cam.l[i] += (tgt[i] - ui.cam.l[i]) * kc; }
  const sh = FX.shake > 0 ? (Math.random() - 0.5) * FX.shake * 0.05 : 0, cam = W3.cam; cam.position.set(ui.cam.p[0] + sh, ui.cam.p[1] + sh, ui.cam.p[2]); cam.lookAt(ui.cam.l[0], ui.cam.l[1], ui.cam.l[2]); cam.updateMatrixWorld();
  W3.setFocus(b.x, b.y, b.z, 120); }
function scrOf(x, y, z) { const V = V3; if (!V || V.none) return null; return W3.screen(new V.T.Vector3(x, y, z)); }
// ---------- events ----------
function onEvent(G, e) { const b = G.b, bp = () => scrOf(b.x, b.y + 10, b.z) || { x: W / 2, y: H * 0.4 };
  switch (e.k) {
    case 'burn': if (!HEADLESS) sfx.burnStart(); break;
    case 'vent': sfx.vent(); { const p = bp(); say('VENT', p.x, p.y - 40 * k, '#bfe0ff', 16); } break;
    case 'drop': sfx.drop(); vibe(HAP.tick); break;
    case 'mark': { const t = G.F.T[e.ti], p = scrOf(t.x, groundAt(G, t.x, t.z) + 2, t.z) || { x: W / 2, y: H * 0.6 }; if (e.d < 10) { sfx.bull(); vibe(HAP.best); FX.flash = 0.4; say('BULLSEYE!', p.x, p.y - 40 * k, '#7cf07a', 30); burst(p.x, p.y, '#7cf07a', 26, 200); } else { sfx.mark(e.pts); vibe(HAP.light); say(`${Math.round(e.d)} m`, p.x, p.y - 30 * k, e.d < 30 ? '#ffe040' : '#fff', 24); }
      say(`+${e.pts}`, W / 2, H * 0.22, '#ffe040', 26); } break;
    case 'passed': sfx.no(); ui.banner = { txt: 'MISSED THAT X', sub: 'The wind took you past it. On to the next.', t: 0, secs: 2.2, small: true }; break;
    case 'late': ui.banner = { txt: 'TIME TO LAND', sub: 'The morning is over: head for the field', t: 0, secs: 2.6, small: true }; sfx.no(); break;
    case 'bump': sfx.bump(); FX.shake = 8; vibe(HAP.thud); { const p = bp(); say('BUMP!', p.x, p.y, '#ffd0a0', 24); } tip('bump', 'Too fast! Slow the sink with a short burn just before the ground.', 3.4); break;
    case 'touch': if (!e.hard) tip('touch', 'Touched the ground: hold to take off again. Land once the X are done.', 3.4); break;
    case 'landed': sfx.landed(); vibe(HAP.light); ui.banner = { txt: e.inF ? 'SOFT LANDING!' : 'LANDED', sub: G.cfg.land ? `${Math.round(e.d)} m from the field · +${e.pts}` : '', t: 0, secs: 2.2 }; break;
    case 'lineswarn': tip('wires', 'Wires ahead (the red balls)! Climb above them.', 3.2); break;
    case 'wires': sfx.zap(); FX.red = 0.8; FX.shake = 10; ui.banner = { txt: 'THE WIRES!', sub: 'Stay well above the red balls', t: 0, secs: 2.4, small: true }; break;
    case 'nofuel': ui.banner = { txt: 'OUT OF FUEL', sub: 'Down you come: land as softly as you can', t: 0, secs: 2.4, small: true }; break;
    case 'lgoal': break;
    case 'lessonnext': if (e.first) hint = null; say('FIRST, A LESSON', W / 2, H * 0.36, '#ffd36a', 24); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, W / 2, H * 0.36, '#7cf07a', 24); sfx.coin(e.n); break;
    case 'lessonmiss': hint = { txt: e.how, t: 0, secs: 3.6 }; say('AGAIN', W / 2, H * 0.4, '#ffd0a0', 20); break;
    case 'lessondone': say('READY: FLY THE TASK!', W / 2, H * 0.36, '#ffd36a', 24); sfx.landed(); ui.snap = true; if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); FX.flash = 0.5; vibe(HAP.best); break;
    case 'lost': sfx.lose(); break;      // (P11: never vibrate on failure)
  } }
// ---------- the picture ----------
let IG = null, IM = {}; function idleG() { if (!IG || IG.over || IG.t > 60) { IG = newGame(3 + ((Math.random() * 6) | 0), { seed: (Math.random() * 1e6) | 0 }); IM = {}; ui.snap = true; } honest(IG, { react: 0.4, acc: 0.95 }, IM); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#8ac0e8'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D sky.', W / 2, H / 2); if (G) hud(G, now); return; }
  const g = G || idleG(); sync(V, g, dt || 1 / 60); W3.render(dt || 1 / 60);
  if (FX.red > 0) { ctx.fillStyle = `rgba(200,40,30,${FX.red * 0.18})`; ctx.fillRect(0, 0, W, H); }
  if (G && !(G.over && !$('ovEnd').classList.contains('hidden'))) hud(G, now);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 1.1 ? 1 : 1 - (t2.t - 1.1) / 0.5; ctx.globalAlpha = Math.max(0, al); ctx.font = `400 ${Math.round(t2.size * k)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(20,30,50,.7)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 18); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 18); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 120), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30, hy = H - 150 * k - h / 2;
    ctx.fillStyle = 'rgba(20,30,50,.92)'; rrect(W / 2 - w / 2 - 30, hy - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2 - 30, hy - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,250,230,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); } }
function layout(G) { return { drop: { x: W - 62 * k, y: H - 76 * k, r: 44 * k }, vent: { x: 62 * k, y: H - 76 * k, r: 40 * k }, bar: { x: W - 40 * k, y0: H * 0.2, y1: H * 0.62 } }; }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function arrow(x, y, ang, len, col) { ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 3 * k; ctx.beginPath(); ctx.moveTo(-len / 2, 0); ctx.lineTo(len / 2 - 4 * k, 0); ctx.stroke(); ctx.beginPath(); ctx.moveTo(len / 2, 0); ctx.lineTo(len / 2 - 8 * k, -5 * k); ctx.lineTo(len / 2 - 8 * k, 5 * k); ctx.fill(); ctx.restore(); }
function hud(G, now) { const L = layout(G), b = G.b, gnd = groundAt(G, b.x, b.z), agl = b.y - gnd, B = L.bar, hY = h => B.y1 - (B.y1 - B.y0) * clamp(h / TOP, 0, 1);
  ctx.textBaseline = 'middle';
  // the winds, by height, turned to the view (up the screen is straight ahead, towards the X)
  ctx.fillStyle = 'rgba(20,30,50,.55)'; rrect(B.x - 34 * k, B.y0 - 22 * k, 62 * k, B.y1 - B.y0 + 44 * k, 14); ctx.fill();
  for (let h = 20; h <= TOP; h += 30) { const w = windAt(G, h), a = Math.atan2(w.z, w.x) - ui.yaw - Math.PI / 2, s = Math.hypot(w.x, w.z), y = hY(h), near = Math.abs(h - agl) < 15;
    arrow(B.x - 6 * k, y, a, (14 + s * 2.2) * k, near ? '#ffe040' : 'rgba(255,255,255,.75)'); }
  ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(B.x + 18 * k, B.y0); ctx.lineTo(B.x + 18 * k, B.y1); ctx.stroke();
  { const y = hY(agl); ctx.fillStyle = mySkin().top === undefined ? '#f2a03a' : '#' + mySkin().top.toString(16).padStart(6, '0'); ctx.beginPath(); ctx.arc(B.x + 18 * k, y, 7 * k, 0, TAU); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.textAlign = 'right'; ctx.fillStyle = '#fff'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(20,30,50,.8)'; const tx = `${Math.round(agl)} m ${b.vy > 0.4 ? '▲' : b.vy < -0.4 ? '▼' : '•'}`; ctx.strokeText(tx, B.x - 36 * k, y); ctx.fillText(tx, B.x - 36 * k, y); }
  if (G.lesson && G.lesson.id === 'rise') { const y = hY(G.lesson.y); ctx.strokeStyle = '#ffcf3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(B.x + 18 * k, y, 12 * k, 0, TAU); ctx.stroke(); }
  if (G.lesson && G.lesson.id === 'wind') { const y = hY(G.winds[G.lesson.layer].y + 8); ctx.strokeStyle = '#ffcf3a'; ctx.lineWidth = 3; rrect(B.x - 30 * k, y - 11 * k, 56 * k, 22 * k, 8); ctx.stroke(); const p = scrOf(G.lesson.fx, groundAt(G, G.lesson.fx, G.lesson.fz) + 25, G.lesson.fz); if (p && p.front) { ctx.font = `${Math.round(30 * k)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('🚩', p.x, p.y); } }
  // the drop button
  { const Vb = L.vent, on = b.vent > 0; ctx.fillStyle = on ? 'rgba(120,190,255,.95)' : 'rgba(20,30,50,.6)'; ctx.beginPath(); ctx.arc(Vb.x, Vb.y, Vb.r, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 3; ctx.stroke(); ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(15 * k)}px ${BC}`; ctx.fillText('VENT', Vb.x, Vb.y - 5 * k); ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.fillText('sink faster', Vb.x, Vb.y + 12 * k); }
  const D = L.drop, can = G.F.T[G.ti] && !b.landed && !G.markers.some(m => m.falling); ctx.fillStyle = can ? 'rgba(255,74,106,.95)' : 'rgba(20,30,50,.5)'; ctx.beginPath(); ctx.arc(D.x, D.y, D.r, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 3; ctx.stroke();
  ctx.font = `${Math.round(30 * k)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText('🎯', D.x, D.y - 6 * k); ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillText('DROP', D.x, D.y + 22 * k);
  if (G.lesson) lessonPanel(G);
  else { // score, the task, fuel
    ctx.textAlign = 'left'; ctx.font = `400 ${Math.round(22 * k)}px ${TF}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(20,30,50,.6)'; const sc = `${G.score}`; ctx.strokeText(sc, 14, 62 * k); ctx.fillStyle = '#fff'; ctx.fillText(sc, 14, 62 * k);
    ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; const need = Math.round(G.best * G.cfg.goal), tg = G.F.T[G.ti], sub = tg ? `X ${G.ti + 1} of ${G.F.T.length} · ${Math.round(Math.hypot(tg.x - b.x, tg.z - b.z))} m away` : G.cfg.land ? `land in the field · ${Math.round(Math.hypot(G.F.field.x - b.x, G.F.field.z - b.z))} m` : 'land softly anywhere';
    ctx.lineWidth = 3; ctx.strokeText(`need ${need}`, 14, 82 * k); ctx.fillStyle = G.score >= need ? '#7cf07a' : '#ffe8b0'; ctx.fillText(`need ${need}`, 14, 82 * k); ctx.strokeText(sub, 14, 100 * k); ctx.fillStyle = '#fff'; ctx.fillText(sub, 14, 100 * k);
    const fu = clamp(G.fuel / G.fuel0, 0, 1), fx = 14, fy = H - 40 * k, fw = Math.min(W * 0.42, 170 * k); ctx.fillStyle = 'rgba(20,30,50,.55)'; rrect(fx, fy - 12 * k, fw, 24 * k, 10); ctx.fill(); ctx.fillStyle = fu > 0.3 ? '#ffb040' : '#ff5a4a'; rrect(fx + 3, fy - 9 * k, (fw - 6) * fu, 18 * k, 8); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.fillText('🔥 FUEL', fx + 8, fy + 1);
    if (G.limit - G.t < 30 && G.ti < G.F.T.length) { ctx.textAlign = 'center'; ctx.font = `400 ${Math.round(16 * k)}px ${TF}`; ctx.fillStyle = '#ffd0a0'; ctx.fillText(`${Math.max(0, Math.ceil(G.limit - G.t))} s to finish the X`, W / 2 - 20, 128 * k); } }
  if (b.landed && !b.air && !G.lesson && G.t < 6) { ctx.textAlign = 'center'; ctx.font = `400 ${Math.round(20 * k)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(20,30,50,.7)'; ctx.strokeText('HOLD TO FIRE THE BURNER', W / 2 - 20, H * 0.72); ctx.fillStyle = '#ffe040'; ctx.fillText('HOLD TO FIRE THE BURNER', W / 2 - 20, H * 0.72); }
  if (ui.banner) banner(); }
function banner() { const b = ui.banner, a = Math.min(1, b.t / 0.2, ((b.secs || 2.4) - b.t) / 0.4); ctx.globalAlpha = Math.max(0, a); ctx.textAlign = 'center';
  ctx.font = `400 ${Math.round((b.small ? 30 : 40) * k)}px ${TF}`; ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(20,30,50,.7)'; ctx.strokeText(b.txt, W / 2 - 20, H * 0.32); ctx.fillStyle = '#ffe040'; ctx.fillText(b.txt, W / 2 - 20, H * 0.32);
  if (b.sub) { ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; ctx.lineWidth = 4; ctx.strokeText(b.sub, W / 2 - 20, H * 0.32 + 30 * k); ctx.fillStyle = '#fff'; ctx.fillText(b.sub, W / 2 - 20, H * 0.32 + 30 * k); } ctx.globalAlpha = 1; }
function lessonPanel(G) { const D = G.lesson, st0 = D.steps[D.i], x = 12, w = W - 24 - 80 * k, y = 48 * k; ctx.save();
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; const lines = wrapText(st0.how, w - 24), h = 50 * k + lines.length * 17 * k;
  ctx.fillStyle = 'rgba(20,30,50,.9)'; rrect(x, y, w, h, 12); ctx.fill(); ctx.strokeStyle = 'rgba(255,207,58,.8)'; ctx.lineWidth = 2; rrect(x, y, w, h, 12); ctx.stroke();
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#ffcf3a'; ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillText(`LESSON ${G.N} OF 3`, x + 12, y + 9 * k);
  ctx.fillStyle = '#fff'; ctx.font = `400 ${Math.round(17 * k)}px ${TF}`; ctx.fillText(st0.title, x + 12, y + 23 * k);
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.9)'; lines.forEach((l, i) => ctx.fillText(l, x + 12, y + 45 * k + i * 17 * k));
  for (let i = 0; i < st0.need; i++) { ctx.beginPath(); ctx.arc(x + w - 16 - (st0.need - 1 - i) * 18 * k, y + 16 * k, 6 * k, 0, TAU); if (i < D.n) { ctx.fillStyle = '#8fe0ab'; ctx.fill(); } else { ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; ctx.stroke(); } }
  ctx.restore(); }
