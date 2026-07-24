LEGACY Pro Wrestling 9.1.11 — Forced Centred Logo Zoom

Changed files only.

- Forces the approved intro logo to grow from 1.0x to 4.6x while remaining centred.
- Uses requestAnimationFrame with inline important transforms so legacy CSS cannot suppress the zoom.
- Fades only during the final 28% of the transition.
- Applies to Mayhem, Throwdown and SuperCard through the shared show transition entry point.
