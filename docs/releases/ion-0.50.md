# ION 0.50 — Random word colors

IL04A12 (Random Color Picker) toggles automatic colors for new entries. It uses the existing readable spectrum and sibling-color uniqueness policy. A manual wheel selection, including hold-for-white, overrides the current entry; after a successful send a fresh random shade is ready. Failed sends preserve draft and retry identity. Existing words are unchanged. The setting is stored on the device and synchronizes across its tabs.

Verification: hosted TypeScript clean; cloudColors, cloudColorWheel and colorWheelFocus suites pass. Isolated production-bundle browser checks pass on phone and desktop for toggle persistence, white override, and next-entry randomization. No real account/content mutations in fixtures. Premium audit findings unchanged at 38, matching the previously reviewed canonical-control false positives. No new UI primitive, route or style system.
