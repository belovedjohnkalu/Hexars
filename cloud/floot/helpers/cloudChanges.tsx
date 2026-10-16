import type { CloudNode, InputType } from "../endpoints/cloud_POST.schema";
type Change = Extract<InputType, {action:"rename"|"remove"|"restore"}>;
const fail=(message:string,status:number):never=>{throw Object.assign(new Error(message),{status});};
function apply(nodes:CloudNode[],input:Change,currentVersion:number) {
  if(input.action==="restore") {
    const group=nodes.filter(n=>n.removedBy===input.operationId);
    if(!group.length)return nodes; // A lost response can be retried safely.
    if(input.version!==currentVersion)return fail("Your space changed. Try again.",409);
    const ids=new Set(group.map(n=>n.id));
    if(group.some(n=>n.parentId&&nodes.some(p=>p.id===n.parentId&&p.removedBy&&!ids.has(p.id))))
      return fail("Restore the parent cloud first.",409);
    return nodes.map(n=>ids.has(n.id)?{...n,removedBy:undefined,removedAt:undefined}:n);
  }
  const node=nodes.find(n=>n.id===input.id);
  if(input.action==="remove"&&node?.removedBy===input.operationId)return nodes;
  if(!node||node.removedBy)return fail("This cloud is no longer here.",404);
  if(input.action==="rename"&&node.name===input.name)return nodes;
  if(input.version!==currentVersion)return fail("Your space changed. Try again.",409);
  if(input.action==="rename")return nodes.map(n=>n.id===input.id?{...n,name:input.name}:n);
  const ids=new Set([input.id]);
  let grew=true;
  while(grew){grew=false;for(const n of nodes)if(!n.removedBy&&n.parentId&&ids.has(n.parentId)&&!ids.has(n.id)){ids.add(n.id);grew=true;}}
  if(ids.size-1!==input.expectedCount)return fail("This cloud changed. Check what’s inside before removing it.",409);
  const removedAt=new Date().toISOString();
  return nodes.map(n=>ids.has(n.id)?{...n,removedBy:input.operationId,removedAt}:n);
}
function undo(nodes:CloudNode[]) {
  const latest=nodes.filter(n=>n.removedBy).sort((a,b)=>(b.removedAt||"").localeCompare(a.removedAt||""))[0];
  if(!latest?.removedBy)return undefined;
  const group=nodes.filter(n=>n.removedBy===latest.removedBy),ids=new Set(group.map(n=>n.id));
  const root=group.find(n=>!n.parentId||!ids.has(n.parentId))||latest;
  return {operationId:latest.removedBy,name:root.name,parentId:root.parentId,count:group.length};
}
export const cloudChanges={apply,undo};
