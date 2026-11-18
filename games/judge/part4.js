// ===================== SOUND: the court (PLAYBOOK S1-S11) =====================
// Wood and paper: the rustle of a new case file, the gavel's double knock (a deep wooden thud), the gallery's murmur that
// answers each sentence (a warm hum of approval, a sharp intake of breath, a low boo), the council's three-chord seal, and
// "All rise" as a low organ chord at the start of a session. Quiet room tone under it all.
const sfx = {
  click() { tone(880, 0.04, 0.05, 'triangle', 0, 1100); },
  tick() { tone(1200, 0.02, 0.03, 'square', 0, 0, 2400); },
  paper() { noise(0.18, 3200, 0.04, 'highpass', 0.8); noise(0.12, 1800, 0.03, 'bandpass', 1, 0.08); },
  gavel() { tone(140, 0.12, 0.13, 'triangle', 0, 70); noise(0.05, 900, 0.09, 'lowpass', 1); tone(150, 0.1, 0.1, 'triangle', 0.16, 75); noise(0.04, 900, 0.07, 'lowpass', 1, 0.16); },
  gallery(kind = 'nod') { if (kind === 'nod') { noise(0.9, 500, 0.03, 'bandpass', 0.6); tone(220, 0.6, 0.012, 'sine', 0.1, 240); }
    else if (kind === 'gasp' || kind === 'horror') { noise(0.35, 2400, 0.05, 'bandpass', 0.8); noise(0.9, 700, 0.04, 'bandpass', 0.6, 0.2); }
    else if (kind === 'boo') { tone(150, 0.8, 0.04, 'sawtooth', 0, 120, 600); tone(158, 0.8, 0.03, 'sawtooth', 0.05, 125, 600); } else noise(0.7, 600, 0.025, 'bandpass', 0.5); },
  rise() { [0, 4, 7].forEach(q => tone(note(196, q), 1.2, 0.035, 'sine')); },
  council() { [[0, 4, 7], [2, 5, 9], [4, 7, 12]].forEach((c, j) => c.forEach(q => tone(note(262, q), 0.5, 0.025, 'triangle', j * 0.35))); },
  ding() { tone(note(784, 2), 0.3, 0.05, 'sine'); },
  coin(i = 0) { if (!gate('coin', 60)) return; const b = note(784, Math.min(10, i + 1)); tone(b, 0.18, 0.06, 'triangle'); tone(b * 2, 0.12, 0.025, 'sine', 0.01); },
  no() { if (!gate('no', 300)) return; tone(260, 0.14, 0.05, 'triangle', 0, 200, 900); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.1, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.1); },
  win() { [0, 4, 7, 12].forEach((q, j) => pluck(note(392, q), 1.0, 0.09, j * 0.12)); },
  lose() { tone(294, 0.5, 0.08, 'triangle', 0, 262); tone(247, 0.8, 0.08, 'triangle', 0.3, 220); },
};
function soundStep() {}
