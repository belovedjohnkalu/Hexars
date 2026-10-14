import { createServer } from "node:http";
import { createClient } from "@supabase/supabase-js";
import { createApp } from "./app";
import { SupabaseGameStore } from "./supabase-store";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}
const supabase = createClient(required("SUPABASE_URL"), required("SUPABASE_SECRET_KEY"), {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(10000) }) },
});
const handle = createApp({
  store: new SupabaseGameStore(supabase),
  gatewaySecret: required("HEXARS_GATEWAY_SECRET"),
  authenticate: async token => {
    // Verify the signed token with Supabase; do not trust a decoded JWT payload.
    const { data, error } = await supabase.auth.getUser(token);
    if (error && error.status && error.status >= 500) throw new Error("Auth service unavailable");
    return error ? null : data.user?.id || null;
  },
});
const server = createServer(async (incoming, outgoing) => {
  const abort = new AbortController();
  incoming.once("aborted", () => abort.abort());
  outgoing.once("close", () => { if (!outgoing.writableEnded) abort.abort(); });
  try {
    const chunks: Buffer[] = [];
    let length = 0;
    for await (const chunk of incoming) {
      length += chunk.length;
      if (length > 4096) {
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
      method, headers, signal: abort.signal,
      ...(method !== "GET" && method !== "HEAD" ? { body: Buffer.concat(chunks) } : {}),
    });
    const response = await handle(request);
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch {
    if (!outgoing.headersSent) outgoing.writeHead(503, { "Content-Type": "application/json", "Cache-Control": "no-store" });
    outgoing.end('{"error":"Game unavailable"}');
  }
});
server.requestTimeout = 15000;
server.headersTimeout = 10000;
server.listen(Number(process.env.PORT || 8080), "0.0.0.0", () => console.log("HEXARS API ready"));
for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.once(signal, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 7000).unref();
  });
}
