
// ===================== PART 7: sound and music =====================
// Every sound has a body, a texture and a sparkle (PLAYBOOK S1-S11); each of his attacks has its own warning cue; wins are musical, losses are not mocking.
const sfx = {
  // ---- the sea ----
  gun(v = 1, mine = true) { if (!gate('gun', 28)) return; const p = vary(0.1); tone((mine ? 96 : 72) * p, 0.42, 0.5 * v, 'sine', 0, 34); noise(0.5, mine ? 900 : 520, 0.46 * v, 'lowpass', 0.7); noise(0.08, 3200, 0.2 * v, 'bandpass', 1.2); if (mine) noise(1.1, 280, 0.14 * v, 'lowpass', 0.5, 0.08, 0.05); },
  splash() { if (!gate('splash', 60)) return; noise(0.45, 1400 * vary(0.2), 0.13, 'bandpass', 0.8); noise(0.22, 5200, 0.045, 'highpass', 0.7, 0.03); },
  hullMe() { if (!gate('hullMe', 50)) return; tone(118 * vary(), 0.3, 0.5, 'triangle', 0, 48); noise(0.32, 700, 0.5, 'lowpass', 1); noise(0.12, 2600, 0.2, 'bandpass', 2); },
  hullHer(rake) { if (!gate('hullHer', 45)) return; const p = vary(0.12); tone(150 * p, 0.2, 0.3, 'triangle', 0, 70); noise(0.22, 1100 * p, 0.32, 'bandpass', 1.2); noise(0.08, 3600, 0.14, 'highpass', 0.7); if (rake) tone(700 * p, 0.2, 0.1, 'sine', 0.03, 1050); },
  ports() { if (!gate('ports', 260)) return; tone(196, 0.09, 0.2, 'square', 0, 150, 900); tone(247, 0.1, 0.2, 'square', 0.11, 185, 900); noise(0.08, 700, 0.16, 'lowpass', 1); },
  bump() { if (!gate('bump', 300)) return; tone(80, 0.3, 0.4, 'sine', 0, 46); noise(0.4, 380, 0.4, 'lowpass', 1); noise(0.5, 1500, 0.1, 'bandpass', 3, 0.05); },
  sunk() { tone(96, 1.5, 0.3, 'sawtooth', 0, 38, 420); noise(1.8, 520, 0.24, 'lowpass', 0.8, 0.1, 0.4); for (let i = 0; i < 6; i++) tone(300 + Math.random() * 500, 0.08, 0.05, 'sine', 0.5 + i * 0.16, 700 + Math.random() * 600); },
  struck() { tone(1320, 0.5, 0.12, 'sine', 0, 660); tone(880, 0.9, 0.16, 'sine', 0.42); tone(1320, 0.9, 0.08, 'sine', 0.42); noise(0.5, 2400, 0.05, 'bandpass', 1, 0.0, 0.1); },
  bell(v = 1) { tone(1046, 1.1, 0.16 * v, 'sine'); tone(1570, 0.8, 0.07 * v, 'sine'); tone(2093, 0.4, 0.035 * v, 'sine'); noise(0.03, 3000, 0.06 * v, 'bandpass', 2); },
  sight() { sfx.bell(1); setTimeout(() => sfx.bell(0.9), 300); },
  raid() { tone(110, 0.3, 0.5, 'sine', 0, 55); noise(0.14, 420, 0.34, 'bandpass', 1.2); noise(0.05, 2600, 0.12, 'highpass', 0.7); tone(147, 0.25, 0.4, 'sine', 0.2, 70); noise(0.12, 420, 0.3, 'bandpass', 1.2, 0.2); },
  grapple() { for (let i = 0; i < 3; i++) { tone(150 * vary(0.2), 0.12, 0.3, 'triangle', i * 0.13, 80); noise(0.1, 900, 0.22, 'bandpass', 1.5, i * 0.13); } tone(88, 0.6, 0.08, 'sawtooth', 0.4, 120, 380); },
  empty() { noise(0.05, 1800, 0.3, 'bandpass', 3); tone(300, 0.04, 0.08, 'triangle', 0, 220); },
  tap() { tone(520, 0.06, 0.12, 'triangle', 0, 700); noise(0.03, 2400, 0.05, 'bandpass', 2); },
  creak() { const p = vary(0.2); tone(74 * p, 0.7, 0.05, 'sawtooth', 0, 102 * p, 330); tone(111 * p, 0.5, 0.025, 'sawtooth', 0.12, 140 * p, 420); },
  // ---- the fight ----
  step() { tone(90, 0.1, 0.22, 'sine', 0, 60); noise(0.08, 500, 0.16, 'lowpass', 1); tone(84, 0.1, 0.18, 'sine', 0.26, 56); noise(0.08, 500, 0.13, 'lowpass', 1, 0.26); },
  stage(i = 0) { tone(73, 0.5, 0.4, 'sine', 0, 55); noise(0.3, 300, 0.3, 'lowpass', 1); noise(0.1, 2000, 0.07, 'bandpass', 1); tone([294, 330, 392][i] || 294, 0.5, 0.1, 'triangle', 0.05); },
  tell(kind, wind = 0.6) {      // each kind of blow has its own warning
    if (kind === 'heavy') { tone(70, Math.min(0.9, wind), 0.3, 'sawtooth', 0, 150, 520); noise(Math.min(0.8, wind), 260, 0.14, 'lowpass', 1, 0, 0.2); tone(440, 0.12, 0.1, 'square', 0, 330, 1200); }
    else if (kind === 'shot') { noise(0.03, 2600, 0.3, 'bandpass', 4); noise(0.04, 1700, 0.3, 'bandpass', 4, 0.12); tone(1200, 0.05, 0.08, 'square', 0.12, 900, 3000); }
    else if (kind === 'thrust') { tone(980 * vary(), 0.05, 0.1, 'triangle', 0, 1300); tone(1300 * vary(), 0.05, 0.1, 'triangle', 0.07, 1700); }
    else { tone(620 * vary(0.1), 0.16, 0.1, 'triangle', 0, 1240); noise(0.14, 4200, 0.045, 'highpass', 0.7); }
  },
  feint() { tone(900, 0.07, 0.07, 'triangle', 0, 500); noise(0.08, 3000, 0.04, 'highpass', 0.7); },
  swish(p = 1) { if (!gate('swish', 40)) return; noise(0.17, 1500 * p * vary(0.15), 0.3, 'bandpass', 1.1, 0, 0.03); noise(0.1, 5200, 0.07, 'highpass', 0.7, 0.02); tone(240 * p, 0.1, 0.05, 'sine', 0, 150 * p); },
  clang(perfect, chain = 1) { const b = note(784, Math.min(9, chain - 1)) * vary(0.02); tone(b, perfect ? 0.5 : 0.24, 0.2, 'sine'); tone(b * 1.51, perfect ? 0.38 : 0.18, 0.13, 'sine'); tone(b * 2.76, 0.14, 0.08, 'sine'); noise(0.06, 5200, 0.2, 'highpass', 0.7); tone(150, 0.09, 0.26, 'triangle', 0, 80); if (perfect) { tone(b * 2, 0.7, 0.07, 'sine', 0.04); noise(0.3, 7000, 0.035, 'highpass', 0.7, 0.03); } },
  clank() { const b = 520 * vary(0.06); tone(b, 0.14, 0.14, 'square', 0, b * 0.9, 2400); tone(b * 1.47, 0.1, 0.08, 'sine'); noise(0.05, 3600, 0.14, 'bandpass', 1.5); },
  clink(v = 1) { const b = 1500 * vary(0.2); tone(b, 0.08, 0.03 * v, 'sine'); noise(0.03, 5000, 0.02 * v, 'highpass', 0.7); },
  cut(kind, rip) { if (kind === 'ball') { tone(120, 0.2, 0.4, 'sine', 0, 50); noise(0.18, 900, 0.3, 'lowpass', 1); return; } const p = vary(0.1); tone(170 * p, 0.12, 0.34, 'triangle', 0, 70); noise(0.1, kind === 'stab' ? 2400 : 1500, 0.24, 'bandpass', 1.2); noise(0.05, 6000, 0.08, 'highpass', 0.7); if (rip) { tone(988, 0.3, 0.1, 'sine', 0.02, 1480); tone(1480, 0.34, 0.06, 'sine', 0.06); noise(0.16, 3000, 0.1, 'bandpass', 1, 0.01); } },
  hurt(kind) { tone(84, 0.28, 0.5, 'sine', 0, 42); noise(0.2, 520, 0.4, 'lowpass', 1); noise(0.06, 1800, 0.14, 'bandpass', 1.5); if (kind === 'shot') noise(0.3, 1200, 0.14, 'bandpass', 0.7, 0.04); },
  dodge() { noise(0.26, 620, 0.2, 'bandpass', 0.9, 0, 0.05); tone(160, 0.14, 0.08, 'sine', 0, 90); },
  down() { tone(74, 0.3, 0.44, 'sine', 0, 40); noise(0.24, 420, 0.4, 'lowpass', 1); noise(0.12, 1400, 0.12, 'bandpass', 1.4, 0.05); },
  cock() { noise(0.025, 2800, 0.28, 'bandpass', 5); tone(1500, 0.03, 0.08, 'square', 0, 1100, 4000); noise(0.03, 1900, 0.3, 'bandpass', 5, 0.1); tone(1100, 0.04, 0.08, 'square', 0.1, 800, 3000); },
  pistol(v = 1) { tone(180, 0.22, 0.5 * v, 'sine', 0, 44); noise(0.3, 1500, 0.5 * v, 'lowpass', 0.7); noise(0.06, 5200, 0.32 * v, 'highpass', 0.7); noise(0.9, 700, 0.12 * v, 'lowpass', 0.6, 0.06, 0.04); },
  ram() { for (let i = 0; i < 4; i++) { noise(0.05, 1300 * vary(0.2), 0.1, 'bandpass', 2.5, i * 0.45); tone(210, 0.05, 0.06, 'triangle', i * 0.45 + 0.02, 150); } },
  cheer(v = 1) { noise(1.1, 950, 0.2 * v, 'bandpass', 0.7, 0, 0.18); noise(0.9, 1900, 0.07 * v, 'bandpass', 0.9, 0.05, 0.2); for (let i = 0; i < 5; i++) tone((300 + Math.random() * 240), 0.3, 0.035 * v, 'sawtooth', Math.random() * 0.35, 240 + Math.random() * 200, 1300); },
  won(i = 0) { const b = [293.7, 329.6, 392][i] || 293.7; [0, 4, 7, 12].forEach((st, j) => { tone(b * Math.pow(2, st / 12), 0.5, 0.15, 'triangle', j * 0.09); pluck(b * Math.pow(2, st / 12), 0.7, 0.12, j * 0.09); }); },
  lost() { tone(196, 0.7, 0.2, 'triangle', 0, 185); tone(147, 1.1, 0.22, 'triangle', 0.55, 139); noise(0.9, 300, 0.1, 'lowpass', 1, 0.5, 0.2); },
  // ---- the haul ----
  coin(i = 0) { const b = note(1175, Math.min(12, i)); tone(b, 0.18, 0.12, 'sine'); tone(b * 1.5, 0.12, 0.06, 'sine', 0.03); noise(0.03, 6500, 0.05, 'highpass', 0.7); },
  star(i = 0) { const b = note(784, 2 + i * 2); tone(b, 0.5, 0.16, 'sine'); tone(b * 2, 0.4, 0.07, 'sine', 0.02); pluck(b, 0.6, 0.1); },
  fanfare() { [[293.7, 0], [370, 0.14], [440, 0.28], [587.3, 0.46], [440, 0.7], [587.3, 0.84]].forEach(([fq, t]) => { tone(fq, 0.4, 0.14, 'triangle', t); tone(fq * 2, 0.3, 0.05, 'sine', t); pluck(fq, 0.6, 0.1, t); }); tone(73.4, 1.2, 0.3, 'sine', 0.46); },
  best() { [0, 2, 4, 7, 9].forEach((s2, j) => tone(note(880, j + 2), 0.3, 0.1, 'sine', j * 0.07)); },
  ui() { tone(440, 0.05, 0.08, 'triangle', 0, 560); }
};

// ---------- the shanty: one tune of our own, played two ways (calm while you cruise, fast with a drum once a sail is sighted) ----------
// 6/8 time. Each bar is [chord root, [note, eighths]...]; notes are semitones above D4 (-99 = rest).
const TUNE = [
  [0, [0, 2], [3, 1], [7, 2], [7, 1]], [5, [5, 2], [7, 1], [8, 1], [7, 1], [5, 1]], [0, [3, 2], [0, 1], [3, 2], [7, 1]], [-2, [5, 2], [2, 1], [-2, 3]],
  [0, [0, 2], [3, 1], [7, 2], [12, 1]], [-2, [10, 2], [7, 1], [5, 1], [7, 1], [10, 1]], [0, [7, 2], [3, 1], [5, 2], [2, 1]], [0, [0, 3], [0, 3]],
  [0, [7, 2], [12, 1], [15, 2], [14, 1]], [3, [12, 2], [10, 1], [7, 3]], [5, [8, 2], [7, 1], [5, 2], [3, 1]], [-5, [2, 2], [3, 1], [5, 1], [7, 2]],
  [0, [7, 2], [12, 1], [15, 2], [14, 1]], [-2, [12, 2], [10, 1], [7, 2], [5, 1]], [0, [3, 2], [7, 1], [5, 2], [2, 1]], [0, [0, 6]]
];
const D4 = 293.66, semi = n => D4 * Math.pow(2, n / 12), MVOL = 0.28, mvol = m => m === 'off' ? 0.0001 : MVOL * (m === 'calm' ? 1.3 : 1);      // how loud the music is against everything else (S10: quiet, under every effect; measured by __sim.musicCheck)
const offline = () => typeof OfflineAudioContext !== 'undefined' && actx instanceof OfflineAudioContext;      // the sound check renders each sound on its own: no music or sea in it
const MUS = { on: false, mode: 'calm', want: 'calm', bar: 0, e: 0, t: 0, g: null, lvl: 0, flat: [] };
(() => { for (const b of TUNE) { const row = []; for (let i = 1; i < b.length; i++) { row.push({ n: b[i][0], len: b[i][1] }); for (let j = 1; j < b[i][1]; j++) row.push(null); } MUS.flat.push(row); } })();
function mVoice(type, fr, t, dur, vol, lp, o = {}) {
  const os = actx.createOscillator(), g = actx.createGain(), fl = actx.createBiquadFilter(); os.type = type; os.frequency.setValueAtTime(fr, t); if (o.det) os.detune.value = o.det;
  if (o.vib) { const l = actx.createOscillator(), lg = actx.createGain(); l.frequency.value = 5.4; lg.gain.value = fr * 0.006 * o.vib; l.connect(lg); lg.connect(os.frequency); l.start(t + 0.08); l.stop(t + dur + 0.2); }
  if (o.to) os.frequency.exponentialRampToValueAtTime(o.to, t + dur);
  fl.type = 'lowpass'; fl.frequency.value = lp; const a = o.att || 0.02, r = o.rel || 0.08;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + a); g.gain.setValueAtTime(vol * (o.sus == null ? 0.8 : o.sus), t + Math.max(a, dur - r)); g.gain.linearRampToValueAtTime(0.0001, t + dur + r * 0.6);
  os.connect(fl); fl.connect(g); g.connect(MUS.g); os.start(t); os.stop(t + dur + r + 0.05);
}
function mDrum(t, vol, low) {
  const os = actx.createOscillator(), g = actx.createGain(); os.type = 'sine'; os.frequency.setValueAtTime(low ? 118 : 170, t); os.frequency.exponentialRampToValueAtTime(low ? 58 : 96, t + 0.14);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + (low ? 0.2 : 0.11)); os.connect(g); g.connect(MUS.g); os.start(t); os.stop(t + 0.25);
  const s = actx.createBufferSource(); s.buffer = nbuf(0.08); const f = actx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = low ? 380 : 1400; f.Q.value = 0.9; const g2 = actx.createGain(); g2.gain.value = vol * (low ? 0.5 : 0.32); s.connect(f); f.connect(g2); g2.connect(MUS.g); s.start(t);
}
function mPluck(fr, t, vol, dur = 0.9) {
  const sr = actx.sampleRate, n = Math.floor(sr * dur), key = 'p' + Math.round(fr); let b = NB[key];
  if (!b) { b = actx.createBuffer(1, n, sr); const d = b.getChannelData(0), p = Math.max(2, Math.round(sr / fr)); for (let i = 0; i < p; i++) d[i] = Math.random() * 2 - 1; for (let i = p; i < n; i++) d[i] = 0.995 * 0.5 * (d[i - p] + d[i - p + 1]); NB[key] = b; }
  const s = actx.createBufferSource(); s.buffer = b; const f = actx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 3400; const g = actx.createGain(); g.gain.value = vol; s.connect(f); f.connect(g); g.connect(MUS.g); s.start(t);
}
function musicSet(mode) { MUS.want = mode; }
function musicStep(run) {      // called every frame: lays down the next third of a second of music
  if (!actx || MUTE || !run || HEADLESS || offline()) { MUS.t = 0; return; }
  if (MUS.ctx !== actx) { MUS.ctx = actx; MUS.g = null; }
  if (!MUS.g) { MUS.g = actx.createGain(); MUS.g.gain.value = 0.0001; MUS.g.connect(AMB); }
  const now = actx.currentTime; if (MUS.t < now - 0.2 || MUS.t > now + 1.5) { MUS.t = now + 0.06; MUS.g.gain.cancelScheduledValues(now); MUS.g.gain.setTargetAtTime(mvol(MUS.want), now, 0.4); }
  musicFill(now + 0.32);
}
function musicFill(until) {
  while (MUS.t < until) {
    if (MUS.mode !== MUS.want && MUS.e % 3 === 0) { const was = MUS.mode; MUS.mode = MUS.want; MUS.g.gain.setTargetAtTime(mvol(MUS.mode), MUS.t, 0.25); if (was === 'calm' && MUS.mode !== 'off') { for (let i = 0; i < 3; i++) mDrum(MUS.t + i * 0.09, 0.2 + i * 0.05, i === 2); } }
    const mode = MUS.mode, fast = mode === 'battle' || mode === 'fight', dt = mode === 'fight' ? 0.178 : fast ? 0.195 : 0.335, t = MUS.t, bar = TUNE[MUS.bar], root = bar[0], cell = MUS.flat[MUS.bar][MUS.e], minor = root === 0 || root === 5, third = minor ? 3 : 4;
    if (mode !== 'off') {
      if (cell && cell.n > -90) { const fq = semi(cell.n), dur = cell.len * dt * 0.92;
        if (fast) { mVoice('sawtooth', fq, t, dur, 0.05, 2500, { vib: 1, att: 0.012, rel: 0.05, sus: 0.7 }); mVoice('triangle', fq * 2, t, dur * 0.8, 0.028, 5000, { att: 0.01, rel: 0.04, sus: 0.5 }); }
        else { mVoice('triangle', fq, t, dur, 0.06, 1500, { vib: 0.7, att: 0.05, rel: 0.14, det: -5 }); mVoice('sawtooth', fq, t, dur, 0.017, 1100, { att: 0.06, rel: 0.14, det: 6 }); } }
      if (fast) {
        if (MUS.e === 0 || MUS.e === 3) { mVoice('triangle', semi(root - 12 + (MUS.e === 3 ? -5 : 0)), t, dt * 2.2, 0.11, 700, { att: 0.01, rel: 0.08, sus: 0.6 }); mDrum(t, 0.3, true); mPluck(semi(root - 12), t, 0.05, 0.5); mPluck(semi(root - 12 + third), t, 0.035, 0.5); mPluck(semi(root - 5), t, 0.04, 0.5); }
        else if (MUS.e === 2 || MUS.e === 5) mDrum(t, mode === 'fight' ? 0.17 : 0.12, false);
        else if (mode === 'fight') mDrum(t, 0.07, false);
      } else {
        if (MUS.e === 0) { mVoice('triangle', semi(root - 12), t, dt * 5.4, 0.08, 600, { att: 0.04, rel: 0.3 }); mPluck(semi(root - 12), t, 0.075); }
        else if (MUS.e === 2) mPluck(semi(root - 5), t, 0.05); else if (MUS.e === 3) mPluck(semi(root - 12 + third), t, 0.06); else if (MUS.e === 5) mPluck(semi(root - 5), t, 0.045);
      }
    }
    MUS.t += dt; MUS.e++; if (MUS.e >= 6) { MUS.e = 0; MUS.bar = (MUS.bar + 1) % TUNE.length; }
  }
}
// ---------- the sea and the ship around you ----------
const BEDS = { sea: null, foam: null, crowd: null, creakT: 5 };
function ambience(phase, stage, dt, run) {
  if (!actx || HEADLESS || offline()) return;
  if (BEDS.ctx !== actx) { BEDS.ctx = actx; BEDS.sea = BEDS.foam = BEDS.crowd = null; }
  if (!BEDS.sea) { BEDS.sea = bed(430, 0.5, 0.0001, 0.11, 'lowpass'); BEDS.foam = bed(2600, 0.5, 0.0001, 0.19, 'bandpass'); BEDS.crowd = bed(900, 0.7, 0.0001, 0.3, 'bandpass'); }
  const board = phase === 'board', sea = !run ? 0 : board ? [0.035, 0.014, 0.01][stage] : phase === 'home' ? 0.045 : 0.075, foam = !run || board ? 0 : phase === 'home' ? 0.008 : 0.02, crowd = run && board && stage < 2 ? 0.035 : 0;
  if (BEDS.sea) BEDS.sea.set(sea, 0.6); if (BEDS.foam) BEDS.foam.set(foam, 0.6); if (BEDS.crowd) BEDS.crowd.set(crowd, 0.5);
  if (run && phase !== 'home') { BEDS.creakT -= dt; if (BEDS.creakT <= 0) { BEDS.creakT = 4 + Math.random() * 6; sfx.creak(); } }
}
