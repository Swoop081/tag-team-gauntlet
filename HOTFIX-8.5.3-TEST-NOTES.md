# LEGACY Pro Wrestling 8.5.3 — Career Record Integrity Hotfix

## Fixed
- The user-controlled wrestler's record is now derived from completed Career match history, preventing duplicate wins or losses.
- AI world results are stored winner-first and applied exactly once per Career day.
- Power Rankings, Career Hub and World Recap now share the same live ranking and record data.
- World Recap no longer falls back to Ranked #99.
- Removed Camera Focus wording from the Career Hub and Power Rankings.
- Noah Grant is displayed name-first, with Broadcast Producer beneath as a gold role subtitle.

## Validation
- JavaScript syntax checked with Node.
- Automated browser smoke test verifies a two-match 1–1 player history renders as 1–1 and the live recap rank matches the ranking table.
