import type {CloudNode} from '../endpoints/cloud_POST.schema';
// Rank by the current branch, then nearby branches. Names and ILs remain
// searchable; this ordering is a suggestion, never an authorization decision.
export function nearbyDestinations(nodes:CloudNode[],source:CloudNode,{cross=false,dev=false,query=''}:{cross?:boolean;dev?:boolean;query?:string}={}){
 const byId=new Map(nodes.map(n=>[n.id,n])),paths=new Map<string,string[]>();
 const path=(id:string|null):string[]=>{
  if(!id)return[];const cached=paths.get(id);if(cached)return cached;
  const result:string[]=[],seen=new Set<string>();let current=byId.get(id);
  while(current&&!seen.has(current.id)){seen.add(current.id);result.unshift(current.id);current=current.parentId?byId.get(current.parentId):undefined;}
  paths.set(id,result);return result;
 };
 const origin=cross?[]:path(source.parentId),needle=query.trim().toLocaleLowerCase();
 const distance=(n:CloudNode)=>{const p=path(n.id);let common=0;while(common<origin.length&&common<p.length&&origin[common]===p[common])common++;return origin.length+p.length-2*common;};
 return nodes.filter(n=>!n.removedBy&&!n.destination&&(n.id!=='hexagonal-chess'||dev)&&n.id!==source.id&&(cross||!path(n.id).includes(source.id))&&(!needle||(n.name+' '+(n.identifier||'')).toLocaleLowerCase().includes(needle))).map((n,index)=>({n,index,distance:distance(n)})).sort((a,b)=>a.distance-b.distance||a.index-b.index).map(n=>n.n);
}
