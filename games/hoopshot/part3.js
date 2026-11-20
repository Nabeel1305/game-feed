
// ===================== THE VIEW: Hoop Shot in 3D (three.js; light and sky from tools/world3d.js) =====================
// The camera stands behind the ball, facing the hoop; the basket is always in view. Courts in turn: a neighbourhood court
// at golden hour, an old gym, a rooftop at dusk, a big arena at night. Spots are painted on the floor. While you pull, the
// ball's path shows as dots (all of it early on, then less); your last shot stays as a faint line so you can correct it.
const FX = { shake: 0, stop: 0, flash: 0, red: 0, slow: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { snap: true, cam: null, banner: null, drag: null, net: 0, fire: 0 };
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 160) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: 0.5 + Math.random() * 0.4, col, r: (1.5 + Math.random() * 2.5) * k }); } if (PARTS.length > 240) PARTS.splice(0, PARTS.length - 240); }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2.5); FX.red = Math.max(0, FX.red - dt * 2); ui.net = Math.max(0, ui.net - dt * 2.5);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.4) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (ui.banner) { ui.banner.t += dt; if (ui.banner.t > (ui.banner.secs || 1)) ui.banner = null; }
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; } }
function mySkin() { if (typeof HEADLESS !== 'undefined' && HEADLESS) return SKINS[0]; const id = store.get('skin', 'classic'); return SKINS.find(q => q.id === id) || SKINS[0]; }
function canvasTex(w, h, fn, rep) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return t; }
function ballTex(col) { return canvasTex(256, 128, (g, w, h) => { g.fillStyle = '#' + col.toString(16).padStart(6, '0'); g.fillRect(0, 0, w, h); const R = W3.rng(3); for (let i = 0; i < 1600; i++) { g.fillStyle = `rgba(0,0,0,${0.05 + R() * 0.08})`; g.fillRect(R() * w, R() * h, 1.5, 1.5); }
  g.strokeStyle = '#1a1a1a'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.moveTo(w / 4, 0); g.lineTo(w / 4, h); g.moveTo(w * 3 / 4, 0); g.lineTo(w * 3 / 4, h); g.stroke(); g.beginPath(); g.ellipse(w / 2, h / 2, w * 0.16, h * 0.5, 0, 0, TAU); g.stroke(); g.beginPath(); g.ellipse(0, h / 2, w * 0.16, h * 0.5, 0, 0, TAU); g.ellipse(w, h / 2, w * 0.16, h * 0.5, 0, 0, TAU); g.stroke(); }); }
function buildWorld() {
  if (V3) return V3; const T = window.THREE; if (!T || !W3 || !W3.init({ canvas: $('gl'), fov: 55, far: 2500, near: 0.05 })) { V3 = { none: true }; return V3; }
  V3 = { T, S: W3.scene, built: null, t: 0 }; const V = V3;
  V.boxG = new T.BoxGeometry(1, 1, 1); V.sphG = new T.SphereGeometry(1, 24, 16); V.cylG = new T.CylinderGeometry(1, 1, 1, 20);
  // the hoop: pole, board, ring, net
  const M = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.5 }, o)), hoop = new T.Group(); V.S.add(hoop);
  const pole = new T.Mesh(V.cylG, M(0x2a2e36, { metalness: 0.6, roughness: 0.35 })); pole.scale.set(0.09, 3.6, 0.09); pole.position.set(0, 1.8, -1.35); pole.castShadow = true; hoop.add(pole);
  const arm = new T.Mesh(V.boxG, pole.material); arm.scale.set(0.12, 0.12, 0.95); arm.position.set(0, 3.45, -0.88); hoop.add(arm);
  const board = new T.Mesh(V.boxG, new T.MeshPhysicalMaterial({ map: canvasTex(256, 150, (g, w, h) => { g.fillStyle = '#f8f8f8'; g.fillRect(0, 0, w, h); g.strokeStyle = '#d8322a'; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8); g.strokeRect(w * 0.34, h * 0.42, w * 0.32, h * 0.42); }), roughness: 0.25, clearcoat: 0.6 }));
  board.scale.set(BOARD.x * 2, BOARD.y1 - BOARD.y0, 0.05); board.position.set(0, (BOARD.y0 + BOARD.y1) / 2, BOARD.z - 0.025); board.castShadow = true; hoop.add(board);
  const rim = new T.Mesh(new T.TorusGeometry(RIM.r, 0.012, 10, 40), M(0xf05a1a, { metalness: 0.5, roughness: 0.4 })); rim.rotation.x = Math.PI / 2; rim.position.set(RIM.x, RIM.y, RIM.z); hoop.add(rim); V.rimM = rim.material;
  const brk = new T.Mesh(V.boxG, rim.material); brk.scale.set(0.12, 0.04, 0.16); brk.position.set(0, RIM.y, BOARD.z + 0.08); hoop.add(brk);
  const netT = canvasTex(128, 64, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = 3; for (let i = -8; i < 16; i++) { g.beginPath(); g.moveTo(i * 16, 0); g.lineTo(i * 16 + 32, h); g.stroke(); g.beginPath(); g.moveTo(i * 16 + 32, 0); g.lineTo(i * 16, h); g.stroke(); } });
  netT.wrapS = T.RepeatWrapping; netT.repeat.set(3, 1); V.net = new T.Mesh(new T.CylinderGeometry(RIM.r - 0.01, RIM.r * 0.62, 0.42, 24, 1, true), new T.MeshStandardMaterial({ map: netT, transparent: true, side: T.DoubleSide, alphaTest: 0.3, roughness: 0.8 })); V.net.position.set(RIM.x, RIM.y - 0.21, RIM.z); hoop.add(V.net);
  V.ball = new T.Mesh(new T.SphereGeometry(BALL, 28, 18), new T.MeshStandardMaterial({ map: ballTex(mySkin().col), roughness: 0.75 })); V.ball.castShadow = true; V.S.add(V.ball); V.ballCol = mySkin().col;
  V.ghost = new T.Mesh(V.ball.geometry, new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15, depthWrite: false })); V.S.add(V.ghost);
  V.spotM = []; for (let i = 0; i < 8; i++) { const s = new T.Mesh(new T.RingGeometry(0.28, 0.4, 32), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, depthWrite: false })); s.rotation.x = -Math.PI / 2; s.visible = false; V.S.add(s); V.spotM.push(s); }
  W3.setQuality(stepN); return V; }
function buildCourt(V, g) { const T = V.T, S = V.S;
  if (V.court) { S.remove(V.court); V.court.traverse(o => { if (o.geometry && ![V.boxG, V.sphG, V.cylG].includes(o.geometry)) o.geometry.dispose(); }); }
  V.court = new T.Group(); S.add(V.court); V.built = g; const ci = placeOf(g.N), C = COURTS[ci], R = W3.rng(g.seed % 999 + 5); V.ci = ci;
  W3.setSky(g.yard ? 'golden' : C.sky, { azim: 200 }); if (C.indoor) { W3.S.exposure *= 0.8; W3.scene.environmentIntensity = 0.5; } W3.scene.fog.near = 40; W3.scene.fog.far = 400; W3.scene.children.forEach(o => { if (o.isLineSegments) o.visible = false; });
  const M = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.7 }, o));
  // the floor, with its lines (the key, the three-point arc)
  const floorT = canvasTex(1024, 1024, (c, w, h) => { const sc = w / 30; c.fillStyle = ['#5a6670', '#c89a62', '#3a4a5a', '#d8a868'][ci]; c.fillRect(0, 0, w, h);
    if (ci === 1 || ci === 3) for (let i = 0; i < 60; i++) { c.fillStyle = `rgba(80,40,10,${0.06 + (i % 3) * 0.03})`; c.fillRect(i * w / 60, 0, 2, h); }
    if (ci === 0 || ci === 2) { const r = W3.rng(9); for (let i = 0; i < 4000; i++) { c.fillStyle = `rgba(0,0,0,${r() * 0.12})`; c.fillRect(r() * w, r() * h, 2, 2); } }
    const X = x => w / 2 + x * sc, Z = z => h * 0.12 + (z + 1.2) * sc; c.strokeStyle = ci === 2 ? '#7af0ff' : '#ffffff'; c.lineWidth = 5;
    c.fillStyle = ['#c84a3a', '#2a5ab8', '#2a8a6a', '#8a2a3a'][ci]; c.globalAlpha = 0.75; c.fillRect(X(-2.45), Z(-1.2), 4.9 * sc, 5.8 * sc); c.globalAlpha = 1; c.strokeRect(X(-2.45), Z(-1.2), 4.9 * sc, 5.8 * sc);
    c.beginPath(); c.arc(X(0), Z(4.6), 1.8 * sc, 0, Math.PI); c.stroke(); c.beginPath(); c.arc(X(0), Z(0), 6.75 * sc, 0.05, Math.PI - 0.05); c.stroke(); c.beginPath(); c.moveTo(X(-15), Z(-1.2)); c.lineTo(X(15), Z(-1.2)); c.stroke(); });
  const fl = new T.Mesh(new T.PlaneGeometry(30, 30), new T.MeshStandardMaterial({ map: floorT, roughness: ci === 1 || ci === 3 ? 0.3 : 0.85 })); fl.rotation.x = -Math.PI / 2; fl.position.set(0, 0, 30 * 0.38 - 1.2 - 0.12 * 30 + 3.6); fl.receiveShadow = true; V.court.add(fl);
  // the place around it
  if (ci === 0) { const gr = new T.Mesh(new T.PlaneGeometry(400, 400), M(0x5a7a3a, { roughness: 1 })); gr.rotation.x = -Math.PI / 2; gr.position.y = -0.02; V.court.add(gr);
    for (let i = 0; i < 26; i++) { const p = new T.Mesh(V.cylG, M(0x3a3e44, { metalness: 0.5 })); p.scale.set(0.04, 3.2, 0.04); const a = i < 13 ? -12 + i * 2 : null; p.position.set(a != null ? a : (i % 2 ? -12.5 : 12.5), 1.6, a != null ? -4.5 : -4.5 + (i - 13) * 2); V.court.add(p); }
    const fence = new T.Mesh(new T.PlaneGeometry(25, 3.2), new T.MeshStandardMaterial({ map: canvasTex(64, 64, (c, w, h) => { c.clearRect(0, 0, w, h); c.strokeStyle = 'rgba(200,210,220,.8)'; c.lineWidth = 2; for (let i = -64; i < 128; i += 12) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + 64, h); c.moveTo(i + 64, 0); c.lineTo(i, h); c.stroke(); } }, [40, 5]), transparent: true, alphaTest: 0.3, side: T.DoubleSide })); fence.position.set(0, 1.6, -4.5); V.court.add(fence);
    const trees = []; for (let i = 0; i < 30; i++) trees.push({ x: -30 + R() * 60, z: -8 - R() * 30, y: 0, s: 1.2 + R() * 1.2, rot: R() * 6, hue: R(), shade: R() }); V.court.add(W3.pines(trees, { shadow: false }));
    for (let i = 0; i < 7; i++) { const h = new T.Mesh(V.boxG, M([0xe8c8a0, 0xc8d8e8, 0xd88a6a, 0xf0e0b0][i % 4])); h.scale.set(6 + R() * 3, 5 + R() * 3, 6); h.position.set(-24 + i * 8, 3, -26 - R() * 6); V.court.add(h); const rf = new T.Mesh(new T.ConeGeometry(5, 3, 4), M(0x8a3a2a)); rf.position.set(h.position.x, h.position.y + h.scale.y / 2 + 1.4, h.position.z); rf.rotation.y = Math.PI / 4; V.court.add(rf); } }
  if (ci === 1 || ci === 3) { const wallM = M(ci === 1 ? 0xb8a888 : 0x1a1a24, { roughness: 0.9 }); for (const [x, z, w, d] of [[0, -12.5, 40, 0.3], [-19, 4, 0.3, 34], [19, 4, 0.3, 34]]) { const wl = new T.Mesh(V.boxG, wallM); wl.scale.set(w, 12, d); wl.position.set(x, 6, z); V.court.add(wl); }
    // stands with people
    const n = ci === 3 ? 600 : 160, crowd = new T.InstancedMesh(new T.CapsuleGeometry(0.22, 0.45, 3, 6), M(0xffffff, { roughness: 0.9 }), n), d = new T.Object3D(), col = new T.Color(); V.crowd = crowd; V.crowdBase = [];
    for (let i = 0; i < n; i++) { const side = i % 3, row = Math.floor(i / 3) % (ci === 3 ? 10 : 5), along = Math.floor(i / (3 * (ci === 3 ? 10 : 5))); let x, z; if (side === 0) { x = -12 + (along % 27) * 0.9; z = -5.2 - row * 0.7; } else { x = side === 1 ? -11 - row * 0.8 : 11 + row * 0.8; z = -4.5 + (along % 9) * 0.8; } const y = 0.6 + row * 0.55;
      d.position.set(x, y, z); d.updateMatrix(); crowd.setMatrixAt(i, d.matrix); crowd.setColorAt(i, col.setHSL(R(), 0.5, 0.25 + R() * 0.35)); V.crowdBase.push(d.position.clone()); }
    if (ci === 1) crowd.count = 160; V.court.add(crowd);
    for (let i = 0; i < 6; i++) { const L = new T.PointLight(0xfff4e0, ci === 3 ? 30 : 18, 40, 1.6); L.position.set(-10 + i * 4, 9, 2); V.court.add(L); } }
  else V.crowd = null;
  if (ci === 2) { for (let i = 0; i < 40; i++) { const b = new T.Mesh(V.boxG, M(0x2a3040, { roughness: 0.6, emissive: 0x302810, emissiveIntensity: R() < 0.5 ? 0.6 : 0.1 })); b.scale.set(6 + R() * 8, 20 + R() * 60, 6 + R() * 8); b.position.set(-80 + R() * 160, -10 + b.scale.y / 2 - 20, -40 - R() * 120); V.court.add(b); }
    const rail = new T.Mesh(V.boxG, M(0x7a8090, { metalness: 0.6 })); rail.scale.set(30, 0.06, 0.06); rail.position.set(0, 1.1, -4.6); V.court.add(rail); const deck = new T.Mesh(new T.PlaneGeometry(400, 400), M(0x2a2e36)); deck.rotation.x = -Math.PI / 2; deck.position.y = -0.02; V.court.add(deck); }
  V.ball.material.map = ballTex(mySkin().col); V.ball.material.needsUpdate = true; ui.snap = true; }
// ---------- each frame ----------
function sync(V, g, dt) { const T = V.T; V.t += dt; const sp = spotNow(g), b = g.ball;
  if (b) V.ball.position.set(b.x, b.y, b.z); else V.ball.position.set(sp.x, H0, sp.z - 0.05); if (b) { V.ball.rotation.x -= dt * 9; } else V.ball.rotation.y += dt * 0.6;
  V.net.scale.set(1 - ui.net * 0.25, 1 + ui.net * 0.35, 1 - ui.net * 0.25); V.net.position.y = RIM.y - 0.21 * (1 + ui.net * 0.35);
  V.ghost.visible = false;
  // the spots on the floor
  V.spotM.forEach((m, i) => { const s = g.spots[i]; m.visible = !!s; if (!s) return; m.position.set(s.x + (i === g.si && g.cfg.slide ? g.slide.x : 0), 0.02, s.z); m.material.color.setHex(g.done[i] ? 0x60ff80 : i === g.si ? 0xffd040 : 0xffffff); m.material.opacity = i === g.si ? 0.7 + 0.3 * Math.sin(V.t * 6) : 0.35; });
  if (V.crowd) { const cheer = Math.min(1, ui.fire); const d = new T.Object3D(); V.crowdBase.forEach((p, i) => { if (i >= V.crowd.count) return; d.position.set(p.x, p.y + Math.max(0, Math.sin(V.t * 9 + i)) * 0.15 * cheer, p.z); d.updateMatrix(); V.crowd.setMatrixAt(i, d.matrix); }); V.crowd.instanceMatrix.needsUpdate = true; }
  // the camera: behind the ball, facing the hoop
  const ux = RIM.x - sp.x, uz = RIM.z - sp.z, L = Math.hypot(ux, uz) || 1, fx = ux / L, fz = uz / L, asp = innerWidth / innerHeight, portrait = asp < 0.8;
  const back = portrait ? 2.5 : 1.9, cp = [sp.x - fx * back, 2.45, sp.z - fz * back], cl = [RIM.x - fx * 0.2, portrait ? 2.6 : 2.8, RIM.z];
  if (b && b.t > 0.2) { cl[1] = Math.max(cl[1], Math.min(b.y, 3.6)); }
  if (ui.snap || !ui.cam) { ui.cam = { p: cp.slice(), l: cl.slice() }; ui.snap = false; }
  const kk = Math.min(1, dt * 4); for (let i = 0; i < 3; i++) { ui.cam.p[i] += (cp[i] - ui.cam.p[i]) * kk; ui.cam.l[i] += (cl[i] - ui.cam.l[i]) * kk; }
  const cam = W3.cam, sh = FX.shake ? (Math.random() - 0.5) * FX.shake * 0.004 : 0; cam.fov = portrait ? 58 : 48; cam.aspect = asp; cam.updateProjectionMatrix();
  cam.position.set(ui.cam.p[0] + sh, ui.cam.p[1] + sh, ui.cam.p[2]); cam.lookAt(ui.cam.l[0], ui.cam.l[1], ui.cam.l[2]); cam.updateMatrixWorld(); W3.setFocus(0, 1.5, sp.z / 2, 8); }
const SV = window.THREE ? new THREE.Vector3() : null;
function scr(x, y, z) { if (!V3 || V3.none) return { x: W / 2, y: H / 2 }; SV.set(x, y, z); return W3.screen(SV); }
// ---------- what happens, seen and heard ----------
const WHY = { long: ['TOO STRONG', 'Pull back a little less.'], short: ['TOO WEAK', 'Pull back a little further.'], left: ['TOO FAR LEFT', 'Move your thumb a little LEFT as you pull.'], right: ['TOO FAR RIGHT', 'Move your thumb a little RIGHT as you pull.'], rim: ['OFF THE RIM', 'So close: nearly the same again.'], nobank: ['NO BANK!', 'This round counts only off the board.'] };
function onEvent(G, e) { const cx = W / 2;
  switch (e.k) {
    case 'start': case 'yard': ui.snap = true; ui.fire = 0; ui.banner = { txt: G.lesson ? 'LESSON' : G.cfg.practice ? 'PRACTICE' : G.cfg.ch ? { bank: 'BANK SHOTS', moving: 'MOVING SPOT', around: 'AROUND THE WORLD' }[G.cfg.ch] : COURTS[placeOf(G.N)].name.toUpperCase(), t: 0, secs: 1.5, col: '#ff8a3a' };
      if (!G.lesson && !G.cfg.practice) say(`MAKE ${G.cfg.need} OF ${G.balls}`, cx, H * 0.38, '#fff', 20); if (G.cfg.ch === 'bank') tip('bank', 'BANK SHOTS: only baskets off the board count this round. Aim a little to one side and harder.', 3.6); if (G.cfg.ch === 'moving') tip('moving', 'MOVING SPOT: you slide as you shoot, and the ball carries that slide. Aim against it.', 3.6); if (G.cfg.ch === 'around') tip('around', 'AROUND THE WORLD: score once from every spot; a miss tries the same spot again.', 3.6); break;
    case 'shoot': sfx.shoot(e.p); vibe(HAP.light); break;
    case 'rim': sfx.rim(e.n); FX.shake = 3; break;
    case 'board': sfx.board(); break;
    case 'bounce': sfx.bounce(e.v); break;
    case 'net': ui.net = 1; sfx.net(e.swish); break;
    case 'score': vibe(e.swish ? HAP.heavy : HAP.light); ui.fire = e.streak; say(e.swish ? 'SWISH!' : e.bank ? 'BANK!' : 'BUCKET!', cx, H * 0.3, e.swish ? '#7af0ff' : '#80ff90', e.swish ? 34 : 28); burst(cx, H * 0.3, e.swish ? '#7af0ff' : '#ffd040', e.swish ? 26 : 14);
      if (e.streak >= 3) { say(`ON FIRE ×${e.streak}`, cx, H * 0.37, '#ff8a3a', 22); sfx.crowd(Math.min(1, e.streak / 6)); } else sfx.crowd(0.3); if (e.swStreak >= 2) say(`${e.swStreak} SWISHES IN A ROW`, cx, H * 0.43, '#7af0ff', 16); break;
    case 'miss': ui.fire = 0; { const w = WHY[e.why] || ['MISS', '']; say(w[0], cx, H * 0.3, '#ffb070', 28); if (G.lesson == null && w[1]) hint = { txt: w[1], t: 0, secs: 2.4 }; } sfx.aww(); break;
    case 'nobank': break;
    case 'spot': ui.snap = false; sfx.squeak(); break;
    case 'won': sfx.win(); break;
    case 'lost': sfx.lose(); break;
    case 'lessonnext': hint = null; break;
    case 'lessonok': sfx.coin(e.n); say(`${e.n} / ${e.need}`, cx, H * 0.46, '#80ff90', 22); break;
    case 'lessonmiss': hint = { txt: e.how, t: 0, secs: 3 }; break;
    case 'lessondone': sfx.goal(); say('LESSON DONE!', cx, H * 0.4, '#80ff90', 28); burst(cx, H * 0.4, '#80ff90', 24); break;
  } }
let IG = null; function idleG() { if (!IG || IG.over) { IG = newGame(Math.max(4, store.get('level', 1) | 0), { seed: (Math.random() * 1e6) | 0 }); IG.mem = {}; ui.snap = true; } honest(IG, { react: 0.6, acc: 0.95 }, IG.mem); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#1a2230'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D court.', W / 2, H / 2); if (G) hud(G, now); return; }
  const g = G || idleG(); if (V.built !== g || V.spotsFor !== g.spots && g.spots.length !== (V.spotsFor || []).length) { buildCourt(V, g); V.spotsFor = g.spots; }
  if (V.ballCol !== mySkin().col) { V.ballCol = mySkin().col; V.ball.material.map = ballTex(V.ballCol); V.ball.material.needsUpdate = true; }
  sync(V, g, dt);
  W3.render(dt);
  if (G && !(G.over && !$('ovEnd').classList.contains('hidden'))) hud(G, now);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 0.9 ? 1 : 1 - (t2.t - 0.9) / 0.5; ctx.globalAlpha = Math.max(0, al); const sc = t2.t < 0.12 ? 1.3 - t2.t / 0.12 * 0.3 : 1; ctx.font = `400 ${Math.round(t2.size * k * sc)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(10,14,24,.7)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 20); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 20); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30, hy = H * 0.5;
    ctx.fillStyle = 'rgba(14,18,30,.88)'; rrect(W / 2 - w / 2, hy - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, hy - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${FX.flash * 0.45})`; ctx.fillRect(0, 0, W, H); } }
// ---------- the 2D layer: the path dots, the pull, the balls, the streaks ----------
function hud(G, now) { ctx.textBaseline = 'middle'; const c = G.cfg;
  if (G.lesson) lessonPanel(G);
  else { const x0 = 12, y0 = 62 * k, w = W - 24; ctx.fillStyle = 'rgba(14,18,30,.62)'; rrect(x0, y0 - 18 * k, w, 52 * k, 14 * k); ctx.fill(); ctx.textAlign = 'left';
    ctx.font = `400 ${Math.round(20 * k)}px ${TF}`; ctx.fillStyle = '#ffb070'; ctx.fillText(c.practice ? `🏀 ${G.made} made` : `🏀 ${G.made}/${c.need}`, x0 + 10, y0 - 1 * k);
    ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = '#fff'; ctx.fillText(c.practice ? `PRACTICE · best streak ${G.best}` : `${c.ch ? { bank: 'BANK SHOTS', moving: 'MOVING SPOT', around: 'AROUND THE WORLD' }[c.ch] + ' · ' : ''}SPOT ${G.si + 1}/${G.spots.length} · ${spotNow(G).d.toFixed(1)} m`, x0 + 10, y0 + 20 * k);
    if (!c.practice) { const left = G.balls - G.used, n = Math.min(left, 10); for (let i = 0; i < n; i++) { const bx = x0 + w - 16 * k - i * 17 * k, by = y0 - 2 * k; ctx.fillStyle = '#e8742a'; ctx.beginPath(); ctx.arc(bx, by, 7 * k, 0, TAU); ctx.fill(); ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(bx - 7 * k, by); ctx.lineTo(bx + 7 * k, by); ctx.stroke(); } ctx.textAlign = 'right'; ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillText(`${left} BALL${left === 1 ? '' : 'S'} LEFT`, x0 + w - 10, y0 + 20 * k); }
    if (G.streak >= 2) { ctx.textAlign = 'center'; ctx.font = `400 ${Math.round(15 * k)}px ${TF}`; ctx.fillStyle = '#ff8a3a'; ctx.fillText(`🔥 ${G.streak} IN A ROW` + (G.swStreak >= 2 ? ` · ${G.swStreak} SWISHES` : ''), W / 2, y0 + 48 * k); } }
  if (ui.banner) { const B = ui.banner, sc = B.t < 0.12 ? 1.25 - B.t / 0.12 * 0.25 : 1; ctx.textAlign = 'center'; ctx.font = `400 ${Math.round(32 * k * sc)}px ${TF}`; { const mw = ctx.measureText(B.txt).width; if (mw > W - 30) ctx.font = `400 ${Math.round(32 * k * sc * (W - 30) / mw)}px ${TF}`; } ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(10,14,24,.7)'; ctx.strokeText(B.txt, W / 2, H * 0.24); ctx.fillStyle = B.col || '#fff'; ctx.fillText(B.txt, W / 2, H * 0.24); }
  // the last shot, faint (so you can correct it), and the path of this one as you pull
  if (G.state === 'aim' && G.last && G.last.path.length) { ctx.strokeStyle = G.last.ok ? 'rgba(128,255,144,.35)' : 'rgba(255,176,112,.45)'; ctx.lineWidth = 3; ctx.setLineDash([6, 6]); ctx.beginPath(); G.last.path.forEach((p, i) => { const s = scr(p.x, p.y, p.z); if (i) ctx.lineTo(s.x, s.y); else ctx.moveTo(s.x, s.y); }); ctx.stroke(); ctx.setLineDash([]); }
  if (G.aim && G.state === 'aim') { const P = previewPath(G, G.aim.p, G.aim.yaw); P.forEach((p, i) => { if (i % 3) return; const s = scr(p.x, p.y, p.z); if (!s.front) return; ctx.fillStyle = `rgba(255,255,255,${0.95 - i / P.length * 0.5})`; ctx.beginPath(); ctx.arc(s.x, s.y, Math.max(2, 5 * k - i * 0.03), 0, TAU); ctx.fill(); });
    // the power bar
    const bx = W - 26 * k, by = H * 0.42, bh = H * 0.3; ctx.fillStyle = 'rgba(14,18,30,.6)'; rrect(bx - 9 * k, by, 18 * k, bh, 9 * k); ctx.fill(); const p = G.aim.p; const gr = ctx.createLinearGradient(0, by + bh, 0, by); gr.addColorStop(0, '#40d870'); gr.addColorStop(0.6, '#ffd040'); gr.addColorStop(1, '#ff5a4a'); ctx.fillStyle = gr; rrect(bx - 9 * k, by + bh * (1 - p), 18 * k, bh * p, 9 * k); ctx.fill();
    ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText(`${Math.round(p * 100)}`, bx, by - 10 * k); }
  // the pull itself
  if (ui.drag) { const d = ui.drag; ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 4 * k; ctx.beginPath(); ctx.moveTo(d.x0, d.y0); ctx.lineTo(d.x, d.y); ctx.stroke(); ctx.fillStyle = 'rgba(255,138,58,.85)'; ctx.beginPath(); ctx.arc(d.x, d.y, 16 * k, 0, TAU); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(d.x0, d.y0, 10 * k, 0, TAU); ctx.stroke(); }
  else if (G.state === 'aim' && !G.over && G.used === 0 && G.N <= 3) { const t = (now * 0.8) % 1, x = W / 2, y = H * 0.72 + t * 110 * k; ctx.globalAlpha = 0.8 * (1 - t); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 18 * k, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; ctx.font = `400 ${Math.round(15 * k)}px ${TF}`; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText('PULL BACK, LET GO', W / 2, H * 0.68); } }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { const D = G.lesson, st = D.steps[D.i], x = 12, w = W - 24, y = 44 * k; ctx.save(); ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; const lines = wrapText(st.how, w - 24), h = 50 * k + lines.length * 17 * k;
  ctx.fillStyle = 'rgba(14,18,30,.88)'; rrect(x, y, w, h, 12); ctx.fill(); ctx.strokeStyle = 'rgba(255,138,58,.7)'; ctx.lineWidth = 2; rrect(x, y, w, h, 12); ctx.stroke();
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#ff8a3a'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillText(`LESSON ${G.N} OF 3 · ${D.n}/${st.need}`, x + 12, y + 9 * k);
  ctx.fillStyle = '#fff'; ctx.font = `400 ${Math.round(16 * k)}px ${TF}`; ctx.fillText(st.title, x + 12, y + 23 * k); ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.92)'; lines.forEach((l, i) => ctx.fillText(l, x + 12, y + 46 * k + i * 17 * k)); ctx.restore(); ctx.textBaseline = 'middle'; }
