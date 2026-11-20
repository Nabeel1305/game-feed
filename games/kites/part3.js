
// ===================== THE VIEW: Kite Fighter in 3D (three.js; sky, light, shadows from tools/world3d.js) =====================
// You stand on a flat roof among a whole city of rooftops (water tanks, washing lines, parapets) and look up into the sky
// where the kites fly: each a paper diamond with a tail, each on a long line that sags back to a flyer on a far roof. Lines
// that cross throw sparks; a cut kite tumbles away with its line falling. At night lanterns float up among the kites.
const FX = { shake: 0, stop: 0, flash: 0, red: 0, slow: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { snap: true, cam: null, banner: null };
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 160) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: 0.5 + Math.random() * 0.4, col, r: (1.5 + Math.random() * 2.5) * k }); } if (PARTS.length > 240) PARTS.splice(0, PARTS.length - 240); }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2.5); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.4) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (ui.banner) { ui.banner.t += dt; if (ui.banner.t > (ui.banner.secs || 1)) ui.banner = null; }
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; } }
const hex = n => '#' + n.toString(16).padStart(6, '0');
function mySkin() { if (typeof HEADLESS !== 'undefined' && HEADLESS) return SKINS[0]; const id = store.get('skin', 'sun'); return SKINS.find(q => q.id === id) || SKINS[0]; }
const KZ = -KITE_Z, kw = (x, y) => [x, y, KZ];      // a point in the kites' plane, in the world
function canvasTex(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
function kiteTex(col, design) { return canvasTex(128, 128, (g, w, h) => { const c = hex(col); g.fillStyle = c; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.85)';
  if (design % 3 === 0) { g.beginPath(); g.arc(w / 2, h / 2, 26, 0, TAU); g.fill(); } else if (design % 3 === 1) { g.fillRect(0, h / 2 - 12, w, 24); g.fillRect(w / 2 - 12, 0, 24, h); } else { g.beginPath(); g.moveTo(0, 0); g.lineTo(w, h); g.lineTo(0, h); g.fill(); }
  g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4); }); }
function buildWorld() {
  if (V3) return V3; const T = window.THREE; if (!T || !W3 || !W3.init({ canvas: $('gl'), fov: 60, far: 3000, near: 0.2 })) { V3 = { none: true }; return V3; }
  V3 = { T, S: W3.scene, built: null, t: 0 }; const V = V3, S = V.S; V.boxG = new T.BoxGeometry(1, 1, 1); V.cylG = new T.CylinderGeometry(1, 1, 1, 16);
  const ground = new T.Mesh(new T.PlaneGeometry(2000, 2000), new T.MeshStandardMaterial({ color: 0x8a7a64, roughness: 0.95 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -12; S.add(ground);
  // the city: roofs at about the height of yours (0), stepping down and away; tanks, parapets, washing lines
  const R = W3.rng(17), houses = [], tanks = [], walls = [0xe8d8b8, 0xd8b088, 0xf0c8a0, 0xc8d8e0, 0xe8a888, 0xb8d0b0, 0xf2e2c2, 0xd0b8d8];
  for (let gx = -14; gx <= 14; gx++) for (let gz = -16; gz <= 3; gz++) { const x = gx * 9 + (R() - 0.5) * 2, z = gz * 9 + (R() - 0.5) * 2; if (Math.abs(x) < 6 && z > -6 && z < 8) continue; const top = -0.4 + (R() - 0.6) * 4 - Math.max(0, -z - 90) * 0.02, w = 7 + R() * 2, d = 7 + R() * 2;
    houses.push({ x, z, w, d, top, c: walls[(R() * walls.length) | 0] }); if (R() < 0.35) tanks.push({ x: x + (R() - 0.5) * 3, z: z + (R() - 0.5) * 3, y: top }); }
  { const m = new T.InstancedMesh(V.boxG, new T.MeshStandardMaterial({ roughness: 0.85 }), houses.length), d = new T.Object3D(), c = new T.Color(); houses.forEach((h, i) => { const hh = h.top + 12; d.position.set(h.x, h.top - hh / 2, h.z); d.scale.set(h.w, hh, h.d); d.updateMatrix(); m.setMatrixAt(i, d.matrix); m.setColorAt(i, c.setHex(h.c)); }); m.castShadow = true; m.receiveShadow = true; S.add(m);
    const pm = new T.InstancedMesh(V.boxG, new T.MeshStandardMaterial({ color: 0xf2ece0, roughness: 0.8 }), houses.length * 2); let n = 0; houses.forEach(h => { for (const [sx, sz, sw, sd] of [[0, h.d / 2, h.w, 0.2], [h.w / 2, 0, 0.2, h.d]]) { d.position.set(h.x + sx, h.top + 0.45, h.z + sz); d.scale.set(sw, 0.9, sd); d.updateMatrix(); pm.setMatrixAt(n++, d.matrix); } }); pm.castShadow = true; S.add(pm);
    const tm = new T.InstancedMesh(V.cylG, new T.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.5 }), tanks.length); tanks.forEach((t, i) => { d.position.set(t.x, t.y + 1.0, t.z); d.scale.set(0.8, 2, 0.8); d.updateMatrix(); tm.setMatrixAt(i, d.matrix); }); tm.castShadow = true; S.add(tm); }
  // your roof: the floor you stand on, a parapet, a washing line
  const roof = new T.Mesh(V.boxG, new T.MeshStandardMaterial({ color: 0xc8b89a, roughness: 0.9, map: W3.grainTex(256, 3, 200, 40, 3) })); roof.scale.set(12, 1, 14); roof.position.set(0, -0.5, 1); roof.receiveShadow = true; S.add(roof);
  for (const [x, z, w, d] of [[0, -6, 12, 0.3], [-6, 1, 0.3, 14], [6, 1, 0.3, 14]]) { const p = new T.Mesh(V.boxG, new T.MeshStandardMaterial({ color: 0xe8e0d0 })); p.scale.set(w, 1, d); p.position.set(x, 0.5, z); p.castShadow = true; S.add(p); }
  { const clothes = [0xe8463c, 0x2f7de0, 0xf2c230, 0xffffff, 0x2fb060]; for (let i = 0; i < 5; i++) { const c = new T.Mesh(V.boxG, new T.MeshStandardMaterial({ color: clothes[i], roughness: 0.9 })); c.scale.set(0.6, 0.8, 0.05); c.position.set(-4.5 + i * 0.9, 1.6, -4.5); c.castShadow = true; S.add(c); } }
  // the flyer (you): seen from behind, a spool in hand
  V.me = new T.Group(); const body = new T.Mesh(new T.CapsuleGeometry(0.28, 0.9, 4, 10), new T.MeshStandardMaterial({ color: 0x2f7de0, roughness: 0.7 })); body.position.y = 1.0; V.me.add(body); const hd = new T.Mesh(new T.SphereGeometry(0.2, 14, 10), new T.MeshStandardMaterial({ color: 0x8d5524 })); hd.position.y = 1.75; V.me.add(hd);
  V.spool = new T.Mesh(V.cylG, new T.MeshStandardMaterial({ color: 0xd8a040 })); V.spool.scale.set(0.16, 0.25, 0.16); V.spool.rotation.x = Math.PI / 2; V.spool.position.set(0.35, 1.3, -0.3); V.me.add(V.spool); V.me.traverse(o => o.castShadow = true); V.me.position.set(0.6, 0, 1.5); S.add(V.me);
  V.lineM = new T.MeshBasicMaterial({ color: 0xffffff, side: T.DoubleSide }); V.kites = []; V.lines = []; V.rings = []; V.lanterns = [];
  W3.setQuality(stepN); return V; }
function makeKite(V, col, design, glow) { const T = V.T, g = new T.Group(), m = new T.MeshStandardMaterial({ map: kiteTex(col, design), side: T.DoubleSide, roughness: 0.6, emissive: glow ? 0x332200 : 0x000000 });
  const body = new T.Mesh(new T.PlaneGeometry(5.2, 5.2), m); body.rotation.z = Math.PI / 4; g.add(body); const sp = new T.Mesh(V.boxG, new T.MeshStandardMaterial({ color: 0x6a4a2a })); sp.scale.set(0.12, 7.2, 0.12); g.add(sp);
  const tail = []; for (let i = 0; i < 7; i++) { const t = new T.Mesh(new T.PlaneGeometry(1.0, 1.0), new T.MeshBasicMaterial({ color: i % 2 ? 0xffffff : col, side: T.DoubleSide })); g.parent; tail.push(t); }
  return { g, tail, body, trail: [] }; }
function lineMesh(V, col) { const T = V.T, n = 24, geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(new Float32Array(n * 2 * 3), 3)); const idx = []; for (let i = 0; i < n - 1; i++) idx.push(2 * i, 2 * i + 1, 2 * i + 2, 2 * i + 1, 2 * i + 3, 2 * i + 2); geo.setIndex(idx);
  const m = new T.Mesh(geo, new T.MeshBasicMaterial({ color: col, side: T.DoubleSide, transparent: true, opacity: 0.9 })); m.frustumCulled = false; V.S.add(m); return m; }
function setLine(m, a, b, sag, w) { const p = m.geometry.attributes.position, n = p.count / 2; for (let i = 0; i < n; i++) { const t = i / (n - 1), x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t - Math.sin(t * Math.PI) * sag, z = a[2] + (b[2] - a[2]) * t;
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L * w, ny = dx / L * w; p.setXYZ(2 * i, x + nx, y + ny, z); p.setXYZ(2 * i + 1, x - nx, y - ny, z); } p.needsUpdate = true; }
function buildRound(V, g) { const T = V.T; V.built = g; for (const kk of V.kites) { V.S.remove(kk.g); for (const t of kk.tail) V.S.remove(t); } for (const l of V.lines) V.S.remove(l); for (const r of V.rings) V.S.remove(r); for (const l of V.lanterns) V.S.remove(l);
  V.kites = []; V.lines = []; V.rings = []; V.lanterns = []; const pl = PLACES[placeOf(g.N)]; W3.setSky(g.yard ? 'golden' : pl.sky, { azim: 200 }); const night = W3.S.night > 0; W3.hemi.intensity = W3.S.hemiI + (night ? 0.5 : 0.2);
  const all = [g.you].concat(g.rivals); all.forEach((q, i) => { const kk = makeKite(V, q.you ? mySkin().col : q.col, i + g.seed, night); V.S.add(kk.g); for (const t of kk.tail) V.S.add(t); V.kites.push(kk); V.lines.push(lineMesh(V, q.you ? 0xffffff : new T.Color(q.col).lerp(new T.Color(0xffffff), 0.5).getHex())); });
  V.flyers = g.rivals.map(r => { const f = new T.Group(); const b = new T.Mesh(new T.CapsuleGeometry(0.3, 0.9, 4, 8), new T.MeshStandardMaterial({ color: r.col })); b.position.y = 1; f.add(b); const h = new T.Mesh(new T.SphereGeometry(0.2, 10, 8), new T.MeshStandardMaterial({ color: 0xc68642 })); h.position.y = 1.75; f.add(h); f.position.set(r.ax, 0, -r.az); f.scale.setScalar(1.6); V.S.add(f); V.lanterns.push(f); return f; });
  for (const rg of g.rings) { const m = new T.Mesh(new T.TorusGeometry(rg.r * 0.8, 0.25, 8, 32), new T.MeshStandardMaterial({ color: 0xffd040, emissive: 0xffa000, emissiveIntensity: 0.8 })); m.position.set(...kw(rg.x, rg.y)); V.S.add(m); V.rings.push(m); }
  if (night) for (let i = 0; i < 26; i++) { const m = new T.Mesh(new T.SphereGeometry(0.5, 8, 6), new T.MeshStandardMaterial({ color: 0xffb040, emissive: 0xff8a20, emissiveIntensity: 2.5 })); m.position.set((Math.random() - 0.5) * 220, Math.random() * 110, -40 - Math.random() * 160); m.userData.v = 0.6 + Math.random() * 1.2; V.S.add(m); V.lanterns.push(m); }
  ui.snap = true; }
const SV = window.THREE ? new THREE.Vector3() : null;
function scr(x, y, z) { if (!V3 || V3.none) return { x: W / 2, y: H / 2 }; SV.set(x, y, z); return W3.screen(SV); }
const kscr = (x, y) => scr(...kw(x, y));
function sync(V, g, dt) { V.t += dt; const all = [g.you].concat(g.rivals);
  all.forEach((q, i) => { const kk = V.kites[i]; if (!kk) return; const p = kw(q.x, q.y); kk.g.position.set(...p); kk.g.rotation.set(0, 0, q.th - Math.PI / 2 + (q.alive ? Math.sin(V.t * 9 + i) * 0.04 : 0));
    // the tail: each piece follows the one before
    kk.trail.unshift([p[0], p[1] - 3.4]); if (kk.trail.length > 40) kk.trail.pop(); kk.tail.forEach((t, j) => { const s = kk.trail[Math.min(kk.trail.length - 1, 2 + j * 4)] || [p[0], p[1] - 2 - j]; t.position.set(s[0], s[1] - j * 0.9, p[2] + 0.01); t.rotation.z = Math.sin(V.t * 6 + j) * 0.5; });
    const a = q.you ? [0.9, 1.3, 1.2] : [q.ax, 1.6 + 2, -q.az], sag = q.alive ? 2 + Math.max(0, 6 - (q.p || 0) * 5) : 12;
    if (q.alive) setLine(V.lines[i], a, p, sag, q.you ? 0.06 : 0.05); else { const f = Math.min(1, (q.fall || 0) / 2); setLine(V.lines[i], a, [a[0] + (p[0] - a[0]) * 0.5, a[1] + (p[1] - a[1]) * 0.5 * (1 - f) - f * 10, a[2] + (p[2] - a[2]) * 0.5], sag, 0.04); } });
  V.lines[0].material.color.setHex(Object.keys(g.crosses).length ? (Math.sin(V.t * 30) > 0 ? 0xffd040 : 0xff5a3a) : 0xffffff);
  V.rings.forEach((m, i) => { m.visible = !g.rings[i].got; m.rotation.y += dt * 1.5; });
  for (const l of V.lanterns) if (l.userData.v) { l.position.y += l.userData.v * dt; if (l.position.y > 130) l.position.y = -5; }
  V.spool.rotation.y += (g.you.pull ? 9 : 2) * dt;
  // the camera: just behind you, looking up at the fight (it leans towards your kite)
  const asp = innerWidth / innerHeight, portrait = asp < 0.8, y = g.you, cx = clamp(y.x * 0.7, -45, 45), cy = 38 + clamp((y.y - 45) * 0.5, -12, 22);
  const cp = [cx * 0.15, 3.1, 8.5], cl = [cx, cy, KZ];
  if (ui.snap || !ui.cam) { ui.cam = { p: cp.slice(), l: cl.slice() }; ui.snap = false; } const kk = Math.min(1, dt * 2); for (let i = 0; i < 3; i++) { ui.cam.p[i] += (cp[i] - ui.cam.p[i]) * kk; ui.cam.l[i] += (cl[i] - ui.cam.l[i]) * kk; }
  const cam = W3.cam, sh = FX.shake ? (Math.random() - 0.5) * FX.shake * 0.02 : 0; cam.fov = portrait ? 72 : 54; cam.aspect = asp; cam.updateProjectionMatrix(); cam.position.set(ui.cam.p[0] + sh, ui.cam.p[1] + sh, ui.cam.p[2]); cam.lookAt(...ui.cam.l); cam.updateMatrixWorld(); W3.setFocus(0, 0, -10, 40); }
// ---------- what happens, seen and heard ----------
function onEvent(G, e) { const cx = W / 2;
  switch (e.k) {
    case 'start': case 'yard': ui.snap = true; ui.banner = G.lesson ? null : { txt: `CUT ${G.cfg.need} KITES`, t: 0, secs: 1.5, col: '#ffd040' }; sfx.wind(); break;
    case 'pull': sfx.pull(); break;
    case 'slack': break;
    case 'cross': { sfx.cross(); const p = kscr(G.crosses[e.i] ? G.crosses[e.i].x : 0, G.crosses[e.i] ? G.crosses[e.i].y : 50); say('PECH!', p.x, p.y - 30 * k, '#ffd040', 20); tip('cross', 'Lines crossed! HOLD and keep your kite moving: whoever pulls harder cuts the other.', 3); break; }
    case 'uncross': break;
    case 'cut': { sfx.cut(e.combo); FX.flash = 0.5; vibe(HAP.best); const p = kscr(e.x, e.y); burst(p.x, p.y, '#ffd040', 26, 220); say(e.combo >= 2 ? ['', '', 'DOUBLE!', 'TRIPLE!', 'QUADRA!', 'PENTA!'][Math.min(5, e.combo)] : 'BO KATA!', cx, H * 0.3, '#ffd040', e.combo >= 2 ? 32 : 30); say(`${e.name} is cut`, cx, H * 0.36, '#fff', 16); break; }
    case 'cutyou': { sfx.lose(); FX.red = 1; FX.shake = 14; vibe(HAP.heavy); ui.banner = { txt: 'YOUR LINE IS CUT', t: 0, secs: 1.6, col: '#ff6a5a' }; break; }
    case 'crash': sfx.crash(); FX.red = 1; FX.shake = 12; vibe(HAP.heavy); ui.banner = { txt: 'INTO THE ROOFS!', t: 0, secs: 1.4, col: '#ff6a5a' }; break;
    case 'rcrash': say('Down in the roofs!', cx, H * 0.36, '#fff', 15); break;
    case 'catch': sfx.coin(3); say('CAUGHT A KITE! +4 🪙', cx, H * 0.33, '#80ff90', 18); break;
    case 'newkite': say('A new kite goes up', cx, H * 0.36, '#fff', 14); break;
    case 'ring': sfx.ring(e.n); say(`${e.n} / 4`, cx, H * 0.4, '#ffd040', 22); break;
    case 'gust': if (!G.lesson) say('GUST!', cx, H * 0.5, '#bfe8ff', 16); sfx.wind(); break;
    case 'won': sfx.win(); break;
    case 'lost': break;
    case 'lessonnext': hint = null; break;
    case 'lessonok': sfx.coin(e.n); break;
    case 'lessonmiss': hint = { txt: e.how, t: 0, secs: 3.2 }; sfx.no(); break;
    case 'lessondone': sfx.goal(); say('LESSON DONE!', cx, H * 0.4, '#80ff90', 28); burst(cx, H * 0.4, '#80ff90', 24); break;
  } }
let IG = null; function idleG() { if (!IG || IG.over) { IG = newGame(Math.max(6, store.get('level', 1) | 0), { seed: (Math.random() * 1e6) | 0 }); IG.mem = {}; ui.snap = true; } honest(IG, { react: 0.3, acc: 0.95 }, IG.mem); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#2a3a4a'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D sky.', W / 2, H / 2); if (G) hud(G, now); return; }
  const g = G || idleG(); if (V.built !== g || V.kites.length !== 1 + g.rivals.length) buildRound(V, g);
  sync(V, g, dt);
  W3.render(dt);
  if (G && !(G.over && !$('ovEnd').classList.contains('hidden'))) hud(G, now);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 0.9 ? 1 : 1 - (t2.t - 0.9) / 0.5; ctx.globalAlpha = Math.max(0, al); const sc = t2.t < 0.12 ? 1.3 - t2.t / 0.12 * 0.3 : 1; ctx.font = `400 ${Math.round(t2.size * k * sc)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(20,20,40,.65)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 20); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 20); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30, hy = H * 0.7;
    ctx.fillStyle = 'rgba(26,22,48,.9)'; rrect(W / 2 - w / 2, hy - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, hy - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,60,30,${FX.red * 0.2})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,250,220,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); } }
// ---------- the 2D layer: your kite's nose, the crossings, the rivals, the sun ----------
function hud(G, t) { ctx.textBaseline = 'middle'; const y = G.you;
  // your kite: a ring round it and an arrow the way its nose points (where a pull will take it)
  if (y.alive) { const p = kscr(y.x, y.y), a = -(y.th); ctx.strokeStyle = y.pull ? '#ffd040' : 'rgba(255,255,255,.8)'; ctx.lineWidth = 3 * k; ctx.beginPath(); ctx.arc(p.x, p.y, 22 * k, 0, TAU); ctx.stroke();
    const ax = p.x + Math.cos(a) * 40 * k, ay = p.y + Math.sin(a) * 40 * k; ctx.fillStyle = y.pull ? '#ffd040' : '#fff'; ctx.save(); ctx.translate(ax, ay); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(10 * k, 0); ctx.lineTo(-6 * k, -8 * k); ctx.lineTo(-6 * k, 8 * k); ctx.closePath(); ctx.fill(); ctx.restore(); }
  // names over the rivals; the saw contests at each crossing
  ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.textAlign = 'center'; for (const r of G.rivals) { if (!r.alive) continue; const p = kscr(r.x, r.y); ctx.fillStyle = 'rgba(20,20,40,.5)'; const tw = ctx.measureText(r.name).width + 10; rrect(p.x - tw / 2, p.y - 36 * k, tw, 15 * k, 5); ctx.fill(); ctx.fillStyle = hex(r.col); ctx.fillText(r.name, p.x, p.y - 28 * k); }
  for (const key in G.crosses) { const c = G.crosses[key], p = kscr(c.x, c.y), w = 70 * k; if (Math.random() < 0.6) PARTS.push({ x: p.x, y: p.y, vx: (Math.random() - 0.5) * 120, vy: -Math.random() * 120, t: 0, life: 0.35, col: '#ffd040', r: 1.6 * k });
    ctx.fillStyle = 'rgba(20,20,40,.7)'; rrect(p.x - w / 2 - 3, p.y + 14 * k, w + 6, 18 * k, 6); ctx.fill(); ctx.fillStyle = '#80ff90'; ctx.fillRect(p.x - w / 2, p.y + 17 * k, w / 2 * Math.min(1, c.you), 12 * k); ctx.fillStyle = '#ff6a5a'; ctx.fillRect(p.x + w / 2 - w / 2 * Math.min(1, c.them), p.y + 17 * k, w / 2 * Math.min(1, c.them), 12 * k); ctx.fillStyle = '#fff'; ctx.fillRect(p.x - 1, p.y + 15 * k, 2, 16 * k); }
  if (G.lesson) { lessonPanel(G); }
  else { const x0 = 12, w = W - 24, y0 = 44 * k; ctx.fillStyle = 'rgba(26,22,48,.6)'; rrect(x0, y0, w, 44 * k, 12 * k); ctx.fill();
    ctx.textAlign = 'left'; ctx.fillStyle = '#ffd040'; ctx.font = `400 ${Math.round(16 * k)}px ${TF}`; ctx.fillText(`CUT ${G.cuts}/${G.cfg.need}`, x0 + 10, y0 + 15 * k);
    ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillStyle = '#fff'; ctx.fillText(G.rivals.map(r => (r.alive ? '🪁 ' : '✂ ') + r.name).join('  '), x0 + 10, y0 + 33 * k);
    const f = clamp(G.left / G.cfg.time, 0, 1), bw = w * 0.38; ctx.fillStyle = 'rgba(255,255,255,.25)'; rrect(x0 + w - bw - 10, y0 + 10 * k, bw, 9 * k, 4); ctx.fill(); ctx.fillStyle = f < 0.2 ? '#ff6a5a' : '#ffb020'; rrect(x0 + w - bw - 10, y0 + 10 * k, bw * f, 9 * k, 4); ctx.fill(); ctx.textAlign = 'right'; ctx.fillStyle = '#fff'; ctx.fillText(`☀ ${Math.ceil(G.left)} s`, x0 + w - 10, y0 + 32 * k); }
  if (ui.banner) { const B = ui.banner, sc = B.t < 0.12 ? 1.25 - B.t / 0.12 * 0.25 : 1; ctx.textAlign = 'center'; ctx.font = `400 ${Math.round(32 * k * sc)}px ${TF}`; ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(20,20,40,.6)'; ctx.strokeText(B.txt, W / 2, H * 0.24); ctx.fillStyle = B.col || '#fff'; ctx.fillText(B.txt, W / 2, H * 0.24); }
  // low: the roofs are close
  if (y.alive && y.y < SKY.y0 + 9) { const a = 1 - (y.y - SKY.y0) / 9; const gr = ctx.createLinearGradient(0, H * 0.6, 0, H); gr.addColorStop(0, 'rgba(255,60,30,0)'); gr.addColorStop(1, `rgba(255,60,30,${0.35 * a})`); ctx.fillStyle = gr; ctx.fillRect(0, H * 0.6, W, H * 0.4); ctx.textAlign = 'center'; ctx.font = `400 ${Math.round(16 * k)}px ${TF}`; ctx.fillStyle = '#fff'; ctx.fillText('TOO LOW! TURN THE NOSE UP', W / 2, H - 150 * k); }
  // the thumb
  ctx.textAlign = 'center'; ctx.font = `400 ${Math.round(16 * k)}px ${TF}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(20,20,40,.6)'; const tx = y.pull ? 'PULLING' : 'SLACK: TURNING'; ctx.strokeText(tx, W / 2, H - 60 * k); ctx.fillStyle = y.pull ? '#ffd040' : '#fff'; ctx.fillText(tx, W / 2, H - 60 * k);
  if (G.N <= 2 && G.t < 8 && !G.lesson) { ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 5); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; ctx.fillStyle = '#fff'; ctx.fillText('HOLD ANYWHERE = PULL · LET GO = TURN', W / 2, H - 90 * k); ctx.globalAlpha = 1; } }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { const D = G.lesson, st = D.steps[D.i], x = 12, w = W - 24, y = 44 * k; ctx.save(); ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; const lines = wrapText(st.how, w - 24), h = 50 * k + lines.length * 17 * k;
  ctx.fillStyle = 'rgba(26,22,48,.9)'; rrect(x, y, w, h, 12); ctx.fill(); ctx.strokeStyle = 'rgba(255,176,32,.8)'; ctx.lineWidth = 2; rrect(x, y, w, h, 12); ctx.stroke();
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#ffb020'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillText(`LESSON ${G.N} OF 3 · ${D.n}/${st.need}`, x + 12, y + 9 * k);
  ctx.fillStyle = '#fff'; ctx.font = `400 ${Math.round(16 * k)}px ${TF}`; ctx.fillText(st.title, x + 12, y + 23 * k); ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.92)'; lines.forEach((l, i) => ctx.fillText(l, x + 12, y + 46 * k + i * 17 * k)); ctx.restore(); ctx.textBaseline = 'middle'; }
