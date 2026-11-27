// ===================== THE VIEW: High Wire in 3D (three.js through tools/world3d.js) =====================
// You see your walker from just behind: the wire running away ahead to the far platform, the drop beneath (a river in a red
// canyon, streets between towers, a waterfall's mist, snowfields under a pass), the level's sky. Your walker leans with the
// balance and swings the long pole; the camera rolls a little with the lean, and shakes when the wire does. Little flags on the
// wire's posts stream before a gust. The balance arc at the top shows how far over you are, red at the edge.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [];
let hint = null, V3 = null;
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 6) TXT.shift(); }
function tip(key, txt, secs = 2.8) { if (HEADLESS || !(G && G.lesson)) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 1.8);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.3) TXT.shift(); if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; } }
const ui = { drag: null };
const WY = 0;      // the wire's height (the world is built round it)
// the walker (23 Nov 2026, from his review of Vine: "do better on the animation... hands and the person holding the vines": this was the same pill on two
// sticks, its arms fixed in the air beside the pole): a person with joints (part25_human.js), in a red top, a hat on, both hands closed on the pole
function walker(T) { const g = new T.Group(), body = new T.Group(); g.add(body);
  const H = humMake(T, { top: 0xd8302a, shorts: 0x1a1a22, skin: 0xe8b890, hair: 0x1a1a22, band: 0xf2d24a }); H.g.rotation.y = Math.PI; H.g.position.y = 0.97; body.add(H.g);      // the rig faces -z; the walker walks towards +z
  const dark = new T.MeshStandardMaterial({ color: 0x1a1a22, roughness: 0.6 }), hat = new T.Mesh(new T.CylinderGeometry(0.085, 0.105, 0.11, 12), dark); hat.position.y = 0.13; H.head.add(hat); const brim = new T.Mesh(new T.CylinderGeometry(0.15, 0.15, 0.015, 14), dark); brim.position.y = 0.08; H.head.add(brim);
  for (const L of H.legs) { const tr = new T.Mesh(new T.CylinderGeometry(0.06, 0.045, 0.36, 8), dark); tr.position.y = -0.2; L.knee.add(tr); }
  const pole = new T.Group(); pole.position.set(0, 1.25, 0.25); body.add(pole); const pm = new T.Mesh(new T.CylinderGeometry(0.018, 0.018, 7, 6), new T.MeshStandardMaterial({ color: 0xc8a060, roughness: 0.5 })); pm.rotation.z = Math.PI / 2; pole.add(pm);
  for (const s of [-1, 1]) { const w = new T.Mesh(new T.SphereGeometry(0.06, 8, 6), dark); w.position.x = s * 3.5; pole.add(w); }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); g.userData = { body, legs: [], pole, H }; return g; }
function buildWorld(G) {
  if (V3 && V3.place === G.place && V3.len === G.len) return V3; const T = THREE;
  if (!V3) { if (!W3 || !W3.init({ canvas: $('gl'), fov: 62, far: 5000, near: 0.05 })) { V3 = { none: true }; return V3; } V3 = { T, S: W3.scene, items: [] }; V3.me = walker(T); V3.S.add(V3.me); }
  const V = V3, S = V.S; for (const o of V.items) S.remove(o); V.items = []; const add = o => { S.add(o); V.items.push(o); return o; };
  V.place = G.place; V.len = G.len; const P = PLACES[G.place], drop = P.h, R0 = W3.rng(G.place * 7 + 3), L = G.len;
  // the ground far below
  const tint = [[0.62, 0.32, 0.2], [0.35, 0.35, 0.38], [0.25, 0.4, 0.25], [0.88, 0.9, 0.95]][G.place];
  const land = add(W3.terrain({ size: 1600, seg: 120, x: 0, z: L / 2, height: (x, z) => -drop + Math.sin(x * 0.02) * 8 + Math.cos(z * 0.017) * 10 + Math.abs(x) * (G.place === 1 ? 0 : 0.5), colour: (x, z, h, sl) => [tint[0] * (0.8 + sl * 0.3), tint[1] * (0.8 + sl * 0.2), tint[2]], map: W3.grainTex(256, 5, 200, 50, 6) }));
  if (land.material.map) land.material.map.repeat.set(30, 30);
  if (G.place !== 1 && G.place !== 3) { const w = W3.water({ geometry: new T.PlaneGeometry(26, 1600), color: G.place === 2 ? 0x2a6a6a : 0x2a4a5a, distort: 1.4, ripple: 2, speed: 0.8, y: -drop + 2 }); w.position.set(0, -drop + 2, L / 2); V.items.push(w); }
  // the sides: towers for the city, rock walls and pillars elsewhere
  const rockM = new T.MeshStandardMaterial({ color: [0xa0583a, 0x8a8a92, 0x5a6a5a, 0x9aa0aa][G.place], roughness: 0.95, flatShading: true, map: W3.grainTex(128, 3, 190, 60, 3) });
  if (G.place === 1) { const winT = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#2a2e3a'; g.fillRect(0, 0, 64, 128); for (let y = 4; y < 128; y += 10) for (let x = 4; x < 64; x += 10) { g.fillStyle = Math.random() < 0.35 ? '#ffd890' : '#4a5a7a'; g.fillRect(x, y, 6, 6); } const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; return t; })();
    for (let i = 0; i < 60; i++) { const side = i % 2 ? 1 : -1, w = 14 + R0() * 20, h = drop + 20 + R0() * 80, m = new T.Mesh(new T.BoxGeometry(w, h, w), new T.MeshStandardMaterial({ color: 0xffffff, map: winT.clone(), roughness: 0.4 })); m.material.map.repeat.set(w / 10, h / 20); m.material.map.needsUpdate = true; m.position.set(side * (22 + R0() * 120), -drop + h / 2, -60 + R0() * (L + 160)); add(m); } }
  else for (let i = 0; i < 70; i++) { const side = i % 2 ? 1 : -1, s = 10 + R0() * 26, m = new T.Mesh(new T.DodecahedronGeometry(s, 1), rockM); m.scale.set(1, (drop + 30) / s * (0.6 + R0() * 0.5), 1); m.position.set(side * (s * 1.1 + 12 + R0() * 110), -drop + (drop + 30) * 0.4, -80 + R0() * (L + 180)); m.castShadow = m.receiveShadow = true; add(m); }
  // the two platforms and the wire
  for (const z of [-4, L + 4]) { const pl = add(new T.Mesh(new T.CylinderGeometry(3, 3.4, drop + 1, 16), rockM)); pl.position.set(0, -drop / 2 - 0.5, z); const deck = add(new T.Mesh(new T.CylinderGeometry(3.2, 3.2, 0.3, 16), new T.MeshStandardMaterial({ color: 0x6a4a2a, roughness: 0.8 }))); deck.position.set(0, -0.1, z); }
  const wire = add(new T.Mesh(new T.CylinderGeometry(0.015, 0.015, L + 8, 6), new T.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.6, roughness: 0.4 }))); wire.rotation.x = Math.PI / 2; wire.position.set(0, WY, L / 2);
  // posts with little flags (they stream before a gust) and the checkpoints
  V.flags = []; for (let z = 0; z <= L; z += 10) { const post = add(new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 1.8, 6), new T.MeshStandardMaterial({ color: 0x888888 }))); post.position.set(0.9, WY + 0.1, z); const f = add(new T.Mesh(new T.PlaneGeometry(0.5, 0.3), new T.MeshStandardMaterial({ color: G.cps.includes(z) ? 0x3ad06a : 0xffd040, side: T.DoubleSide }))); f.position.set(0.9 + 0.25, WY + 0.9, z); V.flags.push(f); }
  // birds, banners, bags, stars
  V.thing = new Map(); const birdM = new T.MeshStandardMaterial({ color: 0x2a2a30 }), starM = new T.MeshStandardMaterial({ color: 0xffd040, emissive: 0x664400, metalness: 0.4, roughness: 0.3 });
  for (const q of G.things) { let o;
    if (q.k === 'bird') { o = new T.Group(); const b = new T.Mesh(new T.SphereGeometry(0.12, 8, 6), birdM); b.scale.z = 1.5; b.position.y = 0.1; o.add(b); const h = new T.Mesh(new T.SphereGeometry(0.07, 8, 6), birdM); h.position.set(0, 0.2, 0.12); o.add(h); o.position.set(0, WY, q.s); }
    if (q.k === 'banner') { o = new T.Group(); const line = new T.Mesh(new T.CylinderGeometry(0.008, 0.008, 4, 4), birdM); line.rotation.z = Math.PI / 2; line.position.y = 1.35; o.add(line); for (let i = -4; i <= 4; i++) { const f = new T.Mesh(new T.ConeGeometry(0.12, 0.3, 3), new T.MeshStandardMaterial({ color: [0xff4a4a, 0x4a8aff, 0xffd040][(i + 9) % 3] })); f.rotation.x = Math.PI; f.position.set(i * 0.22, 1.2, 0); o.add(f); } o.position.set(0, WY, q.s); }
    if (q.k === 'bag') { o = new T.Group(); const rope = new T.Mesh(new T.CylinderGeometry(0.01, 0.01, 8, 4), birdM); rope.position.y = 4.6; o.add(rope); const bag = new T.Mesh(new T.CylinderGeometry(0.25, 0.3, 0.6, 10), new T.MeshStandardMaterial({ color: 0x9a7a4a, roughness: 0.9 })); bag.position.y = 0.9; o.add(bag); o.position.set(0, WY, q.s); }
    if (q.k === 'star') { o = new T.Mesh(new T.OctahedronGeometry(0.16, 0), starM); o.position.set(q.side * 0.85, WY + 1.25, q.s); }
    if (o) { add(o); V.thing.set(q, o); } }
  V.me.position.set(0, WY, 0); W3.setQuality(stepN); V.cam = { x: 0, y: 1.6, z: -4 }; return V;
}
function setWeather(G) { const V = V3; if (!V || V.none || V.sky === G.weather) return; V.sky = G.weather; W3.setSky(G.weather, { azim: 70 }); W3.S.onBolt = () => { if (!HEADLESS && sfx.thunder) setTimeout(() => sfx.thunder(), 300 + Math.random() * 900); }; }
const VW = new (window.THREE ? THREE.Vector3 : Object)();
function wScreen(x, y, z) { W3.cam.updateMatrixWorld(); VW.set(x, y, z); return W3.screen(VW); }
function onEvent(G, e) { const cx = W / 2, cy = H * 0.34;
  switch (e.k) {
    case 'start': say(`${PLACES[G.place].name.toUpperCase()} · ${G.len} m · ${PLACES[G.place].h} m DOWN`, cx, cy, '#fff', 18); sfx.crowd(); break;
    case 'step': sfx.step(); break;
    case 'gust': sfx.gust(); say(e.dir > 0 ? 'GUST →' : '← GUST', cx, cy + 30 * k, '#cfe6ff', 20); break;
    case 'bird': sfx.flap(); FX.shake = 4; break;
    case 'banner': if (e.hit) { sfx.thud(); say((G && G.lesson) ? 'DUCK!' : 'OUCH!', cx, cy, '#ffb4a8', 22); tip('banner', 'Pull your thumb DOWN to crouch under banners.', 3); } else sfx.whoosh(); break;
    case 'bag': sfx.thud(); FX.shake = 8; say('SANDBAG!', cx, cy, '#ffb4a8', 22); tip('bag', 'Stand still and let the sandbag swing clear, then go.', 3); break;
    case 'star': sfx.star(e.n); FX.flash = 0.25; say('★ GOT IT', cx, cy, '#ffd36a', 22); break;
    case 'cp': sfx.cp(); say('PLATFORM: SAFE HERE', cx, cy, '#9be3b5', 18); break;
    case 'danger': sfx.creak(); break;
    case 'saved': sfx.phew(); say('SAVED!', cx, cy, '#9be3b5', 26); FX.flash = 0.2; break;
    case 'fall': sfx.fall(); FX.red = 0.8; FX.shake = 16; vibe(HAP.best); say('FALLING!', cx, cy, '#ff8a7a', 30); break;
    case 'back': ui.backAt = performance.now(); say(G.lives < G.cfg.lives ? `${G.lives} ${G.lives === 1 ? 'TRY' : 'TRIES'} LEFT` : 'AGAIN', cx, cy, '#fff', 22); break;
    case 'lessonnext': if (e.first) hint = null; say(e.first ? 'FIRST, A LESSON' : 'NEXT LESSON', cx, H * 0.5, '#ffd36a', 26); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, cx, H * 0.5, '#9be3b5', 26); sfx.cp(); break;
    case 'lessonmiss': coachMiss(); break;
    case 'lessondone': say('YOU CAN WALK THE WIRE!', cx, H * 0.5, '#ffd36a', 26); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); sfx.crowd(); vibe(HAP.best); break;
    case 'lost': sfx.lose(); break;
  } }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round';
  const g = G || idleG(), V = buildWorld(g); if (V.none) { ctx.fillStyle = '#0e1824'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D wire.', W / 2, H / 2); return; }
  setWeather(g); const m = g.me, t = now, falling = g.wait > 0 && Math.abs(m.th) > g.cfg.fall * 0.95;
  const u = V.me.userData; V.me.position.set(0, WY - (falling ? 4.9 * (1.6 - g.wait) ** 2 : 0), m.s);      /* 23 Nov 2026: he falls faster and faster (it was a steady 4 m a second) */ V.me.rotation.z = -m.th * (falling ? 2 : 1); u.body.position.y += ((m.crouch ? -0.3 : 0) - u.body.position.y) * Math.min(1, dt * 10); u.pole.rotation.z = -g.in.u * 0.35;
  { const H = u.H, tilt = u.pole.rotation.z, ph = t * 7, wk = m.walking ? 1 : 0, cr = m.crouch ? 1 : 0;
    if (falling) { for (let i = 0; i < 2; i++) { const w = t * 14 + i * 2.6; humReach(H, i, (i ? 1 : -1) * 0.4, 0.55 + Math.sin(w) * 0.3, -0.1 + Math.cos(w) * 0.3); } humGrip(H, 0, dt); humLegs(H, [0.6 + Math.sin(t * 12) * 0.5, 0.9, 0.15], [-0.3 - Math.sin(t * 12) * 0.5, 0.8, 0.15]); u.pole.visible = g.wait > 1.2; }
    else { u.pole.visible = true;      // both hands on the pole, a shoulder's width apart; they go up and down with it as it tips; one foot in front of the other on the wire
      for (let i = 0; i < 2; i++) { const xb = (i ? -1 : 1) * 0.3; humReach(H, i, -xb, 1.25 - 0.97 + Math.sin(tilt) * xb - cr * 0.02, -0.25, [i ? 1 : -1, -0.6, 0.3]); } humGrip(H, 1, dt);
      const sL = Math.sin(ph) * 0.38 * wk, sR = -sL; humLegs(H, [sL + cr * 0.75, Math.max(0, -Math.cos(ph)) * 0.7 * wk + cr * 1.3 + 0.06, 0.0], [sR + cr * 0.75, Math.max(0, Math.cos(ph)) * 0.7 * wk + cr * 1.3 + 0.06, 0.0]);
      H.g.position.y = 0.97 - cr * 0.02 + Math.abs(Math.sin(ph)) * 0.015 * wk; H.g.rotation.x = cr * 0.25; H.neck.rotation.x = -0.1 - cr * 0.2; H.head.userData.band.visible = false; } }
  // things move: bags swing, birds fly off, stars spin, flags stream before a gust
  for (const [q, o] of V.thing) { if (q.k === 'bag') o.rotation.z = Math.asin(clamp((q.x || 0) / 4.6, -1, 1)), o.position.x = 0; if (q.k === 'bird') { if (q.done) { o.position.y += dt * 3; o.position.x += dt * 2; } else o.position.y = WY; } if (q.k === 'star') { o.visible = !q.done; o.rotation.y += dt * 2; } }
  const wdir = g.gustWarn ? g.gustWarn.dir : Math.sign(g.gust); for (const f of V.flags) { f.rotation.y = wdir ? -wdir * Math.PI / 2 + Math.sin(t * 20 + f.position.z) * 0.3 : Math.sin(t * 2 + f.position.z) * 0.3; }
  // the camera: just behind, rolling a little with the lean
  const C = V.cam, e = 1 - Math.exp(-dt * 5); C.z += (m.s - 5.2 - C.z) * e; C.y += ((m.crouch ? 2.0 : 2.4) - C.y) * e;
  const cam = W3.cam; cam.position.set(0.35, WY + C.y + (g.shake || 0) * (Math.random() - 0.5) * 0.08, C.z); cam.lookAt(0, WY + 0.2, m.s + 12); cam.rotation.z += -m.th * 0.18;
  if (FX.shake > 0) cam.rotation.z += (Math.random() - 0.5) * FX.shake * 0.002;
  W3.setFocus(0, 0, m.s + 10, 30); W3.render(dt);
  if (G) { const fa = falling ? clamp(1 - (g.wait - 0.1) / 0.45, 0, 1) : clamp(1 - (performance.now() - (ui.backAt || -1e9)) / 450, 0, 1); if (fa > 0.01) { ctx.fillStyle = `rgba(8,10,16,${fa})`; ctx.fillRect(0, 0, W, H); } }      // the fall is seen, then the view goes dark and opens with you back on the wire
  if (G) hud(G, t);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 0.9 ? 1 : 1 - (t2.t - 0.9) / 0.4; ctx.globalAlpha = Math.max(0, al); ctx.font = `${Math.round(t2.size * k)}px ${TF}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 22); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 22); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(15 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 19 * k, h = lines.length * lh + 16 * k, w2 = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30;
    ctx.fillStyle = 'rgba(0,0,0,.66)'; rrect(W / 2 - w2 / 2, H * 0.5 - h / 2, w2, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.5 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,60,40,${FX.red * 0.2})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); }
  // the edge of a fall: the screen darkens at the side you are tipping
  const dz = Math.abs(m.th) / g.cfg.fall; if (dz > 0.5) { const gr = ctx.createLinearGradient(m.th > 0 ? 0 : W, 0, m.th > 0 ? W * 0.5 : W * 0.5, 0); gr.addColorStop(0, `rgba(120,0,0,${(dz - 0.5) * 0.9})`); gr.addColorStop(1, 'rgba(120,0,0,0)'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); } }
let IG = null; function idleG() { if (!IG || IG.over) { IG = newGame(4, { seed: (Math.random() * 1e6) | 0 }); IG.mem = {}; } honest(IG, { react: 0.2, acc: 0.95 }, IG.mem); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function hud(G, t) { const c = G.cfg, m = G.me;
  if (G.lesson) lessonPanel(G);
  // the balance arc
  const ax = W / 2, ay = G.lesson ? H * 0.32 : 150 * k, R = 88 * k, span = 1.0; ctx.lineWidth = 10 * k; ctx.lineCap = 'butt';
  const arc = (a0, a1, col) => { ctx.strokeStyle = col; ctx.beginPath(); ctx.arc(ax, ay, R, -Math.PI / 2 + a0 * span, -Math.PI / 2 + a1 * span); ctx.stroke(); };
  arc(-1, -0.62, 'rgba(255,70,50,.8)'); arc(-0.62, -0.3, 'rgba(255,200,60,.6)'); arc(-0.3, 0.3, 'rgba(120,230,150,.55)'); arc(0.3, 0.62, 'rgba(255,200,60,.6)'); arc(0.62, 1, 'rgba(255,70,50,.8)');
  const nd = clamp(m.th / c.fall, -1.1, 1.1); ctx.strokeStyle = '#fff'; ctx.lineWidth = 4 * k; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + Math.sin(nd * span) * (R + 8 * k), ay - Math.cos(nd * span) * (R + 8 * k)); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ax, ay, 5 * k, 0, TAU); ctx.fill();
  if (!G.lesson) { ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = '#fff'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.5)'; const s1 = `${Math.round(m.s)} / ${G.len} m`; ctx.strokeText(s1, 14, 44 * k); ctx.fillText(s1, 14, 44 * k);
    const s2 = `★ ${G.got}/${c.stars}`; ctx.strokeText(s2, 14, 62 * k); ctx.fillStyle = '#ffd36a'; ctx.fillText(s2, 14, 62 * k);
    ctx.textAlign = 'right'; for (let i = 0; i < c.lives; i++) { ctx.fillStyle = i < G.lives ? '#ff6a5a' : 'rgba(255,255,255,.25)'; ctx.fillText('♥', W - 14 - i * 18 * k, 44 * k); }
    const bx = 14, bw = W - 28, by = H - 24 * k; ctx.fillStyle = 'rgba(0,0,0,.4)'; rrect(bx, by, bw, 7 * k, 3); ctx.fill(); ctx.fillStyle = '#ff6a5a'; rrect(bx, by, bw * clamp(m.s / G.len, 0, 1), 7 * k, 3); ctx.fill(); for (const cp of G.cps) { ctx.fillStyle = '#9be3b5'; ctx.fillRect(bx + bw * cp / G.len - 1, by - 3, 3, 13 * k); } }
  if (G.gustWarn) { ctx.fillStyle = '#cfe6ff'; ctx.font = `${Math.round(22 * k)}px ${TF}`; ctx.textAlign = 'center'; ctx.fillText(G.gustWarn.dir > 0 ? 'WIND →' : '← WIND', W / 2, ay + 26 * k); }
  // the thumb
  { const sb = stickBase(), d2 = ui.drag, R2 = sb.R, dx = d2 ? clamp(d2.x - sb.x, -R2, R2) : 0, dy = d2 ? clamp(d2.y - sb.y, -R2, R2) : 0; ctx.globalAlpha = d2 ? 1 : 0.55; ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.arc(sb.x, sb.y, R2, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2.5; ctx.stroke();      // the stick, always in its one place
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillText('WALK', sb.x, sb.y - R2 - 9 * k); ctx.fillText('CROUCH', sb.x, sb.y + R2 + 13 * k);
    ctx.fillStyle = m.crouch ? '#ffb030' : m.walking ? '#9be3b5' : 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(sb.x + dx, sb.y + dy, 24 * k, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
  if (false) {}
  else if ((G && G.lesson) && !G.lesson && G.t < 5) { ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillText('THUMB DOWN · SLIDE TO BALANCE · PUSH UP TO WALK', W / 2, H * 0.7); } }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { coachPanel(G); }
