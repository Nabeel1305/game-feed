#!/usr/bin/env python3
"""Fetches the fonts the games use, so the feed app works with no internet.

Every game links Google Fonts. The phone app must not wait on the network for them, so the fonts are
kept in feed/fonts/ (copied from the @fontsource packages on npm, which are the same Google fonts)
and tools/build_feed.py points each game at feed/fonts/fonts.css instead.

Run this when a new game uses a font that is not in feed/fonts/ yet:
    python3 tools/fonts.py
It needs npm. Only the latin and latin-ext parts of each font are kept."""
import json, os, re, subprocess, sys, tarfile, tempfile, shutil

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = os.path.join(root, 'feed', 'fonts')
SUBSETS = ('latin', 'latin-ext')
# fonts the feed's own screens use
FEED = {'Barlow Condensed': {600, 700}, 'Nunito': {600, 700, 800}}


def wanted():
    """{family: {weights}} from every game's Google Fonts link plus the feed's own."""
    want = {k: set(v) for k, v in FEED.items()}
    reg = json.load(open(os.path.join(root, 'games.json')))
    for g in reg['games']:
        html = open(os.path.join(root, g['path']), encoding='utf-8').read()
        for url in re.findall(r'fonts\.googleapis\.com/css2\?([^"\']+)', html):
            for fam in re.findall(r'family=([^&]+)', url.replace('&amp;', '&')):
                name, _, spec = fam.partition(':')
                name = name.replace('+', ' ')
                weights = {int(w) for w in re.findall(r'\d{3}', spec)} or {400}
                want.setdefault(name, set()).update(weights)
    return want


def slug(name):
    return name.lower().replace(' ', '-')


def fetch(name, weights, tmp):
    s = slug(name)
    d = os.path.join(tmp, s)
    os.makedirs(d)
    r = subprocess.run(['npm', 'pack', f'@fontsource/{s}', '--silent'], cwd=d, capture_output=True, text=True)
    tgz = [f for f in os.listdir(d) if f.endswith('.tgz')]
    if r.returncode or not tgz:
        print(f'  !! could not download {name}: {r.stderr.strip()[:200]}')
        return []
    faces = []
    with tarfile.open(os.path.join(d, tgz[0])) as t:
        names = set(t.getnames())
        for w in sorted(weights):
            css_name = f'package/{w}.css'
            if css_name not in names:
                print(f'  !! {name} has no weight {w}')
                continue
            css = t.extractfile(css_name).read().decode('utf-8')
            for sub in SUBSETS:
                m = re.search(r'/\* %s-%s-%d-normal \*/\s*@font-face\s*\{(.*?)\}' % (re.escape(s), sub, w), css, re.S)
                member = f'package/files/{s}-{sub}-{w}-normal.woff2'
                if not m or member not in names:
                    continue
                rng = re.search(r'unicode-range:\s*([^;]+);', m.group(1))
                fn = f'{s}-{sub}-{w}.woff2'
                with open(os.path.join(out, fn), 'wb') as f:
                    f.write(t.extractfile(member).read())
                faces.append((name, w, sub, fn, rng.group(1).strip() if rng else None))
    return faces


def main():
    want = wanted()
    os.makedirs(out, exist_ok=True)
    for f in os.listdir(out):
        os.remove(os.path.join(out, f))
    tmp = tempfile.mkdtemp(prefix='gf-fonts-')
    faces = []
    try:
        for name in sorted(want):
            got = fetch(name, want[name], tmp)
            print(f'{name}: weights {sorted(want[name])} -> {len(got)} files')
            faces += got
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    css = ['/* Made by tools/fonts.py. Do not edit by hand. */']
    for name, w, sub, fn, rng in faces:
        css.append("@font-face{font-family:'%s';font-style:normal;font-weight:%d;font-display:swap;src:url(%s) format('woff2');%s}"
                   % (name, w, fn, f'unicode-range:{rng};' if rng else ''))
    open(os.path.join(out, 'fonts.css'), 'w', encoding='utf-8').write('\n'.join(css) + '\n')
    total = sum(os.path.getsize(os.path.join(out, f)) for f in os.listdir(out))
    print(f'{len(faces)} font files, {total // 1024} KB in feed/fonts/')
    missing = [f'{n} {w}' for n in want for w in want[n] if not any(a == n and b == w for a, b, *_ in faces)]
    if missing:
        print('MISSING:', ', '.join(missing))
        sys.exit(1)


if __name__ == '__main__':
    main()
