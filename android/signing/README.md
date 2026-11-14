`release.p12` is the Game Feed app's signing key. It is locked with a password that is stored only as the
`KEYSTORE_PASSWORD` Actions secret of this repository. Keep your own copy of the password: every update of
the app, including a future Play Store upload, must be signed with this same key, or the phone will refuse
to install it over the old one.
