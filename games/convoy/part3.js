// ===================== THE VIEW: Convoy Escort (sideways; above and behind your ship) =====================
// A rolling grey-green sea under a changing sky (morning, overcast, squalls, night, storm), your destroyer with its wake, the
// merchant ships in their columns, the other escorts, and the harbour light ahead. Submarines stay unseen until they surface
// or show a periscope; what you know of them are the rings on the water (red: a sure contact; orange: older, and growing as
// it gets old), torpedo wakes running white, depth-charge columns, survivors' rafts. The map button shows it all from above.
const FX = { shake: 0, stop: 0, flash: 0, red: 0, slow: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { snap: true, banner: null, stick: null, btn: {}, cam: null, yaw: 0, map: false };
const optShake = () => store.get('shake', true) !== false;
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 160) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40 * k, t: 0, life: 0.5 + Math.random() * 0.4, col, r: (1.5 + Math.random() * 2.5) * k }); } if (PARTS.length > 240) PARTS.splice(0, PARTS.length - 240); }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2.5); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.4) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 200 * dt; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (ui.banner) { ui.banner.t += dt; if (ui.banner.t > (ui.banner.secs || 1.6)) ui.banner = null; }
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; } }
function mySkin() { if (typeof HEADLESS !== 'undefined' && HEADLESS) return SKINS[0]; const id = store.get('skin', 'grey'); return SKINS.find(q => q.id === id) || SKINS[0]; }
function buildWorld() {
  if (V3) return V3; const T = window.THREE; if (!T || !W3 || !W3.init({ canvas: $('gl'), fov: 55, far: 5000, near: 1, dims: () => [W, H] })) { V3 = { none: true }; return V3; }
  V3 = { T, S: W3.scene, t: 0, for: null, items: [], fx: [] }; const V = V3, M = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.7 }, o)); V.M = M;
  V.boxG = new T.BoxGeometry(1, 1, 1); V.cylG = new T.CylinderGeometry(1, 1, 1, 12);
  V.sea = W3.water({ size: 9000, color: 0x2a4a52, y: 0 });
  { const T2 = THREE, tint = new T2.Mesh(new T2.PlaneGeometry(9000, 9000), new T2.MeshBasicMaterial({ color: 0x1f4f66, transparent: true, opacity: 0.5, depthWrite: false })); tint.rotation.x = -Math.PI / 2; tint.position.y = 0.05; tint.renderOrder = 1; W3.scene.add(tint); V.tint = tint; }      /* 22 Nov 2026: a sea-blue wash; the water was a glare of mirrored cloud that hid the ships */
  V.me = ship(V, 'escort', mySkin().col); V.S.add(V.me);
  V.ringG = new T.RingGeometry(0.94, 1, 48).rotateX(-Math.PI / 2); V.wakeG = new T.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  V.course = new T.Line(new T.BufferGeometry().setFromPoints(Array.from({ length: 24 }, () => new T.Vector3())), new T.LineDashedMaterial({ color: 0xffffff, dashSize: 8, gapSize: 6, transparent: true, opacity: 0.7 })); V.S.add(V.course);
  V.port = new T.Group(); { const tw = new T.Mesh(V.cylG, M(0xe8e4dc)); tw.scale.set(4, 30, 4); tw.position.y = 15; V.port.add(tw); const lt = new T.Mesh(new T.SphereGeometry(3, 12, 8), new T.MeshBasicMaterial({ color: 0xffe080 })); lt.position.y = 32; V.port.add(lt); const isl = new T.Mesh(new T.CylinderGeometry(80, 110, 8, 16), M(0x5a6a4a)); isl.position.y = 0; V.port.add(isl); } V.S.add(V.port);
  W3.setQuality(stepN); return V; }
// a ship: an escort (long, low, a gun forward), a merchant (big, a high bridge aft), a submarine (a dark cigar and a tower)
function ship(V, kind, col) { const T = V.T, M = V.M, g = new T.Group(), b = (m, sx, sy, sz, x, y, z) => { const q = new T.Mesh(V.boxG, m); q.scale.set(sx, sy, sz); q.position.set(x, y, z); q.castShadow = true; g.add(q); return q; };
  if (kind === 'escort' || kind === 'ally') { const hull = M(col || 0x7a8288), dk = M(0x4a4a48); b(hull, 95, 7, 11, 0, 1.5, 0); b(hull, 20, 6, 7, 47, 1.5, 0).rotation.y = 0; b(dk, 22, 6, 8, 8, 7, 0); b(dk, 9, 6, 6, 10, 13, 0); const f = new T.Mesh(V.cylG, M(0x3a3a3a)); f.scale.set(2.4, 9, 2.4); f.position.set(-6, 12, 0); g.add(f);
    const gun = b(dk, 6, 3, 4, 32, 6.5, 0); b(dk, 8, 1, 1, 37, 7.5, 0); b(M(0x8a8a8a), 6, 2, 6, -40, 5, 0); }
  else if (kind === 'merchant') { const hull = M(col || 0x3a2a24), top = M(0xd8d0c0); b(hull, 130, 14, 20, 0, 2, 0); b(top, 18, 10, 16, -44, 13, 0); b(M(0x9a3a2a), 3, 8, 3, -44, 22, 0); for (const x of [-10, 20, 45]) b(M(0x5a4a3a), 16, 6, 14, x, 11, 0); }
  else { const hull = M(0x2a2e30, { roughness: 0.4 }); b(hull, 66, 6, 7, 0, 0, 0); b(hull, 9, 8, 4, 6, 6, 0); }
  return g; }
function buildPlace(V, G) { const T = V.T; for (const o of V.items) V.S.remove(o); V.items = []; const add = o => { V.S.add(o); V.items.push(o); return o; };
  W3.setSky(PLACES[G.cfg.place].sky, { wind: [Math.cos(G.dir), Math.sin(G.dir)] }); if (W3.S.night || W3.S.rain || W3.S.storm || /dusk|storm|night|overcast/.test(PLACES[G.cfg.place].sky)) { W3.S.exposure *= 1.2; W3.R.toneMappingExposure = W3.S.exposure; if (W3.S.hemiI != null) W3.S.hemiI *= 1.3; }      /* 22 Nov 2026: bad weather at sea was too dark to read */
  V.ms = G.M.map(m => add(ship(V, 'merchant', [0x3a2a24, 0x2a3a4a, 0x4a3a2a, 0x2a2a2a, 0x5a2a2a, 0x2a4a3a][m.i % 6])));
  V.al = G.allies.map(() => add(ship(V, 'ally', 0x8a9298)));
  V.subs = G.subs.map(() => { const g = add(ship(V, 'sub')); const peri = new T.Mesh(V.cylG, V.M(0x2a2e30)); peri.scale.set(0.4, 7, 0.4); peri.position.y = 3.5; g.userData.peri = peri; add(peri); return g; });
  V.port.position.set(G.port.x + Math.cos(G.dir) * 250, 0, G.port.z + Math.sin(G.dir) * 250);
  V.forSubs = G.subs.length; ui.snap = true; }
const pool = (V, key, make) => { V.pools = V.pools || {}; const P = V.pools[key] = V.pools[key] || { all: [], n: 0 }; if (P.n >= P.all.length) { const o = make(); V.S.add(o); P.all.push(o); } const o = P.all[P.n++]; o.visible = true; return o; };
function poolEnd(V) { for (const k2 in V.pools || {}) { const P = V.pools[k2]; for (let i = P.n; i < P.all.length; i++) P.all[i].visible = false; P.n = 0; } }
function sync(V, G, dt) { V.t += dt; const T = V.T, me = G.me;
  if (V.for !== G.M || V.forSubs !== G.subs.length) { V.for = G.M; buildPlace(V, G); }
  const bob = (o, ph, s = 1) => { o.rotation.z = Math.sin(V.t * 0.8 + ph) * 0.03 * s; o.rotation.x = Math.sin(V.t * 0.6 + ph * 2) * 0.02 * s; };
  V.me.position.set(me.x, 0, me.z); V.me.rotation.set(0, -me.h, 0); bob(V.me, 0);
  G.M.forEach((m, i) => { const o = V.ms[i]; if (!o) return; o.position.set(m.x, m.sunk ? Math.max(-30, (o.position.y || 0) - dt * 2) : 0, m.z); o.rotation.y = -G.dir; if (m.sunk) o.rotation.z = Math.min(0.5, (o.rotation.z || 0) + dt * 0.05); else bob(o, i + 1, 0.6); });
  G.allies.forEach((a, i) => { const o = V.al[i]; o.position.set(a.x, 0, a.z); o.rotation.y = -a.h; bob(o, i + 7); });
  G.subs.forEach((s, i) => { const o = V.subs[i]; if (!o) return; const show = s.surf && !s.gone; o.visible = show; o.position.set(s.x, s.surf ? 1 : -20, s.z); o.rotation.y = -s.h; const p = o.userData.peri; p.visible = !s.gone && !s.surf && s.peri > 0 && !G.cfg.night; p.position.set(s.x, 3.5, s.z); });
  // contacts, torpedo wakes, charges, survivors (pooled meshes)
  for (const c of G.contacts) { const r = pool(V, 'ring', () => new T.Mesh(V.ringG, new T.MeshBasicMaterial({ color: 0xff4a3a, transparent: true, opacity: 0.85, depthWrite: false }))); r.position.set(c.x, 0.6, c.z); r.scale.setScalar(Math.max(12, c.r)); const age = G.t - c.t; r.material.color.setHex(c.sure && age < 8 ? 0xff3a2a : c.heard ? 0xffd040 : 0xff9a3a); r.material.opacity = clamp(1 - age / 90, 0.2, 0.9); }
  for (const tp of G.torps) { const w = pool(V, 'wake', () => new T.Mesh(V.wakeG, new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, depthWrite: false }))); w.position.set(tp.x - Math.cos(tp.h) * 30, 0.5, tp.z - Math.sin(tp.h) * 30); w.rotation.y = -tp.h; w.scale.set(60, 1, 2.2); w.material.opacity = G.cfg.night ? 0.25 : 0.85; }
  for (const b of G.blasts) { if (b.t > 0) { const d = pool(V, 'can', () => new T.Mesh(V.cylG, V.M(0x2a2a2a))); d.scale.set(0.8, 1.4, 0.8); d.position.set(b.x, 0.5, b.z); continue; } const u = -b.t / 3, c2 = pool(V, 'plume', () => new T.Mesh(new T.CylinderGeometry(4, 10, 1, 12, 1, true), new T.MeshBasicMaterial({ color: 0xf4f8fa, transparent: true, opacity: 0.85, depthWrite: false, side: T.DoubleSide }))); c2.scale.set(1 + u, 40 * Math.sin(Math.min(1, u * 2) * Math.PI / 2) * (1 - u) + 2, 1 + u); c2.position.set(b.x, c2.scale.y / 2, b.z); c2.material.opacity = 0.85 * (1 - u); }
  for (const s of G.surv) { const r2 = pool(V, 'raft', () => new T.Mesh(V.cylG, new T.MeshBasicMaterial({ color: 0xff8a1a }))); r2.scale.set(2.2, 0.8, 2.2); r2.position.set(s.x, 0.6 + Math.sin(V.t * 2 + s.x) * 0.3, s.z); }
  if (G.marker) { const r3 = pool(V, 'mark', () => new T.Mesh(new T.CylinderGeometry(3, 3, 40, 10, 1, true), new T.MeshBasicMaterial({ color: 0xffe040, transparent: true, opacity: 0.4, depthWrite: false, side: T.DoubleSide }))); r3.position.set(G.marker.x, 20, G.marker.z); }
  poolEnd(V);
  // the projected course: 30 seconds on with the wheel as it is
  { const p = V.course.geometry.attributes.position; let x = me.x, z = me.z, h = me.h; for (let i = 0; i < 24; i++) { p.setXYZ(i, x, 1.5, z); const dtt = 1.3; h += G.stick * 0.13 * clamp(Math.abs(me.v) / 6, 0.25, 1.2) * dtt; x += Math.cos(h) * Math.max(3, Math.abs(me.v)) * dtt; z += Math.sin(h) * Math.max(3, Math.abs(me.v)) * dtt; } p.needsUpdate = true; V.course.computeLineDistances(); }
  // the camera: above and behind, swinging after the ship's heading
  if (ui.snap) ui.yaw = me.h; let dy = me.h - ui.yaw; while (dy > Math.PI) dy -= TAU; while (dy < -Math.PI) dy += TAU; ui.yaw += dy * Math.min(1, dt * 1.5);
  const back = 120, up = 62, pos = [me.x - Math.cos(ui.yaw) * back, up, me.z - Math.sin(ui.yaw) * back], tgt = [me.x + Math.cos(ui.yaw) * 120, 0, me.z + Math.sin(ui.yaw) * 120];
  if (!ui.cam || ui.snap) { ui.cam = { p: pos.slice(), l: tgt.slice() }; ui.snap = false; } const kc = Math.min(1, dt * 3); for (let i = 0; i < 3; i++) { ui.cam.p[i] += (pos[i] - ui.cam.p[i]) * kc; ui.cam.l[i] += (tgt[i] - ui.cam.l[i]) * kc; }
  const sh = FX.shake > 0 && optShake() ? (Math.random() - 0.5) * FX.shake * 0.1 : 0, cam = W3.cam; cam.position.set(ui.cam.p[0] + sh, ui.cam.p[1] + sh, ui.cam.p[2]); cam.lookAt(ui.cam.l[0], ui.cam.l[1], ui.cam.l[2]); cam.updateMatrixWorld();
  W3.setFocus(me.x, 0, me.z, 200); }
function scrOf(x, y, z) { const V = V3; if (!V || V.none) return null; return W3.screen(new V.T.Vector3(x, y, z)); }
// ---------- events ----------
function onEvent(G, e) { const me = G.me, at = (x, z) => scrOf(x, 12, z) || { x: W / 2, y: H * 0.4 };
  switch (e.k) {
    case 'ping': sfx.ping(); break;
    case 'contact': if (e.sure) { sfx.sure(); } else sfx.echo(e.d); break;
    case 'noecho': break;
    case 'heard': break;
    case 'report': ui.rep = { txt: e.txt, t: 0, pri: e.pri }; if (e.pri >= 2) sfx.alarm(); else sfx.radio(); break;
    case 'drop': sfx.drop(); vibe(HAP.tick); break;
    case 'boom': { sfx.boom(Math.hypot(e.x - me.x, e.z - me.z)); const d = Math.hypot(e.x - me.x, e.z - me.z); FX.shake = Math.max(FX.shake, clamp(14 - d / 25, 2, 12)); if (d < 300) vibe(HAP.thud); } break;
    case 'subhit': { const p = at(e.x, e.z); say('HIT!', p.x, p.y - 30 * k, '#ffd36a', 30); burst(p.x, p.y, '#ffd36a', 18); sfx.hit(); } break;
    case 'subsunk': { const p = at(e.x, e.z); say('SUBMARINE SUNK!', W / 2, H * 0.3, '#ffd36a', 32); burst(p.x, p.y, '#ffd36a', 30, 200); FX.flash = 0.4; sfx.sunk(); vibe(HAP.best); } break;
    case 'gun': sfx.gun(); vibe(HAP.tick); FX.shake = Math.max(FX.shake, 3); break;
    case 'gunhit': { const p = at(e.x, e.z); burst(p.x, p.y, '#ff9a3a', 12); sfx.boom(600); } break;
    case 'gunmiss': break;
    case 'torpedo': ui.banner = { txt: 'TORPEDOES!', sub: 'Watch the wakes', t: 0, secs: 1.6, small: true }; FX.red = 0.4; break;
    case 'mhit': { sfx.boom(Math.hypot(e.x - me.x, e.z - me.z)); FX.red = 0.6; FX.shake = 8; } break;
    case 'msunk': ui.banner = { txt: 'A SHIP IS GOING DOWN', sub: 'Survivors in the water: send the crew to rescue them', t: 0, secs: 2.4, small: true }; break;
    case 'mehit': sfx.boom(0); FX.red = 1; FX.shake = 16; vibe(HAP.heavy); ui.banner = { txt: 'WE ARE HIT!', sub: { engOk: 'Engine damaged: speed down', sonarOk: 'Sonar out', gunOk: 'Gun out' }[e.part] + ' · fire and flooding', t: 0, secs: 2.6, small: true }; tip('crew', 'Send the crew: 🔥 fight the fire first, then 🔧 repair.', 4); break;
    case 'periscope': tip('peri', 'A periscope! He is shallow: set depth charges to SHALLOW.', 3.4); break;
    case 'scared': break;
    case 'crew': sfx.click(); break; case 'jobdone': sfx.job(); break; case 'crewbusy': sfx.no(); say('ALL TEAMS BUSY', W * 0.2, 130 * k, '#ffd0a0', 18); break; case 'toofar': sfx.no(); say('GET CLOSER TO THE SURVIVORS', W * 0.25, 130 * k, '#ffd0a0', 18); break;
    case 'fast': if (e.why === 'danger') say('DANGER: BACK TO NORMAL SPEED', W / 2, H * 0.24, '#ffd0a0', 20); sfx.click(); break; case 'nofast': sfx.no(); break;
    case 'notarget': sfx.no(); break;
    case 'lessonnext': if (e.first) hint = null; say('FIRST, A LESSON', W / 2, H * 0.36, '#ffd36a', 24); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, W / 2, H * 0.4, '#8fe0ab', 24); sfx.coin(e.n); break;
    case 'lessondone': say('READY: ESCORT THE CONVOY', W / 2, H * 0.36, '#ffd36a', 24); sfx.sunk(); ui.snap = true; if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); FX.flash = 0.5; vibe(HAP.best); break;
    case 'lost': sfx.lose(); break;      // (P11: never vibrate on failure)
  } }
// ---------- the picture ----------
let IG = null, IM = {}; function idleG() { if (!IG || IG.over || IG.t > 80) { IG = newGame(4 + ((Math.random() * 10) | 0), { seed: (Math.random() * 1e6) | 0 }); IM = {}; ui.snap = true; } honest(IG, { react: 0.3, acc: 0.95 }, IM); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#2a4a52'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D sea.', W / 2, H / 2); if (G) hud(G, now); return; }
  const g = G || idleG(); sync(V, g, dt || 1 / 60); W3.render(dt || 1 / 60);
  if (FX.red > 0) { ctx.fillStyle = `rgba(200,40,30,${FX.red * 0.18})`; ctx.fillRect(0, 0, W, H); }
  if (G && !(G.over && !$('ovEnd').classList.contains('hidden'))) hud(G, now);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 1.1 ? 1 : 1 - (t2.t - 1.1) / 0.5; ctx.globalAlpha = Math.max(0, al); ctx.font = `400 ${Math.round(t2.size * 0.85 * k)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(10,20,26,.75)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 18); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 18); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, Math.min(W - 380 * k, 400 * k)), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30, hy = H - 58 * k - h / 2;
    ctx.fillStyle = 'rgba(10,20,26,.92)'; rrect(W / 2 - w / 2, hy - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, hy - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,250,230,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); } }
// ---------- the HUD ----------
// what the crew should do now, most urgent first (null: nothing to do, or nobody free)
function crewNeed(G) { const me = G.me; if (!G.crew.some(c => !c.job)) return null; const busy = j => G.crew.some(c => c.job === j);
  if (me.fire > 0 && !busy('fire')) return 'fire'; if ((!me.engOk || !me.sonarOk || !me.gunOk || me.flood > 0) && !busy('repair')) return 'repair'; if (G.surv.some(s => Math.hypot(s.x - me.x, s.z - me.z) < 220) && !busy('rescue')) return 'rescue'; return null; }
// 22 Nov 2026 (the audit: thirteen buttons was far too many): the wheel, PING and DROP are always there; SPEED and DEPTH are one
// button each (a tap moves to the next setting); GUN shows only when a submarine is on the surface, and one CREW button only
// when there is a job to do (it sends a team to the most urgent one).
function layout(G) { const need = G ? crewNeed(G) : null, surf = G ? G.subs.some(s => s.surf && !s.gone && Math.hypot(s.x - G.me.x, s.z - G.me.z) < 1600) : false;
  return { ping: { x: W - 74 * k, y: H - 80 * k, r: 48 * k }, drop: { x: W - 186 * k, y: H - 66 * k, r: 40 * k }, gun: surf ? { x: W - 74 * k, y: H - 192 * k, r: 34 * k } : null,
  depthBtn: { x: W - 246 * k, y: H - 150 * k, w: 120 * k, h: 36 * k }, speed: { x: 12 * k, y: H - 48 * k, w: 124 * k, h: 38 * k },
  crewBtn: need ? { job: need, x: 12 * k, y: 52 * k, w: 150 * k, h: 38 * k } : null,
  fast: { x: W - 118 * k, y: 10 * k, w: 50 * k, h: 34 * k }, map: { x: W - 62 * k, y: 10 * k, w: 50 * k, h: 34 * k } }; }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of String(t).split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function txt(s, x, y, col = '#fff', font, al = 'center') { ctx.textAlign = al; if (font) ctx.font = font; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(10,20,26,.7)'; ctx.strokeText(s, x, y); ctx.fillStyle = col; ctx.fillText(s, x, y); }
function rbtn(B, label, on, col, dis) { ctx.globalAlpha = dis ? 0.4 : 1; ctx.fillStyle = on ? col : 'rgba(10,20,26,.6)'; rrect(B.x, B.y, B.w, B.h, 8); ctx.fill(); ctx.strokeStyle = on ? '#fff' : 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.5; rrect(B.x, B.y, B.w, B.h, 8); ctx.stroke(); txt(label, B.x + B.w / 2, B.y + B.h / 2 + 1, '#fff', `700 ${Math.round(12 * k)}px ${BC}`); ctx.globalAlpha = 1; }
function cbtn(B, label, sub, col, ready, glow) { ctx.globalAlpha = ready ? 1 : 0.45; ctx.fillStyle = 'rgba(10,20,26,.55)'; ctx.beginPath(); ctx.arc(B.x, B.y, B.r, 0, TAU); ctx.fill(); ctx.strokeStyle = glow ? '#fff' : col; ctx.lineWidth = glow ? 5 : 3; ctx.stroke(); txt(label, B.x, B.y - (sub ? 6 * k : 0), col, `400 ${Math.round(B.r * 0.36)}px ${TF}`); if (sub) txt(sub, B.x, B.y + 13 * k, 'rgba(255,255,255,.85)', `700 ${Math.round(10 * k)}px ${BC}`); ctx.globalAlpha = 1; }
function hud(G, now) { ctx.textBaseline = 'middle'; const L = layout(G), me = G.me;
  // contact labels: age, and "sure"
  for (const c of G.contacts) { const s = scrOf(c.x, 4, c.z); if (!s || !s.front) continue; const age = Math.round(G.t - c.t); txt(c.sure && age < 8 ? 'SURE' : c.heard ? 'HEARD' : `${age}s`, s.x, s.y - 12 * k, c.sure && age < 8 ? '#ff6a5a' : '#ffd36a', `700 ${Math.round(11 * k)}px ${BC}`); }
  for (const s of G.subs) if (s.surf && !s.gone) { const p = scrOf(s.x, 14, s.z); if (p && p.front) txt('▼ SURFACED', p.x, p.y - 10 * k, '#ff6a5a', `700 ${Math.round(12 * k)}px ${BC}`); }
  // top: the convoy, the harbour, your ship, your charges
  { const cx = W / 2, y = 22 * k, ships = G.M.map(m => m.sunk ? '✕' : '●').join(' '), dPort = Math.max(0, Math.hypot(G.cv.x - G.port.x, G.cv.z - G.port.z)), need = G.cfg.need || Math.ceil(G.cfg.merchants * G.cfg.keep - 0.001);
    ctx.fillStyle = 'rgba(10,20,26,.6)'; rrect(cx - 175 * k, y - 15 * k, 350 * k, 30 * k, 10); ctx.fill();
    txt(`🚢 ${ships}  (keep ${need})`, cx - 165 * k, y + 1, '#fff', `700 ${Math.round(13 * k)}px ${BC}`, 'left'); txt(`⚓ ${Math.round(dPort)} m`, cx + 30 * k, y + 1, '#bfe0ff', `700 ${Math.round(13 * k)}px ${BC}`, 'left');
    const hp = clamp(me.hp / 100, 0, 1); ctx.fillStyle = 'rgba(0,0,0,.4)'; rrect(cx + 100 * k, y - 6 * k, 66 * k, 12 * k, 5); ctx.fill(); ctx.fillStyle = hp > 0.5 ? '#8fe0ab' : hp > 0.25 ? '#ffd36a' : '#ff5a4a'; rrect(cx + 100 * k, y - 6 * k, 66 * k * hp, 12 * k, 5); ctx.fill();
    const st = [me.fire > 0 ? '🔥' : '', me.flood > 0 ? '💧' : '', !me.engOk ? '⚙✕' : '', !me.sonarOk ? '📡✕' : '', !me.gunOk ? '🎯✕' : ''].join(''); if (st) txt(st, cx + 133 * k, y + 22 * k, '#ffb0a0', `700 ${Math.round(12 * k)}px sans-serif`);
    if (G.lesson) lessonPanel(G); else if (ui.rep && G.t - ui.rep.t < 99) { ui.rep.t += 0; } }
  // crew reports (the newest two)
  if (!G.lesson) G.reports.slice(-2).forEach((r, i, a) => { const age = G.t - r.t; if (age > 9) return; ctx.globalAlpha = clamp(1.4 - age / 7, 0, 1); txt('📻 ' + r.txt, W / 2, 56 * k + i * 18 * k, r.pri >= 3 ? '#ff8a7a' : r.pri === 2 ? '#ffd36a' : '#e8f4ff', `700 ${Math.round(12 * k)}px ${BC}`); ctx.globalAlpha = 1; });
  // crew jobs
  if (L.crewBtn) { const pulse = 0.6 + 0.4 * Math.sin(performance.now() / 160); ctx.globalAlpha = 0.75 + 0.25 * pulse; rbtn(L.crewBtn, { repair: '🔧 TAP: REPAIR', fire: '🔥 TAP: FIGHT THE FIRE', rescue: '🛟 TAP: RESCUE THEM' }[L.crewBtn.job], true, '#3a7a5a'); ctx.globalAlpha = 1; }
  { const jobs = G.crew.filter(c => c.job).map(c => ({ repair: 'repairing', fire: 'fighting the fire', rescue: 'rescuing' }[c.job])); if (jobs.length) txt('crew: ' + jobs.join(', '), 12 * k, (L.crewBtn ? 102 : 64) * k, 'rgba(255,255,255,.8)', `700 ${Math.round(11 * k)}px ${BC}`, 'left'); }
  // throttle
  rbtn(L.speed, `SPEED: ${['REVERSE', 'STOP', 'CRUISE', 'FULL'][me.thr]}`, me.thr === 3, '#3a6a9a'); txt(`${Math.round(Math.abs(me.v) * 1.94)} kn · tap to change`, L.speed.x + L.speed.w / 2, L.speed.y - 10 * k, 'rgba(255,255,255,.85)', `700 ${Math.round(10 * k)}px ${BC}`);
  // fast-forward and map
  rbtn(L.fast, G.fast > 1 ? '⏩ ×6' : '⏩', G.fast > 1, '#3a6a9a', danger(G)); rbtn(L.map, '🗺 MAP', ui.map, '#3a6a9a');
  // the wheel (floating stick)
  if (ui.stick) { const s2 = ui.stick, R = 56 * k; ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.arc(s2.x0, s2.y0, R, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 2; ctx.stroke(); const dx = clamp(s2.x - s2.x0, -R, R); ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.arc(s2.x0 + dx, s2.y0, 22 * k, 0, TAU); ctx.fill(); }
  else if (G.t < 6 && !G.lesson) txt('DRAG HERE TO STEER', 200 * k, H - 100 * k, '#fff', `700 ${Math.round(12 * k)}px ${BC}`);
  // the action buttons: PING, the depth setting and DROP, GUN
  const surf = G.subs.some(s => s.surf && !s.gone && Math.hypot(s.x - me.x, s.z - me.z) < 1600);
  cbtn(L.ping, 'PING', me.pingCd > 0 ? me.pingCd.toFixed(1) : 'sonar', '#7ad0ff', me.pingCd <= 0 && me.sonarOk);
  rbtn(L.depthBtn, `DEPTH: ${DEPTHS[me.depth].name}`, true, '#9a6a2a'); txt('tap to change', L.depthBtn.x + L.depthBtn.w / 2, L.depthBtn.y - 9 * k, 'rgba(255,255,255,.8)', `700 ${Math.round(10 * k)}px ${BC}`);
  cbtn(L.drop, 'DROP', `${me.charges} left`, '#ffb347', me.reload <= 0 && me.charges > 0, G.contacts.some(c => c.sure && Math.hypot(c.x - me.x, c.z - me.z) < 70));
  if (L.gun) cbtn(L.gun, 'GUN', 'fire!', '#ff8a6a', me.gunOk && me.gunCd <= 0, true);
  if (ui.map) tacMap(G);
  if (ui.banner) banner(); }
// the tactical map: the convoy, you, the other escorts, the contacts and their rings, torpedoes, the way to the harbour
function tacMap(G) { const s = Math.min(W * 0.46, H * 0.62), x0 = W / 2 - s / 2, y0 = H * 0.18, me = G.me, sc = s / 3200, P = (x, z) => { const dx = x - me.x, dz = z - me.z, a = -ui.yaw - Math.PI / 2, rx = dx * Math.cos(a) - dz * Math.sin(a), rz = dx * Math.sin(a) + dz * Math.cos(a); return [x0 + s / 2 + rx * sc, y0 + s / 2 + rz * sc]; };
  ctx.fillStyle = 'rgba(8,24,30,.88)'; rrect(x0, y0, s, s, 14); ctx.fill(); ctx.save(); ctx.beginPath(); rrect(x0, y0, s, s, 14); ctx.clip();
  ctx.strokeStyle = 'rgba(122,208,255,.15)'; ctx.lineWidth = 1; for (const r of [500, 1000, 1500]) { ctx.beginPath(); ctx.arc(x0 + s / 2, y0 + s / 2, r * sc, 0, TAU); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(122,208,255,.4)'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(x0 + s / 2, y0 + s / 2, G.cfg.sonar * sc, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
  for (const c of G.contacts) { const [x, y] = P(c.x, c.z), age = G.t - c.t; ctx.strokeStyle = c.sure && age < 8 ? '#ff5a4a' : '#ffb347'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, Math.max(3, c.r * sc), 0, TAU); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillText(`${Math.round(age)}s`, x, y - Math.max(3, c.r * sc) - 6); }
  for (const t of G.torps) { const [x, y] = P(t.x, t.z), [x2, y2] = P(t.x - Math.cos(t.h) * 120, t.z - Math.sin(t.h) * 120); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke(); }
  for (const m of G.M) { const [x, y] = P(m.x, m.z); ctx.fillStyle = m.sunk ? '#888' : '#e8d8b8'; ctx.fillRect(x - 4, y - 4, 8, 8); }
  for (const a of G.allies) { const [x, y] = P(a.x, a.z); ctx.fillStyle = '#9ad0ff'; ctx.beginPath(); ctx.arc(x, y, 4, 0, TAU); ctx.fill(); }
  for (const s2 of G.subs) if (s2.surf && !s2.gone) { const [x, y] = P(s2.x, s2.z); ctx.fillStyle = '#ff5a4a'; ctx.fillRect(x - 5, y - 2, 10, 4); }
  for (const sv of G.surv) { const [x, y] = P(sv.x, sv.z); ctx.fillStyle = '#ff8a1a'; ctx.fillRect(x - 1.5, y - 1.5, 3, 3); }
  { const [x, y] = P(G.port.x, G.port.z); ctx.fillStyle = '#ffe080'; ctx.font = `${Math.round(16 * k)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('⚓', clamp(x, x0 + 12, x0 + s - 12), clamp(y, y0 + 12, y0 + s - 12)); }
  ctx.fillStyle = '#7ad0ff'; ctx.beginPath(); ctx.moveTo(x0 + s / 2, y0 + s / 2 - 8); ctx.lineTo(x0 + s / 2 + 5, y0 + s / 2 + 6); ctx.lineTo(x0 + s / 2 - 5, y0 + s / 2 + 6); ctx.fill();
  ctx.restore(); txt('TACTICAL MAP · tap 🗺 to close', W / 2, y0 + s + 12 * k, '#fff', `700 ${Math.round(11 * k)}px ${BC}`); }
function banner() { const b = ui.banner, a = Math.min(1, b.t / 0.2, ((b.secs || 1.6) - b.t) / 0.4); ctx.globalAlpha = Math.max(0, a); txt(b.txt, W / 2, H * 0.34, '#ffd36a', `400 ${Math.round((b.small ? 26 : 36) * k)}px ${TF}`); if (b.sub) txt(b.sub, W / 2, H * 0.34 + 28 * k, '#fff', `700 ${Math.round(14 * k)}px ${BC}`); ctx.globalAlpha = 1; }
function lessonPanel(G) { coachPanel(G); }
