const failure = (status: number, error: string) => Response.json({ error }, {
  status,
  headers: { "Cache-Control": "no-store" },
});

// Called only by the gateway's Node runtime. Bindings do not exist in Vite's
// browser bundle or at build time; never give this variable a VITE_ prefix.
export async function proxyApi(request: Request): Promise<Response> {
  const path = new URL(request.url).pathname;
  if (path !== "/api/game" && path !== "/api/variants") return failure(404, "Not found");
  if (request.method !== (path === "/api/game" ? "POST" : "GET")) {
    return failure(405, "Method unavailable");
  }
  try {
    const boundUrl = process.env.HEXARS_API_URL;
    const secret = process.env.HEXARS_GATEWAY_SECRET;
    if (!boundUrl || !secret || secret.length < 32) return failure(503, "Game service unavailable");
    const base = new URL(boundUrl);
    if (!["http:", "https:"].includes(base.protocol) || base.username || base.password || base.search || base.hash) {
      return failure(503, "Game service unavailable");
    }
    // Preserve any base path supplied by the service binding. Browser query
    // parameters and headers cannot select a different upstream or route.
    if (!base.pathname.endsWith("/")) base.pathname += "/";
    const target = new URL(path.slice(1), base);
    let body: Uint8Array<ArrayBuffer> | undefined;
    if (request.method === "POST") {
      const reader = request.body?.getReader();
      if (reader) {
        const chunks: Uint8Array[] = [];
        let size = 0;
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            size += value.byteLength;
            if (size > 4096) {
              await reader.cancel();
              return failure(413, "Request too large");
            }
            chunks.push(value);
          }
        } finally { reader.releaseLock(); }
        body = new Uint8Array(size);
        let offset = 0;
        for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
      }
    }
    const headers = new Headers({
      "Content-Type": "application/json",
      "X-Hexars-Gateway": secret,
    });
    const bearer = request.headers.get("Authorization");
    if (bearer) headers.set("Authorization", bearer);
    const response = await fetch(target, {
      method: request.method,
      body,
      headers,
      redirect: "manual",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(25000)]),
    });
    if (response.status >= 300 && response.status < 400) return failure(502, "Game service unavailable");
    return new Response(response.body, {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": path === "/api/variants" && response.ok ? "public, max-age=300" : "no-store",
      },
    });
  } catch (error) {
    if (!request.signal.aborted) console.error("ION API proxy failed", error instanceof Error ? error.name : "Unknown error");
    return failure(503, "Game service unavailable");
  }
}
