// ===================== RULES: Hiring (game 19) =====================
// You run hiring for a busy town agency. Three jobs are open, each pinned at the top with what it needs (two years in a
// kitchen, a driving licence, a certificate still in date, French, nights...). CVs come in one at a time. Read the CV, then drag
// it onto the job it fits, or into the bin if it fits none. Every CV fits exactly one job or none. A wrong placement is a
// complaint; two complaints and the day is over. Later: more needs per job, near misses (two and a half years when three are
// needed, a certificate that ran out last month), and candidates who will not wait for ever. 2D on purpose: papers read better flat.

const RULES = [
  '<b>Three jobs are open</b> at the top, each with what it needs.',
  '<b>Read the CV</b>, then drag it onto the job it fits, everything the job asks for.',
  '<b>Fits none?</b> Drag it into the bin.',
  'Certificates run out: check the date against today\'s, top right.',
  'Two wrong placements and the day is over. Later, candidates will not wait for ever.',
];
const TODAY = { d: 17, m: 11, y: 2026 };
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FEM = ['Amara', 'Grace', 'Sofia', 'Mia', 'Ada', 'Zara', 'Chloe', 'Lucia', 'Hannah', 'Ella', 'Nora', 'Fatima', 'Ngozi', 'Aisha'], MAS = ['Tunde', 'Liam', 'Kofi', 'Omar', 'Noah', 'Ibrahim', 'Emeka', 'Ravi', 'Yusuf', 'Chidi', 'Leo', 'Sam', 'Diego', 'Femi'];
const LAST = ['Okafor', 'Smith', 'Adeyemi', 'Garcia', 'Mensah', 'Novak', 'Bello', 'Rossi', 'Khan', 'Eze', 'Brown', 'Silva', 'Nwosu', 'Dubois', 'Patel', 'Lee', 'Ibe', 'Moreau'];
const ABOUT = ['I never give up.', 'Ask me about my sourdough.', 'I have a dog called Biscuit.', 'Calm under pressure.', 'I run every morning.', 'I sing in a choir.', 'Team player, early riser.', 'I once met the mayor.', 'Fluent in sarcasm.', 'I like a tidy desk.', 'I can fix almost anything.', 'People say I am very patient.'];
// the things a job can need, each a test on a CV and a way to make a CV pass or just fail it
const LANGS = ['French', 'Spanish', 'Arabic', 'Yoruba', 'German', 'Chinese'];
const NEEDS = {
  exp: { say: (n, a) => `${a.n}+ years ${a.as}`, test: (cv, a) => cv.work.filter(w => w.field === a.field).reduce((s, w) => s + w.yrs, 0) >= a.n },
  cert: { say: (n, a) => `${a.cert} (in date)`, test: (cv, a) => cv.certs.some(c => c.name === a.cert && dateGE(c.until, TODAY)) },
  licence: { say: (n, a) => a.max != null ? `Driving licence, ${a.max} points at most` : 'Driving licence', test: (cv, a) => cv.licence && (a.max == null || cv.points <= a.max) },
  lang: { say: (n, a) => `Speaks ${a.lang}`, test: (cv, a) => cv.langs.includes(a.lang) },
  nights: { say: () => 'Can work nights', test: cv => cv.avail.includes('nights') },
  weekends: { say: () => 'Can work weekends', test: cv => cv.avail.includes('weekends') },
  age: { say: (n, a) => `Aged ${a.n} or over`, test: (cv, a) => ageOf(cv) >= a.n },
  near: { say: (n, a) => `Lives within ${a.km} km`, test: (cv, a) => cv.km <= a.km },
};
const JOBS = [
  { id: 'chef', name: 'Chef', field: 'kitchen', as: 'in a kitchen', cert: 'Food hygiene', extra: ['nights', 'weekends'] },
  { id: 'driver', name: 'Van driver', field: 'driving', as: 'driving', lic: true, extra: ['near', 'age'] },
  { id: 'nurse', name: 'Night nurse', field: 'nursing', as: 'nursing', cert: 'Nursing registration', extra: ['nights', 'lang'] },
  { id: 'guard', name: 'Lifeguard', field: 'lifeguard', as: 'as a lifeguard', cert: 'Pool lifesaving', extra: ['age', 'weekends'] },
  { id: 'recep', name: 'Hotel reception', field: 'hotel', as: 'in a hotel', lang: true, extra: ['weekends', 'near'] },
  { id: 'teach', name: 'Teacher', field: 'teaching', as: 'teaching', cert: 'Teaching licence', extra: ['lang', 'near'] },
  { id: 'mech', name: 'Mechanic', field: 'garage', as: 'in a garage', lic: true, extra: ['weekends', 'age'] },
  { id: 'guide', name: 'Tour guide', field: 'tours', as: 'guiding tours', lang: true, extra: ['licence', 'weekends'] },
];
const FIELDS = ['kitchen', 'driving', 'nursing', 'lifeguard', 'hotel', 'teaching', 'garage', 'tours', 'retail', 'office', 'farming'];
const WORKAS = { kitchen: ['Line cook', 'Kitchen porter', 'Sous chef'], driving: ['Delivery driver', 'Taxi driver', 'Courier'], nursing: ['Ward nurse', 'Care nurse'], lifeguard: ['Beach lifeguard', 'Pool lifeguard'], hotel: ['Front desk', 'Concierge'], teaching: ['Teaching assistant', 'Maths teacher'], garage: ['Mechanic', 'Tyre fitter'], tours: ['City guide', 'Museum guide'], retail: ['Shop assistant', 'Cashier'], office: ['Office clerk', 'Data entry'], farming: ['Farm hand', 'Gardener'] };
const CERTS = ['Food hygiene', 'Nursing registration', 'Pool lifesaving', 'Teaching licence', 'First aid'];
const dateGE = (a, b) => a.y !== b.y ? a.y > b.y : a.m !== b.m ? a.m > b.m : a.d >= b.d;
const ageOf = cv => TODAY.y - cv.born - (cv.bornM > TODAY.m ? 1 : 0);

function makeCfg(N, help) {
  const f = curve(N), e = easyOf(N), boss = N % 10 === 0, x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s));
  return { N, f, e, boss, help: !!help, lives: 2,
    cvs: Math.round(x(10, 15, 30)) + (boss ? 2 : 0),
    needs: N <= 1 ? 1 : N <= 4 ? 2 : Math.min(4, Math.round(x(2, 4.4, 25))),       // needs per job
    near: clamp((f - 3) / 30, 0, 0.85),                                          // how often a CV misses by a hair
    patience: N < 8 ? 0 : x(60, 16, 30) * (help ? 1.3 : 1),                         // seconds a candidate will wait (0: for ever)
    dates: N >= 3 };
}
// three jobs for the day, each with its needs
function makeJobs(G) {
  const c = G.cfg, R = G.rnd, pool = JOBS.slice(); const jobs = [];
  for (let i = 0; i < 3; i++) { const J = pool.splice((R() * pool.length) | 0, 1)[0], needs = [];
    needs.push({ k: 'exp', field: J.field, as: J.as, n: c.needs <= 1 ? 1 : 1 + ((R() * (c.f > 10 ? 4 : 3)) | 0) });
    if (J.cert && c.dates) needs.push({ k: 'cert', cert: J.cert }); else if (J.lic) needs.push({ k: 'licence', max: c.f > 12 && R() < 0.5 ? 3 + ((R() * 4) | 0) : null }); else if (J.lang) needs.push({ k: 'lang', lang: pick(R, LANGS) });
    for (const ex of J.extra) { if (needs.length >= c.needs) break; needs.push(ex === 'lang' ? { k: 'lang', lang: pick(R, LANGS) } : ex === 'age' ? { k: 'age', n: pick(R, [18, 21, 25]) } : ex === 'near' ? { k: 'near', km: pick(R, [5, 10, 15, 20]) } : ex === 'licence' ? { k: 'licence', max: null } : { k: ex }); }
    jobs.push({ id: J.id, name: J.name, needs: needs.slice(0, Math.max(1, c.needs)) }); }
  return jobs;
}
const fits = (cv, job) => job.needs.every(n => NEEDS[n.k].test(cv, n));
const fitsOf = (G, cv) => G.jobs.map((j, i) => fits(cv, j) ? i : -1).filter(i => i >= 0);
// a CV made to fit job t (or none: t = -1), failing every other job by at least one need
function makeCV(G, t) {
  const c = G.cfg, R = G.rnd;
  for (let tries = 0; tries < 80; tries++) {
    const fem = R() < 0.5, cv = { name: pick(R, fem ? FEM : MAS) + ' ' + pick(R, LAST), born: TODAY.y - (19 + ((R() * 30) | 0)), bornM: 1 + ((R() * 12) | 0), km: 1 + ((R() * 30) | 0), licence: R() < 0.5, points: 0, langs: ['English'], avail: [], work: [], certs: [], about: pick(R, ABOUT), face: (R() * 1e6) | 0, female: fem };
    if (cv.licence) cv.points = R() < 0.6 ? 0 : 3 + ((R() * 7) | 0);
    if (R() < 0.45) cv.langs.push(pick(R, LANGS));
    if (R() < 0.5) cv.avail.push('weekends'); if (R() < 0.4) cv.avail.push('nights');
    // a working life: two or three jobs
    const fs = []; for (let i = 0; i < 1 + ((R() * 2) | 0); i++) fs.push(pick(R, FIELDS));
    for (const fl of fs) cv.work.push({ field: fl, as: pick(R, WORKAS[fl]), yrs: 1 + ((R() * 3) | 0) });
    for (let i = 0; i < ((R() * 2) | 0); i++) { const nm = pick(R, CERTS); cv.certs.push({ name: nm, until: randDate(R, R() < 0.6) }); }
    // make it meet every need of the target job
    if (t >= 0) for (const n of G.jobs[t].needs) satisfy(cv, n, R);
    // near misses: sometimes break one need of a job by a hair (if that job is not the target, it stays a miss)
    const victims = t >= 0 ? G.jobs.map((j, i) => i).filter(i => i !== t) : [0, 1, 2];
    if (t < 0 && R() < 0.85) { const v = pick(R, victims), J = G.jobs[v]; for (const n of J.needs) satisfy(cv, n, R); breakOne(cv, pick(R, J.needs), R, R() < c.near); }
    else if (R() < c.near) { const v = pick(R, victims), J = G.jobs[v]; for (const n of J.needs) satisfy(cv, n, R); breakOne(cv, pick(R, J.needs), R, true); if (t >= 0) for (const n of G.jobs[t].needs) satisfy(cv, n, R); }
    const f = fitsOf(G, cv); if (t >= 0 ? (f.length === 1 && f[0] === t) : f.length === 0) { cv.work = shuffleW(cv.work, R); return cv; }
  }
  return null;
}
function shuffleW(a, R) { for (let i = a.length - 1; i > 0; i--) { const j = (R() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }
function randDate(R, valid) { if (valid) return { d: 1 + ((R() * 28) | 0), m: 1 + ((R() * 12) | 0), y: TODAY.y + 1 + ((R() * 3) | 0) }; return { d: 1 + ((R() * 28) | 0), m: 1 + ((R() * 12) | 0), y: TODAY.y - 1 - ((R() * 3) | 0) }; }
function satisfy(cv, n, R) {
  if (n.k === 'exp') { const have = cv.work.filter(w => w.field === n.field).reduce((s, w) => s + w.yrs, 0); if (have < n.n) cv.work.push({ field: n.field, as: pick(R, WORKAS[n.field]), yrs: n.n - have + ((R() * 2) | 0) }); }
  if (n.k === 'cert') { cv.certs = cv.certs.filter(c2 => c2.name !== n.cert); cv.certs.push({ name: n.cert, until: randDate(R, true) }); }
  if (n.k === 'licence') { cv.licence = true; if (n.max != null && cv.points > n.max) cv.points = ((R() * (n.max + 1)) | 0); }
  if (n.k === 'lang' && !cv.langs.includes(n.lang)) cv.langs.push(n.lang);
  if (n.k === 'nights' && !cv.avail.includes('nights')) cv.avail.push('nights');
  if (n.k === 'weekends' && !cv.avail.includes('weekends')) cv.avail.push('weekends');
  if (n.k === 'age' && ageOf(cv) < n.n) cv.born = TODAY.y - n.n - 1 - ((R() * 15) | 0);
  if (n.k === 'near' && cv.km > n.km) cv.km = 1 + ((R() * n.km) | 0);
}
// fail one need; by a hair if hair (one year short, a certificate that ran out weeks ago, one point too many, a year too young)
function breakOne(cv, n, R, hair) {
  if (n.k === 'exp') { const ws = cv.work.filter(w => w.field === n.field); cv.work = cv.work.filter(w => w.field !== n.field); if (hair && n.n > 1) cv.work.push({ field: n.field, as: pick(R, WORKAS[n.field]), yrs: n.n - 1 }); }
  if (n.k === 'cert') { const c2 = cv.certs.find(q => q.name === n.cert); if (hair || c2) { cv.certs = cv.certs.filter(q => q.name !== n.cert); cv.certs.push({ name: n.cert, until: hair ? { d: 1 + ((R() * 27) | 0), m: TODAY.m - 1 - ((R() * 3) | 0), y: TODAY.y } : randDate(R, false) }); } }
  if (n.k === 'licence') { if (n.max != null && hair) { cv.licence = true; cv.points = n.max + 1 + ((R() * 3) | 0); } else { cv.licence = false; cv.points = 0; } }
  if (n.k === 'lang') cv.langs = cv.langs.filter(l => l !== n.lang);
  if (n.k === 'nights') cv.avail = cv.avail.filter(a => a !== 'nights');
  if (n.k === 'weekends') cv.avail = cv.avail.filter(a => a !== 'weekends');
  if (n.k === 'age') { cv.born = TODAY.y - n.n + (hair ? 0 : 3); cv.bornM = hair ? 12 : cv.bornM; }
  if (n.k === 'near') cv.km = n.km + (hair ? 1 + ((R() * 2) | 0) : 5 + ((R() * 20) | 0));
}
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null,
    jobs: null, cv: null, done: 0, right: 0, wrong: 0, lives: cfg.lives, streak: 0, bestStreak: 0, wait: 0, gap: 0.5, placed: [0, 0, 0], binned: 0 };
  G.jobs = makeJobs(G);
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G);
  return G;
}
function nextCV(G) {
  const L = lessonNow(G), R = G.rnd; let t;
  if (L && L.want != null) t = L.want === 'bin' ? -1 : (R() * 3) | 0; else t = R() < 0.25 ? -1 : (R() * 3) | 0;
  const cv = makeCV(G, t) || makeCV(G, -1); cv.t = t; cv.fit = fitsOf(G, cv); G.cv = cv; G.wait = 0; G.ev.push({ k: 'cv' });
}
// ---------- the thumb ----------
// place the CV: to = 0, 1, 2 (a job) or -1 (the bin)
function place(G, to) {
  const cv = G.cv; if (G.over || !cv || G.gap > 0) return; const c = G.cfg, ok = to < 0 ? cv.fit.length === 0 : cv.fit.includes(to);
  G.cv = null; G.gap = 0.45; G.done++;
  if (to >= 0) G.placed[to]++; else G.binned++;
  if (ok) { G.right++; G.streak++; G.bestStreak = Math.max(G.bestStreak, G.streak); G.ev.push({ k: 'right', to, n: G.streak, name: cv.name }); lessonSee(G, to < 0 ? 'bin' : 'hire'); }
  else { G.streak = 0; G.ev.push({ k: 'wrong', to, fit: cv.fit, why: whyNot(G, cv, to), name: cv.name }); if (G.lesson) { lessonMiss(G, 'wrong'); G.done--; return; } G.wrong++; G.lives--; if (G.lives <= 0) { finish(G, false, 'complaints'); return; } }
  if (!G.lesson && G.done >= c.cvs) finish(G, true);
}
// why it was wrong, in a few words (honest feedback, P4)
function whyNot(G, cv, to) {
  if (to < 0) return `fits ${G.jobs[cv.fit[0]].name}`;
  const n = G.jobs[to].needs.find(q => !NEEDS[q.k].test(cv, q)); if (!n) return '';
  return { exp: 'not enough experience', cert: cv.certs.some(q => q.name === n.cert) ? 'certificate out of date' : 'no certificate', licence: cv.licence ? 'too many points' : 'no licence', lang: `no ${n.lang}`, nights: 'no nights', weekends: 'no weekends', age: 'too young', near: 'lives too far' }[n.k];
}
// ---------- every frame ----------
function step(G, dt) {
  if (G.over) return; G.t += dt; const c = G.cfg;
  if (G.gap > 0) { G.gap -= dt; if (G.gap <= 0 && !G.cv) nextCV(G); return; }
  if (!G.cv) { nextCV(G); return; }
  G.wait += dt;
  if (c.patience && !G.lesson && G.wait >= c.patience) { const cv = G.cv; G.cv = null; G.gap = 0.45; G.done++; G.streak = 0; G.wrong++; G.lives--; G.ev.push({ k: 'left', name: cv.name }); if (G.lives <= 0) { finish(G, false, 'waited'); return; } if (G.done >= c.cvs) finish(G, true); }
}
function finish(G, win, why) {
  G.over = win ? 'won' : 'lost';
  G.res = { win, why, stars: win ? (G.wrong === 0 ? 3 : 2) : 0, right: G.right, done: G.done, cvs: G.cfg.cvs, wrong: G.wrong, combo: G.bestStreak, time: G.t };
  G.ev.push({ k: win ? 'won' : 'lost', why });
}
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'hire', title: 'FIND THE JOB IT FITS', say: 'DRAG IT TO ITS JOB', do: 'drag', dir: 'up', how: 'Read the CV. Which job at the top does it fit? Drag the CV onto that job.', need: 2, ok: w => w === 'hire', want: 'job' },
      { id: 'bin', title: 'FITS NONE? THE BIN', say: 'NO JOB? DRAG TO THE BIN', do: 'drag', dir: 'down', how: 'This one fits none of the three jobs. Drag it down into the bin.', need: 1, ok: w => w === 'bin', want: 'bin' }],
  2: [{ id: 'two', title: 'EVERYTHING IT ASKS FOR', say: 'IT NEEDS BOTH', do: 'drag', dir: 'up', how: 'Jobs now need two things. The CV must have both. Drag it onto the job, or the bin.', need: 3, ok: w => w === 'hire' || w === 'bin' }],
  3: [{ id: 'dates', title: 'IN DATE?', say: 'CHECK THE DATE', do: 'drag', dir: 'up', how: 'Certificates run out. Look at the date it runs until, and today\'s date at the top right. Out of date: it does not count.', need: 3, ok: w => w === 'hire' || w === 'bin' }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0, miss: 0 }; G.ev.push({ k: 'lessonnext', first: true }); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonSee(G, what) {
  const D = G.lesson; if (!D) return; const st = D.steps[D.i]; if (!st.ok(what)) return;
  D.n++; if (D.n < st.need) { G.ev.push({ k: 'lessonok', n: D.n, need: st.need }); return; }
  D.i++; D.n = 0; D.miss = 0;
  if (D.i >= D.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); Object.assign(G, { done: 0, right: 0, wrong: 0, lives: G.cfg.lives, streak: 0, bestStreak: 0 }); }
  else G.ev.push({ k: 'lessonnext' });
}
function lessonMiss(G, why) { const D = G.lesson; if (!D) return; D.miss++; G.ev.push({ k: 'lessonmiss', why, how: D.steps[D.i].how }); }

// ---------- for the robots ----------
// BLIND: drag the CV to a job (first, second, third) or the bin without reading it.
const BLIND = { a: G => place(G, 0), b: G => place(G, 1), c: G => place(G, 2), x: G => place(G, -1) };
// a person who reads: takes time to read (more needs, more time), now and then misses a detail (more often a near miss)
function honest(G, o, mem) {
  const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, cv = G.cv; if (!cv) { mem.cv = null; return; }
  if (mem.cv !== cv) { mem.cv = cv; const n = G.jobs.reduce((s, j) => s + j.needs.length, 0); mem.at = G.t + 0.8 + react * (2 + n * 0.9) + Math.random() * react * 3; mem.slip = Math.random() > Math.pow(acc, 0.2 + G.cfg.needs * 0.12 + G.cfg.near * 0.6); }
  if (G.t < mem.at) return;
  let to = cv.fit.length ? cv.fit[0] : -1;
  if (mem.slip) { const opts = [-1, 0, 1, 2].filter(q => q !== to); to = pick(Math.random, opts); }
  place(G, to);
}
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.done = G.cfg.cvs - 1; G.lives = G.cfg.lives; G.gap = 0; if (!G.cv) nextCV(G); place(G, G.cv.fit.length ? G.cv.fit[0] : -1); }
