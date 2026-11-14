# The feed app ("Game Feed")

Nabeel's brief (Nov 2026): "build it properly, like an app on its own, an app that has all these games... a place where I can just keep on adding games indefinitely... I'll be scrolling. Later on, we're gonna create algorithms that are gonna predict what game is gonna come up next. But not now. Right now, we can just make the feed random... if I like a game, I can search a game or I can pin a game. Just like TikTok, but for games. Let it have all the 6 games, and let it also make an APK."

## What he gets
- **One card at a time, full screen.** Swipe up: next game. Swipe down: the one before. The order is a shuffled deck: every game comes up once before any repeats, never the same game twice running, and after three intense games in a row a calmer one is pulled forward (P26).
- **The card** shows a 3 s silent clip of real play behind the game's number, kind, name (in the game's own title font), one line about it, and whether it needs one thumb or two (P25, P27, P30). A tap anywhere on the card starts the game at once: the feed presses the game's own Play button.
- **The bar** under the card: **Games** (every game, newest first, pinned ones on top, search by name, kind or number; tap one to go to it), the swipe handle, **Pin**.
- **Leaving a game** by swiping up on the bar freezes it exactly where it is. Coming back shows "Paused: Continue / Start over". Fast or two-thumb games count 3, 2, 1 before they carry on.
- **A soft break** after about ten games played: "That's a set. Keep going / Done for now" (P27, AVOID 10). No streaks, no notifications, nothing that expires.
- **Play history is kept on the phone** for the later "what comes next" brain (P29): per game how often its card was shown, started, seconds played, quick skips (left within 2.5 s without playing), pins, plus a rolling log of the last 600 events (`gf.stats`, `gf.log`).

## How it is built
See "The feed app" in CLAUDE.md and LESSONS.md. In short: `tools/build_feed.py` turns `games.json` into `out/app/`; that folder is both the hosted page and the inside of the Android app.

## Decisions
- Random for now means a shuffled deck, not dice: with few games, dice repeat the same game too often.
- Pin means "keep this one handy" (top of the Games list). It does not change the order yet; that belongs to the later brain.
- No likes, comments, profiles or sharing: he asked for search and pin.
- **Install once.** His words: "I'm probably never gonna stop adding games to this app... if I just tell you to add this game, will it be able to add without me updating anything? Because that's what I need." So the phone app fetches new games, and the feed itself, from the project's `app` branch every time it opens; a new APK is only for changes to the small Android wrapper.
- The app works with no internet from whatever is on the phone, and uses the internet only to fetch new games. It asks for vibration and internet, nothing else, and sends nothing about him anywhere.
- Engagement principles used for the feed itself: P25 (pause anywhere, thumbs warning), P26 (variety with rhythm, pins), P27 (previews, tap to start, set card), P29 (history for tuning), P30 (each game's identity on its card).

## Later (not built; wait for him to ask)
1. The "what comes next" brain: replace `nextGame()` in `feed/index.html`; the history is already there.
2. Mini modes: a game that defines `window.gameFeedStart('mini')` and sets `feed.mini` could start a quick taste straight from the card.
3. Games reporting finished levels with `GameFeed.finish({win, level, score})` so the brain can tell finishing from quitting.
4. When there are hundreds of games: fetch a game when its card comes up instead of keeping every game on every phone, and let him keep favourites for offline play. Proper hosting when there are real users (keep publishing the `app` branch for old installs).
5. Calm-only filter, daily special (P28), a "least fun 10" review screen (P29).
