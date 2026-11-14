
// ---------- the patrol: alert -> fly -> mission -> saved -> next alert ----------
let G = null;
let SKIP_ALERT = false;         // set by the feed's instant start for the first mission only
function newPatrol() {
  G = { L: level, plan: planPatrol(level), idx: -1, hearts: 3, saved: 0, failed: 0, results: [], streak: G ? G.streak || 0 : 0, phase: 'alert', t: 0, at: 0, rt: 0, M: null, fly: null,
    msgs: [], parts: [], stop: 0, slow: 0, shake: 0, flash: 0, white: 0, kx: 0, ky: 0, over: null, introT: 9, assist: (streaks[level] || 0) >= 3, newBest: false };
  if (!HEADLESS) { $('hud').classList.remove('hidden'); $('assist').style.display = G.assist ? 'inline-block' : 'none'; }
  nextMission();
}
function hud() {
  if (!G || HEADLESS) return;
  $('hearts').textContent = '♥'.repeat(Math.max(0, G.hearts)) + '♡'.repeat(Math.max(0, 3 - G.hearts));
  $('lvN').textContent = `PATROL ${G.L}`;
  $('pips').textContent = G.plan.map((_, i) => i < G.results.length ? (G.results[i] ? '●' : '✕') : i === G.idx ? '◉' : '○').join('');
}
function nextMission() {
  G.idx++;
  if (G.idx >= G.plan.length) { patrolOver(true); return; }
  G.plan[G.idx].assist = G.assist;
  hud();
  if (HEADLESS) { startMission(); return; }
  G.phase = 'alert'; G.at = 0;
  if (SKIP_ALERT) { SKIP_ALERT = false; launch(); return; }       // the feed's instant start: no card to read, he is flying at once
  sfx.alert(); vibe(HAP.tick);
}
function launch() { if (G.phase !== 'alert') return; G.phase = 'fly'; G.fly = makeFly(G.plan[G.idx]); sfx.takeoff(); }
function startMission() {
  const sp = G.plan[G.idx], m = MT[sp.type].make(sp);
  Object.assign(m, { type: sp.type, sp, t: 0, f: sp.f, sc: sp.scene, result: null, rt: 0 });
  G.M = m; G.phase = 'play'; G.introT = 0;
  if (!HEADLESS) sfx.land();
}
function endMission() {
  const m = G.M, won = m.result === 'win';
  G.phase = 'result'; G.rt = 0; G.results.push(won);
  if (won) {
    G.saved++; G.streak++; rescues++; store.set('rescues', rescues);
    if (G.streak > bestStreak) { if (bestStreak > 0 && !G.newBest) { G.newBest = true; if (!HEADLESS) setTimeout(() => { sfx.best(); vibe(HAP.best); }, 700); } bestStreak = G.streak; store.set('bestStreak', bestStreak); }
    if (!HEADLESS) { const big = m.type === 'monster' || m.type === 'villain'; sfx.win(big); vibe(big ? HAP.heavy : HAP.sharp); burst(W / 2, H * 0.4, big ? 70 : 40, ['#ffd45a', '#ff6b8a', '#5fd4e8', '#9ff0c8', '#ffffff'], 340, 1.2, 420, 4); }
  } else { G.failed++; G.hearts--; G.streak = 0; if (!HEADLESS) sfx.fail(); }
  hud();
}
function afterResult() { if (G.phase !== 'result') return; if (G.hearts <= 0) patrolOver(false); else nextMission(); }
function patrolOver(won) {
  G.over = won ? 'won' : 'lost'; G.phase = 'done';
  streaks[G.L] = won ? 0 : (streaks[G.L] || 0) + 1; store.set('streaks', streaks);
  const st = won ? (G.failed === 0 ? 3 : G.failed === 1 ? 2 : 1) : 0;
  if (won) { stars[G.L] = Math.max(stars[G.L] || 0, st); store.set('stars', stars); unlocked = Math.max(unlocked, G.L + 1); store.set('unlocked', unlocked); }
  if (HEADLESS) return;
  loopsOff();
  if (won) sfx.patrol();
  setTimeout(() => {
    if (!G || !G.over) return;
    $('eTitle').textContent = won ? 'PATROL COMPLETE' : 'PATROL OVER';
    $('eTitle').style.color = won ? '#ffd45a' : '#ff9a7a';
    $('eStars').innerHTML = won ? [1, 2, 3].map(i => `<span class="${i <= st ? '' : 'off'}">★</span>`).join('') : '';
    const streakLine = `Saves in a row: <b>${G.streak}</b>${G.newBest ? ' <b class="nb">NEW BEST</b>' : ` · best ${bestStreak}`}`;
    $('eSub').innerHTML = (won ? `Brightwater sleeps safely tonight. ${G.saved} of ${G.plan.length} missions saved.` : `The city needs a rest. You saved ${G.saved} of ${G.plan.length} before the trust ran out.`) +
      `<br>${streakLine}<br>Citizens helped, all time: <b>${rescues}</b>` +
      (!won && (streaks[G.L] || 0) >= 3 ? `<br><span style="color:#9ff0c8;font-size:12.5px">Help is on for this patrol: trouble moves a touch slower until you finish it.</span>` : '');
    $('eMain').textContent = won ? 'NEXT PATROL' : 'TRY AGAIN'; $('eMain').dataset.act = won ? 'next' : 'again';
    $('eAlt').classList.toggle('hidden', !won);
    show('ovEnd');
  }, won ? 900 : 600);
}

// ---------- flight: the city rushes past; steer through the gold rings ----------
function makeFly(sp) {
  const rings = []; let y = H * 0.45;
  for (let i = 0; i < 5; i++) { y = clamp(y + (Math.random() - 0.5) * H * 0.32, H * 0.25, H * 0.7); rings.push({ t: 0.8 + i * 0.5, y, done: false, got: false }); }
  return { t: 0, dur: 3.5, hy: H * 0.9, ty: H * 0.48, rings, got: 0, sp, tod: sp.tod };
}
function updateFly(dt) {
  const F = G.fly; F.t += dt;
  const spd = 1100 * dt * H / 844; F.hy += clamp(F.ty - F.hy, -spd, spd);
  for (const r of F.rings) if (!r.done && F.t >= r.t) {
    r.done = true;
    if (Math.abs(r.y - F.hy) < 42 * k) { r.got = true; F.got++; sfx.ring(F.got - 1); vibe(HAP.tick); burst(W * 0.3, r.y, 12, ['#ffd45a', '#fff2b0'], 160, 0.5, 0); }
  }
  if (F.t >= F.dur) { if (F.got === F.rings.length) say('ALL RINGS!', '#ffd45a', 0.9, 0.26); startMission(); }
}
function drawFly(t) {
  const F = G.fly, sc = F.t * 0.35;
  drawSky(F.tod, t, sc * 6);
  drawSkyline(F.tod, H * 0.86, sc, t);
  ctx.fillStyle = F.tod === 'night' ? '#0d1730' : F.tod === 'sunset' ? '#3a2d4a' : '#5a7a9a'; ctx.fillRect(-W, H * 0.86, W * 3, H);
  ctx.save(); ctx.globalAlpha = 0.25; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
  for (let i = 0; i < 14; i++) { const y = (i * 61.7) % H, x = W - ((t * 1400 + i * 173) % (W + 200)); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 60 + (i % 3) * 30, y); ctx.stroke(); }
  ctx.restore();
  for (const r of F.rings) {
    const x = W * 0.3 + (r.t - F.t) * W * 0.62; if (x < -40 || x > W + 40) continue;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = r.got ? 'rgba(255,255,220,.9)' : 'rgba(255,212,90,.85)'; ctx.lineWidth = 6 * k;
    ctx.beginPath(); ctx.ellipse(x, r.y, 12 * k, 40 * k, 0, 0, 7); ctx.stroke(); ctx.restore();
  }
  const rise = Math.min(1, F.t / 0.35), dive = Math.max(0, (F.t - (F.dur - 0.3)) / 0.3);
  drawHero(W * 0.3, F.hy + dive * H * 0.15, 1.55 * k, 'fly', { tilt: clamp((F.ty - F.hy) / 600, -0.35, 0.35) - (1 - rise) * 0.6 + dive * 0.5 });
  label(`→ ${F.sp.place.toUpperCase()}`, W / 2, H * 0.12 + 36 * k, 14, '#ffd45a');
  label(`RINGS ${F.got}/${F.rings.length}`, W / 2, H * 0.95, 12);
  if (F.t < 1.2 && level <= 3) label('SLIDE UP & DOWN THROUGH THE RINGS', W / 2, H * 0.9, 12, '#fff');
}

// ---------- alert card and result stamp ----------
function wrap(text, maxW) { const words = text.split(' '), lines = []; let line = ''; for (const w of words) { const t2 = line ? line + ' ' + w : w; if (ctx.measureText(t2).width > maxW && line) { lines.push(line); line = w; } else line = t2; } if (line) lines.push(line); return lines; }
function drawAlert(t) {
  const sp = G.plan[G.idx], a = Math.min(1, G.at / 0.25), cw = Math.min(W - 40, 360), ch = 250 * Math.min(1.2, k * 1.05), cx = W / 2, cy = H * 0.46;
  ctx.fillStyle = `rgba(4,8,20,${0.55 * a})`; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.translate(cx, cy); const s = 0.85 + 0.15 * easeOut(a); ctx.scale(s, s); ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(14,24,52,.96)'; rrect(-cw / 2, -ch / 2, cw, ch, 18); ctx.fill();
  ctx.strokeStyle = sp.golden ? '#ffd45a' : 'rgba(255,212,90,.5)'; ctx.lineWidth = sp.golden ? 4 : 2; rrect(-cw / 2, -ch / 2, cw, ch, 18); ctx.stroke();
  const blink = Math.sin(t * 10) > 0;
  ctx.fillStyle = blink ? '#ff4a3a' : '#a82a20'; ctx.beginPath(); ctx.arc(-cw / 2 + 24, -ch / 2 + 26, 6, 0, 7); ctx.fill();
  ctx.font = '800 12px Nunito, sans-serif'; ctx.fillStyle = '#ff8a7a'; ctx.textAlign = 'left'; ctx.fillText(sp.golden ? 'SPECIAL CALL' : `ALERT ${G.idx + 1} OF ${G.plan.length}`, -cw / 2 + 38, -ch / 2 + 30);
  ctx.textAlign = 'center'; ctx.font = `${Math.round(46 * Math.min(1.2, k))}px Bangers, Impact, sans-serif`; ctx.fillStyle = '#ffd45a'; ctx.fillText(sp.verb, 0, -ch / 2 + 82);
  ctx.font = `700 ${Math.round(16 * Math.min(1.15, k))}px Nunito, sans-serif`; ctx.fillStyle = '#fff';
  const lines = wrap(sp.text, cw - 40); lines.forEach((l, i) => ctx.fillText(l, 0, -ch / 2 + 116 + i * 22));
  ctx.font = '800 12px Nunito, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillText(`📍 ${sp.place}`, 0, ch / 2 - 46);
  ctx.globalAlpha = a * (0.65 + 0.35 * Math.sin(t * 6)); ctx.font = `${Math.round(22 * Math.min(1.2, k))}px Bangers, Impact, sans-serif`; ctx.fillStyle = '#fff'; ctx.fillText('TAP TO FLY', 0, ch / 2 - 18);
  ctx.globalAlpha = a; ctx.fillStyle = 'rgba(255,212,90,.6)'; rrect(-cw / 2 + 18, ch / 2 - 8, (cw - 36) * Math.max(0, 1 - G.at / 3), 3, 1.5); ctx.fill();
  ctx.restore();
}
function drawResult() {
  const m = G.M, win = m.result === 'win', p = Math.min(1, G.rt / 0.18), s = 1.6 - 0.6 * easeOut(p);
  ctx.save(); ctx.translate(W / 2, H * 0.4); ctx.rotate(-0.12); ctx.scale(s, s); ctx.globalAlpha = Math.min(1, G.rt / 0.1);
  ctx.font = `${Math.round(70 * Math.min(1.2, k))}px Bangers, Impact, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = 8; ctx.strokeStyle = win ? '#7a3f00' : '#3a0a0a'; ctx.strokeText(win ? 'SAVED!' : 'MISSED...', 0, 0);
  ctx.fillStyle = win ? '#ffd45a' : '#ff9a7a'; ctx.fillText(win ? 'SAVED!' : 'MISSED...', 0, 0);
  ctx.restore();
  if (win && G.streak >= 2) label(`${G.streak} SAVES IN A ROW${G.newBest ? ' · NEW BEST!' : ''}`, W / 2, H * 0.4 + 60 * k, 14, '#fff');
  if (!win) { ctx.font = `700 ${Math.round(14 * k)}px Nunito, sans-serif`; wrap(m.reason, W * 0.84).forEach((l, i) => label(l, W / 2, H * 0.4 + 60 * k + i * 20 * k, 14, '#fff')); }
  if (G.rt > 0.5) label('Tap to continue', W / 2, H * 0.9, 13, 'rgba(255,255,255,.75)');
}

// ---------- update and draw ----------
function update(dt) {
  if (!G) return;
  G.t += dt; G.introT += dt;
  for (const m of G.msgs) m.t += dt; G.msgs = G.msgs.filter(m => m.t < m.dur);
  for (const p of G.parts) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.vx *= 0.99; } G.parts = G.parts.filter(p => p.t < p.life);
  G.shake = Math.max(0, G.shake - dt * 40); G.flash = Math.max(0, G.flash - dt);
  if (G.phase === 'alert') { G.at += dt; if (G.at > 3) launch(); }
  else if (G.phase === 'fly') updateFly(dt);
  else if (G.phase === 'play') {
    const m = G.M; m.t += dt; MT[m.type].update(m, dt);
    if (m.result) { m.rt += dt; if (m.rt >= (m.result === 'win' ? 0.55 : 0.8)) endMission(); }
  } else if (G.phase === 'result') { G.rt += dt; if (HEADLESS || G.rt > 1.7) afterResult(); }
}
function draw() {
  const t = performance.now() / 1000;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (!G) { drawHome(t); return; }
  ctx.save();
  if (G.shake) ctx.translate((Math.random() - 0.5) * G.shake, (Math.random() - 0.5) * G.shake);
  ctx.translate(G.kx, G.ky);
  if (G.phase === 'fly') drawFly(t);
  else if (!G.M) drawHome(t);
  else { drawScene(G.M.sc, G.M.sp.tod, t); MT[G.M.type].draw(G.M, t); }
  for (const p of G.parts) { ctx.globalAlpha = 1 - p.t / p.life; ctx.fillStyle = p.c; ctx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s); }
  ctx.globalAlpha = 1;
  ctx.restore();
  if (G.flash > 0) { const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.8); vg.addColorStop(0, 'rgba(255,0,0,0)'); vg.addColorStop(1, `rgba(190,0,0,${G.flash * 1.4})`); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H); }
  for (const m of G.msgs) {
    const a = 1 - Math.max(0, (m.t - m.dur * 0.6) / (m.dur * 0.4)), pop = m.t < 0.12 ? 1 + 0.4 * (1 - m.t / 0.12) : 1;
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = m.color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `${Math.round(Math.min(W * 0.1, 42) * m.size * pop)}px Bangers, Impact, sans-serif`; ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 8;
    ctx.fillText(m.text, W / 2, H * m.y - m.t * 16, W * 0.94); ctx.restore();
  }
  if (G.phase === 'play' && G.introT < 1.1 && G.M) {
    const a = 1 - Math.max(0, (G.introT - 0.6) / 0.5), pop = G.introT < 0.15 ? 1 + 0.6 * (1 - G.introT / 0.15) : 1;
    ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `${Math.round(Math.min(W * 0.17, 72) * pop)}px Bangers, Impact, sans-serif`;
    ctx.lineWidth = 7; ctx.strokeStyle = '#7a3f00'; ctx.strokeText(G.M.sp.verb, W / 2, H * 0.47); ctx.fillStyle = '#ffd45a'; ctx.fillText(G.M.sp.verb, W / 2, H * 0.47); ctx.restore();
  }
  if (G.phase === 'alert') drawAlert(t);
  if (G.phase === 'result') drawResult();
}

// ---------- input ----------
let ptrId = null;
cv.addEventListener('pointerdown', e => {
  audio(); ensureLoops();
  if (!G || paused) return;
  const x = e.clientX, y = e.clientY;
  if (G.phase === 'alert') { if (G.at > 0.25) launch(); return; }
  if (G.phase === 'result') { if (G.rt > 0.35) afterResult(); return; }
  if (G.phase === 'fly') { G.fly.ty = y; ptrId = e.pointerId; return; }
  if (G.phase === 'play' && !G.M.result) { ptrId = e.pointerId; MT[G.M.type].down(G.M, x, y); try { cv.setPointerCapture(e.pointerId); } catch (_) {} }
});
cv.addEventListener('pointermove', e => {
  if (!G || e.pointerId !== ptrId) return;
  if (G.phase === 'fly') G.fly.ty = e.clientY;
  else if (G.phase === 'play' && !G.M.result) MT[G.M.type].move(G.M, e.clientX, e.clientY);
});
function release(e) { if (!G || e.pointerId !== ptrId) return; ptrId = null; if (G.phase === 'play') MT[G.M.type].up(G.M, e.clientX, e.clientY); }
cv.addEventListener('pointerup', release);
cv.addEventListener('pointercancel', release);

// ---------- screens ----------
function show(id) { ['ovHome', 'ovRules', 'ovLevels', 'ovEnd', 'ovPause'].forEach(key => $(key).classList.toggle('hidden', key !== id)); }
function showHome() {
  G = null; $('hud').classList.add('hidden'); loopsOff();
  $('playBtn').textContent = `PATROL ${level}`;
  $('hStat').innerHTML = rescues ? `Citizens helped: <b>${rescues}</b> · Best saves in a row: <b>${bestStreak}</b>` : 'Brightwater City needs a hero.';
  if ((streaks[level] || 0) >= 3) $('hStat').innerHTML += `<br><span style="color:#9ff0c8">Help on: trouble moves a touch slower on this patrol.</span>`;
  show('ovHome');
}
function startPatrol() { audio(); ensureLoops(); show(null); newPatrol(); }
$('playBtn').onclick = () => { sfx.click(); startPatrol(); };
// The feed's instant start (tap a card in the Game Feed app): the first alert card is skipped and he takes off at once.
// Later missions in the same patrol keep their alert cards.
window.gameFeedStart = m => { sfx.click(); SKIP_ALERT = m === 'mini'; startPatrol(); SKIP_ALERT = false; };
$('rulesBtn').onclick = () => { sfx.click(); show('ovRules'); };
document.querySelectorAll('[data-back]').forEach(b => b.onclick = () => showHome());
function showLevels() {
  const top = Math.ceil((unlocked + 5) / 5) * 5; let h = '';
  for (let L = 1; L <= top; L++) { const lock = L > unlocked, st = stars[L] || 0; h += `<button class="lvb${L % 5 === 0 ? ' boss' : ''}${L === level ? ' cur' : ''}${lock ? ' lock' : ''}" data-l="${L}" ${lock ? 'disabled' : ''}>${lock ? '🔒' : L}<small>${lock ? '' : '★'.repeat(st)}</small></button>`; }
  $('lvGrid').innerHTML = h;
  $('lvSub').textContent = unlocked > 1 ? `${unlocked - 1} patrol${unlocked === 2 ? '' : 's'} done. Gold-edged patrols end with a giant monster or a super villain.` : 'Finish a patrol to unlock the next.';
  show('ovLevels');
}
$('levelsBtn').onclick = () => { sfx.click(); showLevels(); };
$('eLevels').onclick = () => { G = null; showLevels(); };
$('lvGrid').addEventListener('click', e => { const b = e.target.closest('[data-l]'); if (!b || b.disabled) return; level = +b.dataset.l; store.set('level', level); showHome(); });
$('eMain').onclick = () => { if ($('eMain').dataset.act === 'next') { level = Math.min(unlocked, level + 1); store.set('level', level); } startPatrol(); };
$('eAlt').onclick = () => startPatrol();
function sndIcon() { $('sndBtn').textContent = MUTE ? '🔇' : '🔊'; }
$('sndBtn').onclick = () => { audio(); setMute(!MUTE); store.set('mute', MUTE); sndIcon(); if (!MUTE) { ensureLoops(); sfx.click(); } else loopsOff(); };
sndIcon();
let paused = false;
$('pauseBtn').onclick = () => { if (!G || G.over) return; paused = true; loopsOff(); show('ovPause'); };
$('pResume').onclick = () => { paused = false; show(null); last = performance.now(); };
$('pQuit').onclick = () => { paused = false; showHome(); };
document.addEventListener('visibilitychange', () => { if (document.hidden && G && !G.over && !paused) { paused = true; loopsOff(); show('ovPause'); if (G.M && G.phase === 'play') MT[G.M.type].up(G.M, 0, 0); } });

// ---------- loop ----------
function loopSounds() {
  if (!LOOPS || !actx) return;
  const m = G && G.phase === 'play' && !paused ? G.M : null, now = actx.currentTime;
  if (LOOPS.fly) { const on = G && G.phase === 'fly' && !paused; LOOPS.fly.set(on ? 0.2 : 0, on ? 0.1 : 0.25); if (on) LOOPS.fly.f.frequency.setTargetAtTime(500 + 1100 * (G.fly.t / G.fly.dur), now, 0.1); }
  const las = m && (m.type === 'zap' || m.type === 'monster' || m.type === 'villain') && m.firing && !m.over && !m.result;
  if (LOOPS.laser) LOOPS.laser.set(las ? 0.05 : 0, las ? 105 + m.heat * 120 : null);
  const br = m && m.type === 'fire' && m.blowing && !m.bOut && !m.result; if (LOOPS.breath) LOOPS.breath.set(br ? 0.22 : 0, 0.05);
  const fire = m && m.type === 'fire' ? Math.min(1, m.win.reduce((a, w) => a + w.I, 0) / 3) : 0; if (LOOPS.crackle) LOOPS.crackle.set(fire * 0.06, 0.3);
  const lift = m && m.type === 'lift' && m.holding && !m.result; if (LOOPS.strain) LOOPS.strain.set(lift ? 0.05 : 0, lift ? 62 + m.p * 60 : null);
  if (LOOPS.city) LOOPS.city.set(G && !paused && G.phase !== 'fly' ? 0.025 : 0.012, 0.5);
}
let last = performance.now();
function frame(now) {
  const rdt = Math.min(0.05, (now - last) / 1000); last = now;
  let dt = rdt;
  if (G && !paused && !HEADLESS) {
    if (G.stop > 0) { G.stop -= rdt; dt = 0; }
    else if (G.slow > 0) { G.slow -= rdt; dt *= 0.35; }
    const damp = Math.pow(0.0008, rdt); G.kx *= damp; G.ky *= damp;
    update(dt);
  }
  loopSounds();
  draw();
  requestAnimationFrame(frame);
}
window.__sim = {
/*SOUNDCHECK*/
  start(L) { HEADLESS = true; MUTE = true; level = L; G = null; newPatrol(); },
  startType(L, type) { HEADLESS = true; MUTE = true; level = L; G = null; newPatrol(); G.plan[G.idx] = makeSpec(type, L, 0); startMission(); },
  step(dt) { update(dt); },
  down(x, y) { if (G && G.phase === 'play' && !G.M.result) MT[G.M.type].down(G.M, x, y); },
  move(x, y) { if (G && G.phase === 'play' && !G.M.result) MT[G.M.type].move(G.M, x, y); },
  up(x, y) { if (G && G.phase === 'play') MT[G.M.type].up(G.M, x, y); },
  flick(d) { if (G && G.phase === 'play' && G.M.lanes) MT.monster.flick(G.M, d); },
  core() { return G && G.M && G.M.lanes ? MT.monster.core(G.M) : null; },
  spot(i) { return spotXY(i); }, winAt(x, y) { return MT.fire.winAt(G.M, x, y); },
  setStreak(L, n) { streaks = { [L]: n }; },
  live() { HEADLESS = false; },
  size() { return { W, H, k }; },
  get G() { return G; }, get M() { return G && G.M; }
};
resize(); showHome(); requestAnimationFrame(frame);
})();
</script>
</body>
</html>
