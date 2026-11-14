
// ---------- shared juice ----------
function say(text, color = '#fff', size = 1, y = 0.3, dur = 0.9) { if (!G || HEADLESS) return; G.msgs = G.msgs.filter(m => Math.abs(m.y - y) > 0.08); G.msgs.push({ text, color, size, y, t: 0, dur }); }
function burst(x, y, n, cols, sp = 200, life = 0.6, g = 400, size = 3) { if (HEADLESS || !G) return; for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, v = sp * (0.3 + Math.random() * 0.7); G.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - sp * 0.3, t: 0, life: life * (0.6 + Math.random() * 0.6), c: pick(cols), g, s: size * (0.6 + Math.random() * 0.8) }); } }
function finish(m, res, reason) { if (m.result) return; m.result = res; m.reason = reason || ''; m.rt = 0; }
function meter(x, y, w, v, col, label, warn) {
  ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.45)'; rrect(x - w / 2, y, w, 8 * k, 4 * k); ctx.fill();
  ctx.fillStyle = warn ? (Math.sin(performance.now() / 70) > 0 ? '#ff5a3c' : '#ffb03a') : col; rrect(x - w / 2, y, Math.max(0.001, w * clamp(v, 0, 1)), 8 * k, 4 * k); ctx.fill();
  if (label) { ctx.fillStyle = '#fff'; ctx.font = `800 ${Math.round(10 * k)}px Nunito, sans-serif`; ctx.textAlign = 'center'; ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 4; ctx.fillText(label, x, y - 4 * k); }
  ctx.restore();
}
function heroHearts(m, x, y) { ctx.save(); ctx.font = `${Math.round(14 * k)}px sans-serif`; ctx.textAlign = 'center'; ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 4; ctx.fillStyle = '#ff6b8a'; ctx.fillText('♥'.repeat(Math.max(0, m.hp)) + '♡'.repeat(Math.max(0, m.maxHp - m.hp)), x, y); ctx.restore(); }
function label(text, x, y, size = 13, col = '#fff', align = 'center') { ctx.save(); ctx.fillStyle = col; ctx.font = `800 ${Math.round(size * k)}px Nunito, sans-serif`; ctx.textAlign = align; ctx.shadowColor = 'rgba(0,0,0,.75)'; ctx.shadowBlur = 5; ctx.fillText(text, x, y); ctx.restore(); }
const MT = {};
const slowF = sp => sp.assist ? 1.15 : 1;      // disclosed help: more time to react, never looser rules

// ---------- CATCH: fly under falling people ----------
const PERCH_COL = { park: '#6b4423', city: '#7f8c8d', beach: '#ecf0f1', harbor: '#f39c12', mountain: '#8a6a4a', bridge: '#c0392b' };
MT.catch = {
  make(sp) {
    const { f, e } = sp, sl = slowF(sp);
    const m = { n: sp.n, g: (480 + 6 * f) * (1 - 0.35 * e) * H / 844 / (sl * sl), warn: (Math.max(0.45, 0.95 - 0.012 * f) + 0.4 * e) * sl, gap: Math.max(0.55, 1.5 - 0.018 * f) * (1 + 0.5 * e) * sl,
      r: (30 + 24 * e) * k, vmax: 780 * W / 390, hx: W / 2, hy: H * 0.7, tx: W / 2, fallers: [], caught: 0, lost: 0, sq: 0, hvx: 0 };
    const zig = sp.L >= 4 ? Math.min(110, (f - 3) * 7) * W / 390 : 0;
    let t = 0.9, lastX = W / 2;
    for (let i = 0; i < m.n; i++) {
      let x, tries = 0; do { x = W * (0.14 + Math.random() * 0.72); tries++; } while (i > 0 && Math.abs(x - lastX) < W * Math.min(0.32, 0.18 + f * 0.008) && tries < 30);
      lastX = x;
      m.fallers.push({ x, y: H * 0.22, vx: (Math.random() - 0.5) * (20 + f * 2.5) * W / 390, vy: 0, at: t, state: 'hidden', ph: Math.random() * 6, zig: Math.random() < 0.6 ? zig : 0, look: sp.looks[i] || sp.looks[0], wt: 0 });
      t += m.gap * (0.8 + Math.random() * 0.4);
    }
    return m;
  },
  update(m, dt) {
    const d = m.tx - m.hx, mv = m.vmax * dt, st = clamp(d, -mv, mv); m.hx += st; m.hvx = dt ? st / dt : 0; m.sq = Math.max(0, m.sq - dt * 4);
    const cy = m.hy - 16 * k;
    for (const p of m.fallers) {
      if (p.state === 'hidden') { if (m.t >= p.at) { p.state = 'wait'; p.wt = 0; if (!HEADLESS) sfx.yelp(); } continue; }
      if (p.state === 'wait') { p.wt += dt; if (p.wt >= m.warn) p.state = 'fall'; continue; }
      if (p.state === 'fall') {
        p.vy = Math.min(p.vy + m.g * dt, 950 * H / 844); p.ph += dt * 3.2;
        p.x += (p.vx + p.zig * Math.cos(p.ph)) * dt; if (p.x < W * 0.05 || p.x > W * 0.95) { p.vx *= -1; p.x = clamp(p.x, W * 0.05, W * 0.95); }
        const py = p.y; p.y += p.vy * dt;
        if (py < cy && p.y >= cy && Math.abs(p.x - m.hx) < m.r) {
          p.state = 'caught'; p.ct = 0; m.caught++; m.sq = 1; G.stop = Math.max(G.stop, 0.05);
          if (!HEADLESS) { sfx.catch(m.caught - 1); vibe(HAP.light); burst(m.hx, cy, 14, ['#ffd45a', '#ffffff'], 160, 0.6, 200); say(m.caught === m.n ? 'GOT EVERYONE!' : 'CAUGHT!', '#ffd45a', 1, 0.36); }
        }
        if (p.y > GY() - 4 * k) { p.state = 'lost'; m.lost++; if (!HEADLESS) { sfx.thud(); burst(p.x, GY(), 10, ['#c8b89a', '#a89070'], 120, 0.5, 300); } }
      } else if (p.state === 'caught') p.ct += dt;
    }
    if (m.lost) finish(m, 'fail', `Caught ${m.caught} of ${m.n}. (They bounced into a bush, just a bit dizzy.)`);
    else if (m.caught === m.n) finish(m, 'win');
  },
  draw(m) {
    const top = H * 0.22, col = PERCH_COL[m.sc] || '#7f8c8d';
    ctx.fillStyle = shade(col, 0.75); rrect(-W * 0.1, top, W * 1.2, 9 * k, 4 * k); ctx.fill();
    ctx.fillStyle = col; rrect(-W * 0.1, top - 1, W * 1.2, 4 * k, 2 * k); ctx.fill();
    // catch zone under the hero teaches the size of the catch
    ctx.save(); ctx.globalAlpha = 0.25 + (m.sq * 0.4); ctx.fillStyle = '#ffd45a'; ctx.beginPath(); ctx.ellipse(m.hx, m.hy - 16 * k, m.r, 7 * k, 0, 0, 7); ctx.fill(); ctx.restore();
    for (const p of m.fallers) {
      if (p.state === 'wait') {
        drawPerson(p.x, top, 1.25 * k, p.look, 'wave', { ph: p.ph });
        const left = 1 - p.wt / m.warn;   // warning ring shrinks to the moment they slip
        ctx.strokeStyle = `rgba(255,90,60,${0.5 + 0.5 * Math.sin(performance.now() / 80)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, top - 30 * k, (16 + 28 * left) * k, 0, 7); ctx.stroke();
        label('HELP!', p.x, top - 68 * k, 13, '#fff');
      } else if (p.state === 'fall') {
        if (m.sp.L <= 5) { ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.setLineDash([4, 6]); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, m.hy - 16 * k); ctx.stroke(); ctx.setLineDash([]); }
        drawPerson(p.x, p.y + 24 * k, 1.25 * k, p.look, 'fall', { ph: p.ph, rot: Math.sin(p.ph * 2) * 0.4 });
      } else if (p.state === 'lost') {
        drawPerson(p.x, GY() + 4 * k, 1.2 * k, p.look, 'stand', { rot: 1.4 });
      }
    }
    const recent = m.fallers.some(p => p.state === 'caught' && p.ct < 0.8);
    ctx.save(); ctx.translate(m.hx, m.hy); ctx.rotate(clamp(m.hvx / 4000, -0.25, 0.25));
    drawHero(0, 0, 1.4 * k, recent ? 'catch' : 'hover', { squash: m.sq });
    for (const p of m.fallers) if (p.state === 'caught' && p.ct < 0.8) { ctx.globalAlpha = 1 - Math.max(0, (p.ct - 0.5) / 0.3); drawPerson(0, -18 * k, 1.05 * k, p.look, 'held'); ctx.globalAlpha = 1; }
    ctx.restore();
    label(`${m.caught} / ${m.n} caught`, W / 2, H * 0.95, 13);
  },
  down(m, x) { m.tx = x; }, move(m, x) { m.tx = x; }, up() {}
};

// ---------- ZAP: laser eyes on falling threats ----------
function drawThreat(t, look) {
  const r = t.r, now = performance.now() / 1000;
  ctx.save(); ctx.translate(t.x, t.y);
  if (look === 'rock' || look === 'lava') {
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(0, -r * 4, 0, 0); g.addColorStop(0, 'rgba(255,120,40,0)'); g.addColorStop(1, look === 'lava' ? 'rgba(255,160,60,.8)' : 'rgba(255,120,40,.55)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-r * 0.8, 0); ctx.lineTo(0, -r * 4.2); ctx.lineTo(r * 0.8, 0); ctx.fill(); ctx.restore();
    ctx.fillStyle = look === 'lava' ? '#5a1d0c' : '#6b5a4a'; ctx.beginPath(); for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283 + t.ph, rr = r * (0.85 + 0.15 * Math.sin(i * 3.7 + t.ph)); ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.fill();
    ctx.fillStyle = look === 'lava' ? '#ff8a2a' : '#4a3d32'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(Math.cos(i * 2 + t.ph) * r * 0.4, Math.sin(i * 2 + t.ph) * r * 0.4, r * 0.18, 0, 7); ctx.fill(); }
  } else if (look === 'ice') {
    ctx.fillStyle = '#d8f3ff'; ctx.strokeStyle = '#8ccbe8'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283 + t.ph; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.3, r * 0.25, 0, 7); ctx.fill();
  } else if (look === 'junk') {
    ctx.rotate(t.ph + now * 1.5); ctx.fillStyle = '#9aa5b1'; ctx.fillRect(-r, -r * 0.45, r * 2, r * 0.9); ctx.fillStyle = '#2e5d9e'; ctx.fillRect(-r * 1.8, -r * 0.35, r * 0.7, r * 0.7); ctx.fillRect(r * 1.1, -r * 0.35, r * 0.7, r * 0.7);
    ctx.strokeStyle = '#ccd'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, -r * 0.45); ctx.lineTo(r * 0.3, -r * 1.1); ctx.stroke();
  } else if (look === 'drone') {
    ctx.fillStyle = '#3d4450'; rrect(-r * 0.6, -r * 0.3, r * 1.2, r * 0.6, r * 0.2); ctx.fill(); ctx.strokeStyle = '#3d4450'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-r, -r * 0.5); ctx.lineTo(r, r * 0.5); ctx.moveTo(r, -r * 0.5); ctx.lineTo(-r, r * 0.5); ctx.stroke();
    ctx.fillStyle = 'rgba(200,210,220,.5)'; for (const [ox, oy] of [[-r, -r * 0.5], [r, -r * 0.5], [-r, r * 0.5], [r, r * 0.5]]) { ctx.beginPath(); ctx.ellipse(ox, oy, r * 0.45, r * 0.12, now * 30, 0, 7); ctx.fill(); }
    ctx.fillStyle = Math.sin(now * 12) > 0 ? '#ff3b30' : '#661510'; ctx.beginPath(); ctx.arc(0, 0, r * 0.18, 0, 7); ctx.fill();
  } else if (look === 'bee') {
    ctx.fillStyle = 'rgba(220,240,255,.6)'; ctx.beginPath(); ctx.ellipse(-r * 0.3, -r * 0.7, r * 0.5, r * 0.25, -0.5 + Math.sin(now * 40) * 0.3, 0, 7); ctx.ellipse(r * 0.3, -r * 0.7, r * 0.5, r * 0.25, 0.5 - Math.sin(now * 40) * 0.3, 0, 7); ctx.fill();
    ctx.fillStyle = '#f5c518'; ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.7, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#222'; ctx.fillRect(-r * 0.35, -r * 0.65, r * 0.25, r * 1.3); ctx.fillRect(r * 0.15, -r * 0.65, r * 0.25, r * 1.3);
    ctx.fillStyle = '#5ff'; ctx.beginPath(); ctx.arc(r * 0.75, -r * 0.1, r * 0.15, 0, 7); ctx.fill();
  }
  if (t.hitT > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,200,120,.6)'; ctx.beginPath(); ctx.arc(0, 0, r * 1.1, 0, 7); ctx.fill(); ctx.restore(); }
  if (t.hp < t.max) { ctx.strokeStyle = '#ffd45a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, r + 6, -Math.PI / 2, -Math.PI / 2 + 6.283 * (t.hp / t.max)); ctx.stroke(); }
  ctx.restore();
}
function drawHeli(c) {
  const now = performance.now() / 1000;
  ctx.save(); ctx.translate(c.x, c.y); ctx.scale(c.vx > 0 ? 1 : -1, 1); const s = k;
  ctx.fillStyle = c.hurt ? '#555' : '#e8e8e8'; ctx.beginPath(); ctx.ellipse(0, 0, 22 * s, 11 * s, 0, 0, 7); ctx.fill(); ctx.fillRect(-42 * s, -3 * s, 26 * s, 5 * s);
  ctx.fillStyle = '#d63031'; ctx.fillRect(-14 * s, -2 * s, 28 * s, 4 * s);
  ctx.fillStyle = '#7ec8f0'; ctx.beginPath(); ctx.ellipse(10 * s, -2 * s, 9 * s, 6 * s, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = '#444'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -11 * s); ctx.lineTo(0, -15 * s); ctx.stroke();
  ctx.beginPath(); const w = Math.cos(now * 40) * 30 * s; ctx.moveTo(-w, -15 * s); ctx.lineTo(w, -15 * s); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-6 * s, 11 * s); ctx.lineTo(-10 * s, 15 * s); ctx.lineTo(12 * s, 15 * s); ctx.stroke();
  ctx.restore();
}
function laserHeat(m, dt) {
  const shooting = m.firing && !m.over;
  if (shooting) { m.heat += m.rate * dt; if (m.heat >= 1) { m.heat = 1; m.over = true; if (!HEADLESS) { sfx.overheat(); say('OVERHEATED!', '#ff7a5a', 0.9, 0.62); } } }
  else { m.heat = Math.max(0, m.heat - (m.firing ? 0.22 : 0.55) * dt); if (m.over && m.heat < 0.35) m.over = false; }
  return shooting;
}
function drawBeams(m, hx, hy, s) {
  const e = heroEye(hx, hy, s), now = performance.now() / 1000;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  for (const ox of [-2.7 * s, 2.7 * s]) {
    ctx.strokeStyle = 'rgba(255,60,30,.45)'; ctx.lineWidth = 9 * k; ctx.beginPath(); ctx.moveTo(e.x + ox, e.y); ctx.lineTo(m.fx, m.fy); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,200,160,.95)'; ctx.lineWidth = 2.5 * k; ctx.beginPath(); ctx.moveTo(e.x + ox, e.y); ctx.lineTo(m.fx, m.fy); ctx.stroke();
  }
  const g = ctx.createRadialGradient(m.fx, m.fy, 0, m.fx, m.fy, m.focusR); g.addColorStop(0, 'rgba(255,240,200,.9)'); g.addColorStop(0.35, 'rgba(255,110,50,.5)'); g.addColorStop(1, 'rgba(255,60,30,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(m.fx, m.fy, m.focusR * (0.9 + 0.1 * Math.sin(now * 40)), 0, 7); ctx.fill(); ctx.restore();
}
MT.zap = {
  make(sp) {
    const { f, e } = sp, sl = slowF(sp), sh = e > 0.4 ? 4 : 3;
    return { N: Math.min(20, Math.round(5 + f * 0.28)), spawned: 0, nextT: 1.0, int: Math.max(0.42, 1.6 - 0.6 * (1 - Math.exp(-f / 20)) - 0.006 * f) * (1 + 0.4 * e) * sl, vy: (62 + 1.8 * f) * (1 - 0.3 * e) * H / 844 / sl,
      focusR: (38 + 22 * e) * k, heat: 0, over: false, firing: false, fx: W / 2, fy: H / 2, rate: 0.46 * (1 - 0.25 * e), shield: sh, maxShield: sh, targets: [], civs: [], killed: 0, look: sp.look,
      civAt: sp.L >= 5 ? 2.5 + Math.random() * 2 : 1e9, hx: W / 2, hy: H * 0.82, splitOK: sp.L >= 8, bigCh: sp.L >= 4 ? 0.3 : 0 };
  },
  spawn(m, x, y, small) {
    const big = !small && Math.random() < m.bigCh, r = (big ? 24 : small ? 11 : 15) * k, hp = big ? 0.6 : small ? 0.2 : 0.32;
    m.targets.push({ x: x != null ? x : W * (0.1 + Math.random() * 0.8), y: y != null ? y : -r, r, hp, max: hp, big, vx: (small ? (Math.random() < 0.5 ? -1 : 1) * 70 : (Math.random() - 0.5) * 30) * W / 390, sp: 0.85 + Math.random() * 0.3, ph: Math.random() * 6, hitT: 0 });
    if (x == null) m.spawned++;
  },
  update(m, dt) {
    if (m.spawned < m.N && m.t >= m.nextT) { MT.zap.spawn(m); if (m.spawned < m.N && Math.random() < Math.min(0.3, m.f * 0.008)) MT.zap.spawn(m); m.nextT = m.t + m.int * (0.7 + Math.random() * 0.6); }
    const shooting = laserHeat(m, dt), wig = m.look === 'drone' || m.look === 'bee';
    for (const t of m.targets) {
      t.hitT = Math.max(0, t.hitT - dt); t.ph += dt;
      t.x += (t.vx + (wig ? Math.cos(t.ph * 3) * 60 * W / 390 : 0)) * dt; if (t.x < W * 0.06 || t.x > W * 0.94) { t.vx *= -1; t.x = clamp(t.x, W * 0.06, W * 0.94); }
      t.y += m.vy * t.sp * dt;
      if (shooting && dist(m.fx, m.fy, t.x, t.y) < t.r + m.focusR * 0.45) {
        t.hp -= dt; t.hitT = 0.08; if (!HEADLESS) sfx.zap();
        if (t.hp <= 0) {
          t.dead = true; m.killed++; G.stop = Math.max(G.stop, t.big ? 0.05 : 0.03);
          if (!HEADLESS) { sfx.pop(t.big); vibe(HAP.tick); burst(t.x, t.y, t.big ? 22 : 12, m.look === 'ice' ? ['#e8fbff', '#9fd8f0'] : ['#ffb03a', '#ff6a2a', '#5a4a3a'], 220, 0.6, 300); }
          if (t.big && m.splitOK) { MT.zap.spawn(m, t.x - 10, t.y, true); MT.zap.spawn(m, t.x + 10, t.y, true); }
        }
      }
      if (!t.dead && t.y > GY() - 8 * k) {
        t.dead = true; m.shield--; G.shake = Math.max(G.shake, 8);
        if (!HEADLESS) { sfx.boom(); burst(t.x, GY(), 18, ['#ffb03a', '#888', '#555'], 200, 0.7, 350); say('IMPACT!', '#ff7a5a', 0.9, 0.52); }
      }
    }
    m.targets = m.targets.filter(t => !t.dead);
    if (m.t >= m.civAt) { const dir = Math.random() < 0.5 ? 1 : -1; m.civs.push({ x: dir > 0 ? -50 * k : W + 50 * k, y: H * (0.25 + Math.random() * 0.25), vx: dir * (75 + m.f) * W / 390, r: 24 * k, burn: 0, hurt: false }); m.civAt = m.t + 5 + Math.random() * 4; }
    for (const c of m.civs) {
      c.x += c.vx * dt; if (c.hurt) c.y += 30 * dt;
      if (shooting && !c.hurt && dist(m.fx, m.fy, c.x, c.y) < c.r + m.focusR * 0.35) { c.burn += dt; if (c.burn > 0.15) { c.hurt = true; m.shield--; if (!HEADLESS) { sfx.oops(); say('WATCH THE HELICOPTER!', '#ff9a7a', 0.85, 0.52); } } }
    }
    m.civs = m.civs.filter(c => c.x > -80 * k && c.x < W + 80 * k);
    if (m.shield <= 0) finish(m, 'fail', `The city took too many hits. You zapped ${m.killed}.`);
    else if (m.spawned >= m.N && !m.targets.length) finish(m, 'win');
  },
  draw(m) {
    for (const c of m.civs) drawHeli(c);
    for (const t of m.targets) drawThreat(t, m.look);
    const s = 1.35 * k, shooting = m.firing && !m.over;
    drawHero(m.hx, m.hy, s, 'hover', { eyes: shooting });
    if (shooting) drawBeams(m, m.hx, m.hy, s);
    else if (m.firing) { ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(m.fx, m.fy, m.focusR * 0.6, 0, 7); ctx.stroke(); }
    meter(m.hx, m.hy - 76 * k, 70 * k, m.heat, m.heat > 0.75 ? '#ff7a3a' : '#ffd45a', m.over ? 'COOLING...' : 'HEAT', m.over);
    label(`CITY SHIELD ${'▮'.repeat(Math.max(0, m.shield))}${'▯'.repeat(Math.max(0, m.maxShield - m.shield))}`, W * 0.05, H * 0.95, 12, '#9fdcff', 'left');
    label(`${m.N - m.killed - (m.maxShield - m.shield)} left`, W * 0.95, H * 0.95, 12, '#fff', 'right');
  },
  down(m, x, y) { m.firing = true; m.fx = x; m.fy = y; }, move(m, x, y) { m.fx = x; m.fy = y; }, up(m) { m.firing = false; }
};

// ---------- FIGHT: tap bad guys, not bystanders ----------
const SPOTS = [[0.18, 0.72], [0.5, 0.68], [0.82, 0.72], [0.3, 0.86], [0.7, 0.86]];
const spotXY = i => ({ x: W * SPOTS[i][0], y: H * SPOTS[i][1] });
MT.fight = {
  make(sp) {
    const { f, e } = sp, sl = slowF(sp), hp = 3 + (e > 0.4 ? 1 : 0);
    return { N: Math.min(18, Math.round(4 + f * 0.3)), maxAt: Math.min(4, 1 + Math.floor(f / 6)), wind: Math.max(0.55, 1.55 - 0.85 * (1 - Math.exp(-f / 18))) * (1 + 0.5 * e) * sl,
      civCh: sp.L >= 3 ? 0.35 : 0, bigCh: sp.L >= 5 ? 0.25 : 0, hp, maxHp: hp, chars: [], ko: 0, spawned: 0, nextT: 0.8, busy: 0, hx: W / 2, hy: H * 0.95, fromX: W / 2, fromY: H * 0.95, dashT: 1, aim: -1.57, col: sp.gangCol, punchT: 1 };
  },
  free(m) { const used = new Set(m.chars.map(c => c.spot)); return [0, 1, 2, 3, 4].filter(i => !used.has(i)); },
  update(m, dt) {
    m.busy = Math.max(0, m.busy - dt); m.dashT += dt; m.punchT += dt;
    const thugs = m.chars.filter(c => c.thug && c.state !== 'ko');
    if (m.spawned < m.N && thugs.length < m.maxAt && m.t >= m.nextT) {
      const fr = MT.fight.free(m);
      if (fr.length) { const big = Math.random() < m.bigCh; m.chars.push({ spot: pick(fr), thug: true, big, hp: big ? 3 : 1 + (m.f > 14 && Math.random() < 0.4 ? 1 : 0), state: 'rise', st: 0, wind: m.wind * (big ? 1.2 : 1) * (0.85 + Math.random() * 0.3), idle: 0.25 + Math.random() * 0.4 }); m.spawned++; m.nextT = m.t + 0.45 + Math.random() * 0.5; }
    }
    if (m.civCh && m.t > 1 && Math.random() < dt * m.civCh) { const fr = MT.fight.free(m); if (fr.length) m.chars.push({ spot: pick(fr), thug: false, state: 'rise', st: 0, life: 1.6 + Math.random() * 1.2, look: personLook(pick(['p', 'old', 'kid', 'suit'])) }); }
    for (const c of m.chars) {
      c.st += dt;
      if (c.state === 'rise' && c.st > 0.3) { c.state = c.thug ? 'idle' : 'stand'; c.st = 0; }
      else if (c.state === 'idle' && c.st > c.idle) { c.state = 'wind'; c.st = 0; if (!HEADLESS) sfx.tell(); }
      else if (c.state === 'wind' && c.st >= c.wind) {
        c.state = 'swing'; c.st = 0; m.hp--; G.flash = 0.35; G.shake = Math.max(G.shake, 9); G.stop = Math.max(G.stop, 0.04);
        if (!HEADLESS) { sfx.hurt(); if (m.hp > 0) vibe(HAP.thud); say('OOF!', '#ff7a6b', 0.9, 0.46); }
      }
      else if (c.state === 'swing' && c.st > 0.35) { c.state = 'idle'; c.st = 0; c.idle = 0.35 + Math.random() * 0.4; }
      else if (c.state === 'stun' && c.st > 0.45) { c.state = 'idle'; c.st = 0; c.idle = 0.2; }
      else if (c.state === 'ko' && c.st > 0.8) c.gone = true;
      else if (c.state === 'stand' && c.st > c.life) { c.state = 'leave'; c.st = 0; }
      else if (c.state === 'leave' && c.st > 0.35) c.gone = true;
    }
    m.chars = m.chars.filter(c => !c.gone);
    if (m.hp <= 0) finish(m, 'fail', `They got the better of you. You knocked out ${m.ko} of ${m.N}.`);
    else if (m.ko >= m.N) finish(m, 'win');
  },
  down(m, x, y) {
    if (m.busy > 0) return;
    let best = null, bd = 1e9;
    for (const c of m.chars) {
      if (c.state === 'ko' || c.state === 'leave') continue;
      const p = spotXY(c.spot), sc = c.thug && c.big ? 1.3 : 1, d = dist(x, y, p.x, p.y - 48 * k * sc);
      if (d < 56 * k * sc && d < bd) { bd = d; best = c; }
    }
    m.fromX = m.hx; m.fromY = m.hy; m.dashT = 0;
    if (!best) { m.busy = 0.35; m.punchT = 0; m.hx = lerp(m.hx, x, 0.5); m.hy = clamp(lerp(m.hy, y + 30 * k, 0.5), H * 0.45, H * 0.92); m.aim = -1.57; if (!HEADLESS) { sfx.whiff(); say('MISSED', '#cfd8e3', 0.7, 0.46); } return; }
    const p = spotXY(best.spot), side = p.x < W / 2 ? 1 : -1;
    m.hx = p.x + side * 40 * k; m.hy = p.y - 6 * k; m.aim = side > 0 ? Math.PI : 0; m.punchT = 0;
    if (!best.thug) { m.hp--; m.busy = 0.6; best.state = 'leave'; best.st = 0; G.flash = 0.2; if (!HEADLESS) { sfx.oops(); say('NOT A BAD GUY!', '#ff9a7a', 0.9, 0.46); } return; }
    best.hp--; m.busy = 0.2; G.stop = Math.max(G.stop, best.hp <= 0 ? 0.07 : 0.045); G.kx += -side * 6 * k;
    if (!HEADLESS) { sfx.punch(best.big); vibe(HAP.tick); burst(p.x, p.y - 48 * k, 10, ['#ffffff', '#ffd45a'], 180, 0.4, 100); }
    if (best.hp <= 0) { best.state = 'ko'; best.st = 0; best.vx = -side * 520 * W / 390; m.ko++; if (!HEADLESS) { sfx.ko(); say(pick(['POW!', 'WHAM!', 'BAM!', 'KAPOW!', 'THWACK!']), '#ffd45a', 1.1, 0.4); } }
    else { best.state = 'stun'; best.st = 0; }
  },
  move() {}, up() {},
  draw(m) {
    const order = m.chars.slice().sort((a, b) => SPOTS[a.spot][1] - SPOTS[b.spot][1]);
    for (const c of order) {
      const p = spotXY(c.spot), rise = c.state === 'rise' ? c.st / 0.3 : c.state === 'leave' ? 1 - c.st / 0.35 : 1;
      ctx.save(); ctx.globalAlpha = clamp(rise, 0, 1);
      if (c.thug) {
        let x = p.x, y = p.y + (1 - rise) * 20 * k, rot = 0;
        if (c.state === 'ko') { x += c.vx * c.st; y -= (500 * c.st - 700 * c.st * c.st) * k; rot = c.st * 12 * Math.sign(c.vx); }
        drawThug(x, y, 1.4 * k, { big: c.big, state: c.state, st: c.st, wind: c.wind, rot }, m.col);
        if (c.state === 'swing') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,80,60,${0.6 * (1 - c.st / 0.35)})`; ctx.beginPath(); ctx.arc(p.x, p.y - 48 * k, 60 * k * (1 + c.st), 0, 7); ctx.fill(); ctx.restore(); }
      } else drawPerson(p.x, p.y + (1 - rise) * 20 * k, 1.4 * k, c.look, 'scared');
      ctx.restore();
    }
    const dp = clamp(m.dashT / 0.09, 0, 1), hx = lerp(m.fromX, m.hx, easeOut(dp)), hy = lerp(m.fromY, m.hy, easeOut(dp));
    drawHero(hx, hy, 1.3 * k, m.punchT < 0.25 ? 'punch' : 'hover', { aim: m.aim });
    heroHearts(m, hx, hy - 66 * k);
    label(`${m.ko} / ${m.N} knocked out`, W / 2, H * 0.97, 13);
  }
};

// ---------- BLOW: super breath on burning windows ----------
MT.fire = {
  make(sp) {
    const { f, e } = sp, sl = slowF(sp), rows = sp.L >= 10 ? 5 : 4, cols = 3, x0 = W * 0.16, x1 = W * 0.84, y0 = H * 0.2, y1 = GY() - 50 * k;
    const cw = (x1 - x0) / cols, rh = (y1 - y0 - 20 * k) / rows, win = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) win.push({ r, c, x: x0 + (c + 0.5) * cw, y: y0 + 30 * k + (r + 0.5) * rh, w: cw * 0.62, h: rh * 0.62, I: 0, sp: 0, out: 0, look: personLook(pick(['p', 'old', 'kid'])) });
    return { win, rows, cols, x0, x1, y0, y1: GY(), N: Math.min(16, Math.round(4 + f * 0.25)), ign: 0, nextT: 0.6, initial: Math.min(3, 2 + Math.floor(f / 12)), gap: Math.max(0.9, 3 - 0.04 * f) * (1 + 0.4 * e) * sl,
      gr: (0.075 + 0.004 * f) * (1 - 0.4 * e) / sl, br: 1.0 * (1 + 0.3 * e), breath: 1, bOut: false, blowing: false, fx: W / 2, fy: H / 2, limit: 3, saved: 0, hx: W / 2, hy: H * 0.93, col: pick(['#b5523b', '#9c6b4e', '#c98b5a', '#7d5a8c', '#5a7d9a']) };
  },
  winAt(m, x, y) { const pad = 12 * k; return m.win.find(w => Math.abs(x - w.x) < w.w / 2 + pad && Math.abs(y - w.y) < w.h / 2 + pad); },
  update(m, dt) {
    if (m.ign < m.N && m.t >= m.nextT) { const cand = m.win.filter(w => w.I <= 0); if (cand.length) { pick(cand).I = 0.12; m.ign++; } m.nextT = m.ign < m.initial ? m.t + 0.15 : m.t + m.gap * (0.7 + Math.random() * 0.6); }
    for (const w of m.win) {
      w.out = Math.max(0, w.out - dt);
      if (w.I > 0) { w.I = Math.min(1, w.I + m.gr * dt); if (w.I >= 1) { w.sp += dt; if (w.sp > 2.4) { w.sp = 0; const nb = m.win.filter(o => Math.abs(o.r - w.r) + Math.abs(o.c - w.c) === 1 && o.I <= 0); if (nb.length) pick(nb).I = 0.15; } } }
    }
    const blowing = m.blowing && !m.bOut;
    if (blowing) {
      m.breath -= 0.42 * dt; if (m.breath <= 0) { m.breath = 0; m.bOut = true; if (!HEADLESS) say('OUT OF BREATH!', '#9fdcff', 0.85, 0.66); }
      const w = MT.fire.winAt(m, m.fx, m.fy);
      if (w && w.I > 0) { w.I -= m.br * dt * (w.I >= 1 ? 0.55 : 1); if (w.I <= 0) { w.I = 0; w.sp = 0; w.out = 1.2; m.saved++; if (!HEADLESS) { sfx.hiss(); vibe(HAP.tick); burst(w.x, w.y, 14, ['#e8eef5', '#c9d6e3', '#ffffff'], 120, 0.8, -60, 5); } } }
    } else { m.breath = Math.min(1, m.breath + 0.33 * dt); if (m.bOut && m.breath > 0.3) m.bOut = false; }
    const eng = m.win.filter(w => w.I >= 1).length;
    if (eng >= m.limit) finish(m, 'fail', `The fire spread too far. Everyone got out by the stairs, just.`);
    else if (m.ign >= m.N && m.win.every(w => w.I <= 0)) finish(m, 'win');
  },
  draw(m) {
    const now = performance.now() / 1000, bw = m.x1 - m.x0;
    ctx.fillStyle = shade(m.col, 0.8); ctx.fillRect(m.x0 - 14 * k, m.y0, bw + 28 * k, m.y1 - m.y0);
    ctx.fillStyle = shade(m.col, 0.6); ctx.fillRect(m.x0 - 20 * k, m.y0 - 10 * k, bw + 40 * k, 14 * k);
    ctx.strokeStyle = 'rgba(0,0,0,.08)'; ctx.lineWidth = 1; for (let y = m.y0 + 8; y < m.y1; y += 9 * k) { ctx.beginPath(); ctx.moveTo(m.x0 - 14 * k, y); ctx.lineTo(m.x1 + 14 * k, y); ctx.stroke(); }
    ctx.fillStyle = '#4a2e1a'; ctx.fillRect(W / 2 - 16 * k, m.y1 - 46 * k, 32 * k, 46 * k);
    for (const w of m.win) {
      ctx.fillStyle = w.I > 0 ? '#3a1a0a' : '#26384a'; ctx.fillRect(w.x - w.w / 2, w.y - w.h / 2, w.w, w.h);
      ctx.strokeStyle = shade(m.col, 0.5); ctx.lineWidth = 3 * k; ctx.strokeRect(w.x - w.w / 2, w.y - w.h / 2, w.w, w.h);
      if (w.I > 0 || w.out > 0) { ctx.save(); ctx.beginPath(); ctx.rect(w.x - w.w / 2, w.y - w.h / 2, w.w, w.h); ctx.clip(); drawPerson(w.x + w.w * 0.18, w.y + w.h / 2 + 10 * k, 0.75 * k, w.look, w.out > 0 ? 'wave' : 'scared'); ctx.restore(); }
      if (w.I > 0) {
        const I = w.I, fh = w.h * (0.4 + I * 1.1), eng = I >= 1;
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 5; i++) {
          const fx = w.x + (i - 2) * w.w * 0.18, fl = fh * (0.6 + 0.4 * Math.sin(now * 9 + i * 1.7 + w.c)), g = ctx.createLinearGradient(0, w.y + w.h / 2, 0, w.y + w.h / 2 - fl);
          g.addColorStop(0, 'rgba(255,200,80,.85)'); g.addColorStop(0.5, 'rgba(255,110,30,.7)'); g.addColorStop(1, 'rgba(255,60,20,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(fx - w.w * 0.14, w.y + w.h / 2); ctx.quadraticCurveTo(fx - w.w * 0.1, w.y + w.h / 2 - fl * 0.5, fx + Math.sin(now * 6 + i) * 4, w.y + w.h / 2 - fl); ctx.quadraticCurveTo(fx + w.w * 0.1, w.y + w.h / 2 - fl * 0.5, fx + w.w * 0.14, w.y + w.h / 2); ctx.fill();
        }
        ctx.restore();
        ctx.fillStyle = `rgba(60,60,60,${0.25 + I * 0.25})`; ctx.beginPath(); ctx.arc(w.x + Math.sin(now + w.c) * 6, w.y - w.h / 2 - fh * 0.5, 10 * k + I * 12 * k, 0, 7); ctx.fill();
        if (eng) { ctx.strokeStyle = `rgba(255,60,40,${0.6 + 0.4 * Math.sin(now * 10)})`; ctx.lineWidth = 3; ctx.strokeRect(w.x - w.w / 2 - 4, w.y - w.h / 2 - 4, w.w + 8, w.h + 8); }
      }
      if (w.out > 0) label('THANKS!', w.x, w.y - w.h / 2 - 6 * k, 11, '#bff7d0');
    }
    const blowing = m.blowing && !m.bOut;
    drawHero(m.hx, m.hy, 1.25 * k, 'hover', { blow: blowing });
    if (blowing) {
      const mx = m.hx, my = m.hy - 29.5 * 1.25 * k, a = Math.atan2(m.fy - my, m.fx - mx), L = dist(mx, my, m.fx, m.fy);
      ctx.save(); ctx.translate(mx, my); ctx.rotate(a); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 9; i++) { const p = ((now * 2.4 + i / 9) % 1), x = p * L, sp2 = 6 + p * 28 * k; ctx.strokeStyle = `rgba(210,235,255,${0.5 * (1 - p)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 14 * k, Math.sin(i * 2.3) * sp2); ctx.lineTo(x, Math.sin(i * 2.3) * sp2); ctx.stroke(); }
      const g = ctx.createLinearGradient(0, 0, L, 0); g.addColorStop(0, 'rgba(200,230,255,.25)'); g.addColorStop(1, 'rgba(200,230,255,.05)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(L, -30 * k); ctx.lineTo(L, 30 * k); ctx.lineTo(0, 3); ctx.fill();
      ctx.restore();
    }
    meter(m.hx, m.hy - 70 * k, 70 * k, m.breath, '#9fdcff', m.bOut ? 'CATCHING BREATH' : 'BREATH', m.bOut);
    const eng = m.win.filter(w => w.I >= 1).length, burning = m.win.filter(w => w.I > 0).length;
    label(`${burning} burning${eng ? ` · ${eng}/${m.limit} out of control` : ''}`, W / 2, H * 0.12 + 40 * k, 12, eng ? '#ff9a7a' : '#fff');
  },
  down(m, x, y) { m.blowing = true; m.fx = x; m.fy = y; }, move(m, x, y) { m.fx = x; m.fy = y; }, up(m) { m.blowing = false; }
};

// ---------- LIFT: hold to lift, slide to keep it level ----------
function drawVehicle(kind, col, w, h) {
  ctx.fillStyle = col; rrect(-w / 2, -h / 2, w, h, 8 * k); ctx.fill();
  ctx.fillStyle = shade(col, 0.7); ctx.fillRect(-w / 2, h * 0.22, w, h * 0.12);
  const n = kind === 'van' ? 3 : 5, ww = w / (n + 1);
  for (let i = 0; i < n; i++) { ctx.fillStyle = '#bfe4f6'; rrect(-w / 2 + ww * 0.5 + i * ww * 1.05, -h * 0.35, ww * 0.8, h * 0.38, 3 * k); ctx.fill(); ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(-w / 2 + ww * 0.9 + i * ww * 1.05, -h * 0.1, 3.5 * k, 0, 7); ctx.fill(); }
  if (kind === 'cable') { ctx.strokeStyle = '#444'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -h / 2); ctx.lineTo(0, -h / 2 - 20 * k); ctx.stroke(); }
  else { ctx.fillStyle = '#222'; for (const wx of [-w * 0.3, w * 0.3]) { ctx.beginPath(); ctx.arc(wx, h / 2, 9 * k, 0, 7); ctx.fill(); ctx.fillStyle = '#888'; ctx.beginPath(); ctx.arc(wx, h / 2, 3.5 * k, 0, 7); ctx.fill(); ctx.fillStyle = '#222'; } }
  if (kind === 'truck') { ctx.fillStyle = shade(col, 1.2); rrect(w / 2 - w * 0.28, -h / 2 - 2, w * 0.28, h * 0.55, 5 * k); ctx.fill(); }
}
MT.lift = {
  make(sp) {
    const { f, e } = sp, sl = slowF(sp);
    return { p: 0, th: 0, om: 0, n: 0, rate: 1 / (5.5 + 0.08 * f) * (1 + 0.3 * e), a: (0.75 + 0.045 * f) * (1 - 0.45 * e) / sl, noise: (0.75 + 0.035 * f) * (1 - 0.55 * e) / sl, gust: sp.L >= 6, gT: 2 + Math.random() * 2,
      gain: 5, damp: 1.6, bias: (Math.random() < 0.5 ? -1 : 1) * (0.35 + 0.012 * f) * (1 - 0.6 * e) / sl, flipped: false, slips: 0, maxSlips: e > 0.4 ? 4 : 3, holding: false, fx: W / 2, veh: sp.veh, col: sp.vehCol, slipT: 0, gustFx: 0, gustDir: 1 };
  },
  update(m, dt) {
    const u = m.holding ? clamp((m.fx - W / 2) / (W * 0.4), -1, 1) : 0;
    m.n += ((Math.random() * 2 - 1) * m.noise * 2.2 - m.n) * Math.min(1, dt * 1.4);
    m.gustFx = Math.max(0, m.gustFx - dt); m.slipT = Math.max(0, m.slipT - dt);
    if (m.gust) { m.gT -= dt; if (m.gT <= 0) { m.gustDir = Math.random() < 0.5 ? -1 : 1; m.om += m.gustDir * (0.5 + 0.015 * m.f); m.gT = 2.2 + Math.random() * 2; m.gustFx = 0.8; if (!HEADLESS) sweep(0.7, 400, 1200, 0.18, 0.7); } }
    if (!m.flipped && m.p > 0.45) { m.flipped = true; if (Math.random() < 0.5) { m.bias = -m.bias; if (!HEADLESS) say('THEY SHIFTED SIDES!', '#ffd45a', 0.75, 0.5); } }   // passengers crowd to one side
    const acc = m.a * m.th * (m.holding ? 1 : 1.6) + m.n + m.bias - m.damp * m.om - m.gain * u;
    m.om += acc * dt; m.th += m.om * dt;
    if (m.holding) m.p += m.rate * dt * (1 - Math.min(0.85, Math.abs(m.th) / 0.5)); else m.p = Math.max(0, m.p - 0.05 * dt);
    if (Math.abs(m.th) > 0.32 && !HEADLESS) sfx.creak();
    if (Math.abs(m.th) > 0.55) {
      m.slips++; m.p = Math.max(0, m.p - 0.22); m.th = 0; m.om = 0; m.slipT = 0.6; G.shake = Math.max(G.shake, 10);
      if (!HEADLESS) { sfx.slip(); say('SLIPPING!', '#ff9a7a', 1, 0.5); }
      if (m.slips >= m.maxSlips) finish(m, 'fail', 'It slipped away. Luckily the safety nets caught it.');
    }
    if (m.p >= 1 && !m.result) { m.p = 1; if (!HEADLESS) sfx.thud(); finish(m, 'win'); }
  },
  draw(m) {
    const edgeY = H * 0.34, ex = W * 0.66, now = performance.now() / 1000;
    // the edge it hangs from
    if (m.sc === 'mountain') { ctx.fillStyle = '#6b5a4a'; ctx.beginPath(); ctx.moveTo(-W, edgeY - 20 * k); ctx.lineTo(ex, edgeY - 20 * k); ctx.lineTo(ex - 20 * k, edgeY + 60 * k); ctx.lineTo(ex - 60 * k, H * 0.7); ctx.lineTo(-W, H * 0.7); ctx.fill(); ctx.fillStyle = '#5a5a5a'; ctx.fillRect(-W, edgeY - 28 * k, W + ex, 10 * k); }
    else { ctx.fillStyle = m.sc === 'harbor' ? '#8a6a4a' : '#57606f'; ctx.fillRect(-W, edgeY - 22 * k, W + ex, 16 * k); ctx.fillStyle = '#2f3542'; ctx.fillRect(-W, edgeY - 6 * k, W + ex, 6 * k); ctx.fillStyle = m.sc === 'harbor' ? '#8a6a4a' : '#57606f'; ctx.beginPath(); ctx.moveTo(ex, edgeY - 22 * k); ctx.lineTo(ex + 12 * k, edgeY - 14 * k); ctx.lineTo(ex + 4 * k, edgeY - 8 * k); ctx.lineTo(ex + 14 * k, edgeY); ctx.lineTo(ex, edgeY); ctx.fill(); }
    const vw = 170 * k, vh = 70 * k, vy = lerp(H * 0.66, edgeY - 22 * k - vh / 2 - 8 * k, easeOut(m.p)), vx = W / 2;
    if (m.gustFx > 0) { ctx.strokeStyle = `rgba(255,255,255,${m.gustFx * 0.5})`; ctx.lineWidth = 2; for (let i = 0; i < 6; i++) { const y = vy - 60 * k + i * 24 * k, x = ((now * 600 * m.gustDir + i * 90) % (W + 200)) - 100; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 50 * m.gustDir, y); ctx.stroke(); } }
    ctx.save(); ctx.translate(vx, vy); ctx.rotate(m.th); drawVehicle(m.veh, m.col, vw, vh); ctx.restore();
    const hy = vy + vh / 2 + 60 * k;
    drawHero(vx + m.th * 30 * k, hy, 1.35 * k, m.holding ? 'lift' : 'hover');
    // tilt warning and the way to slide
    const tilt = Math.abs(m.th) / 0.55;
    if (tilt > 0.45) { ctx.strokeStyle = `rgba(255,80,60,${tilt})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(vx, vy, vw * 0.62, -Math.PI / 2 + m.th - 0.4, -Math.PI / 2 + m.th + 0.4); ctx.stroke(); }
    if (m.sp.L <= 6 && tilt > 0.35 && m.holding) label(m.th > 0 ? 'SLIDE  →' : '←  SLIDE', W / 2, hy + 44 * k, 15, '#ffd45a');
    if (!m.holding && !m.result) label('HOLD TO LIFT', W / 2, hy + 44 * k, 15, '#ffd45a');
    ctx.fillStyle = 'rgba(0,0,0,.4)'; rrect(W * 0.92, H * 0.3, 10 * k, H * 0.4, 5 * k); ctx.fill();
    ctx.fillStyle = '#9ff0c8'; rrect(W * 0.92, H * 0.3 + H * 0.4 * (1 - m.p), 10 * k, H * 0.4 * m.p, 5 * k); ctx.fill();
    label(`${'✕'.repeat(m.slips)}${'·'.repeat(Math.max(0, m.maxSlips - m.slips))}`, W * 0.92 + 5 * k, H * 0.3 - 8 * k, 12, m.slips ? '#ff9a7a' : '#fff');
  },
  down(m, x) { m.holding = true; m.fx = x; }, move(m, x) { m.fx = x; }, up(m) { m.holding = false; }
};

// ---------- DODGE & ZAP: giant monsters and super villains ----------
MT.monster = MT.villain = {
  make(sp) {
    const { f, e } = sp, sl = slowF(sp), v = sp.type === 'villain', hp = 3 + (e > 0.4 ? 1 : 0);
    return { v, col: sp.col, body: sp.body, name: sp.name, lanes: [0.2, 0.5, 0.8], lane: 1, hx: W * 0.5, hy: H * 0.84, tel: Math.max(0.45, 1.25 - 0.55 * (1 - Math.exp(-f / 20))) * (1 + 0.5 * e) * (v ? 0.92 : 1) * sl,
      per: 2 + (f > 8 ? 1 : 0), openT: Math.max(0.9, 2.3 - 0.02 * f) * (1 + 0.3 * e), D: (1.2 + 0.06 * f) * (v ? 1.4 : 1), dmg: 0, hp, maxHp: hp, st: 'intro', stt: 0, left: 2, danger: [], cur: null,
      heat: 0, over: false, firing: false, fx: W / 2, fy: H / 2, rate: 0.46 * (1 - 0.25 * e), focusR: (38 + 22 * e) * k, ptr: null, raise: 0, armT: 0, cx: W / 2, cy: H * 0.37, S: k * (v ? 1.45 : 1.6), coreFx: 0, moveCd: 0, dead: false };
  },
  core(m) { return { x: m.cx, y: m.cy - (m.v ? 22 : 18) * m.S, r: 20 * m.S * 0.8 }; },
  startTele(m) {
    const r = Math.random(), L = m.sp.L;
    if (L >= 10 && r < 0.3) { m.danger = [0, 2]; m.kind = 'rain'; }
    else if (r < (L >= 10 ? 0.55 : 0.6)) { const l = Math.random() < 0.6 ? m.lane : (Math.random() * 3) | 0; m.danger = [l]; m.kind = 'slam'; }
    else { m.danger = Math.random() < 0.5 ? [0, 1] : [1, 2]; m.kind = 'sweep'; }
    m.cur = { tel: m.tel * (0.9 + Math.random() * 0.2) }; m.st = 'tele'; m.stt = 0;
    const avg = m.danger.reduce((a, b) => a + b, 0) / m.danger.length; m.raise = avg < 1 ? -1 : avg > 1 ? 1 : (Math.random() < 0.5 ? -1 : 1);
    if (!HEADLESS) sfx.roar(false);
  },
  update(m, dt) {
    m.stt += dt; m.moveCd = Math.max(0, m.moveCd - dt); m.armT = Math.max(0, m.armT - dt); m.coreFx = Math.max(0, m.coreFx - dt);
    m.hx = lerp(m.hx, W * m.lanes[m.lane], Math.min(1, dt * 18));
    const shooting = laserHeat(m, dt);
    if (m.dead) return;
    if (m.st === 'intro' && m.stt > 1.1) { m.left = m.per; MT.monster.startTele(m); }
    else if (m.st === 'tele' && m.stt >= m.cur.tel) {
      m.st = 'strike'; m.stt = 0; G.shake = Math.max(G.shake, 10);
      if (!HEADLESS) sfx.slam();
      if (m.danger.includes(m.lane)) { m.hp--; G.flash = 0.4; G.stop = Math.max(G.stop, 0.05); if (!HEADLESS) { sfx.hurt(); if (m.hp > 0) vibe(HAP.thud); say('HIT!', '#ff7a6b', 1, 0.62); } }
      else if (!HEADLESS) say('DODGED!', '#9ff0c8', 0.85, 0.62);
    }
    else if (m.st === 'strike' && m.stt > 0.35) { m.left--; m.raise = 0; if (m.left > 0) MT.monster.startTele(m); else { m.st = 'open'; m.stt = 0; m.danger = []; if (!HEADLESS) { sfx.ring(4); say('CORE OPEN! ZAP IT!', '#ffd45a', 0.9, 0.62); } } }
    else if (m.st === 'open' && m.stt >= m.openT) { m.st = 'close'; m.stt = 0; }
    else if (m.st === 'close' && m.stt > 0.5) { m.left = m.per; MT.monster.startTele(m); }
    if (shooting) {
      const c = MT.monster.core(m);
      if (m.st === 'open' && dist(m.fx, m.fy, c.x, c.y) < c.r + m.focusR * 0.5) { m.dmg += dt; m.coreFx = 0.08; if (!HEADLESS) sfx.zap(); }
      else if (dist(m.fx, m.fy, m.cx, m.cy) < 75 * m.S && (m.heat += m.rate * 0.7 * dt, m.armT <= 0)) { m.armT = 0.8; if (!HEADLESS) { sfx.armor(); say('ARMOUR! WAIT FOR THE CORE', '#cfd8e3', 0.75, 0.66); } }
    }
    if (m.dmg >= m.D) { m.dead = true; m.deadT = 0; G.stop = 0.14; G.slow = 0.9; if (!HEADLESS) { sfx.boom(); burst(m.cx, m.cy, 50, [m.col[1], m.col[0], '#ffffff'], 380, 1.1, 250, 5); } finish(m, 'win'); }
    else if (m.hp <= 0) finish(m, 'fail', `${m.name} knocked you out of the sky. You'll be back.`);
  },
  draw(m) {
    const now = performance.now() / 1000;
    // danger zones while he winds up
    if (m.st === 'tele' || m.st === 'strike') {
      const p = m.st === 'tele' ? m.stt / m.cur.tel : 1;
      for (const l of m.danger) {
        const x = W * m.lanes[l], w = W * 0.28;
        ctx.fillStyle = m.st === 'strike' ? `rgba(255,240,200,${0.7 * (1 - m.stt / 0.35)})` : `rgba(255,50,40,${0.12 + 0.3 * p + 0.08 * Math.sin(now * 20)})`;
        ctx.fillRect(x - w / 2, H * 0.5, w, H * 0.5);
        if (m.st === 'tele') label('!', x, H * 0.62, 30, '#ffdddd');
      }
    }
    for (let l = 0; l < 3; l++) { ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.ellipse(W * m.lanes[l], m.hy + 34 * k, 34 * k, 7 * k, 0, 0, 7); ctx.fill(); }
    if (!m.dead || m.deadT < 0) {
      const st = { raise: m.st === 'tele' ? m.raise : 0, roar: m.st === 'tele' };
      if (m.v) drawVillain(m.cx, m.cy, m.S, m, st); else drawMonster(m.cx, m.cy, m.S, m, st);
      const c = MT.monster.core(m);
      if (m.st === 'open') {
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; const r = c.r * (1.1 + 0.15 * Math.sin(now * 12)), g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, r * 2.2); g.addColorStop(0, '#ffffff'); g.addColorStop(0.3, m.col[1]); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.x, c.y, r * 2.2, 0, 7); ctx.fill(); ctx.restore();
        if (m.coreFx > 0) burst(c.x, c.y, 2, ['#ffffff', m.col[1]], 200, 0.3, 0, 2.5);
      } else { ctx.fillStyle = '#3a3f48'; ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, 7); ctx.fill(); ctx.fillStyle = '#7b8494'; for (let i = 0; i < 4; i++) { const a = i * 1.57 + 0.78; ctx.beginPath(); ctx.arc(c.x + Math.cos(a) * c.r * 0.65, c.y + Math.sin(a) * c.r * 0.65, 2.2 * k, 0, 7); ctx.fill(); } }
    }
    const s = 1.3 * k, shooting = m.firing && !m.over;
    drawHero(m.hx, m.hy, s, 'hover', { eyes: shooting });
    if (shooting) drawBeams(m, m.hx, m.hy, s);
    meter(m.hx, m.hy - 74 * k, 70 * k, m.heat, m.heat > 0.75 ? '#ff7a3a' : '#ffd45a', m.over ? 'COOLING...' : 'HEAT', m.over);
    heroHearts(m, m.hx, m.hy + 52 * k);
    // boss health
    const bw = W * 0.7; label(m.name.toUpperCase(), W / 2, H * 0.12 + 34 * k, 13, m.col[1]);
    ctx.fillStyle = 'rgba(0,0,0,.45)'; rrect(W / 2 - bw / 2, H * 0.12 + 40 * k, bw, 9 * k, 4 * k); ctx.fill();
    ctx.fillStyle = m.col[1]; rrect(W / 2 - bw / 2, H * 0.12 + 40 * k, Math.max(0.001, bw * (1 - m.dmg / m.D)), 9 * k, 4 * k); ctx.fill();
    if (m.sp.L <= 9 && m.st === 'tele' && m.danger.includes(m.lane)) label('FLICK  ←  →', W / 2, H * 0.97, 15, '#ffd45a');
  },
  flick(m, dir) { if (m.moveCd > 0 || m.dead) return; const nl = clamp(m.lane + dir, 0, 2); if (nl !== m.lane) { m.lane = nl; m.moveCd = 0.12; if (!HEADLESS) sfx.whiff(); } },
  down(m, x, y) { m.ptr = { x0: x, y0: y, t0: m.t, flicked: false }; m.firing = true; m.fx = x; m.fy = y; },
  move(m, x, y) {
    const p = m.ptr; m.fx = x; m.fy = y; if (!p || p.flicked) return;
    const dx = x - p.x0, dy = y - p.y0;
    if (m.t - p.t0 < 0.28 && Math.abs(dx) > 40 * k && Math.abs(dx) > Math.abs(dy) * 1.2) { p.flicked = true; m.firing = false; MT.monster.flick(m, dx > 0 ? 1 : -1); }
  },
  up(m, x, y) { const p = m.ptr; if (p && !p.flicked) { const dx = x - p.x0; if (m.t - p.t0 < 0.28 && Math.abs(dx) > 40 * k && Math.abs(dx) > Math.abs(y - p.y0) * 1.2) MT.monster.flick(m, dx > 0 ? 1 : -1); } m.firing = false; m.ptr = null; }
};
