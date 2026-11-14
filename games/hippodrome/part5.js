
// ---------- the race on screen: feedback for everything that happens ----------
let R = null, paused = false, PET = [];
function say(text, color = '#fff', size = 1, y = 0.26, dur = 0.9) { if (!R || HEADLESS) return; R.msgs = R.msgs.filter(m => Math.abs(m.y - y) > 0.04); R.msgs.push({ text, color, size, y, t: 0, dur }); }
function petals(n) { for (let i = 0; i < n; i++) PET.push({ x: Math.random() * W, y: -20 - Math.random() * H * 0.5, vx: (Math.random() - 0.5) * 40, vy: 90 + Math.random() * 120, r: Math.random() * 6, vr: (Math.random() - 0.5) * 6, s: 4 + Math.random() * 5, col: ['#f2c14e', '#fff3c4', '#e87a6a', '#f6efdd', '#8fbf6a'][(Math.random() * 5) | 0] }); }
function fx(R) {
  const me = R.me;
  for (const e of R.evs) {
    const c = e.c, mine = c && c.me, near = c && !mine && Math.abs(c.p - me.p) < 45;
    switch (e.type) {
      case 'tick': sfx.tick(e.val); vibe(HAP.tick); break;
      case 'go': sfx.go(); say('GO!', '#f2c14e', 1.7, 0.3, 0.8); R.crowd = 0.9; break;
      case 'jump': sfx.falseStart(); say('TOO EARLY!', '#ff9a7a', 1, 0.3, 1.3); break;
      case 'pstart': me.lastQ = 2; sfx.whip(2, 0); say('FLYING START!', '#f2c14e', 1.1, 0.3, 1.1); vibe(HAP.sharp); CAM.kick = 1; R.crowd = 1; break;
      case 'whip': if (!mine) break; me.lastQ = e.val; sfx.whip(e.val, me.chain - 1);
        if (e.val === 2) { CAM.kick = Math.max(CAM.kick, 0.7); vibe(HAP.tick); say(me.chain >= 3 ? `PERFECT ×${me.chain}` : 'PERFECT', '#f2c14e', 0.6, 0.7, 0.5); }
        else if (e.val === 1) say('GOOD', '#f6efdd', 0.5, 0.7, 0.4);
        else say('OFF THE BEAT', '#ff9a7a', 0.5, 0.7, 0.6);
        break;
      case 'blown': sfx.blown(); say('HORSES BLOWN!', '#ff7a6b', 0.9, 0.3, 1.4); break;
      case 'spent': sfx.spent(); break;
      case 'wall': if (mine) { sfx.wall(); FX.shake = Math.max(FX.shake, 5 + e.val * 1.5); vibe(HAP.light); say('SCRAPE!', '#ff9a7a', 0.8, 0.3, 0.7); } if (mine || near) sparks(R, c.wx, 0.6, c.wz, 10); break;
      case 'post': if (mine) say('THE POST!', '#ff7a6b', 1.2, 0.3, 1.4); break;
      case 'lift': if (mine) { say('WHEEL UP! EASE OFF', '#ffb03a', 0.8, 0.3, 0.8); sfx.lift(); vibe(HAP.light); } break;
      case 'tip': if (mine) say('OVER SHE GOES!', '#ff7a6b', 1.1, 0.3, 1.4); break;
      case 'wreck':
        if (mine) { if (c.st !== 'out') sfx.wreck(); FX.shake = 16; FX.stop = 0.1; FX.flash = 0.45; vibe(HAP.thud); R.crowd = 1; if (c.st !== 'out') float(R, me, `−${Math.round(PH.WRECKD * R.dmgIn)}`, '#ff7a6b'); }
        else if (near && c.st !== 'out') { sfx.wreck(); say(`${c.name.toUpperCase()} WRECKS!`, '#f6efdd', 0.7, 0.2, 1.2); R.crowd = 0.9; }
        if (c.wx != null) { dust(R, c.wx, c.wz, 14, true); sparks(R, c.wx, 0.8, c.wz, 12); } break;
      case 'clash': if (mine) { sfx.clash(); FX.shake = Math.max(FX.shake, 4 + e.val); vibe(HAP.light); sparks(R, me.wx, 0.5, me.wz, 7); } break;
      case 'bump': if (mine) { sfx.clash(); FX.shake = Math.max(FX.shake, 5); say('BLOCKED!', '#ff9a7a', 0.7, 0.3, 0.6); } break;
      case 'turn': {
        const q = e.val, lt = me.lastTurn; sfx.turn(q, me.tChain - 1);
        if (q === 3) { const graze = lt.clear < 0.6; say(graze ? 'HUB-GRAZE!' : 'PERFECT TURN', '#f2c14e', graze ? 1.1 : 0.95, 0.24, 1.3); vibe(HAP.sharp); R.crowd = 1; FX.gold = 0.5; }
        else if (q === 2) say('GOOD TURN', '#f6efdd', 0.75, 0.24, 1);
        else if (q === 1) say('WIDE', '#d9c9a8', 0.7, 0.24, 0.9);
        R.note = q ? { text: `${lt.t.toFixed(2)} s round the post${q === 3 ? `, clear by ${Math.max(0, lt.clear).toFixed(1)} m` : ''}`, t: 0 } : null; break;
      }
      case 'lap': { const fin = e.val === R.laps; sfx.lap(fin); say(fin ? 'FINAL LAP!' : `LAP ${e.val}`, fin ? '#f2c14e' : '#f6efdd', fin ? 1.3 : 0.9, 0.18, 1.3); if (fin) R.crowd = 1; break; }
      case 'rank': { const up = me.rank < e.val; sfx.pass(up); if (up) { say(`${ORD[me.rank]}!`, '#f2c14e', 1.05, 0.18, 0.9); R.crowd = Math.max(R.crowd, 0.8); } else say(`${ORD[me.rank]}`, '#d9c9a8', 0.7, 0.18, 0.8); break; }
      case 'warn': if (me.warn && me.warn.by === c) { sfx.warn(); vibe(HAP.sharp); } break;
      case 'evade': if (near) R.note = { text: `${c.name} pulls away from your swing`, t: 0 }; break;
      case 'miss': if (me.st === 'run' && me.vd * e.val > 1.2) { say('DODGED!', '#f2c14e', 0.95, 0.3, 0.9); sfx.dodge(); vibe(HAP.tick); R.crowd = Math.max(R.crowd, 0.8); } break;
      case 'ram': {                           // one chariot swung into another: v.d is what the one struck lost, v.back what the striker took back
        const v = e.val, to = v.to, dn = Math.round(v.d), bn = Math.round(v.back);
        if (mine) {
          sfx.ram(v.d); FX.shake = Math.max(FX.shake, 6 + v.d * 0.25); if (v.d > 22) FX.stop = Math.max(FX.stop, 0.05); vibe(v.d > 22 ? HAP.sharp : HAP.light); CAM.kick = Math.max(CAM.kick, 0.6); R.crowd = Math.max(R.crowd, 0.85);
          if (v.d >= 18) say(v.clash ? 'CLASH!' : v.pin ? 'CRUSHED ON THE WALL!' : v.wheel ? 'WHEEL STRIKE!' : 'RAM!', '#f2c14e', v.pin || v.wheel ? 1 : 0.85, 0.3, 0.8); else if (v.d >= 7) say('RAM', '#f6efdd', 0.6, 0.3, 0.6);     // a glancing blow gets a quieter word
          if (dn >= 3) float(R, to, `−${dn}`, '#ffd76a'); if (bn >= 3) float(R, me, `−${bn}`, '#ff9a7a');
        } else if (to.me) {
          sfx.ram(v.d); FX.shake = Math.max(FX.shake, 9 + v.d * 0.3); FX.flash = Math.max(FX.flash, 0.22 + v.d * 0.007); if (v.d > 18) FX.stop = Math.max(FX.stop, 0.05); vibe(HAP.thud);
          if (v.d >= 7) say(v.clash ? 'CLASH!' : v.pin ? 'CRUSHED ON THE WALL!' : 'HIT!', '#ff7a6b', v.pin ? 1 : 0.95, 0.3, 0.9);
          if (dn >= 2) float(R, me, `−${dn}`, '#ff7a6b'); if (bn >= 3) float(R, c, `−${bn}`, '#ffd76a');
        }
        if (c.wx != null && to.wx != null) { const mx = (c.wx + to.wx) / 2, mz = (c.wz + to.wz) / 2; planks(R, mx, 0.9, mz, 4 + v.d * 0.3, ['#6b4a2a', '#8a6a3a', to.col]); sparks(R, mx, 0.7, mz, 8); dust(R, mx, mz, 3, true); }
        break;
      }
      case 'out': {                           // a chariot has broken up
        const by = e.val;
        if (mine) { sfx.out(true); FX.shake = 22; FX.stop = 0.14; FX.flash = 0.6; FX.slow = 0.9; vibe(HAP.heavy); R.crowd = 1; R.msgs = []; R.note = null; }
        else if (by && by.me) { sfx.out(false); sfx.kill(); say(`${c.name.toUpperCase()} IS OUT!`, '#f2c14e', 1.15, 0.2, 1.7); FX.gold = 0.8; FX.stop = Math.max(FX.stop, 0.1); vibe(HAP.heavy); R.crowd = 1; broken++; store.set('broken', broken); }
        else if (near) { sfx.out(false); say(`${c.name.toUpperCase()} IS OUT!`, '#f6efdd', 0.8, 0.2, 1.4); R.crowd = Math.max(R.crowd, 0.9); }
        breakUp(R, c); break;
      }
      case 'finish': onFinish(R); break;
    }
  }
  R.evs.length = 0;
}
function onFinish(R) {
  const res = R.res, me = R.me, L = R.L, win = res.place === 1;
  $('pauseBtn').classList.add('hidden');
  if (res.out) {                              // your chariot broke up: the race is lost, and nothing is recorded as a best
    res.stars = 0; setTimeout(() => sfx.lose(), 700); R.crowd = 0.5;
    streaks[L] = (streaks[L] || 0) + 1; store.set('streaks', streaks); res.nbT = res.nbL = false; res.nbC = bestChain > 0 && me.topChain > bestChain; if (me.topChain > bestChain) { bestChain = me.topChain; store.set('bestChain', bestChain); }
    return;
  }
  res.stars = win ? 3 : res.ok ? (res.place === 2 ? 2 : 1) : 0;
  if (win) { sfx.win(R.boss); vibe(HAP.heavy); FX.slow = 0.6; FX.gold = 1; petals(R.boss ? 140 : 90); wreaths++; store.set('wreaths', wreaths); }
  else if (res.ok) { sfx.place(); vibe(HAP.sharp); petals(26); }
  else sfx.lose();                                                    // no buzz for a loss
  R.crowd = win ? 1 : res.ok ? 0.85 : 0.45;
  streaks[L] = res.ok ? 0 : (streaks[L] || 0) + 1; store.set('streaks', streaks);
  if (res.ok) { stars[L] = Math.max(stars[L] || 0, res.stars); store.set('stars', stars); unlocked = Math.max(unlocked, L + 1); store.set('unlocked', unlocked); }
  if (res.ok && !HEADLESS) store.set('level', L + 1);       // he comes back to the next race, even if he leaves before pressing NEXT
  const bt = bestTime[L], bl = bestLap[L];
  res.prevT = bt; res.nbT = !!bt && res.time < bt; if (!bt || res.time < bt) { bestTime[L] = res.time; store.set('bestTime', bestTime); }
  res.nbL = !!bl && res.lap < bl; if (res.lap && (!bl || res.lap < bl)) { bestLap[L] = res.lap; store.set('bestLap', bestLap); }
  res.nbC = bestChain > 0 && me.topChain > bestChain; if (me.topChain > bestChain) { bestChain = me.topChain; store.set('bestChain', bestChain); }
  if (res.nbT || res.nbL || res.nbC) setTimeout(() => { sfx.best(); vibe(HAP.best); }, 900);
}
function visuals(R, dt, rdt) {               // things that only matter to the eye and the ear
  const me = R.me;
  for (const m of R.msgs) m.t += rdt; R.msgs = R.msgs.filter(m => m.t < m.dur);
  if (R.note) { R.note.t += rdt; if (R.note.t > 2.2) R.note = null; }
  for (const p of R.parts) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; if (p.k) p.vy -= 14 * dt; else p.vy *= 0.97; }
  R.parts = R.parts.filter(p => p.t < p.life && p.y > -0.2);
  for (const p of PET) { p.x += (p.vx + Math.sin(p.r) * 30) * rdt; p.y += p.vy * rdt; p.r += p.vr * rdt; } PET = PET.filter(p => p.y < H + 30);
  FX.shake = Math.max(0, FX.shake - rdt * 40); FX.flash = Math.max(0, FX.flash - rdt); FX.gold = Math.max(0, FX.gold - rdt * 0.9);
  R.crowd += ((R.phase === 'finish' ? 0.7 : me.lap >= R.laps ? 0.5 : 0.28) - R.crowd) * Math.min(1, rdt * 0.5);
  for (const f of R.floats) f.t += rdt; if (R.floats.length) R.floats = R.floats.filter(f => f.t < 1);
  for (const o of R.loose) {                 // what a broken chariot leaves behind: its team running free, a wheel bowling away
    o.t += dt;
    if (o.team) { o.v += (11 - o.v) * Math.min(1, dt * 0.6); o.p += o.v * dt; o.d += (o.dT - o.d) * Math.min(1, dt * 0.6); o.gal += 2 * dt / strideT(o.v); }
    else { o.wx += o.vx * dt; o.wz += o.vz * dt; o.y += o.vy * dt; o.vy -= 14 * dt; if (o.y < 0.5) { o.y = 0.5; o.vy = Math.abs(o.vy) * 0.45; o.vx *= 0.9; o.vz *= 0.9; } o.vx *= 1 - 0.5 * dt; o.vz *= 1 - 0.5 * dt; o.spin += Math.hypot(o.vx, o.vz) * dt * 2; o.face += dt * 1.5; }
  }
  if (R.loose.length) R.loose = R.loose.filter(o => o.t < (o.team ? 4.2 : 3));
  for (const c of R.cars) {                  // dust from every team
    if (c.st === 'run' && c.wx != null && c.str < c.strMax * 0.67 && c.str >= c.strMax * 0.34 && Math.random() < 3.5 * dt && R.parts.length < 150)       // a damaged chariot trails a thin wisp
      R.parts.push({ k: 0, x: c.wx + (Math.random() - 0.5) * 0.8, y: 0.7, z: c.wz + (Math.random() - 0.5) * 0.8, vx: (Math.random() - 0.5), vy: 1 + Math.random(), vz: (Math.random() - 0.5), t: 0, life: 0.6 + Math.random() * 0.4, s0: 0.25, s1: 0.9, col: '#6a5f52', a: 0.22 });
    if (c.st === 'run' && c.wx != null && c.str < c.strMax * 0.34) {       // a failing chariot trails smoke and sheds splinters
      if (Math.random() < 9 * dt && R.parts.length < 150) R.parts.push({ k: 0, x: c.wx + (Math.random() - 0.5), y: 0.7, z: c.wz + (Math.random() - 0.5), vx: (Math.random() - 0.5), vy: 1.2 + Math.random(), vz: (Math.random() - 0.5), t: 0, life: 0.7 + Math.random() * 0.5, s0: 0.3, s1: 1.3, col: '#4a4038', a: 0.3 });
      if (Math.random() < 1.6 * dt) planks(R, c.wx, 0.9, c.wz, 1, ['#6b4a2a', c.col]);
      if (Math.random() < 7 * dt) sparks(R, c.wx, 0.25, c.wz, 2);
      if (c.me) sfx.creak();
    }
    if (c.st !== 'run' || c.wx == null || c.v < 2) continue;
    const reined = c.b > 0.3 || c.auto > 0, rate = c.v * 0.5 + c.slide * 14 + (reined ? 9 : 0) + c.scrape * 12;
    if (Math.random() < rate * dt) dust(R, c.wx, c.wz, 1, c.slide > 0.5 || reined);
    if (c.scrape > 0.6 && Math.random() < 20 * dt) sparks(R, c.wx, 0.5, c.wz, 2);
  }
  if (me.st === 'run' && me.v > 3) {         // your team's hoofbeats: three quick, then the accent on the beat
    const p0 = me.hp == null ? me.ph : me.hp;
    for (const h of [0.7, 0.8, 0.9]) if (p0 < h && me.ph >= h) sfx.hoof(false);
    if (me.ph < p0) sfx.hoof(true);
  }
  me.hp = me.ph;
}

// ---------- on-screen instruments ----------
function wreath(cx, cy, r, col) {
  for (const sd of [-1, 1]) for (let i = 0; i < 9; i++) { const a = Math.PI / 2 + sd * (0.35 + i * 0.3), x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; ctx.save(); ctx.translate(x, y); ctx.rotate(a + sd * 1.1); ctx.fillStyle = i & 1 ? col : shade(col, 0.8); ctx.beginPath(); ctx.ellipse(0, 0, r * 0.2, r * 0.085, 0, 0, 6.2832); ctx.fill(); ctx.restore(); }
}
function coachLine(R) {                      // one plain instruction at a time, on the learning levels
  const me = R.me, L = R.L;
  if (R.phase === 'count') return L <= 4 ? 'CRACK THE WHIP RIGHT ON "GO!"' : '';
  if (R.phase !== 'race' || me.st !== 'run') return '';
  if (me.warn && L <= 14) return me.warn.sg > 0 ? 'DODGE! STEER RIGHT ▶' : '◀ DODGE! STEER LEFT';       // a rival is winding up beside you
  if (L > 10) return '';
  turnInfo(R.T, sOf(R.T, me.p)); const inT = TI.k, dist = TI.dist;
  let beside = false;                        // the first few races with a rival level with you on a straight: show how to ram
  if (L >= 3 && L <= 9 && !me.rams && !inT && dist > 55) for (const c of R.cars) { if (c === me || c.st !== 'run') continue; let dp = c.p - me.p; dp -= Math.round(dp / R.T.L) * R.T.L; const gd = Math.abs(c.d - me.d); if (Math.abs(dp) < 3 && gd > 2.9 && gd < 7) { beside = true; break; } }
  if (L > 6) return me.auto > 0 && IN.wId == null ? 'REIN IN YOURSELF: HOLD RIGHT THUMB' : beside ? 'RIVAL BESIDE YOU: SWERVE INTO THEM' : '';
  if (L <= 2) { if (!me.steered) return 'LEFT THUMB: SLIDE TO STEER'; if (me.whips < 2) return 'RIGHT THUMB: TAP TO WHIP'; }
  if (inT) return me.lat > 2.5 ? 'STEER LEFT · HUG THE POST' : '';
  if (dist < 45 && me.v > 12) return L === 1 ? 'YOUR TEAM SLOWS FOR THE TURN' : !me.reined || L <= 4 ? 'HOLD RIGHT THUMB: REIN IN' : '';
  if (L >= 2 && me.pWhips < 4 && dist > 50) return 'WHIP JUST AS THE RING CLOSES';
  if (beside) return 'RIVAL BESIDE YOU: SWERVE INTO THEM';
  return '';
}
function drawHud(R, now) {
  const me = R.me, T = R.T, pad = 12 * k, sm = `800 ${Math.round(11.5 * k)}px Nunito, sans-serif`;
  if (R.phase === 'done') { for (const p of PET) { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.col; ctx.beginPath(); ctx.ellipse(0, 0, p.s, p.s * 0.45, 0, 0, 6.2832); ctx.fill(); ctx.restore(); } return; }     // behind the end card: only the petals
  ctx.save(); ctx.textBaseline = 'alphabetic'; ctx.lineCap = 'round';
  if (FX.flash > 0) { const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.8); vg.addColorStop(0, 'rgba(255,0,0,0)'); vg.addColorStop(1, `rgba(180,20,10,${FX.flash * 1.4})`); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H); }
  if (FX.gold > 0) { const vg = ctx.createRadialGradient(W / 2, H * 0.45, H * 0.25, W / 2, H * 0.45, H * 0.8); vg.addColorStop(0, 'rgba(255,215,120,0)'); vg.addColorStop(1, `rgba(255,205,100,${FX.gold * 0.4})`); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H); }
  if (me.urge > 0.55 && me.st === 'run') {   // speed streaks at full cry
    ctx.strokeStyle = `rgba(255,255,255,${(me.urge - 0.55) * 0.35})`; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = (i * 0.63 + Math.floor(now * 14) * 1.7) % 6.2832, r1 = H * 0.36 + (i % 3) * 30, r2 = r1 + 50 + (i % 4) * 22; ctx.moveTo(W / 2 + Math.cos(a) * r1 * 0.75, H * 0.48 + Math.sin(a) * r1); ctx.lineTo(W / 2 + Math.cos(a) * r2 * 0.75, H * 0.48 + Math.sin(a) * r2); }
    ctx.stroke();
  }
  ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 5;
  // your place, top left
  const pos = me.fin ? me.place : me.rank || R.n, count = R.phase === 'count';
  ctx.textAlign = 'left';
  if (count) {                               // on the starting line nobody has a place yet: say where we are and what is to come
    ctx.fillStyle = '#f2c14e'; ctx.font = `${Math.round(22 * k)}px ${GK}`; ctx.fillText(R.V.name.toUpperCase(), pad, 34 * k);
    ctx.font = sm; ctx.fillStyle = '#f6efdd'; ctx.fillText(`RACE ${R.L}  ·  ${R.n} CHARIOTS  ·  ${R.laps} LAPS`, pad + 1, 52 * k);
  } else {
    ctx.fillStyle = pos === 1 ? '#f2c14e' : '#f6efdd'; ctx.font = `${Math.round(44 * k)}px ${GK}`; ctx.fillText(ORD[pos], pad, 50 * k);
    ctx.font = sm; ctx.fillStyle = '#f6efdd'; ctx.fillText(`OF ${R.n}  ·  LAP ${clamp(me.lap, 1, R.laps)}/${R.laps}`, pad + 2, 68 * k);
  }
  if (R.help && !count) { ctx.shadowBlur = 0; ctx.fillStyle = '#a9e8c0'; rrect(pad, 75 * k, 56 * k, 14 * k, 6 * k); ctx.fill(); ctx.fillStyle = '#0e1f33'; ctx.font = `800 ${Math.round(9 * k)}px Nunito, sans-serif`; ctx.fillText('HELP ON', pad + 7 * k, 85.5 * k); ctx.shadowBlur = 5; }
  // the leaderboard, top right: who is first, and where you are
  ctx.font = sm; const rh = 15.5 * k;
  for (let i = 0; i < R.order.length && !count; i++) {
    const c = R.order[i], y = 22 * k + i * rh;
    if (c.me) { ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(242,193,78,.28)'; rrect(W - pad - 100 * k, y - 11.5 * k, 104 * k, 15 * k, 5 * k); ctx.fill(); ctx.shadowBlur = 5; }
    const dead = c.st === 'out';
    ctx.fillStyle = c.me ? '#f2c14e' : dead ? 'rgba(246,239,221,.5)' : '#f6efdd'; ctx.textAlign = 'right'; ctx.fillText(c.name, W - pad, y); ctx.textAlign = 'left'; ctx.fillText(dead ? '✕' : i + 1, W - pad - 97 * k, y);
    if (dead) { const nw = ctx.measureText(c.name).width; ctx.fillRect(W - pad - nw - 2, y - 4.5 * k, nw + 4, 1.4 * k); }     // out of the race: struck through
    ctx.globalAlpha = dead ? 0.45 : 1; ctx.fillStyle = c.col; ctx.beginPath(); ctx.arc(W - pad - 82 * k, y - 4 * k, 4 * k, 0, 6.2832); ctx.fill(); ctx.globalAlpha = 1;
    if (c.me) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2; ctx.stroke(); }
  }
  // the countdown: three bronze discs
  if (R.phase === 'count') for (let i = 0; i < 3; i++) { ctx.fillStyle = i < R.tickN ? '#f2c14e' : 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.arc(W / 2 + (i - 1) * 30 * k, H * 0.25, 9 * k, 0, 6.2832); ctx.fill(); }
  // who is level with you, shown at the edge of the screen on their side; red and pulsing while they wind up to ram you
  if (R.phase === 'race' && me.st === 'run') for (const side of [-1, 1]) {
    let best = null, bs = 1e9, bdp = 0;
    for (const c of R.cars) { if (c === me || c.st !== 'run') continue; let dp = c.p - me.p; dp -= Math.round(dp / T.L) * T.L; const gd = (c.d - me.d) * side; if (gd <= 0.5 || gd > 9 || Math.abs(dp) > 7) continue; const sc = Math.abs(dp) + gd * 0.5; if (sc < bs) { bs = sc; best = c; bdp = dp; } }
    if (!best) continue;
    if (!(best.rm === 1 || best.rm === 2) && best.wx != null && P3(best.wx, 1.5, best.wz) && SX > 34 * k && SX < W - 34 * k) continue;     // in plain view already: its own name tag is enough
    const hot = best.rm === 1 || best.rm === 2, pu = hot ? 0.5 + 0.5 * Math.sin(now * 22) : 0, w = 78 * k, h = 30 * k, x = side < 0 ? pad * 0.6 : W - pad * 0.6 - w, y = H * 0.5 - clamp(bdp, -7, 7) * 4 * k - h / 2;
    ctx.shadowBlur = 0;
    if (hot) {                               // danger from this side: the edge of the screen glows red and arrows show the way out
      const gx = side < 0 ? 0 : W, gr = ctx.createLinearGradient(gx, 0, gx - side * 90 * k, 0); gr.addColorStop(0, `rgba(225,40,25,${0.3 + 0.3 * pu})`); gr.addColorStop(1, 'rgba(225,40,25,0)'); ctx.fillStyle = gr; ctx.fillRect(side < 0 ? 0 : W - 90 * k, 0, 90 * k, H);
      ctx.fillStyle = `rgba(255,235,225,${0.75 + 0.25 * pu})`; ctx.font = `900 ${Math.round(22 * k)}px Nunito, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(side < 0 ? '▶▶' : '◀◀', side < 0 ? x + w + 22 * k + pu * 5 * k : x - 22 * k - pu * 5 * k, y + h / 2);
    }
    ctx.fillStyle = hot ? `rgba(${190 + 40 * pu},${32 + 20 * pu},22,.92)` : 'rgba(10,18,32,.55)'; rrect(x, y, w, h, 9 * k); ctx.fill();
    ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left'; ctx.fillStyle = best.col; ctx.beginPath(); ctx.arc(x + 10 * k, y + 11 * k, 4 * k, 0, 6.2832); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = `800 ${Math.round(10.5 * k)}px Nunito, sans-serif`; ctx.fillText(hot ? '! ' + best.name : best.name, x + 18 * k, y + 14.5 * k, w - 22 * k);
    const f = clamp(best.str / best.strMax, 0, 1); ctx.fillStyle = 'rgba(0,0,0,.4)'; rrect(x + 7 * k, y + 19.5 * k, w - 14 * k, 5 * k, 2.5 * k); ctx.fill();
    ctx.fillStyle = f > 0.66 ? '#9fe0a8' : f > 0.33 ? '#f2c14e' : '#ff5a3c'; rrect(x + 7 * k, y + 19.5 * k, Math.max(5 * k, (w - 14 * k) * f), 5 * k, 2.5 * k); ctx.fill();
    ctx.shadowBlur = 5;
  }
  // call-outs
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(26,13,6,.72)';
  for (const m of R.msgs) {
    const a = 1 - Math.max(0, (m.t - m.dur * 0.6) / (m.dur * 0.4)), pop = m.t < 0.12 ? 1 + 0.4 * (1 - m.t / 0.12) : 1;
    const fs = Math.round(Math.min(W * 0.1, 40) * m.size * pop); ctx.globalAlpha = a; ctx.font = `${fs}px ${GK}`; ctx.lineWidth = Math.max(2.5, fs * 0.14); ctx.strokeText(m.text, W / 2, H * m.y - m.t * 12, W * 0.94);      // a dark edge keeps the words readable over the crowd
    ctx.fillStyle = m.color; ctx.fillText(m.text, W / 2, H * m.y - m.t * 12, W * 0.94);
  }
  ctx.globalAlpha = 1;
  if (R.note) { ctx.globalAlpha = Math.min(1, (2.2 - R.note.t) / 0.4); ctx.font = sm; ctx.fillStyle = '#f6efdd'; ctx.fillText(R.note.text, W / 2, H * 0.24 + 26 * k); ctx.globalAlpha = 1; }
  if (R.phase === 'finish') {                // the finish: your place, the honest gap, and the wreath if you earned it
    const res = R.res, win = res.place === 1 && !res.out, a = Math.min(1, R.ft / 0.25), pop = 1.5 - 0.5 * easeOut(a), cy = H * 0.4, big = res.out ? 'DESTROYED' : win ? 'VICTORY!' : ORD[res.place];
    ctx.globalAlpha = a;
    if (win) wreath(W / 2, cy - 4 * k, 86 * k * pop, '#7fae4e');
    ctx.font = `${Math.round((res.out ? 46 : 58) * k * pop)}px ${GK}`; ctx.lineWidth = 7 * k; ctx.strokeText(big, W / 2, cy, W * 0.9);
    ctx.fillStyle = res.out ? '#ff7a6b' : win ? '#f2c14e' : res.ok ? '#f6efdd' : '#d9c9a8'; ctx.fillText(big, W / 2, cy, W * 0.9);
    ctx.font = `800 ${Math.round(13.5 * k)}px Nunito, sans-serif`; ctx.fillStyle = '#f6efdd'; ctx.lineWidth = 3.5 * k;
    const line = res.out ? (res.by ? `Your chariot was broken by ${res.by}` : 'Your chariot broke up') : win ? (res.behind ? `Won by ${res.gapBehind.toFixed(2)} s from ${res.behind}` : 'Unchallenged') : res.ahead ? `${res.gapAhead.toFixed(2)} s behind ${res.ahead}` : '';
    ctx.strokeText(line, W / 2, cy + 44 * k, W * 0.92); ctx.fillText(line, W / 2, cy + 44 * k, W * 0.92);
    if (R.ft > 0.9) { ctx.globalAlpha = 0.6 + 0.25 * Math.sin(now * 5); ctx.fillText('Tap to continue', W / 2, H * 0.92); }
    ctx.globalAlpha = 1;
  }
  for (const p of PET) { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.col; ctx.shadowBlur = 0; ctx.beginPath(); ctx.ellipse(0, 0, p.s, p.s * 0.45, 0, 0, 6.2832); ctx.fill(); ctx.restore(); }
  if (R.phase === 'finish') { ctx.restore(); return; }
  // coach line
  const cl = coachLine(R);
  if (cl) { ctx.font = `800 ${Math.round(13 * k)}px Nunito, sans-serif`; const tw = ctx.measureText(cl).width + 26 * k; ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(10,18,32,.6)'; rrect(W / 2 - tw / 2, H * 0.75 - 14 * k, tw, 28 * k, 14 * k); ctx.fill(); ctx.fillStyle = '#f2c14e'; ctx.fillText(cl, W / 2, H * 0.75 + 1); ctx.shadowBlur = 5; }
  // left thumb: the reins
  const by = H - 92 * k, lx = W * 0.22, wxp = W * 0.78;
  ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(10,18,32,.34)'; rrect(lx - 52 * k, by - 9 * k, 104 * k, 18 * k, 9 * k); ctx.fill();
  ctx.fillStyle = 'rgba(246,239,221,.3)'; ctx.fillRect(lx - 0.75, by - 6 * k, 1.5, 12 * k);
  ctx.fillStyle = IN.sId != null ? '#f6efdd' : 'rgba(246,239,221,.6)'; ctx.beginPath(); ctx.arc(lx + me.u * 40 * k, by, 13 * k, 0, 6.2832); ctx.fill();
  ctx.fillStyle = 'rgba(246,239,221,.75)'; ctx.font = `800 ${Math.round(9.5 * k)}px Nunito, sans-serif`; ctx.fillText('◀  REINS  ▶', lx, by + 24 * k);
  // right thumb: the whip, the beat, the horses' wind
  const r0 = 30 * k, reined = IN.wId != null && me.b > 0.3, blown = me.blown > 0, sT = strideT(me.v), win = me.st === 'run' && !blown && !reined && (me.ph * sT < R.wP || (1 - me.ph) * sT < R.wP);
  ctx.fillStyle = blown ? 'rgba(90,90,90,.55)' : win ? 'rgba(242,193,78,.6)' : 'rgba(10,18,32,.4)'; ctx.beginPath(); ctx.arc(wxp, by, r0, 0, 6.2832); ctx.fill();
  if (me.urge > 0.02 && !blown) { ctx.fillStyle = 'rgba(242,193,78,.5)'; ctx.beginPath(); ctx.arc(wxp, by, r0 * Math.sqrt(me.urge), 0, 6.2832); ctx.fill(); }
  if (me.st === 'run' && !blown && !reined) { ctx.strokeStyle = win ? '#f2c14e' : `rgba(246,239,221,${0.35 + 0.5 * me.ph})`; ctx.lineWidth = (win ? 4 : 2.5) * k; ctx.beginPath(); ctx.arc(wxp, by, r0 * (me.ph * sT < R.wP ? 1 : 1 + 0.95 * (1 - me.ph)), 0, 6.2832); ctx.stroke(); }
  if (reined) { ctx.strokeStyle = '#ff7a6b'; ctx.lineWidth = 4 * k; ctx.beginPath(); ctx.arc(wxp, by, r0 + 3 * k, 0, 6.2832); ctx.stroke(); }
  ctx.fillStyle = '#f6efdd'; ctx.font = `800 ${Math.round(10.5 * k)}px Nunito, sans-serif`; ctx.fillText(blown ? 'BLOWN' : reined ? 'REINING' : 'WHIP', wxp, by + 1);
  if (me.chain >= 2) { ctx.fillStyle = '#f2c14e'; ctx.font = `${Math.round(17 * k)}px ${GK}`; ctx.fillText(`×${me.chain}`, wxp + r0 + 16 * k, by - r0 * 0.6); }
  const bw = 78 * k, bx = wxp - bw / 2, wy = by - r0 * 2 - 16 * k, low = me.wind < 0.22 || blown;
  ctx.fillStyle = 'rgba(10,18,32,.45)'; rrect(bx, wy, bw, 7 * k, 3.5 * k); ctx.fill();
  ctx.fillStyle = low ? (Math.sin(now * 14) > 0 ? '#ff5a3c' : '#ffb03a') : me.wind < 0.45 ? '#f2c14e' : '#9fe0a8'; rrect(bx, wy, Math.max(0.001, bw * me.wind), 7 * k, 3.5 * k); ctx.fill();
  ctx.fillStyle = 'rgba(246,239,221,.8)'; ctx.font = `800 ${Math.round(9 * k)}px Nunito, sans-serif`; ctx.fillText("HORSES' WIND", wxp, wy - 7 * k);
  // how much more your own chariot can take, above the reins
  const cf2 = clamp(me.str / me.strMax, 0, 1), cx0 = lx - bw / 2;
  ctx.fillStyle = 'rgba(10,18,32,.45)'; rrect(cx0, wy, bw, 7 * k, 3.5 * k); ctx.fill();
  ctx.fillStyle = me.hurtT < 0.3 && Math.sin(now * 45) > 0 ? '#fff' : cf2 < 0.34 ? (Math.sin(now * 14) > 0 ? '#ff5a3c' : '#ffb03a') : cf2 < 0.67 ? '#f2c14e' : '#9fe0a8'; rrect(cx0, wy, Math.max(0.001, bw * cf2), 7 * k, 3.5 * k); ctx.fill();
  ctx.fillStyle = 'rgba(246,239,221,.8)'; ctx.fillText(cf2 < 0.34 ? 'CHARIOT FAILING' : cf2 < 0.67 ? 'CHARIOT DAMAGED' : 'YOUR CHARIOT', lx, wy - 7 * k);
  // the little map: every team on the oval
  const tot = T.Ls + 2 * (T.Rc + T.hw), ms = 100 * k / tot, mx = W / 2, my = H - 84 * k, ro = (T.Rc + T.hw) * ms, hl = T.Ls / 2 * ms;
  ctx.fillStyle = 'rgba(10,18,32,.38)'; ctx.beginPath(); ctx.arc(mx - hl, my, ro, Math.PI / 2, Math.PI * 1.5); ctx.arc(mx + hl, my, ro, -Math.PI / 2, Math.PI / 2); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(246,239,221,.5)'; ctx.lineWidth = Math.max(1.5, T.rIn * ms * 1.4); ctx.beginPath(); ctx.moveTo(mx - hl, my); ctx.lineTo(mx + hl, my); ctx.stroke();
  for (const c of R.order) { if (c.wx == null || c.me || c.st === 'out') continue; ctx.fillStyle = c.col; ctx.beginPath(); ctx.arc(mx + c.wx * ms, my - c.wz * ms, 2.7 * k, 0, 6.2832); ctx.fill(); }
  if (me.wx != null) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(mx + me.wx * ms, my - me.wz * ms, 4 * k, 0, 6.2832); ctx.fill(); ctx.fillStyle = '#b3261e'; ctx.beginPath(); ctx.arc(mx + me.wx * ms, my - me.wz * ms, 2.4 * k, 0, 6.2832); ctx.fill(); }
  ctx.restore();
}
function draw(now) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (!R) { ctx.fillStyle = '#0e1f33'; ctx.fillRect(0, 0, W, H); return; }
  drawWorld(R);
  if (R.phase !== 'home') drawHud(R, now);
}

// ---------- two thumbs ----------
const IN = { sId: null, sx0: 0, sx: 0, wId: null, wT: 0 }, KEY = { l: 0, r: 0, d: 0 };
function readInput(now) {
  const me = R.me; let u = 0, b = 0;
  if (IN.sId != null) {                      // left thumb: slide to steer, from wherever it first touched
    const full = 56 * k; let dx = IN.sx - IN.sx0;
    if (dx > full) { IN.sx0 = IN.sx - full; dx = full; } else if (dx < -full) { IN.sx0 = IN.sx + full; dx = -full; }
    const raw = dx / full, a = Math.abs(raw); u = a < 0.07 ? 0 : Math.sign(raw) * Math.pow((a - 0.07) / 0.93, 1.15);
  }
  if (KEY.l) u = -1; if (KEY.r) u = 1;
  if (IN.wId != null) b = clamp((now - IN.wT - 120) / 150, 0, 1);      // right thumb held down: rein in
  if (KEY.d) b = 1;
  me.u = u; me.b = b;
  if (Math.abs(u) > 0.3) me.steered = 1;
  if (b > 0.6) { if (!me.reinFx && me.st === 'run') { sfx.rein(); me.reinFx = 1; } me.reined = 1; } else me.reinFx = 0;
}
cv.addEventListener('pointerdown', e => {
  audio(); ensureLoops();
  if (!R || paused) return;
  if (R.phase === 'finish') { if (R.ft > 0.9) showEnd(); return; }
  if (R.phase !== 'count' && R.phase !== 'race') return;
  if (e.clientX < W / 2) { if (IN.sId == null) { IN.sId = e.pointerId; IN.sx0 = IN.sx = e.clientX; } }
  else if (IN.wId == null) { IN.wId = e.pointerId; IN.wT = performance.now(); }
  try { cv.setPointerCapture(e.pointerId); } catch (_) {}
});
cv.addEventListener('pointermove', e => { if (e.pointerId === IN.sId) IN.sx = e.clientX; });
function release(e) {
  if (e.pointerId === IN.sId) IN.sId = null;
  else if (e.pointerId === IN.wId) { IN.wId = null; if (e.type === 'pointerup' && performance.now() - IN.wT < 230 && R && !paused) playerWhip(R); }   // a quick tap is a crack of the whip
}
cv.addEventListener('pointerup', release);
cv.addEventListener('pointercancel', release);
addEventListener('keydown', e => {           // laptop: arrows steer, space whips, down reins in
  if (e.repeat) { if (e.code === 'Space') e.preventDefault(); return; }
  if (e.code === 'ArrowLeft') KEY.l = 1; else if (e.code === 'ArrowRight') KEY.r = 1; else if (e.code === 'ArrowDown') KEY.d = 1;
  else if (e.code === 'Space') { e.preventDefault(); audio(); ensureLoops(); if (R && R.phase === 'finish') { if (R.ft > 0.9) showEnd(); } else if (R && !paused) playerWhip(R); }
});
addEventListener('keyup', e => { if (e.code === 'ArrowLeft') KEY.l = 0; else if (e.code === 'ArrowRight') KEY.r = 0; else if (e.code === 'ArrowDown') KEY.d = 0; });

// ---------- screens ----------
function show(id) { ['ovHome', 'ovRules', 'ovLevels', 'ovEnd', 'ovPause'].forEach(key => $(key).classList.toggle('hidden', key !== id)); }
function savedLevel() { level = Math.min(Math.max(1, store.get('level', 1) | 0), unlocked); }
function showHome() {
  savedLevel();
  R = makeRace(level, { help: (streaks[level] || 0) >= 3 }); R.phase = 'home'; paused = false; loopsOff(); PET = [];
  $('pauseBtn').classList.add('hidden');
  const fav = R.cars[0];
  $('hLvl').textContent = level; $('hVenue').textContent = R.V.name; $('hGames').textContent = R.V.games;
  $('hPills').innerHTML = `<span class="pill">${R.laps} laps</span><span class="pill">${R.n} chariots</span><span class="pill">${R.boss ? 'Champion' : 'Favourite'}: ${fav.full}</span>` + (R.boss ? '<span class="pill" style="background:#f2c14e;color:#3a1d08">YOU MUST WIN</span>' : `<span class="pill">Top ${R.need} go through</span>`);
  $('hStat').innerHTML = [bestTime[level] ? `Your best here: <b>${fmtT(bestTime[level])}</b>` : '', wreaths ? `Wreaths won: <b>${wreaths}</b>` : '', broken ? `Rivals broken: <b>${broken}</b>` : ''].filter(Boolean).join(' · ') + (R.help ? `<br><span class="help">Help on: your rivals drive a touch slower and pick fewer fights until you get through.</span>` : '');
  show('ovHome');
}
function startRace(quick) {
  audio(); ensureLoops();
  if (!HEADLESS) store.set('level', level);
  R = makeRace(level, { help: (streaks[level] || 0) >= 3 }); R.phase = 'count'; paused = false; PET = [];
  if (quick === true) quickStart(R);
  IN.sId = IN.wId = null; FX.shake = FX.stop = FX.slow = FX.flash = FX.gold = 0; CAM.kick = 0;
  if (!HEADLESS) { camFollow(R, 0, true); $('pauseBtn').classList.remove('hidden'); show(null); }
  last = performance.now();
}
function showEnd() {
  if (!R || R.phase !== 'finish') return; R.phase = 'done'; loopsOff();
  const res = R.res, me = R.me, L = R.L, V = R.V, win = res.place === 1;
  $('eTitle').textContent = res.out ? 'CHARIOT DESTROYED' : win ? 'VICTORY!' : `${ORD[res.place]} PLACE`; $('eTitle').style.color = win ? '#f2c14e' : res.ok ? '#f6efdd' : '#e0b8a0';
  $('eStars').innerHTML = res.ok ? [1, 2, 3].map(i => `<span class="${i <= res.stars ? '' : 'off'}">★</span>`).join('') : '';
  if (!res.board || !res.board.length) settle(R);
  const bd = res.board, rows = bd.slice(0, 3); if (!rows.some(x => x.c === me)) rows.push(bd.find(x => x.c === me));       // the real finishing order: the first three, and you
  $('eBoard').innerHTML = rows.map(x => { const i = bd.indexOf(x), gap = x.out ? 'broken' : i === 0 ? fmtT(x.fin) : x.fin ? `+${(x.fin - bd[0].fin).toFixed(2)} s` : 'did not finish'; return `<div class="${x.c.me ? 'me' : ''}"><span>${i + 1}. ${x.c.full}</span><span>${gap}</span></div>`; }).join('');
  const fight = me.rams || me.kills || me.hits ? `<br>Rams landed <b>${me.rams}</b> · rivals broken <b>${me.kills}</b> · blows taken <b>${me.hits}</b>` : '';
  if (res.out) {
    $('eStars').innerHTML = '';
    $('eSub').innerHTML = `${res.by ? `Broken by ${res.by}.` : 'Your chariot could take no more.'} ${res.by ? 'When a rival draws level, keep room to steer away: against the wall you cannot dodge.' : 'Wrecks and hard knocks on the walls wear your chariot down.'}` + fight +
      ((streaks[L] || 0) >= 3 ? `<br><span class="help">Help is on: your rivals will drive a touch slower and pick fewer fights here until you get through.</span>` : '');
    $('eMain').textContent = 'TRY AGAIN'; $('eMain').dataset.act = 'again'; $('eAlt').classList.add('hidden'); show('ovEnd'); return;
  }
  const tip = me.wrecks ? 'A wreck costs about five seconds.' : me.pTurns * 2 < me.turns ? 'Rein in before the post, then hold the inside line.' : me.pWhips < me.whips * 0.7 ? 'Whip on the beat to keep your horses fresh.' : 'To pass, get close behind a rival and turn inside them at the post.';
  $('eSub').innerHTML = (win ? `You win ${V.prize}.` : res.ok ? `Through to the next race. First place wins ${V.prize}.` : `${R.boss ? 'Only a win will do here.' : `You needed the top ${R.need}.`} ${tip}`) +
    `<br>Time <b>${fmtT(res.time)}</b>${res.nbT ? ' <b class="nb">NEW BEST</b>' : res.prevT ? ` · best ${fmtT(Math.min(res.prevT, res.time))}` : ''} · best lap <b>${res.lap.toFixed(2)} s</b>${res.nbL ? ' <b class="nb">NEW BEST</b>' : ''}` +
    `<br>Perfect turns <b>${me.pTurns}/${me.turns}</b> · longest whip chain <b>${me.topChain}</b>${res.nbC ? ' <b class="nb">NEW BEST</b>' : ''}` + fight +
    (!res.ok && (streaks[L] || 0) >= 3 ? `<br><span class="help">Help is on: your rivals will drive a touch slower and pick fewer fights here until you get through.</span>` : '');
  $('eMain').textContent = res.ok ? 'NEXT RACE' : 'TRY AGAIN'; $('eMain').dataset.act = res.ok ? 'next' : 'again';
  $('eAlt').classList.toggle('hidden', !res.ok);
  show('ovEnd');
}
$('playBtn').onclick = () => { audio(); sfx.click(); startRace(); };
// The feed's instant start (tap a card in the Game Feed app): the race he was on, and "GO!" comes at once, with no
// trumpet count to wait through (see quickStart). Races started from inside the game (next race, race again, restart) keep the count.
window.gameFeedStart = m => { savedLevel(); audio(); sfx.click(); startRace(m === 'mini'); };
$('rulesBtn').onclick = () => { sfx.click(); show('ovRules'); };
// Back from the level list goes to where it was opened from: the pause menu, the screen underneath, or home.
document.querySelectorAll('[data-back]').forEach(b => b.onclick = () => {
  const lv = !$('ovLevels').classList.contains('hidden');
  if (lv && lvFrom === 'pause' && raceOn()) openPause(); else if (lv && lvFrom === 'feed' && lvUnder) show(lvUnder); else showHome();
});
let lvFrom = 'home', lvUnder = null;
function showLevels(from) {
  lvFrom = from || 'home';
  lvUnder = ['ovHome', 'ovEnd'].find(key => !$(key).classList.contains('hidden')) || null;      // the screen that waits underneath
  const top = Math.ceil((unlocked + 5) / 5) * 5; let h = '';
  for (let L = 1; L <= top; L++) { const lock = L > unlocked, st = stars[L] || 0; h += `<button class="lvb${L % 10 === 0 ? ' boss' : ''}${L === level ? ' cur' : ''}${lock ? ' lock' : ''}" data-l="${L}" ${lock ? 'disabled' : ''}>${lock ? '🔒' : L}<small>${lock ? '' : '★'.repeat(st)}</small></button>`; }
  $('lvGrid').innerHTML = h;
  $('lvSub').textContent = unlocked > 1 ? `${unlocked - 1} race${unlocked === 2 ? '' : 's'} run. Every tenth race is against a champion of legend.` : 'Finish near the front to unlock the next race.';
  show('ovLevels');
}
$('levelsBtn').onclick = () => { sfx.click(); showLevels('home'); };
$('eLevels').onclick = () => { showLevels('home'); };
$('lvGrid').addEventListener('click', e => {
  const b = e.target.closest('[data-l]'); if (!b || b.disabled) return;
  level = +b.dataset.l; store.set('level', level);
  if (lvFrom === 'home') showHome(); else { sfx.click(); startRace(); }      // picked from the pause menu: that race starts at once
});
$('eMain').onclick = () => { if ($('eMain').dataset.act === 'next') level = Math.min(unlocked, level + 1); startRace(); };
$('eAlt').onclick = () => startRace();
function sndIcon() { $('sndBtn').textContent = MUTE ? '🔇' : '🔊'; }
$('sndBtn').onclick = () => { audio(); setMute(!MUTE); store.set('mute', MUTE); sndIcon(); if (!MUTE) { ensureLoops(); sfx.click(); } else loopsOff(); };
sndIcon();
// ---------- pause menu: resume, restart this race, or pick a lower level (the same in every game) ----------
const raceOn = () => !!R && (R.phase === 'race' || R.phase === 'count');
function openPause() {
  paused = true; loopsOff(); IN.sId = IN.wId = null;
  $('pLvl').textContent = `Race ${R.L} · ${R.V.name}`;
  show('ovPause');
}
$('pauseBtn').onclick = () => { if (raceOn()) openPause(); };
$('pResume').onclick = () => { paused = false; show(null); last = performance.now(); };
$('pRestart').onclick = () => { sfx.click(); startRace(); };
$('pLevels').onclick = () => showLevels('pause');
$('pQuit').onclick = () => { showHome(); };
// The feed's "Levels" button on its Paused card: the level list opens over the race (Back returns to the pause menu).
// On the home or result screen the list opens over it and Back closes it again.
window.gameFeedLevels = () => { if (raceOn()) { openPause(); showLevels('pause'); } else showLevels('feed'); };
document.addEventListener('visibilitychange', () => { if (document.hidden && raceOn() && !paused) openPause(); });

// ---------- loop ----------
function loopSounds() {
  if (!LOOPS || !actx) return;
  const live = R && !paused, on = live && (R.phase === 'race' || R.phase === 'finish'), me = on ? R.me : null, v = me ? me.v / PH.vTop : 0;
  LOOPS.rumble && LOOPS.rumble.set(me ? 0.02 + 0.2 * v : 0, 0.15);
  LOOPS.wind && LOOPS.wind.set(me ? 0.1 * v * v : 0, 0.2);
  LOOPS.crowd && LOOPS.crowd.set(live ? (R.phase === 'home' || R.phase === 'done' ? 0.03 : 0.04 + 0.2 * R.crowd) : 0, 0.3);
  LOOPS.skid && LOOPS.skid.set(me ? Math.min(0.2, me.slide * 0.14 + ((me.b > 0.3 || me.auto > 0) && me.v > 6 ? 0.07 : 0)) : 0, 0.06);
  LOOPS.scrape && LOOPS.scrape.set(me ? me.scrape * 0.16 : 0, 0.04);
}
let last = performance.now();
function frame(now) {
  const rdt = Math.min(0.05, (now - last) / 1000); last = now;
  if (HEADLESS) { requestAnimationFrame(frame); return; }
  if (R && !paused) {
    if (R.phase === 'home' || R.phase === 'done') { if (R.phase === 'home') camOrbit(R, now / 1000); visuals(R, 0, rdt); }
    else {
      let dt = rdt;
      if (FX.stop > 0) { FX.stop -= rdt; dt = 0; }            // a heartbeat of stillness on a wreck
      else if (FX.slow > 0) { FX.slow -= rdt; dt *= 0.3; }   // slow motion across the line
      if (window.__auto) window.__auto(R, dt); else readInput(now);
      raceStep(R, dt); fx(R); visuals(R, dt, rdt); camFollow(R, dt);
      if (R.phase === 'finish') { R.ft += rdt; if (R.ft > 3.2) showEnd(); }
    }
  }
  loopSounds();
  draw(now / 1000);
  requestAnimationFrame(frame);
}
window.__sim = {
/*SOUNDCHECK*/
  start(L, o) { HEADLESS = true; MUTE = true; level = L; R = makeRace(L, o || {}); R.phase = 'count'; R.ct = 2.9; R.tickN = 3; if (o && o.quick) quickStart(R); },
  step(dt) { raceStep(R, dt); R.evs.length = 0; },
  whip() { playerWhip(R); },
  beatErr() { return beatErr(R.me); },
  drive(c, dt) { aiDrive(c, R, dt); },
  info(p) { turnInfo(R.T, sOf(R.T, p)); return { k: TI.k, dist: TI.dist, a: TI.a }; },
  hold(r) { return holdSpeed(R.T, r, PH.KC * R.cfScale); },
  live() { HEADLESS = false; last = performance.now(); },
  go(L) { HEADLESS = false; level = L; startRace(); },
  strips() { return STRIPS; },
  PH, FX, CAM,
  get R() { return R; }
};
resize(); showHome(); requestAnimationFrame(frame);
})();
</script>
</body>
</html>
