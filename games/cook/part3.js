// ===================== THE VIEW: Short Order in 3D (three.js through tools/world3d.js) =====================
// A diner kitchen from where the cook stands: a steel counter, a black glass stove with cast-iron pans, a wooden board and knife,
// a white plate, the trays of food in front, the pass with its heat lamps, and a window onto the street (weather and light of
// the level). Counter top at y = 0.9; you look down at it.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [];
let hint = null, V3 = null;
const TOP = 0.9;
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 6) TXT.shift(); }
function tip(key, txt, secs = 2.8) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function fxStep(dt) {
  FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 1.8);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.3) TXT.shift();
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; }
}
// where things are on the counter (x across, z toward you)
function spots(G) { const n = G ? G.pans.length : 2, pans = []; for (let i = 0; i < n; i++) pans.push({ x: (i - (n - 1) / 2) * 0.27, z: -0.42 }); return { pans, board: { x: 0.2, z: -0.13 }, plate: { x: -0.1, z: -0.13 }, bin: { x: -0.33, z: -0.15 }, pass: { x: 0, z: -0.72 },
  tray: TRAY.map((f, i) => ({ food: f, x: ((i % 5) - 2) * 0.145, z: 0.08 + Math.floor(i / 5) * 0.125 })) }; }
function buildWorld() {
  if (V3) return V3; const T = THREE; if (!W3 || !W3.init({ canvas: $('gl'), fov: 60, far: 3000, near: 0.02 })) { V3 = { none: true }; return V3; }
  const S = W3.scene, R0 = W3.rng(8);
  const steel = new T.MeshStandardMaterial({ color: 0x9da3a9, metalness: 0.8, roughness: 0.4, envMapIntensity: 0.55, map: W3.grainTex(128, 3, 230, 18, 6) });
  const counter = new T.Mesh(new T.BoxGeometry(1.8, 0.06, 1.3), steel); counter.position.set(0, TOP - 0.03, -0.25); counter.receiveShadow = true; S.add(counter);
  const glass = new T.Mesh(new T.BoxGeometry(0.95, 0.012, 0.32), new T.MeshStandardMaterial({ color: 0x090a0c, metalness: 0.2, roughness: 0.08 })); glass.position.set(0, TOP + 0.006, -0.42); S.add(glass);
  // the back wall: white tiles, with a window onto the street
  const tc = document.createElement('canvas'); tc.width = 256; tc.height = 128; { const g = tc.getContext('2d'); g.fillStyle = '#c9c6bd'; g.fillRect(0, 0, 256, 128); for (let y = 0; y < 128; y += 16) for (let x = (y / 16 % 2) * 16; x < 256; x += 32) { g.fillStyle = `hsl(45,${10 + R0() * 6}%,${90 + R0() * 6}%)`; g.fillRect(x + 1, y + 1, 30, 14); } }
  const tt = new T.CanvasTexture(tc); tt.colorSpace = T.SRGBColorSpace; tt.wrapS = tt.wrapT = T.RepeatWrapping; tt.repeat.set(3, 4); const tileM = new T.MeshStandardMaterial({ map: tt, roughness: 0.3 });
  const wall = (w, h, x, y) => { const m = new T.Mesh(new T.BoxGeometry(w, h, 0.05), tileM); m.position.set(x, y, -1.05); S.add(m); };
  wall(3, 0.12, 0, TOP + 0.06); wall(3, 2, 0, TOP + 1.7); wall(0.9, 0.58, -1.05, TOP + 0.41); wall(0.9, 0.58, 1.05, TOP + 0.41);
  const frame = new T.Mesh(new T.BoxGeometry(1.24, 0.04, 0.08), steel); frame.position.set(0, TOP + 0.7, -1.04); S.add(frame); const fr2 = frame.clone(); fr2.position.y = TOP + 0.12; S.add(fr2);
  // the street outside: a few buildings across the road (the sky is the real one)
  const bm = new T.MeshStandardMaterial({ color: 0x7a6a5c, roughness: 0.9 }); for (let i = 0; i < 6; i++) { const b = new T.Mesh(new T.BoxGeometry(6 + R0() * 4, 8 + R0() * 14, 4), bm); b.position.set(-14 + i * 6, 0, -30); S.add(b); }
  const street = new T.Mesh(new T.PlaneGeometry(80, 40), new T.MeshStandardMaterial({ color: 0x3a3b3d, roughness: 0.4 })); street.rotation.x = -Math.PI / 2; street.position.set(0, -0.1, -20); S.add(street);
  // the pass: a steel shelf with heat lamps glowing over it
  const shelf = new T.Mesh(new T.BoxGeometry(1.1, 0.03, 0.22), steel); shelf.position.set(0, TOP + 0.22, -0.74); S.add(shelf);
  const lampM = new T.MeshStandardMaterial({ color: 0x5a1a08, emissive: 0xff6a20, emissiveIntensity: 2 }); const shadeM = new T.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 0.9, roughness: 0.3, side: T.DoubleSide }); for (const x of [-0.35, 0, 0.35]) { const rod = new T.Mesh(new T.CylinderGeometry(0.006, 0.006, 0.6, 6), shadeM); rod.position.set(x, TOP + 0.85, -0.8); const sh = new T.Mesh(new T.CylinderGeometry(0.018, 0.05, 0.045, 18, 1, true), shadeM); sh.position.set(x, TOP + 0.6, -0.86); const l = new T.Mesh(new T.SphereGeometry(0.018, 14, 8), lampM); l.position.set(x, TOP + 0.58, -0.86); rod.position.z = -0.86; rod.position.y = TOP + 0.92; S.add(rod, sh, l); }
  const passL = new T.PointLight(0xff9a50, 2.5, 1.5, 1.5); passL.position.set(0, TOP + 0.55, -0.74); S.add(passL);
  const kitL = new T.PointLight(0xfff0dc, 3.5, 4, 1.4); kitL.position.set(0.3, TOP + 1.3, 0.2); kitL.castShadow = true; S.add(kitL);
  // burners, pans, board, knife, plate, bin
  const burnM = new T.MeshStandardMaterial({ color: 0x220400, emissive: 0xff3a10, emissiveIntensity: 0.9, transparent: true, opacity: 0.85 });
  const ironM = new T.MeshStandardMaterial({ color: 0x1c1d20, metalness: 0.5, roughness: 0.45 }), woodM = new T.MeshStandardMaterial({ color: 0xa47a4c, roughness: 0.75, map: W3.grainTex(128, 15, 180, 50, 4) });
  const pans = [], burners = []; for (let i = 0; i < 3; i++) { const g = new T.Group(); const pan = new T.Mesh(new T.CylinderGeometry(0.11, 0.095, 0.035, 28, 1, true), ironM); pan.position.y = 0.0175; const base = new T.Mesh(new T.CircleGeometry(0.095, 28), ironM); base.rotation.x = -Math.PI / 2; base.position.y = 0.004;
    const h = new T.Mesh(new T.BoxGeometry(0.03, 0.015, 0.16), ironM); h.position.set(0, 0.03, 0.19); g.add(pan, base, h); g.traverse(o => o.castShadow = true); S.add(g); pans.push(g);
    const r = new T.Mesh(new T.RingGeometry(0.06, 0.1, 32), burnM); r.rotation.x = -Math.PI / 2; S.add(r); burners.push(r); }
  const board = new T.Mesh(new T.BoxGeometry(0.3, 0.025, 0.2), woodM); board.castShadow = board.receiveShadow = true; S.add(board);
  const knife = new T.Group(); { const blade = new T.Mesh(new T.BoxGeometry(0.17, 0.003, 0.035), new T.MeshStandardMaterial({ color: 0xdfe3e8, metalness: 1, roughness: 0.15 })); blade.position.x = -0.085; const hd = new T.Mesh(new T.BoxGeometry(0.1, 0.016, 0.022), new T.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5 })); hd.position.x = 0.05; knife.add(blade, hd); knife.traverse(o => o.castShadow = true); S.add(knife); }
  const plate = new T.Mesh(new T.LatheGeometry([[0, 0], [0.09, 0], [0.11, 0.008], [0.125, 0.016], [0.128, 0.015]].map(p => new T.Vector2(p[0], p[1])), 40), new T.MeshStandardMaterial({ color: 0xf6f4ee, roughness: 0.22, side: T.DoubleSide })); plate.castShadow = plate.receiveShadow = true; { const rim = new T.Mesh(new T.RingGeometry(0.112, 0.12, 40), new T.MeshStandardMaterial({ color: 0x2f7a5a, roughness: 0.3 })); rim.rotation.x = -Math.PI / 2; rim.position.y = 0.0105; plate.add(rim); const mat = new T.Mesh(new T.CircleGeometry(0.155, 36), new T.MeshStandardMaterial({ color: 0x24201c, roughness: 0.95 })); mat.rotation.x = -Math.PI / 2; mat.position.y = -0.003; mat.receiveShadow = true; plate.add(mat); } S.add(plate);
  const bin = new T.Mesh(new T.CylinderGeometry(0.075, 0.065, 0.05, 24, 1, true), new T.MeshStandardMaterial({ color: 0x4a4e52, metalness: 0.6, roughness: 0.4, side: T.DoubleSide })); S.add(bin);
  const trays = TRAY.map(() => { const m = new T.Mesh(new T.BoxGeometry(0.13, 0.03, 0.105), steel); m.receiveShadow = true; S.add(m); return m; });
  // steam
  const NP = 120, pG = new T.BufferGeometry(); pG.setAttribute('position', new T.BufferAttribute(new Float32Array(NP * 3), 3)); pG.setAttribute('a', new T.BufferAttribute(new Float32Array(NP), 1));
  const pM = new T.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { px: { value: 1 } }, vertexShader: `attribute float a; uniform float px; varying float va; void main(){ va = a; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = min(px * 60.0, px * 7.0 / -mv.z); gl_Position = projectionMatrix * mv; }`, fragmentShader: `varying float va; void main(){ float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(1.0, 1.0, 1.0, va * 0.35 * smoothstep(0.5, 0.0, d)); }` });
  const steam = new T.Points(pG, pM); steam.frustumCulled = false; S.add(steam); const puffs = []; for (let i = 0; i < NP; i++) puffs.push({ t: 9, life: 1, x: 0, y: -9, z: 0 });
  V3 = { T, S, pans, burners, board, knife, plate, bin, trays, steam, puffs, foods: new Map(), sky: null, chopA: 0 };
  W3.setQuality(stepN); return V3;
}
// food: a little model for each kind; cooked things change colour with how done the side you can see is
const RAWC = { patty: [0.62, 0.27, 0.27], steak: [0.55, 0.2, 0.2], salmon: [0.96, 0.55, 0.45], pancake: [0.96, 0.88, 0.66], egg: [0.98, 0.98, 0.95] };
const GOLDC = { patty: [0.42, 0.24, 0.12], steak: [0.36, 0.2, 0.11], salmon: [0.86, 0.55, 0.28], pancake: [0.82, 0.55, 0.22], egg: [1, 0.97, 0.9] };
function foodMesh(food, chopped) {
  const T = THREE, g = new T.Group(), M = c => new T.MeshStandardMaterial({ color: new T.Color(...(Array.isArray(c) ? c : [0, 0, 0])), roughness: 0.55 }), add = (geo, mat, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.castShadow = true; g.add(m); return m; };
  const R0 = Math.random;
  if (food === 'patty') add(new T.CylinderGeometry(0.048, 0.05, 0.018, 20), M(RAWC.patty), 0, 0.009);
  if (food === 'steak') add(new T.SphereGeometry(0.06, 20, 10), M(RAWC.steak), 0, 0.012, 0, 1.15, 0.22, 0.8);
  if (food === 'salmon') add(new T.BoxGeometry(0.11, 0.024, 0.055), M(RAWC.salmon), 0, 0.012);
  if (food === 'pancake') add(new T.CylinderGeometry(0.058, 0.06, 0.012, 28), M(RAWC.pancake), 0, 0.006);
  if (food === 'egg') { add(new T.CylinderGeometry(0.052, 0.055, 0.006, 24), M(RAWC.egg), 0, 0.003, 0, 1, 1, 0.85); add(new T.SphereGeometry(0.018, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshStandardMaterial({ color: 0xffb21a, roughness: 0.2 }), 0.008, 0.005, 0.004); }
  if (food === 'bun') { add(new T.SphereGeometry(0.055, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), M([0.82, 0.55, 0.25]), 0, 0.012, 0, 1, 0.55, 1); add(new T.CylinderGeometry(0.055, 0.055, 0.014, 20), M([0.9, 0.75, 0.5]), 0, 0.007); }
  if (food === 'toast') add(new T.BoxGeometry(0.09, 0.012, 0.09), M([0.8, 0.58, 0.3]), 0, 0.006);
  if (food === 'lettuce') { if (!chopped) for (let i = 0; i < 5; i++) add(new T.SphereGeometry(0.03, 10, 6), M([0.35 + R0() * 0.1, 0.62, 0.22]), (R0() - 0.5) * 0.04, 0.02, (R0() - 0.5) * 0.04, 1.3, 0.5, 1); else for (let i = 0; i < 14; i++) add(new T.BoxGeometry(0.03, 0.004, 0.008), M([0.4, 0.66, 0.24]), (R0() - 0.5) * 0.07, 0.004 + R0() * 0.008, (R0() - 0.5) * 0.06); }
  if (food === 'tomato') { if (!chopped) add(new T.SphereGeometry(0.032, 18, 12), M([0.85, 0.12, 0.08]), 0, 0.03); else for (let i = 0; i < 4; i++) add(new T.CylinderGeometry(0.03, 0.03, 0.006, 16), M([0.88, 0.2, 0.12]), (i - 1.5) * 0.022, 0.004, 0); }
  if (food === 'onion') { if (!chopped) add(new T.SphereGeometry(0.03, 18, 12), M([0.8, 0.66, 0.75]), 0, 0.03); else for (let i = 0; i < 4; i++) add(new T.TorusGeometry(0.022 - i * 0.004, 0.003, 6, 18), M([0.95, 0.9, 0.92]), (i - 1.5) * 0.015, 0.004, 0).rotation.x = Math.PI / 2; }
  return g;
}
function shade(m, food, s) { const a = RAWC[food], b = GOLDC[food]; if (!a) return; const c = s < 1 ? a.map((v, i) => v + (b[i] - v) * Math.min(1, s / 0.95)) : b.map(v => v * Math.max(0.12, 1 - (s - 1.05) * 2.4)); m.traverse(o => { if (o.isMesh && o.material.color && !(food === 'egg' && o.geometry.type === 'SphereGeometry')) o.material.color.setRGB(c[0], c[1], c[2]); }); }
function setWeather(G) {
  const V = buildWorld(); if (V.none || V.sky === G.weather) return; V.sky = G.weather;
  W3.setSky(G.weather, { azim: 180 }); W3.S.exposure *= 0.72; W3.scene.environmentIntensity = 0.45;      // indoors: the window is bright, the kitchen is not W3.scene.children.forEach(o => { if (o.isLineSegments) o.visible = false; });      // no rain falls indoors
  W3.S.onBolt = () => { if (!HEADLESS && sfx.thunder) setTimeout(() => sfx.thunder(), 300 + Math.random() * 900); };
}
function puff(x, z, n) { if (!V3 || V3.none) return; let k2 = 0; for (const p of V3.puffs) { if (p.t < p.life) continue; Object.assign(p, { t: 0, life: 0.9 + Math.random() * 0.8, x: x + (Math.random() - 0.5) * 0.12, y: TOP + 0.03, z: z + (Math.random() - 0.5) * 0.12 }); if (++k2 >= n) break; } }
const ui = { drag: null, snap: false };
function onEvent(G, e) {
  const cx = W / 2, cy = H * 0.42;
  switch (e.k) {
    case 'ticket': sfx.ticket(); break;
    case 'sizzle': sfx.drop(); break;
    case 'onboard': sfx.thunk(); break;
    case 'plated': sfx.plate(); if (e.q === 'perfect') say('PERFECT!', cx, cy, '#ffe08a', 22); else if (e.q === 'raw') say('STILL RAW!', cx, cy, '#ffb4a8', 22); else if (e.q === 'burnt') say('BURNT!', cx, cy, '#ffb4a8', 22); break;
    case 'flip': sfx.flip(); vibe(HAP.tick); if (e.side < G.cfg.gold[0]) say('FLIPPED TOO SOON', cx, cy, '#ffd0c4', 18); break;
    case 'noflip': say('EGGS STAY SUNNY SIDE UP', cx, cy, '#ffd0c4', 18); break;
    case 'chop': sfx.chop(e.n); if (V3 && !V3.none) V3.chopA = 1; break;
    case 'golden': sfx.ding2(); break;
    case 'burnt': sfx.burn(); FX.red = 0.3; tip('burnt', 'Flip when it turns golden, before it goes black', 2.6); break;
    case 'refuse': sfx.no(); say({ notpan: 'THAT DOES NOT GO IN A PAN', panfull: 'THAT PAN IS BUSY', notboard: 'NOTHING TO CHOP THERE', boardfull: 'CLEAR THE BOARD FIRST', notplate: 'COOK OR CHOP IT FIRST', notchopped: 'CHOP IT FIRST', noorder: 'NO ORDER YET' }[e.why] || 'NO', cx, cy, '#ffd0c4', 18); break;
    case 'bin': sfx.bin(); break;
    case 'served': sfx.bell(); FX.flash = 0.4; vibe(HAP.best); say(e.perfect ? `${e.name.toUpperCase()}: PERFECT!` : `${e.name.toUpperCase()} SERVED`, cx, H * 0.3, e.perfect ? '#ffe08a' : '#9be3b5', 24); if (e.fast) say('+ QUICK TIP', cx, H * 0.3 + 30 * k, '#9be3b5', 18); break;
    case 'sendback': sfx.no(); FX.red = 0.4; say(e.why === 'wrong' ? 'WRONG ORDER: SENT BACK' : e.why === 'raw' ? 'RAW: SENT BACK' : 'BURNT: SENT BACK', cx, H * 0.3, '#ffb4a8', 22); tip('send_' + e.why, e.why === 'wrong' ? 'Serve the OLDEST ticket (on the left): everything on it, nothing else' : 'Golden both sides before it goes on the plate', 3); break;
    case 'walkout': sfx.walk(); FX.red = 0.5; say('A CUSTOMER WALKED OUT', cx, H * 0.3, '#ffb4a8', 22); break;
    case 'lessonnext': if (e.first) hint = null; say(e.first ? 'FIRST, A LESSON' : 'NEXT LESSON', cx, H * 0.5, '#ffd36a', 26); sfx.ding(); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, cx, H * 0.5, '#9be3b5', 26); sfx.coin(e.n); break;
    case 'lessonmiss': hint = { txt: e.how, t: 0, secs: 3.6 }; break;
    case 'lessondone': say('THE KITCHEN IS YOURS!', cx, H * 0.5, '#ffd36a', 26); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); vibe(HAP.best); break;
    case 'lost': sfx.lose(); break;
  }
}
function place(m, x, z, y = TOP) { m.position.set(x, y, z); }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#0b1418'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D kitchen.', W / 2, H / 2); return; }
  const T = V.T, cam = W3.cam, g = G || idleG(), t = now, sp = spots(g); setWeather(g);
  const asp = innerWidth / innerHeight; /* 22 Nov 2026 (the audit): on a phone the camera looks more nearly straight down, so the hob, the board and the food fill the screen instead of a dark wall above and glare below */
  if (asp < 0.6) { cam.position.set(0, TOP + 1.5, 0.2); cam.fov = 60; cam.updateProjectionMatrix(); cam.lookAt(0, TOP + 0.02, -0.34); } else { cam.position.set(0, TOP + 0.95, 0.62); cam.fov = 50; cam.updateProjectionMatrix(); cam.lookAt(0, TOP + 0.02, -0.4); }
  if (FX.shake > 0) cam.rotation.z += (Math.random() - 0.5) * FX.shake * 0.002;
  // stations
  V.pans.forEach((p, i) => { const s = sp.pans[i]; p.visible = V.burners[i].visible = !!s; if (s) { place(p, s.x, s.z); place(V.burners[i], s.x, s.z, TOP + 0.013); V.burners[i].material.opacity = 0.6 + Math.sin(t * 7 + i) * 0.1; } });
  place(V.board, sp.board.x, sp.board.z, TOP + 0.012); place(V.plate, sp.plate.x, sp.plate.z, TOP + 0.004); place(V.bin, sp.bin.x, sp.bin.z, TOP + 0.025);
  V.chopA = Math.max(0, V.chopA - dt * 6); V.knife.position.set(sp.board.x + 0.05, TOP + 0.03 + V.chopA * 0.06, sp.board.z + 0.12 - V.chopA * 0.1); V.knife.rotation.set(0, 0.3, 0);
  V.trays.forEach((m, i) => place(m, sp.tray[i].x, sp.tray[i].z, TOP + 0.015));
  // the food: what is where, with each piece kept as one model while it stays put
  const want = new Map(), key = (k2, food, ch) => k2 + ':' + food + ':' + (ch ? 1 : 0), put = (k2, food, ch, x, z, y) => { const id = key(k2, food, ch); let m = V.foods.get(id); if (!m) { m = foodMesh(food, ch); V.S.add(m); V.foods.set(id, m); } want.set(id, m); m.position.set(x, y, z); return m; };
  sp.tray.forEach((s2, i) => { const m = put('tray' + i, s2.food, false, s2.x, s2.z, TOP + 0.03); m.rotation.y = i; });
  g.pans.forEach((p, i) => { if (!p || !sp.pans[i]) return; const s = sp.pans[i], m = put('pan' + i, p.food, false, s.x, s.z, TOP + 0.012); const flipT = p.flipT = Math.max(0, (p.flipT || 0) - dt); shade(m, p.food, p.sides[1 - p.down]); m.rotation.x = 0; if (Math.random() < dt * 4) puff(s.x, s.z, 1); });
  if (g.board) { const m = put('board', g.board.food, g.board.chops >= FOOD[g.board.food].chops, sp.board.x, sp.board.z, TOP + 0.025); }
  g.plate.forEach((p, i) => { const m = put('plate' + i, p.food, FOOD[p.food].to === 'board', sp.plate.x + Math.sin(i * 2.4) * 0.03 * (i ? 1 : 0), sp.plate.z + Math.cos(i * 2.4) * 0.03 * (i ? 1 : 0), TOP + 0.012 + i * 0.012); if (RAWC[p.food]) shade(m, p.food, p.q === 'burnt' ? 1.6 : p.q === 'raw' ? 0.4 : 0.95); });
  for (const [id, m] of V.foods) if (!want.has(id)) { V.S.remove(m); V.foods.delete(id); }
  const pa = V.steam.geometry.attributes.position, aa = V.steam.geometry.attributes.a; V.puffs.forEach((p, i) => { if (p.t < p.life) { p.t += dt; p.y += dt * 0.12; p.x += Math.sin(t + i) * dt * 0.02; } pa.setXYZ(i, p.x, p.t < p.life ? p.y : -9, p.z); aa.setX(i, p.t < p.life ? Math.sin(p.t / p.life * Math.PI) : 0); }); pa.needsUpdate = aa.needsUpdate = true; V.steam.material.uniforms.px.value = W3.R.getPixelRatio() * innerHeight / 844;
  W3.setFocus(0, TOP, -0.2, 0.8);
  W3.render(dt);
  if (G) hud(G, sp);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 0.9 ? 1 : 1 - (t2.t - 0.9) / 0.4; ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(t2.size * k)}px ${BC}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 26 * k); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 26 * k); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(15 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 19 * k, h = lines.length * lh + 16 * k, w = Math.min(W - 24, Math.max(...lines.map(l => ctx.measureText(l).width)) + 34);
    ctx.fillStyle = 'rgba(0,0,0,.66)'; rrect(W / 2 - w / 2, H * 0.5 - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.5 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,60,40,${FX.red * 0.18})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,248,230,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); }
}
let IG = null; function idleG() { if (!IG) { IG = newGame(Math.max(1, store.get('level', 1) | 0), { seed: 1 }); take(IG, 'pancake', 'pan', 0); take(IG, 'patty', 'pan', 1); } IG.pans.forEach(p => { if (p) { p.sides[p.down] = Math.min(0.9, p.sides[p.down] + 0.0005); } }); return IG; }
// screen positions of the stations (for the touches and the gauges)
function scr(x, z, y = TOP) { return V3 && !V3.none ? W3.screen(new THREE.Vector3(x, y, z)) : { x: W / 2 + x * 400, y: H * 0.6 + z * 400 }; }
function hud(G, sp) {
  const c = G.cfg;
  if (G.lesson) lessonPanel(G);
  // tickets: paper slips along the top, oldest first, each with what goes on it and how long they have waited
  const ty = G.lesson ? H * 0.235 : 42 * k, tw = Math.min(124 * k, (W - 28) / Math.max(3, G.tickets.length) - 6);
  G.tickets.forEach((tk, i) => { const x = 14 + i * (tw + 8), h = (36 + 11 * new Set(tk.dish.items).size) * k; ctx.save(); ctx.translate(x, ty); ctx.rotate((i % 2 ? 1 : -1) * 0.015);
    ctx.fillStyle = '#fbf6e8'; ctx.fillRect(0, 0, tw, h); ctx.fillStyle = i === 0 ? '#e0533a' : '#b9b3a2'; ctx.fillRect(0, 0, tw, 5 * k);
    ctx.fillStyle = '#2b2b2b'; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillText(tk.dish.name, 6, 9 * k);
    ctx.font = `600 ${Math.round(10 * k)}px ${BC}`; ctx.fillStyle = '#555'; const items = {}; tk.dish.items.forEach(f => items[f] = (items[f] || 0) + 1); Object.entries(items).forEach(([f, n], j) => ctx.fillText(`${n > 1 ? n + '× ' : ''}${FOOD[f].name}`, 6, 25 * k + j * 11 * k));
    const u = 1 - tk.wait / tk.max; ctx.fillStyle = '#ddd5c2'; ctx.fillRect(0, h - 5 * k, tw, 5 * k); ctx.fillStyle = u > 0.5 ? '#5cb85c' : u > 0.25 ? '#f0ad4e' : '#d9534f'; ctx.fillRect(0, h - 5 * k, tw * u, 5 * k); ctx.restore(); });
  if (!G.lesson) { ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = '#fff'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.5)'; const s = `${G.served} / ${c.orders} served`; ctx.strokeText(s, W - 14, ty + 88 * k); ctx.fillText(s, W - 14, ty + 88 * k);
    for (let i = 0; i < c.lives; i++) { ctx.beginPath(); ctx.arc(W - 20 - i * 16 * k, ty + 110 * k, 5 * k, 0, TAU); ctx.fillStyle = i < G.lives ? '#ffd36a' : 'rgba(255,255,255,.25)'; ctx.fill(); } }
  // a ring round each pan: how done the underside is, with the golden band; the top side's colour you can see
  G.pans.forEach((p, i) => { if (!p || !sp.pans[i]) return; const s = scr(sp.pans[i].x, sp.pans[i].z), r = 30 * k, v = p.sides[p.down], gold = c.gold, a0 = -Math.PI / 2, A = u => a0 + clamp(u / 1.5, 0, 1) * TAU;
    ctx.lineWidth = 6 * k; ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.arc(s.x, s.y - 40 * k, r, 0, TAU); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,200,80,.55)'; ctx.beginPath(); ctx.arc(s.x, s.y - 40 * k, r, A(gold[0]), A(gold[1])); ctx.stroke();
    ctx.strokeStyle = v > BURNT ? '#222' : v >= gold[0] && v <= gold[1] ? '#ffcf4a' : v > gold[1] ? '#a0522d' : '#f2e6c8'; ctx.lineWidth = 4 * k; ctx.beginPath(); ctx.arc(s.x, s.y - 40 * k, r, a0, A(v)); ctx.stroke();
    const done = FOOD[p.food].sides === 1 ? 1 : p.sides[1 - p.down] >= gold[0] ? 2 : 1; ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(FOOD[p.food].sides === 1 ? 'NO FLIP' : `SIDE ${p.down === 0 && p.sides[1] === 0 ? 1 : done}`, s.x, s.y - 40 * k); });
  if (G.board) { const s = scr(sp.board.x, sp.board.z), F = FOOD[G.board.food]; if (G.board.chops < F.chops) { ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.5)'; const s2 = `SWIPE TO CHOP ${G.board.chops}/${F.chops}`; ctx.strokeText(s2, s.x, s.y - 34 * k); ctx.fillText(s2, s.x, s.y - 34 * k); } }
  // what is being dragged
  if (ui.drag && ui.drag.moved && ui.drag.label) { const d = ui.drag; ctx.globalAlpha = 0.9; ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; const w = ctx.measureText(d.label).width + 18; rrect(d.x - w / 2, d.y - 44 * k, w, 24 * k, 10); ctx.fill(); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(d.label, d.x, d.y - 32 * k); ctx.globalAlpha = 1; }
  if (G.N <= 2 && !G.lesson && G.t < 8) { ctx.globalAlpha = 0.8; ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.textAlign = 'center'; const p = scr(0, -0.72, TOP + 0.24); ctx.fillText('THE PASS: DRAG THE PLATE HERE', p.x, p.y); ctx.globalAlpha = 1; }
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
