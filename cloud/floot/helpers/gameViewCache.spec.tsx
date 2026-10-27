import { gameViewCache } from './gameViewCache';
import type { GameView } from '../endpoints/game_POST.schema';
describe('Validated board view cache',()=>{
  const view={variant:'glinski',ply:6,board:{variant:'glinski',cells:Array.from({length:91},()=>({}))},legalMoves:[],result:{status:'ongoing'}} as unknown as GameView;
  it('reuses only the current executable build and matching position metadata',()=>{const code=gameViewCache.code('glinski','universal'),state={variant:'glinski',ply:6};expect(gameViewCache.read(view,code,state,'universal')).toBe(view);expect(gameViewCache.read(view,'old-build',state,'universal')).toBeNull();expect(gameViewCache.read(view,code,{...state,ply:7},'universal')).toBeNull();expect(gameViewCache.read({...view,board:{...view.board,cells:[]}},code,state,'universal')).toBeNull();expect(gameViewCache.read(view,code,{variant:'mccooey',ply:6},'universal')).toBeNull();});
});
