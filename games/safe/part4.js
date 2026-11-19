// ===================== SOUND: the safe (PLAYBOOK S1-S11) =====================
// The dial: a tiny dry tick for every number that passes. The CLICK: a low, solid thunk with a woody knock on top, the sound
// the whole game is about (S1: the one moment you listen for). A bolt sliding back climbs a note with each bolt (S4). The door:
// a heavy creak and a sweet chord. A jam is a dull clank; the dog a short bark; the guard footsteps, a torch click, a shout.
const sfx = {
  click() { tone(880, 0.04, 0.05, 'triangle', 0, 1100); },
  tick() { if (!gate('tick', 35)) return; noise(0.012, 5000, 0.025, 'highpass', 1); },
  thunk() { tone(110, 0.16, 0.16, 'sine', 0, 70); noise(0.05, 900, 0.1, 'bandpass', 1); tone(520, 0.05, 0.05, 'triangle', 0.005, 380); },
  muffle() { if (!gate('muffle', 120)) return; noise(0.04, 600, 0.03, 'lowpass', 1); },
  bolt(i = 0) { noise(0.18, 1800, 0.06, 'bandpass', 1.2); tone(note(392, i * 2), 0.2, 0.07, 'triangle', 0.12); tone(note(784, i * 2), 0.25, 0.04, 'sine', 0.16); },
  open() { noise(0.6, 300, 0.08, 'lowpass', 1); [0, 4, 7, 12].forEach((q, j) => pluck(note(392, q), 0.9, 0.08, 0.3 + j * 0.08)); },
  jam() { if (!gate('jam', 200)) return; tone(140, 0.2, 0.1, 'square', 0, 90, 700); noise(0.12, 700, 0.08, 'bandpass', 1); },
  bark() { tone(420, 0.09, 0.1, 'sawtooth', 0, 260, 1400); tone(380, 0.11, 0.1, 'sawtooth', 0.16, 240, 1400); },
  steps() { for (let i = 0; i < 4; i++) { noise(0.06, 400, 0.05 + i * 0.015, 'lowpass', 1, i * 0.42); tone(70, 0.06, 0.04 + i * 0.01, 'sine', i * 0.42); } },
  torch() { tone(2200, 0.03, 0.05, 'square', 0, 0, 5000); },
  shout() { tone(300, 0.25, 0.1, 'sawtooth', 0, 420, 1600); },
  siren() { for (let i = 0; i < 3; i++) tone(700, 0.25, 0.07, 'square', i * 0.5, 1100, 2400); },
  creak() { tone(180, 0.5, 0.03, 'sawtooth', 0, 240, 600); },
  chime() { [0, 7].forEach((q, j) => tone(note(880, q), 0.3, 0.05, 'sine', j * 0.08)); },
  no() { if (!gate('no', 250)) return; tone(200, 0.1, 0.05, 'triangle', 0, 160, 900); },
  coin(i = 0) { tone(note(784, Math.min(10, i + 1)), 0.18, 0.07, 'triangle'); },
  combo(n = 1) { [0, 2, 4].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.1, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.1); },
  win() { [0, 4, 7, 12].forEach((q, j) => pluck(note(392, q), 1.0, 0.09, j * 0.12)); },
  lose() { tone(294, 0.5, 0.08, 'triangle', 0, 262); tone(247, 0.8, 0.08, 'triangle', 0.3, 220); },
};
