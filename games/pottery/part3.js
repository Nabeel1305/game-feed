// ===================== THE VIEW: Pottery Wheel (upright; the wheel in front of you) =====================
// A quiet studio: shelves of finished pots, a window with the day outside, the wheel head turning with the clay on it. The
// pot is a real lathe of its profile (outside, rim and inside), wet and glossy while you throw it, then glazed and fired.
// The order hangs on a card at the top; its outline is drawn dotted around your pot so you can see where to push.
const FX = { shake: 0, stop: 0, flash: 0, red: 0, slow: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { snap: true, banner: null, touch: null, mode: 'pull', trimZ: null };
function say(txt, x, y, col = '#fff', size = 22) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 140) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60 * k, t: 0, life: 0.5 + Math.random() * 0.5, col, r: (2 + Math.random() * 3) * k }); } }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2.5); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.4) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 200 * dt; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (ui.banner) { ui.banner.t += dt; if (ui.banner.t > (ui.banner.secs || 1.6)) ui.banner = null; }
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; } }
function mySkin() { if (typeof HEADLESS !== 'undefined' && HEADLESS) return SKINS[0]; const id = store.get('skin', 'terracotta'); return SKINS.find(q => q.id === id) || SKINS[0]; }
const BASEY = 4;      // the wheel head's top, in world centimetres
function buildWorld() {
  if (V3) return V3; const T = window.THREE; if (!T || !W3 || !W3.init({ canvas: $('gl'), fov: 38, far: 600, near: 1 })) { V3 = { none: true }; return V3; }
  V3 = { T, S: W3.scene, t: 0, for: null }; const V = V3, M = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.8 }, o)); V.M = M;
  W3.scene.children.forEach(o => { if (o.isLineSegments) o.visible = false; });
  const S = V.S; W3.setSky('golden');
  // the studio: floor, back wall with a window, shelves of pots, the wheel
  const floor = new T.Mesh(new T.PlaneGeometry(400, 400), M(0x6a5240, { roughness: 0.95 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -60; S.add(floor);
  const wall = new T.Mesh(new T.PlaneGeometry(400, 220), M(0xd8cbb4, { roughness: 0.95 })); wall.position.set(0, 30, -120); S.add(wall);
  const win = new T.Mesh(new T.PlaneGeometry(70, 50), new T.MeshBasicMaterial({ color: 0xbfe0f4 })); win.position.set(-10, 85, -119); S.add(win);
  for (const y of [10, 40]) { const sh = new T.Mesh(new T.BoxGeometry(110, 3, 22), M(0x7a5232)); sh.position.set(42, y + 30, -108); S.add(sh); for (let i = 0; i < 4; i++) { const r = 4 + (i % 3) * 2, g = new T.Mesh(new T.LatheGeometry([[0, 0], [r, 0], [r + 2, r * 1.2], [r - 1, r * 2.4], [r - 1.4, r * 2.6]].map(p => new T.Vector2(p[0], p[1])), 18), M([0x8ab8a0, 0x2a4a9a, 0xc8862a, 0xf0ece2][(i + y) % 4], { roughness: 0.3 })); g.position.set(10 + i * 22, y + 31.5, -108); S.add(g); } }
  const stand = new T.Mesh(new T.CylinderGeometry(26, 30, 60, 32), M(0x4a4a4e, { metalness: 0.3, roughness: 0.6 })); stand.position.y = -30 + BASEY - 4; S.add(stand);
  V.head = new T.Mesh(new T.CylinderGeometry(17, 17, 3, 40), M(0x8a8a90, { metalness: 0.6, roughness: 0.35 })); V.head.position.y = BASEY - 1.5; S.add(V.head);
  const tray = new T.Mesh(new T.CylinderGeometry(24, 22, 7, 40, 1, true), M(0x3a3a3e, { side: T.DoubleSide })); tray.position.y = BASEY - 2; S.add(tray);
  V.mark = new T.Mesh(new T.BoxGeometry(2, 0.3, 30), M(0x2a2a2a)); V.mark.position.y = BASEY + 0.05; V.head.add(V.mark); V.mark.position.set(0, 1.6, 0);
  V.clayM = M(mySkin().col, { roughness: 0.35, metalness: 0.0 }); V.pot = new T.Mesh(new T.BufferGeometry(), V.clayM); V.pot.castShadow = true; V.pot.position.y = BASEY; S.add(V.pot);
  V.kiln = new T.PointLight(0xff7a2a, 0, 200); V.kiln.position.set(0, 30, 40); S.add(V.kiln);
  const lamp = new T.PointLight(0xfff0d8, 50, 260); lamp.position.set(30, 70, 60); S.add(lamp);
  W3.setQuality(stepN); return V; }
// the pot from its profile: up the outside, over the rim, down the inside to the floor of the pot
function potGeo(V, G) { const T = V.T, n = Math.floor(G.h / DZ), pts = [], w = G.wall, wob = G.phase === 'center' ? G.wob : 0;
  if (G.phase === 'center') { for (let i = 0; i <= n; i++) pts.push(new T.Vector2(Math.max(0.3, G.r[i]), i * DZ)); pts.push(new T.Vector2(0.01, n * DZ + 0.3)); }
  else { pts.push(new T.Vector2(0.01, 0)); for (let i = 0; i <= n; i++) pts.push(new T.Vector2(Math.max(0.4, G.r[i]), i * DZ)); pts.push(new T.Vector2(Math.max(0.3, G.r[n] - w * 0.5), n * DZ + w * 0.25));
    for (let i = n; i >= 0; i--) { const z = i * DZ; if (z < G.base) break; pts.push(new T.Vector2(Math.max(0.2, G.r[i] - w), z)); } pts.push(new T.Vector2(0.01, G.base)); }
  const g = new T.LatheGeometry(pts, 48); g.computeVertexNormals(); return g; }
function sync(V, G, dt) { V.t += dt; const T = V.T;
  const key = G.r.join(',') + G.h + G.phase + G.wall; if (V.for !== key) { V.for = key; V.pot.geometry.dispose(); V.pot.geometry = potGeo(V, G); }
  const spin = G.phase === 'kiln' || G.over ? 0.3 : G.phase === 'glaze' ? 0.6 : 4; V.head.rotation.y += dt * spin; V.pot.rotation.y += dt * spin;
  const wb = G.phase === 'center' ? G.wob : 0; V.pot.position.set(Math.sin(V.t * spin) * wb * 1.4, BASEY, Math.cos(V.t * spin) * wb * 1.4); V.pot.rotation.z = Math.sin(V.t * spin * 1.3) * wb * 0.08;
  // wet clay, then the glaze; the kiln glow while it fires
  const col = G.glaze != null && (G.phase === 'kiln' || G.over) ? GLAZES[G.glaze].col : mySkin().col; V.clayM.color.setHex(col); V.clayM.roughness = G.glaze != null ? 0.15 : 0.3 + (G.phase === 'glaze' ? 0.3 : 0);
  V.kiln.intensity = G.phase === 'kiln' ? 400 * (0.6 + 0.4 * Math.sin(V.t * 9)) : Math.max(0, V.kiln.intensity - dt * 400);
  const cam = W3.cam; cam.position.set(0, 44, 78); cam.lookAt(0, 13, 0); cam.updateMatrixWorld(); W3.setFocus(0, 10, 0, 40); }
function scrOf(x, y, z) { const V = V3; if (!V || V.none) return null; return W3.screen(new V.T.Vector3(x, y, z)); }
// the mapping between the pot's plane (radius, height in cm) and the screen, measured from the camera (it is nearly linear)
function potMap() { const a = scrOf(0, BASEY, 0), b = scrOf(10, BASEY + 20, 0); if (!a || !b) return { ax: W / 2, ay: H * 0.7, px: 12, py: 12 }; return { ax: a.x, ay: a.y, px: (b.x - a.x) / 10, py: (a.y - b.y) / 20 }; }
const toScreen = (r, z) => { const m = potMap(); return [m.ax + r * m.px, m.ay - z * m.py]; };
const fromScreen = (x, y) => { const m = potMap(); return [(x - m.ax) / m.px, (m.ay - y) / m.py]; };
// ---------- events ----------
function onEvent(G, e) { const top = toScreen(0, G.h + 3);
  switch (e.k) {
    case 'centred': sfx.centred(); vibe(HAP.light); say('CENTRED!', W / 2, top[1] - 20 * k, '#8fe0ab', 26); ui.mode = 'pull'; tip('pull', 'Now pull the walls up: drag upwards along the wall, from the bottom to the top.', 4); break;
    case 'squash': sfx.squash(); say('TOO HARD', W / 2, H * 0.45, '#ffd0a0', 20); break;
    case 'pullstart': sfx.wet(); break;
    case 'pulled': sfx.pull(); vibe(HAP.tick); say(`${Math.round(e.h)} cm`, W / 2 + 90 * k, top[1], '#fff', 20); break;
    case 'pullshort': say('ALL THE WAY UP', W / 2, H * 0.4, '#ffd0a0', 20); break;
    case 'tear': sfx.tear(); FX.shake = 8; say('TORE! TOO FAST', W / 2, H * 0.4, '#ff8a6a', 26); break;
    case 'warn': sfx.warn(); say('CAREFUL: WALLS THIN', W / 2, H * 0.36, '#ffd36a', 20); break;
    case 'slump': sfx.slump(); FX.shake = 12; ui.banner = { txt: 'IT SLUMPED', sub: e.why === 'tear' ? 'Pulled too fast: start again with fresh clay' : 'Walls too thin or leaning too far: fresh clay', t: 0, secs: 2.4 }; ui.mode = 'pull'; break;
    case 'trim': sfx.trim(); say('TRIMMED', W / 2, top[1], '#fff', 18); break;
    case 'phase': if (e.ph === 'glaze') { ui.banner = { txt: `${G.matchNow}% MATCH`, sub: `Now the glaze: they asked for ${GLAZES[G.ord.glaze].name}`, t: 0, secs: 2.4 }; sfx.done(); } break;
    case 'kiln': sfx.kiln(); break;
    case 'fired': { const p = toScreen(0, G.h * 0.6); if (e.sur) { say(e.sur.toUpperCase() + '!', W / 2, p[1] - 60 * k, '#ffd36a', 26); burst(p[0], p[1], '#ffd36a', 24); sfx.surprise(); } else sfx.fired(); } break;
    case 'lessonnext': if (e.first) hint = null; say('FIRST, A LESSON', W / 2, H * 0.3, '#ffd36a', 24); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, W / 2, H * 0.34, '#8fe0ab', 24); sfx.coin(e.n); break;
    case 'lessonmiss': coachMiss(); say('AGAIN', W / 2, H * 0.38, '#ffd0a0', 20); break;
    case 'lessondone': say('READY: THE ORDER!', W / 2, H * 0.3, '#ffd36a', 24); sfx.centred(); ui.mode = 'pull'; if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); FX.flash = 0.5; vibe(HAP.best); break;
    case 'lost': sfx.lose(); break;      // (P11: never vibrate on failure)
  } }
// ---------- the picture ----------
let IG = null, IM = {}; function idleG() { if (!IG || IG.over || IG.t > 30) { IG = newGame(3 + ((Math.random() * 12) | 0), { seed: (Math.random() * 1e6) | 0 }); IM = {}; } honest(IG, { react: 0.8, acc: 0.95 }, IM); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#d8cbb4'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#333'; ctx.textAlign = 'center'; ctx.font = `700 16px ${BC}`; ctx.fillText('This phone cannot draw the 3D studio.', W / 2, H * 0.3); if (G) hud(G, now); return; }
  const g = G || idleG(); sync(V, g, dt || 1 / 60); W3.render(dt || 1 / 60);
  if (G && !(G.over && !$('ovEnd').classList.contains('hidden'))) hud(G, now);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 1.1 ? 1 : 1 - (t2.t - 1.1) / 0.5; ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(t2.size * k)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(40,28,20,.7)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 18); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 18); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 60), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30, hy = H * 0.16;
    ctx.fillStyle = 'rgba(40,28,20,.92)'; rrect(W / 2 - w / 2, hy - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, hy - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,250,230,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); } }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of String(t).split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function txt(s, x, y, col = '#fff', font, al = 'center') { ctx.textAlign = al; if (font) ctx.font = font; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(40,28,20,.7)'; ctx.strokeText(s, x, y); ctx.fillStyle = col; ctx.fillText(s, x, y); }
function layout(G) { const bw = (W - 50) / 4, y = H - 70 * k; return { modes: ['pull', 'shape', 'trim', 'done'].map((m, i) => ({ m, x: 10 + i * (bw + 10), y, w: bw, h: 52 * k })), glaze: GLAZES.map((g, i) => ({ i, x: W / 2 + (i - 2.5) * 58 * k, y: H - 150 * k, r: 24 * k })) }; }
function hud(G, now) { ctx.textBaseline = 'middle'; const L = layout(G);
  // the order card
  { const x = 12, y = 56 * k, w = 128 * k, h = 118 * k; ctx.fillStyle = 'rgba(255,248,232,.95)'; rrect(x, y, w, h, 8); ctx.fill(); ctx.strokeStyle = 'rgba(90,60,30,.4)'; ctx.lineWidth = 1; rrect(x, y, w, h, 8); ctx.stroke();
    ctx.fillStyle = '#5a3a20'; ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.textAlign = 'left'; ctx.fillText(`ORDER · ${G.ord.from}`.toUpperCase().slice(0, 26), x + 8, y + 12 * k); ctx.font = `700 ${Math.round(14 * k)}px ${TF}`; ctx.fillText(G.ord.name, x + 8, y + 28 * k);
    const sc = Math.min((h - 58 * k) / G.ord.h, (w - 30) / 2 / 13), cx = x + w / 2, by = y + h - 14 * k; ctx.fillStyle = '#' + GLAZES[G.ord.glaze].col.toString(16).padStart(6, '0'); ctx.beginPath(); ctx.moveTo(cx, by);
    for (let i = 0; i * DZ <= G.ord.h; i++) ctx.lineTo(cx + G.target[i] * sc, by - i * DZ * sc); for (let i = Math.floor(G.ord.h / DZ); i >= 0; i--) ctx.lineTo(cx - G.target[i] * sc, by - i * DZ * sc); ctx.closePath(); ctx.fill(); }
  // the dotted outline of the order, around your pot
  if (G.phase !== 'center' && G.phase !== 'kiln' && !G.over) { ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2.5; ctx.setLineDash([5, 6]); for (const s of [-1, 1]) { ctx.beginPath(); for (let i = 0; i * DZ <= G.ord.h; i++) { const [x, y] = toScreen(s * G.target[i], i * DZ); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke(); } ctx.setLineDash([]);
    const [lx, ly] = toScreen(-G.target[Math.floor(G.ord.h / DZ)] - 1, G.ord.h); txt('order', lx - 18 * k, ly, 'rgba(255,255,255,.85)', `700 ${Math.round(11 * k)}px ${BC}`); }
  // the match now, and the wall gauge
  if (G.phase === 'pull' || G.phase === 'shape') { const m = match(G), s = stability(G); txt(`${m}%`, W - 50 * k, 70 * k, m >= G.cfg.goal ? '#8fe0ab' : '#fff', `700 ${Math.round(26 * k)}px ${TF}`); txt(`match (need ${Math.round(G.cfg.goal)}%)`, W - 50 * k, 94 * k, 'rgba(255,255,255,.9)', `700 ${Math.round(11 * k)}px ${BC}`);
    const gx = W - 92 * k, gy = 112 * k, gw = 84 * k; ctx.fillStyle = 'rgba(40,28,20,.6)'; rrect(gx, gy, gw, 12 * k, 6); ctx.fill(); const f = clamp((s - 1) / 1.2, 0, 1); ctx.fillStyle = s < 1.15 ? '#ff6a4a' : s < 1.4 ? '#ffd36a' : '#8fe0ab'; rrect(gx, gy, gw * f, 12 * k, 6); ctx.fill(); txt('walls', gx + gw / 2, gy + 24 * k, 'rgba(255,255,255,.9)', `700 ${Math.round(11 * k)}px ${BC}`);
    txt(`${Math.round(G.h)} cm tall (order ${Math.round(G.ord.h)})`, W / 2, H - 92 * k, '#fff', `700 ${Math.round(13 * k)}px ${BC}`); }
  // centring: the pressure gauge with its green band
  if (G.phase === 'center') { const gx = W / 2 - 110 * k, gy = H - 120 * k, gw = 220 * k; ctx.fillStyle = 'rgba(40,28,20,.6)'; rrect(gx, gy, gw, 18 * k, 9); ctx.fill(); ctx.fillStyle = 'rgba(143,224,171,.7)'; ctx.fillRect(gx + gw * 0.42, gy, gw * 0.36, 18 * k);
    const px = gx + gw * G.press; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(px, gy - 4); ctx.lineTo(px - 7 * k, gy - 14 * k); ctx.lineTo(px + 7 * k, gy - 14 * k); ctx.fill();
    txt(G.holding ? (G.press > 0.78 ? 'too hard' : G.press < 0.42 ? 'press a little more' : 'good: hold it') : 'HOLD ON THE CLAY AND PRESS (DRAG DOWN)', W / 2, gy - 30 * k, '#fff', `700 ${Math.round(14 * k)}px ${BC}`);
    const wb = clamp(1 - G.wob, 0, 1); ctx.fillStyle = 'rgba(40,28,20,.6)'; rrect(gx, gy + 30 * k, gw, 8 * k, 4); ctx.fill(); ctx.fillStyle = '#ffd36a'; rrect(gx, gy + 30 * k, gw * wb, 8 * k, 4); ctx.fill(); txt('centred', gx + gw / 2, gy + 50 * k, 'rgba(255,255,255,.85)', `700 ${Math.round(11 * k)}px ${BC}`); }
  // the tools
  if (G.phase === 'pull' || G.phase === 'shape') { const lab = { pull: '⬆ PULL', shape: '✋ SHAPE', trim: '✂ TRIM', done: '✔ DONE' }; L.modes.forEach(b => { const on = b.m === ui.mode || (b.m === 'shape' && G.phase === 'shape' && ui.mode !== 'trim') || (b.m === 'pull' && G.phase === 'pull' && ui.mode !== 'trim'); const dis = (b.m !== 'pull' && G.pulls === 0);
      ctx.globalAlpha = dis ? 0.4 : 1; ctx.fillStyle = on ? '#c8763a' : 'rgba(40,28,20,.6)'; rrect(b.x, b.y, b.w, b.h, 12); ctx.fill(); txt(lab[b.m], b.x + b.w / 2, b.y + b.h / 2, '#fff', `700 ${Math.round(15 * k)}px ${BC}`); ctx.globalAlpha = 1; });
    if (ui.touch && ui.touch.trail) { ctx.strokeStyle = ui.touch.fast ? '#ff6a4a' : '#8fe0ab'; ctx.lineWidth = 6 * k; ctx.globalAlpha = 0.6; ctx.beginPath(); ui.touch.trail.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); ctx.globalAlpha = 1; }
    if (ui.mode === 'trim' && ui.trimZ != null) { const [x0, y] = toScreen(-13, ui.trimZ), [x1] = toScreen(13, ui.trimZ); ctx.strokeStyle = '#ff6a4a'; ctx.setLineDash([8, 5]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); ctx.setLineDash([]); } }
  if (G.phase === 'glaze') { txt('CHOOSE THE GLAZE', W / 2, H - 196 * k, '#fff', `700 ${Math.round(16 * k)}px ${BC}`); L.glaze.forEach(b => { ctx.fillStyle = '#' + GLAZES[b.i].col.toString(16).padStart(6, '0'); ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); }); txt(`they asked for ${GLAZES[G.ord.glaze].name}`, W / 2, H - 108 * k, '#ffe6a8', `700 ${Math.round(13 * k)}px ${BC}`); }
  if (G.phase === 'kiln') txt('FIRING…', W / 2, H * 0.2, '#ffd36a', `700 ${Math.round(28 * k)}px ${TF}`);
  if (G.lesson) lessonPanel(G);
  if (ui.banner) { const b = ui.banner, a = Math.min(1, b.t / 0.2, ((b.secs || 1.6) - b.t) / 0.4); ctx.globalAlpha = Math.max(0, a); txt(b.txt, W / 2, H * 0.24, '#ffd36a', `700 ${Math.round(30 * k)}px ${TF}`); if (b.sub) txt(b.sub, W / 2, H * 0.24 + 28 * k, '#fff', `700 ${Math.round(14 * k)}px ${BC}`); ctx.globalAlpha = 1; } }
function lessonPanel(G) { coachPanel(G); }
