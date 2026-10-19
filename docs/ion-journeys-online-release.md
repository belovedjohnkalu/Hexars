# ION chess journeys — October 19, 2026

## Controls and navigation

Downward title swipes refresh the page in cloud, chess and account screens.
Vertical board swipes change the engine side only before the first move; after
play begins they rotate the view. Horizontal move-history gestures remain.
Every cell has its full hexagon hitbox. Last moves use dashed lavender inset
outlines, distinct from blue legal destinations. Balanced retained-slot layouts
now apply across current and future clouds; ION keeps its fixed home anchors.
Rules opens in two columns. Wellisch Reference IL025B1 says “identified here”,
with an underlined link to IL025A9. The chess cloud and chess favicon use a
generated king inside a glowing hexagon, matching Controls/Accounts photos.

## Permanent private History

History under Hexagonal Chess contains played years, months, days and individual
variant previews. Date grouping uses the device's timezone. Account membership
allows access from another device without exposing history to other accounts.
Signed-in new games attach immediately; a valid older local capability can be
attached on opening. Ownership of unrelated anonymous games is never inferred.
Non-dev accounts skip redundant single-child levels; dev accounts retain them.
Saved games no longer expire. The old cleanup helper is a no-op, and deployed
production schedules were verified empty. Previously deleted data is not recreated.

## Online

Email-authenticated accounts can randomly match by variant or choose Random.
Four-digit rooms support Create, variant choice, code copy and Join. Two seats
are needed normally, three in Wellisch. Waiting rooms expire after 15 minutes;
saved matches do not. Transactional locks prevent duplicate seats and double
matching. Join attempts are rate limited. Membership, turn and version checks
are server-side; online Undo and side switching are disabled. Private per-user
Floot Realtime channels carry change signals, with authoritative resync after
connect/reconnect. Match polling is absent. Leaving a waiting view cancels that
reservation. Rules round trips retain the exact game capability.

## Positional 0.1.0

The second native executable uses its own structure/coordination evaluation and
strategic beam search, with separate player utilities for Wellisch. It reuses
protocol serialization and authoritative rules, not Tactical's search code.
It is an initial implementation, not a measured strength milestone. The cloud
binary is fully static, 2,797,000 bytes, SHA256
`71ddf694c874a26ee780e3aa85a8e57b4f3ca3b01babc3e3bec7e3f9125ee15b`.
Engines 3–6 remain future work.

## Verification and deployment

Hosted typecheck clean; eight focused Jasmine suites passed. Native protocol
and Positional tests: 36 passed, including 24-ply legal-move sequences in every
variant. Cloud API tests cover concurrent Wellisch joins, seat authorization,
history privacy, random matching and the independently executed Positional bot.
Browser checks cover two visible Rules columns, the rule link, email gating,
engine side/rotation behavior, complete cell targets, history auto-skip and
refresh. Two browsers exchanged moves live after random matching and code join.
A February 2025 fixture remains accessible in the correct History date.

Production title refresh and game persistence passed. Production two-browser
random matching and four-digit code join passed. See screenshot/QA artifacts for preview and live flows.
DESIGN.md lint has zero errors/warnings. Raw strict audit has 22 findings: the
previous 20 reviewed JSX findings and two additional asChild Link detections;
the links were exercised in the browser. Raw strict is not claimed as a pass.

Published web-only at https://ion.floot.app, without a Floot badge. Checkpoint
`d6555b5b-bbf4-43d9-a4b8-e7dde7e96bdf`; successful job
`d34b7d9f-0099-41d4-af80-810b2a294f97`. No native store build was requested or used.

Verification cleanup removed 25 exact temporary .invalid test accounts and 22
recorded QA game IDs, including their own waiting rooms/memberships. No unrelated
accounts, clouds or saved games were modified.
