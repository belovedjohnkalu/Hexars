# ION

ION is live on **Floot** at https://ion.floot.app. Its main navigation is a
pannable, zoomable cloud of words and pictures. Open **Hexagonal Chess**, then
**Boards** to choose Gliński, McCooey, Shafran, Brusky, De Vasa or Wellisch, **Engines** to select Tactical, Positional, Defensive, Materialist or Unconventional, or **Rules**
for separate rule paragraphs. Rule lists are words; illustrations appear inside each paragraph, and long text uses fitted pages without scrolling.

Home starts with **Hexagonal Chess**, **Public**, **Private**, **Controls** and **Accounts**. Dev accounts may add more. Public has the same saved continuous-gradient color wheel as Private and is readable
across accounts and devices, with live updates; sign in to contribute. Private is
visible only to its signed-in account. Hold a word for 300 ms to open Controls and edit or transfer its entire
branch between Public and Private, with confirmation before publishing. Only explicit
dev accounts can edit the shared Hexagonal Chess content. Existing personal
content stays private; it is not published automatically.

Dev accounts see permanent IL labels beside accessible clouds and can copy them from Controls. Each actual hierarchy level adds a zero-based arrival segment without placeholder zeros: IL1 → IL10 → IL100. Segments run 0–9, A0–Z9, AA0–ZZ9, then AAA0 onward. Deletion never releases a number; moves retain labels and copies receive new ones. Ordinary accounts never receive these labels. Existing content is initialized in its saved order.

Every confirmed word and picture is stored on the server. Select multiple photos for a collage; hold it and choose View photos to inspect each image full screen with pan/zoom. Accounts and Controls use the same cloud navigation. Remember accounts on a
trusted device to switch without re-entering passwords; forgetting removes that
shortcut. No passwords are stored in browser storage. Each cloud accepts 1,024 immediate droplets; total workspace size and nesting are independent. React/TypeScript renders the interface; authoritative rules and
the five independent engines run in C++ on the cloud server. No local engine installation is
required. A domain change requires signing in again; account content persists.

Shafran is available on the live ION app, with 70 cells, triple pawn advances,
both crossed en passant cells, four castling choices per side and an equal stalemate.
Private cloud names have no 80-character restriction; full labels stay on one line
in an expanding spatial canvas, with pan and zoom. Home at a space root opens ION.
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

Games are saved without automatic expiry. Signed-in games appear in private **History** under Hexagonal Chess, grouped by year, month and day, then by individual variant previews. Each level opens explicitly, including a single-child level. Valid older local saved links can attach on opening; ownership of unrelated anonymous games is never guessed. Existing capability links still authorize local games, while online matches require account membership and the assigned seat.

**Online** supports email-authenticated random matching by variant (or Random), and four-digit rooms for two players or three in Wellisch. Waiting rooms expire after 15 minutes; saved games do not. Moves are native-validated and delivered through private live update channels, without match polling. Downward title pulls refresh. Vertical board swipes switch the engine side only before the first move, then rotate the view. Each cell has a complete hexagonal hitbox, and dashed lavender last-move outlines differ from legal blue destinations.

**Positional 1.0.0** and **Defensive 1.0.0** are separate C++ executables with independent search and evaluation. All five engines support all six variants and the six-level ladder. Build them with `npm run build:engines`; test the new searches with `npm run test:search`. Add `-- --cloud` to `build:positional` or `build:defensive` for a static Linux binary. See [engine release notes](docs/ion-independent-engines-release.md).

**Materialist 1.0.0** uses memory-enhanced zero-window search and material/exchange evaluation. **Unconventional 1.0.0** uses guided PUCT tree search and sampled rollouts, with separate per-player rewards for Wellisch. They share the existing difficulty, save and cloud execution flow. See [the fourth and fifth engines](docs/ion-materialist-unconventional-release.md).


## Design

ION uses pure black, neutral glass, self-hosted Inter, and smaller words. Drag to
pan, pinch or Ctrl/Command-wheel to zoom, or use keyboard zoom. App pages do not scroll. Hold/right-click a word for Edit, Move, Copy or Delete.
ION, Accounts and Controls are read-only for ordinary accounts; dev accounts can customize them. Only dev accounts may change shared Chess entries. Deletion within a space is reversible.
The compact insert bar and parent Back sit at the bottom. Public, Private and the owner’s Hexagonal Chess editor have a compact continuous gradient wheel, visible only while entering a word. New selections avoid exact duplicate colors among siblings, including server-side allocation. Existing saved colors and branch copies are preserved. Home uses fixed positions. Deletion Undo expires after ten seconds.

Boards opens native starting-position pictures for all six published variants. Each
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
- Human versus Tactical, Positional, Defensive, Materialist or Unconventional as White or Black, or a shared two-player board.
- Separate saved games per variant, shared links, undo, automatic pass-and-play orientation, promotion and keyboard/touch controls.
- Tactical: material and positional evaluation, iterative-deepening alpha-beta, capture ordering, bounded quiescence, and time/node limits. Six levels before board selection: Pre-Beginner (40 ms/depth 1/125 nodes, with a 50% random legal choice), Beginner (80 ms/depth 1), Easy (200 ms/depth 2), Medium (750 ms/depth 3), Hard (1.5 s/depth 4), Expert (3 s/depth 5), each with its own node limit. These are not Elo ratings.

[Brusky](docs/variants/brusky.md) and [De Vasa](docs/variants/devasa.md) are playable with their own pawn rules, en passant, promotion, castling, results and Tactical search. Their 84-cell and 81-cell boards use native pointy geometry. [Wellisch](docs/variants/wellisch.md) adds three-player pass-and-play and human-versus-two-Tactical games: first king capture transfers the army, pawns keep their direction, and the remaining game ends by normal mate/stalemate. Captured-piece promotion reserves, delayed promotion and king–rook swaps are saved natively. Tactical 0.9.0 uses MaxN for this variant. Positional, Defensive, Materialist and Unconventional are also playable here; Universal remains planned as Engine 6. Strength has not been rated.

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
engines/engine-2/            Independent Positional MaxN search/evaluation
engines/engine-3/            Independent Defensive paranoid alpha-beta/evaluation
engines/engine-4/            Independent Materialist MTD(f)/exchange search
engines/engine-5/            Independent Unconventional PUCT/sampled-rollout search
engines/engine-6/            Reserved Universal engine
shared/include/hexchess/     Geometry, pieces, moves, game state, rules
shared/src/                 Geometry and shared authoritative variant rules
shared/variants/            Six playable variant setups and policies
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
