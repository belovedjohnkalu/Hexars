import { renderHook,act,waitFor,cleanup } from '@testing-library/react';
import superjson from 'superjson';
import { useCloudGame } from './useCloudGame';
import type { OutputType } from '../endpoints/game_POST.schema';
describe('Engine side switching',()=>{
 const token='a'.repeat(64),id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 const initial=():OutputType=>({gameId:id,accessToken:token,version:0,mode:'engine',difficulty:3,humanPlayer:0,engine:'Tactical',execution:'cloud',moves:[],lastSearch:null,game:{variant:'glinski',stateId:'kept-position',activePlayer:0,ply:0,check:false,board:{variant:'glinski',stage:'game',players:[0,1],cells:[]},legalMoves:[],result:{status:'ongoing',reason:'',winner:-1,scores:[.5,.5]}}});
 const until=(check:()=>boolean)=>waitFor(()=>{if(!check())throw Error('Waiting for side switch');});
 afterEach(()=>{cleanup();window.history.replaceState(null,'','#');localStorage.clear();});
 it('saves each explicit side and lets Tactical play the newly assigned turn',async()=>{
  let value=initial(),switches:number[]=[];window.history.replaceState(null,'','#game='+id+'&key='+token);
  spyOn(globalThis,'fetch').and.callFake(async(_url,init)=>{const input=superjson.parse<any>(String(init?.body));if(input.action==='switch_side'){switches.push(input.humanPlayer);value={...value,humanPlayer:input.humanPlayer,version:value.version+1};}else if(input.action==='engine'){value={...value,version:value.version+1,game:{...value.game,activePlayer:value.humanPlayer,ply:value.game.ply+1}};}return new Response(superjson.stringify(value),{status:200});});
  const {result}=renderHook(()=>useCloudGame('glinski','engine'));await until(()=>!!result.current.data&&!result.current.busy);
  act(()=>result.current.switchSide());await until(()=>result.current.data?.humanPlayer===1&&result.current.data.game.activePlayer===1&&!result.current.busy&&!result.current.switchingSide);
  expect(result.current.data?.gameId).toBe(id);expect(result.current.data?.game.stateId).toBe('kept-position');
  act(()=>result.current.switchSide());await until(()=>result.current.data?.humanPlayer===0&&result.current.data.game.activePlayer===0&&!result.current.busy&&!result.current.switchingSide);expect(switches).toEqual([1,0]);
 });
 it('queues repeated flips while a save is busy and preserves their parity',async()=>{
  let value=initial(),release:(()=>void)|undefined;const switches:number[]=[];window.history.replaceState(null,'','#game='+id+'&key='+token);
  spyOn(globalThis,'fetch').and.callFake(async(_url,init)=>{const input=superjson.parse<any>(String(init?.body));if(input.action==='switch_side'){switches.push(input.humanPlayer);if(switches.length===1)await new Promise<void>(resolve=>{release=resolve;});value={...value,humanPlayer:input.humanPlayer,version:value.version+1};}else if(input.action==='engine')throw Error('Queued flips must finish before engine search');return new Response(superjson.stringify(value),{status:200});});
  const {result}=renderHook(()=>useCloudGame('glinski','engine'));await until(()=>!!result.current.data&&!result.current.busy);act(()=>result.current.switchSide());await until(()=>!!release);act(()=>result.current.switchSide());await act(async()=>release!());await until(()=>result.current.data?.humanPlayer===0&&!result.current.busy&&!result.current.switchingSide);expect(switches).toEqual([1,0]);expect(result.current.data?.game.ply).toBe(0);
 });
});
