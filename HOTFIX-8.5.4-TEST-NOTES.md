# LEGACY Pro Wrestling 8.5.4 — Single Match Accounting Hotfix

- Deduplicates repeated player match-history entries for the same Career date/opponent.
- Rebuilds the active wrestler's W-L record from unique completed matches.
- Limits a CPU wrestler to one WORLD_SIM match result per Career day.
- Rebuilds CPU W-L totals from deduplicated living-career histories when available.
- Removes remaining Camera Focus labels from Career and Power Rankings.
- Retains the Noah Grant presentation correction from 8.5.3.

Validation performed:
- JavaScript syntax check passed.
- Duplicate player result test: two identical stored wins resolve to 1-0.
- Duplicate CPU same-day test: two same-day WORLD_SIM losses resolve to 0-1.
