import type { GameView, Hex, PieceName, VariantId } from "../endpoints/game_POST.schema";

type DiagramPiece = Hex & { type: PieceName; player: number };
const key = (h: Hex) => `${h.q},${h.r}`;
const edges = [[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]];
const corners = [[1,1],[-1,2],[-2,1],[-1,-1],[1,-2],[2,-1]];
const jumps = [[3,-1],[2,1],[1,2],[-1,3],[-2,3],[-3,2],[-3,1],[-2,-1],[-1,-2],[1,-3],[2,-3],[3,-2]];

// Teaching pictures only. The board shape and notation are supplied by C++;
// these examples never generate or authorize moves in a game.
export function ruleIllustration(board: GameView["board"], kind: string, variant: VariantId) {
  const valid = new Set(board.cells.map(key)), targets = new Set<string>();
  let origin: Hex = { q: 0, r: 0 };
  const type: PieceName = ["rook","bishop","queen","king","knight"].includes(kind) ? kind as PieceName : "pawn";
  let pieces: DiagramPiece[] = [];
  let caption = "Highlighted cells illustrate movement. Check and blockers still apply.";
  const add = (q: number, r: number) => { if (valid.has(key({q,r}))) targets.add(key({q,r})); };
  const cell = (notation: string) => {
    const found = board.cells.find(c => c.notation === notation);
    if (!found) throw new Error("Illustration cell missing: " + notation);
    return { q: found.q, r: found.r };
  };
  const put = (notation: string, type: PieceName, player: number) => pieces.push({...cell(notation),type,player});
  const mark = (notation: string) => { const h = cell(notation); add(h.q,h.r); };
  if (["rook","bishop","queen"].includes(kind)) {
    const directions = kind === "rook" ? edges : kind === "bishop" ? corners : [...edges,...corners];
    for (const [q,r] of directions) for (let n=1;n<=10;n++) { if (!valid.has(key({q:q*n,r:r*n}))) break; add(q*n,r*n); }
  } else if (kind === "king") for (const [q,r] of [...edges,...corners]) add(q,r);
  else if (kind === "knight") for (const [q,r] of jumps) add(q,r);
  else if (kind === "capture") for (const [q,r] of variant === "glinski" ? [[1,0],[-1,1]] : [[1,1],[-1,2]]) { add(q,r); pieces.push({q,r,type:"pawn",player:1}); }
  else if (kind === "triple") { origin=cell("e2"); for(let step=1;step<=3;step++) add(origin.q,origin.r+step); caption="White’s e-pawn can advance up to three empty cells on its first move."; }
  else if (kind === "double") { origin=variant === "mccooey" ? {q:-1,r:-2} : {q:0,r:-1}; add(origin.q,origin.r+1); add(origin.q,origin.r+2); }
  else if (kind === "promotion") { origin=variant === "shafran" ? cell("e9") : {q:0,r:4}; add(origin.q,origin.r+1); caption="The highlighted edge cell requires a choice of queen, rook, bishop or knight."; }
  else if (kind === "en-passant" && variant === "shafran") {
    put("e6","pawn",0); put("c4","pawn",0); put("d5","pawn",1); mark("d7"); mark("d6");
    caption="After Black d8–d5, either White pawn may capture on its highlighted crossed cell, removing d5.";
  } else if (kind === "en-passant") { add(1,variant === "glinski" ? 0 : 1); pieces.push({q:1,r:variant === "glinski" ? -1 : 0,type:"pawn",player:1}); }
  else if (kind === "advance") add(0,1);
  else if (kind.startsWith("castle-")) {
    put("e1","king",0);
    const queen = kind === "castle-queen";
    put(queen ? "a1" : "i5","rook",0);
    for (const notation of queen ? ["c1","b1"] : ["g3","h4"]) mark(notation);
    caption=queen ? "King destinations: short c1 or long b1. The rook finishes on d1 or c1, respectively." : "King destinations: short g3 or long h4. The rook finishes on f2 or g3, respectively.";
  } else {
    const fixture: Array<[string,PieceName,number]> = variant === "shafran"
      ? kind === "mate" ? [["a1","king",0],["e8","queen",0],["e10","king",1]]
      : kind === "stalemate" ? [["b7","king",0],["g9","queen",0],["e10","king",1]]
      : kind === "check" ? [["a1","king",0],["e6","rook",0],["e10","king",1]]
      : [["a1","king",0],["i10","king",1]]
      : kind === "mate" ? [["f9","king",0],["g9","bishop",0],["f11","king",1]]
      : kind === "stalemate" ? [["h8","king",0],["e8","queen",0],["f11","king",1]]
      : kind === "check" ? [["g1","king",0],["f5","rook",0],["f9","king",1]]
      : [["g1","king",0],["g10","king",1]];
    for (const [notation,piece,player] of fixture) put(notation,piece,player);
    if (["mate","stalemate","check"].includes(kind)) { const king=pieces.find(p=>p.player===1)!; targets.add(key(king)); caption="Example position."; }
    else caption="Draw-rule illustration.";
  }
  if (["rook","bishop","queen","king","knight","capture","double","promotion","advance","triple"].includes(kind) || kind === "en-passant" && variant !== "shafran") pieces.unshift({...origin,type,player:0});
  return { targets, pieces, caption };
}
