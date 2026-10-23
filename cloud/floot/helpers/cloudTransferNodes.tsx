import type { CloudNode } from '../endpoints/cloud_POST.schema';
// Moving keeps original authorship. Duplicating adds new words for the copier.
export function cloudTransferNodes(group:CloudNode[],ids:Map<string,string>,rootId:string,parentId:string,operationId:string,userId:number,copy:boolean):CloudNode[]{
 return group.map(n=>({...n,id:ids.get(n.id)!,parentId:n.id===rootId?parentId:ids.get(n.parentId!)!,createdBy:copy?userId:n.createdBy??userId,canEdit:undefined,copyOperation:operationId}));
}
