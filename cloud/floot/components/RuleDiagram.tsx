import { useQuery } from "@tanstack/react-query";
import { getVariants } from "../endpoints/variants_GET.schema";
import type { VariantId } from "../endpoints/game_POST.schema";
import { boardLayout } from "../helpers/boardLayout";
import { ruleIllustration } from "../helpers/ruleIllustration";
import { chessVariants } from "../helpers/chessVariants";
import { ChessPiece } from "./ChessPiece";
import { BoardPreview } from "./BoardPreview";
import { Spinner } from "./Spinner";
import { Button } from "./Button";
import styles from "./RuleDiagram.module.css";

export function RuleDiagram({kind,variant,thumbnail=false}:{kind:string;variant:VariantId;thumbnail?:boolean}) {
  const query=useQuery({queryKey:["starting-boards"],queryFn:()=>getVariants(),staleTime:300000});
  const board=query.data?.variants.find(v=>v.id===variant)?.board;
  if (kind === "setup") return <BoardPreview variant={variant}/>;
  if (!board) return query.isError ? <div role="alert">Illustration unavailable. <Button variant="link" onClick={()=>void query.refetch()}>Retry</Button></div> : <Spinner size="sm" aria-label="Loading illustration"/>;
  const layout=boardLayout(board.cells,board.orientation),{targets,pieces,caption}=ruleIllustration(board,kind,variant);
  return <figure className={styles.figure}>
    <svg viewBox={layout.viewBox} role="img" aria-label={chessVariants.name(variant)+" "+kind.replace(/-/g," ")+" illustration"} className={styles.diagram}>
      {board.cells.map(cell=>{
        const p=layout.position(cell),points=Array.from({length:6},(_,i)=>{const angle=i*Math.PI/3+layout.vertexAngle;return `${p.x+27.2*Math.cos(angle)},${p.y+27.2*Math.sin(angle)}`;}).join(" ");
        return <polygon key={cell.notation} points={points} fill={targets.has(`${cell.q},${cell.r}`)?"var(--board-legal)":["var(--board-light)","var(--board-medium)","var(--board-dark)"][cell.colour]} stroke="#080c14" strokeWidth="1"/>;
      })}
      {pieces.map((piece,i)=>{const p=layout.position(piece);return <g key={i} transform={`translate(${p.x} ${p.y})`}><ChessPiece type={piece.type} player={piece.player} onBoard/></g>;})}
    </svg>
    {!thumbnail&&<figcaption>{caption}</figcaption>}
  </figure>;
}
