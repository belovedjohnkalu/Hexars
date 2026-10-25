import type { CloudNode } from '../endpoints/cloud_POST.schema';
// Remembered-account entries are capabilities of this browser, not account
// content. Older dev edits may have persisted those generated entries in the
// synced Accounts workspace. Never let that snapshot recreate another device's
// account list, labels, actions, or child entries.
export function accountDeviceNodes(seeds:CloudNode[],stored:CloudNode[]):CloudNode[]{
 const current=new Map(seeds.map(n=>[n.id,n])),byId=new Map(stored.map(n=>[n.id,n]));
 const visible=(node:CloudNode)=>{
  let item:CloudNode|undefined=node;const seen=new Set<string>();
  while(item&&!seen.has(item.id)){
   seen.add(item.id);
   if((item.id.startsWith('remembered-')||item.id.startsWith('account-')||item.accountAction)&&!current.has(item.id))return false;
   item=item.parentId?byId.get(item.parentId):undefined;
  }
  return true;
 };
 return [...new Map([...seeds,...stored.filter(visible).map(n=>{
  const generated=current.get(n.id);
  return generated&&(generated.accountAction||n.id==='account-others'||n.id.startsWith('remembered-'))?{...generated,...n,id:generated.id,parentId:generated.parentId,destination:generated.destination,accountAction:generated.accountAction,...(generated.accountAction?{removedBy:undefined,removedAt:undefined}:{})}:n;
 })].map(n=>[n.id,n])).values()];
}
