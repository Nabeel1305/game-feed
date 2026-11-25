// ===================== SOUND: the race (PLAYBOOK S1-S11) =====================
// A buzzy little engine that climbs with your speed; tyres squealing through a drift; a chime as the sparks change colour,
// a step higher each time (blue, orange, purple: S4); a whoosh for a boost, bigger for a bigger one; the item roulette's
// tick-tick and a ding; a pop for a Turbo, a splat for an Oil slick, a zing for a Zap orb, a bloop for a Bubble; a cartoon
// spin; three beeps and a high one at the start; a bell for each lap and a fanfare at the line.
const sfx = {
  click() { tone(880, 0.04, 0.05, 'triangle', 0, 1100); },
  swap() { noise(0.16, 1800, 0.05, 'bandpass', 2); tone(520, 0.1, 0.03, 'sawtooth', 0, 760, 2600); },      // the tyres squeal across as the slide changes side
  go() { tone(660, 0.2, 0.06, 'square', 0, 660, 2400); },
  light(n) { tone(n ? 440 : 880, n ? 0.18 : 0.4, 0.06, 'square', 0, n ? 440 : 880, 2400); },
  spark(t = 1) { tone(note(659, t * 3), 0.12, 0.05, 'triangle'); tone(note(659, t * 3 + 2), 0.1, 0.03, 'sine', 0.05); },
  boost(t = 1) { noise(0.25 + t * 0.15, 1400, 0.05 + t * 0.015, 'bandpass', 0.8); tone(220, 0.3 + t * 0.1, 0.04, 'sawtooth', 0, 520 + t * 120, 1800); },
  item() { for (let i = 0; i < 5; i++) tone(1200 + (i % 2) * 300, 0.04, 0.025, 'square', i * 0.06, 0, 2600); tone(note(784, 4), 0.25, 0.05, 'triangle', 0.32); },
  use(it) { if (!ITEMS[it]) it = 'turbo'; if (it === 'turbo') sfx.boost(2); if (it === 'slick') noise(0.25, 500, 0.07, 'lowpass', 1); if (it === 'zap') tone(1800, 0.3, 0.04, 'sawtooth', 0, 600, 3000); if (it === 'shield') tone(300, 0.3, 0.05, 'sine', 0, 700); },
  spin() { tone(700, 0.6, 0.06, 'triangle', 0, 200); noise(0.4, 2400, 0.04, 'bandpass', 1); },
  pop() { tone(900, 0.12, 0.06, 'sine', 0, 300); },
  gotem() { [0, 4].forEach((q, j) => tone(note(784, q), 0.12, 0.05, 'triangle', j * 0.06)); },
  bump() { if (!gate('bump', 250)) return; noise(0.08, 600, 0.05, 'lowpass', 1); tone(120, 0.1, 0.05, 'triangle', 0, 90); },
  wall() { if (!gate('wall', 300)) return; noise(0.15, 400, 0.07, 'lowpass', 1); tone(90, 0.18, 0.07, 'sine', 0, 60); },
  clang(big) { tone(big ? 320 : 420, 0.25, 0.05, 'square', 0, 180); tone(big ? 610 : 760, 0.3, 0.03, 'triangle', 0.01, 300); noise(big ? 0.35 : 0.2, 2400, 0.05, 'bandpass', 2); },      /* metal: the rail */
  scrape() { if (!gate('scrape', 90)) return; noise(0.1, 3200, 0.025, 'bandpass', 3); },
  lap(n = 1) { pluck(note(523, n * 2), 0.6, 0.09); pluck(note(523, n * 2 + 4), 0.7, 0.07, 0.1); },
  no() { if (!gate('no', 300)) return; tone(260, 0.14, 0.06, 'triangle', 0, 200, 900); },
  coin(i = 0) { if (!gate('coin', 60)) return; const b = note(784, Math.min(10, i + 1)); tone(b, 0.18, 0.07, 'triangle'); tone(b * 2, 0.12, 0.03, 'sine', 0.01); },
  combo(n = 1) { [0, 2, 4].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.11, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.11); },
  win() { [0, 4, 7, 12, 16].forEach((q, j) => pluck(note(392, q), 1.0, 0.1, j * 0.09)); },
  lose() { tone(330, 0.5, 0.09, 'triangle', 0, 247); tone(247, 0.7, 0.09, 'triangle', 0.25, 165); },
};
const AM = { on: false };
function soundStep(G, dt) {
  if (HEADLESS || !actx) return; if (!AM.on) { AM.on = true; AM.eng = bed(160, 4, 0, 0.05, 'bandpass'); AM.eng2 = bed(320, 6, 0, 0.05, 'bandpass'); AM.skid = bed(2600, 2, 0, 0.08, 'bandpass'); AM.crowd = bed(900, 0.5, 0, 0.2, 'bandpass'); }
  const quiet = MUTE || paused || !G || G.over, k = G && G.me, v = k ? k.v / VMAX : 0;
  if (AM.eng) { AM.eng.set(quiet ? 0 : 0.02 + v * 0.03, 0.08); if (AM.eng.f) AM.eng.f.frequency.value = 110 + v * 260 + (k && k.boost > 0 ? 80 : 0); }
  if (AM.eng2) { AM.eng2.set(quiet ? 0 : 0.008 + v * 0.015, 0.08); if (AM.eng2.f) AM.eng2.f.frequency.value = 220 + v * 520; }
  if (AM.skid) AM.skid.set(quiet || !k.drift ? (k && k.off && v > 0.3 && !quiet ? 0.008 : 0) : 0.02, 0.05);
  if (AM.crowd) AM.crowd.set(quiet ? 0 : G.count > 0 ? 0.01 : 0.003, 0.5);
}
// the band (tools/juice-kit.js): this game's music
bandStyle('race', { seed: 44, key: 0, bpm: 134, lead: { i: 'square' }, A: [0, 3, 0, 4], tune: ['0...4...7...4...', '3...7...a...7...', '4...8...6...4...'], sc: 'mix', comp: { i: 'saw', p: 'a.a.a.a.a.a.a.a.' } });
