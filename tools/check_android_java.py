#!/usr/bin/env python3
"""Compile-checks the Android wrapper's Java (android/app/src/main/java) on a computer with no Android tools.

The real Android build only happens on GitHub (its tools cannot be downloaded in a Claude session). This catches
slips before a push: it compiles the wrapper against tiny stand-ins for the few Android classes it uses
(tools/android_stubs/). It proves the Java is well formed and that our own classes fit together. It does not
prove the stand-ins match Android: when the wrapper starts using something new, add it to the stubs exactly as
Android declares it, and still treat GitHub's "The app builds" step as the real check.
Run: python3 tools/check_android_java.py     (needs javac)"""
import os, subprocess, sys, tempfile, shutil

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def java(d):
    return [os.path.join(dp, f) for dp, _, fs in os.walk(d) for f in fs if f.endswith('.java')]


out = tempfile.mkdtemp(prefix='gf-javac-')
try:
    src = java(os.path.join(root, 'tools', 'android_stubs')) + java(os.path.join(root, 'android', 'app', 'src', 'main', 'java'))
    r = subprocess.run(['javac', '-Xlint:all,-deprecation,-serial', '--release', '17', '-d', out] + src, capture_output=True, text=True)
    text = '\n'.join(l for l in (r.stdout + r.stderr).split('\n') if l and not l.startswith('Picked up'))
    if r.returncode or text:
        print(text)
        sys.exit(1)
    print('The Android wrapper compiles (against the stand-in Android classes).')
finally:
    shutil.rmtree(out, ignore_errors=True)
