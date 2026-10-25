import { chessEngines, engineId, engineIds, engineName, isEngineId } from './chessEngines';
import { cloudTree } from './cloudTree';
import { gameSessions } from './gameSessions';
import type { OutputType } from '../endpoints/game_POST.schema';
describe('Computer and saved-game compatibility',()=>{
 it('keeps legacy engine IDs private to saved-game compatibility and rejects executable paths',()=>{
  expect(engineIds).toEqual(['tactical','positional','defensive','materialist','unconventional','universal']);
  for(const engine of chessEngines) expect(engineName(engine.id)).toBe('Computer');
  expect(isEngineId('universal')).toBe(true);expect(isEngineId('/tmp/engine')).toBe(false);expect(isEngineId('constructor')).toBe(false);expect(engineId(null)).toBe('universal');
 });
 it('offers one six-level Computer ladder without legacy personalities',()=>{expect(cloudTree.seed.find(n=>n.id==='engines')?.name).toBe('Computer');expect(cloudTree.seed.filter(n=>n.parentId==='engines').map(n=>n.level)).toEqual([0,1,2,3,4,5]);for(const id of engineIds)expect(cloudTree.seed.some(n=>n.id===id)).toBeFalse();expect(cloudTree.seed.filter(n=>n.parentId==='engines').every(n=>n.engineId==='universal')).toBeTrue();});
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
