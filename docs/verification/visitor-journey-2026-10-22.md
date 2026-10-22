# ION visitor verification — 22 October 2026

## Visitor story

A first-time visitor opens ION, explores Public and Chess, finds account access, understands the Private sign-in requirement, signs in or creates an account and returns to ION, plays a free Gliński game, recovers from interrupted requests, and can review Time prices without accidentally making a trade.

## Defects found and corrected

| Visitor problem | Resulting behavior | Verification |
| --- | --- | --- |
| Leaving Chess during a pending Library request could leave ION behind a permanent loader. | Disabling Library stops loading immediately; aborted/late responses cannot restore stale state. | Delayed-history browser journey and hook regression. |
| Library errors had no usable Retry, and account changes could retain an earlier undo/error. | Retry reloads Library in place; account-specific nodes, undo and errors are masked immediately on identity changes. | Browser error/retry case and account-transition/late-restore hook tests. |
| Receipt Retry refreshed unrelated queries. | Retry refetches the failed receipt itself and then shows its receipt fields. | Controlled 503/retry browser case, confirming a new receipt request. |
| A match starting before initial WebSocket subscription could strand the waiting screen. | First connection, reconnect and foreground reconcile the room; a visible waiting room also checks every five seconds. Checks serialize, time out and stop on exit or match start. | Delayed-socket and missed-event browser fixtures. |
| A transient saved-room error could silently create another match. | Only a missing/cancelled room can fall back to matchmaking. Transient errors retain the requested room and Retry initializes it in place. | Saved-room 503/retry fixture, with zero find/create requests. |
| Phone text targets measured only about 25–30px high. | Coarse-pointer canvases reserve 56px boxes with a minimum 0.8 opening fit, yielding at least 44.8px opening targets. Fonts and relative sizes are unchanged; panning and manual overview remain available. | Measured phone journey, packing and camera tests. |
| Back overlapped part of Board Reset on phone. | Offline games place Back in the empty footer; online retains clearance above chat. | Board button/bubble intersection assertion. |
| A missing page kept the title Opening. | Settled missing pages say Not found and provide Back. | Invalid-link browser check. |

## Evidence boundaries

- Live, anonymous checks: home, Public, Private sign-in gate, Accounts, Chess, Boards, Rules and Engines; both `iontech.info` and `www.iontech.info`; native C++ Gliński movement and Undo; failed-save rollback and recovery; dev-only Prompts API privacy.
- Controlled browser checks use fake account/catalog/receipt/lobby responses: successful sign-in/sign-up navigation, Remember on/off/failure, invalid-credential retry, Library account-state/recovery, purchase quote failure and retry, receipts, and matchmaking interruption/reconnection. These checks create no real accounts, purchases, matches with visitors, or Time journal entries.
- Native anonymous game checks create isolated unlisted game positions. They do not edit customer games or add account memberships.
- Hosted checks cover history cancellation/account boundaries, camera lifecycle, collision-free layout, game hook state, functional gates, dev privacy, Time presentation, board layout, split pages and visited-page navigation. TypeScript and design lint are clean.
- The existing strict static UX audit still reports 32 known Button-asChild/Form-provider false positives, with no unresolved canonical owner. It is not counted as a passing check.
- A read-only production backend error search found no ERROR events in the preceding hour at the start of the audit. Expected anonymous authentication 401 responses are distinct from runtime exceptions.

## Limits

This is a browser and failure-recovery verification milestone, not a claim that every production path has been proven. Actual signup/email delivery, password recovery delivery, a two-person match using real accounts, and physical iPhone/Safari installation were not exercised here. No financial balances, approved estimates, entitlements or permanent ILs were changed. Native chess-rule completeness and playing strength were not re-audited.

## Post-publication evidence
0.38 published successfully (checkpoint 2822c7ec-9754-45d7-840e-16828e527492, publish job 4236a563-9e25-4737-b708-b13bbeec37e4). Eleven targeted hosted suites passed, including the additional saved-room in-place retry integration. All three public URLs returned 200 from an independent cloud machine while the workspace Floot tunnel was failing. An independent production API journey verified 91-cell Gliński creation, legal move, illegal-move rejection without version change, review, Undo and a real Universal C++ opening move. Read-only Postgres inspection confirmed persisted game/version; signed-in pricing population remained four. These checks do not imply that the blocked full live-browser suite passed.

The workspace network recovered during 0.39 verification. The full anonymous production visitor browser script then passed: navigation, all-cell hitboxes, phone target geometry, Back/Reset clearance, legal move, deselection, reload persistence, Undo, failed-move recovery and missing page, with zero uncaught app errors. This supersedes the earlier network blockage for that journey only; physical Safari, actual email and multi-person/account financial journeys remain unverified.
