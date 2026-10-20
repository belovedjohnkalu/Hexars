# Development progress · cloud edition 0.5

Published: **https://ion.floot.app**

## 2026-10-20 — Dev namespaces, nickname sharing and explicit navigation

Published in two requested stages: visited-page Back, dev namespace 0 with IL01–IL05
Home roots, owner-only Home/Chess edits and unique-nickname saved-game sharing;
then removal of all automatic single-droplet traversal. Nickname races, account
isolation, Received delivery, visited Back and explicit History dates passed API
and browser checks. See [release details](ion-dev-namespaces-release.md).

## 2026-10-19 — Floating navigation and account refinement

Shared glass Back bubbles free the composer footer. Title holds open Controls;
signed-out Private stays stable. Signup has optional public nicknames, remembered
accounts hide Remember, and text Copy is separate from Duplicate. ION is organically
centered, deletion repacks survivors, and nested Back follows the immediate parent.
Random code rooms are available under IL0510. The requested recoverable IL201 branch
was restored. See [verification and release details](ion-navigation-account-refinement.md).

## 2026-10-19 — Organic clouds, redirects and Library

Cloud collections now use close, collision-free organic packing with dramatic
descendant sizing. IL04 is Library, with History and Shared Games. Saved cards
show their last position; read-only views offer Notations and Opponent(s), with
origin-aware Back. Controls supports whole-cloud/selected-word redirects and
saved-game sharing/deletion. Dev histories have permanent ILs. The app uses the
supplied geometric mark, traced for favicon and animated reduced-motion-aware
loading. See [release details](ion-organic-library-release.md).

## 2026-10-18 — Shafran, Public colors and responsive moves

Shafran joins Boards, Rules and Tactical on ION: 70 authoritative cells, 36 starting pieces,
triple pawn advances, both en passant targets, promotion and short/long castling
on both flanks. Pass and Play, saved games, undo and history use the shared flows.
Private names no longer have an 80-character cap; long labels use compact previews
and full fitted reading pages. The separate 1,024-immediate-droplet capacity remains.
Public now shares the color wheel and live color updates. Home at a space root opens ION.
Native visual deltas make moves animate immediately while saving; failures roll back.
Fourteen Shafran, six Private-name and seven Public/latency browser flows pass;
helper/type checks and 23 native protocol checks pass. See [release details](ion-shafran-release.md).

## 2026-10-17 — Colors, fitted pages and a stable Home

Published on https://ion.floot.app. Private has a saved-color wheel; default clouds
have shared pastel colors. Home anchors stay fixed and wait for initial viewport/data/font readiness.
Scrolling is replaced by pan/zoom and fitted pages, including rules and compact account flows.
Rule pictures appear only in the opened paragraph. Pre-Beginner has half Beginner's
search budget and random legal choices; Pass and Play deselects Tactical. Deletion
Undo expires ten seconds after deletion. Capacity is exactly 1,024 direct children,
checked on every creation/transfer/restore path. Explicit signup normalizes email.
See [release details](ion-refinements-release.md).

## 2026-10-17 — Public and Private on ION

Published at https://ion.floot.app. Home has exactly Chess, Public and Private.
Public updates live for all devices; Private requires its owning account; only the
configured owner edits shared Chess. Atomic branch transfers, remembered account
switching, keyboard anchoring, a new favicon, black sheets, blue boards, illustrated
rule paragraphs and five Tactical levels are complete. The old address was released.
Verification: 38 API assertions, 9 spec files plus the cloud hook, 14 new-domain
browser flows, 5 gesture/metadata checks, native checkmate and zero axe violations.
See [release details](shared-spaces-release.md) for evidence and device-test limits.


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
- [ ] The other three historical variants, including three-player Wellisch search/results.
- [ ] Stronger evaluation, transposition tables and native asynchronous search cancellation.
- [ ] Account game library, side-specific multiplayer access and broader production load testing.
- [ ] Offline features or native App Store/Play Store packaging if later requested.
- [x] GitHub source backup: belovedjohnkalu/Hexars (main).

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

The initial board expansion was published (job 613f424e-447e-4663-8042-95c10cb5d997). A further desktop height constraint was temporarily blocked by the daily hosting allowance, then published with the depth release after the allowance reset at 2026-10-13 05:00 UTC.

The desktop constraint passed the local production build and a 1440×1040 browser fit check.

## Tactile depth

Published beveled board cells with directional lighting and a solid lower edge, satin-shaded pieces with layered shadows, raised controls and player strips, recessed switches and fields, and floating sheets. All themes retain matching piece silhouettes and readable two-tone outlines. Mouse hover lifts controls; pressing the primary action lowers it; reduced-motion preferences stop these effects. Desktop sizing includes the board-fit constraint.

Local Vite production build passed. Browser checks: 55 gameplay/theme/accessibility checks and 31 responsive depth checks passed, with real cloud-native gameplay through the development proxy. Verified widths 320, 390, 768 and 1440, both board orientations, unique gradient references, all shading stop contrast, visible legal/check/capture hex outlines, checkmate, undo and reduced motion. [Gameplay record](screenshots/hexars-depth-draft-qa.json), [layout record](screenshots/depth-layout-draft-qa.json). Floot typecheck passed; publication succeeded after the allowance reset (job a0d91eb8-eb7f-4929-8681-28e78d6afcd0, checkpoint ef3f0d7d-95a5-4094-bb96-e6568601cf0c).

Published depth-release verification: all 86 browser checks passed (55 gameplay/theme/accessibility and 31 responsive/depth checks). Verified production-native moves, complete checkmate, shared-play flipping, keyboard navigation, theme contrast, raised/shaded surfaces, unique SVG lighting references, reduced motion and viewport fit. No JavaScript errors or failed requests. [Gameplay record](screenshots/hexars-depth-qa.json), [layout record](screenshots/depth-layout-qa.json), [desktop](screenshots/hexars-depth-desktop.png), [iPhone](screenshots/hexars-depth-iphone.png), [settings](screenshots/hexars-depth-settings.png).

## McCooey and installation compatibility

Published Tactical 0.6 with shared variant descriptors, the historical 32-piece McCooey setup, bishop-diagonal pawn captures, first-move double advances excluding the center pawn, en passant, promotions and equal stalemate scoring. New game and the variant label select Gliński or McCooey for cloud-engine play or shared pass-and-play. Help follows the selected game. Gliński hashes remain unchanged and a position generated by the previous published engine was successfully loaded with its original history key.

Installation controls are hidden by default and revealed only by a valid native install offer or top-level secure iPhone/iPad Safari. They disappear after a consumed native prompt or installation, and remain hidden in unsupported browsers and embedded frames. Native prompt dismissal does not fall through to incompatible manual instructions.

Native verification: McCooey 4,302 assertions, 4,162 random plies, nine complete random games, 73 engine plies, two complete engine games, and complete published games C and D ending in checkmate. Gliński regression: 5,736 assertions, 5,340 random plies, eight complete random games and two complete engine games. Eighteen protocol/manager tests, six Vitest tests, TypeScript/Vite and all three CMake/CTest targets passed. Floot typecheck was clean. Publication job 905900b3-4a83-45ea-8d41-b5f64435f97e succeeded; checkpoint 7a5a41f4-e59d-47a7-a9db-1884f15f78e4.

Published McCooey browser checks: 55 passed with no JavaScript errors or failed production requests. Verified both human sides against cloud Tactical, undo, the full historical Game C checkmate, turn-by-turn board flipping, cross-device saved-link resume, switching back to Gliński, and a saved Gliński game created before this release. Verified installation hidden on unsupported desktop/Android, embedded frames and installed standalone contexts; supported Safari shows manual instructions, and simulated native prompts are consumed once without an unsupported fallback. McCooey stalemate presentation used a native-generated fixture through browser interception. Physical OS installation is not claimed. [Record](screenshots/mccooey-cloud-qa.json), [desktop](screenshots/hexars-mccooey-desktop.png), [phone](screenshots/hexars-mccooey-iphone.png).

The final footer fix reserves space for the hosting badge and keeps mobile actions at the left. Publication 0ae9ce99-8bfb-47a1-9ba1-56332e919745 succeeded; checkpoint 382e35ec-9acc-467a-a24f-310f1f193ffc. The final local Vite build also passed.

## Quiet homepage and minimal game pages

Replaced the feature-heavy screen with a three-page interface: Home, Gliński and McCooey. Homepage previews come from native C++ starting positions through a read-only API; no game rows are created by previewing boards. Games have two main controls, larger type and a single inline menu for essentials. The color palette is warm charcoal, olive and ivory. Flat conventional vector pieces and board cells replace the satin gradients, lighting, extrusion and shadows. All purpose outlines, including both endpoints of the opponent’s last move, use bright four-unit strokes; keyboard focus remains an inset hexagon.

Per-variant session storage preserves both games, and legacy root saved links resolve to the correct variant page. Unconsumed install offers persist in a FIFO app-level queue across navigation; explicit attempts consume only their own offer, and failures remain available for retry. ChatGPT’s message queue cannot be managed by the website.

Local type/build checks and six Vitest tests passed. The new preview endpoint returned native 91-cell boards with 36 Gliński and 32 McCooey pieces. Local browser checks verified game controls, cloud reply, thicker opponent-move outlines, per-variant game preservation, historical mate and shared-link paths. Five dedicated browser checks verified prompt retention, FIFO order and retry after failure. Publication succeeded; initial job 2711e021-e780-4b7b-b775-8c530de23d1c, final metadata-preserving job b4f1679f-7f0f-4ce2-b035-147c6e509e56, checkpoint 0d1e0246-7697-4d60-9864-eb50a189e2b8.

Published minimal-release checks: 44 passed. Verified the three-page UI, native board previews without game creation, larger text, plain pieces and zero board depth, all thicker purpose outlines, bright opponent-move endpoints, both variant routes, separate preserved games, cloud engine reply, a complete historical mate, automatic shared-play orientation, old root-link migration, FIFO queued install offers across navigation and retry after failure, 320/390/768px layouts, keyboard focus and reduced motion. No JavaScript errors or failed requests. Native install offers are simulated to test lifecycle behavior; physical OS installation is not claimed. [Record](screenshots/hexars-minimal-qa.json), [home](screenshots/hexars-minimal-home.png), [game](screenshots/hexars-minimal-game.png), [phone](screenshots/hexars-minimal-phone.png). Apple/home-screen metadata is preserved in the shared AppHead component; manifest launch colors match the new palette.

## Shafran and smoother turns — pending publication

Development release 0.9.0 implements tap-again deselection, piece translation before pass-and-play rotation, the homepage logo and native Shafran gameplay. Four CTest targets, 22 protocol/manager checks, six frontend checks, 31 focused local browser checks and 44 local browser regressions passed. Previous production Gliński and McCooey snapshots preserved state IDs. Native Tactical 0.7 was uploaded, but further Floot writes were refused by the daily action allowance. The site remains 0.8.1. See [release status and resume steps](release-0.9.md). Suggested essentials were not implemented.


## Cloudflare / GitHub / Supabase migration preparation · 0.10.0

Cloudflare CLI OAuth, GitHub account access and Supabase organization access are
verified. The chosen Supabase organization is ION (Free). GitHub repository
creation was rejected by the connected integration’s permissions; Supabase’s
required cost-check tool is unavailable. Neither a new repository nor a database
project was created, and nothing has been pushed or deployed to the new stack.

The frontend now lives independently in `web/src`, uses local Inter/icons, and
communicates with a fixed Pages API proxy. A native Node API validates Supabase
sessions, delegates rules/search to the bundled C++ executable, and saves through
a Supabase store with atomic version checks. The SQL migration gives owners read
access and reserves mutations to the server. Guest sign-in is automatic only
when opening a game. Container hosting, CI, a web manifest and a network-only
service worker are prepared. The existing Floot site and game rows are preserved.

Verification: web/API builds and Cloudflare configuration typecheck passed;
15 API/proxy tests, 22 native protocol/manager tests and six frontend tests passed.
The API tests use real C++ processes and an in-memory test store, not a live
Supabase database. Ten local browser checks passed with mocked Supabase sessions
and real native game validation: previews without sign-up, one guest sign-up,
deselection, a legal move, reload, saved state, Inter and a 390px viewport.
The non-root Docker image built and served native 91/91/70-cell previews and
health successfully. No live Supabase authentication/database integration or
Cloudflare deployment is claimed. See [migration setup](cloud-migration.md).


### Supabase project provisioned

The existing HEXARS project in ION became available through the connected account
(`qnsqurxygwqlegfihhzh`, ACTIVE_HEALTHY). Both SQL migrations were applied.
Verified: game-table RLS is enabled; anon has no read grant; authenticated users
have owner-filtered reads and no insert/update/delete grants. Restricted the
platform RLS event-trigger helper to remove public RPC execution; the follow-up
security advisor has no findings. No game data has been imported or discarded.
The local frontend is configured with the project URL and public publishable key.
Anonymous sign-in is disabled and still needs enabling in Supabase’s Auth settings.
Server secrets, GitHub upload and the new website deployment remain pending.


### GitHub source published and CI verified

Source and its history were uploaded to
https://github.com/belovedjohnkalu/Hexars on `main`, preserving the repository’s
initial commit. GitHub verification run 38518846691 passed, including all four
CMake/CTest targets, protocol/manager tests, frontend tests, API tests, builds,
Cloudflare configuration typecheck and Docker build. The repository supplied by
the user is public. Source history was scanned for literal game-capability and
provider secret keys before publication; no matches were found.

Cloudflare CLI reports no paid account subscriptions. The prepared native-engine
container needs Workers Paid, and the API still needs its Supabase server key in
the hosting secret store. Anonymous Auth is disabled in Supabase. The new website
has not been deployed. The existing Floot app remains online.

## ION branding and Vercel Services

The app is now named ION. The homepage, document titles, mobile app labels and
manifest use ION; private npm workspaces use `@ion/`. Saved-game keys, native
state identifiers and existing server environment variable names are retained.

Vercel hosts three coordinated services: public `web`, public `gateway` under
`/api/*`, and private `api`. The gateway uses a runtime service binding to reach
the API; the API image includes the real C++ engine. The root Dockerfile and CI
configuration build this arrangement. Game-page rewrites preserve static fonts,
icons, scripts, manifest and service-worker routes.

Verification: the ION frontend/API build, gateway and optional Cloudflare host
type checks, 19 API/proxy tests, and six frontend tests pass. The preceding
service configuration also passed 15 HTTP checks through `vercel dev -L`.

Publishing is blocked by Vercel account access: the connected token returns 403
for the default ION team (`ion-629c`). The CLI has no prior login. No Vercel
project or public URL has been created. The Supabase server key is not bound and
anonymous sign-in is still disabled; these are also required for hosted games.
The GitHub integration rejected repository renaming, so source remains in the
existing `belovedjohnkalu/Hexars` repository.

## 17 October 2026 — spatial, synchronized ION

Published black word-space UI with smaller type, pan/zoom gestures and native
scrollbars, compact bottom composer/Back, long-press editing and subtree transfers.
Removed the item cap. Added private account-backed cross-device cloud storage and
scoped realtime refresh. Boards now contains both variant previews; Rules includes
complete variant text; Tactical routes back to the incoming game. Added read-only
swipe history and bold result sheets. Ten spec files and real browser sync,
gesture, cloud-to-game and native checkmate checks pass. See ion-cloud-navigation.md
for exact evidence and limitations. GitHub remote is configured and is the backup.


## Five variants and owner identifiers — October 18

Brusky and De Vasa now have complete native rule integration, Tactical support,
pointy web rendering and 23 Rules paragraph clouds each. The focused gradient
picker overlays the composer only during entry. Permanent owner-only IL labels
are stored separately from deletable nodes, with never-reused arrival counters.
The corrected alphabetic segments are 0–9, A0–Z9, AA0–ZZ9, then AAA0 onward.
Moves preserve identities across scopes; copies receive new labels.

Native regression, full games, protocol rights/serialization and UI tests pass;
live release evidence is recorded in docs/ion-five-variants-release.md. Wellisch
and Engines 2–6 remain planned.

## Controls and three-player foundation — October 18

Implemented 300 ms hold-to-Controls navigation, dev-only Copy IL, stable camera
restoration, cloud-based Accounts, dev-editable ION/system clouds, original system
photos, multiple-picture collages and full-screen viewing. Explicit dev membership
supports multiple accounts while preserving Private isolation. Saved chess games
expire after 30 days since the last saved game change, with daily physical cleanup.
Wellisch now has tested three-player setup/geometry/reserve metadata, but remains
disabled for play until historical multiplayer rules and search are complete.
See ion-controls-retention-release.md for verification and deployment evidence.

## Whole cloud labels — October 18

Cloud labels, account emails, sentences and photo captions now remain on one
line, with full text rather than abbreviated previews. The spatial world grows
to the measured label plus its IL; image dimensions remain independent. Existing
pan/zoom and no-scroll behavior are preserved. Layout and related regressions
pass; browser fixtures verify 320/393/768/1280 px, complete labels, no overlaps,
and keyboard pan/zoom. Static audit retains the 20 previously reviewed JSX
false positives; no new unresolved ownership or blocking findings.

## Viewport edge outline — October 18

Removed the full-screen focus outline from the spatial pan-and-zoom viewport.
This prevents the occasional white rectangle after focus restoration while
retaining visible focus feedback on individual clouds, buttons and inputs.
The Floot typecheck is clean, the production CSS was inspected, and the fix is
live at ion.floot.app.

## Wellisch three-player completion — October 18

The sixth variant now supports legal native three-player games, original army
takeover, preserved pawn directions/reserves, king–rook swaps, immediate and
delayed captured-piece promotion, forced passes, final mate/stalemate and complete
saved timelines. Tactical uses MaxN; the UI supports three armies, 120-degree
Pass and Play, both Tactical replies, full-round Undo and 22 Rules clouds.
Native, protocol, saved-state compatibility and browser checks passed. Published
as UI 0.18.0 / Tactical 0.9.0. See ion-wellisch-release.md for evidence and rule
source limits. Engines 2–6 remain future independent executables.

## Board swipes and square Boards — October 18

Vertical swipes flip Pass and Play or switch Tactical sides on the same saved
game. Busy side changes queue; horizontal history remains available. IL01 Boards
now uses a square arrangement. Focused tests, hosted typecheck and browser
verification passed. Published at ion.floot.app; see ion-board-swipes-release.md.

## Boards column correction — October 19

The clipped square spiral is replaced with two explicit columns and three rows.
Both columns fit when Boards opens, including on 320px phones; the old camera
cache is invalidated. Focused tests/typecheck and three-width browser checks pass.
See ion-boards-grid-release.md and ion-boards-grid screenshots/QA JSONs.

## Permanent History, Online and Positional — October 19

Added date-based private History, removed automatic saved-game expiry, and added
email-gated random matchmaking plus four-digit two/three-player rooms. Native
rules validate every online turn; updates use private live channels. Added the
first independent Positional executable. Title refresh, move-aware board swipes,
balanced cloud layouts, linked Wellisch text, king chess branding, full-cell
targets and distinct last-move outlines are live. Typecheck, eight Jasmine suites,
36 native/protocol tests, cloud API and multi-browser checks passed. See
ion-journeys-online-release.md for limits and deployment evidence.
