// ===================== SOUND: the crag (PLAYBOOK S1-S11) =====================
// Wind that grows as you climb, birds now and then (gulls at the sea cliffs); each kind of hold its own grab (a solid slap on a
// jug, a dry tap on an edge, a soft pat on a sloper), a scrape and a puff of chalk for a slap at bare rock (a different sound,
// so a miss is never mistaken for a grab), the clack of a quickdraw clipping in, breathing that quickens when your grip is low
// and softens at rest, the rope's creak when it catches you. Music (its own switch): quiet, airy, a few soft notes.
let windN = 0, birdN = 5, breathN = 0;
const sfx = {
  click() { tone(880, 0.04, 0.04, 'triangle', 0, 1100); },
  grab(ty, hand) { if (!hand) { noise(0.06, 500, 0.05, 'lowpass', 1); tone(140, 0.06, 0.03, 'sine'); return; }
    if (ty === 'jug' || ty === 'ledge' || ty === 'top') { noise(0.07, 900, 0.07, 'lowpass', 0.9); tone(220 * vary(0.04), 0.09, 0.04, 'triangle', 0, 180); }
    else if (ty === 'sloper') noise(0.1, 600, 0.05, 'lowpass', 0.6);
    else { noise(0.04, 2600, 0.05, 'bandpass', 2); tone(520 * vary(0.04), 0.05, 0.025, 'triangle'); }
    if (Math.random() < 0.4) noise(0.25, 4000, 0.012, 'highpass', 0.5, 0.03); },      // a little puff of chalk
  scrape() { if (!gate('scr', 120)) return; noise(0.22, 1400, 0.05, 'bandpass', 0.7); tone(110, 0.15, 0.02, 'sawtooth', 0, 90, 500); },
  no() { if (!gate('no', 250)) return; tone(240, 0.12, 0.04, 'triangle', 0, 200, 900); },
  load() { tone(180, 1.1, 0.03, 'sine', 0, 360); },
  caught() { noise(0.1, 900, 0.09, 'lowpass', 0.9); tone(330, 0.12, 0.05, 'triangle'); [0, 4, 7].forEach((q, j) => pluck(note(392, q + 5), 0.6, 0.05, 0.05 + j * 0.06)); },
  clip() { tone(2600, 0.03, 0.05, 'square', 0, 2400, 4000); tone(3200, 0.03, 0.04, 'square', 0.07, 3000, 5000); noise(0.04, 5000, 0.02, 'highpass', 1, 0.07); },
  slip() { if (!gate('slip', 600)) return; noise(0.5, 1800, 0.035, 'bandpass', 1.2); tone(300, 0.4, 0.03, 'triangle', 0, 220); },
  saved() { tone(392, 0.2, 0.04, 'triangle'); tone(523, 0.25, 0.04, 'triangle', 0.1); },
  fall() { noise(0.6, 1200, 0.05, 'bandpass', 0.6); tone(240, 0.5, 0.04, 'sine', 0, 120); tone(90, 0.5, 0.06, 'sine', 0.45, 70); noise(0.5, 300, 0.05, 'lowpass', 1, 0.45); },      // a whoosh, then the rope catches (a creak and a soft thump)
  breath(hard) { noise(hard ? 0.35 : 0.55, hard ? 1100 : 700, hard ? 0.022 : 0.012, 'bandpass', 1.4); },
  bird(sea) { if (!gate('bird', 2500)) return; if (sea) { for (let i = 0; i < 2; i++) tone(1500 + Math.random() * 300, 0.25, 0.012, 'sawtooth', i * 0.3, 1100, 2600); return; }
    const f = 2600 + Math.random() * 1200; for (let i = 0; i < 3 + ((Math.random() * 3) | 0); i++) tone(f * vary(0.06), 0.07, 0.012, 'sine', i * 0.11, f * 1.25); },
  coin(i = 0) { tone(note(784, Math.min(10, i + 4)), 0.18, 0.05, 'triangle'); tone(note(784, Math.min(14, i + 8)), 0.18, 0.04, 'triangle', 0.06); },
  combo(i = 0) { [0, 2, 4].forEach((q, j) => pluck(note(392, q + i), 0.6, 0.05, j * 0.07)); },
  star(i = 0) { pluck(note(523.3, 4 + i * 2), 0.8, 0.08); },
  win() { [0, 2, 4, 7, 9, 12].forEach((q, j) => pluck(note(392, q + 5), 1.4, 0.08, j * 0.12)); noise(2.5, 500, 0.03, 'lowpass', 0.6, 0.3); },
  lose() { tone(330, 0.5, 0.05, 'triangle', 0, 311); tone(262, 0.8, 0.05, 'triangle', 0.35, 247); },
};
let mus = { t: 0, i: 0 };
const CHORDS = [[0, 7, 14], [-3, 4, 12], [5, 12, 16], [2, 9, 17]];
function soundStep(G, dt) { if (!actx || MUTE || paused) return;
  const hgt = G && G.body ? Math.max(0, G.body.y) / Math.max(10, G.route.H) : 0;
  if (SET.sfx && G) { windN -= dt; if (windN <= 0) { windN = 2.2 + Math.random() * 1.5; noise(2.6, 300 + hgt * 500, 0.02 + hgt * 0.035, 'lowpass', 0.5); }
    birdN -= dt; if (birdN <= 0) { birdN = 5 + Math.random() * 8; if (hgt < 0.8) sfx.bird(G.cfg.place === 2); }
    if (G.phase === 'climb' || G.phase === 'slip') { const hard = G.st < 0.35 || G.phase === 'slip'; breathN -= dt; if (breathN <= 0 && (hard || !G.resting && G.st < 0.7)) { breathN = hard ? 0.7 : 1.6; sfx.breath(hard); } } }
  mus.t += dt; const beat = 0.6; if (mus.t < beat) return; mus.t -= beat; const i = mus.i++, ch = CHORDS[Math.floor(i / 8) % CHORDS.length], semi = q => 220 * Math.pow(2, q / 12);
  music(() => { if (i % 2 === 0) pluck(semi(ch[(i / 2) % 3 | 0] + 12), 1.6, 0.018); if (i % 8 === 0) tone(semi(ch[0] - 12), 3.5, 0.02, 'sine'); if (i % 16 === 11) pluck(semi(ch[2] + 19), 1.2, 0.012); }); }
// the band (tools/juice-kit.js): this game's music
bandStyle('calm', { seed: 99, key: 2, bpm: 72 });
