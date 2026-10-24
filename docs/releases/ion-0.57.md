# ION 0.57 — Horizontal color box

The merged picker is now a single wide box with 18px rounded corners and a 72px touch surface. Left/right selects hue. Moving toward the middle band softens the color; moving toward either horizontal edge makes it richer. A marker retains the selected upper/lower half and hue even through neutral selections. The canvas samples the same contrast-safe palette as selection.

Keyboard access, active typing focus, pointer cancellation, white hold/W, random colors, manual overrides and existing saved colors/IDs remain unchanged. The shorter field stays clear of the shared Back bubble.

Verification: hosted TypeScript clean; palette, rectangular geometry, pointer/focus and composer-retry suites all pass. Production-bundle phone/desktop fixture checks one wide rounded field, richness/softness selection, typing focus, Back clearance, manual white and random next entries. Static premium audit remains at the existing 38 reviewed findings; four unrelated hosting polling warnings remain in unchanged files. No physical iOS keyboard observation is claimed.
