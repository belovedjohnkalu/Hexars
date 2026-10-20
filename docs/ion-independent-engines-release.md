# Positional and Defensive — ION 0.24

The live Floot app adds Defensive and upgrades Positional from the initial 0.1 beam-search prototype to 1.0. Open Hexagonal Chess → Engines → Positional or Defensive → a level → a variant. Opening Engines from a board returns to that variant after choosing a level. All three installed engines support Gliński, McCooey, Shafran, Brusky, De Vasa and three-player Wellisch.

## Independent decisions, shared rules

- **Positional 1.0.0**: full-width iterative MaxN, strategic ordering, a bounded transposition table keyed by board, halfmove clock and repetition history. Evaluation considers material, centralization, nearby coordination, pawn support/isolation, open rook files and king activity/shelter. Each actual player maximizes its own relative utility. Mandatory same-turn Wellisch promotions and eliminated armies do not assume alternating white/black turns.
- **Defensive 1.0.0**: independent threat-first alpha-beta with a paranoid multiplayer model. Other active players form an adversarial coalition against the root player. Evaluation discounts attacked material and exposed king-ring cells, and rewards shelter. Full legal move coverage and iterative deepening retain the last completed result on interruption.
- **Tactical 0.9.0** retains its forcing-move ordering, alpha-beta/quiescence and Wellisch MaxN implementation.

These are three separate executables with separate search/evaluation sources. Serialization, authoritative variant rules and the SearchResult ABI are shared. The existing `engine_one` C++ namespace names that ABI; it does not merge the independent algorithms. Engines 4–6 remain reserved. Strength and Elo have not been rated, and budgets do not imply an exact linear difference in playing strength.

## Cloud execution and saves

The fixed server-only asset allowlist stores version, size and SHA-256 per executable. Downloads verify all three before execution, and the handshake must match the selected identity. Requests never accept an executable path. Each request starts an isolated native process, restores authoritative Postgres state, checks request/state IDs and validates the proposed move through C++ before saving it. Abort kills that process; a watchdog bounds failure. The native line protocol remains synchronous: cancellation is owned by the spawning manager rather than an asynchronous in-band `stop` command.

The six existing time/node/depth budgets apply to every engine. Pre-Beginner additionally retains the existing 50% random legal choice. Engine IDs persist with game rows, result labels, Opponent(s), saved views and Rules/Engines return links. Local resume slots are distinct per variant, engine and difficulty, with legacy Tactical migration fallback. Reset of a linked game retains its saved engine and level. No existing games, ILs or cloud overrides are reset. Defensive's system clouds append after Positional's.

Short portrait game worlds now include full action hit targets. Pointer focus no longer recenters the spatial camera before a tap can finish; keyboard focus still reveals out-of-view controls. Existing black/Inter/blue-board visuals, explicit cloud navigation and visited-page Back remain.

## Reproduce

```sh
npm run build:engines
npm run test:manager
npm run test:search
npm run test:native
# Linux x64 immutable release binaries:
npm run build:positional -- --cloud
npm run build:defensive -- --cloud
# Or CMake/CTest:
cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --parallel 2
ctest --test-dir build --output-on-failure
```

Windows scripts use MSYS2 UCRT64 if present, or HEXCHESS_CXX. Windows execution remains unverified in this Linux workspace. The diagnostic loopback WebSocket foundation is retained, not used for hosted gameplay.

## Verification

- All ten CMake/CTest targets and native variant regression suites passed, including published checkmates, pawn rights, promotion, castling, en passant, takeover, three-player outcomes and complete games.
- All 44 manager/native protocol tests passed: each new engine played 24 legal plies per variant, rejected stale/malformed requests, respected budgets and exited/cancelled cleanly.
- Both new engines found the published Gliński mate-in-one, stopped after checkmate/fractional stalemate/automatic draws, handled mandatory Wellisch same-turn promotion and returned legal one-node fallback moves.
- The final direct search run completed 24 games: self-play and versus seeded random for each engine/variant, totaling 4,465 validated moves. This is correctness coverage, not a strength benchmark.
- Twelve hosted engine/variant combinations passed real native identity, legal reply, stale-version conflict, saved resume, undo and pre-move side selection. Only exact anonymous test rows were removed afterward.
- Hosted TypeScript and all 33 non-hook helper specs passed, plus the modified useCloudGame hook spec. Narrow/desktop browser checks exercised engine/level/board navigation, a real Defensive reply, Undo, switching to Positional and reduced motion; no app runtime errors, horizontal overflow or WCAG A/AA axe violations were found on the checked game screen.
- The premium static audit's single existing finding is a false positive on the React Hook Form provider `<Form {...form}>` in login; its actual HTML form already declares noValidate. No UI tokens were changed.

Immutable binaries and hashes are recorded in cloud/hosting.json and helpers/nativeEngineAssets.tsx. Production publication and the final GitHub commit are recorded with this release's deployment.

Reusable production browser check: `NODE_PATH=<playwright node_modules> node tests/e2e/independent-engines.live.cjs`. Set ION_TEST_ORIGIN only for another authorized deployment. It prints exact anonymous fixture IDs; remove only those IDs after verification.

## Published verification — 20 October 2026

Floot publication 17d7b88b-e273-42b0-a3f2-af5572c83384 succeeded at https://ion.floot.app (checkpoint 6ccd8d45-f863-45bf-a9b8-822e9b0ea394). The reusable production browser test passed: three engine choices, six levels, keyboard selection, real replies from Defensive and Positional, Undo, engine switching, Reset, narrow/desktop viewports and no app runtime errors. Live Wellisch Medium requests independently confirmed Positional 1.0.0 (completed depth 2, 750 ms) and Defensive 1.0.0 (completed depth 3, 310 ms). All exact anonymous production and preview fixtures were removed without touching account-owned games.
