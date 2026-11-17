// ===================== SOUND: the meadow (PLAYBOOK S1-S11) =====================
// Bright, soft and round: a rising shimmer while the ring closes, a whoosh in each type's colour (a crackle for fire, a splash
// for water, a rustle for leaves, a zap, a rumble of stone), a pop for a hit and a bright double chime for a critical, a glassy
// shield, a cheerful jingle when a critter is caught. Birdsong and a breeze behind it all.
const sfx = {
  charge() { tone(420, 0.5, 0.03, 'sine', 0, 900); tone(630, 0.5, 0.015, 'triangle', 0.05, 1350); },
  click() { tone(880, 0.04, 0.06, 'triangle', 0, 1100); },
  whoosh(type = 'fire', big) { const v = big ? 1.6 : 1; noise(0.25, { fire: 1400, water: 900, leaf: 2600, spark: 4200, stone: 300 }[type] || 1200, 0.05 * v, 'bandpass', 1.2);
    if (type === 'fire') for (let i = 0; i < 5; i++) noise(0.03, 3000, 0.03, 'highpass', 1, i * 0.04);
    if (type === 'spark') tone(1800, 0.12, 0.03, 'sawtooth', 0, 600, 4000); if (type === 'stone') tone(90, 0.3, 0.08 * v, 'sine', 0, 60); if (type === 'water') tone(500, 0.2, 0.04, 'sine', 0.05, 1200); },
  hit(e = 1, crit) { tone(e > 1 ? 330 : e < 1 ? 180 : 250, 0.15, 0.12, 'triangle', 0, 120); noise(0.08, 1600, 0.08, 'bandpass', 1.5); if (crit) { tone(1320, 0.18, 0.06, 'sine', 0.02); tone(1980, 0.25, 0.04, 'sine', 0.08); } if (e > 1) [0, 4, 7].forEach((q, j) => tone(note(523, q), 0.12, 0.04, 'triangle', 0.06 + j * 0.05)); },
  block() { tone(1200, 0.25, 0.05, 'sine', 0, 900); tone(1800, 0.3, 0.03, 'sine', 0.02, 1500); noise(0.05, 4000, 0.03, 'highpass'); },
  ouch(big) { tone(big ? 160 : 220, big ? 0.3 : 0.16, big ? 0.14 : 0.09, 'triangle', 0, 90); noise(big ? 0.2 : 0.08, 700, big ? 0.1 : 0.05, 'lowpass', 1); },
  shield() { tone(660, 0.3, 0.04, 'sine', 0, 990); tone(990, 0.3, 0.025, 'sine', 0.05, 1320); },
  pop() { tone(500, 0.08, 0.08, 'sine', 0, 1100); tone(1100, 0.06, 0.03, 'triangle', 0.04); },
  heal() { [0, 2, 4, 7].forEach((q, j) => tone(note(659, q), 0.18, 0.04, 'sine', j * 0.06)); },
  faint() { tone(523, 0.6, 0.07, 'triangle', 0, 196); tone(392, 0.5, 0.04, 'sine', 0.15, 147); },
  caught() { [0, 2, 4, 7, 9, 12].forEach((q, j) => pluck(note(523, q), 0.6, 0.1, j * 0.07)); tone(note(523, 12), 0.6, 0.05, 'sine', 0.45); },
  tick() { if (!gate('tick', 60)) return; tone(1300 * vary(0.05), 0.025, 0.04, 'square', 0, null, 3000); },
  combo(n = 1) { [0, 2, 4].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  no() { if (!gate('no', 300)) return; tone(260, 0.14, 0.06, 'triangle', 0, 200, 900); },
  ding() { tone(988, 0.5, 0.1, 'sine'); tone(1480, 0.35, 0.04, 'sine', 0.02); },
  coin(i = 0) { if (!gate('coin', 60)) return; const b = note(784, Math.min(10, i + 1)); tone(b, 0.18, 0.08, 'triangle'); tone(b * 2, 0.12, 0.03, 'sine', 0.01); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.12, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.12); },
  win() { [0, 4, 7, 12].forEach((q, j) => pluck(note(392, q), 1.0, 0.12, j * 0.1)); },
  lose() { tone(330, 0.5, 0.1, 'triangle', 0, 247); tone(247, 0.7, 0.1, 'triangle', 0.25, 196); },
};
const AM = { on: false }; let birdT = 2;
function soundStep(G, dt) {
  if (HEADLESS || !actx) return; if (!AM.on) { AM.on = true; AM.wind = bed(900, 0.8, 0.012, 0.15, 'bandpass'); AM.rain = bed(4800, 0.5, 0, 0.3, 'highpass'); }
  const quiet = MUTE || paused || !G || G.over; if (AM.wind) AM.wind.set(quiet ? 0 : 0.012, 0.6); if (AM.rain) AM.rain.set(!quiet && G && G.weather === 'rain' ? 0.02 : 0, 0.8);
  if (quiet) return; birdT -= dt; if (birdT <= 0) { birdT = 2.5 + Math.random() * 5; const b = 2300 + Math.random() * 900; tone(b, 0.07, 0.01, 'sine', 0, b * 1.25); tone(b * 1.1, 0.07, 0.008, 'sine', 0.09, b * 1.4); }
}
