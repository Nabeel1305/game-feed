// ===================== A FOUR-LEGGED ANIMAL WITH JOINTS (Hunter first, 23 Nov 2026; copied to the games that need it) =====================
// His review of Hunter: "horrible animation with the animal". The animal was a capsule on four sticks that swung from the hip.
// quadMake(T, id, tex) builds a body of rounded masses (chest, barrel, rump), a neck and a head on their own joints, ears that
// flick, a tail, and four legs each with a shoulder or hip, a knee or hock and a hoof. quadPose(R, P, dt) sets it from a few
// numbers: the gait and its phase, where the neck and head should be, how far it has fallen. Local axes: +z is forward, +y up.
const QUAD = {
  deer:    { sz: 1.15, col: 0xa9703f, col2: 0x6f4526, len: 0.82, leg: 0.78, r: 0.045, chest: [0.21, 0.25, 0.3], barrel: [0.2, 0.22, 0.36], rump: [0.21, 0.24, 0.28], neck: [0.5, 0.075, 0.1, 0.95], head: [0.3, 0.085], ear: 0.13, tail: [0.14, 0.03, 0.5], stride: 3.0 },
  horse:   { sz: 1.3,  col: 0xa58a5e, col2: 0x4a3a28, len: 0.95, leg: 0.8, r: 0.055, chest: [0.25, 0.3, 0.32], barrel: [0.25, 0.27, 0.4], rump: [0.26, 0.29, 0.32], neck: [0.5, 0.12, 0.2, 0.62], head: [0.42, 0.105], ear: 0.1, tail: [0.75, 0.05, 0.3], stride: 3.4 },
  boar:    { sz: 1.15, col: 0x6a5240, col2: 0x2e231b, len: 0.8, leg: 0.46, r: 0.055, chest: [0.28, 0.36, 0.34], barrel: [0.24, 0.26, 0.34], rump: [0.22, 0.25, 0.28], neck: [0.12, 0.2, 0.24, 0.0], head: [0.46, 0.17], ear: 0.09, tail: [0.2, 0.015, 0.4], stride: 1.9 },
  bison:   { sz: 1.3,  col: 0x6a4a2e, col2: 0x33231a, len: 0.95, leg: 0.6, r: 0.065, chest: [0.33, 0.42, 0.36], barrel: [0.3, 0.32, 0.42], rump: [0.26, 0.29, 0.3], neck: [0.26, 0.2, 0.26, -0.15], head: [0.4, 0.17], ear: 0.07, tail: [0.45, 0.025, 0.35], stride: 2.6 },
  mammoth: { sz: 2.1,  col: 0x7a5234, col2: 0x3d2a1c, len: 0.95, leg: 0.85, r: 0.11, chest: [0.42, 0.5, 0.42], barrel: [0.42, 0.44, 0.48], rump: [0.36, 0.38, 0.36], neck: [0.2, 0.26, 0.32, 0.5], head: [0.36, 0.3], ear: 0.16, tail: [0.4, 0.03, 0.3], stride: 2.2 },
  lion:    { sz: 1.1,  col: 0xc49a5c, col2: 0x7a5a30, len: 1.0, leg: 0.55, r: 0.05, chest: [0.19, 0.23, 0.3], barrel: [0.18, 0.19, 0.36], rump: [0.18, 0.2, 0.27], neck: [0.2, 0.12, 0.15, 0.3], head: [0.22, 0.13], ear: 0.06, tail: [0.75, 0.025, 0.9], stride: 2.6 },
  bull:    { sz: 1.25, col: 0x4a3326, col2: 0x231812, len: 0.95, leg: 0.62, r: 0.065, chest: [0.32, 0.38, 0.36], barrel: [0.3, 0.32, 0.44], rump: [0.29, 0.31, 0.32], neck: [0.24, 0.19, 0.25, 0.05], head: [0.4, 0.16], ear: 0.09, tail: [0.6, 0.02, 0.3], stride: 2.6 },
  sheep:   { sz: 0.7,  col: 0xe8e2d2, col2: 0x2b2622, len: 0.7, leg: 0.5, r: 0.04, chest: [0.26, 0.28, 0.3], barrel: [0.27, 0.28, 0.36], rump: [0.26, 0.27, 0.28], neck: [0.2, 0.09, 0.12, 0.6], head: [0.26, 0.09], ear: 0.09, tail: [0.12, 0.04, 0.5], stride: 1.6 },
  wolf:    { sz: 0.8,  col: 0x8a8a8a, col2: 0x4a4a4e, len: 0.8, leg: 0.62, r: 0.04, chest: [0.17, 0.21, 0.28], barrel: [0.15, 0.17, 0.34], rump: [0.16, 0.19, 0.24], neck: [0.26, 0.09, 0.12, 0.5], head: [0.3, 0.1], ear: 0.1, tail: [0.5, 0.05, 0.9], stride: 2.4 },
};
function quadMake(T, id, tex, o = {}) {
  const S = Object.assign({}, QUAD[id] || QUAD.deer, o), g = new T.Group(), body = new T.Group(); g.add(body); body.position.y = S.leg;
  const mat = (c, r = 0.92) => { const m = new T.MeshStandardMaterial({ color: c, roughness: r, map: tex || null }); m.emissive = new T.Color(c); m.emissiveIntensity = 0.12; return m; };      // never a black shape in rain or dusk
  const M = { fur: mat(S.col), dark: mat(S.col2), pale: mat(0xefe6d0, 0.6), hoof: mat(0x1b1612, 0.6), eye: new T.MeshStandardMaterial({ color: 0x0c0a08, roughness: 0.2 }) };
  const sph = new T.SphereGeometry(1, 18, 14);
  const ell = (rx, ry, rz, x, y, z, m, par = body) => { const q = new T.Mesh(sph, m); q.scale.set(rx, ry, rz); q.position.set(x, y, z); q.castShadow = true; par.add(q); return q; };
  const cyl = (rt, rb, len, m, par, seg = 10) => { const ge = new T.CylinderGeometry(rt, rb, len, seg); ge.translate(0, -len / 2, 0); const q = new T.Mesh(ge, m); q.castShadow = true; par.add(q); return q; };      // hangs down from its joint
  const hz = S.len / 2, cy = S.chest[1] * 0.75;
  // the body: three masses that overlap
  ell(S.chest[0], S.chest[1], S.chest[2], 0, cy, hz * 0.72, M.fur); ell(Math.max(S.chest[0], S.rump[0]) * 0.97, (S.chest[1] + S.rump[1]) * 0.475, S.len * 0.6, 0, cy - 0.01, 0, M.fur); ell(S.rump[0], S.rump[1], S.rump[2], 0, cy + 0.01, -hz * 0.72, M.fur);
  // legs: [front left, front right, hind left, hind right]
  const legs = [];
  for (let i = 0; i < 4; i++) { const front = i < 2, sx = i % 2 ? 1 : -1, wd = (front ? S.chest[0] : S.rump[0]) * 0.62, U = front ? S.leg * 0.5 : S.leg / 1.86, Lw = front ? S.leg * 0.5 : S.leg / 1.86;
    const hip = new T.Group(); hip.position.set(sx * wd, 0.02, front ? hz - 0.02 : -hz + 0.02); body.add(hip);
    ell(S.r * 1.75, U * 0.5, S.r * (front ? 2.0 : 2.8), 0, -U * 0.12, front ? 0 : -0.02, M.fur, hip); cyl(S.r * 1.5, S.r * 1.05, U, M.fur, hip);
    const knee = new T.Group(); knee.position.y = -U; hip.add(knee); ell(S.r * 1.15, S.r * 1.15, S.r * 1.15, 0, 0, 0, front ? M.fur : M.fur, knee); cyl(S.r * 0.95, S.r * 0.7, Lw - 0.05, id === 'sheep' ? M.dark : M.dark, knee);
    const hoof = cyl(S.r * 1.05, S.r * 1.25, 0.07, M.hoof, knee, 8); hoof.position.y = -(Lw - 0.06);
    legs.push({ hip, knee, front, U, Lw }); }
  // neck and head: the neck swings up and down from the chest; the head levels itself, then nods and turns
  const nk = S.neck, neck = new T.Group(); neck.position.set(0, cy + S.chest[1] * 0.45, hz + S.chest[2] * 0.45); body.add(neck); cyl(nk[2], nk[1], nk[0] + 0.06, M.fur, neck).position.y = 0.05;
  const lvl = new T.Group(); lvl.position.y = -nk[0]; neck.add(lvl); const head = new T.Group(); lvl.add(head);
  const hd = S.head, skull = ell(hd[1], hd[1] * 1.05, hd[1] * 1.25, 0, 0.01, 0.02, M.fur, head), muz = new T.Group(); head.add(muz); muz.position.set(0, -hd[1] * 0.15, hd[1] * 0.7);
  { const ge = new T.CylinderGeometry(hd[1] * 0.5, hd[1] * 0.82, hd[0] * 0.75, 10); ge.rotateX(Math.PI / 2); ge.translate(0, 0, hd[0] * 0.3); const q = new T.Mesh(ge, M.fur); q.castShadow = true; muz.add(q); ell(hd[1] * 0.52, hd[1] * 0.45, hd[1] * 0.35, 0, 0, hd[0] * 0.68, id === 'deer' || id === 'horse' || id === 'sheep' ? M.dark : M.fur, muz); ell(hd[1] * 0.3, hd[1] * 0.2, hd[1] * 0.14, 0, hd[1] * 0.1, hd[0] * 0.76, M.hoof, muz); }
  for (const sx of [-1, 1]) { const e = new T.Mesh(sph, M.eye); e.scale.setScalar(hd[1] * 0.17); e.position.set(sx * hd[1] * 0.82, hd[1] * 0.3, hd[1] * 0.6); head.add(e); }
  const ears = []; for (const sx of [-1, 1]) { const eg = new T.Group(); eg.position.set(sx * hd[1] * 0.75, hd[1] * 0.75, -hd[1] * 0.25); head.add(eg); const ge = new T.ConeGeometry(S.ear * 0.38, S.ear, 8); ge.translate(0, S.ear / 2, 0); ge.scale(1, 1, 0.45); const q = new T.Mesh(ge, M.fur); q.castShadow = true; eg.add(q); eg.rotation.z = -sx * 0.75; eg.userData.sx = sx; ears.push(eg); }
  // tail
  const tl = S.tail, tail = new T.Group(); tail.position.set(0, cy + S.rump[1] * 0.55, -hz - S.rump[2] * 0.72); body.add(tail); cyl(tl[1] * 1.2, tl[1] * 0.6, tl[0], id === 'horse' ? M.dark : M.fur, tail);
  // what makes each kind itself
  if (id === 'deer') { ell(0.1, 0.1, 0.05, 0, cy + 0.02, -hz - 0.22, M.pale); ell(0.14, 0.1, 0.25, 0, cy - 0.15, 0.05, M.pale).material = M.pale;
    for (const sx of [-1, 1]) { const b = new T.Group(); b.position.set(sx * 0.04, hd[1] * 0.85, -0.02); b.rotation.set(-0.35, 0, -sx * 0.45); head.add(b); const up = (len, r, par, rx, rz, y) => { const q = new T.Group(); q.position.y = y; q.rotation.set(rx, 0, rz); par.add(q); const ge = new T.CylinderGeometry(r * 0.6, r, len, 6); ge.translate(0, len / 2, 0); const mm = new T.Mesh(ge, M.pale); mm.castShadow = true; q.add(mm); return q; };
      const b1 = up(0.3, 0.018, b, 0, 0, 0), b2 = up(0.26, 0.014, b1, 0.5, -sx * 0.25, 0.3); up(0.2, 0.011, b2, 0.5, sx * 0.2, 0.26); up(0.16, 0.011, b1, 1.1, sx * 0.3, 0.08); up(0.17, 0.011, b1, 0.9, -sx * 0.2, 0.24); up(0.13, 0.009, b2, -0.6, 0, 0.14); } }
  if (id === 'horse') { for (let i = 0; i < 6; i++) ell(0.035, 0.075, 0.1, 0, -0.03 - i * nk[0] / 6, -nk[1] - 0.02 - i * 0.008, M.dark, neck); ell(0.05, 0.05, 0.09, 0, hd[1] * 0.85, 0.05, M.dark, head); }
  if (id === 'boar') { for (let i = 0; i < 7; i++) ell(0.03, 0.075 - i * 0.004, 0.09, 0, cy + S.chest[1] * 0.92 - i * 0.012, hz + 0.08 - i * 0.13, M.dark);
    for (const sx of [-1, 1]) { const q = new T.Mesh(new T.ConeGeometry(0.02, 0.12, 6), M.pale); q.position.set(sx * hd[1] * 0.42, -hd[1] * 0.1, hd[0] * 0.5); q.rotation.set(-0.3, 0, -sx * 0.5); muz.add(q); } ell(0.03, 0.03, 0.03, 0, -tl[0], 0, M.dark, tail); }
  if (id === 'bison' || id === 'bull') { ell(S.chest[0] * 0.92, S.chest[1] * 0.75, S.chest[2] * 0.95, 0, cy + S.chest[1] * 0.55, hz - 0.12, id === 'bison' ? M.dark : M.fur);
    if (id === 'bison') { ell(S.chest[0] * 1.04, S.chest[1] * 0.9, S.chest[2] * 0.9, 0, cy - 0.06, hz + 0.02, M.dark); ell(hd[1] * 0.6, hd[1] * 0.9, hd[1] * 0.5, 0, -hd[1] * 0.95, hd[1] * 0.3, M.dark, head); ell(hd[1] * 1.05, hd[1] * 0.75, hd[1] * 0.9, 0, hd[1] * 0.45, -0.02, M.dark, head); }
    for (const sx of [-1, 1]) { const q = new T.Mesh(new T.TorusGeometry(hd[1] * 0.75, 0.022, 6, 12, 1.5), M.pale); q.position.set(sx * hd[1] * 0.75, hd[1] * 0.55, 0); q.rotation.set(0, sx > 0 ? 0 : Math.PI, sx > 0 ? -0.2 : 0.2); q.castShadow = true; head.add(q); } ell(0.04, 0.07, 0.04, 0, -tl[0], 0, M.dark, tail); }
  let trunk = null;
  if (id === 'mammoth') { ell(S.chest[0] * 0.9, S.chest[1] * 0.7, S.chest[2] * 0.9, 0, cy + S.chest[1] * 0.6, hz - 0.1, M.fur); ell(hd[1] * 1.05, hd[1] * 1.15, hd[1] * 1.0, 0, hd[1] * 0.55, -0.02, M.fur, head); ell(S.barrel[0] * 1.04, S.barrel[1] * 0.75, S.barrel[2] * 1.5, 0, cy - S.barrel[1] * 0.45, 0, M.dark);
    trunk = []; let par = muz, r = hd[1] * 0.42; for (let i = 0; i < 6; i++) { const q = new T.Group(); q.position.set(0, i ? -0.2 : -0.02, i ? 0 : hd[0] * 0.55); par.add(q); cyl(r, r * 0.86, 0.22, M.fur, q); r *= 0.86; trunk.push(q); par = q; }
    for (const sx of [-1, 1]) { const q = new T.Mesh(new T.TorusGeometry(0.42, 0.04, 8, 18, 2.3), M.pale); q.position.set(sx * hd[1] * 0.55, -0.42, hd[0] * 0.75); q.rotation.set(0.25, sx > 0 ? -1.25 : -1.9, Math.PI + 0.35); q.castShadow = true; head.add(q); } }
  if (id === 'lion') { ell(hd[1] * 1.35, hd[1] * 1.45, hd[1] * 0.9, 0, -0.02, -hd[1] * 0.7, M.dark, head); ell(0.19, 0.2, 0.21, 0, -0.06, 0.0, M.dark, neck); ell(0.045, 0.07, 0.045, 0, -tl[0], 0, M.dark, tail); }
  if (id === 'sheep') { ell(S.barrel[0] * 1.12, S.barrel[1] * 1.1, S.len * 0.72, 0, cy + 0.02, 0, M.fur); skull.material = M.dark; }
  g.scale.setScalar(S.sz);
  return { g, body, legs, neck, lvl, head, ears, tail, trunk, S, M, cur: { neck: nk[3], nod: 0, yaw: 0, roll: 0, drop: 0, fold: 0, pitch: 0 }, ph: 0 };
}
// P: { gait 0 stand, 1 walk, 2 gallop; ph (radians); amt 0..1; neck (angle above the horizontal, radians; null = at rest); nod (nose down +);
//      yaw (head turned, + to its left); ear (0..1 flicking); tail (0 hanging .. 1 up); pitch (body nose-up +); fall (0..1 lying on its side); t (seconds, for the small motions) }
function quadPose(R, P, dt = 1 / 60) {
  const S = R.S, c = R.cur, k = Math.min(1, dt * 9), t = P.t || 0, ga = P.gait | 0, amt = P.amt == null ? 1 : P.amt, fall = P.fall || 0;
  c.neck += ((P.neck == null ? S.neck[3] : P.neck) - c.neck) * k; c.nod += ((P.nod || 0) - c.nod) * k; c.yaw += ((P.yaw || 0) - c.yaw) * Math.min(1, dt * 7); c.pitch += ((P.pitch || 0) - c.pitch) * k;
  // legs
  const OFF = ga === 2 ? [0.55, 0.67, 0.0, 0.1] : [0.25, 0.75, 0.0, 0.5], A = (ga === 2 ? 0.85 : ga === 1 ? 0.36 : 0) * amt, F = (ga === 2 ? 1.25 : ga === 1 ? 0.55 : 0) * amt;
  R.legs.forEach((L, i) => { const ph = P.ph + OFF[i] * Math.PI * 2; let s = A * Math.sin(ph), f = F * Math.max(0, Math.cos(ph)); if (P.lame === i) { s *= 0.3; f = 0.9; }
    if (fall) { s = s * (1 - fall) + (L.front ? 0.35 : -0.25) * fall; f = f * (1 - fall) + 1.25 * fall; }
    if (P.paw && i === 0) { const q = Math.max(0, Math.sin(t * 9)); s = 0.5 * q; f = 1.1 * q; }
    if (L.front) { L.hip.rotation.x = -s + f * 0.25; L.knee.rotation.x = f * 1.35; } else { L.hip.rotation.x = -0.38 - s; L.knee.rotation.x = Math.max(0.1, 0.75 + 0.4 * s + f * 0.9); }
    L.hip.rotation.z = fall ? (i % 2 ? -1 : 1) * 0.12 * fall : 0; });
  // body: bounce and rock with the gait; lie down on its side when it falls
  const bounce = ga === 2 ? Math.abs(Math.sin(P.ph)) * 0.09 * amt : ga === 1 ? Math.abs(Math.sin(P.ph * 2)) * 0.012 * amt : 0, rock = ga === 2 ? Math.sin(P.ph + 0.6) * 0.1 * amt : 0;
  const side = P.side || 1, lie = Math.min(1, fall * 1.15), fy = S.barrel[0] * 0.9;
  R.body.position.y = S.leg * (1 - lie) + fy * lie + bounce - (P.crouch || 0) * S.leg * 0.25 + (fall > 0 && fall < 1 ? Math.sin(fall * Math.PI) * 0.06 : 0);
  R.body.rotation.set(-(c.pitch + rock) * (1 - lie), 0, side * lie * 1.5); R.body.position.x = side * lie * -S.leg * 0.35;
  // neck: an angle above the horizontal; the head levels itself, then turns and nods
  const al = c.neck + (ga === 2 ? Math.sin(P.ph + 2.2) * 0.07 * amt : 0) + (P.chew ? Math.sin(t * 7) * 0.035 : 0);
  R.neck.rotation.x = -(Math.PI / 2 + al); R.lvl.rotation.set(Math.PI / 2 + al, c.yaw, 0); R.head.rotation.set(c.nod + (P.chew ? Math.sin(t * 11) * 0.04 : 0), 0, fall ? side * -0.5 * lie : 0);
  // ears and tail
  const ef = P.ear || 0; R.ears.forEach(e => { const sx = e.userData.sx; e.rotation.z = -sx * (0.75 - 0.35 * ef) + Math.sin(t * 27 + sx) * 0.3 * ef; e.rotation.x = -0.25 + (P.back ? -0.7 : 0) + Math.sin(t * 19 + sx * 2) * 0.25 * ef + (Math.sin(t * 0.9 + sx * 2.1) > 0.96 ? 0.5 : 0); });
  const tu = P.tail || 0; R.tail.rotation.x = S.tail[2] - tu * 1.9 + (ga === 2 ? Math.sin(P.ph * 2) * 0.12 : 0); R.tail.rotation.z = Math.sin(t * (2 + tu * 8)) * (0.25 + 0.2 * tu) * (fall ? 0 : 1);
  if (R.trunk) R.trunk.forEach((q, i) => { q.rotation.x = (i === 0 ? -0.35 : 0.06 + (P.trunkUp || 0) * -0.42) + Math.sin(t * 1.3 + i * 0.7) * 0.05; q.rotation.z = Math.sin(t * 0.9 + i * 0.9) * 0.07; });
}
