import { createHash, randomBytes, randomUUID } from "node:crypto";
import superjson from "superjson";
import type { GameStore } from "./store";
import { runNativeEngine, type EngineOptions, type NativeResult } from "./native-engine";
import type { Json } from "./store";
import {
  schema,
  type OutputType,
  type MoveRecord,
  type SearchDiagnostics,
} from "../../shared/protocol/contracts";

class GameError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");
function activePlayer(state: Json) {
  if (
    !state ||
    typeof state !== "object" ||
    Array.isArray(state) ||
    (state.activePlayer !== 0 && state.activePlayer !== 1)
  )
    throw new Error("Saved game state is invalid");
  return state.activePlayer;
}
const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };

export function gameService(store: GameStore, engine: (options: EngineOptions) => Promise<NativeResult> = runNativeEngine) {
return async function handle(request: Request, userId: string) {
  try {
    const text = await request.text();
    if (text.length > 4096) throw new GameError("Request too large", 413);
    let body: unknown;
    try { body = superjson.parse(text); }
    catch { throw new GameError("Invalid request", 400); }
    const input = schema.parse(body);
    if (input.action === "new") {
      const native = await engine({
        action: "new",
        variant: input.variant,
        signal: request.signal,
      });
      const gameId = randomUUID();
      const accessToken = randomBytes(32).toString("hex");
      await store.create({
        id: gameId, ownerId: userId, accessTokenHash: tokenHash(accessToken),
        mode: input.mode, humanPlayer: input.humanPlayer, state: native.state,
        timeline: [], moves: [], version: 0, lastSearch: null,
      });
      return new Response(
        superjson.stringify({
          gameId,
          accessToken,
          version: 0,
          mode: input.mode,
          humanPlayer: input.humanPlayer,
          engine: native.engine,
          execution: "cloud",
          game: native.game,
          moves: [],
          lastSearch: null,
        } satisfies OutputType),
        { headers },
      );
    }

    // A saved-game link is a deliberate capability. JWT alone cannot open another game.
    const row = await store.find(input.gameId, tokenHash(input.accessToken));
    if (!row)
      throw new GameError("Game not found. Start a new game or use its saved game link.", 404);
    if (input.action !== "get" && input.version !== row.version)
      throw new GameError("This game changed on another device. Refresh to continue.", 409);
    let moves = (Array.isArray(row.moves) ? row.moves : []) as unknown as MoveRecord[];
    let timeline = Array.isArray(row.timeline) ? row.timeline : [];
    let lastSearch = row.lastSearch as unknown as SearchDiagnostics | null;
    let nextState = row.state;
    let version = row.version;

    if (
      input.action === "move" &&
      row.mode === "engine" &&
      activePlayer(row.state) !== row.humanPlayer
    )
      throw new GameError("Wait for the engine's turn to finish.", 400);
    if (
      input.action === "engine" &&
      (row.mode !== "engine" || activePlayer(row.state) === row.humanPlayer)
    )
      throw new GameError("It is not the engine's turn.", 400);
    if (input.action === "undo") {
      if (!timeline.length) throw new GameError("There are no moves to undo.", 400);
      let count = 1;
      if (
        row.mode === "engine" &&
        activePlayer(row.state) === row.humanPlayer &&
        timeline.length >= 2
      )
        count = 2;
      nextState = timeline[timeline.length - count];
      timeline = timeline.slice(0, -count);
      moves = moves.slice(0, -count);
      lastSearch = null;
    }

    const native = await engine({
      action: input.action === "move" ? "move" : input.action === "engine" ? "search" : "inspect",
      state: nextState,
      move: input.action === "move" ? input.move : undefined,
      signal: request.signal,
    });

    if (input.action === "move" || input.action === "engine") {
      const selected = native.appliedMove;
      if (!selected || !native.previousGame)
        throw new Error("The engine did not return an applied move.");
      const before = native.previousGame;
      const capture =
        before.board.cells.filter((cell) => cell.piece).length >
        native.game.board.cells.filter((cell) => cell.piece).length;
      const from =
        selected.fromNotation ||
        before.board.cells.find((cell) => cell.q === selected.from.q && cell.r === selected.from.r)
          ?.notation ||
        "?";
      const to =
        selected.toNotation ||
        before.board.cells.find((cell) => cell.q === selected.to.q && cell.r === selected.to.r)
          ?.notation ||
        "?";
      const record: MoveRecord = {
        ply: native.game.ply,
        player: before.activePlayer,
        from: selected.from,
        to: selected.to,
        notation:
          from +
          (capture ? "×" : "–") +
          to +
          (selected.promotion
            ? "=" + (selected.promotion === "knight" ? "N" : selected.promotion[0].toUpperCase())
            : "") +
          (native.game.result.status === "checkmate" ? "#" : native.game.check ? "+" : ""),
        engine: input.action === "engine",
        ...(selected.promotion ? { promotion: selected.promotion } : {}),
      };
      timeline = [...timeline, row.state];
      moves = [...moves, record];
      nextState = native.state;
      if (native.diagnostics) lastSearch = native.diagnostics;
    }

    if (input.action !== "get") {
      const updated = await store.update(row.id, row.version, {
        state: nextState, timeline, moves, lastSearch, version: row.version + 1,
      });
      if (!updated)
        throw new GameError("This game changed on another device. Refresh to continue.", 409);
      version = row.version + 1;
    }

    const output: OutputType = {
      gameId: row.id,
      accessToken: input.accessToken,
      version,
      mode: row.mode,
      humanPlayer: row.humanPlayer,
      engine: native.engine,
      execution: "cloud",
      game: native.game,
      moves,
      lastSearch,
    };
    return new Response(superjson.stringify(output), { headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The game service is unavailable.";
    const status =
      error instanceof GameError
        ? error.status
        : message.includes("Illegal move") || message.includes("Game has ended")
          ? 400
          : typeof error === "object" && error && "issues" in error
            ? 400
            : 503;
    if (status >= 500) console.error("HexChess game request failed:", message);
    return new Response(superjson.stringify({ error: status >= 500 ? "The game service is unavailable. Please retry." : message }), { status, headers });
  }
};
}
