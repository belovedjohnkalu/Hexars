import type {CloudNode} from '../endpoints/cloud_POST.schema';
// Exact, case-sensitive words within one direct parent. Existing duplicates are
// left intact; a mutation cannot create or enlarge a duplicate group.
export function uniqueCloudNames(before:CloudNode[],after:CloudNode[],isDev=false){
 if(isDev)return;
 const old=new Map(before.map(n=>[n.id,n])),groups=new Map<string,CloudNode[]>();
 for(const node of new Map(after.map(n=>[n.id,n])).values()){if(node.removedBy||!node.name.trim())continue;const key=JSON.stringify([node.parentId,node.name.trim().normalize('NFC')]);const list=groups.get(key)||[];list.push(node);groups.set(key,list);}
 for(const list of groups.values())if(list.length>1&&list.some(n=>{const prior=old.get(n.id);return !prior||!!prior.removedBy||prior.parentId!==n.parentId||prior.name.trim().normalize('NFC')!==n.name.trim().normalize('NFC');}))throw Object.assign(new Error('These words are already here. Change the words or choose another cloud.'),{status:422,code:'DUPLICATE_CLOUD'});
}
