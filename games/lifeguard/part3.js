// ===================== THE VIEW: Beach Watch in 3D (three.js; sky, light, sea from tools/world3d.js) =====================
// From the top of the lifeguard tower: the sand, umbrellas and towels below, the surf, the breaking waves (with a dark gap
// where each rip runs out), a line of orange buoys (past them is too far), the swimmers. You in red and yellow with a rescue
// tube. The world is squeezed a little sideways (VX) so the whole swimming area fits a phone held upright.
const FX = { shake: 0, stop: 0, flash: 0, red: 0, slow: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { snap: true, cam: null, banner: null, hold: null, drag: null };
const VX = 0.62;
function say(txt, x, y, col = '#fff', size = 22) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 140) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60 * k, t: 0, life: 0.5 + Math.random() * 0.4, col, r: (1.5 + Math.random() * 2.2) * k }); } if (PARTS.length > 240) PARTS.splice(0, PARTS.length - 240); }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2.5); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.6) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (ui.banner) { ui.banner.t += dt; if (ui.banner.t > (ui.banner.secs || 2.4)) ui.banner = null; }
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; } }
function mySkin() { if (typeof HEADLESS !== 'undefined' && HEADLESS) return SKINS[0]; const id = store.get('skin', 'red'); return SKINS.find(q => q.id === id) || SKINS[0]; }
const sandY = z => z < 0 ? Math.min(1.2, -z * 0.07) : -z * 0.05;
// ---------- the world ----------
function buildWorld() {
  if (V3) return V3; const T = window.THREE; if (!T || !W3 || !W3.init({ canvas: $('gl'), fov: 60, far: 1200, near: 0.1 })) { V3 = { none: true }; return V3; }
  V3 = { T, S: W3.scene, t: 0, for: null }; const V = V3, M = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.8 }, o)); V.M = M;
  W3.scene.children.forEach(o => { if (o.isLineSegments) o.visible = false; });
  V.boxG = new T.BoxGeometry(1, 1, 1); V.sphG = new T.SphereGeometry(1, 14, 10); V.cylG = new T.CylinderGeometry(1, 1, 1, 12); V.coneG = new T.ConeGeometry(1, 1, 16);
  V.sand = W3.terrain({ size: 260, seg: 90, z: -40, height: (x, z) => sandY(z) + (z < -14 ? Math.max(0, -z - 14) * 0.12 * (1 + 0.3 * Math.sin(x * 0.2)) : 0), colour: (x, z, h) => { const wet = z > -1.5 ? 0.82 : 1, n = 0.94 + 0.06 * Math.sin(x * 1.7 + z * 2.3); return z < -18 ? [0.5 * n, 0.55 * n, 0.3 * n] : [0.86 * n * wet, 0.68 * n * wet, 0.42 * n * wet]; } });
  V.sea = W3.water({ size: 1600, color: 0x0a8a96, distort: 1.0, ripple: 2.6, speed: 0.4, y: 0.0 });
  // the breaking waves: foam slices along each crest (none where a rip runs out), and the wash at the water's edge
  V.foamM = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false, map: (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 4, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new T.CanvasTexture(c); })() });
  V.foam = new T.InstancedMesh(new T.PlaneGeometry(1.1, 1, 1, 1).rotateX(-Math.PI / 2), V.foamM, 3 * 40); V.foam.instanceMatrix.setUsage(T.DynamicDrawUsage); V.S.add(V.foam);
  V.wash = new T.Mesh(new T.PlaneGeometry(40, 1.2).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, depthWrite: false })); V.S.add(V.wash);
  V.ripM = new T.MeshBasicMaterial({ color: 0x063a44, transparent: true, opacity: 0.5, depthWrite: false, map: (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 128; const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 64, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 128); const g2 = x.createLinearGradient(0, 0, 0, 128); g2.addColorStop(0, 'rgba(0,0,0,1)'); g2.addColorStop(0.15, 'rgba(0,0,0,0)'); g2.addColorStop(0.8, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(0,0,0,1)'); x.globalCompositeOperation = 'destination-out'; x.fillStyle = g2; x.fillRect(0, 0, 64, 128); return new T.CanvasTexture(c); })() }); V.ripMs = [];
  V.specks = new T.InstancedMesh(new T.PlaneGeometry(0.18, 0.18).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: 0xe8f4f0, transparent: true, opacity: 0.45, depthWrite: false }), 60); V.specks.instanceMatrix.setUsage(T.DynamicDrawUsage); V.S.add(V.specks); V.speckD = Array.from({ length: 60 }, () => ({ r: 0, z: Math.random() * 20, x: Math.random() - 0.5 }));
  // the buoy line: past it is too far
  V.buoys = []; for (let i = 0; i < 9; i++) { const b = new T.Mesh(V.sphG, M(0xff7a1a, { roughness: 0.4 })); b.scale.setScalar(0.22); b.position.set((i - 4) * 1.1, 0.08, 17); V.S.add(b); V.buoys.push(b); }
  // the tower
  { const g = new T.Group(), wood = M(0xd8c8a0), red = M(0xd8322a); for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const l = new T.Mesh(V.boxG, wood); l.scale.set(0.15, 3.2, 0.15); l.position.set(sx * 1.1, 1.6, sz * 1.0); l.castShadow = true; g.add(l); }
    const pl = new T.Mesh(V.boxG, wood); pl.scale.set(2.8, 0.15, 2.6); pl.position.y = 3.2; g.add(pl); const hut = new T.Mesh(V.boxG, M(0xf2f0ea)); hut.scale.set(2.2, 1.6, 1.6); hut.position.set(0, 4.0, -0.4); hut.castShadow = true; g.add(hut);
    const rf = new T.Mesh(V.boxG, red); rf.scale.set(2.6, 0.12, 2.2); rf.position.set(0, 4.9, -0.3); g.add(rf); const pole = new T.Mesh(V.cylG, M(0x888888)); pole.scale.set(0.04, 2.2, 0.04); pole.position.set(1.2, 5.6, 0.9); g.add(pole);
    const fl = new T.Group(); const f1 = new T.Mesh(V.boxG, red); f1.scale.set(0.7, 0.25, 0.02); f1.position.set(0.35, 0.12, 0); fl.add(f1); const f2 = new T.Mesh(V.boxG, M(0xf2c230)); f2.scale.set(0.7, 0.25, 0.02); f2.position.set(0.35, -0.13, 0); fl.add(f2); fl.position.set(1.2, 6.4, 0.9); g.add(fl); V.towerFlag = fl;
    g.position.set(TOWER.x, sandY(TOWER.z), TOWER.z); g.visible = false; V.S.add(g); }      // you are up on it: the camera is your eyes
  // umbrellas, towels and sunbathers
  { const cols = [0xff4a6a, 0x2a8ad8, 0xf2c230, 0x2fb060, 0xf07a2a, 0xffffff]; for (let i = 0; i < 9; i++) { const x = (i - 4) * 1.9 + Math.sin(i * 3) * 0.6, z = -3.5 - (i % 3) * 2.6 - Math.cos(i) * 0.6; if (Math.abs(x) < 3.2) continue; const y = sandY(z);
      const u = new T.Group(), pole = new T.Mesh(V.cylG, M(0xeeeeee)); pole.scale.set(0.03, 1.9, 0.03); pole.position.y = 0.95; u.add(pole); const top = new T.Mesh(V.coneG, M(cols[i % cols.length], { side: T.DoubleSide })); top.scale.set(1.0, 0.35, 1.0); top.position.y = 1.9; top.castShadow = true; u.add(top);
      const tw = new T.Mesh(V.boxG, M(cols[(i + 2) % cols.length])); tw.scale.set(0.7, 0.02, 1.5); tw.position.set(0.6, 0.02, 0.3); u.add(tw); if (i % 2 === 0) { const sb = new T.Mesh(new T.CapsuleGeometry(0.16, 1.0, 3, 8), V.M([0x8d5524, 0xe0ac69, 0xc68642][i % 3])); sb.rotation.x = Math.PI / 2; sb.position.set(0.6, 0.18, 0.3); u.add(sb); }
      u.position.set(x, y, z); u.rotation.z = Math.sin(i) * 0.08; V.S.add(u); } }
  // the people: a pool reused by the swimmers (head, cap, shoulders, arms; legs when on the sand) and you
  V.skinM = [0x8d5524, 0xc68642, 0xe0ac69, 0x5a3825, 0xf1c27d].map(c => M(c, { roughness: 0.6 })); V.capM = [0xff4a6a, 0x2a8ad8, 0xf2c230, 0x2fb060, 0xffffff, 0x8a4fd0].map(c => M(c, { roughness: 0.4 }));
  V.pp = []; for (let i = 0; i < 24; i++) { const p = makeSwimmer(V, i); p.g.visible = false; V.S.add(p.g); V.pp.push(p); }
  V.me = makeGuard(V); V.S.add(V.me.g);
  V.flags = []; for (let i = 0; i < 3; i++) { const g = new T.Group(), pole = new T.Mesh(V.cylG, M(0xdddddd)); pole.scale.set(0.03, 1.6, 0.03); pole.position.y = 0.8; g.add(pole); const f = new T.Mesh(V.boxG, M(0xe8201a, { emissive: 0x400000 })); f.scale.set(0.5, 0.32, 0.02); f.position.set(0.25, 1.4, 0); g.add(f); g.visible = false; V.S.add(g); V.flags.push(g); }
  V.ringM = new T.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.0, depthWrite: false }); V.help = []; for (let i = 0; i < 6; i++) { const r = new T.Mesh(new T.RingGeometry(0.45, 0.55, 24).rotateX(-Math.PI / 2), V.ringM); r.visible = false; V.S.add(r); V.help.push(r); }
  V.landMark = new T.Mesh(new T.RingGeometry(0.4, 0.6, 24).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: 0x7cf07a, transparent: true, opacity: 0.8, depthWrite: false })); V.landMark.visible = false; V.S.add(V.landMark);
  V.splash = []; for (let i = 0; i < 40; i++) { const m = new T.Mesh(V.sphG, V.foamM); m.scale.setScalar(0.06); m.visible = false; V.S.add(m); V.splash.push({ m, t: 9, vx: 0, vy: 0, vz: 0 }); }
  V.ray = new T.Raycaster(); V.plane = new T.Plane(new T.Vector3(0, 1, 0), -0.05);
  W3.setQuality(stepN); return V; }
function makeSwimmer(V, i) { const T = V.T, g = new T.Group(), sk = V.skinM[i % 5], cap = V.capM[i % 6];
  const head = new T.Mesh(V.sphG, sk); head.scale.setScalar(0.19); g.add(head); const hat = new T.Mesh(new T.SphereGeometry(1, 12, 8, 0, TAU, 0, Math.PI / 2), cap); hat.scale.setScalar(0.2); hat.position.y = 0.02; head.add(hat); hat.scale.set(1.06, 1.06, 1.06); hat.position.y = 0.05;
  const body = new T.Mesh(new T.CapsuleGeometry(0.2, 0.55, 3, 8), V.M([0x2a6ad8, 0xe8463c, 0x22262e, 0x2fb060, 0xf07a2a][i % 5])); body.position.y = -0.5; g.add(body);
  const legs = new T.Mesh(new T.CapsuleGeometry(0.1, 0.6, 2, 6), sk); legs.position.y = -1.1; g.add(legs);
  const armL = new T.Group(), aL = new T.Mesh(new T.CapsuleGeometry(0.055, 0.42, 2, 6), sk); aL.position.y = 0.24; armL.add(aL); armL.position.set(0.22, -0.32, 0); g.add(armL);
  const armR = new T.Group(), aR = new T.Mesh(new T.CapsuleGeometry(0.055, 0.42, 2, 6), sk); aR.position.y = 0.24; armR.add(aR); armR.position.set(-0.22, -0.32, 0); g.add(armR);
  const ring = new T.Mesh(new T.TorusGeometry(0.42, 0.13, 8, 20), V.M([0xff4a8a, 0xffd23a, 0x2ad0d0][i % 3], { roughness: 0.3 })); ring.rotation.x = Math.PI / 2; ring.position.y = -0.3; g.add(ring);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); g.scale.setScalar(1.6); return { g, head, body, legs, armL, armR, ring }; }
function makeGuard(V) { const T = V.T, g = new T.Group(), sk = V.skinM[2], top = V.M(mySkin().top), sh = V.M(mySkin().col);
  const legs = new T.Mesh(new T.CapsuleGeometry(0.11, 0.6, 2, 6), sk); legs.position.y = 0.45; g.add(legs); const shorts = new T.Mesh(new T.CapsuleGeometry(0.2, 0.15, 2, 8), sh); shorts.position.y = 0.85; g.add(shorts);
  const b = new T.Mesh(new T.CapsuleGeometry(0.22, 0.45, 3, 8), top); b.position.y = 1.2; g.add(b); const h = new T.Mesh(V.sphG, sk); h.scale.setScalar(0.15); h.position.y = 1.72; g.add(h);
  const tube = new T.Mesh(new T.CapsuleGeometry(0.1, 0.7, 3, 8), V.M(0xff2a1a, { roughness: 0.4 })); tube.rotation.z = Math.PI / 2.4; tube.position.set(0.25, 1.05, 0.15); g.add(tube);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); g.scale.setScalar(1.25); return { g, top, sh, tube, b }; }
// ---------- each frame ----------
function sync(V, G, dt) { V.t += dt; const T = V.T;
  if (V.for !== G.seed + ':' + G.N) { V.for = G.seed + ':' + G.N; W3.setSky(G.sky); V.ripMs.forEach(m => V.S.remove(m)); V.ripMs = G.rips.map(r => { const m = new T.Mesh(new T.PlaneGeometry(r.w * 2 * VX, 21).rotateX(-Math.PI / 2), V.ripM); m.position.set(r.x * VX, 0.03, 11.5); V.S.add(m); return m; }); V.me.top.color.setHex(mySkin().top); V.me.sh.color.setHex(mySkin().col); }
  // waves: three crests rolling in; no foam where a rip runs out (the gap you learn to look for)
  const m4 = new T.Matrix4(), q = new T.Quaternion(), sc = new T.Vector3(), ps = new T.Vector3(); let n = 0;
  for (let c = 0; c < 3; c++) { const z = 17 - ((V.t * 1.4 + c * 5.5) % 16), br = z < 15 && z > 2 ? Math.min(1, (15 - z) / 2.5) * Math.min(1, (z - 2) / 3) : 0;
    for (let i = 0; i < 40; i++) { const x = (i - 19.5) * 0.55, sx = x / VX, gap = G.rips.some(r => Math.abs(sx - r.x) < r.w * 0.85); const s = gap ? 0.02 : br * (0.6 + 0.4 * Math.sin(i * 1.7 + c)); ps.set(x, 0.05 + s * 0.05, z + Math.sin(i * 0.9 + c * 2) * 0.25); sc.set(1, 1, 0.2 + s * 1.1); m4.compose(ps, q, sc); if (s < 0.05) { sc.set(0.0001, 1, 0.0001); m4.compose(ps, q, sc); } V.foam.setMatrixAt(n++, m4); } }
  V.foam.instanceMatrix.needsUpdate = true; V.wash.position.set(0, 0.03, 0.6 + Math.sin(V.t * 0.9) * 0.5); V.wash.material.opacity = 0.35 + Math.sin(V.t * 0.9) * 0.15;
  // foam drifting out along each rip
  V.speckD.forEach((d, i) => { const r = G.rips[i % G.rips.length]; d.z += r.v * dt * (0.6 + (i % 5) * 0.15); d.x += Math.sin(V.t * 2 + i) * dt * 0.1; if (d.z > 20) { d.z = 1 + Math.random() * 6; d.x = Math.random() - 0.5; } ps.set((r.x + d.x * r.w * 1.4) * VX, 0.04, d.z); const f = Math.min(1, (20 - d.z) / 6) * (0.5 + 0.5 * ((i * 7) % 3) / 2); sc.set(f, 1, f); m4.compose(ps, q, sc); V.specks.setMatrixAt(i, m4); }); V.specks.instanceMatrix.needsUpdate = true;
  V.buoys.forEach((b, i) => { b.position.y = 0.06 + Math.sin(V.t * 1.6 + i) * 0.05; }); V.towerFlag.rotation.y = Math.sin(V.t * 2) * 0.3 + (G.wind ? 0.8 : 0);
  G.rips.forEach((r, i) => { const f = V.flags[i]; f.visible = !!r.flag; if (f.visible) f.position.set(r.x * VX, sandY(-1), -1); });
  // the swimmers
  const live = G.sw.filter(s => s.st !== 'out'); let hi = 0;
  V.pp.forEach((p, i) => { const s = live[i]; p.g.visible = !!s; if (!s) return; const inW = s.z > 0.4, y0 = inW ? 0.02 : sandY(s.z) + 2.35, ph = s.ph;
    p.legs.visible = !inW; p.body.visible = true; p.ring.visible = !!s.float && inW; p.g.position.set(s.x * VX, y0, s.z); p.g.rotation.set(0, Math.PI, 0); p.armL.rotation.set(0, 0, 0); p.armR.rotation.set(0, 0, 0);
    if (!inW) { p.g.position.y += Math.abs(Math.sin(ph * 8)) * 0.05; p.armL.rotation.x = Math.sin(ph * 8) * 0.5 + Math.PI; p.armR.rotation.x = -Math.sin(ph * 8) * 0.5 + Math.PI; return; }
    p.body.position.y = -0.5; p.head.position.y = 0;
    if (s.st === 'trouble') { const u = s.tr / Math.min(s.T, G.cfg.T), quiet = 0.42 - 0.12 * upLv('bino');
      if (u < quiet) { p.g.position.y = -0.1 + Math.sin(ph * 2) * 0.04; p.head.rotation.x = -0.5; }      // low in the water, head tilted back: easy to miss
      else if (u < 0.78) { p.g.position.y = -0.06 + Math.abs(Math.sin(ph * 5)) * 0.12; p.armL.rotation.z = 1.2 + Math.sin(ph * 9) * 0.6; p.armR.rotation.z = -1.2 - Math.sin(ph * 9 + 1) * 0.6; if (Math.random() < 0.25) splash(V, s.x * VX, s.z); }
      else { p.g.position.y = Math.abs(Math.sin(ph * 6)) * 0.1; p.armL.rotation.z = Math.PI * 0.95 + Math.sin(ph * 10) * 0.25; if (Math.random() < 0.35) splash(V, s.x * VX, s.z); }
      if (G.cfg.help && hi < V.help.length) { const r = V.help[hi++]; r.visible = true; r.position.set(s.x * VX, 0.06, s.z); } }
    else if (s.st === 'towed') { p.g.position.y = -0.05; p.head.rotation.x = -0.6; }
    else { p.head.rotation.x = 0; p.g.position.y = Math.sin(ph * 1.7) * 0.05; const sw = Math.sin(ph * 3); p.armL.rotation.x = sw * 1.2; p.armR.rotation.x = -sw * 1.2; } });
  for (let i = hi; i < V.help.length; i++) V.help[i].visible = false; V.ringM.opacity = G.cfg.help ? 0.5 + Math.sin(V.t * 5) * 0.2 : 0;
  // you
  const L = G.lg, me = V.me, onT = L.st === 'tower'; me.g.visible = !onT; me.g.position.set(L.x * VX, onT ? sandY(TOWER.z) + 3.28 : (L.z > 1.2 ? -1.9 : sandY(L.z)), onT ? TOWER.z + 0.8 : L.z); me.g.rotation.y = onT ? 0 : (L.face != null ? Math.atan2(Math.sin(L.face) * VX, Math.cos(L.face)) : 0);
  if (!onT && L.z < 1.2) me.g.position.y += Math.abs(Math.sin(V.t * 12)) * 0.08;
  V.landMark.visible = !!(L.st === 'tow' && L.land); if (L.land) V.landMark.position.set(L.land.x * VX, sandY(0.2) + 0.06, 0.2);
  for (const d of V.splash) { if (d.t < 0.8) { d.t += dt; d.vy -= 9 * dt; d.m.position.x += d.vx * dt; d.m.position.y += d.vy * dt; d.m.position.z += d.vz * dt; d.m.visible = d.m.position.y > -0.05; } else d.m.visible = false; }
  // the camera: high on the tower, looking out to sea
  const pos = [0, 9.2, -8.5], tgt = [0, 0, 9.8]; if (!ui.cam || ui.snap) { ui.cam = { p: pos.slice(), l: tgt.slice() }; ui.snap = false; }
  const sh = FX.shake > 0 ? (Math.random() - 0.5) * FX.shake * 0.01 : 0, cam = W3.cam; cam.position.set(ui.cam.p[0] + sh, ui.cam.p[1] + sh, ui.cam.p[2]); cam.lookAt(ui.cam.l[0], ui.cam.l[1], ui.cam.l[2]); cam.updateMatrixWorld();
  W3.setFocus(0, 0, 4, 26); }
function splash(V, x, z) { const d = V.splash.find(q => q.t >= 0.8); if (!d) return; d.t = 0; d.m.position.set(x + (Math.random() - 0.5) * 0.4, 0.1, z + (Math.random() - 0.5) * 0.3); d.vx = (Math.random() - 0.5) * 1.2; d.vy = 1.5 + Math.random() * 1.5; d.vz = (Math.random() - 0.5) * 1.2; }
// where things are on the screen, and where a tap lands on the beach (in the rules' metres)
function scrOf(x, y, z) { const V = V3; if (!V || V.none) return null; return W3.screen(new V.T.Vector3(x * VX, y, z)); }
function worldAt(px, py) { const V = V3; if (!V || V.none) return null; const T = V.T, ndc = new T.Vector2(px / W * 2 - 1, -(py / H) * 2 + 1); V.ray.setFromCamera(ndc, W3.cam); const p = new T.Vector3(); if (!V.ray.ray.intersectPlane(V.plane, p)) return null; return { x: p.x / VX, z: p.z }; }
// ---------- events ----------
function onEvent(G, e) { const at = (x, z) => scrOf(x, 0.6, z) || { x: W / 2, y: H / 2 };
  switch (e.k) {
    case 'start': if (!G.lesson) { ui.banner = { txt: G.beach.toUpperCase(), sub: G.cfg.practice ? 'practice: no clock' : `a ${G.cfg.shift}-second shift · miss two and the beach closes`, t: 0, secs: 2.8 }; tip('start', 'Watch the water. Trouble starts quietly: low in the water, head back.', 3.6); } ui.snap = true; break;
    case 'risk': if (e.cause === 'rip') tip('risk', 'Someone is in a rip. Tap them to whistle them back.', 3.2); else if (e.cause === 'far') tip('far', 'Past the orange buoys is too far. Tap to whistle them in.', 3.2); else tip('windrisk', 'Offshore wind: inflatables drift out. Whistle them in.', 3.2); break;
    case 'trouble': if (!G.lesson) sfx.tense(); break;
    case 'whistle': sfx.whistle(); vibe(HAP.tick); { const p = at(e.x, e.z); say('📣', p.x, p.y - 20 * k, '#fff', 22); } break;
    case 'go': sfx.go(); vibe(HAP.light); break;
    case 'grab': sfx.grab(); vibe(HAP.thud); tip('land', 'Now tap the beach where you will bring them in: not straight back up a rip.', 3.6); break;
    case 'land': sfx.click(); if (e.through) { ui.banner = { txt: 'UP THE RIP: SLOW GOING', sub: 'Across it first, then in, is quicker', t: 0, secs: 2.2, small: true }; } break;
    case 'saved': sfx.saved(); vibe(HAP.best); FX.flash = 0.3; { const p = at(e.x, -1); say('SAFE!', p.x, p.y - 30 * k, '#9be3b5', 26); burst(p.x, p.y - 20 * k, '#ffe08a', 16); } break;
    case 'false': sfx.no(); { ui.banner = { txt: 'THEY WERE FINE', sub: 'Back up the tower. Look first: low in the water, or in the gap.', t: 0, secs: 2.6, small: true }; } break;
    case 'fine': sfx.no(); { const p = at(e.x, e.z); say('THEY\'RE FINE', p.x, p.y - 20 * k, '#ffd0a0', 16); } break;
    case 'nothing': if (e.rip) tip('gap', 'Flags go where the waves do not break: tap the gap', 3); break;
    case 'busy': sfx.no(); say('YOU\'RE OUT ALREADY', W / 2, H * 0.6, '#ffd0a0', 16); break;
    case 'flag': sfx.flag(); vibe(HAP.light); say('RIP FLAGGED', W / 2, H * 0.45, '#ff9a8a', 20); break;
    case 'noflag': sfx.no(); say('NO FLAGS LEFT', W / 2, H * 0.45, '#ffd0a0', 16); break;
    case 'wind': ui.banner = { txt: 'OFFSHORE WIND', sub: 'Inflatables will drift out', t: 0, secs: 2.4, small: true }; sfx.wind(); break;
    case 'missed': sfx.missed(); FX.red = 0.6; ui.banner = { txt: 'THE JET SKI GOT THEM', sub: G.lives > 0 ? `One more miss and the beach closes` : '', t: 0, secs: 2.6, small: true }; break;
    case 'lessonnext': if (e.first) hint = null; say('FIRST, A LESSON', W / 2, H * 0.36, '#ffd36a', 24); sfx.whistle(); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, W / 2, H * 0.36, '#9be3b5', 24); sfx.coin(e.n); break;
    case 'lessonmiss': hint = { txt: e.how, t: 0, secs: 3.6 }; break;
    case 'lessondone': say('YOU KNOW IT. ON DUTY!', W / 2, H * 0.36, '#ffd36a', 24); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': FX.flash = 0.6; sfx.win(); vibe(HAP.best); break;
    case 'lost': sfx.lose(); break;      // (P11: never vibrate on failure)
  } }
// ---------- the picture ----------
let IG = null, IM = {}; function idleG() { if (!IG || IG.over || IG.t > 60) { IG = newGame(4 + ((Math.random() * 6) | 0), { seed: (Math.random() * 1e6) | 0 }); IM = {}; ui.snap = true; } honest(IG, { react: 0.4, acc: 0.95 }, IM); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#10283a'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D beach.', W / 2, H / 2); if (G) hud(G, now); return; }
  const g = G || idleG(); sync(V, g, dt || 1 / 60); W3.render(dt || 1 / 60);
  if (FX.red > 0) { ctx.fillStyle = `rgba(200,40,30,${FX.red * 0.18})`; ctx.fillRect(0, 0, W, H); }
  if (G && !(G.over && !$('ovEnd').classList.contains('hidden'))) hud(G, now);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 1.1 ? 1 : 1 - (t2.t - 1.1) / 0.5; ctx.globalAlpha = Math.max(0, al); ctx.font = `800 ${Math.round(t2.size * k)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(8,24,36,.7)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 18); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 18); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30, hy = H - 80 * k - h / 2;
    ctx.fillStyle = 'rgba(8,28,40,.92)'; rrect(W / 2 - w / 2, hy - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, hy - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,250,230,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); } }
function layout(G) { return {}; }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function hud(G, now) { const L = G.lg, c = G.cfg;
  ctx.textBaseline = 'middle';
  if (G.lesson) lessonPanel(G);
  else { ctx.textAlign = 'left'; ctx.font = `800 ${Math.round(18 * k)}px ${TF}`; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(8,24,36,.55)'; ctx.strokeText(G.beach, 14, 22 * k); ctx.fillStyle = '#fff'; ctx.fillText(G.beach, 14, 22 * k);
    if (!c.practice) { const left = Math.max(0, c.shift - (G.t - G.t0)), w = W * 0.38; ctx.fillStyle = 'rgba(0,0,0,.3)'; rrect(14, 40 * k, w, 7 * k, 4); ctx.fill(); ctx.fillStyle = '#ffcf3a'; rrect(14, 40 * k, Math.max(4, w * left / c.shift), 7 * k, 4); ctx.fill();
      ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillStyle = '#fff'; ctx.lineWidth = 3; ctx.strokeText(left > 0 ? `${Math.ceil(left)}s of the shift left` : 'Last one in, then home', 14, 56 * k); ctx.fillText(left > 0 ? `${Math.ceil(left)}s of the shift left` : 'Last one in, then home', 14, 56 * k); }
    ctx.textAlign = 'right'; ctx.font = `800 ${Math.round(18 * k)}px ${TF}`; const lv = '🛟'.repeat(Math.max(0, G.lives)) + '·'.repeat(Math.max(0, c.lives - G.lives)); ctx.strokeText(lv, W - 14, 22 * k); ctx.fillText(lv, W - 14, 22 * k);
    ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = '#fff'; ctx.strokeText(`${G.saved} saved · ${G.whistles} whistled${c.flags ? ` · 🚩${G.flags}` : ''}`, W - 14, 44 * k); ctx.fillText(`${G.saved} saved · ${G.whistles} whistled${c.flags ? ` · 🚩${G.flags}` : ''}`, W - 14, 44 * k); }
  // while you have them: where to bring them in
  if (L.st === 'tow' && !L.land) { const y = H - 120 * k; ctx.textAlign = 'center'; ctx.font = `800 ${Math.round(20 * k)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(8,24,36,.7)'; const tx = 'TAP THE BEACH TO BRING THEM IN'; ctx.strokeText(tx, W / 2, y); ctx.fillStyle = '#9be3b5'; ctx.fillText(tx, W / 2, y);
    const a = Math.max(0, 1 - L.towT / 3.5); ctx.fillStyle = 'rgba(155,227,181,.8)'; rrect(W / 2 - 80 * k, y + 18 * k, 160 * k * a, 5 * k, 3); ctx.fill(); }
  // back up the tower after a false alarm: the binoculars are out of reach for a moment
  if (G.fog > 0.3) { ctx.fillStyle = `rgba(8,24,36,${Math.min(0.35, G.fog * 0.15)})`; ctx.fillRect(0, 0, W, H); ctx.textAlign = 'center'; ctx.font = `800 ${Math.round(16 * k)}px ${TF}`; ctx.fillStyle = '#ffd0a0'; ctx.fillText(L.wasted ? 'BACK UP THE TOWER…' : 'LOOK FIRST…', W / 2, H * 0.5); } }
function lessonPanel(G) { const D = G.lesson, st0 = D.steps[D.i], x = 12, w = W - 24, y = 46 * k; ctx.save();
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; const lines = wrapText(st0.how, w - 24), h = 50 * k + lines.length * 17 * k;
  ctx.fillStyle = 'rgba(8,28,40,.9)'; rrect(x, y, w, h, 12); ctx.fill(); ctx.strokeStyle = 'rgba(255,207,58,.8)'; ctx.lineWidth = 2; rrect(x, y, w, h, 12); ctx.stroke();
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#ffcf3a'; ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillText(`LESSON ${G.N} OF 3`, x + 12, y + 9 * k);
  ctx.fillStyle = '#fff'; ctx.font = `800 ${Math.round(17 * k)}px ${TF}`; ctx.fillText(st0.title, x + 12, y + 23 * k);
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.9)'; lines.forEach((l, i) => ctx.fillText(l, x + 12, y + 45 * k + i * 17 * k));
  for (let i = 0; i < st0.need; i++) { ctx.beginPath(); ctx.arc(x + w - 16 - (st0.need - 1 - i) * 18 * k, y + 16 * k, 6 * k, 0, TAU); if (i < D.n) { ctx.fillStyle = '#8fe0ab'; ctx.fill(); } else { ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; ctx.stroke(); } }
  ctx.restore(); }
