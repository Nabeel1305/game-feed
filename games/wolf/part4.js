// ===================== SOUND: the hunt on the snow (PLAYBOOK S1-S11) =====================
// Wind over the snow; your breath and the crunch of your paws, quicker on a burst; the drum of the herd's hooves; a howl as the
// herd runs; a short yip when a packmate goes up a side; her snort before she swerves; the snap of jaws; a kick's thud; a
// pack howl when she is brought down (a step higher each hunt in a row).
const sfx = {
  click() { tone(660, 0.05, 0.08, 'triangle', 0, 880); },
  tick() { if (!gate('tick', 60)) return; tone(1200 * vary(0.05), 0.03, 0.05, 'square'); },
  ding() { tone(988, 0.5, 0.1, 'sine'); tone(1480, 0.35, 0.04, 'sine', 0.02); },
  coin(i = 0) { const b = note(784, Math.min(10, i + 1)); tone(b, 0.18, 0.09, 'triangle'); tone(b * 2, 0.12, 0.03, 'sine', 0.01); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.12, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.12); },
  howl(n = 0) { const b = 420 * Math.pow(2, Math.min(5, n) / 12); tone(b * 0.8, 2.0, 0.05, 'sine', 0, b * 1.25); tone(b * 1.25, 1.4, 0.03, 'sine', 0.6, b * 0.9); },
  hooves() { for (let i = 0; i < 10; i++) { tone(90 * vary(0.2), 0.06, 0.06, 'sine', i * 0.09, 60); noise(0.05, 900, 0.03, 'lowpass', 1, i * 0.09); } },
  yip() { tone(900, 0.08, 0.06, 'triangle', 0, 1200); tone(1100, 0.1, 0.05, 'triangle', 0.1, 1400); },
  snort() { if (!gate('snort', 500)) return; noise(0.25, 700, 0.07, 'bandpass', 1.5); },
  snap() { noise(0.05, 2500, 0.12, 'bandpass', 2); tone(220, 0.06, 0.06, 'square', 0, 160, 2000); },
  kick() { tone(70, 0.3, 0.2, 'sine', 0, 40); noise(0.2, 800, 0.12, 'lowpass', 1); tone(600, 0.3, 0.05, 'triangle', 0.1, 300); },
  caught(n = 1) { noise(0.4, 600, 0.12, 'lowpass', 0.8); sfx.howl(n); },
  lose1() { tone(330, 0.5, 0.06, 'triangle', 0, 262); },
  thunder() { noise(2.8, 140, 0.3, 'lowpass', 0.7, 0, 0.08); },
  win() { [0, 3, 7, 12, 15].forEach((s, j) => pluck(note(220, s), 1.2, 0.13, j * 0.1)); },
  lose() { tone(294, 0.6, 0.1, 'triangle', 0, 262); tone(220, 0.9, 0.1, 'triangle', 0.3, 196); },
};
const AM = { on: false, step: 0 };
function soundStep(G, dt) {
  if (!actx || MUTE || HEADLESS) return;
  if (!AM.on) { AM.on = true; AM.wind = bed(700, 0.9, 0.02, 0.25, 'bandpass'); AM.breath = bed(1600, 1.5, 0, 0.6, 'bandpass'); }
  if (!G || G.ph !== 'chase') { AM.breath && AM.breath.set(0, 0.3); return; } const w = G.wolf;
  AM.breath && AM.breath.set(w.bursting ? 0.035 : 0.012, 0.2);
  AM.step -= dt * (w.v / 10); if (AM.step <= 0) { AM.step = 0.18; noise(0.05, 2200 * vary(0.2), 0.03, 'bandpass', 1.5); }
}
// the band (tools/juice-kit.js): this game's music
bandStyle('tense', { seed: 23, key: 0, bpm: 92, lead: { i: 'flute', oct: 0 }, comp: { i: 'choir', p: 'P' }, A: [0, 5, 0, 4], tune: ['0.......2...1...', '3.......2...0...', '4.......3...2...'], pen: 1, d: { d: 'x.....x...x.....', u: 'x...............', r: '....x.......x...' } });
