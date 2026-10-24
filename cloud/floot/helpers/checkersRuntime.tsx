import { createCheckers,readCheckers,isCheckers,checkersView,generateCheckersMoves,checkersResult,advanceCheckers,applyCheckersMove,type CheckersState,type CheckersMove } from './checkersRules';
import { tacticalLevels } from './tacticalLevels';
import type { ChessMove,GameView,SearchDiagnostics } from '../endpoints/game_POST.schema';
import type { Json } from './schema';
type Options={action:'new'|'inspect'|'move'|'search';variant?:string;state?:unknown;move?:ChessMove;difficulty?:number;engineId?:string;signal?:AbortSignal};
const cancelled=()=>Object.assign(new Error('Game request cancelled'),{status:499});
function evaluate(state:CheckersState){let score=0;for(const p of state.pieces){const sign=p.player===state.activePlayer?1:-1,advance=p.player===0?p.r+(p.q+p.r):-(p.r+(p.q+p.r));score+=sign*((p.type==='draughts-king'?340:100)+(state.variant==='hexdame'&&p.type==='man'?advance*3:0)+Math.max(0,5-Math.max(Math.abs(p.q),Math.abs(p.r),Math.abs(p.q+p.r)))*2);}return score;}
export async function searchCheckers(state:CheckersState,level=3,signal?:AbortSignal){
 const legal=generateCheckersMoves(state);if(checkersResult(state,legal).status!=='ongoing')throw new Error('Game has ended');
 const limits=tacticalLevels[Math.max(0,Math.min(5,level))].limits,started=Date.now();let nodes=0,depthDone=0,best=legal[0],score=0;
 const halt={};
 function visit(s:CheckersState,depth:number,alpha:number,beta:number):number{
  if(signal?.aborted)throw cancelled();if(++nodes>limits.nodeLimit||Date.now()-started>=limits.timeMs)throw halt;
  const moves=generateCheckersMoves(s),result=checkersResult(s,moves);if(result.status!=='ongoing')return result.winner<0?0:result.winner===s.activePlayer?100000+depth:-100000-depth;
  if(depth<=0)return evaluate(s);
  let value=-Infinity;for(const m of moves.sort((a,b)=>b.captures.length-a.captures.length)){value=Math.max(value,-visit(advanceCheckers(s,m),depth-1,-beta,-alpha));alpha=Math.max(alpha,value);if(alpha>=beta)break;}return value;
 }
 for(let depth=1;depth<=limits.depth;depth++){
  await new Promise(resolve=>setTimeout(resolve,0));if(signal?.aborted)throw cancelled();let candidate=best,value=-Infinity;
  try{for(const m of [best,...legal.filter(m=>m!==best)]){const next=-visit(advanceCheckers(state,m),depth-1,-Infinity,-value);if(next>value){value=next;candidate=m;}}best=candidate;score=value;depthDone=depth;}catch(e){if(e!==halt)throw e;break;}
 }
 const randomized=level===0&&Math.random()<.5;if(randomized)best=legal[Math.floor(Math.random()*legal.length)];
 return{move:best,diagnostics:{nodes,depth:depthDone,timeMs:Date.now()-started,score:score/100,...(randomized?{randomized:true}:{})} satisfies SearchDiagnostics};
}
export async function runCheckers(options:Options){
 if(options.signal?.aborted)throw cancelled();
 const state=options.action==='new'&&isCheckers(options.variant)?createCheckers(options.variant):readCheckers(options.state);let next=state,appliedMove:CheckersMove|undefined,previousGame:GameView|undefined,diagnostics:SearchDiagnostics|null=null;
 if(options.action==='move'||options.action==='search'){
  if(options.action==='search'&&options.engineId&&options.engineId!=='universal')throw Object.assign(new Error('Choose Computer for checkers.'),{status:400});
  previousGame=checkersView(state);let move=options.move;
  if(options.action==='search'){const result=await searchCheckers(state,options.difficulty,options.signal);move=result.move;diagnostics=result.diagnostics;}
  if(!move)throw new Error('Illegal move');const applied=applyCheckersMove(state,move);next=applied.state;appliedMove=previousGame.legalMoves.find(m=>JSON.stringify(m.path)===JSON.stringify(applied.move.path)) as CheckersMove;
 }
 return{engine:'Computer',state:next as unknown as Json,game:checkersView(next),previousGame,appliedMove,diagnostics};
}
