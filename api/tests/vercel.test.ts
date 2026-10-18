import { test } from "node:test";
import assert from "node:assert/strict";
import superjson from "superjson";
import { proxyApi } from "../../gateway/proxy";
import { createApp } from "../src/app";
import type { GameRow, GameStore } from "../src/store";
import type { InputType, OutputType } from "../../shared/protocol/contracts";

const secret = "vercel-gateway-test-secret-".repeat(2);
async function configured(run: () => Promise<void>) {
  const oldUrl = process.env.HEXARS_API_URL;
  const oldSecret = process.env.HEXARS_GATEWAY_SECRET;
  const oldFetch = globalThis.fetch;
  process.env.HEXARS_API_URL = "http://private-api.test";
  process.env.HEXARS_GATEWAY_SECRET = secret;
  try { await run(); }
  finally {
    if (oldUrl === undefined) delete process.env.HEXARS_API_URL;
    else process.env.HEXARS_API_URL = oldUrl;
    if (oldSecret === undefined) delete process.env.HEXARS_GATEWAY_SECRET;
    else process.env.HEXARS_GATEWAY_SECRET = oldSecret;
    globalThis.fetch = oldFetch;
  }
}

test("Vercel proxy reads the runtime binding and forwards only approved credentials and paths", async () => {
  await configured(async () => {
    process.env.HEXARS_API_URL = "http://private-api.test/binding/";
    let calls = 0;
    globalThis.fetch = async (url, init) => {
      calls++;
      assert.equal(String(url), "http://private-api.test/binding/api/game");
      const headers = new Headers(init?.headers);
      assert.equal(headers.get("Authorization"), "Bearer test-session");
      assert.equal(headers.get("X-Hexars-Gateway"), secret);
      assert.equal(headers.has("Cookie"), false);
      assert.equal(init?.redirect, "manual");
      assert.equal(await new Response(init?.body).text(), "{}");
      return new Response('{"error":"conflict"}', {
        status: 409, headers: { "Set-Cookie": "private", "X-Hexars-Gateway": "private" },
      });
    };
    const response = await proxyApi(new Request("https://hexars.test/api/game?target=https://attacker.test", {
      method: "POST", body: "{}", headers: {
        Authorization: "Bearer test-session", Cookie: "private", "X-Hexars-Gateway": "forged",
      },
    }));
    assert.equal(calls, 1);
    assert.equal(response.status, 409);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.equal(response.headers.has("Set-Cookie"), false);
    assert.equal(response.headers.has("X-Hexars-Gateway"), false);
  });
});

test("Vercel proxy rejects unknown routes, methods, missing configuration and oversized streamed bodies", async () => {
  await configured(async () => {
    globalThis.fetch = async () => { throw new Error("Must not reach backend"); };
    assert.equal((await proxyApi(new Request("https://hexars.test/api/health"))).status, 404);
    assert.equal((await proxyApi(new Request("https://hexars.test/api/game"))).status, 405);
    const oversized = new Request("https://hexars.test/api/game", {
      method: "POST", body: "x".repeat(4097),
    });
    assert.equal((await proxyApi(oversized)).status, 413);
    delete process.env.HEXARS_API_URL;
    assert.equal((await proxyApi(new Request("https://hexars.test/api/variants"))).status, 503);
    process.env.HEXARS_API_URL = "file:///private";
    assert.equal((await proxyApi(new Request("https://hexars.test/api/variants"))).status, 503);
  });
});

test("Vercel proxy refuses upstream redirects and propagates request cancellation", async () => {
  await configured(async () => {
    globalThis.fetch = async () => new Response(null, { status: 302, headers: { Location: "https://attacker.test" } });
    assert.equal((await proxyApi(new Request("https://hexars.test/api/variants"))).status, 502);
    const controller = new AbortController();
    controller.abort();
    globalThis.fetch = async (_url, init) => {
      assert.equal(init?.signal?.aborted, true);
      throw new DOMException("Aborted", "AbortError");
    };
    assert.equal((await proxyApi(new Request("https://hexars.test/api/variants", { signal: controller.signal }))).status, 503);
  });
});

test("Vercel browser paths pass through the binding to real native boards, game moves, search and undo", async () => {
  await configured(async () => {
    const rows = new Map<string, GameRow>();
    const store: GameStore = {
      async create(row) { rows.set(row.id, structuredClone(row)); },
      async find(id, hash) {
        const row = rows.get(id);
        return row?.accessTokenHash === hash ? structuredClone(row) : null;
      },
      async update(id, version, values) {
        const row = rows.get(id);
        if (!row || row.version !== version) return false;
        rows.set(id, { ...row, ...structuredClone(values) });
        return true;
      },
    };
    const api = createApp({
      store, gatewaySecret: secret,
      authenticate: async token => token === "verified-session" ? "verified-user" : null,
    });
    globalThis.fetch = async (input, init) => api(new Request(String(input), init));
    const previews = await proxyApi(new Request("https://hexars.test/api/variants"));
    assert.equal(previews.status, 200);
    assert.deepEqual((await previews.json()).variants.map((v: { board: { cells: unknown[] } }) => v.board.cells.length), [91, 91, 70, 84, 81]);
    assert.equal(rows.size, 0);
    const create = { action: "new", variant: "mccooey", mode: "engine", humanPlayer: 0 } as const;
    const unauthenticated = await proxyApi(new Request("https://hexars.test/api/game", {
      method: "POST", body: superjson.stringify(create),
    }));
    assert.equal(unauthenticated.status, 401);
    async function send(input: InputType) {
      const response = await proxyApi(new Request("https://hexars.test/api/game", {
        method: "POST", body: superjson.stringify(input), headers: { Authorization: "Bearer verified-session" },
      }));
      assert.equal(response.status, 200);
      return superjson.parse<OutputType>(await response.text());
    }
    const opened = await send(create);
    const credentials = { gameId: opened.gameId, accessToken: opened.accessToken };
    const first = opened.game.legalMoves[0];
    const moved = await send({ action: "move", ...credentials, version: 0, move: { from: first.from, to: first.to } });
    assert.equal(moved.game.ply, 1);
    const reply = await send({ action: "engine", ...credentials, version: moved.version });
    assert.equal(reply.game.ply, 2);
    assert.ok(reply.lastSearch && reply.lastSearch.nodes > 0);
    const resumed = await send({ action: "get", ...credentials });
    assert.equal(resumed.game.stateId, reply.game.stateId);
    const undone = await send({ action: "undo", ...credentials, version: reply.version });
    assert.equal(undone.game.stateId, opened.game.stateId);
    assert.equal(rows.get(opened.gameId)?.ownerId, "verified-user");
  });
});
