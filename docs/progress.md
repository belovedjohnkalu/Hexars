# Development progress · cloud edition 0.2

Published: **https://hexchess-lab-9d7c.floot.app**

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
