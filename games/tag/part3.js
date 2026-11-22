// ===================== THE VIEW: Tag in 3D (three.js through tools/world3d.js) =====================
// A schoolyard seen from above and behind you: the climbing frame, the slide, swings, the roundabout, benches, trees, the
// sandpit, a fence all round; later the park in autumn, the beach, the snowy schoolyard. The kids run, swing their arms, wear
// red bibs when they are IT, glitter blue when frozen and sit on the bench when tagged out. The camera follows you.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [];
let hint = null, V3 = null;
const ui = { stick: null, snap: true };
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 2.8) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function fxStep(dt) {
  FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 1.8);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.3) TXT.shift();
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; }
}
const SHIRTS = [0x3a7bd5, 0x2aa86a, 0xe0a020, 0x9a4ad0, 0xe06aa0, 0x2ac0c0, 0xf07a30, 0x6a6ae0], SKINS = [0xf1c8a8, 0xd9a07a, 0xa8714a, 0x7a4a2a, 0xe8b890], HAIR = [0x2a1a10, 0x6a3a1a, 0xd8b060, 0x1a1a1a, 0xa04020];
const GROUND = [{ g: 0x5a8a3a, t: 0x8a8a8a, fence: 0x3a6a3a }, { g: 0x7a8a3a, t: 0x8a7a6a, fence: 0x6a4a2a }, { g: 0xe0d0a0, t: 0xd8c890, fence: 0x8a6a4a }, { g: 0xeef2f8, t: 0xc8ccd8, fence: 0x4a4a5a }];
function kidModel(shirt, skin, hair, me) {
  const T = THREE, g = new T.Group(), M = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.75 }, o));
  const body = new T.Group(); g.add(body);
  const torso = new T.Mesh(new T.CapsuleGeometry(0.22, 0.38, 4, 10), M(shirt)); torso.position.y = 0.92; body.add(torso);
  const head = new T.Mesh(new T.SphereGeometry(0.2, 14, 12), M(skin)); head.position.y = 1.38; body.add(head);
  const hr = new T.Mesh(new T.SphereGeometry(0.215, 14, 10, 0, TAU, 0, Math.PI * 0.55), M(hair)); hr.position.y = 1.4; hr.rotation.x = -0.25; body.add(hr);
  if (me) { const cap = new T.Mesh(new T.SphereGeometry(0.22, 14, 8, 0, TAU, 0, Math.PI / 2), M(0xe8302a)); cap.position.y = 1.44; body.add(cap); const brim = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, 0.03, 14, 1, false, -Math.PI / 2, Math.PI), M(0xe8302a)); brim.position.set(0, 1.45, 0.12); body.add(brim); }
  for (const sx of [-0.07, 0.07]) { const e = new T.Mesh(new T.SphereGeometry(0.025, 6, 4), M(0x111111)); e.position.set(sx, 1.41, 0.18); body.add(e); }
  const limb = (r, l, c, x, y) => { const p = new T.Group(); p.position.set(x, y, 0); const m = new T.Mesh(new T.CapsuleGeometry(r, l, 3, 8), M(c)); m.position.y = -l / 2 - r; p.add(m); body.add(p); return p; };
  const arms = [limb(0.07, 0.32, skin, -0.3, 1.12), limb(0.07, 0.32, skin, 0.3, 1.12)], legs = [limb(0.085, 0.36, 0x2a3a5a, -0.11, 0.62), limb(0.085, 0.36, 0x2a3a5a, 0.11, 0.62)];
  const bib = new T.Mesh(new T.CylinderGeometry(0.245, 0.245, 0.36, 12, 1, true), M(0xe02a1a, { emissive: 0x600000, side: T.DoubleSide })); bib.position.y = 0.95; bib.visible = false; body.add(bib);
  const ice = new T.Mesh(new T.CapsuleGeometry(0.42, 0.9, 4, 10), new T.MeshStandardMaterial({ color: 0xbfe8ff, emissive: 0x3a8ad0, emissiveIntensity: 0.6, transparent: true, opacity: 0.45, roughness: 0.1, depthWrite: false })); ice.position.y = 0.9; ice.visible = false; g.add(ice);
  const ring = new T.Mesh(new T.RingGeometry(0.5, 0.62, 28), new T.MeshBasicMaterial({ color: me ? 0xffe060 : 0xff3020, transparent: true, opacity: 0.8, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.03; ring.visible = !!me; g.add(ring);
  g.traverse(o => { if (o.isMesh && o !== ring && o !== ice) o.castShadow = true; });
  g.userData = { body, arms, legs, bib, ice, ring, torso }; return g;
}
function buildWorld() {
  if (V3) return V3; const T = THREE; if (!W3 || !W3.init({ canvas: $('gl'), fov: 48, far: 1500, near: 0.1 })) { V3 = { none: true }; return V3; }
  const S = W3.scene, R0 = W3.rng(21);
  const groundM = new T.MeshStandardMaterial({ color: 0x5a8a3a, roughness: 0.95, map: W3.grainTex(256, 5, 200, 50, 6) }); groundM.map.repeat.set(10, 10);
  const ground = new T.Mesh(new T.PlaneGeometry(300, 300), groundM); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; S.add(ground);
  const yardM = new T.MeshStandardMaterial({ color: 0x8a8a8a, roughness: 0.9, map: W3.grainTex(256, 9, 190, 30, 8) }); yardM.map.repeat.set(4, 6);
  const yard = new T.Mesh(new T.PlaneGeometry(HALF_X * 2, HALF_Z * 2), yardM); yard.rotation.x = -Math.PI / 2; yard.position.y = 0.01; yard.receiveShadow = true; S.add(yard);
  // painted lines: a hopscotch and a circle
  const lineM = new T.MeshBasicMaterial({ color: 0xf8f4e0, transparent: true, opacity: 0.7 }); const circ = new T.Mesh(new T.RingGeometry(4.6, 4.75, 64), lineM); circ.rotation.x = -Math.PI / 2; circ.position.set(0, 0.02, 3); S.add(circ);
  for (let i = 0; i < 6; i++) { const sq = new T.Mesh(new T.RingGeometry(0.62, 0.68, 4), lineM); sq.rotation.set(-Math.PI / 2, 0, Math.PI / 4); sq.position.set(-8, 0.02, 12 - i * 1.1); S.add(sq); }
  const sand = new T.Mesh(new T.CircleGeometry(SAND.r, 40), new T.MeshStandardMaterial({ color: 0xd8c08a, roughness: 1, map: W3.grainTex(128, 3, 200, 40, 10) })); sand.rotation.x = -Math.PI / 2; sand.position.set(SAND.x, 0.03, SAND.z); sand.receiveShadow = true; S.add(sand);
  const rim = new T.Mesh(new T.TorusGeometry(SAND.r, 0.12, 6, 40), new T.MeshStandardMaterial({ color: 0x8a6a4a, roughness: 0.9 })); rim.rotation.x = Math.PI / 2; rim.position.set(SAND.x, 0.06, SAND.z); S.add(rim);
  // the fence
  const fenceM = new T.MeshStandardMaterial({ color: 0x3a6a3a, roughness: 0.6, metalness: 0.3 }), posts = [];
  for (let x = -HALF_X; x <= HALF_X; x += 2) for (const z of [-HALF_Z, HALF_Z]) posts.push([x, z]); for (let z = -HALF_Z + 2; z < HALF_Z; z += 2) for (const x of [-HALF_X, HALF_X]) posts.push([x, z]);
  const postI = new T.InstancedMesh(new T.CylinderGeometry(0.05, 0.05, 1.3, 6), fenceM, posts.length), d = new T.Object3D(); posts.forEach(([x, z], i) => { d.position.set(x, 0.65, z); d.updateMatrix(); postI.setMatrixAt(i, d.matrix); }); S.add(postI);
  for (const [w, x, z, ry] of [[HALF_X * 2, 0, -HALF_Z, 0], [HALF_X * 2, 0, HALF_Z, 0], [HALF_Z * 2, -HALF_X, 0, Math.PI / 2], [HALF_Z * 2, HALF_X, 0, Math.PI / 2]]) for (const y of [0.5, 1.2]) { const r = new T.Mesh(new T.BoxGeometry(w, 0.05, 0.05), fenceM); r.position.set(x, y, z); r.rotation.y = ry; S.add(r); }
  // the props
  const metal = c => new T.MeshStandardMaterial({ color: c, roughness: 0.4, metalness: 0.5 }), wood = new T.MeshStandardMaterial({ color: 0x8a5a32, roughness: 0.85 }), props = [];
  for (const p of PROPS) { const g = new T.Group(); g.position.set(p.x, 0, p.z); S.add(g); props.push(g);
    if (p.k === 'frame') { const m = metal(0xd83a2a); for (const [x, z] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]]) { const b = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 2.4, 8), m); b.position.set(x, 1.2, z); g.add(b); }
      for (let y = 0.6; y <= 2.4; y += 0.6) for (const [ax, x, z] of [[0, 0, -1.6], [0, 0, 1.6], [1, -1.6, 0], [1, 1.6, 0]]) { const b = new T.Mesh(new T.CylinderGeometry(0.04, 0.04, 3.2, 6), metal(y === 2.4 ? 0x2a6ad8 : 0xe8c020)); b.rotation.z = Math.PI / 2; if (ax) b.rotation.y = Math.PI / 2; b.position.set(x, y, z); g.add(b); } }
    if (p.k === 'slide') { const m = metal(0x2a8ad8); const ladder = new T.Mesh(new T.BoxGeometry(0.7, 2.2, 0.1), metal(0xe8c020)); ladder.position.set(0, 1.1, -1.2); g.add(ladder); const plat = new T.Mesh(new T.BoxGeometry(0.9, 0.1, 0.9), m); plat.position.set(0, 2.1, -0.8); g.add(plat);
      const ch = new T.Mesh(new T.BoxGeometry(0.7, 0.06, 3), metal(0xf0f0f0)); ch.position.set(0, 1.1, 0.7); ch.rotation.x = 0.68; g.add(ch); }
    if (p.k === 'tree') { const tr = new T.Mesh(new T.CylinderGeometry(0.2, 0.32, 2.4, 8), new T.MeshStandardMaterial({ color: 0x5a3a22, roughness: 0.9 })); tr.position.y = 1.2; g.add(tr); const cr = []; for (let i = 0; i < 4; i++) { const c = new T.Mesh(new T.IcosahedronGeometry(1.2 + R0() * 0.4, 1), new T.MeshStandardMaterial({ color: 0x3a7a2a, roughness: 0.9, flatShading: true })); c.position.set((R0() - 0.5) * 1.2, 2.8 + R0() * 0.9, (R0() - 0.5) * 1.2); g.add(c); cr.push(c); } g.userData.crowns = cr; }
    if (p.k === 'bench') { const s = new T.Mesh(new T.BoxGeometry(2, 0.08, 0.5), wood); s.position.y = 0.48; g.add(s); const bk = new T.Mesh(new T.BoxGeometry(2, 0.4, 0.06), wood); bk.position.set(0, 0.75, -0.24); g.add(bk); for (const x of [-0.8, 0.8]) { const l = new T.Mesh(new T.BoxGeometry(0.08, 0.48, 0.45), metal(0x333333)); l.position.set(x, 0.24, 0); g.add(l); } g.rotation.y = p.x < 0 ? Math.PI / 2 : -Math.PI / 2; }
    if (p.k === 'swing') { const m = metal(0x3a3a3a); for (const x of [-1.6, 1.6]) for (const s of [-1, 1]) { const l = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 2.8, 6), m); l.position.set(x, 1.3, s * 0.5); l.rotation.x = s * 0.35; g.add(l); } const top = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 3.4, 6), m); top.rotation.z = Math.PI / 2; top.position.y = 2.6; g.add(top);
      const seats = []; for (const x of [-0.7, 0.7]) { const sw = new T.Group(); sw.position.set(x, 2.6, 0); for (const sx of [-0.2, 0.2]) { const ch = new T.Mesh(new T.CylinderGeometry(0.01, 0.01, 1.9, 4), m); ch.position.set(sx, -0.95, 0); sw.add(ch); } const st = new T.Mesh(new T.BoxGeometry(0.5, 0.05, 0.22), metal(0xe8302a)); st.position.y = -1.9; sw.add(st); g.add(sw); seats.push(sw); } g.userData.seats = seats; }
    if (p.k === 'round') { const disc = new T.Mesh(new T.CylinderGeometry(1.4, 1.4, 0.12, 24), metal(0xe8c020)); disc.position.y = 0.3; g.add(disc); for (let i = 0; i < 4; i++) { const h = new T.Mesh(new T.TorusGeometry(0.4, 0.03, 6, 12, Math.PI), metal(0x2a6ad8)); const a = i * Math.PI / 2; h.position.set(Math.sin(a) * 0.8, 0.36, Math.cos(a) * 0.8); h.rotation.y = a; g.add(h); } g.userData.spin = disc; }
    g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); }
  // trees and houses beyond the fence
  const out = []; const R = W3.rng(8); for (let i = 0; i < 70; i++) { const a = R() * TAU, r = 30 + R() * 50, x = Math.sin(a) * r, z = Math.cos(a) * r * 1.2; out.push({ x, z, y: 0, s: 0.7 + R() * 0.5, hue: R(), shade: R() }); }
  const pines = W3.pines(out, { layers: 4 });
  const glowT = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new T.CanvasTexture(c); })();
  const me = kidModel(0xf0d020, SKINS[0], HAIR[1], true); me.scale.setScalar(1.3); S.add(me);
  const kids = []; for (let i = 0; i < 8; i++) { const k = kidModel(SHIRTS[i], SKINS[i % SKINS.length], HAIR[(i * 3) % HAIR.length]); k.scale.setScalar(1.3); k.visible = false; S.add(k); kids.push(k); }
  const big = kidModel(0x6a2a2a, SKINS[2], HAIR[3]); big.scale.setScalar(1.9); big.visible = false; S.add(big);
  const powers = []; for (let i = 0; i < 3; i++) { const g = new T.Group(); const orb = new T.Mesh(new T.IcosahedronGeometry(0.32, 1), new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.6, roughness: 0.3 })); orb.position.y = 0.7; const gl = new T.Sprite(new T.SpriteMaterial({ map: glowT, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0.8 })); gl.scale.set(2, 2, 1); gl.position.y = 0.7; g.add(orb, gl); g.userData = { orb, gl }; g.visible = false; S.add(g); powers.push(g); }
  const puffs = [];
  V3 = { T, S, ground, groundM, yardM, me, kids, big, props, powers, glowT, puffs, cam: { x: 0, z: 20 }, place: -1, pines };
  W3.setQuality(stepN); return V3;
}
function setPlace(g) {
  const V = V3; if (V.place === g.place) return; V.place = g.place; const P = GROUND[g.place];
  V.groundM.color.setHex(P.g); V.yardM.color.setHex(P.t);
  V.props.forEach(p => { if (p.userData.crowns) p.userData.crowns.forEach(c => c.material.color.setHex([0x3a7a2a, 0xc86a1a, 0x4a8a2a, 0xe8eef4][g.place])); });
}
function setWeather(G) {
  const V = buildWorld(); if (V.none || V.sky === G.weather) return; V.sky = G.weather;
  W3.setSky(G.weather, { azim: 210 }); W3.scene.environmentIntensity = 0.7;
}
const SV = new (window.THREE ? THREE.Vector3 : Object)();
function scr(x, y, z) { if (!V3 || V3.none) return { x: W / 2 + x * 14, y: H / 2 + z * 14, front: true }; SV.set(x, y, z); return W3.screen(SV); }
function puff(x, z, col, s = 1.4) { const V = V3; if (HEADLESS || !V || V.none) return; const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: V.glowT, color: col, transparent: true, depthWrite: false, opacity: 0.9 })); sp.position.set(x, 0.6, z); sp.scale.set(s, s, 1); V.S.add(sp); V.puffs.push({ sp, t: 0, s }); }
function onEvent(G, e) {
  const cx = W / 2, cy = H * 0.36, me = G.me, s = () => scr(me.x, 2.2, me.z);
  switch (e.k) {
    case 'dash': sfx.dash(); vibe(HAP.light); puff(me.x, me.z, 0xffffff, 1.2); break;
    case 'tag': { sfx.tag(e.combo); FX.shake = 6; FX.stop = 0.05; vibe(HAP.sharp); const p = scr(e.x, 2, e.z); say(e.freeze ? 'FROZEN!' : 'TAGGED!', p.x, p.y - 10, e.freeze ? '#9fdcff' : '#ffe060', 26); puff(e.x, e.z, e.freeze ? 0x9fdcff : 0xffe060, 2.4);
      if (e.combo >= 2) say(e.combo >= 3 ? `${e.combo} IN A ROW!` : 'DOUBLE!', cx, cy, '#ffe060', 28); if (e.freeze) sfx.ice(); } break;
    case 'thaw': sfx.thaw(); { const p = scr(e.x, 2, e.z); say('UNFROZEN!', p.x, p.y, '#ffb4a8', 18); } tip('thaw', 'Free kids unfreeze friends: catch the one coming to help', 3); break;
    case 'caught': sfx.caught(); FX.shake = 12; FX.red = 0.8; FX.stop = 0.08; vibe(HAP.thud); say(e.hearts > 0 ? `CAUGHT! ${'♥'.repeat(Math.max(0, e.hearts))} LEFT` : 'CAUGHT!', cx, cy, '#ffb4a8', 28); break;
    case 'shield': sfx.shield(); FX.flash = 0.4; say('SHIELD!', cx, cy, '#9fdcff', 28); break;
    case 'zombie': sfx.zombie(); { const p = scr(e.x, 2, e.z); say(`${e.name.toUpperCase()} IS IT!`, p.x, p.y, '#ff8a7a', 18); } break;
    case 'power': sfx.power(); vibe(HAP.light); say({ speed: 'SPEED!', ghost: 'GHOST!', shield: 'SHIELD ON', freeze: 'FREEZE WHISTLE!' }[e.p], cx, cy + 40, '#fff', 26); if (e.p === 'freeze') { sfx.whistle(); FX.flash = 0.4; } break;
    case 'lessonnext': if (e.first) hint = null; say(e.first ? 'FIRST, A LESSON' : 'NEXT LESSON', cx, H * 0.5, '#ffe060', 26); sfx.ding(); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, cx, H * 0.5, '#9be3b5', 26); sfx.coin(e.n); break;
    case 'lessonmiss': if (e.why === 'nodash') say('DASH TO TAG! TAP DASH', cx, H * 0.55, '#ffd0c4', 22); hint = { txt: e.how, t: 0, secs: 3.4 }; break;
    case 'lessondone': say('YOU GOT IT. NOW PLAY!', cx, H * 0.5, '#ffe060', 26); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); vibe(HAP.best); FX.flash = 0.8; say(G.mode === 'chase' || G.mode === 'freeze' ? 'GOT THEM ALL!' : 'THE BELL! SAFE!', cx, cy, '#ffe060', 32); break;
    case 'lost': sfx.lose(); say(e.why === 'bell' ? 'THE BELL!' : 'CAUGHT!', cx, cy, '#ffb4a8', 32); break;
  }
}
function poseKid(m, o, t, dt) {
  const u = m.userData, v = Math.hypot(o.vx, o.vz), run = Math.min(1, v / 6);
  m.position.set(o.x, 0, o.z); m.rotation.y = o.h;
  const ph = t * (8 + v * 1.4) + (o.wob || 0), sw = Math.sin(ph) * 0.9 * run;
  u.legs[0].rotation.x = sw; u.legs[1].rotation.x = -sw; u.arms[0].rotation.x = -sw * 0.9; u.arms[1].rotation.x = sw * 0.9; u.body.position.y = Math.abs(Math.sin(ph)) * 0.08 * run; u.body.rotation.x = run * 0.18 + ((o.dash || 0) > 0 ? 0.35 : 0);
}
let IG = null; function idleG() { if (!IG || IG.over) { IG = newGame(Math.max(4, (store.get('level', 1) | 0)), { seed: (Math.random() * 1e6) | 0 }); IG.mem = {}; IG.hearts = 999; IG.left = 999; } honest(IG, { react: 0.2, acc: 0.98 }, IG.mem); step(IG, 1 / 60); IG.ev.length = 0; if (IG.mode === 'chase' && IG.kids.every(k => k.out)) IG = null; return IG || idleG(); }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#10141f'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D playground.', W / 2, H / 2); return; }
  const g = G || idleG(), t = now, me = g.me; setWeather(g); setPlace(g);
  // you, and the kids (the big kid in his own body)
  poseKid(V.me, me, t, dt); V.me.userData.ring.material.opacity = 0.5 + 0.3 * Math.sin(t * 6); V.me.visible = !(g.buff.ghost && Math.sin(t * 30) > 0.3);
  V.kids.forEach(k => k.visible = false); V.big.visible = false;
  let bench = 0;
  g.kids.forEach((k, i) => { const m = k.big ? V.big : V.kids[i % V.kids.length]; m.visible = true; const u = m.userData;
    if (k.out) { const side = bench % 2 ? 1 : -1, row = (bench >> 1); m.position.set(side * (HALF_X + 1.6), 0, -10 + row * 2.2); m.rotation.y = -side * Math.PI / 2; u.legs.forEach(l => l.rotation.x = -1.4); u.arms.forEach(a => a.rotation.x = 0); u.body.position.y = -0.35; u.body.rotation.x = 0; bench++; }
    else poseKid(m, k, t, dt);
    u.bib.visible = k.it; u.ring.visible = k.it && !k.out; u.ice.visible = k.frozen; if (k.frozen) { u.legs.forEach(l => l.rotation.x *= 0.5); u.ice.material.opacity = 0.35 + 0.15 * Math.sin(t * 3 + i) + (k.thaw > 0 ? -k.thaw * 0.2 : 0); }
    if (k.stun > 0) m.rotation.y += t * 12; });
  // power-ups
  V.powers.forEach((m, i) => { const p = g.powers[i]; m.visible = !!p; if (!p) return; m.position.set(p.x, Math.sin(t * 3 + i) * 0.15, p.z); m.userData.orb.rotation.y = t * 2; const col = { speed: 0xffd020, ghost: 0xc0c8ff, shield: 0x40b0ff, freeze: 0x9fe8ff }[p.k]; m.userData.orb.material.color.setHex(col); m.userData.orb.material.emissive.setHex(col); m.userData.gl.material.color.setHex(col); m.visible = p.t < 11 || Math.sin(t * 12) > 0; });
  V.props.forEach(p => { if (p.userData.spin) p.userData.spin.rotation.y = t * 0.8; if (p.userData.seats) p.userData.seats.forEach((s, i) => s.rotation.x = Math.sin(t * 1.8 + i * 2) * 0.35); });
  for (const p of V.puffs) { p.t += dt; p.sp.scale.setScalar(p.s * (1 + p.t * 2)); p.sp.material.opacity = Math.max(0, 0.9 - p.t * 1.6); }
  for (let i = V.puffs.length - 1; i >= 0; i--) if (V.puffs[i].t > 0.6) { V.S.remove(V.puffs[i].sp); V.puffs.splice(i, 1); }
  // the camera: above and behind you, easing after you, kept over the yard
  const asp = innerWidth / innerHeight, back = asp < 0.7 ? 1 : 0.8, C = V.cam, tx = clamp(me.x, -HALF_X + 5.5, HALF_X - 5.5), tz = clamp(me.z, -HALF_Z + 7, HALF_Z - 5);
  const e = ui.snap ? 1 : 1 - Math.exp(-dt * 4); ui.snap = false; C.x += (tx - C.x) * e; C.z += (tz - C.z) * e;
  const cam = W3.cam; cam.fov = 50; cam.updateProjectionMatrix(); cam.position.set(C.x, 28 * back, C.z + 15 * back); cam.lookAt(C.x, 0, C.z - 1.5);
  if (FX.shake > 0) { cam.position.x += (Math.random() - 0.5) * FX.shake * 0.03; cam.position.z += (Math.random() - 0.5) * FX.shake * 0.03; }
  W3.setFocus(C.x, 0, C.z - 1.5, 26);
  W3.render(dt);
  if (G) hud(G, t);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 0.9 ? 1 : 1 - (t2.t - 0.9) / 0.4; ctx.globalAlpha = Math.max(0, al); ctx.font = `${Math.round(t2.size * k)}px ${TF}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 26); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 26); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30;
    ctx.fillStyle = 'rgba(0,0,0,.66)'; rrect(W / 2 - w / 2, H * 0.62 - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.62 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,60,40,${FX.red * 0.18})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,248,220,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); }
}
function dashBtn() { return { x: W - 64 * k, y: H - 92 * k, r: 44 * k }; }
function hud(G, t) {
  const c = G.cfg, me = G.me, x = 14, mode = G.mode, it = mode === 'chase' || mode === 'freeze';
  if (G.lesson) lessonPanel(G);
  const y = G.lesson ? H * 0.26 : 26 * k;
  ctx.textBaseline = 'middle'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.55)';
  // the game and the goal
  ctx.textAlign = 'left'; ctx.font = `${Math.round(19 * k)}px ${TF}`; ctx.fillStyle = it ? '#ffe060' : '#ff8a7a'; ctx.strokeText(MODES[mode], x, y); ctx.fillText(MODES[mode], x, y);
  const left = G.kids.filter(q => !q.it && !q.out && !q.frozen).length, goal = mode === 'chase' ? `${left} TO TAG` : mode === 'freeze' ? `${G.kids.filter(q => !q.frozen).length} STILL FREE` : mode === 'zombie' ? `${left + 1} STILL FREE` : 'KEEP AWAY';
  ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = '#fff'; ctx.strokeText(goal, x, y + 20 * k); ctx.fillText(goal, x, y + 20 * k);
  // the bell
  if (!G.lesson) { const s = Math.ceil(G.left), lowT = it ? G.left < 8 : false; ctx.textAlign = 'right'; ctx.font = `${Math.round(24 * k)}px ${TF}`; ctx.fillStyle = lowT ? (Math.sin(t * 10) > 0 ? '#ff6a5a' : '#fff') : '#fff'; const ts = `🔔 ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; ctx.strokeText(ts, W - 14, y); ctx.fillText(ts, W - 14, y); }
  if (!it) { ctx.textAlign = 'right'; ctx.font = `${Math.round(18 * k)}px sans-serif`; let hs = ''; for (let i = 0; i < c.hearts; i++) hs += i < G.hearts ? '❤️' : '🤍'; ctx.fillText(hs, W - 14, y + 26 * k); }
  // what you have on
  const b = Object.keys(G.buff).filter(q => q !== 'freezeAll'); if (b.length) { ctx.textAlign = 'center'; ctx.font = `${Math.round(18 * k)}px sans-serif`; const s = scr(me.x, 2.4, me.z); ctx.fillText(b.map(q => POWERS[q].icon).join(''), s.x, s.y - 8 * k); }
  // arrows at the edge for kids you cannot see (red for those chasing you)
  for (const q of G.kids) { if (q.out) continue; const s = scr(q.x, 1, q.z); if (s.front && s.x > 10 && s.x < W - 10 && s.y > 60 * k && s.y < H - 20) continue;
    const ax = clamp(s.x, 22, W - 22), ay = clamp(s.y, 80 * k, H - 30 * k), m2 = scr(me.x, 1, me.z), an = Math.atan2(ay - m2.y, ax - m2.x);
    ctx.save(); ctx.translate(ax, ay); ctx.rotate(an); ctx.fillStyle = q.it ? '#ff5a4a' : q.frozen ? '#9fdcff' : '#ffe060'; ctx.beginPath(); ctx.moveTo(12 * k, 0); ctx.lineTo(-6 * k, -8 * k); ctx.lineTo(-6 * k, 8 * k); ctx.closePath(); ctx.fill(); ctx.restore(); }
  // frozen kids being thawed: a ring filling
  for (const q of G.kids) if (q.frozen && q.thaw > 0) { const s = scr(q.x, 2, q.z); ctx.strokeStyle = '#ffb4a8'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(s.x, s.y, 14 * k, -Math.PI / 2, -Math.PI / 2 + TAU * q.thaw / c.unfreeze); ctx.stroke(); }
  { const D = dashBtn(), u = 1 - me.cd / c.dashCD, ready = u >= 1, glow = G.lesson && G.lesson.id === 'dash' && ready; ctx.fillStyle = ready ? 'rgba(255,150,40,.92)' : 'rgba(20,24,40,.55)'; ctx.beginPath(); ctx.arc(D.x, D.y, D.r, 0, TAU); ctx.fill();
    ctx.strokeStyle = glow ? '#ffe060' : 'rgba(255,255,255,.8)'; ctx.lineWidth = glow ? 5 + 2 * Math.sin(now * 8) : 3; ctx.beginPath(); ctx.arc(D.x, D.y, D.r, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(u, 0, 1)); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `700 ${Math.round(17 * k)}px ${BC}`; ctx.fillText('DASH', D.x, D.y); }
  // the stick under the thumb, and the dash ring
  const st = ui.stick; if (st) { ctx.globalAlpha = 0.5; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(st.x0, st.y0, 46 * k, 0, TAU); ctx.stroke(); ctx.globalAlpha = 0.85; ctx.fillStyle = '#fff'; ctx.beginPath(); const dx = clamp(st.x - st.x0, -46 * k, 46 * k), dy = clamp(st.y - st.y0, -46 * k, 46 * k); ctx.arc(st.x0 + dx, st.y0 + dy, 18 * k, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
  { const s = scr(me.x, 0.05, me.z), r = 22 * k, u = 1 - me.cd / c.dashCD; if (u < 1) { ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(s.x, s.y + 6 * k, r, 0, TAU); ctx.stroke(); ctx.strokeStyle = '#ffe060'; ctx.beginPath(); ctx.arc(s.x, s.y + 6 * k, r, -Math.PI / 2, -Math.PI / 2 + TAU * u); ctx.stroke(); } }
  if (G.N <= 3 && G.t < 6 && !G.lesson) { ctx.textAlign = 'center'; ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = '#fff'; ctx.strokeText('DRAG TO RUN · TAP DASH FOR A BURST', W / 2, H - 50 * k); ctx.fillText('DRAG TO RUN · TAP DASH FOR A BURST', W / 2, H - 50 * k); }
}
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) {
  const D = G.lesson, st = D.steps[D.i], x = 14, w = W - 28, y = 42 * k; ctx.save();
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; const lines = wrapText(st.how, w - 24), h = 54 * k + lines.length * 17 * k;
  ctx.fillStyle = 'rgba(0,0,0,.62)'; rrect(x, y, w, h, 12); ctx.fill(); ctx.strokeStyle = 'rgba(255,224,96,.7)'; ctx.lineWidth = 2; rrect(x, y, w, h, 12); ctx.stroke();
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#ffe060'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillText(`LESSON ${D.i + 1} OF ${D.steps.length}`, x + 12, y + 10 * k);
  ctx.fillStyle = '#fff'; ctx.font = `${Math.round(18 * k)}px ${TF}`; ctx.fillText(st.title, x + 12, y + 25 * k);
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.9)'; lines.forEach((l, i) => ctx.fillText(l, x + 12, y + 48 * k + i * 17 * k));
  ctx.restore(); ctx.textBaseline = 'middle';
}
