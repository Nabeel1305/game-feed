// ===================== THE VIEW: Critter Clash in 3D (three.js through tools/world3d.js) =====================
// A ring of trodden earth in a flowery meadow (later the beach, an autumn wood, a snowfield), trees all round, the weather
// changing. Little round critters bounce on their feet: Emberpup with a flickering flame tuft, Puddlewump with a fin, Sproutle
// with a sprout, Zapling with zigzag feelers, Pebblor all rock and moss. Hits fly as glowing balls of their type; the 2D layer
// draws the timing ring, the sparks, the health bars and the buttons.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { snap: true, hpShow: {} };
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 2.8) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 14, sp = 160) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60 * k, t: 0, life: 0.5 + Math.random() * 0.4, col, r: (2 + Math.random() * 3.5) * k }); } if (PARTS.length > 220) PARTS.splice(0, PARTS.length - 220); }
function fxStep(dt) {
  FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.5) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * k * dt; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; }
}
const TYPEHEX = { fire: 0xff6a2a, water: 0x3a8ae8, leaf: 0x4ac04a, spark: 0xffd02a, stone: 0x9a8a78 };
const GROUNDS = [{ g: 0x6aa84a, ring: 0xb89a6a, tree: 0.33 }, { g: 0xe8d8a8, ring: 0xd8c08a, tree: 0.3 }, { g: 0x8a8a3a, ring: 0x9a7a52, tree: 0.08 }, { g: 0xeef2f8, ring: 0xc8ccd8, tree: 0.55 }];
// a critter: a round body that bounces, big eyes, and the parts of its type
function critterModel(type) {
  const T = THREE, g = new T.Group(), M = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.55 }, o)), col = TYPEHEX[type];
  const body = new T.Group(); g.add(body);
  const skinM = M(col, { roughness: type === 'water' ? 0.25 : type === 'stone' ? 0.9 : 0.55, flatShading: type === 'stone', emissive: 0x000000 });
  const blob = new T.Mesh(type === 'stone' ? new T.IcosahedronGeometry(0.58, 1) : new T.SphereGeometry(0.56, 24, 18), skinM); blob.position.y = 0.56; blob.scale.set(1, 0.92, 0.95); body.add(blob);
  const belly = new T.Mesh(new T.SphereGeometry(0.36, 18, 14), M(new T.Color(col).lerp(new T.Color(0xffffff), 0.55).getHex(), { roughness: 0.7 })); belly.position.set(0, 0.46, 0.26); belly.scale.set(1, 1, 0.6); body.add(belly);
  for (const sx of [-1, 1]) {
    const eye = new T.Mesh(new T.SphereGeometry(0.15, 14, 12), M(0xffffff, { roughness: 0.3 })); eye.position.set(sx * 0.2, 0.72, 0.42); body.add(eye);
    const pup = new T.Mesh(new T.SphereGeometry(0.085, 12, 10), M(0x1a1a24, { roughness: 0.2 })); pup.position.set(sx * 0.2, 0.72, 0.54); body.add(pup);
    const gl = new T.Mesh(new T.SphereGeometry(0.03, 6, 6), M(0xffffff, { emissive: 0xffffff })); gl.position.set(sx * 0.2 + 0.03, 0.76, 0.61); body.add(gl);
    const ck = new T.Mesh(new T.CircleGeometry(0.07, 12), new T.MeshBasicMaterial({ color: 0xff8a9a, transparent: true, opacity: 0.6 })); ck.position.set(sx * 0.34, 0.58, 0.47); ck.rotation.y = sx * 0.5; body.add(ck);
    const foot = new T.Mesh(new T.SphereGeometry(0.15, 12, 8), M(new T.Color(col).multiplyScalar(0.7).getHex())); foot.position.set(sx * 0.24, 0.07, 0.12); foot.scale.set(1, 0.55, 1.3); body.add(foot);
  }
  const parts = [];
  if (type === 'fire') { for (const [x, h, c] of [[0, 0.5, 0xffd03a], [-0.13, 0.36, 0xff8a2a], [0.13, 0.36, 0xff8a2a]]) { const f = new T.Mesh(new T.ConeGeometry(0.12, h, 10), M(c, { emissive: c, emissiveIntensity: 0.8 })); f.position.set(x, 1.08 + h / 2 - 0.1, -0.05); body.add(f); parts.push(f); }
    for (const sx of [-1, 1]) { const ear = new T.Mesh(new T.ConeGeometry(0.1, 0.24, 8), skinM); ear.position.set(sx * 0.32, 0.98, 0); ear.rotation.z = -sx * 0.5; body.add(ear); } }
  if (type === 'water') { const fin = new T.Mesh(new T.ConeGeometry(0.22, 0.42, 3), M(0x8ad0ff, { roughness: 0.2 })); fin.position.set(0, 1.12, -0.05); fin.scale.set(0.35, 1, 1.2); body.add(fin); parts.push(fin); const tail = new T.Mesh(new T.ConeGeometry(0.18, 0.4, 3), M(0x8ad0ff, { roughness: 0.2 })); tail.position.set(0, 0.4, -0.58); tail.rotation.x = -1.9; tail.scale.set(1.3, 1, 0.3); body.add(tail); }
  if (type === 'leaf') { const stem = new T.Mesh(new T.CylinderGeometry(0.025, 0.03, 0.28, 6), M(0x3a8a2a)); stem.position.set(0, 1.12, 0); body.add(stem); for (const sx of [-1, 1]) { const lf = new T.Mesh(new T.SphereGeometry(0.17, 12, 8), M(0x6ae05a)); lf.position.set(sx * 0.15, 1.26, 0); lf.scale.set(1.2, 0.25, 0.6); lf.rotation.z = sx * 0.5; body.add(lf); parts.push(lf); } }
  if (type === 'spark') { for (const sx of [-1, 1]) { const a = new T.Group(); a.position.set(sx * 0.18, 1.0, 0); for (let i = 0; i < 3; i++) { const s = new T.Mesh(new T.BoxGeometry(0.05, 0.16, 0.05), M(0x2a2a2a)); s.position.set((i % 2 ? 1 : -1) * 0.04 * sx, 0.08 + i * 0.13, 0); s.rotation.z = (i % 2 ? 0.6 : -0.6) * sx; a.add(s); } const tipm = new T.Mesh(new T.SphereGeometry(0.07, 8, 6), M(0xfff07a, { emissive: 0xffe03a, emissiveIntensity: 1 })); tipm.position.y = 0.46; a.add(tipm); body.add(a); parts.push(tipm); } }
  if (type === 'stone') { for (let i = 0; i < 5; i++) { const m = new T.Mesh(new T.SphereGeometry(0.1 + Math.random() * 0.06, 8, 6), M(0x5a9a3a, { roughness: 1 })); const a = i / 5 * TAU; m.position.set(Math.sin(a) * 0.2, 1.06, Math.cos(a) * 0.2 - 0.05); m.scale.y = 0.5; body.add(m); } }
  const shield = new T.Mesh(new T.SphereGeometry(0.95, 24, 16), new T.MeshStandardMaterial({ color: 0x9ad8ff, emissive: 0x3a8ae8, emissiveIntensity: 0.5, transparent: true, opacity: 0.32, roughness: 0.1, depthWrite: false })); shield.position.y = 0.58; shield.visible = false; g.add(shield);
  g.traverse(o => { if (o.isMesh && o !== shield) o.castShadow = true; });
  g.userData = { body, blob, skinM, parts, shield, type }; return g;
}
function buildWorld() {
  if (V3) return V3; const T = THREE; if (!W3 || !W3.init({ canvas: $('gl'), fov: 45, far: 1500, near: 0.1 })) { V3 = { none: true }; return V3; }
  const S = W3.scene, R0 = W3.rng(17);
  const groundM = new T.MeshStandardMaterial({ color: 0x6aa84a, roughness: 1, map: W3.grainTex(256, 4, 200, 45, 8) }); groundM.map.repeat.set(30, 30);
  const ground = new T.Mesh(new T.PlaneGeometry(300, 300), groundM); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; S.add(ground);
  const ringM = new T.MeshStandardMaterial({ color: 0xb89a6a, roughness: 1, map: W3.grainTex(128, 9, 210, 40, 10) }); ringM.map.repeat.set(3, 3);
  const ring = new T.Mesh(new T.CircleGeometry(4.6, 48), ringM); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.01; ring.receiveShadow = true; S.add(ring);
  const edge = new T.Mesh(new T.TorusGeometry(4.6, 0.09, 6, 64), new T.MeshStandardMaterial({ color: 0xf0e8d8, roughness: 0.8 })); edge.rotation.x = Math.PI / 2; edge.position.y = 0.03; S.add(edge);
  // flowers, rocks and bushes in the meadow
  const fl = new T.InstancedMesh(new T.SphereGeometry(0.09, 6, 5), new T.MeshStandardMaterial({ roughness: 0.8 }), 420), d = new T.Object3D(), c = new T.Color(), fcols = [0xff6a8a, 0xffffff, 0xffd84a, 0xb88aff, 0xff9a4a];
  for (let i = 0; i < 420; i++) { let x, z; do { x = (R0() - 0.5) * 34; z = (R0() - 0.5) * 34 - 4; } while (Math.hypot(x, z) < 5.2); d.position.set(x, 0.12, z); d.scale.setScalar(0.7 + R0() * 0.8); d.updateMatrix(); fl.setMatrixAt(i, d.matrix); fl.setColorAt(i, c.setHex(fcols[(R0() * fcols.length) | 0])); } S.add(fl);
  const bushM = new T.MeshStandardMaterial({ color: 0x3a7a2a, roughness: 1, flatShading: true }), bushes = []; for (let i = 0; i < 26; i++) { const b = new T.Mesh(new T.IcosahedronGeometry(0.5 + R0() * 0.7, 1), bushM); const a = R0() * TAU, r = 6.5 + R0() * 8; b.position.set(Math.sin(a) * r, 0.25, Math.cos(a) * r - 3); b.castShadow = true; S.add(b); bushes.push(b); }
  const rockM = new T.MeshStandardMaterial({ color: 0x8a8a84, roughness: 0.95, flatShading: true }); for (let i = 0; i < 12; i++) { const r = new T.Mesh(new T.DodecahedronGeometry(0.3 + R0() * 0.5, 0), rockM); const a = R0() * TAU, rr = 5.4 + R0() * 6; r.position.set(Math.sin(a) * rr, 0.1, Math.cos(a) * rr - 2); r.rotation.set(R0(), R0(), R0()); r.castShadow = true; S.add(r); }
  const trees = []; for (let i = 0; i < 70; i++) { const a = R0() * TAU, r = 13 + R0() * 30; trees.push({ x: Math.sin(a) * r, z: Math.cos(a) * r - 8, y: 0, s: 0.5 + R0() * 0.5, hue: R0(), shade: R0() }); } W3.pines(trees, { layers: 3, shadow: true });
  const glowT = (() => { const cv2 = document.createElement('canvas'); cv2.width = cv2.height = 64; const g = cv2.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new T.CanvasTexture(cv2); })();
  const models = {}; for (const ty of TYPES) for (const side of ['me', 'foe']) { const m = critterModel(ty); m.visible = false; S.add(m); models[side + ty] = m; }
  const shotM = new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.8 }), shot = new T.Mesh(new T.SphereGeometry(0.2, 14, 10), shotM); shot.visible = false; S.add(shot);
  const shotGlow = new T.Sprite(new T.SpriteMaterial({ map: glowT, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0.9 })); shotGlow.scale.set(1.6, 1.6, 1); shot.add(shotGlow);
  const charm = new T.Mesh(new T.IcosahedronGeometry(0.2, 0), new T.MeshStandardMaterial({ color: 0xffe07a, emissive: 0xffb02a, emissiveIntensity: 0.8, metalness: 0.4, roughness: 0.3, flatShading: true })); charm.visible = false; S.add(charm);
  const fill = new T.DirectionalLight(0xfff4e8, 0.9); fill.position.set(6, 6, 14); S.add(fill);      // a soft light from behind the camera: faces never in the dark
  V3 = { T, S, fill, groundM, ringM, bushM, models, shot, shotM, shotGlow, charm, glowT, sky: null, place: -1 };
  W3.setQuality(stepN); return V3;
}
const MEP = [-0.8, 0, 1.3], FOEP = [1.05, 0, -2.2];
const SV = new (window.THREE ? THREE.Vector3 : Object)();
function scr(x, y, z) { if (!V3 || V3.none) return { x: W / 2 + x * 60, y: H * 0.45 - y * 60 + z * 40, front: true }; SV.set(x, y, z); return W3.screen(SV); }
const CAM = { key: '', d: 9 };
function placeCam() {
  const cam = W3.cam, asp = innerWidth / innerHeight, key = asp.toFixed(3); if (CAM.key !== key) { CAM.key = key; cam.fov = asp < 0.75 ? 48 : 38; cam.aspect = asp; cam.updateProjectionMatrix(); const th = Math.tan(cam.fov * Math.PI / 360) * asp; CAM.d = clamp(2.6 / th, 7, 20); }
  cam.position.set(1.5 + (FX.shake ? (Math.random() - 0.5) * FX.shake * 0.01 : 0), 2.7, 1.0 + CAM.d * 0.7); cam.lookAt(0.0, 0.55, -0.55); cam.updateMatrixWorld();
}
// ---------- events ----------
const INTENT = { hit: ['⚔', 'ATTACK', '#ffffff'], big: ['💥', 'BIG ATTACK!', '#ff6a5a'], guard: ['🛡', 'GUARD', '#9ad8ff'], switch: ['⇄', 'SWITCH', '#ffe08a'], heal: ['💚', 'HEAL', '#8fe0ab'], rest: ['💤', 'REST', '#cccccc'] };
function headAt(who, g) { const p = who === 'me' ? MEP : FOEP; return scr(p[0], 1.25, p[2]); }
function onEvent(G, e) {
  const cx = W / 2, cy = H * 0.42, fp = headAt('foe', G), mp = headAt('me', G);
  switch (e.k) {
    case 'battle': say(G.cfg.wild ? 'A WILD CRITTER!' : G.cfg.boss ? 'GYM LEADER!' : G.trainer.toUpperCase(), cx, H * 0.3, '#ffe08a', 26); sfx.ding(); break;
    case 'ring': sfx.charge(); if (G.N <= 3 || G.lesson) tip('ring', 'Tap anywhere when the white ring meets the gold ring', 2.6); break;
    case 'tap': sfx.click(); break;
    case 'shoot': sfx.whoosh(e.type); if (e.tm === 'crit') { say('CRITICAL!', fp.x, fp.y - 50 * k, '#ffe08a', 26); vibe(HAP.sharp); } else if (e.tm === 'early') { say('TOO SOON!', mp.x, mp.y - 40 * k, '#ffb4a8', 20); } else if (e.tm === 'none') say('WEAK...', mp.x, mp.y - 40 * k, '#cccccc', 18); break;
    case 'hit': { const p = e.who === 'foe' ? fp : mp, col = '#' + TYPEHEX[e.who === 'foe' ? mine(G).type : theirs(G).type].toString(16).padStart(6, '0'); burst(p.x, p.y + 30 * k, col, e.e > 1 ? 26 : 14); burst(p.x, p.y + 30 * k, '#ffffff', 6);
      if (e.who === 'foe') { sfx.hit(e.e, e.tm === 'crit'); FX.stop = e.tm === 'crit' ? 0.09 : 0.04; FX.shake = e.tm === 'crit' ? 5 : 2.5; if (e.e > 1) say('SUPER EFFECTIVE!', p.x, p.y - 20 * k, '#ffe08a', 22); else if (e.e < 1) say('not very effective', p.x, p.y - 20 * k, '#cccccc', 17); say('-' + e.dmg, p.x + 40 * k, p.y + 10 * k, '#ffffff', 22); if (e.guarded) say('BLOCKED', p.x, p.y - 44 * k, '#9ad8ff', 18); }
      else { if (e.guarded) { sfx.block(); say(e.big ? 'BLOCKED IT!' : 'BLOCKED', p.x, p.y - 30 * k, '#9ad8ff', e.big ? 26 : 20); vibe(HAP.light); } else { sfx.ouch(e.big); FX.red = e.big ? 0.7 : 0.35; FX.shake = e.big ? 6 : 3; vibe(e.big ? HAP.heavy : HAP.thud); if (e.big) tip('big', 'When it says BIG ATTACK, tap GUARD first', 3); } if (e.e > 1) say('SUPER EFFECTIVE!', p.x, p.y - 4 * k, '#ffb4a8', 18); say('-' + e.dmg, p.x + 40 * k, p.y + 10 * k, '#ffb4a8', 22); } } break;
    case 'foeshoot': sfx.whoosh(e.type, e.big); break;
    case 'guard': sfx.shield(); break;
    case 'switch': case 'enter': sfx.pop(); burst(e.who === 'foe' ? fp.x : mp.x, (e.who === 'foe' ? fp.y : mp.y) + 30 * k, '#ffffff', 16); if (e.k === 'switch') say('GO, ' + mine(G).name.toUpperCase() + '!', mp.x, mp.y - 40 * k, '#ffe08a', 20); break;
    case 'foeguard': sfx.shield(); break;
    case 'foeheal': sfx.heal(); say('+HEAL', fp.x, fp.y - 30 * k, '#8fe0ab', 20); break;
    case 'foerest': break;
    case 'berry': sfx.heal(); say('YUM! +HEALTH', mp.x, mp.y - 40 * k, '#8fe0ab', 22); burst(mp.x, mp.y + 30 * k, '#ff6a8a', 14); break;
    case 'faint': sfx.faint(); say(e.who === 'foe' ? theirs(G).name.toUpperCase() + ' FAINTED!' : mine(G).name.toUpperCase() + ' FAINTED', cx, H * 0.3, e.who === 'foe' ? '#ffe08a' : '#ffb4a8', 22); if (e.who === 'foe') { sfx.coin(2); vibe(HAP.sharp); } break;
    case 'throw': sfx.whoosh('spark'); break;
    case 'caught': sfx.caught(); FX.flash = 0.8; vibe(HAP.best); say('CAUGHT!', cx, H * 0.34, '#ffe08a', 40); burst(fp.x, fp.y + 30 * k, '#ffe08a', 40, 240); break;
    case 'breakfree': sfx.no(); say('IT BROKE FREE!', fp.x, fp.y - 30 * k, '#ffb4a8', 22); break;
    case 'lessonnext': if (e.first) hint = null; say('FIRST, A LESSON', cx, H * 0.36, '#ffe08a', 26); sfx.ding(); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, cx, H * 0.36, '#9be3b5', 26); sfx.coin(e.n); break;
    case 'lessonmiss': coachMiss(); break;
    case 'lessondone': say('NOW THE REAL BATTLE!', cx, H * 0.36, '#ffe08a', 26); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); vibe(HAP.best); if (e.why !== 'caught') say('YOU WIN!', cx, H * 0.3, '#ffe08a', 36); break;
    case 'lost': sfx.lose(); say('ALL YOUR CRITTERS FAINTED', cx, H * 0.3, '#ffb4a8', 22); break;
  }
}
// ---------- the critters, frame by frame ----------
function animate(g, t, dt) {
  const V = V3, ph = g.ph, a = g.act, fa = g.fact;
  for (const key in V.models) V.models[key].visible = false;
  const setC = (side, c, pos, face) => { const m = V.models[side + c.type]; if (!m) return null; m.visible = c.alive || (ph === 'mine' || ph === 'theirs' || ph === 'swap'); const u = m.userData;
    m.position.set(pos[0], 0, pos[2]); m.rotation.y = face; const hop = Math.abs(Math.sin(t * 3.2 + (side === 'me' ? 0 : 1.3))); u.body.position.y = hop * 0.08; u.body.scale.set(1 + (1 - hop) * 0.04, 1 - (1 - hop) * 0.06, 1 + (1 - hop) * 0.04);
    u.parts.forEach((p, i) => { p.scale.y = 1 + Math.sin(t * 14 + i * 2) * (c.type === 'fire' ? 0.18 : 0.04); }); u.skinM.emissive.setHex(0x000000); m.scale.setScalar(1); u.shield.visible = false; return m; };
  const cp = W3.cam.position, mix = (a, b, u) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * u;      // each critter turns a little towards the camera, so you see both faces
  const me = mine(g), foe = theirs(g), faceMe = mix(Math.atan2(FOEP[0] - MEP[0], FOEP[2] - MEP[2]), Math.atan2(cp.x - MEP[0], cp.z - MEP[2]), 0.55), faceFoe = mix(Math.atan2(MEP[0] - FOEP[0], MEP[2] - FOEP[2]), Math.atan2(cp.x - FOEP[0], cp.z - FOEP[2]), 0.3);
  const mm = me && setC('me', me, MEP, faceMe), fm = foe && setC('foe', foe, FOEP, faceFoe);
  if (mm) { const u = mm.userData; u.shield.visible = g.guard; if (!me.alive) { const s = clamp(1 - g.pt / 0.6, 0, 1); mm.scale.setScalar(Math.max(0.001, s)); }
    if (ph === 'mine' && a && a.k === 'attack') { const l = Math.sin(clamp(g.pt / 0.38, 0, 1) * Math.PI) * 0.6; mm.position.x += Math.sin(faceMe) * l; mm.position.z += Math.cos(faceMe) * l; }
    if (ph === 'theirs' && fa && fa.hit && !g.guard && g.pt < 0.6) { u.skinM.emissive.setHex(0xff2a2a); mm.position.x -= Math.sin(faceMe) * 0.2; }
    if ((ph === 'swap' && g.swapWho === 'me') || (ph === 'mine' && a && a.k === 'switch')) { const s = easeOut(clamp(g.pt / 0.35, 0, 1)); mm.scale.setScalar(Math.max(0.001, s)); } }
  if (fm) { const u = fm.userData; u.shield.visible = g.foeGuard || (ph === 'theirs' && fa && fa.k === 'guard') || (ph === 'choose' && g.intent && g.intent.k === 'guard' && false);
    if (!foe.alive && !g.caught) fm.scale.setScalar(Math.max(0.001, clamp(1 - g.pt / 0.6, 0, 1)));
    if (ph === 'mine' && a && a.k === 'attack' && a.hit && g.pt < 0.6) { u.skinM.emissive.setHex(0xffffff); u.skinM.emissiveIntensity = 0.6; fm.position.x -= Math.sin(faceFoe) * 0.25; fm.position.z -= Math.cos(faceFoe) * 0.25; } else u.skinM.emissiveIntensity = 1;
    if (ph === 'theirs' && fa && fa.dmg != null) { const l = Math.sin(clamp(g.pt / 0.42, 0, 1) * Math.PI) * (fa.big ? 0.9 : 0.5); fm.position.x += Math.sin(faceFoe) * l; fm.position.z += Math.cos(faceFoe) * l; }
    if (g.intent && g.intent.k === 'big' && ph === 'choose') { u.skinM.emissive.setHex(0xff3a1a); u.skinM.emissiveIntensity = 0.25 + Math.sin(t * 10) * 0.2; }
    if (ph === 'swap' && g.swapWho === 'foe') fm.scale.setScalar(Math.max(0.001, easeOut(clamp(g.pt / 0.35, 0, 1))));
    if (g.caught) { const s = clamp(1 - (g.pt - 1.2) / 0.3, 0, 1); fm.scale.setScalar(Math.max(0.001, s)); } }
  // the shot: a glowing ball of the attacker's type
  V.shot.visible = false; V.charm.visible = false;
  const fly = (from, to, u, col, big) => { V.shot.visible = true; V.shotM.color.setHex(col); V.shotM.emissive.setHex(col); V.shotGlow.material.color.setHex(col); V.shot.scale.setScalar(big ? 1.7 : 1); V.shot.position.set(lerp(from[0], to[0], u), 0.7 + Math.sin(u * Math.PI) * 0.6, lerp(from[2], to[2], u)); };
  if (ph === 'mine' && a && a.k === 'attack' && !a.hit) fly(MEP, FOEP, clamp(g.pt / 0.38, 0, 1), TYPEHEX[me.type]);
  if (ph === 'theirs' && fa && fa.dmg != null && !fa.hit) fly(FOEP, MEP, clamp(g.pt / 0.42, 0, 1), TYPEHEX[foe.type], fa.big);
  if (ph === 'mine' && a && a.k === 'catch') { V.charm.visible = !g.caught || g.pt < 1.5; const u = clamp(g.pt / 0.4, 0, 1), wob = g.pt > 0.4 ? Math.sin(g.pt * 18) * 0.25 * clamp(1.5 - g.pt, 0, 1) : 0; V.charm.position.set(lerp(MEP[0], FOEP[0], u), 0.9 + Math.sin(u * Math.PI) * 1.2, lerp(MEP[2], FOEP[2], u) + 0.6 * u); V.charm.rotation.set(t * 6, t * 4 + wob, wob); if (g.pt > 0.4 && fm && !a.hit) fm.scale.setScalar(Math.max(0.001, 1 - clamp((g.pt - 0.4) / 0.25, 0, 1))); }
}
let IG = null; function idleG() { if (!IG || IG.over) { IG = newGame(Math.max(5, store.get('level', 1) | 0), { seed: (Math.random() * 1e6) | 0 }); IG.mem = {}; } honest(IG, { react: 0.3, acc: 0.9 }, IG.mem); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#10241a'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D meadow.', W / 2, H / 2); return; }
  const g = G || idleG(), t = now;
  if (V.sky !== g.weather) { V.sky = g.weather; W3.setSky(g.weather, { azim: 160 }); W3.scene.environmentIntensity = 0.9; V.fill.intensity = g.weather === 'dusk' ? 0.5 : 0.9; }
  if (V.place !== g.place) { V.place = g.place; const P = GROUNDS[g.place]; V.groundM.color.setHex(P.g); V.ringM.color.setHex(P.ring); V.bushM.color.setHex([0x3a7a2a, 0x6a8a3a, 0xb8601a, 0xdde4ea][g.place]); }
  placeCam(); animate(g, t, dt);
  W3.setFocus(0, 0.5, 0, 6); W3.render(dt);
  if (G) hud(G, t);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 1.1 ? 1 : 1 - (t2.t - 1.1) / 0.4; ctx.globalAlpha = Math.max(0, al); const sc = t2.t < 0.12 ? 1.35 - t2.t / 0.12 * 0.35 : 1; ctx.font = `800 ${Math.round(t2.size * k * sc)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(20,10,30,.6)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 22); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 22); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30;
    ctx.fillStyle = 'rgba(20,30,24,.85)'; rrect(W / 2 - w / 2, H * 0.55 - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.55 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,40,40,${FX.red * 0.14})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,248,210,${FX.flash * 0.35})`; ctx.fillRect(0, 0, W, H); }
}
// ---------- the 2D layer ----------
function hpBar(x, y, w, h, c, key) { const f = clamp(c.hp / c.max, 0, 1); ui.hpShow[key] = ui.hpShow[key] == null ? f : ui.hpShow[key] + (f - ui.hpShow[key]) * 0.12; const s = ui.hpShow[key];
  ctx.fillStyle = 'rgba(0,0,0,.45)'; rrect(x, y, w, h, h / 2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.35)'; if (s > f) { rrect(x, y, w * s, h, h / 2); ctx.fill(); } ctx.fillStyle = f > 0.5 ? '#5ee08a' : f > 0.22 ? '#ffd23a' : '#ff5a4a'; if (f > 0) { rrect(x, y, Math.max(h, w * f), h, h / 2); ctx.fill(); } }
function panel(x, y, w, h) { ctx.fillStyle = 'rgba(16,22,34,.78)'; rrect(x, y, w, h, 14); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 1.5; rrect(x, y, w, h, 14); ctx.stroke(); }
// the buttons (part5 reads the same list for taps): ATTACK, GUARD, the bench, CATCH or BERRY
function buttons(G) {
  const bw = W - 24, y1 = H - 82 * k - 14, h1 = 64 * k, out = [], on = G.ph === 'choose' && !G.over && !G.lessonWait;
  out.push({ k: 'attack', x: 12, y: y1, w: bw * 0.6, h: h1, on }); out.push({ k: 'guard', x: 12 + bw * 0.62, y: y1, w: bw * 0.38, h: h1, on });
  const y2 = y1 - 60 * k, r = 25 * k; bench(G).forEach((i, j) => out.push({ k: 'bench', i, x: 12 + j * (r * 2 + 12), y: y2, w: r * 2, h: r * 2, on: on && G.me[i].alive }));
  if (G.cfg.wild && !G.lesson) out.push({ k: 'catch', x: W - 12 - 96 * k, y: y2, w: 96 * k, h: r * 2, on: on && canCatch(G) });
  else if (G.berry > 0) out.push({ k: 'berry', x: W - 12 - 96 * k, y: y2, w: 96 * k, h: r * 2, on: on && mine(G).hp < mine(G).max * 0.9 });
  return out;
}
function hud(G, t) {
  const me = mine(G), foe = theirs(G); ctx.textBaseline = 'middle';
  // the foe: name, type, health, the rest of its team, and what it will do next
  if (foe) { const x = 12, y = (G.lesson ? 150 : 44) * k, w = W * 0.62, h = 58 * k; panel(x, y, w, h); ctx.textAlign = 'left'; ctx.font = `800 ${Math.round(16 * k)}px ${TF}`; ctx.fillStyle = '#fff'; ctx.fillText(`${TI[foe.type]} ${foe.name}`, x + 12, y + 18 * k); ctx.textAlign = 'right'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillText(`Lv ${foe.lv}`, x + w - 12, y + 18 * k);
    hpBar(x + 12, y + 34 * k, w - 24, 10 * k, foe, 'f' + G.fi); if (!G.lesson && G.foe.length > 1) { for (let i = 0; i < G.foe.length; i++) { ctx.fillStyle = G.foe[i].alive ? '#ffffff' : 'rgba(255,255,255,.2)'; ctx.beginPath(); ctx.arc(x + 14 + i * 13 * k, y + h + 9 * k, 4 * k, 0, TAU); ctx.fill(); } }
    if (G.intent && (G.ph === 'choose' || G.ph === 'ring')) { const I = INTENT[G.intent.k] || INTENT.hit, ix = x + w + 8, iw = W - ix - 12, big = G.intent.k === 'big', pul = big ? 1 + Math.sin(t * 10) * 0.05 : 1;
      ctx.save(); ctx.translate(ix + iw / 2, y + h / 2); ctx.scale(pul, pul); ctx.fillStyle = big ? 'rgba(120,20,20,.85)' : 'rgba(16,22,34,.78)'; rrect(-iw / 2, -h / 2, iw, h, 14); ctx.fill(); if (big) { ctx.strokeStyle = '#ff6a5a'; ctx.lineWidth = 2.5; rrect(-iw / 2, -h / 2, iw, h, 14); ctx.stroke(); }
      ctx.textAlign = 'center'; ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillText('NEXT', 0, -h / 2 + 11 * k); ctx.font = `${Math.round(18 * k)}px sans-serif`; ctx.fillText(I[0], 0, -2 * k); ctx.font = `800 ${Math.round(11 * k)}px ${TF}`; ctx.fillStyle = I[2]; ctx.fillText(I[1], 0, h / 2 - 11 * k); ctx.restore(); } }
  // you: your critter's name and health, the matchup
  if (me) { const B = buttons(G), y = B[0].y - 60 * k - 62 * k, x = 12, w = W - 24, h = 52 * k; panel(x, y, w, h); ctx.textAlign = 'left'; ctx.font = `800 ${Math.round(16 * k)}px ${TF}`; ctx.fillStyle = '#fff'; ctx.fillText(`${TI[me.type]} ${me.name}`, x + 12, y + 17 * k);
    ctx.textAlign = 'right'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillText(`${Math.ceil(me.hp)} / ${me.max}`, x + w - 12, y + 17 * k); hpBar(x + 12, y + 32 * k, w - 24, 10 * k, me, 'm' + G.ai);
    // the buttons
    for (const b of B) { const al = b.on ? 1 : 0.4; ctx.globalAlpha = al;
      if (b.k === 'attack') { const e = foe ? eff(me.type, foe.type) : 1; ctx.fillStyle = TCOL[me.type]; rrect(b.x, b.y, b.w, b.h, 16); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.18)'; rrect(b.x, b.y + b.h * 0.6, b.w, b.h * 0.4, 16); ctx.fill();
        ctx.textAlign = 'left'; ctx.fillStyle = '#1a1206'; ctx.font = `800 ${Math.round(19 * k)}px ${TF}`; ctx.fillText('ATTACK', b.x + 14, b.y + b.h * 0.36); ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillText(`${TI[me.type]} ${SPECIES[me.type].move}`, b.x + 14, b.y + b.h * 0.74);
        if (e !== 1) { ctx.textAlign = 'right'; ctx.font = `800 ${Math.round(16 * k)}px ${TF}`; ctx.fillStyle = e > 1 ? '#1a4a12' : '#5a1a12'; ctx.fillText(e > 1 ? '×2' : '×½', b.x + b.w - 12, b.y + b.h * 0.42); } }
      if (b.k === 'guard') { ctx.fillStyle = G.intent && G.intent.k === 'big' && b.on ? '#9ad8ff' : '#e8eef8'; rrect(b.x, b.y, b.w, b.h, 16); ctx.fill(); ctx.textAlign = 'center'; ctx.fillStyle = '#12203a'; ctx.font = `800 ${Math.round(18 * k)}px ${TF}`; ctx.fillText('🛡 GUARD', b.x + b.w / 2, b.y + b.h / 2); }
      if (b.k === 'bench') { const c = G.me[b.i], cx = b.x + b.w / 2, cy = b.y + b.h / 2, r = b.w / 2, e = foe ? eff(c.type, foe.type) : 1; ctx.fillStyle = 'rgba(16,22,34,.85)'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 4 * k; ctx.beginPath(); ctx.arc(cx, cy, r - 2 * k, 0, TAU); ctx.stroke();
        ctx.strokeStyle = c.hp / c.max > 0.5 ? '#5ee08a' : c.hp / c.max > 0.22 ? '#ffd23a' : '#ff5a4a'; ctx.beginPath(); ctx.arc(cx, cy, r - 2 * k, -Math.PI / 2, -Math.PI / 2 + TAU * c.hp / c.max); ctx.stroke(); ctx.textAlign = 'center'; ctx.font = `${Math.round(20 * k)}px sans-serif`; ctx.fillStyle = '#fff'; ctx.fillText(c.alive ? TI[c.type] : '✖', cx, cy + 1);
        if (e > 1 && c.alive) { ctx.font = `800 ${Math.round(10 * k)}px ${TF}`; ctx.fillStyle = '#ffe08a'; ctx.fillText('×2', cx + r * 0.8, cy - r * 0.8); } }
      if (b.k === 'catch' || b.k === 'berry') { ctx.fillStyle = b.k === 'catch' ? (b.on ? '#ffe07a' : '#8a8a7a') : '#ff8a9a'; rrect(b.x, b.y, b.w, b.h, b.h / 2); ctx.fill(); ctx.textAlign = 'center'; ctx.fillStyle = '#2a1a06'; ctx.font = `800 ${Math.round(14 * k)}px ${TF}`; ctx.fillText(b.k === 'catch' ? '✨ CATCH' : `🍓 BERRY`, b.x + b.w / 2, b.y + b.h / 2); }
      ctx.globalAlpha = 1; }
    if (G.ph === 'choose' && !G.lesson && G.N <= 4) { ctx.textAlign = 'left'; ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.75)'; const bx = 12 + bench(G).length * (50 * k + 12) + 4; if (bench(G).length) ctx.fillText('← tap to send in', bx, B[0].y - 60 * k + 25 * k); } }
  // the timing ring round the foe
  if (G.ph === 'ring' && G.act) { const a = G.act, c = G.cfg, p = headAt('foe', G), R0 = 30 * k, tt = G.pt - a.wait, u = tt / (0.6 * c.ringT);
    ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 6 * k; ctx.beginPath(); ctx.arc(p.x, p.y + 26 * k, R0, 0, TAU); ctx.stroke();
    if (tt >= 0 && a.tap == null) { const r = R0 * (1 + 2.6 * (1 - u)); if (r > 2) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4 * k; ctx.beginPath(); ctx.arc(p.x, p.y + 26 * k, r, 0, TAU); ctx.stroke(); } }
    if (tt < 0) { ctx.textAlign = 'center'; ctx.font = `800 ${Math.round(13 * k)}px ${TF}`; ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillText('GET READY...', p.x, p.y - 30 * k); } }
  if (G.lesson) lessonPanel(G);
}
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { coachPanel(G); }
