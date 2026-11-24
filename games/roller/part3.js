
// ===================== THE VIEW: Paint It in 3D (three.js; sky, light, shadows from tools/world3d.js) =====================
// The thing to paint stands in a garden (or on a street, by the sea...) in front of a brick wall: its face is a paint map
// (primer with the faint pattern of the design, blue tape, glass), wet and glossy where you have painted; behind it a solid
// body gives it depth. A roller or a brush follows your thumb on it. At the end the tape peels off to show crisp edges.
const FX = { shake: 0, stop: 0, flash: 0, red: 0, slow: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { snap: true, cam: null, banner: null, peel: 0, ver: -1 };
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 160) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: 0.5 + Math.random() * 0.4, col, r: (1.5 + Math.random() * 2.5) * k }); } if (PARTS.length > 240) PARTS.splice(0, PARTS.length - 240); }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2.5); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.4) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (ui.banner) { ui.banner.t += dt; if (ui.banner.t > (ui.banner.secs || 1)) ui.banner = null; }
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; } }
const hex = n => '#' + n.toString(16).padStart(6, '0');
function mySkin() { if (typeof HEADLESS !== 'undefined' && HEADLESS) return SKINS[0]; const id = store.get('skin', 'basic'); return SKINS.find(q => q.id === id) || SKINS[0]; }
const BW = 3.0, BH = BW * GH / GW, CELL = BW / GW;
function canvasTex(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
function buildWorld() {
  if (V3) return V3; const T = window.THREE; if (!T || !W3 || !W3.init({ canvas: $('gl'), fov: 45, far: 2500, near: 0.05 })) { V3 = { none: true }; return V3; }
  V3 = { T, S: W3.scene, built: null, t: 0 }; const V = V3, S = V.S; V.boxG = new T.BoxGeometry(1, 1, 1); V.cylG = new T.CylinderGeometry(1, 1, 1, 24);
  const ground = new T.Mesh(new T.PlaneGeometry(400, 400), new T.MeshStandardMaterial({ color: 0x6aa84a, roughness: 0.95, map: W3.grainTex(256, 5, 190, 45, 3) })); ground.material.map.repeat.set(60, 60); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; S.add(ground);
  const brick = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#cfc6bc'; g.fillRect(0, 0, w, h); for (let r = 0; r < 16; r++) for (let c = -1; c < 5; c++) { g.fillStyle = `hsl(${12 + (r * 7 + c * 13) % 10},${40 + (r * 5 + c) % 15}%,${42 + (r * 11 + c * 3) % 10}%)`; g.fillRect(c * 64 + (r % 2) * 32 + 2, r * 16 + 2, 60, 12); } }); brick.wrapS = brick.wrapT = T.RepeatWrapping; brick.repeat.set(6, 3);
  V.wall = new T.Mesh(V.boxG, new T.MeshStandardMaterial({ map: brick, roughness: 0.9 })); V.wall.scale.set(14, 6, 0.4); V.wall.position.set(0, 3, -1.4); V.wall.receiveShadow = true; S.add(V.wall);
  const M = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.6 }, o));
  // props: a ladder, a paint tray, tins, pots of flowers
  const lad = new T.Group(); for (const sx of [-0.25, 0.25]) { const r = new T.Mesh(V.boxG, M(0xb8b8b8, { metalness: 0.6 })); r.scale.set(0.06, 3.2, 0.06); r.position.set(sx, 1.6, 0); lad.add(r); } for (let i = 0; i < 8; i++) { const r = new T.Mesh(V.boxG, M(0xb8b8b8, { metalness: 0.6 })); r.scale.set(0.5, 0.04, 0.05); r.position.set(0, 0.3 + i * 0.38, 0); lad.add(r); } lad.position.set(2.6, 0, -0.9); lad.rotation.x = -0.25; lad.traverse(o => o.castShadow = true); S.add(lad);
  V.tins = []; for (let i = 0; i < 3; i++) { const t = new T.Mesh(V.cylG, M(0xd8dde2, { metalness: 0.7, roughness: 0.3 })); t.scale.set(0.16, 0.22, 0.16); t.position.set(-2.2 + i * 0.42, 0.11, 0.9 + (i % 2) * 0.2); t.castShadow = true; S.add(t); const lid = new T.Mesh(V.cylG, M(0xffffff)); lid.scale.set(0.14, 0.01, 0.14); lid.position.set(t.position.x, 0.225, t.position.z); S.add(lid); V.tins.push(lid); }
  const tray = new T.Mesh(V.boxG, M(0x3a3e44)); tray.scale.set(0.6, 0.06, 0.45); tray.position.set(1.7, 0.03, 0.9); S.add(tray); V.trayPaint = new T.Mesh(V.boxG, M(0x4aa8f0, { roughness: 0.15 })); V.trayPaint.scale.set(0.5, 0.02, 0.3); V.trayPaint.position.set(1.7, 0.065, 0.92); S.add(V.trayPaint);
  for (const x of [-3.6, 3.6]) { const pot = new T.Mesh(new T.CylinderGeometry(0.3, 0.22, 0.45, 16), M(0xc0643a)); pot.position.set(x, 0.22, -0.6); pot.castShadow = true; S.add(pot); const bush = new T.Mesh(new T.SphereGeometry(0.42, 12, 10), M(0x3a8a3a, { roughness: 0.9 })); bush.position.set(x, 0.75, -0.6); bush.castShadow = true; S.add(bush); for (let i = 0; i < 6; i++) { const f = new T.Mesh(new T.SphereGeometry(0.06, 6, 6), M([0xff5a7a, 0xffd040, 0xffffff][i % 3])); f.position.set(x + Math.cos(i) * 0.33, 0.8 + Math.sin(i * 2) * 0.2, -0.6 + Math.sin(i) * 0.33); S.add(f); } }
  // the board: the paint map (front) and the body behind it
  V.cv = document.createElement('canvas'); V.cv.width = GW * 4; V.cv.height = GH * 4; V.tex = new T.CanvasTexture(V.cv); V.tex.colorSpace = T.SRGBColorSpace; V.tex.anisotropy = 4;
  V.boardM = new T.MeshPhysicalMaterial({ map: V.tex, alphaTest: 0.5, roughness: 0.38, clearcoat: 0.7, clearcoatRoughness: 0.2 });
  V.board = new T.Mesh(new T.PlaneGeometry(BW, BH), V.boardM); V.board.position.set(0, BH / 2 + 0.05, 0); V.board.castShadow = true; V.board.receiveShadow = true; S.add(V.board);
  V.bodyM = new T.MeshStandardMaterial({ color: 0x8a6a4a, roughness: 0.8 }); V.body = null;
  // the tools
  V.roller = new T.Group(); const rl = new T.Mesh(V.cylG, M(0xf4f4f0, { roughness: 0.9 })); rl.scale.set(0.09, 0.42, 0.09); rl.rotation.z = Math.PI / 2; V.roller.add(rl); V.rollerNap = rl; const fr = new T.Mesh(V.boxG, M(0xb8b8b8, { metalness: 0.7 })); fr.scale.set(0.02, 0.25, 0.02); fr.position.set(0.2, -0.15, 0.06); V.roller.add(fr); const hd = new T.Mesh(V.cylG, M(0xe0463a)); hd.scale.set(0.035, 0.3, 0.035); hd.position.set(0.2, -0.42, 0.1); V.roller.add(hd); V.roller.visible = false; S.add(V.roller);
  V.brush = new T.Group(); const bh = new T.Mesh(V.boxG, M(0xd8a060)); bh.scale.set(0.05, 0.3, 0.025); bh.position.y = -0.22; V.brush.add(bh); const bf = new T.Mesh(V.boxG, M(0x6a5a4a)); bf.scale.set(0.06, 0.08, 0.03); bf.position.y = -0.04; V.brush.add(bf); V.brushTip = bf; V.brush.visible = false; S.add(V.brush);
  W3.setQuality(stepN); return V; }
function buildJob(V, g) { const T = V.T; V.built = g; ui.ver = -1; ui.peel = 0;
  W3.setSky(PLACES[placeOf(g.N)].sky, { azim: 25 }); W3.hemi.intensity = W3.S.hemiI + 0.5;
  if (V.body) { V.S.remove(V.body); V.body.dispose(); } let n = 0; for (const v of g.grid) if (v !== OUT) n++;
  V.body = new T.InstancedMesh(V.boxG, V.bodyM, n); const d = new T.Object3D(); let i = 0; for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { if (g.grid[y * GW + x] === OUT) continue; d.position.set(-BW / 2 + (x + 0.5) * CELL, 0.05 + (y + 0.5) * CELL, -0.07); d.scale.set(CELL * 1.02, CELL * 1.02, 0.13); d.updateMatrix(); V.body.setMatrixAt(i++, d.matrix); }
  V.body.castShadow = true; V.body.receiveShadow = true; V.S.add(V.body); ui.snap = true; }
function paintMap(V, g) { const x = V.cv.getContext('2d'), im = x.createImageData(GW, GH), D = im.data, c3 = new V.T.Color(), rgb = v => { c3.setHex(v); return [c3.r * 255, c3.g * 255, c3.b * 255]; };
  const cols = {}; for (const v of g.colours) cols[v] = rgb(g.cols[v].col); const prim = [236, 232, 222], tape = [70, 140, 230], glass = [40, 70, 100];
  for (let yy = 0; yy < GH; yy++) for (let xx = 0; xx < GW; xx++) { const j = yy * GW + xx, o = ((GH - 1 - yy) * GW + xx) * 4, gv = g.grid[j], p = g.paint[j]; let c = null, a = 255;
    if (gv > 0) { c = p ? (cols[p] || rgb(g.cols[p] ? g.cols[p].col : 0x888888)) : prim; if (!p) { const t = cols[gv]; c = [prim[0] * 0.72 + t[0] * 0.28, prim[1] * 0.72 + t[1] * 0.28, prim[2] * 0.72 + t[2] * 0.28]; } }
    else if (gv === TAPE) c = g.tapeOff ? (p ? prim : prim) : (p ? cols[p] && [cols[p][0] * 0.6 + tape[0] * 0.4, cols[p][1] * 0.6 + tape[1] * 0.4, cols[p][2] * 0.6 + tape[2] * 0.4] || tape : tape);
    else if (gv === GLASS) c = p ? cols[p] : glass;
    else { if (p && (g.spilt[j] || g.edge[j])) c = cols[p]; else a = 0; }
    if (!c) { a = 0; c = [0, 0, 0]; } D[o] = c[0]; D[o + 1] = c[1]; D[o + 2] = c[2]; D[o + 3] = a; }
  const off = document.createElement('canvas'); off.width = GW; off.height = GH; off.getContext('2d').putImageData(im, 0, 0); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.clearRect(0, 0, V.cv.width, V.cv.height); try { x.filter = 'blur(1.2px)'; } catch (e) {} x.drawImage(off, 0, 0, V.cv.width, V.cv.height); try { x.filter = 'none'; } catch (e) {}      /* 22 Nov 2026: paint went on in square pixels; smoothed edges read as paint */
 
  // a little texture: brush marks on painted cells
  x.globalAlpha = 0.06; x.fillStyle = '#000'; for (let i = 0; i < 160; i++) x.fillRect((i * 37) % V.cv.width, (i * 91) % V.cv.height, 1, 3); x.globalAlpha = 1; V.tex.needsUpdate = true; }
// where a touch lands on the board, in cells (x across from the left, y up from the bottom); off the board gives values outside
function sem(px, py, g) { if (!V3 || V3.none) return { x: -99, y: -99 }; const T = V3.T, rc = new T.Raycaster(), ndc = new T.Vector2(px / W * 2 - 1, -(py / H) * 2 + 1); rc.setFromCamera(ndc, W3.cam); const d = rc.ray.direction, o = rc.ray.origin; if (Math.abs(d.z) < 1e-5) return { x: -99, y: -99 };
  const t = (0.002 - o.z) / d.z, wx = o.x + d.x * t, wy = o.y + d.y * t; return { x: (wx + BW / 2) / CELL - 0.5, y: (wy - 0.05) / CELL - 0.5 }; }
const SV = window.THREE ? new THREE.Vector3() : null;
function scr(x, y, z) { if (!V3 || V3.none) return { x: W / 2, y: H / 2 }; SV.set(x, y, z); return W3.screen(SV); }
const cellScr = (cx, cy) => scr(-BW / 2 + (cx + 0.5) * CELL, 0.05 + (cy + 0.5) * CELL, 0);
function sync(V, g, dt) { V.t += dt; const ver = (g.right * 7 + g.spill * 13 + g.colour * 3 + (g.tapeOff ? 1 : 0)) + ':' + countPaint(g); if (ver !== ui.ver) { ui.ver = ver; paintMap(V, g); }
  V.trayPaint.material.color.setHex(g.cols[g.colour] ? g.cols[g.colour].col : 0xffffff); V.tins.forEach((t, i) => t.material.color.setHex(g.colours[i] != null ? g.cols[g.colours[i]].col : 0xffffff));
  const th = g.thumb; V.roller.visible = !!th && g.tool === 'roller' && !g.over; V.brush.visible = !!th && g.tool === 'brush' && !g.over;
  if (th) { const p = [-BW / 2 + (th.x + 0.5) * CELL, 0.05 + (th.y + 0.5) * CELL]; V.roller.position.set(p[0], p[1], 0.1); V.rollerNap.material.color.setHex(g.cols[g.colour].col); V.rollerNap.rotation.x = (V.rollerNap.rotation.x || 0) + dt * 6; V.brush.position.set(p[0], p[1], 0.06); V.brushTip.material.color.setHex(g.cols[g.colour].col); }
  // the camera: in front, a little to the side and above; the board fills the screen's middle
  const asp = innerWidth / innerHeight, portrait = asp < 0.8, fov = portrait ? 52 : 40, vh = BH * 1.3, tn = Math.tan(fov / 2 * Math.PI / 180), dist = Math.max(vh / 2 / tn, BW * 1.18 / 2 / tn / asp), cp = [0.35, BH / 2 + 0.45, dist], cl = [0, BH / 2 - 0.05, 0];
  if (ui.snap || !ui.cam) { ui.cam = { p: cp.slice(), l: cl.slice() }; ui.snap = false; } const kk = Math.min(1, dt * 3); for (let i = 0; i < 3; i++) { ui.cam.p[i] += (cp[i] - ui.cam.p[i]) * kk; ui.cam.l[i] += (cl[i] - ui.cam.l[i]) * kk; }
  const cam = W3.cam; cam.fov = fov; cam.aspect = asp; cam.updateProjectionMatrix(); cam.position.set(...ui.cam.p); cam.lookAt(...ui.cam.l); cam.updateMatrixWorld(); W3.setFocus(0, BH / 2, 0, 5); }
function countPaint(g) { if (!g.thumb && g._pc != null) return g._pc; let n = 0; for (let j = 0; j < g.paint.length; j += 7) n += g.paint[j]; g._pc = n; return n; }
// ---------- the buttons: pots, the tool, DONE (bottom) ----------
function uiLayout(g) { const n = g.colours.length, y = H - 62 * k, r = 27 * k, out = []; g.colours.forEach((v, i) => out.push({ pot: i, x: W * 0.12 + i * 62 * k, y, r }));
  out.push({ tool: 'roller', x: W * 0.62, y, r: 26 * k }); out.push({ tool: 'brush', x: W * 0.62 + 58 * k, y, r: 26 * k }); if (cover(g) >= 0.85 && !g.over && !g.wait && !g.lesson) out.push({ done: true, x: W / 2, y: H - 130 * k, r: 34 * k, w: 150 * k }); return out; }
function uiHit(px, py, g) { for (const b of uiLayout(g)) { if (b.w ? Math.abs(px - b.x) < b.w / 2 && Math.abs(py - b.y) < b.r : Math.hypot(px - b.x, py - b.y) < b.r + 6) return b; } return null; }
// ---------- what happens, seen and heard ----------
let lastSpill = 0;
function onEvent(G, e) { const cx = W / 2;
  switch (e.k) {
    case 'start': case 'yard': ui.snap = true; ui.banner = G.lesson ? null : { txt: `PAINT ${JOBNAME[G.job].toUpperCase()}`, t: 0, secs: 1.6, col: '#bfe8ff' }; sfx.bell(); break;
    case 'pot': sfx.pot(); break;
    case 'tool': sfx.click(); break;
    case 'spill': if (G.t - lastSpill > 0.5) { lastSpill = G.t; sfx.spill(); say('SPILL!', cx, H * 0.36, '#ffb070', 18); tip('spill', 'Paint off the edges or on the glass is a spill. Use the BRUSH near edges; tape is safe.', 3); } break;
    case 'region': sfx.region(e.n); vibe(HAP.tick); if (e.n === e.of) say('ALL COVERED!', cx, H * 0.3, '#80ff90', 24); break;
    case 'peel': sfx.peel(); ui.peel = 1; say('PEEL!', cx, H * 0.3, '#bfe8ff', 26); burst(cx, H * 0.45, '#5aa0ff', 18); break;
    case 'hurry': say('"All done?"', cx, H * 0.3, '#ffe0a0', 18); break;
    case 'won': sfx.win(); break;
    case 'lost': sfx.lose(); break;
    case 'lessonnext': hint = null; break;
    case 'lessonmiss': coachMiss(); sfx.no(); break;
    case 'lessondone': sfx.goal(); say('LESSON DONE!', cx, H * 0.4, '#80ff90', 28); burst(cx, H * 0.4, '#80ff90', 24); break;
  } }
let IG = null; function idleG() { if (!IG || (IG.over && (IG.idle = (IG.idle || 0) + 1 / 60) > 3)) { IG = newGame(Math.max(3, store.get('level', 1) | 0), { seed: (Math.random() * 1e6) | 0 }); IG.mem = {}; ui.snap = true; } if (!IG.over) { honest(IG, { react: 0.6, acc: 0.97 }, IG.mem); step(IG, 1 / 60); } IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#2a3a2a'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D garden.', W / 2, H / 2); if (G) hud(G, now); return; }
  const g = G || idleG(); if (V.built !== g || V.gridFor !== g.grid) { buildJob(V, g); V.gridFor = g.grid; }
  sync(V, g, dt);
  W3.render(dt);
  if (G && G.thumb && !G.over && Math.random() < 0.5) { const p = cellScr(G.thumb.x, G.thumb.y); PARTS.push({ x: p.x + (Math.random() - 0.5) * 20, y: p.y, vx: (Math.random() - 0.5) * 60, vy: -40 - Math.random() * 60, t: 0, life: 0.5, col: hex(G.cols[G.colour].col), r: 2 * k }); }
  if (G && !(G.over && !$('ovEnd').classList.contains('hidden'))) hud(G, now);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 0.9 ? 1 : 1 - (t2.t - 0.9) / 0.5; ctx.globalAlpha = Math.max(0, al); const sc = t2.t < 0.12 ? 1.3 - t2.t / 0.12 * 0.3 : 1; ctx.font = `400 ${Math.round(t2.size * k * sc)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(20,30,40,.6)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 20); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 20); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30, hy = H * 0.5;
    ctx.fillStyle = 'rgba(16,30,44,.9)'; rrect(W / 2 - w / 2, hy - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, hy - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; } }
function hud(G, t) { ctx.textBaseline = 'middle';
  if (G.lesson) lessonPanel(G);
  else { const x0 = 12, w = W - 24, y = 44 * k, cov = cover(G); ctx.fillStyle = 'rgba(16,30,44,.62)'; rrect(x0, y, w, 46 * k, 12 * k); ctx.fill(); ctx.textAlign = 'left'; ctx.fillStyle = '#bfe8ff'; ctx.font = `400 ${Math.round(13 * k)}px ${TF}`; ctx.fillText(JOBNAME[G.job].toUpperCase(), x0 + 10, y + 14 * k);
    ctx.fillStyle = 'rgba(255,255,255,.25)'; rrect(x0 + 10, y + 28 * k, w * 0.62, 9 * k, 4 * k); ctx.fill(); ctx.fillStyle = '#5ad0ff'; rrect(x0 + 10, y + 28 * k, w * 0.62 * cov, 9 * k, 4 * k); ctx.fill();
    ctx.textAlign = 'right'; ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = '#fff'; ctx.fillText(`${Math.floor(cov * 100)}% covered`, x0 + w - 10, y + 14 * k); ctx.fillStyle = G.spill ? '#ffb070' : '#80ff90'; ctx.fillText(G.spill ? `${G.spill} spilt` : 'no spills', x0 + w - 10, y + 32 * k); }
  if (ui.banner) { const B = ui.banner, sc = B.t < 0.12 ? 1.25 - B.t / 0.12 * 0.25 : 1; ctx.textAlign = 'center'; ctx.font = `400 ${Math.round(26 * k * sc)}px ${TF}`; ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(16,30,44,.6)'; ctx.strokeText(B.txt, W / 2, H * 0.24); ctx.fillStyle = B.col || '#fff'; ctx.fillText(B.txt, W / 2, H * 0.24); }
  if (G.over || G.wait > 0) return;
  for (const b of uiLayout(G)) { if (b.pot != null) { const v = G.colours[b.pot], on = v === G.colour; ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r + (on ? 6 : 3), 0, TAU); ctx.fill(); ctx.fillStyle = hex(G.cols[v].col); ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill(); if (on) { ctx.strokeStyle = '#16222c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 6, 0, TAU); ctx.stroke(); } }
    else if (b.tool) { const on = G.tool === b.tool; ctx.fillStyle = on ? '#5ad0ff' : 'rgba(16,30,44,.7)'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill(); ctx.fillStyle = on ? '#16222c' : '#fff'; ctx.font = `400 ${Math.round(10 * k)}px ${TF}`; ctx.textAlign = 'center'; ctx.fillText(b.tool === 'roller' ? 'ROLLER' : 'BRUSH', b.x, b.y); }
    else if (b.done) { ctx.fillStyle = '#80e090'; rrect(b.x - b.w / 2, b.y - b.r * 0.7, b.w, b.r * 1.4, 14 * k); ctx.fill(); ctx.fillStyle = '#123'; ctx.font = `400 ${Math.round(18 * k)}px ${TF}`; ctx.textAlign = 'center'; ctx.fillText('DONE ✓', b.x, b.y); } }
  if ((G && G.lesson) && G.N <= 1 && !G.lesson && G.t < 6 && !G.thumb) { ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 5); ctx.font = `400 ${Math.round(15 * k)}px ${TF}`; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText('DRAG YOUR THUMB TO PAINT', W / 2, H - 110 * k); ctx.globalAlpha = 1; } }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { coachPanel(G); }
