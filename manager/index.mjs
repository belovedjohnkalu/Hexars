import { fileURLToPath } from "node:url";
import path from "node:path";
import { WebSocket, WebSocketServer } from "ws";
import { EngineProcess } from "./engine-process.mjs";
import { engines, allowedOrigins } from "./engines.mjs";

const version = 1;
const commands = { "engine.ping": "ping", "engine.id": "id", "engine.board": "board" };

export async function startManager({ port = 8765, timeoutMs = 3000 } = {}) {
  const engine = new EngineProcess(engines["engine-1"], { timeoutMs });
  const wss = new WebSocketServer({
    host: "127.0.0.1",
    port,
    maxPayload: 1024,
    perMessageDeflate: false,
    verifyClient: ({ origin }) => allowedOrigins.has(origin),
  });
  const send = (socket, message) => {
    if (socket.readyState === WebSocket.OPEN)
      socket.send(JSON.stringify({ protocolVersion: version, ...message }));
  };
  engine.on("unavailable", (message) => {
    for (const socket of wss.clients) send(socket, { type: "engine.offline", message });
  });
  wss.on("connection", (socket) => {
    send(socket, { type: "manager.connected", engineId: "engine-1", stage: "foundation" });
    socket.on("error", () => {}); // ws reports invalid frames; keep the service alive.
    const pendingIds = new Set();
    socket.on("message", async (raw, binary) => {
      let message;
      try {
        if (binary) throw new Error("Expected a JSON text message");
        message = JSON.parse(raw.toString());
        if (
          !message ||
          typeof message !== "object" ||
          Array.isArray(message) ||
          typeof message.type !== "string" ||
          typeof message.requestId !== "string" ||
          !/^[A-Za-z0-9_-]{1,64}$/.test(message.requestId)
        )
          throw new Error("Invalid request");
      } catch (error) {
        send(socket, { type: "error", message: error.message });
        return;
      }
      const requestId = message.requestId;
      if (message.protocolVersion !== version) {
        send(socket, { type: "error", requestId, message: "Unsupported protocol version" });
        return;
      }
      if (
        !Object.hasOwn(commands, message.type) ||
        Object.keys(message).some((key) => !["protocolVersion", "type", "requestId"].includes(key))
      ) {
        send(socket, { type: "error", requestId, message: "Unsupported command or fields" });
        return;
      }
      if (pendingIds.has(requestId)) {
        send(socket, { type: "error", requestId, message: "Duplicate pending request ID" });
        return;
      }
      pendingIds.add(requestId);
      try {
        // Requests are serialized to match the temporary line protocol. Each
        // response is returned only to the requesting client, never broadcast.
        const result = await engine.request(commands[message.type]);
        send(socket, { ...result, requestId });
      } catch (error) {
        send(socket, { type: "error", requestId, message: error.message });
      } finally {
        pendingIds.delete(requestId);
      }
    });
  });

  try {
    await new Promise((resolve, reject) => {
      wss.once("listening", resolve);
      wss.once("error", reject);
    });
  } catch (error) {
    await engine.close();
    throw error;
  }
  wss.on("error", (error) => console.error("Manager WebSocket error:", error.message));
  return {
    wss,
    engine,
    port: wss.address().port,
    async close() {
      for (const socket of wss.clients) socket.terminate();
      await Promise.all([new Promise((resolve) => wss.close(resolve)), engine.close()]);
    },
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const manager = await startManager();
    console.log(`HexChess manager running at ws://127.0.0.1:${manager.port}`);
    let stopping = false;
    const stop = async () => {
      if (stopping) return;
      stopping = true;
      await manager.close();
    };
    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);
  } catch (error) {
    console.error(`HexChess manager: ${error.message}`);
    process.exitCode = 1;
  }
}
