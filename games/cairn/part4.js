// ===================== SOUND: the lake (PLAYBOOK S1-S11) =====================
// Quiet and close: water lapping at the boulder, a bird now and then (crickets at night). Stone on stone is a soft, woody "tock",
// lower for big stones and a little higher with every stone up the cairn; a perfect drop adds a bell from a pentatonic scale that
// climbs with each perfect in a row (S4). A creak when the stack rocks, a rumble and a plop for each stone that rolls into the
// lake, the hush of a breeze crossing the water. Nothing harsh: this is the calm one.
const PENT5 = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
const sfx = {
  click(n = 0) { const b = 180 + Math.min(14, n) * 9; tone(b * vary(0.04), 0.09, 0.12, 'triangle', 0, b * 0.7); noise(0.04, 1400 + n * 40, 0.05, 'bandpass', 2.5); },
  go() { tone(note(392, 7), 0.9, 0.05, 'sine'); tone(note(392, 12), 0.9, 0.03, 'sine', 0.15); },
  drop() { noise(0.12, 800, 0.015, 'bandpass', 1); },
  pick() { tone(520, 0.06, 0.04, 'triangle', 0, 640); noise(0.03, 2000, 0.02, 'bandpass', 2); },
  perfect(n = 1) { const q = Math.min(9, n - 1); tone(note(523, q), 1.1, 0.08, 'sine'); tone(note(523, q + 5), 0.8, 0.025, 'sine', 0.01); },
  found() { [0, 4, 7, 12].forEach((q, j) => tone(note(587, q), 0.7, 0.05, 'sine', j * 0.12)); },
  creak() { if (!gate('creak', 600)) return; tone(110, 0.5, 0.05, 'sawtooth', 0, 95, 420); },
  slipOff() { noise(0.2, 600, 0.06, 'lowpass', 1); },
  tumble(n = 1) { for (let i = 0; i < Math.min(5, n); i++) { tone(140 - i * 8, 0.08, 0.08, 'triangle', i * 0.13, 100); noise(0.06, 900, 0.04, 'bandpass', 2, i * 0.13); } },
  splash() { if (!gate('splash', 120)) return; noise(0.35, 1100, 0.07, 'bandpass', 0.8); tone(300, 0.15, 0.03, 'sine', 0.02, 700); },
  breeze() { noise(3.2, 500, 0.035, 'bandpass', 0.6); },
  no() { if (!gate('no', 300)) return; tone(260, 0.14, 0.05, 'triangle', 0, 220, 900); },
  ding() { tone(988, 0.5, 0.08, 'sine'); },
  coin(i = 0) { if (!gate('coin', 60)) return; tone(note(784, Math.min(10, i + 1)), 0.18, 0.06, 'triangle'); },
  combo(n = 1) { [0, 4, 7].forEach((q, j) => tone(note(523, q), 0.4, 0.05, 'sine', j * 0.08)); },
  star(i = 0) { tone(note(659, i * 2), 0.8, 0.09, 'sine'); },
  win() { [0, 4, 7, 12, 16].forEach((q, j) => tone(note(392, q), 1.6, 0.07, 'sine', j * 0.14)); },
  lose() { tone(392, 0.9, 0.06, 'sine', 0, 330); tone(330, 1.2, 0.05, 'sine', 0.35, 294); },
};
const AM = { on: false }; let birdT = 3;
function soundStep(G, dt) {
  if (HEADLESS || !actx) return; if (!AM.on) { AM.on = true; AM.lap = bed(420, 0.7, 0, 0.6, 'lowpass'); AM.air = bed(1600, 0.5, 0, 0.3, 'bandpass'); }
  const quiet = MUTE || paused || !G || G.over; if (AM.lap) AM.lap.set(quiet ? 0 : 0.014 + 0.006 * Math.sin(performance.now() / 900), 0.5); if (AM.air) AM.air.set(!quiet && G && G.gust ? 0.012 : 0, 0.6);
  if (quiet) return; birdT -= dt; if (birdT <= 0) { birdT = 4 + Math.random() * 7; if (G.sky === 'night') { for (let i = 0; i < 3; i++) tone(4200, 0.03, 0.006, 'sine', i * 0.07); } else { const b = 1900 + Math.random() * 700; tone(b, 0.12, 0.008, 'sine', 0, b * 1.3); tone(b * 1.2, 0.18, 0.006, 'sine', 0.16, b * 0.9); } }
}
