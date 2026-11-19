
// ===================== RULES: Plumber (game 65, set 12: his idea) =====================
// "You're a plumber. People have problems with pressure, no water... you go to different people's houses and fix their water."
// A working day is a level. Calls come in on the phone (who, what's wrong, the pay, how far, some urgent). Pick one, drive
// there, and you see the whole house cut open: pipes in the walls, every tap, toilet, boiler and valve. The customer says
// what's wrong, which is not always where it's wrong: tap a part to walk over and look (what you find says what to do), then
// pick the fix. Each fix is a small hands-on moment: HOLD a wrench and let go in the green, PLUNGE in time with the water,
// FEED the snake and ease off when it snags, SET a dial, FIT a new part. A burst pipe floods the room until you shut the
// main off. Happy customers pay more and tip; a wrong fix costs time and their patience. Make the day's money before five.
const RULES = [
  'Pick a <b>call</b> from the phone and drive there. Make the day\'s money before <b>5 pm</b>.',
  '<b>Tap a part</b> of the house to look at it: it tells you what is wrong. Then pick the fix.',
  '<b>Hold</b> and let go in the green. <b>Plunge</b> as the ring closes. <b>Feed</b> the snake, ease off on red.',
  'A burst pipe floods the room: <b>shut off the main</b> (by the meter) first!',
  'The wrong fix costs time and the customer\'s patience. Quick, tidy work earns tips.',
];
// ---------- the parts of a house, and what you can do to each ----------
const FIX = {
  ksink: { name: 'Kitchen sink', acts: ['New washer', 'Tighten trap', 'Plunge', 'Clean aerator'] },
  basin: { name: 'Basin', acts: ['New washer', 'Tighten trap', 'Plunge', 'Snake drain'] },
  wc: { name: 'Toilet', acts: ['Plunge', 'Set the float', 'Snake it'] },
  shower: { name: 'Shower', acts: ['Descale head', 'Snake drain', 'New cartridge'] },
  heater: { name: 'Boiler', acts: ['Light pilot', 'Set thermostat', 'Top up pressure'] },
  rad: { name: 'Radiator', acts: ['Bleed air', 'Set valve'] },
  main: { name: 'Stopcock & meter', acts: ['Shut off', 'Open fully', 'Thaw pipe'] },
  prv: { name: 'Pressure valve', acts: ['Set pressure', 'Tighten union'] },
  wm: { name: 'Washing machine', acts: ['New hose', 'Tighten hose', 'Clean filter'] },
  otap: { name: 'Outside tap', acts: ['New section', 'Thaw', 'New washer'] },
  vent: { name: 'Roof vent', acts: ['Clear vent', 'New cap'] },
  sewer: { name: 'Drain cover', acts: ['Auger the sewer', 'Lift and look'] },
  pipe: { name: 'Burst pipe', acts: ['Fit new section', 'Solder joints', 'Tape it up'] },
};
// how each fix is done: hold (let go in the green; 'end' ones just need turning all the way), pump, feed, set, fit
const HOW = {
  'New washer': ['hold', 'Hold to tighten the new washer; let go in the green.'], 'Tighten trap': ['hold', 'Hold to tighten the nut; let go in the green.'],
  'Clean aerator': ['hold', 'Hold to scrub; let go in the green.'], 'Descale head': ['hold', 'Hold to scrub off the scale; let go in the green.'],
  'Light pilot': ['hold', 'Hold the igniter; let go when the flame is steady (green).'], 'Top up pressure': ['hold', 'Hold the filling loop open; let go in the green.'],
  'Bleed air': ['hold', 'Hold the bleed key open; let go when water comes (green).'], 'Thaw pipe': ['hold', 'Hold the heat on; let go in the green. Too long and it bursts!'],
  Thaw: ['hold', 'Hold the heat on; let go in the green.'], 'Tighten hose': ['hold', 'Hold to tighten; let go in the green.'], 'Clean filter': ['hold', 'Hold to unscrew and clean; let go in the green.'],
  'Solder joints': ['hold', 'Hold the torch on the joint; let go in the green. Two joints.'], 'Tighten union': ['hold', 'Hold to tighten; let go in the green.'],
  'Shut off': ['end', 'Hold to turn the stopcock all the way off.'], 'Open fully': ['end', 'Hold to turn the stopcock all the way open.'],
  Plunge: ['pump', 'TAP each time the ring closes on the circle. Off-beat taps push the water back.'],
  'Snake drain': ['feed', 'HOLD to feed the snake in. When the needle goes RED, let go until it is green again.'], 'Snake it': ['feed', 'HOLD to feed the snake in. Let go on RED.'],
  'Auger the sewer': ['feed', 'HOLD to feed the auger through the roots. Let go on RED.'], 'Clear vent': ['feed', 'HOLD to push the rod down the vent. Let go on RED.'],
  'Set the float': ['set', 'Drag the float to the green line, then let go.'], 'Set thermostat': ['set', 'Drag the dial into the green, then let go.'],
  'Set pressure': ['set', 'Drag the dial into the green (3 bar), then let go.'], 'Set valve': ['set', 'Drag the valve into the green, then let go.'],
  'New hose': ['fit', 'Drag the new hose onto the machine.'], 'New section': ['fit', 'Drag the new pipe into the gap.'], 'Fit new section': ['fit', 'Drag the new pipe into the gap.'],
  'New cartridge': ['fit', 'Drag the new cartridge into the valve.'], 'New cap': ['fit', 'Drag the new cap on.'], 'Tape it up': ['hold', ''], 'Lift and look': ['hold', ''],
};
// ---------- the jobs (the long list he asked for), the level each first appears on, and what is really wrong ----------
// steps: [part, fix]. A job can have more than one possible cause; the look tells you which.
const JOBS = [
  { id: 'drip', lv: 1, at: ['ksink', 'basin'], say: ['My tap won\'t stop dripping!', 'Drip, drip, drip all night. Help!', 'The tap drips even turned right off.'], causes: [{ cause: 'The washer is worn out.', steps: [['@', 'New washer']] }], pay: 55 },
  { id: 'trap', lv: 1, at: ['ksink', 'basin'], say: ['There\'s water under my sink.', 'The cupboard under the sink is soaked!', 'Something\'s leaking under the sink.'], causes: [{ cause: 'The trap nut is loose.', steps: [['@', 'Tighten trap']] }], pay: 55 },
  { id: 'sinkclog', lv: 1, at: ['ksink', 'basin'], say: ['My sink won\'t drain.', 'The sink is full of grey water!', 'Water just sits in the sink.'], causes: [{ cause: 'Grease and gunk blocking the pipe.', steps: [['@', 'Plunge']] }], pay: 60 },
  { id: 'wcclog', lv: 2, at: ['wc'], say: ['The toilet\'s blocked!', 'Toilet\'s about to overflow!', 'Please hurry, the loo is blocked!'], causes: [{ cause: 'The bowl is blocked.', steps: [['wc', 'Plunge']] }], pay: 70, urgent: true },
  { id: 'wcrun', lv: 2, at: ['wc'], say: ['The toilet keeps running all night.', 'I can hear the toilet filling all day.', 'Water won\'t stop running in the toilet.'], causes: [{ cause: 'The float is set too high.', steps: [['wc', 'Set the float']] }], pay: 60 },
  { id: 'burst', lv: 3, at: ['pipe'], say: ['Water\'s pouring through the ceiling!!', 'A pipe burst! There\'s water everywhere!', 'HELP! The ceiling is raining!'], causes: [{ cause: 'A split pipe.', steps: [['main', 'Shut off'], ['pipe', 'Fit new section'], ['pipe', 'Solder joints']] }], pay: 150, urgent: true, flood: true },
  { id: 'nowater', lv: 4, at: ['ksink'], say: ['No water at all!', 'Nothing comes out of any tap!', 'The water just stopped.'], causes: [{ cause: 'Someone shut the stopcock.', at: 'main', steps: [['main', 'Open fully']] }, { cause: 'The pipe by the meter is frozen solid.', at: 'main', steps: [['main', 'Thaw pipe']], cold: true }], pay: 70 },
  { id: 'lowpress', lv: 5, at: ['shower'], say: ['The shower\'s just a trickle.', 'Barely any pressure in the shower.', 'My shower is so weak!'], causes: [{ cause: 'Limescale in the shower head.', at: 'shower', steps: [['shower', 'Descale head']] }, { cause: 'The stopcock is only half open.', at: 'main', steps: [['main', 'Open fully']], weak: true }, { cause: 'The pressure valve is set too low.', at: 'prv', steps: [['prv', 'Set pressure']], weak: true }], pay: 75 },
  { id: 'nohot', lv: 6, at: ['heater'], say: ['No hot water!', 'Cold showers for two days!', 'The hot tap runs cold.'], causes: [{ cause: 'The pilot light is out.', steps: [['heater', 'Light pilot']] }, { cause: 'The thermostat is turned right down.', steps: [['heater', 'Set thermostat']] }], pay: 80 },
  { id: 'radcold', lv: 7, at: ['rad'], say: ['The radiator is cold at the top.', 'One radiator won\'t warm up.', 'The radiator gurgles and stays cold.'], causes: [{ cause: 'Air trapped in the radiator.', steps: [['rad', 'Bleed air']] }, { cause: 'The radiator valve is shut.', steps: [['rad', 'Set valve']] }], pay: 65 },
  { id: 'boiler', lv: 7, at: ['heater'], say: ['The boiler says low pressure.', 'No heating, and the boiler is beeping!', 'Boiler stopped. Gauge says nearly zero.'], causes: [{ cause: 'The boiler pressure is too low.', steps: [['heater', 'Top up pressure']] }], pay: 75 },
  { id: 'bang', lv: 8, at: ['ksink'], say: ['The pipes BANG when I shut a tap!', 'Loud knocking in the walls!', 'Every tap makes the pipes shudder.'], causes: [{ cause: 'The water pressure is far too high.', at: 'prv', steps: [['prv', 'Set pressure']] }], pay: 80 },
  { id: 'wmflood', lv: 8, at: ['wm'], say: ['The washing machine flooded the kitchen!', 'Water pouring out of the washing machine!'], causes: [{ cause: 'The fill hose has split.', steps: [['wm', 'New hose'], ['wm', 'Tighten hose']] }], pay: 110, urgent: true, flood: true, slow: true },
  { id: 'smell', lv: 9, at: ['basin'], say: ['A horrible smell from the drains.', 'The bathroom stinks of sewer!', 'The drains gurgle and smell.'], causes: [{ cause: 'The roof vent is blocked by a nest.', at: 'vent', steps: [['vent', 'Clear vent']] }], pay: 85 },
  { id: 'sewer', lv: 9, at: ['wc'], say: ['Every drain in the house is backing up!', 'Sewage coming up the shower drain!'], causes: [{ cause: 'Tree roots in the sewer pipe.', at: 'sewer', steps: [['sewer', 'Auger the sewer']] }], pay: 130, urgent: true },
  { id: 'showerslow', lv: 11, at: ['shower'], say: ['The shower drain is like a bath.', 'I\'m standing in water in the shower.'], causes: [{ cause: 'Hair clogging the drain.', steps: [['shower', 'Snake drain']] }], pay: 65 },
  { id: 'otap', lv: 12, at: ['otap'], say: ['The outside tap sprays everywhere.', 'Garden tap is gushing!'], causes: [{ cause: 'Frost split the pipe.', steps: [['main', 'Shut off'], ['otap', 'New section']] }], pay: 95 },
  { id: 'cartridge', lv: 13, at: ['shower'], say: ['The shower drips day and night.', 'Shower won\'t turn off properly.'], causes: [{ cause: 'The valve cartridge is worn.', steps: [['main', 'Shut off'], ['shower', 'New cartridge']] }], pay: 90 },
  { id: 'aerator', lv: 14, at: ['ksink'], say: ['The kitchen tap just splutters.', 'Tap spits and sprays sideways.'], causes: [{ cause: 'The aerator is clogged.', steps: [['ksink', 'Clean aerator']] }], pay: 55 },
  { id: 'wmdrain', lv: 15, at: ['wm'], say: ['The washing machine won\'t drain.', 'Washer full of water and stuck.'], causes: [{ cause: 'The drain filter is blocked.', steps: [['wm', 'Clean filter']] }], pay: 70 },
  { id: 'otapfrozen', lv: 16, at: ['otap'], say: ['The garden tap won\'t run.', 'Nothing from the outside tap.'], causes: [{ cause: 'The outside tap is frozen.', steps: [['otap', 'Thaw']] }], pay: 60 },
];
// healthy parts say so (and give a reading where it helps)
const FINE = { ksink: 'Tap and drain working fine.', basin: 'Tap and drain working fine.', wc: 'Flushes and fills fine.', shower: 'Head and drain look fine.', heater: 'Lit, pressure 1.2 bar: fine.',
  rad: 'Warm all over: fine.', main: 'Stopcock fully open, meter turning: fine.', prv: 'Set to 3 bar: fine.', wm: 'Hoses and filter fine.', otap: 'Outside tap fine.', vent: 'Vent clear.', sewer: 'Drain running clear.', pipe: '' };
const FIRST = ['Ada', 'Bola', 'Carl', 'Dina', 'Emeka', 'Fay', 'Gus', 'Hana', 'Ivo', 'Jade', 'Kofi', 'Lena', 'Musa', 'Nell', 'Omar', 'Pia', 'Quinn', 'Rosa', 'Sam', 'Tunde', 'Uma', 'Vic', 'Wale', 'Xena', 'Yusuf', 'Zara', 'Aunty Grace', 'Old Mr Pike', 'Dr Okafor', 'Mrs Bell'];
const LAST = ['Adeyemi', 'Brown', 'Clarke', 'Diaz', 'Eze', 'Fischer', 'Green', 'Hughes', 'Ito', 'Jones', 'Khan', 'Lopez', 'Mensah', 'Novak', 'Obi', 'Patel', 'Reyes', 'Silva', 'Taylor', 'Usman', 'Walsh', 'Young'];
const STREETS = ['Mill Lane', 'Oak Road', 'Harbour St', 'Kings Way', 'Elm Close', 'Bridge St', 'Station Rd', 'Orchard Row', 'High St', 'Canal Walk', 'Chapel Hill', 'Rose Court'];
const HOUSES = ['cottage', 'semi', 'bungalow', 'townhouse', 'flat'];
const PLACES = [{ name: 'Brookside', sky: ['#9fd4f0', '#e8f4fa'] }, { name: 'Old Town', sky: ['#f0c89a', '#faecd8'] }, { name: 'Harbour', sky: ['#8ec5d8', '#dbeef4'] }, { name: 'Hilltop', sky: ['#b8c8ea', '#eef0fa'] }];
const placeOf = N => Math.floor((N - 1) / 5) % 4;
const UPGRADES = [
  { id: 'wrench', name: 'Torque wrench', desc: 'Wider green on every hold and dial.', max: 3, cost: l => 50 + l * 60 },
  { id: 'camera', name: 'Pipe camera', desc: 'See what is wrong at a glance: no waiting to look.', max: 1, cost: l => 120 },
  { id: 'van', name: 'Faster van', desc: 'Shorter drives between houses.', max: 2, cost: l => 80 + l * 80 },
  { id: 'vac', name: 'Wet-vac', desc: 'Floods rise half as fast.', max: 1, cost: l => 100 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Apprentice'], [40, 'Plumber\'s mate'], [130, 'Plumber'], [320, 'Master plumber'], [700, 'Pipe wizard'], [1500, 'Legend of the pipes']];
function makeCfg(N, help) { const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), e = easyOf(N), boss = N % 10 === 0;
  return { N, f, help: !!help, place: placeOf(N), boss, day: Math.round(x(150, 190, 30)) + (help ? 25 : 0) + (boss ? 30 : 0),
    target: Math.round(x(550, 1650, 25) * (boss ? 1.25 : 1) / 10) * 10, band: x(0.24, 0.12, 25) * (1 + 0.18 * upLv('wrench')) * (help ? 1.2 : 1), win: x(0.17, 0.1, 25) * (help ? 1.2 : 1),
    pumps: Math.round(x(4, 7, 30)), feed: x(0.24, 0.16, 30), snag: x(0.7, 1.4, 30), patience: x(70, 42, 30), floodT: x(30, 16, 25) * (upLv('vac') ? 2 : 1) * (help ? 1.3 : 1),
    look: upLv('camera') ? 0.05 : x(0.8, 1.0, 30), drive: (1 - 0.2 * upLv('van')), urgent: x(0.1, 0.35, 30), ttl: x(26, 16, 30), calls: boss ? 4 : N >= 3 ? 3 : 2,
    jobs: JOBS.filter(j => j.lv <= N) }; }
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, place: cfg.place, wait: 0, next: null };
  setup(G); if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else G.ev.push({ k: 'start' });
  return G; }
function setup(G) { G.clock = G.cfg.day; G.cash = 0; G.jobsDone = 0; G.starsSum = 0; G.calls = []; G.phase = 'board'; G.job = null; G.drive = 0; G.spawnT = 0.3; G.fumble = 0; G.fumT = -99; G.done = []; G.lost = 0; G.callN = 0;
  for (let i = 0; i < G.cfg.calls; i++) G.calls.push(newCall(G, i === 0)); }
// a new call: a job this level knows, one of its causes, a house, a customer, the pay and the drive
function newCall(G, easyFirst) { const R = G.rnd, c = G.cfg; let pool = c.jobs; if (easyFirst) pool = pool.filter(j => !j.flood);
  // newer jobs come up more often on the level they appear, so each day has something new to learn
  const w = pool.map(j => (j.lv === G.N ? 3 : 1)); let u = R() * w.reduce((a, b) => a + b, 0), j = pool[0]; for (let i = 0; i < pool.length; i++) { u -= w[i]; if (u <= 0) { j = pool[i]; break; } }
  const cz = j.causes[(R() * j.causes.length) | 0], urgent = !!j.urgent || R() < c.urgent * 0.5, dist = 2 + R() * 4, at = j.at[(R() * j.at.length) | 0];
  const steps = cz.steps.map(([p, a]) => [p === '@' ? at : p, a]), pay = Math.round((j.pay + steps.length * 10 + dist * 3) * (urgent ? 1.35 : 1) * (0.9 + R() * 0.25) / 5) * 5;
  G.callN++; return { id: G.callN, job: j, cause: cz, at, steps, pay, dist, urgent, ttl: urgent ? c.ttl * 0.7 : c.ttl, age: 0, say: j.say[(R() * j.say.length) | 0],
    who: FIRST[(R() * FIRST.length) | 0] + ' ' + LAST[(R() * LAST.length) | 0], addr: (1 + ((R() * 98) | 0)) + ' ' + STREETS[(R() * STREETS.length) | 0], house: HOUSES[(R() * HOUSES.length) | 0], mirror: R() < 0.5, hue: (R() * 360) | 0, style: (R() * 4) | 0 }; }
// ---------- the house: where each part is (0..1 across, 0..1 down) ----------
const LAYOUT = { ksink: [0.2, 0.77], wm: [0.4, 0.79], main: [0.66, 0.83], prv: [0.79, 0.83], heater: [0.86, 0.67], basin: [0.14, 0.44], wc: [0.3, 0.46], shower: [0.47, 0.39], rad: [0.76, 0.46], vent: [0.36, 0.08], otap: [0.955, 0.76], sewer: [0.975, 0.9], pipe: [0.36, 0.555] };
function spot(G, id) { const p = LAYOUT[id], m = G.job && G.job.call.mirror; return [m && id !== 'otap' && id !== 'sewer' ? 0.96 - p[0] : p[0], p[1]]; }
function arrive(G, call) { const R = G.rnd, c = G.cfg;
  const parts = Object.keys(FIX).filter(k => k !== 'pipe' || call.job.id === 'burst');
  G.job = { call, steps: call.steps, si: 0, parts, mood: 1, t: 0, water: call.job.flood ? 0.08 : 0, flooding: !!call.job.flood, spray: false, mist: 0, me: 'main', walk: null, look: null, fix: null, busy: 0, tries: 0 };
  G.job.me = call.mirror ? 'heater' : 'ksink'; G.phase = 'job'; G.ev.push({ k: 'arrive', call }); }
const curStep = G => G.job && G.job.steps[G.job.si];
// ---------- what you do ----------
function takeCall(G, i) { if (G.over || G.wait > 0 || G.phase !== 'board') return false; const call = G.calls[i]; if (!call) return false;
  G.calls.splice(i, 1); G.phase = 'drive'; G.drive = call.dist * G.cfg.drive * 0.7; G.driveT = G.drive; G.driving = call; G.ev.push({ k: 'drive', call }); return true; }
// tap a part: walk to it, then look (a moment, or none with the camera)
function tapPart(G, id) { const J = G.job; if (G.over || G.wait > 0 || G.phase !== 'job' || !J || J.fix || J.busy > 0) return false; if (!J.parts.includes(id)) return false;
  if (J.look && J.look.id === id) return true; const a = spot(G, J.me), b = spot(G, id), d = Math.hypot(a[0] - b[0], (a[1] - b[1]) * 1.4);
  J.look = null; J.walk = { id, t: 0, dur: 0.25 + d * 1.1 }; G.ev.push({ k: 'walk', id }); return true; }
function closeLook(G) { const J = G.job; if (!J || J.fix) return; J.look = null; }
// pick one of the fixes on the part you are looking at
function act(G, k) { const J = G.job; if (G.over || G.wait > 0 || !J || J.fix || !J.look || J.busy > 0) return false; const id = J.look.id, name = FIX[id].acts[k]; if (!name) return false;
  const st = curStep(G);
  if (st && st[0] === id && st[1] === name) { startFix(G, name); return true; }
  // skipping the shut-off: water everywhere
  const later = J.steps.slice(J.si + 1).some(s => s[0] === id && s[1] === name);
  if (later && st[1] === 'Shut off') { mistake(G, 'spray', name); J.flooding = true; J.spray = true; if (!J.water) J.water = 0.05; return false; }
  mistake(G, 'wrong', name); return false; }
function mistake(G, why, name) { const J = G.job; if (G.lesson) { lessonMiss(G); return; }
  const quick = G.t - G.fumT < 8; G.fumT = G.t; G.fumble = quick ? G.fumble + 1 : 0;
  J.mood -= 0.12 * (1 + G.fumble); J.busy = 1.2 + 0.6 * G.fumble; J.tries++; G.ev.push({ k: 'mistake', why, name, n: G.fumble }); moodCheck(G); }
function moodCheck(G) { const J = G.job; if (J && J.mood <= 0 && G.phase === 'job') jobLost(G, 'angry'); }
function startFix(G, name) { const J = G.job, R = G.rnd, c = G.cfg, kind = HOW[name][0];
  const F = { name, kind, how: HOW[name][1], t: 0, ok: 0, need: name === 'Solder joints' ? 2 : 1 };
  if (kind === 'hold' || kind === 'end') { F.m = 0; F.rate = 0.45 + R() * 0.25; F.held = false; const w = c.band; F.a = kind === 'end' ? 0.9 : 0.5 + R() * (0.42 - w); F.b = kind === 'end' ? 1.0 : F.a + w; }
  if (kind === 'pump') { F.p = 0; F.T = 0.8 + R() * 0.35; F.hits = 0; F.need = c.pumps; F.prevEnd = -9; F.cyc = 0; }
  if (kind === 'feed') { F.prog = 0; F.st = 'ok'; F.stT = 0.8 + R() * 1.0; F.kinkT = 0; F.stall = 0; F.held = false; }
  if (kind === 'set') { F.v = R() < 0.5 ? 0.06 + R() * 0.12 : 0.82 + R() * 0.12; F.tgt = 0.3 + R() * 0.4; F.w = c.band * 0.85; F.drag = false; }
  if (kind === 'fit') { F.placed = false; }
  J.fix = F; J.look = null; G.phase = 'fix'; G.ev.push({ k: 'fix', name, kind }); }
// the hands-on controls (the view turns touches into these)
function press(G) { const F = G.job && G.job.fix; if (!F || G.over || G.wait > 0) return; if (F.kind === 'hold' || F.kind === 'end' || F.kind === 'feed') { F.held = true; G.ev.push({ k: 'press' }); } else if (F.kind === 'pump') pump(G); }
function lift(G) { const F = G.job && G.job.fix; if (!F || !F.held || G.over) return; F.held = false;
  if (F.kind === 'end') return;      /* turning a stopcock: let go and carry on later, it stays where it is */
  if (F.kind === 'hold') { if (F.m <= 0.02) return; if (F.m >= F.a && F.m <= F.b) fixGood(G); else if (F.m < F.a) { fixMiss(G, 'short'); F.m = 0; } else fixOver(G); } }
// a hit is a tap within a moment of the ring closing (just before or just after); one per beat; anything else pushes back
function pump(G) { const F = G.job.fix, w = G.cfg.win, early = (1 - F.p) * F.T, late = G.t - F.prevEnd;
  if (G.t - (F.lastHit == null ? -9 : F.lastHit) < 0.35 || !(early <= w || late <= w)) { F.hits = Math.max(0, F.hits - 1); fixMiss(G, 'beat'); return; }
  F.lastHit = G.t; F.hits++; G.ev.push({ k: 'plunge', n: F.hits, need: F.need }); if (F.hits >= F.need) fixGood(G); }
function dial(G, v) { const F = G.job && G.job.fix; if (!F || F.kind !== 'set' || G.over || G.wait > 0) return; F.v = clamp(v, 0, 1); F.drag = true; }
function dialDone(G) { const F = G.job && G.job.fix; if (!F || F.kind !== 'set' || !F.drag) return; F.drag = false; if (Math.abs(F.v - F.tgt) <= F.w / 2) fixGood(G); else fixMiss(G, 'off'); }
function drop(G, d) { const F = G.job && G.job.fix; if (!F || F.kind !== 'fit' || G.over || G.wait > 0) return; if (d < 0.6) { F.placed = true; fixGood(G); } else fixMiss(G, 'drop'); }
function fixMiss(G, why) { const J = G.job, F = J.fix; G.ev.push({ k: 'fixmiss', why, kind: F.kind });
  if (G.lesson) { if (why === 'short' || why === 'off' || why === 'drop') { lessonMiss(G, true); return; } lessonMiss(G); return; }
  const quick = G.t - G.fumT < 3; G.fumT = G.t; G.fumble = quick ? G.fumble + 1 : 0; J.mood -= 0.04 * (1 + G.fumble); moodCheck(G); }
function fixGood(G) { const J = G.job, F = J.fix; F.ok++; if (F.ok < F.need) { G.ev.push({ k: 'fixpart', n: F.ok, need: F.need }); if (F.kind === 'hold') { F.m = 0; F.rate = 0.45 + G.rnd() * 0.25; const w = G.cfg.band; F.a = 0.5 + G.rnd() * (0.42 - w); F.b = F.a + w; } return; }
  const st = curStep(G); G.ev.push({ k: 'fixed', name: F.name, part: st[0] }); if (st[1] === 'Shut off') { J.flooding = false; J.spray = false; } J.fix = null; J.si++; G.phase = 'job'; if (G.lesson) lessonSee(G, F.name);
  if (J.si >= J.steps.length) jobDone(G); }
function fixOver(G) { const J = G.job, F = J.fix; G.ev.push({ k: 'over', name: F.name }); if (G.lesson) { lessonMiss(G, true); return; }
  J.mood -= 0.15; J.busy = 1.0; F.m = 0; F.held = false; F.rate = 0.45 + G.rnd() * 0.25; moodCheck(G); }
function jobDone(G) { const J = G.job, call = J.call; if (G.lesson) return;
  const mood = clamp(J.mood, 0, 1), stars = mood > 0.78 ? 3 : mood > 0.5 ? 2 : 1, tip = stars === 3 ? Math.round(call.pay * 0.15 / 5) * 5 : 0, pay = Math.round(call.pay * (0.45 + 0.55 * mood) / 5) * 5 + tip;
  G.cash += pay; G.jobsDone++; G.starsSum += stars; G.done.push({ who: call.who, job: call.job.id, stars }); G.ev.push({ k: 'paid', pay, tip, stars, who: call.who, job: call.job.id });
  G.phase = 'paid'; G.wait = 1.6; G.next = () => { G.job = null; G.phase = 'board'; if (!goalCheck(G)) refill(G); }; }
function jobLost(G, why) { const J = G.job; G.lost++; G.ev.push({ k: 'joblost', why, who: J.call.who }); J.fix = null; G.phase = 'paid'; G.wait = 1.6; G.next = () => { G.job = null; G.phase = 'board'; refill(G); }; }
function refill(G) { while (G.calls.length < G.cfg.calls) G.calls.push(newCall(G)); }
function goalCheck(G) { if (G.lesson || G.over) return false; if (G.cash >= G.cfg.target) { G.ev.push({ k: 'goal' }); G.wait = 1.4; G.next = () => finish(G, true); return true; } return false; }
// walk away from a job you cannot do (it costs the call)
function leave(G) { const J = G.job; if (!J || G.phase !== 'job' || G.over || G.wait > 0 || G.lesson) return false; jobLost(G, 'left'); return true; }
function step(G, dt) { if (G.over || !(dt > 0)) return; G.t += dt;
  if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0) { G.wait = 0; const f = G.next; G.next = null; if (f) f(); } return; }
  if (!G.lesson) { G.clock -= dt; if (G.clock <= 0) { G.clock = 0; G.ev.push({ k: 'five' }); G.wait = 1.2; G.next = () => finish(G, false); return; } }
  // calls on the phone wait only so long
  if (!G.lesson) for (let i = G.calls.length - 1; i >= 0; i--) { const c = G.calls[i]; c.age += dt; if (c.age > c.ttl) { G.calls.splice(i, 1); G.ev.push({ k: 'expired', who: c.who }); } }
  if (!G.lesson && G.calls.length < G.cfg.calls) { G.spawnT -= dt; if (G.spawnT <= 0) { G.calls.push(newCall(G)); G.spawnT = 2 + G.rnd() * 3; G.ev.push({ k: 'ring' }); } }
  if (G.phase === 'drive') { G.drive -= dt; if (G.drive <= 0) { const c = G.driving; G.driving = null; arrive(G, c); } return; }
  const J = G.job; if (!J || (G.phase !== 'job' && G.phase !== 'fix')) return;
  J.t += dt; if (J.busy > 0) J.busy -= dt;
  if (!G.lesson) { J.mood -= dt / G.cfg.patience * 0.5; moodCheck(G); if (!G.job || G.phase === 'paid') return; }
  if (J.flooding) { J.water += dt / G.cfg.floodT; J.mood = Math.min(J.mood, 1.08 - J.water * 0.7); if (J.water >= 1) { if (G.lesson) { lessonMiss(G, true); return; } J.water = 1; jobLost(G, 'flood'); return; } }
  if (J.walk) { J.walk.t += dt; if (J.walk.t >= J.walk.dur) { J.me = J.walk.id; J.look = { id: J.walk.id, t: 0, seen: false }; J.walk = null; G.ev.push({ k: 'look', id: J.me }); } }
  if (J.look && !J.look.seen) { J.look.t += dt; if (J.look.t >= G.cfg.look) { J.look.seen = true; const lt = lookText(G, J.look.id); J.seenParts = J.seenParts || {}; J.seenParts[J.look.id] = lt.bad ? 'bad' : 'ok'; J.found = J.found || []; if (!J.found.includes(lt.txt)) J.found.push(lt.txt); G.ev.push({ k: 'seen', id: J.look.id, bad: lt.bad, txt: lt.txt }); } }
  const F = J.fix; if (!F) return; F.t += dt;
  if ((F.kind === 'hold' || F.kind === 'end') && F.held) { F.m += F.rate * dt; if (F.kind === 'end' && F.m >= 1) { F.m = 1; F.held = false; fixGood(G); } else if (F.m > 1) { F.m = 1; F.held = false; fixOver(G); } }
  if (F.kind === 'pump') { F.p += dt / F.T; if (F.p >= 1) { F.p -= 1; F.prevEnd = G.t; F.T = 0.75 + G.rnd() * 0.45; F.cyc = (F.cyc | 0) + 1; } }
  if (F.kind === 'feed') { if (F.stall > 0) { F.stall -= dt; return; } F.stT -= dt;
    if (F.stT <= 0) { if (F.st === 'ok') { F.st = 'warn'; F.stT = 0.4; } else if (F.st === 'warn') { F.st = 'snag'; F.stT = 0.55 + G.rnd() * 0.5; G.ev.push({ k: 'snag' }); } else { F.st = 'ok'; F.stT = 0.6 + G.rnd() * (2.2 - G.cfg.snag); } }
    if (F.held) { if (F.st === 'snag') { F.kinkT += dt; if (F.kinkT > 0.18) { F.kinkT = 0; F.prog = Math.max(0, F.prog - 0.34); F.stall = 0.7; F.st = 'ok'; F.stT = 0.6 + G.rnd(); F.held = false; G.ev.push({ k: 'kink' }); fixMiss(G, 'kink'); } }
      else { F.prog += G.cfg.feed * dt; if (F.prog >= 1) { F.prog = 1; F.held = false; fixGood(G); } } } else F.kinkT = 0; } }
// what you find when you look at a part
function lookText(G, id) { const J = G.job, st = curStep(G); if (!J) return { txt: '', bad: false };
  if (st && st[0] === id) return { txt: st[1] === 'Shut off' ? 'The stopcock. Turn it off to stop the water.' : J.si === 0 ? J.call.cause.cause : (st[1] === 'Solder joints' ? 'New section in. Now solder the joints.' : st[1] === 'Tighten hose' ? 'Hose on. Tighten it.' : 'Next: ' + st[1].toLowerCase() + '.'), bad: true };
  if (J.steps.slice(J.si).some(s => s[0] === id)) return { txt: id === 'pipe' ? 'Water spraying everywhere. Shut the main off first!' : 'Water still on here. Shut the main off first.', bad: true };
  if (id === J.call.at && J.call.cause.weak) return { txt: 'Weak here, and at the other taps too. The problem is further back.', bad: false };
  if (id === J.call.at && J.call.job.id === 'bang') return { txt: 'The pipe jumps when the tap shuts. Pressure is too high somewhere.', bad: false };
  if (id === J.call.at && J.call.job.id === 'smell') return { txt: 'Trap is full of water. The smell is coming from the vent pipe.', bad: false };
  if (id === J.call.at && J.call.job.id === 'sewer') return { txt: 'Backing up from below. The blockage is further down the drain.', bad: false };
  if (id === J.call.at && J.call.job.id === 'nowater') return { txt: 'Nothing comes out. Check where the water comes in.', bad: false };
  if (id === 'main' && J.call.cause.weak && J.call.cause.at !== 'main') return { txt: 'Stopcock fully open. Pressure low after the valve.', bad: false };
  return { txt: FINE[id], bad: false }; }
function finish(G, win) { if (G.over) return true; G.over = win ? 'won' : 'lost'; const c = G.cfg, avg = G.jobsDone ? G.starsSum / G.jobsDone : 0;
  const stars = win ? 1 + (avg >= 2.6 ? 1 : 0) + (G.clock >= c.day * 0.25 ? 1 : 0) : 0;
  G.res = { win, stars, cash: G.cash, need: c.target, prog: Math.min(1, G.cash / c.target), jobs: G.jobsDone, avg, lost: G.lost, done: G.done, score: G.cash, coins: win ? 4 + Math.ceil(G.N / 3) + stars * 2 : 1 + Math.floor(Math.min(1, G.cash / c.target) * 4) };
  G.ev.push({ k: win ? 'won' : 'lost' }); return true; }
// ---------- LESSONS: a single rigged job; any slip starts it again ----------
const LESSONS = {
  1: [{ id: 'washer', title: 'A DRIPPING TAP', how: 'Tap the dripping kitchen tap to look at it. Pick NEW WASHER, then HOLD and let go in the green. Twice.', need: 2, job: 'drip' }],
  2: [{ id: 'plunge', title: 'PLUNGE IT', how: 'Tap the toilet, pick PLUNGE, then TAP each time the ring closes on the circle. Off-beat taps push the water back.', need: 1, job: 'wcclog' }],
  3: [{ id: 'burst', title: 'BURST PIPE!', how: 'Water everywhere! First SHUT OFF the main (the stopcock by the meter, downstairs), then fit a new section and solder it.', need: 1, job: 'burst' }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonDeal(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonDeal(G, keepN) { const st = lessonNow(G); if (!keepN) G.lesson.n = 0; G.calls = []; G.fumble = 0;
  const j = JOBS.find(q => q.id === st.job), call = { id: 0, job: j, cause: j.causes[0], at: j.at[0], steps: j.causes[0].steps.map(([p, a]) => [p === '@' ? j.at[0] : p, a]), pay: 0, dist: 0, urgent: false, ttl: 99, age: 0, say: j.say[0], who: 'Mrs Bell', addr: '12 Mill Lane', house: 'semi', mirror: false, hue: 30, style: 0 };
  arrive(G, call); }
function lessonMiss(G, slip) { const st = lessonNow(G); G.ev.push({ k: 'lessonmiss', how: st.how }); if (G.job) G.job.fix = null; G.phase = 'paid'; G.wait = 1.4; G.next = () => lessonDeal(G); }
function lessonSee(G, name) { const st = lessonNow(G); if (!st) return; const D = G.lesson, J = G.job; if (J.si < J.steps.length) return;      // the whole job must be done
  D.n += 1; G.ev.push({ k: 'lessonok', n: Math.min(D.n, st.need), need: st.need }); G.phase = 'paid';
  if (D.n >= st.need) { D.i++; G.wait = 1.5; if (D.i >= D.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.next = () => { G.rnd = rng(G.seed); setup(G); G.ev.push({ k: 'start' }); }; } else G.next = () => lessonDeal(G); }
  else { G.wait = 0.9; G.next = () => lessonDeal(G, true); } }
// ---------- for the robots ----------
// BLIND: a thumb that does not look: taps a call, a part of the house, a fix on the card; presses and lets go; drags a dial
// somewhere; drops a part somewhere
const BLIND = {
  c: G => takeCall(G, (Math.random() * 3) | 0),
  f: G => { const J = G.job; if (J) tapPart(G, J.parts[(Math.random() * J.parts.length) | 0]); },
  o: G => act(G, (Math.random() * 4) | 0),
  h: G => press(G), r: G => lift(G),
  d: G => { dial(G, Math.random()); dialDone(G); },
  x: G => drop(G, Math.random() * 3),
};
// a player who looks: picks a good call, goes to the part the complaint points at (or straight to the real one, if they know
// the trade), reads what the look says, picks the fix, and does it with a human hand (late, early, shaky)
function honest(G, o, mem) { const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random;
  if (G.over || G.wait > 0) { mem.t = 0; return; } mem.t = (mem.t || 0) + 1 / 60;
  if (G.phase === 'board') { if (mem.t < 1.6 + react * 4) return;      /* reading the calls */ mem.t = 0; let bi = -1, bv = -1e9; G.calls.forEach((c, i) => { const v = c.pay / (c.dist + 8 + c.steps.length * 5) + (c.ttl - c.age < 6 ? -2 : 0) + (R() - 0.5) * (1 - acc) * 4; if (v > bv) { bv = v; bi = i; } }); if (bi >= 0) takeCall(G, bi); return; }
  const J = G.job; if (!J || G.phase === 'paid') return;
  if (G.phase === 'job') { if (J.walk || J.busy > 0) return; const st = curStep(G); if (!st) return;
    if (!J.look) { if (mem.t < 0.8 + react * 2.5) return; mem.t = 0; mem.plan = mem.plan && mem.plan.job === J ? mem.plan : { job: J, tried: [] };
      // where to look: a sharp one goes straight to the cause; otherwise the part the customer named first, then the main, then the rest
      let tgt = st[0]; const know = 0.45 + acc * 0.45; if (R() > know) { const order = [J.call.at, 'main', 'prv', 'heater', 'vent', 'sewer'].filter(p => J.parts.includes(p) && !mem.plan.tried.includes(p)); if (order.length) tgt = order[0]; }
      mem.plan.tried.push(tgt); tapPart(G, tgt); return; }
    if (!J.look.seen) return; if (mem.t < 1.0 + react * 3) return;      /* reading what the look says */ mem.t = 0;
    if (J.look.id !== st[0]) { J.look = null; return; }
    const acts = FIX[st[0]].acts, k = R() < acc + (1 - acc) * 0.6 ? acts.indexOf(st[1]) : (R() * acts.length) | 0; act(G, k); return; }
  if (G.phase === 'fix') { const F = J.fix; if (!F) return; const sl = 0.05 + (1 - acc) * 0.25 + react * 0.08;
    if (F.kind === 'hold' || F.kind === 'end') { if (!F.held) { if (mem.t < 0.3 + react) return; mem.t = 0; mem.aim = (F.a + F.b) / 2 + (R() - 0.5) * 2 * (F.b - F.a) * sl * 2.2 + react * 0.04; press(G); } else if (F.m >= mem.aim) lift(G); return; }
    if (F.kind === 'pump') { if (mem.jit == null) mem.jit = 0.02; const lead = (1 - F.p) * F.T; if (mem.cyc !== F.cyc && lead < mem.jit) { mem.cyc = F.cyc; pump(G); mem.jit = Math.abs((R() + R() + R() - 1.5) * sl * 0.6) + 0.01; } return; }
    if (F.kind === 'feed') { const lag = 0.12 + react * 0.4; if (F.st === 'ok') { if (!F.held) { mem.rel = (mem.rel || 0) + 1 / 60; if (mem.rel > lag) { press(G); mem.rel = 0; } } } else if (F.held) { mem.cut = (mem.cut || 0) + 1 / 60; if (mem.cut > lag * (F.st === 'warn' ? 1 : 0.5)) { lift(G); mem.cut = 0; } } else mem.cut = 0; return; }
    if (F.kind === 'set') { if (mem.t < 0.5 + react * 1.5) return; mem.t = 0; dial(G, F.tgt + (R() - 0.5) * 2 * F.w * (0.25 + sl * 1.6)); dialDone(G); return; }
    if (F.kind === 'fit') { if (mem.t < 0.6 + react * 1.5) return; mem.t = 0; drop(G, R() < acc ? R() * 0.4 : 0.3 + R() * 0.8); return; } } }
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.wait = 0; G.cash = Math.max(G.cash, G.cfg.target); finish(G, true); }
