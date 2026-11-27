// ===================== THE VIEW: Fruit Fight in 3D, first person (three.js through tools/world3d.js) =====================
// You stand at the bottom of a meadow (an orchard, a pumpkin patch, a swamp's edge, a castle garden) under the level's sky,
// your slingshot's fork at the bottom of the screen. The monsters come up the grass towards you, each its own shape and colour
// (a shield-troll with its board, a hopper bouncing, a big one with a glowing eye). While you pull, a dotted arc shows where the
// fruit will land. Fruit bursts in juice; a melon leaves a pink splash on the grass; a banana leaves its peel.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [];
let hint = null, V3 = null;
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 6) TXT.shift(); }
function tip(key, txt, secs = 2.8) { if (HEADLESS || !(G && G.lesson)) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 1.8);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.3) TXT.shift(); if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; } }
const ui = { drag: null };
const groundH = (x, z) => Math.sin(x * 0.15) * 0.25 + Math.cos(z * 0.08) * 0.3 + Math.max(0, z - 40) * 0.08;
function monster(T, k) { const g = new T.Group(), M = MON[k], col = { blob: 0x4e9a38, scut: 0xb0362a, shield: 0x6a4a9a, hop: 0x3a6aa8, big: 0x6a5038 }[k], skin = new T.MeshStandardMaterial({ color: col, roughness: 0.75 }), white = new T.MeshStandardMaterial({ color: 0xffffff }), black = new T.MeshStandardMaterial({ color: 0x111111 });
  const body = new T.Group(); g.add(body); const b = new T.Mesh(new T.SphereGeometry(M.r, 18, 14), skin); b.scale.y = M.h / (M.r * 2); b.position.y = M.h / 2; b.castShadow = true; body.add(b);
  for (const s of [-1, 1]) { const e = new T.Mesh(new T.SphereGeometry(M.r * 0.22, 10, 8), white); e.position.set(s * M.r * 0.35, M.h * 0.68, M.r * 0.82); body.add(e); const p = new T.Mesh(new T.SphereGeometry(M.r * 0.1, 8, 6), black); p.scale.set(0.45, 1.3, 1); p.position.set(s * M.r * 0.35, M.h * 0.68, M.r * 1.0); body.add(p);
    const brow = new T.Mesh(new T.BoxGeometry(M.r * 0.42, M.r * 0.09, M.r * 0.12), black); brow.position.set(s * M.r * 0.33, M.h * 0.68 + M.r * 0.22, M.r * 0.98); brow.rotation.z = s * 0.45; body.add(brow); }      // (27 Nov 2026, his review: "Make the monsters less cute just a little": cross brows, slit pupils, a toothy frown, darker skins)
  const mouth = new T.Mesh(new T.TorusGeometry(M.r * 0.3, M.r * 0.05, 6, 12, Math.PI), black); mouth.position.set(0, M.h * 0.36, M.r * 0.92); body.add(mouth);
  for (const s of [-1, 1]) { const tooth = new T.Mesh(new T.ConeGeometry(M.r * 0.06, M.r * 0.16, 5), white); tooth.rotation.x = Math.PI; tooth.position.set(s * M.r * 0.14, M.h * 0.36 + M.r * 0.25, M.r * 0.95); body.add(tooth); }
  if (k === 'shield') { const sh = new T.Mesh(new T.BoxGeometry(M.r * 2.2, M.h * 0.95, 0.12), new T.MeshStandardMaterial({ color: 0x8a5a2a, roughness: 0.9 })); sh.position.set(0, M.h * 0.5, M.r + 0.25); sh.castShadow = true; body.add(sh); g.userData.shield = sh; }
  if (k === 'big') { const eye = new T.Mesh(new T.SphereGeometry(0.42, 14, 10), new T.MeshStandardMaterial({ color: 0xffe040, emissive: 0xffa000, emissiveIntensity: 1.2 })); eye.position.set(0, M.h * 0.95, M.r * 0.3); body.add(eye); for (const s of [-1, 1]) { const horn = new T.Mesh(new T.ConeGeometry(0.25, 0.9, 8), white); horn.position.set(s * M.r * 0.6, M.h * 0.9, 0); horn.rotation.z = -s * 0.5; body.add(horn); } }
  if (k === 'scut' || k === 'hop') for (const s of [-1, 1]) { const leg = new T.Mesh(new T.CylinderGeometry(0.07, 0.05, k === 'hop' ? 0.8 : 0.5, 6), skin); leg.position.set(s * M.r * 0.5, 0.15, 0); body.add(leg); }
  g.userData.body = body; return g; }
function buildWorld() { if (V3) return V3; const T = THREE; if (!W3 || !W3.init({ canvas: $('gl'), fov: 62, far: 2000, near: 0.1 })) { V3 = { none: true }; return V3; } const S = W3.scene;
  const land = W3.terrain({ size: 400, seg: 120, x: 0, z: 60, height: groundH, colour: (x, z, h, sl) => { const path = Math.abs(x) < 9 && z < 50 ? 1 : 0; return path ? [0.4, 0.62, 0.28] : [0.32 + h * 0.02, 0.55, 0.24]; }, map: W3.grainTex(256, 5, 210, 45, 12) }); if (land.material.map) land.material.map.repeat.set(40, 40);
  const R0 = W3.rng(9), trees = []; for (let i = 0; i < 180; i++) { const side = i % 2 ? 1 : -1, x = side * (12 + R0() * 60), z = -10 + R0() * 160; trees.push({ x, z, y: groundH(x, z), s: 0.9 + R0() * 1.2, hue: R0(), shade: R0() * 0.4 }); } W3.pines(trees, { layers: 4, shadow: true });
  const fenceM = new T.MeshStandardMaterial({ color: 0xc8a878, roughness: 0.9 }); for (const s of [-1, 1]) for (let z = 2; z < 50; z += 2) { const p = new T.Mesh(new T.BoxGeometry(0.12, 0.9, 0.12), fenceM); p.position.set(s * 10, groundH(s * 10, z) + 0.45, z); p.castShadow = true; S.add(p); const r = new T.Mesh(new T.BoxGeometry(0.06, 0.08, 2), fenceM); r.position.set(s * 10, groundH(s * 10, z) + 0.7, z + 1); S.add(r); }
  const NP = 160, pG = new T.BufferGeometry(); pG.setAttribute('position', new T.BufferAttribute(new Float32Array(NP * 3), 3)); pG.setAttribute('color', new T.BufferAttribute(new Float32Array(NP * 3), 3)); const juice = new T.Points(pG, new T.PointsMaterial({ size: 0.16, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false })); juice.frustumCulled = false; S.add(juice);
  V3 = { T, S, juice, P: Array.from({ length: NP }, () => ({ t: 9, life: 1, x: 0, y: -99, z: 0, vx: 0, vy: 0, vz: 0, c: [1, 1, 1] })), mons: new Map(), shots: new Map(), decals: [], peels: new Map() }; W3.setQuality(stepN); return V3; }
const FCOL = { orange: 0xff8a1a, melon: 0x3aa83a, banana: 0xffe040, grapes: 0x8a3ac8, coconut: 0x6a4424, pineapple: 0xe8b830 }, JCOL = { orange: [1, 0.55, 0.1], melon: [1, 0.3, 0.45], banana: [1, 0.95, 0.4], grapes: [0.6, 0.2, 0.8], coconut: [0.95, 0.95, 0.9], pineapple: [1, 0.85, 0.3] };
function fruitMesh(T, f) { if (f === 'banana') { const m = new T.Mesh(new T.TorusGeometry(0.16, 0.06, 8, 12, Math.PI * 0.8), new T.MeshStandardMaterial({ color: FCOL[f], roughness: 0.5 })); return m; }
  const m = new T.Mesh(new T.SphereGeometry(FRUITS[f].r, 14, 10), new T.MeshStandardMaterial({ color: FCOL[f], roughness: 0.5 })); if (f === 'melon') m.scale.z = 1.25; m.castShadow = true; return m; }
function splashP(V, x, y, z, f, n) { for (let i = 0; i < n; i++) for (const q of V.P) if (q.t >= q.life) { const a = Math.random() * TAU; Object.assign(q, { t: 0, life: 0.5 + Math.random() * 0.4, x, y, z, vx: Math.cos(a) * (1 + Math.random() * 4), vy: 2 + Math.random() * 4, vz: Math.sin(a) * (1 + Math.random() * 4), c: JCOL[f] }); break; } }
function setWeather(G) { const V = V3; if (!V || V.none || V.sky === G.weather) return; V.sky = G.weather; W3.setSky(G.weather, { azim: 200 }); W3.S.onBolt = () => { if (!HEADLESS && sfx.thunder) setTimeout(() => sfx.thunder(), 300 + Math.random() * 900); }; }
const VW = new (window.THREE ? THREE.Vector3 : Object)();
function wScreen(x, y, z) { W3.cam.updateMatrixWorld(); VW.set(x, y, z); return W3.screen(VW); }
// the pull: from the thumb's drag to an aim
function pullAim(d) { const dx = d.x - d.x0, dy = d.y - d.y0, len = Math.hypot(dx, dy), u = clamp(dy / (PULL_LEN * k), 0, 1), yaw = clamp(-dx / (150 * k), -1, 1) * 0.55; if (len <= 22 * k || dy < 8 * k) return { yaw, pitch: 0, power: 0, len }; const p = pullShot(G, G.fruit, u, yaw); return { yaw, pitch: p.pitch, power: p.power, len }; }
function onEvent(G, e) { const cx = W / 2, cy = H * 0.3, V = V3 && !V3.none ? V3 : null;
  switch (e.k) {
    case 'start': say(PLACES[G.place].name.toUpperCase(), cx, cy, '#fff', 20); break;
    case 'wave': say(`WAVE ${e.n} OF ${e.of}`, cx, cy + 30 * k, '#ffd36a', 26); sfx.horn(); break;
    case 'load': sfx.load(e.f); break;
    case 'notready': if (!gate('nr', 400)) break; sfx.no(); break;
    case 'fire': sfx.twang(e.f); FX.shake = 3; break;
    case 'hit': { if (V) splashP(V, e.x, e.y, e.z, 'orange', 6); sfx.splat(e.dmg); FX.stop = 0.04; const s = wScreen(e.x, e.y + 1.4, e.z); if (e.why === 'eye') say('EYE! ×3', s.x, s.y, '#ffe040', 22); else if (e.why === 'air') say('IN THE AIR!', s.x, s.y, '#9be3ff', 18); break; }
    case 'block': { sfx.thunk(); const s = wScreen(e.x, 2.2, e.z); say('BLOCKED', s.x, s.y, '#ffd0c4', 18); tip('shield', 'The board stops a low shot. Hit him from far away (it falls on him), burst a melon, or throw a coconut.', 3.2); break; }
    case 'splash': if (V) splashP(V, e.x, 0.3, e.z, 'melon', 30); sfx.melon(); FX.shake = 6; if (V) V.decals.push({ x: e.x, z: e.z, t: 0 }); break;
    case 'slip': { sfx.slip(); const s = wScreen(e.x, 2, e.z); say('SLIP!', s.x, s.y, '#ffe040', 18); break; }
    case 'pop': if (V) splashP(V, e.x, 0.8, e.z, 'banana', 10); sfx.pop(); break;
    case 'combo': say(`${e.n}× COMBO!`, cx, cy, '#ffd36a', 30); sfx.combo(e.n); FX.flash = 0.3; vibe(HAP.light); break;
    case 'land': if (V && e.f !== 'melon') splashP(V, e.x, 0.1, e.z, e.f, 5); break;
    case 'reached': sfx.hurt(); FX.red = 0.8; FX.shake = 14; vibe(HAP.best); say('OUCH! −♥', cx, H * 0.5, '#ff8a7a', 30); break;
    case 'lessonnext': if (e.first) hint = null; say(e.first ? 'FIRST, A LESSON' : 'NEXT LESSON', cx, H * 0.5, '#ffd36a', 26); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, cx, H * 0.5, '#9be3b5', 26); sfx.combo(e.n); break;
    case 'lessonmiss': coachMiss(); break;
    case 'lessondone': say('READY TO FIGHT!', cx, H * 0.5, '#ffd36a', 26); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); vibe(HAP.best); break;
    case 'lost': sfx.lose(); break;
  } }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#1a1420'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D meadow.', W / 2, H / 2); return; }
  const g = G || idleG(), t = now, T = V.T; setWeather(g);
  // monsters
  const seen = new Set(); for (const m of g.mons) { seen.add(m.id); let o = V.mons.get(m.id); if (!o) { o = monster(T, m.k); V.S.add(o); V.mons.set(m.id, o); } const M = MON[m.k];
    o.position.set(m.x, groundH(m.x, m.z) + m.y, m.z); o.rotation.y = Math.PI; const b = o.userData.body; b.rotation.z = m.slip > 0 ? Math.sin(t * 20) * 0.6 : Math.sin(m.wob) * 0.08; b.position.y = m.slip > 0 ? 0 : Math.abs(Math.sin(m.wob * 2)) * 0.12;
    if (m.dead) { const u = Math.max(0, m.deadT / 0.8); o.scale.setScalar(Math.max(0.01, u)); } else o.scale.setScalar(1); }
  for (const [id, o] of V.mons) if (!seen.has(id)) { V.S.remove(o); V.mons.delete(id); }
  // fruit in the air
  const ss = new Set(); for (const s of g.shots) { ss.add(s); let o = V.shots.get(s); if (!o) { o = fruitMesh(T, s.f); V.S.add(o); V.shots.set(s, o); } o.position.set(s.x, s.y, s.z); o.rotation.x += dt * 8; o.rotation.y += dt * 5; }
  for (const [s, o] of V.shots) if (!ss.has(s)) { V.S.remove(o); V.shots.delete(s); }
  // peels and melon splashes on the grass
  const ps = new Set(); for (const p of g.peels) { ps.add(p); let o = V.peels.get(p); if (!o) { o = fruitMesh(T, 'banana'); o.rotation.x = Math.PI / 2; V.S.add(o); V.peels.set(p, o); } o.position.set(p.x, groundH(p.x, p.z) + 0.05, p.z); }
  for (const [p, o] of V.peels) if (!ps.has(p)) { V.S.remove(o); V.peels.delete(p); }
  for (const d of V.decals) { if (!d.m) { d.m = new T.Mesh(new T.CircleGeometry(1.8, 20), new T.MeshBasicMaterial({ color: 0xff5a7a, transparent: true, opacity: 0.6, depthWrite: false })); d.m.rotation.x = -Math.PI / 2; d.m.position.set(d.x, groundH(d.x, d.z) + 0.04, d.z); V.S.add(d.m); } d.t += dt; d.m.material.opacity = Math.max(0, 0.6 - d.t * 0.08); }
  while (V.decals.length && V.decals[0].t > 8) { V.S.remove(V.decals[0].m); V.decals.shift(); }
  const pa = V.juice.geometry.attributes.position, ca = V.juice.geometry.attributes.color; V.P.forEach((q, i) => { if (q.t < q.life) { q.t += dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; q.vy -= 12 * dt; } pa.setXYZ(i, q.x, q.t < q.life ? q.y : -99, q.z); ca.setXYZ(i, q.c[0], q.c[1], q.c[2]); }); pa.needsUpdate = ca.needsUpdate = true;
  const cam = W3.cam; cam.position.set(0, 1.7, -0.5); cam.lookAt(0, 1.1, 22); if (FX.shake > 0) { cam.rotation.z += (Math.random() - 0.5) * FX.shake * 0.003; }
  W3.setFocus(0, 0, 18, 30); W3.render(dt);
  if (G) hud(G, t);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 0.9 ? 1 : 1 - (t2.t - 0.9) / 0.4; ctx.globalAlpha = Math.max(0, al); ctx.font = `${Math.round(t2.size * k)}px ${TF}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 22); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 22); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(15 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 19 * k, h = lines.length * lh + 16 * k, w2 = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30;
    ctx.fillStyle = 'rgba(0,0,0,.66)'; rrect(W / 2 - w2 / 2, H * 0.42 - h / 2, w2, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.42 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,60,40,${FX.red * 0.2})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); } }
let IG = null; function idleG() { if (!IG || IG.over) { IG = newGame(4, { seed: (Math.random() * 1e6) | 0 }); IG.mem = {}; } honest(IG, { react: 0.2, acc: 0.95 }, IG.mem); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function fruitBtns(G) { const fr = G.cfg.fruits, w = Math.min(64 * k, (W - 24 - 12 * k * (fr.length - 1)) / fr.length), gap = 12 * k, y = H - w - 18 * k, x0 = W / 2 - (fr.length * w + (fr.length - 1) * gap) / 2; return fr.map((f, i) => ({ f, x: x0 + i * (w + gap), y, w, h: w })); }
function hud(G, t) { const c = G.cfg;
  if (G.lesson) lessonPanel(G);
  if (!G.lesson) { ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.font = `${Math.round(15 * k)}px ${TF}`; ctx.fillStyle = '#fff'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.5)'; const s = `WAVE ${G.wave}/${c.waves}`; ctx.strokeText(s, 14, 44 * k); ctx.fillText(s, 14, 44 * k);
    const left = G.queue.length + G.mons.filter(m => !m.dead).length; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.strokeText(`${left} monsters left`, 14, 64 * k); ctx.fillText(`${left} monsters left`, 14, 64 * k);
    ctx.textAlign = 'right'; ctx.font = `${Math.round(20 * k)}px sans-serif`; for (let i = 0; i < c.hearts; i++) { ctx.globalAlpha = i < G.hearts ? 1 : 0.25; ctx.fillText('❤️', W - 12 - i * 26 * k, 42 * k); } ctx.globalAlpha = 1;
    if (G.combos) { ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = '#ffd36a'; ctx.fillText(`${G.combos} combo${G.combos > 1 ? 's' : ''}`, W - 14, 70 * k); } }
  // a warning when a monster is close
  for (const m of G.mons) if (!m.dead && m.z < 9) { const s = wScreen(m.x, MON[m.k].h + 0.6, m.z); if (s.front) { ctx.fillStyle = '#ff4a3a'; ctx.font = `${Math.round(22 * k)}px ${TF}`; ctx.textAlign = 'center'; ctx.fillText('!', s.x, s.y); } }
  // the arc while pulling
  const B = fruitBtns(G);
  if (ui.drag) { const a = pullAim(ui.drag); if (a.power) { const pts = arc(G, a.yaw, a.pitch, a.power); ctx.fillStyle = 'rgba(255,255,255,.85)'; pts.forEach((p, i) => { if (i % 2) return; const s = wScreen(p[0], p[1], p[2]); if (s.front) { ctx.beginPath(); ctx.arc(s.x, s.y, Math.max(1.5, 4 - i * 0.03) * k, 0, TAU); ctx.fill(); } });
      const e = pts[pts.length - 1], se = wScreen(e[0], 0.05, e[2]); if (se.front) { const sp2 = FRUITS[G.fruit].splash; ctx.strokeStyle = sp2 ? '#ff6a8a' : '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(se.x, se.y, (sp2 ? 15 * sp2 : 14) * k, (sp2 ? 5.4 * sp2 : 5) * k, 0, 0, TAU); ctx.stroke(); } } }
  // the slingshot's fork and band
  const fx = W / 2, fy = H - 118 * k, bx = ui.drag ? clamp(fx + (ui.drag.x - ui.drag.x0) * 0.5, fx - 60 * k, fx + 60 * k) : fx, by = ui.drag ? clamp(fy + (ui.drag.y - ui.drag.y0) * 0.5 + 20 * k, fy, fy + 80 * k) : fy + 10 * k;
  ctx.strokeStyle = '#6a4424'; ctx.lineWidth = 14 * k; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(fx, fy + 120 * k); ctx.lineTo(fx, fy + 30 * k); ctx.lineTo(fx - 40 * k, fy - 20 * k); ctx.moveTo(fx, fy + 30 * k); ctx.lineTo(fx + 40 * k, fy - 20 * k); ctx.stroke();
  ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 4 * k; ctx.beginPath(); ctx.moveTo(fx - 40 * k, fy - 20 * k); ctx.lineTo(bx, by); ctx.lineTo(fx + 40 * k, fy - 20 * k); ctx.stroke();
  if (G.cd[G.fruit] <= 0) { ctx.font = `${Math.round(28 * k)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(FRUITS[G.fruit].icon, bx, by); }
  // the fruit buttons
  for (const b of B) { const F = FRUITS[b.f], on = G.fruit === b.f, cd = G.cd[b.f] / (F.reload * (b.f === 'orange' ? 1 : c.reloadK)); ctx.fillStyle = on ? 'rgba(255,154,42,.85)' : 'rgba(0,0,0,.45)'; rrect(b.x, b.y, b.w, b.h, 16); ctx.fill();
    ctx.font = `${Math.round(b.h * 0.5)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.globalAlpha = cd > 0 ? 0.4 : 1; ctx.fillText(F.icon, b.x + b.w / 2, b.y + b.h / 2); ctx.globalAlpha = 1;
    if (cd > 0) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(b.x + b.w / 2, b.y + b.h / 2, b.w * 0.42, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - cd)); ctx.stroke(); } }
  if ((G && G.lesson) && !ui.drag && !G.lesson && G.t < 6) { ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillText('PULL BACK ANYWHERE · LET GO TO FIRE', W / 2, H * 0.62); } }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { coachPanel(G); }
