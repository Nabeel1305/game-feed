#!/usr/bin/env python3
"""Each game's own music (his words, 25 Nov 2026: "can each game have its own music instaed of reusing the same old music tailor each
song to the game"). The band in tools/juice-kit.js plays a SCORE; this file holds one for every game that uses the band, and writes
it into that game's bandStyle(...) call:     python3 tools/scores.py          (then build the games)
A score: the style it starts from (its rhythm section), speed, key, the instrument that carries the tune, the instrument that
plays the chords, the chords (one a bar: 0 = the home chord, 3 = the fourth, 4 = the fifth, 5 = the sixth...), and THE TUNE: three
bars a|b|c played a b a c (or four bars as written). In a bar, eight places (quavers; sixteen places if written with sixteen, six
for a waltz): a digit is a step of the scale above the home note, z y x w are one to four steps below it, a b c are steps 10 11 12,
a dot is nothing. Extras: sc (scale), pen (five-note scale), d (its own drums), rev (room), B (chords of the middle part).
Nothing here is taken from any existing piece of music: every tune was written for its game."""
import json, os, re, glob, sys
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BONGO = {'b': 'x..x..x...x.x...', 'w': '....x.......x...', 'q': 'x.x.x.x.x.x.x.x.'}
MARCH = {'k': 'x.......x.......', 's': '....x.x.....x.xx', 'h': 'x.x.x.x.x.x.x.x.'}
TAIKO = {'d': 'x.....x...x.....', 'u': 'x...............', 'r': '....x.......x...'}
NONE = {}
S = {
 # id: (style, bpm, key, lead, comp, chords, tune, extras)
 'reel':      ('pastoral', 84, 0, 'harmonica', 'guitar', '0304', '4.2.0.2.|3.5.7.5.|4.2.1...', {}),
 'wild-water':('western', 118, -2, 'banjo', 'guitar', '0304', '02420.4.|35753.5.|46421...', {}),
 'soar':      ('calm', 70, 3, ('flute', 1), ('strings', 'P'), '0104', '4...7...|5...3.1.|4...6.4.', {'sc': 'lyd', 'd': NONE, 'rev': 0.7}),
 'vine':      ('island', 104, 1, 'steel', 'marimba', '0304', '4.4.2.0.|5.5.3.0.|4.6.4.1.', {'d': BONGO}),
 'hunter':    ('tense', 98, -1, 'panflute', ('pad', 'P'), '0504', '0..1.0..|2..1.0..|3..2.1..', {'pen': 1, 'd': {'d': 'x.......x.x.....', 'b': '..x..x....x..x..'}}),
 'police':    ('synth', 108, -3, 'saw', 'saw', '0504', '00204420|55425542|44646442', {}),
 'pilot':     ('epic', 96, 2, ('horn', 1), ('strings', 'P'), '0304', '0.4.4.7.|5.3.3.5.|4.6.8...', {'sc': 'mix', 'd': MARCH}),
 'cook':      ('funk', 108, 0, 'pizz', 'keys', '0304', '0..2.0..4..2.0..|3..5.3..0..5.3..|4..6.4..1..6.4..', {'d': {'k': 'x..x......x..x..', 's': '....x.......x...', 'm': 'x...x...x...x...', 'h': 'x.x.x.x.x.x.x.x.'}}),
 'vet':       ('pastoral', 84, -2, 'whistle', 'guitar', '0504', '2.4.2.0.|5.7.9.7.|4.6.4.1.', {}),
 'lighthouse':('waltz', 124, 3, 'musicbox', 'keys', '0304', '0.2.4.|3.5.7.|4.2.1.', {}),
 'hiring':    ('jazz', 104, 1, 'piano', 'keys', '1405', '3.5.3.1.|4.6.8.6.|7.4.2.0.|5.7.5...', {}),
 'potter':    ('calm', 72, -1, 'harp', ('pad', 'P'), '0304', '0.4.7.4.|3.5.7.5.|4.6.8.6.', {'d': {'q': '..x...x...x...x.'}}),
 'drone':     ('synth', 112, -3, 'square', ('pad', 'P'), '0504', '4.7.4.2.|5.9.7.5.|4.8.6.4.', {'sc': 'maj'}),
 'whaling':   ('epic', 88, 2, 'accordion', ('strings', 'P'), '0604', '0.0.2.4.|6.6.8.6.|4.4.2.1.', {'sc': 'dor', 'd': {'d': 'x.......x.......', 'c': '....x.......x...'}}),
 'wolf':      ('tense', 92, 0, ('flute', 0), ('choir', 'P'), '0504', '0...2.1.|3...2.0.|4...3.2.', {'pen': 1, 'd': TAIKO}),
 'run':       ('race', 142, -2, 'saw', ('pad', 'P'), '0504', '04240424|50205020|41614161', {}),
 'castle':    ('epic', 88, 3, ('horn', 1), ('strings', 'P'), '0304', '0...4.2.|3...5.3.|4...2.1.', {'sc': 'dor', 'd': TAIKO}),
 'tag':       ('arcade', 136, 1, 'xylo', 'square', '0304', '0.4.2.4.|3.7.5.7.|4.8.6.4.', {}),
 'heaven':    ('waltz', 120, -1, 'bell', ('harp', 'a.a.a.a.a.a.'), '0304', '7.4.2.|7.5.3.|6.4.1.', {'rev': 0.7}),
 'harvest':   ('pastoral', 86, -3, 'accordion', 'guitar', '0304', '0.2.4.7.|5.3.5.7.|6.4.2.1.', {}),
 'horde':     ('epic', 96, 2, 'brass', ('strings', 'P'), '0504', '0.0.0.2.|5.5.5.4.|4.4.4.6.', {'d': {'d': 'x..x..x.x..x..x.', 'u': 'x.......x.......', 's': '............x...'}}),
 'golf':      ('island', 100, 0, 'marimba', 'guitar', '0304', '4.2.4.7.|5.3.5.7.|4.2.1.z.', {}),
 'penalty':   ('sport', 118, -2, 'brass', 'brass', '0304', '0.0.4.0.|3.3.5.3.|4.4.6.8.', {}),
 'critters':  ('arcade', 132, 3, 'square', 'marimba', '0304', '02420z0.|3.0.3.5.|4.1.4.6.', {'d': BONGO}),
 'rodeo':     ('western', 108, 1, 'harmonica', ('banjo', 'a.a.a.a.a.a.a.a.'), '0304', '4.4.2.0.|3.3.5.3.|4.6.4.2.', {}),
 'eleven':    ('sport', 122, -1, 'brass', 'organ', '0304', '0.2.4.4.|5.5.3.0.|4.4.6.4.', {}),
 'shark':     ('tense', 92, -3, ('horn', 0), ('strings', 'P'), '0504', '0...4.2.|5...4.2.|4...6.4.', {'d': {'u': 'x.......x.......', 'r': '............x...'}, 'rev': 0.65}),
 'powder':    ('sport', 116, 2, 'saw', ('pad', 'P'), '0304', '7.4.2.4.|7.5.3.5.|8.6.4.6.', {'sc': 'maj'}),
 'cairn':     ('east', 80, 0, 'flute', 'koto', '0304', '0.1.2.4.|3.2.1.2.|4.3.2.1.', {'sc': 'maj', 'pen': 1}),
 'pinball':   ('synth', 116, -2, 'bell', 'saw', '0304', '7.4.0.4.|7.5.3.5.|6.4.1.4.', {'sc': 'dor'}),
 'bowling':   ('funk', 104, 1, 'organ', 'keys', '0304', '0.2.4..2.0..2.4.|3.5.7..5.3..5.7.|4.6.8..6.4..2.1.', {'d': {'k': 'x..x......x..x..', 'c': '....x.......x...', 'h': 'x.x.x.x.x.x.x.x.'}}),
 'bonsai':    ('east', 60, -1, 'koto', ('pad', 'P'), '0304', '0...2...|1...0...|2...1...', {'pen': 1, 'd': NONE, 'rev': 0.75, 'bass': '1...............'}),
 'miner':     ('synth', 104, -3, 'bell', ('pad', 'P'), '0504', '0.4.7.9.|5.7.9.7.|4.6.8.6.', {}),
 'lantern':   ('spooky', 76, 2, 'musicbox', ('pad', 'P'), '0504', '0.2.4.2.|5.4.2.0.|4.6.4.1.', {}),
 'kart':      ('race', 134, 0, 'square', 'saw', '0304', '0.4.7.4.|3.7.a.7.|4.8.6.4.', {'sc': 'mix', 'comp': {'i': 'saw', 'p': 'a.a.a.a.a.a.a.a.'}}),
 'judge':     ('jazz', 92, -2, 'piano', 'keys', '1405', '1...3.5.|4...6.4.|0...2.4.|5...2.0.', {'d': {'y': 'x...x.x.x...x.x.', 'r': '....x.......x...'}}),
 'haggle':    ('jazz', 108, 3, 'vibes', 'guitar', '1405', '5.3.1.3.|6.4.1.4.|4.2.0.2.|5.7.5.2.', {}),
 'war':       ('epic', 90, 1, ('horn', 1), ('strings', 'P'), '0504', '0.0.4.4.|5.5.4.2.|4.4.6.4.', {'d': MARCH}),
 'hotel':     ('jazz', 112, -1, 'piano', 'guitar', '1405', '1.3.5.8.|6.4.1.4.|7.4.2.0.|5...7...', {}),
 'ramp':      ('western', 120, -3, 'guitar', 'guitar', '0304', '0.0.6.0.|3.3.2.3.|4.4.3.4.', {'sc': 'mix', 'd': {'k': 'x.....x.x.......', 's': '....x.......x...', 'h': 'x.x.x.x.x.x.x.x.'}}),
 'spell':     ('waltz', 118, 2, 'musicbox', ('harp', 'a.a.a.a.a.a.'), '0104', '0.4.7.|1.3.5.|4.6.8.', {'sc': 'lyd', 'rev': 0.65}),
 'rex':       ('epic', 76, 0, ('horn', 0), ('strings', 'P'), '0304', '0.....4.|7...5.3.|6...4.1.', {'sc': 'maj', 'd': {'u': 'x.........x.....', 'd': '............x.x.'}, 'bass': '1.......1.......', 'rev': 0.7}),
 'rope':      ('waltz', 132, -2, 'accordion', 'organ', '0304', '0.4.2.|3.7.5.|4.8.6.', {}),
 'house':     ('calm', 74, 3, 'piano', ('pad', 'P'), '0304', '2.4.7.4.|5.7.a.7.|4.6.8.6.', {}),
 'fruit':     ('arcade', 134, 1, 'marimba', 'square', '0304', '4.2.0.2.|5.3.0.3.|4.1.z.1.', {'d': BONGO}),
 'peaks':     ('jazz', 92, -1, 'guitar', 'keys', '1405', '5.3.1...|4.6.8...|7.4.2...|5.2.0...', {'sw': 0.2}),
 'row':       ('sport', 112, -3, ('horn', 1), 'brass', '0304', '0.4.0.4.|3.5.3.5.|4.6.4.1.', {}),
 'safe':      ('funk', 100, 2, 'pizz', 'keys', '0504', '0..2..0...z.0...|5..7..5...4.5...|4..6..4...2.1...', {'sc': 'min', 'd': {'k': 'x.........x.....', 'r': '....x..x....x...', 'h': 'x.x.x.x.x.x.x.x.'}}),
 'fire':      ('sport', 124, 0, 'brass', 'saw', '0504', '4.0.4.7.|5.2.5.7.|4.1.4.6.', {'sc': 'min'}),
 'origami':   ('east', 78, -2, 'harp', 'koto', '0304', '0.2.4.2.|3.4.3.2.|1.2.1.0.', {'sc': 'maj', 'pen': 1, 'd': {'i': '........x.......'}}),
 'sweets':    ('arcade', 128, 3, 'musicbox', 'marimba', '0304', '7.4.7.9.|7.5.7.a.|8.6.4.6.', {}),
 'paint':     ('calm', 78, -1, 'vibes', 'keys', '0304', '4...2.0.|5...3.0.|4...2.1.', {}),
 'pour':      ('calm', 76, -3, 'marimba', ('pad', 'P'), '0304', '2.0.2.4.|5.3.5.7.|6.4.6.8.', {}),
 'blocks':    ('island', 100, 2, 'steel', 'guitar', '0304', '0.0.4.2.|3.3.7.5.|4.4.8.6.', {}),
 'plumber':   ('funk', 104, 0, 'organ', 'guitar', '0304', '02z0.4.2|3530.7.5|4641.6.4', {}),
 'stunt':     ('race', 138, -2, 'square', 'saw', '0504', '0.7.4.7.|5.9.7.9.|4.8.6.8.', {'comp': {'i': 'saw', 'p': 'a.a.a.a.a.a.a.a.'}}),
 'knife':     ('western', 100, 3, 'whistle', 'guitar', '0504', '4...0.2.|5...2.0.|4...6.4.', {'sc': 'min'}),
 'mow':       ('pastoral', 92, 1, 'flute', 'guitar', '0304', '0.2.4.5.|7.5.3.5.|4.2.1.2.', {}),
 'helix':     ('arcade', 128, -1, 'bell', 'square', '0304', '7.7.4.2.|7.7.5.3.|8.8.6.4.', {}),
 'sinkhole':  ('funk', 100, -3, ('saw', 0), 'keys', '0304', '0..0..2.4..2.0..|3..3..5.7..5.3..|4..4..6.4..2.1..', {}),
 'crowd':     ('arcade', 136, 2, 'brass', 'square', '0304', '4.4.7.4.|5.5.7.5.|6.6.8.6.', {'d': {'k': 'x...x...x...x...', 'c': '....x.......x...', 'h': 'x.x.x.x.x.x.x.x.'}}),
 'words':     ('calm', 72, 0, 'piano', ('pad', 'P'), '0304', '4.2.0...|5.3.0...|4.2.1...', {'d': NONE}),
 'sniper':    ('tense', 96, -2, 'pizz', ('pad', 'P'), '0504', '0...0.2.|5...5.4.|4...4.6.', {'d': {'w': 'x...x...x...x...', 'k': 'x...............'}}),
 'crew':      ('synth', 104, 1, ('saw', 0), ('pad', 'P'), '0504', '0.2.0.z.|5.4.2.0.|4.6.4.2.', {}),
 'sprint':    ('sport', 126, -3, 'brass', 'brass', '0304', '0.0.0.4.|3.3.3.5.|4.4.4.8.', {'d': {'k': 'x...x...x...x...', 's': '....x.......x...', 'h': 'xxxxxxxxxxxxxxxx'}}),
 'bus':       ('jazz', 98, 2, 'keys', 'guitar', '1405', '1.3.5.3.|4.6.8.6.|7.5.4.2.|5.7.9.7.', {}),
 'cake':      ('waltz', 126, 0, 'flute', 'musicbox', '0304', '4.2.4.|5.3.5.|6.4.1.', {}),
 'roller':    ('calm', 72, -2, 'guitar', ('pad', 'P'), '0304', '0.2.4.7.|3.5.7.a.|4.6.8.6.', {'d': NONE}),
 'kites':     ('east', 100, 3, 'flute', 'koto', '0304', '2.3.4.3.|2.1.0.1.|3.2.1.0.', {'sc': 'maj', 'pen': 1, 'd': {'q': 'x.x.x.x.x.x.x.x.', 't': 'x.......x.......'}}),
 'dress':     ('funk', 116, 1, 'strings', 'guitar', '0304', '4..2..0...2.4...|5..3..0...3.5...|4..6..8...6.4...', {'d': {'k': 'x...x...x...x...', 'c': '....x.......x...', 'o': '..x...x...x...x.'}}),
 'taxi':      ('funk', 102, -1, 'brass', 'organ', '0304', '0.4.2.0.|3.7.5.3.|4.8.6.4.', {}),
 'roach':     ('tense', 100, -3, 'pizz', 'keys', '0504', '0.z.0.2.|5.4.5.7.|4.3.4.6.', {'d': {'w': '..x...x...x...x.', 'k': 'x.......x.......'}, 'comp': {'i': 'keys', 'p': '..x.......x.....'}}),
 'hoopshot':  ('funk', 108, 2, 'keys', 'guitar', '0304', '7..4..2.0..2.4..|7..5..3.0..3.5..|8..6..4.1..4.6..', {'d': {'k': 'x.....x...x.....', 'c': '....x.......x...', 'h': 'x.x.x.x.x.x.x.x.'}}),
 'sheepdog':  ('pastoral', 88, 0, 'whistle', ('banjo', 'a.a.a.a.a.a.a.a.'), '0304', '4.5.4.2.|5.7.5.3.|4.2.1.z.', {}),
 'sumo':      ('east', 84, -2, 'koto', 'koto', '0504', '0..0.2..|2..2.3..|4..3.2..', {'pen': 1, 'd': TAIKO}),
 'memory':    ('calm', 70, 3, 'musicbox', ('pad', 'P'), '0304', '7...4.2.|5...7.5.|4...6.4.', {'d': NONE}),
 'spy':       ('tense', 104, 1, 'guitar', ('pad', 'P'), '0504', '0.2.3.2.|5.4.2.4.|4.6.4.2.', {'d': BONGO}),
 'mocktail':  ('jazz', 108, -1, 'steel', 'guitar', '1405', '5.3.5.8.|6.4.6.8.|4.2.4.7.|5.2.0.2.', {'sw': 0.15, 'd': {'q': 'x.x.x.x.x.x.x.x.', 'r': '...x..x...x.x...', 'k': 'x.....x...x.....'}}),
 'timber':    ('western', 106, -3, 'banjo', 'guitar', '0304', '0.2.0.4.|3.5.3.7.|4.6.4.1.', {'d': {'k': 'x.......x.......', 'c': '....x.......x...'}}),
 'hockey':    ('sport', 122, 2, 'organ', 'organ', '0304', '0247.4.2|357a.7.5|468b.8.6', {}),
 'tennis':    ('sport', 118, 0, 'pizz', 'keys', '0304', '4.0.2.4.|5.0.3.5.|6.1.4.6.', {'d': {'k': 'x.......x.......', 'c': '....x.......x...', 'q': 'x.x.x.x.x.x.x.x.'}}),
 'metro':     ('calm', 80, -2, 'marimba', ('pad', 'P'), '0304', '2.4.2.7.|3.5.3.7.|1.4.1.6.', {}),
 'binround':  ('pastoral', 96, 3, ('horn', 1), 'guitar', '0304', '0.4.2.4.|3.5.3.0.|4.6.4.1.', {'d': {'k': 'x.......x.......', 'r': '....x.......x...'}}),
 'lifeguard': ('island', 110, 1, 'guitar', 'steel', '0304', '4.7.9.7.|5.7.a.7.|6.8.b.8.', {}),
 'hoops3':    ('funk', 96, -1, 'organ', 'keys', '0304', '0...2.4..2..0...|3...5.7..5..3...|4...6.8..6..4...', {'sc': 'dor', 'd': {'k': 'x.....x...x.....', 'r': '....x.......x...', 'h': 'x.xxx.x.x.xxx.x.'}}),
 'gridiron':  ('sport', 124, -3, 'brass', 'brass', '0304', '0.4.7.4.|3.7.a.7.|4.8.b.8.', {'d': MARCH}),
 'climb':     ('calm', 74, 2, 'flute', ('guitar', 'a.a.a.a.a.a.a.a.'), '0304', '0...2.4.|5...3.0.|4...2.1.', {'d': NONE}),
 'dentist':   ('waltz', 118, 0, 'pizz', 'musicbox', '0304', '0.2.0.|3.5.3.|4.6.4.', {}),
 'balloon':   ('pastoral', 80, -2, 'flute', ('harp', 'a.a.a.a.a.a.a.a.'), '0304', '4...7.9.|a...7.5.|8...6.4.', {'rev': 0.6}),
 'sandworm':  ('epic', 90, 3, ('horn', 1), ('choir', 'P'), '0304', '0.1.0.4.|3.5.3.1.|4.6.4.1.', {'sc': 'phr', 'd': TAIKO}),
 'skydive':   ('synth', 112, 1, 'saw', ('pad', 'P'), '0304', '9.7.4.7.|a.7.5.7.|8.6.4.6.', {'sc': 'maj'}),
 'detective': ('jazz', 88, -1, 'brass', 'piano', '0504', '0...2.4.|5...4.2.|4...6.4.', {'sc': 'min', 'A': [0, 5, 0, 4], 'd': {'y': 'x...x.x.x...x.x.', 'r': '....x.......x...'}}),
 'convoy':    ('epic', 92, -3, ('horn', 1), ('strings', 'P'), '0504', '0.4.2.0.|5.2.0.5.|4.1.6.4.', {'d': MARCH}),
 'pottery':   ('calm', 76, 2, 'guitar', ('pad', 'P'), '0304', '2.4.5.4.|0.3.5.3.|1.4.6.4.', {'d': {'q': '..x...x...x...x.'}}),
 'joust':     ('epic', 100, 0, 'brass', ('strings', 'P'), '0304', '0.0.4.7.|7.7.5.3.|4.4.6.8.', {'sc': 'mix', 'd': {'u': 'x.......x.......', 's': '....x.x.....x.xx'}}),
 'splash':    ('island', 104, -2, 'whistle', 'marimba', '0304', '0242.0.4|3575.3.7|4686.4.1', {}),
 'surf':      ('island', 128, 3, 'guitar', 'guitar', '0304', '07642024|37a97537|48ba8642', {'sc': 'mix', 'd': {'k': 'x.....x.x.......', 's': '....x.......x...', 'y': 'x.x.x.x.x.x.x.x.'}}),
 # 25 Nov 2026 (his words: "put Christmas music like something similar to missle toe or all i want for Christmas"): it was a slow music box.
 # Now a Christmas POP song of its own: quick and bouncing, sleigh bells on every beat, a piano pumping the chords four to the bar, a walking
 # bass, hand claps on two and four, bells carrying a tune that leaps, over the old pop turn of chords (home, sixth, fourth, fifth).
 # Written for this game; no note of it is taken from either song.
 'santa':     ('fest', 146, -5, ('bell', 1), ('piano', 'x...x...x...x...'), '0534', '0.24.7.47.9.7.4.|5.57.5.32.3.5...|3.57.a.75.7.5.3.|4.6.8.6.4.2.1...', {'d': {'j': 'x...x...x...x...', 'q': 'x.x.x.x.x.x.x.x.', 'k': 'x.....x.x.....x.', 's': '....x.......x...', 'c': '....x.......x...'}, 'bass': 'w...w...w...w...', 'B': [3, 4, 2, 5], 'sw': 0.45, 'rev': 0.4}),
 'skim':      ('calm', 72, -1, 'flute', ('guitar', 'a.a.a.a.a.a.a.a.'), '0304', '4...2...|5...3...|4...1...', {'d': NONE, 'rev': 0.6}),
}
def bar(b, three):
    n = 12 if three else 16
    if len(b) == n: return b
    assert len(b) == n // 2, (b, n)
    return ''.join(c + '.' for c in b)
def js(v):
    if isinstance(v, dict): return '{ ' + ', '.join(f'{k}: {js(x)}' for k, x in v.items()) + ' }' if v else '{}'
    if isinstance(v, list): return '[' + ', '.join(js(x) for x in v) + ']'
    if isinstance(v, str): return "'" + v + "'"
    return str(v)
def score(gid, num):
    st, bpm, key, lead, comp, prog, tune, ex = S[gid]; three = st == 'waltz'
    o = {'seed': num, 'key': key, 'bpm': bpm}
    o['lead'] = {'i': lead[0], 'oct': lead[1]} if isinstance(lead, tuple) else {'i': lead}
    if 'comp' not in ex: o['comp'] = {'i': comp[0], 'p': comp[1]} if isinstance(comp, tuple) else {'i': comp}
    if 'A' not in ex: o['A'] = [int(c) for c in prog]
    o['tune'] = [bar(b, three) for b in tune.split('|')]
    for k, v in ex.items(): o[k] = v
    return f"bandStyle('{st}', {js(o)})"
if __name__ == '__main__':
    games = [g for g in json.load(open(R + '/games.json'))['games'] if g['number'] > 8]; n = 0; miss = []
    for g in games:
        for f in sorted(glob.glob(f"{R}/games/{g['id']}/part*.js")):
            s = open(f).read(); m = re.search(r"bandStyle\('[a-z]+'(, \{.*?\})?\)(?=;| )", s)
            if not m: continue
            if g['id'] not in S: miss.append(g['id']); break
            open(f, 'w').write(s[:m.start()] + score(g['id'], g['number']) + s[m.end():]); n += 1; break
    print('scores written:', n, 'games; no score for:', miss, '; scores for no game:', [k for k in S if k not in {g['id'] for g in games}])
