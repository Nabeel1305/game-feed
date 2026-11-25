// ===================== THE VIEW: Short Order in 3D (three.js through tools/world3d.js) =====================
// A diner kitchen from where the cook stands: a steel counter, a black glass stove with cast-iron pans, a wooden board and knife,
// a white plate, the trays of food in front, the pass with its heat lamps, and a window onto the street (weather and light of
// the level). Counter top at y = 0.9; you look down at it.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [];
let hint = null, V3 = null;
const TOP = 0.9;
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 6) TXT.shift(); }
function tip(key, txt, secs = 2.8) { if (HEADLESS || !(G && G.lesson)) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function fxStep(dt) {
  FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 1.8);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.3) TXT.shift();
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; }
}
// where things are on the counter (x across, z toward you)
// the kitchen laid out wide (23 Nov 2026, sideways): the trays on the left, the hob in the middle at the back, the plate, the board and the
// bin to the right, the pass behind
function spots(G) { if (W > H) { const n = G ? G.pans.length : 2, pans = []; for (let i = 0; i < n; i++) pans.push({ x: -0.02 + (i - (n - 1) / 2) * 0.28, z: -0.4 });
    const T2 = trayOf(G ? G.N : 1), rows = Math.ceil(T2.length / 5); return { pans, plate: { x: 0.2, z: -0.03 }, board: { x: 0.52, z: -0.1 }, bin: { x: 0.8, z: -0.12 }, pass: { x: 0.1, z: -0.72 },
      tray: T2.map((f, i) => ({ food: f, x: -0.86 + (i % 5) * 0.135, z: (rows > 2 ? -0.27 : -0.2) + Math.floor(i / 5) * (rows > 2 ? 0.145 : 0.16) })) }; }
  const n = G ? G.pans.length : 2, pans = []; for (let i = 0; i < n; i++) pans.push({ x: (i - (n - 1) / 2) * 0.27, z: -0.42 }); return { pans, board: { x: 0.2, z: -0.13 }, plate: { x: -0.1, z: -0.13 }, bin: { x: -0.33, z: -0.15 }, pass: { x: 0, z: -0.72 },
  tray: trayOf(G ? G.N : 1).map((f, i, a) => ({ food: f, x: ((i % 5) - 2) * 0.145, z: (a.length > 10 ? 0.045 : 0.08) + Math.floor(i / 5) * (a.length > 10 ? 0.112 : 0.125) })) }; }
function buildWorld() {
  if (V3) return V3; const T = THREE; if (!W3 || !W3.init({ canvas: $('gl'), fov: 60, far: 3000, near: 0.02 })) { V3 = { none: true }; return V3; }
  const S = W3.scene, R0 = W3.rng(8);
  const steel = new T.MeshStandardMaterial({ color: 0x9da3a9, metalness: 0.8, roughness: 0.4, envMapIntensity: 0.55, map: W3.grainTex(128, 3, 230, 18, 6) });
  const counter = new T.Mesh(new T.BoxGeometry(2.2, 0.06, 1.3), steel); counter.position.set(0, TOP - 0.03, -0.25); counter.receiveShadow = true; S.add(counter);
  const glass = new T.Mesh(new T.BoxGeometry(0.95, 0.012, 0.32), new T.MeshStandardMaterial({ color: 0x090a0c, metalness: 0.2, roughness: 0.08 })); glass.position.set(0, TOP + 0.006, -0.42); S.add(glass);
  // the back wall: white tiles, with a window onto the street
  const tc = document.createElement('canvas'); tc.width = 256; tc.height = 128; { const g = tc.getContext('2d'); g.fillStyle = '#c9c6bd'; g.fillRect(0, 0, 256, 128); for (let y = 0; y < 128; y += 16) for (let x = (y / 16 % 2) * 16; x < 256; x += 32) { g.fillStyle = `hsl(45,${10 + R0() * 6}%,${90 + R0() * 6}%)`; g.fillRect(x + 1, y + 1, 30, 14); } }
  const tt = new T.CanvasTexture(tc); tt.colorSpace = T.SRGBColorSpace; tt.wrapS = tt.wrapT = T.RepeatWrapping; tt.repeat.set(3, 4); const tileM = new T.MeshStandardMaterial({ map: tt, roughness: 0.3 });
  const wall = (w, h, x, y) => { const m = new T.Mesh(new T.BoxGeometry(w, h, 0.05), tileM); m.position.set(x, y, -1.05); S.add(m); };
  wall(3, 0.12, 0, TOP + 0.06); wall(3, 2, 0, TOP + 1.7); wall(0.9, 0.58, -1.05, TOP + 0.41); wall(0.9, 0.58, 1.05, TOP + 0.41);
  const frame = new T.Mesh(new T.BoxGeometry(1.24, 0.04, 0.08), steel); frame.position.set(0, TOP + 0.7, -1.04); S.add(frame); const fr2 = frame.clone(); fr2.position.y = TOP + 0.12; S.add(fr2);
  // the street outside: a few buildings across the road (the sky is the real one)
  const bm = new T.MeshStandardMaterial({ color: 0x7a6a5c, roughness: 0.9 }); for (let i = 0; i < 6; i++) { const b = new T.Mesh(new T.BoxGeometry(6 + R0() * 4, 8 + R0() * 14, 4), bm); b.position.set(-14 + i * 6, 0, -30); S.add(b); }
  const street = new T.Mesh(new T.PlaneGeometry(80, 40), new T.MeshStandardMaterial({ color: 0x3a3b3d, roughness: 0.4 })); street.rotation.x = -Math.PI / 2; street.position.set(0, -0.1, -20); S.add(street);
  // the pass: a steel shelf with heat lamps glowing over it
  const shelf = new T.Mesh(new T.BoxGeometry(1.1, 0.03, 0.22), steel); shelf.position.set(0, TOP + 0.22, -0.74); S.add(shelf);
  const lampM = new T.MeshStandardMaterial({ color: 0x5a1a08, emissive: 0xff6a20, emissiveIntensity: 2 }); const shadeM = new T.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 0.9, roughness: 0.3, side: T.DoubleSide }); for (const x of [-0.35, 0, 0.35]) { const rod = new T.Mesh(new T.CylinderGeometry(0.006, 0.006, 0.6, 6), shadeM); rod.position.set(x, TOP + 0.85, -0.8); const sh = new T.Mesh(new T.CylinderGeometry(0.018, 0.05, 0.045, 18, 1, true), shadeM); sh.position.set(x, TOP + 0.6, -0.86); const l = new T.Mesh(new T.SphereGeometry(0.018, 14, 8), lampM); l.position.set(x, TOP + 0.58, -0.86); rod.position.z = -0.86; rod.position.y = TOP + 0.92; S.add(rod, sh, l); }
  const passL = new T.PointLight(0xff9a50, 2.5, 1.5, 1.5); passL.position.set(0, TOP + 0.55, -0.74); S.add(passL);
  const kitL = new T.PointLight(0xfff0dc, 3.5, 4, 1.4); kitL.position.set(0.3, TOP + 1.3, 0.2); kitL.castShadow = true; S.add(kitL);
  // burners, pans, board, knife, plate, bin
  const burnM = new T.MeshStandardMaterial({ color: 0x220400, emissive: 0xff3a10, emissiveIntensity: 0.9, transparent: true, opacity: 0.85 });
  const ironM = new T.MeshStandardMaterial({ color: 0x5a5e66, metalness: 0.75, roughness: 0.35, side: T.DoubleSide }), woodM = new T.MeshStandardMaterial({ color: 0xa47a4c, roughness: 0.75, map: W3.grainTex(128, 15, 180, 50, 4) });
  const pans = [], burners = []; for (let i = 0; i < 3; i++) { const g = new T.Group(); const pan = new T.Mesh(new T.CylinderGeometry(0.11, 0.095, 0.035, 28, 1, true), ironM); pan.position.y = 0.0175; const base = new T.Mesh(new T.CircleGeometry(0.095, 28), ironM); base.rotation.x = -Math.PI / 2; base.position.y = 0.004;
    const h = new T.Mesh(new T.BoxGeometry(0.03, 0.015, 0.16), ironM); h.position.set(0, 0.03, 0.19); g.add(pan, base, h); g.traverse(o => o.castShadow = true); S.add(g); pans.push(g);
    const r = new T.Mesh(new T.RingGeometry(0.06, 0.1, 32), burnM); r.rotation.x = -Math.PI / 2; S.add(r); burners.push(r); }
  const board = new T.Mesh(new T.BoxGeometry(0.3, 0.025, 0.2), woodM); board.castShadow = board.receiveShadow = true; S.add(board);
  const knife = new T.Group(); { const blade = new T.Mesh(new T.BoxGeometry(0.17, 0.003, 0.035), new T.MeshStandardMaterial({ color: 0xdfe3e8, metalness: 1, roughness: 0.15 })); blade.position.x = -0.085; const hd = new T.Mesh(new T.BoxGeometry(0.1, 0.016, 0.022), new T.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5 })); hd.position.x = 0.05; knife.add(blade, hd); knife.traverse(o => o.castShadow = true); S.add(knife); }
  const plate = new T.Mesh(new T.LatheGeometry([[0, 0], [0.09, 0], [0.11, 0.008], [0.125, 0.016], [0.128, 0.015]].map(p => new T.Vector2(p[0], p[1])), 40), new T.MeshStandardMaterial({ color: 0xf6f4ee, roughness: 0.22, side: T.DoubleSide })); plate.castShadow = plate.receiveShadow = true; { const rim = new T.Mesh(new T.RingGeometry(0.112, 0.12, 40), new T.MeshStandardMaterial({ color: 0x2f7a5a, roughness: 0.3 })); rim.rotation.x = -Math.PI / 2; rim.position.y = 0.0105; plate.add(rim); const mat = new T.Mesh(new T.CircleGeometry(0.155, 36), new T.MeshStandardMaterial({ color: 0x24201c, roughness: 0.95 })); mat.rotation.x = -Math.PI / 2; mat.position.y = -0.003; mat.receiveShadow = true; plate.add(mat); } S.add(plate);
  const bin = new T.Mesh(new T.CylinderGeometry(0.075, 0.065, 0.05, 24, 1, true), new T.MeshStandardMaterial({ color: 0x4a4e52, metalness: 0.6, roughness: 0.4, side: T.DoubleSide })); S.add(bin);
  const trays = TRAY.map(() => { const m = new T.Mesh(new T.BoxGeometry(0.13, 0.03, 0.105), steel); m.receiveShadow = true; S.add(m); return m; });
  // steam
  const NP = 120, pG = new T.BufferGeometry(); pG.setAttribute('position', new T.BufferAttribute(new Float32Array(NP * 3), 3)); pG.setAttribute('a', new T.BufferAttribute(new Float32Array(NP), 1));
  const pM = new T.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { px: { value: 1 } }, vertexShader: `attribute float a; uniform float px; varying float va; void main(){ va = a; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = min(px * 60.0, px * 7.0 / -mv.z); gl_Position = projectionMatrix * mv; }`, fragmentShader: `varying float va; void main(){ float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(1.0, 1.0, 1.0, va * 0.35 * smoothstep(0.5, 0.0, d)); }` });
  const steam = new T.Points(pG, pM); steam.frustumCulled = false; S.add(steam); const puffs = []; for (let i = 0; i < NP; i++) puffs.push({ t: 9, life: 1, x: 0, y: -9, z: 0 });
  V3 = { T, S, pans, burners, board, knife, plate, bin, trays, steam, puffs, foods: new Map(), sky: null, chopA: 0 };
  W3.setQuality(stepN); return V3;
}
// food: a little model for each kind; cooked things change colour with how done the side you can see is
const RAWC = { patty: [0.62, 0.27, 0.27], steak: [0.55, 0.2, 0.2], salmon: [0.96, 0.55, 0.45], pancake: [0.96, 0.88, 0.66], egg: [0.98, 0.98, 0.95], bacon: [0.92, 0.5, 0.48], sausage: [0.86, 0.58, 0.52] };
const GOLDC = { patty: [0.42, 0.24, 0.12], steak: [0.36, 0.2, 0.11], salmon: [0.86, 0.55, 0.28], pancake: [0.82, 0.55, 0.22], egg: [1, 0.97, 0.9], bacon: [0.6, 0.2, 0.1], sausage: [0.5, 0.26, 0.12] };
// 23 Nov 2026, his note: "impove the graphics with the food": painted surfaces (mince, marbling, the lines of a salmon fillet, pancake
// bubbles, crumb and crust), sesame on the bun, a stalk on the tomato, a root on the onion, layered lettuce leaves
const FOODTEX = {};
function foodTex(kind) { if (FOODTEX[kind]) return FOODTEX[kind]; const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), R = W3.rng(kind.length * 31 + 7);
  g.fillStyle = '#fff'; g.fillRect(0, 0, 128, 128);
  if (kind === 'mince') for (let i = 0; i < 900; i++) { const v = 150 + R() * 105; g.fillStyle = `rgb(${v},${v * 0.82},${v * 0.82})`; g.beginPath(); g.arc(R() * 128, R() * 128, 1 + R() * 2.2, 0, 7); g.fill(); }
  if (kind === 'marble') { g.strokeStyle = 'rgba(255,240,235,.9)'; for (let i = 0; i < 14; i++) { g.lineWidth = 0.8 + R() * 2.2; g.beginPath(); let x = R() * 128, y = R() * 128; g.moveTo(x, y); for (let j = 0; j < 6; j++) { x += (R() - 0.5) * 40; y += (R() - 0.3) * 30; g.lineTo(x, y); } g.stroke(); } }
  if (kind === 'fillet') { for (let i = -128; i < 256; i += 11) { g.strokeStyle = 'rgba(255,250,245,.95)'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(i, 0); g.quadraticCurveTo(i + 20, 64, i + 6, 128); g.stroke(); } }
  if (kind === 'batter') { g.fillStyle = '#f3e2b8'; g.fillRect(0, 0, 128, 128); for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(160,110,50,${0.2 + R() * 0.3})`; g.beginPath(); g.arc(R() * 128, R() * 128, 0.8 + R() * 2.4, 0, 7); g.fill(); } }
  if (kind === 'crumb') for (let i = 0; i < 1400; i++) { const v = 200 + R() * 55; g.fillStyle = `rgb(${v},${v * 0.92},${v * 0.8})`; g.fillRect(R() * 128, R() * 128, 1 + R() * 2, 1 + R() * 2); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return (FOODTEX[kind] = t); }
// 25 Nov 2026 (his final fix, his words: "the burger doesn't look like a burger so make the food look like its supposed to... a burger should look
// like how a burger should actually look from above put the food items next to each other not on top of each other phasing into each other...
// find a way to make the food look acceptable on a plate"). Everything put on the plate used to be dropped on one spot, each thing a centimetre
// above the last, in the shape it had on the board: a whole domed bun at the bottom with a patty half inside it and a bar of tomato through both.
// Now the plate is DRESSED. form: 'base' the bottom of a bun; 'crown' its top; 'stack' a thing as it lies in a sandwich (a frilled leaf, two
// slices of tomato, rings of onion, a square of cheese with its corners over the edge); 'side' a thing in its own neat place beside the others.
function tomSlice(T, M) { const g = new T.Group(), rim = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 0.006, 20), M([0.86, 0.14, 0.08])), fl = new T.Mesh(new T.CylinderGeometry(0.024, 0.024, 0.0064, 20), M([0.95, 0.42, 0.3])); g.add(rim, fl); for (let i = 0; i < 5; i++) { const a = i * 1.257, sd = new T.Mesh(new T.CylinderGeometry(0.006, 0.006, 0.0068, 8), M([0.98, 0.78, 0.4])); sd.position.set(Math.cos(a) * 0.013, 0, Math.sin(a) * 0.013); sd.scale.set(1, 1, 1.6); sd.rotation.y = -a; g.add(sd); } return g; }
function foodMesh(food, chopped, form) {
  if (form) { const T = THREE, g = new T.Group(), M = (c, tex) => new T.MeshStandardMaterial({ color: new T.Color(...c), roughness: 0.55, map: tex ? foodTex(tex) : null }), add = (geo, mat, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.castShadow = true; g.add(m); return m; }, R0 = W3.rng(food.length * 13 + form.length);
    if (food === 'bun' && form === 'base') { add(new T.CylinderGeometry(0.057, 0.052, 0.013, 24), M([0.84, 0.54, 0.24]), 0, 0.0065); add(new T.CylinderGeometry(0.053, 0.053, 0.002, 24), M([0.97, 0.88, 0.68], 'crumb'), 0, 0.0135); return g; }
    if (food === 'bun' && form === 'crown') { add(new T.SphereGeometry(0.057, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), M([0.86, 0.54, 0.22]), 0, 0.003, 0, 1, 0.62, 1); add(new T.CylinderGeometry(0.056, 0.056, 0.004, 24), M([0.95, 0.85, 0.65], 'crumb'), 0, 0.002);
      const sm = M([0.99, 0.96, 0.86]); for (let i = 0; i < 26; i++) { const a = R0() * 6.28, r = Math.sqrt(R0()) * 0.045, yy = 0.004 + 0.035 * Math.sqrt(Math.max(0, 1 - (r / 0.057) ** 2)); add(new T.SphereGeometry(0.0042, 6, 4), sm, Math.cos(a) * r, yy, Math.sin(a) * r, 1.7, 0.6, 1).rotation.y = a; } return g; }
    if (food === 'lettuce' && form === 'stack') { const geo = new T.CylinderGeometry(0.064, 0.064, 0.004, 36, 1), p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), r = Math.hypot(x, z); if (r > 0.03) { const a = Math.atan2(z, x), w = Math.sin(a * 9) * 0.007, q = (r + w) / r; p.setX(i, x * q); p.setZ(i, z * q); p.setY(i, p.getY(i) + Math.cos(a * 9) * 0.003 - 0.001); } } geo.computeVertexNormals(); add(geo, M([0.46, 0.78, 0.3]), 0, 0.003); add(new T.CylinderGeometry(0.03, 0.03, 0.0046, 18), M([0.62, 0.86, 0.42]), 0, 0.003); return g; }
    if (food === 'lettuce') { for (let i = 0; i < 7; i++) { const a = i * 0.9, r = i ? 0.018 : 0, l = add(new T.SphereGeometry(0.02, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.5), M([0.42 + R0() * 0.14, 0.72 + R0() * 0.12, 0.28]), Math.cos(a) * r, 0.004 + (i % 3) * 0.003, Math.sin(a) * r, 1.3, 0.5, 1); l.rotation.set((R0() - 0.5) * 0.7, R0() * 6, (R0() - 0.5) * 0.7); } return g; }
    if (food === 'tomato') { const n = form === 'stack' ? 2 : 3; for (let i = 0; i < n; i++) { const t = tomSlice(T, M); if (form === 'stack') t.position.set((i - 0.5) * 0.042, 0.0035 + i * 0.001, (i - 0.5) * 0.012); else { t.position.set((i - 1) * 0.03, 0.0035 + i * 0.004, (i - 1) * 0.006); t.rotation.z = -0.22; } t.traverse(o => { if (o.isMesh) o.castShadow = true; }); g.add(t); } return g; }
    if (food === 'onion') { const n = form === 'stack' ? 3 : 4, mt = M([0.97, 0.9, 0.95]), mp = M([0.78, 0.5, 0.72]); for (let i = 0; i < n; i++) { const r = form === 'stack' ? [0.03, 0.022, 0.016][i] : 0.024 - i * 0.003, x = form === 'stack' ? [-0.012, 0.016, 0.0][i] : (i - 1.5) * 0.02, z = form === 'stack' ? [0.004, -0.008, 0.02][i] : 0; const o1 = add(new T.TorusGeometry(r, 0.0034, 6, 22), mt, x, 0.004 + i * 0.0012, z); o1.rotation.x = Math.PI / 2; const o2 = add(new T.TorusGeometry(r + 0.0026, 0.0014, 5, 22), mp, x, 0.0045 + i * 0.0012, z); o2.rotation.x = Math.PI / 2; } return g; }
    if (food === 'cheese') { const c = add(new T.BoxGeometry(0.086, 0.004, 0.086), M([1.0, 0.72, 0.14]), 0, 0.002); c.rotation.y = Math.PI / 4; return g; }      /* a square slice, turned so its corners hang over the meat */
    if (food === 'mushroom') { const n = 4; for (let i = 0; i < n; i++) { const x = (i - 1.5) * 0.024, cap = add(new T.CylinderGeometry(0.014, 0.014, 0.005, 14, 1, false, 0, Math.PI), M([0.9, 0.82, 0.7]), x, 0.003 + i * 0.001, -0.004); const st = add(new T.BoxGeometry(0.009, 0.005, 0.014), M([0.95, 0.9, 0.82]), x, 0.003 + i * 0.001, 0.006); cap.rotation.y = Math.PI / 2; const gl = add(new T.BoxGeometry(0.024, 0.0052, 0.003), M([0.5, 0.36, 0.26]), x, 0.003 + i * 0.001, -0.002); } if (form === 'stack') g.scale.setScalar(0.92); return g; }
  }
  const T = THREE, g = new T.Group(), M = (c, tex) => new T.MeshStandardMaterial({ color: new T.Color(...(Array.isArray(c) ? c : [0, 0, 0])), roughness: 0.55, map: tex ? foodTex(tex) : null }), add = (geo, mat, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.castShadow = true; g.add(m); return m; };
  const R0 = Math.random;
  const grill = (n, len, y, gap, drop) => { for (let i = 0; i < n; i++) { const o = i - (n - 1) / 2, b = add(new T.BoxGeometry(len * (1 - Math.abs(o) * 0.14), 0.0018, 0.0055), M([0.16, 0.08, 0.04]), 0, y - Math.abs(o) * drop, o * gap); b.rotation.y = 0.5; b.position.set(Math.sin(0.5) * o * gap, y - Math.abs(o) * drop, Math.cos(0.5) * o * gap); b.userData.grill = true; b.visible = false; b.castShadow = false; } };      /* the lines the pan leaves: they show once it is cooking (shade) */
  if (food === 'patty') { add(new T.CylinderGeometry(0.048, 0.05, 0.018, 20), M(RAWC.patty, 'mince'), 0, 0.009); grill(3, 0.078, 0.0186, 0.021, 0); }
  if (food === 'steak') { add(new T.SphereGeometry(0.06, 20, 10), M(RAWC.steak, 'marble'), 0, 0.012, 0, 1.15, 0.22, 0.8); add(new T.TorusGeometry(0.05, 0.006, 6, 24, 2.2), M([0.95, 0.9, 0.82]), 0, 0.016, 0, 1.15, 0.8, 1).rotation.x = Math.PI / 2; grill(3, 0.092, 0.0252, 0.022, 0.0012); }      /* a rim of fat */
  if (food === 'salmon') { add(new T.CylinderGeometry(0.03, 0.03, 0.11, 18, 1, false, 0, Math.PI), M(RAWC.salmon, 'fillet'), 0, 0.004, 0, 0.55, 1, 1).rotation.set(0, 0, Math.PI / 2); add(new T.BoxGeometry(0.11, 0.004, 0.058), M([0.55, 0.55, 0.58]), 0, 0.002); for (let i = 0; i < 5; i++) { const l = add(new T.BoxGeometry(0.0035, 0.002, 0.03), M([1, 0.86, 0.78]), -0.04 + i * 0.02, 0.0202, 0); l.rotation.y = 0.38; l.userData.keep = true; l.castShadow = false; } }      /* a fillet, flat, with its pale lines of fat (it was a round log: a sausage, not a fish) */      /* a fillet on its silver skin */
  if (food === 'pancake') add(new T.CylinderGeometry(0.058, 0.06, 0.012, 28), M(RAWC.pancake, 'batter'), 0, 0.006);
  if (food === 'egg') { add(new T.CylinderGeometry(0.052, 0.055, 0.006, 24), M(RAWC.egg), 0, 0.003, 0, 1, 1, 0.85); add(new T.SphereGeometry(0.018, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshStandardMaterial({ color: 0xffb21a, roughness: 0.2 }), 0.008, 0.005, 0.004); }
  if (food === 'bun') { add(new T.SphereGeometry(0.055, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), M([0.86, 0.56, 0.24]), 0, 0.012, 0, 1, 0.55, 1); add(new T.CylinderGeometry(0.055, 0.055, 0.014, 20), M([0.95, 0.85, 0.65], 'crumb'), 0, 0.007);
    const sm = M([0.98, 0.95, 0.85]); for (let i = 0; i < 16; i++) { const a = R0() * 6.28, r = Math.sqrt(R0()) * 0.04, yy = 0.012 + 0.03 * Math.sqrt(Math.max(0, 1 - (r / 0.055) ** 2)); add(new T.SphereGeometry(0.004, 6, 4), sm, Math.cos(a) * r, yy, Math.sin(a) * r, 1.6, 0.6, 1).rotation.y = a; } }      /* sesame */
  if (food === 'toast') { add(new T.BoxGeometry(0.09, 0.012, 0.09), M([0.62, 0.38, 0.16]), 0, 0.006); add(new T.BoxGeometry(0.078, 0.0125, 0.078), M([0.95, 0.82, 0.58], 'crumb'), 0, 0.0065); }      /* crust round a crumb */
  if (food === 'lettuce') { if (!chopped) for (let i = 0; i < 9; i++) { const l = add(new T.SphereGeometry(0.03, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.55), M([0.42 + R0() * 0.18, 0.72 + R0() * 0.12, 0.28]), (R0() - 0.5) * 0.04, 0.008 + i * 0.003, (R0() - 0.5) * 0.04, 1.35, 0.55, 1.1); l.rotation.set((R0() - 0.5) * 0.9, R0() * 6, (R0() - 0.5) * 0.9); }      /* a head of leaves */ else for (let i = 0; i < 14; i++) add(new T.BoxGeometry(0.03, 0.004, 0.008), M([0.4, 0.66, 0.24]), (R0() - 0.5) * 0.07, 0.004 + R0() * 0.008, (R0() - 0.5) * 0.06); }
  if (food === 'tomato') { if (!chopped) { add(new T.SphereGeometry(0.032, 18, 12), M([0.85, 0.12, 0.08]), 0, 0.03, 0, 1, 0.86, 1); for (let i = 0; i < 5; i++) add(new T.ConeGeometry(0.004, 0.022, 4), M([0.25, 0.5, 0.18]), Math.cos(i * 1.26) * 0.008, 0.058, Math.sin(i * 1.26) * 0.008).rotation.set(Math.sin(i * 1.26) * 1.3, 0, -Math.cos(i * 1.26) * 1.3); } else for (let i = 0; i < 4; i++) add(new T.CylinderGeometry(0.03, 0.03, 0.006, 16), M([0.88, 0.2, 0.12]), (i - 1.5) * 0.022, 0.004, 0); }
  if (food === 'cheese') { for (let i = 0; i < 3; i++) add(new T.BoxGeometry(0.085, 0.004, 0.085), M([1.0, 0.76 - i * 0.02, 0.16]), i * 0.004 - 0.004, 0.003 + i * 0.0042, i * 0.003).rotation.y = i * 0.12; }      /* a little pile of slices */
  if (food === 'bacon') { for (const z of [-0.016, 0.016]) for (let i = 0; i < 5; i++) { const b = add(new T.BoxGeometry(0.024, 0.004, 0.024), M(RAWC.bacon), (i - 2) * 0.022, 0.004 + (i % 2) * 0.003, z); b.rotation.z = (i % 2 ? -1 : 1) * 0.22; } for (const z of [-0.016, 0.016]) add(new T.BoxGeometry(0.108, 0.0042, 0.006), M([0.98, 0.9, 0.84]), 0, 0.0068, z - 0.007).userData.keep = true; }      /* two wavy rashers, a streak of fat along each */
  if (food === 'sausage') { for (const z of [-0.014, 0.014]) { const b = add(new T.CapsuleGeometry(0.011, 0.07, 4, 10), M(RAWC.sausage), 0, 0.011, z); b.rotation.z = Math.PI / 2; } }
  if (food === 'mushroom') { if (!chopped) { add(new T.SphereGeometry(0.03, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), M([0.88, 0.8, 0.68]), 0, 0.022, 0, 1, 0.75, 1); add(new T.CylinderGeometry(0.011, 0.013, 0.024, 10), M([0.95, 0.9, 0.82]), 0, 0.012); } else return foodMesh('mushroom', true, 'side'); }
  if (food === 'onion') { if (!chopped) { add(new T.SphereGeometry(0.03, 18, 12), M([0.72, 0.46, 0.62]), 0, 0.03); add(new T.ConeGeometry(0.008, 0.02, 8), M([0.82, 0.7, 0.55]), 0, 0.066); } else for (let i = 0; i < 4; i++) add(new T.TorusGeometry(0.022 - i * 0.004, 0.003, 6, 18), M([0.95, 0.9, 0.92]), (i - 1.5) * 0.015, 0.004, 0).rotation.x = Math.PI / 2; }
  return g;
}
// where each thing on the plate lies (metres from the plate's middle; y above the plate). foods: in the order they went on; whole: the dish is complete.
const THICK = { bun: 0.0145, toast: 0.012, patty: 0.018, steak: 0.02, salmon: 0.03, pancake: 0.012, egg: 0.008, cheese: 0.004, lettuce: 0.006, tomato: 0.007, onion: 0.006, bacon: 0.009, mushroom: 0.007, sausage: 0.022 };
function plateLayout(foods, whole, ref) { const out = [], isMain = f => FOOD[f].to === 'pan', R2 = ref && ref.length ? ref : foods, onToast = R2.includes('toast') && R2.filter(isMain).length <= 1 && R2.filter(f => f !== 'toast').length <= 3;      /* egg on toast, a B.L.T., a steak sandwich: built on the toast. A fry-up, salmon and eggs: a plate, the toast at its side */
  const bread = foods.findIndex(f => f === 'bun' || (f === 'toast' && onToast));
  if (bread >= 0) {      // a sandwich: built up on its bread, each layer resting on the one below
    const bun = foods[bread] === 'bun', cx = bun ? -0.024 : 0, cz = 0.004; let y = 0, n = 0;
    out.push({ i: bread, food: foods[bread], form: bun ? 'base' : null, x: cx, z: cz, y: 0, rot: bun ? 0 : 0.2 }); y += THICK[foods[bread]];
    const spare = [];
    foods.forEach((f, i) => { if (i === bread) return; if (f === 'bun' || f === 'toast') { spare.push(i); return; } const k2 = n++, jx = [0, 0.004, -0.004, 0.003, -0.003][k2 % 5], jz = [0, -0.003, 0.004, 0.004, -0.004][k2 % 5];
      out.push({ i, food: f, form: FOOD[f].to === 'board' || f === 'cheese' ? 'stack' : null, x: cx + jx, z: cz + jz, y, rot: f === 'cheese' ? 0 : f === 'salmon' || f === 'bacon' || f === 'sausage' ? 0.5 + k2 * 0.4 : k2 * 0.7, s: f === 'steak' ? 0.8 : f === 'salmon' ? 0.85 : f === 'pancake' ? 0.9 : f === 'bacon' ? 0.9 : 1 }); y += THICK[f]; });
    // the top of the bun: beside the stack until the dish is whole, then on it, pushed back a little so the layers show
    if (bun) out.push(whole ? { i: -1, food: 'bun', form: 'crown', x: cx + 0.004, z: cz - 0.012, y: y - 0.001, rx: -0.2, rot: 0.3 } : { i: -1, food: 'bun', form: 'crown', x: 0.068, z: -0.022, y: 0.001, rot: 0.6 });
    spare.forEach((i, q) => out.push({ i, food: foods[i], form: foods[i] === 'bun' ? 'base' : null, x: 0.07, z: 0.045 - q * 0.02, y: q * 0.014, rot: 0.4 }));
    return out; }
  // a plated meal: the meat, fish, eggs or pancakes on one side (the same thing twice makes a stepped pile), each vegetable in its own place on the other
  const mains = [], sides = []; foods.forEach((f, i) => { const L = isMain(f) ? mains : sides, same = L.find(q => q.food === f); if (same) same.is.push(i); else L.push({ food: f, is: [i] }); });
  const only = !sides.length || !mains.length, MP = { 1: [[only ? 0 : -0.04, 0]], 2: [[-0.045, -0.038], [-0.03, 0.042]], 3: [[-0.05, -0.04], [-0.045, 0.045], [0.02, -0.06]], 4: [[-0.05, -0.04], [-0.045, 0.045], [0.02, -0.065], [0.03, 0.06]] }, SP = { 1: [[only ? 0 : 0.058, 0.004]], 2: [[only ? -0.035 : 0.056, -0.036], [only ? 0.04 : 0.06, 0.04]], 3: [[0.05, -0.056], [0.072, 0.002], [0.05, 0.058]], 4: [[0.05, -0.056], [0.072, 0.002], [0.05, 0.058], [-0.005, 0.07]] };
  const put1 = (q, a, x, z, main, sc) => { let y = 0; q.is.forEach((i, b) => { const flat = main || q.food === 'toast' || q.food === 'bun'; out.push({ i, food: q.food, form: flat ? null : 'side', x: x + b * (flat ? 0.014 : 0.01), z: z + b * (flat ? -0.008 : 0.012), y, rot: main ? (q.food === 'salmon' || q.food === 'bacon' || q.food === 'sausage' ? 0.35 : 0.2 + a * 0.5) + b * 0.25 : q.food === 'toast' ? 0.5 : -0.3 + a * 0.5, s: sc }); y += flat ? THICK[q.food] : 0.004; }); };
  const all = mains.concat(sides), n = all.length;
  if (n >= 5) { const mid = n >= 6 ? 1 : 0, ring = n - mid, r = n >= 6 ? 0.072 : 0.064, sc = n >= 6 ? 0.72 : 0.8;      /* a full plate: everything in its own place round the plate (one in the middle when there are six) */
    all.forEach((q, a) => { if (mid && a === 0) return put1(q, a, 0, 0, isMain(q.food), sc); const k2 = a - mid, an = Math.PI + k2 * Math.PI * 2 / ring; put1(q, a, Math.cos(an) * r, Math.sin(an) * r * 0.92, isMain(q.food), sc); }); return out; }
  const lay = (L, P, main) => { const pos = P[Math.min(4, L.length)] || []; L.forEach((q, a) => { const [x, z] = pos[Math.min(a, pos.length - 1)]; put1(q, a, x, z, main, mains.length > 2 && main ? 0.85 : 1); }); };
  lay(mains, MP, true); lay(sides, SP, false); return out; }
function shade(m, food, s) { const a = RAWC[food], b = GOLDC[food]; if (!a) return; const c = s < 1 ? a.map((v, i) => v + (b[i] - v) * Math.min(1, s / 0.95)) : b.map(v => v * Math.max(0.12, 1 - (s - 1.05) * 2.4)); m.traverse(o => { if (!o.isMesh) return; if (o.userData.grill) { o.visible = s > 0.55; return; } if (o.userData.keep) return; if (o.material.color && !(food === 'egg' && o.geometry.type === 'SphereGeometry')) o.material.color.setRGB(c[0], c[1], c[2]); }); }
function setWeather(G) {
  const V = buildWorld(); if (V.none || V.sky === G.weather) return; V.sky = G.weather;
  W3.setSky(G.weather, { azim: 180 }); W3.S.exposure *= 0.72; W3.scene.environmentIntensity = 0.45;      // indoors: the window is bright, the kitchen is not W3.scene.children.forEach(o => { if (o.isLineSegments) o.visible = false; });      // no rain falls indoors
  W3.S.onBolt = () => { if (!HEADLESS && sfx.thunder) setTimeout(() => sfx.thunder(), 300 + Math.random() * 900); };
}
function puff(x, z, n) { if (!V3 || V3.none) return; let k2 = 0; for (const p of V3.puffs) { if (p.t < p.life) continue; Object.assign(p, { t: 0, life: 0.9 + Math.random() * 0.8, x: x + (Math.random() - 0.5) * 0.12, y: TOP + 0.03, z: z + (Math.random() - 0.5) * 0.12 }); if (++k2 >= n) break; } }
const ui = { drag: null, snap: false };
function onEvent(G, e) {
  const cx = W / 2, cy = H * 0.42;
  switch (e.k) {
    case 'ticket': sfx.ticket(); break;
    case 'sizzle': sfx.drop(); break;
    case 'onboard': sfx.thunk(); break;
    case 'unplate': sfx.thunk(); say(`${FOOD[e.food].name.toUpperCase()} OFF`, cx, cy, '#ffd0c4', 16); break;
    case 'plated': sfx.plate(); if (e.q === 'perfect') say('PERFECT!', cx, cy, '#ffe08a', 22); else if (e.q === 'raw') say('STILL RAW!', cx, cy, '#ffb4a8', 22); else if (e.q === 'burnt') say('BURNT!', cx, cy, '#ffb4a8', 22); break;
    case 'flip': sfx.flip(); vibe(HAP.tick); if (e.side < G.cfg.gold[0]) say('FLIPPED TOO SOON', cx, cy, '#ffd0c4', 18); break;
    case 'noflip': say('EGGS STAY SUNNY SIDE UP', cx, cy, '#ffd0c4', 18); break;
    case 'chop': sfx.chop(e.n); if (V3 && !V3.none) V3.chopA = 1; break;
    case 'golden': sfx.ding2(); break;
    case 'burnt': sfx.burn(); FX.red = 0.3; tip('burnt', 'Flip when it turns golden, before it goes black', 2.6); break;
    case 'refuse': sfx.no(); say({ notpan: 'THAT DOES NOT GO IN A PAN', panfull: 'THAT PAN IS BUSY', notboard: 'NOTHING TO CHOP THERE', boardfull: 'CLEAR THE BOARD FIRST', notplate: 'COOK OR CHOP IT FIRST', notchopped: 'CHOP IT FIRST', noorder: 'NO ORDER YET' }[e.why] || 'NO', cx, cy, '#ffd0c4', 18); break;
    case 'bin': sfx.bin(); break;
    case 'served': sfx.bell(); FX.flash = 0.4; vibe(HAP.best); say(e.perfect ? `${e.name.toUpperCase()}: PERFECT!` : `${e.name.toUpperCase()} SERVED`, cx, H * 0.3, e.perfect ? '#ffe08a' : '#9be3b5', 24); if (e.fast) say('+ QUICK TIP', cx, H * 0.3 + 30 * k, '#9be3b5', 18); if (e.neat) say('+ BUILT IN ORDER', cx, H * 0.3 + (e.fast ? 54 : 30) * k, '#ffe08a', 18); break;
    case 'sendback': sfx.no(); FX.red = 0.4; say(e.why === 'wrong' ? 'WRONG ORDER: SENT BACK' : e.why === 'raw' ? 'RAW: SENT BACK' : 'BURNT: SENT BACK', cx, H * 0.3, '#ffb4a8', 22); tip('send_' + e.why, e.why === 'wrong' ? 'Serve the OLDEST ticket (on the left): everything on it, nothing else' : 'Golden both sides before it goes on the plate', 3); break;
    case 'walkout': sfx.walk(); FX.red = 0.5; say('A CUSTOMER WALKED OUT', cx, H * 0.3, '#ffb4a8', 22); break;
    case 'lessonnext': if (e.first) hint = null; say(e.first ? 'FIRST, A LESSON' : 'NEXT LESSON', cx, H * 0.5, '#ffd36a', 26); sfx.ding(); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, cx, H * 0.5, '#9be3b5', 26); sfx.coin(e.n); break;
    case 'lessonmiss': coachMiss(); break;
    case 'lessondone': say('THE KITCHEN IS YOURS!', cx, H * 0.5, '#ffd36a', 26); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); vibe(HAP.best); break;
    case 'lost': sfx.lose(); break;
  }
}
function place(m, x, z, y = TOP) { m.position.set(x, y, z); }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#0b1418'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D kitchen.', W / 2, H / 2); return; }
  const T = V.T, cam = W3.cam, g = G || idleG(), t = now, sp = spots(g); setWeather(g);
  const asp = innerWidth / innerHeight; /* 22 Nov 2026 (the audit): on a phone the camera looks more nearly straight down, so the hob, the board and the food fill the screen instead of a dark wall above and glare below */
  if (asp > 1.3) { cam.position.set(-0.05, TOP + 1.05, 0.42); cam.fov = 48; cam.updateProjectionMatrix(); cam.lookAt(-0.05, TOP, -0.3); }      // sideways: the whole counter, a little from the front
  else if (asp < 0.6) { cam.position.set(0, TOP + 1.5, 0.2); cam.fov = 60; cam.updateProjectionMatrix(); cam.lookAt(0, TOP + 0.02, -0.34); } else { cam.position.set(0, TOP + 0.95, 0.62); cam.fov = 50; cam.updateProjectionMatrix(); cam.lookAt(0, TOP + 0.02, -0.4); }
  if (FX.shake > 0) cam.rotation.z += (Math.random() - 0.5) * FX.shake * 0.002;
  // stations
  V.pans.forEach((p, i) => { const s = sp.pans[i]; p.visible = V.burners[i].visible = !!s; if (s) { place(p, s.x, s.z); place(V.burners[i], s.x, s.z, TOP + 0.013); V.burners[i].material.opacity = 0.6 + Math.sin(t * 7 + i) * 0.1; } });
  place(V.board, sp.board.x, sp.board.z, TOP + 0.012); place(V.plate, sp.plate.x, sp.plate.z, TOP + 0.004); V.plate.scale.setScalar(1.2); place(V.bin, sp.bin.x, sp.bin.z, TOP + 0.025);
  V.chopA = Math.max(0, V.chopA - dt * 6); V.knife.position.set(sp.board.x + 0.05, TOP + 0.03 + V.chopA * 0.06, sp.board.z + 0.12 - V.chopA * 0.1); V.knife.rotation.set(0, 0.3, 0);
  V.trays.forEach((m, i) => { m.visible = i < sp.tray.length; if (m.visible) place(m, sp.tray[i].x, sp.tray[i].z, TOP + 0.015); });
  // the food: what is where, with each piece kept as one model while it stays put
  const want = new Map(), key = (k2, food, ch) => k2 + ':' + food + ':' + (ch ? 1 : 0), put = (k2, food, ch, x, z, y) => { const id = key(k2, food, ch); let m = V.foods.get(id); if (!m) { m = foodMesh(food, ch); V.S.add(m); V.foods.set(id, m); } want.set(id, m); m.position.set(x, y, z); return m; };
  sp.tray.forEach((s2, i) => { const m = put('tray' + i, s2.food, false, s2.x, s2.z, TOP + 0.03); m.rotation.y = i; });
  g.pans.forEach((p, i) => { if (!p || !sp.pans[i]) return; const s = sp.pans[i], m = put('pan' + i, p.food, false, s.x, s.z, TOP + 0.012); const flipT = p.flipT = Math.max(0, (p.flipT || 0) - dt); shade(m, p.food, p.sides[1 - p.down]); m.rotation.x = 0; if (Math.random() < dt * 4) puff(s.x, s.z, 1); });
  if (g.board) { const m = put('board', g.board.food, g.board.chops >= FOOD[g.board.food].chops, sp.board.x, sp.board.z, TOP + 0.025); }
  { const tk = g.tickets && g.tickets[0], foods = g.plate.map(p => p.food), whole = !!tk && foods.length === tk.dish.items.length && foods.slice().sort().join() === tk.dish.items.slice().sort().join(), LY = plateLayout(foods, whole, tk ? tk.dish.items : null), PS = 1.2;
    LY.forEach((q, j) => { const p = q.i >= 0 ? g.plate[q.i] : null, id = 'plate' + j + ':' + q.food + ':' + (q.form || '') , ch = FOOD[q.food].to === 'board'; let m = V.foods.get(id); if (!m) { m = foodMesh(q.food, ch, q.form); V.S.add(m); V.foods.set(id, m); } want.set(id, m);
      m.position.set(sp.plate.x + q.x * PS, TOP + 0.02 + q.y * PS, sp.plate.z + q.z * PS); m.rotation.set(q.rx || 0, q.rot || 0, q.rz || 0); m.scale.setScalar(PS * (q.s || 1)); if (p && RAWC[q.food]) shade(m, q.food, p.q === 'burnt' ? 1.6 : p.q === 'raw' ? 0.4 : 0.95); }); }
  for (const [id, m] of V.foods) if (!want.has(id)) { V.S.remove(m); V.foods.delete(id); }
  const pa = V.steam.geometry.attributes.position, aa = V.steam.geometry.attributes.a; V.puffs.forEach((p, i) => { if (p.t < p.life) { p.t += dt; p.y += dt * 0.12; p.x += Math.sin(t + i) * dt * 0.02; } pa.setXYZ(i, p.x, p.t < p.life ? p.y : -9, p.z); aa.setX(i, p.t < p.life ? Math.sin(p.t / p.life * Math.PI) : 0); }); pa.needsUpdate = aa.needsUpdate = true; V.steam.material.uniforms.px.value = W3.R.getPixelRatio() * innerHeight / 844;
  W3.setFocus(0, TOP, -0.2, 0.8);
  W3.render(dt);
  if (G) hud(G, sp);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 0.9 ? 1 : 1 - (t2.t - 0.9) / 0.4; ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(t2.size * k)}px ${BC}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 26 * k); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 26 * k); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(15 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 19 * k, h = lines.length * lh + 16 * k, w = Math.min(W - 24, Math.max(...lines.map(l => ctx.measureText(l).width)) + 34);
    ctx.fillStyle = 'rgba(0,0,0,.66)'; rrect(W / 2 - w / 2, H * 0.5 - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.5 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,60,40,${FX.red * 0.18})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,248,230,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); }
}
let IG = null; function idleG() { if (!IG) { IG = newGame(Math.max(1, store.get('level', 1) | 0), { seed: 1 }); take(IG, 'pancake', 'pan', 0); take(IG, 'patty', 'pan', 1); } IG.pans.forEach(p => { if (p) { p.sides[p.down] = Math.min(0.9, p.sides[p.down] + 0.0005); } }); return IG; }
// screen positions of the stations (for the touches and the gauges)
function scr(x, z, y = TOP) { return V3 && !V3.none ? W3.screen(new THREE.Vector3(x, y, z)) : { x: W / 2 + x * 400, y: H * 0.6 + z * 400 }; }
function hud(G, sp) {
  const c = G.cfg;
  if (G.lesson) lessonPanel(G);
  // tickets: paper slips along the top, oldest first, each with what goes on it and how long they have waited
  const ty = G.lesson ? H * 0.235 : 42 * k, tw = Math.min(124 * k, (W - 28) / Math.max(3, G.tickets.length) - 6);
  G.tickets.forEach((tk, i) => { const x = 14 + i * (tw + 8), h = (36 + 11 * tk.dish.items.length) * k; ctx.save(); ctx.translate(x, ty); ctx.rotate((i % 2 ? 1 : -1) * 0.015);
    ctx.fillStyle = '#fbf6e8'; ctx.fillRect(0, 0, tw, h); ctx.fillStyle = i === 0 ? '#e0533a' : '#b9b3a2'; ctx.fillRect(0, 0, tw, 5 * k);
    ctx.fillStyle = '#2b2b2b'; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillText(tk.dish.name, 6, 9 * k);
    // the layers, numbered from the bottom of the dish up; on the ticket you are cooking, the ones already on the plate are ticked
    ctx.font = `600 ${Math.round(10 * k)}px ${BC}`; { const on = i === 0 ? G.plate.map(p => p.food) : [], left = on.slice(); tk.dish.items.forEach((f, j) => { const q = left.indexOf(f), have = q >= 0; if (have) left.splice(q, 1); ctx.fillStyle = have ? '#2e8b57' : '#555'; ctx.fillText(`${j + 1}  ${FOOD[f].name}${have ? '  ✓' : ''}`, 6, 25 * k + j * 11 * k); }); }
    const u = 1 - tk.wait / tk.max; ctx.fillStyle = '#ddd5c2'; ctx.fillRect(0, h - 5 * k, tw, 5 * k); ctx.fillStyle = u > 0.5 ? '#5cb85c' : u > 0.25 ? '#f0ad4e' : '#d9534f'; ctx.fillRect(0, h - 5 * k, tw * u, 5 * k); ctx.restore(); });
  if (!G.lesson) { ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = '#fff'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.5)'; const s = `${G.served} / ${c.orders} served`; ctx.strokeText(s, W - 14, ty + 88 * k); ctx.fillText(s, W - 14, ty + 88 * k);
    for (let i = 0; i < c.lives; i++) { ctx.beginPath(); ctx.arc(W - 20 - i * 16 * k, ty + 110 * k, 5 * k, 0, TAU); ctx.fillStyle = i < G.lives ? '#ffd36a' : 'rgba(255,255,255,.25)'; ctx.fill(); } }
  // a ring round each pan: how done the underside is, with the golden band; the top side's colour you can see
  G.pans.forEach((p, i) => { if (!p || !sp.pans[i]) return; const s = scr(sp.pans[i].x, sp.pans[i].z), r = 30 * k, v = p.sides[p.down], gold = c.gold, a0 = -Math.PI / 2, A = u => a0 + clamp(u / 1.5, 0, 1) * TAU;
    ctx.lineWidth = 6 * k; ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.arc(s.x, s.y - 40 * k, r, 0, TAU); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,200,80,.55)'; ctx.beginPath(); ctx.arc(s.x, s.y - 40 * k, r, A(gold[0]), A(gold[1])); ctx.stroke();
    ctx.strokeStyle = v > BURNT ? '#222' : v >= gold[0] && v <= gold[1] ? '#ffcf4a' : v > gold[1] ? '#a0522d' : '#f2e6c8'; ctx.lineWidth = 4 * k; ctx.beginPath(); ctx.arc(s.x, s.y - 40 * k, r, a0, A(v)); ctx.stroke();
    const done = FOOD[p.food].sides === 1 ? 1 : p.sides[1 - p.down] >= gold[0] ? 2 : 1; ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(FOOD[p.food].sides === 1 ? 'NO FLIP' : `SIDE ${p.down === 0 && p.sides[1] === 0 ? 1 : done}`, s.x, s.y - 40 * k); });
  if (G.board) { const s = scr(sp.board.x, sp.board.z), F = FOOD[G.board.food]; if (G.board.chops < F.chops) { ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.5)'; const s2 = G.lesson ? `TAP TO CHOP ${G.board.chops}/${F.chops}` : '●'.repeat(G.board.chops) + '○'.repeat(F.chops - G.board.chops); ctx.strokeText(s2, s.x, s.y - 34 * k); ctx.fillText(s2, s.x, s.y - 34 * k); } }
  // what is being dragged
  if (ui.drag && ui.drag.moved && ui.drag.label) { const d = ui.drag; ctx.globalAlpha = 0.9; ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; const w = ctx.measureText(d.label).width + 18; rrect(d.x - w / 2, d.y - 44 * k, w, 24 * k, 10); ctx.fill(); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(d.label, d.x, d.y - 32 * k); ctx.globalAlpha = 1; }
  if ((G && G.lesson) && G.N <= 2 && !G.lesson && G.t < 8) { ctx.globalAlpha = 0.8; ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.textAlign = 'center'; const p = scr(0, -0.72, TOP + 0.24); ctx.fillText('THE PASS: DRAG THE PLATE HERE', p.x, p.y); ctx.globalAlpha = 1; }
}
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { coachPanel(G); }
