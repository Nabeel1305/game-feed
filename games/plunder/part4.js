
// ===================== PART 4: drawing the sea =====================
// Everything is drawn in screen space: w2s() turns a place on the sea into a place on the screen. Your ship always points up.
const CAM = { x: 0, y: 0, a: 0, z: 1.25, zt: 1.25 }, FXS = [], TXT = [], WAKE = [];
let shake = 0, hitstop = 0, QUAL = 1, PT_MAX = 260, VT = 0, banner = null, hint = null;
const DBG = {};      // tests: leave out parts of the picture, to time them
const ORG = () => H * 0.6, SS = 4;
function w2s(x, y) { const dx = x - CAM.x, dy = y - CAM.y, c = Math.cos(CAM.a), s = Math.sin(CAM.a); return [W / 2 + (dx * c - dy * s) * CAM.z, ORG() - (dx * s + dy * c) * CAM.z]; }
const sAng = h => h - CAM.a;      // a heading on the sea, as an angle on the screen (0 = up, clockwise)

// ---------- small pictures made once ----------
let _noise = null;
function NOISE() {      // a tile of water that wraps: red = the slow swell, green = wind ripples (long thin crests), blue = fine sparkle
  if (_noise) return _noise;
  const n = 256, c = document.createElement('canvas'); c.width = c.height = n; const x = c.getContext('2d'), im = x.createImageData(n, n), d = im.data, R = rng(77);
  const grid = (px, py) => { const g = new Float32Array(px * py); for (let i = 0; i < g.length; i++) g[i] = R(); return (u, v) => { const fx = u * px, fy = v * py, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty), a = g[(y0 % py) * px + x0 % px], b = g[(y0 % py) * px + (x0 + 1) % px], cc = g[((y0 + 1) % py) * px + x0 % px], dd = g[((y0 + 1) % py) * px + (x0 + 1) % px]; return a + (b - a) * sx + (cc - a) * sy + (a - b - cc + dd) * sx * sy; }; };
  const s1 = grid(4, 4), s2 = grid(8, 8), s3 = grid(16, 16), s4 = grid(32, 32), r1 = grid(6, 26), r2 = grid(12, 52), r3 = grid(24, 104), k1 = grid(64, 64), k2 = grid(128, 128);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const u = i / n, v = j / n, o = (j * n + i) * 4, wob = (s3(u, v) - 0.5) * 0.02;
    const sw = (s1(u, v) + s2(u, v) * 0.5 + s3(u, v) * 0.25 + s4(u, v) * 0.12) / 1.87;
    const rg = q => 1 - Math.abs(2 * q - 1), rp = rg(r1(u, v + wob)) * 0.5 + rg(r2(u + wob, v)) * 0.32 + rg(r3(u, v + wob * 0.5)) * 0.18;
    d[o] = clamp(255 * (0.5 + (sw - 0.5) * 2.1), 0, 255); d[o + 1] = clamp(255 * Math.pow(rp, 1.6) * 1.25, 0, 255); d[o + 2] = clamp(255 * (k1(u, v) * 0.45 + k2(u, v) * 0.55), 0, 255); d[o + 3] = 255;
  }
  x.putImageData(im, 0, 0); return (_noise = c);
}
function soft(size, stops) { const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d'), r = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2); for (const s of stops) r.addColorStop(s[0], s[1]); g.fillStyle = r; g.fillRect(0, 0, size, size); return c; }
const SPR = {};
function sprites() {
  if (SPR.foam) return;
  SPR.foam = soft(48, [[0, 'rgba(255,255,255,.95)'], [0.45, 'rgba(235,248,250,.55)'], [1, 'rgba(220,240,245,0)']]);
  SPR.smoke = soft(64, [[0, 'rgba(238,236,228,.9)'], [0.5, 'rgba(205,203,196,.5)'], [1, 'rgba(180,178,172,0)']]);
  SPR.dark = soft(64, [[0, 'rgba(40,38,36,.85)'], [0.5, 'rgba(50,48,46,.45)'], [1, 'rgba(60,58,56,0)']]);
  SPR.flash = soft(64, [[0, 'rgba(255,255,240,1)'], [0.3, 'rgba(255,225,130,.9)'], [0.65, 'rgba(255,150,40,.45)'], [1, 'rgba(255,110,20,0)']]);
  SPR.fire = soft(48, [[0, 'rgba(255,240,170,.95)'], [0.4, 'rgba(255,160,50,.75)'], [1, 'rgba(220,60,10,0)']]);
  SPR.glow = soft(96, [[0, 'rgba(255,214,140,.55)'], [0.5, 'rgba(255,170,70,.2)'], [1, 'rgba(255,150,40,0)']]);
}
// ---------- ships, seen from above (bow up), painted once each ----------
const SHIP_PAL = {
  me: { hull: '#231d1a', deck: '#7c5c3e', trim: '#7d1c18', sail: '#4a2326', sail2: '#33181b', flag: '#0c0c0e', mark: '#e8e2d0' },
  navy: { hull: '#16181b', deck: '#b59c6e', trim: '#d6b048', sail: '#f6f2e4', sail2: '#d5d0bf', flag: '#b3271f', mark: '#f2ead8' },
  merch: [{ hull: '#5b3c25', deck: '#aa865c', trim: '#2f6a4a', sail: '#efe5cc', sail2: '#cfc3a4', flag: '#2f6a4a', mark: '#f0e6c8' }, { hull: '#4b3423', deck: '#a37f55', trim: '#c08a2a', sail: '#ece0c2', sail2: '#cbbd9a', flag: '#c08a2a', mark: '#3a2a12' }, { hull: '#57402c', deck: '#b08c62', trim: '#2f4f7a', sail: '#f1e9d4', sail2: '#d2c8ac', flag: '#2f4f7a', mark: '#f0e6c8' }, { hull: '#4a2f22', deck: '#9d7a52', trim: '#8a3a2a', sail: '#eadfc4', sail2: '#c9bc9c', flag: '#8a3a2a', mark: '#f0e6c8' }]
};
function shipSprite(K, P, sails) {
  const L = K.len * SS, B = K.beam * SS, cw = Math.ceil(B * 2.7), chh = Math.ceil(L * 1.36), c = document.createElement('canvas'); c.width = cw; c.height = chh;
  const g = c.getContext('2d'); g.translate(cw / 2, chh / 2 + L * 0.05); g.lineCap = 'round';
  const hull = (ins) => { const b = B / 2 - ins, l = L / 2 - ins; g.beginPath(); g.moveTo(0, -l); g.bezierCurveTo(b * 0.6, -l * 0.84, b, -l * 0.5, b, -l * 0.08); g.lineTo(b * 0.95, l * 0.6); g.quadraticCurveTo(b * 0.9, l * 0.97, b * 0.5, l); g.lineTo(-b * 0.5, l); g.quadraticCurveTo(-b * 0.9, l * 0.97, -b * 0.95, l * 0.6); g.lineTo(-b, -l * 0.08); g.bezierCurveTo(-b, -l * 0.5, -b * 0.6, -l * 0.84, 0, -l); g.closePath(); };
  hull(0); g.fillStyle = P.hull; g.fill();
  hull(B * 0.045); g.fillStyle = P.trim; g.fill();
  hull(B * 0.1); g.fillStyle = shade(P.hull, 1.25); g.fill();
  hull(B * 0.15); const dg = g.createLinearGradient(-B / 2, 0, B / 2, 0); dg.addColorStop(0, shade(P.deck, 1.08)); dg.addColorStop(0.55, P.deck); dg.addColorStop(1, shade(P.deck, 0.7)); g.fillStyle = dg; g.fill();
  g.save(); hull(B * 0.15); g.clip();
  g.strokeStyle = 'rgba(45,26,10,.3)'; g.lineWidth = 1; for (let x = -B / 2; x < B / 2; x += SS * 1.05) { g.beginPath(); g.moveTo(x, -L / 2); g.lineTo(x, L / 2); g.stroke(); }
  g.fillStyle = 'rgba(30,18,8,.2)'; for (let i = 0; i < 26; i++) g.fillRect(-B / 2 + ((i * 37) % 97) / 97 * B, -L / 2 + ((i * 61) % 89) / 89 * L, SS * 1.05, 1.2);      // plank ends
  // hatches, the wheel, a boat
  const hatch = (y, w, h) => { g.fillStyle = '#2a1c10'; g.fillRect(-w / 2, y - h / 2, w, h); g.strokeStyle = 'rgba(190,150,100,.5)'; g.lineWidth = 0.8; for (let x = -w / 2 + 2; x < w / 2; x += 3) { g.beginPath(); g.moveTo(x, y - h / 2); g.lineTo(x, y + h / 2); g.stroke(); } };
  hatch(-L * 0.1, B * 0.28, L * 0.07); hatch(L * 0.12, B * 0.24, L * 0.055);
  g.fillStyle = shade(P.hull, 1.5); g.fillRect(-B * 0.3, L * 0.3, B * 0.6, L * 0.16); g.fillStyle = shade(P.deck, 0.85); g.fillRect(-B * 0.26, L * 0.31, B * 0.52, L * 0.12);      // quarterdeck
  g.strokeStyle = '#3a2412'; g.lineWidth = 1.6; g.beginPath(); g.arc(0, L * 0.3, B * 0.07, 0, TAU); g.stroke();
  g.restore();
  // guns: muzzles just over the side
  if (K.guns) { g.fillStyle = '#0c0c0d'; for (let i = 0; i < K.guns; i++) { const y = ((i + 0.5) / K.guns - 0.5) * L * 0.72; for (const sd of [-1, 1]) { g.fillRect(sd * (B / 2 - 2.2) - (sd < 0 ? 5 : 0), y - 1.6, 5, 3.2); g.fillRect(sd * (B / 2 - B * 0.13) - 2, y - 2.4, 4, 4.8); } } }
  // bowsprit
  g.strokeStyle = '#3d2a18'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(0, -L / 2 + 3); g.lineTo(0, -L / 2 - L * 0.13); g.stroke();
  const masts = K.masts === 1 ? [[-0.06, 1]] : K.masts === 2 ? [[-0.2, 0.92], [0.16, 1]] : [[-0.27, 0.86], [0, 1], [0.26, 0.72]];
  if (sails) {
    g.fillStyle = P.sail; g.globalAlpha = 0.96; g.beginPath(); g.moveTo(0, -L / 2 - L * 0.12); g.lineTo(B * 0.2, masts[0][0] * L - L * 0.02); g.lineTo(-1, masts[0][0] * L - L * 0.04); g.closePath(); g.fill(); g.globalAlpha = 1;      // jib
    for (const [my, sc] of masts) {
      const y = my * L, w = B * 1.02 * sc, belly = L * 0.125 * sc;
      g.fillStyle = 'rgba(20,10,4,.28)'; g.beginPath(); g.ellipse(B * 0.06, y + L * 0.035, w * 0.8, belly * 0.75, 0, 0, TAU); g.fill();
      for (const [k, yy] of [[1, 0], [0.7, -belly * 0.2]]) {      // course, and the topsail above it
        const ww = w * k, y0 = y + yy, sg = g.createLinearGradient(-ww, 0, ww, 0); sg.addColorStop(0, P.sail2); sg.addColorStop(0.3, P.sail); sg.addColorStop(0.62, shade(P.sail, 1.04)); sg.addColorStop(1, P.sail2);
        g.fillStyle = sg; g.beginPath(); g.moveTo(-ww, y0 + 1.5); g.quadraticCurveTo(-ww * 0.9, y0 - belly * k * 0.9, 0, y0 - belly * k * 1.25); g.quadraticCurveTo(ww * 0.9, y0 - belly * k * 0.9, ww, y0 + 1.5); g.quadraticCurveTo(0, y0 + belly * 0.22, -ww, y0 + 1.5); g.closePath(); g.fill();
        g.strokeStyle = 'rgba(0,0,0,.13)'; g.lineWidth = 0.8; for (const q of [-0.5, 0, 0.5]) { g.beginPath(); g.moveTo(ww * q, y0 + 1); g.lineTo(ww * q * 0.92, y0 - belly * k * (1.2 - Math.abs(q) * 0.5)); g.stroke(); }
        g.strokeStyle = '#3d2a18'; g.lineWidth = 2; g.beginPath(); g.moveTo(-ww * 1.03, y0 + 1.5); g.quadraticCurveTo(0, y0 + belly * 0.2, ww * 1.03, y0 + 1.5); g.stroke();
      }
    }
  } else for (const [my, sc] of masts) { const y = my * L, w = B * 0.98 * sc; g.strokeStyle = '#3d2a18'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(-w, y); g.lineTo(w, y); g.stroke(); g.strokeStyle = P.sail2; g.lineWidth = 3.2; g.beginPath(); g.moveTo(-w * 0.9, y - 1.5); g.lineTo(w * 0.9, y - 1.5); g.stroke(); }      // sails furled on the yards
  for (const [my] of masts) { g.fillStyle = '#2c1d10'; g.beginPath(); g.arc(0, my * L, SS * 0.75, 0, TAU); g.fill(); g.fillStyle = '#6a4a2c'; g.beginPath(); g.arc(-0.5, my * L - 0.5, SS * 0.4, 0, TAU); g.fill(); }
  // the flag at the stern
  const fy = L / 2 - 1; g.strokeStyle = '#2c1d10'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(0, fy - 4); g.lineTo(0, fy + 3); g.stroke();
  g.fillStyle = sails ? P.flag : '#f4f1e8'; g.beginPath(); g.moveTo(0, fy + 2); g.quadraticCurveTo(B * 0.16, fy + 5, B * 0.3, fy + 3); g.lineTo(B * 0.3, fy + 11); g.quadraticCurveTo(B * 0.16, fy + 13, 0, fy + 10); g.closePath(); g.fill();
  if (sails) { g.fillStyle = P.mark; if (K === MYSHIP) { g.beginPath(); g.arc(B * 0.14, fy + 6.5, 2.1, 0, TAU); g.fill(); g.fillRect(B * 0.14 - 2.6, fy + 9, 5.2, 1.1); } else if (K.navy) g.fillRect(1, fy + 3, B * 0.11, 3.6); else g.fillRect(B * 0.09, fy + 5, B * 0.12, 2.6); }
  // its shadow: the same shape, flat and dark
  const sh = document.createElement('canvas'); sh.width = cw; sh.height = chh; const q = sh.getContext('2d'); q.drawImage(c, 0, 0); q.globalCompositeOperation = 'source-in'; q.fillStyle = 'rgba(2,22,34,.42)'; q.fillRect(0, 0, cw, chh);
  return { img: c, sh, cw, chh, oy: L * 0.05 };
}
const _ships = new Map();
function spriteOf(s) {
  const mine = s.K === MYSHIP, key = (mine ? 'me' : s.info.kind + (s.pal || 0)) + (s.struck ? 'x' : '');
  if (!_ships.has(key)) _ships.set(key, shipSprite(s.K, mine ? SHIP_PAL.me : s.K.navy ? SHIP_PAL.navy : SHIP_PAL.merch[(s.pal || 0) % 4], !s.struck));
  return _ships.get(key);
}

// ---------- the water: painted by the graphics chip when there is one, else as two sheets of pattern ----------
let SEAGL = null, seaTried = false, seaPlain = null, seaMood = 0;
const SEA_FRAG = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uT; uniform vec2 uO, uCS, uA, uB, uC2, uD, uRes; uniform float uZ, uMood;
void main() {
  vec2 p = (gl_FragCoord.xy - uO) / uZ;
  vec2 w = vec2(p.x * uCS.x + p.y * uCS.y, -p.x * uCS.y + p.y * uCS.x);
  vec4 t1 = texture2D(uT, uA + w / 430.0), t2 = texture2D(uT, uC2 + w / 150.0);
  float sw = t1.r * 0.7 + t2.r * 0.3;
  vec2 w2 = vec2(w.x * 0.94 - w.y * 0.34, w.x * 0.34 + w.y * 0.94);
  vec4 t3 = texture2D(uT, uD + w2 / 84.0);
  float r1 = t2.g, r2 = t3.g, rp = r1 * 0.72 + r2 * 0.28, sp = texture2D(uT, uD.yx + w2 / 64.0).b;
  vec3 deep = mix(vec3(0.012, 0.165, 0.29), vec3(0.02, 0.11, 0.185), uMood), mid = mix(vec3(0.03, 0.34, 0.47), vec3(0.045, 0.24, 0.33), uMood), lite = mix(vec3(0.33, 0.74, 0.76), vec3(0.3, 0.56, 0.6), uMood);
  vec3 col = mix(deep, mid, smoothstep(0.2, 0.8, sw + rp * 0.25 - 0.1));
  col = mix(col, lite, smoothstep(0.42, 0.95, rp) * (0.25 + 0.5 * sw));
  col += vec3(0.95, 1.0, 0.94) * smoothstep(0.7, 1.0, r1 * r2 * 2.2) * smoothstep(0.56, 0.86, sp) * mix(0.55, 0.3, uMood);
  vec2 v = gl_FragCoord.xy / uRes - 0.5; col *= 1.0 - dot(v, v) * 0.5;
  gl_FragColor = vec4(col, 1.0);
}`;
function seaInit() {
  if (seaTried) return; seaTried = true;
  try {
    const c = $('bg'), gl = c.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'high-performance' }); if (!gl) return;
    const dbg = gl.getExtension('WEBGL_debug_renderer_info'), name = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '';
    if (/swiftshader|llvmpipe|software|basic render/i.test(name) && !window.__softGL) return;      // a pretend graphics chip is slower than the plain way
    const sh = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader'); return s; };
    const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, 'attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }')); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, SEA_FRAG)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('link'); gl.useProgram(p);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const la = gl.getAttribLocation(p, 'a'); gl.enableVertexAttribArray(la); gl.vertexAttribPointer(la, 2, gl.FLOAT, false, 0, 0);
    const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, NOISE()); gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    const u = {}; for (const n of ['uT', 'uO', 'uCS', 'uA', 'uB', 'uC2', 'uD', 'uRes', 'uZ', 'uMood']) u[n] = gl.getUniformLocation(p, n); gl.uniform1i(u.uT, 0);
    SEAGL = { gl, c, u, checked: false };
    c.addEventListener('webglcontextlost', e => { e.preventDefault(); SEAGL = null; c.style.display = 'none'; });
    c.addEventListener('webglcontextrestored', () => { seaTried = false; });
  } catch (e) { SEAGL = null; }
}
const fr = v => v - Math.floor(v);
function seaDraw() {
  const t = VT;
  if (!SEAGL && !seaTried) seaInit();
  if (SEAGL) {
    const S = SEAGL, gl = S.gl, c = S.c, pw = Math.max(2, Math.round(W * QUAL)), ph = Math.max(2, Math.round(H * QUAL)), q = pw / W;      // water is soft: one dot for each of the page's dots is plenty (a quarter of the work on most phones)
    if (c.width !== pw || c.height !== ph) { c.width = pw; c.height = ph; } if (c.style.display !== 'block') c.style.display = 'block';
    gl.viewport(0, 0, pw, ph); gl.uniform2f(S.u.uO, W / 2 * q, (H - ORG()) * q); gl.uniform2f(S.u.uCS, Math.cos(CAM.a), Math.sin(CAM.a)); gl.uniform1f(S.u.uZ, CAM.z * q); gl.uniform2f(S.u.uRes, pw, ph); gl.uniform1f(S.u.uMood, seaMood);
    const cx2 = CAM.x * 0.94 - CAM.y * 0.34, cy2 = CAM.x * 0.34 + CAM.y * 0.94;
    gl.uniform2f(S.u.uA, fr(CAM.x / 430 + t * 0.004), fr(CAM.y / 430 + t * 0.006)); gl.uniform2f(S.u.uB, fr(CAM.y / 170 - t * 0.007), fr(CAM.x / 170 + t * 0.005)); gl.uniform2f(S.u.uC2, fr(CAM.x / 150 + t * 0.006), fr(CAM.y / 150 + t * 0.03)); gl.uniform2f(S.u.uD, fr(cx2 / 84 - t * 0.008), fr(cy2 / 84 + t * 0.045));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (!S.checked) { S.checked = true; try { const px = new Uint8Array(4); gl.readPixels(pw >> 1, ph >> 1, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); if (px[0] + px[1] + px[2] === 0 || gl.getError()) { SEAGL = null; c.style.display = 'none'; } } catch (e) { SEAGL = null; c.style.display = 'none'; } }
    if (SEAGL) { ctx.clearRect(-1, -1, W + 2, H + 2); return; }
  }
  // the plain way: the same water as two sheets of pattern, the crests sliding over the swell
  if (!seaPlain) {
    const n = 256, src = NOISE().getContext('2d').getImageData(0, 0, n, n).data, mk = () => { const c = document.createElement('canvas'); c.width = c.height = n; return c; }, a = mk(), b = mk(), ga = a.getContext('2d'), gb = b.getContext('2d'), ia = ga.createImageData(n, n), ib = gb.createImageData(n, n);
    const ss = (e0, e1, x) => { const q = clamp((x - e0) / (e1 - e0), 0, 1); return q * q * (3 - 2 * q); };
    for (let i = 0; i < n * n; i++) { const o = i * 4, sw = src[o] / 255, rp = src[o + 1] / 255, sp = src[o + 2] / 255, m = ss(0.2, 0.8, sw);
      ia.data[o] = 255 * lerp(0.012, 0.03, m); ia.data[o + 1] = 255 * lerp(0.165, 0.34, m); ia.data[o + 2] = 255 * lerp(0.29, 0.47, m); ia.data[o + 3] = 255;
      const cr = ss(0.42, 0.95, rp) * 0.5, gl = ss(0.7, 0.95, rp) * ss(0.5, 0.82, sp) * 0.75, al = Math.min(1, cr + gl); ib.data[o] = 255 * lerp(0.33, 0.95, gl / (al || 1)); ib.data[o + 1] = 255 * lerp(0.74, 1, gl / (al || 1)); ib.data[o + 2] = 255 * lerp(0.76, 0.94, gl / (al || 1)); ib.data[o + 3] = 255 * al; }
    ga.putImageData(ia, 0, 0); gb.putImageData(ib, 0, 0); seaPlain = { a: ctx.createPattern(a, 'repeat'), b: ctx.createPattern(b, 'repeat') };
  }
  // (painted small and stretched up: water is soft, and turning a pattern is slow work without a graphics chip)
  const S = seaPlain, sc = 0.4 * Math.max(0.6, QUAL), cw = Math.ceil(W * sc), ch = Math.ceil(H * sc); if (!S.cv) S.cv = document.createElement('canvas'); if (S.cv.width !== cw || S.cv.height !== ch) { S.cv.width = cw; S.cv.height = ch; }
  const g = S.cv.getContext('2d'), R = Math.hypot(W, H) / CAM.z * 0.72;
  for (const [pat, per, ox, oy] of [[S.a, 300, t * 1.6, t * 2.2], [S.b, 112, t * 0.9, t * 4.6]]) {
    const kk = per / 256; g.setTransform(sc, 0, 0, sc, 0, 0); g.translate(W / 2, ORG()); g.scale(CAM.z, -CAM.z); g.rotate(CAM.a); g.translate(-CAM.x - ox, -CAM.y - oy); g.scale(kk, kk);
    g.fillStyle = pat; g.fillRect((CAM.x + ox - R) / kk, (CAM.y + oy - R) / kk, 2 * R / kk, 2 * R / kk);
  }
  if (seaMood > 0.02) { g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = `rgba(4,18,30,${0.34 * seaMood})`; g.fillRect(0, 0, cw, ch); }
  ctx.drawImage(S.cv, 0, 0, W, H);
}

// ---------- sparks, smoke, spray, words ----------
function fx(o) { if (FXS.length < PT_MAX) FXS.push(Object.assign({ t: 0, vx: 0, vy: 0, life: 1, r0: 4, r1: 4, a0: 1, g: 0, w: 1, rot: 0, vr: 0 }, o)); }
function say(txt, x, y, col = '#fff', size = 22, w = 0) { TXT.push({ txt, x, y, col, size, t: 0, w }); if (TXT.length > 12) TXT.shift(); }
function setBanner(txt, sub = '', secs = 1.7, col = '#fff') { banner = { txt, sub, t: 0, secs, col }; }
function puff(x, y, a, n, sp, spr, life, r0, r1, a0 = 0.8) { for (let i = 0; i < n; i++) { const q = a + (Math.random() - 0.5) * 0.7, v = sp * (0.4 + Math.random() * 0.8); fx({ k: spr, x, y, vx: Math.sin(q) * v, vy: Math.cos(q) * v, life: life * (0.7 + Math.random() * 0.6), r0, r1: r1 * (0.7 + Math.random() * 0.6), a0, drag: 2.2 }); } }
function fxStep(dt) {
  for (const p of FXS) { p.t += dt; if (p.drag) { const d = Math.exp(-p.drag * dt); p.vx *= d; p.vy *= d; } p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; }
  for (let i = FXS.length - 1; i >= 0; i--) if (FXS[i].t >= FXS[i].life) FXS.splice(i, 1);
  for (const w of WAKE) w.t += dt; while (WAKE.length && WAKE[0].t > WAKE[0].life) WAKE.shift();
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.1) TXT.shift();
  if (banner) { banner.t += dt; if (banner.t > banner.secs) banner = null; }
  shake = Math.max(0, shake - dt * 30 - shake * dt * 6);
}
function fxDraw(world) {
  for (const p of FXS) {
    if (!!p.w !== world) continue;
    const u = p.t / p.life, pos = p.w ? w2s(p.x, p.y) : [p.x, p.y], sc = p.w ? CAM.z : 1, r = lerp(p.r0, p.r1, easeOut(u)) * sc, a = p.a0 * (p.hold ? Math.min(1, (1 - u) / (1 - p.hold)) : 1 - u);
    if (a <= 0.01 || r < 0.3) continue;
    ctx.globalAlpha = Math.min(1, a);
    if (p.k === 'chip') { ctx.save(); ctx.translate(pos[0], pos[1]); ctx.rotate(p.rot); ctx.fillStyle = p.col; ctx.fillRect(-r, -r * 0.35, r * 2, r * 0.7); ctx.restore(); }
    else if (p.k === 'ring') { ctx.strokeStyle = p.col || '#fff'; ctx.lineWidth = Math.max(1, (p.lw || 2) * (1 - u) * sc); ctx.beginPath(); ctx.arc(pos[0], pos[1], r, 0, TAU); ctx.stroke(); }
    else if (p.k === 'dot') { ctx.fillStyle = p.col || '#fff'; ctx.beginPath(); ctx.arc(pos[0], pos[1], r, 0, TAU); ctx.fill(); }
    else if (p.k === 'line') { ctx.strokeStyle = p.col || '#fff'; ctx.lineWidth = Math.max(1, r); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(pos[0], pos[1]); ctx.lineTo(pos[0] - p.vx * 0.05, pos[1] - p.vy * 0.05); ctx.stroke(); }
    else ctx.drawImage(SPR[p.k], pos[0] - r, pos[1] - r, r * 2, r * 2);
  }
  ctx.globalAlpha = 1;
}
function txtDraw() {
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t of TXT) { const u = t.t / 1.1, p = t.w ? w2s(t.x, t.y) : [t.x, t.y], pop = u < 0.12 ? 0.6 + u / 0.12 * 0.5 : 1.1 - Math.min(0.1, (u - 0.12) * 0.5); let fs = t.size * k * pop;
    if (t.tw == null) { ctx.font = `700 ${Math.round(t.size * k)}px ${BC}`; t.tw = ctx.measureText(t.txt).width / Math.round(t.size * k); }      // how wide it is, measured once: a long line is shrunk and slid to stay on the screen
    let tw = t.tw * fs; if (tw > W - 16) { fs *= (W - 16) / tw; tw = W - 16; }
    ctx.globalAlpha = u > 0.65 ? (1 - u) / 0.35 : 1; ctx.font = `700 ${Math.round(fs)}px ${BC}`; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(4,14,20,.75)'; const tx = clamp(p[0], tw / 2 + 8, W - tw / 2 - 8); ctx.strokeText(t.txt, tx, p[1] - u * 34 * k); ctx.fillStyle = t.col; ctx.fillText(t.txt, tx, p[1] - u * 34 * k); }
  ctx.globalAlpha = 1;
  if (banner) { const b = banner, a = Math.min(1, b.t / 0.18, (b.secs - b.t) / 0.35), sc = b.t < 0.2 ? 1.25 - b.t / 0.2 * 0.25 : 1, y = H * 0.2;
    ctx.globalAlpha = Math.max(0, a); let fs = 48 * k * sc; ctx.font = `400 ${Math.round(fs)}px ${PO}`; const tw = ctx.measureText(b.txt).width; if (tw > W - 28) { fs *= (W - 28) / tw; ctx.font = `400 ${Math.round(fs)}px ${PO}`; } ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(3,12,18,.8)'; ctx.strokeText(b.txt, W / 2, y); ctx.fillStyle = b.col; ctx.fillText(b.txt, W / 2, y);
    if (b.sub) { ctx.font = `700 ${Math.round(16 * k)}px ${BC}`; ctx.lineWidth = 4; ctx.strokeText(b.sub, W / 2, y + 36 * k); ctx.fillStyle = '#f0e6c8'; ctx.fillText(b.sub, W / 2, y + 36 * k); } ctx.globalAlpha = 1; }
}

// ---------- the sea scene ----------
function camStep(G, dt) {
  const me = G.me, la = G.phase === 'sight' ? 46 : 22; CAM.x = me.x + fwdX(me) * la; CAM.y = me.y + fwdY(me) * la;
  CAM.a += wrapA(me.hdg - CAM.a) * Math.min(1, dt * 7);
  let dn = 1e9; for (const s of G.foes) if (s.alive && !s.gone && (s.eng || !s.K.navy || G.phase !== 'battle')) dn = Math.min(dn, relTo(me, s).d);
  CAM.zt = k * (G.phase === 'sail' ? 2.2 : G.phase === 'sight' ? 1.55 : G.phase === 'grapple' ? 2.4 : clamp(176 / (dn + 20), 1.12, 2.2)); CAM.z += (CAM.zt - CAM.z) * Math.min(1, dt * 1.7);
  seaMood += ((G.phase === 'sail' ? 0 : G.phase === 'sight' ? 0.35 : 0.8) - seaMood) * Math.min(1, dt * 1.2);
}
function wakeStep(G, dt) {
  for (const s of [G.me].concat(G.foes)) {
    if (s.gone || s.v < 6 || (!s.alive && s.sink > 1)) continue; s.wk = (s.wk || 0) - dt * (s.v / 30);
    if (s.wk <= 0 && WAKE.length < 190) { s.wk = 0.06; const hl = s.K.len * 0.5, hb = s.K.beam * 0.42;
      for (const sd of [-1, 1]) WAKE.push({ x: s.x - fwdX(s) * hl * 0.92 + rgtX(s) * sd * hb * 0.45, y: s.y - fwdY(s) * hl * 0.92 + rgtY(s) * sd * hb * 0.45, vx: rgtX(s) * sd * 2.6, vy: rgtY(s) * sd * 2.6, t: 0, life: 2.3, r: s.K.beam * 0.2 });
      const sd = Math.random() < 0.5 ? -1 : 1; WAKE.push({ x: s.x + fwdX(s) * hl * 0.7 + rgtX(s) * sd * hb * 0.7, y: s.y + fwdY(s) * hl * 0.7 + rgtY(s) * sd * hb * 0.7, vx: rgtX(s) * sd * 9, vy: rgtY(s) * sd * 9, t: 0, life: 1.0, r: s.K.beam * 0.16 }); }
  }
}
function wedge(s, side, arc, range, fill, line, lw, dash) {
  const [x, y] = w2s(s.x, s.y), a = sAng(s.hdg) + (side ? 1 : -1) * Math.PI / 2 - Math.PI / 2, r = range * CAM.z;      // canvas angles run from the +x axis
  ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, r, a - arc, a + arc); ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (line) { ctx.strokeStyle = line; ctx.lineWidth = lw || 1.5; if (dash) ctx.setLineDash(dash); ctx.stroke(); if (dash) ctx.setLineDash([]); }
  return [x, y, a, r];
}
function drawShipAt(s, alpha) {
  const sp = spriteOf(s), [x, y] = w2s(s.x, s.y), z = CAM.z / SS * (1 + 0.012 * Math.sin(s.bob * 1.9)), roll = 1 - 0.035 * Math.abs(s.rud) + 0.014 * Math.sin(s.bob * 1.3);
  ctx.save(); ctx.translate(x, y); ctx.rotate(sAng(s.hdg)); ctx.scale(z * roll, z); if (alpha < 1) ctx.globalAlpha = alpha; ctx.drawImage(sp.img, -sp.cw / 2, -sp.chh / 2 - sp.oy);
  if (s.holes.length) { ctx.fillStyle = 'rgba(18,10,6,.85)'; for (const h of s.holes) { ctx.beginPath(); ctx.arc(h.lx * s.K.beam * 0.5 * SS, -h.ly * s.K.len * 0.5 * SS, 2.6, 0, TAU); ctx.fill(); } }
  if (s.hitT < 0.12) { ctx.globalAlpha = 0.5 * (1 - s.hitT / 0.12); ctx.drawImage(SPR.flash, -sp.cw * 0.4, -sp.cw * 0.4, sp.cw * 0.8, sp.cw * 0.8); }
  ctx.restore();
}
function drawSea(G) {
  sprites(); if (DBG.noSea) { ctx.fillStyle = '#0a3a55'; ctx.fillRect(0, 0, W, H); } else seaDraw();
  const me = G.me, c = G.cfg, battle = G.phase === 'battle', live = G.phase !== 'sunk';
  // foam
  if (!DBG.noWake) for (const w of WAKE) { const u = w.t / w.life, [x, y] = w2s(w.x + w.vx * w.t, w.y + w.vy * w.t), r = w.r * (0.8 + u * 1.5) * CAM.z; ctx.globalAlpha = 0.42 * (1 - u) * (1 - u); ctx.drawImage(SPR.foam, x - r, y - r, r * 2, r * 2); } ctx.globalAlpha = 1;
  // shadows
  const all = G.foes.filter(s => !s.gone).concat([me]);
  for (const s of all) { if (!s.alive && s.sink > 0.6) continue; const sp = spriteOf(s), [x, y] = w2s(s.x, s.y), z = CAM.z / SS; ctx.save(); ctx.translate(x + 5 * CAM.z, y + 7 * CAM.z); ctx.rotate(sAng(s.hdg)); ctx.scale(z, z); ctx.drawImage(sp.sh, -sp.cw / 2, -sp.chh / 2 - sp.oy); ctx.restore(); }
  // where guns can reach: hers in red (a warning), yours in gold
  if ((battle || G.phase === 'chase' || G.phase === 'close') && !DBG.noFans) {
    for (const s of G.foes) {
      if (!s.alive || s.gone || s.struck || !s.K.navy || !s.eng) continue;
      for (let side = 0; side < 2; side++) {
        if (s.aimOn[side]) { const u = clamp(s.aim[side] / c.eAim, 0, 1), [x, y, a, r] = wedge(s, side, Math.min(1.55, fanOf(G)), reachOf(G), `rgba(255,96,72,${0.3 + 0.25 * u})`, `rgba(255,170,150,${0.8 + 0.2 * u})`, 3);
          ctx.strokeStyle = `rgba(255,236,210,${0.5 + 0.5 * u})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, Math.max(4, r * u), a - Math.min(1.55, fanOf(G)), a + Math.min(1.55, fanOf(G))); ctx.stroke(); }
        else if (s.load[side] <= 0.8) wedge(s, side, Math.min(1.55, fanOf(G)), reachOf(G), 'rgba(255,110,90,.13)', 'rgba(255,120,100,.8)', 2, [7, 6]);
      }
    }
    if (live) for (let side = 0; side < 2; side++) {
      const ld = me.load[side], lit = G.lit[side];
      if (ld <= 0) { const ease = G.inArc[side] && !lit; wedge(me, side, SEA.ARC, SEA.RANGE, lit ? 'rgba(255,204,92,.26)' : ease ? 'rgba(255,204,92,.1)' : 'rgba(255,214,130,.06)', lit ? 'rgba(255,226,140,.95)' : ease ? 'rgba(255,226,140,.8)' : 'rgba(255,226,160,.38)', lit ? 2.5 : ease ? 2 : 1.3, ease ? [5, 5] : null); }      // dashed gold: she is in front of the guns, but the wheel has not been let go yet
      else { const [x, y, a, r] = wedge(me, side, SEA.ARC, SEA.RANGE, null, 'rgba(210,220,225,.1)', 1); ctx.strokeStyle = 'rgba(255,226,160,.45)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y, 26 * CAM.z, a - SEA.ARC, a - SEA.ARC + 2 * SEA.ARC * clamp(1 - ld / c.myReload, 0, 1)); ctx.stroke(); }
    }
  }
  // grapples
  if (G.phase === 'grapple' && G.prize) { const P = G.prize, u = clamp(G.pt / 0.8, 0, 1); ctx.strokeStyle = 'rgba(60,44,28,.95)'; ctx.lineWidth = 1.6; for (const q of [-0.3, 0, 0.3]) { const [ax, ay] = w2s(me.x + fwdX(me) * q * me.K.len, me.y + fwdY(me) * q * me.K.len), [bx, by] = w2s(P.x + fwdX(P) * q * P.K.len * 0.8, P.y + fwdY(P) * q * P.K.len * 0.8); ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo((ax + bx) / 2, (ay + by) / 2 + 10 * (1 - u), lerp(ax, bx, u), lerp(ay, by, u)); ctx.stroke(); } }
  // ships
  for (const s of all) { if (!s.alive) { if (s.sink < 3.2) drawShipAt(s, clamp(1 - s.sink / 3.2, 0, 1)); continue; } drawShipAt(s, 1); }
  fxDraw(true);
  // balls: they rise and fall, so they grow and their shadows part from them
  for (const b of G.balls) { if (!b.live) continue; const u = b.t / b.T, hgt = Math.sin(u * Math.PI), [x, y] = w2s(b.x, b.y), r = (1.5 + hgt * 1.3) * CAM.z;
    ctx.fillStyle = 'rgba(2,20,30,.35)'; ctx.beginPath(); ctx.arc(x + hgt * 7 * CAM.z, y + hgt * 9 * CAM.z, r * 0.9, 0, TAU); ctx.fill(); ctx.fillStyle = '#16171a'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.3, 0, TAU); ctx.fill(); }
  // hull bars, marks, and arrows to ships off the screen
  for (const s of G.foes) {
    if (!s.alive || s.gone) continue; const [x, y] = w2s(s.x, s.y), off = x < 14 || x > W - 14 || y < 60 || y > H - 20, prize = s === G.prize && G.phase !== 'sail';
    const col = s.struck ? '#f4f1e8' : s.K.navy ? (s.eng ? '#ff6e5a' : '#b7c0c6') : '#e9b949';
    if (off) { const cx = W / 2, cy = ORG(), a = Math.atan2(y - cy, x - cx), ex = clamp(x, 20, W - 20), ey = clamp(y, 70, H - 150); ctx.save(); ctx.translate(ex, ey); ctx.rotate(a); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(11, 0); ctx.lineTo(-7, -8); ctx.lineTo(-3, 0); ctx.lineTo(-7, 8); ctx.closePath(); ctx.fill(); ctx.restore(); continue; }
    const top = y - (s.K.len * 0.5 + 9) * CAM.z;
    if (s.K.navy && !s.struck && G.phase !== 'sight') { const w = 34 * k, u = s.hull / s.hull0; ctx.fillStyle = 'rgba(3,12,18,.6)'; ctx.fillRect(x - w / 2 - 1, top - 3, w + 2, 6); ctx.fillStyle = u > 0.4 ? '#ff6e5a' : '#ffb347'; ctx.fillRect(x - w / 2, top - 2, w * u, 4); }
    if (prize && (G.phase === 'chase' || G.phase === 'close' || s.struck)) { const r = (s.K.len * 0.62) * CAM.z, pu = 0.5 + 0.5 * Math.sin(VT * 5); ctx.strokeStyle = `rgba(233,185,73,${0.5 + 0.4 * pu})`; ctx.lineWidth = 2; ctx.setLineDash([7, 7]); ctx.lineDashOffset = -VT * 20; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
  }
  txtDraw();
}
// what one moment of the sea battle looks and sounds like (called for every event the rules push out)
function seaEvent(G, e) {
  const me = G.me;
  switch (e.k) {
    case 'gun': { puff(e.x, e.y, e.a, 2, 26, 'smoke', 1.3, 1.6, 7, 0.75); fx({ k: 'flash', x: e.x + Math.sin(e.a) * 2.5, y: e.y + Math.cos(e.a) * 2.5, life: 0.09, r0: 4.5, r1: 7 }); sfx.gun(e.mine ? 1 : 0.55, e.mine); if (e.mine) { shake = Math.min(9, shake + 2.2); vibe(HAP.light); } break; }
    case 'fire': if (e.mine) duck(0.35, 500); break;
    case 'splash': fx({ k: 'ring', x: e.x, y: e.y, life: 0.55, r0: 1, r1: 6.5, col: '#e9f6f8', lw: 2 }); puff(e.x, e.y, 0, 3, 5, 'foam', 0.7, 1.5, 4.5, 0.85); sfx.splash(); break;
    case 'hit': { const col = e.s.K.navy ? '#2a2a2c' : '#6b4a2c'; for (let i = 0; i < (e.rake ? 9 : 5); i++) { const a = Math.random() * TAU, v = 14 + Math.random() * 30; fx({ k: 'chip', x: e.x, y: e.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.5 + Math.random() * 0.4, r0: 1.3, r1: 0.6, col: Math.random() < 0.5 ? col : '#a8845a', vr: (Math.random() - 0.5) * 20, drag: 2 }); }
      fx({ k: 'flash', x: e.x, y: e.y, life: 0.12, r0: 3, r1: e.rake ? 11 : 7 }); puff(e.x, e.y, 0, 2, 6, 'dark', 1.2, 2, 7, 0.55);
      if (e.me) { shake = Math.min(14, shake + 6); hurtFlash = 0.5; sfx.hullMe(); hitstop = Math.max(hitstop, 0.04); } else { sfx.hullHer(e.rake); if (e.rake) { hitstop = Math.max(hitstop, 0.05); if (gate('raketxt', 600)) say('RAKED!', e.x, e.y + 10, '#ffd166', 24, 1); } }
      break; }
    case 'ports': if (e.s.eng) { sfx.ports(); if (G.N <= 6) tip('red', 'Red is where her guns reach: get out of it', 2.6); } break;
    case 'bump': sfx.bump(); shake = Math.min(10, shake + 4); break;
    case 'sunk': if (e.me) { sfx.sunk(); duck(0.8, 1500); setBanner('Sunk', '', 1.6, '#ff9a8a'); } else { setBanner('Sunk!', e.s.info.name, 1.5, '#ffd9a0'); sfx.sunk(); sfx.cheer(0.6); hitstop = 0.12; vibe(HAP.sharp); for (let i = 0; i < 10; i++) fx({ k: 'foam', x: e.s.x + (Math.random() - 0.5) * e.s.K.len * 0.7, y: e.s.y + (Math.random() - 0.5) * e.s.K.len * 0.7, life: 1.6 + Math.random() * 1.4, r0: 2, r1: 9, a0: 0.8 }); } break;
    case 'struck': setBanner('She strikes!', e.s.info.name + ' hauls down her colours', 1.9, '#ffd166'); sfx.struck(); sfx.cheer(0.9); hitstop = 0.14; vibe(HAP.best); break;
    case 'hove': if (gate('hove', 900)) { say('HEAVES TO', e.s.x, e.s.y + 18, '#f4f1e8', 18, 1); sfx.bell(1); } break;
    case 'seawon': if (G.prize && !G.prize.K.navy) setBanner('The sea is yours', 'Come alongside ' + G.prize.info.name, 2.2, '#ffd166'); break;
    case 'grapple': setBanner('Boarders away!', G.prize.info.name, 1.5, '#fff'); sfx.grapple(); vibe(HAP.sharp); break;
    case 'sight': sfx.sight(); vibe(HAP.light); break;
    case 'raid': sfx.raid(); break;
    case 'pass': sfx.tap(); break;
    case 'wasted': if (gate('wasted', 1500)) { say(e.n > 1.3 ? 'WASTED AGAIN: SLOWER EACH TIME' : 'WASTED: NO SHIP IN YOUR ARC', me.x, me.y - 30, '#ff9a8a', 15, 1); tip('waste', 'Only FIRE when it lights: a wasted side is slow to reload', 3); } break;
    case 'hold': if (gate('hold', 900)) say('LET GO OF THE WHEEL', me.x, me.y - 30, '#ffe9b0', 15, 1); tip('ease', 'Let go of the wheel: the guns fire as soon as she is steady', 3); break;
    case 'wild': if (gate('wild', 900)) { say(e.n > 1.3 ? 'WILD AGAIN: SLOWER EACH TIME' : 'WILD! LET THE WHEEL GO FIRST', me.x, me.y - 30, '#ff9a8a', 15, 1); tip('ease', 'Let go of the wheel, then FIRE when it lights', 3); } break;
    case 'tells': if (gate('tells', 500)) { say('BROADSIDE!', me.x, me.y + 34, '#ffd166', 22, 1); vibe(HAP.sharp); sfx.tells(); } break;
    case 'ranged': setBanner('Her gunners have your range', 'Hurt her, or she will sink you', 2.2, '#ff9a8a'); sfx.ports(); break;
    case 'quarter': if (G.N <= 8 && e.s.eng) tip('quarter', 'She sits where your guns cannot reach: turn on her', 3.2); break;
    case 'empty': if (gate('empty', 500)) sfx.empty(); break;
    case 'engage': if (G.pt > 2 && gate('eng', 1500)) { say('SHE COMES IN', e.s.x, e.s.y + 16, '#ff9a8a', 16, 1); sfx.ports(); } break;
  }
}
