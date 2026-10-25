import { gameOutcome } from "./gameOutcome";
describe('Game result announcement',()=>{
 it('names the human or Computer and preserves White–Black score order',()=>{
 const result={status:'checkmate' as const,winner:1,scores:[0,1],reason:''};
 expect(gameOutcome(result,'engine',0)).toEqual({title:'Computer Wins',score:'0 – 1',detail:''});
 expect(gameOutcome(result,'engine',1).title).toBe('You Win');expect(gameOutcome(result,'two_players',0).title).toBe('Black Wins');
 });
 it('names each independent engine when it wins',()=>{for(const engine of ['Positional','Defensive','Materialist','Unconventional'])expect(gameOutcome({status:'checkmate',winner:1,scores:[0,1],reason:''},'engine',0,engine).title).toBe(engine+' Wins');});
 it('distinguishes a fractional stalemate from an equal stalemate',()=>{
 expect(gameOutcome({status:'stalemate',winner:1,scores:[.25,.75],reason:''},'engine',0)).toEqual({title:'Stalemate',score:'¼ – ¾',detail:'Black ¾'});
 expect(gameOutcome({status:'stalemate',winner:-1,scores:[.5,.5],reason:''},'two_players',0)).toEqual({title:'Stalemate',score:'½ – ½',detail:''});
 });
 it('announces online forfeits for both players',()=>{const result={status:'draw' as const,winner:1,scores:[0,1],reason:'forfeit:0'};expect(gameOutcome(result,'online',0).title).toBe('You Lose');expect(gameOutcome(result,'online',1).title).toBe('You Win');});
 it('announces automatic draws without naming a winner',()=>{expect(gameOutcome({status:'draw',winner:-1,scores:[.5,.5],reason:'material'},'engine',0)).toEqual({title:'Draw',score:'½ – ½',detail:''});});
});
