import { useEffect, useRef, useState } from "react";
export function useBoardFacing(gameId:string|undefined,ply:number|undefined,flipped:boolean){
  const [view,setView]=useState({gameId,flipped}),[turning,setTurning]=useState(false),previous=useRef({gameId,ply,flipped});
  useEffect(()=>{
    const before=previous.current;previous.current={gameId,ply,flipped};
    if(!gameId||before.gameId!==gameId||before.flipped===flipped||window.matchMedia("(prefers-reduced-motion: reduce)").matches){setView({gameId,flipped});setTurning(false);return;}
    setTurning(true);
    const delay=before.ply!==ply?220:0,move=setTimeout(()=>setView({gameId,flipped}),delay),finish=setTimeout(()=>setTurning(false),delay+320);
    return()=>{clearTimeout(move);clearTimeout(finish);};
  },[gameId,ply,flipped]);
  return {flipped:view.gameId===gameId?view.flipped:flipped,turning};
}
