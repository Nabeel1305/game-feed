const DRB = { at: -1e9 };      // when the drone was last put back after a crash (for the fade)
// ===================== THE VIEW: Drone Pilot in 3D (three.js through tools/world3d.js) =====================
// A park on rolling hills: grass, paths, pines and broad trees, a few buildings and billboards, the level's weather and light.
// The course is a line of glowing hoops; the next one pulses bright, the rest wait dim. The drone (four spinning props, white
// lights at the front, red at the back) is seen from just behind and above; the camera leans with it. The two sticks show
// where your thumbs are.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [];
let hint = null, V3 = null;
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 6) TXT.shift(); }
function tip(key, txt, secs = 2.8) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function fxStep(dt) {
  FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 1.8);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.3) TXT.shift();
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; }
}
const ui = { sticks: {} };
function buildDrone(T) {
  const g = new T.Group(), dark = new T.MeshStandardMaterial({ color: 0x1c1e22, roughness: 0.45, metalness: 0.4 }), acc = new T.MeshStandardMaterial({ color: 0xe8552a, roughness: 0.4 });
  const body = new T.Mesh(new T.BoxGeometry(0.28, 0.08, 0.36), dark); g.add(body); const top = new T.Mesh(new T.BoxGeometry(0.16, 0.05, 0.2), acc); top.position.y = 0.06; g.add(top);
  const cam = new T.Mesh(new T.BoxGeometry(0.06, 0.06, 0.05), dark); cam.position.set(0, 0.02, 0.2); g.add(cam);
  const props = []; for (const [x, z] of [[-0.25, 0.25], [0.25, 0.25], [-0.25, -0.25], [0.25, -0.25]]) { const arm = new T.Mesh(new T.BoxGeometry(0.04, 0.025, 0.36), dark); arm.position.set(x / 2, 0, z / 2); arm.rotation.y = Math.atan2(x, z); g.add(arm);
    const motor = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, 0.05, 12), dark); motor.position.set(x, 0.02, z); g.add(motor);
    const p = new T.Mesh(new T.CylinderGeometry(0.13, 0.13, 0.005, 24), new T.MeshStandardMaterial({ color: 0x99a0aa, transparent: true, opacity: 0.35, roughness: 0.3 })); p.position.set(x, 0.05, z); g.add(p); props.push(p);
    const led = new T.Mesh(new T.SphereGeometry(0.02, 8, 6), new T.MeshStandardMaterial({ color: z > 0 ? 0xffffff : 0xff2020, emissive: z > 0 ? 0xffffff : 0xff2020, emissiveIntensity: 3 })); led.position.set(x, -0.01, z); g.add(led); }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); g.userData = { props }; return g;
}
function buildWorld() {
  if (V3) return V3; const T = THREE; if (!W3 || !W3.init({ canvas: $('gl'), fov: 62, far: 4000, near: 0.05 })) { V3 = { none: true }; return V3; }
  const S = W3.scene;
  const land = W3.terrain({ size: 900, seg: 160, x: 0, z: 200, height: groundH, colour: (x, z, h) => { const path = Math.abs(Math.sin(x * 0.02 + z * 0.01) * 30 - x * 0.2) < 2.2; return path ? [0.55, 0.48, 0.36] : [0.24 + h * 0.012, 0.42 + h * 0.01, 0.16]; }, map: W3.grainTex(256, 7, 200, 40, 8) });
  if (land.material.map) land.material.map.repeat.set(60, 60);
  V3 = { T, S, land, drone: buildDrone(T), hoops: [], treeKey: null, treeMesh: [], walls: [], cam: { x: 0, y: 4, z: -6 }, prop: 0, dust: [] };
  S.add(V3.drone);
  W3.setQuality(stepN); return V3;
}
function setWeather(G) {
  const V = buildWorld(); if (V.none || V.sky === G.weather) return; V.sky = G.weather;
  W3.setSky(G.weather, { azim: 150 });
  W3.S.onBolt = () => { if (!HEADLESS && sfx.thunder) setTimeout(() => sfx.thunder(), 300 + Math.random() * 900); };
}
function syncCourse(G) {
  const V = V3, T = V.T, key = G.seed + ':' + G.hoops.length + ':' + (G.hoops[0] ? G.hoops[0].z0 || G.hoops[0].z : 0) + ':' + G.trees.length + (G.lesson ? 'L' + G.lesson.i : '');
  if (V.treeKey === key) return; V.treeKey = key;
  V.hoops.forEach(m => V.S.remove(m)); V.treeMesh.forEach(m => V.S.remove(m)); V.walls.forEach(m => V.S.remove(m));
  // (23 Nov 2026, from his review of Soar: "The rings are ugly. Make them more pretty": these were the same thing, one plain tube.) Each hoop is a
  // racing gate of light: a dark frame, a bright neon core, a soft glow and a halo round it, and sixteen lamps that chase round the frame; each
  // hoop along the course is the next colour.
  if (!V.haloTex) { const c = document.createElement('canvas'); c.width = c.height = 256; const g2 = c.getContext('2d'), gr = g2.createRadialGradient(128, 128, 60, 128, 128, 128); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.44, 'rgba(255,255,255,0)'); gr.addColorStop(0.61, 'rgba(255,255,255,.5)'); gr.addColorStop(0.72, 'rgba(255,255,255,.14)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g2.fillStyle = gr; g2.fillRect(0, 0, 256, 256); V.haloTex = new T.CanvasTexture(c); }
  const addM = o2 => new T.MeshBasicMaterial(Object.assign({ transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide }, o2)), HCOL = [0x40f0ff, 0xff4fd8, 0x9dff4a, 0xffb02e, 0x8a7bff];
  V.hoops = G.hoops.map((h, i) => { const g3 = new T.Group(), col = HCOL[i % HCOL.length], frame = new T.Mesh(new T.TorusGeometry(h.r, 0.13, 10, 56), new T.MeshStandardMaterial({ color: 0x10181c, roughness: 0.35, metalness: 0.6 })); frame.castShadow = true;
    const core = new T.Mesh(new T.TorusGeometry(h.r - 0.02, 0.05, 8, 64), new T.MeshBasicMaterial({ color: col, transparent: true })), glow = new T.Mesh(new T.TorusGeometry(h.r, 0.26, 8, 64), addM({ color: col, opacity: 0.35 })), halo = new T.Mesh(new T.PlaneGeometry(h.r * 3.3, h.r * 3.3), addM({ map: V.haloTex, color: col, opacity: 0.5 })), lamps = new T.Group();
    for (let q = 0; q < 16; q++) { const lm = new T.Mesh(new T.SphereGeometry(0.085, 8, 6), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true })); lm.position.set(Math.cos(q / 16 * 6.283) * (h.r + 0.13), Math.sin(q / 16 * 6.283) * (h.r + 0.13), 0); lamps.add(lm); }
    g3.add(frame, halo, glow, core, lamps); g3.userData = { core, glow, halo, lamps, col }; V.S.add(g3); return g3; });
  const pines = G.trees.filter((t, i) => i % 2 === 0), broad = G.trees.filter((t, i) => i % 2 === 1);
  V.treeMesh = [];
  if (pines.length) V.treeMesh.push(W3.pines(pines.map(t => ({ x: t.x, z: t.z, y: groundH(t.x, t.z), s: t.h / 9.5, hue: (t.x * 7 % 1 + 1) % 1, shade: (t.z * 3 % 1 + 1) % 1 })), { layers: 5, shadow: true }));
  if (broad.length) { const trunkG = new T.CylinderGeometry(0.25, 0.4, 1, 7), crownG = new T.IcosahedronGeometry(1, 1), tm = new T.InstancedMesh(trunkG, new T.MeshStandardMaterial({ color: 0x4a3426, roughness: 0.9 }), broad.length), cm = new T.InstancedMesh(crownG, new T.MeshStandardMaterial({ color: 0x3a6a2a, roughness: 0.85, flatShading: true }), broad.length), o = new T.Object3D(), col = new T.Color();
    broad.forEach((t, i) => { const y = groundH(t.x, t.z); o.position.set(t.x, y + t.h * 0.25, t.z); o.scale.set(t.r * 1.4, t.h * 0.5, t.r * 1.4); o.rotation.set(0, 0, 0); o.updateMatrix(); tm.setMatrixAt(i, o.matrix); o.position.set(t.x, y + t.h * 0.68, t.z); o.scale.set(t.crown, t.h * 0.33, t.crown); o.rotation.y = i; o.updateMatrix(); cm.setMatrixAt(i, o.matrix); cm.setColorAt(i, col.setHSL(0.24 + (i % 5) * 0.015, 0.45, 0.28 + (i % 3) * 0.05)); });
    tm.castShadow = cm.castShadow = true; V.S.add(tm, cm); V.treeMesh.push(tm, cm); }
  V.walls = G.walls.map((w, i) => { const m = new T.Mesh(new T.BoxGeometry(w.w, w.h, w.d), new T.MeshStandardMaterial({ color: [0xb8a890, 0x8a8f96, 0xa86a4a, 0xd8d0c0][i % 4], roughness: 0.85 })); m.position.set(w.x, groundH(w.x, w.z) + w.h / 2 - 0.3, w.z); m.castShadow = m.receiveShadow = true; V.S.add(m); return m; });
}
function onEvent(G, e) {
  const cx = W / 2, cy = H * 0.3;
  switch (e.k) {
    case 'hoop': sfx.hoop(e.streak); vibe(HAP.tick); say(e.clean ? 'CLEAN!' : `${e.n} / ${e.of}`, cx, cy, e.clean ? '#9be3ff' : '#fff', e.clean ? 26 : 22); if (!G.lesson) say(`+${G.cfg.bonus.toFixed(1)} s`, cx, cy + 28 * k, '#9be3b5', 16); break;
    case 'back': DRB.at = performance.now(); break;
    case 'crash': sfx.crash(); FX.red = 0.6; FX.shake = 12; vibe(HAP.thud); say({ rim: 'CLIPPED THE RIM!', tree: 'INTO A TREE!', wall: 'INTO A WALL!', ground: 'HIT THE GROUND!' }[e.why] || 'CRASH!', cx, cy, '#ffb4a8', 24); tip('crash', 'Ease off early: the drone drifts. Pull the right thumb down to brake', 3); break;
    case 'course': break;
    case 'lessonnext': if (e.first) hint = null; say(e.first ? 'FIRST, A LESSON' : 'NEXT LESSON', cx, H * 0.5, '#ffd36a', 26); sfx.ding(); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, cx, H * 0.5, '#9be3b5', 26); sfx.coin(e.n); break;
    case 'lessonmiss': hint = { txt: e.how, t: 0, secs: 3.6 }; break;
    case 'lessondone': say('YOU CAN FLY!', cx, H * 0.5, '#ffd36a', 26); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); vibe(HAP.best); break;
    case 'lost': sfx.lose(); break;
  }
}
const VW = new (window.THREE ? THREE.Vector3 : Object)();
function wScreen(x, y, z) { W3.cam.updateMatrixWorld(); VW.set(x, y, z); return W3.screen(VW); }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#0e1820'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D park.', W / 2, H / 2); return; }
  const T = V.T, g = G || idleG(), t = now; setWeather(g); syncCourse(g);
  const d = g.d;
  // hoops
  V.hoops.forEach((m, i) => { const h = g.hoops[i]; if (!h) return; m.position.set(h.x, h.y, h.z); m.rotation.y = h.yaw; const nxt = i === g.next, U = m.userData, br = nxt ? 1 : i < g.next + 3 ? 0.5 : 0.22; m.visible = !h.done;
    U.core.material.opacity = Math.min(1, br * 1.4); U.glow.material.opacity = (nxt ? 0.4 + Math.sin(t * 6) * 0.12 : 0.16) * (br > 0.3 ? 1 : 0.6); U.halo.material.opacity = nxt ? 0.5 + Math.sin(t * 6) * 0.15 : 0.12; m.scale.setScalar(nxt ? 1 + Math.sin(t * 6) * 0.012 : 1);
    U.lamps.children.forEach((lm, q) => { const on = nxt ? ((q - Math.floor(t * 14)) % 16 + 16) % 16 < 5 : q % 4 === 0; lm.material.opacity = on ? 1 : 0.18; lm.material.color.setHex(on ? 0xffffff : U.col); }); });
  // the drone
  const D = V.drone; D.position.set(d.x, d.y, d.z); D.rotation.set(0, 0, 0); D.rotateY(d.yaw); D.rotateX(d.tilt); D.rotateZ(d.bank); D.visible = !(g.respawn > 0.4 && Math.sin(t * 30) > 0);
  V.prop += dt * (g.down > 0 ? 6 : 80); D.userData.props.forEach((p, i) => p.rotation.y = V.prop * (i % 2 ? 1 : -1));
  // the camera: behind and above, leaning with the turn
  const C = V.cam, back = 2.7, up = 1.0, cx = d.x - Math.sin(d.yaw) * back, cz = d.z - Math.cos(d.yaw) * back, cy = Math.max(groundH(cx, cz) + 0.6, d.y + up), e = 1 - Math.exp(-dt * 5);
  C.x += (cx - C.x) * e; C.y += (cy - C.y) * e; C.z += (cz - C.z) * e;
  const cam = W3.cam; cam.position.set(C.x, C.y, C.z); cam.lookAt(d.x + Math.sin(d.yaw) * 4, d.y + 0.3, d.z + Math.cos(d.yaw) * 4); cam.rotateZ((g.down > 0 ? 0 : d.bank) * 0.4);
  if (FX.shake > 0) cam.rotation.z += (Math.random() - 0.5) * FX.shake * 0.002;
  W3.setFocus(d.x, d.y, d.z + 10, 40);
  W3.render(dt);
  if (G) { const fa = G.down > 0 ? clamp(1 - (G.down - 0.1) / 0.4, 0, 1) : clamp(1 - (performance.now() - (DRB.at || -1e9)) / 450, 0, 1); if (fa > 0.01) { ctx.fillStyle = `rgba(8,12,18,${fa})`; ctx.fillRect(0, 0, W, H); } }      // the crash is seen, then the view goes dark and opens with the drone back before the hoop
  if (G) hud(G, t);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 0.9 ? 1 : 1 - (t2.t - 0.9) / 0.4; ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(t2.size * k)}px ${BC}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 26); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 26); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(15 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 19 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30;
    ctx.fillStyle = 'rgba(0,0,0,.66)'; rrect(W / 2 - w / 2, H * 0.45 - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.45 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,60,40,${FX.red * 0.18})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); }
}
let IG = null; function idleG() { if (!IG || IG.over || IG.next >= IG.hoops.length) { IG = newGame(5, { seed: (Math.random() * 1e6) | 0 }); IG.mem = {}; } honest(IG, { react: 0.2, acc: 0.95 }, IG.mem); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function hud(G, t) {
  const c = G.cfg;
  // an arrow towards the next hoop when it is off the screen
  const h = G.hoops[G.next]; if (h) { const p = wScreen(h.x, h.y, h.z); const on = p.front && p.x > 0 && p.x < W && p.y > 0 && p.y < H;
    if (!on) { let ax = p.x - W / 2, ay = p.y - H / 2; if (!p.front) { ax = -ax; ay = -ay; } const s = Math.min((W / 2 - 30) / Math.abs(ax || 1e-3), (H / 2 - 120) / Math.abs(ay || 1e-3)); ctx.save(); ctx.translate(W / 2 + ax * s, H / 2 + ay * s); ctx.rotate(Math.atan2(ay, ax)); ctx.fillStyle = '#40f0ff'; ctx.beginPath(); ctx.moveTo(16 * k, 0); ctx.lineTo(-8 * k, -10 * k); ctx.lineTo(-8 * k, 10 * k); ctx.closePath(); ctx.fill(); ctx.restore(); }
    else { const dd = Math.hypot(h.x - G.d.x, h.y - G.d.y, h.z - G.d.z); ctx.fillStyle = 'rgba(160,250,255,.9)'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillText(`${Math.round(dd)} m`, p.x, p.y - 30 * k); } }
  if (G.lesson) lessonPanel(G);
  else { const ty = 44 * k; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.font = `800 ${Math.round(26 * k)}px ${TF}`; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.5)'; const s = G.clock.toFixed(1); ctx.fillStyle = G.clock < 5 ? '#ff8a6a' : '#fff'; ctx.strokeText(s, 16, ty); ctx.fillText(s, 16, ty);
    ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = '#fff'; ctx.textAlign = 'right'; ctx.strokeText(`HOOP ${Math.min(G.next + 1, G.hoops.length)} / ${G.hoops.length}`, W - 16, ty + 4 * k); ctx.fillText(`HOOP ${Math.min(G.next + 1, G.hoops.length)} / ${G.hoops.length}`, W - 16, ty + 4 * k);
    for (let i = 0; i < c.lives; i++) { ctx.beginPath(); ctx.arc(W - 22 - i * 16 * k, ty + 28 * k, 5 * k, 0, TAU); ctx.fillStyle = i < G.lives ? '#40f0ff' : 'rgba(255,255,255,.25)'; ctx.fill(); }
    if (c.wind > 0.3) { ctx.save(); ctx.translate(W - 30 * k, ty + 52 * k); ctx.rotate(G.windA - G.d.yaw - Math.PI / 2); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-10 * k, 0); ctx.lineTo(10 * k, 0); ctx.lineTo(4 * k, -5 * k); ctx.moveTo(10 * k, 0); ctx.lineTo(4 * k, 5 * k); ctx.stroke(); ctx.restore(); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.font = `700 ${Math.round(9 * k)}px ${BC}`; ctx.textAlign = 'right'; ctx.fillText('WIND', W - 44 * k, ty + 48 * k); } }
  // the one stick: where your thumb is; a hint until you have flown a little
  { const s = ui.sticks.L, cx = s ? s.x0 : W / 2, cy = s ? s.y0 : H - 130 * k, r = 54 * k; ctx.globalAlpha = s ? 0.85 : 0.4; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
    const kx = s ? cx + clamp(s.x - s.x0, -r, r) : cx, ky = s ? cy + clamp(s.y - s.y0, -r, r) : cy; ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.arc(kx, ky, 18 * k, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillText('◀ TURN ▶', cx, cy + r + 13 * k); ctx.fillText(s ? '▲ CLIMB' : 'slide up to climb', cx, cy - r - 12 * k);
    if (!s) { ctx.globalAlpha = 0.95; ctx.font = `700 ${Math.round(15 * k)}px ${BC}`; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.strokeText('HOLD YOUR THUMB DOWN TO FLY', W / 2, H - 236 * k); ctx.fillText('HOLD YOUR THUMB DOWN TO FLY', W / 2, H - 236 * k); ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillText('lift it to brake', W / 2, H - 218 * k); } ctx.globalAlpha = 1; }
}
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) {
  const D = G.lesson, st = D.steps[D.i], x = 14, w = W - 28, y = 42 * k; ctx.save();
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; const lines = wrapText(st.how, w - 24), h = 54 * k + lines.length * 17 * k;
  ctx.fillStyle = 'rgba(0,0,0,.62)'; rrect(x, y, w, h, 12); ctx.fill(); ctx.strokeStyle = 'rgba(255,211,106,.7)'; ctx.lineWidth = 2; rrect(x, y, w, h, 12); ctx.stroke();
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#ffd36a'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillText(`LESSON ${D.i + 1} OF ${D.steps.length}`, x + 12, y + 10 * k);
  ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(18 * k)}px ${BC}`; ctx.fillText(st.title, x + 12, y + 25 * k);
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.9)'; lines.forEach((l, i) => ctx.fillText(l, x + 12, y + 48 * k + i * 17 * k));
  for (let i = 0; i < st.need; i++) { ctx.beginPath(); ctx.arc(x + w - 16 - (st.need - 1 - i) * 18 * k, y + 18 * k, 6 * k, 0, TAU); if (i < D.n) { ctx.fillStyle = '#8fe0ab'; ctx.fill(); } else { ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; ctx.stroke(); } }
  ctx.restore();
}
