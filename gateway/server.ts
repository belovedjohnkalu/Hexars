import { createServer } from "node:http";
import { proxyApi } from "./proxy.ts";

// Vercel captures this standard Node HTTP entrypoint. Keep binding access in
// proxyApi at request time, never in Vite builds or Routing Middleware.
const server = createServer(async (incoming, outgoing) => {
  const controller = new AbortController();
  incoming.once("aborted", () => controller.abort());
  outgoing.once("close", () => { if (!outgoing.writableEnded) controller.abort(); });
  try {
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of incoming) {
      size += chunk.length;
      if (size > 4096) {
        outgoing.writeHead(413, { "Content-Type": "application/json", "Cache-Control": "no-store" });
        outgoing.end('{"error":"Request too large"}');
        return;
      }
      chunks.push(chunk);
    }
    const headers = new Headers();
    for (const [name, value] of Object.entries(incoming.headers)) {
      if (value) headers.set(name, Array.isArray(value) ? value.join(",") : value);
    }
    const method = incoming.method || "GET";
    const request = new Request(new URL(incoming.url || "/", "http://localhost"), {
      method, headers, signal: controller.signal,
      ...(method !== "GET" && method !== "HEAD" ? { body: Buffer.concat(chunks) } : {}),
    });
    const response = await proxyApi(request);
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch {
    console.error("ION gateway request failed");
    if (!outgoing.headersSent) outgoing.writeHead(503, { "Content-Type": "application/json", "Cache-Control": "no-store" });
    outgoing.end('{"error":"Game service unavailable"}');
  }
});
server.requestTimeout = 15000;
server.headersTimeout = 10000;
server.listen(Number(process.env.PORT || 3001));
