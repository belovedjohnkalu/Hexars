# HEXARS · cloud edition 0.5

**Play now: https://hexars.floot.app**

Gliński’s hexagonal chess is playable on desktop and mobile. React/TypeScript renders the board; authoritative rules and Engine 1’s search run in a standalone C++ executable on the cloud server. No local engine installation is required to play.

## Install on your phone

- iPhone/iPad: open the website in Safari → Share → Add to Home Screen → Add.
- Android: open it in Chrome → ⋮ → Install app or Add to Home screen.

Use **Add to home screen** in Settings for instructions or a browser installation prompt where available. The home-screen app uses a standalone window. This is an installable web app, not an App Store or Play Store binary. Internet access is required for cloud play.

Games are saved in the cloud. **Share game** lets you resume on another device; **Settings → Continue another game** restores a copied link after installation if browser and app storage are separate. Anyone with that link can control the shared game. There are no user accounts or side-specific multiplayer credentials yet.

## Design

HEXARS stands for Hearth, Embers, Xenon, Adobe, Rhombus and Sleek. The interface uses deep charcoal surfaces, iPhone-style system type, soft blue-grey hexagons, restrained clay accents and rounded controls. Rules, board colours, opponent profiles, saved games and installation live in simple sheets; developer diagnostics are omitted from player flows. Large vector pieces share the same shapes across both sides, with theme-aware fills and contrasting edges. Inset hexagons mark moves, captures and checks; checking captures combine both colours. Pass-and-play automatically faces the next player. Pieces slide, the board rotates, and sheets fade smoothly, with reduced-motion support. The alternative board palettes are Adobe (warm clay) and Hearth (soft stone).

The six opponent names are Tactical, Positional, Defensive, Materialist, Unconventional and Universal. Only Tactical is playable today. Floot requires a paid plan to remove its hosting badge; the current free-plan deployment retains it. The old address has been replaced; home-screen installations should be re-added from the new address. Existing saved game links can be pasted into Continue another game.

## Playable now

- A native-authoritative 91-cell board with 36 historical starting pieces.
- All six Gliński piece movements, checks and pins, en passant, four promotion choices, and pawn double advances from any friendly original pawn cell.
- Checkmate, fractional stalemate (¾–¼), automatic threefold repetition, the fifty-move rule, and automatic material draws. HEXARS now ends in a ½–½ draw when each side has only its king plus at most one bishop, knight, or rook. Pawns, queens, or two pieces on either side prevent this house-rule draw; an already-delivered checkmate wins. There is no castling.
- Human versus Tactical as White or Black, or a shared two-player board.
- Saved games, move history, undo, board flipping, coordinates, three themes, and keyboard/touch controls.
- Tactical: material and positional evaluation, iterative-deepening alpha-beta, capture ordering, bounded quiescence, and time/node limits. Current hosted budget: 750 ms, maximum depth 3 and 30,000 nodes.

Engines 2–6 and McCooey, Shafran, Brusky, De Vasa, and Wellisch remain planned. Each future engine will be an independent executable with its own search/evaluation design. Engine identities are provisional; strength has not been rated.

## Work on the source

Node.js 22.12+ and a C++20 G++ compiler are required for development. Install dependencies:

```sh
npm ci
npm run dev
```

Open http://localhost:5173. The default Vite website uses the same playable frontend as the published app and proxies its API and icons to the live cloud backend. The backend remains hosted; Vite is not a local replacement for its database/server runtime.

To compile and check native code:

```sh
npm run build:engine
npm run build
npm test
```

For a fully static Linux/x64 cloud executable, run `npm run build:cloud` on Linux. An optional CMake/CTest build is also supplied. See [Windows setup](docs/windows-setup.md) for MSYS2/PowerShell commands. Windows execution has not been verified in this Linux workspace.

The original local manager is retained as a diagnostic foundation. Start `npm run manager`, then visit http://localhost:5173/?foundation. It proves local C++ identity, ping, and geometry through WebSocket; it is not the cloud game's server. Keep that development service on loopback.

## Source layout

```text
cloud/floot/                Published React UI, API endpoints, native process bridge, DB types
cloud/icons/                Home-screen icons
cloud/schema.sql            Cloud game-table schema
web/                        Vite entry point for playable UI and optional foundation diagnostics
manager/                    Loopback WebSocket diagnostic manager
engines/engine-1/            C++ protocol, search, evaluation
engines/engine-2/ … engine-6/ Reserved independent engines
shared/include/hexchess/     Geometry, pieces, moves, game state, rules
shared/src/                 Geometry and authoritative Gliński rules
shared/variants/            Gliński starting position; other modules reserved
shared/protocol/            Versioned native and cloud contracts
tests/                      Native rules, games, protocol, manager, frontend checks
docs/                       Architecture, rules references, progress, browser evidence
```

The cloud backend runs on Floot's Node server runtime with Postgres. Cloudflare Pages alone cannot execute this native C++ server architecture. Hosting details, the published URL, and the binary checksum are recorded in `cloud/hosting.json`. Provider-generated scaffolding, routing, dependencies, injected database configuration, and deployment are supplied by Floot; copied files are not an independently deployable backend without that runtime.

## Verification

Native tests passed 6,062 assertions over 5,775 random plies, four complete random games, and two complete Engine-1-versus-random games. Twelve native-protocol/manager integration tests and three frontend tests passed, as did TypeScript, Vite build, and CMake/CTest.

Published-site browser checks verified real C++ replies, both human sides, a complete seven-ply historical checkmate, undo, cross-device resume, mobile layout, themes, and installation metadata/instructions. The dark HEXARS release passed 44 published browser checks. See [progress](docs/progress.md) and [browser check record](docs/screenshots/hexars-dark-qa.json). Actual installation on a physical iPhone/Android device is not automated by those checks.

`npm run package:source` exports the current Git commit to `artifacts/hexars-source.zip`, excluding dependencies and compiled binaries.
