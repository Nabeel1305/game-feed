
// ===================== SOUND: the siege (PLAYBOOK S1-S11) =====================
// Stone set on stone when a tower goes up; a bowstring's twang and the arrow's hiss; the catapult's creak and the thud of its
// stone; the mage's shimmering bolt; frost crackling; a coin's clink for every foe that falls (a note higher with each fall
// in a quick run); war horns for a wave, the gate's boom when it is struck; the meteor's roar; a fanfare when the siege lifts.
const sfx = {
  build() { tone(160, 0.12, 0.2, 'sine', 0, 90); noise(0.1, 700, 0.14, 'lowpass', 1); tone(330, 0.1, 0.05, 'triangle', 0.1, 495); },
  upgrade(lv = 1) { [0, 4, 7].forEach((q, j) => tone(note(392, q + lv * 2), 0.18, 0.07, 'triangle', j * 0.06)); noise(0.08, 3000, 0.04, 'highpass', 1, 0.15); },
  sell() { tone(700, 0.08, 0.06, 'triangle', 0, 520); tone(520, 0.12, 0.05, 'triangle', 0.08, 390); },
  poor() { if (!gate('poor', 300)) return; tone(220, 0.16, 0.07, 'triangle', 0, 180, 900); },
  twang() { if (!gate('twang', 70)) return; tone(330 * vary(0.06), 0.09, 0.05, 'triangle', 0, 260, 2400); noise(0.08, 4200, 0.025, 'highpass', 1, 0.02); },
  creak() { if (!gate('creak', 200)) return; noise(0.2, 400, 0.06, 'bandpass', 3); tone(70, 0.18, 0.08, 'sine', 0.05, 50); },
  thud() { if (!gate('thud', 90)) return; tone(80 * vary(0.08), 0.22, 0.22, 'sine', 0, 45); noise(0.18, 600, 0.12, 'lowpass', 0.8); },
  zap() { if (!gate('zap', 90)) return; const b = 880 * vary(0.06); tone(b, 0.18, 0.04, 'sine', 0, b * 1.6); tone(b * 1.5, 0.14, 0.025, 'triangle', 0.03, b * 2.2); },
  frost() { if (!gate('frost', 500)) return; noise(0.3, 5200, 0.02, 'highpass', 2); },
  fall(n = 0) { if (!gate('fall', 35)) return; const b = note(659, Math.min(12, n)); tone(b, 0.12, 0.06, 'triangle'); tone(b * 2, 0.08, 0.02, 'sine', 0.02); },
  boss() { tone(110, 1.2, 0.2, 'sawtooth', 0, 82, 700); tone(165, 1.2, 0.12, 'sawtooth', 0.05, 123, 700); noise(1.0, 300, 0.12, 'lowpass', 0.7); },
  roar() { tone(140, 0.9, 0.16, 'sawtooth', 0, 70, 900); noise(0.8, 500, 0.18, 'bandpass', 0.6); },
  horn() { tone(196, 0.9, 0.09, 'sawtooth', 0, null, 900); tone(294, 0.8, 0.06, 'sawtooth', 0.12, null, 900); },
  gate() { tone(60, 0.35, 0.3, 'sine', 0, 38); noise(0.3, 400, 0.22, 'lowpass', 0.7); },
  meteor() { noise(0.9, 800, 0.12, 'bandpass', 0.5, 0, 0.6); tone(300, 0.8, 0.05, 'sawtooth', 0, 90, 1200); },
  boom() { tone(55, 0.6, 0.35, 'sine', 0, 30); noise(0.7, 900, 0.3, 'lowpass', 0.6); for (let i = 0; i < 5; i++) noise(0.06, 2000 + i * 400, 0.05, 'bandpass', 2, 0.1 + i * 0.07); },
  heal() { if (!gate('heal', 500)) return; tone(523, 0.3, 0.03, 'sine', 0, 784); },
  early() { [0, 4, 7, 12].forEach((q, j) => tone(note(523, q), 0.12, 0.06, 'square', j * 0.05, null, 2600)); },
  click() { tone(620, 0.05, 0.07, 'triangle', 0, 820); },
  tick() { if (!gate('tick', 60)) return; tone(1300 * vary(0.05), 0.025, 0.04, 'square', 0, null, 3000); },
  combo(n = 1) { [0, 2, 4].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  no() { if (!gate('no', 300)) return; tone(260, 0.14, 0.06, 'triangle', 0, 200, 900); },
  ding() { tone(988, 0.5, 0.1, 'sine'); tone(1480, 0.35, 0.04, 'sine', 0.02); },
  coin(i = 0) { const b = note(784, Math.min(10, i + 1)); tone(b, 0.18, 0.1, 'triangle'); tone(b * 2, 0.12, 0.03, 'sine', 0.01); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.12, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.12); },
  thunder() { noise(1.6, 220, 0.3, 'lowpass', 0.6, 0, 0.1); },
  win() { [0, 4, 7, 12, 16].forEach((q, j) => tone(note(392, q), 0.4, 0.1, 'sawtooth', j * 0.11, null, 1600)); [0, 7, 12].forEach((q, j) => pluck(note(196, q), 1.2, 0.1, 0.55 + j * 0.1)); },
  lose() { tone(196, 0.6, 0.12, 'sawtooth', 0, 147, 800); tone(147, 0.9, 0.12, 'sawtooth', 0.4, 98, 700); sfx.gate(); },
};
// the world under it all: wind over the valley, the army's tramp when foes march, rain when it rains
let tramp = 0;
function soundStep(G, dt) {
  if (!G || G.over || HEADLESS || MUTE || paused) return; tramp -= dt;
  if (tramp <= 0 && G.foes.length) { tramp = 0.5; const n = Math.min(1, G.foes.length / 12); noise(0.08, 220, 0.03 + n * 0.05, 'lowpass', 1); }
}
// the band (tools/juice-kit.js): this game's music
bandStyle('epic', { seed: 25, key: 3, bpm: 88 });
