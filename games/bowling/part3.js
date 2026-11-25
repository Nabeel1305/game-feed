// ===================== THE VIEW: Strike Alley in 3D (three.js through tools/world3d.js) =====================
// From just behind the foul line: a polished maple lane with its arrows and dots, gutters both sides, neighbouring lanes in
// the gloom, neon along the dividers in the colour of the place you bowl in, and ten white pins under a bright light at the
// far end. The camera rides behind the ball as it rolls, then holds on the pins as they fly. The 2D layer draws the score,
// the frames card, the run, the line your roll will take (with its curl), the power of your pull, and the calls.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { snap: true, touch: null, cam: null, pinDir: {}, swept: {}, roll: 0, lastPhase: null, sline: null };
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 2.8) { if (HEADLESS || !(G && G.lesson)) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 140) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40 * k, t: 0, life: 0.45 + Math.random() * 0.4, col, r: (1.5 + Math.random() * 3) * k }); } if (PARTS.length > 220) PARTS.splice(0, PARTS.length - 220); }
function fxStep(dt) {
  FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2.5); FX.red = Math.max(0, FX.red - dt * 1.8);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.5) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * k * dt; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; }
}
const hex = n => '#' + n.toString(16).padStart(6, '0');
// ---------- textures ----------
function woodTex() { const c = document.createElement('canvas'); c.width = 256; c.height = 1024; const g = c.getContext('2d'), R = W3.rng(4);
  const boards = 39, bw = c.width / boards; for (let i = 0; i < boards; i++) { const l = 50 + R() * 9; g.fillStyle = `hsl(30,${55 + R() * 12}%,${l}%)`; g.fillRect(i * bw, 0, bw + 1, c.height);
    for (let j = 0; j < 14; j++) { g.fillStyle = `rgba(120,70,30,${0.04 + R() * 0.06})`; g.fillRect(i * bw + R() * bw, R() * c.height, 0.6, 30 + R() * 160); } g.fillStyle = 'rgba(90,50,20,.18)'; g.fillRect(i * bw, 0, 0.7, c.height); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
function ballTex(b) { const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d'), R = W3.rng(b.id.length * 7 + 3);
  g.fillStyle = hex(b.col); g.fillRect(0, 0, 256, 128);
  for (let i = 0; i < 26; i++) { g.strokeStyle = hex(b.col2) + (b.id === 'house' ? '30' : '70'); g.lineWidth = 2 + R() * 7; g.beginPath(); let x = R() * 256, y = R() * 128; g.moveTo(x, y); for (let j = 0; j < 4; j++) { x += (R() - 0.5) * 90; y += (R() - 0.5) * 50; g.quadraticCurveTo(x + (R() - 0.5) * 40, y + (R() - 0.5) * 40, x, y); } g.stroke(); }
  if (b.id === 'galaxy') for (let i = 0; i < 90; i++) { g.fillStyle = 'rgba(255,255,255,' + (0.4 + R() * 0.6) + ')'; g.fillRect(R() * 256, R() * 128, 1.2, 1.2); }
  g.fillStyle = '#0a0a0a'; for (const [x, y, r] of [[120, 42, 7], [138, 42, 7], [129, 70, 8.5]]) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
function pinTex() { const c = document.createElement('canvas'); c.width = 16; c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#fafafa'; g.fillRect(0, 0, 16, 128); g.fillStyle = '#d0202a'; g.fillRect(0, 30, 16, 6); g.fillRect(0, 40, 16, 6); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
// a pin: 38 cm tall, widest 12 cm across at its belly, a slim neck, a round head
function pinGeo() { const P = [[0, 0], [0.026, 0], [0.04, 0.03], [0.058, 0.1], [0.06, 0.13], [0.052, 0.18], [0.03, 0.24], [0.022, 0.27], [0.026, 0.31], [0.032, 0.345], [0.028, 0.37], [0.012, 0.381], [0, 0.382]].map(p => new THREE.Vector2(p[0], p[1]));
  const g = new THREE.LatheGeometry(P, 18); const uv = g.attributes.uv, pos = g.attributes.position; for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - pos.getY(i) / 0.382); return g; }
// ---------- the world ----------
function buildWorld() {
  if (V3) return V3; const T = THREE; if (!W3 || !W3.init({ canvas: $('gl'), fov: 58, far: 120, near: 0.05 })) { V3 = { none: true }; return V3; }
  const S = W3.scene; S.traverse(o => { if (o.material && o.material.uniforms && o.material.uniforms.sunPosition) o.visible = false; });
  const V = { pins: [], neon: [], lanesN: [] }, wt = woodTex(), L = LANE_L;
  const laneM = new T.MeshStandardMaterial({ map: wt, roughness: 0.42, metalness: 0.0, envMapIntensity: 0.9 }); wt.wrapT = T.RepeatWrapping; wt.repeat.set(1, 3);
  const apM = new T.MeshStandardMaterial({ map: wt.clone(), roughness: 0.45, color: 0x9a7a5a });
  const darkM = new T.MeshStandardMaterial({ color: 0x15121c, roughness: 0.8 }), gutM = new T.MeshStandardMaterial({ color: 0x2a2a34, roughness: 0.35, metalness: 0.6, side: T.DoubleSide });
  const pinG = pinGeo(), pinM = new T.MeshStandardMaterial({ map: pinTex(), roughness: 0.25 }), goldM = new T.MeshStandardMaterial({ color: 0xffc830, roughness: 0.2, metalness: 0.8, emissive: 0x5a3a00, emissiveIntensity: 0.5 });
  function oneLane(cx, mine) {
    const lane = new T.Mesh(new T.PlaneGeometry(LANE_W, L + 1.4), laneM); lane.rotation.x = -Math.PI / 2; lane.position.set(cx, 0, -(L + 1.4) / 2 + 0.0); lane.receiveShadow = true; S.add(lane);
    const ap = new T.Mesh(new T.PlaneGeometry(LANE_W + 0.5, 4.5), apM); ap.rotation.x = -Math.PI / 2; ap.position.set(cx, -0.002, 2.25); S.add(ap);
    const foul = new T.Mesh(new T.PlaneGeometry(LANE_W + 0.5, 0.025), new T.MeshBasicMaterial({ color: 0x222222 })); foul.rotation.x = -Math.PI / 2; foul.position.set(cx, 0.002, 0); S.add(foul);
    for (const sx of [-1, 1]) { const gg = new T.CylinderGeometry(0.12, 0.12, L + 1.4, 12, 1, true, 0, Math.PI); gg.rotateX(Math.PI / 2); gg.rotateZ(Math.PI / 2); const gm = new T.Mesh(gg, gutM); gm.rotation.z = 0; gm.scale.set(1, 0.6, 1); gm.position.set(cx + sx * (LANE_W / 2 + 0.115), -0.0, -(L + 1.4) / 2); S.add(gm); }
    // the arrows (4.6 m) and dots (2.1 m): darker inlaid wood
    const arM = new T.MeshBasicMaterial({ color: 0x5a2a14, transparent: true, opacity: 0.75 }); for (let i = -3; i <= 3; i++) { const sh = new T.Shape(); sh.moveTo(0, 0.18); sh.lineTo(-0.025, 0); sh.lineTo(0.025, 0); sh.closePath(); const m = new T.Mesh(new T.ShapeGeometry(sh), arM); m.rotation.x = -Math.PI / 2; m.position.set(cx + i * 0.127, 0.002, -(4.4 + Math.abs(i) * 0.3)); S.add(m);
      const d = new T.Mesh(new T.CircleGeometry(0.012, 10), arM); d.rotation.x = -Math.PI / 2; d.position.set(cx + i * 0.127, 0.002, -2.1); S.add(d); }
    // the pit and the masking unit over the pins
    const pit = new T.Mesh(new T.BoxGeometry(LANE_W + 0.5, 0.8, 1.4), darkM); pit.position.set(cx, -0.3, -L - 1.4); S.add(pit);
    const back = new T.Mesh(new T.BoxGeometry(LANE_W + 0.5, 1.6, 0.1), darkM); back.position.set(cx, 0.8, -L - 1.6); S.add(back);
    const mask = new T.Mesh(new T.BoxGeometry(LANE_W + 0.6, 0.7, 0.3), new T.MeshStandardMaterial({ color: 0x1a1430, roughness: 0.5, emissive: 0x1a1430, emissiveIntensity: 0.4 })); mask.position.set(cx, 1.0, -L + 0.25); S.add(mask);
    const strip = new T.Mesh(new T.BoxGeometry(LANE_W + 0.6, 0.05, 0.05), new T.MeshBasicMaterial({ color: 0x3ae0ff })); strip.position.set(cx, 0.66, -L + 0.42); S.add(strip); V.neon.push(strip.material);
    if (!mine) { const deco = []; for (const p of PINPOS) { const m = new T.Mesh(pinG, pinM); m.position.set(cx + p.x, 0, -p.z); S.add(m); deco.push(m); } V.lanesN.push(deco); }
  }
  for (const cx of [-2.4, -1.2, 0, 1.2, 2.4]) oneLane(cx, cx === 0);
  // the rivals' lanes are the two beside yours (25 Nov 2026): a ball for each
  V.rivalBalls = [-1.2, 1.2].map((cx, i) => { const m = new T.Mesh(new T.SphereGeometry(BR, 20, 14), new T.MeshStandardMaterial({ color: i ? 0xff8a2a : 0x7a3aff, roughness: 0.25, metalness: 0.1 })); m.position.set(cx, BR, 0); m.visible = false; S.add(m); return m; });
  // dividers between the lanes, with a neon edge
  for (const cx of [-1.8, -0.6, 0.6, 1.8]) { const dv = new T.Mesh(new T.BoxGeometry(0.1, 0.12, L + 1.4), darkM); dv.position.set(cx, 0.03, -(L + 1.4) / 2); S.add(dv); const n = new T.Mesh(new T.BoxGeometry(0.02, 0.02, L + 1.4), new T.MeshBasicMaterial({ color: 0x3ae0ff })); n.position.set(cx, 0.1, -(L + 1.4) / 2); S.add(n); V.neon.push(n.material); }
  // the room: floor, a long back wall with a glowing sign, a ceiling with lights
  const floor = new T.Mesh(new T.PlaneGeometry(30, 50), new T.MeshStandardMaterial({ color: 0x1c1630, roughness: 0.9 })); floor.rotation.x = -Math.PI / 2; floor.position.set(0, -0.02, -14); S.add(floor);
  const wall = new T.Mesh(new T.PlaneGeometry(30, 8), new T.MeshStandardMaterial({ color: 0x120c22, roughness: 0.9 })); wall.position.set(0, 3, -L - 1.7); S.add(wall);
  const sc = document.createElement('canvas'); sc.width = 512; sc.height = 96; V.signC = sc; V.signT = new T.CanvasTexture(sc); V.signT.colorSpace = T.SRGBColorSpace;
  const sign = new T.Mesh(new T.PlaneGeometry(4.4, 0.82), new T.MeshBasicMaterial({ map: V.signT, transparent: true })); sign.position.set(0, 2.5, -L + 0.1); S.add(sign);
  for (const sx of [-14, 14]) { const sw = new T.Mesh(new T.PlaneGeometry(50, 8), new T.MeshStandardMaterial({ color: 0x140e26, roughness: 0.9 })); sw.rotation.y = sx < 0 ? Math.PI / 2 : -Math.PI / 2; sw.position.set(sx * 0.36, 3, -14); S.add(sw); }
  // my pins
  for (const p of PINPOS) { const m = new T.Mesh(pinG, pinM); m.castShadow = true; m.position.set(p.x, 0, -p.z); S.add(m); V.pins.push(m); } V.pinM = pinM; V.goldM = goldM;
  // the ball
  V.ballM = new T.MeshStandardMaterial({ roughness: 0.12, metalness: 0.1, envMapIntensity: 1.6 }); V.ball = new T.Mesh(new T.SphereGeometry(BR, 28, 18), V.ballM); V.ball.castShadow = true; S.add(V.ball); V.ballSpin = new T.Quaternion();
  const shadow = new T.Mesh(new T.CircleGeometry(BR * 1.1, 20), new T.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.35, depthWrite: false })); shadow.rotation.x = -Math.PI / 2; S.add(shadow); V.shadow = shadow;
  // the line you rolled your best strike along: a pale ghost ball at the foul line (L10)
  V.ghost = new T.Mesh(new T.SphereGeometry(BR, 18, 12), new T.MeshBasicMaterial({ color: 0xcfefff, transparent: true, opacity: 0.22, depthWrite: false })); S.add(V.ghost);
  // light: bright over the pins, softer down the lane
  const pl = new T.PointLight(0xfff4e8, 16, 9, 1.6); pl.position.set(0, 2.6, -L + 0.5); S.add(pl); V.pinLight = pl;
  for (let z = 3; z < 16; z += 6) { const l2 = new T.PointLight(0xe8e0ff, 1.6, 7, 1.8); l2.position.set(1.8, 2.8, -z); S.add(l2); }
  V.glow = new T.PointLight(0x3ae0ff, 6, 6, 1.6); V.glow.position.set(0, 0.5, -L + 0.8); S.add(V.glow);
  V3 = V; applyQuality(); return V;
}
function applyQuality() { if (W3 && W3.ok) W3.setQuality(stepN); }
function setPlace(V, i) { const P = PLACES[i], c = new THREE.Color(P.glow); for (const m of V.neon) m.color.copy(c); V.glow.color.copy(c);
  const g = V.signC.getContext('2d'); g.clearRect(0, 0, 512, 96); g.font = `400 56px ${TF}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = hex(P.glow); g.shadowBlur = 18; g.fillStyle = hex(P.glow); g.fillText(P.name.toUpperCase(), 256, 50); g.shadowBlur = 0; g.fillStyle = '#fff'; g.globalAlpha = 0.85; g.fillText(P.name.toUpperCase(), 256, 50); V.signT.needsUpdate = true; }
function setBall(V, b) { if (V.ballM.map) V.ballM.map.dispose(); V.ballM.map = ballTex(b); V.ballM.needsUpdate = true; }
const SV = new (window.THREE ? THREE.Vector3 : Object)();
function scr(x, y, z) { if (!V3 || V3.none) return { x: W / 2, y: H / 2, front: true }; SV.set(x, y, z); return W3.screen(SV); }
// where the ball is now, in world coordinates
function ballPos(g) { const b = g.b; if (g.phase === 'aim' || !b) return { x: g.aim.x, y: BR, z: 0.25 }; return { x: b.x, y: b.gutter ? BR - 0.06 : BR, z: -b.z }; }
// the line a roll would take from here (the same physics as the game, no pins): dots down the lane
function pathPts(g, x, a, p, frac) { const c = g.cfg, v = (5.4 + p * 4.2) * c.power, hook = g.ball.hook * (x > 0.05 ? 1 : x < -0.05 ? -1 : (a >= 0 ? -1 : 1)) * -1; let bx = x, bz = 0, vx = Math.sin(a) * v, vz = Math.cos(a) * v; const h = 1 / 60, out = [];
  while (bz < LANE_L * frac) { const u = bz / LANE_L; if (u > c.oil) vx += hook * c.dry * 1.25 * h * Math.min(1, (u - c.oil) / 0.15); bx += vx * h; bz += vz * h; vz *= 1 - 0.012 * h; out.push([bx, bz]); if (Math.abs(bx) > LANE_W / 2) { out.gutter = true; break; } } return out; }
// ---------- events ----------
function onEvent(G, e) {
  const bp = ballPos(G), p = scr(bp.x, bp.y, bp.z), pins = scr(0, 0.3, -HEAD_Z - 0.3), cx = W / 2;
  switch (e.k) {
    case 'start': ui.pinDir = {}; ui.swept = {};
      say(G.cfg.kind === 'spares' ? `MAKE ${G.cfg.target} SPARES` : G.cfg.kind === 'strikeout' ? `${G.cfg.target} STRIKE${G.cfg.target > 1 ? 'S' : ''} IN ${G.cfg.frames} BALLS` : G.rivals ? `BEAT ${G.rivals[0].name.toUpperCase()} AND ${G.rivals[1].name.toUpperCase()}` : `SCORE ${G.cfg.target}`, cx, H * 0.4, '#bff4ff', 24); sfx.go();
      if (G.N <= 2) tip('roll', 'Touch to line the ball up. Pull your thumb down toward you and let go to roll.', 3.4); if (G.cfg.kind === 'spares') tip('spares', 'Spare challenge: pins are already standing. Knock them all down with one ball.', 3.2); if (G.cfg.kind === 'strikeout') tip('so', 'Strike-out: every ball is a fresh rack. Only strikes count.', 3); break;
    case 'bowl': sfx.release(); break;
    case 'pin': ui.pinHits = (ui.pinHits || 0) + 1; sfx.pin(e.v, ui.pinHits); if (e.gold) { sfx.gold(); say('🪙 +5', pins.x, pins.y - 40 * k, '#ffd040', 22); } if (ui.pinHits === 4) { FX.shake = 4; } break;
    case 'gutter': sfx.gutter(); say('GUTTER', cx, H * 0.42, '#ffb4a8', 24); FX.red = 0.3; if (G.N <= 4) tip('gut', 'Too far to the side. Start nearer the middle, or pull straighter.', 2.6); break;
    case 'pit': break;
    case 'result': { ui.pinHits = 0; const run = G.run;
      if (e.kind === 'strike') { sfx.crash(); sfx.strike(run); FX.flash = 0.5; FX.shake = 10; vibe(HAP.best); say('STRIKE!', cx, H * 0.3, '#ffd040', 44); burst(pins.x, pins.y, '#ffd040', 30, 240); burst(pins.x, pins.y, '#3ae0ff', 18, 200);
        if (run >= 2) say(run === 2 ? 'DOUBLE!' : run === 3 ? 'TURKEY!' : `${run} IN A ROW!`, cx, H * 0.37, '#ffffff', 26);
        if (!HEADLESS && G.aim) { ui.sline = { x: G.aim.x, a: G.aim.a, p: G.aim.p, ball: G.ball.id }; store.set('sline', ui.sline); } }
      else if (e.kind === 'spare') { sfx.spare(run); vibe(HAP.sharp); say('SPARE!', cx, H * 0.3, '#8fe0ff', 36); burst(pins.x, pins.y, '#8fe0ff', 18, 180); if (run >= 2) say(`RUN ×${Math.min(3, 1 + 0.5 * (run - 1))}`, cx, H * 0.37, '#ffffff', 22); }
      else if (e.n > 0) { sfx.open(); say(e.split ? 'SPLIT!' : `${e.n}`, cx, H * 0.32, e.split ? '#ffb070' : '#ffffff', e.split ? 30 : 34); if (e.split) sfx.split(); }
      else if (!e.gutter) { sfx.open(); say('MISS', cx, H * 0.32, '#ffb4a8', 26); }
      if (e.pts > 0 && !G.lesson && G.cfg.kind === 'game') say(`+${e.pts}`, cx, H * 0.44, '#bff4ff', 22);
      if (e.split && G.N <= 8) tip('split', 'A split: aim at the pin on one side so it flies across into the other.', 3); break; }
    case 'second': for (const p of G.pins) if (!p.up) ui.swept[p.n] = 1; if (G.N <= 3) tip('second', 'Second ball: aim at the middle of the pins still standing.', 2.6); break;
    case 'frame': ui.pinDir = {}; ui.swept = {}; break;
    case 'lessonnext': if (e.first) hint = null; say('FIRST, A LESSON', cx, H * 0.36, '#ffe08a', 26); sfx.go(); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, cx, H * 0.44, '#9be3b5', 24); sfx.spare(e.n); break;
    case 'lessonmiss': coachMiss(); break;
    case 'lessondone': say('NOW THE REAL GAME!', cx, H * 0.36, '#ffe08a', 26); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); vibe(HAP.best); say(G.cfg.kind === 'game' ? 'YOU BEAT THEM BOTH!' : 'CHALLENGE DONE!', cx, H * 0.3, '#ffd040', 30); break;
    case 'lost': sfx.lose(); say('NOT THIS TIME', cx, H * 0.3, '#ffb4a8', 30); break;
  }
}
// ---------- the rivals bowl beside you ----------
// Each frame of yours, each rival bowls theirs on the lane beside you: a ball down the lane, the pins of their first roll go over, then
// (unless it was a strike) a second ball for the rest. What falls is what was dealt to them (G.rivals[i].frames), so the card is true.
const RV = [{ f: -1 }, { f: -1 }];
function rivalsAnim(V, g, dt) { if (!V.rivalBalls) return; const lanes = [V.lanesN[1], V.lanesN[2]], cxs = [-1.2, 1.2];
  for (let i = 0; i < 2; i++) { const st = RV[i], ball = V.rivalBalls[i], pins = lanes[i], fr = g.rivals && !g.lesson && g.frame < g.cfg.frames ? g.rivals[i].frames[g.frame] : null;
    if (!fr) { ball.visible = false; if (st.f !== -1) { st.f = -1; pins.forEach(m => { m.visible = true; m.rotation.set(0, 0, 0); }); } continue; }
    if (st.f !== g.frame || st.game !== g.rivals) { st.f = g.frame; st.game = g.rivals; st.t = -(0.6 + Math.random() * 2.2) - i * 0.8; st.roll = 0; st.down = []; pins.forEach(m => { m.visible = true; m.rotation.set(0, 0, 0); m.userData.f = 0; }); }
    st.t += dt; const marks = fr.marks, n1 = marks[0] === 'X' ? 10 : marks[0], n2 = marks[0] === 'X' ? 0 : marks[1] === '/' ? 10 - n1 : marks[1], T = 2.3;
    const roll = k2 => { const t0 = k2 * 4.2, u = (st.t - t0) / T; if (u >= 0 && u < 1.08) { ball.visible = true; ball.position.set(cxs[i] + Math.sin(u * 2.4 + i) * 0.12, BR, -u * (LANE_L - 0.6)); ball.rotation.x -= dt * 22; }
      if (st.roll === k2 && u >= 0.93) { st.roll = k2 + 1; const want = k2 === 0 ? n1 : n2, up = pins.map((m, j) => j).filter(j => !st.down.includes(j)); for (let q = 0; q < want && up.length; q++) { const j = k2 === 0 && q === 0 && want > 3 ? up.splice(0, 1)[0] : up.splice((Math.random() * up.length) | 0, 1)[0]; st.down.push(j); pins[j].userData.f = 0.001; pins[j].userData.d = Math.random() * 6.28; } } };
    ball.visible = false; roll(0); if (n1 < 10) roll(1);
    pins.forEach(m => { const f = m.userData.f; if (f > 0) { m.userData.f = Math.min(1, f + dt * 4); const a = m.userData.f * Math.PI / 2, d = m.userData.d; m.rotation.set(Math.cos(d) * a, 0, Math.sin(d) * a); if (m.userData.f >= 1 && st.t > 9.4) m.visible = false; } }); } }
// ---------- every frame in 3D ----------
const _ax = new (window.THREE ? THREE.Vector3 : Object)(), _q = new (window.THREE ? THREE.Quaternion : Object)();
function animate(g, t, dt) {
  const V = V3;
  rivalsAnim(V, g, dt);
  // pins: standing ones where the game has them; fallen ones tip over the way they were going and slide; swept ones vanish
  g.pins.forEach((p, i) => { const m = V.pins[i]; m.visible = !p.gone || (!p.up && !ui.swept[p.n] && g.phase !== 'aim'); if (!m.visible) return; m.material = p.gold ? V.goldM : V.pinM;
    if (p.up) { const w = Math.min(0.25, Math.hypot(p.vx, p.vz) * 0.4); m.position.set(p.x, 0, -p.z); m.rotation.set(-p.vz * 0.15 * (w > 0.01 ? 1 : 0), 0, -p.vx * 0.15 * (w > 0.01 ? 1 : 0)); return; }
    let d = ui.pinDir[p.n]; if (d == null) { d = ui.pinDir[p.n] = Math.atan2(p.vx || (Math.random() - 0.5), p.vz || 1); }
    const f = p.fall, tilt = f * Math.PI / 2 * 0.98; m.position.set(p.x, Math.sin(tilt) * 0.055, -p.z); _ax.set(-Math.cos(d), 0, -Math.sin(d)); m.quaternion.setFromAxisAngle(_ax, tilt); });
  // the ball: rolls (spin from its speed), curls; waits at the foul line under your thumb while you aim
  const bp = ballPos(g), b = g.b; V.ball.visible = !(b && b.stopped && g.phase !== 'aim');
  V.ball.position.set(bp.x, bp.y, bp.z); if (b && g.phase === 'roll' && !b.stopped) { const sp = Math.hypot(b.vx, b.vz) * dt / BR; _ax.set(-b.vz, 0, -b.vx).normalize(); _q.setFromAxisAngle(_ax, sp); V.ball.quaternion.premultiply(_q); }
  V.shadow.position.set(bp.x, 0.003, bp.z); V.shadow.visible = V.ball.visible && !(b && b.gutter && g.phase === 'roll');
  const sl = ui.sline || (HEADLESS ? null : (ui.sline = store.get('sline', null) || false)); V.ghost.visible = !!(sl && g.phase === 'aim' && !g.lesson && G); if (V.ghost.visible) V.ghost.position.set(sl.x, BR, 0.25);
  V.glow.intensity = 5 + 2 * Math.sin(t * 1.6) + FX.flash * 30; V.pinLight.intensity = 16 + FX.flash * 30;
}
function placeCam(g, dt) {
  const cam = W3.cam, asp = innerWidth / innerHeight; cam.fov = asp < 0.8 ? 40 : 30; cam.aspect = asp; cam.updateProjectionMatrix();
  const b = g.b, rolling = g.phase === 'roll' && b, after = g.phase === 'show' || (rolling && b.z > 12.6);
  let want, look;
  if (g.phase === 'aim') { want = { x: g.aim.x * 0.3, y: 1.0, z: 2.6 }; look = { x: 0, y: -0.15, z: -14 }; }
  else { const bz = rolling ? Math.min(b.z, 12.6) : 12.6; want = { x: (rolling ? b.x : 0) * 0.5, y: 0.8 - (bz / 12.6) * 0.15, z: -bz + 2.4 }; look = { x: 0, y: 0.0, z: -Math.min(LANE_L, bz + 7) }; }
  if (!ui.cam || ui.snap) { ui.cam = Object.assign({}, want, { lx: look.x, ly: look.y, lz: look.z }); ui.snap = false; }
  const c = ui.cam, e = 1 - Math.exp(-dt * (g.phase === 'aim' ? 4 : 9)); c.x += (want.x - c.x) * e; c.y += (want.y - c.y) * e; c.z += (want.z - c.z) * e; c.lx += (look.x - c.lx) * e; c.ly += (look.y - c.ly) * e; c.lz += (look.z - c.lz) * e;
  const sh = FX.shake ? (Math.random() - 0.5) * FX.shake * 0.004 : 0;
  cam.position.set(c.x + sh, c.y + sh, c.z); cam.lookAt(c.lx, c.ly, c.lz); cam.updateMatrixWorld();
}
let IG = null; function idleG() { if (!IG || IG.over) { IG = newGame(Math.max(2, store.get('level', 1) | 0), { seed: (Math.random() * 1e6) | 0 }); IG.mem = {}; ui.snap = true; } honest(IG, { react: 0.6, acc: 0.95 }, IG.mem); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#160a2a'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D alley.', W / 2, H / 2); return; }
  const g = G || idleG(), t = now;
  if (!V.sky) { V.sky = 1; W3.setSky('noon', {}); W3.scene.background = new THREE.Color(0x0a0614); W3.scene.fog.near = 40; W3.scene.fog.far = 120; W3.S.hemiI = 0.32; W3.sun.intensity = 0.12; W3.S.exposure = 0.62; W3.scene.environmentIntensity = 0.22; }
  if (V.place !== g.place) { V.place = g.place; setPlace(V, g.place); }
  if (V.ballId !== g.ball.id) { V.ballId = g.ball.id; setBall(V, g.ball); }
  if (ui.lastPhase !== g.phase) { if (g.phase === 'aim' && ui.lastPhase === 'show') { /* glide back to the foul line */ } ui.lastPhase = g.phase; }
  placeCam(g, dt); animate(g, t, dt); W3.setFocus(0, 0.2, -HEAD_Z, 10); W3.render(dt);
  if (G) hud(G, t);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 1.1 ? 1 : 1 - (t2.t - 1.1) / 0.4; ctx.globalAlpha = Math.max(0, al); const sc = t2.t < 0.12 ? 1.35 - t2.t / 0.12 * 0.35 : 1; ctx.font = `400 ${Math.round(t2.size * k * sc)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(12,6,30,.65)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 22); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 22); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30;
    ctx.fillStyle = 'rgba(22,10,42,.88)'; rrect(W / 2 - w / 2, H * 0.52 - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.52 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,40,60,${FX.red * 0.15})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,250,235,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); }
}
// ---------- the 2D layer ----------
function panel(x, y, w, h) { ctx.fillStyle = 'rgba(22,10,42,.72)'; rrect(x, y, w, h, 14); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 1.5; rrect(x, y, w, h, 14); ctx.stroke(); }
function hud(G, t) {
  const c = G.cfg; ctx.textBaseline = 'middle';
  if (!G.lesson) {
    const x = 12, y = 48 * k, w = W - 24, h = 70 * k; panel(x, y, w, h);
    ctx.textAlign = 'left'; ctx.font = `400 ${Math.round(26 * k)}px ${TF}`; const rv = G.rivals && c.kind === 'game' ? [0, 1].map(i => ({ name: G.rivals[i].name, tot: rivalNow(G, i) })) : null, lead = rv ? Math.max(rv[0].tot, rv[1].tot) : c.target, reach = G.score >= lead; ctx.fillStyle = reach ? '#7af0a0' : '#fff'; const sTxt = String(G.score); ctx.fillText(sTxt, x + 12, y + 20 * k);
    const tw = ctx.measureText(sTxt).width; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.75)'; if (rv) { let rx = x + 20 + tw; ctx.font = `800 ${Math.round(11.5 * k)}px ${BC}`; for (const r of rv) { const tx = `${r.name.toUpperCase()} ${r.tot}`; ctx.fillStyle = r.tot > G.score ? '#ff9a8a' : 'rgba(255,255,255,.8)'; ctx.fillText(tx, rx, y + 22 * k); rx += ctx.measureText(tx).width + 10 * k; } }
    else ctx.fillText(c.kind === 'spares' ? `/ ${c.target} spares` : c.kind === 'strikeout' ? `/ ${c.target} strikes` : `/ ${c.target}`, x + 18 + tw, y + 22 * k);
    ctx.textAlign = 'right'; ctx.fillStyle = '#fff'; ctx.font = `800 ${Math.round(13 * k)}px ${BC}`; ctx.fillText(c.kind === 'strikeout' ? `ball ${Math.min(c.frames, G.frame + 1)} of ${c.frames}` : `frame ${Math.min(c.frames, G.frame + 1)} of ${c.frames}`, x + w - 12, y + 14 * k);
    ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillStyle = G.run >= 2 ? '#ffd040' : 'rgba(255,255,255,.8)'; ctx.fillText((G.run >= 1 && c.kind === 'game' ? `run ×${Math.min(3, 1 + 0.5 * G.run)} next · ` : '') + `🪙 ${G.coins}`, x + w - 12, y + 29 * k);
    // the card: one box a frame, X for a strike, / for a spare
    const n = c.frames, bw = Math.min(30 * k, (w - 24) / n - 3), bx0 = x + 12, by = y + 44 * k;
    for (let i = 0; i < n; i++) { const f = i < G.frames.length ? G.frames[i] : i === G.frame ? G.cur || [] : null, bx = bx0 + i * (bw + 3);
      ctx.fillStyle = i === G.frame && !G.over ? 'rgba(58,224,255,.25)' : 'rgba(255,255,255,.08)'; rrect(bx, by, bw, 18 * k, 4); ctx.fill();
      if (f && f.length) { ctx.textAlign = 'center'; ctx.font = `800 ${Math.round(11 * k)}px ${BC}`; const s = f.map(v => v === 0 ? '–' : v).join(' '); ctx.fillStyle = f.includes('X') ? '#ffd040' : f.includes('/') ? '#8fe0ff' : '#fff'; ctx.fillText(s, bx + bw / 2, by + 9.5 * k); } }
    // how close the target is (the near goal, L4)
    if (c.kind === 'game') { const fy = y + h - 4 * k; ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fillRect(x + 12, fy, w - 24, 2.5 * k); ctx.fillStyle = reach ? '#7af0a0' : '#3ae0ff'; ctx.fillRect(x + 12, fy, (w - 24) * clamp(rv ? (lead > 0 ? G.score / lead : 1) : G.score / c.target, 0, 1), 2.5 * k); }
  } else lessonPanel(G);
  pinMap(G);
  // aiming: the line your roll will take, and how hard you are pulling
  if (G.phase === 'aim' && !G.over && G.wait <= 0) {
    const a = G.aim, pulling = a.p > 0, pts = pathPts(G, a.x, pulling ? a.a : 0, pulling ? a.p : 0.6, c.line); ctx.save();
    for (let i = 4; i < pts.length; i += 6) { const q = scr(pts[i][0], 0.01, -pts[i][1]), al = (pulling ? 0.95 : 0.4) * (1 - i / pts.length * 0.6); ctx.globalAlpha = al; ctx.fillStyle = pts.gutter && i > pts.length - 30 ? '#ff5a5a' : '#3ae0ff'; ctx.strokeStyle = 'rgba(10,4,30,.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(q.x, q.y, (pulling ? 4 : 3) * k * (1 - i / pts.length * 0.5), 0, TAU); ctx.fill(); ctx.stroke(); }
    ctx.restore();
    const tch = ui.touch; if (tch && pulling) { const R = 62 * k, px = tch.x0 + 46 * k; ctx.fillStyle = 'rgba(255,255,255,.18)'; rrect(px - 5 * k, tch.y0, 10 * k, R * 1.6, 5 * k); ctx.fill(); const pw = a.p; ctx.fillStyle = pw > 0.85 ? '#ff7a5a' : pw > 0.55 ? '#ffd040' : '#7af0a0'; rrect(px - 5 * k, tch.y0, 10 * k, R * 1.6 * pw, 5 * k); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 2 * k; ctx.setLineDash([4 * k, 4 * k]); ctx.beginPath(); ctx.moveTo(tch.x0, tch.y0); ctx.lineTo(tch.x, Math.max(tch.y, tch.y0)); ctx.stroke(); ctx.setLineDash([]); }
    else if ((G && G.lesson) && !tch && G.N <= 3 && !G.over) { ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 4); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText('touch to line up · pull down ↓ and let go', W / 2, H - 70 * k); ctx.globalAlpha = 1; }
  }
}
// the pins still standing, from above: a little triangle at the top right (gold for a golden pin)
function pinMap(G) { const r = 4.2 * k, sp = 12 * k, cx = W - 44 * k, cy = (G.lesson ? 150 : 140) * k; ctx.fillStyle = 'rgba(22,10,42,.6)'; rrect(cx - 30 * k, cy - 34 * k, 60 * k, 44 * k, 8); ctx.fill();
  for (const p of G.pins) { const q = PINPOS[p.n - 1], x = cx + q.x / 0.3048 * sp, y = cy + 4 * k - (q.z - HEAD_Z) / 0.264 * sp * 0.85; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
    if (p.up && !p.gone) { ctx.fillStyle = p.gold ? '#ffd040' : '#ffffff'; ctx.fill(); } else { ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 1.2; ctx.stroke(); } } }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { coachPanel(G); }
