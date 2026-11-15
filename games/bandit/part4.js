
// ---------- part 4: sounds, what you feel and read, the two thumbs, the screens, the loop ----------
const sfx = {
  click() { const v = vary(); noise(0.012, 5000 * v, 0.2, 'highpass'); tone(1500 * v, 0.04, 0.05, 'triangle', 0, null, 4000); },
  seek(p) { if (!gate('seek', 60)) return; tone(520 + 400 * (p || 0), 0.055, 0.1, 'triangle', 0, null, 3200); noise(0.008, 5000, 0.05, 'highpass'); },                // the ring is on him: ticks that climb
  locked() { tone(784, 0.11, 0.08, 'triangle', 0, null, 5000); tone(1175, 0.2, 0.08, 'triangle', 0.07, null, 5000); noise(0.01, 6000, 0.12, 'highpass'); },
  launch() { const v = vary(0.04); noise(0.05, 3200, 0.3, 'highpass'); noise(0.6, 650 * v, 0.55, 'bandpass', 0.6); tone(210 * v, 0.45, 0.22, 'sine', 0, 70); tone(900 * v, 0.3, 0.05, 'triangle', 0.02, 300, 2500); },
  warn(p) { if (!gate('warn', 90)) return; tone(330 + 90 * (p || 0), 0.08, 0.15, 'sine'); tone(660 + 180 * (p || 0), 0.05, 0.03, 'sine'); },                                        // he has you in his sights
  alarm() { if (!gate('alarm', 70)) return; tone(620, 0.07, 0.12, 'triangle', 0, null, 3000); tone(465, 0.07, 0.1, 'triangle', 0.075, null, 3000); },   // his missile is on its way
  flare() { const v = vary(); tone(420 * v, 0.07, 0.15, 'sine', 0, 780 * v); noise(0.012, 5200, 0.16, 'highpass'); noise(0.3, 2300, 0.14, 'bandpass', 0.8); },
  evade() { tone(note(659, 0), 0.12, 0.1, 'triangle', 0, null, 6000); tone(note(659, 2), 0.2, 0.1, 'triangle', 0.08, null, 6000); tone(note(1318, 2), 0.16, 0.03, 'sine', 0.1); },
  gun() { if (!gate('gun', 62)) return; const v = vary(); noise(0.05, 1500 * v, 0.42, 'lowpass'); tone(150 * v, 0.055, 0.26, 'sine', 0, 85); noise(0.008, 6000, 0.12, 'highpass'); },
  gunFar() { if (!gate('gunFar', 80)) return; noise(0.05, 900, 0.12, 'lowpass'); },
  tick() { if (!gate('tick', 75)) return; const v = vary(); noise(0.015, 5200, 0.22, 'highpass'); tone(980 * v, 0.035, 0.09, 'triangle', 0, null, 4000); },   // your cannon finds him
  thud() { if (!gate('thud', 110)) return; noise(0.07, 520, 0.5); tone(125, 0.09, 0.24, 'sine', 0, 70); },                                                 // his cannon finds you
  hit() { noise(0.02, 5000, 0.35, 'highpass'); noise(0.4, 420, 0.75); tone(130, 0.35, 0.4, 'sine', 0, 50); tone(210, 0.2, 0.16, 'triangle', 0, 80, 900); },
  boom() { noise(0.03, 6000, 0.4, 'highpass'); noise(0.95, 360, 0.9); tone(115, 0.75, 0.5, 'sine', 0, 40); tone(196, 0.45, 0.22, 'triangle', 0, 62, 900); noise(1.4, 900, 0.16, 'bandpass', 0.5, 0.12); },
  pop() { noise(0.02, 4500, 0.2, 'highpass'); noise(0.3, 520, 0.4); tone(160, 0.2, 0.18, 'sine', 0, 70); },
  splash(n) { const s = Math.max(0, (n | 0) - 1); [0, 2, 4].forEach((q, i) => tone(note(523, q + s), 0.24, 0.11, 'triangle', 0.15 + i * 0.085, null, 6000)); },
  win(boss) { [0, 2, 4, 5, 7].forEach((q, i) => tone(note(392, q), i === 4 ? 0.7 : 0.2, 0.11, 'triangle', i * 0.11, null, 6000)); tone(note(784, 7), 0.6, 0.035, 'sine', 0.46); if (boss) [0, 4, 7].forEach((q, i) => tone(note(196, q), 0.9, 0.07, 'triangle', 0.5 + i * 0.02, null, 2500)); },
  lose() { tone(220, 0.35, 0.11, 'triangle', 0, null, 2000); tone(185, 0.6, 0.11, 'triangle', 0.2, 147, 2000); noise(0.4, 280, 0.3); },
  best() { [0, 2, 4].forEach((s, i) => tone(note(659, s), 0.2, 0.1, 'sine', i * 0.08)); },
  rearm() { const v = vary(); noise(0.01, 4200, 0.18, 'highpass'); tone(700 * v, 0.06, 0.09, 'triangle', 0, 900 * v, 4000); },
  empty() { if (!gate('empty', 150)) return; noise(0.02, 1200, 0.16); tone(240, 0.05, 0.05, 'triangle', 0, null, 1500); },
  low() { tone(294, 0.14, 0.08, 'triangle', 0, null, 2500); tone(247, 0.2, 0.08, 'triangle', 0.16, null, 2500); }
};
let LOOPS = null;
function ensureLoops() { if (LOOPS || !actx || HEADLESS) return; LOOPS = { eng: bed(120, 0.6, 0, 0.3, 'lowpass'), air: bed(1100, 0.5, 0, 0.21) }; }
function loopsOff() { if (LOOPS) { LOOPS.eng && LOOPS.eng.set(0, 0.1); LOOPS.air && LOOPS.air.set(0, 0.1); } }

let G = null, paused = false;
function say(text, color, size, y, dur) { if (!G) return; G.msgs = G.msgs.filter(m => Math.abs(m.y - (y || 0.25)) > 0.03); G.msgs.push({ text, color: color || '#fff', size: size || 1, y: y || 0.25, dur: dur || 1.3, t: 0 }); }
const NUM = ['', 'ONE', 'TWO', 'THREE', 'FOUR'];
// everything that just happened in the fight becomes something to hear, see and feel
function fx(G) {
  const me = G.me, f = G.foe;
  for (const e of G.evs) {
    if (e.k === 'launch') { if (e.a === me) { sfx.launch(); vibe(HAP.light); FX.ky += 4 * k; say('MISSILE AWAY', '#ffd166', 0.62, 0.3, 0.8); } else { sfx.alarm(); FX.red = Math.max(FX.red, 0.55); vibe(HAP.tick); say('MISSILE!', '#ff6a5a', 1.25, 0.25, 1.1); } }
    else if (e.k === 'locked') { sfx.locked(); vibe(HAP.tick); }
    else if (e.k === 'flare') {
      sfx.flare(); if (e.j === me) { vibe(HAP.tick); if (e.res === 'early') say('TOO EARLY', '#ffd166', 0.7, 0.32, 0.9); else if (e.res === 'late') say('TOO LATE', '#ffd166', 0.7, 0.32, 0.9); else if (e.res === 'straight') say('TURN HARDER', '#ffd166', 0.7, 0.32, 0.9); }
      else if (e.res === 'ok') say('HE FLARED', '#cfe0f0', 0.62, 0.32, 0.9);
    }
    else if (e.k === 'pop') { burst(e.s.x, e.s.y, e.s.z, false); sfx.pop(); if (e.s.to === me) { sfx.evade(); vibe(HAP.sharp); say('EVADED!', '#9ff0b0', 1.05, 0.25, 1.1); FX.gold = Math.max(FX.gold, 0.35); } }
    else if (e.k === 'hit') { if (e.s.to === me && me.alive) { burst(e.s.x, e.s.y, e.s.z, false); sfx.hit(); FX.red = 1; FX.shake = 16 * k; FX.stop = Math.max(FX.stop, 0.05); say('HIT!', '#ff6a5a', 1.2, 0.25, 1); } }
    else if (e.k === 'hurt' && e.kind === 'gun') {
      if (e.j === f) { sfx.tick(); if (Math.random() < 0.5) puff(f.x, f.y + 1, f.z, (Math.random() - 0.5) * 60, 20 + Math.random() * 40, (Math.random() - 0.5) * 60, 0.3, 0.8, 0.4, 4, 1); }
      else { sfx.thud(); FX.red = Math.max(FX.red, 0.45); FX.shake = Math.max(FX.shake, 5 * k); }
    }
    else if (e.k === 'kill') {
      burst(e.j.x, e.j.y, e.j.z, true); sfx.boom(); duck(0.6, 600); FX.shake = 12 * k;
      if (e.j === f) { FX.stop = 0.1; FX.slow = 0.75; FX.gold = 1; vibe(HAP.heavy); sfx.splash(G.kills); say('SPLASH ' + (NUM[G.kills] || G.kills) + '!', '#ffd166', 1.5, 0.25, 1.9); }
      else { FX.red = 1; FX.stop = 0.08; say('SHOT DOWN', '#ff6a5a', 1.4, 0.25, 2); }
    }
    else if (e.k === 'tracer') {
      const a = e.a, d = fwdOf(a), sp = 0.012; if (a === me) sfx.gun(); else sfx.gunFar();
      puff(a.x + d[0] * 9, a.y + d[1] * 9 - 0.6, a.z + d[2] * 9, (d[0] + (Math.random() - 0.5) * sp) * 950, (d[1] + (Math.random() - 0.5) * sp) * 950 + 20, (d[2] + (Math.random() - 0.5) * sp) * 950, 0.42, 0.5, 0.5, 4, 1);
    }
    else if (e.k === 'spawn') { G.tagT = 2.8; if (e.kind === 'six') say('BANDIT ON YOUR SIX!', '#ff6a5a', 0.9, 0.3, 1.7); else if (G.idx > 0) say('ANOTHER BANDIT!', '#ffd166', 0.9, 0.3, 1.5); }
    else if (e.k === 'fizzle') { if (e.s.from === me && f.alive) say('MISSED', '#cfe0f0', 0.62, 0.32, 0.8); }
    else if (e.k === 'rearm') sfx.rearm();
    else if (e.k === 'empty') { sfx.empty(); say('RELOADING', '#cfe0f0', 0.62, 0.32, 0.7); }
    else if (e.k === 'noflare') { sfx.empty(); if (me.flares <= 0) say('NO FLARES', '#ffd166', 0.62, 0.32, 0.7); }
    else if (e.k === 'hot') { if (e.a === me) say('CANNON HOT', '#ffd166', 0.62, 0.32, 0.8); }
  }
  G.evs.length = 0;
}
// the steady signals: the ring finding him, him finding you, his missile closing
const CUE = { seek: 0, warn: 0, alarm: 0, lowT: 0 };
function cues(G, dt) {
  const me = G.me, f = G.foe;
  if (me.onT && me.lock < 1) { CUE.seek -= dt; if (CUE.seek <= 0) { CUE.seek = 0.2 - 0.12 * me.lock; sfx.seek(me.lock); } } else CUE.seek = 0;
  if (G.threat) { CUE.alarm -= dt; if (CUE.alarm <= 0) { CUE.alarm = clamp(G.tti * 0.22, 0.1, 0.42); sfx.alarm(); } }
  else if (f.alive && f.onT && f.lock > 0.02) { CUE.warn -= dt; if (CUE.warn <= 0) { CUE.warn = 0.5 - 0.32 * f.lock; sfx.warn(f.lock); } } else { CUE.warn = 0; CUE.alarm = 0; }
  if (G.fuel < 20 && G.fuel > 0) { CUE.lowT -= dt; if (CUE.lowT <= 0) { CUE.lowT = 2.5; sfx.low(); } }
  for (const m of G.msgs) m.t += dt; if (G.msgs.length && G.msgs[0].t > G.msgs[0].dur) G.msgs.shift();
  G.msgs = G.msgs.filter(m => m.t <= m.dur);
  if (G.tagT > 0) G.tagT -= dt;
}

function finish(G, win) {
  G.phase = win ? 'won' : 'lost'; G.ft = 0;
  const L = G.L, c = G.cfg, me = G.me, res = G.res = { win, why: G.why, time: G.t, hits: G.hitsTaken, stars: 0, fired: G.fired, landed: G.landed, evaded: G.evaded, foeHp: G.foe ? Math.max(0, G.foe.hp / G.foe.hpMax) : 0, left: c.bandits - G.kills, nb: false, prev: bestTime[L] || 0, run: 0, nbRun: false };
  if (win) res.stars = G.hitsTaken === 0 ? 3 : G.hitsTaken === 1 ? 2 : 1;
  if (HEADLESS) return;
  streaks[L] = win ? 0 : (streaks[L] || 0) + 1; store.set('streaks', streaks);
  if (win) {
    stars[L] = Math.max(stars[L] || 0, res.stars); store.set('stars', stars); unlocked = Math.max(unlocked, L + 1); store.set('unlocked', unlocked);
    store.set('level', L + 1);                               // he comes back to the next sortie, even if he leaves before pressing NEXT
    res.nb = !!res.prev && res.time < res.prev; if (!res.prev || res.time < res.prev) { bestTime[L] = +res.time.toFixed(2); store.set('bestTime', bestTime); }
    kills += G.kills; store.set('kills', kills); run++; res.nbRun = bestRun > 0 && run > bestRun; if (run > bestRun) { bestRun = run; store.set('bestRun', bestRun); } store.set('run', run); res.run = run;
    sfx.win(c.boss); vibe(res.nb || res.nbRun ? HAP.best : HAP.heavy); FX.gold = 1; say(c.bandits > 1 ? 'SKY CLEAR' : 'GOOD KILL', '#ffd166', 1.3, 0.25, 2.2);
  } else {
    if (G.kills) { kills += G.kills; store.set('kills', kills); } run = 0; store.set('run', 0);
    sfx.lose(); if (G.why === 'fuel') say('OUT OF FUEL', '#ff6a5a', 1.3, 0.25, 2.2);
  }
}

// ---------- what is written on the glass ----------
function camSpace(x, y, z) { const c = CAM, dx = x - c.x, dy = y - c.y, dz = z - c.z, X = dx * c.cyw - dz * c.syw, Z = dx * c.syw * c.cp + dy * c.sp + dz * c.cyw * c.cp, Y = -dx * c.syw * c.sp + dy * c.cp - dz * c.cyw * c.sp; return [X * c.cr - Y * c.sr, X * c.sr + Y * c.cr, Z]; }
const BTN = { fx: 0, fy: 0, fr: 0, lx: 0, ly: 0, lr: 0, sx: 0, sy: 0 };
function layout() { BTN.fr = 41 * k; BTN.fx = W - 66 * k; BTN.fy = H - 108 * k; BTN.lr = 31 * k; BTN.lx = W - 150 * k; BTN.ly = H - 176 * k; BTN.sx = 92 * k; BTN.sy = H - 124 * k; }
function coachLine(G) {
  const me = G.me, f = G.foe, L = G.L; if (L > 3 || !f.alive || !me.alive) return '';
  if (G.threat) return L <= 2 ? 'Tap FLARE as the ring closes on it' : 'Turn hard, then FLARE as the ring closes';
  if (f.onT && f.lock > 0.1) return 'He is locking on: turn hard';
  if (L === 2 && G.t < 12 && me.r && me.r.off > 1.7 && G.foeFired === 0) return 'He is behind you: watch the mirror';
  if (L === 1 || G.t < 14) { if (me.lock >= 1) return me.shots > 0 ? 'Locked: tap FIRE' : 'Reloading'; if (me.onT) return 'Hold him in the ring'; if (me.front) return 'Get behind him to lock on'; if (me.r && me.r.off > 0.9) return 'Push your thumb toward the arrow'; return 'Left thumb: steer the ring onto him'; }
  return '';
}
function drawHud(G, now) {
  const me = G.me, f = G.foe, c = G.cfg, live = G.phase === 'fight', pad = 12 * k;
  ctx.save(); ctx.textBaseline = 'middle'; ctx.textAlign = 'center'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (FX.red > 0) { const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.22, W / 2, H / 2, H * 0.78); vg.addColorStop(0, 'rgba(255,0,0,0)'); vg.addColorStop(1, `rgba(200,24,12,${Math.min(0.85, FX.red * 0.8)})`); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H); }
  if (FX.gold > 0) { const vg = ctx.createRadialGradient(W / 2, H * 0.45, H * 0.25, W / 2, H * 0.45, H * 0.8); vg.addColorStop(0, 'rgba(255,215,120,0)'); vg.addColorStop(1, `rgba(255,205,100,${FX.gold * 0.38})`); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H); }
  if (live && me.alive) {
    // the ring: where your nose points. He has to be inside it.
    const d = fwdOf(me); CC = CAM;
    if (P3(me.x + d[0] * 4000, me.y + d[1] * 4000, me.z + d[2] * 4000)) {
      const bx = PX, by = PY, rr = CAM.F * Math.tan(PH.LOCK_A), lk = me.lock, locked = lk >= 1 && f.alive, col = locked ? '#ff5a4a' : me.onT ? '#ffd166' : 'rgba(190,255,214,.8)';
      ctx.strokeStyle = 'rgba(8,20,36,.35)'; ctx.lineWidth = 4.5 * k; ctx.beginPath(); ctx.arc(bx, by, rr, 0, TAU); ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = (locked ? 3 : 1.6) * k; ctx.setLineDash(locked ? [] : [10 * k, 7 * k]); ctx.beginPath(); ctx.arc(bx, by, rr, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      if (lk > 0.02 && !locked) { ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 4 * k; ctx.beginPath(); ctx.arc(bx, by, rr, -Math.PI / 2, -Math.PI / 2 + TAU * lk); ctx.stroke(); }
      ctx.strokeStyle = col; ctx.lineWidth = 1.6 * k; ctx.beginPath(); for (const a of [0, 1, 2, 3]) { const ca = Math.cos(a * Math.PI / 2), sa = Math.sin(a * Math.PI / 2); ctx.moveTo(bx + ca * rr * 0.16, by + sa * rr * 0.16); ctx.lineTo(bx + ca * rr * 0.34, by + sa * rr * 0.34); } ctx.stroke();
      if (me.gunOn || (me.r && me.r.d < PH.GUN_R * 1.15 && f.alive)) { ctx.strokeStyle = me.r && me.r.off < PH.GUN_A && me.r.d < PH.GUN_R ? '#ff5a4a' : 'rgba(255,255,255,.75)'; ctx.lineWidth = 1.6 * k; ctx.beginPath(); ctx.arc(bx, by, CAM.F * Math.tan(PH.GUN_A), 0, TAU); ctx.stroke(); }
      if (locked) { ctx.font = `700 ${Math.round(15 * k)}px ${BC}`; ctx.fillStyle = Math.sin(now * 18) > -0.3 ? '#ff5a4a' : '#fff'; ctx.lineWidth = 3.5 * k; ctx.strokeStyle = 'rgba(8,20,36,.7)'; ctx.strokeText(me.shots > 0 ? 'LOCK  ·  FIRE' : 'LOCK', bx, by - rr - 13 * k); ctx.fillText(me.shots > 0 ? 'LOCK  ·  FIRE' : 'LOCK', bx, by - rr - 13 * k); }
      else if (me.front && f.alive) { ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; ctx.lineWidth = 3.5 * k; ctx.strokeStyle = 'rgba(8,20,36,.7)'; ctx.strokeText('NO LOCK FROM THE FRONT  ·  GET BEHIND HIM', bx, by - rr - 13 * k); ctx.fillStyle = '#fff'; ctx.fillText('NO LOCK FROM THE FRONT  ·  GET BEHIND HIM', bx, by - rr - 13 * k); }
    }
    // him: boxed if you can see him, an arrow to follow if you cannot
    if (f.alive) {
      const q = camSpace(f.x, f.y, f.z), on = q[2] > 1, sx = on ? CAM.cx + q[0] * CAM.F / q[2] : 0, sy = on ? CAM.cy - q[1] * CAM.F / q[2] : 0, hot = f.onT && f.lock > 0.05;
      if (on && sx > 16 && sx < W - 16 && sy > 16 && sy < H - 150 * k) {
        const s = clamp(9.5 * SC_FOE * CAM.F / q[2], 15 * k, 110 * k), col = me.lock >= 1 ? '#ff5a4a' : me.onT ? '#ffd166' : '#9ff0b0', g = s * 0.45;
        ctx.strokeStyle = 'rgba(8,20,36,.4)'; ctx.lineWidth = 4 * k; for (let pass = 0; pass < 2; pass++) {
          ctx.beginPath(); for (const [ax, ay] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { ctx.moveTo(sx + ax * s, sy + ay * (s - g)); ctx.lineTo(sx + ax * s, sy + ay * s); ctx.lineTo(sx + ax * (s - g), sy + ay * s); } ctx.stroke();
          ctx.strokeStyle = col; ctx.lineWidth = 2 * k;
        }
        if (f.hp < f.hpMax) { const bw = s * 2; ctx.fillStyle = 'rgba(8,20,36,.5)'; ctx.fillRect(sx - bw / 2, sy + s + 5 * k, bw, 4 * k); ctx.fillStyle = '#ff7a4a'; ctx.fillRect(sx - bw / 2, sy + s + 5 * k, bw * f.hp / f.hpMax, 4 * k); }
        if (G.tagT > 0) { ctx.globalAlpha = Math.min(1, G.tagT / 0.5); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; ctx.lineWidth = 3.5 * k; ctx.strokeStyle = 'rgba(8,20,36,.7)'; const t = '“' + f.look.call.toUpperCase() + '”'; ctx.strokeText(t, sx, sy - s - 12 * k); ctx.fillStyle = '#fff'; ctx.fillText(t, sx, sy - s - 12 * k); ctx.globalAlpha = 1; }
      } else {
        let ax = q[0], ay = q[1]; const l = Math.hypot(ax, ay); if (l < 1e-3) { ax = 0; ay = -1; } else { ax /= l; ay /= l; }
        const ex = W * 0.36, ey = H * 0.24, px = CAM.cx + ax * ex, py = CAM.cy - 6 * k - ay * ey, ang = Math.atan2(-ay, ax), pu = hot ? 0.5 + 0.5 * Math.sin(now * 20) : 0, sz = (15 + 4 * pu) * k;
        ctx.save(); ctx.translate(px, py); ctx.rotate(ang);
        ctx.fillStyle = 'rgba(8,20,36,.45)'; ctx.beginPath(); ctx.moveTo(sz + 3 * k, 0); ctx.lineTo(-sz * 0.75 - 2 * k, -sz - 3 * k); ctx.lineTo(-sz * 0.3, 0); ctx.lineTo(-sz * 0.75 - 2 * k, sz + 3 * k); ctx.closePath(); ctx.fill();
        ctx.fillStyle = hot ? '#ff5a4a' : '#ffd166'; ctx.beginPath(); ctx.moveTo(sz, 0); ctx.lineTo(-sz * 0.7, -sz * 0.85); ctx.lineTo(-sz * 0.25, 0); ctx.lineTo(-sz * 0.7, sz * 0.85); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    }
    // the mirror, when he is behind you or his missile is in the air
    const behind = f.alive && me.r && me.r.off > 1.7 && me.r.d < 1700, mw = 178 * k, mh = 98 * k, mx = W / 2 - mw / 2, my = 50 * k;
    if (behind || G.threat) {
      drawMirror(G, now, mx, my, mw, mh, !!G.threat || (f.onT && f.lock > 0.05));
      if (f.onT && f.lock > 0.02 && !G.threat) { ctx.fillStyle = 'rgba(8,20,36,.55)'; rrect(mx, my + mh + 6 * k, mw, 7 * k, 3.5 * k); ctx.fill(); ctx.fillStyle = '#ff5a4a'; rrect(mx, my + mh + 6 * k, Math.max(7 * k, mw * f.lock), 7 * k, 3.5 * k); ctx.fill(); ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = '#ffd9d2'; ctx.fillText('HE IS LOCKING ON  ·  TURN HARD', W / 2, my + mh + 24 * k); }
    }
  }
  // top left: which sortie, how many bandits are left
  ctx.textAlign = 'left'; ctx.strokeStyle = 'rgba(8,20,36,.55)'; ctx.lineWidth = 3 * k;        // (dark outlines, not soft shadows: shadows are slow on phones)
  ctx.font = `${Math.round(24 * k)}px ${BN}`; ctx.strokeText('SORTIE ' + G.L, pad, 26 * k); ctx.fillStyle = '#fff'; ctx.fillText('SORTIE ' + G.L, pad, 26 * k);
  for (let i = 0; i < c.bandits; i++) { ctx.fillStyle = i < G.kills ? '#ffd166' : 'rgba(255,255,255,.35)'; ctx.beginPath(); const x = pad + 7 * k + i * 17 * k, y = 46 * k; ctx.moveTo(x, y - 6 * k); ctx.lineTo(x + 6 * k, y + 5 * k); ctx.lineTo(x, y + 2 * k); ctx.lineTo(x - 6 * k, y + 5 * k); ctx.closePath(); ctx.fill(); }
  if (c.help) { ctx.fillStyle = '#a9e8c0'; rrect(pad, 58 * k, 56 * k, 14 * k, 6 * k); ctx.fill(); ctx.fillStyle = '#0b1a2e'; ctx.font = `800 ${Math.round(9 * k)}px Nunito, sans-serif`; ctx.fillText('HELP ON', pad + 7 * k, 65.5 * k); }
  // top right: fuel, only once it is worth worrying about
  if (live && G.fuel < c.fuel * 0.4) { const low = G.fuel < 20, w = 70 * k; ctx.textAlign = 'right'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.strokeText('FUEL', W - pad, 22 * k); ctx.fillStyle = low && Math.sin(now * 12) > 0 ? '#ff6a5a' : '#fff'; ctx.fillText('FUEL', W - pad, 22 * k); ctx.fillStyle = 'rgba(8,20,36,.5)'; rrect(W - pad - w, 32 * k, w, 6 * k, 3 * k); ctx.fill(); ctx.fillStyle = low ? '#ff6a5a' : '#ffd166'; rrect(W - pad - w, 32 * k, Math.max(6 * k, w * G.fuel / (c.fuel * 0.4)), 6 * k, 3 * k); ctx.fill(); }
  // call-outs
  ctx.textAlign = 'center'; ctx.strokeStyle = 'rgba(8,20,36,.75)';
  for (const m of G.msgs) {
    const a = 1 - Math.max(0, (m.t - m.dur * 0.6) / (m.dur * 0.4)), pop = m.t < 0.12 ? 1 + 0.4 * (1 - m.t / 0.12) : 1, fs = Math.round(Math.min(W * 0.115, 46) * m.size * pop), yy = H * m.y + (behindMirror(G) && m.y < 0.3 ? 78 * k : 0);
    ctx.globalAlpha = a; ctx.font = `${fs}px ${BN}`; ctx.lineWidth = Math.max(3, fs * 0.14); ctx.strokeText(m.text, W / 2, yy, W * 0.94); ctx.fillStyle = m.color; ctx.fillText(m.text, W / 2, yy, W * 0.94);
  }
  ctx.globalAlpha = 1;
  if (!live) { if (G.ft > 0.9) { ctx.font = `800 ${Math.round(13.5 * k)}px Nunito, sans-serif`; ctx.globalAlpha = 0.6 + 0.25 * Math.sin(now * 5); ctx.fillStyle = '#fff'; ctx.fillText('Tap to continue', W / 2, H * 0.92); ctx.globalAlpha = 1; } ctx.restore(); return; }
  const cl = coachLine(G);
  if (cl) { ctx.font = `800 ${Math.round(13.5 * k)}px Nunito, sans-serif`; const tw = ctx.measureText(cl).width + 26 * k; ctx.fillStyle = 'rgba(8,20,36,.62)'; rrect(W / 2 - tw / 2, H * 0.715 - 14 * k, tw, 28 * k, 14 * k); ctx.fill(); ctx.fillStyle = '#ffd166'; ctx.fillText(cl, W / 2, H * 0.715 + 1); }
  // left thumb: the stick
  const st = IN.sId != null, ox = st ? IN.ox : BTN.sx, oy = st ? IN.oy : BTN.sy, R0 = 46 * k;
  ctx.strokeStyle = st ? 'rgba(255,255,255,.5)' : 'rgba(255,255,255,.28)'; ctx.lineWidth = 2 * k; ctx.beginPath(); ctx.arc(ox, oy, R0, 0, TAU); ctx.stroke();
  ctx.fillStyle = st ? 'rgba(255,255,255,.85)' : 'rgba(255,255,255,.4)'; ctx.beginPath(); ctx.arc(ox + G.in.sx * R0 * 0.8, oy - G.in.sy * R0 * 0.8, 17 * k, 0, TAU); ctx.fill();
  if (!st && G.t < 6) { ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.font = `700 ${Math.round(11.5 * k)}px ${BC}`; ctx.fillText('FLY', ox, oy + R0 + 12 * k); }
  // right thumb: FIRE, and FLARE with the ring that tells you when
  const ready = me.lock >= 1 && me.shots > 0 && f.alive, pu = 0.5 + 0.5 * Math.sin(now * 16);
  ctx.fillStyle = ready ? `rgba(255,${120 + 60 * pu},50,.92)` : IN.fId != null ? 'rgba(255,255,255,.34)' : 'rgba(8,20,36,.42)'; ctx.beginPath(); ctx.arc(BTN.fx, BTN.fy, BTN.fr * (ready ? 1 + 0.05 * pu : 1), 0, TAU); ctx.fill();
  ctx.strokeStyle = ready ? '#fff' : 'rgba(255,255,255,.5)'; ctx.lineWidth = 2 * k; ctx.stroke();
  if (me.heat > 0.02) { ctx.strokeStyle = me.gunHot ? '#ff5a4a' : '#ffd166'; ctx.lineWidth = 4 * k; ctx.beginPath(); ctx.arc(BTN.fx, BTN.fy, BTN.fr + 5 * k, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(me.heat, 0, 1)); ctx.stroke(); }
  ctx.fillStyle = '#fff'; ctx.font = `${Math.round(21 * k)}px ${BN}`; ctx.fillText('FIRE', BTN.fx, BTN.fy + 1.5 * k);
  for (let i = 0; i < 2; i++) { ctx.fillStyle = i < me.shots ? '#ffd166' : 'rgba(255,255,255,.25)'; rrect(BTN.fx - 13 * k + i * 15 * k, BTN.fy - BTN.fr - 15 * k, 11 * k, 5 * k, 2.5 * k); ctx.fill(); }
  const th = G.threat, lo = c.myLo, hi = c.myHi, inWin = th && G.tti <= hi && G.tti >= lo;
  ctx.fillStyle = inWin ? `rgba(120,240,150,${0.75 + 0.25 * pu})` : th ? `rgba(255,90,74,${0.5 + 0.3 * pu})` : 'rgba(8,20,36,.42)'; ctx.beginPath(); ctx.arc(BTN.lx, BTN.ly, BTN.lr, 0, TAU); ctx.fill();
  ctx.strokeStyle = th ? '#fff' : 'rgba(255,255,255,.5)'; ctx.lineWidth = 2 * k; ctx.stroke();
  if (th) { const far = clamp((G.tti - hi) / 1.3, 0, 1.6); ctx.strokeStyle = inWin ? '#b8ffc8' : '#fff'; ctx.lineWidth = (inWin ? 4.5 : 3) * k; ctx.beginPath(); ctx.arc(BTN.lx, BTN.ly, BTN.lr * (1.12 + far * 1.5), 0, TAU); ctx.stroke(); }
  ctx.fillStyle = inWin ? '#0b1a2e' : '#fff'; ctx.font = `${Math.round(16 * k)}px ${BN}`; ctx.fillText(inWin ? 'NOW' : 'FLARE', BTN.lx, BTN.ly + 1.5 * k);
  for (let i = 0; i < me.flareMax; i++) { ctx.fillStyle = i < me.flares ? '#ffd166' : 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.arc(BTN.lx - 11 * k + i * 11 * k, BTN.ly - BTN.lr - 10 * k, 3.6 * k, 0, TAU); ctx.fill(); }
  // your own jet: how much more it can take
  const hp = clamp(me.hp / me.hpMax, 0, 1), bw = 96 * k, bx0 = W / 2 - bw / 2, by0 = H - 34 * k;
  if (hp < 1) { ctx.fillStyle = 'rgba(8,20,36,.5)'; rrect(bx0, by0, bw, 7 * k, 3.5 * k); ctx.fill(); ctx.fillStyle = me.hurtT < 0.25 && Math.sin(now * 45) > 0 ? '#fff' : hp < 0.36 ? (Math.sin(now * 14) > 0 ? '#ff5a4a' : '#ffb03a') : hp < 0.7 ? '#ffd166' : '#9ff0b0'; rrect(bx0, by0, Math.max(7 * k, bw * hp), 7 * k, 3.5 * k); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = `700 ${Math.round(10.5 * k)}px ${BC}`; ctx.fillText(hp < 0.36 ? 'JET FAILING' : 'JET DAMAGED', W / 2, by0 - 9 * k); }
  ctx.restore();
}
function behindMirror(G) { const me = G.me, f = G.foe; return G.phase === 'fight' && (G.threat || (f.alive && me.r && me.r.off > 1.7 && me.r.d < 1700)); }
function draw(now) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (!G) { ctx.fillStyle = '#0b1a2e'; ctx.fillRect(0, 0, W, H); return; }
  drawWorld(G, now);
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${FX.flash})`; ctx.fillRect(0, 0, W, H); }
  if (G.phase !== 'home' && G.phase !== 'done') drawHud(G, now);
}

// ---------- two thumbs ----------
const IN = { sId: null, ox: 0, oy: 0, x: 0, y: 0, fId: null }, KEY = { l: 0, r: 0, u: 0, d: 0 };
function readInput() {
  let x = 0, y = 0;
  if (IN.sId != null) {                        // left thumb: push it the way the nose should go, from wherever it first touched
    const full = 54 * k; let dx = IN.x - IN.ox, dy = IN.y - IN.oy; const l = Math.hypot(dx, dy);
    if (l > full) { IN.ox = IN.x - dx / l * full; IN.oy = IN.y - dy / l * full; dx = dx / l * full; dy = dy / l * full; }
    const m = Math.min(1, l / full), q = m < 0.08 ? 0 : Math.pow((m - 0.08) / 0.92, 1.15); if (l > 0) { x = dx / l * q; y = -dy / l * q; }
  }
  if (KEY.l) x = -1; if (KEY.r) x = 1; if (KEY.u) y = 1; if (KEY.d) y = -1;
  G.in.sx = x; G.in.sy = y;
}
cv.addEventListener('pointerdown', e => {
  audio(); ensureLoops();
  if (!G || paused) return;
  if (G.phase === 'won' || G.phase === 'lost') { if (G.ft > 0.9) showEnd(); return; }
  if (G.phase !== 'fight') return;
  if (e.clientX < W * 0.5) { if (IN.sId == null) { IN.sId = e.pointerId; IN.ox = IN.x = e.clientX; IN.oy = IN.y = e.clientY; } }
  else {                                       // right thumb: whichever button is nearer, so a thumb anywhere on that side counts
    const dF = Math.hypot(e.clientX - BTN.fx, e.clientY - BTN.fy), dL = Math.hypot(e.clientX - BTN.lx, e.clientY - BTN.ly);
    if (dL < dF) G.in.flare = true; else if (IN.fId == null) { IN.fId = e.pointerId; G.in.fire = true; G.in.press = true; }
  }
  try { cv.setPointerCapture(e.pointerId); } catch (_) {}
});
cv.addEventListener('pointermove', e => { if (e.pointerId === IN.sId) { IN.x = e.clientX; IN.y = e.clientY; } });
function release(e) { if (e.pointerId === IN.sId) IN.sId = null; else if (e.pointerId === IN.fId) { IN.fId = null; if (G) G.in.fire = false; } }
cv.addEventListener('pointerup', release);
cv.addEventListener('pointercancel', release);
addEventListener('keydown', e => {             // laptop: arrows fly, space fires, F drops a flare
  if (e.repeat) { if (e.code === 'Space') e.preventDefault(); return; }
  if (e.code === 'ArrowLeft') KEY.l = 1; else if (e.code === 'ArrowRight') KEY.r = 1; else if (e.code === 'ArrowUp') KEY.u = 1; else if (e.code === 'ArrowDown') KEY.d = 1;
  else if (e.code === 'Space') { e.preventDefault(); audio(); ensureLoops(); if (G && (G.phase === 'won' || G.phase === 'lost')) { if (G.ft > 0.9) showEnd(); } else if (G && !paused && G.phase === 'fight') { G.in.fire = true; G.in.press = true; } }
  else if (e.code === 'KeyF' && G && !paused && G.phase === 'fight') G.in.flare = true;
});
addEventListener('keyup', e => { if (e.code === 'ArrowLeft') KEY.l = 0; else if (e.code === 'ArrowRight') KEY.r = 0; else if (e.code === 'ArrowUp') KEY.u = 0; else if (e.code === 'ArrowDown') KEY.d = 0; else if (e.code === 'Space' && G) G.in.fire = false; });

// ---------- screens ----------
function show(id) { ['ovHome', 'ovRules', 'ovLevels', 'ovEnd', 'ovPause'].forEach(key => $(key).classList.toggle('hidden', key !== id)); }
function savedLevel() { level = Math.min(Math.max(1, store.get('level', 1) | 0), unlocked); }
const helpOn = () => (streaks[level] || 0) >= 3;
function showHome() {
  savedLevel();
  G = makeFight(level, { help: helpOn() }); G.phase = 'home'; G.foe.alive = false; G.foe.y = -500; paused = false; loopsOff(); PT.length = 0;
  $('pauseBtn').classList.add('hidden');
  const c = G.cfg, lk = foeLook(level, 0);
  $('hLvl').textContent = level; $('hFoe').textContent = '“' + lk.call + '”';
  $('hJet').textContent = `${lk.rank} ${lk.surn} · ${lk.squad} · ${FRAME_NAME[lk.frame]}`;
  $('hPills').innerHTML = (c.boss ? '<span class="pill" style="background:#ffb347;color:#2b1602">ACE</span>' : '') + `<span class="pill">${c.bandits} bandit${c.bandits > 1 ? 's' : ''}</span><span class="pill">${!c.foeShots ? 'He does not shoot back' : c.gunDps ? 'Missiles and cannon' : 'He fires missiles'}</span>`;
  $('hStat').innerHTML = [bestTime[level] ? `Your best here: <b>${fmtT(bestTime[level])}</b>` : '', kills ? `Bandits shot down: <b>${kills}</b>` : '', bestRun > 1 ? `Best run: <b>${bestRun}</b> sorties` : ''].filter(Boolean).join(' · ') + (c.help ? `<br><span class="help">Help on: he is slower to lock on and his missiles fly slower until you get through.</span>` : '');
  camFollow(G, 0, true); show('ovHome');
}
function startFight() {
  audio(); ensureLoops();
  if (G && G.phase === 'fight' && !HEADLESS) { run = 0; store.set('run', 0); }     // walking out of a sortie ends the run, as losing it would
  if (!HEADLESS) store.set('level', level);
  G = makeFight(level, { help: helpOn(), seed: Math.floor(Math.random() * 1e6) }); paused = false; PT.length = 0; G.tagT = 2.8;
  IN.sId = IN.fId = null; FX.shake = FX.stop = FX.slow = FX.flash = FX.red = FX.gold = FX.kx = FX.ky = 0; CUE.seek = CUE.warn = CUE.alarm = 0;
  if (!HEADLESS) { camFollow(G, 0, true); $('pauseBtn').classList.remove('hidden'); show(null); }
  last = performance.now(); warm = 30; winN = 0; winSum = 0;      // (the first half second of a fight is not timed: things are still loading)
}
function showEnd() {
  if (!G || (G.phase !== 'won' && G.phase !== 'lost')) return; const res = G.res, c = G.cfg, L = G.L; G.phase = 'done'; loopsOff();
  $('pauseBtn').classList.add('hidden');
  $('eTitle').textContent = res.win ? (c.bandits > 1 ? 'SKY CLEAR' : c.boss ? 'ACE DOWN' : 'SPLASH ONE') : res.why === 'fuel' ? 'OUT OF FUEL' : 'SHOT DOWN'; $('eTitle').style.color = res.win ? '#ffd166' : '#ffb4a8';
  $('eStars').innerHTML = res.win ? [1, 2, 3].map(i => `<span class="${i <= res.stars ? '' : 'off'}">★</span>`).join('') : '';
  const helpLine = !res.win && (streaks[L] || 0) >= 3 ? `<br><span class="help">Help is on: he will be slower to lock on, and his missiles will fly slower, until you get through.</span>` : '';
  if (res.win) {
    $('eSub').innerHTML = `Time <b>${fmtT(res.time)}</b>${res.nb ? ' <b class="nb">NEW BEST</b>' : res.prev ? ` · best ${fmtT(Math.min(res.prev, res.time))}` : ''}` +
      `<br>Missiles <b>${res.landed}/${res.fired}</b> on target · missiles shaken off <b>${res.evaded}</b> · hits taken <b>${res.hits}</b>` +
      `<br>Sorties won in a row: <b>${res.run}</b>${res.nbRun ? ' <b class="nb">NEW BEST</b>' : ''}` + (res.stars < 3 ? '<br>Take no missile hits for three stars.' : '');
  } else {
    const hp = Math.round(res.foeHp * 100), near = res.left > 1 ? `${res.left} bandits were still up.` : hp < 100 ? `He had <b>${hp}%</b> of his jet left.` : 'He was untouched.';
    const tip = res.why === 'fuel' ? 'Get behind him and close in: the nearer you are when you fire, the less time he has.' : res.why === 'gun' ? 'His cannon got you: when he is close behind, turn hard and keep turning.' : G.flareRes === 'early' ? 'Your last flare was too early: wait for the ring to reach the button.' : G.flareRes === 'late' ? 'Your last flare was too late: tap as the ring reaches the button.' : G.flareRes === 'straight' ? 'A flare only works while you are turning hard.' : 'When MISSILE! shows, turn hard and tap FLARE as the ring closes.';
    $('eSub').innerHTML = `${near} ${tip}` + helpLine;
  }
  $('eMain').textContent = res.win ? 'NEXT SORTIE' : 'TRY AGAIN'; $('eMain').dataset.act = res.win ? 'next' : 'again';
  $('eAlt').classList.toggle('hidden', !res.win);
  show('ovEnd');
}
$('playBtn').onclick = () => { audio(); sfx.click(); startFight(); };
// The feed's instant start (a tap on its card in the Game Feed app): the sortie he was on, in the air at once. Play does the same: there is no intro to skip.
window.gameFeedStart = () => { savedLevel(); audio(); sfx.click(); startFight(); };
$('rulesBtn').onclick = () => { sfx.click(); show('ovRules'); };
// Back from the level list goes to where it was opened from: the pause menu, the screen underneath, or home.
document.querySelectorAll('[data-back]').forEach(b => b.onclick = () => {
  const lv = !$('ovLevels').classList.contains('hidden');
  if (lv && lvFrom === 'pause' && fightOn()) openPause(); else if (lv && lvFrom === 'feed' && lvUnder) show(lvUnder); else showHome();
});
let lvFrom = 'home', lvUnder = null;
function showLevels(from) {
  lvFrom = from || 'home';
  lvUnder = ['ovHome', 'ovEnd'].find(key => !$(key).classList.contains('hidden')) || null;      // the screen that waits underneath
  const top = Math.ceil((unlocked + 5) / 5) * 5; let h = '';
  for (let L = 1; L <= top; L++) { const lock = L > unlocked, st = stars[L] || 0; h += `<button class="lvb${L % 10 === 0 ? ' boss' : ''}${L === level ? ' cur' : ''}${lock ? ' lock' : ''}" data-l="${L}" ${lock ? 'disabled' : ''}>${lock ? '🔒' : L}<small>${lock ? '' : '★'.repeat(st)}</small></button>`; }
  $('lvGrid').innerHTML = h;
  $('lvSub').textContent = unlocked > 1 ? `${unlocked - 1} sortie${unlocked === 2 ? '' : 's'} flown. Every tenth sortie is against an ace.` : 'Shoot down the bandit to unlock the next sortie.';
  show('ovLevels');
}
$('levelsBtn').onclick = () => { sfx.click(); showLevels('home'); };
$('eLevels').onclick = () => { showLevels('home'); };
$('lvGrid').addEventListener('click', e => {
  const b = e.target.closest('[data-l]'); if (!b || b.disabled) return;
  level = +b.dataset.l; store.set('level', level);
  if (lvFrom === 'home') showHome(); else { sfx.click(); startFight(); }      // picked from the pause menu: that sortie starts at once
});
$('eMain').onclick = () => { if ($('eMain').dataset.act === 'next') level = Math.min(unlocked, level + 1); startFight(); };
$('eAlt').onclick = () => startFight();
function sndIcon() { $('sndBtn').textContent = MUTE ? '🔇' : '🔊'; }
MUTE = !!store.get('mute', false);
$('sndBtn').onclick = () => { audio(); setMute(!MUTE); store.set('mute', MUTE); sndIcon(); if (!MUTE) { ensureLoops(); sfx.click(); } else loopsOff(); };
sndIcon();
// ---------- pause menu: resume, restart this sortie, or pick a lower level (the same in every game) ----------
const fightOn = () => !!G && G.phase === 'fight';
function openPause() {
  paused = true; loopsOff(); IN.sId = IN.fId = null; G.in.fire = false; G.in.sx = G.in.sy = 0;
  $('pLvl').textContent = `Sortie ${G.L} · “${G.foe.look.call}”`;
  $('pDiag').textContent = `Picture ${stepN + 1} of ${STEPS.length} · ${Math.round(1000 / ftAvg)} a second${half && vsync < 12.5 ? ' (halved)' : ''} · ${GLX ? 'fast' : 'plain'} sky${vsync < 15 ? ' · screen ' + Math.round(1000 / vsync) : ''}${stuck ? ' · fixed' : ''}`;      // if he says it lags, ask him to read this line out (LESSONS, rule 12)
  show('ovPause');
}
$('pauseBtn').onclick = () => { if (fightOn()) openPause(); };
$('pResume').onclick = () => { paused = false; show(null); last = performance.now(); };
$('pRestart').onclick = () => { sfx.click(); startFight(); };
$('pLevels').onclick = () => showLevels('pause');
$('pQuit').onclick = () => { if (fightOn()) { run = 0; store.set('run', 0); } showHome(); };
// The feed's "Levels" button on its Paused card: the level list opens over the fight (Back returns to the pause menu).
// On the home or result screen the list opens over it and Back closes it again.
window.gameFeedLevels = () => { if (fightOn()) { openPause(); showLevels('pause'); } else showLevels('feed'); };
document.addEventListener('visibilitychange', () => { if (document.hidden && fightOn() && !paused) openPause(); });

// ---------- loop ----------
function loopSounds() {
  if (!LOOPS || !actx) return;
  const on = G && !paused && (G.phase === 'fight' || G.phase === 'won' || G.phase === 'lost'), me = on ? G.me : null;
  LOOPS.eng && LOOPS.eng.set(me && me.alive ? 0.1 + 0.1 * clamp((me.v - 150) / 150, 0, 1) : 0, 0.2);
  LOOPS.air && LOOPS.air.set(me && me.alive ? 0.02 + 0.07 * me.load + 0.03 * clamp((me.v - 150) / 150, 0, 1) : 0, 0.12);
}
// ---------- keeping it smooth ----------
// The game times its own frames. If this phone is not keeping up it eases off, one notch at a time, until it is, and remembers
// where it got to (now and then it tries one notch finer again, in case the phone was only busy that day). The notches:
//   - on a fast screen (90 or 120 pictures a second): draw on every other one. Even, half the work, nothing lost from the picture
//   - the picture a little less fine, up to three times: the sky, the sharpness of everything, how much smoke hangs about
// A notch that makes no difference is taken back, and if it makes no difference twice, something else is setting the pace (a
// battery saver, say): it stops trying.
// q: the size the sky is painted at (1 = one dot for each of the page's dots); an, bias: how crisp the far clouds are; dpr: the sharpness of
// the main canvas; pt: how many puffs of smoke at once; bg: the size of the sky when it is painted the slow way
const STEPS = [{ q: 1, an: 4, bias: -0.5, dpr: 2, pt: 560, bg: 0.6 }, { q: 0.85, an: 4, bias: -0.5, dpr: 1.5, pt: 420, bg: 0.5 }, { q: 0.7, an: 2, bias: -0.75, dpr: 1.25, pt: 320, bg: 0.45 }, { q: 0.55, an: 1, bias: -1, dpr: 1, pt: 240, bg: 0.4 }];
let stepN = 0, half = 0, stuck = false, vsync = 16.7, ftAvg = 16.7, warm = 30, winN = 0, winSum = 0, trial = '', before = 0, dead = 0, unsaved = false, draws = 0;
const GAPS = new Float32Array(90); let gapN = 0;
function applyStep() { const st = STEPS[stepN]; GLQ = st.q; SKY_ANISO = st.an; SKY_BIAS = st.bias; DPR_CAP = st.dpr; PT_MAX = st.pt; BG_S = st.bg; QUAL = 1 + stepN * 0.45; resize(); layout(); }
let visits = 1, wait = 5;                      // how many times the game has been opened; how many visits until it next tries a finer notch
function setPace() { applyStep(); store.set('smooth', stepN); store.set('half', half); store.set('flat', stuck ? 1 : 0); store.set('next', visits + wait); warm = 20; winN = 0; winSum = 0; }
(() => {
  visits = (store.get('visits', 0) | 0) + 1; store.set('visits', visits); wait = clamp(store.get('wait', 5) | 0, 5, 80);
  stepN = clamp(store.get('smooth', 0) | 0, 0, STEPS.length - 1); half = store.get('half', 0) ? 1 : 0; stuck = !!store.get('flat', 0);
  // Now and then an eased-off phone is tried one notch finer again, in case it was only busy the day it eased off: five visits
  // later, and if it has to ease off again, ten visits after that, then twenty, forty, eighty.
  if ((stepN > 0 || half || stuck) && visits >= (store.get('next', visits + 1) | 0)) {
    unsaved = stepN > 0 || !!half; stuck = false; if (stepN > 0) stepN--; else half = 0;
    store.set('next', visits + wait); wait = Math.min(wait * 2, 80); store.set('wait', wait);
  }
})();
function lowGap() { const n = Math.min(gapN, GAPS.length), a = Array.from(GAPS.subarray(0, n)).sort((x, y) => x - y); return clamp(a[Math.floor(n * 0.15)], 5.5, 50); }
function measure(ms, fast) {                   // one frame of a fight took this long
  if (ms > 250) { warm = 20; return; }         // (the app was away: not a slow frame)
  ftAvg += (Math.min(ms, 120) - ftAvg) * 0.06;
  if (warm > 0) { warm--; return; }
  const want = half && fast ? vsync * 2 : vsync;
  winSum += Math.min(ms, want * 3); winN++;
  let avg = winSum / winN; const limit = half && fast ? want * 1.18 : Math.min(want * 1.18, 21);
  if (winN < 30 || (winN < 60 && avg < limit * 1.35)) return;      // judged on 60 frames, or on 30 if it is plainly struggling
  winN = 0; winSum = 0;
  if (stuck) return;
  if (avg <= limit) { trial = ''; dead = 0; if (unsaved) { unsaved = false; wait = 5; store.set('wait', 5); setPace(); } return; }      // keeping up (and a finer notch on trial has earned its place)
  unsaved = false;                             // (a finer notch that was on trial has failed it)
  if (trial === 'S') {
    if (avg > before * 0.93) { stepN--; avg = before; if (++dead >= 2) { stuck = true; trial = ''; setPace(); return; } }      // that notch was no help: take it back
    else dead = 0;
  }
  // a fast screen: halve. (At 90 a second, one notch less fine is tried first, in case that is all it takes to keep all 90;
  // if it is not, the halving has room to spare and the picture goes back to its finest.)
  if (fast && !half && (vsync < 9.5 || stepN >= 1 || trial === 'S')) { half = 1; stepN = 0; trial = 'H'; dead = 0; }
  else if (stepN < STEPS.length - 1) { stepN++; trial = 'S'; before = avg; }
  else { stuck = true; trial = ''; }           // nothing left to ease off
  setPace();
}
let last = performance.now(), lastRaf = last;
function frame(now) {
  const gap = now - lastRaf; lastRaf = now;
  if (gap > 5.5 && gap < 100) { GAPS[gapN++ % GAPS.length] = gap; if (gapN % 30 === 0) vsync = lowGap(); }      // how often this screen shows a picture
  const fast = vsync < 12.5;
  if (half && fast && now - last < vsync * 1.5) { requestAnimationFrame(frame); return; }       // eased off on a fast screen: sit this one out
  const ms = now - last, rdt = Math.min(0.05, ms / 1000); last = now;
  if (!HEADLESS && !paused && G && G.phase === 'fight') measure(ms, fast);
  if (HEADLESS) { requestAnimationFrame(frame); return; }
  if (G && !paused) {
    FX.red = Math.max(0, FX.red - rdt * 1.6); FX.gold = Math.max(0, FX.gold - rdt * 0.9); FX.flash = Math.max(0, FX.flash - rdt * 4);
    if (G.phase === 'home' || G.phase === 'done') {                       // behind the menus: your jet, cruising
      const me = G.me; if (!me.alive) { me.alive = true; me.hp = me.hpMax; me.y = Math.max(me.y, 900); me.pitch = 0; } me.sx = 0.34 * Math.sin(now / 2600); me.sy = 0.2 * Math.sin(now / 4100); fly(me, rdt); visuals(G, rdt, rdt); camFollow(G, rdt);
    } else {
      let dt = rdt;
      if (FX.stop > 0) { FX.stop -= rdt; dt = 0; }              // a heartbeat of stillness on a hit
      else if (FX.slow > 0) { FX.slow -= rdt; dt *= 0.35; }    // slow motion as he comes apart
      if (G.phase === 'fight') { if (window.__auto) window.__auto(G, dt); else readInput(); step(G, dt); fx(G); cues(G, dt); }
      else {                                                    // after the last shot: fly on while the card comes up
        const me = G.me, f = G.foe; G.ft += rdt; cues(G, dt);
        if (me.alive) { me.sx = 0; me.sy = 0.12; fly(me, dt); } else { me.sx = 0.25; me.sy = -0.5; fly(me, dt); me.y -= 40 * dt; }
        if (!f.alive && f.y > -200) { f.sx = 0.4; f.sy = -0.7; fly(f, dt); f.y -= 55 * dt; f.roll += 2.2 * dt; }
        if (G.ft > 2.6) showEnd();
      }
      visuals(G, dt, rdt); camFollow(G, rdt);
    }
  }
  loopSounds();
  draw(now / 1000); draws++;
  requestAnimationFrame(frame);
}
window.__sim = {
/*SOUNDCHECK*/
  start(L, o) { HEADLESS = true; MUTE = true; level = L; G = makeFight(L, o || {}); },
  step(dt) { step(G, dt); G.evs.length = 0; },
  set(sx, sy, fire, flare) { G.in.sx = sx; G.in.sy = sy; if (fire && !G.in.fire) G.in.press = true; G.in.fire = !!fire; if (flare) G.in.flare = true; },
  place(d) { const me = G.me, f = G.foe; f.x = me.x + Math.sin(me.yaw) * d; f.z = me.z + Math.cos(me.yaw) * d; f.y = me.y; f.yaw = me.yaw; f.pitch = 0; },   // puts him dead ahead (tests)
  rel, ttiOf, makeCfg, foeLook,
  live() { HEADLESS = false; last = performance.now(); },
  go(L) { HEADLESS = false; level = L; startFight(); },
  PH, FX, CAM,
  smooth() { return { step: stepN, half, sky: GLX ? 'fast' : 'plain', stuck, vsync: +vsync.toFixed(1), ms: +ftAvg.toFixed(1), dpr: DPR, draws, glows: gqN, smoke: PT.length }; },
  skyq(q, bias, aniso) { GLQ = q; if (bias != null) SKY_BIAS = bias; if (aniso != null) SKY_ANISO = aniso; },      // tests: how finely the sky is painted
  finest() { stuck = true; stepN = 0; half = 0; applyStep(); },    // tests and card pictures: the finest picture, and leave it there
  gl(on) { if (on) glTried = false; else { skyOff(); glTried = true; } },       // tests: the sky by the graphics chip, or the slow way
  get G() { return G; }
};
applyStep(); addEventListener('resize', layout);
HERO = buildJet('twin', '#9aa5b2', '#6d7785', '#e9eef4', true);
showHome(); requestAnimationFrame(frame);
})();
</script>
</body>
</html>
