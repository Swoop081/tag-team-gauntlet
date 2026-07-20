# v8.1.2.5 Build 1.4

## Fix
Career onboarding artwork now has deterministic mobile dimensions.

- Screens 1 and 3 use one locked full-body size.
- Screens 2 and 4 use one locked portrait size.
- Re-entering Career through Career > Begin Career cannot enlarge or crop the artwork.
- Career header/streak removal remains unchanged.

## Regression test
1. Open Career onboarding and view all four screens.
2. Continue to wrestler selection.
3. Tap Career, then Begin Career.
4. View all four onboarding screens again.
5. Compare the two passes; art scale and placement must remain identical.
