# The Game Feed Playbook: the "engagement factors" (for Claude, not for Nabeel to read)

Nabeel calls this research the **engagement factors**. Every game gets them from its first build, without him asking. Choosing which ones fit is the job; skipping them is not an option.

Design principles for every game, from the research done in Nov 2026 (King/Candy Crush GDC talk, SDT research, Peggle, Fruit Ninja, Threes, Alto, Monument Valley, Wordle, Sakurai on hit-stop, "Juice it or lose it", "Art of Screenshake") plus Nabeel's own taste.

**How to use it:** principles are NOT applied blanket. For each new game:
1. Write the game's one-word verb and its one-line **signature moment** (P30).
2. Pick **3–5 principles** from the genre table that fit. Write them in the spec and in `games.json` (`principles`). Don't add others just because they are nice.
3. Always do: **Satisfying Sounds (S-rules)**, P6 juice, P10/P11 silent redundancy, P23 instant restart.
4. Run the checklist at the bottom, including the AVOID list.

---

## A. Flow and difficulty
- **P1 Just hard enough.** Challenge rises with skill. Aim for roughly a 50–70% win rate on a typical attempt. Ramp *one* variable at a time. A really hard level must also be really short (King: very hard levels cause quitting; easing level 65 kept players longer). Fits every skill game; not calm toys.
- **P2 Quiet help after losses (DDA).** After 2–3 straight losses, ease off slightly (opponent 20–40 ms slower, telegraph a few frames longer, a wider window). Reverse after 2–3 wins. Prefer *disclosed* help (a small "assist" icon). Not for personal-best scores or daily challenges.
- **P3 Honest near-miss.** Show how close a loss really was, from the real simulation: "14 ms short", a ghost line where the cap stopped. Never fake it.
- **P4 Fair, readable failure.** Every loss is understood in half a second. Telegraph attacks (250–400 ms wind-up glint or shoulder dip, plus a sound and haptic tick). Hitboxes generous for good things, strict for bad.
- **P5 Teach by doing.** A 1–2 word verb overlay ("PARRY!") that fades in about 600 ms, and an optional ghost finger the first time. The first level is almost impossible to lose (our rule 0).

## B. Game feel ("juice")
- **P6 Every input answers back.** Visual + haptic + (optional) sound on every touch. Build the core in grey first, then juice it. Juice must never hide a telegraph.
- **P7 Hit-stop.** Freeze for a few frames on impact: 2–3 frames on a light hit, 6–8 on a knockout, plus a white flash on a perfect parry and a brief slow-mo that snaps back on the winning blow. Not for flowing games, runners or calm games.
- **P8 Shake and permanence.** Directional shake *away* from the impact, 4–8 px, decaying over 100–200 ms. Keep it small. Leave traces: scuffs, dents, shells, dust.
- **P9 Squash, stretch and easing.** Stretch along motion, squash on contact. UI overshoots about 10% and settles (ease-out-back). Numbers pop in with a bounce.
- **P10 Sound with silent redundancy.** See the full **Satisfying Sounds** section. Every sound has a visual twin (and a haptic one where useful), because he often plays muted in meetings.
- **P11 Haptics as the silent sound channel.** A small vocabulary: light tick = valid input; sharp double = perfect parry / headshot; heavy thud = knockout; rising triple = new best. **Never vibrate on failure.**
- **P12 Celebrations scaled to the achievement.** Small acknowledgements for small wins, one rare over-the-top signature celebration for big ones (Peggle's "Ode to Joy" style). Never celebrate a loss.

## C. Progression and goals
- **P13 Visible personal best.** Show the current result against the best; a ghost marker; "NEW BEST" only when it really is new. Not for calm games.
- **P14 Goal-gradient bar.** Show progress to a near goal ("Opponent 4/5", a star bar). A head start (first pip filled) is fine.
- **P15 Nested goals.** This attempt → this session → long-term (3 stars per level, cosmetic unlocks that change look or feel). Nothing expires.
- **P16 Natural stopping points.** A clear end card with the key stat and the best. Replay is one tap but never automatic. Best-of-3 keeps sessions near a minute.

## D. Rewards and surprise
- **P17 Rare harmless surprises.** About 1 in 50 runs: a tumbleweed, a cat crossing the ring, a golden cap. Discovered, not announced. Cosmetic only in duels.
- **P18 Combos and in-run streaks.** Each success adds a pip, raises the chime a step, and makes the glow stronger. A miss resets quietly. No cross-day streaks.

## E. Calm design
- **P19 No clock, no fail** (calm toys and "cruise" variants only).
- **P20 Gentle palettes:** 3–5 colours; every frame should look like a postcard. In fighting games, calm only the background; threats stay high-contrast.
- **P21 Tidy-up satisfaction:** snap-to-grid, 60–120 ms ease into place, soft woody click + light tick, a shimmer when a row completes.
- **P22 Minimal UI:** one number on screen at most during play; diegetic health (bruises, a wobbling stance) where possible.

## F. Short sessions
- **P23 Instant start and restart:** under 1 s to control; tap anywhere to retry; death moment about 0.5 s and skippable.
- **P24 Run length to fit the moment:** microgames 5–15 s, duels 30–60 s, puzzles 1–3 min. If a run often passes 90 s, split it.
- **P25 Pause anywhere, silent-first, one thumb:** auto-pause when hidden; real-time duels pause between rounds and void the current exchange. Two-thumb games get a warning on their feed card.

## G. The feed
- **P26 Variety with rhythm:** tag genre, intensity 1–5 and thumbs. Never two intense games in a row too often; a calm game after every 3–4 intense ones; let him pin favourites.
- **P27 Previews, no autoplay:** a 2–3 s silent looping preview; a tap starts the game. After about 10 games, a soft "That's a set. Keep going or done?" card.
- **P28 Daily special (optional):** one seeded challenge per day, no streak counter, no notification.
- **P29 Personal tuning:** log finishes, replays and quick skips; a calm-mode filter; a periodic "least fun 10" review to fix or retire games.
- **P30 Signature identity:** one memorable hook per game (a sound, a celebration, a character) so 1,000 games don't blur.

## Genre table (✔ strong, ~ light, ✘ avoid)
| | Fight | Reaction | Physics | Puzzle | Calm | Runner | Sports |
|---|---|---|---|---|---|---|---|
| P1 just hard | ✔ | ✔ | ✔ | ✔ | ✘ | ✔ | ✔ |
| P2 DDA | ✔ | ✔ | ✔ | ~ | ✘ | ~ | ✔ |
| P3 near-miss | ~ | ✔ | ✔ | ~ | ✘ | ✔ | ✔ |
| P4 fair fail | ✔ | ✔ | ✔ | ~ | ✘ | ✔ | ✔ |
| P7 hit-stop | ✔ | ✔ | ~ | ✘ | ✘ | ✘ | ~ |
| P8 shake | ✔ | ~ | ✔ | ✘ | ✘ | ~ | ~ |
| P9 squash | ✔ | ~ | ✔ | ✔ | ✔ | ✔ | ✔ |
| P12 celebration | ✔ | ✔ | ✔ | ✔ | ~ bloom | ~ | ✔ |
| P13 best | ~ | ✔ | ✔ | ~ | ✘ | ✔ | ✔ |
| P14 progress bar | ✔ | ~ | ~ | ✔ | ✘ | ~ | ✔ |
| P17 surprise | ~ | ~ | ✔ | ✔ | ✔ | ✔ | ~ |
| P18 combos | ✔ | ✔ | ~ | ✔ | ✘ | ✔ | ✔ |
| P19 no fail | ✘ | ✘ | ~ | ~ | ✔ | ~ | ✘ |
| P20 gentle palette | ~ | ~ | ~ | ✔ | ✔ | ✔ | ~ |
| P21 tidy-up | ✘ | ✘ | ~ | ✔ | ✔ | ✘ | ✘ |
| P28 daily | ~ | ✔ | ✔ | ✔ | ✘ | ~ | ✔ |
P5, P6, P10, P11, P16, P22, P23, P24, P25, P30 and the S-rules: every genre (soft versions in calm games).

Ideas for existing games (only if he asks for changes): Cap Flick P3 ghost line, P8 scuffs, P9 cap squash, P12 final-cap zoom. Knockout P7, P11, P18. High Noon P3 ms margin, P7 freeze + slow-mo, P13 best reaction time. Steel & Honour P7 perfect-parry freeze, P18 parry chain with rising chime.

---

## Satisfying Sounds (Nabeel: "every sound you make needs to be satisfying")
The little things matter. Every sound is something he hears hundreds of times, so it must feel good on the hundredth play, not just the first.

### S1. What "satisfying" means
- **Short, crisp, physical.** Most effects 40–250 ms. A clear attack, then a fast decay. Long tails only for celebrations and big impacts.
- **Matches the material and the force.** Wood clicks, metal rings, leather thumps, glass tinks, soft pops. A bigger force gives a lower, louder, longer sound; a light touch gives a higher, quieter, shorter one. Scale volume and pitch from the real impact speed.
- **Pleasant on repeat.** Nothing harsh, shrill, buzzy or nagging. If it would annoy on the 50th hearing, soften it.
- **Rewarding sounds are musical.** Successes land on notes of a major or pentatonic scale (C D E G A), so chains sound like a tune, never random beeps.

### S2. Build every sound in three layers
1. **Transient (0–15 ms):** a click of high-passed noise (3–8 kHz) or a very short tick. This is the "snap" that tells the brain it connected.
2. **Body (15–150 ms):** the character: a tone, a filtered noise "thump" or "whoosh", a pluck, or inharmonic metal partials.
3. **Tail (optional):** a soft ring-out, a low sub-thump (40–80 Hz sine dropping in pitch) for weight, or a little air/room noise.
Layers start together; each has its own envelope.

### S3. Envelopes (no clicks, no mush)
- Always start gain at 0.0001 and ramp to the peak in **2–10 ms** (5 ms default). Never start at full volume, because that clicks.
- Use exponential decay to about 0.0005, then stop the source 20 ms later.
- Downward pitch sweeps add punch (thump 120→55 Hz in 120 ms). Upward sweeps feel positive (pickup 600→900 Hz).

### S4. Variety: never the exact same sound twice in a row
- Randomise **pitch ±5–8%** and **volume ±10%** on every play. Use the same random draw for all layers so the sound stays coherent.
- For very frequent sounds (footsteps, taps, cap clicks), keep 3–4 variants and never repeat the last one.
- Rate-limit: the same sound at most every ~35 ms; if more arrive, skip them or merge them into one louder sound. Cap simultaneous voices at about 12.

### S5. Rising pitch for chains and combos
- Each step in a combo plays one scale step higher (pentatonic C D E G A c d…). A semitone per step also works for short chains.
- Reset quietly to the base note when the chain breaks. No sad sound on the reset.
- The top of a long chain gets a bright extra layer (an octave-up sparkle).

### S6. Tonal balance (protect the ears)
- Avoid sustained energy at 2–5 kHz (the shrill band). Put a gentle lowpass (6–9 kHz) on bright tones and use sine/triangle bodies by default; square/sawtooth only through a lowpass and quietly (the trumpet fanfare is the exception, used briefly).
- Thumps need some energy around 100–200 Hz so they still read on phone speakers, which can't play deep bass. A pure 50 Hz sine is inaudible on a phone, so add a 120–200 Hz harmonic.
- A tiny short reverb or delay (one 60–90 ms echo at -18 dB) makes things feel like they're in a place. Keep it subtle.

### S7. The mix
- Everything goes through **one master chain:** sfx bus → master gain (about 0.8) → `DynamicsCompressor` (threshold -18 dB, knee 12, ratio 4, attack 3 ms, release 150 ms) → destination. This stops loud stacks from clipping and evens out levels.
- Priority: gameplay feedback > threats/telegraphs > celebration > ambience.
- **Duck** ambience and music by about 50% for 300–500 ms under a big moment (KO, final shot, win stinger).
- Ambience (wind, crowd, birds) stays quiet and low-passed, loops without an audible seam, and must never mask a telegraph cue.

### S8. Win and lose sounds
- **Wins:** short major-key stingers. Small win: 2–3 rising notes (under 0.6 s). Big win or level clear: the signature celebration (fanfare, smug guitar, crowd roar), under ~2 s, and skippable.
- **Losses:** dramatic but not punishing, and never mocking: a low thud, a descending minor 2–3 note phrase, a softened crowd groan. No sad trombone, no buzzer. Losing must make him want to retry, not wince.
- **Near-miss:** a short tense "so close" sound (a held note that drops) paired with the true margin on screen.
- **New best:** a bright 3-note rising chime + rising triple haptic.

### S9. Telegraph and UI sounds
- Each enemy attack type has its own short cue during the wind-up (a glint "shing", a grunt, a cloth swish). It must be quieter than impacts but distinct, and also shown visually.
- Buttons and menus: a soft click (very short triangle around 1.2–1.8 kHz with a lowpass, or a wood tick), quiet. Confirm = a slightly higher pair of notes; back = slightly lower.
- Countdown ticks rise in pitch toward "GO", and the GO sound has the brightest transient.

### S10. Practical rules
- **Unlock audio on the first tap** (`actx.resume()` in the first touch handler); never play before that.
- **Muted works:** every sound has a visual twin, and important ones a haptic twin (P10/P11). Mute is saved in storage per game.
- Pause and suspend audio when the page is hidden; resume on return.
- No background music by default. If used, it is quiet, short-looped, and turns off with the sound toggle.
- Headless/sim mode: all sound functions return immediately.
- **Test the sounds**: render each sfx offline (`OfflineAudioContext`) in a headless check to ensure no errors and no clipping (peak under 1.0). By ear, it should still be pleasant on the 50th repeat.
- Each game has one **signature sound** that is pleasant enough to become its identity (Fruit Ninja's slice). Name it in the spec.

### S11. Sound kit (copy into each game and extend)
```js
let actx=null,MUTE=false,BUS=null; const lastPlay={};
function audio(){ if(!actx){try{actx=new(window.AudioContext||window.webkitAudioContext)();
  const comp=actx.createDynamicsCompressor(); comp.threshold.value=-18; comp.knee.value=12; comp.ratio.value=4; comp.attack.value=0.003; comp.release.value=0.15;
  BUS=actx.createGain(); BUS.gain.value=0.8; BUS.connect(comp); comp.connect(actx.destination);}catch(e){}}
  if(actx&&actx.state==='suspended') actx.resume().catch(()=>{}); }
const vary=(a=0.06)=>1+(Math.random()*2-1)*a;          // ±6% pitch / level
function gate(name,ms=35){ const t=performance.now(); if(lastPlay[name]&&t-lastPlay[name]<ms) return false; lastPlay[name]=t; return true; }
function env(g,t,vol,dur,att=0.005){ g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+att); g.gain.exponentialRampToValueAtTime(0.0005,t+dur); }
function tone(fr,dur,vol,type='sine',when=0,to,lp){ if(!actx||MUTE) return; try{ const t=actx.currentTime+when,o=actx.createOscillator(),g=actx.createGain();
  o.type=type; o.frequency.setValueAtTime(fr,t); if(to) o.frequency.exponentialRampToValueAtTime(to,t+dur);
  let n=o; if(lp){const f=actx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=lp; o.connect(f); n=f;}
  env(g,t,vol,dur); n.connect(g); g.connect(BUS); o.start(t); o.stop(t+dur+0.02);}catch(e){} }
function noise(dur,freq,vol,type='lowpass',q=1,when=0){ if(!actx||MUTE) return; try{ const t=actx.currentTime+when,n=Math.max(1,Math.floor(actx.sampleRate*dur)),
  b=actx.createBuffer(1,n,actx.sampleRate),d=b.getChannelData(0); for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/n,3);
  const s=actx.createBufferSource(); s.buffer=b; const f=actx.createBiquadFilter(); f.type=type; f.frequency.value=freq; f.Q.value=q;
  const g=actx.createGain(); env(g,t,vol,dur,0.002); s.connect(f); f.connect(g); g.connect(BUS); s.start(t);}catch(e){} }
function pluck(fr,dur=0.8,vol=0.3,when=0){ if(!actx||MUTE) return; try{ // Karplus-Strong string
  const sr=actx.sampleRate,n=Math.floor(sr*dur),b=actx.createBuffer(1,n,sr),d=b.getChannelData(0),p=Math.max(2,Math.round(sr/fr));
  for(let i=0;i<p;i++) d[i]=Math.random()*2-1; for(let i=p;i<n;i++) d[i]=0.996*0.5*(d[i-p]+d[i-p+1]);
  const s=actx.createBufferSource(); s.buffer=b; const g=actx.createGain(); g.gain.value=vol; s.connect(g); g.connect(BUS); s.start(actx.currentTime+when);}catch(e){} }
const PENTA=[0,2,4,7,9]; const note=(base,step)=>base*Math.pow(2,(PENTA[step%5]+12*Math.floor(step/5))/12);
// Recipes (each = transient + body + tail; all pitch-varied):
const sfx={
  click(){ const v=vary(); noise(0.012,5000*v,0.25,'highpass'); tone(1500*v,0.04,0.06,'triangle',0,null,4000); },
  thump(force=1){ const v=vary(); noise(0.02,4000,0.3*force,'highpass'); noise(0.15,600*v,0.7*force); tone(140*v,0.18,0.35*force,'sine',0,55); },
  wood(){ const v=vary(); noise(0.01,6000,0.3,'highpass'); tone(800*v,0.06,0.18,'triangle',0,650,3000); tone(1900*v,0.03,0.05,'sine'); },
  clang(big){ const v=vary(0.04),f=(big?420:520)*v; noise(0.02,7000,0.4,'highpass'); [1,2.76,5.4,8.93].forEach((k,i)=>tone(f*k,(big?0.9:0.5)/(1+i*0.3),0.12/(i+1),'sine')); },
  swish(){ const v=vary(); noise(0.16,2000*v,0.22,'bandpass',0.8); },
  pop(){ const v=vary(); tone(500*v,0.08,0.2,'sine',0,900*v); noise(0.01,5000,0.15,'highpass'); },
  combo(step){ const f=note(523,step); tone(f,0.18,0.12,'triangle',0,null,6000); if(step>=8) tone(f*2,0.15,0.04,'sine'); },
  win(){ [0,1,2].forEach(i=>tone(note(523,i*2),0.25,0.11,'triangle',i*0.09,null,6000)); },
  lose(){ tone(220,0.35,0.12,'triangle',0,null,2000); tone(196,0.5,0.12,'triangle',0.18,165,2000); noise(0.3,300,0.4); },
  best(){ [0,2,4].forEach((s,i)=>tone(note(659,s),0.2,0.1,'sine',i*0.08)); }
};
```
Existing games (1–4) use the older helpers that connect straight to `destination` with no compressor or pitch variation. Upgrade a game's sounds to this kit only when we next change that game.

---

## Checklist for every new game
1. **Verb:** one word, understood in under 3 seconds without text.
2. **Principles:** 3–5 picked from the table, written in the spec and in `games.json`.
3. **Instant start:** under 1 s to control, one-tap retry, death moment about 0.5 s and skippable.
4. **Silent and thumb test:** fully playable muted; every sound has a visual or haptic twin; one thumb, or the feed card warns.
5. **Juice pass:** every input answers back; one signature celebration; hit-stop and shake only where the table allows.
6. **Sound pass (S1–S11):** layered, pitch-varied, enveloped, through the compressor; wins musical, losses dramatic but not mocking; signature sound named; offline render check passes.
7. **Fairness pass:** telegraphs visible; generous hitboxes; every loss explainable in half a second.
8. **Difficulty:** the first level nearly always wins for a real person; one variable ramps; hard levels short; DDA (disclosed) if it fits.
9. **Ending:** a clear outcome card with the key stat and best; nothing auto-continues.
10. **Calm check** (calm games only): no timer, no fail, 3–5 colours, soft feedback.
11. **Dark-pattern check:** nothing from the AVOID list.
12. **Signature moment:** one line.

## AVOID (dark patterns; none of these belong in his feed)
1. Energy or lives timers. → Unlimited free retries.
2. Engineered near-misses. → Report only the real margin.
3. Continues, escalating continue offers. → Just restart.
4. Artificial difficulty spikes. → Tune for fun.
5. Post-win upsells or multipliers. → A win is just a win.
6. Slot-style random reveals tied to value. → Celebrate earned rewards, not random draws.
7. Streak guilt or wagers. → If anything, a calendar of days played with no reset or warnings.
8. FOMO / expiring content. → Nothing expires.
9. Pull-back notifications. → None.
10. Infinite autoplay. → Tap to start; soft "set complete" breaks.
11. Hidden manipulation of odds. → Disclose assists.
12. The Flappy Bird lesson: if a game is pulling him rather than pleasing him, retune it or retire it.
