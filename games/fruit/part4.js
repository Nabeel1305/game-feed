// ===================== SOUND: the slingshot (PLAYBOOK S1-S11) =====================
// The rubber band's creak as you pull and its twang as you let go (a deeper thwack for a melon); a juicy splat on a hit
// (fatter for a bigger hit), a wet burst for a watermelon, a comic slide-whistle when a monster slips on a banana, a pop when one
// is beaten, a thunk off a shield, a combo chord climbing with the count (S4), a horn for each wave, a thump when one reaches you.
const sfx = {
  click() { tone(660, 0.05, 0.06, 'triangle', 0, 880); },
  load(f = 'orange') { tone(f === 'melon' ? 300 : 600, 0.08, 0.05, 'triangle', 0, f === 'melon' ? 260 : 700); },
  creak() { if (!gate('creak', 120)) return; tone(220 * vary(0.1), 0.06, 0.02, 'sawtooth', 0, 260, 900); },
  twang(f = 'orange') { tone(f === 'melon' ? 110 : 180, 0.25, 0.1, 'triangle', 0, f === 'melon' ? 70 : 120, 1500); noise(0.08, 1800, 0.05, 'bandpass', 1); },
  splat(d = 1) { noise(0.18 + Math.min(0.2, d * 0.05), 1100, 0.1, 'lowpass', 1); tone(140, 0.12, 0.06, 'sine', 0, 80); },
  melon() { noise(0.45, 700, 0.16, 'lowpass', 0.8); tone(90, 0.3, 0.1, 'sine', 0, 50); },
  slip() { tone(900, 0.5, 0.05, 'sine', 0, 300); },
  pop() { tone(500 * vary(0.1), 0.1, 0.07, 'square', 0, 900, 2500); },
  thunk() { tone(160, 0.15, 0.1, 'square', 0, 120, 900); noise(0.06, 1200, 0.05, 'bandpass', 1); },
  combo(n = 2) { [0, 4, 7, 12].slice(0, Math.min(4, n + 1)).forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.18, 0.06, 'triangle', j * 0.06)); },
  horn() { tone(220, 0.6, 0.06, 'sawtooth', 0, 230, 900); tone(330, 0.6, 0.04, 'sawtooth', 0.05, 340, 900); },
  hurt() { tone(70, 0.4, 0.18, 'sine', 0, 40); noise(0.25, 500, 0.1, 'lowpass', 1); },
  no() { if (!gate('no', 300)) return; tone(260, 0.14, 0.05, 'triangle', 0, 200, 900); },
  coin(i = 0) { const b = note(784, Math.min(10, i + 1)); tone(b, 0.18, 0.09, 'triangle'); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.12, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.12); },
  thunder() { noise(2.8, 140, 0.3, 'lowpass', 0.7, 0, 0.08); },
  win() { [0, 4, 7, 12].forEach((s, j) => pluck(note(392, s), 1.2, 0.13, j * 0.1)); },
  lose() { tone(294, 0.6, 0.1, 'triangle', 0, 262); tone(220, 0.9, 0.1, 'triangle', 0.3, 196); },
};
const AM = { on: false, grunt: 3 };
function soundStep(G, dt) { if (!actx || MUTE || HEADLESS) return; if (!AM.on) { AM.on = true; AM.wind = bed(700, 0.6, 0.01, 0.15, 'bandpass'); }
  if (!G || G.over || paused) return; AM.grunt -= dt; const near = G.mons.filter(m => !m.dead && m.z < 25).length; if (near && AM.grunt <= 0) { AM.grunt = 1.2 + Math.random() * 2; tone(90 + Math.random() * 60, 0.25, 0.03, 'sawtooth', 0, 70, 500); } }
