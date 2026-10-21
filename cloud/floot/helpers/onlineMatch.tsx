import type { GameView } from '../endpoints/game_POST.schema';
export type OnlineMatchState={votes?:number[];result?:GameView['result']};
export function onlineMatchState(value:unknown):OnlineMatchState{
 if(!value||typeof value!=='object'||Array.isArray(value))return {};
 return value as OnlineMatchState;
}
export function withOnlineResult(game:GameView,state:unknown):GameView{
 const result=onlineMatchState(state).result;
 return result?{...game,result,legalMoves:[]}:game;
}
export function decideOnlineMatch(game:GameView,state:OnlineMatchState,seat:number,action:'forfeit'|'draw'):OnlineMatchState{
 if(game.result.status!=='ongoing'||state.result)throw Object.assign(new Error('This match has ended.'),{status:409});
 const players=game.activePlayers??game.board.players;
 if(!players.includes(seat))throw Object.assign(new Error('You are no longer playing in this match.'),{status:403});
 if(action==='forfeit'){
  const winners=players.filter(p=>p!==seat);
  return {votes:[],result:{status:'draw',reason:'forfeit:'+seat,winner:winners.length===1?winners[0]:-1,scores:game.board.players.map(p=>winners.includes(p)?1/winners.length:0)}};
 }
 const votes=[...new Set([...(state.votes??[]).filter(p=>players.includes(p)),seat])];
 return players.every(p=>votes.includes(p))?{votes:[],result:{status:'draw',reason:'agreed',winner:-1,scores:game.board.players.map(p=>players.includes(p)?1/players.length:0)}}:{votes};
}
