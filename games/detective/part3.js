// ===================== THE VIEW: Detective (upright; the room from above, the object close up, the case below) =====================
// The top half of the screen is the room, seen from a corner above: walls with a window and a door, a rug, and the furniture
// that can be searched (each a shape you can tell at a glance). Tap one and it comes up close: drag to turn it, pinch to
// zoom; a hidden mark is a small dark smudge on one side, and a lens upgrade makes it glint. The bottom half is the case
// itself (part5): briefing, people, notebook, accusation.
const FX = { shake: 0, stop: 0, flash: 0, red: 0, slow: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { snap: true, banner: null, cam: null, drag: null, zoom: 1, pinch: null, tab: 'scene', sus: null, acc: { who: null, how: null, when: null, proof: [] }, linkFor: null, said: null, why: null, dirty: true };
function say(txt, x, y, col = '#fff', size = 22) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS || !(G && G.lesson)) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 140) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60 * k, t: 0, life: 0.5 + Math.random() * 0.5, col, r: (2 + Math.random() * 3) * k }); } }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2.5); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.4) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 200 * dt; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (ui.banner) { ui.banner.t += dt; if (ui.banner.t > (ui.banner.secs || 1.6)) ui.banner = null; }
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; } }
function mySkin() { if (typeof HEADLESS !== 'undefined' && HEADLESS) return SKINS[0]; const id = store.get('skin', 'trench'); return SKINS.find(q => q.id === id) || SKINS[0]; }
const SH = () => H * 0.5;      // the height of the 3D picture (the top half)
const WALL = { home: [0xc8b89a, 0x6a4a3a], hotel: [0xd8c8b0, 0x8a2a2a], museum: [0xe8e4dc, 0x5a6a7a], train: [0x8a5a3a, 0x3a5a4a], office: [0xd0d4d8, 0x4a5a6a], theatre: [0x7a2a34, 0xc8a050], ship: [0xe4e8ea, 0x2a4a6a], school: [0xb8b4a0, 0x3a4a3a], inn: [0xd8c4a0, 0x4a3020] };
function buildWorld() {
  if (V3) return V3; const T = window.THREE; if (!T || !W3 || !W3.init({ canvas: $('gl'), fov: 42, far: 200, near: 0.1, dims: () => [W, SH()] })) { V3 = { none: true }; return V3; }
  V3 = { T, S: W3.scene, t: 0, for: null, items: [] }; const V = V3, M = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.7 }, o)); V.M = M;
  W3.scene.children.forEach(o => { if (o.isLineSegments) o.visible = false; });
  V.boxG = new T.BoxGeometry(1, 1, 1); V.cylG = new T.CylinderGeometry(1, 1, 1, 16); V.sphG = new T.SphereGeometry(1, 16, 12);
  V.glow = new T.Mesh(new T.RingGeometry(1.15, 1.35, 32).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: 0xffd060, transparent: true, opacity: 0.9, depthWrite: false })); V.glow.visible = false; V.S.add(V.glow);
  V.stage = new T.Group(); V.stage.position.set(0, 60, 0); V.S.add(V.stage);      // where an object is examined, up out of the room
  const bd = new T.Mesh(new T.PlaneGeometry(40, 40), new T.MeshBasicMaterial({ color: 0x2a2228 })); bd.position.set(0, 60, -8); V.S.add(bd);
  const lamp = new T.PointLight(0xfff0d8, 60, 30); lamp.position.set(3, 66, 6); V.S.add(lamp);
  W3.setQuality(stepN); return V; }
// one shape per kind of furniture (so a desk looks like a desk from above)
function furniture(V, kind, col) { const T = V.T, M = V.M, g = new T.Group(), wood = M(0x7a5232), dark = M(0x3a2a20), cloth = M(col || 0x8a3a3a), glass = M(0xbfe0ff, { transparent: true, opacity: 0.35, roughness: 0.1 }), b = (m, sx, sy, sz, x, y, z) => { const q = new T.Mesh(V.boxG, m); q.scale.set(sx, sy, sz); q.position.set(x, y, z); q.castShadow = true; g.add(q); return q; };
  switch (kind) {
    case 'desk': b(wood, 1.8, 0.12, 0.9, 0, 0.78, 0); for (const sx of [-0.8, 0.8]) b(wood, 0.12, 0.78, 0.8, sx, 0.39, 0); b(M(0xf0ead8), 0.5, 0.02, 0.35, 0.2, 0.85, 0); break;
    case 'shelf': b(wood, 1.6, 1.9, 0.4, 0, 0.95, 0); for (let i = 0; i < 4; i++) b(M([0x8a2a2a, 0x2a4a6a, 0x4a6a2a, 0x8a6a2a][i]), 1.4, 0.3, 0.3, 0, 0.35 + i * 0.45, 0.06); break;
    case 'cabinet': b(dark, 1.0, 1.3, 0.55, 0, 0.65, 0); b(M(0xd8b060, { metalness: 0.6 }), 0.06, 0.15, 0.04, 0.12, 0.7, 0.29); break;
    case 'sofa': b(cloth, 1.9, 0.45, 0.85, 0, 0.3, 0); b(cloth, 1.9, 0.6, 0.22, 0, 0.6, -0.34); for (const sx of [-0.9, 0.9]) b(cloth, 0.2, 0.55, 0.85, sx, 0.4, 0); break;
    case 'table': { const t = new T.Mesh(V.cylG, wood); t.scale.set(0.55, 0.06, 0.55); t.position.y = 0.7; g.add(t); const l = new T.Mesh(V.cylG, wood); l.scale.set(0.07, 0.7, 0.07); l.position.y = 0.35; g.add(l); const v = new T.Mesh(V.cylG, M(0x4a7ac8)); v.scale.set(0.1, 0.25, 0.1); v.position.y = 0.86; g.add(v); break; }
    case 'bin': { const t = new T.Mesh(new T.CylinderGeometry(0.28, 0.22, 0.55, 14, 1, true), M(0x5a5a5a, { side: T.DoubleSide, metalness: 0.4 })); t.position.y = 0.28; g.add(t); break; }
    case 'coatstand': { const p = new T.Mesh(V.cylG, wood); p.scale.set(0.05, 1.8, 0.05); p.position.y = 0.9; g.add(p); const c = new T.Mesh(new T.ConeGeometry(0.35, 1.0, 10), M(0x6a5a3a)); c.position.y = 1.2; g.add(c); break; }
    case 'lamp': { const p = new T.Mesh(V.cylG, M(0x2a2a2a)); p.scale.set(0.04, 1.4, 0.04); p.position.y = 0.7; g.add(p); const s = new T.Mesh(new T.ConeGeometry(0.35, 0.4, 14, 1, true), M(0xf0d8a0, { side: T.DoubleSide, emissive: 0x403010 })); s.position.y = 1.5; g.add(s); break; }
    case 'plant': { const p = new T.Mesh(new T.CylinderGeometry(0.25, 0.2, 0.4, 12), M(0xa85a3a)); p.position.y = 0.2; g.add(p); for (let i = 0; i < 6; i++) { const l = new T.Mesh(new T.ConeGeometry(0.12, 0.9, 6), M(0x3a7a3a)); l.position.set(Math.cos(i) * 0.12, 0.8, Math.sin(i) * 0.12); l.rotation.set(Math.sin(i) * 0.5, 0, Math.cos(i) * 0.5); g.add(l); } break; }
    case 'case': b(dark, 0.9, 0.9, 0.6, 0, 0.45, 0); b(glass, 0.85, 0.5, 0.55, 0, 1.15, 0); b(M(0x7a1a2a), 0.7, 0.05, 0.45, 0, 0.92, 0); break;
    case 'painting': b(M(0xc8a040, { metalness: 0.4 }), 1.3, 0.95, 0.08, 0, 1.55, 0); b(M(0x4a7a8a), 1.1, 0.75, 0.04, 0, 1.55, 0.04); break;
    case 'window': b(M(0xeeeeee), 1.4, 1.3, 0.12, 0, 1.4, 0); b(M(0x9ad0f0, { emissive: 0x204060 }), 1.2, 1.1, 0.06, 0, 1.4, 0.04); b(M(0xeeeeee), 1.4, 0.06, 0.14, 0, 1.4, 0.05); break;
    case 'suitcase': b(M(0x8a5a2a), 0.8, 0.55, 0.3, 0, 0.28, 0); b(dark, 0.3, 0.06, 0.06, 0, 0.6, 0); break;
    case 'clock': b(wood, 0.55, 0.6, 0.3, 0, 0.3, 0); { const f = new T.Mesh(V.cylG, M(0xf4f0e0)); f.scale.set(0.2, 0.03, 0.2); f.rotation.x = Math.PI / 2; f.position.set(0, 0.36, 0.16); g.add(f); } break;
  }
  return g; }
function buildRoom(V, G) { const T = V.T, P = G.place, r = G.rooms[G.room], wc = WALL[P.id];
  for (const o of V.items) V.S.remove(o); V.items = []; const add = o => { V.S.add(o); V.items.push(o); return o; };
  W3.setSky(P.sky);
  const floor = add(new T.Mesh(new T.PlaneGeometry(13, 11), V.M(P.id === 'train' ? 0x5a3a2a : 0x8a6a4a, { roughness: 0.9 }))); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
  const rug = add(new T.Mesh(new T.PlaneGeometry(7, 5), V.M(wc[1], { roughness: 1 }))); rug.rotation.x = -Math.PI / 2; rug.position.y = 0.01; rug.receiveShadow = true;
  const wall = V.M(wc[0], { roughness: 0.95 }); for (const [w, x, z, ry] of [[13, 0, -5.5, 0], [11, -6.5, 0, Math.PI / 2]]) { const m = add(new T.Mesh(new T.PlaneGeometry(w, 3.2), wall)); m.position.set(x, 1.6, z); m.rotation.y = ry; m.receiveShadow = true; }
  const door = add(new T.Mesh(V.boxG, V.M(0x5a3a22))); door.scale.set(1.1, 2.2, 0.08); door.position.set(3.5, 1.1, -5.45);
  V.furn = r.items.map((it, j) => { const g = add(furniture(V, it.kind, wc[1])); g.position.set(it.x, 0, it.z); g.rotation.y = Math.atan2(-it.x, -it.z) + Math.PI; g.scale.setScalar(1.05); return g; });
  V.forRoom = G.room + ':' + G.rooms.length + ':' + G.seed + ':' + (G.lesson ? 1 : 0) + ':' + G.clues.length; V.insFor = null; ui.snap = true; }
// the object being examined: a bigger copy of it on the stage, and on its hidden side a small dark smudge
function buildInspect(V, G) { const T = V.T, I = G.insp; V.stage.clear(); if (!I) return; const g = furniture(V, I.it.kind, WALL[G.place.id][1]); const bb = new T.Box3().setFromObject(g), sz = new T.Vector3(); bb.getSize(sz); const s = 3.2 / Math.max(sz.x, sz.y, sz.z); g.scale.setScalar(s); g.position.y = -bb.getCenter(new T.Vector3()).y * s; V.stage.add(g); V.insObj = g; V.insSize = [sz.x * s, sz.y * s, sz.z * s];
  const cl = I.it.clue != null ? clue(G, I.it.clue) : null; V.mark = null;
  if (cl && cl.hidden && !cl.found) { const a = cl.face * Math.PI / 2, n = new T.Vector3(Math.sin(a), 0, Math.cos(a)), rgt = new T.Vector3(Math.cos(a), 0, -Math.sin(a)), half = 1.2, depth = Math.max(V.insSize[0], V.insSize[2]) / 2 + 0.25;
    const m = new T.Mesh(new T.CircleGeometry(0.16, 16), new T.MeshBasicMaterial({ color: 0x2a1a10, transparent: true, opacity: 0.85 })); m.position.copy(n.clone().multiplyScalar(depth)).add(rgt.clone().multiplyScalar(cl.spot[0] * half)).add(new T.Vector3(0, -cl.spot[1] * half, 0)); m.lookAt(m.position.clone().add(n)); V.stage.add(m); V.mark = m; }
  V.insFor = I; }
function sync(V, G, dt) { V.t += dt; const T = V.T;
  const key = G.room + ':' + G.rooms.length + ':' + G.seed + ':' + (G.lesson ? 1 : 0) + ':' + G.clues.length; if (V.forRoom !== key || V.forCase !== G.rooms) { V.forCase = G.rooms; buildRoom(V, G); }
  if (V.insFor !== G.insp) buildInspect(V, G);
  const cam = W3.cam, w = W, h = SH();
  if (G.insp) { V.stage.rotation.y = -G.insp.yaw; const z = 9 / clamp(ui.zoom, 0.7, 2.2); cam.position.set(0, 61.2, z); cam.lookAt(0, 60, 0); if (V.mark) { V.mark.material.opacity = 0.6 + (upLv('lens') ? 0.4 * (0.5 + 0.5 * Math.sin(V.t * 6)) : 0.25); } }
  else { cam.position.set(7.5, 9.5, 9.5); cam.lookAt(-0.3, 0, -0.6); }
  cam.aspect = w / h; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  const H2 = G.highlight; V.glow.visible = !!(H2 && H2.room === G.room && !G.insp); if (V.glow.visible) { const j = G.rooms[G.room].items.findIndex(q => q.kind === H2.item && q.clue != null); const it = G.rooms[G.room].items[j]; if (it) { V.glow.position.set(it.x, 0.03, it.z); V.glow.scale.setScalar(1 + Math.sin(V.t * 5) * 0.08); } else V.glow.visible = false; }
  W3.setFocus(0, 0, 0, 10); }
function scrOf(x, y, z) { const V = V3; if (!V || V.none) return null; return W3.screen(new V.T.Vector3(x, y, z)); }
// where on the face being looked at a tap lands (-1..1 across the object's square), or null if it is off the object
const faceS = () => (SH() / 2) / (Math.tan(21 * Math.PI / 180) * 9 / clamp(ui.zoom, 0.7, 2.2)) * 1.2;      // pixels for one unit of a face (1.2 m on the stage, as the mark is placed)
function faceUV(x, y) { const S = faceS(); return [(x - W / 2) / S, (y - SH() / 2) / S]; }
function faceXY(u, v) { const S = faceS(); return [W / 2 + u * S, SH() / 2 + v * S]; }
// ---------- events ----------
function onEvent(G, e) { const mid = { x: W / 2, y: SH() * 0.5 };
  switch (e.k) {
    case 'inspect': sfx.pick(); ui.zoom = 1; break;
    case 'clue': sfx.clue(e.key); vibe(HAP.light); say(e.hidden ? 'HIDDEN CLUE!' : 'CLUE', mid.x, mid.y - 70 * k, '#ffd36a', 26); burst(mid.x, mid.y - 40 * k, '#ffd36a', e.key ? 22 : 12, 140); ui.dirty = true; ui.newNote = true; break;
    case 'nothing': case 'look': break;
    case 'tapnothing': sfx.tap(); break;
    case 'answer': sfx.talk(); ui.said = { si: e.si, text: e.text }; ui.dirty = true; ui.newNote = true; break;
    case 'react': if (e.ok) { sfx.gotcha(); vibe(HAP.thud); FX.flash = 0.25; } else sfx.no(); ui.said = { si: e.si, text: e.text, ok: e.ok }; ui.dirty = true; break;
    case 'link': if (e.fact) sfx.fact(); else sfx.tap(); ui.dirty = true; break;
    case 'hint': sfx.hint(); ui.banner = null; hint = { txt: '💡 ' + e.text, t: 0, secs: 5 }; ui.dirty = true; break;
    case 'room': sfx.step(); break;
    case 'wrong': sfx.wrong(); ui.why = e.why; ui.dirty = true; ui.banner = { txt: e.left > 0 ? 'NOT PROVEN' : 'THE CASE GOES COLD', sub: e.left > 0 ? `${e.left} more ${e.left === 1 ? 'try' : 'tries'}` : '', t: 0, secs: 2 }; break;
    case 'solved': sfx.solved(); FX.flash = 0.6; vibe(HAP.best); break;
    case 'lessonnext': if (e.first) hint = null; say('FIRST, A LESSON', mid.x, mid.y, '#ffd36a', 24); ui.dirty = true; break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, mid.x, mid.y + 30 * k, '#8fe0ab', 24); sfx.coin(e.n); ui.dirty = true; break;
    case 'lessonmiss': say('AGAIN', mid.x, mid.y + 40 * k, '#ffd0a0', 20); break;
    case 'lessondone': say('A REAL CASE NOW', mid.x, mid.y, '#ffd36a', 24); sfx.solved(); ui.snap = true; ui.tab = 'scene'; ui.acc = { who: null, how: null, when: null, proof: [] }; ui.dirty = true; if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); FX.flash = 0.5; vibe(HAP.best); break;
    case 'lost': sfx.lose(); break;      // (P11: never vibrate on failure)
  } }
// ---------- the picture ----------
let IG = null; function idleG() { if (!IG) IG = newGame(4, { seed: 11 }); IG.t += 1 / 60; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#2a2228'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 16px ${BC}`; ctx.fillText('This phone cannot draw the 3D room.', W / 2, H * 0.25); if (G) hud(G, now); return; }
  const g = G || idleG(); sync(V, g, dt || 1 / 60); W3.render(dt || 1 / 60);
  if (G && !(G.over && !$('ovEnd').classList.contains('hidden'))) hud(G, now);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 1.1 ? 1 : 1 - (t2.t - 1.1) / 0.5; ctx.globalAlpha = Math.max(0, al); ctx.font = `400 ${Math.round(t2.size * k)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(20,14,20,.75)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 18); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 18); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 60), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30, hy = SH() - 70 * k - h / 2;
    ctx.fillStyle = 'rgba(30,22,30,.94)'; rrect(W / 2 - w / 2, hy - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#ffe6a8'; lines.forEach((l, i) => ctx.fillText(l, W / 2, hy - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,250,230,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); }
  if (G && G.lesson && !G.over) coachPanel(G); }      /* the hand (26 Nov 2026: this game showed the lesson only as words in the panel; the coach draws over the panel too, so the hand can point at its buttons) */
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of String(t).split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function layout(G) { return { scene: { x: 0, y: 0, w: W, h: SH() } }; }
// over the room: a ring under every object you have not looked at yet; when examining, the hint to turn it
function hud(G, now) { ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  if (!G.insp) { const r = G.rooms[G.room]; r.items.forEach(it => { const p = scrOf(it.x, 0.05, it.z); if (!p) return; ctx.strokeStyle = it.seen ? 'rgba(255,255,255,.25)' : 'rgba(255,214,110,.85)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y + 6 * k, 9 * k, 0, TAU); ctx.stroke(); if (!it.seen) { ctx.fillStyle = 'rgba(255,214,110,.85)'; ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.fillText('?', p.x, p.y + 6 * k); } });
    if ((G && G.lesson) && G.t < 6 && !G.lesson) { ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.strokeText('TAP AN OBJECT TO LOOK CLOSER', W / 2, SH() - 50 * k); ctx.fillStyle = '#fff'; ctx.fillText('TAP AN OBJECT TO LOOK CLOSER', W / 2, SH() - 50 * k); } }
  else { const y = SH() - 130 * k; ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.8)'; if (G && G.lesson) ctx.fillText('◀ drag to turn it ▶   ·   pinch to zoom   ·   tap what you notice', W / 2, 92 * k);
    if (!ui.drag) { const a = Math.sin(now * 2.5) * 30 * k; ctx.globalAlpha = 0.35; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(W / 2 + a, y, 14 * k, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; } }
  if (ui.banner) { const b = ui.banner, a = Math.min(1, b.t / 0.2, ((b.secs || 1.6) - b.t) / 0.4); ctx.globalAlpha = Math.max(0, a); ctx.font = `400 ${Math.round(30 * k)}px ${TF}`; ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(20,14,20,.8)'; ctx.strokeText(b.txt, W / 2, SH() * 0.4); ctx.fillStyle = '#ffd36a'; ctx.fillText(b.txt, W / 2, SH() * 0.4);
    if (b.sub) { ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; ctx.lineWidth = 4; ctx.strokeText(b.sub, W / 2, SH() * 0.4 + 28 * k); ctx.fillStyle = '#fff'; ctx.fillText(b.sub, W / 2, SH() * 0.4 + 28 * k); } ctx.globalAlpha = 1; } }
