# ION spatial cloud release — 17 October 2026

Live: https://hexars.floot.app. Floot hosts the app, auth, database, storage, realtime
and native C++ chess engine. GitHub stores the source backup. Provider migration
is paused; `web` remains a separate development app.

Words now use 17–30px on phones and 20–38px on desktops. The black void supports
native two-axis scrolling, drag-to-pan, pinch, Ctrl/Command-wheel zoom and visible
zoom controls. Back and the 48px insert bar sit in the bottom thumb zone. No fixed
item-count or nesting cap remains; names are 1–80 characters and pictures up to 3 MB.

Hold/right-click an entry for Edit, Move, Copy, Delete. The title menu provides
keyboard access to the current entry’s actions. Transfers preserve subtrees; copy
creates fresh IDs, rejects cycles and deduplicates retries. Default entries use
sparse personal overrides. Deletion retains records and pictures for persistent Undo.

Confirmed content lives in Postgres. Guest capabilities still work. Sign-in joins
the browser’s words to a private account workspace; a second device using the same
account sees it. Each realtime token grants only that account’s update channel.
Claimed workspaces reject old unauthenticated capabilities. Sign-out clears the
browser identity, not the cloud account. Owner sign-in is activated with Forgot
password on /login. Password-reset email for other users needs a verified sending
domain in Floot’s Email settings; no reset emails were sent during testing.

Boards contains native starting previews for Gliński and McCooey. Rules contains
variant droplets, each with Complete rules and an explicit distinction between
historical rules and the selected low-material house draw. Tactical selection
returns to the incoming variant or Boards. Games retain separate engine and
pass-and-play save slots. Only Variants, Rules, Engines, Board Reset and Undo
surround the board. History requests inspect a saved native position without
mutating the live game. Result sheets announce winners, stalemate and draws.

## Verification

- Floot typecheck clean; ten Jasmine spec files pass, including 5,000-level
  hierarchy counting, transfer cycles, picture preservation and idempotency.
- Real API checks pass for guest/account joining, cross-device content, isolation,
  default-entry edits, branch restoration and full rules copying.
- `spatial-cloud.live.cjs`: 16 actual published-browser checks, including offline
  recovery, variant previews, moves, swipe history, Tactical routing and rules.
- `cloud-sync.live.cjs`: six browser checks using independent device contexts,
  real registration/sign-in, realtime refresh, visitor isolation, sign-out and session expiry.
- `spatial-gestures.live.cjs`: five actual input checks for holding a word, wheel
  zoom, drag, CDP touch pinch and app-owned account/recovery validation.
- `chess-results.live.cjs`: a seven-ply historical native checkmate triggers
  White Wins; dismissing it preserves the board.
- Automated WCAG scans on variant and completed-game screens report no violations.
- DESIGN.md lint has zero errors/warnings. The Premium static audit runs, but its
  case-insensitive JSX parser misidentifies capital Form providers as native
  forms and Button-asChild/Radix triggers as actionless buttons. The raw findings
  and source-by-source adjudication are preserved; no strict-pass claim is made.

Reports and screenshots: docs/screenshots/ion-*spatial*, ion-sync-qa.json,
ion-gestures-qa.json and ion-results-qa.json. Tests use isolated QA workspaces and
accounts; never existing user content. Real iPhone keyboard, pinch feel and
installation still warrant hardware testing. No native store build was requested.
