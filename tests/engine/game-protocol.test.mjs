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
  assert.equal(hello.engine, "Tactical 0.9.0");
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
  assert.equal((await request({ type: "new_game", variant: "unknown" })).type, "error");
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

test("McCooey identifies its variant, setup and first-move pawn rights", async (t) => {
  const request = engine(t);
  assert.deepEqual((await request({ type: "supported_variants" })).variants, ["glinski", "mccooey", "shafran", "brusky", "devasa", "wellisch"]);
  const initial = await request({ type: "new_game", variant: "mccooey" });
  assert.equal(initial.game.variant, "mccooey");
  assert.equal(initial.game.board.variant, "mccooey");
  assert.equal(initial.game.board.cells.filter((cell) => cell.piece).length, 32);
  assert.equal(initial.game.board.cells.filter((cell) => cell.piece?.type === "pawn").length, 14);
  const centre = initial.game.legalMoves.filter((move) => move.fromNotation === "f4");
  assert.deepEqual(centre.map((move) => move.toNotation), ["f5"]);
  assert.ok(initial.game.legalMoves.some((move) => move.fromNotation === "d2" && move.toNotation === "d4"));
  const loaded = await request({ type: "position", state: initial.state });
  assert.equal(loaded.game.stateId, initial.game.stateId);
  const missingRights = structuredClone(initial.state);
  delete missingRights.occupants.find((piece) => piece?.type === "pawn").hasMoved;
  assert.equal((await request({ type: "position", state: missingRights })).type, "error");
  const swapped = structuredClone(initial.state);
  swapped.variant = "glinski";
  swapped.positionHistory = [];
  const other = await request({ type: "position", state: swapped });
  assert.notEqual(other.game.stateId, initial.game.stateId);
});

test("McCooey en passant follows the bishop diagonal and marks an empty cell as a capture", async (t) => {
  const request = engine(t);
  const initial = await request({ type: "new_game", variant: "mccooey" });
  const cells = initial.game.board.cells;
  const state = { ...initial.state, occupants: cells.map(() => null), activePlayer: 1, positionHistory: [] };
  for (const [notation, type, player] of [["a2", "king", 0], ["l5", "king", 1], ["e8", "pawn", 1], ["d5", "pawn", 0]])
    state.occupants[cells.findIndex((cell) => cell.notation === notation)] = { type, player, hasMoved: false };
  let response = await request({ type: "position", state });
  const advance = response.game.legalMoves.find((move) => move.fromNotation === "e8" && move.toNotation === "e6");
  response = await request({ type: "play_move", stateId: response.game.stateId, move: advance });
  const capture = response.game.legalMoves.find((move) => move.fromNotation === "d5" && move.toNotation === "e7");
  assert.ok(capture);
  assert.equal(capture.capture, true);
  assert.equal(response.game.board.cells.find((cell) => cell.notation === "e7").piece, null);
  response = await request({ type: "play_move", stateId: response.game.stateId, move: capture });
  assert.equal(response.game.board.cells.find((cell) => cell.notation === "e6").piece, null);
  assert.equal(response.game.variant, "mccooey");
});

test("McCooey stalemate scores equally and search stops; ongoing McCooey search returns a legal move", async (t) => {
  const request = engine(t);
  const initial = await request({ type: "new_game", variant: "mccooey" });
  const decision = await request({ type: "go", stateId: initial.game.stateId, limits: { timeMs: 100, depth: 2, nodeLimit: 3000 } });
  assert.ok(initial.game.legalMoves.some((move) => move.fromNotation === decision.move.fromNotation && move.toNotation === decision.move.toNotation));
  const state = { ...initial.state, occupants: initial.game.board.cells.map(() => null), activePlayer: 1, positionHistory: [] };
  for (const [notation, type, player] of [["h8", "king", 0], ["f11", "king", 1], ["e8", "queen", 0]])
    state.occupants[initial.game.board.cells.findIndex((cell) => cell.notation === notation)] = { type, player, hasMoved: true };
  const stale = await request({ type: "position", state });
  assert.equal(stale.game.result.status, "stalemate");
  assert.equal(stale.game.result.winner, -1);
  assert.deepEqual(stale.game.result.scores, [0.5, 0.5]);
  assert.deepEqual(stale.game.legalMoves, []);
  assert.equal((await request({ type: "go", stateId: stale.game.stateId, limits: { timeMs: 10 } })).move, null);
});

test("Shafran exposes the 70-cell board and validates triple-advance rights", async t => {
  const request = engine(t);
  const initial = await request({ type: "new_game", variant: "shafran" });
  assert.equal(initial.game.board.cells.length, 70);
  assert.equal(initial.game.board.cells.filter(c => c.piece).length, 36);
  const centre = initial.game.legalMoves.filter(m => m.fromNotation === "e2");
  assert.deepEqual(centre.map(m => m.toNotation), ["e3", "e4", "e5"]);
  const move = centre.find(m => m.toNotation === "e5");
  const next = await request({ type: "play_move", stateId: initial.game.stateId, move });
  assert.equal(next.state.additionalEnPassantTargets.length, 1);
  assert.equal((await request({ type: "position", state: next.state })).game.stateId, next.game.stateId);
  const broken = structuredClone(next.state);
  broken.additionalEnPassantTargets = [];
  broken.positionHistory = [];
  assert.equal((await request({ type: "position", state: broken })).type, "error");
  const missing = structuredClone(initial.state);
  delete missing.occupants.find(p => p?.type === "king").hasMoved;
  assert.equal((await request({ type: "position", state: missing })).type, "error");
});

test("Shafran serializes both en-passant captures after a triple advance", async t => {
  const request = engine(t), initial = await request({ type: "new_game", variant: "shafran" });
  const cells = initial.game.board.cells;
  const state = { ...initial.state, occupants: cells.map(() => null), activePlayer: 1, positionHistory: [] };
  for (const [notation,type,player] of [["a1","king",0],["i10","king",1],["d8","pawn",1],["e6","pawn",0],["c4","pawn",0]])
    state.occupants[cells.findIndex(c => c.notation === notation)] = { type, player, hasMoved: type !== "pawn" || player === 0 };
  let response = await request({ type: "position", state });
  const move = response.game.legalMoves.find(m => m.fromNotation === "d8" && m.toNotation === "d5");
  response = await request({ type: "play_move", stateId: response.game.stateId, move });
  for (const [from,to] of [["e6","d7"],["c4","d6"]])
    assert.equal(response.game.legalMoves.find(m => m.fromNotation === from && m.toNotation === to).capture, true);
  const before = response;
  for (const to of ["d7","d6"]){
    await request({ type: "position", state: before.state });
    const move = before.game.legalMoves.find(m => m.toNotation === to && m.capture);
    const result = await request({ type: "play_move", stateId: before.game.stateId, move });
    assert.equal(result.game.board.cells.find(c => c.notation === "d5").piece, null);
    assert.equal(move.changes.length, 3);
    for(const change of move.changes)assert.deepEqual(change.piece,result.game.board.cells.find(c=>c.q===change.q&&c.r===change.r).piece);
  }
});

test("Shafran castling applies and preserves both king and rook movement rights", async t => {
  const request = engine(t), initial = await request({ type: "new_game", variant: "shafran" });
  const cells = initial.game.board.cells;
  const state = { ...initial.state, occupants: cells.map(() => null), positionHistory: [] };
  for (const [notation,type,player] of [["e1","king",0],["e10","king",1],["a1","rook",0],["i5","rook",0]])
    state.occupants[cells.findIndex(c => c.notation === notation)] = { type, player, hasMoved: false };
  const loaded = await request({ type: "position", state });
  for (const [to,rook] of [["c1","d1"],["b1","c1"],["g3","f2"],["h4","g3"]]){
    await request({ type: "position", state: loaded.state });
    const move = loaded.game.legalMoves.find(m => m.fromNotation === "e1" && m.toNotation === to);
    assert.ok(move);
    const result = await request({ type: "play_move", stateId: loaded.game.stateId, move });
    assert.equal(result.game.board.cells.find(c => c.notation === to).piece.type, "king");
    assert.equal(result.game.board.cells.find(c => c.notation === rook).piece.type, "rook");
    assert.equal(move.changes.length, 4);
    for(const change of move.changes)assert.deepEqual(change.piece,result.game.board.cells.find(c=>c.q===change.q&&c.r===change.r).piece);
    assert.equal((await request({ type: "position", state: result.state })).game.stateId, result.game.stateId);
  }
});

test("Tactical returns a legal Shafran move under its time budget", async t => {
  const request = engine(t), initial = await request({ type: "new_game", variant: "shafran" });
  const result = await request({ type: "go", stateId: initial.game.stateId, limits: { timeMs: 100, depth: 2, nodeLimit: 2000 } });
  assert.ok(initial.game.legalMoves.some(m => m.fromNotation === result.move.fromNotation && m.toNotation === result.move.toNotation));
  assert.ok(result.diagnostics.timeMs < 1000);
});

test("Native legal moves include exact visual deltas for immediate rendering",async t=>{
  const request=engine(t);
  for(const variant of ['glinski','mccooey','shafran','brusky','devasa']){
    const initial=await request({type:'new_game',variant});
    for(const move of initial.game.legalMoves){
      assert.ok(move.changes.length>=2);
      await request({type:'position',state:initial.state});
      const applied=await request({type:'play_move',stateId:initial.game.stateId,move});
      const projected=initial.game.board.cells.map(cell=>{
        const change=move.changes.find(c=>c.q===cell.q&&c.r===cell.r);
        return change?{...cell,piece:change.piece}:cell;
      });
      assert.deepEqual(projected,applied.game.board.cells);
    }
  }
});

for(const variant of ['brusky','devasa'])test(`${variant} protocol validates rights, castling, en passant, promotion and terminal results`,async t=>{
 const request=engine(t),initial=await request({type:'new_game',variant}),cells=initial.game.board.cells;
 assert.equal(initial.game.board.orientation,'pointy');assert.equal(cells.length,variant==='brusky'?84:81);
 assert.equal((await request({type:'position',state:initial.state})).game.stateId,initial.game.stateId);
 const missing=structuredClone(initial.state);delete missing.occupants.find(p=>p?.type==='pawn').hasMoved;
 assert.equal((await request({type:'position',state:missing})).type,'error');
 const fixture=(pieces,activePlayer=0)=>{const state={...initial.state,occupants:cells.map(()=>null),activePlayer,positionHistory:[]};for(const [notation,type,player,moved=true] of pieces){const i=cells.findIndex(c=>c.notation===notation);assert.ok(i>=0);state.occupants[i]={type,player,hasMoved:moved};}return state;};
 const apply=async(response,from,to,promotion)=>{const move=response.game.legalMoves.find(m=>m.fromNotation===from&&m.toNotation===to&&m.promotion===promotion);assert.ok(move,`${variant} ${from}-${to}`);const after=await request({type:'play_move',stateId:response.game.stateId,move});assert.notEqual(after.type,'error');return {after,move};};
 const castleState=fixture([['f1','king',0,false],[variant==='brusky'?'g8':'d9','king',1,false],['a1','rook',0,false],['i1','rook',0,false]]);
 for(const [to,rook] of [['h1','g1'],['c1','d1']]){const before=await request({type:'position',state:castleState}),{after,move}=await apply(before,'f1',to);assert.equal(move.changes.length,4);assert.equal(after.game.board.cells.find(c=>c.notation===rook).piece.type,'rook');assert.equal((await request({type:'position',state:after.state})).game.stateId,after.game.stateId);}
 for(const [to,cross,from] of [['f5','f6','g5'],['d5','e6','f5']]){let before=await request({type:'position',state:fixture([['a1','king',0],[variant==='brusky'?'l8':'i9','king',1],['f7','pawn',1,false],[from,'pawn',0]],1)});before=(await apply(before,'f7',to)).after;assert.equal((await request({type:'position',state:before.state})).game.stateId,before.game.stateId);const {after,move}=await apply(before,from,cross);assert.equal(move.capture,true);assert.equal(move.changes.length,3);assert.equal(after.game.board.cells.find(c=>c.notation===to).piece,null);const bad=structuredClone(before.state);bad.occupants[bad.enPassantPawn].hasMoved=false;assert.equal((await request({type:'position',state:bad})).type,'error');}
 let before=await request({type:'position',state:fixture([['a1','king',0],['a5','king',1],[variant==='brusky'?'g7':'g8','pawn',0]])});
 const promotion=before.game.legalMoves.find(m=>m.promotion==='queen');assert.ok(promotion);const promoted=await request({type:'play_move',stateId:before.game.stateId,move:promotion});assert.equal(promoted.game.board.cells.find(c=>c.notation===promotion.toNotation).piece.type,'queen');
 for(const [status,king,queen] of variant==='brusky'?[['checkmate','a5','j4'],['stalemate','h2','k6']]:[['checkmate','a9','g1'],['stalemate','a9','g2']]){before=await request({type:'position',state:fixture([[king,'king',0],[variant==='brusky'?'l4':'i1','king',1],[queen,'queen',0]],1)});assert.equal(before.game.result.status,status);assert.deepEqual(before.game.legalMoves,[]);if(status==='stalemate')assert.deepEqual(before.game.result.scores,[.5,.5]);const result=await request({type:'go',stateId:before.game.stateId,limits:{timeMs:20,depth:1,nodeLimit:100}});assert.equal(result.move,null);}
});
