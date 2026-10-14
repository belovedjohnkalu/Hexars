# Architecture · cloud edition

```text
Desktop browser / phone home-screen app
    React + TypeScript + SVG
    ↕ HTTPS game API, correlated mutations
Cloud Node backend + Postgres saved games
    ↕ versioned newline-delimited JSON over stdin/stdout
Native Tactical 0.6 process
    → shared authoritative C++ Gliński rules
    → independent Engine 1 search/evaluation
```

The user selected cloud-server engine execution. Every device uses the hosted API; the local diagnostic manager is no longer part of the production game path. An installable manifest provides a home-screen icon and standalone window. No custom service worker or offline chess engine is included.

## Authoritative game state

C++ defines the board cells, notation, starting position, occupants, active player, move history, rights, legal moves, checks and results. React receives cells and legal moves and only renders/selects them. The website does not reproduce chess legality.

A general `PlayerId` and `turnOrder` replace Boolean white-to-move state. Boards use explicit valid coordinates. The current Gliński module and its serializer intentionally validate two players and 91 occupants; new variant serializers/rules are required before other shapes or Wellisch can run.

Cloud Postgres stores full native state, a timeline for undo, played moves, search diagnostics and an optimistic version. Guest credentials contain a random game ID and a high-entropy token; only a SHA-256 token hash is persisted server-side. The fragment in a copied game link stays outside HTTP URLs. The backend receives the token in the request body. Anyone holding it can act on the game; player-specific authentication is pending.

Version checks reject concurrent stale mutations. The frontend reloads conflicts and polls every 15 seconds to synchronize shared devices. A new game preserves earlier saved games; use their links to reopen them. Persistence has no account-based game library yet.

## Native execution boundary

The backend downloads one fixed, fully static Linux/x64 binary asset, verifies its size and SHA-256, and executes it without a shell or client-supplied path. Cached binary files are immutable infrastructure; authoritative game state lives in Postgres, not process memory or temporary files.

Each HTTP action loads the persisted state into an isolated C++ process. Human moves pass through `applyMove` with legal-move checking. Search returns a proposed move that is passed through that same authoritative rules API before persistence. The bridge correlates native request and state IDs, limits output, enforces a six-second watchdog, and kills the child on cancellation. Search itself has a 750 ms budget, depth 3 cap, and 30,000-node budget. All work is awaited before the server response completes.

There is currently no native asynchronous `stop` command. Server cancellation terminates the per-request process. Automatic persistent engine restart, arena orchestration, transposition tables, stronger evaluation, and rated strength testing remain future work.

## Six engines and six variants

Engine 1 is implemented; the other five directories are reserved. They will share rules/protocol while implementing independently designed decision-making. Tactical, positional, defensive, materialist, unconventional, and universal descriptions are provisional.

Gliński and McCooey are playable. Board, pawn-capture directions, initial double-advance rights and stalemate scoring come from shared C++ variant descriptors. Serialized states carry the variant, and McCooey pawn movement rights affect repetition. Additional historical modules must independently verify starting arrangements, movements, rights and results. Wellisch also needs multiplayer search and historically verified check/elimination/victory semantics. The general state design prepares for that work; it does not claim those rules already exist.

## Development and publication

Floot hosts the UI, Node API and database. The native executable runs in its server environment. `cloud/floot` mirrors app source; Floot supplies router, server environment and generated scaffolding. `web` provides a Vite development entry for the same UI and proxies API/assets to the hosted app. Its static build alone is not the complete cloud backend.

The retained local WebSocket manager binds to loopback and accepts only fixed local Vite origins. Its allowlisted engine registry cannot accept arbitrary executable paths. It remains available at `?foundation` for ping/id/geometry diagnostics, not public internet access.

## Minimal frontend routes

The UI has three pages: `/`, `/glinski`, `/mccooey`. Home uses the read-only `GET /_api/variants` endpoint to render actual native starting boards without creating game rows. Variant pages share `components/Play`. Separate per-variant browser session keys preserve the last game of each variant; legacy shared root links resolve their authoritative variant and move to its page. Existing cloud states and Tactical 0.6 are unchanged.

Unconsumed browser install offers live outside individual page components, in a FIFO queue. Navigation never discards them. Failed attempts are retained; an explicit user attempt with a returned browser choice consumes that offer. ChatGPT’s own prompt queue is outside the app’s control.
