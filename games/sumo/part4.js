
// ===================== SOUND: weight (PLAYBOOK S1-S11) =====================
// Deep footfalls, the slap of a shove, the meaty clash of the charge, clay scraping under driven-back heels, the belt taken,
// the whoosh of a sidestep, the heavy fall and the crowd's roar. Music (its own switch): a slow taiko pulse with a bamboo flute
// at home and between bouts; in the bout only a faint drum, so the bodies are what you hear.
const sfx = {
  click() { tone(880, 0.04, 0.05, 'triangle', 0, 1100); },
  foot(v = 1) { if (!gate('foot', 140)) return; tone(55 * vary(0.08), 0.18, 0.09 * v, 'sine', 0, 38); noise(0.08, 380, 0.05 * v, 'lowpass', 0.8); },
  slap(big) { noise(big ? 0.12 : 0.07, big ? 1500 : 2400, big ? 0.22 : 0.15, 'bandpass', 1.1); tone(big ? 90 : 130, 0.14, big ? 0.14 : 0.08, 'sine', 0, 60); },
  whiff() { if (!gate('whiff', 120)) return; noise(0.16, 1200, 0.06, 'bandpass', 1.6, 0, 0.05); },
  clash(v = 1) { noise(0.25, 700, 0.26 * v, 'lowpass', 0.7); tone(62, 0.4, 0.22 * v, 'sine', 0, 40); noise(0.06, 3000, 0.08 * v, 'bandpass', 1); },
  grip(v = 1) { noise(0.08, 900, 0.08 * v, 'bandpass', 2); tone(180, 0.08, 0.05 * v, 'triangle', 0.02, 140); },
  release() { noise(0.06, 1300, 0.04, 'bandpass', 2); },
  dodge() { noise(0.22, 900, 0.08, 'bandpass', 1.4, 0, 0.06); tone(420, 0.18, 0.03, 'sine', 0, 260); },
  scrape() { if (!gate('scrape', 220)) return; noise(0.22, 1800, 0.06, 'bandpass', 0.9); noise(0.18, 600, 0.04, 'lowpass', 1, 0.05); },
  fall(how) { noise(0.5, 420, 0.3, 'lowpass', 0.7); tone(48, 0.6, 0.26, 'sine', 0, 30); noise(0.3, 2200, 0.06, 'bandpass', 0.8, 0.08); },
  crowd(v = 1) { for (let i = 0; i < 5; i++) noise(0.9 + i * 0.2, 700 + i * 220, 0.03 * v, 'bandpass', 0.6, i * 0.05, 0.25); },
  ready() { tone(220, 0.25, 0.05, 'triangle'); noise(0.04, 4000, 0.03, 'highpass', 1, 0.02); },
  go() { tone(98, 0.3, 0.16, 'sine', 0, 70); noise(0.12, 900, 0.1, 'lowpass', 0.8); tone(330, 0.2, 0.06, 'triangle', 0.05, 392); },
  coin(i = 0) { tone(note(784, Math.min(10, i + 4)), 0.18, 0.07, 'triangle'); tone(note(784, Math.min(14, i + 8)), 0.18, 0.05, 'triangle', 0.06); },
  combo(n = 1) { [0, 2, 4, 7].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  goal() { [0, 2, 4, 7, 9].forEach((q, j) => pluck(note(392, q), 0.9, 0.08, j * 0.09)); },
  no() { if (!gate('no', 250)) return; tone(200, 0.1, 0.05, 'triangle', 0, 160, 900); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.1, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.1); },
  win() { tone(98, 0.5, 0.15, 'sine', 0, 70); [0, 2, 4, 7].forEach((q, j) => pluck(note(440, q), 1.0, 0.08, 0.1 + j * 0.12)); },
  lose() { tone(330, 0.4, 0.06, 'triangle', 0, 294); tone(262, 0.7, 0.06, 'triangle', 0.3, 247); },
};
let mus = { t: 0, i: 0 }, hum = null;
const FLUTE = [0, -1, 2, -1, 4, 2, -1, 0, 7, -1, 4, -1, 2, 0, -1, -1];      // a pentatonic phrase (no key note repeats too much)
function soundStep(G, dt) { if (!actx) return; if (!hum) hum = bed(110, 0.6, 0, 0.04);      // the crowd's murmur
  const home = $('ovHome') && !$('ovHome').classList.contains('hidden'), off = !G || paused || home || G.over, fight = G && G.phase === 'fight';
  if (hum) { const heat = fight && G.me && G.op ? clamp(1 - Math.min(RR - Math.hypot(G.me.x, G.me.z), RR - Math.hypot(G.op.x, G.op.z)) / 1.2, 0, 1) : 0; hum.set(off ? 0.004 : 0.02 + heat * 0.04, 0.4); }
  if (G && fight && !paused) for (const w of [G.me, G.op]) if (w.scrape > 0.15 && Math.random() < dt * 6) sfx.scrape();
  if (MUTE || paused) return; mus.t += dt; const beat = 0.32; if (mus.t < beat) return; mus.t -= beat; const i = mus.i++, vol = home || (G && G.phase !== 'fight') ? 1 : 0.35;
  music(() => { if (i % 4 === 0) { tone(60, 0.35, 0.07 * vol, 'sine', 0, 42); noise(0.05, 300, 0.02 * vol, 'lowpass', 1); } if (i % 8 === 6) tone(60, 0.2, 0.04 * vol, 'sine', 0, 45);
    if (vol > 0.5) { const n = FLUTE[i % 16]; if (n >= 0) tone(note(587, n + [0, 0, -2, 3][Math.floor(i / 16) % 4]), 0.45, 0.025, 'sine', 0, null, 2400); } }); }
// the band (tools/juice-kit.js): this game's music
bandStyle('east', { seed: 87, key: -2, bpm: 86 });
