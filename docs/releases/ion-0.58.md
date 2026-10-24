# ION 0.58 — Restore the original horizontal picker

The requested revert restores the original single horizontal gradient bar, pastel hue range, 44px control, Slider behavior and Back positioning from revision 0.54. The extra softness rail and circle/box geometry are removed. Existing saved colors, permanent IDs, manual/random selection, hold/W white, touch typing focus and retry behavior are preserved. Other app changes are retained.

Verification: all eight affected color-related source/test files match revision 386a5c7 exactly. Hosted TypeScript is clean; the original palette, picker/composer and pointer/focus suites pass. Production-bundle fixtures on phone and desktop confirm one original-height bar, white override, random next input and persistence. Premium audit retains the existing 38 reviewed findings; unrelated hosting polling warnings remain unchanged.
