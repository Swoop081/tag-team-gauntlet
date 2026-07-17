# Character Image Manager 2.0

Permanent settings are stored in `assets/config/imageManager.js`.

Each upgraded wrestler can provide:
- `full.png`
- `portrait.png`
- `victory.png`
- `scale`, `x`, and `y` positioning values

## Hidden developer mode

Open the game with `?dev=images` appended to the URL, or press `Ctrl+Shift+I`.
Use the sliders to preview Scale, X, and Y live. Preview settings persist locally on that browser. Use **Copy config** and paste the result into `assets/config/imageManager.js` for a permanent release.

Browser security prevents a GitHub Pages site from directly rewriting repository source files, so the tool provides a safe copy-ready configuration instead.

## Naming update

The display name `Revenant` has been changed globally to `The Revenant`. The internal ID and existing legacy asset filenames remain `revenant` to preserve compatibility.
