
// ---------- sounds: flight that rises, laser hum, breath, steel, a hero horn ----------
function sweep(dur, f0, f1, vol, q = 1, when = 0, type = 'bandpass') {   // a filtered noise whoosh that glides
  if (!actx || MUTE) return;
  try {
    const t = actx.currentTime + when, s = actx.createBufferSource(); s.buffer = nbuf(dur);
    const f = actx.createBiquadFilter(); f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = actx.createGain(); env(g, t, vol, dur, Math.min(0.12, dur * 0.3)); s.connect(f); f.connect(g); g.connect(BUS); s.start(t);
  } catch (e) {}
}
function loopTone(type, freq, lp) {        // a held tone we can fade in and out (laser hum, strain)
  if (!actx) return null;
  try {
    const o = actx.createOscillator(), f = actx.createBiquadFilter(), g = actx.createGain(), lfo = actx.createOscillator(), lg = actx.createGain();
    o.type = type; o.frequency.value = freq; f.type = 'lowpass'; f.frequency.value = lp; g.gain.value = 0;
    lfo.frequency.value = 11; lg.gain.value = 0; lfo.connect(lg); lg.connect(g.gain);
    o.connect(f); f.connect(g); g.connect(BUS); o.start(); lfo.start();
    return { o, f, g, lg, set(v, fr, tc = 0.05) { const t = actx.currentTime; g.gain.setTargetAtTime(MUTE ? 0 : v, t, tc); lg.gain.setTargetAtTime(MUTE ? 0 : v * 0.3, t, tc); if (fr) o.frequency.setTargetAtTime(fr, t, 0.06); } };
  } catch (e) { return null; }
}
let LOOPS = null;
function ensureLoops() {
  if (LOOPS || !actx || MUTE) return;
  LOOPS = { fly: bed(700, 0.7, 0, 0.35), breath: bed(1400, 0.9, 0, 4), crackle: bed(2600, 0.6, 0, 7, 'bandpass'), laser: loopTone('sawtooth', 120, 900), strain: loopTone('sawtooth', 70, 380), city: bed(500, 0.5, 0.025, 0.08, 'lowpass') };
}
function loopsOff() { if (!LOOPS) return; for (const key of ['fly', 'breath', 'crackle']) LOOPS[key] && LOOPS[key].set(0, 0.08); LOOPS.laser && LOOPS.laser.set(0); LOOPS.strain && LOOPS.strain.set(0); }
const sfx = {
  alert() { noise(0.25, 2600, 0.12, 'bandpass', 2); tone(880, 0.16, 0.08, 'triangle', 0.05, null, 5000); tone(1175, 0.24, 0.08, 'triangle', 0.21, null, 5000); },
  takeoff() { sweep(0.9, 300, 2200, 0.5, 0.8); noise(0.06, 900, 0.3, 'lowpass', 1, 0.02); tone(90, 0.4, 0.2, 'sine', 0, 140); },
  land() { sweep(0.5, 1800, 300, 0.35, 0.8); noise(0.12, 300, 0.5, 'lowpass', 1, 0.35); tone(80, 0.25, 0.25, 'sine', 0.35, 45); },
  ring(step) { const f = note(523, step); tone(f, 0.3, 0.09, 'triangle', 0, null, 6000); tone(f * 2, 0.22, 0.03, 'sine', 0.02); noise(0.02, 7000, 0.08, 'highpass'); },
  yelp() { tone(700 * vary(0.1), 0.18, 0.04, 'triangle', 0, 1000, 3000); },
  catch(step) { noise(0.012, 3000, 0.15, 'highpass'); noise(0.14, 500, 0.5); tone(140, 0.12, 0.2, 'sine', 0, 90); tone(note(392, step), 0.35, 0.09, 'triangle', 0.04, null, 5000); tone(note(392, step + 2), 0.35, 0.06, 'triangle', 0.1, null, 5000); },
  thud() { noise(0.2, 350, 0.6); tone(90, 0.25, 0.3, 'sine', 0, 40); },
  pop(big) { const v = vary(); noise(0.015, 5000, 0.3, 'highpass'); noise(big ? 0.35 : 0.18, (big ? 900 : 1600) * v, big ? 0.8 : 0.5); tone((big ? 110 : 200) * v, big ? 0.3 : 0.15, 0.25, 'sine', 0, big ? 40 : 90); },
  boom() { noise(0.02, 3000, 0.5, 'highpass'); noise(0.7, 700, 0.9); tone(70, 0.6, 0.45, 'sine', 0, 28); noise(0.5, 2500, 0.1, 'bandpass', 1, 0.15); duck(0.6, 600); },
  overheat() { sweep(0.5, 5000, 2500, 0.2, 2, 0, 'highpass'); tone(320, 0.25, 0.05, 'square', 0, 180, 1500); },
  oops() { tone(392, 0.16, 0.08, 'triangle', 0, null, 2500); tone(330, 0.3, 0.08, 'triangle', 0.14, null, 2200); },
  punch(big) { if (!gate('punch', 30)) return; const v = vary(), w = big ? 1.4 : 1; noise(0.014, 4200 * v, 0.35 * w, 'highpass'); noise(0.12, 1200 * v / w, 0.7 * w); tone(160 * v / w, 0.13, 0.32 * w, 'sine', 0, 65); },
  ko() { sweep(0.4, 800, 2400, 0.25, 1); tone(note(523, 4), 0.25, 0.06, 'triangle', 0.05, null, 5000); },
  whiff() { if (!gate('whiff', 60)) return; noise(0.14, 1800 * vary(0.12), 0.15, 'bandpass', 0.8, 0, 0.03); },
  hurt() { noise(0.015, 2500, 0.3, 'highpass'); noise(0.26, 450 * vary(), 0.85); tone(100, 0.28, 0.38, 'sine', 0, 42); duck(0.6, 350); },
  tell() { tone(240 * vary(), 0.12, 0.025, 'sawtooth', 0, 300, 1200); },
  hiss() { noise(0.5, 3500 * vary(), 0.18, 'highpass', 0.7, 0, 0.01); tone(note(523, 2), 0.2, 0.04, 'sine', 0.1); },
  creak() { if (!gate('creak', 400)) return; tone(260 * vary(0.1), 0.25, 0.04, 'sawtooth', 0, 210, 900); },
  slip() { noise(0.45, 2200, 0.25, 'bandpass', 4); tone(600, 0.4, 0.05, 'sawtooth', 0, 250, 1600); noise(0.3, 400, 0.5, 'lowpass', 1, 0.1); },
  roar(big) { tone(95 * vary(), 0.7, 0.12, 'sawtooth', 0, 62, 520); tone(140 * vary(), 0.5, 0.05, 'sawtooth', 0.05, 90, 700); noise(0.6, 380, 0.4); if (big) duck(0.5, 600); },
  slam() { noise(0.02, 2500, 0.4, 'highpass'); noise(0.45, 500, 0.9); tone(60, 0.45, 0.45, 'sine', 0, 30); },
  zap() { if (!gate('zap', 70)) return; noise(0.06, 5000 * vary(0.2), 0.12, 'highpass'); },
  armor() { if (!gate('armor', 300)) return; [1, 2.6].forEach((m2, i) => tone(330 * m2, 0.18, 0.05 / (i + 1), 'sine')); noise(0.03, 3000, 0.1, 'highpass'); },
  win(big) {                    // the hero horn: ta-da-DAAA
    const n = big ? [[392, 0, 0.14], [523, 0.14, 0.14], [659, 0.28, 0.14], [784, 0.42, 0.6], [1047, 0.42, 0.6]] : [[392, 0, 0.12], [523, 0.12, 0.12], [784, 0.24, 0.45]];
    n.forEach(([f, t, d]) => { tone(f, d + 0.1, 0.09, 'sawtooth', t, null, 2400); tone(f, d + 0.12, 0.05, 'triangle', t, null, 5000); });
    noise(0.03, 7000, 0.12, 'highpass', 1, 0.24); tone(note(1047, 2), 0.4, 0.03, 'sine', 0.3);
  },
  patrol() { [[392, 0], [523, 0.16], [659, 0.32], [784, 0.48], [659, 0.7], [784, 0.86], [1047, 1.02]].forEach(([f, t], i) => { const d = i === 6 ? 0.9 : 0.15; tone(f, d + 0.1, 0.09, 'sawtooth', t, null, 2500); tone(f / 2, d + 0.1, 0.05, 'triangle', t, null, 2000); }); },
  fail() { tone(330, 0.3, 0.08, 'triangle', 0, null, 2000); tone(262, 0.55, 0.08, 'triangle', 0.22, 240, 1800); noise(0.3, 300, 0.35, 'lowpass', 1, 0.05); },
  best() { [0, 2, 4].forEach((st, i) => tone(note(659, st), 0.22, 0.08, 'sine', i * 0.08)); },
  click() { noise(0.01, 5000, 0.15, 'highpass'); tone(1500 * vary(), 0.04, 0.05, 'triangle', 0, null, 3500); }
};
MUTE = store.get('mute', false);

// ---------- the mission generator: mix lists so missions rarely repeat ----------
const PLACES = [
  { name: 'Maple Park', scene: 'park' }, { name: 'Harbor Bridge', scene: 'bridge' }, { name: 'Downtown', scene: 'city' }, { name: 'Sunny Pier', scene: 'beach' },
  { name: 'the Old Docks', scene: 'harbor' }, { name: 'Eagle Peak', scene: 'mountain' }, { name: 'Clock Square', scene: 'city' }, { name: 'Riverside', scene: 'bridge' },
  { name: 'the Botanic Gardens', scene: 'park' }, { name: 'Lighthouse Point', scene: 'beach' }, { name: 'the Rail Yards', scene: 'harbor' }, { name: 'Pine Ridge', scene: 'mountain' },
  { name: 'Neon Street', scene: 'city' }, { name: 'Willow Lake Park', scene: 'park' }, { name: 'the Twin Bridges', scene: 'bridge' }, { name: 'Coral Bay', scene: 'beach' }
];
const SCENES = { catch: ['park', 'city', 'beach', 'harbor', 'mountain', 'bridge'], zap: ['park', 'city', 'beach', 'harbor', 'mountain', 'bridge'], fight: ['city', 'park'], fire: ['city', 'park', 'harbor', 'beach'], lift: ['bridge', 'mountain', 'harbor'], monster: ['city', 'harbor', 'beach', 'bridge'], villain: ['city', 'bridge', 'harbor'] };
const VERB = { catch: 'CATCH!', zap: 'ZAP!', fight: 'FIGHT!', fire: 'BLOW!', lift: 'LIFT!', monster: 'DODGE & ZAP!', villain: 'DODGE & ZAP!' };
const WHO = [
  ['A window cleaner', 'p'], ['Grandma Rosa', 'old'], ['A little kid', 'kid'], ['A lost tourist', 'p'], ['A painter', 'p'], ['A pizza chef', 'chef'], ['The mayor', 'suit'],
  ['A cat called Biscuit', 'cat'], ['A puppy', 'dog'], ['A rock climber', 'p'], ['A balloon seller', 'p'], ['A tightrope walker', 'p'], ['A bird watcher', 'old'],
  ['A delivery robot', 'robot'], ['An astronaut in training', 'astro'], ['A wedding photographer', 'suit'], ['A street magician', 'suit'], ['The school principal', 'old'], ['A baby goat', 'goat'], ['A kite flyer', 'kid']
];
const GROUPS = [['acrobats', 'p'], ['kids from the school trip', 'kid'], ['tourists', 'p'], ['painters', 'p'], ['wedding guests', 'suit'], ['circus clowns', 'clown'], ['kittens', 'cat'], ['window cleaners', 'p']];
const PERCH = { park: ['the tallest oak tree', 'the treetop zip line', 'a giant kite'], city: ['the top of Sky Tower', 'a broken scaffold', 'a window-cleaning rig', 'the giant billboard'], beach: ['the Ferris wheel', 'the lifeguard tower', 'a runaway parasail'], harbor: ['a crane arm', 'a stack of containers', "a ship's mast"], mountain: ['the cliff edge', 'the cable car', 'a rope bridge'], bridge: ['the bridge cables', 'the top of the bridge tower'] };
const NUM = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six'];
const THREATS = [
  ['Meteors are raining on', 'rock'], ['Space junk is falling on', 'junk'], ['Killer drones are swarming', 'drone'], ['Lava rocks are flying over', 'lava'],
  ['Robot bees are buzzing toward', 'bee'], ['Giant hailstones are pounding', 'ice'], ['A broken satellite is crashing down on', 'junk'], ['Runaway fireworks are heading for', 'lava']
];
const GANGS = ['The Rust Rats', 'The Neon Jackals', 'The Velvet Gloves', "Sly Sid's crew", 'The Midnight Moths', 'The Grin Gang', 'The Iron Jaws', "Mama Carla's mob", 'The Tin Hats', 'The Alley Cats'];
const GANG_COL = ['#b5532a', '#e84393', '#7d2f8a', '#56606b', '#3a3a6e', '#c9a227', '#6b6f78', '#a0283c', '#8a8f96', '#2f5d3a'];
const CRIMES = ['robbing the City Bank', 'raiding the jewel shop', "stealing the ice-cream factory's secret recipe", 'holding up a pizza truck', 'breaking into the museum', 'swiping bikes', 'looting the toy store', "kidnapping the city's prize parrot"];
const BUILDINGS = ['The Maple Street flats', 'The old library', "Bella's Bakery", 'The music school', 'The Clocktower Hotel', 'The candle factory', 'The fire station (awkward!)', 'The science museum', 'The tallest treehouse in town', 'The comic book shop'];
const VEHICLES = [['A school bus', 'bus', '#f2b705'], ['A cable car', 'cable', '#d64545'], ['A tram full of commuters', 'tram', '#2e86de'], ['An ice-cream van', 'van', '#f6a5c0'], ['A fire truck', 'truck', '#d63031'], ['A tour coach', 'bus', '#6c5ce7'], ['A delivery truck', 'truck', '#e17055'], ['A train carriage', 'tram', '#00897b'], ['A camper van', 'van', '#81b29a'], ['A garbage truck', 'truck', '#4caf50']];
const EDGES = { bridge: 'off the broken bridge', mountain: 'over the cliff edge', harbor: 'off the end of the dock' };
const M_PREF = { Lava: ['#9c2f12', '#ffb03a'], Crystal: ['#3d8ea3', '#c8fbff'], Swamp: ['#3f5f2a', '#c6f06a'], Shadow: ['#3a2554', '#d39bff'], Mecha: ['#5d6b78', '#ffd34a'], Frost: ['#6fa7c9', '#ffffff'], Toxic: ['#4e8a22', '#eaff4a'], Thunder: ['#2c3a8a', '#ffe94a'], Coral: ['#c4534a', '#ffd7c6'], Sand: ['#a7834e', '#fff1c4'] };
const M_CREAT = [['Octopus', 'octo'], ['Gorilla', 'brute'], ['Lizard', 'lizard'], ['Crab', 'crab'], ['Spider', 'crab'], ['Golem', 'brute']];
const V_TITLE = ['Doctor', 'Baron', 'Countess', 'Professor', 'Lady', 'General', 'Count', 'Madame'];
const V_THEME = { Frost: ['#7fc8f8', '#e8fbff'], Volt: ['#f5d742', '#fffbd0'], Gravity: ['#6b4fd8', '#d8ccff'], Venom: ['#3fb950', '#c9ffcf'], Inferno: ['#e8502a', '#ffd08a'], Static: ['#9aa7b5', '#ffffff'], Gloom: ['#3d2a5c', '#b88cff'], Chrome: ['#b8c2cc', '#ffffff'], Hex: ['#a23bc4', '#f3b0ff'], Quake: ['#8a5a2b', '#ffcf8a'] };
const GOLDEN = [["The mayor's prize-winning goat", 'goat'], ['A baby dragon (yes, really)', 'dragon'], ["The city's oldest tortoise, Sir Shelly", 'turtle'], ['A famous pop star', 'star']];
const SKINS = ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac', '#a8693e', '#5c3a21'];
const SHIRTS = ['#e74c3c', '#3498db', '#f1c40f', '#9b59b6', '#1abc9c', '#e67e22', '#ecf0f1', '#ff6b9d', '#2ecc71'];
function personLook(kind) {
  return { kind, skin: pick(SKINS), shirt: kind === 'suit' ? pick(['#2d3436', '#34495e', '#6d214f']) : kind === 'chef' ? '#ffffff' : kind === 'clown' ? pick(['#ff4757', '#ffa502', '#2ed573']) : pick(SHIRTS), pants: pick(['#2c3e50', '#34495e', '#7f6a52', '#1e3799', '#3d3d3d']), hair: pick(['#2b1a10', '#5a3a1a', '#d9b26f', '#1a1a1a', '#a0522d', '#c0c0c0']), long: Math.random() < 0.4, hair2: pick(['#ff9ff3', '#feca57', '#48dbfb']) };
}
function planPatrol(L) {
  const n = L <= 2 ? 3 : L <= 6 ? 4 : L <= 15 ? 5 : 6;
  const avail = ['catch', 'zap']; if (L >= 2) avail.push('fight'); if (L >= 3) avail.push('fire'); if (L >= 4) avail.push('lift'); if (L >= 7) avail.push('monster');
  const plan = []; let prev = null, bag = [];
  for (let i = 0; i < n; i++) {
    let type;
    if (i === n - 1 && L % 10 === 0) type = 'villain';
    else if (i === n - 1 && L % 5 === 0) type = 'monster';
    else {
      if (!bag.length) bag = avail.slice().sort(() => Math.random() - 0.5);
      let j = bag.findIndex(t => t !== prev); if (j < 0) j = 0;
      type = bag.splice(j, 1)[0];
      if (L <= 2 && i === 0) type = 'catch';
    }
    plan.push(makeSpec(type, L, i)); prev = type;
  }
  return plan;
}
function makeSpec(type, L, i) {
  const Lm = L + i * 0.6, f = curve(Lm), e = easyOf(L);
  const placeChoices = PLACES.filter(p => SCENES[type].includes(p.scene)), place = pick(placeChoices);
  const sp = { type, L, f, e, place: place.name, scene: place.scene, tod: pick(['day', 'day', 'sunset', 'night']), verb: VERB[type], golden: Math.random() < 1 / 25 && (type === 'catch') };
  if (type === 'catch') {
    const n = L <= 1 ? 1 : L <= 3 ? 2 : L <= 8 ? 3 : L <= 18 ? 4 : 5;
    const perch = pick(PERCH[sp.scene]), verb = pick(['slipped off', 'is falling from', 'tumbled off', 'lost their grip on']);
    if (sp.golden) { const g = pick(GOLDEN); sp.text = `${g[0]} ${verb} ${perch}!`; sp.looks = [{ kind: g[1], golden: true }]; for (let j = 1; j < n; j++) sp.looks.push(personLook('p')); }
    else if (n === 1) { const w = pick(WHO); sp.text = `${w[0]} ${verb} ${perch}!`; sp.looks = [personLook(w[1])]; }
    else { const g = pick(GROUPS); sp.text = `${NUM[n]} ${g[0]} ${verb.replace('their', 'their')} ${perch}!`; sp.looks = Array.from({ length: n }, () => personLook(g[1])); }
    sp.n = n; sp.perch = perch;
  } else if (type === 'zap') { const t = pick(THREATS); sp.text = `${t[0]} ${sp.place}!`; sp.look = t[1]; }
  else if (type === 'fight') { const gi = (Math.random() * GANGS.length) | 0; sp.text = `${GANGS[gi]} are ${pick(CRIMES)} at ${sp.place}!`; sp.gangCol = GANG_COL[gi]; }
  else if (type === 'fire') { sp.text = `${pick(BUILDINGS)} is on fire! People are trapped inside.`; }
  else if (type === 'lift') { const v = pick(VEHICLES); sp.text = `${v[0]} is hanging ${EDGES[sp.scene]}!`; sp.veh = v[1]; sp.vehCol = v[2]; }
  else if (type === 'monster') { const p = pick(Object.keys(M_PREF)), c = pick(M_CREAT); sp.text = `A giant ${p} ${c[0]} is stomping through ${sp.place}!`; sp.body = c[1]; sp.col = M_PREF[p]; sp.name = `${p} ${c[0]}`; }
  else if (type === 'villain') { const th = pick(Object.keys(V_THEME)); sp.name = `${pick(V_TITLE)} ${th}`; sp.text = `${sp.name} has taken over ${sp.place}!`; sp.col = V_THEME[th]; }
  return sp;
}

// ---------- drawing: the hero ----------
const SUIT = '#1d8f94', SUIT_D = '#0f5d61', CAPE = '#f2a516', CAPE_D = '#b8740a', GOLD = '#ffd45a', HSKIN = '#c98a5e', HHAIR = '#2a1b12';
function drawHero(x, y, s, pose = 'hover', o = {}) {
  const t = performance.now() / 1000;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  if (o.flip) ctx.scale(-1, 1);
  if (pose === 'fly') ctx.rotate(Math.PI / 2 + (o.tilt || 0));
  if (o.squash) ctx.scale(1 + o.squash * 0.12, 1 - o.squash * 0.12);
  const wv = Math.sin(t * 10) * 3, wv2 = Math.sin(t * 10 + 1.4) * 4, cl = pose === 'fly' ? 44 : pose === 'sit' ? 18 : 32;
  // cape
  ctx.fillStyle = CAPE_D; ctx.beginPath(); ctx.moveTo(-10, -23); ctx.lineTo(10, -23);
  ctx.quadraticCurveTo(17 + wv, 4, 16 + wv2, cl); ctx.quadraticCurveTo(0, cl + 5 + wv, -16 + wv2, cl); ctx.quadraticCurveTo(-17 + wv, 4, -10, -23); ctx.fill();
  ctx.fillStyle = CAPE; ctx.beginPath(); ctx.moveTo(-8, -22); ctx.lineTo(8, -22); ctx.quadraticCurveTo(13 + wv, 4, 12 + wv2, cl - 4); ctx.quadraticCurveTo(0, cl + wv, -12 + wv2, cl - 4); ctx.quadraticCurveTo(-13 + wv, 4, -8, -22); ctx.fill();
  // legs and boots
  if (pose === 'sit') {
    ctx.fillStyle = SUIT; rrect(-8, -2, 16, 8, 3); ctx.fill();
    ctx.fillRect(4, 0, 6, 20); ctx.fillRect(-2, 0, 6, 20);
    ctx.fillStyle = '#0b3a3d'; rrect(-3, 16, 8, 8, 3); ctx.fill(); rrect(3.5, 16, 8, 8, 3); ctx.fill();
  } else {
    const sp2 = pose === 'fly' ? 1.5 : pose === 'lift' ? 3 : 0;
    ctx.fillStyle = SUIT; rrect(-8 - sp2, -1, 7, 24, 3); ctx.fill(); rrect(1 + sp2, -1, 7, 24, 3); ctx.fill();
    ctx.fillStyle = '#0b3a3d'; rrect(-8.6 - sp2, 15, 8, 10, 3); ctx.fill(); rrect(0.6 + sp2, 15, 8, 10, 3); ctx.fill();
  }
  // torso
  const tg = ctx.createLinearGradient(-11, 0, 11, 0); tg.addColorStop(0, SUIT_D); tg.addColorStop(0.45, '#27a9ae'); tg.addColorStop(1, SUIT_D);
  ctx.fillStyle = tg; ctx.beginPath(); ctx.moveTo(-11.5, -24); ctx.lineTo(11.5, -24); ctx.quadraticCurveTo(12, -12, 8.5, 0); ctx.lineTo(-8.5, 0); ctx.quadraticCurveTo(-12, -12, -11.5, -24); ctx.fill();
  ctx.fillStyle = GOLD; ctx.fillRect(-8.8, -3.5, 17.6, 3.2);
  ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(0, -14, 5.4, 0, 7); ctx.fill();
  ctx.strokeStyle = SUIT_D; ctx.lineWidth = 1.5; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(-2.6, -16.5); ctx.lineTo(2.6, -16.5); ctx.lineTo(-2.2, -11.6); ctx.lineTo(2.8, -11.6); ctx.stroke();   // the Z bolt
  // arms
  ctx.lineCap = 'round'; ctx.lineWidth = 6.2; ctx.strokeStyle = SUIT;
  const arm = (sx, sy, hx, hy) => { ctx.strokeStyle = SUIT; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx, hy); ctx.stroke(); ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(hx, hy, 3.5, 0, 7); ctx.fill(); };
  if (pose === 'fly') { arm(-10, -21, -12, -5); arm(9, -22, 4, -46); }
  else if (pose === 'lift') { arm(-10, -22, -14, -44); arm(10, -22, 14, -44); }
  else if (pose === 'punch') { const a = o.aim || 0, L2 = 22; arm(-10, -21, -14, -8); arm(10, -21, 10 + Math.cos(a) * L2, -21 + Math.sin(a) * L2); }
  else if (pose === 'sit') { arm(-10, -21, -9, -3); arm(10, -21, 11, -3); }
  else if (pose === 'catch') { arm(-10, -21, -18, -12); arm(10, -21, 18, -12); }
  else { arm(-10, -21, -14, -5 + Math.sin(t * 3) * 1.5); arm(10, -21, 14, -5 + Math.sin(t * 3 + 1) * 1.5); }
  // head
  ctx.fillStyle = HSKIN; ctx.fillRect(-2.6, -29, 5.2, 6);
  ctx.beginPath(); ctx.ellipse(0, -34, 6.6, 7.6, 0, 0, 7); ctx.fill();
  ctx.fillStyle = HHAIR; ctx.beginPath(); ctx.ellipse(0, -38.5, 7, 4.2, 0, Math.PI, 0); ctx.fill(); ctx.beginPath(); ctx.moveTo(-1, -42); ctx.quadraticCurveTo(5, -43, 4, -38); ctx.lineTo(1, -39); ctx.fill();
  ctx.fillStyle = SUIT_D; rrect(-7, -36.5, 14, 4.2, 2); ctx.fill();
  if (o.eyes) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = '#ff4a2a'; for (const ex of [-2.7, 2.7]) { ctx.beginPath(); ctx.arc(ex, -34.4, 2.4, 0, 7); ctx.fill(); } ctx.restore(); }
  else { ctx.fillStyle = '#fff'; for (const ex of [-2.7, 2.7]) { ctx.beginPath(); ctx.arc(ex, -34.4, 1.15, 0, 7); ctx.fill(); } }
  if (o.blow) { ctx.fillStyle = '#5a2f1a'; ctx.beginPath(); ctx.arc(0, -29.5, 1.4, 0, 7); ctx.fill(); }
  else { ctx.strokeStyle = '#7a4a30'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.arc(0, -30.5, 2, 0.2, Math.PI - 0.2); ctx.stroke(); }
  ctx.restore();
}
const heroEye = (x, y, s) => ({ x, y: y - 34.4 * s });

// ---------- people, animals, bad guys ----------
function drawPerson(x, y, s, p, pose = 'stand', o = {}) {
  const t = performance.now() / 1000 + (o.ph || 0);
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); if (o.rot) ctx.rotate(o.rot);
  if (p.golden) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(0, -15, 0, 0, -15, 34); g.addColorStop(0, 'rgba(255,215,90,.6)'); g.addColorStop(1, 'rgba(255,215,90,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -15, 34, 0, 7); ctx.fill(); ctx.restore(); }
  const K = p.kind;
  if (K === 'cat' || K === 'dog' || K === 'goat' || K === 'turtle' || K === 'dragon') {
    const col = K === 'cat' ? '#e08a3c' : K === 'dog' ? '#c9a27a' : K === 'goat' ? '#eeeae0' : K === 'turtle' ? '#5d8a3a' : '#6fcf6a';
    const flail = pose === 'fall' ? Math.sin(t * 18) * 4 : 0;
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, -8, 11, 7, 0, 0, 7); ctx.fill();
    if (K === 'turtle') { ctx.fillStyle = '#3e6b25'; ctx.beginPath(); ctx.ellipse(0, -10, 10, 7, 0, Math.PI, 0); ctx.fill(); }
    if (K === 'dragon') { ctx.fillStyle = '#4caf50'; ctx.beginPath(); ctx.moveTo(-2, -12); ctx.lineTo(-12, -24 + flail); ctx.lineTo(4, -14); ctx.fill(); }
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(11, -14, 6, 0, 7); ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (const lx of [-7, -3, 4, 8]) { ctx.beginPath(); ctx.moveTo(lx, -3); ctx.lineTo(lx + flail * 0.5, 4); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-10, -9); ctx.quadraticCurveTo(-17, -14 + flail, -16, -20); ctx.stroke();
    ctx.fillStyle = K === 'goat' ? '#b9b2a2' : col; ctx.beginPath(); ctx.moveTo(8, -18); ctx.lineTo(9, -24); ctx.lineTo(12, -19); ctx.moveTo(13, -19); ctx.lineTo(16, -24); ctx.lineTo(16, -17); ctx.fill();
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(13, -15, 1.1, 0, 7); ctx.fill();
    ctx.restore(); return;
  }
  if (K === 'robot') {
    ctx.fillStyle = '#aab7c4'; rrect(-9, -30, 18, 22, 4); ctx.fill(); ctx.fillStyle = '#6c7a89'; rrect(-7, -42, 14, 11, 3); ctx.fill();
    ctx.fillStyle = '#5ff'; ctx.fillRect(-4, -38, 3, 3); ctx.fillRect(1, -38, 3, 3);
    ctx.strokeStyle = '#6c7a89'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-4, -8); ctx.lineTo(-4, 0); ctx.moveTo(4, -8); ctx.lineTo(4, 0); ctx.stroke();
    const up = pose === 'fall' ? -12 : 0; ctx.beginPath(); ctx.moveTo(-9, -26); ctx.lineTo(-14, -18 + up); ctx.moveTo(9, -26); ctx.lineTo(14, -18 + up); ctx.stroke();
    ctx.restore(); return;
  }
  const kid = K === 'kid', sc = kid ? 0.78 : 1; ctx.scale(sc, sc);
  // legs
  ctx.strokeStyle = p.pants; ctx.lineWidth = 5; ctx.lineCap = 'round';
  const kick = pose === 'fall' ? Math.sin(t * 16) * 5 : pose === 'run' ? Math.sin(t * 14) * 5 : 0;
  ctx.beginPath(); ctx.moveTo(-3, -12); ctx.lineTo(-4 + kick, 0); ctx.moveTo(3, -12); ctx.lineTo(4 - kick, 0); ctx.stroke();
  // body
  ctx.fillStyle = K === 'astro' ? '#eef2f5' : p.shirt; rrect(-7.5, -31, 15, 20, 5); ctx.fill();
  if (K === 'suit') { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-2.5, -31); ctx.lineTo(2.5, -31); ctx.lineTo(0, -24); ctx.fill(); }
  // arms
  ctx.strokeStyle = K === 'astro' ? '#eef2f5' : p.shirt; ctx.lineWidth = 4.5;
  let a1, a2;
  if (pose === 'fall') { a1 = [-14, -44 + Math.sin(t * 15) * 4]; a2 = [14, -44 + Math.cos(t * 15) * 4]; }
  else if (pose === 'wave') { a1 = [-12, -18]; a2 = [13, -44 + Math.sin(t * 10) * 3]; }
  else if (pose === 'scared') { a1 = [-11, -40]; a2 = [11, -40]; }
  else if (pose === 'held') { a1 = [-12, -36]; a2 = [12, -36]; }
  else { a1 = [-11, -16]; a2 = [11, -16]; }
  ctx.beginPath(); ctx.moveTo(-6, -28); ctx.lineTo(a1[0], a1[1]); ctx.moveTo(6, -28); ctx.lineTo(a2[0], a2[1]); ctx.stroke();
  ctx.fillStyle = p.skin; for (const a of [a1, a2]) { ctx.beginPath(); ctx.arc(a[0], a[1], 2.3, 0, 7); ctx.fill(); }
  // head
  ctx.fillStyle = p.skin; ctx.beginPath(); ctx.arc(0, -38, 6.5, 0, 7); ctx.fill();
  if (K === 'astro') { ctx.strokeStyle = '#eef2f5'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, -38, 8.5, 0, 7); ctx.stroke(); }
  else if (K === 'chef') { ctx.fillStyle = '#fff'; rrect(-6, -52, 12, 9, 4); ctx.fill(); }
  else if (K === 'clown') { ctx.fillStyle = '#ff4757'; ctx.beginPath(); ctx.arc(0, -37, 2, 0, 7); ctx.fill(); ctx.fillStyle = p.hair2 || '#ff9ff3'; ctx.beginPath(); ctx.arc(-6, -43, 4, 0, 7); ctx.arc(6, -43, 4, 0, 7); ctx.fill(); }
  else { ctx.fillStyle = K === 'old' ? '#d8d8d8' : p.hair; ctx.beginPath(); ctx.arc(0, -40, 6.8, Math.PI * 1.05, Math.PI * 1.95); ctx.fill(); if (p.long) ctx.fillRect(-6.8, -41, 2.6, 10), ctx.fillRect(4.2, -41, 2.6, 10); }
  ctx.fillStyle = '#222'; const sh = pose === 'fall' || pose === 'scared';
  if (sh) { ctx.beginPath(); ctx.arc(-2.3, -39, 1.1, 0, 7); ctx.arc(2.3, -39, 1.1, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(0, -34.5, 1.6, 2, 0, 0, 7); ctx.fill(); }
  else { ctx.beginPath(); ctx.arc(-2.3, -39, 0.9, 0, 7); ctx.arc(2.3, -39, 0.9, 0, 7); ctx.fill(); ctx.strokeStyle = '#222'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.arc(0, -36, 2.2, 0.2, Math.PI - 0.2); ctx.stroke(); }
  ctx.restore();
}
function drawThug(x, y, s, c, col) {
  const t = performance.now() / 1000;
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (c.big ? 1.3 : 1), s * (c.big ? 1.3 : 1)); if (c.rot) ctx.rotate(c.rot);
  ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-4, -12); ctx.lineTo(-5, 0); ctx.moveTo(4, -12); ctx.lineTo(5, 0); ctx.stroke();
  ctx.fillStyle = col; rrect(-9.5, -33, 19, 23, 6); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(-1, -33, 2, 23);
  const wind = c.state === 'wind' ? Math.min(1, c.st / c.wind) : 0;
  ctx.strokeStyle = col; ctx.lineWidth = 6;
  const rx = 12 + wind * 2, ry = -18 - wind * 20;
  ctx.beginPath(); ctx.moveTo(-8, -29); ctx.lineTo(-13, -16); ctx.moveTo(8, -29); ctx.lineTo(rx, ry); ctx.stroke();
  ctx.fillStyle = '#e0ac69'; ctx.beginPath(); ctx.arc(-13, -16, 3.2, 0, 7); ctx.fill();
  if (wind > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(rx, ry, 0, rx, ry, 16); g.addColorStop(0, `rgba(255,70,40,${0.5 + wind * 0.5})`); g.addColorStop(1, 'rgba(255,70,40,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(rx, ry, 16, 0, 7); ctx.fill(); ctx.restore(); }
  ctx.fillStyle = '#e0ac69'; ctx.beginPath(); ctx.arc(rx, ry, 3.6 + wind * 1.5, 0, 7); ctx.fill();
  ctx.fillStyle = '#c68642'; ctx.beginPath(); ctx.arc(0, -40, 7, 0, 7); ctx.fill();
  ctx.fillStyle = '#1e1e24'; ctx.beginPath(); ctx.arc(0, -42, 7.4, Math.PI, 0); ctx.fill(); ctx.fillRect(-7.4, -43, 14.8, 3);   // beanie
  ctx.fillStyle = '#111'; rrect(-7, -41.5, 14, 4, 2); ctx.fill();                                                                   // eye mask
  ctx.fillStyle = '#fff'; ctx.fillRect(-4, -40.6, 2, 1.6); ctx.fillRect(2, -40.6, 2, 1.6);
  ctx.strokeStyle = '#3a2010'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-3, -35); ctx.lineTo(3, -35.8); ctx.stroke();
  if (c.state === 'stun') { ctx.fillStyle = '#ffd45a'; for (let i = 0; i < 3; i++) { const a = t * 6 + i * 2.1; ctx.beginPath(); ctx.arc(Math.cos(a) * 9, -52 + Math.sin(a) * 2.5, 1.8, 0, 7); ctx.fill(); } }
  ctx.restore();
}

// ---------- monsters and villains ----------
function drawMonster(x, y, S, m, st) {
  const t = performance.now() / 1000, [c1, c2] = m.col, body = m.body;
  const side = st.raise || 0;    // -1 left arm up, 1 right arm up
  ctx.save(); ctx.translate(x, y); ctx.scale(S, S);
  const dark = shade(c1.startsWith('#') ? c1 : '#555555', 0.65);
  const glowEyes = () => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = c2; for (const ex of [-9, 9]) { ctx.beginPath(); ctx.ellipse(ex, -46, 4.5, 3, 0, 0, 7); ctx.fill(); } ctx.restore(); };
  if (body === 'octo') {
    ctx.strokeStyle = dark; ctx.lineWidth = 9; ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) { const bx = -30 + i * 12, w1 = Math.sin(t * 2 + i) * 12, up = (side < 0 && i < 2) || (side > 0 && i > 3) ? -50 : 0; ctx.beginPath(); ctx.moveTo(bx, 0); ctx.quadraticCurveTo(bx + w1 - 10, 25 + up, bx * 1.6 + w1, 50 + up * 1.4); ctx.stroke(); }
    const g = ctx.createRadialGradient(-12, -50, 5, 0, -30, 55); g.addColorStop(0, shade(c1, 1.35)); g.addColorStop(1, c1);
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -32, 42, 44, 0, 0, 7); ctx.fill();
    glowEyes();
  } else if (body === 'brute') {
    ctx.fillStyle = dark; ctx.fillRect(-26, 8, 18, 40); ctx.fillRect(8, 8, 18, 40);
    const g = ctx.createLinearGradient(-50, 0, 50, 0); g.addColorStop(0, shade(c1, 0.7)); g.addColorStop(0.5, shade(c1, 1.2)); g.addColorStop(1, shade(c1, 0.7));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-48, -36); ctx.quadraticCurveTo(0, -56, 48, -36); ctx.quadraticCurveTo(44, 10, 28, 14); ctx.lineTo(-28, 14); ctx.quadraticCurveTo(-44, 10, -48, -36); ctx.fill();
    ctx.strokeStyle = shade(c1, 0.8); ctx.lineWidth = 15; ctx.lineCap = 'round';
    for (const sd of [-1, 1]) { const up = side === sd ? 1 : 0; ctx.beginPath(); ctx.moveTo(sd * 42, -30); ctx.lineTo(sd * (58 - up * 6), -6 - up * 52); ctx.stroke(); ctx.fillStyle = dark; ctx.beginPath(); ctx.arc(sd * (58 - up * 6), -6 - up * 52, 11, 0, 7); ctx.fill(); }
    ctx.fillStyle = shade(c1, 1.1); ctx.beginPath(); ctx.ellipse(0, -52, 16, 14, 0, 0, 7); ctx.fill();
    ctx.fillStyle = dark; ctx.fillRect(-14, -54, 28, 4);
    ctx.save(); ctx.translate(0, 6); glowEyes(); ctx.restore();
  } else if (body === 'lizard') {
    ctx.fillStyle = dark; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-12 + i * 3, -60 + i * 14); ctx.lineTo(-30 + i * 2, -66 + i * 14); ctx.lineTo(-10 + i * 3, -50 + i * 14); ctx.fill(); }
    const g = ctx.createLinearGradient(-40, 0, 40, 0); g.addColorStop(0, shade(c1, 0.75)); g.addColorStop(0.5, shade(c1, 1.2)); g.addColorStop(1, shade(c1, 0.75));
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, 34, 46, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(6, -58, 22, 16, -0.1, 0, 7); ctx.fill();
    ctx.fillStyle = dark; const jaw = (st.roar ? 8 : 2) + Math.sin(t * 3) * 1; ctx.beginPath(); ctx.ellipse(10, -46 + jaw, 18, 6, -0.1, 0, Math.PI); ctx.fill();
    ctx.fillStyle = '#fff'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-4 + i * 6, -47); ctx.lineTo(-2 + i * 6, -43); ctx.lineTo(0 + i * 6, -47); ctx.fill(); }
    ctx.strokeStyle = shade(c1, 0.85); ctx.lineWidth = 9; ctx.lineCap = 'round';
    for (const sd of [-1, 1]) { const up = side === sd ? 1 : 0; ctx.beginPath(); ctx.moveTo(sd * 26, -20); ctx.lineTo(sd * (38 + up * 4), 0 - up * 38); ctx.stroke(); }
    ctx.save(); ctx.translate(8, -12); glowEyes(); ctx.restore();
  } else {   // crab / spider
    ctx.strokeStyle = dark; ctx.lineWidth = 6; ctx.lineCap = 'round';
    for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) { const w1 = Math.sin(t * 4 + i + sd) * 5; ctx.beginPath(); ctx.moveTo(sd * 30, 0 + i * 8); ctx.quadraticCurveTo(sd * 58, -14 + i * 10 + w1, sd * 66, 30 + i * 8); ctx.stroke(); }
    const g = ctx.createRadialGradient(-10, -20, 5, 0, -10, 60); g.addColorStop(0, shade(c1, 1.35)); g.addColorStop(1, c1);
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -10, 52, 32, 0, 0, 7); ctx.fill();
    for (const sd of [-1, 1]) {
      const up = side === sd ? 1 : 0, cx = sd * (62 - up * 8), cy = -30 - up * 40;
      ctx.strokeStyle = shade(c1, 0.85); ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(sd * 40, -18); ctx.lineTo(cx, cy); ctx.stroke();
      ctx.fillStyle = shade(c1, 1.1); ctx.beginPath(); ctx.ellipse(cx, cy - 8, 14, 18, sd * 0.3, 0, 7); ctx.fill();
      ctx.fillStyle = dark; ctx.beginPath(); ctx.moveTo(cx, cy - 8); ctx.lineTo(cx + sd * 16, cy - 30); ctx.lineTo(cx + sd * 2, cy - 22); ctx.fill();
    }
    ctx.strokeStyle = dark; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-9, -36); ctx.lineTo(-11, -48); ctx.moveTo(9, -36); ctx.lineTo(11, -48); ctx.stroke();
    ctx.save(); ctx.translate(0, -4); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = c2; for (const ex of [-11, 11]) { ctx.beginPath(); ctx.arc(ex, -46, 4, 0, 7); ctx.fill(); } ctx.restore(); ctx.restore();
  }
  ctx.restore();
}
function drawVillain(x, y, S, m, st) {
  const t = performance.now() / 1000, [c1, c2] = m.col, side = st.raise || 0;
  ctx.save(); ctx.translate(x, y + Math.sin(t * 2) * 4); ctx.scale(S, S);
  ctx.fillStyle = '#1a1424'; ctx.beginPath(); ctx.moveTo(-22, -44); ctx.lineTo(22, -44); ctx.quadraticCurveTo(46 + Math.sin(t * 3) * 6, 10, 40, 56); ctx.lineTo(-40, 56); ctx.quadraticCurveTo(-46 + Math.sin(t * 3 + 1) * 6, 10, -22, -44); ctx.fill();
  ctx.fillStyle = shade(c1, 0.6); ctx.beginPath(); ctx.moveTo(-20, -42); ctx.lineTo(20, -42); ctx.lineTo(16, 10); ctx.lineTo(-16, 10); ctx.fill();
  ctx.fillStyle = '#20202a'; ctx.fillRect(-14, 10, 11, 36); ctx.fillRect(3, 10, 11, 36);
  ctx.fillStyle = c1; ctx.fillRect(-16, 4, 32, 6);
  ctx.strokeStyle = shade(c1, 0.6); ctx.lineWidth = 9; ctx.lineCap = 'round';
  for (const sd of [-1, 1]) {
    const up = side === sd ? 1 : 0, hx = sd * (26 + up * 8), hy = -10 - up * 46;
    ctx.beginPath(); ctx.moveTo(sd * 18, -38); ctx.lineTo(hx, hy); ctx.stroke();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, 18 + up * 10); g.addColorStop(0, c2); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(hx, hy, 18 + up * 10, 0, 7); ctx.fill(); ctx.restore();
  }
  ctx.fillStyle = '#d9b48f'; ctx.beginPath(); ctx.arc(0, -54, 11, 0, 7); ctx.fill();
  ctx.fillStyle = c1; ctx.beginPath(); ctx.arc(0, -57, 12, Math.PI * 0.95, Math.PI * 2.05); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-12, -60); ctx.lineTo(-18, -74); ctx.lineTo(-6, -64); ctx.moveTo(12, -60); ctx.lineTo(18, -74); ctx.lineTo(6, -64); ctx.fill();
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = c2; ctx.fillRect(-9, -57, 18, 4); ctx.restore();
  ctx.strokeStyle = '#4a2a20'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-5, -47); ctx.quadraticCurveTo(0, -44 + (st.roar ? 3 : -1), 5, -47); ctx.stroke();
  ctx.restore();
}
