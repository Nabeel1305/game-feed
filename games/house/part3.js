// ===================== THE VIEW: Homemaker in 3D (three.js through tools/world3d.js) =====================
// The plot seen from above at an angle, in the level's light: grass, a pale grid where you can build, and your house going
// up piece by piece (wood floors, cream walls, windows with glass, doors, furniture, trees, and a roof once it is closed).
// You turn the view a quarter at a time. When you move in, the camera walks you through the front door and round every room.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [];
let hint = null, V3 = null, viewA = 0, viewT = 0, showRoof = true, tour = null;
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 6) TXT.shift(); }
function tip(key, txt, secs = 2.8) { if (HEADLESS || !(G && G.lesson)) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 1.8);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.3) TXT.shift(); if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; } }
const ui = { drag: null, last: null };
function buildWorld(G) {
  const T = THREE; if (!V3) { if (!W3 || !W3.init({ canvas: $('gl'), fov: 45, far: 3000, near: 0.1 })) { V3 = { none: true }; return V3; }
    V3 = { T, S: W3.scene, built: null, grp: null, plotKey: null };
    const grass = W3.terrain({ size: 400, seg: 60, x: 0, z: 0, height: (x, z) => { const r = Math.hypot(x, z); return r < 14 ? 0 : (r - 14) * 0.05 * Math.sin(x * 0.05 + z * 0.03) * 3; }, colour: (x, z, h) => [0.36 + h * 0.01, 0.6, 0.3], map: W3.grainTex(256, 7, 210, 40, 10) }); if (grass.material.map) grass.material.map.repeat.set(50, 50);
    const R0 = W3.rng(4), trees = []; for (let i = 0; i < 160; i++) { const a = R0() * TAU, r = 22 + R0() * 120; trees.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, y: 0, s: 0.8 + R0(), hue: R0(), shade: R0() * 0.4 }); } W3.pines(trees, { layers: 4, shadow: true });
    W3.setQuality(stepN); }
  if (V3.none) return V3; const V = V3;
  if (V.plotKey !== G.pw + 'x' + G.pd) { V.plotKey = G.pw + 'x' + G.pd; if (V.plot) V.S.remove(V.plot); const g = new T.Group(); V.plot = g; V.S.add(g);
    const base = new T.Mesh(new T.BoxGeometry(G.pw, 0.04, G.pd), new T.MeshStandardMaterial({ color: 0xd8e8c0, roughness: 0.9 })); base.position.y = 0.0; base.receiveShadow = true; g.add(base);
    const pts = []; for (let x = 0; x <= G.pw; x++) pts.push(x - G.pw / 2, 0.03, -G.pd / 2, x - G.pw / 2, 0.03, G.pd / 2); for (let z = 0; z <= G.pd; z++) pts.push(-G.pw / 2, 0.03, z - G.pd / 2, G.pw / 2, 0.03, z - G.pd / 2);
    const lg = new T.BufferGeometry(); lg.setAttribute('position', new T.Float32BufferAttribute(pts, 3)); g.add(new T.LineSegments(lg, new T.LineBasicMaterial({ color: 0x8aa070, transparent: true, opacity: 0.6 }))); }
  return V; }
const MAT = {}; function mat(T, key, col, o = {}) { return MAT[key] || (MAT[key] = new T.MeshStandardMaterial(Object.assign({ color: col, roughness: 0.8 }, o))); }
// rebuild the house's meshes when it changes
function rebuild(G) { const V = V3, T = V.T, key = snapshot(G) + showRoof + !!tour + upLv('brick') + upLv('tile'); if (V.built === key) return; V.built = key; if (V.grp) V.S.remove(V.grp); const g = new T.Group(); V.grp = g; V.S.add(g);
  const ox = -G.pw / 2, oz = -G.pd / 2, H = 2.2, th = 0.14, wallM = upLv('brick') ? mat(T, 'brick', 0xb8584a, { map: W3.grainTex(64, 2, 200, 40, 6) }) : mat(T, 'wall', 0xf2ead8), floorM = mat(T, 'floor', 0xb88a5a, { map: W3.grainTex(64, 3, 200, 30, 4) }), doorM = mat(T, 'door', upLv('paint') ? 0x2a7ad8 : 0x7a4a2a), glassM = mat(T, 'glass', 0x9ad0f0, { transparent: true, opacity: 0.45, roughness: 0.1, metalness: 0.2 });
  const box = (w, h, d, m, x, y, z, ry = 0) => { const b = new T.Mesh(new T.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.rotation.y = ry; b.castShadow = b.receiveShadow = true; g.add(b); return b; };
  for (const k of Object.keys(G.C)) { const [x, z] = k.split(':').map(Number); box(0.98, 0.1, 0.98, floorM, ox + x + 0.5, 0.06, oz + z + 0.5); }
  for (const [k, w] of Object.entries(G.E)) { const [o, xs, zs] = k.split(':'), x = +xs, z = +zs, h = o === 'h', cx = h ? ox + x + 0.5 : ox + x, cz = h ? oz + z : oz + z + 0.5, ry = h ? 0 : Math.PI / 2;
    if (w === 'wall') box(1.02, H, th, wallM, cx, H / 2, cz, ry);
    if (w === 'window') { box(1.02, 0.85, th, wallM, cx, 0.425, cz, ry); box(1.02, 0.45, th, wallM, cx, H - 0.225, cz, ry); for (const s of [-1, 1]) { const p = box(0.16, 0.9, th, wallM, 0, 1.3, 0, ry); p.position.set(cx + (h ? s * 0.43 : 0), 1.3, cz + (h ? 0 : s * 0.43)); } box(0.7, 0.9, 0.03, glassM, cx, 1.3, cz, ry); }
    if (w === 'door') { box(1.02, 0.25, th, wallM, cx, H - 0.125, cz, ry); for (const s of [-1, 1]) { const p = box(0.14, H - 0.25, th, wallM, 0, (H - 0.25) / 2, 0, ry); p.position.set(cx + (h ? s * 0.44 : 0), (H - 0.25) / 2, cz + (h ? 0 : s * 0.44)); } if (!tour) box(0.72, H - 0.3, 0.05, doorM, cx, (H - 0.3) / 2, cz, ry); } }
  for (const [k, it] of Object.entries(G.items)) { const [x, z] = k.split(':').map(Number), px = ox + x + 0.5, pz = oz + z + 0.5, r = it.r * Math.PI / 2, f = new T.Group(); f.position.set(px, 0.11, pz); f.rotation.y = r; g.add(f); const add = (w, h, d, m, x2, y2, z2) => { const b = new T.Mesh(new T.BoxGeometry(w, h, d), m); b.position.set(x2, y2, z2); b.castShadow = true; f.add(b); };
    if (it.k === 'bed') { add(0.8, 0.35, 0.95, mat(T, 'bedf', 0x6a4a3a), 0, 0.18, 0); add(0.74, 0.12, 0.88, mat(T, 'sheet', 0xf0f0f8), 0, 0.41, 0); add(0.6, 0.1, 0.22, mat(T, 'pillow', 0xffffff), 0, 0.5, -0.3); add(0.76, 0.06, 0.5, mat(T, 'quilt', 0x5a7ad8), 0, 0.48, 0.18); }
    if (it.k === 'stove') { add(0.7, 0.8, 0.6, mat(T, 'stove', 0x3a3a3e, { metalness: 0.4 }), 0, 0.4, 0); for (const [a, b] of [[-0.17, -0.12], [0.17, -0.12], [-0.17, 0.12], [0.17, 0.12]]) add(0.16, 0.02, 0.16, mat(T, 'burn', 0x111111), a, 0.81, b); }
    if (it.k === 'table') { add(0.85, 0.06, 0.85, mat(T, 'tab', 0xa87a4a), 0, 0.72, 0); for (const [a, b] of [[-0.36, -0.36], [0.36, -0.36], [-0.36, 0.36], [0.36, 0.36]]) add(0.06, 0.7, 0.06, mat(T, 'tab', 0xa87a4a), a, 0.35, b); }
    if (it.k === 'sofa') { add(0.9, 0.4, 0.6, mat(T, 'sofa', 0xc85a4a), 0, 0.2, 0); add(0.9, 0.45, 0.15, mat(T, 'sofa', 0xc85a4a), 0, 0.55, -0.24); }
    if (it.k === 'bath') { add(0.85, 0.5, 0.55, mat(T, 'bath', 0xf4f4f8, { roughness: 0.2 }), 0, 0.25, 0); add(0.72, 0.05, 0.42, mat(T, 'water', 0x8ac8f0, { roughness: 0.05 }), 0, 0.48, 0); }
    if (it.k === 'desk') { add(0.85, 0.05, 0.5, mat(T, 'tab', 0xa87a4a), 0, 0.72, 0); add(0.5, 0.32, 0.04, mat(T, 'scr', 0x1a1a22), 0, 0.92, -0.15); for (const a of [-0.38, 0.38]) add(0.05, 0.7, 0.45, mat(T, 'tab', 0xa87a4a), a, 0.35, 0); }
    if (it.k === 'plant') { add(0.3, 0.3, 0.3, mat(T, 'pot', 0xb85a2a), 0, 0.15, 0); const s = new T.Mesh(new T.SphereGeometry(0.28, 10, 8), mat(T, 'leaf', 0x4a9a3a)); s.position.y = 0.5; f.add(s); }
    if (it.k === 'tree') { add(0.18, 1.4, 0.18, mat(T, 'bark', 0x6a4a2a), 0, 0.7, 0); const s = new T.Mesh(new T.SphereGeometry(0.75, 12, 10), mat(T, 'leaf2', 0x3a8a3a)); s.position.y = 1.8; s.castShadow = true; f.add(s); } }
  // the roof: a gable over each closed house's rooms
  if (G.roof && showRoof) { const A = analyse(G), roofM = upLv('tile') ? mat(T, 'tile', 0xb8582a) : mat(T, 'roof', 0x5a4a5a, { side: T.DoubleSide });
    for (const h of A.closed) { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const r of h.rooms) for (const [x, z] of r.cells) { x0 = Math.min(x0, x); x1 = Math.max(x1, x + 1); z0 = Math.min(z0, z); z1 = Math.max(z1, z + 1); }
      const w = x1 - x0 + 0.4, d = z1 - z0 + 0.4, cx = ox + (x0 + x1) / 2, cz = oz + (z0 + z1) / 2, along = w >= d, span = along ? d : w, len = along ? w : d, rise = Math.min(1.6, span * 0.45);
      const sh = new T.Shape(); sh.moveTo(-span / 2, 0); sh.lineTo(span / 2, 0); sh.lineTo(0, rise); sh.lineTo(-span / 2, 0); const geo = new T.ExtrudeGeometry(sh, { depth: len, bevelEnabled: false }); geo.translate(0, 0, -len / 2);
      const m = new T.Mesh(geo, roofM); m.position.set(cx, H, cz); m.rotation.y = along ? Math.PI / 2 : 0; m.castShadow = true; g.add(m); } }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); }
function setWeather(G) { const V = V3; if (!V || V.none || V.sky) return; V.sky = 'golden'; W3.setSky(['golden', 'morning', 'noon', 'sunset'][G.place % 4], { azim: 220 }); }
const RC = window.THREE ? new THREE.Raycaster() : null, PL = window.THREE ? new THREE.Plane(new THREE.Vector3(0, 1, 0), 0) : null, VW = window.THREE ? new THREE.Vector3() : null;
// a screen point to the plot (in grid units)
function pickAt(G, x, y) { if (!V3 || V3.none) return null; W3.cam.updateMatrixWorld(); RC.setFromCamera({ x: x / W * 2 - 1, y: -(y / H) * 2 + 1 }, W3.cam); const p = new THREE.Vector3(); if (!RC.ray.intersectPlane(PL, p)) return null; return { fx: p.x + G.pw / 2, fz: p.z + G.pd / 2 }; }
function wScreen(x, y, z) { W3.cam.updateMatrixWorld(); VW.set(x, y, z); return W3.screen(VW); }
function onEvent(G, e) { const cx = W / 2, cy = H * 0.42;
  switch (e.k) {
    case 'start': say(G.cfg.brief.title.toUpperCase(), cx, cy, '#fff', 22); sfx.chime(); break;
    case 'put': sfx.put(e.what); break; case 'turn': sfx.turn(); break; case 'erase': sfx.erase(); break; case 'undo': sfx.erase(); break;
    case 'tool': sfx.click(); break;
    case 'needwall': tip('needwall', 'Windows and doors go into a wall: build the wall first, then tap it.', 3); sfx.no(); break;
    case 'needfloor': tip('needfloor', 'Furniture goes on the floor: lay FLOOR there first.', 3); sfx.no(); break;
    case 'noroof': say('CLOSE THE WALLS FIRST', cx, cy, '#ffd0c4', 18); tip('noroof', 'A roof needs a floor closed in by walls all the way round.', 3); sfx.no(); break;
    case 'roof': sfx.roof(); FX.flash = 0.3; say('ROOF ON!', cx, cy, '#ffe08a', 24); break;
    case 'notyet': sfx.no(); if (e.what) { say('NOT YET', cx, cy, '#ffd0c4', 22); hint = { txt: 'Still needed: ' + e.what.txt, t: 0, secs: 2.6 }; } break;
    case 'lessonnext': if (e.first) hint = null; say(e.first ? 'FIRST, A LESSON' : 'NEXT LESSON', cx, H * 0.5, '#ffd36a', 26); break;
    case 'lessondone': say('YOU CAN BUILD!', cx, H * 0.5, '#ffd36a', 26); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); FX.flash = 0.5; vibe(HAP.best); say('WELCOME HOME!', cx, cy, '#ffe08a', 30); break;
  } }
function startTour(G) { const A = analyse(G), H0 = A.closed.sort((a, b) => b.floor - a.floor)[0]; if (!H0) return; const ox = -G.pw / 2, oz = -G.pd / 2, pts = [];
  const door = H0.rooms.flatMap(r => r.edges.filter(e => e.w === 'door' && e.out))[0]; if (door) { pts.push([ox + door.nx + 0.5, oz + door.nz + 0.5]); pts.push([ox + door.x + 0.5, oz + door.z + 0.5]); }
  for (const r of H0.rooms) { let sx = 0, sz = 0; for (const [x, z] of r.cells) { sx += x; sz += z; } pts.push([ox + sx / r.cells.length + 0.5, oz + sz / r.cells.length + 0.5]); }
  if (pts.length < 2) pts.push([ox + G.pw / 2, oz + G.pd / 2]); showRoof = false; tour = { pts, t: 0, dur: 2.2 * pts.length + 1 }; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round';
  const g = G || idleG(), V = buildWorld(g); if (V.none) { ctx.fillStyle = '#1a2420'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D plot.', W / 2, H / 2); return; }
  setWeather(g); rebuild(g);
  const cam = W3.cam, fov = tour ? 72 : 45; if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
  if (tour) { tour.t += dt; const P = tour.pts, u = Math.min(P.length - 1.001, tour.t / 2.2), i = Math.floor(u), f = u - i, a = P[i], b = P[Math.min(P.length - 1, i + 1)], x = a[0] + (b[0] - a[0]) * f, z = a[1] + (b[1] - a[1]) * f, c = P[Math.min(P.length - 1, i + 2)];
    const lx = b[0] + (c[0] - b[0]) * f, lz = b[1] + (c[1] - b[1]) * f; cam.position.set(x, 1.55, z); cam.lookAt(lx === x && lz === z ? x + 1 : lx, 1.4, lz === z && lx === x ? z : lz); if (tour.t > tour.dur) { tour = null; showRoof = true; if (G && G.over && !HEADLESS) showEnd(); } }
  else { viewT += (viewA - viewT) * Math.min(1, dt * 6); const r = Math.max(g.pw, g.pd) * 1.55 + 4, a = viewT * Math.PI / 2 + 0.6; cam.position.set(Math.sin(a) * r, r * 1.05, Math.cos(a) * r); cam.lookAt(0, -1.2, 0); }
  W3.setFocus(0, 0, 0, 20); W3.render(dt);
  if (G && !tour) hud(G, now);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 0.9 ? 1 : 1 - (t2.t - 0.9) / 0.4; ctx.globalAlpha = Math.max(0, al); ctx.font = `${Math.round(t2.size * k)}px ${TF}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 22); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 22); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(15 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 19 * k, h = lines.length * lh + 16 * k, w2 = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30;
    ctx.fillStyle = 'rgba(0,0,0,.7)'; rrect(W / 2 - w2 / 2, H * 0.5 - h / 2, w2, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.5 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); } }
let IG = null; function idleG() { if (!IG || IG.over || IG.t > 30) { IG = newGame(5, { seed: (Math.random() * 1e6) | 0 }); IG.mem = {}; } honest(IG, { react: 0.05, acc: 1 }, IG.mem); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
// the tray, the buttons, the checklist
function layout(G) { const tools = G.cfg.tools, per = 7, bw = (W - 16) / per, bh = 54 * k, rows = Math.ceil(tools.length / per), y0 = H - rows * (bh + 6) - 12;
  const tray = tools.map((id, i) => ({ id, x: 8 + (i % per) * bw + 2, y: y0 + Math.floor(i / per) * (bh + 6), w: bw - 4, h: bh }));
  const top = y0 - 52 * k; return { tray, move: { x: W - 132 * k, y: top, w: 120 * k, h: 42 * k }, undo: { x: 12, y: top, w: 56 * k, h: 42 * k }, rotL: { x: 74 * k, y: top, w: 42 * k, h: 42 * k }, rotR: { x: 122 * k, y: top, w: 42 * k, h: 42 * k }, eye: { x: 170 * k, y: top, w: 42 * k, h: 42 * k }, trayTop: y0, top }; }
function hud(G, t) { const L = layout(G), c = G.cfg;
  if (G.lesson) lessonPanel(G);
  // checklist
  const list = G.list || [], y0 = G.lesson ? H * 0.2 : 44 * k; ctx.font = `700 ${Math.round(12.5 * k)}px ${BC}`; const lh = 17 * k, w0 = Math.min(W - 24, Math.max(...list.map(q => ctx.measureText(q.txt).width), 120) + 40);
  if (!G.lesson) { ctx.fillStyle = 'rgba(0,0,0,.45)'; rrect(10, y0 - 6, w0, (list.length + 1) * lh + 10, 10); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(`${c.brief.title.toUpperCase()} · ${G.pieces || 0}/${c.budget} pieces · ${Math.max(0, c.work - (G.work || 0))} jobs left`, 18, y0); }
  list.forEach((q, i) => { ctx.fillStyle = q.ok ? '#9be3b5' : q.star ? 'rgba(255,224,138,.85)' : '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(`${q.ok ? '✓' : q.star ? '☆' : '○'} ${q.txt}`, 18, y0 + (i + (G.lesson ? 0 : 1)) * lh + (G.lesson ? 0 : 0)); });
  // buttons
  const btn = (r, txt, on, col = 'rgba(0,0,0,.5)', tc = '#fff') => { ctx.fillStyle = on ? col : 'rgba(0,0,0,.3)'; rrect(r.x, r.y, r.w, r.h, 12); ctx.fill(); ctx.fillStyle = on ? tc : 'rgba(255,255,255,.4)'; ctx.font = `${Math.round(Math.min(r.h * 0.38, 16 * k))}px ${TF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, r.x + r.w / 2, r.y + r.h / 2 + 1); };
  btn(L.move, 'MOVE IN', G.ready, '#7ad08a', '#10301a'); btn(L.undo, 'UNDO', G.hist.length > 0); btn(L.rotL, '⟲', true); btn(L.rotR, '⟳', true); btn(L.eye, showRoof ? '⌂' : '◫', true);
  ctx.fillStyle = 'rgba(10,16,12,.75)'; rrect(4, L.trayTop - 6, W - 8, H - L.trayTop + 2, 14); ctx.fill();
  for (const b of L.tray) { const T = TOOLS.find(q => q.id === b.id), on = G.tool === b.id; ctx.fillStyle = on ? 'rgba(122,208,138,.85)' : 'rgba(255,255,255,.1)'; rrect(b.x, b.y, b.w, b.h, 10); ctx.fill();
    ctx.fillStyle = on ? '#10301a' : '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `${Math.round(b.h * 0.38)}px sans-serif`; ctx.fillText(T.icon, b.x + b.w / 2, b.y + b.h * 0.4); ctx.font = `700 ${Math.round(9.5 * k)}px ${BC}`; ctx.fillText(T.name.toUpperCase(), b.x + b.w / 2, b.y + b.h * 0.82); } }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { coachPanel(G); }
