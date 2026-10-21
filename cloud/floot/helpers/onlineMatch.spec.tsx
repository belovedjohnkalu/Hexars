import { decideOnlineMatch,withOnlineResult } from './onlineMatch';
import type { GameView } from '../endpoints/game_POST.schema';
const game=(players=[0,1]):GameView=>({board:{players},activePlayers:players,result:{status:'ongoing',winner:-1,reason:'',scores:[]},legalMoves:[{}]} as unknown as GameView);
describe('Online match decisions',()=>{
 it('requires all active players to agree; repeated votes never count twice',()=>{const g=game([0,1,2]),a=decideOnlineMatch(g,{},0,'draw');expect(a.result).toBeUndefined();expect(decideOnlineMatch(g,a,0,'draw').votes).toEqual([0]);const b=decideOnlineMatch(g,a,1,'draw');expect(b.result).toBeUndefined();expect(decideOnlineMatch(g,b,2,'draw').result?.scores).toEqual([1/3,1/3,1/3]);});
 it('forfeits award the remaining side and split a three-player win',()=>{expect(decideOnlineMatch(game(),{},0,'forfeit').result?.scores).toEqual([0,1]);expect(decideOnlineMatch(game([0,1,2]),{},1,'forfeit').result?.scores).toEqual([.5,0,.5]);});
 it('rejects inactive players and ended games and suppresses further moves',()=>{const g=game();expect(()=>decideOnlineMatch(g,{},2,'draw')).toThrow();const state=decideOnlineMatch(g,{},1,'forfeit');expect(()=>decideOnlineMatch(g,state,0,'draw')).toThrow();expect(withOnlineResult(g,state).legalMoves).toEqual([]);expect(withOnlineResult(g,{})).toBe(g);});
});
