const failure = (status, error) => new Response(JSON.stringify({ error }), {
  status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
});

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
    if (url.pathname !== "/api/game" && url.pathname !== "/api/variants") return failure(404, "Not found");
    if (request.method !== (url.pathname === "/api/game" ? "POST" : "GET")) return failure(405, "Method unavailable");
    try {
      const backend = new URL(env.HEXARS_API_ORIGIN);
      if (backend.protocol !== "https:" || backend.username || backend.password || backend.pathname !== "/" || backend.search || backend.hash || !env.HEXARS_GATEWAY_SECRET) {
        return failure(503, "Game service unavailable");
      }
      const body = request.method === "POST" ? await request.arrayBuffer() : undefined;
      if (body && body.byteLength > 4096) return failure(413, "Request too large");
      const headers = new Headers({ "Content-Type": "application/json", "X-Hexars-Gateway": env.HEXARS_GATEWAY_SECRET });
      const bearer = request.headers.get("Authorization");
      if (bearer) headers.set("Authorization", bearer);
      const response = await fetch(new URL(url.pathname, backend), {
        method: request.method, body, headers, redirect: "manual", signal: AbortSignal.timeout(25000),
      });
      if (response.status >= 300 && response.status < 400) return failure(502, "Game service unavailable");
      const safe = new Headers({
        "Content-Type": "application/json",
        "Cache-Control": url.pathname === "/api/variants" && response.ok ? "public, max-age=300" : "no-store",
      });
      return new Response(response.body, { status: response.status, headers: safe });
    } catch { return failure(503, "Game service unavailable"); }
  },
};
