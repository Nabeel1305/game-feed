// ===================== THE VIEW: Wolf Pack in 3D (three.js through tools/world3d.js) =====================
// Open snow between dark pines, hills behind, the level's light (a golden dusk, a grey morning, falling snow, night). The camera
// runs low behind you, the lead wolf, with your two packmates either side. Ahead, the herd of elk scatters; yours is marked
// with a ring. Her head turns before she swerves. Snow sprays from your paws on a burst.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [];
let hint = null, V3 = null;
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 6) TXT.shift(); }
function tip(key, txt, secs = 2.8) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function fxStep(dt) {
  FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 1.8);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.3) TXT.shift();
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; }
}
const ui = { drag: null };
function snowH(x, z) { return Math.sin(x * 0.02) * 1.5 + Math.cos(z * 0.013) * 2 + Math.sin((x - z) * 0.007) * 3; }
// a four-legged animal from smooth shapes: kind 'wolf' or 'elk'
function quad(T, kind, col) {
  const g = new T.Group(), E = kind === 'elk', L = E ? 2.1 : 1.15, leg = E ? 1.25 : 0.62, ry = E ? 0.48 : 0.24, rz = E ? 0.4 : 0.2;
  const fur = new T.MeshStandardMaterial({ color: col, roughness: 0.9, map: W3.grainTex(128, E ? 3 : 8, 200, 45, 3) }), dark = new T.MeshStandardMaterial({ color: E ? 0x3a2a1c : 0x2a2a2c, roughness: 0.85 }), pale = new T.MeshStandardMaterial({ color: E ? 0xd8c8a8 : 0xd8d4cc, roughness: 0.9 });
  const blob = (sx, sy, sz, m, x, y, z, par = g) => { const s = new T.Mesh(new T.SphereGeometry(1, 20, 14), m); s.scale.set(sx, sy, sz); s.position.set(x, y, z); s.castShadow = true; par.add(s); return s; };
  const body = new T.Group(); g.add(body); const by = leg + ry * 0.8;
  blob(rz, ry, L * 0.5, fur, 0, by, 0, body); blob(rz * 1.02, ry * 1.08, L * 0.24, fur, 0, by + 0.04, L * 0.25, body); if (E) blob(rz * 0.9, ry * 0.6, L * 0.4, pale, 0, by - ry * 0.4, 0, body); else blob(rz * 0.85, ry * 0.55, L * 0.38, pale, 0, by - ry * 0.45, 0.05, body);
  const neck = new T.Group(); neck.position.set(0, by + ry * 0.3, L * 0.42); body.add(neck); blob(rz * 0.6, ry * 0.8, ry * 0.9, E ? dark : fur, 0, ry * 0.5, ry * 0.4, neck);
  const head = new T.Group(); head.position.set(0, ry * (E ? 1.5 : 0.9), ry * (E ? 0.9 : 1.1)); neck.add(head); blob(rz * 0.55, rz * 0.55, rz * 0.8, fur, 0, 0, 0, head); blob(rz * 0.3, rz * 0.3, rz * (E ? 0.9 : 0.75), E ? dark : pale, 0, -rz * 0.15, rz * 0.8, head);
  blob(rz * 0.1, rz * 0.1, rz * 0.1, new T.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.2 }), 0, -rz * 0.05, rz * 1.55, head);
  for (const s of [-1, 1]) { const ear = new T.Mesh(new T.ConeGeometry(rz * 0.18, rz * 0.5, 6), E ? fur : dark); ear.position.set(s * rz * 0.35, rz * 0.5, -rz * 0.1); ear.rotation.z = -s * 0.3; head.add(ear);
    const eye = blob(rz * 0.07, rz * 0.07, rz * 0.05, new T.MeshStandardMaterial({ color: E ? 0x110a05 : 0xd8a830, roughness: 0.1, emissive: E ? 0 : 0x302000 }), s * rz * 0.33, rz * 0.12, rz * 0.45, head);
    if (E) { const ant = new T.Group(); ant.position.set(s * rz * 0.25, rz * 0.5, 0); head.add(ant); const beam = new T.Mesh(new T.CylinderGeometry(0.03, 0.05, 1.1, 5), pale); beam.position.set(s * 0.25, 0.45, -0.2); beam.rotation.set(-0.5, 0, -s * 0.6); ant.add(beam); for (let t = 0; t < 3; t++) { const tine = new T.Mesh(new T.CylinderGeometry(0.015, 0.03, 0.45, 4), pale); tine.position.set(s * (0.15 + t * 0.15), 0.4 + t * 0.25, -0.05 - t * 0.15); tine.rotation.set(0.6, 0, -s * 0.2); ant.add(tine); } } }
  const legs = []; for (const [lx, lz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) { const lg = new T.Group(); lg.position.set(lx * rz * 0.55, by - ry * 0.3, lz * L * 0.36); body.add(lg); const up = new T.Mesh(new T.CylinderGeometry(rz * 0.28, rz * 0.2, leg * 0.55, 8), fur); up.position.y = -leg * 0.27; lg.add(up); const lo = new T.Mesh(new T.CylinderGeometry(rz * 0.16, rz * 0.13, leg * 0.55, 8), E ? dark : fur); lo.position.y = -leg * 0.78; lg.add(lo); const ft = blob(rz * 0.18, rz * 0.1, rz * 0.26, dark, 0, -leg + 0.25 + rz * 0.05, rz * 0.06, lg); ft.position.y = -leg * 1.03 + (by - ry * 0.3 - leg) * 0; legs.push(lg); }
  const tail = new T.Group(); tail.position.set(0, by + ry * 0.4, -L * 0.48); body.add(tail); const tm = new T.Mesh(new T.CylinderGeometry(E ? 0.06 : 0.09, E ? 0.03 : 0.05, E ? 0.25 : 0.55, 8), E ? pale : fur); tm.position.set(0, -0.12, -0.18); tm.rotation.x = -0.9; tail.add(tm);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); g.userData = { legs, body, neck, head, tail, leg, ph: Math.random() * 6 };
  return g;
}
function gait(m, speed, t, turnHead = 0) { const u = m.userData, f = speed * 0.9; u.ph += f * 0.016 * 6; u.legs.forEach((lg, i) => lg.rotation.x = Math.sin(u.ph + [0, 0.4, Math.PI, Math.PI + 0.4][i]) * Math.min(0.9, speed * 0.07)); u.body.position.y = Math.abs(Math.sin(u.ph)) * Math.min(0.12, speed * 0.008); u.body.rotation.x = Math.sin(u.ph * 2) * 0.03; u.neck.rotation.y = turnHead; u.tail.rotation.y = Math.sin(t * 3) * 0.2; }
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
    case 'wide': sfx.snap(); say('FLICK AT HER!', W / 2, H * 0.3, '#ffd0c4', 22); tip('wide', 'Flick towards her, not away', 2.4); break;
    case 'short': sfx.snap(); say('TOO FAR!', cx, cy, '#ffd0c4', 22); tip('far', 'Get close and beside her first, then flick', 2.6); break;
    case 'slip': sfx.snap(); say('FROM THE SIDE!', cx, cy, '#ffd0c4', 22); tip('side', 'Strike from beside her, not from straight behind', 2.6); break;
    case 'kicked': sfx.kick(); FX.red = 0.6; FX.shake = 14; vibe(HAP.thud); say('KICKED!', cx, cy, '#ffb4a8', 28); tip('kick', 'Behind her you get kicked: come up alongside', 3); break;
    case 'caught': sfx.caught(e.n); FX.shake = 10; FX.flash = 0.5; vibe(HAP.best); say('BROUGHT DOWN!', cx, cy, '#ffe08a', 28); break;
    case 'gone': if (e.why !== 'kicked') { sfx.lose1(); say(e.why === 'trees' ? 'SHE REACHED THE TREES' : 'SHE GOT AWAY', cx, cy, '#ffd0c4', 22); } break;
    case 'lessonnext': if (e.first) hint = null; say(e.first ? 'FIRST, A LESSON' : 'NEXT LESSON', cx, H * 0.5, '#ffd36a', 26); sfx.ding(); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, cx, H * 0.5, '#9be3b5', 26); sfx.coin(e.n); break;
    case 'lessonmiss': hint = { txt: e.how, t: 0, secs: 3.6 }; break;
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
  place(V.prey, p, down ? 0 : p.v, t, p.tell > 0 ? Math.sign(p.turnTo) * 0.6 : 0); if (down && g.caught && g.gap > 0) { V.prey.rotation.z = Math.min(1.4, (2.6 - g.gap) * 2); V.prey.position.y -= 0.3; } else V.prey.rotation.z = 0;
  g.herd.forEach((h, i) => place(V.herd[i], h, h.v, t));
  V.ring.position.set(p.x, snowH(p.x, p.z) + 0.08, p.z); V.ring.material.opacity = 0.5 + Math.sin(t * 6) * 0.3; V.ring.visible = !down;
  // snow from the paws on a burst
  if (w.bursting && Math.random() < 0.9) { for (const q of V.P) if (q.t >= q.life) { Object.assign(q, { t: 0, life: 0.5 + Math.random() * 0.4, x: w.x + (Math.random() - 0.5) * 0.6, y: snowH(w.x, w.z) + 0.1, z: w.z - 0.3, vx: (Math.random() - 0.5) * 2, vy: 1.5 + Math.random() * 2, vz: -Math.cos(w.h) * 3 }); break; } }
  const pa = V.spray.geometry.attributes.position; V.P.forEach((q, i) => { if (q.t < q.life) { q.t += dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; q.vy -= 6 * dt; } pa.setXYZ(i, q.x, q.t < q.life ? q.y : -99, q.z); }); pa.needsUpdate = true;
  // the camera: low behind the lead wolf, looking up the line towards her
  const C = V.cam, look = Math.atan2(p.x - w.x, p.z - w.z) * 0.35 + w.h * 0.65, cx = w.x - Math.sin(look) * 3.9, cz = w.z - Math.cos(look) * 3.9, cy = snowH(cx, cz) + 1.6, e = 1 - Math.exp(-dt * 4);
  C.x += (cx - C.x) * e; C.y += (cy - C.y) * e; C.z += (cz - C.z) * e;
  const cam = W3.cam; cam.position.set(C.x, C.y + (w.bursting ? Math.sin(t * 30) * 0.03 : 0), C.z); cam.lookAt(w.x + Math.sin(look) * 9, snowH(w.x, w.z) + 0.9, w.z + Math.cos(look) * 9);
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
  const fr = flankRects(), ready = G.flankCD <= 0;
  for (const [s, r] of [['L', fr.L], ['R', fr.R]]) { ctx.globalAlpha = ready ? 0.9 : 0.4; ctx.fillStyle = 'rgba(20,30,40,.7)'; rrect(r.x, r.y, r.w, r.h, 14 * k); ctx.fill(); ctx.strokeStyle = '#cfe6ff'; ctx.lineWidth = 2; rrect(r.x, r.y, r.w, r.h, 14 * k); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s === 'L' ? '◀ FLANK' : 'FLANK ▶', r.x + r.w / 2, r.y + r.h / 2); }
  ctx.globalAlpha = 1; if (ui.drag) { const d2 = ui.drag; ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(d2.x0, d2.y0, 40 * k, 0, TAU); ctx.stroke(); ctx.fillStyle = G.in.burst ? '#9be3ff' : 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(d2.x0 + clamp(d2.x - d2.x0, -40 * k, 40 * k), d2.y0 + clamp(d2.y - d2.y0, -40 * k, 40 * k), 14 * k, 0, TAU); ctx.fill(); }
}
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) {
  const D = G.lesson, st = D.steps[D.i], x = 14, w = W - 28, y = 42 * k; ctx.save();
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; const lines = wrapText(st.how, w - 24), h = 54 * k + lines.length * 17 * k;
  ctx.fillStyle = 'rgba(0,0,0,.62)'; rrect(x, y, w, h, 12); ctx.fill(); ctx.strokeStyle = 'rgba(255,211,106,.7)'; ctx.lineWidth = 2; rrect(x, y, w, h, 12); ctx.stroke();
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#ffd36a'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillText(`LESSON ${D.i + 1} OF ${D.steps.length}`, x + 12, y + 10 * k);
  ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(18 * k)}px ${BC}`; ctx.fillText(st.title, x + 12, y + 25 * k);
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.9)'; lines.forEach((l, i) => ctx.fillText(l, x + 12, y + 48 * k + i * 17 * k));
  for (let i = 0; i < st.need; i++) { ctx.beginPath(); ctx.arc(x + w - 16 - (st.need - 1 - i) * 18 * k, y + 18 * k, 6 * k, 0, TAU); if (i < D.n) { ctx.fillStyle = '#8fe0ab'; ctx.fill(); } else { ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; ctx.stroke(); } }
  ctx.restore();
}
