// ===================== SOUND: the field (PLAYBOOK S1-S11) =====================
// A soft engine hum that rises with your thrust; the laser's buzz while it cuts; a stony crunch when a rock cracks (deeper for
// big ones); a bright ping for each ore scooped, a step higher for each one in the hold (S4) so a full hold sounds full; a
// chiming count-up when you unload at the mothership; a two-tone warning before a meteor and a whoosh as it passes; a
// pirate's thin "pew"; a metal clang for a dent. Space is quiet: everything sits under a low drone.
const sfx = {
  click() { tone(880, 0.04, 0.05, 'triangle', 0, 1100); },
  go() { tone(330, 0.25, 0.06, 'sawtooth', 0, 660, 1400); tone(660, 0.3, 0.05, 'triangle', 0.18); },
  crack(size = 0) { noise(0.18 + size * 0.1, 900 - size * 250, 0.07 + size * 0.02, 'lowpass', 1); tone(160 - size * 30, 0.2, 0.06, 'triangle', 0, 70); },
  burst() { noise(0.12, 2600, 0.04, 'bandpass', 1.5); },
  scoop(n = 1, val = 1) { if (!gate('scoop', 40)) return; const b = note(659, Math.min(12, n - 1)); tone(b, 0.12, 0.06, 'triangle'); tone(b * (val >= 3 ? 2 : 1.5), 0.1, 0.03, 'sine', 0.03); },
  full() { tone(880, 0.1, 0.05, 'square', 0, 880, 1600); tone(660, 0.14, 0.05, 'square', 0.13, 660, 1600); },
  dock(n = 1) { for (let i = 0; i < Math.min(8, n); i++) tone(note(784, i), 0.12, 0.05, 'triangle', i * 0.06); pluck(note(392, 4), 0.8, 0.08, Math.min(8, n) * 0.06); },
  warn() { if (!gate('warn', 500)) return; tone(740, 0.09, 0.05, 'square', 0, 740, 1800); tone(554, 0.12, 0.05, 'square', 0.12, 554, 1800); },
  whoosh() { if (!gate('whoosh', 300)) return; noise(0.5, 1200, 0.05, 'bandpass', 0.7); },
  dodge() { if (!gate('dodge', 400)) return; tone(note(523, 4), 0.12, 0.04, 'sine'); },
  pew() { if (!gate('pew', 120)) return; tone(1400, 0.14, 0.035, 'sawtooth', 0, 500, 2400); },
  pirate() { tone(220, 0.3, 0.05, 'sawtooth', 0, 180, 900); tone(233, 0.3, 0.05, 'sawtooth', 0.05, 190, 900); },
  boom() { noise(0.6, 600, 0.12, 'lowpass', 0.8); tone(90, 0.5, 0.1, 'sine', 0, 40); },
  dent() { tone(320, 0.25, 0.08, 'square', 0, 180, 1200); noise(0.2, 1800, 0.06, 'bandpass', 2); tone(95, 0.3, 0.08, 'sine', 0, 60); },
  bump() { if (!gate('bump', 250)) return; tone(120, 0.12, 0.06, 'triangle', 0, 80); },
  no() { if (!gate('no', 300)) return; tone(260, 0.14, 0.06, 'triangle', 0, 200, 900); },
  coin(i = 0) { if (!gate('coin', 60)) return; const b = note(784, Math.min(10, i + 1)); tone(b, 0.18, 0.07, 'triangle'); tone(b * 2, 0.12, 0.03, 'sine', 0.01); },
  combo(n = 1) { [0, 2, 4].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.11, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.11); },
  win() { [0, 4, 7, 12, 16].forEach((q, j) => pluck(note(392, q), 1.0, 0.1, j * 0.09)); },
  lose() { tone(330, 0.5, 0.09, 'triangle', 0, 247); tone(247, 0.7, 0.09, 'triangle', 0.25, 165); },
};
const AM = { on: false };
function soundStep(G, dt) {
  if (HEADLESS || !actx) return; if (!AM.on) { AM.on = true; AM.drone = bed(70, 0.7, 0, 0.3, 'lowpass'); AM.eng = bed(220, 1.2, 0, 0.12, 'bandpass'); AM.las = bed(1700, 3, 0, 0.06, 'bandpass'); }
  const quiet = MUTE || paused || !G || G.over, st = G && G.stick ? Math.hypot(G.stick.x, G.stick.z) : 0;
  if (AM.drone) AM.drone.set(quiet ? 0 : 0.012, 0.5); if (AM.eng) AM.eng.set(quiet ? 0 : 0.004 + st * 0.02, 0.1); if (AM.las) AM.las.set(quiet || !G.beam ? 0 : 0.012, 0.05);
}
// the band (tools/juice-kit.js): this game's music
bandStyle('synth', { seed: 42, key: -3, bpm: 104, lead: { i: 'bell' }, comp: { i: 'pad', p: 'P' }, A: [0, 5, 0, 4], tune: ['0...4...7...9...', '5...7...9...7...', '4...6...8...6...'] });
