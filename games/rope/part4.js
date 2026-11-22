// ===================== SOUND: the wire (PLAYBOOK S1-S11) =====================
// Wind all the time, louder high up and in a gust; a soft creak of the wire at each step; the crowd far below; when you tip
// too far the wire groans and a heartbeat starts, quicker the closer you are to falling (S6, tension), and a breath of relief
// when you pull back; birds' wings, the thud of a bag, a bright chime for a star (higher for each one: S4), a bell at a platform.
const sfx = {
  click() { tone(660, 0.05, 0.08, 'triangle', 0, 880); },
  coin(i = 0) { const b = note(784, Math.min(10, i + 1)); tone(b, 0.18, 0.09, 'triangle'); },
  step() { if (!gate('step', 200)) return; tone(220 * vary(0.06), 0.12, 0.025, 'triangle', 0, 180, 900); },
  gust() { noise(1.8, 500, 0.08, 'bandpass', 0.6, 0, 0.3); },
  flap() { for (let i = 0; i < 5; i++) noise(0.05, 1400, 0.05, 'bandpass', 2, i * 0.06); },
  thud() { tone(80, 0.25, 0.14, 'sine', 0, 50); noise(0.15, 500, 0.08, 'lowpass', 1); },
  whoosh() { noise(0.3, 1200, 0.04, 'bandpass', 1, 0, 0.05); },
  star(i = 1) { const b = note(1046, Math.min(10, (i | 0) * 2)); tone(b, 0.35, 0.06, 'sine'); tone(b * 1.5, 0.25, 0.03, 'sine', 0.05); },
  cp() { tone(note(784, 4), 0.3, 0.06, 'triangle'); tone(note(784, 7), 0.4, 0.06, 'triangle', 0.12); },
  creak() { if (!gate('creak', 600)) return; tone(140, 0.6, 0.06, 'sawtooth', 0, 95, 500); tone(70, 0.12, 0.12, 'sine', 0.15, 50); tone(70, 0.12, 0.1, 'sine', 0.45, 50); },
  phew() { noise(0.6, 900, 0.04, 'bandpass', 0.7, 0, 0.1); },
  fall() { noise(1.4, 700, 0.1, 'bandpass', 0.6, 0, 0.05); tone(600, 1.3, 0.06, 'sine', 0, 150); },
  crowd() { if (!gate('crowd', 1500)) return; noise(1.6, 1100, 0.04, 'bandpass', 0.5, 0, 0.3); },
  thunder() { noise(2.8, 140, 0.3, 'lowpass', 0.7, 0, 0.08); },
  star2(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.12, 'sine'); },
  win() { [0, 4, 7, 12].forEach((s, j) => pluck(note(392, s), 1.2, 0.13, j * 0.1)); },
  lose() { tone(294, 0.6, 0.1, 'triangle', 0, 262); tone(220, 0.9, 0.1, 'triangle', 0.3, 196); },
};
const AM = { on: false, beat: 0 };
function soundStep(G, dt) { if (!actx || MUTE || HEADLESS) return;
  if (!AM.on) { AM.on = true; AM.wind = bed(500, 0.7, 0.02, 0.18, 'bandpass'); }
  if (!G || G.over || paused) { AM.wind && AM.wind.set(0.01, 0.5); return; } AM.wind && AM.wind.set(0.018 + Math.abs(G.gust || 0) * 0.04, 0.3);
  const dz = Math.abs(G.me.th) / G.cfg.fall; if (dz > 0.5 && G.wait <= 0) { AM.beat -= dt; if (AM.beat <= 0) { AM.beat = 0.9 - dz * 0.55; tone(60, 0.1, 0.12 * dz, 'sine', 0, 45); tone(60, 0.1, 0.08 * dz, 'sine', 0.14, 45); } } }
// the band (tools/juice-kit.js): this game's music
bandStyle('tense', { seed: 52, key: -2, bpm: 101 });
