
// ===================== THE VIEW: Dress Designer in 3D (three.js; light from tools/world3d.js) =====================
// A studio: a model stands on a turning platform wearing the dress as you design it. The dress is built from your choices:
// the skirt is a lathe (its outline from waist to hem follows the cut and the length), the bodice fitted, sleeves and straps
// as chosen; the fabric changes how it shines (satin sheen, velvet bloom, sheer chiffon, glittering sequins) and the pattern
// is painted on. Then the lights go down and she walks the runway to the photographers' flashes.
const FX = { shake: 0, stop: 0, flash: 0, red: 0, slow: 0 }, TXT = [], PARTS2 = [];
let hint = null, V3 = null;
const ui = { snap: true, cam: null, banner: null, flashes: [] };
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 160) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS2.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: 0.5 + Math.random() * 0.4, col, r: (1.5 + Math.random() * 2.5) * k }); } if (PARTS2.length > 240) PARTS2.splice(0, PARTS2.length - 240); }
function fxStep(dt) { FX.flash = Math.max(0, FX.flash - dt * 2.5);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.4) TXT.shift();
  for (const p of PARTS2) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; } for (let i = PARTS2.length - 1; i >= 0; i--) if (PARTS2[i].t > PARTS2[i].life) PARTS2.splice(i, 1);
  if (ui.banner) { ui.banner.t += dt; if (ui.banner.t > (ui.banner.secs || 1)) ui.banner = null; }
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; } }
const hex = n => '#' + n.toString(16).padStart(6, '0');
function mySkin() { if (typeof HEADLESS !== 'undefined' && HEADLESS) return SKINS[0]; const id = store.get('skin', 'classic'); return SKINS.find(q => q.id === id) || SKINS[0]; }
// the model's measurements (metres): feet at 0
const WAIST = 1.08, BUST = 1.34, HIPR = 0.17, LEN_Y = { mini: 0.78, knee: 0.55, midi: 0.36, maxi: 0.12, floor: 0.02 };
function canvasTex(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }
function patternTex(pat, col) { const base = hex(col), c3 = new THREE.Color(col), lum = c3.r * 0.3 + c3.g * 0.59 + c3.b * 0.11, ink = lum > 0.6 ? 'rgba(60,40,70,.55)' : 'rgba(255,255,255,.75)';
  return canvasTex(256, 256, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); g.fillStyle = ink; g.strokeStyle = ink;
    if (pat === 'stripes') for (let i = 0; i < 8; i++) g.fillRect(i * 32 + 4, 0, 12, h);
    if (pat === 'polka') for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.beginPath(); g.arc(x * 32 + (y % 2) * 16 + 8, y * 32 + 16, 7, 0, TAU); g.fill(); }
    if (pat === 'floral') { const R = W3.rng(9); for (let i = 0; i < 22; i++) { const x = R() * w, y = R() * h, r = 8 + R() * 8; g.fillStyle = ['rgba(255,120,160,.85)', 'rgba(255,220,90,.85)', 'rgba(255,255,255,.85)', 'rgba(170,120,230,.85)'][i % 4]; for (let p = 0; p < 5; p++) { g.beginPath(); g.arc(x + Math.cos(p * 1.256) * r * 0.6, y + Math.sin(p * 1.256) * r * 0.6, r * 0.45, 0, TAU); g.fill(); } g.fillStyle = 'rgba(250,200,60,.95)'; g.beginPath(); g.arc(x, y, r * 0.3, 0, TAU); g.fill(); g.fillStyle = 'rgba(60,140,70,.7)'; g.beginPath(); g.ellipse(x + r, y + r * 0.6, r * 0.5, r * 0.22, 0.6, 0, TAU); g.fill(); } } }); }
function sparkTex() { return canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); const R = W3.rng(4); for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(255,255,255,${0.3 + R() * 0.7})`; g.fillRect(R() * w, R() * h, 2, 2); } }); }
function fabricMat(T, d) { const col = PARTS.colour.opts.find(q => q.id === d.colour).col, map = patternTex(d.pattern, col); map.repeat.set(3, 2); const f = d.fabric;
  const m = new T.MeshPhysicalMaterial({ color: 0xffffff, map, side: T.DoubleSide, roughness: 0.8 });
  if (f === 'satin') { m.roughness = 0.28; m.clearcoat = 0.5; m.sheen = 0.6; m.sheenColor = new T.Color(0xffffff); }
  if (f === 'velvet') { m.roughness = 0.95; m.sheen = 1; m.sheenRoughness = 0.35; m.sheenColor = new T.Color(col).lerp(new T.Color(0xffffff), 0.5); }
  if (f === 'chiffon') { m.transparent = true; m.opacity = 0.82; m.roughness = 0.6; m.depthWrite = false; }
  if (f === 'sequins') { m.metalness = 0.65; m.roughness = 0.22; m.emissive = new T.Color(col).multiplyScalar(0.25); m.emissiveMap = sparkTex(); m.emissiveMap.repeat.set(4, 4); }
  if (f === 'cotton') { m.roughness = 0.88; }
  return m; }
function skirtProfile(cut, hemY) { const pts = [], L = WAIST - hemY, n = 18;
  for (let i = 0; i <= n; i++) { const t = i / n, y = WAIST - t * L; let r;
    if (cut === 'aline') r = HIPR + 0.02 + t * L * 0.38;
    else if (cut === 'sheath') r = HIPR + 0.015 + Math.sin(Math.min(1, t * 2.2) * Math.PI / 2) * 0.03 - t * 0.04;
    else if (cut === 'ballgown') r = HIPR + 0.04 + Math.pow(Math.min(1, t * 1.25), 0.6) * L * 0.62;
    else if (cut === 'mermaid') { const kn = (WAIST - 0.5) / Math.max(0.01, L); r = t < kn ? HIPR + 0.02 - t * 0.05 : HIPR - 0.02 + Math.pow((t - kn) / Math.max(0.01, 1 - kn), 1.6) * 0.38; }
    else r = HIPR + 0.035 + t * L * 0.12;
    pts.push(new THREE.Vector2(Math.max(0.06, r), y)); }
  return pts; }
function buildWorld() {
  if (V3) return V3; const T = window.THREE; if (!T || !W3 || !W3.init({ canvas: $('gl'), fov: 40, far: 2000, near: 0.05 })) { V3 = { none: true }; return V3; }
  V3 = { T, S: W3.scene, built: null, t: 0, sig: '' }; const V = V3, S = V.S; V.boxG = new T.BoxGeometry(1, 1, 1); V.sphG = new T.SphereGeometry(1, 20, 14); V.cylG = new T.CylinderGeometry(1, 1, 1, 20);
  const M = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.6 }, o));
  // the studio: a pale floor, curtains, mirrors; the runway out front
  const floor = new T.Mesh(new T.PlaneGeometry(60, 60), M(0x2a2230, { roughness: 0.35, metalness: 0.2 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; S.add(floor);
  V.studio = new T.Group(); S.add(V.studio);
  const curtain = canvasTex(256, 64, (g, w, h) => { for (let x = 0; x < w; x++) { const v = 0.55 + 0.45 * Math.sin(x / w * TAU * 8); g.fillStyle = `rgb(${120 * v | 0},${40 * v | 0},${90 * v | 0})`; g.fillRect(x, 0, 1, h); } });
  const back = new T.Mesh(new T.PlaneGeometry(14, 7), new T.MeshStandardMaterial({ map: curtain, roughness: 0.9 })); back.position.set(0, 3.5, -3.5); V.studio.add(back); V.curtainM = back.material;
  V.plat = new T.Mesh(new T.CylinderGeometry(0.9, 0.95, 0.18, 48), M(0xf2ece8, { roughness: 0.25, metalness: 0.1 })); V.plat.position.y = 0.09; V.plat.receiveShadow = true; V.plat.castShadow = true; V.studio.add(V.plat);
  for (const x of [-2.6, 2.6]) { const mir = new T.Mesh(new T.PlaneGeometry(1.2, 2.4), new T.MeshPhysicalMaterial({ color: 0xc8d4e0, metalness: 1, roughness: 0.05 })); mir.position.set(x, 1.4, -2.2); mir.rotation.y = -Math.sign(x) * 0.5; V.studio.add(mir); const fr = new T.Mesh(new T.BoxGeometry(1.32, 2.52, 0.05), M(0xd8b04a, { metalness: 0.8, roughness: 0.3 })); fr.position.copy(mir.position); fr.position.z -= 0.03; fr.rotation.copy(mir.rotation); V.studio.add(fr); }
  // a rail of fabrics, a sewing table
  for (let i = 0; i < 9; i++) { const c = new T.Mesh(V.boxG, M([0xf6c4cc, 0x1a2650, 0xd8202e, 0xb4ead2, 0xd8b04a, 0x5a1a4a, 0xf8f6f2, 0xe02a8a, 0x0e6a46][i], { roughness: 0.7 })); c.scale.set(0.1, 1.0, 0.5); c.position.set(-3.6 + i * 0.13, 1.3, -1.2); c.rotation.y = 0.3; c.castShadow = true; V.studio.add(c); }
  const tab = new T.Mesh(V.boxG, M(0xc8a080)); tab.scale.set(1.4, 0.06, 0.7); tab.position.set(3.2, 0.9, -1.0); V.studio.add(tab);
  // the runway
  V.runway = new T.Group(); V.runway.visible = false; S.add(V.runway);
  const hall = new T.Mesh(new T.BoxGeometry(30, 12, 44), new T.MeshStandardMaterial({ color: 0x140c18, roughness: 0.95, side: T.BackSide })); hall.position.set(0, 5.9, -10); V.runway.add(hall);
  for (let i = 0; i < 6; i++) { const l = new T.Mesh(V.sphG, new T.MeshBasicMaterial({ color: 0xfff4e0 })); l.scale.setScalar(0.12); l.position.set(i % 2 ? 2.6 : -2.6, 5.2, -18 + Math.floor(i / 2) * 7); V.runway.add(l); }
  const rw = new T.Mesh(V.boxG, M(0xf4f4f6, { roughness: 0.15, metalness: 0.15 })); rw.scale.set(2.2, 0.3, 22); rw.position.set(0, 0.15, -10); rw.receiveShadow = true; V.runway.add(rw);
  const edge = new T.Mesh(V.boxG, M(0xffffff, { emissive: 0xffffff, emissiveIntensity: 1.5 })); edge.scale.set(0.04, 0.02, 22); for (const x of [-1.1, 1.1]) { const e = edge.clone(); e.position.set(x, 0.31, -10); V.runway.add(e); }
  const crowdM = new T.InstancedMesh(new T.CapsuleGeometry(0.22, 0.5, 3, 6), M(0x1a1420, { roughness: 0.9 }), 120), dd = new T.Object3D(); for (let i = 0; i < 120; i++) { const side = i % 2 ? 1 : -1, row = Math.floor(i / 40); dd.position.set(side * (2.2 + row * 0.9), 0.5 + row * 0.25, -20 + ((i >> 1) % 20) * 1.0); dd.updateMatrix(); crowdM.setMatrixAt(i, dd.matrix); } V.runway.add(crowdM);
  const sign = canvasTex(512, 96, (g, w, h) => { g.fillStyle = '#100810'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = '700 54px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('THE SHOW', w / 2, h / 2); });
  const sg = new T.Mesh(new T.PlaneGeometry(4, 0.75), new T.MeshBasicMaterial({ map: sign })); sg.position.set(0, 4.4, -21); V.runway.add(sg);
  V.spot = new T.SpotLight(0xfff4e8, 0, 30, 0.35, 0.5, 1); V.spot.position.set(0, 7, 4); S.add(V.spot); S.add(V.spot.target);
  V.key = new T.DirectionalLight(0xfff0f4, 1.4); V.key.position.set(2, 4, 5); S.add(V.key);
  // the model: skin, hair, shoes; the dress group is rebuilt when it changes
  V.model = new T.Group(); S.add(V.model); V.skin = M(0x8d5524, { roughness: 0.55 });
  const B = (g, x, y, z, sx, sy, sz, m) => { const ms = new T.Mesh(g, m); ms.position.set(x, y, z); ms.scale.set(sx, sy, sz); ms.castShadow = true; V.model.add(ms); return ms; };
  B(V.sphG, 0, 1.66, 0, 0.1, 0.12, 0.11, V.skin); B(V.cylG, 0, 1.53, 0, 0.042, 0.1, 0.042, V.skin);
  // a face (22 Nov 2026, the audit: she was a faceless wooden figure): eyes with a glint, brows, lips, a little blush
  { const dark = M(0x1a0f0a, { roughness: 0.4 }), white = M(0xffffff, { roughness: 0.2 }), lip = M(0xc23a52, { roughness: 0.35 }), blush = M(0xb5503a, { roughness: 0.8, transparent: true, opacity: 0.45 });
    for (const s of [-1, 1]) { B(V.sphG, s * 0.036, 1.672, 0.094, 0.02, 0.014, 0.012, white).castShadow = false; B(V.sphG, s * 0.036, 1.672, 0.101, 0.011, 0.012, 0.008, dark).castShadow = false; B(V.sphG, s * 0.039, 1.676, 0.107, 0.0035, 0.0035, 0.003, white).castShadow = false;
      const br = B(V.boxG, s * 0.037, 1.697, 0.097, 0.03, 0.005, 0.006, dark); br.rotation.z = -s * 0.16; br.castShadow = false; B(V.sphG, s * 0.062, 1.638, 0.078, 0.02, 0.014, 0.01, blush).castShadow = false; }
    B(V.sphG, 0, 1.612, 0.098, 0.026, 0.008, 0.012, lip).castShadow = false; B(V.sphG, 0, 1.642, 0.108, 0.011, 0.014, 0.012, V.skin).castShadow = false; }
  V.hair = B(V.sphG, 0, 1.7, -0.02, 0.115, 0.1, 0.12, M(0x1a0f0a, { roughness: 0.7 })); V.bun = B(V.sphG, 0, 1.73, -0.11, 0.06, 0.06, 0.06, V.hair.material);
  V.torso = B(new T.CapsuleGeometry(0.12, 0.3, 4, 12), 0, 1.25, 0, 1.0, 1, 0.7, V.skin);
  V.legs = [-0.06, 0.06].map(x => { const l = new T.Mesh(new T.CapsuleGeometry(0.045, 0.85, 3, 8), V.skin); l.position.set(x, 0.5, 0); l.castShadow = true; V.model.add(l); const sh = new T.Mesh(V.boxG, M(0xd8202e, { roughness: 0.3 })); sh.scale.set(0.07, 0.05, 0.16); sh.position.set(x, 0.03, 0.03); V.model.add(sh); return { l, sh }; });
  V.arms = [-1, 1].map(s => { const a = new T.Group(); a.position.set(s * 0.17, 1.4, 0); const m = new T.Mesh(new T.CapsuleGeometry(0.035, 0.52, 3, 8), V.skin); m.position.y = -0.3; m.castShadow = true; a.add(m); a.rotation.z = s * 0.12; V.model.add(a); return a; });
  V.dress = new T.Group(); V.model.add(V.dress); V.spotsMesh = [];
  for (const where of ['neck', 'waist', 'hem']) { const r = new T.Mesh(new T.TorusGeometry(0.07, 0.012, 8, 24), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 })); r.visible = false; V.model.add(r); V.spotsMesh.push({ where, r }); }
  W3.setQuality(stepN); return V; }
function buildDress(V, g) { const T = V.T, d = g.d; V.dress.clear(); const mat = fabricMat(T, d), hemY = LEN_Y[d.len];
  const skirt = new T.Mesh(new T.LatheGeometry(skirtProfile(d.cut, hemY), 48), mat); skirt.castShadow = true; V.dress.add(skirt);
  if (d.fabric === 'chiffon') { const under = new T.Mesh(new T.LatheGeometry(skirtProfile(d.cut, hemY).map(p => new T.Vector2(p.x * 0.92, p.y)), 40), new T.MeshStandardMaterial({ color: PARTS.colour.opts.find(q => q.id === d.colour).col, roughness: 0.7 })); V.dress.add(under); }
  const bod = [new T.Vector2(0.135, WAIST), new T.Vector2(0.142, WAIST + 0.1), new T.Vector2(0.15, BUST - 0.06), new T.Vector2(0.135, BUST + 0.02)]; const top = new T.Mesh(new T.LatheGeometry(bod, 40), mat); top.scale.z = 0.72; top.castShadow = true; V.dress.add(top);
  const sv = d.sleeve, arm = (s, y0, len, r) => { const m = new T.Mesh(new T.CylinderGeometry(r, r * 0.9, len, 16, 1, true), mat); m.position.set(s * 0.19, y0 - len / 2, 0); m.rotation.z = s * 0.12; V.dress.add(m); };
  if (sv === 'straps') for (const s of [-1, 1]) { const st = new T.Mesh(V.cylG, mat); st.scale.set(0.012, 0.17, 0.012); st.position.set(s * 0.085, BUST + 0.08, 0); V.dress.add(st); }
  if (sv === 'short') for (const s of [-1, 1]) arm(s, 1.43, 0.18, 0.055);
  if (sv === 'long') for (const s of [-1, 1]) arm(s, 1.43, 0.58, 0.048);
  if (sv === 'offsh') { const band = new T.Mesh(new T.TorusGeometry(0.2, 0.035, 10, 32), mat); band.rotation.x = Math.PI / 2; band.scale.set(1, 0.72, 1); band.position.y = BUST + 0.02; V.dress.add(band); for (const s of [-1, 1]) arm(s, 1.4, 0.16, 0.052); }
  // trims
  const trimAt = { neck: BUST + 0.05, waist: WAIST + 0.02, hem: hemY + 0.02 };
  for (const t of g.trims) { const y = trimAt[t.at], r = t.at === 'hem' ? skirtProfile(d.cut, hemY).slice(-1)[0].x + 0.005 : t.at === 'waist' ? 0.142 : 0.12, M = c => new T.MeshPhysicalMaterial({ color: c, roughness: 0.35, clearcoat: 0.5 });
    if (t.id === 'belt') { const b = new T.Mesh(new T.TorusGeometry(r, 0.018, 8, 40), M(0x1a1a1a)); b.rotation.x = Math.PI / 2; b.scale.set(1, 0.72, 1); b.position.y = y; V.dress.add(b); const bk = new T.Mesh(V.boxG, M(0xd8b04a)); bk.scale.set(0.05, 0.04, 0.01); bk.position.set(0, y, r * 0.72 + 0.01); V.dress.add(bk); }
    if (t.id === 'pearls') for (let i = 0; i < 24; i++) { const a = -Math.PI * 0.85 + i / 23 * Math.PI * 0.7 + Math.PI / 2, p = new T.Mesh(V.sphG, new T.MeshPhysicalMaterial({ color: 0xf8f4ec, roughness: 0.15, clearcoat: 1 })); p.scale.setScalar(0.011); p.position.set(Math.cos(a) * 0.1, y - Math.sin(i / 23 * Math.PI) * 0.05, Math.sin(a) * 0.075 + 0.02); V.dress.add(p); }
    if (t.id === 'bow') { for (const s of [-1, 1]) { const l = new T.Mesh(new T.TorusGeometry(0.035, 0.014, 8, 16), M(0xf2f2f2)); l.position.set(s * 0.035, y, (t.at === 'neck' ? 0.1 : 0.11)); l.scale.set(1, 0.7, 0.5); V.dress.add(l); } }
    if (t.id === 'lace') { const l = new T.Mesh(new T.TorusGeometry(r, 0.012, 6, 64), new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 })); l.rotation.x = Math.PI / 2; l.position.y = y; V.dress.add(l); for (let i = 0; i < 32; i++) { const a = i / 32 * TAU, s = new T.Mesh(V.sphG, l.material); s.scale.setScalar(0.014); s.position.set(Math.cos(a) * r, y - 0.012, Math.sin(a) * r); V.dress.add(s); } }
    if (t.id === 'flowers') for (let i = 0; i < 5; i++) { const a = Math.PI / 2 + (i - 2) * 0.35, f = new T.Mesh(V.sphG, M([0xff7aa0, 0xffd84a, 0xffffff][i % 3])); f.scale.setScalar(0.022); f.position.set(Math.cos(a) * r * 1.02, y, Math.sin(a) * r * (t.at === 'hem' ? 1.02 : 0.74)); V.dress.add(f); } }
  // legs show below the hem
  for (const L of V.legs) L.l.visible = hemY > 0.05 || d.cut === 'slip'; }
const SV = window.THREE ? new THREE.Vector3() : null;
function scr(x, y, z) { if (!V3 || V3.none) return { x: W / 2, y: H / 2 }; SV.set(x, y, z); return W3.screen(SV); }
function spotScreen(where) { if (!V3 || V3.none || !G) return null; const s = V3.spotsMesh.find(q => q.where === where); if (!s) return null; s.r.getWorldPosition(SV); return W3.screen(SV); }
function sync(V, g, dt) { const T = V.T; V.t += dt;
  const sig = JSON.stringify([g.d, g.trims]); if (sig !== V.sig) { V.sig = sig; buildDress(V, g); }
  const run = g.stage === 'runway' || (g.over && g.walk > 0); V.runway.visible = run; V.studio.visible = !run; V.spot.intensity = run ? 120 : 0; V.key.intensity = run ? 0.5 : 1.4;
  // the model: turning slowly in the studio; walking the runway
  if (!run) { V.model.position.set(0, 0.18, 0); V.model.rotation.y = Math.sin(V.t * 0.45) * 0.6; for (const L of V.legs) { L.l.position.y = 0.5; L.l.rotation.x = 0; } V.arms.forEach((a, i) => a.rotation.x = 0); }
  else { const f = Math.min(1, g.walk), z = -19 + f * 17.5, step = V.t * 4.2; V.model.position.set(Math.sin(step) * 0.03, 0.3 + Math.abs(Math.sin(step)) * 0.015, z); V.model.rotation.y = f > 0.92 ? (f - 0.92) / 0.08 * Math.PI * 0.25 : 0;
    V.legs.forEach((L, i) => { L.l.rotation.x = Math.sin(step + i * Math.PI) * 0.3; }); V.arms.forEach((a, i) => a.rotation.x = Math.sin(step + i * Math.PI + Math.PI) * 0.25);
    V.spot.target.position.copy(V.model.position); if (Math.random() < dt * 6) ui.flashes.push({ x: Math.random(), y: 0.45 + Math.random() * 0.3, t: 0 }); }
  // the spots for a trim, glowing when one is picked
  const showSpots = g.stage === 'design' && curPart(g) === 'trim' && !!g.pick, hemY = LEN_Y[g.d.len], at = { neck: BUST + 0.05, waist: WAIST + 0.02, hem: hemY + 0.03 };
  for (const s of V.spotsMesh) { s.r.visible = showSpots; s.r.position.set(0, at[s.where], s.where === 'hem' ? skirtProfile(g.d.cut, hemY).slice(-1)[0].x + 0.02 : 0.13); s.r.material.opacity = 0.5 + 0.4 * Math.sin(V.t * 8); }
  if (showSpots) V.model.rotation.y *= 0.2;
  // the camera
  const asp = innerWidth / innerHeight, portrait = asp < 0.8; let cp, cl;
  if (run) { cp = [0.6, 1.05, 3.2]; cl = [0, 1.0, V.model.position.z - 1]; }
  else { const dist = portrait ? 4.1 : 3.2; cp = [0.25, 1.15, dist]; cl = [0, portrait ? (g.lesson ? 1.13 : 1.0) : 0.95, 0]; }      /* looks a little higher, so her head is under the client's card, not behind it */
  if (ui.snap || !ui.cam) { ui.cam = { p: cp.slice(), l: cl.slice() }; ui.snap = false; } const kk = Math.min(1, dt * 3); for (let i = 0; i < 3; i++) { ui.cam.p[i] += (cp[i] - ui.cam.p[i]) * kk; ui.cam.l[i] += (cl[i] - ui.cam.l[i]) * kk; }
  const cam = W3.cam; cam.fov = portrait ? 46 : 36; cam.aspect = asp; cam.updateProjectionMatrix(); cam.position.set(...ui.cam.p); cam.lookAt(...ui.cam.l); cam.updateMatrixWorld(); W3.setFocus(0, 1, V.model.position.z, 4); }
// ---------- the option panel (bottom) and the brief card (top) ----------
function panel(g) { const p = curPart(g), opts = PARTS[p].opts, n = opts.length, cols = p === 'colour' ? 8 : Math.min(n, 3), rows = Math.ceil(n / cols), pad = 10, bw = (W - pad * 2) / cols, bh = p === 'colour' ? 44 * k : 46 * k, y0 = H - 74 * k - rows * (bh + 6);
  const out = opts.map((o, i) => ({ i, x: pad + (i % cols) * bw, y: y0 + Math.floor(i / cols) * (bh + 6), w: bw - 6, h: bh })); out.next = { x: W - pad - 130 * k, y: H - 62 * k, w: 130 * k, h: 48 * k }; out.ask = g.hiddenWish && !g.asked ? { x: pad, y: H - 62 * k, w: 120 * k, h: 48 * k } : null; out.top = y0; return out; }
function uiHit(px, py, g) { if (!g || g.stage !== 'design' || g.over || g.wait > 0) return null; const L = panel(g), inR = r => r && px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
  for (const b of L) if (inR(b)) return { opt: b.i }; if (inR(L.next)) return { next: true }; if (inR(L.ask)) return { ask: true };
  if (curPart(g) === 'trim' && g.pick) for (const w of ['neck', 'waist', 'hem']) { const s = spotScreen(w); if (s && Math.hypot(px - s.x, py - s.y) < 34 * k) return { spot: w }; }
  return null; }
function wishText(g, p) { const ok = g.ok[p]; if (p === 'colour') return ok.map(w => w.startsWith('fam:') ? FAMS[w.slice(4)] : PARTS.colour.opts.find(q => q.id === w).name).join(' or '); return ok.map(id => PARTS[p].opts.find(q => q.id === id).name).join(' or '); }
function wishMet(g, p) { return p === 'trim' ? g.trims.some(t => g.ok.trim.includes(t.id)) : meets(p, g.d[p], g.ok[p]); }
// ---------- what happens, seen and heard ----------
function onEvent(G, e) { const cx = W / 2;
  switch (e.k) {
    case 'start': case 'yard': ui.snap = true; ui.banner = G.lesson ? null : { txt: `${G.who.toUpperCase()}: ${G.brief.name.toUpperCase()}`, t: 0, secs: 1.6, col: '#f2c8ff' }; sfx.bell(); break;
    case 'part': sfx.page(); break;
    case 'choose': sfx.swish(e.p); vibe(HAP.tick); if (wishMet(G, e.p) && G.wish.includes(e.p)) { sfx.tick(); burst(cx, H * 0.18, '#80ff90', 6, 80); } break;
    case 'pickTrim': sfx.pick(); tip('spot', 'Now tap the glowing ring where it goes: neck, waist or hem.', 3); break;
    case 'trim': sfx.pop(); vibe(HAP.light); break;
    case 'ask': sfx.pick(); say('"Oh, and..."', cx, H * 0.25, '#f2c8ff', 18); break;
    case 'hurry': say('"Lovely, next?"', cx, H * 0.3, '#f2c8ff', 16); break;
    case 'runway': ui.snap = true; ui.banner = { txt: 'THE SHOW', t: 0, secs: 1.6, col: '#fff' }; break;
    case 'judge': { sfx.drum(); const s = e.stars; [0, 1, 2].forEach(i => setTimeout(() => sfx.star(Math.round(s[i])), 300 + i * 350)); FX.flash = 0.6; break; }
    case 'won': sfx.win(); break;
    case 'lost': sfx.lose(); break;
    case 'lessonnext': hint = null; break;
    case 'lessonmiss': coachMiss(); sfx.no(); break;
    case 'lessondone': sfx.goal(); say('LESSON DONE!', cx, H * 0.4, '#80ff90', 28); burst(cx, H * 0.4, '#80ff90', 24); break;
  } }
let IG = null; function idleG() { if (!IG || (IG.over && (IG.idle = (IG.idle || 0) + 1 / 60) > 3)) { IG = newGame(Math.max(5, store.get('level', 1) | 0), { seed: (Math.random() * 1e6) | 0 }); IG.mem = {}; ui.snap = true; } if (!IG.over) { honest(IG, { react: 1.2, acc: 1 }, IG.mem); step(IG, 1 / 60); } IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#2a1a2a'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D studio.', W / 2, H / 2); if (G) hud(G, now); return; }
  const g = G || idleG(); if (V.built !== g) { V.built = g; V.sig = ''; W3.setSky(PLACES[placeOf(g.N)].sky, { azim: 160 }); W3.hemi.intensity = W3.S.hemiI + 0.6; V.skin.color.setHex([0x8d5524, 0xc68642, 0xe0ac69, 0x5a3825, 0xf1c27d][g.seed % 5]); V.curtainM.color.setHex(mySkin().col); ui.snap = true; }
  sync(V, g, dt);
  W3.render(dt);
  if (V.runway.visible) for (const f of ui.flashes) { f.t += dt; const a = Math.max(0, 1 - f.t * 5); if (a > 0) { const gr = ctx.createRadialGradient(f.x * W, f.y * H, 0, f.x * W, f.y * H, 40 * k); gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gr; ctx.fillRect(f.x * W - 40 * k, f.y * H - 40 * k, 80 * k, 80 * k); } } ui.flashes = ui.flashes.filter(f => f.t < 0.3);
  if (G && !(G.over && !$('ovEnd').classList.contains('hidden'))) hud(G, now);
  for (const p of PARTS2) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 0.9 ? 1 : 1 - (t2.t - 0.9) / 0.5; ctx.globalAlpha = Math.max(0, al); ctx.font = `400 ${Math.round(t2.size * k)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(40,20,50,.6)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 20); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 20); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30, hy = H * 0.42;
    ctx.fillStyle = 'rgba(40,20,50,.92)'; rrect(W / 2 - w / 2, hy - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, hy - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${FX.flash * 0.35})`; ctx.fillRect(0, 0, W, H); } }
function hud(G, t) { ctx.textBaseline = 'middle';
  // the brief card: her wishes, ticked as the dress meets them
  if (G.lesson) lessonPanel(G);
  { const x = 10, w = W - 20, y = (G.lesson ? 150 : 44) * k, items = G.wish.map(p => ({ p, hidden: p === G.hiddenWish && !G.asked })), h = 30 * k + Math.ceil((items.length + (G.no ? 1 : 0)) / 2) * 19 * k;
    ctx.fillStyle = 'rgba(255,250,252,.94)'; rrect(x, y, w, h, 12 * k); ctx.fill(); ctx.textAlign = 'left'; ctx.fillStyle = '#8a3aa8'; ctx.font = `400 ${Math.round(14 * k)}px ${TF}`; ctx.fillText(`${G.who}'s ${G.brief.name}`, x + 10, y + 14 * k);
    ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; items.forEach((it, i) => { const cx = x + 10 + (i % 2) * w / 2, cy = y + 32 * k + Math.floor(i / 2) * 19 * k, ok = !it.hidden && wishMet(G, it.p);
      ctx.fillStyle = ok ? '#2a9a50' : '#5a3a6a'; const txt = it.hidden ? '❓ one more wish (ask her)' : `${ok ? '✓' : '○'} ${PARTS[it.p].name.toLowerCase()}: ${wishText(G, it.p)}`; ctx.fillText(txt.length > 34 ? txt.slice(0, 33) + '…' : txt, cx, cy); });
    if (G.no) { const i = items.length, cx = x + 10 + (i % 2) * w / 2, cy = y + 32 * k + Math.floor(i / 2) * 19 * k, bad = G.d[G.no.p] === G.no.id; ctx.fillStyle = bad ? '#d8202e' : '#5a3a6a'; ctx.fillText(`✗ NO ${PARTS[G.no.p].opts.find(q => q.id === G.no.id).name.toLowerCase()}`, cx, cy); } }
  if (ui.banner) { const B = ui.banner; ctx.textAlign = 'center'; ctx.font = `400 ${Math.round(24 * k)}px ${TF}`; ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(40,20,50,.6)'; ctx.strokeText(B.txt, W / 2, H * 0.3); ctx.fillStyle = B.col || '#fff'; ctx.fillText(B.txt, W / 2, H * 0.3); }
  if (G.stage === 'design' && !G.over && G.wait <= 0) { const L = panel(G), p = curPart(G);
    ctx.fillStyle = 'rgba(30,18,40,.72)'; rrect(4, L.top - 34 * k, W - 8, H - L.top + 30 * k, 16 * k); ctx.fill();
    ctx.textAlign = 'left'; ctx.fillStyle = '#e8a8ff'; ctx.font = `400 ${Math.round(14 * k)}px ${TF}`; ctx.fillText(`${PARTS[p].name} · ${G.si + 1}/${G.stages.length}`, 14, L.top - 17 * k);
    if (p === 'trim') { ctx.textAlign = 'right'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = '#fff'; ctx.fillText(G.pick ? 'NOW TAP A GLOWING RING ON THE DRESS' : 'PICK A TRIM, THEN WHERE IT GOES', W - 14, L.top - 17 * k); }
    for (const b of L) { const o = PARTS[p].opts[b.i], on = p === 'trim' ? G.pick === o.id || G.trims.some(q => q.id === o.id) : G.d[p] === o.id;
      if (p === 'colour') { ctx.fillStyle = hex(o.col); rrect(b.x, b.y, b.w, b.h, 10 * k); ctx.fill(); if (on) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; rrect(b.x, b.y, b.w, b.h, 10 * k); ctx.stroke(); } }
      else { ctx.fillStyle = on ? '#e8a8ff' : 'rgba(255,255,255,.12)'; rrect(b.x, b.y, b.w, b.h, 12 * k); ctx.fill(); ctx.fillStyle = on ? '#2a1236' : '#fff'; ctx.font = `700 ${Math.round(15 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillText(o.name, b.x + b.w / 2, b.y + b.h / 2); }
      if (G.no && G.no.p === p && G.no.id === o.id) { ctx.strokeStyle = '#ff4a5a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(b.x + 6, b.y + 6); ctx.lineTo(b.x + b.w - 6, b.y + b.h - 6); ctx.stroke(); } }
    ctx.fillStyle = '#e8a8ff'; rrect(L.next.x, L.next.y, L.next.w, L.next.h, 14 * k); ctx.fill(); ctx.fillStyle = '#2a1236'; ctx.font = `400 ${Math.round(16 * k)}px ${TF}`; ctx.textAlign = 'center'; ctx.fillText(G.si === G.stages.length - 1 ? 'TO THE SHOW ›' : 'NEXT ›', L.next.x + L.next.w / 2, L.next.y + L.next.h / 2);
    if (L.ask) { ctx.fillStyle = 'rgba(255,255,255,.18)'; rrect(L.ask.x, L.ask.y, L.ask.w, L.ask.h, 14 * k); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; ctx.fillText('❓ ASK HER', L.ask.x + L.ask.w / 2, L.ask.y + L.ask.h / 2); } }
  if (G.stage === 'runway' && G.judges == null) { ctx.textAlign = 'center'; ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillText('THE JUDGES ARE WATCHING...', W / 2, H - 50 * k); }
  if (G.judges) { const names = ['THE CLIENT', 'STYLE', 'CRAFT']; G.judges.forEach((s, i) => { const w = (W - 40) / 3, x = 14 + i * (w + 6), y = H - 130 * k; ctx.fillStyle = 'rgba(30,18,40,.85)'; rrect(x, y, w, 76 * k, 12 * k); ctx.fill(); ctx.textAlign = 'center'; ctx.fillStyle = '#e8a8ff'; ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillText(names[i], x + w / 2, y + 16 * k);
    ctx.font = `400 ${Math.round(18 * k)}px ${TF}`; ctx.fillStyle = s >= G.cfg.pass ? '#ffd040' : '#ff8a8a'; ctx.fillText('★'.repeat(Math.floor(s)) + (s % 1 ? '½' : ''), x + w / 2, y + 42 * k); ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = '#fff'; ctx.fillText(`${s} / 5`, x + w / 2, y + 62 * k); }); } }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { coachPanel(G); }
