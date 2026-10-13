import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import test from "node:test";
import { WebSocket } from "ws";
import { startManager } from "../../manager/index.mjs";
import { engines } from "../../manager/engines.mjs";
import { EngineProcess } from "../../manager/engine-process.mjs";

function runEngine(input) {
  return new Promise((resolve, reject) => {
    const child = spawn(engines["engine-1"].path, [], { stdio: ["pipe", "pipe", "pipe"] });
    let output = "";
    child.stdout.on("data", (data) => {
      output += data;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) reject(new Error(`Engine exit: ${code}`));
      else resolve(output.trim().split("\n"));
    });
    child.stdin.end(input);
  });
}

async function client(port, origin = "http://localhost:5173") {
  const socket = new WebSocket(`ws://127.0.0.1:${port}`, { origin });
  const messages = [];
  const waiting = [];
  socket.on("message", (data) => {
    const message = JSON.parse(data.toString());
    if (waiting.length) waiting.shift()(message);
    else messages.push(message);
  });
  socket.on("error", () => {});
  await once(socket, "open");
  const next = () =>
    messages.length
      ? Promise.resolve(messages.shift())
      : new Promise((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error("Response timeout")), 2500);
          waiting.push((message) => {
            clearTimeout(timer);
            resolve(message);
          });
        });
  const hello = await next();
  assert.equal(hello.type, "manager.connected");
  return {
    socket,
    next,
    messages,
    send(type, requestId) {
      socket.send(JSON.stringify({ protocolVersion: 1, type, requestId }));
    },
  };
}

test("Engine 1 understands ping, id, board, unknown commands, CRLF, and quit", async () => {
  const lines = await runEngine("ping\r\nid\nboard\ninvalid\nquit\nping\n");
  assert.equal(lines[0], "pong");
  assert.equal(lines[1], "id EngineOne 0.2");
  const board = JSON.parse(lines[2]);
  assert.equal(board.cells.length, 91);
  assert.deepEqual(board.players, [0, 1]);
  assert.equal(board.stage, "geometry");
  assert.equal(lines[3], "error unknown_command");
  assert.equal(lines.length, 4);
});

test("Manager routes correlated responses through the real C++ process", async (t) => {
  const manager = await startManager({ port: 0 });
  t.after(() => manager.close());
  const first = await client(manager.port);
  const second = await client(manager.port, "http://127.0.0.1:5173");
  first.send("engine.id", "first-id");
  second.send("engine.ping", "second-ping");
  first.send("engine.board", "first-board");
  const identity = await first.next();
  const pong = await second.next();
  const geometry = await first.next();
  assert.equal(identity.type, "engine.id");
  assert.equal(identity.value, "EngineOne 0.2");
  assert.equal(identity.requestId, "first-id");
  assert.equal(pong.type, "engine.pong");
  assert.equal(pong.requestId, "second-ping");
  assert.equal(geometry.type, "engine.board");
  assert.equal(geometry.requestId, "first-board");
  assert.equal(geometry.board.cells.length, 91);
  assert.equal(identity.protocolVersion, 1);
  assert.equal(first.messages.length, 0);
  assert.equal(second.messages.length, 0);
});

test("Malformed input, unsupported versions, prototype names, and executable fields are rejected", async (t) => {
  const manager = await startManager({ port: 0 });
  t.after(() => manager.close());
  const connection = await client(manager.port);
  for (const raw of ["{broken", "null", "[]", '"text"', '{"type":"engine.ping"}']) {
    connection.socket.send(raw);
    assert.equal((await connection.next()).type, "error");
  }
  for (const request of [
    { protocolVersion: 2, type: "engine.ping", requestId: "bad-version" },
    { protocolVersion: 1, type: "__proto__", requestId: "bad-command" },
    {
      protocolVersion: 1,
      type: "engine.ping",
      requestId: "bad-fields",
      executable: "arbitrary.exe",
    },
  ]) {
    connection.socket.send(JSON.stringify(request));
    const response = await connection.next();
    assert.equal(response.type, "error");
    assert.equal(response.requestId, request.requestId);
  }
  connection.socket.send(Buffer.from("ping"));
  assert.equal((await connection.next()).type, "error");
  connection.send("engine.ping", "still-alive");
  assert.equal((await connection.next()).type, "engine.pong");
});

test("Unapproved and missing origins cannot connect", async (t) => {
  const manager = await startManager({ port: 0 });
  t.after(() => manager.close());
  for (const origin of ["https://example.com", undefined]) {
    const socket = new WebSocket(`ws://127.0.0.1:${manager.port}`, { origin });
    const [error] = await once(socket, "error");
    assert.match(error.message, /401/);
  }
});

test("Oversized WebSocket messages are closed without crashing the manager", async (t) => {
  const manager = await startManager({ port: 0 });
  t.after(() => manager.close());
  const oversized = await client(manager.port);
  const closed = once(oversized.socket, "close");
  oversized.socket.send("x".repeat(2048));
  const [code] = await closed;
  assert.equal(code, 1009);
  const healthy = await client(manager.port);
  healthy.send("engine.ping", "after-oversized");
  assert.equal((await healthy.next()).type, "engine.pong");
});

test("Engine crashes are reported and future commands fail cleanly", async (t) => {
  const manager = await startManager({ port: 0 });
  t.after(() => manager.close());
  const connection = await client(manager.port);
  manager.engine.child.kill("SIGKILL");
  const offline = await connection.next();
  assert.equal(offline.type, "engine.offline");
  connection.send("engine.ping", "after-crash");
  const response = await connection.next();
  assert.equal(response.type, "error");
  assert.match(response.message, /unavailable/i);
});

test("Unresponsive engines time out and reject pending requests", async (t) => {
  // A Node process awaiting EOF does not respond to the temporary engine protocol.
  // This is a local test fixture, never browser-configurable.
  const engine = new EngineProcess({ path: process.execPath }, { timeoutMs: 150 });
  t.after(() => engine.close());
  const first = engine.request("ping");
  const second = engine.request("id");
  const results = await Promise.allSettled([first, second]);
  assert.ok(
    results.every(
      (result) => result.status === "rejected" && /timed out/.test(result.reason.message),
    ),
  );
  await assert.rejects(engine.request("ping"), /unavailable/i);
});

test("Manager shutdown also terminates its native engine", async () => {
  const manager = await startManager({ port: 0 });
  const exited = once(manager.engine.child, "exit");
  await manager.close();
  const [code] = await exited;
  assert.equal(code, 0);
});
