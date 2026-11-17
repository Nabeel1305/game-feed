// ===================== THE VIEW: Soar in 3D (three.js through tools/world3d.js) =====================
// A sea of islands under a real sky; you, seen from just behind, arms forward, a scarf streaming; golden rings ahead; clouds to
// fly through, gulls, the sun on the water.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [];
let hint = null, V3 = null;
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 6) TXT.shift(); }
function tip(key, txt, secs = 2.8) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function fxStep(dt) {
  FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.3) TXT.shift();
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; }
}
function buildWorld() {
  if (V3) return V3; const T = THREE; if (!W3 || !W3.init({ canvas: $('gl'), fov: 66, far: 9000, near: 0.1 })) { V3 = { none: true }; return V3; }
  const S = W3.scene, R0 = W3.rng(19);
  const sea = W3.water({ size: 20000, color: 0x07404c, distort: 1.4, ripple: 0.6, speed: 0.5 });
  // the flier: a body in a flight suit, arms reaching forward, a scarf streaming behind
  const P = new T.Group(), suit = new T.MeshStandardMaterial({ color: 0x3d6f80, roughness: 0.5 }), panel = new T.MeshStandardMaterial({ color: 0xd9dfe2, roughness: 0.5 }), skin = new T.MeshStandardMaterial({ color: 0xa8714f, roughness: 0.55 }), hairM = new T.MeshStandardMaterial({ color: 0x1b1310, roughness: 0.8 });
  const cap = (r, l, m, x, y, z, rx = 0, ry = 0, rz = 0) => { const o = new T.Mesh(new T.CapsuleGeometry(r, l, 6, 12), m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.castShadow = true; P.add(o); return o; };
  cap(0.17, 0.42, suit, 0, 0, 0, Math.PI / 2);                                  // torso, lying along the flight
  cap(0.12, 0.05, panel, 0, 0.1, 0.05, Math.PI / 2).scale.set(1.25, 1, 1);      // the pack on the back
  const head = new T.Mesh(new T.SphereGeometry(0.115, 20, 14), skin); head.position.set(0, 0.07, -0.42); P.add(head);
  const hair = new T.Mesh(new T.SphereGeometry(0.122, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), hairM); hair.position.copy(head.position); hair.rotation.x = -0.9; P.add(hair);
  for (const s of [-1, 1]) { cap(0.06, 0.48, suit, s * 0.16, 0.02, -0.58, Math.PI / 2 - 0.12, 0, s * 0.06); const hand = new T.Mesh(new T.SphereGeometry(0.055, 10, 8), skin); hand.position.set(s * 0.15, 0.06, -0.9); P.add(hand);
    cap(0.075, 0.5, suit, s * 0.1, -0.02, 0.5, Math.PI / 2 + 0.05, 0, -s * 0.05); const boot = cap(0.07, 0.1, hairM, s * 0.1, -0.04, 0.82, Math.PI / 2 + 0.6); }
  const scarfG = new T.PlaneGeometry(0.14, 1.7, 1, 18); scarfG.translate(0, -0.85, 0);
  const scarf = new T.Mesh(scarfG, new T.MeshStandardMaterial({ color: 0xd8432b, roughness: 0.7, side: T.DoubleSide })); scarf.position.set(0, 0.08, -0.32); scarf.castShadow = true; P.add(scarf);
  S.add(P);
  // rings: gold, the next one glowing; a pool, re-used along the trail
  const ringG = new T.TorusGeometry(1, 0.045, 10, 56), rings = [];
  for (let i = 0; i < 6; i++) { const m = new T.Mesh(ringG, new T.MeshStandardMaterial({ color: 0xffcf5a, metalness: 0.85, roughness: 0.25, emissive: 0xffa21a, emissiveIntensity: 0.4, transparent: true })); S.add(m); rings.push(m); }
  // clouds to fly through: soft billboards
  const cc = document.createElement('canvas'); cc.width = cc.height = 128; { const g = cc.getContext('2d'); for (let i = 0; i < 26; i++) { const x = 30 + R0() * 68, y = 40 + R0() * 50, r = 14 + R0() * 26, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); } }
  const cloudTex = new T.CanvasTexture(cc), clouds = [];
  for (let i = 0; i < 46; i++) { const sp = new T.Sprite(new T.SpriteMaterial({ map: cloudTex, transparent: true, depthWrite: false, opacity: 0.9, fog: true })); const s = 60 + R0() * 120; sp.scale.set(s, s * 0.55, 1); sp.position.set((R0() - 0.5) * 3500, 150 + R0() * 120, (R0() - 0.5) * 3500 - 900); S.add(sp); clouds.push(sp); }
  // gulls: a few, wheeling
  const gullG = new T.BufferGeometry(); gullG.setAttribute('position', new T.Float32BufferAttribute([0, 0, 0, -0.5, 0.1, 0.1, -0.05, 0, 0.18, 0, 0, 0, 0.5, 0.1, 0.1, 0.05, 0, 0.18], 3)); gullG.computeVertexNormals();
  const gulls = []; for (let i = 0; i < 14; i++) { const m = new T.Mesh(gullG, new T.MeshStandardMaterial({ color: 0xf2f2ee, side: T.DoubleSide, roughness: 0.6 })); m.scale.setScalar(1.6); S.add(m); gulls.push({ m, a: R0() * 6.28, r: 30 + R0() * 60, h: 40 + R0() * 50, c: { x: (R0() - 0.5) * 800, z: -200 - R0() * 900 }, sp: 0.2 + R0() * 0.2, f: R0() * 6 }); }
  // sparkles when a ring is passed
  const NP = 240, spG = new T.BufferGeometry(); spG.setAttribute('position', new T.BufferAttribute(new Float32Array(NP * 3), 3)); spG.setAttribute('a', new T.BufferAttribute(new Float32Array(NP), 1));
  const spM = new T.ShaderMaterial({ transparent: true, depthWrite: false, blending: T.AdditiveBlending, uniforms: { px: { value: 1 } }, vertexShader: `attribute float a; uniform float px; varying float va; void main(){ va = a; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = min(px * 18.0, px * 260.0 / -mv.z); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying float va; void main(){ float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(1.0, 0.85, 0.45, va * smoothstep(0.5, 0.0, d)); }` });
  const sp = new T.Points(spG, spM); sp.frustumCulled = false; S.add(sp); const sparks = []; for (let i = 0; i < NP; i++) sparks.push({ t: 9, life: 1, x: 0, y: -999, z: 0, vx: 0, vy: 0, vz: 0 });
  V3 = { T, S, sea, P, scarf, rings, clouds, gulls, sp, sparks, land: null, look: new T.Vector3(), camPos: new T.Vector3(), sky: null };
  W3.setQuality(stepN); return V3;
}
function buildLand(G) {
  const V = V3, T = V.T, key = (G.N * 37) % 9; if (V.landKey === key) return; V.landKey = key;      // nine coasts, built once each time the coast changes
  if (V.landM) { for (const m of V.landM) { V.S.remove(m); m.geometry.dispose(); } }
  // centre the land on the trail
  const cx = 0, cz = 0;      // the trail starts here and never goes 2 km from it
  const N3 = new T.ImprovedNoise(), H = G.land;
  const colour = (x, z, h, sl) => { const n = 0.5 + 0.5 * N3.noise(x * 0.02, 1.7, z * 0.02);
    if (h < 2.5) return h < -1 ? [0.55, 0.5, 0.38] : [0.78 + 0.05 * n, 0.7 + 0.05 * n, 0.52];                // sand
    if (h > 175 + 30 * n && sl < 0.55) return [0.92, 0.93, 0.96];                                          // snow
    if (sl > 0.42) return [0.38 + 0.08 * n, 0.36 + 0.07 * n, 0.33 + 0.06 * n];                              // rock
    return [0.17 + 0.07 * n, 0.3 + 0.08 * n - h * 0.0004, 0.11 + 0.03 * n]; };                               // grass and forest floor
  const gt = W3.grainTex(256, 7, 205, 45, 2); gt.repeat.set(160, 160);
  const near = W3.terrain({ size: 4400, seg: 260, x: cx, z: cz, height: (x, z) => H(x, z), colour, map: gt });
  const far = W3.terrain({ size: 16000, seg: 120, x: cx, z: cz, height: (x, z) => { const inside = Math.abs(x - cx) < 2150 && Math.abs(z - cz) < 2150; return inside ? Math.min(H(x, z), 0) - 20 : H(x, z); }, colour, map: gt });
  // trees: dark pines on the green slopes
  const trees = [], R0 = W3.rng(G.N + 7); for (let i = 0; i < 20000 && trees.length < 1800; i++) { const x = cx + (R0() - 0.5) * 4200, z = cz + (R0() - 0.5) * 4200, h = H(x, z); if (h < 4 || h > 150) continue;
    const sl = Math.abs(H(x + 3, z) - h) + Math.abs(H(x, z + 3) - h); if (sl > 2.6 || N3.noise(x * 0.008, 4, z * 0.008) < -0.1) continue; trees.push({ x, y: h - 0.5, z, s: 1.6 + R0() * 1.8, rot: R0() * 6, hue: R0() - 0.5, shade: R0() - 0.6 }); }
  const tm = W3.pines(trees, { layers: 4 });
  V.landM = [near, far, tm];
}
function setWeather(G) {
  const V = buildWorld(); if (V.none || V.sky === G.weather) return; V.sky = G.weather;
  W3.setSky(G.weather, { azim: { dawn: 120, sunset: 200, golden: 210, dusk: 195 }[G.weather] || 170, wind: [0.4, 0.2] });
  const dim = W3.S.night ? 0.25 : W3.S.name === 'overcast' ? 0.7 : 1; for (const c of V.clouds) { c.material.color.setScalar(dim * (W3.S.name === 'sunset' || W3.S.name === 'golden' ? 1 : 1)); if (W3.S.name === 'sunset' || W3.S.name === 'golden' || W3.S.name === 'dawn') c.material.color.set(0xffd2b0); }
}
function sparkle(x, y, z, n, sp = 8) { if (!V3 || V3.none) return; let k2 = 0; for (const d of V3.sparks) { if (d.t < d.life) continue; const a = Math.random() * 6.28, b = Math.random() * 3.14, v = sp * (0.4 + Math.random());
  Object.assign(d, { t: 0, life: 0.7 + Math.random() * 0.6, x, y, z, vx: Math.cos(a) * Math.sin(b) * v, vy: Math.cos(b) * v, vz: Math.sin(a) * Math.sin(b) * v }); if (++k2 >= n) break; } }
function onEvent(G, e) {
  const cx = W / 2, cy = H * 0.3;
  switch (e.k) {
    case 'ring': { const r = G.rings[e.i]; sparkle(r.x, r.y, r.z, 26 + Math.min(30, e.chain * 3)); sfx.ring(e.chain, e.off); vibe(HAP.tick);
      if (e.off < 0.25) say('BULLSEYE', cx, cy, '#ffe9a8', 22); else if (e.chain >= 3 && e.chain % 3 === 0) say(`${e.chain} IN A ROW`, cx, cy, '#ffe9a8', 22); break; }
    case 'miss': sfx.miss(); if (!e.far) tip('miss', 'Turn early: look at the ring after the next one too', 2.8); else tip('far', 'Follow the glow back to the trail', 2.6); break;
    case 'skim': sfx.skim(e.sea); FX.shake = 6; tip('skim', 'Thumb up to climb away', 2.4); break;
    case 'lessonnext': if (e.first) hint = null; say(e.first ? 'FIRST, A LESSON' : 'NEXT LESSON', cx, H * 0.5, '#ffd36a', 26); sfx.ding(); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, cx, H * 0.5, '#9be3b5', 26); sfx.coin(e.n); break;
    case 'lessonmiss': hint = { txt: e.how, t: 0, secs: 3.6 }; break;
    case 'lessondone': say('YOU CAN FLY. NOW FOLLOW THE TRAIL!', cx, H * 0.5, '#ffd36a', 22); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); vibe(HAP.best); FX.flash = 0.5; break;
    case 'lost': sfx.lose(); break;
  }
}
const ui = { snap: false };
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#0b1418'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D sky.', W / 2, H / 2); return; }
  const T = V.T, cam = W3.cam, g = G || idleG(), f = g.f, t = now;
  buildLand(g); setWeather(g);
  // the flier
  const fw = fwdOf(f);
  V.P.position.set(f.x, f.y, f.z); V.P.rotation.set(0, 0, 0); V.P.rotateY(-f.yaw); V.P.rotateX(f.pitch); V.P.rotateZ(-f.bank * 1.1);
  V.P.position.y += Math.sin(t * 1.6) * 0.06;
  const sp = V.scarf.geometry.attributes.position; for (let i = 0; i < sp.count; i++) { const y = sp.getY(i), u = -y / 1.7; sp.setZ(i, Math.sin(t * 9 - u * 7) * 0.12 * u + Math.sin(t * 5.3 - u * 4) * 0.05 * u); sp.setX(i, (i % 2 ? 0.07 : -0.07) * (1 - u * 0.3) + Math.sin(t * 6 - u * 5) * 0.06 * u); }
  sp.needsUpdate = true; V.scarf.rotation.x = Math.PI / 2 - 0.15 + Math.sin(t * 3) * 0.04;
  // the camera: a few metres behind and above, leaning a little with the turn, looking well ahead
  const back = new T.Vector3(-Math.sin(f.yaw) * 2.5 + Math.cos(f.yaw) * 0.5, 0.62 - Math.sin(f.pitch) * 1.6, Math.cos(f.yaw) * 2.5 + Math.sin(f.yaw) * 0.5);      // over the right shoulder
  const want = new T.Vector3(f.x, f.y, f.z).add(back);
  if (ui.snap || !V.started) { V.camPos.copy(want); V.started = true; } else V.camPos.lerp(want, Math.min(1, dt * 4));
  const gr = Math.max(-0.5, g.land(V.camPos.x, V.camPos.z)) + 1.2; if (V.camPos.y < gr) V.camPos.y = gr;
  cam.position.copy(V.camPos); cam.fov = (innerWidth > innerHeight ? 58 : 70) + (f.v - 22) * 0.5; cam.updateProjectionMatrix();
  const look = new T.Vector3(f.x + fw.x * 24, f.y + fw.y * 24 + 2.2, f.z + fw.z * 24); if (ui.snap) V.look.copy(look); else V.look.lerp(look, Math.min(1, dt * 5)); ui.snap = false;
  cam.lookAt(V.look); cam.rotateZ(-f.bank * 0.35);
  if (FX.shake > 0) { cam.rotation.x += (Math.random() - 0.5) * FX.shake * 0.002; cam.rotation.y += (Math.random() - 0.5) * FX.shake * 0.002; }
  // rings: the next few along the trail
  for (let i = 0; i < V.rings.length; i++) { const m = V.rings[i], r = g.rings[g.next - 1 + i]; if (!r) { m.visible = false; continue; } m.visible = true;
    m.position.set(r.x, r.y, r.z); m.rotation.set(0, -r.yaw, 0); m.scale.setScalar(r.r * (r.done === 1 ? 1 + Math.min(1, (t % 100) * 0) : 1));
    const nextOne = g.next - 1 + i === g.next; m.material.emissiveIntensity = r.done === 1 ? 0.2 : nextOne ? 1.4 + Math.sin(t * 4) * 0.4 : 0.35; m.material.opacity = r.done ? 0.35 : nextOne ? 1 : 0.8;
    m.material.color.set(r.done === -1 ? 0x8a8a8a : 0xffcf5a); }
  // clouds drift; gulls wheel
  for (const c of V.clouds) { c.position.x += dt * 2; }
  for (const gl of V.gulls) { gl.a += dt * gl.sp; gl.m.position.set(gl.c.x + Math.cos(gl.a) * gl.r, gl.h + Math.sin(gl.a * 2) * 3, gl.c.z + Math.sin(gl.a) * gl.r); gl.m.rotation.set(0, -gl.a, Math.sin(t * 6 + gl.f) * 0.35); }
  const pa = V.sp.geometry.attributes.position, aa = V.sp.geometry.attributes.a;
  V.sparks.forEach((d0, i) => { if (d0.t < d0.life) { d0.t += dt; d0.vy -= 2 * dt; d0.x += d0.vx * dt; d0.y += d0.vy * dt; d0.z += d0.vz * dt; } pa.setXYZ(i, d0.x, d0.t < d0.life ? d0.y : -999, d0.z); aa.setX(i, d0.t < d0.life ? 1 - d0.t / d0.life : 0); });
  pa.needsUpdate = true; aa.needsUpdate = true; V.sp.material.uniforms.px.value = W3.R.getPixelRatio() * innerHeight / 844;
  W3.setFocus(f.x, f.y, f.z, 6);
  W3.render(dt);
  if (G) hud(G);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const a = t2.t < 0.9 ? 1 : 1 - (t2.t - 0.9) / 0.4; ctx.globalAlpha = Math.max(0, a); ctx.font = `700 ${Math.round(t2.size * k)}px ${BC}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 26 * k); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 26 * k); }
  ctx.globalAlpha = 1;
  if (hint) { const a = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, a); ctx.font = `700 ${Math.round(16 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 20 * k, h = lines.length * lh + 16 * k, w = Math.min(W - 24, Math.max(...lines.map(l => ctx.measureText(l).width)) + 34);
    ctx.fillStyle = 'rgba(0,0,0,.5)'; rrect(W / 2 - w / 2, H * 0.74 - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.74 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,248,230,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); }
}
let IG = null; function idleG() { if (!IG) { IG = newGame(Math.max(1, store.get('level', 1) | 0), { seed: 9 }); } const g = IG, f = g.f; f.yaw += 0.0015; f.bank = 0.12; const d = fwdOf(f); f.x += d.x * 0.25; f.z += d.z * 0.25; f.y = Math.max(f.y, g.land(f.x, f.z) + 35); return g; }
function weatherName(w) { return { dawn: 'DAWN', morning: 'MORNING', golden: 'GOLDEN HOUR', overcast: 'GREY SKY', mist: 'MIST', sunset: 'SUNSET', noon: 'MIDDAY', dusk: 'DUSK', night: 'NIGHT' }[w] || ''; }
function hud(G) {
  const c = G.cfg, x = 14, y = 44 * k;
  if (G.lesson) lessonPanel(G);
  else {
    const got = G.got, left = G.rings.length - G.next, w = W - 2 * x - 70 * k;
    ctx.fillStyle = 'rgba(0,0,0,.28)'; rrect(x, y + 4 * k, w, 8 * k, 4); ctx.fill(); ctx.fillStyle = '#ffd36a'; rrect(x, y + 4 * k, Math.max(8, w * Math.min(1, got / c.goal)), 8 * k, 4); ctx.fill();
    ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText(`${got} / ${c.goal}`, W - x, y + 8 * k);
    ctx.textAlign = 'left'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillText(`${left} rings left${G.chain >= 2 ? ` · chain ${G.chain}` : ''}`, x, y + 24 * k);
  }
  if (G.t < 3.2 && !G.lesson) { ctx.globalAlpha = Math.min(1, (3.2 - G.t) / 0.6); ctx.textAlign = 'center'; ctx.font = `700 ${Math.round(15 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.4)';
    const s = `FLIGHT ${G.N} · ${weatherName(G.weather)} · ${c.goal} OF ${c.rings} RINGS`; ctx.strokeText(s, W / 2, H * 0.2); ctx.fillText(s, W / 2, H * 0.2); ctx.globalAlpha = 1; }
  // the next ring when it is off the screen: a soft arrow at the edge pointing to it
  const r = G.rings[G.next]; if (r && V3 && !V3.none) { const p = W3.screen(new THREE.Vector3(r.x, r.y, r.z)); if (!p.front || p.x < 20 || p.x > W - 20 || p.y < 60 || p.y > H - 40) {
    let ax = p.x - W / 2, ay = p.y - H / 2; if (!p.front) { ax = -ax; ay = -ay; } const a = Math.atan2(ay, ax), ex = W / 2 + Math.cos(a) * (W / 2 - 34), ey = H / 2 + Math.sin(a) * (H / 2 - 70);
    ctx.save(); ctx.translate(ex, ey); ctx.rotate(a); ctx.fillStyle = 'rgba(255,214,110,.85)'; ctx.beginPath(); ctx.moveTo(14 * k, 0); ctx.lineTo(-8 * k, -10 * k); ctx.lineTo(-8 * k, 10 * k); ctx.closePath(); ctx.fill(); ctx.restore(); } }
  // the thumb's little stick, where it is down
  if (ui.stick) { const s = ui.stick; ctx.globalAlpha = 0.35; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(s.x0, s.y0, 46 * k, 0, TAU); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s.x0 + G.stick.x * 46 * k, s.y0 - G.stick.y * 46 * k, 13 * k, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
}
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) {
  const D = G.lesson, st = D.steps[D.i], x = 14, w = W - 28, y = 42 * k; ctx.save();
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; const lines = wrapText(st.how, w - 24), h = 54 * k + lines.length * 17 * k;
  ctx.fillStyle = 'rgba(0,0,0,.5)'; rrect(x, y, w, h, 12); ctx.fill(); ctx.strokeStyle = 'rgba(255,211,106,.7)'; ctx.lineWidth = 2; rrect(x, y, w, h, 12); ctx.stroke();
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#ffd36a'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillText(`LESSON ${D.i + 1} OF ${D.steps.length}`, x + 12, y + 10 * k);
  ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(18 * k)}px ${BC}`; ctx.fillText(st.title, x + 12, y + 25 * k);
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.9)'; lines.forEach((l, i) => ctx.fillText(l, x + 12, y + 48 * k + i * 17 * k));
  for (let i = 0; i < st.need; i++) { ctx.beginPath(); ctx.arc(x + w - 16 - (st.need - 1 - i) * 18 * k, y + 18 * k, 6 * k, 0, TAU); if (i < D.n) { ctx.fillStyle = '#8fe0ab'; ctx.fill(); } else { ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; ctx.stroke(); } }
  ctx.restore();
}
