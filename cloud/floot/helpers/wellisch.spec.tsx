import { gameOutcome } from './gameOutcome';
import { wellischRuleClouds } from './wellischRules';
import { variantSchema,schema } from '../endpoints/game_POST.schema';
describe('Wellisch presentation and request contract',()=>{
 it('exposes native-backed navigation with a paragraph per rule',()=>{const nodes=wellischRuleClouds();expect(nodes.find(n=>n.destination==='wellisch')?.isImage).toBe(true);expect(nodes.filter(n=>n.parentId==='wellisch-rules').length).toBe(22);expect(nodes.filter(n=>n.parentId==='wellisch-rules').every(n=>n.note&&n.illustration&&n.variant==='wellisch'&&!n.isImage)).toBe(true);});
 it('accepts the sixth variant and forced-pass payload without opening state loading',()=>{expect(variantSchema.parse('wellisch')).toBe('wellisch');const session={gameId:'00000000-0000-4000-8000-000000000001',accessToken:'a'.repeat(64),version:0};expect(schema.parse({action:'move',...session,move:{from:{q:0,r:0},to:{q:0,r:0},pass:true}}).action).toBe('move');expect(schema.safeParse({action:'position',state:{}}).success).toBe(false);});
 it('names Gold and preserves all three scores',()=>{expect(gameOutcome({status:'checkmate',winner:2,scores:[0,0,1],reason:'Checkmate'},'two_players',0)).toEqual({title:'Gold Wins',score:'0 – 0 – 1',detail:''});expect(gameOutcome({status:'draw',winner:-1,scores:[1/3,1/3,1/3],reason:'Repetition'},'engine',0).score).toBe('⅓ – ⅓ – ⅓');expect(gameOutcome({status:'draw',winner:-1,scores:[.5,0,.5],reason:'Stalemate'},'two_players',0).score).toBe('½ – 0 – ½');});
});
