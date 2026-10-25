import type {GameView,ChessMove} from '../endpoints/game_POST.schema';
import {checkersStepView} from './checkersInteraction';
export const CHECKERS_STEP_MS=340;
export const opponentTurn=(mode:string,humanPlayer:number,move:{engine:boolean;player:number})=>move.engine||mode==='online'&&move.player!==humanPlayer;
export function checkersPlayback(before:GameView,after:GameView,move:ChessMove){
 if(!['hexdame','kruzno'].includes(before.variant)||before.variant!==after.variant||after.ply!==before.ply+1)return [];
 const path=move.path?.length?move.path:[move.from,move.to];
 return path.slice(1).map((at,index)=>({game:index===path.length-2?after:checkersStepView(before,path.slice(0,index+2)),move:{from:path[index],to:at} as ChessMove}));
}
