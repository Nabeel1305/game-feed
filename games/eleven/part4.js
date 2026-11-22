// ===================== SOUND: the stadium (PLAYBOOK S1-S11) =====================
// The referee's whistle, the thump of a pass and the crack of a shot, the swish of the net, the slap of a keeper's gloves, the
// scrape of a tackle, a crowd that hums all match, roars for a goal and groans at a miss.
const sfx = {
  whistle(v = 1) { tone(2400, 0.2 * v + 0.05, 0.05 * v, 'sine', 0, 2300); tone(2410, 0.2 * v + 0.05, 0.03 * v, 'square', 0, 2310, 3200); },
  kick(p = 1) { tone(130 + p * 40, 0.1, 0.1 * p + 0.04, 'sine', 0, 60); noise(0.04, 900, 0.05 * p + 0.02, 'lowpass', 1); },
  net() { noise(0.45, 2600, 0.07, 'bandpass', 0.7, 0.02); noise(0.3, 500, 0.05, 'lowpass', 1, 0.02); },
  glove() { noise(0.06, 1400, 0.12, 'bandpass', 1.2); tone(180, 0.1, 0.1, 'sine', 0, 90); },
  whoosh(slide) { if (!gate('whoosh', 120)) return; noise(slide ? 0.4 : 0.15, slide ? 600 : 1200, 0.05, 'bandpass', 0.8); },
  won() { tone(660, 0.08, 0.05, 'triangle'); tone(990, 0.1, 0.04, 'triangle', 0.06); },
  roar(n = 1) { duck(0.2, 300); for (let i = 0; i < 14 + n * 10; i++) noise(0.35 + Math.random() * 0.5, 600 + Math.random() * 1800, 0.012 + n * 0.006, 'bandpass', 1.5, i * 0.03); },
  groan(n = 1) { for (let i = 0; i < 10; i++) noise(0.6 + Math.random() * 0.3, 380 + Math.random() * 300, 0.016 * n, 'bandpass', 2, i * 0.04); },
  click() { tone(620, 0.05, 0.07, 'triangle', 0, 820); },
  tick() { if (!gate('tick', 60)) return; tone(1300 * vary(0.05), 0.025, 0.04, 'square', 0, null, 3000); },
  combo(n = 1) { [0, 2, 4].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  no() { if (!gate('no', 300)) return; tone(260, 0.14, 0.06, 'triangle', 0, 200, 900); },
  ding() { tone(988, 0.5, 0.1, 'sine'); tone(1480, 0.35, 0.04, 'sine', 0.02); },
  coin(i = 0) { if (!gate('coin', 60)) return; const b = note(784, Math.min(10, i + 1)); tone(b, 0.18, 0.08, 'triangle'); tone(b * 2, 0.12, 0.03, 'sine', 0.01); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.12, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.12); },
  win() { [0, 4, 7, 12].forEach((q, j) => pluck(note(392, q), 1.0, 0.12, j * 0.1)); },
  lose() { tone(330, 0.5, 0.1, 'triangle', 0, 247); tone(247, 0.7, 0.1, 'triangle', 0.25, 196); },
};
const AM = { on: false };
function soundStep(G, dt) {
  if (HEADLESS || !actx) return; if (!AM.on) { AM.on = true; AM.crowd = bed(700, 0.5, 0.03, 0.25, 'bandpass'); AM.low = bed(240, 0.6, 0.02, 0.18, 'lowpass'); }
  const quiet = MUTE || paused || !G || G.over, near = G && Math.abs(G.ball.x) > 30; if (AM.crowd) AM.crowd.set(quiet ? 0 : near ? 0.045 : 0.03, 0.4); if (AM.low) AM.low.set(quiet ? 0 : 0.02, 0.5);
}
// the band (tools/juice-kit.js): this game's music
bandStyle('sport', { seed: 34, key: -1, bpm: 119 });
