// ===================== THE VIEW: Tennis (3D, behind your baseline; the stick on the left, swipes on the right) =====================
// The court with its lines, the net, windscreens, the far player, you in front. The ball is drawn a little bigger than life,
// with its shadow on the court (so you can judge how high it is) and a short trail. Bounce marks fade where it landed.
const FX = { shake: 0, stop: 0, flash: 0, red: 0, slow: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { snap: true, banner: null, stick: null, swipe: null, trail: [], marks: [] };
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 160) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40 * k, t: 0, life: 0.5 + Math.random() * 0.4, col, r: (1.5 + Math.random() * 2.5) * k }); } if (PARTS.length > 240) PARTS.splice(0, PARTS.length - 240); }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2.5); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.4) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 200 * dt; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  for (const m of ui.marks) m.t += dt; while (ui.marks.length && ui.marks[0].t > 2.5) ui.marks.shift();
  if (ui.banner) { ui.banner.t += dt; if (ui.banner.t > (ui.banner.secs || 1)) ui.banner = null; }
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; } }
function mySkin() { if (typeof HEADLESS !== 'undefined' && HEADLESS) return SKINS[0]; const id = store.get('skin', 'classic'); return SKINS.find(q => q.id === id) || SKINS[0]; }
function courtTex(cs) { const S = 48, w = Math.round((HX * 2 + 4) * S), h = Math.round((HZ * 2 + 6) * S), c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'), X = x => (x + HX + 2) * S, Z = z => (z + HZ + 3) * S;
  const col = '#' + cs.col.toString(16).padStart(6, '0'); g.fillStyle = col; g.fillRect(0, 0, w, h); for (let i = 0; i < 1200; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '255,255,255' : '0,0,0'},${Math.random() * 0.05})`; g.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 8, 2 + Math.random() * 8); }
  g.strokeStyle = '#' + cs.line.toString(16).padStart(6, '0'); g.lineWidth = 0.05 * S; g.strokeRect(X(-HX), Z(-HZ), 2 * HX * S, 2 * HZ * S);
  g.beginPath(); for (const s of [-1, 1]) { g.moveTo(X(-HX), Z(s * SZ)); g.lineTo(X(HX), Z(s * SZ)); g.moveTo(X(0), Z(s * SZ)); g.lineTo(X(0), Z(0)); g.moveTo(X(0), Z(s * HZ)); g.lineTo(X(0), Z(s * (HZ - 0.15))); } g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
function buildWorld() {
  if (V3) return V3; const T = window.THREE; if (!T || !W3 || !W3.init({ canvas: $('gl'), fov: 55, far: 400, near: 0.1 })) { V3 = { none: true }; return V3; }
  V3 = { T, S: W3.scene, t: 0 }; const V = V3, S = V.S, M = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.7 }, o)); V.M = M;
  V.boxG = new T.BoxGeometry(1, 1, 1); V.sphG = new T.SphereGeometry(1, 14, 10); V.cylG = new T.CylinderGeometry(1, 1, 1, 12);
  W3.scene.children.forEach(o => { if (o.isLineSegments) o.visible = false; });
  V.ground = new T.Mesh(new T.PlaneGeometry(300, 300), M(0x2a6a3a, { roughness: 0.95 })); V.ground.rotation.x = -Math.PI / 2; V.ground.position.y = -0.01; S.add(V.ground);
  V.court = new T.Mesh(new T.PlaneGeometry(HX * 2 + 4, HZ * 2 + 6), M(0xffffff, { roughness: 0.8 })); V.court.rotation.x = -Math.PI / 2; V.court.receiveShadow = true; S.add(V.court);
  // the net: posts, a dark mesh, a white band on top
  for (const s of [-1, 1]) { const p = new T.Mesh(V.cylG, M(0x2a3a2a, { metalness: 0.5 })); p.scale.set(0.05, 1.07, 0.05); p.position.set(s * (HX + 0.9), 0.535, 0); S.add(p); }
  const net = new T.Mesh(new T.PlaneGeometry((HX + 0.9) * 2, NETH - 0.05), new T.MeshStandardMaterial({ color: 0x101810, transparent: true, opacity: 0.55, side: T.DoubleSide })); net.position.set(0, (NETH - 0.05) / 2, 0); S.add(net);
  const band = new T.Mesh(V.boxG, M(0xffffff)); band.scale.set((HX + 0.9) * 2, 0.07, 0.03); band.position.set(0, NETH - 0.03, 0); S.add(band);
  // windscreens round the court, stands and lights for the stadium courts
  V.walls = new T.Group(); S.add(V.walls); const wm = M(0x1a4a2a, { roughness: 0.9 }); for (const s of [-1, 1]) { const w = new T.Mesh(V.boxG, wm); w.scale.set(24, 2.6, 0.2); w.position.set(0, 1.3, s * (HZ + 6.5)); V.walls.add(w); const w2 = new T.Mesh(V.boxG, wm); w2.scale.set(0.2, 2.6, 2 * HZ + 13); w2.position.set(s * 12, 1.3, 0); V.walls.add(w2); }
  V.stands = new T.Group(); S.add(V.stands); const tm = M(0x2a2e3a); const seats = []; for (const s of [-1, 1]) for (let r = 0; r < 6; r++) { const t2 = new T.Mesh(V.boxG, tm); t2.scale.set(1.2, 0.6, 30); t2.position.set(s * (13 + r * 1.2), 0.6 + r * 0.7, 0); V.stands.add(t2); for (let i = 0; i < 30; i++) seats.push([s * (13 + r * 1.2), 1.3 + r * 0.7, -14 + i]); }
  const fan = new T.InstancedMesh(new T.BoxGeometry(0.4, 0.65, 0.35), M(0xffffff), seats.length), d = new T.Object3D(), col = new T.Color(); seats.forEach((p, i) => { d.position.set(p[0], p[1], p[2]); d.updateMatrix(); fan.setMatrixAt(i, d.matrix); col.setHSL(Math.random(), 0.5, 0.35 + Math.random() * 0.3); fan.setColorAt(i, col); }); V.stands.add(fan); V.fans = fan; V.seats = seats;
  V.trees = W3.pines(Array.from({ length: 50 }, (_, i) => { const a = i / 50 * TAU; return { x: Math.cos(a) * (30 + Math.random() * 12), y: 0, z: Math.sin(a) * (45 + Math.random() * 12), s: 0.85 + Math.random() * 0.6 }; }), {});      /* 22 Nov 2026: the pines were a black wall twice this size */
  // the players
  V.me = player(V, false); V.op = player(V, true);
  // the ball, its shadow, the landing spot, the lesson's target corner
  V.ball = new T.Mesh(new T.SphereGeometry(0.075, 14, 10), new T.MeshStandardMaterial({ color: 0xe8f040, emissive: 0x6a7010, roughness: 0.6 })); V.ball.castShadow = true; S.add(V.ball);
  V.shadow = new T.Mesh(new T.CircleGeometry(0.09, 16), new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false })); V.shadow.rotation.x = -Math.PI / 2; V.shadow.position.y = 0.012; S.add(V.shadow);
  V.target = new T.Mesh(new T.PlaneGeometry(2.6, 3.4), new T.MeshBasicMaterial({ color: 0xffe060, transparent: true, opacity: 0.35, depthWrite: false })); V.target.rotation.x = -Math.PI / 2; V.target.position.y = 0.015; S.add(V.target);
  V.markG = new T.Group(); S.add(V.markG);
  W3.setQuality(stepN); return V; }
function player(V, them) { const T = V.T, M = V.M, g = new T.Group(), shirt = M(them ? 0x3a6ad8 : 0xd83a3a, { roughness: 0.8 }), skin = M(0xc88a64), dark = M(0xf4f4f0);
  const torso = new T.Mesh(V.cylG, shirt); torso.scale.set(0.2, 0.55, 0.15); torso.position.y = 1.2; g.add(torso); const shorts = new T.Mesh(V.boxG, dark); shorts.scale.set(0.38, 0.28, 0.24); shorts.position.y = 0.82; g.add(shorts);
  const legs = []; for (const s of [-1, 1]) { const L = new T.Group(); L.position.set(s * 0.1, 0.72, 0); const shin = new T.Mesh(V.boxG, skin); shin.scale.set(0.11, 0.66, 0.11); shin.position.y = -0.35; L.add(shin); const shoe = new T.Mesh(V.boxG, dark); shoe.scale.set(0.12, 0.08, 0.24); shoe.position.set(0, -0.68, 0.04); L.add(shoe); g.add(L); legs.push(L); }
  const head = new T.Mesh(V.sphG, skin); head.scale.setScalar(0.13); head.position.y = 1.62; g.add(head); const cap = new T.Mesh(new T.SphereGeometry(1, 12, 8, 0, TAU, 0, Math.PI / 2), shirt); cap.scale.set(0.14, 0.1, 0.14); cap.position.y = 1.66; g.add(cap);
  const arm = new T.Group(); arm.position.set(0.22, 1.42, 0); const up = new T.Mesh(V.boxG, skin); up.scale.set(0.08, 0.5, 0.08); up.position.y = -0.25; arm.add(up);
  const rk = new T.Group(); rk.position.y = -0.5; const handle = new T.Mesh(V.cylG, M(0x1a1a1a)); handle.scale.set(0.02, 0.3, 0.02); handle.position.y = -0.15; rk.add(handle); const head2 = new T.Mesh(new T.TorusGeometry(0.13, 0.015, 6, 20), M(them ? 0x2a2a30 : mySkin().col, { roughness: 0.4 })); head2.scale.set(1, 1.3, 1); head2.position.y = -0.45; rk.add(head2);
  const strings = new T.Mesh(new T.CircleGeometry(0.12, 16), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, side: T.DoubleSide })); strings.scale.set(1, 1.3, 1); strings.position.y = -0.45; rk.add(strings); arm.add(rk);
  g.add(arm); V.S.add(g); return { g, legs, arm, rk, head2, shirt, ph: 0 }; }
function setupCourt(V, G) { const cs = courtOf(G.N); if (V.cs === cs) return; V.cs = cs; V.court.material.map = courtTex(cs); V.court.material.needsUpdate = true; W3.setSky(cs.sky);
  V.ground.material.color.setHex(cs.name === 'Club clay' ? 0xb05a30 : cs.name.includes('City') || cs.name.includes('Night') ? 0x1a3a5a : 0x2a6a3a); const stadium = cs.name.includes('Night') || cs.name.includes('City'); V.stands.visible = stadium; V.trees.visible = !stadium; }
// ---------- every frame ----------
function sync(V, G, dt) { V.t += dt; setupCourt(V, G); const b = G.ball, me = G.me, op = G.op;
  V.op.shirt.color.setHex([0x3a6ad8, 0x2a9a4a, 0x8a3ad0, 0xe8a020][(G.N * 3) % 4]); V.me.head2.material.color.setHex(mySkin().col);
  for (const [p, m, who] of [[me, V.me, 0], [op, V.op, 1]]) { const v = Math.hypot(p.vx, p.vz); m.g.position.set(p.x, 0, p.z); m.g.rotation.y = who ? 0 : Math.PI; m.ph += dt * (3 + v * 2.5); const sw = Math.sin(m.ph) * Math.min(0.7, v * 0.2); m.legs[0].rotation.x = sw; m.legs[1].rotation.x = -sw; m.g.position.y = Math.abs(Math.sin(m.ph)) * Math.min(0.05, v * 0.01);
    // the swing: the racket arm sweeps across; forehand if the ball is to the right, backhand to the left; the serve goes overhead
    const fore = (b.x - p.x) * (who ? -1 : 1) >= 0, serving = G.phase === 'serve' && G.server === who && G.toss;
    if (p.swing > 0) { const u = 1 - p.swing / 0.22; m.arm.rotation.set(-1.2 + u * 0.4, (fore ? 1 : -1) * (1.6 - u * 3.2), 0); }
    else if (serving) m.arm.rotation.set(-2.6, 0, 0.2); else m.arm.rotation.set(-0.5, fore ? 0.6 : -0.6, 0); }
  V.ball.visible = b.live || !!G.toss || G.phase === 'serve'; V.ball.position.set(b.x, Math.max(0.075, b.y), b.z); V.shadow.position.set(b.x, 0.012, b.z); V.shadow.visible = V.ball.visible; V.shadow.material.opacity = 0.4 - Math.min(0.3, b.y * 0.08);
  if (G.phase === 'serve' && !G.toss) { const s = G.server === 0 ? me : op; b.x = s.x + 0.3; b.z = s.z + (G.server === 0 ? -0.2 : 0.2); b.y = 1.0; V.ball.position.set(b.x, b.y, b.z); }
  ui.trail.push([b.x, b.y, b.z]); if (ui.trail.length > 7) ui.trail.shift();
  const st = typeof lessonNow === 'function' && lessonNow(G); V.target.visible = !!(st && st.id === 'open'); if (V.target.visible) V.target.position.set(G.lessonOpen * (HX - 1.3), 0.015, -HZ + 2.2);
  if (V.fans && V.stands.visible && V.t - (V.fanT || 0) > 0.06) { V.fanT = V.t; const d = new V.T.Object3D(), ex = V.cheer || 0; for (let i = 0; i < 30; i++) { const j = (Math.random() * V.seats.length) | 0, s = V.seats[j]; d.position.set(s[0], s[1] + Math.random() * 0.1 * (1 + ex * 3), s[2]); d.updateMatrix(); V.fans.setMatrixAt(j, d.matrix); } V.fans.instanceMatrix.needsUpdate = true; V.cheer = Math.max(0, ex - dt * 0.5); }
  // the camera: behind you, a little above, sliding with you
  const cam = W3.cam, asp = innerWidth / innerHeight, portrait = asp < 0.8; V.cx = V.cx == null ? me.x * 0.45 : V.cx + (me.x * 0.45 - V.cx) * Math.min(1, dt * 3);
  const sh = FX.shake ? (Math.random() - 0.5) * FX.shake * 0.01 : 0; cam.fov = portrait ? 58 : 44; cam.aspect = asp; cam.updateProjectionMatrix();
  cam.position.set(V.cx + sh, portrait ? 7.4 : 5.2, HZ + (portrait ? 10.5 : 8)); cam.lookAt(V.cx * 0.5, 0, portrait ? -2.5 : -1.5); cam.updateMatrixWorld(); W3.setFocus(0, 0, 0, 30); }
const SV = window.THREE ? new THREE.Vector3() : null;
function scr(x, y, z) { if (!V3 || V3.none) return { x: W / 2, y: H / 2 }; SV.set(x, y, z); return W3.screen(SV); }
// ---------- what happens, seen and heard ----------
function onEvent(G, e) { const cx = W / 2, b = G.ball;
  switch (e.k) {
    case 'start': ui.banner = { txt: G.cfg.practice ? 'PRACTICE' : courtOf(G.N).name, t: 0, secs: 1.4, col: '#e8f87a' }; if (!G.cfg.practice && !G.lesson) tip('style', `${G.foe}: ${STYLES[G.cfg.style].name.toLowerCase()}, ${STYLES[G.cfg.style].how}.`, 2.6); break;
    case 'point': if (e.server === 0 && !G.lesson) tip('serve', 'Your serve: TAP to toss, then SWIPE UP while the ring is green.', 3); break;
    case 'toss': sfx.toss(); break; case 'serveclock': say('SERVE CLOCK!', W / 2, H * 0.4, '#ffb4a8', 20); break; case 'droptoss': say('LET IT DROP: TOSS AGAIN', cx, H * 0.5, '#fff', 16); break;
    case 'serve': sfx.hit(e.flat ? 1.2 : 0.8); vibe(HAP.light); break;
    case 'swing': if (e.who === 0) sfx.whoosh(); break; case 'whiff': if (!G.lesson) tip('whiff', 'Too early: swing as the ball reaches you (level with you).', 2.5); break;
    case 'hit': sfx.hit(e.pace || 0.8, e.kind); if (e.who === 0) { vibe(HAP.tick); const p = scr(b.x, b.y, b.z); if (e.q > 0.85) { say('SWEET!', p.x, p.y - 30 * k, '#e8f87a', 14); burst(p.x, p.y, '#f4ff9a', 8, 90); } else if (e.q < 0.35) say(e.kind === 'volley' ? 'LATE' : 'MISTIMED', p.x, p.y - 30 * k, '#ffd0a0', 13); if (e.kind !== 'drive') say(e.kind.toUpperCase(), p.x, p.y - 50 * k, '#d8f0ff', 13); } break;
    case 'bounce': sfx.bounce(); ui.marks.push({ x: e.x, z: e.z, t: 0 }); break;
    case 'net': sfx.net(); say('NET', cx, H * 0.4, '#ffd0a0', 22); break;
    case 'out': say('OUT', cx, H * 0.4, '#ffb4a8', 24); sfx.call(); break;
    case 'fault': say(e.n >= 2 ? 'DOUBLE FAULT' : 'FAULT', cx, H * 0.45, '#ffb4a8', 22); sfx.call(); break;
    case 'pointover': { const us = e.w === 0, txt = e.why === 'ace' ? (us ? 'ACE!' : 'ACED') : e.why === 'double' ? '' : e.why === 'winner' ? (us ? 'WINNER!' : 'THEIR POINT') : us ? 'THEIR ERROR' : 'YOUR ERROR';
      if (!G.lesson && txt) { ui.banner = { txt, t: 0, secs: 1.1, col: us ? '#e8f87a' : '#ffb4a8' }; } if (us) { sfx.cheer(e.rally); V3 && (V3.cheer = 1 + Math.min(2, e.rally / 6)); vibe(HAP.light); } else sfx.groan();
      if (e.rally >= 8 && !G.lesson) say(`${e.rally}-SHOT RALLY`, cx, H * 0.3, '#d8f0ff', 18); break; }
    case 'game': say(e.w === 0 ? 'GAME!' : 'GAME TO THEM', cx, H * 0.35, '#e8f87a', 26); break;
    case 'drill': ui.banner = { txt: e.name.toUpperCase(), t: 0, secs: 1.2, col: '#e8f87a' }; break;
    case 'won': sfx.win(); break; case 'lost': sfx.lose(); break;
    case 'lessonnext': hint = null; break; case 'lessonok': sfx.coin(e.n); say(`${e.n} OF ${e.need}`, cx, H * 0.35, '#9be3b5', 22); break;
    case 'lessonmiss': coachMiss(); break;
    case 'lessondone': sfx.goal(); say('READY!', cx, H * 0.4, '#e8f87a', 28); break;
  } }
let IG = null, IM = {}; function idleG() { if (!IG || IG.over || IG.t > 50) { IG = newGame(6 + ((Math.random() * 10) | 0), { seed: (Math.random() * 1e6) | 0 }); IM = {}; } honest(IG, { react: 0.25, acc: 0.95 }, IM); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#10241c'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D court.', W / 2, H / 2); if (G) hud(G, now); return; }
  const g = G || idleG(); sync(V, g, dt); W3.render(dt);
  // bounce marks and the ball's trail, over the picture
  for (const m of ui.marks) { const p = scr(m.x, 0, m.z), a = Math.max(0, 1 - m.t / 2.5); ctx.strokeStyle = `rgba(255,255,255,${a * 0.8})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(p.x, p.y, 7 * k, 3 * k, 0, 0, TAU); ctx.stroke(); }
  if (g.ball.live && ui.trail.length > 2) { ctx.strokeStyle = 'rgba(240,255,120,.45)'; ctx.lineWidth = 3 * k; ctx.beginPath(); ui.trail.forEach(([x, y, z], i) => { const p = scr(x, y, z); i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); }); ctx.stroke(); }
  if (G && !(G.over && !$('ovEnd').classList.contains('hidden'))) hud(G, now);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 0.9 ? 1 : 1 - (t2.t - 0.9) / 0.5; ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(t2.size * k)}px ${BC}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(8,20,14,.75)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 20); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 20); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30, hy = H * 0.24;
    ctx.fillStyle = 'rgba(8,20,14,.94)'; rrect(W / 2 - w / 2, hy - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, hy - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(240,255,220,${FX.flash * 0.35})`; ctx.fillRect(0, 0, W, H); } }
// ---------- the 2D layer: the score, the serve ring, the stick, the swipe ----------
const PTS = ['0', '15', '30', '40'];
function scoreText(G) { if (G.cfg.practice) return null; if (!G.cfg.long) return [`${G.pts[0]}`, `${G.pts[1]}`, 'FIRST TO 7']; const a = G.gp[0], b = G.gp[1]; let pa, pb; if (a >= 3 && b >= 3) { pa = a === b ? '40' : a > b ? 'AD' : '40'; pb = a === b ? '40' : b > a ? 'AD' : '40'; } else { pa = PTS[a]; pb = PTS[b]; } return [`${G.games[0]}  ${pa}`, `${G.games[1]}  ${pb}`, 'GAMES TO 3']; }
function hud(G, now) { ctx.textBaseline = 'middle'; const b = G.ball;
  if (G.lesson) lessonPanel(G);
  else if (G.cfg.practice) { ctx.fillStyle = 'rgba(8,20,14,.82)'; rrect(W / 2 - 130 * k, 44 * k, 260 * k, 36 * k, 12 * k); ctx.fill(); ctx.fillStyle = '#e8f87a'; ctx.font = `400 ${Math.round(16 * k)}px ${TF}`; ctx.textAlign = 'center'; ctx.fillText(`◀  ${DRILLS[G.drill].name}  ▶`, W / 2, 62 * k); ui.drillBar = { x: W / 2 - 130 * k, y: 44 * k, w: 260 * k, h: 36 * k }; }
  else { const s = scoreText(G); ctx.fillStyle = 'rgba(8,20,14,.82)'; rrect(W / 2 - 120 * k, 44 * k, 240 * k, 46 * k, 12 * k); ctx.fill(); ctx.textAlign = 'left'; ctx.font = `700 ${Math.round(14 * k)}px ${BC}`;
    ctx.fillStyle = G.server === 0 ? '#e8f87a' : '#fff'; ctx.fillText(`${G.server === 0 ? '● ' : ''}YOU`, W / 2 - 110 * k, 58 * k); ctx.fillStyle = G.server === 1 ? '#e8f87a' : '#fff'; ctx.fillText(`${G.server === 1 ? '● ' : ''}${G.foe.toUpperCase()}`, W / 2 - 110 * k, 77 * k);
    ctx.textAlign = 'right'; ctx.font = `400 ${Math.round(18 * k)}px ${TF}`; ctx.fillStyle = '#fff'; ctx.fillText(s[0], W / 2 + 108 * k, 58 * k); ctx.fillText(s[1], W / 2 + 108 * k, 77 * k);
    ctx.textAlign = 'center'; ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillText(s[2], W / 2, 98 * k);
    if (G.phase === 'rally' && G.rally >= 3) { ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = '#d8f0ff'; ctx.fillText(`RALLY ${G.rally}`, W / 2, 114 * k); } }
  // the serve: TAP TO TOSS, then a ring round the ball that is green at the top
  if (G.phase === 'serve' && G.server === 0 && G.wait <= 0) { if (!G.toss) { ctx.font = `400 ${Math.round(22 * k)}px ${TF}`; ctx.textAlign = 'center'; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(8,20,14,.7)'; if (G && G.lesson) ctx.strokeText('Tap to toss', W * 0.72, H * 0.72); ctx.fillStyle = '#e8f87a'; if (G && G.lesson) ctx.fillText('Tap to toss', W * 0.72, H * 0.72); }
    else { const p = scr(b.x, b.y, b.z), q = clamp(1 - Math.abs(b.vy) / 3.2, 0, 1), good = q >= 0.8, r = (14 + 40 * (1 - q)) * k; ctx.strokeStyle = good ? '#3ad070' : q > 0.5 ? '#ffd36a' : '#ff6a4a'; ctx.lineWidth = 4 * k; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.stroke(); if (good) { ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; ctx.fillStyle = '#3ad070'; ctx.textAlign = 'center'; ctx.fillText('SWIPE!', p.x, p.y - r - 12 * k); } } }
  // the stick
  const s2 = ui.stick; if (s2) { ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.arc(s2.x0, s2.y0, 54 * k, 0, TAU); ctx.fill(); const dx = s2.x - s2.x0, dy = s2.y - s2.y0, d = Math.hypot(dx, dy), m = Math.min(1, 54 * k / (d || 1)); ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.arc(s2.x0 + dx * m, s2.y0 + dy * m, 22 * k, 0, TAU); ctx.fill(); }
  else if ((G && G.lesson) && G.t < 8 || G.lesson) { ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(W * 0.2, H - 110 * k, 54 * k, 0, TAU); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillText('MOVE', W * 0.2, H - 110 * k); ctx.fillText('SWIPE ↑', W * 0.78, H - 110 * k); }
  // the swipe as it is drawn
  const sw = ui.swipe; if (sw && sw.pts.length > 1) { ctx.strokeStyle = 'rgba(232,248,122,.8)'; ctx.lineWidth = 6 * k; ctx.beginPath(); sw.pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
    const lp = sw.pts[sw.pts.length - 1], nm = G.phase === 'serve' && G.server === 0 ? '' : shotOf(lp[0] - sw.x0, lp[1] - sw.y0); if (nm) { ctx.font = `700 ${Math.round(20 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.strokeText(nm, sw.x0 - 62 * k, lp[1]); ctx.fillStyle = nm === 'LOB' ? '#8fd8ff' : nm === 'DROP' ? '#ffd27a' : nm === 'SLICE' ? '#d8b0ff' : '#e8f87a'; ctx.fillText(nm, sw.x0 - 62 * k, lp[1]); } }
  if (ui.banner) { const B = ui.banner; ctx.textAlign = 'center'; ctx.font = `400 ${Math.round(34 * k)}px ${TF}`; ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(8,20,14,.75)'; ctx.strokeText(B.txt, W / 2, H * 0.4); ctx.fillStyle = B.col || '#fff'; ctx.fillText(B.txt, W / 2, H * 0.4); } }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of String(t).split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { coachPanel(G); }
