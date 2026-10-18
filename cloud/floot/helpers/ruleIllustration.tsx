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
  if(variant==='wellisch'){
    if(kind==='rook'||kind==='queen')for(const [q,r] of edges)for(let n=1;n<=10;n++){if(!valid.has(key({q:q*n,r:r*n})))break;add(q*n,r*n);}
    if(kind==='knight'||kind==='queen')for(const [q,r]of corners)add(q,r);
    if(kind==='king')for(const [q,r]of edges)add(q,r);
    if(['rook','queen','knight','king'].includes(kind)){pieces.push({...origin,type,player:0});caption=kind==='queen'?'Rook rays and six short knight jumps.':kind==='knight'?'Six short jumps, all on the same cell color.':kind==='king'?'Six edge steps; no vertex steps.':'Six edge rays; pieces block the path.';}
    else if(kind==='advance'||kind==='capture'){pieces.push({...origin,type:'pawn',player:0});add(0,-1);add(1,-1);if(kind==='capture')pieces.push({q:1,r:-1,type:'knight',player:2});caption='Either forward edge cell permits a step or an enemy capture. Never two cells.';}
    else if(kind==='promotion'){put('f10','pawn',0);mark('f11');caption='Reach the opposite edge; choose only a captured piece of this pawn’s original army.';}
    else if(kind==='castle'){put('d1','king',0);put('b1','rook',0);put('e1','rook',0);mark('b1');mark('e1');caption='King d1 swaps with b1 or e1. Rights, empty paths and king safety apply.';}
    else if(kind==='takeover'){put('d1','king',0);put('f6','rook',0);put('f8','king',1);put('g6','pawn',1);put('k9','king',2);mark('f8');caption='The first king capture transfers the defeated army; its pawns keep their direction.';}
    else {put('d1','king',0);put('c8','king',1);put('k9','king',2);if(kind==='check'){put('f1','rook',2);mark('d1');caption='Gold’s rook checks White’s king.';}else caption='Three kings remain until the first takeover. Read the rule for the complete policy.';}
    return {targets,pieces,caption};
  }
  if (["rook","bishop","queen"].includes(kind)) {
    const directions = kind === "rook" ? edges : kind === "bishop" ? corners : [...edges,...corners];
    for (const [q,r] of directions) for (let n=1;n<=10;n++) { if (!valid.has(key({q:q*n,r:r*n}))) break; add(q*n,r*n); }
  } else if (kind === "king") for (const [q,r] of [...edges,...corners]) add(q,r);
  else if (kind === "knight") for (const [q,r] of jumps) add(q,r);
  else if (board.orientation === "pointy") {
    const showPawn=(at:string)=>{origin=cell(at);pieces.push({...origin,type:"pawn",player:0});};
    if(kind==="advance"||kind==="double"){
      showPawn(kind==="double"?(variant==="brusky"?"c2":"c3"):"e4");
      for(const [q,r] of [[0,-1],[1,-1]])for(let n=1;n<=(kind==="double"?2:1);n++)add(origin.q+q*n,origin.r+r*n);
      caption=kind==="double"?"On its first move, a pawn may take one or two empty cells along either single forward axis.":"Two forward choices; occupied paths are blocked.";
    }else if(kind==="capture"||kind==="initial-capture"){
      showPawn(kind==="initial-capture"?(variant==="brusky"?"c2":"c3"):"g5");
      const directions=[[-1,-1],[2,-1],...(kind==="initial-capture"&&variant==="brusky"?[[1,-2]]:[])];
      for(const [q,r]of directions){add(origin.q+q,origin.r+r);if(valid.has(key({q:origin.q+q,r:origin.r+r})))pieces.push({q:origin.q+q,r:origin.r+r,type:"knight",player:1});}
      caption=kind==="initial-capture"&&variant==="brusky"?"An unmoved starting pawn has a third straight-forward capture.":"Side captures land on enemies, on the pawn’s cell color.";
    }else if(kind==="blocked"){
      put("g5","pawn",0);put("h6","pawn",1);if(variant==="devasa")mark("g6");
      caption=variant==="brusky"?"The enemy on h6 blocks both forward advances of g5.":"The enemy on h6 leaves g5–g6 available.";
    }else if(kind==="en-passant"){
      put("g5","pawn",0);put("f5","pawn",1);mark("f6");caption="After Black f7–f5, White g5×f6 removes the pawn on f5.";
    }else if(kind==="promotion"){
      showPawn(variant==="brusky"?"g7":"g8");for(const [q,r]of [[0,-1],[1,-1]])add(origin.q+q,origin.r+r);caption="Either highlighted back-rank destination requires promotion.";
    }else if(kind.startsWith("castle-")){
      const short=kind==="castle-short";put("f1","king",0);put(short?"i1":"a1","rook",0);mark(short?"h1":"c1");mark(short?"g1":"d1");caption=short?"King h1; rook g1. The empty path and every king transit cell must be safe.":"King c1; rook d1. Movement history, empty paths and king safety still apply.";
    }else{
      const fixture:Array<[string,PieceName,number]>=kind==="mate"?(variant==="brusky"?[["a5","king",0],["j4","queen",0],["l4","king",1]]:[["a9","king",0],["g1","queen",0],["i1","king",1]])
        :kind==="stalemate"?(variant==="brusky"?[["h2","king",0],["k6","queen",0],["l4","king",1]]:[["a9","king",0],["g2","queen",0],["i1","king",1]])
        :kind==="check"?[["a1","king",0],["f5","rook",0],[variant==="brusky"?"f8":"f9","king",1]]
        :[["a1","king",0],[variant==="brusky"?"l8":"i9","king",1]];
      for(const [at,type,player]of fixture)put(at,type,player);
      if(["mate","stalemate","check"].includes(kind)){const king=pieces.find(p=>p.player===1)!;targets.add(key(king));caption=kind==="mate"?"Black is checkmated.":kind==="stalemate"?"Black is not in check and has no legal move: ½–½.":"Black’s king is in check.";}else caption="Read the rule text for this draw policy.";
    }
    return {targets,pieces,caption};
  }
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
