// ===================== THE VIEW: Drumline in 3D (three.js through tools/world3d.js) =====================
// Halftime under the floodlights: you stand on the field behind two drums (a snare on the left, a tom on the right), two lit
// lanes running away up the field toward the stands, the crowd on its feet in the stands (it sways to the beat, and jumps when
// you are on fire), the lights pulsing with the music. Notes come down the lanes as glowing pucks, gold ones across both lanes,
// drum rolls as long bars. The 2D layer: the score, the run, the crowd meter, the song's progress with your best mark.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { snap: true, hitL: [0, 0], judge: null, showScore: 0 };
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 2.8) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 160) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60 * k, t: 0, life: 0.35 + Math.random() * 0.3, col, r: (1.5 + Math.random() * 2.5) * k }); } if (PARTS.length > 240) PARTS.splice(0, PARTS.length - 240); }
function fxStep(dt) {
  FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 2.5);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.0) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * k * dt; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; }
  for (let i = 0; i < 2; i++) ui.hitL[i] = Math.max(0, ui.hitL[i] - dt * 6); if (ui.judge) { ui.judge.t += dt; if (ui.judge.t > 0.5) ui.judge = null; }
}
const LX = [-0.85, 0.85], DRUMZ = 0.3;
function buildWorld() {
  if (V3) return V3; const T = THREE; if (!W3 || !W3.init({ canvas: $('gl'), fov: 60, far: 1200, near: 0.05 })) { V3 = { none: true }; return V3; }
  const S = W3.scene, R0 = W3.rng(39);
  // the field: green stripes and white yard lines
  const fc = document.createElement('canvas'); fc.width = 256; fc.height = 1024; const fg = fc.getContext('2d'); for (let i = 0; i < 20; i++) { fg.fillStyle = i % 2 ? '#2c6a2c' : '#327a32'; fg.fillRect(0, i * 51.2, 256, 51.2); } fg.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i <= 20; i += 2) fg.fillRect(0, i * 51.2 - 2, 256, 4);
  const ft = new T.CanvasTexture(fc); ft.colorSpace = T.SRGBColorSpace; ft.wrapS = ft.wrapT = T.RepeatWrapping; ft.repeat.set(1, 1);
  const field = new T.Mesh(new T.PlaneGeometry(60, 110), new T.MeshStandardMaterial({ map: ft, roughness: 0.95 })); field.rotation.x = -Math.PI / 2; field.position.z = -40; field.receiveShadow = true; S.add(field);
  // the stands: tiers rising all round, full of people (one drawing for all of them)
  const standM = new T.MeshStandardMaterial({ color: 0x3a3a48, roughness: 0.9 }), crowdG = new T.CapsuleGeometry(0.22, 0.5, 2, 6), crowd = new T.InstancedMesh(crowdG, new T.MeshStandardMaterial({ roughness: 0.8 }), 2600), people = [], c = new T.Color();
  const tier = (cx, cz, w, rot) => { for (let r = 0; r < 14; r++) { const st = new T.Mesh(new T.BoxGeometry(w, 0.6, 1.2), standM); const lx = 0, lz = -r * 1.2; st.position.set(cx + Math.cos(rot) * lx - Math.sin(rot) * lz, 0.3 + r * 0.6, cz + Math.sin(rot) * lx + Math.cos(rot) * lz); st.rotation.y = -rot; S.add(st);
      for (let i = 0; i < w / 0.7; i++) { if (people.length >= 1400 || R0() < 0.45) continue; const px = -w / 2 + 0.35 + i * 0.7; people.push({ x: cx + Math.cos(rot) * px - Math.sin(rot) * lz, y: 0.95 + r * 0.6, z: cz + Math.sin(rot) * px + Math.cos(rot) * lz, ph: R0() * 6, a: 0.6 + R0() * 0.8 }); } } };
  tier(0, -96, 60, 0); tier(-31, -40, 100, -Math.PI / 2); tier(31, -40, 100, Math.PI / 2);
  people.forEach((p, i) => crowd.setColorAt(i, c.setHSL(R0(), 0.5, 0.35 + R0() * 0.3))); crowd.count = people.length; S.add(crowd);
  // floodlights on towers
  const lamps = []; for (const [x, z] of [[-30, -10], [30, -10], [-30, -75], [30, -75]]) { const pole = new T.Mesh(new T.CylinderGeometry(0.3, 0.4, 30, 8), standM); pole.position.set(x, 15, z); S.add(pole); const head = new T.Mesh(new T.BoxGeometry(5, 2.5, 0.6), new T.MeshBasicMaterial({ color: 0xfff6e0 })); head.position.set(x * 0.95, 30, z); head.lookAt(0, 0, -40); S.add(head); lamps.push(head); }
  const spot = new T.SpotLight(0xfff2dd, 600, 140, 0.7, 0.6, 1.4); spot.position.set(-25, 32, 8); spot.target.position.set(0, 0, -8); spot.castShadow = true; S.add(spot, spot.target);
  const beatL = new T.PointLight(0xffb020, 0, 30, 1.6); beatL.position.set(0, 4, -6); S.add(beatL);
  // the two lanes, lit, running up the field
  const laneM = [0, 1].map(i => new T.MeshBasicMaterial({ color: i ? 0x3ad8ff : 0xff5a8a, transparent: true, opacity: 0.18, depthWrite: false })), lanes = [0, 1].map(i => { const m = new T.Mesh(new T.PlaneGeometry(1.4, 40), laneM[i]); m.rotation.x = -Math.PI / 2; m.position.set(LX[i], 0.02, -20 + DRUMZ); S.add(m); return m; });
  const edgeM = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 }); for (const x of [-1.6, 0, 1.6]) { const e = new T.Mesh(new T.PlaneGeometry(0.04, 40), edgeM); e.rotation.x = -Math.PI / 2; e.position.set(x, 0.03, -20 + DRUMZ); S.add(e); }
  const hitLine = new T.Mesh(new T.PlaneGeometry(3.3, 0.12), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 })); hitLine.rotation.x = -Math.PI / 2; hitLine.position.set(0, 0.04, DRUMZ); S.add(hitLine);
  // the drums: a snare (left) and a tom (right), chrome rims, white heads that flash when hit
  const rimM = new T.MeshStandardMaterial({ color: 0xd8dce4, metalness: 0.9, roughness: 0.25 }), drums = [0, 1].map(i => { const g = new T.Group(), shellM = new T.MeshStandardMaterial({ color: i ? 0x2a6aff : 0xd82a4a, roughness: 0.35, metalness: 0.2 }), headM = new T.MeshStandardMaterial({ color: 0xf4f0e6, roughness: 0.6, emissive: 0xffffff, emissiveIntensity: 0 });
    const shell = new T.Mesh(new T.CylinderGeometry(0.62, 0.62, i ? 0.75 : 0.42, 28), shellM); shell.position.y = (i ? 0.75 : 0.42) / 2; const head = new T.Mesh(new T.CylinderGeometry(0.6, 0.6, 0.02, 28), headM); head.position.y = (i ? 0.75 : 0.42) + 0.01;
    for (const y of [0.02, (i ? 0.75 : 0.42)]) { const rim = new T.Mesh(new T.TorusGeometry(0.62, 0.035, 8, 28), rimM); rim.rotation.x = Math.PI / 2; rim.position.y = y; g.add(rim); }
    g.add(shell, head); g.position.set(LX[i], i ? 0.05 : 0.38, DRUMZ + 0.75); g.rotation.x = 0.35; g.traverse(o => { if (o.isMesh) o.castShadow = true; }); S.add(g); return { g, headM }; });
  // notes: pucks, gold bars across both lanes, roll bars
  const puckM = [new T.MeshStandardMaterial({ color: 0xff5a8a, emissive: 0xff5a8a, emissiveIntensity: 0.7, roughness: 0.3 }), new T.MeshStandardMaterial({ color: 0x3ad8ff, emissive: 0x3ad8ff, emissiveIntensity: 0.7, roughness: 0.3 })];
  const pucks = [0, 1].map(i => { const m = new T.InstancedMesh(new T.CylinderGeometry(0.5, 0.5, 0.16, 24), puckM[i], 64); m.count = 0; m.frustumCulled = false; S.add(m); return m; });
  const gold = new T.InstancedMesh(new T.BoxGeometry(3.0, 0.16, 0.42), new T.MeshStandardMaterial({ color: 0xffc83a, emissive: 0xffa000, emissiveIntensity: 0.8, metalness: 0.5, roughness: 0.25 }), 32); gold.count = 0; gold.frustumCulled = false; S.add(gold);
  const rolls = [0, 1].map(i => { const m = new T.InstancedMesh(new T.BoxGeometry(0.5, 0.08, 1), new T.MeshBasicMaterial({ color: i ? 0x9ae8ff : 0xffa8c4, transparent: true, opacity: 0.7 }), 16); m.count = 0; m.frustumCulled = false; S.add(m); return m; });
  V3 = { T, S, crowd, people, lamps, spot, beatL, laneM, drums, pucks, gold, rolls, sky: null };
  W3.setQuality(stepN); return V3;
}
const SV = new (window.THREE ? THREE.Vector3 : Object)();
function scr(x, y, z) { if (!V3 || V3.none) return { x: W / 2 + x * 80, y: H * 0.8 + z * 30, front: true }; SV.set(x, y, z); return W3.screen(SV); }
const drumAt = i => scr(LX[i], 0.7, DRUMZ + 0.6);
// ---------- events ----------
function onEvent(G, e) {
  const cx = W / 2;
  switch (e.k) {
    case 'start': say('🎵 ' + G.cfg.name.toUpperCase(), cx, H * 0.3, '#ffe08a', 24); say(`${G.cfg.bpm} BEATS A MINUTE`, cx, H * 0.35, '#ffffff', 16); sfx.whistle(); if (G.N <= 2) tip('drums', 'Tap the left half for the left drum, the right half for the right one, as each note reaches the line', 3.4); break;
    case 'drum': ui.hitL[e.lane] = 1; sfx.drum(e.lane); break;
    case 'hit': { const lanes = e.lane === 2 ? [0, 1] : [e.lane]; for (const l of lanes) { const p = drumAt(l); burst(p.x, p.y, e.q === 'perfect' ? '#ffe08a' : '#ffffff', e.q === 'perfect' ? 14 : 8); } ui.judge = { q: e.q, t: 0, off: e.off };
      if (e.combo && e.combo % 10 === 0) { sfx.cheer(Math.min(1, e.combo / 50)); say(`${e.combo} IN A ROW!`, cx, H * 0.38, '#ffe08a', 24); } if (e.lane === 2) sfx.crash(); break; }
    case 'miss': ui.judge = { q: 'miss', t: 0 }; FX.red = 0.35; sfx.miss(); break;
    case 'stray': ui.judge = { q: 'stray', t: 0 }; FX.red = 0.25; if (G.N <= 4) tip('stray', 'A tap with no note there upsets the crowd: wait for each note', 2.8); break;
    case 'roll': break;
    case 'rollend': if (e.good) say('ROLL!', cx, H * 0.45, '#9ae8ff', 22); break;
    case 'fever': FX.flash = 0.8; sfx.fever(); say('FEVER! ×2', cx, H * 0.35, '#ff6aff', 34); vibe(HAP.best); break;
    case 'feverend': break;
    case 'lessonnext': if (e.first) hint = null; say('FIRST, A LESSON', cx, H * 0.36, '#ffe08a', 26); sfx.whistle(); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, cx, H * 0.42, '#9be3b5', 22); break;
    case 'lessonmiss': hint = { txt: e.how, t: 0, secs: 3 }; break;
    case 'lessondone': say('NOW THE SONG!', cx, H * 0.36, '#ffe08a', 26); sfx.cheer(1); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.cheer(1); sfx.whistle(); vibe(HAP.best); say('WHAT A SHOW!', cx, H * 0.3, '#ffe08a', 34); FX.flash = 0.6; break;
    case 'lost': sfx.boo(); say('THE CROWD SAT DOWN', cx, H * 0.3, '#ffb4a8', 26); break;
  }
}
// ---------- every frame in 3D ----------
const DUMMY = new (window.THREE ? THREE.Object3D : Object)();
function animate(g, t, dt) {
  const V = V3, sp = g.cfg.speed, beatPh = g.beat ? ((g.t - (g.lead || 0)) / g.beat) % 1 : 0, onBeat = Math.pow(1 - Math.max(0, beatPh), 3);
  // notes coming down the lanes
  for (const m of V.pucks) m.count = 0; for (const m of V.rolls) m.count = 0; V.gold.count = 0;
  for (const n of g.notes) { const dz = (n.t - g.t) * sp; if (dz > 40) break; if (n.done && !(n.roll && n.t + n.roll > g.t)) continue; if (dz < -2) continue;
    if (n.lane === 2) { if (V.gold.count < 32) { DUMMY.position.set(0, 0.1, DRUMZ - dz); DUMMY.rotation.set(0, 0, 0); DUMMY.scale.set(1, 1, 1); DUMMY.updateMatrix(); V.gold.setMatrixAt(V.gold.count++, DUMMY.matrix); } continue; }
    const P = V.pucks[n.lane]; if (P.count < 64 && !(n.done || n.hit[0])) { DUMMY.position.set(LX[n.lane], 0.1, DRUMZ - dz); DUMMY.rotation.set(0, 0, 0); DUMMY.scale.set(1, 1, 1); DUMMY.updateMatrix(); P.setMatrixAt(P.count++, DUMMY.matrix); }
    if (n.roll) { const R = V.rolls[n.lane], z0 = Math.max(0, dz), z1 = (n.t + n.roll - g.t) * sp; if (z1 > 0 && R.count < 16) { DUMMY.position.set(LX[n.lane], 0.06, DRUMZ - (z0 + z1) / 2); DUMMY.scale.set(1, 1, Math.max(0.01, z1 - z0)); DUMMY.updateMatrix(); R.setMatrixAt(R.count++, DUMMY.matrix); } } }
  for (const m of [...V.pucks, ...V.rolls, V.gold]) m.instanceMatrix.needsUpdate = true;
  // drums bounce and flash when struck
  V.drums.forEach((d, i) => { d.headM.emissiveIntensity = ui.hitL[i] * 0.8; d.g.scale.setScalar(1 + ui.hitL[i] * 0.05); });
  V.laneM.forEach((m, i) => { m.opacity = 0.14 + ui.hitL[i] * 0.25 + onBeat * 0.05; });
  // the crowd sways to the beat: more when they are with you, jumping in a FEVER
  const mood = g.crowd, jump = g.fever > 0 ? 0.35 : 0;
  V.people.forEach((p, i) => { const b = Math.max(0, Math.sin((g.t / (g.beat || 0.6)) * Math.PI + p.ph * 0.2)) * (0.05 + mood * 0.15 + jump) * p.a; DUMMY.position.set(p.x, p.y + b, p.z); DUMMY.rotation.set(0, 0, Math.sin(t * 2 + p.ph) * 0.1 * mood); DUMMY.scale.setScalar(1); DUMMY.updateMatrix(); V.crowd.setMatrixAt(i, DUMMY.matrix); }); V.crowd.instanceMatrix.needsUpdate = true;
  V.beatL.intensity = onBeat * (20 + mood * 30) + (g.fever > 0 ? 25 : 0); V.beatL.color.setHex(g.fever > 0 ? (Math.floor(t * 4) % 2 ? 0xff5aff : 0x5affff) : 0xffb020);
}
function placeCam(g, dt) { const cam = W3.cam, asp = innerWidth / innerHeight; cam.fov = asp < 0.75 ? 66 : 50; cam.aspect = asp; cam.updateProjectionMatrix(); const sh = FX.shake ? (Math.random() - 0.5) * FX.shake * 0.01 : 0; cam.position.set(sh, 3.4, 4.6); cam.lookAt(0, 0, -6); cam.updateMatrixWorld(); }
let IG = null; function idleG() { if (!IG || IG.over) { IG = newGame(Math.max(3, store.get('level', 1) | 0), { seed: (Math.random() * 1e6) | 0 }); IG.mem = {}; } honest(IG, { react: 0.2, acc: 0.97 }, IG.mem); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#100818'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D stadium.', W / 2, H / 2); return; }
  const g = G || idleG(), t = now;
  if (V.sky !== g.sky) { V.sky = g.sky; W3.setSky(g.sky, { azim: 200 }); if (g.sky === 'night' || g.sky === 'dusk') { W3.S.hemiI = 0.9; } }
  placeCam(g, dt); animate(g, t, dt); W3.setFocus(0, 0, -10, 30); W3.render(dt);
  if (G) hud(G, t);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 0.7 ? 1 : 1 - (t2.t - 0.7) / 0.3; ctx.globalAlpha = Math.max(0, al); const sc = t2.t < 0.1 ? 1.4 - t2.t * 4 : 1; ctx.font = `800 ${Math.round(t2.size * k * sc)}px ${BC}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(16,8,24,.7)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 20); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 20); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30;
    ctx.fillStyle = 'rgba(24,12,36,.88)'; rrect(W / 2 - w / 2, H * 0.5 - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.5 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,40,60,${FX.red * 0.14})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,240,255,${FX.flash * 0.25})`; ctx.fillRect(0, 0, W, H); }
}
// ---------- the 2D layer ----------
function hud(G, t) {
  ctx.textBaseline = 'middle';
  if (!G.lesson) { const x = 12, y = 46 * k, w = W - 24, h = 58 * k; ctx.fillStyle = 'rgba(16,8,24,.72)'; rrect(x, y, w, h, 12); ctx.fill();
    ui.showScore += (G.score - ui.showScore) * 0.3; if (Math.abs(G.score - ui.showScore) < 3) ui.showScore = G.score;
    ctx.textAlign = 'left'; ctx.font = `800 ${Math.round(22 * k)}px ${BC}`; ctx.fillStyle = '#ffb020'; ctx.fillText(Math.round(ui.showScore).toLocaleString(), x + 12, y + 17 * k);
    ctx.textAlign = 'right'; ctx.font = `800 ${Math.round(16 * k)}px ${BC}`; ctx.fillStyle = G.fever > 0 ? '#ff6aff' : '#fff'; ctx.fillText(`${G.combo} ×${G.mult * (G.fever > 0 ? 2 : 1)}`, x + w - 12, y + 17 * k);
    // the crowd meter
    const cw = w - 24, cy = y + 34 * k; ctx.fillStyle = 'rgba(255,255,255,.15)'; rrect(x + 12, cy, cw, 8 * k, 4 * k); ctx.fill(); const cm = clamp(G.crowd, 0, 1); ctx.fillStyle = cm < 0.25 ? (Math.sin(t * 10) > 0 ? '#ff4a4a' : '#ff8a4a') : cm < 0.5 ? '#ffd040' : '#5ee08a'; rrect(x + 12, cy, Math.max(8 * k, cw * cm), 8 * k, 4 * k); ctx.fill();
    ctx.textAlign = 'left'; ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillText(cm < 0.25 ? 'THE CROWD IS GOING QUIET!' : 'CROWD', x + 12, cy + 16 * k);
    // the song: how far through, and how far you got before
    const pg = clamp(G.t / G.len, 0, 1), bp = HEADLESS ? 0 : ((store.get('bestProg', {}) || {})[G.N] || 0), px0 = x + w * 0.5, pw = w * 0.5 - 12, py = cy + 14 * k;
    ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fillRect(px0, py - 1.5, pw, 3); ctx.fillStyle = '#ffb020'; ctx.fillRect(px0, py - 1.5, pw * pg, 3); if (bp > 0 && bp < 1) { ctx.fillStyle = '#bfe8ff'; ctx.fillRect(px0 + pw * bp - 1, py - 5, 2, 10); } ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillText('🎵 ' + G.cfg.name, x + w - 12, py + 10 * k);
  } else lessonPanel(G);
  // how that hit landed, over the drums
  if (ui.judge) { const j = ui.judge, a = 1 - j.t / 0.5, txt = { perfect: 'PERFECT', good: 'GOOD', ok: 'OK', miss: 'MISS', stray: 'NO NOTE' }[j.q], col = { perfect: '#ffe08a', good: '#9be3b5', ok: '#ffffff', miss: '#ff8a8a', stray: '#ff8a8a' }[j.q];
    ctx.globalAlpha = Math.max(0, a); ctx.font = `800 ${Math.round(22 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillStyle = col; ctx.fillText(txt, W / 2, H * 0.6 - j.t * 30 * k); if (j.off != null && j.q !== 'perfect') { ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillText(j.off < 0 ? 'a little early' : 'a little late', W / 2, H * 0.6 + 18 * k - j.t * 30 * k); } ctx.globalAlpha = 1; }
  if (G.N <= 2 && G.t < 8) { ctx.globalAlpha = 0.5; ctx.font = `800 ${Math.round(14 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillStyle = '#ffa8c4'; ctx.fillText('LEFT DRUM', W * 0.25, H - 40 * k); ctx.fillStyle = '#9ae8ff'; ctx.fillText('RIGHT DRUM', W * 0.75, H - 40 * k); ctx.globalAlpha = 1; }
}
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) {
  const D = G.lesson, st = D.steps[D.i], x = 12, w = W - 24, y = 46 * k; ctx.save();
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; const lines = wrapText(st.how, w - 24), h = 50 * k + lines.length * 17 * k;
  ctx.fillStyle = 'rgba(16,8,24,.88)'; rrect(x, y, w, h, 12); ctx.fill(); ctx.strokeStyle = 'rgba(255,176,32,.7)'; ctx.lineWidth = 2; rrect(x, y, w, h, 12); ctx.stroke();
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#ffd080'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillText(`LESSON ${G.N} OF 3 · ${D.n} OF ${st.need}`, x + 12, y + 9 * k);
  ctx.fillStyle = '#fff'; ctx.font = `800 ${Math.round(17 * k)}px ${BC}`; ctx.fillText(st.title, x + 12, y + 23 * k);
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.92)'; lines.forEach((l, i) => ctx.fillText(l, x + 12, y + 46 * k + i * 17 * k));
  ctx.restore(); ctx.textBaseline = 'middle';
}
