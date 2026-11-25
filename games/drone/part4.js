// ===================== SOUND: the drone (PLAYBOOK S1-S11) =====================
// The props' buzz rises and falls with the sticks (a whine over a hum); wind and rain over the park; a bright two-note chime
// through each hoop, a step higher with each in a row; a crack and a clatter on a crash; the clock ticks under five seconds.
const sfx = {
  click() { tone(660, 0.05, 0.08, 'triangle', 0, 880); },
  tick() { if (!gate('tick', 60)) return; tone(1200 * vary(0.05), 0.03, 0.05, 'square'); },
  ding() { tone(988, 0.5, 0.1, 'sine'); tone(1480, 0.35, 0.04, 'sine', 0.02); },
  coin(i = 0) { const b = note(784, Math.min(10, i + 1)); tone(b, 0.18, 0.09, 'triangle'); tone(b * 2, 0.12, 0.03, 'sine', 0.01); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.12, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.12); },
  hoop(n = 1) { const b = note(659, Math.min(10, n)); tone(b, 0.16, 0.08, 'triangle'); tone(b * 1.5, 0.22, 0.06, 'triangle', 0.07); noise(0.25, 5000, 0.03, 'highpass', 0.7); },
  crash() { noise(0.35, 2400, 0.16, 'bandpass', 0.9); tone(130, 0.3, 0.12, 'sawtooth', 0, 60, 900); for (let i = 0; i < 4; i++) tone(900 + Math.random() * 1500, 0.04, 0.04, 'square', 0.08 + i * 0.06, null, 4000); },
  thunder() { noise(2.8, 140, 0.3, 'lowpass', 0.7, 0, 0.08); },
  win() { [0, 4, 7, 12, 16].forEach((s, j) => pluck(note(262, s), 1.2, 0.13, j * 0.09)); },
  lose() { tone(294, 0.6, 0.1, 'triangle', 0, 262); tone(220, 0.9, 0.1, 'triangle', 0.3, 196); },
};
const AM = { on: false, tick: 0 };
function soundStep(G, dt) {
  if (!actx || MUTE || HEADLESS) return;
  if (!AM.on) { AM.on = true; AM.hum = bed(180, 4, 0.02, 0.02, 'bandpass'); AM.whine = bed(900, 6, 0.008, 0.02, 'bandpass'); AM.wind = bed(600, 0.8, 0.01, 0.2, 'lowpass'); AM.rain = bed(5000, 0.5, 0, 0.3, 'highpass'); }
  if (!G) return; const I = G.in, p = Math.min(1, Math.abs(I.pitch) + Math.abs(I.roll) * 0.6 + Math.max(0, I.thr) * 0.8);
  AM.hum && AM.hum.set(0.02 + p * 0.03, 0.1); AM.whine && AM.whine.set(0.006 + p * 0.018, 0.1); AM.wind && AM.wind.set(0.01 + (G.cfg.wind || 0) * 0.008, 1); AM.rain && AM.rain.set((W3 && W3.S ? W3.S.rain : 0) * 0.025, 1);
  if (!G.lesson && G.clock < 5 && G.clock > 0) { AM.tick -= dt; if (AM.tick <= 0) { AM.tick = 1; sfx.tick(); } }
}
// the band (tools/juice-kit.js): this game's music
bandStyle('synth', { seed: 21, key: -3, bpm: 112, lead: { i: 'square' }, comp: { i: 'pad', p: 'P' }, A: [0, 5, 0, 4], tune: ['4...7...4...2...', '5...9...7...5...', '4...8...6...4...'], sc: 'maj' });
