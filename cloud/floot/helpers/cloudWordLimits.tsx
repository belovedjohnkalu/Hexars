import type { CloudNode,CloudScope } from '../endpoints/cloud_POST.schema';
export const PICTURE_WORDS=1000;
export function pictureCount(node:Pick<CloudNode,'imageKeys'|'imageUrls'|'imageKey'|'imageUrl'|'isImage'>){return Math.max(node.imageKeys?.length||0,node.imageUrls?.length||0,node.imageKey||node.imageUrl||node.isImage?1:0);}
export const contentWords=(node:CloudNode)=>wordCount(node.name)+wordCount(node.note||'')+pictureCount(node)*PICTURE_WORDS;
export const wordCount=(name:string)=>name.trim().match(/\S+/gu)?.length??0;
function resolver(nodes:CloudNode[]){
 const byId=new Map(nodes.filter(n=>!n.removedBy).map(n=>[n.id,n])),depths=new Map<string,number>();
 return (parentId:string|null)=>{let node=parentId?byId.get(parentId):undefined;const path:string[]=[],seen=new Set<string>();
  while(node&&!depths.has(node.id)){if(seen.has(node.id))throw new Error('Choose a destination outside this branch.');seen.add(node.id);path.push(node.id);node=node.parentId?byId.get(node.parentId):undefined;}
  let depth=node?depths.get(node.id)!:-1;for(let i=path.length-1;i>=0;i--)depths.set(path[i],++depth);
  return 1n<<BigInt(parentId?depths.get(parentId)??0:0);
 };
}
export function cloudWordLimit(nodes:CloudNode[],parentId:string|null){return resolver(nodes)(parentId);}
export function assertCloudWordLimits(before:CloudNode[],after:CloudNode[],scope:CloudScope){
 if(scope!=='private'&&scope!=='public')return;
 const old=new Map(before.map(n=>[n.id,n])),previousLimit=resolver(before),nextLimit=resolver(after);
 for(const node of after){if(node.removedBy||!node.parentId)continue;const prior=old.get(node.id),limit=nextLimit(node.parentId);
  if(prior&&!prior.removedBy&&node.promotedBy&&node.promotedBy!==prior.promotedBy&&node.promotedFrom===prior.parentId&&after.some(parent=>parent.id===prior.parentId&&parent.removedBy===node.promotedBy)&&prior.name===node.name&&pictureCount(prior)===pictureCount(node))continue;
  if(prior&&!prior.removedBy&&prior.name===node.name&&pictureCount(prior)===pictureCount(node)&&prior.parentId===node.parentId){
   let ancestor=after.find(n=>n.id===node.parentId);const seen=new Set<string>();let promoted=false;
   while(ancestor&&!seen.has(ancestor.id)){seen.add(ancestor.id);if(ancestor.promotedBy&&ancestor.promotedBy!==old.get(ancestor.id)?.promotedBy){promoted=true;break;}ancestor=after.find(n=>n.id===ancestor!.parentId);}
   if(promoted)continue;
  }
  if(prior?.removedBy&&prior.parentId===node.parentId&&prior.name===node.name&&pictureCount(prior)===pictureCount(node))continue;
  if(prior&&!prior.removedBy&&prior.name===node.name&&pictureCount(prior)===pictureCount(node)&&previousLimit(prior.parentId)<=limit)continue;
  if(BigInt(wordCount(node.name)+pictureCount(node)*PICTURE_WORDS)>limit)throw Object.assign(new Error('Use up to '+limit+' '+(limit===1n?'word':'words')+' here.'),{status:422});
 }
}
