
// ---------- part 2: the fight itself (no drawing, no sound: the test bots run this at full speed) ----------
// Distances are in metres, angles in radians, y is up. Everything here is game rules, tuned for fun, not a simulator.
const PH = {
  VMAX: 300, VMIN: 120, ACC: 62, DRAG: 28, K_TURN: 272, RATE_MAX: 1.62, PITCH_MAX: 0.72, FLOOR: 240, CEIL: 2600,
  LOCK_A: 0.25, LOCK_R: 1150, LOCK_T: 0.75, GUN_A: 0.07, GUN_R: 430, GUN_DPS: 80,
  FOE_A: 0.26, FOE_R: 1000, REAR: 1.45, SHOT_V: 540, SHOT_TURN: 3.4, SHOT_LIFE: 4.2, HIT_R: 16
};

// who you meet: built from long lists so the same bandit rarely comes round twice
const CALL = ['Viper', 'Jackal', 'Ghost', 'Razor', 'Cobra', 'Hawk', 'Wraith', 'Dagger', 'Saber', 'Talon', 'Raven', 'Mamba', 'Havoc', 'Fang', 'Blaze', 'Onyx', 'Reaper', 'Phantom', 'Switch', 'Tracer', 'Bolt', 'Scythe', 'Hornet', 'Wolf', 'Lynx', 'Banshee', 'Cinder', 'Drift', 'Echo', 'Flint', 'Grim', 'Hex', 'Iron', 'Jinx', 'Kite', 'Lancer', 'Maverick', 'Nomad', 'Omen', 'Pike', 'Quake', 'Rook', 'Spectre', 'Thorn', 'Umbra', 'Vandal', 'Warden', 'Zephyr', 'Ash', 'Bishop', 'Comet', 'Dusk', 'Ember', 'Frost', 'Gale', 'Harrier', 'Icarus', 'Javelin', 'Kestrel', 'Locust'];
const BOSS = ['Widowmaker', 'Black Baron', 'Night Witch', 'Iron Duke', 'Skull King', 'Red Empress', 'Lord Tempest', 'The Surgeon', 'Old Lightning', 'Queen Cobra', 'Grey Wolf', 'The Undertaker'];
const RANKS = ['Lt.', 'Capt.', 'Maj.', 'Cmdr.', 'Col.', 'Flt. Lt.', 'Sqn. Ldr.'];
const SURN = ['Okafor', 'Varga', 'Lindqvist', 'Moreau', 'Tanaka', 'Novak', 'Ferreira', 'Haddad', 'Kowalski', 'Brandt', 'Castillo', 'Dragan', 'Ekström', 'Falk', 'Guerra', 'Hoang', 'Ivanov', 'Jansen', 'Kimura', 'Lambert', 'Mbeki', 'Nilsen', 'Orlov', 'Petrov', 'Quintero', 'Rahimi', 'Sato', 'Tavares', 'Ueda', 'Vasquez', 'Weber', 'Xu', 'Yilmaz', 'Zielinski', 'Adeyemi', 'Bakr', 'Costa', 'Dumont', 'Eze', 'Fontaine', 'Gashi', 'Horvat', 'Ito', 'Juarez', 'Kovac', 'Larsen', 'Mancini', 'Nasser', 'Ozturk', 'Pavlov'];
const SQA = ['Crimson', 'Black', 'Iron', 'Silver', 'Golden', 'Midnight', 'Desert', 'Arctic', 'Storm', 'Scarlet', 'Phantom', 'Savage', 'Royal', 'Burning', 'Silent', 'Thunder', 'Ghost', 'Steel', 'Wild', 'Night'];
const SQB = ['Kestrels', 'Wolves', 'Scorpions', 'Lancers', 'Falcons', 'Jackals', 'Cobras', 'Tigers', 'Ravens', 'Hornets', 'Sharks', 'Panthers', 'Eagles', 'Hounds', 'Vipers', 'Dragons', 'Hawks', 'Lions', 'Owls', 'Stallions'];
const FRAMES = ['twin', 'delta', 'swept'], FRAME_NAME = { twin: 'twin-tail fighter', delta: 'delta-wing fighter', swept: 'swept-wing fighter' };
const PAINT = [['#b89b6a', '#8a6a44'], ['#5d6e4a', '#3f4a33'], ['#5a7fa8', '#3e5f86'], ['#3d4048', '#272a30'], ['#c9d0d8', '#93a1b0'], ['#9a5b43', '#6b3a2b'], ['#c08a2e', '#4a3515'], ['#6a4f80', '#40304d'], ['#7a8a8f', '#4f5d62'], ['#4d7a72', '#2f4f4a']];
const TRIM = ['#e0392b', '#f2c230', '#f4f4f4', '#ff7a1a', '#2fd0e0', '#e04fb0', '#7be04f'];
function foeLook(L, i) {
  const r = rng(L * 7919 + i * 104729 + 13), pick = a => a[Math.floor(r() * a.length)], boss = L % 10 === 0;
  return { call: pick(boss ? BOSS : CALL), rank: pick(RANKS), surn: pick(SURN), squad: pick(SQA) + ' ' + pick(SQB), frame: pick(FRAMES), paint: pick(PAINT), trim: pick(TRIM), boss };
}

// how hard a sortie is. One number (f) rises with the level; everything he does gets a little sharper with it.
function makeCfg(L, help) {
  const f = curve(L), e = easyOf(L), boss = L % 10 === 0, x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s));
  const c = {
    L, boss, help: !!help,
    bandits: boss ? 1 : L < 6 ? 1 : L < 20 ? 2 : 3,
    aim: x(0.5, 0.97, 26),                                       // how hard he can pull, against your 1.0
    jink: x(0.28, 0.7, 24),                                        // how hard he weaves when you are behind him
    breakAfter: L < 2 ? 99 : 3.5 + 5.5 * Math.exp(-f / 12),        // seconds on his tail before he hauls round and comes for you
    spent: 2.2 + 1.6 * Math.exp(-f / 20),                        // after he fires he flies straight this long: your opening
    foeShots: L >= 2,
    foeLock: 0.95 + 2.3 * Math.exp(-f / 14) + e * 0.8,           // how long he needs you in his sights
    foeCool: 3.2 + 4 * Math.exp(-f / 20),
    foeShotV: x(460, 540, 25),
    react: 0.3 + 1.0 * Math.exp(-f / 12) + e * 0.6,              // how long before he reacts to your missile
    foeFlares: L < 3 ? 0 : Math.min(4, 1 + Math.floor(f / 10)),
    flareSkill: L < 3 ? 0 : x(0.6, 0.85, 20),                   // how often he times his flare right
    foeHi: 1.0,
    gunDps: L < 4 ? 0 : x(10, 36, 30),
    myLo: 0.12, myHi: 0.46 + 1.2 * Math.exp(-f / 20) + e * 0.35, // the moment your flare works: this long before it reaches you
    dbl: L < 15 ? 0 : x(0.15, 0.65, 40),                         // how often he sends a second missile right behind the first
    needHard: L < 3 ? 0 : 0.12,                                  // ... and only if you have been turning hard this long
    dmgShot: L <= 3 ? 34 : 55,
    foeHp: boss ? 200 : 100,
    fuel: 0
  };
  if (help) { c.foeLock += 0.6; c.foeShotV *= 0.92; c.foeCool += 1; c.spent += 0.8; }      // help only buys time; the rules stay the same
  c.fuel = 120 * c.bandits + (boss ? 40 : 0);
  return c;
}

function mkJet(x, y, z, yaw, v) {
  return { x, y, z, yaw, pitch: 0, roll: 0, v: v || 240, sx: 0, sy: 0, load: 0, hard: 0, agil: 1, hp: 100, hpMax: 100, alive: true,
    lock: 0, onT: false, shots: 2, rearm: 0, side: 1, flares: 3, flareMax: 3, flareT: 0, regen: 0, dropped: 0,
    firing: false, gunOn: false, heat: 0, gunHot: false, tracerT: 0, hurtT: 9, r: null, boost: false, front: false, fast: false };
}
const fwdOf = j => { const cp = Math.cos(j.pitch); return [Math.sin(j.yaw) * cp, Math.sin(j.pitch), Math.cos(j.yaw) * cp]; };
// where t is, seen from j's seat: az (to the right +), el (above +), d (how far), off (angle off the nose)
function rel(j, t) {
  const dx = t.x - j.x, dy = t.y - j.y, dz = t.z - j.z, d = Math.hypot(dx, dy, dz) || 1, cy = Math.cos(j.yaw), sy = Math.sin(j.yaw), cp = Math.cos(j.pitch), sp = Math.sin(j.pitch);
  const lz = dx * sy * cp + dy * sp + dz * cy * cp, lx = dx * cy - dz * sy, ly = -dx * sy * sp + dy * cp - dz * cy * sp;
  return { az: Math.atan2(lx, lz), el: Math.atan2(ly, Math.hypot(lx, lz)), d, off: Math.acos(clamp(lz / d, -1, 1)) };
}

function fly(j, dt) {
  const sx = clamp(j.sx, -1, 1); let sy = clamp(j.sy, -1, 1);
  const load = Math.min(1, Math.hypot(sx, sy)), rate = Math.min(PH.RATE_MAX, PH.K_TURN / j.v) * j.agil;
  j.yaw = wrapA(j.yaw + sx * rate * dt);
  j.pitch += sy * rate * 0.8 * dt;
  if (Math.abs(sy) < 0.1) j.pitch -= j.pitch * Math.min(1, 0.7 * dt);                        // lets go of the climb or dive by itself
  if (j.y < PH.FLOOR + 220 && j.pitch < 0.1) j.pitch += (PH.FLOOR + 220 - j.y) / 220 * 1.6 * dt;   // the cloud tops are the floor
  if (j.y > PH.CEIL - 220 && j.pitch > -0.1) j.pitch -= (j.y - PH.CEIL + 220) / 220 * 1.6 * dt;     // and the air runs out above
  j.pitch = clamp(j.pitch, -PH.PITCH_MAX, PH.PITCH_MAX);
  const vm = PH.VMAX * (j.boost ? 1.3 : 1);                    // chasing from a long way back, the burners come on
  j.v = clamp(j.v + (PH.ACC * (j.boost ? 1.9 : 1) * (1 - j.v / vm) - PH.DRAG * load * load * (j.v / 220) - 48 * Math.sin(j.pitch) - (j.brake || 0) * 75) * dt, PH.VMIN, vm * 1.1);
  const cp = Math.cos(j.pitch);
  j.x += Math.sin(j.yaw) * cp * j.v * dt; j.y += Math.sin(j.pitch) * j.v * dt; j.z += Math.cos(j.yaw) * cp * j.v * dt;
  if (j.y < PH.FLOOR - 60) { j.y = PH.FLOOR - 60; if (j.pitch < 0) j.pitch = 0; }
  if (j.y > PH.CEIL + 60) { j.y = PH.CEIL + 60; if (j.pitch > 0) j.pitch = 0; }
  j.roll += (sx * 1.15 - j.roll) * Math.min(1, 6 * dt);
  j.load = load; j.hard = load > 0.6 ? j.hard + dt : 0;
}

function spawnFoe(G) {
  const me = G.me, c = G.cfg, r = G.rnd, i = G.idx, L = G.L;
  let kind = 'ahead';                                           // sortie 1 he is in front of you; sortie 2 he starts behind you (the flare lesson); 3 in front again
  if (L === 2 && i === 0) kind = 'six'; else if (L > 3) { const q = r(); kind = c.boss ? 'merge' : q < 0.36 ? 'ahead' : q < 0.72 ? 'merge' : 'six'; }
  const side = r() < 0.5 ? -1 : 1, cy = Math.cos(me.yaw), sy = Math.sin(me.yaw);
  let d = 560, lat = 130 * side, yaw = me.yaw + 0.15 * side, v = 215;
  if (kind === 'merge') { d = 1500; lat = 170 * side; yaw = me.yaw + Math.PI; v = 250; }
  else if (kind === 'six') { d = -700; lat = 60 * side; yaw = me.yaw; v = 265; }
  const f = mkJet(me.x + sy * d + cy * lat, clamp(me.y + (kind === 'ahead' ? 30 : 120 * (r() - 0.5)), PH.FLOOR + 300, PH.CEIL - 300), me.z + cy * d - sy * lat, yaw, v);
  f.look = foeLook(L, i); f.hp = f.hpMax = c.foeHp; f.flares = f.flareMax = c.foeFlares; f.shots = 1; f.cool = kind === 'six' ? (L <= 2 ? 1.6 : 0.6) : 2.2 + r() * 1.5;
  f.rnd = rng(L * 31337 + i * 977 + 5); f.seenShot = null; f.seen = 0; f.brk = 1; f.tried = false; f.chasedT = 0; f.wv = 0; f.wvDir = side; f.wvLen = 1.6; f.wvUp = 0; f.brkT = 0; f.runT = kind === 'ahead' ? 0 : 9; f.spent = 0; f.spentDir = side; f.second = 0; f.kind = kind;
  G.foe = f; G.evs.push({ k: 'spawn', kind });
}
function makeFight(L, o) {
  o = o || {};
  const G = { L, cfg: makeCfg(L, o.help), rnd: rng(L * 2654435 + (o.seed || 0) * 97 + 7), phase: 'fight', t: 0, idx: 0, kills: 0, me: mkJet(0, 1200, 0, 0, 250), foe: null,
    shots: [], flares: [], evs: [], msgs: [], sid: 0, fuel: 0, next: 0, endT: 0, why: '', res: null, hitsTaken: 0, fired: 0, landed: 0, evaded: 0, foeFired: 0, flareRes: '', gunHits: 0,
    in: { sx: 0, sy: 0, fire: false, press: false, flare: false }, threat: null, tti: 9, coach: 0 };
  G.fuel = G.cfg.fuel; spawnFoe(G);
  return G;
}

const ttiOf = (s, j) => Math.hypot(j.x - s.x, j.y - s.y, j.z - s.z) / Math.max(140, s.v - j.v * 0.55);
function launch(G, a, b) {
  const f = fwdOf(a), rx = Math.cos(a.yaw), rz = -Math.sin(a.yaw); a.shots--; a.side = -a.side; if (a === G.me) { a.rearm = a.rearm > 0 ? a.rearm : 3.6; G.fired++; } else G.foeFired++;
  const s = { x: a.x + rx * 4.5 * a.side, y: a.y - 1.3, z: a.z + rz * 4.5 * a.side, d: f, v: a.v + 50, vmax: a === G.me ? PH.SHOT_V : G.cfg.foeShotV, age: 0, from: a, to: b, decoy: null, dead: false, dist: 0, id: ++G.sid };
  G.shots.push(s); G.evs.push({ k: 'launch', a, s });
}
function shotStep(G, s, dt) {
  s.age += dt; s.v = Math.min(s.vmax, s.v + 650 * dt);
  const t = s.decoy || s.to, ax = t.x - s.x, ay = t.y - s.y, az = t.z - s.z, dist = Math.hypot(ax, ay, az) || 1, live = s.decoy || s.to.alive;
  if (s.age > 0.12 && live) {                                    // it turns toward what it is chasing, as fast as it is allowed
    const nx = ax / dist, ny = ay / dist, nz = az / dist, th = Math.acos(clamp(s.d[0] * nx + s.d[1] * ny + s.d[2] * nz, -1, 1)), mx = PH.SHOT_TURN * dt;
    if (th <= mx || th < 1e-4) s.d = [nx, ny, nz];
    else { const q = mx / th, sn = Math.sin(th), a = Math.sin((1 - q) * th) / sn, b = Math.sin(q * th) / sn; s.d = [s.d[0] * a + nx * b, s.d[1] * a + ny * b, s.d[2] * a + nz * b]; }
  }
  const mv = s.v * dt; s.x += s.d[0] * mv; s.y += s.d[1] * mv; s.z += s.d[2] * mv; s.dist = dist;
  if (live && dist < PH.HIT_R + mv) {
    s.dead = true;
    if (s.decoy) G.evs.push({ k: 'pop', s });
    else { G.evs.push({ k: 'hit', s }); if (s.from === G.me) G.landed++; else G.hitsTaken++; hurt(G, s.to, s.to === G.me ? G.cfg.dmgShot : 100, s.from, 'shot'); }
  } else if (s.age > PH.SHOT_LIFE || s.y < 0) { s.dead = true; G.evs.push({ k: 'fizzle', s }); }
}
// A flare only pulls a missile off if it is dropped at the right moment, while turning hard. One rule for both pilots.
function dropFlare(G, j) {
  if (j.flares <= 0 || j.flareT > 0 || !j.alive) return false;
  const me = j === G.me, c = G.cfg; j.flares--; j.flareT = me ? 1.0 : 1.7; j.dropped++;
  const fl = { x: j.x, y: j.y - 2, z: j.z, vx: Math.sin(j.yaw) * j.v * 0.45, vy: -34, vz: Math.cos(j.yaw) * j.v * 0.45, age: 0, by: j };
  G.flares.push(fl);
  let res = 'none';
  for (const s of G.shots) {
    if (s.dead || s.decoy || s.to !== j) continue;
    const tti = ttiOf(s, j);
    if (tti > (me ? c.myHi : c.foeHi)) res = 'early'; else if (tti < (me ? c.myLo : 0.1)) res = 'late'; else if (j.hard < (me ? c.needHard : 0.15)) res = 'straight'; else { s.decoy = fl; res = 'ok'; }
  }
  if (me) { G.flareRes = res; if (res === 'ok') G.evaded++; }
  G.evs.push({ k: 'flare', j, res, fl });
  return true;
}
function hurt(G, j, dmg, by, kind) {
  if (!j.alive) return;
  j.hp -= dmg; j.hurtT = 0; if (kind === 'gun' && by === G.me) G.gunHits += dmg;
  G.evs.push({ k: 'hurt', j, kind, dmg });
  if (j.hp > 0) return;
  j.hp = 0; j.alive = false; j.firing = j.gunOn = false; G.evs.push({ k: 'kill', j, kind });
  if (j === G.me) { G.endT = 1.6; G.why = kind; }
  else { G.kills++; if (G.idx + 1 < G.cfg.bandits) G.next = 2.6; else { G.endT = 1.9; G.why = 'win'; } }
}
function guns(G, a, b, dps, dt) {
  if (a.gunHot) { a.heat -= dt / 1.6; if (a.heat <= 0.35) a.gunHot = false; }
  if (!a.firing || a.gunHot || !a.alive) { if (!a.gunHot) a.heat = Math.max(0, a.heat - dt / 2.5); a.gunOn = false; return; }
  a.gunOn = true; a.heat += dt / 2.4; if (a.heat >= 1) { a.gunHot = true; G.evs.push({ k: 'hot', a }); }
  a.tracerT -= dt; if (a.tracerT <= 0) { a.tracerT = 0.07; G.evs.push({ k: 'tracer', a }); }
  if (!b.alive) return;
  const r = rel(a, b);
  if (r.off < PH.GUN_A && r.d < PH.GUN_R) hurt(G, b, dps * (1 - 0.45 * r.d / PH.GUN_R) * dt, a, 'gun');
}

// the other pilot
function ai(G, dt) {
  const f = G.foe, me = G.me, c = G.cfg;
  const r = rel(f, me), rb = rel(me, f); f.r = r; f.firing = false; f.cool -= dt;
  const inb = G.shots.find(s => s.to === f && !s.dead && !s.decoy);
  if (inb) {                                                     // something is coming for him: after his reaction time he breaks, and tries a flare
    if (f.seenShot !== inb) { f.seenShot = inb; f.seen = 0; f.brk = rb.az > 0 ? 1 : -1; f.tried = false; }
    f.seen += dt;
    if (f.seen >= c.react) {
      f.sx = f.brk; f.sy = f.y > 1500 ? -0.3 : 0.3;
      if (!f.tried && f.flares > 0 && f.flareT <= 0 && f.hard >= 0.15 && ttiOf(inb, f) < c.foeHi) { f.tried = true; if (f.rnd() < c.flareSkill) dropFlare(G, f); }
      return;
    }
  } else f.seenShot = null;
  f.brake = 0;
  if (f.spent > 0) { f.spent -= dt; f.agil = 0.75; f.sx = f.spentDir * 0.12; f.sy = 0; f.fast = true; return; }      // he has just fired: he flies on, watching it go. Your opening.
  const chased = rb.off < 0.6 && rb.d < 1400 && r.off > 1.5;    // you are behind him, pointing at him
  f.chasedT = chased ? f.chasedT + dt : Math.max(0, f.chasedT - dt * 2);
  if (f.brkT > 0) {                                              // hauling round as hard as he can to make you fly past; then he comes for you
    f.brkT -= dt; f.agil = 1.35; f.sx = f.wvDir; f.sy = 0.35; if (f.brkT <= 0) { f.chasedT = 0; f.runT = 9; } return;
  }
  if (chased && f.runT <= 0) {
    f.agil = 1;
    if (f.chasedT > c.breakAfter) { f.brkT = 2.4 + f.rnd() * 0.8; f.wvDir = rb.az > 0 ? 1 : -1; return; }
    f.wv += dt;
    if (f.wv > f.wvLen) { f.wv = 0; f.wvDir = -f.wvDir; f.wvLen = (1.1 + 1.7 * f.rnd()) * (1.6 - 0.7 * c.jink); f.wvUp = f.rnd() * 2 - 1; }
    const amp = clamp(c.jink * (me.lock > 0.3 ? 1.25 : 1), 0, 1);  // he feels the lock coming and works harder
    f.sx = f.wvDir * amp; f.sy = f.wvUp * 0.5 * c.jink;
    return;
  }
  if (f.runT > 0) f.runT -= dt;
  f.agil = f.runT > 0 ? 1.25 + 0.45 * c.aim : 1;                 // on an attack run he flies at his very best: he will get behind you unless you fly well
  f.fast = f.runT > 0 && r.d > 600; f.brake = 0;
  if (r.d < 520 && r.off < 0.9 && (f.v > me.v + 5 || r.d < 280)) f.brake = 1;      // close behind you he holds back, so he stays there instead of flying past
  const au = f.runT > 0 ? 1 : c.aim; let sx = clamp(r.az * 2.4, -1, 1) * au, sy = clamp(r.el * 2.4, -1, 1) * au;      // he comes for you
  if (r.d < 150 && r.off < 0.6) sx = sx >= 0 ? -1 : 1;           // too close: slide past instead of ramming
  f.sx = sx; f.sy = sy;
  if (c.gunDps > 0 && r.off < PH.GUN_A * 1.4 && r.d < PH.GUN_R * 0.9) f.firing = true;
}

function step(G, dt) {
  if (G.phase !== 'fight') return;
  const me = G.me, c = G.cfg, I = G.in; let f = G.foe;
  G.t += dt;
  if (me.alive) { me.sx = I.sx; me.sy = I.sy; } else { me.sx = 0.25; me.sy = -0.5; }
  if (f.alive) ai(G, dt); else { f.sx = 0.4; f.sy = -0.7; }
  const r0 = me.r || rel(me, f); me.boost = me.alive && f.alive && r0.d > 600 && r0.off < 0.7; f.boost = f.alive && me.alive && (f.fast || (!!f.r && f.r.d > 600 && f.r.off < 0.7)); f.fast = false;
  fly(me, dt); fly(f, dt);
  if (!me.alive) me.y -= 40 * dt; if (!f.alive) { f.y -= 55 * dt; f.roll += 2.2 * dt; }
  // locks
  const rm = rel(me, f); me.r = rm;
  const ring = me.alive && f.alive && rm.off < PH.LOCK_A && rm.d < PH.LOCK_R, tail = !!f.r && f.r.off > PH.REAR;     // a lock only takes from behind him
  const on = ring && tail, was = me.lock; me.front = ring && !tail;
  me.onT = on; me.lock = clamp(me.lock + (on ? dt / PH.LOCK_T : -dt * 1.3), 0, 1);
  if (me.lock >= 1 && was < 1) G.evs.push({ k: 'locked' });
  const fon = c.foeShots && f.alive && me.alive && f.r && f.r.off < PH.FOE_A && f.r.d < PH.FOE_R && rm.off > PH.REAR && f.cool <= 0 && f.spent <= 0;     // and his only from behind you
  f.onT = fon; f.lock = clamp(f.lock + (fon ? dt / c.foeLock : -dt * 0.8), 0, 1);
  // triggers
  if (I.press) { I.press = false; if (me.alive && me.lock >= 1 && me.shots > 0 && f.alive) { launch(G, me, f); me.lock = 0.45; } else if (me.alive && me.shots <= 0 && me.lock >= 1) G.evs.push({ k: 'empty' }); }
  if (I.flare) { I.flare = false; if (me.alive && !dropFlare(G, me)) G.evs.push({ k: 'noflare' }); }
  me.firing = I.fire && me.alive;
  if (f.alive && f.lock >= 1 && f.shots > 0 && !G.shots.some(s => s.from === f && !s.dead)) { launch(G, f, me); f.shots = 1; f.cool = c.foeCool; f.lock = 0; f.spent = c.spent; f.spentDir = f.rnd() < 0.5 ? -1 : 1; f.runT = 0; f.chasedT = 0; f.second = f.rnd() < c.dbl ? 1.2 : 0; }
  if (f.second > 0 && f.alive) { f.second -= dt; if (f.second <= 0 && me.alive && f.r && f.r.off < 0.6) launch(G, f, me), f.shots = 1; }
  guns(G, me, f, PH.GUN_DPS, dt); guns(G, f, me, c.gunDps, dt);
  for (const s of G.shots) if (!s.dead) shotStep(G, s, dt);
  if (G.shots.length && G.shots[0].dead && G.shots.every(s => s.dead)) G.shots.length = 0;
  for (const fl of G.flares) { fl.age += dt; fl.x += fl.vx * dt; fl.y += fl.vy * dt; fl.z += fl.vz * dt; fl.vx *= 1 - 1.4 * dt; fl.vz *= 1 - 1.4 * dt; fl.vy -= 30 * dt; }
  if (G.flares.length && G.flares[0].age > 2.2) G.flares.shift();
  // what comes back with time
  for (const j of [me, f]) {
    j.flareT -= dt; j.hurtT += dt;
    if (j.flares < j.flareMax) { j.regen += dt; if (j.regen >= (j === me ? 7 : 8)) { j.regen = 0; j.flares++; } } else j.regen = 0;
  }
  if (me.shots < 2) { me.rearm -= dt; if (me.rearm <= 0) { me.shots++; me.rearm = me.shots < 2 ? 3.6 : 0; G.evs.push({ k: 'rearm' }); } }
  // the missile coming for you, if there is one
  const th = G.shots.find(s => s.to === me && !s.dead && !s.decoy); G.threat = th || null; G.tti = th ? ttiOf(th, me) : 9;
  // the next bandit, the end of the sortie
  if (G.next > 0) { G.next -= dt; if (G.next <= 0) { G.idx++; me.hp = Math.min(me.hpMax, me.hp + 25); me.shots = 2; me.rearm = 0; me.flares = me.flareMax; spawnFoe(G); } }
  if (me.alive && f.alive) { G.fuel -= dt; if (G.fuel <= 0) { G.fuel = 0; G.endT = 0.01; G.why = 'fuel'; G.evs.push({ k: 'fuel' }); } }
  if (G.endT > 0) { G.endT -= dt; if (G.endT <= 0) finish(G, G.why === 'win'); }
}
