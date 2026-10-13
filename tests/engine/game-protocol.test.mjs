import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { once } from "node:events";
import test from "node:test";
import { engines } from "../../manager/engines.mjs";

function engine(t) {
  const child = spawn(engines["engine-1"].path, [], { stdio: ["pipe", "pipe", "pipe"] });
  const lines = createInterface({ input: child.stdout });
  let counter = 0;
  const request = async (message) => {
    const response = once(lines, "line");
    const requestId = `test-${++counter}`;
    child.stdin.write(JSON.stringify({ protocolVersion: 1, requestId, ...message }) + "\n");
    const [line] = await response;
    const result = JSON.parse(line);
    assert.equal(result.requestId, requestId);
    return result;
  };
  t.after(async () => {
    const done = once(child, "close");
    child.stdin.end("quit\n");
    await done;
    lines.close();
  });
  return request;
}

test("Versioned protocol identifies the engine and exposes authoritative starting pieces", async (t) => {
  const request = engine(t);
  const hello = await request({ type: "hello" });
  assert.equal(hello.engine, "Tactical 0.3");
  const start = await request({ type: "new_game", variant: "glinski" });
  assert.equal(start.game.board.cells.length, 91);
  assert.equal(start.game.board.cells.filter((cell) => cell.piece).length, 36);
  assert.equal(start.game.legalMoves.length, 51);
  assert.equal(start.game.activePlayer, 0);
  assert.equal(start.game.result.status, "ongoing");
});

test("Illegal and stale moves are rejected without changing game state", async (t) => {
  const request = engine(t);
  const initial = await request({ type: "new_game" });
  const stale = await request({
    type: "play_move",
    stateId: "outdated",
    move: initial.game.legalMoves[0],
  });
  assert.equal(stale.type, "error");
  assert.match(stale.message, /Stale/);
  const invalid = await request({
    type: "play_move",
    stateId: initial.game.stateId,
    move: { from: { q: 0, r: 0 }, to: { q: 0, r: 5 } },
  });
  assert.equal(invalid.type, "error");
  const unchanged = await request({ type: "legal_moves", stateId: initial.game.stateId });
  assert.equal(unchanged.game.ply, 0);
  const after = await request({
    type: "play_move",
    stateId: initial.game.stateId,
    move: initial.game.legalMoves[0],
  });
  assert.equal(after.game.ply, 1);
  assert.equal(after.game.activePlayer, 1);
});

test("Fully defined positions round-trip and malformed positions are rejected", async (t) => {
  const request = engine(t);
  const initial = await request({ type: "new_game" });
  const loaded = await request({ type: "position", state: initial.state });
  assert.equal(loaded.game.stateId, initial.game.stateId);
  const malformed = structuredClone(initial.state);
  malformed.occupants = [];
  assert.equal((await request({ type: "position", state: malformed })).type, "error");
  const missingKing = structuredClone(initial.state);
  missingKing.occupants = missingKing.occupants.map((piece) =>
    piece?.type === "king" && piece.player === 0 ? null : piece,
  );
  assert.equal((await request({ type: "position", state: missingKing })).type, "error");
  assert.equal((await request({ type: "new_game", variant: "shafran" })).type, "error");
});

test("Search returns a legal correlated move within a bounded budget", async (t) => {
  const request = engine(t);
  const initial = await request({ type: "new_game" });
  const decision = await request({
    type: "go",
    stateId: initial.game.stateId,
    limits: { timeMs: 100, depth: 2, nodeLimit: 3000 },
  });
  assert.equal(decision.type, "bestmove");
  assert.equal(decision.stateId, initial.game.stateId);
  assert.ok(
    initial.game.legalMoves.some((move) => JSON.stringify(move) === JSON.stringify(decision.move)),
  );
  assert.ok(decision.diagnostics.timeMs < 700);
  assert.ok(decision.diagnostics.nodes > 0);
  const after = await request({
    type: "play_move",
    stateId: decision.stateId,
    move: decision.move,
  });
  assert.equal(after.game.ply, 1);
});
