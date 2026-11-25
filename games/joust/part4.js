// ===================== SOUND: the lists (PLAYBOOK S1-S11) =====================
// Hoofbeats pounding (faster and louder as you close), armour rattling, the crowd's rising murmur before the crash; a sharp
// wooden crack and splinters for a hit (a bigger crack when the lance breaks), a dull scrape for a glance, a whoosh for a
// miss, the crowd roaring or groaning; a herald's horn before each pass, a medieval fanfare for a win. Music (its own
// switch): a bright, stately tune between passes.
let hoofN = 0, rattleN = 0;
const sfx = {
  click() { tone(660, 0.04, 0.04, 'triangle', 0, 820); },
  horn() { tone(392, 0.35, 0.04, 'sawtooth', 0, null, 1400); tone(523, 0.5, 0.04, 'sawtooth', 0.3, null, 1400); },
  brace() { noise(0.1, 1500, 0.03, 'bandpass', 1.5); },
  crack(big) { noise(0.12, 3000, 0.12, 'bandpass', 0.7); noise(0.5, 900, big ? 0.1 : 0.06, 'bandpass', 0.5, 0.03); tone(90, 0.3, 0.07, 'sine', 0, 55); if (big) noise(0.8, 2400, 0.04, 'highpass', 0.6, 0.1); },
  glance() { noise(0.3, 1200, 0.04, 'bandpass', 2); },
  whiff() { noise(0.25, 600, 0.03, 'bandpass', 0.6); },
  hitme() { noise(0.2, 400, 0.08, 'lowpass', 1); tone(70, 0.3, 0.06, 'sine', 0, 45); },
  crowd(big) { noise(1.6, 900, big ? 0.06 : 0.03, 'bandpass', 0.3, 0.1); },
  fanfare() { [0, 4, 7, 12, 7, 12, 16].forEach((q, j) => tone(note(392, q), 0.22, 0.04, 'sawtooth', j * 0.16, null, 1800)); },
  no() { if (!gate('no', 300)) return; tone(240, 0.15, 0.035, 'triangle', 0, 200, 900); },
  coin(i = 0) { tone(note(784, Math.min(10, i + 4)), 0.18, 0.05, 'triangle'); tone(note(784, Math.min(14, i + 8)), 0.18, 0.04, 'triangle', 0.06); },
  combo(i = 0) { [0, 2, 4].forEach((q, j) => pluck(note(392, q + i), 0.6, 0.05, j * 0.07)); },
  star(i = 0) { pluck(note(523.3, 4 + i * 2), 0.8, 0.08); },
  win() { this.fanfare(); },
  lose() { tone(294, 0.5, 0.05, 'triangle', 0, 277); tone(220, 0.9, 0.05, 'triangle', 0.35, 207); },
};
let mus = { t: 0, i: 0 };
const TUNE = [0, 2, 4, 5, 7, 5, 4, 2, 0, 4, 7, 12, 11, 7, 9, 7];
function soundStep(G, dt) { if (!actx || MUTE || paused) return;
  if (SET.sfx && G && G.phase === 'charge') { const close = clamp(G.pt / PASS_T, 0, 1); hoofN -= dt; if (hoofN <= 0) { hoofN = 0.22 - close * 0.06; noise(0.06, 180, 0.03 + close * 0.04, 'lowpass', 1); noise(0.05, 160, 0.02 + close * 0.03, 'lowpass', 1, 0.08); }
    rattleN -= dt; if (rattleN <= 0) { rattleN = 0.45; noise(0.08, 4000, 0.008, 'highpass', 1); } if (G.pt > PASS_T - 1.2 && gate('murmur', 1500)) noise(1.4, 700, 0.02, 'bandpass', 0.3); }
  if (G && G.phase === 'charge') return;
  mus.t += dt; const beat = 0.3; if (mus.t < beat) return; mus.t -= beat; const i = mus.i++;
  music(() => { pluck(note(294, TUNE[i % TUNE.length]), 0.5, 0.014); if (i % 4 === 0) pluck(note(147, TUNE[i % TUNE.length] % 12), 0.9, 0.02); }); }
// the band (tools/juice-kit.js): this game's music
bandStyle('epic', { seed: 107, key: 0, bpm: 100, lead: { i: 'brass' }, comp: { i: 'strings', p: 'P' }, A: [0, 3, 0, 4], tune: ['0...0...4...7...', '7...7...5...3...', '4...4...6...8...'], sc: 'mix', d: { u: 'x.......x.......', s: '....x.x.....x.xx' } });
