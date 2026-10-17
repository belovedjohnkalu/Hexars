# ION interaction contract
Visual identity: DESIGN.md. Runtime tokens: base.css.

## Canonical UI Map
| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
| --- | --- | --- | --- | --- |
| Form | Form, Input, Button | endpoint schemas | Composer and account form | Jasmine + live browser |
| Scrollbar | base.css, SpatialViewport | base.css tokens | Two-axis canvas, native article scroll | browser wheel/drag |
| Toast | CloudExplorer status and inline error | useCloudSpace mutation state | Polite saved/Undo, persistent Retry | offline browser test |
| CRUD | CloudActions, ContextMenu, Dialog | cloud endpoint, cloudChanges, cloudPolicy | Edit, move, copy, soft delete/restore | unit + API + browser |

## Spaces and authority
Home contains exactly Hexagonal Chess, Public and Private; it has no composer. Public and Chess are globally readable, including signed-out visitors. Posting in Public requires sign-in; authors edit their own entries, and the configured owner can moderate. A branch containing somebody else's contribution cannot be moved or deleted by a non-owner. Private always requires an authenticated session and resolves only that account's workspace; supplied IDs or legacy capabilities never confer another account's access. Only the exact user ID in ion_shared_spaces.owner_user_id can change Chess; an admin role alone is insufficient. The three space roots are immutable. Home counts do not reveal another account's private content.

Every confirmed word/picture is server-persisted. No fixed item-count or nesting cap. Names remain 1–80 characters; pictures PNG/JPEG/WebP/GIF up to 3 MB. Picture upload keys include workspace and author IDs. Private signed image URLs are returned only after scoped authorization. Old guest content can be explicitly joined to its first signed-in owner, remains Private, and is never automatically published. Shared realtime grants are exact public/chess channels; private grants contain only the authenticated user's channel. Focus/reconnect reconciles authoritative state. Account changes discard old response/cache state.

## Hierarchy and correction
One parent per node. Count all descendants; compare visible siblings only. Ties share equal sizes and zero stays readable. Backend rejects moves/copies to self or descendants, missing/removed parents, stale writes, and identity collisions. Public ↔ Private transfer locks both workspaces, checks both versions, remaps the entire subtree and records an idempotent operation. Copy preserves the source; move removes its old placement. Publishing confirmation explicitly says everything inside becomes public. Copies already made by others remain after a public source is moved away. Shared pictures remain attached to copied branches. Soft deletion within a space retains images; Undo survives reload. Confirm before removing a branch; focus Keep cloud. Text drafts are scoped by account/space/cloud; picture drafts remain in memory with an unload guard. Retry retains input and IDs.

## Navigation and camera
The URL's cloud and space parameters own hierarchy. SpatialViewport owns scrolling, drag panning, pinch, modified-wheel and keyboard zoom. Native scrollbars remain operable. There are no visible zoom controls. Camera is remembered per cloud. Background drags must not activate words; holding/right-click/keyboard context-menu opens permitted actions. The title is plain text and opens no popup. Back is bottom left and restores the originating word. Entering a cloud focuses its heading. The compact composer follows visualViewport height and offsetTop on resize AND scroll, immediately above the phone keyboard. Keyboard resize preserves canvas placement. Inter stays readable; reduced motion removes transitions.

## Destinations
Hexagonal Chess → Engines, Rules, Boards. Boards contains Gliński’s Variant and McCooey’s Variant with native blue starting-position previews. Each variant under Rules contains a separate illustrated cloud for every paragraph, with no Complete Rules wrapper. Tactical opens Beginner, Easy, Medium, Hard, Expert before Boards or the incoming variant. Selection persists and changes native time/depth/node limits, not just a label. Games retain separate engine and pass-and-play slots. Never imply unimplemented variants or engines are available.

## Accounts
The account page has one Back action; no redundant Open your space. Remembering an account is explicit. Only a random HttpOnly/Secure/SameSite device cookie is kept in the browser; its hash and valid session associations are in Postgres. No passwords or session tokens in localStorage. Add account preserves the current remembered account; switching requires a valid device association and issues a fresh session. Forget removes quick access; sign-out removes the current association. Expired/revoked sessions cannot switch. A new domain requires signing in again; cloud-backed private content persists.

## Chess
Only the interactive board and Variants, Rules, Engines, Board Reset, Undo occupy the game void. Blue cells stay flat against the black app. Current turn is a quiet status. Reset with played moves requires Keep playing / Reset board. Swipe right reviews one earlier move; swipe left advances one newer move. Historical requests inspect the saved native timeline and never mutate it. History disables play and offers Present plus accessible previous/next controls. Promotion stays open after a failed request. Piece movement completes before pass-and-play rotation. Result Dialog opens once per ended position: You Win / Tactical Wins or side winner, Stalemate, Draw, with score and View board / Play again. All sheets use black surfaces.

## Accessibility and recovery
Shared-kit semantics, visible focus, keyboard menu access, trapped modal focus, 44px principal controls and readable contrast. Account forms include Forgotten password; no app-owned alert/confirm/prompt. Errors preserve content and offer Retry. Spinner has a stable footprint; no hexagonal loader. Install controls stay hidden when incompatible. No sign-in required just to play chess. Tests: helpers/cloudScopes.spec.tsx, tests/cloud/scopes.api.mjs, tests/e2e/scoped-spaces.live.cjs and chess-results.live.cjs.
