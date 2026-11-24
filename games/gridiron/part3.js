// ===================== THE VIEW: Gridiron (sideways; from behind the attacking team) =====================
// A green field with white yard lines every five yards and numbers every ten, end zones in the teams' colours, the blue line
// of scrimmage and the yellow first-down line drawn across. Ten players in helmets and pads; the ball carrier stands on a
// bright ring. Before each play the camera pulls back over the formation and the chosen play's routes are drawn on the grass.
const FX = { shake: 0, stop: 0, flash: 0, red: 0, slow: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { snap: true, banner: null, stick: null, btn: {}, flash: 0, rp: null, rpOffer: null };
// ---------- the replay: every live play is recorded; after a touchdown or a big gain a REPLAY chip shows it again, half speed ----------
const REC = [];
function recFrame(G) { const b = G.ball; REC.push({ P: G.P.map(p => [p.x, p.z, p.face, p.vx, p.vz, p.held, p.dodge]), b: [b.x, b.y, b.z, b.kind, b.own ? b.own.id : -1], los: G.los, fdl: G.fdl, ctrl: G.ctrl }); if (REC.length > 720) REC.shift(); }
const RPK = ['x', 'z', 'face', 'vx', 'vz', 'held', 'dodge'];
function rpApply(G, f) { const b = G.ball, save = { P: G.P.map(p => RPK.map(kk => p[kk])), b: [b.x, b.y, b.z, b.kind, b.own], phase: G.phase, los: G.los, fdl: G.fdl, ctrl: G.ctrl };
  G.P.forEach((p, i) => RPK.forEach((kk, j) => p[kk] = f.P[i][j])); b.x = f.b[0]; b.y = f.b[1]; b.z = f.b[2]; b.kind = f.b[3]; b.own = f.b[4] >= 0 ? G.P[f.b[4]] : null; G.phase = 'live'; G.los = f.los; G.fdl = f.fdl; G.ctrl = f.ctrl; return save; }
function rpRestore(G, s) { const b = G.ball; G.P.forEach((p, i) => RPK.forEach((kk, j) => p[kk] = s.P[i][j])); b.x = s.b[0]; b.y = s.b[1]; b.z = s.b[2]; b.kind = s.b[3]; b.own = s.b[4]; G.phase = s.phase; G.los = s.los; G.fdl = s.fdl; G.ctrl = s.ctrl; }
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 160) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40 * k, t: 0, life: 0.5 + Math.random() * 0.4, col, r: (1.5 + Math.random() * 2.5) * k }); } if (PARTS.length > 240) PARTS.splice(0, PARTS.length - 240); }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2.5); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.4) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 200 * dt; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (ui.banner) { ui.banner.t += dt; if (ui.banner.t > (ui.banner.secs || 1)) ui.banner = null; }
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; } }
function mySkin() { if (typeof HEADLESS !== 'undefined' && HEADLESS) return SKINS[0]; const id = store.get('skin', 'blue'); return SKINS.find(q => q.id === id) || SKINS[0]; }
const hexs = n => '#' + n.toString(16).padStart(6, '0');
function fieldTex(G) { const c = document.createElement('canvas'), S = 12, w = (HW * 2 + 8) * S, h = 124 * S; c.width = w; c.height = h; const g = c.getContext('2d'), X = x => (x + HW + 4) * S, Z = z => (z + 12) * S;
  for (let z = -12; z < 112; z += 5) { g.fillStyle = (Math.floor(z / 5) % 2) ? '#3f8a3a' : '#469a40'; g.fillRect(0, Z(z), w, 5 * S); }
  g.fillStyle = hexs(mySkin().col); g.globalAlpha = 0.85; g.fillRect(X(-HW), Z(-10), HW * 2 * S, 10 * S); g.fillStyle = hexs(G.kit[0]); g.fillRect(X(-HW), Z(100), HW * 2 * S, 10 * S); g.globalAlpha = 1;
  g.strokeStyle = '#fff'; g.lineWidth = 0.25 * S; g.strokeRect(X(-HW), Z(-10), HW * 2 * S, 120 * S);
  for (let z = 0; z <= 100; z += 5) { g.beginPath(); g.moveTo(X(-HW), Z(z)); g.lineTo(X(HW), Z(z)); g.stroke(); } g.lineWidth = 0.12 * S; for (let z = 1; z < 100; z++) for (const x of [-HW + 1, -3, 3, HW - 1]) { g.beginPath(); g.moveTo(X(x - 0.4), Z(z)); g.lineTo(X(x + 0.4), Z(z)); g.stroke(); }
  g.fillStyle = 'rgba(255,255,255,.9)'; g.font = `bold ${3 * S}px Teko, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; for (let z = 10; z < 100; z += 10) { const n = z <= 50 ? z : 100 - z; for (const x of [-HW + 5, HW - 5]) { g.save(); g.translate(X(x), Z(z)); g.rotate(x < 0 ? Math.PI / 2 : -Math.PI / 2); g.fillText(String(n), 0, 0); g.restore(); } }
  g.font = `bold ${6 * S}px Teko, sans-serif`; g.fillStyle = 'rgba(255,255,255,.75)'; g.fillText('GRIDIRON', X(0), Z(-5)); g.fillText(G.foe.toUpperCase().split(' ').pop(), X(0), Z(105));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
function buildWorld() {
  if (V3) return V3; const T = window.THREE; if (!T || !W3 || !W3.init({ canvas: $('gl'), fov: 46, far: 600, near: 0.3, dims: () => [W, H] })) { V3 = { none: true }; return V3; }
  V3 = { T, S: W3.scene, t: 0 }; const V = V3, S = V.S, M = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.6 }, o)); V.M = M;
  V.boxG = new T.BoxGeometry(1, 1, 1); V.sphG = new T.SphereGeometry(1, 14, 10); V.cylG = new T.CylinderGeometry(1, 1, 1, 12);
  W3.scene.children.forEach(o => { if (o.isLineSegments) o.visible = false; });
  V.field = new T.Mesh(new T.PlaneGeometry(HW * 2 + 8, 124), new T.MeshStandardMaterial({ roughness: 0.95 })); V.field.rotation.x = -Math.PI / 2; V.field.position.set(0, 0, 50); V.field.receiveShadow = true; S.add(V.field);
  V.ground = new T.Mesh(new T.PlaneGeometry(600, 600), M(0x2a5a2a, { roughness: 1 })); V.ground.rotation.x = -Math.PI / 2; V.ground.position.y = -0.03; S.add(V.ground);
  // stands along both sidelines with a crowd, goalposts at both ends
  V.crowd = new T.Group(); S.add(V.crowd); const tier = M(0x2a2e3a), seats = []; for (const s of [-1, 1]) for (let r = 0; r < 8; r++) { const t2 = new T.Mesh(V.boxG, tier); t2.scale.set(1.6, 0.8, 130); t2.position.set(s * (HW + 6 + r * 1.6), 0.8 + r * 0.8, 50); V.crowd.add(t2); for (let i = 0; i < 70; i++) seats.push([s * (HW + 6 + r * 1.6), 1.6 + r * 0.8, -14 + i * 1.85]); }
  const fan = new T.InstancedMesh(new T.BoxGeometry(0.6, 0.9, 0.5), M(0xffffff, { roughness: 0.9 }), seats.length), d = new T.Object3D(), col = new T.Color(); seats.forEach((p, i) => { d.position.set(p[0], p[1], p[2]); d.updateMatrix(); fan.setMatrixAt(i, d.matrix); col.setHSL(Math.random(), 0.5, 0.35 + Math.random() * 0.3); fan.setColorAt(i, col); }); V.crowd.add(fan); V.fans = fan; V.seats = seats;
  for (const z of [-10, 110]) { const y = M(0xf2d020, { metalness: 0.3 }), g = new T.Group(); const post = new T.Mesh(V.cylG, y); post.scale.set(0.12, 3, 0.12); post.position.y = 1.5; g.add(post); const bar = new T.Mesh(V.cylG, y); bar.scale.set(0.1, 6, 0.1); bar.rotation.z = Math.PI / 2; bar.position.y = 3; g.add(bar); for (const x of [-3, 3]) { const u = new T.Mesh(V.cylG, y); u.scale.set(0.08, 6, 0.08); u.position.set(x, 6, 0); g.add(u); } g.position.set(0, 0, z); S.add(g); }
  const lamp = new T.PointLight(0xffffff, 120, 140, 1.4); lamp.position.set(0, 40, 50); S.add(lamp); V.lamp = lamp;
  // the lines across: scrimmage (blue) and first down (yellow)
  V.los = new T.Mesh(new T.PlaneGeometry(HW * 2, 0.35), new T.MeshBasicMaterial({ color: 0x3a8aff, transparent: true, opacity: 0.85, depthWrite: false })); V.los.rotation.x = -Math.PI / 2; V.los.position.y = 0.03; S.add(V.los);
  V.fdl = new T.Mesh(new T.PlaneGeometry(HW * 2, 0.35), new T.MeshBasicMaterial({ color: 0xffe030, transparent: true, opacity: 0.9, depthWrite: false })); V.fdl.rotation.x = -Math.PI / 2; V.fdl.position.y = 0.035; S.add(V.fdl);
  V.men = []; for (let i = 0; i < 10; i++) V.men.push(player(V));
  V.ring = new T.Mesh(new T.RingGeometry(0.6, 0.85, 32), new T.MeshBasicMaterial({ color: 0xffe040, transparent: true, opacity: 0.95, depthWrite: false })); V.ring.rotation.x = -Math.PI / 2; S.add(V.ring);
  V.myRing = new T.Mesh(new T.RingGeometry(0.55, 0.7, 32), new T.MeshBasicMaterial({ color: 0x7af0ff, transparent: true, opacity: 0.9, depthWrite: false })); V.myRing.rotation.x = -Math.PI / 2; S.add(V.myRing);
  V.ball = new T.Mesh(new T.SphereGeometry(0.2, 14, 10), M(0x7a3a1a, { roughness: 0.7 })); V.ball.scale.set(1, 0.65, 0.65); V.ball.castShadow = true; S.add(V.ball);
  V.routeM = new T.LineDashedMaterial({ color: 0xffffff, dashSize: 0.8, gapSize: 0.5, transparent: true, opacity: 0.9 }); V.routes = [];
  W3.setQuality(stepN); return V; }
function player(V) { const T = V.T, M = V.M, g = new T.Group(), jersey = M(0x2a5ad8, { roughness: 0.7 }), pants = M(0xe8e8e8), helm = M(0x2a5ad8, { roughness: 0.3, metalness: 0.2 }), skin = M(0x8d5524);
  const torso = new T.Mesh(V.boxG, jersey); torso.scale.set(0.5, 0.7, 0.62); torso.position.y = 1.3; g.add(torso); const pads = new T.Mesh(V.boxG, jersey); pads.scale.set(0.55, 0.22, 0.85); pads.position.y = 1.62; g.add(pads);
  const legs = []; for (const s of [-1, 1]) { const L = new T.Group(); L.position.set(0, 0.95, s * 0.15); const sh = new T.Mesh(V.boxG, pants); sh.scale.set(0.2, 0.9, 0.2); sh.position.y = -0.45; L.add(sh); const sk = new T.Mesh(V.boxG, M(0x111111)); sk.scale.set(0.32, 0.1, 0.18); sk.position.set(0.06, -0.92, 0); L.add(sk); g.add(L); legs.push(L); }
  const head = new T.Mesh(V.sphG, helm); head.scale.setScalar(0.24); head.position.y = 1.95; g.add(head); const mask = new T.Mesh(V.boxG, M(0x888888, { metalness: 0.6 })); mask.scale.set(0.08, 0.14, 0.3); mask.position.set(0.22, 1.9, 0); g.add(mask);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); V.S.add(g); return { g, torso, pads, jersey, helm, legs, ph: Math.random() * 6 }; }
// ---------- every frame ----------
function sync(V, G, dt) { V.t += dt; const b = G.ball;
  if (V.for !== G.seed + ':' + G.N) { V.for = G.seed + ':' + G.N; V.field.material.map = fieldTex(G); V.field.material.needsUpdate = true; W3.setSky(G.place === 0 ? 'golden' : G.place === 1 ? 'dusk' : 'night'); V.lamp.intensity = G.place === 0 ? 30 : 120; V.crowd.visible = G.place > 0; }
  const mine = mySkin().col, foe = G.kit[0];
  G.P.forEach((p, i) => { const m = V.men[i], v = Math.hypot(p.vx, p.vz), c = p.t === 0 ? mine : foe; m.jersey.color.setHex(c); m.helm.color.setHex(c); m.g.position.set(p.x, 0, p.z); m.g.rotation.y = -p.face; m.g.scale.setScalar(1.45);      /* 22 Nov 2026: players were specks; bigger, each on a disc of his team's colour */
    if (!m.disc) { m.disc = new V.T.Mesh(new V.T.CircleGeometry(0.95, 20), new V.T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, depthWrite: false })); m.disc.rotation.x = -Math.PI / 2; V.S.add(m.disc); } m.disc.position.set(p.x, 0.03, p.z); m.disc.material.color.setHex(p.t === 0 ? 0x4aa0ff : 0xff5a4a);
    m.ph += dt * (2 + v * 1.4); const sw = Math.sin(m.ph) * Math.min(0.7, v * 0.1); m.legs[0].rotation.z = sw; m.legs[1].rotation.z = -sw; m.g.rotation.z = p.held > 0 ? 0.35 : 0; m.g.position.y = p.dodge > 0 ? 0.25 : 0; });
  const o = b.own; V.ring.visible = !!o && b.kind === 'held'; if (o) V.ring.position.set(o.x, 0.04, o.z); V.ring.material.color.setHex(o && o.t === 0 ? 0xffe040 : 0xff6a4a);
  const c = me(G); V.myRing.visible = G.phase === 'live' && c !== o; V.myRing.position.set(c.x, 0.04, c.z);
  V.ball.position.set(b.x + (b.kind === 'held' ? 0.25 : 0), b.y, b.z); V.ball.rotation.y = b.kind === 'air' ? Math.PI / 2 : 0; if (b.kind === 'air') V.ball.rotation.x += dt * 12;
  V.los.position.z = G.los; V.fdl.position.z = G.fdl; V.fdl.visible = G.fdl <= 100;
  // routes on the grass before the snap
  const want = G.phase === 'pick' && G.play && G.att === 0 ? G.play : null; if (V.routeFor !== want + ':' + G.los) { V.routeFor = want + ':' + G.los; V.routes.forEach(l => V.S.remove(l)); V.routes = [];
    if (want) { const pl = PLAYS[want], L = G.los, mk = (pts, col) => { const geo = new V.T.BufferGeometry().setFromPoints(pts.map(([x, z]) => new V.T.Vector3(x, 0.06, L + z))); const ln = new V.T.Line(geo, V.routeM.clone()); ln.material.color.setHex(col); ln.computeLineDistances(); V.S.add(ln); V.routes.push(ln); };
      mk([[0, -5]].concat(pl.rb), pl.kind === 'run' ? 0xffe040 : 0xffffff); pl.wr.forEach((r, j) => mk([[j ? 10 : -10, -0.6]].concat(r), 0xffffff)); } }
  if (V.fans && V.t - (V.fanT || 0) > 0.05) { V.fanT = V.t; const d = new V.T.Object3D(), ex = Math.max(0, V.cheer || 0); for (let i = 0; i < 40; i++) { const j = (Math.random() * V.seats.length) | 0, s = V.seats[j]; d.position.set(s[0], s[1] + Math.random() * 0.15 * (1 + ex * 3), s[2]); d.updateMatrix(); V.fans.setMatrixAt(j, d.matrix); } V.fans.instanceMatrix.needsUpdate = true; V.cheer = Math.max(0, (V.cheer || 0) - dt * 0.4); }
  // the camera: behind the attacking team; pulled back and up before the snap, closer once the ball is live
  const cam = W3.cam, live = G.phase === 'live', fz = live && b ? (b.kind === 'air' ? Math.min(b.z, (b.tz + b.z) / 2) : b.z) : G.los, fx = live ? b.x * 0.5 : 0;
  const want2 = live ? [fx, 9.5, fz - 12, fx * 0.8, 0, fz + 9] : [0, 17, G.los - 15, 0, 0, G.los + 9]; if (!V.cv || ui.snap) { V.cv = want2.slice(); ui.snap = false; } const kq = Math.min(1, dt * (live ? 4 : 2.5)); for (let i = 0; i < 6; i++) V.cv[i] += (want2[i] - V.cv[i]) * kq;
  const asp = W / H, sh = FX.shake ? (Math.random() - 0.5) * FX.shake * 0.01 : 0; cam.fov = asp > 1.6 ? 46 : 54; cam.aspect = asp; cam.updateProjectionMatrix();
  cam.position.set(V.cv[0] + sh, V.cv[1] + sh, V.cv[2]); cam.lookAt(V.cv[3], V.cv[4], V.cv[5]); cam.updateMatrixWorld(); W3.setFocus(V.cv[3], 0, V.cv[5], 26); }
const SV = window.THREE ? new THREE.Vector3() : null;
function scr(x, y, z) { if (!V3 || V3.none) return { x: W / 2, y: H / 2 }; SV.set(x, y, z); return W3.screen(SV); }
const ord = n => ['', '1st', '2nd', '3rd', '4th'][n] || n + 'th';
// ---------- what happens, seen and heard ----------
function onEvent(G, e) { const cx = W / 2;
  switch (e.k) {
    case 'drive': ui.snap = true; ui.banner = { txt: e.t === 0 ? 'YOUR BALL' : 'DEFEND!', t: 0, secs: 1.3, col: e.t === 0 ? '#ffe060' : '#ff9a8a' }; sfx.whistle(); if (G.cfg.mode === 'first' && e.t === 0) tip('first', 'Gain two first downs: get past the yellow line, twice.', 3.6); else if (G.cfg.mode === 'redzone') tip('rz', 'Score from the 10: four downs to reach the end zone.', 3.4); else if (G.cfg.mode === 'stop') tip('stop', 'Stop them: four downs. SWITCH, then TACKLE.', 3.4); else if (e.t === 0 && G.drive === 0 && G.cfg.style !== 'even' && !G.lesson) { hint = { txt: 'Their defence: ' + STYLES[G.cfg.style] + '.', t: 0, secs: 3.2 }; } break;
    case 'pick': sfx.click(); break;
    case 'snap': sfx.hut(); ui.snap = false; REC.length = 0; ui.rpOffer = null; break;
    case 'handoff': sfx.thud(); break;
    case 'throw': sfx.throwB(); if (e.deep) say('GOING DEEP!', cx, H * 0.32, '#ffe060', 20); break;
    case 'catch': sfx.catchB(); if (e.t === G.att) { const p = scr(G.ball.x, 2, G.ball.z); say(e.open > 3 ? 'WIDE OPEN!' : 'CAUGHT!', p.x, p.y - 30 * k, '#9be3b5', 18); } break;
    case 'incomplete': sfx.thud(); say(e.why === 'broken' ? 'BROKEN UP' : e.why === 'drop' ? 'DROPPED' : 'INCOMPLETE', cx, H * 0.36, '#fff', 20); break;
    case 'int': sfx.whistle(); FX.shake = 6; ui.banner = { txt: e.t === 0 ? 'INTERCEPTED! OUR BALL' : 'INTERCEPTED!', t: 0, secs: 1.6, col: e.t === 0 ? '#ffe060' : '#ffb4a8' }; break;
    case 'tackle': sfx.hit(); FX.shake = 5; vibe(e.t === 0 ? HAP.sharp : HAP.light); if (e.sack) say('SACKED!', cx, H * 0.34, e.t === 0 ? '#ffe060' : '#ffb4a8', 24); { const p = scr(e.x, 1, e.z); burst(p.x, p.y, '#ffffff', 10, 120); } break;
    case 'juked': sfx.whoosh(); { const p = scr(G.ball.x, 2, G.ball.z); say('JUKED HIM!', p.x, p.y - 30 * k, '#ffe060', 18); } break;
    case 'dodge': sfx.whoosh(); break;
    case 'block': if (Math.random() < 0.4) sfx.pad(); break;
    case 'missed': sfx.whoosh(); say('MISSED TACKLE', cx, H * 0.38, '#ffd0a0', 16); break;
    case 'dive': sfx.pad(); break;
    case 'result': if (G.att === 0 && e.gain >= 15 && !G.lesson && REC.length > 40) ui.rpOffer = REC.slice(); if (e.why === 'out') say('OUT OF BOUNDS', cx, H * 0.4, '#fff', 16); else if (e.why !== 'inc') say(`${e.gain >= 0 ? '+' : ''}${e.gain} YD`, cx, H * 0.42, e.gain >= 5 ? '#9be3b5' : '#fff', 22); break;
    case 'first': sfx.chain(); ui.banner = { txt: 'FIRST DOWN!', t: 0, secs: 1.2, col: e.t === 0 ? '#ffe060' : '#ffb4a8' }; vibe(HAP.light); break;
    case 'td': if (e.t === 0 && !G.lesson && REC.length > 40) ui.rpOffer = REC.slice(); sfx.td(e.t === 0); V3 && (V3.cheer = 3); FX.flash = 0.6; vibe(e.t === 0 ? HAP.best : HAP.light); ui.banner = { txt: e.t === 0 ? 'TOUCHDOWN!' : 'THEY SCORE', t: 0, secs: 2, col: e.t === 0 ? '#ffe060' : '#ffb4a8' }; burst(cx, H * 0.3, '#ffe060', 40, 260); break;
    case 'turnover': ui.banner = { txt: e.why === 'downs' ? 'TURNOVER ON DOWNS' : 'TURNOVER', t: 0, secs: 1.6, col: '#ffd0a0' }; sfx.whistle(); break;
    case 'switch': sfx.click(); break;
    case 'ot': ui.banner = { txt: 'OVERTIME', t: 0, secs: 1.6, col: '#ffe060' }; break;
    case 'won': sfx.win(); break; case 'lost': sfx.lose(); break;
    case 'lessonnext': hint = null; break; case 'lessonok': sfx.coin(e.n); say(`${e.n} OF ${e.need}`, cx, H * 0.36, '#9be3b5', 20); break;
    case 'lessonmiss': coachMiss(); sfx.no(); break;
    case 'lessondone': sfx.td(true); say('READY FOR THE REAL THING!', cx, H * 0.4, '#ffe060', 24); break;
  } }
let IG = null, IM = {}; function idleG() { if (!IG || IG.over || IG.t > 40) { IG = newGame(5 + ((Math.random() * 10) | 0), { seed: (Math.random() * 1e6) | 0 }); IM = {}; } honest(IG, { react: 0.3, acc: 0.95 }, IM); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#0f1c12'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D field.', W / 2, H / 2); if (G) hud(G, now); return; }
  const g = G || idleG(); sync(V, g, dt); W3.render(dt);
  if (G && !(G.over && !$('ovEnd').classList.contains('hidden'))) hud(G, now);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 0.9 ? 1 : 1 - (t2.t - 0.9) / 0.5; ctx.globalAlpha = Math.max(0, al); ctx.font = `600 ${Math.round(t2.size * 1.2 * k)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(8,20,10,.75)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 20); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 20); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W * 0.5), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30, hy = H * 0.28;
    ctx.fillStyle = 'rgba(10,24,12,.94)'; rrect(W / 2 - w / 2, hy - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, hy - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,250,220,${FX.flash * 0.35})`; ctx.fillRect(0, 0, W, H); } }
// ---------- the 2D layer: scoreboard and down, play cards and SNAP, receiver buttons, the stick and the buttons ----------
function layout(G) { const r = 40 * k, bx = W - 66 * k, by = H - 66 * k, ks = G ? G.cfg.plays : [], cw = Math.min(118 * k, (W - 220 * k) / Math.max(1, ks.length) - 8), ch = 64 * k;
  return { a: { x: bx, y: by, r: r * 1.15 }, b: { x: bx - 100 * k, y: by + 8 * k, r }, c: { x: bx - 20 * k, y: by - 96 * k, r: r * 0.82 }, snap: { x: W - 130 * k, y: H - 86 * k, w: 116 * k, h: 64 * k }, rp: { x: W - 136 * k, y: 10 * k, w: 122 * k, h: 38 * k },
    cards: ks.map((key, i) => ({ key, x: 14 + i * (cw + 8), y: H - ch - 16 * k, w: cw, h: ch })) }; }
function recvButtons(G) { if (G.phase !== 'live' || G.att !== 0) return []; const b = G.ball; if (!b.own || b.own.role !== 'QB' || G.thrown || PLAYS[G.play].kind !== 'pass') return [];
  return eligible(G).map(q => { const p = scr(q.x, 2.6, q.z), o = openness(G, q); return { id: q.id, x: p.x, y: p.y - 14 * k, r: 22 * k, o, col: o > 3 ? '#3ad06a' : o > 1.8 ? '#ffd23a' : '#ff5a4a' }; }); }
function hud(G, now) { ctx.textBaseline = 'middle'; const L = layout(G), b = G.ball, p = me(G);
  if (ui.rp) { const pulse = 0.6 + 0.4 * Math.sin(now * 6); ctx.fillStyle = 'rgba(8,20,10,.85)'; rrect(W - 214 * k, 10 * k, 200 * k, 40 * k, 10 * k); ctx.fill(); ctx.fillStyle = `rgba(255,70,60,${pulse})`; ctx.beginPath(); ctx.arc(W - 194 * k, 30 * k, 7 * k, 0, TAU); ctx.fill();
    ctx.font = `600 ${Math.round(20 * k)}px ${TF}`; ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.fillText('REPLAY', W - 180 * k, 31 * k); ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillStyle = '#cfe8d4'; ctx.fillText('tap to skip', W - 92 * k, 31 * k);
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 6 * k; ctx.strokeRect(3 * k, 3 * k, W - 6 * k, H - 6 * k); return; }
  if (ui.rpOffer && !G.over) { const R2 = L.rp; ctx.fillStyle = 'rgba(255,224,96,.95)'; rrect(R2.x, R2.y, R2.w, R2.h, 10 * k); ctx.fill(); ctx.fillStyle = '#1a1a1a'; ctx.font = `600 ${Math.round(19 * k)}px ${TF}`; ctx.textAlign = 'center'; ctx.fillText('▶ REPLAY', R2.x + R2.w / 2, R2.y + R2.h / 2 + 1); }
  if (G.lesson) lessonPanel(G);
  else { const w = 360 * k, x0 = W / 2 - w / 2, y0 = 8 * k; ctx.fillStyle = 'rgba(8,20,10,.85)'; rrect(x0, y0, w, 34 * k, 10 * k); ctx.fill();
    ctx.font = `600 ${Math.round(16 * k)}px ${TF}`; ctx.textAlign = 'right'; ctx.fillStyle = '#9ad8ff'; ctx.fillText(`YOU ${G.score[0]}`, W / 2 - 50 * k, y0 + 18 * k); ctx.textAlign = 'left'; ctx.fillStyle = hexs(G.kit[0]); ctx.fillText(`${G.score[1]} ${G.foe.split(' ').pop().toUpperCase()}`, W / 2 + 50 * k, y0 + 18 * k);
    ctx.textAlign = 'center'; ctx.fillStyle = '#ffe060'; ctx.fillText(G.fdl >= 100 ? `${ord(G.down)} & GOAL` : `${ord(G.down)} & ${Math.round(G.togo)}`, W / 2, y0 + 18 * k);
    const yl = Math.round(G.los <= 50 ? G.los : 100 - G.los); ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.8)'; const side = Math.round(G.los) === 50 ? 'at midfield' : G.los < 50 ? (G.att === 0 ? `on your own ${yl}` : `on their own ${yl}`) : (G.att === 0 ? `on their ${yl}` : `on your ${yl}`); ctx.fillText(`${G.att === 0 ? 'YOUR BALL' : 'THEIR BALL'} · ${side}`, W / 2, y0 + 44 * k); }
  const btn = (o, label, sub, col, on) => { ctx.fillStyle = on ? col : 'rgba(8,20,10,.6)'; ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, TAU); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = on ? '#0a1a0a' : '#fff'; ctx.textAlign = 'center'; ctx.font = `600 ${Math.round(17 * k)}px ${TF}`; ctx.fillText(label, o.x, o.y - (sub ? 5 * k : 0)); if (sub) { ctx.font = `700 ${Math.round(9 * k)}px ${BC}`; ctx.fillText(sub, o.x, o.y + 12 * k); } };
  if (G.phase === 'pick' && G.att === 0 && !G.over) { // the play cards and SNAP
    for (const c of L.cards) { const pl = PLAYS[c.key], sel = G.play === c.key; ctx.fillStyle = sel ? 'rgba(255,224,96,.95)' : 'rgba(8,20,10,.82)'; rrect(c.x, c.y, c.w, c.h, 10 * k); ctx.fill(); ctx.strokeStyle = pl.kind === 'run' ? '#ffe060' : '#9ad8ff'; ctx.lineWidth = 2; ctx.stroke();
      ctx.textAlign = 'center'; ctx.fillStyle = sel ? '#0a1a0a' : '#fff'; ctx.font = `600 ${Math.round(19 * k)}px ${TF}`; ctx.fillText(pl.name.toUpperCase(), c.x + c.w / 2, c.y + 20 * k); ctx.font = `700 ${Math.round(9 * k)}px ${BC}`; ctx.fillStyle = sel ? '#2a3a2a' : 'rgba(255,255,255,.75)'; wrapText(pl.desc, c.w - 10).slice(0, 2).forEach((l, i) => ctx.fillText(l, c.x + c.w / 2, c.y + 38 * k + i * 11 * k)); }
    const S2 = L.snap; ctx.fillStyle = G.play ? '#ffe060' : 'rgba(255,255,255,.2)'; rrect(S2.x, S2.y, S2.w, S2.h, 14 * k); ctx.fill(); ctx.fillStyle = '#0a1a0a'; ctx.font = `600 ${Math.round(28 * k)}px ${TF}`; ctx.textAlign = 'center'; ctx.fillText(G.play ? 'SNAP' : 'PICK A PLAY', S2.x + S2.w / 2, S2.y + S2.h / 2 + 2, S2.w - 10);
    if (ui.banner) banner(); return; }
  // receiver buttons over each eligible man, coloured by how open he is
  for (const r of recvButtons(G)) { ctx.fillStyle = r.col; ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, TAU); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#0a1a0a'; ctx.font = `600 ${Math.round(16 * k)}px ${TF}`; ctx.textAlign = 'center'; ctx.fillText(G.P[r.id].role, r.x, r.y + 1); }
  // the stick
  const s2 = ui.stick; if (s2) { ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.arc(s2.x0, s2.y0, 56 * k, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 2; ctx.stroke(); const dx = s2.x - s2.x0, dy = s2.y - s2.y0, d = Math.hypot(dx, dy), m = Math.min(1, 56 * k / (d || 1)); ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.arc(s2.x0 + dx * m, s2.y0 + dy * m, 24 * k, 0, TAU); ctx.fill(); }
  else if (G.phase === 'live') { ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(90 * k, H - 90 * k, 56 * k, 0, TAU); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillText('MOVE', 90 * k, H - 90 * k); }
  if (G.phase === 'live') { const lab = btnLabels(G); btn(L.a, lab.a, '', '#ffe060', !!ui.btn.a); btn(L.b, lab.b, '', '#9ad8ff', !!ui.btn.b); /* (no SPRINT button since 22 Nov 2026: push the stick all the way) */
    { const sx = 26 * k, sy = H - 26 * k; ctx.fillStyle = 'rgba(0,0,0,.35)'; rrect(sx, sy, 70 * k, 7 * k, 3 * k); ctx.fill(); ctx.fillStyle = p.st >= 0.25 ? '#9be3b5' : '#ff7a6a'; rrect(sx, sy, 70 * k * clamp(p.st, 0, 1), 7 * k, 3 * k); ctx.fill(); } }
  if (ui.banner) banner(); }
function banner() { const B = ui.banner; ctx.textAlign = 'center'; ctx.font = `600 ${Math.round(52 * k)}px ${TF}`; ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(8,20,10,.75)'; ctx.strokeText(B.txt, W / 2, H * 0.3); ctx.fillStyle = B.col || '#fff'; ctx.fillText(B.txt, W / 2, H * 0.3); }
// what the three buttons do now
function btnLabels(G) { const b = G.ball, p = me(G); if (G.att === 1) return { a: 'TACKLE', b: 'SWITCH', c: 'SPRINT' }; if (b.own === p && p.role === 'QB' && !G.handed && PLAYS[G.play].kind === 'run') return { a: 'HANDOFF', b: 'JUKE', c: 'SPRINT' }; return { a: 'DODGE', b: 'JUKE', c: 'SPRINT' }; }
function btnA(G) { const lab = btnLabels(G).a; if (lab === 'TACKLE') return tackleBtn(G); if (lab === 'HANDOFF') return handoff(G); return dodge(G); }
function btnB(G) { const lab = btnLabels(G).b; if (lab === 'SWITCH') return switchNear(G); return dodge(G); }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of String(t).split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { coachPanel(G); }
