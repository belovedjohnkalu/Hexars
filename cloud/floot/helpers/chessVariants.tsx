import type { VariantId } from "../endpoints/game_POST.schema";

// Presentation metadata only. Native C++ supplies every cell, piece and legal move.
const variants = [
  { id: "glinski", name: "Gliński", cells: 91 },
  { id: "mccooey", name: "McCooey", cells: 91 },
  { id: "shafran", name: "Shafran", cells: 70 },
  { id: "brusky", name: "Brusky", cells: 84 },
  { id: "devasa", name: "De Vasa", cells: 81 },
] as const;
export const chessVariants = {
  all: variants,
  isId(value: unknown): value is VariantId {
    return variants.some(variant => variant.id === value);
  },
  name(id: VariantId) {
    return variants.find(variant => variant.id === id)!.name;
  },
};
