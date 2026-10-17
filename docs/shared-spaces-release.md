# ION shared spaces — 2026-10-17

Live: https://ion.floot.app. The former hexars.floot.app address was released.
The ION SVG favicon and home-screen icon are published. Floot Pro branding is disabled.

Home has exactly Hexagonal Chess, Public and Private. Public is readable across
accounts and devices, including signed-out visitors. Posting requires sign-in;
authors may edit their own entries and the configured owner may moderate. Private
is authorized solely by the current account session. Only the exact configured
owner account can change shared Chess content. Existing personal content stays
private. Legacy named default overrides are preserved as ordinary private clouds.

Move/copy transfers between Public and Private include every descendant and
preserve pictures. Both workspace versions are checked in one transaction, and
operation IDs make retries idempotent. Publishing requires the concrete confirmation
sheet. Moving a public branch away does not retract copies already made by others.
Contributors cannot remove somebody else's descendants from a public branch.

The composer follows visualViewport height and offsetTop on resize and scroll.
Visible zoom controls and the title popup are removed; gesture, keyboard zoom and
scrollbars remain. Black sheets match the app; chess boards and previews are blue.
Rules have 19 illustrated paragraph clouds per variant. Tactical offers Beginner,
Easy, Medium, Hard and Expert before choosing Boards, with native search limits:

| Level | Time budget | Max depth | Node limit |
| --- | --- | --- | --- |
| Beginner | 80 ms | 1 | 250 |
| Easy | 200 ms | 2 | 1,800 |
| Medium | 750 ms | 3 | 30,000 |
| Hard | 1,500 ms | 4 | 100,000 |
| Expert | 3,000 ms | 5 | 300,000 |

These levels are not measured Elo ratings. Search may finish earlier.

Accounts can be remembered explicitly on a trusted device and switched from the
account page. A random HttpOnly/Secure/SameSite cookie identifies that device;
Postgres stores only its hash and valid session associations. No passwords are
saved in browser storage. Forget revokes quick switching; sign-out removes the
current remembered association. The account page has one Back action.

Verification completed:

- Floot TypeScript: clean; 9 default Jasmine spec files plus the useCloudSpace hook pass.
- 38 sandbox API assertions cover private isolation, shared read/write policy,
  legacy preservation, root protection, other authors' descendants, full-branch
  transfer/retry behavior, trusted-device switching/forgetting, and native searches
  at levels 1 and 5.
- Fourteen real-browser flows pass on the new domain, including independent-device
  realtime, scoped transfers, remembered accounts, keyboard viewport simulation,
  level routing, illustrated rules and 320/393/768/1280 layouts.
- Five additional browser checks verify keyboard/wheel zoom, scrolling, favicon,
  install metadata, owner-created chess UUID routing and reduced-motion behavior.
- A native seven-ply checkmate opens White Wins and preserves the completed board.
  Automated WCAG checks find zero violations on the variants and game surfaces.
- Design document lint: no errors or warnings. Temporary QA users and public words
  were removed after testing. All original non-QA rows were retained.

Evidence: tests/cloud/scopes.api.mjs; tests/e2e/scoped-spaces.live.cjs,
spatial-gestures.live.cjs and chess-results.live.cjs; docs/screenshots/ion-scoped-qa.json,
ion-gestures-qa.json and ion-results-qa.json. Legacy test entry points now forward
to the scoped-space contract instead of asserting the removed anonymous Home composer.

Physical iPhone keyboard behavior and installation are not automated by Chromium
viewport tests. The domain change requires signing in again; cloud-backed account
content remains saved. Browser-only anonymous capabilities from the old origin do
not automatically transfer to a new origin. This release does not add Shafran,
other engines, a service worker, or App Store binaries.
