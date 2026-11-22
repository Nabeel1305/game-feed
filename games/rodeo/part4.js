// ===================== SOUND: the arena (PLAYBOOK S1-S11) =====================
// A snort before every move (the tell you can hear), the clang of the chute gate, the thud of hooves on each buck, the bull's
// cowbell, the buzzer at eight seconds and the crowd's roar, a heavy thump in the dirt when you are thrown, and a twangy
// pluck of a guitar for a good ride.
const sfx = {
  snort(v = 1) { noise(0.25, 500, 0.09 * v, 'bandpass', 1.2); noise(0.18, 260, 0.06 * v, 'lowpass', 1, 0.05); },
  gate() { tone(320, 0.3, 0.07, 'square', 0, 300, 1400); noise(0.15, 1800, 0.06, 'bandpass', 2); },
  buck(hard) { tone(hard ? 70 : 90, 0.2, hard ? 0.2 : 0.15, 'sine', 0, 45); noise(0.12, 400, 0.08, 'lowpass', 1); if (gate('bell', 120)) sfx.bell(0.6); },
  bell(v = 1) { tone(820, 0.25, 0.03 * v, 'square', 0, 800, 2200); tone(1230, 0.2, 0.02 * v, 'triangle', 0.01); },
  thud() { tone(60, 0.35, 0.22, 'sine', 0, 35); noise(0.4, 300, 0.12, 'lowpass', 0.8); },
  horn() { [220, 277, 330].forEach(f => tone(f, 0.9, 0.05, 'square', 0, f, 1800)); },
  cheer() { duck(0.3, 400); for (let i = 0; i < 26; i++) noise(0.4 + Math.random() * 0.5, 700 + Math.random() * 1600, 0.018, 'bandpass', 1.5, i * 0.03); for (let i = 0; i < 4; i++) tone(1800 + Math.random() * 600, 0.15, 0.015, 'sine', 0.2 + i * 0.12, 2600); },
  click() { tone(620, 0.05, 0.07, 'triangle', 0, 820); },
  tick() { if (!gate('tick', 60)) return; tone(1300 * vary(0.05), 0.025, 0.04, 'square', 0, null, 3000); },
  combo(n = 1) { pluck(note(196, Math.min(9, n + 2)), 0.5, 0.12); pluck(note(196, Math.min(11, n + 4)), 0.5, 0.08, 0.06); },
  no() { if (!gate('no', 300)) return; tone(260, 0.14, 0.06, 'triangle', 0, 200, 900); },
  ding() { tone(988, 0.5, 0.1, 'sine'); tone(1480, 0.35, 0.04, 'sine', 0.02); },
  coin(i = 0) { if (!gate('coin', 60)) return; const b = note(784, Math.min(10, i + 1)); tone(b, 0.18, 0.08, 'triangle'); tone(b * 2, 0.12, 0.03, 'sine', 0.01); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.12, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.12); },
  win() { [0, 4, 7, 12].forEach((q, j) => pluck(note(196, q), 1.0, 0.14, j * 0.09)); },
  groan() { for (let i = 0; i < 10; i++) noise(0.6 + Math.random() * 0.3, 380 + Math.random() * 300, 0.016, 'bandpass', 2, i * 0.04); },
  lose() { tone(330, 0.5, 0.1, 'triangle', 0, 247); tone(247, 0.7, 0.1, 'triangle', 0.25, 196); },
};
const AM = { on: false };
function soundStep(G, dt) {
  if (HEADLESS || !actx) return; if (!AM.on) { AM.on = true; AM.crowd = bed(650, 0.5, 0.022, 0.3, 'bandpass'); AM.low = bed(200, 0.6, 0.015, 0.2, 'lowpass'); }
  const quiet = MUTE || paused || !G || G.over, tense = G && G.ph === 'ride'; if (AM.crowd) AM.crowd.set(quiet ? 0 : tense ? 0.03 : 0.018, 0.4); if (AM.low) AM.low.set(quiet ? 0 : 0.015, 0.5);
}
// the band (tools/juice-kit.js): this game's music
bandStyle('western', { seed: 33, key: 1, bpm: 106 });
