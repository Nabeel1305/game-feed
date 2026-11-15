#!/usr/bin/env python3
"""Builds the feed app into out/app/ (or the folder given with --out).

The app is the feed page plus every game in games.json that Nabeel has asked to be put on the app
("in_app": true; a game he is still play-testing is not there, whatever its status):
    index.html            the feed (feed/index.html)
    games.js              the list of games, made from games.json
    games/<id>/index.html each game, with the feed plug (feed/plug.js) put at the top of its page
    posters/, previews/   the still and the short silent clip shown on each game's card
    pics/                 a small picture of each game for the Games list (every phone keeps these: they are tiny)
    fonts/                the games' fonts, so nothing waits on the internet
    manifest.txt          every file with its fingerprint: the phone app reads this to see what is new

The same folder is what gets published as the feed page, what goes inside the phone app, and what GitHub
puts on the app-v2 branch, where every installed phone app looks for new games (see android/ Sync.java).
Setting "in_app": true on a game in games.json (when he says "put it on the app") is all it takes for it to show up here.
With --core only the core games' own files are put in (the ones marked "core": true): that is what goes inside
the phone app. The list still names every game on the app; the others are fetched when their card comes up, or
kept on the phone when he saves them from the Games list (see android/ Sync.java).
Run: python3 tools/build_feed.py [--out DIR] [--core]"""
import hashlib, json, os, re, shutil, sys

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IN_FEED = ('approved', 'testing')      # the only statuses a game on the app may have


def in_app(g):
    """A game is on the app only when Nabeel has said so ("put this game on the app"): "in_app": true in games.json.
    A game he is still play-testing is a hosted page and nothing more, whatever its status."""
    return g.get('in_app') is True and g['status'] in IN_FEED


def fonts_available():
    css = os.path.join(root, 'feed', 'fonts', 'fonts.css')
    if not os.path.exists(css):
        return set()
    return {(m.group(1), int(m.group(2))) for m in
            re.finditer(r"font-family:'([^']+)';font-style:normal;font-weight:(\d+)", open(css, encoding='utf-8').read())}


def local_fonts(html, rel_css, have, gid, notes):
    """Swap the game's Google Fonts link for the fonts kept in the app, when all of them are there."""
    links = re.findall(r'<link[^>]*fonts\.(?:googleapis|gstatic)\.com[^>]*>\s*', html)
    need = set()
    for l in links:
        for fam in re.findall(r'family=([^&"\']+)', l.replace('&amp;', '&')):
            name, _, spec = fam.partition(':')
            for w in ({int(x) for x in re.findall(r'\d{3}', spec)} or {400}):
                need.add((name.replace('+', ' '), w))
    if not links:
        return html
    missing = sorted(need - have)
    if missing:
        notes.append(f"{gid}: fonts not in feed/fonts yet ({', '.join(f'{n} {w}' for n, w in missing)}); it will load them from the internet. Run tools/fonts.py.")
        return html
    first = True
    def swap(m):
        nonlocal first
        if first:
            first = False
            return f'<link rel="stylesheet" href="{rel_css}">\n'
        return ''
    return re.sub(r'<link[^>]*fonts\.(?:googleapis|gstatic)\.com[^>]*>\s*', swap, html)


def first_sentence(text, limit=70):
    s = re.split(r'(?<=[.!?])\s', text.strip())[0]
    return s if len(s) <= limit else s[:limit - 1].rstrip() + '…'


def game_of(rel):
    """The game a file belongs to (its page, card picture or clip), or None for a file every phone keeps. Same rule as Sync.gameOf."""
    m = re.fullmatch(r'games/([a-z0-9][a-z0-9-]{0,63})/.+|(?:posters|previews)/([a-z0-9][a-z0-9-]{0,63})\.[a-z0-9]{2,5}', rel)
    return (m.group(1) or m.group(2)) if m else None


def build(out, reg=None, build_number=None, core_only=False, cards_from=None):
    """reg and build_number are only given by the tests; normally they come from games.json and BUILD_NUMBER.
    core_only leaves out the files of games that are not core (for the inside of the phone app).
    cards_from (tests only) gives a made-up game the card pictures of a real one: {made-up id: real id}."""
    if reg is None:
        reg = json.load(open(os.path.join(root, 'games.json'), encoding='utf-8'))
    plug = open(os.path.join(root, 'feed', 'plug.js'), encoding='utf-8').read()
    have = fonts_available()
    notes, problems, listing = [], [], []
    if os.path.exists(out):
        shutil.rmtree(out)
    os.makedirs(out)
    shutil.copy(os.path.join(root, 'feed', 'index.html'), os.path.join(out, 'index.html'))
    shutil.copytree(os.path.join(root, 'feed', 'fonts'), os.path.join(out, 'fonts'))
    on_app = [g['id'] for g in reg['games'] if in_app(g)]
    for d in ('posters', 'previews', 'pics'):            # card pictures, clips and list pictures: only for games that are on the app
        src = os.path.join(root, 'feed', d)
        os.makedirs(os.path.join(out, d))
        for f in sorted(os.listdir(src)) if os.path.isdir(src) else []:
            if f.rsplit('.', 1)[0] in on_app:
                shutil.copy(os.path.join(src, f), os.path.join(out, d, f))
            for new, real in (cards_from or {}).items():
                if f.rsplit('.', 1)[0] == real: shutil.copy(os.path.join(src, f), os.path.join(out, d, new + '.' + f.rsplit('.', 1)[1]))
    for g in reg['games']:
        if not in_app(g):
            continue
        src = os.path.join(root, g['path'])
        if not os.path.exists(src):
            problems.append(f"{g['id']}: missing {g['path']}")
            continue
        feed = g.get('feed') or {}
        html = open(src, encoding='utf-8').read()
        dest_rel = f"games/{g['id']}/index.html"
        html = local_fonts(html, os.path.relpath('fonts/fonts.css', os.path.dirname(dest_rel)).replace(os.sep, '/'), have, g['id'], notes)
        cfg = {'id': g['id'], 'start': feed.get('start') or ['#playBtn']}
        # the charset line goes first so the browser still finds it within the first bytes of the page
        tag = '<meta charset="utf-8">\n<script>' + plug.replace('/*CFG*/{}', json.dumps(cfg)) + '</script>\n'
        m = re.search(r'<head[^>]*>', html, re.I)
        if not m:
            problems.append(f"{g['id']}: no <head> to put the plug in")
            continue
        html = html[:m.end()] + '\n' + tag + html[m.end():]
        dest = os.path.join(out, dest_rel)
        os.makedirs(os.path.dirname(dest))
        open(dest, 'w', encoding='utf-8').write(html)
        item = {
            'n': g['number'], 'id': g['id'], 'name': g['name'], 'path': dest_rel,
            'hook': feed.get('hook') or first_sentence(g.get('summary', '')),
            'genre': feed.get('genre', ''), 'intensity': feed.get('intensity', 3), 'thumbs': feed.get('thumbs', 1),
            'font': feed.get('font', ''), 'status': g['status'], 'v': g.get('version', ''), 'mini': bool(feed.get('mini')),
            'levels': 'window.gameFeedLevels' in html,          # the game can open its own level list: the Paused card offers "Levels"
            'words': re.sub(r'\s+', ' ', g.get('summary', ''))[:240],
            'core': g.get('core') is True,                     # inside the phone app itself, always on the phone
        }
        size = len(html.encode('utf-8'))
        for key, folder, exts in (('poster', 'posters', ('webp', 'jpg', 'png')), ('preview', 'previews', ('webm', 'mp4')), ('pic', 'pics', ('webp', 'jpg'))):
            for ext in exts:
                f = os.path.join(out, folder, f"{g['id']}.{ext}")
                if os.path.exists(f):
                    item[key] = f"{folder}/{g['id']}.{ext}"
                    if key != 'pic': size += os.path.getsize(f)
                    break
        item['kb'] = (size + 1023) // 1024                     # what saving this game to the phone takes
        if 'poster' not in item or 'pic' not in item:
            notes.append(f"{g['id']}: no card picture yet. Run tools/previews.py {g['id']}.")
        listing.append(item)
    listing.sort(key=lambda x: x['n'])
    # "rev" names this exact set of games and files. It only changes when something he could see changes,
    # so a phone does not reload the feed for a push that touched nothing in the app.
    files = {}
    for d, _, fs in os.walk(out):
        for f in fs:
            full = os.path.join(d, f)
            rel = os.path.relpath(full, out).replace(os.sep, '/')
            if rel in ('manifest.txt', 'games.js') or not re.fullmatch(r'[A-Za-z0-9_][A-Za-z0-9._/-]*', rel) or '..' in rel:
                if rel not in ('manifest.txt', 'games.js'): problems.append(f'file name the phone app cannot fetch: {rel}')
                continue
            data = open(full, 'rb').read()
            files[rel] = (hashlib.sha256(data).hexdigest(), len(data))
    body = json.dumps(listing, ensure_ascii=False, separators=(',', ':'))
    rev = hashlib.sha256((body + ''.join(f'{h} {p}\n' for p, (h, _) in sorted(files.items()))).encode('utf-8')).hexdigest()[:12]
    js = ('/* Made by tools/build_feed.py from games.json. Do not edit by hand. */\n'
          'window.GF_GAMES=' + body + ';\n'
          'window.GF_BUILD=' + json.dumps({'games': len(listing), 'rev': rev}) + ';\n').encode('utf-8')
    open(os.path.join(out, 'games.js'), 'wb').write(js)
    files['games.js'] = (hashlib.sha256(js).hexdigest(), len(js))
    if core_only:       # the inside of the phone app: the same list and the same "rev", but only the core games' own files
        core = [g['id'] for g in reg['games'] if in_app(g) and g.get('core') is True]
        for rel in [r for r in files if game_of(r) and game_of(r) not in core]:
            os.remove(os.path.join(out, rel))
            del files[rel]
        for g in on_app:
            d = os.path.join(out, 'games', g)
            if g not in core and os.path.isdir(d) and not os.listdir(d): os.rmdir(d)
    # the build number only ever goes up (it is GitHub's run number): the phone app never swaps its copy for an older one
    build = int(build_number if build_number is not None else (os.environ.get('BUILD_NUMBER') or 0))
    open(os.path.join(out, 'manifest.txt'), 'w', encoding='utf-8').write(
        f'# Game Feed app. build {build} rev {rev}\n' + ''.join(f'{h} {n} {p}\n' for p, (h, n) in sorted(files.items())))
    return listing, notes, problems


if __name__ == '__main__':
    out = os.path.join(root, 'out', 'app')
    if '--out' in sys.argv:
        out = os.path.abspath(sys.argv[sys.argv.index('--out') + 1])
    listing, notes, problems = build(out, core_only='--core' in sys.argv)
    size = sum(os.path.getsize(os.path.join(d, f)) for d, _, fs in os.walk(out) for f in fs)
    for n in notes:
        print('note:', n)
    if problems:
        print('PROBLEMS:')
        [print(' -', p) for p in problems]
        sys.exit(1)
    print(f'Feed app built in {os.path.relpath(out, root)}: {len(listing)} games, {size // 1024} KB')
