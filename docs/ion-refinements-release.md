# ION colors and fitted pages — 2026-10-17

Published: https://ion.floot.app. Source: cloud/floot. GitHub remains the source backup.

Private has an authored horizontal color wheel with eight shared colors. It supports
swipe, wheel, direct choice and keyboard navigation. The selected color is saved
on the node, follows copy/move transfers and appears on other devices. Default
clouds use the same pastel tokens. The black ION favicon/PWA image has no outer rim;
the SVG favicon URL is versioned to invalidate the earlier browser cache.

Home retains three fixed anchors, reserves header/image footprints, waits for initial
font/data/viewport readiness and avoids placement/font transition on startup. Top-left
shortcuts open the current Private/Public/Chess root. Scrolling is disabled in the
app; word spaces use a transform camera. Rules, destinations and accounts use fitted
text/pages so content stays reachable. Rule lists show words; images appear only
inside the selected paragraph. Password recovery uses compact email, code and
password steps. Native file pickers/browser UI remain OS-owned.

Tactical adds Pre-Beginner as level 0: 40 ms, depth 1 and 125 nodes, exactly half
Beginner's time/node budgets. Half its selections use a uniform random legal move;
all are applied and validated by C++. Strength is not a measured Elo ratio. Pass and
Play clears engine selection and opens the saved friend game. Engine and friend
slots remain separate. Rules/Back preserve the incoming mode and difficulty; explicit
saved-game links retain their authoritative game settings.

Deletion Undo expires at removedAt + 10 seconds, including after reload. The server
allows exactly 1,024 visible immediate children per cloud, without a lower or global
workspace limit. Capacity is checked for add/copy/move/restore and atomic Public ↔
Private transfers; stale writes cannot exceed it. Existing contents are not truncated.

The initial live signup probe succeeded, so the reported error was not reproduced
for a fresh account. The new UI makes Create account a distinct URL/form state,
never falls back to login, and normalizes email case/outer spaces consistently at
both client and server boundaries. Existing-account registration directs users to
sign in or recover their password; it never replaces a reserved owner's password.
A real browser verifies signup sends only registration and receives a valid session.

Verification:

- Floot TypeScript is clean; 10 default Jasmine files plus useCloudSpace hook pass.
- 22 API assertions: email normalization/duplicate handling/login, exact capacity,
  nested capacity, copy/move/restore/transfer overflow, transaction rollback, saved
  colors and level-zero legal native play.
- 11 live refinement flows: real signup, keyboard color selection, cross-device
  color persistence, scope navigation, deadline Undo, stable Home, rule opening,
  complete fitted text, six levels and Pass and Play. Rules axe: zero violations.
- Six compact/no-scroll checks: narrow phones/tablet, simulated keyboard, composer
  width, paged destinations, landscape rules and password recovery/expired code.
  Recovery endpoints were mocked; no test emails were sent or real passwords changed.
- Five state checks: friend/level-zero return navigation, explicit saved-game settings, color swipe and composer
  axe (zero violations). Five gesture/metadata/reduced-motion checks pass.
- A native seven-ply checkmate opens White Wins, preserves the final board and passes
  game axe with zero violations. Design-document lint has no errors or warnings.
- A read-only Home test verifies the clouds wait for keyboard/viewport settlement and then retain fixed anchors.
- Import closure, syntax checks and whitespace checks pass. The Premium static audit
  runner was unavailable after the skill-provider update; older audit artifacts are
  historical, and this release does not claim a fresh strict-audit pass.

Evidence lives in tests/cloud/refinements.api.mjs, tests/e2e/ion-refinements.live.cjs,
ion-no-scroll.live.cjs, ion-state.live.cjs, spatial-gestures.live.cjs and
chess-results.live.cjs, with reports/screenshots in docs/screenshots. Temporary QA accounts and public words were removed after verification.
Physical iPhone keyboard behavior and installation have not been verified on hardware.
