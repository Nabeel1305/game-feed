// ===================== THE VIEW: On the Run in 3D (three.js through tools/world3d.js) =====================
// The same city as Police Chase, from the other side: your getaway car down a lit avenue, the cops' light bars closing in
// behind, roadblocks of patrol cars and barriers, spikes, cash bags and nitro cans in the lanes, a helicopter's spotlight;
// then the alleys on foot to the safehouse door. Game (x, s) is three.js (x, y, -s).
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, TXT = [];
let hint = null, V3 = null;
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 6) TXT.shift(); }
function tip(key, txt, secs = 2.8) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function fxStep(dt) {
  FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 1.8);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.3) TXT.shift();
  if (hint) { hint.t += dt; if (hint.t >= hint.secs) hint = null; }
}
const hash = n => { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };
function buildWorld() {
  if (V3) return V3; const T = THREE; if (!W3 || !W3.init({ canvas: $('gl'), fov: 68, far: 2500, near: 0.1 })) { V3 = { none: true }; return V3; }
  const S = W3.scene, R0 = W3.rng(5);
  // the city: tarmac everywhere, a paved block between every four streets, towers on the blocks, lines down the streets. Everything
  // is instanced and re-placed round the car as it moves, so it never runs out; frustumCulled is OFF on all of it (three.js keeps
  // the bounding sphere of where the instances FIRST were, so far from the start the whole mesh was culled: his vanishing skyscrapers).
  const tar = W3.grainTex(256, 17, 80, 30, 6); tar.repeat.set(60, 60);
  const road = new T.Mesh(new T.PlaneGeometry(1400, 1400), new T.MeshStandardMaterial({ color: 0x2b2d31, roughness: 0.55, metalness: 0.0, map: tar })); road.rotation.x = -Math.PI / 2; road.receiveShadow = true; S.add(road);
  const inst = (geo, mat, n) => { const m = new T.InstancedMesh(geo, mat, n); m.frustumCulled = false; S.add(m); return m; };
  const BS = P - 2 * RW, NBK = 49, slabs = inst(new T.BoxGeometry(BS, 0.22, BS), new T.MeshStandardMaterial({ color: 0x77736c, roughness: 0.85, map: W3.grainTex(128, 4, 170, 40, 3) }), NBK); slabs.receiveShadow = true;
  const lineM = new T.MeshStandardMaterial({ color: 0xe8e4d8, roughness: 0.5, emissive: 0x222222 }), dash = inst(new T.BoxGeometry(0.16, 0.02, 3.2), lineM, 640), D = new T.Object3D();
  const wc = document.createElement('canvas'); wc.width = 128; wc.height = 256; const we = document.createElement('canvas'); we.width = 128; we.height = 256;
  { const g = wc.getContext('2d'), e = we.getContext('2d'); g.fillStyle = '#6a655e'; g.fillRect(0, 0, 128, 256); e.fillStyle = '#000'; e.fillRect(0, 0, 128, 256);
    for (let y = 6; y < 256; y += 16) for (let x = 6; x < 128; x += 15) { const lit = R0() < 0.42, warm = R0() < 0.7; g.fillStyle = '#1d2228'; g.fillRect(x, y, 9, 10); if (lit) { e.fillStyle = warm ? '#ffcf8a' : '#bfe0ff'; e.fillRect(x, y, 9, 10); } } }
  const wt = new T.CanvasTexture(wc), wet = new T.CanvasTexture(we); wt.colorSpace = wet.colorSpace = T.SRGBColorSpace; wt.wrapS = wt.wrapT = wet.wrapS = wet.wrapT = T.RepeatWrapping;
  const bM = new T.MeshStandardMaterial({ map: wt, emissiveMap: wet, emissive: 0xffffff, emissiveIntensity: 1, roughness: 0.8 });
  const blds = inst(new T.BoxGeometry(1, 1, 1), bM, NBK * 4); blds.receiveShadow = true;
  const poleI = inst(new T.CylinderGeometry(0.09, 0.11, 6.5, 6), new T.MeshStandardMaterial({ color: 0x3a3d42, metalness: 0.6, roughness: 0.5 }), 144), headI = inst(new T.SphereGeometry(0.32, 8, 6), new T.MeshStandardMaterial({ color: 0xfff0d0, emissive: 0xffc68a, emissiveIntensity: 2 }), 144);
  const lamps = []; for (let i = 0; i < 4; i++) { const l = new T.PointLight(0xffc68a, 30, 30, 1.6); S.add(l); lamps.push(l); }
  // the way to the drop: green chevrons on the road along the route ahead, and a green ring round the junction to head for
  const gcv = document.createElement('canvas'); gcv.width = gcv.height = 64; { const g = gcv.getContext('2d'); g.fillStyle = '#39f07a'; g.strokeStyle = 'rgba(0,40,10,.9)'; g.lineWidth = 3; g.beginPath(); g.moveTo(32, 6); g.lineTo(58, 40); g.lineTo(58, 58); g.lineTo(32, 26); g.lineTo(6, 58); g.lineTo(6, 40); g.closePath(); g.fill(); g.stroke(); }
  const gT = new T.CanvasTexture(gcv); gT.colorSpace = T.SRGBColorSpace; const guideI = inst(new T.PlaneGeometry(3.6, 3.6).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ map: gT, transparent: true, depthWrite: false, fog: false, opacity: 0.92 }), 40); guideI.renderOrder = 2;
  const ring = new T.Mesh(new T.RingGeometry(5.4, 6.6, 48), new T.MeshBasicMaterial({ color: 0x39f07a, transparent: true, opacity: 0.8, depthWrite: false, fog: false })); ring.rotation.x = -Math.PI / 2; ring.renderOrder = 2; S.add(ring);
  // cars: a body, a cabin, wheels, lights; colours by car
  const carModel = (col, police) => { const g = new T.Group(), paint = new T.MeshStandardMaterial({ color: col, metalness: 0.6, roughness: 0.28 }), glass = new T.MeshStandardMaterial({ color: 0x0c1015, metalness: 0.9, roughness: 0.08 }), rub = new T.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
    const body = new T.Mesh(new T.BoxGeometry(1.86, 0.62, 4.5), paint); body.position.y = 0.55; const cab = new T.Mesh(new T.BoxGeometry(1.6, 0.5, 2.3), glass); cab.position.set(0, 1.08, 0.15); const roof = new T.Mesh(new T.BoxGeometry(1.58, 0.06, 2.0), paint); roof.position.set(0, 1.35, 0.2);
    g.add(body, cab, roof); for (const [x, z] of [[-0.85, 1.45], [0.85, 1.45], [-0.85, -1.45], [0.85, -1.45]]) { const w = new T.Mesh(new T.CylinderGeometry(0.34, 0.34, 0.26, 14), rub); w.rotation.z = Math.PI / 2; w.position.set(x, 0.34, z); g.add(w); }
    const tl = new T.MeshStandardMaterial({ color: 0x400000, emissive: 0xff1a10, emissiveIntensity: 1.6 }), hl = new T.MeshStandardMaterial({ color: 0xfff6e0, emissive: 0xfff2d0, emissiveIntensity: 2 });
    for (const x of [-0.68, 0.68]) { const t2 = new T.Mesh(new T.BoxGeometry(0.36, 0.14, 0.05), tl); t2.position.set(x, 0.66, 2.26); const h2 = new T.Mesh(new T.BoxGeometry(0.34, 0.12, 0.05), hl); h2.position.set(x, 0.62, -2.26); g.add(t2, h2); }
    if (police) { const doors = new T.Mesh(new T.BoxGeometry(1.88, 0.4, 2.2), new T.MeshStandardMaterial({ color: 0xf2f2f2, metalness: 0.4, roughness: 0.3 })); doors.position.set(0, 0.55, 0.1); g.add(doors);
      const bar = new T.Group(); for (const [x, c] of [[-0.4, 0xff2020], [0.4, 0x2050ff]]) { const b = new T.Mesh(new T.BoxGeometry(0.62, 0.12, 0.26), new T.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 2 })); b.position.set(x, 1.45, 0.2); bar.add(b); } g.add(bar); g.userData.bar = bar; }
    g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g; };
  const me = carModel(0xb3121a); S.add(me);
  { const sp = new T.Mesh(new T.BoxGeometry(1.7, 0.06, 0.3), new T.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 })); sp.position.set(0, 1.0, 2.15); me.add(sp); const st = new T.Mesh(new T.BoxGeometry(0.5, 0.02, 4.4), new T.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.3 })); st.position.set(0, 0.87, 0); me.add(st); }
  const flame = new T.Mesh(new T.ConeGeometry(0.25, 1.6, 12, 1, true), new T.MeshBasicMaterial({ color: 0x66c8ff, transparent: true, opacity: 0.8, blending: T.AdditiveBlending, depthWrite: false })); flame.rotation.x = -Math.PI / 2; flame.position.set(0, 0.45, 3.0); me.add(flame);
  const redL = new T.PointLight(0xff2020, 0, 34, 1.5), blueL = new T.PointLight(0x2050ff, 0, 34, 1.5); S.add(redL, blueL);
  const head = new T.SpotLight(0xfff2d8, 60, 70, 0.5, 0.5, 1.2); S.add(head, head.target);
  const cops = []; for (let i = 0; i < 6; i++) { const c = carModel(0x111418, true); c.visible = false; S.add(c); cops.push(c); }
  const COLS = [0x8a8f96, 0x2b3d5c, 0xd8d4c8, 0x324a2e, 0x8a6a2a, 0x1a1a1a], traffic = []; for (let i = 0; i < 18; i++) { const c = carModel(COLS[i % 6]); c.visible = false; S.add(c); traffic.push(c); }
  // things in the lanes: cash bags, nitro cans, spike strips; roadblocks of barriers
  const bagM = new T.MeshStandardMaterial({ color: 0x3f7a3a, roughness: 0.8, emissive: 0x0a2a0a }), canM = new T.MeshStandardMaterial({ color: 0x2a7adf, metalness: 0.6, roughness: 0.3, emissive: 0x0a2a6a }), spikeM = new T.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.7, roughness: 0.4 });
  const glowT = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new T.CanvasTexture(c); })();
  const thingPool = []; for (let i = 0; i < 40; i++) { const g = new T.Group(); g.visible = false; S.add(g); thingPool.push(g); }
  const mkThing = (g, k) => { g.clear(); g.userData.k = k;
    if (k === 'cash') { const b = new T.Mesh(new T.SphereGeometry(0.42, 14, 10), bagM); b.scale.set(1, 1.2, 1); b.position.y = 0.55; const knot = new T.Mesh(new T.CylinderGeometry(0.08, 0.16, 0.25, 8), bagM); knot.position.y = 1.08; const s2 = new T.Sprite(new T.SpriteMaterial({ map: glowT, color: 0x9bff9b, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0.5 })); s2.scale.set(2.2, 2.2, 1); s2.position.y = 0.7; g.add(b, knot, s2); }
    if (k === 'can') { const b = new T.Mesh(new T.CylinderGeometry(0.28, 0.28, 0.9, 14), canM); b.position.y = 0.6; const s2 = new T.Sprite(new T.SpriteMaterial({ map: glowT, color: 0x66c8ff, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0.6 })); s2.scale.set(2.4, 2.4, 1); s2.position.y = 0.7; g.add(b, s2); }
    if (k === 'spike') { const b = new T.Mesh(new T.BoxGeometry(3.4, 0.06, 0.7), spikeM); b.position.y = 0.04; g.add(b); const gl = new T.Mesh(new T.BoxGeometry(3.4, 0.03, 0.16), new T.MeshBasicMaterial({ color: 0xff3a28, fog: false })); gl.position.set(0, 0.09, 0.42); const gl2 = gl.clone(); gl2.position.z = -0.42; g.add(gl, gl2); for (let i = 0; i < 12; i++) { const sp = new T.Mesh(new T.ConeGeometry(0.06, 0.22, 5), spikeM); sp.position.set(-1.5 + i * 0.27, 0.16, 0); g.add(sp); } }
    if (k === 'block') { const st = document.createElement('canvas'); st.width = 64; st.height = 16; const sg = st.getContext('2d'); for (let i = 0; i < 8; i++) { sg.fillStyle = i % 2 ? '#f2f2f2' : '#e0261a'; sg.beginPath(); sg.moveTo(i * 8, 16); sg.lineTo(i * 8 + 8, 0); sg.lineTo(i * 8 + 16, 0); sg.lineTo(i * 8 + 8, 16); sg.fill(); } const tx = new T.CanvasTexture(st); tx.colorSpace = T.SRGBColorSpace;
      const bar = new T.Mesh(new T.BoxGeometry(3.0, 0.35, 0.12), new T.MeshStandardMaterial({ map: tx, roughness: 0.6, emissive: 0x200000 })); bar.position.y = 0.9; g.add(bar); for (const x of [-1.3, 1.3]) { const leg = new T.Mesh(new T.BoxGeometry(0.1, 0.9, 0.5), spikeM); leg.position.set(x, 0.45, 0); g.add(leg); }
      const lamp = new T.Mesh(new T.SphereGeometry(0.1, 8, 6), new T.MeshStandardMaterial({ color: 0xffa020, emissive: 0xffa020, emissiveIntensity: 3 })); lamp.position.y = 1.15; g.add(lamp); }
    g.traverse(o => { if (o.isMesh) o.castShadow = true; }); };
  // the helicopter and its searchlight
  const heli = new T.Group(); { const hm = new T.MeshStandardMaterial({ color: 0x1c2026, metalness: 0.5, roughness: 0.4 }); const b = new T.Mesh(new T.SphereGeometry(1.2, 16, 12), hm); b.scale.set(1, 0.9, 1.6); heli.add(b); const tb = new T.Mesh(new T.CylinderGeometry(0.15, 0.3, 4, 8), hm); tb.rotation.x = Math.PI / 2; tb.position.z = 2.8; heli.add(tb);
    const rot = new T.Mesh(new T.BoxGeometry(7, 0.05, 0.3), hm); rot.position.y = 1.2; heli.add(rot); heli.userData.rot = rot;
    const cone = new T.Mesh(new T.ConeGeometry(4, 26, 24, 1, true), new T.MeshBasicMaterial({ color: 0xfff6d8, transparent: true, opacity: 0.14, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide })); cone.position.y = -13; heli.add(cone); heli.userData.cone = cone; }
  heli.visible = false; S.add(heli); const heliL = new T.SpotLight(0xfff6e0, 0, 60, 0.18, 0.4, 1); S.add(heliL, heliL.target);
  // the alley (on foot): brick walls close either side, crates, fences, pipes; and the man you are chasing
  const brick = document.createElement('canvas'); brick.width = brick.height = 128; { const g = brick.getContext('2d'); g.fillStyle = '#4a4440'; g.fillRect(0, 0, 128, 128); for (let y = 0; y < 128; y += 10) for (let x = (y / 10 % 2) * 12; x < 128; x += 24) { g.fillStyle = `hsl(${10 + R0() * 12},${30 + R0() * 20}%,${26 + R0() * 14}%)`; g.fillRect(x + 1, y + 1, 22, 8); } }
  const bt = new T.CanvasTexture(brick); bt.colorSpace = T.SRGBColorSpace; bt.wrapS = bt.wrapT = T.RepeatWrapping; bt.repeat.set(0.48, 3);
  // 23 Nov 2026 (alleys with corners): walls and floor are 6 m modules laid along the run (layAlley), so a corner is just where they turn
  const alley = new T.Group(), wallI = new T.InstancedMesh(new T.BoxGeometry(0.4, 9, 6), new T.MeshStandardMaterial({ map: bt, roughness: 0.9 }), 400); wallI.frustumCulled = false; wallI.receiveShadow = true; alley.add(wallI);
  const tar2 = tar.clone(); tar2.repeat.set(2, 1.44); tar2.needsUpdate = true; const floorI = new T.InstancedMesh(new T.PlaneGeometry(5.2, 6).rotateX(-Math.PI / 2), new T.MeshStandardMaterial({ color: 0x5a5650, roughness: 0.6, map: tar2 }), 220); floorI.frustumCulled = false; floorI.receiveShadow = true; alley.add(floorI);
  const arw = document.createElement('canvas'); arw.width = 256; arw.height = 128; { const g = arw.getContext('2d'); g.fillStyle = '#16181c'; g.fillRect(0, 0, 256, 128); g.strokeStyle = '#ffd23a'; g.lineWidth = 8; g.strokeRect(6, 6, 244, 116); g.fillStyle = '#ffd23a'; for (const x of [40, 104, 168]) { g.beginPath(); g.moveTo(x, 26); g.lineTo(x + 30, 26); g.lineTo(x + 62, 64); g.lineTo(x + 30, 102); g.lineTo(x, 102); g.lineTo(x + 32, 64); g.closePath(); g.fill(); } }
  const arwT = new T.CanvasTexture(arw); arwT.colorSpace = T.SRGBColorSpace; const arrowI = new T.InstancedMesh(new T.PlaneGeometry(3.4, 1.7), new T.MeshBasicMaterial({ map: arwT, side: T.DoubleSide }), 32); arrowI.frustumCulled = false; alley.add(arrowI);
  const doorsI = new T.InstancedMesh(new T.BoxGeometry(0.12, 2.3, 1.3), new T.MeshStandardMaterial({ roughness: 0.6 }), 220); doorsI.frustumCulled = false; doorsI.setColorAt(0, new T.Color(1, 1, 1)); alley.add(doorsI);
  const crateM = new T.MeshStandardMaterial({ color: 0x8a6a42, roughness: 0.9, map: W3.grainTex(128, 9, 170, 60, 4) }), metal = new T.MeshStandardMaterial({ color: 0x6a6e74, metalness: 0.7, roughness: 0.4 });
  const obsPool = []; for (let i = 0; i < 24; i++) { const g = new T.Group(); g.visible = false; alley.add(g); obsPool.push(g); }
  alley.visible = false; S.add(alley);
  const alleyLamps = []; for (let i = 0; i < 3; i++) { const l = new T.PointLight(0xffd6a0, 0, 16, 1.6); S.add(l); alleyLamps.push(l); }
  // coins in the alley, and the safehouse door at its end
  const coinI = new T.InstancedMesh(new T.CylinderGeometry(0.22, 0.22, 0.05, 16), new T.MeshStandardMaterial({ color: 0xffd040, metalness: 0.9, roughness: 0.25, emissive: 0x403000 }), 60); alley.add(coinI);
  const door = new T.Group(); { const fr = new T.Mesh(new T.BoxGeometry(5.2, 6, 0.4), new T.MeshStandardMaterial({ color: 0x3a3430, roughness: 0.9 })); fr.position.y = 3; const dr = new T.Mesh(new T.BoxGeometry(1.6, 2.6, 0.2), new T.MeshStandardMaterial({ color: 0x2a4a3a, roughness: 0.6 })); dr.position.set(0, 1.3, 0.2); const lt = new T.Mesh(new T.SphereGeometry(0.15, 8, 6), new T.MeshStandardMaterial({ color: 0x9bff9b, emissive: 0x6bff6b, emissiveIntensity: 3 })); lt.position.set(0, 2.9, 0.4); door.add(fr, dr, lt); } alley.add(door);
  // 23 Nov 2026 (his Police Chase review, "the running graphics are just awful": this alley was the same first-person tunnel with nobody in it): you are
  // seen from behind, running properly, and the officer on your heels comes into the picture as he closes. The same people as Police Chase.
  const person = (top, legs, o = {}) => { const g = new T.Group(), body = new T.Group(); g.add(body); const M2 = (c2, r = 0.8) => new T.MeshStandardMaterial({ color: c2, roughness: r }), sk = M2(o.skin || 0x8a5a3c, 0.6), tp = M2(top), lg = M2(legs), sh = M2(o.shoe || 0xf2f2f2, 0.5);
    const cap = (par, r, l, m, x, y, z) => { const q = new T.Mesh(new T.CapsuleGeometry(r, l, 6, 10), m); q.position.set(x, y, z); q.castShadow = true; par.add(q); return q; };
    cap(body, 0.19, 0.4, tp, 0, 1.27, 0); cap(body, 0.17, 0.12, lg, 0, 0.98, 0); const hd = new T.Mesh(new T.SphereGeometry(0.125, 14, 10), sk); hd.position.set(0, 1.74, -0.01); hd.castShadow = true; body.add(hd);
    if (o.hood) { const h2 = new T.Mesh(new T.SphereGeometry(0.15, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62), tp); h2.position.set(0, 1.75, 0.02); body.add(h2); }
    if (o.cap) { const c2 = new T.Mesh(new T.CylinderGeometry(0.13, 0.135, 0.07, 14), M2(o.cap)); c2.position.set(0, 1.85, 0); const pk = new T.Mesh(new T.BoxGeometry(0.2, 0.02, 0.12), M2(0x0a0c10)); pk.position.set(0, 1.83, -0.15); body.add(c2, pk); }
    if (o.bag) { const b2 = new T.Mesh(new T.BoxGeometry(0.34, 0.26, 0.2), M2(o.bag)); b2.position.set(0.05, 1.2, 0.24); b2.rotation.z = 0.3; b2.castShadow = true; body.add(b2); g.userData.bag = b2; }
    if (o.stripe) { const st = new T.Mesh(new T.BoxGeometry(0.4, 0.06, 0.34), M2(o.stripe, 0.4)); st.position.set(0, 1.32, 0); body.add(st); }
    const J = { arm: [], fore: [], thigh: [], shin: [] };
    for (const sd of [-1, 1]) { const a = new T.Group(); a.position.set(sd * 0.27, 1.5, 0); cap(a, 0.06, 0.24, tp, 0, -0.16, 0); const f = new T.Group(); f.position.set(0, -0.32, 0); cap(f, 0.052, 0.22, o.sleeve ? tp : sk, 0, -0.14, 0); const hand = new T.Mesh(new T.SphereGeometry(0.06, 8, 6), sk); hand.position.set(0, -0.3, 0); f.add(hand); a.add(f); body.add(a);
      const th = new T.Group(); th.position.set(sd * 0.11, 0.92, 0); cap(th, 0.085, 0.3, lg, 0, -0.2, 0); const sn = new T.Group(); sn.position.set(0, -0.42, 0); cap(sn, 0.068, 0.3, lg, 0, -0.2, 0); const shoe = new T.Mesh(new T.BoxGeometry(0.11, 0.09, 0.27), sh); shoe.position.set(0, -0.42, -0.06); shoe.castShadow = true; sn.add(shoe); th.add(sn); body.add(th);
      J.arm.push(a); J.fore.push(f); J.thigh.push(th); J.shin.push(sn); }
    g.userData.J = J; g.userData.body = body; g.rotation.order = 'YXZ'; return g; };
  // a run you can read: thighs swing, knees fold as the leg comes through, arms pump the other way with bent elbows, the body leans and bounces
  const runPose = (m, ph, amt = 1) => { const J = m.userData.J, b = m.userData.body; for (let i = 0; i < 2; i++) { const p = ph + i * Math.PI, sw = Math.sin(p); J.thigh[i].rotation.x = (sw * 0.95 + 0.12) * amt; J.shin[i].rotation.x = -(0.25 + 1.25 * Math.max(0, Math.cos(p + 0.5))) * amt; J.arm[i].rotation.x = -sw * 0.95 * amt; J.arm[i].rotation.z = (i ? -1 : 1) * 0.08; J.fore[i].rotation.x = (1.25 + sw * 0.25) * amt; }
    b.rotation.x = -0.24 * amt; b.position.y = Math.abs(Math.sin(ph)) * 0.09 * amt; b.rotation.y = Math.sin(ph) * 0.12 * amt; if (m.userData.bag) m.userData.bag.rotation.x = Math.sin(ph * 2) * 0.25; };
  const you = person(0xc8322a, 0x26303a, { sleeve: true, bag: 0x3f6a3a }); you.visible = false; S.add(you); const footCop = person(0x1c2a44, 0x10141c, { cap: 0x1c2a44, shoe: 0x101010, stripe: 0xd8e04a, sleeve: true }); footCop.visible = false; S.add(footCop);
  const alleyFill = new T.HemisphereLight(0xdfe8ff, 0x5a5048, 0); S.add(alleyFill);
  V3 = { T, S, you, footCop, runPose, alleyFill, wallI, floorI, arrowI, doors: doorsI, alleyF: null, road, slabs, dash, D, blds, poleI, headI, lamps, ring, guideI, cell: null, camH: 0, me, flame, cops, traffic, redL, blueL, head, thingPool, mkThing, heli, heliL, alley, alleyLamps, obsPool, crateM, metal, coinI, door, camPos: new T.Vector3(), look: new T.Vector3(), sky: null, bk: -1, lk: -1 };
  W3.scene.traverse(o => { if (o.isInstancedMesh) o.frustumCulled = false; });      /* 23 Nov 2026: copies that are re-placed as you go must never be culled by where they first were (Police Chase's vanishing skyscrapers; tools/stale_bounds.py) */
  W3.setQuality(stepN); return V3;
}
// the alley for this run on foot: corridors of 6 m modules between the corners, a wall across the far side of each corner with a yellow
// arrow board on it, the way round left open; the last corridor ends at the safehouse door. Laid once for each run (F), from its turns.
const NOFOOT = { s: 0, x: 0, gap: 9, air: 0, low: 0, stumble: 0, obs: [], coins: [], turns: [], len: 300 };
function layAlley(V, F) {
  if (V.alleyF === F) return; V.alleyF = F; const D = V.D, T = V.T, DC = [0x2f7a8a, 0xb8482e, 0xd8b23a, 0x3f7a4a, 0x6a4a8a, 0xc8c2b4], col = new T.Color(); let nw = 0, nf = 0, nd = 0, na = 0;
  const at = (px, py, h, lat, fwd) => [px + Math.cos(h) * lat + Math.sin(h) * fwd, -(py - Math.sin(h) * lat + Math.cos(h) * fwd)];
  const put = (I, n, x, y, z, ry, sx = 1, sy = 1, sz = 1) => { if (n >= I.count0) return; D.position.set(x, y, z); D.rotation.set(0, ry, 0); D.scale.set(sx, sy, sz); D.updateMatrix(); I.setMatrixAt(n, D.matrix); };
  for (const I of [V.wallI, V.floorI, V.arrowI, V.doors]) I.count0 = I.count0 || I.count;
  const wall = (px, py, h, lat, fwd, len, across) => { const [x, z] = at(px, py, h, lat, fwd); put(V.wallI, nw++, x, 4.5, z, -h + (across ? Math.PI / 2 : 0), 1, 1, len / 6); };
  const floor = (px, py, h, fwd, len) => { const [x, z] = at(px, py, h, 0, fwd); put(V.floorI, nf++, x, 0, z, -h, 1, 1, len / 6); };
  const corridor = (px, py, h, a, b) => { for (let f = a; f < b - 0.01; f += 6) { floor(px, py, h, f + 3, 6); for (const sd of [-1, 1]) { wall(px, py, h, sd * 2.6, f + 3, 6);
      const q = Math.abs(Math.round(px * 3 + py * 7 + f * 1.3 + sd * 5)); if (q % 2 === 0 && nd < V.doors.count0) { const hi = q % 3 === 0, [x, z] = at(px, py, h, sd * 2.38, f + 3); put(V.doors, nd, x, hi ? 1.9 : 1.15, z, -h, 1, hi ? 0.55 : 1, hi ? 1.5 : 1); V.doors.setColorAt(nd, col.set(DC[q % 6])); nd++; } } } };
  let px = 0, py = 0, h = 0, from = -FOOT_BACK, prev = 0; wall(0, 0, 0, 0, -FOOT_BACK - 0.2, 5.6, true);
  for (const t of F.turns) { corridor(px, py, h, from, t.s - prev - 2.6); px = t.px; py = t.py; floor(px, py, h, 0, 5.2); wall(px, py, h, 0, 2.8, 5.6, true); wall(px, py, h, -t.dir * 2.6, 0, 5.2);
    const [x, z] = at(px, py, h, 0, 2.58); put(V.arrowI, na++, x, 2.3, z, -h, t.dir, 1, 1); h += t.dir * Math.PI / 2; from = 2.6; prev = t.s; }
  corridor(px, py, h, from, from + Math.ceil((F.len - prev + 8 - from) / 6) * 6);      // on to the safehouse door, which closes the alley
  V.wallI.count = Math.min(nw, V.wallI.count0); V.floorI.count = Math.min(nf, V.floorI.count0); V.arrowI.count = Math.min(na, V.arrowI.count0); V.doors.count = nd;
  for (const I of [V.wallI, V.floorI, V.arrowI, V.doors]) I.instanceMatrix.needsUpdate = true; if (V.doors.instanceColor) V.doors.instanceColor.needsUpdate = true;
}
function setWeather(G) {
  const V = buildWorld(); if (V.none || V.sky === G.weather) return; V.sky = G.weather;
  W3.setSky(G.weather, { azim: 200, wind: [0.5, 0.2] }); const dark = W3.S.night || G.weather === 'dusk' || G.weather === 'storm' || G.weather === 'rain';
  V.blds.material.emissiveIntensity = dark ? 1.4 : 0.15; V.lamps.forEach(l => l.intensity = dark ? 40 : 0); V.headI.material.emissiveIntensity = dark ? 3 : 0.3;
  V.road.material.roughness = W3.S.rain ? 0.12 : 0.55; V.road.material.color.set(W3.S.rain ? 0x1e2024 : 0x2b2d31); V.head.intensity = dark ? 80 : 0;
  W3.S.onBolt = () => { if (!HEADLESS && sfx.thunder) setTimeout(() => sfx.thunder(), 300 + Math.random() * 900); };
}
const ui = { snap: false };
function onEvent(G, e) {
  const cx = W / 2, cy = H * 0.3;
  switch (e.k) {
    case 'lane': sfx.swish(); break;
    case 'nitro': sfx.nitro(); FX.shake = 6; vibe(HAP.light); say('NITRO!', cx, cy, '#8fd8ff', 30); break;
    case 'empty': sfx.no(); say('NO NITRO LEFT', cx, cy, '#ffd0c4', 20); break;
    case 'can': sfx.can(); say('+1 NITRO', cx, cy + 30 * k, '#8fd8ff', 20); break;
    case 'cash': sfx.cash(G.combo); break;
    case 'coin': sfx.coin2(); break;
    case 'weave': sfx.combo(e.n / 5); say(`${e.n} CARS CLEAN`, cx, cy + 34 * k, '#ffe08a', 18); break;
    case 'siren': sfx.siren(); if (G.cops.length === 1) say('COPS ON YOUR TAIL', cx, cy, '#9ab8ff', 22); break;
    case 'flash': sfx.alert(); vibe(HAP.sharp); tip('ram', 'A cop is flashing to ram you: steer away from him!', 2.8); break;
    case 'kerb': sfx.swish(); FX.shake = 3; break;
    case 'drive': ui.snap = true; break;
    case 'node': vibe(HAP.tick); break;
    case 'ram': FX.shake = 6; break;
    case 'dodged': sfx.whoosh(); say('DODGED!', cx, cy, '#9be3b5', 26); break;
    case 'hit': sfx.crash(); FX.shake = 16; FX.red = 0.6; FX.stop = 0.08; vibe(HAP.thud); say({ car: 'CRASH!', ram: 'RAMMED!', spike: 'SPIKES!', block: 'ROADBLOCK!', wall: 'INTO THE WALL!' }[e.what] || 'CRASH!', cx, cy, '#ffb4a8', 32); if (e.what === 'block') tip('block', 'Roadblocks leave one gap: slow down and steer through the green arrow', 3); if (e.what === 'wall') tip('hitwall', 'BRAKE before the corner, then turn', 2.8); if (e.what === 'car') tip('hitcar', 'Steer round the traffic: look further ahead', 2.8); break;
    case 'block': sfx.alert(); say('ROADBLOCK AHEAD!', cx, cy, '#ffb46a', 24); break;
    case 'through': sfx.through(); FX.flash = 0.3; say('THROUGH THE GAP!', cx, cy, '#ffe08a', 28); vibe(HAP.light); break;
    case 'heli': sfx.heli(); say('HELICOPTER!', cx, cy, '#ffd0c4', 26); tip('heli', 'Stay out of the searchlight: it raises the heat', 2.8); break;
    case 'spotted': sfx.alert(); break;
    case 'ditch': sfx.door(); FX.flash = 0.4; say('DITCH THE CAR!', cx, cy, '#ffe08a', 30); break;
    case 'foot': ui.snap = true; break;
    case 'jump': sfx.jump(); break; case 'slide': sfx.slide(); break;
    case 'cleared': sfx.step(); break;
    case 'turnset': sfx.turn(); break;
    case 'cornered': vibe(HAP.light); break;
    case 'wall': sfx.thump(); FX.shake = 10; FX.red = 0.35; vibe(HAP.thud); say(e.why === 'late' ? 'MISSED THE TURN!' : `WRONG WAY! IT TURNS ${e.dir < 0 ? 'LEFT' : 'RIGHT'}`, cx, cy, '#ffb4a8', 24); tip('wall', 'At a corner, swipe the way the yellow arrow points', 2.8); break;
    case 'stumble': sfx.thump(); FX.shake = 9; FX.red = 0.35; say({ crate: 'INTO THE CRATES!', fence: 'HIT THE FENCE!', pipe: 'HEAD ON THE PIPE!' }[e.type], cx, cy, '#ffb4a8', 24); tip('stumble_' + e.type, { crate: 'Swipe left or right round crates', fence: 'Swipe UP to jump a fence', pipe: 'Swipe DOWN to slide under a pipe' }[e.type], 2.6); break;
    case 'home': sfx.safe(); FX.flash = 0.7; vibe(HAP.best); say('SAFEHOUSE!', cx, cy, '#9be3b5', 34); break;
    case 'lessonnext': if (e.first) hint = null; say(e.first ? 'FIRST, A LESSON' : 'NEXT LESSON', cx, H * 0.5, '#ffd36a', 26); sfx.ding(); ui.snap = true; break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, cx, H * 0.5, '#9be3b5', 26); sfx.coin(e.n); break;
    case 'lessonmiss': coachMiss(); break;
    case 'lessondone': say('NOW GET AWAY!', cx, H * 0.5, '#ffd36a', 28); sfx.win(); ui.snap = true; if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); vibe(HAP.best); break;
    case 'lost': sfx.lose(); say({ wrecked: 'CAR WRECKED: BUSTED', caught: 'CAUGHT!', boxed: 'BOXED IN: BUSTED' }[e.why] || 'BUSTED', cx, H * 0.5, '#ffd0c4', 28); if (e.why === 'boxed') tip('boxed', 'Never stop with a police car on your bumper: keep moving', 3); break;
  }
}
function carPose(m, x, s, h = 0, roll = 0) { m.position.set(x, 0, -s); m.rotation.set(0, -h, roll); }
function pedals() { const w = 86 * k, h = 118 * k; return { gas: { x: W - w - 12, y: H - h - 22 * k, w, h }, brake: { x: W - 2 * w - 24, y: H - h * 0.8 - 22 * k, w, h: h * 0.8 } }; }
function nitroBtn() { const Pd = pedals(), h = 54 * k; return { x: Pd.gas.x, y: Pd.gas.y - h - 12 * k, w: Pd.gas.w, h }; }
function toScreen(x, y, z) { const v = new THREE.Vector3(x, y, z).project(W3.cam); return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H, front: v.z < 1 }; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#0b1418'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D city.', W / 2, H / 2); return; }
  const T = V.T, cam = W3.cam, g = G || idleG(), t = now; setWeather(g);
  const onFoot = g.ph === 'foot' || g.ph === 'home', me = g.me, D = V.D;
  V.alley.visible = onFoot; V.alleyFill.intensity = onFoot ? 1.2 : 0; if (!onFoot) V.you.visible = V.footCop.visible = false; if (!onFoot) ui.turn = 0; for (const m of [V.road, V.slabs, V.dash, V.blds, V.poleI, V.headI, V.me, V.ring, V.guideI]) m.visible = !onFoot; V.traffic.forEach(c => c.visible = false); V.cops.forEach(c => c.visible = false); V.thingPool.forEach(c => c.visible = false); V.heli.visible = false; V.heliL.intensity = 0;
  const flash = Math.sin(t * 14) > 0;
  if (!onFoot) {
    // the city is laid out round the block you are in, and laid out again when you move to the next one
    const ci = Math.floor(me.x / P), cj = Math.floor(me.s / P), key = ci + ':' + cj; V.road.position.set(ci * P, 0, -cj * P);
    if (V.cell !== key) { V.cell = key; let n = 0, b = 0, d = 0, q = 0; const put = (mesh, i, x, y, z, sx, sy, sz) => { D.position.set(x, y, z); D.rotation.set(0, 0, 0); D.scale.set(sx, sy, sz); D.updateMatrix(); mesh.setMatrixAt(i, D.matrix); };
      for (let i = ci - 3; i <= ci + 3; i++) for (let j = cj - 3; j <= cj + 3; j++) { const bx = (i + 0.5) * P, bs = (j + 0.5) * P, BS = P - 2 * RW; put(V.slabs, n++, bx, 0.11, -bs, 1, 1, 1);
        for (let u = 0; u < 4; u++) { const hh = hash(i * 31.7 + j * 57.3 + u * 7.1), w = BS / 2 - 7 - hash(i * 3.1 + j + u) * 5, dp = BS / 2 - 7 - hash(i + j * 5.3 + u * 2) * 5, h = 9 + hh * hh * 62, ox = (u % 2 ? 1 : -1) * (BS / 4 - 0.5), os = (u > 1 ? 1 : -1) * (BS / 4 - 0.5); put(V.blds, b++, bx + ox, h / 2, -(bs + os), w, h, dp); } }
      for (let i = ci - 2; i <= ci + 3; i++) for (let j = cj - 2; j <= cj + 3; j++) for (const [ox, os] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { if (q >= 144) break; const x = i * P + ox * (RW + 1.2), z = -(j * P + os * (RW + 1.2)); put(V.poleI, q, x, 3.25, z, 1, 1, 1); put(V.headI, q, x - ox * 0.9, 6.5, z + os * 0.9, 1, 1, 1); q++; }
      for (let i = ci - 2; i <= ci + 3; i++) for (let v = (cj - 2) * P; v < (cj + 3) * P && d < 640; v += 8) { if (Math.abs(v - nearLine(v)) < RW + 1) continue; put(V.dash, d++, i * P, 0.013, -v, 1, 1, 1); }
      for (let j = cj - 2; j <= cj + 3; j++) for (let v = (ci - 2) * P; v < (ci + 3) * P && d < 640; v += 8) { if (Math.abs(v - nearLine(v)) < RW + 1) continue; D.position.set(v, 0.013, -j * P); D.rotation.set(0, Math.PI / 2, 0); D.scale.set(1, 1, 1); D.updateMatrix(); V.dash.setMatrixAt(d++, D.matrix); }
      V.dash.count = d; V.poleI.count = V.headI.count = q; for (const m of [V.slabs, V.blds, V.dash, V.poleI, V.headI]) m.instanceMatrix.needsUpdate = true; }
    const jx = nearLine(me.x + Math.sin(me.h) * 30), js = nearLine(me.s + Math.cos(me.h) * 30); V.lamps.forEach((l, q) => l.position.set(jx + (q % 2 ? 1 : -1) * (RW + 0.3), 6.2, -(js + (q > 1 ? 1 : -1) * (RW + 0.3))));
    // your car, its lights, the nitro flame
    carPose(V.me, me.x, me.s, me.h, -(me.w || 0) * Math.min(1, Math.abs(me.v) / 20) * 0.05); V.flame.visible = g.boost > 0; V.flame.scale.set(1, 0.7 + Math.random() * 0.6, 1);
    const fx = Math.sin(me.h), fs = Math.cos(me.h); V.head.position.set(me.x + fx * 2.2, 0.9, -(me.s + fs * 2.2)); V.head.target.position.set(me.x + fx * 26, 0, -(me.s + fs * 26));
    // out of the car (his words on Taxi Driver, 23 Nov 2026: "you don't animate the person entering the car, nor do you animate them leaving the car"; the same was true here, where
    // DITCH THE CAR simply cut to the alley): you are out of the driver's door and running before the picture changes
    const getOut = (m, x, s, h, side, u, ph) => { if (u <= 0) { m.visible = false; return; } const a = clamp(u / 0.3, 0, 1), d = Math.max(0, u - 0.3) * 7, th = h + side * 0.85, rx = Math.cos(h) * side, rs = -Math.sin(h) * side; m.visible = true; m.scale.setScalar(0.65 + 0.35 * a);
      m.position.set(x + rx * 1.25 + Math.sin(th) * d, 0.3 * (1 - a), -(s + rs * 1.25 + Math.cos(th) * d)); m.rotation.set(0, -th, 0); V.runPose(m, t * 12.5 + ph, a); };
    if (g.ph === 'ditch') getOut(V.you, me.x, me.s, me.h, -1, g.ph_t - 0.15, 0);
    let q = 0; for (const c2 of g.traffic) { if (q >= V.traffic.length) break; const m = V.traffic[q++]; m.visible = true; carPose(m, c2.x, c2.s, DIRH[c2.dir] + (c2.hit > 0 ? c2.hit * 1.5 : 0)); }
    // the cops, light bars going; the one about to ram is beside you with its lights brighter
    let nearest = null, nd = 1e9; g.cops.forEach((cp, i) => { if (i >= V.cops.length) return; const m = V.cops[i]; m.visible = true; carPose(m, cp.x, cp.s, cp.h + (cp.ram > 0 ? Math.sin(cp.ram * 9) * 0.06 : 0)); const bar = m.userData.bar; bar.children[0].material.emissiveIntensity = flash ? 5 : 0.2; bar.children[1].material.emissiveIntensity = flash ? 0.2 : 5; const d2 = Math.hypot(cp.x - me.x, cp.s - me.s); if (d2 < nd) { nd = d2; nearest = cp; } });
    if (nearest) { V.redL.position.set(nearest.x, 2.2, -nearest.s); V.blueL.position.set(nearest.x, 2.2, -nearest.s); V.redL.intensity = flash ? 45 : 0; V.blueL.intensity = flash ? 0 : 45; } else V.redL.intensity = V.blueL.intensity = 0;
    // cash bags, cans, spikes, roadblocks near you
    let n = 0; const put = (k2, x, s, ry, sx = 1) => { if (n >= V.thingPool.length) return; const m = V.thingPool[n++]; if (m.userData.k !== k2) V.mkThing(m, k2); m.visible = true; m.position.set(x, 0, -s); m.rotation.y = ry; m.scale.set(sx, 1, 1); };
    for (const th of g.things) if (!th.done && Math.abs(th.x - me.x) < 190 && Math.abs(th.s - me.s) < 190) put(th.k, th.x, th.s, th.k === 'spike' ? -DIRH[g.route[th.seg].dir] : t * 2);
    for (const b of g.blocks) if (Math.abs(b.x - me.x) < 240 && Math.abs(b.s - me.s) < 240) for (let l = 0; l < 4; l++) if (l !== b.gap) { const [bx, bs] = segPt(g, b.seg, b.along, LANES[l]); put('block', bx, bs, -DIRH[b.dir], 0.9); }
    // the helicopter over your street, its light sweeping across it
    if (g.heli) { const h = g.heli; V.heli.visible = true; V.heli.position.set(h.x - fx * 10, 24, -(h.s - fs * 10)); V.heli.userData.rot.rotation.y = t * 30; V.heli.rotation.set(0.2, -me.h, Math.sin(t) * 0.05); V.heli.userData.cone.rotation.x = -0.4; V.heli.userData.cone.position.set(0, -11, -5);
      V.heliL.intensity = 400; V.heliL.position.set(h.x - fx * 10, 24, -(h.s - fs * 10)); V.heliL.target.position.set(h.x, 0, -h.s); }
    // the way: chevrons along the route from just ahead of you, round the next corners; a ring round the junction you are heading for
    { const rt = g.route, k0 = Math.min(g.ri, rt.length - 1), q0 = segRel(g, k0, me.x, me.s); let gi = 0, len = 0;
      for (let k2 = k0; k2 < rt.length && len < 200 && gi < 40; k2++) { const a0 = k2 === k0 ? Math.max(3, Math.ceil((q0.along + 7) / 7) * 7) : 3, slide = (t * 7) % 7; for (let a = a0 + slide; a < P - 2 && gi < 40 && len < 200; a += 7) { const [gx, gs] = segPt(g, k2, a, LANE); D.position.set(gx, 0.04, -gs); D.rotation.set(0, -DIRH[rt[k2].dir], 0); D.scale.setScalar(1); D.updateMatrix(); V.guideI.setMatrixAt(gi++, D.matrix); len += 7; } }
      V.guideI.count = g.ph === 'drive' ? gi : 0; V.guideI.instanceMatrix.needsUpdate = true;
      const [qx, qs] = nodeAt(g, k0), lastOne = !g.endless && k0 === rt.length - 1, nxt = rt[k0 + 1]; V.ring.position.set(qx, 0.05, -qs); V.ring.scale.setScalar((lastOne ? 1.25 : 1) + Math.sin(t * 6) * 0.08); V.ring.visible = g.ph === 'drive';
      if (g.ph === 'drive') ui.mark = { p: toScreen(qx, 3.2, -qs), d: Math.hypot(qx - me.x, qs - me.s), turn: lastOne || !nxt ? 0 : (nxt.dir - rt[k0].dir + 4) % 4, last: lastOne, h: Math.atan2(qx - me.x, qs - me.s) - V.camH }; }
    // camera: above and behind the car, coming round after it through the corners
    V.camH = ui.snap ? me.h : V.camH + wrapPi(me.h - V.camH) * Math.min(1, dt * 3.2); const cx2 = Math.sin(V.camH), cs2 = Math.cos(V.camH), port = innerWidth <= innerHeight, back = port ? 13 : 11, up = port ? 10 : 7.5;
    const want = new T.Vector3(me.x - cx2 * back, up + Math.abs(me.v) * 0.05, -(me.s - cs2 * back)), look = new T.Vector3(me.x + cx2 * 9, 0.8, -(me.s + cs2 * 9));
    if (ui.snap) { V.camPos.copy(want); V.look.copy(look); } else { V.camPos.lerp(want, Math.min(1, dt * 7)); V.look.lerp(look, Math.min(1, dt * 7)); } ui.snap = false;
    cam.position.copy(V.camPos); cam.fov = (port ? 66 : 56) + Math.max(0, me.v - 22) * 0.3 + (g.boost > 0 ? 5 : 0); if (cam.near !== 3) cam.near = 3; cam.updateProjectionMatrix(); cam.lookAt(V.look);
    W3.setFocus(me.x, 0, -me.s, 22);
  } else {
    const F = g.foot || NOFOOT, s = F.s, ph = t * 11; layAlley(V, F); V.you.scale.setScalar(1);
    const at = (s2, lat = 0) => { const p = footAt(F, s2); return { x: p.x + Math.cos(p.h) * lat, z: -(p.y - Math.sin(p.h) * lat), h: p.h }; };
    V.alley.position.z = 0;
    V.alleyLamps.forEach((l, q) => { const p = at(Math.floor(s / 20) * 20 + q * 20 + 6, q % 2 ? 1.8 : -1.8); l.intensity = 55; l.distance = 24; l.position.set(p.x, 3.5, p.z); });
    let n = 0; for (const o of F.obs) { if (o.s < s - 3 || o.s > s + 70 || n >= V.obsPool.length) continue; const gO = V.obsPool[n++]; gO.visible = true; if (gO.userData.type !== o.type + o.lane + o.two) { gO.clear(); gO.userData.type = o.type + o.lane + o.two;
        if (o.type === 'crate') for (const ln of [o.lane, o.two]) { if (ln < 0) continue; const b = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 1.0), V.crateM); b.position.set(ALLEY[ln], 0.5, 0); b.castShadow = true; gO.add(b); const b2 = b.clone(); b2.scale.setScalar(0.7); b2.position.y = 1.35; b2.rotation.y = 0.4; gO.add(b2); }
        if (o.type === 'fence') { for (let x = -2.4; x <= 2.4; x += 0.3) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.0, 0.04), V.crateM); p.position.set(x, 0.5, 0); gO.add(p); } const r = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.1, 0.06), V.crateM); r.position.set(0, 0.75, 0); gO.add(r); }
        if (o.type === 'pipe') { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 5, 12), V.metal); p.rotation.z = Math.PI / 2; p.position.set(0, 1.25, 0); p.castShadow = true; gO.add(p); } }
      const p = at(o.s); gO.position.set(p.x, 0, p.z); gO.rotation.y = -p.h; }
    for (let q = n; q < V.obsPool.length; q++) V.obsPool[q].visible = false;
    let ci = 0; for (const c2 of F.coins) { if (c2.done || c2.s < s - 2 || c2.s > s + 60 || ci >= 60) continue; const p = at(c2.s, ALLEY[c2.lane]); D.position.set(p.x, 0.9, p.z); D.rotation.set(Math.PI / 2, 0, t * 3 + c2.s); D.scale.setScalar(1); D.updateMatrix(); V.coinI.setMatrixAt(ci++, D.matrix); } V.coinI.count = ci; V.coinI.instanceMatrix.needsUpdate = true;
    { const p = at(g.foot ? F.len + 2 : 9999); V.door.position.set(p.x, 0, p.z); V.door.rotation.y = -p.h; }
    const running = g.ph === 'foot' && g.foot; V.you.visible = V.footCop.visible = !!running;
    if (running) { const Y = V.you, jump = F.air > 0 ? Math.sin(F.air / 0.75 * Math.PI) * 1.0 : 0, low = F.low > 0, st = (F.stumble || 0) > 0, rp = t * 12.5, py = at(s, F.x), pc = at(s - Math.max(1.2, F.gap), F.x * 0.6); Y.position.set(py.x, low ? 0.25 : jump, py.z); V.runPose(Y, rp, st ? 0.5 : 1); Y.rotation.set(low ? 1.15 : 0, -py.h, st ? Math.sin(t * 30) * 0.15 : 0);
      if (jump > 0.1) { const J = Y.userData.J; J.thigh[0].rotation.x = 1.3; J.shin[0].rotation.x = -1.5; J.thigh[1].rotation.x = 0.6; J.shin[1].rotation.x = -1.2; }
      V.footCop.position.set(pc.x, 0, pc.z); V.footCop.rotation.set(0, -pc.h, 0); V.runPose(V.footCop, rp + 2);
      const nt = F.turns.find(q => !q.past); ui.turn = nt && nt.got === null && nt.s - s <= FOOT_WIN ? nt.dir : 0; } else ui.turn = 0;
    // the camera follows the alley round its corners, and looks just past you: never at a point hidden round the corner
    const cp = at(s - 5.4, F.x * 0.55), lp = at(s + 3, F.x * 0.5), hp = at(s, F.x), ap = at(s + 14, F.x * 0.5);
    const want = running ? new T.Vector3(cp.x, 3.3, cp.z) : new T.Vector3(hp.x, 1.7, hp.z), look = running ? new T.Vector3(lp.x, 1.85, lp.z) : new T.Vector3(ap.x, 1.4, ap.z);
    if (ui.snap) { V.camPos.copy(want); V.look.copy(look); } else { V.camPos.lerp(want, Math.min(1, dt * 12)); V.look.lerp(look, Math.min(1, dt * 8)); } ui.snap = false;
    cam.position.copy(V.camPos); cam.fov = innerWidth > innerHeight ? 56 : 66; if (cam.near !== 0.3) cam.near = 0.3; cam.updateProjectionMatrix(); cam.lookAt(V.look);
    W3.setFocus(V.camPos.x, 0, V.camPos.z - 5, 10);
  }
  if (FX.shake > 0) { cam.rotation.x += (Math.random() - 0.5) * FX.shake * 0.002; cam.rotation.y += (Math.random() - 0.5) * FX.shake * 0.002; }
  W3.render(dt);
  if (G) hud(G, t);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 0.9 ? 1 : 1 - (t2.t - 0.9) / 0.4; ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(t2.size * k)}px ${BC}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 26 * k); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 26 * k); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(16 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 20 * k, h = lines.length * lh + 16 * k, w = Math.min(W - 24, Math.max(...lines.map(l => ctx.measureText(l).width)) + 34);
    ctx.fillStyle = 'rgba(0,0,0,.6)'; rrect(W / 2 - w / 2, H * 0.62 - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.62 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (!onFoot && g.cops.some(cp => me.s - cp.s < 30)) { ctx.globalAlpha = 0.06; ctx.fillStyle = flash ? '#ff2020' : '#2050ff'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  if (g.heli && g.heli.on && !onFoot) { ctx.fillStyle = 'rgba(255,250,220,.12)'; ctx.fillRect(0, 0, W, H); }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,40,30,${FX.red * 0.22})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,248,230,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); }
}
let IG = null; function idleG() { if (!IG || IG.over || IG.ph !== 'drive') { IG = newGame(Math.max(4, store.get('level', 1) | 0), { seed: (Math.random() * 1e6) | 0 }); IG.mem = {}; IG.hp = 99; } honest(IG, { react: 0.2, acc: 0.98 }, IG.mem); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function weatherName(w) { return { dawn: 'DAWN', morning: 'MORNING', golden: 'GOLDEN HOUR', overcast: 'GREY SKY', mist: 'FOG', sunset: 'SUNSET', noon: 'MIDDAY', dusk: 'DUSK', rain: 'RAIN', storm: 'STORM', night: 'NIGHT' }[w] || ''; }
function hud(G, t) {
  const c = G.cfg, x = 14, y = 44 * k, me = G.me;
  if (G.lesson) lessonPanel(G);
  else { ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.5)';
    const stp = G.ph === 'drive' ? 0 : G.ph === 'ditch' || G.ph === 'foot' ? 1 : 2; ['GETAWAY', 'ON FOOT', 'SAFEHOUSE'].forEach((s, i) => { ctx.globalAlpha = i === stp ? 1 : 0.4; ctx.fillStyle = '#fff'; ctx.strokeText(s, x + i * 74 * k, y); ctx.fillText(s, x + i * 74 * k, y); }); ctx.globalAlpha = 1;
    // heat stars
    for (let i = 0; i < 5; i++) { ctx.font = `700 ${Math.round(15 * k)}px ${BC}`; ctx.textAlign = 'right'; ctx.fillStyle = i < G.heat ? '#ffd36a' : 'rgba(255,255,255,.22)'; ctx.fillText('★', W - x - i * 15 * k, y); }
    // progress to the drop or the door
    const kk = Math.min(G.ri, G.route.length - 1), prog = G.ph === 'drive' ? (G.endless ? 0 : (G.ri + clamp(segRel(G, kk, me.x, me.s).along / P, 0, 1) * (G.ri < G.route.length ? 1 : 0)) / G.route.length) : G.foot ? G.foot.s / G.foot.len : 1; ctx.fillStyle = 'rgba(0,0,0,.4)'; rrect(x, y + 14 * k, W - 2 * x, 6 * k, 3); ctx.fill(); ctx.fillStyle = '#9be3b5'; rrect(x, y + 14 * k, Math.max(6, (W - 2 * x) * clamp(prog, 0, 1)), 6 * k, 3); ctx.fill();
    // cash, car, nitro
    ctx.textAlign = 'left'; ctx.font = `800 ${Math.round(20 * k)}px ${BC}`; ctx.fillStyle = '#9bff9b'; ctx.strokeText(`$${G.cash}`, x, y + 38 * k); ctx.fillText(`$${G.cash}`, x, y + 38 * k);
    if (G.ph === 'drive') { ctx.textAlign = 'right'; ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; for (let i = 0; i < c.hp; i++) { ctx.fillStyle = i < G.hp ? '#ff6a5a' : 'rgba(255,255,255,.22)'; ctx.fillText('■', W - x - i * 14 * k, y + 34 * k); }
    }
    // which way to swipe at the corner (the first cases and the lessons; the arrow board on the wall is always there)
    if (G.ph === 'foot' && ui.turn && (G.N <= 4 || G.lesson)) { const d = ui.turn, x = W / 2 + d * W * 0.27, y = H * 0.46, sl = (performance.now() / 500) % 1; ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.globalAlpha = 0.92; ctx.fillStyle = '#ffd23a'; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 4;
      for (let i = 0; i < 3; i++) { const xx = x + d * (i * 20 + sl * 14) * k; ctx.beginPath(); ctx.moveTo(xx + d * 16 * k, y); ctx.lineTo(xx - d * 4 * k, y - 22 * k); ctx.lineTo(xx - d * 4 * k, y + 22 * k); ctx.closePath(); ctx.stroke(); ctx.fill(); }
      ctx.font = `700 ${Math.round(17 * k)}px ${BC}`; ctx.strokeText('SWIPE', x + d * 22 * k, y + 42 * k); ctx.fillStyle = '#fff'; ctx.fillText('SWIPE', x + d * 22 * k, y + 42 * k); ctx.restore(); }
    if (G.ph === 'foot' && G.foot) { const gp = G.foot.gap, u = clamp(gp / 25, 0, 1); ctx.textAlign = 'center'; ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = gp < 6 ? '#ff6b5a' : '#fff'; const s = `COPS ${gp.toFixed(0)} m BEHIND`; ctx.strokeText(s, W / 2, H - 40 * k); ctx.fillText(s, W / 2, H - 40 * k);
      ctx.fillStyle = 'rgba(0,0,0,.4)'; rrect(W * 0.2, H - 28 * k, W * 0.6, 6 * k, 3); ctx.fill(); ctx.fillStyle = gp < 6 ? '#ff6b5a' : '#5aa2ff'; rrect(W * 0.2, H - 28 * k, W * 0.6 * u, 6 * k, 3); ctx.fill(); } }
  if (G.ph !== 'drive') return;
  if (G.over) return; ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  // the way: a green marker on the junction to head for, saying which way it goes from there; at the screen's edge (with how far) when it is out of sight
  if (ui.mark) { const m = ui.mark, pad = 34 * k, top = (G.lesson ? 204 : 104) * k, on = m.p.front && m.p.x > pad && m.p.x < W - pad && m.p.y > top && m.p.y < H - 150 * k, bob = Math.sin(performance.now() / 140) * 4 * k, word = m.last ? 'THE DROP' : m.turn === 1 ? 'TURN RIGHT' : m.turn === 3 ? 'TURN LEFT' : 'STRAIGHT ON';
    const arrow = (x, y, a, sz) => { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = '#39f07a'; ctx.strokeStyle = '#06301a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sz, 0); ctx.lineTo(0, -sz * 0.75); ctx.lineTo(0, -sz * 0.3); ctx.lineTo(-sz, -sz * 0.3); ctx.lineTo(-sz, sz * 0.3); ctx.lineTo(0, sz * 0.3); ctx.lineTo(0, sz * 0.75); ctx.closePath(); ctx.stroke(); ctx.fill(); ctx.restore(); };
    const label = (txt, x, y, sz = 13) => { ctx.font = `700 ${Math.round(sz * k)}px ${BC}`; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.75)'; ctx.strokeText(txt, x, y); ctx.fillStyle = '#fff'; ctx.fillText(txt, x, y); };
    if (on) { const x = m.p.x, y = m.p.y - 20 * k + bob; arrow(x, y, m.last ? Math.PI / 2 : m.turn === 1 ? 0 : m.turn === 3 ? Math.PI : -Math.PI / 2, 20 * k); label(`${word} · ${Math.round(m.d)} m`, clamp(x, 80 * k, W - 80 * k), y - 34 * k); }
    else { let dx = m.p.x - W / 2, dy = m.p.y - H * 0.45; if (!m.p.front) { dx = -dx; dy = Math.abs(dy) + H; } const a = Math.atan2(dy, dx), rx = W / 2 - pad, ry = H * 0.3, x = W / 2 + clamp(Math.cos(a) * rx * 1.4, -rx, rx), y = clamp(H * 0.45 + Math.sin(a) * ry * 1.4, top, H - 190 * k);
      arrow(x + Math.cos(a) * bob, y + Math.sin(a) * bob, a, 20 * k); label(`${Math.round(m.d)} m`, x - Math.cos(a) * 34 * k, y - Math.sin(a) * 34 * k); if (!m.p.front) label('TURN ROUND: THE WAY IS BEHIND YOU', W / 2, H * 0.36, 15); } }
  // a cop about to ram: a warning on him, and which way is away
  for (const cp of G.cops) if (cp.ram > 0) { const p = toScreen(cp.x, 2.4, -cp.s), A = cp.aim, hx = Math.sin(V3.camH || 0), hs = Math.cos(V3.camH || 0), same = A.d[0] * hx + A.d[1] * hs >= 0, away = (same ? -1 : 1) * cp.side, al = 0.6 + 0.4 * Math.sin(t * 20);
    ctx.globalAlpha = al; ctx.fillStyle = '#ff3a28'; ctx.font = `800 ${Math.round(30 * k)}px ${BC}`; if (p.front) ctx.fillText('⚠', clamp(p.x, 30 * k, W - 30 * k), clamp(p.y, 120 * k, H - 200 * k)); ctx.globalAlpha = 1;
    ctx.font = `800 ${Math.round(24 * k)}px ${BC}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.7)'; const s2 = away < 0 ? '◀◀ STEER AWAY' : 'STEER AWAY ▶▶'; ctx.strokeText(s2, W / 2, H * 0.4); ctx.fillStyle = '#ffd23a'; ctx.fillText(s2, W / 2, H * 0.4); }
  // a spike strip coming up on the way: marked, so it is seen in time
  for (const th of G.things) if (!th.done && th.k === 'spike' && th.seg >= G.ri && th.seg <= G.ri + 1) { const far = Math.hypot(th.x - me.x, th.s - me.s); if (far > 95) continue; const p = toScreen(th.x, 1.6, -th.s); if (!p.front) continue; const y = clamp(p.y, 120 * k, H - 200 * k);
    ctx.font = `800 ${Math.round(12 * k)}px ${BC}`; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.strokeText('SPIKES', p.x, y - 16 * k); ctx.fillStyle = '#ff6a5a'; ctx.fillText('SPIKES', p.x, y - 16 * k); ctx.font = `800 ${Math.round(20 * k)}px ${BC}`; ctx.strokeText('▼', p.x, y); ctx.fillText('▼', p.x, y); }
  // a roadblock he has seen: the gap, marked
  for (const b of G.blocks) if (b.seen && !b.done) { const [gx, gs] = segPt(G, b.seg, b.along, LANES[b.gap]), p = toScreen(gx, 2.6, -gs), far = Math.hypot(gx - me.x, gs - me.s); if (!p.front || far > c.blockSee + 30) continue; const y = clamp(p.y, 120 * k, H - 200 * k), bob = Math.sin(t * 8) * 4 * k;
    ctx.fillStyle = '#6bff8b'; ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.lineWidth = 4; ctx.font = `800 ${Math.round(30 * k)}px ${BC}`; ctx.strokeText('▼', p.x, y + bob); ctx.fillText('▼', p.x, y + bob); ctx.font = `800 ${Math.round(12 * k)}px ${BC}`; ctx.strokeText(`GAP ${Math.round(far)} m`, p.x, y - 24 * k); ctx.fillStyle = '#fff'; ctx.fillText(`GAP ${Math.round(far)} m`, p.x, y - 24 * k); break; }
  // the controls: a stick under the left thumb; GAS, BRAKE and NITRO under the right
  { const Pd = pedals(), I = G.in, st = ui.stick, sx0 = st ? st.x0 : 78 * k, sy0 = st ? st.y0 : H - 96 * k, R1 = 46 * k, nb = nitroBtn();
    ctx.globalAlpha = st ? 0.9 : 0.5; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(sx0, sy0, R1, 0, TAU); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(sx0 + I.sx * R1, sy0, 20 * k, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillText('◀  STEER  ▶', sx0, sy0 + R1 + 14 * k);
    for (const [key, lab, sub, col] of [['gas', 'GAS', '', '#3fbf6a'], ['brake', 'BRAKE', 'hold: reverse', '#e0483a']]) { const b = Pd[key], on = key === 'gas' ? I.gas : I.brake; ctx.globalAlpha = on ? 1 : 0.72; ctx.fillStyle = on ? col : 'rgba(16,20,28,.72)'; rrect(b.x, b.y, b.w, b.h, 16 * k); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 3; rrect(b.x, b.y, b.w, b.h, 16 * k); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(19 * k)}px ${BC}`; ctx.fillText(lab, b.x + b.w / 2, b.y + b.h / 2 - (sub ? 7 * k : 0)); if (sub) { ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.fillText(sub, b.x + b.w / 2, b.y + b.h / 2 + 13 * k); } }
    const has = G.nitro > 0, lit = G.boost > 0; ctx.globalAlpha = has || lit ? 0.95 : 0.45; ctx.fillStyle = lit ? '#2a8cff' : 'rgba(16,20,28,.72)'; rrect(nb.x, nb.y, nb.w, nb.h, 14 * k); ctx.fill(); ctx.strokeStyle = '#59b8ff'; ctx.lineWidth = 3; rrect(nb.x, nb.y, nb.w, nb.h, 14 * k); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(15 * k)}px ${BC}`; ctx.fillText('NITRO', nb.x + nb.w / 2, nb.y + nb.h / 2 - 8 * k); ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillStyle = '#8fd8ff'; ctx.fillText(has ? '●'.repeat(Math.min(6, G.nitro)) : 'none left', nb.x + nb.w / 2, nb.y + nb.h / 2 + 11 * k); ctx.globalAlpha = 1; }
  ctx.restore();
}
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { coachPanel(G); }
