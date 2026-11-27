// ===================== THE VIEW: Skimming Stones (upright: you stand on the pebbly shore, the lake goes away up the screen) =====================
// A calm lake at golden hour (then sunset, mist, a lilac dusk), pines on the far banks, reeds that lean in the wind, a little
// flag on the shore. The stone flies out from your hand; a ring on the water closes on the spot where it will touch, and turns
// green when it is time to tap. Every kiss leaves rings of ripples that spread and fade. World: x across (+ right; drawn
// mirrored, X = -x, because the camera looks along +z), z out from the shore, y up. Water at y = 0.
const FX = { shake: 0, stop: 0, flash: 0, red: 0, slow: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { snap: true, banner: null, drag: null, cam: null, picks: [], goalSaid: false };
const optShake = () => store.get('shake', true) !== false, optSlow = () => store.get('slow', true) !== false;
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip2(key, txt, secs = 3) { if (HEADLESS) return; tip2.seen = tip2.seen || {}; if (tip2.seen[key]) return; tip2.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 160, up = 60) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - up * k, t: 0, life: 0.4 + Math.random() * 0.5, col, r: (1.2 + Math.random() * 2.4) * k }); } if (PARTS.length > 260) PARTS.splice(0, PARTS.length - 260); }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2.5); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.4) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 380 * k * dt; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (ui.banner) { ui.banner.t += dt; if (ui.banner.t > (ui.banner.secs || 1.6)) ui.banner = null; }
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; } }
function mySkin() { if (typeof HEADLESS !== 'undefined' && HEADLESS) return SKINS[0]; const id = store.get('skin', 'slate'); return SKINS.find(q => q.id === id) || SKINS[0]; }
// ---------- the world ----------
const nz = (x, z) => Math.sin(x * 0.07 + z * 0.03) * 0.5 + Math.sin(x * 0.023 - z * 0.051) * 0.8 + Math.sin(x * 0.17 + z * 0.13) * 0.2;
function hgt(x, z) { const beach = (0.6 - z) * 0.22, far = z > 175 ? Math.min(22, (z - 175) * 0.1 + 1.5 + nz(x, z) * 2.5) : -9, side = Math.abs(x) > 70 ? Math.min(18, (Math.abs(x) - 70) * 0.12 + 1 + nz(x, z) * 2) : -9;
  return Math.max(-1.6, beach, far, side) + nz(x * 3, z * 3) * 0.06; }
function buildWorld() {
  if (V3) return V3; const T = window.THREE; if (!T || !W3 || !W3.init({ canvas: $('gl'), fov: 58, far: 3000, near: 0.1 })) { V3 = { none: true }; return V3; }
  V3 = { T, S: W3.scene, t: 0, for: null }; const V = V3, M = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.7 }, o)); V.M = M; const S = V.S;
  V.lake = W3.water({ size: 3000, color: 0x1a4a5a, distort: 0.5, ripple: 2.2, speed: 0.25, y: 0 });
  W3.terrain({ size: 800, seg: 160, x: 0, z: 150, height: hgt, colour: (x, z, h) => { const n = nz(x * 5, z * 5) * 0.5 + 0.5; if (z < 3 && Math.abs(x) < 60) return [0.46 + n * 0.08, 0.42 + n * 0.07, 0.37 + n * 0.05]; return h > 9 ? [0.18, 0.26 + n * 0.05, 0.15] : h > 0.4 ? [0.24 + n * 0.05, 0.34 + n * 0.06, 0.18] : [0.3, 0.3, 0.24]; } });
  const R0 = W3.rng(7), trees = []; for (let i = 0; i < 700; i++) { const x = (R0() - 0.5) * 600, z = -40 + R0() * 360; if (z < 6 && Math.abs(x) < 90) continue; const h = hgt(x, z); if (h > 1) trees.push({ x: -x, z, y: h - 0.4, s: 0.9 + R0() * 1.0, hue: R0(), shade: R0() * 0.5, rot: R0() * 6 }); } W3.pines(trees, { layers: 4 });
  // pebbles at your feet
  const peb = new T.InstancedMesh(new T.SphereGeometry(1, 7, 5), M(0x8a8478, { roughness: 0.9 }), 90), d = new T.Object3D(), c = new T.Color();
  for (let i = 0; i < 90; i++) { const x = (R0() - 0.5) * 9, z = -2.5 + R0() * 3.2; d.position.set(-x, hgt(x, z) + 0.02, z); d.scale.set(0.06 + R0() * 0.1, 0.03 + R0() * 0.04, 0.05 + R0() * 0.09); d.rotation.y = R0() * 6; d.updateMatrix(); peb.setMatrixAt(i, d.matrix); c.setHSL(0.08 + R0() * 0.05, 0.08 + R0() * 0.1, 0.35 + R0() * 0.3); peb.setColorAt(i, c); } S.add(peb);
  // reeds in clumps along the shore (they lean with the wind)
  V.reeds = []; const reedG = new T.ConeGeometry(0.025, 1.6, 4); reedG.translate(0, 0.8, 0); const reedM = M(0x6a7a3a, { roughness: 0.9 });
  for (const [x, z] of [[-5.5, 1.5], [6, 2.2], [-9, 4], [10, 5], [-14, 8], [15, 9], [-3.8, 0.6], [4.3, 0.9]]) { const g = new T.Group(); for (let j = 0; j < 14; j++) { const r = new T.Mesh(reedG, reedM); r.position.set((R0() - 0.5) * 0.9, -0.1, (R0() - 0.5) * 0.9); r.scale.y = 0.6 + R0() * 0.8; r.rotation.z = (R0() - 0.5) * 0.25; g.add(r); } g.position.set(-x, 0, z); S.add(g); V.reeds.push(g); }
  // the little flag on the shore: it shows the wind
  const pole = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 2.4, 6), M(0x6a4a2a)); pole.position.set(2.2, 1.2 + hgt(-2.2, 0.2), 0.2); S.add(pole);
  V.flag = new T.Mesh(new T.PlaneGeometry(0.7, 0.4, 6, 1), M(0xe8604a, { side: T.DoubleSide, roughness: 0.8 })); V.flag.position.set(2.2, 2.2 + hgt(-2.2, 0.2), 0.2); S.add(V.flag);
  // the stone, and the things on the lake (rebuilt for each lake)
  V.stone = stoneMesh(V, 0, mySkin()); S.add(V.stone); V.lakeG = new T.Group(); S.add(V.lakeG);
  // ripples: a pool of flat rings
  V.rip = []; const rg = new T.RingGeometry(0.86, 1, 40); rg.rotateX(-Math.PI / 2);
  for (let i = 0; i < 28; i++) { const m = new T.Mesh(rg, new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false })); m.position.y = 0.03; m.visible = false; S.add(m); V.rip.push({ m, t: 9, life: 1.6, s: 1 }); }
  W3.setQuality(stepN); return V; }
function stoneMesh(V, kind, sk) { const T = V.T, m = new T.Mesh(new T.SphereGeometry(0.17, 16, 10), V.M(sk.col, { roughness: 0.45 })); const sh = [[1.1, 0.32, 0.9], [0.8, 0.62, 0.8], [1.0, 0.5, 0.95]][kind]; m.scale.set(sh[0], sh[1], sh[2]); m.castShadow = true;
  const band = new T.Mesh(new T.TorusGeometry(0.155, 0.018, 6, 20), V.M(sk.col2, { roughness: 0.4 })); band.rotation.x = Math.PI / 2; band.scale.set(sh[0], sh[2], 1); m.add(band); m.userData.kind = kind; m.userData.sk = sk.id; return m; }
function ripple(x, z, big = 1) { const V = V3; if (!V || V.none) return; for (let j = 0; j < (big > 1.5 ? 3 : 2); j++) { const r = V.rip.reduce((a, b) => b.t > a.t ? b : a); r.t = -j * 0.18; r.life = 1.6 + big * 0.4; r.s = big; r.m.position.set(-x, 0.03, z); r.m.visible = true; } }
function buildLake(V, G) { const T = V.T, M = V.M, g = V.lakeG; while (g.children.length) g.remove(g.children[0]); const L = G.L; V.ringM = []; V.duckM = [];
  for (const r of L.rings) { const t = new T.Mesh(new T.TorusGeometry(r.r, 0.07, 8, 32), M(0xffb04a, { roughness: 0.4, emissive: 0x442200 })); t.position.set(-r.x, r.r * 0.8, r.z); g.add(t);
    const fl = new T.Mesh(new T.CylinderGeometry(0.18, 0.22, 0.2, 10), M(0xf4f0e8)); fl.position.set(-r.x, 0.05, r.z); g.add(fl); V.ringM.push(t); }
  if (L.buoy) { const b = new T.Group(), body = new T.Mesh(new T.CylinderGeometry(0.35, 0.5, 1.1, 12), M(0xe84a3a, { roughness: 0.5 })); body.position.y = 0.4; b.add(body); const band = new T.Mesh(new T.CylinderGeometry(0.4, 0.42, 0.25, 12), M(0xffffff)); band.position.y = 0.55; b.add(band);
    const top = new T.Mesh(new T.SphereGeometry(0.14, 10, 8), M(0xffd36a, { emissive: 0x664400 })); top.position.y = 1.1; b.add(top); b.position.set(-L.buoy.x, 0, L.buoy.z); g.add(b); V.buoyM = b;
    const line = new T.Mesh(new T.PlaneGeometry(60, 0.12), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 })); line.rotation.x = -Math.PI / 2; line.position.set(-L.buoy.x, 0.04, L.buoy.z); g.add(line); } else V.buoyM = null;
  if (L.jetty) { const J = L.jetty, j = new T.Group(), wood = M(0x8a6a48, { roughness: 0.9 }), dark = M(0x5a4430, { roughness: 0.95 }); const n = Math.round(J.d / 0.5);
    for (let i = 0; i < n; i++) { const p = new T.Mesh(new T.BoxGeometry(J.w, 0.08, 0.44), i % 2 ? wood : M(0x947252, { roughness: 0.9 })); p.position.set(0, 0.42, -J.d / 2 + 0.25 + i * 0.5); j.add(p); }
    for (const sx of [-1, 1]) for (let i = 0; i <= 3; i++) { const post = new T.Mesh(new T.CylinderGeometry(0.1, 0.12, 1.6, 7), dark); post.position.set(sx * (J.w / 2 - 0.1), 0, -J.d / 2 + i * J.d / 3); j.add(post); }
    const lamp = new T.Mesh(new T.SphereGeometry(0.16, 10, 8), new T.MeshBasicMaterial({ color: 0xffe0a0 })); lamp.position.set(J.w / 2 - 0.1, 1.0, J.d / 2); j.add(lamp);
    j.position.set(-J.x, 0, J.z); g.add(j); }
  for (const p of L.pads) { const m = new T.Mesh(new T.CylinderGeometry(p.r, p.r, 0.04, 18, 1, false, 0.3, TAU - 0.6), M(0x3a7a3a, { roughness: 0.8 })); m.position.set(-p.x, 0.03, p.z); m.rotation.y = p.x * 3; g.add(m);
    if ((p.x * 10 | 0) % 2) { const f = new T.Mesh(new T.SphereGeometry(0.12, 8, 6), M(0xf8c8d8)); f.scale.y = 0.6; f.position.set(-p.x + 0.2, 0.1, p.z); g.add(f); } }
  for (const d0 of L.ducks) { const d = new T.Group(), white = M(0xf2efe6), brown = M(0x7a5a3a); const body = new T.Mesh(new T.SphereGeometry(0.3, 12, 8), brown); body.scale.set(0.8, 0.6, 1.2); body.position.y = 0.15; d.add(body);
    const head = new T.Mesh(new T.SphereGeometry(0.14, 10, 8), M(0x2a6a3a)); head.position.set(0, 0.42, 0.25); d.add(head); const beak = new T.Mesh(new T.ConeGeometry(0.05, 0.14, 6), M(0xffb02a)); beak.rotation.x = Math.PI / 2; beak.position.set(0, 0.4, 0.4); d.add(beak);
    const tail = new T.Mesh(new T.ConeGeometry(0.08, 0.2, 5), white); tail.rotation.x = -Math.PI / 2.5; tail.position.set(0, 0.25, -0.35); d.add(tail); g.add(d); V.duckM.push(d); } }
function sync(V, G, dt) { V.t += dt; const T = V.T;
  if (V.for !== G) { V.for = G; W3.setSky(PLACES[G.cfg.place].sky, { azim: 50, wind: [G.cfg.wind * 0.2, 0.1] }); buildLake(V, G); ui.cam = null; }
  const sk = mySkin(); if (V.stone.userData.kind !== G.stone || V.stone.userData.sk !== sk.id) { V.S.remove(V.stone); V.stone = stoneMesh(V, G.stone, sk); V.S.add(V.stone); }
  // the stone: in your hand, flying (spinning), or gone under
  const s = G.s; if (s && G.phase === 'fly') { V.stone.visible = true; V.stone.position.set(-s.x, s.y + 0.03, s.z); V.stone.rotation.set(0.12 + (s.extra ? Math.sin(V.t * 40) * 0.3 : 0), V.t * 30, 0); }
  else if (G.phase === 'aim') { const a = G.aim, p = a ? a.pow : 0; V.stone.visible = true; V.stone.position.set(-(a ? -Math.sin(a.ang) * 0.4 * p : 0), 1.7 - p * 0.3, 1.3 - p * 0.5); V.stone.rotation.set(0.1, 0, 0); }
  else V.stone.visible = false;
  // the lake's things
  G.L.rings.forEach((r, i) => { const m = V.ringM[i]; if (!m) return; m.material.color.set(r.done ? 0x8fe0ab : 0xffb04a); m.material.emissive.set(r.done ? 0x1a4a2a : 0x442200); m.position.y = r.r * 0.8 + Math.sin(V.t * 1.3 + i) * 0.04; });
  if (V.buoyM) V.buoyM.rotation.z = Math.sin(V.t * 1.1) * 0.06;
  G.L.ducks.forEach((d, i) => { const p = duckPos(d, G.t), m = V.duckM[i]; if (!m) return; const vx = Math.cos(d.w * G.t + d.ph); m.position.set(-p.x, Math.sin(V.t * 2 + i) * 0.02, p.z); m.rotation.y = vx > 0 ? -Math.PI / 2 : Math.PI / 2; });
  // wind: reeds lean, the flag streams
  const w = G.cfg.wind; for (const [i, r] of V.reeds.entries()) r.rotation.z = w * 0.06 + Math.sin(V.t * (1.2 + Math.abs(w) * 0.6) + i) * (0.03 + Math.abs(w) * 0.025);
  { const f = V.flag, a = f.geometry.attributes.position; for (let i = 0; i < a.count; i++) { const u = (a.getX(i) + 0.35) / 0.7; a.setZ(i, Math.sin(V.t * (3 + Math.abs(w)) - u * 4) * 0.08 * u); } a.needsUpdate = true; const ang = clamp(w / 3.2, -1, 1);
    f.rotation.y = Math.abs(w) < 0.3 ? Math.PI / 2 * 0.8 : ang > 0 ? Math.PI : 0; f.position.x = 2.2 + (Math.abs(w) < 0.3 ? 0 : (ang > 0 ? -0.35 : 0.35)); f.rotation.z = Math.abs(w) < 0.3 ? -1.2 : -0.35 + Math.abs(ang) * 0.3; }
  // ripples
  for (const r of V.rip) { r.t += dt; if (r.t < 0) { r.m.visible = false; continue; } if (r.t > r.life) { r.m.visible = false; continue; } const u = r.t / r.life; r.m.visible = true; r.m.scale.setScalar(0.15 + u * 1.8 * r.s); r.m.material.opacity = (1 - u) * 0.55; }
  // the camera: behind your shoulder while you aim; then it follows the stone, a little behind and above, looking ahead
  let want; if (G.phase === 'aim' || !s) want = { pos: [0, 4.2, -3.5], at: [0, 0, 18] };
  else { const X = -s.x, z = s.z, h = 3.4 + Math.min(4, z * 0.05); want = { pos: [X * 0.7, h, z - 6.5 - Math.min(3, z * 0.04)], at: [X, 0, z + 10] }; }
  if (G.phase === 'rest' && ui.cam) want = { pos: ui.cam.pos.slice(), at: ui.cam.at.slice() };
  if (!ui.cam || ui.snap) { ui.cam = { pos: want.pos.slice(), at: want.at.slice() }; ui.snap = false; } else { const a = Math.min(1, dt * (G.phase === 'fly' ? 5 : 3)); for (let i = 0; i < 3; i++) { ui.cam.pos[i] += (want.pos[i] - ui.cam.pos[i]) * a; ui.cam.at[i] += (want.at[i] - ui.cam.at[i]) * a; } }
  const shk = FX.shake > 0 && optShake() ? (Math.random() - 0.5) * FX.shake * 0.01 : 0, cam = W3.cam; cam.position.set(ui.cam.pos[0] + shk, ui.cam.pos[1] + shk, ui.cam.pos[2]); cam.lookAt(ui.cam.at[0], ui.cam.at[1], ui.cam.at[2]); cam.updateMatrixWorld();
  W3.setFocus(s ? -s.x : 0, 0, s ? s.z : 6, 24); }
function scrOf(x, y, z) { if (!V3 || V3.none) return null; return W3.screen(new V3.T.Vector3(-x, y, z)); }
function stoneScr(G) { const s = G.s; if (s && G.phase === 'fly') return scrOf(s.x, s.y, s.z); return { x: W / 2, y: H * 0.78 }; }
// ---------- events ----------
function onEvent(G, e) { const sc = (e.x != null ? scrOf(e.x, 0, e.z) : null) || stoneScr(G) || { x: W / 2, y: H / 2 };
  switch (e.k) {
    case 'throw': sfx.throw(e.v); ui.snap = false; ui.goalSaid = ui.goalSaid && G.goalHit; break;
    case 'kiss': ripple(e.x, e.z, e.q === 'perfect' ? 1.3 : 1); sfx.kiss(e.q, e.n);
      if (e.q === 'perfect') { burst(sc.x, sc.y, 'rgba(255,255,255,.95)', 10, 150, 70); say(e.late ? 'JUST IN TIME' : 'PERFECT', sc.x, sc.y - 34 * k, '#ffe08a', 22); vibe(HAP.tick); }
      else if (e.q === 'good') { burst(sc.x, sc.y, 'rgba(255,255,255,.8)', 6, 120, 50); say(e.late ? 'A TOUCH LATE' : 'GOOD', sc.x, sc.y - 34 * k, '#bfe8ff', 18); }
      else { burst(sc.x, sc.y, 'rgba(200,230,255,.8)', 8, 90, 30); say(e.quiet || e.none ? 'TAP!' : e.early ? 'TOO EARLY' : 'TOO LATE', sc.x, sc.y - 34 * k, '#ffb4a8', 18);
        if (e.quiet || e.none) tip2('notap', 'Tap each time the stone touches the water: when the ring closes on it and turns green.', 3.4); else tip2(e.early ? 'early' : 'late', e.early ? 'A little early: wait until the ring is small and green.' : 'A little late: tap as the ring turns green, just before it touches.', 3); }
      if (e.n >= 5 && e.q !== 'miss') say(`${e.n}`, W / 2, H * 0.2, '#ffffff', 30 + Math.min(20, e.n)); break;
    case 'wobble': sfx.wobble(); tip2('wob', 'One tap for each kiss: extra taps make the stone wobble and slow down.', 3); break;
    case 'ring': sfx.ring(e.n); FX.flash = 0.3; vibe(HAP.light); say(`RING ${e.n} OF ${e.of}`, W / 2, H * 0.3, '#8fe0ab', 26); break;
    case 'jetty': sfx.jetty(); vibe(HAP.best); FX.flash = 0.5; ui.banner = { txt: 'ON THE JETTY!', t: 0, secs: 1.8 }; break;
    case 'sink': ripple(e.x, e.z, 2); sfx.sink(); ui.banner = { txt: `${e.skips} skip${e.skips === 1 ? '' : 's'} · ${Math.round(e.far)} m`, sub: null, t: 0, secs: 1.4, small: true }; break;
    case 'duck': ripple(e.x, e.z, 1.6); sfx.duck(); ui.banner = { txt: 'A DUCK!', sub: 'They paddle side to side: wait for a gap, or aim around', t: 0, secs: 2.2, small: true }; break;
    case 'pad': ripple(e.x, e.z, 1.4); sfx.pad(); ui.banner = { txt: 'ON A LILY PAD', sub: 'Lily pads stop a stone: aim between them', t: 0, secs: 2.2, small: true }; break;
    case 'stone': sfx.pick(); break;
    case 'advice': ui.adv = { txt: e.txt, t: 0, path: e.path, prev: e.prev, far: e.far, x: e.x, good: e.txt === 'GREAT RELEASE' }; break;
    case 'ready': if (e.left === 1) tip2('last', 'Last stone: take your time.', 2); break;
    case 'lessonnext': if (e.first) hint = null; say('FIRST, A LESSON', W / 2, H * 0.36, '#ffd36a', 26); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, W / 2, H * 0.42, '#8fe0ab', 26); sfx.coin(e.n); break;
    case 'lessondone': say('NOW FOR THE LAKE!', W / 2, H * 0.36, '#ffd36a', 28); sfx.fanfare(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.fanfare(); FX.flash = 0.5; vibe(HAP.best); break;
    case 'lost': sfx.lose(); ui.banner = { txt: 'OUT OF STONES', sub: 'So close: try again', t: 0, secs: 2 }; break;      // (P11: never vibrate on failure)
  } }
// ---------- the picture ----------
let IG = null, IM = {}; function idleG() { if (!IG || IG.over || IG.t > 60) { IG = newGame(6, { seed: (Math.random() * 1e6) | 0, free: true }); IM = {}; } honest(IG, { react: 0.15, acc: 0.95 }, IM); step(IG, 1 / 60); for (const e of IG.ev) if (e.k === 'kiss') ripple(e.x, e.z, 1); IG.ev.length = 0; return IG; }
// where the aimed stone will go (perfect taps, no wind): a few dots for the first hops
function aimPath(G) { const a = G.aim || (G.phase === 'aim' ? { ang: G.dir || 0, pow: Math.max(G.pull || 0, 0.3) } : null); if (!a || a.pow < 0.08) return []; const v = (7 + 19 * a.pow) * (0.85 + 0.15 * 0.9) * (1 + 0.05 * upLv('arm')), st = STONES[G.stone], out = []; let x = 0, z = 0.8, y = H0, vx = Math.sin(a.ang) * v, vz = Math.cos(a.ang) * v, vy = 0.5 + 2.5 * a.pow, n = 0;
  for (let i = 0; i < 900 && n < 3; i++) { const dt = 1 / 60; vy -= GRAV * dt; x += vx * dt; z += vz * dt; y += vy * dt; if (i % 3 === 0) out.push([x, Math.max(0, y), z, n]); if (y <= 0) { y = 0; n++; const kk = kissK('perfect', st); vx *= kk; vz *= kk; vy = Math.hypot(vx, vz) * Math.tan(0.16 * st.flat + 0.04) * 1.05; out.push([x, 0, z, n, 1]); } } return out; }
function draw(now, dt) { if (ui.adv) { ui.adv.t += dt || 0; if (ui.adv.t > 3.2) ui.adv = null; }
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#2a4a5a'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D lake.', W / 2, H / 2); if (G) hud(G, now); return; }
  const g = G || idleG(); sync(V, g, dt || 1 / 60); W3.render(dt || 1 / 60);
  if (G && !(G.over && !$('ovEnd').classList.contains('hidden'))) hud(G, now);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 1.1 ? 1 : 1 - (t2.t - 1.1) / 0.5; ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(t2.size * k)}px ${TF}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(30,25,45,.7)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 18); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 18); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, Math.min(W - 50 * k, 420 * k)), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30, hy = H * 0.62 - h / 2;
    ctx.fillStyle = 'rgba(30,25,45,.88)'; rrect(W / 2 - w / 2, hy - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, hy - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,240,220,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); } }
// ---------- the HUD ----------
function layout(G) { const r = 26 * k, y = H - 44 * k, gap = 64 * k; return { picks: STONES.map((q, i) => ({ i, x: W / 2 + (i - 1) * gap, y, r })), throwY: H * 0.5, pad: { x: 92 * k, y: H - 190 * k, r: 66 * k }, sling: { x: W - 84 * k, y: H - 300 * k, h: 190 * k } }; }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of String(t).split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function txt(s, x, y, col = '#fff', font, al = 'center') { ctx.textAlign = al; if (font) ctx.font = font; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(30,25,45,.7)'; ctx.strokeText(s, x, y); ctx.fillStyle = col; ctx.fillText(s, x, y); }
function goalProgress(G) { const c = G.cfg, b = G.best; if (c.kind === 'skips') return [b.skips, c.skips, `best ${b.skips} / ${c.skips}`];
  if (c.kind === 'far') return [Math.min(b.far, c.far), c.far, `best ${Math.round(b.far)} / ${c.far} m`];
  if (c.kind === 'rings') { const n = G.L.rings.filter(r => r.done).length; return [n, G.L.rings.length, `${n} / ${G.L.rings.length} rings`]; }
  const on = G.log.some(l => l.why === 'jetty'); return [on ? 1 : 0, 1, on ? 'on it!' : 'not yet']; }
function hud(G, now) { ctx.textBaseline = 'middle'; const L = layout(G), s = G.s;
  // the goal, the stones left (top)
  { const y = 30 * k, w = Math.min(W - 70 * k, 330 * k), x0 = W / 2 - w / 2 + 18 * k; ctx.fillStyle = 'rgba(30,25,45,.55)'; rrect(x0, y - 18 * k, w, 52 * k, 12); ctx.fill();
    txt(G.lesson ? 'Lesson' : G.free ? 'Just skim: no goal, no limit' : goalText(G.cfg), x0 + w / 2, y - 3 * k, '#fff', `700 ${Math.round(19 * k)}px ${TF}`);
    if (!G.lesson && !G.free) { const [a, b, t] = goalProgress(G), u = clamp(a / b, 0, 1), bw = w * 0.36; ctx.fillStyle = 'rgba(255,255,255,.2)'; rrect(x0 + 12 * k, y + 15 * k, bw, 7 * k, 3); ctx.fill(); ctx.fillStyle = u >= 1 ? '#8fe0ab' : '#ffc98a'; rrect(x0 + 12 * k, y + 15 * k, bw * u, 7 * k, 3); ctx.fill();
      txt(t, x0 + 20 * k + bw, y + 18 * k, 'rgba(255,255,255,.9)', `700 ${Math.round(11 * k)}px ${BC}`, 'left');
      for (let i = 0; i < G.left; i++) { ctx.fillStyle = '#d8d0c4'; ctx.beginPath(); ctx.ellipse(x0 + w - 14 * k - i * 12 * k, y + 18 * k, 4.5 * k, 2.8 * k, 0, 0, TAU); ctx.fill(); } } }
  // your best so far: a dashed line across the water, marked BEST (so a stone that falls just short shows it)
  if (G.best.far > 3 && (G.phase === 'aim' || G.phase === 'fly')) { const a = scrOf(-9, 0.02, G.best.far), b = scrOf(9, 0.02, G.best.far); if (a && b && a.front && b.front) { ctx.setLineDash([8 * k, 6 * k]); ctx.strokeStyle = 'rgba(255,224,138,.85)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.setLineDash([]); txt(`BEST ${Math.round(G.best.far)} m`, b.x - 30 * k, b.y - 10 * k, '#ffe08a', `700 ${Math.round(11 * k)}px ${BC}`); } }
  // after a throw: what to change (a few words), and a little replay of the throw seen from above (the dashed line: your best before it)
  if (ui.adv) { const A = ui.adv, al = Math.min(1, A.t / 0.2, (3.2 - A.t) / 0.4); if (al > 0) { ctx.globalAlpha = al; txt(A.txt, W / 2, H * 0.3, A.good ? '#8fe0ab' : '#ffd36a', `400 ${Math.round(30 * k)}px ${TF}`);
      const bw = 96 * k, bh = 150 * k, bx = W - bw - 12 * k, by = 128 * k, far = Math.max(30, A.far + 6, A.prev + 6), sx = q => bx + bw / 2 + q / 16 * bw / 2, sz = q => by + bh - 8 * k - q / far * (bh - 16 * k);
      ctx.fillStyle = 'rgba(20,40,60,.7)'; rrect(bx, by, bw, bh, 10); ctx.fill(); if (A.prev > 0) { ctx.setLineDash([5, 4]); ctx.strokeStyle = 'rgba(255,224,138,.8)'; ctx.beginPath(); ctx.moveTo(bx + 4, sz(A.prev)); ctx.lineTo(bx + bw - 4, sz(A.prev)); ctx.stroke(); ctx.setLineDash([]); }
      const pts = [{ x: 0, z: 0.8 }].concat(A.path || []).concat([{ x: A.x, z: A.far }]), u = clamp(A.t / 1.6, 0, 1), n = Math.max(1, Math.floor(u * (pts.length - 1)));
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); pts.slice(0, n + 1).forEach((p, i) => i ? ctx.lineTo(sx(p.x), sz(p.z)) : ctx.moveTo(sx(p.x), sz(p.z))); ctx.stroke();
      for (const p of pts.slice(1, n + 1)) { ctx.strokeStyle = 'rgba(160,210,255,.9)'; ctx.beginPath(); ctx.ellipse(sx(p.x), sz(p.z), 4 * k, 1.8 * k, 0, 0, TAU); ctx.stroke(); }
      const q = pts[n]; ctx.fillStyle = '#d8d0c4'; ctx.beginPath(); ctx.arc(sx(q.x), sz(q.z), 3.5 * k, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; } }
  // the wind (top right, under the goal)
  if (Math.abs(G.cfg.wind) > 0.1) { const w = G.cfg.wind, y = 92 * k, x = W - 54 * k; ctx.fillStyle = 'rgba(30,25,45,.5)'; rrect(x - 40 * k, y - 15 * k, 80 * k, 30 * k, 10); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5 * k; const d = w > 0 ? 1 : -1, len = 10 + Math.min(16, Math.abs(w) * 5); ctx.beginPath(); ctx.moveTo(x - 16 * k - d * len * 0.5 * k, y); ctx.lineTo(x - 16 * k + d * len * 0.5 * k, y); ctx.lineTo(x - 16 * k + d * (len * 0.5 - 5) * k, y - 4 * k); ctx.moveTo(x - 16 * k + d * len * 0.5 * k, y); ctx.lineTo(x - 16 * k + d * (len * 0.5 - 5) * k, y + 4 * k); ctx.stroke();
    txt(`wind ${Math.abs(w).toFixed(1)}`, x + 14 * k, y + 1, '#fff', `700 ${Math.round(12 * k)}px ${BC}`); }
  if (G.phase === 'aim') {
    // the aim line, then the stone picker
    const P = aimPath(G); if (P.length) { for (const p of P) { const sc = scrOf(p[0], p[1], p[2]); if (!sc || !sc.front) continue; const al = Math.max(0.15, 0.9 - p[3] * 0.3); if (p[4]) { for (const [c2, lw] of [[`rgba(40,30,50,${al * 0.6})`, 4], [`rgba(255,236,200,${al})`, 2]]) { ctx.strokeStyle = c2; ctx.lineWidth = lw; ctx.beginPath(); ctx.ellipse(sc.x, sc.y, 9 * k, 3.5 * k, 0, 0, TAU); ctx.stroke(); } } else { ctx.fillStyle = `rgba(40,30,50,${al * 0.6})`; ctx.beginPath(); ctx.arc(sc.x, sc.y, 3.8 * k, 0, TAU); ctx.fill(); ctx.fillStyle = `rgba(255,236,200,${al})`; ctx.beginPath(); ctx.arc(sc.x, sc.y, 2.6 * k, 0, TAU); ctx.fill(); } }
 }
    // the AIM PAD (left): the dot is your direction (left/right) and the stone's angle to the water (up = steeper); the angle is written beside it
    { const Pd = L.pad, dx = -(G.dir || 0) / -0.7, ty = G.tilt == null ? 0.5 : G.tilt, dX = Pd.x + clamp(dx, -1, 1) * Pd.r, dY = Pd.y - (ty - 0.5) * 2 * Pd.r, deg = Math.round(DEG(ty));
      ctx.fillStyle = 'rgba(30,25,45,.5)'; ctx.beginPath(); ctx.arc(Pd.x, Pd.y, Pd.r, 0, TAU); ctx.fill(); ctx.strokeStyle = ui.pad ? '#ffe08a' : 'rgba(255,255,255,.55)'; ctx.lineWidth = 2.5; ctx.stroke();
      if (G.lesson) { const y1 = Pd.y - (0.25 - 0.5) * 2 * Pd.r, y2 = Pd.y - (0.5 - 0.5) * 2 * Pd.r; ctx.fillStyle = 'rgba(143,224,171,.35)'; ctx.fillRect(Pd.x - Pd.r * 0.9, y2, Pd.r * 1.8, y1 - y2); }      // the good angles (15-25 degrees), in the lesson only
      ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(Pd.x - Pd.r, Pd.y); ctx.lineTo(Pd.x + Pd.r, Pd.y); ctx.moveTo(Pd.x, Pd.y - Pd.r); ctx.lineTo(Pd.x, Pd.y + Pd.r); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(dX, dY, 13 * k, 0, TAU); ctx.fill();
      const ax = Pd.x + Pd.r + 4 * k, ay = Pd.y - Pd.r - 6 * k, a = deg * Math.PI / 180; ctx.strokeStyle = 'rgba(160,210,255,.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ax - 22 * k, ay + 10 * k); ctx.lineTo(ax + 14 * k, ay + 10 * k); ctx.stroke();      // the water line, and the stone at its angle
      ctx.save(); ctx.translate(ax - 4 * k, ay + 6 * k); ctx.rotate(-a); ctx.fillStyle = '#d8d0c4'; ctx.beginPath(); ctx.ellipse(0, 0, 12 * k, 3.6 * k, 0, 0, TAU); ctx.fill(); ctx.restore();
      txt(`${deg}°`, ax + 6 * k, ay - 10 * k, '#fff', `700 ${Math.round(14 * k)}px ${BC}`); txt('AIM', Pd.x, Pd.y - Pd.r - 10 * k, '#fff', `700 ${Math.round(12 * k)}px ${BC}`); }
    // the THROW (right): the stone in its slot, pulled back as far as you have pulled it
    { const Sl = L.sling, p = G.pull || 0, sy = Sl.y + p * Sl.h; ctx.fillStyle = 'rgba(30,25,45,.45)'; rrect(Sl.x - 30 * k, Sl.y - 24 * k, 60 * k, Sl.h + 48 * k, 30 * k); ctx.fill(); ctx.strokeStyle = ui.sling ? '#ffe08a' : 'rgba(255,255,255,.55)'; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.fillStyle = p > 0.85 ? '#ff9a6a' : '#ffc98a'; rrect(Sl.x - 6 * k, Sl.y, 12 * k, p * Sl.h, 6 * k); ctx.fill(); ctx.fillStyle = '#d8d0c4'; ctx.beginPath(); ctx.ellipse(Sl.x, sy, 20 * k, 9 * k, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1.5; ctx.stroke();
      txt(p > 0.02 ? `${Math.round(p * 100)}%` : 'THROW', Sl.x, Sl.y - 34 * k, '#fff', `700 ${Math.round(12 * k)}px ${BC}`); }
    for (const p of L.picks) { const on = p.i === G.stone, st = STONES[p.i]; ctx.fillStyle = on ? 'rgba(255,201,138,.9)' : 'rgba(30,25,45,.6)'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); ctx.strokeStyle = on ? '#fff' : 'rgba(255,255,255,.4)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = on ? '#3a2a1a' : '#ddd'; ctx.beginPath(); const sh = [[1.3, 0.45], [0.9, 0.85], [1.15, 0.7]][p.i]; ctx.ellipse(p.x, p.y - 4 * k, 11 * k * sh[0], 11 * k * sh[1], 0, 0, TAU); ctx.fill();
      txt(st.name.split(' ')[0].toLowerCase(), p.x, p.y + 15 * k, on ? '#3a2a1a' : '#fff', `700 ${Math.round(10 * k)}px ${BC}`); ctx.strokeStyle = 'transparent'; }
    if (!G.lesson && G.N >= 5 && Math.abs(G.cfg.wind) > 2 && G.stone !== 2) tip2('heavy', 'Strong wind: the heavy stone shrugs it off.', 3); }
  if (G.phase === 'fly' && s) {
    // the ring that closes on the spot where the stone will touch: tap when it is small and green
    const tx = s.x + s.vx * s.tdT, tz = s.z + s.vz * s.tdT, sc = scrOf(tx, 0.02, tz), gd = G.cfg.good * (1 + 0.2 * upLv('eye')), pw = G.cfg.perfect * (1 + 0.2 * upLv('eye'));
    if (sc && sc.front && s.tdT < 0.9) { const u = clamp(s.tdT / 0.9, 0, 1), r = (8 + u * 46) * k, inP = s.tdT <= pw, inG = s.tdT <= gd; ctx.lineWidth = (inP ? 7 : 6) * k; ctx.strokeStyle = 'rgba(30,25,45,.45)'; ctx.beginPath(); ctx.ellipse(sc.x, sc.y, r, r * 0.42, 0, 0, TAU); ctx.stroke(); ctx.lineWidth = (inP ? 4 : 3) * k; ctx.strokeStyle = inP ? '#5ef0a0' : inG ? '#d8f080' : '#ffc98a'; ctx.beginPath(); ctx.ellipse(sc.x, sc.y, r, r * 0.42, 0, 0, TAU); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(sc.x, sc.y, 8 * k, 3.4 * k, 0, 0, TAU); ctx.stroke(); }
    { const sh = scrOf(s.x, 0.01, s.z); if (sh && sh.front) { const a2 = clamp(1 - s.y / 3, 0.2, 0.7); ctx.fillStyle = `rgba(20,15,30,${a2})`; ctx.beginPath(); ctx.ellipse(sh.x, sh.y, 7 * k, 2.6 * k, 0, 0, TAU); ctx.fill(); } }
    txt(`${s.skips}`, W / 2, H * 0.14 + 26 * k, '#fff', `700 ${Math.round(34 * k)}px ${TF}`); txt(`skips · ${Math.round(s.z)} m`, W / 2, H * 0.14 + 52 * k, 'rgba(255,255,255,.85)', `700 ${Math.round(12 * k)}px ${BC}`);
    if (G.throws <= 2 && G.N <= 3) txt('TAP as it touches', W / 2, H * 0.8, 'rgba(255,255,255,.9)', `700 ${Math.round(16 * k)}px ${BC}`); }
  if (G.goalHit && !ui.goalSaid && !G.over) { ui.goalSaid = true; sfx.goal(); vibe(HAP.light); ui.banner = { txt: 'DONE IT!', sub: 'Watch it go…', t: 0, secs: 1.4, small: true }; }
  if (G.lesson) lessonPanel(G);
  if (ui.banner) { const b = ui.banner, a = Math.min(1, b.t / 0.2, ((b.secs || 1.6) - b.t) / 0.4); ctx.globalAlpha = Math.max(0, a); txt(b.txt, W / 2, H * 0.34, '#ffd9a0', `700 ${Math.round((b.small ? 30 : 40) * k)}px ${TF}`); if (b.sub) txt(b.sub, W / 2, H * 0.34 + 28 * k, '#fff', `700 ${Math.round(14 * k)}px ${BC}`); ctx.globalAlpha = 1; } }
function lessonPanel(G) { coachPanel(G); }
