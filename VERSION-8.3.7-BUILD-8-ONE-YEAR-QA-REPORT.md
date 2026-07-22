# LEGACY Pro Wrestling 8.3.7 Build 8 — One-Year QA Report

## Test scope

Build 7 was copied as the working baseline, inspected at source level, and advanced through an automated 364-day Career model covering 1,000 full-year careers. The simulation exercised approximately 102 matches per career, 13 SuperCards, 13 rivalry cycles, progression, weekly media selection, injury diagnosis/recovery/clearance, and long-term match-balance behaviour.

JavaScript syntax checks passed for `game.js` and `data.js`. A Chromium headless smoke-load was attempted, but the container browser process did not complete reliably within the execution window, so the release gate is based on source inspection, syntax validation, deterministic state testing, and the automated year simulation rather than a claim of complete visual browser automation.

## One-year simulation results

- Mean player win rate: **53.8%**
- 10th–90th percentile career win rate: **49.5%–58.3%**
- Careers containing at least one win: **100%**
- Careers containing at least one loss: **100%**
- Mean match rating: **3.57 stars**
- 4.65+ star match frequency: **1.5%**
- Mean injuries per year: **2.35**
- Injury loops detected: **0**
- Diagnosis/clearance state mismatches: **0**
- Match of the Week source mismatches: **0**
- SuperCards per year: **13**
- Rivalry cycles per year: **13**

The complete machine-readable results are in `BUILD-8-ONE-YEAR-SIMULATION.json`.

## Immersion-breaking findings and fixes

### 1. Decision prefixes survived in stored match history
The displayed choice could be cleaned while the stored review still retained prefixes such as `Supernatural`, `Heartbreaker`, or `Rebel`.

**Fixed:** choices are now normalised before display and again before being stored or rendered in the match report.

### 2. Duplicate choices could appear in one match
The same cleaned decision could be selected from different themed pools.

**Fixed:** the current match history is checked before presenting a new decision. A neutral fallback pool fills any shortage without repeating a choice.

### 3. Crowd reaction contradicted match quality
A 2.7-star match could still receive a 100% Standing Ovation.

**Fixed:** crowd label and excitement are now derived from the final adjusted rating and competitiveness. Low-rated matches cannot receive elite crowd reactions.

### 4. Match headlines and stories were generic
Reports repeatedly described every match as a sustained player run, even after a defeat or close result.

**Fixed:** result headlines now use score margin, while the story distinguishes narrow finishes, AI-controlled defeats, player recoveries, competitive matches, and dominant results.

### 5. Long careers could snowball into permanent winning or losing form
Repeated wins or losses could compound momentum indefinitely.

**Fixed:** a modest five-match form guard gives struggling careers a small recovery opportunity and increases resistance during dominant streaks. Career momentum also regresses partially toward neutral after matches instead of remaining permanently extreme.

### 6. Injury diagnosis could replay instead of progressing
Multiple generations of injury overrides were present in the source, creating paths back to the original diagnosis.

**Fixed:** Build 8 installs a final lifecycle gate:

`new injury → diagnosis once → treatment selected → recovery progress/restricted activity → clearance once → cooldown`

Existing saves are normalised. Diagnosed injuries always branch to progress or clearance, never back to Doctor's Orders.

### 7. Recovery progress lacked a visible timeline
The player could not tell how close clearance was.

**Fixed:** medical progress now includes a visual recovery bar and days remaining.

### 8. Long match reports could still strand readers at the bottom

**Fixed:** Build 8 adds a bottom Continue/Continue Broadcast action when the original report does not already contain one.

### 9. Level Up artwork alignment varied by wrestler

**Fixed:** the Level Up character is forced onto the horizontal centreline without character-specific offsets.

### 10. Version and cache labels contradicted one another
Build 7 still contained Build 5/6 identifiers in `index.html`.

**Fixed:** title, asset query strings, app version, service-worker cache, build label, and `version.json` now consistently identify Build 8.

## Items observed but not force-expanded in this patch

The one-year model showed progression reaching roughly Level 21 on average. This is not currently a blocker, but later balancing may be needed if the intended career length is several years. The simulation also produces 13 four-week SuperCards in 364 days, which is mathematically consistent with the current 28-day monthly cycle but differs from a conventional 12-month calendar. This patch preserves the established four-week Career structure rather than changing the calendar during a stability build.

## Release checks

- `node --check game.js`: PASS
- `node --check data.js`: PASS
- One-year balance assertion: PASS
- Every simulated career has wins and losses: PASS
- Injury loop assertion: PASS
- Injury diagnosis/clearance accounting: PASS
- Match of the Week canonical-selection assertion: PASS
- Five-star rarity assertion: PASS
- ZIP integrity: verified during packaging
