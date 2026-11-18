// ===================== SOUND: the alley (PLAYBOOK S1-S11) =====================
// Warm and woody: a low rumble while the ball rolls (louder the faster it goes), a dull thunk if it drops into the gutter, the
// clatter of pins (each pin its own short knock, so a strike is a big crash and one pin is a lone tock), a bright fanfare for
// a strike that climbs a step for every strike or spare in a row (S4), a two-note chime for a spare, a coin jingle for a
// golden pin. Soft and short: nothing shrill, every sound under the clip line.
const sfx = {
  click() { tone(880, 0.04, 0.06, 'triangle', 0, 1100); },
  go() { tone(523, 0.16, 0.07, 'triangle'); tone(784, 0.28, 0.06, 'triangle', 0.11); },
  release() { noise(0.12, 500, 0.06, 'lowpass', 1); tone(70, 0.14, 0.07, 'sine', 0, 55); },
  pin(v = 1, i = 0) { if (!gate('pin' + (i % 4), 22)) return; const f = 900 + Math.random() * 700; noise(0.07, f, 0.05 + Math.min(0.05, v * 0.01), 'bandpass', 3); tone(f * 0.55, 0.05, 0.035, 'triangle', 0, f * 0.35); },
  crash() { noise(0.45, 1400, 0.11, 'bandpass', 0.7); noise(0.25, 3000, 0.04, 'highpass', 1, 0.05); tone(120, 0.25, 0.07, 'sine', 0, 70); },
  gutter() { if (!gate('gutter', 400)) return; noise(0.3, 260, 0.09, 'lowpass', 1); tone(80, 0.3, 0.08, 'sine', 0, 50); },
  strike(n = 1) { const s = Math.min(8, n - 1); [0, 2, 4, 7].forEach((q, j) => pluck(note(392, q + s), 0.7, 0.1, j * 0.07)); tone(note(392, 9 + s), 0.6, 0.05, 'sine', 0.3); },
  spare(n = 1) { const s = Math.min(8, n - 1); pluck(note(523, s), 0.45, 0.1); pluck(note(523, s + 3), 0.6, 0.1, 0.1); },
  split() { tone(330, 0.2, 0.05, 'triangle', 0, 300); tone(311, 0.3, 0.05, 'triangle', 0.15); },
  open() { tone(392, 0.12, 0.05, 'triangle'); },
  gold() { [0, 2, 4].forEach((q, j) => tone(note(1046, q), 0.16, 0.05, 'sine', j * 0.05)); },
  no() { if (!gate('no', 300)) return; tone(260, 0.14, 0.06, 'triangle', 0, 200, 900); },
  coin(i = 0) { if (!gate('coin', 60)) return; const b = note(784, Math.min(10, i + 1)); tone(b, 0.18, 0.08, 'triangle'); tone(b * 2, 0.12, 0.03, 'sine', 0.01); },
  combo(n = 1) { [0, 2, 4].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.12, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.12); },
  win() { [0, 4, 7, 12, 16].forEach((q, j) => pluck(note(392, q), 1.0, 0.11, j * 0.09)); },
  lose() { tone(330, 0.5, 0.1, 'triangle', 0, 247); tone(247, 0.7, 0.1, 'triangle', 0.25, 196); },
};
const AM = { on: false };
function soundStep(G, dt) {
  if (HEADLESS || !actx) return; if (!AM.on) { AM.on = true; AM.roll = bed(140, 0.8, 0, 0.25, 'lowpass'); AM.crowd = bed(900, 0.5, 0, 0.15, 'bandpass'); }
  const quiet = MUTE || paused || !G || G.over, b = G && G.b, rolling = G && G.phase === 'roll' && b && !b.stopped;
  if (AM.roll) AM.roll.set(quiet || !rolling ? 0 : (b.gutter ? 0.03 : 0.05) * Math.min(1, Math.hypot(b.vx, b.vz) / 9), 0.08);
  if (AM.crowd) AM.crowd.set(quiet ? 0 : 0.004, 0.5);
}
