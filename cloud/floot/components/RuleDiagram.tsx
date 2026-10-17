import { useQuery } from "@tanstack/react-query";
import { getVariants } from "../endpoints/variants_GET.schema";
import type { Hex,PieceName } from "../endpoints/game_POST.schema";
import { ChessPiece } from "./ChessPiece";
import { BoardPreview } from "./BoardPreview";
import { Spinner } from "./Spinner";
import styles from "./RuleDiagram.module.css";
const edges=[[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]],corners=[[1,1],[-1,2],[-2,1],[-1,-1],[1,-2],[2,-1]],jumps=[[3,-1],[2,1],[1,2],[-1,3],[-2,3],[-3,2],[-3,1],[-2,-1],[-1,-2],[1,-3],[2,-3],[3,-2]];
const xy=(h:Hex)=>({x:300+42*h.q,y:300-28*Math.sqrt(3)*(h.r+h.q/2)}),key=(h:Hex)=>h.q+','+h.r;
export function RuleDiagram({kind,variant,thumbnail=false}:{kind:string;variant:'glinski'|'mccooey';thumbnail?:boolean}){
 const {data}=useQuery({queryKey:['starting-boards'],queryFn:()=>getVariants(),staleTime:300000});const board=data?.variants.find(v=>v.id===variant)?.board;
 if(kind==='setup')return <BoardPreview variant={variant}/>;
 if(!board)return <Spinner size="sm" aria-label="Loading illustration"/>;
 const valid=new Set(board.cells.map(key)),targets=new Set<string>();let origin:Hex={q:0,r:0};let type:PieceName=['rook','bishop','queen','king','knight'].includes(kind)?kind as PieceName:'pawn';let pieces:Array<Hex&{type:PieceName;player:number}>=[];
 function add(q:number,r:number){const h={q,r};if(valid.has(key(h)))targets.add(key(h));}
 if(['rook','bishop','queen'].includes(kind)){const dirs=kind==='rook'?edges:kind==='bishop'?corners:[...edges,...corners];for(const [q,r] of dirs)for(let n=1;n<=5;n++)add(q*n,r*n);}
 else if(kind==='king')for(const [q,r] of [...edges,...corners])add(q,r);
 else if(kind==='knight')for(const [q,r] of jumps)add(q,r);
 else if(kind==='capture')for(const [q,r] of variant==='glinski'?[[1,0],[-1,1]]:[[1,1],[-1,2]]){add(q,r);pieces.push({q,r,type:'pawn',player:1});}
 else if(kind==='double'){origin=variant==='mccooey'?{q:-1,r:-2}:{q:0,r:-1};add(origin.q,origin.r+1);add(origin.q,origin.r+2);}
 else if(kind==='promotion'){origin={q:0,r:4};add(0,5);pieces.push({q:0,r:5,type:'queen',player:0});}
 else if(kind==='en-passant'){add(1,variant==='glinski'?0:1);pieces.push({q:1,r:variant==='glinski'?-1:0,type:'pawn',player:1});}
 else if(kind==='advance')add(0,1);
 else {
  const fixture=kind==='mate'?[['f9','king',0],['g9','bishop',0],['f11','king',1]]:kind==='stalemate'?[['h8','king',0],['e8','queen',0],['f11','king',1]]:kind==='check'?[['g1','king',0],['f5','rook',0],['f9','king',1]]:[['g1','king',0],['g10','king',1]];
  pieces=fixture.map(([notation,piece,player])=>({...board.cells.find(c=>c.notation===notation)!,type:piece as PieceName,player:Number(player)}));
  if(['mate','stalemate','check'].includes(kind)){const king=pieces.find(p=>p.player===1)!;targets.add(key(king));}
 }
 if(['rook','bishop','queen','king','knight','capture','double','promotion','en-passant','advance'].includes(kind))pieces.unshift({...origin,type,player:0});
 return <figure className={styles.figure}><svg viewBox="58 26 484 548" role="img" aria-label={variant+' '+kind+' illustration'} className={styles.diagram}>
 {board.cells.map(c=>{const p=xy(c),points=Array.from({length:6},(_,i)=>{const a=i*Math.PI/3;return `${p.x+27.2*Math.cos(a)},${p.y+27.2*Math.sin(a)}`;}).join(' ');return <polygon key={key(c)} points={points} fill={targets.has(key(c))?'#448ddb':['#14243b','#294463','#4b7196'][c.colour]} stroke="#080c14" strokeWidth="1"/>;})}
 {pieces.map((p,i)=>{const point=xy(p);return <g key={i} transform={`translate(${point.x} ${point.y})`}><ChessPiece type={p.type} player={p.player} onBoard/></g>;})}
 </svg>{!thumbnail&&<figcaption>{['mate','stalemate','check'].includes(kind)?'Example position.':targets.size?'Highlighted cells illustrate movement. Check and blockers still apply.':'Draw-rule illustration.'}</figcaption>}</figure>;
}
