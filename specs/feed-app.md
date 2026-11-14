# The feed app ("Game Feed")

Nabeel's brief (Nov 2026): "build it properly, like an app on its own, an app that has all these games... a place where I can just keep on adding games indefinitely... I'll be scrolling. Later on, we're gonna create algorithms that are gonna predict what game is gonna come up next. But not now. Right now, we can just make the feed random... if I like a game, I can search a game or I can pin a game. Just like TikTok, but for games. Let it have all the 6 games, and let it also make an APK."

## What he gets
- **One card at a time, full screen.** Swipe up: next game. Swipe down: the one before. The order is a shuffled deck: every game comes up once before any repeats, never the same game twice running, and after three intense games in a row a calmer one is pulled forward (P26).
- **The card** shows a 3 s silent clip of real play behind the game's number, kind, name (in the game's own title font), one line about it, and whether it needs one thumb or two (P25, P27, P30). A tap anywhere on the card drops him straight into the action: no menu, countdown or intro, playing within a second, at his own level (his choice on 14 Nov 2026 between this, taking over the clip at the exact moment he tapped, and leaving it as it was).
- **The bar** under the card: **Games** (every game, newest first, pinned ones on top, search by name, kind or number; tap one to go to it), **Sound**, the swipe handle, **Pin**.
- **Sound** is one switch for the whole app (his words: "when I off the sound, I'm offing the sound for all the games"): off silences every game until he turns it back on, and the app remembers it.
- **Leaving a game** by swiping up on the bar freezes it exactly where it is. Coming back shows "Paused: Continue / Start over". Fast or two-thumb games count 3, 2, 1 before they carry on.
- **A soft break** after about ten games played: "That's a set. Keep going / Done for now" (P27, AVOID 10). No streaks, no notifications, nothing that expires.
- **Play history is kept on the phone** for the later "what comes next" brain (P29): per game how often its card was shown, started, seconds played, quick skips (left within 2.5 s without playing), pins, plus a rolling log of the last 600 events (`gf.stats`, `gf.log`).

## How it is built
See "The feed app" in CLAUDE.md and LESSONS.md. In short: `tools/build_feed.py` turns `games.json` into `out/app/`; that folder is both the hosted page and the inside of the Android app.

## Decisions
- Random for now means a shuffled deck, not dice: with few games, dice repeat the same game too often.
- Pin means "keep this one handy" (top of the Games list). It does not change the order yet; that belongs to the later brain.
- No likes, comments, profiles or sharing: he asked for search and pin.
- **Install once.** His words: "I'm probably never gonna stop adding games to this app... if I just tell you to add this game, will it be able to add without me updating anything? Because that's what I need." So the phone app fetches new games from the project's `app-v2` branch every time it opens. **And app-wide changes come as a new download** (his words, 14 Nov 2026, after the first app restarted under him: "what is very important to me is the new games load automatically, but when it comes to app-wide fixes, I think you can just give me another APK"): the feed page and the Android wrapper only change when he installs a new APK. The first apps (builds 15 to 18) read the old `app` branch, which is frozen at build 18 so they are never disturbed.
- **The same basic controls everywhere** (his words, 14 Nov 2026: "it needs to remember your level on each game... I can restart that particular match. I can press pause, go to a lower level and play there. Just the basic controls"). A tap puts him on the level he was on; Pause is on the bar in the same place for every game; the Paused card and every game's own pause menu offer Resume, Restart, Levels; lower levels are open, higher ones locked until he wins his way there.
- **A game goes on the app only when he says so** (his words, 15 Nov 2026: "you're not gonna put the game on the app until I specifically tell you to... I want to be able to say, hey, put this game on the app now"). Until then a new game is a hosted page for him to play-test. `"in_app": true` in `games.json` is his word written down; nothing else puts a game in `out/app/`.
- **Every card shows the most exciting moment of its game**, filmed to one set of rules so the cards look like one set (LESSONS, "Every clip is the most exciting moment").
- The app works with no internet from whatever is on the phone, and uses the internet only to fetch new games. It asks for vibration and internet, nothing else, and sends nothing about him anywhere.
- Engagement principles used for the feed itself: P25 (pause anywhere, thumbs warning), P26 (variety with rhythm, pins), P27 (previews, tap to start, set card), P29 (history for tuning), P30 (each game's identity on its card).

## Later (not built; wait for him to ask)
1. The "what comes next" brain: replace `nextGame()` in `feed/index.html`; the history is already there.
2. Taking over the clip at the exact moment he taps it (same scene, same position). Offered and not chosen; a much bigger build, one game at a time.
3. Games reporting finished levels with `GameFeed.finish({win, level, score})` so the brain can tell finishing from quitting.
4. When there are hundreds of games: fetch a game when its card comes up instead of keeping every game on every phone, and let him keep favourites for offline play. Proper hosting when there are real users (keep publishing the `app-v2` branch for installed apps, and leave the frozen `app` branch where it is).
5. Calm-only filter, daily special (P28), a "least fun 10" review screen (P29).
6. The next time the Android wrapper has to change for another reason (not before: every wrapper change is a download for him): look for new games every time he comes back to the app, not only after ten minutes or from closed, and give the Games list a "Check for new games" line.
