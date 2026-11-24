// ===================== THE VIEW: Country Vet in 3D (three.js through tools/world3d.js) =====================
// Inside an old wooden barn: plank walls, straw on the floor, a lamp on a beam, the big door open onto the farmyard (fields,
// a fence, trees, the level's weather and light). The animal stands side-on in the middle, seen from a little in front; when a
// tool goes on a part of her the camera moves in close. Every animal is built from smooth shapes with its own coat; what is
// wrong with her is on her (a thorn, a long hoof, a cut, mud, a red ear) and how she feels shows (ears, tail, breathing,
// shifting about, a shiver).
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
// ---------- the animals ----------
const BODY = {
  dog: { L: 0.72, leg: 0.34, ry: 0.15, rz: 0.12, neck: [0.2, 0.62, 0.07], head: 0.105, muzzle: [0.1, 0.05, 0.05], ears: 'flop', tail: [0.32, 0.03, -0.7], coat: 0xb07a43, belly: 0xd9b58a, legC: null, foot: 'paw' },
  cow: { L: 1.55, leg: 0.72, ry: 0.36, rz: 0.3, neck: [0.42, 0.25, 0.16], head: 0.2, muzzle: [0.16, 0.12, 0.12], ears: 'side', tail: [0.75, 0.035, 1.35], coat: 0xf2efe8, belly: 0xf2efe8, patches: 0x1a1816, foot: 'hoof', nose: 0xe6a2a0 },
  sheep: { L: 0.95, leg: 0.4, ry: 0.3, rz: 0.27, neck: [0.18, 0.5, 0.09], head: 0.11, muzzle: [0.08, 0.07, 0.06], ears: 'side', tail: [0.14, 0.05, 1.2], coat: 0xe9e1cf, belly: 0xe9e1cf, wool: true, face: 0x2a2522, legC: 0x2a2522, foot: 'hoof' },
  horse: { L: 1.55, leg: 0.95, ry: 0.32, rz: 0.25, neck: [0.62, 0.95, 0.15], head: 0.24, muzzle: [0.2, 0.1, 0.09], ears: 'up', tail: [0.75, 0.06, 0.55], coat: 0x7b3f1d, belly: 0x7b3f1d, mane: 0x2a1a10, foot: 'hoof', blaze: true },
  pig: { L: 1.05, leg: 0.28, ry: 0.3, rz: 0.27, neck: [0.1, 0.1, 0.2], head: 0.17, muzzle: [0.1, 0.08, 0.08], ears: 'flop', tail: [0.12, 0.02, -0.4], coat: 0xeaa99a, belly: 0xf0b7a8, foot: 'hoof', snout: true },
  goat: { L: 0.9, leg: 0.5, ry: 0.21, rz: 0.17, neck: [0.32, 0.9, 0.08], head: 0.12, muzzle: [0.1, 0.06, 0.055], ears: 'side', tail: [0.14, 0.03, -1.0], coat: 0xe8e0d2, belly: 0xe8e0d2, patches: 0x6b4428, foot: 'hoof', horns: true, beard: true },
};
function coatTex(base, spot, seed) {
  const T = THREE, cvs = document.createElement('canvas'); cvs.width = 256; cvs.height = 128; const g = cvs.getContext('2d'), R = W3.rng(seed), c = new T.Color(base);
  g.fillStyle = '#' + c.getHexString(); g.fillRect(0, 0, 256, 128);
  for (let i = 0; i < 2600; i++) { const v = (R() - 0.5) * 0.12, cc = c.clone().offsetHSL(0, 0, v); g.fillStyle = '#' + cc.getHexString(); g.globalAlpha = 0.5; g.fillRect(R() * 256, R() * 128, 1 + R() * 2, 4 + R() * 6); }
  g.globalAlpha = 1;
  if (spot != null) { const s = new T.Color(spot); g.fillStyle = '#' + s.getHexString(); for (let b = 0; b < 7; b++) { const cx = R() * 256, cy = 20 + R() * 88, r = 10 + R() * 22; g.beginPath(); for (let a = 0; a <= 24; a++) { const t = a / 24 * TAU, rr = r * (0.7 + 0.5 * Math.sin(t * 3 + b) * 0.5 + R() * 0.2); g.lineTo(cx + Math.cos(t) * rr * 1.3, cy + Math.sin(t) * rr); } g.fill(); } }
  const tx = new T.CanvasTexture(cvs); tx.colorSpace = T.SRGBColorSpace; tx.wrapS = tx.wrapT = T.RepeatWrapping; return tx;
}
function buildAnimal(kind) {
  const T = THREE, B = BODY[kind], g = new T.Group(), R = W3.rng(kind.length * 31);
  const fur = new T.MeshStandardMaterial({ color: 0xffffff, map: coatTex(B.coat, B.patches, kind.length * 7), roughness: 0.85 });
  const plain = c => new T.MeshStandardMaterial({ color: c, roughness: 0.8 });
  const legM = B.legC ? plain(B.legC) : fur, faceM = B.face ? plain(B.face) : fur, dark = new T.MeshStandardMaterial({ color: 0x141110, roughness: 0.35 });
  const blob = (rx, ry, rz, m, x, y, z, par = g) => { const s = new T.Mesh(new T.SphereGeometry(1, 28, 18), m); s.scale.set(rx, ry, rz); s.position.set(x, y, z); s.castShadow = true; s.receiveShadow = true; par.add(s); return s; };
  const limb = (a, b, r1, r2, m, par = g) => { const d = new T.Vector3().subVectors(b, a), l = d.length(); const c = new T.Mesh(new T.CylinderGeometry(r2, r1, l, 16, 1), m); c.position.copy(a).addScaledVector(d, 0.5); c.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.clone().normalize()); c.castShadow = true; par.add(c); return c; };
  const V = (x, y, z) => new T.Vector3(x, y, z);
  const by = B.leg + B.ry * 0.8, L = B.L;
  const body = new T.Group(); g.add(body);
  if (B.wool) { const woolM = new T.MeshStandardMaterial({ color: B.coat, roughness: 1, map: W3.grainTex(64, 9, 225, 25, 2) }); blob(L * 0.52, B.ry, B.rz, woolM, 0, by, 0, body); for (let i = 0; i < 70; i++) { const u = R() * TAU, v = R() * Math.PI * 0.85 + 0.1; blob(0.07 + R() * 0.03, 0.07, 0.07, woolM, Math.cos(u) * Math.sin(v) * L * 0.5, by + Math.cos(v) * B.ry * 0.95, Math.sin(u) * Math.sin(v) * B.rz * 0.97, body); } }
  else { blob(L * 0.5, B.ry, B.rz, fur, 0, by, 0, body); blob(L * 0.26, B.ry * 1.02, B.rz * 0.98, fur, L * 0.28, by + B.ry * 0.05, 0, body); blob(L * 0.25, B.ry * 0.98, B.rz * 0.96, fur, -L * 0.3, by + B.ry * 0.04, 0, body); }
  // legs: [front near, front far, hind near, hind far]; each a group pivoting at the top so it can lift
  const legs = [];
  for (const [lx, lz, hind] of [[L * 0.34, B.rz * 0.55, 0], [L * 0.34, -B.rz * 0.55, 0], [-L * 0.36, B.rz * 0.55, 1], [-L * 0.36, -B.rz * 0.55, 1]]) {
    const lg = new T.Group(); lg.position.set(lx, by - B.ry * 0.35, lz); g.add(lg); const top = by - B.ry * 0.35, r = B.rz * (kind === 'horse' ? 0.24 : kind === 'cow' ? 0.27 : 0.3), knee = V(hind ? -0.04 * L : 0.01, -(top - B.leg * 0.45), 0);
    if (hind) blob(r * 1.5, B.ry * 0.5, r * 1.3, fur, 0.02, -B.ry * 0.15, 0, lg); else blob(r * 1.3, B.ry * 0.45, r * 1.2, fur, 0, -B.ry * 0.1, 0, lg);
    limb(V(0, 0, 0), knee, r * 1.1, r * 0.75, B.legC && kind === 'sheep' ? legM : fur, lg); limb(knee, V(hind ? 0.01 : 0, -top + B.leg * 0.08, 0), r * 0.62, r * 0.55, legM, lg);
    let foot;
    if (B.foot === 'paw') foot = blob(r * 1.05, r * 0.6, r * 0.95, legM, r * 0.35, -top + r * 0.5, 0, lg);
    else { foot = new T.Mesh(new T.CylinderGeometry(r * 0.62, r * 0.78, B.leg * 0.08, 14), dark); foot.position.set(0, -top + B.leg * 0.04, 0); foot.castShadow = true; lg.add(foot); }
    lg.userData = { top, r, hind, foot }; legs.push(lg);
  }
  // neck and head
  const [nl, rise, nr] = B.neck, n0 = V(L * 0.42, by + B.ry * 0.25, 0), n1 = V(L * 0.42 + nl * Math.cos(Math.atan(rise)), by + B.ry * 0.25 + nl * Math.sin(Math.atan(rise)) + B.ry * 0.2, 0);
  const neck = limb(n0, n1, nr * 1.25, nr * 0.9, B.wool ? faceM : fur); if (B.wool) neck.material = new T.MeshStandardMaterial({ color: B.coat, roughness: 1 });
  const head = new T.Group(); head.position.copy(n1); g.add(head); const hs = B.head;
  const skull = blob(hs * 1.0, hs * 0.85, hs * 0.8, faceM, hs * 0.2, 0, 0, head);
  const mz = blob(B.muzzle[0], B.muzzle[1], B.muzzle[2], kind === 'cow' ? plain(B.nose) : faceM, hs * 0.85 + B.muzzle[0] * 0.5, -hs * 0.35, 0, head);
  if (kind === 'horse') { mz.position.set(hs * 1.1, -hs * 0.55, 0); mz.scale.set(B.muzzle[0] * 1.6, B.muzzle[1] * 1.3, B.muzzle[2]); skull.scale.set(hs * 1.05, hs * 0.75, hs * 0.62); head.rotation.z = -0.9; }
  if (B.snout) { const sn = new T.Mesh(new T.CylinderGeometry(hs * 0.42, hs * 0.48, hs * 0.25, 20), plain(0xdc8e80)); sn.rotation.z = Math.PI / 2; sn.position.set(hs * 1.08, -hs * 0.2, 0); head.add(sn); for (const s of [-1, 1]) blob(0.012, 0.022, 0.014, dark, hs * 1.21, -hs * 0.2, s * hs * 0.16, head); }
  else blob(B.muzzle[1] * 0.45, B.muzzle[1] * 0.35, B.muzzle[2] * 0.75, dark, mz.position.x + mz.scale.x * 0.85, mz.position.y + mz.scale.y * 0.3, 0, head);
  if (B.blaze) { const bl = new T.Mesh(new T.PlaneGeometry(hs * 1.6, hs * 0.18), plain(0xf3efe6)); bl.position.set(hs * 0.7, hs * 0.02, hs * 0.5); bl.rotation.set(-0.1, 0.25, -0.35); head.add(bl); }
  const eyes = []; for (const s of [-1, 1]) { const e = blob(hs * 0.13, hs * 0.13, hs * 0.1, new T.MeshStandardMaterial({ color: 0x0c0806, roughness: 0.05, metalness: 0.2 }), hs * 0.55, hs * 0.22, s * hs * 0.68, head); const hl = blob(hs * 0.035, hs * 0.035, hs * 0.02, new T.MeshBasicMaterial({ color: 0xffffff }), hs * 0.6, hs * 0.27, s * hs * 0.77, head); eyes.push(e, hl); }
  const ears = []; for (const s of [-1, 1]) { const ep = new T.Group(); ep.position.set(-hs * 0.05, hs * 0.55, s * hs * 0.55); head.add(ep);
    const em = new T.Mesh(new T.SphereGeometry(1, 16, 10), B.ears === 'flop' ? fur : faceM); const el = B.ears === 'up' ? hs * 0.42 : B.ears === 'flop' ? hs * 0.6 : hs * 0.45; em.scale.set(hs * 0.18, el * 0.5, hs * 0.08); em.position.y = el * 0.4; em.castShadow = true; ep.add(em);
    const inner = new T.Mesh(new T.SphereGeometry(1, 12, 8), plain(0xd88f86)); inner.scale.set(hs * 0.11, el * 0.38, hs * 0.04); inner.position.set(0, el * 0.4, s * hs * 0.03); ep.add(inner);
    ep.rotation.x = s * (B.ears === 'up' ? 0.25 : B.ears === 'flop' ? 2.2 : 1.35); ep.userData = { s, base: ep.rotation.x, inner }; ears.push(ep); }
  if (B.horns) for (const s of [-1, 1]) { const h = new T.Mesh(new T.TorusGeometry(hs * 0.45, hs * 0.07, 8, 16, 2.2), plain(0x8a7a62)); h.position.set(-hs * 0.25, hs * 0.55, s * hs * 0.3); h.rotation.set(0, s * 0.2, 0.6); head.add(h); }
  if (B.beard) { const bd = new T.Mesh(new T.ConeGeometry(hs * 0.15, hs * 0.5, 10), plain(0xd8d0c0)); bd.position.set(hs * 0.85, -hs * 0.8, 0); bd.rotation.z = 3.0; head.add(bd); }
  if (B.mane) { const mm = plain(B.mane); for (let i = 0; i < 9; i++) { const t = i / 8, p = n0.clone().lerp(n1, t); const m = new T.Mesh(new T.BoxGeometry(0.06, 0.12, 0.05), mm); m.position.set(p.x - 0.07, p.y + nr * 0.95, 0); m.rotation.z = Math.atan(rise) * 0.6; g.add(m); } }
  // tail
  const tail = new T.Group(); tail.position.set(-L * 0.52, by + B.ry * 0.55, 0); g.add(tail); const [tl, tr, tang] = B.tail;
  if (B.snout) { const c = new T.Mesh(new T.TorusGeometry(0.035, 0.009, 6, 14, 5), plain(B.coat)); c.position.set(-0.04, 0, 0); tail.add(c); }
  else { const tm = B.mane ? plain(B.mane) : fur; const a = V(0, 0, 0), b = V(-Math.sin(tang) * tl * 0.5, -Math.cos(tang) * tl, 0); limb(a, b, tr, tr * 0.6, tm, tail); if (B.mane) blob(0.06, tl * 0.4, 0.05, tm, b.x, b.y + tl * 0.1, 0, tail); if (kind === 'cow') blob(0.045, 0.1, 0.045, plain(0x1a1816), b.x, b.y - 0.05, 0, tail); }
  tail.rotation.z = 0;
  // where the problems are, as points on her (the near side)
  const spotAt = { front: [legs[0], V(0, 0, 0)], hind: [legs[2], V(0, 0, 0)], neck: [g, n0.clone().lerp(n1, 0.45).add(V(0, 0, nr))], flank: [g, V(-L * 0.12, by - B.ry * 0.05, B.rz * 0.98)], back: [g, V(L * 0.05, by + B.ry * 0.86, B.rz * 0.42)], ear: [head, V(-hs * 0.05, hs * 0.75, hs * 0.6)] };
  const anchors = {}; for (const s of SPOTS) { const [par, p] = spotAt[s], o = new T.Object3D(); if (par === legs[0] || par === legs[2]) p.set(0.0, -par.userData.top + B.leg * 0.2, par.userData.r * 1.1); o.position.copy(p); par.add(o); anchors[s] = o; }
  // the problems, as things on her (shown or hidden for each patient)
  const thornM = new T.MeshStandardMaterial({ color: 0xc8a870, roughness: 0.5, emissive: 0x201408 }), cutM = new T.MeshStandardMaterial({ color: 0x9a1a14, roughness: 0.3, emissive: 0x300000 }), mudM = new T.MeshStandardMaterial({ color: 0x4a3420, roughness: 1, map: W3.grainTex(64, 4, 120, 60, 3) }), bandM = new T.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.9, map: W3.grainTex(64, 6, 235, 20, 8) });
  const marks = {};
  for (const li of [0, 2]) { const lg = legs[li], u = lg.userData, sp = li ? 'hind' : 'front', y = -u.top + B.leg * 0.2;
    const th = new T.Mesh(new T.ConeGeometry(u.r * 0.2, u.r * 2.6, 6), thornM); th.rotation.x = Math.PI / 2; th.position.set(0, y, u.r * 1.1); lg.add(th);
    const cut = new T.Mesh(new T.BoxGeometry(u.r * 0.35, B.leg * 0.2, 0.006), cutM); cut.position.set(0, y + B.leg * 0.05, u.r * 0.66); cut.rotation.z = 0.5; lg.add(cut);
    const band = new T.Mesh(new T.CylinderGeometry(u.r * 0.78, u.r * 0.78, B.leg * 0.2, 16, 1, true), bandM); band.position.set(0, y + B.leg * 0.04, 0); lg.add(band);
    const hoof = new T.Mesh(new T.BoxGeometry(1, 1, 1), new T.MeshStandardMaterial({ color: 0x7a6248, roughness: 0.45 })); lg.add(hoof);
    marks[sp] = { thorn: th, cut, band, hoof, y, r: u.r, foot: u.foot, leg: lg }; }
  const mud = {}; for (const sp of ['flank', 'back']) { const grp = new T.Group(), a = anchors[sp]; a.add(grp); for (let i = 0; i < 9; i++) { const m = new T.Mesh(new T.SphereGeometry(1, 10, 8), mudM); m.scale.set(0.04 + R() * 0.05, 0.03 + R() * 0.04, 0.012); m.position.set((R() - 0.5) * L * 0.3, (R() - 0.5) * B.ry * 0.5, 0); grp.add(m); } mud[sp] = grp; }
  const syr = new T.Group(); { const barrel = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 0.11, 12), new T.MeshStandardMaterial({ color: 0xe8f0f4, roughness: 0.1, transparent: true, opacity: 0.7 })); barrel.rotation.x = Math.PI / 2; barrel.position.z = 0.07; const nd = new T.Mesh(new T.CylinderGeometry(0.0015, 0.0015, 0.03, 6), new T.MeshStandardMaterial({ color: 0xcccccc, metalness: 1 })); nd.rotation.x = Math.PI / 2; nd.position.z = 0.005; syr.add(barrel, nd); } anchors.neck.add(syr);
  g.userData = { kind, B, legs, head, ears, tail, body, anchors, marks, mud, syr, eyes, by };
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}
// ---------- the barn ----------
function buildWorld() {
  if (V3) return V3; const T = THREE; if (!W3 || !W3.init({ canvas: $('gl'), fov: 50, far: 3000, near: 0.05 })) { V3 = { none: true }; return V3; }
  const S = W3.scene, R0 = W3.rng(17);
  const plank = (seed, base) => { const cvs = document.createElement('canvas'); cvs.width = 256; cvs.height = 256; const g = cvs.getContext('2d'), R = W3.rng(seed), c = new T.Color(base);
    for (let i = 0; i < 8; i++) { const cc = c.clone().offsetHSL(0, (R() - 0.5) * 0.05, (R() - 0.5) * 0.08); g.fillStyle = '#' + cc.getHexString(); g.fillRect(i * 32, 0, 32, 256); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(i * 32, 0, 2, 256);
      for (let j = 0; j < 40; j++) { g.fillStyle = `rgba(${R() < 0.5 ? '0,0,0' : '255,240,220'},${0.04 + R() * 0.06})`; g.fillRect(i * 32 + R() * 30, R() * 256, 1, 20 + R() * 80); } }
    const tx = new T.CanvasTexture(cvs); tx.colorSpace = T.SRGBColorSpace; tx.wrapS = tx.wrapT = T.RepeatWrapping; return tx; };
  const wallT = plank(3, 0x7a5236), wallM = new T.MeshStandardMaterial({ map: wallT, roughness: 0.9 }); wallT.repeat.set(4, 1);
  const beamM = new T.MeshStandardMaterial({ color: 0x4a3020, roughness: 0.85, map: W3.grainTex(128, 21, 150, 40, 5) });
  // floor: boards under a scatter of straw
  const floorT = plank(5, 0x6a4a30); floorT.repeat.set(6, 3); floorT.rotation = Math.PI / 2;
  const floor = new T.Mesh(new T.PlaneGeometry(14, 10), new T.MeshStandardMaterial({ map: floorT, roughness: 0.95 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; S.add(floor);
  { const n = 2600, geo = new T.BoxGeometry(0.004, 0.003, 0.09), m = new T.InstancedMesh(geo, new T.MeshStandardMaterial({ color: 0xd8b860, roughness: 0.9 }), n), d = new T.Object3D(), col = new T.Color();
    for (let i = 0; i < n; i++) { const r = Math.sqrt(R0()) * 3.2, a = R0() * TAU; d.position.set(Math.cos(a) * r * 1.4, 0.003 + R0() * 0.02, Math.sin(a) * r * 0.8); d.rotation.set(R0() * 0.3, R0() * TAU, R0() * 0.3); d.updateMatrix(); m.setMatrixAt(i, d.matrix); m.setColorAt(i, col.setHSL(0.12 + R0() * 0.03, 0.55, 0.45 + R0() * 0.25)); }
    m.receiveShadow = true; S.add(m); }
  // back wall with the big open door; side walls; beams; a bale; a bench with the bag
  const wall = (w, h, x, y, z, ry = 0) => { const m = new T.Mesh(new T.BoxGeometry(w, h, 0.12), wallM); m.position.set(x, y, z); m.rotation.y = ry; m.receiveShadow = true; S.add(m); return m; };
  wall(3.2, 4, -3.0, 2, -2.2); wall(3.2, 4, 3.0, 2, -2.2); wall(2.8, 1.4, 0, 3.3, -2.2); wall(9, 4, -4.2, 2, 1, Math.PI / 2); wall(9, 4, 4.2, 2, 1, Math.PI / 2);
  for (const x of [-1.42, 1.42]) { const p = new T.Mesh(new T.BoxGeometry(0.18, 2.6, 0.18), beamM); p.position.set(x, 1.3, -2.15); p.castShadow = true; S.add(p); }
  const lintel = new T.Mesh(new T.BoxGeometry(3.1, 0.2, 0.2), beamM); lintel.position.set(0, 2.62, -2.12); S.add(lintel);
  for (let i = 0; i < 4; i++) { const b = new T.Mesh(new T.BoxGeometry(8.4, 0.16, 0.16), beamM); b.position.set(0, 3.4, -1.6 + i * 1.2); S.add(b); }
  const bale = new T.Mesh(new T.BoxGeometry(0.9, 0.45, 0.5), new T.MeshStandardMaterial({ color: 0xcfae5a, roughness: 1, map: W3.grainTex(128, 8, 210, 50, 10) })); bale.position.set(-2.4, 0.225, -1.6); bale.rotation.y = 0.2; bale.castShadow = bale.receiveShadow = true; S.add(bale); const b2 = bale.clone(); b2.position.set(-2.35, 0.675, -1.6); b2.rotation.y = 0.1; S.add(b2);
  const bench = new T.Mesh(new T.BoxGeometry(1.2, 0.08, 0.45), beamM); bench.position.set(2.5, 0.8, -1.7); S.add(bench); for (const x of [2.0, 3.0]) { const l = new T.Mesh(new T.BoxGeometry(0.08, 0.8, 0.4), beamM); l.position.set(x, 0.4, -1.7); S.add(l); }
  const bag = new T.Mesh(new T.BoxGeometry(0.42, 0.26, 0.22), new T.MeshStandardMaterial({ color: 0x3a1e12, roughness: 0.55 })); bag.position.set(2.4, 0.97, -1.68); bag.castShadow = true; S.add(bag);
  // the lamp on the beam
  const lampM = new T.MeshStandardMaterial({ color: 0x2a3a2a, metalness: 0.6, roughness: 0.4, side: T.DoubleSide }), bulbM = new T.MeshStandardMaterial({ color: 0xffe6b0, emissive: 0xffc070, emissiveIntensity: 3 });
  const shade = new T.Mesh(new T.ConeGeometry(0.25, 0.16, 20, 1, true), lampM); shade.position.set(0.2, 2.75, 0.2); S.add(shade); const bulb = new T.Mesh(new T.SphereGeometry(0.05, 12, 8), bulbM); bulb.position.set(0.2, 2.68, 0.2); S.add(bulb);
  const cord = new T.Mesh(new T.CylinderGeometry(0.006, 0.006, 0.62, 6), lampM); cord.position.set(0.2, 3.13, 0.2); S.add(cord);
  const lampL = new T.PointLight(0xffe2b8, 16, 9, 1.3); lampL.position.set(0.2, 2.6, 0.2); lampL.castShadow = true; S.add(lampL);
  // outside the door: the farmyard (fields, a fence, trees, a red barn across the yard)
  const grass = W3.terrain ? W3.terrain({ size: 160, seg: 64, x: 0, z: -60, height: (x, z) => z < -6 ? Math.sin(x * 0.08) * 1.5 + Math.cos(z * 0.06) * 2 * Math.min(1, (-z - 6) / 20) - 0.05 : -0.05, colour: (x, z, h) => [0.32 + h * 0.02, 0.48 + h * 0.02, 0.2] }) : null;
  if (grass) grass.position.y = -0.02;
  const fenceM = new T.MeshStandardMaterial({ color: 0x8a7a66, roughness: 0.9 }); for (let i = -8; i <= 8; i++) { const p = new T.Mesh(new T.BoxGeometry(0.1, 1, 0.1), fenceM); p.position.set(i * 1.5, 0.5, -9); S.add(p); } for (const y of [0.4, 0.8]) { const r = new T.Mesh(new T.BoxGeometry(25, 0.07, 0.05), fenceM); r.position.set(0, y, -9); S.add(r); }
  const far = new T.Mesh(new T.BoxGeometry(6, 4, 5), new T.MeshStandardMaterial({ color: 0x8a2a20, roughness: 0.85 })); far.position.set(-7, 2, -22); S.add(far); const roof = new T.Mesh(new T.CylinderGeometry(0.01, 3.6, 2, 4, 1), new T.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.7 })); roof.rotation.y = Math.PI / 4; roof.scale.set(1.2, 1, 1); roof.position.set(-7, 5, -22); S.add(roof);
  if (W3.pines) { const list = []; const R = W3.rng(4); for (let i = 0; i < 26; i++) list.push([(R() - 0.5) * 70, -26 - R() * 30, 5 + R() * 6]); W3.pines(list.map(([x, z, h]) => ({ x, z, y: 0, s: h / 9, hue: Math.random() })), { layers: 4 }); }
  const animals = {};
  V3 = { T, S, animals, cur: null, cam: { x: 0, y: 1, z: 4, tx: 0, ty: 0.6, tz: 0 }, lampL, bulb };
  W3.setQuality(stepN); return V3;
}
function setWeather(G) {
  const V = buildWorld(); if (V.none || V.sky === G.weather) return; V.sky = G.weather;
  W3.setSky(G.weather, { azim: 200 }); W3.scene.environmentIntensity = 0.6;
  W3.scene.children.forEach(o => { if (o.isLineSegments) o.visible = false; });      // the rain falls outside the door (none indoors)
  W3.S.onBolt = () => { if (!HEADLESS && sfx.thunder) setTimeout(() => sfx.thunder(), 300 + Math.random() * 900); };
}
function animalFor(kind) { const V = buildWorld(); if (V.none) return null; if (!V.animals[kind]) { V.animals[kind] = buildAnimal(kind); V.S.add(V.animals[kind]); } return V.animals[kind]; }
function onEvent(G, e) {
  const cx = W / 2, cy = H * 0.36, p = G.pt, a = p ? p.animal : 'dog';
  switch (e.k) {
    case 'arrive': sfx.hooves(a === 'dog' ? 0.5 : 1); setTimeout(() => !HEADLESS && sfx.voice(e.animal, 'hello'), 500); break;
    case 'ready': break;
    case 'tool': sfx.tool(); vibe(HAP.tick); break;
    case 'calm': sfx.stroke(); if (e.stress < 0.25 && Math.random() < 0.3) sfx.voice(a, 'content'); break;
    case 'fright': sfx.voice(a, 'upset'); FX.shake = 4; vibe(HAP.light);
      if (e.why === 'startle') say('TOO FAST: STROKE SLOWLY', cx, cy, '#ffd0c4', 18); else if (e.why === 'nothing') say('NOTHING WRONG THERE', cx, cy, '#ffd0c4', 18);
      else if (e.why === 'yank') say('TOO FAST! PULL SLOWLY', cx, cy, '#ffb4a8', 20); else if (e.why === 'tooshort') say('TOO SHORT: THAT IS SORE', cx, cy, '#ffb4a8', 20);
      else if (e.why === 'tight') say('TOO TIGHT: WRAP SLOWER', cx, cy, '#ffd0c4', 18); else if (e.why === 'against') say('WITH THE HAIR: HEAD TO TAIL', cx, cy, '#ffd0c4', 18);
      else if (e.why === 'twitched') { say('SHE FLINCHED: LIFT OFF WHEN SHE SHIVERS', cx, cy, '#ffb4a8', 18); tip('twitch', 'Watch for the shiver, then lift your thumb until it passes', 3); } else if (e.why === 'shaking') say('WAIT FOR HER HEAD TO BE STILL', cx, cy, '#ffd0c4', 18);
      if (e.stress > 0.6) tip('calmfirst', 'She is frightened. Pick your hand and stroke her slowly to calm her', 3.2); break;
    case 'wrongtool': say(`NOT THE ${TOOLNAME[G.tool].toUpperCase()}`, cx, cy + 26 * k, '#ffd0c4', 18); break;
    case 'restless': sfx.no(); say('TOO NERVOUS: CALM HER FIRST', cx, cy, '#ffd0c4', 18); tip('restless', 'Pick your hand (the first tool) and stroke her slowly along her back', 3); break;
    case 'settle': say('EASY... SHE SETTLES', cx, cy, '#9be3b5', 18); break;
    case 'bolt': sfx.voice(e.animal, 'upset'); sfx.hooves(1.6); FX.red = 0.5; say(`${e.name.toUpperCase()} BOLTED!`, cx, H * 0.3, '#ffb4a8', 24); break;
    case 'pulling': if (Math.random() < 0.15) sfx.creak(); break;
    case 'yank': sfx.no(); break;
    case 'rasp': sfx.rasp(); break;
    case 'wrap': sfx.wrap(e.n); break;
    case 'brush': sfx.brush(e.n); break;
    case 'drop': sfx.drip(e.n); break;
    case 'dropmiss': sfx.drip(0); break;
    case 'needle': sfx.click(); break;
    case 'tele': if (!HEADLESS) sfx.shiver(); break;
    case 'twitch': break;
    case 'shake': sfx.flap(); break;
    case 'stepdone': sfx.coin(2); if (e.kind === 'thorn') { say('THORN OUT!', cx, cy, '#9be3b5', 22); sfx.pop(); } if (e.kind === 'cut' && !e.sore) say('CLEAN: NOW WRAP IT', cx, cy, '#9be3b5', 20); break;
    case 'fixed': sfx.fixed(); vibe(HAP.light); if (e.kind !== 'thorn') say({ hoof: 'HOOF TRIMMED', mud: 'CLEAN AS NEW', cut: 'WRAPPED UP', shot: 'ALL DONE', ear: 'EAR SOOTHED' }[e.kind] || 'BETTER', cx, cy, '#9be3b5', 22); break;
    case 'better': sfx.better(e.n); setTimeout(() => !HEADLESS && sfx.voice(e.animal, 'happy'), 250); FX.flash = 0.4; vibe(HAP.best); say(e.gentle ? `${e.name.toUpperCase()} FEELS BETTER` : `${e.name.toUpperCase()} IS BETTER`, cx, H * 0.3, '#ffe08a', 24); if (e.gentle && e.n > 1) say(`${e.n} GENTLE VISITS IN A ROW`, cx, H * 0.3 + 30 * k, '#9be3b5', 17); break;
    case 'lessonnext': if (e.first) hint = null; say(e.first ? 'FIRST, A LESSON' : 'NEXT LESSON', cx, H * 0.5, '#ffd36a', 26); sfx.ding(); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, cx, H * 0.5, '#9be3b5', 26); sfx.coin(e.n); break;
    case 'lessonmiss': coachMiss(); break;
    case 'lessondone': say('THE BARN IS YOURS!', cx, H * 0.5, '#ffd36a', 26); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); vibe(HAP.best); break;
    case 'lost': sfx.lose(); break;
  }
}
// ---------- drawing ----------
const SV = new (window.THREE ? THREE.Vector3 : Object)();
function spotScreen(spot) { const V = V3; if (!V || V.none || !V.cur) return { x: W / 2, y: H / 2 }; W3.cam.updateMatrixWorld(); V.cur.updateMatrixWorld(true); const a = V.cur.userData.anchors[spot]; a.getWorldPosition(SV); return W3.screen(SV); }
function headTail() { const V = V3; if (!V || V.none || !V.cur) return [{ x: W * 0.7, y: H * 0.5 }, { x: W * 0.3, y: H * 0.5 }]; const u = V.cur.userData; u.head.getWorldPosition(SV); const h = W3.screen(SV); u.tail.getWorldPosition(SV); return [h, W3.screen(SV)]; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#10141f'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D barn.', W / 2, H / 2); return; }
  const T = V.T, g = G || idleG(), t = now; setWeather(g);
  const p = g.pt;
  for (const kd in V.animals) V.animals[kd].visible = false;
  let A = null;
  if (p) { A = animalFor(p.animal); V.cur = A; A.visible = true; poseAnimal(g, p, A, t, dt); }
  // the camera: a little in front of her side; close in on the part being treated
  const asp = innerWidth / innerHeight, B = p ? BODY[p.animal] : BODY.dog, face = p ? p.face : 1;
  const nk = Math.atan(B.neck[1]), xmax = B.L * 0.42 + B.neck[0] * Math.cos(nk) + B.head * 1.9, xmin = -B.L * 0.62, top = B.leg + B.ry * 1.8 + B.neck[0] * Math.sin(nk) + B.head;
  const hf = 2 * Math.atan(Math.tan(25 * Math.PI / 180) * asp), wide = (xmax - xmin) * Math.cos(0.42) + B.rz * 2 * Math.sin(0.42), fit = Math.max((wide * 1.12 + 0.3) / (2 * Math.tan(hf / 2)), top * 1.6 / (2 * Math.tan(25 * Math.PI / 180))) * (asp > 1 ? 0.8 : 1);
  let tx = face * (xmax + xmin) / 2 * 0.95, ty = top * 0.45, tz = 0, d = fit, ang = 0.42 * face;
  const foc = g.focus && p && p.phase === 'treat' ? g.focus : null;
  if (foc && A) { A.userData.anchors[foc].getWorldPosition(SV); tx = SV.x; ty = SV.y; tz = SV.z; d = Math.max(0.75, fit * 0.42); }
  const C = V.cam, ease = 1 - Math.exp(-dt * 3.5);
  C.tx += (tx - C.tx) * ease; C.ty += (ty - C.ty) * ease; C.tz += (tz - C.tz) * ease; C.d = (C.d || d) + (d - (C.d || d)) * ease; C.a = (C.a == null ? ang : C.a) + (ang - (C.a == null ? ang : C.a)) * ease;
  const cam = W3.cam; cam.fov = 50; cam.updateProjectionMatrix();
  cam.position.set(C.tx + Math.sin(C.a) * C.d, C.ty + C.d * 0.22 + 0.15, C.tz + Math.cos(C.a) * C.d); cam.lookAt(C.tx, C.ty - (foc ? 0 : C.d * 0.04), C.tz);
  if (FX.shake > 0) cam.rotation.z += (Math.random() - 0.5) * FX.shake * 0.002;
  V.bulb.material.emissiveIntensity = 2.6 + Math.sin(t * 9) * 0.05;
  W3.setFocus(0, 0.6, 0, 2.6);
  W3.render(dt);
  if (G) hud(G);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 0.9 ? 1 : 1 - (t2.t - 0.9) / 0.4; ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(t2.size * k)}px ${BC}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 26); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 26); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(15 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 19 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30;
    ctx.fillStyle = 'rgba(0,0,0,.66)'; rrect(W / 2 - w / 2, H * 0.52 - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.52 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,60,40,${FX.red * 0.18})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,248,230,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); }
}
// how she stands and moves this frame, and what shows of her problems
function poseAnimal(G, p, A, t, dt) {
  const u = A.userData, B = u.B, s = p.stress, face = p.face;
  // walking in, walking (or bolting) out
  let x = 0, walk = 0;
  if (p.phase === 'in') { const q = 1 - easeOut(Math.min(1, p.pt / 1.6)); x = -face * q * 2.4;      /* 22 Nov 2026: she is in sight from the first instant (the barn stood empty for a second and a half) */ walk = q > 0.01 ? 1 : 0; }
  if (p.phase === 'out') { const q = p.bolted ? p.pt * p.pt * 3 : Math.max(0, p.pt - 0.6) * 2.4; x = face * q * 1.8; walk = q > 0.01 ? (p.bolted ? 2 : 1) : 0; }
  A.position.set(x, 0, 0); A.scale.set(face, 1, 1);
  const tele = p.tele, shiver = tele ? Math.sin(t * 70) * 0.004 : 0, fidget = s > 0.5 ? Math.sin(t * 3.1) * (s - 0.5) * 0.06 : 0;
  u.body.position.set(shiver, Math.sin(t * (2 + s * 5)) * 0.004 * B.L + shiver, 0); u.body.rotation.x = fidget;
  // legs: a walk cycle, the sore leg held up now and then, weight shifting when nervous
  const sore = p.probs.filter(q => !q.done && (q.kind === 'thorn' || q.kind === 'hoof')).map(q => q.spot);
  u.legs.forEach((lg, i) => { const ph = [0, Math.PI, Math.PI, 0][i]; let r = walk ? Math.sin(t * (walk === 2 ? 16 : 8) + ph) * 0.35 : 0; let lift = 0;
    if (!walk && ((i === 0 && sore.includes('front')) || (i === 2 && sore.includes('hind')))) lift = Math.max(0, Math.sin(t * 1.3 + i)) * 0.3;
    if (!walk && s > 0.6 && (i % 2 === 0)) lift += Math.max(0, Math.sin(t * 4 + i * 2)) * (s - 0.6) * 0.5;
    lg.rotation.z = r + lift * (lg.userData.hind ? -1 : 1) * 0.6; lg.position.y = lg.userData.top + lift * 0.05 * B.leg; });
  // head: low when unwell, tossing when frightened, a shake for a sore ear; ears back when nervous
  const ill = p.probs.some(q => !q.done && q.kind === 'shot'), shake = p.shaking > 0 ? Math.sin(t * 38) * 0.5 * Math.min(1, p.shaking / 0.3) : 0;
  u.head.rotation.x = shake; u.head.rotation.y = Math.sin(t * 0.6) * 0.1 + (s > 0.55 ? Math.sin(t * 5) * (s - 0.55) * 0.5 : 0);
  const baseZ = p.animal === 'horse' ? -0.9 : 0; u.head.rotation.z = baseZ + (ill ? -0.35 : 0) + Math.sin(t * 0.9) * 0.04 - (p.phase === 'out' && !p.bolted ? 0 : 0);
  u.ears.forEach(e => { const back = clamp((s - 0.3) * 1.8, 0, 1); e.rotation.x = e.userData.base + e.userData.s * (back * 0.8 + Math.max(0, Math.sin(t * 2.3 + e.userData.s)) * 0.12 + (ill ? 0.3 : 0)); e.rotation.z = -back * 0.6; e.userData.inner.material.color.setHex(p.probs.some(q => !q.done && q.kind === 'ear') ? 0xd8302a : 0xd88f86); });
  u.tail.rotation.x = Math.sin(t * (1.5 + s * 6)) * (0.15 + s * 0.6);
  // the problems on her
  const M = u.marks; for (const sp of ['front', 'hind']) { const m = M[sp]; m.thorn.visible = m.cut.visible = m.band.visible = false; m.hoof.visible = false; }
  for (const sp of ['flank', 'back']) u.mud[sp].visible = false; u.syr.visible = false;
  for (const q of p.probs) {
    if (q.kind === 'thorn' && !q.done) { const m = M[q.spot]; m.thorn.visible = true; m.thorn.position.z = m.r * (1.1 + q.prog * 0.9); }
    if (q.kind === 'hoof') { const m = M[q.spot]; if (B.foot === 'hoof') { const len = q.done ? (q.sore ? -0.02 : 0.0) : Math.max(0, q.len); m.hoof.visible = len > 0.003; m.hoof.scale.set(m.r * 2.2 * len + 0.001, B.leg * 0.07, m.r * 1.3); m.hoof.position.set(m.r * 0.6 + m.r * 0.8 * len, -m.leg.userData.top + B.leg * 0.025, 0); m.foot.scale.y = 1; } }
    if (q.kind === 'cut') { const m = M[q.spot]; m.cut.visible = !q.done && q.step === 0 || (q.step === 1 && q.prog < 0.34); m.cut.material.color.setHex(q.step >= 1 ? 0xc0504a : 0x9a1a14); m.band.visible = q.step >= 1 && (q.prog > 0.01 || q.done); if (m.band.visible) m.band.scale.y = q.done ? 1 : 0.35 + q.prog * 0.65; }
    if (q.kind === 'mud' && !q.done) { const g = u.mud[q.spot]; g.visible = true; g.children.forEach((c, i) => c.visible = i / g.children.length >= q.prog); }
  }
  if (G.hold && G.hold.kind === 'press') { u.syr.visible = true; u.syr.scale.setScalar(1); }
}
let IG = null; function idleG() { if (!IG) { IG = newGame(Math.max(4, store.get('level', 1) | 0), { seed: 3 }); newPatient(IG); IG.pt.phase = 'treat'; IG.pt.stress = 0.1; } IG.t += 1 / 60; IG.pt.pt += 1 / 60; return IG; }
// ---------- the tool tray, the card, the calm bar ----------
const SHORT = { hand: 'HAND', tweezers: 'TWEEZERS', rasp: 'RASP', spray: 'SPRAY', bandage: 'WRAP', syringe: 'NEEDLE', brush: 'BRUSH', drops: 'DROPS' };
function trayRect() { const h = 74 * k, y = H - h - 10 * k; return { x: 8, y, w: W - 16, h }; }
function toolAt(x, y) { const r = trayRect(); if (y < r.y || y > r.y + r.h) return null; const i = Math.floor((x - r.x) / (r.w / TOOLS.length)); return TOOLS[clamp(i, 0, TOOLS.length - 1)]; }
function drawTool(t, x, y, s, a = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha = a; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; const st = (c, w) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.stroke(); };
  if (t === 'hand') { ctx.fillStyle = '#f0c8a0'; ctx.beginPath(); ctx.ellipse(0, 4, 9, 10, 0, 0, TAU); ctx.fill(); for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(-7 + i * 4.6, -8 + Math.abs(i - 1.5) * 2, 2.2, 7, 0, 0, TAU); ctx.fill(); } ctx.beginPath(); ctx.ellipse(10, 2, 2.4, 6, -0.8, 0, TAU); ctx.fill(); }
  if (t === 'tweezers') { ctx.beginPath(); ctx.moveTo(-3, -14); ctx.lineTo(-1, 14); ctx.moveTo(3, -14); ctx.lineTo(1, 14); st('#d8dde2', 3); }
  if (t === 'rasp') { ctx.fillStyle = '#9aa2a8'; ctx.fillRect(-4, -14, 8, 20); ctx.fillStyle = '#6b4a2a'; ctx.fillRect(-3, 6, 6, 9); for (let i = 0; i < 6; i++) { ctx.fillStyle = '#5a6268'; ctx.fillRect(-4, -12 + i * 3.2, 8, 1); } }
  if (t === 'spray') { ctx.fillStyle = '#4aa3d8'; rrect(-6, -6, 12, 20, 3); ctx.fill(); ctx.fillStyle = '#eee'; ctx.fillRect(-3, -12, 6, 6); ctx.fillRect(3, -11, 5, 2); }
  if (t === 'bandage') { ctx.fillStyle = '#f4f1ea'; ctx.beginPath(); ctx.arc(0, 0, 11, 0, TAU); ctx.fill(); ctx.fillStyle = '#c8c2b4'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, TAU); ctx.fill(); ctx.fillStyle = '#f4f1ea'; ctx.fillRect(8, 2, 8, 6); }
  if (t === 'syringe') { ctx.fillStyle = 'rgba(220,240,250,.95)'; ctx.fillRect(-4, -10, 8, 18); ctx.fillStyle = '#7fd0ff'; ctx.fillRect(-3, -2, 6, 9); ctx.beginPath(); ctx.moveTo(0, 8); ctx.lineTo(0, 16); st('#ccc', 1.2); ctx.fillStyle = '#ddd'; ctx.fillRect(-6, -14, 12, 3); }
  if (t === 'brush') { ctx.fillStyle = '#7a4a26'; rrect(-11, -6, 22, 8, 3); ctx.fill(); ctx.strokeStyle = '#2a2018'; ctx.lineWidth = 1.2; for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.moveTo(-9 + i * 2.2, 2); ctx.lineTo(-9 + i * 2.2, 9); ctx.stroke(); } }
  if (t === 'drops') { ctx.fillStyle = '#e8d8a0'; rrect(-5, -4, 10, 16, 3); ctx.fill(); ctx.fillStyle = '#c94'; ctx.beginPath(); ctx.moveTo(-3, -4); ctx.lineTo(0, -14); ctx.lineTo(3, -4); ctx.fill(); }
  ctx.restore();
}
function hud(G) {
  const c = G.cfg, p = G.pt;
  // the tray
  const r = trayRect(), cw = r.w / TOOLS.length; ctx.fillStyle = 'rgba(30,20,12,.72)'; rrect(r.x, r.y, r.w, r.h, 14); ctx.fill();
  TOOLS.forEach((t, i) => { const x = r.x + cw * (i + 0.5), y = r.y + r.h * 0.42, sel = G.tool === t; if (sel) { ctx.fillStyle = 'rgba(255,211,106,.28)'; rrect(r.x + cw * i + 3, r.y + 4, cw - 6, r.h - 8, 10); ctx.fill(); ctx.strokeStyle = '#ffd36a'; ctx.lineWidth = 2; ctx.stroke(); }
    drawTool(t, x, y, 1.05 * k); ctx.fillStyle = sel ? '#ffd36a' : 'rgba(255,255,255,.75)'; ctx.font = `700 ${Math.round(8.5 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(SHORT[t], x, r.y + r.h - 12 * k); });
  if (G.lesson) lessonPanel(G);
  // the card: her name, what the owner noticed (ticked when fixed); the calm bar under it
  const ty = G.lesson ? H * 0.235 : 40 * k;
  if (p) { const A = ANIMALS[p.animal], w = Math.min(W - 28, 250 * k), x = 14, items = p.probs.map(q => [PROBS[q.kind].card, q.done]), h = (44 + 15 * items.length) * k;
    ctx.save(); ctx.translate(x, ty); ctx.rotate(-0.012); ctx.fillStyle = '#f6efdc'; rrect(0, 0, w, h, 6); ctx.fill(); ctx.fillStyle = '#5a8a4a'; ctx.fillRect(0, 0, w, 5 * k);
    ctx.fillStyle = '#2b2b2b'; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.font = `700 ${Math.round(15 * k)}px ${BC}`; ctx.fillText(`${p.name} the ${A.name}`, 10, 10 * k);
    ctx.font = `600 ${Math.round(12.5 * k)}px ${BC}`; items.forEach(([s, d], j) => { ctx.fillStyle = d ? '#4a8a4a' : '#5a4a3a'; ctx.fillText(`${d ? '✓' : '•'} ${s}`, 12, 30 * k + j * 15 * k); });
    // calm bar
    const bx = 10, bw = w - 20, by2 = h - 12 * k, s = clamp(p.stress, 0, 1); ctx.fillStyle = '#ddd2ba'; rrect(bx, by2, bw, 6 * k, 3); ctx.fill();
    ctx.fillStyle = s < 0.4 ? '#6cbf6c' : s < c.still ? '#e8b04a' : '#d9534f'; rrect(bx, by2, Math.max(4, bw * s), 6 * k, 3); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(bx + bw * c.still - 1, by2 - 3, 2, 6 * k + 6);
    ctx.fillStyle = '#7a6a5a'; ctx.font = `700 ${Math.round(9 * k)}px ${BC}`; ctx.textAlign = 'right'; ctx.fillText(s < 0.4 ? 'CALM' : s < c.still ? 'UNEASY' : 'TOO NERVOUS', w - 10, by2 - 12 * k); ctx.restore(); }
  if (!G.lesson) { ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = '#fff'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.5)'; const s = `${Math.min(G.seen, c.patients)} / ${c.patients} patients`; ctx.strokeText(s, W - 14, ty + 4 * k); ctx.fillText(s, W - 14, ty + 4 * k);
    for (let i = 0; i < c.lives; i++) { ctx.beginPath(); ctx.arc(W - 20 - i * 16 * k, ty + 28 * k, 5 * k, 0, TAU); ctx.fillStyle = i < G.lives ? '#ffd36a' : 'rgba(255,255,255,.25)'; ctx.fill(); } }
  if (!p || p.phase !== 'treat') return;
  // guides for the tool in use, at the part being treated
  const h0 = G.hold, foc = G.focus;
  if (h0 && foc) { const s = spotScreen(foc), pr = h0.pr; ctx.lineWidth = 5 * k; ctx.lineCap = 'round';
    const ring = (v, col) => { ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.arc(s.x, s.y, 34 * k, 0, TAU); ctx.stroke(); ctx.strokeStyle = col; ctx.beginPath(); ctx.arc(s.x, s.y, 34 * k, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(v, 0, 1)); ctx.stroke(); };
    if (h0.kind === 'pull') ring(pr.prog, '#9be3b5');
    if (h0.kind === 'spray') ring(pr.prog, '#7fd0ff');
    if (h0.kind === 'press') ring(pr.prog, p.tele ? '#ff8a6a' : '#7fd0ff');
    if (G.tool === 'bandage') { ctx.setLineDash([6 * k, 6 * k]); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 3 * k; ctx.beginPath(); ctx.arc(s.x, s.y, 46 * k, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ring(pr.prog, '#f4f1ea'); }
    if (G.tool === 'brush' || G.tool === 'drops') ring(pr.prog, '#9be3b5');
    if (G.tool === 'rasp') { const gx = s.x + 52 * k, top = s.y - 40 * k, hh = 70 * k, v = clamp(pr.len, -0.3, 1); ctx.fillStyle = 'rgba(0,0,0,.45)'; rrect(gx - 6 * k, top, 12 * k, hh, 5); ctx.fill(); const zero = top + hh * 0.8; ctx.fillStyle = v < -c.raspTol ? '#d9534f' : '#e6c27a'; const yv = zero - v / 1 * hh * 0.8; ctx.fillRect(gx - 4 * k, Math.min(yv, zero), 8 * k, Math.abs(zero - yv)); ctx.fillStyle = '#9be3b5'; ctx.fillRect(gx - 10 * k, zero - 1.5, 20 * k, 3); ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.textAlign = 'left'; ctx.fillText('LINE', gx + 12 * k, zero); }
  }
  if (G.tool === 'brush') { const [hd, tl] = headTail(), dx = tl.x - hd.x, dy = tl.y - hd.y, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L; ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2.5 * k; const cxp = (hd.x + tl.x) / 2, cyp = (hd.y + tl.y) / 2 - 20 * k;
    for (let i = -1; i <= 1; i++) { const ox = cxp + ux * i * 40 * k, oy = cyp + uy * i * 40 * k; ctx.beginPath(); ctx.moveTo(ox - ux * 12 * k, oy - uy * 12 * k); ctx.lineTo(ox + ux * 12 * k, oy + uy * 12 * k); ctx.lineTo(ox + ux * 6 * k - uy * 5 * k, oy + uy * 6 * k + ux * 5 * k); ctx.stroke(); } }
  if (p.tele && h0 && h0.kind === 'press') { const s = spotScreen('neck'); ctx.fillStyle = '#ff8a6a'; ctx.font = `700 ${Math.round(16 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillText('SHE SHIVERS: LIFT!', s.x, s.y - 52 * k); }
  // the tool under the thumb
  if (ui.drag && G.tool !== 'hand') drawTool(G.tool, ui.drag.x, ui.drag.y - 30 * k, 1.6 * k, 0.95);
  if (G.N <= 2 && !G.lesson && G.t < 10 && G.tool === 'hand') { ctx.globalAlpha = 0.85; ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillText('PICK A TOOL BELOW · YOUR HAND CALMS HER', W / 2, r.y - 14 * k); ctx.globalAlpha = 1; }
}
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { coachPanel(G); }
