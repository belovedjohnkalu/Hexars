import type { GameView } from "../endpoints/game_POST.schema";
const fraction=(score:number)=>score===.75?'¾':score===.25?'¼':score===.5?'½':Math.abs(score-1/3)<.00001?'⅓':String(score);
export function gameOutcome(result:GameView['result'],mode:string,human:number){
 const title=result.status==='checkmate'?(mode==='engine'?result.winner===human?'You Win':'Tactical Wins':result.winner===0?'White Wins':result.winner===2?'Gold Wins':'Black Wins'):result.status==='stalemate'?'Stalemate':'Draw';
 const scores=result.scores.length>=2?result.scores:result.status==='checkmate'?[result.winner===0?1:0,result.winner===1?1:0]:[.5,.5];
 return {title,score:scores.map(fraction).join(' – '),detail:result.status==='stalemate'&&result.winner>=0?(result.winner===0?'White':'Black')+' ¾':''};
}
