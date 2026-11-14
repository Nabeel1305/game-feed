#!/usr/bin/env python3
"""Builds the feed app into out/app/ (or the folder given with --out).

The app is the feed page plus every game in games.json that is approved or in testing:
    index.html            the feed (feed/index.html)
    games.js              the list of games, made from games.json
    games/<id>/index.html each game, with the feed plug (feed/plug.js) put at the top of its page
    posters/, previews/   the still and the short silent clip shown on each game's card
    fonts/                the games' fonts, so nothing waits on the internet

The same folder is what gets published as the feed page and what goes inside the phone app.
Adding a game to games.json is all it takes for it to show up here.
Run: python3 tools/build_feed.py [--out DIR]"""
import json, os, re, shutil, sys, datetime

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IN_FEED = ('approved', 'testing')


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


def build(out):
    reg = json.load(open(os.path.join(root, 'games.json'), encoding='utf-8'))
    plug = open(os.path.join(root, 'feed', 'plug.js'), encoding='utf-8').read()
    have = fonts_available()
    notes, problems, listing = [], [], []
    if os.path.exists(out):
        shutil.rmtree(out)
    os.makedirs(out)
    shutil.copy(os.path.join(root, 'feed', 'index.html'), os.path.join(out, 'index.html'))
    for d in ('fonts', 'posters', 'previews'):
        src = os.path.join(root, 'feed', d)
        if os.path.isdir(src):
            shutil.copytree(src, os.path.join(out, d))
    for g in reg['games']:
        if g['status'] not in IN_FEED:
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
            'font': feed.get('font', ''), 'status': g['status'], 'v': g.get('version', ''),
            'words': re.sub(r'\s+', ' ', g.get('summary', ''))[:240],
        }
        for key, folder, exts in (('poster', 'posters', ('webp', 'jpg', 'png')), ('preview', 'previews', ('webm', 'mp4'))):
            for ext in exts:
                if os.path.exists(os.path.join(out, folder, f"{g['id']}.{ext}")):
                    item[key] = f"{folder}/{g['id']}.{ext}"
                    break
        if 'poster' not in item:
            notes.append(f"{g['id']}: no card picture yet. Run tools/previews.py {g['id']}.")
        listing.append(item)
    listing.sort(key=lambda x: x['n'])
    stamp = datetime.date.today().isoformat()
    open(os.path.join(out, 'games.js'), 'w', encoding='utf-8').write(
        '/* Made by tools/build_feed.py from games.json. Do not edit by hand. */\n'
        'window.GF_GAMES=' + json.dumps(listing, ensure_ascii=False, separators=(',', ':')) + ';\n'
        'window.GF_BUILD=' + json.dumps({'games': len(listing), 'built': stamp}) + ';\n')
    return listing, notes, problems


if __name__ == '__main__':
    out = os.path.join(root, 'out', 'app')
    if '--out' in sys.argv:
        out = os.path.abspath(sys.argv[sys.argv.index('--out') + 1])
    listing, notes, problems = build(out)
    size = sum(os.path.getsize(os.path.join(d, f)) for d, _, fs in os.walk(out) for f in fs)
    for n in notes:
        print('note:', n)
    if problems:
        print('PROBLEMS:')
        [print(' -', p) for p in problems]
        sys.exit(1)
    print(f'Feed app built in {os.path.relpath(out, root)}: {len(listing)} games, {size // 1024} KB')
