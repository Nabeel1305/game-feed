
// ===================== SOUND: the steppe (PLAYBOOK S1-S11) =====================
// Wind through dry grass, your own breathing and heartbeat rising as you get close and when it looks; a soft crunch of grass as
// you creep; the spear's whistle and thud; the animal's snort, the drum of hooves; the lion's low growl and its roar.
const sfx = {
  click() { tone(620, 0.05, 0.07, 'triangle', 0, 820); },
  tick() { if (!gate('tick', 60)) return; tone(1300 * vary(0.05), 0.025, 0.04, 'square', 0, null, 3000); },
  ding() { tone(988, 0.5, 0.1, 'sine'); tone(1480, 0.35, 0.04, 'sine', 0.02); },
  coin(i = 0) { const b = note(784, Math.min(10, i + 1)); tone(b, 0.18, 0.1, 'triangle'); tone(b * 2, 0.12, 0.03, 'sine', 0.01); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.12, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.12); },
  tell() { noise(0.08, 2600, 0.03, 'bandpass', 3); },
  snort() { noise(0.25, 700, 0.12, 'bandpass', 1.2); tone(160, 0.2, 0.05, 'sawtooth', 0, 120, 500); },
  throw() { noise(0.4, 1400, 0.14, 'bandpass', 1, 0, 0.05); tone(700, 0.35, 0.03, 'sine', 0.05, 380); },
  thud(vital) { tone(vital ? 95 : 140, 0.25, 0.26, 'sine', 0, 50); noise(0.15, vital ? 500 : 900, 0.14, 'lowpass'); },
  kill(n = 1) { tone(110, 0.6, 0.2, 'sine', 0.05, 55); [0, 4, 7, 12].forEach((s, j) => tone(note(196, s + n), 0.6, 0.08, 'triangle', 0.25 + j * 0.08)); },
  miss() { noise(0.2, 400, 0.1, 'lowpass'); },
  bolt() { for (let i = 0; i < 8; i++) { tone(90 * vary(0.1), 0.06, 0.08, 'sine', i * 0.11, 60); noise(0.05, 600, 0.05, 'lowpass', 1, i * 0.11); } },
  growl(side) { tone(70, 1.4, 0.18, 'sawtooth', 0, 55, 300); noise(1.2, 220, 0.16, 'lowpass', 2, 0, 0.2); },
  turn() { noise(0.18, 1800, 0.06, 'bandpass', 1); },
  roar() { tone(140, 0.7, 0.24, 'sawtooth', 0, 70, 900); noise(0.7, 500, 0.22, 'bandpass', 0.8); },
  brace() { tone(80, 0.5, 0.3, 'sine', 0, 40); noise(0.3, 900, 0.2, 'lowpass'); tone(330, 0.5, 0.08, 'triangle', 0.2, 440); },
  maul() { noise(0.6, 600, 0.3, 'lowpass', 0.8); tone(120, 0.5, 0.2, 'sawtooth', 0, 60, 500); },
  thunder() { noise(2.8, 140, 0.5, 'lowpass', 0.7, 0, 0.08); },
  win() { [0, 3, 5, 7, 10].forEach((s, j) => tone(note(147, s + 3), 0.9, 0.1, 'triangle', j * 0.1)); tone(73, 1.2, 0.15, 'sine', 0, 73); },
  lose() { tone(196, 0.8, 0.12, 'triangle', 0, 175); tone(147, 1.1, 0.12, 'triangle', 0.35, 131); },
};
const AM = { on: false };
function soundStep(G, dt) {
  if (!actx || MUTE || HEADLESS) return;
  if (!AM.on) { AM.on = true; AM.wind = bed(1100, 0.5, 0.025, 0.12, 'bandpass'); AM.rain = bed(4800, 0.5, 0, 0.3, 'highpass'); AM.beat = 0; AM.crunch = 0; }
  const g = G; if (!g) return; const wet = W3 && W3.S ? W3.S.rain : 0, a = g.a, d = distA(g), tense = (a.st === 'look' ? 0.5 : 0) + clamp((30 - d) / 25, 0, 0.5) + (g.lion && g.lion.st !== 'gone' ? 0.6 : 0);
  AM.wind && AM.wind.set(0.02 + (g.weather === 'storm' ? 0.05 : 0), 1); AM.rain && AM.rain.set(wet * 0.05, 1);
  // the heartbeat: faster and louder the tenser it gets (P30)
  AM.beat -= dt; if (AM.beat <= 0 && tense > 0.15) { AM.beat = 1.05 - tense * 0.5; tone(55, 0.12, 0.12 * tense, 'sine', 0, 45); tone(50, 0.12, 0.08 * tense, 'sine', 0.16, 42); }
  if (g.me.creep) { AM.crunch -= dt; if (AM.crunch <= 0) { AM.crunch = 0.35 + Math.random() * 0.2; noise(0.09, 2200 * vary(0.2), 0.035, 'bandpass', 1.4); } }
}
