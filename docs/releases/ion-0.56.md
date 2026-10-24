# ION 0.56 — One color wheel

The two rails are merged into one 112px circular palette. Angle selects hue; moving inward selects softer shades. The rendered palette samples the same contrast-safe function used for selection. One focus stop supports Left/Right hue, Up/Down softness, Home/End rich/soft and W for white. A stationary 300ms hold still selects white. Pointer capture tracks one gesture, ignores extra pointers and cancels on release/cancel/lost capture/disable/unmount. Touch gestures preserve an active draft's focus and selection.

The shared CloudColorWheel owns the two-dimensional interaction; other Slider consumers remain intact. Random entry colors, manual overrides, failure/retry identity, saved colors and permanent cloud IDs are unchanged. The expanded Back clearance keeps the bubble out of the wheel.

Verified: hosted TypeScript clean; four suites pass (geometry, palette contrast/uniqueness, typing focus/hold/multi-pointer, composer retry/manual override). Production-bundle fixtures pass on phone and desktop for one wheel, hue/softness selection, touch focus, non-overlap with Back, white override and random next input. Static premium audit retains the previous 38 reviewed findings; four existing hosting polling warnings remain in unchanged files. No physical iOS keyboard observation is claimed.
