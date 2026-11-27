// ===================== THE VIEW: Rock Climb in 3D (three.js; sky, light, land from tools/world3d.js) =====================
// From behind the climber and a little to the side: the rock face (leaning out where it overhangs), its holds (each kind its own
// shape: jugs, ledges, thin edges, crimps, pockets, round slopers, upright side-pulls, small grey footholds), the bolts and the
// orange rope, the climber on four points, and the land below opening up as you climb. 2D on top: the grip bar, the height,
// the falls left, the holds you can reach while you drag (green), the jump bar, the lesson card.
const FX = { shake: 0, stop: 0, flash: 0, red: 0, slow: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { snap: true, cam: null, banner: null, drag: null, look: null, lookT: 0, lp: null };
function say(txt, x, y, col = '#fff', size = 22) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS || !(G && G.lesson)) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 140) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60 * k, t: 0, life: 0.5 + Math.random() * 0.5, col, r: (2 + Math.random() * 3) * k }); } }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2.5); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.6) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (ui.banner) { ui.banner.t += dt; if (ui.banner.t > (ui.banner.secs || 2.4)) ui.banner = null; }
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; } }
function mySkin() { if (typeof HEADLESS !== 'undefined' && HEADLESS) return SKINS[0]; const id = store.get('skin', 'red'); return SKINS.find(q => q.id === id) || SKINS[0]; }
// the face: how far it leans out at each height (an overhang comes towards you), and the little bumps of the rock
function wallZ(G, y) { const R = G.route; if (!R.zs) { R.zs = []; let z = 0; for (let i = 0; i <= (R.H + 12) * 10; i++) { R.zs.push(z); z -= Math.tan(R.leanAt(i / 10) * Math.PI / 180) * 0.1; } } return R.zs[clamp(Math.round(y * 10), 0, R.zs.length - 1)]; }
const bump = (x, y) => Math.sin(x * 1.7 + y * 0.6) * 0.06 + Math.sin(x * 4.1 - y * 3.3) * 0.03 + Math.sin(y * 1.1) * 0.08;
const ROCK = [[0.62, 0.55, 0.47], [0.45, 0.43, 0.4], [0.5, 0.45, 0.4], [0.56, 0.56, 0.6]];
// ---------- the world ----------
function buildWorld() {
  if (V3) return V3; const T = window.THREE; if (!T || !W3 || !W3.init({ canvas: $('gl'), fov: 58, far: 2000, near: 0.05 })) { V3 = { none: true }; return V3; }
  V3 = { T, S: W3.scene, t: 0, for: null }; const V = V3, M = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.85 }, o)); V.M = M;
  W3.scene.children.forEach(o => { if (o.isLineSegments) o.visible = false; });
  V.sphG = new T.SphereGeometry(1, 12, 8); V.cylG = new T.CylinderGeometry(1, 1, 1, 8); V.boxG = new T.BoxGeometry(1, 1, 1); V.grain = W3.grainTex(256, 7, 200, 60, 1.5); V.grain.repeat.set(3, 6);
  // holds: one drawing per kind, repeated (instanced)
  const hm = c => M(c, { roughness: 0.7 }), G0 = {
    jug: [new T.SphereGeometry(1, 12, 6, 0, TAU, 0, Math.PI / 2).rotateX(-Math.PI / 2).scale(0.15, 0.1, 0.12), hm(0xe8dcc6)],
    ledge: [new T.BoxGeometry(1, 0.09, 0.24), hm(0xd8ccb4)], top: [new T.BoxGeometry(1, 0.12, 0.3), hm(0xd8ccb4)],
    edge: [new T.BoxGeometry(0.24, 0.045, 0.09), hm(0xe6dccb)], crimp: [new T.BoxGeometry(0.15, 0.028, 0.05), hm(0xf0e8da)],
    pocket: [new T.TorusGeometry(0.06, 0.03, 6, 12), hm(0x3a322a)], sloper: [new T.SphereGeometry(1, 14, 8, 0, TAU, 0, Math.PI / 2).rotateX(-Math.PI / 2).scale(0.17, 0.15, 0.07), hm(0xcfc4b0)],
    side: [new T.BoxGeometry(0.05, 0.26, 0.1), hm(0xe6dccb)], chip: [new T.BoxGeometry(0.1, 0.035, 0.06), hm(0x8a8276)] };
  V.holdG = G0; V.inst = {};
  // bolts (a hanger and a quickdraw), the rope
  V.boltM = M(0xb8bcc4, { metalness: 0.8, roughness: 0.3 }); V.drawM = M(0x2a8ad8, { roughness: 0.5 }); V.bolts = [];
  V.rope = new T.Line(new T.BufferGeometry().setFromPoints(new Array(24).fill(0).map(() => new T.Vector3())), new T.LineBasicMaterial({ color: 0xff7a1a })); V.rope.frustumCulled = false; V.S.add(V.rope);
  V.me = makeClimber(V); V.S.add(V.me.g);
  V.ray = new T.Raycaster();
  W3.setQuality(stepN); return V; }
function makeClimber(V) { const T = V.T, g = new T.Group(), sk = V.M(0xc68642, { roughness: 0.6 }), top = V.M(mySkin().top), pants = V.M(0x2a3448), shoe = V.M(0x1a1a1e), harn = V.M(0xf2c230);
  const torso = new T.Mesh(new T.CapsuleGeometry(0.15, 0.32, 3, 8), top); g.add(torso); const hips = new T.Mesh(new T.CapsuleGeometry(0.14, 0.08, 3, 8), pants); g.add(hips);
  const belt = new T.Mesh(new T.TorusGeometry(0.15, 0.025, 6, 16), harn); belt.rotation.x = Math.PI / 2; g.add(belt);
  const head = new T.Mesh(V.sphG, sk); head.scale.setScalar(0.11); g.add(head); const helm = new T.Mesh(new T.SphereGeometry(1, 12, 8, 0, TAU, 0, Math.PI / 2), V.M(0xf0f0f0, { roughness: 0.4 })); helm.scale.setScalar(0.125); g.add(helm);
  const seg = (m, r) => { const s = new T.Mesh(new T.CapsuleGeometry(r, 1, 2, 6), m); g.add(s); return s; };
  const limbs = {}; for (const l of LIMBS) { const hand = isHand(l); limbs[l] = { a: seg(hand ? top : pants, hand ? 0.05 : 0.065), b: seg(hand ? sk : pants, hand ? 0.042 : 0.055), end: new T.Mesh(hand ? V.sphG : V.boxG, hand ? sk : shoe) };
    if (hand) limbs[l].end.scale.setScalar(0.055); else limbs[l].end.scale.set(0.1, 0.07, 0.24); g.add(limbs[l].end); }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return { g, torso, hips, belt, head, helm, limbs, top }; }
// the land below: different for each place (a sunny crag, a forest, the sea, the mountains)
function buildPlace(V, G) { const T = V.T, P = G.cfg.place, R = rng(G.seed + 5);
  if (V.land) V.land.forEach(o => { V.S.remove(o); }); V.land = [];
  // the ground at the foot of the face is flat; the land rolls away from it (a valley beyond the cliff, the sea, peaks)
  const hgt = (x, z) => { const r = Math.hypot(x * 0.8, z + 4), near = clamp((r - 14) / 40, 0, 1); let h = P === 2 ? -1.6 - near * 1.5 : (Math.sin(x * 0.045) * 3 + Math.sin(z * 0.035 + x * 0.02) * 4 - 3) * near;
      if (z > 2) h -= Math.min(30, (z - 2) * 0.35) * (P === 2 ? 0.2 : 1);      // behind the cliff the land falls away
      if (P === 3) h += Math.max(0, r - 160) * 0.45 * (0.6 + 0.4 * Math.sin(x * 0.02 + z * 0.01)); else if (P === 1) h += Math.max(0, r - 180) * 0.15; if (P === 2 && r < 12) h = Math.max(h, -0.05); return h; };
  const col = (x, z, h, sl) => { if (P === 3 && h > 25) return [0.92, 0.94, 0.97]; if (sl > 0.35 || (P === 2 && z > -12)) return [0.45, 0.42, 0.38]; return P === 2 ? [0.55, 0.6, 0.38] : P === 3 ? [0.42, 0.5, 0.33] : [0.36 + 0.05 * Math.sin(x), 0.48, 0.24]; };
  V.land.push(W3.terrain({ size: 1000, seg: 120, z: 0, height: hgt, colour: col }));
  if (P === 2) V.land.push(W3.water({ size: 2400, color: 0x0c5a6a, distort: 1.5, ripple: 2.6, y: -1.2 }));
  const trees = []; const n = P === 1 ? 260 : P === 2 ? 30 : 90;
  for (let i = 0; i < n; i++) { const a = R() * TAU, r = 16 + R() * (P === 1 ? 140 : 100), x = Math.cos(a) * r, z = Math.sin(a) * r - 4; if (P === 2 && hgt(x, z) < -1) continue; if (Math.abs(x) < 12 && z > -10 && z < 3) continue; trees.push({ x, y: hgt(x, z) - 0.2, z, s: 0.7 + R() * 0.9, rot: R() * 6, hue: R(), shade: R() }); }
  for (let i = 0; i < (P === 1 ? 40 : 14); i++) { const x = (R() < 0.5 ? -1 : 1) * (8 + R() * 12), y = R() * (G.route.H + 6), z = wallZ(G, y) + 1 + R() * 3; trees.push({ x, y: y - 1, z, s: 0.4 + R() * 0.5, rot: R() * 6, hue: R(), shade: R() }); }      // pines clinging to the cliff beside the route
  if (trees.length) V.land.push(W3.pines(trees, { shadow: false }));
}
function buildRoute(V, G) { const T = V.T, R = G.route, P = G.cfg.place;
  if (V.wall) { V.S.remove(V.wall); V.wall.geometry.dispose(); } for (const k2 in V.inst) V.S.remove(V.inst[k2]); V.inst = {}; V.bolts.forEach(b => V.S.remove(b)); V.bolts = [];
  // the face: wide enough to fill the view, curving back at its sides; rock colour by place, lighter streaks and chalk marks
  const Wd = 18, Hh = R.H + 14, g = new T.PlaneGeometry(Wd, Hh, 88, Math.round(Hh * 4)), p = g.attributes.position, c = new Float32Array(p.count * 3), base = ROCK[P];
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i) + Hh / 2 - 2, side = Math.max(0, Math.abs(x) - 5.2); p.setXYZ(i, x, y, wallZ(G, Math.max(0, y)) + bump(x, y) + side * side * 0.45 + (y > R.H + 0.1 ? (y - R.H) * 1.4 : 0));
    const n = 0.88 + 0.12 * Math.sin(x * 2.3 + y * 0.7) * Math.sin(y * 1.9 - x), st = 0.06 * Math.sin(x * 0.9 + y * 0.15); c.set([base[0] * n + st, base[1] * n + st, base[2] * n + st], i * 3); }
  g.computeVertexNormals(); g.setAttribute('color', new T.BufferAttribute(c, 3));
  V.wall = new T.Mesh(g, new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, map: V.grain, side: T.DoubleSide })); V.wall.receiveShadow = true; V.S.add(V.wall);
  const byT = {}; for (const h of R.holds) { if (h.ty === 'ground') continue; (byT[h.ty] = byT[h.ty] || []).push(h); }
  const d = new T.Object3D();
  for (const ty in byT) { const [geo, mat] = V.holdG[ty], hs = byT[ty], m = new T.InstancedMesh(geo, mat, hs.length);
    hs.forEach((h, j) => { const z = wallZ(G, h.y) + bump(h.x, h.y) - 0.03; d.position.set(h.x, h.y - (ty === 'jug' || ty === 'ledge' || ty === 'top' || ty === 'edge' || ty === 'crimp' || ty === 'chip' ? 0.03 : 0), z); d.rotation.set(0, 0, ty === 'side' ? h.d * 0.25 : (h.i % 5 - 2) * 0.04); d.scale.set(ty === 'ledge' || ty === 'top' ? (h.w || 1) : 1, 1, 1); d.updateMatrix(); m.setMatrixAt(j, d.matrix); });
    m.castShadow = true; m.receiveShadow = true; V.S.add(m); V.inst[ty] = m; }
  for (const b of R.bolts) { const gB = new T.Group(), hg = new T.Mesh(V.cylG, V.boltM); hg.scale.set(0.035, 0.02, 0.035); hg.rotation.x = Math.PI / 2; gB.add(hg); const qd = new T.Mesh(V.boxG, V.drawM); qd.scale.set(0.025, 0.14, 0.02); qd.position.set(0, -0.08, -0.03); gB.add(qd); qd.visible = false; gB.userData.qd = qd;
    gB.position.set(b.x, b.y, wallZ(G, b.y) + bump(b.x, b.y) - 0.03); V.S.add(gB); V.bolts.push(gB); }
}
// a limb from its joint to its hold, bending at the elbow or knee (out to the side, and away from the rock)
const V3v = (x, y, z) => new THREE.Vector3(x, y, z);
function segTo(T, m, a, b) { const d = b.clone().sub(a), L = d.length(); m.position.copy(a).add(b).multiplyScalar(0.5); m.scale.set(1, Math.max(0.01, L - 0.02), 1); if (L > 1e-4) m.quaternion.setFromUnitVectors(V3v(0, 1, 0), d.normalize()); }
function limb(T, L, a, e, len, pole) { const d = a.distanceTo(e), h = Math.sqrt(Math.max(0, (len / 2) ** 2 - (Math.min(d, len) / 2) ** 2)), mid = a.clone().add(e).multiplyScalar(0.5), ax = e.clone().sub(a).normalize(), p = pole.clone().sub(ax.clone().multiplyScalar(pole.dot(ax))).normalize(), j = mid.add(p.multiplyScalar(h));
  segTo(T, L.a, a, j); segTo(T, L.b, j, e); L.end.position.copy(e); }
// ---------- each frame ----------
function sync(V, G, dt) { V.t += dt; const T = V.T, R = G.route;
  if (V.for !== R) { V.for = R; W3.setSky(pick(rng(G.seed + 2), PLACES[G.cfg.place].skies)); buildPlace(V, G); buildRoute(V, G); V.me.top.color.setHex(mySkin().top); ui.lp = null; ui.snap = true; }
  R.bolts.forEach((b, i) => { V.bolts[i].userData.qd.visible = b.clip; });
  // where each limb is going: its hold (or the finger, while you drag it); the body follows
  let bx = G.body.x, by = G.body.y;
  if (G.phase === 'fall') { const b = R.bolts.filter(q => q.clip).sort((a, c) => c.y - a.y)[0], cy = b ? b.y - 1.4 : Math.max(0.6, G.body.y - 1.5), tt = 1.8 - G.fallT, tf = Math.sqrt(2 * Math.max(0, G.body.y - cy) / 9.8); by = tt < tf ? G.body.y - 4.9 * tt * tt : cy - 0.35 * Math.sin((tt - tf) * 9) * Math.exp(-(tt - tf) * 3); bx = b ? b.x : bx; }      // 23 Nov 2026: a real fall (faster and faster) until the rope comes tight at the last clip, then the stretch and bounce
  const hs = R.holds, tgt = {}, sk = G.phase === 'slip' || G.st < 0.22 ? (G.phase === 'slip' ? 0.035 : 0.015) : 0;
  for (const l of LIMBS) { const i = G.S[l]; let p = i >= 0 ? { x: hs[i].x, y: hs[i].y + (isHand(l) ? 0.02 : 0.03) } : { x: G.body.x + (l[0] === 'l' ? -0.25 : 0.25), y: G.body.y - (isHand(l) ? -0.2 : 0.9) };
    if (ui.drag && ui.drag.l === l && ui.drag.w) p = ui.drag.w;
    // FALLING (27 Nov 2026, his final fix: "it currently looks like their hand being overstretched let them actually fall"): the hands and feet
    // let go and go WITH the falling body (they were aimed at where the body had been, so the arms stretched up to the holds). Arms fly up
    // loose above the shoulders, legs hang and kick, all flailing a little, never longer than the limb itself.
    if (G.phase === 'fall') { const tt = 1.8 - G.fallT, s2 = l[0] === 'l' ? -1 : 1, fl = Math.sin(tt * 13 + (l === 'lh' ? 0 : l === 'rh' ? 2 : l === 'lf' ? 4 : 1)) * 0.12;
      p = isHand(l) ? { x: bx + s2 * (0.5 + fl), y: by + SHY + 0.38 + fl * 0.6 } : { x: bx + s2 * (0.22 + fl * 0.6), y: by - 0.82 + Math.abs(fl) }; }
    if (sk && isHand(l)) p = { x: p.x + (Math.random() - 0.5) * sk, y: p.y - sk * 0.5 + (Math.random() - 0.5) * sk };
    tgt[l] = p; }
  if (G.dyno) { const p = dynoP(G); by -= Math.min(1, p) * 0.25; }
  if (!ui.lp || ui.snap) ui.lp = { body: { x: bx, y: by }, ...Object.fromEntries(LIMBS.map(l => [l, Object.assign({}, tgt[l])])) };
  const kq = Math.min(1, dt * (G.phase === 'fall' ? 14 : 9));
  for (const l of LIMBS) { const q = ui.lp[l], kl = Math.min(1, dt * (G.phase === 'fall' ? 22 : 14)); q.x += (tgt[l].x - q.x) * kl; q.y += (tgt[l].y - q.y) * kl; }
  ui.lp.body.x += (bx - ui.lp.body.x) * kq; ui.lp.body.y += (by - ui.lp.body.y) * kq;
  const B = ui.lp.body, zb = wallZ(G, B.y) - 0.34 - (G.phase === 'fall' ? 0.5 : 0), me = V.me, strained = G.body.strain > 0.95;
  const hip = V3v(B.x, B.y, zb), chest = V3v(B.x, B.y + SHY * 0.55, zb - 0.02); me.hips.position.copy(hip); me.belt.position.copy(hip).add(V3v(0, 0.03, 0)); segTo(T, me.torso, hip, V3v(B.x, B.y + SHY + 0.02, zb + 0.02)); me.torso.scale.y = 1;
  me.head.position.set(B.x, B.y + SHY + 0.2, zb - 0.02); me.helm.position.set(B.x, B.y + SHY + 0.22, zb - 0.02);
  for (const l of LIMBS) { const hand = isHand(l), s = l[0] === 'l' ? -1 : 1, j = hand ? V3v(B.x + s * SHX, B.y + SHY, zb + 0.02) : V3v(B.x + s * HPX, B.y, zb), q = ui.lp[l], e = V3v(q.x, q.y, wallZ(G, q.y) + bump(q.x, q.y) - (hand ? 0.08 : 0.1));
    const ln = (hand ? ARM : LEG) * (strained ? 1.0 : 1.04); if (G.phase === 'fall') { e.z = zb - 0.1 + (hand ? -0.15 : 0.05); const d = e.clone().sub(j), dl = d.length(); if (dl > ln * 0.97) e.copy(j).add(d.multiplyScalar(ln * 0.97 / dl)); }
    limb(T, me.limbs[l], j, e, ln, hand ? V3v(s * 0.5, -1, -0.5) : V3v(s * 0.8, 0.2, -1)); if (!hand) me.limbs[l].end.rotation.set(0, 0, 0); }
  // the rope: from the ground, up through every clipped bolt, to the harness (slack below)
  { const pts = [V3v(-1.2, 0.05, -1.2)]; for (const b of R.bolts.filter(q => q.clip).sort((a, c) => a.y - c.y)) pts.push(V3v(b.x, b.y - 0.1, wallZ(G, b.y) - 0.08)); pts.push(hip.clone().add(V3v(0, 0.02, -0.1)));
    const pos = V.rope.geometry.attributes.position; for (let i = 0; i < 24; i++) { const p = pts[Math.min(i, pts.length - 1)]; pos.setXYZ(i, p.x, p.y, p.z); } pos.needsUpdate = true; V.rope.geometry.computeBoundingSphere(); }
  // the camera: behind you and a little to the side, rising as you climb; drag the empty rock to look about; 👁 runs up the route
  const lk = ui.look || { x: 0, y: 0 }; let cx = B.x + 0.3 + lk.x, cy = B.y + 0.9 + lk.y, back = 7.2;
  if (G.look) { const u = G.look.t / G.look.T, s = Math.sin(Math.PI * Math.min(1, u)); cy = lerp(B.y + 0.9, R.H - 2, Math.min(1, u * 2) * (u < 0.75 ? 1 : (1 - u) * 4)); cx = lerp(cx, 0, s); back = 7.2 + s * 12; }
  if (G.over === 'won' || G.phase === 'top') { cy = R.H + 1.5; back = 9; }
  const pos = [cx + 2.6, cy + 1.6 + (G.phase === 'top' ? 2 : 0), wallZ(G, cy) - back], lookAt = [cx - 0.4, cy, wallZ(G, cy)];
  if (!ui.cam || ui.snap) { ui.cam = { p: pos.slice(), l: lookAt.slice() }; ui.snap = false; }
  const kc = Math.min(1, dt * (G.look ? 5 : 2.6)); for (let i = 0; i < 3; i++) { ui.cam.p[i] += (pos[i] - ui.cam.p[i]) * kc; ui.cam.l[i] += (lookAt[i] - ui.cam.l[i]) * kc; }
  const sh = FX.shake > 0 ? (Math.random() - 0.5) * FX.shake * 0.01 : 0, cam = W3.cam; cam.position.set(ui.cam.p[0] + sh, ui.cam.p[1] + sh, ui.cam.p[2]); cam.lookAt(ui.cam.l[0], ui.cam.l[1], ui.cam.l[2]); cam.updateMatrixWorld();
  W3.setFocus(B.x, B.y, wallZ(G, B.y), 14); }
// where things are on the screen, and where a finger is on the rock (in the rules' metres)
function scrOf(G, x, y) { const V = V3; if (!V || V.none) return null; return W3.screen(new V.T.Vector3(x, y, wallZ(G, y) + bump(x, y) - 0.06)); }
function wallAt(G, px, py) { const V = V3; if (!V || V.none) return null; const T = V.T, ndc = new T.Vector2(px / W * 2 - 1, -(py / H) * 2 + 1); V.ray.setFromCamera(ndc, W3.cam);
  const zy = wallZ(G, G.body.y + 0.6), pl = new T.Plane(new T.Vector3(0, 0, -1), zy - 0.05), p = new T.Vector3(); if (!V.ray.ray.intersectPlane(pl, p)) return null;
  for (let it = 0; it < 3; it++) { const z = wallZ(G, p.y) - 0.05, pl2 = new T.Plane(new T.Vector3(0, 0, -1), z); if (!V.ray.ray.intersectPlane(pl2, p)) break; }      // follow the lean of the rock
  return { x: p.x, y: p.y }; }
// ---------- events ----------
function onEvent(G, e) { const hs = G.route.holds, at = i => { const h = hs[i]; return (h && scrOf(G, h.x, h.y)) || { x: W / 2, y: H / 2 }; };
  switch (e.k) {
    case 'setup': ui.snap = true; ui.lp = null; ui.look = null; if (!G.lesson) { ui.banner = { txt: PLACES[G.cfg.place].name.toUpperCase(), sub: `${G.route.H} metres · ${G.cfg.feet === 'auto' ? 'your feet follow by themselves' : 'your feet: drag them too'}`, t: 0, secs: 2.6 }; tip('start', 'Drag a hand up onto a hold that lights up. Tap 👁 to see the whole route.', 4); if (G.cfg.feet === 'you') tip('feet', 'From here your feet are yours: drag a foot onto a bigger hold to take weight off your arms. (Auto feet: on the home card.)', 5); if (G.cfg.dyno) tip('dyno', 'Some holds glow orange: too far to reach. Drag a hand there, HOLD to load up, let go in the green to jump.', 5); } break;
    case 'grab': { const h = hs[e.i]; sfx.grab(h.ty, isHand(e.l)); vibe(isHand(e.l) ? HAP.tick : HAP.light); if (isHand(e.l) && HT[h.ty].need === 'below') tip('sloper', 'A sloper (round dome) only holds when it is below your shoulders: step your feet up first.', 4); if (h.ty === 'side') tip('side', 'A side-pull holds when your body is on the side it faces.', 3.6); if (h.ty === 'ledge' && isHand(e.l)) tip('ledge', 'A big ledge: both hands on it with good feet and your grip fills up.', 3.6);
      const p = at(e.i); if (h.ty === 'ledge' || h.ty === 'jug') burst(p.x, p.y, 'rgba(255,255,255,.8)', 5, 50); } break;
    case 'miss': sfx.scrape(); vibe(HAP.tick); { const p = scrOf(G, e.x, e.y) || { x: W / 2, y: H / 2 }; say(e.n > 1 ? 'NOTHING THERE (TIRING)' : 'NOTHING THERE', p.x, p.y, '#ffd0a0', 15); } tip('lit', 'Let go near a hold that is lit up. A slap at bare rock tires you, more each time.', 3.6); break;
    case 'needjump': sfx.no(); { const p = at(e.i); say((G && G.lesson) ? 'TOO FAR: HOLD TO JUMP' : 'TOO FAR', p.x, p.y - 20 * k, '#ffb46a', 15); } break;
    case 'load': sfx.load(); break;
    case 'caught': sfx.caught(); vibe(HAP.best); FX.flash = 0.3; FX.shake = 6; { const p = at(e.i); say('CAUGHT IT!', p.x, p.y - 30 * k, '#9be3b5', 24); burst(p.x, p.y, '#ffffff', 14, 120); } break;
    case 'jumpmiss': say(e.early ? 'TOO SOON' : 'TOO LATE', W / 2, H * 0.4, '#ffd0a0', 22); break;
    case 'clip': sfx.clip(); vibe(HAP.light); { const p = scrOf(G, e.x, e.y) || { x: W / 2, y: H / 2 }; say('CLIPPED', p.x, p.y - 16 * k, '#ffcf6a', 16); } tip('clip', 'Clipped in. If you slip, the rope catches you here.', 3); break;
    case 'slip': sfx.slip(); FX.red = 0.4; ui.banner = { txt: 'SLIPPING!', sub: 'Get both hands on big holds, or feet on better ones', t: 0, secs: 1.4, small: true }; break;
    case 'saved': sfx.saved(); say('HELD ON!', W / 2, H * 0.4, '#9be3b5', 22); break;
    case 'fall': sfx.fall(); FX.shake = 10; ui.snap = false; if (!G.lesson) ui.banner = { txt: 'FALL!', sub: G.falls < G.cfg.lives ? `The rope caught you. ${G.cfg.lives - G.falls} ${G.cfg.lives - G.falls === 1 ? 'fall' : 'falls'} left. Your grip is back.` : 'That was your last one', t: 0, secs: 2.2, small: true }; break;
    case 'back': sfx.click(); ui.lp = null; ui.backAt = performance.now(); break;
    case 'look': sfx.click(); break;
    case 'top': sfx.win(); FX.flash = 0.5; vibe(HAP.best); ui.banner = { txt: 'TOP!', sub: `${G.route.H} metres`, t: 0, secs: 2 }; { const p = scrOf(G, G.body.x, G.body.y + 1) || { x: W / 2, y: H * 0.3 }; burst(p.x, p.y, '#ffcf3a', 30, 220); } break;
    case 'gold': break;
    case 'lessonnext': if (e.first) hint = null; say('FIRST, A LESSON', W / 2, H * 0.36, '#ffd36a', 24); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, W / 2, H * 0.36, '#9be3b5', 24); sfx.coin(e.n); break;
    case 'lessonmiss': coachMiss(); say('AGAIN: THE GOLD ONE', W / 2, H * 0.4, '#ffd0a0', 18); break;
    case 'lessondone': say('NOW THE REAL CLIMB!', W / 2, H * 0.36, '#ffd36a', 24); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.star(3); break;
    case 'lost': sfx.lose(); break;      // (P11: never vibrate on failure)
  } }
// ---------- the picture ----------
let IG = null, IM = {}; function idleG() { if (!IG || IG.over || IG.t > 60) { IG = newGame(2 + ((Math.random() * 8) | 0), { seed: (Math.random() * 1e6) | 0, feet: 'auto' }); IM = {}; ui.snap = true; } honest(IG, { react: 0.5, acc: 0.95 }, IM); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#10141f'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D rock.', W / 2, H / 2); if (G) hud(G, now); return; }
  const g = G || idleG(); sync(V, g, dt || 1 / 60); W3.render(dt || 1 / 60);
  if (G) { const fa = G.phase === 'fall' ? clamp(1 - (G.fallT - 0.1) / 0.45, 0, 1) : clamp(1 - (performance.now() - (ui.backAt || -1e9)) / 450, 0, 1); if (fa > 0.01) { ctx.fillStyle = `rgba(10,12,16,${fa})`; ctx.fillRect(0, 0, W, H); } }      // the fall and the catch are seen, then the view goes dark and opens with you back on your last holds
  if (FX.red > 0) { ctx.fillStyle = `rgba(200,40,30,${FX.red * 0.18})`; ctx.fillRect(0, 0, W, H); }
  if (G && !(G.over && !$('ovEnd').classList.contains('hidden'))) hud(G, now);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 1.1 ? 1 : 1 - (t2.t - 1.1) / 0.5; ctx.globalAlpha = Math.max(0, al); ctx.font = `400 ${Math.round(t2.size * k)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(10,12,20,.7)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 18); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 18); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30, hy = H - 70 * k - h / 2;
    ctx.fillStyle = 'rgba(12,14,22,.92)'; rrect(W / 2 - w / 2, hy - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, hy - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,250,230,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); } }
function layout(G) { return { eye: { x: W - 36 * k, y: 92 * k, r: 24 * k } }; }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function ring(p, r, col, lw = 3, dash) { ctx.beginPath(); ctx.setLineDash(dash || []); ctx.arc(p.x, p.y, r, 0, TAU); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke(); ctx.setLineDash([]); }
function hud(G, now) { const c = G.cfg, hs = G.route.holds, L = layout(G);
  ctx.textBaseline = 'middle';
  // the holds you can reach while you drag; the gold one in a lesson; the jump holds always glow orange
  if (G.gold >= 0 && G.lesson) { const p = scrOf(G, hs[G.gold].x, hs[G.gold].y); if (p) { ring(p, (18 + Math.sin(now * 6) * 3) * k, '#ffcf3a', 4); ring(p, 26 * k, 'rgba(255,207,58,.35)', 2); } }
  for (const h of hs) if (h.dyno) { const p = scrOf(G, h.x, h.y); if (p && p.front) ring(p, 16 * k, 'rgba(255,150,60,.75)', 2, [5, 4]); }
  const D = ui.drag;
  if (D && D.ts) { for (const t of D.ts) { const h = hs[t.i], p = scrOf(G, h.x, h.y); if (!p) continue; const sel = D.near === t.i; ring(p, (sel ? 17 : 12) * k, t.dyno ? '#ff9a3a' : sel ? '#ffffff' : 'rgba(120,240,150,.9)', sel ? 4 : 2.5, t.dyno ? [4, 4] : null); }
    // the reach: how far this limb goes from where you are (an ellipse on the rock)
    const j = sh(G.body, D.l), M = (isHand(D.l) ? ARM : LEG) + 0.05; ctx.beginPath(); for (let a = 0; a <= 24; a++) { const q = scrOf(G, j.x + Math.cos(a / 24 * TAU) * M, j.y + Math.sin(a / 24 * TAU) * M); if (!q) continue; a ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); } ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.setLineDash([6, 6]); ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
    const e = ui.lp && ui.lp[D.l]; if (e) { const p = scrOf(G, e.x, e.y); if (p) ring(p, 20 * k, 'rgba(255,255,255,.9)', 3); } }
  // the jump: a bar that fills while you hold; let go in the green
  if (G.dyno) { const p = scrOf(G, G.body.x + 0.6, G.body.y + 0.8) || { x: W * 0.7, y: H * 0.45 }, bh = 120 * k, bw = 16 * k, x0 = Math.min(W - 40 * k, p.x + 30 * k), y0 = p.y - bh / 2, u = Math.min(1, dynoP(G));
    ctx.fillStyle = 'rgba(10,12,20,.8)'; rrect(x0 - 4, y0 - 4, bw + 8, bh + 8, 8); ctx.fill(); ctx.fillStyle = 'rgba(120,240,150,.85)'; ctx.fillRect(x0, y0 + bh * (1 - G.dyno.g0 - G.dyno.gw), bw, bh * G.dyno.gw);
    ctx.fillStyle = '#fff'; ctx.fillRect(x0 - 3, y0 + bh * (1 - u) - 2, bw + 6, 4); ctx.font = `400 ${Math.round(13 * k)}px ${TF}`; ctx.textAlign = 'center'; if (G && G.lesson) ctx.fillText('LET GO IN THE GREEN', x0 + bw / 2, y0 - 16 * k); }
  if (G.lesson) lessonPanel(G);
  else { // grip, height, falls left
    const x0 = 14, w = Math.min(W * 0.36, 180 * k), y0 = 12 * k, s = clamp(G.st, 0, 1), col = s > 0.5 ? '#7ee08f' : s > 0.25 ? '#ffd23a' : '#ff6a4a', pulse = s < 0.25 ? 0.6 + 0.4 * Math.sin(now * 12) : 1;
    ctx.fillStyle = 'rgba(10,12,20,.6)'; rrect(x0 - 4, y0 - 4, w + 8, 22 * k + 8, 10); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.12)'; rrect(x0, y0, w, 22 * k, 7); ctx.fill();
    ctx.globalAlpha = pulse; ctx.fillStyle = col; rrect(x0, y0, Math.max(6, w * s), 22 * k, 7); ctx.fill(); ctx.globalAlpha = 1;
    ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.textAlign = 'left'; ctx.fillStyle = '#10141f'; ctx.fillText(G.resting ? 'GRIP · RESTING' : 'GRIP', x0 + 8, y0 + 11 * k);
    const hgt = clamp(G.body.y + SHY + 0.8, 0, G.route.H); ctx.textAlign = 'right'; ctx.font = `400 ${Math.round(20 * k)}px ${TF}`; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(10,12,20,.6)'; const ht = `${Math.round(hgt)} / ${G.route.H} m`; ctx.strokeText(ht, W - 14, y0 + 11 * k); ctx.fillStyle = '#fff'; ctx.fillText(ht, W - 14, y0 + 11 * k);
    ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; const fl = `falls left: ${'●'.repeat(Math.max(0, c.lives - G.falls))}${'○'.repeat(Math.min(c.lives, G.falls))}`; ctx.strokeText(fl, W - 14, y0 + 36 * k); ctx.fillText(fl, W - 14, y0 + 36 * k);
    if (G.phase === 'slip' || s < 0.18) { ctx.textAlign = 'center'; ctx.font = `400 ${Math.round(22 * k)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeText('GRIP GOING!', W / 2, H * 0.2); ctx.fillStyle = '#ff8a6a'; ctx.fillText('GRIP GOING!', W / 2, H * 0.2); } }
  // 👁 the whole route (and back)
  { const e = L.eye; ctx.fillStyle = G.look ? 'rgba(255,207,58,.95)' : 'rgba(10,12,20,.6)'; ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, TAU); ctx.fill(); ctx.font = `${Math.round(20 * k)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText('👁', e.x, e.y + 1); }
  if (G.look) { ctx.textAlign = 'center'; ctx.font = `400 ${Math.round(18 * k)}px ${TF}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(10,12,20,.7)'; const t = 'THE ROUTE · tap to stop'; ctx.strokeText(t, W / 2, H - 40 * k); ctx.fillStyle = '#ffcf3a'; ctx.fillText(t, W / 2, H - 40 * k);
    ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; const t2 = 'Left: ledges to rest on · right: shorter and harder (bonus)'; ctx.strokeText(t2, W / 2, H - 18 * k); ctx.fillStyle = '#fff'; ctx.fillText(t2, W / 2, H - 18 * k); }
  if (ui.banner) banner(); }
function banner() { const b = ui.banner, a = Math.min(1, b.t / 0.2, ((b.secs || 2.4) - b.t) / 0.4); ctx.globalAlpha = Math.max(0, a); ctx.textAlign = 'center';
  ctx.font = `400 ${Math.round((b.small ? 30 : 40) * k)}px ${TF}`; ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(10,12,20,.7)'; ctx.strokeText(b.txt, W / 2, H * 0.3); ctx.fillStyle = '#ffcf3a'; ctx.fillText(b.txt, W / 2, H * 0.3);
  if (b.sub) { ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; ctx.lineWidth = 4; ctx.strokeText(b.sub, W / 2, H * 0.3 + 30 * k); ctx.fillStyle = '#fff'; ctx.fillText(b.sub, W / 2, H * 0.3 + 30 * k); } ctx.globalAlpha = 1; }
function lessonPanel(G) { coachPanel(G); }
