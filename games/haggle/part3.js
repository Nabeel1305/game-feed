// ===================== DRAW + JUICE: the pawn shop counter (2D on purpose: faces, things and prices read best flat) =====================
// The seller across the counter (their face shows their mood; their patience is the row of cups above them, emptying), what
// they brought lying on the counter under the lamp, its tag (maker, state, what they claim), what your checks found, their
// speech bubble with the asking price, the tools, and the offer dial: a brass slide rule you drag, the offer in big figures.
// The shelf behind fills with what you have bought today. At closing each thing's tag flips to what it sold for.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, PT = [], TXT = [];
let hint = null, dial = 0, speech = null, inspT = 9, inspTool = null, enterT = 0, bgC = null;
function sparks(x, y, n, col, sp = 220) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random()); PT.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.5 + Math.random() * 0.4, t: 0, col, r: 2 + Math.random() * 2.5 }); } }
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 40); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 2); inspT += dt; enterT += dt;
  for (const p of PT) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 420 * dt; } for (let i = PT.length - 1; i >= 0; i--) if (PT[i].t > PT[i].life) PT.splice(i, 1);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.5) TXT.shift(); if (hint) { hint.t += dt; if (hint.t > hint.secs) hint = null; } if (speech) speech.t += dt; }
const S1 = () => Math.min(W, H * 0.6) / 390;
// where everything is
function lay() { const s = S1(), top = 44 * s, cx = W / 2;
  return { s, cx, face: { x: cx, y: H * 0.2, r: 46 * s }, counterY: H * 0.37, item: { x: cx, y: H * 0.45, s: 1.25 * s }, tag: { x: 12, y: H * 0.535, w: W - 24, h: 64 * s },
    tools: [{ id: 'loupe', x: 12, y: H * 0.635, w: (W - 40) / 3, h: 40 * s, t: '🔍 Loupe' }, { id: 'uv', x: 20 + (W - 40) / 3, y: H * 0.635, w: (W - 40) / 3, h: 40 * s, t: '🔦 UV lamp' }, { id: 'pass', x: 28 + 2 * (W - 40) / 3, y: H * 0.635, w: (W - 40) / 3, h: 40 * s, t: '✋ Pass' }],
    dial: { x: 24, y: H * 0.735, w: W - 48, h: 46 * s }, offer: { x: 24, y: H * 0.84, w: W - 48, h: 54 * s }, top }; }
const dialMax = v => Math.max(50, Math.ceil(v.ask * 1.3 / 50) * 50);
// how the game reacts
function onEvent(G, e) { const L = lay(), v = G.visit;
  switch (e.k) {
    case 'start': say(`TARGET £${G.cfg.target}`, W / 2, H * 0.3, '#ffd36a', 22); if (G.hot) { const T = TYPES.find(t => t.id === G.hot); say(`HOT TODAY: ${T.name.toUpperCase()}S`, W / 2, H * 0.34, '#ff9a6a', 16); } break;
    case 'enter': enterT = 0; if (G.visit) { dial = Math.round(G.visit.ask * 0.5 / 5) * 5; speech = { txt: pick(Math.random, [`I'd like £${G.visit.ask} for it.`, `£${G.visit.ask}, and that's fair.`, `I was thinking £${G.visit.ask}.`, `Give me £${G.visit.ask}?`]), t: 0 }; } sfx.bell();
      if (G.N <= 2 && !G.lesson) tip('dial', 'Drag the brass dial to your offer, then tap OFFER. Start low, but not insultingly.', 3.4); break;
    case 'inspect': inspT = 0; inspTool = e.tool; sfx[e.tool === 'uv' ? 'uv' : 'loupe'](); { const m = { fake: '🔦 It glows wrong: a FAKE.', real: '🔦 Genuine.', true: '🔍 The claim checks out!', false: '🔍 The claim is not true.', odd: '🔍 The marks look odd...', nothing: '🔍 Nothing special.' }[e.find]; say(m, W / 2, L.tag.y - 14 * L.s, e.find === 'fake' || e.find === 'false' || e.find === 'odd' ? '#ffb4a8' : '#9be3b5', 18); } speech = { txt: pick(Math.random, ['Careful with that!', 'Is that really needed?', 'Hurry up, love.', 'It\'s real, I swear.']), t: 0 }; break;
    case 'insult': FX.shake = 6; FX.red = 0.4; sfx.huff(); speech = { txt: pick(Math.random, [`£${e.amt}?! You're joking.`, 'Are you having a laugh?', 'That\'s an insult.', 'Not a chance.']), t: 0 }; break;
    case 'counter': sfx.hmm(); speech = { txt: pick(Math.random, [`I could do £${e.cur}.`, `Meet me at £${e.cur}?`, `£${e.cur}, final offer... maybe.`, `Make it £${e.cur}.`]), t: 0 }; break;
    case 'deal': sfx.deal(); FX.flash = 0.25; sparks(L.item.x, L.item.y, 18, '#ffd36a'); say(`DEAL! £${e.P}`, W / 2, L.item.y - 40 * L.s, '#ffd36a', 26); vibe(HAP.light); speech = { txt: 'Deal. Pleasure doing business.', t: 0 }; break;
    case 'pass': sfx.door(); speech = { txt: 'Suit yourself.', t: 0 }; break;
    case 'walk': sfx.door(); FX.shake = 4; say('THEY WALKED OUT', W / 2, L.item.y - 40 * L.s, '#ffb4a8', 20); hint = { txt: e.why, t: 0, secs: 2.4 }; break;
    case 'closing': sfx.stamp(); break;
    case 'lessonnext': if (e.first) hint = null; say('FIRST, A LESSON', W / 2, H * 0.3, '#ffd36a', 22); sfx.bell(); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, W / 2, H * 0.3, '#9be3b5', 24); sfx.coin(e.n); break;
    case 'lessonmiss': say('TRY AGAIN', W / 2, H * 0.3, '#ffd0c4', 22); hint = { txt: e.how, t: 0, secs: 3.4 }; break;
    case 'lessondone': say('THE SHOP IS YOURS!', W / 2, H * 0.3, '#ffd36a', 24); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': FX.flash = 0.7; sfx.win(); vibe(HAP.best); break;
    case 'lost': sfx.lose(); break;
  } }
function area() { return { x: 0, y: 0, w: W, h: H }; }
// ---------- drawing things ----------
const hexs = n => '#' + n.toString(16).padStart(6, '0');
function drawItem(v, x, y, s, t) { const T = v.T.id, tier = v.tier, wear = v.cond >= 2, gold = tier === 2, c = ctx; c.save(); c.translate(x, y); c.scale(s, s);
  const metal = gold ? '#e8c25a' : tier === 1 ? '#c8ccd4' : '#a8a090', dark = '#2a2622';
  const R = (x0, y0, w, h, r, f) => { rrect(x0, y0, w, h, r); c.fillStyle = f; c.fill(); }, C = (x0, y0, r, f) => { c.beginPath(); c.arc(x0, y0, r, 0, TAU); c.fillStyle = f; c.fill(); };
  if (T === 'watch') { R(-14, -58, 28, 116, 8, tier === 2 ? '#5a3a20' : '#333'); C(0, 0, 34, metal); C(0, 0, 27, '#f4f0e6'); c.strokeStyle = dark; c.lineWidth = 2.5; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -18); c.moveTo(0, 0); c.lineTo(13, 4); c.stroke(); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; C(Math.cos(a) * 22, Math.sin(a) * 22, 1.6, dark); } }
  else if (T === 'guitar') { c.rotate(-0.5); R(-5, -80, 10, 70, 2, '#6a4424'); R(-9, -92, 18, 16, 3, '#3a2a1a'); c.beginPath(); c.ellipse(0, 10, 30, 36, 0, 0, TAU); c.ellipse(0, -18, 22, 22, 0, 0, TAU); c.fillStyle = ['#d0302a', '#2a6ad0', '#e8a830'][tier]; c.fill(); R(-14, 4, 28, 10, 3, '#1a1a1a'); for (let i = -2; i <= 2; i++) R(i * 2.4 - 0.5, -88, 1, 98, 0, '#eee'); }
  else if (T === 'ring') { c.lineWidth = 9; c.strokeStyle = metal; c.beginPath(); c.ellipse(0, 10, 30, 24, 0, 0, TAU); c.stroke(); c.fillStyle = tier === 2 ? '#bfe8ff' : '#e05a8a'; c.beginPath(); c.moveTo(0, -38); c.lineTo(14, -24); c.lineTo(0, -12); c.lineTo(-14, -24); c.closePath(); c.fill(); C(-4, -27, 3, 'rgba(255,255,255,.8)'); }
  else if (T === 'camera') { R(-48, -26, 96, 56, 8, tier === 2 ? '#1a1a1a' : '#3a3a40'); R(-48, -26, 96, 12, 6, metal); C(0, 4, 22, '#111'); C(0, 4, 15, '#2a3a5a'); C(-5, -1, 5, 'rgba(255,255,255,.5)'); R(26, -36, 16, 10, 2, '#222'); }
  else if (T === 'comic') { R(-38, -52, 76, 104, 3, ['#e8e0c8', '#ffd84a', '#ff5a3a'][tier]); R(-32, -46, 64, 20, 2, '#d0202a'); c.fillStyle = '#fff'; c.font = '900 13px Impact,sans-serif'; c.textAlign = 'center'; c.fillText('POW!', 0, -31); C(0, 14, 20, '#3a6ad0'); R(-12, 30, 24, 14, 2, '#1a1a1a'); }
  else if (T === 'sneakers') { c.beginPath(); c.moveTo(-50, 20); c.quadraticCurveTo(-48, -14, -14, -16); c.lineTo(10, -2); c.quadraticCurveTo(48, 2, 52, 18); c.closePath(); c.fillStyle = ['#e8e8e8', '#3a8aff', '#ff3a7a'][tier]; c.fill(); R(-52, 16, 106, 10, 5, '#f8f8f8'); for (let i = 0; i < 4; i++) R(-28 + i * 8, -12 + i * 2, 6, 2, 1, '#222'); }
  else if (T === 'vase') { c.beginPath(); c.moveTo(-14, -56); c.quadraticCurveTo(-8, -40, -32, -10); c.quadraticCurveTo(-38, 30, -16, 52); c.lineTo(16, 52); c.quadraticCurveTo(38, 30, 32, -10); c.quadraticCurveTo(8, -40, 14, -56); c.closePath(); c.fillStyle = tier === 2 ? '#f4f4f8' : tier === 1 ? '#3a7a6a' : '#c8a070'; c.fill();
    if (tier === 2) { c.strokeStyle = '#2a4ab0'; c.lineWidth = 2.5; c.beginPath(); for (let i = 0; i < 5; i++) { c.moveTo(-26 + i * 12, 0); c.quadraticCurveTo(-20 + i * 12, -14, -14 + i * 12, 0); } c.stroke(); } }
  else if (T === 'coin') { C(0, 0, 40, metal); C(0, 0, 33, gold ? '#d4ac40' : '#b0b4bc'); c.fillStyle = 'rgba(0,0,0,.25)'; c.font = '700 26px Georgia,serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(['1d', '6d', '£'][tier], 0, 2); }
  else if (T === 'console') { R(-52, -20, 104, 40, 10, ['#9a9aa8', '#2a2a30', '#e8e8f0'][tier]); R(-36, -6, 22, 6, 2, '#111'); C(28, 0, 6, '#d02a2a'); C(40, -6, 5, '#2a6ad0'); R(-48, 26, 30, 14, 6, '#555'); }
  else if (T === 'painting') { R(-62, -48, 124, 96, 4, tier === 2 ? '#b08a30' : '#6a4424'); R(-52, -38, 104, 76, 2, ['#a8c8e8', '#e8d8a8', '#3a2a1a'][tier]); C(18, -14, 12, tier === 2 ? '#e8c87a' : '#f8e86a'); c.fillStyle = tier === 2 ? '#5a3a1a' : '#4a8a3a'; c.beginPath(); c.moveTo(-52, 38); c.lineTo(-20, 0); c.lineTo(10, 26); c.lineTo(30, 8); c.lineTo(52, 38); c.fill(); }
  else if (T === 'violin') { c.rotate(-0.4); R(-4, -86, 8, 50, 2, '#2a1a10'); c.beginPath(); c.ellipse(0, -18, 20, 22, 0, 0, TAU); c.ellipse(0, 22, 26, 28, 0, 0, TAU); c.fillStyle = ['#c8783a', '#a0522a', '#7a3a18'][tier]; c.fill(); R(-3, -6, 6, 14, 2, '#1a1a1a'); }
  else if (T === 'handbag') { c.lineWidth = 5; c.strokeStyle = '#3a2a1a'; c.beginPath(); c.arc(0, -16, 24, Math.PI, 0); c.stroke(); R(-46, -18, 92, 62, 10, ['#c84a4a', '#2a2a2a', '#c8a070'][tier]); R(-8, -10, 16, 12, 3, metal); }
  if (wear) { c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1.2; for (let i = 0; i < 6; i++) { const a = i * 1.7; c.beginPath(); c.moveTo(Math.cos(a) * 18, Math.sin(a * 1.3) * 18); c.lineTo(Math.cos(a) * 18 + 10, Math.sin(a * 1.3) * 18 + 4); c.stroke(); } }
  if (v.cond === 3) { c.strokeStyle = '#1a1a1a'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(-20, -30); c.lineTo(-4, -6); c.lineTo(-14, 10); c.lineTo(6, 34); c.stroke(); }
  if (v.cond === 0) { c.strokeStyle = 'rgba(255,240,180,.8)'; c.lineWidth = 2; for (let i = 0; i < 3; i++) { const a = t * 2 + i * 2.1; c.beginPath(); c.moveTo(Math.cos(a) * 60, Math.sin(a) * 40 - 6); c.lineTo(Math.cos(a) * 66, Math.sin(a) * 40 - 6); c.stroke(); } }
  if (v.seen.uv && inspT < 99) { c.globalAlpha = 0.5; c.fillStyle = v.fake ? '#ff3aff' : '#7a3aff'; c.beginPath(); c.arc(0, 0, 70, 0, TAU); c.fill(); c.globalAlpha = 1; if (v.fake) { c.fillStyle = '#fff'; c.font = '900 18px Impact,sans-serif'; c.textAlign = 'center'; c.fillText('FAKE', 0, 6); } }
  c.restore(); }
function drawFace(v, x, y, r, t) { const c = ctx, hue = [30, 18, 25, 12][v.sl.face], skin = [`hsl(${hue},45%,72%)`, `hsl(${hue},40%,55%)`, `hsl(${hue},38%,40%)`, `hsl(${hue},30%,65%)`][v.id % 4], mood = v.mood, bob = Math.sin(t * 2) * 2 - Math.max(0, 1 - enterT / 0.4) * 30;
  c.save(); c.translate(x, y + bob);
  c.fillStyle = ['#3a5a8a', '#8a3a3a', '#2a2a2a', '#5a5a3a'][v.sl.face]; rrect(-r * 1.3, r * 0.7, r * 2.6, r * 1.4, r * 0.5); c.fill();
  c.fillStyle = skin; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); c.fillStyle = ['#3a2410', '#8a8a8a', '#1a1a1a', '#c84a1a'][v.id % 4];
  if (v.sl.id === 'shady') { c.fillStyle = '#222'; rrect(-r * 1.05, -r * 1.05, r * 2.1, r * 0.55, 6); c.fill(); rrect(-r * 1.4, -r * 0.6, r * 2.8, r * 0.18, 4); c.fill(); } else { c.beginPath(); c.arc(0, -r * 0.25, r * 1.02, Math.PI * 1.05, Math.PI * 1.95); c.fill(); }
  if (v.sl.id === 'savvy') { c.strokeStyle = '#222'; c.lineWidth = 2; c.strokeRect(-r * 0.55, -r * 0.2, r * 0.38, r * 0.26); c.strokeRect(r * 0.17, -r * 0.2, r * 0.38, r * 0.26); }
  c.fillStyle = '#1a1210'; for (const sx of [-1, 1]) { c.beginPath(); c.arc(sx * r * 0.35, -r * 0.08, r * 0.08, 0, TAU); c.fill(); c.strokeStyle = '#1a1210'; c.lineWidth = 3; c.beginPath(); const tilt = mood < 0 ? sx * 0.25 : mood > 0 ? -sx * 0.1 : 0; c.moveTo(sx * r * 0.18, -r * 0.3 - tilt * r); c.lineTo(sx * r * 0.52, -r * 0.3 + tilt * r); c.stroke(); }
  c.beginPath(); c.lineWidth = 3; if (mood < -1) { c.arc(0, r * 0.55, r * 0.28, Math.PI * 1.15, Math.PI * 1.85); } else if (mood < 0) { c.moveTo(-r * 0.25, r * 0.42); c.lineTo(r * 0.25, r * 0.4); } else c.arc(0, r * 0.2, r * 0.3, 0.2, Math.PI - 0.2); c.stroke();
  c.restore();
  // patience: cups of tea above them
  for (let i = 0; i < v.maxPat; i++) { const px = x + (i - (v.maxPat - 1) / 2) * r * 0.5, py = y - r * 1.45; c.globalAlpha = i < v.pat ? 1 : 0.22; c.font = `${Math.round(r * 0.36)}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('☕', px, py); } c.globalAlpha = 1; }
function shopBg() { const w = Math.round(W * DPR), h = Math.round(H * DPR); if (bgC && bgC.width === w && bgC.height === h) return bgC; bgC = document.createElement('canvas'); bgC.width = w; bgC.height = h; const g = bgC.getContext('2d'); g.scale(DPR, DPR); const L = lay();
  const gr = g.createLinearGradient(0, 0, 0, L.counterY); gr.addColorStop(0, '#2e2418'); gr.addColorStop(1, '#4a3a26'); g.fillStyle = gr; g.fillRect(0, 0, W, L.counterY);
  g.fillStyle = 'rgba(0,0,0,.25)'; for (let y = 0; y < L.counterY; y += 26) g.fillRect(0, y, W, 1.5);
  // shelves with clutter behind
  for (const sy of [0.11, 0.27]) { g.fillStyle = '#5a3a1e'; g.fillRect(0, H * sy, W, 7); for (let i = 0; i < 9; i++) { const x = 14 + i * W / 9, hh = 12 + ((i * 37) % 22); g.fillStyle = ['#7a5a3a', '#4a6a7a', '#8a3a3a', '#6a6a4a', '#9a8a6a'][i % 5]; g.fillRect(x, H * sy - hh, 16 + (i % 3) * 6, hh); } }
  // the counter
  const cg = g.createLinearGradient(0, L.counterY, 0, H); cg.addColorStop(0, '#6a4424'); cg.addColorStop(0.08, '#4a2e18'); cg.addColorStop(1, '#2a1a0e'); g.fillStyle = cg; g.fillRect(0, L.counterY, W, H - L.counterY); g.fillStyle = 'rgba(255,220,170,.18)'; g.fillRect(0, L.counterY, W, 3);
  const lg = g.createRadialGradient(W / 2, L.item.y, 10, W / 2, L.item.y, W * 0.5); lg.addColorStop(0, 'rgba(255,230,170,.22)'); lg.addColorStop(1, 'rgba(255,230,170,0)'); g.fillStyle = lg; g.fillRect(0, L.counterY, W, H * 0.3);
  return bgC; }
function draw(now) { ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.drawImage(shopBg(), 0, 0, W, H); const g = G, t = now, L = lay(), s = L.s;
  ctx.save(); if (FX.shake > 0) ctx.translate((Math.random() - 0.5) * FX.shake, (Math.random() - 0.5) * FX.shake);
  if (g) { const v = g.visit;
    // today's buys on the shelf behind
    g.bought.slice(-6).forEach((b, i) => { const fake = { T: TYPES.find(q => q.id === b.type), tier: 0, cond: 1, seen: {}, id: 0 }; fake.tier = TYPES.find(q => q.id === b.type).makers.indexOf(b.maker); if (fake.tier < 0) fake.tier = 1; drawItem(fake, 30 + i * (W - 60) / 5, H * 0.255, 0.28 * s, t); });
    if (v) { drawFace(v, L.face.x, L.face.y, L.face.r, t); drawItem(v, L.item.x, L.item.y, L.item.s * 0.9, t);
      // speech bubble
      if (speech) { ctx.font = `700 ${Math.round(15 * s)}px Nunito,sans-serif`; const tw = Math.min(W * 0.5, ctx.measureText(speech.txt).width + 22), bx = L.face.x + L.face.r * 1.1, by = L.face.y - L.face.r * 0.9, lines = wrapText(speech.txt, W * 0.5 - 22), bh = lines.length * 18 * s + 14;
        const x0 = Math.min(W - tw - 8, bx); ctx.fillStyle = '#fffaf0'; rrect(x0, by, tw, bh, 12); ctx.fill(); ctx.beginPath(); ctx.moveTo(x0 + 6, by + bh - 4); ctx.lineTo(L.face.x + L.face.r * 0.6, L.face.y - L.face.r * 0.1); ctx.lineTo(x0 + 24, by + bh - 2); ctx.fill();
        ctx.fillStyle = '#2a1a10'; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; lines.forEach((l, i) => ctx.fillText(l, x0 + 11, by + 7 + i * 18 * s)); }
      // their asking price, big, at the left
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'rgba(0,0,0,.4)'; rrect(10, L.face.y - 20 * s, 86 * s, 44 * s, 10); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.font = `700 ${Math.round(10 * s)}px ${BC}`; ctx.fillText('THEY WANT', 18, L.face.y - 10 * s); ctx.fillStyle = '#ffd36a'; ctx.font = `${Math.round(21 * s)}px ${TF}`; ctx.fillText(`£${v.cur}`, 18, L.face.y + 10 * s);
      // the tag
      const T = L.tag; ctx.fillStyle = '#f4ead6'; rrect(T.x, T.y, T.w, T.h, 10); ctx.fill(); ctx.fillStyle = '#2a1a10'; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.font = `800 ${Math.round(16 * s)}px Nunito,sans-serif`; ctx.fillText(`${v.maker} ${v.T.name.toLowerCase()}`, T.x + 12, T.y + 8 * s);
      ctx.font = `700 ${Math.round(12.5 * s)}px Nunito,sans-serif`; ctx.fillStyle = '#5a4320'; ctx.fillText(`${COND[v.cond].t} · ${v.name}, ${v.sl.name}`, T.x + 12, T.y + 28 * s);
      const notes = []; if (v.claim) notes.push(v.seen.loupe ? (v.claimTrue ? `✓ really ${v.claim}` : `✗ not ${v.claim}`) : `"It's ${v.claim}!"`); if (v.seen.uv) notes.push(v.fake ? '✗ FAKE' : '✓ genuine'); if (v.seen.loupe && !v.claim) notes.push(v.fake ? '? marks look odd' : 'nothing special');
      if (g.hot === v.T.id) notes.push('🔥 hot today'); if (upLv('book')) { const pb = (store.get('book', {}) || {})[v.T.id]; if (pb) notes.push(`📒 seen £${pb.lo}-£${pb.hi}`); }
      ctx.fillStyle = '#8a2a1a'; ctx.font = `800 ${Math.round(12.5 * s)}px Nunito,sans-serif`; ctx.fillText(notes.join('  ·  '), T.x + 12, T.y + 45 * s);
      // tools
      for (const b of L.tools) { const used = b.id !== 'pass' && v.seen[b.id]; ctx.fillStyle = used ? 'rgba(255,255,255,.08)' : b.id === 'pass' ? 'rgba(255,140,120,.18)' : 'rgba(255,255,255,.16)'; rrect(b.x, b.y, b.w, b.h, 11); ctx.fill(); ctx.fillStyle = used ? 'rgba(255,255,255,.35)' : '#fff'; ctx.font = `800 ${Math.round(14 * s)}px Nunito,sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(b.t, b.x + b.w / 2, b.y + b.h / 2); }
      // the dial: a brass slide rule
      const D = L.dial, mx = dialMax(v), u = clamp(dial / mx, 0, 1); ctx.fillStyle = '#b8902a'; rrect(D.x, D.y, D.w, D.h, 12); ctx.fill(); ctx.fillStyle = '#e8c25a'; rrect(D.x + 3, D.y + 3, D.w - 6, D.h * 0.45, 9); ctx.fill();
      ctx.strokeStyle = '#5a3a10'; ctx.lineWidth = 1.5; ctx.fillStyle = '#5a3a10'; ctx.font = `700 ${Math.round(9 * s)}px ${BC}`; ctx.textAlign = 'center'; for (let i = 0; i <= 20; i++) { const x = D.x + 10 + (D.w - 20) * i / 20; ctx.beginPath(); ctx.moveTo(x, D.y + D.h - 4); ctx.lineTo(x, D.y + D.h - (i % 5 ? 10 : 18)); ctx.stroke(); if (i % 5 === 0) ctx.fillText(`£${Math.round(mx * i / 20)}`, x, D.y + 12 * s); }
      const ax = D.x + 10 + (D.w - 20) * (v.cur / mx); ctx.fillStyle = 'rgba(255,90,60,.8)'; ctx.fillRect(ax - 1.5, D.y, 3, D.h); const kx = D.x + 10 + (D.w - 20) * u; ctx.fillStyle = '#2a1a10'; rrect(kx - 9, D.y - 6, 18, D.h + 12, 7); ctx.fill(); ctx.fillStyle = '#ffd36a'; rrect(kx - 5, D.y - 2, 10, D.h + 4, 4); ctx.fill();
      // the offer button
      const O = L.offer; ctx.fillStyle = g.wait > 0 ? 'rgba(232,184,90,.4)' : '#e8b85a'; rrect(O.x, O.y, O.w, O.h, 14); ctx.fill(); ctx.fillStyle = '#8a6224'; ctx.fillRect(O.x + 10, O.y + O.h - 4, O.w - 20, 4); ctx.fillStyle = '#1d1204'; ctx.font = `${Math.round(24 * s)}px ${TF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(`OFFER £${dial}`, O.x + O.w / 2, O.y + O.h / 2); }
    hud(g); }
  for (const p of PT) { ctx.globalAlpha = 1 - p.t / p.life; ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1; ctx.restore();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; for (const q of TXT) { const a = q.t < 1.1 ? 1 : 1 - (q.t - 1.1) / 0.4; ctx.globalAlpha = Math.max(0, a); ctx.font = `${Math.round(q.size * s)}px ${TF}`; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.strokeText(q.txt, q.x, q.y - q.t * 14); ctx.fillStyle = q.col; ctx.fillText(q.txt, q.x, q.y - q.t * 14); } ctx.globalAlpha = 1;
  if (hint) { const a = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, a); ctx.font = `700 ${Math.round(14 * s)}px ${BC}`; const lines = wrapText(hint.txt, W - 50), lh = 17 * s, hh = lines.length * lh + 14, ww = Math.min(W - 20, Math.max(...lines.map(l => ctx.measureText(l).width)) + 24);
    ctx.fillStyle = 'rgba(20,12,6,.92)'; rrect(W / 2 - ww / 2, H * 0.33 - hh / 2, ww, hh, 10); ctx.fill(); ctx.fillStyle = '#ffe3a0'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.33 - hh / 2 + 7 + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,60,40,${FX.red * 0.2})`; ctx.fillRect(0, 0, W, H); } if (FX.flash > 0) { ctx.fillStyle = `rgba(255,240,200,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); } }
function hud(G) { const c = G.cfg, s = S1(); ctx.textBaseline = 'middle';
  if (G.lesson) { lessonPanel(G); return; }
  ctx.fillStyle = 'rgba(0,0,0,.45)'; rrect(8, 44 * s, W - 16, 30 * s, 10); ctx.fill(); ctx.font = `700 ${Math.round(12.5 * s)}px ${BC}`; ctx.textAlign = 'left'; ctx.fillStyle = '#ffe3a0';
  const spent = G.bought.reduce((a, b) => a + b.P, 0); ctx.fillText(`CUSTOMER ${Math.min(c.people, G.n + 1)}/${c.people} · TARGET £${c.target}`, 16, 59 * s);
  ctx.textAlign = 'right'; ctx.fillStyle = '#fff'; ctx.fillText(`${G.bought.length} bought · £${spent}`, W - 16, 59 * s); }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of String(t).split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { const D = G.lesson, st = D.steps[D.i], s = S1(), x = 10, w = W - 20, y = 42 * s; ctx.save(); ctx.font = `700 ${Math.round(12.5 * s)}px ${BC}`; const lines = wrapText(st.how, w - 24), h = 40 * s + lines.length * 16 * s;
  ctx.fillStyle = 'rgba(16,10,4,.9)'; rrect(x, y, w, h, 12); ctx.fill(); ctx.strokeStyle = 'rgba(255,211,106,.7)'; ctx.lineWidth = 2; rrect(x, y, w, h, 12); ctx.stroke();
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#ffd36a'; ctx.font = `700 ${Math.round(14 * s)}px ${BC}`; ctx.fillText(`LESSON: ${st.title} · ${D.n} OF ${st.need}`, x + 12, y + 8 * s);
  ctx.font = `700 ${Math.round(12.5 * s)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.9)'; lines.forEach((l, i) => ctx.fillText(l, x + 12, y + 28 * s + i * 16 * s)); ctx.restore(); }
