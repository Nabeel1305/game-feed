
// ---------- Brightwater City: skies, skylines and places ----------
let WORLD = null;
function buildWorld() {
  const r = rng(77);
  WORLD = { stars: [], far: [], near: [], clouds: [] };
  for (let i = 0; i < 90; i++) WORLD.stars.push({ x: r() * 1.6 - 0.3, y: r() * 0.55, s: 0.4 + r() * 1.2, tw: r() * 6 });
  for (let x = -0.5; x < 1.5;) { const w = 0.05 + r() * 0.08; WORLD.far.push({ x, w, h: 0.08 + r() * 0.16, ant: r() < 0.2 }); x += w + 0.004; }
  for (let x = -0.5; x < 1.5;) { const w = 0.09 + r() * 0.1; WORLD.near.push({ x, w, h: 0.12 + r() * 0.22, c: r(), win: r() }); x += w + 0.02 + r() * 0.04; }
  for (let i = 0; i < 7; i++) WORLD.clouds.push({ x: r() * 1.6 - 0.3, y: 0.06 + r() * 0.3, w: 0.18 + r() * 0.25 });
}
const SKY = { day: ['#4ea6e6', '#9fd6f6', '#dff3ff'], sunset: ['#3a3f7c', '#e9806a', '#ffd59a'], night: ['#040d26', '#10234d', '#24396e'] };
function drawSky(tod, t, scroll = 0) {
  const c = SKY[tod], hz = H * 0.66;
  const g = ctx.createLinearGradient(0, -H * 0.3, 0, hz); g.addColorStop(0, c[0]); g.addColorStop(0.6, c[1]); g.addColorStop(1, c[2]);
  ctx.fillStyle = g; ctx.fillRect(-W, -H, W * 3, hz + H * 2);
  if (tod === 'night') { for (const s of WORLD.stars) { ctx.fillStyle = `rgba(255,255,240,${0.4 + 0.5 * Math.abs(Math.sin(t * 0.8 + s.tw))})`; ctx.fillRect(((s.x - scroll * 0.02) % 1.6 + 1.6) % 1.6 * W - 0.3 * W, s.y * H, s.s, s.s); } ctx.fillStyle = '#f4f1de'; ctx.beginPath(); ctx.arc(W * 0.8, H * 0.12, 18 * k, 0, 7); ctx.fill(); ctx.fillStyle = c[0]; ctx.beginPath(); ctx.arc(W * 0.8 + 8 * k, H * 0.115, 16 * k, 0, 7); ctx.fill(); }
  else { const sx = tod === 'day' ? W * 0.18 : W * 0.5, sy = tod === 'day' ? H * 0.1 : H * 0.5; const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, 80 * k); sg.addColorStop(0, tod === 'day' ? 'rgba(255,255,230,1)' : 'rgba(255,220,150,1)'); sg.addColorStop(0.3, tod === 'day' ? 'rgba(255,250,210,.55)' : 'rgba(255,170,90,.6)'); sg.addColorStop(1, 'rgba(255,240,200,0)'); ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(sx, sy, 80 * k, 0, 7); ctx.fill(); }
  for (const cl of WORLD.clouds) { const x = (((cl.x - scroll * 0.05 + t * 0.004) % 1.6 + 1.6) % 1.6 - 0.3) * W; ctx.fillStyle = tod === 'night' ? 'rgba(160,180,220,.08)' : tod === 'sunset' ? 'rgba(255,200,170,.35)' : 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(x, cl.y * H, cl.w * W * 0.5, H * 0.014, 0, 0, 7); ctx.ellipse(x + cl.w * W * 0.15, cl.y * H - H * 0.01, cl.w * W * 0.25, H * 0.014, 0, 0, 7); ctx.fill(); }
}
function skylineCol(tod, near) { return tod === 'night' ? (near ? '#16213f' : '#1d2b52') : tod === 'sunset' ? (near ? '#4a3a5c' : '#7a5a74') : (near ? '#6f8fb0' : '#a9c4dd'); }
function drawSkyline(tod, base, scroll = 0, t = 0) {
  const night = tod !== 'day';
  ctx.fillStyle = skylineCol(tod, false);
  for (const b of WORLD.far) { const x = (((b.x - scroll * 0.3) % 2 + 2) % 2 - 0.5) * W; ctx.fillRect(x, base - b.h * H, b.w * W, b.h * H + 2); if (b.ant) ctx.fillRect(x + b.w * W * 0.45, base - b.h * H - 12 * k, 2, 12 * k); }
  for (const b of WORLD.near) {
    const x = (((b.x - scroll * 0.6) % 2 + 2) % 2 - 0.5) * W, h = b.h * H * 0.8;
    ctx.fillStyle = skylineCol(tod, true); ctx.fillRect(x, base - h, b.w * W, h + 2);
    if (night) { ctx.fillStyle = tod === 'night' ? 'rgba(255,214,120,.75)' : 'rgba(255,200,140,.45)'; const cw = 4 * k, chh = 5 * k; for (let wy = base - h + 8 * k; wy < base - 6 * k; wy += 12 * k) for (let wx = x + 6 * k; wx < x + b.w * W - 8 * k; wx += 10 * k) if (Math.sin(wx * 12.9 + wy * 7.3 + b.win * 40) > 0.25) ctx.fillRect(wx, wy, cw, chh); }
  }
}
function drawScene(sc, tod, t) {
  drawSky(tod, t);
  const gy = GY(), hz = H * 0.66, night = tod === 'night', dim = tod === 'night' ? 0.45 : tod === 'sunset' ? 0.75 : 1;
  if (sc !== 'mountain' && sc !== 'beach') drawSkyline(tod, hz, 0, t);
  if (sc === 'park') {
    ctx.fillStyle = shade('#5fae5a', dim); ctx.beginPath(); ctx.moveTo(-W, hz + 10); for (let x = -W; x <= W * 2; x += 40) ctx.lineTo(x, hz - 8 + Math.sin(x * 0.01) * 10); ctx.lineTo(W * 2, H * 2); ctx.lineTo(-W, H * 2); ctx.fill();
    ctx.fillStyle = shade('#4c9a47', dim); ctx.fillRect(-W, gy - 30 * k, W * 3, H);
    for (const [tx, ts] of [[-0.05, 1.3], [0.12, 1], [0.88, 1.15], [1.05, 1.3], [0.5, 0.6]]) tree(W * tx, gy - 24 * k, ts * k, dim);
    ctx.fillStyle = shade('#c9b48a', dim); ctx.fillRect(-W, gy + 4 * k, W * 3, 10 * k);
  } else if (sc === 'city') {
    for (const b of WORLD.near) {   // a closer row of buildings so the street has a city behind it
      const x = (b.x + 0.5) * W * 0.75 - W * 0.4, w = b.w * W * 0.9, h = (0.12 + b.h * 0.9) * H;
      building(x, gy - 8 * k, w, h, ['#5d6d8a', '#6a5d7e', '#5a7377', '#7a6a5a'][Math.floor(b.c * 4)], dim * 0.85, night);
    }
    ctx.fillStyle = shade('#4b4f5c', dim); ctx.fillRect(-W, gy - 4 * k, W * 3, H);
    ctx.fillStyle = shade('#8a8f9c', dim); ctx.fillRect(-W, gy - 10 * k, W * 3, 8 * k);
    ctx.strokeStyle = 'rgba(255,230,140,.5)'; ctx.lineWidth = 3 * k; ctx.setLineDash([22 * k, 18 * k]); ctx.beginPath(); ctx.moveTo(-W, gy + 30 * k); ctx.lineTo(W * 2, gy + 30 * k); ctx.stroke(); ctx.setLineDash([]);
    for (const [bx, bw, bh, c] of [[-0.25, 0.32, 0.55, '#5b6b84'], [0.88, 0.34, 0.5, '#6e5b7a'], [1.2, 0.3, 0.6, '#556b6b']]) building(W * bx, gy - 10 * k, W * bw, H * bh, c, dim, night);
    for (const lx of [0.25, 0.75]) { ctx.fillStyle = shade('#2d3436', dim); ctx.fillRect(W * lx - 2, gy - 70 * k, 4, 62 * k); ctx.fillStyle = night ? '#ffe9a0' : '#ddd'; ctx.beginPath(); ctx.arc(W * lx, gy - 72 * k, 5 * k, 0, 7); ctx.fill(); }
  } else if (sc === 'bridge') {
    water(hz, dim, t);
    const dy = H * 0.6;
    ctx.fillStyle = shade('#c0392b', dim * 0.9);
    for (const tx of [0.12, 0.88]) { ctx.fillRect(W * tx - 9 * k, H * 0.28, 18 * k, dy - H * 0.28 + 40 * k); ctx.fillRect(W * tx - 14 * k, H * 0.34, 28 * k, 6 * k); ctx.fillRect(W * tx - 14 * k, H * 0.45, 28 * k, 6 * k); }
    ctx.strokeStyle = shade('#c0392b', dim * 0.9); ctx.lineWidth = 3 * k; ctx.beginPath(); ctx.moveTo(-W, dy - 40 * k); ctx.quadraticCurveTo(W * 0.12, H * 0.3, W * 0.12, H * 0.28); ctx.quadraticCurveTo(W * 0.5, dy - 10 * k, W * 0.88, H * 0.28); ctx.quadraticCurveTo(W * 0.88, H * 0.3, W * 2, dy - 40 * k); ctx.stroke();
    ctx.lineWidth = 1; for (let x = -W; x < W * 2; x += 16 * k) { const yy = cableY(x, dy); ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x, dy); ctx.stroke(); }
    ctx.fillStyle = shade('#57606f', dim); ctx.fillRect(-W, dy, W * 3, 14 * k); ctx.fillStyle = shade('#2f3542', dim); ctx.fillRect(-W, dy + 14 * k, W * 3, 6 * k);
    ctx.fillStyle = shade('#3d6b8c', dim * 0.8); ctx.fillRect(-W, gy, W * 3, H);
  } else if (sc === 'beach') {
    water(hz, dim, t);
    ctx.fillStyle = shade('#f1d9a4', dim); ctx.beginPath(); ctx.moveTo(-W, gy - 20 * k); ctx.quadraticCurveTo(W * 0.5, gy - 44 * k, W * 2, gy - 18 * k); ctx.lineTo(W * 2, H * 2); ctx.lineTo(-W, H * 2); ctx.fill();
    // Ferris wheel on the pier
    const fx = W * 0.86, fy = H * 0.42, fr = 80 * k; ctx.strokeStyle = shade('#ecf0f1', dim); ctx.lineWidth = 3 * k; ctx.beginPath(); ctx.arc(fx, fy, fr, 0, 7); ctx.stroke();
    for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283 + t * 0.15; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx + Math.cos(a) * fr, fy + Math.sin(a) * fr); ctx.stroke(); ctx.fillStyle = shade(['#e74c3c', '#f1c40f', '#3498db'][i % 3], dim); ctx.fillRect(fx + Math.cos(a) * fr - 6 * k, fy + Math.sin(a) * fr, 12 * k, 10 * k); }
    ctx.beginPath(); ctx.moveTo(fx - 40 * k, gy - 30 * k); ctx.lineTo(fx, fy); ctx.lineTo(fx + 40 * k, gy - 30 * k); ctx.stroke();
    ctx.fillStyle = shade('#8a6a4a', dim); ctx.fillRect(W * 0.6, gy - 34 * k, W * 0.6, 8 * k);
    for (const px of [0.15, 0.4]) { ctx.fillStyle = shade(['#ff6b6b', '#48dbfb'][px > 0.3 ? 1 : 0], dim); ctx.beginPath(); ctx.arc(W * px, gy - 6 * k, 14 * k, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#7f6a52'; ctx.fillRect(W * px - 1, gy - 6 * k, 2, 20 * k); }
  } else if (sc === 'harbor') {
    water(hz, dim, t);
    for (const [cx, dir] of [[0.1, 1], [0.92, -1]]) { const x = W * cx; ctx.strokeStyle = shade('#f39c12', dim); ctx.lineWidth = 6 * k; ctx.beginPath(); ctx.moveTo(x, gy - 30 * k); ctx.lineTo(x, H * 0.25); ctx.lineTo(x + dir * W * 0.32, H * 0.25); ctx.stroke(); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, H * 0.18); ctx.lineTo(x + dir * W * 0.32, H * 0.25); ctx.moveTo(x + dir * W * 0.25, H * 0.25); ctx.lineTo(x + dir * W * 0.25, H * 0.4); ctx.stroke(); }
    ctx.fillStyle = shade('#6b6b6b', dim); ctx.fillRect(-W, gy - 26 * k, W * 3, H);
    const cols = ['#c0392b', '#2980b9', '#27ae60', '#e67e22', '#8e44ad'];
    for (let i = 0; i < 9; i++) { const x = -W * 0.2 + i * W * 0.17; ctx.fillStyle = shade(cols[i % 5], dim); ctx.fillRect(x, gy - 64 * k - (i % 2) * 26 * k, W * 0.15, 38 * k + (i % 2) * 26 * k); ctx.fillStyle = 'rgba(0,0,0,.12)'; for (let j = 1; j < 6; j++) ctx.fillRect(x + j * W * 0.025, gy - 64 * k - (i % 2) * 26 * k, 1.5, 38 * k + (i % 2) * 26 * k); }
  } else if (sc === 'mountain') {
    for (const [c, base, amp, sp] of [['#8aa0c4', hz - H * 0.12, 0.18, 0.004], ['#6f8a6a', hz - H * 0.02, 0.12, 0.007], ['#557552', hz + H * 0.06, 0.08, 0.011]]) {
      ctx.fillStyle = shade(c, dim); ctx.beginPath(); ctx.moveTo(-W, H * 2);
      for (let x = -W; x <= W * 2; x += 20) ctx.lineTo(x, base - Math.abs(Math.sin(x * sp + base)) * H * amp);
      ctx.lineTo(W * 2, H * 2); ctx.fill();
    }
    ctx.fillStyle = shade('#3d5a3a', dim); for (let i = 0; i < 14; i++) { const x = (i / 13) * W * 1.4 - W * 0.2, y = gy - 20 * k - (i % 3) * 8 * k; ctx.beginPath(); ctx.moveTo(x, y - 30 * k); ctx.lineTo(x - 9 * k, y); ctx.lineTo(x + 9 * k, y); ctx.fill(); }
    ctx.fillStyle = shade('#5a5a5a', dim); ctx.fillRect(-W, gy - 6 * k, W * 3, H);
  }
}
function cableY(x, dy) { const a = W * 0.12, b = W * 0.88; if (x < a || x > b) return dy - 40 * k; const u = (x - a) / (b - a); return H * 0.28 + (dy - 10 * k - H * 0.28) * 4 * u * (1 - u); }
function water(hz, dim, t) { const g = ctx.createLinearGradient(0, hz, 0, H); g.addColorStop(0, shade('#4a90c2', dim)); g.addColorStop(1, shade('#1f4f7a', dim)); ctx.fillStyle = g; ctx.fillRect(-W, hz, W * 3, H); ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 1.5; for (let i = 0; i < 12; i++) { const y = hz + 10 + i * 18, x = ((i * 97 + t * 20) % (W + 60)) - 30; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 26, y); ctx.stroke(); } }
function tree(x, y, s, dim) { ctx.fillStyle = shade('#6b4423', dim); ctx.fillRect(x - 6 * s, y - 70 * s, 12 * s, 76 * s); ctx.fillStyle = shade('#3f8f3a', dim); for (const [ox, oy, r] of [[0, -100, 46], [-34, -78, 34], [34, -78, 34], [0, -60, 36]]) { ctx.beginPath(); ctx.arc(x + ox * s, y + oy * s, r * s, 0, 7); ctx.fill(); } ctx.fillStyle = shade('#57a84f', dim); ctx.beginPath(); ctx.arc(x - 12 * s, y - 112 * s, 22 * s, 0, 7); ctx.fill(); }
function building(x, base, w, h, c, dim, night) { ctx.fillStyle = shade(c, dim); ctx.fillRect(x, base - h, w, h); ctx.fillStyle = night ? 'rgba(255,214,120,.8)' : 'rgba(200,230,255,.55)'; for (let wy = base - h + 14 * k; wy < base - 20 * k; wy += 22 * k) for (let wx = x + 10 * k; wx < x + w - 14 * k; wx += 18 * k) if (!night || Math.sin(wx * 3.1 + wy * 1.7) > -0.2) ctx.fillRect(wx, wy, 9 * k, 12 * k); }

// the hideout: a rooftop over the night city, a beacon, and Zenith on the ledge
function drawHome(t) {
  drawSky('night', t, t * 0.2);
  drawSkyline('night', H * 0.72, t * 0.003, t);
  const ry = H * 0.8;
  ctx.fillStyle = '#121a33'; ctx.fillRect(-W, ry, W * 3, H);
  ctx.fillStyle = '#1b2647'; ctx.fillRect(-W, ry - 8 * k, W * 3, 10 * k);
  // the hideout shack with a lit window and an antenna
  const hx = W * 0.72, hw = 110 * k, hh = 70 * k;
  ctx.fillStyle = '#26345e'; ctx.fillRect(hx, ry - hh, hw, hh); ctx.fillStyle = '#1b2647'; ctx.beginPath(); ctx.moveTo(hx - 8 * k, ry - hh); ctx.lineTo(hx + hw / 2, ry - hh - 26 * k); ctx.lineTo(hx + hw + 8 * k, ry - hh); ctx.fill();
  ctx.fillStyle = '#ffd679'; ctx.fillRect(hx + 16 * k, ry - hh + 18 * k, 30 * k, 24 * k); ctx.fillStyle = '#8a5a2b'; ctx.fillRect(hx + 64 * k, ry - 46 * k, 26 * k, 46 * k);
  ctx.strokeStyle = '#8a95b8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(hx + hw * 0.8, ry - hh - 14 * k); ctx.lineTo(hx + hw * 0.8, ry - hh - 60 * k); ctx.stroke();
  const bl = 0.5 + 0.5 * Math.sin(t * 3); ctx.fillStyle = `rgba(255,80,60,${0.5 + bl * 0.5})`; ctx.beginPath(); ctx.arc(hx + hw * 0.8, ry - hh - 62 * k, 3.5 * k, 0, 7); ctx.fill();
  // beacon: a sweeping gold light with the Z
  const bx = W * 0.2, by = ry - 10 * k;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; const a = -Math.PI / 2 + Math.sin(t * 0.6) * 0.35;
  const g = ctx.createLinearGradient(bx, by, bx + Math.cos(a) * H * 0.8, by + Math.sin(a) * H * 0.8); g.addColorStop(0, 'rgba(255,212,90,.35)'); g.addColorStop(1, 'rgba(255,212,90,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(a - 0.12) * H, by + Math.sin(a - 0.12) * H); ctx.lineTo(bx + Math.cos(a + 0.12) * H, by + Math.sin(a + 0.12) * H); ctx.fill(); ctx.restore();
  ctx.fillStyle = '#3a4466'; ctx.fillRect(bx - 12 * k, by - 8 * k, 24 * k, 18 * k); ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(bx, by - 10 * k, 9 * k, 0, 7); ctx.fill();
  // Zenith on the ledge
  drawHero(W * 0.46, ry - 34 * k, 2.1 * k, 'sit');
}
