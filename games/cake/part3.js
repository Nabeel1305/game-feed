
// ===================== THE VIEW: Cake Designer in 3D (three.js; light from tools/world3d.js) =====================
// A warm little bakery: a marble counter, tiled wall, shelves of jars, a window onto the sky, lamps overhead. The cake sits on
// its stand on a turntable; the icing is a real map wrapped round each tier (painted where your knife has been, sponge where
// it has not), swirls are piped where you tapped, berries and candles sit where you put them. The customer waits at the side.
const FX = { shake: 0, stop: 0, flash: 0, red: 0, slow: 0 }, TXT = [], PARTS = [];
let hint = null, V3 = null;
const ui = { snap: true, cam: null, banner: null, squeeze: 0 };
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS || !(G && G.lesson)) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 160) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: 0.5 + Math.random() * 0.4, col, r: (1.5 + Math.random() * 2.5) * k }); } if (PARTS.length > 240) PARTS.splice(0, PARTS.length - 240); }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2.5); FX.red = Math.max(0, FX.red - dt * 2); ui.squeeze = Math.max(0, ui.squeeze - dt * 4);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.4) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  if (ui.banner) { ui.banner.t += dt; if (ui.banner.t > (ui.banner.secs || 1)) ui.banner = null; }
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; } }
const hex = n => '#' + n.toString(16).padStart(6, '0');
function mySkin() { if (typeof HEADLESS !== 'undefined' && HEADLESS) return SKINS[0]; const id = store.get('skin', 'stand'); return SKINS.find(q => q.id === id) || SKINS[0]; }
const STAND_Y = 1.32;      // the top of the cake stand (on the counter at 0.95)
function canvasTex(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
function buildWorld() {
  if (V3) return V3; const T = window.THREE; if (!T || !W3 || !W3.init({ canvas: $('gl'), fov: 45, far: 2000, near: 0.05 })) { V3 = { none: true }; return V3; }
  V3 = { T, S: W3.scene, built: null, t: 0 }; const V = V3, S = V.S;
  V.boxG = new T.BoxGeometry(1, 1, 1); V.sphG = new T.SphereGeometry(1, 16, 12); V.cylG = new T.CylinderGeometry(1, 1, 1, 40);
  const M = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.6 }, o)), box = (w, h, d, x, y, z, m, sh = true) => { const b = new T.Mesh(V.boxG, m); b.scale.set(w, h, d); b.position.set(x, y, z); b.castShadow = sh; b.receiveShadow = true; S.add(b); return b; };
  // the room: a wooden floor, tiled walls with a window, a marble counter, shelves, lamps
  const wood = canvasTex(256, 256, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = `hsl(28,${35 + (i * 7) % 15}%,${38 + (i * 13) % 12}%)`; g.fillRect(0, i * 32, w, 32); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, i * 32, w, 2); } }); wood.wrapS = wood.wrapT = T.RepeatWrapping; wood.repeat.set(4, 4);
  box(30, 0.1, 30, 0, -0.05, 0, M(0xffffff, { map: wood, roughness: 0.7 }), false);
  const tiles = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#dfe9e6'; g.fillRect(0, 0, w, h); g.strokeStyle = '#b8c6c2'; g.lineWidth = 4; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 32); g.lineTo(w, i * 32); g.stroke(); } }); tiles.wrapS = tiles.wrapT = T.RepeatWrapping; tiles.repeat.set(3, 2);
  const wallM = M(0xffffff, { map: tiles, roughness: 0.35 });
  box(4.5, 6, 0.2, -4.25, 3, -2.2, wallM, false); box(4.5, 6, 0.2, 4.25, 3, -2.2, wallM, false); box(4, 1.7, 0.2, 0, 0.85, -2.2, wallM, false); box(4, 2.2, 0.2, 0, 4.9, -2.2, wallM, false);
  box(0.2, 6, 10, -6.4, 3, 2.5, wallM, false); box(0.2, 6, 10, 6.4, 3, 2.5, wallM, false);
  box(4.1, 0.12, 0.3, 0, 1.75, -2.15, M(0xf4f0e8)); box(0.12, 2.1, 0.3, 0, 2.75, -2.15, M(0xf4f0e8));
  const marble = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#f2f0ec'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(150,150,160,.35)'; for (let i = 0; i < 14; i++) { g.lineWidth = 1 + Math.random() * 2; g.beginPath(); let x = Math.random() * w, y = 0; g.moveTo(x, y); while (y < h) { x += (Math.random() - 0.5) * 30; y += 12; g.lineTo(x, y); } g.stroke(); } });
  box(7, 0.08, 2.4, 0, 0.95, 0, M(0xffffff, { map: marble, roughness: 0.18, metalness: 0.05 })); box(6.9, 0.88, 2.3, 0, 0.47, 0, M(0x8a5a3a, { roughness: 0.7 }));
  const jarC = [0xf2a0b8, 0x9ee0c0, 0xfbe27a, 0xa8d0f6, 0xd8a070, 0xcdb2ef]; for (const y of [2.6, 3.6]) { box(3.6, 0.07, 0.4, -4.2, y, -1.95, M(0xa0704a)); box(3.6, 0.07, 0.4, 4.2, y, -1.95, M(0xa0704a)); for (let i = 0; i < 6; i++) for (const sx of [-1, 1]) { const j = new T.Mesh(V.cylG, new T.MeshPhysicalMaterial({ color: jarC[(i + (sx > 0 ? 3 : 0)) % 6], roughness: 0.15, transmission: 0.2, clearcoat: 1 })); j.scale.set(0.16, 0.42, 0.16); j.position.set(sx * (2.8 + i * 0.55), y + 0.25, -1.95); j.castShadow = true; S.add(j); } }
  V.lampM = M(0xfff4d8, { emissive: 0xffe0a0, emissiveIntensity: 1.2 }); for (const x of [-2.2, 2.2]) { const c = new T.Mesh(V.cylG, M(0x333333)); c.scale.set(0.01, 1.5, 0.01); c.position.set(x, 5.2, 0.4); S.add(c); const sh = new T.Mesh(new T.ConeGeometry(0.4, 0.35, 24, 1, true), M(0x2a5a4a, { side: T.DoubleSide })); sh.position.set(x, 4.35, 0.4); S.add(sh); const bl = new T.Mesh(V.sphG, V.lampM); bl.scale.setScalar(0.12); bl.position.set(x, 4.2, 0.4); S.add(bl); }
  V.warm = new T.PointLight(0xffe2b8, 6, 12, 1.5); V.warm.position.set(0, 4.0, 1.2); S.add(V.warm); V.fill = new T.DirectionalLight(0xfff6ee, 1.2); V.fill.position.set(0.5, 3, 6); S.add(V.fill);
  // the stand on its turntable
  V.standM = new T.MeshPhysicalMaterial({ color: mySkin().col, roughness: 0.25, clearcoat: 0.6 }); V.turn = new T.Group(); V.turn.position.set(0, 0.99, 0); S.add(V.turn);
  const plate = new T.Mesh(V.cylG, V.standM); plate.scale.set(1.35, 0.06, 1.35); plate.position.y = 0.3; plate.castShadow = plate.receiveShadow = true; V.turn.add(plate);
  const stem = new T.Mesh(new T.CylinderGeometry(0.12, 0.35, 0.28, 24), V.standM); stem.position.y = 0.14; stem.castShadow = true; V.turn.add(stem);
  V.cake = new T.Group(); V.cake.position.y = STAND_Y; S.add(V.cake); V.tierV = [];
  // the knife, the piping bag, the sliding tier
  V.knife = new T.Group(); const blade = new T.Mesh(V.boxG, new T.MeshStandardMaterial({ color: 0xd8dde4, metalness: 0.9, roughness: 0.2 })); blade.scale.set(0.02, 0.5, 0.32); V.knife.add(blade); const hdl = new T.Mesh(V.boxG, M(0x5a3a2a)); hdl.scale.set(0.05, 0.05, 0.45); hdl.position.set(0, 0, 0.36); V.knife.add(hdl); V.knife.visible = false; S.add(V.knife);
  V.bag = new T.Group(); const bag = new T.Mesh(new T.ConeGeometry(0.12, 0.4, 20), new T.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.4, transmission: 0.3, transparent: true, opacity: 0.85 })); bag.rotation.x = Math.PI; V.bag.add(bag); V.bagFill = new T.Mesh(new T.ConeGeometry(0.09, 0.3, 20), M(0xffffff)); V.bagFill.rotation.x = Math.PI; V.bagFill.position.y = 0.05; V.bag.add(V.bagFill); V.bag.visible = false; S.add(V.bag);
  V.slider = new T.Mesh(V.cylG, M(0xf3d79a, { roughness: 0.8 })); V.slider.castShadow = true; V.slider.visible = false; S.add(V.slider);
  // swirls, toppings, guides (pools)
  const sw = []; for (let i = 0; i < 4; i++) { const t = new T.TorusGeometry(0.065 - i * 0.014, 0.03, 8, 20); t.rotateX(Math.PI / 2); t.translate(0, 0.03 + i * 0.035, 0); sw.push(t); } const tipG = new T.ConeGeometry(0.03, 0.07, 10); tipG.translate(0, 0.17, 0); sw.push(tipG); V.swirlG = T.mergeGeometries(sw.map(q => q.index ? q.toNonIndexed() : q));
  V.swirlM = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.45 }); V.swirls = []; for (let i = 0; i < 12; i++) { const m = new T.Mesh(V.swirlG, V.swirlM); m.castShadow = true; m.visible = false; V.cake.add(m); V.swirls.push(m); }
  V.guides = []; for (let i = 0; i < 12; i++) { const m = new T.Mesh(V.sphG, new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 })); m.scale.setScalar(0.035); m.visible = false; V.cake.add(m); V.guides.push(m); }
  V.tops = []; for (let i = 0; i < 8; i++) { const g = new T.Group(); g.visible = false; V.cake.add(g); V.tops.push(g); }
  V.spots = []; for (let i = 0; i < 8; i++) { const m = new T.Mesh(new T.RingGeometry(0.07, 0.1, 24), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.visible = false; V.cake.add(m); V.spots.push(m); }
  V.drip = new T.Group(); V.cake.add(V.drip);
  // the customer
  V.who = new T.Group(); const body = new T.Mesh(new T.CapsuleGeometry(0.32, 0.9, 4, 12), M(0xe8463c)); body.position.y = 1.0; body.castShadow = true; V.who.add(body); V.whoBody = body; const head = new T.Mesh(V.sphG, M(0xc68642)); head.scale.setScalar(0.24); head.position.y = 1.9; V.who.add(head); V.whoHead = head;
  const hair = new T.Mesh(V.sphG, M(0x1a120c)); hair.scale.set(0.25, 0.16, 0.25); hair.position.y = 2.0; V.who.add(hair); V.who.position.set(-2.7, 0, 1.6); V.who.rotation.y = 0.6; S.add(V.who);
  W3.setQuality(stepN); return V; }
// ---------- toppings ----------
function topMesh(V, kind) { const T = V.T, g = new T.Group(), M = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.4 }, o));
  if (kind === 'berry') { const b = new T.Mesh(V.sphG, M(0xd82a3a, { roughness: 0.3 })); b.scale.set(0.09, 0.11, 0.09); b.position.y = 0.09; g.add(b); const l = new T.Mesh(new T.ConeGeometry(0.07, 0.04, 6), M(0x3a9a3a)); l.position.y = 0.2; g.add(l); }
  else if (kind === 'candle') { const c = new T.Mesh(V.cylG, M(0x7ac8f0)); c.scale.set(0.025, 0.3, 0.025); c.position.y = 0.15; g.add(c); const f = new T.Mesh(new T.ConeGeometry(0.025, 0.08, 10), M(0xffc040, { emissive: 0xffa020, emissiveIntensity: 3 })); f.position.y = 0.35; g.add(f); g.flame = f; }
  else if (kind === 'cherry') { const b = new T.Mesh(V.sphG, M(0xb0102a, { roughness: 0.15 })); b.scale.setScalar(0.08); b.position.y = 0.08; g.add(b); const s = new T.Mesh(V.cylG, M(0x5a7a2a)); s.scale.set(0.008, 0.14, 0.008); s.position.set(0.02, 0.2, 0); s.rotation.z = -0.3; g.add(s); }
  else { for (const [y, c] of [[0.03, 0xf2a0b8], [0.07, 0xfff4e8], [0.11, 0xf2a0b8]]) { const m = new T.Mesh(V.cylG, M(c, { roughness: 0.7 })); m.scale.set(0.1, 0.04, 0.1); m.position.y = y; g.add(m); } }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g; }
// ---------- each cake: its tiers and their icing maps ----------
function buildCake(V, g) { const T = V.T; for (const tv of V.tierV) { V.cake.remove(tv.grp); } V.tierV = []; V.built = g; V.nT = -1; V.drip.clear(); V.dripFor = null;
  W3.setSky(PLACES[placeOf(g.N)].sky, { azim: 160 }); const night = W3.S.night > 0; V.lampM.emissiveIntensity = night ? 3 : 1.2; V.warm.intensity = night ? 16 : 10; W3.hemi.intensity = W3.S.hemiI + (night ? 1.4 : 1.0); V.fill.intensity = night ? 1.6 : 1.2;
  V.standM.color.setHex(mySkin().col); V.whoBody.material.color.setHex([0xe8463c, 0x2f7de0, 0x2fb060, 0xf2c230, 0x8a4fd0, 0xf07a2a][g.seed % 6]); V.whoHead.material.color.setHex([0x8d5524, 0xc68642, 0xe0ac69, 0x5a3825, 0xf1c27d][g.seed % 5]);
  for (const t of V.tops) { t.clear(); t.visible = false; } V.topKind = g.ord.top >= 0 ? TOPS[g.ord.top].id : 'berry'; for (const t of V.tops) t.add(topMesh(V, V.topKind)); ui.snap = true; }
function tierView(V, g, i) { const T = V.T, t = g.tiers[i], r = t.r, grp = new T.Group(); grp.position.set(t.off, i * TIER_H, 0); V.cake.add(grp);
  const sp = new T.Mesh(V.cylG, new T.MeshStandardMaterial({ color: SPONGES[g.ord.sponge], roughness: 0.85, map: W3.grainTex(128, 21 + i, 200, 40, 6) })); sp.scale.set(r, TIER_H * 0.98, r); sp.position.y = TIER_H / 2; sp.castShadow = sp.receiveShadow = true; grp.add(sp);
  const c = document.createElement('canvas'); c.width = AB * 4; c.height = HB * 4; const tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace;
  const icM = new T.MeshPhysicalMaterial({ color: 0xffffff, map: tex, alphaTest: 0.5, transparent: false, roughness: 0.35, clearcoat: 0.4, side: T.FrontSide });
  const ic = new T.Mesh(new T.CylinderGeometry(1, 1, 1, 48, 1, true), icM); ic.scale.set(r + 0.025, TIER_H, r + 0.025); ic.position.y = TIER_H / 2; ic.castShadow = true; grp.add(ic);
  const topM = new T.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.35, clearcoat: 0.4, transparent: true, opacity: 0 }); const top = new T.Mesh(new T.CircleGeometry(r + 0.025, 48), topM); top.rotation.x = -Math.PI / 2; top.position.y = TIER_H + 0.004; grp.add(top);
  return { grp, c, tex, icM, topM, sp, last: -1 }; }
function paintIcing(V, g, i, tv) { if (!tv.c2) { tv.c2 = document.createElement('canvas'); tv.c2.width = tv.c.width; tv.c2.height = tv.c.height; } const x = tv.c2.getContext('2d'), cov = g.ice && g.ice.cov[i], col = g.colour != null ? ICINGS[g.colour].col : 0xffffff, c3 = new V.T.Color(col);
  x.clearRect(0, 0, tv.c.width, tv.c.height); if (!cov) { tv.c.getContext('2d').clearRect(0, 0, tv.c.width, tv.c.height); return; }      /* 22 Nov 2026: the icing was square blocks; round dabs, then one soft pass over the whole sheet, read as icing */
  const css = `rgb(${c3.r * 255 | 0},${c3.g * 255 | 0},${c3.b * 255 | 0})`, dark = `rgba(0,0,0,.08)`;
  for (let b = 0; b < HB; b++) for (let a = 0; a < AB; a++) { const v = cov[b * AB + a]; if (v <= 0.02) continue; x.globalAlpha = Math.min(1, v * 1.4); x.fillStyle = css; x.beginPath(); x.arc(a * 4 + 2, (HB - 1 - b) * 4 + 2, 4.6, 0, TAU); x.fill(); if (v > 1.2) { x.fillStyle = dark; x.beginPath(); x.arc(a * 4 + 2, (HB - 1 - b) * 4 + 2, 2.4, 0, TAU); x.fill(); } }
  x.globalAlpha = 1; { const y = tv.c.getContext('2d'); y.clearRect(0, 0, tv.c.width, tv.c.height); try { y.filter = 'blur(1.4px)'; } catch (e) {} y.drawImage(tv.c2, 0, 0); try { y.filter = 'none'; } catch (e) {} } tv.tex.needsUpdate = true; tv.topM.color.setHex(col); tv.topM.opacity = clamp(g.ice.top[i] * 1.1, 0, 1); }
// ---------- each frame ----------
const SV = window.THREE ? new THREE.Vector3() : null;
function cakeTopY(g) { return STAND_Y + g.tiers.length * TIER_H; }
function sync(V, g, dt) { const T = V.T; V.t += dt;
  const turn = -((g.ang % 1) * TAU); V.cake.rotation.y = turn; V.turn.rotation.y = turn;
  // tiers
  while (V.tierV.length < g.tiers.length) V.tierV.push(tierView(V, g, V.tierV.length));
  V.tierV.forEach((tv, i) => { const t = g.tiers[i]; tv.grp.position.x = t.off; tv.grp.position.y += (i * TIER_H - tv.grp.position.y) * Math.min(1, dt * 14); if (g.stage === 'ice' || V.paintN !== g.colour + ':' + (g.ice ? 1 : 0)) paintIcing(V, g, i, tv); }); V.paintN = g.colour + ':' + (g.ice ? 1 : 0);
  // the sliding tier
  const si = g.tiers.length; V.slider.visible = g.stage === 'stack' && si < g.ord.tiers && !g.wait; if (V.slider.visible) { const r = tierR(si); V.slider.scale.set(r, TIER_H * 0.98, r); V.slider.material.color.setHex(SPONGES[g.ord.sponge]); V.slider.position.set(g.st.x, STAND_Y + si * TIER_H + TIER_H / 2 + 0.7, 0); }
  // the knife follows the thumb while icing
  V.knife.visible = g.stage === 'ice' && !!g.thumb && g.thumb.h != null; if (V.knife.visible) { const H = g.tiers.length * TIER_H, y = STAND_Y + clamp(g.thumb.h, 0, 1) * H, ti = clamp(Math.floor((y - STAND_Y) / TIER_H), 0, g.tiers.length - 1), r = g.tiers[ti].r; V.knife.position.set(0.0, y, r + 0.06); V.knife.rotation.set(0, Math.PI / 2, 0.12 * Math.sin(V.t * 20)); }
  // the piping bag over the front of the top rim; the guide dots and the swirls
  const top = g.tiers.length - 1, rt = top >= 0 ? g.tiers[top].r : 1, ty = g.tiers.length * TIER_H, offT = top >= 0 ? g.tiers[top].off : 0;
  V.bag.visible = g.stage === 'pipe'; if (V.bag.visible) { V.bag.position.set(0, cakeTopY(g) + 0.42 - ui.squeeze * 0.06, rt * 0.86); V.bag.scale.set(1 + ui.squeeze * 0.15, 1 - ui.squeeze * 0.1, 1 + ui.squeeze * 0.15); V.bagFill.material.color.setHex(ICINGS[g.colour != null ? g.colour : 1].col); }
  V.swirlM.color.setHex(new T.Color(ICINGS[g.colour != null ? g.colour : 1].col).lerp(new T.Color(0xffffff), 0.35).getHex());
  V.swirls.forEach((m, i) => { const q = g.swirls[i]; m.visible = !!q; if (q) { const a = q.a * TAU; m.position.set(offT + Math.sin(a) * rt * 0.86, ty, Math.cos(a) * rt * 0.86); } });
  V.guides.forEach((m, i) => { const on = g.stage === 'pipe' && i < g.st.n && i >= g.swirls.length; m.visible = on; if (on) { const a = g.st.guides[i] * TAU; m.position.set(offT + Math.sin(a) * rt * 0.86, ty + 0.02, Math.cos(a) * rt * 0.86); m.material.opacity = i === g.swirls.length ? 0.6 + 0.4 * Math.sin(V.t * 10) : 0.35; m.scale.setScalar(i === g.swirls.length ? 0.045 : 0.03); } });
  // toppings and their spots
  V.tops.forEach((m, i) => { const q = g.tops[i]; m.visible = !!q; if (q) { m.position.set(offT + q.x, ty, q.z); if (m.children[0] && m.children[0].flame) m.children[0].flame.scale.y = 1 + 0.25 * Math.sin(V.t * 23 + i); } });
  const spots = g.stage === 'top' ? topSpots(g, g.st.n) : []; V.spots.forEach((m, i) => { const sp = spots[i], on = !!sp && i >= g.tops.length; m.visible = on && (g.lesson || g.N <= 6 || g.cfg.help); if (on) { m.position.set(offT + sp[0], ty + 0.01, sp[1]); } });
  // the drip (ordered on some cakes): runs down from the top edge
  if (g.ord.drip >= 0 && g.dripDone && V.dripFor !== g) { V.dripFor = g; const c = ICINGS[g.ord.drip].col, m = new T.MeshPhysicalMaterial({ color: c, roughness: 0.2, clearcoat: 1 }); for (let i = 0; i < 18; i++) { const a = i / 18 * TAU, len = 0.12 + ((i * 7) % 5) * 0.05, d = new T.Mesh(new T.CapsuleGeometry(0.035, len, 3, 8), m); d.position.set(offT + Math.sin(a) * (rt + 0.03), ty - len / 2, Math.cos(a) * (rt + 0.03)); V.drip.add(d); } const cap = new T.Mesh(new T.CylinderGeometry(rt + 0.035, rt + 0.035, 0.03, 48), m); cap.position.set(offT, ty + 0.01, 0); V.drip.add(cap); }
  // the customer bobs, and beams at the verdict
  V.who.position.y = Math.abs(Math.sin(V.t * 1.5)) * 0.02 + (g.over === 'won' ? Math.abs(Math.sin(V.t * 8)) * 0.12 : 0);
  // the camera: in front, a little above; closer to the top for piping and topping
  const H = Math.max(1, g.tiers.length) * TIER_H, asp = innerWidth / innerHeight, portrait = asp < 0.8, st = g.stage;
  let cp, cl; if (st === 'top') { cp = [0, cakeTopY(g) + (portrait ? 3.6 : 2.9), portrait ? 2.6 : 2.1]; cl = [0, cakeTopY(g) - 0.2, 0]; } else if (st === 'pipe') { const d = portrait ? 4.6 : 3.4; cp = [0, cakeTopY(g) + 2.6, d]; cl = [0, cakeTopY(g) - 0.45, 0]; }
  else { const d = portrait ? 5.2 + H * 0.9 : 3.8 + H * 0.6; cp = [0, STAND_Y + H * 0.55 + 1.2, d]; cl = [0, STAND_Y + H * 0.45, 0]; }
  if (ui.snap || !ui.cam) { ui.cam = { p: cp.slice(), l: cl.slice() }; ui.snap = false; }
  const kk = Math.min(1, dt * 3); for (let i = 0; i < 3; i++) { ui.cam.p[i] += (cp[i] - ui.cam.p[i]) * kk; ui.cam.l[i] += (cl[i] - ui.cam.l[i]) * kk; }
  const cam = W3.cam; cam.fov = portrait ? 50 : 40; cam.aspect = asp; cam.updateProjectionMatrix(); cam.position.set(...ui.cam.p); cam.lookAt(...ui.cam.l); cam.updateMatrixWorld(); W3.setFocus(0, STAND_Y, 0, 4); }
function scr(x, y, z) { if (!V3 || V3.none) return { x: W / 2, y: H / 2 }; SV.set(x, y, z); return W3.screen(SV); }
// where a touch lands: across the screen (u), the height on the cake (h), the point on the top (top, in the top tier's own frame)
function sem(px, py, g) { const out = { u: px / W, h: null, top: null }; if (!V3 || V3.none || !g) return out;
  const r0 = g.tiers.length ? g.tiers[0].r : 1, Hc = g.tiers.length * TIER_H, a = scr(0, STAND_Y, r0), b = scr(0, STAND_Y + Hc, r0); out.h = clamp((a.y - py) / Math.max(10, a.y - b.y), -0.1, 1.1);
  const T = V3.T, rc = new T.Raycaster(), ndc = new T.Vector2(px / W * 2 - 1, -(py / H) * 2 + 1); rc.setFromCamera(ndc, W3.cam); const y0 = cakeTopY(g), d = rc.ray.direction, o = rc.ray.origin; if (Math.abs(d.y) > 1e-4) { const t = (y0 - o.y) / d.y; if (t > 0) { const wx = o.x + d.x * t, wz = o.z + d.z * t, ang = -V3.cake.rotation.y, lx = wx * Math.cos(ang) + wz * Math.sin(ang) * -1 * -1, lz = -wx * Math.sin(ang) + wz * Math.cos(ang); const top = g.tiers[g.tiers.length - 1]; out.top = [lx - (top ? top.off : 0), lz]; } }
  return out; }
// ---------- what happens, seen and heard ----------
function onEvent(G, e) { const cx = W / 2;
  switch (e.k) {
    case 'start': case 'yard': ui.snap = true; ui.banner = G.lesson ? null : { txt: `${G.ord.who.toUpperCase()}'S ${G.ord.why.toUpperCase()}`, t: 0, secs: 1.6, col: '#ffd0e0' }; sfx.bell(); break;
    case 'stage': ui.snap = false; ui.banner = { txt: { stack: 'STACK', colour: 'PICK THE ICING', ice: 'ICE IT', pipe: 'PIPE IT', top: 'TOP IT' }[e.s], t: 0, secs: 1.0, col: '#fff' }; sfx.stage(); break;
    case 'drop': sfx.plop(e.neat); vibe(HAP.light); say(e.neat === 'perfect' ? 'PERFECT!' : e.neat === 'good' ? 'NICE' : 'A BIT OFF', cx, H * 0.36, e.neat === 'perfect' ? '#ffd040' : e.neat === 'good' ? '#80ff90' : '#ffb070', 24); if (e.neat === 'perfect') burst(cx, H * 0.45, '#ffd040', 14); break;
    case 'colour': sfx.bloop(); if (!e.ok) tip('colour', 'Check the order card: that is not the icing they asked for.', 3); break;
    case 'iced': sfx.combo(3); say(e.cov >= 0.98 ? 'SMOOTH!' : 'ICED', cx, H * 0.36, '#ffd040', 26); burst(cx, H * 0.45, '#fff', 16); break;
    case 'drip': sfx.drip(); break;
    case 'swirl': sfx.squish(e.n); ui.squeeze = 1; vibe(HAP.tick); say(e.q === 'perfect' ? 'PERFECT' : e.q === 'good' ? 'GOOD' : 'OFF', cx, H * 0.3, e.q === 'perfect' ? '#ffd040' : e.q === 'good' ? '#80ff90' : '#ffb070', 20); break;
    case 'top': sfx.plop('good', e.n); vibe(HAP.tick); break;
    case 'miss': sfx.no(); tip('miss', 'Tap on top of the cake.', 2); break;
    case 'hurry': say('"Is it ready yet?"', cx, H * 0.3, '#ffd0e0', 18); break;
    case 'judge': if (e.score >= 85) sfx.ooh(); break;
    case 'won': sfx.win(); break;
    case 'lost': sfx.lose(); break;
    case 'lessonnext': hint = null; break;
    case 'lessonok': sfx.coin(e.n); say(`${e.n} / ${e.need}`, cx, H * 0.44, '#80ff90', 22); break;
    case 'lessonmiss': coachMiss(); sfx.no(); break;
    case 'lessondone': sfx.goal(); say('LESSON DONE!', cx, H * 0.4, '#80ff90', 28); burst(cx, H * 0.4, '#80ff90', 24); break;
  } }
let IG = null; function idleG() { if (!IG || (IG.over && (IG.idle = (IG.idle || 0) + 1 / 60) > 3)) { IG = newGame(Math.max(7, store.get('level', 1) | 0), { seed: (Math.random() * 1e6) | 0 }); IG.mem = {}; ui.snap = true; } if (!IG.over) { honest(IG, { react: 0.4, acc: 0.95 }, IG.mem); step(IG, 1 / 60); } IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#3a2a2a'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D bakery.', W / 2, H / 2); if (G) hud(G, now); return; }
  const g = G || idleG(); if (V.built !== g || V.tierV.length > g.tiers.length) buildCake(V, g);
  sync(V, g, dt);
  W3.render(dt);
  if (G && !(G.over && !$('ovEnd').classList.contains('hidden'))) hud(G, now);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 0.9 ? 1 : 1 - (t2.t - 0.9) / 0.5; ctx.globalAlpha = Math.max(0, al); const sc = t2.t < 0.12 ? 1.3 - t2.t / 0.12 * 0.3 : 1; ctx.font = `400 ${Math.round(t2.size * k * sc)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(60,20,40,.55)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 20); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 20); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30, hy = H * 0.66;
    ctx.fillStyle = 'rgba(60,24,44,.9)'; rrect(W / 2 - w / 2, hy - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, hy - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; } }
// ---------- the 2D layer: the order card, the stage, the swatches, the meters ----------
function hud(G, t) { ctx.textBaseline = 'middle'; const o = G.ord;
  if (G.lesson) lessonPanel(G);
  else { // the order card
    const x = 12, w = W - 24, y = 44 * k, lines = [`${o.tiers} tier${o.tiers > 1 ? 's' : ''} · ${ICINGS[o.icing].name} icing${o.drip >= 0 ? ` · ${ICINGS[o.drip].name} drip` : ''}`, `${o.swirls} swirls${o.tops ? ` · ${o.tops} ${TOPS[o.top].name}` : ''}`];
    ctx.fillStyle = 'rgba(255,248,240,.94)'; rrect(x, y, w, 64 * k, 14 * k); ctx.fill(); ctx.strokeStyle = '#f2a0b8'; ctx.lineWidth = 2; rrect(x, y, w, 64 * k, 14 * k); ctx.stroke();
    ctx.textAlign = 'left'; ctx.fillStyle = '#b8456a'; ctx.font = `400 ${Math.round(16 * k)}px ${TF}`; ctx.fillText(`${o.who}'s ${o.why}`, x + 12, y + 15 * k);
    ctx.fillStyle = '#4a2a3a'; ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; lines.forEach((l, i) => ctx.fillText(l, x + 12, y + 34 * k + i * 16 * k));
    ctx.fillStyle = hex(ICINGS[o.icing].col); ctx.beginPath(); ctx.arc(x + w - 26 * k, y + 32 * k, 16 * k, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.stroke();
    // the stages
    const ss = ['stack', 'colour', 'ice', 'pipe', 'top'].filter(s => s !== 'top' || o.tops), i0 = ss.indexOf(G.stage); ss.forEach((s, i) => { const sx = W / 2 + (i - (ss.length - 1) / 2) * 62 * k, sy = y + 82 * k; ctx.fillStyle = i < i0 ? '#80d090' : i === i0 ? '#ffd040' : 'rgba(255,255,255,.35)'; rrect(sx - 28 * k, sy - 9 * k, 56 * k, 18 * k, 9 * k); ctx.fill(); ctx.fillStyle = i <= i0 ? '#3a2030' : '#fff'; ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillText(s.toUpperCase(), sx, sy + 1); }); }
  if (ui.banner) { const B = ui.banner, sc = B.t < 0.12 ? 1.25 - B.t / 0.12 * 0.25 : 1; ctx.textAlign = 'center'; ctx.font = `400 ${Math.round(34 * k * sc)}px ${TF}`; ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(80,30,50,.6)'; ctx.strokeText(B.txt, W / 2, H * 0.27); ctx.fillStyle = B.col || '#fff'; ctx.fillText(B.txt, W / 2, H * 0.27); }
  const s = G.stage, by = H - 70 * k; ctx.textAlign = 'center';
  const say2 = (txt, col = '#fff') => { ctx.font = `400 ${Math.round(17 * k)}px ${TF}`; const tw = ctx.measureText(txt).width; if (tw > W - 30) ctx.font = `400 ${Math.floor(17 * k * (W - 30) / tw)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(80,30,50,.6)'; ctx.strokeText(txt, W / 2, by); ctx.fillStyle = col; ctx.fillText(txt, W / 2, by); };
  if (G.wait > 0 || G.over) return;
  if (s === 'stack') say2(`TAP TO SET THE ${['BOTTOM', 'MIDDLE', 'TOP'][G.tiers.length] || ''} TIER DOWN`);
  if (s === 'colour') { const n = G.swatches.length; G.swatches.forEach((j, i) => { const x = (i + 0.5) / n * W, y = H - 165 * k, r = Math.min(W / n * 0.38, 42 * k); ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.arc(x, y, r + 5, 0, TAU); ctx.fill(); ctx.fillStyle = hex(ICINGS[j].col); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(60,20,40,.7)'; ctx.strokeText(ICINGS[j].name.toUpperCase(), x, y + r + 16 * k); ctx.fillText(ICINGS[j].name.toUpperCase(), x, y + r + 16 * k); }); say2('PICK THE ICING ON THE CARD', '#ffd0e0'); }
  if (s === 'ice') { const c = coverage(G), w = Math.min(260 * k, W - 60), x0 = W / 2 - w / 2, y = H - 110 * k; ctx.fillStyle = 'rgba(60,24,44,.6)'; rrect(x0 - 6, y - 10 * k, w + 12, 20 * k, 10 * k); ctx.fill(); ctx.fillStyle = hex(ICINGS[G.colour].col); rrect(x0, y - 6 * k, w * c, 12 * k, 6 * k); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(x0 + w * 0.86, y - 9 * k, 2, 18 * k);
    say2(G.thumb ? (c >= 0.86 ? `${Math.round(c * 100)}% · LIFT TO FINISH, OR KEEP GOING` : `${Math.round(c * 100)}% · SLIDE UP AND DOWN`) : 'HOLD YOUR THUMB ON THE CAKE'); }
  if (s === 'pipe') say2(`TAP AS THE DOT PASSES UNDER THE BAG · ${G.swirls.length}/${G.st.n}`);
  if (s === 'top') say2(`TAP ON TOP TO PLACE ${TOPS[G.ord.top] ? TOPS[G.ord.top].name.toUpperCase() : ''} · ${G.tops.length}/${G.st.n}`); }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { coachPanel(G); }
