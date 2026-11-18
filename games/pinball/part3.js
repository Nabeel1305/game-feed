// ===================== THE VIEW: Pinball in 3D (three.js through tools/world3d.js) =====================
// The table seen from where the player stands: a dark playfield painted in the level's theme, chrome rails, white rubber on
// the slingshots, three bumpers whose caps flash, drop targets that fall flat, A-B-C lanes at the top, a clear plastic ramp
// curling round, a chrome ball that reflects the room. The current mission's target blinks. The 2D layer is the backbox: the
// score, the balls, the mission and its progress, the multiplier.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { snap: true, bump: [0, 0, 0], sling: [0, 0], showScore: 0 };
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 2.8) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 140) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: 0.35 + Math.random() * 0.3, col, r: (1.2 + Math.random() * 2.2) * k }); } if (PARTS.length > 220) PARTS.splice(0, PARTS.length - 220); }
function fxStep(dt) {
  FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.4) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; }
  for (let i = 0; i < 3; i++) ui.bump[i] = Math.max(0, ui.bump[i] - dt * 5); for (let i = 0; i < 2; i++) ui.sling[i] = Math.max(0, ui.sling[i] - dt * 8);
}
const TILT = 0.12;
const P3 = (x, y, h = 0) => [x, y * TILT + h, -y];
const hex = c => '#' + c.toString(16).padStart(6, '0');
// the playfield's painting for a theme
function fieldTex(th) { const T = THREE, c = document.createElement('canvas'); c.width = 512; c.height = 940; const g = c.getContext('2d'), sx = 512 / 10, sy = 940 / 18.8, X = x => (x + 5) * sx, Y = y => 940 - y * sy;
  const gr = g.createLinearGradient(0, 0, 0, 940); gr.addColorStop(0, '#0a0618'); gr.addColorStop(0.5, '#140a2a'); gr.addColorStop(1, '#06040e'); g.fillStyle = gr; g.fillRect(0, 0, 512, 940);
  g.globalAlpha = 0.35; for (let i = 0; i < 40; i++) { g.strokeStyle = i % 2 ? hex(th.a) : hex(th.b); g.lineWidth = 1; g.beginPath(); g.arc(X(0), Y(9), 30 + i * 14, 0, TAU); g.stroke(); } g.globalAlpha = 1;
  const arrow = (x, y, ang, col) => { g.save(); g.translate(X(x), Y(y)); g.rotate(-ang); g.fillStyle = col; g.beginPath(); g.moveTo(0, -26); g.lineTo(16, 10); g.lineTo(-16, 10); g.closePath(); g.fill(); g.restore(); };
  arrow(-2.5, 9.2, 0.1, hex(th.a)); arrow(3.6, 8.6, -0.05, hex(th.b)); arrow(-3.4, 8.0, 1.4, hex(th.a));
  g.font = 'bold 34px "Barlow Condensed", sans-serif'; g.textAlign = 'center'; g.fillStyle = hex(th.b); g.globalAlpha = 0.85; g.fillText(th.name.toUpperCase(), X(0), Y(7.2)); g.globalAlpha = 1;
  g.font = 'bold 22px "Barlow Condensed", sans-serif'; g.fillStyle = '#fff'; g.fillText('RAMP', X(-2.5), Y(8.3)); g.fillText('ORBIT', X(3.45), Y(7.6));
  for (const L of LANES) { g.fillText(L.name, X(L.x), Y(14.6)); }
  g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 3; g.setLineDash([8, 8]); g.beginPath(); g.moveTo(X(-4.4), Y(3.9)); g.lineTo(X(-4.4), Y(0.3)); g.moveTo(X(3.65), Y(3.9)); g.lineTo(X(3.65), Y(0.3)); g.stroke(); g.setLineDash([]);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t; }
function buildWorld() {
  if (V3) return V3; const T = THREE; if (!W3 || !W3.init({ canvas: $('gl'), fov: 55, far: 400, near: 0.1 })) { V3 = { none: true }; return V3; }
  const S = W3.scene; S.traverse(o => { if (o.material && o.material.uniforms && o.material.uniforms.sunPosition) o.visible = false; });
  const fieldM = new T.MeshStandardMaterial({ roughness: 0.7, metalness: 0.0 }), field = new T.Mesh(new T.PlaneGeometry(10, 18.8), fieldM); field.rotation.x = -Math.PI / 2 + Math.atan(TILT); field.position.set(0, 9.4 * TILT - 0.01, -9.4 + 0.4); field.receiveShadow = true; S.add(field);
  const cab = new T.Mesh(new T.BoxGeometry(11.4, 1.6, 20.5), new T.MeshStandardMaterial({ color: 0x14101e, roughness: 0.6 })); cab.position.set(0, 9.4 * TILT - 0.85, -9.4 + 0.4); cab.rotation.x = Math.atan(TILT); S.add(cab);
  const railM = new T.MeshStandardMaterial({ color: 0xd8dce8, metalness: 0.9, roughness: 0.22, envMapIntensity: 4 }), plasM = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
  const seg = (x1, y1, x2, y2, m, h = 0.45, th = 0.12) => { const a = P3(x1, y1), b = P3(x2, y2), L = Math.hypot(x2 - x1, y2 - y1), mesh = new T.Mesh(new T.BoxGeometry(L + th, h, th), m); mesh.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + h / 2, (a[2] + b[2]) / 2); mesh.rotation.y = -Math.atan2(y2 - y1, x2 - x1) * -1; mesh.rotation.y = Math.atan2(-(b[2] - a[2]), b[0] - a[0]); mesh.castShadow = true; S.add(mesh); return mesh; };
  for (const w of walls(0)) seg(w[0], w[1], w[2], w[3], railM);
  const posts = []; for (const sx of [-4.4, 3.65]) { const p = new T.Mesh(new T.CylinderGeometry(0.1, 0.1, 0.6, 10), railM); const q = P3(sx, 5.3); p.position.set(q[0], q[1] + 0.3, q[2]); S.add(p); posts.push(p); }
  // slingshots: a coloured body with a white rubber face
  const slingM = [], th0 = THEMES[0];
  for (const sl of SLINGS) { const sh = new T.Shape(); sh.moveTo(sl.a[0], sl.a[1]); sh.lineTo(sl.b[0], sl.b[1]); sh.lineTo(sl.a[0], 4.6); sh.closePath(); const g = new T.ExtrudeGeometry(sh, { depth: 0.4, bevelEnabled: false }); g.rotateX(-Math.PI / 2); const m = new T.MeshStandardMaterial({ color: th0.a, roughness: 0.4, emissive: th0.a, emissiveIntensity: 0.2 }); const mesh = new T.Mesh(g, m); mesh.position.y = 4.8 * TILT - 0.05; S.add(mesh); slingM.push(m);
    const rub = seg(sl.a[0], sl.a[1], sl.b[0], sl.b[1], plasM, 0.35, 0.1); rub.position.y += sl.a[1] * 0; }
  // bumpers
  const bump = BUMPERS.map(bp => { const q = P3(bp.x, bp.y), grp = new T.Group(); grp.position.set(q[0], q[1], q[2]); const body = new T.Mesh(new T.CylinderGeometry(bp.r, bp.r * 1.05, 0.45, 24), new T.MeshStandardMaterial({ color: 0xf0f0f8, roughness: 0.3 })); body.position.y = 0.22; body.castShadow = true;
    const capM = new T.MeshStandardMaterial({ color: th0.b, emissive: th0.b, emissiveIntensity: 0.4, roughness: 0.3 }), cap = new T.Mesh(new T.CylinderGeometry(bp.r * 0.95, bp.r * 0.8, 0.22, 24), capM); cap.position.y = 0.55; const ring = new T.Mesh(new T.TorusGeometry(bp.r * 1.02, 0.05, 8, 24), railM); ring.rotation.x = Math.PI / 2; ring.position.y = 0.4; grp.add(body, cap, ring); S.add(grp); return { grp, capM }; });
  // drop targets
  const dropM = new T.MeshStandardMaterial({ color: th0.a, roughness: 0.4, emissive: th0.a, emissiveIntensity: 0.3 }), drops = DROPS.map(d => { const m = new T.Mesh(new T.BoxGeometry(0.16, 0.5, 0.55), dropM); const q = P3(d.x, d.y); m.position.set(q[0], q[1] + 0.25, q[2]); m.castShadow = true; S.add(m); return m; });
  // insert lights: the three lanes, the ramp, the orbit, the bumpers' and targets' mission arrows
  const lightG = new T.CircleGeometry(0.22, 20), mkLight = (x, y, col) => { const m = new T.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.25 }), mesh = new T.Mesh(lightG, m), q = P3(x, y, 0.02); mesh.position.set(q[0], q[1], q[2]); mesh.rotation.x = -Math.PI / 2 + Math.atan(TILT); S.add(mesh); return m; };
  const lanesL = LANES.map(l => mkLight(l.x, 15.0, 0xffe07a)), rampL = mkLight(-2.5, 10.3, th0.a), orbitL = mkLight(3.6, 9.9, th0.b), dropL = mkLight(-3.3, 8.0, th0.a), bumpL = mkLight(1.2, 11.6, th0.b), multL = [1, 2, 3, 4, 5].map(i => mkLight(-1.2 + i * 0.4, 5.6, 0xff6a3a));
  // the ramp: a clear plastic channel that curls up from its mouth, over the top and down to the right inlane
  const curve = new T.CatmullRomCurve3([[-2.5, 11.8], [-2.7, 15.4], [-1.2, 17.2], [1.5, 17.0], [3.3, 15.0], [3.6, 11.5], [3.2, 7.5], [2.6, 5.2]].map(([x, y], i, A) => new T.Vector3(...P3(x, y, i === 0 ? 0.2 : i === A.length - 1 ? 0.2 : 1.6))));
  const ramp = new T.Mesh(new T.TubeGeometry(curve, 80, 0.36, 10, false), new T.MeshStandardMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.28, roughness: 0.1, metalness: 0.1, side: T.DoubleSide, depthWrite: false })); S.add(ramp);
  const rampBall = new T.Mesh(new T.SphereGeometry(BR, 20, 14), railM); rampBall.visible = false; S.add(rampBall);
  // flippers
  const flM = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 }), flR = new T.MeshStandardMaterial({ color: th0.a, roughness: 0.5 });
  const flips = [-1, 1].map(side => { const sh = new T.Shape(); sh.absarc(0, 0, 0.2, Math.PI / 2, Math.PI * 1.5, false); sh.lineTo(FL, -0.11); sh.absarc(FL, 0, 0.11, -Math.PI / 2, Math.PI / 2, false); sh.closePath(); const g = new T.ExtrudeGeometry(sh, { depth: 0.36, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2 }); g.rotateX(Math.PI / 2); g.translate(0, 0.38, 0);
    const pivot = new T.Group(), q = P3(side * 2.05, 2.45); pivot.position.set(q[0], q[1], q[2]); const m = new T.Mesh(g, flM); m.castShadow = true; pivot.add(m); const band = new T.Mesh(new T.BoxGeometry(FL, 0.1, 0.05), flR); band.position.set(FL / 2, 0.2, 0); pivot.add(band); S.add(pivot); return pivot; });
  // the ball(s): chrome
  const ballM = new T.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.08, envMapIntensity: 7 }), balls = []; for (let i = 0; i < 3; i++) { const b = new T.Mesh(new T.SphereGeometry(BR, 28, 20), ballM); b.castShadow = true; b.visible = false; S.add(b); balls.push(b); }
  const plunger = new T.Mesh(new T.CylinderGeometry(0.14, 0.14, 1.2, 12), railM); plunger.rotation.x = Math.PI / 2 - Math.atan(TILT); S.add(plunger);
  // the room: soft light from above the glass, the theme's coloured glow from the sides
  const key = new T.DirectionalLight(0xffffff, 1.3); key.position.set(-3, 14, 6); key.target.position.set(0, 0, -9); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); const sc = key.shadow.camera; sc.left = -7; sc.right = 7; sc.top = 12; sc.bottom = -12; sc.near = 1; sc.far = 40; S.add(key, key.target);
  const glowA = new T.PointLight(th0.a, 18, 16, 1.6), glowB = new T.PointLight(th0.b, 18, 16, 1.6); glowA.position.set(-5, 3, -12); glowB.position.set(5, 3, -6); S.add(glowA, glowB);
  V3 = { T, S, fieldM, slingM, bump, drops, dropM, lanesL, rampL, orbitL, dropL, bumpL, multL, ramp, rampBall, curve, flips, balls, plunger, glowA, glowB, posts, theme: -1, sky: null };
  W3.setQuality(stepN); return V3;
}
function setTheme(V, i) { const th = THEMES[i]; V.theme = i; V.fieldM.map = fieldTex(th); V.fieldM.needsUpdate = true; for (const m of V.slingM) { m.color.setHex(th.a); m.emissive.setHex(th.a); } for (const b of V.bump) { b.capM.color.setHex(th.b); b.capM.emissive.setHex(th.b); } V.dropM.color.setHex(th.a); V.dropM.emissive.setHex(th.a); V.glowA.color.setHex(th.a); V.glowB.color.setHex(th.b); V.rampL.color.setHex(th.a); V.orbitL.color.setHex(th.b); }
const SV = new (window.THREE ? THREE.Vector3 : Object)();
function scr(x, y, h = 0.3) { if (!V3 || V3.none) return { x: W / 2 + x * W / 11, y: H * 0.95 - y * H / 20, front: true }; const q = P3(x, y, h); SV.set(q[0], q[1], q[2]); return W3.screen(SV); }
// ---------- events ----------
function onEvent(G, e) {
  const cx = W / 2, b = G.balls[0], p = b ? scr(b.x, b.y) : { x: cx, y: H / 2 };
  switch (e.k) {
    case 'start': say(THEMES[G.theme].name.toUpperCase(), cx, H * 0.4, hex(THEMES[G.theme].b), 26); sfx.start(); if (G.N <= 2) tip('flip', 'Hold the left side for the left flipper, the right side for the right one. Tap to launch.', 3.4); break;
    case 'launch': sfx.launch(); break;
    case 'flip': sfx.flip(e.side); break;
    case 'hit': if (e.u != null) vibe(HAP.light); break;
    case 'bumper': ui.bump[e.i] = 1; sfx.bumper(e.i); { const q = scr(BUMPERS[e.i].x, BUMPERS[e.i].y, 0.6); burst(q.x, q.y, hex(THEMES[G.theme].b), 8); say('100', q.x, q.y - 16 * k, '#fff', 14); } break;
    case 'sling': ui.sling[e.side < 0 ? 0 : 1] = 1; sfx.sling(); break;
    case 'drop': sfx.dropT(); { const d = DROPS[e.i], q = scr(d.x, d.y); say('250', q.x + 20 * k, q.y, '#fff', 15); } break;
    case 'dropsall': sfx.bank(); say('TARGETS CLEARED +1,000', cx, H * 0.45, hex(THEMES[G.theme].a), 20); break;
    case 'lane': sfx.lane(e.i); { const q = scr(LANES[e.i].x, 15.6); say(LANES[e.i].name, q.x, q.y - 18 * k, '#ffe07a', 22); } break;
    case 'ramp': sfx.ramp(); say('RAMP!', cx, H * 0.36, hex(THEMES[G.theme].a), 30); vibe(HAP.sharp); ui.rampAnim = 0; break;
    case 'rampmiss': sfx.rampMiss(); break;
    case 'orbit': sfx.orbit(); say('ORBIT!', cx, H * 0.36, hex(THEMES[G.theme].b), 28); vibe(HAP.light); break;
    case 'mission': if (G.misN > 1) say('NEXT: ' + MISSIONS[e.m].name, cx, H * 0.5, '#ffffff', 20); break;
    case 'prog': sfx.prog(e.n); break;
    case 'missiondone': sfx.mission(); FX.flash = 0.7; vibe(HAP.best); say('MISSION COMPLETE!', cx, H * 0.33, '#ffe07a', 28); say(`×${G.mult}`, cx, H * 0.39, '#ffffff', 34); break;
    case 'multiball': sfx.multi(); say('MULTIBALL!', cx, H * 0.45, '#ff6aff', 38); FX.flash = 1; break;
    case 'extraball': sfx.multi(); say('EXTRA BALL!', cx, H * 0.5, '#8fe0ab', 30); break;
    case 'saved': sfx.saved(); say('BALL SAVED', cx, H * 0.55, '#8fe0ab', 26); break;
    case 'outlane': break;
    case 'hurrylost': say('TOO SLOW: MISSION RESET', W / 2, H * 0.5, '#ffb4a8', 20); sfx.no(); break;
    case 'overheat': sfx.sizzle(); say('FLIPPER OVERHEATED!', e.side < 0 ? W * 0.27 : W * 0.73, H * 0.62, '#ff8a5a', 18); tip('heat', 'Flapping heats the flippers: they stop for a moment. Flip when the ball comes.', 3); break;
    case 'tired': tip('tired', 'Hold the ball no more than a few seconds, then shoot', 2.6); break;
    case 'drain': sfx.drain(); FX.red = 0.6; say(e.left > 0 ? `BALL LOST · ${e.left} LEFT` : 'LAST BALL GONE', cx, H * 0.55, '#ffb4a8', 24); break;
    case 'drainmulti': sfx.drain(); break;
    case 'lessonnext': if (e.first) hint = null; say('FIRST, A LESSON', cx, H * 0.4, '#ffe08a', 26); sfx.start(); break;
    case 'lessonok': say(e.need >= 10 ? `${e.n} SECONDS!` : `GOOD! ${e.n} OF ${e.need}`, cx, H * 0.46, '#9be3b5', 24); sfx.prog(e.n); break;
    case 'lessondone': say('NOW THE REAL GAME!', cx, H * 0.4, '#ffe08a', 26); sfx.mission(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.mission(); vibe(HAP.best); say('TABLE CLEARED!', cx, H * 0.33, '#ffe07a', 34); break;
    case 'lost': sfx.over(); say('GAME OVER', cx, H * 0.4, '#ffb4a8', 34); break;
  }
}
// ---------- every frame in 3D ----------
function animate(g, t, dt) {
  const V = V3, th = THEMES[g.theme];
  V.flips.forEach((pv, i) => { const f = g.fl[i]; pv.rotation.set(0, f.side < 0 ? f.a : Math.PI - f.a, 0); pv.rotation.y = f.side < 0 ? f.a : Math.PI - f.a; });
  V.balls.forEach((m, i) => { const b = g.balls[i]; m.visible = !!b; if (b) { const q = P3(b.x, b.y, BR); m.position.set(q[0], q[1], q[2]); m.rotation.x -= b.vy * dt * 2; m.rotation.z -= b.vx * dt * 2; } });
  const lane = g.balls.find(b => b.lane), pq = P3(4.62, lane ? Math.min(0.2, lane.y - 1.0) : -0.2, 0.2); V.plunger.position.set(pq[0], pq[1], pq[2]);
  V.bump.forEach((b, i) => { b.capM.emissiveIntensity = 0.35 + ui.bump[i] * 2.4; b.grp.position.y = P3(0, BUMPERS[i].y)[1] - ui.bump[i] * 0.05; });
  V.slingM.forEach((m, i) => { m.emissiveIntensity = 0.2 + ui.sling[i] * 1.5; });
  V.drops.forEach((m, i) => { const up = g.drops[i]; m.position.y += ((up ? P3(0, DROPS[i].y)[1] + 0.25 : P3(0, DROPS[i].y)[1] - 0.3) - m.position.y) * Math.min(1, dt * 20); });
  // the inserts: lit lanes stay on; the mission's target blinks; the multiplier counts up
  const blink = 0.35 + 0.6 * (Math.sin(t * 9) > 0 ? 1 : 0), mk = g.mis ? g.mis.k : '';
  V.lanesL.forEach((m, i) => { m.opacity = g.lanes[i] ? 0.95 : mk === 'lanes' ? blink * 0.7 : 0.18; });
  V.rampL.opacity = mk === 'ramp' || (mk === 'combo' && g.t - g.rampT > 10) ? blink : 0.18; V.orbitL.opacity = mk === 'orbit' || (mk === 'combo' && g.t - g.rampT <= 10) ? blink : 0.18; V.dropL.opacity = mk === 'drops' ? blink : 0.18; V.bumpL.opacity = mk === 'bumpers' ? blink : 0.18;
  V.multL.forEach((m, i) => { m.opacity = i < g.mult - 1 ? 0.95 : 0.15; });
  // a light runs up the ramp when it is made
  if (ui.rampAnim != null) { ui.rampAnim += dt / 0.6; if (ui.rampAnim < 1) { V.rampBall.visible = true; V.rampBall.position.copy(V.curve.getPoint(ui.rampAnim)); } else { V.rampBall.visible = false; ui.rampAnim = null; } }
  V.glowA.intensity = 14 + 8 * Math.sin(t * 1.3) + FX.flash * 40; V.glowB.intensity = 14 + 8 * Math.cos(t * 1.1) + FX.flash * 40;
}
function placeCam(g, dt) { const cam = W3.cam, asp = innerWidth / innerHeight; cam.fov = asp < 0.75 ? 58 : 44; cam.aspect = asp; cam.updateProjectionMatrix();
  const sh = FX.shake ? (Math.random() - 0.5) * FX.shake * 0.01 : 0, d = asp < 0.75 ? 1 : 0.8; cam.position.set(sh, 15.5 * d + 0.5, 4.2 * d); cam.lookAt(0, 0.6, -8.4); cam.updateMatrixWorld(); }
let IG = null; function idleG() { if (!IG || IG.over) { IG = newGame(Math.max(2, store.get('level', 1) | 0), { seed: (Math.random() * 1e6) | 0 }); IG.mem = {}; } honest(IG, { react: 0.2, acc: 0.95 }, IG.mem); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#120a24'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D table.', W / 2, H / 2); return; }
  const g = G || idleG(), t = now;
  if (!V.sky) { V.sky = 1; W3.setSky('noon', {}); W3.scene.background = new THREE.Color(0x07040e); W3.scene.fog.near = 60; W3.scene.fog.far = 200; W3.S.hemiI = 0.35; W3.sun.intensity = 0.3; W3.S.exposure = 0.8; W3.scene.environmentIntensity = 0.18; }
  if (V.theme !== g.theme) setTheme(V, g.theme);
  placeCam(g, dt); animate(g, t, dt); W3.setFocus(0, 1, -9, 12); W3.render(dt);
  if (G) hud(G, t);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 1.0 ? 1 : 1 - (t2.t - 1.0) / 0.4; ctx.globalAlpha = Math.max(0, al); const sc = t2.t < 0.1 ? 1.4 - t2.t * 4 : 1; ctx.font = `800 ${Math.round(t2.size * k * sc)}px ${BC}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(10,4,20,.7)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 18); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 18); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30;
    ctx.fillStyle = 'rgba(20,10,36,.88)'; rrect(W / 2 - w / 2, H * 0.6 - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.6 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,40,60,${FX.red * 0.15})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,240,255,${FX.flash * 0.22})`; ctx.fillRect(0, 0, W, H); }
}
// ---------- the backbox (2D) ----------
function hud(G, t) {
  const th = THEMES[G.theme]; ctx.textBaseline = 'middle';
  if (!G.lesson) { const x = 12, y = 46 * k, w = W - 24, h = 66 * k; ctx.fillStyle = 'rgba(10,4,20,.82)'; rrect(x, y, w, h, 12); ctx.fill(); ctx.strokeStyle = hex(th.a); ctx.globalAlpha = 0.6; ctx.lineWidth = 1.5; rrect(x, y, w, h, 12); ctx.stroke(); ctx.globalAlpha = 1;
    ui.showScore += (G.score - ui.showScore) * 0.25; if (Math.abs(G.score - ui.showScore) < 5) ui.showScore = G.score;
    ctx.textAlign = 'left'; ctx.font = `800 ${Math.round(24 * k)}px ${BC}`; ctx.fillStyle = '#ffb04a'; ctx.fillText(Math.round(ui.showScore).toLocaleString(), x + 12, y + 18 * k);
    ctx.textAlign = 'right'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = '#fff'; ctx.fillText(`${'●'.repeat(Math.max(0, G.left))}${'○'.repeat(Math.max(0, G.cfg.balls - G.left))}  ×${G.mult}`, x + w - 12, y + 14 * k);
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillText(`missions ${G.done} / ${G.cfg.goal}`, x + w - 12, y + 30 * k);
    if (G.mis) { const M = MISSIONS[G.mis.k]; ctx.textAlign = 'left'; ctx.font = `800 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = hex(th.b); ctx.fillText(`MISSION: ${M.name}`, x + 12, y + 41 * k); ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillText(M.how, x + 12, y + 55 * k);
      const bw = 80 * k, bx = x + w - 12 - bw, by = y + 50 * k; ctx.fillStyle = 'rgba(255,255,255,.15)'; rrect(bx, by, bw, 7 * k, 3.5 * k); ctx.fill(); ctx.fillStyle = hex(th.b); rrect(bx, by, bw * Math.min(1, G.mis.n / G.mis.need), 7 * k, 3.5 * k); ctx.fill(); ctx.textAlign = 'right'; ctx.fillStyle = '#fff'; ctx.fillText(`${G.mis.n}/${G.mis.need}`, bx - 6, by + 3.5 * k); }
    if (G.saveT > 0 && G.inPlay > 0) { ctx.textAlign = 'center'; ctx.font = `800 ${Math.round(11 * k)}px ${BC}`; ctx.fillStyle = Math.sin(t * 8) > 0 ? '#8fe0ab' : 'rgba(143,224,171,.4)'; ctx.fillText('BALL SAVER ON', W / 2, y + h + 12 * k); }
  } else lessonPanel(G);
  if (G.balls.some(b => b.lane && b.y < 1)) { ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 5); ctx.textAlign = 'center'; ctx.font = `800 ${Math.round(16 * k)}px ${BC}`; ctx.fillStyle = '#fff'; ctx.fillText('TAP TO LAUNCH', W / 2, H * 0.7); ctx.globalAlpha = 1; }
  // the two halves of the screen (faint), lit while held
  if (G.N <= 3 || G.fl.some(f => f.up)) for (const f of G.fl) { const x0 = f.side < 0 ? 0 : W / 2; ctx.fillStyle = f.up ? 'rgba(255,255,255,.08)' : G.N <= 3 ? 'rgba(255,255,255,.03)' : 'rgba(0,0,0,0)'; ctx.fillRect(x0, H - 120 * k, W / 2, 120 * k); }
}
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) {
  const D = G.lesson, st = D.steps[D.i], x = 12, w = W - 24, y = 46 * k; ctx.save();
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; const lines = wrapText(st.how, w - 24), h = 50 * k + lines.length * 17 * k;
  ctx.fillStyle = 'rgba(10,4,20,.88)'; rrect(x, y, w, h, 12); ctx.fill(); ctx.strokeStyle = 'rgba(255,58,176,.7)'; ctx.lineWidth = 2; rrect(x, y, w, h, 12); ctx.stroke();
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#ff9ad8'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillText(`LESSON ${G.N} OF 3 · ${D.n} OF ${st.need}`, x + 12, y + 9 * k);
  ctx.fillStyle = '#fff'; ctx.font = `800 ${Math.round(17 * k)}px ${BC}`; ctx.fillText(st.title, x + 12, y + 23 * k);
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.92)'; lines.forEach((l, i) => ctx.fillText(l, x + 12, y + 46 * k + i * 17 * k));
  ctx.restore(); ctx.textBaseline = 'middle';
}
