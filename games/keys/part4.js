// ===================== SOUND: a piano (PLAYBOOK S1-S11) =====================
// The song is the sound: every tile plays its note on a small synthesized piano (a warm body, a brighter octave, a touch of
// the hammer), never exactly the same twice (a hair of detune and level, S4). Every fourth tile a soft low note underneath
// (the left hand). A long tile rings for as long as it is held. A wrong tap is a soft dull cluster, not a buzzer; the song's
// end a bright chord run; a long tile completed a little chime.
const hz = m => 440 * Math.pow(2, (m - 69) / 12);
const sfx = {
  click() { tone(880, 0.04, 0.05, 'triangle', 0, 1100); },
  key(m, hold = 0, n = 0) { if (m == null) return; const f = hz(m) * (1 + (Math.random() - 0.5) * 0.004), v = 0.11 * (0.92 + Math.random() * 0.16), d = Math.max(1.1, hold);
    tone(f, d, v, 'triangle', 0, 0, 2600); tone(f * 2, d * 0.6, v * 0.35, 'sine'); tone(f * 3, 0.25, v * 0.12, 'sine'); noise(0.02, 4000, v * 0.25, 'highpass', 1);
    if (n % 4 === 1) tone(hz(m - 24), 1.4, v * 0.5, 'triangle', 0, 0, 900); },
  chord(ms) { if (!Array.isArray(ms)) ms = [60, 64, 67]; ms.forEach((m, j) => sfx.key(m, 0, 2 + j)); },
  chime() { tone(hz(84), 0.5, 0.05, 'sine'); tone(hz(91), 0.6, 0.04, 'sine', 0.06); },
  letgo() { tone(hz(57), 0.2, 0.03, 'triangle'); },
  wrong() { tone(hz(47), 0.6, 0.09, 'triangle', 0, 0, 900); tone(hz(48), 0.6, 0.08, 'triangle', 0, 0, 900); noise(0.15, 300, 0.08, 'lowpass', 1); },
  fanfare() { [60, 64, 67, 72, 76].forEach((m, j) => pluck(hz(m), 1.0, 0.07, j * 0.07)); },
  no() { if (!gate('no', 250)) return; tone(200, 0.1, 0.05, 'triangle', 0, 160, 900); },
  coin(i = 0) { tone(note(784, Math.min(10, i + 1)), 0.18, 0.07, 'triangle'); },
  combo(n = 1) { [0, 2, 4].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.1, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.1); },
  win() { [60, 64, 67, 72].forEach((m, j) => pluck(hz(m), 1.0, 0.08, j * 0.12)); },
  lose() { tone(hz(55), 0.8, 0.07, 'triangle'); tone(hz(52), 1.0, 0.06, 'triangle', 0.25); },
};
