// ===================== SOUND: the deep desert (PLAYBOOK S1-S11) =====================
// Under everything a deep rumble of the worm moving through the sand, rising with speed; the hiss and rush of sand pouring off
// its sides; wind, louder up on a breach and in a storm. A breach is a big whoosh and a roar; the landing a heavy thud (a
// grunt-free, firm "braced" knock when you braced). Rock: a crack and scrape. A warning creak and a low pulse when your
// balance is going. Waystones ring a low bell that climbs with each one. Music (its own switch): a slow desert drone with a
// hand drum that quickens and a melody that comes in as you go faster.
let rumN = 0, sandN = 0, windN2 = 0, warnN = 0;
const sfx = {
  click() { tone(660, 0.04, 0.04, 'triangle', 0, 820); },
  breach(v = 25) { const big = v > 30; noise(1.1, 900, 0.06, 'bandpass', 0.6); noise(1.4, 260, 0.09, 'lowpass', 0.7, 0.05); tone(70, 0.9, 0.06, 'sawtooth', 0, 45, 300); if (big) tone(55, 1.2, 0.05, 'sine', 0.1, 40); },
  land(hit = 0, braced) { const h = clamp(hit / 12, 0, 1); noise(0.35 + h * 0.3, 220, 0.08 + h * 0.06, 'lowpass', 0.8); tone(58, 0.4, 0.07 + h * 0.04, 'sine', 0, 38); if (braced) tone(330, 0.08, 0.02, 'triangle', 0.05, 300); },
  rock() { noise(0.12, 2400, 0.06, 'bandpass', 1.5); noise(0.4, 500, 0.06, 'lowpass', 1, 0.02); tone(110 * vary(0.1), 0.25, 0.04, 'square', 0, 70, 700); },
  wall() { noise(0.5, 700, 0.07, 'lowpass', 0.8); noise(0.25, 1800, 0.03, 'bandpass', 1, 0.05); },
  collapse() { noise(1.2, 400, 0.08, 'lowpass', 0.6); noise(0.6, 1500, 0.03, 'bandpass', 0.8, 0.1); tone(48, 1.0, 0.06, 'sine', 0, 35); },
  braced() { tone(392, 0.07, 0.025, 'triangle'); tone(523, 0.08, 0.02, 'triangle', 0.05); },
  brace() { if (!gate('brace', 250)) return; noise(0.08, 1200, 0.02, 'bandpass', 1); },
  creak() { if (!gate('creak', 600)) return; tone(180 * vary(0.1), 0.3, 0.02, 'sawtooth', 0, 150, 500); },
  warn() { if (!gate('warn', 700)) return; tone(220, 0.15, 0.05, 'square', 0, 200, 800); tone(220, 0.15, 0.05, 'square', 0.22, 200, 800); },
  fall() { noise(0.9, 500, 0.07, 'lowpass', 0.6); tone(300, 0.6, 0.05, 'triangle', 0, 120); },
  back() { noise(0.5, 1600, 0.03, 'bandpass', 0.7); tone(196, 0.3, 0.03, 'triangle', 0.1, 262); },
  dive() { noise(0.7, 300, 0.07, 'lowpass', 0.7); },
  way(i = 0) { const f = note(196, Math.min(14, i * 2)); pluck(f, 1.6, 0.07); pluck(f * 1.5, 1.4, 0.04, 0.04); tone(f / 2, 1.2, 0.03, 'sine'); },
  arrive() { [0, 7, 12, 16, 19].forEach((q, j) => pluck(note(196, q), 1.6, 0.07, j * 0.12)); },
  storm() { noise(2.5, 600, 0.05, 'bandpass', 0.4); },
  no() { if (!gate('no', 300)) return; tone(240, 0.15, 0.035, 'triangle', 0, 200, 900); },
  coin(i = 0) { tone(note(587, Math.min(10, i + 4)), 0.18, 0.05, 'triangle'); tone(note(587, Math.min(14, i + 8)), 0.18, 0.04, 'triangle', 0.06); },
  combo(i = 0) { [0, 3, 7].forEach((q, j) => pluck(note(294, q + i), 0.6, 0.05, j * 0.07)); },
  star(i = 0) { pluck(note(392, 3 + i * 2), 0.9, 0.08); },
  win() { [0, 3, 7, 10, 12, 15].forEach((q, j) => pluck(note(294, q), 1.3, 0.07, j * 0.11)); tone(73, 1.6, 0.05, 'sine'); },
  lose() { tone(294, 0.5, 0.05, 'triangle', 0, 277); tone(220, 0.9, 0.05, 'triangle', 0.35, 207); },
};
let mus = { t: 0, i: 0 };
// D Phrygian-dominant flavour, kept original: a drone on D, a hand drum, a reed line that enters with speed
const MEL = [0, 1, 4, 5, 7, 5, 4, 1, 0, -1, 0, 4, 7, 8, 7, 4];
function soundStep(G, dt) { if (!actx || MUTE || paused) return;
  const w = G && G.w, sp = w && G.phase === 'ride' ? clamp((w.v - 8) / 28, 0, 1) : 0, stormy = G && G.inStorm;
  if (SET.sfx && w) {
    rumN -= dt; if (rumN <= 0) { rumN = 0.32; if (!w.air) noise(0.4, 90 + sp * 80, 0.03 + sp * 0.05, 'lowpass', 0.7); }
    sandN -= dt; if (sandN <= 0) { sandN = 0.22; if (!w.air && sp > 0.1) noise(0.3, 2200 + sp * 1800, 0.006 + sp * 0.016, 'bandpass', 0.6); }
    windN2 -= dt; if (windN2 <= 0) { windN2 = 2.2 + Math.random(); noise(2.6, 300 + (w.air ? 500 : 0) + (stormy ? 300 : 0), 0.012 + (stormy ? 0.04 : 0) + (w.air ? 0.02 : 0), 'lowpass', 0.5); }
    if (G.bal < 0.3 && G.phase === 'ride') { warnN -= dt; if (warnN <= 0) { warnN = 0.5; tone(80, 0.2, 0.05, 'sine'); } } }
  mus.t += dt; const beat = 0.42 - sp * 0.16; if (mus.t < beat) return; mus.t -= beat; const i = mus.i++, D = 146.8, semi = q => D * Math.pow(2, q / 12);
  music(() => { if (i % 8 === 0) tone(D / 2, beat * 8, 0.02, 'sawtooth', 0, null, 400);
    if (i % 2 === 0) noise(0.08, 180, 0.03, 'lowpass', 1); else if (sp > 0.3) noise(0.05, 900, 0.012, 'bandpass', 1.5);
    if (sp > 0.45 && i % 2 === 0) { const m = MEL[(i / 2) % MEL.length]; tone(semi(m + 12), beat * 1.8, 0.012 + sp * 0.01, 'triangle', 0, null, 1800); } }); }
