
// ===================== SOUND: the river (PLAYBOOK S1-S11) =====================
// The roar of the rapids rises and falls with the white water; each stroke is a "chuk" of a blade biting the water and a swirl;
// the hull knocks, scrapes and thumps over ledges. Gates ring a bright note that climbs (P18).
const sfx = {
  click() { tone(620, 0.05, 0.07, 'triangle', 0, 820); },
  tick() { if (!gate('tick', 60)) return; tone(1300 * vary(0.05), 0.025, 0.04, 'square', 0, null, 3000); },
  ding() { tone(988, 0.5, 0.1, 'sine'); tone(1480, 0.35, 0.04, 'sine', 0.02); },
  coin(i = 0) { const b = note(784, Math.min(10, i + 1)); tone(b, 0.18, 0.1, 'triangle'); tone(b * 2, 0.12, 0.03, 'sine', 0.01); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.12, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.12); },
  stroke(back) { noise(0.09, 900 * vary(0.12), 0.16, 'bandpass', 1.3); tone((back ? 120 : 160) * vary(0.06), 0.09, 0.1, 'sine', 0, 70); noise(0.32, 1700 * vary(0.1), 0.06, 'bandpass', 0.8, 0.06, 0.05); },
  scrape() { if (!gate('scrape', 250)) return; noise(0.35, 2400, 0.08, 'bandpass', 2); tone(95, 0.25, 0.06, 'sawtooth', 0, 80, 400); },
  bump() { if (!gate('bump', 150)) return; tone(110 * vary(0.08), 0.14, 0.2, 'sine', 0, 60); noise(0.1, 700, 0.1); },
  crash() { tone(70, 0.35, 0.3, 'sine', 0, 40); noise(0.4, 1200, 0.22, 'lowpass', 0.8); tone(240, 0.12, 0.08, 'square', 0.01, 120, 900); },
  roll() { noise(1.2, 500, 0.22, 'lowpass', 0.8, 0, 0.05); tone(180, 0.8, 0.08, 'sine', 0.1, 70); },
  rollup() { noise(0.5, 1500, 0.12, 'bandpass', 0.8); tone(330, 0.2, 0.07, 'triangle', 0.1, 495); },
  drop(h = 1.2) { tone(90, 0.4, 0.28, 'sine', 0.12, 45); noise(0.7, 900, 0.22, 'lowpass', 0.7, 0.1, 0.02); },
  gate(n = 1) { const b = note(659, Math.min(12, n + 2)); tone(b, 0.35, 0.11, 'triangle'); tone(b * 1.5, 0.3, 0.05, 'sine', 0.05); },
  thunder() { noise(2.8, 140, 0.5, 'lowpass', 0.7, 0, 0.08); noise(1.6, 320, 0.22, 'lowpass', 0.6, 0.2, 0.05); },
  win() { [0, 2, 4, 7, 9].forEach((s, j) => pluck(note(262, s + 5), 1.2, 0.15, j * 0.09)); tone(1046, 0.8, 0.05, 'sine', 0.45); },
  lose() { tone(294, 0.6, 0.12, 'triangle', 0, 262); tone(220, 0.9, 0.12, 'triangle', 0.3, 196); },
};
const AM = { on: false };
function soundStep(G, dt) {
  if (!actx || MUTE || HEADLESS) return;
  if (!AM.on) { AM.on = true; AM.roar = bed(700, 0.5, 0, 0.2, 'lowpass'); AM.hiss = bed(3500, 0.5, 0, 0.4, 'bandpass'); AM.rain = bed(5200, 0.4, 0, 0.3, 'highpass'); AM.bird = 3; }
  const g = G || (typeof IG !== 'undefined' && IG), foam = g ? rv(g.river.foam, g.b.s) : 0.2, wet = W3 && W3.S ? W3.S.rain : 0;
  AM.roar && AM.roar.set(0.05 + foam * 0.16, 0.4); AM.hiss && AM.hiss.set(0.012 + foam * 0.04, 0.4); AM.rain && AM.rain.set(wet * 0.05, 1);
  AM.bird -= dt; if (AM.bird <= 0) { AM.bird = 3 + Math.random() * 6; if (foam < 0.3 && wet === 0) { const b = 2400 + Math.random() * 1200, n = 2 + (Math.random() * 3 | 0); for (let i = 0; i < n; i++) tone(b * vary(0.08), 0.07, 0.012, 'sine', i * 0.12, b * 1.25); } }
}
// the band (tools/juice-kit.js): this game's music
bandStyle('western', { seed: 10, key: -2, bpm: 114 });
