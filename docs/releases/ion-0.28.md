# ION 0.28

- Desktop users can enter a cloud and immediately type into its available add box. Touch devices do not open a keyboard automatically. Back and Forward restore the same ready-to-type behavior while explicit camera-restoration flows retain focus.
- Plain Left and Right navigate visited same-app pages, including from an empty composer. Existing text, IME, modal, slider, menu and chess-cell arrow behavior remains intact. Shift-Left/Right preserves horizontal viewport panning.
- Activity has exactly three words: Added, Spent and Balance. Positive/negative totals include all journal movements, not just earning. A live clock projects eligible, bounded pending earnings between server updates; only posted funds can be spent. Added and Spent retain filtered receipt history with pagination. No journal entries or pricing policies are changed.
- Every Time function and receipt field, saved-game words, notations, opponents and controls, and all eight variant actions, has an immutable functional identifier in the existing registry. Private functions are scoped to their dev account; ordinary accounts receive no IL fields. Existing public root labels and counter history remain unchanged.
- All six live variant pages include Online and Library. The eight action positions preserve a large flat board and full targets in portrait and short landscape layouts.

Canonical owners and behavioral changes are recorded in DESIGN.md and UX-CONTRACT.md. New tests cover desktop/touch focus, editing-safe keyboard shortcuts, live-clock bounds, immutable identifier coverage and responsive action geometry. The browser journey verifies cloud creation, Back/Forward, draft caret behavior, three running totals, spending and both variant links.

Verification: hosted TypeScript and all 45 helper spec files pass. The complete desktop/touch preview journey passes, including immediate typing, Back/Forward, draft caret preservation, a rising Activity clock, a real one-second transfer and both variant links. Regular-account API checks confirm balanced positive/negative totals and no leaked identifiers. The static premium audit retains only the existing React Form-provider false positive at login.tsx:45; the actual native form already uses noValidate.

IL coverage includes saved-game Notations, each move, Opponent(s), Share and permitted controls; existing root birth identifiers remain preferred. Desktop entry navigates immediately before moving typing focus, while touch devices retain the existing outgoing transition. The keyboard test waits for the destination heading before checking readiness, avoiding a stale composer from the previous route.

Small-screen action rows have a minimum 52px separation in board coordinates. SpatialViewport retains a saved camera only when its viewport/refit key still matches; a resized return fits the current board instead of restoring a stale wide-screen camera. Relevant layout and spatial lifecycle tests pass.

Final production journey passes at 390×844, 320×568 and 852×390, with all eight action bounds checked for overlap and no page overflow. Activity passes automated WCAG A/AA checks. Native Universal and Unconventional replies, undo, reset failure/retry and saved-slot resume also pass. Exact QA account IDs are archived after linked journal reversals; real user data, immutable journal records and old ILs are preserved.
