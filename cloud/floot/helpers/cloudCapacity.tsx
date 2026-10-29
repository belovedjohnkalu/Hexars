import type { CloudNode } from '../endpoints/cloud_POST.schema';
export const MAX_DROPLETS=1024;
function counts(nodes:CloudNode[]){const result=new Map<string,number>();for(const n of new Map(nodes.map(n=>[n.id,n])).values())if(!n.removedBy&&n.parentId)result.set(n.parentId,(result.get(n.parentId)||0)+1);return result;}
export function assertCloudCapacity(before:CloudNode[],after:CloudNode[],isDev=false){if(isDev)return;const previous=counts(before);for(const [parent,total] of counts(after))if(total>MAX_DROPLETS&&total>(previous.get(parent)||0))throw Object.assign(new Error('This cloud is full. Add inside another cloud.'),{status:422});}
