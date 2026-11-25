// ===================== THE VIEW: Balloon Drift in 3D (three.js; sky, light, land from tools/world3d.js) =====================
// Rebuilt 24 Nov 2026 (his review: the graphics "need to be way better", on the ground and going up, and the balloon did not look
// like one). Behind your balloon, which is always in the picture, looking on towards the next X: a painted countryside for each
// place with trees and buildings standing on it, hills or mountains all round, clouds at every height to climb past, the crosses
// on the ground, the green landing field with its windsock, pylons and wires, other balloons drifting at their own heights. On top: the wind
// at each height (arrows on the right, turned to match the view), your height and how fast you climb or sink, the fuel, the
// ring on the ground where a marker would land, the 🎯 button.
const FX = { shake: 0, stop: 0, flash: 0, red: 0, slow: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { snap: true, cam: null, banner: null, yaw: 0, touch: null };
function say(txt, x, y, col = '#fff', size = 22) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS || !(G && G.lesson)) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 140) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60 * k, t: 0, life: 0.5 + Math.random() * 0.5, col, r: (2 + Math.random() * 3) * k }); } }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2.5); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.6) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (ui.banner) { ui.banner.t += dt; if (ui.banner.t > (ui.banner.secs || 2.4)) ui.banner = null; }
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; } }
function mySkin() { if (typeof HEADLESS !== 'undefined' && HEADLESS) return SKINS[0]; const id = store.get('skin', 'sun'); return SKINS.find(q => q.id === id) || SKINS[0]; }
// ---------- the balloon ----------
// His review (24 Nov 2026): "The air balloon doesn't even look like an air balloon." So: the real shape (a round crown tapering down to
// the mouth), sixteen gores that bulge between their load tapes, a painted pattern for each skin (stripes, a spiral, chevrons, bands,
// stars), the parachute top, a dark scoop at the mouth, the burner on its frame with a blue-and-orange flame that lights the envelope
// from inside, flying wires, and a wicker basket with a leather rim and two people in it. The basket's floor is at the group's y = 0.
const ENV_H = 22, ENV_R = 9.2, MOUTH = 5.4, GORES = 16;
function hexOf(c) { return '#' + c.toString(16).padStart(6, '0'); }
function canvasTexB(w, h, f) { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
const ENVT = {};
function envTex(skin) { return ENVT[skin.id] || (ENVT[skin.id] = envTex0(skin)); }
function envTex0(skin) { return canvasTexB(512, 512, (g, w, h) => { const A = hexOf(skin.top), B = hexOf(skin.bot), gw = w / GORES, id = skin.id, bands = 9, bh = (h - 70) / bands, y0 = 30;
  g.fillStyle = A; g.fillRect(0, 0, w, h);
  for (let i = 0; i < GORES; i++) for (let j = 0; j < bands; j++) { let c = A;
    if (id === 'sun') c = i % 2 ? A : B;
    else if (id === 'sea') c = j % 2 ? A : B;
    else if (id === 'lime') c = ((i + j) % 4) < 2 ? A : B;
    else if (id === 'berry') c = ((j + (i % 4 < 2 ? i % 2 : 1 - i % 2)) % 2) ? A : B;
    else if (id === 'night') c = A;
    else c = ['#e8402a', '#f29a2a', '#f2d83a', '#4ab04a', '#2a8ae0', '#5a3ab0', '#c03a9a', '#f2f2f2'][(i + j) % 8];
    g.fillStyle = c; g.fillRect(i * gw, y0 + j * bh, gw + 1, bh + 1); }
  if (id === 'sun') { g.fillStyle = '#fff4d8'; g.beginPath(); for (let i = 0; i <= GORES; i++) { g.lineTo(i * gw, 215 + (i % 2 ? 34 : 0)); } for (let i = GORES; i >= 0; i--) g.lineTo(i * gw, 265 + (i % 2 ? 34 : 0)); g.closePath(); g.fill(); }
  if (id === 'sea') { g.fillStyle = '#17406a'; for (let j = 1; j < bands; j++) g.fillRect(0, y0 + j * bh - 3, w, 6); }
  if (id === 'night') { g.fillStyle = B; g.fillRect(0, 232, w, 30); for (let i = 0; i < 70; i++) { const x = (i * 97.3) % w, y = 50 + ((i * 53.7) % 380), r = 3 + (i % 3) * 2; if (y > 215 && y < 280) continue; g.beginPath(); for (let q = 0; q < 10; q++) { const a = q * Math.PI / 5 - Math.PI / 2, rr = q % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); } }
  // the parachute top and the band round the mouth
  g.fillStyle = id === 'night' ? B : id === 'rainbow' ? '#f2f2f2' : B; g.fillRect(0, 0, w, y0); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, y0 - 2, w, 3);
  g.fillStyle = id === 'sea' ? '#17406a' : 'rgba(30,24,30,.82)'; g.fillRect(0, h - 40, w, 40);
  // the load tapes between the gores, and the seams across them
  g.fillStyle = 'rgba(0,0,0,.3)'; for (let i = 0; i <= GORES; i++) g.fillRect(i * gw - 1.5, 0, 3, h); g.fillStyle = 'rgba(0,0,0,.09)'; for (let j = 1; j < 18; j++) g.fillRect(0, j * h / 18, w, 1.5);
  // a little light and shade down each gore, so the bulge reads from far off
  for (let i = 0; i < GORES; i++) { const gr = g.createLinearGradient(i * gw, 0, (i + 1) * gw, 0); gr.addColorStop(0, 'rgba(0,0,0,.16)'); gr.addColorStop(0.45, 'rgba(255,255,255,.10)'); gr.addColorStop(1, 'rgba(0,0,0,.16)'); g.fillStyle = gr; g.fillRect(i * gw, 0, gw, h); } }); }
let GLOWT = null, WICK = null, HALOT = null;
function makeBalloon(V, skin, lite) { const T = V.T, g = new T.Group(), spin = new T.Group(); g.add(spin);
  // the envelope: its outline turned round, then each gore pushed out a little between its tapes
  const n = lite ? 14 : 30, seg = GORES * (lite ? 2 : 6), pts = [], yc = ENV_H * 0.6, rm = 1.7;
  for (let j = 0; j <= n; j++) { const y = ENV_H * j / n; let r; if (y <= yc) { const u = y / yc; r = rm + (ENV_R - rm) * (1 - Math.pow(1 - u, 1.5)); } else { const u = (y - yc) / (ENV_H - yc); r = ENV_R * Math.sqrt(Math.max(0, 1 - u * u)); } pts.push(new T.Vector2(Math.max(0.05, r), y)); }
  const geo = new T.LatheGeometry(pts, seg), pa = geo.attributes.position;
  for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), z = pa.getZ(i), f = 1 + 0.045 * Math.abs(Math.sin(GORES * Math.atan2(x, z) / 2)); pa.setX(i, x * f); pa.setZ(i, z * f); } geo.computeVertexNormals();
  if (!GLOWT) GLOWT = canvasTexB(8, 128, (q, w, h) => { const gr = q.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, '#fff'); gr.addColorStop(0.35, '#999'); gr.addColorStop(0.75, '#222'); gr.addColorStop(1, '#000'); q.fillStyle = gr; q.fillRect(0, 0, w, h); });
  const em = new T.MeshStandardMaterial({ map: envTex(skin), roughness: 0.55, side: T.DoubleSide, emissive: 0xff7a20, emissiveMap: GLOWT, emissiveIntensity: 0 });
  const env = new T.Mesh(geo, em); env.position.y = MOUTH; env.castShadow = !lite; spin.add(env);
  const dark = V.M(0x2a262c, { side: T.DoubleSide, roughness: 0.9 });
  const scoop = new T.Mesh(new T.CylinderGeometry(rm * 1.02, rm * 0.86, 1.5, 20, 1, true), dark); scoop.position.y = MOUTH - 0.75; if (!lite) spin.add(scoop);
  // the parachute top: it drops a little when the vent is pulled
  const cap = new T.Mesh(new T.CircleGeometry(2.6, 20).rotateX(-Math.PI / 2), V.M(skin.bot, { side: T.DoubleSide })); cap.position.y = MOUTH + ENV_H - 0.12; spin.add(cap);
  // the basket: wicker, a leather rim, the burner frame on four poles, the wires up to the mouth
  if (!WICK) { WICK = canvasTexB(64, 64, (q, w, h) => { q.fillStyle = '#b08850'; q.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 8) for (let x = 0; x < w; x += 8) { q.fillStyle = ((x + y) / 8) % 2 ? '#8a6434' : '#c8a064'; q.fillRect(x + 1, y + 1, 6, 6); } q.fillStyle = 'rgba(60,36,14,.5)'; for (let x = 0; x < w; x += 16) q.fillRect(x, 0, 2, h); }); WICK.wrapS = WICK.wrapT = T.RepeatWrapping; WICK.repeat.set(3, 2); }
  const bw = 2.6, bh2 = 1.5, bd = 2.0, basket = new T.Mesh(V.boxG, new T.MeshStandardMaterial({ map: WICK, roughness: 0.9 })); basket.scale.set(bw, bh2, bd); basket.position.y = bh2 / 2; basket.castShadow = !lite; spin.add(basket);
  const rim = new T.Mesh(V.boxG, V.M(0x4a2c16, { roughness: 0.6 })); rim.scale.set(bw + 0.22, 0.2, bd + 0.22); rim.position.y = bh2; if (!lite) spin.add(rim);
  if (!lite) { const metal = V.M(0xc8ccd2, { metalness: 0.7, roughness: 0.35 }), fy = 3.7;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const pole = new T.Mesh(V.cylG, dark); pole.scale.set(0.06, fy - bh2, 0.06); pole.position.set(sx * (bw / 2 - 0.1), (fy + bh2) / 2, sz * (bd / 2 - 0.1)); spin.add(pole); }
    for (const [sx, sz, lx, lz] of [[0, 1, bw, 0.12], [0, -1, bw, 0.12], [1, 0, 0.12, bd], [-1, 0, 0.12, bd]]) { const bar = new T.Mesh(V.boxG, metal); bar.scale.set(lx, 0.12, lz); bar.position.set(sx * (bw / 2 - 0.1), fy, sz * (bd / 2 - 0.1)); spin.add(bar); }
    for (const sx of [-0.35, 0.35]) { const bn = new T.Mesh(V.cylG, metal); bn.scale.set(0.24, 0.7, 0.24); bn.position.set(sx, fy + 0.15, 0); spin.add(bn); }
    // the two people aboard
    for (const [px, pz, col] of [[-0.6, 0.2, 0xd8402a], [0.6, -0.25, 0x2a6ad8]]) { const body = new T.Mesh(new T.CapsuleGeometry(0.3, 0.7, 4, 8), V.M(col)); body.position.set(px, 1.45, pz); spin.add(body); const head = new T.Mesh(new T.SphereGeometry(0.24, 10, 8), V.M(0xe8b890)); head.position.set(px, 2.25, pz); spin.add(head); const hat = new T.Mesh(new T.SphereGeometry(0.26, 10, 6, 0, TAU, 0, Math.PI / 2), V.M(col === 0xd8402a ? 0x2a2a30 : 0xf2d86a)); hat.position.set(px, 2.3, pz); spin.add(hat); }
    const wp = []; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + Math.PI / 8, sx = Math.cos(a) > 0 ? 1 : -1, sz = Math.sin(a) > 0 ? 1 : -1; wp.push(new T.Vector3(sx * (bw / 2 - 0.1), fy, sz * (bd / 2 - 0.1)), new T.Vector3(Math.cos(a) * rm, MOUTH, Math.sin(a) * rm)); }
    spin.add(new T.LineSegments(new T.BufferGeometry().setFromPoints(wp), new T.LineBasicMaterial({ color: 0x2a2a2a }))); }
  else { const wp = []; for (const sx of [-1, 1]) for (const sz of [-1, 1]) wp.push(new T.Vector3(sx * bw / 2, bh2, sz * bd / 2), new T.Vector3(sx * rm * 0.7, MOUTH, sz * rm * 0.7)); spin.add(new T.LineSegments(new T.BufferGeometry().setFromPoints(wp), new T.LineBasicMaterial({ color: 0x2a2a2a }))); }
  // the flame: blue at the burner, orange above, up into the mouth
  const flame = new T.Group(), f1 = new T.Mesh(new T.ConeGeometry(0.62, 3.6, 12, 1, true), new T.MeshBasicMaterial({ color: 0xff8a20, transparent: true, opacity: 0.85, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false })), f2 = new T.Mesh(new T.ConeGeometry(0.3, 2.3, 10, 1, true), new T.MeshBasicMaterial({ color: 0xbfe0ff, transparent: true, opacity: 0.95, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false }));
  f1.position.y = 1.8; f2.position.y = 1.15; flame.add(f1, f2); flame.position.y = 3.9; flame.visible = false; if (!lite) spin.add(flame);
  let glow = null; if (!lite) { glow = new T.PointLight(0xffa040, 0, 60); glow.position.y = 6; spin.add(glow); }
  let halo = null; if (!lite) { halo = new T.Sprite(new T.SpriteMaterial({ map: HALOT || (HALOT = canvasTexB(64, 64, (q, w) => { const gr = q.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,240,200,1)'); gr.addColorStop(0.25, 'rgba(255,170,60,.8)'); gr.addColorStop(1, 'rgba(255,120,20,0)'); q.fillStyle = gr; q.fillRect(0, 0, w, w); })), blending: T.AdditiveBlending, depthWrite: false, transparent: true, fog: false })); halo.position.y = 4.7; halo.scale.set(7, 7, 1); halo.visible = false; spin.add(halo); }
  return { g, spin, env, em, cap, flame, glow, halo, heat: 0 }; }
// ---------- the ground from above ----------
// His review (24 Nov 2026): "the graphics need to be way better. The graphics on the ground..." The land was a blur of colour laid on a
// coarse grid. Now it is a painted map, 1300 m square and joined at its edges (so it repeats without a seam): farmland with fields in
// crop rows, hedges, lanes and a stream; vineyards in rows with dirt tracks; red canyon rock in ledges with dry washes; alpine meadows
// with flowers, woods and a mountain stream; lakeland marsh and forest. What is painted is also built: trees stand on the painted
// hedges and woods, houses along the painted lanes.
const TILE = 1300;
function paintGround(P) {
  const S = 2048, ppm = S / TILE, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'), R = rng(700 + P * 37), pick = a => a[(R() * a.length) | 0];
  const out = { hedges: [], woods: [], spots: [], ppm };
  const wrap = (x, y, r, f) => { for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { if (x + ox + r < 0 || x + ox - r > S || y + oy + r < 0 || y + oy - r > S) continue; f(x + ox, y + oy); } };
  const blot = (n, cols, r0, r1, al) => { g.globalAlpha = al; for (let i = 0; i < n; i++) { const x = R() * S, y = R() * S, r = r0 + R() * (r1 - r0), col = pick(cols); wrap(x, y, r, (px, py) => { const gr = g.createRadialGradient(px, py, 0, px, py, r); gr.addColorStop(0, col); gr.addColorStop(1, col + '00'); g.fillStyle = gr; g.fillRect(px - r, py - r, r * 2, r * 2); }); } g.globalAlpha = 1; };
  const speck = (n, cols, r0, r1, al) => { g.globalAlpha = al == null ? 1 : al; for (let i = 0; i < n; i++) { g.fillStyle = pick(cols); const r = r0 + R() * (r1 - r0); g.beginPath(); g.arc(R() * S, R() * S, r, 0, 6.3); g.fill(); } g.globalAlpha = 1; };
  // a winding line that meets itself across the edge (a lane, a stream, a ledge of rock)
  const wind = (horiz, base, amp, k1, k2, ph) => { const pts = []; for (let i = 0; i <= 128; i++) { const u = i / 128, o = base + amp * Math.sin(u * TAU * k1 + ph) + amp * 0.4 * Math.sin(u * TAU * k2 + ph * 2.3); pts.push(horiz ? [u * S, o] : [o, u * S]); } return pts; };
  const stroke = (pts, w, col, al) => { g.globalAlpha = al == null ? 1 : al; g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; for (const [ox, oy] of [[0, 0], [0, S], [0, -S], [S, 0], [-S, 0]]) { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0] + ox, p[1] + oy) : g.moveTo(p[0] + ox, p[1] + oy)); g.stroke(); } g.globalAlpha = 1; };
  const rows = (f, sp, col, al, diag) => { g.save(); g.beginPath(); g.rect(f.x, f.y, f.w, f.h); g.clip(); g.globalAlpha = al; g.strokeStyle = col; g.lineWidth = sp * 0.45; g.lineCap = 'butt'; g.beginPath();
    if (diag) { for (let t = -f.h; t < f.w; t += sp) { g.moveTo(f.x + t, f.y); g.lineTo(f.x + t + f.h, f.y + f.h); } } else if (f.w > f.h) { for (let t = sp / 2; t < f.h; t += sp) { g.moveTo(f.x, f.y + t); g.lineTo(f.x + f.w, f.y + t); } } else { for (let t = sp / 2; t < f.w; t += sp) { g.moveTo(f.x + t, f.y); g.lineTo(f.x + t, f.y + f.h); } }
    g.stroke(); g.restore(); };
  const canopy = (x, y, r, cols) => { g.fillStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.arc(x + r * 0.3, y + r * 0.35, r, 0, 6.3); g.fill(); g.fillStyle = pick(cols); g.beginPath(); g.arc(x, y, r, 0, 6.3); g.fill(); g.fillStyle = 'rgba(255,255,220,.13)'; g.beginPath(); g.arc(x - r * 0.3, y - r * 0.3, r * 0.5, 0, 6.3); g.fill(); };
  const patch = (cols, n, r0, r1) => { for (let i = 0; i < n; i++) { const x = R() * S, y = R() * S, rx = r0 + R() * (r1 - r0), ry = r0 + R() * (r1 - r0); out.woods.push({ x: x / ppm, z: y / ppm, rx: rx / ppm, rz: ry / ppm }); const m = (rx * ry / 55) | 0; for (let q = 0; q < m; q++) { const a = R() * TAU, d = Math.sqrt(R()); wrap(x + Math.cos(a) * d * rx, y + Math.sin(a) * d * ry, 12, (px, py) => canopy(px, py, 5 + R() * 5, cols)); } } };
  const lane = (pts, n, off, kind) => { for (let i = 0; i < n; i++) { const q = ((i + 0.5) * 128 / n) | 0, a = pts[q], b = pts[q + 1], rot = Math.atan2(b[1] - a[1], b[0] - a[0]), sd = i % 2 ? 1 : -1; out.spots.push({ x: (a[0] - Math.sin(rot) * off * ppm * sd) / ppm, z: (a[1] + Math.cos(rot) * off * ppm * sd) / ppm, rot, kind: kind || 'house' }); } };
  if (P <= 1) {
    g.fillStyle = P ? '#a98f5f' : '#6f9a3c'; g.fillRect(0, 0, S, S);
    const leaves = [], cut = (x, y, w, h, d) => { const big = Math.max(w, h); if (d > 6 || big < 150 || (d > 2 && big < 300 && R() < 0.35)) { leaves.push({ x, y, w, h }); return; }
      if (w > h * (0.7 + R() * 0.6)) { const s = w * (0.35 + R() * 0.3); cut(x, y, s, h, d + 1); cut(x + s, y, w - s, h, d + 1); } else { const s = h * (0.35 + R() * 0.3); cut(x, y, w, s, d + 1); cut(x, y + s, w, h - s, d + 1); } };
    cut(0, 0, S, S, 0);
    for (const f of leaves) { const u = R();
      if (u < 0.08) { g.fillStyle = P ? '#3f5a2c' : '#35602a'; g.fillRect(f.x, f.y, f.w, f.h); const m = (f.w * f.h / 70) | 0; for (let q = 0; q < m; q++) canopy(f.x + 6 + R() * (f.w - 12), f.y + 6 + R() * (f.h - 12), 5 + R() * 5, P ? ['#3a5626', '#4a6a30', '#2f4a22'] : ['#2f5a22', '#3d6e2a', '#27501e']); out.woods.push({ x: (f.x + f.w / 2) / ppm, z: (f.y + f.h / 2) / ppm, rx: f.w / 2 / ppm - 4, rz: f.h / 2 / ppm - 4, rect: true }); continue; }
      if (P === 0) { const kind = u < 0.42 ? 0 : u < 0.62 ? 1 : u < 0.78 ? 2 : u < 0.9 ? 3 : 4;
        g.fillStyle = [pick(['#6a9a3a', '#7aa843', '#5c8c34', '#82b04a']), pick(['#d9c56a', '#cdb85a', '#e0cf7a']), pick(['#8a6a44', '#7a5c3a', '#946f48']), pick(['#4c7c2e', '#57883a']), '#e2d040'][kind]; g.fillRect(f.x, f.y, f.w, f.h);
        if (kind === 0) { g.save(); g.beginPath(); g.rect(f.x, f.y, f.w, f.h); g.clip(); for (let q = 0; q < 14; q++) { const x = f.x + R() * f.w, y = f.y + R() * f.h, r = 14 + R() * 30, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, R() < 0.5 ? 'rgba(40,80,20,.28)' : 'rgba(190,220,120,.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); } if (R() < 0.4) for (let q = 0; q < 9; q++) { g.fillStyle = R() < 0.5 ? '#f4f0e6' : '#3a2a20'; g.fillRect(f.x + R() * f.w, f.y + R() * f.h, 3.5, 2.2); } g.restore(); }
        else rows(f, kind === 2 ? 6 : 7 + R() * 4, kind === 1 ? '#a8903c' : kind === 2 ? '#5a4028' : kind === 3 ? '#2f5a1e' : '#a89a1e', kind === 2 ? 0.5 : 0.38, R() < 0.25);
        if (kind === 1 && R() < 0.5) for (let q = 0; q < 16; q++) { const x = f.x + 8 + R() * (f.w - 16), y = f.y + 8 + R() * (f.h - 16); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x + 1, y + 1.5, 4.5, 3.5); g.fillStyle = '#e8d88a'; g.fillRect(x, y, 4.5, 3.5); } }
      else { const kind = u < 0.7 ? 0 : u < 0.82 ? 1 : 2;
        g.fillStyle = [pick(['#b99a6a', '#a88a5c', '#c2a474']), '#a39468', pick(['#d8bc62', '#cfae54'])][kind]; g.fillRect(f.x, f.y, f.w, f.h);
        if (kind === 0) rows(f, 5, pick(['#4f7a2a', '#5d8a30', '#466e26']), 0.95, R() < 0.3);
        else if (kind === 1) { for (let y = f.y + 8; y < f.y + f.h - 5; y += 11) for (let x = f.x + 8; x < f.x + f.w - 5; x += 11) { g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.arc(x + 1.5, y + 2, 3.6, 0, 6.3); g.fill(); g.fillStyle = pick(['#7a8a5a', '#6c7e50', '#869664']); g.beginPath(); g.arc(x, y, 3.6, 0, 6.3); g.fill(); } }
        else rows(f, 8, '#b0903a', 0.35, false); } }
    // the hedges (farmland) or dirt tracks (vineyards) between the fields: every field's right and lower edge
    for (const f of leaves) for (const [x0, y0, x1, y1] of [[f.x + f.w, f.y, f.x + f.w, f.y + f.h], [f.x, f.y + f.h, f.x + f.w, f.y + f.h]]) { const len = Math.hypot(x1 - x0, y1 - y0), treed = R() < (P ? 0.22 : 0.5);
      g.strokeStyle = P ? '#cdb891' : '#35592a'; g.lineWidth = P ? 5 : 4.5; g.lineCap = 'butt'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      if (!P) for (let t = 4; t < len; t += 7 + R() * 5) { const x = x0 + (x1 - x0) * t / len + (R() - 0.5) * 2, y = y0 + (y1 - y0) * t / len + (R() - 0.5) * 2; g.fillStyle = pick(['#2f5a22', '#3d6e2a', '#27501e']); g.beginPath(); g.arc(x, y, 2.6 + R() * 2, 0, 6.3); g.fill(); }
      if (treed) out.hedges.push([x0 / ppm, y0 / ppm, x1 / ppm, y1 / ppm]); }
    const rh = wind(true, S * 0.3, 60, 1, 3, 1.2), rv = wind(false, S * 0.62, 70, 1, 2, 0.4);
    if (!P) { const st = wind(true, S * 0.78, 90, 2, 5, 2.2); stroke(st, 24, '#3f6a2c'); stroke(st, 13, '#3f7fa8'); stroke(st, 5, '#7fbcd8', 0.7); }
    for (const r of [rh, rv]) { stroke(r, 15, P ? '#8a7a54' : '#7f8a58'); stroke(r, 10, P ? '#dcc9a0' : '#c9bd9c'); stroke(r, 1.5, P ? '#b8a47c' : '#a89c7c', 0.7); }
    lane(rh, 10, 17); lane(rv, 5, 17); lane(rh, 3, 46, 'farm'); lane(rv, 2, 50, P ? 'farm' : 'church');
  } else if (P === 2) {
    // red rock country: dark rock, pale sand flats, a few long ledges, a wide dry river with its braids, sage scrub along it, and
    // low flat-topped rocks (each one is built in 3D where it is painted: out.rocks)
    g.fillStyle = '#c0623e'; g.fillRect(0, 0, S, S); blot(170, ['#cc7046', '#a94e34', '#d58250', '#9e4731'], 80, 260, 0.45);
    blot(38, ['#e6b080', '#eec090', '#dca070'], 110, 300, 0.8); blot(110, ['#e6b080', '#d49a6a', '#8e3f2a'], 30, 90, 0.4);
    // terraces: rock worn into steps, seen from above as rings one inside the other, each with a dark foot and a lit lip
    for (let i = 0; i < 16; i++) { const x = R() * S, y = R() * S, r0 = 70 + R() * 120, p1 = R() * 6, p2 = R() * 6, n = 4 + ((R() * 4) | 0), ring = (px, py, rr, ox) => { g.beginPath(); for (let q = 0; q <= 48; q++) { const a = q / 48 * TAU, r = rr * (1 + 0.18 * Math.sin(a * 3 + p1) + 0.1 * Math.sin(a * 5 + p2)); g.lineTo(px + ox + Math.cos(a) * r, py + ox + Math.sin(a) * r * 0.8); } g.closePath(); };
      wrap(x, y, r0 * 1.4, (px, py) => { for (let q = 0; q < n; q++) { const rr = r0 * (1 - q * 0.17); g.globalAlpha = 0.5; g.fillStyle = q % 2 ? '#c8683f' : '#d98a56'; ring(px, py, rr, 0); g.fill(); g.globalAlpha = 0.5; g.strokeStyle = '#6e2a1c'; g.lineWidth = 5; ring(px, py, rr, 2.5); g.stroke(); g.globalAlpha = 0.55; g.strokeStyle = '#f0b888'; g.lineWidth = 2.2; ring(px, py, rr, -1); g.stroke(); } g.globalAlpha = 1; }); }
    for (let i = 0; i < 9; i++) { const hz = i % 2 === 0, pts = wind(hz, R() * S, 40 + R() * 70, 1 + ((R() * 2) | 0), 3 + ((R() * 3) | 0), R() * 6), w = 5 + R() * 9; stroke(pts, w, '#6e2a1c', 0.3); stroke(pts.map(p => [p[0] + (hz ? 0 : w * 0.6), p[1] + (hz ? w * 0.6 : 0)]), w * 0.5, '#e8a878', 0.4); }
    const beds = [[true, 0.35], [false, 0.7]].map(([hz, b]) => [hz, wind(hz, S * b, 110, 1, 3, b * 9), wind(hz, S * b + 16, 122, 1, 3, b * 9 + 0.3), wind(hz, S * b - 12, 100, 1, 5, b * 9 - 0.2)]);
    for (const [hz, ws, b1, b2] of beds) { stroke(ws, 62, '#8a4a30', 0.45); stroke(ws, 46, '#e2b98a'); stroke(ws, 20, '#f0d4a8', 0.6); stroke(b1, 5, '#c08a60', 0.8); stroke(b2, 3.5, '#b87a54', 0.8);
      g.globalAlpha = 0.95; for (let i = 0; i < 700; i++) { const p = ws[(R() * 128) | 0], d = (30 + R() * 46) * (R() < 0.5 ? -1 : 1), x = p[0] + (hz ? (R() - 0.5) * 16 : d), y = p[1] + (hz ? d : (R() - 0.5) * 16); g.fillStyle = pick(['#6f7a4a', '#5a6a3c', '#7d8656', '#4f5f36']); g.beginPath(); g.arc(((x % S) + S) % S, ((y % S) + S) % S, 1.6 + R() * 2.4, 0, 6.3); g.fill(); } g.globalAlpha = 1; }
    speck(1500, ['#6f7a4a', '#5a6a3c', '#7d8656'], 1.5, 3.2, 0.9); speck(900, ['#5a2418', '#6a3020', '#f0c090'], 1, 2.4, 0.6);
    out.rocks = []; for (let i = 0; i < 26; i++) { const x = R() * S, y = R() * S, r = 18 + R() * 44; out.rocks.push({ x: x / ppm, z: y / ppm, r: r / ppm, h: 6 + R() * 16, rot: R() * 6 });
      wrap(x, y, r * 2, (px, py) => { let gr = g.createRadialGradient(px + r * 0.35, py + r * 0.4, r * 0.5, px + r * 0.35, py + r * 0.4, r * 1.7); gr.addColorStop(0, 'rgba(60,20,12,.55)'); gr.addColorStop(1, 'rgba(60,20,12,0)'); g.fillStyle = gr; g.fillRect(px - r * 2, py - r * 2, r * 4, r * 4);
        gr = g.createRadialGradient(px, py, r * 0.8, px, py, r * 1.35); gr.addColorStop(0, 'rgba(120,56,36,.9)'); gr.addColorStop(1, 'rgba(120,56,36,0)'); g.fillStyle = gr; g.fillRect(px - r * 2, py - r * 2, r * 4, r * 4); }); }
    for (let i = 0; i < 5; i++) out.spots.push({ x: R() * TILE, z: R() * TILE, rot: R() * 6, kind: 'adobe' });
  } else {
    g.fillStyle = P === 3 ? '#5fa23e' : '#4f7a3a'; g.fillRect(0, 0, S, S);
    blot(300, P === 3 ? ['#74b84a', '#4f9034', '#86c458', '#5a9a3a'] : ['#5f8a40', '#44702e', '#6a7a3a', '#5a6a34'], 40, 200, 0.4);
    if (P === 3) { speck(5200, ['#f4e36a', '#ffffff', '#b58ae0', '#f29ac0', '#f4e36a'], 0.9, 1.7, 0.85); blot(46, ['#9a9a96', '#b0b0aa', '#84847e'], 10, 34, 0.9);
      for (let i = 0; i < 46; i++) { const x = R() * S, y = R() * S, col = pick(['#f4e36a', '#ffffff', '#b58ae0', '#f29ac0', '#ff8a5a']), rr = 20 + R() * 46; g.fillStyle = col; g.globalAlpha = 0.9; for (let q = 0; q < 90; q++) { const a2 = R() * TAU, d = Math.sqrt(R()) * rr; g.beginPath(); g.arc((((x + Math.cos(a2) * d) % S) + S) % S, (((y + Math.sin(a2) * d * 0.6) % S) + S) % S, 0.9 + R() * 1.1, 0, 6.3); g.fill(); } g.globalAlpha = 1; } }
    else { speck(3600, ['#b8a868', '#a09050', '#c8b878'], 0.8, 1.6, 0.6); blot(60, ['#3a5a30', '#6a6038'], 30, 90, 0.5); }
    const st = wind(false, S * 0.3, 100, 2, 5, 1.1); stroke(st, 20, P === 3 ? '#4a8a30' : '#3a5a2c'); stroke(st, 11, P === 3 ? '#6ab0d0' : '#3a6a8a'); stroke(st, 4, '#d8f0f8', 0.7);
    const path = wind(true, S * 0.6, 80, 1, 3, 0.7); stroke(path, 7, '#8a7a52', 0.7); stroke(path, 4, '#d0bc8c');
    patch(P === 3 ? ['#234a22', '#2c5628', '#1c3e1e'] : ['#1f3a24', '#28462a', '#182f1e'], P === 3 ? 13 : 20, 60, 170);
    lane(path, 9, 15, P === 3 ? 'chalet' : 'cabin'); if (P === 3) lane(path, 1, 40, 'church');
  }
  { const c2 = document.createElement('canvas'); c2.width = c2.height = 8; const g2 = c2.getContext('2d'); g2.drawImage(c, 0, 0, 8, 8); const d = g2.getImageData(0, 0, 8, 8).data, m = [0, 0, 0]; for (let i = 0; i < 256; i += 4) for (let q = 0; q < 3; q++) m[q] += Math.pow(d[i + q] / 255, 2.2) / 64; out.mean = m; }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.repeat.set(2, 2); out.tex = t; return out;
}
// ---------- the world ----------
function buildWorld() {
  if (V3) return V3; const T = window.THREE; if (!T || !W3 || !W3.init({ canvas: $('gl'), fov: 60, far: 7000, near: 2 })) { V3 = { none: true }; return V3; }
  V3 = { T, S: W3.scene, t: 0, for: null }; const V = V3, M = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.8 }, o)); V.M = M;
  W3.scene.children.forEach(o => { if (o.isLineSegments) o.visible = false; });
  V.boxG = new T.BoxGeometry(1, 1, 1); V.cylG = new T.CylinderGeometry(1, 1, 1, 10); V.noise = new T.ImprovedNoise(); V.gt = {};
  V.me = makeBalloon(V, mySkin()); V.S.add(V.me.g);
  V.ring = new T.Mesh(new T.RingGeometry(5, 7.5, 32).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: 0xffe040, transparent: true, opacity: 0.85, depthWrite: false })); V.S.add(V.ring);
  // the balloon's shadow on the ground, straight below it (how high you are, and what you are over)
  V.blob = new T.Mesh(new T.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ map: canvasTexB(64, 64, (q, w) => { const gr = q.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(10,20,10,.9)'); gr.addColorStop(0.6, 'rgba(10,20,10,.55)'); gr.addColorStop(1, 'rgba(10,20,10,0)'); q.fillStyle = gr; q.fillRect(0, 0, w, w); }), transparent: true, depthWrite: false, opacity: 0.5 })); V.blob.renderOrder = 2; V.S.add(V.blob);
  // clouds to climb past: three painted shapes
  V.cloudT = [0, 1, 2].map(s => canvasTexB(256, 128, (q, w, h) => { const R2 = rng(40 + s * 9); for (let i = 0; i < 18; i++) { const x = 40 + R2() * (w - 80), r = 18 + R2() * 26, y = h * 0.64 - R2() * 24 - (1 - Math.abs(x - w / 2) / (w / 2)) * 16, gr = q.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(0.55, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); q.fillStyle = gr; q.fillRect(x - r, y - r, r * 2, r * 2); }
    const gr = q.createLinearGradient(0, h * 0.48, 0, h * 0.9); gr.addColorStop(0, 'rgba(140,155,185,0)'); gr.addColorStop(1, 'rgba(140,155,185,.4)'); q.globalCompositeOperation = 'source-atop'; q.fillStyle = gr; q.fillRect(0, 0, w, h); }));
  V.markers = []; V.decor = []; V.items = []; V.clouds = []; V.birds = [];
  W3.setQuality(stepN); return V; }
// several shapes, each in one colour, made into one piece (for trees and buildings: few pieces to draw)
function joinParts(T, parts) { const gs = parts.map(([g, c]) => { g = g.index ? g.toNonIndexed() : g; const n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set(c, i * 3); g.setAttribute('color', new T.BufferAttribute(a, 3)); return g; }); const geo = T.mergeGeometries(gs); geo.computeVertexNormals(); return geo; }
function scatter(V, geo, list, shadow) { const T = V.T, m = new T.InstancedMesh(geo, W3.seeThrough(new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, flatShading: true })), list.length), d = new T.Object3D(), c = new T.Color();
  list.forEach((t, i) => { d.position.set(t.x, t.y, t.z); d.rotation.set(0, t.rot || 0, 0); d.scale.set(t.s, t.s * (t.sy || 1), t.s); d.updateMatrix(); m.setMatrixAt(i, d.matrix); c.setRGB(t.c[0], t.c[1], t.c[2]); m.setColorAt(i, c); }); m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; m.castShadow = !!shadow; m.receiveShadow = true; return m; }
function mesaGeo(T) { const g = new T.CylinderGeometry(0.74, 1, 1, 13, 4).toNonIndexed(), p = g.attributes.position, col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), a = Math.atan2(z, x); if (Math.hypot(x, z) > 0.01) { const k2 = 1 + 0.16 * Math.sin(a * 3 + y * 5) + 0.09 * Math.sin(a * 7 + 1.3) + (y < 0.49 ? 0.05 * Math.sin(y * 40) : 0); p.setX(i, x * k2); p.setZ(i, z * k2); }
    col.set(y > 0.49 ? [0.56, 0.3, 0.18] : y > 0.2 ? [0.44, 0.2, 0.12] : y > -0.1 ? [0.54, 0.28, 0.16] : y > -0.3 ? [0.36, 0.15, 0.1] : [0.44, 0.2, 0.13], i * 3); p.setY(i, y + 0.5); }
  g.setAttribute('color', new T.BufferAttribute(col, 3)); g.computeVertexNormals(); return g; }
const WATER_Y = 0.5;
function buildPlace(V, G) { const T = V.T, P = G.cfg.place, R = rng(G.seed + 5), F = G.F, N3 = V.noise;
  for (const o of V.items) { V.S.remove(o); o.traverse(c => { if (c.geometry && c.geometry !== V.boxG && c.geometry !== V.cylG) c.geometry.dispose(); }); } V.items = []; const add = o => { V.S.add(o); V.items.push(o); return o; };
  let cx = 0, cz = 0; const all = [F.start].concat(F.T, [F.field]); all.forEach(p => { cx += p.x / all.length; cz += p.z / all.length; });
  const GT = V.gt[P] || (V.gt[P] = paintGround(P)), x0 = cx - TILE, z0 = cz - TILE, mt = v => ((v % TILE) + TILE) % TILE, gy = (x, z) => groundAt(G, x, z);
  // The land the eye sees. In the lakes the rules' ground is flat at 0 wherever it would be lower: that flat is the lake. Here the land
  // carries on down under the water (the same hills as the rules', not cut off), so there are real shores; and whatever lies on the
  // ground (an X, the landing field, the shadow) lies on the water where there is water.
  const sd = G.seed % 7, raw = (x, z) => Math.sin(x * 0.006 + sd) * 8 + Math.sin(z * 0.005 + x * 0.002) * 10 + Math.sin((x + z) * 0.013) * 3;
  const land = P === 4 ? (x, z) => { const h = raw(x, z); return h > 0 ? h : h * 1.6 - 0.05; } : gy, dry = P === 4 ? (x, z) => raw(x, z) > 1.7 : () => true;
  V.top = P === 4 ? (x, z) => Math.max(groundAt(G, x, z), WATER_Y) : gy;
  // a start on the lake is a start from a raft
  V.raft = null; if (P === 4 && raw(F.start.x, F.start.z) < 0.9) { const g = new T.Group(), wood = V.M(0x8a6a44), dk = V.M(0x5a4228); const deck = new T.Mesh(V.boxG, wood); deck.scale.set(15, 0.5, 15); deck.position.y = 0.3; deck.receiveShadow = true; g.add(deck);
    for (let i = -3; i <= 3; i++) { const pl = new T.Mesh(V.boxG, dk); pl.scale.set(15.2, 0.06, 0.18); pl.position.set(0, 0.56, i * 2.1); g.add(pl); } for (const [a, b2] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const dr = new T.Mesh(V.cylG, V.M(0x2a5a8a, { metalness: 0.3 })); dr.scale.set(1.1, 13, 1.1); dr.rotation.x = Math.PI / 2; dr.position.set(a * 6.6, -0.2, 0); if (b2 > 0) { dr.rotation.set(0, 0, Math.PI / 2); dr.position.set(0, -0.2, a * 6.6); } g.add(dr); }
    g.position.set(F.start.x, WATER_Y, F.start.z); add(g); V.raft = { x: F.start.x, z: F.start.z }; }
  V.floor = (x, z) => V.raft && Math.abs(x - V.raft.x) < 7.5 && Math.abs(z - V.raft.z) < 7.5 ? WATER_Y + 0.56 : V.top(x, z) + (P === 4 ? 0.12 : 0);
  // nothing is planted or built on the start, an X, the landing field or under the wires
  const keep = (x, z, m) => !(Math.hypot(x - F.start.x, z - F.start.z) < 32 + m || F.T.some(t => Math.hypot(t.x - x, t.z - z) < 30 + m) || (Math.abs(x - F.field.x) < F.field.half + 8 + m && Math.abs(z - F.field.z) < F.field.half + 8 + m) || F.lines.some(L => segDist(x, z, L) < 9 + m)) && Math.hypot(x - cx, z - cz) < 1180 && dry(x, z);
  // the land: the painted map, with a little light and shade over it so that no two parts look quite the same
  const shade = (x, z) => 0.92 + 0.13 * N3.noise(x * 0.003, 0.7, z * 0.003);
  add(W3.terrain({ size: TILE * 2, seg: 150, x: cx, z: cz, map: GT.tex, height: land, colour: (x, z, h) => { const v = shade(x, z); if (P === 4 && h < 2.4) { const s = clamp((2.4 - h) / 1.6, 0, 1); return [v * (1 + 1.1 * s), v * (1 + 0.75 * s), v * (1 + 0.3 * s)]; } return [v, v, v]; } }));
  // the hills and mountains all round, far off: the same land carried on (the same painted map, joined to it), rising as it goes
  { const amp = [120, 160, 280, 760, 260][P], mean = GT.mean, plain = P === 3; if (!GT.far) { GT.far = GT.tex.clone(); GT.far.repeat.set(8, 8); GT.far.needsUpdate = true; }
    const rise = (x, z) => { const m = clamp((Math.max(Math.abs(x - cx), Math.abs(z - cz)) - TILE) / 900, 0, 1); return m * m * (3 - 2 * m); };
    add(W3.terrain({ size: TILE * 8, seg: 104, x: cx, z: cz, rough: 1, map: plain ? null : GT.far, height: (x, z) => { if (Math.abs(x - cx) < TILE - 1 && Math.abs(z - cz) < TILE - 1) return -14; const s = rise(x, z); let n = 0.55 + 0.45 * N3.noise(x * 0.0009, 2.2, z * 0.0009) + 0.25 * N3.noise(x * 0.003, 5.1, z * 0.003);
        if (P === 3) n = 0.35 + Math.abs(N3.noise(x * 0.0007, 1.3, z * 0.0007)) + 0.3 * N3.noise(x * 0.0026, 4, z * 0.0026); if (P === 2) n = Math.round(n * 3) / 3 + 0.05 * N3.noise(x * 0.004, 9, z * 0.004);
        return land(x, z) * (1 - s) + s * (2 + Math.max(0, n) * amp); },
      colour: (x, z, h, sl) => { const v = shade(x, z), s = rise(x, z);
        if (plain) { const c = h > 430 ? [1.5, 1.52, 1.58] : h > 250 ? (sl > 0.25 ? [0.5, 0.5, 0.52] : [0.42, 0.5, 0.36]) : [0.07, 0.17, 0.09], u = clamp((h - 45) / 60, 0, 1); return [mean[0] * v * (1 - u) + c[0] * u, mean[1] * v * (1 - u) + c[1] * u, mean[2] * v * (1 - u) + c[2] * u]; }
        if (P === 2) { const d = sl > 0.2 ? 0.62 : 1 + Math.min(0.25, h / amp * 0.3); return [v * d, v * d * (sl > 0.2 ? 0.9 : 1), v * d * (sl > 0.2 ? 0.9 : 1)]; }
        const d = 1 - 0.18 * s; return [v * d, v * d, v * d * (1 + 0.12 * s)]; } })); }
  if (!V.water) V.water = W3.water({ size: TILE * 8, color: 0x0e3a5a, y: WATER_Y, ripple: 0.5, distort: 1.2 }); V.water.visible = P === 4; V.water.position.set(cx, WATER_Y, cz);
  // seen from above the lake was a grey mass (the sun's glitter on every ripple, and a quarter of the haze mixed into its colour): a deep dusk blue, the glitter low
  if (P === 4) { const u = V.water.material.uniforms; u.waterColor.value.set(0x184868); u.sunColor.value.set(0xff9a5c).multiplyScalar(0.22); }
  // trees: on the painted hedges and in the painted woods, in all four copies of the map
  const round = [], cyp = [], pine = [], green = () => { const v = 0.7 + R() * 0.3; return [v * (0.85 + R() * 0.3), v, v * 0.85]; };
  for (const [ti, tj] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const ox = x0 + ti * TILE, oz = z0 + tj * TILE;
    for (const h of GT.hedges) { const len = Math.hypot(h[2] - h[0], h[3] - h[1]); for (let t = 5 + R() * 8; t < len - 4; t += 13 + R() * 10) { const x = ox + h[0] + (h[2] - h[0]) * t / len, z = oz + h[1] + (h[3] - h[1]) * t / len; if (!keep(x, z, 0)) continue; (P === 1 ? cyp : round).push({ x, y: gy(x, z) - 0.2, z, s: 0.75 + R() * 0.6, rot: R() * 6, c: green() }); } }
    for (const w of GT.woods) { const n = Math.min(64, (w.rx * w.rz * 4 / 240) | 0); for (let q = 0; q < n; q++) { let dx, dz; if (w.rect) { dx = (R() * 2 - 1) * w.rx; dz = (R() * 2 - 1) * w.rz; } else { const a = R() * TAU, d = Math.sqrt(R()); dx = Math.cos(a) * d * w.rx; dz = Math.sin(a) * d * w.rz; }
        const x = ox + mt(w.x + dx), z = oz + mt(w.z + dz); if (!keep(x, z, 0)) continue; if (P >= 3) pine.push({ x, y: gy(x, z) - 0.2, z, s: 1.3 + R() * 1.1, rot: R() * 6, hue: R(), shade: R() }); else round.push({ x, y: gy(x, z) - 0.2, z, s: 0.8 + R() * 0.7, rot: R() * 6, c: green() }); } } }
  if (P >= 3) for (let i = 0; i < 90; i++) { const x = cx + (R() - 0.5) * 1900, z = cz + (R() - 0.5) * 1900; if (keep(x, z, 0)) pine.push({ x, y: gy(x, z) - 0.2, z, s: 1.2 + R(), rot: R() * 6, hue: R(), shade: R() }); }
  if (round.length) add(scatter(V, V.treeG || (V.treeG = joinParts(T, [[new T.IcosahedronGeometry(1, 0).scale(3.3, 2.9, 3.3).translate(0, 4.4, 0), [0.13, 0.27, 0.08]], [new T.IcosahedronGeometry(1, 0).scale(2.1, 1.9, 2.1).translate(1.3, 6.2, 0.6), [0.17, 0.33, 0.1]], [new T.CylinderGeometry(0.28, 0.4, 2.6, 5).translate(0, 1.3, 0), [0.3, 0.2, 0.12]]])), round.slice(0, 2600)));
  if (cyp.length) add(scatter(V, V.cypG || (V.cypG = joinParts(T, [[new T.ConeGeometry(1.15, 9.5, 7).translate(0, 5.6, 0), [0.07, 0.17, 0.08]], [new T.CylinderGeometry(0.2, 0.26, 1.4, 5).translate(0, 0.7, 0), [0.3, 0.2, 0.12]]])), cyp.slice(0, 1600)));
  if (pine.length) { const pm = add(W3.pines(pine.slice(0, 2000), { shadow: false, layers: 4 })); W3.seeThrough(pm.material); }
  if (P === 2) { const mesa = []; for (const [ti, tj] of [[0, 0], [1, 0], [0, 1], [1, 1]]) for (const rk of GT.rocks) { const x = x0 + ti * TILE + rk.x, z = z0 + tj * TILE + rk.z; if (!keep(x, z, rk.r + 6)) continue; const v = 0.9 + R() * 0.2; mesa.push({ x, y: gy(x, z) - 1.5, z, s: rk.r, sy: (rk.h + 1.5) / rk.r, rot: rk.rot, c: [v, v, v] }); }
    if (mesa.length) add(scatter(V, V.mesaG || (V.mesaG = mesaGeo(T)), mesa, true)); }
  if (P === 2) { const cac = [], rock = []; for (let i = 0; i < 240; i++) { const x = cx + (R() - 0.5) * 2000, z = cz + (R() - 0.5) * 2000; if (!keep(x, z, 0)) continue; if (i % 3) rock.push({ x, y: gy(x, z) - 0.4, z, s: 1 + R() * 2.6, sy: 0.5 + R() * 0.5, rot: R() * 6, c: [0.8 + R() * 0.3, 0.8 + R() * 0.2, 0.8 + R() * 0.2] }); else cac.push({ x, y: gy(x, z), z, s: 0.8 + R() * 0.5, rot: R() * 6, c: green() }); }
    add(scatter(V, joinParts(T, [[new T.DodecahedronGeometry(1.4, 0), [0.62, 0.32, 0.22]]]), rock));
    add(scatter(V, joinParts(T, [[new T.CylinderGeometry(0.42, 0.46, 5.2, 7).translate(0, 2.6, 0), [0.26, 0.44, 0.24]], [new T.CylinderGeometry(0.26, 0.26, 1.2, 6).rotateZ(Math.PI / 2).translate(0.8, 2.4, 0), [0.26, 0.44, 0.24]], [new T.CylinderGeometry(0.26, 0.26, 1.7, 6).translate(1.3, 3.2, 0), [0.26, 0.44, 0.24]], [new T.CylinderGeometry(0.24, 0.24, 1.0, 6).rotateZ(Math.PI / 2).translate(-0.7, 3.1, 0), [0.26, 0.44, 0.24]], [new T.CylinderGeometry(0.24, 0.24, 1.3, 6).translate(-1.1, 3.7, 0), [0.26, 0.44, 0.24]]]), cac)); }
  // buildings, along the painted lanes: farmhouses, barns with silos and a church (farmland); stone villas (vineyards); adobe (canyon);
  // chalets and a chapel (alps); cabins with lit windows (lakes at dusk). One piece for each colour.
  { const B = {}, i2 = s => ((s.x * 7 + s.z) | 0) % 3, box = (w, h, d) => new T.BoxGeometry(w, h, d).toNonIndexed(), gable = (w, h, d) => { const q = new T.CylinderGeometry(1, 1, 1, 3, 1).toNonIndexed(); q.rotateX(-Math.PI / 2); q.scale(w / 1.732, h / 1.5, d); q.translate(0, h / 3, 0); q.rotateY(Math.PI / 2); return q; };
    for (const [ti, tj] of [[0, 0], [1, 0], [0, 1], [1, 1]]) for (const s of GT.spots) { const x = x0 + ti * TILE + mt(s.x), z = z0 + tj * TILE + mt(s.z); if (!keep(x, z, 14)) continue; const y = gy(x, z) - 0.3;
      const at = (key, geo, lx, ly, lz) => { geo.translate(lx, ly, lz); geo.rotateY(-s.rot); geo.translate(x, y, z); (B[key] = B[key] || []).push(geo); };
      if (s.kind === 'church') { at('wallW', box(14, 6, 7), 0, 3, 0); at('roofD', gable(7.6, 3.4, 14.6), 0, 6, 0); at('wallW', box(4, 13, 4), -8.5, 6.5, 0); at('roofD', new T.ConeGeometry(3.2, 7, 4).toNonIndexed().rotateY(Math.PI / 4), -8.5, 16.5, 0); }
      else if (s.kind === 'farm' && P === 0) { at('barn', box(14, 6, 9), 0, 3, 0); at('roofD', gable(10, 4, 14.8), 0, 6, 0); at('wallW', box(3, 3.6, 0.3), 0, 1.8, 4.6); at('silo', new T.CylinderGeometry(2.3, 2.3, 11, 12).toNonIndexed(), 10.5, 5.5, 2); at('silo', new T.SphereGeometry(2.3, 12, 6, 0, TAU, 0, Math.PI / 2).toNonIndexed(), 10.5, 11, 2); at('wallW', box(8, 4.2, 6.5), -14, 2.1, 1); at('roofR', gable(7.4, 2.8, 8.8), -14, 4.2, 1); }
      else if (s.kind === 'farm') { at('wallS', box(18, 6, 10), 0, 3, 0); at('roofT', gable(11, 2.6, 19), 0, 6, 0); at('wallS', box(4.4, 10, 4.4), 10.5, 5, 0); at('roofT', new T.ConeGeometry(3.6, 2.4, 4).toNonIndexed().rotateY(Math.PI / 4), 10.5, 11.2, 0); }
      else if (s.kind === 'chalet') { at('wallW', box(9, 2.2, 7), 0, 1.1, 0); at('wood', box(9.5, 3, 7.5), 0, 3.7, 0); at('roofD', gable(10.4, 2.8, 11.4), 0, 5.2, 0); at('wood', box(9.9, 0.25, 1.1), 0, 2.3, 4.1); }
      else if (s.kind === 'cabin') { at('wood', box(7, 3.2, 5.5), 0, 1.6, 0); at('roofD', gable(6.8, 2.2, 8), 0, 3.2, 0); for (const lx of [-1.8, 1.8]) for (const lz of [-2.78, 2.78]) at('lit', box(1.3, 1.0, 0.12), lx, 1.9, lz); at('wallW', box(0.8, 1.6, 0.8), 2.4, 4.6, 0); }
      else if (s.kind === 'adobe') { at('adobe', box(8, 3.6, 6.5), 0, 1.8, 0); at('adobe', box(4.2, 2.8, 4.2), 5.6, 1.4, 0.8); at('wood', box(8.4, 0.3, 6.9), 0, 3.7, 0); at('wood', box(1.2, 2.1, 0.2), -1, 1.05, 3.3); }
      else if (P === 1) { at('wallS', box(11, 5, 8), 0, 2.5, 0); at('roofT', gable(9, 2.2, 11.8), 0, 5, 0); }
      else { at(i2(s) ? 'wallW' : 'wallS', box(9, 4.5, 7), 0, 2.25, 0); at(i2(s) ? 'roofR' : 'roofD', gable(8, 3.2, 9.8), 0, 4.5, 0); at('roofD', box(0.8, 2, 0.8), 2.5, 6.6, 0.5); } }
    const mats = { wallW: [0xf2ece0], wallS: [0xd9c49a], roofR: [0xa8452f], roofT: [0xc86a3a], roofD: [0x4a4a52], barn: [0x9a2f25], silo: [0xc8ccd0, { metalness: 0.6, roughness: 0.4 }], wood: [0x6a4a30], adobe: [0xd2a878], lit: [0xffd27a, { emissive: 0xffb040, emissiveIntensity: 1.6 }] };
    for (const key in B) { const m = add(new T.Mesh(T.mergeGeometries(B[key]), W3.seeThrough(V.M(mats[key][0], mats[key][1] || {})))); m.receiveShadow = true; m.castShadow = true; } }
  // the crosses and their rings
  // (23 Nov 2026, from his review of Reel 'Em In: "make the circle distinct from the water color so its easy to see": the target here was a thin pale ring
  // that the haze washed out.) The X and its rings are drawn without haze, the rings wider, each with a dark edge. (24 Nov 2026: they lie ON the
  // land now, following its rise and fall; laid flat at one height, a hillside cut each ring into pieces. And the X you are flying to is the bright one.)
  const top = V.top, drape = (geo, ox, oz, lift) => { const q = geo.attributes.position; for (let i = 0; i < q.count; i++) q.setY(i, top(ox + q.getX(i), oz + q.getZ(i)) + lift); return geo; };
  const xm = new T.MeshBasicMaterial({ color: 0xffffff, fog: false, side: T.DoubleSide }), em = new T.MeshBasicMaterial({ color: 0x2a0a06, transparent: true, opacity: 0.45, side: T.DoubleSide, depthWrite: false, fog: false });
  V.targets = F.T.map((t, i) => { const g = new T.Group(), rm = new T.MeshBasicMaterial({ color: 0xff3a2a, transparent: true, opacity: 0.6, side: T.DoubleSide, depthWrite: false, fog: false }); g.userData.rm = rm;
    for (const a of [Math.PI / 4, -Math.PI / 4]) g.add(new T.Mesh(drape(new T.PlaneGeometry(26, 4, 8, 1).rotateX(-Math.PI / 2).rotateY(a), t.x, t.z, 0.75), xm));
    for (const r of [10, 30, 60]) { const ring = new T.Mesh(drape(new T.RingGeometry(r - 1.3, r + 1.3, 72).rotateX(-Math.PI / 2), t.x, t.z, 0.6), rm); ring.renderOrder = 1; g.add(ring); }
    for (const r of [10, 30, 60]) g.add(new T.Mesh(drape(new T.RingGeometry(r + 1.3, r + 2.1, 72).rotateX(-Math.PI / 2), t.x, t.z, 0.5), em)); g.position.set(t.x, 0, t.z); return add(g); });
  { const f = F.field, g = new T.Group(); g.add(new T.Mesh(drape(new T.PlaneGeometry(f.half * 2, f.half * 2, 14, 14).rotateX(-Math.PI / 2), f.x, f.z, 0.4), new T.MeshBasicMaterial({ color: 0x5ad06a, transparent: true, opacity: 0.5, depthWrite: false })));
    const ep = []; for (const [a, b, c, d] of [[-1, -1, 1, -1], [1, -1, 1, 1], [1, 1, -1, 1], [-1, 1, -1, -1]]) for (let q = 0; q < 14; q++) { const x = (a + (c - a) * q / 14) * f.half, z = (b + (d - b) * q / 14) * f.half; ep.push(new T.Vector3(x, top(f.x + x, f.z + z) + 0.7, z)); }
    g.add(new T.LineLoop(new T.BufferGeometry().setFromPoints(ep), new T.LineBasicMaterial({ color: 0xffffff })));
    const py = top(f.x + f.half - 6, f.z + f.half - 6), pole = new T.Mesh(V.cylG, V.M(0xdddddd)); pole.scale.set(0.3, 10, 0.3); pole.position.set(f.half - 6, py + 5, f.half - 6); g.add(pole); V.sock = new T.Mesh(new T.ConeGeometry(1.2, 6, 10, 1, true).rotateZ(Math.PI / 2), V.M(0xff7a1a, { side: T.DoubleSide })); V.sock.position.set(f.half - 6, py + 9.5, f.half - 6); g.add(V.sock);
    g.position.set(f.x, 0, f.z); V.field = add(g); V.field.visible = G.cfg.land; }
  // pylons and wires
  for (const L of F.lines) { const n = 5, pts = []; for (let i = 0; i < n; i++) { const u = i / (n - 1), x = L.x0 + (L.x1 - L.x0) * u, z = L.z0 + (L.z1 - L.z0) * u, y = groundAt(G, x, z); const p = add(new T.Mesh(V.boxG, V.M(0x8a8a8a, { metalness: 0.5 }))); p.scale.set(1.2, L.h + 3, 1.2); p.position.set(x, y + (L.h + 3) / 2, z); const arm = add(new T.Mesh(V.boxG, V.M(0x8a8a8a))); arm.scale.set(8, 0.6, 0.6); arm.position.set(x, y + L.h + 2, z); arm.rotation.y = -Math.atan2(L.z1 - L.z0, L.x1 - L.x0) + Math.PI / 2; pts.push(new T.Vector3(x, y + L.h, z)); }
    add(new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: 0x1a1a1a }))); for (let i = 0; i < n - 1; i++) { const m = pts[i].clone().lerp(pts[i + 1], 0.5); const b = add(new T.Mesh(new T.SphereGeometry(1.4, 10, 8), V.M(0xff4a2a))); b.position.copy(m); } }
  // other balloons at every height (it is a festival): each drifts on the wind at its own height, so they show which way each wind blows
  V.decor = []; for (let i = 0; i < 8; i++) { const sk = SKINS[(i + 1) % SKINS.length], b = makeBalloon(V, sk, true), a = R() * TAU, d = 220 + R() * 600; add(b.g); V.decor.push({ b, x: cx + Math.cos(a) * d, z: cz + Math.sin(a) * d, y: 40 + R() * 210 }); }
  // clouds, low and high: you climb up to them and past them
  for (const c of V.clouds) V.S.remove(c.sp); V.clouds = []; const tint = { morning: 0xffffff, golden: 0xffe6c4, noon: 0xffffff, sunset: 0xffc4a4 }[PLACES[P].sky] || 0xffffff;
  for (let i = 0; i < 36; i++) { const near = i < 12, a = R() * TAU, d = near ? 70 + R() * 200 : 260 + R() * 800, w = near ? 46 + R() * 60 : 80 + R() * 140, sp = new T.Sprite(new T.SpriteMaterial({ map: V.cloudT[i % 3], color: tint, transparent: true, opacity: 0.9, depthWrite: false })); sp.scale.set(w, w * 0.5, 1); V.S.add(sp); V.clouds.push({ sp, near, x: F.start.x + Math.cos(a) * d, y: near ? 55 + (i / 12) * 230 + R() * 16 : 90 + R() * 260, z: F.start.z + Math.sin(a) * d, w, o: 0.72 + R() * 0.22 }); }
  // birds circling in the rising air (where a thermal lifts you)
  for (const q of V.birds) V.S.remove(q.m); V.birds = []; const bg = V.birdG || (V.birdG = new T.BufferGeometry().setFromPoints([[-1.3, 0.25, 0], [0, 0, 0.3], [0, 0, -0.3], [1.3, 0.25, 0], [0, 0, -0.3], [0, 0, 0.3]].map(p => new T.Vector3(...p)))), bm = new T.MeshBasicMaterial({ color: 0x1a1a1a, side: T.DoubleSide });
  for (const th of F.thermals) for (let i = 0; i < 4; i++) { const m = new T.Mesh(bg, bm); V.S.add(m); V.birds.push({ m, th, a: R() * TAU, r: th.r * (0.3 + R() * 0.4), y: 50 + R() * 110, sp: 0.5 + R() * 0.3 }); }
}
// ---------- each frame ----------
function sync(V, G, dt) { V.t += dt; const T = V.T, b = G.b;
  if (V.for !== G.F) { V.for = G.F; const sky = PLACES[G.cfg.place].sky; W3.setSky(sky); W3.scene.fog.near = 260; W3.scene.fog.far = { morning: 5200, noon: 5600, golden: 4300, sunset: 3600 }[sky] || 4800;
    buildPlace(V, G); const s = mySkin(); if (V.skin !== s.id) { V.S.remove(V.me.g); V.me = makeBalloon(V, s); V.S.add(V.me.g); V.skin = s.id; } V.markers.forEach(m => V.S.remove(m)); V.markers = []; ui.snap = true; }
  const gl = groundAt(G, b.x, b.z), agl = b.y - gl, me = V.me, wn = windAt(G, agl);
  // the balloon: it turns slowly, leans a little as a new wind takes it, the flame roars and lights the envelope from inside
  me.g.position.set(b.x, Math.max(b.y, V.floor(b.x, b.z)), b.z); me.spin.rotation.y += dt * 0.06;
  { const lx = b.landed ? 0 : clamp((wn.x - b.vx) * 0.012, -0.07, 0.07), lz = b.landed ? 0 : clamp((wn.z - b.vz) * 0.012, -0.07, 0.07), sw = b.landed ? 0 : 0.008;
    me.g.rotation.z += (-lx + Math.sin(V.t * 0.8) * sw - me.g.rotation.z) * Math.min(1, dt * 2); me.g.rotation.x += (lz + Math.cos(V.t * 0.67) * sw - me.g.rotation.x) * Math.min(1, dt * 2); }
  me.halo.visible = b.burn; if (b.burn) { const hs = 6 + Math.random() * 2.5; me.halo.scale.set(hs, hs, 1); }
  me.flame.visible = b.burn; if (b.burn) me.flame.scale.set(0.9 + Math.random() * 0.25, 0.85 + Math.random() * 0.4, 0.9 + Math.random() * 0.25);
  me.heat += ((b.burn ? 0.5 + Math.random() * 0.15 : 0) - me.heat) * Math.min(1, dt * (b.burn ? 9 : 2.5)); me.em.emissiveIntensity = me.heat; if (me.glow) me.glow.intensity = me.heat * 140;
  me.cap.position.y += ((MOUTH + ENV_H - 0.12 - (b.vent > 0 ? 1.3 : 0)) - me.cap.position.y) * Math.min(1, dt * 6);
  V.blob.position.set(b.x, V.top(b.x, b.z) + 0.9, b.z); { const bs = 20 + agl * 0.05; V.blob.scale.set(bs, 1, bs); V.blob.material.opacity = clamp(0.5 - agl / 700, 0.2, 0.5); }
  V.targets.forEach((g, i) => { g.visible = true; g.userData.rm.opacity = i === G.ti ? 0.85 + Math.sin(V.t * 3) * 0.07 : i < G.ti ? 0.16 : 0.34; });
  V.field.visible = G.cfg.land || G.lesson == null;
  { const w = windAt(G, 2); V.sock.rotation.y = -Math.atan2(w.z, w.x); }
  for (const d of V.decor) { const dw = windAt(G, d.y), hx = d.x - b.x, hz = d.z - b.z, hd = Math.hypot(hx, hz) || 1; d.x += dw.x * dt; d.z += dw.z * dt; if (hd > 1000) { d.x = b.x - hx * 0.9; d.z = b.z - hz * 0.9; } else if (hd < 80) { d.x += hx / hd * dt * 14; d.z += hz / hd * dt * 14; }
    d.b.g.position.set(d.x, groundAt(G, d.x, d.z) + d.y + Math.sin(V.t * 0.2 + d.y) * 5, d.z); d.b.spin.rotation.y += dt * 0.04; }
  for (const q of V.birds) { q.a += dt * q.sp; q.m.position.set(q.th.x + Math.cos(q.a) * q.r, groundAt(G, q.th.x, q.th.z) + q.y + Math.sin(q.a * 0.3) * 8, q.th.z + Math.sin(q.a) * q.r); q.m.rotation.set(0, -q.a, 0.35 + Math.sin(V.t * 7 + q.r) * 0.25); }
  // markers: a little weighted streamer
  while (V.markers.length < G.markers.length) { const m = new T.Mesh(V.boxG, V.M(0xff2a6a, { emissive: 0x401020 })); m.scale.set(1.2, 1.2, 1.2); V.S.add(m); V.markers.push(m); }
  G.markers.forEach((m, i) => { V.markers[i].position.set(m.x, m.falling ? m.y : Math.max(m.y, V.top(m.x, m.z)) + 0.6, m.z); V.markers[i].rotation.y += dt * 3; });
  // the ring: where a marker would land now
  const tg = G.F.T[G.ti]; V.ring.visible = !!tg && !b.landed && !G.markers.some(m => m.falling); if (V.ring.visible) { const p = predictDrop(G); V.ring.position.set(p.x, V.top(p.x, p.z) + 1.1, p.z); const d = Math.hypot(p.x - tg.x, p.z - tg.z); V.ring.material.color.setHex(d < 10 ? 0x7cf07a : d < 30 ? 0xffe040 : 0xffffff); V.ring.scale.setScalar(1 + Math.sin(V.t * 4) * 0.08); }
  // the camera. His review (24 Nov 2026): "if you're going up, you should see yourself going up... You see yourself going past the clouds."
  // The balloon was out of the picture as soon as it climbed. Now it is always in it, large: the camera circles at 80 m from the balloon,
  // behind it (looking on towards the next X), low when the X is far (so the sky, the horizon and the clouds are in view) and swinging up
  // over the balloon as you come over the X, by just as much as keeps the X, and the ring where a marker would land, in the picture.
  const goal = tg || (G.lesson && G.lesson.id === 'wind' ? { x: G.lesson.fx, z: G.lesson.fz } : G.F.field), want = Math.atan2(goal.z - b.z, goal.x - b.x), dist = Math.hypot(goal.x - b.x, goal.z - b.z);
  if (ui.snap) ui.yaw = want; let dy = want - ui.yaw; while (dy > Math.PI) dy -= TAU; while (dy < -Math.PI) dy += TAU; if (dist > 25) ui.yaw += dy * Math.min(1, dt * 0.8);
  const cam = W3.cam, th = Math.tan(cam.fov * Math.PI / 360), Rc = 80, yaw = ui.yaw, gp = { x: goal.x, y: groundAt(G, goal.x, goal.z), z: goal.z }, up = V.ring.visible ? V.ring.position : { x: b.x, y: gl, z: b.z }, wN = clamp((330 - dist) / 170, 0, 1);
  const frame = el => { const fy = 0.40 - 0.13 * clamp((el - 0.16) / 0.8, 0, 1), dl = Math.atan((1 - 2 * fy) * th); return { dl, x: b.x - Math.cos(yaw) * Math.cos(el) * Rc, y: b.y + 14 + Math.sin(el) * Rc, z: b.z - Math.sin(yaw) * Math.cos(el) * Rc, lim: el + dl + Math.atan(0.56 * th) }; };
  let el = 0.16; for (; el < 1.12; el += 0.03) { const f = frame(el), be = q => Math.atan2(f.y - q.y, Math.hypot(q.x - f.x, q.z - f.z)); if (be(gp) <= f.lim && be(up) * wN <= f.lim) break; }
  if (ui.snap || ui.el == null) ui.el = el; ui.el += (el - ui.el) * Math.min(1, dt * 1.4);
  const f = frame(ui.el), pd = ui.el + f.dl, cyy = Math.max(f.y, groundAt(G, f.x, f.z) + 5), ya = yaw + 0.05, pos = [f.x, cyy, f.z], tgt = [f.x + Math.cos(ya) * Math.cos(pd) * 100, cyy - Math.sin(pd) * 100, f.z + Math.sin(ya) * Math.cos(pd) * 100];
  if (!ui.cam || ui.snap) { ui.cam = { p: pos.slice(), l: tgt.slice() }; ui.snap = false; } const kc = Math.min(1, dt * 2.6); for (let i = 0; i < 3; i++) { ui.cam.p[i] += (pos[i] - ui.cam.p[i]) * kc; ui.cam.l[i] += (tgt[i] - ui.cam.l[i]) * kc; }
  const sh = FX.shake > 0 ? (Math.random() - 0.5) * FX.shake * 0.05 : 0; cam.position.set(ui.cam.p[0] + sh, ui.cam.p[1] + sh, ui.cam.p[2]); cam.lookAt(ui.cam.l[0], ui.cam.l[1], ui.cam.l[2]); cam.updateMatrixWorld();
  // the clouds drift on the wind at their own height; one right by the camera thins to mist, and inside one the whole view whitens
  { let veil = 0; const cp = cam.position; for (const c of V.clouds) { const cw = windAt(G, c.y), dx = c.x - b.x, dz = c.z - b.z, d = Math.hypot(dx, dz); c.x += cw.x * dt; c.z += cw.z * dt; if (d > (c.near ? 330 : 1100)) { const a = Math.atan2(-dz, -dx) + (Math.random() - 0.5) * 1.6, nd = c.near ? 190 + Math.random() * 110 : 1040; c.x = b.x + Math.cos(a) * nd; c.z = b.z + Math.sin(a) * nd; c.f = 0; }
      c.sp.position.set(c.x, c.y, c.z); const dc = Math.hypot(c.x - cp.x, c.y - cp.y, c.z - cp.z); c.f = Math.min(1, (c.f == null ? 1 : c.f) + dt * 0.4); c.sp.material.opacity = c.o * c.f * clamp((dc - 25) / 110, 0.12, 1);
      const inx = 1 - d / (c.w * 0.42), iny = 1 - Math.abs(c.y - (b.y + 14)) / (c.w * 0.2); if (inx > 0 && iny > 0) veil = Math.max(veil, Math.min(1, inx * 2) * Math.min(1, iny * 2)); }
    ui.veil = (ui.veil || 0) + (veil - (ui.veil || 0)) * Math.min(1, dt * 3); }
  // a tree, a rock or a roof between the camera and the basket is drawn as a fine screen, so the basket and the flame are always seen
  V.seeB = V.seeB || new T.Vector3(); V.seeB.set(b.x, me.g.position.y + 3, b.z); W3.setSee(cam.position, V.seeB, 9);
  W3.setFocus(b.x, b.y, b.z, 120); }
function scrOf(x, y, z) { const V = V3; if (!V || V.none) return null; return W3.screen(new V.T.Vector3(x, y, z)); }
// ---------- events ----------
function onEvent(G, e) { const b = G.b, bp = () => scrOf(b.x, b.y + 10, b.z) || { x: W / 2, y: H * 0.4 };
  switch (e.k) {
    case 'burn': if (!HEADLESS) sfx.burnStart(); break;
    case 'vent': sfx.vent(); { const p = bp(); say('VENT', p.x, p.y - 40 * k, '#bfe0ff', 16); } break;
    case 'drop': sfx.drop(); vibe(HAP.tick); break;
    case 'mark': { const t = G.F.T[e.ti], p = scrOf(t.x, groundAt(G, t.x, t.z) + 2, t.z) || { x: W / 2, y: H * 0.6 }; if (e.d < 10) { sfx.bull(); vibe(HAP.best); FX.flash = 0.4; say('BULLSEYE!', p.x, p.y - 40 * k, '#7cf07a', 30); burst(p.x, p.y, '#7cf07a', 26, 200); } else { sfx.mark(e.pts); vibe(HAP.light); say(`${Math.round(e.d)} m`, p.x, p.y - 30 * k, e.d < 30 ? '#ffe040' : '#fff', 24); }
      say(`+${e.pts}`, W / 2, H * 0.22, '#ffe040', 26); } break;
    case 'passed': sfx.no(); ui.banner = { txt: 'MISSED THAT X', sub: 'The wind took you past it. On to the next.', t: 0, secs: 2.2, small: true }; break;
    case 'late': ui.banner = { txt: 'TIME TO LAND', sub: 'The morning is over: head for the field', t: 0, secs: 2.6, small: true }; sfx.no(); break;
    case 'bump': sfx.bump(); FX.shake = 8; vibe(HAP.thud); { const p = bp(); say('BUMP!', p.x, p.y, '#ffd0a0', 24); } tip('bump', 'Too fast! Slow the sink with a short burn just before the ground.', 3.4); break;
    case 'touch': if (!e.hard) tip('touch', 'Touched the ground: hold to take off again. Land once the X are done.', 3.4); break;
    case 'landed': sfx.landed(); vibe(HAP.light); ui.banner = { txt: e.inF ? 'SOFT LANDING!' : 'LANDED', sub: G.cfg.land ? `${Math.round(e.d)} m from the field · +${e.pts}` : '', t: 0, secs: 2.2 }; break;
    case 'lineswarn': tip('wires', 'Wires ahead (the red balls)! Climb above them.', 3.2); break;
    case 'wires': sfx.zap(); FX.red = 0.8; FX.shake = 10; ui.banner = { txt: 'THE WIRES!', sub: 'Stay well above the red balls', t: 0, secs: 2.4, small: true }; break;
    case 'nofuel': ui.banner = { txt: 'OUT OF FUEL', sub: 'Down you come: land as softly as you can', t: 0, secs: 2.4, small: true }; break;
    case 'lgoal': break;
    case 'lessonnext': if (e.first) hint = null; say('FIRST, A LESSON', W / 2, H * 0.36, '#ffd36a', 24); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, W / 2, H * 0.36, '#7cf07a', 24); sfx.coin(e.n); break;
    case 'lessonmiss': coachMiss(); say('AGAIN', W / 2, H * 0.4, '#ffd0a0', 20); break;
    case 'lessondone': say('READY: FLY THE TASK!', W / 2, H * 0.36, '#ffd36a', 24); sfx.landed(); ui.snap = true; if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); FX.flash = 0.5; vibe(HAP.best); break;
    case 'lost': sfx.lose(); break;      // (P11: never vibrate on failure)
  } }
// ---------- the picture ----------
let IG = null, IM = {}; function idleG() { if (!IG || IG.over || IG.t > 60) { IG = newGame(3 + ((Math.random() * 6) | 0), { seed: (Math.random() * 1e6) | 0 }); IM = {}; ui.snap = true; } honest(IG, { react: 0.4, acc: 0.95 }, IM); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#8ac0e8'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D sky.', W / 2, H / 2); if (G) hud(G, now); return; }
  const g = G || idleG(); sync(V, g, dt || 1 / 60); W3.render(dt || 1 / 60);
  if (ui.veil > 0.02) { ctx.fillStyle = `rgba(255,255,255,${ui.veil * 0.4})`; ctx.fillRect(0, 0, W, H); }
  // the air going by: faint streaks, down the screen as you climb and up it as you sink (you see yourself rising)
  { const vy = g.b.vy, al = clamp((Math.abs(vy) - 0.4) / 4, 0, 0.2); ui.mote = (ui.mote || 0) + vy * (dt || 1 / 60) * 46 * k;
    if (al > 0.01) { ctx.strokeStyle = `rgba(255,255,255,${al})`; ctx.lineWidth = 1.3 * k; ctx.lineCap = 'round'; ctx.beginPath(); const len = (3 + Math.abs(vy) * 2.5) * k;
      for (let i = 0; i < 14; i++) { const x = ((i * 0.618034) % 1) * W, y = ((((i * 0.381966) % 1) * H + ui.mote * (0.7 + ((i * 0.77) % 1) * 0.6)) % H + H) % H; ctx.moveTo(x, y); ctx.lineTo(x, y + len); } ctx.stroke(); } }
  if (FX.red > 0) { ctx.fillStyle = `rgba(200,40,30,${FX.red * 0.18})`; ctx.fillRect(0, 0, W, H); }
  if (G && !(G.over && !$('ovEnd').classList.contains('hidden'))) hud(G, now);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 1.1 ? 1 : 1 - (t2.t - 1.1) / 0.5; ctx.globalAlpha = Math.max(0, al); ctx.font = `400 ${Math.round(t2.size * k)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(20,30,50,.7)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 18); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 18); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 120), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30, hy = H - 150 * k - h / 2;
    ctx.fillStyle = 'rgba(20,30,50,.92)'; rrect(W / 2 - w / 2 - 30, hy - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2 - 30, hy - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,250,230,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); } }
function layout(G) { return { drop: { x: W - 62 * k, y: H - 76 * k, r: 44 * k }, vent: { x: 62 * k, y: H - 76 * k, r: 40 * k }, bar: { x: W - 40 * k, y0: H * 0.2, y1: H * 0.62 } }; }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function arrow(x, y, ang, len, col) { ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 3 * k; ctx.beginPath(); ctx.moveTo(-len / 2, 0); ctx.lineTo(len / 2 - 4 * k, 0); ctx.stroke(); ctx.beginPath(); ctx.moveTo(len / 2, 0); ctx.lineTo(len / 2 - 8 * k, -5 * k); ctx.lineTo(len / 2 - 8 * k, 5 * k); ctx.fill(); ctx.restore(); }
function hud(G, now) { const L = layout(G), b = G.b, gnd = groundAt(G, b.x, b.z), agl = b.y - gnd, B = L.bar, hY = h => B.y1 - (B.y1 - B.y0) * clamp(h / TOP, 0, 1);
  ctx.textBaseline = 'middle';
  // the winds, by height, turned to the view (up the screen is straight ahead, towards the X)
  ctx.fillStyle = 'rgba(20,30,50,.55)'; rrect(B.x - 34 * k, B.y0 - 22 * k, 62 * k, B.y1 - B.y0 + 44 * k, 14); ctx.fill();
  for (let h = 20; h <= TOP; h += 30) { const w = windAt(G, h), a = Math.atan2(w.z, w.x) - ui.yaw - Math.PI / 2, s = Math.hypot(w.x, w.z), y = hY(h), near = Math.abs(h - agl) < 15;
    arrow(B.x - 6 * k, y, a, (14 + s * 2.2) * k, near ? '#ffe040' : 'rgba(255,255,255,.75)'); }
  ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(B.x + 18 * k, B.y0); ctx.lineTo(B.x + 18 * k, B.y1); ctx.stroke();
  { const y = hY(agl); ctx.fillStyle = mySkin().top === undefined ? '#f2a03a' : '#' + mySkin().top.toString(16).padStart(6, '0'); ctx.beginPath(); ctx.arc(B.x + 18 * k, y, 7 * k, 0, TAU); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.textAlign = 'right'; ctx.fillStyle = '#fff'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(20,30,50,.8)'; const tx = `${Math.round(agl)} m ${b.vy > 0.4 ? '▲' : b.vy < -0.4 ? '▼' : '•'}`; ctx.strokeText(tx, B.x - 36 * k, y); ctx.fillText(tx, B.x - 36 * k, y); }
  if (G.lesson && G.lesson.id === 'rise') { const y = hY(G.lesson.y); ctx.strokeStyle = '#ffcf3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(B.x + 18 * k, y, 12 * k, 0, TAU); ctx.stroke(); }
  if (G.lesson && G.lesson.id === 'wind') { const y = hY(G.winds[G.lesson.layer].y + 8); ctx.strokeStyle = '#ffcf3a'; ctx.lineWidth = 3; rrect(B.x - 30 * k, y - 11 * k, 56 * k, 22 * k, 8); ctx.stroke(); const p = scrOf(G.lesson.fx, groundAt(G, G.lesson.fx, G.lesson.fz) + 25, G.lesson.fz); if (p && p.front) { ctx.font = `${Math.round(30 * k)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('🚩', p.x, p.y); } }
  // the drop button
  { const Vb = L.vent, on = b.vent > 0; ctx.fillStyle = on ? 'rgba(120,190,255,.95)' : 'rgba(20,30,50,.6)'; ctx.beginPath(); ctx.arc(Vb.x, Vb.y, Vb.r, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 3; ctx.stroke(); ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(15 * k)}px ${BC}`; ctx.fillText('VENT', Vb.x, Vb.y - 5 * k); ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.fillText('sink faster', Vb.x, Vb.y + 12 * k); }
  const D = L.drop, can = G.F.T[G.ti] && !b.landed && !G.markers.some(m => m.falling); ctx.fillStyle = can ? 'rgba(255,74,106,.95)' : 'rgba(20,30,50,.5)'; ctx.beginPath(); ctx.arc(D.x, D.y, D.r, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 3; ctx.stroke();
  ctx.font = `${Math.round(30 * k)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText('🎯', D.x, D.y - 6 * k); ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillText('DROP', D.x, D.y + 22 * k);
  if (G.lesson) lessonPanel(G);
  else { // score, the task, fuel
    ctx.textAlign = 'left'; ctx.font = `400 ${Math.round(22 * k)}px ${TF}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(20,30,50,.6)'; const sc = `${G.score}`; ctx.strokeText(sc, 14, 62 * k); ctx.fillStyle = '#fff'; ctx.fillText(sc, 14, 62 * k);
    ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; const need = Math.round(G.best * G.cfg.goal), tg = G.F.T[G.ti], sub = tg ? `X ${G.ti + 1} of ${G.F.T.length} · ${Math.round(Math.hypot(tg.x - b.x, tg.z - b.z))} m away` : G.cfg.land ? `land in the field · ${Math.round(Math.hypot(G.F.field.x - b.x, G.F.field.z - b.z))} m` : 'land softly anywhere';
    ctx.lineWidth = 3; ctx.strokeText(`need ${need}`, 14, 82 * k); ctx.fillStyle = G.score >= need ? '#7cf07a' : '#ffe8b0'; ctx.fillText(`need ${need}`, 14, 82 * k); ctx.strokeText(sub, 14, 100 * k); ctx.fillStyle = '#fff'; ctx.fillText(sub, 14, 100 * k);
    const fu = clamp(G.fuel / G.fuel0, 0, 1), fx = 14, fy = H - 40 * k, fw = Math.min(W * 0.42, 170 * k); ctx.fillStyle = 'rgba(20,30,50,.55)'; rrect(fx, fy - 12 * k, fw, 24 * k, 10); ctx.fill(); ctx.fillStyle = fu > 0.3 ? '#ffb040' : '#ff5a4a'; rrect(fx + 3, fy - 9 * k, (fw - 6) * fu, 18 * k, 8); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.fillText('🔥 FUEL', fx + 8, fy + 1);
    if (G.limit - G.t < 30 && G.ti < G.F.T.length) { ctx.textAlign = 'center'; ctx.font = `400 ${Math.round(16 * k)}px ${TF}`; ctx.fillStyle = '#ffd0a0'; ctx.fillText(`${Math.max(0, Math.ceil(G.limit - G.t))} s to finish the X`, W / 2 - 20, 128 * k); } }
  if ((G && G.lesson) && b.landed && !b.air && !G.lesson && G.t < 6) { ctx.textAlign = 'center'; ctx.font = `400 ${Math.round(20 * k)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(20,30,50,.7)'; ctx.strokeText('HOLD TO FIRE THE BURNER', W / 2 - 20, H * 0.72); ctx.fillStyle = '#ffe040'; ctx.fillText('HOLD TO FIRE THE BURNER', W / 2 - 20, H * 0.72); }
  if (ui.banner) banner(); }
function banner() { const b = ui.banner, a = Math.min(1, b.t / 0.2, ((b.secs || 2.4) - b.t) / 0.4); ctx.globalAlpha = Math.max(0, a); ctx.textAlign = 'center';
  ctx.font = `400 ${Math.round((b.small ? 30 : 40) * k)}px ${TF}`; ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(20,30,50,.7)'; ctx.strokeText(b.txt, W / 2 - 20, H * 0.32); ctx.fillStyle = '#ffe040'; ctx.fillText(b.txt, W / 2 - 20, H * 0.32);
  if (b.sub) { ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; ctx.lineWidth = 4; ctx.strokeText(b.sub, W / 2 - 20, H * 0.32 + 30 * k); ctx.fillStyle = '#fff'; ctx.fillText(b.sub, W / 2 - 20, H * 0.32 + 30 * k); } ctx.globalAlpha = 1; }
function lessonPanel(G) { coachPanel(G); }
