# LEGACY Pro Wrestling 8.3.7 Build 4 — Test Notes

## Implemented in this patch

- Removed the remaining Career match-report label `GAUNTLET RESULT`; Career reports now use `MATCH RESULT`.
- Expanded decision-name cleanup to remove leftover mechanical prefixes such as `Rebel` from wrestler-specific choices.
- Standardised legacy expanded NPC events (Ava social clips, Leon security, managers and similar events) to compact portrait-based mobile layouts.
- Added dedicated outcome screens to expanded NPC events, showing the exact value before and after the choice before returning to the Career Hub.
- Added a shared weekly match log used by Dirt Sheet Match of the Week. Player matches retain their actual report rating, while AI-versus-AI matches are fabricated only as real weekly match entries and can legitimately win the award.
- Dirt Sheet Digest now uses Derek Pierce's portrait in the header and includes Continue controls at both the top and bottom.
- Show-intro continuity now replaces internal outcome labels with natural copy, uses the weekly match log for star-rating references, and removes exact duplicate bullets.
- Added a bottom Continue Broadcast control to long match reports while preserving the existing top control.
- Added spacing protection to the World Champion onboarding screen so champion artwork no longer overlaps the reigning-champion label.
- Updated cache/version markers to Build 4.

## Validation completed

- JavaScript syntax validated with `node --check game.js`.
- Service-worker and HTML cache/version references verified as Build 4.
- Project archive integrity verified after packaging.
- Static searches confirm the Career report template no longer emits `GAUNTLET RESULT`.

## Primary testing focus

1. Ava `BACKSTAGE CLIP LEAKED` and Leon `TENSION IN THE ARENA`: confirm both choices fit on an iPhone screen and lead to an outcome screen.
2. Dirt Sheet at the end of the week: confirm Match of the Week matches the highest-rated logged player or AI match.
3. Show intro after Dirt Sheet: confirm the same match rating is referenced and duplicate bullets do not appear.
4. Match report: confirm Continue Broadcast appears at both top and bottom.
5. Wrestler decisions: watch for any remaining prefixes such as `Rebel`, `Royal`, or character names used mechanically.

## Still scheduled for the dedicated match-engine pass

The larger momentum and match-balance overhaul remains intentionally separate: opponent momentum swings, organic losses, AI psychology sequences, comeback frequency and five-star rarity need deeper simulation tuning and should be tested together rather than patched piecemeal.
