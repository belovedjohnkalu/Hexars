# ION 0.71 — Functionality

## Cloud gestures and navigation

The directly requested Functionality branch contained fourteen active top-level
requests and their nested details. Editable words now open the canonical footer
editor on double-tap, without visiting Controls. Pictures retain double-tap
full-screen viewing. Holding, right-clicking and Ctrl/Cmd-clicking use the same
Controls flow. Partial text redirects retain these gesture owners. F2 is also
available for keyboard editing.

Dragging an editable cloud beyond the movement threshold cancels its hold action.
Dropping it onto a valid cloud commits an authoritative move and preserves its
identity. Invalid targets, self/descendant destinations, cancellation and failed
saves restore the original presentation. Organic and tiled views share this
behavior. Controls → Move remains a non-drag alternative.

Floating Up ascends the actual hierarchy; Down returns to its last opened direct
droplet, scoped to the account and pane. Keyboard visited-page history remains
separate. Ctrl/Cmd-Left or Right creates a new Sky, retaining the previous draft
and focusing the new composer where permitted. Ctrl/Cmd-Enter publishes and
enters only the server-confirmed cloud. Skies displays + with a New Sky
accessible name. Existing dev-customized labels remain authoritative.

## Words, pictures and audio

The footer editor uses the canonical keyboard-aware composer, with words in the
input, media above it and the color wheel always present. It can retain/remove
selected existing media and append verified uploads. Cancel/Escape asks before
discarding changed content; reload consumes an already-handled edit route.
Errors preserve the draft; stale/account-switched saves cannot overwrite newer
content. Existing notes remain unchanged; editing introduces no extra note field.
Saved-media pages keep Save reachable on short screens.

Picture-only clouds save without text or filename captions. Original dimensions
are stored for new pictures; legacy pictures acquire their natural proportions
after decoding. Organic and tiled packing reserve the correct footprint. Audio
entry appears when the remaining allowance can accommodate its 500,000-word
cost, with existing signature, size and account-ownership checks. The microphone
icon selects an audio file; this release does not add microphone recording.

New identical nonempty direct sibling names are rejected atomically after Unicode
normalization and trimming. Different parents may reuse names; historical
duplicates remain readable/editable without a forced rename. Multiple unlabeled
media clouds remain possible. Add, edit, copy, move, restore and cross-scope
transfers share the server guard; concurrent creation cannot bypass it.

## Appearance

Light remains the default. The existing horizontal color wheel uses the same
vivid, contrast-adjusted spectrum as rendered words in each theme. Manual colors,
touch focus and hold-to-white remain supported. Chess and checkers share indigo
cell colors, with separate semantic legal, capture, check, selection and dashed
last-move outlines. Native piece rendering, full-cell targets, rules and position
authority are unchanged.

## Verification and publication

Live at **https://ion.floot.app**. All 137 helper suites passed, including explicit
hook suites; the final focused rerun passed after a small edit-source correction.
Hosted TypeScript is clean. Twenty-five published checks passed: six API, eight
browser-flow, two actual pointer-drag, six live/saved-game-layout and three final
build checks. They cover concurrency, stale saves, author/dev permissions, media
retention, audio allowance, portrait decoding, touch editing, Ctrl/Cmd controls,
hierarchy shortcuts, cancellation/reload and phone/short-landscape/desktop layouts.
The native puzzle-bank drift guard also passed for 512 positions and 897 accepted
continuations; no rules or search binaries changed.

Official DESIGN.md lint reported zero errors/warnings. The configured strict
design audit retains the same 44 reviewed regex findings, with zero unresolved
canonical owners and no new findings. It exits 1; it is not a clean strict pass.
Phone checks used browser emulation, not a physical iPhone keyboard. No native
store build, service worker, database migration or load certification is included.

After successful publication, the unchanged Functionality folder moved into
active Completed. Its 24-node snapshot, including the existing deleted request,
was checked under a workspace row lock. Only the folder's parent changed. Its
birth IL and every nested identity/content/tombstone were retained; unrelated
Home changes and other pending prompts were preserved. No removed request was
revived. Shared Home and Chess refresh queues drained successfully.

Disposable accounts 171–173 are retired: server/credential sessions expired,
passwords/device links and the temporary dev grant removed, own private fixtures
cleared, game memberships hidden and the test Safari word soft-deleted. Four
private test assets were deleted. No QA wallet, grant, purchase or monetary
transaction was created. Permanent users, identifiers and ledger history remain.

The observed agent interval closed once at 2026-10-27T22:09:12Z, after 2,718
seconds. This records elapsed agent implementation work, not independently
verified human labour. Subsequent release bookkeeping is excluded.
