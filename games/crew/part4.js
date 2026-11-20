
// ===================== SOUND: the station (PLAYBOOK S1-S11) =====================
// A low hum under everything; soft footsteps; a cartoon BONK and a swirl of stars for a knock-out; a metal clang and a
// whoosh through the vents; the alarm's two-tone wail for a meeting; a sting when someone saw; a deep thrum for sabotage;
// a spacey whoosh when someone is thrown out; a chord when only one is left.
const sfx = {
  click() { tone(880, 0.04, 0.05, 'triangle', 0, 1100); },
  start() { [0, 3, 7, 10].forEach((q, j) => pluck(note(196, q), 0.7, 0.06, j * 0.1)); },
  knock() { tone(180, 0.12, 0.14, 'square', 0, 90, 1200); noise(0.1, 2600, 0.06, 'bandpass', 1.5); [0, 4, 7].forEach((q, j) => tone(note(1046, q), 0.08, 0.04, 'triangle', 0.08 + j * 0.05)); },
  gasp() { tone(note(392, 6), 0.4, 0.08, 'sawtooth', 0, note(392, 0), 1400); },
  vent() { tone(260, 0.06, 0.08, 'square', 0, 200, 1800); noise(0.3, 900, 0.06, 'lowpass', 0.9, 0.04); },
  sab() { tone(70, 0.8, 0.12, 'sawtooth', 0, 50, 500); tone(note(220, 1), 0.5, 0.04, 'square', 0.1, null, 900); },
  alarm() { for (let i = 0; i < 4; i++) { tone(660, 0.18, 0.08, 'square', i * 0.36, null, 2200); tone(520, 0.18, 0.08, 'square', i * 0.36 + 0.18, null, 2200); } },
  vote() { tone(note(523, 7), 0.12, 0.06, 'triangle'); },
  eject() { noise(1.4, 600, 0.06, 'lowpass', 0.5); tone(300, 1.4, 0.04, 'sine', 0, 80); },
  step() { if (!gate('step', 260)) return; noise(0.04, 1200 * vary(0.2), 0.012, 'bandpass', 1.2); },
  goal() { [0, 4, 7, 12, 16].forEach((q, j) => pluck(note(392, q), 0.9, 0.08, j * 0.09)); },
  no() { if (!gate('no', 250)) return; tone(200, 0.1, 0.05, 'triangle', 0, 160, 900); },
  tick() { if (!gate('tick', 45)) return; tone(1320, 0.05, 0.03, 'triangle'); },
  coin(i = 0) { tone(note(784, Math.min(10, i + 1)), 0.18, 0.07, 'triangle'); },
  combo(n = 1) { [0, 2, 4].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.1, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.1); },
  win() { [0, 4, 7, 12].forEach((q, j) => pluck(note(523, q), 1.0, 0.08, j * 0.12)); },
  lose() { tone(392, 0.4, 0.06, 'triangle', 0, 349); tone(330, 0.7, 0.06, 'triangle', 0.3, 294); },
};
// the hum of the station (a soft low note every few seconds), your footsteps, the meltdown's beeps
let humT = 0, beepT = 0; function soundStep(G, dt) { if (!G || G.over || paused || G.meet) return; humT -= dt; if (humT <= 0) { humT = 3.2; tone(55, 3.4, 0.018, 'sine'); tone(82.4, 3.4, 0.01, 'sine'); }
  if (G.you.moving) sfx.step(); if (G.melt > 0) { beepT -= dt; if (beepT <= 0) { beepT = G.melt < 10 ? 0.35 : 0.8; tone(880, 0.08, 0.05, 'square', 0, null, 3000); } } }
