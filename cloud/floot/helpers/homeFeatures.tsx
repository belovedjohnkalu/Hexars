import type { CloudNode } from '../endpoints/cloud_POST.schema';
export const hiddenFeaturesId='home-hidden-features';
// Personal presentation only; IDs, contents and shared Home remain unchanged.
export function homeFeatures(nodes:CloudNode[],hidden:readonly string[],signedIn:boolean):CloudNode[]{
 const hiddenIds=new Set(hidden);
 return nodes.map(n=>n.parentId==='ion'&&n.id!==hiddenFeaturesId?{...n,homeFeature:true,canHide:signedIn,hiddenFeature:hiddenIds.has(n.id),parentId:hiddenIds.has(n.id)?hiddenFeaturesId:'ion'}:n);
}
