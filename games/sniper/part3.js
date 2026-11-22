
// ===================== THE VIEW: Sharpshooter in 3D (three.js; sky, light, shadows from tools/world3d.js) =====================
// A town square seen from a rooftop: tiled ground, a fountain, trees, benches, buildings round three sides, a car at each
// exit. The people are little figures (shirt, hat, bag) who walk with swinging legs and lie down asleep when a dart finds
// them. Holding FIRE turns the camera to the sight and narrows it (the scope); the 2D layer draws the scope's ring and cross,
// the card, the clock, the darts, breath and wind, and the FIRE pad.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { aim: null, pad: null, snap: true };
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 160) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: 0.5 + Math.random() * 0.4, col, r: (1.5 + Math.random() * 2.5) * k }); } if (PARTS.length > 240) PARTS.splice(0, PARTS.length - 240); }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2.5); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.4) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; } }
const hex = n => '#' + n.toString(16).padStart(6, '0');
function myScope() { if (typeof HEADLESS !== 'undefined' && HEADLESS) return SCOPES[0]; const id = store.get('scope', 'black'); return SCOPES.find(q => q.id === id) || SCOPES[0]; }
// the FIRE pad (bottom right) and the scope ring on this screen
function padAt() { const r = Math.min(46 * k, W * 0.13); return { x: W - r - 22, y: H - r - 34 * k, r }; }
const scopeR = () => Math.min(W, H) * 0.44;
// ---------- the world ----------
function buildWorld() {
  if (V3) return V3; const T = window.THREE; if (!T || !W3 || !W3.init({ canvas: $('gl'), fov: FOV, far: 2500, near: 0.2 })) { V3 = { none: true }; return V3; }
  V3 = { T, S: W3.scene, built: null }; const V = V3;
  V.mats = { skin: [0xf2c8a0, 0xd8a070, 0xa06a40, 0x6a4028].map(c => new T.MeshStandardMaterial({ color: c, roughness: 0.7 })), pants: [0x2a3040, 0x4a4038, 0x30405a, 0x5a5a5a].map(c => new T.MeshStandardMaterial({ color: c, roughness: 0.8 })),
    shirt: SHIRTS.map(s => new T.MeshStandardMaterial({ color: s[1], roughness: 0.7 })), dark: new T.MeshStandardMaterial({ color: 0x222226, roughness: 0.6 }), brown: new T.MeshStandardMaterial({ color: 0x6a4a2a, roughness: 0.6 }), red: new T.MeshStandardMaterial({ color: 0xc83a3a }), dart: new T.MeshStandardMaterial({ color: 0xffd040, emissive: 0x806000 }) };
  V.geo = { leg: (() => { const g = new T.BoxGeometry(0.13, 0.8, 0.15); g.translate(0, -0.4, 0); return g; })(), body: new T.CylinderGeometry(0.2, 0.22, 0.75, 10), head: new T.SphereGeometry(0.15, 12, 10), arm: (() => { const g = new T.BoxGeometry(0.09, 0.62, 0.1); g.translate(0, -0.3, 0); return g; })(),
    cap: new T.CylinderGeometry(0.16, 0.16, 0.08, 12), brim: new T.BoxGeometry(0.14, 0.02, 0.16), top: new T.CylinderGeometry(0.13, 0.13, 0.3, 12), beanie: new T.SphereGeometry(0.16, 10, 8, 0, TAU, 0, Math.PI / 2),
    case: new T.BoxGeometry(0.36, 0.26, 0.09), pack: new T.BoxGeometry(0.3, 0.38, 0.16), umb: new T.CylinderGeometry(0.02, 0.02, 0.8, 6) };
  V.dart = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 0.4, 6), V.mats.dart); V.dart.visible = false; V.S.add(V.dart);
  W3.setQuality(stepN); return V; }
function figure(V, p) { const T = V.T, M = V.mats, Gm = V.geo, g = new T.Group(), skin = M.skin[(p.x * 7 | 0) & 3], pants = M.pants[(p.z * 5 | 0) & 3];
  const legL = new T.Mesh(Gm.leg, pants), legR = new T.Mesh(Gm.leg, pants); legL.position.set(-0.08, 0.82, 0); legR.position.set(0.08, 0.82, 0);
  const body = new T.Mesh(Gm.body, M.shirt[p.shirt]); body.position.y = 1.18; const head = new T.Mesh(Gm.head, skin); head.position.y = 1.7;
  const armL = new T.Mesh(Gm.arm, M.shirt[p.shirt]), armR = new T.Mesh(Gm.arm, M.shirt[p.shirt]); armL.position.set(-0.27, 1.5, 0); armR.position.set(0.27, 1.5, 0);
  g.add(legL, legR, body, head, armL, armR); for (const m of [legL, legR, body, head, armL, armR]) m.castShadow = true;
  if (p.hat === 1) { const c = new T.Mesh(Gm.cap, M.red), b = new T.Mesh(Gm.brim, M.red); c.position.y = 1.8; b.position.set(0, 1.77, -0.15); g.add(c, b); }
  if (p.hat === 2) { const c = new T.Mesh(Gm.top, M.dark), b = new T.Mesh(new T.CylinderGeometry(0.22, 0.22, 0.02, 14), M.dark); c.position.y = 1.95; b.position.y = 1.8; g.add(c, b); }
  if (p.hat === 3) { const c = new T.Mesh(Gm.beanie, M.shirt[(p.shirt + 3) % SHIRTS.length]); c.position.y = 1.74; g.add(c); }
  if (p.bag === 1) { const c = new T.Mesh(Gm.case, M.brown); c.position.set(0.32, 0.95, 0); armR.add(new T.Object3D()); g.add(c); g.userData.case = c; }
  if (p.bag === 2) { const c = new T.Mesh(Gm.pack, M.shirt[(p.shirt + 2) % SHIRTS.length]); c.position.set(0, 1.25, 0.24); g.add(c); }
  if (p.bag === 3) { const c = new T.Mesh(Gm.umb, M.dark); c.position.set(-0.32, 1.0, 0); c.rotation.z = 0.2; g.add(c); }
  g.userData = Object.assign(g.userData, { legL, legR, armL, armR }); return g; }
function buildSquare(V, g) { const T = V.T; if (V.sq) { V.S.remove(V.sq); V.sq.traverse(o => { if (o.geometry && o.userData.own) o.geometry.dispose(); }); }
  const grp = new T.Group(); V.sq = grp; V.S.add(grp); V.built = g; const pl = PLACES[g.place], Q = square(g); W3.setSky(pl.sky); V.night = pl.sky === 'dusk';
  const own = m => { m.userData.own = 1; grp.add(m); return m; };
  // the ground: tiles
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); x.fillStyle = hex(pl.ground); x.fillRect(0, 0, 128, 128); x.fillStyle = 'rgba(196,110,70,.30)'; x.fillRect(0, 0, 64, 64); x.fillRect(64, 64, 64, 64); x.fillStyle = 'rgba(255,255,255,.10)'; x.fillRect(64, 0, 64, 64); x.strokeStyle = 'rgba(0,0,0,.12)';      /* 22 Nov 2026: warm two-tone paving; the square was a grey slab */ x.lineWidth = 2; for (let i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(i * 32, 0); x.lineTo(i * 32, 128); x.stroke(); x.beginPath(); x.moveTo(0, i * 32); x.lineTo(128, i * 32); x.stroke(); }
  const tex = new T.CanvasTexture(c); tex.wrapS = tex.wrapT = T.RepeatWrapping; tex.repeat.set(30, 30); tex.colorSpace = T.SRGBColorSpace;
  const ground = own(new T.Mesh(new T.PlaneGeometry(240, 240), new T.MeshStandardMaterial({ map: tex, roughness: 0.9 }))); ground.rotation.x = -Math.PI / 2; ground.position.set(0, 0, Q.fz); ground.receiveShadow = true;
  // the fountain
  { const b = own(new T.Mesh(new T.CylinderGeometry(Q.fr, Q.fr + 0.1, 0.6, 32), new T.MeshStandardMaterial({ color: 0xd8d0c0 }))); b.position.set(Q.fx, 0.3, Q.fz); b.castShadow = true; b.receiveShadow = true;
    const w = own(new T.Mesh(new T.CircleGeometry(Q.fr - 0.2, 32), new T.MeshStandardMaterial({ color: 0x4a9ad0, roughness: 0.15, metalness: 0.2 }))); w.rotation.x = -Math.PI / 2; w.position.set(Q.fx, 0.55, Q.fz);
    const p = own(new T.Mesh(new T.CylinderGeometry(0.3, 0.4, 2.2, 12), new T.MeshStandardMaterial({ color: 0xd8d0c0 }))); p.position.set(Q.fx, 1.1, Q.fz); p.castShadow = true; }
  // buildings round three sides; trees and benches; a car at each exit
  const R = rng(g.seed + 7), cols = [0xf2cf8e, 0xe8977a, 0x9cc4dc, 0xf4dc84, 0xa9d39c, 0xdf9090, 0xf0b0c8], awn = [0xd83a3a, 0x2a7ad0, 0xe8a020, 0x2a9a5a, 0xc84a9a];
  const wc = document.createElement('canvas'); wc.width = 64; wc.height = 128; { const y = wc.getContext('2d'); y.fillStyle = '#fff'; y.fillRect(0, 0, 64, 128); for (let r = 0; r < 6; r++) for (let q = 0; q < 3; q++) { y.fillStyle = V.night && R() < 0.5 ? '#ffd890' : '#4a5a6a'; y.fillRect(6 + q * 20, 8 + r * 20, 12, 13); } }
  const wt = new T.CanvasTexture(wc); wt.colorSpace = T.SRGBColorSpace;
  const bld = (bx, bz, w, d, h, fx = 0, fz = 0) => { { const a = own(new T.Mesh(new T.BoxGeometry(fx ? 1.5 : w * 0.86, 0.22, fz ? 1.5 : d * 0.86), new T.MeshStandardMaterial({ color: awn[(R() * awn.length) | 0], roughness: 0.7 }))); a.position.set(bx + fx * (w / 2 + 0.7), 3.0, bz + fz * (d / 2 + 0.7)); a.rotation.set(fz * 0.22, 0, -fx * 0.22); a.castShadow = true; }
    const m = own(new T.Mesh(new T.BoxGeometry(w, h, d), new T.MeshStandardMaterial({ color: cols[(R() * cols.length) | 0], map: wt, roughness: 0.8 }))); m.position.set(bx, h / 2, bz); m.castShadow = true; m.receiveShadow = true; };
  for (let z = Q.z0 - 4; z < Q.z1 + 6; z += 7) { bld(Q.x0 - 7, z, 8, 6.6, 8 + R() * 10, 1, 0); bld(Q.x1 + 7, z, 8, 6.6, 8 + R() * 10, -1, 0); }
  for (let xx = Q.x0 - 2; xx <= Q.x1 + 2; xx += 7) { if (Math.abs(xx - g.exits[0][0]) < 3 || Math.abs(xx - g.exits[1][0]) < 3) continue; bld(xx, Q.z0 - 7, 6.6, 8, 9 + R() * 12, 0, 1); }
  const leaf = new T.MeshStandardMaterial({ color: 0x4a8a3a, roughness: 0.8 }), trunk = new T.MeshStandardMaterial({ color: 0x6a4a2a });
  for (const [tx, tz] of [[Q.x0 + 1, Q.z1 - 1], [Q.x1 - 1, Q.z1 - 1], [Q.x0 + 1, Q.fz], [Q.x1 - 1, Q.fz]]) { const t = own(new T.Mesh(new T.CylinderGeometry(0.15, 0.2, 2, 8), trunk)); t.position.set(tx, 1, tz); const l = own(new T.Mesh(new T.IcosahedronGeometry(1.3, 1), leaf)); l.position.set(tx, 2.8, tz); l.castShadow = true; }
  { const fl = [0xe84a6a, 0xf0c020, 0xf07a30, 0xd060d0]; for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2, b = own(new T.Mesh(new T.SphereGeometry(0.2, 8, 6), new T.MeshStandardMaterial({ color: fl[i % 4], roughness: 0.6 }))); b.position.set(Q.fx + Math.cos(a) * (Q.fr + 0.32), 0.14, Q.fz + Math.sin(a) * (Q.fr + 0.32)); } }      /* flowers round the fountain */
  for (const e of g.exits) { const car = own(new T.Mesh(new T.BoxGeometry(1.9, 1.1, 3.8), new T.MeshStandardMaterial({ color: 0x2a2a30, metalness: 0.5, roughness: 0.3 }))); car.position.set(e[0], 0.75, e[1] - 4); car.castShadow = true; }
  if (V.night) for (const [lx, lz] of [[Q.x0 + 0.5, Q.z0 + 0.5], [Q.x1 - 0.5, Q.z0 + 0.5], [Q.x0 + 0.5, Q.z1 - 0.5], [Q.x1 - 0.5, Q.z1 - 0.5]]) { const L = own(new T.PointLight(0xffd8a0, 30, 18)); L.position.set(lx, 4, lz); const b = own(new T.Mesh(new T.SphereGeometry(0.2, 8, 6), new T.MeshBasicMaterial({ color: 0xffe8b0 }))); b.position.set(lx, 4, lz); }
  // the people
  V.figs = new Map(); for (const p of g.ppl) { const f = figure(V, p); own(f); V.figs.set(p, f); }
  V.stuck = []; }
function sync(V, g, dt) { const T = V.T;
  for (const [p, f] of V.figs) { f.position.set(p.x, 0, p.z); f.rotation.y = -p.a; const u = f.userData, moving = !p.asleep && !p.still && (p.wait || 0) <= 0, sw = moving ? Math.sin(p.ph) * 0.5 : 0;
    u.legL.rotation.x = sw; u.legR.rotation.x = -sw; u.armL.rotation.x = -sw * 0.7; u.armR.rotation.x = sw * 0.7;
    if (p.asleep) { const k2 = Math.min(1, p.asleep * 2); f.rotation.x = -Math.PI / 2 * k2; f.position.y = 0.15 * k2; } else f.rotation.x = 0; }
  // the dart in flight
  const d = g.darts.find(q => !q.done); if (d) { const a = dartAt(g, d, d.t), b = dartAt(g, d, d.t + 0.02); V.dart.visible = true; V.dart.position.set(a[0], a[1], a[2]); V.dart.lookAt(b[0], b[1], b[2]); V.dart.rotateX(Math.PI / 2); } else V.dart.visible = false;
  // the camera: the square from the roof, or (holding FIRE) the scope on the sight
  const s = swayNow(g), z = g.scoped * g.scoped * (3 - 2 * g.scoped), cam = W3.cam, asp = innerWidth / innerHeight, base = asp < 0.8 ? FOV + 8 : FOV;
  const yaw = lerp(0, g.yaw + s[0], z), pitch = lerp(PITCH0, g.pitch + s[1], z), dir = dirOf(yaw, pitch); cam.fov = lerp(base, base / ZOOM, z); cam.aspect = asp; cam.updateProjectionMatrix();
  const sh = FX.shake ? (Math.random() - 0.5) * FX.shake * 0.01 : 0; cam.position.set(CAM.x + sh, CAM.y + sh, CAM.z); cam.lookAt(CAM.x + dir[0], CAM.y + dir[1], CAM.z + dir[2]); cam.updateMatrixWorld();
  const Q = square(g); W3.setFocus(0, 0, Q.fz, g.S + 10); }
const SV = window.THREE ? new THREE.Vector3() : null;
function scr(x, y, z) { if (!V3 || V3.none) return { x: W / 2, y: H / 2 }; SV.set(x, y, z); return W3.screen(SV); }
// ---------- what each happening looks and sounds like ----------
function onEvent(G, e) { const cx = W / 2;
  switch (e.k) {
    case 'start': case 'square': if (V3 && !V3.none) V3.built = null; if (e.k === 'start') { say(`LEVEL ${G.N}`, cx, H * 0.3, '#fff', 30); sfx.start(); if (G.N <= 1) tip('how', 'Left thumb: drag to aim. Right thumb: HOLD the FIRE pad to look through the scope, LET GO to fire.', 4); if (G.cfg.wind) tip('wind', 'Wind! The dart drifts: aim a little into it.', 3); } break;
    case 'scope': sfx.scope(); break;
    case 'fire': sfx.fire(); FX.shake = 6; vibe(HAP.sharp); break;
    case 'gasp': sfx.gasp(); tip('gasp', 'Out of breath! Let go of FIRE for a moment to breathe.', 2.6); break;
    case 'hit': if (!e.thief) { const p = scr(e.x, e.y, e.z); burst(p.x, p.y, '#ffd040', 8, 100); } break;
    case 'got': sfx.got(); FX.flash = 0.5; say('GOT HIM!', cx, H * 0.3, '#9aff9a', 34); vibe(HAP.best); break;
    case 'innocent': sfx.wrong(); FX.red = 1; say('WRONG MAN!', cx, H * 0.3, '#ff8a8a', 30); vibe(HAP.fail); break;
    case 'miss': sfx.miss(); { const p = scr(e.x, 0.1, e.z); burst(p.x, p.y, '#c8b8a0', 8, 80); } break;
    case 'panic': sfx.panic(); say('HE\'S RUNNING!', cx, H * 0.36, '#ffb040', 26); tip('panic', 'A miss scatters the crowd: the thief runs for an exit. Quick!', 2.6); break;
    case 'leaving': sfx.panic(); say('HE\'S LEAVING!', cx, H * 0.36, '#ffb040', 24); break;
    case 'escaped': sfx.lose(); say('HE GOT AWAY', cx, H * 0.36, '#ff8a8a', 28); break;
    case 'nodarts': say('OUT OF DARTS', cx, H * 0.36, '#ff8a8a', 26); break;
    case 'lessonnext': if (e.first) hint = null; say('FIRST, A LESSON', cx, H * 0.3, '#ffe08a', 20); break;
    case 'lessonmiss': hint = { txt: e.how, t: 0, secs: 3.6 }; break;
    case 'lessondone': say('YOU\'VE GOT IT!', cx, H * 0.3, '#ffe08a', 26); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); break;
    case 'lost': sfx.lose(); break;
  } }
// ---------- every frame ----------
let IG = null; function idleG() { if (!IG || IG.over) { IG = newGame(Math.max(2, store.get('level', 1) | 0), { seed: (Math.random() * 1e6) | 0 }); } step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#2a2a30'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D square.', W / 2, H / 2); return; }
  const g = G || idleG(); if (V.built !== g) buildSquare(V, g);
  sync(V, g, dt);
  W3.render(dt);
  if (G) hud(G, now);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 0.9 ? 1 : 1 - (t2.t - 0.9) / 0.5; ctx.globalAlpha = Math.max(0, al); const sc = t2.t < 0.12 ? 1.3 - t2.t / 0.12 * 0.3 : 1; ctx.font = `400 ${Math.round(t2.size * k * sc)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 20); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 20); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30;
    ctx.fillStyle = 'rgba(10,12,16,.88)'; rrect(W / 2 - w / 2, H * 0.62 - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.62 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,40,40,${FX.red * 0.22})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,250,235,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); } }
// ---------- the 2D layer ----------
function hud(G, t) { ctx.textBaseline = 'middle'; const z = G.scoped, s = swayNow(G), SC = myScope();
  // the sleeping people
  for (const p of G.ppl) if (p.asleep) { const q = scr(p.x, 0.6, p.z); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fillText('z'.repeat(1 + ((t * 2) | 0) % 3), q.x + 10, q.y - 18 - ((t * 20) % 10)); }
  if (z > 0.35) { // the scope: black all round a ring, a cross with marks
    const r = scopeR(), cx = W / 2, cy = H / 2; ctx.save(); ctx.globalAlpha = Math.min(1, (z - 0.35) / 0.4); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(cx, cy, r, 0, TAU, true); ctx.fill();
    ctx.strokeStyle = SC.col === '#111111' ? 'rgba(0,0,0,.85)' : SC.col; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx - 8, cy); ctx.moveTo(cx + 8, cy); ctx.lineTo(cx + r, cy); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy - 8); ctx.moveTo(cx, cy + 8); ctx.lineTo(cx, cy + r); ctx.stroke();
    for (let i = 1; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(cx - 4, cy + i * r * 0.12); ctx.lineTo(cx + 4, cy + i * r * 0.12); ctx.moveTo(cx + i * r * 0.12, cy - 4); ctx.lineTo(cx + i * r * 0.12, cy + 4); ctx.moveTo(cx - i * r * 0.12, cy - 4); ctx.lineTo(cx - i * r * 0.12, cy + 4); ctx.stroke(); }
    ctx.fillStyle = SC.col === '#111111' ? '#ff3a3a' : SC.col; ctx.beginPath(); ctx.arc(cx, cy, 2.2, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.15)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, r - 3, 0, TAU); ctx.stroke(); ctx.restore();
    // breath
    const b = clamp(G.breath / G.cfg.breath, 0, 1), bw = r * 1.1; ctx.fillStyle = 'rgba(255,255,255,.2)'; rrect(cx - bw / 2, cy + r + 14 * k, bw, 6 * k, 3 * k); ctx.fill(); ctx.fillStyle = G.gasp > 0 ? '#ff6a6a' : '#9ae6ff'; rrect(cx - bw / 2, cy + r + 14 * k, bw * (G.gasp > 0 ? 0 : b), 6 * k, 3 * k); ctx.fill();
    ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText(G.gasp > 0 ? 'OUT OF BREATH' : 'HOLDING BREATH', cx, cy + r + 30 * k); }
  else { // the sight in the wide view: a small ring where the dart would go
    const d = dirOf(G.yaw + s[0], G.pitch + s[1]), q = scr(CAM.x + d[0] * 40, CAM.y + d[1] * 40, CAM.z + d[2] * 40); ctx.strokeStyle = 'rgba(255,60,60,.95)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(q.x, q.y, 12 * k, 0, TAU); ctx.moveTo(q.x - 18 * k, q.y); ctx.lineTo(q.x - 6 * k, q.y); ctx.moveTo(q.x + 6 * k, q.y); ctx.lineTo(q.x + 18 * k, q.y); ctx.moveTo(q.x, q.y - 18 * k); ctx.lineTo(q.x, q.y - 6 * k); ctx.moveTo(q.x, q.y + 6 * k); ctx.lineTo(q.x, q.y + 18 * k); ctx.stroke(); }
  if (G.lesson) lessonPanel(G);
  // the card: who to look for
  const cd = card(G), cw = Math.min(W - 24, 300 * k), cy0 = G.lesson ? 150 * k : 52 * k; ctx.fillStyle = 'rgba(245,238,220,.94)'; rrect(12, cy0, cw, 50 * k, 10); ctx.fill(); ctx.textAlign = 'left'; ctx.fillStyle = '#8a2a2a'; ctx.font = `400 ${Math.round(12 * k)}px ${TF}`; ctx.fillText('WANTED: THE THIEF', 22, cy0 + 13 * k);
  ctx.fillStyle = '#2a2a30'; { const txt = cd.join(' · ').toUpperCase(); let fs = 14; ctx.font = `700 ${Math.round(fs * k)}px ${BC}`; while (fs > 9 && ctx.measureText(txt).width > cw - 50 * k) { fs--; ctx.font = `700 ${Math.round(fs * k)}px ${BC}`; } ctx.fillText(txt, 22, cy0 + 33 * k); } ctx.fillStyle = hex(SHIRTS[G.thief.shirt][1]); rrect(12 + cw - 30 * k, cy0 + 10 * k, 20 * k, 30 * k, 4); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 1; rrect(12 + cw - 30 * k, cy0 + 10 * k, 20 * k, 30 * k, 4); ctx.stroke();
  // the clock, darts and the wind
  ctx.textAlign = 'right'; ctx.font = `400 ${Math.round(20 * k)}px ${TF}`; ctx.fillStyle = G.left < 6 ? (Math.sin(t * 10) > 0 ? '#ff6a4a' : '#fff') : '#fff'; if (!G.lesson) ctx.fillText(`${Math.max(0, Math.ceil(G.left))}`, W - 14, cy0 + 70 * k);
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = '#ffd040'; ctx.fillText('➶'.repeat(G.dartsLeft), W - 14, cy0 + 92 * k); ctx.textAlign = 'left'; ctx.fillStyle = '#fff';
  if (G.wind) { ctx.fillText(`WIND ${G.wind < 0 ? '←' : '→'} ${Math.abs(G.wind).toFixed(1)}`, 14, cy0 + 70 * k); }
  // the FIRE pad
  const P = padAt(), on = !!G.hold; ctx.globalAlpha = 0.9; ctx.fillStyle = on ? '#ff4a3a' : 'rgba(255,74,58,.75)'; ctx.beginPath(); ctx.arc(P.x, P.y, P.r * (on ? 0.92 : 1), 0, TAU); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `400 ${Math.round(15 * k)}px ${TF}`; ctx.fillText(on ? 'LET GO' : 'FIRE', P.x, P.y - 4 * k); ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.fillText(on ? 'TO SHOOT' : 'HOLD', P.x, P.y + 12 * k); ctx.globalAlpha = 1;
  if (G.N <= 1 && G.t < 5 && !ui.aim && !G.lesson) { ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 4); ctx.font = `400 ${Math.round(14 * k)}px ${TF}`; ctx.fillStyle = '#fff'; ctx.fillText('← DRAG TO AIM', W * 0.35, H - 60 * k); ctx.globalAlpha = 1; } }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { const D = G.lesson, st = D.steps[D.i], x = 12, w = W - 24, y = 48 * k; ctx.save(); ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; const lines = wrapText(st.how, w - 24), h = 44 * k + lines.length * 17 * k;
  ctx.fillStyle = 'rgba(10,12,16,.88)'; rrect(x, y, w, h, 12); ctx.fill(); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#ffd080'; ctx.font = `400 ${Math.round(15 * k)}px ${TF}`; ctx.fillText(`LESSON ${G.N}: ${st.title}`, x + 12, y + 9 * k);
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.92)'; lines.forEach((l, i) => ctx.fillText(l, x + 12, y + 32 * k + i * 17 * k)); ctx.restore(); ctx.textBaseline = 'middle'; }
