
// ===================== SOUND: ball, rim, net, crowd (PLAYBOOK S1-S11) =====================
// The ball leaving the hand (a soft whoosh, higher for a harder shot), the clang of the rim (duller each touch), the thud of
// the board, real bounces on the floor, the crisp "swish" of the net, sneaker squeaks between spots; the crowd cheers louder
// with your streak and groans at a miss. Music (its own switch): a light, rhythmic beat with a bouncy bass.
const sfx = {
  click() { tone(880, 0.04, 0.05, 'triangle', 0, 1100); },
  shoot(p = 0.5) { noise(0.18, 900 + p * 1200, 0.05, 'bandpass', 1.2); },
  rim(n = 1) { if (!gate('rim', 70)) return; const f = n > 1 ? 0.8 : 1; tone(1240 * f, 0.35, 0.07, 'triangle'); tone(1870 * f, 0.25, 0.04, 'sine'); tone(310, 0.2, 0.05, 'sine'); },
  board() { tone(160, 0.12, 0.09, 'sine', 0, 110); noise(0.06, 1400, 0.05, 'bandpass', 1.5); },
  bounce(v = 3) { if (!gate('bnc', 60)) return; const a = Math.min(1, v / 5); tone(95 + a * 30, 0.14, 0.1 * a + 0.02, 'sine', 0, 70); noise(0.04, 600, 0.04 * a, 'lowpass', 1); },
  net(sw) { noise(sw ? 0.32 : 0.22, sw ? 5200 : 3800, sw ? 0.09 : 0.06, 'bandpass', 0.8); if (sw) noise(0.18, 8000, 0.04, 'highpass', 0.7, 0.05); },
  squeak() { tone(2400, 0.07, 0.03, 'sine', 0, 3100); tone(2900, 0.05, 0.02, 'sine', 0.08, 2200); },
  crowd(a = 0.3) { noise(0.6 + a, 1100, 0.04 + a * 0.08, 'bandpass', 0.5, 0, 0.08); if (a > 0.5) for (let i = 0; i < 4; i++) tone(1500 + Math.random() * 600, 0.12, 0.012, 'sine', i * 0.12); },
  aww() { noise(0.6, 500, 0.04, 'bandpass', 0.6, 0, 0.1); tone(300, 0.5, 0.02, 'sine', 0.05, 220); },
  coin(i = 0) { tone(note(784, Math.min(10, i + 4)), 0.18, 0.07, 'triangle'); tone(note(784, Math.min(14, i + 8)), 0.18, 0.05, 'triangle', 0.06); },
  combo(n = 1) { [0, 2, 4, 7].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  goal() { [0, 4, 7, 12, 16].forEach((q, j) => pluck(note(392, q), 0.9, 0.08, j * 0.09)); },
  no() { if (!gate('no', 250)) return; tone(200, 0.1, 0.05, 'triangle', 0, 160, 900); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.1, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.1); },
  win() { [0, 4, 7, 12].forEach((q, j) => pluck(note(523, q), 1.0, 0.08, j * 0.12)); },
  lose() { tone(392, 0.4, 0.06, 'triangle', 0, 349); tone(330, 0.7, 0.06, 'triangle', 0.3, 294); },
};
let mus = { t: 0, i: 0 }, amb = null;
const BASS = [0, -1, 0, 7, -1, 5, 3, -1, 0, -1, 0, 10, -1, 7, 5, 3];
function soundStep(G, dt) { if (!actx) return; if (!amb) amb = bed(800, 0.3, 0, 0.1);
  const home = $('ovHome') && !$('ovHome').classList.contains('hidden'), off = !G || paused || home || G.over, indoor = G && COURTS[placeOf(G.N)].indoor;
  if (amb) amb.set(off ? 0 : indoor ? 0.03 + Math.min(0.03, (G ? G.streak : 0) * 0.006) : 0.012, 0.6);
  if (MUTE || paused) return; mus.t += dt; const beat = 0.21; if (mus.t < beat) return; mus.t -= beat; const i = mus.i++, bar = Math.floor(i / 16) % 4, vol = home ? 1 : 0.65;
  music(() => { const n = BASS[i % 16]; if (n >= 0) tone(note(55, n + [0, 5, 3, 7][bar]), 0.18, 0.05 * vol, 'triangle', 0, null, 500);
    if (i % 4 === 0) tone(62, 0.16, 0.06 * vol, 'sine', 0, 42); if (i % 4 === 2) noise(0.06, 1900, 0.03 * vol, 'bandpass', 1.3); noise(0.02, 8000, 0.009 * vol, 'highpass', 0.7);
    if (i % 8 === 3) [0, 4, 7].forEach((q, j) => tone(note(330, q + [0, 5, 3, 7][bar]), 0.18, 0.012 * vol, 'sine', j * 0.02)); }); }
