import { renderHook, act, waitFor, cleanup } from "@testing-library/react";
import { useCloudSpace } from "./useCloudSpace";
import { RealtimeClient } from "./RealtimeClient";
import { cloudTree } from "./cloudTree";
describe("Cloud refresh concurrency", () => {
  afterEach(cleanup);
  it("does not fetch or reset authentication for a signed-out Private view",async()=>{const fetchSpy=spyOn(globalThis,"fetch");const hook=renderHook(()=>useCloudSpace(null,false,'private'));await waitFor(()=>expect(hook.result.current.ready).toBeTrue());expect(hook.result.current.error).toBe('');expect(hook.result.current.canAdd).toBeFalse();expect(fetchSpy).not.toHaveBeenCalled();});
  it("keeps a saved word when an older background read arrives late", async () => {
    spyOn(RealtimeClient.prototype,"connect").and.resolveTo();
    localStorage.removeItem("ion.private-space.v1");
    let release: ((value: Response) => void) | undefined;
    let reads=0;
    const response=(version:number, extra=false)=>new Response(JSON.stringify({version,nodes:[...cloudTree.seed,...(extra?[{id:"test-node",parentId:null,name:"Saved thought"}]:[])]}),{status:200});
    spyOn(globalThis,"fetch").and.callFake(async (_url,init)=>{
      const input=JSON.parse(String(init?.body));
      if(input.action==="load"){
        if(++reads===1)return response(0);
        return new Promise<Response>(resolve=>{release=resolve;});
      }
      return response(1,true);
    });
    const hook=renderHook(()=>useCloudSpace(42));
    await waitFor(()=>{if(hook.result.current.loading)throw new Error("Still opening");});
    act(()=>{window.dispatchEvent(new window.Event("focus"));});
    await waitFor(()=>{if(!release)throw new Error("Read not started");});
    await act(async()=>{await hook.result.current.add({id:"123e4567-e89b-42d3-a456-426614174000",name:"Saved thought",parentId:null});});
    await act(async()=>{release!(response(0));});
    expect(hook.result.current.version).toBe(1);
    expect(hook.result.current.nodes.some(n=>n.name==="Saved thought")).toBeTrue();
  });
});
