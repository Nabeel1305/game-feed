// ===================== SOUND: the lighthouse at night (PLAYBOOK S1-S11) =====================
// The sea below (a slow swell of noise), the wind round the gallery, rain on the glass in a storm, thunder. A lost boat's
// distant engine; when a boat sees you, it answers with its horn; a harbour bell as it reaches the lights; a warm chord when it
// is home, a step higher with each safe boat in a row. A wreck is a crack of timber and a splash.
const sfx = {
  click() { tone(660, 0.05, 0.08, 'triangle', 0, 880); },
  tick() { if (!gate('tick', 60)) return; tone(1200 * vary(0.05), 0.03, 0.05, 'square'); },
  ding() { tone(988, 0.5, 0.1, 'sine'); tone(1480, 0.35, 0.04, 'sine', 0.02); },
  coin(i = 0) { const b = note(784, Math.min(10, i + 1)); tone(b, 0.18, 0.09, 'triangle'); tone(b * 2, 0.12, 0.03, 'sine', 0.01); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.12, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.12); },
  distant() { for (let i = 0; i < 10; i++) tone(70 * vary(0.05), 0.08, 0.025, 'sawtooth', i * 0.11, null, 300); },
  horn() { if (!gate('horn', 800)) return; tone(185, 1.1, 0.09, 'sawtooth', 0, 180, 700); tone(277, 1.1, 0.05, 'sawtooth', 0, 270, 900); },
  lostl() { tone(440, 0.35, 0.05, 'sine', 0, 330); },
  bell() { tone(880, 1.6, 0.08, 'sine'); tone(1320, 1.1, 0.03, 'sine', 0.01); tone(2210, 0.7, 0.02, 'sine', 0.01); },
  home(n = 1) { const b = Math.min(7, n); [0, 2, 4, 7].forEach((s, j) => pluck(note(262, s + b), 1.3, 0.12, j * 0.12)); tone(note(523, b + 4), 1.2, 0.04, 'sine', 0.36); },
  wreck() { noise(0.5, 900, 0.2, 'bandpass', 0.8); tone(90, 0.5, 0.15, 'sawtooth', 0, 50, 500); noise(1.4, 2600, 0.1, 'lowpass', 0.6, 0.15, 0.1); },
  bump() { tone(110, 0.3, 0.12, 'sine', 0, 70); noise(0.5, 1800, 0.06, 'lowpass', 0.7, 0.05); },
  thunder() { noise(3.2, 120, 0.35, 'lowpass', 0.7, 0, 0.1); },
  win() { [0, 4, 7, 12, 16].forEach((s, j) => pluck(note(262, s), 1.4, 0.13, j * 0.11)); },
  lose() { tone(196, 1.2, 0.09, 'sawtooth', 0, 185, 600); tone(147, 1.6, 0.07, 'sawtooth', 0.5, 140, 500); },
};
const AM = { on: false };
function soundStep(G, dt) {
  if (!actx || MUTE || HEADLESS) return;
  if (!AM.on) { AM.on = true; AM.sea = bed(380, 0.5, 0.05, 0.08, 'lowpass'); AM.wind = bed(900, 1.2, 0.012, 0.2, 'bandpass'); AM.rain = bed(5200, 0.5, 0, 0.3, 'highpass'); }
  const S = W3 && W3.S, rain = S ? S.rain : 0, storm = S ? S.storm : 0;
  AM.rain && AM.rain.set(rain * 0.028, 1); AM.wind && AM.wind.set(0.012 + storm * 0.02, 1);
}
// the band (tools/juice-kit.js): this game's music
bandStyle('waltz', { seed: 18, key: 3, bpm: 127 });
