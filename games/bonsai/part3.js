// ===================== THE VIEW: Bonsai in 3D (three.js through tools/world3d.js) =====================
// A little tree in a glazed pot on a wooden stand in a Japanese garden: raked gravel, a stone lantern, maples and pines
// behind. The light follows the seasons (spring morning, summer noon, autumn gold, winter grey with snow on the branches).
// Branches taper from the trunk; each pad of leaves is a soft cluster, the colour of the tree and the season (blossom in
// spring for cherry and wisteria). Buds are small pink dots that pulse; caterpillars wriggle on the pads. Behind the tree the
// festival's outline glows faintly. Petals, leaves or snow drift past. The 2D layer draws the season, sap, the match against
// the target, the Next season button, and the calls.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { snap: true, cam: null, nextBtn: null, row: 0, judgeT: 0 };
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 110, g = 200) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30 * k, t: 0, life: 0.5 + Math.random() * 0.5, col, r: (1.5 + Math.random() * 2.5) * k, g }); } if (PARTS.length > 220) PARTS.splice(0, PARTS.length - 220); }
function fxStep(dt) {
  FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.6) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.g || 200) * k * dt; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; }
}
const hex = n => '#' + n.toString(16).padStart(6, '0');
const SKY = ['morning', 'noon', 'golden', 'overcast'];
// ---------- the world ----------
function buildWorld() {
  if (V3) return V3; const T = THREE; if (!W3 || !W3.init({ canvas: $('gl'), fov: 50, far: 3000, near: 0.05 })) { V3 = { none: true }; return V3; }
  const S = W3.scene, R0 = W3.rng(41), N3 = new T.ImprovedNoise(), nz = (x, z, s) => N3.noise(x * s, 0.7, z * s);
  const hgt = (x, z) => { const far = -z - 40; return far > 0 ? Math.min(30, far * 0.25) + nz(x, z, 0.03) * 8 * Math.min(1, far / 30) - 1.2 : -1.2 + nz(x, z, 0.2) * 0.05; };
  W3.terrain({ size: 700, seg: 100, x: 0, z: -200, height: hgt, colour: (x, z, h) => { const n = nz(x, z, 0.5) * 0.5 + 0.5; if (z > -9 && Math.abs(x) < 9) return [0.72 + n * 0.06, 0.7 + n * 0.05, 0.64 + n * 0.05]; return h > 3 ? [0.18, 0.28 + n * 0.06, 0.14] : [0.28 + n * 0.05, 0.4, 0.2]; }, map: W3.grainTex(256, 9, 210, 40, 6) });
  const trees = []; for (let i = 0; i < 300; i++) { const x = (R0() - 0.5) * 500, z = -18 - R0() * 220; const h = hgt(x, z); trees.push({ x, z, y: h - 0.3, s: 1.2 + R0() * 1.3, hue: R0(), shade: R0() * 0.5 }); } W3.pines(trees, { layers: 4 });
  // raked gravel lines
  const lineM = new T.MeshBasicMaterial({ color: 0x9a968a, transparent: true, opacity: 0.35 }); for (let i = 0; i < 18; i++) { const r = 2.2 + i * 0.35, m = new T.Mesh(new T.RingGeometry(r, r + 0.03, 64, 1, Math.PI * 0.05, Math.PI * 0.9), lineM); m.rotation.x = -Math.PI / 2; m.position.set(0, -1.19, -1.2); S.add(m); }
  // the stand, the pot, the soil
  const wood = new T.MeshStandardMaterial({ color: 0x5a3a24, roughness: 0.55, map: W3.grainTex(128, 4, 160, 60, 3) });
  const top = new T.Mesh(new T.BoxGeometry(2.4, 0.08, 1.1), wood); top.position.set(0, -0.42, 0); top.castShadow = top.receiveShadow = true; S.add(top);
  for (const sx of [-1.05, 1.05]) for (const sz of [-0.42, 0.42]) { const leg = new T.Mesh(new T.BoxGeometry(0.08, 0.8, 0.08), wood); leg.position.set(sx, -0.82, sz); S.add(leg); }
  const potP = [[0, -0.38], [0.62, -0.38], [0.66, -0.34], [0.74, -0.06], [0.8, -0.04], [0.8, 0], [0.72, 0.0]].map(p => new T.Vector2(p[0], p[1]));
  V3 = { T, S, pot: new T.Mesh(new T.LatheGeometry(potP, 40), new T.MeshStandardMaterial({ color: 0x2a4a7a, roughness: 0.25, metalness: 0.1 })), nodes: new Map(), buds: [], pests: [], sky: null };
  const V = V3; V.pot.scale.set(1, 1, 0.55); V.pot.castShadow = true; S.add(V.pot);
  const soil = new T.Mesh(new T.CircleGeometry(0.72, 32), new T.MeshStandardMaterial({ color: 0x3a2a1e, roughness: 1 })); soil.rotation.x = -Math.PI / 2; soil.scale.set(1, 0.55, 1); soil.position.y = -0.02; S.add(soil);
  const moss = new T.Mesh(new T.SphereGeometry(0.3, 12, 6, 0, TAU, 0, 0.5), new T.MeshStandardMaterial({ color: 0x5a7a2a, roughness: 1 })); moss.scale.set(1.6, 0.12, 0.6); moss.position.set(-0.25, -0.03, 0.05); S.add(moss);
  // a stone lantern and a little maple to one side
  const stoneM = new T.MeshStandardMaterial({ color: 0x8a8a84, roughness: 0.9 }); const lan = new T.Group(); [[0.18, 0.5, 0.25], [0.32, 0.1, 0.55], [0.24, 0.26, 0.73], [0.42, 0.12, 0.92]].forEach(([r, h, y], i) => { const m = new T.Mesh(i === 3 ? new T.ConeGeometry(r, h * 2, 6) : new T.CylinderGeometry(r, r * 1.1, h, 6), stoneM); m.position.y = y; lan.add(m); });
  lan.position.set(-2.6, -1.2, -2.6); lan.scale.setScalar(1.6); S.add(lan); V.lamp = new T.PointLight(0xffc070, 0, 4, 1.6); V.lamp.position.set(-2.6, 0.1, -2.5); S.add(V.lamp);
  // materials for the tree (colours set per species and season)
  V.barkM = new T.MeshStandardMaterial({ color: 0x6a4a32, roughness: 0.9 }); V.leafM = new T.MeshStandardMaterial({ color: 0x3f7a3a, roughness: 0.8 }); V.leaf2M = new T.MeshStandardMaterial({ color: 0x6aa04a, roughness: 0.8 }); V.wildM = new T.MeshStandardMaterial({ color: 0x7a9a3a, roughness: 0.8 });
  V.snowM = new T.MeshStandardMaterial({ color: 0xf4f6fa, roughness: 0.9 });
  V.budG = new T.SphereGeometry(0.036, 10, 8); V.budM = new T.MeshStandardMaterial({ color: 0xff7aa0, roughness: 0.4, emissive: 0xff3a70, emissiveIntensity: 0.35 });
  V.blobG = new T.IcosahedronGeometry(1, 1); V.cylG = new T.CylinderGeometry(0.75, 1, 1, 8); V.cylG.translate(0, 0.5, 0);
  V.catM = new T.MeshStandardMaterial({ color: 0x9ad040, roughness: 0.5 }); V.catG = new T.SphereGeometry(0.03, 10, 8);
  // drifting petals / leaves / snow
  const N = 260, pp = new Float32Array(N * 3); for (let i = 0; i < N; i++) pp.set([R0(), R0(), R0()], i * 3); const pg = new T.BufferGeometry(); pg.setAttribute('position', new T.BufferAttribute(pp, 3));
  V.drift = new T.Points(pg, new T.PointsMaterial({ size: 0.05, color: 0xffc0d0, transparent: true, opacity: 0.85, depthWrite: false })); V.drift.frustumCulled = false; S.add(V.drift); V.driftP = pp;
  W3.setQuality(stepN); return V;
}
function treeColours(V, g) { const sp = g.sp, s = g.season; V.barkM.color.setHex(sp.bark);
  const leaf = s === 2 ? sp.aut : s === 3 ? (sp.id === 'pine' || sp.id === 'juniper' ? sp.leaf : 0x8a7a5a) : sp.leaf, leaf2 = s === 0 && sp.bloom ? sp.bloom : s === 2 ? new THREE.Color(sp.aut).offsetHSL(0.03, 0, 0.12).getHex() : sp.leaf2;
  V.leafM.color.setHex(leaf); V.leaf2M.color.setHex(leaf2); V.wildM.color.setHex(leaf).offsetHSL(0.04, 0.1, 0.1);
  V.drift.material.color.setHex(s === 0 ? (sp.bloom || 0xffc8d8) : s === 1 ? 0xb8e070 : s === 2 ? sp.aut : 0xffffff); V.drift.material.size = s === 3 ? 0.04 : 0.05; V.drift.visible = s !== 1 || sp.id === 'cherry';
  V.snowOn = s === 3; }
// a node's meshes: its branch (a tapered cylinder) and its pad (a cluster of soft blobs)
function nodeMesh(V, n) { let m = V.nodes.get(n.id); if (m) return m; const T = THREE, br = new T.Mesh(V.cylG, V.barkM); br.castShadow = true; V.S.add(br);
  const pad = new T.Group(), R = W3.rng(n.id * 13 + 5); for (let i = 0; i < 7; i++) { const b = new T.Mesh(V.blobG, i % 3 === 2 ? V.leaf2M : n.wild ? V.wildM : V.leafM); const a = R() * TAU, rr = i ? 0.45 + R() * 0.25 : 0; b.position.set(Math.cos(a) * rr, Math.sin(a) * rr * 0.75 + (i ? 0.05 : 0.1), (R() - 0.5) * 0.5); b.scale.setScalar(i ? 0.45 + R() * 0.2 : 0.62); b.scale.y *= 0.75; b.castShadow = true; pad.add(b); }
  const snow = new T.Mesh(V.blobG, V.snowM); snow.scale.set(0.8, 0.22, 0.6); snow.position.y = 0.42; pad.add(snow); pad.userData.snow = snow;
  V.S.add(pad); m = { br, pad, seen: 1 }; V.nodes.set(n.id, m); return m; }
function syncTree(V, g, t) {
  for (const m of V.nodes.values()) m.seen = 0;
  for (const n of g.nodes) { const m = nodeMesh(V, n); m.seen = 1; const len = n.len * (n.trunk ? 1 : n.g), th = n.trunk ? 0.075 : Math.max(0.012, 0.05 - n.d * 0.006);
    m.br.position.set(n.x0, n.y0, 0); m.br.scale.set(th, len, th); m.br.rotation.set(0, 0, n.ang - Math.PI / 2);
    const r = padR(n), sw = Math.sin(t * 1.3 + n.id) * 0.01 * n.d; m.pad.visible = r > 0.005; if (m.pad.visible) { const ex = n.x0 + Math.cos(n.ang) * len, ey = n.y0 + Math.sin(n.ang) * len; m.pad.position.set(ex + sw, ey, 0); m.pad.scale.set(r, r, r * 0.8); m.pad.userData.snow.visible = !!V.snowOn; } }
  for (const [id, m] of V.nodes) if (!m.seen) { V.S.remove(m.br, m.pad); V.nodes.delete(id); }
  // buds
  while (V.buds.length < g.buds.length) { const b = new THREE.Mesh(V.budG, V.budM); V.S.add(b); V.buds.push(b); }
  V.buds.forEach((m, i) => { const b = g.buds[i]; m.visible = !!b; if (b) { const p = 1 + 0.25 * Math.sin(t * 5 + b.id), s = Math.min(1, b.age * 3) * p; m.position.set(budX(b), budY(b), 0.05); m.scale.setScalar(s); } });
  // caterpillars: a little row of green beads that wriggles, getting redder as it gets ready to eat
  while (V.pests.length < g.pests.length) { const grp = new THREE.Group(); for (let i = 0; i < 5; i++) { const s = new THREE.Mesh(V.catG, V.catM.clone()); grp.add(s); } V.S.add(grp); V.pests.push(grp); }
  V.pests.forEach((grp, i) => { const p = g.pests[i]; grp.visible = !!p; if (!p) return; grp.position.set(p.x, p.y, 0.16); const u = p.t / p.eat;
    grp.children.forEach((s, j) => { s.position.set((j - 2) * 0.04, Math.sin(t * 9 + j * 1.1) * 0.012, 0); s.scale.setScalar(j === 4 ? 1.25 : 1); s.material.color.setHSL(0.25 - u * 0.25, 0.7, 0.45); }); grp.rotation.z = Math.sin(t * 2 + p.id) * 0.4; });
}
const SV = new (window.THREE ? THREE.Vector3 : Object)(), RV = new (window.THREE ? THREE.Vector3 : Object)();
function scr(x, y, z) { if (!V3 || V3.none) return { x: W / 2 + x * 120, y: H * 0.62 - y * 120, front: true }; SV.set(x, y, z || 0); return W3.screen(SV); }
// the point on the tree's plane under a screen point (for taps)
function worldAt(px, py) { if (!V3 || V3.none) return { x: (px - W / 2) / 120, y: (H * 0.62 - py) / 120 }; const cam = W3.cam, r = cv.getBoundingClientRect(); RV.set((px - r.left) / r.width * 2 - 1, -((py - r.top) / r.height) * 2 + 1, 0.5).unproject(cam).sub(cam.position);
  if (Math.abs(RV.z) < 1e-6) return null; const t = -cam.position.z / RV.z; return { x: cam.position.x + RV.x * t, y: cam.position.y + RV.y * t }; }
// ---------- events ----------
function onEvent(G, e) {
  const p = e.x != null ? scr(e.x, e.y, 0) : { x: W / 2, y: H / 2 }, cx = W / 2;
  switch (e.k) {
    case 'start': ui.row = 0; say(G.shape.name.toUpperCase(), cx, H * 0.24, '#ffffff', 26); say(`MATCH ${G.cfg.need}%`, cx, H * 0.3, '#ffd6e0', 22); sfx.go();
      if (G.N <= 2) tip('grow', 'Tap the pink buds that point into the outline. Cut branches that grow out of it.', 3.6); break;
    case 'grow': ui.row++; sfx.grow(ui.row); burst(p.x, p.y, hex(G.sp.leaf2), 8, 70); break;
    case 'wild': ui.row = 0; sfx.wild(); say('WILD!', p.x, p.y - 30 * k, '#ffd040', 18); if (G.N <= 4) tip('wild', 'A bud you left grew wild. Tap the branch to cut it if it sticks out.', 3); break;
    case 'prune': sfx.snip(); vibe(HAP.sharp); for (const c of e.cut) { const q = scr(c.x, c.y, 0); burst(q.x, q.y, hex(G.sp.leaf), 6, 60, 380); } if (e.out > 0.5) say('✂', p.x, p.y - 20 * k, '#ffffff', 22); break;
    case 'flick': sfx.flick(); vibe(HAP.light); burst(p.x, p.y, '#b0e050', 8, 160); say('+1 🪙', p.x, p.y - 26 * k, '#ffd040', 16); break;
    case 'pest': sfx.pest(); if (G.N <= 5) tip('pest', 'A caterpillar! Tap it before it eats the leaves.', 2.6); break;
    case 'eaten': sfx.eaten(); FX.red = 0.35; say('EATEN', p.x, p.y - 26 * k, '#ffb4a8', 18); break;
    case 'nosap': sfx.nosap(); say('NO SAP', p.x, p.y - 26 * k, '#9ad8ff', 18); tip('sap', 'Out of sap: more comes with the next season. Prune and tidy meanwhile.', 2.8); break;
    case 'winter': sfx.no(); say('IT IS WINTER', cx, H * 0.4, '#dde8ff', 20); break;
    case 'season': sfx.season(e.s); ui.row = 0; say(SEASONS[e.s] + (G.cfg.years > 1 ? ` · YEAR ${e.y + 1}` : ''), cx, H * 0.24, ['#ffd6e0', '#c8f0a0', '#ffc070', '#e8f0ff'][e.s], 30);
      if (e.s === 1 && G.N <= 4) tip('summer', 'Summer: buds you leave grow wild, and caterpillars come.', 2.8); if (e.s === 3) tip('winter', 'Winter: nothing grows. Cut what sticks out before the festival.', 2.8); break;
    case 'judge': ui.judgeT = 0; break;
    case 'lessonnext': if (e.first) hint = null; say('FIRST, A LESSON', cx, H * 0.24, '#ffe08a', 24); sfx.go(); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, cx, H * 0.3, '#9be3b5', 22); break;
    case 'lessonmiss': coachMiss(); break;
    case 'lessondone': say('NOW GROW YOUR TREE!', cx, H * 0.24, '#ffe08a', 24); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); vibe(HAP.best); FX.flash = 0.5; say(`${G.match}% · A RIBBON!`, cx, H * 0.24, '#ffd040', 28); break;
    case 'lost': sfx.lose(); say(`${G.match}% OF ${G.cfg.need}%`, cx, H * 0.24, '#ffb4a8', 26); break;
  }
}
// ---------- every frame ----------
function placeCam(g, dt) { const cam = W3.cam, asp = innerWidth / innerHeight, fov = 50, tn = Math.tan(fov / 2 * Math.PI / 180); cam.fov = fov; cam.aspect = asp; cam.updateProjectionMatrix();
  const needW = 2.25, needH = 2.3, d = Math.max(needH / (2 * tn), needW / (asp * 2 * tn)), sh = FX.shake ? (Math.random() - 0.5) * FX.shake * 0.004 : 0;
  cam.position.set(sh, 1.0 + d * 0.06, d); cam.lookAt(0, 0.86 + (asp < 0.75 ? -0.12 : 0), 0); cam.updateMatrixWorld(); }
let IG = null; function idleG() { if (!IG || IG.over) { IG = newGame(Math.max(2, store.get('level', 1) | 0), { seed: (Math.random() * 1e6) | 0 }); IG.mem = {}; } honest(IG, { react: 0.5, acc: 0.95 }, IG.mem); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#1c2a20'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D garden.', W / 2, H / 2); return; }
  const g = G || idleG(), t = now;
  if (V.sky !== g.season) { V.sky = g.season; W3.setSky(SKY[g.season], { azim: 150, wind: [0.3, 0.2] }); V.colKey = null; }
  const ck = g.season + g.sp.id; if (V.colKey !== ck) { V.colKey = ck; treeColours(V, g); }
  V.lamp.intensity = g.season === 3 ? 3 : 0;
  // drift: petals, leaves or snow, falling slowly past the tree
  const pa = V.drift.geometry.attributes.position, fall = g.season === 3 ? 0.35 : 0.12; for (let i = 0; i < pa.count; i++) { let y = V.driftP[i * 3 + 1] - fall * dt / 3.2; if (y < 0) y += 1; V.driftP[i * 3 + 1] = y; pa.setXYZ(i, (V.driftP[i * 3] - 0.5) * 4 + Math.sin(t * 0.7 + i) * 0.1, -0.4 + y * 3.2, (V.driftP[i * 3 + 2] - 0.5) * 2.4); } pa.needsUpdate = true;
  placeCam(g, dt); syncTree(V, g, t); W3.setFocus(0, 0.9, 0, 4); W3.render(dt);
  outline(g, t);
  if (G) hud(G, t);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 1.1 ? 1 : 1 - (t2.t - 1.1) / 0.5; ctx.globalAlpha = Math.max(0, al); const sc = t2.t < 0.12 ? 1.3 - t2.t / 0.12 * 0.3 : 1; ctx.font = `700 ${Math.round(t2.size * k * sc)}px ${TF}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(20,30,22,.6)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 18); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 18); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30;
    ctx.fillStyle = 'rgba(24,36,28,.88)'; rrect(W / 2 - w / 2, H * 0.8 - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.8 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,60,60,${FX.red * 0.12})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,250,235,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); }
}
// the festival's outline, glowing faintly behind the tree; with the eye (or early on) each bud shows where it would grow
function outline(g, t) { ctx.save(); const pulse = 0.55 + 0.15 * Math.sin(t * 2);
  for (const q of g.shape.e) { ctx.beginPath(); for (let i = 0; i <= 48; i++) { const a = i / 48 * TAU, p = scr(q[0] + Math.cos(a) * q[2], q[1] + Math.sin(a) * q[3], -0.05); i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); }
    ctx.fillStyle = 'rgba(255,240,220,.07)'; ctx.fill(); ctx.setLineDash([7 * k, 6 * k]); ctx.lineDashOffset = -t * 8; ctx.strokeStyle = `rgba(255,236,210,${pulse})`; ctx.lineWidth = 2 * k; ctx.stroke(); }
  ctx.setLineDash([]);
  if ((g.N <= 3 || upLv('eye')) && g.season < 3 && !g.over) for (const b of g.buds) { const a = scr(budX(b), budY(b), 0.03), x = b.x + Math.cos(b.ang) * SEG, y = b.y + Math.sin(b.ang) * SEG, e = scr(x, y, 0.03), inside = inShape(g, x, y);
    ctx.strokeStyle = inside ? 'rgba(160,255,170,.55)' : 'rgba(255,150,140,.45)'; ctx.lineWidth = 2 * k; ctx.setLineDash([3 * k, 4 * k]); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(e.x, e.y); ctx.stroke(); }
  ctx.restore(); }
// ---------- the 2D layer ----------
function panel(x, y, w, h) { ctx.fillStyle = 'rgba(24,36,28,.72)'; rrect(x, y, w, h, 14); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 1.5; rrect(x, y, w, h, 14); ctx.stroke(); }
function hud(G, t) {
  const c = G.cfg; ctx.textBaseline = 'middle'; ui.nextBtn = null;
  if (!G.lesson) {
    const x = 12, y = 48 * k, w = W - 24, h = 66 * k; panel(x, y, w, h);
    ctx.textAlign = 'left'; ctx.font = `700 ${Math.round(18 * k)}px ${TF}`; ctx.fillStyle = ['#ffd6e0', '#c8f0a0', '#ffc070', '#e8f0ff'][G.season]; ctx.fillText(SEASONS[G.season], x + 12, y + 17 * k);
    const sw = ctx.measureText(SEASONS[G.season]).width; ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillText(c.years > 1 ? `year ${Math.min(c.years, G.year + 1)} of ${c.years}` : 'one year', x + 18 + sw, y + 19 * k);
    // the season's progress (four short bars, the festival flag at the end)
    const bx = x + 12, bw = (w * 0.5 - 24) / (4 * c.years), by = y + 34 * k; for (let i = 0; i < 4 * c.years; i++) { const cur = G.year * 4 + G.season; ctx.fillStyle = i < cur ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.15)'; rrect(bx + i * bw, by, bw - 3, 5 * k, 2); ctx.fill(); if (i === cur) { ctx.fillStyle = '#ffd6e0'; rrect(bx + i * bw, by, (bw - 3) * clamp(G.sT / seasonLen(G), 0, 1), 5 * k, 2); ctx.fill(); } }
    ctx.font = `${Math.round(11 * k)}px sans-serif`; ctx.fillText('🎏', bx + 4 * c.years * bw + 2, by + 3 * k);
    ctx.font = `800 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = G.sap ? '#9ad8ff' : 'rgba(154,216,255,.45)'; ctx.fillText(`💧 ${G.sap} sap`, x + 12, y + 54 * k); ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillText(`🪙 ${G.coins}`, x + 82 * k, y + 54 * k);
    // the match against the target (and your best here)
    const mx = x + w * 0.52, mw = w * 0.48 - 12, my = y + 40 * k; ctx.textAlign = 'right'; ctx.font = `700 ${Math.round(22 * k)}px ${TF}`; ctx.fillStyle = G.match >= c.need ? '#9be3a5' : '#fff'; ctx.fillText(`${G.match}%`, x + w - 12, y + 18 * k);
    ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.textAlign = 'left'; ctx.fillText('match', mx, y + 18 * k);
    ctx.fillStyle = 'rgba(255,255,255,.15)'; rrect(mx, my, mw, 8 * k, 4); ctx.fill(); ctx.fillStyle = G.match >= c.need ? '#9be3a5' : '#f2a6b8'; rrect(mx, my, mw * G.match / 100, 8 * k, 4); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(mx + mw * c.need / 100 - 1, my - 4 * k, 2, 16 * k); const bh = HEADLESS ? 0 : ((store.get('bestH', {}) || {})[G.N] | 0); if (bh) { ctx.fillStyle = 'rgba(255,214,224,.9)'; ctx.beginPath(); ctx.arc(mx + mw * bh / 100, my + 15 * k, 3 * k, 0, TAU); ctx.fill(); }
    ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillText(`need ${c.need}`, mx + mw * c.need / 100, my + 20 * k);
    // Next season
    if (!G.over) { const bw2 = 132 * k, bh2 = 40 * k, b = { x: W - bw2 - 14, y: H - bh2 - 24 * k, w: bw2, h: bh2 }; ui.nextBtn = b; ctx.fillStyle = 'rgba(24,36,28,.8)'; rrect(b.x, b.y, b.w, b.h, 12); ctx.fill(); ctx.strokeStyle = 'rgba(255,214,224,.6)'; ctx.lineWidth = 1.5; rrect(b.x, b.y, b.w, b.h, 12); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = `800 ${Math.round(14 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillText(G.season === 3 && G.year === c.years - 1 ? 'To the festival ›' : 'Next season ›', b.x + b.w / 2, b.y + b.h / 2); }
  } else lessonPanel(G);
}
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { coachPanel(G); }
