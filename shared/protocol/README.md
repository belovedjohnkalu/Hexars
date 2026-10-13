# HexChess protocol · version 1 / EngineOne 0.2

## Cloud browser API

The published app uses HTTPS `POST /_api/game`, encoded with SuperJSON. The strict contract is defined in `cloud/floot/endpoints/game_POST.schema.ts`.

Actions: `new`, `get`, `move`, `engine`, `undo`. Existing-game actions require a game UUID and a 64-hex guest access token. Mutations require the current optimistic `version`. The backend rejects stale changes with HTTP 409, illegal moves/malformed input with 400, and unknown credentials with 404. Client requests are capped at 4 KiB.

Responses contain authoritative board cells/pieces, legal moves, active player, check/result, native state ID, persisted version, move history and engine diagnostics. The browser cannot submit a replacement authoritative position or an executable path.

## Native JSON protocol

One newline-delimited JSON request produces one flushed JSON response on standard output. Diagnostics belong on standard error. Every request has `protocolVersion: 1`, `type` and a correlation `requestId`. The native input limit is 128 KiB. The cloud bridge validates response correlation and bounds output/time.

| Request | Behavior |
| --- | --- |
| `hello` | Returns engine identity `EngineOne 0.2` and capabilities. |
| `supported_variants` | Returns `glinski`. |
| `new_game` | Creates the historical Gliński position. |
| `position` | Loads and validates complete serialized state. |
| `legal_moves` | Describes the current position and legal moves. |
| `play_move` | Checks legality, applies the move and returns updated state/game. |
| `go` | Searches the current position; returns `bestmove` without applying it. |

`legal_moves`, `play_move` and `go` require the current `stateId`. The ID combines a native position key and ply, so stale requests cannot silently act on an older position. Search replies echo the position ID. The cloud bridge then passes the proposed move through `play_move` for authoritative validation before saving it.

```json
{"protocolVersion":1,"type":"new_game","requestId":"req-1","variant":"glinski"}
```

A game response includes `type: "game"`, `state` for later loading, and `game` for presentation. Serialized state carries variant, turn order, active player, occupants with movement history, en-passant target/pawn, halfmove clock, ply and repetition history. The current serializer accepts only verified two-player Gliński states; future variants must extend it deliberately.

```json
{"protocolVersion":1,"type":"go","requestId":"req-2","stateId":"<current-state-id>","limits":{"timeMs":750,"depth":3,"nodeLimit":30000}}
```

Move coordinates are `{from:{q,r},to:{q,r}}`, with optional `promotion` set to `queen`, `rook`, `bishop` or `knight`. Responses also include conventional notation. Search diagnostics report depth, nodes, elapsed milliseconds and evaluation; `move` is null when no legal move exists.

The engine remains synchronous. Native `stop` is not implemented. Cloud cancellation kills the isolated child process; a six-second watchdog enforces a server response boundary. Exit is the legacy `quit` line or end-of-input, not a JSON `quit` message yet.

## Retained local diagnostic protocol

At `?foundation`, the loopback WebSocket manager accepts versioned JSON frames containing exactly `protocolVersion`, `type`, `requestId`. The allowlisted types remain `engine.ping`, `engine.id`, `engine.board`. Each maps to legacy native `ping`, `id`, `board` text commands. Identity is now `EngineOne 0.2`; `board` describes geometry only. This optional manager does not provide the published game's API.

It serializes requests, preserves per-client response correlation, caps payloads/queues, accepts only localhost/127.0.0.1 Vite origins, and reports native exit/timeout. It must remain on loopback. Its protocol and tests are retained to support future local diagnostics without changing cloud gameplay.
