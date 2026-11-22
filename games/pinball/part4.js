// ===================== SOUND: the arcade (PLAYBOOK S1-S11) =====================
// Electro-mechanical and bright: a solid clack for each flipper (left lower than right), a springy launch, a punchy pop for each
// bumper (three notes, a chord when they ring together), the thwack of a slingshot, a thud for a drop target, a ding climbing a
// scale for each lane, a rising whoosh and a jingle for the ramp, a fanfare for a mission, a siren for multiball. The ball rolls
// with a low rumble that follows its speed.
const sfx = {
  click() { tone(880, 0.04, 0.06, 'triangle', 0, 1100); },
  start() { [0, 2, 4, 7].forEach((q, j) => tone(note(392, q), 0.15, 0.06, 'square', j * 0.08, null, 2400)); },
  flip(side = -1) { noise(0.03, side < 0 ? 900 : 1200, 0.07, 'bandpass', 2); tone(side < 0 ? 140 : 170, 0.05, 0.08, 'square', 0, 90, 900); },
  launch() { noise(0.25, 700, 0.06, 'bandpass', 1); tone(220, 0.25, 0.05, 'triangle', 0, 660); },
  bumper(i = 0) { const b = [523, 659, 784][i % 3]; tone(b, 0.12, 0.1, 'square', 0, b * 0.9, 3000); noise(0.04, 2400, 0.05, 'bandpass', 2); },
  sling() { noise(0.05, 1600, 0.08, 'bandpass', 2.5); tone(300, 0.06, 0.06, 'square', 0, 200, 1800); },
  dropT() { tone(120, 0.12, 0.1, 'triangle', 0, 80); noise(0.05, 700, 0.06, 'lowpass', 1); },
  bank() { [0, 4, 7, 12].forEach((q, j) => tone(note(523, q), 0.12, 0.06, 'square', j * 0.06, null, 2600)); },
  lane(i = 0) { tone(note(784, i * 2), 0.25, 0.08, 'triangle'); },
  ramp() { tone(200, 0.5, 0.06, 'sawtooth', 0, 1400, 2400); [0, 4, 7].forEach((q, j) => tone(note(659, q), 0.18, 0.06, 'square', 0.4 + j * 0.07, null, 3000)); },
  rampMiss() { if (!gate('rmiss', 500)) return; tone(400, 0.25, 0.04, 'triangle', 0, 220); },
  orbit() { noise(0.4, 1500, 0.05, 'bandpass', 0.7); tone(330, 0.35, 0.04, 'sine', 0, 880); },
  prog(n = 1) { tone(note(659, Math.min(9, n)), 0.12, 0.05, 'square', 0, null, 2600); },
  mission() { [0, 4, 7, 12, 16].forEach((q, j) => tone(note(392, q), 0.25, 0.07, 'square', j * 0.09, null, 3000)); tone(note(392, 16), 0.6, 0.05, 'triangle', 0.5); },
  multi() { for (let i = 0; i < 6; i++) tone(i % 2 ? 880 : 660, 0.12, 0.06, 'square', i * 0.13, null, 2800); },
  saved() { tone(659, 0.15, 0.06, 'triangle'); tone(988, 0.25, 0.05, 'triangle', 0.12); },
  drain() { tone(330, 0.4, 0.08, 'triangle', 0, 165); tone(220, 0.6, 0.06, 'triangle', 0.2, 110); },
  over() { [7, 4, 2, 0].forEach((q, j) => tone(note(262, q), 0.3, 0.06, 'triangle', j * 0.18)); },
  no() { if (!gate('no', 300)) return; tone(260, 0.14, 0.05, 'triangle', 0, 200, 900); },
  ding() { tone(988, 0.5, 0.08, 'sine'); },
  coin(i = 0) { if (!gate('coin', 60)) return; tone(note(784, Math.min(10, i + 1)), 0.18, 0.06, 'triangle'); },
  combo(n = 1) { [0, 2, 4].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.1, 'square', 0, null, 3000); },
  pick() { tone(520, 0.06, 0.04, 'triangle'); },
  sizzle() { noise(0.6, 5000, 0.05, 'highpass', 1); tone(180, 0.4, 0.04, 'sawtooth', 0, 90, 700); },
};
const AM = { on: false };
function soundStep(G, dt) {
  if (HEADLESS || !actx) return; if (!AM.on) { AM.on = true; AM.roll = bed(180, 0.8, 0, 0.08, 'lowpass'); AM.hum = bed(60, 1, 0, 0.5, 'lowpass'); }
  const quiet = MUTE || paused || !G || G.over, b = G && G.balls.find(q => !q.lane), sp = b ? Math.hypot(b.vx, b.vy) : 0;
  if (AM.roll) AM.roll.set(quiet ? 0 : Math.min(1, sp / 20) * 0.05, 0.05); if (AM.hum) AM.hum.set(quiet ? 0 : 0.008, 0.5);
}
// the band (tools/juice-kit.js): this game's music
bandStyle('synth', { seed: 38, key: -2, bpm: 114 });
