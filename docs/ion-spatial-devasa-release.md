# ION: spatial layout repair and De Vasa foundation

Published on 2026-10-18 at https://ion.floot.app (web/PWA). The existing native
Tactical 0.7.1 cloud asset, supported variants and saved game hashes are unchanged.

## Behavior

Rules roots and paragraph clouds now use a square world at least 760px wide,
with phone-sized text and an initial camera zoom of 1. The spatial cloud fills
both axes; words outside the viewport remain reachable by pan, pinch, modified
wheel and keyboard. No scrolling, visible zoom controls, extra labels, colors
or fonts were added.

The shared layout keeps retained word centers and canvas dimensions after
removal. New or enlarged colliding labels are placed around retained anchors.
An in-memory visit cache retains removed anchors for Undo. Initial fitting waits
for data and font readiness; mutations and realtime refreshes do not refit the
camera. An explicit viewport-layout resize refits appropriately, keeping board
choices usable after switching screen widths. Keyboard-open geometry retains
the existing viewport dimensions.

After deleting a word, the dialog restores focus to the word-space region,
without focusing the header. Cancel/edit still restore the original word when
it exists. Server permissions, confirmation, branch counts, conflict handling
and ten-second Undo are unchanged.

BoardPreview now contains the native board in its reserved frame. SVG aspect
ratio preserves Shafran’s tall board shape above a separate caption. The same
owner serves normal Boards and the Tactical board chooser. Rules choices remain
words; illustrations stay inside paragraph clouds.

De Vasa has a separate experimental native module for 81 cells, conventional
notation, 36 starting pieces, pawn geometry and castling destinations. It remains
unavailable in createGame, Tactical and the live chooser until legal rules are
complete. [References, implementation and next gate](variants/devasa.md).

## Verification

- Floot typecheck clean. All 16 default Jasmine spec files pass; explicit cloud
  and game hook suites pass. New tests cover square geometry, anchored removal,
  empty worlds, collision-safe edits/additions, Undo anchors, readiness, content
  changes, panning, explicit keyboard reset and viewport resize.
- `npm run test:native` passes existing geometry, Gliński, McCooey, Shafran and
  Brusky foundation suites, including complete random and Tactical games.
  De Vasa adds 709 passing geometry/setup assertions with independent explicit
  ranks, files, piece rows, rights geometry and rejection of unfinished play.
- CMake builds `devasa-foundation-tests`; CTest passes. CMake is supplied through
  `uvx --from cmake`, without a system installation.
- Live Playwright checks cover all three Rules clouds, off-screen words, keyboard
  panning, native no-scroll behavior, Shafran preview containment at 320/393/1280px
  in normal/Tactical selection, deletion/Undo, failed-delete recovery, reduced
  motion and automated accessibility. Records and screenshots are under
  `docs/screenshots/ion-spatial-*`, `ion-rules-square-phone.png`,
  `ion-shafran-preview-contained-phone.png` and `ion-delete-position-phone.png`.
- Temporary QA accounts/workspaces are removed after verification. No real user
  cloud or shared Chess content was changed.
- DESIGN.md lint: zero errors/warnings. The raw Premium strict audit retains
  the same 20 known JSX false positives for shared Button-as-Link and Form
  providers; real forms have noValidate and navigation has Link destinations.
  No strict audit pass is claimed. See the previous Shafran release adjudication.
- Whitespace and edited JavaScript syntax checks pass. No deployment migration
  or native mobile build is included.

## Design contract review

| Contract | Evidence | Result |
| --- | --- | --- |
| Black surface, Inter and blue flat boards | Runtime tokens unchanged | Preserved |
| Shared spatial navigation, no app scrolling | CloudCanvas and SpatialViewport | Extended with square Rules and mutation-stable camera |
| Focus and destructive recovery | CloudActions, existing cloud API and Undo | Deleted target returns focus to its region |
| Reserved image/caption footprint | Shared BoardPreview and picture frame | Corrected for tall native board shapes |
