# ION interaction contract
Visual identity: static/__dev/DESIGN.md. Runtime tokens: base.css.

## Canonical UI map
| Capability | Owner | Contract | Verification |
| --- | --- | --- | --- |
| Form | components/Form, Input, Button; CloudComposer | Add in current cloud; retain draft on failure | helper specs + browser creation |
| Scrollbar | base.css | Visible thin scrollbars, forced-colors fallback | browser computed style |
| Feedback | CloudExplorer status/error; existing SonnerToaster | Inline errors and Retry, polite success announcement | browser recovery |
| Navigation | CloudCanvas + CloudExplorer + React Router | Real links, URL cloud parameter, parent Back | browser navigation |
| Upload | CloudComposer + cloud endpoint + @floot/storage | Private, presigned direct PUT, 3 MB limit | endpoint and browser tests |

## Hierarchy and size
A node has one parent or none. Its descendants stay within that branch. Seed destinations cannot be parents of custom items. Add requires a valid existing parent, preventing cycles by construction. Font sizes normalize descendant counts among visible siblings to 0–100; ties and singletons get equal midrange size. Zero remains readable. Pictures use proportional visual size. No fixed nesting-depth limit; a workspace has a protective 1500-item limit.

## Persistence and privacy
Custom words and picture references live in ion_workspaces. A random per-browser capability lives in localStorage; the server stores its SHA-256 hash and validates it on every read, upload preparation and write. Credentials never appear in navigation URLs. No public workspace directory. Private image URLs expire and refresh on load/focus. There is no account sync or recovery after clearing browser storage in this first release. Existing chess share links retain their prior behavior.

## Creation and failure
Enter or Add saves one word/phrase or picture. Picture names default to the filename without its extension. IME Enter never submits while composing. Repeated requests with the same item ID create one node. CAS versions reject stale writes; reload and preserve the draft so retry can succeed. Avoid optimistic claims of saving. Pending actions prevent duplicate submit. Word drafts survive navigation and reload through sessionStorage. Selected pictures survive in-memory navigation; the browser warns before unloading a pending picture. Cancellation stops upload, keeps the selected picture and draft, and uses neutral feedback. Names can be corrected from the title menu. Removal is reversible: custom nodes and their descendants are marked as removed and retained for Undo; images are not deleted. Branch removal shows its contents and asks the app user to confirm. A leaf can be removed directly, with Undo immediately available. Undo last removal is also available in the title menu after reloading. Reparenting is not implemented.

## Destinations
Root starts with the Hexagonal Chess image. Its children are Engines, Rules and Boards. Engines contains only the implemented Tactical engine. Rules contains Gliński and McCooey. Boards opens the last-used variant in pass-and-play. The game menu changes variant or opponent. Preserve separate friendly and engine sessions. Game Back returns to the chess cloud.

## Accessibility
Use native link/button semantics through the existing kit. Entering a new cloud focuses its heading. Returning restores the originating item and saved scroll position. The visible title menu exposes ancestors and correction controls; there are no invisible tabbable breadcrumbs. Composer uses labeled fields, inline validation and an accessible upload button. Reduced motion disables zoom and delay. Device installation controls remain hidden when unavailable. Browser Back and direct cloud URLs work. Long labels wrap on the canvas; full labels remain accessible in link names.

## Chess decisions
Opponent and side choices use the shared RadioGroup keyboard model. Pass & play names the same-device mode explicitly. Restarting a game with moves requires a Keep playing / New game decision; the existing board stays until a new game is confirmed by the server. Share explains that anyone with the link can move pieces. Promotion remains open after a failed request. Modal close controls and focus restoration use the shared Dialog owner; dialogs fit the VisualViewport. A move finishes before pass-and-play rotates to the next side.
