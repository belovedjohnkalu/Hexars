import { cloudChanges } from "./cloudChanges";
import { cloudTree } from "./cloudTree";
import type { CloudNode } from "../endpoints/cloud_POST.schema";
describe("Moving and copying clouds",()=>{
 const credentials={workspaceId:"123e4567-e89b-42d3-a456-426614174000",accessToken:"a".repeat(64)},op="123e4567-e89b-42d3-a456-426614174001";
 const nodes:CloudNode[]=[{id:"a",name:"A",parentId:null},{id:"b",name:"B",parentId:"a",imageKey:"private-picture"},{id:"c",name:"C",parentId:"b"},{id:"d",name:"D",parentId:null}];
 it("moves a whole branch without changing descendants",()=>{const next=cloudChanges.apply(nodes,{...credentials,action:"move",id:"a",parentId:"d",version:0},0);expect(next[0].parentId).toBe("d");expect(next[2]).toBe(nodes[2]);expect(cloudTree.descendants(next,"d")).toBe(3);});
 it("rejects moving or copying inside the source branch",()=>{for(const action of ['move','copy'] as const)expect(()=>cloudChanges.apply(nodes,{...credentials,action,id:"a",parentId:"c",operationId:op,version:0},0)).toThrowError(/outside/);});
 it("copies descendants with new identities, preserving pictures and retry safety",()=>{const request={...credentials,action:'copy' as const,id:'a',parentId:'d',operationId:op,version:0};const next=cloudChanges.apply(nodes,request,0),copy=next.find(n=>n.id===op)!;expect(copy.parentId).toBe('d');const children=next.filter(n=>n.copyOperation===op);expect(children.length).toBe(3);expect(children.some(n=>n.id==='b')).toBeFalse();expect(children.find(n=>n.name==='B')?.imageKey).toBe('private-picture');expect(cloudChanges.apply(next,request,1)).toBe(next);expect(cloudTree.descendants(next,op)).toBe(2);});
 it("rejects missing destinations and identity collisions",()=>{expect(()=>cloudChanges.apply(nodes,{...credentials,action:'move',id:'a',parentId:'missing',version:0},0)).toThrowError(/existing/);expect(()=>cloudChanges.apply(nodes,{...credentials,action:'copy',id:'a',parentId:'d',operationId:'b',version:0},0)).toThrowError(/operation/);});
 it("counts a deeply nested space without a fixed depth or item cap",()=>{const deep=Array.from({length:5000},(_,i)=>({id:String(i),parentId:i?String(i-1):null,name:'Word'}));expect(cloudTree.sizes(deep,null)[0].count).toBe(4999);});
 it("edits default entries without duplicating or freezing the rest of the navigation",()=>{
 const seeds=[{id:'built-in',parentId:null,name:'Default'},{id:'child',parentId:'built-in',name:'Child'}];
 const renamed=cloudChanges.apply([],{...credentials,action:'rename',id:'built-in',name:'My cloud',version:0},0,seeds);expect(renamed.length).toBe(1);expect(renamed[0].name).toBe('My cloud');
 const removed=cloudChanges.apply(renamed,{...credentials,action:'remove',id:'built-in',expectedCount:1,operationId:op,version:1},1,seeds);expect(removed.filter(n=>n.removedBy).length).toBe(2);
 const restored=cloudChanges.apply(removed,{...credentials,action:'restore',operationId:op,version:2},2,seeds);expect(restored.some(n=>n.removedBy)).toBeFalse();expect(restored.find(n=>n.id==='built-in')?.name).toBe('My cloud');
 });
});
