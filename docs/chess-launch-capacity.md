# Chess launch capacity — ION 0.69

## Status

This release hardens the live Chess application. **It does not certify one million simultaneous visitors or a 10% return rate.** No million-user production load test, hosting quota increase, database resize, or store build has been performed. Current provider limits are not exposed by the Floot project tools. Cache headers must be checked on the published app; preview responses alone are not cache-hit evidence.

The production stack remains Floot-hosted React, native C++ rules/search, Floot Realtime and managed Postgres. Existing accounts, games, private content, permanent ILs, pricing and the append-only Time ledger remain authoritative. Migrations 052–057 add the schema and preserve assigned forum labels while separating forum IDs from workspace IDs.

## Changes that remove actual bottlenecks

- One realtime connection per document/account replaces independent feature connections. Account changes immediately retire the old grants; releasing a feature cannot disconnect another. Reconnect backoff can reach 60 seconds with jitter.
- Anonymous Home/Chess/Time reads share one identity-free bootstrap request within the document. A durable public read model amortizes canonical Home/Chess/price construction across server instances: 15 seconds of freshness, a 30-second refresh lease, stale reads while one on-demand job refreshes, and guarded invalidation after shared edits. A cold empty snapshot can briefly return a recoverable 503 while its first builder works. Account-specific requests remain private/no-store. The canonical cloud service and guest feature filter still own the public result. No identity, capability or private workspace enters the shared payload.
- Sign-in bursts queue one short event-triggered count batch. Clients patch known buyer observations and exact prices locally; they do not all refetch the whole catalog. Gameplay discovery reloads only when ownership or affordability changes.
- Size-only changes, fresh signed image URLs and clocks do not wake an app-wide refresh. Discussion room totals use 64 shards rather than a single write-hot total. Counts still come from actual public descendant characters.
- Session checks avoid needless writes. Rolling a live cookie no longer broadcasts a catalog change to every visitor. A 401 is not retried as if it were a temporary outage.
- Chess does not fetch Library on every page or inspect every remembered engine game before loading it. Game caches and Continue are account-scoped.
- Native-validated starting positions are persisted by variant/build, removing a process startup from repeated new games and short matchmaking transactions. Individual game state remains separate.
- Authoritative board views are persisted with their native build code. A repeated `get` avoids spawning C++ and omits the historical timeline. Moves and searches still validate in C++; cache data never grants permission.
- A per-game operation lease stops duplicate expensive searches before the existing versioned commit. Rules and search have separate durable admission pools. The default caps are 128 simultaneous rules operations and 32 searches, with 256/128 available slots. These are protective limits, not hardware reservations or throughput guarantees.
- Online reconnects use a read-only path. Named rooms use room/account locks, random matchmaking uses ordered variant-pool locks, and code uniqueness remains enforced by Postgres. Unrelated rooms do not share the old global lock. Realtime failures after a committed move/match cannot turn success into a reported failed write.
- Community uses indexed normalized topics/replies, five/four item keyset pages with microsecond precision, idempotent UUID writes and per-account throttles. Replies publish to their topic only, not an app-wide channel. Their lightweight count deltas update the open thread without a refetch per viewer. Topic and reply identity namespaces are distinct from workspace clouds, even if clients reuse UUIDs. No global mutual-presence roster exists. Moderation never publishes hidden bodies.
- Daily maintenance bounds expired throttle/attempt/session cleanup. It never deletes saved games, account content or ledger entries.

## The size of the target

Run `node tests/load/chess-capacity-model.mjs` to change the assumptions. For a million visitors arriving over one minute, with 10% playing, a move every ten seconds and half the moves requesting a computer search:

| Demand | Planning value, not a benchmark |
| --- | ---: |
| New visitors / realtime connections per second | 16,667 |
| Simultaneously open document connections | 1,000,000 |
| Moves per second | 10,000 |
| Computer searches per second | 5,000 |
| Search slots needed at an assumed one-second latency, before headroom | 5,000 |
| Existing monetary lease heartbeats per second if all visitors are signed in and eligible | 66,667 |

The default search cap deliberately falls below that assumed peak. Excess requests receive a recoverable busy response while the game remains saved. Increasing the dev cap does not create CPUs, database connections, WebSocket capacity or provider quota.

The Time earning lease still runs every 15 seconds by established product policy. Its transactional issuance/ledger path is a separate major launch constraint. Presence cannot replace proof of eligible earning. Do not silently disable earning, relax ledger integrity, credit offline time or claim it has been scaled by this Chess release.

## Required proof before announcing a million-user event

1. Obtain provider limits for request bursts, sustained requests, concurrent compute, database connections/IOPS, realtime connection admission, open connections, publish fan-out, storage bandwidth and spend controls. Reserve capacity against the measured visitor mix, not just daily user count.
2. Use a provisioned staging deployment with matching data volumes. Start the checked-in k6 guest scenario at 20 virtual visitors, then raise it in stages. Use a distributed load fleet for the final target; one laptop is not evidence of a million-client result. The script refuses the live ION domains.
3. Run authenticated stage journeys with disposable accounts: simultaneous sign-in, legal move → native search → versioned commit, duplicate retry, three-player matchmaking, reconnect, history review, topic/reply/report, and Time earning/settlement. The public script intentionally does not create a million billable accounts or games.
4. Record p50/p95/p99 latency, error and busy rates, native CPU/memory, queue/lease occupancy, database wait/lock/connection saturation, reconnect/token traffic and actual CDN hit rates. Test cold starts, bursts, sustained load, recovery and a long soak. Keep correctness and financial invariants at every stage.
5. Scale the constrained tier, repeat the same scenario, and retain the report. If native demand needs thousands of concurrent searches, provision and verify an independently autoscaled worker tier through the host rather than widening the current cap without resources.
6. Rehearse rollback with the named checkpoint. Additive columns/tables are compatible with the previous app. Do not reverse migrations by deleting accounts, games or ILs.

## Return usage and dev configuration

Chess → Community → Manage exposes New posts, seconds between posts, native admission limits, reporting and usage. Labels/guides/categories retain ordinary dev hold-to-edit and move behavior; Words contains the discussion action labels. Discussion options let devs pin, close, move, hide and restore a topic. Reports can be inspected and resolved.

Continue, a first-game guide, existing complete rules and diagrams, a daily lesson, following discussions and the existing Library provide useful returning journeys. Manage measures actual signed-in chess players returning on a later UTC day within seven days of first observed play. One aggregate row per account stores first/last day and the return flag; it records no device IDs, IPs or browsing histories. Measurement begins with this release and excludes reserved QA accounts. Cohorts are eligible only after seven days. A target of at least 10% requires observation and iteration; the interface cannot guarantee it.

## Small production observations

The same anonymous Board Games first-open journey on phone emulation fell from nine application API requests (including four realtime grants and two session checks) to four (one each: icon, session, realtime grant and public bootstrap). Both observations had zero uncaught browser exceptions. This is a request-count comparison, not a controlled Core Web Vitals benchmark.

A published six-read snapshot check returned one stale response followed by five shared-origin hits. Warm-hit request durations ranged from 182 to 272 ms. Every outer response still reported `Miss from cloudfront` and no Age header. Therefore this release claims reuse of the origin read model, **not proven CDN cache hits**. The refresh lease released successfully, as did the sign-in count batch after three concurrent disposable sign-ins.

Sixteen authoritative board reads, at concurrency four, preserved the same game version: observed p50 241 ms, p95 1,138 ms. Six concurrent search requests committed exactly one legal computer reply. These tiny correctness/latency checks are not a traffic or throughput certification. No load generator was aimed at the live app. The k6 staging script and planning model are included for the next measured capacity gate.
