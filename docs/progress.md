# Development progress · cloud edition 0.5

Published: **https://hexars.floot.app**

## Completed

- [x] Project, React/TypeScript/Vite UI and six independent engine directories.
- [x] Native C++ Engine 1 and local diagnostic WebSocket manager.
- [x] Shared geometry and conventional Gliński notation.
- [x] Historical 36-piece initial position.
- [x] All Gliński movements, special pawn rules, promotion, checks and pins.
- [x] Checked legal move application and game results.
- [x] Versioned native JSON protocol, request/state IDs, position validation.
- [x] Engine 1 alpha-beta search, iterative deepening, quiescence, time/node budgets.
- [x] Native full-game and Engine-1-versus-random verification.
- [x] Cloud native execution, database-backed saved games, optimistic concurrency.
- [x] Live human-versus-engine and shared two-player board.
- [x] Cloud publication and real published-site gameplay tests.
- [x] Mobile/touch layout, installation manifest/icons, install instructions and saved-link restore.

## Pending

- [ ] Physical iPhone/Android installation verification and Windows compiler/runtime verification.
- [ ] Engines 2–6 with independently designed strategies.
- [ ] Arena/tournament controller and rated engine-strength measurements.
- [ ] The other five historical variants, including three-player Wellisch search/results.
- [ ] Stronger evaluation, transposition tables and native asynchronous search cancellation.
- [ ] Account game library, side-specific multiplayer access and broader production load testing.
- [ ] Offline features or native App Store/Play Store packaging if later requested.
- [ ] GitHub remote publication; no remote repository is configured.

## Verification record

Linux workspace: Node.js 24.19.0, npm 11.9.0, G++ 14.2.0. Native tests: 6,062 assertions, 5,775 random plies, four complete random games, 43 engine plies and two complete Engine-1-versus-random games. Twelve protocol/manager tests and three Vitest tests passed. TypeScript/Vite and CMake/CTest passed.

Published browser checks: native identity and engine reply, 91 cells/36 pieces, playing both sides, historical checkmate, undo, saved-link resume across device contexts, open saved game, coordinates, flip, themes, mobile overflow, icon/manifest delivery, Apple metadata, install instructions, and no JavaScript errors/failed production responses. [Check record](screenshots/cloud-qa-result.json), [desktop](screenshots/cloud-desktop.png), [mobile](screenshots/cloud-mobile.png).

Browser/device emulation checks the published interface and cloud API; it does not claim a physical phone OS installation, measured competitive engine strength or a fully certified historical rules implementation. The original foundation screenshots and checks are retained separately for diagnostic history.

## HEXARS redesign

Light iPhone-style interface, plain-language controls, named playing styles, modern Xenon/Adobe/Hearth palettes, refreshed icons and smooth piece/board/dialog motion. The standalone executable now identifies as Tactical 0.3. Twelve real native/manager protocol tests passed after the identity change. Desktop/iPhone gameplay checks and reduced-motion checks passed. The original numbered executable directories and C++ namespace remain stable internal interfaces.

Published address: https://hexars.floot.app. Floot’s free plan prevents permanent badge removal. Saved game rows are preserved; copied old game links can be opened in the new app. Existing home-screen icons should be replaced with the new site.

Published HEXARS checks: 38 passed, including the new native identity, readable primary action, both human sides, checkmate, saved-game links, board palettes, iPhone layout, all six style names, plain-language results, installation identity and reduced motion. No browser errors or failed requests. [Desktop](screenshots/hexars-desktop.png), [iPhone](screenshots/hexars-iphone.png), [record](screenshots/hexars-qa.json).

## Dark board and piece refinement

Dark theme is now the default, including sheets and home-screen launch colours. Six original vector silhouettes are reused by both sides, the board, player strips and promotion picker. Every theme uses two-tone outlines for visibility. Legal destinations are inset hexagons: blue for ordinary moves, orange for captures, pink for checks, both colours for checking captures. C++ supplies capture/check metadata, including en passant. Pointer focus/tap rectangles are suppressed; keyboard focus uses an inset hexagon. Shared pass-and-play auto-flips after each continuing turn. Native protocol/manager checks: 14 passed.

Published dark-release checks: 44 passed across desktop and iPhone-sized browser contexts. All three board palettes passed piece fill/edge contrast checks for both sides. Verified ordinary moves/captures/checks, combined checking captures, automatic turn-by-turn orientation, completion through mate, undo, touch selection without native rectangles, keyboard focus/navigation, reduced motion and dark installation metadata. No browser errors or failed requests. [Desktop](screenshots/hexars-dark-desktop.png), [iPhone](screenshots/hexars-dark-iphone.png), [check record](screenshots/hexars-dark-qa.json).

## Automatic low-material house rule

The repeated king in the user’s piece list was interpreted as knight. Each side may have only its king plus zero or one bishop, knight or rook; eligible games automatically draw ½–½. Pawns, queens and two non-king pieces on either side keep play active. Actual checkmate already delivered wins; historical stalemate still scores ¾–¼ outside this threshold. The protocol hides legal moves after a material draw, move application rejects further play, and search returns no move. Native verification: 5,737 assertions, 5,340 random plies, eight completed random games and two completed engine games; 15 protocol/manager tests passed.

Published material-draw UI checks: 29 passed. Real cloud startup and human/engine moves were verified; five draw presentations used native-generated fixtures supplied by browser request interception. [Record](screenshots/material-draw-qa.json).

## Larger board

Published a tightly framed board, smaller phone gutters, full-width tablet layout, wider desktop play area and compact surrounding controls. Production checks: 30 passed at 320, 390, 768 and 1440 pixels, including all cells within the SVG, no horizontal overflow, actual cloud moves and pass-and-play rotation. Visible board width grew about 30% on a 390px phone and 88% on a 768px tablet. [Before](screenshots/board-size-before.json), [after](screenshots/board-size-after.json).

A further desktop height constraint is prepared locally (with a partial edit in the Floot editor) but not yet published: Floot refused the final typecheck/publication after exhausting the daily build allowance, resetting at 2026-10-13 05:00 UTC. The live desktop board can extend below the viewport. The published expansion itself succeeded (job 613f424e-447e-4663-8042-95c10cb5d997).

The complete pending desktop constraint passed the local production build and a 1440×1040 browser fit check; upload the final pages/_index.module.css from this repository before the next publication.
