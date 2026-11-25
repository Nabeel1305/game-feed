// ===================== SOUND: paper (PLAYBOOK S1-S11) =====================
// Soft and papery. The paper slides on the table as you lift a flap; a crease is a crisp double snap (the thumbnail running
// along the fold), brighter for a neat fold and with a little bell for a PERFECT one that climbs a note each perfect in a row
// (S4). A crumple is a dry scrunch; a tear a long rip. The finished animal gets a little koto-like run.
const sfx = {
  click() { tone(880, 0.04, 0.05, 'triangle', 0, 1100); },
  paper() { noise(0.25, 2500, 0.03, 'bandpass', 0.7, 0, 0.05); },
  lift() { if (!gate('lift', 300)) return; noise(0.15, 3000, 0.02, 'bandpass', 0.8, 0, 0.04); },
  crease(g = 1) { noise(0.03, 4500, 0.06, 'highpass', 1); noise(0.03, 3800, 0.05, 'highpass', 1, 0.05); if (g >= 1) tone(g === 2 ? 1320 : 990, 0.12, 0.04, 'sine', 0.04);
    if (g === 2) { sfx.run = (sfx.run || 0) + 1; pluck(note(523, Math.min(12, sfx.run)), 0.8, 0.07, 0.06); } else sfx.run = 0; },
  crumple() { for (let i = 0; i < 6; i++) noise(0.05, 1500 + i * 300, 0.04, 'bandpass', 1, i * 0.04); sfx.run = 0; },
  tear() { noise(0.6, 2200, 0.08, 'bandpass', 0.6, 0, 0.02); },
  alive() { [0, 2, 4, 7, 9].forEach((q, j) => pluck(note(392, q + 5), 0.9, 0.08, j * 0.09)); },
  no() { if (!gate('no', 250)) return; tone(200, 0.1, 0.05, 'triangle', 0, 160, 900); },
  coin(i = 0) { tone(note(784, Math.min(10, i + 1)), 0.18, 0.07, 'triangle'); },
  combo(n = 1) { [0, 2, 4].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.1, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.1); },
  win() { [0, 4, 7, 12].forEach((q, j) => pluck(note(392, q), 1.0, 0.09, j * 0.12)); },
  lose() { tone(294, 0.5, 0.08, 'triangle', 0, 262); tone(247, 0.8, 0.08, 'triangle', 0.3, 220); },
};
// the band (tools/juice-kit.js): this game's music
bandStyle('east', { seed: 59, key: -2, bpm: 78, lead: { i: 'harp' }, comp: { i: 'koto' }, A: [0, 3, 0, 4], tune: ['0...2...4...2...', '3...4...3...2...', '1...2...1...0...'], sc: 'maj', pen: 1, d: { i: '........x.......' } });
