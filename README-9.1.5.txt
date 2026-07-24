LEGACY Pro Wrestling 9.1.5 — Career Hub Header Structural Fix

Changed files only.

Fix:
- Rebuilds the actual .live-calendar-top container rather than nesting a new row inside old patched grid classes.
- Removes all inherited 9.1.x career-header classes before applying the current layout.
- Restores the LEGACY logo plus fully visible Main Menu and Career Menu buttons on one row.
- Runs the repair after render and after Career Hub navigation to prevent later render paths from restoring the broken layout.
