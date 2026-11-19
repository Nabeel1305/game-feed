// ===================== SOUND: cards (PLAYBOOK S1-S11) =====================
// A soft riffle when the cards are dealt, a crisp flick for each card played that climbs a note with every card in the streak
// (S4), a papery slide for a draw, a bright chime for a peak (higher for the second and third), a sparkle when you earn a joker,
// a little lock click, and a dull tap when a card does not fit.
const sfx = {
  click() { tone(880, 0.04, 0.05, 'triangle', 0, 1100); },
  shuffle() { for (let i = 0; i < 12; i++) noise(0.03, 3000, 0.03, 'highpass', 1, i * 0.035); },
  flip(n = 1) { noise(0.04, 3500, 0.05, 'highpass', 1); tone(note(523, Math.min(14, (n | 0) - 1)), 0.12, 0.06, 'triangle', 0.01); },
  deal() { noise(0.12, 2000, 0.04, 'bandpass', 0.8); },
  peak(n = 1) { [0, 4, 7, 12].forEach((q, j) => tone(note(659, q + (n - 1) * 2), 0.35, 0.06, 'sine', j * 0.06)); },
  gift() { for (let i = 0; i < 6; i++) tone(note(1046, i * 2), 0.12, 0.04, 'sine', i * 0.05); },
  unlock() { tone(1800, 0.05, 0.05, 'square', 0, 0, 4000); tone(1200, 0.08, 0.05, 'square', 0.06, 0, 4000); },
  no() { if (!gate('no', 250)) return; tone(200, 0.1, 0.05, 'triangle', 0, 160, 900); },
  coin(i = 0) { const b = note(784, Math.min(10, i + 1)); tone(b, 0.18, 0.07, 'triangle'); },
  combo(n = 1) { [0, 2, 4].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.1, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.1); },
  win() { [0, 4, 7, 12].forEach((q, j) => pluck(note(392, q), 1.0, 0.09, j * 0.12)); },
  lose() { tone(294, 0.5, 0.08, 'triangle', 0, 262); tone(247, 0.8, 0.08, 'triangle', 0.3, 220); },
};
