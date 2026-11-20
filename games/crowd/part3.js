
// ===================== THE VIEW: Crowd Run in 3D (three.js; sky, light, shadows from tools/world3d.js) =====================
// A white track over the sea (or a canyon, ice, lava), seen from behind the crowd: the track runs away up the screen. Gates
// are glass panels with big numbers (blue when they help, red when they hurt); saws spin and slide, bars sweep, hammers
// swing; red crowds wait; a giant at the end; then the bonus stairs. The crowd is one instanced mesh of little runners.
// The game's x is flipped for drawing (we look along +z, so the game's left is the picture's left).
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { snap: true, drag: null, cam: null };
const X = x => -x;
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 160) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80 * k, t: 0, life: 0.5 + Math.random() * 0.4, col, r: (1.5 + Math.random() * 2.5) * k }); } if (PARTS.length > 300) PARTS.splice(0, PARTS.length - 300); }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2.5); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.4) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 420 * dt; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; } }
const hex = n => '#' + n.toString(16).padStart(6, '0');
function myCol() { if (typeof HEADLESS !== 'undefined' && HEADLESS) return COLORS[0]; const id = store.get('col', 'blue'); return COLORS.find(q => q.id === id) || COLORS[0]; }
// ---------- the world ----------
function runnerGeo(T, s = 1) { const g1 = new T.CylinderGeometry(0.13 * s, 0.16 * s, 0.55 * s, 8); g1.translate(0, 0.42 * s, 0); const g2 = new T.SphereGeometry(0.13 * s, 10, 8); g2.translate(0, 0.85 * s, 0);
  const g3 = new T.CylinderGeometry(0.05 * s, 0.05 * s, 0.3 * s, 6); g3.translate(0.07 * s, 0.15 * s, 0); const g4 = g3.clone(); g4.translate(-0.14 * s, 0, 0); return merge(T, [g1, g2, g3, g4]); }
function merge(T, gs) { let n = 0; const ng = gs.map(g => { const q = g.index ? g.toNonIndexed() : g; n += q.attributes.position.count; return q; });
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3); let o = 0; for (const g of ng) { pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); o += g.attributes.position.count; }
  const out = new T.BufferGeometry(); out.setAttribute('position', new T.BufferAttribute(pos, 3)); out.setAttribute('normal', new T.BufferAttribute(nor, 3)); return out; }
function buildWorld() {
  if (V3) return V3; const T = window.THREE; if (!T || !W3 || !W3.init({ canvas: $('gl'), fov: 55, far: 2500, near: 0.3 })) { V3 = { none: true }; return V3; }
  V3 = { T, S: W3.scene, built: null }; const V = V3;
  V.rg = runnerGeo(T); V.runMat = new T.MeshStandardMaterial({ color: 0x2a8aff, roughness: 0.5 }); V.crowd = new T.InstancedMesh(V.rg, V.runMat, MAXM); V.crowd.castShadow = true; V.crowd.frustumCulled = false; V.crowd.instanceMatrix.setUsage(T.DynamicDrawUsage); V.S.add(V.crowd);
  V.foeMat = new T.MeshStandardMaterial({ color: 0xe8343a, roughness: 0.5 }); V.foes = new T.InstancedMesh(V.rg, V.foeMat, 600); V.foes.castShadow = true; V.foes.frustumCulled = false; V.foes.instanceMatrix.setUsage(T.DynamicDrawUsage); V.S.add(V.foes);
  V.greyMat = new T.MeshStandardMaterial({ color: 0xb0b4bc, roughness: 0.6 }); V.greys = new T.InstancedMesh(V.rg, V.greyMat, 200); V.greys.frustumCulled = false; V.greys.instanceMatrix.setUsage(T.DynamicDrawUsage); V.S.add(V.greys);
  V.giant = new T.Mesh(runnerGeo(T, 7), new T.MeshStandardMaterial({ color: 0x8a2a3a, roughness: 0.4 })); V.giant.castShadow = true; V.S.add(V.giant);
  W3.setQuality(stepN); return V; }
const M4 = window.THREE ? new THREE.Matrix4() : null, Q4 = window.THREE ? new THREE.Quaternion() : null, E4 = window.THREE ? new THREE.Euler() : null, P4 = window.THREE ? new THREE.Vector3() : null, S4 = window.THREE ? new THREE.Vector3() : null;
function gateTex(T, g, good) { const c = document.createElement('canvas'); c.width = 256; c.height = 160; const x = c.getContext('2d');
  x.fillStyle = good ? 'rgba(40,150,255,.55)' : 'rgba(255,50,60,.55)'; x.fillRect(0, 0, 256, 160); x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = 8; x.strokeRect(4, 4, 248, 152);
  x.fillStyle = '#fff'; x.font = `400 92px ${TF}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(gateTxt(g), 128, 86); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t; }
function labelTex(T, txt, col = '#fff', bg = 'rgba(0,0,0,0)') { const c = document.createElement('canvas'); c.width = 256; c.height = 96; const x = c.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, 256, 96); x.fillStyle = col; x.font = `400 64px ${TF}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineWidth = 8; x.strokeStyle = 'rgba(0,0,0,.5)'; x.strokeText(txt, 128, 50); x.fillText(txt, 128, 50); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t; }
// one track: the deck (in pieces, with gaps for the bridges), the sea under it, every gate, obstacle, crowd and coin
function buildTrack(V, g) { const T = V.T; if (V.trk) { V.S.remove(V.trk); V.trk.traverse(o => { if (o.geometry && o.userData.own) o.geometry.dispose(); if (o.material && o.material.map && o.userData.own) o.material.map.dispose(); }); }
  const grp = new T.Group(); V.trk = grp; V.S.add(grp); V.built = g; const pl = PLACES[g.place]; W3.setSky(pl.sky);
  const own = m => { m.userData.own = 1; grp.add(m); return m; };
  own(new T.Mesh(new T.PlaneGeometry(2000, 2000), new T.MeshStandardMaterial({ color: pl.sea, roughness: 0.35, metalness: 0.1 }))).rotation.x = -Math.PI / 2; grp.children[0].position.set(0, -6, g.len / 2);
  const deck = new T.MeshStandardMaterial({ color: pl.track, roughness: 0.7 }), edge = new T.MeshStandardMaterial({ color: 0xffb030, roughness: 0.5 });
  const end = g.boss.z + 40, cuts = g.items.filter(o => o.type === 'bridge').map(o => [o.z, o.z1]); let z0 = -20;
  for (const [a, b] of [...cuts, [end, end]]) { if (a > z0) { const L = a - z0; const m = own(new T.Mesh(new T.BoxGeometry(HW * 2, 0.6, L), deck)); m.position.set(0, -0.3, z0 + L / 2); m.receiveShadow = true;
      for (const s of [-1, 1]) { const r = own(new T.Mesh(new T.BoxGeometry(0.2, 0.25, L), edge)); r.position.set(s * (HW + 0.1), 0.1, z0 + L / 2); } } z0 = b; }
  // stripes across the deck every 6 m, and a finish line
  for (let z = 6; z < g.boss.z; z += 6) { if (cuts.some(([a, b]) => z > a && z < b)) continue; const m = own(new T.Mesh(new T.PlaneGeometry(HW * 2, 0.25), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 }))); m.rotation.x = -Math.PI / 2; m.position.set(0, 0.01, z); }
  V.objs = [];
  for (const o of g.items) {
    if (o.type === 'gate') { o.view = []; [0, 1].forEach(sd => { const gg = o.ops[sd], good = apply(gg, 100) >= 100, m = own(new T.Mesh(new T.PlaneGeometry(HW - 0.15, 2.4), new T.MeshBasicMaterial({ map: gateTex(T, gg, good), transparent: true, side: T.DoubleSide, depthWrite: false }))); m.userData.own = 1; m.rotation.y = Math.PI; m.position.set(X(sd ? HW / 2 : -HW / 2), 1.3, o.z); o.view.push(m);
        const post = own(new T.Mesh(new T.BoxGeometry(0.18, 2.7, 0.18), new T.MeshStandardMaterial({ color: 0xffffff }))); post.position.set(X(sd ? HW : -HW), 1.35, o.z); }); const mid = own(new T.Mesh(new T.BoxGeometry(0.18, 2.7, 0.18), new T.MeshStandardMaterial({ color: 0xffffff }))); mid.position.set(0, 1.35, o.z); }
    if (o.type === 'saw') { const m = own(new T.Mesh(new T.CylinderGeometry(o.r, o.r, 0.12, 24), new T.MeshStandardMaterial({ color: 0xd8dce4, metalness: 0.8, roughness: 0.25 }))); m.rotation.x = Math.PI / 2; m.castShadow = true;
      const teeth = new T.Mesh(new T.TorusGeometry(o.r, 0.07, 4, 16), new T.MeshStandardMaterial({ color: 0xe8343a })); m.add(teeth); teeth.rotation.x = Math.PI / 2; const slot = own(new T.Mesh(new T.BoxGeometry(o.amp * 2 + o.r * 2, 0.05, 0.3), new T.MeshBasicMaterial({ color: 0x222222 }))); slot.position.set(X(o.x0), 0.02, o.z); o.view = m; }
    if (o.type === 'bar') { const grp2 = new T.Group(), post = new T.Mesh(new T.CylinderGeometry(0.25, 0.3, 1.0, 12), new T.MeshStandardMaterial({ color: 0x555a64 })); post.position.y = 0.5; const bar = new T.Mesh(new T.BoxGeometry(o.len * 2, 0.3, 0.3), new T.MeshStandardMaterial({ color: 0xff5a2a })); bar.position.y = 0.7; bar.castShadow = true; grp2.add(post, bar); grp2.position.set(0, 0, o.z); own(grp2); o.view = grp2; }
    if (o.type === 'hammer') { const grp2 = new T.Group(), arm = new T.Mesh(new T.BoxGeometry(0.15, 3.1, 0.15), new T.MeshStandardMaterial({ color: 0x666a74 })); arm.position.y = -1.55; const head = new T.Mesh(new T.CylinderGeometry(0.55, 0.55, 1.0, 14), new T.MeshStandardMaterial({ color: 0xc83a2a })); head.rotation.x = Math.PI / 2; head.position.y = -2.85; head.castShadow = true; grp2.add(arm, head); grp2.position.set(0, 3.4, o.z);
      const frame = own(new T.Mesh(new T.BoxGeometry(HW * 2 + 0.6, 0.25, 0.25), new T.MeshStandardMaterial({ color: 0x666a74 }))); frame.position.set(0, 3.3, o.z); own(grp2); o.view = grp2; }
    if (o.type === 'wall') { const m = own(new T.Mesh(new T.BoxGeometry(HW, 1.6, 0.5), new T.MeshStandardMaterial({ color: 0xe84a3a, roughness: 0.6 }))); m.position.set(X(o.side * HW / 2), 0.8, o.z); m.castShadow = true;
      const s2 = own(new T.Mesh(new T.BoxGeometry(HW + 0.02, 0.25, 0.52), new T.MeshStandardMaterial({ color: 0xffffff }))); s2.position.set(X(o.side * HW / 2), 1.1, o.z); }
    if (o.type === 'bridge') { const m = own(new T.Mesh(new T.BoxGeometry(o.hw * 2, 0.4, o.z1 - o.z + 0.4), new T.MeshStandardMaterial({ color: 0xb07a40, roughness: 0.8 }))); m.position.set(X(o.x), -0.2, (o.z + o.z1) / 2); m.receiveShadow = true; }
    if (o.type === 'coin') { const m = own(new T.Mesh(new T.CylinderGeometry(0.28, 0.28, 0.07, 16), new T.MeshStandardMaterial({ color: 0xffd040, metalness: 0.7, roughness: 0.3, emissive: 0x403000 }))); m.rotation.order = 'YXZ'; m.rotation.x = Math.PI / 2; m.position.set(X(o.x), 0.6, o.z); o.view = m; }
    if (o.type === 'enemy' || o.type === 'recruit') { const lb = own(new T.Sprite(new T.SpriteMaterial({ map: labelTex(T, o.type === 'enemy' ? String(o.n) : '+' + o.n, o.type === 'enemy' ? '#ff8a8a' : '#e8e8e8'), depthWrite: false }))); lb.scale.set(2.4, 0.9, 1); lb.position.set(X(o.type === 'recruit' ? o.x : 0), 2.4, o.z + (o.type === 'enemy' ? 1 : 0)); o.label = lb; }
  }
  // the giant's stand, and the stairs beyond
  { const bz = g.boss.z, base = own(new T.Mesh(new T.BoxGeometry(HW * 2 + 2, 0.6, 8), new T.MeshStandardMaterial({ color: 0x8a6ad0 }))); base.position.set(0, -0.3, bz + 2);
    for (let i = 0; i < 10; i++) { const st = own(new T.Mesh(new T.BoxGeometry(HW * 2, 0.5, 1.6), new T.MeshStandardMaterial({ color: new T.Color().setHSL(i / 10, 0.7, 0.55) }))); st.position.set(0, 0.25 + i * 0.5, bz + 7 + i * 1.6); st.receiveShadow = true;
      const lb = own(new T.Sprite(new T.SpriteMaterial({ map: labelTex(T, `x${1 + (i + 1) * 0.5}`), depthWrite: false }))); lb.scale.set(1.8, 0.7, 1); lb.position.set(0, 0.9 + i * 0.5, bz + 7 + i * 1.6); }
    V.giant.position.set(0, 0, bz + 1); V.giant.rotation.y = Math.PI; V.giant.scale.setScalar(1); V.giant.visible = true;
    V.hpLabel = own(new T.Sprite(new T.SpriteMaterial({ map: labelTex(T, String(g.hp), '#ffd0d0'), depthWrite: false }))); V.hpLabel.scale.set(5, 1.9, 1); V.hpLabel.position.set(0, 8.6, bz + 1); V.hpShown = g.hp; }
  V.flyers = []; }
function sync(V, g, dt) { const T = V.T, t = g.t;
  V.runMat.color.setHex(myCol().col);
  // the runners: each at its place, bobbing as it runs
  let n = 0; const run = !g.battle && !g.done && !g.over, d = g.d;
  for (const m of g.mem) { const bob = run ? Math.abs(Math.sin(m.ph)) * 0.12 : 0; let y = bob, z = d + m.z;
    if (g.done) { const st = Math.min(g.stair, 10); y = 0.5 * st + bob; z = Math.max(z, g.boss.z + 6 + st * 1.6 - 1 + m.z * 0.3); }
    E4.set(run ? 0.15 : 0, 0, run ? Math.sin(m.ph) * 0.12 : 0); Q4.setFromEuler(E4); P4.set(X(m.x), y, z); S4.set(1, 1, 1); M4.compose(P4, Q4, S4); V.crowd.setMatrixAt(n++, M4); if (n >= MAXM) break; }
  V.crowd.count = n; V.crowd.instanceMatrix.needsUpdate = true;
  // red crowds and grey runners waiting
  let nf = 0, ng = 0; for (const o of g.items) { if (o.z > d + 60 || o.z < d - 10) continue;
    if (o.type === 'enemy') { const left = o.done ? (o.left | 0) : o.n, m = Math.min(left, 200); for (let i = 0; i < m && nf < 600; i++) { const s = slotOff(i, m); const bat = g.battle && g.battle.foe === o; E4.set(bat ? -0.2 : 0, Math.PI, 0); Q4.setFromEuler(E4); P4.set(X(s[0]), bat ? Math.abs(Math.sin(t * 14 + i)) * 0.15 : 0, o.z + 1 + Math.abs(s[1]) * 1.2); M4.compose(P4, Q4, S4.set(1, 1, 1)); V.foes.setMatrixAt(nf++, M4); }
      if (o.label) { o.label.visible = left > 0; if (o.shown !== left) { o.shown = left; o.label.material.map.dispose(); o.label.material.map = labelTex(T, String(left), '#ff8a8a'); } } }
    if (o.type === 'recruit' && !o.done) { for (let i = 0; i < Math.min(o.n, 20); i++) { const s = slotOff(i, o.n); E4.set(0, Math.PI + Math.sin(t * 3 + i), 0); Q4.setFromEuler(E4); P4.set(X(o.x + s[0]), Math.abs(Math.sin(t * 6 + i)) * 0.1, o.z + s[1]); M4.compose(P4, Q4, S4.set(1, 1, 1)); V.greys.setMatrixAt(ng++, M4); } }
    if (o.type === 'recruit' && o.done && o.label) o.label.visible = false;
    if (o.type === 'saw' && o.view) { o.view.position.set(X(sawX(o, t)), o.r * 0.6, o.z); o.view.rotation.y = t * 12; }
    if (o.type === 'bar' && o.view) o.view.rotation.y = barA(o, t);
    if (o.type === 'hammer' && o.view) o.view.rotation.z = Math.asin(clamp(X(hamX(o, t)) / 3.1, -1, 1));
    if (o.type === 'coin' && o.view) { o.view.visible = !o.done; o.view.rotation.y = t * 3; }
    if (o.type === 'gate' && o.done && o.view) o.view.forEach((m, i) => { m.material.opacity = Math.max(0, (m.material.opacity ?? 1) - dt * 2); if (i === o.took) m.scale.y = 1 + Math.sin(t * 20) * 0.03; }); }
  V.foes.count = nf; V.foes.instanceMatrix.needsUpdate = true; V.greys.count = ng; V.greys.instanceMatrix.needsUpdate = true;
  // the giant: shrinks as he is beaten; his number counts down
  const B = g.boss, lf = Math.max(0, B.left | 0); V.giant.visible = lf > 0; V.giant.scale.setScalar(0.6 + 0.4 * lf / Math.max(1, B.hp)); V.giant.rotation.z = g.battle && g.battle.boss ? Math.sin(t * 20) * 0.04 : 0;
  if (V.hpShown !== lf) { V.hpShown = lf; V.hpLabel.material.map.dispose(); V.hpLabel.material.map = labelTex(T, String(lf), '#ffd0d0'); V.hpLabel.visible = lf > 0; }
  // the camera: behind the crowd, higher for a bigger crowd; to the side at the giant and the stairs
  const br = blobR(g), want = g.done ? { x: 6, y: 9, z: g.boss.z + 2 + g.stair * 1.2, lx: 0, lz: g.boss.z + 9 + g.stair * 1.6 } : { x: X(g.cx) * 0.35, y: 7 + br * 1.4, z: d - 7.5 - br * 1.2, lx: X(g.cx) * 0.15, lz: d + 8 };
  if (ui.snap || !ui.cam) { ui.cam = Object.assign({}, want); ui.snap = false; } const c = ui.cam, kk = Math.min(1, dt * 5); for (const key in want) c[key] += (want[key] - c[key]) * kk;
  const cam = W3.cam, asp = innerWidth / innerHeight, sh = FX.shake ? (Math.random() - 0.5) * FX.shake * 0.03 : 0; cam.fov = asp < 0.8 ? 62 : 50; cam.aspect = asp; cam.updateProjectionMatrix();
  cam.position.set(c.x + sh, c.y + sh, c.z); cam.lookAt(c.lx, 0, c.lz); cam.updateMatrixWorld(); W3.setFocus(0, 0, d + 6, 20 + br * 2); }
const SV = window.THREE ? new THREE.Vector3() : null;
function scr(x, y, z) { if (!V3 || V3.none) return { x: W / 2, y: H / 2 }; SV.set(X(x), y, z); return W3.screen(SV); }
// ---------- what each happening looks like ----------
function onEvent(G, e) { const cx = W / 2, cp = () => scr(G.cx, 1.5, G.d);
  switch (e.k) {
    case 'start': case 'track': if (V3 && !V3.none) V3.built = null; ui.snap = true; if (e.k === 'start') { say(`LEVEL ${G.N}`, cx, H * 0.3, '#fff', 30); sfx.start(); if (G.N <= 1) tip('how', 'Slide left and right. Run through the gate that makes your crowd BIGGER!', 3.4); if (G.N === 2) tip('foe', 'Red crowds fight you one for one. Be bigger!', 3); if (G.N === 5) tip('bridge', 'Bridges! Line your crowd up with the planks.', 3); } break;
    case 'gate': { const p = cp(); if (e.after > e.before) { sfx.gateUp(e.after / Math.max(1, e.before)); say(gateTxt(e.g), p.x, p.y - 40 * k, '#8ad0ff', 26); burst(p.x, p.y, hex(myCol().col), 14, 200); vibe(HAP.light); } else { sfx.gateDown(); say(gateTxt(e.g), p.x, p.y - 40 * k, '#ff8a8a', 26); FX.red = 0.7; vibe(HAP.fail); if (!e.best) tip('worse', 'Ouch: the other gate was better. Look at both numbers!', 2.6); } } break;
    case 'shrink': for (const m of e.at.slice(0, 8)) { const p = scr(m.x, 0.6, G.d + m.z); burst(p.x, p.y, '#ff8a8a', 3, 120); } break;
    case 'hit': { sfx.hit(e.n, e.why); for (const m of e.at.slice(0, 6)) { const p = scr(m.x, 0.6, G.d + m.z); burst(p.x, p.y, e.why === 'fall' ? '#8ac8ff' : hex(myCol().col), 4, 160); } FX.shake = Math.min(8, 2 + e.n / 4); if (e.why === 'fall') tip('fall', 'Off the planks means into the water: line up with the bridge!', 2.6); } break;
    case 'fight': sfx.fight(); FX.shake = 6; break;
    case 'clash': if (Math.random() < 0.4) sfx.clash(); if (Math.random() < 0.3) { const p = cp(); burst(p.x + (Math.random() - 0.5) * 60 * k, p.y - 20 * k, Math.random() < 0.5 ? '#ff5a5a' : hex(myCol().col), 3, 140); } break;
    case 'won1': sfx.won1(); { const p = cp(); say('WON!', p.x, p.y - 50 * k, '#ffe08a', 22); } break;
    case 'join': sfx.join(e.n); { const p = scr(e.x, 1.5, e.z); say(`+${e.n}`, p.x, p.y - 30 * k, '#e8e8e8', 22); } break;
    case 'coin': sfx.coin(); break;
    case 'boss': sfx.boss(); say('THE GIANT!', cx, H * 0.3, '#ff9a9a', 30); FX.shake = 10; break;
    case 'giant': sfx.goal(); FX.flash = 0.5; say('GIANT DOWN!', cx, H * 0.32, '#ffd040', 32); vibe(HAP.best); break;
    case 'stair': sfx.stair(e.s); say(`x${1 + e.s * 0.5}`, cx + (e.s % 2 ? 60 : -60) * k, H * 0.42, '#fff', 20 + e.s * 1.5); break;
    case 'top': break;
    case 'beaten': sfx.lose(); FX.red = 1; FX.shake = 12; break;
    case 'wiped': sfx.lose(); FX.red = 1; break;
    case 'lessonnext': if (e.first) hint = null; say('FIRST, A LESSON', cx, H * 0.3, '#ffe08a', 20); break;
    case 'lessonok': break;
    case 'lessonmiss': hint = { txt: e.how, t: 0, secs: 3.4 }; break;
    case 'lessondone': say('YOU\'VE GOT IT!', cx, H * 0.3, '#ffe08a', 26); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); break;
    case 'lost': break;
  } }
// ---------- every frame ----------
let IG = null; function idleG() { if (!IG || IG.over) { IG = newGame(Math.max(3, store.get('level', 1) | 0), { seed: (Math.random() * 1e6) | 0 }); IG.mem2 = {}; ui.snap = true; } honest(IG, { react: 0.3, acc: 0.95 }, IG.mem2); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#1a2a3a'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D track.', W / 2, H / 2); return; }
  const g = G || idleG(); if (V.built !== g) { buildTrack(V, g); ui.snap = true; }
  sync(V, g, dt);
  W3.render(dt);
  if (G) hud(G, now);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 0.9 ? 1 : 1 - (t2.t - 0.9) / 0.5; ctx.globalAlpha = Math.max(0, al); const sc = t2.t < 0.12 ? 1.3 - t2.t / 0.12 * 0.3 : 1; ctx.font = `400 ${Math.round(t2.size * k * sc)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(10,20,40,.6)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 20); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 20); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30;
    ctx.fillStyle = 'rgba(10,20,40,.88)'; rrect(W / 2 - w / 2, H * 0.2 - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.2 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,40,40,${FX.red * 0.2})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,250,235,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); } }
// ---------- the 2D layer ----------
function hud(G, t) { ctx.textBaseline = 'middle';
  // the crowd's number, over the crowd
  if (G.n > 0) { const p = scr(G.cx, 1.3 + blobR(G) * 0.5, G.d + (G.done ? 0 : 0)); const pp = G.done ? { x: W / 2, y: H * 0.55 } : p; ctx.font = `400 ${Math.round(24 * k)}px ${TF}`; ctx.textAlign = 'center'; const w = ctx.measureText(G.n).width + 22 * k;
    ctx.fillStyle = hex(myCol().col); rrect(pp.x - w / 2, pp.y - 46 * k, w, 30 * k, 15 * k); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillText(G.n, pp.x, pp.y - 30 * k); }
  if (G.lesson) { lessonPanel(G); return; }
  const w = Math.min(240 * k, W * 0.6), x0 = W / 2 - w / 2, y0 = 66 * k, p = clamp(G.d / G.boss.z, 0, 1);
  ctx.fillStyle = 'rgba(10,20,40,.35)'; rrect(x0 - 26 * k, y0 - 16 * k, w + 52 * k, 32 * k, 16 * k); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.35)'; rrect(x0, y0 - 5 * k, w, 10 * k, 5 * k); ctx.fill(); ctx.fillStyle = '#fff'; rrect(x0, y0 - 5 * k, Math.max(10 * k, w * p), 10 * k, 5 * k); ctx.fill();
  for (const [x, n, on] of [[x0 - 12 * k, G.N, true], [x0 + w + 12 * k, '☠', p >= 1]]) { ctx.fillStyle = on ? '#ffffff' : 'rgba(255,255,255,.4)'; ctx.beginPath(); ctx.arc(x, y0, 13 * k, 0, TAU); ctx.fill(); ctx.fillStyle = '#2a3a5a'; ctx.font = `400 ${Math.round(12 * k)}px ${TF}`; ctx.textAlign = 'center'; ctx.fillText(n, x, y0 + 1); }
  ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = '#ffe08a'; ctx.textAlign = 'right'; ctx.fillText(`🪙 ${G.coins}`, W - 14, y0 + 30 * k); ctx.textAlign = 'left'; ctx.fillStyle = '#ffd0d0'; ctx.fillText(`GIANT ${G.hp}`, 14, y0 + 30 * k);
  if (G.N <= 1 && G.d < 18 && !ui.drag) { ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 4); ctx.font = `400 ${Math.round(14 * k)}px ${TF}`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText('← SLIDE TO STEER →', W / 2, H - 90 * k); ctx.globalAlpha = 1; } }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { const D = G.lesson, st = D.steps[D.i], x = 12, w = W - 24, y = 48 * k; ctx.save(); ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; const lines = wrapText(st.how, w - 24), h = 50 * k + lines.length * 17 * k;
  ctx.fillStyle = 'rgba(10,20,40,.88)'; rrect(x, y, w, h, 12); ctx.fill(); ctx.strokeStyle = 'rgba(80,160,255,.8)'; ctx.lineWidth = 2; rrect(x, y, w, h, 12); ctx.stroke();
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#8ac8ff'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillText(`LESSON ${G.N} OF 3 · the giant: ${G.hp}`, x + 12, y + 9 * k);
  ctx.fillStyle = '#fff'; ctx.font = `400 ${Math.round(16 * k)}px ${TF}`; ctx.fillText(st.title, x + 12, y + 23 * k); ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.92)'; lines.forEach((l, i) => ctx.fillText(l, x + 12, y + 46 * k + i * 17 * k)); ctx.restore(); ctx.textBaseline = 'middle'; }
