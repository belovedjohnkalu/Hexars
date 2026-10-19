# ION navigation and account refinement — October 19, 2026

FloatingBack is a shared 54px glass bubble with a white outline gradient, slightly
higher and farther right than the former footer arrow. The input keeps the whole
available footer width. Clouds, chess views and account forms share the control;
cloud/account visual-viewport handling keeps it above the keyboard. The redundant
top-right account shortcut is removed.

Title holds, context menus and Shift-F10 open Controls for the current cloud.
Moving cancels a hold; pulling down still refreshes. Cloud/title text suppresses
native selection and touch callouts. Duplicate retains the existing branch-copy
identity; the new Copy copies only readable label text, with a selectable fallback.

Signed-out Private renders a steady sign-in state without workspace requests or
session-reset loops. Signup accepts an optional nickname, never using the email
as its generated public name. Omitted nicknames receive a neutral Player name.
Remember is hidden once that account has a valid device association, including
saved dev overrides, without changing its permanent IL41 registration.

ION uses the shared organic layout. Occupied bounds are centered. Two-level
collections use gentler size contrast. Deleting a cloud clears retained footprints
and repacks/recenters survivors; returning normally retains the camera. Back follows
the immediate parent, suppresses forward auto-skipping on that entry, and waits
for parent data rather than briefly linking to Home. Single-child navigation runs
on entry, not after adding the first word. IL0510 gains Random room creation with
a server-selected variant from the existing allowlist.

At the user's request, the recoverable IL201 branch was restored in its existing
private workspace with its original identity and parent. No other personal cloud
records were modified.

Validation: 31 ordinary helper suites plus the workspace concurrency/Private hook
suite passed; hosted TypeScript clean. Browser checks cover stable signed-out
Private, nickname signup, bubble/composer geometry, title Controls, text Copy,
Remember omission, random rooms, centered non-overlapping Home, physical title
holds without selection, nested Back, deletion reflow and Undo. API checks verify
neutral nickname fallback and rejection of email-as-nickname. DESIGN.md lint has
zero errors/warnings; the static UI audit's one form finding is a false positive
on the Form wrapper (the actual HTML form declares noValidate).

## Reconcile drift

| Prior rule | Requested evolution | Resolution |
| --- | --- | --- |
| Fixed Home anchors | ION follows organic packing | Removed Home-specific anchors; center occupied bounds |
| Retain footprints on deletion | Pack as if removed cloud never existed | Reset layout generation and camera on deletion |
| Footer Back beside composer | Floating glass arrow above composer | Shared FloatingBack across touched routes |
| Back skips single-child ancestors | Back opens immediate parent | Explicit backward-entry state suppresses forward skipping |
