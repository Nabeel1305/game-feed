
// ===================== SOUND: the music and the jumps (PLAYBOOK S1-S11) =====================
// The music is the course: a kick on every beat, a hat between, a bass line and a lead that change every eight beats,
// played from where the cube is (so after a crash it picks up from the flag, like the course does). The jump is a short
// blip that sits in the music; rings ding, pads boing, portals whoosh; a crash is a crunch and the music drops out.
const sfx = {
  click() { tone(880, 0.04, 0.05, 'triangle', 0, 1100); },
  start() { [0, 7, 12].forEach((q, j) => tone(note(330, q), 0.12, 0.06, 'square', j * 0.06, null, 2400)); },
  jump() { if (!gate('jump', 60)) return; tone(note(659, 7), 0.06, 0.03, 'square', 0, note(659, 12), 3000); },
  orb() { tone(note(880, 0), 0.25, 0.06, 'sine'); tone(note(880, 7), 0.25, 0.04, 'sine', 0.04); },
  pad() { tone(220, 0.25, 0.08, 'sine', 0, 660); },
  flip() { noise(0.3, 2500, 0.05, 'bandpass', 1.2); tone(300, 0.3, 0.05, 'triangle', 0, 900); },
  coin(i = 0) { [0, 4, 7, 12].forEach((q, j) => tone(note(988, q), 0.12, 0.05, 'triangle', j * 0.04)); },
  flag() { [0, 7].forEach((q, j) => tone(note(784, q), 0.15, 0.05, 'triangle', j * 0.06)); },
  crash() { noise(0.45, 1400, 0.14, 'lowpass', 0.8); tone(120, 0.4, 0.1, 'square', 0, 40, 900); },
  goal() { [0, 4, 7, 12, 16].forEach((q, j) => pluck(note(392, q), 0.9, 0.08, j * 0.09)); },
  no() { if (!gate('no', 250)) return; tone(200, 0.1, 0.05, 'triangle', 0, 160, 900); },
  tick() { if (!gate('tick', 45)) return; tone(1320, 0.05, 0.03, 'triangle'); },
  combo(n = 1) { [0, 2, 4].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.1, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.1); },
  win() { [0, 4, 7, 12].forEach((q, j) => pluck(note(523, q), 1.0, 0.08, j * 0.12)); },
  lose() { tone(392, 0.4, 0.06, 'triangle', 0, 349); tone(330, 0.7, 0.06, 'triangle', 0.3, 294); },
};
// the music, beat by beat, from the cube's place in the course (half beats for the hats)
const BASS = [[0, 0, 7, 0, 5, 5, 3, 3], [0, 0, 3, 5, 7, 7, 5, 3], [0, 12, 10, 7, 5, 7, 3, 0], [0, 0, 5, 5, 8, 8, 7, 7]];
let lastHalf = -1; function soundStep(G, dt) { if (!G || G.over || paused || G.dead || G.wait > 0 || MUTE) { if (G && (G.dead || G.wait > 0)) lastHalf = -1; return; }
  const half = Math.floor(G.x / G.beat * 2); if (half === lastHalf) return; const first = lastHalf < 0; lastHalf = half; if (first) return; const b = half >> 1, on = half % 2 === 0, bar = (b >> 3) % 4, root = [0, -4, 3, -2][(b >> 4) % 4];
  if (on) { tone(110, 0.14, 0.11, 'sine', 0, 45); FX.pulse = 1; tone(note(55, root + BASS[bar][b % 8]), 0.2, 0.05, 'sawtooth', 0, null, 500); if (b % 4 === 2) noise(0.12, 1800, 0.05, 'bandpass', 0.9); if (b % 8 === 0) [0, 7, 12].forEach(q => tone(note(220, root + q), 0.5, 0.012, 'triangle')); }
  else { noise(0.03, 8000, 0.02, 'highpass', 0.7); if ((half >> 1) % 2) tone(note(440, root + [0, 3, 7, 10, 12, 10, 7, 3][(b + bar) % 8]), 0.09, 0.02, 'square', 0, null, 2600); } }
