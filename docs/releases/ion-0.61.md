# ION 0.61 — Tiles and directional navigation

## Authorized scope

The direct request authorizes every current droplet under IL0A0093, Navigation: immutable root acf760e3-b9d3-4e3a-9c0c-d10d030fcf4f. Its current children are Split screen (moved there, birth IL0A0092), Tiles and Top Title. The bounded snapshot contains 36 nodes including Navigation. Other To do branches remain pending.

## Split screens

Title swipes add a duplicate on the opposite edge: left/right produces a right/left screen, down/up produces an upper/lower screen. A sustained drag moves and snaps the current screen to an edge preview. Holding offers Split screen, Move screen, Close screen, Tiles and the existing cloud actions. Every drag operation has button alternatives. Screens retain their mounted route and draft when moved. A binary partition collapses the removed footprint. Closing the primary screen checks the survivor's picture drafts and transfers its current text draft before promotion. Existing photo drafts block unsafe closing or refreshing.

Desktop Up begins with left/right screens, including portrait desktops, and divides the focused screen thereafter. Down removes the newest view. Left/Right switches screen focus when divided; text editing, IME and board controls retain their keys. Inset white separators use the existing eased motion. Only the focus screen's touching long outer edges glow; an interior focus has no outside glow. Physical minimum geometry offers another tile when a further split would be unusable.

## Tiles

Composer right/left swipes revisit previous/next tiles; an upward swipe opens Tiles. The rhombus mosaic follows the user's drawing and represents horizontal/vertical screen stacks with varied footprints. Spatial packing is independent from revisit chronology, without overlap. The last visited tile has a thin glowing outline. Command/Control + arrows navigates spatially in four directions. The existing pan/zoom canvas, black Dialog, New tile and Done keep every tile reachable without document scrolling.

Ordinary navigation creates revisitable page tiles; each screen inside a split navigates independently. Account-scoped session state restores safe same-app layouts on refresh; invalid trees and external URLs are rejected. Registered frame origins/windows and nonce-protected checks reject unrelated messages. Secondary frames retain their original src while reporting internal navigation, preventing reloads. Hidden screens pause query focus, reconciliation and Time earning; the existing server lease still limits earnings to one account session. Embedded account changes invalidate the enclosing workspace. Screen-local visited history cannot replace the main page's Back/Forward cache.

## Top Title and workflow skill

One title tap opens the cloud's complete text, note and pictures without its droplets. Existing fitted reading pages keep long text reachable. Double-tap refreshes that screen; holding opens the screen menu and existing cloud controls. Native title buttons preserve semantic headings and keyboard access. Reduced motion and inverted themes reuse current tokens.

The repository now includes .agents/skills/sectioned-work/SKILL.md, invoked from AGENTS.md. It requires every authorized task to be completed and reported in named sections, through implementation, verification and publication when applicable. Section boundaries do not cause extra approval requests.

## Verification

All 100 helper suites passed in a full run, with targeted reruns after the final refinements. Hosted TypeScript is clean. Browser evidence is maintained in tests/e2e/ion-0.61.live.cjs and docs/verification/ion-0.61.json. The static premium audit has the same 38 previously reviewed findings and zero unresolved/new finding categories. Four existing polling notices and seven intentionally external ChatGPT endpoints remain. The published web app is https://ion.floot.app; no native-store build was requested or spent.

After the final browser run, Navigation and its 35 descendants were moved into active Completed. The branch was compared to the authorized 36-node snapshot under a row lock; all content and birth ILs remain unchanged. Home's refresh queue was drained through an authorized cloud load. Disposable account 158 was retired, its private test words removed, and its test earnings returned with an append-only correction. No real account's private data or Time was altered.
