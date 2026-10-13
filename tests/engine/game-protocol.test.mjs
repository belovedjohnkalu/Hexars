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
  assert.equal(hello.engine, "Tactical 0.5");
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
    initial.game.legalMoves.some(
      (move) =>
        move.from.q === decision.move.from.q &&
        move.from.r === decision.move.from.r &&
        move.to.q === decision.move.to.q &&
        move.to.r === decision.move.to.r &&
        move.promotion === decision.move.promotion,
    ),
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

test("Legal destinations describe normal moves, captures and checking captures", async (t) => {
  const request = engine(t);
  let response = await request({ type: "new_game", variant: "glinski" });
  const quiet = response.game.legalMoves.find(
    (move) => move.fromNotation === "b1" && move.toNotation === "b3",
  );
  assert.equal(quiet.capture, false);
  assert.equal(quiet.givesCheck, false);
  for (const [from, to] of [
    ["e1", "c3"],
    ["e10", "c6"],
    ["b1", "b2"],
    ["b7", "b6"],
    ["f3", "b1"],
    ["e7", "e6"],
  ]) {
    const move = response.game.legalMoves.find(
      (move) => move.fromNotation === from && move.toNotation === to,
    );
    assert.ok(move);
    response = await request({ type: "play_move", stateId: response.game.stateId, move });
  }
  const mate = response.game.legalMoves.find(
    (move) => move.fromNotation === "c3" && move.toNotation === "f9",
  );
  assert.equal(mate.capture, true);
  assert.equal(mate.givesCheck, true);
});

test("En passant is marked as a capture despite an empty destination", async (t) => {
  const request = engine(t);
  let response = await request({ type: "new_game", variant: "glinski" });
  const cells = response.game.board.cells;
  const state = {
    ...response.state,
    occupants: cells.map(() => null),
    activePlayer: 1,
    positionHistory: [],
    ply: 0,
  };
  for (const [notation, type, player] of [
    ["a2", "king", 0],
    ["l5", "king", 1],
    ["c7", "pawn", 1],
    ["b5", "pawn", 0],
  ]) {
    state.occupants[cells.findIndex((cell) => cell.notation === notation)] = {
      type,
      player,
      hasMoved: false,
    };
  }
  response = await request({ type: "position", state });
  const advance = response.game.legalMoves.find(
    (move) => move.fromNotation === "c7" && move.toNotation === "c5",
  );
  response = await request({ type: "play_move", stateId: response.game.stateId, move: advance });
  assert.equal(response.game.board.cells.find((cell) => cell.notation === "c6").piece, null);
  const capture = response.game.legalMoves.find(
    (move) => move.fromNotation === "b5" && move.toNotation === "c6",
  );
  assert.equal(capture.capture, true);
});

test("Automatic material draws hide moves, score half each and stop search", async (t) => {
  const request = engine(t);
  const initial = await request({ type: "new_game" });
  const cells = initial.game.board.cells;
  const load = async (extras) => {
    const state = { ...initial.state, occupants: cells.map(() => null), positionHistory: [] };
    for (const [notation, type, player] of [["a2", "king", 0], ["l5", "king", 1], ...extras])
      state.occupants[cells.findIndex((cell) => cell.notation === notation)] = {
        type,
        player,
        hasMoved: false,
      };
    return request({ type: "position", state });
  };
  for (const extras of [
    [],
    [["f6", "bishop", 0]],
    [["f6", "knight", 0]],
    [["f6", "rook", 0]],
    [["i5", "rook", 1]],
    [
      ["f6", "bishop", 0],
      ["i5", "knight", 1],
    ],
    [
      ["f6", "rook", 0],
      ["i5", "rook", 1],
    ],
  ]) {
    const response = await load(extras);
    assert.equal(response.game.result.status, "draw");
    assert.deepEqual(response.game.result.scores, [0.5, 0.5]);
    assert.equal(
      response.game.result.reason,
      extras.length ? "Low-material house rule" : "Insufficient material",
    );
    assert.deepEqual(response.game.legalMoves, []);
    const decision = await request({
      type: "go",
      stateId: response.game.stateId,
      limits: { timeMs: 100 },
    });
    assert.equal(decision.move, null);
    const king = cells.find((cell) => cell.notation === "a2"),
      destination = cells.find((cell) => cell.notation === "a3");
    const rejected = await request({
      type: "play_move",
      stateId: response.game.stateId,
      move: { from: { q: king.q, r: king.r }, to: { q: destination.q, r: destination.r } },
    });
    assert.equal(rejected.type, "error");
    assert.match(rejected.message, /Game has ended/);
  }
  for (const extras of [
    [["f6", "pawn", 0]],
    [["f6", "queen", 1]],
    [
      ["f6", "bishop", 0],
      ["f4", "knight", 0],
    ],
  ]) {
    const response = await load(extras);
    assert.equal(response.game.result.status, "ongoing");
    assert.ok(response.game.legalMoves.length > 0);
  }
});
