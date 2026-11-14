# Game Feed

A swipe-up feed of mini-games. See **[LEDGER.md](LEDGER.md)** for every game and where to play it.

**Android app:** download [GameFeed.apk](https://github.com/Nabeel1305/game-feed/releases/latest/download/GameFeed.apk) on your phone and open it to install. You only do this once: every time the app opens it fetches any new games by itself.

- `games.json`: the official list of games
- `games/<id>/index.html`: each game
- `feed/`: the feed app (the scrolling screen, the plug that lets it start and pause any game, card pictures, clips, fonts)
- `android/`: the Android wrapper around the feed app
- `LESSONS.md`: how the games and the feed are built and what every new game must get right
- `PLAYBOOK.md`: the engagement research every game follows
- `tools/check.py`: loads every game and the feed and checks for problems (runs automatically on GitHub)
- `tools/build_feed.py`: builds the feed app from `games.json`; `tools/test_feed.py` tests it; `tools/previews.py` films each game's card; `tools/fonts.py` fetches fonts
- `tools/test_sync.py`: tests the part of the phone app that fetches new games
- the `app` branch: the built feed app, put there by GitHub after every change; installed phone apps fetch new games from it
