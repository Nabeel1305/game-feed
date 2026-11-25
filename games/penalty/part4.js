// ===================== SOUND: the stadium (PLAYBOOK S1-S11) =====================
// The referee's whistle, the thump of the boot (deeper for a clean strike), the swish of the net, the clang of the post, the
// slap of gloves, a crowd that murmurs, holds its breath in the run-up, roars for a goal or a save and groans at a miss.
const sfx = {
  whistle() { tone(2400, 0.22, 0.05, 'sine', 0, 2300); tone(2410, 0.22, 0.04, 'square', 0, 2310, 3200); tone(2400, 0.4, 0.05, 'sine', 0.3, 2350); },
  kick(p = 1) { tone(140 + p * 30, 0.12, 0.16 * p + 0.04, 'sine', 0, 60); noise(0.05, 900, 0.07 * p + 0.02, 'lowpass', 1); },
  net() { noise(0.45, 2600, 0.07, 'bandpass', 0.7, 0.02); noise(0.3, 500, 0.05, 'lowpass', 1, 0.02); },
  post() { [1180, 1770, 2650].forEach((f, i) => tone(f, 0.9 - i * 0.2, 0.05 - i * 0.012, 'sine', 0, f * 0.995)); tone(220, 0.15, 0.08, 'triangle', 0, 140); },
  glove() { noise(0.06, 1400, 0.12, 'bandpass', 1.2); tone(180, 0.1, 0.1, 'sine', 0, 90); },
  dive() { if (!gate('dive', 200)) return; noise(0.22, 700, 0.04, 'bandpass', 0.8); },
  roar(n = 1) { duck(0.2, 300); for (let i = 0; i < 14 + n * 10; i++) noise(0.35 + Math.random() * 0.5, 600 + Math.random() * 1800, 0.012 + n * 0.006, 'bandpass', 1.5, i * 0.03); tone(note(392, 4), 0.4, 0.02 * n, 'triangle', 0.1); },
  groan(n = 1) { for (let i = 0; i < 10; i++) noise(0.6 + Math.random() * 0.3, 380 + Math.random() * 300, 0.016 * n, 'bandpass', 2, i * 0.04); tone(196, 0.7, 0.025 * n, 'sawtooth', 0.05, 150, 600); },
  click() { tone(620, 0.05, 0.07, 'triangle', 0, 820); },
  tick() { if (!gate('tick', 60)) return; tone(1300 * vary(0.05), 0.025, 0.04, 'square', 0, null, 3000); },
  combo(n = 1) { [0, 2, 4].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  no() { if (!gate('no', 300)) return; tone(260, 0.14, 0.06, 'triangle', 0, 200, 900); },
  ding() { tone(988, 0.5, 0.1, 'sine'); tone(1480, 0.35, 0.04, 'sine', 0.02); },
  coin(i = 0) { if (!gate('coin', 60)) return; const b = note(784, Math.min(10, i + 1)); tone(b, 0.18, 0.08, 'triangle'); tone(b * 2, 0.12, 0.03, 'sine', 0.01); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.12, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.12); },
  win() { [0, 4, 7, 12].forEach((q, j) => pluck(note(392, q), 1.0, 0.12, j * 0.1)); },
  lose() { tone(330, 0.5, 0.1, 'triangle', 0, 247); tone(247, 0.7, 0.1, 'triangle', 0.25, 196); },
};
// the crowd: a murmur that hushes as the kicker runs up and the needle swings, and the rain when it rains
const AM = { on: false };
function soundStep(G, dt) {
  if (HEADLESS || !actx) return; if (!AM.on) { AM.on = true; AM.crowd = bed(700, 0.5, 0.03, 0.25, 'bandpass'); AM.low = bed(240, 0.6, 0.02, 0.18, 'lowpass'); AM.rain = bed(4800, 0.5, 0, 0.3, 'highpass'); }
  const g = G || null, quiet = MUTE || paused || !g || g.over, tense = g && (g.ph === 'run' || g.ph === 'kickK' || g.ph === 'meter');
  const v = quiet ? 0 : tense ? 0.012 : 0.03; if (AM.crowd) AM.crowd.set(v, 0.3); if (AM.low) AM.low.set(quiet ? 0 : 0.02, 0.5); if (AM.rain) AM.rain.set(!quiet && g && g.weather === 'rain' ? 0.02 : 0, 0.8);
}
// the band (tools/juice-kit.js): this game's music
bandStyle('sport', { seed: 31, key: -2, bpm: 118, lead: { i: 'brass' }, comp: { i: 'brass' }, A: [0, 3, 0, 4], tune: ['0...0...4...0...', '3...3...5...3...', '4...4...6...8...'] });
