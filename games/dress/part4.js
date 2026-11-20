
// ===================== SOUND: the studio and the show (PLAYBOOK S1-S11) =====================
// Fabric swishes as you change the dress (softer for chiffon, a glitter for sequins), a tick when a wish is met, a pop when a
// trim goes on, a bell for each client; at the show a runway beat (music: its own switch) under camera clicks, a drum roll
// and a note a step higher for each judge's stars (S5).
const sfx = {
  click() { tone(880, 0.04, 0.05, 'triangle', 0, 1100); },
  bell() { tone(1568, 0.6, 0.05, 'sine'); tone(2349, 0.5, 0.03, 'sine', 0.1); },
  page() { noise(0.12, 2600, 0.03, 'bandpass', 1.2); },
  swish(p) { noise(0.22, p === 'colour' ? 3200 : 1800, 0.05, 'bandpass', 0.9); if (G && G.d && G.d.fabric === 'sequins') for (let i = 0; i < 4; i++) tone(3000 + i * 400, 0.05, 0.015, 'sine', i * 0.03); },
  tick() { tone(1320, 0.08, 0.05, 'triangle'); tone(1760, 0.1, 0.04, 'triangle', 0.05); },
  pick() { tone(660, 0.08, 0.04, 'triangle'); },
  pop() { tone(500, 0.1, 0.07, 'sine', 0, 900); },
  drum() { for (let i = 0; i < 12; i++) noise(0.05, 1800, 0.03 + i * 0.004, 'bandpass', 1.5, i * 0.06); tone(90, 0.4, 0.1, 'sine', 0.75, 50); },
  shutter() { if (!gate('shutter', 90)) return; noise(0.04, 5000, 0.04, 'highpass', 0.7); },
  coin(i = 0) { tone(note(784, Math.min(10, i + 4)), 0.18, 0.07, 'triangle'); tone(note(784, Math.min(14, i + 8)), 0.18, 0.05, 'triangle', 0.06); },
  combo(n = 1) { [0, 2, 4, 7].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  goal() { [0, 4, 7, 12, 16].forEach((q, j) => pluck(note(392, q), 0.9, 0.08, j * 0.09)); },
  no() { if (!gate('no', 250)) return; tone(200, 0.1, 0.05, 'triangle', 0, 160, 900); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.1, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.1); },
  win() { [0, 4, 7, 12].forEach((q, j) => pluck(note(523, q), 1.0, 0.08, j * 0.12)); },
  lose() { tone(392, 0.4, 0.05, 'triangle', 0, 349); tone(330, 0.7, 0.05, 'triangle', 0.3, 294); },
};
// music (its own switch): a soft studio loop while designing; a runway beat at the show
let mus = { t: 0, i: 0 };
const STUDIO = [0, 4, 7, 9, 7, 4, 2, 4, 0, 2, 4, 7, 4, 2, 0, -1];
function soundStep(G, dt) { if (!actx || MUTE || paused) return; const home = $('ovHome') && !$('ovHome').classList.contains('hidden'), show = G && G.stage === 'runway';
  if (show && Math.random() < dt * 5) sfx.shutter();
  mus.t += dt; const beat = show ? 0.24 : 0.4; if (mus.t < beat) return; mus.t -= beat; const i = mus.i++;
  music(() => { if (show) { if (i % 4 === 0) tone(60, 0.3, 0.09, 'sine', 0, 40); if (i % 4 === 2) noise(0.08, 1800, 0.035, 'bandpass', 1.2); noise(0.03, 7000, 0.012, 'highpass', 0.7); if (i % 8 === 0) tone(note(110, [0, 3, 5, 3][Math.floor(i / 8) % 4]), 1.8, 0.035, 'sawtooth', 0, null, 600); }
    else { const n = STUDIO[i % STUDIO.length], bar = Math.floor(i / 16) % 4; if (n >= 0 && (i % 2 === 0 || Math.random() < 0.5)) pluck(note(392, n + [0, 2, 3, 1][bar]), 0.9, home ? 0.025 : 0.018); if (i % 8 === 0) tone(note(98, [0, 2, 3, 1][bar]), 3, home ? 0.02 : 0.015, 'sine'); } }); }
