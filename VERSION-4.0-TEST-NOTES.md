# Tag Team Gauntlet 4.0 — Production Test

## Included artwork
- “Iceman” Jack Mercer
- Jett Valentine
- Victor Royale
- The Revenant
- Nightwatch
- “Hollywood” Titan
- Mason Marks

## Image system
Character Image Manager 4.0 stores independent `full`, `portrait`, and `victory` transforms in `assets/config/imageManager.js`. Match portraits are contained independently so collection scaling cannot expand behind match overlays. Missing custom art falls back to the existing roster artwork.

## Developer tools
- Image Manager: append `?dev=images` to the URL, or press Ctrl+Shift+I.
- Roster Status: append `?dev=roster` to the URL.
- The developer panel can tune Scale, X, and Y separately for Full, Match Portrait, and Victory artwork.

## Naming changes
- Cameron Tremblay is now Mason Marks throughout active game data and commentary.
- The Revenant remains display-named “The Revenant”; its internal ID remains `revenant` to preserve compatibility.

## Repository
The root `.nojekyll` file is preserved.
