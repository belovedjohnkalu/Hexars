# ION — five variants and permanent owner identifiers

Published at https://ion.floot.app on 2026-10-18. Live source: `cloud/floot`.
Tactical 0.8.0 runs as native C++ on the cloud server. No hosting migration or
native App Store build was requested or performed.

## Behavior

Brusky and De Vasa are now playable through Boards, Tactical and Rules. Native
geometry supplies their 84-cell and 81-cell pointy boards. Their distinct pawn
rules, two advance axes, initial doubles, en passant, promotions, castling,
check/pins, mate, equal-score stalemate and effective repetition rights share
the authoritative rules API. Brusky alone has the initial third pawn capture
and enemy blocking of both forward advances. Each has 23 paragraph clouds;
illustrations appear only inside a paragraph. Historical-source limits remain
explicit in [Brusky](variants/brusky.md) and [De Vasa](variants/devasa.md).

The gradient picker appears only while the composer form is active. Moving
focus into the picker keeps it open; leaving dismisses it without losing the
draft/color. Its overlay does not resize the footer, canvas or phone keyboard
placement. Existing colors, authorship, 1,024 direct-child capacity and realtime
permissions remain intact.

The configured owner sees a quiet IL beside each word and picture caption.
Home roots are IL0 (Chess), IL1 (Public), IL2 (Private). A child appends one
zero-based arrival segment, without placeholder zeros: IL1 → IL10 → IL100.
The corrected sequence is 0–9, A0–Z9, AA0–ZZ9, AAA0–ZZZ9 and onward. Boundary
examples: 269=Z9, 270=AA0, 7029=ZZ9, 7030=AAA0.

A separate registry and per-parent counters survive deletion. Allocation takes
a transaction advisory lock and re-reads current rows/counters. A move preserves
identity and labels within a space and across Public/Private; a copy receives
new IDs and labels. Transfers register the source and destination where permitted,
without indexing another account’s Private content. Other sessions receive no
identifier field, and the UI also requires current owner status. Labels wrap
at their full value; the layout reserves their footprint. A fixed-size digest
index avoids Postgres’s long-text index-entry ceiling for deep paths.

Existing nodes are initialized from their saved order, including soft-deleted
rows. Historical creation timestamps were not recorded, so an exact earlier
arrival order cannot be recovered after old transfers/reordering. Assigned
labels remain immutable. Owner-only metadata is a deliberate exception to the
otherwise shared Inter typography: 10px system monospace, without new controls.

Live checks caught a landscape sizing issue. Games now wait for native content
and measured dimensions before initial fitting, refit only on viewport resize,
and place actions beside the board on short, wide screens. Moves/content changes
still preserve the spatial camera.

## Verification

- Native suite passes all legacy rules and independent geometry/setup tests.
  The horizontal rules suite passes 5,071 assertions: both colors, pawn-rights
  differences, pinned en passant, all castling paths and safety, promotions,
  malformed rights, terminal positions, random games and Tactical self-play.
  Brusky completes six random and two engine games (1,407 / 312 plies);
  De Vasa completes six random and two engine games (2,492 / 188 plies).
- 25 manager/protocol tests pass, including full state round-tripping,
  movement-right rejection, native visual changes, special moves and terminal
  search for both new variants. Previous Tactical 0.7.1 and 0.8.0 produced
  identical state IDs, complete saved state and legal moves across 90 positions
  in Gliński, McCooey and Shafran. Existing saved hashes were preserved.
- Floot typecheck is clean. All 20 default Jasmine spec files pass, plus explicit
  cloud/game/media-query hook suites. Identifier tests cover alphabetic
  boundaries, at least 1,024 distinct sibling numbers, no-padding paths,
  deletion/restoration, independent branches, copies, moves and owner gating.
- Real sandbox/database checks passed persistent allocation, deletion retention,
  never-reused numbers, cross-space move identity, immediate copy allocation,
  copy source retention, and absence of IL fields for signed-out, nonowner and
  nonowner Private responses. Only temporary QA records were used; their
  records/counters were cleaned separately from real identifiers.
- Live browser checks cover both new variants’ previews, pawn double moves,
  second-tap deselection, outlines, rotation, swipe history, undo, castling,
  en passant, promotion, winner/stalemate sheets, Tactical selection/replies,
  separate Pass and Play slots, reset and 320px/landscape/desktop bounds.
  The game surface has no runtime errors or automated accessibility violations.
  See `screenshots/ion-five-variants-live-qa.json`.
- Private/Public gradient focus, pointer/keyboard selection, draft retention,
  stable composer footprint and a simulated visual-viewport keyboard pass.
  Owner presentation uses an intercepted browser fixture, without logging in
  as the real owner or changing authorization. Real nonowner API privacy is
  tested separately. Physical iPhone keyboard behavior is not claimed.
  See `screenshots/ion-identifiers-entry-live-qa.json`.
- Migration web/API production builds pass; their 6 frontend and 23 API tests
  pass. This source remains unpublished.
- Premium strict audit has the same 20 known JSX false positives for Button
  `asChild` links and Form providers. The raw report is saved alongside this
  release; no strict pass is claimed. No contract/ownership findings remain.
- Known temporary QA accounts and 20 explicitly tracked QA games were removed.
  Real shared cloud nodes, owner credentials and game records were preserved.

## Design review

| Contract | Evidence | Result |
| --- | --- | --- |
| Black, Inter and blue flat boards | Runtime tokens and screenshots | Preserved |
| Canonical forms/slider/overlays | CloudComposer, CloudColorWheel, existing sheets | Reused |
| Spatial camera without scrolling | CloudCanvas, SpatialViewport, gameCloudLayout | Preserved; explicit resize handling |
| Stable anchors and reserved images | Shared cloud layout and BoardPreview | Identifier footprint added |
| Owner/private boundaries | Server context, registry scopes, response filtering | Verified separately from presentation fixture |
| Destructive recovery | Existing confirmations, ten-second Undo, permanent registry | Labels never renumber |
