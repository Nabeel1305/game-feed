// ===================== THE VIEW: Wolf Pack in 3D (three.js through tools/world3d.js) =====================
// Open snow between dark pines, hills behind, the level's light (a golden dusk, a grey morning, falling snow, night). The camera
// runs low behind you, the lead wolf, with your two packmates either side. Ahead, the herd of elk scatters; yours is marked
// with a ring. Her head turns before she swerves. Snow sprays from your paws on a burst.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [];
let hint = null, V3 = null;
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 6) TXT.shift(); }
function tip(key, txt, secs = 2.8) { if (HEADLESS || !(G && G.lesson)) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function fxStep(dt) {
  FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 1.8);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.3) TXT.shift();
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; }
}
const ui = { drag: null };
function snowH(x, z) { return Math.sin(x * 0.02) * 1.5 + Math.cos(z * 0.013) * 2 + Math.sin((x - z) * 0.007) * 3; }
// a four-legged animal (23 Nov 2026, his words: "Running graphics are absolutely horrible. Fix the Running graphics on all animals. Now its
// just vibrating"): the old animal swung four stiff sticks at a rate tied to the frame count (11 strides a second at a full run). Now the
// jointed animal from Hunter (part25_quad.js: shoulders, knees, hocks, a bounding gallop) with strides timed in seconds from its speed.
function quad(T, kind, col) {
  const id = kind === 'elk' ? 'elk' : 'wolf', R = quadMake(T, id, W3.grainTex(128, id === 'elk' ? 3 : 8, 205, 40, 3), col != null ? { col } : {});
  if (id === 'elk') { const am = R.M.pale; for (const s of [-1, 1]) { const ant = new T.Group(); ant.position.set(s * 0.05, 0.08, -0.03); R.head.add(ant);
      const beam = new T.Mesh(new T.CylinderGeometry(0.012, 0.022, 0.5, 5), am); beam.position.set(s * 0.1, 0.22, -0.08); beam.rotation.set(-0.45, 0, -s * 0.5); ant.add(beam);
      for (let t2 = 0; t2 < 3; t2++) { const tine = new T.Mesh(new T.CylinderGeometry(0.006, 0.012, 0.18, 4), am); tine.position.set(s * (0.07 + t2 * 0.06), 0.15 + t2 * 0.1, -0.02 - t2 * 0.06); tine.rotation.set(0.6, 0, -s * 0.2); ant.add(tine); } } }
  const g = R.g; g.userData = { R, body: R.body, neck: R.neck, head: R.head, tail: R.tail, legs: R.legs, ph: Math.random() * 6, last: 0 }; return g;
}
function gait(m, speed, t, turnHead = 0, more) { const u = m.userData, R = u.R, now = performance.now() / 1000, dt = Math.min(0.05, Math.max(0, now - (u.last || now))); u.last = now;
  const sp = Math.abs(speed), ga = sp < 0.3 ? 0 : sp < 5 ? 1 : 2, freq = ga === 2 ? clamp(sp / (R.S.stride * 2.1 * R.S.sz), 1.6, 3.2) : ga === 1 ? clamp(sp / (R.S.stride * 0.9 * R.S.sz), 0.6, 1.8) : 0;
  u.ph += dt * freq * Math.PI * 2; quadPose(R, { t, ph: u.ph, gait: ga, amt: ga === 2 ? clamp(sp / 9, 0.6, 1) : 1, yaw: turnHead, neck: ga === 2 ? 0.15 : null, tail: ga === 2 ? 0.45 : 0.1, ear: 0.2, ...(more || {}) }, dt || 1 / 60); }
function buildWorld() {
  if (V3) return V3; const T = THREE; if (!W3 || !W3.init({ canvas: $('gl'), fov: 60, far: 4000, near: 0.1 })) { V3 = { none: true }; return V3; }
  const S = W3.scene;
  const land = W3.terrain({ size: 2400, seg: 200, x: 0, z: 600, height: snowH, colour: (x, z, h, sl) => sl > 0.4 ? [0.62, 0.64, 0.68] : [0.9 + h * 0.005, 0.92 + h * 0.005, 0.96], map: W3.grainTex(256, 4, 230, 18, 10) });
  if (land.material.map) land.material.map.repeat.set(80, 80); land.material.roughness = 0.75;
  const R0 = W3.rng(6), list = [];
  for (let i = 0; i < 520; i++) { const x = (R0() - 0.5) * 600, z = -100 + R0() * 900; if (Math.abs(x) < 70 && z < 300) continue; list.push({ x, z, y: snowH(x, z), s: 0.8 + R0() * 1.2, hue: R0(), shade: R0() * 0.4 }); }
  for (let i = 0; i < 220; i++) { const x = (R0() - 0.5) * 500, z = 330 + R0() * 120; list.push({ x, z, y: snowH(x, z), s: 1 + R0() * 1.3, hue: R0(), shade: R0() * 0.4 }); }
  W3.pines(list, { layers: 5, shadow: true });
  const me = quad(T, 'wolf', 0x8a8580), mates = [quad(T, 'wolf', 0x6a6560), quad(T, 'wolf', 0xa8a29a)], prey = quad(T, 'elk', 0x8a6040), herd = []; for (let i = 0; i < 6; i++) herd.push(quad(T, 'elk', [0x7a5838, 0x9a7048, 0x6a4a30][i % 3]));
  S.add(me, prey, ...mates, ...herd);
  const ring = new T.Mesh(new T.RingGeometry(1.6, 1.9, 40), new T.MeshBasicMaterial({ color: 0xff5a3a, transparent: true, opacity: 0.8, side: T.DoubleSide, depthWrite: false })); ring.rotation.x = -Math.PI / 2; S.add(ring);
  const NP = 80, pG = new T.BufferGeometry(); pG.setAttribute('position', new T.BufferAttribute(new Float32Array(NP * 3), 3)); const spray = new T.Points(pG, new T.PointsMaterial({ color: 0xffffff, size: 0.18, transparent: true, opacity: 0.85, depthWrite: false })); spray.frustumCulled = false; S.add(spray);
  V3 = { T, S, me, mates, prey, herd, ring, spray, P: Array.from({ length: NP }, () => ({ t: 9, life: 1, x: 0, y: -99, z: 0, vx: 0, vy: 0, vz: 0 })), cam: { x: 0, y: 3, z: -6 } };
  W3.setQuality(stepN); return V3;
}
function setWeather(G) {
  const V = buildWorld(); if (V.none || V.sky === G.weather) return; V.sky = G.weather;
  W3.setSky(G.weather, { azim: 30 });
  W3.S.onBolt = () => { if (!HEADLESS && sfx.thunder) setTimeout(() => sfx.thunder(), 300 + Math.random() * 900); };
}
function onEvent(G, e) {
  const cx = W / 2, cy = H * 0.3;
  switch (e.k) {
    case 'bolt': sfx.hooves(); sfx.howl(); say('THE HERD RUNS!', cx, cy, '#fff', 22); break;
    case 'tell': if (!HEADLESS) sfx.snort(); break;
    case 'jink': break;
    case 'flank': sfx.yip(); say(e.side < 0 ? '◀ FLANK LEFT' : 'FLANK RIGHT ▶', cx, cy + 30 * k, '#cfe6ff', 18); break;
    case 'wide': sfx.snap(); say('MISSED!', W / 2, H * 0.3, '#ffd0c4', 22); tip('wide', 'Tap BITE when you are beside her', 2.4); break;
    case 'short': sfx.snap(); say('TOO FAR!', cx, cy, '#ffd0c4', 22); tip('far', 'Get close and beside her first, then BITE', 2.6); break;
    case 'slip': sfx.snap(); say('FROM THE SIDE!', cx, cy, '#ffd0c4', 22); tip('side', 'Strike from beside her, not from straight behind', 2.6); break;
    case 'kicked': sfx.kick(); FX.red = 0.6; FX.shake = 14; vibe(HAP.thud); say('KICKED!', cx, cy, '#ffb4a8', 28); tip('kick', 'Behind her you get kicked: come up alongside', 3); break;
    case 'caught': { const w = G.wolf, p = G.prey; ui.kill = { x: w.x, z: w.z, h: w.h, side: Math.sign(Math.cos(p.h) * (w.x - p.x) - Math.sin(p.h) * (w.z - p.z)) || 1 }; }
      sfx.caught(e.n); FX.shake = 10; FX.flash = 0.5; vibe(HAP.best); say('BROUGHT DOWN!', cx, cy, '#ffe08a', 28); break;
    case 'gone': ui.kill = null; if (e.why !== 'kicked') { sfx.lose1(); say(e.why === 'trees' ? 'SHE REACHED THE TREES' : 'SHE GOT AWAY', cx, cy, '#ffd0c4', 22); } break;
    case 'lessonnext': if (e.first) hint = null; say(e.first ? 'FIRST, A LESSON' : 'NEXT LESSON', cx, H * 0.5, '#ffd36a', 26); sfx.ding(); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, cx, H * 0.5, '#9be3b5', 26); sfx.coin(e.n); break;
    case 'lessonmiss': coachMiss(); break;
    case 'lessondone': say('YOU LEAD THE PACK!', cx, H * 0.5, '#ffd36a', 26); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); vibe(HAP.best); break;
    case 'lost': sfx.lose(); break;
  }
}
const VW = new (window.THREE ? THREE.Vector3 : Object)();
function wScreen(x, y, z) { W3.cam.updateMatrixWorld(); VW.set(x, y, z); return W3.screen(VW); }
function place(m, o, sp, t, turn) { m.position.set(o.x, snowH(o.x, o.z), o.z); m.rotation.y = o.h; gait(m, sp, t, turn || 0); }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#0e141c'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D snow.', W / 2, H / 2); return; }
  const g = G || idleG(), t = now; setWeather(g); const w = g.wolf, p = g.prey, down = g.ph === 'down';
  place(V.me, w, down ? 0 : w.v, t); if (w.lunge > 0) { V.me.userData.body.rotation.x = -0.3; V.me.position.y += 0.4 * Math.sin((0.5 - w.lunge) * TAU); }
  g.pack.forEach((q, i) => place(V.mates[i], q, down ? 0 : 11, t));
  place(V.prey, p, down ? 0 : p.v, t, p.tell > 0 ? Math.sign(p.turnTo) * 0.6 : 0); V.prey.rotation.z = 0;
  // his review (23 Nov 2026): "Animate the wolf pouncing on the animal, grabbing its neck or other parts of the animal's body". The lead wolf
  // springs from where it struck onto her neck and hangs on, its front paws on her shoulder, while she goes down away from it; two of the
  // pack come in behind and take her hind legs.
  const K = ui.kill; if (down && K && G && g === G && g.gap > 0) { const u = 2.6 - g.gap, fx = Math.sin(p.h), fz = Math.cos(p.h), sx = Math.cos(p.h) * K.side, sz = -Math.sin(p.h) * K.side, gy = snowH(p.x, p.z);
    const nx = p.x + fx * 1.15 + sx * (0.55 + 0.35 * clamp((2.6 - g.gap - 0.5) / 0.9, 0, 1)), nz = p.z + fz * 1.15 + sz * (0.55 + 0.35 * clamp((2.6 - g.gap - 0.5) / 0.9, 0, 1)), leap = clamp(u / 0.42, 0, 1), fall = clamp((u - 0.5) / 0.9, 0, 1), e2 = leap * leap * (3 - 2 * leap);
    const wx = K.x + (nx - K.x) * e2, wz = K.z + (nz - K.z) * e2, hy = Math.sin(leap * Math.PI) * 1.1 + leap * 1.25 * (1 - fall);
    V.me.position.set(wx, gy + hy, wz); V.me.rotation.set(0, Math.atan2(p.x + fx * 1.25 - wx, p.z + fz * 1.25 - wz), 0); gait(V.me, 0, t, 0, { pitch: leap < 1 ? 0.4 : 0.75 * (1 - fall) - 0.25 * fall, neck: 0.1 - 0.5 * fall, crouch: fall * 0.6 });
    const bd = V.me.userData.body; if (bd) bd.rotation.x = leap < 1 ? -0.5 + leap * 0.2 : -0.75 * (1 - fall) + 0.25 * fall + Math.sin(t * 18) * 0.06;      /* then down at her throat, shaking */      /* reared up, jaws on her neck, shaking */
    gait(V.prey, 0, t, -K.side * 0.5 * leap, { fall, side: -K.side, neck: 0.2 });      /* she goes down on her side, away from the wolf */
    g.pack.forEach((q, i) => { if (!V.mates[i] || i > 1) return; const s2 = i ? -1 : 1, r2 = clamp((u - 0.25 - i * 0.15) / 0.6, 0, 1), hx = p.x - fx * 1.0 + sx * 0.5 * s2, hz = p.z - fz * 1.0 + sz * 0.5 * s2, m = V.mates[i];
      m.position.set(q.x + (hx - q.x) * r2, snowH(hx, hz) + Math.sin(r2 * Math.PI) * 0.6, q.z + (hz - q.z) * r2); m.rotation.set(0, Math.atan2(p.x - fx * 1.2 - m.position.x, p.z - fz * 1.2 - m.position.z), 0); if (m.userData.body) m.userData.body.rotation.x = r2 >= 1 ? -0.35 + Math.sin(t * 16 + i) * 0.05 : -0.3; }); }
  else if (down && g.caught && g.gap > 0) { V.prey.rotation.z = Math.min(1.4, (2.6 - g.gap) * 2); V.prey.position.y -= 0.3; }
  g.herd.forEach((h, i) => place(V.herd[i], h, h.v, t));
  V.ring.position.set(p.x, snowH(p.x, p.z) + 0.08, p.z); V.ring.material.opacity = 0.5 + Math.sin(t * 6) * 0.3; V.ring.visible = !down;
  // snow from the paws on a burst
  if (w.bursting && Math.random() < 0.9) { for (const q of V.P) if (q.t >= q.life) { Object.assign(q, { t: 0, life: 0.5 + Math.random() * 0.4, x: w.x + (Math.random() - 0.5) * 0.6, y: snowH(w.x, w.z) + 0.1, z: w.z - 0.3, vx: (Math.random() - 0.5) * 2, vy: 1.5 + Math.random() * 2, vz: -Math.cos(w.h) * 3 }); break; } }
  const pa = V.spray.geometry.attributes.position; V.P.forEach((q, i) => { if (q.t < q.life) { q.t += dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; q.vy -= 6 * dt; } pa.setXYZ(i, q.x, q.t < q.life ? q.y : -99, q.z); }); pa.needsUpdate = true;
  // the camera: low behind the lead wolf, looking up the line towards her
  const C = V.cam, look = Math.atan2(p.x - w.x, p.z - w.z) * 0.35 + w.h * 0.65, cx = w.x - Math.sin(look) * 3.9, cz = w.z - Math.cos(look) * 3.9, cy = snowH(cx, cz) + 1.6, e = 1 - Math.exp(-dt * 4);
  if (!(ui.kill && down && G && g === G && g.gap > 0)) { C.x += (cx - C.x) * e; C.y += (cy - C.y) * e; C.z += (cz - C.z) * e; }
  const KC = ui.kill && down && G && g === G && g.gap > 0;      // the kill: the camera swings round to watch it from the side, close
  if (KC) { const fx = Math.sin(p.h), fz = Math.cos(p.h), sx = Math.cos(p.h) * ui.kill.side, sz = -Math.sin(p.h) * ui.kill.side, tx = p.x + fx * 0.3 + sx * 6.8 - fx * 2.2, tz = p.z + fz * 0.3 + sz * 6.8 - fz * 2.2, e3 = 1 - Math.exp(-dt * 3);
    C.x += (tx - C.x) * e3; C.z += (tz - C.z) * e3; C.y += (snowH(tx, tz) + 1.5 - C.y) * e3; }
  const cam = W3.cam; cam.position.set(C.x, C.y + (w.bursting ? Math.sin(t * 30) * 0.03 : 0), C.z); if (KC) cam.lookAt(p.x + Math.sin(p.h) * 0.4, snowH(p.x, p.z) + 0.9, p.z + Math.cos(p.h) * 0.4); else cam.lookAt(w.x + Math.sin(look) * 9, snowH(w.x, w.z) + 0.9, w.z + Math.cos(look) * 9);
  if (FX.shake > 0) cam.rotation.z += (Math.random() - 0.5) * FX.shake * 0.002;
  W3.setFocus(w.x, 0, w.z + 10, 40);
  W3.render(dt);
  if (G) hud(G, t);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 0.9 ? 1 : 1 - (t2.t - 0.9) / 0.4; ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(t2.size * k)}px ${BC}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 22); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 22); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(15 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 19 * k, h = lines.length * lh + 16 * k, w2 = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30;
    ctx.fillStyle = 'rgba(0,0,0,.66)'; rrect(W / 2 - w2 / 2, H * 0.45 - h / 2, w2, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.45 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,60,40,${FX.red * 0.18})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); }
}
let IG = null; function idleG() { if (!IG || IG.over || (IG.ph === 'down' && IG.gap < 0.2)) { IG = newGame(4, { seed: (Math.random() * 1e6) | 0 }); IG.mem = {}; } honest(IG, { react: 0.2, acc: 0.95 }, IG.mem); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function biteBtn() { return { x: W - 62 * k, y: H - 132 * k, r: 42 * k }; }
function flankRects() { const w = 96 * k, h = 46 * k, y = H - h - 20 * k; return { L: { x: 12, y, w, h }, R: { x: W - 12 - w, y, w, h } }; }
function hud(G, t) {
  const c = G.cfg, w = G.wolf, p = G.prey;
  if (G.lesson) lessonPanel(G);
  const ty = G.lesson ? H * 0.25 : 44 * k;
  if (!G.lesson) { ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; ctx.fillStyle = '#fff'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.5)'; const s = `HUNT ${Math.min(G.caught + 1, c.hunts)} OF ${c.hunts}`; ctx.strokeText(s, 16, ty); ctx.fillText(s, 16, ty);
    for (let i = 0; i < c.lives; i++) { ctx.beginPath(); ctx.arc(W - 22 - i * 16 * k, ty + 8 * k, 5 * k, 0, TAU); ctx.fillStyle = i < G.lives ? '#d8d0c0' : 'rgba(255,255,255,.25)'; ctx.fill(); } }
  if (G.ph !== 'chase') return;
  // how far to the trees, your wind, how close she is
  const bx = 16, bw = W - 32, by = ty + 26 * k; ctx.fillStyle = 'rgba(0,0,0,.4)'; rrect(bx, by, bw, 6 * k, 3); ctx.fill(); ctx.fillStyle = '#2a4a2a'; ctx.fillRect(bx + bw - 6, by - 3, 6, 12 * k); ctx.fillStyle = '#ff7a5a'; rrect(bx, by, bw * clamp(p.z / (c.trees * (G.lesson ? 1.3 : 1)), 0, 1), 6 * k, 3); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.textAlign = 'right'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.strokeText('THE TREES', bx + bw, by + 10 * k); ctx.fillText('THE TREES', bx + bw, by + 10 * k);
  const sw = W * 0.4; ctx.textAlign = 'left'; ctx.strokeText('YOUR WIND', bx, by + 18 * k); ctx.fillText('YOUR WIND', bx, by + 18 * k); ctx.fillStyle = 'rgba(0,0,0,.4)'; rrect(bx, by + 30 * k, sw, 7 * k, 3); ctx.fill(); ctx.fillStyle = w.stam < 1 ? '#ff9a6a' : '#9be3ff'; rrect(bx, by + 30 * k, sw * w.stam / c.stam, 7 * k, 3); ctx.fill();
  const ps = wScreen(p.x, snowH(p.x, p.z) + 2.6, p.z), d = Math.hypot(p.x - w.x, p.z - w.z);
  if (ps.front) { let ang = Math.atan2(-(p.x - w.x), -(p.z - w.z)) - (p.h + Math.PI); while (ang > Math.PI) ang -= TAU; while (ang < -Math.PI) ang += TAU; ang = Math.abs(ang); const ready = d < c.strike && ang > c.side[0] && ang < c.side[1];
    ctx.textAlign = 'center'; ctx.font = `700 ${Math.round(ready ? 18 : 12 * 1) * k}px ${BC}`; ctx.fillStyle = ready ? '#ffe08a' : d < c.strike ? '#ff9a7a' : '#fff'; ctx.strokeStyle = 'rgba(0,0,0,.6)'; const s = ready ? 'STRIKE!' : d < c.strike ? 'GET BESIDE HER' : `${Math.round(d)} m`; ctx.strokeText(s, ps.x, ps.y); ctx.fillText(s, ps.x, ps.y);
    if (p.tell > 0) { ctx.fillStyle = '#ffd36a'; ctx.font = `800 ${Math.round(22 * k)}px ${BC}`; ctx.fillText(p.turnTo > 0 === (Math.cos(w.h - p.h) > 0) ? '↰' : '↱', ps.x, ps.y - 26 * k); } }
  // flank buttons and the thumb
  if (G.ph === 'chase' && G.prey) { const B = biteBtn(), w = G.wolf, near = Math.hypot(G.prey.x - w.x, G.prey.z - w.z) <= G.cfg.strike; ctx.globalAlpha = near ? 1 : 0.45; ctx.fillStyle = near ? 'rgba(210,50,40,.95)' : 'rgba(20,30,40,.7)'; ctx.beginPath(); ctx.arc(B.x, B.y, B.r, 0, TAU); ctx.fill(); ctx.strokeStyle = near ? '#ffe060' : '#cfe6ff'; ctx.lineWidth = near ? 4 + 2 * Math.sin(t * 9) : 2; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `700 ${Math.round(18 * k)}px ${BC}`; ctx.fillText('BITE', B.x, B.y); ctx.globalAlpha = 1; }
  const fr = flankRects(), ready = G.flankCD <= 0;
  for (const [s, r] of [['L', fr.L], ['R', fr.R]]) { ctx.globalAlpha = ready ? 0.9 : 0.4; ctx.fillStyle = 'rgba(20,30,40,.7)'; rrect(r.x, r.y, r.w, r.h, 14 * k); ctx.fill(); ctx.strokeStyle = '#cfe6ff'; ctx.lineWidth = 2; rrect(r.x, r.y, r.w, r.h, 14 * k); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s === 'L' ? '◀ FLANK' : 'FLANK ▶', r.x + r.w / 2, r.y + r.h / 2); }
  ctx.globalAlpha = 1; if (ui.drag) { const d2 = ui.drag; ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(d2.x0, d2.y0, 40 * k, 0, TAU); ctx.stroke(); ctx.fillStyle = G.in.burst ? '#9be3ff' : 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(d2.x0 + clamp(d2.x - d2.x0, -40 * k, 40 * k), d2.y0 + clamp(d2.y - d2.y0, -40 * k, 40 * k), 14 * k, 0, TAU); ctx.fill(); }
}
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { coachPanel(G); }
