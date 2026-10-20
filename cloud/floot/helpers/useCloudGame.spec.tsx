import { renderHook, act, waitFor, cleanup } from "@testing-library/react";
import superjson from "superjson";
import { useCloudGame } from "./useCloudGame";
import type { OutputType } from "../endpoints/game_POST.schema";

describe("Saved game link changes",()=>{
  const a="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",b="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",token="a".repeat(64);
  const game=(gameId:string):OutputType=>({gameId,accessToken:token,version:0,mode:"two_players",difficulty:3,humanPlayer:0,engine:"Tactical 0.7",execution:"cloud",moves:[],lastSearch:null,game:{variant:"shafran",stateId:gameId,activePlayer:0,ply:0,check:false,board:{variant:"shafran",stage:"playable",players:[0,1],cells:[]},legalMoves:[],result:{status:"ongoing",reason:"",winner:-1,scores:[]}}});
  const response=(id:string)=>new Response(superjson.stringify(game(id)),{status:200});
  function link(id:string){window.history.replaceState(null,"","#"+new URLSearchParams({game:id,key:token}));window.dispatchEvent(new HashChangeEvent("hashchange"));}
  const until=(predicate:()=>boolean)=>waitFor(()=>{if(!predicate())throw new Error("Waiting for hook state");});
  afterEach(()=>{cleanup();window.history.replaceState(null,"","#");localStorage.clear();});
  it("opens a different game on the same variant without a page reload",async()=>{
    link(a);spyOn(globalThis,"fetch").and.callFake(async(_url,init)=>response(JSON.parse(String(init?.body)).json.gameId));
    const {result}=renderHook(()=>useCloudGame("shafran","two_players"));
    await until(()=>result.current.data?.gameId===a);
    act(()=>{link(b);window.dispatchEvent(new PopStateEvent("popstate"));});await until(()=>result.current.data?.gameId===b);
    expect(result.current.error).toBeNull();
  });
  it("ignores the old link response when it arrives after a new link",async()=>{
    let release:((value:Response)=>void)|undefined;
    link(a);spyOn(globalThis,"fetch").and.callFake(async(_url,init)=>{
      const input=JSON.parse(String(init?.body)).json;
      return input.gameId===a?new Promise<Response>(resolve=>{release=resolve;}):response(b);
    });
    const {result}=renderHook(()=>useCloudGame("shafran","two_players"));
    await until(()=>!!release);
    act(()=>{link(b);window.dispatchEvent(new PopStateEvent("popstate"));});await until(()=>result.current.data?.gameId===b);
    await act(async()=>{release!(response(a));await new Promise(resolve=>setTimeout(resolve,10));});
    expect(result.current.data?.gameId).toBe(b);
  });
  it("shows a native preview while saving and rolls it back after failure",async()=>{
    const initial=game(a),move={from:{q:0,r:0},to:{q:0,r:1},changes:[{q:0,r:0,piece:null},{q:0,r:1,piece:{type:"pawn" as const,player:0}}]};
    initial.game.legalMoves=[move];let fail:((value:Response)=>void)|undefined;
    link(a);spyOn(globalThis,"fetch").and.callFake(async(_url,init)=>{
      const input=JSON.parse(String(init?.body)).json;
      return input.action==='move'?new Promise<Response>(resolve=>{fail=resolve;}):new Response(superjson.stringify(initial),{status:200});
    });
    const {result}=renderHook(()=>useCloudGame("shafran","two_players"));await until(()=>result.current.data?.gameId===a);
    let saved:Promise<boolean>|undefined;act(()=>{saved=result.current.play({from:move.from,to:move.to});});
    await until(()=>!!result.current.pendingMove);expect(result.current.data?.game.ply).toBe(0);
    await act(async()=>{fail!(new Response(superjson.stringify({error:"Temporary failure"}),{status:503}));await saved;});
    expect(result.current.pendingMove).toBeNull();expect(result.current.data?.game.stateId).toBe(a);expect(result.current.error).not.toBeNull();
  });

  it("resets a linked Defensive game using its saved engine and level",async()=>{
    const initial={...game(a),mode:"engine",engineId:"defensive" as const,difficulty:4,engine:"Defensive 1.0.0"};
    const requests:Array<Record<string,unknown>>=[];
    link(a);spyOn(globalThis,"fetch").and.callFake(async(_url,init)=>{
      requests.push(JSON.parse(String(init?.body)).json);
      return new Response(superjson.stringify(initial),{status:200});
    });
    const {result}=renderHook(()=>useCloudGame("shafran","engine",3,"tactical"));
    await until(()=>result.current.data?.gameId===a);
    await act(async()=>{await result.current.newGame("engine",0,"shafran");});
    expect(requests.find(r=>r.action==='new')).toEqual(jasmine.objectContaining({engineId:'defensive',difficulty:4}));
  });

});
