// ===================== SOUND: the band (PLAYBOOK S1-S11) =====================
// The music is the game: a marching-band backing for each song, made on the spot from its tempo and seed (a kick on the beat,
// hi-hats, a bass line and brass stabs that move through four chords), scheduled a moment ahead so it stays on the beat. Your
// drums are yours: the left a tight snare crack, the right a deep tom, both together a crash. A miss is a dull thud (no buzz).
// The crowd roars at every ten in a row and goes wild in a FEVER; a whistle starts and ends the show.
const sfx = {
  click() { tone(880, 0.04, 0.06, 'triangle', 0, 1100); },
  drum(lane = 0, d = 0) { if (lane === 0) { noise(0.12, 2600, 0.16, 'bandpass', 0.9, d); tone(220, 0.06, 0.09, 'triangle', d, 160); } else { tone(110, 0.28, 0.2, 'sine', d, 62); noise(0.05, 500, 0.06, 'lowpass', 1, d); } },
  crash() { noise(0.8, 6000, 0.06, 'highpass', 0.7); },
  miss() { if (!gate('miss', 120)) return; tone(90, 0.12, 0.06, 'triangle', 0, 70); },
  cheer(a = 1) { noise(1.4, 1200, 0.05 * a + 0.02, 'bandpass', 0.5); noise(1.2, 2400, 0.03 * a, 'bandpass', 0.7, 0.1); },
  boo() { tone(140, 1.2, 0.05, 'sawtooth', 0, 110, 500); noise(1.2, 600, 0.04, 'lowpass', 1); },
  whistle() { tone(2400, 0.18, 0.05, 'sine', 0, 2500); tone(2400, 0.35, 0.05, 'sine', 0.22, 2350); },
  fever() { [0, 4, 7, 12].forEach((q, j) => tone(note(523, q), 0.2, 0.06, 'square', j * 0.05, null, 3000)); },
  no() { if (!gate('no', 300)) return; tone(260, 0.14, 0.05, 'triangle', 0, 200, 900); },
  ding() { tone(988, 0.5, 0.08, 'sine'); },
  coin(i = 0) { if (!gate('coin', 60)) return; tone(note(784, Math.min(10, i + 1)), 0.18, 0.06, 'triangle'); },
  combo(n = 1) { [0, 2, 4].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.1, 'square', 0, null, 3000); },
  pick() { tone(520, 0.06, 0.04, 'triangle'); },
};
// the backing band, a sixteenth at a time, scheduled 0.15 s ahead of the song's clock
const CHORDS = [[0, 4, 7], [5, 9, 12], [7, 11, 14], [3, 7, 10]];
function band(G) {
  if (!G.beat || G.lesson && !G.notes.length) return; const lead = G.lead || 0, q = G.beat / 4, key = 110 * Math.pow(2, (G.seed % 5) / 12);
  if (G.sched == null) G.sched = G.t; const until = G.t + 0.15;
  let i = Math.ceil((G.sched - lead) / q - 1e-6); for (; lead + i * q <= until; i++) { const ts = lead + i * q, d = ts - G.t; if (d < -0.01) continue; const dd = Math.max(0, d), bar = Math.floor(i / 16), s = ((i % 16) + 16) % 16, ch = CHORDS[((bar % 4) + 4) % 4];
    if (i < 0) { if (s % 4 === 0 && i >= -16) noise(0.03, 3500, 0.06, 'highpass', 1, dd); continue; }      // the count-in: sticks
    if (ts > G.len - 1.4) continue;
    if (s % 4 === 0) tone(60, 0.14, 0.13, 'sine', dd, 42);                                                // kick
    if (s % 2 === 0) noise(0.03, 8000, 0.018, 'highpass', 1, dd);                                         // hi-hat
    if (s % 4 === 0 || s === 10) tone(key / 2 * Math.pow(2, ch[(s / 4 | 0) % 3] / 12), q * 1.6, 0.07, 'triangle', dd);      // bass
    if (s === 0 || (s === 6 && bar % 2)) for (const n of ch) tone(key * 2 * Math.pow(2, n / 12), q * 2.2, 0.022, 'sawtooth', dd, null, 1800);      // brass stabs
    if (G.fever > 0 && s % 4 === 2) tone(key * 4 * Math.pow(2, ch[s % 3] / 12), q, 0.015, 'square', dd, null, 3000); }
  G.sched = until;
}
const AM = { on: false };
function soundStep(G, dt) {
  if (HEADLESS || !actx) return; if (!AM.on) { AM.on = true; AM.crowd = bed(900, 0.4, 0, 0.6, 'bandpass'); }
  const quiet = MUTE || paused || !G || G.over; if (AM.crowd) AM.crowd.set(quiet ? 0 : 0.006 + clamp(G.crowd, 0, 1) * 0.014 + (G.fever > 0 ? 0.02 : 0), 0.5);
  if (!quiet && G.wait <= 0 || (!quiet && !G.wait)) band(G);
}
