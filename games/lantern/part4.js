// ===================== SOUND: the house at night (PLAYBOOK S1-S11) =====================
// Creepy-fun, never nasty: the lantern's soft hiss; floorboards creaking as you walk; a rising whistle while a ghost is held
// in the beam (it climbs as the catch fills, so you hear how close you are) and a bright "fwump" and a bottle-cork pop when
// it is pulled in, a note higher for each one caught in a row (S4); a breathy "ooo" when a ghost comes out; furniture
// rattling when a room wakes; a heartbeat when one is close behind; a shriek-and-gasp for a scare. A clock ticks low.
const sfx = {
  click() { tone(880, 0.04, 0.05, 'triangle', 0, 1100); },
  go() { tone(220, 0.5, 0.05, 'sine', 0, 330); tone(277, 0.6, 0.04, 'sine', 0.2, 415); },
  catch(n = 1) { noise(0.2, 900, 0.06, 'lowpass', 1); tone(note(523, Math.min(10, n - 1)), 0.25, 0.08, 'triangle', 0.05); tone(note(523, Math.min(10, n - 1) + 4), 0.3, 0.05, 'sine', 0.12); },
  lit() { if (!gate('lit', 600)) return; tone(330, 0.2, 0.03, 'sine', 0, 520); },
  ooo() { if (!gate('ooo', 700)) return; tone(300, 0.7, 0.04, 'sine', 0, 220); tone(303, 0.7, 0.03, 'triangle', 0.03, 225); noise(0.6, 700, 0.02, 'bandpass', 1.2); },
  rattle() { for (let i = 0; i < 5; i++) noise(0.05, 500 + i * 60, 0.05, 'bandpass', 2, i * 0.07); },
  scare() { tone(1200, 0.25, 0.06, 'sawtooth', 0, 500, 2400); noise(0.4, 2000, 0.06, 'bandpass', 0.8, 0.05); tone(180, 0.5, 0.06, 'triangle', 0.2, 120); },
  oil() { tone(note(392, 2), 0.2, 0.06, 'triangle'); noise(0.25, 1400, 0.03, 'bandpass', 1, 0.05); tone(note(392, 4), 0.3, 0.05, 'sine', 0.12); },
  gold() { [0, 2, 4, 7].forEach((q, j) => tone(note(784, q), 0.14, 0.05, 'sine', j * 0.05)); },
  dark() { tone(200, 0.8, 0.07, 'triangle', 0, 90); },
  beat() { tone(60, 0.12, 0.08, 'sine', 0, 45); tone(58, 0.1, 0.06, 'sine', 0.16, 44); },
  no() { if (!gate('no', 300)) return; tone(260, 0.14, 0.06, 'triangle', 0, 200, 900); },
  coin(i = 0) { if (!gate('coin', 60)) return; const b = note(784, Math.min(10, i + 1)); tone(b, 0.18, 0.07, 'triangle'); tone(b * 2, 0.12, 0.03, 'sine', 0.01); },
  combo(n = 1) { [0, 2, 4].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.11, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.11); },
  win() { [0, 4, 7, 12, 16].forEach((q, j) => pluck(note(392, q), 1.0, 0.1, j * 0.09)); },
  lose() { tone(330, 0.5, 0.09, 'triangle', 0, 247); tone(247, 0.7, 0.09, 'triangle', 0.25, 165); },
};
const AM = { on: false, step: 0, beat: 0 };
function soundStep(G, dt) {
  if (HEADLESS || !actx) return; if (!AM.on) { AM.on = true; AM.hiss = bed(3000, 0.6, 0, 0.1, 'bandpass'); AM.whistle = bed(600, 6, 0, 0.05, 'bandpass'); AM.wind = bed(400, 0.5, 0, 0.3, 'bandpass'); }
  const quiet = MUTE || paused || !G || G.over, m = G && G.me;
  if (AM.hiss) AM.hiss.set(quiet || G.oil <= 0 ? 0 : 0.003, 0.3); if (AM.wind) AM.wind.set(quiet ? 0 : 0.006, 0.8);
  const held = !quiet && G.ghosts.reduce((a, g) => g.lit > 0.5 ? Math.max(a, g.cap) : a, 0); if (AM.whistle) { AM.whistle.set(held ? 0.012 + held * 0.02 : 0, 0.05); if (held && AM.whistle.f) AM.whistle.f.frequency.value = 500 + held * 900; }
  if (!quiet && m.v > 0.5) { AM.step -= dt * m.v; if (AM.step <= 0) { AM.step = 1.4; noise(0.06, 300 + Math.random() * 200, 0.025, 'lowpass', 1); if (Math.random() < 0.15) tone(160 + Math.random() * 80, 0.25, 0.012, 'triangle', 0, 120); } }
  const near = !quiet && G.ghosts.some(g => !g.hid && g.lit < 0.3 && Math.hypot(g.x - m.x, g.z - m.z) < 3); if (near) { AM.beat -= dt; if (AM.beat <= 0) { AM.beat = 0.75; sfx.beat(); } } else AM.beat = 0;
}
// the band (tools/juice-kit.js): this game's music
bandStyle('spooky', { seed: 43, key: 2, bpm: 76, lead: { i: 'musicbox' }, comp: { i: 'pad', p: 'P' }, A: [0, 5, 0, 4], tune: ['0...2...4...2...', '5...4...2...0...', '4...6...4...1...'] });
