// ===================== SOUND: the battle (PLAYBOOK S1-S11) =====================
// War drums under the march, a brass horn for "to battle" and the rally, the thunder of hooves in a charge, the hiss of a
// volley, the clash of steel that swells with how much fighting there is, a roar when the enemy breaks (and a groan when
// ours do), a soldier's "hup!" for each order.
const sfx = {
  click() { tone(880, 0.04, 0.05, 'triangle', 0, 1100); },
  drum() { tone(90, 0.18, 0.1, 'sine', 0, 55); noise(0.08, 400, 0.05, 'lowpass', 1); },
  horn(n = 1) { const b = [196, 233, 262][n % 3]; [0, 0.28].forEach((d, j) => { tone(b * (j ? 1.5 : 1), 0.5, 0.06, 'sawtooth', d, b * (j ? 1.5 : 1), 900); tone(b * (j ? 1.5 : 1) * 2, 0.5, 0.02, 'square', d, 0, 1400); }); },
  hup() { if (!gate('hup', 200)) return; tone(220, 0.12, 0.05, 'sawtooth', 0, 160, 800); },
  thunder() { if (!gate('thunder', 600)) return; for (let i = 0; i < 6; i++) noise(0.1, 220, 0.06, 'lowpass', 1, i * 0.07); },
  volley() { if (!gate('volley', 350)) return; noise(0.35, 3200, 0.03, 'bandpass', 1.4); },
  flank() { tone(note(523, 2), 0.15, 0.05, 'triangle'); tone(note(523, 5), 0.2, 0.05, 'triangle', 0.08); },
  cheer() { if (!gate('cheer', 500)) return; noise(0.9, 1100, 0.06, 'bandpass', 0.6); tone(330, 0.5, 0.02, 'sawtooth', 0, 420, 900); },
  groan() { noise(0.7, 400, 0.05, 'bandpass', 0.6); tone(180, 0.6, 0.03, 'sawtooth', 0, 120, 600); },
  no() { if (!gate('no', 300)) return; tone(260, 0.14, 0.06, 'triangle', 0, 200, 900); },
  coin(i = 0) { if (!gate('coin', 60)) return; const b = note(784, Math.min(10, i + 1)); tone(b, 0.18, 0.07, 'triangle'); tone(b * 2, 0.12, 0.03, 'sine', 0.01); },
  combo(n = 1) { [0, 2, 4].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.11, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.11); },
  win() { [0, 4, 7, 12].forEach((q, j) => tone(note(262, q), 0.6, 0.05, 'sawtooth', j * 0.18, 0, 1200)); },
  lose() { tone(196, 0.8, 0.07, 'sawtooth', 0, 147, 700); },
};
const AM = { on: false, beat: 0 };
function soundStep(G, dt) { if (HEADLESS || !actx) return; if (!AM.on) { AM.on = true; AM.clash = bed(2800, 1.5, 0, 0.06, 'bandpass'); AM.wind = bed(500, 0.5, 0, 0.3, 'bandpass'); }
  const quiet = MUTE || paused || !G || G.over, fights = G ? G.units.filter(u => !u.gone && u.fight > 0).length : 0, marching = G && G.phase === 'battle' && G.units.some(u => u.side === 0 && (u.order || u.tgt) && !u.fight);
  if (AM.clash) AM.clash.set(quiet ? 0 : Math.min(0.03, fights * 0.004), 0.2); if (AM.wind) AM.wind.set(quiet ? 0 : 0.006, 0.6);
  if (!quiet && (marching || (G && G.phase === 'deploy'))) { AM.beat -= dt; if (AM.beat <= 0) { AM.beat = G.phase === 'deploy' ? 1.2 : 0.5; sfx.drum(); } } }
// the band (tools/juice-kit.js): this game's music
bandStyle('epic', { seed: 47, key: 1, bpm: 90, lead: { i: 'horn', oct: 1 }, comp: { i: 'strings', p: 'P' }, A: [0, 5, 0, 4], tune: ['0...0...4...4...', '5...5...4...2...', '4...4...6...4...'], d: { k: 'x.......x.......', s: '....x.x.....x.xx', h: 'x.x.x.x.x.x.x.x.' } });
