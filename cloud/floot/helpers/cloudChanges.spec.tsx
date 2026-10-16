import { cloudChanges } from "./cloudChanges";
import type { CloudNode } from "../endpoints/cloud_POST.schema";
describe("Cloud correction and recovery",()=>{
  const credentials={workspaceId:"123e4567-e89b-42d3-a456-426614174000",accessToken:"a".repeat(64)},op="123e4567-e89b-42d3-a456-426614174001";
  const initial:CloudNode[]=[{id:"a",parentId:null,name:"A"},{id:"b",parentId:"a",name:"B"},{id:"c",parentId:"b",name:"C"},{id:"d",parentId:null,name:"D"}];
  it("renames one item and leaves the input immutable",()=>{const result=cloudChanges.apply(initial,{...credentials,action:"rename",id:"b",name:"New",version:0},0);expect(result[1].name).toBe("New");expect(initial[1].name).toBe("B");});
  it("removes a whole branch and keeps unrelated siblings",()=>{
    const result=cloudChanges.apply(initial,{...credentials,action:"remove",id:"a",operationId:op,expectedCount:2,version:0},0);
    expect(result.filter(n=>n.removedBy).map(n=>n.id)).toEqual(["a","b","c"]);
    expect(result[3].removedBy).toBeUndefined();
    expect(cloudChanges.undo(result)?.name).toBe("A");
    const restored=cloudChanges.apply(result,{...credentials,action:"restore",operationId:op,version:1},1);
    expect(restored.some(n=>n.removedBy)).toBeFalse();
    expect(restored.map(n=>n.parentId)).toEqual(initial.map(n=>n.parentId));
  });
  it("rejects stale writes and changed contents before removing",()=>{
    expect(()=>cloudChanges.apply(initial,{...credentials,action:"remove",id:"a",operationId:op,expectedCount:1,version:0},0)).toThrowError(/changed/);
    expect(()=>cloudChanges.apply(initial,{...credentials,action:"rename",id:"a",name:"New",version:0},1)).toThrowError(/changed/);
    expect(()=>cloudChanges.apply(initial,{...credentials,action:"remove",id:"hexagonal-chess",operationId:op,expectedCount:0,version:0},0)).toThrowError(/no longer/);
  });
  it("retries removal and restoration without duplicating changes",()=>{
    const request={...credentials,action:"remove" as const,id:"a",operationId:op,expectedCount:2,version:0};
    const removed=cloudChanges.apply(initial,request,0);
    expect(cloudChanges.apply(removed,request,1)).toBe(removed);
    const restored=cloudChanges.apply(removed,{...credentials,action:"restore",operationId:op,version:1},1);
    expect(cloudChanges.apply(restored,{...credentials,action:"restore",operationId:op,version:1},2)).toBe(restored);
  });
  it("does not restore a child under a still removed parent",()=>{
    const nodes:CloudNode[]=[{...initial[0],removedBy:"parent",removedAt:"2026-10-16"},{...initial[1],removedBy:"child",removedAt:"2026-10-15"}];
    expect(()=>cloudChanges.apply(nodes,{...credentials,action:"restore",operationId:"child",version:0},0)).toThrowError(/parent/);
  });
});
