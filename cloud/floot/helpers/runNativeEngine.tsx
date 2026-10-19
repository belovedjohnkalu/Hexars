import { chessVariants } from "./chessVariants";
import { tacticalLevels } from "./tacticalLevels";
import { spawn } from "node:child_process";
import { readFile, writeFile, chmod, rename, rm } from "node:fs/promises";
import { createHash, randomUUID, randomInt } from "node:crypto";
import { tmpdir, arch, platform } from "node:os";
import path from "node:path";
import { createInterface } from "node:readline";
import type { Json } from "./schema";
import type { ChessMove, GameView, SearchDiagnostics, VariantId } from "../endpoints/game_POST.schema";

const asset = "/_cdn/static/9f65e48d-88fe-4aeb-b6dd-467b03953d57-tactical-0.9.0-linux-x64.bin";
const checksum = "33a4d360905b37806e16fe9709ec323b0e48fdd5ebd240adf7af9a76ebc71b93";
type Options = {
  action: "new" | "inspect" | "move" | "search";
  origin: string;
  variant?: VariantId;
  difficulty?:number;
  engineId?:'tactical'|'positional';
  state?: Json;
  move?: ChessMove;
  signal?: AbortSignal;
};
type NativeResult = {
  engine: string;
  state: Json;
  game: GameView;
  previousGame?: GameView;
  appliedMove?: ChessMove;
  diagnostics: SearchDiagnostics | null;
};

// Only immutable compiled code is cached in /tmp. Every game state lives in
// Postgres; serverless process memory and temporary files are never game storage.
async function executable(origin: string,engineId='tactical') {
  const positional=engineId==='positional',selectedAsset=positional?'/_cdn/static/4ba245d9-6ade-4313-8ee1-9a234e41517e-positional-0.1.0-static-linux-x64.bin':asset,selectedChecksum=positional?'71ddf694c874a26ee780e3aa85a8e57b4f3ca3b01babc3e3bec7e3f9125ee15b':checksum,selectedSize=positional?2797000:2222328;
  if (platform() !== "linux" || arch() !== "x64")
    throw new Error("Unsupported cloud engine platform");
  const filename = path.join(tmpdir(), `hexchess-engine-${selectedChecksum}`);
  let binary: Buffer | null = null;
  try {
    binary = await readFile(filename);
  } catch {
    /* First request in a new runtime. */
  }
  if (binary && createHash("sha256").update(binary).digest("hex") === selectedChecksum) return filename;
  const response = await fetch(new URL(selectedAsset, origin), { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error("The cloud engine could not be loaded");
  binary = Buffer.from(await response.arrayBuffer());
  if (binary.length !== selectedSize || createHash("sha256").update(binary).digest("hex") !== selectedChecksum)
    throw new Error("Cloud engine checksum mismatch");
  const staging = filename + "-" + randomUUID();
  try {
    await writeFile(staging, binary);
    await chmod(staging, 0o700);
    await rename(staging, filename);
  } finally {
    await rm(staging, { force: true });
  }
  return filename;
}

export async function runNativeEngine(options: Options): Promise<NativeResult> {
  const filename = await executable(options.origin,options.engineId);
  if (options.signal?.aborted) throw new Error("Game request cancelled");
  return await new Promise((resolve, reject) => {
    const child = spawn(filename, [], { shell: false, stdio: ["pipe", "pipe", "pipe"] });
    const lines = createInterface({ input: child.stdout });
    let sequence = 0,
      pendingId = "",
      stage = "hello",
      identity = "",
      stderr = "";
    let previousGame: GameView | undefined;
    let appliedMove = options.move;
    let diagnostics: SearchDiagnostics | null = null;
    let completed: NativeResult | null = null;
    let failure: Error | null = null;
    const stop = (error: Error) => {
      failure ??= error;
      child.kill("SIGKILL");
    };
    const timer = setTimeout(
      () => stop(new Error("The cloud engine timed out. Please retry.")),
      6000,
    );
    const abort = () => stop(new Error("Game request cancelled"));
    options.signal?.addEventListener("abort", abort, { once: true });
    const send = (packet: object) => {
      pendingId = `cloud-${++sequence}`;
      child.stdin.write(
        JSON.stringify({ protocolVersion: 1, requestId: pendingId, ...packet }) + "\n",
      );
    };
    const finish = (packet: Record<string, unknown>) => {
      if (!packet.state || !packet.game) throw new Error("Incomplete cloud game response");
      const game = packet.game as GameView;
      if (
        !Array.isArray(game.board?.cells) ||
        game.board.cells.length !== chessVariants.all.find(variant => variant.id === game.variant)?.cells ||
        game.board.variant !== game.variant ||
        (options.variant !== undefined && game.variant !== options.variant) ||
        !Array.isArray(game.legalMoves)
      )
        throw new Error("Invalid cloud game response");
      completed = {
        engine: identity,
        state: packet.state as Json,
        game,
        previousGame,
        appliedMove,
        diagnostics,
      };
      child.stdin.end("quit\n");
    };
    child.stderr.on("data", (data) => {
      stderr = (stderr + data).slice(0, 2048);
    });
    child.stdin.on("error", (error) => stop(error));
    child.on("error", (error) => {
      failure = error;
    });
    lines.on("line", (line) => {
      if (failure || completed) return;
      try {
        if (line.length > 131072) throw new Error("Cloud engine response too large");
        const packet = JSON.parse(line) as Record<string, unknown>;
        if (packet.protocolVersion !== 1 || packet.requestId !== pendingId)
          throw new Error("Cloud engine response mismatch");
        if (packet.type === "error")
          throw new Error(
            typeof packet.message === "string" ? packet.message : "Invalid chess request",
          );
        if (stage === "hello") {
          if (packet.type !== "hello" || typeof packet.engine !== "string")
            throw new Error("Cloud engine handshake failed");
          identity = packet.engine;
          stage = "position";
          send(
            options.action === "new"
              ? { type: "new_game", variant: options.variant ?? "glinski" }
              : { type: "position", state: options.state },
          );
        } else if (stage === "position") {
          if (packet.type !== "game" || !packet.game) throw new Error("Position validation failed");
          previousGame = packet.game as GameView;
          if (options.action === "new" || options.action === "inspect") finish(packet);
          else if (options.action === "move") {
            stage = "applied";
            send({ type: "play_move", stateId: previousGame.stateId, move: options.move });
          } else {
            stage = "search";
            send({
              type: "go",
              stateId: previousGame.stateId,
              limits: (tacticalLevels.find(l=>l.level===options.difficulty)||tacticalLevels.find(l=>l.level===3)!).limits,
            });
          }
        } else if (stage === "search") {
          if (packet.type !== "bestmove" || packet.stateId !== previousGame?.stateId)
            throw new Error("Stale engine search response");
          if (!packet.move) throw new Error("Game has ended");
          const randomMove=options.difficulty===0&&randomInt(2)===0?previousGame!.legalMoves[randomInt(previousGame!.legalMoves.length)]:null;
          const chosen=randomMove||packet.move as ChessMove;
          appliedMove={from:chosen.from,to:chosen.to,...(chosen.promotion?{promotion:chosen.promotion}:{}),...(chosen.pass?{pass:true}:{})};
          const measured = packet.diagnostics as Omit<SearchDiagnostics, "score">;
          const evaluation = packet.evaluation as { score: number };
          diagnostics = { ...measured, score: evaluation.score,...(randomMove?{randomized:true}:{}) };
          stage = "applied";
          // The shared C++ rules validate and apply the engine's proposed move.
          send({ type: "play_move", stateId: previousGame!.stateId, move: appliedMove });
        } else if (stage === "applied") {
          if (packet.type !== "game") throw new Error("Move validation failed");
          finish(packet);
        }
      } catch (error) {
        stop(error instanceof Error ? error : new Error("Cloud engine failure"));
      }
    });
    child.once("close", (code) => {
      clearTimeout(timer);
      lines.close();
      options.signal?.removeEventListener("abort", abort);
      if (failure) reject(failure);
      else if (code !== 0 || !completed)
        reject(new Error(stderr || "Cloud engine stopped unexpectedly"));
      else resolve(completed);
    });
    send({ type: "hello" });
  });
}
