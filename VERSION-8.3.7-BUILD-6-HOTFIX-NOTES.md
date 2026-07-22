# LEGACY Pro Wrestling 8.3.7 Build 6 — Injury Loop Hotfix

## Critical fix
- The Doctor's Orders diagnosis now appears only once per injury.
- Choosing either Rest & Recover or Compete Through It stores a persistent diagnosed treatment state.
- Every active-injury day is now handled by recovery content, restricted training, a non-wrestling appearance, or a medical progress screen.
- Existing Build 5 saves caught in the repeated diagnosis loop are repaired automatically.
- The recovery window ends with a one-time Cleared to Compete screen.
- Injury details are cleared after recovery and the two-month injury cooldown remains active.

## Test path
1. Continue the existing save caught in the loop.
2. Refresh after installing Build 6.
3. Enter the current day.
4. The repeated diagnosis must be replaced by Recovery Continues, a restricted activity, a non-wrestling appearance, or Medical Clearance.
