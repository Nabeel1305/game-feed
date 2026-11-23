// ===================== THE VIEW: Pilot in 3D (three.js through tools/world3d.js) =====================
// Rebuilt 23 Nov 2026 (his notes: "Longer viewing distance... see distant terrain and the horizon clearly. Better surroundings... Start on a
// recognisable runway... Clearly mark where you must fly and which runway you must land on"). Two airports: home (where every flight starts,
// lined up on runway 36) and the destination, moved and turned for each flight. Between them a wide countryside of fields, hedges, woods,
// villages, a river and lakes, with mountains round the horizon 30-45 km away, all seen through air that is clear on a clear day.
// World x = game x, y = height, z = game d. The home runway runs from z = 0 to z = -3000.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [];
let hint = null, V3 = null, runwayTexOf = null;
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 6) TXT.shift(); }
function tip(key, txt, secs = 2.8) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function fxStep(dt) {
  FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 1.5);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.3) TXT.shift();
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; }
}
const PLACES = ['LARKMOOR', 'PINE HOLLOW', 'REDCLIFF', 'SALTMARSH', 'HIGHCROSS', 'BRACKENFORD', 'WILLOWMERE', 'STONEBRIDGE', 'FALCON BAY', 'ASHVALE'];
const destName = G => PLACES[(G.N - 1) % PLACES.length], rwyNum = h => { const n = Math.round((((h * 180 / Math.PI) % 360) + 360) % 360 / 10) || 36; return String(n).padStart(2, '0'); };
function buildWorld() {
  if (V3) return V3; const T = THREE; if (!W3 || !W3.init({ canvas: $('gl'), fov: 62, far: 90000, near: 1 })) { V3 = { none: true }; return V3; }
  const S = W3.scene, R0 = W3.rng(9), N3 = new T.ImprovedNoise();
  // the land: flat farmland for 25 km round (the game's ground is flat), rising into mountains round the horizon
  const ring = (x, z) => Math.hypot(x, z + 9000);
  const Hm = (x, z) => { const r = ring(x, z), m = clamp((r - 27000) / 9000, 0, 1); return m * m * (Math.abs(N3.noise(x * 0.00011, 0.5, z * 0.00011)) * 3200 + N3.noise(x * 0.0004, 1.5, z * 0.0004) * 600 + 500) - 1.0; };
  const colour = (x, z, h, sl) => { if (h > 1700) return [1.6, 1.62, 1.66]; if (h > 40) return sl > 0.3 ? [0.62, 0.6, 0.56] : [0.55, 0.62, 0.5]; return [1, 1, 1]; };
  // the fields: one big picture of fields of every colour with hedges between, repeated every 4 km, and a fine grain over it
  const fc = document.createElement('canvas'); fc.width = fc.height = 2048; { const g = fc.getContext('2d'); g.fillStyle = '#4c6a2c'; g.fillRect(0, 0, 2048, 2048);
    const cols = ['#5a7a2e', '#6f8a36', '#8a8a3c', '#a59a52', '#4b6a2a', '#7c6a40', '#5e7c3a', '#9aa04a', '#3f5e26', '#b5a45e', '#6a5a38', '#557b3e'];
    const cut = (x, y, w, h, d) => { if (d > 5 || (w < 160 && h < 160)) { g.fillStyle = cols[(R0() * cols.length) | 0]; g.fillRect(x + 3, y + 3, w - 6, h - 6);
        if (R0() < 0.5) { g.globalAlpha = 0.12; g.fillStyle = R0() < 0.5 ? '#000' : '#fff'; for (let i = 0; i < (R0() < 0.5 ? w : h); i += 7) R0() < 0.5 ? g.fillRect(x + 3 + (w > h ? i : 0), y + 3 + (w > h ? 0 : i), w > h ? 3 : w - 6, w > h ? h - 6 : 3) : 0; g.globalAlpha = 1; }
        if (R0() < 0.12) { g.fillStyle = '#2c4420'; g.fillRect(x + 3, y + 3, w - 6, h - 6); for (let i = 0; i < 60; i++) { g.fillStyle = R0() < 0.5 ? '#223a18' : '#365428'; g.beginPath(); g.arc(x + R0() * w, y + R0() * h, 4 + R0() * 9, 0, 6.3); g.fill(); } }      // a wood
        return; }
      const sp = R0() < 0.5; if (sp && w > 120) { const s2 = w * (0.3 + R0() * 0.4); cut(x, y, s2, h, d + 1); cut(x + s2, y, w - s2, h, d + 1); } else if (h > 120) { const s2 = h * (0.3 + R0() * 0.4); cut(x, y, w, s2, d + 1); cut(x, y + s2, w, h - s2, d + 1); } else cut(x, y, w, h, 9); };
    cut(0, 0, 2048, 2048, 0); g.strokeStyle = '#7d776a'; g.lineWidth = 4; for (let i = 0; i < 3; i++) { g.beginPath(); let x = R0() * 2048, y = 0; g.moveTo(x, y); while (y < 2048) { y += 90; x += (R0() - 0.5) * 120; g.lineTo(x, y); } g.stroke(); } }      // lanes
  const ft = new T.CanvasTexture(fc); ft.wrapS = ft.wrapT = T.RepeatWrapping; ft.colorSpace = T.SRGBColorSpace; ft.anisotropy = 8; ft.repeat.set(24, 24);
  const ground = W3.terrain({ size: 96000, seg: 240, x: 0, z: -9000, height: Hm, colour, map: ft });
  // a fine grain on top close up (a second, small pattern), so the ground still has texture from low down
  const gt = W3.grainTex(256, 21, 200, 40, 2); gt.repeat.set(1600, 1600); { const near = new T.Mesh(new T.PlaneGeometry(96000, 96000), new T.MeshStandardMaterial({ map: gt, transparent: true, opacity: 0.18, depthWrite: false, color: 0x000000 })); near.rotation.x = -Math.PI / 2; near.position.set(0, 0.2, -9000); near.renderOrder = 1; S.add(near); }
  // a river winding across, and lakes
  { const pts = []; let x = -26000, z = -3000; for (let i = 0; i < 60; i++) { pts.push(new T.Vector3(x, 0, z)); x += 900; z += (N3.noise(i * 0.2, 7, 0) * 1500) - 260; } const cur = new T.CatmullRomCurve3(pts), n = 400, pos = [], idx = [];
    for (let i = 0; i <= n; i++) { const p = cur.getPoint(i / n), tg = cur.getTangent(i / n), w = 70 + 40 * Math.sin(i * 0.1); pos.push(p.x - tg.z * w, 0.35, p.z + tg.x * w, p.x + tg.z * w, 0.35, p.z - tg.x * w); if (i) idx.push(2 * i - 2, 2 * i - 1, 2 * i, 2 * i - 1, 2 * i + 1, 2 * i); }
    const rg = new T.BufferGeometry(); rg.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); rg.setIndex(idx); rg.computeVertexNormals();
    const waterM = new T.MeshStandardMaterial({ color: 0x2f5468, metalness: 0.7, roughness: 0.12, side: T.DoubleSide }); S.add(new T.Mesh(rg, waterM));
    for (const [lx, lz, r] of [[8000, -21000, 1400], [-9000, -14000, 900], [14000, -6000, 1100], [-5000, 6000, 700]]) { const l = new T.Mesh(new T.CircleGeometry(r, 48), waterM); l.rotation.x = -Math.PI / 2; l.scale.set(1, 0.6, 1); l.position.set(lx, 0.4, lz); S.add(l); } }
  // villages (lit at night), woods of pines
  const tc = document.createElement('canvas'); tc.width = 64; tc.height = 64; { const g = tc.getContext('2d'); g.fillStyle = '#8a837a'; g.fillRect(0, 0, 64, 64); for (let y = 4; y < 64; y += 10) for (let x = 4; x < 64; x += 10) { g.fillStyle = R0() < 0.4 ? '#ffd28a' : '#2a2c30'; g.fillRect(x, y, 5, 6); } }
  const tt = new T.CanvasTexture(tc); tt.colorSpace = T.SRGBColorSpace; const townM = new T.MeshStandardMaterial({ map: tt, emissiveMap: tt, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.8 });
  const roofM = new T.MeshStandardMaterial({ color: 0x8a3b2a, roughness: 0.8 });
  const houses = [], NH = 1800; for (let v = 0; v < 18; v++) { const cx = (R0() - 0.5) * 40000, cz = -9000 + (R0() - 0.5) * 36000, n = 60 + R0() * 80 | 0; for (let i = 0; i < n && houses.length < NH; i++) { const a2 = R0() * 6.3, r = Math.sqrt(R0()) * (300 + n * 3); houses.push({ x: cx + Math.cos(a2) * r, z: cz + Math.sin(a2) * r, w: 9 + R0() * 9, h: 5 + R0() * R0() * 14, d: 9 + R0() * 9, r: R0() * 6.3 }); } }
  const town = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), townM, houses.length), roofs = new T.InstancedMesh(new T.ConeGeometry(0.75, 0.5, 4), roofM, houses.length); S.add(town, roofs);
  const trees = []; for (let i = 0; i < 9000; i++) { const cx = (R0() - 0.5) * 36000, cz = -9000 + (R0() - 0.5) * 36000; if (N3.noise(cx * 0.0003, 3, cz * 0.0003) < 0.08) continue; for (let j = 0; j < 6 && trees.length < 14000; j++) trees.push({ x: cx + (R0() - 0.5) * 220, y: -0.5, z: cz + (R0() - 0.5) * 220, s: 1.8 + R0() * 1.6, rot: R0() * 6, hue: R0() - 0.5, shade: R0() - 0.6 }); }
  const pines = W3.pines(trees, { layers: 3 });
  // the airports: grass, runway with its number and markings, taxiway, apron, terminal, hangars, tower, lights, the four glide-path lights
  const glassM = new T.MeshStandardMaterial({ color: 0x5f7a8c, metalness: 0.8, roughness: 0.15, emissive: 0x223344, emissiveIntensity: 0.2 }), wallM = new T.MeshStandardMaterial({ color: 0xb8bcc0, roughness: 0.6 });
  const grassM = new T.MeshStandardMaterial({ color: 0x5b7a34, roughness: 0.95, map: gt, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
  const rwTex = {}; function runwayTex(num) { if (rwTex[num]) return rwTex[num]; const rc = document.createElement('canvas'); rc.width = 256; rc.height = 4096; const g = rc.getContext('2d'); g.fillStyle = '#2a2b2d'; g.fillRect(0, 0, 256, 4096); for (let i = 0; i < 6000; i++) { g.fillStyle = `rgba(${R0() < 0.5 ? 255 : 0},${R0() < 0.5 ? 255 : 0},255,${R0() * 0.04})`; g.fillRect(R0() * 256, R0() * 4096, 2, 2); }
    g.fillStyle = '#e8e6df'; const yOf = d => 4096 - d / RW_LEN * 4096; for (let i = 0; i < 8; i++) g.fillRect(14 + i * 15 + (i >= 4 ? 106 : 0), yOf(70), 9, 4096 * 45 / RW_LEN);
    g.font = 'bold 120px sans-serif'; g.textAlign = 'center'; g.save(); g.translate(128, yOf(140)); g.scale(1, 2.2); g.fillText(num, 0, 0); g.restore();
    for (let d = 260; d < RW_LEN - 100; d += 60) g.fillRect(126, yOf(d), 4, 4096 * 30 / RW_LEN);
    for (const d of [300, 450, 600]) for (const sx of [-1, 1]) g.fillRect(128 + sx * 52 - 8, yOf(d), 16, 4096 * 22 / RW_LEN);
    g.fillRect(128 - 70, yOf(400) - 4096 * 45 / RW_LEN, 24, 4096 * 45 / RW_LEN); g.fillRect(128 + 46, yOf(400) - 4096 * 45 / RW_LEN, 24, 4096 * 45 / RW_LEN);
    for (let i = 0; i < 8; i++) g.fillRect(14 + i * 15 + (i >= 4 ? 106 : 0), 4, 9, 4096 * 45 / RW_LEN);      // the bars at the far end too
    g.fillRect(2, 0, 3, 4096); g.fillRect(251, 0, 3, 4096); const t = new T.CanvasTexture(rc); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return rwTex[num] = t; }
  function airport(num, home) {
    const A = new T.Group(), flat = (w, l, x, z, m, y) => { const p = new T.Mesh(new T.PlaneGeometry(w, l), m); p.rotation.x = -Math.PI / 2; p.position.set(x, y, z); p.receiveShadow = true; A.add(p); return p; };
    flat(700, RW_LEN + 1600, -120, -RW_LEN / 2, grassM, 0.5);
    const rwM = new T.MeshStandardMaterial({ map: runwayTex(num), roughness: 0.75, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }); const rw = flat(45, RW_LEN, 0, -RW_LEN / 2, rwM, 0.6);
    const asph = new T.MeshStandardMaterial({ color: 0x3a3b3e, roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
    flat(22, RW_LEN, -160, -RW_LEN / 2, asph, 0.58); for (const z of [-200, -1500, -2800]) flat(140, 20, -90, z, asph, 0.58); flat(240, 700, -310, -1500, asph, 0.58);
    const term = new T.Mesh(new T.BoxGeometry(60, 18, 420), glassM); term.position.set(-470, 9, -1500); term.castShadow = true; A.add(term);
    for (let i = 0; i < 4; i++) { const hg = new T.Mesh(new T.CylinderGeometry(30, 30, 70, 20, 1, false, 0, Math.PI), wallM); hg.rotation.z = Math.PI / 2; hg.rotation.y = Math.PI / 2; hg.position.set(-440, 0, -600 - i * 90); A.add(hg); }
    const tower = new T.Mesh(new T.CylinderGeometry(4, 6, 50, 12), wallM); tower.position.set(-400, 25, -2100); A.add(tower); const cab = new T.Mesh(new T.CylinderGeometry(9, 7, 7, 12), glassM); cab.position.set(-400, 52, -2100); A.add(cab);
    const lp = [], lc = [], addL = (x, y, z, c) => { lp.push(x, y, z); lc.push(...c); };
    for (let d = 0; d <= RW_LEN; d += 60) for (const sx of [-1, 1]) addL(sx * 23.5, 1, -d, d > RW_LEN - 600 ? [1, 0.6, 0.2] : [1, 0.95, 0.8]);
    for (let d = 0; d <= RW_LEN; d += 30) addL(0, 0.8, -d, [0.9, 0.95, 1]);
    for (let d = 30; d <= 900; d += 30) for (let kk = -4; kk <= 4; kk++) addL(kk * 1.6, 1.2 + d * 0.004, d, [1, 0.97, 0.9]);
    for (let kk = -12; kk <= 12; kk++) if (Math.abs(kk) > 3) addL(kk * 1.6, 1, 2, [0.3, 1, 0.4]);
    const lg = new T.BufferGeometry(); lg.setAttribute('position', new T.Float32BufferAttribute(lp, 3)); lg.setAttribute('color', new T.Float32BufferAttribute(lc, 3));
    const lights = new T.Points(lg, new T.PointsMaterial({ size: 3, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.95, depthWrite: false, fog: false })); A.add(lights);
    const papi = []; for (let i = 0; i < 4; i++) { const m = new T.Mesh(new T.SphereGeometry(1.1, 10, 8), new T.MeshBasicMaterial({ color: 0xffffff, fog: false })); m.position.set(-34 - i * 9, 1.5, -AIM); A.add(m); papi.push(m); }
    S.add(A); return { A, rw, rwM, lights, papi };
  }
  runwayTexOf = runwayTex;
  const homeA = airport('36', true), destA = airport('04', false);
  // the gold marker over the destination runway: a tall beam that shows from far off, with an arrow down to the threshold; the waypoint ring
  const goldM = new T.MeshBasicMaterial({ color: 0xffc83a, transparent: true, opacity: 0.4, depthWrite: false, fog: false, blending: T.AdditiveBlending, side: T.DoubleSide });
  const beam = new T.Mesh(new T.CylinderGeometry(22, 22, 2400, 24, 1, true), goldM); beam.position.set(0, 1200, -RW_LEN * 0.15); destA.A.add(beam);
  const chev = new T.Mesh(new T.ConeGeometry(60, 120, 4), new T.MeshBasicMaterial({ color: 0xffd36a, fog: false })); chev.rotation.x = Math.PI; chev.position.set(0, 260, 0); destA.A.add(chev);
  const ring2 = new T.Mesh(new T.TorusGeometry(200, 9, 10, 64), new T.MeshBasicMaterial({ color: 0xffd36a, fog: false, transparent: true, opacity: 0.9 })); S.add(ring2);
  const lineM = new T.MeshBasicMaterial({ color: 0xffd36a, fog: false, transparent: true, opacity: 0.55, depthWrite: false }); const lineUp = new T.Mesh(new T.TorusGeometry(140, 6, 8, 48), lineM); S.add(lineUp);
  // the airliner: fuselage, nose, tail cone, swept wings, engines, fin, tailplane, windows, a stripe; gear; lights
  const P = new T.Group(), white = new T.MeshStandardMaterial({ color: 0xf2f3f5, metalness: 0.35, roughness: 0.35 }), blue = new T.MeshStandardMaterial({ color: 0x1d4f9c, metalness: 0.3, roughness: 0.4 }), grey = new T.MeshStandardMaterial({ color: 0x9aa0a8, metalness: 0.6, roughness: 0.35 }), dark = new T.MeshStandardMaterial({ color: 0x111317, roughness: 0.3 });
  const fus = new T.Mesh(new T.CylinderGeometry(2, 2, 30, 24), white); fus.rotation.x = Math.PI / 2; P.add(fus);
  const nose = new T.Mesh(new T.SphereGeometry(2, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), white); nose.rotation.x = -Math.PI / 2; nose.scale.set(1, 1.8, 1); nose.position.z = -15; P.add(nose);
  const tailc = new T.Mesh(new T.ConeGeometry(2, 9, 24), white); tailc.rotation.x = Math.PI / 2; tailc.position.set(0, 0.5, 19.4); P.add(tailc);
  const stripe = new T.Mesh(new T.CylinderGeometry(2.02, 2.02, 30, 24, 1, true, Math.PI * 0.42, Math.PI * 0.16), blue); stripe.rotation.x = Math.PI / 2; P.add(stripe); const stripe2 = stripe.clone(); stripe2.rotation.z = Math.PI; P.add(stripe2);
  const win = new T.Mesh(new T.BoxGeometry(2.4, 0.5, 1.2), dark); win.position.set(0, 0.9, -16.6); win.rotation.x = 0.4; P.add(win);
  const wingS = new T.Shape(); wingS.moveTo(0, -3); wingS.lineTo(17, 4.5); wingS.lineTo(17, 6); wingS.lineTo(0, 3.5); wingS.lineTo(0, -3);
  for (const sd of [-1, 1]) { const w = new T.Mesh(new T.ExtrudeGeometry(wingS, { depth: 0.35, bevelEnabled: false }), white); w.rotation.x = Math.PI / 2; w.scale.x = sd; w.position.set(sd * 1.2, -0.9, 0); P.add(w);
    const eng = new T.Mesh(new T.CylinderGeometry(1.2, 1.0, 4.2, 20), grey); eng.rotation.x = Math.PI / 2; eng.position.set(sd * 6.5, -2.2, -1.2); P.add(eng); const inl = new T.Mesh(new T.CircleGeometry(1.1, 20), dark); inl.position.set(sd * 6.5, -2.2, -3.32); inl.rotation.y = Math.PI; P.add(inl);
    const tp = new T.Mesh(new T.BoxGeometry(6, 0.25, 2.6), white); tp.position.set(sd * 3.5, 0.9, 20); tp.rotation.y = sd * 0.35; P.add(tp);
    const gear = new T.Mesh(new T.CylinderGeometry(0.15, 0.15, 2.2, 8), grey); gear.position.set(sd * 2.6, -2.4, 1.5); P.add(gear); for (const z of [1.0, 2.0]) { const wh = new T.Mesh(new T.CylinderGeometry(0.55, 0.55, 0.4, 14), dark); wh.rotation.z = Math.PI / 2; wh.position.set(sd * 2.6, -3.5, z); P.add(wh); } }
  const ng = new T.Mesh(new T.CylinderGeometry(0.12, 0.12, 2, 8), grey); ng.position.set(0, -2.3, -12); P.add(ng); const nw = new T.Mesh(new T.CylinderGeometry(0.42, 0.42, 0.35, 12), dark); nw.rotation.z = Math.PI / 2; nw.position.set(0, -3.4, -12); P.add(nw);
  const finS = new T.Shape(); finS.moveTo(0, 0); finS.lineTo(7, 0); finS.lineTo(8, 8); finS.lineTo(5.5, 8); finS.lineTo(0, 0); const fin = new T.Mesh(new T.ExtrudeGeometry(finS, { depth: 0.3, bevelEnabled: false }), blue); fin.rotation.y = -Math.PI / 2; fin.position.set(0.15, 1.6, 15.5); P.add(fin);
  P.traverse(o => { if (o.isMesh) o.castShadow = true; }); P.position.y = 3.6; const plane = new T.Group(); plane.add(P); S.add(plane);
  const land = new T.SpotLight(0xfff4e0, 0, 900, 0.18, 0.5, 1); land.position.set(0, 0, -16); const lt = new T.Object3D(); lt.position.set(0, -20, -300); plane.add(land, lt); land.target = lt;
  const strobe = new T.Mesh(new T.SphereGeometry(0.35, 8, 6), new T.MeshBasicMaterial({ color: 0xffffff })); strobe.position.set(0, 2.2, 0); plane.add(strobe);
  const navL = []; for (const [sd, c] of [[-1, 0xff2020], [1, 0x20ff40]]) { const m = new T.Mesh(new T.SphereGeometry(0.3, 8, 6), new T.MeshBasicMaterial({ color: c })); m.position.set(sd * 18, -0.6, 4.6); plane.add(m); navL.push(m); }
  // smoke from the tyres at touchdown
  const NP = 120, pG = new T.BufferGeometry(); pG.setAttribute('position', new T.BufferAttribute(new Float32Array(NP * 3), 3)); pG.setAttribute('a', new T.BufferAttribute(new Float32Array(NP), 1));
  const pM = new T.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { px: { value: 1 } }, vertexShader: `attribute float a; uniform float px; varying float va; void main(){ va = a; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = min(px * 80.0, px * 900.0 / -mv.z); gl_Position = projectionMatrix * mv; }`, fragmentShader: `varying float va; void main(){ float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(0.85, 0.85, 0.85, va * 0.5 * smoothstep(0.5, 0.0, d)); }` });
  const smoke = new T.Points(pG, pM); smoke.frustumCulled = false; S.add(smoke); const puffs = []; for (let i = 0; i < NP; i++) puffs.push({ t: 9, life: 1, x: 0, y: -99, z: 0 });
  V3 = { T, S, plane, P, land, strobe, navL, homeA, destA, beam, chev, ring2, lineUp, townM, smoke, puffs, pines, trees, town, roofs, houses, camPos: new T.Vector3(), look: new T.Vector3(), sky: null, lvl: null, look2: { yaw: 0, pitch: 0, idle: 9 } };
  W3.setQuality(stepN); return V3;
}
// each flight: the destination airport is moved to its place, with its own runway number; woods and houses are cleared from both airports
function placeLevel(g) {
  const V = V3, key = g.N + ':' + g.seed; if (V.lvl === key) return; V.lvl = key; const B = g.B, T = V.T;
  V.destA.A.position.set(B.x, 0, B.d); V.destA.A.rotation.set(0, -B.h, 0);
  const num = rwyNum(B.h); if (V.destA.num !== num) { V.destA.num = num; V.destA.rwM.map = runwayTexOf(num); V.destA.rwM.needsUpdate = true; }
  const clear = (x, z) => { for (const A of [{ x: 0, d: 0, h: 0 }, B]) { const rx = x - A.x, rd = z - A.d, along = -(rx * Math.sin(A.h) - rd * Math.cos(A.h)), side = rx * Math.cos(A.h) + rd * Math.sin(A.h); if (along < 2500 && along > -RW_LEN - 900 && side > -900 && side < 500) return true; } return false; };
  const d = new T.Object3D(); V.trees.forEach((t, i) => { d.position.set(t.x, t.y, t.z); d.rotation.set(0, t.rot || 0, 0); d.scale.setScalar(clear(t.x, t.z) ? 0 : t.s); d.updateMatrix(); V.pines.setMatrixAt(i, d.matrix); }); V.pines.instanceMatrix.needsUpdate = true;
  V.houses.forEach((h, i) => { const off = clear(h.x, h.z); d.position.set(h.x, h.h / 2, h.z); d.rotation.set(0, h.r, 0); d.scale.set(off ? 0 : h.w, off ? 0 : h.h, off ? 0 : h.d); d.updateMatrix(); V.town.setMatrixAt(i, d.matrix);
    d.position.set(h.x, h.h + h.w * 0.25, h.z); d.rotation.set(0, h.r + Math.PI / 4, 0); d.scale.set(off ? 0 : h.w * 1.05, off ? 0 : h.w * 0.5, off ? 0 : h.d * 1.05); d.updateMatrix(); V.roofs.setMatrixAt(i, d.matrix); });
  V.town.instanceMatrix.needsUpdate = V.roofs.instanceMatrix.needsUpdate = true;
  const w = g.wps[0]; V.ring2.visible = !!w; if (w) { V.ring2.position.set(w.x, w.y, w.d); const b = Math.atan2(w.x - 0, -(w.d + RW_LEN)); V.ring2.rotation.set(0, -b, 0); }
}
function setWeather(G) {
  const V = buildWorld(); if (V.none) return; placeLevel(G); if (V.sky === G.weather) return; V.sky = G.weather;
  W3.setSky(G.weather, { azim: { dawn: 110, sunset: 220, golden: 230, dusk: 205 }[G.weather] || 150, wind: [G.wind * 0.1, 0.2] });
  const dark = W3.S.night || G.weather === 'dusk' || G.weather === 'storm'; V.townM.emissiveIntensity = dark ? 1.2 : 0; V.land.intensity = dark ? 300 : 0;
  for (const A of [V.homeA, V.destA]) A.lights.material.size = dark ? 5.5 : 3;
  if (dark) { W3.S.exposure *= 1.5; W3.R.toneMappingExposure = W3.S.exposure; W3.S.hemiI *= 1.4; W3.hemi.intensity = W3.S.hemiI; }
  // his note: "Render the world farther ahead so you can see distant terrain and the horizon clearly". A clear day sees 40 km and more; rain, fog
  // and night close it in, but never to less than a few kilometres, so the destination's marker and runway lights always show in time
  const far = { morning: 52000, noon: 60000, golden: 42000, sunset: 38000, dusk: 26000, night: 20000, overcast: 24000, rain: 11000, storm: 8000, mist: 5500 }[G.weather] || 40000;
  W3.scene.fog.near = far * 0.04; W3.scene.fog.far = far;
  W3.S.onBolt = () => { if (!HEADLESS && sfx.thunder) setTimeout(() => sfx.thunder(), 300 + Math.random() * 900); };
}
function puff(x, z, n) { if (!V3 || V3.none) return; let k2 = 0; for (const p of V3.puffs) { if (p.t < p.life) continue; Object.assign(p, { t: 0, life: 1 + Math.random(), x: x + (Math.random() - 0.5) * 2, y: 1.2, z: z + Math.random() * 3 }); if (++k2 >= n) break; } }
const ui = { snap: false, stick: null, thr: null, pad: null, look: null };
function onEvent(G, e) {
  const cx = W / 2, cy = H * 0.3;
  switch (e.k) {
    case 'warn': sfx.warn(); say({ slow: 'SPEED! TOO SLOW', fast: 'TOO FAST', low: 'TOO LOW', high: 'TOO HIGH', bank: 'BANK ANGLE', descend: 'START DOWN NOW' }[e.w], cx, cy, '#ffb48a', 22); tip('w_' + e.w, { slow: 'Left thumb up: more power', fast: 'Left thumb down: less power', low: 'Press ▲ UP a little to come up to the slope', high: 'Press ▼ DOWN to come down to the slope', bank: 'Level the wings near the ground', descend: 'Press ▼ DOWN and take some power off: the runway is close' }[e.w], 2.8); break;
    case 'rotate': if (!HEADLESS) { say('ROTATE! HOLD ▲ UP', cx, cy, '#ffe08a', 26); sfx.ding(); } break;
    case 'liftoff': say('AIRBORNE!', cx, cy, '#9be3b5', 26); sfx.coin(2); vibe(HAP.light); break;
    case 'waypoint': say('WAYPOINT ✓', cx, cy, '#ffe08a', 26); sfx.coin(3); vibe(HAP.light); break;
    case 'final': say(`FINAL: RUNWAY ${rwyNum(G.B.h)}`, cx, cy, '#ffe08a', 24); sfx.ding(); break;
    case 'online': if (G.lesson) sfx.ding(); break;
    case 'touch': { const a = G.ac; puff(a.x - 2.6, a.d, 14); puff(a.x + 2.6, a.d, 14); FX.shake = e.q === 'butter' ? 3 : e.q === 'smooth' ? 6 : 12; sfx.touch(e.q); vibe(e.q === 'butter' ? HAP.light : HAP.thud);
      say({ butter: 'BUTTER!', smooth: 'SMOOTH LANDING', firm: 'FIRM LANDING', hard: 'HARD, BUT DOWN' }[e.q], cx, cy, e.q === 'butter' ? '#ffe08a' : '#9be3b5', 30); say(`${e.sink.toFixed(1)} m/s down · now brake: power off`, cx, cy + 40 * k, '#fff', 17); break; }
    case 'crash': sfx.crash(); FX.shake = 20; FX.red = 0.9; FX.stop = 0.1; say(WHY[e.why] ? WHY[e.why][0] : 'CRASH', cx, cy, '#ffb4a8', 28); break;
    case 'lessonnext': if (e.first) hint = null; say(e.first ? 'FIRST, A LESSON' : 'NEXT LESSON', cx, H * 0.5, '#ffd36a', 26); sfx.ding(); ui.snap = true; break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, cx, H * 0.5, '#9be3b5', 26); sfx.coin(e.n); break;
    case 'lessonmiss': hint = { txt: (WHY[e.why] ? WHY[e.why][1] + ' ' : '') + e.how, t: 0, secs: 4.2 }; break;
    case 'lessondone': say('YOU HAVE CONTROL', cx, H * 0.5, '#ffd36a', 28); sfx.win(); ui.snap = true; if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); vibe(HAP.best); break;
    case 'lost': sfx.lose(); break;
  }
}
// his note: "explain when an attempt fails". What happened, and what to do next time (the end card shows both)
const WHY = {
  short: ['SHORT OF THE RUNWAY', 'The wheels touched the ground before the runway. Stay on the slope: the four lights two white, two red.'],
  side: ['OFF THE SIDE OF THE RUNWAY', 'You touched down beside the runway. Line up with the centre line early, while still far out.'],
  hard: ['TOO HARD: THE GEAR GAVE', 'You hit the runway too fast downwards. Just before the wheels touch, press ▲ UP (the flare) and take the power off.'],
  wing: ['A WING TOUCHED', 'The wings were not level at touchdown. Let go of ◀ ▶ before the wheels touch.'],
  drift: ['SIDEWAYS AT TOUCHDOWN', 'The crosswind pushed you sideways as the wheels touched. Point a little into the wind, then straighten just before touchdown.'],
  long: ['TOO FAR DOWN THE RUNWAY', 'You floated past the first part of the runway. Come down the slope, flare just above the ground, power right off.'],
  overrun: ['OFF THE END OF THE RUNWAY', 'You did not stop in time. Touch down early and take the power right off so the brakes can stop you.'],
  ground: ['HIT THE GROUND', 'You came down before reaching the runway. Watch the height and keep above the slope until the runway.'],
  runway: ['RAN OUT OF RUNWAY', 'You did not lift off before the end of the runway. Full power, and hold ▲ UP as soon as the speed reaches ROTATE.'],
  lost: ['LOST', 'You flew too far from the airports. Follow the gold arrow to the destination.'],
};
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#0b1418'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D airport.', W / 2, H / 2); return; }
  const T = V.T, cam = W3.cam, g = G || idleG(), a = g.ac, t = now; setWeather(g);
  const crashed = g.ph === 'crash';
  V.plane.position.set(a.x, a.y + 0.6, a.d); V.plane.rotation.set(0, 0, 0); V.plane.rotateY(-a.psi); V.plane.rotateX(a.th); V.plane.rotateZ(-a.phi);
  if (crashed) { V.plane.rotateZ(Math.min(0.6, g.ph_t * 0.6) * (g.why === 'wing' ? -1 : 1)); }
  V.strobe.visible = Math.sin(t * 9) > 0.85; V.navL.forEach(m => m.visible = true);
  // the glide-path lights at the destination: each shows white above its angle, red below
  const ap = appOf(g), ang = Math.atan2(a.y + 2, Math.max(1, ap.d + AIM)) * 180 / Math.PI, gd = GS * 180 / Math.PI; V.destA.papi.forEach((m, i) => m.material.color.set(ang > gd + [0.5, 0.17, -0.17, -0.5][i] ? 0xffffff : 0xff2a2a));
  V.homeA.papi.forEach(m => m.visible = false);
  // the gold marks: the beam over the destination (fading as you near it), the ring where you line up
  const dist = Math.hypot(a.x - g.B.x, a.d - g.B.d); V.beam.material.opacity = clamp((dist - 1500) / 4000, 0.08, 0.4); V.chev.visible = dist > 2500; V.chev.position.y = 260 + Math.sin(t * 2.5) * 30;
  const tg = target(g); V.lineUp.visible = tg.kind === 'line up'; if (V.lineUp.visible) { V.lineUp.position.set(tg.x, tg.y, tg.d); V.lineUp.rotation.set(0, -g.B.h, 0); }
  // the camera: behind and above, swinging round with the bank, lower and closer near the ground. His note: "Drag your thumb across the screen to
  // move the camera naturally—right to look right, left to look left, and vertically to look up or down" (part5 sets V.look2); let go and it
  // swings gently back behind the plane after two seconds
  const L2 = V.look2; L2.idle += dt; if (!ui.look && L2.idle > 2) { L2.yaw *= Math.max(0, 1 - dt * 1.6); L2.pitch *= Math.max(0, 1 - dt * 1.6); }
  const near = clamp(a.y / 60, 0, 1), gnd = g.ph === 'takeoff' || g.ph === 'roll' ? 1 : 0, back = 42 + 20 * near + 14 * gnd, up = 9 + 6 * near + 5 * gnd, vy = a.psi + L2.yaw, cp = Math.cos(L2.pitch), sp = Math.sin(L2.pitch);
  const want = new T.Vector3(a.x - Math.sin(vy) * back * cp - (L2.yaw ? 0 : a.phi * 6), a.y + up - back * sp * 0.9, a.d + Math.cos(vy) * back * cp);
  const look = new T.Vector3(a.x + Math.sin(vy) * 80, a.y + 2 - 6 * near * (1 - Math.abs(L2.pitch)) + 80 * Math.tan(L2.pitch) * 0.9, a.d - Math.cos(vy) * 80);
  if (ui.snap) { V.camPos.copy(want); V.look.copy(look); } else { const f = Math.min(1, dt * (ui.look ? 9 : 3)); V.camPos.lerp(want, f); V.look.lerp(look, f); } ui.snap = false;
  if (V.camPos.y < a.y * 0 + 2.5) V.camPos.y = 2.5;
  cam.position.copy(V.camPos); cam.fov = innerWidth > innerHeight ? 50 : 62; cam.updateProjectionMatrix(); cam.lookAt(V.look); cam.rotateZ(-a.phi * 0.25 * (1 - Math.min(1, Math.abs(L2.yaw))));
  if (FX.shake > 0) { cam.rotation.x += (Math.random() - 0.5) * FX.shake * 0.002; cam.rotation.y += (Math.random() - 0.5) * FX.shake * 0.002; }
  const pa = V.smoke.geometry.attributes.position, aa = V.smoke.geometry.attributes.a; V.puffs.forEach((p, i) => { if (p.t < p.life) { p.t += dt; p.y += dt * 1.5; } pa.setXYZ(i, p.x, p.t < p.life ? p.y : -99, p.z); aa.setX(i, p.t < p.life ? 1 - p.t / p.life : 0); }); pa.needsUpdate = aa.needsUpdate = true; V.smoke.material.uniforms.px.value = W3.R.getPixelRatio() * innerHeight / 844;
  W3.setFocus(a.x, Math.max(0, a.y - 3), a.d, 45);
  W3.render(dt);
  if (G) hud(G);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 0.9 ? 1 : 1 - (t2.t - 0.9) / 0.4; ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(t2.size * k)}px ${BC}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 26 * k); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 26 * k); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(16 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 20 * k, h = lines.length * lh + 16 * k, w = Math.min(W - 24, Math.max(...lines.map(l => ctx.measureText(l).width)) + 34);
    ctx.fillStyle = 'rgba(0,0,0,.6)'; rrect(W / 2 - w / 2, H * 0.56 - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.56 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,60,30,${FX.red * 0.25})`; ctx.fillRect(0, 0, W, H); }
}
// behind the home card: a flight coming in to land, over and over
let IG = null; function idleG() { if (!IG) { IG = newGame(Math.max(1, store.get('level', 1) | 0), { seed: 2 }); approach(IG, 4000, 0); } const m = {}; if (IG.ph === 'air' || IG.ph === 'roll') { honest(IG, { react: 0.1, acc: 1 }, m); step(IG, 1 / 60); } IG.ev.length = 0; if (IG.ph === 'crash' || IG.over || (IG.ph === 'roll' && IG.ac.v < 20)) { IG.over = null; approach(IG, 4000, 0); } return IG; }
function weatherName(w) { return { dawn: 'DAWN', morning: 'MORNING', golden: 'GOLDEN HOUR', overcast: 'OVERCAST', mist: 'FOG', sunset: 'SUNSET', noon: 'MIDDAY', dusk: 'DUSK', rain: 'RAIN', storm: 'STORM', night: 'NIGHT' }[w] || ''; }
// what to do now, in a few words, always on screen
function nowDo(G) { const a = G.ac, ap = G.app, L = lessonNow(G);
  if (G.ph === 'takeoff') return a.v < 8 && G.thr < 0.9 ? 'SLIDE THE POWER LEVER ALL THE WAY UP' : a.v < VR ? `SPEEDING UP… ROTATE AT ${Math.round(VR * 1.94)} KT` : 'ROTATE: HOLD ▲ UP';
  if (G.ph === 'roll') return 'POWER OFF: BRAKING';
  if (G.ph !== 'air') return '';
  const tg = target(G); if (tg.kind === 'waypoint') return 'FLY THROUGH THE GOLD RING';
  if (tg.kind === 'line up') return a.y < G.cfg.cruise - 80 && G.ph_t < 90 ? `CLIMB TO ${Math.round(G.cfg.cruise * 3.28 / 100) * 100} FT, TURN TO THE GOLD RING` : 'TURN TO THE GOLD RING: IT LINES YOU UP';
  if (ap.d > 600) return 'FOLLOW THE SLOPE DOWN: TWO WHITE, TWO RED';
  return a.y > 14 ? 'OVER THE LIGHTS: KEEP COMING DOWN' : 'FLARE: ▲ UP, POWER OFF'; }
function hud(G) {
  const c = G.cfg, a = G.ac, x = 14, y = 44 * k, ap = appOf(G);
  if (G.lesson) lessonPanel(G);
  // where to go: the destination, its runway, how far, and an arrow
  const by = G.lesson ? H * 0.34 : y + 4 * k;
  if (!G.lesson || lessonNow(G).start === 'runway') { const tg = target(G), brg = bearingTo(G, tg), dk = Math.hypot(a.x - G.B.x, a.d - G.B.d) / 1000, px = W / 2, py = by + 64 * k, pw = Math.min(W - 28, 320 * k);
    ctx.fillStyle = 'rgba(0,0,0,.5)'; rrect(px - pw / 2, py - 18 * k, pw, 36 * k, 10); ctx.fill(); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffd36a'; ctx.font = `700 ${Math.round(14 * k)}px ${BC}`;
    ctx.fillText(`TO ${destName(G)} · RWY ${rwyNum(G.B.h)}`, px - pw / 2 + 44 * k, py); ctx.textAlign = 'right'; ctx.fillStyle = '#fff'; ctx.fillText(`${dk.toFixed(1)} km`, px + pw / 2 - 12 * k, py);
    ctx.save(); ctx.translate(px - pw / 2 + 22 * k, py); ctx.rotate(brg); ctx.fillStyle = '#ffd36a'; ctx.beginPath(); ctx.moveTo(0, -14 * k); ctx.lineTo(10 * k, 10 * k); ctx.lineTo(0, 4 * k); ctx.lineTo(-10 * k, 10 * k); ctx.closePath(); ctx.fill(); ctx.restore();
    // the target on the screen itself: a gold diamond where it is, or an arrow at the edge pointing the way
    if (G.ph === 'air' || G.ph === 'takeoff') { const v = new V3.T.Vector3(tg.x, tg.kind === 'runway' ? 2 : tg.y, tg.d).project(W3.cam), onS = v.z < 1 && Math.abs(v.x) < 0.92 && Math.abs(v.y) < 0.85;
      const sx = (v.x + 1) / 2 * W, sy = (1 - v.y) / 2 * H, lbl = tg.kind === 'waypoint' ? 'WAYPOINT' : tg.kind === 'line up' ? 'LINE UP HERE' : 'RUNWAY ' + rwyNum(G.B.h);
      ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`;
      if (onS) { ctx.save(); ctx.translate(sx, sy); ctx.rotate(Math.PI / 4); ctx.strokeStyle = '#ffd36a'; ctx.lineWidth = 3; ctx.strokeRect(-9 * k, -9 * k, 18 * k, 18 * k); ctx.restore(); const dd = Math.hypot(a.x - tg.x, a.d - tg.d) / 1000;
        ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.strokeText(`${lbl} · ${dd.toFixed(1)} km`, sx, sy - 22 * k); ctx.fillStyle = '#ffd36a'; ctx.fillText(`${lbl} · ${dd.toFixed(1)} km`, sx, sy - 22 * k); }
      else if (Math.abs(brg) > 0.35) { const side = Math.sign(brg), ex = side > 0 ? W - 34 * k : 34 * k, ey = H * 0.42; ctx.fillStyle = '#ffd36a'; ctx.beginPath(); ctx.moveTo(ex + side * 16 * k, ey); ctx.lineTo(ex - side * 8 * k, ey - 16 * k); ctx.lineTo(ex - side * 8 * k, ey + 16 * k); ctx.closePath(); ctx.fill();
        ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.strokeText(side > 0 ? 'TURN RIGHT' : 'TURN LEFT', ex - side * 4 * k, ey + 30 * k); ctx.fillText(side > 0 ? 'TURN RIGHT' : 'TURN LEFT', ex - side * 4 * k, ey + 30 * k); } }
    // what to do now
    const nd = nowDo(G); if (nd) { ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.fillStyle = '#fff'; ctx.strokeText(nd, W / 2, py + 34 * k); ctx.fillText(nd, W / 2, py + 34 * k); } }
  if (G.t < 3.2 && !G.lesson) { ctx.globalAlpha = Math.min(1, (3.2 - G.t) / 0.6); ctx.textAlign = 'center'; ctx.font = `700 ${Math.round(15 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.5)';
    const s = `FLIGHT ${G.N} · ${weatherName(G.weather)}${c.wind > 1 ? ` · CROSSWIND ${Math.round(c.wind * 1.94)} KT` : ''}`; ctx.strokeText(s, W / 2, H * 0.3); ctx.fillText(s, W / 2, H * 0.3); ctx.globalAlpha = 1; }
  // the instruments: speed (green band, and the ROTATE mark on the runway), height, climb or sink
  const box = (bx, label, val, col) => { ctx.fillStyle = 'rgba(0,0,0,.45)'; rrect(bx, by, 84 * k, 40 * k, 8); ctx.fill(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.fillText(label, bx + 42 * k, by + 11 * k); ctx.fillStyle = col; ctx.font = `700 ${Math.round(17 * k)}px ${BC}`; ctx.fillText(val, bx + 42 * k, by + 28 * k); };
  const kt = Math.round(a.v * 1.94), okS = G.ph === 'takeoff' ? a.v >= VR : a.v > 66 && a.v < 100; box(x, G.ph === 'takeoff' ? `SPEED · ROTATE ${Math.round(VR * 1.94)}` : 'SPEED', `${kt} kt`, okS ? '#9be3b5' : a.v < 60 && G.ph === 'air' ? '#ff6b5a' : '#ffd36a');
  box(W / 2 - 42 * k, 'HEIGHT', `${Math.max(0, Math.round(a.y * 3.28))} ft`, '#fff');
  const vs = Math.round(a.vy * 196.85); box(W - x - 84 * k, vs >= 0 ? 'CLIMB' : 'SINK', `${Math.abs(vs)} fpm`, a.y < 30 && -a.vy > c.sink * 0.8 && G.ph === 'air' ? '#ff6b5a' : '#fff');
  // on final: where you are against the slope (right edge) and the centre line (under the destination panel)
  if (G.ph === 'air' && G.leg >= 2 && ap.d > -50) { const gs = clamp((a.y - (ap.d + AIM) * Math.tan(GS)) / Math.max(8, ap.d * 0.012), -1, 1), lc = clamp(ap.x / Math.max(15, ap.d * 0.02), -1, 1);
    const sx = W - 20 * k, sy = H * 0.5, sh = 80 * k; ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx, sy - sh); ctx.lineTo(sx, sy + sh); ctx.moveTo(sx - 8 * k, sy); ctx.lineTo(sx + 8 * k, sy); ctx.stroke(); ctx.fillStyle = '#ff7adf'; ctx.beginPath(); const dy = sy - gs * sh; ctx.moveTo(sx, dy - 8 * k); ctx.lineTo(sx + 7 * k, dy); ctx.lineTo(sx, dy + 8 * k); ctx.lineTo(sx - 7 * k, dy); ctx.fill();
    const lx = W / 2, ly = by + 122 * k, lw = 100 * k; ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(lx - lw, ly); ctx.lineTo(lx + lw, ly); ctx.moveTo(lx, ly - 6 * k); ctx.lineTo(lx, ly + 6 * k); ctx.stroke(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#ff7adf'; const dx2 = lx - lc * lw; ctx.beginPath(); ctx.moveTo(dx2 - 8 * k, ly); ctx.lineTo(dx2, ly - 7 * k); ctx.lineTo(dx2 + 8 * k, ly); ctx.lineTo(dx2, ly + 7 * k); ctx.closePath(); ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 3; ctx.stroke(); ctx.fill(); }
  // the power lever (left)
  const tx = 26 * k, ty = H * 0.62, th = 120 * k; ctx.fillStyle = 'rgba(0,0,0,.4)'; rrect(tx - 9 * k, ty - th, 18 * k, th * 2, 9); ctx.fill(); ctx.fillStyle = '#ffd36a'; const ky = ty + th - G.thr * th * 2; rrect(tx - 14 * k, ky - 7 * k, 28 * k, 14 * k, 5); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillText('POWER', tx, ty + th + 14 * k); ctx.fillText(`${Math.round(G.thr * 100)}%`, tx, ty - th - 10 * k);
  if (G.ph === 'takeoff' && G.thr < 0.9 && a.v < 10) { const bob = Math.sin(performance.now() / 200) * 10 * k; ctx.fillStyle = '#ffd36a'; ctx.beginPath(); ctx.moveTo(tx + 24 * k, ty - 40 * k + bob); ctx.lineTo(tx + 36 * k, ty - 20 * k + bob); ctx.lineTo(tx + 12 * k, ty - 20 * k + bob); ctx.closePath(); ctx.fill(); }
  // the four buttons: UP, DOWN, LEFT, RIGHT, always in the same place; the one being pressed lights
  if (G.ph === 'air' || G.ph === 'takeoff') { const P = padAt(), pr = ui.pad || { x: 0, y: 0 }, L = lessonNow(G), auto = !!(L && L.autoPitch && !(L.flareYou && a.y < 14)), rot = G.ph === 'takeoff' && a.v >= VR - 2;
    const btn = (dx, dy, arrow, word, on, glow) => { const bx = P.x + dx * P.d, by2 = P.y - dy * P.d, h = P.s / 2; ctx.fillStyle = on ? 'rgba(255,211,106,.95)' : glow ? 'rgba(120,200,140,.75)' : 'rgba(10,18,28,.55)'; rrect(bx - h, by2 - h, P.s, P.s, 12 * k); ctx.fill(); ctx.strokeStyle = on ? '#fff' : 'rgba(255,255,255,.8)'; ctx.lineWidth = glow ? 4 : 2.5; rrect(bx - h, by2 - h, P.s, P.s, 12 * k); ctx.stroke();
      ctx.fillStyle = on ? '#1a1206' : '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `700 ${Math.round(20 * k)}px ${BC}`; ctx.fillText(arrow, bx, by2 - 7 * k); ctx.font = `700 ${Math.round(10.5 * k)}px ${BC}`; ctx.fillText(word, bx, by2 + 14 * k); };
    btn(0, 1, '▲', 'UP', pr.y > 0, rot && Math.sin(performance.now() / 150) > 0); btn(0, -1, '▼', 'DOWN', pr.y < 0); btn(-1, 0, '◀', 'LEFT', pr.x < 0); btn(1, 0, '▶', 'RIGHT', pr.x > 0); ctx.textBaseline = 'alphabetic';
    if (auto) { ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.fillStyle = '#9be3b5'; const ty2 = P.y - P.d - P.s / 2 - 10 * k; ctx.strokeText('AUTOPILOT IS HELPING WITH THE HEIGHT', P.x - 30 * k, ty2); ctx.fillText('AUTOPILOT IS HELPING WITH THE HEIGHT', P.x - 30 * k, ty2); } }
  // look around: a small note while the view is turned
  if (V3 && (Math.abs(V3.look2.yaw) > 0.15 || Math.abs(V3.look2.pitch) > 0.1)) { ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillText('LOOKING AROUND · LET GO TO LOOK AHEAD', W / 2, H - 22 * k); }
}
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) {
  const D = G.lesson, st = D.steps[D.i], x = 14, w = W - 28, y = 42 * k; ctx.save();
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; const lines = wrapText(st.how, w - 24), h = 54 * k + lines.length * 17 * k;
  ctx.fillStyle = 'rgba(0,0,0,.6)'; rrect(x, y, w, h, 12); ctx.fill(); ctx.strokeStyle = 'rgba(255,211,106,.7)'; ctx.lineWidth = 2; rrect(x, y, w, h, 12); ctx.stroke();
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#ffd36a'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillText(`LESSON ${D.i + 1} OF ${D.steps.length}`, x + 12, y + 10 * k);
  ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(18 * k)}px ${BC}`; ctx.fillText(st.title, x + 12, y + 25 * k);
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.9)'; lines.forEach((l, i) => ctx.fillText(l, x + 12, y + 48 * k + i * 17 * k));
  for (let i = 0; i < st.need; i++) { ctx.beginPath(); ctx.arc(x + w - 16 - (st.need - 1 - i) * 18 * k, y + 18 * k, 6 * k, 0, TAU); if (i < D.n) { ctx.fillStyle = '#8fe0ab'; ctx.fill(); } else { ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; ctx.stroke(); } }
  ctx.restore(); ctx.textBaseline = 'middle';
}
