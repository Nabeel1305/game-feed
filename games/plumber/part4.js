
// ===================== SOUND: the plumber's day (PLAYBOOK S1-S11) =====================
// Short, warm and a bit comic. The phone rings two soft tones; the van chugs off; footsteps; a look ends with a little
// "hmm" chime (two notes up when you found the trouble, one soft note when the part is fine). The wrench ratchets while you
// hold; the plunger goes "shlup" a step higher each good push (S5); the snake rattles and a kink twangs; the till rings with
// the pay, brighter for three stars. A wrong fix is a soft "bonk", never harsh (S8); a flood is a low warble.
const sfx = {
  click() { tone(880, 0.04, 0.05, 'triangle', 0, 1100); },
  start() { [0, 4, 7].forEach((q, j) => pluck(note(392, q + 2), 0.5, 0.07, j * 0.07)); },
  ring() { if (!gate('ring', 900)) return; for (let j = 0; j < 2; j++) { tone(1046, 0.09, 0.05, 'sine', j * 0.16); tone(1318, 0.09, 0.05, 'sine', j * 0.16 + 0.05); } },
  van() { tone(70, 0.5, 0.09, 'sawtooth', 0, 110, 400); noise(0.45, 400, 0.05, 'lowpass', 1, 0.02); },
  door() { tone(1318, 0.18, 0.05, 'sine'); tone(1046, 0.3, 0.05, 'sine', 0.16); },
  step() { if (!gate('step', 120)) return; for (let j = 0; j < 3; j++) noise(0.03, 900 + Math.random() * 300, 0.05, 'bandpass', 2, j * 0.12); },
  found() { tone(660, 0.12, 0.05, 'triangle'); tone(880, 0.18, 0.05, 'triangle', 0.09); },
  fine() { tone(587, 0.15, 0.04, 'sine'); },
  ratchet() { if (!gate('ratchet', 85)) return; noise(0.02, 3200 * vary(0.1), 0.05, 'bandpass', 4); },
  plunge(n = 1) { if (!gate('plunge', 60)) return; tone(note(196, Math.min(10, n)), 0.14, 0.09, 'sine', 0, note(196, Math.min(10, n)) * 0.6); noise(0.08, 700, 0.06, 'lowpass', 1.5); },
  snag() { if (!gate('snag', 200)) return; tone(220, 0.08, 0.04, 'square', 0, 200, 1200); },
  kink() { tone(330, 0.25, 0.07, 'sawtooth', 0, 160, 1500); },
  feedTick() { if (!gate('feed', 70)) return; noise(0.025, 1800 * vary(0.2), 0.035, 'bandpass', 3); },
  miss() { if (!gate('miss', 140)) return; tone(180, 0.1, 0.05, 'sine', 0, 140); },
  crack() { noise(0.12, 2400, 0.1, 'highpass', 1); tone(140, 0.2, 0.08, 'triangle', 0, 90); },
  good() { tone(784, 0.12, 0.06, 'triangle'); tone(1175, 0.2, 0.05, 'triangle', 0.07); },
  wrong() { if (!gate('wrong', 220)) return; tone(200, 0.16, 0.07, 'triangle', 0, 150, 900); },
  alarm() { if (!gate('alarm', 800)) return; for (let j = 0; j < 3; j++) tone(500, 0.12, 0.05, 'triangle', j * 0.18, 380); },
  cash(st = 1) { noise(0.05, 4000, 0.05, 'highpass', 1); [0, 4, 7, 12].slice(0, 1 + st).forEach((q, j) => tone(note(784, q), 0.3, 0.06, 'sine', 0.06 + j * 0.06)); },
  bell() { [0, 0.25].forEach(d => tone(659, 0.6, 0.07, 'sine', d)); },
  goal() { [0, 4, 7, 12, 16].forEach((q, j) => pluck(note(392, q), 0.9, 0.08, j * 0.09)); },
  no() { if (!gate('no', 250)) return; tone(200, 0.1, 0.05, 'triangle', 0, 160, 900); },
  tick() { if (!gate('tick', 45)) return; tone(1320, 0.05, 0.03, 'triangle'); },
  coin(i = 0) { tone(note(784, Math.min(10, i + 1)), 0.18, 0.07, 'triangle'); },
  combo(n = 1) { [0, 2, 4].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.1, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.1); },
  win() { [0, 4, 7, 12].forEach((q, j) => pluck(note(523, q), 1.0, 0.08, j * 0.12)); },
  lose() { tone(392, 0.4, 0.06, 'triangle', 0, 349); tone(330, 0.7, 0.06, 'triangle', 0.3, 294); },
};
