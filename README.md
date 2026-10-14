# HEXARS · cloud edition

**Play now: https://hexars.floot.app**

The existing live release includes Gliński and McCooey. The development source also implements Shafran and is being migrated to GitHub, Cloudflare Pages and Supabase. The new stack has not been published yet. React/TypeScript renders the board; authoritative rules and Engine 1’s search run in a standalone C++ executable on the cloud server. No local engine installation is required to play.

## Install on your phone

- iPhone/iPad: open the website in Safari → Share → Add to Home Screen → Add.
- Android: open it in Chrome → ⋮ → Install app or Add to Home screen.

The **Install** action appears only when the browser supplies an installation prompt or when manual installation is supported in top-level iPhone/iPad Safari. It is hidden in incompatible browsers, embedded frames and an already installed app. The home-screen app uses a standalone window. This is an installable web app, not an App Store or Play Store binary. Internet access is required for cloud play.

Games are saved in the cloud. **Share game** lets you resume on another device; opening a copied game link restores it after installation if browser and app storage are separate. Anyone with that link can control the shared game. There are no user accounts or side-specific multiplayer credentials yet.

## Design

HEXARS stands for Hearth, Embers, Xenon, Adobe, Rhombus and Sleek. The dark interface uses blue and black with frosted controls, self-hosted Inter typography and very few words. The development homepage shows three authoritative starting positions; choose a board to open `/glinski`, `/mccooey` or `/shafran`. Each game has just Home and one menu. Undo, sharing, play mode, side selection, new game and concise rules stay inside that menu.

Pieces are original flat Staunton silhouettes, identical for both sides except their fill/outline colors. The board has no beveled depth, gradients or drop shadows. Inset outlines are 4 SVG units thick: mint moves, amber captures, coral checks, pale-yellow selection and bright ivory previous moves. Both endpoints of an opponent’s last move remain fully bright. Smooth movement and rotation respect reduced motion.

Tactical is the current cloud engine. The other five independent engines remain planned. The site’s free hosting badge is provider-controlled and remains present.

## Playable now

- A native-authoritative 91-cell board: 36 starting pieces in Gliński, 32 in McCooey. Choose its starting board on the homepage.
- All six piece movements, checks and pins, en passant and four promotion choices. Gliński pawns regain a double advance from friendly original pawn cells. McCooey pawns capture along bishop diagonals and double-advance only on their first move, excluding the center pawn.
- Checkmate, Gliński fractional stalemate (¾–¼), McCooey equal stalemate (½–½), automatic threefold repetition, the fifty-move rule, and automatic material draws. HEXARS now ends in a ½–½ draw when each side has only its king plus at most one bishop, knight, or rook. Pawns, queens, or two pieces on either side prevent this house-rule draw; an already-delivered checkmate wins. Gliński and McCooey have no castling; Shafran supports short and long castling on both flanks.
- Human versus Tactical as White or Black, or a shared two-player board.
- Separate saved games per variant, shared links, undo, automatic pass-and-play orientation, promotion and keyboard/touch controls.
- Tactical: material and positional evaluation, iterative-deepening alpha-beta, capture ordering, bounded quiescence, and time/node limits. Current hosted budget: 750 ms, maximum depth 3 and 30,000 nodes.

Engines 2–6, Brusky, De Vasa and Wellisch remain planned. Each future engine will be an independent executable with its own search/evaluation design. Engine identities are provisional; strength has not been rated.

## Work on the source

Node.js 24 LTS is recommended (minimum 22.18), with a C++20 G++ compiler for development. Install dependencies:

```sh
npm ci
npm run dev
```

Open http://localhost:5173. The Vite website now uses the independent frontend in `web/src`. To play locally, configure Supabase and run the native API alongside Vite; follow [the cloud migration guide](docs/cloud-migration.md). The old Floot site remains online during preparation. Frontend assets and font files are served locally.

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
cloud/floot/                Preserved legacy release and rollback source
api/                        Node API, Supabase storage, fixed native executable bridge
supabase/migrations/        Postgres schema and owner RLS
cloud/engine-worker/        Optional Cloudflare container hosting with cf
.github/workflows/          Native, web, API and container checks
cloud/icons/                Home-screen icons
cloud/schema.sql            Cloud game-table schema
web/                        Vite entry point for playable UI and optional foundation diagnostics
manager/                    Loopback WebSocket diagnostic manager
engines/engine-1/            C++ protocol, search, evaluation
engines/engine-2/ … engine-6/ Reserved independent engines
shared/include/hexchess/     Geometry, pieces, moves, game state, rules
shared/src/                 Geometry and shared authoritative variant rules
shared/variants/            Gliński, McCooey and Shafran setups and rule descriptors
shared/protocol/            Versioned native and cloud contracts
tests/                      Native rules, games, protocol, manager, frontend checks
docs/                       Architecture, rules references, progress, browser evidence
```

The cloud backend runs on Floot's Node server runtime with Postgres. Cloudflare Pages alone cannot execute this native C++ server architecture. Hosting details, the published URL, and the binary checksum are recorded in `cloud/hosting.json`. Provider-generated scaffolding, routing, dependencies, injected database configuration, and deployment are supplied by Floot; copied files are not an independently deployable backend without that runtime.

## Verification

McCooey native tests passed 4,302 assertions over 4,162 random plies, nine complete random games, two complete Tactical-versus-random games and two historical checkmates. Gliński regression tests passed over 5,340 random plies and eight complete random games. Eighteen native-protocol/manager tests and six frontend tests passed, as did TypeScript, Vite build and all three CMake/CTest targets.

Published-site browser checks verified real C++ replies, both human sides, a complete seven-ply historical checkmate, undo, cross-device resume, mobile layout, themes, and installation metadata/instructions. See [progress](docs/progress.md) for each published release and its browser evidence. Actual installation on a physical iPhone/Android device is not automated by those checks.

`npm run package:source` exports the current Git commit to `artifacts/hexars-source.zip`, excluding dependencies and compiled binaries.

Browser install offers are retained in an app-level FIFO queue across page changes and menu closure. Only an explicit attempt that obtains the browser choice consumes an offer. Failed attempts stay available for retry. This concerns the website’s browser events; the app cannot alter ChatGPT’s message queue.

Development 0.9.0: tap a selected piece again to deselect. Moves glide for 480ms before the pass-and-play board rotates for 560ms; reduced motion skips the delay. The homepage places the existing HEXARS logo beside the wordmark. Shafran includes its 70-cell board, 36-piece setup, oblique a–i notation, pawn initial advances up to three hexagons, both crossed en-passant cells, four castling choices per side, promotion, legal search and drawn stalemate. No suggested extra features were added. See [Shafran](docs/variants/shafran.md) and [pending release](docs/release-0.9.md).
