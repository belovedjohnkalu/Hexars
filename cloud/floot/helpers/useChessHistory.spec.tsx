import { act,cleanup,renderHook,waitFor } from '@testing-library/react';
import { useChessHistory } from './useChessHistory';
import { RealtimeClient } from './RealtimeClient';
const oldNode={id:'old-history',parentId:'chess-history',name:'Previous account game'},newNode={id:'new-history',parentId:'chess-history',name:'Current account game'};
const gameId='00000000-0000-4000-8000-000000000041',undo=()=>({gameId,removedAt:new Date().toISOString(),expiresAt:Date.now()+10000});
const response=(nodes:unknown[]=[],extra:Record<string,unknown>={})=>new Response(JSON.stringify({games:[],nodes,...extra}),{status:200});
const until=(predicate:()=>boolean)=>waitFor(()=>{if(!predicate())throw new Error('Waiting for Library state');});
describe('Library loading and account recovery',()=>{
 beforeEach(()=>{localStorage.clear();spyOn(RealtimeClient.prototype,'connect').and.callFake(async()=>{});});
 afterEach(()=>{cleanup();localStorage.clear();});
 it('stops loading when leaving Chess while history is pending and ignores the late response',async()=>{
  let release:((value:Response)=>void)|undefined;spyOn(globalThis,'fetch').and.callFake(async()=>new Promise<Response>(resolve=>{release=resolve;}));
  const {result,rerender}=renderHook(({enabled})=>useChessHistory(1,enabled),{initialProps:{enabled:true}});
  await until(()=>!!release);expect(result.current.loading).toBeTrue();
  rerender({enabled:false});expect(result.current.loading).toBeFalse();expect(result.current.nodes).toEqual([]);expect(result.current.undo).toBeUndefined();expect(result.current.error).toBe('');
  await act(async()=>{release!(response([oldNode],{undo:undo()}));await Promise.resolve();});
  expect(result.current.loading).toBeFalse();expect(result.current.nodes).toEqual([]);expect(result.current.undo).toBeUndefined();
 });
 it('clears prior account content, errors and deletion undo immediately on account change',async()=>{
  let count=0,release:((value:Response)=>void)|undefined;spyOn(globalThis,'fetch').and.callFake(async()=>{count++;if(count===1)return response([oldNode],{undo:undo()});if(count===2)return new Response(JSON.stringify({error:'Old account history failed'}),{status:503});return new Promise<Response>(resolve=>{release=resolve;});});
  const {result,rerender}=renderHook(({id})=>useChessHistory(id,true),{initialProps:{id:1}});
  await until(()=>!!result.current.undo);await act(async()=>{await result.current.retry();});expect(result.current.error).toBe('Old account history failed');
  rerender({id:2});expect(result.current.nodes).toEqual([]);expect(result.current.undo).toBeUndefined();expect(result.current.error).toBe('');expect(result.current.loading).toBeTrue();
  await until(()=>!!release);await act(async()=>{release!(response([newNode]));});
  expect(result.current.nodes.map(n=>n.id)).toEqual(['new-history']);expect(result.current.loading).toBeFalse();expect(result.current.undo).toBeUndefined();
 });
 it('retries a failed history request without a page reload',async()=>{
  let count=0;spyOn(globalThis,'fetch').and.callFake(async()=>++count===1?new Response(JSON.stringify({error:'Library unavailable'}),{status:503}):response([newNode]));
  const {result}=renderHook(()=>useChessHistory(2,true));await until(()=>result.current.error==='Library unavailable');
  await act(async()=>{await result.current.retry();});expect(count).toBe(2);expect(result.current.nodes.map(n=>n.id)).toEqual(['new-history']);expect(result.current.error).toBe('');expect(result.current.loading).toBeFalse();
 });
 it('ignores an old account restore failure after a new account has loaded',async()=>{
  let count=0,release:((value:Response)=>void)|undefined;spyOn(globalThis,'fetch').and.callFake(async url=>String(url).includes('/_api/library')?new Promise<Response>(resolve=>{release=resolve;}):response([++count===1?oldNode:newNode],{undo:undo()}));
  const {result,rerender}=renderHook(({id})=>useChessHistory(id,true),{initialProps:{id:1}});await until(()=>!!result.current.undo);
  let saving:Promise<void>|undefined;act(()=>{saving=result.current.restore();});await until(()=>!!release);rerender({id:2});await until(()=>result.current.nodes[0]?.id==='new-history');
  await act(async()=>{release!(new Response(JSON.stringify({error:'Previous restore failed'}),{status:503}));await saving;});expect(result.current.error).toBe('');expect(result.current.undo).toBeDefined();expect(result.current.nodes[0]?.id).toBe('new-history');
 });
});
