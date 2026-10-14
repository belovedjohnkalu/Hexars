import { createHash, timingSafeEqual } from "node:crypto";
import superjson from "superjson";
import type { GameStore } from "./store";
import { gameService } from "./game-service";
import { runNativeEngine } from "./native-engine";

type Options = {
  store: GameStore;
  authenticate: (token: string) => Promise<string | null>;
  gatewaySecret: string;
};
const hash = (value: string) => createHash("sha256").update(value).digest();
const json = (value: unknown, status: number) => new Response(JSON.stringify(value), {
  status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
});
export function createApp(options: Options) {
  if (options.gatewaySecret.length < 32) throw new Error("HEXARS_GATEWAY_SECRET must contain at least 32 characters");
  const trusted = hash(options.gatewaySecret);
  const game = gameService(options.store);
  let boards: string | null = null;
  let loadingBoards: Promise<string> | null = null;
  return async function handle(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/health" && request.method === "GET") return json({ ok: true }, 200);
    if (!timingSafeEqual(trusted, hash(request.headers.get("X-Hexars-Gateway") || ""))) {
      return json({ error: "Not authorized" }, 401);
    }
    if (url.pathname === "/api/variants" && request.method === "GET") {
      try {
        // Native boards are immutable for this release and independent of user games.
        if (!boards && !loadingBoards) {
          loadingBoards = Promise.all((["glinski", "mccooey", "shafran"] as const).map(async id => {
            const result = await runNativeEngine({ action: "new", variant: id });
            return { id, board: result.game.board };
          })).then(variants => boards = JSON.stringify({ variants })).finally(() => { loadingBoards = null; });
        }
        return new Response(boards || await loadingBoards!, {
          headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=300" },
        });
      } catch { return json({ error: "Boards unavailable" }, 503); }
    }
    if (url.pathname !== "/api/game") return json({ error: "Not found" }, 404);
    if (request.method !== "POST") return json({ error: "Use POST" }, 405);
    const token = /^Bearer (\S+)$/.exec(request.headers.get("Authorization") || "")?.[1];
    try {
      const userId = token ? await options.authenticate(token) : null;
      if (!userId) return new Response(superjson.stringify({ error: "Sign in to continue" }), {
        status: 401, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      });
      return game(request, userId);
    } catch {
      return new Response(superjson.stringify({ error: "Sign-in is temporarily unavailable" }), {
        status: 503, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      });
    }
  };
}
