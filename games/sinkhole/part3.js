
// ===================== THE VIEW: Sinkhole in 3D (three.js; sky, light, shadows from tools/world3d.js) =====================
// A toy town seen from above and behind. The holes are real holes: the ground is cut away inside each one (a shader drops the
// ground there) and a dark shaft goes down, so swallowed things really tip over the rim and drop out of sight. Every kind of
// thing is drawn as instances (one draw per part per kind). The camera rises as the hole grows. The 2D layer: the clock, the
// town meter (or the leaderboard with other holes), combos, power-ups, names over the other holes, arrows to them.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { snap: true, drag: null, cam: null };
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS || !(G && G.lesson)) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 160) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: 0.5 + Math.random() * 0.4, col, r: (1.5 + Math.random() * 2.5) * k }); } if (PARTS.length > 240) PARTS.splice(0, PARTS.length - 240); }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2.5); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.4) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; } }
const hex = n => '#' + n.toString(16).padStart(6, '0');
function mySkin() { if (typeof HEADLESS !== 'undefined' && HEADLESS) return SKINS[0]; const id = store.get('skin', 'cyan'); return SKINS.find(q => q.id === id) || SKINS[0]; }
const holeCol = i => i === 0 ? mySkin().col : HOLES[i].col;
// ---------- the parts of every kind of thing (local: the footprint round x/z = 0, y up from the ground; length along +x) ----------
function kindParts(T) { const B = (w, h, d, x = 0, y = 0, z = 0) => { const g = new T.BoxGeometry(w, h, d); g.translate(x, y + h / 2, z); return g; },
    C = (r1, r2, h, x = 0, y = 0, z = 0, n = 12) => { const g = new T.CylinderGeometry(r1, r2, h, n); g.translate(x, y + h / 2, z); return g; },
    S = (r, x = 0, y = 0, z = 0, sy = 1) => { const g = new T.IcosahedronGeometry(r, 1); g.scale(1, sy, 1); g.translate(x, y, z); return g; },
    M = (...gs) => merge(T, gs), wheel = (x, z, r = 0.22) => { const g = new T.CylinderGeometry(r, r, 0.16, 10); g.rotateX(Math.PI / 2); g.translate(x, r, z); return g; };
  const winTex = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 64, 128); for (let y = 0; y < 8; y++) for (let x = 0; x < 4; x++) { g.fillStyle = Math.random() < 0.25 ? '#ffe7a0' : '#5a7a9a'; g.fillRect(4 + x * 15, 6 + y * 15, 10, 10); } const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t; })();
  const roofUV = g => { const uv = g.attributes.uv; for (let i = 8; i < 16; i++) uv.setXY(i, 0.01, 0.995); return g; };
  return {
    cone: [{ g: C(0.02, 0.14, 0.5), c: 0xff7a1a }, { g: C(0.09, 0.11, 0.08, 0, 0.22), c: 0xffffff }],
    hydrant: [{ g: C(0.12, 0.14, 0.5), c: 0xe02a2a, t: 1 }, { g: S(0.12, 0, 0.52), c: 0xc02020 }],
    bin: [{ g: C(0.18, 0.15, 0.7), c: 0x3a8a4a, t: 1 }, { g: C(0.2, 0.2, 0.08, 0, 0.7), c: 0x2a5a32 }],
    lamp: [{ g: C(0.05, 0.07, 3), c: 0x3a4048 }, { g: B(0.5, 0.12, 0.2, 0.2, 2.95), c: 0x3a4048 }, { g: S(0.13, 0.35, 2.92), c: 0xfff0b0, e: 1 }],
    person: [{ g: C(0.14, 0.16, 1.0, 0, 0.3), c: 0xffffff, t: 1 }, { g: C(0.06, 0.06, 0.32, 0.06, 0), c: 0x334055 }, { g: C(0.06, 0.06, 0.32, -0.06, 0), c: 0x334055 }, { g: S(0.14, 0, 1.48), c: 0xf0c8a0 }],
    barrel: [{ g: C(0.24, 0.24, 0.8), c: 0xe0201a, e: 0.5 }, { g: C(0.25, 0.25, 0.1, 0, 0.35), c: 0xffd020 }],
    mailbox: [{ g: C(0.04, 0.04, 0.7), c: 0x444444 }, { g: B(0.3, 0.32, 0.42, 0, 0.7), c: 0x2a5ad0, t: 1 }],
    crate: [{ g: B(0.48, 0.48, 0.48), c: 0xb07a40, t: 1 }],
    bike: [{ g: B(0.7, 0.05, 0.05, 0, 0.55), c: 0xe03a5a, t: 1 }, { g: wheel(-0.3, 0, 0.25), c: 0x222222 }, { g: wheel(0.3, 0, 0.25), c: 0x222222 }, { g: C(0.03, 0.03, 0.35, 0.25, 0.55), c: 0x333333 }],
    bush: [{ g: S(0.42, 0, 0.3, 0, 0.8), c: 0x3f8a3a, t: 1 }],
    bench: [{ g: B(0.9, 0.08, 0.36, 0, 0.42), c: 0x9a6a3a }, { g: B(0.9, 0.3, 0.06, 0, 0.5, -0.16), c: 0x9a6a3a }, { g: B(0.06, 0.42, 0.3, -0.4), c: 0x333333 }, { g: B(0.06, 0.42, 0.3, 0.4), c: 0x333333 }],
    tree: [{ g: C(0.12, 0.18, 1.4), c: 0x7a5232 }, { g: S(0.75, 0, 2.1, 0, 1.15), c: 0x4aa040, t: 1 }],
    car: [{ g: B(1.8, 0.55, 0.95, 0, 0.2), c: 0xffffff, t: 1 }, { g: B(1.0, 0.45, 0.85, -0.1, 0.75), c: 0x2a3a50 }, { g: wheel(-0.6, 0.45), c: 0x1a1a1a }, { g: wheel(0.6, 0.45), c: 0x1a1a1a }, { g: wheel(-0.6, -0.45), c: 0x1a1a1a }, { g: wheel(0.6, -0.45), c: 0x1a1a1a }],
    kiosk: [{ g: B(1.6, 1.8, 1.6), c: 0xf4ead8 }, { g: B(1.9, 0.18, 1.9, 0, 1.8), c: 0xe04a4a, t: 1 }, { g: C(0.5, 0.05, 0.6, 0, 1.98, 0, 4), c: 0xe04a4a, t: 1 }],
    van: [{ g: B(2.3, 1.5, 1.15, 0, 0.25), c: 0xffffff, t: 1 }, { g: B(0.1, 0.6, 1.0, 1.16, 1.0), c: 0x2a3a50 }, { g: wheel(-0.75, 0.55, 0.26), c: 0x1a1a1a }, { g: wheel(0.75, 0.55, 0.26), c: 0x1a1a1a }, { g: wheel(-0.75, -0.55, 0.26), c: 0x1a1a1a }, { g: wheel(0.75, -0.55, 0.26), c: 0x1a1a1a }],
    bus: [{ g: B(3.3, 1.9, 1.3, 0, 0.3), c: 0xffffff, t: 1 }, { g: B(3.0, 0.5, 1.34, 0, 1.25), c: 0x2a3a50 }, { g: wheel(-1.1, 0.62, 0.3), c: 0x1a1a1a }, { g: wheel(1.1, 0.62, 0.3), c: 0x1a1a1a }, { g: wheel(-1.1, -0.62, 0.3), c: 0x1a1a1a }, { g: wheel(1.1, -0.62, 0.3), c: 0x1a1a1a }],
    tanker: [{ g: B(0.9, 1.5, 1.3, 1.2, 0.3), c: 0xd02a20 }, { g: (() => { const g = new T.CylinderGeometry(0.75, 0.75, 2.2, 14); g.rotateZ(Math.PI / 2); g.translate(-0.45, 1.15, 0); return g; })(), c: 0xff3a2a, e: 0.35 }, { g: B(2.1, 0.18, 1.55, -0.45, 1.05), c: 0xffd020 }, { g: wheel(-1.1, 0.6, 0.3), c: 0x1a1a1a }, { g: wheel(1.2, 0.6, 0.3), c: 0x1a1a1a }, { g: wheel(-1.1, -0.6, 0.3), c: 0x1a1a1a }, { g: wheel(1.2, -0.6, 0.3), c: 0x1a1a1a }],
    house: [{ g: B(3.2, 2.6, 3.2), c: 0xffffff, t: 1 }, { g: (() => { const g = new T.CylinderGeometry(0.01, 2.6, 1.7, 4); g.rotateY(Math.PI / 4); g.translate(0, 2.6 + 0.85, 0); return g; })(), c: 0xb04a3a }, { g: B(0.6, 1.2, 0.08, 0, 0, 1.62), c: 0x6a4a2a }, { g: B(0.6, 0.55, 0.08, -0.9, 1.2, 1.62), c: 0x8ac8f0 }, { g: B(0.6, 0.55, 0.08, 0.9, 1.2, 1.62), c: 0x8ac8f0 }],
    shop: [{ g: B(4.2, 3.6, 4.0), c: 0xffffff, t: 1 }, { g: B(4.4, 0.25, 4.2, 0, 3.6), c: 0x5a5a62 }, { g: B(3.2, 0.3, 0.9, 0, 2.2, 2.3), c: 0xff6a4a }, { g: B(2.6, 1.4, 0.08, 0, 0.4, 2.02), c: 0x8ac8f0 }, { g: B(2.2, 0.55, 0.1, 0, 2.75, 2.05), c: 0xffe070, e: 0.4 }],
    block: [{ g: roofUV(B(5.2, 11, 5.2)), c: 0xffffff, t: 1, map: winTex }, { g: B(5.4, 0.3, 5.4, 0, 11), c: 0x55555c }],
    tower: [{ g: roofUV(B(5.8, 20, 5.8)), c: 0xffffff, t: 1, map: winTex }, { g: B(4, 1.4, 4, 0, 20), c: 0x55555c }, { g: C(0.06, 0.06, 4, 0, 21.4, 0, 6), c: 0xdddddd }],
    landmark: [{ g: B(8, 2, 8), c: 0xe8dcc0 }, { g: B(5.4, 14, 5.4, 0, 2), c: 0xf0e2c6 }, { g: B(5.8, 0.6, 5.8, 0, 9), c: 0xc8a060 }, { g: C(0.01, 3.4, 8, 0, 16, 0, 4), c: 0x3a6a8a }, { g: S(0.7, 0, 24.6), c: 0xffd040, e: 0.6 },
      { g: (() => { const g = new T.CylinderGeometry(1.4, 1.4, 0.15, 24); g.rotateX(Math.PI / 2); g.translate(0, 12, 2.75); return g; })(), c: 0xffffff }],
    pw: [{ g: (() => { const g = new T.TorusGeometry(0.32, 0.08, 8, 20); g.rotateX(Math.PI / 2); g.translate(0, 0.5, 0); return g; })(), c: 0xffffff, t: 1, e: 0.8 }, { g: S(0.18, 0, 0.5), c: 0xffffff, t: 1, e: 1 }],
  }; }
function merge(T, gs) { if (gs.length === 1) return gs[0]; let n = 0; const ng = gs.map(g => { const q = g.index ? g.toNonIndexed() : g; n += q.attributes.position.count; return q; });
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3); let o = 0; for (const g of ng) { pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); o += g.attributes.position.count; }
  const out = new T.BufferGeometry(); out.setAttribute('position', new T.BufferAttribute(pos, 3)); out.setAttribute('normal', new T.BufferAttribute(nor, 3)); return out; }
// the ground's shader: no ground inside a hole
function holeGround(mat, V) { mat.onBeforeCompile = sh => { sh.uniforms.holes = V.hU; sh.vertexShader = 'varying vec3 vWp;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n vWp = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = 'varying vec3 vWp;\nuniform vec4 holes[4];\n' + sh.fragmentShader.replace('void main() {', 'void main() {\n for (int i = 0; i < 4; i++) { if (holes[i].w > 0.5 && distance(vWp.xz, holes[i].xy) < holes[i].z) discard; }'); }; mat.customProgramCacheKey = () => 'holeground'; }
function buildWorld() {
  if (V3) return V3; const T = window.THREE; if (!T || !W3 || !W3.init({ canvas: $('gl'), fov: 50, far: 3000, near: 0.3 })) { V3 = { none: true }; return V3; }
  V3 = { T, S: W3.scene, built: null, hU: { value: [0, 1, 2, 3].map(() => new T.Vector4(0, 0, 0, 0)) } }; const V = V3;
  V.parts = kindParts(T); V.mats = {};
  // the holes: a dark shaft, a coloured rim, a floor far down
  const shaftTex = (() => { const c = document.createElement('canvas'); c.width = 4; c.height = 128; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, '#4a3a2a'); gr.addColorStop(0.15, '#2a2018'); gr.addColorStop(1, '#000000'); g.fillStyle = gr; g.fillRect(0, 0, 4, 128); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t; })();
  V.holes = HOLES.map((q, i) => { const grp = new T.Group(); const shaft = new T.Mesh(new T.CylinderGeometry(1, 1, 1, 40, 1, true), new T.MeshBasicMaterial({ map: shaftTex, side: T.BackSide, fog: false })); shaft.position.y = -0.5;
    const floor = new T.Mesh(new T.CircleGeometry(1, 32), new T.MeshBasicMaterial({ color: 0x000000 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -1;
    const rim = new T.Mesh(new T.TorusGeometry(1, 0.035, 6, 48), new T.MeshBasicMaterial({ color: q.col, transparent: true, opacity: 0.9 })); rim.rotation.x = Math.PI / 2; rim.position.y = 0.03;
    const glow = new T.Mesh(new T.RingGeometry(1, 1.12, 48), new T.MeshBasicMaterial({ color: q.col, transparent: true, opacity: 0.35, depthWrite: false })); glow.rotation.x = -Math.PI / 2; glow.position.y = 0.025;
    grp.add(shaft, floor, rim, glow); grp.visible = false; V.S.add(grp); return { grp, shaft, floor, rim, glow, r: 0.4 }; });
  W3.setQuality(stepN); return V; }
const M4 = window.THREE ? new THREE.Matrix4() : null, Q4 = window.THREE ? new THREE.Quaternion() : null, E4 = window.THREE ? new THREE.Euler() : null, P4 = window.THREE ? new THREE.Vector3() : null, S4 = window.THREE ? new THREE.Vector3() : null, C4 = window.THREE ? new THREE.Color() : null;
const TINTS = { car: [0xe84a4a, 0x3a8ae0, 0xf0f0f0, 0x2a2a30, 0xf0c030, 0x4ac06a], bus: [0xf0b020, 0xe04a3a], van: [0xf4f4f4, 0x8ab0d0, 0xe0e0c0], house: [0xfff2e0, 0xe8f0ff, 0xfff0f0, 0xf0ffe8], shop: [0xffe2c8, 0xd8f0ff, 0xffd8e8, 0xe8ffd8],
  block: [0xe8e0d0, 0xd0dce8, 0xe8d0c8, 0xd8e8d0], tower: [0xa8c8e8, 0xc8d8e8, 0xb8e0d8, 0xd0c8e8], person: [0xe04a4a, 0x3a8ae0, 0xf0c030, 0x4ac06a, 0x9a5ae0, 0xffffff], tree: [0x4aa040, 0x5ab04a, 0x3a9040, 0x7ab040], bush: [0x3f8a3a, 0x4a9a42],
  hydrant: [0xe02a2a], bin: [0x3a8a4a, 0x4a5a6a], mailbox: [0x2a5ad0], crate: [0xb07a40, 0x9a6a3a], bike: [0xe03a5a, 0x3a9ae0, 0x40c070], kiosk: [0xe04a4a, 0x3a8ae0, 0x40b060] };
// one town: the ground (roads, pavements, grass painted on a canvas), and every thing as instances
function buildTown(V, g) { const T = V.T; if (V.town) { V.S.remove(V.town); V.town.traverse(o => { if (o.isInstancedMesh) o.dispose(); if (o.geometry && o.userData.own) o.geometry.dispose(); }); }
  const grp = new T.Group(); V.town = grp; V.S.add(grp); V.built = g; V.yard = !g.blocks.length; const pl = PLACES[g.place];
  W3.setSky(V.yard ? 'morning' : pl.sky); V.night = pl.sky === 'dusk' && !V.yard;
  // the ground
  const s = 8, c = document.createElement('canvas'); c.width = Math.ceil(g.TW * s); c.height = Math.ceil(g.TD * s); const x2 = c.getContext('2d');
  x2.fillStyle = '#5a5e66'; x2.fillRect(0, 0, c.width, c.height);
  for (const b of g.blocks) { const col = b.type === 'park' ? hex(pl.ground) : b.type === 'plaza' || b.type === 'landmark' ? '#d8cdb8' : '#c8c4bc'; x2.fillStyle = '#b8b4ac'; x2.fillRect((b.x0 - 1.2) * s, (b.z0 - 1.2) * s, 10.4 * s, 10.4 * s); x2.fillStyle = col; x2.fillRect(b.x0 * s, b.z0 * s, 8 * s, 8 * s);
    if (b.type === 'park') { x2.fillStyle = 'rgba(255,255,255,.08)'; for (let i = 0; i < 30; i++) x2.fillRect((b.x0 + Math.random() * 8) * s, (b.z0 + Math.random() * 8) * s, 3, 3); x2.strokeStyle = '#d8c8a0'; x2.lineWidth = 0.8 * s; x2.beginPath(); x2.moveTo(b.x0 * s, (b.z0 + 4) * s); x2.quadraticCurveTo((b.x0 + 4) * s, (b.z0 + 2) * s, (b.x0 + 8) * s, (b.z0 + 5) * s); x2.stroke(); }
    if (b.type === 'plaza' || b.type === 'landmark') { x2.strokeStyle = 'rgba(0,0,0,.08)'; x2.lineWidth = 1; for (let i = 0; i <= 8; i++) { x2.beginPath(); x2.moveTo((b.x0 + i) * s, b.z0 * s); x2.lineTo((b.x0 + i) * s, (b.z0 + 8) * s); x2.stroke(); x2.beginPath(); x2.moveTo(b.x0 * s, (b.z0 + i) * s); x2.lineTo((b.x0 + 8) * s, (b.z0 + i) * s); x2.stroke(); } } }
  if (V.yard) { x2.fillStyle = '#9ccc72'; x2.fillRect(0, 0, c.width, c.height); x2.fillStyle = 'rgba(255,255,255,.1)'; for (let i = 0; i < 200; i++) x2.fillRect(Math.random() * c.width, Math.random() * c.height, 3, 3); }
  else { x2.strokeStyle = 'rgba(255,255,255,.75)'; x2.lineWidth = 0.15 * s; x2.setLineDash([1.2 * s, 1.2 * s]); for (let i = 0; i * P < g.TW; i++) { x2.beginPath(); x2.moveTo((i * P + ROAD / 2) * s, 0); x2.lineTo((i * P + ROAD / 2) * s, c.height); x2.stroke(); } for (let j = 0; j * P < g.TD; j++) { x2.beginPath(); x2.moveTo(0, (j * P + ROAD / 2) * s); x2.lineTo(c.width, (j * P + ROAD / 2) * s); x2.stroke(); } x2.setLineDash([]);
    x2.fillStyle = '#5a5e66'; for (let i = 0; i * P < g.TW; i++) for (let j = 0; j * P < g.TD; j++) x2.fillRect(i * P * s, j * P * s, ROAD * s, ROAD * s);
    x2.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i * P < g.TW; i++) for (let j = 0; j * P < g.TD; j++) for (let q = 0; q < 5; q++) { x2.fillRect((i * P + 0.4 + q * 0.7) * s, (j * P + ROAD + 0.3) * s, 0.4 * s, 0.9 * s); } }
  const tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 4;
  const gm = new T.MeshStandardMaterial({ map: tex, roughness: 0.95 }); holeGround(gm, V); const ground = new T.Mesh(new T.PlaneGeometry(g.TW, g.TD), gm); ground.rotation.x = -Math.PI / 2; ground.position.set(g.TW / 2, 0, g.TD / 2); ground.receiveShadow = true; ground.userData.own = 1; grp.add(ground);
  const om = new T.MeshStandardMaterial({ color: V.yard ? 0x7ab060 : pl.ground, roughness: 1 }); holeGround(om, V);
  // the country round the town: a big plane with the town's rectangle cut out (four strips)
  for (const [w, d, x, z] of [[g.TW + 400, 200, g.TW / 2, -100], [g.TW + 400, 200, g.TW / 2, g.TD + 100], [200, g.TD, -100, g.TD / 2], [200, g.TD, g.TW + 100, g.TD / 2]]) { const m = new T.Mesh(new T.PlaneGeometry(w, d), om); m.rotation.x = -Math.PI / 2; m.position.set(x, -0.01, z); m.receiveShadow = true; m.userData.own = 1; grp.add(m); }
  { const fence = new T.MeshStandardMaterial({ color: 0xe8e0d0 }); for (const [w, d, x, z] of [[g.TW, 0.15, g.TW / 2, -0.1], [g.TW, 0.15, g.TW / 2, g.TD + 0.1], [0.15, g.TD, -0.1, g.TD / 2], [0.15, g.TD, g.TW + 0.1, g.TD / 2]]) { const m = new T.Mesh(new T.BoxGeometry(w, 0.5, d), fence); m.position.set(x, 0.25, z); m.userData.own = 1; m.castShadow = true; grp.add(m); } }
  // the things: per kind, one instanced mesh per part
  const by = {}; for (const o of g.objs) (by[o.kind] = by[o.kind] || []).push(o);
  V.inst = {}; for (const kind in by) { const list = by[kind], parts = V.parts[kind]; if (!parts) continue; const meshes = parts.map(p => { const key = kind + p.c + (p.e || 0) + (p.map ? 'm' : ''); const mat = V.mats[key] || (V.mats[key] = new T.MeshStandardMaterial({ color: p.c, map: p.map || null, roughness: 0.6, emissive: p.e ? p.c : 0x000000, emissiveIntensity: p.e || 0 }));
      const m = new T.InstancedMesh(p.g, mat, list.length + 4); m.castShadow = kind !== 'pw' && kind !== 'person'; m.receiveShadow = false; m.frustumCulled = false; m.instanceMatrix.setUsage(T.DynamicDrawUsage); grp.add(m); return m; });
    list.forEach((o, n) => { o.vi = n; const tints = TINTS[kind]; parts.forEach((p, j) => { if (p.t) { C4.setHex(o.gold ? 0xffd040 : kind === 'pw' ? ({ magnet: 0xff4a6a, speed: 0xffe040, time: 0x4ac8ff })[o.sub] : tints ? tints[(o.var + (o.col | 0)) % tints.length] : 0xffffff); meshes[j].setColorAt(n, C4); } }); });
    V.inst[kind] = { list, meshes, parts }; for (const m of meshes) m.count = list.length; }
  V.pending = []; place(V, g, 0, true); }
// a power-up appears during play: give it a slot (rebuild that kind's meshes if full)
function placeThing(V, g, o, dt, all) { const I = V.inst[o.kind]; if (!I) return; if (o.vi == null) { o.vi = I.list.length; I.list.push(o); if (o.vi >= I.meshes[0].instanceMatrix.count) { V.built = null; return; } I.parts.forEach((p, j) => { if (p.t) { C4.setHex(o.kind === 'pw' ? ({ magnet: 0xff4a6a, speed: 0xffe040, time: 0x4ac8ff })[o.sub] : 0xffffff); I.meshes[j].setColorAt(o.vi, C4); I.meshes[j].instanceColor.needsUpdate = true; } }); for (const m of I.meshes) m.count = I.list.length; }
  let x = o.x, y = 0, z = o.z, sc = o.kind === 'person' || o.kind === 'pw' ? 1 : o.rad / KINDS[o.kind].rad, tilt = 0, ry = -o.a;
  if (o.kind === 'person') { y = Math.abs(Math.sin(o.walk || 0)) * 0.08; }
  if (o.kind === 'pw') { y = 0.15 + Math.sin(V.t * 3 + o.id) * 0.12; ry = V.t * 2; }
  if (o.wob) { o.wob = Math.max(0, o.wob - dt * 2); tilt = Math.sin(V.t * 30) * o.wob * 0.08; }
  if (o.fall) { const f = o.fall, h = g.holes[f.i]; f.t += dt; if (f.x == null) { f.x = o.x; f.z = o.z; f.sp = (Math.random() - 0.5) * 3; } const r = HR[h.s], k2 = Math.min(1, f.t * 3);
    x = lerp(f.x, h.x, k2 * 0.85); z = lerp(f.z, h.z, k2 * 0.85); y = -f.t * f.t * (9 + r) - f.t * 0.6; tilt = Math.min(1.4, f.t * 3); ry += f.sp * f.t;
    if (f.t > 1.3 || (!h || y < -40)) { sc = 0; o.fall = null; o.gone = true; } }
  if (o.gone || (!o.alive && !o.fall)) sc = 0;
  E4.set(tilt, ry, tilt * 0.4, 'YXZ'); Q4.setFromEuler(E4); P4.set(x, y, z); S4.set(sc, sc, sc); M4.compose(P4, Q4, S4); for (const m of I.meshes) m.setMatrixAt(o.vi, M4); I.dirty = true; }
function place(V, g, dt, all) { V.t = (V.t || 0) + dt;
  for (const o of g.objs) { if (o.vi == null && o.alive) { placeThing(V, g, o, dt, all); continue; } if (all || o.fall || (o.alive && (o.drive || o.kind === 'person' || o.kind === 'pw' || o.wob))) placeThing(V, g, o, dt, all); else if (!o.alive && !o.fall && !o.gone) { o.gone = true; placeThing(V, g, o, dt, all); } }
  for (const kind in V.inst) { const I = V.inst[kind]; if (I.dirty) { for (const m of I.meshes) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; } I.dirty = false; } } }
function sync(V, g, dt) { const T = V.T, you = g.you;
  // holes: the cut in the ground (shader), the shaft, the rim, grown smoothly
  g.holes.forEach((h, i) => { const vh = V.holes[i]; const want = HR[h.s]; vh.r += (want - vh.r) * Math.min(1, dt * 4); const on = !h.gone; vh.grp.visible = on; vh.grp.position.set(h.x, 0, h.z); vh.grp.scale.set(vh.r, 1, vh.r);
    vh.shaft.scale.y = 6 + vh.r * 4; vh.shaft.position.y = -vh.shaft.scale.y / 2; vh.floor.position.y = -vh.shaft.scale.y; vh.rim.scale.set(1, 1, 1 / Math.max(0.3, vh.r) * 0.6 + 0.4); vh.rim.material.color.setHex(holeCol(i)); vh.glow.material.color.setHex(holeCol(i));
    vh.glow.material.opacity = 0.3 + (h.magnet > 0 ? 0.35 * (0.5 + 0.5 * Math.sin(V.t * 12)) : 0) + (h.boost > 0 ? 0.2 : 0) + (i === 0 && h.stun > 0 ? 0.4 : 0);
    V.hU.value[i].set(h.x, h.z, vh.r * 0.985, on ? 1 : 0); });
  for (let i = g.holes.length; i < 4; i++) { V.holes[i].grp.visible = false; V.hU.value[i].w = 0; }
  // things too big for a hole wobble on its rim
  for (const h of g.holes) { if (h.gone) continue; const r = HR[h.s]; for (const o of g.objs) { if (!o.alive || fits(h, o)) continue; const d = Math.hypot(o.x - h.x, o.z - h.z); if (d < o.rad + r * 0.9) o.wob = Math.max(o.wob || 0, 0.6); } }
  place(V, g, dt, false);
  // the camera: above and behind the hole, higher as it grows
  const r = V.holes[0].r, asp = innerWidth / innerHeight, dist = (12 + r * 3.2) * (asp < 0.8 ? 1.12 : 0.95), want = { x: you.x, z: you.z, d: dist };
  if (ui.snap || !ui.cam) { ui.cam = Object.assign({}, want); ui.snap = false; } const c = ui.cam, kk = Math.min(1, dt * 4); c.x += (want.x - c.x) * kk; c.z += (want.z - c.z) * kk; c.d += (want.d - c.d) * Math.min(1, dt * 1.5);
  const cam = W3.cam, sh = FX.shake ? (Math.random() - 0.5) * FX.shake * 0.03 : 0; cam.fov = asp < 0.8 ? 55 : 45; cam.aspect = asp; cam.updateProjectionMatrix();
  cam.position.set(c.x + sh, c.d * 1.25, c.z + c.d * 0.8 + sh); cam.lookAt(c.x, 0, c.z - c.d * 0.12); cam.updateMatrixWorld(); W3.setFocus(c.x, 0, c.z, c.d * 1.6); }
const SV = window.THREE ? new THREE.Vector3() : null;
function scr(x, y, z) { if (!V3 || V3.none) return { x: W / 2, y: H / 2 }; SV.set(x, y, z); return W3.screen(SV); }
// ---------- what each happening looks like ----------
let eatAcc = { m: 0, t: 0 };
function onEvent(G, e) { const cx = W / 2, hp = () => scr(G.you.x, 0, G.you.z);
  switch (e.k) {
    case 'start': case 'yard': if (V3 && !V3.none) V3.built = null; ui.snap = true; if (e.k === 'start') { say(`LEVEL ${G.N}`, cx, H * 0.3, '#fff', 30); sfx.start(); if (G.N <= 1) tip('how', 'Slide your thumb anywhere: the hole glides that way. Swallow small things to grow!', 3.6); if (G.holes.length > 1) tip('riv', 'Other holes! Bigger eats smaller. Be the biggest eater when the clock ends.', 3.6); if (G.cfg.boss) tip('boss', 'BOSS TOWN: grow big enough to swallow the great tower in the middle!', 3.6); } break;
    case 'eat': sfx.gulp(e.m, e.combo); eatAcc.m += e.m; eatAcc.t = 0.35; if (e.m >= 20) { const p = hp(); say(`+${e.m}`, p.x, p.y - 40 * k, e.m >= 100 ? '#ffd040' : '#fff', 16 + Math.min(14, e.m / 20)); FX.shake = Math.min(12, 2 + e.m / 30); vibe(e.m >= 100 ? HAP.sharp : HAP.light); }
      if (e.gold) { const p = hp(); say('+3 🪙', p.x + 40 * k, p.y - 60 * k, '#ffd040', 16); sfx.coin(); } if (e.combo === 10 || e.combo === 25 || e.combo === 50) { say(`COMBO x${e.combo}!`, cx, H * 0.36, '#ff9ae0', 24); sfx.combo(e.combo / 10); } break;
    case 'grow': if (e.i === 0) { sfx.grow(e.s); FX.flash = 0.25; const p = hp(); burst(p.x, p.y, hex(holeCol(0)), 18, 200); say(`SIZE ${e.s + 1}!`, cx, H * 0.4, hex(holeCol(0)), 28); vibe(HAP.sharp); if (e.s === 3) tip('cars', 'Big enough for cars now!', 2.4); if (e.s === 6) tip('houses', 'Houses next! Keep growing.', 2.4); } break;
    case 'boom': if (e.i === 0) { sfx.boom(); FX.shake = 18; FX.red = 1; FX.stop = 0.06; vibe(HAP.fail); const p = hp(); burst(p.x, p.y, '#ff6a2a', 30, 280); say(e.shrink ? 'BOOM! SMALLER' : 'BOOM!', cx, H * 0.4, '#ff6a4a', 30); tip('barrel', 'Red barrels blow up in your hole. Steer round them!', 3); } break;
    case 'fizz': sfx.fizz(); break;
    case 'pow': sfx.pow(); { const p = hp(); say(e.sub === 'magnet' ? '🧲 MAGNET!' : e.sub === 'speed' ? '⚡ SPEED!' : '⏱ +8 SECONDS', p.x, p.y - 70 * k, '#fff', 20); } break;
    case 'holeeat': if (e.by === 0) { sfx.chomp(); FX.flash = 0.4; say(`YOU ATE ${HOLES[e.of].name}!`, cx, H * 0.36, '#ffd040', 26); vibe(HAP.best); } else if (e.of === 0) { sfx.eaten(); FX.red = 1; FX.shake = 14; say(`${HOLES[e.by].name} ATE YOU!`, cx, H * 0.4, '#ff6a6a', 26); vibe(HAP.fail); } break;
    case 'back': if (e.i === 0) ui.snap = true; break;
    case 'timelow': sfx.tick(); say('10 SECONDS!', cx, H * 0.32, '#ffb040', 22); break;
    case 'goal': sfx.goal(); FX.flash = 0.6; say(G.holes.length > 1 ? 'TOWN SWALLOWED!' : 'TOWN SWALLOWED!', cx, H * 0.36, '#ffd040', 32); vibe(HAP.best); break;
    case 'timeup': if (e.win) { sfx.goal(); say('YOU ATE THE MOST!', cx, H * 0.36, '#ffd040', 28); } else say('TIME!', cx, H * 0.36, '#fff', 34); break;
    case 'lessonnext': if (e.first) hint = null; say('FIRST, A LESSON', cx, H * 0.3, '#ffe08a', 20); break;
    case 'lessonok': if (e.n === e.need) break; { const p = hp(); say(`${e.n}/${e.need}`, p.x, p.y - 50 * k, '#ffe08a', 18); } break;
    case 'lessonmiss': coachMiss(); break;
    case 'lessondone': say('YOU\'VE GOT IT!', cx, H * 0.3, '#ffe08a', 26); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); break;
    case 'lost': sfx.lose(); break;
  } }
// ---------- every frame ----------
let IG = null; function idleG() { if (!IG || IG.over) { IG = newGame(Math.max(4, store.get('level', 1) | 0), { seed: (Math.random() * 1e6) | 0 }); IG.mem = {}; ui.snap = true; } honest(IG, { react: 0.3, acc: 0.9 }, IG.mem); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#2a3a2a'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D town.', W / 2, H / 2); return; }
  const g = G || idleG(); if (V.built !== g) { buildTown(V, g); ui.snap = true; }
  sync(V, g, dt);
  W3.render(dt);
  if (G) hud(G, now);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 0.9 ? 1 : 1 - (t2.t - 0.9) / 0.5; ctx.globalAlpha = Math.max(0, al); const sc = t2.t < 0.12 ? 1.3 - t2.t / 0.12 * 0.3 : 1; ctx.font = `400 ${Math.round(t2.size * k * sc)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(20,20,30,.6)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 20); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 20); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30;
    ctx.fillStyle = 'rgba(20,24,36,.88)'; rrect(W / 2 - w / 2, H * 0.74 - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.74 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,60,30,${FX.red * 0.22})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,250,235,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); } }
// ---------- the 2D layer ----------
function hud(G, t) { ctx.textBaseline = 'middle'; const you = G.you;
  // names over the other holes; arrows at the edge for those out of sight
  for (const h of G.holes) { if (h.i === 0 || h.gone) continue; const p = scr(h.x, 0, h.z), col = hex(HOLES[h.i].col), bigger = h.s > you.s;
    if (p.x > 20 && p.x < W - 20 && p.y > 90 * k && p.y < H - 30) { ctx.font = `400 ${Math.round(13 * k)}px ${TF}`; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.5)'; const lb = `${HOLES[h.i].name} ${h.s + 1}${bigger ? ' ⚠' : ''}`; ctx.strokeText(lb, p.x, p.y - 34 * k); ctx.fillStyle = col; ctx.fillText(lb, p.x, p.y - 34 * k); }
    else { const cx = W / 2, cy = H / 2, a = Math.atan2(p.y - cy, p.x - cx), ex = clamp(cx + Math.cos(a) * W, 18, W - 18), ey = clamp(cy + Math.sin(a) * H, 110 * k, H - 24); ctx.save(); ctx.translate(ex, ey); ctx.rotate(a); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-6, -8); ctx.lineTo(-6, 8); ctx.closePath(); ctx.fill(); ctx.restore(); } }
  if (G.lesson) { lessonPanel(G); stickDraw(); return; }
  // top: the clock and the meter (with a mark at the goal), then the board when there are other holes
  const w = Math.min(250 * k, W * 0.62), x0 = W / 2 - w / 2, y0 = 66 * k, p = clamp(G.ate / G.total, 0, 1), goal = G.cfg.goal;
  ctx.fillStyle = 'rgba(20,24,36,.45)'; rrect(x0 - 12 * k, y0 - 30 * k, w + 24 * k, 50 * k, 14 * k); ctx.fill();
  const tl = Math.max(0, Math.ceil(G.left)); ctx.font = `400 ${Math.round(20 * k)}px ${TF}`; ctx.textAlign = 'center'; ctx.fillStyle = tl <= 10 ? (Math.sin(t * 10) > 0 ? '#ff6a4a' : '#fff') : '#fff'; ctx.fillText(`${Math.floor(tl / 60)}:${String(tl % 60).padStart(2, '0')}`, W / 2, y0 - 14 * k);
  ctx.fillStyle = 'rgba(255,255,255,.25)'; rrect(x0, y0 + 2 * k, w, 10 * k, 5 * k); ctx.fill(); ctx.fillStyle = hex(holeCol(0)); rrect(x0, y0 + 2 * k, Math.max(10 * k, w * Math.min(1, p / goal)), 10 * k, 5 * k); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.textAlign = 'left'; ctx.fillText(`TOWN ${Math.round(p * 100)}% / ${Math.round(goal * 100)}%`, x0, y0 + 22 * k); ctx.textAlign = 'right'; ctx.fillText(`SIZE ${you.s + 1}`, x0 + w, y0 + 22 * k);
  if (G.holes.length > 1) { const rows = G.holes.map(h => ({ i: h.i, ate: h.i === 0 ? G.ate : (h.ate || 0) })).sort((a, b) => b.ate - a.ate); let y = y0 + 40 * k; ctx.fillStyle = 'rgba(20,24,36,.5)'; rrect(6, y - 9 * k, 98 * k, rows.length * 15 * k + 4 * k, 8 * k); ctx.fill(); ctx.font = `700 ${Math.round(11 * k)}px ${BC}`;
    rows.forEach((r, n) => { ctx.textAlign = 'left'; ctx.fillStyle = r.i === 0 ? '#fff' : hex(HOLES[r.i].col); ctx.fillText(`${n === 0 ? '👑' : n + 1 + '.'} ${r.i === 0 ? 'YOU' : HOLES[r.i].name}`, 12, y); ctx.textAlign = 'right'; ctx.fillText(`${Math.round(100 * r.ate / G.total)}%`, 98 * k, y); y += 15 * k; }); }
  { let x = W - 14, y = y0 + 40 * k; ctx.textAlign = 'right'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; for (const [on, txt, col] of [[you.magnet, '🧲', '#ff8aa0'], [you.boost, '⚡', '#ffe060']]) if (on > 0) { ctx.fillStyle = col; ctx.fillText(`${txt} ${on.toFixed(0)}s`, x, y); y += 16 * k; } }
  if (G.combo >= 3) { const hp = scr(you.x, 0, you.z); ctx.font = `400 ${Math.round((14 + Math.min(10, G.combo / 4)) * k)}px ${TF}`; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.strokeText(`x${G.combo}`, hp.x, hp.y + 34 * k); ctx.fillStyle = '#ff9ae0'; ctx.fillText(`x${G.combo}`, hp.x, hp.y + 34 * k); }
  if (G.cfg.boss && G.mark && G.mark.alive) { ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillStyle = '#ffd040'; ctx.fillText(you.s >= 9 ? 'NOW SWALLOW THE GREAT TOWER!' : 'BOSS: grow to size 10 and swallow the great tower', W / 2, H - 60 * k); }
  if (you.gone > 0) { ctx.font = `400 ${Math.round(20 * k)}px ${TF}`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText(`BACK IN ${you.gone.toFixed(1)}`, W / 2, H * 0.5); }
  if ((G && G.lesson) && G.N <= 1 && G.t < 4 && !ui.drag) { ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 4); ctx.font = `400 ${Math.round(14 * k)}px ${TF}`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText('SLIDE YOUR THUMB TO MOVE', W / 2, H - 90 * k); ctx.globalAlpha = 1; }
  stickDraw(); }
function stickDraw() { const d = ui.drag; if (!d) return; const R = 56 * k; ctx.globalAlpha = 0.35; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(d.x0, d.y0, R, 0, TAU); ctx.fill(); ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.arc(d.x0 + d.kx * R, d.y0 + d.ky * R, 22 * k, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { coachPanel(G); }
