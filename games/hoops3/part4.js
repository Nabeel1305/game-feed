// ===================== SOUND: the court (PLAYBOOK S1-S11) =====================
// Ball bounces (a dribble beat under the handler), sneaker squeaks on cuts, the swish of the net, a clank off the rim, the ref's
// whistle, the buzzer, the crowd's roar for your baskets. Music (its own switch): an upbeat hip-hop-ish beat, quieter in play.
let dribN = 0, squeakN = 0;
const sfx = {
  click() { tone(880, 0.04, 0.04, 'triangle', 0, 1100); },
  bounce() { tone(95 * vary(0.05), 0.09, 0.09, 'sine', 0, 70); noise(0.04, 900, 0.04, 'lowpass', 1); },
  pass() { noise(0.08, 1800, 0.03, 'bandpass', 1.5); },
  catchB() { tone(140, 0.06, 0.06, 'sine', 0, 110); noise(0.04, 1200, 0.03, 'bandpass', 1); },
  shot() { noise(0.12, 2200, 0.03, 'bandpass', 1.2); },
  swish(us) { noise(0.35, 3200, 0.07, 'highpass', 0.8); if (us) { noise(1.4, 900, 0.06, 'bandpass', 0.5, 0.15); for (let i = 0; i < 10; i++) noise(0.04, 2600 + Math.random() * 1500, 0.02, 'bandpass', 3, 0.2 + Math.random() * 0.9); } },
  rim() { tone(620 * vary(0.04), 0.35, 0.07, 'triangle', 0, 560); tone(930, 0.2, 0.03, 'sine', 0.01); },
  steal() { noise(0.1, 1400, 0.05, 'bandpass', 1.5); tone(523, 0.12, 0.05, 'triangle', 0.05, 784); },
  block() { tone(90, 0.25, 0.12, 'sine', 0, 60); noise(0.15, 700, 0.08, 'lowpass', 1); },
  swipe() { if (!gate('swipe', 150)) return; noise(0.07, 2400, 0.025, 'bandpass', 2); },
  whistle() { tone(2600, 0.45, 0.05, 'sine', 0, 2650); tone(2900, 0.4, 0.02, 'sine', 0.02); },
  buzzer() { tone(220, 0.8, 0.07, 'square', 0, null, 900); },
  squeak() { if (!gate('squeak', 300)) return; tone(1800 + Math.random() * 600, 0.08, 0.02, 'sine', 0, 2600); },
  no() { if (!gate('no', 250)) return; tone(220, 0.12, 0.05, 'triangle', 0, 180, 900); },
  coin(i = 0) { tone(note(784, Math.min(10, i + 4)), 0.18, 0.06, 'triangle'); tone(note(784, Math.min(14, i + 8)), 0.18, 0.05, 'triangle', 0.06); },
  combo(i = 0) { [0, 4, 7].forEach((q, j) => tone(note(392, q + i), 0.3, 0.05, 'triangle', j * 0.06)); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.1, 'sine'); },
  win() { [0, 4, 7, 12].forEach((s, j) => tone(523.3 * Math.pow(2, s / 12), 0.35, 0.1, 'triangle', j * 0.09)); },
  lose() { tone(330, 0.5, 0.06, 'triangle', 0, 247); tone(247, 0.7, 0.06, 'triangle', 0.25, 185); },
};
let mus = { t: 0, i: 0 };
function soundStep(G, dt) { if (!actx || MUTE || paused) return;
  if (G && !G.over && SET.sfx) { const b = G.ball; if (b.kind === 'held' && b.own && Math.hypot(b.own.vx, b.own.vz) > 0.5) { dribN += dt; if (dribN > 0.38) { dribN = 0; sfx.bounce(); } }
    squeakN += dt; if (squeakN > 0.5) { squeakN = 0; for (const p of G.P) if (Math.hypot(p.vx, p.vz) > 3.5 && Math.random() < 0.15) { sfx.squeak(); break; } } }
  mus.t += dt; const beat = 0.3; if (mus.t < beat) return; mus.t -= beat; const i = mus.i++, live = G && !G.over && !G.lesson && typeof $ === 'function' && $('ovHome').classList.contains('hidden');
  music(() => { const v = live ? 0.4 : 1; if (i % 4 === 0) tone(60, 0.25, 0.08 * v, 'sine', 0, 42); if (i % 4 === 2) noise(0.12, 1800, 0.04 * v, 'bandpass', 1); if (i % 2 === 1) noise(0.04, 7000, 0.015 * v, 'highpass', 1);
    const bass = [0, 0, 3, 5, 7, 7, 5, 3][(i >> 1) % 8]; if (i % 2 === 0) tone(note(98, bass), 0.22, 0.035 * v, 'triangle'); }); }
// the band (tools/juice-kit.js): this game's music
bandStyle('funk', { seed: 97, key: -1, bpm: 96, lead: { i: 'organ' }, comp: { i: 'keys' }, A: [0, 3, 0, 4], tune: ['0...2.4..2..0...', '3...5.7..5..3...', '4...6.8..6..4...'], sc: 'dor', d: { k: 'x.....x...x.....', r: '....x.......x...', h: 'x.xxx.x.x.xxx.x.' } });
