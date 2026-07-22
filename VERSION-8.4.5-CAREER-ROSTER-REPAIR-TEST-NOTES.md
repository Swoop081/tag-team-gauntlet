# LEGACY Pro Wrestling 8.4.5 — Career & Roster Repair

## Root causes fixed
- Career failed because the Living Careers modules referenced `LIVE_ROSTER`, a variable that does not exist in the full build. Opening Career threw a runtime ReferenceError before the screen could render. Both references now use the canonical `WRESTLERS` registry.
- Dave Maddox and Logan Steele were absent from the canonical `WRESTLERS` array, even though their artwork and character-specific text remained in the project. Both complete wrestler records are restored directly in `data.js`.
- The dynamically inserted Battle Royal menu button now calls `window.battleRoyalHome()` safely.

## Verified
- Main menu Career button opens Career.
- Dave Maddox and Logan Steele appear in the canonical roster and Battle Royal selection.
- Living Careers initializes both wrestlers through the canonical roster.
- JavaScript syntax validation passed.
