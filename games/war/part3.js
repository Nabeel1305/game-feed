// ===================== THE VIEW: Battle Lines in 3D (three.js through tools/world3d.js) =====================
// The general's view from a rise behind his own lines: the whole field below, grass and hills and woods, the enemy drawn up
// at the far end. Every soldier is a little figure (hundreds of them, drawn as a few instanced shapes: LESSONS, Eleven): your
// men in your banner's colour, theirs in red; spears, horses, archers' arcs of arrows. Each unit carries a banner with its kind,
// and a bar of how many men it has left, coloured by its nerve. A broken unit scatters and runs. Tap a unit and a ring marks it;
// an arrow shows the order. Before battle: the formation cards and the BATTLE button; in battle: the horn.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { snap: true, cam: null, flash: [], btn: [] };
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS || !(G && G.lesson)) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 140) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40 * k, t: 0, life: 0.4 + Math.random() * 0.4, col, r: (1.5 + Math.random() * 2) * k }); } if (PARTS.length > 200) PARTS.splice(0, PARTS.length - 200); }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2.5); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.5) TXT.shift(); for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 200 * k * dt; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; } }
const hex = n => '#' + n.toString(16).padStart(6, '0'), RED = 0xc8302a;
function hillH(G, x, z) { let h = 0; for (const q of G.hills) { const d = Math.hypot(x - q.x, z - q.z) / q.r; if (d < 1.4) h += 3.2 * Math.max(0, Math.cos(Math.min(1, d / 1.4) * Math.PI / 2)) ** 2; } return h; }
function iconTex(txt, col) { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.fillStyle = col; g.beginPath(); g.arc(32, 32, 28, 0, TAU); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 4; g.stroke(); g.font = '34px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 32, 35); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
function buildWorld() { if (V3) return V3; const T = THREE; if (!W3 || !W3.init({ canvas: $('gl'), fov: 58, far: 3000, near: 0.5 })) { V3 = { none: true }; return V3; }
  const MAX = 900, V = { T, S: W3.scene, MAX, key: null, banners: new Map(), icons: {} }; V3 = V;
  const mk = (geo, mat, cnt = MAX, shade = true) => { const m = new T.InstancedMesh(geo, mat, cnt); m.instanceMatrix.setUsage(T.DynamicDrawUsage); m.count = 0; m.castShadow = shade; m.frustumCulled = false; m.userData.max = cnt; V.S.add(m); return m; };
  // 25 Nov 2026 (his second note, CRITICAL: "You still have not fixed the problem. The soldiers are inside the ground create a clear line between
  // the ground and the soldiers so soldiers walk on the ground rather than seem to be inside it"). The morning's fix put their feet at the height of
  // the drawn grass, and they still looked buried, because a man was ONE BLOCK from the ground to his shoulders: no legs, no feet, no shadow, on
  // dark grass, he read as a post driven into the field. Seen at last in a sharp close-up. Now a man is a man: two pale legs that step when he
  // marches, dark boots on the grass, a tunic in his colour, arms that swing, and a soft shadow under his feet; horses have four legs. The grass
  // is lighter, so boots and shadows show against it.
  V.body = mk(new T.BoxGeometry(0.4, 0.72, 0.56), new T.MeshStandardMaterial({ roughness: 0.6 })); V.leg = mk(new T.BoxGeometry(0.21, 0.74, 0.23), new T.MeshStandardMaterial({ color: 0xe2d4ae, roughness: 0.85 }), MAX * 2); V.boot = mk(new T.BoxGeometry(0.36, 0.17, 0.25), new T.MeshStandardMaterial({ color: 0x22150c, roughness: 0.9 }), MAX * 2);
  V.arm = mk(new T.BoxGeometry(0.17, 0.6, 0.15), new T.MeshStandardMaterial({ roughness: 0.6 }), MAX * 2); V.hleg = mk(new T.BoxGeometry(0.17, 0.8, 0.17), new T.MeshStandardMaterial({ color: 0x3a2414, roughness: 0.85 }), 400);
  { const sg = new T.CircleGeometry(0.62, 12); sg.rotateX(-Math.PI / 2); V.shadow = mk(sg, new T.MeshBasicMaterial({ color: 0x06100a, transparent: true, opacity: 0.36, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), MAX, false); V.shadow.renderOrder = 1; }
  V.head = mk(new T.SphereGeometry(0.27, 8, 6), new T.MeshStandardMaterial({ color: 0xe0b896, roughness: 0.7 }));
  V.helm = mk(new T.SphereGeometry(0.3, 8, 6, 0, TAU, 0, 1.4), new T.MeshStandardMaterial({ color: 0x9aa0a8, metalness: 0.6, roughness: 0.35 }));
  V.horse = mk(new T.BoxGeometry(1.9, 0.85, 0.62), new T.MeshStandardMaterial({ roughness: 0.8 })); V.hhead = mk(new T.BoxGeometry(0.7, 0.4, 0.35), new T.MeshStandardMaterial({ roughness: 0.8 }), MAX * 3);      /* hhead: the neck, the head and the tail of each horse; coats differ horse to horse */
  V.spear = mk(new T.CylinderGeometry(0.04, 0.04, 3.2, 4), new T.MeshStandardMaterial({ color: 0x8a6a4a })); V.shield = mk(new T.BoxGeometry(0.12, 0.8, 0.6), new T.MeshStandardMaterial({ roughness: 0.5 }));
  V.bow = mk(new T.TorusGeometry(0.45, 0.04, 4, 10, Math.PI), new T.MeshStandardMaterial({ color: 0x6a4424 }));
  V.ring = new T.Mesh(new T.TorusGeometry(1, 0.12, 6, 40), new T.MeshBasicMaterial({ color: 0xffe08a })); V.ring.rotation.x = -Math.PI / 2; V.S.add(V.ring);
  V.arrowG = new T.BufferGeometry(); V.arrowP = new Float32Array(40 * 6 * 3); V.arrowG.setAttribute('position', new T.BufferAttribute(V.arrowP, 3)); V.arrows = new T.LineSegments(V.arrowG, new T.LineBasicMaterial({ color: 0x2a1a10 })); V.arrows.frustumCulled = false; V.S.add(V.arrows);
  W3.setQuality(stepN); return V; }
// the field for this battle: the ground with its hills, woods, a river of a stream at the edge, a few farm walls
function buildField(V, g) { const T = THREE, P = PLACES[g.place]; if (V.field) { V.S.remove(V.field); V.field.traverse(o => { if (o.geometry) o.geometry.dispose(); }); } const F = new T.Group(); V.field = F; V.S.add(F);
  const N3 = new T.ImprovedNoise(), base = new T.Color(P.ground);
  // 25 Nov 2026 (his review: "The soldiers seem to be phasing through the ground. make them stand"). The men were stood on the hills as the
  // rules know them (hillH), but the ground that is DRAWN also has small bumps (up to 0.6 m) and is made of flat pieces 7.5 m wide, so in
  // places it rose to their waists. The drawn ground's own heights are kept (V.gh, one for each corner of each piece) and groundY() reads
  // the height of the very piece a man stands on: feet on the grass everywhere.
  const SEG = 120, SIZE = 900, hOf = (x, z) => { const out = Math.max(0, Math.max(Math.abs(x) - FW - 8, Math.abs(z) - FZ - 10)); return hillH(g, x, z) + N3.noise(x * 0.05, 0.3, z * 0.05) * 0.6 + Math.min(40, out * out * 0.02); };
  V.gh = new Float32Array((SEG + 1) * (SEG + 1)); for (let j = 0; j <= SEG; j++) for (let i = 0; i <= SEG; i++) V.gh[j * (SEG + 1) + i] = hOf(-SIZE / 2 + i * SIZE / SEG, -SIZE / 2 + j * SIZE / SEG); V.gseg = SEG; V.gsize = SIZE;
  const tr = W3.terrain({ size: SIZE, seg: SEG, x: 0, z: 0, height: hOf,
    colour: (x, z, h) => { const n = N3.noise(x * 0.1, 1.3, z * 0.1) * 0.5 + 0.5; const L = g.place === 2 ? 1 : 1.55; return [(base.r * (0.85 + n * 0.25) + h * 0.01) * L, (base.g * (0.85 + n * 0.2) + h * 0.01) * L, base.b * (0.85 + n * 0.2) * L]; }      /* lighter grass (not the snow): boots and shadows show against it */, map: W3.grainTex(256, 11, 200, 40, 6) });
  // 25 Nov 2026, THE fault behind "the soldiers are inside the ground", found at last in a picture of a SECOND battle: W3.terrain() puts the ground
  // in the scene itself, so the ground of the battle before (and of the battle that plays behind the menu) was never taken away. Its hills stood
  // where the new field is flat, and the men, standing rightly on the new ground, were waist-deep or buried in the old. The ground now belongs to
  // this field's own group and goes when the field goes.
  F.add(tr);
  const trees = []; for (const w of g.woods) for (let i = 0; i < w.r * w.r * 0.9; i++) { const a = Math.random() * TAU, r = Math.sqrt(Math.random()) * w.r; trees.push({ x: w.x + Math.cos(a) * r, z: w.z + Math.sin(a) * r, y: hOf(w.x + Math.cos(a) * r, w.z + Math.sin(a) * r) - 0.3, s: 0.8 + Math.random() * 0.6, hue: Math.random(), shade: Math.random() * 0.5 }); }
  for (let i = 0; i < 300; i++) { const x = (Math.random() - 0.5) * 400, z = (Math.random() - 0.5) * 400; if (Math.abs(x) < FW + 14 && Math.abs(z) < FZ + 16) continue; trees.push({ x, z, y: 0, s: 1 + Math.random(), hue: Math.random(), shade: Math.random() * 0.5 }); } if (trees.length) F.add(W3.pines(trees, { layers: 3 }));      /* 25 Nov 2026: in the field's own group, so each place's trees go with it instead of piling up */
  // lines on the grass where each army stands at first (a faint chalk mark), and a field edge of hedges
  const hedgeM = new T.MeshStandardMaterial({ color: 0x3a5a2a, roughness: 1 }); for (const sx of [-1, 1]) { const h = new T.Mesh(new T.BoxGeometry(1.2, 1.2, FZ * 2 + 20), hedgeM); h.position.set(sx * (FW + 6), 0.6, 0); F.add(h); }
  for (const [, b] of V.banners) V.S.remove(b); V.banners.clear(); }
function banner(V, u, g) { let b = V.banners.get(u.id); if (b) return b; const T = THREE, grp = new T.Group(), col = u.side === 0 ? g.banner.col : RED;
  const pole = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 4.6, 5), new T.MeshStandardMaterial({ color: 0x5a3a20 })); pole.position.y = 2.3; grp.add(pole);
  const flag = new T.Mesh(new T.PlaneGeometry(1.6, 1.0), new T.MeshStandardMaterial({ color: col, side: T.DoubleSide, roughness: 0.7 })); flag.position.set(0.8, 4.0, 0); grp.add(flag);
  const key = u.type + u.side; if (!V.icons[key]) V.icons[key] = new T.SpriteMaterial({ map: iconTex(UT[u.type].icon, u.side === 0 ? hex(col) : '#a02020'), depthTest: false }); const ic = new T.Sprite(V.icons[key]); ic.scale.setScalar(2.6); ic.position.y = 6.2; ic.renderOrder = 5; grp.add(ic);
  grp.userData = { flag }; V.S.add(grp); V.banners.set(u.id, b = grp); return b; }
// the height of the drawn ground at a point (the two flat triangles of the piece it is in, as the terrain is made)
function groundY(V, g, x, z) { if (!V || !V.gh) return hillH(g, x, z); const N = V.gseg, cs = V.gsize / N, gx = clamp((x + V.gsize / 2) / cs, 0, N - 0.001), gz = clamp((z + V.gsize / 2) / cs, 0, N - 0.001), i = gx | 0, j = gz | 0, u = gx - i, v = gz - j, H = V.gh, a = H[j * (N + 1) + i], b = H[(j + 1) * (N + 1) + i], c = H[(j + 1) * (N + 1) + i + 1], d = H[j * (N + 1) + i + 1];
  return u + v <= 1 ? a + (d - a) * u + (b - a) * v : c + (b - c) * (1 - u) + (d - c) * (1 - v); }
const MM = new (window.THREE ? THREE.Matrix4 : Object)(), QQ = new (window.THREE ? THREE.Quaternion : Object)(), PP = new (window.THREE ? THREE.Vector3 : Object)(), SC = new (window.THREE ? THREE.Vector3 : Object)(1, 1, 1), CC = new (window.THREE ? THREE.Color : Object)(), YAX = new (window.THREE ? THREE.Vector3 : Object)(0, 1, 0), ZAX = new (window.THREE ? THREE.Vector3 : Object)(0, 0, 1), Q2 = new (window.THREE ? THREE.Quaternion : Object)(), NN = new (window.THREE ? THREE.Vector3 : Object)();
// place every soldier of every unit in its ranks (or scattered, running)
function syncUnits(V, g, t) { const n = { body: 0, leg: 0, boot: 0, arm: 0, hleg: 0, shadow: 0, head: 0, helm: 0, horse: 0, hhead: 0, spear: 0, shield: 0, bow: 0 }, MS = 1.2;
  // sw: a swing about the man's own side-to-side line (a leg or an arm stepping forward)
  const put = (m, x, y, z, rot, sx = 1, sy = 1, sz = 1, col, sw = 0) => { if (n[m] >= V[m].userData.max) return; QQ.setFromAxisAngle(YAX, rot); if (sw) { Q2.setFromAxisAngle(ZAX, sw); QQ.multiply(Q2); } PP.set(x, y, z); SC.set(sx, sy, sz); MM.compose(PP, QQ, SC); V[m].setMatrixAt(n[m], MM); if (col != null) { CC.setHex(col); V[m].setColorAt(n[m], CC); } n[m]++; };
  // a limb hung from (hx, hy, hz), len long, swung by a: where its middle is, then (for a leg) the boot at its end
  // the soft shadow under his feet lies ON the grass, tilted with the slope he stands on (laid flat it sank into a hillside on its upper half)
  const shade = (x, z, rot, sx, sz) => { if (n.shadow >= V.shadow.userData.max) return; const e = 0.7, y0 = groundY(V, g, x, z), gx = (groundY(V, g, x + e, z) - groundY(V, g, x - e, z)) / (2 * e), gz = (groundY(V, g, x, z + e) - groundY(V, g, x, z - e)) / (2 * e);
    NN.set(-gx, 1, -gz).normalize(); QQ.setFromUnitVectors(YAX, NN); Q2.setFromAxisAngle(YAX, rot); QQ.multiply(Q2); PP.set(x + NN.x * 0.08, y0 + 0.08, z + NN.z * 0.08); SC.set(sx, 1, sz); MM.compose(PP, QQ, SC); V.shadow.setMatrixAt(n.shadow++, MM); };
  const limb = (m, hx, hy, hz, f1, f2, len, a, rot, sc, col) => put(m, hx + f1 * Math.sin(a) * len / 2, hy - Math.cos(a) * len / 2, hz + f2 * Math.sin(a) * len / 2, rot, sc, sc, sc, col, a);
  const seen = new Set();
  for (const u of g.units) { if (u.gone) continue; seen.add(u.id); const U = UT[u.type], horse = !!U.charge, sp = horse ? 1.9 : 1.25, cols = Math.max(2, Math.ceil(Math.sqrt(u.n0 * (horse ? 1 : 1.6)))), col = u.side === 0 ? g.banner.col : RED, rot = -u.face, fx = Math.cos(u.face), fz = Math.sin(u.face), rx = -fz, rz = fx, moving = u.order || u.tgt;
    for (let i = 0; i < u.n; i++) { const r = Math.floor(i / cols), c = i % cols, w = (Math.min(cols, u.n) - 1) / 2; let lx = (c - w) * sp, lz = -r * sp * 1.1;
      if (u.rout) { lx += Math.sin(i * 7.3 + t * 3) * 2.5; lz += Math.cos(i * 3.1) * 3; } else if (u.fight > 0) { lx += Math.sin(t * 9 + i) * 0.25; lz += Math.sin(t * 7 + i * 2) * 0.35; }
      const x = u.x + rx * lx + fx * lz * 1, z = u.z + rz * lx + fz * lz, y = groundY(V, g, x, z), go = moving || u.rout, ph = t * (horse ? 11 : u.rout ? 12 : 8) + i * 1.7, bob = go ? Math.abs(Math.sin(ph)) * (horse ? 0.14 : 0.05) : 0, srot = u.rout ? rot + Math.PI : rot, ff = u.rout ? -1 : 1, f1 = fx * ff, f2 = fz * ff;
      const st = go ? Math.sin(ph) * (u.rout ? 0.8 : 0.6) : u.fight > 0 ? Math.sin(t * 9 + i) * 0.22 : 0;      // the step: one leg forward as the other goes back
      if (horse) { shade(x, z, srot, 2.3, 1.25);
        for (let q = 0; q < 4; q++) { const fo = (q < 2 ? 0.68 : -0.68), so = (q % 2 ? 0.2 : -0.2), a = go ? Math.sin(ph + (q === 0 || q === 3 ? 0 : Math.PI)) * 0.6 : 0, lx2 = x + f1 * fo + rx * so, lz2 = z + f2 * fo + rz * so, hipY = y + 0.9 + bob,
            L = clamp(hipY - groundY(V, g, lx2, lz2) - 0.02 + (go ? Math.max(0, -Math.cos(ph + (q === 0 || q === 3 ? 0 : Math.PI))) * -0.12 : 0), 0.45, 1.3);      /* each hoof on the grass under it, on a slope too */
          put('hleg', lx2 + f1 * Math.sin(a) * L / 2, hipY - Math.cos(a) * L / 2, lz2 + f2 * Math.sin(a) * L / 2, srot, 1, L / 0.8, 1, null, a); }
        const coat = [0x8a5a34, 0x6e4426, 0x9a6a3e, 0x5a3a24, 0xa8a094][(u.id * 7 + i * 3) % 5];
        put('horse', x, y + 1.3 + bob, z, srot, 1, 1, 1, coat); put('hhead', x + f1 * 0.95, y + 1.95 + bob, z + f2 * 0.95, srot, 1.15, 1.0, 0.9, coat, 0.95); put('hhead', x + f1 * 1.38, y + 2.3 + bob, z + f2 * 1.38, srot, 0.95, 0.85, 0.85, coat, -0.35); put('hhead', x - f1 * 1.05, y + 1.25 + bob, z - f2 * 1.05, srot, 0.9, 0.4, 0.4, 0x2a1a10, 1.15); put('body', x, y + 2.15 + bob, z, srot, 1, 0.95, 0.85, col); put('head', x, y + 2.78 + bob, z, srot); put('helm', x, y + 2.84 + bob, z, srot);
        if (u.type === 'knight') put('spear', x + f1 * 0.8, y + 2.35 + bob, z + f2 * 0.8, srot, 1, 1, 1); }
      else { const hip = y + 0.8 * MS + bob; shade(x, z, 0, MS, MS);
        for (const sd of [-1, 1]) { const a = st * sd, hx2 = x + rx * 0.15 * MS * sd, hz2 = z + rz * 0.15 * MS * sd; limb('leg', hx2, hip, hz2, f1, f2, 0.74 * MS, a, srot, MS);
          put('boot', hx2 + f1 * (Math.sin(a) * 0.72 + 0.07) * MS, hip - (Math.cos(a) * 0.72 - 0.02) * MS, hz2 + f2 * (Math.sin(a) * 0.72 + 0.07) * MS, srot, MS, MS, MS, null, a * 0.5);
          limb('arm', x + rx * 0.36 * MS * sd, hip + 0.68 * MS, z + rz * 0.36 * MS * sd, f1, f2, 0.6 * MS, -a * 0.8, srot, MS, col); }
        put('body', x, hip + 0.36 * MS, z, srot, MS, MS, MS, col); put('head', x, hip + 0.94 * MS, z, srot, MS, MS, MS); if (u.type !== 'archer' && u.type !== 'xbow') put('helm', x, hip + 1.0 * MS, z, srot, MS, MS, MS);
        if (u.type === 'spear') { put('spear', x + rx * 0.5 + f1 * 0.3, hip + 0.75, z + rz * 0.5 + f2 * 0.3, srot, 1, 1, 1); put('shield', x + f1 * 0.3 - rx * 0.3, hip + 0.3 * MS, z + f2 * 0.3 - rz * 0.3, srot, 1, 1, 1, col); }
        if (u.type === 'sword') put('shield', x + f1 * 0.3 - rx * 0.3, hip + 0.3 * MS, z + f2 * 0.3 - rz * 0.3, srot, 1, 1, 1, col);
        if (u.type === 'archer' || u.type === 'xbow') put('bow', x + rx * 0.5 + f1 * 0.2, hip + 0.45 * MS, z + rz * 0.5 + f2 * 0.2, srot + Math.PI / 2, 1, 1, 1); } }
    const b = banner(V, u, g); b.visible = !u.rout; { const bx = u.x - fx * (Math.ceil(u.n / cols) * sp * 0.6), bz = u.z - fz * (Math.ceil(u.n / cols) * sp * 0.6); b.position.set(bx, groundY(V, g, bx, bz), bz); } b.userData.flag.rotation.y = Math.sin(t * 2 + u.id) * 0.3; }
  for (const [id, b] of V.banners) if (!seen.has(id)) { V.S.remove(b); V.banners.delete(id); }
  for (const m in n) { V[m].count = n[m]; V[m].instanceMatrix.needsUpdate = true; if (V[m].instanceColor) V[m].instanceColor.needsUpdate = true; }
  const su = g.sel && g.units.find(u => u.id === g.sel) || (g.pickD && g.units.find(u => u.id === g.pickD)); V.ring.visible = !!su; if (su) { V.ring.position.set(su.x, groundY(V, g, su.x, su.z) + 0.35, su.z); V.ring.scale.setScalar(R_(su) + 0.8 + Math.sin(t * 6) * 0.2); }
  // arrows in flight: little arcs
  const P = V.arrowP; let q = 0; for (const a of g.arrows) { const u = a.t / 0.6; for (let j = 0; j < 3; j++) { const uu = clamp(u - j * 0.05, 0, 1), x = a.x0 + (a.x1 - a.x0) * uu, z = a.z0 + (a.z1 - a.z0) * uu, y = 2 + Math.sin(uu * Math.PI) * 8; if (q < 40 * 6) { P.set([x, y, z, x + (a.x1 - a.x0) * 0.03, y - 0.3, z + (a.z1 - a.z0) * 0.03], q * 3); q += 2; } } }
  for (let i = q; i < 40 * 6; i++) P.set([0, -100, 0], i * 3); V.arrowG.attributes.position.needsUpdate = true; }
const SV = new (window.THREE ? THREE.Vector3 : Object)(), RV = new (window.THREE ? THREE.Vector3 : Object)();
function scr(x, y, z) { if (!V3 || V3.none) return { x: W / 2 + x * 6, y: H / 2 + z * 6, front: true }; SV.set(x, y, z); return W3.screen(SV); }
function groundAt(px, py) { if (!V3 || V3.none) return { x: (px - W / 2) / 6, z: (py - H / 2) / 6 }; const cam = W3.cam, r = cv.getBoundingClientRect(); RV.set((px - r.left) / r.width * 2 - 1, -((py - r.top) / r.height) * 2 + 1, 0.5).unproject(cam).sub(cam.position); if (RV.y > -1e-4) return null; const t = -cam.position.y / RV.y; return { x: cam.position.x + RV.x * t, z: cam.position.z + RV.z * t }; }
// ---------- events ----------
function onEvent(G, e) { const p = e.x != null ? scr(e.x, 2, e.z) : { x: W / 2, y: H / 2 }, cx = W / 2;
  switch (e.k) {
    case 'start': say(PLACES[G.place].name.toUpperCase(), cx, H * 0.2, '#ffffff', 22); say('THE ENEMY IS DRAWN UP', cx, H * 0.25, '#ffd0c4', 16); sfx.horn(0); if (G.N <= 2) tip('form', 'Pick a formation card, tap two of your units to swap them, then BATTLE!', 3.6); break;
    case 'form': sfx.click(); break; case 'swap': sfx.drum(); break;
    case 'battle': sfx.horn(1); say('TO BATTLE!', cx, H * 0.3, '#ffe08a', 34); FX.flash = 0.2; if (G.N <= 3) tip('orders', 'Tap one of your units, then tap the ground to send it, or tap an enemy to attack.', 3.6); break;
    case 'sel': sfx.click(); break; case 'reinf': sfx.horn(0); say('ENEMY REINFORCEMENTS!', W / 2, H * 0.22, '#ffb4a8', 20); break; case 'busy': sfx.no(); say('A RIDER IS ON HIS WAY', W / 2, H * 0.7, '#ffd0c4', 14); break; case 'order': sfx.hup(); break; case 'attack': sfx.hup(); say('CHARGE!', p.x, p.y - 20 * k, '#ffe08a', 16); break;
    case 'charge': sfx.thunder(); FX.shake = Math.max(FX.shake, 6); burst(p.x, p.y, '#d8c8a0', 10, 120); break;
    case 'flank': if (e.by === 0) { say(e.rear ? 'FROM BEHIND!' : 'FLANKED!', p.x, p.y - 30 * k, '#ffe08a', 18); sfx.flank(); } break;
    case 'volley': sfx.volley(); break;
    case 'fall': if (Math.random() < 0.3) burst(p.x, p.y, e.side === 0 ? '#9ab8ff' : '#ff9a8a', 3, 60); break;
    case 'rout': if (e.side === 1) { sfx.cheer(); say('THEY RUN!', p.x, p.y - 30 * k, '#9be3b5', 20); vibe(HAP.sharp); } else { sfx.groan(); say('OUR MEN BREAK!', p.x, p.y - 30 * k, '#ffb4a8', 18); FX.red = 0.4; if (G.N <= 5) tip('rally', 'A unit broke and runs. Sound the HORN to rally your army.', 3); } break;
    case 'wiped': break; case 'fled': break;
    case 'rally': sfx.horn(2); say('RALLY!', cx, H * 0.35, '#ffe08a', 30); FX.flash = 0.3; break;
    case 'lessonnext': if (e.first) hint = null; say('FIRST, A LESSON', cx, H * 0.3, '#ffe08a', 24); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, cx, H * 0.36, '#9be3b5', 22); sfx.cheer(); break;
    case 'lessonmiss': coachMiss(); break;
    case 'lessondone': say('NOW, THE REAL BATTLE!', cx, H * 0.3, '#ffe08a', 24); sfx.horn(1); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); vibe(HAP.best); say('VICTORY!', cx, H * 0.3, '#ffd040', 40); FX.flash = 0.5; break;
    case 'lost': sfx.lose(); say('DEFEAT', cx, H * 0.3, '#ffb4a8', 36); break;
  } }
// ---------- every frame ----------
function placeCam(g, dt) { const cam = W3.cam, asp = innerWidth / innerHeight; cam.fov = asp < 0.8 ? 64 : 48; cam.aspect = asp; cam.updateProjectionMatrix(); const sh = FX.shake ? (Math.random() - 0.5) * FX.shake * 0.05 : 0;
  // 22 Nov 2026 (the audit: soldiers were specks on a dark field with 40% of the screen empty): the camera frames the armies, not the whole valley, and eases as they move
  const C = placeCam.C || (placeCam.C = { x: 0, z: 4, d: 96, key: null }); let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, n = 0; for (const u of g.units) if (!u.gone && !u.rout) { x0 = Math.min(x0, u.x); x1 = Math.max(x1, u.x); z0 = Math.min(z0, u.z); z1 = Math.max(z1, u.z); n++; }
  if (!n) { x0 = -10; x1 = 10; z0 = -10; z1 = 10; } const hw = Math.max(13, (x1 - x0) / 2 + 7), hd = Math.max(15, (z1 - z0) / 2 + 9), tf = Math.tan(cam.fov * Math.PI / 360), full = asp < 0.8 ? 96 : 76;
  const want = Math.min(full, Math.max(hw / (tf * asp), hd * 0.73 / (tf * 0.6))), ease = C.key !== g ? 1 : 1 - Math.exp(-(dt || 0.016) * 1.4); C.key = g;
  C.x += (clamp((x0 + x1) / 2, -14, 14) - C.x) * ease; C.z += ((z0 + z1) / 2 + 2 - C.z) * ease; C.d += (want - C.d) * ease;
  const ky = asp < 0.8 ? 0.728 : 0.733, kz = asp < 0.8 ? 0.686 : 0.68; cam.position.set(C.x + sh, ky * C.d, C.z + kz * C.d); cam.lookAt(C.x, 0, C.z); cam.updateMatrixWorld(); }
let IG = null; function idleG() { if (!IG || IG.over) { IG = newGame(Math.max(2, store.get('level', 1) | 0), { seed: (Math.random() * 1e6) | 0 }); IG.mem = {}; } honest(IG, { react: 0.3, acc: 0.95 }, IG.mem); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function draw(now, dt) { ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#1a1a14'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D battlefield.', W / 2, H / 2); return; }
  const g = G || idleG(), t = now;
  if (V.key !== g) { V.key = g; W3.setSky(PLACES[g.place].sky, { azim: 120 }); buildField(V, g); }
  placeCam(g, dt); syncUnits(V, g, t); W3.setFocus(0, 0, 0, 80); W3.render(dt);
  if (G) overlay(G, t);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const q of TXT) { const al = q.t < 1.0 ? 1 : 1 - (q.t - 1.0) / 0.5; ctx.globalAlpha = Math.max(0, al); ctx.font = `400 ${Math.round(q.size * k)}px ${TF}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(20,14,6,.75)'; ctx.strokeText(q.txt, q.x, q.y - q.t * 18); ctx.fillStyle = q.col; ctx.fillText(q.txt, q.x, q.y - q.t * 18); } ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30;
    ctx.fillStyle = 'rgba(24,18,8,.9)'; rrect(W / 2 - w / 2, H * 0.62 - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.62 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,40,40,${FX.red * 0.15})`; ctx.fillRect(0, 0, W, H); } if (FX.flash > 0) { ctx.fillStyle = `rgba(255,250,235,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); } }
// unit bars, the order arrows, the formation cards, BATTLE, the horn
function overlay(G, t) { ui.btn = []; const sel = G.units.find(u => u.id === G.sel);
  for (const u of G.units) { if (u.gone || u.rout) continue; const p = scr(u.x, 7.6, u.z), w = 26 * k, f = u.n / u.n0; ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(p.x - w / 2, p.y, w, 5 * k); ctx.fillStyle = u.morale > 60 ? '#7af0a0' : u.morale > 30 ? '#ffd040' : '#ff6a5a'; ctx.fillRect(p.x - w / 2, p.y, w * f, 5 * k); if (u.side === 0 && u.cd > 0) { ctx.font = `${Math.round(12 * k)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('⏳', p.x + w / 2 + 8 * k, p.y + 3 * k); }
    const go = u.side === 0 && (u.order || u.tgt) ? (u.tgt ? G.units.find(q => q.id === u.tgt) : u.order) : null; if (go && G.phase === 'battle') { const a = scr(u.x, 0.5, u.z), b = scr(go.x, 0.5, go.z); ctx.strokeStyle = u.tgt ? 'rgba(255,120,90,.7)' : 'rgba(255,240,180,.55)'; ctx.lineWidth = 2.5 * k; ctx.setLineDash([6 * k, 6 * k]); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.setLineDash([]); } }
  if (!G.lesson) { const mine = men(G, 0), theirs = men(G, 1), x = 12, y = 48 * k, w = W - 24; ctx.fillStyle = 'rgba(24,18,8,.75)'; rrect(x, y, w, 30 * k, 10); ctx.fill(); ctx.font = `400 ${Math.round(15 * k)}px ${TF}`; ctx.textAlign = 'left'; ctx.fillStyle = hex(G.banner.col === 0x2a2a34 ? 0x8a8aa4 : G.banner.col); ctx.fillText(`YOURS ${mine}`, x + 10, y + 15 * k); ctx.textAlign = 'right'; ctx.fillStyle = '#ff7a6a'; ctx.fillText(`THEIRS ${theirs}`, x + w - 10, y + 15 * k);
    if (G.phase === 'battle' && G.reinf != null) { ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillStyle = G.reinf < 10 ? '#ff9a7a' : 'rgba(255,255,255,.8)'; ctx.fillText(`enemy reinforcements in ${Math.ceil(G.reinf)} s`, W / 2, y + 15 * k); }
    const tot = mine + theirs || 1; ctx.fillStyle = '#ff7a6a'; ctx.fillRect(x + 10, y + 26 * k, w - 20, 3 * k); ctx.fillStyle = '#7ab0ff'; ctx.fillRect(x + 10, y + 26 * k, (w - 20) * mine / tot, 3 * k); } else lessonPanel(G);
  if (G.phase === 'deploy') { const n = FORMS.length, bw = (W - 20 - (n - 1) * 6) / n, by = H - 170 * k; FORMS.forEach((f, i) => { const b = { x: 10 + i * (bw + 6), y: by, w: bw, h: 62 * k, id: 'form:' + f.id }; ui.btn.push(b); ctx.fillStyle = G.form === f.id ? 'rgba(255,224,138,.9)' : 'rgba(24,18,8,.8)'; rrect(b.x, b.y, b.w, b.h, 10); ctx.fill();
      ctx.fillStyle = G.form === f.id ? '#1a1206' : '#fff'; ctx.font = `400 ${Math.round(13 * k)}px ${TF}`; ctx.textAlign = 'center'; const ls = wrapText(f.name, bw - 8); ls.forEach((l, j) => ctx.fillText(l, b.x + b.w / 2, b.y + 20 * k + j * 15 * k)); });
    const F = FORMS.find(f => f.id === G.form); ctx.font = `700 ${Math.round(12.5 * k)}px ${BC}`; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText(F.desc, W / 2, by - 14 * k);
    const B = { x: 30, y: H - 96 * k, w: W - 60, h: 54 * k, id: 'battle' }; ui.btn.push(B); ctx.fillStyle = '#c8302a'; rrect(B.x, B.y, B.w, B.h, 14); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = `400 ${Math.round(26 * k)}px ${TF}`; ctx.fillText('⚔ BATTLE!', W / 2, B.y + B.h / 2 + 2); }
  else if (!G.over) { const r = 30 * k, b = { x: W - 2 * r - 16, y: H - 2 * r - 30 * k, w: 2 * r, h: 2 * r, id: 'horn' }; ui.btn.push(b); ctx.fillStyle = G.rally > 0 ? 'rgba(200,140,40,.9)' : 'rgba(80,70,50,.6)'; ctx.beginPath(); ctx.arc(b.x + r, b.y + r, r, 0, TAU); ctx.fill(); ctx.font = `${Math.round(26 * k)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText('📯', b.x + r, b.y + r + 2); ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.fillText(`RALLY ×${G.rally}`, b.x + r, b.y - 8 * k);
    if (sel) { ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; ctx.fillStyle = '#ffe08a'; if (G && G.lesson) ctx.fillText(`${UT[sel.type].name}: tap the ground, or an enemy`, W / 2, H - 40 * k); } else if (G.N <= 3 && G.bt < 12) { ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 4); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; ctx.fillStyle = '#fff'; if (G && G.lesson) ctx.fillText('tap one of your units', W / 2, H - 40 * k); ctx.globalAlpha = 1; } } }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of String(t).split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { coachPanel(G); }
