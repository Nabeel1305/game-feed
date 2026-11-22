
// ===================== SOUND: gentle (PLAYBOOK S1-S11) =====================
// A soft card turn for each round, a bright opening as the scene shows, a soft falling cue as it is covered (the look is
// over), a tick for each choice, a soft wooden drop when a thing is put back; each thing in a sequence has its own note
// (pentatonic, so any order sounds kind); right answers climb with the level's run. Music (its own switch): slow music-box
// arpeggios, quieter while you look and answer.
const BOXNOTES = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
const sfx = {
  click() { tone(880, 0.04, 0.05, 'triangle', 0, 1100); },
  card() { noise(0.08, 2400, 0.04, 'bandpass', 1.2); tone(520, 0.08, 0.03, 'triangle', 0.02, 660); },
  open() { tone(784, 0.18, 0.05, 'sine'); tone(1175, 0.22, 0.03, 'sine', 0.05); },
  cover() { tone(659, 0.3, 0.06, 'sine', 0, 440); noise(0.18, 900, 0.03, 'lowpass', 1); },
  ask() { tone(587, 0.12, 0.05, 'triangle'); tone(880, 0.14, 0.04, 'triangle', 0.08); },
  note(i = 0, bad) { if (bad) { tone(196, 0.3, 0.07, 'triangle', 0, 165); return; } pluck(note(392, BOXNOTES[i % BOXNOTES.length]), 0.7, 0.12); },
  pick() { tone(1046, 0.05, 0.05, 'triangle', 0, 1318); },
  unpick() { tone(784, 0.05, 0.04, 'triangle', 0, 659); },
  drop() { tone(330, 0.08, 0.07, 'sine', 0, 262); noise(0.04, 1200, 0.03, 'bandpass', 2); },
  right(n = 1) { [0, 4, 7, 12].forEach((q, j) => pluck(note(523, q + Math.min(7, n)), 0.6, 0.08, j * 0.07)); },
  half() { pluck(note(440, 0), 0.5, 0.08); pluck(note(440, 4), 0.5, 0.07, 0.1); },
  wrong() { tone(311, 0.25, 0.05, 'triangle', 0, 262); },
  coin(i = 0) { tone(note(1046.5, Math.min(12, i)), 0.15, 0.08, 'square', 0, null, 3000); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.1, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.1); },
  win() { [0, 4, 7, 12, 16].forEach((q, j) => pluck(note(523, q), 1.0, 0.08, j * 0.1)); },
  lose() { tone(392, 0.4, 0.05, 'triangle', 0, 349); tone(330, 0.7, 0.05, 'triangle', 0.3, 294); },
};
let mus = { t: 0, i: 0 };
const BOX = [0, 4, 7, 12, 7, 4, 0, -1, 2, 5, 9, 14, 9, 5, 2, -1];
function soundStep(G, dt) { if (!actx || MUTE || paused) return; mus.t += dt; const beat = 0.42; if (mus.t < beat) return; mus.t -= beat;
  const i = mus.i++, busy = G && G.round && (G.round.phase === 'show' || G.round.phase === 'ask'), vol = busy ? 0.4 : 1, n = BOX[i % 16], ch = [0, -3, -5, -1][Math.floor(i / 16) % 4];
  music(() => { if (n >= 0) tone(note(523, n + ch), 0.6, 0.022 * vol, 'sine', 0, null, 3000); if (i % 8 === 0) tone(note(131, ch), 1.2, 0.03 * vol, 'triangle', 0, null, 600); }); }
// the band (tools/juice-kit.js): this game's music
bandStyle('calm', { seed: 88, key: 3, bpm: 72 });
