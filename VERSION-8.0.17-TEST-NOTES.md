# LEGACY Pro Wrestling 8.0.17 — Focused Feud-Origin VS Fix

This patch changes only the feud-origin VS positioning and cache version.

- The VS badge position is enforced directly in the rendered HTML with inline `!important` rules.
- It is pinned to the bottom edge of the wrestler portrait row, centred between both wrestlers.
- This avoids stale or competing stylesheet rules overriding the placement.

Test the New Month feud-origin screen with multiple wrestler combinations.
