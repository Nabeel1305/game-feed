// ===================== THE VIEW: Surf (sideways; from the sea, a little behind the surfer, the wave peeling to the right) =====================
// The wave is one mesh rebuilt each frame around the surfer: its face rises from the sea to the lip; behind the curl it is
// white water; in a barrel section the lip throws forward over a dark hollow; far ahead the shoulder fades. A foam trail
// follows the board; spray flies off hard turns and the lip. World: X along the shore (+ right), Z towards the beach, Y up.
const FX = { shake: 0, stop: 0, flash: 0, red: 0, slow: 0 }, TXT = [], PARTS = [], TRAIL = [];
let hint = null, V3 = null;
const ui = { snap: true, banner: null, stick: null, btn: {}, crId: null, sw: null, cam: null };
const optShake = () => store.get('shake', true) !== false, optSlow = () => store.get('slow', true) !== false;
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip2(key, txt, secs = 3) { if (HEADLESS) return; tip2.seen = tip2.seen || {}; if (tip2.seen[key]) return; tip2.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 160, up = 60) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - up * k, t: 0, life: 0.4 + Math.random() * 0.5, col, r: (1.5 + Math.random() * 3) * k }); } if (PARTS.length > 320) PARTS.splice(0, PARTS.length - 320); }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2.5); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.4) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 380 * k * dt; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (ui.banner) { ui.banner.t += dt; if (ui.banner.t > (ui.banner.secs || 1.6)) ui.banner = null; }
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; } }
function mySkin() { if (typeof HEADLESS !== 'undefined' && HEADLESS) return SKINS[0]; const id = store.get('skin', 'sun'); return SKINS.find(q => q.id === id) || SKINS[0]; }
const NXW = 72, NSW = 18, XB = -26, XA = 85, VIS = 1.6;      // (VIS: the wave is drawn a little taller than it rides, so a small wave still looks like one)      // the wave mesh: columns along the shore around the surfer, points across the profile
function buildWorld() {
  if (V3) return V3; const T = window.THREE; if (!T || !W3 || !W3.init({ canvas: $('gl'), fov: 55, far: 1200, near: 0.2, dims: () => [W, H] })) { V3 = { none: true }; return V3; }
  V3 = { T, S: W3.scene, t: 0, for: null, cx: 0 }; const V = V3, M = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.6 }, o)); V.M = M; const S = V.S;
  V.sea = W3.water({ size: 2400, color: 0x0a7a96, distort: 1.6, ripple: 3.4, speed: 0.6, y: 0 });
  const g = new T.BufferGeometry(), pos = new Float32Array(NXW * NSW * 3), col = new Float32Array(NXW * NSW * 3), idx = [];
  for (let i = 0; i < NXW - 1; i++) for (let j = 0; j < NSW - 1; j++) { const a = i * NSW + j, b = a + NSW; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  g.setIndex(idx); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('color', new T.BufferAttribute(col, 3));
  V.wave = new T.Mesh(g, new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.25, metalness: 0.05, side: T.DoubleSide, transparent: true, opacity: 0.96 })); V.wave.receiveShadow = true; S.add(V.wave);
  // the beach: sand, palms, a lifeguard hut
  const sand = new T.Mesh(new T.PlaneGeometry(2400, 200), M(0xe8d4a0, { roughness: 1 })); sand.rotation.x = -Math.PI / 2; sand.position.set(0, 0.4, 150); S.add(sand);
  V.palms = []; for (let i = 0; i < 26; i++) { const p = new T.Group(), h = 6 + (i * 37 % 5); const tr = new T.Mesh(new T.CylinderGeometry(0.25, 0.4, h, 8), M(0x8a6a42)); tr.position.y = h / 2; tr.rotation.z = 0.12 * ((i % 3) - 1); p.add(tr);
    for (let k2 = 0; k2 < 6; k2++) { const lf = new T.Mesh(new T.ConeGeometry(0.6, 4, 4), M(0x3a8a3a)); lf.position.set(Math.cos(k2) * 1.4, h, Math.sin(k2) * 1.4); lf.rotation.set(Math.sin(k2) * 1.2, 0, Math.cos(k2) * 1.2 + Math.PI / 2); p.add(lf); }
    p.position.set(-200 + i * 17 + (i * 13 % 7), 0.4, 70 + (i * 29 % 25)); S.add(p); V.palms.push(p); }
  V.me = surfer(V, mySkin()); S.add(V.me.g);
  W3.setQuality(stepN); return V; }
function surfer(V, sk) { const T = V.T, M = V.M, g = new T.Group(), board = new T.Mesh(new T.CapsuleGeometry ? new T.CapsuleGeometry(0.24, 1.6, 4, 10) : new T.BoxGeometry(0.5, 0.1, 2), M(sk.col, { roughness: 0.3 })); board.rotation.x = Math.PI / 2; board.scale.set(1, 1, 0.25); g.add(board);
  const stripe = new T.Mesh(new T.BoxGeometry(0.1, 0.06, 1.7), M(sk.col2)); stripe.position.y = 0.04; g.add(stripe);
  const body = new T.Group(); g.add(body); const skin = M(0xc98a5a), suit = M(0x1a1a24);
  const legL = new T.Mesh(new T.CylinderGeometry(0.08, 0.09, 0.8, 8), suit), legR = legL.clone(); legL.position.set(0, 0.45, 0.35); legR.position.set(0, 0.45, -0.35); body.add(legL, legR);
  const torso = new T.Mesh(new T.CapsuleGeometry ? new T.CapsuleGeometry(0.2, 0.5, 4, 8) : new T.BoxGeometry(0.4, 0.7, 0.3), suit); torso.position.y = 1.15; body.add(torso);
  const head = new T.Mesh(new T.SphereGeometry(0.16, 14, 10), skin); head.position.y = 1.62; body.add(head); const hair = new T.Mesh(new T.SphereGeometry(0.17, 12, 8, 0, TAU, 0, Math.PI / 2), M(0x3a2a1a)); hair.position.y = 1.65; body.add(hair);
  const armL = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 0.7, 8), skin), armR = armL.clone(); armL.position.set(0, 1.2, 0.45); armR.position.set(0, 1.2, -0.45); armL.rotation.x = 1.2; armR.rotation.x = -1.2; body.add(armL, armR);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return { g, board, body, legL, legR, armL, armR, torso }; }
// the wave's shape at a point along the shore: height and how much the lip throws there
function shapeAt(G, x) { const w = G.w, d = x - G.xb, cs = secAt(w, G.xb + 1), tl = cs.type === 'barrel' ? Math.min(TUBE, G.xb - cs.x0) : 0;
  const Hh = VIS * w.H * (d < 0 ? Math.max(0.35, 0.6 + d * 0.02) : d > 30 ? Math.max(0.03, 1 - (d - 30) / 50) : 1) * (x > w.L - 10 ? Math.max(0.2, 1 - (x - w.L + 10) / 30) : 1);
  const broken = d < 0 ? 1 : d < 1.5 ? 1 - d / 1.5 : 0, throwK = tl > 0 && d >= 0 && d < tl + 2 ? Math.min(1, (tl + 2 - d) / 3) * Math.min(1, d / 1.2 + 0.2) : 0, steep = secAt(w, G.xb + Math.max(0, d)).type === 'fast' ? 1 : 0;
  return { Hh, broken, throwK, steep }; }
// a point of the face (s from 0 at the base to 1 at the lip) in the world
function facePt(G, x, s, Hh) { return { x, y: Hh * Math.pow(s, 1.25), z: -Hh * 1.1 * (1 - s) }; }
function updateWave(V, G) { const T = V.T, g = V.wave.geometry, pos = g.attributes.position.array, col = g.attributes.color.array, P = G.p, cx = P.x, wz = G.phase === 'wait' ? -Math.max(0, G.tL - G.pt) * 7 : 0;
  for (let i = 0; i < NXW; i++) { const x = cx + XB + (XA - XB) * i / (NXW - 1), sh = shapeAt(G, x);
    for (let j = 0; j < NSW; j++) { const u = j / (NSW - 1); let X = x, Y, Z;
      if (u < 0.72) { const s = u / 0.72, f = facePt(G, x, s, sh.Hh); Y = f.y; Z = f.z - sh.Hh * 0.6 * (1 - s) * (1 - s); }       // the face
      else { const b = (u - 0.72) / 0.28; Y = sh.Hh * (1 - b * b); Z = b * sh.Hh * 2.4; }                                       // the back
      if (sh.throwK > 0 && u > 0.62 && u < 0.84) { const q = Math.sin((u - 0.62) / 0.22 * Math.PI); Z -= q * sh.throwK * sh.Hh * 1.1; Y += q * sh.throwK * sh.Hh * 0.1; }   // the lip throws over
      if (sh.broken > 0) { Y = Y * (1 - sh.broken * 0.45) + Math.sin(x * 3 + j * 1.7 + V.t * 9) * 0.12 * sh.broken; }
      const k2 = (i * NSW + j) * 3; pos[k2] = -X; pos[k2 + 1] = Math.max(0, Y) + 0.02; pos[k2 + 2] = Z + wz;
      const lip = u > 0.6 && u < 0.78 ? 1 : 0, deep = u < 0.72 ? u / 0.72 : 1 - (u - 0.72) / 0.28; let r = 0.04 + deep * 0.12, gg = 0.42 + deep * 0.35, bb = 0.55 + deep * 0.25;
      if (sh.steep && u < 0.72) { r *= 0.8; gg *= 0.85; bb *= 0.9; }
      if (lip) { r += 0.35; gg += 0.25; bb += 0.15; }
      const wf = Math.max(sh.broken, lip * 0.3); r = r + (1 - r) * wf; gg = gg + (1 - gg) * wf; bb = bb + (1 - bb) * wf; col[k2] = Math.min(1, r); col[k2 + 1] = Math.min(1, gg); col[k2 + 2] = Math.min(1, bb); } }
  g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true; g.computeVertexNormals(); g.computeBoundingSphere(); }
function surferPos(G) { const P = G.p, sh = shapeAt(G, P.x), wz = G.phase === 'wait' ? -Math.max(0, G.tL - G.pt) * 7 : 0;
  if (G.phase === 'wait') { const lift = clamp(1 - Math.abs(G.pt - G.tL) / 1.2, 0, 1); return { x: -P.x, y: 0.15 + lift * sh.Hh * 0.45, z: -0.4 - sh.Hh * 0.3, n: { y: 1, z: 0 } }; }
  const f = facePt(G, P.x, P.s, sh.Hh), s2 = Math.min(1, P.s + 0.05), f2 = facePt(G, P.x, s2, sh.Hh), tz = f2.z - f.z, ty = f2.y - f.y, m = Math.hypot(tz, ty) || 1;
  return { x: -f.x, y: f.y + (P.air ? P.h : 0) + 0.05, z: f.z - (P.air ? 0.4 : 0), up: { y: ty / m, z: tz / m }, n: { y: tz / m, z: -ty / m } }; }
function sync(V, G, dt) { V.t += dt; const T = V.T, P = G.p;
  if (V.for !== G.N) { V.for = G.N; W3.setSky(PLACES[G.cfg.place].sky); const s = mySkin(); V.S.remove(V.me.g); V.me = surfer(V, s); V.S.add(V.me.g); ui.cam = null; }
  updateWave(V, G);
  const sp = surferPos(G), S2 = V.me;
  S2.g.position.set(sp.x, sp.y, sp.z);
  if (G.phase === 'wait' || G.phase === 'out' && G.p.v < 1) { S2.g.rotation.set(0, Math.PI / 2, 0); S2.body.visible = G.phase !== 'wait'; S2.body.rotation.set(0, 0, 0); if (G.phase === 'wait') { S2.body.visible = true; S2.body.rotation.set(0, 0, -Math.PI / 2); S2.body.position.set(0, 0.25, 0); } }
  else { const th = P.th, ux = Math.cos(th), uy = Math.sin(th), up = sp.up || { y: 0.6, z: 0.8 }, dir = new T.Vector3(-ux, uy * up.y, uy * up.z).normalize(), nrm = new T.Vector3(0, sp.n.y, sp.n.z).normalize();
    const m = new T.Matrix4(), side = new T.Vector3().crossVectors(nrm, dir).normalize(); m.makeBasis(side, nrm, dir.clone().negate()); S2.g.quaternion.setFromRotationMatrix(m); S2.g.rotateY(Math.PI / 2);
    if (P.air) S2.g.rotateY(P.rot);
    const cr = G.crouch || P.inTube ? 1 : 0, wob = P.bal * Math.sin(V.t * 14) * 0.25; S2.body.position.set(0, -cr * 0.35, 0); S2.body.rotation.set(wob, 0, (P.th - (P.prevTh || P.th)) * -8 + cr * 0.25); P.prevTh = P.th;
    if (G.phase === 'out' && G.why) { S2.body.rotation.set(1.3 + V.t, 0, 0.6); } }
  // the foam trail behind the board
  if (G.phase !== 'ride') TRAIL.length = 0; if (G.phase === 'ride' && !P.air) { TRAIL.push({ x: sp.x, y: sp.y, z: sp.z, t: 0 }); } for (const q of TRAIL) q.t += dt; while (TRAIL.length && (TRAIL[0].t > 1.4 || TRAIL.length > 90)) TRAIL.shift();
  // the camera: from the sea, a little behind the surfer, showing the wave ahead (and the barrel's exit)
  const Hh = G.w.H * VIS, want = G.phase === 'wait' ? { pos: [-P.x + 3.5, Hh * 0.8 + 1.8, -Hh * 2.0 - 6], at: [-P.x - 3, Hh * 0.35, -1.5] } : { pos: [sp.x + 5 + P.v * 0.1, Hh * 0.75 + 1.9, -Hh * 1.3 - 5.2], at: [sp.x - 6 - (P.inTube ? 3 : 0), Hh * 0.45, -Hh * 0.3] };
  if (!ui.cam || ui.snap) { ui.cam = { pos: want.pos.slice(), at: want.at.slice() }; ui.snap = false; } else { const a = Math.min(1, dt * 3.2); for (let i = 0; i < 3; i++) { ui.cam.pos[i] += (want.pos[i] - ui.cam.pos[i]) * a; ui.cam.at[i] += (want.at[i] - ui.cam.at[i]) * a; } }
  const sk = FX.shake > 0 && optShake() ? (Math.random() - 0.5) * FX.shake * 0.02 : 0, cam = W3.cam; cam.position.set(ui.cam.pos[0] + sk, ui.cam.pos[1] + sk, ui.cam.pos[2]); cam.lookAt(ui.cam.at[0], ui.cam.at[1], ui.cam.at[2]); cam.updateMatrixWorld();
  W3.setFocus(sp.x, 1, sp.z, 22); }
function scrOf(x, y, z) { if (!V3 || V3.none) return null; return W3.screen(new V3.T.Vector3(x, y, z)); }
// ---------- events ----------
function onEvent(G, e) { const P = G.p, sp = surferPos(G), sc = scrOf(sp.x, sp.y + 1, sp.z) || { x: W / 2, y: H / 2 };
  switch (e.k) {
    case 'wave': ui.banner = { txt: G.lesson ? 'A WAVE IS COMING' : `WAVE ${e.n} OF ${G.free ? '∞' : G.cfg.rides}`, sub: 'Hold PADDLE, let go when the ring turns green', t: 0, secs: 2.2, small: true }; ui.snap = true; TRAIL.length = 0; sfx.swell(); break;
    case 'early': hint = { txt: 'Too early: wait until the wave lifts you (the ring turns green).', t: 0, secs: 2 }; sfx.no(); break;
    case 'missed': hint = { txt: e.why === 'paddle' ? 'Missed it: hold PADDLE as the wave comes, to match its speed.' : 'Missed it: let go of PADDLE while the ring is green.', t: 0, secs: 2.6 }; sfx.no(); break;
    case 'stand': sfx.stand(); vibe(HAP.light); say('UP!', sc.x, sc.y - 30 * k, '#fff', 26); break;
    case 'move': { const big = e.pts >= 150; sfx.move(e.id, e.combo); if (e.id !== 'carve') vibe(HAP.light); burst(sc.x, sc.y + 20 * k, '#ffffff', big ? 26 : 12, big ? 260 : 160);
      say(`${e.label} +${e.pts}`, W / 2, H * 0.3, e.rep ? '#c8e8ff' : '#ffd36a', big ? 30 : 24); if (e.rep >= 2) tip2('rep', 'The same move again scores less: mix them up (snaps, cutbacks, airs, barrels).', 3); if (e.combo >= 2) say(`COMBO x${(1 + 0.2 * e.combo).toFixed(1)}`, W / 2, H * 0.3 + 30 * k, '#8fe0ab', 18); } break;
    case 'launch': sfx.launch(); burst(sc.x, sc.y + 26 * k, '#ffffff', 22, 260); break;
    case 'spin': sfx.whoosh(); break;
    case 'landair': vibe(HAP.light); burst(sc.x, sc.y + 26 * k, '#ffffff', 18, 220); break;
    case 'tubein': sfx.tube(true); ui.banner = { txt: 'IN THE BARREL!', sub: 'Stay low, keep crouching', t: 0, secs: 1.4, small: true }; break;
    case 'tubeout': sfx.tube(false); break;
    case 'wipe': sfx.wipe(); vibe(HAP.thud); FX.shake = 10; burst(sc.x, sc.y, '#ffffff', 40, 300); ui.banner = { txt: 'WIPEOUT!', sub: e.why, t: 0, secs: 2.2, small: true }; break;
    case 'done': sfx.cheer(); ui.banner = { txt: 'RIDE COMPLETE', sub: `+${e.bonus} for riding it all the way`, t: 0, secs: 1.8, small: true }; vibe(HAP.light); break;
    case 'lessonnext': if (e.first) hint = null; say('FIRST, A LESSON', W / 2, H * 0.36, '#ffd36a', 24); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, W / 2, H * 0.42, '#8fe0ab', 24); sfx.coin(e.n); break;
    case 'lessonmiss': coachMiss(); break;
    case 'lessondone': say('NOW FOR A SESSION!', W / 2, H * 0.36, '#ffd36a', 24); sfx.fanfare(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.fanfare(); FX.flash = 0.5; vibe(HAP.best); break;
    case 'lost': sfx.lose(); ui.banner = { txt: 'SESSION OVER', sub: 'Not quite the target', t: 0, secs: 2 }; break;      // (P11: never vibrate on failure)
  } }
// ---------- the picture ----------
let IG = null, IM = {}; function idleG() { if (!IG || IG.over || IG.t > 60) { IG = newGame(8, { seed: (Math.random() * 1e6) | 0, free: true }); IM = {}; } honest(IG, { react: 0.2, acc: 0.95 }, IM); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#0a7a96'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D waves.', W / 2, H / 2); if (G) hud(G, now); return; }
  const g = G || idleG(); sync(V, g, dt || 1 / 60); W3.render(dt || 1 / 60);
  // the foam trail
  if (TRAIL.length > 2) { ctx.lineWidth = 5 * k; for (let i = 1; i < TRAIL.length; i++) { const a = TRAIL[i - 1], b = TRAIL[i], pa = scrOf(a.x, a.y, a.z), pb = scrOf(b.x, b.y, b.z); if (!pa || !pb || !pa.front || !pb.front || Math.hypot(pa.x - pb.x, pa.y - pb.y) > 60 * k) continue; ctx.strokeStyle = `rgba(255,255,255,${Math.max(0, 0.7 - b.t * 0.5)})`; ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke(); } }
  if (G && G.phase === 'ride' && !G.p.air && Math.abs((G.p.th - (G.p.lastTh != null ? G.p.lastTh : G.p.th))) > 0.03 && Math.random() < 0.6) { const sp = surferPos(G), sc = scrOf(sp.x, sp.y, sp.z); if (sc) burst(sc.x, sc.y, 'rgba(255,255,255,.9)', 3, 150, 80); } if (G) G.p.lastTh = G.p.th;
  if (G && !(G.over && !$('ovEnd').classList.contains('hidden'))) hud(G, now);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 1.1 ? 1 : 1 - (t2.t - 1.1) / 0.5; ctx.globalAlpha = Math.max(0, al); ctx.font = `400 ${Math.round(t2.size * k)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(0,40,60,.7)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 18); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 18); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, Math.min(W - 380 * k, 420 * k)), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30, hy = H - 46 * k - h / 2;
    ctx.fillStyle = 'rgba(0,40,60,.9)'; rrect(W / 2 - w / 2, hy - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, hy - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,255,240,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); } }
// ---------- the HUD ----------
function layout(G) { return { cr: { x: W - 86 * k, y: H - 88 * k, r: 60 * k } }; }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of String(t).split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function txt(s, x, y, col = '#fff', font, al = 'center') { ctx.textAlign = al; if (font) ctx.font = font; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,40,60,.7)'; ctx.strokeText(s, x, y); ctx.fillStyle = col; ctx.fillText(s, x, y); }
function hud(G, now) { ctx.textBaseline = 'middle'; const L = layout(G), P = G.p;
  // score against the target, the wave number
  { const y = 22 * k, tg = G.cfg.target, u = clamp(G.score / tg, 0, 1); ctx.fillStyle = 'rgba(0,40,60,.55)'; rrect(W / 2 - 160 * k, y - 16 * k, 320 * k, 34 * k, 12); ctx.fill();
    txt(`${Math.round(G.score)}`, W / 2 - 110 * k, y + 1, '#fff', `400 ${Math.round(20 * k)}px ${TF}`);
    if (!G.free && !G.lesson) { ctx.fillStyle = 'rgba(255,255,255,.2)'; rrect(W / 2 - 60 * k, y - 4 * k, 150 * k, 8 * k, 4); ctx.fill(); ctx.fillStyle = u >= 1 ? '#8fe0ab' : '#ffd36a'; rrect(W / 2 - 60 * k, y - 4 * k, 150 * k * u, 8 * k, 4); ctx.fill(); txt(`target ${tg}`, W / 2 + 15 * k, y + 13 * k, 'rgba(255,255,255,.85)', `700 ${Math.round(10 * k)}px ${BC}`); }
    txt(G.free ? `wave ${G.ride} · free surf` : G.lesson ? 'lesson' : `wave ${G.ride} / ${G.cfg.rides}`, W / 2 + 120 * k, y + 1, '#fff', `700 ${Math.round(12 * k)}px ${BC}`); }
  if (G.phase === 'wait') { const sp = surferPos(G), sc = scrOf(sp.x, sp.y + 0.6, sp.z); if (sc) { const d = G.pt - G.tL, inWin = d >= -G.cfg.early && d <= G.cfg.win, u = clamp(1 - (G.tL - G.pt) / 2.5, 0, 1);
      ctx.lineWidth = 6 * k; ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.arc(sc.x, sc.y, 34 * k, 0, TAU); ctx.stroke(); ctx.strokeStyle = inWin ? '#8fe0ab' : d > G.cfg.win ? '#ff8a7a' : '#ffd36a'; ctx.beginPath(); ctx.arc(sc.x, sc.y, 34 * k, -Math.PI / 2, -Math.PI / 2 + TAU * u); ctx.stroke();
      txt(inWin ? 'LET GO!' : G.crouch ? 'PADDLING…' : 'HOLD PADDLE', sc.x, sc.y - 52 * k, inWin ? '#8fe0ab' : '#fff', `400 ${Math.round(16 * k)}px ${TF}`);
      ctx.fillStyle = 'rgba(0,40,60,.55)'; rrect(sc.x - 40 * k, sc.y + 44 * k, 80 * k, 8 * k, 4); ctx.fill(); ctx.fillStyle = G.paddle >= 0.55 ? '#8fe0ab' : '#ffd36a'; rrect(sc.x - 40 * k, sc.y + 44 * k, 80 * k * G.paddle, 8 * k, 4); ctx.fill(); } }
  if (G.phase === 'ride') { // the curl behind you, the balance
    const gap = P.x - G.xb, bx = 16 * k, by = H * 0.3; txt('curl', bx + 10 * k, by - 14 * k, 'rgba(255,255,255,.85)', `700 ${Math.round(11 * k)}px ${BC}`); ctx.fillStyle = 'rgba(0,40,60,.55)'; rrect(bx, by, 16 * k, 100 * k, 6); ctx.fill(); const u = clamp(1 - gap / 20, 0, 1); ctx.fillStyle = u > 0.85 ? '#ff6a4a' : u > 0.55 ? '#ffd36a' : '#8fe0ab'; rrect(bx, by + 100 * k * (1 - u), 16 * k, 100 * k * u, 6); ctx.fill();
    const b = clamp(P.bal, 0, 1); if (b > 0.15) { txt('WOBBLY!', W / 2, H * 0.4, b > 0.7 ? '#ff8a7a' : '#ffd36a', `400 ${Math.round(18 * k)}px ${TF}`); }
    if (secAt(G.w, G.xb + 14).type === 'fast' && secAt(G.w, G.xb + 1).type !== 'fast') txt('THE WAVE STEEPENS: IT WILL BREAK FAST!', W / 2, 62 * k, '#ffd36a', `700 ${Math.round(13 * k)}px ${BC}`);
    if (secAt(G.w, G.xb + 14).type === 'barrel' && secAt(G.w, G.xb + 1).type !== 'barrel') txt('A BARREL IS COMING: STAY LOW AND CROUCH', W / 2, 62 * k, '#8fe0ff', `700 ${Math.round(13 * k)}px ${BC}`); }
  // the steering stick (left)
  if (ui.stick) { const s2 = ui.stick, R = 56 * k; ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.beginPath(); ctx.arc(s2.x0, s2.y0, R, 0, TAU); ctx.fill(); const dx = s2.x - s2.x0, dy = s2.y - s2.y0, m = Math.hypot(dx, dy), c = m > R ? R / m : 1; ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.arc(s2.x0 + dx * c, s2.y0 + dy * c, 22 * k, 0, TAU); ctx.fill(); }
  else if (G.t < 8 || G.lesson) txt('STEER ⬆⬇', 110 * k, H - 70 * k, 'rgba(255,255,255,.85)', `700 ${Math.round(13 * k)}px ${BC}`);
  if (G.phase === 'ride' && P.air) txt('TAP TO SPIN · PUSH DOWN TO LAND', W * 0.7, H * 0.55, '#fff', `700 ${Math.round(13 * k)}px ${BC}`);
  // CROUCH / PADDLE (right)
  { const B = L.cr, on = G.crouch; ctx.globalAlpha = 0.92; ctx.fillStyle = on ? '#1a8aa8' : 'rgba(0,40,60,.55)'; ctx.beginPath(); ctx.arc(B.x, B.y, B.r * (on ? 0.94 : 1), 0, TAU); ctx.fill(); ctx.strokeStyle = '#8fe0ff'; ctx.lineWidth = 3; ctx.stroke();
    txt(G.phase === 'wait' ? 'PADDLE' : 'CROUCH', B.x, B.y - 4 * k, '#fff', `400 ${Math.round(18 * k)}px ${TF}`); txt('hold', B.x, B.y + 17 * k, 'rgba(255,255,255,.85)', `700 ${Math.round(10 * k)}px ${BC}`); ctx.globalAlpha = 1; }
  if (G.lesson) lessonPanel(G);
  if (ui.banner) { const b = ui.banner, a = Math.min(1, b.t / 0.2, ((b.secs || 1.6) - b.t) / 0.4); ctx.globalAlpha = Math.max(0, a); txt(b.txt, W / 2, H * 0.22, '#ffd36a', `400 ${Math.round((b.small ? 26 : 34) * k)}px ${TF}`); if (b.sub) txt(b.sub, W / 2, H * 0.22 + 27 * k, '#fff', `700 ${Math.round(14 * k)}px ${BC}`); ctx.globalAlpha = 1; } }
function lessonPanel(G) { coachPanel(G); }
