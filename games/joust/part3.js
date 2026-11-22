// ===================== THE VIEW: Joust (sideways; behind and above your shoulder) =====================
// The lists: a long wooden tilt barrier down the middle, stands of spectators in bright clothes, banners on poles, a castle
// beyond. Your horse gallops (hooves pounding), your lance swings across the barrier towards their shield; its tip is
// marked, and its rhythm (a figure of eight) is drawn faintly ahead. At the crash: splinters, a jolt, the rider rocking back,
// or falling. Then a card shows where both lances struck.
const FX = { shake: 0, stop: 0, flash: 0, red: 0, slow: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { snap: true, banner: null, stick: null, aimT: null, btn: {}, card: null };
const optShake = () => store.get('shake', true) !== false, optSlow = () => store.get('slow', true) !== false;
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip2(key, txt, secs = 3) { if (HEADLESS) return; tip2.seen = tip2.seen || {}; if (tip2.seen[key]) return; tip2.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 160) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40 * k, t: 0, life: 0.5 + Math.random() * 0.5, col, r: (1.5 + Math.random() * 3) * k }); } if (PARTS.length > 260) PARTS.splice(0, PARTS.length - 260); }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2.5); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.4) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * dt; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (ui.banner) { ui.banner.t += dt; if (ui.banner.t > (ui.banner.secs || 1.6)) ui.banner = null; }
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; } }
function mySkin() { if (typeof HEADLESS !== 'undefined' && HEADLESS) return SKINS[0]; const id = store.get('skin', 'blue'); return SKINS.find(q => q.id === id) || SKINS[0]; }
const SPEED = 9, LANEX = 1.5;      // each horse's speed (m/s) and its distance from the barrier
function buildWorld() {
  if (V3) return V3; const T = window.THREE; if (!T || !W3 || !W3.init({ canvas: $('gl'), fov: 50, far: 900, near: 0.2, dims: () => [W, H] })) { V3 = { none: true }; return V3; }
  V3 = { T, S: W3.scene, t: 0, for: null }; const V = V3, M = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.8 }, o)); V.M = M; const S = V.S;
  V.boxG = new T.BoxGeometry(1, 1, 1); V.cylG = new T.CylinderGeometry(1, 1, 1, 10); V.sphG = new T.SphereGeometry(1, 14, 10);
  const grass = new T.Mesh(new T.PlaneGeometry(600, 600), M(0x5a8a3a, { roughness: 1 })); grass.rotation.x = -Math.PI / 2; grass.receiveShadow = true; S.add(grass);
  const sand = new T.Mesh(new T.PlaneGeometry(14, 120), M(0xc8b088, { roughness: 1 })); sand.rotation.x = -Math.PI / 2; sand.position.y = 0.01; sand.receiveShadow = true; S.add(sand);
  // the tilt barrier, rails and posts
  { const wood = M(0x8a5a32); for (const [y, h] of [[1.1, 0.12], [0.55, 0.9]]) { const b = new T.Mesh(V.boxG, wood); b.scale.set(0.12, h, 110); b.position.set(0, y, 0); b.castShadow = true; S.add(b); } for (let z = -54; z <= 54; z += 6) { const p = new T.Mesh(V.boxG, M(0x6a4222)); p.scale.set(0.2, 1.3, 0.2); p.position.set(0, 0.65, z); S.add(p); } }
  // stands with spectators, banners, a castle
  const crowd = [], cols = [0xc83a2a, 0x2a5ac8, 0xe8c040, 0x3a9a4a, 0x8a3ab0, 0xf0f0f0, 0xd87a2a]; for (const side of [-1, 1]) for (let r = 0; r < 4; r++) for (let z = -48; z <= 48; z += 1.6) crowd.push({ x: side * (10 + r * 1.4), y: 0.9 + r * 0.9, z: z + (r % 2) * 0.8, c: cols[Math.abs(crowd.length * 5 + r * 3 + Math.round(z * 3)) % cols.length] });
  { const im = new T.InstancedMesh(new T.BoxGeometry(0.6, 1.2, 0.5), M(0xffffff), crowd.length), m = new T.Matrix4(), c = new T.Color(); crowd.forEach((p, i) => { m.makeTranslation(p.x, p.y, p.z); im.setMatrixAt(i, m); im.setColorAt(i, c.setHex(p.c)); }); S.add(im); V.crowd = im; V.crowdP = crowd; }
  for (const side of [-1, 1]) { const st = new T.Mesh(V.boxG, M(0x7a5a3a)); st.scale.set(6, 4, 100); st.position.set(side * 12.2, 0.5, 0); st.rotation.z = side * 0.35; S.add(st); }
  for (let z = -44; z <= 44; z += 11) for (const side of [-1, 1]) { const p = new T.Mesh(V.cylG, M(0xd8c8a8)); p.scale.set(0.08, 7, 0.08); p.position.set(side * 8, 3.5, z); S.add(p); const f = new T.Mesh(new T.PlaneGeometry(1.4, 2.4), M([0xc83a2a, 0x2a5ac8, 0xe8c040, 0x3a9a4a][((z + 44) / 11 + (side > 0 ? 1 : 0)) % 4], { side: T.DoubleSide })); f.position.set(side * 8 + side * 0.75, 5.6, z); f.rotation.y = Math.PI / 2; S.add(f); }
  { const stone = M(0xb8b0a0); const g = new T.Group(); [[0, 12, 40, 24], [-28, 18, 10, 10], [28, 18, 10, 10], [0, 26, 12, 12]].forEach(([x, h, w, d]) => { const b = new T.Mesh(V.boxG, stone); b.scale.set(w, h, d); b.position.set(x, h / 2, 0); g.add(b); }); [[-28, 18, 6], [28, 18, 6], [0, 26, 7.5]].forEach(([x, y, r]) => { const c2 = new T.Mesh(new T.ConeGeometry(r, 9, 8), M(0x4a5a8a)); c2.position.set(x, y + 4.5, 0); g.add(c2); }); g.position.set(0, 0, 150); S.add(g); }
  V.me = knight(V, mySkin().col, mySkin().col2); S.add(V.me.g); V.rv = knight(V, 0x8a2a2a, 0xe8c040); S.add(V.rv.g);
  V.quintain = new T.Group(); { const post = new T.Mesh(V.cylG, M(0x6a4222)); post.scale.set(0.12, 2.6, 0.12); post.position.y = 1.3; V.quintain.add(post); const tgt = new T.Mesh(new T.CylinderGeometry(0.45, 0.45, 0.08, 24), M(0xe8e0c8)); tgt.rotation.x = Math.PI / 2; tgt.position.set(0, 2.1, 0); V.quintain.add(tgt); const bull = new T.Mesh(new T.CylinderGeometry(0.14, 0.14, 0.1, 18), M(0xc83a2a)); bull.rotation.x = Math.PI / 2; bull.position.set(0, 2.1, -0.02); V.quintain.add(bull); V.qTarget = tgt; } S.add(V.quintain);
  W3.setQuality(stepN); return V; }
// a knight on a horse: barded horse, armoured rider, a shield on the left arm, a lance in the right
function knight(V, col, col2) { const T = V.T, M = V.M, g = new T.Group(), horse = new T.Group(); g.add(horse); const hide = M(0x5a3a26), cloth = M(col), trim = M(col2), steel = M(0xb8bcc4, { metalness: 0.7, roughness: 0.35 });
  const body = new T.Mesh(V.boxG, cloth); body.scale.set(0.8, 0.9, 2.1); body.position.y = 1.45; horse.add(body); const neck = new T.Mesh(V.boxG, cloth); neck.scale.set(0.45, 0.9, 0.5); neck.position.set(0, 2.0, 1.05); neck.rotation.x = 0.5; horse.add(neck);
  const head = new T.Mesh(V.boxG, hide); head.scale.set(0.35, 0.4, 0.75); head.position.set(0, 2.35, 1.45); head.rotation.x = 0.9; horse.add(head);
  const legs = []; for (const [x, z] of [[-0.3, 0.8], [0.3, 0.8], [-0.3, -0.8], [0.3, -0.8]]) { const l = new T.Group(); l.position.set(x, 1.15, z); const m = new T.Mesh(V.boxG, hide); m.scale.set(0.16, 1.1, 0.16); m.position.y = -0.55; l.add(m); horse.add(l); legs.push(l); }
  const rider = new T.Group(); rider.position.set(0, 2.0, -0.2); g.add(rider); const torso = new T.Mesh(V.boxG, steel); torso.scale.set(0.55, 0.75, 0.38); torso.position.y = 0.45; rider.add(torso); const tab = new T.Mesh(V.boxG, cloth); tab.scale.set(0.58, 0.5, 0.4); tab.position.y = 0.35; rider.add(tab);
  const helm = new T.Mesh(V.sphG, steel); helm.scale.set(0.2, 0.24, 0.22); helm.position.y = 1.0; rider.add(helm); const plume = new T.Mesh(new T.ConeGeometry(0.08, 0.5, 6), trim); plume.position.y = 1.35; rider.add(plume);
  const shield = new T.Mesh(new T.BoxGeometry(0.55, 0.7, 0.06), cloth); shield.position.set(-0.42, 0.55, 0.25); rider.add(shield); const boss = new T.Mesh(new T.BoxGeometry(0.2, 0.7, 0.07), trim); boss.position.copy(shield.position); rider.add(boss);
  const lance = new T.Group(); lance.position.set(0.35, 0.5, 0.2); rider.add(lance); const pole = new T.Mesh(new T.CylinderGeometry(0.045, 0.09, 4.2, 10), trim); pole.rotation.x = Math.PI / 2; pole.position.z = 2.0; lance.add(pole); const vam = new T.Mesh(new T.ConeGeometry(0.18, 0.5, 12), steel); vam.rotation.x = -Math.PI / 2; vam.position.z = 0.1; lance.add(vam);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return { g, horse, legs, rider, shield, lance, pole, head: helm }; }
function placeKnight(K, x, z, dir, t, gallop, lean, rock, fall) { K.g.position.set(x, 0, z); K.g.rotation.y = dir > 0 ? 0 : Math.PI; const ph = t * 9; K.horse.position.y = gallop * Math.abs(Math.sin(ph)) * 0.12; K.legs.forEach((l, i) => { l.rotation.x = gallop * Math.sin(ph + (i % 2 ? Math.PI : 0) + (i > 1 ? 1 : 0)) * 0.7; });
  K.rider.rotation.set(-rock * 0.6 - fall * 1.3, 0, lean * 0.35 * dir + fall * 0.4 + rock * 0.25 * Math.sin(t * 5)); K.rider.position.set(fall * 0.8, 2.0 + K.horse.position.y - fall * 1.6, -0.2 - fall * 0.6); }
function sync(V, G, dt) { V.t += dt; const T = V.T, tr = !G.R, p = G.phase === 'charge' ? G.pt : PASS_T + (2.2 - (G.afterT || 0)) * 0.6;
  if (V.for !== G.N + ':' + G.seed) { V.for = G.N + ':' + G.seed; W3.setSky(PLACES[G.cfg.place].sky); const s = mySkin(); V.S.remove(V.me.g); V.me = knight(V, s.col, s.col2); V.S.add(V.me.g); V.rv.g.visible = !tr; V.quintain.visible = tr; }
  // your knight comes down the lane from -z, theirs from +z; the crash is at z = 0 at PASS_T
  const myZ = -SPEED * (PASS_T - p), rvZ = SPEED * (PASS_T - p), gal = G.phase === 'charge' ? 1 : clamp(1 - (2.2 - G.afterT) * 0.6, 0, 1);
  const last = G.log[G.log.length - 1], myRock = G.phase === 'after' && last ? ({ clean: 1, shield: 0.6, glance: 0.25, miss: 0 }[last.tq] || 0) * Math.exp(-(2.2 - G.afterT) * 2) : 0, rvRock = G.phase === 'after' && last ? ({ clean: 1, shield: 0.6, glance: 0.25, miss: 0 }[last.q] || 0) * Math.exp(-(2.2 - G.afterT) * 2) : 0;
  const rvFall = G.over === 'won' && G.res && G.res.why === 'unseat' ? Math.min(1, (G.endFall = (G.endFall || 0) + dt)) : 0, myFall = G.over === 'lost' && G.res && G.res.why === 'unseated' ? Math.min(1, (G.endFall = (G.endFall || 0) + dt)) : 0;
  placeKnight(V.me, -LANEX, myZ, 1, V.t, gal, G.body || 0, myRock, myFall); placeKnight(V.rv, LANEX, rvZ, -1, V.t + 0.3, gal, G.rv && G.rv.shift && G.pt > PASS_T - 0.45 && G.phase === 'charge' ? Math.sign(G.rv.shift) : 0, rvRock, rvFall);
  if (G.rv && G.rv.shift && G.phase === 'charge' && G.pt > G.rv.tellAt) V.rv.head.position.x = Math.sign(G.rv.shift) * 0.12 * -1; else V.rv.head.position.x = 0;
  V.quintain.position.set(LANEX, 0, rvZ); V.quintain.rotation.y = Math.PI;
  // your lance: lowered from upright to level, pointing at the tip's place on their shield (or the target board)
  const sh = shieldWorld(G, rvZ), tw = tipWorld(G, rvZ), L = V.me.lance, base = new T.Vector3(); L.updateMatrixWorld(); L.getWorldPosition(base); const raise = clamp(G.aim.y > 0.5 && G.pt < 1.2 ? 1 - G.pt / 1.2 : 0, 0, 1);
  if (G.phase === 'charge') { const d = new T.Vector3().subVectors(tw, base), yaw = Math.atan2(d.x, d.z), pitch = Math.atan2(d.y, Math.hypot(d.x, d.z)); L.rotation.set(-pitch - raise * 1.2, yaw, 0); L.visible = true; }
  V.me.pole.scale.y = G.phase === 'after' && last && last.broke ? 0.45 : 1; V.rv.pole.scale.y = G.phase === 'after' && last && last.theyBroke ? 0.45 : 1;
  { const L2 = V.rv.lance; L2.rotation.set(-0.05, 0.3, 0); }
  // the crowd stands up for the crash
  if (V.crowd && (G.phase === 'after' || G.pt > PASS_T - 1)) { const m = new T.Matrix4(), up = G.phase === 'after' ? 0.25 : 0.1; V.crowdP.forEach((q, i) => { m.makeTranslation(q.x, q.y + Math.abs(Math.sin(V.t * 8 + i)) * up, q.z); V.crowd.setMatrixAt(i, m); }); V.crowd.instanceMatrix.needsUpdate = true; }
  // the camera: behind and above your right shoulder, looking down the lane at them
  const sk = FX.shake > 0 && optShake() ? (Math.random() - 0.5) * FX.shake * 0.02 : 0, cam = W3.cam; cam.position.set(-LANEX - 1.5 + sk, 4.3 + sk, myZ - 5.2); cam.lookAt(LANEX * 0.7, 2.3, myZ + 14); cam.updateMatrixWorld();
  W3.setFocus(0, 1, myZ + 4, 14); }
// the shield's centre in the world, and where your lance tip is (the shield plane: + x is to your right, as you look at them)
function shieldWorld(G, rvZ) { const T = V3.T; return new T.Vector3(G.R ? LANEX - 0.42 : LANEX, G.R ? 2.55 : 2.1, rvZ - 0.25); }
function tipWorld(G, rvZ) { const T = V3.T, c = shieldWorld(G, rvZ), t0 = tip(G), b = G.body || 0, t = { x: t0.x - b * 0.2, y: t0.y + Math.abs(b) * 0.08 }, s0 = G.sh0 || { x: 0, y: 0 }; return new T.Vector3(c.x - (t.x - s0.x), c.y + (t.y - s0.y), c.z); }
function scrOf(v) { if (!V3 || V3.none) return null; return W3.screen(v); }
// ---------- events ----------
function onEvent(G, e) {
  switch (e.k) {
    case 'pass': ui.card = null; if (G.R && e.n === 1) ui.banner = { txt: G.R.name.toUpperCase(), sub: HABIT[G.R.habit], t: 0, secs: 2.2, small: true }; else ui.banner = { txt: G.R ? `PASS ${e.n}` : `TARGET ${e.n} OF ${G.cfg.of}`, sub: G.R ? `You ${G.pts[0]} : ${G.pts[1]} ${G.R.name.split(' ').slice(-1)[0]}` : `${G.log.filter(q => q.broke).length} of ${G.cfg.needClean} lances broken`, t: 0, secs: 1.4, small: true }; sfx.horn(); break;
    case 'brace': sfx.brace(); break;
    case 'tell': if (G.N >= 6) tip2('tell', 'Their head dipped: they will shift their shield that way. Move your aim.', 3); break;
    case 'clash': { const p = scrOf(tipWorld(G, 0)) || { x: W / 2, y: H / 2 }, big = e.q === 'clean' || e.q === 'shield';
      if (big) { sfx.crack(e.broke); vibe(e.broke ? HAP.heavy : HAP.thud); FX.shake = e.broke ? 14 : 8; burst(p.x, p.y, '#e8c890', e.broke ? 40 : 18, 260); } else if (e.q === 'glance') sfx.glance(); else sfx.whiff();
      if (e.tq === 'clean' || e.tq === 'shield') { sfx.hitme(); FX.red = 0.5; FX.shake = Math.max(FX.shake, 8); }
      say(e.broke ? 'LANCE BROKEN! +2' : !e.braced && (e.q === 'clean' || e.q === 'shield') ? 'NOT BRACED: IT SKIDS OFF' : e.q === 'clean' ? 'CENTRE! +1' : e.q === 'shield' ? 'SHIELD HIT +1' : e.q === 'glance' ? 'GLANCED OFF' : 'MISSED', W / 2, H * 0.3, big ? '#ffd36a' : '#ffd0a0', e.broke ? 34 : 28);
      ui.card = { e, t: 0 }; if (e.late && e.q !== 'miss') tip2('late', 'Not braced, so your lance skidded off: hold BRACE just before the crash.', 3); if (e.braceEarly) tip2('early', 'Braced too early: your arm tired and the tip swayed more.', 3); sfx.crowd(big); } break;
    case 'lessonnext': if (e.first) hint = null; say('FIRST, A LESSON', W / 2, H * 0.36, '#ffd36a', 24); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, W / 2, H * 0.42, '#8fe0ab', 24); sfx.coin(e.n); break;
    case 'lessonmiss': hint = { txt: e.how, t: 0, secs: 3.2 }; break;
    case 'lessondone': say('TO THE LISTS!', W / 2, H * 0.36, '#ffd36a', 24); sfx.fanfare(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.fanfare(); FX.flash = 0.5; vibe(HAP.best); if (e.why === 'unseat') ui.banner = { txt: 'UNSEATED!', sub: 'Outright victory', t: 0, secs: 2 }; break;
    case 'lost': sfx.lose(); if (e.why === 'unseated') ui.banner = { txt: 'YOU ARE DOWN', sub: 'Unhorsed: brace on time and lean less', t: 0, secs: 2 }; break;      // (P11: never vibrate on failure)
  } }
// ---------- the picture ----------
let IG = null, IM = {}; function idleG() { if (!IG || IG.over || IG.t > 40) { IG = newGame(3 + ((Math.random() * 12) | 0), { seed: (Math.random() * 1e6) | 0 }); IM = {}; } honest(IG, { react: 0.3, acc: 0.95 }, IM); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#5a8a3a'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D lists.', W / 2, H / 2); if (G) hud(G, now); return; }
  const g = G || idleG(); sync(V, g, dt || 1 / 60); W3.render(dt || 1 / 60);
  if (FX.red > 0) { ctx.fillStyle = `rgba(200,40,30,${FX.red * 0.18})`; ctx.fillRect(0, 0, W, H); }
  if (G && !(G.over && !$('ovEnd').classList.contains('hidden'))) hud(G, now);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.fillRect(p.x - p.r, p.y - p.r * 0.3, p.r * 2.4, p.r * 0.6); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 1.1 ? 1 : 1 - (t2.t - 1.1) / 0.5; ctx.globalAlpha = Math.max(0, al); ctx.font = `400 ${Math.round(t2.size * k)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(30,20,10,.75)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 18); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 18); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, Math.min(W - 360 * k, 420 * k)), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30, hy = H - 56 * k - h / 2;
    ctx.fillStyle = 'rgba(30,20,10,.92)'; rrect(W / 2 - w / 2, hy - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, hy - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,250,230,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); } }
// ---------- the HUD ----------
function layout(G) { return { brace: { x: W - 82 * k, y: H - 86 * k, r: 58 * k } }; }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of String(t).split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function txt(s, x, y, col = '#fff', font, al = 'center') { ctx.textAlign = al; if (font) ctx.font = font; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(30,20,10,.7)'; ctx.strokeText(s, x, y); ctx.fillStyle = col; ctx.fillText(s, x, y); }
function hud(G, now) { ctx.textBaseline = 'middle'; const L = layout(G), rvZ = SPEED * (PASS_T - (G.phase === 'charge' ? G.pt : PASS_T));
  // the lance tip, and (at the easier levels) its rhythm ahead and where it will be at the crash
  if (G.phase === 'charge') { const tp = scrOf(tipWorld(G, rvZ));
    if (G.N <= 9 || (G.lesson && G.lesson.id === 'aim')) { ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= 24; i++) { const t = G.pt + (PASS_T - G.pt) * i / 24, sv = sway(G, t), b = G.body || 0, a = { x: G.aim.x - b * 0.2, y: G.aim.y + Math.abs(b) * 0.08 }, c = shieldWorld(G, rvZ), s0 = G.sh0, v = new V3.T.Vector3(c.x - (a.x + sv.x - s0.x), c.y + (a.y + sv.y - s0.y), c.z), q = scrOf(v); if (!q) continue; if (i) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); } ctx.stroke();
      const sv = sway(G, PASS_T), c = shieldWorld(G, rvZ), v = new V3.T.Vector3(c.x - (G.aim.x + sv.x - G.sh0.x), c.y + (G.aim.y + sv.y - G.sh0.y), c.z), q = scrOf(v); if (q) { ctx.strokeStyle = 'rgba(255,214,110,.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(q.x, q.y, 7 * k, 0, TAU); ctx.stroke(); } }
    if (tp) { ctx.strokeStyle = '#ffd36a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(tp.x, tp.y, 10 * k, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(tp.x - 15 * k, tp.y); ctx.lineTo(tp.x + 15 * k, tp.y); ctx.moveTo(tp.x, tp.y - 15 * k); ctx.lineTo(tp.x, tp.y + 15 * k); ctx.stroke(); } }
  // the top: points (or targets), the rival and their habit
  { const y = 20 * k; ctx.fillStyle = 'rgba(30,20,10,.6)'; rrect(W / 2 - 170 * k, y - 15 * k, 340 * k, 30 * k, 10); ctx.fill();
    if (G.R) txt(`YOU ${G.pts[0]}  :  ${G.pts[1]} ${G.R.name.toUpperCase()} · pass ${G.pass}/${Math.max(G.cfg.passes, G.pass)}`, W / 2, y + 1, '#fff', `700 ${Math.round(13 * k)}px ${BC}`);
    else txt(`TRAINING · lances broken ${G.log.filter(q => q.broke).length}/${G.cfg.needClean} · target ${G.pass}/${G.cfg.of}`, W / 2, y + 1, '#fff', `700 ${Math.round(13 * k)}px ${BC}`);
    const bx = 14 * k; txt('your seat', bx, H * 0.36 - 16 * k, 'rgba(255,255,255,.85)', `700 ${Math.round(11 * k)}px ${BC}`, 'left'); ctx.fillStyle = 'rgba(30,20,10,.6)'; rrect(bx, H * 0.36, 14 * k, 100 * k, 6); ctx.fill(); const b = clamp(1 - G.bal[0], 0, 1); ctx.fillStyle = b > 0.5 ? '#8fe0ab' : b > 0.25 ? '#ffd36a' : '#ff6a4a'; rrect(bx, H * 0.36 + 100 * k * (1 - b), 14 * k, 100 * k * b, 6); ctx.fill(); }
  // the lean (left) and the aim (right) sticks
  if (ui.stick) { const s2 = ui.stick, R = 56 * k; ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.arc(s2.x0, s2.y0, R, 0, TAU); ctx.fill(); const dx = clamp(s2.x - s2.x0, -R, R); ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.arc(s2.x0 + dx, s2.y0, 20 * k, 0, TAU); ctx.fill(); txt('LEAN', s2.x0, s2.y0 - R - 12 * k, '#fff', `700 ${Math.round(11 * k)}px ${BC}`); }
  else if (G.t < 6 || (G.lesson && G.pass <= 1)) { txt('◀ LEAN ▶', 110 * k, H - 70 * k, 'rgba(255,255,255,.85)', `700 ${Math.round(13 * k)}px ${BC}`); txt('DRAG TO AIM THE LANCE', W * 0.62, H - 70 * k, 'rgba(255,255,255,.85)', `700 ${Math.round(13 * k)}px ${BC}`); }
  // BRACE: it glows in the last half second
  { const B = L.brace, glow = G.phase === 'charge' && G.pt > PASS_T - 0.6, on = G.brace; ctx.globalAlpha = 0.92; ctx.fillStyle = on ? '#c8763a' : glow ? 'rgba(255,214,110,.85)' : 'rgba(30,20,10,.55)'; ctx.beginPath(); ctx.arc(B.x, B.y, B.r * (on ? 0.94 : 1), 0, TAU); ctx.fill(); ctx.strokeStyle = glow ? '#fff' : '#ffd36a'; ctx.lineWidth = glow ? 5 : 3; ctx.stroke(); txt('BRACE', B.x, B.y - 4 * k, '#fff', `400 ${Math.round(20 * k)}px ${TF}`); txt('hold', B.x, B.y + 16 * k, 'rgba(255,255,255,.85)', `700 ${Math.round(10 * k)}px ${BC}`); ctx.globalAlpha = 1; }
  // after the crash: where both lances struck
  if (ui.card && G.phase === 'after') { const e = ui.card.e, cx = W / 2, cy = H * 0.58, r = 46 * k; for (const [i, lab, hitp, q] of [[-1, 'YOUR LANCE', { x: e.tip.x - e.sh.x, y: e.tip.y - e.sh.y }, e.q], [1, 'THEIR LANCE', e.their, e.tq]]) { if (i > 0 && !G.R) continue; const x = cx + i * 70 * k;
      ctx.fillStyle = 'rgba(30,20,10,.7)'; rrect(x - 58 * k, cy - 70 * k, 116 * k, 140 * k, 10); ctx.fill(); ctx.fillStyle = i < 0 ? '#' + (G.R ? 0x8a2a2a : 0xe8e0c8).toString(16).padStart(6, '0') : '#' + mySkin().col.toString(16).padStart(6, '0'); ctx.beginPath(); ctx.arc(x, cy, r, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, cy, r * CLEAN / SHIELD, 0, TAU); ctx.stroke();
      if (hitp) { const hx = x - hitp.x / SHIELD * r, hy = cy - hitp.y / SHIELD * r; ctx.fillStyle = '#ffd36a'; ctx.beginPath(); ctx.arc(clamp(hx, x - 55 * k, x + 55 * k), clamp(hy, cy - 60 * k, cy + 60 * k), 5 * k, 0, TAU); ctx.fill(); }
      txt(lab, x, cy - 60 * k, '#fff', `700 ${Math.round(10 * k)}px ${BC}`); txt({ clean: 'CENTRE', shield: 'SHIELD', glance: 'GLANCE', miss: 'MISS' }[q], x, cy + 58 * k, '#ffd36a', `700 ${Math.round(12 * k)}px ${BC}`); }
    if (e.q !== 'miss' || e.tq !== 'miss') txt(e.braceOk ? 'braced on time' : e.braceEarly ? 'braced too early' : 'not braced', cx, cy + 86 * k, e.braceOk ? '#8fe0ab' : '#ffb0a0', `700 ${Math.round(12 * k)}px ${BC}`); }
  if (G.lesson) lessonPanel(G);
  if (ui.banner) { const b = ui.banner, a = Math.min(1, b.t / 0.2, ((b.secs || 1.6) - b.t) / 0.4); ctx.globalAlpha = Math.max(0, a); txt(b.txt, W / 2, H * 0.2, '#ffd36a', `400 ${Math.round((b.small ? 26 : 36) * k)}px ${TF}`); if (b.sub) txt(b.sub, W / 2, H * 0.2 + 28 * k, '#fff', `700 ${Math.round(14 * k)}px ${BC}`); ctx.globalAlpha = 1; } }
function lessonPanel(G) { const D = G.lesson, st0 = D.steps[D.i], w = Math.min(W - 300 * k, 420 * k), x = W / 2 - w / 2, y = 44 * k; ctx.save();
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; const lines = wrapText(st0.how, w - 24), h = 50 * k + lines.length * 17 * k;
  ctx.fillStyle = 'rgba(30,20,10,.9)'; rrect(x, y, w, h, 12); ctx.fill(); ctx.strokeStyle = 'rgba(255,214,110,.8)'; ctx.lineWidth = 2; rrect(x, y, w, h, 12); ctx.stroke();
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#ffd36a'; ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillText(`LESSON ${G.N} OF 3`, x + 12, y + 9 * k);
  ctx.fillStyle = '#fff'; ctx.font = `400 ${Math.round(15 * k)}px ${TF}`; ctx.fillText(st0.title, x + 12, y + 23 * k);
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.9)'; lines.forEach((l, i) => ctx.fillText(l, x + 12, y + 45 * k + i * 17 * k));
  for (let i = 0; i < st0.need; i++) { ctx.beginPath(); ctx.arc(x + w - 16 - (st0.need - 1 - i) * 18 * k, y + 16 * k, 6 * k, 0, TAU); if (i < D.n) { ctx.fillStyle = '#8fe0ab'; ctx.fill(); } else { ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; ctx.stroke(); } }
  ctx.restore(); ctx.textBaseline = 'middle'; }
