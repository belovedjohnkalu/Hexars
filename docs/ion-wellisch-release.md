# ION — Wellisch three-player release

Published at https://ion.floot.app/wellisch on October 18, 2026. Active source:
cloud/floot. UI 0.18.0, native Tactical 0.9.0. All six variants are available in
Boards and Rules. No hosting migration or App Store build was performed.

## Behavior and rule decisions

Wellisch uses its own native movement/check/state rules through the shared API.
The original army-takeover form is implemented: first king capture transfers the
defeated army; pawns retain original direction, edge and captured-piece reserves;
two survivors then finish by normal mate/stalemate. Rules sources and explicit
automatic-draw policies are in variants/wellisch.md. The 1912 manuscript was not
obtained; adapted first-capture-wins sources were not mistaken for that original
takeover form.

Captured-piece promotion and delayed start-of-turn promotion are validated and
saved. Multiple waiting pawns can be chosen through paged options without app
scrolling. A reopened saved position now opens its required promotion choices.
Castling swaps king and original rook, respecting rights and safety. Three-player
no-escape positions offer Pass rather than a premature loss. After takeover,
normal mate/stalemate replaces passing.

Tactical uses independent MaxN utilities for each player, retaining its existing
six difficulty limits. Human White plays two independently evaluated Tactical
opponents. Pass and Play rotates 120 degrees after piece movement; pieces remain
upright. Gold reuses the existing amber token with a dark outline. Pawn direction
marks and accessible original-army labels remain meaningful after takeover.

The existing game API, version checking, private capability links, 30-day
retention, reset, swipe history and saved timeline are reused. Engine Undo restores
the state before the latest human action, including both Tactical replies. Result
scores remain White–Black–Gold, including an eliminated player's zero. Rules have
22 separate paragraph clouds; diagrams appear only inside opened paragraphs.

## Verification

- All six native suites passed via scripts/build-native.mjs --test --cloud.
  The final focused Wellisch run passed 27,444 assertions, 6,998 random actions
  across 12 complete games, a random takeover and 379 engine actions across two
  complete self-play games. Engine action counts vary with the time budget.
  Additional fixtures cover final mate/stalemate and forced passing.
- 30 native protocol/manager tests passed, including rights round trips,
  malformed state rejection, three-side legal MaxN replies, takeover deltas,
  delayed promotion, forced passes and three-slot terminal scores.
- Compared 100 positions in the five older variants against the verified
  previous Tactical 0.8.0 binary: saved state, state IDs, complete legal moves,
  visual deltas, checks and results were identical.
- Floot typecheck clean; nine focused Jasmine files passed, including game hooks,
  outcome, legal previews, board sizing, geometry, retention and spatial camera.
- Real preview API/browser checks passed sixth-board navigation, 91 cells and
  45 pieces, three colors, second-tap deselection, all turn rotations, swipe
  history, Undo, 22 rule clouds, both Tactical replies and complete-round Undo.
  Phone/landscape/desktop, keyboard pan/zoom and reduced motion were exercised.
- Native-backed browser transport fixtures passed castling, failed-save rollback
  and Retry, multiple delayed promotions, takeover and Undo, forced Pass, Gold
  victory, two-survivor stalemate and three-way draw. These fixture positions
  were never inserted into the cloud database. See screenshots/ion-wellisch-states-qa.json.
- The preview's enclosing floot.com editor emits a baseline object rejection
  shown as 'n'. Frame-level instrumentation confirmed no app errors; preview
  evidence records the editor error separately, without silently discarding it.
- The strict premium audit retains the same 20 previously adjudicated JSX
  scanner false positives (Button asChild Links / Form providers), with zero
  unresolved owners and no new finding types. No raw strict pass is claimed.
  DESIGN.md lint has zero errors/warnings; runtime tokens remain unchanged.
- Paused migration source: six frontend tests and 23 API tests pass; its Vite
  production build passes with its existing chunk-size advisory. This source
  remains unpublished and is not the active six-variant app.

Preview evidence: screenshots/ion-wellisch-preview-qa.json and
screenshots/ion-wellisch-states-qa.json. Published checks are recorded separately
in screenshots/ion-wellisch-live-qa.json. Temporary preview test game rows were
removed by exact UUID plus capability hash; no real account/cloud rows changed.

Production browser verification passed a legal move, 120-degree rotation,
independent API read and reload of the same saved position, six native starting
boards, 320px phone / 844px landscape / desktop bounds, keyboard pan/zoom and an
outline-free viewport. Automated WCAG A/AA reported zero violations and the
published page had zero runtime errors. All 13 tracked preview QA games and the
one production QA game were removed by exact identity plus capability hash.

## Deployment

Floot checkpoint 552d7a05-0539-4562-af83-85b5330712c1, “Complete Wellisch
three-player chess”. Publish job b2cf1399-1e56-496f-b81a-2e3aa42b5d78 succeeded.
The immutable static Linux/x64 engine is 2,222,328 bytes; SHA-256:
33a4d360905b37806e16fe9709ec323b0e48fdd5ebd240adf7af9a76ebc71b93.

## Design reconciliation

Existing owners (Play, CloudBoard, Dialog, PageControls, SpatialViewport, game
endpoint) were extended; no separate three-player screen/control system was
introduced. Gold maps to the existing word-amber token. The established flat
blue board, black surfaces, Inter, no document scrolling, whole cloud labels,
motion/reduced-motion and individual focus feedback remain consistent. The
viewport itself never restores a rectangular focus ring.
