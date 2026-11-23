// ===================== THE T-REX (23 Nov 2026) =====================
// His words: "That T-Rex looks like shit. You need to do way better graphics. Make him look like an actual T-Rex." He was a pile of
// balls and cones. Built now from what the skeletons and the best life restorations show (specs/rex-v2-2026-11-23.md):
// a long, deep, boxy skull (about an eighth of his length) widest at the cheeks, with brow bosses over forward-set eyes, a row of
// teeth and a lower jaw that drops; a short, thick, S-curved neck; a deep chest and belly; the back held level and balanced by a long,
// heavy tail that tapers to a point; huge drumstick thighs, long shins and bird-like feet with three clawed toes; tiny arms with two
// clawed fingers. Every part is one smooth skin (`sweep`: a tube of oval cross-sections along a curve), pebbly scales (a cell pattern
// for colour and bumps), dark on the back with faint bands and pale underneath.
function trexModel(T, col) {
  const tex = trexSkin(T), base = new T.Color(col), dark = base.clone().multiplyScalar(0.3), pale = base.clone().lerp(new T.Color(0xe8dcb8), 0.72);
  const skin = new T.MeshStandardMaterial({ map: tex.map, normalMap: tex.normal, normalScale: new T.Vector2(0.9, 0.9), vertexColors: true, roughness: 0.82, metalness: 0.0 });
  const bone = new T.MeshStandardMaterial({ color: 0xe0d2a8, roughness: 0.5 }), claw = new T.MeshStandardMaterial({ color: 0x2a2420, roughness: 0.4 }), mouthM = new T.MeshStandardMaterial({ color: 0x5a1a18, roughness: 0.7 });
  // one smooth tube through sections {y, z, w, h, x?, top?} (w across, h up and down); stripes darken bands on the back along the way
  function sweep(S, o = {}) {
    const n = 18, sub = 5, P = []; const cr = (a, b, c, d, t) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
    for (let i = 0; i < S.length - 1; i++) for (let s = 0; s < (i === S.length - 2 ? sub + 1 : sub); s++) { const t = s / sub, a = S[Math.max(0, i - 1)], b = S[i], c = S[i + 1], d = S[Math.min(S.length - 1, i + 2)], q = {};
      for (const k of ['x', 'y', 'z', 'w', 'h', 'top']) q[k] = cr(a[k] || 0, b[k] || 0, c[k] || 0, d[k] || 0, t); P.push(q); }
    const pos = [], nor = [], uv = [], colr = [], idx = []; let len = 0;
    P.forEach((q, i) => { const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)]; let ty = b.y - a.y, tz = b.z - a.z; const tl = Math.hypot(ty, tz) || 1; ty /= tl; tz /= tl;
      if (i) len += Math.hypot(q.y - P[i - 1].y, q.z - P[i - 1].z);
      let uy = tz, uz = -ty; if (uy < -0.2 || (Math.abs(uy) <= 0.2 && uz < 0)) { uy = -uy; uz = -uz; }      // "up" in the cross-section: perpendicular to the curve, upwards
      for (let j = 0; j <= n; j++) { const th = j / n * Math.PI * 2, cs = Math.cos(th), sn = Math.sin(th), e = 2 / 2.4, ex = Math.sign(cs) * Math.pow(Math.abs(cs), e), ey = Math.sign(sn) * Math.pow(Math.abs(sn), e);
        const ridge = sn > 0 ? 1 + (q.top || 0) * Math.pow(Math.max(0, 1 - Math.abs(cs) * 3), 2) : 1, X = q.x + ex * q.w, Yo = ey * q.h * ridge;
        pos.push(X, q.y + uy * Yo, q.z + uz * Yo); uv.push(j / n * 2, len * 0.9); nor.push(o.stripes ? 0.55 + 0.45 * Math.pow(0.5 + 0.5 * Math.cos(len * o.stripes), 0.5) : 1); } });
    for (let i = 0; i < P.length - 1; i++) for (let j = 0; j < n; j++) { const a = i * (n + 1) + j, b = a + n + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    // close both ends
    for (const [i, flip] of [[0, true], [P.length - 1, false]]) { const c0 = pos.length / 3, q = P[i]; pos.push(q.x, q.y, q.z); nor.push(1); uv.push(0.5, 0);
      for (let j = 0; j < n; j++) { const a = i * (n + 1) + j; if (flip) idx.push(c0, a + 1, a); else idx.push(c0, a, a + 1); } }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    // dark on top, pale underneath (from which way each bit of skin faces), faint bands across the back
    const NA = g.attributes.normal; for (let v = 0; v < NA.count; v++) { const up = (NA.getY(v) + 1) / 2, c = pale.clone().lerp(dark, Math.min(1, Math.pow(up, 1.1) * 1.15)); if (up > 0.55) c.multiplyScalar(1 - (1 - nor[v]) * Math.min(1, (up - 0.55) * 4)); colr.push(c.r, c.g, c.b); }
    g.setAttribute('color', new T.Float32BufferAttribute(colr, 3));
    const m = new T.Mesh(g, o.mat || skin); m.castShadow = true; m.receiveShadow = true; return m; }
  const mirror = (S) => S.map(q => Object.assign({}, q, { x: -(q.x || 0) }));
  const g = new T.Group(), body = new T.Group(); g.add(body); const legs = [];
  // the trunk: chest, the deep belly, the hips; the back level at about 3.5
  body.add(sweep([{ y: 3.62, z: 2.35, w: 0.5, h: 0.55 }, { y: 3.5, z: 1.9, w: 0.78, h: 0.86, top: 0.06 }, { y: 3.28, z: 1.15, w: 1.0, h: 1.14, top: 0.08 }, { y: 3.25, z: 0.25, w: 1.06, h: 1.12, top: 0.1 },
    { y: 3.38, z: -0.6, w: 0.98, h: 0.9, top: 0.12 }, { y: 3.48, z: -1.35, w: 0.8, h: 0.74, top: 0.12 }, { y: 3.5, z: -1.8, w: 0.66, h: 0.62, top: 0.1 }], { stripes: 3.2 }));
  // the tail: two parts so it can sway, held out level behind and tapering to a point
  const tail = new T.Group(); tail.position.set(0, 3.5, -1.6); body.add(tail);
  tail.add(sweep([{ y: 0, z: 0.1, w: 0.7, h: 0.66, top: 0.12 }, { y: -0.03, z: -1.0, w: 0.56, h: 0.55, top: 0.12 }, { y: -0.08, z: -2.1, w: 0.42, h: 0.42, top: 0.1 }, { y: -0.12, z: -3.1, w: 0.3, h: 0.31, top: 0.08 }], { stripes: 3.2 }));
  const tail2 = new T.Group(); tail2.position.set(0, -0.12, -2.95); tail.add(tail2);
  tail2.add(sweep([{ y: 0, z: 0.15, w: 0.31, h: 0.32, top: 0.08 }, { y: -0.04, z: -1.0, w: 0.2, h: 0.21 }, { y: -0.08, z: -2.0, w: 0.11, h: 0.12 }, { y: -0.1, z: -2.9, w: 0.035, h: 0.04 }], { stripes: 3.2 }));
  // the neck: short, thick, an S rising from the shoulders
  const neck = new T.Group(); neck.position.set(0, 3.62, 2.15); body.add(neck);
  neck.add(sweep([{ y: -0.15, z: -0.45, w: 0.6, h: 0.66 }, { y: 0.1, z: 0.15, w: 0.55, h: 0.6, top: 0.06 }, { y: 0.45, z: 0.6, w: 0.48, h: 0.55, top: 0.06 }, { y: 0.62, z: 0.95, w: 0.44, h: 0.52 }]));
  // the head: a long deep skull, widest at the cheeks, snout narrowing; flat scales on the face; the upper teeth hang below the lip line
  const head = new T.Group(); head.position.set(0, 0.66, 0.92); head.rotation.x = 0.12; head.scale.setScalar(1.18); neck.add(head);
  head.add(sweep([{ y: 0.1, z: -0.42, w: 0.38, h: 0.42 }, { y: 0.06, z: -0.12, w: 0.52, h: 0.56, top: 0.05 }, { y: 0.03, z: 0.3, w: 0.45, h: 0.5, top: 0.06 }, { y: 0.0, z: 0.72, w: 0.34, h: 0.4, top: 0.05 },
    { y: -0.03, z: 1.08, w: 0.28, h: 0.33 }, { y: -0.05, z: 1.38, w: 0.22, h: 0.27 }, { y: -0.07, z: 1.55, w: 0.09, h: 0.13 }]));
  const roof = new T.Mesh(new T.SphereGeometry(1, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mouthM); roof.scale.set(0.28, 0.1, 0.85); roof.position.set(0, -0.24, 0.55); head.add(roof);      // the inside of the mouth, seen when it opens
  const toothG = [], addTooth = (x, y, z, l, down) => { const c = new T.ConeGeometry(0.035 + l * 0.18, l, 5); c.rotateX(down ? Math.PI : 0); c.translate(x, y + (down ? -l / 2 : l / 2), z); toothG.push(c); };
  for (const s of [-1, 1]) for (let i = 0; i < 9; i++) { const z = 1.36 - i * 0.14, w = 0.21 + i * 0.02, l = 0.045 + Math.sin(i / 8 * Math.PI) * 0.05; addTooth(s * w * 0.9, -0.34 + i * 0.003, z, l, true); }
  // brows: the rough bosses over the eyes and the low horns in front of them; the eyes, set to look forward; the nostrils
  for (const s of [-1, 1]) {
    const boss = sweep([{ x: s * 0.36, y: 0.42, z: 0.0, w: 0.08, h: 0.06 }, { x: s * 0.4, y: 0.46, z: 0.18, w: 0.12, h: 0.1 }, { x: s * 0.36, y: 0.42, z: 0.38, w: 0.08, h: 0.06 }]); head.add(boss);
    const horn = new T.Mesh(new T.ConeGeometry(0.07, 0.16, 6), skin); horn.position.set(s * 0.3, 0.5, 0.48); horn.rotation.set(-0.5, 0, s * 0.3); head.add(horn);
    const eye = new T.Group(); eye.position.set(s * 0.42, 0.3, 0.2); eye.rotation.y = s * 0.55; head.add(eye);
    const ball = new T.Mesh(new T.SphereGeometry(0.06, 14, 10), new T.MeshStandardMaterial({ color: 0xa86a14, emissive: 0x140a00, roughness: 0.12, metalness: 0.1 })); eye.add(ball);
    const pupil = new T.Mesh(new T.SphereGeometry(0.03, 8, 6), new T.MeshStandardMaterial({ color: 0x080604, roughness: 0.1 })); pupil.scale.set(0.5, 1.2, 0.5); pupil.position.set(s * 0.05, 0, 0.03); eye.add(pupil);
    const lid = new T.Mesh(new T.SphereGeometry(0.08, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.48), skin); lid.position.set(0, 0.012, 0); lid.rotation.x = -0.25; eye.add(lid);
    const nos = new T.Mesh(new T.SphereGeometry(0.05, 8, 6), new T.MeshStandardMaterial({ color: 0x140e0a, roughness: 0.8 })); nos.scale.set(0.7, 0.45, 1.3); nos.position.set(s * 0.13, 0.13, 1.42); head.add(nos); }
  // the lower jaw: hinged at the back of the skull; teeth along it; a tongue
  const jaw = new T.Group(); jaw.position.set(0, -0.12, -0.25); head.add(jaw);
  jaw.add(sweep([{ y: -0.12, z: -0.12, w: 0.42, h: 0.2 }, { y: -0.2, z: 0.35, w: 0.36, h: 0.21 }, { y: -0.2, z: 0.85, w: 0.28, h: 0.17 }, { y: -0.16, z: 1.3, w: 0.2, h: 0.13 }, { y: -0.13, z: 1.62, w: 0.09, h: 0.07 }]));
  const tongue = new T.Mesh(new T.SphereGeometry(1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshStandardMaterial({ color: 0x9a3a36, roughness: 0.6 })); tongue.scale.set(0.2, 0.06, 0.6); tongue.position.set(0, -0.06, 0.65); jaw.add(tongue);
  const jtG = []; for (const s of [-1, 1]) for (let i = 0; i < 7; i++) { const z = 1.38 - i * 0.15, w = 0.18 + i * 0.02, l = 0.04 + Math.sin(i / 6 * Math.PI) * 0.035, c = new T.ConeGeometry(0.03 + l * 0.18, l, 5); c.translate(s * w * 0.95, -0.02 + l / 2, z); jtG.push(c); }
  const upperTeeth = new T.Mesh(T.mergeGeometries(toothG), bone); head.add(upperTeeth); const lowerTeeth = new T.Mesh(T.mergeGeometries(jtG), bone); jaw.add(lowerTeeth);
  // the little arms: two clawed fingers
  for (const s of [-1, 1]) { const arm = new T.Group(); arm.position.set(s * 0.66, 3.05, 1.8); arm.rotation.set(0.5, 0, s * -0.15); body.add(arm);
    arm.add(sweep([{ y: 0.05, z: -0.05, w: 0.11, h: 0.12 }, { y: -0.3, z: 0.05, w: 0.08, h: 0.09 }, { y: -0.42, z: 0.32, w: 0.06, h: 0.07 }, { y: -0.4, z: 0.55, w: 0.05, h: 0.05 }]));
    for (const f of [-1, 1]) { const c = new T.Mesh(new T.ConeGeometry(0.025, 0.12, 5), claw); c.position.set(f * 0.03, -0.42, 0.62); c.rotation.x = Math.PI / 2 + 0.6; arm.add(c); } }
  // the legs: a great drumstick thigh, a long shin raked back, the long upper foot, three toes forward with claws
  for (const s of [-1, 1]) { const lg = new T.Group(); lg.position.set(s * 0.8, 3.05, -0.25); body.add(lg);
    lg.add(sweep([{ y: 0.45, z: -0.35, w: 0.5, h: 0.7 }, { y: -0.15, z: 0.02, w: 0.62, h: 0.86, top: 0.05 }, { y: -0.8, z: 0.3, w: 0.48, h: 0.58 }, { y: -1.3, z: 0.45, w: 0.29, h: 0.31 }]));
    const knee = new T.Group(); knee.position.set(0, -1.3, 0.45); lg.add(knee);
    knee.add(sweep([{ y: 0.05, z: 0.02, w: 0.29, h: 0.31 }, { y: -0.4, z: -0.2, w: 0.25, h: 0.3 }, { y: -1.02, z: -0.5, w: 0.16, h: 0.18 }]));
    const ankle = new T.Group(); ankle.position.set(0, -1.02, -0.5); knee.add(ankle);
    ankle.add(sweep([{ y: 0.02, z: -0.02, w: 0.15, h: 0.16 }, { y: -0.4, z: 0.14, w: 0.13, h: 0.13 }, { y: -0.62, z: 0.22, w: 0.15, h: 0.11 }]));
    for (const [a, L] of [[-0.42, 0.42], [0, 0.55], [0.42, 0.42]]) { const toe = new T.Group(); toe.position.set(0, -0.64, 0.22); toe.rotation.y = a * s; ankle.add(toe);
      toe.add(sweep([{ y: 0, z: -0.02, w: 0.075, h: 0.075 }, { y: -0.03, z: L * 0.5, w: 0.06, h: 0.06 }, { y: -0.04, z: L, w: 0.045, h: 0.045 }]));
      const c = new T.Mesh(new T.ConeGeometry(0.04, 0.16, 6), claw); c.position.set(0, -0.06, L + 0.06); c.rotation.x = Math.PI / 2 + 0.35; toe.add(c); }
    lg.userData = { knee, ankle }; legs.push(lg); }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  g.userData = { legs, body, head, jaw, tail, tail2, neck, roof, tongue, ph: Math.random() * 6, trex: true }; roof.visible = tongue.visible = false; return g;
}
// pebbly scales: a cell pattern (each scale a little dome) for the colour (light centres, dark grooves) and for the bumps
function trexSkin(T) {
  if (trexSkin.c) return trexSkin.c;
  const N = 256, cells = 22, R0 = W3.rng(77), pts = []; for (let j = 0; j < cells; j++) for (let i = 0; i < cells; i++) pts.push([(i + 0.15 + R0() * 0.7) / cells, (j + 0.15 + R0() * 0.7) / cells, R0()]);
  const hgt = new Float32Array(N * N), tint = new Float32Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const u = x / N, v = y / N, ci = Math.floor(u * cells), cj = Math.floor(v * cells); let d1 = 9, d2 = 9, t1 = 0;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const ii = (ci + di + cells) % cells, jj = (cj + dj + cells) % cells, p = pts[jj * cells + ii], px = p[0] + (ci + di < 0 ? -1 : ci + di >= cells ? 1 : 0), py = p[1] + (cj + dj < 0 ? -1 : cj + dj >= cells ? 1 : 0), d = Math.hypot(px - u, py - v);
      if (d < d1) { d2 = d1; d1 = d; t1 = p[2]; } else if (d < d2) d2 = d; }
    const e = (d2 - d1) * cells; hgt[y * N + x] = Math.min(1, e * 2.2); tint[y * N + x] = t1; }
  const mk = () => { const c = document.createElement('canvas'); c.width = c.height = N; return c; }, cm = mk(), cn = mk(), gm = cm.getContext('2d'), gn = cn.getContext('2d'), im = gm.createImageData(N, N), inn = gn.createImageData(N, N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = y * N + x, h = hgt[i], v = Math.round(150 + 95 * Math.sqrt(h) - 25 * tint[i]); im.data.set([v, v, v * 0.97, 255], i * 4);
    const hx = hgt[y * N + (x + 1) % N] - hgt[y * N + (x + N - 1) % N], hy = hgt[((y + 1) % N) * N + x] - hgt[((y + N - 1) % N) * N + x], nx = -hx * 2.2, ny = -hy * 2.2, l = Math.hypot(nx, ny, 1);
    inn.data.set([Math.round((nx / l * 0.5 + 0.5) * 255), Math.round((ny / l * 0.5 + 0.5) * 255), Math.round((1 / l * 0.5 + 0.5) * 255), 255], i * 4); }
  gm.putImageData(im, 0, 0); gn.putImageData(inn, 0, 0);
  const map = new T.CanvasTexture(cm), normal = new T.CanvasTexture(cn); for (const t of [map, normal]) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(3, 1.4); t.anisotropy = 4; } map.colorSpace = T.SRGBColorSpace;
  return (trexSkin.c = { map, normal });
}
