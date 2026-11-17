// ===================== SOUND: the office (PLAYBOOK S1-S11) =====================
// Paper: a sheet sliding in, a rubber stamp (its chime climbing with a run of right calls), a crumple into the bin, a soft
// buzz for a wrong call. A quiet office hum under it all.
const sfx = {
  click() { tone(660, 0.05, 0.08, 'triangle', 0, 880); },
  tick() { if (!gate('tick', 60)) return; tone(1200 * vary(0.05), 0.03, 0.05, 'square'); },
  ding() { tone(988, 0.5, 0.1, 'sine'); tone(1480, 0.35, 0.04, 'sine', 0.02); },
  coin(i = 0) { const b = note(784, Math.min(10, i + 1)); tone(b, 0.18, 0.09, 'triangle'); tone(b * 2, 0.12, 0.03, 'sine', 0.01); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.12, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.12); },
  paper() { noise(0.22, 3200 * vary(0.1), 0.06, 'bandpass', 0.7, 0, 0.03); },
  stamp(n = 1) { tone(110, 0.09, 0.16, 'sine', 0, 60); noise(0.05, 1200, 0.1, 'bandpass', 1); tone(note(523, Math.min(9, n + 1)), 0.25, 0.06, 'triangle', 0.06); },
  bin() { for (let i = 0; i < 5; i++) noise(0.06, 2500 + Math.random() * 2000, 0.05, 'bandpass', 1.5, i * 0.04); tone(140, 0.12, 0.08, 'sine', 0.2, 90); },
  wrong() { if (!gate('wrong', 250)) return; tone(196, 0.25, 0.09, 'square', 0, 175, 900); tone(185, 0.3, 0.06, 'square', 0.12, 165, 900); },
  win() { [0, 4, 7, 12].forEach((s, j) => pluck(note(262, s), 1.0, 0.13, j * 0.1)); },
  lose() { tone(294, 0.5, 0.1, 'triangle', 0, 262); tone(220, 0.8, 0.1, 'triangle', 0.3, 196); },
};
