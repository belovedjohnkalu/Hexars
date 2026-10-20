import { chessEngines, engineId, engineIds, engineName, isEngineId } from './chessEngines';
import { cloudTree } from './cloudTree';
import { gameSessions } from './gameSessions';
import type { OutputType } from '../endpoints/game_POST.schema';
describe('independent engines',()=>{
 it('provides all three engine names and rejects executable paths',()=>{
  expect(engineIds).toEqual(['tactical','positional','defensive']);
  for(const engine of chessEngines) expect(engineName(engine.id)).toBe(engine.name);
  expect(isEngineId('/tmp/engine')).toBe(false);expect(isEngineId('constructor')).toBe(false);expect(engineId(null)).toBe('tactical');
 });
 it('offers a complete ladder before each engine’s board selection',()=>{
  for(const id of engineIds){expect(cloudTree.seed.find(n=>n.id===id)?.parentId).toBe('engines');expect(cloudTree.seed.filter(n=>n.parentId===id).map(n=>n.level)).toEqual([0,1,2,3,4,5]);}
 });
 it('keeps each engine and level’s resumed game separate',()=>{
  localStorage.clear();
  for(const [i,id] of engineIds.entries()){
   const result={gameId:`00000000-0000-0000-0000-00000000000${i}`,accessToken:String(i).repeat(64),engineId:id,difficulty:3,mode:'engine',game:{variant:'glinski'}} as OutputType;
   gameSessions.save(result);
  }
  for(const [i,id] of engineIds.entries())expect(gameSessions.stored('glinski','engine',id,3)?.accessToken).toBe(String(i).repeat(64));
  expect(gameSessions.stored('glinski','engine','defensive',4)).toBeNull();localStorage.clear();
 });
});
