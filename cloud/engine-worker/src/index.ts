import { Container, getContainer } from "@cloudflare/containers";

interface Env {
  HEXARS_API: DurableObjectNamespace<HexarsApi>;
  SUPABASE_URL: string;
  SUPABASE_SECRET_KEY: string;
  HEXARS_GATEWAY_SECRET: string;
}
export class HexarsApi extends Container<Env> {
  defaultPort = 8080;
  sleepAfter = "2m";
  constructor(ctx: DurableObjectState<{}>, env: Env) {
    super(ctx, env);
    this.envVars = {
      PORT: "8080",
      SUPABASE_URL: env.SUPABASE_URL,
      SUPABASE_SECRET_KEY: env.SUPABASE_SECRET_KEY,
      HEXARS_GATEWAY_SECRET: env.HEXARS_GATEWAY_SECRET,
    };
  }
}
async function trusted(request: Request, secret?: string) {
  if (!secret) return false;
  const digest = async (value: string) => new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
  const [actual, expected] = await Promise.all([digest(request.headers.get("X-Hexars-Gateway") || ""), digest(secret)]);
  let difference = 0;
  for (let i = 0; i < actual.length; i++) difference |= actual[i] ^ expected[i];
  return difference === 0;
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const path = new URL(request.url).pathname;
    if (!await trusted(request, env.HEXARS_GATEWAY_SECRET)) return new Response("Unauthorized", { status: 401 });
    if (path !== "/api/game" && path !== "/api/variants") return new Response("Not found", { status: 404 });
    try { return await getContainer(env.HEXARS_API, "hexars-api").fetch(request); }
    catch { return new Response('{"error":"Game unavailable"}', { status: 503, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }); }
  },
};
