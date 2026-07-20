# LEGACY Pro Wrestling v8.1.2.4 Build 1.3

## Exact onboarding template repair
- Career header/streak remains removed.
- Onboarding no longer emits page-number CSS classes.
- Screens 1 and 3 both render through the same `full` template class.
- Screens 2 and 4 both render through the same `portrait` template class.
- This prevents legacy page-3/page-4 overrides from changing image size or position.
- Scroll position resets on every onboarding transition.
