// ===================== THE VIEW: Cairn in 3D (three.js through tools/world3d.js) =====================
// A flat-topped boulder at the edge of a still lake, reeds at its foot, pine hills and mist across the water, the place's
// light (mist, morning, golden, cloud, moonlight). Smooth river stones, each its own shape, wet and dark. The next stone hangs and
// sways above the stack with its soft shadow on the top stone; dropped, it clicks into place; a stack that tips rolls into the
// lake with a splash. Every cairn you have finished stands along the shore. The camera rises as the cairn grows.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { snap: true, basket: [], cam: null, fallen: [], shown: [] };
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 110) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30 * k, t: 0, life: 0.5 + Math.random() * 0.4, col, r: (1.5 + Math.random() * 2.5) * k }); } if (PARTS.length > 200) PARTS.splice(0, PARTS.length - 200); }
function fxStep(dt) {
  FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.6) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 200 * k * dt; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; }
}
const WATER = -1.25;
// ---------- the drawings ----------
function stoneGeo(st) { const T = THREE, g = new T.SphereGeometry(0.5, 22, 14), p = g.attributes.position, R0 = W3.rng(st.seed || 1), a = [R0() * 6, R0() * 6, R0() * 6], kind = st.kind;
  for (let i = 0; i < p.count; i++) { let x = p.getX(i), y = p.getY(i), z = p.getZ(i); const n = 1 + 0.06 * Math.sin(x * 7 + a[0]) * Math.cos(z * 6 + a[1]) + 0.04 * Math.sin(y * 9 + a[2]);
    if (kind !== 'round' && kind !== 'pebble') { const fl = kind === 'long' || kind === 'slab' ? 0.75 : 0.6; if (Math.abs(y) > 0.5 * fl) y = Math.sign(y) * (0.5 * fl + (Math.abs(y) - 0.5 * fl) * 0.35); }      // flat faces top and bottom
    p.setXYZ(i, x * n, y * n, z * n); }
  g.computeBoundingBox(); const bb = g.boundingBox, sy = 1 / (bb.max.y - bb.min.y); g.translate(0, -bb.min.y, 0); g.scale(st.w, st.h * sy, st.w * (kind === 'long' ? 0.5 : 0.78)); g.computeVertexNormals(); return g; }
const MATS = {};
function stoneMat(kind) { if (MATS[kind]) return MATS[kind]; const T = THREE, K = KINDS[kind]; return MATS[kind] = new T.MeshStandardMaterial({ color: K.col, roughness: kind === 'white' ? 0.35 : 0.62, metalness: 0, map: V3.grain, emissive: kind === 'white' ? 0x302a20 : 0 }); }
function stoneMesh(st) { if (st.mesh) return st.mesh; const m = new THREE.Mesh(stoneGeo(st), stoneMat(st.kind)); m.castShadow = m.receiveShadow = true; st.mesh = m; V3.S.add(m); return m; }
function buildWorld() {
  if (V3) return V3; const T = THREE; if (!W3 || !W3.init({ canvas: $('gl'), fov: 46, far: 4000, near: 0.05 })) { V3 = { none: true }; return V3; }
  const S = W3.scene, R0 = W3.rng(12), N3 = new T.ImprovedNoise(), nz = (x, z, s) => N3.noise(x * s, 0.31, z * s);
  // the shore: the boulder stands at the water's edge; the land rises behind the camera and round the far side of the lake
  const hgt = (x, z) => { if (z > -1.5) return -1.0 + Math.min(1.2, (z + 1.5) * 0.12) + nz(x, z, 0.3) * 0.15; const far = -z - 70; if (far > 0) return Math.min(60, far * 0.35) + nz(x, z, 0.02) * 14 * Math.min(1, far / 30) - 2; return -3; };
  W3.terrain({ size: 900, seg: 120, x: 0, z: -300, height: hgt, colour: (x, z, h) => { const n = nz(x, z, 0.4) * 0.5 + 0.5; if (z > -1.5) return [0.42 + n * 0.1, 0.4 + n * 0.08, 0.36 + n * 0.06]; return h > 6 ? [0.16, 0.24 + n * 0.06, 0.12] : [0.24 + n * 0.05, 0.3, 0.18]; }, map: W3.grainTex(256, 7, 200, 40, 6) });
  W3.water({ size: 2400, color: 0x1a3a3a, distort: 0.25, ripple: 1.2, speed: 0.25, y: WATER });
  const trees = []; for (let i = 0; i < 380; i++) { const x = (R0() - 0.5) * 900, z = -80 - R0() * 260; const h = hgt(x, z); if (h > 0) trees.push({ x, z, y: h - 0.4, s: 1.6 + R0() * 1.4, hue: R0(), shade: R0() * 0.5 }); } W3.pines(trees, { layers: 4 });
  // the boulder: big, grey, with a flat top just wide enough
  const bg = new T.DodecahedronGeometry(1, 2), bp = bg.attributes.position; for (let i = 0; i < bp.count; i++) { let x = bp.getX(i), y = bp.getY(i), z = bp.getZ(i); const n = 1 + nz(x * 3, z * 3 + y, 1) * 0.12; if (y > 0.55) y = 0.55 + (y - 0.55) * 0.05; bp.setXYZ(i, x * n, y, z * n); }
  bg.computeVertexNormals(); const grain = W3.grainTex(256, 3, 205, 55, 4); grain.repeat.set(2, 2);
  const boulder = new T.Mesh(bg, new T.MeshStandardMaterial({ color: 0x6e6a62, roughness: 0.9, map: grain, flatShading: false })); boulder.scale.set(1.15, 1.6, 1.0); boulder.position.y = -0.55 * 1.6; boulder.castShadow = boulder.receiveShadow = true; S.add(boulder);
  const moss = new T.Mesh(new T.SphereGeometry(1, 16, 8, 0, TAU, 0, 0.5), new T.MeshStandardMaterial({ color: 0x4a6a2a, roughness: 1 })); moss.scale.set(1.12, 0.3, 0.98); moss.position.set(0.1, -0.85, 0); moss.rotation.z = 0.9; S.add(moss);
  // pebbles on the shore, reeds at the water
  const peb = new T.InstancedMesh(new T.DodecahedronGeometry(0.12, 1), new T.MeshStandardMaterial({ roughness: 0.8 }), 400), d = new T.Object3D(), cc = new T.Color();
  for (let i = 0; i < 400; i++) { const x = (R0() - 0.5) * 30, z = -1.5 + R0() * 9; d.position.set(x, hgt(x, z) + 0.03, z); d.rotation.set(R0() * 3, R0() * 3, 0); d.scale.set(0.6 + R0() * 1.6, 0.5 + R0() * 0.6, 0.6 + R0() * 1.4); d.updateMatrix(); peb.setMatrixAt(i, d.matrix); peb.setColorAt(i, cc.setHSL(0.08 + R0() * 0.06, 0.08, 0.3 + R0() * 0.35)); } peb.receiveShadow = true; S.add(peb);
  const reedG = new T.ConeGeometry(0.02, 1.4, 4); reedG.translate(0, 0.7, 0); const reeds = new T.InstancedMesh(reedG, new T.MeshStandardMaterial({ color: 0x8a8a4a, roughness: 0.9 }), 160), reedL = [];
  for (let i = 0; i < 160; i++) { const x = (R0() < 0.5 ? -1 : 1) * (1.6 + R0() * 7), z = -1.8 - R0() * 2.5; reedL.push({ x, z, y: WATER - 0.1, s: 0.6 + R0() * 0.8, ph: R0() * 6 }); } S.add(reeds);
  // mist lying on the water
  const mt = (() => { const c = document.createElement('canvas'); c.width = 128; c.height = 32; const g = c.getContext('2d'), gr = g.createRadialGradient(64, 16, 0, 64, 16, 64); gr.addColorStop(0, 'rgba(255,255,255,.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 32); return new T.CanvasTexture(c); })();
  const mists = []; for (let i = 0; i < 9; i++) { const m = new T.Mesh(new T.PlaneGeometry(40, 6), new T.MeshBasicMaterial({ map: mt, transparent: true, opacity: 0.35, depthWrite: false, fog: true })); m.position.set((R0() - 0.5) * 60, WATER + 1 + R0() * 2, -12 - R0() * 50); S.add(m); mists.push({ m, ox: m.position.x, sp: 0.2 + R0() * 0.4 }); }
  // the shadow under the hanging stone, on top of the stack
  const shadow = new T.Mesh(new T.CircleGeometry(0.5, 24), new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25, depthWrite: false })); shadow.rotation.x = -Math.PI / 2; S.add(shadow);
  const aim = new T.Mesh(new T.CylinderGeometry(0.006, 0.006, 1, 4), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 })); S.add(aim);
  V3 = { T, S, grain, reeds, reedL, mists, shadow, aim, sky: null, gallery: [], galKey: '', ripples: [] };
  W3.setQuality(stepN); return V3;
}
// the cairns you finished, along the shore
function buildGallery(V) { const cs = HEADLESS ? {} : (store.get('cairns', {}) || {}), keys = Object.keys(cs).map(Number).sort((a, b) => a - b).slice(-14), key = keys.join(','); if (key === V.galKey) return; V.galKey = key;
  for (const m of V.gallery) V.S.remove(m); V.gallery = [];
  keys.forEach((L, i) => { const side = i % 2 ? 1 : -1, row = Math.floor(i / 2), x0 = side * (1.9 + row * 0.9), z0 = -3.2 - row * 2.2, sc = 0.55;      // each on its own rock in the shallows
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5, 1), new THREE.MeshStandardMaterial({ color: 0x5e5a54, roughness: 0.9 })); rock.scale.set(1.1, 0.5, 0.9); rock.position.set(x0, WATER - 0.05, z0); V.S.add(rock); V.gallery.push(rock); let y = WATER + 0.2;
    for (const [kind, x, w, h, seed] of cs[L].shape) { const st = { kind, w: w * sc, h: h * sc, seed }; const m = new THREE.Mesh(stoneGeo(st), stoneMat(kind)); m.position.set(x0 + x * sc, y, z0); m.castShadow = true; V.S.add(m); V.gallery.push(m); y += h * sc; } }); }
const SV = new (window.THREE ? THREE.Vector3 : Object)();
function scr(x, y, z) { if (!V3 || V3.none) return { x: W / 2 + x * 80, y: H * 0.6 - y * 80, front: true }; SV.set(x, y, z || 0); return W3.screen(SV); }
// ---------- events ----------
function onEvent(G, e) {
  const cx = W / 2, top = scr(0, topY(G), 0);
  switch (e.k) {
    case 'start': say(PLACES[G.place].name.toUpperCase(), cx, H * 0.26, '#f2f0e8', 22); say(`STACK ${G.cfg.goal} HIGH`, cx, H * 0.31, '#e8c88a', 22); sfx.go(); if (G.N <= 2) tip('drop', 'Tap anywhere to drop the stone. Drop it right over the middle.', 3.2); break;
    case 'drop': sfx.drop(); break;
    case 'pick': sfx.pick(); break;
    case 'place': { const p = scr(e.x, e.y, 0); sfx.click(G.stack.length); vibe(HAP.light); if (e.m < 0.12) { say('steady...', p.x, p.y - 30 * k, '#e8d8b8', 16); } break; }
    case 'perfect': { const p = scr(e.x, e.y, 0); sfx.click(G.stack.length); sfx.perfect(e.n); vibe(HAP.sharp); say(e.n > 1 ? `PERFECT ×${e.n}` : 'PERFECT', p.x, p.y - 34 * k, '#ffe9a8', 22 + Math.min(8, e.n * 2)); burst(p.x, p.y, '#fff3c8', 8 + e.n * 3, 90); if (G.N <= 3) tip('streak', 'Three perfect drops in a row and you find a stone on the shore', 3); break; }
    case 'found': sfx.found(); say('+1 STONE FOUND', cx, H * 0.36, '#ffe08a', 24); FX.flash = 0.35; break;
    case 'teeter': sfx.creak(); say('IT ROCKS...', cx, H * 0.38, '#ffcfb0', 22); vibe(HAP.light); break;
    case 'wobble': tip('wobble', 'Your stack leans: drop the next stone a little the other way, or use a slab', 3); break;
    case 'slip': sfx.slipOff(); say('OFF THE EDGE', cx, H * 0.38, '#ffb4a8', 20); break;
    case 'topple': sfx.tumble(e.n); FX.shake = 4; say(e.why === 'wind' ? 'THE BREEZE TOOK IT' : e.n > 1 ? `${e.n} STONES IN THE LAKE` : 'IT TIPPED', cx, H * 0.38, '#ffb4a8', 22); tumble(G, e.stones, e.why); break;
    case 'gustcoming': sfx.breeze(); say(e.dir > 0 ? 'BREEZE →' : '← BREEZE', cx, H * 0.2, '#cfe8ff', 20); tip('wind', 'A breeze is coming (see the reeds): a tall stack that leans may go. Wait for it to pass.', 3.4); break;
    case 'lessonnext': if (e.first) hint = null; say('FIRST, A LESSON', cx, H * 0.36, '#ffe08a', 24); sfx.go(); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, cx, H * 0.42, '#c8f0c8', 22); break;
    case 'lessonmiss': hint = { txt: e.how, t: 0, secs: 3.4 }; break;
    case 'lessondone': say('NOW YOUR CAIRN', cx, H * 0.36, '#ffe08a', 24); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); vibe(HAP.best); say('THE CAIRN STANDS', cx, H * 0.26, '#ffe9a8', 28); FX.flash = 0.6; break;
    case 'lost': sfx.lose(); say('OUT OF STONES', cx, H * 0.26, '#e8d8c8', 26); break;
  }
}
// stones that leave the stack roll off into the lake (each keeps its own shape)
function tumble(G, stones, why) { const dir = why === 'wind' ? Math.sign(G.wind || 1) : 0; for (const st of stones) { const m = st.mesh; if (!m) continue; const side = dir || Math.sign(st.x || (Math.random() - 0.5)) || 1; ui.fallen.push({ m, vx: side * (0.8 + Math.random()), vy: 0.5 + Math.random(), vz: -0.6 - Math.random(), sp: (Math.random() - 0.5) * 6, t: 0 }); st.mesh = null; } }
function dropToLake(G) { const f = ui.lastDrop; if (f && f.mesh) { ui.fallen.push({ m: f.mesh, vx: Math.sign(f.x || 1) * 1.2, vy: 0.3, vz: -0.8, sp: 4, t: 0 }); f.mesh = null; } }
function clearStonesUnused() { for (const f of ui.fallen) V3 && V3.S && V3.S.remove(f.m); ui.fallen = []; if (V3 && V3.S) { const keep = new Set(V3.gallery); V3.S.children.filter(o => o.isMesh && o.geometry && o.geometry.type === 'SphereGeometry' && o.material && MATS[Object.keys(MATS).find(q => MATS[q] === o.material)] && !keep.has(o)).forEach(o => V3.S.remove(o)); } }
// ---------- every frame in 3D ----------
function animate(g, t, dt) {
  const V = V3, S = g.stack, tee = g.teeter;
  // what is on the stack (a rocking stack rocks round the edge it is about to go over)
  const seen = new Set();
  S.forEach((st, i) => { const m = stoneMesh(st); seen.add(m); let rx = 0; if (tee && i >= tee.at) rx = Math.sin(t * 22) * 0.06 * (1 - tee.t); const lean = g.wind && i ? g.wind * 0.8 * (i / S.length) : 0;
    m.position.set(st.x, st.y, 0); m.rotation.set(0, st.rot, rx + lean * 0.1); m.visible = true; });
  // the swaying stone and the falling one
  if (g.hang) { const st = g.hang.st, m = stoneMesh(st); seen.add(m); const x = hangX(g), y = topY(g) + 1.4 + Math.sin(t * 2) * 0.03; m.position.set(x, y, 0); m.rotation.set(Math.sin(g.hang.ph) * 0.12, st.rot + t * 0.1, 0); m.visible = true; st.x = x;
    V.shadow.visible = true; V.shadow.position.set(x, topY(g) + 0.012, 0); V.shadow.scale.set(st.w * 0.9, st.w * 0.6, 1); V.shadow.material.opacity = 0.22;
    const showAim = upLv('eye') > 0 || g.N <= 2 || g.lesson; V.aim.visible = showAim; if (showAim) { V.aim.position.set(x, topY(g) + 0.7, 0); V.aim.scale.set(1, 1.4, 1); } }
  else { V.shadow.visible = false; V.aim.visible = false; }
  for (const f of g.falling) { const m = stoneMesh(f.st); seen.add(m); m.position.set(f.st.x, f.y, 0); m.visible = true; ui.lastDrop = f.st; }
  if (ui.lastDrop && ui.lastDrop.mesh && !seen.has(ui.lastDrop.mesh) && !S.includes(ui.lastDrop)) { const f = ui.lastDrop; ui.fallen.push({ m: f.mesh, vx: Math.sign(f.x || 1) * 1.2, vy: 0.3, vz: -0.8, sp: 4, t: 0 }); f.mesh = null; ui.lastDrop = null; } else if (ui.lastDrop && S.includes(ui.lastDrop)) ui.lastDrop = null;
  // basket stones are shown in 2D; hide their meshes
  for (const b of g.basket) if (b.mesh) b.mesh.visible = false;
  for (const f of ui.fallen) { f.t += dt; f.vy -= 9.8 * dt; f.m.position.x += f.vx * dt; f.m.position.y += f.vy * dt; f.m.position.z += f.vz * dt; f.m.rotation.x += f.sp * dt; f.m.rotation.z += f.sp * 0.7 * dt;
    if (f.m.position.y < WATER && !f.splash) { f.splash = true; sfx.splash(); const p = scr(f.m.position.x, WATER, f.m.position.z); burst(p.x, p.y, '#dff2ff', 14, 120); V.ripples.push({ x: f.m.position.x, z: f.m.position.z, t: 0 }); f.vy *= 0.2; f.vx *= 0.3; } }
  for (let i = ui.fallen.length - 1; i >= 0; i--) if (ui.fallen[i].t > 3) { V.S.remove(ui.fallen[i].m); ui.fallen.splice(i, 1); }
  // any stone no longer in the game (a lesson's, the last run's) leaves the scene
  const fm = new Set(ui.fallen.map(f => f.m)); for (const m of ui.shown) if (!seen.has(m) && !fm.has(m)) { if (ui.lastDrop && ui.lastDrop.mesh === m) continue; V.S.remove(m); } ui.shown = [...seen, ...(ui.lastDrop && ui.lastDrop.mesh ? [ui.lastDrop.mesh] : [])];
  // reeds bend before the breeze arrives; mist drifts
  const gust = g.gust, bend = gust ? gust.dir * (gust.t < 1.6 ? gust.t / 1.6 : gust.t < 4.4 ? 1 : Math.max(0, 1 - (gust.t - 4.4))) * 0.4 : 0;
  V.reedL.forEach((r, i) => { DUMMY.position.set(r.x, r.y, r.z); DUMMY.rotation.set(Math.sin(t * 1.2 + r.ph) * 0.05, 0, -bend - Math.sin(t * 1.7 + r.ph) * 0.04); DUMMY.scale.set(1, r.s, 1); DUMMY.updateMatrix(); V.reeds.setMatrixAt(i, DUMMY.matrix); }); V.reeds.instanceMatrix.needsUpdate = true;
  for (const ms of V.mists) { ms.m.position.x = ms.ox + Math.sin(t * 0.05 * ms.sp) * 6 + bend * 8; }
}
const DUMMY = new (window.THREE ? THREE.Object3D : Object)();
function placeCam(g, dt) {
  const cam = W3.cam, asp = innerWidth / innerHeight, top = topY(g) + (g.hang ? 1.4 : 0.5);
  cam.fov = 46; cam.aspect = asp; cam.updateProjectionMatrix();
  const half = Math.tan(23 * Math.PI / 180), needW = 3.4, needH = top + 2.2, dist = Math.max(needW / (2 * half * Math.min(1, asp)), needH / (2 * half) * 1.05, 5.5);
  const want = { y: top * 0.5 + 0.3, d: dist }; if (!ui.cam || ui.snap) { ui.cam = Object.assign({}, want); ui.snap = false; }
  const c = ui.cam, e = 1 - Math.exp(-dt * 2); c.y += (want.y - c.y) * e; c.d += (want.d - c.d) * e;
  const sh = FX.shake ? (Math.random() - 0.5) * FX.shake * 0.01 : 0; cam.position.set(sh, c.y + c.d * 0.12 + sh, c.d); cam.lookAt(0, c.y, 0); cam.updateMatrixWorld();
}
let IG = null; function idleG() { if (!IG || IG.over) { IG = newGame(Math.max(2, store.get('level', 1) | 0), { seed: (Math.random() * 1e6) | 0 }); IG.mem = {}; ui.snap = true; } honest(IG, { react: 0.2, acc: 0.97 }, IG.mem); step(IG, 1 / 60); for (const e of IG.ev) if (e.k === 'topple') tumble(IG, e.stones, e.why); IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#1a2422'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D lake.', W / 2, H / 2); return; }
  const g = G || idleG(), t = now;
  if (ui.game !== g) { if (ui.game) for (const st of [...ui.game.stack, ...(ui.game.hang ? [ui.game.hang.st] : []), ...ui.game.falling.map(f => f.st), ...ui.game.basket]) if (st.mesh) { V.S.remove(st.mesh); st.mesh = null; } ui.game = g; buildGallery(V); }
  if (V.sky !== g.sky) { V.sky = g.sky; W3.setSky(g.sky, { azim: 150, wind: [0.3, 0.2] }); }
  placeCam(g, dt); animate(g, t, dt); W3.setFocus(0, topY(g) * 0.5, 0, 4 + topY(g) * 0.6); W3.render(dt);
  if (G) hud(G, t);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 1.2 ? 1 : 1 - (t2.t - 1.2) / 0.4; ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(t2.size * k)}px ${TF}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(20,24,22,.55)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 14); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 14); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.3, (hint.secs - hint.t) / 0.5); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30;
    ctx.fillStyle = 'rgba(26,34,32,.84)'; rrect(W / 2 - w / 2, H * 0.7 - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.7 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,248,225,${FX.flash * 0.25})`; ctx.fillRect(0, 0, W, H); }
}
// ---------- the 2D layer ----------
function panel(x, y, w, h) { ctx.fillStyle = 'rgba(22,30,28,.66)'; rrect(x, y, w, h, 14); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.1)'; ctx.lineWidth = 1.5; rrect(x, y, w, h, 14); ctx.stroke(); }
function stoneIcon(x, y, st, s) { const hx = n => '#' + n.toString(16).padStart(6, '0'); ctx.fillStyle = hx(KINDS[st.kind].col); ctx.beginPath(); ctx.ellipse(x, y, st.w * s / 2, st.h * s / 2, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.ellipse(x - st.w * s * 0.12, y - st.h * s * 0.15, st.w * s * 0.22, st.h * s * 0.18, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - st.top * s, y - st.h * s / 2 + 1); ctx.lineTo(x + st.top * s, y - st.h * s / 2 + 1); ctx.stroke(); }
function hud(G, t) {
  const c = G.cfg; ctx.textBaseline = 'middle';
  if (!G.lesson) { const x = 12, y = 48 * k, w = W - 24, h = 52 * k; panel(x, y, w, h);
    ctx.textAlign = 'left'; ctx.font = `700 ${Math.round(18 * k)}px ${TF}`; ctx.fillStyle = '#f2f0e8'; ctx.fillText(`${G.stack.length} / ${c.goal}`, x + 12, y + 17 * k);
    ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.72)'; ctx.fillText('stones high', x + 12, y + 36 * k);
    const best = HEADLESS ? 0 : ((store.get('bestH', {}) || {})[G.N] | 0), pw = Math.min(16 * k, (w - 140 * k) / c.goal - 3), px0 = x + w - 12 - c.goal * (pw + 3);
    for (let i = 0; i < c.goal; i++) { const on = i < G.stack.length; ctx.fillStyle = on ? '#e8c88a' : 'rgba(255,255,255,.16)'; rrect(px0 + i * (pw + 3), y + 10 * k, pw, 12 * k, 4 * k); ctx.fill();
      if (best && i === best - 1 && best > G.stack.length) { ctx.strokeStyle = 'rgba(200,230,255,.9)'; ctx.lineWidth = 1.5; ctx.setLineDash([2, 2]); rrect(px0 + i * (pw + 3) - 2, y + 8 * k, pw + 4, 16 * k, 5 * k); ctx.stroke(); ctx.setLineDash([]); } }
    ctx.textAlign = 'right'; ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillText(`${G.left} stones left · perfect ${'●'.repeat(G.inRow % 3)}${'○'.repeat(2 - G.inRow % 3 + 1)} · 🪙 ${G.coins}`, x + w - 12, y + 36 * k);
    if (G.left - (G.hang ? 1 : 0) - G.basket.length <= 0 && G.left <= c.goal - G.stack.length) { ctx.textAlign = 'center'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = '#ffcfb0'; ctx.fillText('no stones to spare: every one counts', W / 2, y + h + 12 * k); }
  } else lessonPanel(G);
  // your basket: the two stones waiting; tap one to take it next
  ui.basket = []; const bw = 74 * k, bh = 52 * k, by = H - bh - 22 * k;
  ctx.textAlign = 'left'; ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.75)'; if (G.basket.length) ctx.fillText('basket · tap to use next', 14, by - 10 * k);
  G.basket.forEach((st, i) => { const bx = 12 + i * (bw + 10); ui.basket.push({ x: bx, y: by, w: bw, h: bh }); ctx.fillStyle = 'rgba(22,30,28,.72)'; rrect(bx, by, bw, bh, 12); ctx.fill(); ctx.strokeStyle = 'rgba(232,200,138,.5)'; ctx.lineWidth = 1.5; rrect(bx, by, bw, bh, 12); ctx.stroke();
    stoneIcon(bx + bw / 2, by + bh * 0.42, st, 34 * k); ctx.textAlign = 'center'; ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillText(KINDS[st.kind].name, bx + bw / 2, by + bh - 9 * k); });
  if (G.hang) { const st = G.hang.st, p = scr(hangX(G), topY(G) + 1.4 + st.h + 0.15, 0); ctx.textAlign = 'center'; ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillText(KINDS[st.kind].name.toLowerCase(), p.x, p.y); }
  if (G.t < 6 && G.N <= 2 && !G.over && !G.stack.length) { ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 3); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText('tap anywhere to drop', W / 2, by - 34 * k); ctx.globalAlpha = 1; }
  if (G.gust) { const g2 = G.gust, a = g2.t < 5.4 ? Math.min(1, g2.t * 2, (5.4 - g2.t) * 2) : 0; ctx.globalAlpha = a * 0.8; ctx.strokeStyle = '#dff0ff'; ctx.lineWidth = 2 * k; for (let i = 0; i < 4; i++) { const yy = H * (0.3 + i * 0.09), ph = (t * 140 * g2.dir + i * 90) % W, x0 = g2.dir > 0 ? ph : W - Math.abs(ph); ctx.beginPath(); ctx.moveTo(x0, yy); ctx.quadraticCurveTo(x0 + 20 * k * g2.dir, yy - 6 * k, x0 + 44 * k * g2.dir, yy); ctx.stroke(); } ctx.globalAlpha = 1; }
}
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) {
  const D = G.lesson, st = D.steps[D.i], x = 12, w = W - 24, y = 48 * k; ctx.save();
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; const lines = wrapText(st.how, w - 24), h = 50 * k + lines.length * 17 * k;
  ctx.fillStyle = 'rgba(22,30,28,.86)'; rrect(x, y, w, h, 12); ctx.fill(); ctx.strokeStyle = 'rgba(232,200,138,.7)'; ctx.lineWidth = 2; rrect(x, y, w, h, 12); ctx.stroke();
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#e8c88a'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillText(`LESSON ${G.N} OF 3 · ${D.n} OF ${st.need}`, x + 12, y + 9 * k);
  ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(16 * k)}px ${TF}`; ctx.fillText(st.title, x + 12, y + 24 * k);
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.92)'; lines.forEach((l, i) => ctx.fillText(l, x + 12, y + 46 * k + i * 17 * k));
  ctx.restore(); ctx.textBaseline = 'middle';
}
