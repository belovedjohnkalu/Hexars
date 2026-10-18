# ION

ION is live on **Floot** at https://ion.floot.app. Its main navigation is a
pannable, zoomable cloud of words and pictures. Open **Hexagonal Chess**, then
**Boards** to choose Gliński, McCooey or Shafran, **Engines** to select Tactical, or **Rules**
for separate rule paragraphs. Rule lists are words; illustrations appear inside each paragraph, and long text uses fitted pages without scrolling.

Home contains **Hexagonal Chess**, **Public**, and **Private**. Public has the same saved continuous-gradient color wheel as Private and is readable
across accounts and devices, with live updates; sign in to contribute. Private is
visible only to its signed-in account. Hold a word to edit or transfer its entire
branch between Public and Private, with confirmation before publishing. Only the
configured owner can edit the shared Hexagonal Chess content. Existing personal
content stays private; it is not published automatically.

Every confirmed word and picture is stored on the server. Remember accounts on a
trusted device to switch without re-entering passwords; forgetting removes that
shortcut. No passwords are stored in browser storage. Each cloud accepts 1,024 immediate droplets; total workspace size and nesting are independent. React/TypeScript renders the interface; authoritative rules and
Tactical search run in C++ on the cloud server. No local engine installation is
required. A domain change requires signing in again; account content persists.

Shafran is available on the live ION app, with 70 cells, triple pawn advances,
both crossed en passant cells, four castling choices per side and an equal stalemate.
Private cloud names have no 80-character restriction; compact previews preserve the
full saved name, readable through fitted pages. Home at a space root opens ION.
Moves now animate immediately from native visual deltas while the cloud confirms
them; failures restore the saved board.

The Cloudflare,
Supabase and Vercel migration is paused at the user's request. The live Floot
source is mirrored under `cloud/floot`; `web` is the separate migration source.

A [Vercel Services configuration](docs/vercel-services.md) is also prepared for
review: a public web service, a public API gateway, and a private native API.
The gateway calls the private API through a runtime service binding. It has not
been deployed.

Historical saved-game keys, protocol identifiers and `HEXARS_` server variable
names are preserved so the ION rename does not break existing games or hosting
configuration. Package workspaces now use `@ion/` names.

## Install on your phone

- iPhone/iPad: open the website in Safari → Share → Add to Home Screen → Add.
- Android: open it in Chrome → ⋮ → Install app or Add to Home screen.

The **Install** action appears only when the browser supplies an installation prompt or when manual installation is supported in top-level iPhone/iPad Safari. It is hidden in incompatible browsers, embedded frames and an already installed app. The home-screen app uses a standalone window. This is an installable web app, not an App Store or Play Store binary. Internet access is required for cloud play.

Games are saved in the cloud. **Share game** lets you resume on another device; opening a copied game link restores it after installation if browser and app storage are separate. Anyone with that link can control the shared game. Word spaces now have user accounts. Chess sessions still use separate capability links; side-specific multiplayer credentials and an account game library are not included. The current minimal game surface does not expose a Share button; historical copied links still open.

## Design

ION uses pure black, neutral glass, self-hosted Inter, and smaller words. Drag to
pan, pinch or Ctrl/Command-wheel to zoom, or use keyboard zoom. App pages do not scroll. Hold/right-click a word for Edit, Move, Copy or Delete.
Home roots are fixed; only the owner may change shared Chess entries. Deletion within a space is reversible.
The compact insert bar and parent Back sit at the bottom. Public, Private and the owner’s Hexagonal Chess editor have a compact continuous gradient wheel. New selections avoid exact duplicate colors among siblings, including server-side allocation. Existing saved colors and branch copies are preserved. Home uses fixed positions. Deletion Undo expires after ten seconds.

Boards opens starting-position pictures for the two published variants. Each
game places its interactive board among Variants, Rules, Engines, Board Reset
and Undo, plus Pass and Play to deselect Tactical. Swipe right for an earlier move, left for a newer one; Present returns
to live play. A bold result sheet identifies checkmate, stalemate and draws.
Pieces remain flat, high-contrast silhouettes. Semantic inset outlines distinguish
moves, captures, check, selection and the previous move. Motion respects reduced
motion. The Pro hosting badge setting is disabled.

## Playable now

- A native-authoritative 91-cell board: 36 starting pieces in Gliński, 32 in McCooey. Choose its starting picture in Boards.
- All six piece movements, checks and pins, en passant and four promotion choices. Gliński pawns regain a double advance from friendly original pawn cells. McCooey pawns capture along bishop diagonals and double-advance only on their first move, excluding the center pawn.
- Checkmate, Gliński fractional stalemate (¾–¼), McCooey equal stalemate (½–½), automatic threefold repetition, the fifty-move rule, and automatic material draws. ION ends in a ½–½ draw when each side has only its king plus at most one bishop, knight, or rook. Pawns, queens, or two pieces on either side prevent this house-rule draw; an already-delivered checkmate wins. Gliński and McCooey have no castling; Shafran supports short and long castling on both flanks.
- Human versus Tactical as White or Black, or a shared two-player board.
- Separate saved games per variant, shared links, undo, automatic pass-and-play orientation, promotion and keyboard/touch controls.
- Tactical: material and positional evaluation, iterative-deepening alpha-beta, capture ordering, bounded quiescence, and time/node limits. Six levels before board selection: Pre-Beginner (40 ms/depth 1/125 nodes, with a 50% random legal choice), Beginner (80 ms/depth 1), Easy (200 ms/depth 2), Medium (750 ms/depth 3), Hard (1.5 s/depth 4), Expert (3 s/depth 5), each with its own node limit. These are not Elo ratings.

Brusky’s native 84-cell board, conventional notation and 38-piece setup are implemented and tested; legal rules and live selection remain disabled until complete. See [Brusky progress](docs/variants/brusky.md). Engines 2–6, De Vasa and Wellisch remain planned. Each future engine will be an independent executable with its own search/evaluation design. Engine identities are provisional; strength has not been rated.

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
cloud/floot/                Active Floot app source, tests and migrations
cloud/floot-development/    Preserved unpublished Floot work
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

`npm run package:source` exports the current Git commit to `artifacts/ion-source.zip`, excluding dependencies and compiled binaries.

Browser install offers are retained in an app-level FIFO queue across page changes and menu closure. Only an explicit attempt that obtains the browser choice consumes an offer. Failed attempts stay available for retry. This concerns the website’s browser events; the app cannot alter ChatGPT’s message queue.

Development 0.9.0: tap a selected piece again to deselect. Moves glide for 480ms before the pass-and-play board rotates for 560ms; reduced motion skips the delay. The homepage places the geometric logo beside the wordmark. Shafran includes its 70-cell board, 36-piece setup, oblique a–i notation, pawn initial advances up to three hexagons, both crossed en-passant cells, four castling choices per side, promotion, legal search and drawn stalemate. No suggested extra features were added. See [Shafran](docs/variants/shafran.md) and [original implementation](docs/release-0.9.md) and [ION release](docs/ion-shafran-release.md).
