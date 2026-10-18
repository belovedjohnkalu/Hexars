# ION 0.17 — Controls, dev accounts and photo collages

## Result

ION starts with five stable clouds: Hexagonal Chess, Public, Private, Controls and
Accounts. Controls and Accounts have matching original photo assets. A 300 ms
hold, right-click or Shift-F10 enters Controls; permitted action droplets open
Edit, Move, Copy, Delete, Copy IL or View photos. Pointer motion cancels a hold.
The release click cannot trigger a new action after navigation. Native callouts
and selection flashes are suppressed, and focus restoration avoids page jumps.
Camera and retained word anchors survive the round trip, scoped by account.

Explicit dev membership replaces the single-owner authorization check. The
existing configured owner is seeded without changing credentials. Only dev
accounts can customize ION, shared Chess, Controls and their own Accounts
workspace, including system functions. Ordinary admin role or client-supplied
flags do not confer this permission. Private data remains inaccessible to other
accounts, including devs. Home and Chess edits are public; Accounts edits are
private to the current account. Existing immutable ILs and never-reused counters
are preserved; Controls is IL3 and Accounts IL4. Copy IL is dev-only.

Accounts functions are clouds with nested remembered accounts and Open/Forget
actions. Explicit sign-in/create/recovery forms remain forms. A successful login
now also works when optional sessionStorage is unavailable; changing from signup
to signin keeps an explicit URL state. No passwords enter browser storage.

Select multiple pictures to create a collage. The existing 3 MB per-photo and
PNG/JPEG/WebP/GIF limits apply; there is no new arbitrary photo-count cap. Bytes
upload directly to storage with at most three simultaneous uploads. All images
are validated before one atomic metadata write. Retry retains the pending cloud
and completed photo identities. Private signed URLs are issued only after scoped
authorization; copying a collage preserves every photo. Full-screen viewing uses
the shared Dialog, pan/pinch camera and accessible previous/next controls.

Saved chess positions expire **30 days after the last persisted new game, move
or undo**. Reads and move review never renew this clock. Expired records are
excluded from saved-game operations, authorized access removes an expired row,
and daily 00:10 UTC cleanup physically deletes expired game rows. Clouds/photos
are unaffected. Expired explicit links offer New game; expired automatic resume
creates a fresh board.

Wellisch has a separate, tested three-player foundation. It remains unavailable
for play; see [scope and remaining work](variants/wellisch.md). The existing
Tactical 0.8.0 binary and its five supported variants are unchanged.

## Verification

- Native regression and eight CMake/CTest targets pass. The dedicated Wellisch
  suite checks 20,034 assertions. Existing random/Tactical complete games pass.
- All 25 protocol/manager tests pass.
- Floot typecheck, 20 default specs and explicit Controls/photo/retention/hook
  specs pass (the default runner caps at 20, so new specs run explicitly).
- Real sandbox API checks use two isolated temporary accounts. Verified dev vs
  admin authority, forged flags, system protection, account customization
  isolation, remembered-account security, direct multi-photo uploads, private
  photo isolation, public collage copying and rejection of disguised bytes.
- A saved-game fixture verifies reads preserve updated_at. At 31 days, an invalid
  capability cannot delete the record; authorized access returns 404 and removes it.
- The sandbox browser passes 300 ms hold and release suppression, dev IL copy,
  exact camera restoration after edit/delete/Undo, direct two-photo UI upload,
  loaded full-screen images with next/previous, simulated keyboard placement and
  responsive no-scroll layouts at 320/393/768/1280 px. Evidence is in
  docs/screenshots/ion-controls-preview-qa.json.

Physical-device installation and the first overnight scheduled execution cannot
be established by a headless browser. The deployment’s registered next cleanup
run is checked separately; this release does not spend a native app-store build.

## Live deployment

Published to https://ion.floot.app on 2026-10-18. Live browser checks pass for
five default Home clouds, automated WCAG checks, adding/remembering/switching
accounts, read-only ordinary system commands, cancel/confirm Forget, private
collage viewing, native move/deselect/undo, expired-link recovery and responsive
reduced-motion navigation. No browser runtime errors or automated WCAG violations
were recorded. One transient upstream connection failure during switching exposed
a raw parser message; retry succeeded, and the account client now replaces such
non-JSON responses with an actionable connection message (focused tests pass).

The published scheduler reports expireSavedGames enabled at 00:10 UTC daily; its
next registered run is 2026-10-19 00:10 UTC. This verifies deployment registration,
not a completed overnight invocation. The existing badge remains disabled and no
native store-build allowance was used. Live evidence: ion-controls-live-qa.json
and the Home/full-screen screenshots under docs/screenshots.
