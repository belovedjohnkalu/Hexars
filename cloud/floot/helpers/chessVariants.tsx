import type { VariantId } from "../endpoints/game_POST.schema";

// Presentation metadata only. The authoritative cloud rules supply cells, pieces and legal moves.
const variants = [
  { id: "glinski", name: "Gliński", cells: 91 },
  { id: "mccooey", name: "McCooey", cells: 91 },
  { id: "shafran", name: "Shafran", cells: 70 },
  { id: "brusky", name: "Brusky", cells: 84 },
  { id: "devasa", name: "De Vasa", cells: 81 },
  { id: "wellisch", name: "Wellisch", cells: 91 },
  { id:"hexdame",name:"HexDame",cells:61 },
  { id:"kruzno",name:"Kruzno",cells:91 },
] as const;
export const chessVariants = {
  all: variants,
  isCheckers(value:unknown){return value==='hexdame'||value==='kruzno';},
  label(id:VariantId){return id==='hexdame'?'HexDame':id==='kruzno'?'Kruzno’s Checkers':variants.find(v=>v.id===id)!.name+'’s Variant';},
  isId(value: unknown): value is VariantId {
    return variants.some(variant => variant.id === value);
  },
  name(id: VariantId) {
    return variants.find(variant => variant.id === id)!.name;
  },
};
