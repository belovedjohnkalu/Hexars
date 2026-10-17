# ION interaction contract
Visual identity: DESIGN.md. Runtime tokens: base.css.

## Canonical UI Map
| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
| --- | --- | --- | --- | --- |
| Form | Form, Input, Button | endpoint schemas | Composer and account form | Jasmine + live browser |
| Scrollbar | base.css, SpatialViewport | base.css tokens | Two-axis canvas, native article scroll | browser wheel/drag |
| Toast | CloudExplorer status and inline error | useCloudSpace mutation state | Polite saved/Undo, persistent Retry | offline browser test |
| CRUD | CloudActions, ContextMenu, Dialog | cloud endpoint, cloudChanges | Edit, move, copy, soft delete/restore | unit + API + browser |

## Storage and accounts
No fixed item-count or nesting cap. Names remain 1–80 characters; pictures PNG/JPEG/WebP/GIF up to 3 MB. Every confirmed add is server-persisted. Anonymous access uses a per-browser random capability with only its hash in the database. Sign-in explicitly brings that browser’s words into the account’s private space. Other signed-in devices resolve the same account workspace through the server session; client account IDs confer no access. Old anonymous capabilities cannot read a claimed workspace. Cross-device refresh uses private Floot realtime notifications; focus/reconnect reconciles authoritative state. No public/global word sharing. Sign-out clears local identity; clearing browser data cannot remove the signed-in account’s server content.

## Hierarchy and correction
One parent per node. Default navigation entries can be edited, moved, copied and reversibly deleted through the same actions. Sparse per-workspace overrides retain changes without freezing untouched defaults. Count all descendants; compare visible siblings only. Ties share equal sizes and zero stays readable. Backend rejects moves/copies to self or descendants, missing/removed parents, stale writes, and identity collisions. Copy remaps the entire subtree to new IDs while preserving owned pictures; operation IDs prevent duplicate copies. Removal marks nodes and retains images; Undo survives reload. Confirm before removing a branch; focus Keep cloud. Save drafts on navigation; text survives tab reload, picture bytes remain in memory with an unload guard. Retry retains input and IDs.

## Navigation and camera
The URL’s cloud parameter owns hierarchy. SpatialViewport owns scrolling, drag panning, pinch, modified-wheel and visible-button zoom. Native scrollbars remain operable. Camera is remembered per cloud. Background drags must not activate words; holding opens the canonical context menu. Title menu exposes equivalent keyboard actions. Back is bottom left and restores the originating word. Entering a cloud focuses its heading. Inter stays readable; reduced motion removes transitions.

## Destinations
Hexagonal Chess → Engines, Rules, Boards. Boards contains Gliński’s Variant and McCooey’s Variant with native starting-position previews. Rules contains those variants; each contains Complete rules, including applicable app house rules. Tactical is the sole engine; selecting it saves the choice and goes to Boards or the incoming variant. Games retain separate engine and pass-and-play slots. Never imply unimplemented variants or engines are available.

## Chess
Only the interactive board and Variants, Rules, Engines, Board Reset, Undo occupy the game void. Current turn is a quiet status. Reset with played moves requires Keep playing / Reset board. Swipe right reviews one earlier move; swipe left advances one newer move. Historical requests inspect the saved native timeline and never mutate it. History disables play and offers Present plus accessible previous/next controls. Promotion stays open after a failed request. Piece movement completes before pass-and-play rotation. Result Dialog opens once per ended position: You Win / Tactical Wins or side winner, Stalemate, Draw, with score and View board / Play again.

## Accessibility and recovery
Shared-kit semantics, visible focus, keyboard menu access, trapped modal focus, 44px principal controls and readable contrast. Account forms include Forgotten password; no app-owned alert/confirm/prompt. Errors preserve content and offer Retry. Spinner has a stable footprint; no hexagonal loader. Install controls stay hidden when incompatible. No sign-in required just to play chess.
