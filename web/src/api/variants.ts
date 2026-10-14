import type { GameView, VariantId } from "../../../shared/protocol/contracts";
export type OutputType = { variants: Array<{ id: VariantId; board: GameView["board"] }> };
export async function getVariants(init?: RequestInit): Promise<OutputType> {
  const response = await fetch("/api/variants", init);
  if (!response.ok) throw new Error("Boards unavailable");
  return response.json();
}
