
// ===================== RULES: Black Keys (game 61, set 11: "a game like Piano Tiles: tap the black tile, it slowly goes faster") =====================
// Four lanes; rows of tiles scroll down the screen. Every row has a black tile (sometimes two). Tap the black tiles; each one
// plays the next note of the song, so as you play, the music plays. Tap a white space, or let a black tile slide off the
// bottom, and it is over. LONG tiles: hold your thumb on them as they pass for bonus and a held note (letting go early is no
// failure, you just miss the bonus). DOUBLE rows: two black tiles at once, one for each thumb. The song speeds up as it goes.
// Tap the START tile to begin. Finish the song and the ENCORE starts: the opening again, faster, for the third star.
// Levels are songs (all old enough to belong to everyone); later levels play them faster.
const RULES = [
  'Tap <b>START</b>, then tap every <b>black tile</b>. Each one plays the next note of the song.',
  'Never tap the <b>white</b>, and never let a black tile slide off the bottom.',
  '<b>Long tiles</b>: hold your thumb on them as they pass (letting go early only loses the bonus). <b>Double</b> rows: tap both.',
  'It gets faster as the song goes. Finish it for the <b>ENCORE</b>: the opening again, faster still.',
  'Stars: finish the song · hold every long tile · survive the encore.',
];
// ---------- the songs (the melody; ":" after a note makes it a long tile of two rows, "::" three) ----------
const SONGS = [
  { name: 'Twinkle, Twinkle', by: 'traditional', tempo: 1.0, m: 'C4 C4 G4 G4 A4 A4 G4: F4 F4 E4 E4 D4 D4 C4: G4 G4 F4 F4 E4 E4 D4: G4 G4 F4 F4 E4 E4 D4: C4 C4 G4 G4 A4 A4 G4: F4 F4 E4 E4 D4 D4 C4:' },
  { name: 'Ode to Joy', by: 'Beethoven', tempo: 1.0, m: 'E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 E4 D4 D4: E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 D4 C4 C4: D4 D4 E4 C4 D4 E4 F4 E4 C4 D4 E4 F4 E4 D4 C4 D4 G3: E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 D4 C4 C4:' },
  { name: 'Frère Jacques', by: 'traditional', tempo: 1.05, m: 'C4 D4 E4 C4 C4 D4 E4 C4 E4 F4 G4: E4 F4 G4: G4 A4 G4 F4 E4 C4 G4 A4 G4 F4 E4 C4 C4 G3 C4: C4 G3 C4:' },
  { name: 'Jingle Bells', by: 'Pierpont', tempo: 1.1, m: 'E4 E4 E4: E4 E4 E4: E4 G4 C4 D4 E4:: F4 F4 F4 F4 F4 E4 E4 E4 E4 D4 D4 E4 D4: G4: E4 E4 E4: E4 E4 E4: E4 G4 C4 D4 E4:: F4 F4 F4 F4 F4 E4 E4 E4 G4 G4 F4 D4 C4::' },
  { name: 'Brahms\' Lullaby', by: 'Brahms', tempo: 0.95, m: 'E4 E4 G4: E4 E4 G4: E4 G4 C5 B4: A4 A4 G4: D4 E4 F4: D4 D4 E4 F4: D4 F4 B4 A4 G4 B4 C5::' },
  { name: 'Minuet in G', by: 'Petzold', tempo: 1.1, m: 'D5 G4 A4 B4 C5 D5 G4 G4 E5 C5 D5 E5 F#5 G5 G4 G4 C5 D5 C5 B4 A4 B4 C5 B4 A4 G4 F#4 G4 A4 B4 G4 A4: D5 G4 A4 B4 C5 D5 G4 G4 E5 C5 D5 E5 F#5 G5 G4 G4 C5 D5 C5 B4 A4 B4 C5 B4 A4 G4 A4 B4 A4 G4 F#4 G4:' },
  { name: 'Für Elise', by: 'Beethoven', tempo: 1.15, m: 'E5 D#5 E5 D#5 E5 B4 D5 C5 A4: C4 E4 A4 B4: E4 G#4 B4 C5: E4 E5 D#5 E5 D#5 E5 B4 D5 C5 A4: C4 E4 A4 B4: E4 C5 B4 A4: E5 D#5 E5 D#5 E5 B4 D5 C5 A4: C4 E4 A4 B4: E4 G#4 B4 C5: E4 E5 D#5 E5 D#5 E5 B4 D5 C5 A4: C4 E4 A4 B4: E4 C5 B4 A4:' },
  { name: 'Can-Can', by: 'Offenbach', tempo: 1.25, m: 'C4 D4 F4 E4 D4 G4 G4 G4 A4 E4 F4 D4 G4 G4 G4 A4 E4 F4 D4 G4 F4 E4 D4 C4: C4 D4 F4 E4 D4 G4 G4 G4 A4 E4 F4 D4 G4 G4 G4 A4 E4 F4 D4 G4 F4 E4 D4 C4:' },
  { name: 'Greensleeves', by: 'traditional', tempo: 1.0, m: 'A4 C5 D5: E5 F5 E5 D5: B4 G4 A4 B4 C5: A4 A4 G#4 A4 B4: G#4 E4: A4 C5 D5: E5 F5 E5 D5: B4 G4 A4 B4 C5 B4 A4 G#4 F#4 G#4 A4: A4::' },
  { name: 'The Entertainer', by: 'Joplin', tempo: 1.2, m: 'D4 D#4 E4 C5 E4 C5 E4 C5: C5 D5 D#5 E5 C5 D5 E5 B4 D5 C5: D4 D#4 E4 C5 E4 C5 E4 C5: A4 G4 F#4 A4 C5 E5 D5 C5 A4 D5: D4 D#4 E4 C5 E4 C5 E4 C5: C5 D5 D#5 E5 C5 D5 E5 B4 D5 C5: C5 D5 E5 C5 D5 E5 C5 D5 C5 E5 C5 D5 E5 C5 D5 C5 E5 C5 D5 E5 B4 D5 C5:' },
  { name: 'Mountain King', by: 'Grieg', tempo: 1.3, m: 'A3 B3 C4 D4 E4 C4 E4: D#4 B3 D#4: D4 A#3 D4: A3 B3 C4 D4 E4 C4 E4 A4 G4 E4 C4 E4 G4: A4 B4 C5 D5 E5 C5 E5: D#5 B4 D#5: D5 A#4 D5: A4 B4 C5 D5 E5 C5 E5 A5 G5 E5 C5 E5 G5:' },
  { name: 'Turkish March', by: 'Mozart', tempo: 1.3, m: 'B4 A4 G#4 A4 C5: D5 C5 B4 C5 E5: F5 E5 D#5 E5 B5 A5 G#5 A5 B5 A5 G#5 A5 C6: A5 B5 C6 B5 A5 G#5 A5 E5 F5 D5 C5 B4 A4: B4 A4 G#4 A4 C5: D5 C5 B4 C5 E5: F5 E5 D#5 E5 B5 A5 G#5 A5 B5 A5 G#5 A5 C6: A5 B5 C6 B5 A5 G#5 A5 E5 F5 D5 C5 B4 A4:' },
  { name: 'Prelude in C', by: 'Bach', tempo: 1.4, m: 'C4 E4 G4 C5 E5 G4 C5 E5 C4 E4 G4 C5 E5 G4 C5 E5 C4 D4 A4 D5 F5 A4 D5 F5 C4 D4 A4 D5 F5 A4 D5 F5 B3 D4 G4 D5 F5 G4 D5 F5 B3 D4 G4 D5 F5 G4 D5 F5 C4 E4 G4 C5 E5 G4 C5 E5 C4 E4 G4 C5 E5 G4 C5 E5 C4 E4 A4 E5 A5 A4 E5 A5 C4 E4 A4 E5 A5 A4 E5 A5 C4 D4 F#4 A4 D5 F#4 A4 D5 B3 D4 G4 D5 G5 G4 D5 G5 C4::' },
  { name: 'Spring', by: 'Vivaldi', tempo: 1.25, m: 'E5 G#5 G#5 G#5 F#5 E5 B5: B5 A5 G#5 G#5 G#5 F#5 E5 B5: B5 A5 G#5 A5 B5 A5 G#5 F#5 D#5 B4: E5 G#5 G#5 G#5 F#5 E5 B5: B5 A5 G#5 G#5 G#5 F#5 E5 B5: B5 A5 G#5 A5 B5 A5 G#5 F#5 E5::' },
  { name: 'Morning Mood', by: 'Grieg', tempo: 1.05, m: 'G4 E4 D4 C4 D4 E4 G4 E4 D4 C4 D4 E4 D4 E4 G4 E4 G4 A4 E4 A4 G4 E4 D4 C4: G4 E4 D4 C4 D4 E4 G4 E4 D4 C4 D4 E4 D4 E4 G4 E4 G4 A4 E4 A4 B4 G#4 F#4 E4:' },
  { name: 'When the Saints', by: 'traditional', tempo: 1.15, m: 'C4 E4 F4 G4:: C4 E4 F4 G4:: C4 E4 F4 G4: E4: C4: E4: D4:: E4 E4 D4 C4: C4 E4: G4 G4 F4:: E4 F4 G4: E4: C4: D4: C4::' },
];
const PLACES = [{ name: 'The Recital Room', glow: '#ffd38a' }, { name: 'The Jazz Club', glow: '#ff8a5a' }, { name: 'The Concert Hall', glow: '#a8c8ff' }, { name: 'The Opera House', glow: '#e8a8ff' }];
const placeOf = N => Math.floor((N - 1) / SONGS.length) % 4;
const UPGRADES = [
  { id: 'wide', name: 'Wide fingers', desc: 'Taps just beside a tile still count.', max: 2, cost: l => 40 + l * 50 },
  { id: 'calm', name: 'Steady hands', desc: 'Songs speed up a little less.', max: 1, cost: l => 70 },
  { id: 'grace', name: 'Second chance', desc: 'Once a song, a missed tile slides back for another try.', max: 1, cost: l => 90 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Beginner'], [40, 'Pupil'], [130, 'Player'], [320, 'Pianist'], [700, 'Virtuoso'], [1500, 'Maestro']];
const NAMES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const midiOf = t => { const m = /^([A-G])(#|b)?(-?\d)$/.exec(t); return 12 * (+m[3] + 1) + NAMES[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); };
function parseSong(s) { return s.m.split(/\s+/).filter(Boolean).map(t => { const n = (t.match(/:/g) || []).length; return { midi: midiOf(t.replace(/:/g, '')), len: n ? n + 1 : 1 }; }); }
function makeCfg(N, help) { const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), e = easyOf(N), si = (N - 1) % SONGS.length, song = SONGS[si];
  return { N, f, help: !!help, place: placeOf(N), si, song, v0: x(1.8, 8.5, 45) * (1 + (song.tempo - 1) * 0.5) * (1 - 0.15 * e) * (help ? 0.85 : 1), ramp: 0.25 * (1 - 0.3 * upLv('calm')),
    dbl: N <= 2 ? 0 : x(0.06, 0.2, 30), longs: true, tol: 0.14 + 0.16 * e + 0.06 * upLv('wide'), grace: upLv('grace') > 0 ? 1 : 0, encore: 16 }; }
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, place: cfg.place, wait: 0, next: null };
  build(G); if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else G.ev.push({ k: 'start' });
  return G; }
// lay the song out as rows of tiles: a START row, the song, then the encore (the opening again)
function build(G, notes0) { const c = G.cfg, R = rng(G.N * 7717 + 11), notes = notes0 || parseSong(c.song); G.rows = []; let at = 0, last = -1;
  const lane = (avoid) => { let l; do l = (R() * 4) | 0; while (l === last || (avoid != null && l === avoid)); return l; };
  const add = (n, enc) => { const kind = n.len > 1 && c.longs ? 'long' : (!enc || true) && R() < c.dbl && n.len === 1 ? 'double' : 'tap', l1 = lane(); let lanes = [l1], ms = [n.midi];
    if (kind === 'double') { let l2; do l2 = (R() * 4) | 0; while (l2 === l1); lanes = [l1, l2]; ms = [n.midi, n.midi - 12]; }
    last = lanes[lanes.length - 1]; G.rows.push({ i: at, len: kind === 'long' ? n.len : 1, kind, lanes, notes: ms, tapped: lanes.map(() => false), hold: 0, held: false, enc: !!enc }); at += kind === 'long' ? n.len : 1; };
  G.rows.push({ i: 0, len: 1, kind: 'start', lanes: [(R() * 4) | 0], notes: [], tapped: [false], hold: 0, enc: false }); last = G.rows[0].lanes[0]; at = 1;
  for (const n of notes) add(n, false); G.songEnd = at; G.songRows = G.rows.length - 1;
  if (!notes0) { const enc = notes.slice(0, c.encore); G.encAt = at + 1; at += 1; for (const n of enc) add(n, true); }
  G.total = at; G.pos = 0; G.v = c.v0; G.go = false; G.score = 0; G.tiles = 0; G.holdsAll = true; G.holdsN = 0; G.songDone = false; G.encDone = false; G.holds = {}; G.grace = c.grace; G.miss = null; G.ri = 0; }
const rowsAt = (G, y) => { for (let k = Math.max(0, G.ri - 2); k < G.rows.length; k++) { const r = G.rows[k]; if (r.i > y) break; if (y >= r.i && y < r.i + r.len) return r; } return null; };
// ---------- what you do: touch at lane (0-3) and height (in rows, from the bottom of the screen), lift ----------
function press(G, lane, yScreen, pid = 0) { if (G.over || G.wait > 0 || G.miss) return false; const y = G.pos + yScreen, tol = G.cfg.tol;
  if (!G.go) { const r0 = G.rows[0], hit = y >= 0 && y < 1 && (lane === r0.lanes[0] || Math.abs(G.lx - (r0.lanes[0] + 0.5)) < 0.5 + tol); if (!hit) return false; r0.tapped[0] = true; G.go = true; G.ev.push({ k: 'tap', row: r0, lane: r0.lanes[0], notes: [], kind: 'start' }); G.ev.push({ k: 'go' }); return true; }      /* before the start: only the START tile does anything */
  let row = rowsAt(G, y), k = row ? row.lanes.indexOf(lane) : -1;
  if (row && k >= 0 && row.tapped[k]) return true;      /* a grey tile already played: harmless */
  if (!row || k < 0) {      /* not on a black tile: is one just beside it (a fat finger)? */
    const near = []; for (const [dl, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) { const l2 = lane + dl, y2 = y + dy * tol * 1.6, r2 = rowsAt(G, y2); if (!r2 || l2 < 0 || l2 > 3) continue; const k2 = r2.lanes.indexOf(l2); if (k2 < 0 || r2.tapped[k2]) continue; const fx = yScreen % 1; if (dl && Math.abs(G.lx - (l2 + (dl > 0 ? 0 : 1))) > tol) continue; near.push([r2, k2]); }
    if (near.length) { [row, k] = near[0]; } else { wrong(G, lane, y); return false; } }
  row.tapped[k] = true; G.ev.push({ k: 'tap', row, lane: row.lanes[k], notes: [row.notes[k]], kind: row.kind });
  G.tiles++; G.score += 1; lessonSee(G, 'tap', row);
  if (row.kind === 'long') { row.held = true; G.holds[pid] = row; }
  if (row.kind === 'double' && row.tapped.every(Boolean)) lessonSee(G, 'double', row);
  return true; }
function lift(G, pid = 0) { const row = G.holds[pid]; if (!row) return; delete G.holds[pid]; if (row.held && row.hold < 1) { row.held = false; G.holdsAll = false; G.ev.push({ k: 'letgo', row }); } }
// a wrong touch, or a tile that got away: it is over (in a lesson: back to the start of the lesson)
function wrong(G, lane, y, missed) { if (G.over || G.miss) return; G.miss = { lane, y, missed: !!missed, t: 0 }; G.ev.push({ k: missed ? 'missed' : 'white', lane, y });
  if (G.lesson) { G.wait = 1.3; G.next = () => { G.ev.push({ k: 'lessonmiss', how: lessonNow(G).how }); lessonDeal(G); }; return; }
  if (missed && G.grace > 0) { G.grace--; G.wait = 1.0; G.next = () => { G.miss = null; G.pos = Math.max(0, y - 1.2); G.ev.push({ k: 'grace' }); }; return; }
  G.wait = 1.2; G.next = () => finish(G, G.songDone); }
function step(G, dt) { if (G.over || !(dt > 0)) return; G.t += dt;
  if (G.wait > 0) { G.wait -= dt; if (G.miss) G.miss.t += dt; if (G.wait <= 0) { G.wait = 0; const f = G.next; G.next = null; if (f) f(); } return; }
  if (!G.go || G.miss) return;
  const c = G.cfg, p = Math.min(1, G.pos / Math.max(1, G.songEnd)); G.v = (G.lesson ? 1.7 : c.v0) * (1 + (G.lesson ? 0 : c.ramp) * p) * (G.songDone ? 1.2 : 1); G.pos += G.v * dt;
  while (G.ri < G.rows.length && G.rows[G.ri].i + G.rows[G.ri].len < G.pos - 1) G.ri++;
  // long tiles held: fill, and finish when their top reaches the bottom
  for (const pid in G.holds) { const r = G.holds[pid]; r.hold = clamp((G.pos - r.i) / Math.max(0.5, r.len - 0.9), 0, 1); if (r.hold >= 1 && r.held) { r.held = false; G.holdsN++; G.score += r.len; G.ev.push({ k: 'held', row: r }); lessonSee(G, 'held', r); delete G.holds[pid]; } }
  // a black tile slid off the bottom
  for (let k = G.ri; k < G.rows.length; k++) { const r = G.rows[k]; if (r.i > G.pos) break; if (G.pos > r.i + 0.62 && r.tapped.some(t => !t)) { const l = r.lanes[r.tapped.indexOf(false)]; wrong(G, l, r.i + 0.3, true); return; } }
  if (!G.songDone && G.pos >= G.songEnd + 0.7) { G.songDone = true; const was = !!G.lesson; G.ev.push({ k: 'songdone' }); lessonSee(G, 'end'); if (was) return; }      /* a lesson's end is the lesson's business */
  if (G.songDone && !G.lesson && G.pos >= G.total + 0.7) { G.encDone = true; G.ev.push({ k: 'encoredone' }); G.wait = 0.8; G.next = () => finish(G, true); } }
function finish(G, win) { if (G.over) return true; G.over = win ? 'won' : 'lost'; const songTiles = G.rows.filter(r => !r.enc && r.kind !== 'start').reduce((a, r) => a + r.lanes.length, 0);
  const stars = win ? 1 + (G.holdsAll ? 1 : 0) + (G.encDone ? 1 : 0) : 0, prog = Math.min(1, G.pos / G.songEnd);
  G.res = { win, stars, score: G.score, tiles: G.tiles, prog, song: G.cfg.song.name, by: G.cfg.song.by, enc: G.encDone, holds: G.holdsAll, coins: win ? 4 + Math.ceil(G.N / 3) + stars * 2 : 1 + Math.floor(prog * 4) };
  G.ev.push({ k: win ? 'won' : 'lost' }); return true; }
// ---------- LESSONS: slow, no song to lose; a mistake starts the lesson again ----------
const LESSONS = {
  1: [{ id: 'tap', title: 'BLACK, NEVER WHITE', say: G => keysCue(G)[0], do: G => keysCue(G)[1], at: G => keysCue(G)[2], how: 'Tap START, then every black tile as it comes down. Never tap the white. Play the whole tune.', need: 1 }],
  2: [{ id: 'hold', title: 'LONG TILES', say: G => keysCue(G)[0], do: G => keysCue(G)[1], at: G => keysCue(G)[2], how: 'Put your thumb on a long tile and HOLD it until it has passed. Hold three long tiles.', need: 3 }],
  3: [{ id: 'double', title: 'TWO AT ONCE', say: G => keysCue(G)[0], do: G => keysCue(G)[1], at: G => keysCue(G)[2], how: 'Some rows have two black tiles: tap both, one thumb each. Play three double rows.', need: 3 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonDeal(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonDeal(G) { const st = lessonNow(G), c = G.cfg, keep = [c.v0, c.dbl, c.longs]; G.lesson.n = 0;
  const tune = parseSong(SONGS[0]).slice(0, 14).map(n => ({ midi: n.midi, len: 1 }));
  if (st.id === 'hold') { const t = parseSong(SONGS[1]).slice(0, 15); t.forEach((n, j) => { if (j % 4 === 3) n.len = 2; }); c.dbl = 0; build(G, t); }
  else if (st.id === 'double') { c.dbl = 0.45; c.longs = false; build(G, parseSong(SONGS[2]).slice(0, 18)); }
  else { c.dbl = 0; build(G, tune); }
  [c.v0, c.dbl, c.longs] = keep; G.v = 1.7; }
function lessonSee(G, what, row) { const st = lessonNow(G); if (!st) return;
  if (st.id === 'hold' && what === 'held') { G.lesson.n++; G.ev.push({ k: 'lessonok', n: G.lesson.n, need: st.need }); }
  if (st.id === 'double' && what === 'double') { G.lesson.n++; G.ev.push({ k: 'lessonok', n: G.lesson.n, need: st.need }); }
  if (what === 'end') { if (st.id === 'tap' || G.lesson.n >= st.need) done(); else { G.ev.push({ k: 'lessonmiss', how: st.how }); G.wait = 1.2; G.next = () => lessonDeal(G); } }
  function done() { G.lesson.i++; if (G.lesson.i >= G.lesson.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.wait = 1.6; G.next = () => { build(G); G.ev.push({ k: 'start' }); }; } else { G.wait = 1.2; G.next = () => lessonDeal(G); } } }
// ---------- for the robots ----------
// BLIND: a thumb that does not look: a tap somewhere on the screen; a press held; a lift
const BLIND = { t: G => { G.lx = Math.random() * 4; press(G, Math.floor(G.lx), Math.random() * 4, 0); lift(G, 0); }, h: G => { G.lx = Math.random() * 4; press(G, Math.floor(G.lx), Math.random() * 4, 1); }, r: G => lift(G, 1) };
// a player who looks: two thumbs, each needing a moment between taps (quicker when sharp); sees a tile once it has been on
// screen a moment, taps it when it is in the lower part of the screen, a little off centre (more so the faster it goes),
// holds long tiles until they pass (a careless one lets go early), and taps both tiles of a double row
// THE HAND IS ON THE NEXT BLACK TILE (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing happens"). It tapped in a
// box: the black tile is somewhere else and moving. Now the hand is on the next black tile to play (START at first), and says HOLD IT for a long
// one and TAP BOTH on a double row.
function keysCue(G) { if (G.over || G.wait > 0 || G.miss) return ['WAIT…', 'wait', false]; const L = lay(); let r = null, j = -1; for (let k2 = G.go ? G.ri : 0; k2 < G.rows.length && k2 < (G.go ? G.ri : 0) + 4; k2++) { const q = G.rows[k2], jj = q.lanes.findIndex((z, i) => !q.tapped[i]); if (jj >= 0) { r = q; j = jj; break; } }      /* the next row still to tap (the row just tapped stays G.ri a moment) */
  if (!r) return ['WAIT…', 'wait', false]; const yb = G.go ? r.i - G.pos : 0; if (yb > 2.4) return ['GET READY…', 'wait', false];
  const at = [(r.lanes[j] + 0.5) * L.lw, H - (Math.max(0.05, yb) + 0.5) * L.rh], long = r.kind === 'long';
  return [!G.go ? 'TAP START' : long ? 'HOLD IT' : r.lanes.length > 1 ? 'TAP BOTH' : 'TAP THE BLACK', long ? 'hold' : 'tap', at]; }
function honest(G, o, mem) { const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random, dt = 1 / 60;
  if (G.over || G.wait > 0 || G.miss) { mem.th = null; return; } if (!mem.th) mem.th = [{ free: 0, hold: null }, { free: 0, hold: null }]; mem.t = (mem.t || 0) + dt;
  const gap = 0.12 + react * 0.35;
  for (const [k, th] of mem.th.entries()) if (th.hold) { if (!G.holds[k + 2] || (R() > acc + (1 - acc) * 0.97 && th.hold.hold > 0.3)) { lift(G, k + 2); th.hold = null; th.free = mem.t + gap; } }
  if (!G.go) { const r = G.rows[0]; if (mem.t > 0.4 + react) { G.lx = r.lanes[0] + 0.5; press(G, r.lanes[0], 0.5, 0); lift(G, 0); } return; }
  for (let k = G.ri; k < G.rows.length; k++) { const r = G.rows[k], yb = r.i - G.pos;      /* yb: how far the row's bottom is above the bottom of the screen, in rows */
    if (yb > 4 - G.v * react || yb > 2.4) break;      /* not seen yet, or not low enough to tap yet */
    for (let j = 0; j < r.lanes.length; j++) { if (r.tapped[j]) continue; const th = mem.th.find(t => !t.hold && t.free <= mem.t); if (!th) return; const ti = mem.th.indexOf(th);
      const sd = (1 - acc) * 0.6 * (1 + G.v / 5), lx = r.lanes[j] + 0.5 + gs(R) * sd, ly = Math.max(0.05, yb + 0.5 + gs(R) * sd * 0.6); G.lx = lx;
      const ok = press(G, Math.floor(clamp(lx, 0, 3.999)), ly, r.kind === 'long' ? ti + 2 : 0);
      if (r.kind === 'long' && ok) th.hold = r; else lift(G, 0); th.free = mem.t + gap * (0.8 + 0.4 * R()); if (G.miss) return; } } }
const gs = R => { let s = 0; for (let i = 0; i < 4; i++) s += R(); return (s - 2) / 0.577; };
function winNow(G) { if (!G || G.over || G.wait > 0) return; G.lesson = null; G.songDone = true; G.encDone = true; G.pos = G.songEnd; finish(G, true); }
