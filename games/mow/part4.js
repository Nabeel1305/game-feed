
// ===================== SOUND: a calm afternoon's mowing (PLAYBOOK S1-S11) =====================
// A soft engine hum that rises with your speed (a looped bed, quiet), a gentle "shhh" of cutting grass, a little two-note
// chime for each stripe climbing a step each time (S5), a happy clatter as the bag empties, a soft "thup" for a bump, a sad
// squash for flowers (never harsh, S8), a ping for each coin and a twinkle for the treasure, a woof.
const sfx = {
  click() { tone(880, 0.04, 0.05, 'triangle', 0, 1100); },
  start() { [0, 4, 7].forEach((q, j) => pluck(note(392, q), 0.5, 0.06, j * 0.08)); },
  cut() { if (!gate('cut', 70)) return; noise(0.07, 3800 * vary(0.15), 0.018, 'bandpass', 1.2); },
  stripe(n = 1) { tone(note(523, Math.min(12, n)), 0.2, 0.05, 'sine'); tone(note(523, Math.min(12, n) + 4), 0.25, 0.04, 'sine', 0.07); },
  full() { tone(440, 0.15, 0.05, 'triangle'); tone(330, 0.25, 0.05, 'triangle', 0.12); },
  empty() { for (let j = 0; j < 5; j++) noise(0.05, 800 + j * 200, 0.05, 'bandpass', 1.5, j * 0.05); [0, 4, 7].forEach((q, j) => pluck(note(392, q + 2), 0.4, 0.05, 0.25 + j * 0.06)); },
  bump() { if (!gate('bump', 250)) return; tone(110, 0.12, 0.07, 'sine', 0, 80); noise(0.06, 500, 0.04, 'lowpass', 1); },
  crush() { noise(0.25, 900, 0.07, 'lowpass', 1); tone(330, 0.3, 0.05, 'triangle', 0, 220); },
  gnome() { if (!gate('gnome', 300)) return; tone(1200, 0.06, 0.04, 'square', 0, 900, 2400); },
  woof() { if (!gate('woof', 800)) return; tone(260, 0.12, 0.08, 'sawtooth', 0, 180, 900); tone(240, 0.12, 0.07, 'sawtooth', 0.18, 170, 900); },
  coin(i = 0) { tone(note(784, Math.min(10, i + 1)), 0.18, 0.06, 'triangle'); },
  treasure() { [0, 4, 7, 11, 14].forEach((q, j) => tone(note(784, q), 0.3, 0.04, 'sine', j * 0.07)); },
  sputter() { for (let j = 0; j < 4; j++) tone(90 - j * 10, 0.1, 0.06, 'sawtooth', j * 0.15, 60, 700); },
  goal() { [0, 4, 7, 12].forEach((q, j) => pluck(note(392, q), 0.8, 0.07, j * 0.1)); },
  no() { if (!gate('no', 250)) return; tone(200, 0.1, 0.05, 'triangle', 0, 160, 900); },
  tick() { if (!gate('tick', 45)) return; tone(1320, 0.05, 0.03, 'triangle'); },
  combo(n = 1) { [0, 2, 4].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.1, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.1); },
  win() { [0, 4, 7, 12].forEach((q, j) => pluck(note(523, q), 1.0, 0.08, j * 0.12)); },
  lose() { tone(392, 0.4, 0.06, 'triangle', 0, 349); tone(330, 0.7, 0.06, 'triangle', 0.3, 294); },
};
// the engine: a quiet looped hum, louder and higher with speed, silent when paused or over
const AM = { on: false };
function engine(G) { if (HEADLESS || !actx || typeof bed !== 'function') return; if (!AM.on) { AM.on = true; AM.e = bed(95, 3, 0, 0.06, 'bandpass'); AM.e2 = bed(190, 5, 0, 0.06, 'bandpass'); }
  const q = MUTE || paused || !G || G.over, v = G && G.m ? G.m.v / VMAX : 0;
  if (AM.e) { AM.e.set(q ? 0 : 0.012 + v * 0.02, 0.1); if (AM.e.f) AM.e.f.frequency.value = 80 + v * 60; } if (AM.e2) { AM.e2.set(q ? 0 : 0.005 + v * 0.01, 0.1); if (AM.e2.f) AM.e2.f.frequency.value = 160 + v * 120; } }
