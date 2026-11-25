// ===================== SOUND: building (PLAYBOOK S1-S11) =====================
// Birdsong and a breeze over the plot; each piece has its own small sound (a wooden knock for a wall, a glassy tap for a
// window, a door's creak, a soft thud for floor, a cushioned bump for furniture, a rustle for a tree), pitched a little higher
// as you build a run (S4); a rising chime when the roof goes on; a warm chord to move in.
let RUN = 0, RUNT = 0;
const sfx = {
  click() { tone(660, 0.05, 0.06, 'triangle', 0, 880); },
  put(what = 'wall') { const now = Date.now(); RUN = now - RUNT < 600 ? Math.min(8, RUN + 1) : 0; RUNT = now; const p = note(392, RUN);
    if (what === 'wall') { tone(p * 0.5, 0.12, 0.08, 'triangle', 0, p * 0.35, 1200); noise(0.05, 900, 0.04, 'lowpass', 1); }
    else if (what === 'window') { tone(p * 2, 0.2, 0.05, 'sine'); tone(p * 3, 0.15, 0.02, 'sine', 0.02); }
    else if (what === 'door') { tone(180, 0.35, 0.04, 'sawtooth', 0, 260, 600); }
    else if (what === 'floor') { tone(p * 0.6, 0.08, 0.06, 'triangle', 0, p * 0.4, 900); }
    else if (what === 'tree' || what === 'plant') { noise(0.25, 2500, 0.04, 'bandpass', 1); }
    else { tone(p * 0.8, 0.15, 0.06, 'sine', 0, p * 0.6); noise(0.06, 600, 0.03, 'lowpass', 1); } },
  turn() { tone(520, 0.08, 0.05, 'triangle', 0, 640); },
  erase() { noise(0.12, 1400, 0.05, 'bandpass', 1); tone(300, 0.1, 0.04, 'triangle', 0, 200); },
  roof() { [0, 4, 7, 12].forEach((q, j) => tone(note(523, q), 0.4, 0.06, 'triangle', j * 0.07)); },
  chime() { tone(note(784, 4), 0.5, 0.05, 'sine'); },
  no() { if (!gate('no', 300)) return; tone(260, 0.14, 0.05, 'triangle', 0, 200, 900); },
  coin(i = 0) { const b = note(784, Math.min(10, i + 1)); tone(b, 0.18, 0.09, 'triangle'); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.12, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.12); },
  win() { [0, 4, 7, 11, 14].forEach((s, j) => pluck(note(262, s), 1.4, 0.12, j * 0.1)); },
  lose() { tone(294, 0.6, 0.1, 'triangle', 0, 262); },
};
const AM = { on: false, bird: 2 };
function soundStep(G, dt) { if (!actx || MUTE || HEADLESS) return; if (!AM.on) { AM.on = true; AM.wind = bed(800, 0.6, 0.008, 0.15, 'bandpass'); }
  AM.bird -= dt; if (AM.bird <= 0) { AM.bird = 3 + Math.random() * 6; const b = 2200 + Math.random() * 1500; for (let i = 0; i < 3; i++) tone(b * (1 + i * 0.08), 0.07, 0.015, 'sine', i * 0.1, b * 1.2); } }
// the band (tools/juice-kit.js): this game's music
bandStyle('calm', { seed: 53, key: 3, bpm: 74, lead: { i: 'piano' }, comp: { i: 'pad', p: 'P' }, A: [0, 3, 0, 4], tune: ['2...4...7...4...', '5...7...a...7...', '4...6...8...6...'] });
