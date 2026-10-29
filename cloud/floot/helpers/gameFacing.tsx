// View orientation only; changing the viewpoint never changes turn ownership.
export function gameFacing(variant:string,player:number,viewOffset=0,followTurn=false):boolean|number {
 if(variant==='wellisch')return -120*((player+viewOffset)%3);
 // Kruzno's unrotated setup places Black at the lower left. In pass and
 // play, turn the board for White after a complete move; other modes keep
 // their established viewpoint. A manual flip remains a relative offset.
 if(variant==='kruzno')return (viewOffset+(followTurn&&player===0?1:0))%2===1;
 return (player+viewOffset)%2===1;
}
