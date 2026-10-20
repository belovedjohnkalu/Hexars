# ION architecture — 0.26

```text
Browser / installed home-screen web app
  React + TypeScript + SVG
  ↕ HTTPS + account-scoped Floot Realtime
Floot Node backend + Postgres
  ↕ versioned newline-delimited JSON over stdin/stdout
Six independently compiled C++ engines
  Tactical · Positional · Defensive
  Materialist · Unconventional · Universal
  → one authoritative shared rules library, six variant modules
```

The active application runs in `cloud/floot`. Every device uses the cloud API; no visitor needs a local engine manager. Floot provides hosting, authentication, Postgres and Realtime. The installable manifest provides a home-screen entry and standalone window; it does not provide an offline chess engine. GitHub preserves source/history independently of live operation. The retained Vite, local manager and migration directories are development or paused migration infrastructure, not the active hosting path.

## Rules, state and execution

C++ defines board cells, starting arrangements, legal moves, check, special rights, game results and serialization. Gliński, McCooey, Shafran, Brusky, De Vasa and three-player Wellisch are supported. A general `PlayerId` and turn order replace a Boolean side-to-move; boards use explicit valid-cell coordinates. Wellisch stores original army directions, controllers, promotion reserves and forced-pass state. Its takeover and same-turn promotion actions remain authoritative in the shared library.

Postgres stores full native state, moves, timeline, engine ID, level and an optimistic version. A proposal from any engine is applied through the same legal-move rules before persistence. Stale versions/request IDs are rejected. Saved games do not expire automatically. Authenticated game membership, online seats and read-only sharing have separate authorization; anonymous game capabilities remain high-entropy tokens whose hashes alone are stored. Public sharing does not expose a gameplay token.

The server selects an engine from a fixed ID allowlist, downloads its immutable static Linux/x64 asset, verifies byte size, SHA-256 and protocol identity, and spawns it without a shell or browser-supplied executable path. Each request uses an isolated native process. State lives in Postgres, not process memory. The bridge bounds native output and enforces cancellation and a six-second watchdog. Cancellation kills the child; there is no asynchronous native in-band stop claim. The six difficulty levels select bounded budgets, not rated Elo.

## Six independent searches

- Tactical: forcing lines, alpha-beta/quiescence and Wellisch MaxN.
- Positional: structure/coordination evaluation and full-width MaxN with a history-aware cache.
- Defensive: exposed material/king safety and paranoid alpha-beta.
- Materialist: memory-enhanced MTD(f) zero-window search and exchange-focused evaluation.
- Unconventional: PUCT tree search with guided sampled rollouts and separate player rewards.
- Universal: phase-adaptive principal variation search for two players and selective MaxN for three.

Each executable has its own `engines/engine-N/search.cpp`; shared protocol/search headers define an interface rather than a shared strategic implementation. See [Universal](universal-engine.md) and the individual release notes for search limitations. Strength has not been rated.

## Words, accounts and navigation

Public, account-private and dev-owned Chess/Home spaces use versioned Postgres workspaces. Shared and account-scoped Realtime channels trigger authorized resync. The server enforces write permissions, branch operations and the 1,024-child limit. Dev IL records and chronological allocations persist independently of deletion. Back follows visited same-app history; navigation always requires explicit activation, including single-child views.

CloudCanvas packs measured, non-overlapping labels and pictures. Labels wrap at eight whole words. The total Unicode character count in each branch, including descendant labels and rule notes, determines relative sibling sizing. SpatialViewport initially fits occupied bounds, then preserves pan/zoom through refresh. Document scrolling remains disabled. Shared CSS tokens, self-hosted Inter, dark dialogs, loading mark and reduced-motion behavior are maintained in [the design context](../cloud/floot/static/__dev/DESIGN.md).

Remembered accounts belong only to an HttpOnly trusted-device cookie and valid server session associations. Synced Accounts-page snapshots cannot import another device's remembered entries or descendants. Account switches are re-authorized against the current device. Passwords are never saved in browser storage. Public player names are unique case-insensitively and do not fall back to email. Private workspaces belong to the authenticated account alone.

## Routes and publication

The active routes are `/`, `/login`, and the six variant routes. The word/picture hierarchy lives in the URL's `cloud` and `space` parameters; saved views use the variant route. Library groups played games by date, then shows their final board positions. Shared and Received entries grant read-only inspection. Game identity, engine, level, history and return paths survive navigation.

Floot publishes the UI and backend at https://ion.floot.app. [Hosting metadata](../cloud/hosting.json) records deployed versions and immutable engine assets. Source and native CMake/CTest/protocol tests are stored in GitHub; Floot owns the published app and user data. The local WebSocket manager remains loopback-only and accepts only trusted executable IDs for development.
