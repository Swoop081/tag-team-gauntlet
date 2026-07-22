# LEGACY Pro Wrestling 8.3.7 Build 9 — Actual Engine Year QA

## Test method

This run loaded the shipped `data.js` and `game.js` inside a headless JavaScript environment, created a real Career save with The Revenant, and drove the live Career calendar and full match engine through one complete 12-month year. Match decisions were selected from the real generated choice pool using a fixed seeded random policy. The run also forced an early injury so the diagnosis, treatment, restricted-day and medical-clearance chain was exercised.

This is not the earlier statistical approximation. It executes the game's actual Career and match functions.

## Verified one-year result

- Calendar completed: 12 months / 48 weeks
- Total matches: 93
- Overall record: 47 wins, 46 losses
- Overall win rate: 50.5%
- SuperCards played: 12
- SuperCards won: 10
- SuperCards lost: 2
- Year-end level: 19
- Year-end momentum: 58
- Mean match rating: 3.01
- Lowest match rating: 1.62
- Highest match rating: 4.48
- Duplicate decisions in a match: 0
- Legacy decision-prefix leaks: 0
- Injury diagnoses: 2
- Medical clearances: 2
- Repeated diagnosis loops: 0

## What stood out in Build 8

### 1. An injury could erase a monthly SuperCard
The original actual-engine run produced only 11 SuperCards. If the player was medically restricted on the scheduled Sunday, the non-wrestling replacement advanced the calendar and the feud finale disappeared.

**Build 9 fix:** a medically restricted SuperCard is now stored as a postponed event. Once the wrestler is cleared, the postponed feud finale becomes the next required Career match before normal scheduling resumes. The verification run completed all 12 SuperCards.

### 2. SuperCard wins were not reliably written to the Career profile
The broadcast match route updated the main record but could bypass the profile's `supercardWins` counter.

**Build 9 fix:** SuperCard wins and losses are now persisted directly after every broadcast result, including postponed SuperCards. A 24-event SuperCard history is also retained.

### 3. Rival opponents could recycle too quickly
The first actual run selected a previous SuperCard opponent again within the same year.

**Build 9 fix:** opponent selection excludes the six most recent SuperCard rivals whenever enough alternatives exist.

### 4. Injury state needed a stronger identity guard
Build 8 no longer produced the daily diagnosis loop in the corrected actual run, but the injury object had no durable unique identifier. That made migrations and repeated-state checks fragile.

**Build 9 fix:** every injury receives a unique ID, diagnosis acknowledgement is persisted, clearance is recorded against that ID, and the same injury cannot be diagnosed or cleared twice.

### 5. Random injuries could ignore the intended pacing
The underlying match path still attempted injuries at a much higher rate than intended, relying on later cleanup.

**Build 9 fix:** new random injuries are reduced to an effective 3.5% post-match rate and the two-month medical cooldown is enforced as an absolute gate.

## Systems that passed

- A complete year contained both wins and losses.
- The overall record finished almost exactly balanced at 47–46.
- All 12 monthly SuperCards occurred.
- No injury diagnosis repeated.
- Every diagnosed injury reached one clearance.
- No identical decision appeared twice within one match.
- No `Heartbreaker`, `Supernatural`, `Rebel` or other legacy personality prefix leaked into displayed/stored decision titles.
- Match ratings ranged naturally and no five-star match occurred in this run.
- The calendar reached Month 13 without becoming stuck.

## SuperCard results

1. Elias Crowe — Win
2. Bianca Balboa — Loss
3. Victor Royale — Win
4. Ryder Phoenix — Win
5. Chloe Carter — Loss
6. Travis Stone — Win
7. Primal — Win
8. El Rey del Cielo — Win
9. Axel Voss — Win
10. Mateo Vega — Win
11. Sterling Sinclair — Win
12. Marco Montana — Win

The single seeded QA career therefore won **10 of 12 SuperCards**. This is one concrete playthrough, not a target probability. The overall 47–46 record shows ordinary matches remained balanced despite the unusually strong SuperCard run.

## Remaining observation

Level 19 after one year is still relatively fast progression. I have not changed it in this patch because it did not break the year simulation and should be judged through a longer hands-on Career before changing the XP economy again.
