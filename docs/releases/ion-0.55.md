# ION 0.55 — Expanded word colors

The picker now offers a hue gradient plus Color softness, ranging from richer colors through muted pastels to soft neutrals. Both reuse the shared Slider and preserve keyboard support, touch typing focus, disabled states and hold/W for white. Track gradients sample the same palette as selection. Random input colors sample both dimensions; saved words are not recolored. Back lifts above the expanded picker while it is visible; native tap flashes are suppressed on the wheel.

Generated palette colors meet WCAG 4.5:1 contrast on black and, after RGB inversion, on white. Duplicate-shade allocation retains the contrast check for readable selections. Existing legacy/arbitrary saved values remain untouched; this is not a retroactive accessibility claim for old content.

Verified: hosted TypeScript clean; cloudColors, cloudColorWheel and colorWheelFocus suites pass, including >1,000 distinct sampled shades with both-theme contrast and 1,024 sibling allocations. Production-bundle fixtures on phone/desktop verify richness changes, touch focus, white override, random next input and persistence without production data writes. Premium audit retains the same 38 reviewed canonical-control findings; unchanged hosting polling warnings remain.
