# Materialist and Unconventional — ION 0.25

Materialist 1.0.0 and Unconventional 1.0.0 are the fourth and fifth independent native engines. The existing Engines cloud now offers Tactical, Positional, Defensive, Materialist and Unconventional. Universal remains reserved. All five installed engines support the six playable variants and the existing six difficulty levels.

## Strategic differences

**Materialist** uses iterative MTD(f): repeated zero-window alpha-beta probes with a bounded transposition table. Its key includes repetition history and the halfmove clock, so draw-sensitive positions cannot share a board-only cache entry. Material balance dominates its evaluation. A small advancement tie-breaker and a simplification term favour preserving an advantage through exchanges. Bounded exchange search resolves captures, promotions and compulsory replies at the horizon. Friendly Wellisch king–rook swaps are quiet moves, not captures. Mandatory passes/promotions cannot use an impossible stand-pat option. In Wellisch, the root faces a conservative coalition of the other active players; actual turn order and army takeover are preserved.

**Unconventional** owns a PUCT tree and guided sampled rollouts rather than an alpha-beta implementation. Stable position-seeded novelty/development priors encourage less obvious moves, while exposed-material penalties and outcome checks restrain unsound exploration. Every actual player has a separate reward; a player maximizes its own reward when choosing a branch. Tree size, sampled depth, node work and elapsed time are bounded. A legal root mate with a full winning score takes priority over visit counts. Same-turn promotions, takeover and forced passes retain native semantics.

The two engines share only authoritative rules, serialization and the SearchResult ABI. Their main programs, search implementations, compiled binaries and identities are separate. There is no external AI provider or browser engine download. Searches run as native processes on Floot's cloud server.

These are strategic identities, not Elo ratings. Fixed search budgets and finite correctness simulations do not establish competitive strength. Unconventional's diagnostic depth is the deepest sampled action sequence, not a fully searched minimax horizon; its log-odds heuristic score is not directly comparable to another engine's material score.

## Product integration

The central engine allowlist covers URL parsing, API validation, session keys, result sheets and Opponent(s). New clouds append after Defensive, including the complete six-level ladder. Existing cloud IDs, IL arrival records, account namespaces, owner overrides and saved games remain intact. Amber and coral reuse the existing palette. No new routes, controls or motion effects were added.

An engine chosen from a board returns to that variant after selecting a level. Reset retains the selected engine and level. Resume slots stay separate per variant/engine/level. Pass and Play deselects the engine through the existing flow. The browser never supplies an executable path. Each immutable native asset is size/hash verified and its handshake must match the allowlisted identity. A fresh process validates stored state and each proposed move. Cancellation terminates that process; the existing watchdog and stale-version checks remain.

## Build and verification

Use npm run build:engines for all five executables; build:materialist and build:unconventional build individually. Append -- --cloud on Linux x64 to produce fully static hosted binaries. CMake/CTest builds both executables and their search tests. Windows build paths and MinGW runtime options are provided; Windows execution was not tested here.

The native verification includes:
- Complete shared-rule regressions across all six variants.
- Protocol checks for all installed independent engines, including identity/capability, malformed positions, stale state IDs, legal replies, time/node bounds and process cancellation.
- Published mate-in-one, safe queen capture, fractional stalemate, draws, tiny-budget fallback and Wellisch promotion/takeover/forced-pass positions.
- Complete self-play and games against seeded random play for each independent engine and variant.
- A separate exhaustive depth 1–3 Materialist oracle for both players, checking both the reported score and selected move.

Hosted verification includes every new engine/variant combination, every new engine/difficulty combination, native identity, legal replies, saved resume, undo, side choice and opening as White. Browser checks cover keyboard selection, five non-overlapping engine labels, two real replies, reset/undo, offline reset recovery, narrow/desktop screens and reduced motion. Preview iframes may deny browser storage; strict cross-engine local resume/reload is verified on the first-party published site. Guest test fixtures are removed only by their exact IDs, with a guard against account-owned rows.

Run:
    cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
    cmake --build build --parallel 2
    ctest --test-dir build --output-on-failure
    npm run test:manager
    npm run test:search

Production browser checks:
    ION_TEST_ENGINES=new NODE_PATH=<playwright node_modules> node tests/e2e/independent-engines.live.cjs

Hosted TypeScript and the 33 non-hook helper specs plus the modified game hook are checked separately on Floot. The premium static auditor still flags the existing login Form provider as a form; the actual HTML form already has noValidate. No new audit finding or design token was introduced.

Asset URLs, SHA-256 hashes and sizes are recorded in cloud/hosting.json and the server-only nativeEngineAssets helper. Production publication and final smoke-test results follow below.

## Verification results

All 13 CMake/CTest targets passed, including the Materialist oracle, both new searches and full shared-rule regressions. All 58 native/manager protocol tests passed; the new pair's 14 tests were rerun after the final compulsory-action change. Each new engine completed 12 native games covering self-play and seeded-random opponents in every variant. The regression also runs the prior Positional and Defensive games.

All 12 new engine/variant combinations and all 12 new engine/difficulty combinations passed hosted native checks. The final Materialist asset was rechecked in every variant. The hosted typecheck, all 33 non-hook helper specs and the game hook spec passed. Preview browser checks found no overlapping engine labels, no application runtime errors and no axe WCAG A/AA violations on the checked game screen, and verified real replies, Undo, engine switching and offline Reset recovery.

The production deployment uses checkpoint d2505f65-d50f-4bb7-9610-c2458680929a and publish job 98978640-e1f0-4c6f-9473-0728dafa0bf8. Final public-site results are recorded after publication.

## Published — 20 October 2026

Publication succeeded at https://ion.floot.app. The production browser test passed with Materialist and Unconventional making real moves, all five choices visible, keyboard selection, Undo, reset/reload, switching back to each engine's own saved game, offline reset recovery, narrow/desktop viewports and no application runtime errors. Separate production Wellisch checks completed a full round as the human Black army, verifying that both engine-controlled White and Gold turns ran in order. Both reported their correct 1.0.0 identities. Every exact anonymous fixture created for this release was removed, with account-owned rows excluded.
