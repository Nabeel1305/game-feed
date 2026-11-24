// ===================== THE VIEW: Mini Golf in 3D (three.js through tools/world3d.js) =====================
// A mini golf hole in a garden (later the beach, a castle, candy land): felt cut to the hole's shape with wooden rails round
// it, red bumpers, sand, slopes marked with arrows, a little windmill whose sails turn, ponds, sliding walls, gold coins, the
// cup and its flag. The camera frames the whole hole from above the tee.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [];
let hint = null, V3 = null;
const ui = { aim: null, snap: true };
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 2.8) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function fxStep(dt) {
  FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.5) TXT.shift();
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; }
}
const NAMES = { '-3': 'ALBATROSS!', '-2': 'EAGLE!', '-1': 'BIRDIE!', '0': 'PAR', '1': 'BOGEY', '2': 'DOUBLE BOGEY' };
function buildWorld() {
  if (V3) return V3; const T = THREE; if (!W3 || !W3.init({ canvas: $('gl'), fov: 36, far: 1200, near: 0.1 })) { V3 = { none: true }; return V3; }
  const S = W3.scene, R0 = W3.rng(7);
  const grassM = new T.MeshStandardMaterial({ color: 0x8cc864, roughness: 1, map: W3.grainTex(256, 4, 200, 45, 8) }); grassM.map.repeat.set(20, 20);
  const grass = new T.Mesh(new T.PlaneGeometry(200, 200), grassM); grass.rotation.x = -Math.PI / 2; grass.position.y = -0.02; grass.receiveShadow = true; S.add(grass);
  const trees = []; for (let i = 0; i < 60; i++) { const a = R0() * TAU, r = 14 + R0() * 30; trees.push({ x: Math.sin(a) * r, z: Math.cos(a) * r - 4, y: 0, s: 0.35 + R0() * 0.35, hue: R0(), shade: R0() }); } W3.pines(trees, { layers: 3, shadow: true });
  const bushM = new T.MeshStandardMaterial({ color: 0x3a7a2a, roughness: 1, flatShading: true }); for (let i = 0; i < 30; i++) { const b = new T.Mesh(new T.IcosahedronGeometry(0.5 + R0() * 0.6, 1), bushM); const a = R0() * TAU, r = 9 + R0() * 6; b.position.set(Math.sin(a) * r, 0.2, Math.cos(a) * r); b.castShadow = true; S.add(b); }
  const course = new T.Group(); S.add(course);
  const ballM = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 }), ball = new T.Mesh(new T.SphereGeometry(0.12, 20, 16), ballM); ball.castShadow = true; S.add(ball);
  const glowT = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new T.CanvasTexture(c); })();
  V3 = { T, S, grassM, course, ball, glowT, built: null, mills: [], movers: [], coins: [], bumpers: [], cam: { d: 20, look: [0, 0, 0] } };
  W3.setQuality(stepN); return V3;
}
// the hole: felt, rails, cup and flag, its obstacles
function buildHole(g) {
  const V = V3, T = THREE, h = hole(g), key = g.hi + ':' + h.key + ':' + h.cup.join(); if (V.built === key) return; V.built = key; V.course.clear(); V.mills = []; V.movers = []; V.coins = []; V.bumpers = [];
  const th = THEMES[g.theme], sh = new T.Shape(); h.poly.forEach((p, i) => i ? sh.lineTo(p[0], -p[1]) : sh.moveTo(p[0], -p[1]));
  const feltM = new T.MeshStandardMaterial({ color: th.felt, roughness: 0.95, map: W3.grainTex(128, 13, 220, 18, 12) }); feltM.map.repeat.set(0.4, 0.4);
  const felt = new T.Mesh(new T.ShapeGeometry(sh), feltM); felt.rotation.x = -Math.PI / 2; felt.position.y = 0.02; felt.receiveShadow = true; V.course.add(felt);
  const base = new T.Mesh(new T.ExtrudeGeometry(sh, { depth: 0.18, bevelEnabled: false }), new T.MeshStandardMaterial({ color: 0x6a5a4a, roughness: 0.9 })); base.rotation.x = -Math.PI / 2; base.position.y = -0.17; V.course.add(base);
  const railM = new T.MeshStandardMaterial({ color: th.rail, roughness: 0.6 });
  for (const w of h.walls) { const [a, b] = w, L = Math.hypot(b[0] - a[0], b[1] - a[1]), m = new T.Mesh(new T.BoxGeometry(L + 0.16, 0.22, 0.14), railM); m.position.set((a[0] + b[0]) / 2, 0.12, (a[1] + b[1]) / 2); m.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]); m.castShadow = m.receiveShadow = true; V.course.add(m); }
  const cup = new T.Mesh(new T.CircleGeometry(g.cfg.cupR, 24), new T.MeshBasicMaterial({ color: 0x0a0a0a })); cup.rotation.x = -Math.PI / 2; cup.position.set(h.cup[0], 0.03, h.cup[1]); V.course.add(cup);
  const pole = new T.Mesh(new T.CylinderGeometry(0.02, 0.02, 1.3, 6), new T.MeshStandardMaterial({ color: 0xf0f0f0 })); pole.position.set(h.cup[0], 0.65, h.cup[1]); const flag = new T.Mesh(new T.PlaneGeometry(0.45, 0.28), new T.MeshStandardMaterial({ color: 0xe82a2a, side: T.DoubleSide })); flag.position.set(h.cup[0] + 0.23, 1.15, h.cup[1]); pole.castShadow = flag.castShadow = true; V.course.add(pole, flag); V.flag = flag;
  const tee = new T.Mesh(new T.CircleGeometry(0.22, 20), new T.MeshStandardMaterial({ color: 0x1a5a2a })); tee.rotation.x = -Math.PI / 2; tee.position.set(h.tee[0], 0.025, h.tee[1]); V.course.add(tee);
  for (const o of h.obst) {
    if (o.kind === 'bumper') { const m = new T.Mesh(new T.CylinderGeometry(o.r, o.r, 0.3, 24), new T.MeshStandardMaterial({ color: 0xe0302a, roughness: 0.4 })); m.position.set(o.x, 0.15, o.z); const ring = new T.Mesh(new T.TorusGeometry(o.r, 0.04, 6, 24), new T.MeshStandardMaterial({ color: 0xffffff })); ring.rotation.x = Math.PI / 2; ring.position.set(o.x, 0.3, o.z); m.castShadow = true; V.course.add(m, ring); V.bumpers.push(m); }
    if (o.kind === 'sand') { const m = new T.Mesh(new T.CircleGeometry(o.r, 28), new T.MeshStandardMaterial({ color: 0xe8d4a0, roughness: 1, map: W3.grainTex(64, 3, 210, 40, 10) })); m.rotation.x = -Math.PI / 2; m.position.set(o.x, 0.03, o.z); V.course.add(m); }
    if (o.kind === 'water') { const m = new T.Mesh(new T.CircleGeometry(o.r, 28), new T.MeshStandardMaterial({ color: 0x2a7ad8, roughness: 0.1, metalness: 0.3, emissive: 0x0a2a5a })); m.rotation.x = -Math.PI / 2; m.position.set(o.x, 0.035, o.z); V.course.add(m); const rim = new T.Mesh(new T.TorusGeometry(o.r, 0.06, 6, 28), new T.MeshStandardMaterial({ color: 0x8a8a84 })); rim.rotation.x = Math.PI / 2; rim.position.set(o.x, 0.05, o.z); V.course.add(rim); }
    if (o.kind === 'slope') { const c = document.createElement('canvas'); c.width = 64; c.height = 64; const x2 = c.getContext('2d'); x2.fillStyle = 'rgba(255,255,255,0)'; x2.fillRect(0, 0, 64, 64); x2.strokeStyle = 'rgba(255,255,255,.55)'; x2.lineWidth = 6; for (const y of [18, 46]) { x2.beginPath(); x2.moveTo(14, y + 8); x2.lineTo(32, y - 8); x2.lineTo(50, y + 8); x2.stroke(); } const tx = new T.CanvasTexture(c); tx.wrapS = tx.wrapT = T.RepeatWrapping; tx.repeat.set(2, 2);
      const m = new T.Mesh(new T.PlaneGeometry(o.w, o.h), new T.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.rotation.z = Math.atan2(-o.gx, -o.gz) + Math.PI; m.position.set(o.x, 0.04, o.z); V.course.add(m); const shade = new T.Mesh(new T.PlaneGeometry(o.w, o.h), new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.12, depthWrite: false })); shade.rotation.x = -Math.PI / 2; shade.position.set(o.x, 0.035, o.z); V.course.add(shade); }
    if (o.kind === 'windmill') { const tw = new T.Mesh(new T.CylinderGeometry(0.22, 0.32, 1.4, 8), new T.MeshStandardMaterial({ color: 0xf0e8d8 })); tw.position.set(o.x, 0.7, o.z); const rf = new T.Mesh(new T.ConeGeometry(0.34, 0.45, 8), new T.MeshStandardMaterial({ color: 0xb8402a })); rf.position.set(o.x, 1.62, o.z); tw.castShadow = true; V.course.add(tw, rf);
      const bl = new T.Group(); bl.position.set(o.x, 0.14, o.z); for (let i = 0; i < o.blades; i++) { const b = new T.Mesh(new T.BoxGeometry(0.1, 0.18, o.len), new T.MeshStandardMaterial({ color: 0x8a5a32 })); b.position.z = o.len / 2; const p = new T.Group(); p.rotation.y = i * TAU / o.blades; p.add(b); bl.add(p); } bl.traverse(q => { if (q.isMesh) q.castShadow = true; }); V.course.add(bl); V.mills.push({ o, bl }); }
    if (o.kind === 'mover') { const m = new T.Mesh(new T.BoxGeometry(o.len, 0.22, 0.14), new T.MeshStandardMaterial({ color: 0x4a6ad8 })); m.position.set(o.x, 0.12, o.z); m.castShadow = true; V.course.add(m); V.movers.push({ o, m }); } }
  for (const q of h.coins) { const m = new T.Mesh(new T.CylinderGeometry(0.16, 0.16, 0.04, 16), new T.MeshStandardMaterial({ color: 0xf0c030, metalness: 0.8, roughness: 0.3, emissive: 0x604000 })); m.rotation.x = Math.PI / 2; m.position.set(q.x, 0.3, q.z); V.course.add(m); V.coins.push({ q, m }); }
  V.course.traverse(o => { if (o.isMesh && o !== felt) o.receiveShadow = true; });
  fitCam(h, true);
}
const SV = new (window.THREE ? THREE.Vector3 : Object)();
function scr(x, y, z) { if (!V3 || V3.none) return { x: W / 2 + x * 20, y: H / 2 + z * 20, front: true }; SV.set(x, y, z); return W3.screen(SV); }
const CAM = { tilt: 1.0, d: 20, look: [0, 0, 0], key: '', rot: 0 };      // rot (22 Nov 2026): a hole wider than it is long is looked at from its side on a phone, so it fills the screen instead of a strip of it
function fitCam(h, force) {
  const cam = W3.cam, asp = innerWidth / innerHeight, key = asp + ':' + h.cup.join() + h.key; if (CAM.key === key && !force) return; CAM.key = key; cam.fov = 36; cam.aspect = asp; cam.updateProjectionMatrix();
  const xs = h.poly.map(p => p[0]), zs = h.poly.map(p => p[1]); CAM.look = [(Math.min(...xs) + Math.max(...xs)) / 2, 0, (Math.min(...zs) + Math.max(...zs)) / 2 + 0.3];
  { const wx = Math.max(...xs) - Math.min(...xs), wz = Math.max(...zs) - Math.min(...zs); CAM.rot = asp < 0.8 && wx > wz * 1.12 ? (h.tee[0] >= CAM.look[0] ? 1 : -1) * Math.PI / 2 : 0; if (CAM.rot) CAM.look[2] -= 0.3; }
  let lo = 4, hi = 120; for (let it = 0; it < 28; it++) { const d = (lo + hi) / 2; place(d); cam.updateMatrixWorld(); let ok = true; for (const p of h.poly) { SV.set(p[0], 0, p[1]).project(cam); if (Math.abs(SV.x) > 0.9 || SV.y > 0.62 || SV.y < -0.7) { ok = false; break; } } if (ok) hi = d; else lo = d; }
  CAM.d = hi; place(hi);
}
function place(d) { const cam = W3.cam, L = CAM.look, cd = Math.cos(CAM.tilt) * d; cam.position.set(L[0] + Math.sin(CAM.rot) * cd, L[1] + Math.sin(CAM.tilt) * d, L[2] + Math.cos(CAM.rot) * cd); cam.lookAt(L[0], L[1], L[2]); }
function onEvent(G, e) {
  const cx = W / 2, cy = H * 0.36, b = G.ball, bs = b ? scr(b.x, 0.5, b.z) : { x: cx, y: cy };
  switch (e.k) {
    case 'hole': ui.snap = true; break;
    case 'shot': sfx.putt(e.pow); vibe(HAP.light); break;
    case 'rail': if (!HEADLESS) sfx.rail(e.v); break;
    case 'bump': sfx.bumper(); FX.shake = 3; break;
    case 'swat': sfx.swat(); FX.shake = 4; tip('mill', 'Time it: shoot when the gap between the sails comes round', 2.6); break;
    case 'lip': sfx.lip(); say('LIPPED OUT!', bs.x, bs.y - 20, '#ffd0a0', 20); tip('lip', 'Too fast to drop: a softer putt falls in', 2.6); break;
    case 'coin': sfx.coin(2); say('+🪙', bs.x, bs.y - 20, '#ffe08a', 20); break;
    case 'splash': sfx.splash(); FX.red = 0.4; say('SPLASH! +1', cx, cy, '#9fd0ff', 26); break;
    case 'wings': sfx.splash(); say('WATER WINGS!', cx, cy, '#9fd0ff', 24); break;
    case 'stop': break;
    case 'sink': { if (e.lesson) { sfx.cup(); FX.flash = 0.5; say('IN THE CUP!', cx, cy, '#ffe08a', 28); break; } const name = e.n === 1 ? 'HOLE IN ONE!' : NAMES[String(clamp(e.d, -3, 2))] || `+${e.d}`; sfx.cup(); if (e.d < 0) { sfx.cheer(e.n === 1 ? 3 : -e.d); FX.flash = 0.8; vibe(HAP.best); } else vibe(HAP.light); say(name, cx, cy, e.d < 0 ? '#ffe08a' : e.d === 0 ? '#ffffff' : '#ffd0c0', e.n === 1 ? 36 : 30); } break;
    case 'pickup': sfx.no(); say('PICKED UP', cx, cy, '#ffd0c0', 26); break;
    case 'mull': sfx.mull(); say('MULLIGAN!', cx, cy, '#9be3b5', 26); break;
    case 'lessonnext': if (e.first) hint = null; say('FIRST, A LESSON', cx, H * 0.5, '#ffe08a', 26); sfx.ding(); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, cx, H * 0.5, '#9be3b5', 26); sfx.coin(e.n); break;
    case 'lessonmiss': coachMiss(); break;
    case 'lessondone': say('NOW THE ROUND!', cx, H * 0.5, '#ffe08a', 26); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); vibe(HAP.best); break;
    case 'lost': sfx.lose(); say('OVER THE LIMIT', cx, cy, '#ffb4a8', 28); break;
  }
}
let IG = null; function idleG() { if (!IG || IG.over) { IG = newGame(Math.max(4, store.get('level', 1) | 0), { seed: (Math.random() * 1e6) | 0 }); IG.mem = {}; IG.limit = 999; } honest(IG, { react: 0.3, acc: 0.96 }, IG.mem); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#10141f'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D course.', W / 2, H / 2); return; }
  const g = G || idleG(), t = now; if (V.sky !== g.weather) { V.sky = g.weather; W3.setSky(g.weather, { azim: 150 }); W3.scene.environmentIntensity = 0.8; }
  buildHole(g); fitCam(hole(g)); place(CAM.d);
  const b = g.ball; if (b) { V.ball.position.set(b.x, b.in ? -0.2 : 0.14, b.z); V.ball.rotation.x += b.vz * dt * 8; V.ball.rotation.z -= b.vx * dt * 8; V.ball.visible = !b.in; }
  V.mills.forEach(({ o, bl }) => bl.rotation.y = o.a0 + o.spin * g.t);
  V.movers.forEach(({ o, m }) => { const s = moverSeg(o, g.t); m.position.x = (s[0][0] + s[1][0]) / 2; });
  V.coins.forEach(({ q, m }) => { m.visible = !q.got; m.rotation.z = t * 3; m.position.y = 0.3 + Math.sin(t * 3 + q.x) * 0.05; });
  if (V.flag) V.flag.rotation.y = Math.sin(t * 2) * 0.3;
  if (FX.shake > 0) W3.cam.position.x += (Math.random() - 0.5) * FX.shake * 0.01;
  W3.setFocus(CAM.look[0], 0, CAM.look[2], 12); W3.render(dt);
  if (G) { aimLine(G); hud(G, t); }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 1.1 ? 1 : 1 - (t2.t - 1.1) / 0.4; ctx.globalAlpha = Math.max(0, al); ctx.font = `600 ${Math.round(t2.size * k)}px ${TF}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 22); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 22); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30;
    ctx.fillStyle = 'rgba(20,30,20,.78)'; rrect(W / 2 - w / 2, H * 0.78 - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.78 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(40,120,255,${FX.red * 0.15})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,248,210,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); }
}
// the aim: from the pull, the way the ball will go (dotted, longer with power), and a power ring round the ball
function aimDir(a) { const dx = a.x - a.x0, dy = a.y - a.y0, len = Math.hypot(dx, dy); return { ang: Math.atan2(-dx, -dy) + CAM.rot, pow: clamp(len / (150 * k), 0, 1), len }; }
function aimLine(G) {
  const a = ui.aim, b = G.ball; if (!a || !b || G.moving) return; const { ang, pow, len } = aimDir(a); if (len < 10 * k) return;
  const L = G.cfg.aim * (0.3 + pow), steps = 14; ctx.fillStyle = pow > 0.8 ? '#ff8a6a' : '#ffffff';
  let x = b.x, z = b.z, dx = Math.sin(ang), dz = Math.cos(ang), h = hole(G), bent = false;
  for (let i = 1; i <= steps; i++) { const nx = x + dx * L / steps, nz = z + dz * L / steps; if (G.cfg.bounce && !bent) { for (const w of h.walls) { if (segDist(nx, nz, w[0], w[1]) < 0.12) { const ax = w[1][0] - w[0][0], az = w[1][1] - w[0][1], l = Math.hypot(ax, az), tx = ax / l, tz = az / l, dot = dx * tx + dz * tz; dx = 2 * dot * tx - dx; dz = 2 * dot * tz - dz; bent = true; break; } } } x = nx; z = nz;
    const s = scr(x, 0.05, z); ctx.globalAlpha = 1 - i / (steps + 2); ctx.beginPath(); ctx.arc(s.x, s.y, (4 - i * 0.15) * k, 0, TAU); ctx.fill(); }
  ctx.globalAlpha = 1; const s = scr(b.x, 0.1, b.z); ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 6 * k; ctx.beginPath(); ctx.arc(s.x, s.y, 22 * k, 0, TAU); ctx.stroke(); ctx.strokeStyle = pow > 0.8 ? '#ff6a4a' : pow > 0.5 ? '#ffd36a' : '#9be37a'; ctx.lineWidth = 4 * k; ctx.beginPath(); ctx.arc(s.x, s.y, 22 * k, -Math.PI / 2, -Math.PI / 2 + TAU * pow); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a.x0, a.y0); ctx.lineTo(a.x, a.y); ctx.stroke();
}
function mullBtn() { const r = 30 * k; return { x: W - r - 16, y: H - r - 22 * k, r }; }
function hud(G, t) {
  const h = hole(G), y = 24 * k; ctx.textBaseline = 'middle'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.5)';
  ctx.textAlign = 'left'; ctx.font = `600 ${Math.round(20 * k)}px ${TF}`; ctx.fillStyle = '#fff'; const ht = G.lesson ? 'LESSON' : `HOLE ${G.hi + 1}/${G.holes.length}`; ctx.strokeText(ht, 14, y); ctx.fillText(ht, 14, y);
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; const pt = `Par ${h.par} · stroke ${G.strokes[G.hi] || 0}`; ctx.strokeText(pt, 14, y + 22 * k); ctx.fillText(pt, 14, y + 22 * k);
  if (!G.lesson) { ctx.textAlign = 'right'; ctx.font = `600 ${Math.round(18 * k)}px ${TF}`; const over = G.total - G.par, tt = `${G.total} / ${G.limit}`; ctx.fillStyle = G.limit - G.total <= 1 ? '#ffb4a8' : '#fff'; ctx.strokeText(tt, W - 14, y); ctx.fillText(tt, W - 14, y); ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillStyle = '#fff'; ctx.strokeText(`strokes / limit · par ${G.par}`, W - 14, y + 20 * k); ctx.fillText(`strokes / limit · par ${G.par}`, W - 14, y + 20 * k);
    ctx.fillStyle = '#ffe08a'; ctx.strokeText(`🪙 ${G.coins}`, W - 14, y + 38 * k); ctx.fillText(`🪙 ${G.coins}`, W - 14, y + 38 * k); }
  if (G.lesson) lessonPanel(G);
  if (G.mullUsable && G.mull > 0 && !G.moving) { const m = mullBtn(); ctx.fillStyle = 'rgba(30,60,30,.85)'; ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, TAU); ctx.fill(); ctx.strokeStyle = '#9be3b5'; ctx.lineWidth = 2.5; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `${Math.round(20 * k)}px sans-serif`; ctx.fillText('↶', m.x, m.y - 4 * k); ctx.font = `700 ${Math.round(9 * k)}px ${BC}`; ctx.fillText(`REDO ×${G.mull}`, m.x, m.y + 14 * k); }
  if ((G && G.lesson) && !G.moving && !ui.aim && G.ball && !G.ball.in && G.gap <= 0 && (G.N <= 2 || G.lesson)) { ctx.textAlign = 'center'; ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = '#fff'; ctx.strokeText('PULL BACK ANYWHERE, THEN LET GO', W / 2, H - 40 * k); ctx.fillText('PULL BACK ANYWHERE, THEN LET GO', W / 2, H - 40 * k); }
}
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { coachPanel(G); }
