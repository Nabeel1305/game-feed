
// ===================== SOUND: the flight deck (PLAYBOOK S1-S11) =====================
// Engines that rise and fall with the throttle, wind past the airframe, the radio-altimeter calls near the ground ("fifty,
// thirty, ten" as tones), the warnings, the chirp of tyres and the rumble of the rollout.
const sfx = {
  click() { tone(620, 0.05, 0.07, 'triangle', 0, 820); },
  tick() { if (!gate('tick', 60)) return; tone(1300 * vary(0.05), 0.025, 0.04, 'square', 0, null, 3000); },
  ding() { tone(988, 0.5, 0.1, 'sine'); tone(1480, 0.35, 0.04, 'sine', 0.02); },
  coin(i = 0) { const b = note(784, Math.min(10, i + 1)); tone(b, 0.18, 0.1, 'triangle'); tone(b * 2, 0.12, 0.03, 'sine', 0.01); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.12, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.12); },
  warn() { if (!gate('warn', 1500)) return; for (let i = 0; i < 3; i++) tone(880, 0.12, 0.08, 'square', i * 0.18, null, 2400); },
  call(h) { tone(h > 30 ? 660 : h > 15 ? 784 : 988, 0.1, 0.06, 'sine'); },
  touch(q) { noise(q === 'butter' ? 0.15 : 0.3, 2200, q === 'butter' ? 0.08 : 0.16, 'bandpass', 2); tone(70, 0.4, q === 'butter' ? 0.1 : 0.25, 'sine', 0, 40); if (q === 'butter') [0, 4, 7].forEach((s, j) => tone(note(523, s), 0.6, 0.06, 'sine', 0.2 + j * 0.08)); },
  crash() { noise(1.5, 500, 0.45, 'lowpass', 0.7); tone(55, 1, 0.35, 'sine', 0, 30); },
  thunder() { noise(2.8, 140, 0.5, 'lowpass', 0.7, 0, 0.08); },
  win() { [0, 4, 7, 12].forEach((s, j) => pluck(note(262, s + 5), 1.2, 0.14, j * 0.1)); },
  lose() { tone(294, 0.6, 0.12, 'triangle', 0, 262); tone(220, 0.9, 0.12, 'triangle', 0.3, 196); },
};
const AM = { on: false };
function soundStep(G, dt) {
  if (!actx || MUTE || HEADLESS) return;
  if (!AM.on) { AM.on = true; AM.eng = bed(300, 2, 0, 0.5, 'lowpass'); AM.whine = bed(3200, 8, 0, 0.5, 'bandpass'); AM.wind = bed(900, 0.6, 0, 0.3, 'bandpass'); AM.rain = bed(4800, 0.5, 0, 0.3, 'highpass'); AM.roll = bed(150, 1, 0, 0.3, 'lowpass'); AM.lastCall = 999; }
  const g = G || (typeof IG !== 'undefined' && IG); if (!g) return; const a = g.ac, air = g.ph === 'air';
  AM.eng && AM.eng.set(0.02 + g.thr * 0.06, 0.4); AM.whine && AM.whine.set(0.004 + g.thr * 0.01, 0.4); AM.wind && AM.wind.set(air ? a.v / 90 * 0.04 : 0.01, 0.4);
  AM.rain && AM.rain.set((W3 && W3.S ? W3.S.rain : 0) * 0.05, 1); AM.roll && AM.roll.set(g.ph === 'roll' ? a.v / 70 * 0.12 : 0, 0.2);
  if (air && G) { const h = a.y * 3.28; for (const c of [100, 50, 30, 20, 10]) if (h < c && AM.lastCall > c) { sfx.call(c); } AM.lastCall = h; }
}
// the band (tools/juice-kit.js): this game's music
bandStyle('tense', { seed: 15, key: 2, bpm: 96 });
