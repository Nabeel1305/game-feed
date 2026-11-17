// ===================== SOUND: the workshop (PLAYBOOK S1-S11) =====================
// The wheel's low hum, a wet whisper of clay under the finger (louder as you press), a soft rising step as the match climbs,
// the kiln's whoosh and a bright ceramic ting when a pot is fired (higher with each good pot in a row), a crack when one fails,
// a soft slump when it collapses. Rain on the window when it rains.
const sfx = {
  click() { tone(660, 0.05, 0.08, 'triangle', 0, 880); },
  tick() { if (!gate('tick', 60)) return; tone(1200 * vary(0.05), 0.03, 0.05, 'square'); },
  ding() { tone(988, 0.5, 0.1, 'sine'); tone(1480, 0.35, 0.04, 'sine', 0.02); },
  coin(i = 0) { const b = note(784, Math.min(10, i + 1)); tone(b, 0.18, 0.09, 'triangle'); tone(b * 2, 0.12, 0.03, 'sine', 0.01); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.12, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.12); },
  plop() { tone(90, 0.18, 0.14, 'sine', 0, 55); noise(0.15, 500, 0.06, 'lowpass', 1); },
  step(n = 5) { if (!gate('step', 200)) return; tone(note(392, Math.max(0, n - 4)), 0.3, 0.04, 'sine'); },
  fire(n = 1) { noise(1.0, 700, 0.12, 'lowpass', 0.6, 0, 0.3); const b = note(1046, Math.min(8, n)); tone(b, 1.4, 0.07, 'sine', 0.7); tone(b * 2.76, 0.9, 0.025, 'sine', 0.7); tone(b * 5.4, 0.5, 0.012, 'sine', 0.7); },
  crack() { noise(0.12, 3000, 0.14, 'highpass', 0.8); noise(0.25, 1500, 0.08, 'bandpass', 1.2, 0.05); tone(180, 0.3, 0.05, 'triangle', 0.05, 120); },
  slump() { tone(70, 0.6, 0.15, 'sine', 0, 40); noise(0.5, 400, 0.12, 'lowpass', 0.8); },
  thunder() { noise(2.8, 140, 0.3, 'lowpass', 0.7, 0, 0.08); },
  win() { [0, 4, 7, 12, 16].forEach((s, j) => pluck(note(262, s), 1.2, 0.13, j * 0.1)); },
  lose() { tone(294, 0.6, 0.1, 'triangle', 0, 262); tone(220, 0.9, 0.1, 'triangle', 0.3, 196); },
};
const AM = { on: false };
function soundStep(G, dt) {
  if (!actx || MUTE || HEADLESS) return;
  if (!AM.on) { AM.on = true; AM.hum = bed(95, 3, 0.02, 0.05, 'lowpass'); AM.wet = bed(1400, 0.8, 0, 0.4, 'bandpass'); AM.rain = bed(5000, 0.5, 0, 0.3, 'highpass'); }
  const g = G; AM.wet && AM.wet.set(g && g.touching ? 0.05 : 0, 0.05); AM.rain && AM.rain.set((W3 && W3.S ? W3.S.rain : 0) * 0.02, 1);
}
