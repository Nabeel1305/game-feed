// ===================== SOUND: the valley (PLAYBOOK S1-S11) =====================
// Insects and wind; your footsteps, heavy thuds that come quicker when you charge; the snap of your jaws and the crunch of a
// bite that lands (louder on a big one); your roar, a long falling growl; the squeal of fleeing prey; each warning its own sound
// (a rival's rising rumble, a hornface's snort and stamp, a club tail's creak); the clank of a bite on armour; a heavy hit when
// you are struck; a rumbling chord when you eat or beat a rival.
const sfx = {
  click() { tone(660, 0.05, 0.08, 'triangle', 0, 880); },
  coin(i = 0) { const b = note(784, Math.min(10, i + 1)); tone(b, 0.18, 0.09, 'triangle'); tone(b * 2, 0.12, 0.03, 'sine', 0.01); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.12, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.12); },
  snap() { noise(0.06, 2200, 0.1, 'bandpass', 2); tone(160, 0.08, 0.08, 'square', 0, 110, 1500); },
  crunch(big = false) { noise(big ? 0.28 : 0.18, 1400, 0.16, 'bandpass', 0.8); tone(90, 0.2, 0.12, 'sine', 0, 50); },
  roar(sz = 1) { if (!gate('roar', 400)) return; const s = typeof sz === 'number' ? sz : 1; noise(1.2 * s, 260, 0.16, 'lowpass', 1.2, 0, 0.05); tone(120, 1.1 * s, 0.1, 'sawtooth', 0, 55, 500); tone(180, 0.9 * s, 0.05, 'sawtooth', 0.05, 80, 700); },
  squeal() { if (!gate('squeal', 300)) return; tone(1200 * vary(0.1), 0.15, 0.05, 'triangle', 0, 1700, 3000); },
  warn(kind = 'rival') { if (kind === 'rival') { tone(70, 0.8, 0.12, 'sawtooth', 0, 140, 400); noise(0.8, 200, 0.06, 'lowpass', 1); } else if (kind === 'horns') { noise(0.25, 700, 0.08, 'bandpass', 1.5); for (let i = 0; i < 3; i++) tone(80, 0.08, 0.1, 'sine', 0.2 + i * 0.18, 50); } else { tone(300, 0.4, 0.05, 'triangle', 0, 180, 800); noise(0.3, 1500, 0.03, 'bandpass', 3); } },
  stomp() { for (let i = 0; i < 4; i++) tone(70 * vary(0.1), 0.12, 0.12, 'sine', i * 0.11, 45); },
  whoosh() { noise(0.35, 900, 0.08, 'bandpass', 0.8, 0, 0.05); },
  clank() { tone(1600, 0.15, 0.06, 'square', 0, 900, 3000); noise(0.08, 3000, 0.06, 'highpass', 1); },
  hurt() { tone(60, 0.35, 0.2, 'sine', 0, 35); noise(0.25, 600, 0.14, 'lowpass', 1); tone(260, 0.4, 0.05, 'sawtooth', 0.1, 120, 700); },
  eat() { noise(0.4, 500, 0.08, 'lowpass', 1); [0, 4, 7].forEach((q, j) => tone(note(196, q), 0.4, 0.06, 'triangle', 0.1 + j * 0.08)); },
  thunder() { noise(2.8, 140, 0.3, 'lowpass', 0.7, 0, 0.08); },
  win() { [0, 3, 7, 12, 15].forEach((s, j) => pluck(note(196, s), 1.2, 0.13, j * 0.1)); },
  lose() { tone(196, 0.6, 0.1, 'triangle', 0, 165); tone(147, 0.9, 0.1, 'triangle', 0.3, 130); },
};
const AM = { on: false, step: 0 };
function soundStep(G, dt) { if (!actx || MUTE || HEADLESS) return;
  if (!AM.on) { AM.on = true; AM.wind = bed(600, 0.8, 0.015, 0.2, 'bandpass'); AM.bugs = bed(5200, 6, 0.006, 3, 'bandpass'); }
  if (!G || G.over || paused) return; const m = G.me; if (m.v < 0.6) return;
  AM.step -= dt * (m.v / 6); if (AM.step <= 0) { AM.step = m.run ? 0.42 : 0.6; tone(55 * vary(0.08), 0.18, m.run ? 0.16 : 0.09, 'sine', 0, 35); noise(0.08, 400, m.run ? 0.05 : 0.03, 'lowpass', 1); if (m.run) FX.shake = Math.max(FX.shake, 3); } }
// the band (tools/juice-kit.js): this game's music
bandStyle('tense', { seed: 51, key: 0, bpm: 97 });
