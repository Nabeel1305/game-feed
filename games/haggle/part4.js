// ===================== SOUND: the shop (PLAYBOOK S1-S11) =====================
// The bell over the door as someone comes in, the ratchet of the brass dial as you drag it, a till's cha-ching on a deal (a
// coin for each good buy at closing, climbing: S4), a "hmm" as they think, a huff when insulted, the door banging as they
// go, the hum of the UV lamp, the click of the loupe, and the stamp of the closing ledger.
const sfx = {
  click() { tone(880, 0.04, 0.05, 'triangle', 0, 1100); },
  tick() { if (!gate('tick', 30)) return; tone(1600, 0.012, 0.025, 'square', 0, 0, 3000); },
  bell() { [0, 0.18].forEach(d => { tone(1568, 0.6, 0.05, 'sine', d); tone(2350, 0.4, 0.02, 'sine', d); }); },
  deal() { tone(1046, 0.08, 0.06, 'square', 0, 0, 3000); noise(0.12, 4000, 0.04, 'highpass', 1, 0.05); [0, 4, 7].forEach((q, j) => tone(note(784, q), 0.25, 0.05, 'triangle', 0.1 + j * 0.06)); },
  hmm() { tone(180, 0.35, 0.05, 'sawtooth', 0, 210, 700); },
  huff() { noise(0.25, 900, 0.08, 'bandpass', 1); tone(260, 0.25, 0.06, 'sawtooth', 0, 160, 900); },
  door() { noise(0.12, 300, 0.1, 'lowpass', 1); tone(90, 0.2, 0.08, 'sine', 0, 60); tone(1568, 0.3, 0.02, 'sine', 0.05); },
  uv() { tone(120, 0.6, 0.03, 'sawtooth', 0, 120, 500); tone(1800, 0.5, 0.01, 'sine'); },
  loupe() { tone(2400, 0.03, 0.04, 'square', 0, 0, 4000); tone(1800, 0.03, 0.03, 'square', 0.06, 0, 4000); },
  stamp() { noise(0.08, 500, 0.12, 'lowpass', 1); tone(110, 0.15, 0.1, 'sine', 0, 70); },
  ding() { tone(note(784, 2), 0.3, 0.05, 'sine'); },
  coin(i = 0) { if (!gate('coin', 60)) return; const b = note(784, Math.min(10, i + 1)); tone(b, 0.18, 0.07, 'triangle'); tone(b * 2, 0.12, 0.03, 'sine', 0.01); },
  no() { if (!gate('no', 300)) return; tone(260, 0.14, 0.05, 'triangle', 0, 200, 900); },
  combo(n = 1) { [0, 2, 4].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.1, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.1); },
  win() { [0, 4, 7, 12].forEach((q, j) => pluck(note(392, q), 1.0, 0.09, j * 0.12)); },
  lose() { tone(294, 0.5, 0.08, 'triangle', 0, 262); tone(247, 0.8, 0.08, 'triangle', 0.3, 220); },
};
