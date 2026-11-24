
// ===================== THE VIEW: Helix Drop in 3D (three.js; the renderer and its quality steps from tools/world3d.js) =====================
// A tall striped pole with round platforms in pieces, in bright toy colours on a soft gradient sky (its own scene: no
// weather here, the tower is the world). Red pieces glow. The ball bounces with a squash, leaving a splat of its colour
// where it lands; on fire it burns orange with a trail; a smashed platform bursts into flying pieces. The camera follows
// the ball down, never up. The 2D layer: the progress bar from this level to the next, the score, the streak, fire.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { snap: true, drag: null, camY: 0 };
const NU = 'Nunito, "Barlow Condensed", "Arial Narrow", sans-serif';
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 160) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: 0.5 + Math.random() * 0.4, col, r: (1.5 + Math.random() * 2.5) * k }); } if (PARTS.length > 240) PARTS.splice(0, PARTS.length - 240); }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2.5); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.4) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; } }
const hex = n => '#' + n.toString(16).padStart(6, '0');
function myBall() { if (typeof HEADLESS !== 'undefined' && HEADLESS) return BALLS[0]; const id = store.get('ball', 'red'); return BALLS.find(q => q.id === id) || BALLS[0]; }
// ---------- the world ----------
const RIN = 0.62, ROUT = 2.4, THICK = 0.36, RB = 1.55, BR = 0.26;
function segGeo(T) { const sh = new T.Shape(), a0 = 0.012, a1 = SEG - 0.012, n = 8; sh.moveTo(Math.cos(a0) * RIN, Math.sin(a0) * RIN);
  for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; sh.lineTo(Math.cos(a) * ROUT, Math.sin(a) * ROUT); } for (let i = n; i >= 0; i--) { const a = a0 + (a1 - a0) * i / n; sh.lineTo(Math.cos(a) * RIN, Math.sin(a) * RIN); }
  const g = new T.ExtrudeGeometry(sh, { depth: THICK, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2 }); g.rotateX(Math.PI / 2); g.translate(0, 0.3, 0); return g; }
function buildWorld() {
  if (V3) return V3; const T = window.THREE; if (!T || !W3 || !W3.init({ canvas: $('gl'), fov: 52, far: 400, near: 0.1 })) { V3 = { none: true }; return V3; }
  V3 = { T, S: new T.Scene(), towerFor: null }; const V = V3;
  V.S.add(new T.HemisphereLight(0xffffff, 0x8888aa, 1.4)); const sun = new T.DirectionalLight(0xffffff, 2.2); sun.position.set(6, 10, 4); V.S.add(sun); V.S.add(sun.target);
  V.seg = segGeo(T); V.ballMat = new T.MeshStandardMaterial({ color: 0xff3a5a, roughness: 0.25, metalness: 0.1, emissive: 0x000000 });
  V.ball = new T.Mesh(new T.SphereGeometry(BR, 28, 20), V.ballMat); V.S.add(V.ball);
  V.shadow = new T.Mesh(new T.CircleGeometry(BR * 0.9, 20), new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25, depthWrite: false })); V.shadow.rotation.x = -Math.PI / 2; V.S.add(V.shadow);
  // the trail of a ball on fire, and the bits of a smashed platform
  V.trail = []; for (let i = 0; i < 10; i++) { const m = new T.Mesh(new T.SphereGeometry(BR * (1 - i * 0.07), 12, 8), new T.MeshBasicMaterial({ color: 0xff8a20, transparent: true, opacity: 0.5 - i * 0.045, depthWrite: false })); m.visible = false; V.S.add(m); V.trail.push(m); }
  V.bits = []; V.splats = [];
  W3.setQuality(stepN); return V; }
function gradTex(T, top, bot) { const c = document.createElement('canvas'); c.width = 4; c.height = 256; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, hex(top)); gr.addColorStop(1, hex(bot)); g.fillStyle = gr; g.fillRect(0, 0, 4, 256); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t; }
// one tower: the pole, every platform as instances of one piece (solid ones, red ones), the finish
function buildTower(V, g) { const T = V.T; if (V.tower) { V.S.remove(V.tower); V.tower.traverse(o => { if (o.geometry && o.geometry !== V.seg) o.geometry.dispose(); }); }
  const P = PLACES[g.place], H = new T.Group(); V.tower = H; V.S.add(H); V.S.background = gradTex(T, P.bg[0], P.bg[1]);
  const len = -g.finY + 6, pole = new T.Mesh(new T.CylinderGeometry(RIN * 0.98, RIN * 0.98, len, 24), new T.MeshStandardMaterial({ color: 0xf6f2ff, roughness: 0.5 })); pole.position.y = 3 - len / 2; H.add(pole);
  const ringT = new T.TorusGeometry(RIN, 0.05, 6, 24); for (let y = 2; y > g.finY - 2; y -= 1.5) { const r = new T.Mesh(ringT, new T.MeshStandardMaterial({ color: P.plat, roughness: 0.6 })); r.rotation.x = Math.PI / 2; r.position.y = y; H.add(r); }
  const n = g.plats.length * SEGS; V.solid = new T.InstancedMesh(V.seg, new T.MeshStandardMaterial({ color: P.plat, roughness: 0.4 }), n); V.red = new T.InstancedMesh(V.seg, new T.MeshStandardMaterial({ color: 0xff2a3a, emissive: 0x801018, roughness: 0.35 }), n);
  V.solid.instanceMatrix.setUsage(T.DynamicDrawUsage); V.red.instanceMatrix.setUsage(T.DynamicDrawUsage); H.add(V.solid); H.add(V.red);
  const fin = new T.Mesh(new T.CylinderGeometry(ROUT, ROUT, 0.4, 36), new T.MeshStandardMaterial({ color: 0xffd040, emissive: 0x403000, roughness: 0.3, metalness: 0.4 })); fin.position.y = g.finY + 0.1; H.add(fin); V.fin = fin;
  V.splats.forEach(s => s.parent && s.parent.remove(s)); V.splats = []; V.towerFor = g; V.plSig = ''; placePieces(V, g); }
const M4 = window.THREE ? new THREE.Matrix4() : null, Q4 = window.THREE ? new THREE.Quaternion() : null, UPV = window.THREE ? new THREE.Vector3(0, 1, 0) : null, P4 = window.THREE ? new THREE.Vector3() : null, S4 = window.THREE ? new THREE.Vector3(1, 1, 1) : null;
// each piece in place: its platform's angle (plus the tower's turn, applied to the whole group) and its own slot
function placePieces(V, g) { let ns = 0, nr = 0; const zero = new THREE.Vector3(0, 0, 0);
  for (const pl of g.plats) { const yy = pl.y; for (let k = 0; k < SEGS; k++) { const kind = pl.p[k]; if (kind === 'gap' || pl.broken) continue; Q4.setFromAxisAngle(UPV, -(pl.a + k * SEG)); P4.set(0, yy, 0); M4.compose(P4, Q4, S4);
      if (kind === 'red') V.red.setMatrixAt(nr++, M4); else V.solid.setMatrixAt(ns++, M4); } }
  V.solid.count = ns; V.red.count = nr; V.solid.instanceMatrix.needsUpdate = true; V.red.instanceMatrix.needsUpdate = true; }
function sync(V, g, t, dt) { const T = V.T, b = g.ball;
  V.tower.rotation.y = -g.theta;
  // platforms that turn by themselves or whose reds slide: put their pieces again (cheap: one pass of matrices)
  const sig = g.plats.map(p => (p.broken ? 'b' : '') + (p.spin ? p.a.toFixed(3) : '') + (p.slide ? p.p.join('').slice(0, 12) : '')).join('|'); if (sig !== V.plSig) { V.plSig = sig; placePieces(V, g); }
  const sq = b.squash, bw = 1 + sq * 0.35, bh = 1 - sq * 0.3; V.ball.position.set(RB, b.y + BR * bh - 0.02, 0); V.ball.scale.set(bw, bh, bw);
  V.ballMat.color.setHex(g.fire ? 0xff8a20 : myBall().col); V.ballMat.emissive.setHex(g.fire ? 0xff4a00 : 0x000000);
  const pl = g.plats[g.pi]; V.shadow.position.set(RB, (pl ? pl.y + 0.31 : g.finY + 0.31), 0); V.shadow.material.opacity = 0.3 * clamp(1 - (b.y - (pl ? pl.y : g.finY)) / 4, 0, 1);
  V.trail.forEach((m, i) => { m.visible = g.fire; if (g.fire) m.position.set(RB, b.y + BR + (i + 1) * 0.22, 0); });
  for (let i = V.bits.length - 1; i >= 0; i--) { const q = V.bits[i]; q.t += dt; q.v.y -= 20 * dt; q.m.position.addScaledVector(q.v, dt); q.m.rotation.x += q.r * dt; q.m.rotation.z += q.r * 0.7 * dt; if (q.t > 1.6) { V.S.remove(q.m); V.bits.splice(i, 1); } }
  // the camera: follows the ball down, never back up
  const want = Math.min(b.y, (pl ? pl.y + 1.6 : g.finY + 1)); if (ui.snap) { ui.camY = want; ui.snap = false; } ui.camY = Math.min(ui.camY, lerp(ui.camY, want, Math.min(1, dt * 5)));
  const cam = W3.cam, asp = innerWidth / innerHeight, sh = FX.shake ? (Math.random() - 0.5) * FX.shake * 0.02 : 0; cam.fov = asp < 0.8 ? 62 : 48; cam.aspect = asp; cam.updateProjectionMatrix();
  cam.position.set(9.5 + sh, ui.camY + 4.6, sh); cam.lookAt(0, ui.camY - 1.4, 0); cam.updateMatrixWorld(); }
function splat(V, g, pl, col) { const T = V.T, m = new T.Mesh(new T.CircleGeometry(0.34 + Math.random() * 0.1, 14), new T.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
  m.rotation.x = -Math.PI / 2; const a = -(g.theta) * 0; m.position.set(Math.cos(g.theta) * RB, pl.y + 0.31, -Math.sin(g.theta) * RB); m.userData.pi = pl.i; V.tower.add(m); V.splats.push(m); if (V.splats.length > 24) { const o = V.splats.shift(); V.tower.remove(o); } }
function smashBits(V, g, pl) { const T = V.T; V.splats = V.splats.filter(q => { if (q.userData.pi === pl.i) { V.tower.remove(q); return false; } return true; }); for (let k = 0; k < SEGS; k++) { if (pl.p[k] === 'gap') continue; const a = pl.a + (k + 0.5) * SEG + g.theta, m = new T.Mesh(V.seg, pl.p[k] === 'red' ? V.red.material : V.solid.material); m.position.set(0, pl.y, 0); m.rotation.y = -(pl.a + k * SEG + g.theta); V.S.add(m);
    V.bits.push({ m, t: 0, v: new T.Vector3(Math.cos(a) * (5 + Math.random() * 4), 3 + Math.random() * 4, Math.sin(a) * (5 + Math.random() * 4)), r: (Math.random() - 0.5) * 10 }); } }
const SV = window.THREE ? new THREE.Vector3() : null;
function scr(x, y, z) { if (!V3 || V3.none) return { x: W / 2, y: H / 2 }; SV.set(x, y, z); return W3.screen(SV); }
// ---------- what each happening looks and sounds like ----------
function onEvent(G, e) { const cx = W / 2, V = V3 && !V3.none ? V3 : null, bp = () => scr(RB, G.ball.y, 0);
  switch (e.k) {
    case 'start': case 'tower': if (V) V.towerFor = null; ui.snap = true; if (e.k === 'start') { say(`LEVEL ${G.N}`, cx, H * 0.3, '#fff', 30); sfx.start(); if (G.N <= 1) tip('how', 'Slide your thumb left or right to turn the tower. Gaps let the ball drop; red ends it.', 3.4); } break;
    case 'bounce': sfx.bounce(); if (V) splat(V, G, G.plats[e.i], G.fire ? 0xff8a20 : myBall().col); break;
    case 'pass': sfx.pass(e.n); { const p = bp(); if (e.n >= 2) say(`+${10 * e.n}`, p.x + 50 * k, p.y, ['#fff', '#fff', '#ffe08a', '#ff9a3a', '#ff5ac8'][Math.min(4, e.n)], 16 + Math.min(10, e.n * 2)); } vibe(HAP.tick); break;
    case 'fire': sfx.fire(); say('ON FIRE!', cx, H * 0.36, '#ff8a20', 30); tip('fire', 'On fire! The next platform smashes, red or not.', 2.4); break;
    case 'smash': sfx.smash(); FX.shake = 10; FX.flash = 0.35; FX.stop = 0.04; vibe(HAP.sharp); if (V) smashBits(V, G, G.plats[e.i]); { const p = bp(); burst(p.x, p.y, '#ffb040', 24, 260); say('SMASH!', cx, H * 0.42, '#ffd040', 28); } break;
    case 'shield': sfx.shield(); say('SHIELD SAVED YOU', cx, H * 0.4, '#9ae6ff', 16); FX.flash = 0.3; break;
    case 'red': sfx.red(); FX.shake = 14; FX.red = 1; { const p = bp(); burst(p.x, p.y, '#ff3a3a', 24, 220); } break;
    case 'finish': sfx.goal(); FX.flash = 0.6; say('TOWER DOWN!', cx, H * 0.36, '#ffd040', 34); vibe(HAP.best); break;
    case 'lessonnext': if (e.first) hint = null; say('FIRST, A LESSON', cx, H * 0.3, '#ffe08a', 20); break;
    case 'lessonok': break;
    case 'lessonmiss': coachMiss(); break;
    case 'lessondone': say('YOU\'VE GOT IT!', cx, H * 0.3, '#ffe08a', 26); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); break;
    case 'lost': sfx.lose(); break;
  } }
// ---------- every frame ----------
let IG = null; function idleG() { if (!IG || IG.over) { IG = newGame(Math.max(2, store.get('level', 1) | 0), { seed: (Math.random() * 1e6) | 0 }); IG.mem = {}; ui.snap = true; } honest(IG, { react: 0.2, acc: 0.95 }, IG.mem); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#2a1a3a'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D tower.', W / 2, H / 2); return; }
  const g = G || idleG(); if (V.towerFor !== g) { buildTower(V, g); ui.snap = true; }
  sync(V, g, now, dt);
  if (!(navigator.webdriver && !window.__fullGL && (!window.__softGL || now * 1000 - (V.lastR || 0) < 2500))) { V.lastR = now * 1000; W3.R.render(V.S, W3.cam); }
  if (G) hud(G, now);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 0.9 ? 1 : 1 - (t2.t - 0.9) / 0.5; ctx.globalAlpha = Math.max(0, al); const sc = t2.t < 0.12 ? 1.3 - t2.t / 0.12 * 0.3 : 1; ctx.font = `400 ${Math.round(t2.size * k * sc)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(30,10,40,.6)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 20); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 20); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30;
    ctx.fillStyle = 'rgba(30,16,50,.88)'; rrect(W / 2 - w / 2, H * 0.78 - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.78 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,40,60,${FX.red * 0.2})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,250,235,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); } }
// ---------- the 2D layer ----------
function hud(G, t) { ctx.textBaseline = 'middle'; if (G.lesson) { lessonPanel(G); return; }
  const c = G.cfg, p = clamp(G.passed / c.floors, 0, 1), w = Math.min(230 * k, W * 0.55), x0 = W / 2 - w / 2, y0 = 66 * k;
  ctx.fillStyle = 'rgba(30,16,50,.35)'; rrect(x0 - 26 * k, y0 - 16 * k, w + 52 * k, 32 * k, 16 * k); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.35)'; rrect(x0, y0 - 5 * k, w, 10 * k, 5 * k); ctx.fill(); ctx.fillStyle = '#fff'; rrect(x0, y0 - 5 * k, Math.max(10 * k, w * p), 10 * k, 5 * k); ctx.fill();
  for (const [x, n, on] of [[x0 - 12 * k, G.N, true], [x0 + w + 12 * k, G.N + 1, p >= 1]]) { ctx.fillStyle = on ? '#ffffff' : 'rgba(255,255,255,.4)'; ctx.beginPath(); ctx.arc(x, y0, 13 * k, 0, TAU); ctx.fill(); ctx.fillStyle = on ? '#3a2a5a' : '#fff'; ctx.font = `400 ${Math.round(12 * k)}px ${TF}`; ctx.textAlign = 'center'; ctx.fillText(n, x, y0 + 1); }
  ctx.fillStyle = '#fff'; ctx.font = `400 ${Math.round(34 * k)}px ${TF}`; ctx.textAlign = 'center'; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(30,16,50,.35)'; ctx.strokeText(G.score, W / 2, y0 + 44 * k); ctx.fillText(G.score, W / 2, y0 + 44 * k);
  const bst = best[G.N]; if (bst) { ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = G.score > bst ? '#ffd040' : 'rgba(255,255,255,.75)'; ctx.fillText(G.score > bst ? 'NEW BEST!' : `BEST ${bst}`, W / 2, y0 + 70 * k); }
  if (G.shields) { ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = '#9ae6ff'; ctx.textAlign = 'left'; ctx.fillText('🛡 shield', 14, y0); }
  if ((G && G.lesson) && G.N <= 1 && G.passed === 0 && !ui.drag) { ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 4); ctx.font = `400 ${Math.round(14 * k)}px ${TF}`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText('← SLIDE TO TURN →', W / 2, H - 90 * k); ctx.globalAlpha = 1; } }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { coachPanel(G); }
