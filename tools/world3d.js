// ===================== THE 3D WORLD (tools/world3d.js), shared by every 3D game =====================
// His rules (17 Nov 2026): every game is 3D, seen from where the player stands; weather and light change; as real-looking as it
// can be. This is the part every 3D game shares: the renderer, a real sky (sun, scattering, moving clouds, stars and a moon at
// night), the light that sky casts (sun, sky light, reflections), mist, rain, lightning, and the picture easing off a notch at a
// time on a phone that cannot keep up (LESSONS rule 12). Games build their own world into W3.scene and call W3.render() each
// frame. three.js is inlined by build.py (tools/three.min.js) as window.THREE.
const W3 = (() => {
  const T = window.THREE;
  if (!T) return null;
  const V = (x, y, z) => new T.Vector3(x, y, z);
  let R = null, scene, cam, sky, skyScene, sun, hemi, moon, stars, rain, pmrem, envRT = null, ok = false;
  const S = { elev: 30, azim: 180, cloud: 0.3, rain: 0, mist: 0.15, storm: 0, wind: [1, 0.3], t: 0, flash: 0, nextBolt: 6, night: 0, exposure: 0.55, onBolt: null };
  const focus = { p: V(0, 0, 0), r: 40 };
  // the weathers a level can have (games pick one per level from their own list, seeded). elev/azim: the sun, in degrees.
  const PRESETS = {
    dawn:     { elev: 2.5, cloud: 0.35, turb: 5, ray: 2.6, mie: 0.006, mist: 0.55, sunI: 2.0, sky: 0.8, tint: 0xffb98a, fog: 0xc9b3a8, exp: 0.6 },
    morning:  { elev: 18, cloud: 0.28, turb: 3, ray: 1.6, mie: 0.004, mist: 0.18, sunI: 3.0, sky: 1.0, tint: 0xfff1dc, fog: 0xb9cde0, exp: 0.5 },
    noon:     { elev: 58, cloud: 0.22, turb: 2.2, ray: 1.2, mie: 0.003, mist: 0.08, sunI: 3.4, sky: 1.1, tint: 0xffffff, fog: 0xbcd3ea, exp: 0.42 },
    golden:   { elev: 7, cloud: 0.42, turb: 6, ray: 2.2, mie: 0.007, mist: 0.25, sunI: 2.6, sky: 0.85, tint: 0xffc27a, fog: 0xc4b6a8, exp: 0.55 },
    sunset:   { elev: 1.2, cloud: 0.5, turb: 9, ray: 3, mie: 0.009, mist: 0.3, sunI: 1.8, sky: 0.7, tint: 0xff9a5c, fog: 0xc8957e, exp: 0.65 },
    dusk:     { elev: -1.2, cloud: 0.35, turb: 4, ray: 3.5, mie: 0.006, mist: 0.3, sunI: 0.25, sky: 0.6, tint: 0xb48fc8, fog: 0x6a6684, exp: 1.25, moon: 0.4 },
    night:    { elev: -6.5, cloud: 0.2, turb: 2, ray: 1.5, mie: 0.003, mist: 0.2, sunI: 0, sky: 0.55, tint: 0x9fb4ff, fog: 0x1a2236, exp: 1.7, moon: 1 },
    overcast: { elev: 32, cloud: 0.95, turb: 6, ray: 0.5, mie: 0.006, mist: 0.45, sunI: 0.7, sky: 1.15, tint: 0xe6ebf0, fog: 0x8e979f, exp: 0.42, gloom: 0.4 },
    rain:     { elev: 26, cloud: 1, turb: 6, ray: 0.4, mie: 0.006, mist: 0.6, sunI: 0.3, sky: 1.0, tint: 0xcfd8e2, fog: 0x6c7680, exp: 0.45, rain: 1, gloom: 0.7 },
    storm:    { elev: 14, cloud: 1, turb: 6, ray: 0.3, mie: 0.006, mist: 0.7, sunI: 0.12, sky: 0.8, tint: 0xb8c3d6, fog: 0x434b55, exp: 0.42, rain: 1.6, storm: 1, gloom: 0.88 },
    mist:     { elev: 9, cloud: 0.6, turb: 5, ray: 1.4, mie: 0.006, mist: 1, sunI: 1.4, sky: 1.0, tint: 0xffe2c4, fog: 0xb9bcbc, exp: 0.45, gloom: 0.25 },
  };
  let P = PRESETS.morning, fogBase = new T.Color(0xb9cde0), fogNear = 60, fogFar = 900;
  // quality notches (rule 12): sharpness of the picture, the shadows, the water's reflection
  const Q = [{ pr: 2, shadow: 2048, refl: 512 }, { pr: 1.5, shadow: 2048, refl: 512 }, { pr: 1.2, shadow: 1024, refl: 384 }, { pr: 1, shadow: 1024, refl: 256 }, { pr: 0.8, shadow: 512, refl: 256 }, { pr: 0.66, shadow: 0, refl: 192 }];
  let q = 0, waters = [];
  function init(o = {}) {
    const canvas = o.canvas; if (o.dims) dims = o.dims;
    try { R = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', stencil: false }); } catch (e) { R = null; }
    if (!R) return false;
    R.outputColorSpace = T.SRGBColorSpace; R.toneMapping = T.ACESFilmicToneMapping; R.toneMappingExposure = 0.5;
    R.shadowMap.enabled = true; R.shadowMap.type = T.PCFSoftShadowMap;
    scene = new T.Scene(); cam = new T.PerspectiveCamera(o.fov || 60, 1, o.near || 0.1, o.far || 6000);
    sky = new T.Sky(); sky.scale.setScalar(o.far ? o.far * 0.9 : 5000); scene.add(sky);
    // grey weather: the sky's clouds are lit by the sun; "gloom" greys and darkens the whole sky for rain and storms
    sky.material.fragmentShader = sky.material.fragmentShader.replace('uniform float time;', 'uniform float time;\nuniform float gloom;').replace('gl_FragColor = vec4( texColor, 1.0 );', 'texColor = mix( texColor, vec3( dot( texColor, vec3( 0.3, 0.5, 0.2 ) ) ) * ( 0.55 - 0.38 * gloom ), gloom );\n\t\t\tgl_FragColor = vec4( texColor, 1.0 );');
    sky.material.uniforms.gloom = { value: 0 };
    sky.material.uniforms.cloudScale.value = 0.00025; sky.material.uniforms.cloudSpeed.value = 0.00004;
    skyScene = new T.Scene(); const sky2 = new T.Sky(); sky2.material = sky.material; sky2.scale.setScalar(1000); skyScene.add(sky2);
    pmrem = new T.PMREMGenerator(R);
    sun = new T.DirectionalLight(0xffffff, 3); sun.castShadow = true; sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; scene.add(sun, sun.target);
    hemi = new T.HemisphereLight(0xbfd6ff, 0x4a4a38, 1); scene.add(hemi);
    moon = new T.Mesh(new T.CircleGeometry(1, 32), new T.MeshBasicMaterial({ color: 0xf4f1e6, fog: false, transparent: true })); moon.renderOrder = -1; scene.add(moon);
    { const n = 1400, pos = new Float32Array(n * 3), R0 = rngW(7); for (let i = 0; i < n; i++) { const u = R0() * 2 - 1, a = R0() * Math.PI * 2, y = Math.abs(u), r = Math.sqrt(1 - y * y); pos.set([Math.cos(a) * r, y, Math.sin(a) * r], i * 3); }
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3));
      stars = new T.Points(g, new T.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false })); stars.renderOrder = -1; scene.add(stars); }
    rain = makeRain(); scene.add(rain);
    scene.fog = new T.Fog(0xb9cde0, 60, 900);
    // a phone can take the 3D picture away (too much else running): keep the right to have it back, and get it back
    canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); S.lost = true; }, false); canvas.addEventListener('webglcontextrestored', () => { S.lost = false; S.restored = (S.restored || 0) + 1; resize(); }, false);
    ok = true; resize(); return true;
  }
  function rngW(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  // rain: streaks that fall in a box that travels with the camera, all moved by the graphics chip
  function makeRain() {
    const n = 2600, pos = new Float32Array(n * 6), R0 = rngW(11);
    for (let i = 0; i < n; i++) { const x = R0(), y = R0(), z = R0(), s = 0.6 + 0.8 * R0(); pos.set([x, y, z, x, y, z], i * 6); pos[i * 6 + 4] = y; pos[i * 6 + 1] = y; pos[i * 6 + 5] = z; pos[i * 6 + 2] = z; }
    const end = new Float32Array(n * 2); for (let i = 0; i < n; i++) { end[i * 2] = 0; end[i * 2 + 1] = 1; }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('e', new T.BufferAttribute(end, 1));
    const m = new T.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { t: { value: 0 }, c: { value: V() }, w: { value: new T.Vector2(1, 0) }, a: { value: 0 }, box: { value: V(36, 24, 36) }, col: { value: new T.Color(0xcfd8e4) } },
      vertexShader: `attribute float e; uniform float t; uniform vec3 c; uniform vec2 w; uniform vec3 box; varying float ve; varying float vd;
        void main(){ vec3 p = position; float sp = 14.0 + 6.0 * fract(p.x * 91.7);
          vec3 q = vec3(p.x * box.x, p.y * box.y, p.z * box.z);
          q.y = mod(q.y - t * sp - c.y, box.y); q.x = mod(q.x + w.x * t * 2.0 - c.x, box.x); q.z = mod(q.z + w.y * t * 2.0 - c.z, box.z);
          q += c - box * vec3(0.5, 0.35, 0.5);
          q += e * vec3(w.x * 0.03, 0.0, w.y * 0.03) * sp - vec3(0.0, e * 0.045 * sp, 0.0);
          ve = e; vec4 mv = modelViewMatrix * vec4(q, 1.0); vd = -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform float a; uniform vec3 col; varying float ve; varying float vd; void main(){ float f = smoothstep(0.5, 3.0, vd) * (1.0 - smoothstep(18.0, 30.0, vd)); gl_FragColor = vec4(col, a * f * (0.25 + 0.5 * ve)); }` });
    const L = new T.LineSegments(g, m); L.frustumCulled = false; L.renderOrder = 5; return L;
  }
  // the weather and the light. name: a PRESETS key; o: anything to change (elev, azim, cloud, rain, mist, wind)
  function setSky(name, o = {}) {
    if (!ok) return; P = Object.assign({}, PRESETS[name] || PRESETS.morning, o); S.name = name;
    S.elev = P.elev; S.azim = P.azim != null ? P.azim : S.azim; S.cloud = P.cloud; S.rain = P.rain || 0; S.mist = P.mist; S.storm = P.storm || 0; if (o.wind) S.wind = o.wind;
    const u = sky.material.uniforms; u.turbidity.value = P.turb; u.rayleigh.value = P.ray; u.mieCoefficient.value = P.mie; u.mieDirectionalG.value = 0.8;
    u.cloudCoverage.value = P.cloud; u.gloom.value = P.gloom || 0; u.cloudDensity.value = 0.35 + 0.5 * P.cloud; u.cloudElevation.value = 0.5;
    const ph = (90 - S.elev) * Math.PI / 180, th = S.azim * Math.PI / 180, dir = new T.Vector3().setFromSphericalCoords(1, ph, th); S.dir = dir;
    u.sunPosition.value.copy(dir); u.showSunDisc.value = S.elev > -1 && P.cloud < 0.9 ? 1 : 0;
    S.night = P.moon || 0;
    sun.color.set(P.tint); sun.intensity = P.sunI; S.sunI = P.sunI;
    const lowSun = Math.max(0, 1 - S.elev / 25);
    hemi.color.set(P.tint).lerp(new T.Color(0x9fc0ff), 0.55 - 0.3 * lowSun); hemi.groundColor.set(0x3b3a2c).lerp(new T.Color(P.fog), 0.25); hemi.intensity = P.sky; S.hemiI = P.sky;
    if (S.night) { sun.color.set(0xa9bcff); const md = new T.Vector3().setFromSphericalCoords(1, (90 - 17) * Math.PI / 180, (P.moonAz != null ? P.moonAz : 200) * Math.PI / 180); S.moonDir = md; sun.intensity = 0.9 * S.night; S.sunI = sun.intensity; }
    fogBase.set(P.fog); scene.fog.color.copy(fogBase); fogNear = lerp3(120, 4, P.mist); fogFar = lerp3(2400, 140, Math.pow(P.mist, 0.8));
    scene.fog.near = fogNear; scene.fog.far = fogFar; R.toneMappingExposure = S.exposure = P.exp;
    rain.material.uniforms.a.value = Math.min(0.75, 0.42 * S.rain); rain.visible = S.rain > 0;
    stars.material.opacity = S.night * (1 - P.cloud) * 0.9; moon.material.opacity = S.night ? 1 - P.cloud * 0.7 : 0; moon.visible = !!S.night;
    S.flash = 0; S.nextBolt = 3 + Math.random() * 5;
    // reflections on shiny things come from this sky (re-made only when the sky changes)
    if (envRT) envRT.dispose(); sky.material.uniforms.time.value = 0; envRT = pmrem.fromScene(skyScene, 0, 1, 1000); scene.environment = envRT.texture;
    scene.environmentIntensity = S.night ? 0.25 : P.cloud > 0.9 ? 0.6 : 0.85;
    for (const w of waters) waterSky(w);
  }
  const lerp3 = (a, b, t) => a + (b - a) * Math.max(0, Math.min(1, t));
  function sunDir() { return S.night ? S.moonDir : S.dir; }
  // where the shadows are sharpest: the games move it with the action
  function setFocus(x, y, z, r) { focus.p.set(x, y, z); focus.r = r || focus.r; }
  function shadowFollow() {
    const d = sunDir(), r = focus.r; if (!d) return;
    sun.position.copy(focus.p).addScaledVector(d, r * 3); sun.target.position.copy(focus.p);
    const c = sun.shadow.camera; c.left = -r; c.right = r; c.top = r; c.bottom = -r; c.near = 0.5; c.far = r * 6; c.updateProjectionMatrix();
  }
  function setQuality(i) {
    q = Math.max(0, Math.min(Q.length - 1, i)); if (!ok) return; const s = Q[q];
    // test machines paint the 3D picture with the processor, a frame every few seconds at full size: they draw it small instead
    // (navigator.webdriver), unless a test asks for the real picture (window.__fullGL, used for screenshots and card clips)
    R.setPixelRatio(navigator.webdriver && !window.__fullGL ? 0.25 : Math.min(window.devicePixelRatio || 1, s.pr)); resize();
    R.shadowMap.enabled = s.shadow > 0; sun.castShadow = s.shadow > 0;
    if (s.shadow > 0 && sun.shadow.mapSize.x !== s.shadow) { sun.shadow.mapSize.set(s.shadow, s.shadow); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
    scene.traverse(o => { if (o.material && o.material.needsUpdate !== undefined && o.receiveShadow) o.material.needsUpdate = true; });
  }
  let dims = () => [innerWidth, innerHeight];      // a game turned sideways inside an upright screen passes its own (o.dims)
  function resize() { if (!ok) return; const [w, h] = dims(); R.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
  addEventListener('resize', resize);
  // every frame: clouds drift, rain falls, lightning, shadows follow, then the picture
  function render(dt) {
    if (!ok) return; S.t += dt;
    const u = sky.material.uniforms; u.time.value = S.t;
    sky.position.copy(cam.position);
    if (S.storm) { S.nextBolt -= dt; if (S.nextBolt <= 0) { S.flash = 1; S.nextBolt = 4 + Math.random() * 9; S.bolt2 = 0.12 + Math.random() * 0.1; if (S.onBolt) S.onBolt(); } }
    if (S.bolt2 > 0) { S.bolt2 -= dt; if (S.bolt2 <= 0) S.flash = Math.max(S.flash, 0.8); }
    S.flash = Math.max(0, S.flash - dt * 5);
    hemi.intensity = S.hemiI + S.flash * 3; R.toneMappingExposure = S.exposure * (1 + S.flash * 0.9);
    scene.fog.color.copy(fogBase).lerp(new T.Color(0xdfe6ff), S.flash * 0.5);
    if (rain.visible) { const ru = rain.material.uniforms; ru.t.value = S.t; ru.c.value.copy(cam.position); ru.w.value.set(S.wind[0], S.wind[1]); }
    if (S.night) { const md = S.moonDir; moon.position.copy(cam.position).addScaledVector(md, 900); moon.scale.setScalar(28); moon.lookAt(cam.position); stars.position.copy(cam.position); stars.scale.setScalar(950); }
    shadowFollow();
    for (const w of waters) if (w.material.uniforms.time) w.material.uniforms.time.value = S.t * (w.userData.speed || 0.6);
    // test machines (no graphics chip, the processor paints a frame in about a second): no 3D picture, like Bandit's plain way,
    // unless a test asks for it: window.__softGL paints one now and then (the path is tried), window.__fullGL every frame
    if (navigator.webdriver && !window.__fullGL) { if (!window.__softGL) return; const n = performance.now(); if (n - (S.lastR || 0) < 2500) return; S.lastR = n; }
    R.render(scene, cam);
  }
  // ---------- helpers for building worlds ----------
  // a normal map that joins up at its edges (water ripples, wet rock): sum of waves, so no picture has to be fetched
  function normalTex(size = 256, waves = 48, seed = 3) {
    const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d'), im = g.createImageData(size, size), R0 = rngW(seed), W = [];
    for (let i = 0; i < waves; i++) { const a = R0() * Math.PI * 2, f = 1 + ((R0() * (2 + i * 0.35)) | 0); W.push([Math.round(Math.cos(a) * f), Math.round(Math.sin(a) * f), R0() * 6.28, 1 / (f * 0.8 + 1)]); }
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { let dx = 0, dy = 0;
      for (const w of W) { const ph = (w[0] * x + w[1] * y) / size * Math.PI * 2 + w[2], c0 = Math.cos(ph) * w[3]; dx += c0 * w[0]; dy += c0 * w[1]; }
      const n = Math.hypot(dx * 0.08, dy * 0.08, 1), i = (y * size + x) * 4; im.data[i] = 128 + 127 * (-dx * 0.08 / n); im.data[i + 1] = 128 + 127 * (-dy * 0.08 / n); im.data[i + 2] = 128 + 127 / n; im.data[i + 3] = 255; }
    g.putImageData(im, 0, 0); const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; return t;
  }
  // a stretch of real water: reflects the sky, the shore and the sun, ripples in the wind (three.js's Water)
  function water(o = {}) {
    const geo = o.geometry || new T.PlaneGeometry(o.size || 4000, o.size || 4000);
    const w = new T.Water(geo, { textureWidth: Q[q].refl, textureHeight: Q[q].refl, waterNormals: o.normals || normalTex(256), sunDirection: V(0, 1, 0), sunColor: 0xffffff, waterColor: o.color || 0x0f2a33, distortionScale: o.distort || 2.2, fog: true, alpha: 1 });
    w.rotation.x = -Math.PI / 2; w.position.y = o.y || 0; w.userData.speed = o.speed || 0.5; w.userData.base = o.color || 0x0f2a33;
    w.material.uniforms.size.value = o.ripple || 2.5;
    waters.push(w); waterSky(w); scene.add(w); return w;
  }
  function waterSky(w) { const u = w.material.uniforms, d = sunDir() || V(0, 1, 0); u.sunDirection.value.copy(d);
    const c = new T.Color(S.night ? 0xc4d2f0 : (P.tint || 0xffffff)).multiplyScalar(S.night ? 0.8 : Math.min(1, 0.25 + (P.sunI || 0) / 3));
    u.sunColor.value.copy(c); u.waterColor.value.set(w.userData.base).lerp(new T.Color(P.fog), 0.25).multiplyScalar(S.night ? 0.3 : P.cloud > 0.9 ? 0.75 : 1); }
  // land: a grid lifted by height(x, z) and coloured by colour(x, z, h, slope) -> [r, g, b] in 0..1
  function terrain(o) {
    const size = o.size || 600, seg = o.seg || 128, g = new T.PlaneGeometry(size, size, seg, seg); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position, col = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) { const x = p.getX(i) + (o.x || 0), z = p.getZ(i) + (o.z || 0); p.setY(i, o.height(x, z)); }
    g.computeVertexNormals(); const nrm = g.attributes.normal;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i) + (o.x || 0), z = p.getZ(i) + (o.z || 0), c = o.colour(x, z, p.getY(i), 1 - nrm.getY(i)); col.set(c, i * 3); }
    g.setAttribute('color', new T.BufferAttribute(col, 3));
    const m = new T.Mesh(g, new T.MeshStandardMaterial({ vertexColors: true, roughness: o.rough || 0.95, metalness: 0, map: o.map || null }));
    m.position.set(o.x || 0, 0, o.z || 0); m.receiveShadow = true; scene.add(m); return m;
  }
  // a grainy picture to break up flat colour on land, bark and rock (joins up at its edges)
  function grainTex(size = 256, seed = 5, base = 200, spread = 55, scale = 1) {
    const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d'), im = g.createImageData(size, size), R0 = rngW(seed), N = 32, grid = [];
    for (let i = 0; i < N * N; i++) grid.push(R0());
    const vn = (x, y, s) => { const gx = x * s, gy = y * s, ix = Math.floor(gx), iy = Math.floor(gy), fx = gx - ix, fy = gy - iy, m = s | 0, at = (a, b) => grid[((((a % m) + m) % m) % N) + ((((b % m) + m) % m) % N) * N];
      const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy); return (at(ix, iy) * (1 - u) + at(ix + 1, iy) * u) * (1 - v) + (at(ix, iy + 1) * (1 - u) + at(ix + 1, iy + 1) * u) * v; };
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { const u = x / size, v = y / size; let n = vn(u, v, 4 * scale) * 0.45 + vn(u, v, 8 * scale) * 0.3 + vn(u, v, 16 * scale) * 0.15 + R0() * 0.1; const i = (y * size + x) * 4, l = base + (n - 0.5) * 2 * spread; im.data[i] = im.data[i + 1] = im.data[i + 2] = l; im.data[i + 3] = 255; }
    g.putImageData(im, 0, 0); const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.colorSpace = T.SRGBColorSpace; return t;
  }
  // pine trees: one drawing for all of them (instanced), each its own size, lean and shade
  function pines(list, o = {}) {
    const trunkG = new T.CylinderGeometry(0.12, 0.22, 2.2, 6); trunkG.translate(0, 1.1, 0);
    const parts = [trunkG]; const layers = o.layers || 5;
    for (let i = 0; i < layers; i++) { const u = i / layers, r = 1.9 * (1 - u * 0.78), h = 2.6 * (1 - u * 0.35), c = new T.ConeGeometry(r, h, 7, 1, true); c.translate(0, 1.8 + u * 5.6 + h / 2, 0); parts.push(c); }
    const cols = [], gs = parts.map((g, i) => { g = g.toNonIndexed(); const n = g.attributes.position.count, a = new Float32Array(n * 3); for (let j = 0; j < n; j++) { const y = g.attributes.position.getY(j); a.set(i === 0 ? [0.25, 0.17, 0.11] : [0.07 + y * 0.004, 0.16 + y * 0.008, 0.08], j * 3); } g.setAttribute('color', new T.BufferAttribute(a, 3)); return g; });
    const geo = T.mergeGeometries(gs); geo.computeVertexNormals();
    const m = new T.InstancedMesh(geo, new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, flatShading: true }), list.length);
    const d = new T.Object3D(), c = new T.Color();
    list.forEach((t, i) => { d.position.set(t.x, t.y, t.z); d.rotation.set(t.lean || 0, t.rot || 0, (t.lean2 || 0)); d.scale.setScalar(t.s || 1); d.scale.y *= t.sy || 1; d.updateMatrix(); m.setMatrixAt(i, d.matrix); c.setHSL(0.28 + (t.hue || 0) * 0.06, 0.35, 0.35 + (t.shade || 0) * 0.25); m.setColorAt(i, c); });
    m.castShadow = !!o.shadow; m.receiveShadow = true; scene.add(m); return m;
  }
  function screen(v) { const p = v.clone().project(cam), [w, h] = dims(); return { x: (p.x + 1) / 2 * w, y: (1 - p.y) / 2 * h, front: p.z < 1 }; }
  return { init, setSky, setQuality, setFocus, render, resize, water, terrain, pines, normalTex, grainTex, screen, rng: rngW, PRESETS, Q, S,
    get q() { return q; }, get ok() { return ok; }, get R() { return R; }, get scene() { return scene; }, get cam() { return cam; }, get sun() { return sun; }, get hemi() { return hemi; }, T };
})();
