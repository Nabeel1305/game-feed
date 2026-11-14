# Builds ../index.html from the template and the physics/AI engine. Run from this folder: python3 build.py
import os
here = os.path.dirname(os.path.abspath(__file__))
t = open(os.path.join(here, 'game.tpl.html')).read()
e = open(os.path.join(here, 'engine.js')).read()
open(os.path.join(here, '..', 'index.html'), 'w').write(t.replace('/*ENGINE*/', e))
