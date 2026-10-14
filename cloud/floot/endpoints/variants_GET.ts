import { runNativeEngine } from "../helpers/runNativeEngine";
import type { VariantId } from "./game_POST.schema";
import type { OutputType } from "./variants_GET.schema";
export async function handle(request: Request) {
  try {
    const ids: VariantId[] = ["glinski", "mccooey"];
    // Read-only: native starting positions, no saved-game rows or credentials.
    const variants = await Promise.all(ids.map(async id => {
      const result = await runNativeEngine({ action: "new", variant: id, origin: request.url, signal: request.signal });
      return { id, board: result.game.board };
    }));
    return new Response(JSON.stringify({ variants } satisfies OutputType), {
      headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=300" },
    });
  } catch (error) {
    console.error("Starting boards unavailable:", error instanceof Error ? error.message : "Unknown error");
    return new Response(JSON.stringify({ error: "Boards unavailable" }), { status: 503, headers: { "Content-Type": "application/json" } });
  }
}
