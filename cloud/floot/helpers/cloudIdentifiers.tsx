import type { CloudNode } from '../endpoints/cloud_POST.schema';
export type IdentifierRecord={nodeId:string;parentId:string|null;label:string;arrivalOrdinal:string};
export const rootIdentifiers:Record<string,string>={'hexagonal-chess':'IL0',public:'IL1',private:'IL2',controls:'IL3',accounts:'IL4'};
// Zero-based segments: 0..9, A0..Z9, AA0..ZZ9, AAA0..ZZZ9. A digit closes each
// segment, so nested paths remain distinct without placeholder zeros.
export function identifierSegment(ordinal:number):string{
 if(!Number.isSafeInteger(ordinal)||ordinal<0)throw new Error('Invalid cloud arrival number.');
 let group=Math.floor(ordinal/10),prefix='';
 while(group>0){group--;prefix=String.fromCharCode(65+group%26)+prefix;group=Math.floor(group/26);}
 return prefix+String(ordinal%10);
}
export function allocateIdentifiers(nodes:Pick<CloudNode,'id'|'parentId'>[],existing:IdentifierRecord[],nextByParent:Map<string,number>){
 const records=new Map(existing.map(n=>[n.nodeId,n])),byId=new Map(nodes.map(n=>[n.id,n])),added:IdentifierRecord[]=[],changed=new Map<string,number>();
 // Include removed rows too: a deletion never releases a number.
 for(const node of nodes){
  if(records.has(node.id))continue;
  const chain:typeof nodes=[],seen=new Set<string>();let current:typeof node|undefined=node;
  while(current&&!records.has(current.id)){
   if(seen.has(current.id))throw new Error('Cloud hierarchy contains a cycle.');seen.add(current.id);chain.push(current);current=current.parentId?byId.get(current.parentId):undefined;
  }
  for(const child of chain.reverse()){
   if(records.has(child.id))continue;
   if(!child.parentId||!records.has(child.parentId))continue;
   const ordinal=nextByParent.get(child.parentId)??0,parent=records.get(child.parentId)!;
   const record={nodeId:child.id,parentId:child.parentId,label:parent.label+identifierSegment(ordinal),arrivalOrdinal:String(ordinal)};
   records.set(child.id,record);added.push(record);nextByParent.set(child.parentId,ordinal+1);changed.set(child.parentId,ordinal+1);
  }
 }
 return {records,added,counters:changed};
}
export function identifierFootprint(identifier?:string){
 if(!identifier)return {width:0,height:0};
 const width=Math.min(120,Math.ceil(identifier.length*6.2));
 return {width:width+6,height:Math.ceil(identifier.length/Math.max(1,Math.floor(width/6.2)))*12};
}

// A move preserves identity across Public/Private; a copy creates a new branch.
export function transferNodeIds(nodes:Pick<CloudNode,'id'>[],rootId:string,operationId:string,copy:boolean,createId:()=>string){
 return new Map(nodes.map(node=>[node.id,copy?(node.id===rootId?operationId:createId()):node.id]));
}
