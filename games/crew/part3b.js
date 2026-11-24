
// ===================== THE VIEW, part 2: every frame, what you can see, the buttons, the meeting =====================
const YOUV = 7;      // you (the traitor) see this far, lights or no lights
function sync(V, g, dt) { const T = V.T, Y = g.you, cam = W3.cam, t = g.t;
  // the people: visible if you can see them (and they are not gone); walking, working, knocked out
  g.ppl.forEach((p, i) => { const c = V.cards[i]; if (!c) return; const seen = p === Y ? g.inVent < 0 : !p.gone && (p.alive || p.body) && los(g, Y.x, Y.z, p.x, p.z, YOUV);
    c.m.visible = c.sh.visible = seen; if (!seen) return; const down = !p.alive, flip = Math.sin(p.a) >= -0.05 ? 1 : -1;
    setPose(c, down ? 3 : p.working || (p === Y && g.faking) ? 2 : p.moving ? (Math.floor(p.walk) % 2) : 0, down ? 1 : flip);
    const bob = p.moving ? Math.abs(Math.sin(p.walk * Math.PI)) * 0.05 : Math.sin(t * 2 + i) * 0.015;
    c.m.position.set(p.x, down ? 0.34 : 0.64 + bob, p.z); c.m.quaternion.copy(cam.quaternion); c.m.scale.set(1, down ? 1 : 1 + (p.moving ? 0 : Math.sin(t * 3 + i) * 0.015), 1);
    c.sh.position.set(p.x, 0.02, p.z); c.sh.scale.set(down ? 1.3 : 1, down ? 0.8 : 0.7, 1); });
  // glows: screens, the alarm button, the reactor in a meltdown
  const hue = (t * 0.05) % 1; V.screens.forEach((s, i) => s.material.color.setHSL((hue + i * 0.13) % 1, 0.7, 0.62)); if (V.holo) V.holo.rotation.y = t;
  V.btn.material.emissive.setHex(Math.sin(t * 4) > 0 ? 0x801010 : 0x300808);
  const dark = g.lightsOut > 0 ? 0.45 : 1; V.S.children.forEach(o => { if (o.isHemisphereLight) o.intensity = 1.3 * dark; }); V.sun.intensity = 2.0 * dark; V.lights.forEach((L, i) => L.intensity = (g.melt > 0 && i === 0 ? 40 + Math.sin(t * 10) * 20 : 18) * (g.lightsOut > 0 && i ? 0.3 : 1));
  // the camera: above and a little behind you, the room laid out below
  const want = { x: Y.x, z: Y.z }; if (ui.snap || !ui.cam) { ui.cam = Object.assign({}, want); ui.snap = false; } const cc = ui.cam, kk = Math.min(1, dt * 6); cc.x += (want.x - cc.x) * kk; cc.z += (want.z - cc.z) * kk;
  const asp = innerWidth / innerHeight, sh = FX.shake ? (Math.random() - 0.5) * FX.shake * 0.02 : 0, far = asp < 0.8 ? 1.0 : 0.85; cam.fov = asp < 0.8 ? 46 : 38; cam.aspect = asp; cam.updateProjectionMatrix();
  cam.position.set(cc.x + sh, 15.5 * far, cc.z + 6.2 * far + sh); cam.lookAt(cc.x, 0, cc.z + 0.3); cam.updateMatrixWorld(); }
const SV = window.THREE ? new THREE.Vector3() : null;
function scr(x, y, z) { if (!V3 || V3.none) return { x: W / 2, y: H / 2 }; SV.set(x, y, z); return W3.screen(SV); }
// what you can see: a shape cast from you by rays that stop at walls; everything outside it is darkened
function fogDraw(g) { if (!V3 || V3.none) return; const Y = g.you, n = 150, pts = []; for (let i = 0; i < n; i++) { const a = i / n * TAU, dx = Math.cos(a), dz = Math.sin(a); let r = 0.2; while (r < YOUV) { const x = Y.x + dx * r, z = Y.z + dz * r; if (!g.g[Math.floor(z) * SW + Math.floor(x)]) { r += 0.35; break; } r += 0.15; } pts.push(scr(Y.x + dx * r, 0.3, Y.z + dz * r)); }
  const s = 0.125, f = ui.fog || (ui.fog = document.createElement('canvas')); if (f.width !== Math.ceil(W * s) || f.height !== Math.ceil(H * s)) { f.width = Math.ceil(W * s); f.height = Math.ceil(H * s); } const x = f.getContext('2d');
  x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, f.width, f.height); x.fillStyle = g.lightsOut > 0 ? 'rgba(4,6,18,.88)' : 'rgba(10,8,30,.6)'; x.fillRect(0, 0, f.width, f.height);
  x.globalCompositeOperation = 'destination-out'; /* 22 Nov 2026: no canvas blur here (it halved the frame rate): the fog is drawn an eighth of the size and stretched, which softens its edge for nothing */ x.fillStyle = '#000'; x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p.x * s, p.y * s) : x.moveTo(p.x * s, p.y * s)); x.closePath(); x.fill(); x.globalCompositeOperation = 'source-over';
  ctx.imageSmoothingEnabled = true; ctx.drawImage(f, 0, 0, W, H); }
// ---------- the buttons (bottom right) ----------
function buttons(g) { const r = 44 * k, s = 32 * k, bx = W - r - 18, by = H - r - 40 * k, out = [], kt = canKill(g), vn = g.inVent >= 0 || ventNear(g) >= 0, bd = bodyNear(g), jb = jobNear(g) >= 0;
  out.push({ id: 'knock', x: bx, y: by, r, on: !!kt, cd: g.cd, max: g.cfg.cd, label: 'KNOCK OUT', icon: '✊', col: '#ff3a5a' });
  if (g.inVent >= 0) { out.push({ id: 'next', x: bx - r - s - 16 * k, y: by + 8 * k, r: s, on: true, label: 'NEXT VENT', icon: '⟳', col: '#8a8ab8' }); out.push({ id: 'out', x: bx, y: by - r - s - 18 * k, r: s, on: true, label: 'OUT', icon: '⇧', col: '#5ac87a' }); return out; }
  out.push({ id: 'vent', x: bx - r - s - 16 * k, y: by + 8 * k, r: s, on: vn, label: 'VENT', icon: '▦', col: '#8a8ab8' });
  if (bd) out.push({ id: 'report', x: bx - r - s - 16 * k, y: by - r - s * 0.6, r: s, on: true, label: 'REPORT', icon: '📢', col: '#ff8a3a' }); else out.push({ id: 'use', x: bx - r - s - 16 * k, y: by - r - s * 0.6, r: s, on: jb, label: 'PRETEND', icon: '🔧', col: '#4ab8ff', hold: true });
  const anySab = g.cfg.lights || g.cfg.doors || g.cfg.reactor; if (anySab) out.push({ id: 'sab', x: bx, y: by - r - s - 18 * k, r: s, on: g.sabCd <= 0 && !g.lightsOut && !g.melt && !g.doors, cd: g.sabCd, max: 26, label: 'SABOTAGE', icon: '⚠', col: '#ffc030' });
  if (ui.sabOpen) { const opts = [['lights', '💡', 'LIGHTS', g.cfg.lights], ['doors', '🚪', 'DOORS', g.cfg.doors], ['reactor', '☢', 'REACTOR', g.cfg.reactor]].filter(o => o[3]); opts.forEach((o, i) => out.push({ id: 'sab:' + o[0], x: bx, y: by - r - s - 18 * k - (i + 1) * (s * 2 + 8 * k), r: s * 0.9, on: true, label: o[2], icon: o[1], col: '#ffc030' })); }
  return out; }
function btnAt(g, x, y) { for (const b of buttons(g).reverse()) if (Math.hypot(x - b.x, y - b.y) < b.r * 1.15) return b; return null; }
function drawButtons(g) { for (const b of buttons(g)) { ctx.globalAlpha = b.on ? 1 : 0.38; ctx.fillStyle = 'rgba(20,14,40,.6)'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 4, 0, TAU); ctx.fill();
    ctx.fillStyle = b.col; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
    if (b.cd > 0 && b.max) { ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.arc(b.x, b.y, b.r, -Math.PI / 2, -Math.PI / 2 + TAU * b.cd / b.max); ctx.closePath(); ctx.fill(); }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.font = `${Math.round(b.r * 0.8)}px ${BC}`; ctx.fillText(b.cd > 0 && b.max ? Math.ceil(b.cd) : b.icon, b.x, b.y - b.r * 0.08);
    ctx.font = `400 ${Math.round(Math.max(9, b.r * 0.27))}px ${TF}`; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(20,14,40,.8)'; ctx.strokeText(b.label, b.x, b.y + b.r * 0.62); ctx.fillText(b.label, b.x, b.y + b.r * 0.62); ctx.globalAlpha = 1; }
  const S2 = ui.stick; if (S2) { const R = 56 * k; ctx.globalAlpha = 0.3; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(S2.x0, S2.y0, R, 0, TAU); ctx.fill(); ctx.globalAlpha = 0.8; ctx.beginPath(); ctx.arc(S2.x0 + S2.kx * R, S2.y0 + S2.ky * R, 22 * k, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; } }
// ---------- the meeting (drawn over everything) ----------
function meetLayout(g) { const M = g.meet, L = g.ppl.filter(p => !p.gone || p.i === (M ? M.victim : -1)), cols = 3, w = (W - 36) / cols, h = 64 * k, y0 = 112 * k, tiles = L.map((p, j) => ({ p, x: 12 + (j % cols) * (w + 6), y: y0 + Math.floor(j / cols) * (h + 6), w, h }));
  const chatY = y0 + Math.ceil(L.length / cols) * (h + 6) + 10 * k; return { tiles, chatY, skip: { x: W / 2 - 70 * k, y: H - 96 * k, w: 140 * k, h: 44 * k }, vote: { x: W / 2 - 70 * k, y: H - 150 * k, w: 140 * k, h: 44 * k } }; }
function meetTap(g, x, y) { const M = g.meet; if (!M || M.votes || ui.meetT < saysShown(M) * 0.9 + 0.6) return false; const Lo = meetLayout(g);
  const inR = (r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  if (inR(Lo.skip)) { vote(g, -1); sfx.vote(); return true; }
  if (ui.sel > 0 && inR(Lo.vote)) { vote(g, ui.sel); sfx.vote(); ui.sel = -1; return true; }
  for (const t2 of Lo.tiles) if (inR(t2) && t2.p.alive && t2.p.i !== 0) { ui.sel = t2.p.i; sfx.click(); return true; } return false; }
const saysShown = M => M.says.filter(s => s.from !== 0).length;
function portrait(p, x, y, s, dead) { const a = atlasOf(p.i ? NAMES.indexOf(p.name) : 0, p.i ? p.col : myLook().col); ctx.save(); if (dead) ctx.globalAlpha = 0.45; ctx.drawImage(a, (dead ? 3 : 0) * FW, 0, FW, FH, x - s * 0.4, y - s * 0.5, s * 0.8, s); ctx.restore(); }
function drawMeeting(g, now) { const M = g.meet, Lo = meetLayout(g); ui.meetT += 1 / 60;
  const gr = ctx.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#1a1440'); gr.addColorStop(1, '#0a0c24'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffd040'; ctx.font = `400 ${Math.round(26 * k)}px ${TF}`; ctx.fillText(M.body ? 'BODY FOUND!' : 'EMERGENCY MEETING', W / 2, 66 * k);
  ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = '#c8c0ff'; ctx.fillText(M.body ? `${g.ppl[M.by] ? g.ppl[M.by].name : ''} found ${g.ppl[M.victim] ? g.ppl[M.victim].name : 'someone'} in ${M.room}` : `${g.ppl[M.by] ? g.ppl[M.by].name : ''} pressed the alarm!`, W / 2, 90 * k);
  for (const t2 of Lo.tiles) { const p = t2.p, dead = !p.alive, sel = ui.sel === p.i; ctx.fillStyle = sel ? 'rgba(255,90,120,.45)' : 'rgba(255,255,255,.1)'; rrect(t2.x, t2.y, t2.w, t2.h, 10); ctx.fill(); if (sel) { ctx.strokeStyle = '#ff5a7a'; ctx.lineWidth = 3; ctx.stroke(); }
    portrait(p, t2.x + t2.h * 0.5, t2.y + t2.h * 0.5, t2.h * 0.92, dead); ctx.textAlign = 'left'; ctx.font = `400 ${Math.round(12 * k)}px ${TF}`; ctx.fillStyle = dead ? 'rgba(255,255,255,.4)' : p.i === 0 ? '#c8a0ff' : '#fff'; ctx.fillText(p.name, t2.x + t2.h * 0.95, t2.y + t2.h * 0.38);
    if (dead) { ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.fillStyle = '#ff8a8a'; ctx.fillText(p.body ? 'KNOCKED OUT' : 'OUT', t2.x + t2.h * 0.95, t2.y + t2.h * 0.7); }
    if (M.votes) { const vs = M.votes[p.i] || []; vs.forEach((v, j) => { const q = g.ppl[v]; ctx.fillStyle = hex(q.i ? q.col : myLook().col); ctx.beginPath(); ctx.arc(t2.x + t2.h * 0.95 + j * 12 * k + 5 * k, t2.y + t2.h * 0.72, 5 * k, 0, TAU); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke(); }); } }
  // the table: everyone still in stands round it; whoever is speaking hops
  { const ty = H * 0.66, rx = Math.min(W * 0.38, 170 * k), ry = 44 * k, liv = g.ppl.filter(p => p.alive), spk = (M.says.filter(s => s.from !== 0)[Math.min(Math.floor(ui.meetT / 0.9), 99)] || {}).from;
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(W / 2, ty + 18 * k, rx * 1.05, ry * 1.1, 0, 0, TAU); ctx.fill();
    const back = liv.map((p, j) => ({ p, a: Math.PI + (j + 0.5) / liv.length * Math.PI })), front = [];
    for (const q of back) { const hop = q.p.i === spk && !M.votes ? Math.abs(Math.sin(now * 10)) * 8 * k : 0; portrait(q.p, W / 2 + Math.cos(q.a) * rx * 0.92, ty + Math.sin(q.a) * ry * 0.9 - 26 * k - hop, 62 * k); }
    ctx.fillStyle = '#5a4a8a'; ctx.beginPath(); ctx.ellipse(W / 2, ty + 8 * k, rx, ry, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#8a7ac8'; ctx.beginPath(); ctx.ellipse(W / 2, ty, rx, ry, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#ff3a4a'; ctx.beginPath(); ctx.ellipse(W / 2, ty - 2 * k, 16 * k, 8 * k, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
  // what everyone says, one by one
  const lines = M.says.filter(s => s.from !== 0 || M.votes), shown = Math.min(lines.length, Math.floor(ui.meetT / 0.9) + 1); let y = Lo.chatY;
  if (!lines.length && ui.meetT > 0.5) { ctx.textAlign = 'center'; ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = '#c8c0ff'; ctx.fillText('Nobody saw anything... "Where was everyone?"', W / 2, y + 12 * k); y += 30 * k; }
  for (let i = 0; i < shown; i++) { const s = lines[i], p = g.ppl[s.from]; if (y > H * 0.66 - 110 * k) break; ctx.fillStyle = s.from === 0 ? 'rgba(200,160,255,.25)' : 'rgba(255,255,255,.14)'; rrect(42 * k, y, W - 56 * k, 30 * k, 12); ctx.fill(); portrait(p, 26 * k, y + 15 * k, 34 * k);
    ctx.textAlign = 'left'; ctx.fillStyle = s.who === 0 && s.w > 0 ? '#ffb0b0' : '#fff'; ctx.font = `700 ${Math.round(12.5 * k)}px ${BC}`; ctx.fillText(`${p.name}: ${s.line}`, 50 * k, y + 15 * k); y += 34 * k; }
  // your turn: tap someone, then VOTE; or SKIP
  if (!M.votes && ui.meetT >= saysShown(M) * 0.9 + 0.6) { ctx.textAlign = 'center'; ctx.font = `400 ${Math.round(14 * k)}px ${TF}`; ctx.fillStyle = '#fff'; ctx.fillText(ui.sel > 0 ? `Vote ${g.ppl[ui.sel].name} out?` : 'Tap someone to blame them, or skip', W / 2, Lo.vote.y - 18 * k);
    for (const [r, txt, c] of [[Lo.skip, 'SKIP', '#6a6a9a'], ...(ui.sel > 0 ? [[Lo.vote, 'VOTE', '#ff4a6a']] : [])]) { ctx.fillStyle = c; rrect(r.x, r.y, r.w, r.h, 14); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = `400 ${Math.round(17 * k)}px ${TF}`; ctx.fillText(txt, r.x + r.w / 2, r.y + r.h / 2 + 1); } }
  // the result: someone is thrown out into space
  if (M.votes) { const out = M.out, p = out >= 0 ? g.ppl[out] : null, tt = Math.min(1, (ui.meetT - (ui.voteT || ui.meetT)) / 2.4);
    if (ui.voteT == null) ui.voteT = ui.meetT; if (tt > 0.15) { ctx.fillStyle = `rgba(4,4,16,${Math.min(0.92, (tt - 0.15) * 3)})`; ctx.fillRect(0, 0, W, H); for (let i = 0; i < 60; i++) { ctx.fillStyle = '#fff'; ctx.fillRect((i * 97.3 + now * 40) % W, (i * 53.7) % H, 2, 2); }
      if (p) { ctx.save(); ctx.translate(-80 + (W + 160) * tt, H * 0.45); ctx.rotate(tt * 8); portrait(p, 0, 0, 120 * k); ctx.restore(); }
      ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = `400 ${Math.round(18 * k)}px ${TF}`; ctx.globalAlpha = Math.min(1, (tt - 0.3) * 3); ctx.fillText(!p ? 'No one was thrown out.' : out === 0 ? 'YOU were thrown out!' : `${p.name} was thrown out.`, W / 2, H * 0.62);
      ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; ctx.fillStyle = out === 0 ? '#ff8a8a' : '#c8c0ff'; ctx.fillText(!p ? '(skipped)' : out === 0 ? 'They found the traitor.' : `${p.name} was not the traitor. ${crew(g).length} left.`, W / 2, H * 0.62 + 26 * k); ctx.globalAlpha = 1; } } }
// ---------- what each happening looks and sounds like ----------
function onEvent(G, e) { const cx = W / 2, here = (x, z) => scr(x, 0.8, z);
  switch (e.k) {
    case 'start': case 'deal': if (V3 && !V3.none) V3.built = null; ui.snap = true; ui.sabOpen = false; if (e.k === 'start') { say(`LEVEL ${G.N}`, cx, H * 0.26, '#fff', 30); sfx.start(); say(`${crew(G).length} CREW · YOU ARE THE TRAITOR`, cx, H * 0.32, '#ff8aa8', 16); if (G.N <= 1) tip('how', 'Nobody knows you are the traitor. Walk with the left thumb. KNOCK OUT someone when no one else can see.', 4); if (G.cfg.lights && G.N === 3) tip('lights', 'New: SABOTAGE the lights. The crew see almost nothing; you still see.', 3.2); if (G.cfg.cams && G.N === 6) tip('cams', 'New: cameras! Someone at the Security desk can see the red-light halls.', 3.2); if (G.cfg.reactor && G.N === 8) tip('reactor', 'New: melt the REACTOR. If the crew do not fix it in time, you win.', 3.2); if (G.cfg.sheriff && G.N === 12) tip('sheriff', 'New: one of them is a SHERIFF. If they doubt you and get close... careful.', 3.2); } break;
    case 'hurry': say('THE CREW ARE HURRYING!', W / 2, H * 0.3, '#ffd060', 22); tip('hurry', 'The longer you wait, the faster the crew finish their jobs. Strike sooner!', 3.4); break;
    case 'idle': tip('idle', 'The crew noticed you never do jobs. Stand at a job and hold PRETEND now and then, so they see you working.', 4); break;
    case 'heard': { const q = G.ppl[e.i], p = here(q.x, q.z); say('?!', p.x, p.y - 50 * k, '#ffd0e0', 24); tip('heard', 'A knock-out makes a noise. Anyone close by, even round a corner, comes to look. Get away!', 3.2); } break;
    case 'knock': { const p = here(e.x, e.z); sfx.knock(); burst(p.x, p.y, '#ffe060', 14, 220, true); say('BONK!', p.x, p.y - 40 * k, '#ffe060', 28); FX.shake = 10; FX.stop = 0.08; vibe(HAP.sharp); if (e.seen) { say('SOMEONE SAW!', cx, H * 0.3, '#ff6a6a', 26); FX.red = 1; sfx.gasp(); tip('seen', 'Someone saw it! They will run for the alarm. Catch them first, or blame someone else.', 3.4); } } break;
    case 'ventin': sfx.vent(); { const p = here(G.you.x, G.you.z); burst(p.x, p.y, '#8a8ab8', 10, 120); } if (e.seen) { say('SEEN IN A VENT!', cx, H * 0.3, '#ff8a6a', 22); } tip('vent', 'In the vent: NEXT goes to the next vent; OUT climbs out. Only when no one is looking!', 3); break;
    case 'venthop': sfx.vent(); break;
    case 'ventout': sfx.vent(); if (e.seen) say('SEEN!', cx, H * 0.3, '#ff8a6a', 22); break;
    case 'sab': sfx.sab(); FX.flash = 0.2; say(e.kind === 'lights' ? 'LIGHTS OUT!' : e.kind === 'doors' ? 'DOORS LOCKED!' : 'REACTOR MELTDOWN!', cx, H * 0.3, '#ffc030', 24); ui.sabOpen = false; break;
    case 'lightson': say('Lights back on', cx, H * 0.3, '#fff', 16); break;
    case 'fixed': say('They fixed the reactor', cx, H * 0.3, '#fff', 16); break;
    case 'meltdown': sfx.goal(); say('MELTDOWN!', cx, H * 0.34, '#ff6a3a', 32); FX.flash = 0.8; break;
    case 'meeting': sfx.alarm(); FX.flash = 0.5; ui.meetT = 0; ui.sel = -1; ui.voteT = null; ui.stick = null; stick(G, 0, 0); break;
    case 'votes': sfx.vote(); break;
    case 'ejected': if (e.i === 0) sfx.lose(); else sfx.eject(); break;
    case 'resume': ui.snap = true; break;
    case 'job': break;
    case 'jobsdone': say('THE CREW FINISHED THEIR JOBS', cx, H * 0.34, '#8aff8a', 20); break;
    case 'last': say('ONLY ONE LEFT!', cx, H * 0.34, '#ffd040', 30); sfx.goal(); FX.flash = 0.6; vibe(HAP.best); break;
    case 'sheriff': say('THE SHERIFF GOT YOU!', cx, H * 0.36, '#ff6a6a', 26); sfx.lose(); break;
    case 'lessonnext': if (e.first) hint = null; say('FIRST, A LESSON', cx, H * 0.24, '#ffe08a', 20); break;
    case 'lessonmiss': coachMiss(); break;
    case 'lessondone': say('YOU\'VE GOT IT!', cx, H * 0.3, '#ffe08a', 26); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); break;
    case 'lost': break;
  } }
// ---------- every frame ----------
let IG = null; function idleG() { if (!IG || IG.over) { IG = newGame(Math.max(4, store.get('level', 1) | 0), { seed: (Math.random() * 1e6) | 0 }); IG.mem = {}; ui.snap = true; } if (!IG.meet) { honest(IG, { react: 0.3, acc: 0.9 }, IG.mem); step(IG, 1 / 60); } else { IG.meet = null; regroup(IG); } IG.ev.length = 0; return IG; }
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const V = buildWorld(); if (V.none) { ctx.fillStyle = '#1a1440'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 18px ${BC}`; ctx.fillText('This phone cannot draw the 3D station.', W / 2, H / 2); return; }
  const g = G || idleG(); if (V.built !== g) { buildStation(V, g); ui.snap = true; }
  if (g.meet && G) { drawMeeting(g, now); drawTexts(); return; }
  sync(V, g, dt);
  if (!(navigator.webdriver && !window.__fullGL && (!window.__softGL || now * 1000 - (V.lastR || 0) < 2500))) { V.lastR = now * 1000; W3.R.render(V.S, W3.cam); }
  fogDraw(g);
  if (G) hud(G, now);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; if (p.star) { ctx.strokeStyle = INK; ctx.lineWidth = 1.5; starAt(ctx, p.x, p.y, p.r * 2); } else { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } } ctx.globalAlpha = 1;
  drawTexts();
  if (g.lightsOut > 0) { const vg = ctx.createRadialGradient(W / 2, H / 2, W * 0.2, W / 2, H / 2, H * 0.7); vg.addColorStop(0, 'rgba(10,20,60,0)'); vg.addColorStop(1, 'rgba(10,20,60,.55)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H); }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,40,60,${FX.red * 0.2})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,250,235,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); } }
function drawTexts() { ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 1 ? 1 : 1 - (t2.t - 1) / 0.5; ctx.globalAlpha = Math.max(0, al); const sc = t2.t < 0.12 ? 1.3 - t2.t / 0.12 * 0.3 : 1; ctx.font = `400 ${Math.round(t2.size * k * sc)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(20,10,40,.7)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 16); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 16); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30, y0 = H * 0.2;
    ctx.fillStyle = 'rgba(20,14,40,.9)'; rrect(W / 2 - w / 2, y0 - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, y0 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; } }
function hud(G, t) { ctx.textBaseline = 'middle';
  // names over the people you can see
  for (const p of G.ppl) { if (p === G.you || !p.alive || p.gone || !los(G, G.you.x, G.you.z, p.x, p.z, YOUV)) continue; const q = scr(p.x, 1.6, p.z); ctx.font = `400 ${Math.round(11 * k)}px ${TF}`; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(20,10,40,.7)'; ctx.strokeText(p.name, q.x, q.y); ctx.fillStyle = '#fff'; ctx.fillText(p.name, q.x, q.y); if (p.saw) { ctx.fillStyle = '#ff5a5a'; ctx.fillText('!', q.x, q.y - 14 * k); } }
  if (G.lesson) lessonPanel(G);
  else { // the crew's job bar, how many are left, the clocks of any sabotage
    const w = Math.min(230 * k, W * 0.55), x0 = W / 2 - w / 2, y0 = 60 * k, p = clamp(G.done / G.need, 0, 1); ctx.fillStyle = 'rgba(20,14,40,.6)'; rrect(x0 - 8, y0 - 12 * k, w + 16, 24 * k, 10); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.2)'; rrect(x0, y0 - 6 * k, w, 12 * k, 6 * k); ctx.fill(); ctx.fillStyle = '#5ae07a'; rrect(x0, y0 - 6 * k, Math.max(10 * k, w * p), 12 * k, 6 * k); ctx.fill();
    ctx.textAlign = 'center'; ctx.font = `700 ${Math.round(10 * k)}px ${BC}`; ctx.fillStyle = '#fff'; ctx.fillText(`CREW JOBS ${Math.round(p * 100)}%`, W / 2, y0);
    const left = crew(G).length; ctx.font = `400 ${Math.round(13 * k)}px ${TF}`; ctx.fillStyle = '#ff9ab8'; ctx.fillText(`${left} CREW LEFT · KNOCK OUT ${Math.max(0, left - 1)} MORE`, W / 2, y0 + 22 * k);
    let sy = y0 + 44 * k; if (G.lightsOut > 0) { ctx.fillStyle = '#ffc030'; ctx.fillText(`💡 LIGHTS OUT ${Math.ceil(G.lightsOut)}`, W / 2, sy); sy += 18 * k; } if (G.doors) { ctx.fillStyle = '#ffc030'; ctx.fillText(`🚪 ${ROOMS[G.doors.r][0].toUpperCase()} LOCKED ${Math.ceil(G.doors.t)}`, W / 2, sy); sy += 18 * k; }
    if (G.melt > 0) { ctx.fillStyle = Math.sin(t * 10) > 0 ? '#ff4a3a' : '#ffd040'; ctx.font = `400 ${Math.round(18 * k)}px ${TF}`; ctx.fillText(`☢ MELTDOWN ${Math.ceil(G.melt)}`, W / 2, sy + 4 * k); } }
  if (G.inVent >= 0) { ctx.textAlign = 'center'; ctx.font = `400 ${Math.round(16 * k)}px ${TF}`; ctx.fillStyle = '#c8c8ff'; ctx.fillText('IN THE VENT', W / 2, H * 0.62); }
  if (G.faking) { const q = scr(G.you.x, 1.9, G.you.z); ctx.textAlign = 'center'; ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillStyle = '#9ad8ff'; ctx.fillText('pretending to work...', q.x, q.y); }
  drawButtons(G); }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { coachPanel(G); }
