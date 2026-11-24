// ===================== THE VIEW: Oarsmen in 3D (three.js through tools/world3d.js) =====================
// A river winding between green banks and trees (a willow reach, a rocky gorge, a canal, a lake), the level's sky on the water.
// The camera follows just behind and above your boat: the rower leans into each stroke and the two oars sweep, splashing. Rival
// boats pull alongside. Rocks and floating logs in the water; the finish line's red buoys and banner ahead.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [];
let hint = null, V3 = null;
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 6) TXT.shift(); }
function tip(key, txt, secs = 2.8) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 1.8);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.3) TXT.shift(); if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; } }
const ui = { taps: {} };
function boat(T, col) { const g = new T.Group(), hullM = new T.MeshStandardMaterial({ color: col, roughness: 0.4, metalness: 0.1 });
  const hull = new T.Mesh(new T.SphereGeometry(1, 16, 8), hullM); hull.scale.set(0.42, 0.22, 3.2); hull.position.y = 0.05; hull.castShadow = true; g.add(hull);
  const deck = new T.Mesh(new T.BoxGeometry(0.5, 0.05, 2.2), new T.MeshStandardMaterial({ color: 0xd8c8a0 })); deck.position.y = 0.2; g.add(deck);
  const body = new T.Group(); body.position.y = 0.25; g.add(body); const shirt = new T.Mesh(new T.CylinderGeometry(0.17, 0.2, 0.6, 10), new T.MeshStandardMaterial({ color: 0xf4f4f8 })); shirt.position.y = 0.35; body.add(shirt);
  const head = new T.Mesh(new T.SphereGeometry(0.13, 12, 10), new T.MeshStandardMaterial({ color: 0xe8b890 })); head.position.y = 0.78; body.add(head); const cap = new T.Mesh(new T.SphereGeometry(0.14, 12, 8, 0, TAU, 0, Math.PI / 2), hullM); cap.position.y = 0.8; body.add(cap);
  const oars = []; for (const s of [-1, 1]) { const piv = new T.Group(); piv.position.set(s * 0.3, 0.45, 0.1); g.add(piv); const shaft = new T.Mesh(new T.CylinderGeometry(0.025, 0.025, 3, 6), new T.MeshStandardMaterial({ color: 0xe8e0c8 })); shaft.rotation.z = Math.PI / 2; shaft.position.x = s * 1.4; piv.add(shaft);
    const blade = new T.Mesh(new T.BoxGeometry(0.5, 0.03, 0.18), hullM); blade.position.x = s * 2.8; piv.add(blade); oars.push(piv); }
  g.userData = { body, oars }; g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g; }
function buildWorld(G) { const T = THREE; const key = G.N + ':' + G.len;
  if (!V3) { if (!W3 || !W3.init({ canvas: $('gl'), fov: 60, far: 3000, near: 0.1 })) { V3 = { none: true }; return V3; } V3 = { T, S: W3.scene, items: [], me: boat(T, 0x2a6ad8), rivals: [] }; V3.S.add(V3.me);
    const NP = 120, pG = new T.BufferGeometry(); pG.setAttribute('position', new T.BufferAttribute(new Float32Array(NP * 3), 3)); V3.spray = new T.Points(pG, new T.PointsMaterial({ color: 0xffffff, size: 0.14, transparent: true, opacity: 0.85, depthWrite: false })); V3.spray.frustumCulled = false; V3.S.add(V3.spray); V3.P = Array.from({ length: NP }, () => ({ t: 9, life: 1, x: 0, y: -99, z: 0, vx: 0, vy: 0, vz: 0 })); }
  const V = V3; if (V.none || V.key === key) return V; V.key = key; for (const o of V.items) V.S.remove(o); V.items = []; const add = o => { V.S.add(o); V.items.push(o); return o; };
  const L = G.len + 120, hfn = (x, z) => { const d = Math.abs(x - riverX(G, z)) - riverW(G, z) / 2; return d < 0 ? -1.4 : Math.min(9, d * 0.35) + Math.sin(x * 0.1 + z * 0.07) * 0.6 + (G.place === 1 ? Math.max(0, d - 4) * 0.8 : 0); };
  const land = add(W3.terrain({ size: Math.max(400, L + 200), seg: 220, x: 0, z: L / 2 - 40, height: hfn, colour: (x, z, h, sl) => h < -0.5 ? [0.45, 0.4, 0.3] : sl > 0.4 ? [0.45, 0.42, 0.38] : [0.3 + h * 0.01, 0.52, 0.22], map: W3.grainTex(256, 6, 210, 40, 10) })); if (land.material.map) land.material.map.repeat.set(40, 40);
  // the water: a ribbon down the river's course
  const N = Math.ceil(L / 4), pos = [], idx = []; for (let i = 0; i <= N; i++) { const z = -40 + i * 4, cx = riverX(G, z), w = riverW(G, z) / 2 + 3; pos.push(cx - w, -z, 0, cx + w, -z, 0); if (i < N) idx.push(i * 2, i * 2 + 2, i * 2 + 1, i * 2 + 1, i * 2 + 2, i * 2 + 3); }
  const wg = new T.BufferGeometry(); wg.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); wg.setIndex(idx); wg.computeVertexNormals(); const uv = []; for (let i = 0; i <= N; i++) uv.push(0, i / 4, 1, i / 4); wg.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  const water = W3.water({ geometry: wg, color: [0x0a3a4a, 0x0c3048, 0x0a3a38, 0x082a50][G.place], distort: 0.5, ripple: 2.2, speed: 0.6, y: -0.05 }); V.items.push(water);
  // trees along the banks
  const R0 = W3.rng(G.N + 3), trees = []; for (let i = 0; i < 360; i++) { const z = -30 + R0() * (L + 40), s = R0() < 0.5 ? -1 : 1, x = riverX(G, z) + s * (riverW(G, z) / 2 + 4 + R0() * 50); trees.push({ x, z, y: hfn(x, z), s: 0.9 + R0() * 1.3, hue: R0(), shade: R0() * 0.4 }); }
  const pm = W3.pines(trees, { layers: 4, shadow: true }); V.items.push(pm);
  // rocks and logs
  const rockM = new T.MeshStandardMaterial({ color: 0x7a746a, roughness: 0.95, flatShading: true }), logM = new T.MeshStandardMaterial({ color: 0x6a4a2a, roughness: 0.9 });
  for (const ob of G.obs) { if (ob.k === 'rock') { const m = add(new T.Mesh(new T.DodecahedronGeometry(ob.r, 0), rockM)); m.position.set(ob.x, -0.4, ob.z); m.scale.y = 0.7; m.castShadow = true; } else { const m = add(new T.Mesh(new T.CylinderGeometry(0.35, 0.35, ob.r * 2, 10), logM)); m.rotation.z = Math.PI / 2; m.position.set(ob.x, 0.05, ob.z); } }
  // the finish: buoys and a banner
  const fz = G.len, fx = riverX(G, fz), fw = riverW(G, fz) / 2; for (let x = -fw; x <= fw; x += 2) { const b = add(new T.Mesh(new T.SphereGeometry(0.3, 10, 8), new T.MeshStandardMaterial({ color: 0xe83a2a }))); b.position.set(fx + x, 0.1, fz); }
  for (const s of [-1, 1]) { const p = add(new T.Mesh(new T.CylinderGeometry(0.15, 0.15, 7, 8), new T.MeshStandardMaterial({ color: 0xffffff }))); p.position.set(fx + s * (fw + 1), 2.5, fz); } const ban = add(new T.Mesh(new T.BoxGeometry(fw * 2 + 2, 1, 0.1), new T.MeshStandardMaterial({ color: 0xe8c23a }))); ban.position.set(fx, 5.5, fz);
  for (const r of V.rivals) V.S.remove(r); V.rivals = G.boats.map((b, i) => { const m = boat(T, [0xd83a2a, 0x2aa84a, 0xe8a82a][i % 3]); V.S.add(m); return m; });
  W3.setQuality(stepN); return V; }
function setWeather(G) { const V = V3; if (!V || V.none || V.sky === G.weather) return; V.sky = G.weather; W3.setSky(G.weather, { azim: 160 }); W3.S.onBolt = () => { if (!HEADLESS && sfx.thunder) setTimeout(() => sfx.thunder(), 300 + Math.random() * 900); }; }
const VW = new (window.THREE ? THREE.Vector3 : Object)();
function wScreen(x, y, z) { W3.cam.updateMatrixWorld(); VW.set(x, y, z); return W3.screen(VW); }
function splash(V, x, z, n) { for (let i = 0; i < n; i++) for (const q of V.P) if (q.t >= q.life) { Object.assign(q, { t: 0, life: 0.4 + Math.random() * 0.4, x: x + (Math.random() - 0.5) * 0.6, y: 0.1, z: z + (Math.random() - 0.5) * 0.6, vx: (Math.random() - 0.5) * 2, vy: 1.5 + Math.random() * 2, vz: -1 - Math.random() * 2 }); break; } }
function onEvent(G, e) { const cx = W / 2, cy = H * 0.3, V = V3 && !V3.none ? V3 : null;
  switch (e.k) {
    case 'start': say(`${PLACES[G.place].name.toUpperCase()} · ${G.len} m`, cx, cy, '#fff', 18); say('ROW!', cx, cy + 34 * k, '#3ac8e8', 30); sfx.gun(); break;
    case 'stroke': { sfx.stroke(e.kind, e.side); if (V) { const m = G.me, s = e.side === 0 ? 1 : -1; splash(V, m.x + Math.cos(m.h) * s * 2.8, m.z - Math.sin(m.h) * s * 2.8, e.kind === 'crab' ? 14 : 5); }
      if (e.kind === 'crab') { say('CRAB!', e.side === 0 ? W * 0.25 : W * 0.75, H * 0.6, '#ffb4a8', 20); tip('crab', 'Too soon! Wait for the ring to turn green.', 2.6); } break; }
    case 'sync': if (e.r >= 3 && Number.isInteger(e.r)) { say(`RHYTHM ${e.r}`, cx, H * 0.36, '#3ac8e8', 18 + e.r); sfx.sync(e.r); } break;
    case 'bank': case 'hit': sfx.bump(); FX.shake = 10; FX.red = 0.4; vibe(HAP.light); say(e.k === 'bank' ? 'THE BANK!' : e.what === 'log' ? 'A LOG!' : 'ROCK!', cx, cy, '#ffb4a8', 22); tip('steer', 'Steer with one oar: the LEFT oar turns you RIGHT, the right oar turns you left.', 3); break;
    case 'lessonnext': if (e.first) hint = null; say(e.first ? 'FIRST, A LESSON' : 'NEXT LESSON', cx, H * 0.5, '#ffd36a', 26); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, cx, H * 0.5, '#9be3b5', 22); break;
    case 'lessonmiss': coachMiss(); break;
    case 'lessondone': say('YOU CAN ROW!', cx, H * 0.5, '#ffd36a', 26); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); FX.flash = 0.6; vibe(HAP.best); say('FIRST!', cx, cy, '#ffe08a', 34); break;
    case 'lost': sfx.lose(); say(`${['', '1ST', '2ND', '3RD', '4TH'][e.place]} PLACE`, cx, cy, '#ffd0c4', 30); break;
  } }
function place(o, b, t, pull0, pull1) { o.position.set(b.x, Math.sin(t * 2 + b.z) * 0.04, b.z); o.rotation.y = b.h; const u = o.userData; u.body.rotation.x = -0.35 + Math.max(pull0, pull1) * 1.2; u.oars[0].rotation.y = -0.5 + pull0 * 2.4; u.oars[1].rotation.y = 0.5 - pull1 * 2.4; u.oars[0].rotation.z = pull0 > 0 ? -0.15 : 0.1; u.oars[1].rotation.z = pull1 > 0 ? 0.15 : -0.1; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round';
  const g = G || idleG(), V = buildWorld(g); if (V.none) { ctx.fillStyle = '#0c1a24'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D river.', W / 2, H / 2); return; }
  setWeather(g); const m = g.me, t = now;
  place(V.me, m, t, m.oars[0].pull / 0.35, m.oars[1].pull / 0.35); g.boats.forEach((b, i) => { const ph = (t * 1.35 + b.ph) % 1, p = ph < 0.35 ? 1 - ph / 0.35 : 0; if (V.rivals[i]) place(V.rivals[i], b, t, p, p); });
  const pa = V.spray.geometry.attributes.position; V.P.forEach((q, i) => { if (q.t < q.life) { q.t += dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; q.vy -= 9 * dt; } pa.setXYZ(i, q.x, q.t < q.life ? q.y : -99, q.z); }); pa.needsUpdate = true;
  const cam = W3.cam, back = 7.5, cx = m.x - Math.sin(m.h * 0.7) * back, cz = m.z - Math.cos(m.h * 0.7) * back; cam.position.set(cx, 5.2, cz); cam.lookAt(m.x + Math.sin(m.h) * 12, 0, m.z + Math.cos(m.h) * 12); if (FX.shake > 0) cam.rotation.z += (Math.random() - 0.5) * FX.shake * 0.003;
  W3.setFocus(m.x, 0, m.z + 12, 30); W3.render(dt);
  if (G) hud(G, t);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 0.9 ? 1 : 1 - (t2.t - 0.9) / 0.4; ctx.globalAlpha = Math.max(0, al); ctx.font = `${Math.round(t2.size * k)}px ${TF}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 22); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 22); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(15 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 19 * k, h = lines.length * lh + 16 * k, w2 = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30;
    ctx.fillStyle = 'rgba(0,0,0,.66)'; rrect(W / 2 - w2 / 2, H * 0.45 - h / 2, w2, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.45 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,60,40,${FX.red * 0.2})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); } }
let IG = null; function idleG() { if (!IG || IG.over) { IG = newGame(4, { seed: (Math.random() * 1e6) | 0 }); IG.mem = {}; } honest(IG, { react: 0.2, acc: 0.95 }, IG.mem); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function oarPads() { const r = 64 * k; return [{ x: W * 0.2, y: H - r - 26 * k, r }, { x: W * 0.8, y: H - r - 26 * k, r }]; }
function hud(G, t) { const c = G.cfg, m = G.me;
  if (G.lesson) lessonPanel(G);
  if (!G.lesson) { const place = 1 + G.boats.filter(b => b.z > m.z).length; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.font = `${Math.round(22 * k)}px ${TF}`; ctx.fillStyle = place === 1 ? '#ffe08a' : '#fff'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.5)'; const s = ['', '1ST', '2ND', '3RD', '4TH'][place]; ctx.strokeText(s, 14, 42 * k); ctx.fillText(s, 14, 42 * k);
    ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = '#fff'; const s2 = `${Math.max(0, Math.round(G.len - m.z))} m to go · ${(m.v * 3.6).toFixed(0)} km/h`; ctx.strokeText(s2, 14, 70 * k); ctx.fillText(s2, 14, 70 * k);
    // the race strip: everyone's progress
    const bx = W - 30 * k, by0 = 44 * k, bh = H * 0.28; ctx.fillStyle = 'rgba(0,0,0,.35)'; rrect(bx - 4, by0, 8, bh, 4); ctx.fill(); const dot = (z, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(bx, by0 + bh * (1 - clamp(z / G.len, 0, 1)), 6 * k, 0, TAU); ctx.fill(); };
    G.boats.forEach((b, i) => dot(b.z, ['#d83a2a', '#2aa84a', '#e8a82a'][i % 3])); dot(m.z, '#3ac8e8'); }
  if (m.rhythm >= 1) { ctx.textAlign = 'center'; ctx.font = `${Math.round(16 * k)}px ${TF}`; ctx.fillStyle = '#3ac8e8'; ctx.fillText(`RHYTHM ${Math.floor(m.rhythm)}`, W / 2, H * 0.72); }
  // the two oar pads: a ring that fills as the oar swings back, green when it is ready
  oarPads().forEach((p, i) => { const o = m.oars[i], u = clamp(o.t / CYCLE, 0, 1), ready = o.t >= CYCLE && o.t < CYCLE + c.win, held = ui.taps[i] > 0;
    ctx.fillStyle = held ? 'rgba(58,200,232,.45)' : 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill();
    ctx.lineWidth = 8 * k; ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r - 6 * k, 0, TAU); ctx.stroke();
    ctx.strokeStyle = ready ? '#5ae87a' : o.t < CYCLE * 0.55 ? '#ff7a5a' : '#ffd040'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r - 6 * k, -Math.PI / 2, -Math.PI / 2 + TAU * u); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = `${Math.round(15 * k)}px ${TF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(i === 0 ? 'LEFT' : 'RIGHT', p.x, p.y); });
  for (const i of [0, 1]) if (ui.taps[i] > 0) ui.taps[i] -= 1 / 60; }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { coachPanel(G); }
