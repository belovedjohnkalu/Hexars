import { unusedColor,colorHex } from "./cloudColors";
import { randomUUID } from "node:crypto";
import type { CloudNode, InputType } from "../endpoints/cloud_POST.schema";
type Change = Extract<InputType, {action:"update"|"rename"|"remove"|"restore"|"move"|"copy"|"link"}>;
const fail=(message:string,status:number):never=>{throw Object.assign(new Error(message),{status});};
function applyAll(nodes:CloudNode[],input:Change,currentVersion:number,seeds:CloudNode[]=[],verifiedImages:string[]=[]) {
  if(input.action==="restore") {
    const group=nodes.filter(n=>n.removedBy===input.operationId);
    if(!group.length)return nodes; // A lost response can be retried safely.
    if(input.version!==currentVersion)return fail("Your space changed. Try again.",409);
    const ids=new Set(group.map(n=>n.id));
    if(group.some(n=>n.parentId&&nodes.some(p=>p.id===n.parentId&&p.removedBy&&!ids.has(p.id))))
      return fail("Restore the parent cloud first.",409);
    const promoted=nodes.filter(n=>n.promotedBy===input.operationId);
    for(const child of promoted){const parent=group.find(n=>n.id===child.promotedFrom);if(!parent||child.parentId!==parent.parentId)return fail("A kept child moved. Move it back before undoing.",409);}
    return nodes.map(n=>ids.has(n.id)?{...n,removedBy:undefined,removedAt:undefined}:n.promotedBy===input.operationId?{...n,parentId:n.promotedFrom!,promotedBy:undefined,promotedFrom:undefined}:n);
  }
  if(input.action==="copy"&&nodes.some(n=>n.copyOperation===input.operationId))return nodes;
  const node=nodes.find(n=>n.id===input.id);
  if(input.action==="remove"&&node?.removedBy===input.operationId)return nodes;
  if(!node||node.removedBy)return fail("This cloud is no longer here.",404);
  if(input.action==='link'){
    if(input.version!==currentVersion)return fail('Your space changed. Try again.',409);
    const words=input.words?[...new Set(input.words)].sort((a,b)=>a-b):undefined,count=node.name.match(/\S+/g)?.length||0;
    if(words&&(!words.length||words.some(n=>n>=count)))return fail('Choose words from this cloud.',400);
    return nodes.map(n=>n.id===input.id?{...n,redirect:input.target&&!words?input.target:undefined,wordRedirect:input.target&&words?{words,target:input.target}:undefined}:n);
  }
  if(input.action==='update'){
    if(input.version!==currentVersion)return fail('Your space changed. Try again.',409);
    return nodes.map(n=>n.id===input.id?{...n,name:input.name,...(input.color?{color:input.color}:{}),...(input.note!==undefined?{note:input.note??undefined}:{}),...(n.name!==input.name?{wordRedirect:undefined}:{}),...(input.photoMode!=='keep'?{imageKey:undefined,imageUrl:undefined,imageUrls:undefined,imageKeys:input.photoMode==='replace'?verifiedImages:undefined,isImage:input.photoMode==='replace'}:{}),contentEdits:[...new Set([...(n.contentEdits||[]),'name' as const,...(input.color?['color' as const]:[]),...(input.note!==undefined?['note' as const]:[]),...(input.photoMode!=='keep'?['images' as const]:[])])]}:n);
  }
  if(input.action==="rename"&&node.name===input.name&&(!input.color||node.color===input.color))return nodes;
  if(input.action==="move"&&node.parentId===input.parentId)return nodes;
  if(input.action==="copy"&&nodes.some(n=>n.id===input.operationId))return fail("Choose a new copy operation.",409);
  if(input.version!==currentVersion)return fail("Your space changed. Try again.",409);
  if(input.action==="rename")return nodes.map(n=>n.id===input.id?{...n,name:input.name,contentEdits:[...new Set([...(n.contentEdits||[]),'name' as const,...(input.color?['color' as const]:[])])],...(n.name!==input.name?{wordRedirect:undefined}:{}),...(input.color&&colorHex(input.color)!==colorHex(n.color)?{color:unusedColor(input.color,nodes.filter(other=>other.id!==n.id&&!other.removedBy&&other.parentId===n.parentId).map(other=>other.color))}:{})}:n);
  const ids=new Set([input.id]);
  let grew=true;
  while(grew){grew=false;for(const n of nodes)if(!n.removedBy&&n.parentId&&ids.has(n.parentId)&&!ids.has(n.id)){ids.add(n.id);grew=true;}}
  if(input.action==="remove"&&ids.size-1!==input.expectedCount)return fail("This cloud changed. Check what’s inside before removing it.",409);
  if(input.action==="move"||input.action==="copy"){
    if(input.parentId!==null&&![...seeds,...nodes].some(n=>n.id===input.parentId&&!n.removedBy&&!n.destination))return fail("Choose an existing cloud.",400);
    if(input.parentId&&ids.has(input.parentId))return fail("Choose a cloud outside this branch.",400);
    if(input.action==="move")return node.parentId===input.parentId?nodes:nodes.map(n=>n.id===input.id?{...n,parentId:input.parentId}:n);
    const mapping=new Map([...ids].map(id=>[id,id===input.id?input.operationId:randomUUID()]));
    return [...nodes,...nodes.filter(n=>ids.has(n.id)).map(n=>({...n,id:mapping.get(n.id)!,parentId:n.id===input.id?input.parentId:mapping.get(n.parentId!)!,copyOperation:input.operationId,promotedBy:undefined,promotedFrom:undefined}))];
  }
  const removedAt=new Date().toISOString();
  if(input.action==='remove'&&input.keepChildren){
    return nodes.map(n=>n.id===input.id?{...n,removedBy:input.operationId,removedAt}:!n.removedBy&&n.parentId===input.id?{...n,parentId:node.parentId,promotedBy:input.operationId,promotedFrom:input.id}:n);
  }
  return nodes.map(n=>ids.has(n.id)?{...n,removedBy:input.operationId,removedAt}:n);
}
function undo(nodes:CloudNode[]) {
  const latest=nodes.filter(n=>n.removedBy).sort((a,b)=>(b.removedAt||"").localeCompare(a.removedAt||""))[0];
  if(!latest?.removedBy)return undefined;
  const expiresAt=Date.parse(latest.removedAt||'')+10000;if(!Number.isFinite(expiresAt)||expiresAt<=Date.now())return undefined;
  const group=nodes.filter(n=>n.removedBy===latest.removedBy),ids=new Set(group.map(n=>n.id));
  const root=group.find(n=>!n.parentId||!ids.has(n.parentId))||latest;
  return {operationId:latest.removedBy,name:root.name,parentId:root.parentId,count:group.length,expiresAt};
}
function apply(stored:CloudNode[],input:Change,currentVersion:number,seeds:CloudNode[]=[],verifiedImages:string[]=[]){
 if(!seeds.length)return applyAll(stored,input,currentVersion,[],verifiedImages);
 const defaults=new Map(seeds.map(n=>[n.id,n])),merged=[...new Map([...seeds,...stored].map(n=>[n.id,n])).values()];
 const next=applyAll(merged,input,currentVersion,seeds,verifiedImages);if(next===merged)return stored;
 // Persist only custom records and deliberate overrides; untouched defaults keep evolving.
 return next.filter(n=>!defaults.has(n.id)||JSON.stringify(n)!==JSON.stringify(defaults.get(n.id)));
}
export const cloudChanges={apply,undo};
