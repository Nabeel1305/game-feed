// ===================== SOUND: the whaleboat (PLAYBOOK S1-S11) =====================
// The sea's swell and the wind; oars knocking in their pins as the crew rows; the whale's blow (a deep whoosh); the harpoon's
// whistle and the thud when it holds; the line creaking under tension (higher as it tightens); a warning shout before a run;
// the rope's snap; the whale's low song when she is spent.
const sfx = {
  click() { tone(660, 0.05, 0.08, 'triangle', 0, 880); },
  tick() { if (!gate('tick', 60)) return; tone(1200 * vary(0.05), 0.03, 0.05, 'square'); },
  ding() { tone(988, 0.5, 0.1, 'sine'); tone(1480, 0.35, 0.04, 'sine', 0.02); },
  coin(i = 0) { const b = note(784, Math.min(10, i + 1)); tone(b, 0.18, 0.09, 'triangle'); tone(b * 2, 0.12, 0.03, 'sine', 0.01); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.12, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.12); },
  distant() { tone(110, 1.6, 0.04, 'sine', 0, 70, 400); },
  blow() { noise(1.3, 700, 0.14, 'bandpass', 0.6, 0, 0.15); noise(1.0, 2500, 0.05, 'highpass', 0.6, 0.1, 0.2); },
  splash(s = 1) { noise(0.6 * s + 0.2, 1400, 0.12 * Math.min(1, s), 'lowpass', 0.7, 0, 0.02); },
  throw() { tone(1400, 0.35, 0.04, 'sine', 0, 700); noise(0.3, 3000, 0.05, 'highpass', 1); },
  hit() { tone(90, 0.3, 0.2, 'sine', 0, 50); noise(0.25, 900, 0.12, 'bandpass', 1); tone(55, 1.4, 0.12, 'sawtooth', 0.15, 45, 300); },
  warn() { tone(520, 0.12, 0.08, 'square', 0, 560, 1600); tone(520, 0.12, 0.08, 'square', 0.18, 560, 1600); },
  surge() { noise(1.2, 900, 0.14, 'lowpass', 0.6, 0, 0.1); },
  snap() { noise(0.08, 4000, 0.2, 'highpass', 1); tone(300, 0.25, 0.1, 'sawtooth', 0, 80, 2000); },
  caught(n = 1) { tone(85, 2.4, 0.07, 'sine', 0, 140, 500); [0, 4, 7, 12].forEach((s, j) => pluck(note(196, s + Math.min(6, n)), 1.4, 0.12, 0.4 + j * 0.12)); },
  thunder() { noise(2.8, 140, 0.3, 'lowpass', 0.7, 0, 0.08); },
  win() { [0, 4, 7, 12, 16].forEach((s, j) => pluck(note(196, s), 1.4, 0.13, j * 0.11)); },
  lose() { tone(196, 1.0, 0.1, 'sawtooth', 0, 185, 600); tone(147, 1.4, 0.08, 'sawtooth', 0.4, 140, 500); },
};
const AM = { on: false, oar: 0, creak: 0 };
function soundStep(G, dt) {
  if (!actx || MUTE || HEADLESS) return;
  if (!AM.on) { AM.on = true; AM.sea = bed(420, 0.5, 0.05, 0.1, 'lowpass'); AM.wind = bed(800, 1.2, 0.015, 0.25, 'bandpass'); AM.rain = bed(5000, 0.5, 0, 0.3, 'highpass'); }
  const S = W3 && W3.S; AM.rain && AM.rain.set((S ? S.rain : 0) * 0.025, 1); AM.wind && AM.wind.set(0.015 + (S ? S.storm : 0) * 0.02, 1);
  if (!G) return;
  if (G.ph === 'chase') { AM.oar -= dt; if (AM.oar <= 0) { AM.oar = 2.2; tone(240 * vary(0.1), 0.06, 0.05, 'triangle', 0, 180, 1500); noise(0.3, 900, 0.03, 'lowpass', 0.8, 0.15); } }
  if (G.ph === 'ride') { AM.creak -= dt; if (AM.creak <= 0) { AM.creak = 0.5 - G.T * 0.3; if (G.T > 0.3) tone(150 + G.T * 260, 0.12, 0.02 + G.T * 0.03, 'sawtooth', 0, 140 + G.T * 220, 1200); } }
}
