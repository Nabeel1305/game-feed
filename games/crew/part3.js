
// ===================== THE VIEW, part 1: the drawn crew and the station in 3D =====================
// The crew are drawings: each one painted by hand-written canvas code (ink outline, cel shading, a white sticker edge), stood
// up in the 3D station as a flat card that always faces the camera, like paper figures on a model set. Four pictures each:
// two steps of a walk, at work (arms up), and knocked out (lying, X eyes, stars). The station is cel-shaded (toon light in
// three bands), every wall with a dark ink edge, each room with its own floor, props and glow, floating in space.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { stick: null, held: {}, snap: true, cam: null, sabOpen: false, meetT: 0, sel: -1, fog: null };
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 160, star) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60 * k, t: 0, life: 0.6 + Math.random() * 0.5, col, r: (2 + Math.random() * 3) * k, star }); } if (PARTS.length > 260) PARTS.splice(0, PARTS.length - 260); }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2.5); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.5) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * dt; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; } }
const hex = n => '#' + n.toString(16).padStart(6, '0');
const shade = (n, f) => { const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255, m = v => Math.max(0, Math.min(255, Math.round(f > 0 ? v + (255 - v) * f : v * (1 + f)))); return `rgb(${m(r)},${m(g)},${m(b)})`; };
function myLook() { if (typeof HEADLESS !== 'undefined' && HEADLESS) return LOOKS[0]; const id = store.get('look', 'violet'); return LOOKS.find(q => q.id === id) || LOOKS[0]; }
// ---------- the painter: one crewmate, one pose, on a 2D canvas ----------
// pose: 0, 1 walking steps; 2 at work; 3 knocked out (lying down). The body is a soft gumdrop; ears/horns/sprout by kind.
const FW = 192, FH = 240, INK = '#2a1d33';
function paintCrew(x, kind, col, pose, mask) {
  x.save(); x.lineJoin = 'round'; x.lineCap = 'round';
  if (pose === 3) { x.translate(FW / 2, FH * 0.66); x.rotate(-Math.PI / 2 + 0.12); x.scale(0.9, 0.9); x.translate(-FW / 2, -FH * 0.62); }
  const cx = FW / 2, bob = pose === 1 ? -4 : 0, top = 44 + bob, bot = 206 + bob * 0.3, wid = 70;
  // the shapes: [draw-path fn, fill], drawn three times: a white sticker edge, an ink edge, then the colour
  const body = () => { x.beginPath(); x.moveTo(cx - wid, bot - 24); x.bezierCurveTo(cx - wid - 6, top + 60, cx - wid + 8, top, cx, top); x.bezierCurveTo(cx + wid - 8, top, cx + wid + 6, top + 60, cx + wid, bot - 24); x.quadraticCurveTo(cx + wid, bot, cx + wid - 26, bot); x.lineTo(cx - wid + 26, bot); x.quadraticCurveTo(cx - wid, bot, cx - wid, bot - 24); x.closePath(); };
  const step = pose === 0 ? 6 : pose === 1 ? -6 : 0, feet = [() => { x.beginPath(); x.ellipse(cx - 30 + step, bot + 6, 22, 12, 0, 0, TAU); }, () => { x.beginPath(); x.ellipse(cx + 30 - step, bot + 6, 22, 12, 0, 0, TAU); }];
  const up = pose === 2, arms = [() => { x.beginPath(); x.ellipse(cx - wid - 4, up ? top + 70 : top + 112 + step, 13, 22, up ? 0.9 : 0.25, 0, TAU); }, () => { x.beginPath(); x.ellipse(cx + wid + 4, up ? top + 70 : top + 112 - step, 13, 22, up ? -0.9 : -0.25, 0, TAU); }];
  const ears = []; const E = (f) => ears.push(f);
  if (kind === 'cat') { E(() => { x.beginPath(); x.moveTo(cx - 52, top + 22); x.lineTo(cx - 40, top - 30); x.lineTo(cx - 12, top + 4); x.closePath(); }); E(() => { x.beginPath(); x.moveTo(cx + 52, top + 22); x.lineTo(cx + 40, top - 30); x.lineTo(cx + 12, top + 4); x.closePath(); }); }
  if (kind === 'bunny') { E(() => { x.beginPath(); x.ellipse(cx - 24, top - 34, 13, 40, -0.15, 0, TAU); }); E(() => { x.beginPath(); x.ellipse(cx + 24, top - 34, 13, 40, 0.15, 0, TAU); }); }
  if (kind === 'bear') { E(() => { x.beginPath(); x.arc(cx - 46, top + 14, 20, 0, TAU); }); E(() => { x.beginPath(); x.arc(cx + 46, top + 14, 20, 0, TAU); }); }
  if (kind === 'horns') { E(() => { x.beginPath(); x.moveTo(cx - 40, top + 14); x.quadraticCurveTo(cx - 62, top - 26, cx - 34, top - 34); x.quadraticCurveTo(cx - 44, top - 6, cx - 22, top + 6); x.closePath(); }); E(() => { x.beginPath(); x.moveTo(cx + 40, top + 14); x.quadraticCurveTo(cx + 62, top - 26, cx + 34, top - 34); x.quadraticCurveTo(cx + 44, top - 6, cx + 22, top + 6); x.closePath(); }); }
  if (kind === 'sprout') { E(() => { x.beginPath(); x.moveTo(cx - 2, top + 4); x.quadraticCurveTo(cx - 6, top - 22, cx - 34, top - 30); x.quadraticCurveTo(cx - 20, top - 6, cx + 2, top + 4); x.closePath(); x.moveTo(cx + 2, top + 4); x.quadraticCurveTo(cx + 6, top - 18, cx + 30, top - 22); x.quadraticCurveTo(cx + 18, top - 2, cx + 2, top + 4); x.closePath(); }); }
  if (kind === 'antenna') { E(() => { x.beginPath(); x.moveTo(cx - 3, top + 6); x.lineTo(cx - 3, top - 24); x.lineTo(cx + 3, top - 24); x.lineTo(cx + 3, top + 6); x.closePath(); x.moveTo(cx + 12, top - 34); x.arc(cx, top - 34, 12, 0, TAU); }); }
  if (kind === 'fluff') { E(() => { x.beginPath(); for (let i = -1; i <= 1; i++) { x.moveTo(cx + i * 18 + 13, top + 2); x.arc(cx + i * 18, top - 4 - (i ? 0 : 8), 13, 0, TAU); } }); }
  const all = [...ears, ...feet, ...arms, body];
  // the sticker edge, then the ink edge, then the fills
  x.strokeStyle = '#ffffff'; x.lineWidth = 22; for (const f of all) { f(); x.stroke(); }
  x.strokeStyle = INK; x.lineWidth = 8; for (const f of all) { f(); x.stroke(); }
  const fillWith = (f, c) => { f(); x.fillStyle = c; x.fill(); };
  for (const f of ears) fillWith(f, kind === 'sprout' ? '#5ac84a' : kind === 'horns' ? '#f4e2c0' : kind === 'antenna' ? shade(col, -0.3) : hex(col));
  for (const f of feet) fillWith(f, shade(col, -0.45)); for (const f of arms) fillWith(f, shade(col, -0.12));
  // the body: the colour, a darker band on the shadow side (cel shading), a soft light on the lit side
  body(); x.fillStyle = hex(col); x.fill(); x.save(); body(); x.clip();
  x.fillStyle = shade(col, -0.28); x.beginPath(); x.ellipse(cx + wid * 0.95, (top + bot) / 2 + 30, wid * 0.62, (bot - top) * 0.75, 0, 0, TAU); x.fill();
  x.fillStyle = 'rgba(255,255,255,.28)'; x.beginPath(); x.ellipse(cx - wid * 0.45, top + 40, 22, 34, -0.5, 0, TAU); x.fill();
  // a belly patch and a little suit belt
  x.fillStyle = shade(col, 0.35); x.beginPath(); x.ellipse(cx - 4, bot - 46, 38, 30, 0, 0, TAU); x.fill();
  x.fillStyle = shade(col, -0.45); x.fillRect(cx - wid, bot - 70, wid * 2, 9); x.fillStyle = '#ffd860'; x.fillRect(cx - 9, bot - 72, 18, 13); x.restore();
  if (kind === 'cat' || kind === 'bunny') { x.fillStyle = '#ffb0c8'; for (const s of [-1, 1]) { x.beginPath(); kind === 'cat' ? (x.moveTo(cx + s * 44, top + 14), x.lineTo(cx + s * 40, top - 16), x.lineTo(cx + s * 24, top + 4)) : x.ellipse(cx + s * 24, top - 34, 6, 28, s * 0.15, 0, TAU); x.fill(); } }
  if (kind === 'bear') { x.fillStyle = shade(col, 0.35); for (const s of [-1, 1]) { x.beginPath(); x.arc(cx + s * 46, top + 14, 10, 0, TAU); x.fill(); } }
  if (kind === 'antenna') { x.fillStyle = '#ffe060'; x.beginPath(); x.arc(cx, top - 34, 8, 0, TAU); x.fill(); }
  // the face: big eyes (or X eyes when knocked out), a mask for you, cheeks, a mouth
  const ey = top + 62, ex = 26; x.lineWidth = 6; x.strokeStyle = INK;
  if (mask) { x.fillStyle = '#2a1d40'; x.beginPath(); x.moveTo(cx - 64, ey - 16); x.quadraticCurveTo(cx, ey - 30, cx + 64, ey - 16); x.quadraticCurveTo(cx + 68, ey + 18, cx + 40, ey + 20); x.quadraticCurveTo(cx, ey + 8, cx - 40, ey + 20); x.quadraticCurveTo(cx - 68, ey + 18, cx - 64, ey - 16); x.fill(); }
  if (pose === 3) { for (const s of [-1, 1]) { x.beginPath(); x.moveTo(cx + s * ex - 10, ey - 10); x.lineTo(cx + s * ex + 10, ey + 10); x.moveTo(cx + s * ex + 10, ey - 10); x.lineTo(cx + s * ex - 10, ey + 10); x.stroke(); } x.beginPath(); x.ellipse(cx, ey + 36, 10, 7, 0, 0, TAU); x.stroke(); }
  else { for (const s of [-1, 1]) { x.fillStyle = '#ffffff'; x.beginPath(); x.ellipse(cx + s * ex, ey, 17, 21, 0, 0, TAU); x.fill(); x.stroke(); x.fillStyle = mask ? '#ff5a7a' : '#1a1226'; x.beginPath(); x.ellipse(cx + s * ex + 3, ey + 3, 10, 13, 0, 0, TAU); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(cx + s * ex + 7, ey - 3, 4.5, 0, TAU); x.fill(); x.beginPath(); x.arc(cx + s * ex - 1, ey + 8, 2.2, 0, TAU); x.fill(); }
    x.fillStyle = 'rgba(255,110,140,.45)'; for (const s of [-1, 1]) { x.beginPath(); x.ellipse(cx + s * 50, ey + 28, 12, 7, 0, 0, TAU); x.fill(); }
    x.beginPath(); if (pose === 2) x.arc(cx, ey + 32, 9, 0.1, Math.PI - 0.1); else { x.moveTo(cx - 9, ey + 30); x.quadraticCurveTo(cx, ey + 38, cx + 9, ey + 30); } x.stroke(); }
  x.restore();
  if (pose === 3) { x.fillStyle = '#ffe060'; x.strokeStyle = INK; x.lineWidth = 3; for (let i = 0; i < 3; i++) { const a = i / 3 * TAU, sx = FW / 2 + 40 + Math.cos(a) * 26, sy = 120 + Math.sin(a) * 10; starAt(x, sx, sy, 10); } } }
function starAt(x, sx, sy, r) { x.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; x.lineTo(sx + Math.cos(a) * rr, sy + Math.sin(a) * rr); } x.closePath(); x.fill(); x.stroke(); }
// every crewmate's four pictures in one strip (made once; used for the 3D cards and the meeting's portraits)
const ATLAS = {};
function atlasOf(i, col) { const key = i + ':' + col; if (ATLAS[key]) return ATLAS[key]; const c = document.createElement('canvas'); c.width = FW * 4; c.height = FH; const x = c.getContext('2d');
  for (let p = 0; p < 4; p++) { x.save(); x.translate(p * FW, 0); paintCrew(x, KINDS[i], col, p, i === 0); x.restore(); } ATLAS[key] = c; return c; }
// ---------- the station ----------
function toonRamp(T) { const d = new Uint8Array([90, 170, 255]); const t = new T.DataTexture(d, 3, 1, T.RedFormat); t.minFilter = t.magFilter = T.NearestFilter; t.needsUpdate = true; return t; }
const FLOORS = ['#e8dcc8', '#b8bcc8', '#c8e0e8', '#c0c8e0', '#a8d0c0', '#d8c8a8', '#c8b8a0', '#e0d0b0', '#d0c890', '#b8b0a8', '#a8b8c8', '#e0b8a8', '#b8b0a8', '#e0f0f4'];
function paintFloor(G) { const S = 32, c = document.createElement('canvas'); c.width = SW * S; c.height = SD * S; const x = c.getContext('2d'); x.fillStyle = '#10142a'; x.fillRect(0, 0, c.width, c.height);
  for (let b = 0; b < SD; b++) for (let a = 0; a < SW; a++) { if (!G.g[b * SW + a]) continue; const r = G.rm[b * SW + a], base = r >= 0 ? FLOORS[r] : '#8a90a0'; x.fillStyle = base; x.fillRect(a * S, b * S, S, S);
    x.strokeStyle = 'rgba(0,0,0,.10)'; x.lineWidth = 1; x.strokeRect(a * S + 0.5, b * S + 0.5, S - 1, S - 1);
    if (r < 0) { x.fillStyle = 'rgba(0,0,0,.12)'; for (let i = 4; i < S; i += 6) x.fillRect(a * S + 3, b * S + i, S - 6, 2); }      // halls: metal grating
    if (r === RI('Admin') || r === RI('Security')) { x.fillStyle = 'rgba(80,60,120,.12)'; x.fillRect(a * S, b * S, S, S); }
    if (r === RI('Reactor') && (a + b) % 2 === 0) { x.fillStyle = 'rgba(255,200,60,.18)'; x.fillRect(a * S, b * S, S, S); }
    // soft dark along the walls
    for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!G.g[(b + db) * SW + a + da]) { const gr = da ? x.createLinearGradient(a * S + (da > 0 ? S : 0), 0, a * S + (da > 0 ? S - 12 : 12), 0) : x.createLinearGradient(0, b * S + (db > 0 ? S : 0), 0, b * S + (db > 0 ? S - 12 : 12)); gr.addColorStop(0, 'rgba(20,10,40,.35)'); gr.addColorStop(1, 'rgba(20,10,40,0)'); x.fillStyle = gr; x.fillRect(a * S, b * S, S, S); } }
  // the medbay cross, the cafeteria rug, room names on the floor
  { const [, mx, mz] = ROOMS[RI('MedBay')]; x.fillStyle = 'rgba(230,60,80,.35)'; x.fillRect((mx + 2.6) * S, (mz + 1.2) * S, 0.8 * S, 2.6 * S); x.fillRect((mx + 1.7) * S, (mz + 2.1) * S, 2.6 * S, 0.8 * S); }
  { x.fillStyle = 'rgba(200,90,60,.18)'; x.beginPath(); x.ellipse(24.5 * S, 5.5 * S, 5 * S, 3.4 * S, 0, 0, TAU); x.fill(); }
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `900 ${S * 0.9}px "Luckiest Guy", Impact, sans-serif`; ROOMS.forEach(([n, rx, rz, w, d]) => { x.fillStyle = 'rgba(40,30,70,.16)'; x.fillText(n.toUpperCase(), (rx + w / 2) * S, (rz + d - 0.8) * S); });
  for (const v of VENTS) { const vx = v[0] * S, vz = v[1] * S; x.fillStyle = '#4a4e5e'; x.fillRect(vx + 3, vz + 6, S - 6, S - 12); x.fillStyle = '#22242e'; for (let i = 0; i < 4; i++) x.fillRect(vx + 6, vz + 9 + i * 4.5, S - 12, 2.5); x.strokeStyle = INK; x.lineWidth = 2; x.strokeRect(vx + 3, vz + 6, S - 6, S - 12); }
  return c; }
function merge(T, gs) { let n = 0; const ng = gs.map(g => { const q = g.index ? g.toNonIndexed() : g; n += q.attributes.position.count; return q; }); const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3); let o = 0;
  for (const g of ng) { pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); o += g.attributes.position.count; } const out = new T.BufferGeometry(); out.setAttribute('position', new T.BufferAttribute(pos, 3)); out.setAttribute('normal', new T.BufferAttribute(nor, 3)); return out; }
function buildWorld() {
  if (V3) return V3; const T = window.THREE; if (!T || !W3 || !W3.init({ canvas: $('gl'), fov: 42, far: 400, near: 0.3 })) { V3 = { none: true }; return V3; }
  const R = W3.R; R.toneMapping = T.NoToneMapping; R.shadowMap.enabled = true;
  V3 = { T, S: new T.Scene(), built: null, ramp: toonRamp(T) }; const V = V3, toon = (c, e) => new T.MeshToonMaterial({ color: c, gradientMap: V.ramp, emissive: e || 0x000000 });
  V.toon = toon; V.inkMat = new T.MeshBasicMaterial({ color: 0x1a1226, side: T.BackSide });
  // space all round: stars on a big sphere
  { const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const x = c.getContext('2d'), gr = x.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#0a0c24'); gr.addColorStop(0.5, '#1a1440'); gr.addColorStop(1, '#0a1030'); x.fillStyle = gr; x.fillRect(0, 0, 1024, 512);
    for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(255,255,255,${0.3 + Math.random() * 0.7})`; x.fillRect(Math.random() * 1024, Math.random() * 512, Math.random() < 0.1 ? 2 : 1, Math.random() < 0.1 ? 2 : 1); }
    for (let i = 0; i < 6; i++) { const g2 = x.createRadialGradient(0, 0, 0, 0, 0, 120); g2.addColorStop(0, `hsla(${200 + Math.random() * 120},80%,60%,.18)`); g2.addColorStop(1, 'rgba(0,0,0,0)'); x.save(); x.translate(Math.random() * 1024, Math.random() * 512); x.fillStyle = g2; x.fillRect(-120, -120, 240, 240); x.restore(); }
    const tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace; tex.mapping = T.EquirectangularReflectionMapping; V.S.background = tex; }
  V.S.add(new T.HemisphereLight(0xdde4ff, 0x40306a, 1.3)); const sun = new T.DirectionalLight(0xfff2e0, 2.0); sun.position.set(SW / 2 - 14, 30, SD / 2 + 12); sun.target.position.set(SW / 2, 0, SD / 2); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 1024); Object.assign(sun.shadow.camera, { left: -32, right: 32, top: 20, bottom: -20, near: 1, far: 80 }); sun.shadow.bias = -0.0008; V.S.add(sun, sun.target); V.sun = sun;
  V.lights = []; for (const [x2, z2, c] of [[3, 13.5, 0xffb040], [3.5, 4, 0xff8a40], [3.5, 25, 0xff8a40], [13, 5, 0x60e0ff], [12.5, 21, 0xffe060], [49, 13, 0x60a0ff], [24.5, 5.5, 0xfff0d0]]) { const L = new T.PointLight(c, 18, 9, 1.6); L.position.set(x2, 2.4, z2); V.S.add(L); V.lights.push(L); }
  V.cards = []; V.cardGeo = () => new T.PlaneGeometry(1.0, 1.25);
  W3.setQuality(stepN); return V; }
// the station's walls, floor and props (built once per game; the walls' ink edges are the same boxes, a little bigger, inside out)
function buildStation(V, g) { const T = V.T; if (V.st) { V.S.remove(V.st); V.st.traverse(o => { if (o.geometry && o.userData.own) o.geometry.dispose(); }); }
  const grp = new T.Group(); V.st = grp; V.S.add(grp); V.built = g; const own = m => { m.userData.own = 1; grp.add(m); return m; };
  const ft = new T.CanvasTexture(paintFloor(g)); ft.colorSpace = T.SRGBColorSpace; ft.anisotropy = 4; const fl = own(new T.Mesh(new T.PlaneGeometry(SW, SD), new T.MeshToonMaterial({ map: ft, gradientMap: V.ramp }))); fl.rotation.x = -Math.PI / 2; fl.position.set(SW / 2, 0, SD / 2); fl.receiveShadow = true;
  // walls: every non-floor cell next to a floor cell; ink edges
  const WH = 1.05, boxes = [], inks = []; for (let b = -1; b <= SD; b++) for (let a = -1; a <= SW; a++) { if (a >= 0 && b >= 0 && a < SW && b < SD && g.g[b * SW + a]) continue; let near = false; for (let da = -1; da <= 1; da++) for (let db = -1; db <= 1; db++) { const na = a + da, nb = b + db; if (na >= 0 && nb >= 0 && na < SW && nb < SD && g.g[nb * SW + na]) near = true; } if (!near) continue;
    const bx = new T.BoxGeometry(1, WH, 1); bx.translate(a + 0.5, WH / 2, b + 0.5); boxes.push(bx); const ik = new T.BoxGeometry(1.06, WH + 0.06, 1.06); ik.translate(a + 0.5, WH / 2, b + 0.5); inks.push(ik); }
  const wm = own(new T.Mesh(merge(T, boxes), V.toon(0xe4e6f6))); wm.castShadow = true; wm.receiveShadow = true; own(new T.Mesh(merge(T, inks), V.inkMat));
  { const tops = []; for (const bx of boxes) { const p = bx.attributes.position; let x0 = 1e9, z0 = 1e9; for (let i = 0; i < p.count; i++) { x0 = Math.min(x0, p.getX(i)); z0 = Math.min(z0, p.getZ(i)); } const tp = new T.BoxGeometry(1, 0.08, 1); tp.translate(x0 + 0.5, WH + 0.04, z0 + 0.5); tops.push(tp); } own(new T.Mesh(merge(T, tops), V.toon(0xa8acd8))); }
  // props (toon, ink edged): each a list of boxes and cylinders; glowing screens
  const P = (geo, c, x2, y2, z2, e) => { const m = own(new T.Mesh(geo, V.toon(c, e))); m.position.set(x2, y2, z2); m.castShadow = true; const ik = own(new T.Mesh(geo, V.inkMat)); ik.position.copy(m.position); ik.scale.setScalar(1.06); return m; };
  const B = (w, h, d) => new T.BoxGeometry(w, h, d), C = (r, h, n = 18) => new T.CylinderGeometry(r, r, h, n);
  // cafeteria: round tables with benches; the alarm button on the middle one
  for (const [tx, tz] of [[20.5, 3], [28.5, 3], [20.5, 7.6], [28.5, 7.6]]) { P(C(1.1, 0.12), 0xf0e6d6, tx, 0.62, tz); P(C(0.18, 0.6, 8), 0x8a8aa0, tx, 0.3, tz); }
  P(C(1.3, 0.14), 0xf0e6d6, BUTTON[0], 0.7, BUTTON[1]); P(C(0.2, 0.64, 8), 0x8a8aa0, BUTTON[0], 0.32, BUTTON[1]); V.btn = P(C(0.32, 0.18, 20), 0xff3a4a, BUTTON[0], 0.86, BUTTON[1], 0x601010); P(new T.CylinderGeometry(0.42, 0.42, 0.06, 20), 0xe0e0e8, BUTTON[0], 0.78, BUTTON[1]);
  // jobs: consoles with glowing screens
  V.screens = []; for (const j of JOBS) { const [jx, jz] = [j[0] + 0.5, j[1] + 0.5]; let dx = 0, dz = 0; for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!g.g[(j[1] + db) * SW + j[0] + da]) { dx = da; dz = db; } const x2 = jx + dx * 0.32, z2 = jz + dz * 0.32;
    P(B(dx ? 0.36 : 0.8, 0.9, dz ? 0.36 : 0.8), 0x7a80a8, x2, 0.45, z2); const sc = own(new T.Mesh(B(dx ? 0.04 : 0.6, 0.36, dz ? 0.04 : 0.6), new T.MeshBasicMaterial({ color: 0x60f0c0 }))); sc.position.set(x2 - dx * 0.2, 0.95, z2 - dz * 0.2); V.screens.push(sc); }
  // reactor core, engines, medbay beds, storage crates, admin table, navigation console, shields, O2 plants, security desk, electrical boxes, weapons seat, comms dish
  P(C(0.7, 2.4, 24), 0x60c0ff, 2.2, 1.2, 13.5, 0x2060a0); for (const z2 of [11.5, 15.5]) P(B(0.6, 1.1, 0.8), 0x9a9ab8, 0.6, 0.55, z2);
  for (const [ex, ez] of [[4.5, 3.5], [4.5, 24.5]]) { const e = P(C(1.2, 2.6, 24), 0xa8a0b8, ex, 1.3, ez); e.rotation.z = Math.PI / 2; for (const dx of [-0.9, 0, 0.9]) { const r = own(new T.Mesh(new T.TorusGeometry(1.25, 0.07, 6, 24), new T.MeshBasicMaterial({ color: 0xff9a40 }))); r.rotation.y = Math.PI / 2; r.position.set(ex + dx, 1.3, ez); } }
  for (const bx2 of [12, 14.6]) { P(B(1.1, 0.45, 2), 0xffffff, bx2, 0.25, 5.4); P(B(1.1, 0.25, 0.5), 0xc8e0ff, bx2, 0.55, 4.6); }
  for (const [cx2, cz2, s] of [[19, 22.5, 1], [20.2, 22.4, 0.8], [19.4, 23.6, 0.9], [22.8, 27.4, 1], [23.4, 26.2, 0.7], [21, 27.6, 0.8]]) P(B(s, s, s), 0xc8a060, cx2, s / 2, cz2);
  P(B(3, 0.7, 1.6), 0x8a7ab8, 29, 0.35, 15.5); { const holo = own(new T.Mesh(new T.CylinderGeometry(1.2, 1.2, 0.04, 32), new T.MeshBasicMaterial({ color: 0x60e0ff, transparent: true, opacity: 0.45 }))); holo.position.set(29, 1.0, 15.5); V.holo = holo; }
  P(B(1.6, 0.8, 1.2), 0x6a7ab8, 50.5, 0.4, 12.5); P(B(0.8, 0.6, 0.6), 0x6a7ab8, 48.5, 0.3, 11);
  for (let i = 0; i < 3; i++) { const h = own(new T.Mesh(new T.CylinderGeometry(0.55, 0.55, 0.1, 6), new T.MeshBasicMaterial({ color: 0x80ffd0, transparent: true, opacity: 0.6 }))); h.position.set(38 + i * 1.3, 0.06 + i * 0.4, 23); }
  for (const [ox, oz] of [[37, 12.5], [39.5, 12.5]]) { P(C(0.35, 0.6, 10), 0xa06a40, ox, 0.3, oz); const lf = own(new T.Mesh(new T.IcosahedronGeometry(0.55, 0), V.toon(0x50c050))); lf.position.set(ox, 0.95, oz); }
  P(B(3, 0.8, 1), 0x5a5a7a, 11.5, 0.4, 11.2); for (let i = 0; i < 3; i++) { const m = own(new T.Mesh(B(0.8, 0.5, 0.06), new T.MeshBasicMaterial({ color: 0x8ad0ff }))); m.position.set(10.6 + i * 0.9, 1.15, 10.75); }
  for (let i = 0; i < 3; i++) P(B(0.9, 1.2, 0.3), 0x8a8a9a, 10.5 + i * 1.6, 0.6, 18.25); P(B(0.6, 0.9, 0.3), 0xffd040, PANEL[0], 0.8, PANEL[1] - 0.3, 0x302000);
  P(C(0.5, 0.9), 0x5a6a8a, 39, 0.45, 4.5); { const gun = P(C(0.18, 1.6, 10), 0x4a4a5a, 39, 1.2, 3.6); gun.rotation.x = Math.PI / 2.6; }
  { const dish = P(new T.SphereGeometry(0.8, 16, 8, 0, TAU, 0, Math.PI / 2.4), 0xd8d8e8, 28.5, 0.6, 25.5); dish.rotation.x = -0.6; }
  // vents: a frame on the floor
  V.ventMesh = VENTS.map(v => { const m = own(new T.Mesh(B(0.8, 0.06, 0.6), V.toon(0x6a6e80))); m.position.set(v[0] + 0.5, 0.03, v[1] + 0.5); return m; });
  // the crew's cards (one per person) and shadows
  for (const c of V.cards) V.S.remove(c.m, c.sh); V.cards = g.ppl.map(p => { const tex = new T.CanvasTexture(atlasOf(p.i ? NAMES.indexOf(p.name) : 0, p.i ? p.col : myLook().col)); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 4;
    const geo = V.cardGeo(), m = new T.Mesh(geo, new T.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.3, side: T.DoubleSide })); m.renderOrder = 2; V.S.add(m);
    const sh = new T.Mesh(new T.CircleGeometry(0.42, 20), new T.MeshBasicMaterial({ color: 0x0a0618, transparent: true, opacity: 0.32, depthWrite: false })); sh.rotation.x = -Math.PI / 2; V.S.add(sh); return { m, sh, geo, pose: -1, flip: 1 }; }); }
function setPose(card, pose, flip) { if (card.pose === pose && card.flip === flip) return; card.pose = pose; card.flip = flip; const uv = card.geo.attributes.uv, u0 = pose / 4, u1 = (pose + 1) / 4, a = flip > 0 ? u0 : u1, b = flip > 0 ? u1 : u0;
  uv.setXY(0, a, 1); uv.setXY(1, b, 1); uv.setXY(2, a, 0); uv.setXY(3, b, 0); uv.needsUpdate = true; }
