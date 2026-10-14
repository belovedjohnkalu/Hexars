import { test } from "node:test";
import assert from "node:assert/strict";
import superjson from "superjson";
import { gameService } from "../src/game-service";
import { createApp } from "../src/app";
import { runNativeEngine } from "../src/native-engine";
import type { GameRow, GameStore, GameUpdate } from "../src/store";
import type { InputType, OutputType } from "../../shared/protocol/contracts";

class MemoryStore implements GameStore {
  rows = new Map<string, GameRow>();
  async create(row: GameRow) { this.rows.set(row.id, structuredClone(row)); }
  async find(id: string, key: string) {
    const row = this.rows.get(id);
    return row?.accessTokenHash === key ? structuredClone(row) : null;
  }
  async update(id: string, version: number, values: GameUpdate) {
    const row = this.rows.get(id);
    if (!row || row.version !== version) return false;
    this.rows.set(id, { ...row, ...structuredClone(values) });
    return true;
  }
}
const request = (body: unknown) => new Request("https://hexars.test/api/game", {
  method: "POST", body: superjson.stringify(body),
});
const credentials = (game: OutputType) => ({ gameId: game.gameId, accessToken: game.accessToken });
const mutation = (game: OutputType) => ({ ...credentials(game), version: game.version });
const plainMove = (game: OutputType) => {
  const move = game.game.legalMoves[0];
  return { from: move.from, to: move.to, ...(move.promotion ? { promotion: move.promotion } : {}) };
};
async function success(handle: ReturnType<typeof gameService>, input: InputType) {
  const response = await handle(request(input), "c5be7a75-1733-4074-92ba-b7ff5a612c1d");
  const body = superjson.parse<OutputType>(await response.text());
  assert.equal(response.status, 200, JSON.stringify(body));
  return body;
}

for (const variant of ["glinski", "mccooey", "shafran"] as const) {
  test(`${variant}: persist native moves, resume, undo, and preserve link credentials`, async () => {
    const store = new MemoryStore();
    const handle = gameService(store);
    const opened = await success(handle, { action: "new", variant, mode: "two_players", humanPlayer: 0 });
    assert.equal(opened.game.board.cells.length, variant === "shafran" ? 70 : 91);
    assert.equal(store.rows.get(opened.gameId)?.ownerId, "c5be7a75-1733-4074-92ba-b7ff5a612c1d");
    assert.notEqual(store.rows.get(opened.gameId)?.accessTokenHash, opened.accessToken);
    const moved = await success(handle, { action: "move", ...mutation(opened), move: plainMove(opened) });
    assert.equal(moved.game.ply, 1);
    assert.equal(moved.version, 1);
    // A new service instance must reload state rather than relying on process memory.
    const resumed = await success(gameService(store), { action: "get", ...credentials(moved) });
    assert.equal(resumed.game.stateId, moved.game.stateId);
    const undone = await success(handle, { action: "undo", ...mutation(moved) });
    assert.equal(undone.game.stateId, opened.game.stateId);
    assert.equal(undone.game.ply, 0);
    assert.equal(undone.moves.length, 0);
    assert.equal(undone.version, 2);
    assert.equal(undone.accessToken, opened.accessToken);
  });
  test(`${variant}: native search returns and applies a legal engine reply`, async () => {
    const handle = gameService(new MemoryStore());
    const opened = await success(handle, { action: "new", variant, mode: "engine", humanPlayer: 0 });
    const moved = await success(handle, { action: "move", ...mutation(opened), move: plainMove(opened) });
    const reply = await success(handle, { action: "engine", ...mutation(moved) });
    assert.equal(reply.game.activePlayer, 0);
    assert.equal(reply.game.ply, 2);
    assert.equal(reply.moves.at(-1)?.engine, true);
    assert.ok(reply.lastSearch && reply.lastSearch.nodes > 0);
    const undone = await success(handle, { action: "undo", ...mutation(reply) });
    assert.equal(undone.game.stateId, opened.game.stateId);
    assert.equal(undone.moves.length, 0);
  });
}
test("capability mismatch, illegal move, wrong turn, and stale version never write state", async () => {
  const store = new MemoryStore();
  const handle = gameService(store);
  const opened = await success(handle, { action: "new", variant: "glinski", mode: "engine", humanPlayer: 0 });
  for (const [input, status] of [
    [{ action: "get", ...credentials(opened), accessToken: "0".repeat(64) }, 404],
    [{ action: "move", ...mutation(opened), move: { from: { q: 0, r: 0 }, to: { q: 0, r: 0 } } }, 400],
    [{ action: "engine", ...mutation(opened) }, 400],
    [{ action: "move", ...mutation(opened), version: 4, move: plainMove(opened) }, 409],
  ] as const) {
    assert.equal((await handle(request(input), "user")).status, status);
    assert.equal(store.rows.get(opened.gameId)?.version, 0);
  }
});
test("simultaneous moves from one version have exactly one winner", async () => {
  const store = new MemoryStore();
  const handle = gameService(store);
  const opened = await success(handle, { action: "new", variant: "mccooey", mode: "two_players", humanPlayer: 0 });
  const input = { action: "move", ...mutation(opened), move: plainMove(opened) };
  const replies = await Promise.all([handle(request(input), "user"), handle(request(input), "user")]);
  assert.deepEqual(replies.map(value => value.status).sort(), [200, 409]);
  assert.equal(store.rows.get(opened.gameId)?.version, 1);
  assert.equal(store.rows.get(opened.gameId)?.moves.length, 1);
});
test("malformed input and browser-supplied paths or state are rejected", async () => {
  const store = new MemoryStore();
  const handle = gameService(store);
  const input = { action: "new", variant: "glinski", mode: "engine", humanPlayer: 0 };
  for (const body of [{ ...input, executable: "/bin/sh" }, { ...input, state: {} }, { ...input, variant: "unknown" }]) {
    assert.equal((await handle(request(body), "user")).status, 400);
  }
  assert.equal((await handle(new Request("https://hexars.test/api/game", { method: "POST", body: "bad JSON" }), "user")).status, 400);
  assert.equal(store.rows.size, 0);
});
test("API requires the gateway secret and a verified Supabase session", async () => {
  const store = new MemoryStore();
  const secret = "gateway-test-secret-".repeat(3);
  let verified = 0;
  const handle = createApp({ store, gatewaySecret: secret, authenticate: async token => {
    verified++; return token === "verified-test-session" ? "verified-user" : null;
  } });
  function api(token?: string, gateway = secret) {
    return new Request("https://hexars.test/api/game", {
      method: "POST", headers: { "X-Hexars-Gateway": gateway, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: superjson.stringify({ action: "new", mode: "engine", humanPlayer: 0, variant: "glinski" }),
    });
  }
  assert.equal((await handle(api("verified-test-session", "wrong"))).status, 401);
  assert.equal(verified, 0);
  assert.equal((await handle(api())).status, 401);
  assert.equal((await handle(api("forged-token"))).status, 401);
  assert.equal(store.rows.size, 0);
  assert.equal((await handle(api("verified-test-session"))).status, 200);
  assert.equal([...store.rows.values()][0].ownerId, "verified-user");
});
test("homepage previews use native boards without creating accounts or games", async () => {
  const store = new MemoryStore();
  const secret = "gateway-test-secret-".repeat(3);
  const handle = createApp({ store, gatewaySecret: secret, authenticate: async () => { throw new Error("must not authenticate"); } });
  const response = await handle(new Request("https://hexars.test/api/variants", { headers: { "X-Hexars-Gateway": secret } }));
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(body.variants.map((variant: { board: { cells: unknown[] } }) => variant.board.cells.length), [91, 91, 70]);
  assert.equal(store.rows.size, 0);
});
test("cancelled native requests leave no game or running search", async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(runNativeEngine({ action: "new", variant: "glinski", signal: controller.signal }), /cancelled/);
});
