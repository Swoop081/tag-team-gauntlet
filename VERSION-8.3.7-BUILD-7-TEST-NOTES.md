# LEGACY Pro Wrestling 8.3.7 Build 7

## Critical fixes

- Rebuilt the injury lifecycle so `DOCTOR'S ORDERS` is a one-time diagnosis for each injury.
- Added migration for Build 5/6 saves already caught in the repeating diagnosis loop.
- Both `REST & RECOVER` and `COMPETE THROUGH IT` now move through recovery progress, restricted activities, non-wrestling appearances and one medical-clearance screen.
- Clears the injury record after recovery and applies the two-month injury cooldown.
- Updated the `game.js` cache-busting URL and service-worker cache version so the new logic is actually loaded instead of the prior Build 5 script URL.

## Match balance adjustment

- Reduced the Build 5 AI response strength and AI score floors.
- Restored more weight to player performance and player decision impact.
- Kept genuine loss potential while avoiding the recent near-unwinnable balance.
- First Career match retains a modest onboarding advantage.

## Additional fixes

- Expanded displayed decision-prefix cleanup to include Supernatural and related legacy style labels.
- Centered wrestler artwork on the Level Up screen.

## Automated verification

A first-month simulation was run for both injury choices and 5,000 eight-match Career months.

- Rest & Recover diagnosis count: 1
- Compete Through It diagnosis count: 1
- Medical clearance count for each path: 1
- Injury loop detected: no
- Simulated mean player win rate: 56.0%
- Months containing at least one player win: 99.9%
- Months containing at least one player loss: 99.2%

The raw verification output is included as `BUILD-7-FIRST-MONTH-SIMULATION.json`.
