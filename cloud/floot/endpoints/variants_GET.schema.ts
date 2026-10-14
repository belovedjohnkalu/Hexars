import { z } from "zod";
import type { GameView, VariantId } from "./game_POST.schema";
export const schema = z.object({});
export type InputType = z.infer<typeof schema>;
export type OutputType = { variants: Array<{ id: VariantId; board: GameView["board"] }> };
export async function getVariants(init?: RequestInit): Promise<OutputType> {
  const response = await fetch("/_api/variants", init);
  if (!response.ok) throw new Error("Boards unavailable");
  return response.json();
}
