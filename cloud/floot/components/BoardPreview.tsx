import { useQuery } from "@tanstack/react-query";
import { getVariants } from "../endpoints/variants_GET.schema";
import { CloudBoard } from "./CloudBoard";
import { Spinner } from "./Spinner";
import type { GameView } from "../endpoints/game_POST.schema";
export function BoardPreview({variant}:{variant:"glinski"|"mccooey"}){
 const result=useQuery({queryKey:["starting-boards"],queryFn:()=>getVariants(),staleTime:300000});
 const board=result.data?.variants.find(v=>v.id===variant)?.board;
 if(!board)return <span style={{display:"grid",placeItems:"center",height:"100%"}}>{result.isError?<span>Board unavailable</span>:<Spinner size="sm" aria-label="Loading board"/>}</span>;
 const game:GameView={stateId:"preview-"+variant,variant,board,activePlayer:0,ply:0,check:false,legalMoves:[],result:{status:"ongoing",reason:"",winner:-1,scores:[]}};
 return <CloudBoard game={game} selected={null} onCell={()=>{}} flipped={false} coordinates={false} theme="neutral" preview/>;
}
