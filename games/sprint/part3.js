
// ===================== THE VIEW: Sprint in 3D (three.js; sky, light, shadows from tools/world3d.js) =====================
// A real athletics stadium: an eight-lane red track round a striped infield, stands full of a crowd that rises as you near the
// line, floodlights, boards and a trackside clock. Eight runners with real limbs: in the blocks, crouched on SET, driving
// low off the gun, upright at full speed, over the hurdles, dipping at the line. The camera sits low by you in the blocks,
// rides behind you down the track and swings to the side for the photo finish. Your best run is a ghost in your lane.
const FX = { shake: 0, stop: 0, flash: 0, red: 0, slow: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { snap: true, cam: null, pads: { L: 0, R: 0 }, qual: null, banner: null, ghost: null };
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS || !(G && G.lesson)) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 160) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: 0.5 + Math.random() * 0.4, col, r: (1.5 + Math.random() * 2.5) * k }); } if (PARTS.length > 240) PARTS.splice(0, PARTS.length - 240); }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2.5); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.4) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  for (const s of ['L', 'R']) ui.pads[s] = Math.max(0, ui.pads[s] - dt * 5); if (ui.qual) { ui.qual.t += dt; if (ui.qual.t > 0.6) ui.qual = null; } if (ui.banner) { ui.banner.t += dt; if (ui.banner.t > (ui.banner.secs || 0.9)) ui.banner = null; }
  if (ui.pend) { ui.pend.t -= dt; if (ui.pend.t <= 0) { const f = ui.pend.fn; ui.pend = null; f(); } }
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; } }
const hex = n => '#' + n.toString(16).padStart(6, '0');
function mySkin() { if (typeof HEADLESS !== 'undefined' && HEADLESS) return SKINS[0]; const id = store.get('skin', 'blue'); return SKINS.find(q => q.id === id) || SKINS[0]; }
// ---------- where things are on the track ----------
const RK = 36.5, rc = i => RK + LW * (i + 0.5), CHUTE = 32, OUT = RK + LW * LANES;
// u: metres still to run to the finish line; bend: a 200 m (it starts round the far bend). Returns x, z and the heading.
function trackAt(i, u, bend) { const r = rc(i);
  if (bend && u > LS) { const th = Math.min(Math.PI, (u - LS) / r); return { x: -LS / 2 - r * Math.sin(th), z: r * Math.cos(th), yaw: Math.atan2(Math.cos(th), Math.sin(th)) }; }
  if (u < -2) { const th = Math.min(Math.PI * 0.9, (-u - 2) / r); return { x: LS / 2 + 2 + r * Math.sin(th), z: r * Math.cos(th), yaw: Math.atan2(Math.cos(th), -Math.sin(th)) }; }
  return { x: LS / 2 - u, z: r, yaw: Math.PI / 2 }; }
const visD = g => g.yard ? 110 : g.D;
function canvasTex(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
// ---------- a runner: real limbs on pivots (faces +z; left is +x) ----------
const SKIN_TONES = [0x8d5524, 0xc68642, 0xe0ac69, 0x6b4226, 0x4a2c1a, 0xf1c27d, 0x9c6b43, 0x3b2219];
function makeRig(V, o) { const T = V.T, m = (col, x = {}) => new T.MeshStandardMaterial(Object.assign({ color: col, roughness: 0.6 }, x));
  const ghost = !!o.ghost, gm = ghost ? new T.MeshStandardMaterial({ color: 0xbfe8ff, emissive: 0x4a90c0, emissiveIntensity: 0.6, transparent: true, opacity: 0.32, depthWrite: false, roughness: 0.4 }) : null;
  const skin = gm || m(o.skin, { roughness: 0.55 }), kit = gm || new T.MeshPhysicalMaterial({ color: o.col, roughness: 0.42, sheen: 0.6, sheenColor: new T.Color(0xffffff) }), dark = gm || m(o.shorts || 0x1a1d24, { roughness: 0.7 }), shoe = gm || m(o.shoe, { roughness: 0.35 }), hair = gm || m(0x14100c, { roughness: 0.9 });
  const cap = (r, l, mat) => { const ms = new T.Mesh(V.capG(r, l), mat); ms.castShadow = !ghost; return ms; }, piv = (p, x, y, z) => { const g = new T.Group(); g.position.set(x, y, z); p.add(g); return g; };
  const root = new T.Group(), pel = piv(root, 0, 0.93, 0), tor = piv(pel, 0, 0, 0);
  const body = cap(0.15, 0.3, kit); body.position.y = 0.27; body.scale.set(1.05, 1, 0.72); tor.add(body);
  const head = new T.Mesh(V.sphG, skin); head.scale.setScalar(0.115); head.position.y = 0.69; head.castShadow = !ghost; tor.add(head);
  const hr = new T.Mesh(V.sphG, hair); hr.scale.set(0.118, 0.07, 0.12); hr.position.set(0, 0.745, -0.015); tor.add(hr);
  const neck = cap(0.05, 0.06, skin); neck.position.y = 0.55; tor.add(neck);
  const sh = new T.Mesh(V.boxG, dark); sh.scale.set(0.31, 0.17, 0.2); sh.position.y = -0.03; sh.castShadow = !ghost; pel.add(sh);
  const arm = sx => { const s = piv(tor, sx * 0.19, 0.46, 0), up = cap(0.045, 0.2, o.sleeve ? kit : skin); up.position.y = -0.14; s.add(up); const e = piv(s, 0, -0.28, 0), fo = cap(0.04, 0.19, skin); fo.position.y = -0.13; e.add(fo); const hd = new T.Mesh(V.sphG, skin); hd.scale.setScalar(0.045); hd.position.y = -0.28; e.add(hd); return [s, e]; };
  const leg = sx => { const h = piv(pel, sx * 0.095, -0.06, 0), th = cap(0.075, 0.27, skin); th.position.y = -0.21; h.add(th); const kn = piv(h, 0, -0.43, 0), shn = cap(0.055, 0.3, skin); shn.position.y = -0.21; kn.add(shn); const an = piv(kn, 0, -0.43, 0), sf = new T.Mesh(V.boxG, shoe); sf.scale.set(0.1, 0.075, 0.26); sf.position.set(0, -0.02, 0.06); sf.castShadow = !ghost; an.add(sf); return [h, kn, an]; };
  const [aL, eL] = arm(1), [aR, eR] = arm(-1), [hL, kL, fL] = leg(1), [hR, kR, fR] = leg(-1);
  const rg = { root, pel, tor, aL, eL, aR, eR, hL, kL, fL, hR, kR, fR, ghost }; V.S.add(root); return rg; }
// poses: a target for every joint, eased to (fast while running so the stride stays crisp)
function pose(rg, P, dt, rate = 22) { const kk = Math.min(1, dt * rate), j = (o, ax, v) => { o.rotation[ax] += (v - o.rotation[ax]) * kk; };
  rg.pel.position.y += (P.py - rg.pel.position.y) * kk; j(rg.tor, 'x', P.lean); j(rg.tor, 'z', P.roll || 0);
  j(rg.aL, 'x', P.aL); j(rg.aR, 'x', P.aR); j(rg.eL, 'x', P.eL); j(rg.eR, 'x', P.eR); j(rg.aL, 'z', P.azL || 0); j(rg.aR, 'z', P.azR || 0);
  j(rg.hL, 'x', -P.tL); j(rg.hR, 'x', -P.tR); j(rg.kL, 'x', P.kL); j(rg.kR, 'x', P.kR); j(rg.hL, 'z', P.hzL || 0); j(rg.hR, 'z', P.hzR || 0); j(rg.fL, 'x', P.fL || 0); j(rg.fR, 'x', P.fR || 0); }
function runPose(ph, v, lean0) { const a = ph * TAU, sp = clamp(v / 10, 0, 1.15), amp = 0.22 + 0.68 * sp, sa = Math.sin(a), ca = Math.cos(a);
  return { py: 0.9 + 0.05 * Math.abs(sa) * sp, lean: lean0 != null ? lean0 : 0.1 + 0.08 * sp, tL: amp * sa, tR: -amp * sa, kL: 0.12 + (0.35 + 1.45 * sp) * Math.max(0, ca), kR: 0.12 + (0.35 + 1.45 * sp) * Math.max(0, -ca),
    aL: 1.15 * amp * sa, aR: -1.15 * amp * sa, eL: -1.45, eR: -1.45, fL: 0.3 * Math.max(0, ca), fR: 0.3 * Math.max(0, -ca), roll: 0.04 * sa * sp }; }
const POSE_MARKS = { py: 0.48, lean: 0.95, tL: 1.35, tR: -0.25, kL: 2.2, kR: 2.05, aL: -0.9, aR: -0.9, eL: 0, eR: 0, fL: -0.4, fR: 0.6 };
const POSE_SET = { py: 0.7, lean: 1.3, tL: 1.25, tR: 0.45, kL: 1.75, kR: 1.3, aL: -1.25, aR: -1.25, eL: 0, eR: 0, fL: -0.4, fR: 0.1 };
const POSE_STAND = { py: 0.93, lean: 0.03, tL: 0.05, tR: -0.05, kL: 0.08, kR: 0.08, aL: 0.08, aR: -0.08, eL: -0.25, eR: -0.25, azL: 0.08, azR: -0.08 };
const POSE_JUMP = { py: 0.95, lean: 0.62, tL: 1.45, tR: 0.55, kL: 0.12, kR: 1.75, hzR: -1.05, aL: -1.6, aR: 0.6, eL: -0.25, eR: -1.2, fL: -0.3 };
const POSE_DIP = { py: 0.86, lean: 1.0, tL: 0.6, tR: -0.6, kL: 0.4, kR: 0.6, aL: 1.2, aR: 1.2, eL: -0.3, eR: -0.3 };
const POSE_JOY = { py: 0.93, lean: -0.08, tL: 0.15, tR: -0.1, kL: 0.2, kR: 0.15, aL: -2.9, aR: -2.9, eL: -0.3, eR: -0.3, azL: 0.35, azR: -0.35 };
// ---------- building the stadium (once) ----------
function buildWorld() {
  if (V3) return V3; const T = window.THREE; if (!T || !W3 || !W3.init({ canvas: $('gl'), fov: 58, far: 2500, near: 0.1 })) { V3 = { none: true }; return V3; }
  V3 = { T, S: W3.scene, built: null, rigs: [], t: 0 }; const V = V3, S = V.S;
  V.capG = (() => { const c = {}; return (r, l) => c[r + ':' + l] || (c[r + ':' + l] = new T.CapsuleGeometry(r, l, 3, 8)); })(); V.sphG = new T.SphereGeometry(1, 14, 10); V.boxG = new T.BoxGeometry(1, 1, 1);
  const grain = W3.grainTex(256, 11, 190, 40, 2);
  // the ground round the stadium, the infield with mown stripes
  const ground = new T.Mesh(new T.PlaneGeometry(900, 900), new T.MeshStandardMaterial({ color: 0x4d7a3a, roughness: 0.95, map: grain })); ground.material.map.repeat.set(60, 60); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.03; ground.receiveShadow = true; S.add(ground);
  const stripes = canvasTex(64, 64, (g, w, h) => { g.fillStyle = '#4f9a3c'; g.fillRect(0, 0, w, h); g.fillStyle = '#5cab47'; g.fillRect(0, 0, w / 2, h); }); stripes.wrapS = stripes.wrapT = T.RepeatWrapping; stripes.repeat.set(0.08, 0.08);
  const sh = new T.Shape(); sh.moveTo(-LS / 2, -RK); sh.lineTo(LS / 2, -RK); sh.absarc(LS / 2, 0, RK, -Math.PI / 2, Math.PI / 2, false); sh.lineTo(-LS / 2, RK); sh.absarc(-LS / 2, 0, RK, Math.PI / 2, Math.PI * 1.5, false);
  const inf = new T.Mesh(new T.ShapeGeometry(sh, 48), new T.MeshStandardMaterial({ color: 0xffffff, map: stripes, roughness: 0.92 })); inf.rotation.x = Math.PI / 2; inf.position.y = 0.005; inf.receiveShadow = true; inf.material.side = T.DoubleSide; S.add(inf);
  // the track: tartan red, the chute running on past the far bend for the 100 m and hurdles
  const tart = new T.MeshStandardMaterial({ color: 0xc0472f, roughness: 0.88, map: W3.grainTex(256, 7, 205, 30, 6) }); tart.map.repeat.set(0.6, 0.6);
  const planeAt = (x0, x1, z0, z1, y) => { const g = new T.PlaneGeometry(x1 - x0, z1 - z0); g.rotateX(-Math.PI / 2); g.translate((x0 + x1) / 2, y, (z0 + z1) / 2); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (x1 - x0) / 4, uv.getY(i) * (z1 - z0) / 4); return g; };
  const ring = (cx, a0) => { const g = new T.RingGeometry(RK - 0.25, OUT + 1.2, 96, 1, a0, Math.PI); g.rotateX(-Math.PI / 2); g.translate(cx, 0.008, 0); const uv = g.attributes.uv, p = g.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) / 4, p.getZ(i) / 4); return g; };
  const trackG = T.mergeGeometries([planeAt(-LS / 2 - CHUTE - 4, LS / 2 + 2, RK - 0.25, OUT + 1.2, 0.012), planeAt(-LS / 2, LS / 2, -OUT - 1.2, -RK + 0.25, 0.008), ring(-LS / 2, Math.PI / 2), ring(LS / 2, -Math.PI / 2)]);
  const track = new T.Mesh(trackG, tart); track.receiveShadow = true; S.add(track);
  // the white lines (thin strips), the kerb
  const strips = [], strip = (pts, w, y) => { const pos = []; for (let i = 0; i < pts.length - 1; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1], dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz) || 1, nx = -dz / L * w / 2, nz = dx / L * w / 2;
      pos.push(ax + nx, y, az + nz, ax - nx, y, az - nz, bx + nx, y, bz + nz, ax - nx, y, az - nz, bx - nx, y, bz - nz, bx + nx, y, bz + nz); }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); strips.push(g); };
  const inChute = (x, z) => x < -LS / 2 + 0.5 && x > -LS / 2 - CHUTE - 4 && z > RK - 0.4;
  for (let l = 0; l <= LANES; l++) { const r = RK + LW * l, y = 0.02;
    strip([[-LS / 2 - CHUTE - 4, r], [LS / 2 + 2, r]], 0.05, y + 0.002); strip([[-LS / 2, -r], [LS / 2, -r]], 0.05, y);
    let cur = []; for (let i = 0; i <= 96; i++) { const th = Math.PI * i / 96, x = -LS / 2 - r * Math.sin(th), z = r * Math.cos(th); if (inChute(x, z)) { if (cur.length > 1) strip(cur, 0.05, y); cur = []; } else cur.push([x, z]); } if (cur.length > 1) strip(cur, 0.05, y);
    cur = []; for (let i = 0; i <= 96; i++) { const th = Math.PI * i / 96; cur.push([LS / 2 + 2 + r * Math.sin(th), r * Math.cos(th)]); } strip(cur, 0.05, y); }
  strip([[LS / 2, RK], [LS / 2, OUT]], 0.08, 0.024);      // the finish line
  for (let l = 0; l < LANES; l++) strip([[LS / 2 - 0.7, RK + LW * l + 0.3], [LS / 2 - 0.7, RK + LW * l + 0.5]], 0.25, 0.024);
  const lines = new T.Mesh(T.mergeGeometries(strips), new T.MeshStandardMaterial({ color: 0xf4f4f0, roughness: 0.5 })); lines.receiveShadow = true; S.add(lines);
  { const k2 = []; const kr = RK - 0.08; let cur = []; for (let i = 0; i <= 64; i++) { const th = Math.PI * i / 64; cur.push([-LS / 2 - kr * Math.sin(th), kr * Math.cos(th)]); } k2.push(cur); cur = []; for (let i = 0; i <= 64; i++) { const th = Math.PI * i / 64; cur.push([LS / 2 + kr * Math.sin(th), kr * Math.cos(th)]); } k2.push(cur); k2.push([[-LS / 2, kr], [LS / 2, kr]], [[-LS / 2, -kr], [LS / 2, -kr]]);
    const g = []; for (const pts of k2) { const p = []; for (let i = 0; i < pts.length - 1; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1], b = new T.BoxGeometry(Math.hypot(bx - ax, bz - az) + 0.02, 0.06, 0.07); b.rotateY(-Math.atan2(bz - az, bx - ax)); b.translate((ax + bx) / 2, 0.03, (az + bz) / 2); g.push(b); } }
    const kerb = new T.Mesh(T.mergeGeometries(g), new T.MeshStandardMaterial({ color: 0xdfe3e8, metalness: 0.6, roughness: 0.3 })); kerb.castShadow = true; S.add(kerb); }
  // stands: stepped concrete, a crowd on every step (in four groups that bob in turn), a roof over the main stand
  const conc = new T.MeshStandardMaterial({ color: 0x9aa0a8, roughness: 0.9, map: grain }), stand = [], crowd = [[], [], [], []], R = W3.rng(77);
  const tiers = (z0, dz, rows, x0, x1, side) => { for (let j = 0; j < rows; j++) { const z = z0 + side * j * 0.85, top = 1.1 + j * 0.46, b = new T.BoxGeometry(x1 - x0, top, 0.86); b.translate((x0 + x1) / 2, top / 2, z + side * 0.43); stand.push(b);
      for (let x = x0 + 0.4; x < x1 - 0.4; x += 0.5 + R() * 0.35) if (R() < 0.9) crowd[(R() * 4) | 0].push({ x, y: top, z: z + side * 0.45, c: KITS[(R() * KITS.length) | 0], s: SKIN_TONES[(R() * SKIN_TONES.length) | 0], h: 0.9 + R() * 0.2, rot: side > 0 ? Math.PI : 0 }); } };
  tiers(OUT + 4.2, 0.85, 15, -LS / 2 - CHUTE, LS / 2 + 8, 1); tiers(-OUT - 4.2, 0.85, 9, -LS / 2 + 4, LS / 2 - 4, -1);
  const standM = new T.Mesh(T.mergeGeometries(stand), conc); standM.receiveShadow = true; standM.castShadow = true; S.add(standM);
  V.crowd = crowd.map(list => { const bodyG = new T.BoxGeometry(0.42, 0.55, 0.28); bodyG.translate(0, 0.3, 0); const headG = new T.SphereGeometry(0.12, 8, 6); headG.translate(0, 0.7, 0);
    const bm = new T.InstancedMesh(bodyG, new T.MeshStandardMaterial({ roughness: 0.8 }), list.length), hm = new T.InstancedMesh(headG, new T.MeshStandardMaterial({ roughness: 0.7 }), list.length), d = new T.Object3D(), c = new T.Color();
    list.forEach((p, i) => { d.position.set(p.x, p.y, p.z); d.rotation.set(0, p.rot, 0); d.scale.set(1, p.h, 1); d.updateMatrix(); bm.setMatrixAt(i, d.matrix); hm.setMatrixAt(i, d.matrix); bm.setColorAt(i, c.setHex(p.c)); hm.setColorAt(i, c.setHex(p.s)); });
    const grp = new T.Group(); grp.add(bm, hm); S.add(grp); return grp; });
  { const roofZ0 = OUT + 3.5, roofZ1 = OUT + 4.2 + 15 * 0.85 + 1.5, top = 1.1 + 15 * 0.46 + 4.5; const roof = new T.Mesh(new T.BoxGeometry(LS + CHUTE + 14, 0.35, roofZ1 - roofZ0), new T.MeshStandardMaterial({ color: 0xdfe4ea, roughness: 0.5, metalness: 0.3 })); roof.position.set((-LS / 2 - CHUTE + LS / 2 + 8) / 2, top, (roofZ0 + roofZ1) / 2); roof.castShadow = true; S.add(roof);
    const pg = []; for (let x = -LS / 2 - CHUTE + 2; x < LS / 2 + 8; x += 16) { const p = new T.CylinderGeometry(0.22, 0.25, top, 8); p.translate(x, top / 2, roofZ1 - 0.4); pg.push(p); } const posts = new T.Mesh(T.mergeGeometries(pg), conc); posts.castShadow = true; S.add(posts); }
  // boards round the track, floodlight towers
  const BRANDS = ['SPRINT', 'GO GO GO', 'FAST FEET', 'GAME FEED', 'SPEED', 'PERSONAL BEST', 'RUN!', 'GOLD'], bcols = ['#e8463c', '#2f7de0', '#1fa060', '#f2c230', '#8a4fd0', '#f07a2a', '#14181f', '#22b8c8'];
  V.boardTex = BRANDS.map((b, i) => canvasTex(256, 64, (g, w, h) => { g.fillStyle = bcols[i]; g.fillRect(0, 0, w, h); g.fillStyle = i === 3 || i === 6 ? '#f2c230' : '#fff'; g.font = '900 38px Impact, "Arial Narrow", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(b, w / 2, h / 2 + 2); }));
  const bmats = V.boardTex.map(t => new T.MeshStandardMaterial({ map: t, roughness: 0.5, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.25 }));
  V.boardMats = bmats;
  for (let x = -LS / 2 - CHUTE, i = 0; x < LS / 2 + 6; x += 4.1, i++) { const b = new T.Mesh(V.boxG, bmats[i % bmats.length]); b.scale.set(4, 0.9, 0.08); b.position.set(x + 2, 0.45, OUT + 2.6); b.rotation.y = Math.PI; S.add(b); }
  for (let x = -LS / 2 + 4, i = 3; x < LS / 2 - 4; x += 4.1, i++) { const b = new T.Mesh(V.boxG, bmats[i % bmats.length]); b.scale.set(4, 0.9, 0.08); b.position.set(x + 2, 0.45, -OUT - 2.6); S.add(b); }
  V.lampM = new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff4d8, emissiveIntensity: 0.4 });
  for (const [x, z] of [[-LS / 2 - 30, OUT + 22], [LS / 2 + 24, OUT + 22], [-LS / 2 - 18, -OUT - 18], [LS / 2 + 18, -OUT - 18]]) { const pole = new T.Mesh(new T.CylinderGeometry(0.35, 0.6, 34, 8), conc); pole.position.set(x, 17, z); pole.castShadow = true; S.add(pole);
    const head = new T.Mesh(V.boxG, V.lampM); head.scale.set(6, 3.2, 0.5); head.position.set(x, 34.5, z); head.lookAt(0, 0, 0); S.add(head); }
  V.flood = new T.DirectionalLight(0xfff2dc, 0); V.flood.position.set(0, 60, 20); S.add(V.flood); S.add(V.flood.target);
  // the trackside clock at the finish
  V.clockC = document.createElement('canvas'); V.clockC.width = 256; V.clockC.height = 96; V.clockT = new T.CanvasTexture(V.clockC); V.clockT.colorSpace = T.SRGBColorSpace;
  const clock = new T.Mesh(new T.BoxGeometry(2.2, 0.82, 0.18), [conc, conc, conc, conc, new T.MeshBasicMaterial({ map: V.clockT, toneMapped: false }), conc]); clock.position.set(LS / 2 + 3, 2.6, RK - 2.4); clock.rotation.y = -Math.PI / 2 + 0.5; S.add(clock);
  const cpost = new T.Mesh(new T.CylinderGeometry(0.08, 0.08, 2.2, 6), conc); cpost.position.set(LS / 2 + 3, 1.1, RK - 2.4); S.add(cpost);
  // finish posts
  for (const z of [RK - 0.6, OUT + 0.6]) { const p = new T.Mesh(new T.BoxGeometry(0.12, 1.4, 0.12), new T.MeshStandardMaterial({ color: 0xffffff })); p.position.set(LS / 2, 0.7, z); p.castShadow = true; S.add(p); }
  // hurdles (instanced: frames and bars), blocks, the green take-off mark
  const hf = []; for (const sx of [-0.5, 0.5]) { const u = new T.BoxGeometry(0.035, 0.9, 0.035); u.translate(sx, 0.45, 0); hf.push(u); const f = new T.BoxGeometry(0.035, 0.035, 0.7); f.translate(sx, 0.02, -0.33); hf.push(f); }
  V.hFrameG = T.mergeGeometries(hf); V.hBarG = new T.BoxGeometry(1.08, 0.12, 0.02); V.hBarG.translate(0, 0.86, 0);
  V.barTex = canvasTex(128, 16, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#111' : '#fff'; g.fillRect(i * w / 8, 0, w / 8, h); } });
  V.mark = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ color: 0x40ff70, transparent: true, opacity: 0.45, depthWrite: false })); V.mark.rotation.x = -Math.PI / 2; V.mark.visible = false; S.add(V.mark);
  V.race = null;
  W3.setQuality(stepN); return V; }
// ---------- each race: the runners, the hurdles, the blocks, the sky ----------
function buildRace(V, g) { const T = V.T, S = V.S;
  if (V.race) { S.remove(V.race); V.race.traverse(o => { if (o.isInstancedMesh) o.dispose(); }); }
  for (const rg of V.rigs) S.remove(rg.root); V.rigs = [];
  V.race = new T.Group(); S.add(V.race); V.built = g; V.hv = g.H.join(','); const bend = g.D >= 200, D = visD(g);
  const pl = PLACES[placeOf(g.N)]; W3.setSky(g.yard ? 'morning' : pl.sky, { azim: 210 }); V.crowdLv = g.yard ? 0.2 : pl.crowd;
  const night = W3.S.night > 0; V.flood.intensity = night ? 2.2 : 0; W3.hemi.intensity = W3.S.hemiI + (night ? 0.9 : 0); V.lampM.emissiveIntensity = night ? 3 : 0.3;
  // runners
  for (const q of g.all) { const sk = SKIN_TONES[(q.lane * 3 + g.seed) % SKIN_TONES.length]; V.rigs.push(makeRig(V, { col: q.you ? mySkin().col : q.col, skin: q.you ? 0x8d5524 : sk, shoe: q.you ? 0xf2f6ff : [0xff4a8a, 0x30e060, 0xf2c230, 0xffffff, 0x30b0ff][q.lane % 5], shorts: q.you ? 0x14203a : 0x1a1d24 })); }
  V.ghostRig = null; const gh = !g.yard && !HEADLESS ? (store.get('ghost', {}) || {})[g.cfg.E.id] : null; ui.ghost = gh && gh.tr && gh.tr.length > 5 ? gh : null; if (ui.ghost) V.ghostRig = makeRig(V, { ghost: true });
  // hurdles: every lane in a hurdles race; your lane only in the lesson
  const hs = []; for (let i = 0; i < g.H.length; i++) for (let l = 0; l < LANES; l++) if (!g.yard || l === YOU_LANE) hs.push({ i, l });
  V.hl = hs; if (hs.length) { V.hFrame = new T.InstancedMesh(V.hFrameG, new T.MeshStandardMaterial({ color: 0x4a4f58, metalness: 0.5, roughness: 0.4 }), hs.length); V.hBar = new T.InstancedMesh(V.hBarG, new T.MeshStandardMaterial({ map: V.barTex, roughness: 0.5 }), hs.length);
    V.hFrame.castShadow = V.hBar.castShadow = true; V.race.add(V.hFrame, V.hBar); V.hKnock = -1; placeHurdles(V, g); }
  // the blocks and start lines
  const bl = []; for (let l = 0; l < LANES; l++) { const p = trackAt(l, D, bend), b = new T.BoxGeometry(0.35, 0.12, 0.6); b.rotateX(-0.5); b.rotateY(p.yaw); b.translate(p.x - Math.sin(p.yaw) * 0.55, 0.06, p.z - Math.cos(p.yaw) * 0.55); bl.push(b);
    const ln = new T.BoxGeometry(LW - 0.05, 0.005, 0.06); ln.rotateY(p.yaw + Math.PI / 2); ln.translate(p.x, 0.026, p.z); bl.push(ln); }
  const blocks = new T.Mesh(T.mergeGeometries(bl.map(b => b.index ? b.toNonIndexed() : b)), new T.MeshStandardMaterial({ color: 0xe8ecf0, roughness: 0.5 })); blocks.castShadow = true; V.race.add(blocks);
  ui.snap = true; }
function placeHurdles(V, g) { const d = new V.T.Object3D(), bend = g.D >= 200, D = visD(g); V.hKnock = Object.keys(g.knock).length;
  V.hl.forEach((h, n) => { const p = trackAt(h.l, D - g.H[h.i], bend); d.position.set(p.x, 0, p.z); d.rotation.set(0, p.yaw + Math.PI / 2, 0); if (h.l === YOU_LANE && g.knock[h.i]) { d.rotation.set(0, p.yaw + Math.PI / 2, 0); d.rotateX(-1.35); } d.updateMatrix(); V.hFrame.setMatrixAt(n, d.matrix); V.hBar.setMatrixAt(n, d.matrix); });
  V.hFrame.instanceMatrix.needsUpdate = V.hBar.instanceMatrix.needsUpdate = true; }
function ghostS(t) { const tr = ui.ghost.tr, i = t / 0.1, a = Math.floor(i); if (a >= tr.length - 1) return tr[tr.length - 1] + (t - (tr.length - 1) * 0.1) * 9; if (a < 0) return 0; return tr[a] + (tr[a + 1] - tr[a]) * (i - a); }
// the pose of a runner this frame
function rigPose(g, q, rg, dt) { const bend = g.D >= 200, D = visD(g), you = q.you, y = g.you;
  let P, lift = 0; const u = D - q.s, p = trackAt(q.lane, u, bend);
  const startedQ = you ? q.started : (g.phase === 'run' && g.t - g.gunT >= q.react);
  if (!startedQ && g.phase !== 'run') P = g.phase === 'marks' ? POSE_MARKS : POSE_SET;
  else if (!startedQ) P = POSE_SET;
  else if (q.fin != null && q.v < 3.5) P = (you ? y.place === 1 : g.rivals.filter(r => r.fin != null).sort((a, b) => a.fin - b.fin)[0] === q) ? POSE_JOY : POSE_STAND;
  else { const drive = clamp(1 - q.s / 18, 0, 1), lean = 0.1 + 0.08 * clamp(q.v / 10, 0, 1) + drive * 0.55; P = runPose(q.ph, q.v, lean);
    if (you) { if (y.air > 0) { P = POSE_JUMP; const f = 1 - y.air / JT(g); lift = 4 * (y.low ? 0.18 : 0.62) * f * (1 - f); } else if (y.dip > 0) P = Object.assign({}, P, { lean: 1.0, aL: 1.2, aR: 1.2 }); else if (y.stag > 0) { P = Object.assign({}, P, { lean: 0.75 + 0.2 * Math.sin(V3.t * 30), azL: 1.1, azR: -1.1, roll: 0.25 * Math.sin(V3.t * 17) }); } }
    else if (g.H.length) { for (const h of g.H) { const d = h - q.s; if (d < 2.4 && d > -2.3) { const f = clamp((2.4 - d) / 4.7, 0, 1); P = POSE_JUMP; lift = 4 * 0.6 * f * (1 - f); break; } } }
    else if (u < 1.6 && u > -0.4) P = POSE_DIP; }
  rg.root.position.set(p.x, lift, p.z); rg.root.rotation.y = p.yaw; pose(rg, P, dt, P === POSE_MARKS || P === POSE_SET || P === POSE_STAND || P === POSE_JOY ? 7 : 24); return p; }
function sync(V, g, dt) { const T = V.T, y = g.you, bend = g.D >= 200, D = visD(g); V.t += dt;
  if (V.hl && V.hl.length && (V.hv !== g.H.join(',') || Object.keys(g.knock).length !== V.hKnock)) { V.hv = g.H.join(','); placeHurdles(V, g); }
  g.all.forEach((q, i) => rigPose(g, q, V.rigs[i], dt));
  if (V.ghostRig) { const gr = V.ghostRig, run = g.phase === 'run' && g.gunT != null, gs = run ? ghostS(g.t - g.gunT) : 0, P = trackAt(YOU_LANE, D - gs, bend); gr.root.visible = run && gs < D + 3;
    gr.root.position.set(P.x, 0, P.z); gr.root.rotation.y = P.yaw; gr.ph = (gr.ph || 0) + dt * 2.2; pose(gr, run ? runPose(gr.ph, 9.5, 0.14) : POSE_SET, dt); }
  // the green take-off mark for your next hurdle
  const h = g.H.length && y.hi < g.H.length ? g.H[y.hi] : null;
  if (h != null && y.started && y.fin == null) { const L = Math.max(4, y.v * JT(g)), a = h - L * 0.85, b = h - L * 0.15, p = trackAt(YOU_LANE, D - (a + b) / 2, bend); V.mark.visible = true; V.mark.position.set(p.x, 0.03, p.z); V.mark.rotation.z = p.yaw - Math.PI / 2; V.mark.scale.set(LW * 0.9, b - a, 1);
    const inZ = y.s >= a && y.s <= b; V.mark.material.opacity = inZ ? 0.75 : 0.32 + 0.1 * Math.sin(V.t * 8); V.mark.material.color.setHex(inZ ? 0x80ff90 : 0x40ff70); } else V.mark.visible = false;
  // the crowd: on their feet as the race goes on, wild at the line
  const live = g.phase === 'run' && y.started, near = live ? clamp(1 - (D - y.s) / 40, 0, 1) : 0, ex = (g.phase === 'set' ? 0.05 : 0.25 + 0.75 * near + (y.fin != null ? 0.6 : 0)) * (V.crowdLv || 0.5);
  V.crowd.forEach((c, i) => { c.position.y = Math.max(0, Math.sin(V.t * (7 + i) + i * 1.7)) * 0.12 * ex; });
  // the clock
  V.clockN = (V.clockN || 0) + dt; if (V.clockN > 0.05) { V.clockN = 0; const c = V.clockC.getContext('2d'), tt = g.gunT != null && g.phase === 'run' ? (y.fin != null ? y.fin - g.gunT : g.t - g.gunT) : 0; c.fillStyle = '#05070a'; c.fillRect(0, 0, 256, 96); c.fillStyle = y.fin != null && !g.yard ? '#ffd040' : '#ff5a3a'; c.font = '700 64px "Courier New", monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(tt.toFixed(2), 128, 52); V.clockT.needsUpdate = true; }
  // the camera: low beside you in the blocks; behind you down the track; the side for the photo finish
  const P = trackAt(YOU_LANE, D - y.s, bend), fx = Math.sin(P.yaw), fz = Math.cos(P.yaw), rx = -fz, rz = fx, u = D - y.s, asp = innerWidth / innerHeight, portrait = asp < 0.8;
  let cp, cl;
  if (!y.started && g.phase !== 'run') { const push = g.phase === 'set' ? 1 - clamp(g.ph / 2.5, 0, 1) * 0.4 : 0; cp = [P.x - fx * (4.2 - push) + rx * 1.7, 1.75 - push * 0.2, P.z - fz * (4.2 - push) + rz * 1.7]; cl = [P.x + fx * 5, 0.7, P.z + fz * 5]; }      /* 22 Nov 2026: from behind your shoulder, looking down your lane (it used to sit in front of you and your head filled the screen) */
  else if (y.fin != null) { cp = [P.x + fx * 4.2 + rx * 1.8, 1.6, P.z + fz * 4.2 + rz * 1.8]; cl = [P.x, 1.0, P.z]; }      /* after the line: round in front of you as you slow (it used to end up staring at the stands) */
  else if (!g.yard && y.started && u < 6) { cp = [LS / 2 + (portrait ? 3.5 : 2.5), 1.9, RK - (portrait ? 7.5 : 6)]; cl = [Math.min(LS / 2 + 4, P.x + 0.5), 1.0, rc(4)]; }
  else { const back = portrait ? 5.2 : 4.6, up = portrait ? 2.7 : 2.2, side = portrait ? 0.55 : 0.5; cp = [P.x - fx * back + rx * side, up, P.z - fz * back + rz * side]; cl = [P.x + fx * 8, 0.9, P.z + fz * 8]; }
  if (ui.snap || !ui.cam) { ui.cam = { p: cp.slice(), l: cl.slice() }; ui.snap = false; }
  const kk = Math.min(1, dt * (y.started ? 7 : 3)); for (let i = 0; i < 3; i++) { ui.cam.p[i] += (cp[i] - ui.cam.p[i]) * kk; ui.cam.l[i] += (cl[i] - ui.cam.l[i]) * kk; }
  const cam = W3.cam, sh = FX.shake ? (Math.random() - 0.5) * FX.shake * 0.012 : 0, fov = (portrait ? 64 : 50) + (y.started ? clamp(y.v / 11, 0, 1) * 6 + (y.flow >= 5 ? 3 : 0) : 0);
  cam.fov += (fov - cam.fov) * Math.min(1, dt * 3); cam.aspect = asp; cam.updateProjectionMatrix();
  cam.position.set(ui.cam.p[0] + sh, ui.cam.p[1] + sh, ui.cam.p[2]); cam.lookAt(ui.cam.l[0], ui.cam.l[1], ui.cam.l[2]); cam.updateMatrixWorld(); W3.setFocus(P.x + fx * 4, 0, P.z + fz * 4, 16); }
const SV = window.THREE ? new THREE.Vector3() : null;
function scr(x, y, z) { if (!V3 || V3.none) return { x: W / 2, y: H / 2 }; SV.set(x, y, z); return W3.screen(SV); }
// ---------- what happens, seen and heard ----------
function onEvent(G, e) { const cx = W / 2, padY = H - 96 * k;
  switch (e.k) {
    case 'start': case 'yard': ui.snap = true; ui.banner = null; break;
    case 'set': sfx.set(); ui.banner = { txt: 'SET', t: 0, secs: 9, col: '#fff' }; duck(0.7, 1500); break;
    case 'gun': sfx.gun(); FX.flash = 0.8; FX.shake = 8; ui.banner = { txt: 'GO!', t: 0, secs: 0.6, col: '#ffd040' }; vibe(HAP.sharp); break;
    case 'false': sfx.whistle(); FX.red = 1; vibe(HAP.heavy); ui.banner = { txt: e.out ? 'DISQUALIFIED' : 'FALSE START', t: 0, secs: 1.4, col: '#ff5a4a' };
      say(e.out ? 'Two false starts: out!' : e.why === 'quick' ? `${(e.r || 0).toFixed(2)} s: nobody is that quick!` : 'Wait for the BANG!', cx, H * 0.42, '#ffb4a8', 20); if (!e.out) tip('false', 'One more false start and you are out of the race. Keep still on SET.', 3); break;
    case 'go': sfx.step('perfect', 0, e.side); ui.pads[e.side] = 1; if (e.r != null) say(e.r < 0.15 ? `LIGHTNING START ${e.r.toFixed(3)}` : `REACTION ${e.r.toFixed(3)}`, cx, H * 0.36, e.r < 0.15 ? '#ffd040' : '#fff', e.r < 0.15 ? 24 : 18); if (e.r != null && e.r < 0.15) vibe(HAP.light); break;
    case 'stride': sfx.step(e.q, e.flow, e.side); ui.pads[e.side] = 1; ui.qual = { side: e.side, q: e.q, t: 0 }; if (e.q === 'perfect') { vibe(HAP.tick); if (e.up && e.flow % 5 === 0) { sfx.flow(e.flow); say(`FLOW x${e.flow}!`, cx, H * 0.3, '#7af0ff', 26); } } break;
    case 'cancel': ui.qual = null; ui.pend = null; break;
    case 'stumble': ui.pend = { t: 0.09, fn: () => { sfx.trip(); FX.shake = 12; FX.red = 0.6; vibe(HAP.thud); ui.qual = { side: null, q: 'trip', t: 0 }; say(e.why === 'foot' ? 'WRONG FOOT!' : 'TOO SOON!', cx, H * 0.4, '#ff8a70', 24);
      tip('trip-' + e.why, e.why === 'foot' ? 'Same side twice! Left, then right, then left.' : 'Too soon! Tap as the ring closes on its circle, not before.', 3); } }; break;
    case 'jump': sfx.jump(); break;
    case 'land': sfx.land(); break;
    case 'clear': sfx.clear(); say('CLEAR!', cx, H * 0.38, '#80ff90', 22); burst(cx, padY - 60 * k, '#80ff90', 10); break;
    case 'clip': sfx.clip(); FX.shake = 10; FX.red = 0.4; vibe(HAP.thud); say(e.low ? 'TOO SLOW TO JUMP!' : e.air ? 'CLIPPED IT!' : 'JUMP IT!', cx, H * 0.38, '#ffb070', 22); tip('jump', 'Tap BOTH sides together when the hurdle reaches the green mark.', 3); break;
    case 'rclip': sfx.rclip(); break;
    case 'dip': sfx.dip(); break;
    case 'dipearly': say('DIP AT THE LINE!', cx, H * 0.4, '#ffb070', 20); tip('dip', 'Both thumbs together dips you over the line, but only in the last few metres.', 3); break;
    case 'finish': { sfx.finish(); FX.flash = 0.7; vibe(HAP.best); const y = G.you, close = G.rivals.some(r => (r.fin != null && Math.abs(r.fin - y.fin) < 0.06) || (r.fin == null && G.D - r.s < 0.5)); if (close && !G.yard) { FX.slow = 0.8; say('PHOTO FINISH!', cx, H * 0.3, '#fff', 26); }
      say(e.time.toFixed(2) + ' s', cx, H * 0.4, '#ffd040', 34); if (e.dip) say('DIP!', cx, H * 0.47, '#7af0ff', 20); break; }
    case 'rfin': if (!G.you.fin) sfx.whoosh(); break;
    case 'won': sfx.win(); break;
    case 'lost': sfx.lose(); break;
    case 'lessonnext': hint = null; break;
    case 'lessonok': sfx.coin(e.n); if (e.r != null) say(`CLEAN START ${e.r.toFixed(2)} s`, cx, H * 0.4, '#80ff90', 22); else say(`${e.n} / ${e.need}`, cx, H * 0.44, '#80ff90', 22); break;
    case 'lessonreset': coachMiss(); break;
    case 'lessonmiss': coachMiss(); sfx.no(); break;
    case 'lessondone': sfx.goal(); say('LESSON DONE!', cx, H * 0.4, '#80ff90', 28); burst(cx, H * 0.4, '#80ff90', 24); break;
    case 'wrap': ui.snap = true; break;
  } }
let IG = null; function idleG() { if (!IG || (IG.over && (IG.idle = (IG.idle || 0) + 1 / 60) > 2.5)) { IG = newGame(Math.max(6, store.get('level', 1) | 0), { seed: (Math.random() * 1e6) | 0 }); IG.mem = {}; ui.snap = true; } if (!IG.over) { honest(IG, { react: 0.25, acc: 0.95 }, IG.mem); step(IG, 1 / 60); } IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#2a3a2a'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D stadium.', W / 2, H / 2); if (G) hud(G, now); return; }
  const g = G || idleG(); if (V.built !== g) buildRace(V, g);
  sync(V, g, dt);
  W3.render(dt);
  if (G && !(G.over && !$('ovEnd').classList.contains('hidden'))) hud(G, now);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 0.9 ? 1 : 1 - (t2.t - 0.9) / 0.5; ctx.globalAlpha = Math.max(0, al); const sc = t2.t < 0.12 ? 1.3 - t2.t / 0.12 * 0.3 : 1; ctx.font = `400 ${Math.round(t2.size * k * sc)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(20,20,30,.65)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 20); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 20); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30, hy = H * 0.6;
    ctx.fillStyle = 'rgba(20,24,36,.88)'; rrect(W / 2 - w / 2, hy - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, hy - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,60,30,${FX.red * 0.22})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,250,235,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); }
  if (G && G.you && G.you.flow >= 5 && !G.over) { const a = 0.1 + 0.05 * Math.sin(now * 8), gr = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75); gr.addColorStop(0, 'rgba(80,220,255,0)'); gr.addColorStop(1, `rgba(80,220,255,${a})`); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); } }
// ---------- the 2D layer: the pads, the beat, the clock, the places ----------
const padPos = s => ({ x: s === 'L' ? W * 0.2 : W * 0.8, y: H - 100 * k, r: 50 * k });
const QCOL = { perfect: '#ffd040', good: '#80ff90', early: '#7ad8ff', late: '#ffb070', trip: '#ff5a4a' };
function hud(G, t) { ctx.textBaseline = 'middle'; const y = G.you, D = G.D, run = G.phase === 'run' && G.gunT != null;
  // names over the rivals near you
  if (V3 && !V3.none && !G.yard && run && y.fin == null) { ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.textAlign = 'center';
    for (const r of G.rivals) { const d = r.s - y.s; if (d < -3 || d > 25) continue; const p = trackAt(r.lane, visD(G) - r.s, D >= 200), s = scr(p.x, 2.05, p.z); if (!s.front || s.y < 90 * k || s.y > H - 170 * k) continue;
      ctx.globalAlpha = clamp(1 - d / 25, 0.3, 0.9); ctx.fillStyle = 'rgba(10,14,20,.55)'; const tw = ctx.measureText(r.name).width + 10; rrect(s.x - tw / 2, s.y - 8 * k, tw, 16 * k, 5); ctx.fill(); ctx.fillStyle = hex(r.col); ctx.fillText(r.name, s.x, s.y); }
    ctx.globalAlpha = 1; }
  if (G.lesson) lessonPanel(G);
  else if (!G.yard) {
    // the top: the event, the clock, your place now, the field down the track
    const w = Math.min(300 * k, W - 24), x0 = W / 2 - w / 2, y0 = 56 * k;
    ctx.fillStyle = 'rgba(14,18,28,.6)'; rrect(x0 - 8, y0 - 26 * k, w + 16, 66 * k, 14 * k); ctx.fill();
    ctx.textAlign = 'left'; ctx.fillStyle = '#ffd040'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillText(`${G.cfg.E.name.toUpperCase()} · ${G.cfg.round}`, x0 + 4, y0 - 14 * k);
    ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillText(`TOP ${G.cfg.need} GO THROUGH`, x0 + 4, y0 + 1 * k);
    const tt = run ? (y.fin != null ? y.fin - G.gunT : G.t - G.gunT) : 0; ctx.textAlign = 'right'; ctx.fillStyle = '#fff'; ctx.font = `400 ${Math.round(24 * k)}px ${TF}`; ctx.fillText(tt.toFixed(2), x0 + w - 60 * k, y0 - 6 * k);
    const pl = run && y.started ? (y.place || placeNow(G)) : 0; if (pl) { const ok = pl <= G.cfg.need; ctx.fillStyle = ok ? '#2fbf5a' : '#e0463a'; rrect(x0 + w - 52 * k, y0 - 22 * k, 52 * k, 30 * k, 8 * k); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = `400 ${Math.round(18 * k)}px ${TF}`; ctx.fillText(PLACE_TXT[pl], x0 + w - 26 * k, y0 - 7 * k); }
    // the field
    const ly = y0 + 22 * k; ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3 * k; ctx.beginPath(); ctx.moveTo(x0 + 4, ly); ctx.lineTo(x0 + w - 4, ly); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fillRect(x0 + w - 6, ly - 6 * k, 3, 12 * k);
    for (const h of G.H) { ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(x0 + 4 + (w - 8) * h / D - 1, ly - 3 * k, 2, 6 * k); }
    const X = s => x0 + 4 + (w - 8) * clamp(s / D, 0, 1);
    for (const r of G.rivals) { ctx.fillStyle = hex(r.col); ctx.beginPath(); ctx.arc(X(r.s), ly, 4.5 * k, 0, TAU); ctx.fill(); }
    if (ui.ghost && run) { ctx.strokeStyle = '#bfe8ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X(ghostS(G.t - G.gunT)), ly, 5.5 * k, 0, TAU); ctx.stroke(); }
    ctx.fillStyle = '#fff'; ctx.strokeStyle = hex(mySkin().col); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(X(y.s), ly, 6.5 * k, 0, TAU); ctx.fill(); ctx.stroke();
    // your best (the ghost): how far ahead or behind you are
    if (ui.ghost) { ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.textAlign = 'center'; let txt = `YOUR BEST ${ui.ghost.t.toFixed(2)}`, col = '#bfe8ff';
      if (run && y.started && y.fin == null) { const d = y.s - ghostS(G.t - G.gunT); txt = d >= 0 ? `▲ ${d.toFixed(1)} m AHEAD OF YOUR BEST` : `▼ ${(-d).toFixed(1)} m BEHIND YOUR BEST`; col = d >= 0 ? '#80ff90' : '#ffb4a8'; }
      ctx.fillStyle = col; ctx.fillText(txt, W / 2, ly + 16 * k); } }
  // the starter
  if (!G.lesson || G.yard === 'gun') { let b = ui.banner; if (G.phase === 'marks' && !G.over) b = { txt: 'ON YOUR MARKS', t: 0.5, col: '#fff', small: true };
    if (b) { const sc = b.t < 0.12 ? 1.25 - b.t / 0.12 * 0.25 : 1; ctx.textAlign = 'center'; ctx.font = `400 ${Math.round((b.small ? 30 : b.txt.length > 6 ? 40 : 64) * k * sc)}px ${TF}`; ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(10,12,20,.7)'; ctx.strokeText(b.txt, W / 2, H * 0.4); ctx.fillStyle = b.col || '#fff'; ctx.fillText(b.txt, W / 2, H * 0.4); }
    if (G.lesson && G.phase === 'set' && !G.over) { ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillText('KEEP STILL... GO ON THE BANG', W / 2, H * 0.4 + 44 * k); }
    if (G.fs === 1 && !G.over && !y.started) { ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = '#ffb4a8'; ctx.fillText('⚠ ONE FALSE START: ONE MORE AND YOU ARE OUT', W / 2, H * 0.4 + 64 * k); } }
  // flow and speed
  if (run && y.started) { ctx.textAlign = 'center'; ctx.font = `400 ${Math.round(18 * k)}px ${TF}`; ctx.fillStyle = y.flow >= 5 ? '#7af0ff' : '#fff'; const kmh = Math.round(y.v * 3.6);
    ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(10,12,20,.6)'; ctx.strokeText(`${kmh} km/h`, W / 2, H - 150 * k); ctx.fillText(`${kmh} km/h`, W / 2, H - 150 * k);
    // flow pips
    for (let i = 0; i < 10; i++) { ctx.fillStyle = i < y.flow ? (y.flow >= 5 ? '#7af0ff' : '#ffd040') : 'rgba(255,255,255,.22)'; rrect(W / 2 - 50 * k + i * 10 * k, H - 132 * k, 8 * k, 6 * k, 2); ctx.fill(); }
    ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillText('FLOW', W / 2, H - 120 * k); }
  pads(G, t);
  if ((G && G.lesson) && G.N <= 1 && !G.lesson && run && y.strides < 6 && y.fin == null) { ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 6); ctx.font = `400 ${Math.round(15 * k)}px ${TF}`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText('TAP THE SIDE WHOSE RING IS CLOSING', W / 2, H - 180 * k); ctx.globalAlpha = 1; } }
function pads(G, t) { const y = G.you, run = G.phase === 'run' && y.fin == null && !G.over, h = G.H.length && y.hi < G.H.length ? G.H[y.hi] : null;
  const L = Math.max(4, y.v * JT(G)), inZone = h != null && y.started && y.s >= h - L * 0.85 && y.s <= h - L * 0.15, dipZone = !G.yard && !G.H.length && y.started && G.D - y.s < 3.6 && G.D - y.s > 0 && y.dip <= 0, both = inZone || dipZone;
  for (const s of ['L', 'R']) { const p = padPos(s), fl = ui.pads[s];
    ctx.globalAlpha = 1; ctx.fillStyle = `rgba(255,255,255,${0.1 + fl * 0.35})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + fl * 0.08), 0, TAU); ctx.fill();
    ctx.strokeStyle = both ? '#60ff80' : 'rgba(255,255,255,.55)'; ctx.lineWidth = (both ? 5 : 3) * k; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = `400 ${Math.round(15 * k)}px ${TF}`; ctx.textAlign = 'center'; ctx.fillText(s === 'L' ? 'LEFT' : 'RIGHT', p.x, p.y);
    // the beat: a ring closing on the pad that is due
    if (run && y.started && y.due != null && y.stag <= 0 && y.air <= 0 && (y.side == null || y.side === s)) { const per = T_OF(y.v), left = y.due - G.t, f = clamp(left / per, -0.3, 1), on = Math.abs(left) <= G.cfg.perfW;
      if (f > -0.3) { ctx.strokeStyle = on ? '#ffd040' : left < 0 ? '#ffb070' : '#ffffff'; ctx.lineWidth = (on ? 6 : 3.5) * k; ctx.globalAlpha = left < -0.12 ? 0.5 : 1; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + 1.1 * Math.max(0, f)), 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; }
      if ((G && G.lesson) && left < -0.08) { ctx.fillStyle = '#ffb070'; ctx.font = `400 ${Math.round(14 * k)}px ${TF}`; ctx.fillText('TAP!', p.x, p.y - p.r - 14 * k); } }
    if (run && !y.started && G.phase === 'run' && !G.yard) { ctx.strokeStyle = '#ffd040'; ctx.lineWidth = 5 * k; ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 20); ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 1.15, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; }
    if (y.stag > 0) { ctx.fillStyle = 'rgba(255,80,60,.35)'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } }
  if (both && run) { ctx.textAlign = 'center'; ctx.font = `400 ${Math.round(22 * k)}px ${TF}`; ctx.globalAlpha = 0.75 + 0.25 * Math.sin(t * 18); ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(10,30,10,.7)'; const tx = inZone ? 'BOTH: JUMP!' : 'BOTH: DIP!'; ctx.strokeText(tx, W / 2, H - 100 * k); ctx.fillStyle = '#80ff90'; ctx.fillText(tx, W / 2, H - 100 * k); ctx.globalAlpha = 1; }
  if (ui.qual) { const q = ui.qual, p = q.side ? padPos(q.side) : { x: W / 2, y: H - 100 * k, r: 50 * k }, txt = q.q === 'trip' ? 'TRIP!' : q.q.toUpperCase(); ctx.globalAlpha = Math.max(0, 1 - q.t / 0.6); ctx.font = `400 ${Math.round((q.q === 'perfect' ? 22 : 18) * k)}px ${TF}`; ctx.textAlign = 'center'; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(10,12,20,.6)';
    const ty = p.y - p.r - 30 * k - q.t * 30 * k; ctx.strokeText(txt, p.x, ty); ctx.fillStyle = QCOL[q.q] || '#fff'; ctx.fillText(txt, p.x, ty); ctx.globalAlpha = 1; } }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { coachPanel(G); }
