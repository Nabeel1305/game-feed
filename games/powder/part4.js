// ===================== SOUND: the mountain (PLAYBOOK S1-S11) =====================
// Crisp and airy: wind that rises with your speed, the scrape of an edge biting into a carve, a pop for each jump and a soft
// thump on landing, a bright ding at each gate that climbs a step for every gate in a row (S4), a rising ladder for a trick
// (more rungs for more spins), a crunch and a puff of snow in a fall, little glassy tinkles for the snowflakes.
const sfx = {
  click() { tone(880, 0.04, 0.06, 'triangle', 0, 1100); },
  go() { tone(660, 0.18, 0.08, 'triangle'); tone(990, 0.3, 0.06, 'triangle', 0.12); },
  gate(n = 1) { const b = note(659, Math.min(12, n - 1)); tone(b, 0.18, 0.08, 'triangle'); tone(b * 2, 0.12, 0.03, 'sine', 0.02); },
  miss() { if (!gate('miss', 300)) return; tone(220, 0.25, 0.08, 'square', 0, 160, 900); },
  ollie() { tone(180, 0.06, 0.1, 'triangle', 0, 260); noise(0.05, 1800, 0.05, 'bandpass', 1.5); },
  launch() { noise(0.4, 1200, 0.06, 'bandpass', 0.7); tone(220, 0.35, 0.04, 'sine', 0, 520); },
  trick(n = 1) { for (let i = 0; i <= n; i++) pluck(note(523, i * 4), 0.5, 0.1, i * 0.07); tone(note(523, n * 4 + 7), 0.5, 0.05, 'sine', n * 0.07 + 0.05); },
  land() { noise(0.12, 600, 0.08, 'lowpass', 1); tone(90, 0.12, 0.08, 'sine', 0, 60); },
  crash() { noise(0.35, 900, 0.14, 'lowpass', 0.8); tone(110, 0.3, 0.1, 'triangle', 0, 60); noise(0.5, 3000, 0.04, 'highpass', 1, 0.1); },
  ice() { if (!gate('ice', 800)) return; tone(2400, 0.2, 0.02, 'sine', 0, 3200); },
  flake(n = 1) { if (!gate('flake', 50)) return; const b = 1600 + (n % 5) * 180; tone(b, 0.12, 0.03, 'sine'); tone(b * 1.5, 0.1, 0.015, 'sine', 0.03); },
  no() { if (!gate('no', 300)) return; tone(260, 0.14, 0.06, 'triangle', 0, 200, 900); },
  ding() { tone(988, 0.5, 0.1, 'sine'); tone(1480, 0.35, 0.04, 'sine', 0.02); },
  coin(i = 0) { if (!gate('coin', 60)) return; const b = note(784, Math.min(10, i + 1)); tone(b, 0.18, 0.08, 'triangle'); tone(b * 2, 0.12, 0.03, 'sine', 0.01); },
  combo(n = 1) { [0, 2, 4].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.12, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.12); },
  win() { [0, 4, 7, 12, 16].forEach((q, j) => pluck(note(392, q), 1.0, 0.11, j * 0.09)); },
  lose() { tone(330, 0.5, 0.1, 'triangle', 0, 247); tone(247, 0.7, 0.1, 'triangle', 0.25, 196); },
};
const AM = { on: false };
function soundStep(G, dt) {
  if (HEADLESS || !actx) return; if (!AM.on) { AM.on = true; AM.wind = bed(700, 0.6, 0, 0.2, 'bandpass'); AM.edge = bed(2600, 1.2, 0, 0.08, 'bandpass'); }
  const quiet = MUTE || paused || !G || G.over, m = G && G.me;
  if (AM.wind) AM.wind.set(quiet ? 0 : 0.006 + Math.min(1, m.v / 18) * (m.air ? 0.035 : 0.025), 0.3);
  if (AM.edge) AM.edge.set(quiet || m.air || m.crashT > 0 ? 0 : clamp(Math.abs(G.lean) * m.v / 14, 0, 1) * 0.03, 0.08);
}
// the band (tools/juice-kit.js): this game's music
bandStyle('sport', { seed: 36, key: 2, bpm: 115 });
