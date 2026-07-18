# Tag Team Gauntlet 5.2.3 — Founding Twenty

## Milestone
All 20 founding wrestlers now use the current three-image artwork system.

## Re-enabled wrestlers
- Dave Maddox
- Logan Steele

Both wrestlers are available in Quick Match, Classic Gauntlet, Tournament Mode, opponent pools, recruitment rewards, Collection, profiles, statistics and achievements.

## Image framework
Both wrestlers now have registered `full.png`, `portrait.png` and `victory.png` assets. Screen-specific presets cover roster cards, partner selection, hero screens, profiles, match portraits and cinematic result screens. Dave Maddox is treated as a narrower full-body silhouette; Logan Steele is treated as a broader silhouette.

## Asset audit
All 60 founding-roster PNG files were checked for readable dimensions and non-empty alpha bounds. No source asset has artwork touching the top edge, providing safe headroom before screen transforms.
