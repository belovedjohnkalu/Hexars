import { test } from "node:test";
import assert from "node:assert/strict";
// The exact ESM file uploaded to Pages is tested, without a simulated framework.
// @ts-expect-error plain JavaScript worker is intentionally runtime-only
import worker from "../../web/public/_worker.js";

test("Pages routes assets directly and blocks arbitrary API proxy paths", async () => {
  const env = { ASSETS: { fetch: async () => new Response("asset") } };
  assert.equal(await (await worker.fetch(new Request("https://hexars.test/shafran"), env)).text(), "asset");
  assert.equal((await worker.fetch(new Request("https://hexars.test/api/health"), env)).status, 404);
  assert.equal((await worker.fetch(new Request("https://hexars.test/api/game"), env)).status, 405);
  assert.equal((await worker.fetch(new Request("https://hexars.test/api/variants"), env)).status, 503);
});
test("Pages forwards only approved headers to a fixed HTTPS service", async () => {
  const previous = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (input, init) => {
    calls++;
    assert.equal(String(input), "https://engine.test/api/game");
    const headers = new Headers(init?.headers);
    assert.equal(headers.get("Authorization"), "Bearer verified-session");
    assert.equal(headers.get("X-Hexars-Gateway"), "server-secret");
    assert.equal(headers.has("Cookie"), false);
    assert.equal(init?.redirect, "manual");
    return new Response('{"json":{"error":"conflict"}}', { status: 409, headers: { "Set-Cookie": "private", "X-Hexars-Gateway": "secret" } });
  };
  try {
    const response = await worker.fetch(new Request("https://hexars.test/api/game?target=https://attacker.test", {
      method: "POST", body: "{}", headers: { Authorization: "Bearer verified-session", Cookie: "cookie", "X-Hexars-Gateway": "forged" },
    }), { HEXARS_API_ORIGIN: "https://engine.test", HEXARS_GATEWAY_SECRET: "server-secret" });
    assert.equal(response.status, 409);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.equal(response.headers.has("Set-Cookie"), false);
    assert.equal(response.headers.has("X-Hexars-Gateway"), false);
    assert.equal(calls, 1);
  } finally { globalThis.fetch = previous; }
});
test("Pages does not follow upstream redirects or forward insecure configuration", async () => {
  const previous = globalThis.fetch;
  globalThis.fetch = async () => new Response(null, { status: 302, headers: { Location: "https://attacker.test" } });
  try {
    const req = () => new Request("https://hexars.test/api/variants");
    assert.equal((await worker.fetch(req(), { HEXARS_API_ORIGIN: "https://engine.test", HEXARS_GATEWAY_SECRET: "secret" })).status, 502);
    assert.equal((await worker.fetch(req(), { HEXARS_API_ORIGIN: "http://engine.test", HEXARS_GATEWAY_SECRET: "secret" })).status, 503);
  } finally { globalThis.fetch = previous; }
});
