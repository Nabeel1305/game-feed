// ===================== SOUND: the pools (PLAYBOOK S1-S11) =====================
// Squeaky inflatables, springy boings, mechanical whooshes of the sweeper and the gloves, the belt's rumble, big splashes and
// a cheerful crowd (an "ooh" and a laugh for a splash, a roar at the finish). Music (its own switch): an upbeat beach tune.
let beltN = 0;
const sfx = {
  click() { tone(660, 0.04, 0.04, 'triangle', 0, 820); },
  jump(pw = 0) { tone(300 + pw * 200, 0.18, 0.05, 'sine', 0, 700 + pw * 500); },
  squeak(clean) { tone(clean ? 900 : 700, 0.12, 0.04, 'square', 0, clean ? 1300 : 500, 2200); tone(180, 0.2, 0.05, 'sine', 0, 120); },
  thud() { noise(0.08, 400, 0.05, 'lowpass', 1); },
  slip() { tone(600, 0.35, 0.03, 'sawtooth', 0, 250, 1400); },
  splash() { noise(0.9, 1400, 0.12, 'lowpass', 0.6); noise(0.4, 3000, 0.05, 'highpass', 0.8, 0.05); tone(120, 0.3, 0.06, 'sine', 0, 60); },
  bonk() { tone(220, 0.12, 0.08, 'square', 0, 110, 900); noise(0.1, 800, 0.05, 'bandpass', 2); },
  boing() { tone(160, 0.25, 0.06, 'sine', 0, 320); },
  chime() { [0, 4, 7].forEach((q, j) => pluck(note(784, q), 0.5, 0.04, j * 0.06)); },
  crowd(big) { noise(big ? 2.2 : 1.2, 900, big ? 0.07 : 0.04, 'bandpass', 0.3, 0.05); if (!big) tone(330, 0.5, 0.02, 'triangle', 0.15, 220); },
  fanfare() { [0, 4, 7, 12, 16].forEach((q, j) => tone(note(523, q), 0.2, 0.04, 'square', j * 0.11, null, 2400)); },
  whoosh() { if (!gate('whoosh', 250)) return; noise(0.3, 900, 0.03, 'bandpass', 1.2); },
  no() { if (!gate('no', 300)) return; tone(240, 0.15, 0.035, 'triangle', 0, 200, 900); },
  coin(i = 0) { tone(note(784, Math.min(10, i + 4)), 0.18, 0.05, 'triangle'); tone(note(784, Math.min(14, i + 8)), 0.18, 0.04, 'triangle', 0.06); },
  combo(i = 0) { [0, 2, 4].forEach((q, j) => pluck(note(523, q + i), 0.6, 0.05, j * 0.07)); },
  star(i = 0) { pluck(note(523.3, 4 + i * 2), 0.8, 0.08); },
  win() { this.fanfare(); },
  lose() { tone(392, 0.4, 0.05, 'triangle', 0, 330); tone(294, 0.8, 0.05, 'triangle', 0.3, 262); },
};
let mus = { t: 0, i: 0 };
const TUNE = [0, 4, 7, 9, 7, 4, 2, 4, 0, 4, 7, 12, 9, 7, 4, 2];
function soundStep(G, dt) { if (!actx || MUTE || paused) return;
  if (SET.sfx && G && !G.over) { const o = ui.sec;
    if (o && o.kind === 'belt') { beltN -= dt; if (beltN <= 0) { beltN = 0.25; noise(0.25, 160, 0.015, 'lowpass', 1); } }
    if (o && o.kind === 'sweep' && !o.open) { const P = G.p, ang = Math.atan2(P.z - o.pivot.z, P.x - o.pivot.x), tA = ((((ang - o.th) % TAU) + TAU) % TAU) / Math.max(0.01, o.w); if (tA < 0.5) sfx.whoosh(); }
    if (o && o.kind === 'wall') for (const gl of o.gloves) { const s = glove(gl, G.t); if (s.st === 'out' && s.e < 0.3 && Math.abs(gl.z - G.p.z) < 6 && gate('punch' + gl.z, 400)) noise(0.12, 1200, 0.04, 'bandpass', 1); } }
  mus.t += dt; const beat = 0.22; if (mus.t < beat) return; mus.t -= beat; const i = mus.i++;
  music(() => { pluck(note(392, TUNE[i % TUNE.length]), 0.35, 0.013); if (i % 2 === 0) pluck(note(98, [0, 0, 5, 7][(i >> 3) % 4]), 0.5, 0.022); if (i % 4 === 2) noise(0.05, 5000, 0.006, 'highpass', 1); }); }
