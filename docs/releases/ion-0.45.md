# ION 0.45 — Pictures, appearance and Controls

Double-tap a picture to open fullscreen without leaving its page; single-tap still opens the destination. Alt+Enter offers a keyboard equivalent. The existing viewer keeps pinch/pan, collage navigation, loading, failure, Close and Escape. Board previews remain native-data driven. IL045 View photos is retired without reusing its identity.

IL04A10 Color Inversion toggles the entire rendered app, including media, boards, overlays and loading. Its button is green when active and red when off, and exposes aria-pressed. The device preference persists and synchronizes between tabs; page panes avoid applying inversion twice. Default remains the black theme.

Back retains deliberately opened Controls and its subpages, while skipping temporary selection controls. Private is now My Space; Public remains Safari, including destination selectors. Identifiers, scope keys, private authorization and content are unchanged.

Home's unpictured destinations and Settings now have matching silver/glass artwork with blue edge light. Existing images are preserved. Shared data updates touch only Home/Public labels/pictures and the retired Controls entry; no private account contents or ledger rows were modified.

Validation: hosted typecheck clean and nine targeted suites passed (picture gestures/timer cleanup, persisted appearance, visited paths, keyboard history, spaces, controls, tree, redirects and Schedule privacy). Desktop and phone-sized live browser checks passed for double-tap fullscreen/close, My Space/Safari labels, all seven guest Home pictures, intentional Controls Back, retired IL045, green/red state and portal inversion. Desktop split-view verification confirms embedded pages avoid a second inversion. Static premium audit reports the existing 32 composite-component false positives (24 actionless Button wrappers, eight Form providers), zero unresolved ownership; no new findings. The strict static tool itself exits 1, so a clean static audit is not claimed. Physical-device and native browser chrome inversion are outside the automated checks.
