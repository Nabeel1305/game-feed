# Game Feed: instructions for Claude

Nabeel is building a TikTok-style feed of mini-games: swipe up and a random game starts instantly. Games are built one at a time; he play-tests each as a hosted page, gives feedback, and approves it. Goal: 1,000 games. He is not technical; talk in plain words.

## At the start of every session
1. Read `games.json` (the official registry) and `LEDGER.md`. If he asks "where are we?", answer from these: number of games, each game with its status and play link, and what's next.
2. Read `LESSONS.md` and follow it: his taste, the rules every game must pass, how to test, and build notes for each existing game. Reuse code from the most similar existing game in `games/<id>/index.html`.

## Adding or changing a game
1. Build the game as one self-contained `games/<id>/index.html` (canvas, inline JS/CSS, Google Fonts with fallbacks, synthesized sounds). Give it its own `storage_prefix` for saves.
2. Test it (see LESSONS.md, including fast-forward cheat tests), then publish it as an artifact so he can play it; republish the same artifact for each revision.
3. When he approves it: add or update its entry in `games.json` (next number; never renumber; bump `version` on changes), run `python3 tools/ledger.py`, add its build notes and any new lessons to `LESSONS.md`, then commit and push. GitHub runs `tools/check.py`, which loads every game and fails on errors or registry mistakes.
4. Statuses: `in-progress` (being built), `testing` (he's play-testing), `approved` (done), `retired` (removed from the feed, number kept).

## The feed (planned, start after game 5)
- Every game must expose the same plug so the feed can host it: start in `mini` or `full` mode, pause when swiped away, resume, and clean up. Track this per game with `feed.mini` in games.json.
- Games will be served from this repo (GitHub Pages); the feed app reads `games.json`, preloads the next games, and lets him download favourites for offline play.
