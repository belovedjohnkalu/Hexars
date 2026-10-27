# ION

ION is live at **https://ion.floot.app**. The authoritative application is in
`cloud/floot`, using Floot-hosted React, managed Postgres, Realtime and cloud C++
rules/search. The Cloudflare, Supabase and Vercel migration sources are retained
for development; they do not serve the live app.

## Frontend — 0.72

ION now uses a light appearance throughout. Older dark preferences are cleared
on load, and the default browser icon uses dark lines on white. Stock Home
illustrations adapt to the light canvas while personal pictures keep their
original colors.

Organic clouds and adjoining tiles grow in a compact hexagonal arrangement, with
whole eight-word lines, readable sizes and pan/zoom. Organic screens are Bubbles;
the desktop down arrow closes the selected Bubble. The paint palette sits below
the input and chooses varied colors by default, with manual control available.
The verified Frontend prompts are archived in Completed. See
[release details](docs/releases/ion-0.72.md).

## Functionality — 0.71

Editable words open in the footer on double-tap. Pictures retain double-tap
full-screen viewing; Ctrl/Cmd-click opens Controls. Edits keep chosen media,
allow verified pictures/audio, preserve the original identity and retain failed
drafts. Picture-only clouds keep natural proportions without filename captions.
Drag an editable cloud onto another to nest it; Move remains available in Controls.
New identical nonempty sibling names are rejected by the server.

The floating arrows now go Up the hierarchy and Down to its last opened droplet.
Ctrl/Cmd-Left or Right opens a typing-ready Sky; Ctrl/Cmd-Enter publishes and
enters the confirmed cloud. Skies prints a minimal +. Shared theme-aware colors
are richer, with indigo boards and distinct move/capture/check/last-move outlines.
The verified Functionality branch is archived under Prompts → Completed.
See [release details](docs/releases/ion-0.71.md) and
[verification](docs/verification/ion-0.71.json).

## Daily puzzles and organic refinements — 0.70

Learn → Puzzles now offers a daily, rule-validated position for every chess and
checkers variant, with Hint, practice and account-private completion across
devices. Each variant has 64 rotating compositions. Paid variants keep their
existing purchase requirement. See [puzzle validation](tests/puzzles/README.md).

Controls → Settings holds Toggle Tiled UI. Organic clouds keep full eight-word
lines, descendant-character sizing with a readable minimum, wider spacing and
square packing. Move/Duplicate suggests nearby branches first. Desktop typing
retains compact entry and both navigation arrows. Other Accounts stays tied to
the actual remembered sign-ins on this device, including when switching devs.
Purchases open the selected cloud; Time → Receipts keeps the purchase record.

## Chess hub

Open Board Games → Chess. **Play**, **Learn**, **Library** and **Community** form
one hub. Continue returns to this account’s unfinished local-device match;
signed-in games remain available through Library across devices. Learn has a
first-game guide, complete rules/diagrams and a rotating daily idea.

Play offers Gliński, McCooey, Shafran, Brusky, De Vasa and Wellisch. Checkers has
HexDame and Kruzno. Choose a board, then Computer with six difficulty levels,
Pass and Play, or Online. Computer is the unified public choice; the six
independent C++ engine implementations and their historical documentation remain
in the repository. They are not six separately priced public choices.

Community has Start here, Strategy, Variants, Your games, Ideas and Following.
Visitors can read; signed-in players can post, follow and report. Authors can
edit/delete their own posts. Registered devs can rename/move hub entries, edit
action labels, configure posting/admission limits, and pin, close, move, hide or
restore discussions. Public text contains names rather than emails. Drafts and
automatic resume caches are account-scoped. Public forum ILs link directly to
discussions or replies without sharing a workspace identity.

The release includes shared public snapshots, one realtime connection per
account/document, bounded discussion pages, native board/starting-position
caches, duplicate-search protection and per-room matchmaking locks. These remove
specific bottlenecks; **one million concurrent visitors and a 10% return rate
have not been certified**. See [capacity and staging gates](docs/chess-launch-capacity.md),
[release details](docs/releases/ion-0.69.md) and [verification](docs/verification/ion-0.69.json).

## Clouds, accounts and presentation

ION uses pannable, zoomable clouds of words and pictures. Descendant characters
set relative size, with a readable minimum; a cloud’s own name reserves geometry
but does not set its font. Light is the sole theme and organic clouds are the default. Accounts
provides saved sign-ins; Controls → Settings contains the appearance controls. The optional adjoining
rhombi, Skies/Tiles and split screens share the same content and game state.
Inter is self-hosted; motion respects reduced-motion preferences.

Safari is shared and live. Journal is private to its signed-in account. Hold or
right-click to open Controls. Dev authority comes from the server’s registered
dev accounts, never a label or client role. Permanent ILs survive deletion and
moves; copies receive new identities. Copy IL is available to everyone in
Safari, and direct IL links are a navigation mechanism. Keyboard Back/Forward
follows visited pages; the floating Up/Down arrows follow the cloud hierarchy.
Confirmed content is server-saved; unsent drafts stay local to
the current account. Remembered sign-ins never store passwords in browser storage.

Saved games do not expire automatically. Library supports private History,
shared games, recorded positions, notations and opponents. Online requires an
email account, supports random matching and four-digit rooms, and assigns
account-only seats (three in Wellisch). Online play offers Forfeit, Draw and
temporary chat. Native rules validate moves, promotions and results; full-cell
hitboxes and distinct inset outlines show legal moves, captures and last moves.

## Time

Time offers active-use earning, account-private activity, transfers, permanent
feature purchases and dev work administration. Each published paid feature’s
price is total approved development Time divided equally by the paid-feature
count, then by real accounts with unexpired server sessions. Saved sign-ins
count once per account; reserved test accounts do not count. Recorded work uses
observed session intervals and preserves the append-only ledger. Elapsed agent
work is not independently verified human labor.

Gliński, its rules, Online, Library, HexDame and Computer remain free. Unaffordable
unpurchased features stay hidden; affordable ones show a purchase gate. Server
purchase proof remains authoritative. Existing engine products stay out of the
public price pool. See the current release and earlier [Time documentation](docs/time/README.md)
for historical context.

## Install and integrations

On iPhone/iPad Safari, use Share → Add to Home Screen. Android Chrome can offer
Install app. Install is hidden on unsupported browsers, embedded screens and
already installed apps. Cloud play requires internet; no service worker or
native store build is part of this release.

The OAuth-protected [ChatGPT integration](https://ion.floot.app/chatgpt) can read
and save words in Journal and purchased Schedule. Its portable package is in
[plugins/ion](plugins/ion), with [connection notes](docs/integrations/chatgpt.md).
OAuth/MCP endpoints are intentionally available to external clients.

## Work on the source

Node.js 24 LTS is recommended (minimum 22.18), with a C++20 G++ compiler for development. Install dependencies:

```sh
npm ci
npm run dev
```

Open http://localhost:5173. The Vite website now uses the independent frontend in `web/src`. To play locally, configure Supabase and run the native API alongside Vite; follow [the cloud migration guide](docs/cloud-migration.md). The live Floot app remains authoritative during migration preparation. Frontend assets and font files are served locally.

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
cloud/floot/                Active Floot app source and helper tests
cloud/migrations/           Authoritative additive Floot database migrations
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
engines/engine-6/            Independent Universal adaptive PVS/MaxN search
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
